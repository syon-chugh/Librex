import chromadb
import ollama
import httpx
import json
import os
from pathlib import Path
from datetime import datetime

EMBED_MODEL = "nomic-embed-text"
OLLAMA_BASE_URL = "http://localhost:11434"

# Initialize persistent ChromaDB at ./chroma_db
chroma_client = chromadb.PersistentClient(path="./chroma_db")

METADATA_FILE = "./chroma_db/metadata.json"

def get_or_create_collection(library_name: str):
    """Get or create a ChromaDB collection for a library."""
    collection_name = library_name.lower().strip()
    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

def load_metadata() -> dict:
    """Load metadata.json or create empty dict."""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata(metadata: dict):
    """Save metadata dict to metadata.json."""
    os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)

def get_library_stats() -> list[dict]:
    """Get list of all indexed libraries with chunk counts."""
    collections = chroma_client.list_collections()
    metadata = load_metadata()
    
    stats = []
    for col in collections:
        stats.append({
            "name": col.name,
            "count": col.count(),
            "indexed_at": metadata.get(col.name, None)
        })
    return stats

def save_indexed_at(library_name: str):
    """Save current UTC timestamp for when library was indexed."""
    metadata = load_metadata()
    metadata[library_name.lower().strip()] = datetime.utcnow().isoformat()
    save_metadata(metadata)

MAX_TOKENS_PER_TEXT = 500   # nomic-embed-text sweet spot; truncate anything longer
MAX_TOKENS_PER_BATCH = 4000  # stay well under the 5461 hard limit

def _truncate_to_tokens(text: str, max_tokens: int) -> str:
    """Truncate text to approximately max_tokens using whitespace splitting."""
    # Rough approximation: 1 token ≈ 4 chars
    max_chars = max_tokens * 4
    return text[:max_chars] if len(text) > max_chars else text

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of text strings using nomic-embed-text via Ollama.
    Truncates long texts and uses dynamic batching to stay under token limits.
    Falls back to one-at-a-time if a batch still fails.
    """
    # Truncate each text first
    truncated = [_truncate_to_tokens(t, MAX_TOKENS_PER_TEXT) for t in texts]

    all_embeddings = []
    i = 0

    while i < len(truncated):
        # Build a batch whose estimated token total stays under the limit
        batch = []
        batch_tokens = 0

        while i < len(truncated):
            est_tokens = len(truncated[i]) // 4 + 1
            if batch and batch_tokens + est_tokens > MAX_TOKENS_PER_BATCH:
                break
            batch.append(truncated[i])
            batch_tokens += est_tokens
            i += 1

        try:
            response = ollama.embed(model=EMBED_MODEL, input=batch)
            all_embeddings.extend(response["embeddings"])
        except Exception as e:
            if len(batch) == 1:
                # Single text still fails — skip with zero vector
                print(f"[embedder] WARNING: Failed to embed single text ({len(batch[0])} chars): {e}")
                dim = 768  # nomic-embed-text dimension
                all_embeddings.append([0.0] * dim)
            else:
                # Retry each text individually
                print(f"[embedder] Batch of {len(batch)} failed, retrying one-by-one: {e}")
                for text in batch:
                    try:
                        resp = ollama.embed(model=EMBED_MODEL, input=[text])
                        all_embeddings.extend(resp["embeddings"])
                    except Exception as e2:
                        print(f"[embedder] WARNING: Skipping text ({len(text)} chars): {e2}")
                        all_embeddings.append([0.0] * 768)

    return all_embeddings

def embed_and_store(library_name: str, chunks: list[dict]) -> int:
    """
    Takes chunked docs, embeds with nomic-embed-text, stores in ChromaDB.
    Replaces any existing collection for the library (delete + recreate).
    Adds in batches to respect ChromaDB's max batch size of 5461.
    Returns total chunks stored.
    """
    col_name = library_name.lower().strip()
    # Delete old collection so re-indexing replaces stale data
    try:
        chroma_client.delete_collection(col_name)
        print(f"[embedder] Deleted old collection '{col_name}'")
    except Exception:
        pass  # Collection didn't exist — that's fine
    collection = chroma_client.get_or_create_collection(
        name=col_name,
        metadata={"hnsw:space": "cosine"}
    )

    ids = [chunk["id"] for chunk in chunks]
    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    # Embed all texts (handles truncation + dynamic batching internally)
    embeddings = embed_texts(texts)

    # Store in ChromaDB in safe batches
    CHROMA_BATCH = 500
    total_stored = 0
    for i in range(0, len(chunks), CHROMA_BATCH):
        collection.add(
            ids=ids[i:i+CHROMA_BATCH],
            embeddings=embeddings[i:i+CHROMA_BATCH],
            documents=texts[i:i+CHROMA_BATCH],
            metadatas=metadatas[i:i+CHROMA_BATCH]
        )
        total_stored += len(ids[i:i+CHROMA_BATCH])
        print(f"[embedder] Stored {total_stored}/{len(chunks)} chunks...")

    save_indexed_at(library_name)
    return total_stored

def check_ollama_running() -> bool:
    """Check if Ollama is running and nomic-embed-text is available."""
    try:
        response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        models = [m["name"] for m in response.json().get("models", [])]
        return any("nomic-embed-text" in m for m in models)
    except Exception:
        return False

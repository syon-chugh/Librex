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

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of text strings using nomic-embed-text via Ollama.
    Batches into groups of 50 to avoid memory issues.
    """
    all_embeddings = []
    batch_size = 50
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = ollama.embed(model=EMBED_MODEL, input=batch)
        all_embeddings.extend(response["embeddings"])
    
    return all_embeddings

def embed_and_store(library_name: str, chunks: list[dict]) -> int:
    """
    Takes chunked docs, embeds with nomic-embed-text, stores in ChromaDB.
    Returns total chunks stored.
    """
    collection = get_or_create_collection(library_name)
    
    ids = [chunk["id"] for chunk in chunks]
    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]
    
    # Embed in batches
    embeddings = embed_texts(texts)
    
    # Store in ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas
    )
    
    save_indexed_at(library_name)
    return len(chunks)

def check_ollama_running() -> bool:
    """Check if Ollama is running and nomic-embed-text is available."""
    try:
        response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        models = [m["name"] for m in response.json().get("models", [])]
        return any("nomic-embed-text" in m for m in models)
    except Exception:
        return False

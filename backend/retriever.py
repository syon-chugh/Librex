from embedder import embed_texts, get_or_create_collection
from llm import rewrite_query
import traceback

def retrieve(query: str, library_name: str, n_results: int = 5) -> list[dict]:
    try:
        print(f"\n📚 retrieve() called: library='{library_name}', query='{query[:60]}...'")
        
        # 1. Rewrite query for better search
        print(f"   🔄 Rewriting query...")
        rewritten = rewrite_query(query, library_name)
        print(f"   ✅ Rewritten: '{rewritten[:80]}...'")
        
        # 2. Embed the rewritten query
        print(f"   🔤 Embedding query...")
        query_embedding = embed_texts([rewritten])[0]
        print(f"   ✅ Embedding created (dim: {len(query_embedding)})")
        
        # 3. Get collection
        print(f"   📦 Getting ChromaDB collection...")
        collection = get_or_create_collection(library_name)
        print(f"   ✅ Collection found: {collection.name}")
        
        # 4. Query collection
        print(f"   🔍 Querying for {n_results} results...")
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        print(f"   ✅ Found {len(results['ids'][0]) if results['ids'] else 0} chunks")
        
        if not results['ids'] or not results['ids'][0]:
            print(f"   ⚠️  WARNING: No results returned from ChromaDB")
            return []
        
        # 5. Build response
        chunks = []
        for i, doc_id in enumerate(results['ids'][0]):
            chunk = {
                "id": doc_id,
                "text": results['documents'][0][i],
                "distance": results['distances'][0][i],
                "metadata": results['metadatas'][0][i] if results['metadatas'] else {}
            }
            chunks.append(chunk)
            text_preview = chunk['text'][:80].replace('\n', ' ')
            metadata_keys = list(chunk['metadata'].keys()) if chunk['metadata'] else []
            print(f"      Chunk {i+1}: dist={chunk['distance']:.4f}, text_len={len(chunk['text'])}, text='{text_preview}...'")
            print(f"               metadata_keys={metadata_keys}")
    except Exception as e:
        print(f"\n❌ ERROR in retrieve():")
        print(f"   Library: {library_name}")
        print(f"   Query: {query[:60]}...")
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
        return []
    """
    Rewrite query for better retrieval, embed with nomic-embed-text,
    and retrieve top n_results chunks from ChromaDB.
    """
    # Rewrite query to be more search-friendly
    rewritten_query = rewrite_query(query, library_name)
    
    # Embed rewritten query using same model as ingestion
    query_embedding = embed_texts([rewritten_query])[0]
    
    collection = get_or_create_collection(library_name)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    chunks = []
    for i in range(len(results["documents"][0])):
        chunks.append({
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i]
        })
    
    return chunks

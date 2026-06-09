from embedder import embed_texts, get_or_create_collection

def retrieve(query: str, library_name: str, n_results: int = 5) -> list[dict]:
    """
    Embed the user query with nomic-embed-text,
    retrieve top n_results chunks from ChromaDB.
    """
    # Embed query using same model as ingestion
    query_embedding = embed_texts([query])[0]
    
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

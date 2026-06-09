import argparse
from scraper import scrape_docs
from chunker import chunk_document
from embedder import embed_and_store, check_ollama_running

def ingest(library_name: str, url: str, max_pages: int = 100):
    # 1. Check Ollama is running
    if not check_ollama_running():
        print("ERROR: Ollama not running. Run: ollama serve")
        return

    print(f"Starting ingestion for {library_name} from {url}")
    
    # 2. Scrape
    print("Step 1/3: Scraping docs...")
    pages = scrape_docs(url, max_pages=max_pages)
    print(f"Scraped {len(pages)} pages")

    # 3. Chunk
    print("Step 2/3: Chunking content...")
    all_chunks = []
    for page in pages:
        metadata = {
            "library": library_name,
            "url": page["url"],
            "page_title": page["title"],
            "section_heading": ""
        }
        # Chunk prose
        chunks = chunk_document(page["prose_text"], metadata)
        # Add code blocks as individual chunks
        for code in page["code_blocks"]:
            code_meta = metadata.copy()
            chunks_from_code = chunk_document(f"```\n{code}\n```", code_meta)
            chunks.extend(chunks_from_code)
        all_chunks.extend(chunks)
    print(f"Created {len(all_chunks)} chunks")

    # 4. Embed and store
    print("Step 3/3: Embedding and storing...")
    stored = embed_and_store(library_name, all_chunks)
    print(f"Done. {stored} chunks stored in ChromaDB for '{library_name}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--library", required=True, help="Library name e.g. react")
    parser.add_argument("--url", required=True, help="Docs root URL")
    parser.add_argument("--max-pages", type=int, default=100)
    args = parser.parse_args()
    ingest(args.library, args.url, args.max_pages)

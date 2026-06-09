from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import AskRequest, AskResponse, Source, IndexRequest, IndexStatusResponse, LibraryInfo
from embedder import get_library_stats, check_ollama_running
from retriever import retrieve
from llm import generate_answer, rewrite_query
import uuid
import threading
from typing import Dict

app = FastAPI(title="StackSage", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store for background ingestion tasks
jobs: Dict[str, dict] = {}

@app.on_event("startup")
async def startup_event():
    """Check if Ollama is running on startup."""
    if not check_ollama_running():
        print("⚠️  WARNING: Ollama not running or nomic-embed-text not found.")
        print("Run in a separate terminal:")
        print("  ollama serve")
        print("  ollama pull nomic-embed-text")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "StackSage"}

@app.get("/libraries", response_model=list[LibraryInfo])
async def get_libraries():
    """Get list of all indexed libraries."""
    stats = get_library_stats()
    return [LibraryInfo(name=s["name"], count=s["count"], indexed_at=s["indexed_at"]) for s in stats]

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """Ask a question about a library."""
    try:
        # 1. Retrieve relevant chunks
        chunks = retrieve(
            query=request.question,
            library_name=request.library,
            n_results=5
        )
        
        # 2. Generate answer
        result = generate_answer(request.question, chunks)
        
        # 3. Build source objects with confidence
        sources = [
            Source(
                title=c["metadata"].get("page_title", ""),
                url=c["metadata"].get("url", ""),
                section=c["metadata"].get("section_heading", ""),
                chunk_text=c["text"][:200],
                chunk_type=c["metadata"].get("chunk_type", "prose"),
                confidence=max(0, min(100, (1 - c.get("distance", 1.0)) * 100))
            )
            for c in chunks
        ]
        
        return AskResponse(
            answer=result["answer"],
            sources=sources,
            library=request.library,
            chunks_used=result["chunks_used"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index")
async def index_library(request: IndexRequest):
    """Start background ingestion job for a library."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "scraping",
        "pages_done": 0,
        "chunks_stored": 0,
        "error": None
    }
    
    # Run ingestion in background thread
    thread = threading.Thread(
        target=run_ingestion,
        args=(job_id, request.library_name, request.url)
    )
    thread.daemon = True
    thread.start()
    
    return {"job_id": job_id, "status": "started"}

def run_ingestion(job_id: str, library_name: str, url: str):
    """Background task: scrape, chunk, embed, and store docs."""
    from scraper import scrape_docs
    from chunker import chunk_document
    from embedder import embed_and_store
    
    try:
        # Scraping
        jobs[job_id]["status"] = "scraping"
        pages = scrape_docs(url, max_pages=100)
        jobs[job_id]["pages_done"] = len(pages)

        # Chunking
        jobs[job_id]["status"] = "chunking"
        all_chunks = []
        for page in pages:
            metadata = {
                "library": library_name,
                "url": page["url"],
                "page_title": page["title"],
                "section_heading": ""
            }
            all_chunks.extend(chunk_document(page["prose_text"], metadata))
            for code in page["code_blocks"]:
                code_meta = metadata.copy()
                chunks_from_code = chunk_document(f"```\n{code}\n```", code_meta)
                all_chunks.extend(chunks_from_code)

        # Embedding
        jobs[job_id]["status"] = "embedding"
        stored = embed_and_store(library_name, all_chunks)
        jobs[job_id]["chunks_stored"] = stored
        jobs[job_id]["status"] = "done"

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        print(f"Error in ingestion job {job_id}: {e}")

@app.get("/index/status/{job_id}", response_model=IndexStatusResponse)
async def index_status(job_id: str):
    """Get status of an ingestion job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return IndexStatusResponse(job_id=job_id, **job)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

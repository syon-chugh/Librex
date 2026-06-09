from pydantic import BaseModel
from typing import Optional

class AskRequest(BaseModel):
    question: str
    library: str

class Source(BaseModel):
    title: str
    url: str
    section: str
    chunk_text: str
    chunk_type: str   # "prose" or "code"

class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    library: str
    chunks_used: int

class IndexRequest(BaseModel):
    url: str
    library_name: str

class IndexStatusResponse(BaseModel):
    job_id: str
    status: str          # "scraping" | "chunking" | "embedding" | "done" | "error"
    pages_done: int
    chunks_stored: int
    error: Optional[str] = None

class LibraryInfo(BaseModel):
    name: str
    count: int
    indexed_at: Optional[str] = None

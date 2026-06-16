# Librex

A RAG-powered documentation assistant that indexes library docs and answers developer questions with grounded, cited responses and syntax-highlighted code examples.

Features
- 🔍 Semantic search over indexed docs
- 📚 Smart fetcher: llms.txt → Context7 → HTML scraper fallback
- 💾 Local-first vector store (ChromaDB) with Ollama-based embeddings (nomic-embed-text)
- 🎯 Cited sources and code-aware chunking
- 🎨 Polished React + Vite frontend with premium "Obsidian" theme

Why Librex?
Librex focuses on reliably ingesting and surfacing official library docs. Where available, it prefers llms.txt (clean markdown pages). When llms.txt isn't present (e.g., Tailwind), Librex queries Context7 (requires API key). Only when other options fail does it fall back to the HTML scraper.

Important: llms.txt support
- Highest quality source when present (React, Next.js, Vite)
- Not all sites publish llms.txt (Tailwind does not); fetcher will use Context7 in that case

Tech stack
- Frontend: React + Vite
- Backend: FastAPI (Python)
- Vector DB: ChromaDB (persistent local folder: ./chroma_db)
- Embeddings: nomic-embed-text via Ollama (localhost:11434)
- Retrieval LLM: OpenAI GPT (gpt-4o-mini) used for answer generation and query rewriting

Prerequisites
- Python 3.10+
- Node.js 18+
- Ollama (for nomic-embed-text) — optional if using remote embeddings

Environment (.env)
Create backend/.env (do NOT commit). Useful variables:
- OPENAI_API_KEY=...
- CONTEXT7_API_KEY=...   # Context7 API key (optional but recommended for many docs)
- OLLAMA_URL=http://localhost:11434

Quickstart (development)
1. Backend
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS / Linux
   # source venv/bin/activate
   pip install -r requirements.txt

   # Start backend (dev)
   uvicorn main:app --reload --port 8000

2. Frontend
   cd frontend
   npm install
   npm run dev
   # Dev server typically available at http://localhost:5173 (or next free port)

Indexing a library (CLI)
- Preferred approach: from the frontend, open "Index new library" and provide the library name (URL optional).
- CLI example (backend):
  cd backend
  python ingest.py --library react --url https://react.dev --max-pages 200

Embedding notes
- Embeddings and ChromaDB have practical batch limits. Librex uses safe defaults:
  - Embed batch (tokens): ~4000 tokens
  - ChromaDB add batch: 500 items
- The embedder truncates long texts and retries failed batches to avoid bulk failures.

Context7 integration
- When llms.txt is unavailable, Librex queries Context7 (if CONTEXT7_API_KEY provided)
- Context7 fetcher performs multiple topic queries and deduplicates snippets to improve coverage

Frontend notes
- Library name is the primary input when indexing (URL only needed as fallback)
- Example queries are generic and work across libraries
- Premium dark theme applied (Obsidian-inspired); toggle light/dark in header

Troubleshooting
- "Tailwind returns garbage chunks": Tailwind doesn't publish llms.txt; reindexing via Context7 or providing a docs URL will help. Use the UI "Index new library" and check indexing status.
- Embedding errors (batch size): ensure Ollama is running and nomic-embed-text is pulled; Librex will fall back to single-item retries.

Development tips
- To re-index a library and replace existing data, call the `/index` endpoint (UI) or run the ingest CLI; embedder now deletes old collections before storing new chunks.
- To re-run the React ingestion locally:
  cd backend
  python -X utf8 -c "from fetcher import fetch_docs; from chunker import chunk_document; from embedder import embed_and_store; pages = fetch_docs('react','https://react.dev'); chunks = []; ..."

Project structure
- backend/: FastAPI app, fetcher, chunker, embedder, retriever, llm
- frontend/: React app (components in src/components)

License
MIT

If you want additional README sections (architecture diagram, contribution guide, CI), tell me which and I'll add them.

A RAG-powered documentation assistant where developers can ask questions about any library and get answers grounded in the actual documentation, with cited sources and syntax-highlighted code examples.

## Features

- 🔍 **Semantic Search**: Ask questions in plain English
- 📚 **Pre-indexed Libraries**: React, FastAPI, LangChain, Tailwind, Pandas
- 💾 **Add Custom Libraries**: Paste a docs URL and it auto-indexes
- 🎯 **Cited Sources**: See exactly which doc pages your answer came from
- 🎨 **Syntax Highlighting**: Code examples rendered beautifully
- 🚀 **Local-first**: Ollama embeddings, ChromaDB storage, no external services

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python + FastAPI
- **Vector DB**: ChromaDB (persistent, local)
- **Embeddings**: nomic-embed-text via Ollama
- **LLM**: Gemini 2.0 Flash via Google AI API
- **Scraping**: httpx + BeautifulSoup4

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama ([download](https://ollama.com))

### Installation

```bash
# 1. Clone and enter project
cd stacksage

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# 3. Install Python dependencies
cd backend
pip install -r requirements.txt

# 4. Start Ollama (separate terminal)
ollama serve
ollama pull nomic-embed-text

# 5. Create .env in backend/
echo "GEMINI_API_KEY=your_key_here" > .env

# 6. Start backend
uvicorn main:app --reload --port 8000

# 7. Setup frontend (separate terminal)
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

## Usage

### First-time ingestion

```bash
cd backend
python ingest.py --library tailwind --url https://tailwindcss.com/docs --max-pages 30
```

### Ask questions

1. Select a library from sidebar
2. Type your question
3. Get answers with cited sources

## Architecture

- `backend/main.py` - FastAPI routes
- `backend/scraper.py` - Docs crawler
- `backend/chunker.py` - Code-aware text splitter
- `backend/embedder.py` - Embedding + ChromaDB storage
- `backend/retriever.py` - Query retrieval
- `backend/llm.py` - GPT-4o-mini integration
- `backend/ingest.py` - CLI for indexing new libraries

## License

MIT

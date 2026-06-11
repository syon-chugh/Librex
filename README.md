# StackSage

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

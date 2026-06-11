#!/usr/bin/env python3
"""
Re-index Tailwind CSS with improved scraper and chunker.
Deletes old collection and creates fresh index.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from scraper import scrape_docs
from chunker import chunk_document
from embedder import get_or_create_collection, embed_texts, save_indexed_at
from ingest import embed_and_store

def reindex_library(library_name: str, start_url: str, max_pages: int = 50):
    """Reindex a library: scrape, chunk, embed, store."""
    
    print(f"\n{'='*80}")
    print(f"🔄 RE-INDEXING: {library_name}")
    print(f"{'='*80}\n")
    
    # Step 1: Get or create collection
    print(f"📦 Getting ChromaDB collection '{library_name}'...")
    collection = get_or_create_collection(library_name)
    
    # Delete all existing documents for this library
    print(f"🗑️  Clearing old index...")
    try:
        # Get all IDs and delete them
        all_items = collection.get()
        if all_items['ids']:
            collection.delete(ids=all_items['ids'])
            print(f"   ✅ Deleted {len(all_items['ids'])} old chunks")
        else:
            print(f"   ℹ️  Collection was empty")
    except Exception as e:
        print(f"   ⚠️  Error clearing collection: {e}")
    
    # Step 2: Scrape documentation
    print(f"\n🕷️  Scraping documentation from {start_url}...")
    try:
        pages = scrape_docs(start_url, max_pages=max_pages)
        print(f"\n✅ Scraped {len(pages)} pages")
        if pages:
            print(f"   Sample page: {pages[0]['title']}")
            print(f"   Content preview: {pages[0]['prose_text'][:100]}...")
    except Exception as e:
        print(f"❌ Scraping failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    if not pages:
        print(f"❌ No pages scraped! Check the URL.")
        return False
    
    # Step 3: Chunk and clean
    print(f"\n📄 Chunking pages...")
    all_chunks = []
    for i, page in enumerate(pages):
        metadata = {
            "url": page['url'],
            "page_title": page['title'],
            "library": library_name,
            "section_heading": " | ".join(page.get('section_headings', [])[:2]) or ""
        }
        
        # Combine prose and code
        combined_text = page['prose_text']
        if page.get('code_blocks'):
            combined_text += "\n\n" + "\n\n".join(page['code_blocks'])
        
        chunks = chunk_document(combined_text, metadata)
        all_chunks.extend(chunks)
        
        if (i + 1) % 5 == 0:
            print(f"   [{i+1}/{len(pages)}] Chunked {len(chunks)} chunks from {page['title']}")
    
    print(f"\n✅ Created {len(all_chunks)} chunks from {len(pages)} pages")
    if all_chunks:
        print(f"   Sample chunk: {all_chunks[0]['text'][:80]}...")
        print(f"   Chunk metadata keys: {list(all_chunks[0]['metadata'].keys())}")
    
    # Step 4: Embed and store
    print(f"\n🔗 Embedding and storing chunks...")
    try:
        stored_count = embed_and_store(library_name, all_chunks)
        print(f"✅ Stored {stored_count} chunks in ChromaDB")
        
        # Save timestamp
        save_indexed_at(library_name)
        print(f"✅ Updated index timestamp")
        
        print(f"\n{'='*80}")
        print(f"🎉 RE-INDEXING COMPLETE: {library_name}")
        print(f"   Total chunks: {stored_count}")
        print(f"   Ready for queries!")
        print(f"{'='*80}\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Embedding/storing failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Re-index Tailwind CSS with improved scraper
    success = reindex_library(
        library_name="tailwindcss",
        start_url="https://tailwindcss.com/docs/installation",
        max_pages=50
    )
    
    sys.exit(0 if success else 1)

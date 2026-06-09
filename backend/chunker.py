import re
import tiktoken
import uuid

def chunk_document(text: str, metadata: dict) -> list[dict]:
    """
    Chunk a document into prose and code chunks.
    
    Rules:
    1. Detect code blocks: markdown fenced (```) and HTML <pre><code>...</code></pre>
    2. Code blocks are NEVER split - each becomes exactly one chunk
    3. Prose splitting: split on double newlines, merge if < 100 tokens, trim if > 400 tokens
    4. Every chunk has complete metadata including chunk_type
    5. Every chunk gets a unique UUID
    """
    
    # Encoding for token counting
    encoding = tiktoken.get_encoding("cl100k_base")
    
    chunks = []
    
    # Extract code blocks first (markdown fenced)
    code_block_pattern = r'```(?:\w+)?\n([\s\S]*?)```'
    code_blocks = []
    
    # Find all markdown code blocks with their positions
    for match in re.finditer(code_block_pattern, text):
        code_blocks.append({
            'full': match.group(0),
            'code': match.group(1),
            'start': match.start(),
            'end': match.end(),
            'language': extract_language(match.group(0))
        })
    
    # Extract HTML code blocks
    html_code_pattern = r'<pre><code[^>]*>([\s\S]*?)</code></pre>'
    for match in re.finditer(html_code_pattern, text):
        code_blocks.append({
            'full': match.group(0),
            'code': match.group(1),
            'start': match.start(),
            'end': match.end(),
            'language': 'html'
        })
    
    # Sort code blocks by position
    code_blocks.sort(key=lambda x: x['start'])
    
    # Build list of text segments and code blocks with their positions
    segments = []
    last_pos = 0
    
    for code_block in code_blocks:
        # Add prose before this code block
        if code_block['start'] > last_pos:
            prose = text[last_pos:code_block['start']]
            if prose.strip():
                segments.append({'type': 'prose', 'content': prose})
        
        # Add code block
        segments.append({'type': 'code', 'content': code_block['full'], 'language': code_block['language']})
        last_pos = code_block['end']
    
    # Add remaining prose
    if last_pos < len(text):
        prose = text[last_pos:]
        if prose.strip():
            segments.append({'type': 'prose', 'content': prose})
    
    # If no code blocks found, treat entire text as prose
    if not segments:
        segments = [{'type': 'prose', 'content': text}]
    
    # Process segments
    for segment in segments:
        if segment['type'] == 'code':
            # Code blocks are never split
            chunk_meta = metadata.copy()
            chunk_meta['chunk_type'] = 'code'
            chunk_meta['language'] = segment.get('language', '')
            chunks.append({
                'id': str(uuid.uuid4()),
                'text': segment['content'],
                'metadata': chunk_meta
            })
        else:
            # Process prose
            prose_chunks = process_prose(segment['content'], metadata, encoding)
            chunks.extend(prose_chunks)
    
    return chunks

def extract_language(code_block: str) -> str:
    """Extract language from code fence."""
    match = re.match(r'```(\w+)?', code_block)
    return match.group(1) if match and match.group(1) else ''

def process_prose(prose: str, metadata: dict, encoding) -> list[dict]:
    """Split prose into chunks based on token count and paragraph boundaries."""
    
    chunks = []
    
    # Split on double newlines (paragraphs)
    paragraphs = re.split(r'\n\n+', prose.strip())
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    current_chunk_text = []
    current_token_count = 0
    
    for para in paragraphs:
        para_tokens = len(encoding.encode(para))
        
        # If paragraph itself is > 400 tokens, split it at sentence boundary
        if para_tokens > 400:
            # If we have accumulated text, save it first
            if current_chunk_text:
                chunk_meta = metadata.copy()
                chunk_meta['chunk_type'] = 'prose'
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'text': '\n\n'.join(current_chunk_text),
                    'metadata': chunk_meta
                })
                current_chunk_text = []
                current_token_count = 0
            
            # Split long paragraph at sentence boundaries
            sentences = re.split(r'(?<=[.!?])\s+', para)
            sent_chunk_text = []
            sent_token_count = 0
            
            for sentence in sentences:
                sent_tokens = len(encoding.encode(sentence))
                if sent_token_count + sent_tokens > 400 and sent_chunk_text:
                    # Save current sentence chunk
                    chunk_meta = metadata.copy()
                    chunk_meta['chunk_type'] = 'prose'
                    chunks.append({
                        'id': str(uuid.uuid4()),
                        'text': ' '.join(sent_chunk_text),
                        'metadata': chunk_meta
                    })
                    sent_chunk_text = []
                    sent_token_count = 0
                
                sent_chunk_text.append(sentence)
                sent_token_count += sent_tokens
            
            if sent_chunk_text:
                chunk_meta = metadata.copy()
                chunk_meta['chunk_type'] = 'prose'
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'text': ' '.join(sent_chunk_text),
                    'metadata': chunk_meta
                })
        else:
            # Try to add paragraph to current chunk
            if current_token_count + para_tokens < 100:
                current_chunk_text.append(para)
                current_token_count += para_tokens
            else:
                # Save current chunk if it has content
                if current_chunk_text:
                    chunk_meta = metadata.copy()
                    chunk_meta['chunk_type'] = 'prose'
                    chunks.append({
                        'id': str(uuid.uuid4()),
                        'text': '\n\n'.join(current_chunk_text),
                        'metadata': chunk_meta
                    })
                
                # Start new chunk with this paragraph
                current_chunk_text = [para]
                current_token_count = para_tokens
    
    # Save remaining accumulated text
    if current_chunk_text:
        chunk_meta = metadata.copy()
        chunk_meta['chunk_type'] = 'prose'
        chunks.append({
            'id': str(uuid.uuid4()),
            'text': '\n\n'.join(current_chunk_text),
            'metadata': chunk_meta
        })
    
    return chunks


if __name__ == "__main__":
    test_text = """
    This is a prose paragraph about React hooks.
    It has multiple sentences and should be kept together.

    Here is another paragraph that is short.

```javascript
    const [count, setCount] = useState(0);
    useEffect(() => {
        document.title = `Count: ${count}`;
    }, [count]);
```

    This is a paragraph after the code block.
    """

    meta = {"library": "react", "url": "https://react.dev/hooks", "page_title": "Hooks"}
    chunks = chunk_document(test_text, meta)
    
    for i, c in enumerate(chunks):
        print(f"Chunk {i+1} [{c['metadata']['chunk_type']}]: {c['text'][:80]}...")
    
    # Assertions
    code_chunks = [c for c in chunks if c["metadata"]["chunk_type"] == "code"]
    assert len(code_chunks) == 1, "Should have exactly 1 code chunk"
    assert "useEffect" in code_chunks[0]["text"], "Code chunk must be intact"
    print("All assertions passed.")

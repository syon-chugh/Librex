from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not set in environment")

client = OpenAI(api_key=openai_api_key)

SYSTEM_PROMPT = """You are a technical documentation assistant for StackSage.

Your rules:
1. Answer ONLY using the documentation excerpts provided. Never use your training data.
2. Always include a code example in your answer if one exists in the excerpts.
3. If the answer is not in the provided excerpts, respond with exactly:
   "I couldn't find this in the indexed documentation. Try rephrasing or check the official docs directly."
4. Never invent API methods, props, or parameters that aren't in the excerpts.
5. Keep answers concise and developer-focused. Lead with the code example, then explain.
6. Format code blocks with triple backticks and the language name."""

def build_context(chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks):
        meta = chunk["metadata"]
        header = f"[{i+1}] {meta.get('page_title', '')} — {meta.get('section_heading', '')}"
        context_parts.append(f"{header}\n{chunk['text']}")
    return "\n\n---\n\n".join(context_parts)

def generate_answer(question: str, chunks: list[dict]) -> dict:
    if not chunks:
        return {
            "answer": "I couldn't find this in the indexed documentation. Try rephrasing or check the official docs directly.",
            "chunks_used": 0
        }
    
    context = build_context(chunks)
    
    user_message = f"""Documentation excerpts:

{context}

---

Developer question: {question}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.1,
        max_tokens=1000
    )
    
    return {
        "answer": response.choices[0].message.content,
        "chunks_used": len(chunks)
    }

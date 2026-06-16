from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not set in environment")

client = OpenAI(api_key=openai_api_key)

def rewrite_query(question: str, library: str) -> str:
    """
    Rewrite user query to be more search-friendly.
    Example: 'how do i do dark mode' → 'Tailwind CSS dark mode configuration class names'
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"You are a query optimizer for {library} documentation search. Rewrite the user's question as a precise technical search query. Return ONLY the rewritten query, no explanation."},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=100
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return question  # fallback to original if rewriting fails

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
    print(f"\n🤖 generate_answer() called with {len(chunks)} chunks")
    try:
        if not chunks:
            print(f"   ⚠️  No chunks provided, returning fallback")
            return {
                "answer": "I couldn't find this in the indexed documentation. Try rephrasing or check the official docs directly.",
                "chunks_used": 0,
                "confidence_score": 0,
                "confidence": 0.0
            }
        
        print(f"   📝 Building context from {len(chunks)} chunks...")
        context = build_context(chunks)
        print(f"   ✅ Context built ({len(context)} chars)")
        
        user_message = f"""Documentation excerpts:

{context}

---

Developer question: {question}"""
        print(f"   📨 User message built ({len(user_message)} chars)")
        
        print(f"   🔗 Calling OpenAI GPT-4o-mini...")
        print(f"      Model: gpt-4o-mini, temp=0.1, max_tokens=1000")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=1000
        )
        print(f"   ✅ LLM responded: status OK")
        print(f"      Choices count: {len(response.choices)}")
        
        answer_text = response.choices[0].message.content
        print(f"      Answer text length: {len(answer_text)}")
        print(f"\n{'='*60}")
        print(f"📄 FULL GPT OUTPUT:")
        print(f"{'='*60}")
        print(answer_text)
        print(f"{'='*60}\n")
        
        if not answer_text or answer_text.strip() == "":
            print(f"   ⚠️  WARNING: Empty answer from LLM!")
            return {
                "answer": "I couldn't find this in the indexed documentation. Try rephrasing or check the official docs directly.",
                "chunks_used": len(chunks),
                "confidence_score": 0,
                "confidence": 0.0
            }
        
        # Calculate average confidence from chunk distances
        avg_distance = sum(c.get("distance", 1.0) for c in chunks) / len(chunks)
        confidence = avg_distance  # store raw distance for confidence float field
        confidence_score = max(0, min(100, (1 - avg_distance) * 100))  # convert to 0-100 int scale
        
        result = {
            "answer": answer_text,
            "chunks_used": len(chunks),
            "confidence_score": int(confidence_score),
            "confidence": confidence
        }
        print(f"   📤 Returning answer ({len(result['answer'])} chars, confidence: {confidence_score:.1f}%)")
        return result
    except Exception as e:
        print(f"\n❌ ERROR in generate_answer():")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return error message instead of fallback
        return {
            "answer": f"Error generating answer: {str(e)}",
            "chunks_used": len(chunks),
            "confidence_score": 0,
            "confidence": 0.0
        }

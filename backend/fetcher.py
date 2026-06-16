"""
fetcher.py — Smart doc fetcher: llms.txt → Context7 → scraper fallback.

Priority:
  1. llms.txt  — if the library's site hosts /llms.txt, fetch clean markdown pages
  2. Context7  — if CONTEXT7_API_KEY is set in .env, use the Context7 REST API
  3. Scraper   — fallback to BFS HTML scraper (existing scraper.py)
"""

import os
import re
import time
import urllib.request
import urllib.parse
import json
from dotenv import load_dotenv

load_dotenv()

CONTEXT7_API_KEY = os.getenv("CONTEXT7_API_KEY")
CONTEXT7_BASE = "https://context7.com/api"

# Libraries confirmed to have llms.txt (highest quality — clean markdown pages)
# Tailwind, FastAPI, and most others do NOT — they fall through to Context7
LLMS_TXT_HOSTS = {
    "react":   "https://react.dev/llms.txt",
    "nextjs":  "https://nextjs.org/llms.txt",
    "vite":    "https://vite.dev/llms.txt",
}


# ─────────────────────────────────────────
# PUBLIC ENTRY POINT
# ─────────────────────────────────────────

def fetch_docs(library_name: str, url: str = "", max_pages: int = 100) -> list[dict]:
    """
    Fetch documentation for a library.
    Returns list of page dicts (same shape as scraper.scrape_docs).
    """
    print(f"\n[fetcher] library='{library_name}' url='{url}'")

    # 1. Try llms.txt
    pages = _try_llms_txt(library_name, url)
    if pages:
        print(f"[fetcher] llms.txt: got {len(pages)} pages")
        return pages

    # 2. Try Context7
    pages = _try_context7(library_name)
    if pages:
        print(f"[fetcher] Context7: got {len(pages)} pages")
        return pages

    # 3. Fallback to scraper (requires URL)
    if not url:
        print(f"[fetcher] No URL provided and Context7 failed — cannot scrape")
        return []
    print(f"[fetcher] Falling back to HTML scraper...")
    from scraper import scrape_docs
    pages = scrape_docs(url, max_pages=max_pages)
    print(f"[fetcher] Scraper: got {len(pages)} pages")
    return pages


# ─────────────────────────────────────────
# STRATEGY 1 — llms.txt
# ─────────────────────────────────────────

def _try_llms_txt(library_name: str, url: str) -> list[dict]:
    """
    Try fetching docs via llms.txt standard.
    Checks LLMS_TXT_HOSTS dict, then probes <url>/llms.txt and <url>/llms-full.txt.
    """
    candidates = []

    # Known host override
    if library_name.lower() in LLMS_TXT_HOSTS:
        candidates.append(LLMS_TXT_HOSTS[library_name.lower()])

    # Auto-probe from provided url
    from urllib.parse import urlparse
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    candidates += [f"{base}/llms-full.txt", f"{base}/llms.txt"]

    index_content = None
    for candidate in candidates:
        try:
            print(f"[llms.txt] Probing {candidate}")
            req = urllib.request.Request(candidate, headers={"User-Agent": "Librex/1.0"})
            with urllib.request.urlopen(req, timeout=8) as r:
                if r.status == 200:
                    index_content = r.read().decode("utf-8", errors="ignore")
                    print(f"[llms.txt] Found at {candidate} ({len(index_content)} chars)")
                    break
        except Exception:
            continue

    if not index_content:
        return []

    # Extract all .md URLs from the index
    md_urls = re.findall(r"https?://[^\s\)\]]+\.md", index_content)
    md_urls = list(dict.fromkeys(md_urls))  # deduplicate, preserve order
    print(f"[llms.txt] Found {len(md_urls)} .md page links")

    if not md_urls:
        return []

    pages = []
    for md_url in md_urls:
        try:
            req = urllib.request.Request(md_url, headers={"User-Agent": "Librex/1.0"})
            with urllib.request.urlopen(req, timeout=10) as r:
                text = r.read().decode("utf-8", errors="ignore")

            # Extract title from frontmatter
            title_match = re.search(r"^---\s*\ntitle:\s*['\"]?(.+?)['\"]?\s*\n", text, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else md_url.split("/")[-1].replace(".md", "")

            # Strip frontmatter block
            text = re.sub(r"^---[\s\S]+?---\n", "", text).strip()

            # Extract code blocks
            code_blocks = re.findall(r"```(?:\w+)?\n([\s\S]*?)```", text)

            pages.append({
                "url": md_url.replace(".md", ""),
                "title": title,
                "prose_text": text,
                "code_blocks": code_blocks,
                "section_headings": re.findall(r"^#{1,3} (.+)$", text, re.MULTILINE),
            })

            time.sleep(0.1)

        except Exception as e:
            print(f"[llms.txt] Failed to fetch {md_url}: {e}")
            continue

    return pages


# ─────────────────────────────────────────
# STRATEGY 2 — Context7 REST API
# ─────────────────────────────────────────

def _try_context7(library_name: str) -> list[dict]:
    """
    Use Context7 REST API to fetch docs.
    Requires CONTEXT7_API_KEY in .env.
    Uses v1/search (returns verified field) + v2/context (returns snippets).
    """
    if not CONTEXT7_API_KEY or CONTEXT7_API_KEY == "your_context7_api_key_here":
        print("[context7] No API key set in .env — skipping")
        return []

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {CONTEXT7_API_KEY}",
    }

    # Step 1: resolve library ID via v1/search (returns verified + trustScore)
    try:
        search_url = (
            f"{CONTEXT7_BASE}/v1/search"
            f"?query={urllib.parse.quote(library_name)}"
        )
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            results = json.loads(r.read().decode()).get("results", [])
    except Exception as e:
        print(f"[context7] Search failed: {e}")
        return []

    if not results:
        print(f"[context7] No results for '{library_name}'")
        return []

    # Pick best: score by relevance (exact name match > partial match) + verified + trustScore + tokens
    lib_lower = library_name.lower()
    lib_normalized = lib_lower.replace("-", "").replace("_", "").replace(" ", "")

    def relevance_score(r):
        title = r.get("title", "").lower()
        title_norm = title.replace("-", "").replace("_", "").replace(" ", "")
        rid = r.get("id", "").lower()
        trust = r.get("trustScore", 0) or 0
        tokens = r.get("totalTokens", 0) or 0
        verified = 1 if r.get("verified") else 0
        # Exact normalized title match is the strongest signal
        if title_norm == lib_normalized:
            exact = 10
        elif title_norm.startswith(lib_normalized) or lib_normalized in title_norm:
            exact = 5
        else:
            exact = 0
        return (verified, exact, trust, tokens // 10000)

    best = sorted(results, key=relevance_score, reverse=True)[0]
    library_id = best["id"]  # keep leading slash e.g. "/tailwindlabs/tailwindcss.com"
    print(f"[context7] Best match: {library_id} (trust={best.get('trustScore')}, verified={best.get('verified')})")

    # Step 2: fetch docs via v2/context using multiple queries for better coverage
    TOPIC_QUERIES = [
        f"{library_name} overview core concepts what is",
        f"what is {library_name} how it works philosophy",
        f"{library_name} utility first framework classes markup",
        f"{library_name} responsive design layout configuration",
        f"{library_name} installation setup getting started",
        f"{library_name} components customization theme",
    ]

    seen_code_ids = set()
    seen_info_ids = set()
    code_snippets = []
    info_snippets = []

    for topic_query in TOPIC_QUERIES:
        try:
            docs_url = (
                f"{CONTEXT7_BASE}/v2/context"
                f"?query={urllib.parse.quote(topic_query)}"
                f"&libraryId={urllib.parse.quote(library_id)}"
                f"&type=json"
            )
            req = urllib.request.Request(docs_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read().decode())
        except Exception as e:
            print(f"[context7] Docs fetch failed for '{topic_query}': {e}")
            continue

        for s in data.get("codeSnippets", []):
            cid = s.get("codeId", s.get("codeTitle", ""))
            if cid not in seen_code_ids:
                seen_code_ids.add(cid)
                code_snippets.append(s)

        for s in data.get("infoSnippets", []):
            pid = s.get("pageId", s.get("breadcrumb", ""))
            if pid not in seen_info_ids:
                seen_info_ids.add(pid)
                info_snippets.append(s)

        time.sleep(0.2)  # be polite

    if not code_snippets and not info_snippets:
        print("[context7] No snippets returned")
        return []

    print(f"[context7] Got {len(code_snippets)} code + {len(info_snippets)} info snippets")

    pages = []

    # code snippets: fields are codeTitle, codeDescription, codeLanguage, codeList
    for s in code_snippets:
        title = s.get("codeTitle", library_name)
        description = s.get("codeDescription", "")
        language = s.get("codeLanguage", "")
        code_list = s.get("codeList", [])
        # codeList is a list of code strings
        code_blocks = code_list if isinstance(code_list, list) else [code_list]
        prose = description
        if code_blocks:
            prose += "\n\n" + "\n\n".join(f"```{language}\n{c}\n```" for c in code_blocks if c)
        pages.append({
            "url": s.get("codeId", ""),
            "title": title,
            "prose_text": prose,
            "code_blocks": [c for c in code_blocks if c],
            "section_headings": [],
        })

    # info snippets: fields are pageId, breadcrumb, content
    for s in info_snippets:
        content = s.get("content", "")
        code_blocks = re.findall(r"```(?:\w+)?\n([\s\S]*?)```", content)
        pages.append({
            "url": s.get("pageId", ""),
            "title": s.get("breadcrumb", library_name),
            "prose_text": content,
            "code_blocks": code_blocks,
            "section_headings": re.findall(r"^#{1,3} (.+)$", content, re.MULTILINE),
        })

    return pages

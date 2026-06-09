import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time

def scrape_docs(root_url: str, max_pages: int = 100) -> list[dict]:
    """
    BFS crawler starting from root_url, same-domain only.
    Returns list of pages with prose and code blocks extracted.
    """
    
    parsed_root = urlparse(root_url)
    root_domain = parsed_root.netloc
    
    visited = set()
    queue = [root_url]
    pages = []
    
    skip_patterns = ['#', '.pdf', '.png', '.jpg', '.gif', '/api/', '/changelog', '/blog']
    
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        
        if url in visited:
            continue
        visited.add(url)
        
        # Skip URLs with unwanted patterns
        skip = False
        for pattern in skip_patterns:
            if pattern in url:
                skip = True
                break
        if skip:
            continue
        
        # Check domain
        parsed = urlparse(url)
        if parsed.netloc != root_domain:
            continue
        
        try:
            # Fetch page
            response = httpx.get(url, timeout=10, follow_redirects=True)
            if response.status_code != 200:
                continue
            
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            
            # Extract title
            title_tag = soup.find('title')
            title = title_tag.text if title_tag else ""
            # Remove " | LibraryName" suffix
            if "|" in title:
                title = title.split("|")[0].strip()
            
            # Find main content
            main_content = None
            for selector in ['article', 'main', '[role="main"]', 'body']:
                if selector.startswith('['):
                    main_content = soup.select_one(selector)
                else:
                    main_content = soup.find(selector)
                if main_content:
                    break
            
            if not main_content:
                main_content = soup.body if soup.body else soup
            
            # Extract code blocks FIRST
            code_blocks = []
            pre_tags = main_content.find_all('pre')
            for pre in pre_tags:
                code_tag = pre.find('code')
                if code_tag:
                    code_blocks.append(code_tag.get_text())
            
            # Remove code blocks from content
            for pre in pre_tags:
                pre.decompose()
            
            # Extract prose text
            prose_text = main_content.get_text(separator='\n', strip=True)
            
            # Extract section headings
            section_headings = []
            for tag in ['h2', 'h3']:
                headings = main_content.find_all(tag)
                section_headings.extend([h.get_text(strip=True) for h in headings])
            
            pages.append({
                'url': url,
                'title': title,
                'prose_text': prose_text,
                'code_blocks': code_blocks,
                'section_headings': section_headings
            })
            
            # Extract links for BFS
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('http'):
                    next_url = href
                else:
                    next_url = urljoin(url, href)
                
                # Remove fragment
                next_url = next_url.split('#')[0]
                
                if next_url not in visited:
                    queue.append(next_url)
            
            # Print progress
            if len(pages) % 10 == 0:
                print(f"Scraped {len(pages)}/{max_pages} pages...")
            
            # Be polite - add delay between requests
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            continue
    
    print(f"Scraping complete. Total pages: {len(pages)}")
    return pages

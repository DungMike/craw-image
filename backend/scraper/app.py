"""Flask API wrapper for image scraping from Bing Images using Selenium."""

import json
import os
import re
import time
import urllib.parse
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def search_bing_images(keyword, limit=20):
    """Use Selenium to scrape image URLs from Bing Images."""
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys
        import random

        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,3840")
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

        service = Service("/usr/bin/chromedriver")
        browser = webdriver.Chrome(service=service, options=options)

        # Build Bing Images search URL
        search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(keyword)}"
        print(f"[SCRAPER] Opening: {search_url}")
        browser.get(search_url)
        time.sleep(2)

        # Scroll to load more images
        body = browser.find_element(By.TAG_NAME, "body")
        scroll_count = max(5, (limit // 20) + 3)
        for i in range(scroll_count):
            try:
                # Try clicking "See more images" button
                see_more = browser.find_elements(By.CLASS_NAME, "btn_seemore")
                if see_more:
                    see_more[0].click()
            except Exception:
                pass
            body.send_keys(Keys.PAGE_DOWN)
            time.sleep(random.random() * 0.3 + 0.2)

        # Extract image URLs from page source
        page_source = browser.page_source
        browser.quit()

        # Parse image URLs from Bing's data attributes
        image_urls = []

        # Pattern 1: Extract from m attribute (JSON data containing murl)
        m_pattern = re.findall(r'class="iusc"[^>]*m="([^"]*)"', page_source)
        for m_data in m_pattern:
            try:
                # Decode HTML entities
                decoded = m_data.replace("&amp;", "&").replace("&quot;", '"')
                data = json.loads(decoded)
                if "murl" in data and data["murl"]:
                    url = data["murl"]
                    if url not in image_urls:
                        image_urls.append(url)
            except (json.JSONDecodeError, KeyError):
                continue

        # Pattern 2: Extract murl directly from JSON-like structures  
        if len(image_urls) < limit:
            murl_pattern = re.findall(r'"murl"\s*:\s*"(https?://[^"]+)"', page_source)
            for url in murl_pattern:
                url = url.replace("\\u0026", "&")
                if url not in image_urls:
                    image_urls.append(url)

        # Pattern 3: Look for image source URLs in data attributes
        if len(image_urls) < limit:
            src_pattern = re.findall(r'src2="(https?://[^"]+)"', page_source)
            for url in src_pattern:
                if url not in image_urls and "bing" not in url.lower():
                    image_urls.append(url)

        print(f"[SCRAPER] Found {len(image_urls)} images for '{keyword}'")
        return image_urls[:limit]

    except Exception as e:
        print(f"[SCRAPER] Error: {e}")
        import traceback
        traceback.print_exc()
        return []


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


@app.route("/search", methods=["GET"])
def search():
    """
    Search for images.
    Query params:
      - keyword: search term (required)
      - limit: max results (default 20)
    Returns: { images: [{ url, index }...] }
    """
    keyword = request.args.get("keyword", "").strip()
    limit = int(request.args.get("limit", 20))

    if not keyword:
        return jsonify({"error": "keyword is required"}), 400

    limit = max(1, min(limit, 200))

    print(f"[API] Searching for '{keyword}' with limit {limit}")
    urls = search_bing_images(keyword, limit)

    images = [{"url": url, "index": i} for i, url in enumerate(urls)]
    return jsonify({"images": images, "keyword": keyword, "total": len(images)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

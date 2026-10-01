"""
VeriText NLP - Live News Feed Aggregator Service
Fetches and caches real news from permitted official RSS feeds:
- The Indian Express
- NDTV
- The Hindu
- The Times of India
- ESPNcricinfo
"""

import html
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Dict, List, Optional

RSS_SOURCES = {
    "The Indian Express": {
        "url": "https://indianexpress.com/feed/",
        "category": "India & World",
        "badge_color": "#e11d48",
    },
    "NDTV": {
        "url": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "category": "Top Stories",
        "badge_color": "#dc2626",
    },
    "The Hindu": {
        "url": "https://www.thehindu.com/news/national/feeder/default.rss",
        "category": "National",
        "badge_color": "#2563eb",
    },
    "The Times of India": {
        "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "category": "Headlines",
        "badge_color": "#d97706",
    },
    "ESPNcricinfo": {
        "url": "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
        "category": "Sports / Cricket",
        "badge_color": "#059669",
    },
}

CACHE_TTL_SECONDS = 600  # 10 minutes cache
_cached_articles: List[Dict[str, Any]] = []
_last_fetch_time: float = 0


def _clean_text(raw_html: Optional[str]) -> str:
    """Remove HTML tags, decode entities, and strip redundant whitespace."""
    if not raw_html:
        return ""
    text = re.sub(r"<style[^>]*>.*?</style>", " ", raw_html, flags=re.DOTALL)
    text = re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_image(item: ET.Element, desc_html: str) -> Optional[str]:
    """Extract official article image from RSS item tags."""
    # 1. Check media:content (Yahoo Media RSS namespace)
    media = item.find("{http://search.yahoo.com/mrss/}content")
    if media is not None and media.get("url"):
        return media.get("url")

    # 2. Check media:thumbnail
    thumb = item.find("{http://search.yahoo.com/mrss/}thumbnail")
    if thumb is not None and thumb.get("url"):
        return thumb.get("url")

    # 3. Check enclosure tag
    enc = item.find("enclosure")
    if enc is not None and enc.get("url"):
        enc_type = enc.get("type", "")
        if "image" in enc_type or enc.get("url").endswith((".jpg", ".jpeg", ".png", ".webp", ".cms")):
            return enc.get("url")

    # 4. Check img tag inside description HTML
    if desc_html:
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc_html, re.IGNORECASE)
        if match:
            return match.group(1)

    return None


def fetch_source_articles(source_name: str, config: Dict[str, Any], max_items: int = 15) -> List[Dict[str, Any]]:
    """Fetch and parse articles from a single RSS source."""
    articles = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
    }
    req = urllib.request.Request(config["url"], headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            content = response.read()
            root = ET.fromstring(content)
            items = root.findall(".//item")

            for item in items[:max_items]:
                raw_title = item.findtext("title") or ""
                title = _clean_text(raw_title)
                if not title:
                    continue

                link = (item.findtext("link") or "").strip()
                raw_desc = item.findtext("description") or ""
                desc = _clean_text(raw_desc)

                pub_date = (item.findtext("pubDate") or "").strip()
                category = item.findtext("category") or config.get("category", "General News")
                category = _clean_text(category)

                image_url = _extract_image(item, raw_desc)

                articles.append({
                    "id": f"{source_name.lower().replace(' ', '_')}_{hash(link) % 10000000:07d}",
                    "title": title,
                    "description": desc,
                    "image": image_url,
                    "source": source_name,
                    "category": category,
                    "publishedAt": pub_date,
                    "url": link,
                    "badgeColor": config.get("badge_color", "#4f46e5"),
                })
    except Exception as exc:
        print(f"[NewsService] Warning: Failed fetching '{source_name}': {exc}")

    return articles


def get_all_news(force_refresh: bool = False, source_filter: Optional[str] = None, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get aggregated news across all sources with caching.
    """
    global _cached_articles, _last_fetch_time

    now = time.time()
    if force_refresh or not _cached_articles or (now - _last_fetch_time > CACHE_TTL_SECONDS):
        aggregated: List[Dict[str, Any]] = []
        for name, cfg in RSS_SOURCES.items():
            source_items = fetch_source_articles(name, cfg, max_items=12)
            aggregated.extend(source_items)

        # Interleave sources so frontend gets diverse feeds
        if aggregated:
            _cached_articles = aggregated
            _last_fetch_time = now

    results = list(_cached_articles)

    if source_filter:
        s_lower = source_filter.lower().strip()
        results = [
            a for a in results
            if s_lower in a["source"].lower() or (s_lower == "indian express" and "indian express" in a["source"].lower())
            or (s_lower == "toi" and "times of india" in a["source"].lower())
            or (s_lower == "espn" and "espn" in a["source"].lower())
        ]

    if category_filter:
        c_lower = category_filter.lower().strip()
        results = [a for a in results if c_lower in a["category"].lower() or c_lower in a["title"].lower() or c_lower in a["description"].lower()]

    return results

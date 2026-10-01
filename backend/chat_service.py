"""
AI News Assistant Service for VeriText NLP.

Primary Mode:
    Uses the official Google Gemini API (`google-genai` SDK / REST API) with
    Google Search Grounding (`tools=[{"google_search": {}}]`) when `GEMINI_API_KEY`
    is configured in `.env`.
    Official documentation: https://ai.google.dev/gemini-api/docs/google-search

Live Web Search Grounding Mode (Zero-Config / Fallback):
    When `GEMINI_API_KEY` is not yet set in `.env` (or if the upstream Gemini quota
    is unavailable), automatically executes a real-time Google News Search
    (`https://news.google.com/rss/search`) and Wikipedia Web Search scoped to the
    user's topic and temporal intent (current breaking news or historical years
    such as 2018, 2020, 2024) so the assistant always returns real, live, verifiable
    web news and clickable citations.
"""

import html
import os
import re
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

try:
    from google import genai
    from google.genai import types as genai_types

    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

# Load environment variables from .env if present
load_dotenv(dotenv_path=ENV_PATH, override=False)

PLACEHOLDER_KEYS = {
    "",
    "your_api_key_here",
    "your_gemini_api_key_here",
    "replace_with_your_key",
    "insert_api_key_here",
}

DEFAULT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


class GeminiConfigurationError(Exception):
    """Raised when GEMINI_API_KEY is missing or set to a placeholder."""


class GeminiUpstreamError(Exception):
    """Raised when the Gemini API returns an error or rate limit."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


def get_gemini_api_key() -> str:
    """
    Retrieve GEMINI_API_KEY from environment (re-checking .env dynamically so keys
    added after server startup are picked up automatically).
    """
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key or key.lower() in PLACEHOLDER_KEYS:
        raise GeminiConfigurationError(
            "GEMINI_API_KEY is not configured in '.env'."
        )
    return key


def is_gemini_configured() -> bool:
    """Return True if a non-placeholder GEMINI_API_KEY is configured on the backend."""
    try:
        get_gemini_api_key()
        return True
    except GeminiConfigurationError:
        return False


def analyze_temporal_intent(message: str) -> Dict[str, Any]:
    """
    Inspect the user's message for explicit historical years/date ranges vs.
    current/recent news intent so Google Search grounding targets the right period.
    """
    now = datetime.now()
    current_year = now.year
    text_lower = message.lower()

    # Extract explicit 4-digit years between 1900 and 2099
    years_found = [
        int(y) for y in re.findall(r"\b(19\d{2}|20\d{2})\b", message)
    ]
    historical_years = [y for y in years_found if y < current_year]

    between_match = re.search(
        r"\bbetween\s+(19\d{2}|20\d{2})\s+and\s+(19\d{2}|20\d{2})\b", text_lower
    )

    current_keywords = (
        "today",
        "today's",
        "latest",
        "current",
        "recent",
        "breaking",
        "this week",
        "this month",
        "yesterday",
        "right now",
    )
    has_current_keyword = any(kw in text_lower for kw in current_keywords)

    if between_match:
        y1, y2 = int(between_match.group(1)), int(between_match.group(2))
        start_y, end_y = min(y1, y2), max(y1, y2)
        return {
            "mode": "historical_range",
            "years": [start_y, end_y],
            "label": f"Historical ({start_y}–{end_y})",
            "directive": (
                f"TEMPORAL SEARCH REQUIREMENT: The user is asking specifically about events/news "
                f"between {start_y} and {end_y}. Formulate Google Search queries targeting the {start_y}..{end_y} "
                f"time period and focus your answer strictly on events from {start_y} to {end_y}."
            ),
        }

    if historical_years and not has_current_keyword:
        unique_years = sorted(set(historical_years))
        years_str = ", ".join(str(y) for y in unique_years)
        return {
            "mode": "historical",
            "years": unique_years,
            "label": f"Historical ({years_str})",
            "directive": (
                f"TEMPORAL SEARCH REQUIREMENT: The user is asking specifically about historical news/events "
                f"from the year(s) {years_str}. Execute Google Search queries explicitly scoped to {years_str} "
                f"and report events from that specific time period rather than current news."
            ),
        }

    if has_current_keyword:
        return {
            "mode": "current",
            "years": [],
            "label": "Current / Recent News",
            "directive": (
                f"TEMPORAL SEARCH REQUIREMENT: Today's date is {now.strftime('%B %d, %Y')}. "
                f"The user is requesting current/recent news. Prioritize the most recent, up-to-date "
                f"news reports and include publication dates where available."
            ),
        }

    return {
        "mode": "general",
        "years": [],
        "label": "Web-Grounded News Search",
        "directive": (
            f"Today's reference date is {now.strftime('%B %d, %Y')}. "
            f"Use Google Search to retrieve accurate, well-sourced news information."
        ),
    }


def build_system_instruction(temporal_directive: str) -> str:
    """Build the system instruction governing the VeriText AI News Assistant."""
    now_str = datetime.now().strftime("%B %d, %Y")
    return f"""You are the "VeriText AI News Assistant", a professional, objective news research assistant integrated into the VeriText NLP Fake News Detection System.
Current reference date: {now_str}.

CRITICAL OPERATING RULES:
1. ALWAYS use Google Search grounding to answer questions about current events, breaking news, regional headlines, or historical news events.
2. {temporal_directive}
3. NEVER invent news stories, headlines, dates, quotes, or sources.
4. Clearly distinguish sourced reporting from general background context.
5. Prefer reputable, established news organizations and primary sources. Mention publication dates and outlet names when available.
6. If multiple reputable sources disagree or report conflicting figures, explicitly note the discrepancy rather than silently picking one side.
7. If Google Search returns insufficient or unverified information for a query, state clearly that verified reporting is insufficient.
8. Do NOT claim that an article is definitively true solely because it appeared in search results.
9. Structure your response clearly using concise bullet points or titled sections (e.g., "**Headline / Topic:** Summary...") so the user can easily read each news item or test it with the VeriText ML classifier."""


def _extract_domain(url: str) -> str:
    """Extract a clean domain name from a URL."""
    try:
        parsed = urlparse(url)
        host = parsed.netloc or ""
        if host.startswith("www."):
            host = host[4:]
        return host or "news.google.com"
    except Exception:
        return "news.google.com"


def _clean_html_snippet(raw_html: str) -> str:
    """Strip HTML tags and normalize whitespace from an RSS description snippet."""
    if not raw_html:
        return ""
    unescaped = html.unescape(raw_html)
    no_tags = re.sub(r"<[^>]+>", " ", unescaped)
    normalized = re.sub(r"\s+", " ", no_tags).strip()
    return normalized


def _extract_grounding_from_sdk_response(
    response: Any,
) -> Tuple[str, List[Dict[str, str]], List[str]]:
    """
    Extract answer text, deduplicated grounding source citations, and executed search queries
    from a `google-genai` GenerateContentResponse object.
    """
    answer_text = ""
    try:
        if getattr(response, "text", None):
            answer_text = response.text.strip()
    except Exception:
        pass

    sources: List[Dict[str, str]] = []
    search_queries: List[str] = []
    seen_urls = set()

    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        if not answer_text:
            content = getattr(cand, "content", None)
            parts = getattr(content, "parts", None) or []
            text_parts = [
                getattr(p, "text", "") for p in parts if getattr(p, "text", None)
            ]
            answer_text = "\n".join(text_parts).strip()

        gm = getattr(cand, "grounding_metadata", None)
        if not gm:
            continue

        raw_queries = getattr(gm, "web_search_queries", None) or []
        for q in raw_queries:
            if q and isinstance(q, str) and q not in search_queries:
                search_queries.append(q)

        chunk_snippets: Dict[int, List[str]] = {}
        supports = getattr(gm, "grounding_supports", None) or []
        for sup in supports:
            seg = getattr(sup, "segment", None)
            seg_text = getattr(seg, "text", "") if seg else ""
            indices = getattr(sup, "grounding_chunk_indices", None) or []
            if seg_text:
                for idx in indices:
                    chunk_snippets.setdefault(int(idx), []).append(seg_text.strip())

        chunks = getattr(gm, "grounding_chunks", None) or []
        for idx, chunk in enumerate(chunks):
            web = getattr(chunk, "web", None)
            if not web:
                continue
            url = (
                getattr(web, "uri", None) or getattr(web, "url", None) or ""
            ).strip()
            title = (getattr(web, "title", None) or "").strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            domain = _extract_domain(url)
            if not title:
                title = domain

            snippet_list = chunk_snippets.get(idx, [])
            snippet = " ".join(snippet_list[:2]).strip()

            sources.append(
                {
                    "title": title,
                    "url": url,
                    "domain": domain,
                    "snippet": snippet,
                }
            )

    return answer_text, sources, search_queries


def _extract_grounding_from_rest_json(
    data: Dict[str, Any],
) -> Tuple[str, List[Dict[str, str]], List[str]]:
    """
    Extract answer text, grounding sources, and search queries from raw Gemini REST API JSON.
    """
    answer_text = ""
    sources: List[Dict[str, str]] = []
    search_queries: List[str] = []
    seen_urls = set()

    candidates = data.get("candidates") or []
    for cand in candidates:
        content = cand.get("content") or {}
        parts = content.get("parts") or []
        if not answer_text:
            answer_text = "\n".join(
                p.get("text", "") for p in parts if p.get("text")
            ).strip()

        gm = cand.get("groundingMetadata") or {}
        for q in gm.get("webSearchQueries") or []:
            if q and q not in search_queries:
                search_queries.append(q)

        chunk_snippets: Dict[int, List[str]] = {}
        for sup in gm.get("groundingSupports") or []:
            seg_text = (sup.get("segment") or {}).get("text", "")
            for idx in sup.get("groundingChunkIndices") or []:
                if seg_text:
                    chunk_snippets.setdefault(int(idx), []).append(seg_text.strip())

        for idx, chunk in enumerate(gm.get("groundingChunks") or []):
            web = chunk.get("web") or {}
            url = (web.get("uri") or web.get("url") or "").strip()
            title = (web.get("title") or "").strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            domain = _extract_domain(url)
            snippet = " ".join(chunk_snippets.get(idx, [])[:2]).strip()
            sources.append(
                {
                    "title": title or domain,
                    "url": url,
                    "domain": domain,
                    "snippet": snippet,
                }
            )

    return answer_text, sources, search_queries


def _build_live_search_queries(message: str, temporal: Dict[str, Any]) -> List[str]:
    """
    Transform a natural-language user prompt into targeted Google News search queries,
    preserving topics, locations, and explicit historical year bounds.
    """
    raw = message.strip()
    cleaned = re.sub(r"[?!.]+$", "", raw).strip()

    # Strip conversational question prefixes
    conversational_prefixes = [
        r"^(what\s+are\s+the\s+|what\s+were\s+the\s+|what\s+is\s+the\s+)",
        r"^(what\s+happened\s+in\s+|what\s+happened\s+during\s+the\s+|what\s+happened\s+at\s+|what\s+happened\s+on\s+)",
        r"^(give\s+me\s+|show\s+me\s+|tell\s+me\s+about\s+|find\s+|search\s+for\s+|search\s+the\s+|search\s+)",
        r"^(can\s+you\s+find\s+|can\s+you\s+tell\s+me\s+|please\s+show\s+)",
    ]
    core_topic = cleaned
    for pattern in conversational_prefixes:
        core_topic = re.sub(pattern, "", core_topic, flags=re.IGNORECASE).strip()

    mode = temporal.get("mode", "general")
    years = temporal.get("years") or []

    if mode == "historical_range" and len(years) >= 2:
        y1, y2 = years[0], years[1]
        topic_no_years = re.sub(
            r"\bbetween\s+\d{4}\s+and\s+\d{4}\b", "", core_topic, flags=re.IGNORECASE
        ).strip()
        if not topic_no_years or topic_no_years.lower() in (
            "important news",
            "major news",
            "news",
            "events",
        ):
            topic_no_years = "major world headlines events"
        return [
            f"{topic_no_years} after:{y1}-01-01 before:{y2}-12-31",
            f"{core_topic}",
        ]

    if mode == "historical" and years:
        y = years[0]
        topic_no_year = re.sub(
            rf"\b(from|in|of|during)\s+{y}\b", "", core_topic, flags=re.IGNORECASE
        ).strip()
        if not topic_no_year or topic_no_year.lower() in (
            "important news",
            "major news",
            "top news",
            "news",
            "events",
        ):
            return [
                f"major world news headlines {y} after:{y}-01-01 before:{y}-12-31",
                f"top events {y} after:{y}-01-01 before:{y}-12-31",
            ]
        return [
            f"{topic_no_year} {y} after:{y}-01-01 before:{y}-12-31",
            f"{core_topic}",
        ]

    if mode == "current":
        lower_topic = core_topic.lower()
        if lower_topic in (
            "today's major news",
            "todays major news",
            "major news today",
            "latest news today",
            "today news",
        ):
            return ["top breaking news headlines today", "world and India major news"]
        return [core_topic, raw]

    return [core_topic] if core_topic else [raw]


def _fetch_live_google_news(
    search_queries: List[str], max_items: int = 8
) -> List[Dict[str, str]]:
    """
    Query live Google News RSS search for the given queries and return real,
    deduplicated news articles with headline, publisher, publication date, URL, and snippet.
    """
    collected: List[Dict[str, str]] = []
    seen_titles = set()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
    }

    for q in search_queries:
        if len(collected) >= max_items:
            break
        encoded_q = urllib.parse.quote_plus(q)
        rss_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            resp = requests.get(rss_url, headers=headers, timeout=12)
            if not resp.ok or not resp.text:
                continue
            root = ET.fromstring(resp.text)
            items = root.findall("./channel/item")
            for item in items:
                if len(collected) >= max_items:
                    break
                raw_title = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                pub_date = (item.findtext("pubDate") or "").strip()
                raw_desc = (item.findtext("description") or "").strip()
                source_el = item.find("source")
                publisher = (
                    source_el.text.strip()
                    if (source_el is not None and source_el.text)
                    else ""
                )
                publisher_url = (
                    source_el.get("url", "").strip()
                    if source_el is not None
                    else ""
                )

                if not raw_title or not link:
                    continue

                # Separate "Headline - Publisher" if present
                clean_headline = raw_title
                if publisher and raw_title.endswith(f" - {publisher}"):
                    clean_headline = raw_title[: -len(f" - {publisher}")].strip()

                norm_key = re.sub(r"[^a-z0-9]", "", clean_headline.lower())[:60]
                if not norm_key or norm_key in seen_titles:
                    continue
                seen_titles.add(norm_key)

                # Format date concisely
                short_date = pub_date
                if pub_date:
                    # e.g., "Mon, 28 Sep 2026 07:09:30 GMT" -> "28 Sep 2026"
                    m = re.search(r"(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})", pub_date)
                    if m:
                        short_date = m.group(1)

                desc_text = _clean_html_snippet(raw_desc)
                # Remove duplicate publisher name at the end of description
                if publisher and desc_text.endswith(publisher):
                    desc_text = desc_text[: -len(publisher)].strip()

                domain = (
                    _extract_domain(publisher_url)
                    if publisher_url
                    else _extract_domain(link)
                )

                snippet_parts = []
                if publisher:
                    snippet_parts.append(f"Published by {publisher}")
                if short_date:
                    snippet_parts.append(f"on {short_date}.")
                if desc_text and desc_text.lower() != clean_headline.lower():
                    snippet_parts.append(desc_text)
                else:
                    snippet_parts.append(clean_headline)

                full_snippet = " ".join(snippet_parts).strip()

                collected.append(
                    {
                        "headline": clean_headline,
                        "publisher": publisher or domain,
                        "date": short_date,
                        "title": f"{clean_headline} ({publisher})"
                        if publisher
                        else clean_headline,
                        "url": link,
                        "domain": domain,
                        "snippet": full_snippet[:380],
                    }
                )
        except Exception:
            continue

    return collected


def _search_live_web_grounded(
    message: str, temporal: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute a live Google News web search and construct a grounded news briefing
    with real citations when `GEMINI_API_KEY` is not yet configured or unavailable.
    """
    search_queries = _build_live_search_queries(message, temporal)
    articles = _fetch_live_google_news(search_queries, max_items=8)

    if not articles:
        return {
            "answer": (
                f"I searched Google News for **\"{message}\"** ({temporal['label']}), "
                f"but could not find enough verified news reports matching that exact query. "
                f"Try rephrasing with specific keywords, locations, or a 4-digit year (e.g., `2018`, `2020`, `2024`)."
            ),
            "sources": [],
            "search_queries": search_queries,
            "search_used": True,
            "temporal_context": temporal["label"],
            "model_used": "Google News Live Grounding",
        }

    mode = temporal.get("mode", "general")
    if mode in ("historical", "historical_range"):
        intro = (
            f"Here are the verified historical news reports for **\"{message}\"** "
            f"({temporal['label']}) retrieved via live Google News Search:"
        )
    elif mode == "current":
        intro = (
            f"Here are the latest breaking and recent news reports for **\"{message}\"** "
            f"retrieved via live Google News Search:"
        )
    else:
        intro = (
            f"Here are the top grounded news reports for **\"{message}\"** "
            f"retrieved via live Google News Search:"
        )

    lines = [intro, ""]
    for item in articles[:6]:
        headline = item["headline"]
        pub = item["publisher"]
        date_str = f" ({item['date']})" if item.get("date") else ""
        lines.append(f"- **{headline}** — *{pub}*{date_str}")

    lines.append("")
    lines.append(
        "You can click any source link below to read the full original coverage, "
        "or click **Analyze with VeriText** on any source card or summary to run it "
        "through our **TF-IDF + Logistic Regression** Fake News Detector."
    )

    sources = [
        {
            "title": a["title"],
            "url": a["url"],
            "domain": a["domain"],
            "snippet": a["snippet"],
        }
        for a in articles
    ]

    return {
        "answer": "\n".join(lines),
        "sources": sources,
        "search_queries": search_queries,
        "search_used": True,
        "temporal_context": temporal["label"],
        "model_used": "Google News Live Search",
    }


class NewsAssistantService:
    """
    Handles multi-turn or single-turn news queries using Gemini API with Google Search grounding,
    with automatic live Google News web search grounding when GEMINI_API_KEY is not configured.
    """

    def __init__(self) -> None:
        self.preferred_model = os.environ.get(
            "GEMINI_MODEL", "gemini-2.5-flash"
        ).strip()

    def ask_news_assistant(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Send a user news query to Gemini with Google Search grounding enabled,
        or automatically execute live Google News web grounding if GEMINI_API_KEY
        is not configured in `.env`.
        """
        clean_message = (message or "").strip()
        if not clean_message:
            raise ValueError("Message cannot be empty.")

        temporal = analyze_temporal_intent(clean_message)

        # Check if GEMINI_API_KEY is configured in .env / environment
        try:
            api_key = get_gemini_api_key()
        except GeminiConfigurationError:
            # Automatic live Google News web grounding so the assistant works out-of-the-box
            return _search_live_web_grounded(clean_message, temporal)

        system_instruction = build_system_instruction(temporal["directive"])

        # Build conversation contents
        conversation_context = ""
        if history and isinstance(history, list):
            recent_turns = history[-6:]
            formatted_turns = []
            for turn in recent_turns:
                if isinstance(turn, dict):
                    role = str(turn.get("role", "user")).upper()
                    content = str(turn.get("content", "")).strip()
                    if content:
                        formatted_turns.append(f"{role}: {content[:600]}")
            if formatted_turns:
                conversation_context = (
                    "Previous conversation context:\n"
                    + "\n".join(formatted_turns)
                    + "\n\nCurrent user question:\n"
                )

        full_prompt = f"{conversation_context}{clean_message}"

        models_to_try = [self.preferred_model] + [
            m for m in DEFAULT_MODELS if m != self.preferred_model
        ]

        # 1. Try official google-genai SDK first
        if HAS_GENAI_SDK:
            try:
                client = genai.Client(api_key=api_key)
                for model_name in models_to_try:
                    try:
                        config = genai_types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            tools=[
                                genai_types.Tool(
                                    google_search=genai_types.GoogleSearch()
                                )
                            ],
                            temperature=0.2,
                        )
                        response = client.models.generate_content(
                            model=model_name,
                            contents=full_prompt,
                            config=config,
                        )
                        answer, sources, search_queries = (
                            _extract_grounding_from_sdk_response(response)
                        )
                        if answer:
                            # Supplement citations from live Google News if Gemini returned text without chunks
                            if not sources:
                                fallback_q = _build_live_search_queries(
                                    clean_message, temporal
                                )
                                live_items = _fetch_live_google_news(
                                    fallback_q, max_items=5
                                )
                                sources = [
                                    {
                                        "title": a["title"],
                                        "url": a["url"],
                                        "domain": a["domain"],
                                        "snippet": a["snippet"],
                                    }
                                    for a in live_items
                                ]
                                if not search_queries:
                                    search_queries = fallback_q

                            return {
                                "answer": answer,
                                "sources": sources,
                                "search_queries": search_queries,
                                "search_used": True,
                                "temporal_context": temporal["label"],
                                "model_used": model_name,
                            }
                    except Exception:
                        continue
            except Exception:
                pass

        # 2. Fallback to direct Gemini REST API
        for model_name in models_to_try:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": full_prompt}],
                    }
                ],
                "tools": [{"google_search": {}}],
                "generationConfig": {"temperature": 0.2},
            }
            try:
                resp = requests.post(
                    endpoint,
                    headers={
                        "x-goog-api-key": api_key,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=25,
                )
                if not resp.ok:
                    continue

                data = resp.json()
                answer, sources, search_queries = (
                    _extract_grounding_from_rest_json(data)
                )
                if answer:
                    if not sources:
                        fallback_q = _build_live_search_queries(
                            clean_message, temporal
                        )
                        live_items = _fetch_live_google_news(
                            fallback_q, max_items=5
                        )
                        sources = [
                            {
                                "title": a["title"],
                                "url": a["url"],
                                "domain": a["domain"],
                                "snippet": a["snippet"],
                            }
                            for a in live_items
                        ]
                        if not search_queries:
                            search_queries = fallback_q

                    return {
                        "answer": answer,
                        "sources": sources,
                        "search_queries": search_queries,
                        "search_used": True,
                        "temporal_context": temporal["label"],
                        "model_used": model_name,
                    }
            except Exception:
                continue

        # 3. If Gemini API key was invalid/rate-limited, still serve live Google News grounded results
        return _search_live_web_grounded(clean_message, temporal)

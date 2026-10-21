import html
import os
import re
import time
import email.utils
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import warnings
from datetime import date, datetime
from typing import Optional

import pandas as pd
import requests
import uvicorn
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from prophet import Prophet

warnings.filterwarnings("ignore")

app = FastAPI(
    title="ArthaX AI Market Intelligence API",
    description="High-performance backend for stock analytics, live FX conversion, and Prophet AI projections.",
    version="2.0.0"
)

# Enable CORS for Vercel frontend, local development, and external embeds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_DATE = "2018-01-01"
TODAY = date.today().strftime("%Y-%m-%d")


def get_live_usd_inr():
    """Fetches real-time USD to INR exchange rate."""
    for sym in ["INR=X", "USDINR=X"]:
        try:
            inr_ticker = yf.Ticker(sym)
            inr_data = inr_ticker.history(period="5d")
            if not inr_data.empty:
                if isinstance(inr_data.columns, pd.MultiIndex):
                    inr_data.columns = inr_data.columns.get_level_values(0)
                val = float(inr_data["Close"].dropna().iloc[-1])
                if val > 0:
                    return val
        except Exception:
            continue
    return 88.65


def get_live_fx_to_inr(from_currency: str = "USD") -> float:
    """Fetches real-time exchange rate from asset's native currency to INR."""
    curr = (from_currency or "USD").upper().strip()
    if curr == "INR":
        return 1.0
    try:
        # e.g., USDINR=X, EURINR=X, GBPINR=X, JPYINR=X, CADINR=X, AUDINR=X
        fx_pair = f"{curr}INR=X"
        fx_ticker = yf.Ticker(fx_pair)
        fx_data = fx_ticker.history(period="2d")
        if not fx_data.empty:
            if isinstance(fx_data.columns, pd.MultiIndex):
                fx_data.columns = fx_data.columns.get_level_values(0)
            val = float(fx_data["Close"].dropna().iloc[-1])
            if val > 0:
                return float(val)
    except Exception:
        pass

    usd_rate = get_live_usd_inr()
    if curr == "USD":
        return usd_rate
    # Common cross rates fallback if direct FX ticker fails
    cross_rates_to_usd = {
        "EUR": 1.08,
        "GBP": 1.29,
        "CAD": 0.73,
        "AUD": 0.65,
        "JPY": 0.0066,
        "CHF": 1.13,
        "SGD": 0.76,
        "HKD": 0.128,
        "CNY": 0.14
    }
    multiplier = cross_rates_to_usd.get(curr, 1.0)
    return round(usd_rate * multiplier, 4)



@app.get("/", response_class=HTMLResponse)
def root_status_page():
    """Returns a sleek Apple Cupertino dark-mode status landing page."""
    usd_inr = get_live_usd_inr()
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ArthaX 2.0 • API Status</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
                background-color: #07080a;
                color: #f5f5f7;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                position: relative;
                overflow: hidden;
            }}
            /* Ambient radial glows */
            body::before {{
                content: "";
                position: absolute;
                top: -150px;
                left: 20%;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(10, 132, 255, 0.12) 0%, rgba(0,0,0,0) 70%);
                pointer-events: none;
            }}
            body::after {{
                content: "";
                position: absolute;
                bottom: -150px;
                right: 20%;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(48, 209, 88, 0.08) 0%, rgba(0,0,0,0) 70%);
                pointer-events: none;
            }}
            .card {{
                position: relative;
                z-index: 1;
                max-width: 540px;
                width: 100%;
                background: rgba(18, 20, 26, 0.75);
                backdrop-filter: blur(30px) saturate(190%);
                -webkit-backdrop-filter: blur(30px) saturate(190%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 36px 32px;
                box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12);
                text-align: center;
            }}
            .badge-pulse {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 14px;
                border-radius: 9999px;
                background: rgba(48, 209, 88, 0.1);
                border: 1px solid rgba(48, 209, 88, 0.25);
                color: #30d158;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 20px;
            }}
            .dot {{
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #30d158;
                box-shadow: 0 0 12px #30d158;
                animation: pulse 2s infinite ease-in-out;
            }}
            @keyframes pulse {{
                0% {{ transform: scale(0.9); opacity: 0.7; }}
                50% {{ transform: scale(1.15); opacity: 1; }}
                100% {{ transform: scale(0.9); opacity: 0.7; }}
            }}
            h1 {{
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.02em;
                margin-bottom: 8px;
                background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            p.subtitle {{
                font-size: 14px;
                color: #86868b;
                line-height: 1.5;
                margin-bottom: 28px;
            }}
            .grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 28px;
                text-align: left;
            }}
            .tile {{
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 14px;
                padding: 14px 16px;
            }}
            .tile-label {{
                font-size: 11px;
                color: #86868b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 4px;
            }}
            .tile-val {{
                font-size: 15px;
                font-weight: 600;
                color: #ffffff;
            }}
            .actions {{
                display: flex;
                flex-direction: column;
                gap: 10px;
            }}
            .btn {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 20px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                user-select: none;
            }}
            .btn-primary {{
                background: linear-gradient(180deg, #0a84ff 0%, #0066cc 100%);
                color: #ffffff;
                box-shadow: 0 4px 16px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }}
            .btn-primary:hover {{
                transform: translateY(-1px);
                background: linear-gradient(180deg, #2191ff 0%, #0a84ff 100%);
            }}
            .btn-secondary {{
                background: rgba(255, 255, 255, 0.06);
                color: #f5f5f7;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }}
            .btn-secondary:hover {{
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.2);
            }}
            .footer {{
                margin-top: 24px;
                font-size: 11px;
                color: #515156;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge-pulse">
                <div class="dot"></div>
                <span>ArthaX AI Engine is Live</span>
            </div>

            <h1>ArthaX Intelligence Backend</h1>
            <p class="subtitle">High-performance financial time-series forecasting, live Yahoo Finance data streaming, and real-time forex valuation API.</p>

            <div class="grid">
                <div class="tile">
                    <div class="tile-label">AI Model</div>
                    <div class="tile-val">Meta Prophet Active</div>
                </div>
                <div class="tile">
                    <div class="tile-label">USD / INR Rate</div>
                    <div class="tile-val">₹{usd_inr:.2f}</div>
                </div>
                <div class="tile">
                    <div class="tile-label">Status</div>
                    <div class="tile-val" style="color: #30d158;">Operational</div>
                </div>
                <div class="tile">
                    <div class="tile-label">Version</div>
                    <div class="tile-val">2.0.0 Production</div>
                </div>
            </div>

            <div class="actions">
                <a href="https://astragenx-arthax.vercel.app/" class="btn btn-primary" target="_blank">
                    🚀 Launch ArthaX Web App
                </a>
                <a href="/docs" class="btn btn-secondary">
                    📖 Explore Swagger API Docs
                </a>
            </div>

            <div class="footer">
                AstraGenX Intelligence • Powered by Meta Prophet & Yahoo Finance
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/health")
@app.get("/api/health")
def health():
    """Uptime keep-alive endpoint for UptimeRobot / Cron pings."""
    return {
        "status": "healthy",
        "service": "ArthaX Intelligence API",
        "timestamp": TODAY,
        "keep_alive": True
    }


# In-memory news cache: { cache_key: { "timestamp": float, "data": list } }
NEWS_CACHE = {}
NEWS_CACHE_TTL = 180  # 3 minutes

# Comprehensive mapping: Company names and colloquial terms -> Official Tickers
COMPANY_TICKER_MAP = [
    # US Tech & Mega Caps
    ("APPLE", "AAPL"),
    ("IPHONE", "AAPL"),
    ("AAPL", "AAPL"),
    ("NVIDIA", "NVDA"),
    ("BLACKWELL", "NVDA"),
    ("NVDA", "NVDA"),
    ("TESLA", "TSLA"),
    ("ELON MUSK", "TSLA"),
    ("CYBERTRUCK", "TSLA"),
    ("TSLA", "TSLA"),
    ("MICROSOFT", "MSFT"),
    ("AZURE", "MSFT"),
    ("MSFT", "MSFT"),
    ("AMAZON", "AMZN"),
    ("AWS", "AMZN"),
    ("AMZN", "AMZN"),
    ("GOOGLE", "GOOGL"),
    ("ALPHABET", "GOOGL"),
    ("GEMINI", "GOOGL"),
    ("GOOGL", "GOOGL"),
    ("META", "META"),
    ("FACEBOOK", "META"),
    ("INSTAGRAM", "META"),
    ("NETFLIX", "NFLX"),
    ("NFLX", "NFLX"),
    ("AMD", "AMD"),
    ("INTEL", "INTC"),
    ("QUALCOMM", "QCOM"),
    ("BROADCOM", "AVGO"),
    ("PALANTIR", "PLTR"),
    ("PLTR", "PLTR"),
    ("BOEING", "BA"),
    ("BA", "BA"),
    
    # India & NSE Bluechips
    ("RELIANCE INDUSTRIES", "RELIANCE.NS"),
    ("RELIANCE", "RELIANCE.NS"),
    ("MUKESH AMBANI", "RELIANCE.NS"),
    ("JIO", "RELIANCE.NS"),
    ("TATA MOTORS", "TATAMOTORS.NS"),
    ("TATAMOTORS", "TATAMOTORS.NS"),
    ("TATA CONSULTANCY", "TCS.NS"),
    ("TCS", "TCS.NS"),
    ("TATA", "TATAMOTORS.NS"),
    ("INFOSYS", "INFY.NS"),
    ("INFY", "INFY.NS"),
    ("HDFC BANK", "HDFCBANK.NS"),
    ("HDFC", "HDFCBANK.NS"),
    ("ICICI BANK", "ICICIBANK.NS"),
    ("ICICI", "ICICIBANK.NS"),
    ("STATE BANK OF INDIA", "SBIN.NS"),
    ("SBI", "SBIN.NS"),
    ("NIFTY 50", "NIFTY"),
    ("NIFTY", "NIFTY"),
    ("SENSEX", "SENSEX"),
    
    # Crypto & Global Benchmarks
    ("BITCOIN", "BTC-USD"),
    ("BTC", "BTC-USD"),
    ("ETHEREUM", "ETH-USD"),
    ("ETH", "ETH-USD"),
    ("S&P 500", "S&P 500"),
    ("SP500", "S&P 500"),
    ("NASDAQ", "NASDAQ"),
    ("DOW JONES", "DOW")
]

INDEX_SYMBOLS = {
    "NIFTY": "^NSEI",
    "NSEI": "^NSEI",
    "NIFTY50": "^NSEI",
    "SENSEX": "^BSESN",
    "BSESN": "^BSESN",
    "BSE": "^BSESN",
    "GSPC": "^GSPC",
    "S&P 500": "^GSPC",
    "SP500": "^GSPC",
    "SPX": "^GSPC",
    "IXIC": "^IXIC",
    "NASDAQ": "^IXIC",
    "DJI": "^DJI",
    "DOW": "^DJI"
}

def extract_news_tickers(text: str) -> list:
    """Identifies prominent market asset and ticker mentions by company name or ticker symbol."""
    found = []
    text_upper = text.upper()
    for kw, sym in COMPANY_TICKER_MAP:
        # Match as whole word/phrase to avoid substring collisions
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text_upper):
            clean_sym = sym.replace("^", "")
            if clean_sym not in found:
                found.append(clean_sym)
    return found


def normalize_news_text(text: str) -> str:
    """Decodes HTML entities, converts non-breaking spaces, and cleans punctuation."""
    if not text:
        return ""
    # Unescape HTML entities (&nbsp;, &amp;, &#39;, &quot;, &lt;, &gt;, &ndash;, etc.)
    text = html.unescape(text)
    # Convert non-breaking space & literal entities to regular space
    text = text.replace('\xa0', ' ').replace('&nbsp;', ' ').replace('&amp;', '&')
    # Normalize unicode smart quotes and dashes
    replacements = {
        '\u2018': "'", '\u2019': "'", '\u201a': "'", '\u201b': "'",
        '\u201c': '"', '\u201d': '"', '\u201e': '"',
        '\u2013': ' - ', '\u2014': ' - ', '\u2026': '...',
        '\ufffd': "'"
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # Remove any stray HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Collapse multiple whitespaces
    return re.sub(r'\s+', ' ', text).strip()


def extract_clean_summary(desc_raw: str, main_title: str, publisher: str) -> str:
    """
    Extracts a clean, informative news summary without HTML tags, &nbsp;,
    or repeating the main headline verbatim.
    """
    if not desc_raw:
        return f"Comprehensive coverage and live financial analysis reported by {publisher}."

    desc_clean = re.sub(r'View Full Coverage on Google News.*', '', desc_raw, flags=re.IGNORECASE)
    desc_clean = re.sub(r'See more headlines & perspectives.*', '', desc_clean, flags=re.IGNORECASE)
    decoded = html.unescape(desc_clean).replace('\xa0', ' ').replace('&nbsp;', ' ')
    
    # Google RSS often contains an <ol> of coverage from multiple outlets
    li_matches = re.findall(r'<li[^>]*>(.*?)</li>', decoded, flags=re.DOTALL | re.IGNORECASE)
    
    clean_title_core = main_title.split(" - ")[0].strip().lower()
    related_points = []
    
    for li in li_matches:
        a_m = re.search(r'<a[^>]*>(.*?)</a>', li, flags=re.DOTALL | re.IGNORECASE)
        f_m = re.search(r'<font[^>]*>(.*?)</font>', li, flags=re.DOTALL | re.IGNORECASE)
        
        headline = normalize_news_text(a_m.group(1)) if a_m else ""
        pub = normalize_news_text(f_m.group(1)) if f_m else ""
        
        if headline:
            h_core = headline.split(" - ")[0].strip().lower()
            # If the headline is essentially the same as main title, skip it
            if h_core == clean_title_core or clean_title_core.startswith(h_core) or h_core.startswith(clean_title_core):
                continue
            if pub:
                related_points.append(f"{headline} ({pub})")
            else:
                related_points.append(headline)
                
    if related_points:
        return " • ".join(related_points[:2])
    
    # If no <li> items were found, strip tags and clean fallback
    fallback = normalize_news_text(desc_clean)
    fallback = re.sub(r'View Full Coverage on Google News.*', '', fallback, flags=re.IGNORECASE)
    fallback = re.sub(r'See more headlines & perspectives.*', '', fallback, flags=re.IGNORECASE).strip()
    fb_lower = fallback.lower()
    if not fallback or fb_lower == clean_title_core or clean_title_core.startswith(fb_lower) or fb_lower.startswith(clean_title_core):
        if publisher and publisher != "Market News":
            return f"Detailed reporting and real-time market impact analysis from {publisher}."
        return "Market intelligence update tracking real-time industry developments."
    
    return fallback


def format_relative_time_from_secs(secs: int) -> str:
    """Converts seconds diff to relative format like '20m ago'."""
    if secs < 60:
        return "Just now"
    elif secs < 3600:
        return f"{max(1, secs // 60)}m ago"
    elif secs < 86400:
        return f"{secs // 3600}h ago"
    elif secs < 172800:
        return "Yesterday"
    else:
        return f"{secs // 86400}d ago"


def format_relative_time(pub_date_str: str) -> str:
    """Converts RFC-822 date to human relative format like '20m ago'."""
    try:
        dt = email.utils.parsedate_to_datetime(pub_date_str)
        now = datetime.now(dt.tzinfo)
        diff = now - dt
        return format_relative_time_from_secs(int(diff.total_seconds()))
    except Exception:
        return "Recent"


NEWS_CACHE = {}
NEWS_CACHE_TTL = 120  # 2 minutes cache for real-time news freshness


@app.get("/api/news")
def get_financial_news(
    category: str = Query("all", description="Category: all, markets, tech, india, crypto"),
    q: Optional[str] = Query(None, description="Optional company name, keyword, or ticker search query"),
    limit: int = Query(40, ge=1, le=100)
):
    """
    Fetches real-time institutional financial news from verified global feeds
    with auto-detected tickers, company name search, publisher attribution, and relative timestamps.
    Prioritizes Indian market news within the 'all' category and strictly sequences by time.
    100% free with 0 API key dependencies.
    """
    q_clean = q.strip() if q else ""
    cache_key = f"{category}_{q_clean.lower()}_{limit}"
    now_ts = time.time()
    if cache_key in NEWS_CACHE:
        cached = NEWS_CACHE[cache_key]
        if now_ts - cached["timestamp"] < NEWS_CACHE_TTL:
            return {
                "category": category,
                "query": q_clean,
                "count": len(cached["data"]),
                "items": cached["data"],
                "results": cached["data"]
            }

    # Feed endpoints
    feeds = {
        "all": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
        "markets": "https://news.google.com/rss/search?q=stock+market+wall+street+when:3d&hl=en-US&gl=US&ceid=US:en",
        "tech": "https://news.google.com/rss/search?q=tech+stocks+nvidia+ai+when:3d&hl=en-US&gl=US&ceid=US:en",
        "india": "https://news.google.com/rss/search?q=nifty+sensex+stock+market+india+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
        "crypto": "https://news.google.com/rss/search?q=crypto+bitcoin+fed+interest+rates+when:3d&hl=en-US&gl=US&ceid=US:en"
    }

    raw_feed_urls = []
    if q_clean:
        # Search by company name or ticker in finance domain
        is_india = any(k in q_clean.lower() for k in ["tata", "reliance", "nifty", "sensex", "hdfc", "infosys", "sbi", ".ns", "bse"])
        gl_param = "IN" if is_india else "US"
        hl_param = "en-IN" if is_india else "en-US"
        clean_q = urllib.parse.quote_plus(f"{q_clean} stock OR market OR business")
        raw_feed_urls.append((f"https://news.google.com/rss/search?q={clean_q}&hl={hl_param}&gl={gl_param}&ceid={gl_param}:en", False))
    elif category == "all":
        # For 'all', pull both top Indian market news AND global business news so Indian news has high visibility
        raw_feed_urls.append((feeds["india"], True))
        raw_feed_urls.append((feeds["all"], False))
    else:
        raw_feed_urls.append((feeds.get(category.lower(), feeds["all"]), category == "india"))

    articles = []
    seen_titles = set()

    for feed_url, is_indian_feed in raw_feed_urls:
        try:
            req = urllib.request.Request(feed_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            res = urllib.request.urlopen(req, timeout=8)
            raw_xml = res.read().decode("utf-8", errors="replace")
            root = ET.fromstring(raw_xml)

            items = root.findall(".//item")
            for idx, item in enumerate(items[:45]):
                raw_title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""

                normalized_raw_title = normalize_news_text(raw_title)
                parts = normalized_raw_title.rsplit(" - ", 1)
                title = parts[0].strip() if len(parts) > 1 else normalized_raw_title.strip()
                publisher = parts[1].strip() if len(parts) > 1 else ("Indian Financial Wire" if is_indian_feed else "Market News")

                # De-duplicate by title core
                title_key = re.sub(r'[^a-zA-Z0-9]', '', title.lower()[:45])
                if title_key in seen_titles:
                    continue
                seen_titles.add(title_key)

                # Parse timestamp
                pub_ts = 0.0
                time_ago = "Recent"
                iso_date = ""
                try:
                    dt = email.utils.parsedate_to_datetime(pub_date)
                    pub_ts = dt.timestamp()
                    iso_date = dt.isoformat()
                    now = datetime.now(dt.tzinfo)
                    diff = now - dt
                    time_ago = format_relative_time_from_secs(int(diff.total_seconds()))
                except Exception:
                    pub_ts = now_ts - (idx * 180)
                    iso_date = datetime.fromtimestamp(pub_ts).isoformat()
                    time_ago = "Recent"

                # Extract tickers
                tickers = extract_news_tickers(title)
                if not tickers and q_clean:
                    tickers = extract_news_tickers(q_clean)

                # Assign topic category badge
                if is_indian_feed or any(k in title.lower() for k in ["nifty", "sensex", "india", "rupee", "sebi", "rbi", "tata", "reliance"]):
                    cat_tag = "India & NSE"
                elif any(k in title.lower() for k in ["bitcoin", "crypto", "fed", "rate", "inflation"]):
                    cat_tag = "Crypto & Macro"
                elif any(k in title.lower() for k in ["ai", "tech", "nvidia", "chip", "semiconductor", "apple", "tesla", "microsoft"]):
                    cat_tag = "Tech & AI"
                else:
                    cat_tag = "Global Markets"

                clean_summary = extract_clean_summary(desc, title, publisher)

                articles.append({
                    "id": f"art-{idx}-{abs(hash(title)) % 100000}",
                    "title": title,
                    "publisher": publisher,
                    "link": link,
                    "timeAgo": time_ago,
                    "relativeTime": time_ago,
                    "pubDate": pub_date,
                    "publishedAt": iso_date or pub_date,
                    "timestamp": pub_ts,
                    "tickers": tickers,
                    "category": cat_tag,
                    "summary": clean_summary
                })
        except Exception as e:
            continue

    # STRICT SORT: Always in sequence based on publication timestamp descending
    articles.sort(key=lambda a: a.get("timestamp", 0), reverse=True)

    # Slice to requested limit
    final_articles = articles[:limit]

    NEWS_CACHE[cache_key] = {"timestamp": now_ts, "data": final_articles}

    return {
        "category": category,
        "query": q_clean,
        "count": len(final_articles),
        "items": final_articles,
        "results": final_articles
    }


@app.get("/api/search")
def search_ticker(q: str = Query(..., min_length=1, description="Company name or ticker symbol")):
    """Hits Yahoo Finance Search API to auto-suggest verified market symbols."""
    query = q.strip()
    if len(query) < 1:
        return {"results": []}

    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=35&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }

    try:
        res = requests.get(url, headers=headers, timeout=6)
        results = []

        if res.status_code == 200:
            data = res.json()
            valid_types = {"EQUITY", "ETF", "MUTUALFUND", "CRYPTOCURRENCY", "CURRENCY", "INDEX", "FUTURE", "COMMODITY"}

            for quote in data.get("quotes", []):
                raw_sym = quote.get("symbol")
                quote_type = (quote.get("quoteType") or "EQUITY").upper()
                if raw_sym and (quote_type in valid_types or len(raw_sym) <= 12):
                    clean_sym = raw_sym.replace("^", "")
                    display_sym = clean_sym
                    if raw_sym == "^NSEI":
                        display_sym = "NIFTY 50"
                    elif raw_sym == "^BSESN":
                        display_sym = "SENSEX"
                    elif raw_sym == "^GSPC":
                        display_sym = "S&P 500"
                    elif raw_sym == "^IXIC":
                        display_sym = "NASDAQ"
                    elif raw_sym == "^DJI":
                        display_sym = "DOW JONES"
                    name = quote.get("shortname") or quote.get("longname") or display_sym
                    exchange = quote.get("exchange") or quote.get("exchDisp") or "Global"
                    results.append({
                        "symbol": clean_sym,
                        "displaySymbol": display_sym,
                        "rawSymbol": raw_sym,
                        "name": name,
                        "exchange": exchange,
                        "type": quote_type
                    })

        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for item in results:
            if item["symbol"] not in seen:
                seen.add(item["symbol"])
                deduped.append(item)

        return {"results": deduped[:25]}
    except Exception as e:
        return {"results": [], "error": str(e)}


@app.get("/api/stock/{ticker}")
def get_stock_data(ticker: str, range: str = Query("1y", regex="^(1h|6h|12h|24h|1w|1m|6m|1y|5y|max)$")):
    """Fetches historical price candles and company fundamentals with granular intraday support."""
    raw_ticker = ticker.upper().strip()
    ticker_clean = INDEX_SYMBOLS.get(raw_ticker.replace("^", ""), raw_ticker)
    range_lower = range.lower().strip()

    try:
        stock = yf.Ticker(ticker_clean)
        
        # Support granular intraday minute-level timeframes
        if range_lower == "1h":
            hist = stock.history(period="1d", interval="1m")
            if len(hist) > 60:
                hist = hist.iloc[-60:]
        elif range_lower == "6h":
            hist = stock.history(period="1d", interval="2m")
            if hist.empty or len(hist) < 30:
                hist = stock.history(period="1d", interval="5m")
            if len(hist) > 72:
                hist = hist.iloc[-72:]
        elif range_lower == "12h":
            hist = stock.history(period="2d", interval="5m")
            if len(hist) > 100:
                hist = hist.iloc[-100:]
        elif range_lower == "24h":
            hist = stock.history(period="1d", interval="2m")
            if hist.empty or len(hist) < 40:
                hist = stock.history(period="2d", interval="5m")
            if len(hist) > 150:
                hist = hist.iloc[-150:]
        elif range_lower == "1w":
            hist = stock.history(period="5d", interval="5m")
            if hist.empty or len(hist) < 50:
                hist = stock.history(period="5d", interval="15m")
        elif range_lower == "1m":
            # 1 month with 15-minute intraday bars so users can zoom down into minute-by-minute inspection
            hist = stock.history(period="1mo", interval="15m")
            if hist.empty:
                hist = stock.history(period="1mo", interval="30m")
            if hist.empty:
                hist = stock.history(period="1mo", interval="1d")
        else:
            period_map = {
                "6m": "6mo",
                "1y": "1y",
                "5y": "5y",
                "max": "max"
            }
            interval_map = {
                "6m": "1d",
                "1y": "1d",
                "5y": "1wk",
                "max": "1mo"
            }
            hist = stock.history(period=period_map.get(range_lower, "1y"), interval=interval_map.get(range_lower, "1d"))

        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found for this symbol.")

        if isinstance(hist.columns, pd.MultiIndex):
            hist.columns = hist.columns.get_level_values(0)

        hist.reset_index(inplace=True)
        if "Date" not in hist.columns and "Datetime" in hist.columns:
            hist.rename(columns={"Datetime": "Date"}, inplace=True)

        hist.ffill(inplace=True)
        hist.dropna(subset=["Close"], inplace=True)

        if hist["Date"].dt.tz is not None:
            hist["Date"] = hist["Date"].dt.tz_localize(None)

        # Check if dataset is intraday (has hours/minutes)
        is_intraday = (
            range_lower in {"1h", "6h", "12h", "24h", "1w", "1m"}
            or (len(hist) > 1 and (hist["Date"].iloc[1] - hist["Date"].iloc[0]).total_seconds() < 86400)
        )
        date_format = "%Y-%m-%d %H:%M:%S" if is_intraday else "%Y-%m-%d"

        # Build clean historical series with exact timestamps
        candles = []
        for _, row in hist.iterrows():
            candles.append({
                "date": row["Date"].strftime(date_format),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0))
            })

        latest_close = candles[-1]["close"]
        prev_close = candles[-2]["close"] if len(candles) > 1 else latest_close
        change = round(latest_close - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2) if prev_close else 0.0

        # Genuine Fundamentals from Yahoo Finance QuoteSummary
        info = {}
        try:
            info = stock.info or {}
        except Exception:
            pass

        fast_info = getattr(stock, "fast_info", {})

        # Currency
        raw_currency = info.get("currency") or (fast_info.get("currency") if hasattr(fast_info, "get") else None) or "USD"
        currency = str(raw_currency).upper().strip()

        usd_inr = get_live_usd_inr()
        fx_rate = get_live_fx_to_inr(currency)
        inr_price = latest_close if currency == "INR" else latest_close * fx_rate

        # Genuine 52-Week High & Low
        raw_52_high = info.get("fiftyTwoWeekHigh") or (fast_info.get("year_high") if hasattr(fast_info, "get") else None) or max(c["high"] for c in candles)
        fifty_two_high = round(float(raw_52_high), 2)

        raw_52_low = info.get("fiftyTwoWeekLow") or (fast_info.get("year_low") if hasattr(fast_info, "get") else None) or min(c["low"] for c in candles)
        fifty_two_low = round(float(raw_52_low), 2)

        # Genuine Market Cap, P/E Ratio, and Volume
        market_cap = info.get("marketCap") or (fast_info.get("market_cap") if hasattr(fast_info, "get") else None)
        
        raw_pe = info.get("trailingPE") or info.get("forwardPE")
        pe_ratio = round(float(raw_pe), 1) if raw_pe else None

        raw_vol = info.get("regularMarketVolume") or candles[-1]["volume"]
        volume = int(raw_vol) if raw_vol else None

        # Clean display symbol without technical caret (^)
        display_symbol = raw_ticker.replace("^", "")
        if ticker_clean == "^NSEI":
            display_symbol = "NIFTY 50"
        elif ticker_clean == "^BSESN":
            display_symbol = "SENSEX"
        elif ticker_clean == "^GSPC":
            display_symbol = "S&P 500"
        elif ticker_clean == "^IXIC":
            display_symbol = "NASDAQ"
        elif ticker_clean == "^DJI":
            display_symbol = "DOW JONES"

        name = info.get("shortName") or info.get("longName")
        if not name or name == ticker_clean:
            if ticker_clean == "^NSEI":
                name = "NIFTY 50 Index (NSE India)"
            elif ticker_clean == "^BSESN":
                name = "S&P BSE SENSEX Index (India)"
            elif ticker_clean == "^GSPC":
                name = "S&P 500 Index (Wall Street)"
            elif ticker_clean == "^IXIC":
                name = "NASDAQ Composite Index"
            elif ticker_clean == "^DJI":
                name = "Dow Jones Industrial Average"
            else:
                name = display_symbol

        return {
            "symbol": display_symbol,
            "displaySymbol": display_symbol,
            "rawSymbol": ticker_clean,
            "name": name,
            "currency": currency,
            "latestPrice": latest_close,
            "inrPrice": round(inr_price, 2),
            "fxRate": round(fx_rate, 2),
            "usdInrRate": round(usd_inr, 2),
            "change": change,
            "changePercent": change_pct,
            "range": range,
            "fiftyTwoWeekHigh": fifty_two_high,
            "fiftyTwoWeekLow": fifty_two_low,
            "marketCap": market_cap,
            "peRatio": pe_ratio,
            "volume": volume,
            "history": candles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ForecastRequest(BaseModel):
    ticker: str
    years: Optional[int] = 2
    horizon: Optional[str] = "2y"  # "1d", "1w", "1m", "1y", "2y", "3y", "4y", "5y"
    granularity: Optional[str] = "auto"


@app.post("/api/forecast")
def generate_forecast(req: ForecastRequest):
    """Generates multi-resolution AI price trajectory and projected candlesticks with Prophet."""
    raw_ticker = req.ticker.upper().strip()
    ticker_clean = INDEX_SYMBOLS.get(raw_ticker.replace("^", ""), raw_ticker)

    # Normalize horizon
    raw_h = (req.horizon or "").lower().strip()
    if raw_h in ["1d", "1w", "1m"]:
        horizon = raw_h
        years = 1
    elif raw_h.endswith("y") and raw_h[:-1].isdigit():
        years = max(1, min(int(raw_h[:-1]), 5))
        horizon = f"{years}y"
    else:
        years = max(1, min(req.years or 2, 5))
        horizon = f"{years}y"

    try:
        stock = yf.Ticker(ticker_clean)
        is_intraday = horizon in ["1d", "1w"]

        if horizon == "1d":
            # 1 Day Intraday: Train on recent 5-day 15-minute bars
            df = stock.history(period="5d", interval="15m")
            freq = "15min"
            periods = 48  # next 24 hours at 15-min intervals
            date_fmt = "%Y-%m-%d %H:%M:%S"
            fit_daily_seasonality = True
            fit_weekly_seasonality = False
            fit_yearly_seasonality = False
        elif horizon == "1w":
            # 1 Week: Train on recent 1-month 30-minute / 1-hour bars
            df = stock.history(period="1mo", interval="30m")
            if df.empty or len(df) < 30:
                df = stock.history(period="1mo", interval="1h")
            freq = "1h"
            periods = 84  # next 7 days at 1-hour / 2-hour intervals
            date_fmt = "%Y-%m-%d %H:%M:%S"
            fit_daily_seasonality = True
            fit_weekly_seasonality = True
            fit_yearly_seasonality = False
        elif horizon == "1m":
            # 1 Month: Train on recent 6-month daily bars
            df = stock.history(period="6mo", interval="1d")
            freq = "1d"
            periods = 30
            date_fmt = "%Y-%m-%d"
            fit_daily_seasonality = False
            fit_weekly_seasonality = True
            fit_yearly_seasonality = False
        else:
            # Multi-year macro: Train on full history
            df = stock.history(start=START_DATE, end=TODAY)
            freq = "1d"
            periods = years * 365
            date_fmt = "%Y-%m-%d"
            fit_daily_seasonality = False
            fit_weekly_seasonality = False
            fit_yearly_seasonality = True

        if df.empty or len(df) < 15:
            # Fallback to general history
            df = stock.history(period="2y", interval="1d")
            if df.empty:
                raise HTTPException(status_code=404, detail="Insufficient historical data to model projections.")
            freq = "1d"
            periods = years * 365
            date_fmt = "%Y-%m-%d"
            fit_daily_seasonality = False
            fit_weekly_seasonality = False
            fit_yearly_seasonality = True
            is_intraday = False

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df.reset_index(inplace=True)
        if "Date" not in df.columns and "Datetime" in df.columns:
            df.rename(columns={"Datetime": "Date"}, inplace=True)

        df.ffill(inplace=True)
        df.dropna(subset=["Close"], inplace=True)
        if df["Date"].dt.tz is not None:
            df["Date"] = df["Date"].dt.tz_localize(None)

        df_train = df[["Date", "Close"]].rename(columns={"Date": "ds", "Close": "y"})

        m = Prophet(
            interval_width=0.95,
            daily_seasonality=fit_daily_seasonality,
            weekly_seasonality=fit_weekly_seasonality,
            yearly_seasonality=fit_yearly_seasonality
        )
        m.fit(df_train)

        future = m.make_future_dataframe(periods=periods, freq=freq)
        if not is_intraday:
            future = future[future["ds"].dt.dayofweek < 5]  # Exclude weekends for daily/macro

        forecast = m.predict(future)

        latest_actual_date = df_train["ds"].iloc[-1]
        latest_price = float(df_train["y"].iloc[-1])
        future_price = float(forecast["yhat"].iloc[-1])

        growth_pct = round(((future_price - latest_price) / latest_price) * 100, 2)
        cagr = round(((future_price / latest_price) ** (1 / max(1, years)) - 1) * 100, 2) if years > 1 else growth_pct

        fast_info = getattr(stock, "fast_info", {})
        currency = fast_info.get("currency", "USD") if hasattr(fast_info, "get") else "USD"
        usd_inr = get_live_usd_inr()

        # Future only
        future_only = forecast[forecast["ds"] > latest_actual_date].copy()

        # Subsample if too dense for multi-year
        if not is_intraday and len(future_only) > 120:
            step = 7 if years <= 2 else 14
            subsampled = future_only.iloc[::step].copy()
            if not subsampled.empty and subsampled.iloc[-1]["ds"] != future_only.iloc[-1]["ds"]:
                subsampled = pd.concat([subsampled, future_only.iloc[[-1]]])
            future_only = subsampled

        # Timeline points (for Corridor Area & Line)
        points = [{
            "date": latest_actual_date.strftime(date_fmt),
            "actual": round(latest_price, 2),
            "predicted": round(latest_price, 2),
            "upper": round(latest_price, 2),
            "lower": round(latest_price, 2)
        }]

        for _, row in future_only.iterrows():
            points.append({
                "date": row["ds"].strftime(date_fmt),
                "actual": None,
                "predicted": round(float(row["yhat"]), 2),
                "upper": round(float(row["yhat_upper"]), 2),
                "lower": max(0.0, round(float(row["yhat_lower"]), 2))
            })

        # Generate Projected Candlesticks
        projected_candles = [{
            "time": latest_actual_date.strftime(date_fmt),
            "open": round(latest_price, 2),
            "high": round(latest_price, 2),
            "low": round(latest_price, 2),
            "close": round(latest_price, 2),
            "upper": round(latest_price, 2),
            "lower": round(latest_price, 2),
            "predicted": round(latest_price, 2),
            "isProjected": False
        }]

        prev_close = latest_price
        for _, row in future_only.iterrows():
            pred = round(float(row["yhat"]), 2)
            upper = round(float(row["yhat_upper"]), 2)
            lower = max(0.01, round(float(row["yhat_lower"]), 2))

            c_open = prev_close
            c_close = pred

            # Realistic volatility wicks bounded within 95% Bayesian envelope
            upper_swing = max(0.0, upper - max(c_open, c_close))
            lower_swing = max(0.0, min(c_open, c_close) - lower)

            c_high = round(max(c_open, c_close) + upper_swing * 0.42, 2)
            c_low = round(max(0.01, min(c_open, c_close) - lower_swing * 0.42), 2)

            projected_candles.append({
                "time": row["ds"].strftime(date_fmt),
                "open": c_open,
                "high": c_high,
                "low": c_low,
                "close": c_close,
                "upper": upper,
                "lower": lower,
                "predicted": pred,
                "isProjected": True
            })
            prev_close = c_close

        fx_rate = get_live_fx_to_inr(currency)
        inr_latest = latest_price if currency == "INR" else latest_price * fx_rate
        inr_future = future_price if currency == "INR" else future_price * fx_rate

        sentiment = "Bullish" if growth_pct > 5 else ("Bearish" if growth_pct < -3 else "Neutral / Moderate")

        display_sym = raw_ticker.replace("^", "")
        if ticker_clean == "^NSEI":
            display_sym = "NIFTY 50"
        elif ticker_clean == "^BSESN":
            display_sym = "SENSEX"
        elif ticker_clean == "^GSPC":
            display_sym = "S&P 500"
        elif ticker_clean == "^IXIC":
            display_sym = "NASDAQ"
        elif ticker_clean == "^DJI":
            display_sym = "DOW JONES"

        return {
            "symbol": display_sym,
            "displaySymbol": display_sym,
            "rawSymbol": ticker_clean,
            "currency": currency,
            "years": years,
            "horizon": horizon,
            "currentPrice": round(latest_price, 2),
            "projectedPrice": round(future_price, 2),
            "inrCurrent": round(inr_latest, 2),
            "inrProjected": round(inr_future, 2),
            "fxRate": round(fx_rate, 2),
            "usdInrRate": round(usd_inr, 2),
            "growthPercent": growth_pct,
            "cagr": cagr,
            "sentiment": sentiment,
            "timeline": points,
            "projectedCandles": projected_candles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)


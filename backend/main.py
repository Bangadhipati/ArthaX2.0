import os
import re
import warnings
from datetime import date
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
    try:
        inr_ticker = yf.Ticker("INR=X")
        inr_data = inr_ticker.history(period="1d")
        if not inr_data.empty:
            if isinstance(inr_data.columns, pd.MultiIndex):
                inr_data.columns = inr_data.columns.get_level_values(0)
            return float(inr_data["Close"].iloc[-1])
    except Exception:
        pass
    return 84.00


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


@app.get("/api/health")
def health():
    """Uptime keep-alive endpoint for UptimeRobot / Cron pings."""
    return {
        "status": "healthy",
        "service": "ArthaX Intelligence API",
        "timestamp": TODAY,
        "keep_alive": True
    }


@app.get("/api/search")
def search_ticker(q: str = Query(..., min_length=1, description="Company name or ticker symbol")):
    """Hits Yahoo Finance Search API to auto-suggest verified market symbols."""
    query = q.strip()
    if len(query) < 1:
        return {"results": []}

    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code != 200:
            return {"results": []}

        data = res.json()
        valid_types = {"EQUITY", "ETF", "MUTUALFUND", "CRYPTOCURRENCY", "CURRENCY"}
        results = []

        for quote in data.get("quotes", []):
            quote_type = quote.get("quoteType")
            if quote_type in valid_types:
                symbol = quote.get("symbol")
                name = quote.get("shortname") or quote.get("longname") or symbol
                exchange = quote.get("exchange") or quote.get("exchDisp") or "Global"
                if symbol:
                    results.append({
                        "symbol": symbol,
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

        return {"results": deduped[:12]}
    except Exception as e:
        return {"results": [], "error": str(e)}


@app.get("/api/stock/{ticker}")
def get_stock_data(ticker: str, range: str = Query("1y", regex="^(1m|6m|1y|5y|max)$")):
    """Fetches historical price candles and company fundamentals."""
    ticker_clean = ticker.upper().strip()

    try:
        stock = yf.Ticker(ticker_clean)
        
        period_map = {
            "1m": "1mo",
            "6m": "6mo",
            "1y": "1y",
            "5y": "5y",
            "max": "max"
        }
        interval_map = {
            "1m": "1d",
            "6m": "1d",
            "1y": "1d",
            "5y": "1wk",
            "max": "1mo"
        }
        
        hist = stock.history(period=period_map.get(range, "1y"), interval=interval_map.get(range, "1d"))
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

        # Build clean historical series
        candles = []
        for _, row in hist.iterrows():
            candles.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
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

        # Currency and fundamentals
        fast_info = getattr(stock, "fast_info", {})
        currency = fast_info.get("currency", "USD") if hasattr(fast_info, "get") else "USD"
        
        usd_inr = get_live_usd_inr()
        inr_price = latest_close if currency == "INR" else latest_close * usd_inr

        # Quick stats
        fifty_two_high = round(float(fast_info.get("year_high", max(c["high"] for c in candles))), 2) if hasattr(fast_info, "get") and fast_info.get("year_high") else max(c["high"] for c in candles)
        fifty_two_low = round(float(fast_info.get("year_low", min(c["low"] for c in candles))), 2) if hasattr(fast_info, "get") and fast_info.get("year_low") else min(c["low"] for c in candles)
        market_cap = fast_info.get("market_cap") if hasattr(fast_info, "get") else None

        return {
            "symbol": ticker_clean,
            "currency": currency,
            "latestPrice": latest_close,
            "inrPrice": round(inr_price, 2),
            "usdInrRate": round(usd_inr, 2),
            "change": change,
            "changePercent": change_pct,
            "range": range,
            "fiftyTwoWeekHigh": fifty_two_high,
            "fiftyTwoWeekLow": fifty_two_low,
            "marketCap": market_cap,
            "history": candles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ForecastRequest(BaseModel):
    ticker: str
    years: int = 2


@app.post("/api/forecast")
def generate_forecast(req: ForecastRequest):
    """Generates multi-year AI price trajectory with Prophet."""
    ticker_clean = req.ticker.upper().strip()
    years = max(1, min(req.years, 5))

    try:
        stock = yf.Ticker(ticker_clean)
        df = stock.history(start=START_DATE, end=TODAY)
        if df.empty:
            raise HTTPException(status_code=404, detail="Insufficient historical data to model projections.")

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df.reset_index(inplace=True)
        if "Date" not in df.columns and "Datetime" in df.columns:
            df.rename(columns={"Datetime": "Date"}, inplace=True)

        df.ffill(inplace=True)
        df.dropna(subset=["Close"], inplace=True)
        if df["Date"].dt.tz is not None:
            df["Date"] = df["Date"].dt.tz_localize(None)

        # Prepare for Prophet
        df_train = df[["Date", "Close"]].rename(columns={"Date": "ds", "Close": "y"})

        m = Prophet(daily_seasonality=False, yearly_seasonality=True, weekly_seasonality=False)
        m.fit(df_train)

        period = years * 365
        future = m.make_future_dataframe(periods=period)
        future = future[future["ds"].dt.dayofweek < 5]  # Exclude weekends

        forecast = m.predict(future)

        # Merge actual and forecast
        latest_actual_date = df_train["ds"].iloc[-1]
        latest_price = float(df_train["y"].iloc[-1])
        future_price = float(forecast["yhat"].iloc[-1])
        growth_pct = round(((future_price - latest_price) / latest_price) * 100, 2)
        cagr = round(((future_price / latest_price) ** (1 / years) - 1) * 100, 2)

        fast_info = getattr(stock, "fast_info", {})
        currency = fast_info.get("currency", "USD") if hasattr(fast_info, "get") else "USD"
        usd_inr = get_live_usd_inr()

        # Subsample historical points to keep frontend lightning fast (every 7 days)
        hist_sampled = df_train.iloc[::7].copy()
        if hist_sampled.iloc[-1]["ds"] != df_train.iloc[-1]["ds"]:
            hist_sampled = pd.concat([hist_sampled, df_train.iloc[[-1]]])

        # Subsample forecast points (every 7 days)
        future_only = forecast[forecast["ds"] > latest_actual_date].iloc[::7].copy()
        if not future_only.empty and future_only.iloc[-1]["ds"] != forecast.iloc[-1]["ds"]:
            future_only = pd.concat([future_only, forecast.iloc[[-1]]])

        points = []
        # Historical baseline
        for _, row in hist_sampled.iterrows():
            points.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "actual": round(float(row["y"]), 2),
                "predicted": None,
                "upper": None,
                "lower": None
            })

        # Connect the seam
        points[-1]["predicted"] = points[-1]["actual"]
        points[-1]["upper"] = points[-1]["actual"]
        points[-1]["lower"] = points[-1]["actual"]

        # Future projected curve
        for _, row in future_only.iterrows():
            points.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "actual": None,
                "predicted": round(float(row["yhat"]), 2),
                "upper": round(float(row["yhat_upper"]), 2),
                "lower": max(0.0, round(float(row["yhat_lower"]), 2))
            })

        inr_latest = latest_price if currency == "INR" else latest_price * usd_inr
        inr_future = future_price if currency == "INR" else future_price * usd_inr

        sentiment = "Bullish" if growth_pct > 10 else ("Bearish" if growth_pct < -5 else "Neutral / Moderate")

        return {
            "symbol": ticker_clean,
            "currency": currency,
            "years": years,
            "currentPrice": round(latest_price, 2),
            "projectedPrice": round(future_price, 2),
            "inrCurrent": round(inr_latest, 2),
            "inrProjected": round(inr_future, 2),
            "usdInrRate": round(usd_inr, 2),
            "growthPercent": growth_pct,
            "cagr": cagr,
            "sentiment": sentiment,
            "timeline": points
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

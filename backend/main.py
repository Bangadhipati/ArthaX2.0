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
                symbol = quote.get("symbol")
                quote_type = (quote.get("quoteType") or "EQUITY").upper()
                if symbol and (quote_type in valid_types or len(symbol) <= 12):
                    name = quote.get("shortname") or quote.get("longname") or symbol
                    exchange = quote.get("exchange") or quote.get("exchDisp") or "Global"
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

        return {"results": deduped[:25]}
    except Exception as e:
        return {"results": [], "error": str(e)}


@app.get("/api/stock/{ticker}")
def get_stock_data(ticker: str, range: str = Query("1y", regex="^(1h|6h|12h|24h|1w|1m|6m|1y|5y|max)$")):
    """Fetches historical price candles and company fundamentals with granular intraday support."""
    ticker_clean = ticker.upper().strip()
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

        return {
            "symbol": ticker_clean,
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
    ticker_clean = req.ticker.upper().strip()

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

        return {
            "symbol": ticker_clean,
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
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


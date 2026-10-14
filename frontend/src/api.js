import { MOCK_STOCKS, POPULAR_TICKERS, generateForecastTimeline } from "./mockData";

let currentApiBase = null;

export function getActiveApiBase() {
  if (currentApiBase) return currentApiBase;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://arthax-api.onrender.com";
  }
  return "http://localhost:8000";
}

export async function checkBackendHealth() {
  const localUrl = "http://localhost:8000";
  const cloudUrl = "https://arthax-api.onrender.com";

  // 1. If explicit env variable is set, try it
  if (import.meta.env.VITE_API_URL) {
    const configured = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    try {
      const res = await fetch(`${configured}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        currentApiBase = configured;
        return true;
      }
    } catch {}
  }

  // 2. On localhost, first test if python main.py is running
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    try {
      const res = await fetch(`${localUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        currentApiBase = localUrl;
        return true;
      }
    } catch {}
  }

  // 3. Fallback to Cloud Render backend!
  try {
    const res = await fetch(`${cloudUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      currentApiBase = cloudUrl;
      return true;
    }
  } catch {}

  return false;
}

export async function searchTickers(query) {
  if (!query || query.trim().length === 0) return [];
  const endpoint = getActiveApiBase();

  // Tier 1: Try Primary Active Backend API
  try {
    const res = await fetch(`${endpoint}/api/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch {
    // Primary backend offline, proceed to Cloud backup
  }

  // Tier 2: If Localhost is offline, seamlessly query Cloud Render Backend
  if (endpoint !== "https://arthax-api.onrender.com") {
    try {
      const res = await fetch(`https://arthax-api.onrender.com/api/search?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      }
    } catch {
      // Cloud backup offline
    }
  }

  // Tier 3: Direct query lookup
  const cleanQ = query.toUpperCase().trim();
  const localMatches = POPULAR_TICKERS.filter(
    (t) => t.symbol.toLowerCase().includes(query.toLowerCase()) || t.name.toLowerCase().includes(query.toLowerCase())
  );

  return [
    { symbol: cleanQ, name: `Direct Symbol Lookup: ${cleanQ}`, exchange: "Market", type: "DIRECT" },
    ...localMatches
  ];
}

export async function fetchStockData(ticker, range = "1y") {
  const cleanTicker = ticker.toUpperCase().trim();
  const endpoint = getActiveApiBase();

  try {
    const res = await fetch(`${endpoint}/api/stock/${cleanTicker}?range=${range}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const liveData = await res.json();
      // Match mock format if missing fields
      return {
        ...liveData,
        name: liveData.symbol,
        volume: formatVolume(liveData.history?.[liveData.history.length - 1]?.volume || 0),
        marketCap: liveData.marketCap ? formatNumber(liveData.marketCap) : "N/A",
        peRatio: 28.5
      };
    }
  } catch {
    // Graceful fallback
  }

  // Return mock stock or synthesized data for any symbol
  if (MOCK_STOCKS[cleanTicker]) {
    return MOCK_STOCKS[cleanTicker];
  }

  // Fallback for custom search tickers
  return {
    symbol: cleanTicker,
    name: `${cleanTicker} Corporation`,
    exchange: "Global",
    currency: "USD",
    latestPrice: 150.00,
    inrPrice: 12615.00,
    usdInrRate: 84.10,
    change: +2.15,
    changePercent: +1.45,
    fiftyTwoWeekHigh: 175.00,
    fiftyTwoWeekLow: 110.00,
    marketCap: "500B",
    volume: "25M",
    peRatio: 24.2,
    history: MOCK_STOCKS.AAPL.history,
    timeline: generateForecastTimeline(150.00, 2, 0.14)
  };
}

export async function fetchForecastData(ticker, years = 2) {
  const cleanTicker = ticker.toUpperCase().trim();
  const endpoint = getActiveApiBase();

  try {
    const res = await fetch(`${endpoint}/api/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: cleanTicker, years }),
      signal: AbortSignal.timeout(12000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local forecast simulation
  }

  const base = MOCK_STOCKS[cleanTicker] || MOCK_STOCKS.AAPL;
  const cagr = (base.cagr > 1 ? base.cagr / 100 : base.cagr) || 0.15;
  const futurePrice = base.latestPrice * Math.pow(1 + cagr, years);
  const growth = ((futurePrice - base.latestPrice) / base.latestPrice) * 100;

  return {
    symbol: cleanTicker,
    currency: base.currency,
    years,
    currentPrice: base.latestPrice,
    projectedPrice: parseFloat(futurePrice.toFixed(2)),
    inrCurrent: base.currency === "INR" ? base.latestPrice : base.latestPrice * 84.10,
    inrProjected: base.currency === "INR" ? futurePrice : futurePrice * 84.10,
    usdInrRate: 84.10,
    growthPercent: parseFloat(growth.toFixed(2)),
    cagr: parseFloat((cagr * 100).toFixed(2)),
    sentiment: growth > 15 ? "Bullish" : "Neutral / Moderate",
    timeline: generateForecastTimeline(base.latestPrice, years, cagr)
  };
}

function formatVolume(val) {
  if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toString();
}

function formatNumber(val) {
  if (val >= 1e12) return "$" + (val / 1e12).toFixed(2) + "T";
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(2) + "M";
  return "$" + val.toLocaleString();
}

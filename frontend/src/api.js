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

  // 3. Fallback to Cloud Render backend
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
  const qClean = query.trim();

  // Tier 1: Try Active Backend API (supports case-insensitive queries like "apple", "tata", "tsla")
  try {
    const res = await fetch(`${endpoint}/api/search?q=${encodeURIComponent(qClean)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch {
    // Primary backend offline
  }

  // Tier 2: If Localhost is offline, seamlessly query Cloud Render Backend
  if (endpoint !== "https://arthax-api.onrender.com") {
    try {
      const res = await fetch(`https://arthax-api.onrender.com/api/search?q=${encodeURIComponent(qClean)}`, {
        signal: AbortSignal.timeout(4500)
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

  return [];
}

export async function fetchStockData(ticker, range = "1y") {
  const cleanTicker = ticker.toUpperCase().trim();
  const endpoint = getActiveApiBase();

  try {
    const res = await fetch(`${endpoint}/api/stock/${cleanTicker}?range=${range}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const liveData = await res.json();
      return {
        ...liveData,
        name: liveData.symbol,
        volume: formatVolume(liveData.volume || liveData.history?.[liveData.history.length - 1]?.volume || 0),
        marketCap: liveData.marketCap ? formatNumber(liveData.marketCap) : "N/A",
        peRatio: liveData.peRatio != null ? liveData.peRatio : null
      };
    }
  } catch (err) {
    console.warn("fetchStockData live error:", err);
  }

  // Return null if backend is not live (ZERO fake data)
  return null;
}

export async function fetchForecastData(ticker, years = 2) {
  const cleanTicker = ticker.toUpperCase().trim();
  const endpoint = getActiveApiBase();

  try {
    const res = await fetch(`${endpoint}/api/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: cleanTicker, years }),
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchForecastData live error:", err);
  }

  // Return null if backend is not live (ZERO fake data)
  return null;
}

function formatVolume(val) {
  if (!val) return "N/A";
  if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toString();
}

function formatNumber(val) {
  if (!val) return "N/A";
  if (val >= 1e12) return "$" + (val / 1e12).toFixed(2) + "T";
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(2) + "M";
  return "$" + val.toLocaleString();
}

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroTicker from "./components/HeroTicker";
import StockChart from "./components/StockChart";
import RangeAndDepthControls from "./components/RangeAndDepthControls";
import MetricsGrid from "./components/MetricsGrid";
import IntelligenceCard from "./components/IntelligenceCard";
import { fetchStockData, fetchForecastData, checkBackendHealth } from "./api";
import { POPULAR_TICKERS } from "./mockData";
import { Zap, Loader2, Sparkles, TrendingUp, ShieldCheck, LineChart } from "lucide-react";

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [activeView, setActiveView] = useState("forecast");
  const [selectedRange, setSelectedRange] = useState("1y");
  const [forecastYears, setForecastYears] = useState(2);

  const [stock, setStock] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle"); // "idle" | "connecting" | "live"
  const [loading, setLoading] = useState(false);

  // 1. Initial health ping (checks if backend is already warm or local)
  useEffect(() => {
    checkBackendHealth().then((live) => {
      setAiStatus(live ? "live" : "idle");
    });
  }, []);

  // 2. Load stock historical data
  const loadStock = useCallback(async (sym, rng) => {
    setLoading(true);
    try {
      const data = await fetchStockData(sym, rng);
      if (data) setStock(data);
    } catch (err) {
      console.error("Error loading stock:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Load forecast data
  const loadForecast = useCallback(async (sym, yrs) => {
    try {
      const data = await fetchForecastData(sym, yrs);
      if (data) setForecast(data);
    } catch (err) {
      console.error("Error loading forecast:", err);
    }
  }, []);

  // Fetch only when AI engine is confirmed live
  useEffect(() => {
    if (aiStatus === "live") {
      loadStock(ticker, selectedRange);
    }
  }, [aiStatus, ticker, selectedRange, loadStock]);

  useEffect(() => {
    if (aiStatus === "live") {
      loadForecast(ticker, forecastYears);
    }
  }, [aiStatus, ticker, forecastYears, loadForecast]);

  // On-demand AI wake up trigger
  const handleConnectAI = useCallback(async () => {
    if (aiStatus === "connecting" || aiStatus === "live") return;

    setAiStatus("connecting");
    const startTime = Date.now();
    const maxWaitTime = 45000; // 45 seconds max wait for Render cold-start

    const poll = async () => {
      const isLive = await checkBackendHealth();
      if (isLive) {
        setAiStatus("live");
        return;
      }

      if (Date.now() - startTime < maxWaitTime) {
        setTimeout(poll, 3000);
      } else {
        setAiStatus("idle");
      }
    };

    poll();
  }, [aiStatus]);

  const handleSelectTicker = (newTicker) => {
    setTicker(newTicker.toUpperCase().trim());
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar with Inline Search Dropdown & Genuine FX Status */}
      <Navbar
        aiStatus={aiStatus}
        onConnectAI={handleConnectAI}
        usdInrRate={stock?.usdInrRate}
        onSelectTicker={handleSelectTicker}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: "1180px",
        width: "100%",
        margin: "0 auto",
        padding: "32px 24px 60px",
        flex: 1
      }}>
        {aiStatus === "live" ? (
          <>
            {/* Apple Quick Ticker Tape */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              padding: "8px 4px 14px 4px",
              marginBottom: "12px",
              scrollbarWidth: "none"
            }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginRight: "4px", flexShrink: 0 }}>
                Quick Watch:
              </span>
              {POPULAR_TICKERS.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelectTicker(item.symbol)}
                  className={`apple-button ${ticker === item.symbol ? "apple-button-primary" : ""}`}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  <span>{item.symbol}</span>
                </button>
              ))}
            </div>

            {/* Hero Header with Big Apple Price & Dual Currency */}
            <HeroTicker
              stock={stock}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            {/* Unified Apple Glass Chart Container */}
            <div className="apple-glass" style={{ overflow: "hidden", position: "relative" }}>
              {loading && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(10, 11, 15, 0.4)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  fontSize: "13px",
                  color: "var(--text-secondary)"
                }}>
                  Streaming real-time market data...
                </div>
              )}

              <div style={{ padding: "16px 16px 6px" }}>
                <StockChart
                  activeView={activeView}
                  historyData={stock?.history || []}
                  forecastData={forecast?.timeline || []}
                  currency={stock?.currency || "USD"}
                  stockChange={stock?.change || 0}
                />
              </div>

              {/* Cupertino Controls: Timeframe Pills or Prediction Horizon Slider */}
              <RangeAndDepthControls
                activeView={activeView}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                forecastYears={forecastYears}
                onYearsChange={setForecastYears}
                loading={loading}
              />
            </div>

            {/* Apple 4-Card Frosted Metrics Grid */}
            <MetricsGrid stock={stock} forecast={forecast} />

            {/* AI Narrative & Market Intelligence Insights */}
            <IntelligenceCard stock={stock} forecast={forecast} />
          </>
        ) : aiStatus === "connecting" ? (
          /* Connecting State (No Fake Data) */
          <div className="apple-glass" style={{
            padding: "80px 24px",
            textAlign: "center",
            maxWidth: "680px",
            margin: "40px auto 0"
          }}>
            <Loader2 size={42} className="spin-animation" style={{ color: "var(--apple-gold)", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Connecting to AI Engine...
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 24px" }}>
              Waking up the Python backend server and establishing real-time connections to Yahoo Finance and Meta Prophet.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(255, 214, 10, 0.08)",
              border: "1px solid rgba(255, 214, 10, 0.2)",
              fontSize: "12px",
              color: "var(--apple-gold)"
            }}>
              <span>Estimated wake-up time: 20–40s on free tier</span>
            </div>
          </div>
        ) : (
          /* Idle / Disconnected State (No Fake Data) */
          <div className="apple-glass" style={{
            padding: "70px 32px",
            textAlign: "center",
            maxWidth: "700px",
            margin: "40px auto 0"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0a84ff 0%, #bf5af2 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 24px rgba(10, 132, 255, 0.35)"
            }}>
              <TrendingUp size={28} strokeWidth={2.4} />
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "10px" }}>
              AstraGenX Market Intelligence
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 28px" }}>
              Connect to the live AI engine to stream verified candlestick history, live USD/INR exchange rates, and Meta Prophet Bayesian predictive forecasts.
            </p>

            <button
              onClick={handleConnectAI}
              className="apple-button apple-button-primary"
              style={{
                padding: "12px 28px",
                fontSize: "15px",
                borderRadius: "9999px",
                margin: "0 auto 36px",
                gap: "8px"
              }}
            >
              <Zap size={16} style={{ fill: "#ffffff" }} />
              <span>Connect AI Engine</span>
            </button>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              textAlign: "left"
            }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ color: "var(--apple-green)", marginBottom: "4px" }}><LineChart size={16} /></div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>Real Market Data</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Live Yahoo Finance candlestick stream</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ color: "var(--apple-gold)", marginBottom: "4px" }}><Sparkles size={16} /></div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>Prophet Forecasts</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>1 to 5-year Bayesian trend projections</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ color: "var(--apple-cyan)", marginBottom: "4px" }}><ShieldCheck size={16} /></div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>Genuine Live FX</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Live USD to INR parity conversion</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Minimalist Apple Footer */}
      <footer style={{
        textAlign: "center",
        padding: "24px",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-tertiary)",
        fontSize: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
          <span>ArthaX 2.0 • AstraGenX Financial Intelligence</span>
          <span>•</span>
          <span>Powered by Meta Prophet & Yahoo Finance</span>
        </div>
        <p style={{ margin: 0, color: "var(--text-tertiary)" }}>
          100% Genuine Live Market Streaming. Decoupled Architecture.
        </p>
      </footer>
    </div>
  );
}

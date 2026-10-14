import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroTicker from "./components/HeroTicker";
import StockChart from "./components/StockChart";
import RangeAndDepthControls from "./components/RangeAndDepthControls";
import MetricsGrid from "./components/MetricsGrid";
import IntelligenceCard from "./components/IntelligenceCard";
import Sidebar from "./components/Sidebar";
import ComingSoonPage from "./components/ComingSoonPage";
import { fetchStockData, fetchForecastData, checkBackendHealth } from "./api";
import { POPULAR_TICKERS } from "./mockData";
import { Zap, Loader2, Sparkles, TrendingUp, ShieldCheck, LineChart, Globe } from "lucide-react";

export default function App() {
  const [activePage, setActivePage] = useState("market-intelligence");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [ticker, setTicker] = useState("AAPL");
  const [activeView, setActiveView] = useState("forecast");
  const [selectedRange, setSelectedRange] = useState("1y");
  const [forecastYears, setForecastYears] = useState(2);

  const [stock, setStock] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle"); // "idle" | "connecting" | "live"
  const [stockLoading, setStockLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);

  // 1. Initial health ping (checks if backend is already warm or local)
  useEffect(() => {
    checkBackendHealth().then((live) => {
      setAiStatus(live ? "live" : "idle");
    });
  }, []);

  // 2. Load stock historical data
  const loadStock = useCallback(async (sym, rng) => {
    setStockLoading(true);
    try {
      const data = await fetchStockData(sym, rng);
      if (data) setStock(data);
    } catch (err) {
      console.error("Error loading stock:", err);
    } finally {
      setStockLoading(false);
    }
  }, []);

  // 3. Load forecast data
  const loadForecast = useCallback(async (sym, yrs) => {
    setForecastLoading(true);
    try {
      const data = await fetchForecastData(sym, yrs);
      if (data) setForecast(data);
    } catch (err) {
      console.error("Error loading forecast:", err);
    } finally {
      setForecastLoading(false);
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
    const sym = newTicker.toUpperCase().trim();
    if (sym && sym !== ticker) {
      setTicker(sym);
      setStockLoading(true);
      setForecastLoading(true);
    }
  };

  // Determine dedicated graph loading states to prevent displaying stale chart data
  const isHistoricalLoading = stockLoading || (stock && stock.symbol !== ticker);
  const isForecastLoading = forecastLoading || (forecast && forecast.symbol !== ticker);
  const isGraphLoading = activeView === "historical" ? isHistoricalLoading : isForecastLoading;
  const loading = isGraphLoading;

  // Clean data arrays: never render the previous company's historical candles or forecast curve
  const activeHistoryData = stock && stock.symbol === ticker ? (stock.history || []) : [];
  const activeForecastData = forecast && forecast.symbol === ticker ? (forecast.timeline || []) : [];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        onSelectTicker={handleSelectTicker}
        mobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen((prev) => !prev)}
      />

      {/* Desktop macOS Sidebar & Responsive Main Content */}
      <div className="app-layout-wrapper">
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area (Shifted to right on big screens) */}
        <main className="app-main-content">
          {activePage !== "market-intelligence" ? (
            <ComingSoonPage
              pageId={activePage}
              onBackToIntelligence={() => setActivePage("market-intelligence")}
            />
          ) : (
            <>
              {aiStatus === "live" ? (
          <>
            {/* Top Sub-Header Bar (Attached to right of sidebar, above Quick Watch) */}
            <div className="market-sub-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.01em"
                }}>
                  Market Intelligence
                </span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  background: "rgba(10, 132, 255, 0.12)",
                  color: "var(--apple-blue)"
                }}>
                  Live Terminal
                </span>
              </div>

              {/* Currency exchange value based on asset native (disappears for INR) and beside it Connect AI Live stuff */}
              <div className="market-status-group">
                {/* Dynamic FX exchange value: displays asset native to INR, disappears for Rupees */}
                {(!stock || stock.currency !== "INR") && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-subtle)",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    color: "var(--text-secondary)"
                  }}>
                    <Globe size={13} style={{ color: "var(--apple-cyan)" }} />
                    <span>
                      1 {stock?.currency || "USD"} ={" "}
                      <strong style={{ color: "#ffffff" }}>
                        ₹{Number(stock?.fxRate || stock?.usdInrRate || 84.10).toFixed(2)}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Connect AI Live status pill */}
                {aiStatus === "live" ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "rgba(48, 209, 88, 0.12)",
                    border: "1px solid rgba(48, 209, 88, 0.3)",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--apple-green)"
                  }}>
                    <div
                      className="breathing-dot"
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "var(--apple-green)",
                        boxShadow: "0 0 8px var(--apple-green)"
                      }}
                    />
                    <span>AI is LIVE</span>
                  </div>
                ) : aiStatus === "connecting" ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 214, 10, 0.12)",
                    border: "1px solid rgba(255, 214, 10, 0.3)",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--apple-gold)"
                  }}>
                    <Loader2 size={13} className="spin-animation" style={{ color: "var(--apple-gold)" }} />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectAI}
                    className="apple-button apple-button-primary"
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 600
                    }}
                  >
                    <Zap size={13} />
                    <span>Connect AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Apple Quick Ticker Tape */}
            <div className="quick-watch-tape">
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginRight: "4px", flexShrink: 0 }}>
                Quick Watch:
              </span>
              {POPULAR_TICKERS.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelectTicker(item.symbol)}
                  className={`apple-button ${ticker === item.symbol ? "apple-button-primary" : ""}`}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11.5px",
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
              {isGraphLoading && (
                <div className="chart-loading-overlay">
                  <div className="chart-loading-content">
                    <div className="chart-loading-spinner-wrapper">
                      <div className="chart-loading-pulse-ring" />
                      <Loader2 size={32} className="spin-animation chart-loading-icon" />
                    </div>
                    <div className="chart-loading-meta">
                      <div className="chart-loading-title">
                        {activeView === "historical"
                          ? `Syncing ${ticker} Market History...`
                          : `Generating AI Trajectory for ${ticker}...`}
                      </div>
                      <div className="chart-loading-subtitle">
                        {activeView === "historical"
                          ? "Streaming real-time order ticks, FX conversion & OHLC candles"
                          : "Synthesizing historical seasonality & calibrating 95% confidence corridor"}
                      </div>
                    </div>
                    <div className="chart-loading-bar-track">
                      <div className="chart-loading-bar-fill" />
                    </div>
                  </div>
                </div>
              )}

              <div className="stock-chart-wrapper">
                <StockChart
                  activeView={activeView}
                  historyData={activeHistoryData}
                  forecastData={activeForecastData}
                  currency={stock?.symbol === ticker ? (stock?.currency || "USD") : "USD"}
                  stockChange={stock?.symbol === ticker ? (stock?.change || 0) : 0}
                  fxRate={stock?.symbol === ticker ? (stock?.fxRate || stock?.usdInrRate || 84.10) : 84.10}
                  usdInrRate={stock?.symbol === ticker ? (stock?.usdInrRate || 84.10) : 84.10}
                />
              </div>

              {/* Cupertino Controls: Timeframe Pills or Prediction Horizon Slider */}
              <RangeAndDepthControls
                activeView={activeView}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                forecastYears={forecastYears}
                onYearsChange={setForecastYears}
                loading={isGraphLoading}
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
              Waking up the Python backend server and establishing real-time connections to Global Market Feeds and Meta Prophet.
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
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Live Institutional candlestick stream</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ color: "var(--apple-gold)", marginBottom: "4px" }}><Sparkles size={16} /></div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>AI Forecasts</div>
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
            </>
          )}
      </main>
      </div>
    </div>
  );
}

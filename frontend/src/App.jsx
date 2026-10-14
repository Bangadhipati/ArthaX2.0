import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroTicker from "./components/HeroTicker";
import StockChart from "./components/StockChart";
import RangeAndDepthControls from "./components/RangeAndDepthControls";
import MetricsGrid from "./components/MetricsGrid";
import IntelligenceCard from "./components/IntelligenceCard";
import Sidebar from "./components/Sidebar";
import ComingSoonPage from "./components/ComingSoonPage";
import SpiderLoadingAnimation from "./components/SpiderLoadingAnimation";
import { fetchStockData, fetchForecastData, checkBackendHealth } from "./api";
import { POPULAR_TICKERS, MOCK_STOCKS } from "./mockData";
import { Zap, Loader2, Sparkles, TrendingUp, ShieldCheck, LineChart, Globe } from "lucide-react";

export default function App() {
  const [activePage, setActivePage] = useState("market-intelligence");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [ticker, setTicker] = useState("AAPL");
  const [activeView, setActiveView] = useState("forecast");
  const [selectedRange, setSelectedRange] = useState("1y");
  const [forecastYears, setForecastYears] = useState(2);
  const [forecastHorizon, setForecastHorizon] = useState("2y");

  // Initialize with authentic baseline so Market Intelligence page renders immediately without empty flashes
  const [stock, setStock] = useState(MOCK_STOCKS.AAPL);
  const [forecast, setForecast] = useState(null);
  const [aiStatus, setAiStatus] = useState("connecting"); // "idle" | "connecting" | "live"
  const [stockLoading, setStockLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);

  // 1. Continuous auto-poll: as soon as Render turns on the server, live data streams in automatically
  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;
    let attempts = 0;

    const check = async () => {
      try {
        const live = await checkBackendHealth();
        if (live && isMounted) {
          setAiStatus("live");
          return; // Connected, stop polling
        }
      } catch (err) {
        // Backend waking up
      }

      attempts++;
      // After ~35-40 seconds, switch to "idle" state so user sees "AI Cloud Server Asleep"
      // with a direct Connect button instead of spinning forever if Render is off
      if (attempts >= 5 && isMounted) {
        setAiStatus("idle");
      }

      if (isMounted) {
        pollTimer = setTimeout(check, 6000);
      }
    };

    check();

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
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
  const loadForecast = useCallback(async (sym, yrs, hrz = "2y") => {
    setForecastLoading(true);
    try {
      const data = await fetchForecastData(sym, yrs, hrz);
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
      loadForecast(ticker, forecastYears, forecastHorizon);
    }
  }, [aiStatus, ticker, forecastYears, forecastHorizon, loadForecast]);

  // Manual trigger for Connect AI button at the top header or in chart
  const handleConnectAI = useCallback(async () => {
    if (aiStatus === "live") return;
    setAiStatus("connecting");
    try {
      const isLive = await checkBackendHealth();
      if (isLive) {
        setAiStatus("live");
      }
    } catch (err) {
      console.error("Health check error:", err);
    }
  }, [aiStatus]);

  const handleSelectTicker = (newTicker) => {
    const sym = newTicker.toUpperCase().trim();
    if (sym && sym !== ticker) {
      setTicker(sym);
      if (MOCK_STOCKS[sym]) {
        setStock(MOCK_STOCKS[sym]);
      }
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
                  {(!stock || (stock.currency !== "INR" && !ticker.endsWith(".NS") && !ticker.endsWith(".BO"))) && (
                    (aiStatus !== "live" || stockLoading || stock?.symbol !== ticker || (!stock?.fxRate && !stock?.usdInrRate)) ? (
                      <div
                        className="skeleton-card"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--border-subtle)",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          color: "var(--text-secondary)"
                        }}
                      >
                        <Globe size={13} className="spin-animation" style={{ color: "var(--apple-cyan)" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          1 {stock?.currency || "USD"} =
                        </span>
                        <span className="skeleton-shimmer" style={{ width: "42px", height: "13px", borderRadius: "4px" }} />
                      </div>
                    ) : (
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
                            ₹{Number(stock.fxRate || stock.usdInrRate).toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    )
                  )}

                  {/* Connect AI Live status pill / button */}
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
                loading={aiStatus !== "live" || isHistoricalLoading}
              />

              {/* Unified Apple Glass Chart Container with Spider Radar Loading */}
              <div className="apple-glass" style={{ overflow: "hidden", position: "relative" }}>
                {aiStatus !== "live" ? (
                  <SpiderLoadingAnimation
                    status={aiStatus}
                    onConnect={handleConnectAI}
                  />
                ) : (
                  <>
                    {isGraphLoading && (
                      <div className="chart-loading-overlay">
                        <SpiderLoadingAnimation status="connecting" />
                      </div>
                    )}

                    <div className="stock-chart-wrapper">
                      <StockChart
                        activeView={activeView}
                        historyData={activeHistoryData}
                        forecastData={activeForecastData}
                        projectedCandles={forecast?.projectedCandles || []}
                        currency={stock?.symbol === ticker ? (stock?.currency || "USD") : "USD"}
                        stockChange={stock?.symbol === ticker ? (stock?.change || 0) : 0}
                        fxRate={stock?.symbol === ticker ? (stock?.fxRate || stock?.usdInrRate) : null}
                        usdInrRate={stock?.symbol === ticker ? (stock?.usdInrRate) : null}
                      />
                    </div>
                  </>
                )}

                {/* Cupertino Controls: Timeframe Pills or Prediction Horizon Slider */}
                <RangeAndDepthControls
                  activeView={activeView}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                  forecastYears={forecastYears}
                  onYearsChange={(y) => {
                    setForecastYears(y);
                    setForecastHorizon(`${y}y`);
                  }}
                  forecastHorizon={forecastHorizon}
                  onHorizonChange={(hrz) => {
                    setForecastHorizon(hrz);
                    if (hrz.endsWith("y") && hrz.slice(0, -1)) {
                      setForecastYears(parseInt(hrz.slice(0, -1), 10));
                    }
                  }}
                  loading={isGraphLoading}
                />
              </div>

              {/* Apple 4-Card Frosted Metrics Grid */}
              <MetricsGrid
                stock={stock}
                forecast={forecast}
                loading={aiStatus !== "live" || isGraphLoading}
              />

              {/* AI Narrative & Market Intelligence Insights */}
              <IntelligenceCard
                stock={stock}
                forecast={forecast}
                loading={aiStatus !== "live" || isForecastLoading}
              />
            </>
          )}
      </main>
      </div>
    </div>
  );
}

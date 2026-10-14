import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import SpotlightModal from "./components/SpotlightModal";
import HeroTicker from "./components/HeroTicker";
import StockChart from "./components/StockChart";
import RangeAndDepthControls from "./components/RangeAndDepthControls";
import MetricsGrid from "./components/MetricsGrid";
import IntelligenceCard from "./components/IntelligenceCard";
import { fetchStockData, fetchForecastData, checkBackendHealth } from "./api";
import { POPULAR_TICKERS, MOCK_STOCKS } from "./mockData";

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [activeView, setActiveView] = useState("forecast");
  const [selectedRange, setSelectedRange] = useState("1y");
  const [forecastYears, setForecastYears] = useState(2);

  const [stock, setStock] = useState(MOCK_STOCKS.AAPL);
  const [forecast, setForecast] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle"); // "idle" | "connecting" | "live"
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Initial health ping (checks if already warm/local)
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
      setStock(data);
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
      setForecast(data);
    } catch (err) {
      console.error("Error loading forecast:", err);
    }
  }, []);

  useEffect(() => {
    loadStock(ticker, selectedRange);
  }, [ticker, selectedRange, loadStock]);

  useEffect(() => {
    loadForecast(ticker, forecastYears);
  }, [ticker, forecastYears, loadForecast]);

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
        // Immediately reload active stock and forecast with live data
        loadStock(ticker, selectedRange);
        loadForecast(ticker, forecastYears);
        return;
      }

      if (Date.now() - startTime < maxWaitTime) {
        setTimeout(poll, 3000);
      } else {
        setAiStatus("idle");
      }
    };

    poll();
  }, [aiStatus, ticker, selectedRange, forecastYears, loadStock, loadForecast]);

  const handleSelectTicker = (newTicker) => {
    setTicker(newTicker);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        aiStatus={aiStatus}
        onConnectAI={handleConnectAI}
        usdInrRate={stock?.usdInrRate}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: "1180px",
        width: "100%",
        margin: "0 auto",
        padding: "32px 24px 60px",
        flex: 1
      }}>
        {/* Apple Quick Ticker Tape */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "16px",
          marginBottom: "16px",
          scrollbarWidth: "none"
        }}>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginRight: "4px" }}>
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
                whiteSpace: "nowrap"
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
              Updating market data...
            </div>
          )}

          <div style={{ padding: "16px 16px 6px" }}>
            <StockChart
              activeView={activeView}
              historyData={stock?.history || []}
              forecastData={forecast?.timeline || stock?.timeline || []}
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
      </main>

      {/* Apple macOS Spotlight Modal */}
      <SpotlightModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTicker={handleSelectTicker}
      />

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
          Designed with Apple Cupertino design philosophy. 100% Private, Decoupled Architecture.
        </p>
      </footer>
    </div>
  );
}

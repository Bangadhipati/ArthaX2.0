import React from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles, LineChart } from "lucide-react";

export default function HeroTicker({
  stock,
  activeView,
  onViewChange,
  loading = false
}) {
  if (loading || !stock) {
    return (
      <div className="hero-ticker-container skeleton-card">
        {/* Skeleton Ticker & Price Hierarchy */}
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Symbol, Name & Exchange skeleton */}
          <div className="hero-ticker-header" style={{ gap: "10px" }}>
            <span className="skeleton-shimmer" style={{ width: "95px", height: "30px", borderRadius: "8px" }} />
            <span className="skeleton-shimmer" style={{ width: "160px", height: "18px", borderRadius: "6px" }} />
            <span className="skeleton-shimmer" style={{ width: "65px", height: "18px", borderRadius: "9999px" }} />
          </div>

          {/* Big Price + FX + Change skeleton */}
          <div className="hero-price-row" style={{ marginTop: "10px", gap: "12px", alignItems: "center" }}>
            <span className="skeleton-shimmer" style={{ width: "165px", height: "42px", borderRadius: "10px" }} />
            <span className="skeleton-shimmer" style={{ width: "115px", height: "26px", borderRadius: "9999px" }} />
            <span className="skeleton-shimmer" style={{ width: "95px", height: "26px", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* View Switcher remains accessible */}
        <div className="segmented-control hero-segmented-switcher">
          <button
            className={`segmented-option hero-segmented-btn ${activeView === "historical" ? "active" : ""}`}
            onClick={() => onViewChange("historical")}
          >
            <LineChart size={14} />
            <span>Historical</span>
          </button>
          <button
            className={`segmented-option hero-segmented-btn ${activeView === "forecast" ? "active" : ""}`}
            onClick={() => onViewChange("forecast")}
            style={activeView === "forecast" ? { color: "var(--apple-gold)" } : {}}
          >
            <Sparkles size={14} style={{ color: "var(--apple-gold)" }} />
            <span>AI Projection</span>
          </button>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const currencySymbol = stock.currency === "INR" ? "₹" : (stock.currency === "USD" ? "$" : `${stock.currency} `);

  return (
    <div className="hero-ticker-container">
      {/* Ticker & Price Hierarchy */}
      <div style={{ minWidth: 0, flex: 1 }}>
        {/* Symbol, Name & Exchange pill */}
        <div className="hero-ticker-header">
          <h1 className="hero-symbol">
            {stock.symbol}
          </h1>
          <span className="hero-name" title={stock.name}>
            {stock.name}
          </span>
          <span className="hero-exchange">
            {stock.exchange || "GLOBAL"}
          </span>
        </div>

        {/* Big Apple Price + Dual Currency Conversion */}
        <div className="hero-price-row">
          <div className="hero-price">
            {currencySymbol}{stock.latestPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Dual Currency INR conversion pill */}
          {stock.currency !== "INR" && (
            <div className="hero-fx-pill">
              <span>≈ ₹{stock.inrPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* 24h Change Pill */}
          <div
            className="hero-change-pill"
            style={{
              background: isPositive ? "var(--apple-green-glow)" : "var(--apple-red-glow)",
              border: `1px solid ${isPositive ? "rgba(48, 209, 88, 0.3)" : "rgba(255, 69, 58, 0.3)"}`,
              color: isPositive ? "var(--apple-green)" : "var(--apple-red)"
            }}
          >
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>
              {isPositive ? "+" : ""}{stock.changePercent?.toFixed(2)}%
            </span>
            <span className="hero-change-diff">
              ({isPositive ? "+" : ""}{stock.change?.toFixed(2)})
            </span>
          </div>
        </div>
      </div>

      {/* Apple-Style Segmented View Switcher */}
      <div className="segmented-control hero-segmented-switcher">
        <button
          className={`segmented-option hero-segmented-btn ${activeView === "historical" ? "active" : ""}`}
          onClick={() => onViewChange("historical")}
        >
          <LineChart size={14} />
          <span>Historical</span>
        </button>
        <button
          className={`segmented-option hero-segmented-btn ${activeView === "forecast" ? "active" : ""}`}
          onClick={() => onViewChange("forecast")}
          style={activeView === "forecast" ? { color: "var(--apple-gold)" } : {}}
        >
          <Sparkles size={14} style={{ color: "var(--apple-gold)" }} />
          <span>AI Projection</span>
        </button>
      </div>
    </div>
  );
}

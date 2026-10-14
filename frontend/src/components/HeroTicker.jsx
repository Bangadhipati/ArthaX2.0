import React from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles, LineChart } from "lucide-react";

export default function HeroTicker({
  stock,
  activeView,
  onViewChange
}) {
  if (!stock) return null;

  const isPositive = stock.change >= 0;
  const currencySymbol = stock.currency === "INR" ? "₹" : (stock.currency === "USD" ? "$" : `${stock.currency} `);

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "24px"
    }}>
      {/* Ticker & Price Hierarchy */}
      <div>
        {/* Symbol & Exchange pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h1 style={{
            fontSize: "26px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em"
          }}>
            {stock.symbol}
          </h1>
          <span style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            fontWeight: 400
          }}>
            {stock.name}
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--text-secondary)"
          }}>
            {stock.exchange || "GLOBAL"}
          </span>
        </div>

        {/* Big Apple Price + Dual Currency Conversion */}
        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "14px" }}>
          <div style={{
            fontSize: "42px",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.03em",
            color: "#ffffff",
            lineHeight: 1
          }}>
            {currencySymbol}{stock.latestPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Dual Currency INR conversion pill */}
          {stock.currency !== "INR" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-subtle)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#d1d5db"
            }}>
              <span>≈ ₹{stock.inrPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* 24h Change Pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "9999px",
            background: isPositive ? "var(--apple-green-glow)" : "var(--apple-red-glow)",
            border: `1px solid ${isPositive ? "rgba(48, 209, 88, 0.3)" : "rgba(255, 69, 58, 0.3)"}`,
            color: isPositive ? "var(--apple-green)" : "var(--apple-red)",
            fontSize: "13px",
            fontWeight: 600
          }}>
            {isPositive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            <span>
              {isPositive ? "+" : ""}{stock.changePercent?.toFixed(2)}%
            </span>
            <span style={{ opacity: 0.8, fontSize: "12px", marginLeft: "2px" }}>
              ({isPositive ? "+" : ""}{stock.change?.toFixed(2)})
            </span>
          </div>
        </div>
      </div>

      {/* Apple-Style Segmented View Switcher */}
      <div className="segmented-control">
        <button
          className={`segmented-option ${activeView === "historical" ? "active" : ""}`}
          onClick={() => onViewChange("historical")}
        >
          <LineChart size={15} />
          <span>Historical</span>
        </button>
        <button
          className={`segmented-option ${activeView === "forecast" ? "active" : ""}`}
          onClick={() => onViewChange("forecast")}
          style={activeView === "forecast" ? { color: "var(--apple-gold)" } : {}}
        >
          <Sparkles size={15} style={{ color: "var(--apple-gold)" }} />
          <span>AI Projection</span>
        </button>
      </div>
    </div>
  );
}

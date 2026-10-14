import React from "react";
import { Target, TrendingUp, BarChart3, Coins, Layers } from "lucide-react";

export default function MetricsGrid({ stock, forecast }) {
  if (!stock) return null;

  const currencySymbol = stock.currency === "INR" ? "₹" : (stock.currency === "USD" ? "$" : `${stock.currency} `);

  // Calculate 52W range progress percentage from live data
  const low = stock.fiftyTwoWeekLow != null ? stock.fiftyTwoWeekLow : (stock.latestPrice || 0);
  const high = stock.fiftyTwoWeekHigh != null ? stock.fiftyTwoWeekHigh : (stock.latestPrice || 0);
  const current = stock.latestPrice || low;
  const rangePercent = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50;

  const projectedPrice = forecast?.projectedPrice ?? stock.projectedPrice;
  const growth = forecast?.growthPercent ?? stock.growthPercent;
  const cagr = forecast?.cagr ?? stock.cagr;
  const years = forecast?.years ?? stock.years ?? 2;
  const inrProjected = forecast?.inrProjected ?? stock.inrProjected;

  const isGrowthPositive = (growth || 0) >= 0;

  return (
    <div className="metrics-grid">
      {/* Card 1: AI Price Target */}
      <div className="apple-glass metric-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Target ({years}Y)
          </span>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "rgba(255, 214, 10, 0.12)",
            color: "var(--apple-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Target size={15} />
          </div>
        </div>

        <div style={{ fontSize: "clamp(24px, 5.5vw, 28px)", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
          {currencySymbol}{projectedPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {stock.currency !== "INR" && (
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            ≈ ₹{inrProjected?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background: isGrowthPositive ? "var(--apple-green-glow)" : "var(--apple-red-glow)",
            color: isGrowthPositive ? "var(--apple-green)" : "var(--apple-red)",
            whiteSpace: "nowrap"
          }}>
            {isGrowthPositive ? "+" : ""}{growth?.toFixed(2)}% ROI
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            CAGR: {cagr?.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Card 2: 52-Week Range Gauge */}
      <div className="apple-glass metric-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            52-Week Price Range
          </span>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "rgba(10, 132, 255, 0.12)",
            color: "var(--apple-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BarChart3 size={15} />
          </div>
        </div>

        {/* Visual progress track */}
        <div style={{
          position: "relative",
          height: "8px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "9999px",
          marginTop: "16px",
          marginBottom: "12px",
          marginRight: "4px",
          marginLeft: "4px",
          overflow: "visible"
        }}>
          <div style={{
            height: "100%",
            width: `${rangePercent}%`,
            background: "linear-gradient(90deg, #0a84ff 0%, #30d158 100%)",
            borderRadius: "9999px"
          }} />
          {/* Position pin */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: `${rangePercent}%`,
            transform: "translate(-50%, -50%)",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
            border: "2px solid #0a84ff"
          }} />
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "clamp(10px, 2.7vw, 12px)",
          color: "var(--text-secondary)",
          gap: "4px"
        }}>
          <span style={{ whiteSpace: "nowrap" }}>Low: {currencySymbol}{low}</span>
          <span style={{ color: "#ffffff", fontWeight: 600, whiteSpace: "nowrap" }}>Cur: {currencySymbol}{current}</span>
          <span style={{ whiteSpace: "nowrap" }}>High: {currencySymbol}{high}</span>
        </div>
      </div>

      {/* Card 3: Key Fundamentals */}
      <div className="apple-glass metric-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Valuation & Fundamentals
          </span>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "rgba(191, 90, 242, 0.12)",
            color: "var(--apple-purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Layers size={15} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>Market Cap</span>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#ffffff" }}>{stock.marketCap || "N/A"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>24h Volume</span>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#ffffff" }}>{stock.volume || "N/A"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>P/E Ratio</span>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#ffffff" }}>{stock.peRatio ? `${stock.peRatio}x` : "N/A"}</span>
        </div>
      </div>

      {/* Card 4: Currency & Real-time FX Conversion */}
      <div className="apple-glass metric-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Currency & FX Intelligence
          </span>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "rgba(48, 209, 88, 0.12)",
            color: "var(--apple-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Coins size={15} />
          </div>
        </div>

        <div style={{ fontSize: "13.5px", color: "#ffffff", fontWeight: 600, marginBottom: "4px" }}>
          Asset Native: {stock.currency}
        </div>
        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "10px" }}>
          Converted in real time to INR via live Yahoo FX stream.
        </div>

        <div style={{
          padding: "7px 12px",
          borderRadius: "8px",
          background: "rgba(255, 255, 255, 0.04)",
          fontSize: "12px",
          color: "var(--apple-cyan)",
          fontWeight: 500
        }}>
          1 USD = ₹{stock.usdInrRate || "84.10"}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Sparkles, ShieldAlert, Cpu } from "lucide-react";

export default function IntelligenceCard({ stock, forecast }) {
  if (!stock) return null;

  const sentiment = forecast?.sentiment ?? stock.sentiment ?? "Bullish";
  const years = forecast?.years ?? stock.years ?? 2;
  const growth = forecast?.growthPercent ?? stock.growthPercent ?? 0;
  const isPositive = growth >= 0;

  return (
    <div className="apple-glass intelligence-card-wrapper">
      <div className="intelligence-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)",
            color: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Sparkles size={16} strokeWidth={2.4} />
          </div>
          <div>
            <h3 style={{ fontSize: "clamp(14px, 3.8vw, 16px)", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              AstraGenX Prophet Intelligence
            </h3>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0 }}>
              Non-linear additive time-series decomposition modeling
            </p>
          </div>
        </div>

        {/* Sentiment Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 12px",
          borderRadius: "9999px",
          background: isPositive ? "rgba(48, 209, 88, 0.12)" : "rgba(255, 69, 58, 0.12)",
          border: `1px solid ${isPositive ? "rgba(48, 209, 88, 0.3)" : "rgba(255, 69, 58, 0.3)"}`,
          fontSize: "12px",
          fontWeight: 600,
          color: isPositive ? "var(--apple-green)" : "var(--apple-red)",
          whiteSpace: "nowrap"
        }}>
          <span>{sentiment} Outlook</span>
        </div>
      </div>

      {/* Intelligence Insights Summary */}
      <div className="intelligence-body">
        <p style={{ marginBottom: "8px" }}>
          Meta's Prophet engine has processed historical price patterns for <strong>{stock.symbol}</strong>, stripping out market seasonality, weekend volatility, and structural macroeconomic trend shifts.
        </p>
        <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <li>
            <strong>Trajectory Horizon:</strong> Projections over a <strong>{years}-year span</strong> suggest an anticipated price direction of <strong>{isPositive ? "+" : ""}{growth.toFixed(2)}%</strong>.
          </li>
          <li>
            <strong>Confidence Corridor:</strong> The Bayesian upper and lower bands represent the 95% posterior probability boundary, accounting for market variance and standard volatility clustering.
          </li>
          <li>
            <strong>Global FX Valuation:</strong> Reflects dual currency parity using live rates for international and domestic market perspective.
          </li>
        </ul>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "14px",
        fontSize: "11px",
        color: "var(--text-tertiary)"
      }}>
        <ShieldAlert size={12} />
        <span>ArthaX AI projections are probabilistic algorithmic models and should not be construed as investment advice.</span>
      </div>
    </div>
  );
}

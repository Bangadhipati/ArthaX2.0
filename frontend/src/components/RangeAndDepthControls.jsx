import React from "react";
import { Sliders, Calendar } from "lucide-react";

export default function RangeAndDepthControls({
  activeView,
  selectedRange,
  onRangeChange,
  forecastYears,
  onYearsChange,
  loading
}) {
  const ranges = ["1h", "6h", "12h", "24h", "1w", "1m", "6m", "1y", "5y", "max"];

  return (
    <div className="chart-controls-bar">
      {activeView === "historical" ? (
        <div className="timeframe-group">
          <span className="hide-on-mobile" style={{ fontSize: "12px", color: "var(--text-secondary)", marginRight: "4px" }}>
            Timeframe:
          </span>
          <div className="segmented-control timeframe-segmented-control">
            {ranges.map((r) => (
              <button
                key={r}
                className={`segmented-option timeframe-btn ${selectedRange === r ? "active" : ""}`}
                onClick={() => onRangeChange(r)}
                disabled={loading}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="timeframe-group horizon-btn-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--apple-gold)", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", marginRight: "4px" }}>
            <Calendar size={14} />
            <span>Horizon:</span>
          </div>

          <div className="segmented-control timeframe-segmented-control">
            {[1, 2, 3, 4, 5].map((y) => (
              <button
                key={y}
                className={`segmented-option timeframe-btn ${forecastYears === y ? "active active-gold" : ""}`}
                onClick={() => onYearsChange(y)}
                disabled={loading}
                title={`${y} Year${y > 1 ? "s" : ""} AI Prediction Horizon`}
              >
                <span className="horizon-long">{y} {y === 1 ? "Year" : "Years"}</span>
                <span className="horizon-short">{y}Y</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtle Data Mode Status */}
      <div className="hide-on-mobile" style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Calendar size={12} />
        <span>Hardware Accelerated Engine</span>
      </div>
    </div>
  );
}

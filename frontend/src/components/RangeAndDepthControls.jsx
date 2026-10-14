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
  const ranges = ["1m", "6m", "1y", "5y", "max"];

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
        <div className="horizon-group" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "520px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--apple-gold)", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
            <Sliders size={15} />
            <span>Horizon:</span>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={forecastYears}
              onChange={(e) => onYearsChange(parseInt(e.target.value))}
              disabled={loading}
              className="cupertino-slider"
            />
            <span style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#ffffff",
              minWidth: "55px",
              padding: "4px 8px",
              borderRadius: "8px",
              background: "rgba(255, 214, 10, 0.12)",
              border: "1px solid rgba(255, 214, 10, 0.25)",
              textAlign: "center",
              whiteSpace: "nowrap"
            }}>
              {forecastYears} {forecastYears === 1 ? "Yr" : "Yrs"}
            </span>
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

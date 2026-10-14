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
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "16px",
      padding: "16px 20px",
      borderTop: "1px solid var(--border-subtle)",
      background: "rgba(10, 11, 15, 0.4)",
      borderBottomLeftRadius: "20px",
      borderBottomRightRadius: "20px"
    }}>
      {activeView === "historical" ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginRight: "4px" }}>
            Timeframe:
          </span>
          <div className="segmented-control">
            {ranges.map((r) => (
              <button
                key={r}
                className={`segmented-option ${selectedRange === r ? "active" : ""}`}
                onClick={() => onRangeChange(r)}
                disabled={loading}
                style={{ textTransform: "uppercase" }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%", maxWidth: "520px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--apple-gold)", fontSize: "13px", fontWeight: 600 }}>
            <Sliders size={16} />
            <span>Horizon:</span>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
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
              fontSize: "13px",
              fontWeight: 600,
              color: "#ffffff",
              minWidth: "65px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(255, 214, 10, 0.12)",
              border: "1px solid rgba(255, 214, 10, 0.25)",
              textAlign: "center"
            }}>
              {forecastYears} {forecastYears === 1 ? "Year" : "Years"}
            </span>
          </div>
        </div>
      )}

      {/* Subtle Data Mode Status */}
      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Calendar size={12} />
        <span>Hardware Accelerated Engine</span>
      </div>
    </div>
  );
}

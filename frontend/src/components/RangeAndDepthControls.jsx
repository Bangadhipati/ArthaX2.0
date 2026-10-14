import React from "react";
import { Sliders, Calendar, Sparkles } from "lucide-react";

export default function RangeAndDepthControls({
  activeView,
  selectedRange,
  onRangeChange,
  forecastYears,
  onYearsChange,
  forecastHorizon = "2y",
  onHorizonChange,
  loading
}) {
  const ranges = ["1h", "6h", "12h", "24h", "1w", "1m", "6m", "1y", "5y", "max"];

  const forecastHorizons = [
    { key: "1d", labelLong: "1 Day (Intraday)", labelShort: "1D", title: "Next 24H Intraday AI Trajectory (15m/1m intervals)" },
    { key: "1w", labelLong: "1 Week", labelShort: "1W", title: "Next 7 Days AI Trajectory (Hourly intervals)" },
    { key: "1m", labelLong: "1 Month", labelShort: "1M", title: "Next 30 Days AI Trajectory (Daily intervals)" },
    { key: "1y", labelLong: "1 Year", labelShort: "1Y", title: "1 Year Macro AI Trajectory" },
    { key: "2y", labelLong: "2 Years", labelShort: "2Y", title: "2 Years Macro AI Trajectory" },
    { key: "3y", labelLong: "3 Years", labelShort: "3Y", title: "3 Years Macro AI Trajectory" },
    { key: "5y", labelLong: "5 Years", labelShort: "5Y", title: "5 Years Macro AI Trajectory" }
  ];

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
            {forecastHorizons.map((h) => {
              const isActive = forecastHorizon === h.key;
              return (
                <button
                  key={h.key}
                  className={`segmented-option timeframe-btn ${isActive ? "active active-gold" : ""}`}
                  onClick={() => {
                    if (onHorizonChange) onHorizonChange(h.key);
                    if (onYearsChange && h.key.endsWith("y")) {
                      onYearsChange(parseInt(h.key.slice(0, -1), 10));
                    }
                  }}
                  disabled={loading}
                  title={h.title}
                >
                  <span className="horizon-long">{h.labelLong}</span>
                  <span className="horizon-short">{h.labelShort}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* External Forecast Legend (Placed outside graph to avoid any overlapping) */}
      {activeView === "forecast" ? (
        <div className="forecast-external-legend">
          <div className="forecast-legend-pill">
            <span className="forecast-legend-line" />
            <span className="forecast-legend-text">AI Trajectory</span>
          </div>
          <div className="forecast-legend-pill">
            <span className="forecast-legend-band" />
            <span className="forecast-legend-text">Confidence Corridor</span>
          </div>
        </div>
      ) : (
        <div className="hide-on-mobile" style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={12} style={{ color: "var(--apple-blue)" }} />
          <span>Hardware Accelerated Engine</span>
        </div>
      )}
    </div>
  );
}

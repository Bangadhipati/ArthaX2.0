import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";

export default function StockChart({
  activeView,
  historyData = [],
  forecastData = [],
  currency = "USD",
  stockChange = 0
}) {
  const isPositive = stockChange >= 0;
  const currSymbol = currency === "INR" ? "₹" : (currency === "USD" ? "$" : `${currency} `);

  // Compute domain bounds dynamically with breathing room
  let minY = Infinity;
  let maxY = -Infinity;

  if (activeView === "historical") {
    historyData.forEach((d) => {
      if (d.close < minY) minY = d.close;
      if (d.close > maxY) maxY = d.close;
    });
  } else {
    forecastData.forEach((d) => {
      const val = d.actual ?? d.predicted;
      const upper = d.upper ?? val;
      const lower = d.lower ?? val;
      if (lower !== null && lower < minY) minY = lower;
      if (upper !== null && upper > maxY) maxY = upper;
    });
  }

  if (minY === Infinity || maxY === -Infinity) {
    minY = 100;
    maxY = 200;
  }

  const padding = (maxY - minY) * 0.1 || 10;
  const domain = [Math.floor(minY - padding), Math.ceil(maxY + padding)];

  return (
    <div style={{ width: "100%", height: "380px", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        {activeView === "historical" ? (
          <AreaChart data={historyData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "var(--apple-green)" : "var(--apple-blue)"}
                  stopOpacity={0.28}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "var(--apple-green)" : "var(--apple-blue)"}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#515156"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => {
                const parts = d.split("-");
                return `${parts[1]}/${parts[2] || ""}`;
              }}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              stroke="#515156"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              orientation="right"
              tickFormatter={(v) => `${currSymbol}${v}`}
            />
            <Tooltip
              content={<CustomHistoricalTooltip currSymbol={currSymbol} />}
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "var(--apple-green)" : "var(--apple-blue)"}
              strokeWidth={2.2}
              fillOpacity={1}
              fill="url(#historicalGradient)"
            />
          </AreaChart>
        ) : (
          <AreaChart data={forecastData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {/* Golden Prophet Confidence Corridor */}
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd60a" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#ffd60a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#515156"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => {
                const parts = d.split("-");
                return `${parts[0].slice(2)}/${parts[1]}`;
              }}
              minTickGap={45}
            />
            <YAxis
              domain={domain}
              stroke="#515156"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              orientation="right"
              tickFormatter={(v) => `${currSymbol}${v}`}
            />
            <Tooltip
              content={<CustomForecastTooltip currSymbol={currSymbol} />}
              cursor={{ stroke: "rgba(255,214,10,0.3)", strokeDasharray: "3 3" }}
            />
            {/* Confidence Band: Upper bound minus lower bound */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill="url(#confidenceGradient)"
            />
            {/* Baseline actual price line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#38bdf8"
              strokeWidth={2.4}
              dot={false}
            />
            {/* Future Prophet predicted line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#ffd60a"
              strokeWidth={2.6}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Legend Badge for Forecast View */}
      {activeView === "forecast" && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "14px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "rgba(18, 20, 26, 0.8)",
          backdropFilter: "blur(12px)",
          padding: "6px 14px",
          borderRadius: "9999px",
          border: "1px solid var(--border-subtle)",
          fontSize: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "3px", background: "#38bdf8", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-secondary)" }}>Historical</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "3px", background: "#ffd60a", borderRadius: "2px" }} />
            <span style={{ color: "#ffd60a", fontWeight: 500 }}>Prophet Trajectory</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "8px", background: "rgba(255, 214, 10, 0.25)", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-secondary)" }}>95% Confidence Interval</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomHistoricalTooltip({ active, payload, label, currSymbol }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
        {currSymbol}{data.close?.toFixed(2)}
      </div>
      {data.open && (
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", gap: "8px" }}>
          <span>O: {currSymbol}{data.open}</span>
          <span>H: {currSymbol}{data.high}</span>
          <span>L: {currSymbol}{data.low}</span>
        </div>
      )}
    </div>
  );
}

function CustomForecastTooltip({ active, payload, label, currSymbol }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}
      </div>
      {data.actual !== null && (
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#38bdf8", marginBottom: "2px" }}>
          Actual: {currSymbol}{data.actual?.toFixed(2)}
        </div>
      )}
      {data.predicted !== null && (
        <>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffd60a", marginBottom: "4px" }}>
            Projected: {currSymbol}{data.predicted?.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Range: {currSymbol}{data.lower?.toFixed(2)} – {currSymbol}{data.upper?.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}

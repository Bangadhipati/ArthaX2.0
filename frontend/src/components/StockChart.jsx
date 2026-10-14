import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { ZoomIn, ZoomOut, RotateCcw, TrendingUp, BarChart2 } from "lucide-react";

export default function StockChart({
  activeView,
  historyData = [],
  forecastData = [],
  currency = "USD",
  stockChange = 0,
  usdInrRate = 84.10
}) {
  const [zoomIndex, setZoomIndex] = useState(0); // 0: 100%, 1: 65%, 2: 40%, 3: 20%
  const [panIndex, setPanIndex] = useState(0); // Start offset index for visible slice
  const [isDragging, setIsDragging] = useState(false);
  const [chartType, setChartType] = useState("area"); // "area" | "candle"

  const containerRef = useRef(null);
  const dragRef = useRef({ startX: 0, startPanIndex: 0 });

  const isPositive = stockChange >= 0;
  const currSymbol = currency === "INR" ? "₹" : (currency === "USD" ? "$" : `${currency} `);

  // Active dataset
  const activeDataset = activeView === "historical" ? historyData : forecastData;
  const totalCount = activeDataset.length;

  const zoomRatios = [1, 0.65, 0.40, 0.20];
  const ratio = zoomRatios[zoomIndex];
  const sliceCount = zoomIndex === 0 ? totalCount : Math.max(8, Math.round(totalCount * ratio));
  const maxStartIndex = Math.max(0, totalCount - sliceCount);

  // When zoom changes or view changes, anchor pan to the latest slice
  useEffect(() => {
    setPanIndex(maxStartIndex);
  }, [zoomIndex, activeView, historyData.length, forecastData.length, maxStartIndex]);

  // Reset zoom on symbol or timeframe switch
  useEffect(() => {
    setZoomIndex(0);
  }, [activeView, historyData.length, forecastData.length]);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, 3));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = () => {
    setZoomIndex(0);
    setPanIndex(0);
  };

  // Drag to pan handlers (mouse and touch)
  const handleDragStart = (clientX) => {
    if (zoomIndex === 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startPanIndex: panIndex
    };
  };

  const handleDragMove = (clientX) => {
    if (!isDragging || zoomIndex === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 400;
    const deltaX = clientX - dragRef.current.startX;

    // Moving right (deltaX > 0) scrolls back into past (lower start index)
    // Moving left (deltaX < 0) scrolls forward into future (higher start index)
    const pointsPerPixel = sliceCount / width;
    const deltaPoints = Math.round(deltaX * pointsPerPixel * 1.25);
    const newIndex = Math.max(0, Math.min(maxStartIndex, dragRef.current.startPanIndex - deltaPoints));
    setPanIndex(newIndex);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Slice visible data based on pan index and zoom slice count
  const visibleHistoryData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    if (zoomIndex === 0) return historyData;
    const startIndex = Math.max(0, Math.min(historyData.length - sliceCount, panIndex));
    return historyData.slice(startIndex, startIndex + sliceCount);
  }, [historyData, zoomIndex, sliceCount, panIndex]);

  const visibleForecastData = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return [];
    if (zoomIndex === 0) return forecastData;
    const startIndex = Math.max(0, Math.min(forecastData.length - sliceCount, panIndex));
    return forecastData.slice(startIndex, startIndex + sliceCount);
  }, [forecastData, zoomIndex, sliceCount, panIndex]);

  // Compute domain bounds dynamically on the visible slice for high-resolution zoom
  let minY = Infinity;
  let maxY = -Infinity;

  if (activeView === "historical") {
    visibleHistoryData.forEach((d) => {
      const low = d.low != null ? d.low : d.close;
      const high = d.high != null ? d.high : d.close;
      if (low < minY) minY = low;
      if (high > maxY) maxY = high;
    });
  } else {
    visibleForecastData.forEach((d) => {
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

  const padding = (maxY - minY) * 0.08 || 5;
  const domain = [Math.floor(minY - padding), Math.ceil(maxY + padding)];

  return (
    <div
      ref={containerRef}
      className="stock-chart-container"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => {
        if (e.touches && e.touches.length === 1) {
          handleDragStart(e.touches[0].clientX);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches && e.touches.length === 1) {
          handleDragMove(e.touches[0].clientX);
        }
      }}
      onTouchEnd={handleDragEnd}
      style={{
        cursor: zoomIndex > 0 ? (isDragging ? "grabbing" : "grab") : "default",
        touchAction: zoomIndex > 0 ? "none" : "auto"
      }}
    >
      {/* Historical Chart Type Switcher: Area vs Candlestick */}
      {activeView === "historical" && (
        <div className="chart-type-segmented">
          <button
            className={`chart-type-btn ${chartType === "area" ? "active" : ""}`}
            onClick={() => setChartType("area")}
            title="Area Trendline Chart"
            aria-label="Area Trendline Chart"
          >
            <TrendingUp size={12} />
            <span>Area</span>
          </button>
          <button
            className={`chart-type-btn ${chartType === "candle" ? "active" : ""}`}
            onClick={() => setChartType("candle")}
            title="Candlestick (OHLC) Chart"
            aria-label="Candlestick (OHLC) Chart"
          >
            <BarChart2 size={12} />
            <span>Candles</span>
          </button>
        </div>
      )}

      {/* Floating Cupertino Zoom Controls */}
      <div className="chart-zoom-controls">
        <button
          onClick={handleZoomIn}
          disabled={zoomIndex >= 3}
          className="chart-zoom-btn"
          title="Zoom in (finer detail)"
          aria-label="Zoom in"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoomIndex <= 0}
          className="chart-zoom-btn"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={13} />
        </button>
        {zoomIndex > 0 && (
          <button
            onClick={handleResetZoom}
            className="chart-zoom-btn chart-zoom-reset"
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Floating Pan Hint Badge when zoomed in */}
      {zoomIndex > 0 && (
        <div className="chart-pan-badge">
          <span>↔ Drag to explore</span>
        </div>
      )}

      {activeView === "historical" && chartType === "candle" ? (
        <CandlestickChart
          data={visibleHistoryData}
          domain={domain}
          currSymbol={currSymbol}
          currency={currency}
          usdInrRate={usdInrRate}
        />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {activeView === "historical" ? (
            <AreaChart data={visibleHistoryData} margin={{ top: 18, right: 4, left: -8, bottom: 0 }}>
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
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d) => {
                  const parts = (d || "").split("-");
                  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d;
                }}
                minTickGap={35}
              />
              <YAxis
                domain={domain}
                stroke="#515156"
                fontSize={10}
                width={46}
                tickLine={false}
                axisLine={false}
                orientation="right"
                tickFormatter={(v) => `${currSymbol}${Math.round(v)}`}
              />
              <Tooltip
                content={<CustomHistoricalTooltip currSymbol={currSymbol} currency={currency} usdInrRate={usdInrRate} />}
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
            <AreaChart data={visibleForecastData} margin={{ top: 22, right: 4, left: -8, bottom: 0 }}>
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
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d) => {
                  const parts = (d || "").split("-");
                  return parts.length >= 2 ? `${parts[0].slice(2)}/${parts[1]}` : d;
                }}
                minTickGap={40}
              />
              <YAxis
                domain={domain}
                stroke="#515156"
                fontSize={10}
                width={46}
                tickLine={false}
                axisLine={false}
                orientation="right"
                tickFormatter={(v) => `${currSymbol}${Math.round(v)}`}
              />
              <Tooltip
                content={<CustomForecastTooltip currSymbol={currSymbol} currency={currency} usdInrRate={usdInrRate} />}
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
      )}

      {/* Legend Badge for Forecast View */}
      {activeView === "forecast" && (
        <div className="chart-forecast-legend">
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "3px", background: "#38bdf8", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-secondary)" }}>Historical</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "3px", background: "#ffd60a", borderRadius: "2px" }} />
            <span style={{ color: "#ffd60a", fontWeight: 500 }}>AI Trajectory</span>
          </div>
          <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", background: "rgba(255, 214, 10, 0.25)", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-secondary)" }}>95% Confidence Interval</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CandlestickChart({ data, domain, currSymbol, currency, usdInrRate }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const rate = Number(usdInrRate) || 84.10;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;
  if (!width || !height || !data || data.length === 0) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
  }

  const margin = { top: 18, right: 46, bottom: 24, left: 6 };
  const innerWidth = Math.max(10, width - margin.left - margin.right);
  const innerHeight = Math.max(10, height - margin.top - margin.bottom);

  const [minY, maxY] = domain;
  const rangeY = maxY - minY || 1;

  const getY = (price) => {
    const clamped = Math.max(minY, Math.min(maxY, price));
    return margin.top + innerHeight - ((clamped - minY) / rangeY) * innerHeight;
  };

  const candleSpacing = innerWidth / data.length;
  const candleWidth = Math.max(2, Math.min(18, candleSpacing * 0.72));

  // Ticks for Y-Axis (5 horizontal grid lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = minY + rangeY * pct;
    return {
      val,
      y: margin.top + innerHeight - pct * innerHeight
    };
  });

  // Ticks for X-Axis (Date intervals)
  const maxXTicks = width < 500 ? 4 : 7;
  const step = Math.max(1, Math.floor(data.length / maxXTicks));
  const xTicks = [];
  for (let i = 0; i < data.length; i += step) {
    const parts = (data[i].date || "").split("-");
    xTicks.push({
      label: parts.length >= 3 ? `${parts[1]}/${parts[2]}` : data[i].date,
      x: margin.left + i * candleSpacing + candleSpacing / 2
    });
  }

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX == null) return;
    const relX = clientX - rect.left - margin.left;
    const idx = Math.floor(relX / candleSpacing);
    if (idx >= 0 && idx < data.length) {
      setHoveredIndex(idx);
    } else {
      setHoveredIndex(null);
    }
  };

  const activeCandle = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      onMouseLeave={() => setHoveredIndex(null)}
      onTouchEnd={() => setHoveredIndex(null)}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "crosshair",
        userSelect: "none"
      }}
    >
      <svg width={width} height={height} style={{ display: "block" }}>
        {/* Horizontal grid lines & Y-axis labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={margin.left}
              y1={t.y}
              x2={width - margin.right}
              y2={t.y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="3 3"
            />
            <text
              x={width - margin.right + 6}
              y={t.y + 3}
              fill="#515156"
              fontSize={10}
              fontFamily="var(--font-sans)"
              textAnchor="start"
            >
              {currSymbol}{Math.round(t.val)}
            </text>
          </g>
        ))}

        {/* X-axis date labels */}
        {xTicks.map((t, idx) => (
          <text
            key={idx}
            x={t.x}
            y={height - 6}
            fill="#515156"
            fontSize={10}
            fontFamily="var(--font-sans)"
            textAnchor="middle"
          >
            {t.label}
          </text>
        ))}

        {/* Candlesticks */}
        {data.map((d, i) => {
          const xCenter = margin.left + i * candleSpacing + candleSpacing / 2;
          const openY = getY(d.open);
          const closeY = getY(d.close);
          const highY = getY(d.high);
          const lowY = getY(d.low);

          const isBullish = d.close >= d.open;
          const color = isBullish ? "var(--apple-green)" : "var(--apple-red)";
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));

          return (
            <g key={i} opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.45}>
              {/* Wick Line */}
              <line
                x1={xCenter}
                y1={highY}
                x2={xCenter}
                y2={lowY}
                stroke={color}
                strokeWidth={1.2}
              />
              {/* Candle Body */}
              <rect
                x={xCenter - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx={candleWidth > 4 ? 1 : 0}
              />
            </g>
          );
        })}

        {/* Crosshair when hovering */}
        {activeCandle && (
          <g>
            <line
              x1={margin.left + hoveredIndex * candleSpacing + candleSpacing / 2}
              y1={margin.top}
              x2={margin.left + hoveredIndex * candleSpacing + candleSpacing / 2}
              y2={height - margin.bottom}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <line
              x1={margin.left}
              y1={getY(activeCandle.close)}
              x2={width - margin.right}
              y2={getY(activeCandle.close)}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          </g>
        )}
      </svg>

      {/* Interactive Floating Tooltip with dual currency */}
      {activeCandle && (
        <div
          className="custom-recharts-tooltip"
          style={{
            position: "absolute",
            top: 10,
            left: Math.min(
              width - 190,
              Math.max(12, margin.left + hoveredIndex * candleSpacing - 60)
            ),
            pointerEvents: "none",
            zIndex: 30
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            {activeCandle.date}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: activeCandle.close >= activeCandle.open ? "var(--apple-green)" : "var(--apple-red)" }}>
              {currSymbol}{activeCandle.close?.toFixed(2)}
            </span>
            {currency !== "INR" && (
              <span style={{ fontSize: "12px", color: "var(--apple-cyan)", fontWeight: 500 }}>
                ≈ ₹{(activeCandle.close * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
            <span>O: {currSymbol}{activeCandle.open?.toFixed(2)}</span>
            <span>H: {currSymbol}{activeCandle.high?.toFixed(2)}</span>
            <span>L: {currSymbol}{activeCandle.low?.toFixed(2)}</span>
            <span>Vol: {activeCandle.volume ? (activeCandle.volume >= 1e6 ? `${(activeCandle.volume/1e6).toFixed(1)}M` : `${Math.round(activeCandle.volume/1e3)}k`) : "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomHistoricalTooltip({ active, payload, label, currSymbol, currency, usdInrRate }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const rate = Number(usdInrRate) || 84.10;
  const closeVal = data.close;
  const inrVal = closeVal != null ? (closeVal * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
          {currSymbol}{closeVal?.toFixed(2)}
        </span>
        {currency !== "INR" && inrVal && (
          <span style={{ fontSize: "12px", color: "var(--apple-cyan)", fontWeight: 500 }}>
            ≈ ₹{inrVal}
          </span>
        )}
      </div>
      {data.open && (
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
          <span>O: {currSymbol}{data.open}</span>
          <span>H: {currSymbol}{data.high}</span>
          <span>L: {currSymbol}{data.low}</span>
          <span>C: {currSymbol}{data.close}</span>
        </div>
      )}
    </div>
  );
}

function CustomForecastTooltip({ active, payload, label, currSymbol, currency, usdInrRate }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const rate = Number(usdInrRate) || 84.10;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}
      </div>
      {data.actual !== null && (
        <div style={{ marginBottom: "6px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Actual Price</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#38bdf8" }}>
              {currSymbol}{data.actual?.toFixed(2)}
            </span>
            {currency !== "INR" && (
              <span style={{ fontSize: "11px", color: "var(--apple-cyan)" }}>
                ≈ ₹{(data.actual * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      )}
      {data.predicted !== null && (
        <>
          <div style={{ marginBottom: "4px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>AI Projected</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#ffd60a" }}>
                {currSymbol}{data.predicted?.toFixed(2)}
              </span>
              {currency !== "INR" && (
                <span style={{ fontSize: "11.5px", color: "var(--apple-cyan)", fontWeight: 500 }}>
                  ≈ ₹{(data.predicted * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Range: {currSymbol}{data.lower?.toFixed(2)} – {currSymbol}{data.upper?.toFixed(2)}
            {currency !== "INR" && (
              <span style={{ display: "block", color: "var(--apple-cyan)", marginTop: "2px", opacity: 0.85 }}>
                ≈ ₹{(data.lower * rate).toFixed(0)} – ₹{(data.upper * rate).toFixed(0)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { ZoomIn, ZoomOut, RotateCcw, TrendingUp, BarChart2, Hand } from "lucide-react";

/**
 * Formats X-axis date & timestamp dynamically.
 * Always includes the year; when deeply zoomed in or on intraday data, includes day, hours, and seconds.
 */
export function formatChartTick(dateStr, visibleCount = 20, isZoomedDeep = false) {
  if (!dateStr) return "";

  // Case A: Intraday timestamp: "2024-10-14 15:30:00" or ISO "2024-10-14T15:30:00"
  if (dateStr.includes(" ") || dateStr.includes("T")) {
    const [datePart, timePartRaw] = dateStr.replace("T", " ").split(" ");
    const [y, m, d] = (datePart || "").split("-");
    const [hh, mm, ss] = (timePartRaw || "").split(":");
    const shortYear = y ? `'${y.slice(2)}` : "";

    // If deeply zoomed in (few points visible): show hours, minutes and seconds "HH:mm:ss"
    if (isZoomedDeep && ss !== undefined) {
      return `${hh || "00"}:${mm || "00"}:${ss || "00"}`;
    }

    // Moderately zoomed intraday: show Day/Month + Time "14/10 15:30"
    if (visibleCount <= 28) {
      return `${d}/${m} ${hh}:${mm}`;
    }

    // Default intraday tick: "HH:mm"
    return `${hh}:${mm}`;
  }

  // Case B: Daily or multi-day date: "2024-10-14"
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    const [year, month, day] = parts;
    const shortYear = `'${year.slice(2)}`;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mName = months[parseInt(month, 10) - 1] || month;

    // Deeply zoomed in: show Day + Month + Year "14 Oct '24"
    if (isZoomedDeep || visibleCount <= 20) {
      return `${day} ${mName} ${shortYear}`;
    }

    // Macro/zoomed-out view: Month + Year "Oct '24"
    return `${mName} ${shortYear}`;
  }

  return dateStr;
}

/**
 * Formats complete human-friendly date & timestamp for tooltips.
 */
export function formatFullTooltipDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes(" ") || dateStr.includes("T")) {
    const [datePart, timePartRaw] = dateStr.replace("T", " ").split(" ");
    const [y, m, d] = (datePart || "").split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${mName} ${y} • ${timePartRaw || ""}`;
  }
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    const [year, month, day] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mName = months[parseInt(month, 10) - 1] || month;
    return `${day} ${mName} ${year}`;
  }
  return dateStr;
}

export default function StockChart({
  activeView,
  historyData = [],
  forecastData = [],
  currency = "USD",
  stockChange = 0,
  fxRate,
  usdInrRate = 84.10
}) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [panIndex, setPanIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [chartType, setChartType] = useState("area"); // "area" | "candle"

  const containerRef = useRef(null);
  const dragRef = useRef({ startX: 0, startPanIndex: 0 });
  const lastWheelRef = useRef(0);
  const pinchStartDistRef = useRef(0);
  const rafIdRef = useRef(null);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const conversionRate = Number(fxRate || usdInrRate) || 84.10;
  const isPositive = stockChange >= 0;
  const currSymbol = currency === "INR" ? "₹" : (currency === "USD" ? "$" : `${currency} `);

  // Filter forecast data so it only shows current price today and the future trajectory (no past)
  const currentAndFutureForecast = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return [];
    const firstPredIdx = forecastData.findIndex((d) => d.predicted !== null);
    if (firstPredIdx <= 0) return forecastData;
    return forecastData.slice(firstPredIdx);
  }, [forecastData]);

  // Active dataset
  const activeDataset = activeView === "historical" ? historyData : currentAndFutureForecast;
  const totalCount = activeDataset.length;

  // 6 smooth zoom levels from 100% down to 10% ultra fine detail
  const zoomRatios = [1.0, 0.75, 0.50, 0.32, 0.20, 0.10];
  const MAX_ZOOM = zoomRatios.length - 1;

  const ratio = zoomRatios[zoomIndex];
  const sliceCount = zoomIndex === 0 ? totalCount : Math.max(6, Math.round(totalCount * ratio));
  const maxStartIndex = Math.max(0, totalCount - sliceCount);
  const isZoomedDeep = zoomIndex >= 2;

  // Anchor pan to the latest slice when zoom or data changes
  useEffect(() => {
    setPanIndex(maxStartIndex);
  }, [zoomIndex, activeView, historyData.length, currentAndFutureForecast.length, maxStartIndex]);

  // Reset zoom on view change
  useEffect(() => {
    setZoomIndex(0);
    setIsPanMode(false);
  }, [activeView, historyData.length, currentAndFutureForecast.length]);

  // Clean up any pending animation frames
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setIsPanMode(false);
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomIndex(0);
    setPanIndex(0);
    setIsPanMode(false);
  };

  const handleTogglePan = () => {
    setIsPanMode((prev) => {
      const next = !prev;
      if (next && zoomIndex === 0) {
        setZoomIndex(1); // Auto zoom to 75% so user can immediately drag
      }
      return next;
    });
  };

  // High-performance Drag-to-Pan handlers (Mouse & Touch with requestAnimationFrame)
  const handleDragStart = (clientX) => {
    if (zoomIndex === 0 && !isPanMode) return;
    if (zoomIndex === 0 && isPanMode) {
      setZoomIndex(1);
    }
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startPanIndex: panIndex
    };
  };

  const handleDragMove = (clientX) => {
    if (!isDragging || !containerRef.current) return;
    if (rafIdRef.current) return; // Throttled to monitor display refresh rate (no frame drops)

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || 400;
      const deltaX = clientX - dragRef.current.startX;

      const pointsPerPixel = sliceCount / width;
      const deltaPoints = Math.round(deltaX * pointsPerPixel * 1.15);
      const newIndex = Math.max(0, Math.min(maxStartIndex, dragRef.current.startPanIndex - deltaPoints));
      setPanIndex(newIndex);
    });
  };

  const handleDragEnd = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsDragging(false);
  };

  // Mouse wheel & Laptop Trackpad Pinch Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current < 75) return;
      lastWheelRef.current = now;

      if (e.deltaY < 0) {
        setZoomIndex((prev) => Math.min(prev + 1, MAX_ZOOM));
      } else if (e.deltaY > 0) {
        setZoomIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next === 0) setIsPanMode(false);
          return next;
        });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [MAX_ZOOM]);

  // Touch handlers: Single finger drag + Two-finger pinch
  const handleTouchStart = (e) => {
    if (!e.touches) return;
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = d;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      if (zoomIndex > 0 || isPanMode) {
        handleDragStart(e.touches[0].clientX);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!e.touches) return;
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = d - pinchStartDistRef.current;
      if (delta > 25) {
        setZoomIndex((prev) => Math.min(prev + 1, MAX_ZOOM));
        pinchStartDistRef.current = d;
      } else if (delta < -25) {
        setZoomIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next === 0) setIsPanMode(false);
          return next;
        });
        pinchStartDistRef.current = d;
      }
    } else if (e.touches.length === 1) {
      if (isDragging || isPanMode || zoomIndex > 0) {
        handleDragMove(e.touches[0].clientX);
      }
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
    pinchStartDistRef.current = 0;
  };

  // Slice visible data based on pan index and zoom slice count
  const visibleHistoryData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    if (zoomIndex === 0) return historyData;
    const startIndex = Math.max(0, Math.min(historyData.length - sliceCount, panIndex));
    return historyData.slice(startIndex, startIndex + sliceCount);
  }, [historyData, zoomIndex, sliceCount, panIndex]);

  const visibleForecastData = useMemo(() => {
    if (!currentAndFutureForecast || currentAndFutureForecast.length === 0) return [];
    if (zoomIndex === 0) return currentAndFutureForecast;
    const startIndex = Math.max(0, Math.min(currentAndFutureForecast.length - sliceCount, panIndex));
    return currentAndFutureForecast.slice(startIndex, startIndex + sliceCount);
  }, [currentAndFutureForecast, zoomIndex, sliceCount, panIndex]);

  // Format forecast points with floating confidenceRange [lower, upper] for proper corridor rendering
  const formattedForecastData = useMemo(() => {
    return visibleForecastData.map((d) => {
      const low = d.lower != null ? d.lower : (d.predicted ?? d.actual);
      const high = d.upper != null ? d.upper : (d.predicted ?? d.actual);
      return {
        ...d,
        confidenceRange: [low, high]
      };
    });
  }, [visibleForecastData]);

  // Dynamic bounds for high-res zoom
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

  // 15% headroom and footroom padding so confidence corridor never touches absolute top
  const padding = (maxY - minY) * 0.15 || 10;
  const domain = [Math.max(0, Math.floor(minY - padding)), Math.ceil(maxY + padding)];

  const isInteractiveNav = zoomIndex > 0 || isPanMode;

  return (
    <div
      ref={containerRef}
      className="stock-chart-container"
      onMouseDown={(e) => {
        if (e.button === 0) handleDragStart(e.clientX);
      }}
      onMouseMove={(e) => {
        if (isDragging) handleDragMove(e.clientX);
      }}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isDragging ? "grabbing" : (isInteractiveNav ? "grab" : "default"),
        touchAction: isInteractiveNav ? "none" : "auto",
        userSelect: "none"
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

      {/* Floating Cupertino Controls: Pan Mode, Zoom In, Zoom Out, Reset */}
      <div className="chart-zoom-controls">
        <button
          onClick={handleTogglePan}
          className={`chart-zoom-btn chart-pan-toggle ${isPanMode ? "active" : ""}`}
          title={isPanMode ? "Pan Mode Active (click to disable)" : "Activate Pan / Drag Mode"}
          aria-label="Toggle Pan Mode"
        >
          <Hand size={13} />
          <span>Pan</span>
        </button>

        <div className="chart-controls-divider" />

        <button
          onClick={handleZoomIn}
          disabled={zoomIndex >= MAX_ZOOM}
          className="chart-zoom-btn"
          title="Zoom in (or use trackpad/mouse scroll up)"
          aria-label="Zoom in"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoomIndex <= 0}
          className="chart-zoom-btn"
          title="Zoom out (or use trackpad/mouse scroll down)"
          aria-label="Zoom out"
        >
          <ZoomOut size={13} />
        </button>
        {(zoomIndex > 0 || isPanMode) && (
          <button
            onClick={handleResetZoom}
            className="chart-zoom-btn chart-zoom-reset"
            title="Reset to 100% view"
            aria-label="Reset zoom"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Chart Canvas */}

      {activeView === "historical" && chartType === "candle" ? (
        <CandlestickChart
          data={visibleHistoryData}
          domain={domain}
          currSymbol={currSymbol}
          currency={currency}
          conversionRate={conversionRate}
          isPanMode={isPanMode}
          isDragging={isDragging}
          isZoomedDeep={isZoomedDeep}
        />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {activeView === "historical" ? (
            <AreaChart
              data={visibleHistoryData}
              margin={{ top: 18, right: 8, left: isSmallScreen ? -16 : -10, bottom: 0 }}
            >
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
                tickFormatter={(d) => formatChartTick(d, visibleHistoryData.length, isZoomedDeep)}
                minTickGap={32}
              />
              <YAxis
                domain={domain}
                stroke="#515156"
                fontSize={10}
                width={50}
                tickLine={false}
                axisLine={false}
                orientation="right"
                tickFormatter={(v) => `${currSymbol}${Math.round(v)}`}
              />
              <Tooltip
                content={<CustomHistoricalTooltip currSymbol={currSymbol} currency={currency} conversionRate={conversionRate} />}
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? "var(--apple-green)" : "var(--apple-blue)"}
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#historicalGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <AreaChart
              data={formattedForecastData}
              margin={{ top: 22, right: 8, left: isSmallScreen ? -16 : -10, bottom: 0 }}
            >
              <defs>
                {/* Golden AI Confidence Corridor */}
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd60a" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#ffd60a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#515156"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d) => formatChartTick(d, formattedForecastData.length, isZoomedDeep)}
                minTickGap={35}
              />
              <YAxis
                domain={domain}
                stroke="#515156"
                fontSize={10}
                width={50}
                tickLine={false}
                axisLine={false}
                orientation="right"
                tickFormatter={(v) => `${currSymbol}${Math.round(v)}`}
              />
              <Tooltip
                content={<CustomForecastTooltip currSymbol={currSymbol} currency={currency} conversionRate={conversionRate} />}
                cursor={{ stroke: "rgba(255,214,10,0.3)", strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              {/* True Floating Confidence Corridor between lower and upper */}
              <Area
                type="monotone"
                dataKey="confidenceRange"
                stroke="transparent"
                fill="url(#confidenceGradient)"
                isAnimationActive={false}
              />
              {/* Upper 95% boundary line */}
              <Line
                type="monotone"
                dataKey="upper"
                stroke="rgba(255, 214, 10, 0.45)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
              {/* Lower 95% boundary line */}
              <Line
                type="monotone"
                dataKey="lower"
                stroke="rgba(255, 214, 10, 0.45)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
              {/* Current Price origin anchor dot */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#38bdf8"
                strokeWidth={0}
                dot={{ r: 4.5, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
              {/* Future Prophet predicted central trajectory line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#ffd60a"
                strokeWidth={2.6}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Legend Badge for Forecast View */}
      {activeView === "forecast" && (
        <div className="chart-forecast-legend">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 6px #38bdf8" }} />
            <span style={{ color: "#38bdf8", fontWeight: 500 }}>Current Price</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "3px", background: "#ffd60a", borderRadius: "2px" }} />
            <span style={{ color: "#ffd60a", fontWeight: 500 }}>AI Trajectory</span>
          </div>
          <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "6px", background: "rgba(255, 214, 10, 0.22)", border: "1px dashed rgba(255, 214, 10, 0.5)", borderRadius: "2px" }} />
            <span style={{ color: "var(--text-secondary)" }}>95% Confidence Corridor</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CandlestickChart({ data, domain, currSymbol, currency, conversionRate, isPanMode, isDragging, isZoomedDeep }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);

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

  const margin = { top: 18, right: 52, bottom: 24, left: 6 };
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

  // Ticks for Y-Axis
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = minY + rangeY * pct;
    return {
      val,
      y: margin.top + innerHeight - pct * innerHeight
    };
  });

  // Ticks for X-Axis with full Year & Granular time
  const maxXTicks = width < 500 ? 4 : 7;
  const step = Math.max(1, Math.floor(data.length / maxXTicks));
  const xTicks = [];
  for (let i = 0; i < data.length; i += step) {
    xTicks.push({
      label: formatChartTick(data[i].date, data.length, isZoomedDeep),
      x: margin.left + i * candleSpacing + candleSpacing / 2
    });
  }

  const handlePointerMove = (e) => {
    if (isPanMode || isDragging || !containerRef.current) return;
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

  const activeCandle = (!isPanMode && !isDragging && hoveredIndex !== null && data[hoveredIndex]) ? data[hoveredIndex] : null;

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
        userSelect: "none",
        pointerEvents: isPanMode || isDragging ? "none" : "auto"
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
              x={width - 6}
              y={t.y + 3}
              fill="#515156"
              fontSize={10}
              fontFamily="var(--font-sans)"
              textAnchor="end"
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
        {data.map((c, i) => {
          const isGreen = c.close >= c.open;
          const color = isGreen ? "var(--apple-green)" : "var(--apple-red)";
          const centerX = margin.left + i * candleSpacing + candleSpacing / 2;
          const yHigh = getY(c.high);
          const yLow = getY(c.low);
          const yOpen = getY(c.open);
          const yClose = getY(c.close);
          const bodyY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={centerX}
                y1={yHigh}
                x2={centerX}
                y2={yLow}
                stroke={color}
                strokeWidth={isHovered ? 1.8 : 1.2}
                opacity={isHovered ? 1 : 0.85}
              />
              {/* Candle Body */}
              <rect
                x={centerX - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                fillOpacity={isGreen ? 0.35 : 0.45}
                stroke={color}
                strokeWidth={isHovered ? 1.6 : 1}
                rx={1}
              />
            </g>
          );
        })}

        {/* Crosshair indicator on hover */}
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

      {/* Floating Candlestick Tooltip with full timestamp & dual currency */}
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
            {formatFullTooltipDate(activeCandle.date)}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: activeCandle.close >= activeCandle.open ? "var(--apple-green)" : "var(--apple-red)" }}>
              {currSymbol}{activeCandle.close?.toFixed(2)}
            </span>
            {currency !== "INR" && (
              <span style={{ fontSize: "12px", color: "var(--apple-cyan)", fontWeight: 500 }}>
                ≈ ₹{(activeCandle.close * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

function CustomHistoricalTooltip({ active, payload, label, currSymbol, currency, conversionRate }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const closeVal = data.close;
  const inrVal = closeVal != null ? (closeVal * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
        {formatFullTooltipDate(label)}
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

function CustomForecastTooltip({ active, payload, label, currSymbol, currency, conversionRate }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="custom-recharts-tooltip">
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {formatFullTooltipDate(label)}
      </div>
      {data.actual !== null && (
        <div style={{ marginBottom: "6px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Current Price</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#38bdf8" }}>
              {currSymbol}{data.actual?.toFixed(2)}
            </span>
            {currency !== "INR" && (
              <span style={{ fontSize: "11px", color: "var(--apple-cyan)" }}>
                ≈ ₹{(data.actual * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  ≈ ₹{(data.predicted * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Range: {currSymbol}{data.lower?.toFixed(2)} – {currSymbol}{data.upper?.toFixed(2)}
            {currency !== "INR" && (
              <span style={{ display: "block", color: "var(--apple-cyan)", marginTop: "2px", opacity: 0.85 }}>
                ≈ ₹{(data.lower * conversionRate).toFixed(0)} – ₹{(data.upper * conversionRate).toFixed(0)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

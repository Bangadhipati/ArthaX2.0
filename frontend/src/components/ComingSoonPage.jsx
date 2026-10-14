import React from "react";
import {
  Bookmark,
  Coins,
  Sparkles,
  LineChart,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Cpu
} from "lucide-react";

const MODULE_META = {
  "forecast-hub": {
    title: "AI Forecasting Hub",
    badge: "Advanced Modeling",
    icon: LineChart,
    color: "#ffd60a",
    description: "Dedicated multi-ticker comparative trajectories, custom Bayesian changepoint sensitivity tuning, and automated scenario backtesting across global markets.",
    features: [
      "Simultaneous multi-asset comparative trajectory forecasting",
      "Interactive Bayesian changepoint prior scale calibration",
      "Historical backtesting with Mean Absolute Percentage Error (MAPE)"
    ]
  },
  "watchlist": {
    title: "Portfolio & Watchlist",
    badge: "Asset Tracking",
    icon: Bookmark,
    color: "#0a84ff",
    description: "Real-time portfolio performance tracking, personalized risk-adjusted return ratios, automated price alerts, and multi-exchange watchlist synchronization.",
    features: [
      "Unified global portfolio valuation with live INR/USD auto-conversion",
      "Custom price alerts with email and web push notifications",
      "Dynamic portfolio diversification and Sharpe ratio metrics"
    ]
  },
  "forex-matrix": {
    title: "Currency & FX Matrix",
    badge: "Global FX Engine",
    icon: Coins,
    color: "#30d158",
    description: "Institutional cross-currency correlation matrix, purchasing power parity analytics, and live spot rate streaming across 40+ global currencies.",
    features: [
      "Real-time cross-currency heatmaps (USD, INR, EUR, GBP, JPY)",
      "Central bank policy rate differentials and interest rate parity",
      "Historical forex volatility cones and FX trend forecasting"
    ]
  },
  "macro-sentiment": {
    title: "Macro AI Sentiment",
    badge: "Natural Language AI",
    icon: Sparkles,
    color: "#bf5af2",
    description: "Deep natural language intelligence extracting institutional sentiment from earnings transcripts, central bank statements, and real-time market news.",
    features: [
      "FinBERT sentiment scoring on SEC 10-K & 10-Q corporate filings",
      "Central bank monetary policy tone and dovish/hawkish classification",
      "Macro-economic news momentum clustering and anomaly detection"
    ]
  }
};

export default function ComingSoonPage({ pageId, onBackToIntelligence }) {
  const meta = MODULE_META[pageId] || {
    title: "Upcoming Module",
    badge: "Under Development",
    icon: Clock,
    color: "#0a84ff",
    description: "This advanced intelligence module is currently being finalized by the AstraGenX engineering team.",
    features: [
      "High-throughput real-time streaming",
      "Decoupled cloud architecture",
      "Apple Cupertino responsive design"
    ]
  };

  const Icon = meta.icon;

  return (
    <div style={{
      maxWidth: "800px",
      margin: "40px auto 80px",
      padding: "0 16px"
    }}>
      <div className="apple-glass" style={{
        padding: "48px 36px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle Ambient Radial Glow */}
        <div style={{
          position: "absolute",
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "280px",
          height: "280px",
          background: `radial-gradient(circle, ${meta.color}22 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: "none"
        }} />

        {/* Icon Emblem */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          background: `rgba(255, 255, 255, 0.05)`,
          border: `1px solid ${meta.color}44`,
          boxShadow: `0 8px 24px ${meta.color}22`,
          color: meta.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          position: "relative"
        }}>
          <Icon size={32} strokeWidth={2.2} />
        </div>

        {/* Status Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 14px",
          borderRadius: "9999px",
          background: "rgba(255, 214, 10, 0.1)",
          border: "1px solid rgba(255, 214, 10, 0.25)",
          color: "var(--apple-gold)",
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "16px"
        }}>
          <Clock size={13} />
          <span>Coming Soon in ArthaX 2.1</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "32px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "#ffffff",
          letterSpacing: "-0.02em",
          marginBottom: "12px"
        }}>
          {meta.title}
        </h1>

        {/* Description */}
        <p style={{
          fontSize: "15px",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          maxWidth: "560px",
          margin: "0 auto 32px"
        }}>
          {meta.description}
        </p>

        {/* Planned Features Grid */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "16px",
          padding: "20px 24px",
          textAlign: "left",
          marginBottom: "36px"
        }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-tertiary)",
            marginBottom: "12px"
          }}>
            Planned Engine Features
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {meta.features.map((feat, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#d1d5db" }}>
                <span style={{ color: meta.color, marginTop: "2px" }}>●</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBackToIntelligence}
          className="apple-button apple-button-primary"
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Market Intelligence</span>
        </button>
      </div>
    </div>
  );
}

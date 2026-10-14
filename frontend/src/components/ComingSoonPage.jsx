import React from "react";
import {
  Bookmark,
  Coins,
  Sparkles,
  LineChart,
  Clock,
  ArrowLeft
} from "lucide-react";

const MODULE_META = {
  "forecast-hub": {
    title: "AI Forecasting Hub",
    icon: LineChart,
    color: "#ffd60a"
  },
  "watchlist": {
    title: "Portfolio & Watchlist",
    icon: Bookmark,
    color: "#0a84ff"
  },
  "forex-matrix": {
    title: "Currency & FX Matrix",
    icon: Coins,
    color: "#30d158"
  },
  "macro-sentiment": {
    title: "Macro AI Sentiment",
    icon: Sparkles,
    color: "#bf5af2"
  }
};

export default function ComingSoonPage({ pageId, onBackToIntelligence }) {
  const meta = MODULE_META[pageId] || {
    title: "Upcoming Module",
    icon: Clock,
    color: "#0a84ff"
  };

  const Icon = meta.icon;

  return (
    <div style={{
      maxWidth: "540px",
      margin: "60px auto",
      padding: "0 20px"
    }}>
      <div className="apple-glass" style={{
        padding: "52px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle Ambient Radial Glow */}
        <div style={{
          position: "absolute",
          top: "-70px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "240px",
          height: "240px",
          background: `radial-gradient(circle, ${meta.color}24 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: "none"
        }} />

        {/* Icon Emblem */}
        <div style={{
          width: "68px",
          height: "68px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${meta.color}44`,
          boxShadow: `0 8px 24px ${meta.color}22`,
          color: meta.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          position: "relative"
        }}>
          <Icon size={32} strokeWidth={2.2} />
        </div>

        {/* Status Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
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
          <span>Coming Soon</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "28px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "#ffffff",
          letterSpacing: "-0.02em",
          marginBottom: "10px"
        }}>
          {meta.title}
        </h1>

        {/* Short Minimalist Tagline */}
        <p style={{
          fontSize: "14px",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          marginBottom: "32px"
        }}>
          This module is actively being built for ArthaX 2.1.
        </p>

        {/* Clean Back Button */}
        <button
          onClick={onBackToIntelligence}
          className="apple-button apple-button-primary"
          style={{
            padding: "9px 22px",
            fontSize: "13px",
            fontWeight: 600
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Market Intelligence</span>
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Search, Sparkles, TrendingUp, Globe, Loader2, Zap } from "lucide-react";

export default function Navbar({ onOpenSearch, aiStatus = "idle", onConnectAI, usdInrRate }) {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 28px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(10, 11, 15, 0.75)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      position: "sticky",
      top: 0,
      zIndex: 40
    }}>
      {/* Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #0a84ff 0%, #bf5af2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(10, 132, 255, 0.35)",
          color: "#ffffff"
        }}>
          <TrendingUp size={20} strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ffffff"
            }}>
              ArthaX
            </span>
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}>
              2.0
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, fontWeight: 400 }}>
            AstraGenX Intelligence
          </p>
        </div>
      </div>

      {/* Apple Spotlight Search Trigger */}
      <button
        onClick={onOpenSearch}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "9999px",
          padding: "8px 18px",
          color: "var(--text-secondary)",
          cursor: "pointer",
          width: "340px",
          maxWidth: "100%",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.borderColor = "var(--border-highlight)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
        }}
      >
        <Search size={15} style={{ color: "var(--text-secondary)" }} />
        <span style={{ fontSize: "13px", flex: 1, textAlign: "left" }}>
          Search company or ticker...
        </span>
        <kbd style={{
          fontSize: "11px",
          padding: "2px 6px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "var(--text-secondary)"
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Right Intelligence Status & FX Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Live USD/INR FX Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          padding: "6px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          color: "var(--text-secondary)"
        }}>
          <Globe size={13} style={{ color: "var(--apple-cyan)" }} />
          <span>1 USD = <strong style={{ color: "#ffffff" }}>₹{usdInrRate || "84.10"}</strong></span>
        </div>

        {/* Dynamic 3-State AI Engine Action Pill */}
        {aiStatus === "live" ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(48, 209, 88, 0.1)",
            border: "1px solid rgba(48, 209, 88, 0.3)",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--apple-green)",
            letterSpacing: "-0.01em"
          }}>
            <div
              className="breathing-dot"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--apple-green)",
                boxShadow: "0 0 8px var(--apple-green)"
              }}
            />
            <span>AI is LIVE</span>
          </div>
        ) : aiStatus === "connecting" ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 214, 10, 0.12)",
            border: "1px solid rgba(255, 214, 10, 0.3)",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--apple-gold)"
          }}>
            <Loader2 size={13} className="spin-animation" style={{ color: "var(--apple-gold)" }} />
            <span>Connecting to AI...</span>
          </div>
        ) : (
          <button
            onClick={onConnectAI}
            className="apple-button apple-button-primary"
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              borderRadius: "9999px",
              cursor: "pointer",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(10, 132, 255, 0.3)"
            }}
          >
            <Zap size={13} style={{ fill: "#ffffff" }} />
            <span>Connect AI</span>
          </button>
        )}
      </div>
    </header>
  );
}

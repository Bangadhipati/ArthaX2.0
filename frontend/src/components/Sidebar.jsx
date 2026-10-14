import React from "react";
import {
  Activity,
  LineChart,
  Coins,
  Sparkles,
  Bookmark,
  FileCode2,
  ExternalLink,
  Cpu,
  Layers
} from "lucide-react";

export default function Sidebar({
  activePage = "market-intelligence",
  onSelectPage,
  usdInrRate,
  aiStatus
}) {
  const navSections = [
    {
      heading: "Platform",
      items: [
        {
          id: "market-intelligence",
          label: "Market Intelligence",
          icon: Activity,
          active: true,
          badge: null
        },
        {
          id: "forecast-hub",
          label: "AI Forecasting Hub",
          icon: LineChart,
          active: false,
          badge: "Included"
        }
      ]
    },
    {
      heading: "Upcoming Modules",
      items: [
        {
          id: "watchlist",
          label: "Portfolio & Watchlist",
          icon: Bookmark,
          active: false,
          badge: "Soon"
        },
        {
          id: "forex-matrix",
          label: "Currency & FX Matrix",
          icon: Coins,
          active: false,
          badge: "Soon"
        },
        {
          id: "macro-sentiment",
          label: "Macro AI Sentiment",
          icon: Sparkles,
          active: false,
          badge: "Soon"
        }
      ]
    },
    {
      heading: "Ecosystem & Docs",
      items: [
        {
          id: "swagger-docs",
          label: "FastAPI Swagger",
          icon: FileCode2,
          external: true,
          href: "http://localhost:8000/docs",
          badge: "v2.0"
        }
      ]
    }
  ];

  return (
    <aside className="macos-sidebar">
      <div>
        {/* Navigation Sections */}
        {navSections.map((sec, idx) => (
          <div key={idx} style={{ marginBottom: "22px" }}>
            <div style={{
              fontSize: "10.5px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              padding: "0 12px 8px"
            }}>
              {sec.heading}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isSelected = activePage === item.id;

                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-nav-item"
                    >
                      <Icon size={16} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
                      <span>{item.label}</span>
                      <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage && onSelectPage(item.id)}
                    className={`sidebar-nav-item ${isSelected ? "active" : ""}`}
                    style={{
                      background: isSelected ? "rgba(10, 132, 255, 0.15)" : "transparent",
                      border: "none",
                      width: "100%",
                      textAlign: "left"
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={2}
                      style={{
                        color: isSelected ? "var(--apple-blue)" : "var(--text-secondary)"
                      }}
                    />
                    <span style={{ color: isSelected ? "#ffffff" : "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="sidebar-badge" style={{
                        background: item.badge === "Included" ? "rgba(48, 209, 88, 0.12)" : "rgba(255, 255, 255, 0.06)",
                        color: item.badge === "Included" ? "var(--apple-green)" : "var(--text-tertiary)"
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Apple Ambient Status Card */}
      <div style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "14px",
        padding: "14px",
        marginTop: "auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={14} style={{ color: "var(--apple-gold)" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff" }}>
              ArthaX Core
            </span>
          </div>
          <span style={{
            fontSize: "10px",
            fontWeight: 600,
            color: aiStatus === "live" ? "var(--apple-green)" : "var(--apple-gold)",
            background: aiStatus === "live" ? "rgba(48, 209, 88, 0.1)" : "rgba(255, 214, 10, 0.1)",
            padding: "2px 6px",
            borderRadius: "6px"
          }}>
            {aiStatus === "live" ? "Online" : "Standby"}
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          <div>Model: Prophet Bayesian</div>
          <div style={{ marginTop: "2px" }}>USD/INR: ₹{usdInrRate ? usdInrRate.toFixed(2) : "95.14"}</div>
        </div>
      </div>
    </aside>
  );
}

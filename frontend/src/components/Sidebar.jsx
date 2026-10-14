import React from "react";
import {
  Activity,
  LineChart,
  Coins,
  Sparkles,
  Bookmark
} from "lucide-react";

export default function Sidebar({
  activePage = "market-intelligence",
  onSelectPage,
  mobileOpen = false,
  onCloseMobile
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
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`macos-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
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

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (onSelectPage) onSelectPage(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
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
      </aside>
    </>
  );
}

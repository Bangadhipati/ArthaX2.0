import React from "react";
import { Activity, Newspaper } from "lucide-react";

export default function Sidebar({
  activePage = "market-intelligence",
  onSelectPage,
  mobileOpen = false,
  onCloseMobile,
  newsLoading = false
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`macos-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top-section">
          <div style={{
            fontSize: "10.5px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-tertiary)",
            padding: "0 12px 8px"
          }}>
            Platform
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <button
              onClick={() => {
                if (onSelectPage) onSelectPage("market-intelligence");
                if (onCloseMobile) onCloseMobile();
              }}
              className={`sidebar-nav-item ${activePage === "market-intelligence" ? "active" : ""}`}
              style={{
                background: activePage === "market-intelligence" ? "rgba(10, 132, 255, 0.15)" : "transparent",
                border: "none",
                width: "100%",
                textAlign: "left"
              }}
            >
              <Activity
                size={16}
                strokeWidth={2}
                style={{ color: activePage === "market-intelligence" ? "var(--apple-blue)" : "var(--text-secondary)" }}
              />
              <span style={{
                color: activePage === "market-intelligence" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: activePage === "market-intelligence" ? 600 : 500
              }}>
                Market Intelligence
              </span>
            </button>

            <button
              onClick={() => {
                if (onSelectPage) onSelectPage("finance-news");
                if (onCloseMobile) onCloseMobile();
              }}
              className={`sidebar-nav-item ${activePage === "finance-news" ? "active" : ""}`}
              style={{
                background: activePage === "finance-news" ? "rgba(10, 132, 255, 0.15)" : "transparent",
                border: "none",
                width: "100%",
                textAlign: "left"
              }}
            >
              <Newspaper
                size={16}
                strokeWidth={2}
                style={{ color: activePage === "finance-news" ? "var(--apple-blue)" : "var(--text-secondary)" }}
              />
              <span style={{
                color: activePage === "finance-news" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: activePage === "finance-news" ? 600 : 500
              }}>
                Finance News
              </span>
              {newsLoading ? (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "9999px",
                    background: "rgba(255, 69, 58, 0.15)",
                    border: "1px solid rgba(255, 69, 58, 0.35)",
                    color: "var(--apple-red)",
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 8px rgba(255, 69, 58, 0.2)",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  Offline
                </span>
              ) : (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "9999px",
                    background: "rgba(48, 209, 88, 0.15)",
                    border: "1px solid rgba(48, 209, 88, 0.25)",
                    color: "var(--apple-green)",
                    letterSpacing: "0.04em",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  Live
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-brand">
              <span className="sidebar-footer-version">ArthaX v2.0</span>
              <span className="sidebar-footer-dot">•</span>
              <span className="sidebar-footer-powered">
                Powered By{" "}
                <a
                  href="https://astragenx.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-footer-link"
                >
                  AstraGenX
                  <span className="sidebar-footer-arrow">↗</span>
                </a>
              </span>
            </div>

            <div className="sidebar-footer-credits">
              <div>All rights reserved</div>
              <div className="sidebar-footer-author">
                Developed by{" "}
                <a
                  href="https://bangadhipati.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-footer-link"
                >
                  Debarghya Bhowmick
                  <span className="sidebar-footer-arrow">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

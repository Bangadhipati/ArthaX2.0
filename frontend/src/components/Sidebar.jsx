import React from "react";
import { Activity } from "lucide-react";

export default function Sidebar({
  activePage = "market-intelligence",
  onSelectPage,
  mobileOpen = false,
  onCloseMobile
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
              className="sidebar-nav-item active"
              style={{
                background: "rgba(10, 132, 255, 0.15)",
                border: "none",
                width: "100%",
                textAlign: "left"
              }}
            >
              <Activity
                size={16}
                strokeWidth={2}
                style={{ color: "var(--apple-blue)" }}
              />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>
                Market Intelligence
              </span>
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
                <span className="sidebar-footer-author-name">Debarghya Bhowmick</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

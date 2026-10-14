import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Building2 } from "lucide-react";
import { POPULAR_TICKERS } from "../mockData";
import { searchTickers } from "../api";

export default function SpotlightModal({ isOpen, onClose, onSelectTicker }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(POPULAR_TICKERS);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(POPULAR_TICKERS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const items = await searchTickers(query);
      setResults(items);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        zIndex: 50,
        animation: "fadeIn 0.15s ease-out"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "560px",
          maxWidth: "92vw",
          background: "rgba(22, 25, 33, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "22px",
          boxShadow: "var(--shadow-spotlight)",
          overflow: "hidden"
        }}
      >
        {/* Search Bar Input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <Search size={20} style={{ color: "var(--apple-blue)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search company name, symbol, ETF, or crypto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "16px",
              fontFamily: "var(--font-sans)",
              fontWeight: 400
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              <X size={13} />
            </button>
          ) : (
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>ESC to exit</span>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
          <div style={{
            padding: "8px 12px 6px",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-secondary)"
          }}>
            {query.trim() ? "Search Results" : "Featured Market Leaders"}
          </div>

          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              Searching global markets...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              No verified market symbols found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.symbol}
                onClick={() => {
                  onSelectTicker(item.symbol);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--apple-cyan)"
                  }}>
                    {item.type === "CRYPTOCURRENCY" ? <TrendingUp size={16} /> : <Building2 size={16} />}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "14px" }}>
                        {item.symbol}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "var(--text-secondary)"
                      }}>
                        {item.exchange || "GLOBAL"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {item.name}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "var(--apple-blue)", fontWeight: 500 }}>
                  Select ↵
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

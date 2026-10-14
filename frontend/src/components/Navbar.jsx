import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Globe, Loader2, Zap, Building2 } from "lucide-react";
import { searchTickers } from "../api";

export default function Navbar({
  aiStatus = "idle",
  onConnectAI,
  usdInrRate,
  onSelectTicker
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search (case-insensitive)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    const timeout = setTimeout(async () => {
      const items = await searchTickers(query);
      setResults(items);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (symbol) => {
    onSelectTicker(symbol);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results && results.length > 0) {
        handleSelect(results[0].symbol);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 28px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(10, 11, 15, 0.8)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      {/* Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src="/astragenx-logo.jpg"
          alt="AstraGenX ArthaX"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            objectFit: "cover",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 4px 14px rgba(255, 69, 58, 0.2)"
          }}
        />
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

      {/* Inline Apple Search Bar with Anchored Dropdown (No full-screen popup) */}
      <div ref={containerRef} style={{ position: "relative", width: "400px", maxWidth: "45%" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(255, 255, 255, 0.06)",
          border: `1px solid ${isOpen ? "rgba(10, 132, 255, 0.5)" : "var(--border-subtle)"}`,
          borderRadius: "9999px",
          padding: "8px 16px",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isOpen ? "0 0 0 3px rgba(10, 132, 255, 0.15)" : "none"
        }}>
          <Search size={15} style={{ color: isOpen ? "var(--apple-blue)" : "var(--text-secondary)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim()) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Search company (e.g. apple, tata, nvda)..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontFamily: "var(--font-sans)"
            }}
          />
          {query ? (
            <button
              onClick={() => { setQuery(""); setIsOpen(false); }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "2px"
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd style={{
              fontSize: "10px",
              padding: "2px 5px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              color: "var(--text-secondary)"
            }}>
              ↵
            </kbd>
          )}
        </div>

        {/* Anchored Inline Dropdown List */}
        {isOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "rgba(18, 20, 26, 0.96)",
            backdropFilter: "blur(28px) saturate(190%)",
            WebkitBackdropFilter: "blur(28px) saturate(190%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-card)",
            maxHeight: "340px",
            overflowY: "auto",
            padding: "6px",
            zIndex: 100,
            animation: "fadeIn 0.15s ease-out"
          }}>
            {loading ? (
              <div style={{ padding: "14px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Loader2 size={13} className="spin-animation" style={{ color: "var(--apple-blue)" }} />
                <span>Searching markets for "{query}"...</span>
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                No companies found matching "{query}".
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "7px",
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--apple-cyan)",
                      flexShrink: 0
                    }}>
                      <Building2 size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "13px" }}>
                          {item.symbol}
                        </span>
                        <span style={{
                          fontSize: "10px",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "var(--text-secondary)"
                        }}>
                          {item.exchange || "GLOBAL"}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "240px"
                      }}>
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: "11px", color: "var(--apple-blue)", fontWeight: 500, flexShrink: 0, marginLeft: "8px" }}>
                    Select ↵
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Intelligence Status & Genuine FX Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Genuine USD/INR Live FX Pill (No fake 84.10) */}
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
          <span>
            {usdInrRate ? (
              <>1 USD = <strong style={{ color: "#ffffff" }}>₹{Number(usdInrRate).toFixed(2)}</strong></>
            ) : (
              <span>USD/INR Live FX</span>
            )}
          </span>
        </div>

        {/* 3-State AI Connection Trigger */}
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

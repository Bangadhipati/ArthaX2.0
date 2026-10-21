import React, { useState, useEffect, useRef } from "react";
import { Search, X, MoreVertical, Building2 } from "lucide-react";
import { searchTickers } from "../api";

export default function Navbar({
  onSelectTicker,
  mobileOpen = false,
  onToggleMobile
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const mobileInputRef = useRef(null);
  const desktopResultsRef = useRef(null);
  const mobileResultsRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Debounced search (case-insensitive)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    const timeout = setTimeout(async () => {
      const items = await searchTickers(query);
      setResults(items);
      setActiveIndex(-1);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Auto-scroll active recommendation into view when navigating with Arrow keys
  useEffect(() => {
    if (activeIndex >= 0) {
      const activeContainer = mobileSearchOpen ? mobileResultsRef.current : desktopResultsRef.current;
      if (activeContainer && activeContainer.children && activeContainer.children[activeIndex]) {
        activeContainer.children[activeIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, mobileSearchOpen]);

  const handleSelect = (symbol) => {
    onSelectTicker(symbol);
    setQuery("");
    setIsOpen(false);
    setMobileSearchOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results && results.length > 0) {
        const targetItem = activeIndex >= 0 && activeIndex < results.length
          ? results[activeIndex]
          : results[0];
        if (targetItem) {
          handleSelect(targetItem.symbol);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setMobileSearchOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <header className="nav-header-padding" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      height: "64px",
      boxSizing: "border-box",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(10, 11, 15, 0.88)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      flexShrink: 0,
      position: "relative",
      zIndex: 100
    }}>
      {/* State 1: Mobile Full-Width Search Bar Mode (Logo & text disappear) */}
      {mobileSearchOpen ? (
        <div ref={containerRef} className="nav-mobile-search-full">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--apple-blue)",
            borderRadius: "9999px",
            padding: "8px 14px",
            width: "100%",
            boxShadow: "0 0 0 3px rgba(10, 132, 255, 0.15)"
          }}>
            <Search size={16} style={{ color: "var(--apple-blue)", flexShrink: 0 }} />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search ticker (e.g. apple, tata, nvda)..."
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "14px",
                fontFamily: "var(--font-sans)"
              }}
            />
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                setMobileSearchOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              aria-label="Close search"
            >
              <X size={17} />
            </button>
          </div>

          {/* Mobile Search Autocomplete Dropdown */}
          {isOpen && (
            <div
              ref={mobileResultsRef}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: "rgba(18, 20, 26, 0.96)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
                maxHeight: "360px",
                overflowY: "auto",
                padding: "6px",
                zIndex: 1000
              }}
            >
              {loading ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                  Searching verified symbols...
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                  No matching tickers found
                </div>
              ) : (
                results.map((item, index) => {
                  const isItemActive = index === activeIndex;
                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleSelect(item.symbol)}
                      onMouseEnter={() => setActiveIndex(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: isItemActive ? "rgba(10, 132, 255, 0.22)" : "transparent",
                        border: isItemActive ? "1px solid rgba(10, 132, 255, 0.45)" : "1px solid transparent",
                        boxShadow: isItemActive ? "0 0 12px rgba(10, 132, 255, 0.2)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "7px",
                          background: isItemActive ? "rgba(10, 132, 255, 0.3)" : "rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--apple-blue)",
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
                            color: isItemActive ? "rgba(255, 255, 255, 0.85)" : "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "200px"
                          }}>
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        /* State 2: Default Brand Identity + Search */
        <>
          {/* Brand Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Mobile Vertical 3-Dot Button */}
            <button
              onClick={onToggleMobile}
              className="mobile-menu-btn"
              aria-label="Toggle Navigation Drawer"
            >
              <MoreVertical size={21} />
            </button>

            {/* Circular AstraGenX Logo */}
            <img
              src="/astragenx-logo.jpg"
              alt="AstraGenX ArthaX"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                boxShadow: "0 0 12px rgba(255, 69, 58, 0.25)",
                flexShrink: 0
              }}
            />

            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="nav-brand-title">
                  Artha<span className="brand-x">X</span>
                </span>
              </div>
              <p className="nav-brand-subtitle">
                From Family of AstraGenX
              </p>
            </div>
          </div>

          {/* Desktop Inline Search Bar with Anchored Dropdown */}
          <div ref={containerRef} className="nav-desktop-search">
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
              {query && (
                <button
                  onClick={() => { setQuery(""); setIsOpen(false); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Anchored Floating Dropdown (Desktop) */}
            {isOpen && (
              <div
                ref={desktopResultsRef}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "rgba(18, 20, 26, 0.95)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
                  maxHeight: "360px",
                  overflowY: "auto",
                  padding: "6px",
                  zIndex: 1000
                }}
              >
                {loading ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                    Searching verified market symbols...
                  </div>
                ) : results.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                    No matching companies or tickers found
                  </div>
                ) : (
                  results.map((item, index) => {
                    const isItemActive = index === activeIndex;
                    return (
                      <div
                        key={item.symbol}
                        onClick={() => handleSelect(item.symbol)}
                        onMouseEnter={() => setActiveIndex(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: isItemActive ? "rgba(10, 132, 255, 0.22)" : "transparent",
                          border: isItemActive ? "1px solid rgba(10, 132, 255, 0.45)" : "1px solid transparent",
                          boxShadow: isItemActive ? "0 0 12px rgba(10, 132, 255, 0.2)" : "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <div style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            background: isItemActive ? "rgba(10, 132, 255, 0.35)" : "rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--apple-blue)",
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
                              color: isItemActive ? "rgba(255, 255, 255, 0.85)" : "var(--text-secondary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "240px"
                            }}>
                              {item.name}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: "11px",
                          color: isItemActive ? "#ffffff" : "var(--apple-blue)",
                          fontWeight: 600,
                          flexShrink: 0,
                          marginLeft: "8px",
                          background: isItemActive ? "rgba(10, 132, 255, 0.35)" : "transparent",
                          padding: isItemActive ? "2px 8px" : "2px 4px",
                          borderRadius: "6px",
                          transition: "all 0.15s ease"
                        }}>
                          {isItemActive ? "↵ Select" : "Select ↵"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Icon Trigger Button (On right of Navbar) */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="nav-mobile-search-toggle"
            aria-label="Open Search"
          >
            <Search size={17} />
          </button>
        </>
      )}
    </header>
  );
}

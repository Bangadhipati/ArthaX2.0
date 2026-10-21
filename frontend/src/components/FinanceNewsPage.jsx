import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Newspaper,
  ExternalLink,
  Clock,
  Search,
  X,
  RotateCw,
  TrendingUp,
  Globe,
  Cpu,
  Building2,
  Coins,
  Flame,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { fetchFinanceNews } from "../api";

// Helper to sanitize news descriptions from stray HTML entities or &nbsp;
const cleanNewsSummary = (text, title = "") => {
  if (!text) return "";
  let clean = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, " - ")
    .replace(/&mdash;/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

  // If description repeats headline verbatim, skip redundant duplication
  if (title && clean.toLowerCase() === title.trim().toLowerCase()) {
    return "";
  }
  return clean;
};

// Calculates exact relative time against client's live clock (e.g. '4m ago', '35m ago')
export const getDynamicTimeAgo = (pubDateOrTs, fallback = "Recent") => {
  if (!pubDateOrTs) return fallback;
  const ts = typeof pubDateOrTs === "number" ? pubDateOrTs : new Date(pubDateOrTs).getTime();
  if (isNaN(ts) || ts <= 0) return fallback;
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - (ts > 1e11 ? ts : ts * 1000)) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const CATEGORIES = [
  { id: "all", label: "All News", icon: Globe },
  { id: "markets", label: "Global Markets", icon: TrendingUp },
  { id: "tech", label: "Tech & AI", icon: Cpu },
  { id: "india", label: "India & NSE", icon: Building2 },
  { id: "crypto", label: "Crypto & Macro", icon: Coins }
];

// Bidirectional company name & ticker alias mapping
const COMPANY_ALIASES = {
  apple: ["AAPL", "apple", "iphone", "tim cook"],
  aapl: ["AAPL", "apple"],
  tesla: ["TSLA", "tesla", "elon musk", "ev"],
  tsla: ["TSLA", "tesla"],
  nvidia: ["NVDA", "nvidia", "jensen huang", "blackwell", "ai chips"],
  nvda: ["NVDA", "nvidia"],
  microsoft: ["MSFT", "microsoft", "azure", "satya nadella"],
  msft: ["MSFT", "microsoft"],
  google: ["GOOGL", "google", "alphabet", "gemini", "sundar"],
  alphabet: ["GOOGL", "google", "alphabet"],
  googl: ["GOOGL", "google", "alphabet"],
  amazon: ["AMZN", "amazon", "aws"],
  amzn: ["AMZN", "amazon"],
  meta: ["META", "meta", "facebook", "instagram"],
  facebook: ["META", "meta"],
  netflix: ["NFLX", "netflix"],
  nflx: ["NFLX", "netflix"],
  amd: ["AMD", "amd"],
  intel: ["INTC", "intel"],
  palantir: ["PLTR", "palantir"],
  pltr: ["PLTR", "palantir"],
  boeing: ["BA", "boeing"],
  reliance: ["RELIANCE.NS", "reliance", "ambani", "jio"],
  tata: ["TATAMOTORS.NS", "TCS.NS", "tata", "tata motors", "tcs"],
  "tata motors": ["TATAMOTORS.NS", "tata motors"],
  tcs: ["TCS.NS", "tcs", "tata consultancy"],
  infosys: ["INFY.NS", "infosys"],
  infy: ["INFY.NS", "infosys"],
  hdfc: ["HDFCBANK.NS", "hdfc", "hdfc bank"],
  icici: ["ICICIBANK.NS", "icici"],
  sbi: ["SBIN.NS", "sbi", "state bank"],
  nifty: ["NIFTY", "nifty", "nse", "nifty 50"],
  sensex: ["SENSEX", "sensex", "bse"],
  bitcoin: ["BTC-USD", "bitcoin", "crypto", "btc"],
  btc: ["BTC-USD", "bitcoin", "btc"],
  jpmorgan: ["JPM", "jpmorgan", "jp morgan", "jamie dimon"],
  jpm: ["JPM", "jpmorgan"],
  goldman: ["GS", "goldman", "goldman sachs"],
  gs: ["GS", "goldman"],
  ebay: ["EBAY", "ebay"],
  oracle: ["ORCL", "oracle"],
  salesforce: ["CRM", "salesforce"],
  adobe: ["ADBE", "adobe"],
  cisco: ["CSCO", "cisco"],
  ibm: ["IBM", "ibm"],
  uber: ["UBER", "uber"],
  airbnb: ["ABNB", "airbnb"],
  spotify: ["SPOT", "spotify"],
  walmart: ["WMT", "walmart"],
  costco: ["COST", "costco"],
  disney: ["DIS", "disney"],
  starbucks: ["SBUX", "starbucks"],
  mcdonalds: ["MCD", "mcdonald's", "mcdonalds"],
  nike: ["NKE", "nike"],
  exxon: ["XOM", "exxon", "oil"],
  chevron: ["CVX", "chevron", "oil"],
  lilly: ["LLY", "eli lilly", "mounjaro"],
  pfizer: ["PFE", "pfizer"],
  abbott: ["ABT", "abbott"],
  adani: ["ADANIENT.NS", "adani", "adani ports"],
  zomato: ["ZOMATO.NS", "zomato"],
  airtel: ["BHARTIARTL.NS", "airtel", "bharti"],
  larsen: ["LT.NS", "larsen", "l&t"]
};

// Formats ticker badges to display clean market names without technical carets (^)
export const formatTickerDisplay = (sym) => {
  if (!sym) return "";
  const clean = sym.replace(/^\^/, "").toUpperCase();
  if (clean === "NSEI" || clean === "NIFTY" || clean === "NIFTY50") return "NIFTY 50";
  if (clean === "BSESN" || clean === "SENSEX" || clean === "BSE") return "SENSEX";
  if (clean === "GSPC" || clean === "SP500" || clean === "S&P 500") return "S&P 500";
  if (clean === "IXIC" || clean === "NASDAQ") return "NASDAQ";
  if (clean === "DJI" || clean === "DOW") return "DOW JONES";
  return sym.replace(/^\^/, "");
};

export default function FinanceNewsPage({ onSelectTicker, onLoadingChange }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Synchronize loading and refreshing status with parent (Sidebar badge)
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading || isRefreshing);
    }
  }, [loading, isRefreshing, onLoadingChange]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search on click outside if query is empty
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSearchOpen &&
        !searchQuery.trim() &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, searchQuery]);

  // Fetch real-time news from API (with category and optional server query)
  const loadNews = async (cat = activeCategory, query = "", isInitial = true) => {
    if (isInitial) setLoading(true);
    try {
      const items = await fetchFinanceNews(cat, query, 40);
      if (items && items.length > 0) {
        setNews(items);
        setLastUpdated(new Date());
      } else if (isInitial) {
        setNews([]);
      }
    } catch (err) {
      console.warn("Failed to fetch live news:", err);
      if (isInitial) setNews([]);
    } finally {
      if (isInitial) setLoading(false);
      setIsRefreshing(false);
      setIsSearchingServer(false);
    }
  };

  // Auto-refresh breaking wire every 45 seconds so live updates stream in continually
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSearchOpen && !searchQuery.trim()) {
        loadNews(activeCategory, "", false);
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [activeCategory, isSearchOpen, searchQuery]);

  // Initial load and category changes
  useEffect(() => {
    setSearchQuery("");
    setIsSearchOpen(false);
    loadNews(activeCategory, "", true);
  }, [activeCategory]);

  // Debounced server search for live company queries
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      setIsSearchingServer(true);
      loadNews(activeCategory, trimmed);
    }, 550);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, activeCategory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNews(activeCategory, searchQuery.trim(), false);
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    loadNews(activeCategory, "");
  };

  const handleCardClick = (e, url) => {
    // If the click originated from a button (e.g. ticker badge) or an existing <a> tag, don't trigger secondary open
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleKeyDownSearch = (e) => {
    if (e.key === "Enter") {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setIsSearchingServer(true);
      loadNews(activeCategory, searchQuery.trim());
    } else if (e.key === "Escape") {
      handleCloseSearch();
    }
  };

  // Client-side instant filter: matches headline, summary, publisher, tickers, OR company name aliases
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const q = searchQuery.toLowerCase().trim();

    // Check if query is an alias for known tickers/companies
    const aliasKeywords = COMPANY_ALIASES[q] || [q];

    return news.filter(item => {
      const titleLower = (item.title || "").toLowerCase();
      const summaryLower = (item.summary || "").toLowerCase();
      const publisherLower = (item.publisher || "").toLowerCase();
      const tickersUpper = (item.tickers || []).map(t => t.toUpperCase());

      // Direct text matches
      const directMatch =
        titleLower.includes(q) ||
        summaryLower.includes(q) ||
        publisherLower.includes(q) ||
        tickersUpper.some(t => t.toLowerCase().includes(q));

      if (directMatch) return true;

      // Alias matches (e.g. searching "Apple" matches articles with ticker AAPL, searching "Tesla" matches TSLA)
      return aliasKeywords.some(keyword => {
        const kwLower = keyword.toLowerCase();
        const kwUpper = keyword.toUpperCase();
        return (
          titleLower.includes(kwLower) ||
          summaryLower.includes(kwLower) ||
          tickersUpper.includes(kwUpper)
        );
      });
    });
  }, [news, searchQuery]);

  // Sort articles strictly in sequence based on publication timestamp descending
  const sortedFilteredNews = useMemo(() => {
    return [...filteredNews].sort((a, b) => {
      const timeA = a.timestamp || (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const timeB = b.timestamp || (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [filteredNews]);

  const heroArticle = sortedFilteredNews.length > 0 ? sortedFilteredNews[0] : null;
  const gridArticles = sortedFilteredNews.length > 1 ? sortedFilteredNews.slice(1) : [];

  return (
    <div className="finance-news-container">
      {/* Top Banner / Title Bar (Unboxed & Open) */}
      <div className="news-header-unboxed">
        <div className="news-title-group">
          <div className="news-header-icon-box">
            <Newspaper size={19} style={{ color: "var(--apple-blue)" }} />
          </div>
          <div className="news-title-text-col">
            <div className="news-title-row">
              <h1 className="news-main-title">Financial Intelligence & Global News</h1>
              {loading || isRefreshing ? (
                <div className="news-live-badge offline" title="Updating news feeds...">
                  <div className="breathing-dot-red" />
                  <span>OFFLINE</span>
                </div>
              ) : (
                <div className="news-live-badge" title="Live wire active">
                  <div className="breathing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--apple-green)" }} />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right actions: Expandable Search & Refresh */}
        <div className="news-actions-bar" ref={searchContainerRef}>
          {isSearchOpen ? (
            <div className="news-search-expandable open">
              {isSearchingServer ? (
                <Loader2 size={14} className="spin-animation" style={{ color: "var(--apple-blue)", flexShrink: 0 }} />
              ) : (
                <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDownSearch}
                placeholder="Search company or ticker (e.g. Apple, Tesla, NVDA)..."
                className="news-search-input"
              />
              <button
                onClick={handleCloseSearch}
                className="news-search-close-btn"
                title="Close search"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenSearch}
              className="apple-button news-search-trigger-btn"
              title="Search news by company or ticker"
            >
              <Search size={14} />
              <span className="news-search-btn-label">Search</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="apple-button news-refresh-btn"
            title="Refresh latest news wire"
          >
            <RotateCw size={14} className={isRefreshing || loading ? "spin-animation" : ""} />
            <span className="desktop-only-inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="news-category-bar">
        <div className="news-category-scroll">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`news-cat-pill ${isActive ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        <div className="news-timestamp">
          <Clock size={12} />
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </div>

      {/* Skeleton Loading State with Animated Lines */}
      {loading && (
        <div className="news-skeleton-layout">
          {/* Hero Card Skeleton */}
          <div className="news-hero-card apple-glass news-skeleton-card-container">
            <div className="news-skeleton-meta-row">
              <div className="skeleton-line skeleton-badge-shimmer" style={{ width: "95px", height: "20px" }} />
              <div className="skeleton-line" style={{ width: "110px", height: "13px" }} />
              <div className="skeleton-line" style={{ width: "60px", height: "13px" }} />
            </div>
            <div className="news-skeleton-title-lines">
              <div className="skeleton-line" style={{ width: "92%", height: "24px", marginBottom: "10px" }} />
              <div className="skeleton-line" style={{ width: "65%", height: "24px", marginBottom: "16px" }} />
            </div>
            <div className="news-skeleton-summary-lines">
              <div className="skeleton-line" style={{ width: "100%", height: "14px", marginBottom: "8px" }} />
              <div className="skeleton-line" style={{ width: "85%", height: "14px", marginBottom: "20px" }} />
            </div>
            <div className="news-skeleton-footer-row">
              <div style={{ display: "flex", gap: "8px" }}>
                <div className="skeleton-line skeleton-pill-shimmer" style={{ width: "64px", height: "26px" }} />
                <div className="skeleton-line skeleton-pill-shimmer" style={{ width: "72px", height: "26px" }} />
              </div>
              <div className="skeleton-line skeleton-btn-shimmer" style={{ width: "110px", height: "30px" }} />
            </div>
          </div>

          {/* Grid Cards Skeleton */}
          <div className="news-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="news-card apple-glass news-skeleton-card-container">
                <div className="news-skeleton-meta-row">
                  <div className="skeleton-line" style={{ width: "85px", height: "13px" }} />
                  <div className="skeleton-line" style={{ width: "50px", height: "13px" }} />
                </div>
                <div className="news-skeleton-title-lines" style={{ marginBottom: "14px" }}>
                  <div className="skeleton-line" style={{ width: "95%", height: "17px", marginBottom: "8px" }} />
                  <div className="skeleton-line" style={{ width: "70%", height: "17px" }} />
                </div>
                <div className="news-skeleton-summary-lines" style={{ marginBottom: "18px", flex: 1 }}>
                  <div className="skeleton-line" style={{ width: "100%", height: "12px", marginBottom: "6px" }} />
                  <div className="skeleton-line" style={{ width: "80%", height: "12px" }} />
                </div>
                <div className="news-skeleton-footer-row">
                  <div className="skeleton-line skeleton-pill-shimmer" style={{ width: "58px", height: "22px" }} />
                  <div className="skeleton-line" style={{ width: "22px", height: "22px", borderRadius: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content State */}
      {!loading && (
        <>
          {filteredNews.length === 0 ? (
            <div className="news-empty-state apple-glass">
              <Search size={36} style={{ color: "var(--text-tertiary)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}>
                No news found matching "{searchQuery}"
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", maxWidth: "460px" }}>
                Try searching for company names like "Apple", "Tesla", "Nvidia", "Tata Motors", or standard tickers like "NVDA", "AAPL", "RELIANCE.NS".
              </p>
              <button
                onClick={handleCloseSearch}
                className="apple-button apple-button-primary"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <>
              {/* Hero Breaking Story Card */}
              {heroArticle && (
                <article
                  className="news-hero-card apple-glass news-card-clickable"
                  onClick={(e) => handleCardClick(e, heroArticle.link)}
                  title="Click to read full story"
                >
                  <div className="news-hero-content">
                    <div className="news-meta-row">
                      <span className="news-breaking-badge">
                        <Flame size={12} />
                        TOP STORY
                      </span>
                      <span className="news-publisher">{heroArticle.publisher || "Global Wire"}</span>
                      <span className="news-meta-dot">•</span>
                      <span className="news-time">
                        <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                        {getDynamicTimeAgo(heroArticle.timestamp || heroArticle.publishedAt, heroArticle.relativeTime)}
                      </span>
                    </div>

                    <h2 className="news-hero-title">
                      <a
                        href={heroArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link-overlay"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {heroArticle.title}
                      </a>
                    </h2>

                    {heroArticle.summary && cleanNewsSummary(heroArticle.summary, heroArticle.title) && (
                      <p className="news-hero-summary">
                        {cleanNewsSummary(heroArticle.summary, heroArticle.title)}
                      </p>
                    )}

                    <div className="news-footer-row">
                      {/* Clean Ticker Badges WITHOUT dollar sign or caret ^ */}
                      <div className="news-tickers-list">
                        {heroArticle.tickers && heroArticle.tickers.length > 0 ? (
                          heroArticle.tickers.map(tickerSym => {
                            const cleanSym = tickerSym.replace(/^\^/, "");
                            const displayLabel = formatTickerDisplay(tickerSym);
                            return (
                              <button
                                key={tickerSym}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectTicker) onSelectTicker(cleanSym);
                                }}
                                className="news-ticker-tag"
                                title={`Analyze ${displayLabel} in Market Intelligence`}
                              >
                                <TrendingUp size={11} />
                                <span>{displayLabel}</span>
                              </button>
                            );
                          })
                        ) : (
                          <span className="news-general-tag">Market Wire</span>
                        )}
                      </div>

                      <a
                        href={heroArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-read-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Full Coverage</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </article>
              )}

              {/* Grid of Remaining Articles */}
              <div className="news-grid">
                {gridArticles.map((article, index) => (
                  <article
                    key={article.id || index}
                    className="news-card apple-glass news-card-clickable"
                    onClick={(e) => handleCardClick(e, article.link)}
                    title="Click to read full story"
                  >
                    <div className="news-card-inner">
                      <div className="news-meta-row">
                        <span className="news-publisher">{article.publisher || "Finance News"}</span>
                        <span className="news-meta-dot">•</span>
                        <span className="news-time">{getDynamicTimeAgo(article.timestamp || article.publishedAt, article.relativeTime)}</span>
                      </div>

                      <h3 className="news-card-title">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-card-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.title}
                        </a>
                      </h3>

                      {article.summary && cleanNewsSummary(article.summary, article.title) && (
                        <p className="news-card-summary">
                          {cleanNewsSummary(article.summary, article.title)}
                        </p>
                      )}

                      <div className="news-card-footer">
                        {/* Clean Ticker Badges WITHOUT dollar sign or caret ^ */}
                        <div className="news-tickers-list">
                          {article.tickers && article.tickers.length > 0 ? (
                            article.tickers.slice(0, 3).map(tickerSym => {
                              const cleanSym = tickerSym.replace(/^\^/, "");
                              const displayLabel = formatTickerDisplay(tickerSym);
                              return (
                                <button
                                  key={tickerSym}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectTicker) onSelectTicker(cleanSym);
                                  }}
                                  className="news-ticker-tag"
                                  title={`Analyze ${displayLabel} in Market Intelligence`}
                                >
                                  {displayLabel}
                                </button>
                              );
                            })
                          ) : (
                            <span className="news-general-tag">Markets</span>
                          )}
                        </div>

                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-card-external"
                          title="Open original article"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

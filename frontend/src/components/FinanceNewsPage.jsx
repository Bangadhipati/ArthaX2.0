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
import { MOCK_FINANCE_NEWS } from "../mockData";

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
  nifty: ["^NSEI", "nifty", "nse"],
  sensex: ["^BSESN", "sensex", "bse"],
  bitcoin: ["BTC-USD", "bitcoin", "crypto", "btc"],
  btc: ["BTC-USD", "bitcoin", "btc"]
};

export default function FinanceNewsPage({ onSelectTicker }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [news, setNews] = useState(MOCK_FINANCE_NEWS);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

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

  // Fetch news from API (with category and optional server query)
  const loadNews = async (cat = activeCategory, query = "") => {
    setLoading(true);
    try {
      const items = await fetchFinanceNews(cat, query, 40);
      if (items && items.length > 0) {
        setNews(items);
        setLastUpdated(new Date());
      } else if (!query) {
        // Fallback filter on mock news only if general feed fails
        if (cat === "all") {
          setNews(MOCK_FINANCE_NEWS);
        } else {
          setNews(MOCK_FINANCE_NEWS.filter(n => n.category === cat || !n.category));
        }
      } else {
        // Empty query results from server
        setNews([]);
      }
    } catch (err) {
      console.warn("Failed to fetch news:", err);
      if (!query) setNews(MOCK_FINANCE_NEWS);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsSearchingServer(false);
    }
  };

  // Initial load and category changes
  useEffect(() => {
    setSearchQuery("");
    setIsSearchOpen(false);
    loadNews(activeCategory, "");
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
    loadNews(activeCategory, searchQuery.trim());
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

  const heroArticle = filteredNews.length > 0 ? filteredNews[0] : null;
  const gridArticles = filteredNews.length > 1 ? filteredNews.slice(1) : [];

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
              <div className="news-live-badge">
                <div className="breathing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--apple-green)" }} />
                <span>LIVE WIRE</span>
              </div>
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
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {loading && (
        <div className="news-skeleton-layout">
          <div className="skeleton-card news-skeleton-hero" />
          <div className="news-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card news-skeleton-card" />
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
                        {heroArticle.relativeTime || heroArticle.timeAgo || "Just now"}
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

                    {heroArticle.summary && heroArticle.summary !== heroArticle.title && (
                      <p className="news-hero-summary">
                        {heroArticle.summary}
                      </p>
                    )}

                    <div className="news-footer-row">
                      {/* Clean Ticker Badges WITHOUT dollar sign */}
                      <div className="news-tickers-list">
                        {heroArticle.tickers && heroArticle.tickers.length > 0 ? (
                          heroArticle.tickers.map(tickerSym => (
                            <button
                              key={tickerSym}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectTicker) onSelectTicker(tickerSym);
                              }}
                              className="news-ticker-tag"
                              title={`Analyze ${tickerSym} in Market Intelligence`}
                            >
                              <TrendingUp size={11} />
                              <span>{tickerSym}</span>
                            </button>
                          ))
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
                        <span className="news-time">{article.relativeTime || article.timeAgo || "Recent"}</span>
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

                      {article.summary && article.summary !== article.title && (
                        <p className="news-card-summary">
                          {article.summary}
                        </p>
                      )}

                      <div className="news-card-footer">
                        {/* Clean Ticker Badges WITHOUT dollar sign */}
                        <div className="news-tickers-list">
                          {article.tickers && article.tickers.length > 0 ? (
                            article.tickers.slice(0, 3).map(tickerSym => (
                              <button
                                key={tickerSym}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectTicker) onSelectTicker(tickerSym);
                                }}
                                className="news-ticker-tag"
                                title={`Analyze ${tickerSym} in Market Intelligence`}
                              >
                                {tickerSym}
                              </button>
                            ))
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

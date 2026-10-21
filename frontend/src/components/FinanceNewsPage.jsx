import React, { useState, useEffect, useMemo } from "react";
import {
  Newspaper,
  ExternalLink,
  Clock,
  Search,
  RotateCw,
  TrendingUp,
  Globe,
  Cpu,
  Building2,
  Coins,
  Sparkles,
  Flame,
  ArrowUpRight
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

export default function FinanceNewsPage({ onSelectTicker }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState(MOCK_FINANCE_NEWS);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadNews = async (cat = activeCategory) => {
    setLoading(true);
    try {
      const items = await fetchFinanceNews(cat, "", 40);
      if (items && items.length > 0) {
        setNews(items);
        setLastUpdated(new Date());
      } else {
        // Fallback filter on mock news
        if (cat === "all") {
          setNews(MOCK_FINANCE_NEWS);
        } else {
          setNews(MOCK_FINANCE_NEWS.filter(n => n.category === cat || !n.category));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch news:", err);
      setNews(MOCK_FINANCE_NEWS);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews(activeCategory);
  }, [activeCategory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNews(activeCategory);
  };

  // Filter news client-side for instant responsive searching
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const q = searchQuery.toLowerCase().trim();
    return news.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const publisherMatch = item.publisher?.toLowerCase().includes(q);
      const tickerMatch = item.tickers?.some(t => t.toLowerCase().includes(q));
      return titleMatch || summaryMatch || publisherMatch || tickerMatch;
    });
  }, [news, searchQuery]);

  const heroArticle = filteredNews.length > 0 ? filteredNews[0] : null;
  const gridArticles = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  return (
    <div className="finance-news-container">
      {/* Top Banner / Title Bar */}
      <div className="news-header">
        <div className="news-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="news-header-icon-box">
              <Newspaper size={20} style={{ color: "var(--apple-blue)" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 className="news-main-title">Financial Intelligence & Global News</h1>
                <div className="news-live-badge">
                  <div className="breathing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--apple-green)" }} />
                  <span>LIVE WIRE</span>
                </div>
              </div>
              <p className="news-subtitle">
                Institutional market feeds from Bloomberg, WSJ, Reuters, CNBC & FT • 100% Free & Real-Time
              </p>
            </div>
          </div>
        </div>

        {/* Right actions: search & refresh */}
        <div className="news-actions-bar">
          <div className="news-search-box">
            <Search size={14} style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, topics, tickers ($NVDA, Fed, AI)..."
              className="news-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="news-search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

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
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Try searching for broader terms like "tech", "fed", "inflation", or reset your search filter.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="apple-button apple-button-primary"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <>
              {/* Hero Breaking Story Card */}
              {heroArticle && (
                <article className="news-hero-card apple-glass">
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
                        {heroArticle.relativeTime || "Just now"}
                      </span>
                    </div>

                    <h2 className="news-hero-title">
                      <a
                        href={heroArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link-overlay"
                      >
                        {heroArticle.title}
                      </a>
                    </h2>

                    {heroArticle.summary && (
                      <p className="news-hero-summary">
                        {heroArticle.summary}
                      </p>
                    )}

                    <div className="news-footer-row">
                      {/* Ticker Badges */}
                      <div className="news-tickers-list">
                        {heroArticle.tickers && heroArticle.tickers.length > 0 ? (
                          heroArticle.tickers.map(tickerSym => (
                            <button
                              key={tickerSym}
                              onClick={() => onSelectTicker && onSelectTicker(tickerSym)}
                              className="news-ticker-tag"
                              title={`Analyze ${tickerSym} in Market Intelligence`}
                            >
                              <TrendingUp size={11} />
                              <span>${tickerSym}</span>
                            </button>
                          ))
                        ) : (
                          <span className="news-general-tag">Market Overview</span>
                        )}
                      </div>

                      <a
                        href={heroArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-read-btn"
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
                  <article key={article.id || index} className="news-card apple-glass">
                    <div className="news-card-inner">
                      <div className="news-meta-row">
                        <span className="news-publisher">{article.publisher || "Finance News"}</span>
                        <span className="news-meta-dot">•</span>
                        <span className="news-time">{article.relativeTime || "Recent"}</span>
                      </div>

                      <h3 className="news-card-title">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-card-link"
                        >
                          {article.title}
                        </a>
                      </h3>

                      {article.summary && (
                        <p className="news-card-summary">
                          {article.summary}
                        </p>
                      )}

                      <div className="news-card-footer">
                        <div className="news-tickers-list">
                          {article.tickers && article.tickers.length > 0 ? (
                            article.tickers.slice(0, 3).map(tickerSym => (
                              <button
                                key={tickerSym}
                                onClick={() => onSelectTicker && onSelectTicker(tickerSym)}
                                className="news-ticker-tag"
                                title={`Analyze ${tickerSym} in Market Intelligence`}
                              >
                                ${tickerSym}
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

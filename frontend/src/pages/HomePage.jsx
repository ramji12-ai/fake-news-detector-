import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import HeroCarousel from "../components/HeroCarousel";
import NewsCard from "../components/NewsCard";

const EXPLORE_CARDS = [
  {
    id: "detector",
    title: "Fake News Detector",
    description: "Submit news articles to evaluate linguistic patterns via TF-IDF and trained Logistic Regression.",
    icon: "⚡",
    route: "/detector",
    badge: "ML Classifier"
  },
  {
    id: "ai-news",
    title: "AI News Assistant",
    description: "Ask questions regarding contemporary or historical news backed by Google Search grounding.",
    icon: "💬",
    route: "/ai-news",
    badge: "Web Grounded"
  },
  {
    id: "history",
    title: "News History",
    description: "Audit past classification runs, compare confidence distributions, and export full reports.",
    icon: "📜",
    route: "/history",
    badge: "Local Audit"
  },
  {
    id: "saved",
    title: "Saved Articles",
    description: "Bookmark important analyses for quick reference, re-testing, and comparative study.",
    icon: "🔖",
    route: "/saved",
    badge: "Bookmarks"
  },
  {
    id: "analytics",
    title: "Analytics Dashboard",
    description: "Explore empirical classification ratios, confidence percentiles, and temporal metrics.",
    icon: "📊",
    route: "/analytics",
    badge: "Visual Metrics"
  },
  {
    id: "architecture",
    title: "NLP & ML Architecture",
    description: "Deep-dive into tokenization regex, 30k TF-IDF n-grams, and probability calibrations.",
    icon: "🧠",
    route: "/architecture",
    badge: "Technical Specs"
  }
];

export default function HomePage() {
  const {
    newsArticles,
    isNewsLoading,
    newsError,
    fetchNews,
    setAboutUsModalOpen,
    setNewsSourceFilter
  } = useAppData();
  const navigate = useNavigate();

  const handleSourceClick = (sourceName) => {
    setNewsSourceFilter(sourceName);
    navigate("/ai-news");
  };

  const previewArticles = newsArticles.slice(0, 6);

  return (
    <div className="homepage-wrapper">
      {/* 1. Large Hero Carousel */}
      <HeroCarousel />

      <div className="container homepage-content">
        {/* 2. Explore VeriText Section */}
        <section className="home-section explore-veritext-section" aria-labelledby="explore-title">
          <div className="section-header-centered">
            <span className="section-pill">PLATFORM MODULES</span>
            <h2 id="explore-title" className="section-title">Explore VeriText</h2>
            <p className="section-subtitle">
              Comprehensive tools designed for transparent linguistic analysis, misinformation detection,
              and live accredited news intelligence.
            </p>
          </div>

          <div className="explore-cards-grid">
            {EXPLORE_CARDS.map((card) => (
              <Link
                key={card.id}
                to={card.route}
                className="explore-card"
                aria-label={`Open ${card.title}`}
              >
                <div className="explore-card-top">
                  <div className="explore-card-icon">{card.icon}</div>
                  <span className="explore-card-badge">{card.badge}</span>
                </div>
                <h3 className="explore-card-title">{card.title}</h3>
                <p className="explore-card-desc">{card.description}</p>
                <div className="explore-card-footer">
                  <span className="explore-action-label">Launch Module</span>
                  <span className="explore-card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. About Us Popup Banner */}
        <section className="home-section about-banner-section" aria-labelledby="about-banner-title">
          <div className="about-banner-card">
            <div className="about-banner-info">
              <span className="about-banner-tag">TRANSPARENT AI JOURNALISM</span>
              <h2 id="about-banner-title" className="about-banner-heading">
                About VeriText NLP
              </h2>
              <p className="about-banner-desc">
                VeriText NLP is an AI-powered news analysis platform that combines
                Natural Language Processing, Machine Learning, and web-based information
                retrieval to empower informed reading without unsubstantiated claims.
              </p>
            </div>
            <div className="about-banner-action">
              <button
                type="button"
                className="btn btn-primary btn-lg about-us-trigger-btn"
                onClick={() => setAboutUsModalOpen(true)}
              >
                <span>🛡️</span>
                <span>About VeriText NLP</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. Latest News Preview */}
        <section className="home-section latest-news-section" aria-labelledby="latest-news-title">
          <div className="section-header-split">
            <div>
              <span className="section-pill">LIVE AGGREGATION</span>
              <h2 id="latest-news-title" className="section-title">Latest News Preview</h2>
              <p className="section-subtitle">
                Real-time stories from accredited publishers. Click "Analyze with VeriText" on any card
                to test its text against our trained ML classifier.
              </p>
            </div>
            <div className="section-actions-row">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => fetchNews("", "", true)}
                disabled={isNewsLoading}
              >
                {isNewsLoading ? "Refreshing..." : "↻ Refresh Feed"}
              </button>
              <Link to="/ai-news" className="btn btn-sm btn-primary">
                View All Special Reports →
              </Link>
            </div>
          </div>

          {isNewsLoading && previewArticles.length === 0 ? (
            <div className="news-loading-skeletons">
              {[1, 2, 3].map((n) => (
                <div key={n} className="news-skeleton-card">
                  <div className="skeleton-media" />
                  <div className="skeleton-line full" />
                  <div className="skeleton-line half" />
                  <div className="skeleton-line quarter" />
                </div>
              ))}
            </div>
          ) : newsError && previewArticles.length === 0 ? (
            <div className="news-error-banner">
              <p>⚠️ {newsError}</p>
              <button
                type="button"
                className="btn btn-sm btn-primary mt-2"
                onClick={() => fetchNews("", "", true)}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="latest-news-grid">
              {previewArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* 5. Special News Sources Showcase */}
        <section className="home-section news-sources-showcase" aria-labelledby="sources-showcase-title">
          <div className="section-header-centered">
            <span className="section-pill">VERIFIED PROVIDERS</span>
            <h2 id="sources-showcase-title" className="section-title">Special News Sources</h2>
            <p className="section-subtitle">
              Direct official RSS feeds integrated without brittle web scrapers or fabricated data.
            </p>
          </div>

          <div className="sources-pills-grid">
            <div
              className="source-showcase-card"
              onClick={() => handleSourceClick("The Indian Express")}
              role="button"
              tabIndex={0}
            >
              <div className="source-dot" style={{ backgroundColor: "#e11d48" }} />
              <h4>The Indian Express</h4>
              <p>Comprehensive national reporting, politics &amp; investigative editorials</p>
              <span className="source-explore-link">Filter Source →</span>
            </div>

            <div
              className="source-showcase-card"
              onClick={() => handleSourceClick("NDTV")}
              role="button"
              tabIndex={0}
            >
              <div className="source-dot" style={{ backgroundColor: "#dc2626" }} />
              <h4>NDTV</h4>
              <p>Breaking top stories, global headlines, and national broadcast coverage</p>
              <span className="source-explore-link">Filter Source →</span>
            </div>

            <div
              className="source-showcase-card"
              onClick={() => handleSourceClick("The Hindu")}
              role="button"
              tabIndex={0}
            >
              <div className="source-dot" style={{ backgroundColor: "#2563eb" }} />
              <h4>The Hindu</h4>
              <p>Trusted national daily journalism, legal reporting &amp; public affairs</p>
              <span className="source-explore-link">Filter Source →</span>
            </div>

            <div
              className="source-showcase-card"
              onClick={() => handleSourceClick("The Times of India")}
              role="button"
              tabIndex={0}
            >
              <div className="source-dot" style={{ backgroundColor: "#d97706" }} />
              <h4>The Times of India</h4>
              <p>Leading circulation daily providing metro, business, and national feeds</p>
              <span className="source-explore-link">Filter Source →</span>
            </div>

            <div
              className="source-showcase-card"
              onClick={() => handleSourceClick("ESPNcricinfo")}
              role="button"
              tabIndex={0}
            >
              <div className="source-dot" style={{ backgroundColor: "#059669" }} />
              <h4>ESPNcricinfo</h4>
              <p>Live cricket reporting, tournament analysis, and international sports</p>
              <span className="source-explore-link">Filter Source →</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

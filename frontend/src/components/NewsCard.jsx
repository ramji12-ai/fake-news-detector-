import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useNavigate } from "react-router-dom";

export default function NewsCard({ article, compact = false }) {
  const {
    setNewsDetailArticle,
    analyzeNewsArticle,
    showToast,
    savedItems,
    saveNewsArticle
  } = useAppData();
  const navigate = useNavigate();

  const [imgError, setImgError] = useState(false);
  const [analyzingThis, setAnalyzingThis] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  if (!article) return null;

  const isSaved = savedItems.some(
    (item) => item.title === article.title || (item.url && item.url === article.url)
  );

  const handleReadMore = () => {
    setNewsDetailArticle(article);
  };

  const handleAnalyze = async () => {
    setAnalyzingThis(true);
    try {
      const res = await analyzeNewsArticle(article);
      if (res) {
        setPredictionResult(res);
      }
    } catch (_err) {
      showToast("Prediction failed for this article", "error", "prediction");
    } finally {
      setAnalyzingThis(false);
    }
  };

  const formattedDate = article.publishedAt
    ? (() => {
        try {
          const d = new Date(article.publishedAt);
          if (isNaN(d.getTime())) return article.publishedAt;
          return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
        } catch (_e) {
          return article.publishedAt;
        }
      })()
    : "Recent News";

  const fallbackPlaceholder = (
    <div className="news-img-placeholder">
      <span className="placeholder-icon">📰</span>
      <span className="placeholder-source">{article.source || "News"}</span>
    </div>
  );

  return (
    <article className={`news-card ${compact ? "news-card-compact" : ""}`}>
      {/* Article Image with Fallback */}
      <div className="news-card-media" onClick={handleReadMore}>
        {article.image && !imgError ? (
          <img
            src={article.image}
            alt={article.title || "News article image"}
            className="news-card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          fallbackPlaceholder
        )}
        <span
          className="news-source-badge"
          style={{ backgroundColor: article.badgeColor || "var(--primary)" }}
        >
          {article.source}
        </span>
      </div>

      {/* Card Content */}
      <div className="news-card-body">
        <div className="news-card-meta">
          <span className="news-category-tag">{article.category || "General"}</span>
          <span className="news-date-text">{formattedDate}</span>
        </div>

        <h3 className="news-card-title" onClick={handleReadMore} title={article.title}>
          {article.title}
        </h3>

        <p className="news-card-summary">
          {article.description
            ? article.description.length > 135
              ? `${article.description.slice(0, 135).trim()}...`
              : article.description
            : "Click 'Read More' to view the complete reporting from the original news publisher."}
        </p>

        {/* Prediction Results Banner (if user clicked Analyze with VeriText) */}
        {predictionResult && (
          <div
            className={`news-analysis-mini-result ${
              predictionResult.prediction === "REAL" ? "is-real" : "is-fake"
            }`}
          >
            <div className="mini-result-header">
              <span className="mini-verdict-badge">
                {predictionResult.prediction === "REAL" ? "✅ REAL" : "⚠️ FAKE"}
              </span>
              <span className="mini-confidence-val">
                {predictionResult.confidence.toFixed(1)}% Confidence
              </span>
            </div>
            <p className="mini-disclaimer-text">
              VeriText classification is an ML-based prediction and does not independently establish factual truth.
            </p>
          </div>
        )}

        {/* Card Actions */}
        <div className="news-card-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline news-read-btn"
            onClick={handleReadMore}
          >
            Read More
          </button>

          <button
            type="button"
            className={`btn btn-sm ${isSaved ? "btn-secondary is-saved" : "btn-outline"} news-save-btn`}
            onClick={() => saveNewsArticle(article)}
            title={
              isSaved
                ? "Click to remove from saved articles"
                : "Save this article to your account"
            }
          >
            <span aria-hidden="true">{isSaved ? "★" : "☆"}</span>
            <span>{isSaved ? "Saved" : "Save Article"}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary news-analyze-btn"
            onClick={handleAnalyze}
            disabled={analyzingThis}
          >
            {analyzingThis ? (
              <>
                <span className="btn-spinner" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

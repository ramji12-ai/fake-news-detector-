import React, { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useNavigate } from "react-router-dom";

export default function NewsDetailModal() {
  const {
    newsDetailArticle,
    setNewsDetailArticle,
    analyzeNewsArticle,
    showToast,
    savedItems,
    saveNewsArticle
  } = useAppData();
  const navigate = useNavigate();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setPredictionResult(null);
    setImgError(false);
  }, [newsDetailArticle]);

  useEffect(() => {
    if (!newsDetailArticle) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setNewsDetailArticle(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [newsDetailArticle, setNewsDetailArticle]);

  if (!newsDetailArticle) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeNewsArticle(newsDetailArticle);
      if (res) {
        setPredictionResult(res);
        showToast(`\u2713 Prediction: ${res.prediction} (${res.confidence.toFixed(1)}%)`, "info", "prediction");
      }
    } catch (_e) {
      showToast("Prediction failed", "error", "prediction");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenDetector = () => {
    setNewsDetailArticle(null);
    navigate("/detector");
  };

  const formattedDate = newsDetailArticle.publishedAt
    ? (() => {
        try {
          const d = new Date(newsDetailArticle.publishedAt);
          if (isNaN(d.getTime())) return newsDetailArticle.publishedAt;
          return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });
        } catch (_e) {
          return newsDetailArticle.publishedAt;
        }
      })()
    : "Recent News";

  return (
    <div
      className="modal-backdrop"
      onClick={() => setNewsDetailArticle(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-detail-title"
    >
      <div
        className="modal-card news-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="news-detail-header-meta">
            <span
              className="news-source-badge"
              style={{
                backgroundColor: newsDetailArticle.badgeColor || "var(--primary)"
              }}
            >
              {newsDetailArticle.source}
            </span>
            <span className="news-category-tag">
              {newsDetailArticle.category || "General News"}
            </span>
            <span className="news-date-text">{formattedDate}</span>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setNewsDetailArticle(null)}
            aria-label="Close Article Details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body news-detail-body">
          {/* Large Image */}
          {newsDetailArticle.image && !imgError ? (
            <div className="news-detail-media">
              <img
                src={newsDetailArticle.image}
                alt={newsDetailArticle.title}
                className="news-detail-img"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="news-detail-fallback-banner">
              <span>📰 Official {newsDetailArticle.source} Feed</span>
            </div>
          )}

          <h2 id="news-detail-title" className="news-detail-title">
            {newsDetailArticle.title}
          </h2>

          <div className="news-detail-content-text">
            <p>{newsDetailArticle.description || "No full summary provided in the feed."}</p>
          </div>

          {/* Prediction Result Display */}
          {predictionResult && (
            <div
              className={`news-analysis-callout ${
                predictionResult.prediction === "REAL" ? "is-real" : "is-fake"
              }`}
            >
              <div className="callout-top">
                <span className="callout-verdict">
                  {predictionResult.prediction === "REAL"
                    ? "✅ REAL (Predicted Authentic Style)"
                    : "⚠️ FAKE (Predicted Deceptive Patterns)"}
                </span>
                <span className="callout-conf">
                  Confidence: {predictionResult.confidence.toFixed(2)}%
                </span>
              </div>
              <p className="callout-disclaimer">
                VeriText classification is an ML-based prediction and does not independently establish factual truth.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline mt-2"
                onClick={handleOpenDetector}
              >
                Inspect in Full Detector Page →
              </button>
            </div>
          )}

          {/* Publisher attribution */}
          <div className="news-detail-source-box">
            <div className="source-box-info">
              <span className="source-label">Original Publication:</span>
              <strong>{newsDetailArticle.source}</strong>
            </div>
            {newsDetailArticle.url && (
              <a
                href={newsDetailArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline external-source-link"
              >
                <span>Read Full Story on {newsDetailArticle.source}</span>
                <span className="external-arrow">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer news-detail-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setNewsDetailArticle(null)}
          >
            Close
          </button>

          <button
            type="button"
            className={`btn ${
              savedItems.some(
                (item) =>
                  item.title === newsDetailArticle.title ||
                  (item.url && item.url === newsDetailArticle.url)
              )
                ? "btn-secondary"
                : "btn-outline"
            }`}
            onClick={() => saveNewsArticle(newsDetailArticle)}
          >
            <span aria-hidden="true">
              {savedItems.some(
                (item) =>
                  item.title === newsDetailArticle.title ||
                  (item.url && item.url === newsDetailArticle.url)
              )
                ? "★"
                : "☆"}
            </span>
            <span>
              {savedItems.some(
                (item) =>
                  item.title === newsDetailArticle.title ||
                  (item.url && item.url === newsDetailArticle.url)
              )
                ? "Saved to Account"
                : "Save Article"}
            </span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="btn-spinner" />
                <span>Running ML Model...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Analyze with VeriText</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

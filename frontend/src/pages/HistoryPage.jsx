import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import {
  useAppData,
  formatDateTime,
  deriveMeaningfulTitle
} from "../context/AppDataContext";

export default function HistoryPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { settings } = useSettings();
  const {
    historyItems,
    isHistoryLoading,
    hasLocalGuestHistory,
    importLocalHistory,
    isRecordSaved,
    savePredictionRecord,
    deleteHistoryRecordById,
    clearAllHistory,
    openArticleModal,
    openConfirmModal,
    setHeadline,
    setArticleText,
    setCurrentResult
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = historyItems.filter((item) => {
      if (filterClass !== "ALL" && item.prediction !== filterClass) {
        return false;
      }
      if (q) {
        const hay = `${item.title || ""} ${item.text || ""}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
      if (sortBy === "confidence-desc") {
        return (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return list;
  }, [historyItems, searchQuery, filterClass, sortBy]);

  const handleDeleteHistoryPrompt = () => {
    if (historyItems.length === 0) return;
    openConfirmModal(
      "Delete Prediction History",
      "Are you sure you want to permanently delete all prediction history records from your account?",
      () => clearAllHistory()
    );
  };

  const handleAnalyzeAgain = (item) => {
    setHeadline(item.title || "");
    setArticleText(item.text || "");
    setCurrentResult(item);
    navigate("/detector");
  };

  const handleImport = async () => {
    setIsImporting(true);
    await importLocalHistory();
    setIsImporting(false);
  };

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header section-header-row">
        <div>
          <div className="eyebrow-badge">PREDICTION LOG</div>
          <h1 className="section-title">Prediction History</h1>
          <p className="section-subtitle">
            Review, search, filter, and sort your previous fake-news analyses.
          </p>
        </div>
        <div className="section-header-actions">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            id="clearHistoryBtn"
            disabled={historyItems.length === 0}
            onClick={handleDeleteHistoryPrompt}
          >
            Delete History
          </button>
        </div>
      </section>

      {!isAuthenticated ? (
        <div
          className="card empty-state-card auth-required-card"
          id="historyAuthRequired"
          style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}
        >
          <div
            className="empty-state-icon"
            aria-hidden="true"
            style={{ fontSize: "3rem", marginBottom: "1rem" }}
          >
            🔐
          </div>
          <h2
            className="empty-state-title"
            style={{ fontSize: "1.35rem", fontWeight: 600, color: "var(--text-primary)" }}
          >
            Sign in to view your prediction history
          </h2>
          <p
            className="empty-state-desc"
            style={{
              maxWidth: "480px",
              margin: "0.5rem auto 1.5rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5
            }}
          >
            Your prediction history is saved to your account so you can access it
            later. Sign in or create an account to view and manage your past analyses.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openLoginModal({ reason: "history" })}
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/detector")}
            >
              Go to Detector
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Guest Data Import Banner (Prompt 44) */}
          {hasLocalGuestHistory && (
            <div className="card migration-banner-card">
              <div className="migration-banner-content">
                <span className="migration-banner-icon" aria-hidden="true">
                  📥
                </span>
                <div>
                  <h3 className="migration-banner-title">
                    We found saved analyses on this device
                  </h3>
                  <p className="migration-banner-desc">
                    Would you like to import your previous guest analyses into your
                    account database?
                  </p>
                </div>
              </div>
              <div className="migration-banner-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? "Importing..." : "Import to Account"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    localStorage.removeItem("veritext_history");
                    window.location.reload();
                  }}
                >
                  Not Now
                </button>
              </div>
            </div>
          )}

          {/* Search, Filter, and Sort Controls */}
          <div className="card controls-toolbar" aria-label="History Filters">
        <div className="search-box">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            id="historySearchInput"
            className="form-input search-input"
            placeholder="Search history by article title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search prediction history"
          />
        </div>

        <div className="filter-controls">
          <div
            className="filter-pill-group"
            role="group"
            aria-label="Filter by prediction class"
          >
            {["ALL", "REAL", "FAKE"].map((cls) => (
              <button
                key={cls}
                type="button"
                className={`filter-pill ${filterClass === cls ? "active" : ""}`}
                onClick={() => setFilterClass(cls)}
              >
                {cls}
              </button>
            ))}
          </div>

          <select
            id="historySortSelect"
            className="form-select sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort prediction history"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="confidence-desc">Sort: Highest Confidence</option>
          </select>
        </div>
      </div>

      {/* List / Grid of History Records */}
      {isHistoryLoading ? (
        <div className="card empty-state-card">
          <div className="btn-spinner" style={{ width: 28, height: 28 }} />
          <h3 className="empty-state-title" style={{ marginTop: "0.85rem" }}>
            Loading your prediction history...
          </h3>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card empty-state-card" id="historyEmptyState">
          <div className="empty-state-icon" aria-hidden="true">
            📂
          </div>
          <h3 className="empty-state-title">
            {historyItems.length === 0
              ? "No prediction history yet."
              : "No records match your filters."}
          </h3>
          <p className="empty-state-desc">
            {historyItems.length === 0
              ? "Analyze news articles in the Fake News Detector. Your classification records will be saved here automatically."
              : "Try adjusting your search query or prediction filter above."}
          </p>
          {historyItems.length === 0 && (
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/detector")}
              >
                Go to Fake News Detector
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="records-grid" id="historyList">
          {filteredItems.map((item) => {
            const isReal = item.prediction === "REAL";
            const displayTitle = deriveMeaningfulTitle(item.title, item.text);
            const previewText = item.text || item.title || "";
            const confFormatted = (Number(item.confidence) || 0).toFixed(2);
            const dateFormatted = formatDateTime(item.timestamp);
            const isSaved = isRecordSaved(item);

            return (
              <article key={item.id} className="card record-card">
                <div>
                  <div className="record-top">
                    <span
                      className={`record-badge ${
                        isReal ? "badge-real" : "badge-fake"
                      }`}
                    >
                      {isReal ? "🟢" : "🔴"} {item.prediction}
                    </span>
                    <span className="record-conf">
                      Confidence: {confFormatted}%
                    </span>
                  </div>

                  <h3 className="record-title" style={{ marginTop: "0.55rem" }}>
                    {displayTitle}
                  </h3>

                  <p className="record-snippet">{previewText}</p>

                  <div className="record-meta">
                    <span className="record-meta-pill">
                      Model: {item.model || "Logistic Regression"}
                    </span>
                    <span className="record-meta-pill">{dateFormatted}</span>
                  </div>
                </div>

                <div className="record-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openArticleModal(item)}
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAnalyzeAgain(item)}
                  >
                    ⚡ Re-Analyze
                  </button>

                  <button
                    type="button"
                    className={`btn btn-secondary btn-sm ${
                      isSaved ? "is-saved" : ""
                    }`}
                    onClick={() => savePredictionRecord(item)}
                  >
                    <span aria-hidden="true">{isSaved ? "★" : "☆"}</span>
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-fake"
                    onClick={() => deleteHistoryRecordById(item.id)}
                    title="Delete this record"
                  >
                    ✕
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import {
  useAppData,
  formatDateTime,
  deriveMeaningfulTitle
} from "../context/AppDataContext";

export default function SavedPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { settings } = useSettings();
  const {
    savedItems,
    isSavedLoading,
    hasLocalGuestSaved,
    importLocalSaved,
    removeSavedRecordById,
    clearAllSaved,
    openArticleModal,
    openConfirmModal,
    setHeadline,
    setArticleText,
    analyzeArticle
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = savedItems.filter((item) => {
      if (filterClass !== "ALL") {
        if (!item.prediction) return false;
        if (item.prediction !== filterClass) return false;
      }
      if (q) {
        const hay = `${item.title || ""} ${item.text || ""} ${
          item.source || ""
        }`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    list.sort((a, b) => {
      const timeA = new Date(a.savedAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.savedAt || b.timestamp || 0).getTime();
      if (sortBy === "oldest") return timeA - timeB;
      return timeB - timeA;
    });

    return list;
  }, [savedItems, searchQuery, filterClass, sortBy]);

  const handleAnalyzeAgain = (item) => {
    const title = item.title || "";
    const text = item.text || "";
    setHeadline(title);
    setArticleText(text);
    navigate("/detector");
    setTimeout(() => {
      analyzeArticle(title, text);
    }, 60);
  };

  const handleClearSavedPrompt = () => {
    if (savedItems.length === 0) return;
    openConfirmModal(
      "Clear Saved Articles",
      "Are you sure you want to remove all saved articles from your account?",
      () => clearAllSaved()
    );
  };

  const handleImport = async () => {
    setIsImporting(true);
    await importLocalSaved();
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
          <div className="eyebrow-badge">SAVED BOOKMARKS</div>
          <h1 className="section-title">Saved Articles</h1>
          <p className="section-subtitle">
            Bookmarked news articles, summaries, and classification verdicts.
          </p>
        </div>
        <div className="section-header-actions">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={savedItems.length === 0}
            onClick={handleClearSavedPrompt}
          >
            Clear Saved Articles
          </button>
        </div>
      </section>

      {!isAuthenticated ? (
        <div
          className="card empty-state-card auth-required-card"
          id="savedAuthRequired"
          style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}
        >
          <div
            className="empty-state-icon"
            aria-hidden="true"
            style={{ fontSize: "3rem", marginBottom: "1rem" }}
          >
            🔖
          </div>
          <h2
            className="empty-state-title"
            style={{ fontSize: "1.35rem", fontWeight: 600, color: "var(--text-primary)" }}
          >
            Sign in to view your saved articles
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
            Sign in to save articles and access your personal saved collection across
            all your devices.
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
              onClick={() => openLoginModal({ reason: "saved" })}
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/ai-news")}
            >
              Explore AI News
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Guest Data Import Banner (Prompt 44) */}
          {hasLocalGuestSaved && (
            <div className="card migration-banner-card">
              <div className="migration-banner-content">
                <span className="migration-banner-icon" aria-hidden="true">
                  📥
                </span>
                <div>
                  <h3 className="migration-banner-title">
                    We found saved articles on this device
                  </h3>
                  <p className="migration-banner-desc">
                    Would you like to import your previous guest bookmarks into your
                    account?
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
                    localStorage.removeItem("veritext_saved");
                    window.location.reload();
                  }}
                >
                  Not Now
                </button>
              </div>
            </div>
          )}

          {/* Search, Filter, and Sort Toolbar */}
          <div className="card controls-toolbar" aria-label="Saved Filters">
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
            id="savedSearchInput"
            className="form-input search-input"
            placeholder="Search saved articles by headline, text, or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search saved articles"
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
            id="savedSortSelect"
            className="form-select sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort saved articles"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* List / Grid of Saved Articles */}
      {isSavedLoading ? (
        <div className="card empty-state-card">
          <div className="btn-spinner" style={{ width: 28, height: 28 }} />
          <h3 className="empty-state-title" style={{ marginTop: "0.85rem" }}>
            Loading your saved articles...
          </h3>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card empty-state-card" id="savedEmptyState">
          <div className="empty-state-icon" aria-hidden="true">
            🔖
          </div>
          <h3 className="empty-state-title">
            {savedItems.length === 0
              ? "No saved articles yet."
              : "No saved articles match your search."}
          </h3>
          <p className="empty-state-desc">
            {savedItems.length === 0
              ? "Save interesting articles from the AI News Assistant to find them here later."
              : "Try changing your search keywords or filter options above."}
          </p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/ai-news")}
            >
              Explore AI News
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate("/detector")}
            >
              Go to Detector
            </button>
          </div>
        </div>
      ) : (
        <div className="records-grid" id="savedList">
          {filteredItems.map((item) => {
            const isReal = item.prediction === "REAL";
            const displayTitle = deriveMeaningfulTitle(item.title, item.text);
            const previewText = item.text || item.title || "";
            const confFormatted =
              item.confidence !== null && typeof item.confidence !== "undefined"
                ? Number(item.confidence).toFixed(1)
                : null;
            const savedDate = formatDateTime(item.savedAt || item.timestamp);

            return (
              <article key={item.id} className="card record-card saved-record-card">
                {/* Image if available */}
                {item.image && (
                  <div className="saved-card-media">
                    <img
                      src={item.image}
                      alt={displayTitle}
                      className="saved-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div>
                  <div className="record-top">
                    {item.prediction ? (
                      <span
                        className={`record-badge ${
                          isReal ? "badge-real" : "badge-fake"
                        }`}
                      >
                        {isReal ? "🟢" : "🔴"} {item.prediction}
                      </span>
                    ) : (
                      <span className="record-badge badge-neutral">
                        📰 Article
                      </span>
                    )}

                    {confFormatted && (
                      <span className="record-conf">
                        Confidence: {confFormatted}%
                      </span>
                    )}

                    <span className="saved-source-tag">
                      {item.source || "VeriText"}
                    </span>
                  </div>

                  <h3 className="record-title" style={{ marginTop: "0.55rem" }}>
                    {displayTitle}
                  </h3>

                  <p className="record-snippet">{previewText}</p>

                  <div className="record-meta">
                    <span className="record-meta-pill">Saved: {savedDate}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="record-link-pill"
                      >
                        Source Link ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="record-actions">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Open Article ↗
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openArticleModal(item)}
                    >
                      Open Details
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAnalyzeAgain(item)}
                  >
                    ⚡ Analyze Again
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-fake"
                    onClick={() => removeSavedRecordById(item.id)}
                    title="Remove this article from saved"
                  >
                    Remove
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

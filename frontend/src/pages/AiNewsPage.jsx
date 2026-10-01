import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import {
  useAppData,
  PREDICT_ENDPOINT,
  MAX_ARTICLE_CHARS,
  formatDateTime,
  deriveMeaningfulTitle
} from "../context/AppDataContext";
import NewsCard from "../components/NewsCard";

const SUGGESTED_QUESTIONS = [
  "What are the latest technology news?",
  "What happened in India today?",
  "Show me recent cricket news.",
  "What are today's major world events?",
  "Explain the latest AI developments.",
  "Find historical news about 2020."
];

const CATEGORIES = [
  "All",
  "India",
  "World",
  "Technology",
  "Sports",
  "Business",
  "Science",
  "Entertainment"
];

const SOURCES = [
  "All",
  "The Indian Express",
  "NDTV",
  "The Hindu",
  "The Times of India",
  "ESPNcricinfo"
];

function renderFormattedMarkdown(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return <p>No response content returned.</p>;

  const lines = text.split(/\r?\n/);
  const elements = [];
  let listItems = [];

  const flushList = (keyPrefix) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="chat-formatted-list">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const renderInline = (lineStr) => {
    const parts = lineStr.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return <code key={idx}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(idx);
      return;
    }

    const bulletMatch = line.match(/^[-*\u2022]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      const itemText = bulletMatch ? bulletMatch[1] : numberedMatch[1];
      listItems.push(<li key={`li-${idx}`}>{renderInline(itemText)}</li>);
    } else {
      flushList(idx);
      elements.push(<p key={`p-${idx}`}>{renderInline(line)}</p>);
    }
  });

  flushList("end");
  return elements;
}

export default function AiNewsPage() {
  const { settings, activeThemeColor } = useSettings();
  const {
    chatMessages,
    isChatLoading,
    chatError,
    setChatError,
    sendChatMessage,
    regenerateChatResponse,
    clearChatConversation,
    setHeadline,
    setArticleText,
    setCurrentResult,
    addPredictionToHistory,
    modelConfig,
    showToast,
    newsArticles,
    isNewsLoading,
    newsError,
    newsSourceFilter,
    setNewsSourceFilter,
    newsCategoryFilter,
    setNewsCategoryFilter,
    fetchNews
  } = useAppData();

  const [inputVal, setInputVal] = useState("");
  const [inlineVerdicts, setInlineVerdicts] = useState({});
  const [classifyingKey, setClassifyingKey] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "chat" | "reports" | "all"
  const viewportRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll chat viewport if autoScrollChat is enabled in settings
  useEffect(() => {
    if (settings.autoScrollChat && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading, settings.autoScrollChat]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim();
    if (!clean || isChatLoading) return;
    setInputVal("");
    sendChatMessage(clean);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (settings.enterToSend) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleCopyAnswer = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("✓ AI Answer copied to clipboard", "success", "ai");
    } catch (_e) {
      showToast("Unable to copy to clipboard", "error", "ai");
    }
  };

  // Direct VeriText ML analysis of assistant message
  const handleClassifyWithVeriText = async (msgId, promptText, answerText) => {
    setClassifyingKey(msgId);
    try {
      const response = await fetch(PREDICT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          title: promptText.slice(0, 200),
          text: answerText.slice(0, MAX_ARTICLE_CHARS)
        })
      });

      const payload = await response.json().catch(() => null);
      if (response.ok && payload && payload.prediction) {
        const resultRecord = {
          id: `pred-ai-${Date.now()}`,
          title: deriveMeaningfulTitle(promptText, answerText),
          text: answerText,
          prediction: payload.prediction,
          confidence: Number(payload.confidence),
          model: modelConfig.model || "Logistic Regression",
          featureExtraction: modelConfig.feature_extraction || "TF-IDF",
          timestamp: new Date().toISOString()
        };

        setInlineVerdicts((prev) => ({ ...prev, [msgId]: resultRecord }));
        setCurrentResult(resultRecord);
        setHeadline(promptText);
        setArticleText(answerText);
        if (settings.autoSavePredictions) {
          addPredictionToHistory(resultRecord);
        }
        showToast(
          `✓ Classified as ${payload.prediction} (${Number(payload.confidence).toFixed(1)}%)`,
          "success",
          "prediction"
        );
      } else {
        showToast("ML prediction failed for this text", "error", "prediction");
      }
    } catch (_err) {
      showToast("Prediction API connection failed", "error", "prediction");
    } finally {
      setClassifyingKey(null);
    }
  };

  // Filtered news articles
  const filteredArticles = newsArticles.filter((article) => {
    const matchesSource =
      !newsSourceFilter ||
      newsSourceFilter === "All" ||
      article.source.toLowerCase().includes(newsSourceFilter.toLowerCase());

    const matchesCategory =
      !newsCategoryFilter ||
      newsCategoryFilter === "All" ||
      article.category.toLowerCase().includes(newsCategoryFilter.toLowerCase()) ||
      article.title.toLowerCase().includes(newsCategoryFilter.toLowerCase());

    return matchesSource && matchesCategory;
  });

  return (
    <div className="ai-news-page-container">
      {/* Mobile Drawer Trigger */}
      <div className="ai-news-mobile-bar">
        <button
          type="button"
          className="btn btn-sm btn-outline mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle News Menu"
        >
          <span>☰</span>
          <span>News Menu</span>
        </button>

        <span className="mobile-active-source">
          Source: <strong>{newsSourceFilter || "All"}</strong>
        </span>
      </div>

      <div className="ai-news-layout">
        {/* ========================================================
            5.1 LEFT SIDEBAR (Width 260-280px, Sticky)
            ======================================================== */}
        <aside
          className={`ai-news-sidebar ${sidebarOpen ? "mobile-drawer-open" : ""}`}
          aria-label="News and Assistant Navigation"
        >
          <div className="sidebar-header">
            <h2 className="sidebar-main-title">NEWS &amp; AI ASSISTANT</h2>
            <p className="sidebar-sub-title">Navigation &amp; Filtering</p>
          </div>

          <div className="sidebar-nav-sections">
            {/* Quick Actions */}
            <div className="sidebar-group">
              <span className="sidebar-group-title">MAIN VIEWS</span>
              <button
                type="button"
                className={`sidebar-nav-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("all");
                  setSidebarOpen(false);
                }}
              >
                <span className="sidebar-icon">⚡</span>
                <span>All-in-One Dashboard</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("chat");
                  setSidebarOpen(false);
                }}
              >
                <span className="sidebar-icon">💬</span>
                <span>AI Assistant Only</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("reports");
                  setSidebarOpen(false);
                }}
              >
                <span className="sidebar-icon">📰</span>
                <span>Special News Reports</span>
              </button>
            </div>

            {/* News Sources Filter */}
            <div className="sidebar-group">
              <span className="sidebar-group-title">NEWS SOURCES</span>
              {SOURCES.map((source) => {
                const isActive = newsSourceFilter === source;
                return (
                  <button
                    key={source}
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setNewsSourceFilter(source);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="sidebar-dot" />
                    <span>{source}</span>
                  </button>
                );
              })}
            </div>

            {/* News Categories */}
            <div className="sidebar-group">
              <span className="sidebar-group-title">NEWS CATEGORIES</span>
              {CATEGORIES.map((cat) => {
                const isActive = newsCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setNewsCategoryFilter(cat);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="sidebar-icon">📌</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* My News */}
            <div className="sidebar-group">
              <span className="sidebar-group-title">MY NEWS</span>
              <Link to="/saved" className="sidebar-nav-link" onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-icon">🔖</span>
                <span>Saved Articles</span>
              </Link>
              <Link to="/history" className="sidebar-nav-link" onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-icon">📜</span>
                <span>Analysis History</span>
              </Link>
            </div>
          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className="btn btn-xs btn-outline w-100"
              onClick={() => {
                setNewsSourceFilter("All");
                setNewsCategoryFilter("All");
                fetchNews("", "", true);
              }}
            >
              ↻ Refresh Feeds
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ========================================================
            5.2 MAIN CONTENT (AI Chat + Special News Reports)
            ======================================================== */}
        <main className="ai-news-main-content">
          {/* Header */}
          <div className="page-header">
            <div className="page-badge">
              <span className="page-badge-icon">🌐</span>
              <span className="page-badge-text">GOOGLE SEARCH GROUNDED INTELLIGENCE</span>
            </div>
            <h1 className="page-title">AI NEWS ASSISTANT</h1>
            <p className="page-subtitle">
              Ask about current or historical news. Backed by live Google Search grounding
              and verifiable publisher sources.
            </p>
          </div>

          {/* AI CHAT AREA (Rendered when activeTab is 'all' or 'chat') */}
          {(activeTab === "all" || activeTab === "chat") && (
            <section className="chat-window-card mb-5" aria-labelledby="chat-area-heading">
              <div className="chat-card-topbar">
                <div className="chat-topbar-info">
                  <span className="chat-status-pulse" />
                  <div>
                    <h3 id="chat-area-heading" className="chat-topbar-title">
                      Live News Intelligence Dialogue
                    </h3>
                    <span className="chat-topbar-desc">
                      Current events, temporal archives (2018–2026), and citation verification
                    </span>
                  </div>
                </div>

                <div className="chat-card-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={clearChatConversation}
                    disabled={chatMessages.length === 0}
                    title="Clear current dialogue"
                  >
                    🗑️ Clear Chat
                  </button>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="chat-suggested-prompts-bar">
                <span className="prompts-label">Suggested:</span>
                <div className="prompts-scroll">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="prompt-chip"
                      disabled={isChatLoading}
                      onClick={() => sendChatMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Viewport */}
              <div
                className="chat-viewport"
                ref={viewportRef}
                tabIndex={0}
                aria-label="Chat messages transcript"
              >
                {chatMessages.length === 0 && (
                  <div className="chat-empty-state">
                    <div className="empty-state-icon">🤖</div>
                    <h3>Ask Me Anything About Current or Historical News</h3>
                    <p>
                      Query today's breaking developments, Indian politics, global world events,
                      sports tournaments, or historical archives from specific years (e.g. 2018 FIFA World Cup,
                      2020 science events, 2024 elections).
                    </p>
                  </div>
                )}

                {chatMessages.map((msg) => {
                  const isUser = msg.role === "user";
                  const summaryVerdict = inlineVerdicts[msg.id];

                  if (isUser) {
                    return (
                      <div key={msg.id} className="chat-row user-row">
                        <div className="chat-bubble user-bubble">
                          <p className="bubble-text">{msg.content}</p>
                          <span className="bubble-time">{formatDateTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  // Assistant Message
                  return (
                    <div key={msg.id} className="chat-row ai-row">
                      <div className="chat-avatar-ai" aria-hidden="true">
                        AI
                      </div>
                      <div className="chat-bubble ai-bubble">
                        <div className="ai-bubble-meta">
                          <span className="ai-model-tag">
                            {msg.searchUsed ? "🔍 Google Search Grounded" : "VeriText Intelligence"}
                          </span>
                          <span className="bubble-time">{formatDateTime(msg.timestamp)}</span>
                        </div>

                        <div className="bubble-formatted-content">
                          {renderFormattedMarkdown(msg.content)}
                        </div>

                        {/* Grounded Sources & Citations */}
                        {settings.showSources !== false && msg.sources && msg.sources.length > 0 && (
                          <div className="chat-sources-block">
                            <span className="sources-block-heading">
                              VERIFIED SOURCES &amp; CITATIONS:
                            </span>
                            <div className="sources-chips-grid">
                              {msg.sources.map((src, sIdx) => {
                                const title = src.title || src.name || `Source ${sIdx + 1}`;
                                const url = src.url || src.uri;
                                return (
                                  <a
                                    key={sIdx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="source-chip-link"
                                    title={url}
                                  >
                                    <span>🌐</span>
                                    <span className="source-title-text">{title}</span>
                                    <span className="source-link-icon">↗</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Assistant Actions */}
                        <div className="chat-bubble-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleCopyAnswer(msg.content)}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            disabled={isChatLoading}
                            onClick={() => regenerateChatResponse(msg.id)}
                          >
                            🔄 Regenerate
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            disabled={classifyingKey === msg.id}
                            onClick={() =>
                              handleClassifyWithVeriText(
                                msg.id,
                                msg.prompt || "AI News Summary",
                                msg.content
                              )
                            }
                          >
                            {classifyingKey === msg.id ? "Analyzing..." : "⚡ Analyze with VeriText"}
                          </button>
                        </div>

                        {/* Inline ML Verdict */}
                        {summaryVerdict && (
                          <div
                            className={`veritext-inline-result ${
                              summaryVerdict.prediction === "REAL" ? "is-real" : "is-fake"
                            }`}
                          >
                            <div className="veritext-inline-header">
                              <span className="verdict-tag">
                                {summaryVerdict.prediction === "REAL" ? "✅ REAL" : "⚠️ FAKE"}
                              </span>
                              <span className="verdict-conf">
                                {summaryVerdict.confidence.toFixed(2)}% Confidence
                              </span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => navigate("/detector")}
                              >
                                Open in Detector →
                              </button>
                            </div>
                            <p className="veritext-inline-note">
                              VeriText classification is an ML-based prediction and does not independently establish factual truth.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading State */}
                {isChatLoading && (
                  <div className="chat-row ai-row">
                    <div className="chat-avatar-ai">AI</div>
                    <div className="chat-loading-bubble">
                      <span className="spinner chat-spinner" />
                      <span>Searching accredited web sources and synthesizing answer...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Error */}
              {chatError && (
                <div className="chat-error-banner" role="alert">
                  ⚠️ {chatError}
                </div>
              )}

              {/* Input Form with [ Search ] and [ Send ] */}
              <form className="chat-input-form" onSubmit={handleSend}>
                <div className="chat-input-row">
                  <input
                    type="text"
                    className="form-input chat-text-input"
                    placeholder="Ask me anything about current or historical news..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isChatLoading}
                    aria-label="Ask news question"
                  />

                  <div className="chat-button-group">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleSend}
                      disabled={isChatLoading || !inputVal.trim()}
                      title="Search web news"
                    >
                      🔍 Search
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isChatLoading || !inputVal.trim()}
                    >
                      <span>Send</span>
                      <span>➤</span>
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {/* ========================================================
              6. SPECIAL NEWS REPORTS (Live Feeds & Source Filter)
              ======================================================== */}
          {(activeTab === "all" || activeTab === "reports") && (
            <section className="special-reports-section" aria-labelledby="special-reports-heading">
              <div className="special-reports-header">
                <div>
                  <span className="section-pill">LIVE PUBLISHER FEEDS</span>
                  <h2 id="special-reports-heading" className="section-title">
                    SPECIAL NEWS REPORTS
                  </h2>
                  <p className="section-subtitle">
                    Live articles aggregated directly from accredited news organizations.
                    Filter by publisher and run instant VeriText ML analysis on any story.
                  </p>
                </div>

                <div className="special-reports-meta">
                  <span className="article-count-badge">
                    Showing {filteredArticles.length} Stories
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => fetchNews(newsSourceFilter, newsCategoryFilter, true)}
                    disabled={isNewsLoading}
                  >
                    {isNewsLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>
              </div>

              {/* Source Tabs Filter */}
              <div className="source-tabs-bar" role="tablist" aria-label="Filter News Sources">
                {SOURCES.map((source) => {
                  const isSelected = newsSourceFilter === source;
                  return (
                    <button
                      key={source}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`source-tab-btn ${isSelected ? "active" : ""}`}
                      onClick={() => setNewsSourceFilter(source)}
                    >
                      {source === "All" ? "All Sources" : source}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Bar */}
              <div className="category-filter-bar">
                <span className="cat-filter-label">Topic:</span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-chip-btn ${newsCategoryFilter === cat ? "active" : ""}`}
                    onClick={() => setNewsCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* News Articles Grid */}
              {isNewsLoading && filteredArticles.length === 0 ? (
                <div className="news-loading-skeletons">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="news-skeleton-card">
                      <div className="skeleton-media" />
                      <div className="skeleton-line full" />
                      <div className="skeleton-line half" />
                    </div>
                  ))}
                </div>
              ) : newsError && filteredArticles.length === 0 ? (
                <div className="news-error-banner">
                  <p>⚠️ {newsError}</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => fetchNews(newsSourceFilter, newsCategoryFilter, true)}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="empty-state-card">
                  <p>No stories matched your current source and category filters.</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline mt-2"
                    onClick={() => {
                      setNewsSourceFilter("All");
                      setNewsCategoryFilter("All");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="special-news-grid">
                  {filteredArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

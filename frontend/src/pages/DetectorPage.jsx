import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import {
  useAppData,
  FAKE_SAMPLES,
  REAL_SAMPLES,
  ALL_SAMPLES,
  MAX_ARTICLE_CHARS,
  formatDateTime,
  buildAsciiConfidenceBar
} from "../context/AppDataContext";

const ANALYSIS_STEPS = [
  { num: 1, label: "Article received" },
  { num: 2, label: "Text preprocessing" },
  { num: 3, label: "TF-IDF feature extraction" },
  { num: 4, label: "Running Logistic Regression" },
  { num: 5, label: "Generating prediction" }
];

export default function DetectorPage() {
  const { settings } = useSettings();
  const {
    modelConfig,
    headline,
    setHeadline,
    articleText,
    setArticleText,
    currentResult,
    setCurrentResult,
    isAnalyzing,
    analysisStep,
    analysisError,
    setAnalysisError,
    analyzeArticle,
    isRecordSaved,
    savePredictionRecord,
    copyPredictionSummary,
    exportPredictionReport,
    showToast
  } = useAppData();

  const [fakeIndex, setFakeIndex] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [allIndex, setAllIndex] = useState(0);

  const charCount = articleText.length;
  const trimmedText = articleText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;

  let charCounterClass = "char-counter";
  if (charCount > MAX_ARTICLE_CHARS) {
    charCounterClass += " limit-exceeded";
  } else if (charCount > MAX_ARTICLE_CHARS * 0.88) {
    charCounterClass += " limit-near";
  }

  const handleLoadSample = (sample) => {
    setAnalysisError(null);
    setHeadline(sample.title);
    setArticleText(sample.text);
  };

  const handlePasteClipboard = async () => {
    setAnalysisError(null);
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      showToast(
        "\u26A0 Clipboard access is unavailable. Please press Ctrl+V.",
        "warning"
      );
      return;
    }
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        showToast("\u26A0 Clipboard is currently empty", "warning");
        return;
      }
      setArticleText(clipText.trim().slice(0, MAX_ARTICLE_CHARS));
      showToast("\u2713 Pasted article text from clipboard", "success");
    } catch (_err) {
      showToast(
        "\u26A0 Clipboard permission denied. Please paste using Ctrl+V.",
        "warning"
      );
    }
  };

  const handleClearForm = () => {
    setHeadline("");
    setArticleText("");
    setAnalysisError(null);
    setCurrentResult(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    analyzeArticle();
  };

  const isRealResult =
    currentResult && String(currentResult.prediction).toUpperCase() === "REAL";
  const numericConf = currentResult ? Number(currentResult.confidence) || 0 : 0;
  const formattedConf = numericConf.toFixed(2);
  const savedAlready = currentResult ? isRecordSaved(currentResult) : false;

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      {/* Hero Header */}
      <section className="hero-header" id="detector-section">
        <div className="eyebrow-badge">
          NATURAL LANGUAGE PROCESSING &bull; MACHINE LEARNING
        </div>
        <h1 className="hero-title">FAKE NEWS DETECTOR</h1>
        <p className="hero-subtitle">
          AI-powered News Classification using TF-IDF Vectorization &amp;
          Logistic Regression
        </p>
      </section>

      {/* Main Analyzer Workspace Grid */}
      <section className="workspace-grid" aria-label="News Detector Workspace">
        {/* Left Column: Input Form Card */}
        <div className="card analyzer-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Article Classification Input</h2>
              <p className="card-description">
                Enter a news headline and full article text below to evaluate
                linguistic patterns.
              </p>
            </div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePasteClipboard}
                disabled={isAnalyzing}
                title="Paste article text from your clipboard"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="2" width="6" height="4" rx="1" />
                  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                </svg>
                <span>Paste from Clipboard</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearForm}
                disabled={isAnalyzing}
                title="Clear article title and text"
              >
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Try a Sample Bar */}
          <div className="sample-bar" aria-label="Try a Sample Article">
            <span className="sample-bar-label">Try a Sample:</span>
            <div className="sample-bar-buttons">
              <button
                type="button"
                className="btn btn-sample btn-sample-fake btn-sm"
                disabled={isAnalyzing}
                onClick={() => {
                  handleLoadSample(FAKE_SAMPLES[fakeIndex]);
                  setFakeIndex((fakeIndex + 1) % FAKE_SAMPLES.length);
                }}
              >
                <span
                  className="sample-dot sample-dot-fake"
                  aria-hidden="true"
                />
                Fake News Example
              </button>
              <button
                type="button"
                className="btn btn-sample btn-sample-real btn-sm"
                disabled={isAnalyzing}
                onClick={() => {
                  handleLoadSample(REAL_SAMPLES[realIndex]);
                  setRealIndex((realIndex + 1) % REAL_SAMPLES.length);
                }}
              >
                <span
                  className="sample-dot sample-dot-real"
                  aria-hidden="true"
                />
                Real News Example
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={isAnalyzing}
                onClick={() => {
                  handleLoadSample(ALL_SAMPLES[allIndex]);
                  setAllIndex((allIndex + 1) % ALL_SAMPLES.length);
                }}
              >
                <span>
                  Cycle Samples ({allIndex + 1}/{ALL_SAMPLES.length})
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="headlineInput" className="form-label">
                Article Title
              </label>
              <input
                type="text"
                id="headlineInput"
                className="form-input"
                placeholder="Enter article title"
                value={headline}
                onChange={(e) => {
                  setHeadline(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                autoComplete="off"
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="articleInput" className="form-label">
                  Article Content
                </label>
                <div className={charCounterClass} id="charCounter">
                  {charCount.toLocaleString()} /{" "}
                  {MAX_ARTICLE_CHARS.toLocaleString()} characters &bull;{" "}
                  {wordCount.toLocaleString()} word{wordCount === 1 ? "" : "s"}
                </div>
              </div>
              <textarea
                id="articleInput"
                className="form-textarea"
                rows={9}
                placeholder="Enter or paste news article content here..."
                value={articleText}
                onChange={(e) => {
                  setArticleText(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
              />
            </div>

            {/* Error Banner */}
            {analysisError && (
              <div className="error-banner" id="errorBanner" role="alert">
                <div className="error-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="error-body">
                  <div className="error-text">{analysisError.message}</div>
                  {analysisError.canRetry && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => analyzeArticle()}
                    >
                      Retry Connection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step-by-Step Analysis Loading Experience */}
            {analysisStep > 0 && (
              <div
                className="analysis-progress-box"
                id="analysisProgressBox"
                aria-live="polite"
              >
                <div className="analysis-progress-header">
                  <span className="btn-spinner" aria-hidden="true" />
                  <span className="analysis-progress-title">
                    {analysisStep < 5
                      ? "Analyzing article..."
                      : "Prediction complete"}
                  </span>
                </div>
                <ul className="analysis-steps-list">
                  {ANALYSIS_STEPS.map((st) => {
                    const isDone = analysisStep > st.num || analysisStep === 5;
                    const isActive =
                      analysisStep === st.num && analysisStep < 5;
                    return (
                      <li
                        key={st.num}
                        className={`analysis-step-item ${
                          isDone ? "step-done" : isActive ? "step-active" : ""
                        }`}
                      >
                        <span className="step-indicator">
                          {isDone ? "\u2713" : isActive ? "\u23F3" : "\u25CB"}
                        </span>
                        <span className="step-text">{st.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="form-actions form-actions-row">
              <button
                type="submit"
                className="btn btn-primary btn-analyze"
                id="analyzeBtn"
                disabled={isAnalyzing}
              >
                {isAnalyzing && (
                  <span className="btn-spinner" aria-hidden="true" />
                )}
                <span>
                  {isAnalyzing ? "Analyzing article..." : "Analyze News"}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-clear-main"
                onClick={handleClearForm}
                disabled={isAnalyzing}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Result & Model Information */}
        <div className="result-column">
          <div className="card result-card" id="resultCard">
            <div className="card-header">
              <h2 className="card-title">Prediction Result</h2>
              <span className="result-timestamp" id="resultTimestamp">
                {currentResult
                  ? formatDateTime(currentResult.timestamp)
                  : "Awaiting input"}
              </span>
            </div>

            {!currentResult ? (
              <div className="result-placeholder" id="resultPlaceholder">
                <div className="placeholder-icon" aria-hidden="true">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="placeholder-title">No Article Analyzed Yet</p>
                <p className="placeholder-desc">
                  Enter a headline and article content on the left, or choose a{" "}
                  <strong>Sample</strong>, then press{" "}
                  <strong>Analyze News</strong> to run the ML classifier.
                </p>
              </div>
            ) : (
              <div
                className="result-content"
                id="resultContent"
                aria-live="polite"
              >
                <div
                  className={`prediction-panel ${
                    isRealResult ? "is-real" : "is-fake"
                  }`}
                  id="predictionPanel"
                >
                  <span className="metric-caption">Classification Verdict</span>
                  <div className="prediction-headline-row">
                    <span
                      className="prediction-status-indicator"
                      aria-hidden="true"
                    >
                      {isRealResult ? "\uD83D\uDFE2" : "\uD83D\uDD34"}
                    </span>
                    <div className="prediction-badge" id="predictionValue">
                      {currentResult.prediction}
                    </div>
                  </div>
                  <span className="prediction-sublabel">
                    {isRealResult ? "LIKELY REAL" : "LIKELY FAKE"}
                  </span>
                </div>

                {/* Confidence Percentage & Visualization (Controlled by settings.showConfidence) */}
                {settings.showConfidence ? (
                  <div className="confidence-panel">
                    <div className="confidence-header">
                      <div>
                        <span className="metric-caption">Confidence</span>
                        <span className="confidence-value" id="confidenceValue">
                          {formattedConf}%
                        </span>
                      </div>
                      <div className="confidence-ascii" aria-hidden="true">
                        {buildAsciiConfidenceBar(numericConf)}
                      </div>
                    </div>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={numericConf}
                    >
                      <div
                        className={`progress-fill ${
                          isRealResult ? "fill-real" : "fill-fake"
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, numericConf))}%`
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="setting-hidden-notice">
                    Confidence score display is currently turned{" "}
                    <strong>OFF</strong> in Settings.
                  </div>
                )}

                {/* Result Action Buttons */}
                <div className="result-actions-bar">
                  <button
                    type="button"
                    className={`btn btn-secondary btn-sm result-action-btn ${
                      savedAlready ? "is-saved" : ""
                    }`}
                    onClick={() => savePredictionRecord(currentResult)}
                    title={
                      savedAlready
                        ? "Saved to your account"
                        : "Save this analysis to your account"
                    }
                  >
                    <span aria-hidden="true">{savedAlready ? "✓" : "🔖"}</span>
                    <span>{savedAlready ? "Saved" : "Save Analysis"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm result-action-btn"
                    onClick={() => copyPredictionSummary(currentResult)}
                  >
                    <span aria-hidden="true">📋</span>
                    <span>Copy Result</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm result-action-btn"
                    onClick={() => exportPredictionReport(currentResult)}
                  >
                    <span aria-hidden="true">📄</span>
                    <span>Export Result</span>
                  </button>
                </div>

                <div className="disclaimer-box">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="disclaimer-icon"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p>
                    Prediction is generated by a machine-learning model and
                    should not be treated as definitive fact verification.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Model Information Card on Detector Page (Controlled by settings.showModelInfo) */}
          {settings.showModelInfo && (
            <div className="card how-it-works-card" id="detectorModelInfoCard">
              <div className="card-header" style={{ marginBottom: "0.75rem" }}>
                <h3 className="card-subtitle" style={{ marginBottom: 0 }}>
                  Model Information
                </h3>
                <span className="record-meta-pill">
                  Auto-Save History: {settings.autoSavePredictions ? "ON" : "OFF"}
                </span>
              </div>
              <div
                className="specs-grid detector-specs-grid"
                aria-label="Detector Model Specifications"
              >
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Model</span>
                  <span className="spec-value">
                    {modelConfig.model || "Logistic Regression"}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Feature</span>
                  <span className="spec-value">
                    {modelConfig.feature_extraction || "TF-IDF"}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">N-Grams</span>
                  <span className="spec-value">
                    {modelConfig.ngrams || "Unigram + Bigram"}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Max Features</span>
                  <span className="spec-value">
                    {Number(modelConfig.max_features || 30000).toLocaleString()}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Training Split</span>
                  <span className="spec-value">
                    {modelConfig.training_split || "80%"}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Testing Split</span>
                  <span className="spec-value">
                    {modelConfig.testing_split || "20%"}
                  </span>
                </div>
                <div className="spec-card detector-spec-item">
                  <span className="spec-label">Classes</span>
                  <span className="spec-value">FAKE / REAL</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

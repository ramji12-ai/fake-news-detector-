import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useAppData } from "../context/AppDataContext";

export default function ModelPage() {
  const { settings } = useSettings();
  const { modelConfig } = useAppData();

  const metrics = modelConfig.evaluation_metrics || {
    accuracy: 99.02,
    precision: 98.51,
    recall: 99.69,
    f1_score: 99.1,
    total_samples: 39100,
    train_samples: 31280,
    test_samples: 7820
  };

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header">
        <div className="eyebrow-badge">SUPERVISED MACHINE LEARNING</div>
        <h1 className="section-title">MODEL INFORMATION</h1>
        <p className="section-subtitle">
          Technical specifications, hyperparameter configuration, and hold-out
          test set evaluation metrics of the trained classifier.
        </p>
      </section>

      {/* Core Model Explanation Banner */}
      <div className="card model-explanation-card">
        <h2 className="card-title">How the Classification Model Works</h2>
        <p className="model-explanation-text">
          &ldquo;The model learns patterns from labeled news articles and
          predicts whether new input is more similar to the learned{" "}
          <strong>FAKE</strong> or <strong>REAL</strong> class.&rdquo;
        </p>
        <div className="disclaimer-box" style={{ marginTop: "1rem" }}>
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
            <strong>Important Academic Note:</strong> This classifier evaluates
            statistical and linguistic patterns in text. It does not perform
            external fact verification or prove whether an article is factually
            true.
          </p>
        </div>
      </div>

      {/* Conditional Rendering based on settings.showModelInfo */}
      {settings.showModelInfo ? (
        <>
          {/* 7 Model Specification Cards */}
          <div className="specs-grid model-page-specs-grid" id="modelSpecsGrid">
            <div className="card spec-card">
              <span className="spec-label">Machine Learning Model</span>
              <span className="spec-value">
                {modelConfig.model || "Logistic Regression"}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">Feature Extraction</span>
              <span className="spec-value">
                {modelConfig.feature_extraction || "TF-IDF"}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">N-Grams</span>
              <span className="spec-value">
                {modelConfig.ngrams || "Unigram + Bigram"}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">Maximum Features</span>
              <span className="spec-value">
                {Number(modelConfig.max_features || 30000).toLocaleString()}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">Training Split</span>
              <span className="spec-value">
                {modelConfig.training_split || "80%"}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">Testing Split</span>
              <span className="spec-value">
                {modelConfig.testing_split || "20%"}
              </span>
            </div>
            <div className="card spec-card">
              <span className="spec-label">Classes</span>
              <span className="spec-value">FAKE / REAL</span>
            </div>
          </div>

          {/* Evaluation Metrics from model_metrics.json */}
          <div className="card metrics-banner" id="realMetricsBanner">
            <div className="metrics-banner-header">
              <span className="metrics-badge">
                Evaluation Metrics (model_metrics.json)
              </span>
              <span className="metrics-sub">
                {metrics.test_samples && metrics.total_samples
                  ? `Evaluated on ${Number(
                      metrics.test_samples
                    ).toLocaleString()} hold-out test articles (${Number(
                      metrics.total_samples
                    ).toLocaleString()} total cleaned dataset)`
                  : "Evaluated on 20% stratified hold-out test split"}
              </span>
            </div>

            <div className="metrics-row">
              <div className="metric-item">
                <span className="metric-item-label">Accuracy</span>
                <span className="metric-item-val">{metrics.accuracy}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-item-label">Precision</span>
                <span className="metric-item-val">{metrics.precision}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-item-label">Recall</span>
                <span className="metric-item-val">{metrics.recall}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-item-label">F1 Score</span>
                <span className="metric-item-val">{metrics.f1_score}%</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card setting-hidden-notice-card" id="modelInfoHiddenNotice">
          <div className="setting-hidden-notice-body">
            <span className="notice-icon" aria-hidden="true">ℹ️</span>
            <div>
              <h3 className="notice-title">Model Specifications &amp; Evaluation Metrics Hidden</h3>
              <p className="notice-desc">
                Model information and hold-out evaluation metrics are currently hidden because{" "}
                <strong>&ldquo;Show Model Information&rdquo;</strong> is turned <strong>OFF</strong> in Settings.
              </p>
            </div>
          </div>
          <Link to="/settings" className="btn btn-sm btn-outline mt-3">
            Open Settings to Enable →
          </Link>
        </div>
      )}
    </div>
  );
}

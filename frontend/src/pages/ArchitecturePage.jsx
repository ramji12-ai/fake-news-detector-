import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";

const PIPELINE_STAGES = [
  {
    id: 1,
    step: "STAGE 01",
    name: "NEWS ARTICLE",
    shortDesc: "Headline title + full article body input",
    detail:
      "The user enters a news headline (title) and article content (body). The backend merges them via combine_title_and_text(title, text) into a single unified string so both headline framing and body context are analyzed together."
  },
  {
    id: 2,
    step: "STAGE 02",
    name: "TEXT PREPROCESSING",
    shortDesc: "Shared pipeline across training & API inference",
    detail:
      "Both train_model.py and the live POST /predict endpoint import the exact same preprocessing function from backend/model_utils.py, eliminating training-serving skew."
  },
  {
    id: 3,
    step: "STAGE 03",
    name: "TEXT CLEANING",
    shortDesc: "Lowercase, strip URLs/HTML/symbols & normalize spaces",
    detail:
      "Applies 6 deterministic regex operations: lowercase conversion, URL removal (http/https/www), HTML tag stripping, non-alphabetic filtering ([^a-z\\s]), whitespace normalization, and boundary stripping."
  },
  {
    id: 4,
    step: "STAGE 04",
    name: "TF-IDF VECTORIZATION",
    shortDesc: "30,000 Unigram + Bigram numerical features",
    detail:
      "Transforms cleaned text into a 30,000-dimensional sparse numerical vector using TfidfVectorizer(max_features=30000, ngram_range=(1,2), min_df=2, sublinear_tf=True, stop_words='english')."
  },
  {
    id: 5,
    step: "STAGE 05",
    name: "LOGISTIC REGRESSION",
    shortDesc: "Binary linear classifier (Class 0 = FAKE, Class 1 = REAL)",
    detail:
      "Computes the linear decision score z = w·x + b across all active unigrams and bigrams and maps it through the logistic sigmoid function σ(z) = 1 / (1 + e^-z)."
  },
  {
    id: 6,
    step: "STAGE 06",
    name: "PREDICTION",
    shortDesc: "Argmax class selection from probability distribution",
    detail:
      "Compares the predicted probability of Class 0 (FAKE) and Class 1 (REAL) and selects the class with probability ≥ 50%."
  },
  {
    id: 7,
    step: "STAGE 07",
    name: "FAKE / REAL",
    shortDesc: "Final binary classification label",
    detail:
      "Maps class label 0 → 'FAKE' and class label 1 → 'REAL' for display in the Detector badge."
  },
  {
    id: 8,
    step: "STAGE 08",
    name: "CONFIDENCE",
    shortDesc: "Calibrated probability percentage via predict_proba()",
    detail:
      "Extracts the winning class probability from model.predict_proba(vector)[0], multiplies by 100, and rounds to 2 decimal places."
  }
];

export default function ArchitecturePage() {
  const { settings } = useSettings();
  const [selectedStageId, setSelectedStageId] = useState(1);

  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header">
        <div className="eyebrow-badge">END-TO-END NLP &amp; ML PIPELINE</div>
        <h1 className="section-title">NLP &amp; ML Architecture</h1>
        <p className="section-subtitle">
          Complete visual walkthrough of how raw news text is cleaned,
          vectorized into TF-IDF features, and classified by Logistic
          Regression.
        </p>
      </section>

      {/* Visual Vertical & Interactive 8-Stage Pipeline Flow */}
      <div className="card architecture-flow-card">
        <h2 className="card-title" style={{ marginBottom: "0.35rem" }}>
          Complete 8-Stage Classification Pipeline
        </h2>
        <p className="card-description" style={{ marginBottom: "1.25rem" }}>
          Click any stage in the flow diagram below to inspect its technical
          role in the system.
        </p>

        <div className="arch-pipeline-layout">
          {/* Left: Vertical Flow Diagram */}
          <div
            className="arch-vertical-flow"
            role="tablist"
            aria-label="8-Stage NLP and ML Pipeline"
          >
            {PIPELINE_STAGES.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;
              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`arch-flow-node ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedStageId(stage.id)}
                  >
                    <span className="arch-node-badge">{stage.id}</span>
                    <div className="arch-node-content">
                      <span className="arch-node-title">{stage.name}</span>
                      <span className="arch-node-sub">{stage.shortDesc}</span>
                    </div>
                  </button>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="arch-flow-arrow" aria-hidden="true">
                      &darr;
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right: Stage Inspector & Deep-Dive Cards */}
          <div className="arch-details-column">
            <div className="pipeline-inspector arch-stage-inspector">
              <div className="inspector-badge">{activeStage.step}</div>
              <h3 className="inspector-title">{activeStage.name}</h3>
              <p className="inspector-desc">{activeStage.detail}</p>
            </div>

            {/* Detailed Stage Breakdown Cards */}
            <div className="concepts-grid arch-concepts-grid">
              {/* 1. TEXT CLEANING */}
              <article className="card concept-card">
                <div className="concept-header">
                  <span className="concept-tag">STAGE 03 &bull; NLP</span>
                  <h3 className="concept-title">TEXT CLEANING</h3>
                </div>
                <p className="concept-body">
                  Standardizes raw news text inside{" "}
                  <code>backend/model_utils.py</code> before feature extraction:
                </p>
                <ul className="arch-bullet-list">
                  <li>
                    <strong>Lowercase conversion:</strong> Normalizes casing (
                    <code>&quot;Breaking&quot; &rarr; &quot;breaking&quot;</code>
                    )
                  </li>
                  <li>
                    <strong>URL removal:</strong> Strips{" "}
                    <code>http://</code>, <code>https://</code>, and{" "}
                    <code>www.</code> links
                  </li>
                  <li>
                    <strong>HTML removal:</strong> Strips embedded HTML tags (
                    <code>&lt;...&gt;</code>)
                  </li>
                  <li>
                    <strong>Non-alphabetic character removal:</strong> Removes
                    punctuation, digits, and special symbols (
                    <code>[^a-z\s]</code>)
                  </li>
                  <li>
                    <strong>Whitespace normalization:</strong> Collapses extra
                    spaces and strips leading/trailing whitespace
                  </li>
                </ul>
              </article>

              {/* 2. TF-IDF */}
              <article className="card concept-card">
                <div className="concept-header">
                  <span className="concept-tag">
                    STAGE 04 &bull; FEATURE EXTRACTION
                  </span>
                  <h3 className="concept-title">TF-IDF VECTORIZATION</h3>
                </div>
                <p className="concept-body">
                  Converts cleaned text into numerical feature vectors using
                  Scikit-Learn&apos;s <code>TfidfVectorizer</code>:
                </p>
                <ul className="arch-bullet-list">
                  <li>
                    <strong>Converts text into numerical features</strong> by
                    weighing term frequency against inverse document frequency
                  </li>
                  <li>
                    <strong>Uses unigram + bigram features</strong> (
                    <code>ngram_range=(1, 2)</code>) to capture both single
                    words and two-word phrases
                  </li>
                  <li>
                    <strong>Maximum 30,000 features</strong> (
                    <code>max_features=30000</code>, <code>min_df=2</code>,{" "}
                    <code>sublinear_tf=True</code>)
                  </li>
                </ul>
              </article>

              {/* 3. LOGISTIC REGRESSION */}
              <article className="card concept-card">
                <div className="concept-header">
                  <span className="concept-tag">
                    STAGE 05 &bull; CLASSIFIER
                  </span>
                  <h3 className="concept-title">LOGISTIC REGRESSION</h3>
                </div>
                <p className="concept-body">
                  Trained on the 80% stratified training split using{" "}
                  <code>LogisticRegression(max_iter=2000)</code>:
                </p>
                <ul className="arch-bullet-list">
                  <li>
                    <strong>Binary classification</strong> over the 30,000
                    TF-IDF features
                  </li>
                  <li>
                    <strong>Class 0 = FAKE</strong> (trained on{" "}
                    <code>dataset/Fake.csv</code>)
                  </li>
                  <li>
                    <strong>Class 1 = REAL</strong> (trained on{" "}
                    <code>dataset/True.csv</code>)
                  </li>
                </ul>
              </article>

              {/* 4. HOW CONFIDENCE IS CALCULATED */}
              <article className="card concept-card arch-confidence-card">
                <div className="concept-header">
                  <span className="concept-tag">
                    STAGE 08 &bull; PROBABILITY CALIBRATION
                  </span>
                  <h3 className="concept-title">
                    HOW CONFIDENCE IS CALCULATED
                  </h3>
                </div>
                <p className="concept-body">
                  During inference, <code>model.predict_proba()</code> returns
                  calibrated probabilities for both classes that sum to{" "}
                  <code>100%</code>:
                </p>

                <div className="proba-example-box">
                  <div className="proba-row">
                    <span>FAKE (Class 0):</span>
                    <strong className="text-fake">25.49%</strong>
                  </div>
                  <div className="proba-row">
                    <span>REAL (Class 1):</span>
                    <strong className="text-real">74.51%</strong>
                  </div>
                  <div className="proba-divider" />
                  <div className="proba-row">
                    <span>Predicted class:</span>
                    <strong className="text-real">REAL</strong>
                  </div>
                  <div className="proba-row">
                    <span>Confidence:</span>
                    <strong>74.51%</strong>
                  </div>
                </div>

                <p
                  className="concept-body"
                  style={{ marginTop: "0.75rem", fontSize: "0.82rem" }}
                >
                  <strong>Important:</strong> This percentage represents{" "}
                  <strong>model confidence</strong> (how strongly the linguistic
                  features match the learned training class),{" "}
                  <strong>NOT factual truth probability</strong>.
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

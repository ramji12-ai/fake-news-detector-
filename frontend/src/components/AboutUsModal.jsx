import React, { useEffect } from "react";
import { useAppData } from "../context/AppDataContext";

export default function AboutUsModal() {
  const { aboutUsModalOpen, setAboutUsModalOpen } = useAppData();

  useEffect(() => {
    if (!aboutUsModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setAboutUsModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aboutUsModalOpen, setAboutUsModalOpen]);

  if (!aboutUsModalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setAboutUsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="modal-card about-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="about-modal-badge">
            <span className="about-badge-icon">🛡️</span>
            <div>
              <h2 id="about-modal-title" className="modal-title">
                ABOUT VERITEXT NLP
              </h2>
              <p className="modal-subtitle">
                AI-Powered News Analysis &amp; Misinformation Detection Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setAboutUsModalOpen(false)}
            aria-label="Close About Us Modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body about-modal-body">
          <div className="about-intro-banner">
            <p>
              <strong>VeriText NLP</strong> is an AI-powered news analysis platform
              that combines Natural Language Processing, Machine Learning, and web-based
              information retrieval to evaluate news claims, identify deceptive linguistic
              patterns, and provide grounded contextual intelligence.
            </p>
          </div>

          {/* Section 1: MISSION */}
          <section className="about-section">
            <div className="about-section-heading">
              <span className="section-number">01</span>
              <h3>OUR MISSION</h3>
            </div>
            <p>
              In an era dominated by rapid digital publication and viral misinformation,
              ordinary readers face immense challenges discerning authentic reporting from
              fabricated headlines. VeriText NLP was engineered to democratize transparent,
              statistically sound linguistic analysis—giving journalists, researchers, and
              students immediate algorithmic insight into news text without opaque black-box claims.
            </p>
          </section>

          {/* Section 2: TECHNOLOGY */}
          <section className="about-section">
            <div className="about-section-heading">
              <span className="section-number">02</span>
              <h3>CORE TECHNOLOGIES</h3>
            </div>
            <div className="tech-badge-grid">
              <div className="tech-badge-item">
                <span className="tech-name">Natural Language Processing</span>
                <span className="tech-desc">Text normalization, regex token cleaning, and unigram/bigram n-gram parsing</span>
              </div>
              <div className="tech-badge-item">
                <span className="tech-name">TF-IDF Vectorizer</span>
                <span className="tech-desc">Term Frequency-Inverse Document Frequency extracting 30,000 statistical features</span>
              </div>
              <div className="tech-badge-item">
                <span className="tech-name">Logistic Regression</span>
                <span className="tech-desc">Binary classification model estimating calibrated class probabilities via sigmoid</span>
              </div>
              <div className="tech-badge-item">
                <span className="tech-name">Flask REST API</span>
                <span className="tech-desc">Python microservice with CORS, input validation, and real-time inference</span>
              </div>
              <div className="tech-badge-item">
                <span className="tech-name">Google Gemini API</span>
                <span className="tech-desc">Multimodal LLM providing grounded answers for contemporary and historical news</span>
              </div>
              <div className="tech-badge-item">
                <span className="tech-name">Google Search Grounding</span>
                <span className="tech-desc">Real-time live web indexing providing direct source URLs and publisher citations</span>
              </div>
            </div>
          </section>

          {/* Section 3: HOW IT WORKS */}
          <section className="about-section">
            <div className="about-section-heading">
              <span className="section-number">03</span>
              <h3>HOW VERITEXT WORKS</h3>
            </div>

            <div className="about-flow-duo">
              {/* Fake News Detection Pipeline */}
              <div className="about-flow-card">
                <h4>Fake News Detection Pipeline</h4>
                <div className="flow-step-list">
                  <div className="flow-step-item">
                    <span className="flow-step-dot">1</span>
                    <div>
                      <strong>News Article Input:</strong> Headline and body text submitted
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">2</span>
                    <div>
                      <strong>Text Preprocessing:</strong> Lowercasing, URL/HTML stripping, regex cleaning
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">3</span>
                    <div>
                      <strong>TF-IDF Vectorization:</strong> Conversion to 30,000 numerical n-gram weights
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">4</span>
                    <div>
                      <strong>Logistic Regression:</strong> Calculation of sigmoid margin
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">5</span>
                    <div>
                      <strong>Classification &amp; Confidence:</strong> FAKE vs REAL with exact percentage
                    </div>
                  </div>
                </div>
              </div>

              {/* AI News Assistant Pipeline */}
              <div className="about-flow-card">
                <h4>AI News Assistant Pipeline</h4>
                <div className="flow-step-list">
                  <div className="flow-step-item">
                    <span className="flow-step-dot">1</span>
                    <div>
                      <strong>User Question:</strong> Current or historical news query submitted
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">2</span>
                    <div>
                      <strong>Gemini Reasoning:</strong> Intent extraction &amp; search query generation
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">3</span>
                    <div>
                      <strong>Google Search Grounding:</strong> Live web search across official news sources
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">4</span>
                    <div>
                      <strong>Web Sources &amp; Citations:</strong> Extraction of verified links &amp; timestamps
                    </div>
                  </div>
                  <div className="flow-step-item">
                    <span className="flow-step-dot">5</span>
                    <div>
                      <strong>Grounded AI Answer:</strong> Synthesized neutral briefing with clickable citations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: FUTURE SCOPE */}
          <section className="about-section">
            <div className="about-section-heading">
              <span className="section-number">04</span>
              <h3>FUTURE SCOPE &amp; RESEARCH DIRECTIONS</h3>
            </div>
            <ul className="about-future-list">
              <li>
                <strong>Transformer Ensembles:</strong> Integration of RoBERTa and DeBERTa architectures for deeper semantic contextual embeddings.
              </li>
              <li>
                <strong>Multi-Language Support:</strong> Expansion into Indian regional languages (Hindi, Tamil, Bengali, Marathi) and global languages.
              </li>
              <li>
                <strong>Cross-Source Stance Detection:</strong> Automatic comparison of competing publisher perspectives on controversial claims.
              </li>
              <li>
                <strong>Multi-Modal Fact Checking:</strong> Analysis of deepfake imagery and synthetic voice audio alongside article text.
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <div className="about-disclaimer-card">
            <strong>Ethical ML Notice:</strong> VeriText classification reflects statistical patterns learned
            from training corpora. It is designed as an assistive research tool and does not replace human editorial
            judgment or independent factual verification.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setAboutUsModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

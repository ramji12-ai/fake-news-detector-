import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function Footer() {
  const { apiStatus, setAboutUsModalOpen } = useAppData();
  const [legalModalContent, setLegalModalContent] = useState(null);

  const openLegalModal = (title, body) => {
    setLegalModalContent({ title, body });
  };

  const closeLegalModal = () => {
    setLegalModalContent(null);
  };

  return (
    <>
      <footer className="footer-large" role="contentinfo">
        <div className="container footer-large-inner">
          {/* 5-Column Grid */}
          <div className="footer-columns-grid">
            {/* Column 1: Brand & Identity */}
            <div className="footer-column footer-col-brand">
              <div className="footer-brand">
                <div className="brand-icon footer-brand-icon" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="brand-text">
                  <span className="brand-title">VeriText NLP</span>
                  <span className="brand-subtitle">Fake News Detection System</span>
                </div>
              </div>

              <p className="footer-brand-desc">
                AI-powered news analysis using Natural Language Processing, Machine Learning,
                and web-grounded intelligence to safeguard digital journalism.
              </p>

              <div className="footer-social-links" aria-label="Project Links">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  title="GitHub Repository"
                  aria-label="GitHub Repository"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a
                  href="https://ai.google.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  title="Gemini AI Documentation"
                  aria-label="Gemini AI Documentation"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </a>
                <a
                  href="https://scikit-learn.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  title="Scikit-Learn Documentation"
                  aria-label="Scikit-Learn Documentation"
                >
                  <span className="social-txt-badge">ML</span>
                </a>
              </div>
            </div>

            {/* Column 2: EXPLORE */}
            <div className="footer-column">
              <h4 className="footer-col-title">EXPLORE</h4>
              <ul className="footer-links-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/detector">Fake News Detector</Link></li>
                <li><Link to="/ai-news">AI News Assistant</Link></li>
                <li><Link to="/history">Prediction History</Link></li>
                <li><Link to="/saved">Saved Articles</Link></li>
              </ul>
            </div>

            {/* Column 3: TECHNOLOGY */}
            <div className="footer-column">
              <h4 className="footer-col-title">TECHNOLOGY</h4>
              <ul className="footer-links-list">
                <li><Link to="/architecture">NLP &amp; ML Architecture</Link></li>
                <li><Link to="/architecture">TF-IDF Vectorization</Link></li>
                <li><Link to="/model">Logistic Regression Model</Link></li>
                <li><Link to="/model">Model Information</Link></li>
                <li><Link to="/analytics">Analytics &amp; Metrics</Link></li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="footer-column">
              <h4 className="footer-col-title">SUPPORT</h4>
              <ul className="footer-links-list">
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() => setAboutUsModalOpen(true)}
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() =>
                      openLegalModal(
                        "Frequently Asked Questions (FAQ)",
                        "1. How does VeriText detect fake news?\nVeriText uses natural language processing (regex cleaning, lowercasing, HTML stripping) and a TF-IDF vectorizer (30,000 features, unigram + bigram) connected to a trained Logistic Regression model.\n\n2. Is the prediction 100% factual truth?\nNo. VeriText is a machine-learning classification model that estimates the probability that an article resembles labeled training corpora. It is an assistive analytical tool.\n\n3. How does the AI News Assistant work?\nIt queries Google Gemini with Google Search grounding enabled to retrieve live accredited news with clickable source URLs."
                      )
                    }
                  >
                    FAQ
                  </button>
                </li>
                <li><Link to="/settings">Settings &amp; Appearance</Link></li>
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() =>
                      openLegalModal(
                        "Help & User Guide",
                        "Getting Started:\n1. Navigate to Detector to paste a news headline and body.\n2. Click 'Analyze News' to run TF-IDF and Logistic Regression.\n3. Navigate to 'AI News Assistant' to ask questions about current or historical news events.\n4. Browse 'Special News Reports' to read live articles from accredited Indian publishers and test them directly with VeriText."
                      )
                    }
                  >
                    Help &amp; Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() =>
                      openLegalModal(
                        "Project Contact",
                        "VeriText NLP Project Contact:\nCollege Final Year Capstone Project\nRepository: VeriText NLP\nEmail: contact@veritext-nlp.local\nSupport: Open an issue in the project workspace."
                      )
                    }
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: NEWS SOURCES */}
            <div className="footer-column">
              <h4 className="footer-col-title">NEWS SOURCES</h4>
              <ul className="footer-links-list">
                <li>
                  <a href="https://indianexpress.com" target="_blank" rel="noopener noreferrer">
                    The Indian Express ↗
                  </a>
                </li>
                <li>
                  <a href="https://www.ndtv.com" target="_blank" rel="noopener noreferrer">
                    NDTV ↗
                  </a>
                </li>
                <li>
                  <a href="https://www.thehindu.com" target="_blank" rel="noopener noreferrer">
                    The Hindu ↗
                  </a>
                </li>
                <li>
                  <a href="https://timesofindia.indiatimes.com" target="_blank" rel="noopener noreferrer">
                    The Times of India ↗
                  </a>
                </li>
                <li>
                  <a href="https://www.espncricinfo.com" target="_blank" rel="noopener noreferrer">
                    ESPNcricinfo ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Horizontal Separator */}
          <div className="footer-separator" />

          {/* Bottom Bar: System Status + Copyright + Legal */}
          <div className="footer-bottom-bar">
            {/* System Status Indicators */}
            <div className="footer-status-group">
              <span className="status-label-heading">System Status:</span>
              <span className={`footer-status-pill ${apiStatus.online ? "online" : "offline"}`}>
                <span className="status-indicator-dot" />
                {apiStatus.online ? "API Online" : "API Offline"}
              </span>

              <span className={`footer-status-pill ${apiStatus.modelLoaded ? "online" : "warning"}`}>
                <span className="status-indicator-dot" />
                {apiStatus.modelLoaded ? "Model Ready" : "Model Pending"}
              </span>
            </div>

            {/* Copyright */}
            <div className="footer-copyright">
              &copy; 2026 VeriText NLP. All rights reserved.
            </div>

            {/* Bottom Links */}
            <div className="footer-legal-links">
              <button
                type="button"
                className="footer-legal-btn"
                onClick={() =>
                  openLegalModal(
                    "Privacy Policy",
                    "VeriText NLP is designed with privacy-first principles:\n- No analyzed article text is sent to third-party ad networks.\n- Prediction history and saved bookmarks are stored exclusively in your local browser (localStorage).\n- AI News queries utilize Google Search Grounding to discover news without logging personally identifiable user data."
                  )
                }
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="footer-legal-btn"
                onClick={() =>
                  openLegalModal(
                    "Terms of Service",
                    "By using VeriText NLP, you agree that:\n1. The system is provided as an educational and research demonstrator.\n2. Machine learning classification scores do not constitute legal or factual proof of claim truth.\n3. Content retrieved from external news RSS feeds remains the intellectual property of respective publishers."
                  )
                }
              >
                Terms
              </button>
              <button
                type="button"
                className="footer-legal-btn"
                onClick={() =>
                  openLegalModal(
                    "Machine Learning Disclaimer",
                    "IMPORTANT NOTICE:\nVeriText NLP classifies news text based on statistical linguistic features extracted via TF-IDF (unigram and bigram tokens) evaluated by a binary Logistic Regression classifier.\n\nPrediction scores reflect model confidence in statistical class membership (FAKE / REAL), NOT an absolute factual truth determination. Always verify claims against accredited investigative reporting."
                  )
                }
              >
                Disclaimer
              </button>
              <button
                type="button"
                className="footer-legal-btn"
                onClick={() =>
                  openLegalModal(
                    "Accessibility Statement",
                    "VeriText NLP adheres to WCAG 2.1 AA accessibility guidelines:\n- Full keyboard navigation (tabbing, Enter, Escape, arrow controls)\n- ARIA labels on all modal and interactive controls\n- Reduced motion support honoring OS preferences and user settings\n- High contrast color themes with semantic color indicators."
                  )
                }
              >
                Accessibility
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Info / Legal Modal */}
      {legalModalContent && (
        <div
          className="modal-backdrop"
          onClick={closeLegalModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card legal-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{legalModalContent.title}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeLegalModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-body legal-modal-body">
              <pre className="legal-modal-text">{legalModalContent.body}</pre>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeLegalModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

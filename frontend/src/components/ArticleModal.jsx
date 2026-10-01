import React from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppData,
  formatDateTime,
  deriveMeaningfulTitle
} from "../context/AppDataContext";

export default function ArticleModal() {
  const {
    activeModalRecord,
    closeArticleModal,
    setHeadline,
    setArticleText,
    setCurrentResult,
    copyPredictionSummary
  } = useAppData();
  const navigate = useNavigate();

  if (!activeModalRecord) return null;

  const isReal = activeModalRecord.prediction === "REAL";
  const displayTitle = deriveMeaningfulTitle(
    activeModalRecord.title,
    activeModalRecord.text
  );

  const handleLoadInDetector = () => {
    setHeadline(activeModalRecord.title || "");
    setArticleText(activeModalRecord.text || "");
    setCurrentResult(activeModalRecord);
    closeArticleModal();
    navigate("/detector");
  };

  return (
    <div
      className="modal-backdrop"
      id="articleModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalArticleTitle"
      onClick={(e) => {
        if (e.target.id === "articleModal") closeArticleModal();
      }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">
              {formatDateTime(activeModalRecord.timestamp)}
            </span>
            <h3 className="modal-title" id="modalArticleTitle">
              {displayTitle}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon-close"
            onClick={closeArticleModal}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-badges-row">
            <span
              className={`record-badge ${isReal ? "badge-real" : "badge-fake"}`}
            >
              {isReal ? "\uD83D\uDFE2" : "\uD83D\uDD34"}{" "}
              {activeModalRecord.prediction}
            </span>
            <span className="record-meta-pill">
              {Number(activeModalRecord.confidence).toFixed(2)}% confidence
            </span>
            <span className="record-meta-pill">
              {activeModalRecord.model || "Logistic Regression"} &bull;{" "}
              {activeModalRecord.featureExtraction || "TF-IDF"}
            </span>
          </div>
          <div className="modal-article-box">
            {activeModalRecord.text || activeModalRecord.title || ""}
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLoadInDetector}
          >
            Load in Detector
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => copyPredictionSummary(activeModalRecord)}
          >
            Copy Result
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={closeArticleModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

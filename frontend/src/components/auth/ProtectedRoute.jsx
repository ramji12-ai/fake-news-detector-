import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, reason = "history" }) {
  const {
    isAuthenticated,
    isLoading,
    openLoginModal,
    handleCloseLoginModal,
    authModalState
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !authModalState.isOpen) {
      openLoginModal({
        mode: "login",
        reason,
        source: "direct-route",
        previousPath: "/",
        destination: location.pathname,
        reopenMoreMenu: false
      });
    }
  }, [isLoading, isAuthenticated, authModalState.isOpen, openLoginModal, reason, location.pathname]);

  if (isLoading) {
    return (
      <div className="page-container page-loading-container">
        <div className="loading-card card">
          <div className="spinner-lg" aria-hidden="true" />
          <h2 className="loading-title">Verifying Session...</h2>
          <p className="loading-desc">Checking your authenticated account credentials.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <section className="section-header">
          <div className="eyebrow-badge">AUTHENTICATION REQUIRED</div>
          <h1 className="section-title">
            {reason === "saved" ? "Saved Articles" : "Prediction History"}
          </h1>
          <p className="section-subtitle">
            Sign in to access your personal synchronized account data.
          </p>
        </section>

        <div className="card protected-gate-card">
          <div className="protected-gate-icon" aria-hidden="true">
            🔒
          </div>
          <h2 className="protected-gate-title">
            {reason === "saved"
              ? "Sign in to view your saved articles."
              : "Sign in to view your prediction history."}
          </h2>
          <p className="protected-gate-desc">
            {reason === "saved"
              ? "Your bookmarked news analyses and articles are synchronized across all your devices once you sign in."
              : "Your previous fake-news analyses are securely stored and organized in your account."}
          </p>
          <div className="protected-gate-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                openLoginModal({
                  mode: "login",
                  reason,
                  source: "direct-route",
                  previousPath: "/",
                  destination: location.pathname,
                  reopenMoreMenu: false
                })
              }
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCloseLoginModal}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

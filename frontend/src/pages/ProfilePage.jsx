import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { useSettings } from "../context/SettingsContext";

export default function ProfilePage() {
  const { user, userStats, refreshUser, logout, isLoading } = useAuth();
  const { showToast, openConfirmModal } = useAppData();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (user) refreshUser();
  }, [user, refreshUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
    showToast("Profile and statistics updated", "info");
  };

  const handleLogoutPrompt = () => {
    openConfirmModal(
      "Log Out Confirmation",
      "Are you sure you want to sign out of your VeriText account?",
      async () => {
        await logout();
        showToast("Signed out successfully.", "info");
        navigate("/");
      }
    );
  };

  if (!user) return null;

  const memberSince = (() => {
    try {
      if (!user.created_at) return "Active Member";
      const d = new Date(user.created_at);
      return d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
    } catch (_e) {
      return "Active Member";
    }
  })();

  const avatarInitial = user.name ? user.name[0].toUpperCase() : "U";

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header section-header-row">
        <div>
          <div className="eyebrow-badge">ACCOUNT OVERVIEW</div>
          <h1 className="section-title">User Profile</h1>
          <p className="section-subtitle">
            Manage your account credentials, view synchronized history counts,
            and monitor analysis metrics.
          </p>
        </div>
        <div className="section-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "↻ Refresh Stats"}
          </button>
        </div>
      </section>

      {/* Main Profile Identity Card */}
      <div className="card profile-hero-card">
        <div className="profile-hero-content">
          <div className="profile-large-avatar" aria-hidden="true">
            {avatarInitial}
          </div>
          <div className="profile-hero-details">
            <div className="profile-name-row">
              <h2 className="profile-display-name">{user.name}</h2>
              <span className="profile-status-pill">● Verified Account</span>
            </div>
            <p className="profile-display-email">{user.email}</p>
            <span className="profile-member-date">
              Member since: <strong>{memberSince}</strong>
            </span>
          </div>
        </div>

        <div className="profile-hero-actions">
          <Link to="/settings" className="btn btn-outline btn-sm">
            ⚙ Settings
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleLogoutPrompt}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Verified Activity Statistics */}
      <section className="profile-section" style={{ marginTop: "1.5rem" }}>
        <h3 className="card-subtitle" style={{ marginBottom: "0.85rem" }}>
          Verified Account Activity &bull; Real Statistics
        </h3>

        <div className="stats-kpi-grid">
          <div className="card stat-kpi-card">
            <div className="stat-kpi-top">
              <span className="stat-kpi-label">Predictions Analyzed</span>
              <span className="stat-kpi-icon">⚡</span>
            </div>
            <span className="stat-kpi-value" id="profileTotalPredictions">
              {Number(userStats.total_predictions || 0).toLocaleString()}
            </span>
            <span className="stat-kpi-sub">Total articles evaluated</span>
          </div>

          <div className="card stat-kpi-card">
            <div className="stat-kpi-top">
              <span className="stat-kpi-label">Likely Real News</span>
              <span className="stat-kpi-icon" style={{ color: "var(--real-color)" }}>
                🟢
              </span>
            </div>
            <span
              className="stat-kpi-value"
              style={{ color: "var(--real-color)" }}
              id="profileRealPredictions"
            >
              {Number(userStats.real_predictions || 0).toLocaleString()}
            </span>
            <span className="stat-kpi-sub">Authentic pattern matches</span>
          </div>

          <div className="card stat-kpi-card">
            <div className="stat-kpi-top">
              <span className="stat-kpi-label">Likely Fake News</span>
              <span className="stat-kpi-icon" style={{ color: "var(--fake-color)" }}>
                🔴
              </span>
            </div>
            <span
              className="stat-kpi-value"
              style={{ color: "var(--fake-color)" }}
              id="profileFakePredictions"
            >
              {Number(userStats.fake_predictions || 0).toLocaleString()}
            </span>
            <span className="stat-kpi-sub">Deceptive pattern matches</span>
          </div>

          <div className="card stat-kpi-card">
            <div className="stat-kpi-top">
              <span className="stat-kpi-label">Saved Articles</span>
              <span className="stat-kpi-icon">🔖</span>
            </div>
            <span className="stat-kpi-value" id="profileTotalSaved">
              {Number(userStats.total_saved || 0).toLocaleString()}
            </span>
            <span className="stat-kpi-sub">Bookmarked news analyses</span>
          </div>
        </div>
      </section>

      {/* Account Navigation Shortcuts */}
      <section className="profile-section" style={{ marginTop: "1.5rem" }}>
        <h3 className="card-subtitle" style={{ marginBottom: "0.85rem" }}>
          Account Quick Navigation
        </h3>

        <div className="profile-shortcuts-grid">
          <Link to="/history" className="card profile-shortcut-card">
            <div className="shortcut-icon-circle">↺</div>
            <div>
              <h4 className="shortcut-title">Prediction History</h4>
              <p className="shortcut-desc">
                Review, filter, and inspect your full personal fake-news analysis log.
              </p>
            </div>
            <span className="shortcut-arrow">→</span>
          </Link>

          <Link to="/saved" className="card profile-shortcut-card">
            <div className="shortcut-icon-circle">☆</div>
            <div>
              <h4 className="shortcut-title">Saved Articles</h4>
              <p className="shortcut-desc">
                Access your bookmarked news reports, summaries, and classifications.
              </p>
            </div>
            <span className="shortcut-arrow">→</span>
          </Link>

          <Link to="/detector" className="card profile-shortcut-card">
            <div className="shortcut-icon-circle">⚡</div>
            <div>
              <h4 className="shortcut-title">Run Fake News Detector</h4>
              <p className="shortcut-desc">
                Analyze a new headline or article content with TF-IDF and ML.
              </p>
            </div>
            <span className="shortcut-arrow">→</span>
          </Link>

          <Link to="/settings" className="card profile-shortcut-card">
            <div className="shortcut-icon-circle">⚙</div>
            <div>
              <h4 className="shortcut-title">Platform Settings</h4>
              <p className="shortcut-desc">
                Customize appearance themes, toggle model specifications, and manage notifications.
              </p>
            </div>
            <span className="shortcut-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

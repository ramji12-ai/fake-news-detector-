import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useSettings } from "../../context/SettingsContext";

export default function AuthModal() {
  const { authModalState, handleCloseLoginModal, login, signup } = useAuth();
  const { showToast } = useAppData();
  const { settings } = useSettings();

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode with authModalState on open
  useEffect(() => {
    if (authModalState.isOpen) {
      setMode(authModalState.mode || "login");
      setValidationErrors({});
      setServerError(null);
    }
  }, [authModalState.isOpen, authModalState.mode]);

  // Handle ESC key to close modal via centralized handleCloseLoginModal
  useEffect(() => {
    if (!authModalState.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseLoginModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [authModalState.isOpen, handleCloseLoginModal]);

  if (!authModalState.isOpen) return null;

  // Contextual titles and descriptions
  const getContextualContent = () => {
    if (mode === "signup") {
      if (authModalState.reason === "save-analysis" || authModalState.reason === "save_analysis") {
        return {
          title: "Create Account to Save Analysis",
          desc: "Create an account to save your prediction and access it later."
        };
      }
      if (authModalState.reason === "save-article" || authModalState.reason === "save_article") {
        return {
          title: "Create Account to Save Article",
          desc: "Create an account to bookmark this article to your personal collection."
        };
      }
      return {
        title: "Create Your Account",
        desc: "Join VeriText NLP to synchronize predictions, bookmark news, and track your history across sessions."
      };
    }

    if (authModalState.customTitle && authModalState.customDesc) {
      return {
        title: authModalState.customTitle,
        desc: authModalState.customDesc
      };
    }

    if (authModalState.reason === "save-analysis" || authModalState.reason === "save_analysis") {
      return {
        title: "Sign in to save your analysis",
        desc: "Your prediction history is saved to your account so you can access it later."
      };
    }

    if (authModalState.reason === "save-article" || authModalState.reason === "save_article") {
      return {
        title: "Sign in to save this article",
        desc: "Sign in to save this article to your personal saved articles collection."
      };
    }

    if (authModalState.reason === "history") {
      return {
        title: "Sign in to view your prediction history",
        desc: "Your previous fake-news analyses are securely stored and organized in your account."
      };
    }

    if (authModalState.reason === "saved") {
      return {
        title: "Sign in to view your saved articles",
        desc: "Your bookmarked news analyses and articles are synchronized across all your devices."
      };
    }

    return {
      title: "Welcome Back",
      desc: "Sign in to your VeriText account to access your saved analyses and bookmarked news."
    };
  };

  const contextContent = getContextualContent();

  const validate = () => {
    const errors = {};
    const emailRegex = /^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$/;

    if (mode === "signup") {
      if (!name.trim()) {
        errors.name = "Please enter your full name.";
      }
    }

    if (!email.trim()) {
      errors.email = "Please enter your email.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    } else if (mode === "signup" && password.length < 8) {
      errors.password = "Password must contain at least 8 characters.";
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await signup(name.trim(), email.trim(), password);
        if (res.success) {
          showToast(`Welcome to VeriText, ${res.user.name}!`, "success");
        } else {
          setServerError(res.error);
        }
      } else {
        const res = await login(email.trim(), password);
        if (res.success) {
          showToast(`Welcome back, ${res.user.name}!`, "success");
        } else {
          setServerError(res.error);
        }
      }
    } catch (_err) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop auth-modal-backdrop"
      onClick={handleCloseLoginModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`modal-card auth-modal-card ${
          settings.animations ? "auth-card-animated" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <span className="auth-brand-icon">🛡️</span>
            <span className="auth-brand-name">VeriText NLP</span>
          </div>
          <button
            type="button"
            className="modal-close-btn auth-close-btn"
            onClick={handleCloseLoginModal}
            aria-label="Close Authentication Dialog"
          >
            ✕
          </button>
        </div>

        {/* Contextual Title & Description */}
        <div className="auth-modal-title-block">
          <h2 id="auth-modal-title" className="auth-title">
            {contextContent.title}
          </h2>
          <p className="auth-desc">{contextContent.desc}</p>
        </div>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="auth-error-banner" role="alert">
            <span className="auth-error-icon" aria-hidden="true">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="authNameInput" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="authNameInput"
                className={`form-input ${validationErrors.name ? "input-error" : ""}`}
                placeholder="e.g. Ayush Nigotiya"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors((prev) => ({ ...prev, name: null }));
                  }
                }}
                autoComplete="name"
              />
              {validationErrors.name && (
                <span className="field-error-text">{validationErrors.name}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="authEmailInput" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="authEmailInput"
              className={`form-input ${validationErrors.email ? "input-error" : ""}`}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: null }));
                }
              }}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="authPasswordInput" className="form-label">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-link-subtle"
                  onClick={() =>
                    showToast(
                      "Password reset instructions have been logged. Please contact your system administrator.",
                      "info"
                    )
                  }
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              id="authPasswordInput"
              className={`form-input ${validationErrors.password ? "input-error" : ""}`}
              placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: null }));
                }
              }}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {validationErrors.password && (
              <span className="field-error-text">{validationErrors.password}</span>
            )}
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="authConfirmPasswordInput" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="authConfirmPasswordInput"
                className={`form-input ${
                  validationErrors.confirmPassword ? "input-error" : ""
                }`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      confirmPassword: null
                    }));
                  }
                }}
                autoComplete="new-password"
              />
              {validationErrors.confirmPassword && (
                <span className="field-error-text">
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>
          )}

          <div className="auth-form-buttons-row" style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" />
                  <span>{mode === "signup" ? "Creating Account..." : "Signing In..."}</span>
                </>
              ) : (
                <span>{mode === "signup" ? "Create Account" : "Sign In"}</span>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline auth-cancel-btn"
              onClick={handleCloseLoginModal}
              disabled={isSubmitting}
              title="Cancel and return"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google OAuth (clearly marked with configuration requirement) */}
        <div className="auth-oauth-block">
          <button
            type="button"
            className="btn btn-outline btn-block oauth-google-btn"
            onClick={() => {
              showToast(
                "Google OAuth requires GOOGLE_CLIENT_ID configuration in backend settings.",
                "info"
              );
            }}
            title="Google OAuth requires Client ID configuration"
          >
            <svg
              className="google-svg-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
            <span className="oauth-setup-badge">Setup Required</span>
          </button>
        </div>

        {/* Switch Mode Footer */}
        <div className="auth-modal-footer">
          {mode === "login" ? (
            <p className="auth-switch-text">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link-highlight"
                onClick={() => {
                  setMode("signup");
                  setValidationErrors({});
                  setServerError(null);
                }}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="auth-switch-text">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link-highlight"
                onClick={() => {
                  setMode("login");
                  setValidationErrors({});
                  setServerError(null);
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

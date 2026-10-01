import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const {
    apiStatus,
    checkBackendStatus,
    historyItems,
    savedItems,
    showToast
  } = useAppData();

  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    openAuthModal,
    logout
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const moreDropdownRef = useRef(null);
  const statusPopoverRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileDrawerRef = useRef(null);

  // Close dropdowns and drawer on route changes
  useEffect(() => {
    setMoreDropdownOpen(false);
    setMobileDrawerOpen(false);
    setStatusPopoverOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(e.target)
      ) {
        setMoreDropdownOpen(false);
      }
      if (
        statusPopoverRef.current &&
        !statusPopoverRef.current.contains(e.target)
      ) {
        setStatusPopoverOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMoreDropdownOpen(false);
        setStatusPopoverOpen(false);
        setUserDropdownOpen(false);
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const currentPath = location.pathname;
  const isHomeActive = currentPath === "/" || currentPath === "/home";
  const isDetectorActive = currentPath === "/detector";
  const isAiNewsActive = currentPath === "/ai-news";
  const isHistoryActive = currentPath === "/history";
  const isSavedActive = currentPath === "/saved";

  // Check if any route inside "More" dropdown is currently active
  const moreRoutes = [
    "/analytics",
    "/model",
    "/architecture",
    "/settings",
    "/profile"
  ];
  const isMoreActive = moreRoutes.some((route) => currentPath.startsWith(route));

  const handleRefreshStatus = () => {
    checkBackendStatus();
    showToast("Refreshed system and model status", "info");
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    showToast("Signed out successfully.", "info");
    if (location.pathname.startsWith("/profile")) {
      navigate("/");
    }
  };

  const isOnline = apiStatus.online && !apiStatus.checking;
  const isModelReady = apiStatus.modelLoaded;

  return (
    <header className="navbar-saas" id="topNavbar">
      <div className="container navbar-inner-saas">
        {/* ========================================================
            LEFT SIDE: Logo & Brand Area
            ======================================================== */}
        <div className="navbar-left">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="navbar-hamburger-btn"
            id="mobileMenuBtn"
            aria-label="Open Navigation Menu"
            aria-expanded={mobileDrawerOpen}
            onClick={() => setMobileDrawerOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link to="/" className="brand-saas" aria-label="VeriText NLP Homepage">
            <div className="brand-icon-saas" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="brand-text-saas">
              <span className="brand-title-saas">VeriText NLP</span>
              <span className="brand-subtitle-saas">Fake News Detection System</span>
            </div>
          </Link>
        </div>

        {/* ========================================================
            CENTER NAVIGATION: Clean SaaS Layout with "More ▾"
            ======================================================== */}
        <nav className="navbar-center-nav" aria-label="Main Application Navigation">
          <NavLink
            to="/"
            className={() => `nav-item-saas ${isHomeActive ? "active" : ""}`}
          >
            Home
          </NavLink>

          <NavLink
            to="/detector"
            className={() => `nav-item-saas ${isDetectorActive ? "active" : ""}`}
          >
            Detector
          </NavLink>

          <NavLink
            to="/ai-news"
            className={() => `nav-item-saas ${isAiNewsActive ? "active" : ""}`}
          >
            AI News Assistant
          </NavLink>

          <NavLink
            to="/history"
            className={() => `nav-item-saas ${isHistoryActive ? "active" : ""}`}
          >
            History
          </NavLink>

          <NavLink
            to="/saved"
            className={() => `nav-item-saas ${isSavedActive ? "active" : ""}`}
          >
            Saved Articles
          </NavLink>

          {/* "More ▾" Dropdown */}
          <div className="nav-dropdown-wrapper" ref={moreDropdownRef}>
            <button
              type="button"
              className={`nav-item-saas nav-dropdown-trigger ${
                isMoreActive ? "active" : ""
              }`}
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={moreDropdownOpen}
              aria-label="More navigation pages"
            >
              <span>More</span>
              <svg
                className={`dropdown-chevron ${moreDropdownOpen ? "open" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {moreDropdownOpen && (
              <div
                className="nav-dropdown-menu"
                role="menu"
                aria-label="Additional Navigation Links"
              >
                {/* Group 1: ACCOUNT & DATA */}
                <div className="dropdown-group">
                  <div className="dropdown-group-header">ACCOUNT &amp; DATA</div>

                  <Link
                    to="/analytics"
                    className={`dropdown-item ${
                      currentPath === "/analytics" ? "active" : ""
                    }`}
                    role="menuitem"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">▥</span>
                    <span className="dropdown-item-label">Analytics</span>
                  </Link>
                </div>

                <div className="dropdown-divider" />

                {/* Group 2: MODEL */}
                <div className="dropdown-group">
                  <div className="dropdown-group-header">MODEL</div>

                  <Link
                    to="/model"
                    className={`dropdown-item ${
                      currentPath === "/model" ? "active" : ""
                    }`}
                    role="menuitem"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">◈</span>
                    <span className="dropdown-item-label">Model Information</span>
                  </Link>

                  <Link
                    to="/architecture"
                    className={`dropdown-item ${
                      currentPath === "/architecture" ? "active" : ""
                    }`}
                    role="menuitem"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">◇</span>
                    <span className="dropdown-item-label">NLP &amp; ML Architecture</span>
                  </Link>
                </div>

                <div className="dropdown-divider" />

                {/* Group 3: SYSTEM */}
                <div className="dropdown-group">
                  <div className="dropdown-group-header">SYSTEM</div>

                  {isAuthenticated && (
                    <Link
                      to="/profile"
                      className={`dropdown-item ${
                        currentPath === "/profile" ? "active" : ""
                      }`}
                      role="menuitem"
                      onClick={() => setMoreDropdownOpen(false)}
                    >
                      <span className="dropdown-item-icon">👤</span>
                      <span className="dropdown-item-label">User Profile</span>
                    </Link>
                  )}

                  <Link
                    to="/settings"
                    className={`dropdown-item ${
                      currentPath === "/settings" ? "active" : ""
                    }`}
                    role="menuitem"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">⚙</span>
                    <span className="dropdown-item-label">Settings</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ========================================================
            RIGHT SIDE: Status + User Account Authentication Area
            ======================================================== */}
        <div className="navbar-right">
          {/* Status Badge */}
          <div className="status-badge-wrapper" ref={statusPopoverRef}>
            <button
              type="button"
              className="status-control-btn"
              onClick={() => {
                const next = !statusPopoverOpen;
                setStatusPopoverOpen(next);
                if (next) checkBackendStatus();
              }}
              aria-haspopup="true"
              aria-expanded={statusPopoverOpen}
              aria-label="System status diagnostics"
              title="Click to view API and Model status"
            >
              <span
                className={`status-indicator-dot-saas ${
                  isOnline && isModelReady
                    ? "online"
                    : isOnline
                    ? "warning"
                    : "offline"
                }`}
              />
              <span className="status-control-text">
                {isOnline && isModelReady ? (
                  <>
                    <strong className="status-primary-text">● Online</strong>
                    <span className="status-secondary-text">API + Model Ready</span>
                  </>
                ) : isOnline ? (
                  <>
                    <strong className="status-primary-text">● Online</strong>
                    <span className="status-secondary-text">Model Pending</span>
                  </>
                ) : (
                  <>
                    <strong className="status-primary-text text-fake">● Offline</strong>
                    <span className="status-secondary-text">Server Disconnected</span>
                  </>
                )}
              </span>
            </button>

            {/* Diagnostics Popover */}
            {statusPopoverOpen && (
              <div
                className="status-popover-saas"
                role="region"
                aria-label="System Health Details"
              >
                <div className="popover-saas-header">
                  <span className="popover-saas-title">SYSTEM STATUS</span>
                  <button
                    type="button"
                    className="popover-refresh-btn"
                    onClick={handleRefreshStatus}
                    title="Refresh Status"
                    aria-label="Refresh Status"
                  >
                    ↻
                  </button>
                </div>

                <div className="popover-saas-list">
                  <div className="popover-saas-row">
                    <span className="popover-row-key">API Server</span>
                    <span
                      className={`popover-row-badge ${
                        apiStatus.online ? "badge-real" : "badge-fake"
                      }`}
                    >
                      {apiStatus.online ? "● Online" : "● Offline"}
                    </span>
                  </div>

                  <div className="popover-saas-row">
                    <span className="popover-row-key">ML Model</span>
                    <span
                      className={`popover-row-badge ${
                        apiStatus.modelLoaded ? "badge-real" : "badge-fake"
                      }`}
                    >
                      {apiStatus.modelLoaded ? "● Ready" : "● Not Loaded"}
                    </span>
                  </div>

                  <div className="popover-saas-row">
                    <span className="popover-row-key">Prediction API</span>
                    <span
                      className={`popover-row-badge ${
                        apiStatus.online && apiStatus.modelLoaded
                          ? "badge-real"
                          : "badge-fake"
                      }`}
                    >
                      {apiStatus.online && apiStatus.modelLoaded
                        ? "● Available"
                        : "● Unavailable"}
                    </span>
                  </div>

                  <div className="popover-saas-row">
                    <span className="popover-row-key">News Assistant</span>
                    <span
                      className={`popover-row-badge ${
                        apiStatus.online ? "badge-real" : "badge-fake"
                      }`}
                    >
                      {apiStatus.online ? "● Grounded" : "● Offline"}
                    </span>
                  </div>
                </div>

                <div className="popover-saas-footer">
                  <span>Host: <code>http://127.0.0.1:5000</code></span>
                </div>
              </div>
            )}
          </div>

          {/* User Authentication Area */}
          {isAuthLoading ? (
            <div className="nav-user-skeleton" aria-hidden="true" />
          ) : !isAuthenticated ? (
            <button
              type="button"
              className="btn btn-sm btn-primary nav-signin-btn"
              onClick={() => openAuthModal({ mode: "login" })}
              aria-label="Sign In to VeriText NLP"
            >
              <span>Sign In</span>
            </button>
          ) : (
            <div className="nav-user-menu-wrapper" ref={userDropdownRef}>
              <button
                type="button"
                className={`nav-user-menu-btn ${userDropdownOpen ? "open" : ""}`}
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={userDropdownOpen}
                aria-label="User Account Menu"
              >
                <span className="nav-user-avatar-circle" aria-hidden="true">
                  {user.avatar || (user.name ? user.name[0].toUpperCase() : "U")}
                </span>
                <span className="nav-user-name">
                  {user.name ? user.name.split(" ")[0] : "User"}
                </span>
                <svg
                  className={`dropdown-chevron ${userDropdownOpen ? "open" : ""}`}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* User Dropdown Popover */}
              {userDropdownOpen && (
                <div
                  className="user-dropdown-menu"
                  role="menu"
                  aria-label="User Account Options"
                >
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-avatar" aria-hidden="true">
                      {user.avatar || (user.name ? user.name[0].toUpperCase() : "U")}
                    </span>
                    <div className="user-dropdown-info">
                      <strong className="user-dropdown-name">{user.name}</strong>
                      <span className="user-dropdown-email">{user.email}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">👤</span>
                    <span className="dropdown-item-label">Profile</span>
                  </Link>

                  <Link
                    to="/history"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">↺</span>
                    <span className="dropdown-item-label">History</span>
                    {historyItems.length > 0 && (
                      <span className="dropdown-count-badge">
                        {historyItems.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/saved"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">☆</span>
                    <span className="dropdown-item-label">Saved Articles</span>
                    {savedItems.length > 0 && (
                      <span className="dropdown-count-badge">
                        {savedItems.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/settings"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <span className="dropdown-item-icon">⚙</span>
                    <span className="dropdown-item-label">Settings</span>
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item dropdown-item-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-item-icon">🚪</span>
                    <span className="dropdown-item-label">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MOBILE NAVIGATION DRAWER
          ======================================================== */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`mobile-drawer ${mobileDrawerOpen ? "open" : ""}`}
        ref={mobileDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="mobile-drawer-header">
          <div className="brand-saas">
            <div className="brand-icon-saas" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span className="brand-title-saas">VeriText NLP</span>
          </div>

          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close Navigation Menu"
          >
            ✕
          </button>
        </div>

        {/* Mobile User Header */}
        <div className="mobile-drawer-user-area">
          {isAuthLoading ? null : !isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary btn-block btn-sm"
              onClick={() => {
                setMobileDrawerOpen(false);
                openAuthModal({ mode: "login" });
              }}
            >
              Sign In to VeriText
            </button>
          ) : (
            <div className="mobile-user-card">
              <div className="mobile-user-top">
                <span className="nav-user-avatar-circle" aria-hidden="true">
                  {user.avatar || (user.name ? user.name[0].toUpperCase() : "U")}
                </span>
                <div className="mobile-user-text">
                  <strong className="mobile-user-name">{user.name}</strong>
                  <span className="mobile-user-email">{user.email}</span>
                </div>
              </div>
              <div className="mobile-user-btns">
                <Link
                  to="/profile"
                  className="btn btn-sm btn-outline flex-1"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-danger flex-1"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleLogout();
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="mobile-drawer-links">
          <div className="mobile-drawer-group-title">MAIN</div>
          <NavLink
            to="/"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">🏠</span>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/detector"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">⚡</span>
            <span>Detector</span>
          </NavLink>

          <NavLink
            to="/ai-news"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">💬</span>
            <span>AI News Assistant</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">↺</span>
            <span>History</span>
            {historyItems.length > 0 && (
              <span className="dropdown-count-badge ml-auto">
                {historyItems.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/saved"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">☆</span>
            <span>Saved Articles</span>
            {savedItems.length > 0 && (
              <span className="dropdown-count-badge ml-auto">
                {savedItems.length}
              </span>
            )}
          </NavLink>

          <div className="drawer-divider" />

          <div className="mobile-drawer-group-title">ACCOUNT &amp; DATA</div>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">▥</span>
            <span>Analytics</span>
          </NavLink>

          <div className="drawer-divider" />

          <div className="mobile-drawer-group-title">MODEL &amp; SYSTEM</div>
          <NavLink
            to="/model"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">◈</span>
            <span>Model Information</span>
          </NavLink>

          <NavLink
            to="/architecture"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">◇</span>
            <span>NLP &amp; ML Architecture</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span className="drawer-icon">⚙</span>
            <span>Settings</span>
          </NavLink>

          <div className="drawer-divider" />

          {/* System Status in Drawer */}
          <div className="mobile-drawer-status">
            <span
              className={`status-indicator-dot-saas ${
                isOnline && isModelReady ? "online" : "offline"
              }`}
            />
            <span className="mobile-status-label">
              {isOnline && isModelReady
                ? "System Online • Model Ready"
                : "System Offline"}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}

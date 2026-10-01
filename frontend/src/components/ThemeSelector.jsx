import React from "react";
import { useSettings, COLOR_THEMES } from "../context/SettingsContext";

export default function ThemeSelector() {
  const {
    settings,
    activeThemeColor,
    setThemeColor,
    setThemeMode
  } = useSettings();

  return (
    <div className="theme-selector-container">
      {/* Mode Controls: Light / Dark / System */}
      <div className="theme-mode-section">
        <label className="settings-field-label">Appearance Mode</label>
        <p className="settings-field-hint">
          Choose between Dark, Light, or automatic System preference mode.
        </p>

        <div className="mode-toggle-group" role="radiogroup" aria-label="Appearance Mode">
          <button
            type="button"
            className={`mode-btn ${settings.mode === "light" && !settings.systemTheme ? "active" : ""}`}
            onClick={() => setThemeMode("light")}
            role="radio"
            aria-checked={settings.mode === "light" && !settings.systemTheme}
          >
            <span className="mode-icon">☀️</span>
            <span className="mode-name">Light</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${settings.mode === "dark" && !settings.systemTheme ? "active" : ""}`}
            onClick={() => setThemeMode("dark")}
            role="radio"
            aria-checked={settings.mode === "dark" && !settings.systemTheme}
          >
            <span className="mode-icon">🌙</span>
            <span className="mode-name">Dark</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${settings.systemTheme || settings.mode === "system" ? "active" : ""}`}
            onClick={() => setThemeMode("system")}
            role="radio"
            aria-checked={settings.systemTheme || settings.mode === "system"}
          >
            <span className="mode-icon">💻</span>
            <span className="mode-name">System Auto</span>
          </button>
        </div>
      </div>

      {/* Color Themes Grid */}
      <div className="theme-color-section mt-4">
        <label className="settings-field-label">Accent Color Theme</label>
        <p className="settings-field-hint">
          Select from 8 professional palettes. The theme colors will be applied to buttons,
          badges, hero gradients, and active UI states.
        </p>

        <div className="theme-cards-grid">
          {COLOR_THEMES.map((theme) => {
            const isSelected = activeThemeColor === theme.id;

            return (
              <div
                key={theme.id}
                className={`theme-card ${isSelected ? "selected" : ""}`}
                onClick={() => setThemeColor(theme.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setThemeColor(theme.id);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Select ${theme.name} Theme`}
              >
                {/* Mini UI Preview Box */}
                <div
                  className="theme-card-preview"
                  style={{
                    backgroundColor: settings.mode === "light" ? theme.lightBg : theme.darkBg
                  }}
                >
                  <div
                    className="mini-preview-bar"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div className="mini-preview-body">
                    <span
                      className="mini-preview-btn"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span
                      className="mini-preview-tag"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <div className="theme-card-info">
                  <div className="theme-card-header">
                    <strong className="theme-card-name">{theme.name}</strong>
                    {isSelected && (
                      <span className="theme-card-check" aria-label="Selected">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="theme-card-desc">{theme.description}</span>

                  {/* 3 Color Dots */}
                  <div className="theme-color-dots" aria-hidden="true">
                    <span
                      className="theme-dot"
                      style={{ backgroundColor: theme.primary }}
                      title={`Primary: ${theme.primary}`}
                    />
                    <span
                      className="theme-dot"
                      style={{ backgroundColor: theme.secondary }}
                      title={`Secondary: ${theme.secondary}`}
                    />
                    <span
                      className="theme-dot"
                      style={{ backgroundColor: theme.accent }}
                      title={`Accent: ${theme.accent}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

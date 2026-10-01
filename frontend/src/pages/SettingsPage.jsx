import React from "react";
import Toggle from "../components/Toggle";
import ThemeSelector from "../components/ThemeSelector";
import { useSettings } from "../context/SettingsContext";
import { useAppData } from "../context/AppDataContext";

export default function SettingsPage() {
  const {
    settings,
    effectiveTheme,
    updateSetting,
    resetAllSettings
  } = useSettings();

  const {
    historyItems,
    savedItems,
    clearAllHistory,
    clearAllSaved,
    openConfirmModal,
    showToast
  } = useAppData();

  const handleThemeToggle = (isDark) => {
    const nextTheme = isDark ? "dark" : "light";
    updateSetting("theme", nextTheme);
    showToast(
      `\u2713 Theme set to ${nextTheme === "dark" ? "Dark" : "Light"} mode`,
      "info"
    );
  };

  const handleSettingChange = (key, value, label) => {
    updateSetting(key, value);
    showToast(
      `\u2713 ${label}: ${value ? "ON" : "OFF"}`,
      "info"
    );
  };

  const handleClearHistoryConfirm = () => {
    openConfirmModal(
      "Clear Prediction History",
      "Are you sure you want to permanently delete all prediction history records?",
      () => clearAllHistory()
    );
  };

  const handleClearSavedConfirm = () => {
    openConfirmModal(
      "Clear Saved Articles",
      "Are you sure you want to remove all saved articles from your bookmarks?",
      () => clearAllSaved()
    );
  };

  const handleResetSettingsConfirm = () => {
    openConfirmModal(
      "Reset All Settings",
      "Are you sure you want to restore all Appearance, Interface, Notification, Detector, and AI Assistant settings to their default values?",
      () => {
        resetAllSettings();
        showToast("\u2713 All settings restored to defaults", "success");
      }
    );
  };

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header">
        <div className="eyebrow-badge">APPLICATION PREFERENCES</div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">
          Configure theme appearance, interface behavior, notifications,
          detector display options, AI News Assistant controls, and local
          storage. All changes are saved automatically.
        </p>
      </section>

      <div className="settings-grid">
        {/* 1. APPEARANCE */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">01 &bull; APPEARANCE</span>
            <h2 className="card-subtitle">Appearance &amp; Color Themes</h2>
          </div>
          <ThemeSelector />
        </div>

        {/* 2. INTERFACE */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">02 &bull; INTERFACE</span>
            <h2 className="card-subtitle">Interface</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Animations</span>
              <span className="setting-desc">
                Enable smooth page transitions, progress bars, and UI
                micro-interactions.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleAnimations"
                checked={settings.animations}
                onChange={(val) =>
                  handleSettingChange("animations", val, "Animations")
                }
                label="Enable Animations"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Compact Mode</span>
              <span className="setting-desc">
                Reduce card padding and vertical spacing for a denser dashboard
                layout.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleCompactMode"
                checked={settings.compactMode}
                onChange={(val) =>
                  handleSettingChange("compactMode", val, "Compact Mode")
                }
                label="Enable Compact Mode"
              />
            </div>
          </div>
        </div>

        {/* 3. NOTIFICATIONS */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">03 &bull; NOTIFICATIONS</span>
            <h2 className="card-subtitle">Notifications</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Prediction Notifications</span>
              <span className="setting-desc">
                Show toast alerts when fake-news classification completes or
                encounters validation errors.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="togglePredictionNotifications"
                checked={settings.predictionNotifications}
                onChange={(val) =>
                  handleSettingChange(
                    "predictionNotifications",
                    val,
                    "Prediction Notifications"
                  )
                }
                label="Prediction Notifications"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">AI Assistant Notifications</span>
              <span className="setting-desc">
                Show toast alerts when the AI News Assistant finishes web search
                queries or copies answers.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleAiNotifications"
                checked={settings.aiNotifications}
                onChange={(val) =>
                  handleSettingChange(
                    "aiNotifications",
                    val,
                    "AI Assistant Notifications"
                  )
                }
                label="AI Assistant Notifications"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Saved Article Notifications</span>
              <span className="setting-desc">
                Show toast alerts when bookmarking or removing saved articles.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleSavedNotifications"
                checked={settings.savedNotifications}
                onChange={(val) =>
                  handleSettingChange(
                    "savedNotifications",
                    val,
                    "Saved Article Notifications"
                  )
                }
                label="Saved Article Notifications"
              />
            </div>
          </div>
        </div>

        {/* 4. DETECTOR SETTINGS */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">04 &bull; DETECTOR SETTINGS</span>
            <h2 className="card-subtitle">Detector Settings</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Show Confidence</span>
              <span className="setting-desc">
                Display the confidence percentage and probability progress bar on
                the Detector page.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleShowConfidence"
                checked={settings.showConfidence}
                onChange={(val) =>
                  handleSettingChange("showConfidence", val, "Show Confidence")
                }
                label="Show Confidence on Detector Page"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Show Model Information</span>
              <span className="setting-desc">
                Show model specifications and evaluation metrics on Detector and
                Model pages.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleShowModelInfo"
                checked={settings.showModelInfo}
                onChange={(val) =>
                  handleSettingChange(
                    "showModelInfo",
                    val,
                    "Show Model Information"
                  )
                }
                label="Show model specifications and evaluation metrics on Detector and Model pages"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Auto Save Predictions</span>
              <span className="setting-desc">
                Automatically save every new prediction result to your
                Prediction History.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleAutoSavePredictions"
                checked={settings.autoSavePredictions}
                onChange={(val) =>
                  handleSettingChange(
                    "autoSavePredictions",
                    val,
                    "Auto Save Predictions"
                  )
                }
                label="Auto Save Predictions to History"
              />
            </div>
          </div>
        </div>

        {/* 5. AI ASSISTANT */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">05 &bull; AI ASSISTANT</span>
            <h2 className="card-subtitle">AI Assistant</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Show Sources</span>
              <span className="setting-desc">
                Display grounded web source citations and links under AI News
                Assistant answers.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleShowSources"
                checked={settings.showSources}
                onChange={(val) =>
                  handleSettingChange("showSources", val, "Show Sources")
                }
                label="Show Sources in AI Assistant"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Auto Scroll Chat</span>
              <span className="setting-desc">
                Automatically scroll to the newest message when chatting with
                the AI News Assistant.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleAutoScrollChat"
                checked={settings.autoScrollChat}
                onChange={(val) =>
                  handleSettingChange("autoScrollChat", val, "Auto Scroll Chat")
                }
                label="Auto Scroll Chat"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Press Enter to Send</span>
              <span className="setting-desc">
                Send your chat question when pressing the Enter key.
              </span>
            </div>
            <div className="setting-control">
              <Toggle
                id="toggleEnterToSend"
                checked={settings.enterToSend}
                onChange={(val) =>
                  handleSettingChange(
                    "enterToSend",
                    val,
                    "Press Enter to Send"
                  )
                }
                label="Press Enter to Send"
              />
            </div>
          </div>
        </div>

        {/* 6. DATA */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="concept-tag">06 &bull; DATA</span>
            <h2 className="card-subtitle">Data Management</h2>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">
                Clear History ({historyItems.length})
              </span>
              <span className="setting-desc">
                Permanently remove all analyzed articles from your local
                prediction history.
              </span>
            </div>
            <div className="setting-control">
              <button
                type="button"
                className="btn btn-secondary btn-sm text-danger"
                id="settingsClearHistoryBtn"
                onClick={handleClearHistoryConfirm}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">
                Clear Saved Articles ({savedItems.length})
              </span>
              <span className="setting-desc">
                Remove all bookmarked articles from your Saved collection.
              </span>
            </div>
            <div className="setting-control">
              <button
                type="button"
                className="btn btn-secondary btn-sm text-danger"
                id="settingsClearSavedBtn"
                onClick={handleClearSavedConfirm}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Reset All Settings</span>
              <span className="setting-desc">
                Restore all toggles and preferences to their default values.
              </span>
            </div>
            <div className="setting-control">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                id="settingsResetAllBtn"
                onClick={handleResetSettingsConfirm}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

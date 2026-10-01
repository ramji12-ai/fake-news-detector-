import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export const SETTINGS_STORAGE_KEY = "veritext_settings";
export const ALT_SETTINGS_STORAGE_KEY = "veritext-settings";
export const THEME_COLOR_KEY = "veritext-theme";
export const THEME_MODE_KEY = "veritext-mode";
export const LEGACY_THEME_KEY = "veritext_theme";

export const COLOR_THEMES = [
  {
    id: "veritext-blue",
    name: "VeriText Purple",
    description: "Modern SaaS lavender & purple",
    primary: "#635BDA",
    secondary: "#5148C7",
    accent: "#635BDA",
    lightBg: "#F6F7FB",
    darkBg: "#0B0F19"
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Vibrant botanical green",
    primary: "#059669",
    secondary: "#10B981",
    accent: "#14B8A6",
    lightBg: "#F0FDF4",
    darkBg: "#062016"
  },
  {
    id: "purple",
    name: "Purple",
    description: "Deep violet & royal amethyst",
    primary: "#7C3AED",
    secondary: "#8B5CF6",
    accent: "#A855F7",
    lightBg: "#FAF5FF",
    darkBg: "#140A26"
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep azure & sky cyan",
    primary: "#0284C7",
    secondary: "#0EA5E9",
    accent: "#06B6D4",
    lightBg: "#F0F9FF",
    darkBg: "#061826"
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm amber & burnt orange",
    primary: "#EA580C",
    secondary: "#F97316",
    accent: "#F59E0B",
    lightBg: "#FFF7ED",
    darkBg: "#241107"
  },
  {
    id: "rose",
    name: "Rose",
    description: "Crimson & ruby pink",
    primary: "#E11D48",
    secondary: "#F43F5E",
    accent: "#EC4899",
    lightBg: "#FFF1F2",
    darkBg: "#250912"
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep slate & indigo night",
    primary: "#6366F1",
    secondary: "#818CF8",
    accent: "#22D3EE",
    lightBg: "#F8FAFC",
    darkBg: "#0F172A"
  },
  {
    id: "dark-emerald",
    name: "Dark Emerald",
    description: "Deep obsidian & emerald jade",
    primary: "#10B981",
    secondary: "#059669",
    accent: "#34D399",
    lightBg: "#ECFDF5",
    darkBg: "#071A15"
  }
];

export const DEFAULT_SETTINGS = {
  theme: "veritext-blue", // color theme id
  mode: "light", // "light" | "dark" | "system"
  systemTheme: false,
  animations: true,
  compactMode: false,
  predictionNotifications: true,
  aiNotifications: true,
  savedNotifications: true,
  showConfidence: true,
  showModelInfo: true,
  autoSavePredictions: false,
  showSources: true,
  autoScrollChat: true,
  enterToSend: true
};

function loadInitialSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(ALT_SETTINGS_STORAGE_KEY);
    const savedTheme = localStorage.getItem(THEME_COLOR_KEY);
    const savedMode = localStorage.getItem(THEME_MODE_KEY);
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);

    let initial = { ...DEFAULT_SETTINGS, mode: "light" };

    if (raw) {
      const parsed = JSON.parse(raw);
      initial = { ...initial, ...parsed };
    }

    if (savedTheme) {
      initial.theme = savedTheme;
    }
    if (savedMode) {
      initial.mode = savedMode;
      initial.systemTheme = savedMode === "system";
    } else {
      initial.mode = "light";
    }

    return initial;
  } catch (_err) {
    return { ...DEFAULT_SETTINGS };
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadInitialSettings);
  const [osPrefersDark, setOsPrefersDark] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  // Listen to OS color scheme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      setOsPrefersDark(e.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Compute effective mode: "dark" or "light"
  const effectiveMode = settings.systemTheme || settings.mode === "system"
    ? osPrefersDark
      ? "dark"
      : "light"
    : settings.mode === "light"
    ? "light"
    : "dark";

  // Apply attributes to <html> and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Theme color & mode attributes
    root.setAttribute("data-theme-color", settings.theme || "veritext-blue");
    root.setAttribute("data-theme-mode", effectiveMode);
    root.setAttribute("data-theme", effectiveMode); // legacy compatibility
    root.setAttribute("data-density", settings.compactMode ? "compact" : "comfortable");

    if (settings.animations) {
      root.removeAttribute("data-motion");
    } else {
      root.setAttribute("data-motion", "reduced");
    }

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      localStorage.setItem(ALT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      localStorage.setItem(THEME_COLOR_KEY, settings.theme);
      localStorage.setItem(THEME_MODE_KEY, settings.mode);
      localStorage.setItem(LEGACY_THEME_KEY, effectiveMode);
    } catch (_err) {}
  }, [settings, effectiveMode]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "mode") {
        next.systemTheme = value === "system";
      } else if (key === "systemTheme" && value === true) {
        next.mode = "system";
      }
      return next;
    });
  }, []);

  const setThemeColor = useCallback((themeId) => {
    setSettings((prev) => ({ ...prev, theme: themeId }));
  }, []);

  const setThemeMode = useCallback((mode) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      systemTheme: mode === "system"
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextMode = effectiveMode === "dark" ? "light" : "dark";
      return {
        ...prev,
        mode: nextMode,
        systemTheme: false
      };
    });
  }, [effectiveMode]);

  const resetAllSettings = useCallback(() => {
    const fresh = { ...DEFAULT_SETTINGS };
    setSettings(fresh);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fresh));
      localStorage.setItem(ALT_SETTINGS_STORAGE_KEY, JSON.stringify(fresh));
      localStorage.setItem(THEME_COLOR_KEY, fresh.theme);
      localStorage.setItem(THEME_MODE_KEY, fresh.mode);
      localStorage.setItem(LEGACY_THEME_KEY, fresh.mode);
    } catch (_err) {}
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        effectiveTheme: effectiveMode, // backward compatible name
        effectiveMode,
        activeThemeColor: settings.theme || "veritext-blue",
        colorThemes: COLOR_THEMES,
        updateSetting,
        setThemeColor,
        setThemeMode,
        toggleTheme,
        resetAllSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

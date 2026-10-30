import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import {
  apiGetHistory,
  apiAddHistory,
  apiDeleteHistory,
  apiClearHistory,
  apiImportHistoryBatch,
  apiGetSaved,
  apiAddSaved,
  apiDeleteSaved,
  apiClearSaved,
  apiImportSavedBatch
} from "../services/authService";

export const API_BASE_URL = "https://fake-news-detector-g408.onrender.com";

export const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
export const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

export const MODEL_INFO_ENDPOINT = `${API_BASE_URL}/model-info`;
export const NEWS_ENDPOINT = `${API_BASE_URL}/news`;
export const MAX_ARTICLE_CHARS = 10000;

export const STORAGE_KEYS = {
  HISTORY: "veritext_history",
  SAVED: "veritext_saved",
  CHAT: "veritext_chat_messages"
};

export const FAKE_SAMPLES = [
  {
    title:
      "BREAKING: Secret Underground Weather Control Machine Discovered By Whistleblower!",
    text: "Shocking new leaked documents reveal that elites have been operating a massive hidden weather machine beneath the desert to control elections and manipulate global stock markets! Mainstream media refuses to report this explosive truth because they are paid off by secret cabals. Share this immediately before it gets deleted from the internet forever!"
  },
  {
    title:
      "URGENT: Miracle Kitchen Herb Found To Instantly Reverse Aging Overnight, Doctors Furious!",
    text: "An anonymous internet researcher claims a common household spice completely reverses cellular aging in 24 hours, but pharmaceutical companies have secretly banned newspapers from mentioning it! Thousands of viral posts claim you never need medicine again if you drink this secret mixture at midnight."
  }
];

export const REAL_SAMPLES = [
  {
    title:
      "U.S. Senate passes bipartisan infrastructure legislation after months of negotiations",
    text: "WASHINGTON (Reuters) - The U.S. Senate on Tuesday passed a sweeping $1 trillion bipartisan infrastructure bill to rebuild roads, bridges, public transit, and broadband networks across the country. Senators voted 69-30 in favor of the measure after months of negotiations between White House officials and lawmakers from both parties. The legislation now heads to the House of Representatives, where lawmakers are expected to debate further budget provisions in the coming weeks."
  },
  {
    title:
      "Central bank officials signal cautious approach to interest rate adjustments",
    text: "NEW YORK (Reuters) - Federal Reserve policymakers indicated on Wednesday that they will continue monitoring inflation data and labor market conditions before making additional changes to benchmark interest rates. Speaking at an economic symposium, officials noted that recent consumer price index readings showed gradual moderation, while manufacturing output remained stable during the third quarter."
  }
];

export const ALL_SAMPLES = [
  REAL_SAMPLES[0],
  FAKE_SAMPLES[0],
  REAL_SAMPLES[1],
  FAKE_SAMPLES[1]
];

export function formatDateTime(isoString) {
  try {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timePart = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    return `${datePart}, ${timePart}`;
  } catch (_e) {
    return String(isoString || "");
  }
}

export function deriveMeaningfulTitle(title, text) {
  const cleanTitle = (title || "").trim();
  if (cleanTitle) return cleanTitle;
  const cleanBody = (text || "").trim();
  if (!cleanBody) return "Untitled News Article";
  return cleanBody.length > 75 ? `${cleanBody.slice(0, 75).trim()}...` : cleanBody;
}

export function buildAsciiConfidenceBar(confidence) {
  const totalBlocks = 20;
  const clamped = Math.max(0, Math.min(100, Number(confidence) || 0));
  const filled = Math.round((clamped / 100) * totalBlocks);
  return "\u2588".repeat(filled) + "\u2591".repeat(totalBlocks - filled);
}

function createRecordSignature(record) {
  return `${(record.title || "").trim().toLowerCase()}::${(record.text || "")
    .trim()
    .slice(0, 200)
    .toLowerCase()}::${record.prediction}`;
}

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { settings } = useSettings();

  // Backend Health & Model Info State
  const [apiStatus, setApiStatus] = useState({
    online: false,
    checking: true,
    modelLoaded: false,
    chatConfigured: true,
    geminiKeyConfigured: false
  });

  const [modelConfig, setModelConfig] = useState({
    model: "Logistic Regression",
    feature_extraction: "TF-IDF",
    ngrams: "Unigram + Bigram",
    max_features: 30000,
    training_split: "80%",
    testing_split: "20%",
    classes: "FAKE / REAL",
    evaluation_metrics: {
      accuracy: 99.02,
      precision: 98.51,
      recall: 99.69,
      f1_score: 99.1,
      total_samples: 39100,
      train_samples: 31280,
      test_samples: 7820,
      confusion_matrix: [
        [3517, 64],
        [13, 4226]
      ]
    }
  });

  const {
    user,
    token,
    isAuthenticated,
    refreshUser,
    openLoginModal,
    pendingSaveAction,
    setPendingSaveAction
  } = useAuth();

  // History & Saved State: user-isolated (empty for guests; loaded from backend when authenticated)
  const [historyItems, setHistoryItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [hasLocalGuestHistory, setHasLocalGuestHistory] = useState(false);
  const [hasLocalGuestSaved, setHasLocalGuestSaved] = useState(false);

  // Check if unimported legacy guest records exist in localStorage on this device
  useEffect(() => {
    try {
      const h = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (h) {
        const parsed = JSON.parse(h);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalGuestHistory(true);
        }
      }
      const s = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalGuestSaved(true);
        }
      }
    } catch (_e) {}
  }, []);

  // Fetch account history and saved articles when user is authenticated; clear when logged out
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && token) {
      setIsHistoryLoading(true);
      setIsSavedLoading(true);

      apiGetHistory(token)
        .then((items) => {
          if (isMounted) setHistoryItems(Array.isArray(items) ? items : []);
        })
        .catch((_err) => {})
        .finally(() => {
          if (isMounted) setIsHistoryLoading(false);
        });

      apiGetSaved(token)
        .then((items) => {
          if (isMounted) setSavedItems(Array.isArray(items) ? items : []);
        })
        .catch((_err) => {})
        .finally(() => {
          if (isMounted) setIsSavedLoading(false);
        });
    } else {
      if (isMounted) {
        setHistoryItems([]);
        setSavedItems([]);
        setIsHistoryLoading(false);
        setIsSavedLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  // Detector Page State
  const [headline, setHeadline] = useState("");
  const [articleText, setArticleText] = useState("");
  const [currentResult, setCurrentResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState(null);

  // AI News Assistant State
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Modals & Toasts State
  const [activeModalRecord, setActiveModalRecord] = useState(null);
  const [aboutUsModalOpen, setAboutUsModalOpen] = useState(false);
  const [newsDetailArticle, setNewsDetailArticle] = useState(null);
  const [confirmModalState, setConfirmModalState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null
  });
  const [toasts, setToasts] = useState([]);
  const stepTimersRef = useRef([]);

  // Live News Aggregator State
  const [newsArticles, setNewsArticles] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const [newsSourceFilter, setNewsSourceFilter] = useState("All");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("All");

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CHAT,
        JSON.stringify(chatMessages.slice(-30))
      );
    } catch (_e) {}
  }, [chatMessages]);

  // Toast helper respecting notification settings
  const showToast = useCallback(
    (message, type = "info", category = "general") => {
      if (
        category === "prediction" &&
        settings.predictionNotifications === false
      ) {
        return;
      }
      if (category === "ai" && settings.aiNotifications === false) {
        return;
      }
      if (category === "saved" && settings.savedNotifications === false) {
        return;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    [
      settings.predictionNotifications,
      settings.aiNotifications,
      settings.savedNotifications
    ]
  );

  // Check Backend Health
  const checkBackendStatus = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${API_BASE_URL}/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setApiStatus({
        online: true,
        checking: false,
        modelLoaded: Boolean(data.model_loaded),
        chatConfigured: data.chat_configured !== false,
        geminiKeyConfigured: Boolean(data.gemini_key_configured)
      });

      if (data.model_info) {
        setModelConfig((prev) => ({
          ...prev,
          ...data.model_info,
          evaluation_metrics:
            data.model_info.evaluation_metrics || prev.evaluation_metrics
        }));
      }
    } catch (_err) {
      setApiStatus({
        online: false,
        checking: false,
        modelLoaded: false,
        chatConfigured: false,
        geminiKeyConfigured: false
      });
    }
  }, []);

  useEffect(() => {
    checkBackendStatus();
  }, [checkBackendStatus]);

  // Saved / History helpers
  const isRecordSaved = useCallback(
    (record) => {
      if (!record) return false;
      const sig = createRecordSignature(record);
      return savedItems.some(
        (item) => item.id === record.id || createRecordSignature(item) === sig
      );
    },
    [savedItems]
  );

  const addPredictionToHistory = useCallback(
    async (record) => {
      if (!record || !isAuthenticated || !token) return;
      try {
        const saved = await apiAddHistory(record, token);
        if (saved) {
          setHistoryItems((prev) => {
            if (prev.some((h) => h.id === saved.id)) return prev;
            return [saved, ...prev].slice(0, 300);
          });
          refreshUser();
        }
      } catch (_err) {}
    },
    [isAuthenticated, token, refreshUser]
  );

  // Helper to persist analysis to authenticated account (saved_articles + prediction_history)
  const performSaveAnalysis = useCallback(
    async (record, authToken) => {
      if (!record || !authToken) return;

      const payload = {
        id: record.id || Date.now(),
        title: record.title || deriveMeaningfulTitle(record.title, record.text),
        text: record.text || "",
        source: "VeriText Detector",
        prediction: record.prediction,
        confidence: record.confidence,
        model: record.model || "Logistic Regression",
        timestamp: record.timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString()
      };

      try {
        const savedRes = await apiAddSaved(payload, authToken);
        const savedItem = savedRes.article || savedRes || payload;

        setSavedItems((prev) => {
          if (
            prev.some(
              (item) => item.id === savedItem.id || item.title === savedItem.title
            )
          ) {
            return prev;
          }
          return [savedItem, ...prev];
        });

        // Also add to prediction history in account
        try {
          const histRes = await apiAddHistory(
            {
              title: payload.title,
              text: payload.text,
              prediction: payload.prediction,
              confidence: payload.confidence,
              model: payload.model,
              timestamp: payload.timestamp
            },
            authToken
          );
          if (histRes) {
            setHistoryItems((prev) => {
              if (prev.some((h) => h.id === histRes.id)) return prev;
              return [histRes, ...prev].slice(0, 300);
            });
          }
        } catch (_hErr) {}

        showToast("✓ Analysis saved to your account", "success", "saved");
        refreshUser();
      } catch (err) {
        showToast("Unable to save analysis right now. Please try again.", "error", "saved");
      }
    },
    [showToast, refreshUser]
  );

  // Helper to persist news article to authenticated account
  const performSaveArticle = useCallback(
    async (article, authToken) => {
      if (!article || !authToken) return;

      const payload = {
        title: article.title || "Untitled Article",
        text: article.description || article.summary || article.text || "",
        source: article.source || "VeriText",
        url: article.url || "",
        image: article.image || "",
        prediction: article.prediction || null,
        confidence: article.confidence !== undefined ? article.confidence : null,
        savedAt: new Date().toISOString()
      };

      try {
        const res = await apiAddSaved(payload, authToken);
        const savedItem = res.article || res || payload;

        setSavedItems((prev) => {
          if (
            prev.some(
              (item) =>
                item.id === savedItem.id ||
                item.title === savedItem.title ||
                (item.url && item.url === savedItem.url)
            )
          ) {
            return prev;
          }
          return [savedItem, ...prev];
        });

        showToast("✓ Article saved to your collection", "success", "saved");
        refreshUser();
      } catch (err) {
        showToast("Unable to save article right now. Please try again.", "error", "saved");
      }
    },
    [showToast, refreshUser]
  );

  // Automatically execute pending save action when user logs in or creates an account
  useEffect(() => {
    if (isAuthenticated && token && pendingSaveAction) {
      const pending = pendingSaveAction;
      setPendingSaveAction(null); // Clear immediately to prevent duplicate triggers

      if (pending.action === "save-analysis") {
        performSaveAnalysis(pending.data, token);
      } else if (pending.action === "save-article") {
        performSaveArticle(pending.data, token);
      }
    }
  }, [
    isAuthenticated,
    token,
    pendingSaveAction,
    setPendingSaveAction,
    performSaveAnalysis,
    performSaveArticle
  ]);

  const savePredictionRecord = useCallback(
    (record) => {
      if (!record) return;

      if (isRecordSaved(record)) {
        showToast("✓ This analysis is already saved", "info", "saved");
        return;
      }

      // If guest user clicks Save Analysis -> open sign-in popup with pending action
      if (!isAuthenticated || !token) {
        openLoginModal({
          mode: "login",
          reason: "save-analysis",
          customTitle: "Sign in to save your analysis",
          customDesc:
            "Your prediction history is saved to your account so you can access it later.",
          pendingAction: {
            action: "save-analysis",
            data: record
          }
        });
        return;
      }

      // If signed in -> save immediately
      performSaveAnalysis(record, token);
    },
    [
      isAuthenticated,
      token,
      isRecordSaved,
      openLoginModal,
      showToast,
      performSaveAnalysis
    ]
  );

  const saveNewsArticle = useCallback(
    async (article) => {
      if (!article) return;

      const existing = savedItems.find(
        (item) =>
          item.title === article.title ||
          (item.url && item.url === article.url)
      );

      // If guest user clicks Save Article -> open sign-in popup with pending action
      if (!isAuthenticated || !token) {
        openLoginModal({
          mode: "login",
          reason: "save-article",
          customTitle: "Sign in to save this article",
          customDesc:
            "Sign in to save this article to your personal saved articles collection.",
          pendingAction: {
            action: "save-article",
            data: article
          }
        });
        return;
      }

      // If already saved and clicked again by authenticated user, toggle removal
      if (existing) {
        try {
          await apiDeleteSaved(existing.id, token);
          setSavedItems((prev) => prev.filter((i) => i.id !== existing.id));
          showToast("✓ Removed from Saved Articles", "info", "saved");
          refreshUser();
        } catch (_err) {
          showToast("Unable to remove saved article", "error", "saved");
        }
        return;
      }

      // Save article immediately for authenticated user
      performSaveArticle(article, token);
    },
    [
      isAuthenticated,
      token,
      savedItems,
      openLoginModal,
      showToast,
      refreshUser,
      performSaveArticle
    ]
  );

  const removeSavedRecordById = useCallback(
    async (id) => {
      if (isAuthenticated && token) {
        try {
          await apiDeleteSaved(id, token);
          refreshUser();
        } catch (_e) {}
      }
      setSavedItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(next));
        } catch (_e) {}
        return next;
      });
      showToast("✓ Removed from Saved Articles", "info", "saved");
    },
    [isAuthenticated, token, refreshUser, showToast]
  );

  const deleteHistoryRecordById = useCallback(
    async (id) => {
      if (isAuthenticated && token) {
        try {
          await apiDeleteHistory(id, token);
          refreshUser();
        } catch (_e) {}
      }
      setHistoryItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
        } catch (_e) {}
        return next;
      });
      showToast("✓ Deleted from prediction history", "info", "prediction");
    },
    [isAuthenticated, token, refreshUser, showToast]
  );

  const clearAllHistory = useCallback(
    async () => {
      if (isAuthenticated && token) {
        try {
          await apiClearHistory(token);
          refreshUser();
        } catch (_e) {}
      }
      setHistoryItems([]);
      try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
      } catch (_e) {}
      showToast("✓ Prediction history cleared", "info", "prediction");
    },
    [isAuthenticated, token, refreshUser, showToast]
  );

  const clearAllSaved = useCallback(
    async () => {
      if (isAuthenticated && token) {
        try {
          await apiClearSaved(token);
          refreshUser();
        } catch (_e) {}
      }
      setSavedItems([]);
      try {
        localStorage.removeItem(STORAGE_KEYS.SAVED);
      } catch (_e) {}
      showToast("✓ Saved articles cleared", "info", "saved");
    },
    [isAuthenticated, token, refreshUser, showToast]
  );

  // Local Guest Data Migration Helpers
  const importLocalHistory = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const records = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(records) || records.length === 0) return;
      await apiImportHistoryBatch(records, token);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      setHasLocalGuestHistory(false);
      const updated = await apiGetHistory(token);
      setHistoryItems(updated);
      refreshUser();
      showToast(`✓ Imported ${records.length} analyses to your account`, "success", "prediction");
    } catch (_err) {
      showToast("Failed to import local analyses", "error");
    }
  }, [isAuthenticated, token, refreshUser, showToast]);

  const importLocalSaved = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED);
      const articles = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(articles) || articles.length === 0) return;
      await apiImportSavedBatch(articles, token);
      localStorage.removeItem(STORAGE_KEYS.SAVED);
      setHasLocalGuestSaved(false);
      const updated = await apiGetSaved(token);
      setSavedItems(updated);
      refreshUser();
      showToast(`✓ Imported ${articles.length} saved articles to your account`, "success", "saved");
    } catch (_err) {
      showToast("Failed to import saved articles", "error");
    }
  }, [isAuthenticated, token, refreshUser, showToast]);

  // Run Fake News Detection via POST /predict
  const analyzeArticle = useCallback(
    async (customTitle, customText) => {
      const titleToUse =
        typeof customTitle === "string" ? customTitle.trim() : headline.trim();
      const textToUse =
        typeof customText === "string"
          ? customText.trim()
          : articleText.trim();

      setAnalysisError(null);

      if (!titleToUse && !textToUse) {
        const msg =
          "Empty input: Please enter an article title and/or article text before clicking Analyze News.";
        setAnalysisError({ message: msg, canRetry: false });
        showToast("\u26A0 Please enter article text to analyze", "warning", "prediction");
        return null;
      }

      if (textToUse.length > MAX_ARTICLE_CHARS) {
        const msg = `Article text is too long (${textToUse.length.toLocaleString()} characters). Maximum allowed is ${MAX_ARTICLE_CHARS.toLocaleString()} characters.`;
        setAnalysisError({ message: msg, canRetry: false });
        showToast("\u26A0 Exceeds 5,000 character limit", "warning", "prediction");
        return null;
      }

      const combinedText = `${titleToUse} ${textToUse}`.trim();
      const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
      if (wordCount < 3 || combinedText.length < 12) {
        const msg =
          "Too-short article: Please provide at least a complete headline or several sentences of article text (minimum 3 words) for reliable NLP classification.";
        setAnalysisError({ message: msg, canRetry: false });
        showToast("\u26A0 Article text is too short", "warning", "prediction");
        return null;
      }

      // Start step-by-step progress UI
      stepTimersRef.current.forEach(clearTimeout);
      stepTimersRef.current = [];
      setIsAnalyzing(true);
      setAnalysisStep(1);
      stepTimersRef.current.push(setTimeout(() => setAnalysisStep(2), 110));
      stepTimersRef.current.push(setTimeout(() => setAnalysisStep(3), 240));
      stepTimersRef.current.push(setTimeout(() => setAnalysisStep(4), 380));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(PREDICT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ title: titleToUse, text: textToUse }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const errMsg =
            (payload && payload.error) || `Server returned HTTP ${response.status}.`;
          setAnalysisError({ message: errMsg, canRetry: response.status >= 500 });
          showToast("\u274C API error during prediction", "error", "prediction");
          setAnalysisStep(0);
          await checkBackendStatus();
          return null;
        }

        if (
          !payload ||
          typeof payload.prediction === "undefined" ||
          typeof payload.confidence === "undefined"
        ) {
          setAnalysisError({
            message: "Received an unexpected response format from the prediction API.",
            canRetry: true
          });
          setAnalysisStep(0);
          return null;
        }

        setAnalysisStep(5);
        setTimeout(() => setAnalysisStep(0), 500);

        const record = {
          id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: titleToUse || deriveMeaningfulTitle(titleToUse, textToUse),
          text: textToUse,
          prediction:
            String(payload.prediction).toUpperCase() === "REAL" ? "REAL" : "FAKE",
          confidence: Number(payload.confidence),
          model: modelConfig.model || "Logistic Regression",
          featureExtraction: modelConfig.feature_extraction || "TF-IDF",
          ngrams: modelConfig.ngrams || "Unigram + Bigram",
          timestamp: new Date().toISOString()
        };

        setCurrentResult(record);

        // Respect Auto Save Predictions setting (saves to History automatically when ON)
        if (settings.autoSavePredictions) {
          addPredictionToHistory(record);
        }

        showToast(
          `\u2713 Classified as ${record.prediction} (${record.confidence.toFixed(2)}%)`,
          "success",
          "prediction"
        );
        await checkBackendStatus();
        return record;
      } catch (err) {
        clearTimeout(timeoutId);
        setAnalysisStep(0);
        const msg =
          err && err.name === "AbortError"
            ? "Request timed out while waiting for the prediction API."
            : "Unable to connect to the prediction API. Please ensure `python backend/app.py` is running.";
        setAnalysisError({ message: msg, canRetry: true });
        showToast("\u274C API connection error", "error", "prediction");
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      headline,
      articleText,
      modelConfig,
      settings.autoSavePredictions,
      addPredictionToHistory,
      showToast,
      checkBackendStatus
    ]
  );

  // Copy & Export helpers
  const copyPredictionSummary = useCallback(
    async (record) => {
      if (!record) return;
      const summary = [
        "VeriText NLP - Fake News Detection",
        "",
        `Article: ${record.title || "Untitled"}`,
        `Prediction: ${record.prediction}`,
        `Confidence: ${Number(record.confidence).toFixed(2)}%`,
        `Model: ${record.model || "Logistic Regression"}`,
        `Feature Extraction: ${record.featureExtraction || "TF-IDF"}`,
        `N-Grams: ${record.ngrams || "Unigram + Bigram"}`
      ].join("\n");

      try {
        await navigator.clipboard.writeText(summary);
        showToast("\u2713 Result copied to clipboard", "success", "prediction");
      } catch (_e) {
        const temp = document.createElement("textarea");
        temp.value = summary;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        showToast("\u2713 Result copied to clipboard", "success", "prediction");
      }
    },
    [showToast]
  );

  const exportPredictionReport = useCallback(
    (record) => {
      if (!record) return;
      const reportLines = [
        "====================================================================",
        "  VeriText NLP - Fake News Detection System (Classification Report)",
        "====================================================================",
        "",
        `Date / Time        : ${formatDateTime(record.timestamp)}`,
        `Prediction Verdict : ${record.prediction}`,
        `Confidence Score   : ${Number(record.confidence).toFixed(2)}%`,
        `Classifier Model   : ${record.model || "Logistic Regression"}`,
        `Feature Extraction : ${record.featureExtraction || "TF-IDF"} (${
          record.ngrams || "Unigram + Bigram"
        })`,
        "",
        "--------------------------------------------------------------------",
        "ARTICLE TITLE",
        "--------------------------------------------------------------------",
        record.title || "(No title provided)",
        "",
        "--------------------------------------------------------------------",
        "ARTICLE TEXT",
        "--------------------------------------------------------------------",
        record.text || "(No article body provided)",
        "",
        "--------------------------------------------------------------------",
        "DISCLAIMER",
        "--------------------------------------------------------------------",
        "Prediction is generated by a machine-learning model and should not",
        "be treated as definitive fact verification.",
        "===================================================================="
      ].join("\n");

      const blob = new Blob([reportLines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTime = new Date(record.timestamp)
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      link.href = url;
      link.download = `VeriText-NLP-Report-${record.prediction}-${safeTime}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("\u2713 Report exported", "success", "prediction");
    },
    [showToast]
  );

  // AI News Assistant: Send message or regenerate
  const sendChatMessage = useCallback(
    async (rawMessage, options = { isRegenerate: false }) => {
      const cleanMsg = String(rawMessage || "").trim();
      if (!cleanMsg) {
        setChatError("Please enter a news question or click a suggested topic.");
        return;
      }
      if (isChatLoading) return;

      setChatError(null);

      const userMsgObj = {
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: cleanMsg,
        timestamp: new Date().toISOString()
      };

      let historyForApi = [];
      setChatMessages((prev) => {
        const base = options.isRegenerate ? prev : [...prev, userMsgObj];
        historyForApi = base.slice(-8).map((m) => ({
          role: m.role,
          content: m.content
        }));
        return base;
      });

      setIsChatLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            message: cleanMsg,
            history: historyForApi.slice(0, -1)
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) {
          const errMsg =
            (payload && payload.error) ||
            `AI News Assistant returned HTTP ${response.status}.`;
          setChatError(errMsg);
          showToast("\u26A0 AI News Assistant error", "warning", "ai");
          return;
        }

        const aiMsgObj = {
          id: `msg-ai-${Date.now()}`,
          role: "assistant",
          prompt: cleanMsg,
          content: String(payload.answer || ""),
          sources: Array.isArray(payload.sources) ? payload.sources : [],
          searchQueries: Array.isArray(payload.search_queries)
            ? payload.search_queries
            : [],
          searchUsed: payload.search_used !== false,
          temporalContext: payload.temporal_context || "Web-Grounded Search",
          modelUsed: payload.model_used || "Google Search Grounded",
          timestamp: new Date().toISOString()
        };

        setChatMessages((prev) => [...prev, aiMsgObj]);
        showToast("\u2713 News summary retrieved", "success", "ai");
        await checkBackendStatus();
      } catch (err) {
        clearTimeout(timeoutId);
        const msg =
          err && err.name === "AbortError"
            ? "Web search request timed out. Please try a more specific news query."
            : "Unable to reach the AI News Assistant API (/chat). Make sure `python backend/app.py` is running.";
        setChatError(msg);
        showToast("\u274C AI News Assistant connection error", "error", "ai");
      } finally {
        setIsChatLoading(false);
      }
    },
    [isChatLoading, showToast, checkBackendStatus]
  );

  const regenerateChatResponse = useCallback(
    async (assistantMessageId) => {
      if (isChatLoading) return;
      const targetMsg = chatMessages.find((m) => m.id === assistantMessageId);
      if (!targetMsg || !targetMsg.prompt) return;

      // Remove the target assistant message and re-run its prompt
      setChatMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      await sendChatMessage(targetMsg.prompt, { isRegenerate: true });
    },
    [chatMessages, isChatLoading, sendChatMessage]
  );

  const clearChatConversation = useCallback(() => {
    setChatMessages([]);
    setChatError(null);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    showToast("\u2713 Conversation cleared", "info", "ai");
  }, [showToast]);

  // Modal helpers
  const openArticleModal = useCallback((record) => {
    setActiveModalRecord(record);
  }, []);

  const closeArticleModal = useCallback(() => {
    setActiveModalRecord(null);
  }, []);

  const openConfirmModal = useCallback((title, message, onConfirm) => {
    setConfirmModalState({
      open: true,
      title,
      message,
      onConfirm
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalState({
      open: false,
      title: "",
      message: "",
      onConfirm: null
    });
  }, []);

  // Live News Aggregator: fetch articles from /news
  const fetchNews = useCallback(async (source = "", category = "", forceRefresh = false) => {
    setIsNewsLoading(true);
    setNewsError(null);
    try {
      const params = new URLSearchParams();
      if (source && source !== "All") params.append("source", source);
      if (category && category !== "All") params.append("category", category);
      if (forceRefresh) params.append("refresh", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${NEWS_ENDPOINT}${queryStr}`);
      const data = await res.json();
      if (res.ok && data.articles) {
        setNewsArticles(data.articles);
      } else {
        setNewsError(data.error || "Unable to load news feed at this time.");
      }
    } catch (_err) {
      setNewsError("Unable to reach news server. Please verify backend server is active.");
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Analyze an article directly from news cards
  const analyzeNewsArticle = useCallback(
    async (article) => {
      if (!article) return null;
      const t = (article.title || "").trim();
      const b = (article.description || "").trim();
      setHeadline(t);
      setArticleText(b);
      return await analyzeArticle(t, b);
    },
    [analyzeArticle]
  );

  return (
    <AppDataContext.Provider
      value={{
        apiStatus,
        modelConfig,
        checkBackendStatus,
        historyItems,
        savedItems,
        isHistoryLoading,
        isSavedLoading,
        hasLocalGuestHistory,
        hasLocalGuestSaved,
        isRecordSaved,
        addPredictionToHistory,
        savePredictionRecord,
        saveNewsArticle,
        removeSavedRecordById,
        deleteHistoryRecordById,
        clearAllHistory,
        clearAllSaved,
        importLocalHistory,
        importLocalSaved,
        headline,
        setHeadline,
        articleText,
        setArticleText,
        currentResult,
        setCurrentResult,
        isAnalyzing,
        analysisStep,
        analysisError,
        setAnalysisError,
        analyzeArticle,
        analyzeNewsArticle,
        copyPredictionSummary,
        exportPredictionReport,
        chatMessages,
        isChatLoading,
        chatError,
        setChatError,
        sendChatMessage,
        regenerateChatResponse,
        clearChatConversation,
        activeModalRecord,
        openArticleModal,
        closeArticleModal,
        aboutUsModalOpen,
        setAboutUsModalOpen,
        newsDetailArticle,
        setNewsDetailArticle,
        confirmModalState,
        openConfirmModal,
        closeConfirmModal,
        toasts,
        showToast,
        newsArticles,
        isNewsLoading,
        newsError,
        newsSourceFilter,
        setNewsSourceFilter,
        newsCategoryFilter,
        setNewsCategoryFilter,
        fetchNews
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}

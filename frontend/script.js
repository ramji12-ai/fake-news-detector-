/**
 * VeriText NLP - Fake News Detection System
 * Complete Frontend Application Logic (Vanilla JavaScript)
 *
 * Connects to existing Flask Backend API at http://127.0.0.1:5000
 */

const API_BASE_URL = "https://fake-news-detector-g408.onrender.com";
const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;
const MAX_ARTICLE_CHARS = 5000;
const REQUEST_TIMEOUT_MS = 15000;
const CHAT_TIMEOUT_MS = 40000;

// LocalStorage Keys
const STORAGE_KEYS = {
    THEME: "veritext_theme",
    PREFS: "veritext_preferences",
    HISTORY: "veritext_history",
    SAVED: "veritext_saved"
};

// Demo Sample Articles (Predictions are NEVER hardcoded; always evaluated live by Flask API)
const FAKE_SAMPLES = [
    {
        title: "BREAKING: Secret Underground Weather Control Machine Discovered By Whistleblower!",
        text: "Shocking new leaked documents reveal that elites have been operating a massive hidden weather machine beneath the desert to control elections and manipulate global stock markets! Mainstream media refuses to report this explosive truth because they are paid off by secret cabals. Share this immediately before it gets deleted from the internet forever!"
    },
    {
        title: "URGENT: Miracle Kitchen Herb Found To Instantly Reverse Aging Overnight, Doctors Furious!",
        text: "An anonymous internet researcher claims a common household spice completely reverses cellular aging in 24 hours, but pharmaceutical companies have secretly banned newspapers from mentioning it! Thousands of viral posts claim you never need medicine again if you drink this secret mixture at midnight."
    }
];

const REAL_SAMPLES = [
    {
        title: "U.S. Senate passes bipartisan infrastructure legislation after months of negotiations",
        text: "WASHINGTON (Reuters) - The U.S. Senate on Tuesday passed a sweeping $1 trillion bipartisan infrastructure bill to rebuild roads, bridges, public transit, and broadband networks across the country. Senators voted 69-30 in favor of the measure after months of negotiations between White House officials and lawmakers from both parties. The legislation now heads to the House of Representatives, where lawmakers are expected to debate further budget provisions in the coming weeks."
    },
    {
        title: "Central bank officials signal cautious approach to interest rate adjustments",
        text: "NEW YORK (Reuters) - Federal Reserve policymakers indicated on Wednesday that they will continue monitoring inflation data and labor market conditions before making additional changes to benchmark interest rates. Speaking at an economic symposium, officials noted that recent consumer price index readings showed gradual moderation, while manufacturing output remained stable during the third quarter."
    }
];

const ALL_SAMPLES = [REAL_SAMPLES[0], FAKE_SAMPLES[0], REAL_SAMPLES[1], FAKE_SAMPLES[1]];

// Interactive Model Pipeline Stage Descriptions
const PIPELINE_STAGE_INFO = {
    "1": {
        badge: "STAGE 01 \u2022 INPUT MERGING",
        title: "Article Text (Title + Body Combination)",
        desc: "Combines the headline and article body via <code>combine_title_and_text(title, text)</code> so both headline framing and body context are evaluated together."
    },
    "2": {
        badge: "STAGE 02 \u2022 TEXT NORMALIZATION",
        title: "Preprocessing (clean_text Pipeline)",
        desc: "Lowercases text, removes URLs (<code>http/https/www</code>), strips HTML tags, filters non-alphabetic characters (<code>[^a-z\\s]</code>), and collapses extra spaces."
    },
    "3": {
        badge: "STAGE 03 \u2022 FEATURE EXTRACTION",
        title: "TF-IDF Vectorization",
        desc: "Converts cleaned text into numerical features using <code>TfidfVectorizer(max_features=30000, ngram_range=(1,2), min_df=2, sublinear_tf=True, stop_words='english')</code>."
    },
    "4": {
        badge: "STAGE 04 \u2022 LINEAR CLASSIFIER",
        title: "Logistic Regression",
        desc: "Calculates class log-odds and calibrated probabilities via <code>LogisticRegression(max_iter=2000).predict_proba()</code> over the 30,000-feature TF-IDF vector."
    },
    "5": {
        badge: "STAGE 05 \u2022 VERDICT OUTPUT",
        title: "Prediction & Confidence",
        desc: "Returns binary classification (<code>FAKE</code> or <code>REAL</code>) along with the exact probability confidence percentage."
    }
};

// Application State
let fakeSampleIndex = 0;
let realSampleIndex = 0;
let allSampleIndex = 0;

let currentModelConfig = {
    model: "Logistic Regression",
    feature_extraction: "TF-IDF",
    ngrams: "Unigram + Bigram",
    training_split: "80%",
    testing_split: "20%",
    classes: "Fake / Real"
};

let currentPredictionRecord = null;
let historyItems = [];
let savedItems = [];
let historyFilter = "ALL";
let historySort = "newest";
let historySearchQuery = "";
let pendingConfirmAction = null;
let activeModalRecord = null;
let stepTimerIds = [];
let chatHistory = [];
let isChatLoading = false;

// ============================================================================
// DOM Elements
// ============================================================================

// Navbar & Theme
const mainNavLinks = document.getElementById("mainNavLinks");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleLabel = document.getElementById("themeToggleLabel");
const navHistoryCount = document.getElementById("navHistoryCount");
const navSavedCount = document.getElementById("navSavedCount");

// API Status & Popover
const apiStatusWrapper = document.getElementById("apiStatusWrapper");
const apiStatusBadge = document.getElementById("apiStatusBadge");
const apiStatusDot = document.getElementById("apiStatusDot");
const apiStatusText = document.getElementById("apiStatusText");
const apiStatusPopover = document.getElementById("apiStatusPopover");
const refreshStatusBtn = document.getElementById("refreshStatusBtn");
const diagApiStatus = document.getElementById("diagApiStatus");
const diagModelStatus = document.getElementById("diagModelStatus");
const diagPredictionApi = document.getElementById("diagPredictionApi");
const diagChatStatus = document.getElementById("diagChatStatus");
const diagSystemStatus = document.getElementById("diagSystemStatus");

// AI News Assistant DOM Elements
const assistantStatusDot = document.getElementById("assistantStatusDot");
const assistantStatusLabel = document.getElementById("assistantStatusLabel");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatSuggestedPrompts = document.getElementById("chatSuggestedPrompts");
const chatMessagesContainer = document.getElementById("chatMessagesContainer");
const chatWelcomeMessage = document.getElementById("chatWelcomeMessage");
const chatLoadingIndicator = document.getElementById("chatLoadingIndicator");
const chatLoadingText = document.getElementById("chatLoadingText");
const chatErrorBanner = document.getElementById("chatErrorBanner");
const chatErrorText = document.getElementById("chatErrorText");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatSendBtnText = document.getElementById("chatSendBtnText");

// Detector Form & Controls
const analyzeForm = document.getElementById("analyzeForm");
const headlineInput = document.getElementById("headlineInput");
const articleInput = document.getElementById("articleInput");
const charCounter = document.getElementById("charCounter");
const pasteClipboardBtn = document.getElementById("pasteClipboardBtn");
const clearBtn = document.getElementById("clearBtn");
const clearMainBtn = document.getElementById("clearMainBtn");
const sampleFakeBtn = document.getElementById("sampleFakeBtn");
const sampleRealBtn = document.getElementById("sampleRealBtn");
const exampleBtn = document.getElementById("exampleBtn");
const exampleBtnLabel = document.getElementById("exampleBtnLabel");
const analyzeBtn = document.getElementById("analyzeBtn");
const analyzeBtnText = document.getElementById("analyzeBtnText");
const loadingSpinner = document.getElementById("loadingSpinner");

const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const retryAnalyzeBtn = document.getElementById("retryAnalyzeBtn");

const analysisProgressBox = document.getElementById("analysisProgressBox");

// Prediction Result Card
const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultContent = document.getElementById("resultContent");
const resultTimestamp = document.getElementById("resultTimestamp");
const predictionPanel = document.getElementById("predictionPanel");
const predictionStatusIcon = document.getElementById("predictionStatusIcon");
const predictionValue = document.getElementById("predictionValue");
const predictionSublabel = document.getElementById("predictionSublabel");
const confidenceValue = document.getElementById("confidenceValue");
const confidenceAsciiBar = document.getElementById("confidenceAsciiBar");
const confidenceBarFill = document.getElementById("confidenceBarFill");
const confidenceProgressTrack = document.getElementById("confidenceProgressTrack");
const resultMetaModel = document.getElementById("resultMetaModel");
const resultMetaFeature = document.getElementById("resultMetaFeature");
const resultMetaNgrams = document.getElementById("resultMetaNgrams");
const saveResultBtn = document.getElementById("saveResultBtn");
const saveResultBtnLabel = document.getElementById("saveResultBtnLabel");
const copyResultBtn = document.getElementById("copyResultBtn");
const exportResultBtn = document.getElementById("exportResultBtn");

// History Section
const historySearchInput = document.getElementById("historySearchInput");
const historySortSelect = document.getElementById("historySortSelect");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyEmptyState = document.getElementById("historyEmptyState");
const historyEmptyTitle = document.getElementById("historyEmptyTitle");
const historyEmptyDesc = document.getElementById("historyEmptyDesc");
const historyList = document.getElementById("historyList");

// Saved Section
const clearSavedBtn = document.getElementById("clearSavedBtn");
const savedEmptyState = document.getElementById("savedEmptyState");
const savedList = document.getElementById("savedList");

// Analytics Section
const analyticsEmptyState = document.getElementById("analyticsEmptyState");
const analyticsContent = document.getElementById("analyticsContent");
const statTotalCount = document.getElementById("statTotalCount");
const statFakeCount = document.getElementById("statFakeCount");
const statFakeSub = document.getElementById("statFakeSub");
const statRealCount = document.getElementById("statRealCount");
const statRealSub = document.getElementById("statRealSub");
const statAvgConfidence = document.getElementById("statAvgConfidence");
const distSegmentFake = document.getElementById("distSegmentFake");
const distSegmentReal = document.getElementById("distSegmentReal");
const legendFakeDetail = document.getElementById("legendFakeDetail");
const legendRealDetail = document.getElementById("legendRealDetail");
const confidenceBucketsChart = document.getElementById("confidenceBucketsChart");
const recentTimelineChart = document.getElementById("recentTimelineChart");

// Interactive Pipeline & Model Specs
const inspectorStepBadge = document.getElementById("inspectorStepBadge");
const inspectorStepTitle = document.getElementById("inspectorStepTitle");
const inspectorStepDesc = document.getElementById("inspectorStepDesc");

const specModel = document.getElementById("specModel");
const specFeature = document.getElementById("specFeature");
const specNgrams = document.getElementById("specNgrams");
const specTrainSplit = document.getElementById("specTrainSplit");
const specTestSplit = document.getElementById("specTestSplit");
const specClasses = document.getElementById("specClasses");

const realMetricsBanner = document.getElementById("realMetricsBanner");
const metricsSampleInfo = document.getElementById("metricsSampleInfo");
const metricAccuracy = document.getElementById("metricAccuracy");
const metricPrecision = document.getElementById("metricPrecision");
const metricRecall = document.getElementById("metricRecall");
const metricF1 = document.getElementById("metricF1");

// Settings Controls
const setThemeDarkBtn = document.getElementById("setThemeDarkBtn");
const setThemeLightBtn = document.getElementById("setThemeLightBtn");
const toggleAnimationsBtn = document.getElementById("toggleAnimationsBtn");
const densityComfortableBtn = document.getElementById("densityComfortableBtn");
const densityCompactBtn = document.getElementById("densityCompactBtn");
const settingsClearHistoryBtn = document.getElementById("settingsClearHistoryBtn");
const settingsClearSavedBtn = document.getElementById("settingsClearSavedBtn");
const settingsClearAllDataBtn = document.getElementById("settingsClearAllDataBtn");

// Modals & Toasts
const articleModal = document.getElementById("articleModal");
const modalTimestamp = document.getElementById("modalTimestamp");
const modalArticleTitle = document.getElementById("modalArticleTitle");
const modalPredictionBadge = document.getElementById("modalPredictionBadge");
const modalConfidencePill = document.getElementById("modalConfidencePill");
const modalModelPill = document.getElementById("modalModelPill");
const modalArticleText = document.getElementById("modalArticleText");
const closeArticleModalBtn = document.getElementById("closeArticleModalBtn");
const modalCloseFooterBtn = document.getElementById("modalCloseFooterBtn");
const modalLoadInDetectorBtn = document.getElementById("modalLoadInDetectorBtn");
const modalCopyBtn = document.getElementById("modalCopyBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const acceptConfirmBtn = document.getElementById("acceptConfirmBtn");

const toastContainer = document.getElementById("toastContainer");

// ============================================================================
// Utility Functions & Toast Notification System
// ============================================================================

function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.2s ease";
        setTimeout(() => toast.remove(), 220);
    }, 3000);
}

function formatDateTime(isoString) {
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
        return isoString;
    }
}

function buildAsciiConfidenceBar(confidence) {
    const totalBlocks = 20;
    const clamped = Math.max(0, Math.min(100, Number(confidence) || 0));
    const filled = Math.round((clamped / 100) * totalBlocks);
    return "\u2588".repeat(filled) + "\u2591".repeat(totalBlocks - filled);
}

function deriveMeaningfulTitle(title, text) {
    const cleanTitle = (title || "").trim();
    if (cleanTitle) return cleanTitle;
    const cleanBody = (text || "").trim();
    if (!cleanBody) return "Untitled News Article";
    return cleanBody.length > 75 ? `${cleanBody.slice(0, 75).trim()}...` : cleanBody;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
}

// ============================================================================
// Theme & Preferences System (localStorage)
// ============================================================================

function loadThemeAndPreferences() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    applyTheme(savedTheme, false);

    let prefs = { animations: true, density: "comfortable" };
    try {
        const rawPrefs = localStorage.getItem(STORAGE_KEYS.PREFS);
        if (rawPrefs) {
            prefs = { ...prefs, ...JSON.parse(rawPrefs) };
        }
    } catch (_e) {
        // Ignore malformed storage
    }
    applyPreferences(prefs, false);
}

function applyTheme(theme, notify = true) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem(STORAGE_KEYS.THEME, normalized);

    if (normalized === "light") {
        themeToggleIcon.textContent = "☀️";
        themeToggleLabel.textContent = "Light";
        setThemeLightBtn.classList.add("active");
        setThemeDarkBtn.classList.remove("active");
    } else {
        themeToggleIcon.textContent = "🌙";
        themeToggleLabel.textContent = "Dark";
        setThemeDarkBtn.classList.add("active");
        setThemeLightBtn.classList.remove("active");
    }

    if (notify) {
        showToast(`\u2713 Theme changed to ${normalized === "light" ? "Light" : "Dark"} mode`, "success");
    }
}

function getPreferences() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
        if (raw) return JSON.parse(raw);
    } catch (_e) {}
    return { animations: true, density: "comfortable" };
}

function applyPreferences(prefs, save = true) {
    const animationsEnabled = prefs.animations !== false;
    const density = prefs.density === "compact" ? "compact" : "comfortable";

    if (animationsEnabled) {
        document.documentElement.removeAttribute("data-motion");
        toggleAnimationsBtn.textContent = "Enabled";
        toggleAnimationsBtn.setAttribute("aria-pressed", "true");
    } else {
        document.documentElement.setAttribute("data-motion", "reduced");
        toggleAnimationsBtn.textContent = "Reduced";
        toggleAnimationsBtn.setAttribute("aria-pressed", "false");
    }

    document.documentElement.setAttribute("data-density", density);
    if (density === "compact") {
        densityCompactBtn.classList.add("active");
        densityComfortableBtn.classList.remove("active");
    } else {
        densityComfortableBtn.classList.add("active");
        densityCompactBtn.classList.remove("active");
    }

    if (save) {
        localStorage.setItem(
            STORAGE_KEYS.PREFS,
            JSON.stringify({ animations: animationsEnabled, density })
        );
    }
}

// ============================================================================
// LocalStorage Data Management (History & Saved Predictions)
// ============================================================================

function loadStoredRecords() {
    try {
        const rawHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        historyItems = rawHistory ? JSON.parse(rawHistory) : [];
        if (!Array.isArray(historyItems)) historyItems = [];
    } catch (_e) {
        historyItems = [];
    }

    try {
        const rawSaved = localStorage.getItem(STORAGE_KEYS.SAVED);
        savedItems = rawSaved ? JSON.parse(rawSaved) : [];
        if (!Array.isArray(savedItems)) savedItems = [];
    } catch (_e) {
        savedItems = [];
    }

    updateNavCounts();
    renderHistorySection();
    renderSavedSection();
    renderAnalyticsSection();
}

function persistHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyItems));
    updateNavCounts();
    renderHistorySection();
    renderAnalyticsSection();
}

function persistSaved() {
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedItems));
    updateNavCounts();
    renderSavedSection();
    renderHistorySection();
    updateSaveResultButtonState();
}

function updateNavCounts() {
    if (navHistoryCount) navHistoryCount.textContent = String(historyItems.length);
    if (navSavedCount) navSavedCount.textContent = String(savedItems.length);
}

function createRecordSignature(record) {
    return `${(record.title || "").trim().toLowerCase()}::${(record.text || "").trim().slice(0, 200).toLowerCase()}::${record.prediction}`;
}

function isRecordSaved(record) {
    if (!record) return false;
    const sig = createRecordSignature(record);
    return savedItems.some(
        (item) => item.id === record.id || createRecordSignature(item) === sig
    );
}

function addPredictionToHistory(record) {
    historyItems.unshift(record);
    // Keep up to 200 recent items
    if (historyItems.length > 200) {
        historyItems = historyItems.slice(0, 200);
    }
    persistHistory();
}

function savePredictionRecord(record) {
    if (!record) return;
    if (isRecordSaved(record)) {
        showToast("\u26A0 This prediction is already in Saved Predictions", "warning");
        return;
    }
    savedItems.unshift({ ...record, savedAt: new Date().toISOString() });
    persistSaved();
    showToast("\u2713 Prediction saved", "success");
}

function removeSavedRecordById(id) {
    const initialLen = savedItems.length;
    savedItems = savedItems.filter((item) => item.id !== id);
    if (savedItems.length !== initialLen) {
        persistSaved();
        showToast("\u2713 Prediction removed", "info");
    }
}

function deleteHistoryRecordById(id) {
    historyItems = historyItems.filter((item) => item.id !== id);
    persistHistory();
    showToast("\u2713 Prediction removed from history", "info");
}

// ============================================================================
// Render History, Saved & Analytics Sections
// ============================================================================

function renderHistorySection() {
    if (!historyList || !historyEmptyState) return;

    const query = historySearchQuery.trim().toLowerCase();
    let filtered = historyItems.filter((item) => {
        if (historyFilter !== "ALL" && item.prediction !== historyFilter) {
            return false;
        }
        if (query) {
            const haystack = `${item.title || ""} ${item.text || ""}`.toLowerCase();
            return haystack.includes(query);
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (historySort === "oldest") {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (historySort === "confidence-desc") {
            return Number(b.confidence) - Number(a.confidence);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    clearHistoryBtn.disabled = historyItems.length === 0;

    if (filtered.length === 0) {
        historyList.classList.add("hidden");
        historyEmptyState.classList.remove("hidden");
        if (historyItems.length === 0) {
            historyEmptyTitle.textContent = "No prediction history yet";
            historyEmptyDesc.textContent =
                "Articles you analyze with the detector will automatically appear here with timestamps and confidence scores.";
        } else {
            historyEmptyTitle.textContent = "No matching predictions found";
            historyEmptyDesc.textContent =
                "Try clearing your search query or switching the class filter.";
        }
        return;
    }

    historyEmptyState.classList.add("hidden");
    historyList.classList.remove("hidden");

    historyList.innerHTML = filtered
        .map((item) => {
            const isReal = item.prediction === "REAL";
            const badgeClass = isReal ? "badge-real" : "badge-fake";
            const badgeIcon = isReal ? "\uD83D\uDFE2" : "\uD83D\uDD34";
            const alreadySaved = isRecordSaved(item);
            const displayTitle = escapeHtml(deriveMeaningfulTitle(item.title, item.text));
            const displaySnippet = escapeHtml(item.text || item.title || "");
            const formattedDate = escapeHtml(formatDateTime(item.timestamp));
            const confFormatted = Number(item.confidence).toFixed(2);

            return `
            <article class="card record-card" data-record-id="${escapeHtml(item.id)}">
                <div>
                    <div class="record-top">
                        <span class="record-badge ${badgeClass}">${badgeIcon} ${escapeHtml(item.prediction)}</span>
                        <span class="record-conf">${confFormatted}% confidence</span>
                    </div>
                    <h3 class="record-title" style="margin-top: 0.55rem;">${displayTitle}</h3>
                    <p class="record-snippet">${displaySnippet}</p>
                </div>
                <div class="record-meta-row">
                    <span>${formattedDate}</span>
                    <div class="record-actions">
                        <button type="button" class="btn btn-secondary btn-xs" data-action="view-history" data-id="${escapeHtml(item.id)}">View</button>
                        <button type="button" class="btn btn-secondary btn-xs" data-action="save-history" data-id="${escapeHtml(item.id)}" ${alreadySaved ? "disabled" : ""}>
                            ${alreadySaved ? "\u2713 Saved" : "Save"}
                        </button>
                        <button type="button" class="btn btn-ghost btn-xs text-danger" data-action="delete-history" data-id="${escapeHtml(item.id)}">Delete</button>
                    </div>
                </div>
            </article>`;
        })
        .join("");
}

function renderSavedSection() {
    if (!savedList || !savedEmptyState) return;

    clearSavedBtn.disabled = savedItems.length === 0;

    if (savedItems.length === 0) {
        savedList.classList.add("hidden");
        savedEmptyState.classList.remove("hidden");
        return;
    }

    savedEmptyState.classList.add("hidden");
    savedList.classList.remove("hidden");

    savedList.innerHTML = savedItems
        .map((item) => {
            const isReal = item.prediction === "REAL";
            const badgeClass = isReal ? "badge-real" : "badge-fake";
            const badgeIcon = isReal ? "\uD83D\uDFE2" : "\uD83D\uDD34";
            const displayTitle = escapeHtml(deriveMeaningfulTitle(item.title, item.text));
            const displaySnippet = escapeHtml(item.text || item.title || "");
            const formattedDate = escapeHtml(formatDateTime(item.timestamp));
            const confFormatted = Number(item.confidence).toFixed(2);
            const modelUsed = escapeHtml(item.model || "Logistic Regression");
            const featureMethod = escapeHtml(item.featureExtraction || "TF-IDF");

            return `
            <article class="card record-card" data-saved-id="${escapeHtml(item.id)}">
                <div>
                    <div class="record-top">
                        <span class="record-badge ${badgeClass}">${badgeIcon} ${escapeHtml(item.prediction)}</span>
                        <span class="record-conf">${confFormatted}% confidence</span>
                    </div>
                    <h3 class="record-title" style="margin-top: 0.55rem;">${displayTitle}</h3>
                    <p class="record-snippet">${displaySnippet}</p>
                    <div style="margin-top: 0.6rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
                        <span class="record-meta-pill">Model: ${modelUsed}</span>
                        <span class="record-meta-pill">Features: ${featureMethod}</span>
                    </div>
                </div>
                <div class="record-meta-row">
                    <span>${formattedDate}</span>
                    <div class="record-actions">
                        <button type="button" class="btn btn-secondary btn-xs" data-action="view-saved" data-id="${escapeHtml(item.id)}">View</button>
                        <button type="button" class="btn btn-ghost btn-xs text-danger" data-action="remove-saved" data-id="${escapeHtml(item.id)}">Remove</button>
                    </div>
                </div>
            </article>`;
        })
        .join("");
}

function renderAnalyticsSection() {
    if (!analyticsEmptyState || !analyticsContent) return;

    const total = historyItems.length;
    if (total === 0) {
        analyticsContent.classList.add("hidden");
        analyticsEmptyState.classList.remove("hidden");
        return;
    }

    analyticsEmptyState.classList.add("hidden");
    analyticsContent.classList.remove("hidden");

    const fakeCount = historyItems.filter((i) => i.prediction === "FAKE").length;
    const realCount = historyItems.filter((i) => i.prediction === "REAL").length;
    const sumConf = historyItems.reduce((acc, item) => acc + (Number(item.confidence) || 0), 0);
    const avgConf = sumConf / total;

    const fakePct = ((fakeCount / total) * 100).toFixed(1);
    const realPct = ((realCount / total) * 100).toFixed(1);

    statTotalCount.textContent = String(total);
    statFakeCount.textContent = String(fakeCount);
    statFakeSub.textContent = `${fakePct}% of predictions`;
    statRealCount.textContent = String(realCount);
    statRealSub.textContent = `${realPct}% of predictions`;
    statAvgConfidence.textContent = `${avgConf.toFixed(1)}%`;

    // Chart 1: Fake vs Real Stacked Distribution Bar
    distSegmentFake.style.width = `${fakePct}%`;
    distSegmentReal.style.width = `${realPct}%`;
    legendFakeDetail.textContent = `${fakeCount} (${fakePct}%)`;
    legendRealDetail.textContent = `${realCount} (${realPct}%)`;

    // Chart 2: Confidence Distribution Buckets
    const buckets = [
        { label: "95-100%", min: 95, max: 100.01, count: 0 },
        { label: "85-95%", min: 85, max: 95, count: 0 },
        { label: "70-85%", min: 70, max: 85, count: 0 },
        { label: "< 70%", min: 0, max: 70, count: 0 }
    ];

    historyItems.forEach((item) => {
        const c = Number(item.confidence) || 0;
        for (const b of buckets) {
            if (c >= b.min && c < b.max) {
                b.count += 1;
                break;
            }
        }
    });

    confidenceBucketsChart.innerHTML = buckets
        .map((b) => {
            const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
            return `
            <div class="bucket-row">
                <span class="bucket-label">${b.label}</span>
                <div class="bucket-track">
                    <div class="bucket-fill" style="width: ${pct}%;"></div>
                </div>
                <span class="bucket-count">${b.count}</span>
            </div>`;
        })
        .join("");

    // Chart 3: Recent Predictions Sequence (up to 14 most recent, chronological left-to-right)
    const recentSlice = historyItems.slice(0, 14).reverse();
    recentTimelineChart.innerHTML = recentSlice
        .map((item) => {
            const conf = Math.max(12, Math.min(100, Number(item.confidence) || 50));
            const barClass = item.prediction === "REAL" ? "bar-real" : "bar-fake";
            const d = new Date(item.timestamp);
            const shortTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return `
            <div class="timeline-col" title="${escapeHtml(item.prediction)} (${Number(item.confidence).toFixed(2)}%) at ${escapeHtml(shortTime)}">
                <div class="timeline-bar ${barClass}" style="height: ${conf}%;"></div>
                <span class="timeline-label">${escapeHtml(shortTime)}</span>
            </div>`;
        })
        .join("");
}

// ============================================================================
// Detector Input, Validation, Step-by-Step Loading & Prediction Output
// ============================================================================

function updateCharacterCounter() {
    const rawText = articleInput.value || "";
    const charCount = rawText.length;
    const trimmed = rawText.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    charCounter.textContent = `${charCount.toLocaleString()} / ${MAX_ARTICLE_CHARS.toLocaleString()} characters \u2022 ${wordCount.toLocaleString()} word${wordCount === 1 ? "" : "s"}`;
    charCounter.classList.remove("limit-near", "limit-exceeded");

    if (charCount > MAX_ARTICLE_CHARS) {
        charCounter.classList.add("limit-exceeded");
    } else if (charCount > MAX_ARTICLE_CHARS * 0.88) {
        charCounter.classList.add("limit-near");
    }
}

function showError(message, showRetry = false) {
    errorText.textContent = message;
    errorBanner.classList.remove("hidden");
    if (showRetry) {
        retryAnalyzeBtn.classList.remove("hidden");
    } else {
        retryAnalyzeBtn.classList.add("hidden");
    }
}

function hideError() {
    errorText.textContent = "";
    errorBanner.classList.add("hidden");
    retryAnalyzeBtn.classList.add("hidden");
}

function clearStepTimers() {
    stepTimerIds.forEach((id) => clearTimeout(id));
    stepTimerIds = [];
}

function setAnalysisStepState(stepNumber, state) {
    const item = document.querySelector(`.analysis-step-item[data-step="${stepNumber}"]`);
    const icon = document.getElementById(`stepIcon${stepNumber}`);
    if (!item || !icon) return;

    item.classList.remove("step-done", "step-active");
    if (state === "done") {
        item.classList.add("step-done");
        icon.textContent = "\u2713";
    } else if (state === "active") {
        item.classList.add("step-active");
        icon.textContent = "\u23F3";
    } else {
        icon.textContent = "\u25CB";
    }
}

/**
 * Start the step-by-step loading indicator.
 * Note: Steps 4 and 5 remain in processing/pending state until the backend actually returns!
 */
function startAnalysisProgressUI() {
    clearStepTimers();
    analysisProgressBox.classList.remove("hidden");
    for (let i = 1; i <= 5; i++) {
        setAnalysisStepState(i, "pending");
    }

    setAnalysisStepState(1, "done");
    setAnalysisStepState(2, "active");

    stepTimerIds.push(
        setTimeout(() => {
            setAnalysisStepState(2, "done");
            setAnalysisStepState(3, "active");
        }, 120)
    );

    stepTimerIds.push(
        setTimeout(() => {
            setAnalysisStepState(3, "done");
            setAnalysisStepState(4, "active");
        }, 260)
    );
}

function completeAnalysisProgressUI() {
    clearStepTimers();
    for (let i = 1; i <= 5; i++) {
        setAnalysisStepState(i, "done");
    }
    setTimeout(() => {
        analysisProgressBox.classList.add("hidden");
    }, 320);
}

function stopAnalysisProgressUI() {
    clearStepTimers();
    analysisProgressBox.classList.add("hidden");
}

function setLoadingState(isLoading) {
    analyzeBtn.disabled = isLoading;
    sampleFakeBtn.disabled = isLoading;
    sampleRealBtn.disabled = isLoading;
    exampleBtn.disabled = isLoading;
    clearBtn.disabled = isLoading;
    clearMainBtn.disabled = isLoading;
    pasteClipboardBtn.disabled = isLoading;

    if (isLoading) {
        loadingSpinner.classList.remove("hidden");
        analyzeBtnText.textContent = "Analyzing article...";
        startAnalysisProgressUI();
    } else {
        loadingSpinner.classList.add("hidden");
        analyzeBtnText.textContent = "Analyze News";
    }
}

function updateSaveResultButtonState() {
    if (!currentPredictionRecord) return;
    if (isRecordSaved(currentPredictionRecord)) {
        saveResultBtn.classList.add("is-saved");
        saveResultBtnLabel.textContent = "Saved";
    } else {
        saveResultBtn.classList.remove("is-saved");
        saveResultBtnLabel.textContent = "Save Result";
    }
}

function displayPredictionResult(record) {
    currentPredictionRecord = record;

    const normalizedPred = String(record.prediction).toUpperCase() === "REAL" ? "REAL" : "FAKE";
    const numericConf = Number(record.confidence);
    const formattedConf = Number.isFinite(numericConf) ? numericConf.toFixed(2) : "0.00";

    resultPlaceholder.classList.add("hidden");
    resultContent.classList.remove("hidden");

    predictionValue.textContent = normalizedPred;
    predictionPanel.classList.remove("is-real", "is-fake");
    confidenceBarFill.classList.remove("fill-real", "fill-fake");

    if (normalizedPred === "REAL") {
        predictionPanel.classList.add("is-real");
        confidenceBarFill.classList.add("fill-real");
        predictionStatusIcon.textContent = "\uD83D\uDFE2";
        predictionSublabel.textContent = "LIKELY REAL";
    } else {
        predictionPanel.classList.add("is-fake");
        confidenceBarFill.classList.add("fill-fake");
        predictionStatusIcon.textContent = "\uD83D\uDD34";
        predictionSublabel.textContent = "LIKELY FAKE";
    }

    confidenceValue.textContent = `${formattedConf}%`;
    confidenceAsciiBar.textContent = buildAsciiConfidenceBar(numericConf);
    confidenceProgressTrack.setAttribute("aria-valuenow", formattedConf);

    resultMetaModel.textContent = record.model || currentModelConfig.model;
    resultMetaFeature.textContent = record.featureExtraction || currentModelConfig.feature_extraction;
    resultMetaNgrams.textContent = record.ngrams || currentModelConfig.ngrams;

    requestAnimationFrame(() => {
        const clampedWidth = Math.max(0, Math.min(100, numericConf || 0));
        confidenceBarFill.style.width = `${clampedWidth}%`;
    });

    resultTimestamp.textContent = formatDateTime(record.timestamp);
    updateSaveResultButtonState();
}

function resetResultView() {
    currentPredictionRecord = null;
    resultContent.classList.add("hidden");
    resultPlaceholder.classList.remove("hidden");
    confidenceBarFill.style.width = "0%";
    resultTimestamp.textContent = "Awaiting input";
}

// ============================================================================
// Backend Health Check & Prediction API Calls
// ============================================================================

async function checkBackendStatus() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`${API_BASE_URL}/`, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        apiStatusDot.className = "status-dot";

        if (data.model_loaded) {
            apiStatusDot.classList.add("online");
            apiStatusText.textContent = "API Online \u2022 Model Ready";
            diagApiStatus.textContent = "Connected";
            diagApiStatus.className = "popover-val text-real";
            diagModelStatus.textContent = "Loaded";
            diagModelStatus.className = "popover-val text-real";
            diagPredictionApi.textContent = "Available";
            diagPredictionApi.className = "popover-val text-real";
            diagSystemStatus.textContent = "Healthy";
            diagSystemStatus.className = "popover-val text-real";
        } else {
            apiStatusDot.classList.add("warning");
            apiStatusText.textContent = "API Online \u2022 Model Not Trained";
            diagApiStatus.textContent = "Connected";
            diagApiStatus.className = "popover-val text-real";
            diagModelStatus.textContent = "Not Loaded";
            diagModelStatus.className = "popover-val text-fake";
            diagPredictionApi.textContent = "Awaiting Model";
            diagPredictionApi.className = "popover-val";
            diagSystemStatus.textContent = "Degraded";
            diagSystemStatus.className = "popover-val";
        }

        if (diagChatStatus) {
            if (data.chat_configured) {
                diagChatStatus.textContent = "Ready (Google Search)";
                diagChatStatus.className = "popover-val text-real";
            } else {
                diagChatStatus.textContent = "API Key Needed (.env)";
                diagChatStatus.className = "popover-val";
            }
        }

        if (assistantStatusDot && assistantStatusLabel) {
            if (data.chat_configured) {
                assistantStatusDot.className = "grounding-dot";
                assistantStatusLabel.textContent = "Google Search Grounding Ready";
            } else {
                assistantStatusDot.className = "grounding-dot unconfigured";
                assistantStatusLabel.textContent = "Set GEMINI_API_KEY in .env";
            }
        }

        if (data.model_info) {
            const info = data.model_info;
            currentModelConfig = { ...currentModelConfig, ...info };
            if (info.model) specModel.textContent = info.model;
            if (info.feature_extraction) specFeature.textContent = info.feature_extraction;
            if (info.ngrams) specNgrams.textContent = info.ngrams;
            if (info.training_split) specTrainSplit.textContent = info.training_split;
            if (info.testing_split) specTestSplit.textContent = info.testing_split;
            if (info.classes) specClasses.textContent = info.classes;

            if (info.evaluation_metrics) {
                const m = info.evaluation_metrics;
                realMetricsBanner.classList.remove("hidden");
                metricAccuracy.textContent = `${m.accuracy}%`;
                metricPrecision.textContent = `${m.precision}%`;
                metricRecall.textContent = `${m.recall}%`;
                metricF1.textContent = `${m.f1_score}%`;
                if (m.test_samples && m.total_samples) {
                    metricsSampleInfo.textContent = `Evaluated on ${Number(m.test_samples).toLocaleString()} test articles (${Number(m.total_samples).toLocaleString()} total cleaned dataset)`;
                }
            }
        }
    } catch (_err) {
        apiStatusDot.className = "status-dot offline";
        apiStatusText.textContent = "Backend API Offline";
        diagApiStatus.textContent = "Disconnected";
        diagApiStatus.className = "popover-val text-fake";
        diagModelStatus.textContent = "Unreachable";
        diagModelStatus.className = "popover-val text-fake";
        diagPredictionApi.textContent = "Unavailable";
        diagPredictionApi.className = "popover-val text-fake";
        if (diagChatStatus) {
            diagChatStatus.textContent = "Unavailable";
            diagChatStatus.className = "popover-val text-fake";
        }
        diagSystemStatus.textContent = "Offline";
        diagSystemStatus.className = "popover-val text-fake";
    }
}

async function handleAnalyzeSubmit(event) {
    if (event) event.preventDefault();
    hideError();

    const title = headlineInput.value.trim();
    const text = articleInput.value.trim();

    if (!title && !text) {
        showError("Empty input: Please enter an article title and/or article text before clicking Analyze News.");
        showToast("\u26A0 Validation error: Article input is empty", "warning");
        return;
    }

    if (text.length > MAX_ARTICLE_CHARS) {
        showError(
            `Article text is too long (${text.length.toLocaleString()} characters). Please trim the article to ${MAX_ARTICLE_CHARS.toLocaleString()} characters or fewer.`
        );
        showToast("\u26A0 Validation error: Exceeds 5,000 character limit", "warning");
        return;
    }

    const combinedText = `${title} ${text}`.trim();
    const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3 || combinedText.length < 12) {
        showError(
            "Too-short article: Please provide at least a complete headline or several sentences of article text (minimum 3 words) for reliable NLP classification."
        );
        showToast("\u26A0 Validation error: Article text is too short", "warning");
        return;
    }

    setLoadingState(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(PREDICT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({ title, text }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let payload = null;
        try {
            payload = await response.json();
        } catch (_parseErr) {
            throw new Error("INVALID_JSON");
        }

        if (!response.ok) {
            stopAnalysisProgressUI();
            const serverErrorMessage =
                (payload && payload.error) ||
                `Server returned HTTP ${response.status}.`;
            showError(serverErrorMessage, response.status >= 500);
            showToast("\u274C API error during prediction", "error");
            await checkBackendStatus();
            return;
        }

        if (
            !payload ||
            typeof payload.prediction === "undefined" ||
            typeof payload.confidence === "undefined"
        ) {
            stopAnalysisProgressUI();
            showError("Received an unexpected response format from the prediction API.", true);
            showToast("\u274C Invalid API response", "error");
            return;
        }

        completeAnalysisProgressUI();

        const record = {
            id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: title || deriveMeaningfulTitle(title, text),
            text: text,
            prediction: String(payload.prediction).toUpperCase() === "REAL" ? "REAL" : "FAKE",
            confidence: Number(payload.confidence),
            model: currentModelConfig.model || "Logistic Regression",
            featureExtraction: currentModelConfig.feature_extraction || "TF-IDF",
            ngrams: currentModelConfig.ngrams || "Unigram + Bigram",
            timestamp: new Date().toISOString()
        };

        displayPredictionResult(record);
        addPredictionToHistory(record);
        showToast("\u2713 Prediction completed", "success");
        await checkBackendStatus();
    } catch (err) {
        clearTimeout(timeoutId);
        stopAnalysisProgressUI();
        if (err && err.name === "AbortError") {
            showError(
                "Request timed out while waiting for the prediction API. Please check the backend server and click Retry.",
                true
            );
        } else {
            showError(
                "Unable to connect to the prediction API. Please make sure the backend server is running (`python backend/app.py`).",
                true
            );
        }
        showToast("\u274C API connection error", "error");
        apiStatusDot.className = "status-dot offline";
        apiStatusText.textContent = "Backend API Offline";
    } finally {
        setLoadingState(false);
    }
}

// ============================================================================
// Copy, Export, Sample Loaders & Clipboard Paste
// ============================================================================

function buildCopySummaryText(record) {
    if (!record) return "";
    return [
        "VeriText NLP - Fake News Detection",
        "",
        `Prediction: ${record.prediction}`,
        `Confidence: ${Number(record.confidence).toFixed(2)}%`,
        `Model: ${record.model || "Logistic Regression"}`,
        `Feature Extraction: ${record.featureExtraction || "TF-IDF"}`,
        `N-Grams: ${record.ngrams || "Unigram + Bigram"}`
    ].join("\n");
}

async function copyPredictionSummary(record) {
    if (!record) return;
    const summary = buildCopySummaryText(record);
    try {
        await navigator.clipboard.writeText(summary);
        showToast("\u2713 Result copied to clipboard", "success");
    } catch (_err) {
        // Fallback copy method
        const temp = document.createElement("textarea");
        temp.value = summary;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        showToast("\u2713 Result copied to clipboard", "success");
    }
}

function exportPredictionReport(record) {
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
        `Feature Extraction : ${record.featureExtraction || "TF-IDF"} (${record.ngrams || "Unigram + Bigram"})`,
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
    const safeTime = new Date(record.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, "-");
    link.href = url;
    link.download = `VeriText-NLP-Report-${record.prediction}-${safeTime}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("\u2713 Report exported", "success");
}

function loadSampleIntoDetector(sample) {
    hideError();
    headlineInput.value = sample.title;
    articleInput.value = sample.text;
    updateCharacterCounter();
}

async function handlePasteFromClipboard() {
    hideError();
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast("\u26A0 Clipboard access is not supported in this browser context. Please press Ctrl+V.", "warning");
        articleInput.focus();
        return;
    }
    try {
        const clipText = await navigator.clipboard.readText();
        if (!clipText || !clipText.trim()) {
            showToast("\u26A0 Clipboard is currently empty", "warning");
            return;
        }
        articleInput.value = clipText.trim().slice(0, MAX_ARTICLE_CHARS);
        updateCharacterCounter();
        showToast("\u2713 Pasted article text from clipboard", "success");
    } catch (_err) {
        showToast("\u26A0 Clipboard permission denied. Please paste using Ctrl+V in the text box.", "warning");
        articleInput.focus();
    }
}

function handleClearForm() {
    headlineInput.value = "";
    articleInput.value = "";
    exampleBtnLabel.textContent = "Cycle Samples";
    hideError();
    stopAnalysisProgressUI();
    updateCharacterCounter();
    resetResultView();
    headlineInput.focus();
}

// ============================================================================
// Modals (Article Details & Confirmation Dialog)
// ============================================================================

function openArticleModal(record) {
    if (!record) return;
    activeModalRecord = record;

    modalTimestamp.textContent = formatDateTime(record.timestamp);
    modalArticleTitle.textContent = deriveMeaningfulTitle(record.title, record.text);

    const isReal = record.prediction === "REAL";
    modalPredictionBadge.className = `record-badge ${isReal ? "badge-real" : "badge-fake"}`;
    modalPredictionBadge.textContent = `${isReal ? "\uD83D\uDFE2" : "\uD83D\uDD34"} ${record.prediction}`;
    modalConfidencePill.textContent = `${Number(record.confidence).toFixed(2)}% confidence`;
    modalModelPill.textContent = `${record.model || "Logistic Regression"} \u2022 ${record.featureExtraction || "TF-IDF"}`;
    modalArticleText.textContent = record.text || record.title || "";

    articleModal.classList.remove("hidden");
    closeArticleModalBtn.focus();
}

function closeArticleModal() {
    articleModal.classList.add("hidden");
    activeModalRecord = null;
}

function openConfirmModal(title, message, onConfirm) {
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    pendingConfirmAction = onConfirm;
    confirmModal.classList.remove("hidden");
    acceptConfirmBtn.focus();
}

function closeConfirmModal() {
    confirmModal.classList.add("hidden");
    pendingConfirmAction = null;
}

// ============================================================================
// Interactive Pipeline Stage Selector
// ============================================================================

function selectPipelineStage(stepKey) {
    const info = PIPELINE_STAGE_INFO[stepKey];
    if (!info) return;

    document.querySelectorAll(".pipeline-node").forEach((btn) => {
        const isMatch = btn.getAttribute("data-pipeline-step") === stepKey;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    inspectorStepBadge.textContent = info.badge;
    inspectorStepTitle.textContent = info.title;
    inspectorStepDesc.innerHTML = info.desc;
}

// ============================================================================
// AI News Assistant (Gemini API + Google Search Grounding + VeriText ML Link)
// ============================================================================

function showChatError(message) {
    if (!chatErrorBanner || !chatErrorText) return;
    chatErrorText.textContent = message;
    chatErrorBanner.classList.remove("hidden");
}

function hideChatError() {
    if (!chatErrorBanner) return;
    chatErrorBanner.classList.add("hidden");
}

function setChatLoadingState(isLoading) {
    isChatLoading = isLoading;
    if (chatSendBtn) chatSendBtn.disabled = isLoading;
    if (chatInput) chatInput.disabled = isLoading;
    if (chatSendBtnText) {
        chatSendBtnText.textContent = isLoading ? "Searching..." : "Ask Assistant";
    }
    if (chatSuggestedPrompts) {
        chatSuggestedPrompts.querySelectorAll("button").forEach((btn) => {
            btn.disabled = isLoading;
        });
    }
    if (chatLoadingIndicator) {
        if (isLoading) {
            if (chatLoadingText) chatLoadingText.textContent = "Searching the web...";
            chatLoadingIndicator.classList.remove("hidden");
            scrollChatToBottom();
        } else {
            chatLoadingIndicator.classList.add("hidden");
        }
    }
}

function scrollChatToBottom() {
    if (!chatMessagesContainer) return;
    requestAnimationFrame(() => {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
}

function formatInlineMarkdown(escapedLine) {
    return escapedLine
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function formatChatMarkdown(rawText) {
    const safe = escapeHtml(String(rawText || "").trim());
    if (!safe) return "<p>No response content returned.</p>";

    const lines = safe.split(/\r?\n/);
    const htmlParts = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            if (inList) {
                htmlParts.push("</ul>");
                inList = false;
            }
            continue;
        }

        const bulletMatch = line.match(/^[-*\u2022]\s+(.+)$/);
        const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch || numberedMatch) {
            if (!inList) {
                htmlParts.push('<ul class="chat-formatted-list">');
                inList = true;
            }
            const itemText = bulletMatch ? bulletMatch[1] : numberedMatch[1];
            htmlParts.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
        } else {
            if (inList) {
                htmlParts.push("</ul>");
                inList = false;
            }
            htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
        }
    }

    if (inList) {
        htmlParts.push("</ul>");
    }

    return htmlParts.join("");
}

function appendUserChatMessage(messageText) {
    if (!chatMessagesContainer) return;
    const msgEl = document.createElement("div");
    msgEl.className = "chat-message chat-message-user";
    msgEl.innerHTML = `
        <div class="chat-avatar chat-avatar-user" aria-hidden="true">YOU</div>
        <div class="chat-bubble chat-bubble-user">
            <div class="chat-bubble-header">
                <span class="chat-sender-name">You</span>
                <span class="chat-meta-tag">${escapeHtml(formatDateTime(new Date().toISOString()))}</span>
            </div>
            <div class="chat-bubble-body">
                <p>${escapeHtml(messageText)}</p>
            </div>
        </div>
    `;
    chatMessagesContainer.appendChild(msgEl);
    scrollChatToBottom();
}

function appendAiChatMessage(payload, userQuery) {
    if (!chatMessagesContainer) return;

    const answerText = String(payload.answer || "").trim();
    const sources = Array.isArray(payload.sources) ? payload.sources : [];
    const searchQueries = Array.isArray(payload.search_queries) ? payload.search_queries : [];
    const searchUsed = payload.search_used !== false;

    const queriesHtml =
        searchQueries.length > 0
            ? `
            <div class="chat-search-queries">
                <span class="chat-queries-label">Google Search Queries:</span>
                ${searchQueries
                    .slice(0, 4)
                    .map((q) => `<span class="search-query-pill">\uD83D\uDD0D ${escapeHtml(q)}</span>`)
                    .join("")}
            </div>
        `
            : "";

    const sourcesHtml =
        sources.length > 0
            ? `
            <div class="chat-sources-block">
                <div class="chat-sources-heading">
                    <span>\uD83D\uDD17 Sources (${sources.length})</span>
                </div>
                <div class="chat-sources-list">
                    ${sources
                        .map((src, idx) => {
                            const srcTitle = String(src.title || src.domain || `Source ${idx + 1}`).trim();
                            const srcUrl = String(src.url || "#").trim();
                            const srcDomain = String(src.domain || "web").trim();
                            const srcSnippet = String(src.snippet || "").trim();
                            const analyzeBody = srcSnippet ? `${srcTitle}. ${srcSnippet}` : `${srcTitle}. ${answerText.slice(0, 600)}`;
                            return `
                                <div class="chat-source-card">
                                    <div class="chat-source-top">
                                        <span class="chat-source-domain">${escapeHtml(srcDomain)}</span>
                                    </div>
                                    <a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="chat-source-link">
                                        ${escapeHtml(srcTitle)} \u2197
                                    </a>
                                    ${srcSnippet ? `<p class="chat-source-snippet">${escapeHtml(srcSnippet)}</p>` : ""}
                                    <div class="chat-source-footer">
                                        <button
                                            type="button"
                                            class="btn-analyze-veritext"
                                            data-veritext-action="classify"
                                            data-veritext-title="${escapeHtml(srcTitle.slice(0, 220))}"
                                            data-veritext-text="${escapeHtml(analyzeBody.slice(0, 2500))}"
                                        >
                                            \uD83D\uDD2C Analyze with VeriText
                                        </button>
                                    </div>
                                    <div class="veritext-inline-slot"></div>
                                </div>
                            `;
                        })
                        .join("")}
                </div>
            </div>
        `
            : "";

    const msgEl = document.createElement("div");
    msgEl.className = "chat-message chat-message-ai";
    msgEl.innerHTML = `
        <div class="chat-avatar chat-avatar-ai" aria-hidden="true">AI</div>
        <div class="chat-bubble chat-bubble-ai">
            <div class="chat-bubble-header">
                <span class="chat-sender-name">VeriText AI News Assistant</span>
                <span class="chat-meta-tag">${searchUsed ? "\uD83C\uDF10 Google Search Grounded" : "Gemini Response"}</span>
            </div>
            <div class="chat-bubble-body">
                ${formatChatMarkdown(answerText)}
            </div>
            ${queriesHtml}
            ${sourcesHtml}
            <div class="chat-bubble-actions">
                <div class="veritext-inline-badges">
                    <button
                        type="button"
                        class="btn-analyze-veritext"
                        data-veritext-action="classify"
                        data-veritext-title="${escapeHtml(userQuery.slice(0, 200))}"
                        data-veritext-text="${escapeHtml(answerText.slice(0, 3500))}"
                    >
                        \uD83D\uDD2C Analyze with VeriText
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        data-veritext-action="load-detector"
                        data-veritext-title="${escapeHtml(userQuery.slice(0, 200))}"
                        data-veritext-text="${escapeHtml(answerText.slice(0, 3500))}"
                    >
                        Load in Detector \u2191
                    </button>
                </div>
                <span class="veritext-inline-note">Run TF-IDF + Logistic Regression classifier on this news summary</span>
            </div>
            <div class="veritext-inline-slot"></div>
        </div>
    `;

    chatMessagesContainer.appendChild(msgEl);
    scrollChatToBottom();
}

async function analyzeNewsItemWithVeriText(title, text, slotContainer, triggerBtn) {
    const cleanTitle = String(title || "").trim();
    const cleanText = String(text || "").trim();
    const combined = `${cleanTitle} ${cleanText}`.trim();

    if (combined.length < 12) {
        showToast("\u26A0 News snippet is too short for ML classification", "warning");
        return;
    }

    const originalBtnHtml = triggerBtn ? triggerBtn.innerHTML : "";
    if (triggerBtn) {
        triggerBtn.disabled = true;
        triggerBtn.textContent = "Classifying with VeriText ML...";
    }

    try {
        const response = await fetch(PREDICT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                title: cleanTitle,
                text: cleanText.slice(0, MAX_ARTICLE_CHARS)
            })
        });

        const payload = await response.json();
        if (!response.ok || !payload || typeof payload.prediction === "undefined") {
            throw new Error((payload && payload.error) || `HTTP ${response.status}`);
        }

        const pred = String(payload.prediction).toUpperCase() === "REAL" ? "REAL" : "FAKE";
        const conf = Number(payload.confidence);
        const formattedConf = Number.isFinite(conf) ? conf.toFixed(2) : "0.00";
        const isReal = pred === "REAL";

        const record = {
            id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: cleanTitle || deriveMeaningfulTitle(cleanTitle, cleanText),
            text: cleanText.slice(0, MAX_ARTICLE_CHARS),
            prediction: pred,
            confidence: conf,
            model: currentModelConfig.model || "Logistic Regression",
            featureExtraction: currentModelConfig.feature_extraction || "TF-IDF",
            ngrams: currentModelConfig.ngrams || "Unigram + Bigram",
            timestamp: new Date().toISOString()
        };

        // Also update main Detector card & History so the user has full continuity
        headlineInput.value = record.title;
        articleInput.value = record.text;
        updateCharacterCounter();
        displayPredictionResult(record);
        addPredictionToHistory(record);

        if (slotContainer) {
            slotContainer.innerHTML = `
                <div class="veritext-inline-result ${isReal ? "is-real" : "is-fake"}">
                    <div class="veritext-inline-header">
                        <div class="veritext-inline-badges">
                            <span class="record-badge ${isReal ? "badge-real" : "badge-fake"}">
                                ${isReal ? "\uD83D\uDFE2" : "\uD83D\uDD34"} VeriText ML: ${pred}
                            </span>
                            <span class="record-meta-pill">${formattedConf}% Confidence</span>
                            <span class="record-meta-pill">TF-IDF + Logistic Regression</span>
                        </div>
                        <button type="button" class="btn btn-ghost btn-sm" data-veritext-action="scroll-detector">
                            View in Detector \u2191
                        </button>
                    </div>
                    <p class="veritext-inline-note">
                        <strong>Disclaimer:</strong> This is a machine-learning linguistic classification (evaluating writing style and vocabulary patterns), not a definitive factual verification.
                    </p>
                </div>
            `;
        }

        showToast(`\u2713 VeriText ML classified as ${pred} (${formattedConf}%)`, "success");
    } catch (err) {
        showToast(`\u274C VeriText classification failed: ${err.message || "API error"}`, "error");
    } finally {
        if (triggerBtn) {
            triggerBtn.disabled = false;
            triggerBtn.innerHTML = originalBtnHtml;
        }
    }
}

async function sendChatQuery(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message) {
        showChatError("Empty message: Please enter a news question or click one of the suggested prompts.");
        showToast("\u26A0 Please enter a question for the AI News Assistant", "warning");
        return;
    }

    if (isChatLoading) return;

    hideChatError();
    appendUserChatMessage(message);
    if (chatInput) chatInput.value = "";
    setChatLoadingState(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
        const response = await fetch(CHAT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                message,
                history: chatHistory.slice(-6)
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let payload = null;
        try {
            payload = await response.json();
        } catch (_parseErr) {
            throw new Error("Invalid JSON response from /chat endpoint.");
        }

        if (!response.ok) {
            const errMsg =
                (payload && payload.error) ||
                `AI News Assistant returned HTTP ${response.status}.`;
            showChatError(errMsg);
            showToast("\u26A0 AI News Assistant error", "warning");
            await checkBackendStatus();
            return;
        }

        appendAiChatMessage(payload, message);

        chatHistory.push({ role: "user", content: message });
        chatHistory.push({ role: "assistant", content: String(payload.answer || "") });
        if (chatHistory.length > 12) {
            chatHistory = chatHistory.slice(-12);
        }
        await checkBackendStatus();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err && err.name === "AbortError") {
            showChatError("The web search request timed out. Please try asking a more specific question.");
        } else {
            showChatError(
                "Unable to connect to the AI News Assistant API (/chat). Please verify that `python backend/app.py` is running."
            );
        }
        showToast("\u274C Failed to reach AI News Assistant API", "error");
    } finally {
        setChatLoadingState(false);
    }
}

function handleChatSubmit(event) {
    if (event) event.preventDefault();
    if (!chatInput) return;
    sendChatQuery(chatInput.value);
}

function clearChatConversation() {
    chatHistory = [];
    hideChatError();
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = "";
    if (chatWelcomeMessage) {
        chatMessagesContainer.appendChild(chatWelcomeMessage);
    }
    showToast("\u2713 Conversation cleared", "info");
}

// ============================================================================
// Event Listeners
// ============================================================================

// AI News Assistant Events
if (chatForm) {
    chatForm.addEventListener("submit", handleChatSubmit);
}

if (chatInput) {
    chatInput.addEventListener("input", hideChatError);
}

if (clearChatBtn) {
    clearChatBtn.addEventListener("click", clearChatConversation);
}

if (chatSuggestedPrompts) {
    chatSuggestedPrompts.addEventListener("click", (e) => {
        const chip = e.target.closest("button[data-prompt]");
        if (!chip || isChatLoading) return;
        const promptText = chip.getAttribute("data-prompt");
        if (promptText) {
            sendChatQuery(promptText);
        }
    });
}

if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-veritext-action]");
        if (!btn) return;

        const action = btn.getAttribute("data-veritext-action");
        if (action === "scroll-detector") {
            document.getElementById("detector-section").scrollIntoView({ behavior: "smooth" });
            return;
        }

        const title = btn.getAttribute("data-veritext-title") || "";
        const text = btn.getAttribute("data-veritext-text") || "";

        if (action === "load-detector") {
            headlineInput.value = title;
            articleInput.value = text.slice(0, MAX_ARTICLE_CHARS);
            updateCharacterCounter();
            document.getElementById("detector-section").scrollIntoView({ behavior: "smooth" });
            showToast("\u2713 Loaded news summary into Detector", "info");
            return;
        }

        if (action === "classify") {
            const parentCard = btn.closest(".chat-source-card") || btn.closest(".chat-bubble");
            const slot = parentCard ? parentCard.querySelector(":scope > .veritext-inline-slot") : null;
            analyzeNewsItemWithVeriText(title, text, slot, btn);
        }
    });
}

// Detector Input Events
articleInput.addEventListener("input", updateCharacterCounter);
headlineInput.addEventListener("input", hideError);
articleInput.addEventListener("input", hideError);
analyzeForm.addEventListener("submit", handleAnalyzeSubmit);
retryAnalyzeBtn.addEventListener("click", () => handleAnalyzeSubmit());
pasteClipboardBtn.addEventListener("click", handlePasteFromClipboard);
clearBtn.addEventListener("click", handleClearForm);
clearMainBtn.addEventListener("click", handleClearForm);

// Sample Buttons
sampleFakeBtn.addEventListener("click", () => {
    const sample = FAKE_SAMPLES[fakeSampleIndex];
    fakeSampleIndex = (fakeSampleIndex + 1) % FAKE_SAMPLES.length;
    loadSampleIntoDetector(sample);
});

sampleRealBtn.addEventListener("click", () => {
    const sample = REAL_SAMPLES[realSampleIndex];
    realSampleIndex = (realSampleIndex + 1) % REAL_SAMPLES.length;
    loadSampleIntoDetector(sample);
});

exampleBtn.addEventListener("click", () => {
    const sample = ALL_SAMPLES[allSampleIndex];
    allSampleIndex = (allSampleIndex + 1) % ALL_SAMPLES.length;
    loadSampleIntoDetector(sample);
    exampleBtnLabel.textContent = `Cycle Samples (${allSampleIndex + 1}/${ALL_SAMPLES.length})`;
});

// Result Card Action Buttons
saveResultBtn.addEventListener("click", () => {
    if (currentPredictionRecord) {
        savePredictionRecord(currentPredictionRecord);
    }
});

copyResultBtn.addEventListener("click", () => {
    if (currentPredictionRecord) {
        copyPredictionSummary(currentPredictionRecord);
    }
});

exportResultBtn.addEventListener("click", () => {
    if (currentPredictionRecord) {
        exportPredictionReport(currentPredictionRecord);
    }
});

// Theme Toggle & Settings Controls
themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark", true);
});

setThemeDarkBtn.addEventListener("click", () => applyTheme("dark", true));
setThemeLightBtn.addEventListener("click", () => applyTheme("light", true));

toggleAnimationsBtn.addEventListener("click", () => {
    const prefs = getPreferences();
    const nextAnimations = prefs.animations === false;
    applyPreferences({ ...prefs, animations: nextAnimations }, true);
    showToast(`\u2713 UI animations ${nextAnimations ? "enabled" : "reduced"}`, "info");
});

densityComfortableBtn.addEventListener("click", () => {
    const prefs = getPreferences();
    applyPreferences({ ...prefs, density: "comfortable" }, true);
});

densityCompactBtn.addEventListener("click", () => {
    const prefs = getPreferences();
    applyPreferences({ ...prefs, density: "compact" }, true);
});

// API Status Popover Toggle
apiStatusBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = apiStatusPopover.classList.toggle("hidden");
    apiStatusBadge.setAttribute("aria-expanded", isHidden ? "false" : "true");
    if (!isHidden) {
        checkBackendStatus();
    }
});

refreshStatusBtn.addEventListener("click", () => {
    checkBackendStatus();
    showToast("\u2713 Refreshed API status", "info");
});

document.addEventListener("click", (e) => {
    if (apiStatusWrapper && !apiStatusWrapper.contains(e.target)) {
        apiStatusPopover.classList.add("hidden");
        apiStatusBadge.setAttribute("aria-expanded", "false");
    }
});

// Mobile Hamburger Menu
mobileMenuBtn.addEventListener("click", () => {
    const isOpen = mainNavLinks.classList.toggle("mobile-open");
    mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        mainNavLinks.classList.remove("mobile-open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
    });
});

// History Search, Filter, Sort & Item Actions
historySearchInput.addEventListener("input", (e) => {
    historySearchQuery = e.target.value || "";
    renderHistorySection();
});

document.querySelectorAll("[data-history-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("[data-history-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        historyFilter = btn.getAttribute("data-history-filter") || "ALL";
        renderHistorySection();
    });
});

historySortSelect.addEventListener("change", (e) => {
    historySort = e.target.value || "newest";
    renderHistorySection();
});

historyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    const record = historyItems.find((item) => item.id === id);
    if (!record) return;

    if (action === "view-history") {
        openArticleModal(record);
    } else if (action === "save-history") {
        savePredictionRecord(record);
    } else if (action === "delete-history") {
        deleteHistoryRecordById(id);
    }
});

savedList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    const record = savedItems.find((item) => item.id === id);
    if (!record) return;

    if (action === "view-saved") {
        openArticleModal(record);
    } else if (action === "remove-saved") {
        removeSavedRecordById(id);
    }
});

// Destructive Actions with Confirmation Modals
function promptClearHistory() {
    if (historyItems.length === 0) {
        showToast("History is already empty", "info");
        return;
    }
    openConfirmModal(
        "Clear Prediction History",
        "Are you sure you want to permanently delete all prediction history records?",
        () => {
            historyItems = [];
            persistHistory();
            showToast("\u2713 History cleared", "info");
        }
    );
}

function promptClearSaved() {
    if (savedItems.length === 0) {
        showToast("Saved predictions list is already empty", "info");
        return;
    }
    openConfirmModal(
        "Clear Saved Predictions",
        "Are you sure you want to remove all bookmarked predictions?",
        () => {
            savedItems = [];
            persistSaved();
            showToast("\u2713 Saved predictions cleared", "info");
        }
    );
}

function promptClearAllData() {
    openConfirmModal(
        "Reset All Application Data",
        "This will clear all prediction history, saved predictions, and reset theme preferences to default Dark mode. Continue?",
        () => {
            historyItems = [];
            savedItems = [];
            localStorage.removeItem(STORAGE_KEYS.HISTORY);
            localStorage.removeItem(STORAGE_KEYS.SAVED);
            localStorage.removeItem(STORAGE_KEYS.PREFS);
            applyTheme("dark", false);
            applyPreferences({ animations: true, density: "comfortable" }, true);
            persistHistory();
            persistSaved();
            showToast("\u2713 All local application data cleared", "info");
        }
    );
}

clearHistoryBtn.addEventListener("click", promptClearHistory);
settingsClearHistoryBtn.addEventListener("click", promptClearHistory);
clearSavedBtn.addEventListener("click", promptClearSaved);
settingsClearSavedBtn.addEventListener("click", promptClearSaved);
settingsClearAllDataBtn.addEventListener("click", promptClearAllData);

// Modal Controls
closeArticleModalBtn.addEventListener("click", closeArticleModal);
modalCloseFooterBtn.addEventListener("click", closeArticleModal);
articleModal.addEventListener("click", (e) => {
    if (e.target === articleModal) closeArticleModal();
});

modalLoadInDetectorBtn.addEventListener("click", () => {
    if (!activeModalRecord) return;
    headlineInput.value = activeModalRecord.title || "";
    articleInput.value = activeModalRecord.text || "";
    updateCharacterCounter();
    displayPredictionResult(activeModalRecord);
    closeArticleModal();
    document.getElementById("detector-section").scrollIntoView({ behavior: "smooth" });
});

modalCopyBtn.addEventListener("click", () => {
    if (activeModalRecord) copyPredictionSummary(activeModalRecord);
});

closeConfirmModalBtn.addEventListener("click", closeConfirmModal);
cancelConfirmBtn.addEventListener("click", closeConfirmModal);
confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) closeConfirmModal();
});

acceptConfirmBtn.addEventListener("click", () => {
    if (typeof pendingConfirmAction === "function") {
        pendingConfirmAction();
    }
    closeConfirmModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (!articleModal.classList.contains("hidden")) closeArticleModal();
        if (!confirmModal.classList.contains("hidden")) closeConfirmModal();
        if (!apiStatusPopover.classList.contains("hidden")) {
            apiStatusPopover.classList.add("hidden");
            apiStatusBadge.setAttribute("aria-expanded", "false");
        }
    }
});

// Interactive Pipeline Step Click & Hover
document.querySelectorAll(".pipeline-node").forEach((node) => {
    const step = node.getAttribute("data-pipeline-step");
    node.addEventListener("click", () => selectPipelineStage(step));
    node.addEventListener("mouseenter", () => selectPipelineStage(step));
});

// Initialize Application on Load
document.addEventListener("DOMContentLoaded", () => {
    loadThemeAndPreferences();
    loadStoredRecords();
    updateCharacterCounter();
    checkBackendStatus();
});

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import {
  apiLogin,
  apiRegister,
  apiGetMe,
  apiLogout,
  getStoredToken,
  setStoredToken,
  clearStoredToken
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    total_predictions: 0,
    fake_predictions: 0,
    real_predictions: 0,
    total_saved: 0,
    saved_articles: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Normal Login/Signup Modal State with Contextual Reason support
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: "login", // 'login' | 'signup'
    reason: null, // 'save-analysis' | 'save-article' | 'history' | 'saved'
    customTitle: null,
    customDesc: null
  });

  // Pending Save Action State: { action: "save-analysis"|"save-article", data: {...} }
  const [pendingSaveAction, setPendingSaveAction] = useState(null);

  // Check current session on initial mount
  const checkAuth = useCallback(async () => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiGetMe(savedToken);
      if (data && data.user) {
        setUser(data.user);
        setToken(savedToken);
        if (data.stats) {
          setUserStats(data.stats);
        }
      } else {
        clearStoredToken();
        setToken(null);
        setUser(null);
      }
    } catch (_err) {
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Refresh user and statistics from backend
  const refreshUser = useCallback(async () => {
    const activeToken = token || getStoredToken();
    if (!activeToken) return null;
    try {
      const data = await apiGetMe(activeToken);
      if (data && data.user) {
        setUser(data.user);
        if (data.stats) setUserStats(data.stats);
      }
      return data;
    } catch (_e) {
      return null;
    }
  }, [token]);

  // Modal open function with contextual reason & pending action support
  const openLoginModal = useCallback(
    ({
      mode = "login",
      reason = null,
      customTitle = null,
      customDesc = null,
      pendingAction = null
    } = {}) => {
      setAuthModalState({
        isOpen: true,
        mode,
        reason,
        customTitle,
        customDesc
      });
      if (pendingAction !== undefined && pendingAction !== null) {
        setPendingSaveAction(pendingAction);
      }
    },
    []
  );

  const openAuthModal = openLoginModal;

  // Modal close function - clears pending action on cancel/close without saving
  const handleCloseLoginModal = useCallback(() => {
    setAuthModalState({
      isOpen: false,
      mode: "login",
      reason: null,
      customTitle: null,
      customDesc: null
    });
    setPendingSaveAction(null);
  }, []);

  const closeAuthModal = handleCloseLoginModal;

  // Login handler
  const login = useCallback(
    async (email, password) => {
      try {
        const data = await apiLogin(email, password);
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        await refreshUser();
        // Close modal UI; keep pending action so consumer can execute it
        setAuthModalState({
          isOpen: false,
          mode: "login",
          reason: null,
          customTitle: null,
          customDesc: null
        });
        return { success: true, user: data.user, token: data.token };
      } catch (err) {
        return {
          success: false,
          error: err.message || "Invalid email or password."
        };
      }
    },
    [refreshUser]
  );

  // Signup handler
  const signup = useCallback(
    async (name, email, password) => {
      try {
        const data = await apiRegister(name, email, password);
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        await refreshUser();
        setAuthModalState({
          isOpen: false,
          mode: "login",
          reason: null,
          customTitle: null,
          customDesc: null
        });
        return { success: true, user: data.user, token: data.token };
      } catch (err) {
        return {
          success: false,
          error: err.message || "Failed to create account."
        };
      }
    },
    [refreshUser]
  );

  // Logout handler
  const logout = useCallback(async () => {
    await apiLogout();
    clearStoredToken();
    setToken(null);
    setUser(null);
    setPendingSaveAction(null);
    setUserStats({
      total_predictions: 0,
      fake_predictions: 0,
      real_predictions: 0,
      total_saved: 0,
      saved_articles: 0
    });
  }, []);

  const value = {
    user,
    token,
    userStats,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authModalState,
    pendingSaveAction,
    setPendingSaveAction,
    clearPendingSaveAction: () => setPendingSaveAction(null),
    openLoginModal,
    openAuthModal,
    handleCloseLoginModal,
    closeAuthModal,
    login,
    signup,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

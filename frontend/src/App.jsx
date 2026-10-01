import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ArticleModal from "./components/ArticleModal";
import NewsDetailModal from "./components/NewsDetailModal";
import AboutUsModal from "./components/AboutUsModal";
import ConfirmModal from "./components/ConfirmModal";
import ToastContainer from "./components/ToastContainer";
import AuthModal from "./components/auth/AuthModal";

import HomePage from "./pages/HomePage";
import DetectorPage from "./pages/DetectorPage";
import AiNewsPage from "./pages/AiNewsPage";
import HistoryPage from "./pages/HistoryPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ModelPage from "./pages/ModelPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import SettingsPage from "./pages/SettingsPage";

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <AppDataProvider>
            <ScrollToTopOnRouteChange />
            <div className="app-shell">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/detector" element={<DetectorPage />} />
                  <Route path="/ai-news" element={<AiNewsPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/model" element={<ModelPage />} />
                  <Route path="/architecture" element={<ArchitecturePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <ArticleModal />
              <NewsDetailModal />
              <AboutUsModal />
              <ConfirmModal />
              <ToastContainer />
              <AuthModal />
            </div>
          </AppDataProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

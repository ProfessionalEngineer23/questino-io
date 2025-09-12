import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@appwrite.io/pink-icons";

import Dashboard from "./Dashboard.jsx";        // home: list user surveys
import { ToastProvider } from "./components/Toast.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import FloatingBackground from "./components/FloatingBackground.jsx";
import SoundPreloader from "./components/SoundPreloader.jsx";
import { FEATURES } from "./featureFlags";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// Lazy load components for better performance
const SurveyBuilder = lazy(() => import("./SurveyBuilder.jsx"));
const SurveyRunner = lazy(() => import("./SurveyRunner.jsx"));
const Stats = lazy(() => import("./Stats.jsx"));
const HomeV2 = lazy(() => import("./pages/HomeV2.jsx"));
const AuthChoice = lazy(() => import("./components/AuthChoice.jsx"));
const ThankYou = lazy(() => import("./components/ThankYou.jsx"));
const PublicStats = lazy(() => import("./components/PublicStats.jsx"));
const HappinessResults = lazy(() => import("./components/HappinessResults.jsx"));
const AuthPage = lazy(() => import("./components/AuthPage.jsx"));
const AuthCallback = lazy(() => import("./components/AuthCallback.jsx"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FloatingBackground />
    <SoundPreloader />
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
          <Routes>
            <Route path="/" element={FEATURES.LANDING_V2 ? <HomeV2 /> : <Dashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/create" element={<SurveyBuilder />} />
            <Route path="/edit/:id" element={<SurveyBuilder />} />
            <Route path="/s/:slug" element={<SurveyRunner />} />
            <Route path="/survey/:slug" element={<SurveyRunner />} />
            <Route path="/happiness-results/:slug" element={
              <ErrorBoundary>
                <HappinessResults />
              </ErrorBoundary>
            } />
            <Route path="/stats/:id" element={<Stats />} />
            <Route path="/public-stats/:slug" element={<PublicStats />} />
            <Route path="/thanks" element={<ThankYou />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>
);

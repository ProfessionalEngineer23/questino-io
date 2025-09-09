import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@appwrite.io/pink-icons";

import Dashboard from "./Dashboard.jsx";        // home: list user surveys
import SurveyBuilder from "./SurveyBuilder.jsx"; // create/edit survey
import SurveyRunner from "./SurveyRunner.jsx";   // public fill page
import Stats from "./Stats.jsx";               // NEW
import { ToastProvider } from "./components/Toast.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<SurveyBuilder />} />
          <Route path="/edit/:id" element={<SurveyBuilder />} />
          <Route path="/s/:slug" element={<SurveyRunner />} />
          <Route path="/stats/:id" element={<Stats />} />   {/* NEW */}
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>
);

import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PredictorPage from "./pages/PredictorPage";
import OpsPage from "./pages/OpsPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 12, display: "flex", gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/predict">Predict</Link>
        <Link to="/ops">Ops</Link>
      </nav>
      <div style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/predict" element={<PredictorPage />} />
          <Route path="/ops" element={<OpsPage />} />
          {/* fallback so unknown paths still render something */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

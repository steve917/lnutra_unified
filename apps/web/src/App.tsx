import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PredictorPage from "./pages/PredictorPage";
import OpsPage from "./pages/OpsPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10 }}>
        <Link to="/" style={{ marginRight: 12 }}>
          Home
        </Link>
        <Link to="/predict" style={{ marginRight: 12 }}>
          Predict
        </Link>
        <Link to="/ops">Ops</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/predict" element={<PredictorPage />} />
        <Route path="/ops" element={<OpsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

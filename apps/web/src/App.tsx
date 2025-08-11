// apps/web/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PredictFormPage from "./pages/PredictFormPage";

// If you have these pages already, keep them. Otherwise, harmless fallbacks:
const HomePage = () => <div style={{ padding: 24 }}><h1>Home</h1><p>Go to <Link to="/predict">Predict</Link></p></div>;
const OpsPage = () => <div style={{ padding: 24 }}><h1>Ops</h1></div>;

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 16, borderBottom: "1px solid #eee", marginBottom: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/predict" style={{ marginRight: 12 }}>Predict</Link>
        <Link to="/ops">Ops</Link>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/predict" element={<PredictFormPage />} />
        <Route path="/ops" element={<OpsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

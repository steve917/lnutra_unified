import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PredictorPage from "./pages/PredictorPage"; // already in your project
import OpsPage from "./pages/OpsPage";             // you created this earlier

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* public tool */}
        <Route path="/predictor" element={<PredictorPage />} />

        {/* internal dashboard */}
        <Route path="/ops" element={<OpsPage />} />

        {/* safety net */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

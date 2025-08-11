import React from "react";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import PredictorPage from "./pages/PredictorPage";
import OpsPage from "./pages/OpsPage";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="root">
      <nav className="topNav">
        <div className="brand">L-Nutra</div>
        <div className="navLinks">
          <NavLink to="/" end className="navLink">Home</NavLink>
          <NavLink to="/predict" className="navLink">Predict</NavLink>
          <NavLink to="/ops" className="navLink">Ops</NavLink>
        </div>
      </nav>
      <main className="stage">{children}</main>
      <footer className="foot">
        <span>© {new Date().getFullYear()} L-Nutra</span>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <Layout>
      <h1 style={{ marginBottom: 8 }}>Welcome</h1>
      <p style={{ opacity: 0.8 }}>
        Use <Link to="/predict">Predict</Link> to run a model prediction and{" "}
        <Link to="/ops">Ops</Link> to view feature columns and API health.
      </p>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<Layout><PredictorPage /></Layout>} />
        <Route path="/ops" element={<Layout><OpsPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

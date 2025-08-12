import React from "react";
import { Link } from "react-router-dom";

export default function AppHome() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p>Choose a section:</p>
      <div className="flex gap-3">
        <Link to="/app/predict" className="underline">Predict</Link>
        <Link to="/app/history" className="underline">History</Link>
      </div>
    </div>
  );
}

import React from "react";
import { BILLING_ENABLED } from "../lib/env";

export default function BillingPage() {
  if (!BILLING_ENABLED) {
    return (
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Billing</h2>
        <div className="text-yellow-200 bg-yellow-900/30 border border-yellow-800 rounded p-3 text-sm">
          Billing is disabled in this environment.
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <h2 className="text-xl font-semibold">Billing</h2>
      <p>Plans and payment go here.</p>
    </div>
  );
}

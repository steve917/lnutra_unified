import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { COMPANY_NAME, BRAND_TAGLINE, BILLING_ENABLED, INTERNAL_BUILD, API_URL } from "../lib/env";

export default function AppLayout() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loc = useLocation();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        if (isMounted) {
          if (r.ok) setMe(await r.json());
          else setMe(null);
        }
      } catch {
        if (isMounted) setMe(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-200">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between p-4">
          <Link to="/" className="text-xl font-semibold">{COMPANY_NAME}</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/app/predict">Predict</Link>
            <Link to="/app/history">History</Link>
            {BILLING_ENABLED && <Link to="/app/billing">Billing</Link>}
            <Link to="/admin/ops">Admin</Link>
          </nav>
        </div>
        {INTERNAL_BUILD && (
          <div className="bg-yellow-900/40 text-yellow-100 text-center py-1 text-xs">
            Internal build — billing disabled, do not distribute.
          </div>
        )}
      </header>

      {!loading && !me && (
        <div className="mx-auto max-w-6xl p-2 text-xs text-slate-400">
          You are not signed in (staging). Some actions may be limited.
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl p-4 text-sm text-slate-400 border-t border-slate-800">
        <div>{BRAND_TAGLINE}</div>
      </footer>
    </div>
  );
}

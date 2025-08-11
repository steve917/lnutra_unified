import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE;

// Read a saved Basic Auth header from localStorage (base64 'user:pass')
function getAuthHeader(): Record<string,string> {
  const raw = localStorage.getItem('opsAuth');
  return raw ? { Authorization: `Basic ${raw}` } : {};
}

export default function OpsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  async function load() {
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/v1/predictions?limit=50`, {
        headers: { ...getAuthHeader(), Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data);
    } catch (e:any) {
      setErr(e.message ?? 'Failed to load');
    }
  }

  function saveCreds() {
    const encoded = btoa(`${user}:${pass}`);
    localStorage.setItem('opsAuth', encoded);
    setUser('');
    setPass('');
    load();
  }

  function clearCreds() {
    localStorage.removeItem('opsAuth');
    setRows([]);
    setErr('');
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Ops Dashboard</h1>

      <div className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">OPS user</label>
          <input className="border px-2 py-1 rounded" value={user} onChange={e=>setUser(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">OPS pass</label>
          <input className="border px-2 py-1 rounded" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={saveCreds}>Save & Reload</button>
        <button className="border px-3 py-2 rounded" onClick={clearCreds}>Clear</button>
      </div>

      {err && <p className="text-red-600 mb-4 break-all">{err}</p>}

      <table className="w-full border text-sm">
        <thead><tr className="bg-gray-50">
          <th className="p-2 border">Time</th>
          <th className="p-2 border">Badge</th>
          <th className="p-2 border">Δ Weight (kg)</th>
          <th className="p-2 border">Δ HbA1c (%)</th>
          <th className="p-2 border">Features</th>
        </tr></thead>
        <tbody>
          {rows.map((r:any)=>(
            <tr key={r.id}>
              <td className="p-2 border">{r.created_at}</td>
              <td className="p-2 border">{r.safety_badge}</td>
              <td className="p-2 border">{r.weight}</td>
              <td className="p-2 border">{r.hba1c}</td>
              <td className="p-2 border break-all">{JSON.stringify(r.features)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

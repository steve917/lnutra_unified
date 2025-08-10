import React, { useEffect, useState } from 'react';
import { apiListPlaybooks, apiGetPlaybook } from '../lib/api';

export default function Playbooks() {
  const [items, setItems] = useState<any[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    apiListPlaybooks()
      .then((list) => {
        setItems(list);
        if (list.length) setSlug(list[0].slug);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setErr('');
    apiGetPlaybook(slug)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [slug]);

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Action Playbooks</h2>
      {items.length === 0 && <p>No playbooks found or Supabase not configured.</p>}
      {items.length > 0 && (
        <label style={{ display: 'block', marginTop: '8px' }}>
          Select cause:&nbsp;
          <select
            style={{ border: '1px solid #d1d5db', padding: '4px', marginTop: '4px' }}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          >
            {items.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.cause_type || item.slug}
              </option>
            ))}
          </select>
        </label>
      )}
      {err && <p style={{ color: '#dc2626', marginTop: '8px' }}>Error: {err}</p>}
      {!data && !err && items.length > 0 && <p style={{ marginTop: '8px' }}>Loading…</p>}
      {data && (
        <pre
          style={{
            marginTop: '8px',
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
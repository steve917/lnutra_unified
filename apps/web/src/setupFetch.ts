const _origFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const res = await _origFetch(...args);
  try {
    const u = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (u && u.includes('/v1/predict')) {
      const clone = res.clone();
      const json = await clone.json();
      try { (window as any).__ln_last_prediction = json; } catch {}
      try { window.dispatchEvent(new CustomEvent('ln:predict:done', { detail: json })); } catch {}
      console.log('predict intercepted ->', json);
    }
  } catch {}
  return res;
};

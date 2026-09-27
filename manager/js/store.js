// Simple localStorage-backed store. One key holds the whole dataset so that
// export/import is a single JSON blob.
const Store = (() => {
  const KEY = 'wellperion-squash.v1';
  const COLLECTIONS = ['customers', 'campaigns', 'calls', 'events', 'assets', 'posts', 'kpi'];

  const empty = () => ({
    version: 1,
    customers: [],
    campaigns: [],
    calls: [],
    events: [],
    assets: [],
    posts: [], // the social plan (Social tab)
    kpi: [],   // one row per month: followers, reach, saves, bookings (Social tab)
    brand: {
      tagline: '',
      colors: [
        { role: 'Primary', hex: '#0f4c5c' },
        { role: 'Accent', hex: '#e36414' },
        { role: 'Neutral dark', hex: '#1d232a' },
        { role: 'Neutral light', hex: '#f6f7f8' },
      ],
      fonts: { heading: 'system-ui', body: 'system-ui' },
    },
    settings: {
      // Google Sheet sources for Customers (see apps-script/README.md).
      // sources: [{ id, name, url, token, mapping }] — one per sheet/tab; all are merged on Sync.
      sheet: { sources: [], columns: null, lastSync: '', lastResult: null },
    },
  });

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const parsed = JSON.parse(raw);
      const base = empty();
      for (const c of COLLECTIONS) if (!Array.isArray(parsed[c])) parsed[c] = base[c];
      parsed.brand = Object.assign(base.brand, parsed.brand || {});
      parsed.settings = parsed.settings || {};
      parsed.settings.sheet = Object.assign(base.settings.sheet, parsed.settings.sheet || {});
      migrateSheetSources(parsed.settings.sheet);
      return parsed;
    } catch (e) {
      console.warn('Store: could not load, starting empty', e);
      return empty();
    }
  }

  // v1 kept a single { url, token, mapping } on settings.sheet; now it is a list of sources.
  function migrateSheetSources(sheet) {
    if (!Array.isArray(sheet.sources)) sheet.sources = [];
    if (sheet.url) sheet.sources.unshift({ id: uid(), name: 'Sheet 1', url: sheet.url, token: sheet.token || '', mapping: sheet.mapping || {} });
    delete sheet.url; delete sheet.token; delete sheet.mapping;
  }

  // Batched saving: inside Store.batch(fn) writes are deferred and localStorage is
  // written once at the end (a Sync upserts hundreds of records).
  let deferred = 0, dirty = false;
  const listeners = []; // called after each real write (the cloud copy hooks in here)
  function save() {
    if (deferred > 0) { dirty = true; return; }
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { alert('Could not save data: ' + e.message); }
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.warn(e); } });
  }
  async function batch(fn) {
    deferred++;
    try { return await fn(); }
    finally { deferred--; if (deferred === 0 && dirty) { dirty = false; save(); } }
  }

  return {
    all: () => data,
    batch,
    list: (col) => data[col],
    get: (col, id) => data[col].find((r) => r.id === id),
    upsert(col, rec) {
      if (!rec.id) { rec.id = uid(); rec.createdAt = new Date().toISOString(); }
      rec.updatedAt = new Date().toISOString();
      const i = data[col].findIndex((r) => r.id === rec.id);
      if (i >= 0) data[col][i] = rec; else data[col].push(rec);
      save();
      return rec;
    },
    remove(col, id) {
      data[col] = data[col].filter((r) => r.id !== id);
      save();
    },
    setBrand(brand) { data.brand = Object.assign(data.brand, brand); save(); },
    settings: () => data.settings,
    setSheetSettings(patch) { Object.assign(data.settings.sheet, patch); save(); },
    onChange: (fn) => listeners.push(fn),
    exportJSON: (compact) => (compact ? JSON.stringify(data) : JSON.stringify(data, null, 2)),
    importJSON(text, opts) {
      const parsed = typeof text === 'string' ? JSON.parse(text) : text;
      if (!parsed || typeof parsed !== 'object') throw new Error('Not a valid export file');
      localStorage.setItem(KEY, JSON.stringify(parsed));
      data = load();
      if (!(opts && opts.silent)) listeners.forEach((fn) => { try { fn(); } catch (e) { console.warn(e); } });
    },
    reset() { data = empty(); save(); },
  };
})();

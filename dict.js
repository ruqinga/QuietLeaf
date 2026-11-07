// Offline English-Chinese dictionary (ECDICT subset, see dict/LICENSE-ECDICT).
// Downloaded once from ./dict/en-zh.json, kept in IndexedDB, refreshed only when dict/version.json changes.
const QLDict = (() => {
  const DB = 'quietleaf-dict', STORE = 'kv';
  let data = null;                       // {v, w:{word:[phonetic, translation, level]}, f:{form:lemma}}
  let state = {status: 'idle', progress: 0, error: ''};
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(state) } catch {} });
  const set = patch => { state = {...state, ...patch}; emit() };

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idb(mode, fn) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req?.result);
        tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close() }
  }
  const getKey = key => idb('readonly', s => s.get(key));
  const putKeys = entries => idb('readwrite', s => { for (const [k, v] of entries) s.put(v, k) });

  async function download(meta) {
    set({status: 'downloading', progress: 0, error: ''});
    const res = await fetch('./dict/en-zh.json?v=' + encodeURIComponent(meta.version + '-' + (meta.sha1 || '')), {cache: 'no-store'});
    if (!res.ok) throw Error('HTTP ' + res.status);
    let text;
    if (res.body && meta.bytes) {
      const reader = res.body.getReader(), chunks = [];
      let got = 0;
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        set({progress: Math.min(99, Math.round(got / meta.bytes * 100))});
      }
      const all = new Uint8Array(got);
      let off = 0;
      for (const c of chunks) { all.set(c, off); off += c.length }
      text = new TextDecoder().decode(all);
    } else {
      text = await res.text();
    }
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed.w !== 'object') throw Error('词典文件格式不正确');
    await putKeys([['data', parsed], ['meta', meta]]);
    data = parsed;
    set({status: 'ready', progress: 100});
  }

  async function init({force = false} = {}) {
    if (state.status === 'downloading') return;
    try {
      if (!data && !force) {
        const [stored, meta] = await Promise.all([getKey('data'), getKey('meta')]);
        if (stored?.w) { data = stored; set({status: 'ready', meta}) }
      }
      if (!navigator.onLine) { if (!data) set({status: 'offline'}); return }
      const res = await fetch('./dict/version.json', {cache: 'no-store'});
      if (!res.ok) throw Error('HTTP ' + res.status);
      const remote = await res.json();
      const local = await getKey('meta');
      if (force || !data || !local || local.version !== remote.version || local.sha1 !== remote.sha1) {
        await download(remote);
        set({meta: remote});
      }
    } catch (e) {
      set({status: data ? 'ready' : 'error', error: e.message || String(e)});
    }
  }

  function lemmaOf(word) {
    if (!data) return null;
    const w = word.toLowerCase().replace(/[’]/g, "'");
    if (data.w[w]) return w;
    if (data.f[w] && data.w[data.f[w]]) return data.f[w];
    const tries = [
      w.replace(/'s$/, ''), w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''),
      w.replace(/ied$/, 'y'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'), w.replace(/(.)\1ed$/, '$1'),
      w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/(.)\1ing$/, '$1'),
      w.replace(/ily$/, 'y'), w.replace(/ly$/, ''), w.replace(/ness$/, ''),
    ];
    for (const t of tries) if (t !== w && t.length > 1 && data.w[t]) return t;
    return null;
  }

  // -> {word, lemma, phonetic, meaning, level} or null
  function get(word) {
    const lemma = lemmaOf(word);
    if (!lemma) return null;
    const [phonetic, meaning, level] = data.w[lemma];
    return {word: word.toLowerCase(), lemma, phonetic, meaning, level};
  }

  return {
    init, get, lemmaOf,
    ready: () => !!data,
    state: () => state,
    count: () => data ? Object.keys(data.w).length : 0,
    onChange: fn => { listeners.add(fn); return () => listeners.delete(fn) },
  };
})();

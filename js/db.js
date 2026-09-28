// Minimaler IndexedDB-Wrapper. Alle Daten bleiben lokal auf dem Gerät.
// Stores: profiles (Kinderprofile), progress (Lernstand je Kind), meta (PIN usw.)

const DB_NAME = 'rechenblitz';
const DB_VERSION = 1;
export const STORES = ['profiles', 'progress', 'meta'];

let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const get = (store, key) => tx(store, 'readonly', s => s.get(key));
export const put = (store, key, value) => tx(store, 'readwrite', s => { s.put(value, key); });
export const del = (store, key) => tx(store, 'readwrite', s => { s.delete(key); });
export const all = store => tx(store, 'readonly', s => s.getAll());
const keys = store => tx(store, 'readonly', s => s.getAllKeys());
const clear = store => tx(store, 'readwrite', s => { s.clear(); });

// Bittet den Browser, die Daten nicht automatisch zu löschen.
export async function requestPersist() {
  try { return await navigator.storage?.persist?.(); } catch { return false; }
}

export async function exportAll() {
  const out = { app: 'rechenblitz', version: 1, exported: new Date().toISOString(), stores: {} };
  for (const s of STORES) {
    const [k, v] = await Promise.all([keys(s), all(s)]);
    out.stores[s] = k.map((key, i) => [key, v[i]]);
  }
  return out;
}

export async function importAll(data) {
  if (!data || data.app !== 'rechenblitz' || !data.stores) throw new Error('Keine gültige Rechenblitz-Sicherung.');
  for (const s of STORES) {
    await clear(s);
    for (const [key, value] of data.stores[s] || []) await put(s, key, value);
  }
}

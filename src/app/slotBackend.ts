/**
 * Speicher-Backends für die Spielstand-Slots (Ausbauplan Punkt 11): IndexedDB als bevorzugter Ort (größere Grenzen,
 * robuster), `localStorage` als Rückfall und als Quelle für die einmalige Übernahme alter Spielstände.
 * Werte sind fertig serialisierte Speicherdateien (Text); Schlüssel sind Slot-Namen.
 */
export interface SlotBackend {
  readonly name: 'indexeddb' | 'localstorage';
  getAll(): Promise<Record<string, string>>;
  put(slot: string, value: string): Promise<void>;
  remove(slot: string): Promise<void>;
}

const LS_PREFIX = 'rewind1986.save.';
const DB_NAME = 'rewind1986';
const STORE = 'saves';

export function localStorageBackend(storage?: Storage | null): SlotBackend | null {
  let ls: Storage | null = storage ?? null;
  if (!ls) {
    try {
      ls = window.localStorage;
    } catch {
      return null;
    }
  }
  const s = ls;
  return {
    name: 'localstorage',
    async getAll() {
      const out: Record<string, string> = {};
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k?.startsWith(LS_PREFIX)) {
          const v = s.getItem(k);
          if (v !== null) out[k.slice(LS_PREFIX.length)] = v;
        }
      }
      return out;
    },
    async put(slot, value) {
      s.setItem(LS_PREFIX + slot, value);
    },
    async remove(slot) {
      s.removeItem(LS_PREFIX + slot);
    },
  };
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('IndexedDB-Fehler'));
  });
}

export function indexedDbBackend(factory?: IDBFactory | null): SlotBackend | null {
  let idb: IDBFactory | null | undefined = factory;
  if (idb === undefined) {
    try {
      idb = window.indexedDB;
    } catch {
      idb = null;
    }
  }
  if (!idb) return null;
  const f = idb;
  let dbPromise: Promise<IDBDatabase> | null = null;
  const open = (): Promise<IDBDatabase> => {
    dbPromise ??= new Promise((resolve, reject) => {
      const req = f.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB nicht verfügbar'));
      req.onblocked = () => reject(new Error('IndexedDB blockiert'));
    });
    return dbPromise;
  };
  const tx = async (mode: IDBTransactionMode) => (await open()).transaction(STORE, mode).objectStore(STORE);
  return {
    name: 'indexeddb',
    async getAll() {
      const store = await tx('readonly');
      const keys = (await request(store.getAllKeys())) as string[];
      const values = (await request(store.getAll())) as unknown[];
      const out: Record<string, string> = {};
      keys.forEach((k, i) => {
        if (typeof values[i] === 'string') out[String(k)] = values[i] as string;
      });
      return out;
    },
    async put(slot, value) {
      await request((await tx('readwrite')).put(value, slot));
    },
    async remove(slot) {
      await request((await tx('readwrite')).delete(slot));
    },
  };
}

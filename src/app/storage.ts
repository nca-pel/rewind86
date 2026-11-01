/** Lokale Spielstände im Browser (IndexedDB, Rückfall localStorage). Kein Server, kein Login (GDD §16.4). */
import { createSaveFile, parseSave, serializeSave, type SaveFile } from '../engine/save';
import type { GameState } from '../engine/types';
import { indexedDbBackend, localStorageBackend, type SlotBackend } from './slotBackend';

export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];

export function isSlot(s: string): s is Slot {
  return (SLOTS as readonly string[]).includes(s);
}

/**
 * Ablauf: `initStorage()` lädt beim Start alle Slots aus IndexedDB in einen Zwischenspeicher (danach sind Lesen und
 * Schreiben für die Aufrufer synchron wie bisher; Schreiben/Löschen laufen im Hintergrund durch). Alte Spielstände aus
 * `localStorage` werden einmalig übernommen. Ohne IndexedDB bleibt `localStorage` der Speicherort.
 */
let cache: Record<string, string> = {};
let backend: SlotBackend | null = null;
let fallback: SlotBackend | null = null;
let initialized = false;

export interface StorageOptions {
  idb?: SlotBackend | null;
  local?: SlotBackend | null;
  timeoutMs?: number;
}

export type StorageKind = 'indexeddb' | 'localstorage' | 'none';

export function storageKind(): StorageKind {
  return initialized ? (backend?.name ?? 'none') : 'localstorage';
}

export async function initStorage(opts: StorageOptions = {}): Promise<StorageKind> {
  const idb = opts.idb === undefined ? indexedDbBackend() : opts.idb;
  const local = opts.local === undefined ? localStorageBackend() : opts.local;
  fallback = local;
  cache = {};
  backend = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Zeitüberschreitung')), opts.timeoutMs ?? 3000);
  });
  if (idb) {
    try {
      const fromDb = await Promise.race([idb.getAll(), timeout]);
      cache = { ...fromDb };
      // Einmalige Übernahme alter localStorage-Spielstände (nur, was in IndexedDB noch fehlt)
      if (local) {
        const old = await local.getAll().catch(() => ({}) as Record<string, string>);
        for (const [slot, value] of Object.entries(old)) {
          if (!(slot in cache)) {
            await idb.put(slot, value);
            cache[slot] = value;
          }
          await local.remove(slot).catch(() => undefined);
        }
      }
      backend = idb;
    } catch {
      backend = null;
      cache = {};
    }
  }
  clearTimeout(timer);
  timeout.catch(() => undefined);
  if (!backend && local) {
    cache = await local.getAll().catch(() => ({}) as Record<string, string>);
    backend = local;
  }
  initialized = true;
  return backend?.name ?? 'none';
}

/** Nur für Tests: Zustand zurücksetzen (Rückkehr zum direkten localStorage-Zugriff) */
export function resetStorage(): void {
  cache = {};
  backend = null;
  fallback = null;
  initialized = false;
}

function legacyLocal(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const LEGACY_PREFIX = 'rewind1986.save.';

function readRaw(slot: Slot): string | null {
  if (initialized) return cache[slot] ?? null;
  try {
    return legacyLocal()?.getItem(LEGACY_PREFIX + slot) ?? null;
  } catch {
    return null;
  }
}

function persist(slot: Slot, value: string | null): boolean {
  if (!initialized) {
    try {
      const ls = legacyLocal();
      if (!ls) return false;
      if (value === null) ls.removeItem(LEGACY_PREFIX + slot);
      else ls.setItem(LEGACY_PREFIX + slot, value);
      return true;
    } catch {
      return false;
    }
  }
  if (value === null) delete cache[slot];
  else cache[slot] = value;
  if (!backend) return true; // nur im Speicher: gilt bis zum Neuladen
  const op = value === null ? backend.remove(slot) : backend.put(slot, value);
  void op.catch(() => {
    // Hintergrundfehler (z. B. Speicher voll): zum Rückfall wechseln, damit nichts verloren geht
    if (fallback && fallback !== backend && value !== null)
      void fallback.put(slot, value).catch(() => undefined);
  });
  return true;
}

export function writeSlot(slot: Slot, state: GameState, label?: string): boolean {
  try {
    const file = createSaveFile(
      state,
      label ?? (slot === 'auto' ? 'Automatisch' : `Slot ${slot}`),
      new Date().toISOString(),
    );
    return persist(slot, serializeSave(file));
  } catch {
    return false;
  }
}

export function readSlot(slot: Slot): { ok: true; file: SaveFile } | { ok: false; error: string } | null {
  const raw = readRaw(slot);
  if (raw === null) return null;
  return parseSave(raw);
}

export function listSlots(): Array<{ slot: Slot; file: SaveFile | null; error?: string }> {
  return SLOTS.map((slot) => {
    const r = readSlot(slot);
    if (!r) return { slot, file: null };
    return r.ok ? { slot, file: r.file } : { slot, file: null, error: r.error };
  });
}

export function deleteSlot(slot: Slot): void {
  persist(slot, null);
}

export function downloadSave(state: GameState): void {
  const file = createSaveFile(state, 'Export', new Date().toISOString());
  const blob = new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rewind1986-${state.gameClock.replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

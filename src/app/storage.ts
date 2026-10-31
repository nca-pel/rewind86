/** Lokale Spielstände im Browser (localStorage). Kein Server, kein Login (GDD §16.4). */
import { createSaveFile, parseSave, serializeSave, type SaveFile } from '../engine/save';
import type { GameState } from '../engine/types';

const PREFIX = 'rewind1986.save.';
export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];

export function isSlot(s: string): s is Slot {
  return (SLOTS as readonly string[]).includes(s);
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSlot(slot: Slot, state: GameState, label?: string): boolean {
  try {
    const file = createSaveFile(
      state,
      label ?? (slot === 'auto' ? 'Automatisch' : `Slot ${slot}`),
      new Date().toISOString(),
    );
    window.localStorage.setItem(PREFIX + slot, serializeSave(file));
    return true;
  } catch {
    return false;
  }
}

export function readSlot(slot: Slot): { ok: true; file: SaveFile } | { ok: false; error: string } | null {
  const raw = safeGet(PREFIX + slot);
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
  try {
    window.localStorage.removeItem(PREFIX + slot);
  } catch {
    /* ignorieren */
  }
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

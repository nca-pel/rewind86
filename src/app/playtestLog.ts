/**
 * Lokales Playtest-Protokoll (Ausbauplan Punkt 8): Adventure-Eingaben, die der Parser nicht verstanden hat. Die Daten
 * bleiben im Browser (`localStorage`), werden nie gesendet und lassen sich im Menü abschalten. Gedacht zum Auswerten
 * und Ausbauen des Vokabulars; eingesehen wird das Protokoll in der Entwicklerkonsole (Tab „Parser“).
 */
import type { ParseMissReason } from '../engine/types';
import { loadSettings } from './settings';

const KEY = 'rewind1986.playtest';
export const MAX_ENTRIES = 200;
const MAX_INPUT = 120;

export interface MissEntry {
  /** normalisierte Eingabe (Kleinbuchstaben, Leerzeichen zusammengefasst) */
  input: string;
  reason: ParseMissReason;
  detail?: string;
  count: number;
  /** Spielzeit der letzten Eingabe */
  lastGameTime: string;
  /** Echtzeit der letzten Eingabe (ISO) */
  lastSeen: string;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function store(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLog(s: Store | null = store()): MissEntry[] {
  try {
    const raw = s?.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as MissEntry[]).filter((e) => typeof e?.input === 'string') : [];
  } catch {
    return [];
  }
}

/** Eintrag zusammenführen: gleiche Eingabe + Grund zählen hoch; ältester Eintrag fliegt bei Überlauf raus */
export function mergeMiss(
  log: MissEntry[],
  miss: { input: string; reason: ParseMissReason; detail?: string },
  gameTime: string,
  now: string,
): MissEntry[] {
  const input = miss.input.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT);
  if (!input) return log;
  const next = [...log];
  const i = next.findIndex((e) => e.input === input && e.reason === miss.reason);
  if (i >= 0) next[i] = { ...next[i], count: next[i].count + 1, lastGameTime: gameTime, lastSeen: now };
  else
    next.push({
      input,
      reason: miss.reason,
      ...(miss.detail ? { detail: miss.detail } : {}),
      count: 1,
      lastGameTime: gameTime,
      lastSeen: now,
    });
  if (next.length > MAX_ENTRIES) {
    next.sort((a, b) => a.lastSeen.localeCompare(b.lastSeen));
    next.splice(0, next.length - MAX_ENTRIES);
  }
  return next;
}

export function recordMiss(
  miss: { input: string; reason: ParseMissReason; detail?: string },
  gameTime: string,
  s: Store | null = store(),
  enabled = loadSettings().logMisses,
): void {
  if (!enabled || !s) return;
  try {
    s.setItem(KEY, JSON.stringify(mergeMiss(readLog(s), miss, gameTime, new Date().toISOString())));
  } catch {
    /* Speicher voll oder gesperrt: Protokoll ist optional */
  }
}

export function clearLog(s: Store | null = store()): void {
  try {
    s?.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
}

/** Auswertbarer Text: häufigste zuerst */
export function formatLog(log: MissEntry[]): string {
  return [...log]
    .sort((a, b) => b.count - a.count || a.input.localeCompare(b.input))
    .map(
      (e) => `${e.count}×  ${e.input}  [${e.reason}${e.detail ? `: ${e.detail}` : ''}]  (${e.lastGameTime})`,
    )
    .join('\n');
}

import type { ScreenState } from '../engine/types';

export const COLS = 40;
export const ROWS = 25;

/** Wandelt Text in C64-taugliche Großschreibung um (Umlaute werden umschrieben). */
export function toPetsciiText(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .replace(/ß/g, 'SS')
    .replace(/[^\x20-\x7E←]/g, '?');
}

function trim(screen: ScreenState): void {
  if (screen.lines.length > ROWS) screen.lines.splice(0, screen.lines.length - ROWS);
}

/** Eine logische Zeile ausgeben – wird bei 40 Zeichen umbrochen. */
export function printLine(screen: ScreenState, text: string): void {
  const t = toPetsciiText(text);
  if (t.length === 0) screen.lines.push('');
  for (let i = 0; i < t.length; i += COLS) screen.lines.push(t.slice(i, i + COLS));
  trim(screen);
}

export function clearScreen(screen: ScreenState): void {
  screen.lines = [];
}

export function centered(text: string): string {
  const t = text.slice(0, COLS);
  return ' '.repeat(Math.max(0, Math.floor((COLS - t.length) / 2))) + t;
}

import { stringToPetscii } from '../c64/petscii';
import { newline, printBytes } from '../c64/video';
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
    .replace(/[^\x20-\x7E←↑£π]/g, '?');
}

/** Text an der Cursorposition ausgeben (ohne Zeilenende). */
export function printText(screen: ScreenState, text: string): void {
  printBytes(screen, stringToPetscii(toPetsciiText(text)));
}

/** Eine logische Zeile ausgeben und mit RETURN abschließen. */
export function printLine(screen: ScreenState, text: string): void {
  printText(screen, text);
  newline(screen);
}

export function centered(text: string): string {
  const t = text.slice(0, COLS);
  return ' '.repeat(Math.max(0, Math.floor((COLS - t.length) / 2))) + t;
}

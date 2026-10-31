/**
 * Zeichenkodierung: PETSCII (Byte-Zeichen, wie BASIC sie ausgibt) ↔ Bildschirmcode (was im
 * Bildschirmspeicher steht) ↔ Unicode (für Textausgabe, Tests und Screenreader).
 * Die Abbildungen folgen der allgemein dokumentierten Kodierungslogik; sie enthalten keine ROM-Daten.
 */
import type { CharsetId } from './charset';

/** PETSCII-Steuercodes */
export const PET = {
  WHITE: 5,
  RETURN: 13,
  LOWERCASE: 14,
  DOWN: 17,
  RVS_ON: 18,
  HOME: 19,
  DEL: 20,
  RED: 28,
  RIGHT: 29,
  GREEN: 30,
  BLUE: 31,
  ORANGE: 129,
  SHIFT_RETURN: 141,
  UPPERCASE: 142,
  BLACK: 144,
  UP: 145,
  RVS_OFF: 146,
  CLR: 147,
  INST: 148,
  BROWN: 149,
  LIGHT_RED: 150,
  DARK_GREY: 151,
  GREY: 152,
  LIGHT_GREEN: 153,
  LIGHT_BLUE: 154,
  LIGHT_GREY: 155,
  PURPLE: 156,
  LEFT: 157,
  YELLOW: 158,
  CYAN: 159,
} as const;

/** PETSCII-Farbcode → Farbindex 0–15 */
export const PETSCII_COLORS: Readonly<Record<number, number>> = {
  144: 0,
  5: 1,
  28: 2,
  159: 3,
  156: 4,
  30: 5,
  31: 6,
  158: 7,
  129: 8,
  149: 9,
  150: 10,
  151: 11,
  152: 12,
  153: 13,
  154: 14,
  155: 15,
};

export function isControl(p: number): boolean {
  return p < 32 || (p >= 128 && p < 160);
}

/** Druckbares PETSCII-Zeichen → Bildschirmcode (Steuerzeichen → null) */
export function petsciiToScreen(p: number): number | null {
  if (isControl(p)) return null;
  if (p < 64) return p;
  if (p < 96) return p - 64;
  if (p < 128) return p - 32;
  if (p < 192) return p - 64;
  if (p < 255) return p - 128;
  return 94; // π
}

/**
 * Darstellung eines Steuerzeichens im Quote-Modus (z. B. nach PRINT CHR$(34)): das Zeichen
 * erscheint als inverses Symbol statt ausgeführt zu werden.
 */
export function controlToScreen(p: number): number {
  return (p < 32 ? p + 64 : p - 64) | 0x80;
}

/** Sonderzeichen, die im Quelltext als Unicode vorkommen können */
const UNICODE_TO_PETSCII: Record<string, number> = { '←': 95, '↑': 94, '£': 92, π: 255 };

/**
 * JS-String (Zeichencode = PETSCII-Byte, z. B. aus CHR$) → PETSCII-Bytes.
 * Wenige Unicode-Sonderzeichen werden übersetzt, alles andere außerhalb 0–255 wird zu „?“.
 */
export function stringToPetscii(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const mapped = UNICODE_TO_PETSCII[ch];
    if (mapped !== undefined) out.push(mapped);
    else {
      const c = ch.codePointAt(0)!;
      out.push(c < 256 ? c : 63);
    }
  }
  return out;
}

/** Klartext (ASCII-Semantik, z. B. aus Apps) → Bildschirmcodes */
export function textToScreen(s: string): number[] {
  return [...s].map((ch) => {
    if (ch >= 'a' && ch <= 'z') return ch.charCodeAt(0) - 96;
    const p = stringToPetscii(ch)[0];
    return petsciiToScreen(p) ?? 63;
  });
}

const BASE = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[£]↑← !"#$%&\'()*+,-./0123456789:;<=>?';
/** Unicode-Näherungen der Grafikzeichen 64–127 (für Text- und Screenreader-Ausgabe) */
const GRAPHICS = '─♠│───▔▁▏▕╮╰╯└╲╱┌┐●▁♥▏╭╳○♣▕♦┼▒│π◥ ▌▄▔▁▏▒▕▄◤▕├▗└┐▂┌┴┬┤▎▍▐▀▀▃▟▖▘┘▝▚';

/** Bildschirmcode → Unicode-Zeichen (Revers wird ignoriert) */
export function screenToChar(code: number, set: CharsetId = 'upper'): string {
  const c = code & 0x7f;
  if (c < 64) {
    const ch = BASE[c];
    return set === 'lower' && c >= 1 && c <= 26 ? ch.toLowerCase() : ch;
  }
  if (set === 'lower') {
    if (c >= 65 && c <= 90) return String.fromCharCode(c);
    if (c === 122) return '✓';
  }
  return [...GRAPHICS][c - 64] ?? '?';
}

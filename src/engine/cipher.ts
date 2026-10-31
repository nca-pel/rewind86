/**
 * Verfahren des K-01-Rundschreibens (fiktiv, bewusst mit BASIC nachrechenbar):
 * Wörter werden mit »X« verbunden, jede Ziffer des zwölfstelligen Schlüssels verschiebt den Buchstaben an
 * ihrer Position (zyklisch über den Schlüssel) im Alphabet: C = (P + k) mod 26, entschlüsselt P = (C − k) mod 26.
 */
import { GAME_CONFIG } from '../content/config';

const A = 65;

export const FULL_KEY = GAME_CONFIG.keyStrand.parts.join('');

function shift(text: string, key: string, dir: 1 | -1): string {
  const digits = [...key].map((d) => (/\d/.test(d) ? +d : 0));
  let i = 0;
  let out = '';
  for (const ch of text) {
    const c = ch.charCodeAt(0) - A;
    if (c < 0 || c > 25) continue;
    const k = digits.length ? digits[i % digits.length] : 0;
    out += String.fromCharCode(A + ((c + dir * k + 26) % 26));
    i++;
  }
  return out;
}

/** Klartext → Buchstabenfolge ohne Trenner (Leerzeichen werden zu »X«) */
export function normalizePlain(plain: string): string {
  return plain
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/\s+/g, 'X');
}

export function encrypt(plain: string, key: string): string {
  return shift(normalizePlain(plain), key, 1);
}

/** Entschlüsselt eine Buchstabenfolge (Leerzeichen der Fünfergruppen werden ignoriert) */
export function decrypt(cipher: string, key: string): string {
  return shift(cipher, key, -1);
}

/** Fünfergruppen, fünf Gruppen pro Zeile (passt in 40 Spalten) */
export function groups(letters: string): string[] {
  const g = letters.match(/.{1,5}/g) ?? [];
  const lines: string[] = [];
  for (let i = 0; i < g.length; i += 5) lines.push(g.slice(i, i + 5).join(' '));
  return lines;
}

/** Klartext für den Bildschirm: »X« als Wortgrenze, Zeilen bis 40 Zeichen */
export function readable(letters: string, width = 40): string[] {
  const words = letters.split('X').filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > width) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

export const K01_CIPHERTEXT = encrypt(GAME_CONFIG.keyStrand.plaintext, FULL_KEY);

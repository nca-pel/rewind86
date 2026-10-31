/**
 * Bildschirmspeicher und Bildschirmausgabe im Stil des C64-Betriebssystems.
 *
 * Der Zustand ist ein schlichtes, JSON-serialisierbares Objekt (Bildschirm-RAM, Farb-RAM,
 * VIC-Register, Cursor). Die Ausgaberoutine verarbeitet PETSCII-Steuercodes: Farben, RVS ON/OFF,
 * CLR/HOME, Cursorbewegungen, DEL/INST, Zeichensatzwechsel und den „Quote-Modus“, in dem
 * Steuerzeichen als inverse Symbole erscheinen. Logische Zeilen umfassen wie am Original bis zu
 * zwei Bildschirmzeilen (80 Zeichen) – daher erzeugt eine Ausgabe von genau 40 Zeichen plus
 * RETURN eine Leerzeile.
 */
import {
  CELLS,
  COLOR_RAM,
  CURSOR_COL,
  CURSOR_COLOR,
  CURSOR_ROW,
  DEFAULT_BACKGROUND,
  DEFAULT_BORDER,
  DEFAULT_TEXT,
  RVS_FLAG,
  SCREEN_RAM,
  TEXT_COLS,
  TEXT_ROWS,
  VIC_BACKGROUND,
  VIC_BORDER,
  VIC_CONTROL_1,
  VIC_MEMORY_SETUP,
} from './geometry';
import { PET, PETSCII_COLORS, controlToScreen, isControl, petsciiToScreen, screenToChar } from './petscii';

const SPACE = 32;

export interface VideoState {
  /** Bildschirm-RAM: 1000 Bildschirmcodes (Bit 7 = invers) */
  chars: number[];
  /** Farb-RAM: 1000 Farbindizes 0–15 */
  colors: number[];
  border: number;
  background: number;
  /** Aktuelle Schreibfarbe (Adresse 646) */
  text: number;
  cx: number;
  cy: number;
  /** true = Zeile setzt die vorherige logisch fort */
  links: boolean[];
  rvs: boolean;
  quote: boolean;
  /** Klein-/Großschrift-Zeichensatz aktiv */
  lower: boolean;
  /** Bildschirm abgeschaltet (Register 53265, Bit 4) – nur Rahmenfarbe sichtbar */
  blank: boolean;
}

export function createVideo(
  colors: Partial<Pick<VideoState, 'border' | 'background' | 'text'>> = {},
): VideoState {
  const text = colors.text ?? DEFAULT_TEXT;
  return {
    chars: new Array(CELLS).fill(SPACE),
    colors: new Array(CELLS).fill(text),
    border: colors.border ?? DEFAULT_BORDER,
    background: colors.background ?? DEFAULT_BACKGROUND,
    text,
    cx: 0,
    cy: 0,
    links: new Array(TEXT_ROWS).fill(false),
    rvs: false,
    quote: false,
    lower: false,
    blank: false,
  };
}

/** CLR: Bildschirm löschen (Farb-RAM erhält die aktuelle Schreibfarbe), Cursor nach links oben */
export function clearVideo(v: VideoState): void {
  v.chars.fill(SPACE);
  v.colors.fill(v.text);
  v.links.fill(false);
  v.cx = 0;
  v.cy = 0;
}

function scrollUp(v: VideoState): void {
  v.chars.copyWithin(0, TEXT_COLS);
  v.colors.copyWithin(0, TEXT_COLS);
  v.chars.fill(SPACE, CELLS - TEXT_COLS);
  v.colors.fill(v.text, CELLS - TEXT_COLS);
  v.links.shift();
  v.links.push(false);
  v.links[0] = false;
}

function lineDown(v: VideoState): void {
  v.cy++;
  if (v.cy >= TEXT_ROWS) {
    scrollUp(v);
    v.cy = TEXT_ROWS - 1;
  }
}

/** Ein Bildschirmcode an der Cursorposition, Cursor weiter (mit Zeilenverknüpfung) */
export function putCode(v: VideoState, code: number): void {
  const i = v.cy * TEXT_COLS + v.cx;
  v.chars[i] = v.rvs ? code | 0x80 : code & 0xff;
  v.colors[i] = v.text;
  v.cx++;
  if (v.cx >= TEXT_COLS) {
    v.cx = 0;
    const firstOfLogical = !v.links[v.cy];
    lineDown(v);
    v.links[v.cy] = firstOfLogical;
  }
}

/** RETURN: an den Anfang der nächsten logischen Zeile; RVS und Quote-Modus enden */
export function newline(v: VideoState): void {
  while (v.cy + 1 < TEXT_ROWS && v.links[v.cy + 1]) v.cy++;
  v.cx = 0;
  lineDown(v);
  v.links[v.cy] = false;
  v.rvs = false;
  v.quote = false;
}

function cursorLeft(v: VideoState): void {
  if (v.cx > 0) v.cx--;
  else if (v.cy > 0) {
    v.cy--;
    v.cx = TEXT_COLS - 1;
  }
}

function cursorRight(v: VideoState): void {
  v.cx++;
  if (v.cx >= TEXT_COLS) {
    v.cx = 0;
    lineDown(v);
  }
}

function deleteChar(v: VideoState): void {
  if (v.cx === 0 && !(v.cy > 0 && v.links[v.cy])) return;
  cursorLeft(v);
  const row = v.cy * TEXT_COLS;
  for (let x = v.cx; x < TEXT_COLS - 1; x++) {
    v.chars[row + x] = v.chars[row + x + 1];
    v.colors[row + x] = v.colors[row + x + 1];
  }
  v.chars[row + TEXT_COLS - 1] = SPACE;
}

function insertChar(v: VideoState): void {
  const row = v.cy * TEXT_COLS;
  for (let x = TEXT_COLS - 1; x > v.cx; x--) {
    v.chars[row + x] = v.chars[row + x - 1];
    v.colors[row + x] = v.colors[row + x - 1];
  }
  v.chars[row + v.cx] = SPACE;
}

/** Ein PETSCII-Byte ausgeben (entspricht der Zeichenausgabe des Betriebssystems) */
export function printByte(v: VideoState, p: number): void {
  if (p === PET.RETURN || p === PET.SHIFT_RETURN) return newline(v);
  if (v.quote && isControl(p) && p !== PET.DEL) return putCode(v, controlToScreen(p));
  if (p === 34) v.quote = !v.quote;
  const code = petsciiToScreen(p);
  if (code !== null) return putCode(v, code);
  const color = PETSCII_COLORS[p];
  if (color !== undefined) {
    v.text = color;
    return;
  }
  switch (p) {
    case PET.CLR:
      return clearVideo(v);
    case PET.HOME:
      v.cx = 0;
      v.cy = 0;
      return;
    case PET.RVS_ON:
      v.rvs = true;
      return;
    case PET.RVS_OFF:
      v.rvs = false;
      return;
    case PET.DOWN:
      return lineDown(v);
    case PET.UP:
      if (v.cy > 0) v.cy--;
      return;
    case PET.RIGHT:
      return cursorRight(v);
    case PET.LEFT:
      return cursorLeft(v);
    case PET.DEL:
      return deleteChar(v);
    case PET.INST:
      return insertChar(v);
    case PET.LOWERCASE:
      v.lower = true;
      return;
    case PET.UPPERCASE:
      v.lower = false;
      return;
  }
}

export function printBytes(v: VideoState, bytes: Iterable<number>): void {
  for (const b of bytes) printByte(v, b);
}

/** Schreibt Bildschirmcodes direkt an eine Position (ohne Cursor, ohne Steuercodes) */
export function writeAt(v: VideoState, x: number, y: number, codes: number[], color?: number): void {
  for (let k = 0; k < codes.length; k++) {
    const xx = x + k;
    if (xx < 0 || xx >= TEXT_COLS || y < 0 || y >= TEXT_ROWS) continue;
    v.chars[y * TEXT_COLS + xx] = codes[k];
    v.colors[y * TEXT_COLS + xx] = color ?? v.text;
  }
}

// --------------------------------------------------------------------------- Speicherzugriffe

/** POKE in Video-relevante Adressen; true, wenn die Adresse hier behandelt wurde */
export function pokeVideo(v: VideoState, addr: number, value: number): boolean {
  if (addr >= SCREEN_RAM && addr < SCREEN_RAM + CELLS) {
    v.chars[addr - SCREEN_RAM] = value & 0xff;
    return true;
  }
  if (addr >= COLOR_RAM && addr < COLOR_RAM + CELLS) {
    v.colors[addr - COLOR_RAM] = value & 15;
    return true;
  }
  switch (addr) {
    case VIC_BORDER:
      v.border = value & 15;
      return true;
    case VIC_BACKGROUND:
      v.background = value & 15;
      return true;
    case CURSOR_COLOR:
      v.text = value & 15;
      return true;
    case VIC_MEMORY_SETUP:
      v.lower = (value & 2) !== 0;
      return true;
    case VIC_CONTROL_1:
      v.blank = (value & 16) === 0;
      return true;
    case RVS_FLAG:
      v.rvs = value !== 0;
      return true;
  }
  return false;
}

/** PEEK aus Video-relevanten Adressen; null = nicht zuständig */
export function peekVideo(v: VideoState, addr: number): number | null {
  if (addr >= SCREEN_RAM && addr < SCREEN_RAM + CELLS) return v.chars[addr - SCREEN_RAM];
  // Farb-RAM ist nur 4 Bit breit; die oberen Bits lesen sich als gesetzt
  if (addr >= COLOR_RAM && addr < COLOR_RAM + CELLS) return v.colors[addr - COLOR_RAM] | 240;
  switch (addr) {
    case VIC_BORDER:
      return v.border | 240;
    case VIC_BACKGROUND:
      return v.background | 240;
    case CURSOR_COLOR:
      return v.text;
    case VIC_MEMORY_SETUP:
      return v.lower ? 23 : 21;
    case VIC_CONTROL_1:
      return v.blank ? 11 : 27;
    case RVS_FLAG:
      return v.rvs ? 18 : 0;
    case CURSOR_COL:
      return v.cx + (v.links[v.cy] ? TEXT_COLS : 0);
    case CURSOR_ROW:
      return v.cy;
  }
  return null;
}

// --------------------------------------------------------------------------- Text

/** Eine Bildschirmzeile als Unicode-Text (ohne Abschneiden) */
export function rowText(v: VideoState, y: number, visibleOnly = false): string {
  let s = '';
  for (let x = 0; x < TEXT_COLS; x++) {
    const i = y * TEXT_COLS + x;
    // Zeichen in Hintergrundfarbe (auch inverse) sind auf dem Bildschirm nicht zu sehen
    if (visibleOnly && (v.blank || v.colors[i] === v.background)) s += ' ';
    else s += screenToChar(v.chars[i], v.lower ? 'lower' : 'upper');
  }
  return s;
}

/**
 * Sichtbarer Text: Zeilen bis zur letzten belegten Zeile bzw. bis zum Cursor, rechts gekürzt.
 * In der Cursorzeile bleiben Leerzeichen bis zum Cursor erhalten (z. B. „NAME? “).
 * Zeichen in Hintergrundfarbe fehlen – wie auf dem echten Bildschirm (raw = true: Bildschirm-RAM).
 */
export function videoLines(
  v: VideoState,
  cursor: { x: number; y: number } | null = null,
  raw = false,
): string[] {
  const out: string[] = [];
  let last = -1;
  for (let y = 0; y < TEXT_ROWS; y++) {
    let t = rowText(v, y, !raw).trimEnd();
    if (cursor && y === cursor.y && cursor.x > t.length) t = t.padEnd(cursor.x);
    out.push(t);
    if (t.length) last = y;
  }
  return out.slice(0, last + 1);
}

/** Erzeugt einen Bildschirm aus Textzeilen (für Programme, die zeilenweise zeichnen) */
export function videoFromLines(
  lines: string[],
  opts: { border: number; background: number; text: number; lineColors?: Record<number, number> },
  toCodes: (s: string) => number[],
): VideoState {
  const v = createVideo(opts);
  lines
    .slice(0, TEXT_ROWS)
    .forEach((l, y) => writeAt(v, 0, y, toCodes(l), opts.lineColors?.[y] ?? opts.text));
  return v;
}

export function cloneVideo(v: VideoState): VideoState {
  return { ...v, chars: [...v.chars], colors: [...v.colors], links: [...v.links] };
}

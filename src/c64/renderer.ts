/**
 * Pixelgenaue Darstellung des Textbildschirms (384 × 272 inkl. Rahmen, PAL) und Bildröhreneffekte.
 * Läuft ohne DOM-Abhängigkeit auf einem RGBA-Puffer; die Canvas-Anbindung steht in drawToCanvas.
 */
import { charset } from './charset';
import { BORDER_LEFT, BORDER_TOP, CHAR_H, CHAR_W, FRAME_H, FRAME_W, TEXT_COLS, TEXT_ROWS } from './geometry';
import { PALETTE_RGB } from './palette';
import type { VideoState } from './video';

export interface RenderOptions {
  /** Cursorposition und ob die Blinkphase „an“ ist (Cursor = invertierte Zelle) */
  cursor?: { x: number; y: number; on: boolean } | null;
  /** Rahmenfarbe je Rasterzeile (Länge FRAME_H) – für Rasterbalken-/Ladestreifen-Effekte */
  borderLines?: number[] | null;
  /** Ausgeschaltet: dunkles Glas */
  off?: boolean;
}

export type Rgb = readonly [number, number, number];
const OFF_GLASS: Rgb = [14, 16, 14];

/** Füllt einen RGBA-Puffer der Größe FRAME_W × FRAME_H */
export function renderFrame(out: Uint8ClampedArray, v: VideoState, opts: RenderOptions = {}): void {
  if (opts.off) {
    for (let i = 0; i < FRAME_W * FRAME_H; i++) setPx(out, i, OFF_GLASS);
    return;
  }
  const rom = charset(v.lower ? 'lower' : 'upper');
  const bg = PALETTE_RGB[v.background];
  for (let y = 0; y < FRAME_H; y++) {
    const border = PALETTE_RGB[opts.borderLines?.[y] ?? v.border];
    const ty = y - BORDER_TOP;
    const inRows = !v.blank && ty >= 0 && ty < TEXT_ROWS * CHAR_H;
    const row = Math.floor(ty / CHAR_H);
    const line = ty - row * CHAR_H;
    for (let x = 0; x < FRAME_W; x++) {
      const i = y * FRAME_W + x;
      const tx = x - BORDER_LEFT;
      if (!inRows || tx < 0 || tx >= TEXT_COLS * CHAR_W) {
        setPx(out, i, border);
        continue;
      }
      const col = tx >> 3;
      const cell = row * TEXT_COLS + col;
      let code = v.chars[cell];
      const c = opts.cursor;
      if (c && c.on && c.x === col && c.y === row) code ^= 0x80;
      const bits = rom[code * 8 + line];
      const on = (bits & (0x80 >> (tx & 7))) !== 0;
      setPx(out, i, on ? PALETTE_RGB[v.colors[cell] & 15] : bg);
    }
  }
}

function setPx(out: Uint8ClampedArray, i: number, [r, g, b]: Rgb): void {
  const o = i * 4;
  out[o] = r;
  out[o + 1] = g;
  out[o + 2] = b;
  out[o + 3] = 255;
}

/**
 * PAL-Signalcharakter: Helligkeit (Y) bleibt fast scharf, die Farbanteile (U/V) haben deutlich
 * weniger Bandbreite und verschmieren horizontal – typisch sind farbige Säume an Buchstaben.
 */
export function palBleed(buf: Uint8ClampedArray, w: number, h: number, strength = 1): void {
  const Y = new Float32Array(w);
  const U = new Float32Array(w);
  const V = new Float32Array(w);
  const lumaK = [0.12 * strength, 1 - 0.24 * strength, 0.12 * strength];
  const chromaK = [1, 2, 3, 2, 1].map((k, i) => (i === 2 ? 1 + (k / 9 - 1) * strength : (k / 9) * strength));
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const o = row + x * 4;
      const r = buf[o];
      const g = buf[o + 1];
      const b = buf[o + 2];
      Y[x] = 0.299 * r + 0.587 * g + 0.114 * b;
      U[x] = 0.492 * (b - Y[x]);
      V[x] = 0.877 * (r - Y[x]);
    }
    for (let x = 0; x < w; x++) {
      let yy = 0;
      for (let k = -1; k <= 1; k++) yy += Y[Math.min(w - 1, Math.max(0, x + k))] * lumaK[k + 1];
      let uu = 0;
      let vv = 0;
      for (let k = -2; k <= 2; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        uu += U[xx] * chromaK[k + 2];
        vv += V[xx] * chromaK[k + 2];
      }
      const o = row + x * 4;
      buf[o] = yy + 1.14 * vv;
      buf[o + 1] = yy - 0.395 * uu - 0.581 * vv;
      buf[o + 2] = yy + 2.032 * uu;
    }
  }
}

export interface CrtOptions {
  /** Röhreneffekte: PAL-Farbsäume, Zeilenstruktur, Leuchten */
  crt: boolean;
}

/**
 * Zeichnet den Rohpuffer (FRAME_W × FRAME_H) auf ein Canvas beliebiger Größe.
 *
 * Skalierung „scharf-bilinear“: erst ganzzahlig mit harten Kanten hochskalieren (scratch), dann
 * weich auf die Zielgröße – so bleiben Pixel klar, ohne ungleich breite Spalten.
 * Mit CRT zusätzlich dunkle Zwischenzeilen (das nicht verschachtelte 50-Hz-Bild eines
 * Heimcomputers zeigt sichtbare Zeilenlücken) und leichtes Nachleuchten heller Flächen.
 * Die Zwischenzeilen erscheinen nur, wenn eine Rasterzeile mindestens ca. 2,4 Gerätepixel hoch ist –
 * darunter entstünde Moiré.
 */
export function drawToCanvas(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement | OffscreenCanvas,
  opts: CrtOptions,
  scratch?: HTMLCanvasElement | OffscreenCanvas,
): void {
  const { width: W, height: H } = target.canvas;
  let img: HTMLCanvasElement | OffscreenCanvas = source;
  const k = Math.max(1, Math.ceil(Math.max(W / FRAME_W, H / FRAME_H)));
  if (scratch && k > 1) {
    if (scratch.width !== FRAME_W * k || scratch.height !== FRAME_H * k) {
      scratch.width = FRAME_W * k;
      scratch.height = FRAME_H * k;
    }
    const sg = scratch.getContext('2d') as CanvasRenderingContext2D | null;
    if (sg) {
      sg.imageSmoothingEnabled = false;
      sg.drawImage(source, 0, 0, scratch.width, scratch.height);
      img = scratch;
    }
  }
  target.save();
  target.globalCompositeOperation = 'source-over';
  target.globalAlpha = 1;
  if (typeof target.filter === 'string') target.filter = 'none';
  target.imageSmoothingEnabled = img !== source || opts.crt;
  target.imageSmoothingQuality = 'high';
  target.drawImage(img, 0, 0, W, H);
  if (opts.crt) {
    const rowH = H / FRAME_H;
    if (rowH >= 2.4) {
      target.fillStyle = `rgba(0,0,0,${Math.min(0.28, 0.09 * rowH).toFixed(2)})`;
      const gap = rowH * 0.3;
      for (let y = 0; y < FRAME_H; y++) target.fillRect(0, (y + 1) * rowH - gap, W, gap);
    }
    if (typeof target.filter === 'string') {
      target.globalCompositeOperation = 'lighter';
      target.globalAlpha = 0.12;
      target.filter = `blur(${Math.max(1, rowH * 1.2).toFixed(1)}px)`;
      target.drawImage(source, 0, 0, W, H);
    }
  }
  target.restore();
}

/** Typischer Ladestreifen-Effekt im Rahmen (schnell wechselnde Rasterbalken) */
export function stripeBorder(seed: number, colors: number[]): number[] {
  const out: number[] = new Array(FRAME_H);
  let s = (seed * 2654435761) >>> 0;
  let y = 0;
  while (y < FRAME_H) {
    s = (s * 1103515245 + 12345) >>> 0;
    const h = 2 + ((s >>> 16) % 9);
    const c = colors[(s >>> 8) % colors.length];
    for (let k = 0; k < h && y < FRAME_H; k++) out[y++] = c;
  }
  return out;
}

/**
 * Text im eigenen Zeichensatz auf ein beliebiges Canvas zeichnen (für Demo-Effekte).
 * scale = Pixelgröße, Text in ASCII-Semantik.
 */
export function drawCharsToContext(
  g: CanvasRenderingContext2D,
  codes: number[],
  x: number,
  y: number,
  rgb: Rgb | ((i: number) => Rgb),
  scale = 1,
  yOffset?: (i: number) => number,
): void {
  const rom = charset('upper');
  const maxX = g.canvas.width;
  codes.forEach((code, i) => {
    const ox = x + i * 8 * scale;
    if (ox + 8 * scale < 0 || ox > maxX) return;
    const [r, gg, b] = typeof rgb === 'function' ? rgb(i) : rgb;
    g.fillStyle = `rgb(${r},${gg},${b})`;
    const oy = y + (yOffset?.(i) ?? 0);
    for (let row = 0; row < 8; row++) {
      const bits = rom[code * 8 + row];
      if (!bits) continue;
      for (let col = 0; col < 8; col++)
        if (bits & (0x80 >> col)) g.fillRect(ox + col * scale, oy + row * scale, scale, scale);
    }
  });
}

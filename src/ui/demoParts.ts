/** Zeichenroutinen der acht INTRUDER-Teile (Canvas 384×272, Rahmen 32/36 Pixel). Reine Funktionen von (g, t). */
import { PALETTE_RGB, drawCharsToContext, textToScreen } from '../c64';
import { INTRUDER_GREETINGS } from '../sim/apps/intruder';
import { C64_PALETTE } from './palette';

export const W = 384;
export const H = 272;
export const BX = 32;
export const BY = 36;
const IW = W - 2 * BX;
const IH = H - 2 * BY;

type G = CanvasRenderingContext2D;

/** Text im eigenen Zeichensatz (scale = Pixelgröße) */
export function text(
  g: G,
  s: string,
  x: number,
  y: number,
  color: number | ((i: number) => number),
  scale = 1,
  yOffset?: (i: number) => number,
): void {
  const rgb = typeof color === 'number' ? PALETTE_RGB[color] : (i: number) => PALETTE_RGB[color(i)];
  drawCharsToContext(g, textToScreen(s), x, y, rgb, scale, yOffset);
}

const col = (i: number) => C64_PALETTE[i];
const centerX = (s: string, scale = 1) => Math.round((W - s.length * 8 * scale) / 2);

function clipInner(g: G): void {
  g.beginPath();
  g.rect(BX, BY, IW, IH);
  g.clip();
}

/** Blockbuchstaben (5×7) für das gezeichnete INTRUDER-Logo */
const LOGO_FONT: Record<string, string[]> = {
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
};
const CHROME = [11, 12, 15, 1, 15, 12, 11];

/** Teil 1: gezeichnetes INTRUDER-Logo (Chrom mit Glanzstreifen und Tiefe), darunter das Wappen der Gruppe */
function logo(g: G, t: number): void {
  for (let i = 0; i < 7; i++) {
    const y = BY + 80 + Math.sin((t + i * 7) / 18) * 70;
    g.fillStyle = col([2, 8, 7, 1, 7, 8, 2][i]);
    g.fillRect(0, y, W, 4);
  }
  g.fillStyle = 'rgba(0,0,40,0.55)';
  g.fillRect(BX, BY, IW, IH);

  // Titel: 8 Buchstaben à 5×7 Blöcke
  const cell = 7;
  const word = 'INTRUDER';
  const x0 = Math.round((W - (word.length * 5 * cell + (word.length - 1) * 5)) / 2);
  const y0 = BY + 10;
  const sweep = ((t * 4) % (W + 160)) - 80;
  for (let li = 0; li < word.length; li++) {
    const rows = LOGO_FONT[word[li]];
    const lx = x0 + li * (5 * cell + 5);
    const bob = Math.round(Math.sin((t + li * 9) / 10) * 2);
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (rows[r][c] !== '#') continue;
        const x = lx + c * cell;
        const y = y0 + r * cell + bob;
        g.fillStyle = col(0);
        g.fillRect(x + 3, y + 3, cell, cell);
        g.fillStyle = col(2);
        g.fillRect(x + 2, y + 2, cell, cell);
        const glint = Math.abs(x + y * 0.8 - sweep) < 14;
        g.fillStyle = glint ? col(1) : col(CHROME[(r + Math.floor(t / 8)) % CHROME.length]);
        g.fillRect(x, y, cell - 1, cell - 1);
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.fillRect(x, y, cell - 1, 1);
      }
    }
  }
  g.fillStyle = col(2);
  g.fillRect(x0, y0 + 7 * cell + 8, word.length * 5 * cell + 35, 2);

  // Gruppenlogo: Wappen mit gekreuzten Klingen, Ring mit kreisenden Lichtern und Banderole
  const cx = W / 2;
  const cy = BY + 112;
  g.save();
  g.lineCap = 'round';
  for (const dir of [-1, 1]) {
    g.strokeStyle = col(15);
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(cx - dir * 46, cy - 44);
    g.lineTo(cx + dir * 46, cy + 44);
    g.stroke();
    g.strokeStyle = col(7);
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(cx + dir * 30, cy + 28);
    g.lineTo(cx + dir * 42, cy + 24);
    g.stroke();
  }
  g.fillStyle = col(0);
  g.strokeStyle = col(7);
  g.lineWidth = 4;
  g.beginPath();
  g.arc(cx, cy, 31, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.strokeStyle = col(2);
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, 25, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t / 25;
    g.fillStyle = i === Math.floor(t / 4) % 12 ? col(1) : col(8);
    g.fillRect(cx + Math.cos(a) * 31 - 2, cy + Math.sin(a) * 31 - 2, 4, 4);
  }
  g.restore();
  text(g, '1001', cx - 16, cy - 4, (i) => [7, 1, 7, 1][(i + Math.floor(t / 6)) % 4], 1);
  g.fillStyle = col(2);
  g.fillRect(cx - 70, cy + 40, 140, 17);
  g.fillStyle = col(8);
  g.fillRect(cx - 70, cy + 40, 140, 3);
  g.fillStyle = col(0);
  g.fillRect(cx - 70, cy + 57, 140, 2);
  g.beginPath();
  g.moveTo(cx - 70, cy + 40);
  g.lineTo(cx - 82, cy + 49);
  g.lineTo(cx - 70, cy + 57);
  g.moveTo(cx + 70, cy + 40);
  g.lineTo(cx + 82, cy + 49);
  g.lineTo(cx + 70, cy + 57);
  g.fillStyle = col(2);
  g.fill();
  text(g, 'FIGHTERS', cx - 64, cy + 41, 1, 2);
}

function noBorder(g: G, t: number): void {
  // "Offener Rahmen": Raster und Text im Bereich, in dem normalerweise der Rahmen liegt
  for (let y = 0; y < H; y += 4) {
    if (y > BY && y < H - BY) continue;
    g.fillStyle = col([6, 14, 3, 1, 3, 14][Math.floor((y + t) / 4) % 6]);
    g.fillRect(0, y, W, 3);
  }
  g.fillStyle = col(6);
  g.fillRect(BX, BY, IW, IH);
  // Titel in der Mitte: pulsiert (Zoom), Farben laufen durch
  const title = 'NO BORDER';
  const zoom = 2.4 + Math.sin(t / 14) * 1.6 + Math.sin(t / 5) * 0.2;
  g.save();
  g.translate(W / 2 - title.length * 4 * zoom, H / 2 - 4 * zoom);
  g.scale(zoom, zoom);
  text(g, title, 0, 0, (i) => [1, 7, 13, 3, 14][(i + Math.floor(t / 4)) % 5], 1);
  g.restore();
}

function starfield(g: G, t: number): void {
  const speed = 1 + Math.min(3, t / 200);
  for (let i = 0; i < 140; i++) {
    const z = 1 + (i % 3);
    const x = (((i * 97) % W) - t * z * speed + W * 100) % W;
    g.fillStyle = col(z === 3 ? 1 : z === 2 ? 15 : 11);
    g.fillRect(x, (i * 53) % H, z, z === 3 ? 2 : 1);
  }
  text(g, '1001', BX + 96, BY + 70, Math.floor(t / 10) % 2 ? 7 : 1, 4);
}

const PLASMA_RAMP = [
  [0, 6, 14, 3, 1, 3, 14, 6],
  [0, 9, 2, 8, 7, 1, 7, 8, 2, 9],
  [0, 11, 12, 15, 1, 15, 12, 11],
];

function plasma(g: G, t: number): void {
  const ramp = PLASMA_RAMP[Math.floor(t / 240) % PLASMA_RAMP.length];
  clipInner(g);
  const cell = 4;
  for (let cy = 0; cy < IH / cell; cy++)
    for (let cx = 0; cx < IW / cell; cx++) {
      const v =
        Math.sin(cx / 6 + t / 20) +
        Math.sin(cy / 8 - t / 25) +
        Math.sin((cx + cy) / 10 + t / 30) +
        Math.sin(Math.hypot(cx - 40, cy - 25) / 6 - t / 15);
      const idx = Math.floor(((v + 4) / 8) * ramp.length) % ramp.length;
      g.fillStyle = col(ramp[idx]);
      g.fillRect(BX + cx * cell, BY + cy * cell, cell, cell);
    }
}

const CUBE: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

function wire(g: G, scale: number, a: number, b: number, color: string, cx: number, cy: number): void {
  const pts = CUBE.map(([x, y, z]) => {
    // um Y, dann um X drehen
    const x1 = x * Math.cos(a) + z * Math.sin(a);
    const z1 = -x * Math.sin(a) + z * Math.cos(a);
    const y1 = y * Math.cos(b) - z1 * Math.sin(b);
    const z2 = y * Math.sin(b) + z1 * Math.cos(b);
    const f = 260 / (z2 * 50 + 260 + 150);
    return [cx + x1 * scale * f * 2, cy + y1 * scale * f * 2];
  });
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  for (const [i, j] of EDGES) {
    g.moveTo(pts[i][0], pts[i][1]);
    g.lineTo(pts[j][0], pts[j][1]);
  }
  g.stroke();
}

function vector(g: G, t: number): void {
  clipInner(g);
  g.fillStyle = col(0);
  g.fillRect(BX, BY, IW, IH);
  // Boden-Raster im Hintergrund
  for (let i = 0; i < 10; i++) {
    g.fillStyle = col(i % 2 ? 6 : 11);
    g.fillRect(BX, BY + IH - 4 - i * i * 1.6, IW, 1);
  }
  const cx = W / 2;
  const cy = H / 2 - 6;
  wire(g, 30, t / 40, t / 55, col([1, 7, 13, 3, 14][Math.floor(t / 20) % 5]), cx, cy);
  wire(g, 15, -t / 28, t / 35, col([2, 8, 10][Math.floor(t / 15) % 3]), cx, cy);
}

function tunnel(g: G, t: number): void {
  clipInner(g);
  g.fillStyle = col(0);
  g.fillRect(BX, BY, IW, IH);
  const ramp = [6, 14, 3, 1, 3, 14];
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(t / 90);
  for (let i = 18; i >= 0; i--) {
    const r = ((i * 16 + t * 2.5) % 300) + 4;
    g.strokeStyle = col(ramp[(i + Math.floor(t / 5)) % ramp.length]);
    g.lineWidth = 1 + r / 40;
    g.strokeRect(-r, -r * 0.7, r * 2, r * 1.4);
  }
  g.restore();
}

function sineScroller(g: G, t: number): void {
  clipInner(g);
  for (let y = 0; y < IH; y += 6) {
    g.fillStyle = col([6, 14, 3, 14, 6, 0][Math.floor((y + t * 0.7) / 6) % 6]);
    g.fillRect(BX, BY + y, IW, 5);
  }
  const line1 = '1001 FIGHTERS ';
  const x = BX + IW - ((t * 2.5) % (line1.length * 24 + IW));
  text(
    g,
    line1,
    x,
    BY + 60,
    (i) => [1, 7, 13, 3, 14][(i + Math.floor(t / 4)) % 5],
    3,
    (i) => Math.round(Math.sin((t + i * 12) / 9) * 26),
  );
  const line2 = '*** SID POWER *** THREE VOICES, ONE ATTITUDE *** ';
  const x2 = BX + IW - ((t * 1.5) % (line2.length * 8 + IW));
  text(g, line2, x2, BY + 138, 1, 1, (i) => Math.round(Math.sin((t + i * 8) / 12) * 6));
}

function greetings(g: G, t: number): void {
  clipInner(g);
  g.fillStyle = col(0);
  g.fillRect(BX, BY, IW, IH);
  const lh = 12;
  const total = INTRUDER_GREETINGS.length * lh;
  const off = (t * 0.6 + 90) % (total + IH);
  INTRUDER_GREETINGS.forEach((line, i) => {
    const y = BY + IH - off + i * lh;
    if (y < BY - lh || y > BY + IH - 44) return;
    text(g, line, centerX(line), y, i === 0 ? 7 : [1, 13, 3][i % 3]);
  });
  // Equalizer
  for (let i = 0; i < 20; i++) {
    const level = 0.5 + 0.5 * Math.sin(t / 7 + i * 0.9);
    const h = 4 + level * (0.6 + 0.4 * Math.sin(t / 13 + i)) * 34;
    g.fillStyle = col(h > 28 ? 2 : h > 18 ? 7 : 5);
    g.fillRect(BX + 8 + i * 15, BY + IH - 4 - h, 12, h);
  }
}

export const PART_DRAWERS: Array<(g: G, t: number) => void> = [
  logo,
  noBorder,
  starfield,
  plasma,
  vector,
  tunnel,
  sineScroller,
  greetings,
];

/**
 * Gimmick: Die Bilddateien der Diskette »Schneewitchen« lassen sich nie laden. Der C64 zeigt Pixelsalat, friert ein
 * und setzt sich zurück (wie nach SYS 64738). Es ist nie ein Bild zu sehen.
 */
import { createVideo, type VideoState } from '../../c64/video';
import type { AppState } from '../../engine/types';
import type { AppDef } from './types';

export interface CrashState extends AppState {
  id: 'crash';
  frame: number;
}

/** Bilder mit Datenmüll, dann eingefroren, dann dunkel, dann Reset */
const NOISE = 14;
const FROZEN = 8;
const DARK = 4;

const THOUGHTS = [
  'Der Bildschirm kippt in Pixelsalat, die Rahmenfarbe flackert, die 1541 rattert noch einmal – und der Rechner rührt sich nicht mehr. Dann geht alles aus und wieder an.',
  'Wieder derselbe Absturz: erst Datenmüll, dann Stillstand, dann Neustart. Mit den Bildern stimmt etwas nicht – oder jemand wollte genau das.',
  'Absturz Nummer drei. Entweder sind die Dateien kaputt, oder sie sind absichtlich so gebaut, dass man sie nicht ansehen kann. Neugier hat der C64 jedenfalls nicht belohnt.',
];

function hash(i: number, frame: number): number {
  let h = Math.imul(i + 1, 2654435761) ^ Math.imul(frame + 1, 40503);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return h >>> 0;
}

function garbage(frame: number): VideoState {
  const v = createVideo({ border: hash(0, frame) % 16, background: hash(1, frame) % 16 });
  for (let i = 0; i < v.chars.length; i++) {
    const h = hash(i + 2, frame);
    v.chars[i] = h & 255;
    v.colors[i] = (h >>> 8) % 16;
  }
  return v;
}

export const crashApp: AppDef<CrashState> = {
  id: 'crash',
  tickMs: 90,
  start(ctx) {
    const n = (typeof ctx.state.flags.swCrashes === 'number' ? ctx.state.flags.swCrashes : 0) + 1;
    ctx.state.flags.swCrashes = n;
    ctx.say(THOUGHTS[Math.min(n, THOUGHTS.length) - 1], 'thought');
    return { id: 'crash', frame: 0 };
  },
  inputMode: () => 'keys',
  // Der Rechner hängt: RUN/STOP und alle anderen Tasten bewirken nichts
  key: () => ({}),
  tick(_ctx, app) {
    app.frame += 1;
    return app.frame >= NOISE + FROZEN + DARK ? { reset: true } : {};
  },
  render(_state, app) {
    const f = app.frame;
    if (f < NOISE) {
      const v = garbage(f);
      return { lines: [], border: v.border, background: v.background, text: 1, video: v, flash: true };
    }
    if (f < NOISE + FROZEN) {
      const v = garbage(NOISE - 1);
      return { lines: [], border: v.border, background: v.background, text: 1, video: v };
    }
    const v = createVideo({ border: 0, background: 0 });
    v.blank = true;
    return { lines: [], border: 0, background: 0, text: 0, video: v };
  },
};

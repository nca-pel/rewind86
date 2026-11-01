/**
 * Eigene Komposition für den Titelbildschirm: treibender Agenten-Thriller in e-Moll, 126 BPM
 * (Em – C – Am – B7, durchlaufender Achtelbass, synkopierte Akkordstöße, chromatisch aufsteigendes Motiv,
 * dazu Break mit Aufbau, höhere Wiederholung und Ausklang). Reine Daten wie in demoSong.ts;
 * keine Übernahme fremder Melodien. 36 Takte, danach Wiederholung.
 */
import type { SongStep } from './demoSong';

export const TITLE_BPM = 126;
const STEPS_PER_BAR = 16;

interface Harmony {
  root: number;
  chord: readonly number[];
}
const EM: Harmony = { root: 40, chord: [52, 55, 59] };
const C: Harmony = { root: 36, chord: [48, 52, 55] };
const AM: Harmony = { root: 45, chord: [45, 48, 52] };
const B7: Harmony = { root: 47, chord: [47, 51, 54] };
const PROG = [EM, C, AM, B7];

/** Melodie je Takt: [Position, MIDI-Note, Länge in Sechzehnteln] */
type Line = [number, number, number][];
const NONE: Line[] = [[], [], [], []];

/** Thema: kriechende Halbtonschritte, dann ein Sprung nach oben – und eine Frage, die auf B7 offen bleibt */
const THEME_A: Line[] = [
  [
    [0, 64, 2],
    [2, 65, 2],
    [4, 66, 2],
    [6, 67, 2],
    [8, 66, 2],
    [10, 64, 6],
  ],
  [
    [0, 72, 6],
    [6, 71, 2],
    [8, 67, 4],
    [12, 64, 4],
  ],
  [
    [0, 69, 4],
    [4, 72, 4],
    [8, 76, 4],
    [12, 75, 4],
  ],
  [
    [0, 75, 4],
    [4, 74, 2],
    [6, 72, 2],
    [8, 71, 8],
  ],
];
/** Zweite Runde: eine Oktave höher, dichter */
const THEME_B: Line[] = [
  [
    [0, 76, 2],
    [2, 77, 2],
    [4, 78, 2],
    [6, 79, 2],
    [8, 78, 4],
    [12, 76, 4],
  ],
  [
    [0, 84, 6],
    [6, 83, 2],
    [8, 79, 4],
    [12, 76, 4],
  ],
  [
    [0, 81, 3],
    [3, 84, 3],
    [6, 81, 2],
    [8, 84, 4],
    [12, 83, 4],
  ],
  [
    [0, 87, 4],
    [4, 86, 4],
    [8, 83, 4],
    [12, 81, 2],
    [14, 83, 2],
  ],
];

interface Section {
  bars: number;
  melody: Line[];
  bass: boolean;
  /** Schlagzeug: 0 keins, 1 nur Bassdrum, 2 voll */
  drums: 0 | 1 | 2;
  stabs: boolean;
  pad: boolean;
  arp: boolean;
  /** Aufbau-Rauschen im letzten Takt */
  riser: boolean;
}
const SECTIONS: Section[] = [
  // Intro: Bass allein, dann Herzschlag
  { bars: 4, melody: NONE, bass: true, drums: 1, stabs: false, pad: false, arp: false, riser: true },
  { bars: 8, melody: THEME_A, bass: true, drums: 2, stabs: true, pad: false, arp: false, riser: false },
  // Break: Haltetöne, flirrendes Arpeggio, Anspannung
  { bars: 4, melody: NONE, bass: false, drums: 0, stabs: false, pad: true, arp: true, riser: true },
  { bars: 8, melody: THEME_B, bass: true, drums: 2, stabs: true, pad: false, arp: true, riser: false },
  { bars: 8, melody: THEME_A, bass: true, drums: 2, stabs: true, pad: true, arp: true, riser: false },
  // Ausklang
  { bars: 4, melody: NONE, bass: true, drums: 1, stabs: false, pad: true, arp: false, riser: false },
];

export const TITLE_BARS = SECTIONS.reduce((n, s) => n + s.bars, 0);
export const TITLE_STEPS = TITLE_BARS * STEPS_PER_BAR;

/** Durchlaufender Achtelbass: Grundton, Oktave auf der Synkope, gelegentlich die Quinte */
const BASS_OFFSETS = [0, 0, 12, 0, 0, 7, 12, 0];

export function titleStep(step: number): SongStep {
  const s = ((step % TITLE_STEPS) + TITLE_STEPS) % TITLE_STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const pos = s % STEPS_PER_BAR;
  let secIdx = 0;
  let barInSec = bar;
  while (barInSec >= SECTIONS[secIdx].bars) {
    barInSec -= SECTIONS[secIdx].bars;
    secIdx++;
  }
  const sec = SECTIONS[secIdx];
  const h = PROG[barInSec % 4];
  const lastBar = barInSec === sec.bars - 1;
  const out: SongStep = { section: secIdx, bar, pos };

  if (sec.bass && pos % 2 === 0) {
    out.bass = { note: h.root + BASS_OFFSETS[pos / 2], steps: 2 };
  }
  if (sec.pad && pos === 0) out.pad = h.chord.map((n) => n + 12);
  if (sec.arp && pos % 2 === 0) {
    const order = [0, 1, 2, 1];
    out.arp = h.chord[order[(pos / 2) % 4]] + 24;
  }
  for (const [p, note, len] of sec.melody[barInSec % 4]) {
    if (p === pos) {
      out.lead = note;
      out.leadLen = len;
    }
  }
  // Akkordstöße auf den Synkopen (3 + 3 + 2 + …), Powerchord aus Grundton, Quinte, Oktave
  if (sec.stabs && (pos === 0 || pos === 6 || pos === 10 || pos === 14)) {
    out.guitar = {
      notes: [h.root + 12, h.root + 19, h.root + 24],
      steps: pos === 0 ? 3 : 2,
      mute: pos === 14,
    };
  }
  if (sec.drums >= 1 && (sec.drums === 2 || barInSec >= 2) && pos % 4 === 0) out.kick = true;
  if (sec.drums === 2) {
    if (pos === 4 || pos === 12) out.snare = true;
    if (pos % 2 === 0) out.hat = true;
    if (pos === 14 && barInSec % 2 === 1) out.openHat = true;
  }
  if (pos === 0 && barInSec === 0 && secIdx > 0) out.crash = true;
  if (sec.riser && lastBar) out.riser = (pos + 1) / STEPS_PER_BAR;
  // Fill am Ende der Themenblöcke
  if (sec.drums === 2 && lastBar && pos >= 12) out.snare = true;
  return out;
}

/**
 * Eigene Komposition für den Titelbildschirm: ruhiger, düsterer Agenten-Thriller in d-Moll
 * (Dm – B – Gm – A, langsamer Puls, Haltetöne, sparsame Melodie, ein leises Herzschlag-Pochen).
 * Reine Daten wie in demoSong.ts; 24 Takte, danach Wiederholung.
 */
import type { SongStep } from './demoSong';

export const TITLE_BPM = 76;
const STEPS_PER_BAR = 16;

type Chord = readonly [number, number, number];
interface Harmony {
  chord: Chord;
  root: number;
}
const DM: Harmony = { chord: [50, 53, 57], root: 38 };
const BB: Harmony = { chord: [46, 50, 53], root: 34 };
const GM: Harmony = { chord: [43, 46, 50], root: 31 };
const A: Harmony = { chord: [45, 49, 52], root: 33 };
const PROG = [DM, BB, GM, A];

/** Melodie je Takt: [Position, MIDI-Note, Länge in Sechzehnteln] */
type Line = [number, number, number][];
const NONE: Line = [];
const THEME: Line[] = [
  [[0, 74, 6], [8, 72, 4], [12, 70, 4]],
  [[0, 69, 10], [12, 70, 4]],
  [[0, 67, 6], [8, 70, 4], [12, 69, 4]],
  [[0, 73, 12], [12, 76, 4]],
];
const ANSWER: Line[] = [
  [[0, 77, 8], [8, 76, 4], [12, 74, 4]],
  [[0, 72, 6], [8, 70, 8]],
  [[0, 74, 4], [4, 70, 4], [8, 67, 8]],
  [[0, 69, 10], [12, 73, 2], [14, 76, 2]],
];

/** Abschnitte zu je vier Takten: Melodie, Herzschlag, Hi-Hat, Arpeggio */
interface Section {
  melody: Line[];
  pulse: boolean;
  hat: boolean;
  arp: boolean;
}
const SECTIONS: Section[] = [
  { melody: [NONE, NONE, NONE, NONE], pulse: false, hat: false, arp: true },
  { melody: THEME, pulse: false, hat: false, arp: true },
  { melody: [NONE, NONE, NONE, NONE], pulse: true, hat: false, arp: true },
  { melody: ANSWER, pulse: true, hat: true, arp: true },
  { melody: THEME, pulse: true, hat: true, arp: true },
  { melody: [NONE, NONE, NONE, NONE], pulse: false, hat: false, arp: true },
];

export const TITLE_BARS = SECTIONS.length * 4;
export const TITLE_STEPS = TITLE_BARS * STEPS_PER_BAR;

export function titleStep(step: number): SongStep {
  const s = ((step % TITLE_STEPS) + TITLE_STEPS) % TITLE_STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const pos = s % STEPS_PER_BAR;
  const secIdx = Math.floor(bar / 4);
  const barInSec = bar % 4;
  const sec = SECTIONS[secIdx];
  const h = PROG[barInSec];
  const out: SongStep = { section: secIdx, bar, pos };
  if (pos === 0) out.pad = h.chord.map((n) => n + 12);
  if (pos === 0) out.bass = { note: h.root, steps: 10 };
  if (pos === 10) out.bass = { note: h.root + 12, steps: 3 };
  for (const [p, note, len] of sec.melody[barInSec]) {
    if (p === pos) {
      out.lead = note;
      out.leadLen = len;
    }
  }
  // Arpeggio in Achteln, aufsteigend und wieder zurück
  if (sec.arp && pos % 2 === 0) {
    const order = [0, 1, 2, 1];
    out.arp = h.chord[order[(pos / 2) % 4]] + 24;
  }
  if (sec.pulse && (pos === 0 || pos === 3)) out.kick = true;
  if (sec.hat && pos % 4 === 2) out.hat = true;
  return out;
}

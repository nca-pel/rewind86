/**
 * Eigene Komposition für das Spiel FERNHANDEL (Marsch in C-Dur/A-Moll, SID-inspirierte Stimmen: Quadrat-Lead,
 * Dreieck-Bass, Begleitarpeggio, leichtes Marschschlagzeug). Reine Daten, keine Übernahme. 20 Takte, danach Wiederholung.
 */
import type { SongStep } from './demoSong';

export const FERNHANDEL_BPM = 116;
const STEPS_PER_BAR = 16;

type Chord = readonly [number, number, number];
const C: Chord = [48, 52, 55];
const AM: Chord = [45, 48, 52];
const F: Chord = [41, 45, 48];
const G: Chord = [43, 47, 50];
const EM: Chord = [40, 43, 47];

/** Phrasen zu je vier Takten: Akkord je Takt und Melodie (16 Sechzehntel, 0 = Pause) */
interface Phrase {
  name: string;
  chords: Chord[];
  melody: number[][];
}

const A: Phrase = {
  name: 'THEMA',
  chords: [C, AM, F, G],
  melody: [
    [72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 0, 0],
    [69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 72, 0, 76, 0, 0, 0],
    [65, 0, 69, 0, 72, 0, 69, 0, 65, 0, 69, 0, 72, 0, 77, 0],
    [67, 0, 71, 0, 74, 0, 71, 0, 67, 0, 71, 0, 74, 0, 0, 0],
  ],
};
const A2: Phrase = {
  name: 'LAUF',
  chords: [C, AM, F, G],
  melody: [
    [72, 0, 74, 0, 76, 0, 77, 0, 79, 0, 0, 0, 76, 0, 0, 0],
    [77, 0, 76, 0, 74, 0, 72, 0, 76, 0, 0, 0, 69, 0, 0, 0],
    [74, 0, 72, 0, 71, 0, 72, 0, 74, 0, 77, 0, 76, 0, 74, 0],
    [71, 0, 74, 0, 79, 0, 0, 0, 74, 0, 71, 0, 67, 0, 0, 0],
  ],
};
const B: Phrase = {
  name: 'MITTELTEIL',
  chords: [F, G, EM, AM],
  melody: [
    [77, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 69, 0, 0, 0],
    [74, 0, 0, 0, 76, 0, 77, 0, 79, 0, 0, 0, 74, 0, 0, 0],
    [76, 0, 0, 0, 79, 0, 76, 0, 71, 0, 0, 0, 76, 0, 0, 0],
    [69, 0, 72, 0, 76, 0, 81, 0, 79, 0, 0, 0, 76, 0, 0, 0],
  ],
};

const ORDER: Phrase[] = [A, A2, B, A2, A];

export const FERNHANDEL_BARS = ORDER.length * 4;
export const FERNHANDEL_STEPS = FERNHANDEL_BARS * STEPS_PER_BAR;
export const FERNHANDEL_SECONDS = (FERNHANDEL_STEPS * 60) / FERNHANDEL_BPM / 4;

export function fernhandelStep(step: number): SongStep {
  const s = ((step % FERNHANDEL_STEPS) + FERNHANDEL_STEPS) % FERNHANDEL_STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const pos = s % STEPS_PER_BAR;
  const phraseIdx = Math.floor(bar / 4);
  const barInPhrase = bar % 4;
  const phrase = ORDER[phraseIdx];
  const chord = phrase.chords[barInPhrase];
  const out: SongStep = { section: phraseIdx, bar, pos };
  const lead = phrase.melody[barInPhrase][pos];
  if (lead) out.lead = lead;
  // Oom-pah-Bass: Grundton auf 1 und 3, Quinte auf 2 und 4
  if (pos % 4 === 0) out.bass = { note: chord[0] + ((pos / 4) % 2 ? 7 : 0), steps: 3 };
  // Begleitung auf den Zwischenschlägen
  if (pos % 4 === 2) out.arp = chord[1 + ((pos / 4) % 2 ? 1 : 0)] + 12;
  if (pos === 0 || pos === 8) out.kick = true;
  if (pos === 4 || pos === 12) out.snare = true;
  if (pos % 2 === 0) out.hat = true;
  if (bar === FERNHANDEL_BARS - 1 && pos >= 12) out.snare = true;
  return out;
}

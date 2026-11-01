/**
 * Eigene Komposition für die INTRUDER-Demo (keine Übernahme, SID-inspiriert). Reine Daten und Logik ohne Web-Audio,
 * damit sie testbar ist: `songStep(n)` liefert, was im n-ten Sechzehntel klingen soll. Der Song hat neun Abschnitte
 * mit 88 Takten (bei 132 BPM gut zweieinhalb Minuten), darunter einen Rockteil mit nachgeahmter E-Gitarre und beginnt danach von vorn.
 */

export const BPM = 132;
export const STEPS_PER_BAR = 16;

type Chord = readonly [number, number, number];

/** Am – F – C – G (je zwei Takte) mit Bassgrundtönen */
const PROG_A: { chords: Chord[]; roots: number[] } = {
  chords: [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
  ],
  roots: [45, 41, 36, 43],
};
/** Dm – B – F – C */
/** Rock: Am – F – G – Am (Powerchord-Grundtöne, tief) */
const PROG_R: { chords: Chord[]; roots: number[] } = {
  chords: [
    [57, 60, 64],
    [53, 57, 60],
    [55, 59, 62],
    [57, 60, 64],
  ],
  roots: [45, 41, 43, 45],
};
const PROG_B: { chords: Chord[]; roots: number[] } = {
  chords: [
    [50, 53, 57],
    [46, 50, 53],
    [53, 57, 60],
    [48, 52, 55],
  ],
  roots: [38, 34, 41, 36],
};

type BassStyle = 'none' | 'long' | 'sync' | 'pulse' | 'octave';
type ArpStyle = 'none' | 'sparse' | 'normal' | 'fast';
type DrumStyle = 'none' | 'hat' | 'full' | 'half' | 'rock';

interface Section {
  name: string;
  bars: number;
  prog: typeof PROG_A;
  /** Halbtöne für die ganze Harmonik */
  shift: number;
  bass: BassStyle;
  arp: ArpStyle;
  drums: DrumStyle;
  /** Leitstimme: 0 = keine, 1 = Motive, 2 = Motive eine Oktave höher, 3 = spärlich */
  lead: 0 | 1 | 2 | 3;
  /** Lead-Transposition gegenüber A-Moll-Pentatonik */
  leadShift?: number;
  pad?: boolean;
  /** Rockteil: erste Hälfte Riff mit Powerchords, zweite Hälfte Gitarrensolo über dem Riff */
  rock?: boolean;
  /** letzte Takte: Aufbau (Rauschen steigt) */
  riserBars?: number;
}

export const SECTIONS: Section[] = [
  { name: 'INTRO', bars: 8, prog: PROG_A, shift: 0, bass: 'long', arp: 'sparse', drums: 'hat', lead: 0 },
  { name: 'THEMA', bars: 8, prog: PROG_A, shift: 0, bass: 'sync', arp: 'normal', drums: 'full', lead: 1 },
  {
    name: 'VARIATION',
    bars: 8,
    prog: PROG_A,
    shift: 0,
    bass: 'pulse',
    arp: 'normal',
    drums: 'full',
    lead: 2,
  },
  {
    name: 'ZWEITES THEMA',
    bars: 8,
    prog: PROG_B,
    shift: 0,
    bass: 'sync',
    arp: 'normal',
    drums: 'full',
    lead: 1,
    leadShift: 5,
  },
  {
    name: 'BREAK',
    bars: 8,
    prog: PROG_A,
    shift: 0,
    bass: 'none',
    arp: 'none',
    drums: 'none',
    lead: 3,
    pad: true,
    riserBars: 2,
  },
  { name: 'DROP', bars: 16, prog: PROG_A, shift: 0, bass: 'octave', arp: 'fast', drums: 'full', lead: 2 },
  {
    name: 'ROCK',
    bars: 16,
    prog: PROG_R,
    shift: 0,
    bass: 'pulse',
    arp: 'none',
    drums: 'rock',
    lead: 0,
    rock: true,
  },
  {
    name: 'BRIDGE',
    bars: 8,
    prog: PROG_A,
    shift: 7,
    bass: 'long',
    arp: 'sparse',
    drums: 'half',
    lead: 3,
    pad: true,
  },
  { name: 'FINALE', bars: 8, prog: PROG_A, shift: 2, bass: 'octave', arp: 'fast', drums: 'full', lead: 1 },
];

export const SONG_BARS = SECTIONS.reduce((n, s) => n + s.bars, 0);
export const SONG_STEPS = SONG_BARS * STEPS_PER_BAR;
export const SONG_SECONDS = (SONG_STEPS * 60) / BPM / 4;

/** Leitmotive (zwei Takte = 32 Sechzehntel), MIDI-Noten in A-Moll-Pentatonik, 0 = Pause */
const MOTIVES: number[][] = [
  [
    69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 72, 0, 69, 0, 0, 0, 67, 0, 69, 0, 72, 0, 69, 0, 67, 0, 64, 0, 67, 0, 0,
    0,
  ],
  [
    76, 0, 0, 74, 72, 0, 69, 0, 72, 0, 74, 0, 76, 0, 0, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0, 69, 0, 0,
    0,
  ],
  [
    72, 0, 69, 0, 67, 0, 69, 0, 72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 69, 0, 72, 0, 76, 0, 0, 0, 0, 0, 0,
    0,
  ],
];
/** Reihenfolge der Motive über acht Takte */
const MOTIVE_ORDER = [0, 1, 0, 2];

/** Solophrasen der E-Gitarre (je zwei Takte pro Akkord): [Position, MIDI-Note, Länge in Sechzehnteln, Bending] */
type SoloNote = [number, number, number, 0 | 1];
const SOLO: SoloNote[][] = [
  [
    [0, 76, 3, 0],
    [3, 79, 2, 1],
    [6, 81, 6, 0],
    [14, 79, 2, 0],
    [16, 76, 2, 0],
    [18, 74, 2, 0],
    [20, 72, 4, 1],
    [26, 69, 3, 0],
    [29, 72, 3, 0],
  ],
  [
    [0, 81, 4, 1],
    [6, 79, 2, 0],
    [8, 76, 4, 0],
    [14, 72, 2, 0],
    [16, 74, 3, 0],
    [19, 72, 3, 0],
    [22, 69, 6, 1],
    [30, 72, 2, 0],
  ],
  [
    [0, 74, 3, 0],
    [3, 76, 3, 0],
    [6, 79, 5, 1],
    [12, 81, 4, 0],
    [16, 84, 8, 1],
    [26, 81, 2, 0],
    [28, 79, 2, 0],
    [30, 76, 2, 0],
  ],
  [
    [0, 81, 6, 1],
    [8, 84, 4, 1],
    [12, 81, 2, 0],
    [14, 79, 2, 0],
    [16, 76, 4, 0],
    [20, 79, 4, 0],
    [24, 81, 8, 1],
  ],
];

export interface SongStep {
  section: number;
  bar: number;
  pos: number;
  lead?: number;
  /** Länge des Melodietons in Sechzehnteln (sonst kurz angeschlagen) */
  leadLen?: number;
  arp?: number;
  bass?: { note: number; steps: number };
  /** Haltetöne, nur im ersten Sechzehntel eines Taktes */
  pad?: number[];
  kick?: boolean;
  snare?: boolean;
  hat?: boolean;
  openHat?: boolean;
  /** 0–1: Lautstärke des Aufbau-Rauschens */
  riser?: number;
  /** E-Gitarre, Rhythmus: Powerchord (Grundton, Quinte, Oktave); mute = abgedämpft (Palm Mute) */
  guitar?: { notes: number[]; steps: number; mute: boolean };
  /** E-Gitarre, Solo: Einzelton, bend = von unten angeschlagen, Vibrato bei langen Tönen */
  solo?: { note: number; steps: number; bend: boolean };
  crash?: boolean;
  /** Schlussakkord: alles klingt lange aus */
  hold?: boolean;
}

export function sectionAt(bar: number): { index: number; barInSection: number } {
  let b = ((bar % SONG_BARS) + SONG_BARS) % SONG_BARS;
  for (let i = 0; i < SECTIONS.length; i++) {
    if (b < SECTIONS[i].bars) return { index: i, barInSection: b };
    b -= SECTIONS[i].bars;
  }
  return { index: 0, barInSection: 0 };
}

export function songStep(step: number): SongStep {
  const s = ((step % SONG_STEPS) + SONG_STEPS) % SONG_STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const pos = s % STEPS_PER_BAR;
  const { index, barInSection } = sectionAt(bar);
  const sec = SECTIONS[index];
  const out: SongStep = { section: index, bar: barInSection, pos };
  const chordIdx = Math.floor((barInSection % 8) / 2);
  const chord = sec.prog.chords[chordIdx].map((n) => n + sec.shift) as unknown as Chord;
  const root = sec.prog.roots[chordIdx] + sec.shift;
  const last = index === SECTIONS.length - 1 && barInSection === sec.bars - 1;

  if (last) {
    // Schlussakkord im letzten Takt, danach Stille bis zur Wiederholung
    if (pos === 0) {
      out.hold = true;
      out.kick = true;
      out.lead = 69 + sec.shift;
      out.bass = { note: root, steps: 16 };
      out.pad = [...chord];
    }
    return out;
  }

  // Bass
  const addBass = (note: number, steps: number) => (out.bass = { note, steps });
  switch (sec.bass) {
    case 'long':
      if (pos % 8 === 0) addBass(root, 7);
      break;
    case 'pulse':
      if (pos % 2 === 0) addBass(root, 1.6);
      break;
    case 'sync':
      if ([0, 3, 6, 8, 11, 14].includes(pos)) addBass(root, 2);
      break;
    case 'octave':
      addBass(pos % 2 ? root + 12 : root, 0.9);
      break;
  }

  // Arpeggio: Dreiklang auf-ab, im Drop schneller mit Oktavsprung
  const arpOn =
    sec.arp === 'normal' || sec.arp === 'fast' || (sec.arp === 'sparse' && pos % 2 === 0) || false;
  if (arpOn && !(sec.arp === 'sparse' && barInSection < 4 && index === 0)) {
    const idx = [0, 1, 2, 1][pos % 4];
    const oct = sec.arp === 'fast' && Math.floor(pos / 4) % 2 ? 24 : 12;
    out.arp = chord[idx] + oct;
  }

  // Leitstimme
  if (sec.lead > 0) {
    const motive = MOTIVES[MOTIVE_ORDER[chordIdx % MOTIVE_ORDER.length]];
    const posIn2 = (barInSection % 2) * STEPS_PER_BAR + pos;
    let note = motive[posIn2];
    if (note) {
      if (sec.lead === 3 && posIn2 % 4 !== 0) note = 0;
      if (note) {
        out.lead = note + (sec.leadShift ?? 0) + sec.shift + (sec.lead === 2 ? 12 : 0);
        if (out.lead > 91) out.lead -= 12;
      }
    }
  }

  if (sec.rock) {
    const soloHalf = barInSection >= 8;
    const g = (steps: number, mute: boolean) =>
      (out.guitar = { notes: [root + 12, root + 19, root + 24], steps, mute });
    if (!soloHalf) {
      // Riff: Achtel-Chugs mit offenen Akzenten
      if ([0, 6, 10].includes(pos)) g(pos === 0 ? 4 : 2.5, false);
      else if (pos % 2 === 0 || pos === 15) g(1, true);
    } else {
      if (pos === 0) g(8, false);
      else if (pos === 8) g(6, false);
      else if (pos === 12) g(1, true);
      const phrase = SOLO[chordIdx % SOLO.length];
      const at = (barInSection % 2) * STEPS_PER_BAR + pos;
      const n = phrase.find((x) => x[0] === at);
      if (n) out.solo = { note: n[1], steps: n[2], bend: n[3] === 1 };
    }
    if (pos === 0 && (barInSection === 0 || barInSection === 8 || barInSection % 4 === 0)) out.crash = true;
  }

  if (sec.pad && pos === 0) out.pad = chord.map((n) => n - 12);

  // Schlagzeug (Fill im letzten Takt jeder vier Takte)
  const fill = (barInSection + 1) % 4 === 0 && sec.drums === 'full' && pos >= 12;
  switch (sec.drums) {
    case 'hat':
      if (pos % 2 === 1) out.hat = true;
      if (pos === 0) out.kick = barInSection >= 4;
      break;
    case 'full':
      if ([0, 8, 10].includes(pos)) out.kick = true;
      if (pos === 4 || pos === 12 || fill) out.snare = true;
      if (pos % 2 === 1) out.hat = true;
      if (pos === 6 || pos === 14) out.openHat = true;
      break;
    case 'rock':
      if ([0, 3, 8, 10].includes(pos)) out.kick = true;
      if (pos === 4 || pos === 12 || (barInSection % 4 === 3 && pos >= 12)) out.snare = true;
      if (pos % 2 === 0) out.hat = true;
      break;
    case 'half':
      if (pos === 0) out.kick = true;
      if (pos === 8) out.snare = true;
      if (pos === 4 || pos === 12) out.hat = true;
      break;
  }

  // Aufbau vor dem Drop
  if (sec.riserBars && barInSection >= sec.bars - sec.riserBars) {
    const total = sec.riserBars * STEPS_PER_BAR;
    const done = (barInSection - (sec.bars - sec.riserBars)) * STEPS_PER_BAR + pos;
    out.riser = (done + 1) / total;
    if (done >= total - 4) out.snare = true;
  }
  return out;
}

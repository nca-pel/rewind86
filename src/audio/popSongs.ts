/**
 * Generator für eigene Synthiepop-Songs im Stil der Mitte der 80er (fürs Radio). Alles ist eigene, regelbasierte
 * Komposition: Akkordfolge je Song, Melodie-Motive aus Akkordtönen (per festem Seed), Bass in Achteln,
 * Drumcomputer. Keine Übernahme realer Titel oder Melodien.
 */
import type { SongStep } from './demoSong';

const STEPS_PER_BAR = 16;

export interface PopSpec {
  /** Arbeitstitel (nur intern bzw. für fiktive BFBS-Ansagen) */
  title: string;
  bpm: number;
  /** Grundton als MIDI-Nummer (z. B. 57 = A) */
  root: number;
  minor: boolean;
  /** Akkordfolge als Stufen (0 = I) – je Takt ein Akkord, wiederholt */
  verse: number[];
  chorus: number[];
  seed: number;
  lead: OscillatorType;
}

export interface PopTrack {
  title: string;
  bpm: number;
  lead: OscillatorType;
  steps: number;
  seconds: number;
  at(step: number): SongStep;
}

type Section = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
const FORM: Array<{ s: Section; bars: number }> = [
  { s: 'intro', bars: 4 },
  { s: 'verse', bars: 8 },
  { s: 'chorus', bars: 8 },
  { s: 'verse', bars: 8 },
  { s: 'chorus', bars: 8 },
  { s: 'bridge', bars: 4 },
  { s: 'chorus', bars: 8 },
  { s: 'chorus', bars: 8 },
  { s: 'outro', bars: 4 },
];
export const POP_BARS = FORM.reduce((n, f) => n + f.bars, 0);

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

function rng(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

/** Motiv über zwei Takte: Position (Sechzehntel 0–31), Akkordton-Index (0–4, über die Oktave), Länge */
type Motif = Array<{ pos: number; tone: number; len: number }>;

const RHYTHMS: number[][] = [
  [0, 3, 6, 8, 10, 14],
  [0, 2, 4, 7, 10, 12],
  [2, 4, 6, 8, 11, 14],
  [0, 4, 6, 8, 12],
  [0, 3, 6, 10, 12, 14],
];

function makeMotif(r: () => number, sparse: boolean): Motif {
  const m: Motif = [];
  let tone = Math.floor(r() * 3) + 1;
  for (let half = 0; half < 2; half++) {
    const rhythm = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    const hits = sparse ? rhythm.filter((_, i) => i % 2 === 0) : rhythm;
    hits.forEach((p, i) => {
      // überwiegend Schrittbewegung zwischen Akkordtönen
      tone = Math.max(0, Math.min(5, tone + (r() < 0.5 ? -1 : 1) * (r() < 0.75 ? 1 : 2)));
      const next = hits[i + 1] ?? 16;
      m.push({ pos: half * 16 + p, tone, len: Math.max(1, next - p - (r() < 0.3 ? 1 : 0)) });
    });
  }
  // Phrasenende auf dem Grundton, länger gehalten
  const last = m[m.length - 1];
  last.tone = 0;
  last.len = Math.max(last.len, 4);
  return m;
}

export function makePopSong(spec: PopSpec): PopTrack {
  const scale = spec.minor ? MINOR : MAJOR;
  const note = (degree: number, octave = 0) =>
    spec.root + scale[((degree % 7) + 7) % 7] + 12 * (Math.floor(degree / 7) + octave);
  const chordOf = (degree: number) => [note(degree), note(degree + 2), note(degree + 4)];
  /** Akkordton-Index 0–5 → Note (Index 3–5 = eine Oktave höher) */
  const chordTone = (degree: number, idx: number, octave: number) =>
    chordOf(degree)[idx % 3] + 12 * (octave + Math.floor(idx / 3));

  const r = rng(spec.seed);
  const verseMotif = makeMotif(r, false);
  const verseMotif2 = makeMotif(r, false);
  const chorusMotif = makeMotif(r, true);
  const bridgeMotif = makeMotif(r, true);

  const sections: Array<{ s: Section; start: number; bars: number }> = [];
  let b0 = 0;
  for (const f of FORM) {
    sections.push({ s: f.s, start: b0, bars: f.bars });
    b0 += f.bars;
  }
  const steps = POP_BARS * STEPS_PER_BAR;

  function at(step: number): SongStep {
    const s = Math.max(0, Math.min(steps - 1, step));
    const bar = Math.floor(s / STEPS_PER_BAR);
    const pos = s % STEPS_PER_BAR;
    const sec = sections.find((x) => bar >= x.start && bar < x.start + x.bars)!;
    const barIn = bar - sec.start;
    const prog = sec.s === 'chorus' ? spec.chorus : sec.s === 'bridge' ? [3, 4, 3, 4] : spec.verse;
    const degree = prog[barIn % prog.length];
    const chord = chordOf(degree);
    const out: SongStep = { section: sections.indexOf(sec), bar, pos };
    const last = bar === POP_BARS - 1;

    // Pad: Akkord zu Taktbeginn
    if (pos === 0) out.pad = chord.map((n) => n + 12);
    if (last) {
      if (pos === 0) {
        out.hold = true;
        out.lead = note(0, 2);
        out.bass = { note: note(0, -1), steps: 16 };
        out.crash = true;
      }
      return out;
    }

    // Bass: Achtel (Strophe/Refrain), Viertel im Intro/Outro/Bridge
    const busy = sec.s === 'verse' || sec.s === 'chorus';
    if (busy ? pos % 2 === 0 : pos % 4 === 0)
      out.bass = { note: chord[0] - 12 + (busy && pos % 8 === 6 ? 12 : 0), steps: busy ? 2 : 4 };

    // Schlagzeug
    if (sec.s !== 'bridge' || barIn >= 2) {
      if (pos === 0 || pos === 8 || (sec.s === 'chorus' && pos === 10)) out.kick = true;
      if (pos === 4 || pos === 12) out.snare = true;
      if (pos % 2 === 0) out.hat = true;
      if (sec.s === 'chorus' && pos % 4 === 2) out.openHat = true;
    }
    if (sec.s === 'bridge' && barIn >= 2) out.riser = (barIn - 2 + pos / 16) / 2;
    if (barIn === 0 && pos === 0 && sec.s === 'chorus') out.crash = true;

    // Arpeggio im Refrain und im Intro
    if ((sec.s === 'chorus' || sec.s === 'intro') && pos % 2 === 1) out.arp = chord[(pos >> 1) % 3] + 24;

    // Melodie
    const motif =
      sec.s === 'verse'
        ? barIn < 4
          ? verseMotif
          : verseMotif2
        : sec.s === 'chorus'
          ? chorusMotif
          : sec.s === 'bridge'
            ? bridgeMotif
            : null;
    if (motif) {
      const p = (barIn % 2) * 16 + pos;
      const hit = motif.find((m) => m.pos === p);
      if (hit) {
        const octave = sec.s === 'chorus' ? 2 : 1;
        out.lead = chordTone(degree, hit.tone, octave);
        out.leadLen = hit.len;
      }
    }
    return out;
  }

  const seconds = (steps * 60) / spec.bpm / 4;
  return { title: spec.title, bpm: spec.bpm, lead: spec.lead, steps, seconds, at };
}

/** UKW 1 – Popwelle: fünf eigene Songs, zusammen rund zehn Minuten */
export const POP_SONGS: PopTrack[] = (
  [
    {
      title: 'Neonregen',
      bpm: 118,
      root: 57,
      minor: true,
      verse: [0, 5, 2, 6],
      chorus: [5, 6, 0, 0],
      seed: 11,
      lead: 'square',
    },
    {
      title: 'Sommer auf Kassette',
      bpm: 124,
      root: 60,
      minor: false,
      verse: [0, 4, 5, 3],
      chorus: [3, 4, 0, 5],
      seed: 23,
      lead: 'sawtooth',
    },
    {
      title: 'Telefonzelle',
      bpm: 112,
      root: 55,
      minor: false,
      verse: [0, 3, 0, 4],
      chorus: [5, 3, 0, 4],
      seed: 37,
      lead: 'triangle',
    },
    {
      title: 'Kalter Draht',
      bpm: 120,
      root: 52,
      minor: true,
      verse: [0, 6, 5, 6],
      chorus: [3, 4, 0, 0],
      seed: 41,
      lead: 'square',
    },
    {
      title: 'Spätprogramm',
      bpm: 108,
      root: 62,
      minor: false,
      verse: [0, 2, 3, 4],
      chorus: [3, 0, 4, 5],
      seed: 59,
      lead: 'sawtooth',
    },
  ] satisfies PopSpec[]
).map((s) => makePopSong(s));

/** UKW 3 – BFBS: vier eigene Songs fiktiver Bands (Ansagen in content/radio.ts) */
export const BFBS_SONGS: PopTrack[] = (
  [
    {
      title: 'Paper Lanterns',
      bpm: 122,
      root: 59,
      minor: true,
      verse: [0, 5, 3, 4],
      chorus: [5, 3, 0, 4],
      seed: 71,
      lead: 'square',
    },
    {
      title: 'Motorway Hearts',
      bpm: 128,
      root: 64,
      minor: false,
      verse: [0, 4, 0, 3],
      chorus: [3, 4, 5, 4],
      seed: 83,
      lead: 'sawtooth',
    },
    {
      title: 'Rain on the Rhine',
      bpm: 104,
      root: 53,
      minor: false,
      verse: [0, 5, 3, 4],
      chorus: [3, 4, 0, 0],
      seed: 97,
      lead: 'triangle',
    },
    {
      title: 'Signal Lost',
      bpm: 116,
      root: 56,
      minor: true,
      verse: [0, 0, 5, 6],
      chorus: [5, 6, 2, 4],
      seed: 113,
      lead: 'square',
    },
  ] satisfies PopSpec[]
).map((s) => makePopSong(s));

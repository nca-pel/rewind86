/**
 * Klingel eines Post-Telefons der 80er (elektromechanischer Wecker, z. B. Tischapparat mit zwei Glockenschalen):
 * Der Rufstrom (25 Hz) lässt den Klöppel abwechselnd an zwei Schalen schlagen. Jede Schale ist ein gedämpfter
 * Resonator mit mehreren, leicht unharmonischen Teiltönen; dazu ein kurzes metallisches Anschlaggeräusch.
 * Rufrhythmus der Bundespost: 1 s Klingeln, 4 s Pause. Rein synthetisch berechnet – keine Aufnahme.
 */

export const RING_ON_S = 1.0;
export const RING_PERIOD_S = 5.0;
/** Rufstrom-Frequenz in Deutschland; der Klöppel schlägt je Halbwelle eine Schale an */
export const RING_CURRENT_HZ = 25;

/** Teiltöne der beiden Schalen (Hz) mit relativer Lautstärke und Abklingzeit (s) */
const BELLS: Array<Array<{ f: number; a: number; decay: number }>> = [
  [
    { f: 1630, a: 1.0, decay: 0.55 },
    { f: 3780, a: 0.55, decay: 0.32 },
    { f: 5460, a: 0.3, decay: 0.2 },
    { f: 7940, a: 0.12, decay: 0.1 },
  ],
  [
    { f: 1755, a: 0.95, decay: 0.5 },
    { f: 4010, a: 0.5, decay: 0.3 },
    { f: 5900, a: 0.26, decay: 0.18 },
    { f: 8300, a: 0.1, decay: 0.09 },
  ],
];

/**
 * Einen Rufzyklus (Klingeln plus Ausklingen) berechnen. Länge: RING_ON_S + Ausklingzeit.
 * Ergebnis ist auf ±0,9 normiert.
 */
export function renderBell(sampleRate: number, tail = 0.8): Float32Array {
  const n = Math.floor(sampleRate * (RING_ON_S + tail));
  const out = new Float32Array(n);
  const strikeEvery = Math.round(sampleRate / (RING_CURRENT_HZ * 2));
  const ringSamples = Math.floor(sampleRate * RING_ON_S);
  // Resonatoren: y[n] = 2 r cos(w) y[n-1] − r² y[n-2] + x[n]
  const res = BELLS.map((parts) =>
    parts.map((p) => {
      const r = Math.exp(-1 / (p.decay * sampleRate));
      return { a: p.a, c1: 2 * r * Math.cos((2 * Math.PI * p.f) / sampleRate), c2: -r * r, y1: 0, y2: 0 };
    }),
  );
  let seed = 12345;
  let click = 0;
  let strike = 0;
  for (let i = 0; i < n; i++) {
    // Klöppelschlag: abwechselnd Schale 0 und 1, leicht schwankende Stärke (Mechanik)
    let hit = -1;
    let force = 0;
    if (i < ringSamples && i % strikeEvery === 0) {
      hit = strike % 2;
      seed = (seed * 16807) % 2147483647;
      force = 0.75 + 0.25 * (seed / 2147483647);
      // Anlaufen und Abfallen des Ankers
      const env = Math.min(1, i / (sampleRate * 0.05), (ringSamples - i) / (sampleRate * 0.03));
      force *= Math.max(0.2, env);
      click = force * 0.35;
      strike++;
    }
    let s = 0;
    for (let b = 0; b < res.length; b++) {
      for (const p of res[b]) {
        const x = b === hit ? force * p.a * 0.02 : 0;
        const y = p.c1 * p.y1 + p.c2 * p.y2 + x;
        p.y2 = p.y1;
        p.y1 = y;
        s += y;
      }
    }
    // metallisches Klicken des Klöppels (kurzes, abklingendes Rauschen)
    if (click > 0.001) {
      seed = (seed * 16807) % 2147483647;
      s += click * ((seed / 2147483647) * 2 - 1) * 0.15;
      click *= 0.93;
    }
    out[i] = s;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < n; i++) out[i] = (out[i] / peak) * 0.9;
  // Ende des Puffers sanft ausblenden (kein Knacken)
  const fade = Math.floor(sampleRate * 0.25);
  for (let i = 0; i < fade && i < n; i++) out[n - 1 - i] *= i / fade;
  return out;
}

import { describe, expect, it } from 'vitest';
import { TITLE_BARS, TITLE_STEPS, titleStep } from '../audio/titleSong';

describe('Titelmusik', () => {
  it('wiederholt sich nach TITLE_STEPS nahtlos', () => {
    for (const n of [0, 5, 100, 333, TITLE_STEPS - 1]) {
      expect(titleStep(n + TITLE_STEPS)).toEqual(titleStep(n));
    }
  });

  it('hat Bass, Melodie, Schlagzeug und Aufbau und bleibt im Notenbereich', () => {
    let lead = 0;
    let bass = 0;
    let kick = 0;
    let riser = 0;
    for (let n = 0; n < TITLE_STEPS; n++) {
      const e = titleStep(n);
      if (e.lead) {
        lead++;
        expect(e.lead).toBeGreaterThanOrEqual(48);
        expect(e.lead).toBeLessThanOrEqual(96);
      }
      if (e.bass) bass++;
      if (e.kick) kick++;
      if (e.riser) riser++;
    }
    expect(TITLE_BARS).toBe(36);
    expect(lead).toBeGreaterThan(60);
    expect(bass).toBeGreaterThan(200);
    expect(kick).toBeGreaterThan(100);
    expect(riser).toBeGreaterThan(0);
  });
});

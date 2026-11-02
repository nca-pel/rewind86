import { describe, expect, test } from 'vitest';
import { OBJECT_BY_ID } from '../content/objects';
import { Session } from './helpers';

/** Das abgedruckte Listing wird aus der Zeitschrift genommen – so wie es der Spieler tippt. */
function listingLines(): string[] {
  const text = OBJECT_BY_ID.mag_listing.description[0].text;
  return text.split('\n').filter((l) => /^\d+ /.test(l));
}

describe('P18 CODE-KNACKER (Freitagabend)', () => {
  test('LIES LISTING entdeckt das Rätsel, das Listing ist abtippbar und knackbar', () => {
    const s = new Session();
    expect(s.a('lies listing')).toMatch(/CODE-KNACKER/);
    expect(s.has('listing_read')).toBe(true);
    expect(s.state.puzzles.P18).toBe('discovered');

    s.a('schalte computer ein');
    for (const l of listingLines()) s.c(l);
    expect(s.c('RUN')).toContain('TIP?');
    expect(s.c('1234')).toMatch(/RICHTIG: \d\s+ZIFFERN DABEI: \d/);

    // Systematisch alle 1296 Codes probieren: irgendwann meldet das Spiel den Erfolg
    let out = '';
    outer: for (let a = 1; a < 7; a++)
      for (let b = 1; b < 7; b++)
        for (let c = 1; c < 7; c++)
          for (let d = 1; d < 7; d++) {
            out = s.c(`${a}${b}${c}${d}`);
            if (out.includes('GEKNACKT')) break outer;
          }
    expect(out).toContain('CODE GEKNACKT IN');
    expect(s.has('knacker_won')).toBe(true);
    expect(s.state.puzzles.P18).toBe('solved');
  });

  test('Freitagabend 19:30: Hinweis auf das Listing, solange es nicht gelesen wurde', () => {
    const s = new Session();
    s.do({ type: 'dev', text: 'zeit 1986-11-14T19:25' });
    const out = s.a('warte 10');
    expect(out).toMatch(/Listing des Monats/);
  });
});

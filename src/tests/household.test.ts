import { Session } from './helpers';

const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

function start(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  return s;
}

function doorAt(clock: string, seed?: number): string {
  const s = start();
  if (seed !== undefined) s.state.rngSeed = seed;
  dev(s, `zeit ${clock}`);
  return s.a('öffne tür');
}

describe('Tür öffnen: Szene nach Wochentag und Tageszeit', () => {
  test('Sonntagvormittag, Samstagnachmittag, Abendnachrichten, Nacht und Feiertag klingen verschieden', () => {
    expect(doorAt('1986-11-16T11:00')).toMatch(/Kirchenglocken|Sonntagsbraten|Braten/);
    expect(doorAt('1986-11-15T16:00')).toMatch(/Bundesliga|Tor in Dortmund/);
    expect(doorAt('1986-11-18T19:45')).toMatch(/Tagesschau|Nachrichten/);
    expect(doorAt('1986-11-18T23:40')).toMatch(/dunkel|Schnarchen|Straßenlaterne|Standuhr/);
    expect(doorAt('1986-11-19T10:00')).toMatch(/Buß- und Bettag/);
  });

  test('Zufallsauswahl ist deterministisch (gleicher Startwert, gleicher Text)', () => {
    expect(doorAt('1986-11-18T21:00', 5)).toBe(doorAt('1986-11-18T21:00', 5));
  });

  test('Die Mutter fragt gelegentlich, aber nie nachts, und es ändert nichts am Spielstand', () => {
    let asked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = start();
      s.state.rngSeed = seed;
      dev(s, 'zeit 1986-11-17T15:00');
      const rel = JSON.stringify(s.state.relationships);
      const out = s.a('öffne tür');
      if (/MUTTER|von unten/.test(out)) asked++;
      expect(JSON.stringify(s.state.relationships)).toBe(rel);
      expect(s.state.flags.gameOver).toBeFalsy();
    }
    expect(asked).toBeGreaterThan(5);
    expect(asked).toBeLessThan(55);
    for (let seed = 1; seed <= 30; seed++) {
      expect(doorAt('1986-11-18T23:40', seed)).not.toMatch(/von unten/);
    }
  });
});

describe('Oma ruft an', () => {
  function ringingSession(): Session | null {
    for (let seed = 1; seed <= 80; seed++) {
      const s = start();
      s.state.rngSeed = seed;
      dev(s, 'zeit 1986-11-18T16:25');
      s.a('warte 10');
      if (s.state.telecom.ringing === 'oma') return s;
    }
    return null;
  }

  test('Gelegentlich klingelt es, Abnehmen führt ein kurzes Gespräch, ohne Folgen', () => {
    const s = ringingSession()!;
    expect(s).not.toBeNull();
    const rel = JSON.stringify(s.state.relationships);
    const out = s.a('nimm hörer');
    expect(out).toMatch(/Oma/);
    expect(s.state.telecom.ringing).toBeNull();
    expect(s.state.telecom.handset).toBe('cradle');
    expect(JSON.stringify(s.state.relationships)).toBe(rel);
    expect(s.state.flags.omaCalls).toBe(1);
  });

  test('Verpasst Jan den Anruf, nimmt die Mutter ab', () => {
    const s = ringingSession()!;
    s.a('warte 15');
    expect(s.state.telecom.ringing).toBeNull();
    expect(s.log.map((l) => l.text).join('\n')).toMatch(/Das war Oma/);
  });

  test('Nie mehr als dreimal und nicht, wenn Jan online ist', () => {
    const s = start();
    s.state.flags.omaCalls = 3;
    for (let seed = 1; seed <= 30; seed++) {
      s.state.rngSeed = seed;
      dev(s, 'zeit 1986-11-18T16:25');
      s.a('warte 10');
    }
    expect(s.state.telecom.ringing).not.toBe('oma');
  });
});

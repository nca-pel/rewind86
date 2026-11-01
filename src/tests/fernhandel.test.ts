import {
  FH_CITIES,
  FH_DAYS,
  FH_START_CASH,
  FH_START_DEBT,
  basePrice,
  buy,
  deliver,
  fare,
  handleKey,
  holdUsed,
  netWorth,
  newGame,
  price,
  sell,
  travel,
  upgrade,
  type FhState,
} from '../content/fernhandel';
import { Session } from './helpers';

/** Einfacher Spielbot: verkauft alles, kauft die Ware mit dem besten erwarteten Gewinn und fährt zum Zielort */
function bot(world: number): FhState {
  const st = newGame(world);
  while (st.mode !== 'end') {
    for (let g = 0; g < 5; g++) sell(st, g, 999);
    let best = { g: 0, to: (st.city + 1) % FH_CITIES.length, gain: 0 };
    for (let g = 0; g < 5; g++) {
      for (let to = 0; to < FH_CITIES.length; to++) {
        if (to === st.city) continue;
        const units = Math.min(st.capacity, Math.floor(st.cash / price(st, g)));
        const gain =
          (basePrice(st, to, g, st.day + 1) * 0.85 - price(st, g) * 1.15) * units - fare(st.city, to);
        if (gain > best.gain) best = { g, to, gain };
      }
    }
    if (best.gain > 0) buy(st, best.g, 999, 100);
    if (st.cash > 4000 && st.debt > 0) for (let i = 0; i < 4; i++) handleKey(st, 'T');
    if (st.cash > 5000 && st.capacity < 60) handleKey(st, 'U');
    handleKey(st, 'R');
    handleKey(st, String(best.to + 1));
  }
  return st;
}

describe('FERNHANDEL: Spiellogik', () => {
  test('Start: Kasse, Kredit, leeres Lager; Preise sind deterministisch', () => {
    const a = newGame(1986);
    const b = newGame(1986);
    expect(a.cash).toBe(FH_START_CASH);
    expect(a.debt).toBe(FH_START_DEBT);
    expect(holdUsed(a)).toBe(0);
    for (let g = 0; g < 5; g++) expect(price(a, g)).toBe(price(b, g));
    expect(newGame(1987).seed).not.toBe(a.seed);
  });

  test('Kaufen treibt den Preis hoch, Verkaufen drückt ihn; Lager und Kasse werden begrenzt', () => {
    const st = newGame(1986);
    const p0 = price(st, 0);
    buy(st, 0, 5);
    expect(st.hold[0]).toBe(5);
    expect(price(st, 0)).toBeGreaterThan(p0);
    const cash = st.cash;
    sell(st, 0, 5);
    expect(st.hold[0]).toBe(0);
    expect(st.cash).toBeGreaterThan(cash);
    expect(price(st, 0)).toBe(p0);
    buy(st, 0, 999);
    expect(holdUsed(st)).toBeLessThanOrEqual(st.capacity);
    buy(st, 1, 1);
    expect(st.msg).toMatch(/LAGER VOLL|KASSE/);
    st.cash = 0;
    st.hold = [0, 0, 0, 0, 0];
    buy(st, 0, 1);
    expect(st.msg).toBe('KASSE REICHT NICHT.');
  });

  test('Reisen kostet Fahrgeld und einen Tag, Zinsen steigen; nach Tag 30 ist Schluss mit Wertung', () => {
    const st = newGame(1986);
    const cash = st.cash;
    travel(st, 1);
    expect(st.city).toBe(1);
    expect(st.day).toBe(2);
    expect(st.cash).toBeLessThanOrEqual(cash - fare(0, 1));
    expect(st.debt).toBeGreaterThan(FH_START_DEBT);
    let to = 2;
    while (st.mode !== 'end') {
      travel(st, to);
      to = (to + 1) % FH_CITIES.length;
      if (to === st.city) to = (to + 1) % FH_CITIES.length;
    }
    expect(st.day).toBe(FH_DAYS + 1);
    expect(st.final).toBe(netWorth(st));
    expect(st.final).toBeLessThan(0);
  });

  test('Lagerausbau und Telex-Auftrag', () => {
    const st = newGame(1986);
    st.cash = 5000;
    upgrade(st);
    expect(st.capacity).toBe(40);
    expect(st.cash).toBe(3500);
    st.order = { city: 0, good: 0, qty: 3, deadline: 5, reward: 700 };
    deliver(st);
    expect(st.msg).toContain('BRAUCHST');
    st.hold[0] = 3;
    deliver(st);
    expect(st.cash).toBe(4200);
    expect(st.order).toBeNull();
  });

  test('ein einfacher Handelsbot kann das Spiel beenden und kommt auf eine Wertung', () => {
    const st = bot(1986);
    expect(st.mode).toBe('end');
    // Balance: kluges Handeln lohnt sich deutlich, ist aber weit vom Rekord (50000) entfernt
    for (const w of [1986, 1987, 1988, 1989, 1990]) {
      const f = bot(w).final ?? 0;
      expect(f).toBeGreaterThan(8000);
      expect(f).toBeLessThan(50000);
    }
  });
});

describe('FERNHANDEL: im Spiel (Diskette)', () => {
  function playing(): Session {
    const s = new Session();
    s.a('nimm hörer');
    s.a('frage ralf nach dem spiel');
    s.a('lege auf');
    s.a('warte');
    s.a('untersuche diskette');
    s.a('lege diskette ins laufwerk');
    s.a('schalte computer ein');
    s.c('LOAD"*",8');
    s.c('RUN');
    s.key('SPACE');
    return s;
  }

  test('Leertaste startet das Spiel; Handel, Reise, Intro-Rückkehr', () => {
    const s = playing();
    expect(s.screen()).toContain('FERNHANDEL   TAG 01/30  HAMBURG');
    s.key('M');
    expect(s.screen()).toMatch(/LAGER 30\/30/);
    s.key('R');
    expect(s.screen()).toContain('WOHIN?');
    const t0 = s.state.gameClock;
    s.key('3');
    expect(s.screen()).toContain('TAG 02/30  FRANKFURT');
    expect(JSON.stringify(s.state.gameClock)).not.toBe(JSON.stringify(t0));
    s.key('A');
    expect(s.screen()).toContain('VERKAUFT');
    s.key('H');
    expect(s.screen()).toContain('HILFE');
    s.key('X');
    s.key('I');
    expect((s.state.computer.app as unknown as { phase: string }).phase).toBe('logo');
  });

  test('Spielstand bleibt beim Speichern erhalten, Intro und Pfeil bleiben unverändert', () => {
    const s = playing();
    s.key('B');
    const copy = structuredClone(s.state.computer.app) as unknown as { game: FhState };
    expect(copy.game.hold.reduce((a, b) => a + b, 0)).toBe(1);
    s.key('I');
    while ((s.state.computer.app as unknown as { phase: string }).phase !== 'credits') s.key('RETURN');
    expect(s.screen()).toContain('←');
    s.key('ARROW_LEFT');
    expect(s.state.computer.app?.id).toBe('modk');
  });
});

describe('FERNHANDEL: Musik', () => {
  test('20 Takte, deterministisch, Noten im Bereich, Wiederholung, Lead/Bass/Schlagzeug vorhanden', async () => {
    const { FERNHANDEL_BARS, FERNHANDEL_SECONDS, FERNHANDEL_STEPS, fernhandelStep } = await import(
      '../audio/fernhandelSong'
    );
    expect(FERNHANDEL_BARS).toBe(20);
    expect(FERNHANDEL_SECONDS).toBeGreaterThan(40);
    let lead = 0;
    let bass = 0;
    let kick = 0;
    for (let i = 0; i < FERNHANDEL_STEPS; i++) {
      const e = fernhandelStep(i);
      expect(fernhandelStep(i)).toEqual(e);
      for (const n of [e.lead, e.arp, e.bass?.note]) {
        if (n === undefined) continue;
        expect(n).toBeGreaterThanOrEqual(36);
        expect(n).toBeLessThanOrEqual(96);
      }
      if (e.lead) lead++;
      if (e.bass) bass++;
      if (e.kick) kick++;
    }
    expect(lead).toBeGreaterThan(80);
    expect(bass).toBe(FERNHANDEL_BARS * 4);
    expect(kick).toBe(FERNHANDEL_BARS * 2);
    expect(fernhandelStep(FERNHANDEL_STEPS)).toEqual(fernhandelStep(0));
  });
});

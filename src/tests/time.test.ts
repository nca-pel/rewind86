import { GAME_CONFIG } from '../content/config';
import { addMinutes, diffMinutes, formatClock } from '../engine/clock';
import { Ctx } from '../engine/context';
import { scheduleEvent } from '../engine/effects';
import { advanceTime, fireEvent } from '../engine/time';
import { Session } from './helpers';

describe('Spieluhr', () => {
  test('Datumsrechnung unabhängig von Zeitzone', () => {
    expect(addMinutes('1986-11-14T23:50', 20)).toBe('1986-11-15T00:10');
    expect(diffMinutes('1986-11-15T00:10', '1986-11-14T23:50')).toBe(20);
    expect(formatClock(GAME_CONFIG.startDate)).toMatch(/^Freitag, 14\.11\.1986/);
  });

  test('Uhr läuft nur bei Aktionen, nicht bei Meta-Befehlen oder C64-Animationstakt', () => {
    const s = new Session();
    const t0 = s.state.gameClock;
    s.a('HILFE');
    s.a('INVENTAR');
    s.a('ZEIT');
    s.do({ type: 'c64tick' });
    expect(s.state.gameClock).toBe(t0);
    s.a('untersuche radio');
    expect(diffMinutes(s.state.gameClock, t0)).toBe(1);
  });
});

describe('Ereignisse (GDD §17.3, §19.5)', () => {
  test('WARTE 120 MINUTEN verarbeitet terminierte Ereignisse chronologisch', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte 20'); // Ralf kommt
    s.state.gameClock = '1986-11-14T17:40';
    s.log = [];
    s.a('WARTE 120 MINUTEN');
    const texts = s.log.map((l) => l.text);
    const iHome = texts.findIndex((t) => t.includes('von der Arbeit zurück'));
    const iPhone = texts.findIndex((t) => t.includes('Oma'));
    expect(iHome).toBeGreaterThan(-1);
    expect(iPhone).toBeGreaterThan(iHome);
    expect(s.state.firedEvents).toEqual(expect.arrayContaining(['ev_father_home', 'ev_father_phone']));
  });

  test('Wichtiges Ereignis unterbricht WARTE fair', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    const t0 = s.state.gameClock;
    const out = s.a('warte 60');
    expect(out).toMatch(/Haustür/);
    expect(diffMinutes(s.state.gameClock, t0)).toBe(12);
  });

  test('Bereits gefeuerte Ereignis-ID löst kein doppeltes Pflichtereignis aus', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte 20');
    const ctx = new Ctx(structuredClone(s.state));
    fireEvent(ctx, 'ev_doorbell');
    scheduleEvent(ctx, 'ev_doorbell', 1);
    advanceTime(ctx, 5);
    expect(ctx.log.some((l) => l.text.includes('Haustür'))).toBe(false);
    expect(
      ctx.state.scheduledEvents.filter((e) => e.id === 'ev_doorbell' && e.status === 'pending'),
    ).toHaveLength(0);
  });

  test('Nach Laden wird ein Ereignis nicht erneut ausgelöst', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte 20');
    const reloaded = new Session(false);
    reloaded.state = JSON.parse(JSON.stringify(s.state));
    reloaded.a('warte 30');
    expect(reloaded.log.filter((l) => l.text.includes('Er drückt dir eine Diskette'))).toHaveLength(0);
  });

  test('Klingeln bleibt bis zum Abheben bestehen (Schlüsselinformation nicht verpassbar)', () => {
    const s = new Session();
    s.a('warte 30');
    expect(s.state.telecom.ringing).toBe('ralf');
    expect(s.log.some((l) => l.text.includes('Telefon! Das ist bestimmt Ralf'))).toBe(true);
    expect(s.a('nimm hörer')).toMatch(/Ralf/);
  });

  test('Determinismus: gleiche Befehle → gleicher Zustand', () => {
    const cmds = ['nimm hörer', 'frage nach dem spiel', 'lege auf', 'warte', 'öffne schublade', 'nimm 1001'];
    const a = new Session();
    const b = new Session();
    for (const c of cmds) {
      a.a(c);
      b.a(c);
    }
    expect(a.state).toEqual(b.state);
  });
});

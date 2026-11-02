import { describe, expect, test } from 'vitest';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { Session } from './helpers';

/** Nach dem Prolog: Modul verlassen, Hörer aufgelegt */
function afterSlice(): Session {
  const s = new Session(false);
  s.state = milestoneState('end', step)!;
  if (s.state.computer.app?.id === 'modk') s.key('4');
  return s;
}

const zeit = (s: Session, t: string) => s.do({ type: 'dev', text: `zeit ${t}` });

describe('Continuity: Wochenfüllung', () => {
  test('Samstag 17:45: Ralf ruft nach dem Spiel an, Seidel ist ins Büro gefahren', () => {
    const s = afterSlice();
    zeit(s, '1986-11-15T17:40');
    s.a('warte 10');
    expect(s.state.telecom.ringing).toBe('ralf');
    const out = s.a('nimm hörer');
    expect(out).toMatch(/2:1 gewonnen/);
    expect(s.has('seidel_saturday_office')).toBe(true);
  });

  test('Dienstag 20:00: Ralf erzählt vom Karton im Flur (Vorbereitung der Kassette)', () => {
    const s = afterSlice();
    zeit(s, '1986-11-18T19:55');
    s.a('warte 10');
    expect(s.state.telecom.ringing).toBe('ralf');
    expect(s.a('nimm hörer')).toMatch(/Karton für den Sperrmüll/);
    expect(s.has('ralf_box')).toBe(true);
  });

  test('Sonntag: Ralf besucht Jan, Spielrunde mit Gesprächen, Besuch endet mit Wertung', () => {
    const s = afterSlice();
    zeit(s, '1986-11-16T15:40');
    const arrive = s.a('warte 10');
    expect(arrive).toMatch(/Marmorkuchen/);
    expect(s.state.flags.ralfVisit).toBe(true);
    expect(s.state.conversation?.npc).toBe('ralf');

    expect(s.a('schalte computer ein')).toMatch(/mitten in der Spielrunde/);
    const before = s.state.gameClock;
    expect(s.a('frage ralf nach dem spiel')).toMatch(/Kölner Nummer/);
    expect(s.has('ralf_telex')).toBe(true);
    expect(s.state.gameClock > before).toBe(true);
    expect(s.a('frage ralf nach seidel')).toMatch(/immer fünf auf einmal/);
    expect(s.has('ralf_numbers')).toBe(true);

    const trust = s.state.relationships.ralfTrust;
    expect(s.a('frage ralf nach früher')).toMatch(/Baumhaus/);
    expect(s.state.relationships.ralfTrust).toBe(trust + 5);
    s.a('frage ralf nach früher');
    expect(s.state.relationships.ralfTrust).toBe(trust + 5);

    const out = s.a('verabschiede dich');
    expect(out).toMatch(/31\.040 zu 28\.775/);
    expect(s.state.flags.ralfVisit).toBe(false);
    expect(s.state.conversation).toBeNull();
    expect(s.state.flags.away).toBeUndefined();
    expect(s.has('sunday_visit')).toBe(true);
    expect(s.state.relationships.ralfTrust).toBe(trust + 8);
  });

  test('Sonntag: Der Besuch endet spätestens um 18:20 von selbst', () => {
    const s = afterSlice();
    zeit(s, '1986-11-16T15:40');
    s.a('warte 10');
    expect(s.state.flags.ralfVisit).toBe(true);
    s.do({ type: 'dev', text: 'zeit 1986-11-16T18:25' });
    expect(s.state.flags.ralfVisit).toBe(false);
    expect(s.has('sunday_visit')).toBe(true);
  });

  test('Freitag: Abschaltung des Netzes ab 12 Uhr im KNOTEN WEST sichtbar, GHOST warnt vor dem Sturm', async () => {
    const { MAILBOXES } = await import('../content/networks');
    const post = MAILBOXES.secret.boards.find((b) => b.id === 'post')!;
    expect(post.messages.some((m) => m.id === 'msg_sys_countdown')).toBe(true);
    const club = MAILBOXES.bitschuppen.boards.find((b) => b.id === 'club')!;
    expect(club.messages.some((m) => m.id === 'gh_4')).toBe(true);
  });
});

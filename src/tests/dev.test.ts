import { EVENTS } from '../content/events';
import { PUZZLES } from '../content/puzzles';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CODE_TRIGGERS,
  MILESTONES,
  contentGraph,
  contentWarnings,
  eventTable,
  milestoneState,
  puzzleTable,
} from '../engine/dev';
import { step } from '../engine/engine';
import { createSaveFile, parseSave, serializeSave } from '../engine/save';
import type { GameState } from '../engine/types';
import { Session } from './helpers';

const roundtrip = (st: GameState) => parseSave(serializeSave(createSaveFile(st, 'test', '2026-01-01T00:00')));

const dev = (s: Session, text: string) =>
  s
    .do({ type: 'dev', text })
    .map((l) => l.text)
    .join('\n');

describe('Entwicklerbefehle', () => {
  test('Fakten, Flags, Beziehungen, Rätsel, Gegenstände, Geld', () => {
    const s = new Session();
    dev(s, 'fakt ralf_phone');
    expect(s.has('ralf_phone')).toBe(true);
    dev(s, 'fakt -ralf_phone');
    expect(s.has('ralf_phone')).toBe(false);

    dev(s, 'flag testFlag 3');
    expect(s.state.flags.testFlag).toBe(3);
    dev(s, 'flag testFlag wahr');
    expect(s.state.flags.testFlag).toBe(true);
    dev(s, 'flag -testFlag');
    expect('testFlag' in s.state.flags).toBe(false);

    dev(s, 'bez seidelSuspicion 250');
    expect(s.state.relationships.seidelSuspicion).toBe(100);

    dev(s, 'rätsel P04 solved');
    expect(s.state.puzzles.P04).toBe('solved');
    dev(s, 'rätsel P04 unknown'); // auch rückwärts
    expect(s.state.puzzles.P04).toBe('unknown');

    dev(s, 'item disk_1001 drive');
    dev(s, 'item disk_archive drive');
    expect(s.state.itemLocations.disk_archive).toBe('drive');
    expect(s.state.itemLocations.disk_1001).toBe('desk'); // nur eine Diskette im Laufwerk

    dev(s, 'geld 12,50');
    expect(s.state.moneyDm).toBe(12.5);
  });

  test('Zeit vorspulen lässt fällige Ereignisse in Reihenfolge feuern, nie rückwärts', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    const out = dev(s, 'zeit +30');
    expect(s.state.firedEvents).toContain('ev_doorbell');
    expect(s.state.itemLocations.disk_game).toBe('inventory');
    expect(out).toMatch(/Zeit jetzt/);
    const before = s.state.gameClock;
    expect(dev(s, 'zeit 08:00')).toMatch(/nur vorwärts/);
    expect(s.state.gameClock).toBe(before);
  });

  test('Ereignisse auslösen oder einplanen', () => {
    const s = new Session();
    dev(s, 'ereignis ev_father_home +5');
    expect(s.state.scheduledEvents.some((e) => e.id === 'ev_father_home' && e.status === 'pending')).toBe(
      true,
    );
    dev(s, 'ereignis ev_father_home');
    expect(s.state.flags.fatherHome).toBe(true);
    expect(s.state.firedEvents).toContain('ev_father_home');
  });

  test('Ungültige Eingaben ändern nichts und schlagen Ähnliches vor', () => {
    const s = new Session();
    const before = JSON.stringify({ ...s.state, history: [], nextLogId: 0, debugLog: [] });
    expect(dev(s, 'fakt ralf')).toMatch(/Meintest du: ralf_phone/);
    expect(dev(s, 'item disk_game mond')).toMatch(/Ort:/);
    expect(dev(s, 'quatsch')).toMatch(/Unbekannter Entwicklerbefehl/);
    expect(JSON.stringify({ ...s.state, history: [], nextLogId: 0, debugLog: [] })).toBe(before);
  });

  test('Dev-Eingriffe werden im debugLog markiert und überstehen Speichern/Laden', () => {
    const s = new Session();
    dev(s, 'flag x 1');
    expect(s.state.debugLog.some((l) => l.includes('dev flag x 1'))).toBe(true);
    expect(roundtrip(s.state).ok).toBe(true);
  });
});

describe('Meilensteine (werden durch echte Spielbefehle erzeugt)', () => {
  const at = (id: string) => milestoneState(id, step)!;

  test('jeder Meilenstein erreicht den beschriebenen Zustand', () => {
    expect(at('start').telecom.ringing).toBe('ralf');
    expect(at('disk').itemLocations.disk_game).toBe('inventory');
    const c64 = at('c64');
    expect(c64.itemLocations.disk_game).toBe('drive');
    expect(c64.computer.powerOn).toBe(true);
    expect(at('secret').computer.app?.id).toBe('modk');
    const num = at('number');
    expect(num.knownFacts).toEqual(expect.arrayContaining(['data_lines', 'chr_table']));
    expect(at('online').telecom.connectedSystemId).toBe('secret');
    const end = at('end');
    expect(end.flags.sliceEnded).toBe(true);
    const bbs = at('bbs');
    expect(bbs.telecom.connectedSystemId).toBe('bitschuppen');
    expect(bbs.telecom.bbs.bitschuppen.status).toBe('mitglied');
    expect(bbs.computer.app?.id).toBe('term');
  });

  test('Meilensteine sind deterministisch, speicherbar und markiert', () => {
    for (const m of MILESTONES) {
      const a = at(m.id);
      expect(JSON.stringify(a)).toBe(JSON.stringify(at(m.id)));
      expect(roundtrip(a).ok).toBe(true);
      expect(a.debugLog.at(-1)).toContain(`dev milestone ${m.id}`);
    }
    expect(milestoneState('gibtsnicht', step)).toBeNull();
  });
});

describe('Content-Analyse', () => {
  test('Graph enthält bekannte Abhängigkeiten', () => {
    const g = contentGraph();
    expect(g).toContainEqual(
      expect.objectContaining({ from: 'event:ev_ralf_call', kind: 'schedules', to: 'ev_ring_reminder' }),
    );
    expect(g).toContainEqual(
      expect.objectContaining({ from: 'event:ev_doorbell', kind: 'fact', to: 'ralf_training' }),
    );
  });

  test('Liste der Code-Auslöser stimmt mit dem Quelltext überein', () => {
    const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith('tests') && !f.startsWith('content'))
      .map((f) => readFileSync(join('src', f), 'utf8'))
      .join('\n');
    const found = (re: RegExp) => [...new Set([...files.matchAll(re)].map((m) => m[1]))].sort();
    expect(found(/scheduleEvent\(ctx, '([^']+)'/g)).toEqual([...CODE_TRIGGERS.events].sort());
    expect(found(/setPuzzle\(ctx, '([^']+)'/g)).toEqual([...CODE_TRIGGERS.puzzles].sort());
    for (const id of CODE_TRIGGERS.events) expect(EVENTS.map((e) => e.id)).toContain(id);
    for (const id of CODE_TRIGGERS.puzzles) expect(PUZZLES.map((p) => p.id)).toContain(id);
  });

  test('Keine toten Enden im aktuellen Content', () => {
    expect(contentWarnings()).toEqual([]);
  });

  test('Ereignis- und Rätseltabelle spiegeln den Spielstand', () => {
    const s = milestoneState('disk', step)!;
    const ev = eventTable(s);
    expect(ev.find((e) => e.id === 'ev_ralf_call')?.status).toBe('gefeuert');
    expect(ev.find((e) => e.id === 'ev_doorbell')?.status).toBe('gefeuert');
    const pz = puzzleTable(s);
    expect(pz[0].id).toBe('P01');
    expect(pz[0].stage).toMatch(/^3\/3/);
  });
});

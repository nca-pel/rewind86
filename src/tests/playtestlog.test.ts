import {
  MAX_ENTRIES,
  clearLog,
  formatLog,
  mergeMiss,
  readLog,
  recordMiss,
  type MissEntry,
} from '../app/playtestLog';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { Session } from './helpers';

function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const T = '1986-11-14T16:00';

function misses(phrase: string): Array<{ reason: string; detail?: string }> {
  const s = new Session(false);
  s.state = milestoneState('disk', step)!;
  const before = s.ui.length;
  s.a(phrase);
  return s.ui.slice(before).filter((u) => (u as { type: string }).type === 'parseMiss') as never;
}

describe('Playtest-Protokoll (Ausbauplan Punkt 8)', () => {
  test('Die Engine meldet nicht verstandene Eingaben als UI-Effekt, verstandene nicht', () => {
    expect(misses('nimm hörer')).toHaveLength(0);
    expect(misses('flibberdibbet')).toEqual([expect.objectContaining({ reason: 'bare' })]);
    expect(misses('untersuche zauberstab')).toEqual([
      expect.objectContaining({ reason: 'unknownWord', detail: 'zauberstab' }),
    ]);
    expect(misses('nimm diskette 1001')).toEqual([
      expect.objectContaining({ reason: 'unreachable', detail: 'disk_1001' }),
    ]);
    // Meldungen ändern den Spielzustand nicht
    const s = new Session(false);
    s.state = milestoneState('disk', step)!;
    const a = structuredClone(s.state);
    s.a('flibberdibbet');
    expect(s.state.itemLocations).toEqual(a.itemLocations);
  });

  test('Zusammenführen: gleiche Eingabe zählt hoch, Groß-/Kleinschreibung egal, Überlauf verwirft Älteste', () => {
    let log: MissEntry[] = [];
    log = mergeMiss(log, { input: 'Zeige  Bild', reason: 'bare' }, T, '2026-01-01T00:00:00Z');
    log = mergeMiss(log, { input: 'zeige bild', reason: 'bare' }, T, '2026-01-01T00:00:05Z');
    expect(log).toHaveLength(1);
    expect(log[0].count).toBe(2);
    log = mergeMiss(
      log,
      { input: 'zeige bild', reason: 'unknownWord', detail: 'bild' },
      T,
      '2026-01-01T00:00:09Z',
    );
    expect(log).toHaveLength(2);
    for (let i = 0; i < MAX_ENTRIES + 10; i++)
      log = mergeMiss(
        log,
        { input: `x${i}`, reason: 'bare' },
        T,
        new Date(2026, 0, 2, 0, 0, i).toISOString(),
      );
    expect(log).toHaveLength(MAX_ENTRIES);
    expect(log.some((e) => e.input === 'x0')).toBe(false);
    expect(log.some((e) => e.input === `x${MAX_ENTRIES + 9}`)).toBe(true);
  });

  test('Speichern, Lesen, Ausschalten, Leeren; defekte Daten brechen nichts', () => {
    const st = memoryStore();
    recordMiss({ input: 'foo bar', reason: 'bare' }, T, st, true);
    recordMiss({ input: 'foo bar', reason: 'bare' }, T, st, true);
    recordMiss({ input: 'quux', reason: 'unknownVerb', detail: 'quux' }, T, st, true);
    expect(readLog(st)).toHaveLength(2);
    expect(formatLog(readLog(st)).split('\n')[0]).toContain('2×  foo bar');
    recordMiss({ input: 'aus', reason: 'bare' }, T, st, false);
    expect(readLog(st)).toHaveLength(2);
    st.setItem('rewind1986.playtest', '{kaputt');
    expect(readLog(st)).toEqual([]);
    clearLog(st);
    expect(readLog(st)).toEqual([]);
  });
});

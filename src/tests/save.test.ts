import { createSaveFile, MAX_SAVE_BYTES, parseSave, serializeSave } from '../engine/save';
import { Session } from './helpers';

function midGame(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('frage ralf nach dem spiel');
  s.a('lege auf');
  s.a('warte');
  s.a('öffne schublade');
  s.a('nimm 1001');
  s.a('lege spielediskette ins laufwerk');
  s.a('schalte computer ein');
  s.a('notiere Ralf nach Diskette 2 fragen');
  s.a('verknüpfe M.S. mit Seidel');
  s.c('10 INPUT A$');
  s.c('RUN'); // Programm wartet auf INPUT – auch das muss gespeichert werden
  return s;
}

describe('Speichern / Laden / Export / Import (GDD §16.3, §19.5)', () => {
  test('Roundtrip stellt den kompletten Zustand wieder her', () => {
    const s = midGame();
    const text = serializeSave(createSaveFile(s.state, 'Test', '2026-01-01T00:00:00Z'));
    const r = parseSave(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.file.state).toEqual(s.state);
    const st = r.file.state;
    expect(st.itemLocations.disk_1001).toBe('inventory');
    expect(st.gameClock).toBe(s.state.gameClock);
    expect(st.relationships).toEqual(s.state.relationships);
    expect(st.deskNotes[0].text).toBe('Ralf nach Diskette 2 fragen');
    expect(st.computer.run?.awaitingInput).toEqual(['A$']);
  });

  test('Nach dem Import geht das Spiel identisch weiter', () => {
    const s = midGame();
    const r = parseSave(serializeSave(createSaveFile(s.state, 'x', 'now')));
    if (!r.ok) throw new Error(r.error);
    const copy = new Session(false);
    copy.state = r.file.state;
    expect(copy.c('JAN')).toEqual(s.c('JAN'));
    expect(copy.a('warte 30')).toEqual(s.a('warte 30'));
    expect(copy.state).toEqual(s.state);
  });

  test('Ungültige Dateien werden abgelehnt', () => {
    expect(parseSave('kein json')).toMatchObject({ ok: false });
    expect(parseSave('{"foo":1}')).toMatchObject({ ok: false, error: expect.stringMatching(/keine REWIND/) });
    const s = new Session();
    const file = createSaveFile(s.state, 'x', 'now');
    const broken = JSON.parse(serializeSave(file));
    broken.state.gameClock = 'gestern';
    expect(parseSave(JSON.stringify(broken))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/gameClock/),
    });
    const future = { ...file, schemaVersion: 999 };
    expect(parseSave(JSON.stringify(future))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/neueren/),
    });
    expect(parseSave('x'.repeat(MAX_SAVE_BYTES + 1))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/groß/),
    });
  });

  test('Manipulierte Werte außerhalb der Grenzen werden abgelehnt', () => {
    const s = new Session();
    const f = JSON.parse(serializeSave(createSaveFile(s.state, 'x', 'now')));
    f.state.relationships.seidelSuspicion = 5000;
    expect(parseSave(JSON.stringify(f)).ok).toBe(false);
  });
});

import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { createSaveFile, parseSave, serializeSave } from '../engine/save';
import { Session } from './helpers';

const step_ = step;

function c64(): Session {
  const s = new Session(false);
  s.state = milestoneState('c64', step_)!;
  s.a('nimm diskette aus dem laufwerk');
  s.a('öffne schublade');
  s.a('lege archivdiskette ins laufwerk');
  expect(s.state.itemLocations.disk_archive).toBe('drive');
  return s;
}

describe('BASIC: Kommandokanal 15 der 1541', () => {
  test('Fehlerkanal ohne Befehl: 00, OK', () => {
    const s = c64();
    s.c('10 OPEN 15,8,15:INPUT#15,E,M$,T,S:PRINT E;M$;T;S:CLOSE 15');
    expect(s.c('RUN')).toMatch(/0 OK 0\s+0/);
  });

  test('S0: löscht eine Datei, Antwort 01 FILES SCRATCHED mit Anzahl', () => {
    const s = c64();
    s.c('10 OPEN 1,8,2,"WEG,S,W":PRINT#1,"X":CLOSE 1');
    s.c('20 OPEN 15,8,15,"S0:WEG":INPUT#15,E,M$,T,S:PRINT E;M$;T:CLOSE 15');
    expect(s.c('RUN')).toContain('1 FILES SCRATCHED 1');
    expect(s.state.disks.archive.files.some((f) => f.name === 'WEG')).toBe(false);
  });

  test('PRINT#15 sendet Befehle; Umbenennen R0:NEU=ALT; Fehler 62 und 63', () => {
    const s = c64();
    s.c('10 OPEN 1,8,2,"ALT,S,W":PRINT#1,"X":CLOSE 1');
    s.c('20 OPEN 15,8,15:PRINT#15,"R0:NEU=ALT":INPUT#15,E,M$:PRINT E;M$');
    s.c('30 PRINT#15,"S0:GIBTSNICHT":INPUT#15,E,M$:PRINT E;M$');
    s.c('40 PRINT#15,"R0:NEU=NEU":INPUT#15,E,M$:PRINT E;M$');
    s.c('50 PRINT#15,"X":INPUT#15,E,M$:PRINT E;M$:CLOSE 15');
    const out = s.c('RUN');
    expect(out).toContain('0 OK');
    expect(out).toContain('62 FILE NOT FOUND');
    expect(out).toContain('63 FILE EXISTS');
    expect(out).toContain('31 SYNTAX ERROR');
    const names = s.state.disks.archive.files.map((f) => f.name);
    expect(names).toContain('NEU');
    expect(names).not.toContain('ALT');
  });

  test('Schreibschutz und Programmdateien: 26, nichts wird gelöscht', () => {
    const s = c64();
    s.c('10 OPEN 15,8,15,"S0:ARCHIV":INPUT#15,E,M$:PRINT E;M$:CLOSE 15');
    expect(s.c('RUN')).toContain('26 WRITE PROTECT ON');
    expect(s.state.disks.archive.files.some((f) => f.name === 'ARCHIV')).toBe(true);
    s.a('nimm diskette aus dem laufwerk');
    s.a('lege ralfs diskette ins laufwerk');
    s.c('NEW');
    s.c('10 OPEN 15,8,15,"S0:LADER":INPUT#15,E,M$:PRINT E;M$:CLOSE 15');
    expect(s.c('RUN')).toContain('26 WRITE PROTECT ON');
    expect(s.state.disks.game.files.some((f) => f.name === 'LADER')).toBe(true);
  });

  test('Ohne Diskette: 74 DRIVE NOT READY; Zustand übersteht Speichern/Laden', () => {
    const s = c64();
    s.c('10 OPEN 15,8,15');
    s.c('RUN');
    const loaded = parseSave(serializeSave(createSaveFile(s.state, 'test', '2026-01-01T00:00')));
    expect(loaded.ok).toBe(true);
    s.a('nimm diskette aus dem laufwerk');
    s.c('NEW');
    s.c('10 OPEN 15,8,15,"S0:X":INPUT#15,E,M$:PRINT E;M$');
    expect(s.c('RUN')).toContain('74 DRIVE NOT READY');
  });
});

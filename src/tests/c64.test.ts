import { MAX_STEPS } from '../sim/basic/interpreter';
import { Session } from './helpers';

function poweredOn(withDisk: 'disk_game' | 'disk_archive' | 'disk_1001' | null = null): Session {
  const s = new Session();
  if (withDisk) {
    s.state.itemLocations[withDisk] = 'drive';
  }
  s.a('schalte computer ein');
  return s;
}

describe('C64-Startbildschirm', () => {
  test('BASIC-V2-Startmeldung, kein DOS-Prompt', () => {
    const scr = poweredOn().screen();
    expect(scr).toContain('**** COMMODORE 64 BASIC V2 ****');
    expect(scr).toContain('64K RAM SYSTEM  38911 BASIC BYTES FREE');
    expect(scr).toContain('READY.');
    expect(scr).not.toContain('C:\\>');
  });
});

describe('BASIC-Teilmenge', () => {
  test('10 PRINT "HALLO" + RUN gibt HALLO aus und hängt nicht', () => {
    const s = poweredOn();
    s.c('10 PRINT "HALLO"');
    const scr = s.c('RUN');
    expect(scr).toMatch(/RUN\nHALLO\nREADY\.$/);
  });

  test('Variablen, Arithmetik, Strings, FOR/NEXT mit STEP', () => {
    const s = poweredOn();
    s.c('10 A=2:B$="X"');
    s.c('20 FOR I=10 TO 1 STEP -3');
    s.c('30 PRINT I*A;B$+"Y"');
    s.c('40 NEXT');
    const scr = s.c('RUN');
    expect(scr).toContain(' 20 XY');
    expect(scr).toContain(' 2 XY');
    expect(scr).not.toContain(' -4 XY');
  });

  test('Keywords ohne Leerzeichen, ? als PRINT, Zahlformat', () => {
    const s = poweredOn();
    expect(s.c('FORI=1TO3:?I;:NEXT')).toContain(' 1  2  3');
    expect(s.c('?1/4')).toContain(' .25');
    expect(s.c('?-7')).toContain('-7');
  });

  test('GOSUB/RETURN, IF/THEN, GOTO, String-Funktionen', () => {
    const s = poweredOn();
    s.c('10 N$="REWIND":GOSUB 100');
    s.c('20 IF LEN(N$)=6 THEN PRINT "SECHS":GOTO 40');
    s.c('30 PRINT "FALSCH"');
    s.c('40 END');
    s.c('100 PRINT LEFT$(N$,2);MID$(N$,3,2);RIGHT$(N$,2);ASC("A");CHR$(66);');
    s.c('105 PRINT VAL("12")+1;STR$(5)');
    s.c('110 RETURN');
    const scr = s.c('RUN').split('RUN\n').pop()!;
    expect(scr).toContain('REWIND 65 B');
    expect(scr).toContain(' 13  5');
    expect(scr).toContain('SECHS');
    expect(scr).not.toContain('FALSCH');
  });

  test('READ/DATA: Ersatzwahl-Nummer per Programm entschlüsseln (Expertenweg)', () => {
    const s = poweredOn('disk_game');
    s.c('LOAD"LADER",8');
    s.c('1000 FOR I=1 TO 5:READ A:PRINT CHR$(A);:NEXT:PRINT:END');
    expect(s.c('RUN 1000')).toContain('41973');
  });

  test('INPUT pausiert das Programm und setzt es mit der Eingabe fort', () => {
    const s = poweredOn();
    s.c('10 INPUT "NAME";N$');
    s.c('20 PRINT "HALLO ";N$');
    expect(s.c('RUN')).toMatch(/NAME\? $/m);
    expect(s.state.computer.run?.awaitingInput).toEqual(['N$']);
    expect(s.c('JAN')).toContain('HALLO JAN');
    expect(s.state.computer.run?.awaitingInput).toBeNull();
  });

  test('Endlosschleife wird nach Schrittlimit mit BREAK abgebrochen', () => {
    const s = poweredOn();
    s.c('10 GOTO 10');
    const scr = s.c('RUN');
    expect(scr).toMatch(/BREAK IN 10\nREADY\.$/);
    expect(s.log.some((l) => l.text.includes('RUN/STOP'))).toBe(true);
    expect(MAX_STEPS).toBeLessThanOrEqual(100_000);
  });

  test('Eingabezeilen sind wie am C64 auf 80 Zeichen begrenzt', () => {
    const s = poweredOn();
    s.c(`10 REM ${'X'.repeat(100)}`);
    expect(s.state.computer.program[0].text.length).toBeLessThanOrEqual(77);
  });

  test('Fehlermeldungen im C64-Stil', () => {
    const s = poweredOn();
    expect(s.c('PRINT 1/0')).toContain('?DIVISION BY ZERO  ERROR');
    expect(s.c('GOTO 500')).toContain("?UNDEF'D STATEMENT  ERROR");
    expect(s.c('PRINT "A"+1')).toContain('?TYPE MISMATCH  ERROR');
    expect(s.c('BLA BLA')).toContain('?SYNTAX  ERROR');
    expect(s.c('NEXT')).toContain('?NEXT WITHOUT FOR  ERROR');
  });

  test('POKE setzt nur simulierte Register (Rahmenfarbe)', () => {
    const s = poweredOn();
    s.c('POKE 53280,2');
    expect(s.state.computer.screen.border).toBe(2);
    expect(s.c('?PEEK(53280)')).toContain(' 242');
    expect(s.c('POKE 53280,300')).toContain('?ILLEGAL QUANTITY  ERROR');
  });

  test('LIST, NEW und Zeilen löschen', () => {
    const s = poweredOn();
    s.c('20 PRINT 2');
    s.c('10 PRINT 1');
    expect(s.c('LIST')).toMatch(/10 PRINT 1\n20 PRINT 2/);
    s.c('20');
    expect(s.state.computer.program).toHaveLength(1);
    s.c('NEW');
    expect(s.state.computer.program).toHaveLength(0);
  });
});

describe('Disketten und Laufwerk (GDD §19.2)', () => {
  test('LOAD"$",8 + LIST zeigt das Verzeichnis der eingelegten Diskette', () => {
    const s = poweredOn('disk_game');
    expect(s.c('LOAD"$",8')).toMatch(/SEARCHING FOR \$\nLOADING\nREADY\./);
    const scr = s.c('LIST');
    expect(scr).toContain('0 "WT-07 ARBEITSK. " MS 2A');
    expect(scr).toMatch(/2 {4}"LADER" {12}PRG/);
    expect(scr).toContain('"SPIEL.07"');
    expect(scr).toContain('478 BLOCKS FREE.');
  });

  test('Ohne Diskette: historische Fehlerreaktion', () => {
    const s = poweredOn();
    expect(s.c('LOAD"$",8')).toContain('?FILE NOT FOUND  ERROR');
    expect(s.log.some((l) => l.text.includes('keine Diskette im Laufwerk'))).toBe(true);
  });

  test('Directory laden überschreibt das BASIC-Programm im Speicher', () => {
    const s = poweredOn('disk_archive');
    s.c('10 PRINT "MEIN PROGRAMM"');
    s.c('LOAD"$",8');
    expect(s.state.computer.programIsDirectory).toBe(true);
    const listed = s.c('LIST').split('LIST\n').pop()!;
    expect(listed).not.toContain('MEIN PROGRAMM');
    expect(listed).toContain('"ARCHIV"');
    expect(s.c('RUN')).toContain('?SYNTAX  ERROR');
  });

  test('Andere Diskette → anderes Verzeichnis; Wechsel ist im Adventure und am C64 identisch', () => {
    const s = poweredOn('disk_1001');
    s.c('LOAD"$",8');
    expect(s.c('LIST')).toContain('"INTRUDER"');
    s.a('nimm diskette aus dem laufwerk');
    expect(s.state.itemLocations.disk_1001).toBe('inventory');
    expect(s.c('LOAD"$",8')).toContain('?FILE NOT FOUND');
  });

  test('Datasette und fremde Geräte', () => {
    const s = poweredOn();
    expect(s.c('LOAD')).toContain('PRESS PLAY ON TAPE');
    expect(s.c('LOAD"X",9')).toContain('?DEVICE NOT PRESENT  ERROR');
  });

  test('SAVE auf schreibgeschützte bzw. beschreibbare Diskette', () => {
    const s = poweredOn('disk_game');
    s.c('10 PRINT "X"');
    s.c('SAVE"TEST",8');
    expect(s.state.disks.game.files.some((f) => f.name === 'TEST')).toBe(false);
    expect(s.log.some((l) => l.text.includes('schreibgeschützt'))).toBe(true);
    s.a('nimm diskette aus dem laufwerk');
    s.state.itemLocations.disk_archive = 'drive';
    s.c('SAVE"TEST",8');
    expect(s.state.disks.archive.files.some((f) => f.name === 'TEST')).toBe(true);
    s.c('NEW');
    s.c('LOAD"TEST",8');
    expect(s.c('RUN')).toContain('X');
  });

  test('Vereinfachte Befehle ZEIGE DATEIEN / LADE SPIEL werden auf C64-Befehle abgebildet', () => {
    const s = poweredOn('disk_game');
    expect(s.c('ZEIGE DATEIEN')).toContain('"SPIEL.07"');
    s.c('LADE SPIEL');
    expect(s.state.computer.app?.id).toBe('wt07');
  });

  test('LOAD"SPIEL.07",8,1 + RUN startet das Spiel ebenfalls', () => {
    const s = poweredOn('disk_game');
    s.c('LOAD"SPIEL.07",8,1');
    expect(s.c('LIST')).toContain('10 SYS2064');
    s.c('RUN');
    expect(s.state.computer.app?.id).toBe('wt07');
  });

  test('Adventure-Eingaben landen nie auf dem C64-Bildschirm', () => {
    const s = poweredOn();
    const before = s.screen();
    s.a('untersuche radio');
    s.a('LOAD"$",8');
    expect(s.screen()).toBe(before);
  });
});

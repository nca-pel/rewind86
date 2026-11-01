import { GAME_CONFIG } from '../content/config';
import { LOADER_LINES } from '../content/disks';
import { FULL_KEY, K01_CIPHERTEXT, decrypt, encrypt, normalizePlain, readable } from '../engine/cipher';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { createSaveFile, migrate, parseSave } from '../engine/save';
import { SCHEMA_VERSION, createInitialState } from '../engine/state';
import { visibleMessages } from '../sim/apps/modk';
import { Session } from './helpers';

const K = GAME_CONFIG.keyStrand;
const NUMBER = GAME_CONFIG.secretNetwork.phoneNumber;

/** Nach dem Ausschnitt: Modul verlassen, Hörer aufgelegt, C64 mit BASIC-Prompt */
function afterSlice(): Session {
  const s = new Session(false);
  s.state = milestoneState('end', step)!;
  if (s.state.computer.app?.id === 'modk') s.key('4');
  return s;
}

/** Modul von Ralfs Diskette starten bis ins Menü (eingeschränkter Betrieb) */
function moduleMenu(s: Session): string {
  if (!s.state.computer.powerOn) s.a('schalte computer ein');
  if (s.state.itemLocations.disk_game !== 'drive') {
    s.a('nimm diskette aus dem laufwerk');
    s.a('lege ralfs diskette ins laufwerk');
  }
  s.c('LOAD"*",8');
  s.c('RUN');
  s.key('RETURN');
  s.key('RETURN');
  s.key('ARROW_LEFT');
  s.key('RETURN');
  return s.key('J');
}

function login(s: Session): void {
  s.key('1');
  s.a(`wähle ${NUMBER}`);
  s.a('lege hörer in den koppler');
  s.key('RETURN');
  expect(s.state.telecom.connectedSystemId).toBe('secret');
}

function readMessage(s: Session, id: string): string {
  s.key('1');
  const n = visibleMessages(s.state).findIndex((m) => m.id === id);
  expect(n).toBeGreaterThanOrEqual(0);
  return s.key(String(n + 1));
}

function logoff(s: Session): void {
  if (s.state.computer.app?.id === 'modk' && s.state.telecom.connectedSystemId) {
    s.key('RETURN'); // Nachricht → Liste
    s.key('RETURN'); // Liste → Onlinemenü
    s.key('4');
  }
  s.a('nimm hörer');
  s.a('lege auf');
}

describe('Chiffre des Rundschreibens', () => {
  test('Ver- und Entschlüsselung sind invers; Wörter durch X getrennt', () => {
    expect(FULL_KEY).toBe(K.parts.join(''));
    expect(FULL_KEY).toHaveLength(12);
    expect(decrypt(K01_CIPHERTEXT, FULL_KEY)).toBe(normalizePlain(K.plaintext));
    expect(readable(decrypt(K01_CIPHERTEXT, FULL_KEY)).join(' ')).toBe(K.plaintext);
    expect(encrypt('AB', '1')).toBe('BC');
    expect(encrypt('Z', '3')).toBe('C');
    // Klartext darf selbst kein X enthalten (Worttrenner)
    expect(K.plaintext).not.toContain('X');
  });

  test('Falscher Schlüssel ergibt Salat; richtige Ziffern liefern die Buchstaben an ihren Stellen', () => {
    const plain = decrypt(K01_CIPHERTEXT, FULL_KEY);
    const wrong = decrypt(K01_CIPHERTEXT, '000000000000');
    expect(wrong).not.toContain('REWIND');
    const half = decrypt(K01_CIPHERTEXT, `${K.parts[0]}${K.parts[1]}0000`);
    for (let i = 0; i < plain.length; i++) if (i % 12 < 8) expect(half[i]).toBe(plain[i]);
  });
});

describe('Schlüssel-Strang im Spiel (Ausbauplan Punkt 6)', () => {
  test('Teil 1: unsichtbar im LADER, sichtbar erst mit anderer Hintergrundfarbe', () => {
    const s = afterSlice();
    s.c('LOAD"LADER",8');
    const listing = s.c('LIST');
    expect(listing).toMatch(/^70 REM$/m);
    expect(listing).not.toContain('TEIL 1/3');
    expect(s.has('empty_rem')).toBe(true);
    expect(s.has('key_part_1')).toBe(false);
    // Monitorbeschreibung verrät nichts
    expect(s.a('untersuche monitor')).not.toContain(K.parts[0]);

    const revealed = s.c('POKE 53281,0');
    expect(revealed).toContain(`TEIL 1/3: ${K.parts[0]}`);
    expect(s.has('key_part_1')).toBe(true);
    expect(s.state.puzzles.P08).toBe('discovered');
  });

  test('Lesertipps erklären den Trick (Hinweis ohne Lösung im Notizblock)', () => {
    const s = afterSlice();
    s.a('öffne päckchen');
    expect(s.a('lies lesertipps')).toContain('53281');
    expect(s.has('hidden_text')).toBe(true);
  });

  test('Kompletter Weg: Netzmeldung, Kassette, Datasette, Ersatzschlüssel im Modul', () => {
    const s = afterSlice();
    // Teil 1
    s.c('LOAD"LADER",8');
    s.c('POKE 53281,0');
    s.c('LIST');
    expect(s.has('key_part_1')).toBe(true);

    // Teil 2: vor Montag steht die Meldung noch nicht im Netz
    moduleMenu(s);
    login(s);
    expect(visibleMessages(s.state).some((m) => m.id === 'msg_key_leak')).toBe(false);
    logoff(s);
    s.do({ type: 'dev', text: `zeit ${K.partTwoFrom.slice(0, 10)}T16:00` });
    if (s.state.computer.app?.id !== 'modk') moduleMenu(s);
    login(s);
    const leak = readMessage(s, 'msg_key_leak');
    expect(leak).toContain(`TEIL 2/3: ${K.parts[1]}`);
    expect(s.has('key_part_2')).toBe(true);
    expect(s.state.puzzles.P07).toBe('solved');
    logoff(s);

    // Teil 3: Ralf bringt am Buß- und Bettag die Kassette
    s.do({ type: 'dev', text: `zeit ${K.cassetteAt.slice(0, 10)}T16:00` });
    expect(s.state.itemLocations.cassette).toBe('inventory');
    expect(s.has('cassette')).toBe(true);
    if (s.state.computer.app) s.key('4');
    expect(s.state.computer.app).toBeNull();
    s.c('LOAD');
    expect(s.log.at(-1)?.text).toMatch(/nicht angeschlossen/);
    expect(s.a('lege kassette in den kassettenrekorder')).toMatch(/Datasette/);
    expect(s.a('lege kassette in die datasette')).toMatch(/Kassettenport/);
    expect(s.state.flags.datasetteConnected).toBe(true);
    expect(s.c('LOAD"FALSCH",1')).not.toContain('FOUND');
    expect(s.c('LOAD')).toContain('FOUND PRUEFBAND3');
    expect(s.c('RUN')).toContain(`TEIL 3/3: ${K.parts[2]}`);
    expect(s.has('key_part_3')).toBe(true);
    expect(s.has('key_complete')).toBe(true);
    expect(s.state.puzzles.P08).toBe('solved');
    expect(s.state.puzzles.P09).toBe('discovered');
    expect(s.a('nimm kassette heraus')).toMatch(/aus der Datasette/);

    // Falscher Ersatzschlüssel: kein Klartext
    moduleMenu(s);
    s.key('3');
    for (const d of '111111111111') s.key(d);
    expect(s.key('RETURN')).toContain('ERSATZSCHLUESSEL: GESETZT');
    login(s);
    expect(readMessage(s, 'msg_k01_all')).not.toContain('KLARTEXT');
    expect(s.has('k01_decrypted')).toBe(false);
    s.key('RETURN');
    s.key('RETURN');
    s.key('4');
    s.a('nimm hörer');
    s.a('lege auf');

    // Richtiger Ersatzschlüssel (DEL korrigiert Tippfehler)
    s.key('3');
    s.key('9');
    s.key('DEL');
    for (const d of FULL_KEY) s.key(d);
    s.key('RETURN');
    login(s);
    const plain = readMessage(s, 'msg_k01_all');
    expect(plain).toContain('KLARTEXT');
    expect(plain).toContain('OPERATION REWIND BEGINNT');
    expect(s.has('k01_decrypted')).toBe(true);
    expect(s.state.puzzles.P09).toBe('solved');
  });

  test('Expertenweg: Rohdaten speichern und mit eigenem BASIC-Programm entschlüsseln', () => {
    const s = afterSlice();
    moduleMenu(s);
    login(s);
    readMessage(s, 'msg_k01_all');
    expect(s.key('S')).toContain('SCHREIBSCHUTZ');
    s.a('nimm diskette aus dem laufwerk');
    s.a('öffne schublade');
    s.a('lege archivdiskette ins laufwerk');
    expect(s.key('S')).toContain(`GESPEICHERT: ${K.rawFileName}`);
    expect(s.state.disks.archive.files.some((f) => f.name === K.rawFileName && f.type === 'SEQ')).toBe(true);
    logoff(s);
    s.key('4');
    expect(s.state.computer.app).toBeNull();

    for (const line of [
      `10 K$="${FULL_KEY}":OPEN 2,8,2,"${K.rawFileName},S,R":P=0`,
      '20 INPUT#2,L$:FOR I=1 TO LEN(L$):C=ASC(MID$(L$,I,1)):IF C<65 THEN 50',
      '30 K=VAL(MID$(K$,P-INT(P/12)*12+1,1)):P=P+1',
      '40 C=C-K:IF C<65 THEN C=C+26',
      '45 PRINT CHR$(C);',
      '50 NEXT:IF ST=0 THEN 20',
      '60 CLOSE 2',
    ])
      s.c(line);
    const out = s.c('RUN').replace(/\n/g, '');
    expect(out).toContain('OPERATIONXREWINDXBEGINNTXFREITAG');
  });
});

describe('BASIC: sequenzielle Dateien', () => {
  function c64(): Session {
    const s = new Session(false);
    s.state = milestoneState('c64', step)!;
    s.a('nimm diskette aus dem laufwerk');
    s.a('öffne schublade');
    s.a('lege archivdiskette ins laufwerk');
    expect(s.state.itemLocations.disk_archive).toBe('drive');
    return s;
  }

  test('PRINT# schreibt, INPUT#/GET# lesen, ST meldet das Dateiende', () => {
    const s = c64();
    s.c('10 OPEN 1,8,2,"TEST,S,W":PRINT#1,"HALLO":PRINT#1,"WELT":CLOSE 1');
    s.c('20 OPEN 2,8,2,"TEST,S,R"');
    s.c('30 INPUT#2,A$:PRINT A$;ST');
    s.c('40 IF ST=0 THEN 30');
    s.c('50 CLOSE 2:OPEN 3,8,3,"TEST":GET#3,B$:PRINT "["B$"]":CLOSE 3');
    const out = s.c('RUN');
    expect(out).toContain('HALLO 0');
    expect(out).toContain('WELT 64');
    expect(out).toContain('[H]');
    const file = s.state.disks.archive.files.find((f) => f.name === 'TEST');
    expect(file?.type).toBe('SEQ');
    expect(file?.textContent).toBe('HALLO\rWELT\r');
  });

  test('Fehler wie am Original', () => {
    const s = c64();
    expect(s.c('10 INPUT#5,A$')).toBeTruthy();
    expect(s.c('RUN')).toContain('?FILE NOT OPEN  ERROR IN 10');
    s.c('NEW');
    s.c('10 OPEN 1,8,2,"GIBTSNICHT,S,R"');
    expect(s.c('RUN')).toContain('?FILE NOT FOUND  ERROR IN 10');
    s.a('nimm diskette aus dem laufwerk');
    s.a('lege ralfs diskette ins laufwerk');
    s.c('NEW');
    s.c('10 OPEN 1,8,2,"NEU,S,W"');
    expect(s.c('RUN')).toContain('?WRITE PROTECT ON  ERROR IN 10');
    s.c('NEW');
    s.c('10 OPEN 1,4');
    expect(s.c('RUN')).toContain('?DEVICE NOT PRESENT  ERROR IN 10');
  });
});

describe('Spielstände (Schema 6)', () => {
  test('Migration 5 → 6: LADER mit versteckter Zeile, Kassette, Ralfs Besuch terminiert', () => {
    const st = createInitialState() as unknown as Record<string, unknown>;
    const old = structuredClone(st) as Record<string, unknown> & {
      itemLocations: Record<string, string>;
      disks: { game: { files: Array<{ name: string; basic?: string[] }> } };
      scheduledEvents: Array<{ id: string }>;
    };
    old.schemaVersion = 5;
    delete old.itemLocations.cassette;
    old.disks.game.files[0].basic = LOADER_LINES.filter((l) => !l.startsWith('70 '));
    old.scheduledEvents = old.scheduledEvents.filter((e) => e.id !== 'ev_ralf_cassette');
    const m = migrate(old) as typeof old;
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.itemLocations.cassette).toBe('nowhere');
    expect(m.disks.game.files[0].basic).toEqual(LOADER_LINES);
    expect(m.scheduledEvents.some((e) => e.id === 'ev_ralf_cassette')).toBe(true);
  });

  test('Offene Dateien und Kassette in der Datasette überstehen Speichern/Laden', () => {
    const s = afterSlice();
    s.state.itemLocations.cassette = 'datasette';
    s.state.computer.run = {
      ...(s.state.computer.run ?? {
        pc: { line: -1, stmt: 0 },
        vars: {},
        arrays: {},
        forStack: [],
        gosubStack: [],
        dataPtr: 0,
        awaitingInput: null,
        rng: 1,
      }),
      files: { '2': { mode: 'r', name: 'K01.ROH', data: 'ABC\r', pos: 1 } },
    };
    const file = createSaveFile(s.state, 'test', '2026-01-01T00:00:00Z');
    const r = parseSave(JSON.stringify(file));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.state.itemLocations.cassette).toBe('datasette');
      expect(r.file.state.computer.run?.files?.['2'].pos).toBe(1);
    }
  });
});

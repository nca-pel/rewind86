import { GAME_CONFIG } from '../content/config';
import { step } from '../engine/engine';
import { createInitialState } from '../engine/state';
import { Session } from './helpers';

/** Schwierigkeitsgrad »Schwer« (GAME_CONFIG.hard) */
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });
const text = (s: Session, from = 0) =>
  s.log
    .slice(from)
    .map((l) => l.text)
    .join('\n');

function hard(): Session {
  const s = new Session(false);
  s.state = step(createInitialState(), { type: 'start', difficulty: 'hard' }).state;
  return s;
}

function afterDoor(s: Session): Session {
  s.a('nimm hörer');
  s.a('lege auf');
  s.a('warte');
  return s;
}

function connectModule(s: Session, key?: string): void {
  s.c('LOAD"*",8');
  s.c('RUN');
  for (const k of ['RETURN', 'RETURN', 'ARROW_LEFT', 'RETURN', 'J']) s.key(k);
  if (key) {
    s.key('3');
    for (const ch of key) s.key(ch);
    s.key('RETURN');
  }
  s.key('1');
  s.a(`wähle ${GAME_CONFIG.secretNetwork.phoneNumber}`);
  s.a('lege hörer in den koppler');
  s.key('RETURN');
}

describe('Schwierigkeit Schwer', () => {
  test('Normal ist Standard, Schwer setzt das Flag und meldet sich', () => {
    expect(new Session().state.flags.hardMode).toBeUndefined();
    const s = hard();
    expect(s.state.flags.hardMode).toBe(true);
    expect(s.state.history.map((l) => l.text).join('\n')).toMatch(/SCHWER/);
  });

  test('1: Fragmente ohne Teilnummer – im LADER, in der Netzmeldung und auf dem Band', () => {
    const s = afterDoor(hard());
    s.a('lege diskette ins laufwerk');
    s.a('schalte computer ein');
    s.c('LOAD"LADER",8');
    s.c('POKE 53281,0');
    const screen = s.c('LIST');
    expect(screen).toMatch(/70 REM K-SCHLUESSEL: 7302/);
    expect(screen).not.toMatch(/TEIL 1\/3/);
    expect(s.has('key_part_1')).toBe(true);
    expect(text(s)).toMatch(/Schlüsselfragment: 7302/);
    expect(text(s)).not.toMatch(/Schlüsselteil 1\/3/);

    dev(s, 'zeit 1986-11-17T14:00');
    s.key('RUNSTOP');
    connectModule(s);
    s.key('1');
    expect(s.screen()).toMatch(/SCHLUESSELWECHSEL/);
    s.key('3');
    expect(s.screen()).toMatch(/K-SCHLUESSEL: 1958/);
    expect(s.screen()).not.toMatch(/TEIL \d\/3/);
    expect(s.has('key_part_2')).toBe(true);
  });

  test('1: Das Modul zeigt, ob ein Fragment an der richtigen Stelle sitzt', () => {
    const s = afterDoor(hard());
    s.a('lege diskette ins laufwerk');
    s.a('schalte computer ein');
    connectModule(s, '195844267302');
    let from = s.log.length;
    s.key('1');
    s.key('1');
    expect(text(s, from)).toMatch(/Buchstabensalat/);
    s.key('X');
    s.key('RETURN');
    s.key('4');
    s.a('nimm hörer');
    s.a('lege auf');
    s.key('RUNSTOP');
    connectModule(s, '195873024426');
    from = s.log.length;
    s.key('1');
    s.key('1');
    expect(text(s, from)).toMatch(/Ein Teil des Schlüssels sitzt richtig/);
  });

  test('2: Zeitschrift ohne Ziffern-Codes und ohne POKE-Adresse; HILFE C64 ebenso', () => {
    const s = hard();
    const table = s.a('lies tabelle');
    expect(table).not.toMatch(/48 = 0/);
    expect(table).toMatch(/65 = A/);
    expect(s.a('lies lesertipps')).not.toMatch(/53281/);
    expect(s.a('hilfe c64')).not.toMatch(/53281/);
    expect(new Session().a('hilfe c64')).toMatch(/POKE 53281/);
  });

  test('3: Ohne Nachfrage kein Prüfband – nach FRAGE RALF NACH DEM BAND kommt es', () => {
    const s = afterDoor(hard());
    dev(s, 'fakt key_leak');
    dev(s, 'zeit 1986-11-19T18:00');
    expect(s.state.itemLocations.cassette).toBe('nowhere');
    s.a('rufe ralf an');
    expect(s.a('frage ralf nach dem band')).toMatch(/Sperrmüll/);
    s.a('lege auf');
    dev(s, 'zeit +40');
    expect(s.state.itemLocations.cassette).toBe('inventory');
  });

  test('3: Wer vor Mittwoch fragt, bekommt das Band zum geplanten Termin', () => {
    const s = afterDoor(hard());
    dev(s, 'fakt key_leak');
    dev(s, 'zeit 1986-11-17T15:00');
    s.a('rufe ralf an');
    s.a('frage ralf nach dem band');
    s.a('lege auf');
    expect(s.state.flags.ralfAskedTape).toBe(true);
    dev(s, 'zeit 1986-11-19T15:30');
    expect(s.state.itemLocations.cassette).toBe('inventory');
  });

  test('3: Im Normalmodus kommt das Band weiterhin von selbst', () => {
    const s = afterDoor(new Session());
    dev(s, 'zeit 1986-11-19T15:30');
    expect(s.state.itemLocations.cassette).toBe('inventory');
  });

  test('4: Anmeldung im geheimen Netz kostet mehr Verdacht', () => {
    const login = (s: Session) => {
      s.a('lege diskette ins laufwerk');
      s.a('schalte computer ein');
      const before = s.state.relationships.seidelSuspicion;
      connectModule(s);
      return s.state.relationships.seidelSuspicion - before;
    };
    expect(login(afterDoor(new Session()))).toBe(GAME_CONFIG.risk.secretLogin);
    expect(login(afterDoor(hard()))).toBe(GAME_CONFIG.hard.risk.secretLogin);
  });

  test('5: Hohe Telefonrechnung – Jan zahlt alles, und an die Wählscheibe kommt ein Schloss', () => {
    const s = afterDoor(hard());
    dev(s, 'zeit 1986-11-16T10:00');
    s.state.phoneCostsDm = GAME_CONFIG.hard.phoneLockFromDm;
    const money = s.state.moneyDm;
    dev(s, 'zeit 1986-11-16T19:30');
    expect(s.state.moneyDm).toBeLessThan(money);
    expect(typeof s.state.flags.phoneLockedUntil).toBe('string');
    expect(s.a('rufe ralf an')).toMatch(/Messingschloss/);
    expect(s.state.telecom.call).toBeFalsy();
    dev(s, 'zeit 1986-11-17T20:00');
    expect(s.a('rufe ralf an')).toMatch(/wählst/);
  });

  test('5: Im Normalmodus kein Telefonschloss', () => {
    const s = afterDoor(new Session());
    s.state.phoneCostsDm = 20;
    dev(s, 'zeit 1986-11-16T19:30');
    expect(s.state.flags.phoneLockedUntil).toBeUndefined();
  });
});

describe('HILFE C64', () => {
  test.each(['hilfe c64', 'hilfe basic', 'help computer', 'hilfe datasette'])(
    '»%s« zeigt die C64-Befehle',
    (cmd) => {
      const out = new Session().a(cmd);
      expect(out).toMatch(/LOAD"\$",8/);
      expect(out).toMatch(/RUN\/STOP/);
      expect(out).toMatch(/OPEN 2,8,2/);
    },
  );

  test('Die allgemeine Hilfe verweist auf HILFE C64', () => {
    expect(new Session().a('hilfe')).toMatch(/HILFE C64/);
  });
});

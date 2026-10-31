import { GAME_CONFIG } from '../content/config';
import { BITSCHUPPEN, DATENKELLER, MAILBOXES } from '../content/networks';
import { isOpen, validHandle } from '../engine/bbs';
import { createSaveFile, parseSave, serializeSave } from '../engine/save';
import { Session } from './helpers';

const BS = GAME_CONFIG.mailboxes.bitschuppen;
const DK = GAME_CONFIG.mailboxes.datenkeller;

const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

/** Ralf war da, Archivdiskette im Laufwerk, TERMINAL läuft */
function terminalReady(at = '18:05'): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  s.a('warte');
  s.a('öffne schublade');
  s.a('nimm archivdiskette');
  s.a('lege archivdiskette ins laufwerk');
  s.a('schalte computer ein');
  dev(s, `zeit ${at}`);
  s.c('LOAD"TERMINAL",8');
  s.c('RUN');
  expect(s.state.computer.app?.id).toBe('term');
  return s;
}

function connect(s: Session, number: string = BS.phoneNumber): string {
  const out = s.a(`wähle ${number}`);
  s.a('lege hörer in den koppler');
  s.key('RETURN');
  return out;
}

function logoffAndHangUp(s: Session): void {
  s.key('5');
  s.a('lege auf');
}

describe('Öffnungszeiten und Handles', () => {
  test('auch über Mitternacht', () => {
    expect(isOpen(BITSCHUPPEN, '1986-11-14T17:59')).toBe(false);
    expect(isOpen(BITSCHUPPEN, '1986-11-14T18:00')).toBe(true);
    expect(isOpen(BITSCHUPPEN, '1986-11-14T23:59')).toBe(true);
    expect(isOpen(BITSCHUPPEN, '1986-11-15T00:00')).toBe(false);
    expect(isOpen(DATENKELLER, '1986-11-14T21:59')).toBe(false);
    expect(isOpen(DATENKELLER, '1986-11-14T23:30')).toBe(true);
    expect(isOpen(DATENKELLER, '1986-11-15T05:59')).toBe(true);
    expect(isOpen(DATENKELLER, '1986-11-15T06:00')).toBe(false);
  });

  test('Handles: Länge, Zeichen, reservierte Namen', () => {
    expect(validHandle('jan')).toBe('JAN');
    expect(validHandle('J')).toBeNull();
    expect(validHandle('SYSOP')).toBeNull();
    expect(validHandle('JAN K')).toBeNull();
  });
});

describe('Reguläre Mailbox BIT-SCHUPPEN (Ausbauplan Punkt 3)', () => {
  test('Kleinanzeige liefert Nummer und Zeiten als Fakt', () => {
    const s = new Session();
    s.a('öffne päckchen');
    expect(s.a('lies kleinanzeigen')).toContain(BS.phoneNumber);
    expect(s.has('bbs_bitschuppen')).toBe(true);
  });

  test('Vor 18 Uhr: kein Modem, keine Verbindung', () => {
    const s = terminalReady('17:00');
    expect(connect(s)).toMatch(/kein Pfeifton/);
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.screen()).toContain('KEIN TRAEGER');
  });

  test('Gast liest, darf aber weder schreiben noch laden', () => {
    const s = terminalReady();
    expect(connect(s)).toMatch(/Modem/);
    expect(s.screen()).toContain('DEIN NAME (ODER GAST):');
    s.c('GAST');
    expect(s.screen()).toContain('STATUS: GAST');
    s.key('1');
    expect(s.screen()).toContain('ALLGEMEIN');
    expect(s.screen()).not.toContain('MARKT');
    s.key('1');
    expect(s.screen()).not.toContain('MAILBOXLISTE');
    s.key('1');
    expect(s.screen()).toContain('KEINE RAUBKOPIEN');
    s.key('SPACE');
    s.key('S');
    expect(s.screen()).toContain('NUR FUER MITGLIEDER');
    // Die Spur zur geheimen Mailbox wird hier nicht ausgelöst
    expect(s.has('access_number')).toBe(false);
  });

  test('Anmeldung → Freischaltung nach Wartezeit → Brett, Post, Antwort, Download', () => {
    const s = terminalReady();
    connect(s);
    s.c('jan');
    expect(s.screen()).toContain('"JAN" IST NEU HIER');
    s.key('J');
    expect(s.state.telecom.bbs.bitschuppen.handle).toBe('JAN');
    expect(s.screen()).toContain('STATUS: NEU');
    s.key('2');
    s.key('S');
    expect(s.screen()).toContain('NOCH NICHT FREIGESCHALTET');
    s.key('RETURN');
    logoffAndHangUp(s);
    expect(s.state.telecom.connectedSystemId).toBeNull();

    // Später wieder anrufen: freigeschaltet (18:30–18:45 telefoniert der Vater, Leitung belegt)
    dev(s, 'zeit 19:00');
    connect(s);
    s.c('JAN');
    expect(s.screen()).toContain('STATUS: MITGLIED');
    expect(s.has('bbs_member')).toBe(true);
    expect(s.screen()).toMatch(/POST \(1 NEU\)/);
    s.key('2');
    s.key('1');
    expect(s.screen()).toContain('DU BIST JETZT FREIGESCHALTET');
    s.key('SPACE');
    s.key('RETURN');

    // Mailboxliste → zweite Mailbox
    s.key('1');
    expect(s.screen()).toContain('MARKT');
    s.key('1');
    s.key('3');
    expect(s.screen()).toContain(DK.phoneNumber);
    expect(s.has('bbs_datenkeller')).toBe(true);
    s.key('SPACE');

    // Eigener Beitrag
    s.key('S');
    s.c('Hallo zusammen');
    s.c('Bin neu hier, Gruss Jan');
    s.c('');
    expect(s.screen()).toContain('GESENDET.');
    expect(s.screen()).toContain('JAN      HALLO ZUSAMMEN');
    s.key('RETURN');
    s.key('RETURN');

    // Private Post an den Sysop – Antwort kommt verzögert
    s.key('2');
    s.key('S');
    s.c('NIEMAND');
    expect(s.screen()).toContain('EMPFAENGER UNBEKANNT');
    s.c(BS.sysop);
    s.c('Hallo');
    s.c('Danke fuers Freischalten!');
    s.c('');
    expect(s.state.telecom.bbs.bitschuppen.inbox.some((m) => m.subject === 'RE: HALLO')).toBe(true);
    expect(s.screen()).not.toContain('RE: HALLO');
    s.key('RETURN');
    dev(s, 'zeit +15');
    s.key('2');
    expect(s.screen()).toContain('RE: HALLO');
    s.key('RETURN');

    // Download auf die Archivdiskette
    const before = s.state.disks.archive.files.length;
    s.key('3');
    s.key('1');
    expect(s.screen()).toContain('BIORHYTHMUS: OK');
    expect(s.state.disks.archive.files).toHaveLength(before + 1);
    s.key('1');
    expect(s.screen()).toContain('DATEI SCHON VORHANDEN');
    s.key('RETURN');
    logoffAndHangUp(s);
    expect(s.state.phoneCostsDm).toBeGreaterThan(0);

    // Heruntergeladenes Programm läuft
    s.key('RUNSTOP');
    expect(s.state.computer.app).toBeNull();
    s.c('LOAD"BIORHYTHMUS",8');
    s.c('RUN');
    expect(s.c('10000')).toMatch(/KOERPER: +-?\d+ %/);
  });

  test('Download braucht eine beschreibbare Diskette', () => {
    const s = terminalReady();
    connect(s);
    s.c('JAN');
    s.key('J');
    logoffAndHangUp(s);
    dev(s, 'zeit 19:00');
    // Ralfs schreibgeschützte Diskette ins Laufwerk – TERMINAL läuft bereits im Speicher
    s.a('nimm diskette aus dem laufwerk');
    s.a('lege ralfs diskette ins laufwerk');
    connect(s);
    s.c('JAN');
    s.key('3');
    s.key('2');
    expect(s.screen()).toContain('DISKETTE SCHREIBGESCHUETZT');
    s.a('nimm diskette aus dem laufwerk');
    s.key('2');
    expect(s.screen()).toContain('KEINE DISKETTE IM LAUFWERK');
  });

  test('Verbindung bricht ab, wenn der Hörer aus dem Koppler genommen wird', () => {
    const s = terminalReady();
    connect(s);
    s.c('GAST');
    s.a('nimm hörer');
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.screen()).toContain('NO CARRIER');
  });
});

describe('Mehrere Systeme', () => {
  test('DATENKELLER nur nachts', () => {
    const s = terminalReady('20:00');
    expect(connect(s, DK.phoneNumber)).toMatch(/kein Pfeifton/);
    s.a('lege auf');
    dev(s, 'zeit 22:30');
    connect(s, DK.phoneNumber);
    expect(s.screen()).toContain(DK.name);
    s.c('GAST');
    s.key('1');
    expect(s.screen()).toContain('KELLERGEFLUESTER');
  });

  test('Geheime Mailbox nur mit dem Modul; Modul nur für die geheime Mailbox', () => {
    const s = terminalReady();
    connect(s, GAME_CONFIG.secretNetwork.phoneNumber);
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.screen()).toContain('UNBEKANNTES PROTOKOLL');
    expect(MAILBOXES.secret.access).toBe('module');
  });

  test('Konten sind pro System getrennt und überstehen Speichern/Laden', () => {
    const s = terminalReady('22:30');
    connect(s);
    s.c('JAN');
    s.key('J');
    logoffAndHangUp(s);
    connect(s, DK.phoneNumber);
    s.c('JANK');
    s.key('J');
    expect(Object.keys(s.state.telecom.bbs).sort()).toEqual(['bitschuppen', 'datenkeller']);
    expect(s.state.telecom.bbs.datenkeller.handle).toBe('JANK');
    const r = parseSave(serializeSave(createSaveFile(s.state, 't', '2026-01-01T00:00')));
    expect(r.ok && r.file.state.telecom.bbs.bitschuppen.handle).toBe('JAN');
  });

  test('Alte Spielstände (Schema 2) bekommen leere Mailbox-Konten', () => {
    const s = new Session();
    const old = structuredClone(s.state) as unknown as Record<string, unknown>;
    old.schemaVersion = 2;
    delete (old.telecom as Record<string, unknown>).bbs;
    const r = parseSave(
      JSON.stringify({ ...createSaveFile(s.state, 't', '2026-01-01T00:00'), schemaVersion: 2, state: old }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.state.telecom.bbs).toEqual({});
  });
});

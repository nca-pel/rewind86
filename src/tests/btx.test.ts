import { GAME_CONFIG } from '../content/config';
import { BTX_PAGES } from '../content/btx';
import { evalCondition } from '../engine/conditions';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { migrate } from '../engine/save';
import { createInitialState } from '../engine/state';
import { Session } from './helpers';

const B = GAME_CONFIG.btx;
const C = GAME_CONFIG.club;

/** Nach dem Clubabend: BTX-Set in der Hand, C64 aus, Hörer aufgelegt */
function afterClub(): Session {
  const s = new Session(false);
  s.state = milestoneState('end', step)!;
  if (s.state.computer.app) s.key('4');
  s.do({ type: 'dev', text: 'fakt club_evening' });
  s.do({ type: 'dev', text: `zeit ${C.eveningDate}T18:40` });
  s.a('gehe zum club');
  if (s.state.computer.powerOn) s.a('schalte computer aus');
  return s;
}

function plug(s: Session): void {
  s.a('stecke btx in den c64');
  s.a('schalte computer ein');
}

function typeKeys(s: Session, text: string): string {
  let out = '';
  for (const ch of text) out = s.key(ch);
  return out;
}

describe('BTX (Ausbauplan Punkt 7)', () => {
  test('Ohne Clubabend gibt es kein BTX-Set; der Club leiht es aus', () => {
    const before = new Session(false);
    before.state = milestoneState('end', step)!;
    expect(before.state.itemLocations.btx_kit).toBe('nowhere');
    const s = afterClub();
    expect(s.state.flags.clubAttended).toBe(true);
    expect(s.state.itemLocations.btx_kit).toBe('inventory');
  });

  test('Modul nur bei ausgeschaltetem Computer; startet beim Einschalten von selbst', () => {
    const s = afterClub();
    s.a('schalte computer ein');
    expect(s.a('stecke btx in den c64')).toMatch(/Schalte ihn vorher aus/);
    expect(s.state.itemLocations.btx_kit).toBe('inventory');
    s.a('schalte computer aus');
    s.a('stecke btx in den c64');
    expect(s.state.itemLocations.btx_kit).toBe('port');
    expect(s.a('untersuche c64')).toContain('Modulschacht');
    s.a('schalte computer ein');
    expect(s.state.computer.app?.id).toBe('btx');
    expect(s.screen()).toContain('BTX-DECODER');
    // Zurück zu BASIC; Reset startet den Decoder erneut
    s.key('RUNSTOP');
    expect(s.state.computer.app).toBeNull();
    expect(s.c('SYS 64738')).toContain('BTX-DECODER');
  });

  test('Verbinden, Seiten per Ziffer und *Nummer#, Folgeseite, Gebühren, Leitung belegt', () => {
    const s = afterClub();
    plug(s);
    const costs0 = s.state.phoneCostsDm;
    s.key('RETURN');
    expect(s.state.telecom.connectedSystemId).toBe('btx');
    expect(s.state.puzzles.P17).toBe('discovered');
    expect(s.has('btx_howto')).toBe(true);
    expect(s.screen()).toContain('WIEDENBRUECKER KURIER');
    // Die Hausleitung ist belegt
    expect(evalCondition(s.state, { lineBusy: true })).toBe(true);
    // Ziffer wählt Menüpunkt, # blättert
    expect(s.key('2')).toContain('WETTER');
    expect(s.state.phoneCostsDm).toBeGreaterThan(costs0);
    expect(typeKeys(s, '*123100')).toContain('> *123100');
    expect(s.key('#')).toContain('NACHRICHTEN');
    expect(s.key('#')).toContain('SEITE 2/2');
    expect(s.key('#')).toContain('KEINE FOLGESEITE');
    expect(s.key('0')).toContain('WIEDENBRUECKER KURIER');
    expect(typeKeys(s, '*999999#')).toContain('NICHT VORHANDEN');
    // Übersicht und Hilfe sind kostenfrei
    const c = s.state.phoneCostsDm;
    typeKeys(s, '*123900#');
    expect(s.state.phoneCostsDm).toBe(c);
    // Ende: Leitung wieder frei
    s.key('RUNSTOP');
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.state.telecom.call).toBeNull();
    expect(s.a('nimm hörer')).toMatch(/Hörer/);
  });

  test('Tagesabhängige Seiten: Einbruchsmeldung nur am 17./18.11., Sturmwarnung am Freitag', () => {
    const s = afterClub();
    s.do({ type: 'dev', text: 'zeit 1986-11-21T10:00' });
    plug(s);
    s.key('RETURN');
    expect(typeKeys(s, '*123200#')).toContain('STURMTIEF');
    typeKeys(s, '*123100#');
    expect(s.has('btx_break_in')).toBe(false);
    s.key('RUNSTOP');
    s.key('RETURN');
    // Einbruchsmeldung lässt sich an ihrem Tag abrufen
    const night = new Session(false);
    night.state = structuredClone(s.state);
    night.state.gameClock = '1986-11-17T20:00';
    night.state.telecom.connectedSystemId = 'btx';
    night.state.telecom.call = {
      kind: 'carrier',
      with: 'btx',
      number: B.accessNumber,
      startedAt: night.state.gameClock,
      unitsCharged: 0,
      outgoing: true,
    };
    (night.state.computer.app as unknown as { screen: string }).screen = 'page';
    expect(typeKeys(night, '*123100#')).toContain('SOFTWAREFIRMA');
    expect(night.has('btx_break_in')).toBe(true);
  });

  test('Telefon abheben beendet die Verbindung; Clubtafel löst P17, Inhalt erst nach dem Clubabend', () => {
    const s = afterClub();
    plug(s);
    s.key('RETURN');
    expect(typeKeys(s, `*${B.clubBoardPage}#`)).toContain('DEN GAST, DER GERNE FRAGT');
    expect(s.has('btx_club_board')).toBe(true);
    expect(s.state.puzzles.P17).toBe('solved');
    expect(s.a('nimm hörer')).toMatch(/Postmodem/);
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.screen()).toContain('VERBINDUNG GETRENNT');

    const early = new Session(false);
    early.state = milestoneState('end', step)!;
    expect(
      BTX_PAGES.find((p) => p.id === B.clubBoardPage)!
        .parts(early.state)[0]
        .join(' '),
    ).toContain('NOCH LEER');
  });

  test('Seiten passen auf den Bildschirm (≤ 40 Zeichen, ≤ 22 Zeilen)', () => {
    const s = afterClub();
    for (const p of BTX_PAGES)
      for (const part of p.parts(s.state)) {
        expect(part.length).toBeLessThanOrEqual(19);
        for (const line of part) expect(line.length).toBeLessThanOrEqual(40);
      }
  });

  test('Migration 6 → 7 ergänzt das BTX-Set', () => {
    const old = structuredClone(createInitialState()) as unknown as Record<string, unknown> & {
      itemLocations: Record<string, string>;
    };
    old.schemaVersion = 6;
    delete old.itemLocations.btx_kit;
    const m = migrate(old) as typeof old;
    expect(m.schemaVersion).toBe(7);
    expect(m.itemLocations.btx_kit).toBe('nowhere');
  });
});

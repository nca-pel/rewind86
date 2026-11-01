import { GAME_CONFIG } from '../content/config';
import { FULL_KEY } from '../engine/cipher';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { availableSends, visibleMessages } from '../sim/apps/modk';
import { Session } from './helpers';

const NUMBER = GAME_CONFIG.secretNetwork.phoneNumber;
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

/** Nach dem Ausschnitt, Modul mit vollständigem Ersatzschlüssel im Menü */
function moduleWithKey(): Session {
  const s = new Session(false);
  s.state = milestoneState('end', step)!;
  if (s.state.computer.app?.id === 'modk') s.key('4');
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
  s.key('J');
  s.key('3');
  for (const d of FULL_KEY) s.key(d);
  s.key('RETURN');
  return s;
}

function login(s: Session): void {
  dev(s, 'bez seidelSuspicion 0');
  s.key('1');
  s.a(`wähle ${NUMBER}`);
  s.a('lege hörer in den koppler');
  s.key('RETURN');
  expect(s.state.telecom.connectedSystemId).toBe('secret');
}

function read(s: Session, id: string): string {
  s.key('1');
  const n = visibleMessages(s.state).findIndex((m) => m.id === id);
  expect(n).toBeGreaterThanOrEqual(0);
  const screen = s.key(String(n + 1));
  s.key('RETURN');
  s.key('RETURN');
  return screen;
}

function logoff(s: Session): void {
  s.key('4');
  s.a('nimm hörer');
  s.a('lege auf');
}

describe('Senden im geheimen Netz', () => {
  test('Warnung an K-01 gibt es erst im Finale', () => {
    const s = new Session(false);
    s.state = milestoneState('end', step)!;
    expect(availableSends(s.state).map((x) => x.id)).not.toContain('warnung');
  });

  test('Quittung macht K-17 glaubwürdig; dann liefert die Anfrage den Treffpunkt (Beweis)', () => {
    const s = moduleWithKey();
    login(s);
    read(s, 'msg_k01_all');
    expect(s.has('k01_decrypted')).toBe(true);
    const before = s.state.relationships.networkCredibility;
    expect(s.key('2')).toContain('QUITTUNG AN K-01');
    s.key('1');
    expect(s.screen()).toContain('GESENDET AN K-01');
    expect(s.state.relationships.networkCredibility).toBe(before + 25);
    s.key('2');
    s.key('1'); // Anfrage (Quittung ist schon verschickt)
    expect(s.state.flags.sent_anfrage).toBe(true);
    dev(s, 'zeit +6');
    expect(s.state.flags.netMeeting).toBe(true);
    expect(read(s, 'msg_sys_meeting')).toContain('RASTSTAETTE');
    expect(s.has('net_meeting_point')).toBe(true);
    expect(GAME_CONFIG.finale.evidence).toContain('net_meeting_point');
  });

  test('Anfrage ohne Quittung: Das Netz wird misstrauisch', () => {
    const s = moduleWithKey();
    login(s);
    read(s, 'msg_k01_all');
    s.key('2');
    s.key('2'); // Anfrage
    dev(s, 'zeit +6');
    expect(s.state.flags.netWho).toBe(true);
    expect(s.state.flags.netMeeting).toBeUndefined();
  });

  test('Finale: Warnung an K-01 bricht die Übergabe ab – nur wenn K-17 glaubwürdig ist', () => {
    for (const [quittung, ending] of [
      [true, 'end_abort'],
      [false, undefined],
    ] as const) {
      const s = moduleWithKey();
      login(s);
      read(s, 'msg_k01_all');
      if (quittung) {
        s.key('2');
        s.key('1');
      }
      logoff(s);
      dev(s, `zeit ${GAME_CONFIG.ghost.actTwoEndsAt}`);
      login(s);
      const menu = s.key('2');
      expect(menu).toContain('WARNUNG AN K-01');
      const n = availableSends(s.state).findIndex((x) => x.id === 'warnung');
      s.key(String(n + 1));
      dev(s, 'zeit +11');
      expect(s.state.flags.gameOver).toBe(ending);
    }
  });

  test('Mit der echten Diskette 2 läuft das Modul voll: Schlüssel geladen, Senden frei', () => {
    const s = new Session(false);
    s.state = milestoneState('end', step)!;
    if (s.state.computer.app?.id === 'modk') s.key('4');
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
    dev(s, 'item disk_key drive');
    const menu = s.key('RETURN');
    expect(menu).toContain('VOLLBETRIEB');
    expect(menu).toContain('SCHLUESSEL GELADEN');
    expect(s.key('3')).toContain('SCHLUESSEL VON DISK 2');
    login(s);
    read(s, 'msg_k01_all');
    expect(s.has('k01_decrypted')).toBe(true);
    expect(s.key('2')).toContain('QUITTUNG AN K-01');
  });
});

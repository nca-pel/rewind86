import { GAME_CONFIG } from '../content/config';
import { Session } from './helpers';

const FX = GAME_CONFIG.mailboxes.fluxhq;
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

function start(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  return s;
}

describe('Neue Disketten aus der Schublade', () => {
  test('Fünf fabrikneue, unformatierte Disketten liegen in der Schublade', () => {
    const s = start();
    for (let n = 1; n <= 5; n++) {
      expect(s.state.itemLocations[`disk_new${n}`]).toBe('drawer');
      expect(s.state.disks[`new${n}`].formatted).toBe(false);
    }
    s.a('öffne schublade');
    expect(s.a('nimm zweite neue diskette')).not.toMatch(/verstehe/i);
    expect(s.state.itemLocations.disk_new2).toBe('inventory');
  });

  test('Fabrikneue Diskette: erst nach N0 formatieren benutzbar', () => {
    const s = start();
    s.a('öffne schublade');
    s.a('nimm zweite neue diskette');
    s.a('schalte computer ein');
    s.a('lege zweite neue diskette ins laufwerk');
    expect(s.state.itemLocations.disk_new2).toBe('drive');
    s.c('SAVE"X",8');
    expect(s.state.disks.new2.files).toHaveLength(0);
    s.c('LOAD"$",8');
    expect(s.screen()).toMatch(/FILE NOT FOUND/);
    s.c('OPEN 15,8,15,"N0:MEINE DISK,01":CLOSE 15');
    expect(s.state.disks.new2.formatted).toBe(true);
    expect(s.state.disks.new2.header).toBe('MEINE DISK');
    s.c('10 PRINT "HALLO"');
    s.c('SAVE"HALLO",8');
    expect(s.state.disks.new2.files.map((f) => f.name)).toContain('HALLO');
  });

  test('Archivdiskette lässt sich nicht versehentlich formatieren', () => {
    const s = start();
    s.a('öffne schublade');
    s.a('nimm archivdiskette');
    s.a('lege archivdiskette ins laufwerk');
    s.a('schalte computer ein');
    s.c('OPEN 15,8,15,"N0:WEG,01":CLOSE 15');
    expect(s.state.disks.archive.files.some((f) => f.appId)).toBe(true);
  });

  test('Download aus der Box landet nur auf einer formatierten Diskette', () => {
    const s = start();
    s.a('öffne schublade');
    s.a('nimm archivdiskette');
    s.a('lege archivdiskette ins laufwerk');
    s.a('schalte computer ein');
    dev(s, 'zeit 1986-11-15T19:00');
    s.c('LOAD"TERMINAL",8');
    s.c('RUN');
    s.state.telecom.bbs.fluxhq = {
      handle: 'JAN',
      status: 'mitglied',
      validateAt: '1986-11-15T18:00',
      lastLogin: null,
      inbox: [],
      posts: [],
      downloads: [],
    };
    s.a(`wähle ${FX.phoneNumber}`);
    s.a('lege hörer in den koppler');
    s.key('RETURN');
    s.c('JAN');
    // Archivdiskette tauschen gegen eine unformatierte
    s.state.itemLocations.disk_archive = 'inventory';
    s.state.itemLocations.disk_new1 = 'drive';
    s.key('3');
    s.key('1');
    expect(s.screen()).toContain('NICHT FORMATIERT');
    expect(s.state.disks.new1.files).toHaveLength(0);
    s.state.disks.new1.formatted = true;
    s.key('1');
    expect(s.state.disks.new1.files.map((f) => f.name)).toContain('STERNE');
  });
});

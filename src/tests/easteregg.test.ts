import { ABANDON_VIDEO_ID } from '../sim/apps/abandon';
import { renderC64 } from '../sim/c64';
import { Session } from './helpers';

function poweredOn(): Session {
  const s = new Session(false);
  s.a('schalte computer ein');
  return s;
}

describe('Easter-Egg LOAD"ABANDON",8,1', () => {
  test('startet das Video im Monitor – auch ohne Diskette', () => {
    const s = poweredOn();
    for (const [id, loc] of Object.entries(s.state.itemLocations))
      if (loc === 'drive') s.state.itemLocations[id] = 'desk';
    s.c('LOAD"ABANDON",8,1');
    expect(s.state.computer.app?.id).toBe('abandon');
    expect(renderC64(s.state).youtube).toBe(ABANDON_VIDEO_ID);
    expect(s.state.flags.abandonSeen).toBe(true);
  });

  test('Leerzeichen sind egal; RUN/STOP beendet das Video und kehrt zu READY zurück', () => {
    const s = poweredOn();
    s.c('load "abandon", 8, 1');
    expect(s.state.computer.app?.id).toBe('abandon');
    s.key('RUNSTOP');
    expect(s.state.computer.app).toBeNull();
    expect(renderC64(s.state).youtube).toBeUndefined();
    expect(s.screen()).toContain('READY.');
  });

  test('Ohne ",1" oder mit anderem Namen bleibt alles beim normalen LOAD', () => {
    const s = poweredOn();
    s.c('LOAD"ABANDON",8');
    expect(s.state.computer.app).toBeNull();
    s.c('LOAD"ABANDONED",8,1');
    expect(s.state.computer.app).toBeNull();
  });
});

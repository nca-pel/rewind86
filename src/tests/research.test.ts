import { GAME_CONFIG } from '../content/config';
import { MAILBOXES } from '../content/networks';
import { evalCondition } from '../engine/conditions';
import { Session } from './helpers';

/** Radio an, Infowelle, zur angegebenen Zeit */
function infoAt(clock: string): string {
  const s = new Session(false);
  s.state.gameClock = clock;
  s.state.objectStates.radio.station = 'info';
  s.state.objectStates.radio.on = false;
  return s.a('schalte radio ein');
}

describe('Recherche: Tagesnachrichten, Btx, K-01', () => {
  test('Infowelle bringt belegte Meldungen nur an ihrem Tag', () => {
    expect(infoAt('1986-11-14T16:00')).toContain('Reagan');
    expect(infoAt('1986-11-15T16:00')).toContain('Regionalnachrichten');
    // Besse wurde am 17.11. gegen 20:30 erschossen – vorher keine Meldung
    expect(infoAt('1986-11-17T18:00')).not.toContain('Besse');
    expect(infoAt('1986-11-17T21:00')).toContain('Besse');
    expect(infoAt('1986-11-19T10:00')).toContain('Buß- und Bettag');
  });

  test('Btx: historische Zugangsnummer 190', () => {
    expect(GAME_CONFIG.btx.accessNumber).toBe('190');
  });

  test('DATENKELLER: Gerücht über K-01 erst ab Dienstagabend', () => {
    const msg = MAILBOXES.datenkeller.boards.flatMap((b) => b.messages).find((m) => m.id === 'dk_k01')!;
    const s = new Session(false);
    s.state.gameClock = '1986-11-17T23:00';
    expect(evalCondition(s.state, msg.when)).toBe(false);
    s.state.gameClock = '1986-11-18T23:00';
    expect(evalCondition(s.state, msg.when)).toBe(true);
    expect(msg.body.join(' ')).toContain('DRUEBEN');
  });
});

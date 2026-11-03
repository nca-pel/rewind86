import { GAME_CONFIG } from '../content/config';
import { Session } from './helpers';

/** Befunde aus dem kompletten Durchspielen (Logikfehler, die echte Spieler treffen würden). */
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

function afterDoor(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('frage ralf nach arbeit');
  s.a('lege auf');
  s.a('warte');
  return s;
}

describe('Durchspiel-Befunde', () => {
  test('Fünf billige Indizien ohne Entschlüsselung reichen der Polizei nicht', () => {
    const s = afterDoor();
    for (const f of ['wt07_trace', 'secret_mailbox', 'key_leak', 'cassette', 'seidel_phones'])
      dev(s, `fakt ${f}`);
    dev(s, `zeit ${GAME_CONFIG.ghost.actTwoEndsAt}`);
    s.a('wähle 110');
    dev(s, 'zeit +10');
    expect(s.state.flags.gameOver).toBe('end_dismissed');
  });

  test('Mit entschlüsseltem Rundschreiben und genug Beweisen: Enttarnung', () => {
    const s = afterDoor();
    for (const f of ['wt07_trace', 'secret_mailbox', 'key_leak', 'k01_decrypted']) dev(s, `fakt ${f}`);
    dev(s, `zeit ${GAME_CONFIG.ghost.actTwoEndsAt}`);
    s.a('wähle 110');
    dev(s, 'zeit +10');
    expect(s.state.flags.gameOver).toBe('end_exposed');
  });

  test('Die Kassette allein zählt nicht als Beweis', () => {
    expect(GAME_CONFIG.finale.evidence).not.toContain('cassette');
  });

  test('DENKE NACH hilft nach dem Entschlüsseln und im Finale weiter', () => {
    const s = afterDoor();
    dev(s, 'fakt k01_decrypted');
    s.a('warte 1');
    expect(s.a('denke nach')).not.toMatch(/nichts ein/);
    expect(s.state.puzzles.P10).toBe('discovered');
    dev(s, `zeit ${GAME_CONFIG.ghost.actTwoEndsAt}`);
    s.state.hintLevels = {};
    expect(s.a('denke nach')).toMatch(/23:30/);
  });

  test.each([
    'stecke btx-set in den c64',
    'stecke das btx set in den c64',
    'stecke decoder in den modulschacht',
  ])('Parser versteht »%s«', (cmd) => {
    const s = afterDoor();
    dev(s, 'item btx_kit inventory');
    expect(s.a(cmd)).toMatch(/Modulschacht/);
    expect(s.state.itemLocations.btx_kit).toBe('port');
  });

  test('Nicht vorhandene Gegenstände stehen im Akkusativ', () => {
    const s = new Session();
    expect(s.a('lies rundbrief')).toMatch(/^Den Rundbrief hast du \(noch\) nicht\./m);
  });

  test('Leere, offene Schublade wird in der Umschau eindeutig benannt', () => {
    const s = afterDoor();
    s.a('öffne schublade');
    s.a('nimm 1001');
    s.a('nimm archivdiskette');
    s.a('lege archivdiskette ins laufwerk');
    // das Fünferpack neuer Disketten ebenfalls ausräumen
    for (let n = 1; n <= 5; n++) s.state.itemLocations[`disk_new${n}`] = 'inventory';
    expect(s.a('schau dich um')).toMatch(/Die Schublade ist offen und/);
  });

  test('SAVE auf Kassette kennt die angeschlossene Datasette', () => {
    const s = afterDoor();
    s.a('schalte computer ein');
    const before = s.log.length;
    s.c('SAVE"X",1');
    expect(
      s.log
        .slice(before)
        .map((l) => l.text)
        .join('\n'),
    ).toMatch(/Ohne angeschlossene Datasette/);
    dev(s, 'item cassette inventory');
    s.a('lege kassette in datasette');
    const mid = s.log.length;
    s.c('SAVE"X",1');
    expect(
      s.log
        .slice(mid)
        .map((l) => l.text)
        .join('\n'),
    ).toMatch(/Prüfband/);
  });
});

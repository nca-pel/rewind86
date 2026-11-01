import { GAME_CONFIG } from '../content/config';
import { ENDING_BY_ID } from '../content/endings';
import { BITSCHUPPEN } from '../content/networks';
import { boardEntries } from '../engine/bbs';
import { Session } from './helpers';

const G = GAME_CONFIG.ghost;
const BS = GAME_CONFIG.mailboxes.bitschuppen;
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });
const text = (s: Session) => s.log.map((l) => l.text).join('\n');

function toClub(s: Session): void {
  dev(s, 'fakt club_evening');
  dev(s, `zeit ${GAME_CONFIG.club.eveningDate}T18:45`);
  s.a('gehe zum club');
}

describe('Akt 2: Clubabend und GHOST', () => {
  test('Clubabend: Herr Brandt verrät sich durch seine Wendungen', () => {
    const s = new Session();
    toClub(s);
    expect(s.state.flags.clubAttended).toBe(true);
    expect(s.has('brandt_word')).toBe(true);
    expect(text(s)).toContain(G.civilName);
    expect(text(s)).toContain('Fürwahr');
    // Ohne vorherigen Mailbox-Besuch ist die Verbindung noch nicht gezogen
    expect(s.has('brandt_is_ghost')).toBe(false);
  });

  test('Wer GHOSTs Beiträge kennt, erkennt Brandt am Clubabend', () => {
    const s = new Session();
    dev(s, 'fakt ghost_word');
    toClub(s);
    expect(s.has('brandt_is_ghost')).toBe(true);
    expect(text(s)).toContain('GHOST');
  });

  test('Prolog-Spieltexte nennen GHOST und Brandt weiterhin nicht (nur Mailbox-Inhalte)', () => {
    const s = new Session();
    s.a('schau dich um');
    expect(text(s)).not.toMatch(/GHOST|Brandt/);
  });

  test.each([
    ['alone', [], 'Niemand weiß etwas'],
    ['ghost', ['toldGhost'], 'Spuren löschen'],
    ['ralf', ['toldRalf'], 'Ralf hört im Haus mit'],
    ['both', ['toldGhost', 'toldRalf'], 'Zwei Menschen wissen'],
  ] as const)('Ende Akt 2: Entscheidung %s', (choice, flags, snippet) => {
    const s = new Session();
    for (const f of flags) dev(s, `flag ${f} true`);
    dev(s, `zeit ${G.actTwoEndsAt}`);
    expect(s.state.flags.act2Choice).toBe(choice);
    expect(text(s)).toContain(snippet);
  });

  test('Mail an GHOST legt sich fest, senkt den Verdacht und wird beantwortet', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte');
    s.a('öffne schublade');
    s.a('nimm archivdiskette');
    s.a('lege archivdiskette ins laufwerk');
    s.a('schalte computer ein');
    dev(s, 'zeit 18:05');
    s.c('LOAD"TERMINAL",8');
    s.c('RUN');
    const connect = () => {
      s.a(`wähle ${BS.phoneNumber}`);
      s.a('lege hörer in den koppler');
      s.key('RETURN');
    };
    connect();
    s.c('JAN');
    s.key('J');
    s.key('5');
    s.a('lege auf');
    dev(s, 'zeit 19:00');
    connect();
    s.c('JAN');
    dev(s, 'bez seidelSuspicion 30');
    // Club-Brett: GHOSTs erster Beitrag ist ohne Mitgliedschaft lesbar
    s.key('1');
    const boards = s.screen();
    expect(boards).toContain('CLUB');
    s.key('RETURN');
    // Private Post an GHOST
    s.key('2');
    s.key('S');
    s.c(G.handle);
    s.c('Freitag');
    s.c('Ich vertraue dir.');
    s.c('');
    expect(s.state.flags.toldGhost).toBe(true);
    expect(s.has('ghost_trusted')).toBe(true);
    expect(s.state.relationships.seidelSuspicion).toBeLessThan(30);
    expect(s.state.telecom.bbs.bitschuppen.inbox.some((m) => m.subject === 'RE: FREITAG')).toBe(true);
  });

  test('CLUB-Brett: Beiträge erscheinen nach Datum und Clubbesuch, genau eine Variante von gh_3', () => {
    const s = new Session();
    const board = BITSCHUPPEN.boards.find((b) => b.id === 'club')!;
    const ids = () => boardEntries(s.state, 'bitschuppen', board).map((e) => e.msg.id);
    expect(ids()).toEqual(['gh_1']);
    dev(s, 'zeit 1986-11-17T08:00');
    expect(ids()).toEqual(['gh_1', 'gh_2']);
    s.state.flags.clubAttended = true;
    expect(ids()).toEqual(['gh_1', 'gh_2', 'gh_3_plain']);
    dev(s, 'fakt brandt_word');
    expect(ids()).toEqual(['gh_1', 'gh_2', 'gh_3_brandt']);
  });

  test('Ralf: GHOST-Thema wirkt einmal, danach nur noch Nachfrage', () => {
    const s = new Session();
    dev(s, 'flag ralfDelivered true');
    dev(s, 'fakt ghost_offer');
    dev(s, 'zeit 1986-11-16T11:00');
    // Ralf ruft nach dem Abheben zurück (Gespräch läuft bereits)
    s.a('nimm hörer');
    const first = s.a('frage ralf nach ghost');
    expect(first).toMatch(/Brandt/);
    expect(s.state.flags.toldRalf).toBe(true);
    expect(s.has('ralf_told_ghost')).toBe(true);
    // Seidels Kino-Alibi (»Der Name der Rose«, Spätvorstellung) zählt als Beweis
    expect(first).toMatch(/Der Name der Rose/);
    expect(s.has('seidel_alibi')).toBe(true);
    expect(GAME_CONFIG.finale.evidence).toContain('seidel_alibi');
    expect(s.a('frage ralf nach ghost')).toMatch(/alles gesagt/);
  });

  describe('Finale', () => {
    const EVIDENCE = GAME_CONFIG.finale.evidence;

    function atFinale(facts: string[] = []): Session {
      const s = new Session();
      // Prolog durchspielen: Ralf ruft an und bringt die Diskette
      s.a('nimm hörer');
      s.a('lege auf');
      s.a('warte');
      for (const f of facts) dev(s, `fakt ${f}`);
      dev(s, `zeit ${G.actTwoEndsAt}`);
      expect(s.state.flags.finaleOpen).toBe(true);
      return s;
    }

    test('110 ist vor dem Finale gesperrt, im Finale führt sie zur Polizei', () => {
      const s = new Session();
      s.a('nimm hörer');
      s.a('lege auf');
      s.a('warte');
      s.a('nimm hörer');
      expect(s.a('wähle 110')).toMatch(/keinen Grund/);
      s.a('lege auf');
      const f = atFinale();
      f.a('nimm hörer');
      expect(f.a('wähle 110')).toMatch(/Polizei/);
    });

    test('Starke Beweislage: Enttarnung; schwache: nur ein Vermerk', () => {
      const strong = atFinale(EVIDENCE.slice(0, GAME_CONFIG.finale.strongEvidence));
      strong.a('nimm hörer');
      strong.a('wähle 110');
      dev(strong, 'zeit +10');
      expect(strong.state.flags.gameOver).toBe('end_exposed');

      const weak = atFinale(EVIDENCE.slice(0, 2));
      weak.a('nimm hörer');
      weak.a('wähle 110');
      dev(weak, 'zeit +10');
      expect(weak.state.flags.gameOver).toBe('end_dismissed');
    });

    test('Ralf: mit Vertrauen hält er den Vater auf, ohne verrät er es', () => {
      for (const [trust, ending] of [
        [60, 'end_ralf_stops'],
        [10, 'end_ralf_betrayal'],
      ] as const) {
        const s = atFinale();
        dev(s, `bez ralfTrust ${trust}`);
        s.a('nimm hörer');
        s.a(`wähle ${GAME_CONFIG.ralf.phoneNumber}`);
        const out = s.a('frage ralf nach ghost');
        expect(out).toMatch(/Heute Nacht/);
        dev(s, 'zeit +15');
        expect(s.state.flags.gameOver).toBe(ending);
      }
    });

    test('Ohne Handlung endet der Abend um die Schlusszeit still', () => {
      const s = atFinale();
      dev(s, `zeit ${GAME_CONFIG.finale.closesAt}`);
      expect(s.state.flags.gameOver).toBe('end_silent');
    });

    test('Alle Enden existieren mit Titel und Text', () => {
      for (const id of [
        'end_exposed',
        'end_dismissed',
        'end_cover',
        'end_ralf_stops',
        'end_ralf_betrayal',
        'end_silent',
        'end_discovered',
      ])
        expect(ENDING_BY_ID[id]?.text.length).toBeGreaterThan(100);
    });
  });

  test('Finale: Beweise per Post an GHOST führen zum Ende „Mentor räumt auf“', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte');
    s.a('öffne schublade');
    s.a('nimm archivdiskette');
    s.a('lege archivdiskette ins laufwerk');
    s.a('schalte computer ein');
    dev(s, 'zeit 18:05');
    s.c('LOAD"TERMINAL",8');
    s.c('RUN');
    const connect = () => {
      s.a(`wähle ${BS.phoneNumber}`);
      s.a('lege hörer in den koppler');
      s.key('RETURN');
    };
    connect();
    s.c('JAN');
    s.key('J');
    s.key('5');
    s.a('lege auf');
    dev(s, `zeit ${G.actTwoEndsAt}`);
    expect(s.state.flags.finaleOpen).toBe(true);
    connect();
    s.c('JAN');
    s.key('2');
    s.key('S');
    s.c(G.handle);
    s.c('Beweise');
    s.c('Alles, was ich habe.');
    s.c('');
    expect(s.state.flags.toldGhost).toBe(true);
    dev(s, 'zeit +20');
    expect(s.state.flags.gameOver).toBe('end_cover');
  });

  describe('Seidels Anruf im Finale', () => {
    function seidelRings(): Session {
      const s = new Session();
      s.a('nimm hörer');
      s.a('lege auf');
      s.a('warte');
      dev(s, `zeit ${GAME_CONFIG.finale.seidelCallAt}`);
      expect(s.state.telecom.ringing).toBe('seidel');
      return s;
    }

    test('Nach Ralf gefragt, verplappert er sich (Beweis) und legt nach drei Antworten auf', () => {
      const s = seidelRings();
      expect(s.a('nimm hörer')).toContain('Martin Seidel');
      expect(s.a('frage seidel nach ralf')).toContain('Raststätte');
      expect(s.has('seidel_rastplatz')).toBe(true);
      expect(GAME_CONFIG.finale.evidence).toContain('seidel_rastplatz');
      s.a('frage seidel nach dem spiel');
      expect(s.a('frage seidel nach der arbeit')).toMatch(/Gute Nacht/);
      expect(s.state.telecom.handset).toBe('cradle');
      expect(s.state.conversation).toBeNull();
    });

    test('Wer Brandt erwähnt, warnt Seidel: Er legt auf und zieht die Übergabe vor', () => {
      const s = seidelRings();
      s.a('nimm hörer');
      expect(s.a('frage seidel nach ghost')).toContain('Brandt');
      expect(s.state.flags.seidelWarned).toBe(true);
      expect(s.state.telecom.handset).toBe('cradle');
      dev(s, `zeit +${GAME_CONFIG.finale.warnedCloseInMinutes + 1}`);
      expect(s.state.flags.gameOver).toBe('end_silent');
    });

    test('Wer den stummen Anruf erlebt hat, erkennt Seidels Atmen wieder', () => {
      const s = seidelRings();
      dev(s, 'flag anonCallDone true');
      expect(s.a('nimm hörer')).toContain('Von dem Anruf, bei dem niemand etwas gesagt hat');
    });

    test('Nicht abgenommen: Die Mutter geht ran, Seidel bleibt misstrauisch', () => {
      const s = seidelRings();
      dev(s, 'zeit +5');
      expect(s.state.telecom.ringing).toBeNull();
      expect(s.has('seidel_called')).toBe(true);
      expect(text(s)).toContain('Herr Seidel');
    });
  });
});

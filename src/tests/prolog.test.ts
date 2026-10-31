import { DIALOGUE } from '../content/dialogue';
import { EVENTS } from '../content/events';
import { FACT_BY_ID } from '../content/facts';
import { MAILBOXES } from '../content/networks';
import { PUZZLES } from '../content/puzzles';
import { GAME_CONFIG } from '../content/config';
import type { GameEffect } from '../engine/types';
import { Session } from './helpers';

/** Spielt den vertikalen Ausschnitt bis zur Mailbox durch (reiner Textweg, ohne Debugwerkzeuge). */
export function playToSecretMode(s: Session): void {
  s.a('nimm hörer');
  s.a('frage ralf nach dem spiel');
  s.a('lege auf');
  s.a('warte');
  s.a('untersuche diskette');
  s.a('lege diskette ins laufwerk');
  s.a('schalte computer ein');
  s.c('LOAD"$",8');
  s.c('LIST');
  s.c('LOAD"*",8');
  s.c('RUN');
  // Intro wiederholbar: RETURN schaltet zu den Credits, Taste ← öffnet das Modul.
  s.key('RETURN');
  s.key('RETURN');
  s.key('ARROW_LEFT');
}

describe('Prolog (GDD §19.4, §18.1)', () => {
  test('Ralf ruft an, bringt die Diskette, erwähnt Training und geht sofort', () => {
    const s = new Session();
    expect(s.log.map((l) => l.text).join('\n')).toMatch(/Telefon .*klingelt/);
    const call = s.a('nimm hörer');
    expect(call).toMatch(/Spiel, das es noch gar nicht zu kaufen gibt/);
    expect(s.a('frage ralf nach seidel')).toMatch(/kein Wort zu ihm/);
    s.a('lege auf');
    const door = s.a('warte');
    expect(door).toMatch(/Training/);
    expect(door).toMatch(/drückt dir eine Diskette in die Hand/);
    expect(door).toMatch(/allein/);
    expect(s.state.itemLocations.disk_game).toBe('inventory');
    // Ralf bleibt nicht zum Untersuchen
    expect(s.a('frage ralf nach dem spiel')).toMatch(/längst weg/);
    expect(s.state.flags.ralfPresent).toBe(false);
  });

  test('Ralf beendet das Gespräch selbst nach einigen Fragen – kein Soft-Lock', () => {
    const s = new Session();
    s.a('nimm hörer');
    for (let i = 0; i < 6; i++) s.a('frage ralf nach der schule');
    expect(s.state.telecom.handset).toBe('cradle');
    s.a('warte 20');
    expect(s.state.itemLocations.disk_game).toBe('inventory');
  });

  test('Intro: geheimer Modus unabhängig von Reaktionsgeschwindigkeit, Diskette 2 fehlt', () => {
    const s = new Session();
    playToSecretMode(s);
    expect(s.state.computer.app?.id).toBe('modk');
    expect(s.screen()).toContain('SCHLUESSELDISKETTE (2)');
    s.key('RETURN');
    expect(s.screen()).toContain('?SCHLUESSEL NICHT GEFUNDEN');
    expect(s.has('needs_disk2')).toBe(true);
  });

  test('Intro ist wiederholbar und die Taste wirkt in jedem Credits-Durchlauf', () => {
    const s = new Session();
    playToSecretMode(s);
    s.key('RUNSTOP');
    s.c('RUN');
    expect(s.state.computer.app?.id).toBe('wt07');
    s.tick(40); // mehrere automatische Durchläufe
    // falscher Zeitpunkt: nichts passiert
    const phase = (s.state.computer.app as unknown as { phase: string }).phase;
    if (phase !== 'credits') {
      s.key('ARROW_LEFT');
      expect(s.state.computer.app?.id).toBe('wt07');
    }
    while ((s.state.computer.app as unknown as { phase: string }).phase !== 'credits') s.key('RETURN');
    s.key('ARROW_LEFT');
    expect(s.state.computer.app?.id).toBe('modk');
  });

  test('Geheimer Modus per Textparser erreichbar (DRÜCKE PFEILTASTE)', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte');
    s.a('lege diskette ins laufwerk. schalte computer ein');
    s.a('tippe LOAD"*",8');
    s.a('tippe RUN');
    s.a('drücke return');
    s.a('drücke return');
    s.a('drücke pfeiltaste');
    expect(s.state.computer.app?.id).toBe('modk');
  });

  test('Kompletter Ausschnitt: Einstiegsrätsel, Mailbox ohne Diskette 2, Leitung, Ende', () => {
    const s = new Session();
    playToSecretMode(s);
    s.key('RETURN');
    s.key('J');
    s.key('1'); // Verbindung → Hinweis auf LADER
    expect(s.screen()).toContain('ERSATZWAHL: SIEHE LADER');
    s.key('RUNSTOP');
    s.key('3'); // Modul beenden
    s.c('LOAD"LADER",8');
    s.c('LIST');
    expect(s.has('data_lines')).toBe(true);
    s.a('öffne päckchen');
    s.a('lies tabelle');
    expect(s.has('chr_table')).toBe(true);
    s.a('lies artikel');

    // Zurück ins Modul
    s.c('LOAD"*",8');
    s.c('RUN');
    s.key('RETURN');
    s.key('RETURN');
    s.key('ARROW_LEFT');
    s.key('RETURN');
    s.key('J');
    s.key('1');

    // Ohne Koppler keine Verbindung
    s.key('RETURN');
    expect(s.screen()).toContain('KEIN TRAEGER');

    expect(s.a(`wähle ${GAME_CONFIG.secretNetwork.phoneNumber}`)).toMatch(/Modem/);
    // Gleiche Leitung: normales Telefonieren geht jetzt nicht
    expect(s.a('rufe ralf an')).toMatch(/telefonierst gerade/);
    s.a('lege hörer in den koppler');
    s.key('RETURN');
    expect(s.state.telecom.connectedSystemId).toBe('secret');
    expect(s.has('secret_mailbox')).toBe(true);
    expect(s.state.disks.key).toBeDefined();
    expect(s.state.itemLocations.disk_key).toBe('nowhere'); // Diskette 2 war nicht nötig

    s.key('1');
    s.key('1');
    expect(s.screen()).toContain('SCHLUESSEL FEHLT');
    s.key('X');
    s.key('2');
    expect(s.screen()).toContain('WT-07');
    s.key('X');
    s.key('RETURN');
    s.key('3');
    s.key('X');
    // Elternereignis: Mutter hört das Modem (getrennte physische/digitale Simulation)
    expect(s.state.flags.motherHeardModem).toBe(true);
    expect(s.a('nimm hörer')).toMatch(/NO CARRIER/);
    expect(s.state.telecom.connectedSystemId).toBeNull();
    s.a('lege auf');
    expect(s.state.flags.sliceEnded).toBe(true);
    expect(s.log.some((l) => l.text.includes('Fortsetzung folgt'))).toBe(true);
    expect(s.state.phoneCostsDm).toBeGreaterThan(0);
    // Verdacht steigt intern, wird aber nirgends als Zahl ausgegeben
    expect(s.state.relationships.seidelSuspicion).toBeGreaterThan(0);
    expect(s.log.some((l) => /seidelSuspicion|Verdacht: \d/.test(l.text))).toBe(false);
  });

  test('Vater-Ereignis: belegte Leitung wird bemerkt', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte');
    s.state.gameClock = '1986-11-14T18:25';
    s.a('nimm hörer');
    s.a('warte 10');
    expect(s.state.flags.fatherNoticedBusyLine).toBe(true);
  });

  test('Vater telefoniert: Leitung belegt für Jan', () => {
    const s = new Session();
    s.a('nimm hörer');
    s.a('lege auf');
    s.a('warte');
    s.state.gameClock = '1986-11-14T18:29';
    s.a('warte 2');
    expect(s.a('nimm hörer')).toMatch(/Leitung ist belegt/);
  });
});

describe('INTRUDER-Demo (GDD §12, §19.4)', () => {
  test('Mehrere Screens, Jan-Reaktion, stumm verständlich, optional', () => {
    const s = new Session();
    s.a('öffne schublade');
    s.a('nimm 1001');
    s.a('lege 1001 ins laufwerk');
    s.a('schalte computer ein');
    s.c('LOAD"*",8');
    s.c('RUN');
    expect(s.state.computer.app?.id).toBe('intruder');
    expect(s.log.some((l) => l.text.includes('Brotkasten'))).toBe(true);
    expect(s.ui).toContainEqual({ type: 'demoMusic', on: true });
    const screens = new Set<number>();
    for (let i = 0; i < 3; i++) {
      screens.add((s.state.computer.app as unknown as { screen: number }).screen);
      s.key('SPACE');
    }
    expect(screens.size).toBeGreaterThanOrEqual(2);
    expect(s.has('demo_border')).toBe(true);
    // Textuelle Laufschrift als Untertitel
    expect(s.log.some((l) => l.kind === 'caption' && l.text.includes('Laufschrift'))).toBe(true);
    s.key('RUNSTOP');
    expect(s.state.computer.app).toBeNull();
  });

  test('Hauptgeschichte ist ohne Demo lösbar', () => {
    const s = new Session();
    playToSecretMode(s);
    expect(s.has('demo_seen')).toBe(false);
    expect(s.state.computer.app?.id).toBe('modk');
  });
});

describe('Archiv am C64', () => {
  test('Eintrag anlegen und suchen; Daten im Spielzustand', () => {
    const s = new Session();
    s.a('öffne schublade. nimm archivdiskette. lege sie ins laufwerk. schalte computer ein');
    expect(s.state.itemLocations.disk_archive).toBe('drive');
    s.c('LOAD"*",8');
    s.c('RUN');
    expect(s.state.computer.app?.id).toBe('archive');
    s.key('7');
    s.key('1');
    s.c('SEIDEL');
    s.c('STIEFVATER VON RALF');
    expect(s.state.archive.some((e) => e.title === 'SEIDEL' && e.section === 'personen')).toBe(true);
    s.key('X');
    s.key('6');
    expect(s.c('RALF')).toContain('SEIDEL: STIEFVATER VON RALF');
  });
});

describe('Content-Integrität', () => {
  const effects: GameEffect[] = [
    ...EVENTS.flatMap((e) => e.variants.flatMap((v) => v.effects)),
    ...DIALOGUE.flatMap((d) => d.effects ?? []),
    ...Object.values(MAILBOXES).flatMap((m) => [
      ...m.messages.flatMap((x) => x.effects),
      ...m.sysinfoEffects,
    ]),
  ];
  test('Alle referenzierten Fakten, Ereignisse und Rätsel existieren', () => {
    for (const e of effects) {
      if (e.type === 'discoverFact') expect(FACT_BY_ID[e.id], e.id).toBeDefined();
      if (e.type === 'scheduleEvent')
        expect(
          EVENTS.some((x) => x.id === e.id),
          e.id,
        ).toBe(true);
      if (e.type === 'puzzle')
        expect(
          PUZZLES.some((x) => x.id === e.id),
          e.id,
        ).toBe(true);
    }
  });
  test('Jedes Rätsel hat in jeder Stufe genau drei Hilfetexte', () => {
    for (const p of PUZZLES)
      for (const st of p.stages) expect(st.hints.filter((h) => h.length > 10)).toHaveLength(3);
  });
  test('DENKE NACH eskaliert in drei Stufen und löst nichts automatisch', () => {
    const s = new Session();
    const before = structuredClone(s.state.itemLocations);
    expect(s.a('denke nach')).toMatch(/Denkanstoß \(1\/3\)/);
    expect(s.a('denke nach')).toMatch(/Konkreter Hinweis \(2\/3\)/);
    expect(s.a('denke nach')).toMatch(/Hilfestellung \(3\/3\)/);
    expect(s.state.itemLocations).toEqual(before);
    expect(s.state.telecom.ringing).toBe('ralf');
  });
  test('Offene Storypunkte bleiben als Platzhalter markiert', () => {
    expect(GAME_CONFIG.ghost.civilIdentity).toBe('GHOST_CIVIL_IDENTITY_TBD');
    expect(GAME_CONFIG.unreleasedGame.workingTitle).toBe('WORKING_TITLE_TBD');
    expect(GAME_CONFIG.intruder.hintLink).toBeNull();
  });
});

import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { Session } from './helpers';

/**
 * Korpus natürlicher Eingaben aus der Playtest-Auswertung (Ausbauplan Punkt 8). Jede Zeile muss ohne
 * »nicht verstanden«-Protokolleintrag laufen und erwartete Wirkung zeigen. Neue Fehlschläge aus dem
 * Protokoll hier ergänzen.
 */
const CASES: Array<[string, RegExp]> = [
  ['wo bin ich', /Schreibtisch|Zimmer|Monitor/],
  ['was soll ich tun', /Hilfestellung|Hinweis|\(1\/3\)/],
  ['was kann ich tun', /Hilfestellung|Hinweis|\(1\/3\)/],
  ['was ist in der schublade', /schublade/i],
  ['was steht auf dem etikett', /Etikett|ARBEITSKOPIE|WT-07/],
  ['lies das etikett', /Etikett|ARBEITSKOPIE|WT-07/],
  ['leg dich hin', /schlaf|Müde|zu früh|noch nicht/i],
  ['befrage ralf', /Ralf|nicht hier|Telefon/],
  ['erkläre ralf alles', /Ralf|nicht hier|Telefon|Hörer/],
  ['öffne die schachtel', /Päckchen|Schnur|Zeitschrift|offen/i],
  ['ja', /Niemand hat dich gerade etwas gefragt/],
  ['nein', /Niemand hat dich gerade etwas gefragt/],
];

describe('Parser-Korpus', () => {
  test.each(CASES)('»%s« wird verstanden', (phrase, expected) => {
    const s = new Session(false);
    s.state = milestoneState('c64', step)!;
    const ui = s.ui.length;
    const out = s.a(phrase);
    const missed = s.ui.slice(ui).filter((u) => (u as { type: string }).type === 'parseMiss');
    expect(out).toMatch(expected);
    // ja/nein sind absichtlich Antworten ohne Frage, aber kein Parserfehler
    expect(missed).toEqual([]);
  });

  test('»zeige mir die dateien« zeigt am C64 das Verzeichnis', () => {
    const s = new Session(false);
    s.state = milestoneState('c64', step)!;
    s.a('zeige mir die dateien');
    expect(s.screen()).toContain('SPIEL.07');
  });

  test('Zeitschrift im geschlossenen Päckchen: hilfreicher Hinweis statt „nichts zu sehen“', () => {
    const s = new Session(false);
    s.state = milestoneState('c64', step)!;
    // Neue Spiele beginnen mit offenem Päckchen; ältere Spielstände können es noch geschlossen haben
    s.state.objectStates.package.open = false;
    expect(s.a('lies den artikel')).toMatch(/Päckchen/);
    expect(s.a('lies die zeitschrift')).toMatch(/ÖFFNE PÄCKCHEN/);
  });
});

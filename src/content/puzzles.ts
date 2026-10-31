import type { Condition } from '../engine/types';

export interface HintStage {
  /** Die erste passende Stufe liefert die drei Hilfetexte. */
  when?: Condition;
  hints: [string, string, string];
}

export interface PuzzleDef {
  id: string;
  title: string;
  strand: string;
  /** Reihenfolge für "aktuelles Rätsel" bei DENKE NACH */
  order: number;
  stages: HintStage[];
  historicalStatus: 'plausible' | 'fictional';
}

export const PUZZLES: PuzzleDef[] = [
  {
    id: 'P01',
    title: 'Ralfs Diskette starten',
    strand: 'Prolog',
    order: 1,
    historicalStatus: 'plausible',
    stages: [
      {
        when: { ringing: true },
        hints: [
          'Da klingelt doch etwas …',
          'Das Telefon klingelt. Geh ran.',
          'Tippe NIMM HÖRER (oder HEBE AB). Danach kannst du z. B. FRAGE RALF NACH DEM SPIEL eingeben.',
        ],
      },
      {
        when: { notItemAt: 'disk_game', loc: 'inventory' },
        hints: [
          'Ralf wollte vorbeikommen. Die Diskette kommt zu dir – du musst nirgendwo hin.',
          'Wenn du mit Ralf fertig bist, leg auf und lass etwas Zeit vergehen.',
          'LEGE AUF, dann WARTE (oder WARTE 15). Ralf klingelt kurz darauf an der Tür.',
        ],
      },
      {
        hints: [
          'Die Diskette muss irgendwie in den Computer.',
          'Leg die Diskette ins Laufwerk und schalte den C64 ein. Dann schau dir am C64 an, was drauf ist.',
          'LEGE DISKETTE INS LAUFWERK, SCHALTE COMPUTER EIN. Am C64: LOAD"$",8 und LIST zeigen das Verzeichnis, LOAD"*",8 und RUN starten das erste Programm. (Kurz: ZEIGE DATEIEN / LADE SPIEL.)',
        ],
      },
    ],
  },
  {
    id: 'P03',
    title: 'Geheime Intro-Umschaltung',
    strand: 'C64',
    order: 3,
    historicalStatus: 'fictional',
    stages: [
      {
        when: { notFact: 'intro_arrow' },
        hints: [
          'Schau dir das Intro einmal ganz in Ruhe an. Es wiederholt sich.',
          'Achte auf die Credits. Da passiert etwas, das nicht ins Bild passt.',
          'Mit RETURN kannst du im Intro von Bild zu Bild schalten. In den Credits blitzt oben links etwas auf.',
        ],
      },
      {
        hints: [
          'Der Pfeil oben links … wo sitzt so ein Pfeil auf der C64-Tastatur?',
          'Die C64-Tastatur hat ganz oben links eine Taste mit einem Pfeil nach links: »←«.',
          'Drücke während der Credits die Taste »←« (Sondertaste unter dem Monitor, auf PC-Tastaturen ^ oder `) – oder tippe im Adventure DRÜCKE PFEILTASTE.',
        ],
      },
    ],
  },
  {
    id: 'P04',
    title: 'Ersatzwahl-Nummer',
    strand: 'Netz',
    order: 4,
    historicalStatus: 'fictional',
    stages: [
      {
        when: { notFact: 'data_lines' },
        hints: [
          'Das Modul hat dir gesagt, wo du nachsehen sollst.',
          '»Ersatzwahl: siehe LADER« – der LADER ist ein BASIC-Programm. BASIC-Programme kann man auflisten.',
          'Am C64: LOAD"LADER",8 und danach LIST. Schau dir die letzten Zeilen genau an.',
        ],
      },
      {
        when: { notFact: 'chr_table' },
        hints: [
          'Die Zahlen in der DATA-Zeile liegen alle zwischen 48 und 57. Was könnten sie bedeuten?',
          'Vielleicht sind es Zeichencodes. In deiner neuen Zeitschrift gibt es eine Tabelle dazu.',
          'Öffne das Päckchen und LIES ZEICHENTABELLE. Oder lass den C64 rechnen: z. B. 1000 FOR I=1 TO 5:READ A:PRINT CHR$(A);:NEXT – dann RUN 1000.',
        ],
      },
      {
        hints: [
          'Jede Zahl steht für ein Zeichen. Übersetze sie der Reihe nach.',
          'Laut Tabelle ist 48 die »0«, 49 die »1« und so weiter bis 57 = »9«.',
          'Ziehe von jeder Zahl 48 ab – das ergibt die Ziffern der Telefonnummer. Wähle sie dann am Telefon: WÄHLE <Nummer>.',
        ],
      },
    ],
  },
  {
    id: 'P05',
    title: 'Erste Verbindung',
    strand: 'Netz',
    order: 5,
    historicalStatus: 'plausible',
    stages: [
      {
        when: { notFact: 'access_number' },
        hints: [
          'Ohne Nummer keine Verbindung.',
          'Die Nummer steckt im LADER – siehe das andere Rätsel.',
          'Löse zuerst die Ersatzwahl-Nummer (DENKE NACH hilft auch dort).',
        ],
      },
      {
        hints: [
          'Das Modem am anderen Ende pfeift. Und dein Koppler hat zwei Gummimuffen …',
          'Lies notfalls den Koppler-Artikel in der Zeitschrift: Hörer in den Koppler, dann am C64 weiter.',
          'Wähle die Nummer, LEGE HÖRER IN DEN KOPPLER und drücke dann im Modul (Menüpunkt 1) RETURN.',
        ],
      },
    ],
  },
  {
    id: 'P06',
    title: 'Mailbox erkunden',
    strand: 'Netz',
    order: 6,
    historicalStatus: 'fictional',
    stages: [
      {
        hints: [
          'Du bist drin. Was gibt es hier zu lesen?',
          'Das Menü der Mailbox bietet Nachrichten und Systeminformationen.',
          'Drücke 1 für die Nachrichten und lies beide. Melde dich danach mit 4 ab und lege auf.',
        ],
      },
    ],
  },
  {
    id: 'P07',
    title: 'Bedeutung von Diskette 2',
    strand: 'Schlüssel',
    order: 7,
    historicalStatus: 'fictional',
    stages: [
      {
        hints: [
          'Für heute hast du herausgefunden, was ohne Diskette 2 möglich ist.',
          'Schreib dir deine Gedanken in den Notizblock – oder pflege dein C64-Archiv.',
          'Der spielbare Ausschnitt endet hier. (TODO-STORY: Fortsetzung, GDD Akt 2.)',
        ],
      },
    ],
  },
];

export const PUZZLE_BY_ID: Record<string, PuzzleDef> = Object.fromEntries(PUZZLES.map((p) => [p.id, p]));

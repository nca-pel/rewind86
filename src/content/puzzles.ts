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
          'LEGE DISKETTE INS LAUFWERK, SCHALTE COMPUTER EIN. Am C64: LOAD"$",8 zeigt das Verzeichnis, LOAD"*",8 und RUN starten das erste Programm. (Kurz: ZEIGE DATEIEN / LADE SPIEL.)',
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
          'Diskette 2 hast du nicht. Aber vielleicht verrät das Netz mit der Zeit mehr darüber.',
          'Das Netz lebt: Neue Meldungen erscheinen erst nach und nach. Schau in ein paar Tagen wieder hinein – vorsichtig, jede Anmeldung fällt auf.',
          'Ab Montag, 17.11., steht im Netz eine neue Systemmeldung. Wähle dich mit dem Modul ein und lies die Nachrichten.',
        ],
      },
    ],
  },
  {
    id: 'P08',
    title: 'Schlüssel zusammensetzen',
    strand: 'Schlüssel',
    order: 8,
    historicalStatus: 'fictional',
    stages: [
      {
        when: { notFact: 'key_part_1' },
        hints: [
          '»Teil 1: wie üblich auf der Arbeitskopie (Sichtschutz).« Auf Ralfs Diskette gibt es nur wenige Dateien.',
          'Im LADER steht eine Zeile, die leer aussieht. Text kann auch da sein, wenn man ihn nicht sieht – denk an den Bildschirmrand in INTRUDER, oder lies die LESERTIPPS in der Zeitschrift.',
          'Lade den LADER (LOAD"LADER",8) und ändere vor dem LIST die Hintergrundfarbe: POKE 53281,0 und dann LIST.',
        ],
      },
      {
        when: { notFact: 'key_part_2' },
        hints: [
          'Ein weiterer Teil kommt vielleicht aus dem Netz selbst.',
          'Schau ab Montag, 17.11., wieder in die Nachrichten des geheimen Netzes.',
          'Wähle dich mit dem Modul ein (Menüpunkt 1) und lies die Systemmeldung »SCHLUESSELWECHSEL«.',
        ],
      },
      {
        when: { notFact: 'cassette' },
        hints: [
          '»Teil 3: Prüfband, geht per Boten.« Ein Band – wer kommt an Seidels Sachen heran?',
          'Ralf wohnt bei Seidel. Halte die Freundschaft warm – vielleicht findet er etwas.',
          'Am Buß- und Bettag (Mi., 19.11.) bringt Ralf nachmittags eine Kassette vorbei. Warte bis dahin (oder SCHLAFE).',
        ],
      },
      {
        when: { notFlag: 'datasetteConnected' },
        hints: [
          'Eine Datenkassette braucht das passende Gerät.',
          'Deine alte Datasette steht abgestöpselt hinter dem Monitor.',
          'LEGE KASSETTE IN DATASETTE – Jan schließt sie dabei gleich an. Dann am C64: LOAD und RUN.',
        ],
      },
      {
        hints: [
          'Die Kassette steckt in der Datasette. Jetzt muss der C64 sie lesen.',
          'Gerät 1 ist die Datasette – und der Standard bei LOAD ohne Gerätenummer.',
          'Am C64: LOAD (oder LOAD"PRUEFBAND3",1), danach RUN. Wenn du die Kassette noch nicht eingelegt hast: LEGE KASSETTE IN DATASETTE.',
        ],
      },
    ],
  },
  {
    id: 'P09',
    title: 'Rundschreiben entschlüsseln',
    strand: 'Schlüssel',
    order: 9,
    historicalStatus: 'fictional',
    stages: [
      {
        hints: [
          'Du hast zwölf Ziffern. Das Modul kennt einen Ersatz, wenn Diskette 2 fehlt.',
          'Im Menü des Moduls gibt es »Ersatzschlüssel eingeben«. Danach das Rundschreiben noch einmal lesen.',
          'Modul: 3 drücken, die drei Teile in der Reihenfolge 1-2-3 eintippen, RETURN. Dann einwählen und das Rundschreiben von K-01 lesen. (Profis: Im Rundschreiben S = Rohdaten auf eine beschreibbare Diskette speichern und selbst in BASIC entschlüsseln.)',
        ],
      },
    ],
  },
  {
    id: 'P17',
    title: 'BTX: Clubtafel finden',
    strand: 'BTX',
    order: 17,
    historicalStatus: 'fictional',
    stages: [
      {
        when: { notFact: 'btx_club' },
        hints: [
          'Der Computerclub verschickt Post. Lies sie genau.',
          'Im Rundbrief des Computerclubs steht mehr als nur der Termin.',
          'LIES RUNDBRIEF (er kommt am Samstag mit der Post). Dort steht die Seitennummer der Clubtafel.',
        ],
      },
      {
        when: { notItemAt: 'btx_kit', loc: 'port' },
        hints: [
          'Für BTX brauchst du Ausrüstung, die du nicht besitzt.',
          'Der Club verleiht am Clubabend ein BTX-Set an Mitglieder. Es kommt in den Modulschacht des C64.',
          'GEHE ZUM CLUB (Donnerstag, 18:30–19:30), dann SCHALTE COMPUTER AUS, STECKE BTX-SET IN DEN C64, SCHALTE COMPUTER EIN.',
        ],
      },
      {
        hints: [
          'Der Decoder meldet sich von allein. Seiten rufst du mit Sternchen und Raute auf.',
          'Verbinden mit RETURN; dann *Nummer# eingeben (die Nummer steht im Rundbrief).',
          'Taste *, dann die Seitennummer der Clubtafel, dann Taste #. Das Telefon muss aufgelegt sein.',
        ],
      },
    ],
  },
];

export const PUZZLE_BY_ID: Record<string, PuzzleDef> = Object.fromEntries(PUZZLES.map((p) => [p.id, p]));

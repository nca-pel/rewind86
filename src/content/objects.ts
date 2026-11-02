import type { Condition, GameEffect, ItemLocation } from '../engine/types';
import { GAME_CONFIG } from './config';

/**
 * Objekte der Schreibtischwelt.
 * Vokabular ist normalisiert (Kleinbuchstaben, ä→ae, ö→oe, ü→ue, ß→ss).
 */
export interface WorldObject {
  id: string;
  /** Nominativ mit Artikel */
  name: string;
  /** Akkusativ mit Artikel */
  acc: string;
  /** Dativ mit Artikel */
  dat: string;
  /** Kurzform für Rückfragen */
  short: string;
  gender: 'm' | 'f' | 'n' | 'pl';
  nouns: string[];
  adjectives?: string[];
  /** Bewegliche Gegenstände haben einen Ort; Szenerie ist immer erreichbar. */
  portable?: boolean;
  initialLocation?: ItemLocation;
  /** Teil eines anderen Objekts (z. B. Artikel einer Zeitschrift). */
  partOf?: string;
  /** Person – nur erreichbar, wenn present-Bedingung erfüllt ist. */
  npc?: boolean;
  present?: Condition;
  /** Klickbarer Hotspot auf dem Schreibtisch */
  hotspot?: boolean;
  description: Array<{ when?: Condition; text: string }>;
  historicalStatus: 'verified' | 'plausible' | 'fictional' | 'needs_research';
  /** Effekte beim Lesen (LIES …) */
  readEffects?: GameEffect[];
}

const B = GAME_CONFIG.unreleasedGame.buildCode;
const CLUB_DATE = `${GAME_CONFIG.club.eveningDate.slice(8, 10)}.${GAME_CONFIG.club.eveningDate.slice(5, 7)}.`;

export const OBJECTS: WorldObject[] = [
  {
    id: 'desk',
    name: 'der Schreibtisch',
    acc: 'den Schreibtisch',
    dat: 'dem Schreibtisch',
    short: 'Schreibtisch',
    gender: 'm',
    nouns: ['schreibtisch', 'tisch', 'zimmer', 'raum'],
    description: [
      {
        when: { flag: 'datasetteFound' },
        text: 'Der Schreibtisch ist älter als du: Pressspan, eine Furnierkante, die sich an einer Ecke löst. Brandlöcher von der Lötkolbenzeit (deine Mutter erwähnt sie noch immer), ein klebriger Colaring, der nie ganz abgehen will. Und mittendrin alles, was zählt: C64 und Monitor, die 1541, das Telefon mit dem Akustikkoppler, das Radio, der Kassettenrekorder, dein Notizblock. Oben auf dem Monitor steht die alte Datasette. Rechts die Schublade. Sie klemmt.',
      },
      {
        text: 'Der Schreibtisch ist älter als du: Pressspan, eine Furnierkante, die sich an einer Ecke löst. Brandlöcher von der Lötkolbenzeit (deine Mutter erwähnt sie noch immer), ein klebriger Colaring, der nie ganz abgehen will. Und mittendrin alles, was zählt: C64 und Monitor, die 1541, das Telefon mit dem Akustikkoppler, das Radio, der Kassettenrekorder, dein Notizblock. Rechts die Schublade. Sie klemmt.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'c64',
    name: 'der Commodore 64',
    acc: 'den Commodore 64',
    dat: 'dem Commodore 64',
    short: 'C64',
    gender: 'm',
    nouns: [
      'c64',
      'computer',
      'commodore',
      'brotkasten',
      'rechner',
      'tastatur',
      'heimcomputer',
      'modulschacht',
      'modulport',
      'expansionport',
    ],
    hotspot: true,
    description: [
      {
        text: 'Dein Commodore 64, der Brotkasten. Beige, ein bisschen vergilbt, die Tasten glänzen dort, wo deine Finger am häufigsten landen. Der Netzschalter sitzt rechts an der Seite, und jedes Mal, wenn du ihn umlegst, läuft dir ein kleiner Schauer über den Rücken. Immer noch.',
      },
    ],
    historicalStatus: 'verified',
  },
  {
    id: 'monitor',
    name: 'der Monitor',
    acc: 'den Monitor',
    dat: 'dem Monitor',
    short: 'Monitor',
    gender: 'm',
    nouns: ['monitor', 'bildschirm', 'schirm'],
    description: [
      {
        text: 'Ein Farbmonitor, gebraucht gekauft von einem Mann, der ihn nicht schnell genug loswerden konnte. Er brummt leise, wenn er an ist, wie ein Tier im Schlaf. Man gewöhnt sich dran.',
      },
    ],
    historicalStatus: 'verified',
  },
  {
    id: 'drive1541',
    name: 'die 1541',
    acc: 'die 1541',
    dat: 'der 1541',
    short: '1541',
    gender: 'f',
    nouns: ['1541', 'laufwerk', 'floppy', 'diskettenlaufwerk', 'floppylaufwerk', 'diskettenstation'],
    hotspot: true,
    description: [
      {
        text: 'Die Commodore 1541: schwer wie ein Ziegelstein, nach einer halben Stunde warm wie ein Toaster. Wenn sie lädt, rattert sie, als säße jemand mit einem Hämmerchen darin. Vorn der Schlitz mit der Verriegelungsklappe.',
      },
    ],
    historicalStatus: 'verified',
  },
  {
    id: 'phone',
    name: 'das Telefon',
    acc: 'das Telefon',
    dat: 'dem Telefon',
    short: 'Telefon',
    gender: 'n',
    nouns: ['telefon', 'apparat', 'fernsprecher'],
    hotspot: true,
    description: [
      {
        text: 'Ein graues Telefon mit Wählscheibe, von der Post gemietet. Die Schnur ist so lang, dass du sie einmal quer durchs Zimmer spannen könntest – und genau deshalb stolperst du alle paar Wochen darüber. Es hängt an derselben Leitung wie der Apparat unten im Flur. Wenn du telefonierst, telefoniert niemand sonst.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'handset',
    name: 'der Hörer',
    acc: 'den Hörer',
    dat: 'dem Hörer',
    short: 'Hörer',
    gender: 'm',
    nouns: ['hoerer', 'telefonhoerer', 'handapparat'],
    description: [
      {
        text: 'Der Telefonhörer, schwarz und schwerer, als man denkt, in der Muschel noch ein Hauch vom Parfüm deiner Mutter. Er passt genau in die Gummimuffen des Akustikkopplers.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'coupler',
    name: 'der Akustikkoppler',
    acc: 'den Akustikkoppler',
    dat: 'dem Akustikkoppler',
    short: 'Akustikkoppler',
    gender: 'm',
    nouns: ['akustikkoppler', 'koppler', 'modem', 'muffen'],
    hotspot: true,
    description: [
      {
        text: 'Dein Akustikkoppler, 300 Baud, ein grauer Kasten mit zwei Gummimuffen, die aussehen wie Ohren. Ein Kabel führt zum Userport des C64. Eine kleine LED zeigt den Träger an. Wenn sie leuchtet, redet am anderen Ende jemand mit dir. Oder etwas.',
      },
    ],
    historicalStatus: 'needs_research',
  },
  {
    id: 'radio',
    name: 'das Radio',
    acc: 'das Radio',
    dat: 'dem Radio',
    short: 'Radio',
    gender: 'n',
    nouns: ['radio', 'radiogeraet', 'empfaenger', 'transistorradio'],
    hotspot: true,
    description: [
      {
        text: 'Ein kleines UKW-Radio mit Drehknopf und drei Stationstasten. An einer Seite ist der Lack abgeplatzt, seit es dir einmal vom Regal gefallen ist. Es hat’s überlebt, wie fast alles in diesem Zimmer.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'tape',
    name: 'der Kassettenrekorder',
    acc: 'den Kassettenrekorder',
    dat: 'dem Kassettenrekorder',
    short: 'Kassettenrekorder',
    gender: 'm',
    nouns: ['kassettenrekorder', 'rekorder', 'recorder', 'kassettenrecorder', 'tapedeck'],
    hotspot: true,
    description: [
      {
        text: 'Ein Mono-Kassettenrekorder für Musik und Radiomitschnitte – kein Datengerät. Auf den Tasten haben deine Finger die Beschriftung längst weggeschliffen. Gerade liegt keine Kassette drin; das Fach steht offen wie ein Mund, der gleich etwas sagen will.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'datasette',
    name: 'die Datasette',
    acc: 'die Datasette',
    dat: 'der Datasette',
    short: 'Datasette',
    gender: 'f',
    nouns: ['datasette', 'datenrekorder'],
    description: [
      {
        when: { flag: 'datasetteConnected' },
        text: 'Deine alte Datasette hängt wieder am Kassettenport des C64. Laden: LOAD am C64 (Gerät 1 ist der Standard).',
      },
      {
        when: { flag: 'datasetteFound' },
        text: 'Deine alte Datasette steht oben auf dem Monitor, noch nicht angeschlossen. Der Stecker hängt lose herunter. Zum Anschließen: LEGE KASSETTE IN DATASETTE.',
      },
      {
        text: 'Deine alte Datasette steht abgestöpselt hinter dem Monitor und sammelt Staub. Seit du die 1541 hast, fasst du sie kaum noch an. Ein kleines schlechtes Gewissen ist dabei.',
      },
    ],
    historicalStatus: 'verified',
  },
  {
    id: 'drawer',
    name: 'die Schublade',
    acc: 'die Schublade',
    dat: 'der Schublade',
    short: 'Schublade',
    gender: 'f',
    nouns: ['schublade', 'schreibtischschublade', 'lade'],
    hotspot: true,
    description: [
      {
        text: 'Die Schreibtischschublade. Sie klemmt, und wenn man sie endlich aufbekommt, quietscht sie auf genau der einen Note, die einem durch die Zähne geht.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'notebook',
    name: 'der Notizblock',
    acc: 'den Notizblock',
    dat: 'dem Notizblock',
    short: 'Notizblock',
    gender: 'm',
    nouns: ['notizblock', 'block', 'notizbuch', 'kladde'],
    hotspot: true,
    description: [
      {
        text: 'Dein karierter Notizblock, die Ecken schon weich vom Anfassen. Hier landet alles, was du herausfindest, in deiner kleinen, schrägen Schrift – und alles, was du lieber nicht vergessen willst.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'magazine',
    name: 'das Heimcomputer-Journal',
    acc: 'das Heimcomputer-Journal',
    dat: 'dem Heimcomputer-Journal',
    short: 'Zeitschrift',
    gender: 'n',
    // Das Päckchen ist nur Kulisse: wer es anspricht, landet bei der Zeitschrift darin
    nouns: [
      'zeitschrift',
      'heft',
      'magazin',
      'journal',
      'heimcomputerjournal',
      'ausgabe',
      'paeckchen',
      'paket',
    ],
    adjectives: ['heimcomputer', 'neue'],
    portable: true,
    initialLocation: 'desk',
    hotspot: true,
    description: [
      {
        text: 'Die neue Ausgabe des »Heimcomputer-Journals« (fiktive Zeitschrift), heute mit der Post gekommen. Sie riecht noch nach Druckerschwärze. Auf dem Umschlag steht, was drin ist: eine ZEICHENTABELLE, ein ARTIKEL über Akustikkoppler, die LESERTIPPS und die KLEINANZEIGEN.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'mag_table',
    name: 'die Zeichentabelle',
    acc: 'die Zeichentabelle',
    dat: 'der Zeichentabelle',
    short: 'Zeichentabelle',
    gender: 'f',
    nouns: ['zeichentabelle', 'tabelle', 'codetabelle', 'zeichencodes', 'ascii', 'petscii'],
    partOf: 'magazine',
    description: [
      {
        when: { flag: 'hardMode' },
        text: 'ZEICHENTABELLE (Auszug, CHR$-Codes des C64):\n 32 = Leerzeichen\n 65 = A   66 = B   67 = C   68 = D   69 = E\n 70 = F … 90 = Z\n(Satzzeichen und Ziffern: im nächsten Heft!)\nTipp der Redaktion: PRINT CHR$(65) schreibt ein A – probiert ruhig andere Zahlen aus. Mit READ holt ein Programm Zahlen aus seinen DATA-Zeilen.',
      },
      {
        text: 'ZEICHENTABELLE (Auszug, CHR$-Codes des C64):\n 32 = Leerzeichen\n 48 = 0   49 = 1   50 = 2   51 = 3   52 = 4\n 53 = 5   54 = 6   55 = 7   56 = 8   57 = 9\n 65 = A   66 = B   67 = C … 90 = Z\nTipp der Redaktion: PRINT CHR$(65) schreibt ein A. Mit READ holt ein Programm Zahlen aus seinen DATA-Zeilen.',
      },
    ],
    historicalStatus: 'verified',
  },
  {
    id: 'mag_article',
    name: 'der Koppler-Artikel',
    acc: 'den Koppler-Artikel',
    dat: 'dem Koppler-Artikel',
    short: 'Artikel',
    gender: 'm',
    nouns: ['artikel', 'bericht', 'test', 'anleitung', 'dfue'],
    partOf: 'magazine',
    description: [
      {
        text: '»DFÜ für Einsteiger«: Mit dem Akustikkoppler wählst du die Nummer ganz normal am Telefon. Sobald der hohe Pfeifton des fremden Modems kommt, drückst du den Hörer fest in die Gummimuffen. Leuchtet die Träger-LED, kann das Terminalprogramm loslegen. Wichtig: Solange du online bist, ist die Leitung für den Rest der Familie besetzt – und der Gebührenzähler läuft!',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'mag_tips',
    name: 'die Lesertipps',
    acc: 'die Lesertipps',
    dat: 'den Lesertipps',
    short: 'Lesertipps',
    gender: 'pl',
    nouns: ['lesertipps', 'tipps', 'tips', 'tricks', 'leserbriefe', 'leserbrief'],
    partOf: 'magazine',
    readEffects: [{ type: 'discoverFact', id: 'hidden_text' }],
    description: [
      {
        when: { flag: 'hardMode' },
        text: '»TIPPS & TRICKS – Unsichtbare Zeilen«: Ein Leser fragt, warum in einem gekauften Programm eine REM-Zeile leer aussieht. Antwort der Redaktion: In REM-Zeilen lassen sich Farb-Steuerzeichen ablegen. Beim LIST wechselt der C64 dann die Schriftfarbe – ist sie gleich der Hintergrundfarbe, sieht man den Rest der Zeile nicht. Er ist aber noch da. Wie man die Farben umstellt? Schau dir an, was viele Lader in ihren ersten Zeilen tun.',
      },
      {
        text: '»TIPPS & TRICKS – Unsichtbare Zeilen«: Ein Leser fragt, warum in einem gekauften Programm eine REM-Zeile leer aussieht. Antwort der Redaktion: In REM-Zeilen lassen sich Farb-Steuerzeichen ablegen. Beim LIST wechselt der C64 dann die Schriftfarbe – ist sie gleich der Hintergrundfarbe, sieht man den Rest der Zeile nicht. Er ist aber noch da. Wer neugierig ist, ändert einfach die Hintergrundfarbe (Speicherstelle 53281) und listet noch einmal.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'mag_ads',
    name: 'die Kleinanzeigen',
    acc: 'die Kleinanzeigen',
    dat: 'den Kleinanzeigen',
    short: 'Kleinanzeigen',
    gender: 'pl',
    nouns: ['kleinanzeigen', 'anzeigen', 'anzeige', 'inserate'],
    partOf: 'magazine',
    description: [
      {
        text: 'KLEINANZEIGEN: »Suche Tauschpartner für C64-Software, Raum Bielefeld.« – »Verkaufe 1541, kaum benutzt.« – »Neue Mailbox im Kreis Gütersloh: BIT-SCHUPPEN GT, 300 Baud, täglich 18–24 Uhr, Tel. 23586. Gäste willkommen!«',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'disk_game',
    name: 'Ralfs Diskette',
    acc: 'Ralfs Diskette',
    dat: 'Ralfs Diskette',
    short: 'Ralfs Spielediskette',
    gender: 'f',
    nouns: [
      'diskette',
      'disk',
      'spielediskette',
      'kopie',
      'arbeitskopie',
      'floppydisk',
      'etikett',
      'aufkleber',
    ],
    adjectives: ['ralfs', 'ralf', 'spiel', 'spiele', 'kopierte', 'neue', 'wt', 'wt07', '07', 'erste', '1'],
    portable: true,
    initialLocation: 'nowhere',
    hotspot: true,
    description: [
      {
        text: `Eine 5,25-Zoll-Diskette, offensichtlich eine Kopie. Auf dem Etikett Ralfs krakelige Schrift: »${B} ARBEITSKOPIE – DISK 1«. Darunter, ebenfalls von Hand: »NICHT WEITERGEBEN!« – zwei Wörter, dreimal unterstrichen. Die Schreibschutzkerbe ist zugeklebt.`,
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'disk_1001',
    name: 'die Diskette »1001«',
    acc: 'die Diskette »1001«',
    dat: 'der Diskette »1001«',
    short: 'die Diskette »1001«',
    gender: 'f',
    nouns: ['diskette', 'disk', 'demodiskette', 'floppydisk', '1001', 'intruder', 'etikett', 'aufkleber'],
    adjectives: ['1001', 'demo', 'intruder', 'fighters'],
    portable: true,
    initialLocation: 'drawer',
    hotspot: true,
    description: [
      {
        text: 'Eine abgegriffene Diskette, auf dem Etikett nur mit Edding: »1001«. Darauf ist INTRUDER by 1001 FIGHTERS, deine Lieblingsdemo. Du hast sie bestimmt vierzigmal gesehen, und bei der Musik läuft dir trotzdem jedes Mal etwas den Rücken runter.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'disk_archive',
    name: 'deine Archivdiskette',
    acc: 'deine Archivdiskette',
    dat: 'deiner Archivdiskette',
    short: 'die Archivdiskette',
    gender: 'f',
    nouns: [
      'diskette',
      'disk',
      'archivdiskette',
      'datendiskette',
      'archiv',
      'floppydisk',
      'etikett',
      'aufkleber',
    ],
    adjectives: ['archiv', 'daten', 'meine', 'jans', 'eigene'],
    portable: true,
    initialLocation: 'drawer',
    hotspot: true,
    description: [
      {
        text: 'Deine Archivdiskette, Etikett »JANS ARCHIV«. Darauf das Programm, das du dir selbst zusammengebaut hast, an drei Wochenenden und einem halben Dutzend Nächten: Personen, Nummern, Mailboxen, Notizen.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'cassette',
    name: 'die Kassette',
    acc: 'die Kassette',
    dat: 'der Kassette',
    short: 'Prüfband-Kassette',
    gender: 'f',
    nouns: ['kassette', 'band', 'pruefband', 'datenkassette', 'compactcassette'],
    adjectives: ['wt', 'wt07', '07', 'pruef', 'seidels', '3'],
    portable: true,
    initialLocation: 'nowhere',
    description: [
      {
        text: 'Eine C60-Kassette ohne Hülle, die Bandwickel leicht schief. Auf dem Etikett steht mit Kuli: »WT-07 PRÜFBAND 3«. Musik ist da sicher keine drauf. Das ist ein Band für die Datasette.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'disk_key',
    name: 'die Diskette 2',
    acc: 'die Diskette 2',
    dat: 'der Diskette 2',
    short: 'Diskette 2',
    gender: 'f',
    nouns: ['schluesseldiskette', 'diskette', 'disk'],
    adjectives: ['2', 'zwei', 'zweite', 'schluessel'],
    portable: true,
    initialLocation: 'nowhere',
    description: [
      {
        text: 'Eine schlichte Diskette ohne Aufdruck. Auf dem Etikett nur zwei Fragezeichen, so sorgfältig gemalt, als hätte jemand lange darüber nachgedacht: die Schlüsseldiskette.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'door',
    name: 'die Zimmertür',
    acc: 'die Zimmertür',
    dat: 'der Zimmertür',
    short: 'Tür',
    gender: 'f',
    nouns: ['tuer', 'zimmertuer', 'flur', 'treppe', 'haustuer'],
    hotspot: true,
    description: [
      {
        text: 'Deine Zimmertür. Auf Augenhöhe klebt ein Aufkleber: »Computer-Zone – Eltern bitte klopfen«. Sie klopfen. Meistens. Von unten dringt gedämpft der Fernseher herauf, irgendein Mann mit tiefer Stimme erklärt der Welt, wie es um sie steht.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'window',
    name: 'das Fenster',
    acc: 'das Fenster',
    dat: 'dem Fenster',
    short: 'Fenster',
    gender: 'n',
    nouns: ['fenster', 'draussen', 'strasse'],
    description: [
      {
        when: { timeAfter: '1986-11-14T17:15' },
        text: 'Draußen ist es dunkel. Die Straßenlaternen spiegeln sich im nassen Asphalt, und irgendwo bellt ein Hund, einmal, zweimal, dann gibt er auf.',
      },
      {
        text: 'Draußen hängt ein grauer Novembernachmittag so tief über den Dächern, dass man fast dagegenstoßen könnte. Es nieselt. Es nieselt schon seit Tagen.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'ralf',
    name: 'Ralf',
    acc: 'Ralf',
    dat: 'Ralf',
    short: 'Ralf',
    gender: 'm',
    nouns: ['ralf'],
    npc: true,
    present: { flag: 'ralfPresent', eq: true },
    description: [
      {
        text: 'Ralf, dein bester Freund. Früher wohnte er nebenan, bis seine Eltern sich scheiden ließen und er mit seiner Mutter wegzog. Seitdem ist er immer ein bisschen zu schnell unterwegs, als wäre jemand hinter ihm her. Sporttasche, Trainingsjacke, ein Grinsen, das nicht bis in die Augen reicht.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'mother',
    name: 'deine Mutter',
    acc: 'deine Mutter',
    dat: 'deiner Mutter',
    short: 'Mutter',
    gender: 'f',
    nouns: ['mutter', 'mama', 'mutti'],
    npc: true,
    present: { flag: 'motherPresent', eq: true },
    description: [
      {
        text: 'Deine Mutter. Sie hat diesen Blick, der durch geschlossene Türen sehen kann. Ihr entgeht wenig, und was ihr entgeht, fällt ihr spätestens beim Abendbrot auf.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'father',
    name: 'dein Vater',
    acc: 'deinen Vater',
    dat: 'deinem Vater',
    short: 'Vater',
    gender: 'm',
    nouns: ['vater', 'papa', 'paps', 'vati'],
    npc: true,
    present: { flag: 'fatherPresent', eq: true },
    description: [
      {
        text: 'Dein Vater, noch in Arbeitsklamotten; die Hände riechen nach Holz und Maschinenöl. Er sieht müde aus, auf diese Art, die nicht von einer einzigen Nacht kommt.',
      },
    ],
    historicalStatus: 'fictional',
  },
  {
    id: 'btx_kit',
    name: 'das BTX-Set',
    acc: 'das BTX-Set',
    dat: 'dem BTX-Set',
    short: 'BTX-Set',
    gender: 'n',
    nouns: [
      'btx',
      'btxset',
      'set',
      'leihset',
      'decoder',
      'btxdecoder',
      'steckmodul',
      'postmodem',
      'bildschirmtext',
    ],
    adjectives: ['btx', 'bildschirmtext', 'leih'],
    portable: true,
    initialLocation: 'nowhere',
    description: [
      {
        text: 'Ein graues Steckmodul für den Expansion-Port mit der Aufschrift »BTX-DECODER«, dazu ein Postmodem im Kunststoffgehäuse mit Kabel zur Telefondose. Leihgabe des Computerclubs. Das Modul gehört in den Modulschacht – aber nur bei ausgeschaltetem Computer.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'club_letter',
    name: 'der Rundbrief',
    acc: 'den Rundbrief',
    dat: 'dem Rundbrief',
    short: 'Rundbrief',
    gender: 'm',
    nouns: ['rundbrief', 'brief', 'umschlag', 'clubbrief'],
    adjectives: ['clubbrief', 'computerclub'],
    portable: true,
    initialLocation: 'nowhere',
    description: [
      {
        text: `Ein hektografierter Rundbrief, blaue Schrift auf saugfähigem Papier: »COMPUTERCLUB – Clubabend am Donnerstag, ${CLUB_DATE}, 19 Uhr im Jugendzentrum. Bringt eure Disketten mit! Mitglieder können am Clubabend das BTX-Leihset der Post ausprobieren – unsere Clubtafel steht auf *${GAME_CONFIG.btx.clubBoardPage}#. Neu: Unsere Club-Mailbox ${GAME_CONFIG.mailboxes.bitschuppen.name} ist jeden Abend ab ${GAME_CONFIG.mailboxes.bitschuppen.hours.from} Uhr unter ${GAME_CONFIG.mailboxes.bitschuppen.phoneNumber} erreichbar.«`,
      },
    ],
    readEffects: [
      { type: 'discoverFact', id: 'club_evening' },
      { type: 'discoverFact', id: 'btx_club' },
    ],
    historicalStatus: 'fictional',
  },
];

export const OBJECT_BY_ID: Record<string, WorldObject> = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));

/** Diskettenobjekt → virtuelles Diskettenabbild */
export const DISK_ITEM_TO_IMAGE: Record<string, string> = {
  disk_game: 'game',
  disk_1001: 'demo1001',
  disk_archive: 'archive',
  disk_key: 'key',
};

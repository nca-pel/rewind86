import type { Condition, ItemLocation } from '../engine/types';
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
}

const B = GAME_CONFIG.unreleasedGame.buildCode;

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
        text: 'Dein Schreibtisch: Brandlöcher von der Lötkolbenzeit, ein Kaffeerand vom letzten Wochenende. Darauf dein C64 mit Monitor, die 1541, Telefon und Akustikkoppler, das Radio, ein Kassettenrekorder und dein Notizblock. Rechts die Schublade.',
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
    nouns: ['c64', 'computer', 'commodore', 'brotkasten', 'rechner', 'tastatur', 'heimcomputer'],
    hotspot: true,
    description: [
      {
        text: 'Dein Commodore 64, der »Brotkasten«. Die Tasten sind vom vielen Tippen leicht vergilbt. Der Netzschalter sitzt rechts an der Seite.',
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
    description: [{ text: 'Ein Farbmonitor, gebraucht gekauft, mit leichtem Brummen.' }],
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
        text: 'Die Commodore 1541, schwer wie ein Ziegelstein und warm wie ein Toaster. Vorn der Schlitz mit der Verriegelungsklappe.',
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
        text: 'Ein graues Tastentelefon von der Post, mit langer Schnur, damit es bis an den Schreibtisch reicht. Es hängt an derselben Leitung wie der Apparat unten im Flur.',
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
    description: [{ text: 'Der Telefonhörer – passt genau in die Gummimuffen des Akustikkopplers.' }],
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
        text: 'Dein Akustikkoppler, 300 Baud, mit zwei Gummimuffen für den Telefonhörer. Ein Kabel führt zum Userport des C64. Eine kleine LED zeigt den Träger an.',
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
    description: [{ text: 'Ein kleines UKW-Radio mit Drehknopf und drei Stationstasten.' }],
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
        text: 'Ein Mono-Kassettenrekorder. Gerade liegt keine Kassette drin. (Kassetten spielen in diesem Ausschnitt noch keine Rolle.)',
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
        text: 'Deine alte Datasette steht abgestöpselt hinter dem Monitor. Seit du die 1541 hast, nimmst du sie kaum noch.',
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
    description: [{ text: 'Die Schreibtischschublade. Sie klemmt ein bisschen.' }],
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
        text: 'Dein karierter Notizblock. Hier landet alles, was du herausfindest – und was du selbst notierst.',
      },
    ],
    historicalStatus: 'plausible',
  },
  {
    id: 'package',
    name: 'das Päckchen',
    acc: 'das Päckchen',
    dat: 'dem Päckchen',
    short: 'Päckchen',
    gender: 'n',
    nouns: ['paeckchen', 'paket', 'karton', 'post', 'sendung'],
    portable: true,
    initialLocation: 'desk',
    hotspot: true,
    description: [
      {
        when: { objState: 'package', key: 'open', eq: false },
        text: 'Ein Päckchen vom Zeitschriftenversand. Deine Mutter hat es dir heute Mittag auf den Tisch gelegt. Noch zugeklebt.',
      },
      { text: 'Das aufgerissene Päckchen vom Zeitschriftenversand.' },
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
    nouns: ['zeitschrift', 'heft', 'magazin', 'journal', 'heimcomputerjournal', 'ausgabe'],
    adjectives: ['heimcomputer', 'neue'],
    portable: true,
    initialLocation: 'package',
    hotspot: true,
    description: [
      {
        text: 'Die neue Ausgabe des »Heimcomputer-Journals« (fiktive Zeitschrift). Inhalt: eine ZEICHENTABELLE, ein ARTIKEL über Akustikkoppler und die KLEINANZEIGEN.',
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
        text: 'KLEINANZEIGEN: »Suche Tauschpartner für C64-Software, Raum Bielefeld.« – »Verkaufe 1541, kaum benutzt.« – »Neue Mailbox im Kreis Gütersloh, Nummer im nächsten Heft!« (TODO-STORY: reguläre Mailboxen folgen im Vollspiel.)',
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
    nouns: ['diskette', 'disk', 'spielediskette', 'kopie', 'arbeitskopie', 'floppydisk'],
    adjectives: ['ralfs', 'ralf', 'spiel', 'spiele', 'kopierte', 'neue', 'wt', 'wt07', '07', 'erste', '1'],
    portable: true,
    initialLocation: 'nowhere',
    hotspot: true,
    description: [
      {
        text: `Eine 5,25-Zoll-Diskette, offensichtlich eine Kopie. Auf dem Etikett in Ralfs krakeliger Schrift abgemalt: »${B} ARBEITSKOPIE – DISK 1«. Daneben, ebenfalls abgeschrieben: »NICHT WEITERGEBEN!«. Die Schreibschutzkerbe ist zugeklebt.`,
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
    nouns: ['diskette', 'disk', 'demodiskette', 'floppydisk', '1001', 'intruder'],
    adjectives: ['1001', 'demo', 'intruder', 'fighters'],
    portable: true,
    initialLocation: 'drawer',
    hotspot: true,
    description: [
      {
        text: 'Eine abgegriffene Diskette, auf dem Etikett nur mit Edding: »1001«. Darauf ist INTRUDER by 1001 FIGHTERS – deine Lieblingsdemo.',
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
    nouns: ['diskette', 'disk', 'archivdiskette', 'datendiskette', 'archiv', 'floppydisk'],
    adjectives: ['archiv', 'daten', 'meine', 'jans', 'eigene'],
    portable: true,
    initialLocation: 'drawer',
    hotspot: true,
    description: [
      {
        text: 'Deine Archivdiskette, Etikett »JANS ARCHIV«. Darauf dein selbst geschriebenes Archivprogramm für Personen, Nummern, Mailboxen und Notizen.',
      },
    ],
    historicalStatus: 'fictional',
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
    description: [{ text: 'Die Schlüsseldiskette. (TODO-STORY: Verbleib offen.)' }],
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
        text: 'Deine Zimmertür, beklebt mit einem Aufkleber »Computer-Zone – Eltern bitte klopfen«. Von unten hört man gedämpft den Fernseher.',
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
        text: 'Draußen ist es dunkel. Die Straßenlaternen spiegeln sich im nassen Asphalt.',
      },
      { text: 'Draußen zieht ein grauer Novembernachmittag über die Dächer. Es nieselt.' },
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
    description: [{ text: 'Ralf, dein bester Freund. Sporttasche, Trainingsjacke, immer in Eile.' }],
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
    description: [{ text: 'Deine Mutter. Ihr entgeht wenig.' }],
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
    description: [{ text: 'Dein Vater, noch in Arbeitsklamotten.' }],
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

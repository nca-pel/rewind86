/**
 * Radiosender. Alle Moderationstexte sind fiktiv; keine realen Nachrichtenmeldungen,
 * solange sie nicht für das gewählte Startdatum verifiziert sind (GDD §2.2).
 */
export interface Station {
  id: string;
  label: string;
  aliases: string[];
  historicalStatus: 'verified' | 'plausible' | 'fictional' | 'needs_research';
  /** Text nach Stunde (0–23); erster passender Bereich gewinnt. */
  program: Array<{ fromHour: number; toHour: number; text: string }>;
}

export const STATIONS: Station[] = [
  {
    id: 'pop',
    label: 'UKW 1 – Popwelle',
    aliases: ['1', 'eins', 'pop', 'popwelle', 'musik', 'ukw1'],
    historicalStatus: 'fictional',
    program: [
      {
        fromHour: 0,
        toHour: 23,
        text: 'Ein Synthesizer-Popsong läuft, danach plaudert der Moderator über das Wochenende: »Nieselregen in ganz Ostwestfalen – aber bei uns bleibt’s sonnig!« (Musik-Platzhalter: keine echten Titel.)',
      },
    ],
  },
  {
    id: 'info',
    label: 'UKW 2 – Information',
    aliases: ['2', 'zwei', 'info', 'nachrichten', 'information', 'ukw2'],
    historicalStatus: 'needs_research',
    program: [
      {
        fromHour: 0,
        toHour: 23,
        text: 'Regionalnachrichten: Verkehrsbehinderungen auf der B 61, Kreistag berät über den Haushalt, das Wetter bleibt wechselhaft. (TODO: zeitgenössische Meldungen erst nach Recherche zum Starttag.)',
      },
    ],
  },
  {
    id: 'bfbs',
    label: 'UKW 3 – BFBS',
    aliases: ['3', 'drei', 'bfbs', 'britisch', 'britischen', 'englisch', 'soldatensender'],
    historicalStatus: 'plausible',
    program: [
      {
        fromHour: 0,
        toHour: 23,
        text: 'Der Soldatensender der britischen Streitkräfte. Ein Moderator mit schnellem Englisch kündigt Musikwünsche für Einheiten in Westfalen an. Du verstehst die Hälfte – aber das Englisch-Training ist umsonst.',
      },
    ],
  },
];

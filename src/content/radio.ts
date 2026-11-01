/**
 * Radiosender. Moderationstexte sind fiktiv. Die Infowelle bringt pro Tag echte Meldungen, die für den Tag
 * belegt sind (Recherche 01.11.2026, Quellen in docs/STORY_DECISIONS.md), sonst nur Regionales (GDD §2.2).
 */
export interface Station {
  id: string;
  label: string;
  aliases: string[];
  historicalStatus: 'verified' | 'plausible' | 'fictional' | 'needs_research';
  /** Text nach Stunde (0–23), optional nur an einem Tag (JJJJ-MM-TT); erster passender Eintrag gewinnt. */
  program: Array<{ fromHour: number; toHour: number; date?: string; text: string }>;
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
    historicalStatus: 'plausible',
    program: [
      {
        fromHour: 0,
        toHour: 23,
        date: '1986-11-14',
        text: 'Nachrichten: In Washington räumt Präsident Reagan ein, Waffenlieferungen an den Iran gebilligt zu haben – nur »kleine Mengen«, sagt er. In Bonn äußern Sachverständige im Rechtsausschuss verfassungsrechtliche Bedenken gegen die geplante Kronzeugenregelung. Und am Rhein dauern die Aufräumarbeiten nach dem Chemieunfall bei Basel an.',
      },
      {
        // Besse wurde am 17.11.1986 gegen 20:30 erschossen – vorher keine Meldung.
        fromHour: 21,
        toHour: 23,
        date: '1986-11-17',
        text: 'Nachrichten: In Paris ist Renault-Chef Georges Besse am Abend vor seiner Wohnung erschossen worden; die Polizei vermutet die Terrorgruppe Action Directe. Regional: Regen, kalter Westwind.',
      },
      {
        fromHour: 0,
        toHour: 20,
        date: '1986-11-17',
        text: 'Nachrichten: Die SPD hat einen neuen Sprecher, Günter Verheugen; sein Vorgänger Wolfgang Clement war nach der Hamburg-Wahl zurückgetreten. Regional: Regen, kalter Westwind.',
      },
      {
        fromHour: 0,
        toHour: 23,
        date: '1986-11-18',
        text: 'Nachrichten: Nach dem Mord an Georges Besse verschärft Frankreich die Sicherheitsvorkehrungen. Im Wahlkampf für den Bundestag – gewählt wird im Januar – geht es um Renten und um die Kronzeugenregelung. Regional: trüb, örtlich Nebel.',
      },
      {
        fromHour: 0,
        toHour: 23,
        date: '1986-11-19',
        text: 'Nachrichten zum Buß- und Bettag: Geschäfte und Behörden bleiben heute geschlossen. Im Iran-Waffengeschäft der US-Regierung werden täglich neue Einzelheiten bekannt.',
      },
      {
        fromHour: 0,
        toHour: 23,
        date: '1986-11-21',
        text: 'Nachrichten: Der Wahlkampf für die Bundestagswahl im Januar läuft an. Der Wetterdienst warnt für den Abend vor Sturmböen in Westfalen. Lose Gegenstände sichern, rät die Polizei.',
      },
      {
        fromHour: 0,
        toHour: 23,
        text: 'Regionalnachrichten: Verkehrsbehinderungen auf der B 61, der Kreistag berät über den Haushalt, das Wetter bleibt wechselhaft.',
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

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
        text: 'Ein Synthesizer-Popsong läuft, danach plaudert der Moderator über das Wochenende: »Nieselregen in ganz Ostwestfalen – aber bei uns bleibt’s sonnig!«',
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
        text: 'Der Soldatensender der britischen Streitkräfte. Ein Moderator mit schnellem Englisch kündigt Musikwünsche für Einheiten in Westfalen an – Bands, von denen du noch nie gehört hast. Du verstehst die Hälfte – aber das Englisch-Training ist umsonst.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------- Gesprochenes Radio (Audio)

/**
 * Nachrichten der Infowelle zum Vorlesen (Sprachausgabe des Browsers). Nur Meldungen, die für den Zeitraum belegt
 * oder sehr plausibel sind (Recherche 01.11.2026, Quellen in docs/STORY_DECISIONS.md). `from`/`until` begrenzen,
 * ab wann bzw. bis wann eine Meldung im Programm ist.
 */
export interface NewsItem {
  from: string;
  until?: string;
  text: string;
}

export const RADIO_NEWS: NewsItem[] = [
  {
    from: '1986-11-17T21:00',
    text: 'Paris. Der Chef des Autokonzerns Renault, Georges Besse, ist am Abend vor seiner Wohnung erschossen worden. Die Polizei vermutet die Terrorgruppe Action Directe hinter dem Anschlag.',
  },
  {
    from: '1986-11-14T00:00',
    text: 'Washington. Präsident Reagan hat eingeräumt, Waffenlieferungen an den Iran gebilligt zu haben. Es habe sich nur um kleine Mengen gehandelt, sagte Reagan in einer Fernsehansprache.',
  },
  {
    from: '1986-11-14T00:00',
    until: '1986-11-16T23:59',
    text: 'Bonn. Im Rechtsausschuss des Bundestages haben Sachverständige verfassungsrechtliche Bedenken gegen die geplante Kronzeugenregelung geäußert. Die Koalition will an dem Vorhaben festhalten.',
  },
  {
    from: '1986-11-15T00:00',
    text: 'New York. Der Börsenhändler Ivan Boesky hat zugegeben, mit Insiderwissen gehandelt zu haben. Er muss 100 Millionen Dollar zahlen. An der Wall Street ist von einem der größten Skandale seit Jahrzehnten die Rede.',
  },
  {
    from: '1986-11-17T00:00',
    text: 'Bonn. Die SPD hat einen neuen Sprecher: Günter Verheugen folgt auf Wolfgang Clement, der nach der Wahlniederlage in Hamburg zurückgetreten war.',
  },
  {
    from: '1986-11-10T00:00',
    until: '1986-11-17T23:59',
    text: 'Hamburg. Nach der Bürgerschaftswahl hat die SPD von Bürgermeister Klaus von Dohnanyi ihre absolute Mehrheit verloren. Wie es weitergeht, ist offen.',
  },
  {
    from: '1986-11-03T00:00',
    text: 'Rhein. Nach dem Großbrand beim Chemiekonzern Sandoz in Basel Anfang des Monats sind die Folgen weiter zu spüren. Fischer am Niederrhein berichten von toten Aalen, die Wasserwerke kontrollieren das Flusswasser rund um die Uhr.',
  },
  {
    from: '1986-11-14T00:00',
    text: 'Bonn. Gut zwei Monate vor der Bundestagswahl am 25. Januar haben die Parteien ihren Wahlkampf verstärkt. Im Mittelpunkt stehen die Renten und die innere Sicherheit.',
  },
  {
    from: '1986-11-16T00:00',
    until: '1986-11-16T23:59',
    text: 'Heute ist Volkstrauertag. In vielen Städten und Gemeinden werden Kränze für die Opfer von Krieg und Gewaltherrschaft niedergelegt.',
  },
  {
    from: '1986-11-19T00:00',
    until: '1986-11-19T23:59',
    text: 'Heute ist Buß- und Bettag. Geschäfte und Behörden bleiben geschlossen, die Kirchen laden zu Gottesdiensten ein.',
  },
];

/** Wetter zum Schluss der Nachrichten (eigene Formulierung, passend zur BTX-Wetterseite) */
export const RADIO_WEATHER: Record<string, string> = {
  '1986-11-14':
    'Das Wetter in Westfalen: zunächst Nebel, später sonnige Abschnitte, Höchstwerte um sechs Grad.',
  '1986-11-15': 'Das Wetter: wechselhaft, am Abend Regen, Höchstwerte fünf Grad.',
  '1986-11-16': 'Das Wetter: viele Wolken und einzelne Schauer, um sechs Grad.',
  '1986-11-17': 'Das Wetter: eine Regenfront zieht von Westen heran, morgens stellenweise Glätte.',
  '1986-11-18': 'Das Wetter: Regen und kalter Wind aus West, Höchstwerte acht Grad.',
  '1986-11-19': 'Das Wetter: trüb, örtlich Nebel, am Nachmittag etwas freundlicher.',
  '1986-11-20': 'Das Wetter: Schauer, am Abend Sturmböen, bis neun Grad.',
  '1986-11-21':
    'Das Wetter: Ein Sturmtief zieht über Westfalen. Am Abend Böen bis Stärke zehn und kräftiger Regen. Der Wetterdienst warnt.',
};

export const MAX_NEWS = 10;

/** Nachrichtenblock zur Spielzeit: Ansage, höchstens zehn Meldungen (inkl. Wetter), Abmoderation */
export function newsBulletin(clock: string): string[] {
  const day = clock.slice(0, 10);
  const hour = Number(clock.slice(11, 13));
  const items = RADIO_NEWS.filter((n) => n.from <= clock && (!n.until || clock <= n.until)).map(
    (n) => n.text,
  );
  const keys = Object.keys(RADIO_WEATHER).sort();
  const weather =
    RADIO_WEATHER[day] ?? (day < keys[0] ? RADIO_WEATHER[keys[0]] : RADIO_WEATHER[keys[keys.length - 1]]);
  const news = [...items.slice(0, MAX_NEWS - 1), weather];
  return [`UKW 2, Information. Es ist ${hour} Uhr. Die Nachrichten.`, ...news, 'Das waren die Nachrichten.'];
}

/** Pause nach jedem Nachrichtenblock (Sekunden), dann von vorn */
export const NEWS_PAUSE_S = 60;

/**
 * BFBS: englische Ansagen eines (namenlosen) Moderators zu vier eigenen Songs fiktiver Bands.
 * `song` verweist auf BFBS_SONGS in audio/popSongs.ts. Bands und Titel sind erfunden.
 */
export const BFBS_SHOW: Array<{ intro: string; song: number }> = [
  {
    song: 0,
    intro:
      "Good evening, Westphalia! This is B F B S Germany, and you're listening to the request show. First up, a dedication from the lads of the signals squadron in Gütersloh: here's Velvet Junction with Paper Lanterns.",
  },
  {
    song: 1,
    intro:
      "That was Velvet Junction. Lovely stuff. Now, if you're driving home on the autobahn tonight, keep your eyes on the road and your hands on the wheel. This one's for you: Kitty Marlowe, Motorway Hearts.",
  },
  {
    song: 2,
    intro:
      "Kitty Marlowe there. It's grey and wet out, so here's a song that knows all about it. From the new album by the Glasshouse Choir, this is Rain on the Rhine.",
  },
  {
    song: 3,
    intro:
      'Right, one more before the news on the hour. Straight in at number thirty-two this week: Danny Voss and the Night Ferries, with Signal Lost. Stay tuned, stay safe.',
  },
];

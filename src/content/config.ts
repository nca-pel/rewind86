/**
 * Zentrale, austauschbare Spielkonfiguration.
 *
 * Alles, was in der GDD als [OFFEN] markiert ist, steht hier als neutraler Platzhalter
 * und ist mit TODO-STORY gekennzeichnet. Siehe docs/STORY_OPEN_QUESTIONS.md.
 */
/**
 * Startbildschirm-Profil des C64 (siehe src/c64/boot.ts): 'authentic' zeigt die historische
 * Einschaltmeldung mit Herstellernamen, 'neutral' eine markenfreie Variante. Überschreibbar beim
 * Build ohne Codeänderung: VITE_C64_BOOT_PROFILE=neutral npm run build
 */
const envBootProfile: string | undefined = import.meta.env?.VITE_C64_BOOT_PROFILE;

export const GAME_CONFIG = {
  c64: {
    bootProfile: envBootProfile || 'authentic',
  },

  /** Entschieden (Storyworkshop, siehe docs/STORY_DECISIONS.md): Freitag, 14.11.1986. */
  startDate: '1986-11-14T16:00',

  /** Spielökonomie – vereinfachte, NICHT historisch verifizierte Tarife (GDD §8.6). */
  economy: {
    startMoneyDm: 23.5,
    /** Preis einer Gebühreneinheit. needs_research */
    dmPerUnit: 0.23,
    /** Minuten pro Einheit im Ortsnetz. needs_research */
    localMinutesPerUnit: 8,
  },

  /**
   * Kalender und Tagesablauf (GDD §10.2). Schule, Schlaf und Mahlzeiten sind erzählte Zeitblöcke – Jan verlässt
   * den Schreibtisch dabei nicht spielbar. 1986 gab es in NRW noch Samstagsunterricht (kürzerer Schultag).
   */
  /** Entschieden: Schulen von Jan und Ralf (reale Schulen als historisches Umfeld, GDD §2) */
  schools: {
    jan: 'Ratsgymnasium Wiedenbrück',
    ralf: 'Einstein-Gymnasium Rheda',
  },

  calendar: {
    /** schulfreie Werktage (Buß- und Bettag 1986) */
    holidays: ['1986-11-19'],
    schoolFrom: '07:15',
    schoolUntil: '13:30',
    schoolUntilSaturday: '12:00',
    wakeSchoolDay: '06:45',
    wakeFreeDay: '09:30',
    /** SCHLAFE ist ab dieser Uhrzeit möglich (bis 6 Uhr früh) */
    sleepFrom: '21:00',
    /** Spätestens dann fallen Jan die Augen zu */
    forcedSleep: '01:30',
    /** Vor Schultagen klopft der Vater */
    bedtimeWarning: '22:30',
    dinner: '18:50',
    dinnerMinutes: 25,
    /** Briefträger (Mo–Sa) */
    mail: '10:30',
  },

  /** Taschengeld und Telefongebühren (Spielökonomie, nicht historisch verifiziert) */
  household: {
    pocketMoneyDm: 10,
    /** Samstag, nach der Schule */
    pocketMoneyAt: '12:30',
    /** Sonntag beim Abendbrot liest der Vater den Gebührenzähler ab */
    meterReadingWeekday: 'Sonntag',
    /** So viel Telefon pro Woche zahlen die Eltern; den Rest zahlt Jan */
    freePhoneDm: 3,
    /** ab diesem Betrag (seit der letzten Ablesung) wird der Vater richtig sauer */
    angryPhoneDm: 10,
  },

  relationshipsStart: { seidelSuspicion: 0, ralfTrust: 60, networkCredibility: 40 },

  /**
   * Benannte Schwellen der verdeckten Werte statt magischer Zahlen (GDD §9.3/§10.4). Nur intern –
   * sichtbar werden ausschließlich erzählerische Symptome (src/content/events.ts, »Verdacht«).
   * Bedingungen in Storydaten verweisen per Name darauf: { rel: 'seidelSuspicion', atLeast: 'dangerous' }.
   * Jede Schwelle gilt »ab diesem Wert«; »zu wenig Vertrauen« ist also { rel: 'ralfTrust', below: 'trusting' }.
   */
  thresholds: {
    seidelSuspicion: { noticeable: 30, dangerous: 70, critical: 90, discovered: 100 },
    /** TODO-STORY: Symptome für Ralfs Vertrauen kommen mit den Ralf-Rückrufen (Tagesablauf). */
    ralfTrust: { trusting: 40, close: 75 },
    /** TODO-STORY: braucht Senden im geheimen Netz (noch nicht implementiert). */
    networkCredibility: { established: 60 },
  },

  /**
   * Endgültige Folgen nur nach erkennbarer Ankündigung (GDD §10.3): Der Wert bleibt unter `at`,
   * bis das Flag `warnedFlag` gesetzt ist. So liegt zwischen letzter Warnung und Spielende immer
   * mindestens eine weitere riskante Handlung.
   */
  terminal: {
    seidelSuspicion: { at: 'discovered', warnedFlag: 'seidelFinalWarning' },
  },

  /** Wie stark riskantes Verhalten im geheimen Netz Seidels Verdacht erhöht. */
  risk: {
    /** pro Anmeldung mit der Testkennung (auch die erste) */
    secretLogin: 3,
    /** +1 je so viele Minuten online im geheimen Netz */
    secretOnlineMinutesPerPoint: 5,
    /** Versuch, mit der Testkennung zu senden (einmal pro Verbindung) */
    secretSendAttempt: 2,
    /** Sperre der Testkennung ab Schwelle »dangerous« */
    lockMinutes: 180,
  },

  unreleasedGame: {
    /** Entschieden: Wirtschaftssimulation »FERNHANDEL« (Handel per Telex/Telefon zwischen Städten). */
    workingTitle: 'FERNHANDEL',
    genre: 'WIRTSCHAFTSSIMULATION',
    /** Neutrale Projektkennung auf dem Etikett – Platzhalter, austauschbar. */
    buildCode: 'WT-07',
    /** Entschieden: die C64-Taste "←" (oben links) während der Credits-Phase des Intros. */
    secretKey: 'ARROW_LEFT' as const,
    secretPhase: 'credits' as const,
  },

  secretNetwork: {
    /** Entschieden: nüchterne Namen eines abgeschotteten Netzes. */
    moduleName: 'MODUL K',
    nodeName: 'KNOTEN WEST',
    /** Vorprovisionierte Testkennung (GDD §8.4, Gestaltungsvorschlag). */
    testHandle: 'K-17',
    /** Absender der Rundschreiben – zugleich der Agent, den Operation REWIND ausschleusen soll. */
    senderHandle: 'K-01',
    /** Fiktive Ortsnetznummer der geheimen Mailbox (wird nie real gewählt). */
    phoneNumber: '41973',
  },

  /**
   * Reguläre (fiktive) Mailboxen. Nummern sind fiktive Ortsnetznummern und werden nie real gewählt.
   * Öffnungszeiten typisch für private Mailboxen der 80er: abends/nachts, wenn die Familie des Sysops
   * das Telefon nicht braucht. Entschieden: Der BIT-SCHUPPEN ist die Mailbox des Computerclubs (dort ist auch
   * GHOST aktiv), der DATENKELLER liefert Gerüchte über das geheime Netz. Inhalte dafür folgen mit Akt 2.
   */
  mailboxes: {
    bitschuppen: {
      name: 'BIT-SCHUPPEN GT',
      phoneNumber: '23586',
      sysop: 'ANDI',
      hours: { from: '18:00', to: '24:00' },
      /** Spielminuten bis der Sysop neue Benutzer freischaltet */
      validateAfterMinutes: 30,
    },
    datenkeller: {
      name: 'DATENKELLER',
      phoneNumber: '38104',
      sysop: 'MOLE',
      hours: { from: '22:00', to: '06:00' },
      validateAfterMinutes: 60,
    },
  },

  ralf: {
    /** Entschieden: Name seines leiblichen Vaters, nicht Seidel. */
    familyName: 'Brinkmann',
    phoneNumber: '47112',
    /**
     * Wann Ralf zu Hause ans Telefon geht (nach Wochentag). Außerhalb: Schule, Training (Di/Do/Fr) oder
     * unterwegs – dann nimmt jemand anderes ab, und Ralf ruft zurück. Ab 21:30 ruft man dort nicht mehr an.
     */
    home: {
      Montag: [['14:00', '21:30']],
      Dienstag: [
        ['14:00', '16:30'],
        ['19:30', '21:30'],
      ],
      Mittwoch: [['14:00', '21:30']],
      Donnerstag: [
        ['14:00', '16:30'],
        ['19:30', '21:30'],
      ],
      Freitag: [
        ['14:00', '16:30'],
        ['19:30', '21:30'],
      ],
      // Samstag: Schule bis mittags, nachmittags Fußballspiel
      Samstag: [
        ['12:30', '13:30'],
        ['17:30', '21:30'],
      ],
      Sonntag: [
        ['11:00', '12:00'],
        ['14:00', '21:00'],
      ],
    } as Record<string, ReadonlyArray<readonly [string, string]>>,
    /** an schulfreien Werktagen */
    homeHoliday: [['10:00', '21:30']] as ReadonlyArray<readonly [string, string]>,
    trainingDays: ['Dienstag', 'Donnerstag', 'Freitag'],
    /** Max. Gesprächsrunden bei späteren Telefonaten */
    maxTurns: 8,
  },

  /** Computerclub (Kontakt zu GHOST, GDD §3.4): Clubabend als erzählter Zeitblock */
  club: {
    eveningDate: '1986-11-20',
    leaveFrom: '18:30',
    leaveUntil: '19:30',
    backAt: '21:45',
  },

  /**
   * BTX (Bildschirmtext, Ausbauplan Punkt 7). Annahme (siehe STORY_OPEN_QUESTIONS.md): Die Bundespost schloss
   * Teilnehmer nur über das eigene Postmodem an (Akustikkoppler und Heimmodems reichten nicht, V.23 1200/75 Baud).
   * Jan besitzt keins; der Computerclub hat ein Leih-Set (Decoder-Modul + Postmodem, Vereinskennung) und gibt es
   * am Clubabend an Mitglieder weiter. Zugangsnummer und alle Seitennummern sind fiktiv. needs_research: Tarife.
   */
  btx: {
    /** Zugangsnummer des Postmodems (fiktiv) */
    accessNumber: '01910',
    /** Seitengebühr pro Abruf (ohne Übersicht), vereinfachte Spielökonomie */
    pageFeeDm: 0.02,
    /** Anbieter »Wiedenbrücker Kurier« und Clubtafel (fiktive Seitennummern) */
    overviewPage: '123000',
    clubBoardPage: '123770',
  },

  /** Entschieden: Ingrid (halbtags Arzthelferin) und Werner Keller (Schichtleiter in einer Möbelfabrik). */
  parents: {
    mother: 'Ingrid',
    father: 'Werner',
  },

  /**
   * Entschieden (interne Planung – darf im Spiel erst über Indizien erkennbar werden, GDD §3.4):
   * GHOST ist der Betreuer des Computerclubs; kennt Jan persönlich, ordnet ihm die Kennung aber erst
   * spät zu; arbeitet für einen nie benannten britischen Dienst aus persönlichem Motiv.
   */
  ghost: {
    /** Entschieden (Akt 2): der freundliche Mentor – Herr Brandt, Betreuer des Computerclubs */
    handle: 'GHOST',
    civilName: 'Herr Brandt',
    /** Sprachliche Eigenheit seiner Mailbox-Beiträge (Enttarnungsindiz) */
    quirk: ['FUERWAHR', 'WEITER SO.'],
    /** Ende von Akt 2: Fr. Abend, danach läuft die Operation */
    actTwoEndsAt: '1986-11-21T20:00',
    civilIdentity: 'computerclub_betreuer',
    recognitionArc: 'kennt_jan_erkennt_spaet',
    britishService: 'unbenannt',
  },

  /**
   * Finale (Vorschlag, Akt 3–6 verdichtet): Ab dem Ende von Akt 2 (Fr. 20:00) läuft die Operation; um `closesAt`
   * wird K-01 ausgeschleust. Jan hat drei Wege: 110 wählen, GHOST in der Club-Mailbox schreiben oder Ralf anrufen.
   * Die Beweislage (Fakten) entscheidet, ob die Polizei Seidel stoppen kann.
   */
  finale: {
    closesAt: '1986-11-21T23:30',
    evidence: [
      'wt07_trace',
      'key_leak',
      'key_complete',
      'k01_decrypted',
      'cassette',
      'seidel_job',
      'seidel_phones',
      'secret_mailbox',
    ] as string[],
    /** ab so vielen Beweisfakten nimmt die Polizei Jan ernst */
    strongEvidence: 5,
  },

  /** Entschieden: Operation REWIND (Details zu Ablauf und Finale folgen mit Akt 6). */
  operation: {
    /** Freitag eine Woche nach Spielbeginn */
    date: '1986-11-21',
    /** Industrieauftrag (Software für Fernmeldetechnik) mit britischem Abnehmer */
    target: 'fernmeldesoftware_britischer_abnehmer',
    /** Auszuschleusender Agent */
    agentHandle: 'K-01',
    /** Finale am Schreibtisch: Netz, Telefon, eigene BASIC-Programme gegen die Spieluhr */
    finale: 'netz_unter_zeitdruck',
  },

  /**
   * Entschieden (Schlüssel-Strang, docs/STORY_DECISIONS.md): Der Schlüssel von Diskette 2 lässt sich aus drei
   * Fragmenten rekonstruieren – unsichtbar im LADER auf Diskette 1, in einer versehentlich an »ALLE« verteilten
   * Systemmeldung, auf einer Datasette-Kassette, die Ralf bei Seidel findet. Verfahren: jede Ziffer verschiebt
   * den Buchstaben an ihrer Position zyklisch im Alphabet (C = P + k mod 26), »X« trennt Wörter.
   */
  keyStrand: {
    parts: ['7302', '1958', '4426'],
    /** ab dann steht die fehlgeleitete Systemmeldung mit Teil 2 im Netz */
    partTwoFrom: '1986-11-17T08:00',
    /** Buß- und Bettag: Ralf bringt die Kassette vorbei */
    cassetteAt: '1986-11-19T15:00',
    /** Klartext des Rundschreibens – bewusst vage (Ankündigung, keine Details) */
    plaintext:
      'AN ALLE STOP OPERATION REWIND BEGINNT FREITAG STOP ALLE KENNUNGEN BEREITHALTEN STOP KEINE TESTZUGAENGE MEHR STOP WEITERE ANWEISUNG FOLGT STOP ENDE',
    /** Dateiname, unter dem das Modul die Rohdaten speichert */
    rawFileName: 'K01.ROH',
  },

  intruder: {
    /**
     * Entschieden: Der Hinweis führt zum Schlüsselfragment im LADER, das an einer ähnlich »unsichtbaren« Stelle
     * versteckt ist (Textfarbe = Hintergrundfarbe).
     */
    hintScreen: 1,
    hintLink: { puzzleId: 'P08', factId: 'demo_border' } as null | { puzzleId: string; factId: string },
    hintThought:
      'Text, der im Bildschirmrand läuft – dort, wo eigentlich gar nichts sein dürfte. Man kann also Dinge zeigen, wo niemand hinschaut … das merkst du dir.',
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;

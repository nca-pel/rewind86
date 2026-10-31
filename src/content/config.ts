/**
 * Zentrale, austauschbare Spielkonfiguration.
 *
 * Alles, was in der GDD als [OFFEN] markiert ist, steht hier als neutraler Platzhalter
 * und ist mit TODO-STORY gekennzeichnet. Siehe docs/STORY_OPEN_QUESTIONS.md.
 */
export const GAME_CONFIG = {
  /** TODO-STORY (GDD §2.2 / §22.8): Entwickler-Default, nicht kanonisch. Muss ein Freitag sein. */
  startDate: '1986-11-14T16:00',

  /** Spielökonomie – vereinfachte, NICHT historisch verifizierte Tarife (GDD §8.6). */
  economy: {
    startMoneyDm: 23.5,
    /** Preis einer Gebühreneinheit. needs_research */
    dmPerUnit: 0.23,
    /** Minuten pro Einheit im Ortsnetz. needs_research */
    localMinutesPerUnit: 8,
  },

  relationshipsStart: { seidelSuspicion: 0, ralfTrust: 60, networkCredibility: 40 },

  /** Benannte Schwellenwerte statt magischer Zahlen (GDD §10.4). */
  thresholds: {
    suspicionNoticeable: 30,
    suspicionDangerous: 70,
  },

  unreleasedGame: {
    /** TODO-STORY (GDD §7.4 / §22.5): Titel und Genre des unveröffentlichten Spiels sind offen. */
    workingTitle: 'WORKING_TITLE_TBD',
    /** Neutrale Projektkennung auf dem Etikett – Platzhalter, austauschbar. */
    buildCode: 'WT-07',
    /**
     * TODO-STORY (GDD §22.5): Die konkrete versteckte Taste und der Zeitpunkt sind offen.
     * Platzhalter: die C64-Taste "←" (oben links) während der Credits-Phase des Intros.
     */
    secretKey: 'ARROW_LEFT' as const,
    secretPhase: 'credits' as const,
  },

  secretNetwork: {
    /** TODO-STORY (GDD §22.9): Name des Moduls / der geheimen Mailbox offen. */
    moduleName: 'MODUL K',
    nodeName: 'KNOTEN ?',
    /** Vorprovisionierte Testkennung (GDD §8.4, Gestaltungsvorschlag). */
    testHandle: 'K-17',
    senderHandle: 'K-01',
    /** Fiktive Ortsnetznummer der geheimen Mailbox (wird nie real gewählt). */
    phoneNumber: '41973',
  },

  ralf: {
    /** TODO-STORY (GDD §3.2): Familienname offen. */
    familyName: 'RALF_FAMILY_NAME_TBD',
    phoneNumber: '47112',
  },

  ghost: {
    /** TODO-STORY (GDD §3.4): bewusst nicht festgelegt, im Ausschnitt nicht verwendet. */
    civilIdentity: 'GHOST_CIVIL_IDENTITY_TBD',
    recognitionArc: 'GHOST_RECOGNITION_ARC_TBD',
  },

  intruder: {
    /**
     * TODO-STORY (GDD §12.2 / §22.11): Auf welches Rätsel der unbeabsichtigte Demo-Hinweis zeigt,
     * ist offen. hintLink bleibt null, bis das entschieden ist.
     */
    hintScreen: 1,
    hintLink: null as null | { puzzleId: string; factId: string },
    hintThought:
      'Text, der im Bildschirmrand läuft – dort, wo eigentlich gar nichts sein dürfte. Man kann also Dinge zeigen, wo niemand hinschaut … das merkst du dir.',
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;

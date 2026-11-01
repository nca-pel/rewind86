/**
 * Inhalte des fiktiven BTX-Angebots »Wiedenbrücker Kurier« (Entwurf: docs/BTX_PAGES_DRAFT.md).
 * Alle Seitennummern, Meldungen und Preise sind ausgedacht (GDD §20.4); needs_research: historische Seitenformate.
 * Zeilen höchstens 40 Zeichen, Großbuchstaben, keine Umlaute (wie die übrigen Netzinhalte).
 */
import { GAME_CONFIG } from './config';
import type { GameState } from '../engine/types';

const B = GAME_CONFIG.btx;
const C = GAME_CONFIG.club;

export interface BtxPage {
  id: string;
  title: string;
  /** Folgeseiten (»#«): jede Seite eine Liste von Zeilen */
  parts: (state: GameState) => string[][];
  /** Auswahlziffer → Seiten-ID; fehlt »0«, führt sie zur Übersicht */
  links: Record<string, string>;
  /** ID des Fakts, der beim Abruf notiert wird (null = keiner) */
  fact?: (state: GameState) => string | null;
  /** keine Gebühr (Übersicht, Hilfe) */
  free?: boolean;
}

function day(state: GameState): string {
  return state.gameClock.slice(0, 10);
}

/** Tagesabhängiger Text: vor dem ersten Tag den ersten, nach dem letzten den letzten nehmen */
function byDay<T>(state: GameState, table: Record<string, T>): T {
  const keys = Object.keys(table).sort();
  const d = day(state);
  return table[d] ?? (d < keys[0] ? table[keys[0]] : table[keys[keys.length - 1]]);
}

const NEWS: Record<string, string[]> = {
  '1986-11-14': [
    'KREISTAG EINIG UEBER FEUERWEHRETAT',
    'B61 BEI WIEDENBRUECK: HAVARIE, STAU',
    'SCHULBUS-FAHRPLAN AB 1. DEZEMBER NEU',
  ],
  '1986-11-15': [
    'NEBEL: FUSSBALLSPIELE IM KREIS',
    'TEILWEISE VERLEGT, MORGEN WIE GEPLANT',
    'POLIZEI SUCHT ZEUGEN: FAHRERFLUCHT',
    'AM BAHNHOF RHEDA',
  ],
  '1986-11-16': [
    'TOTENSONNTAG: KRANZNIEDERLEGUNG AM',
    'EHRENMAL, RUHIGES WOCHENENDE',
    'BUSNETZ ERHAELT ZWEI NEUE LINIEN',
  ],
  '1986-11-17': [
    'GUETERSLOH: UNBEKANNTE IN DIE BUEROS',
    'EINER SOFTWAREFIRMA EINGEDRUNGEN.',
    'POLIZEI: KEIN GROSSER SCHADEN, TATZEIT',
    'WOCHENENDE. DIE FIRMA NENNT KEINEN',
    'NAMEN. ERMITTLER: "WIR GEHEN ALLEM',
    'NACH."',
  ],
  '1986-11-18': [
    'FOLGEMELDUNG EINBRUCH GUETERSLOH:',
    'STAATSANWALTSCHAFT VERMUTET EINEN',
    'AUSSENSTEHENDEN MIT FACHKENNTNIS.',
    'KEINE FESTNAHMEN.',
    'KREIS: NEUE BUSHALLE ERSTMALS GEOEFFNET',
  ],
  '1986-11-19': [
    'BUSS- UND BETTAG: GESCHAEFTE UND',
    'BEHOERDEN GESCHLOSSEN. GOTTESDIENSTE',
    'IN ALLEN KIRCHENGEMEINDEN.',
  ],
  '1986-11-20': [
    'WIEDENBRUECK: COMPUTERCLUB LAEDT ZUM',
    'MONATSTREFFEN INS JUGENDZENTRUM.',
    'BTX WAECHST: DIE POST ERWARTET WEITERE',
    'TEILNEHMER BIS ZUM JAHRESENDE.',
  ],
  '1986-11-21': [
    'STURMWARNUNG FUER WESTFALEN AM ABEND.',
    'HINWEIS DER POLIZEI: LOSE GEGENSTAENDE',
    'AUF BALKONEN UND IM GARTEN SICHERN.',
  ],
};

const WEATHER: Record<string, string[]> = {
  '1986-11-14': ['NEBEL, SPAETER SONNIGE LUECKEN.', 'TAG 6, NACHT 1 GRAD. SCHWACHER WIND.'],
  '1986-11-15': ['WECHSELHAFT, ABENDS REGEN.', 'TAG 5, NACHT 0 GRAD.'],
  '1986-11-16': ['VIELE WOLKEN, EINZELNE SCHAUER.', 'TAG 6, NACHT 2 GRAD.'],
  '1986-11-17': ['REGENFRONT AUS WEST. TAG 7, NACHT 3.', 'MORGENS STELLENWEISE GLAETTE.'],
  '1986-11-18': ['REGEN, KALTER WIND AUS WEST.', 'TAG 8, NACHT 4 GRAD.'],
  '1986-11-19': ['TRUEB, ORTLICH NEBEL. TAG 6, NACHT 2.', 'NACHMITTAGS ETWAS FREUNDLICHER.'],
  '1986-11-20': ['SCHAUER, ABENDS STURMBOEEN.', 'TAG 9, NACHT 3 GRAD.'],
  '1986-11-21': [
    'STURMTIEF UEBER WESTFALEN. BOEEN BIS',
    'STAERKE 10 (NW). REGEN, TAG 8, ABENDS 5.',
    'NACH DUNKELHEIT: STURM UND REGEN.',
  ],
};

function tvProgram(state: GameState): string[][] {
  const d = Number(day(state).slice(8, 10));
  return [
    [
      'ARD',
      '18:00 REGIONALMAGAZIN',
      '19:40 TAGESSCHAU',
      '20:15 FERNSEHFILM',
      '21:45 SPORT',
      '23:10 SPAETMAGAZIN',
    ],
    [
      'ZDF',
      '19:00 HEUTE',
      '19:25 RATESENDUNG',
      d % 2 ? '20:15 FAMILIENSERIE' : '20:15 DOKUMENTATION',
      '22:00 THEATER',
    ],
    ['WDR 3', '18:00 MUSIK AUS NRW', '19:03 KLASSIK', '20:15 KABARETT', '22:30 NACHTPROGRAMM'],
  ];
}

const MESSAGE_BOARD_BEFORE = ['TAFEL NOCH LEER.', '', 'NAECHSTES CLUBTREFFEN: 20.11., 19 UHR'];
const MESSAGE_BOARD_AFTER = [
  'MITTEILUNG VON: EIN FREUND DER',
  'CLUBMAILBOX (KEIN NAME ANGEGEBEN)',
  '',
  'AN DEN GAST, DER GERNE FRAGT:',
  'DAS WICHTIGSTE STEHT NIE IN DEN MENUES.',
  'WIR SIND GESPANNT, WOHIN DIE SUCHE',
  'FUEHRT.',
];

export const BTX_PAGES: BtxPage[] = [
  {
    id: B.overviewPage,
    title: 'WIEDENBRUECKER KURIER',
    free: true,
    links: { '1': '123100', '2': '123200', '3': '123300', '4': '123400', '5': '123600', '9': '123900' },
    parts: () => [
      [
        'FUER DIE TEILNEHMER DES COMPUTERCLUBS',
        '',
        ' 1  NACHRICHTEN',
        ' 2  WETTER (WESTFALEN)',
        ' 3  FERNSEHPROGRAMM',
        ' 4  KLEINANZEIGEN',
        ' 5  COMPUTER-ECKE',
        ' 9  WAS IST BTX?',
        '',
        'WAHL: ZIFFER, ODER *SEITENNUMMER#',
      ],
    ],
  },
  {
    id: '123100',
    title: 'NACHRICHTEN',
    links: {},
    parts: (s) => [byDay(s, NEWS), ['LOKALES:', 'BITTE DIE TAGESZEITUNG BEACHTEN.']],
    fact: (s) => (['1986-11-17', '1986-11-18'].includes(day(s)) ? 'btx_break_in' : null),
  },
  { id: '123200', title: 'WETTER', links: {}, parts: (s) => [byDay(s, WEATHER)] },
  { id: '123300', title: 'FERNSEHPROGRAMM', links: {}, parts: tvProgram },
  {
    id: '123400',
    title: 'KLEINANZEIGEN',
    links: {},
    parts: () => [
      [
        'VERKAUFE 1541-LAUFWERK, KAUM BENUTZT.',
        'SUCHE TAUSCHPARTNER FUER C64-SOFTWARE.',
        `CLUB-TREFFEN ${C.eveningDate.slice(8, 10)}.${C.eveningDate.slice(5, 7)}., JUGENDZENTRUM.`,
        `CLUB-MAILBOX ${GAME_CONFIG.mailboxes.bitschuppen.name}`,
        `TEL. ${GAME_CONFIG.mailboxes.bitschuppen.phoneNumber}, ABENDS GEOEFFNET.`,
      ],
    ],
  },
  {
    id: '123600',
    title: 'COMPUTER-ECKE',
    links: {},
    parts: () => [
      [
        'BILDSCHIRMTEXT IST KEIN GEWOEHNLICHER',
        'TEXT: DER DECODER ZEICHNET JEDE SEITE',
        'AUS EIGENEN CODES NEU. SEITENWAHL:',
        '*NUMMER# RUFT EINE SEITE DIREKT AUF,',
        '0 ZEIGT DIE UEBERSICHT, # BLAETTERT.',
        '',
        'WIR GRUESSEN DIE CLUB-MAILBOX!',
      ],
    ],
  },
  {
    id: '123900',
    title: 'WAS IST BTX?',
    free: true,
    links: {},
    parts: () => [
      [
        'BILDSCHIRMTEXT: DIE POST VERBINDET',
        'IHREN DECODER UEBER DAS TELEFONNETZ',
        'MIT RECHNERN DER ANBIETER.',
        '',
        'KOSTEN: TELEFON-EINHEITEN, DAZU',
        'GEBUEHR PRO SEITE (NICHT ALLE).',
        'WAEHREND SIE ONLINE SIND, IST DAS',
        'TELEFON BELEGT.',
      ],
    ],
  },
  {
    id: B.clubBoardPage,
    title: 'CLUBTAFEL (NUR LESEN)',
    links: {},
    parts: (s) => [s.flags.clubAttended ? MESSAGE_BOARD_AFTER : MESSAGE_BOARD_BEFORE],
    fact: (s) => (s.flags.clubAttended ? 'btx_club_board' : null),
  },
];

export const BTX_BY_ID: Record<string, BtxPage> = Object.fromEntries(BTX_PAGES.map((p) => [p.id, p]));

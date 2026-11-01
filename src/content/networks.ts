import { K01_CIPHERTEXT, groups } from '../engine/cipher';
import type { Condition, GameEffect } from '../engine/types';
import { GAME_CONFIG } from './config';

const N = GAME_CONFIG.secretNetwork;
const B = GAME_CONFIG.unreleasedGame.buildCode;

export type BbsStatus = 'gast' | 'neu' | 'mitglied';

export interface MailboxMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  encrypted: boolean;
  body: string[];
  effects: GameEffect[];
  /** Nur sichtbar ab diesem Benutzerstatus (Standard: gast) */
  minStatus?: BbsStatus;
  /** Nur sichtbar, solange die Bedingung gilt (z. B. Tonfall je nach Verdachtsstufe) */
  when?: Condition;
}

export interface BoardDef {
  id: string;
  name: string;
  /** Lesen ab diesem Status; Schreiben immer erst als Mitglied */
  minStatus: BbsStatus;
  messages: MailboxMessage[];
}

/** Herunterladbares Programm – landet als echte Datei auf der Diskette im Laufwerk */
export interface DownloadDef {
  name: string;
  blocks: number;
  description: string;
  basic: string[];
}

/** Automatische Antwort auf private Post an einen Benutzer des Systems */
export interface AutoReply {
  /** Eindeutig je Handle, wenn es mehrere Antworten gibt (Standard: nur das Handle) */
  id?: string;
  /** Antwort gilt nur, solange die Bedingung erfüllt ist; die erste passende gewinnt */
  when?: Condition;
  to: string;
  afterMinutes: number;
  from: string;
  subject: string;
  body: string[];
  effects?: GameEffect[];
  /** Wirkt sofort beim Absenden der Post (Jan legt sich fest), nicht erst beim Lesen der Antwort */
  onSend?: GameEffect[];
}

export interface MailboxSystem {
  id: string;
  name: string;
  phoneNumber: string;
  baud: number;
  /**
   * 'module': nur mit dem Kommunikationsmodul (automatische Anmeldung mit autoHandle);
   * 'public': normales Terminalprogramm, Gäste willkommen.
   */
  access: 'module' | 'public';
  /** Handle, mit dem sich das Modul automatisch anmeldet (nur access 'module') */
  autoHandle?: string;
  sysop?: string;
  /** Öffnungszeiten (HH:MM, über Mitternacht möglich); fehlt = rund um die Uhr */
  hours?: { from: string; to: string };
  /** Spielminuten bis zur Freischaltung neuer Benutzer */
  validateAfterMinutes?: number;
  welcome: string[];
  boards: BoardDef[];
  downloads: DownloadDef[];
  replies: AutoReply[];
  /** Begrüßungspost nach der Freischaltung */
  memberMail?: { from: string; subject: string; body: string[]; effects?: GameEffect[] };
  historicalStatus: 'fictional';
  sysinfo: string[];
  sysinfoEffects: GameEffect[];
}

/** Kurzmeldungen, die das Modul mit gültigem Schlüssel senden kann (Freitext gibt es im Modul nicht). */
export interface SecretSend {
  id: string;
  /** Menütext (max. 30 Zeichen) */
  label: string;
  to: string;
  body: string;
  when?: Condition;
  effects: GameEffect[];
}

export const SECRET_SENDS: SecretSend[] = [
  {
    id: 'quittung',
    label: `QUITTUNG AN ${N.senderHandle}`,
    to: N.senderHandle,
    body: `${N.testHandle}: RUNDSCHREIBEN ERHALTEN. BEREIT.`,
    when: { fact: 'k01_decrypted' },
    effects: [
      { type: 'changeRelationship', id: 'networkCredibility', delta: 25 },
      { type: 'discoverFact', id: 'net_quittung' },
    ],
  },
  {
    id: 'anfrage',
    label: 'ANFRAGE TREFFPUNKT AN SYSTEM',
    to: 'SYSTEM',
    body: `${N.testHandle}: TREFFPUNKT UND ZEIT FREITAG?`,
    when: { fact: 'k01_decrypted' },
    effects: [{ type: 'scheduleEvent', id: 'ev_net_reply', inMinutes: 5 }],
  },
  {
    id: 'warnung',
    label: `WARNUNG AN ${N.senderHandle}: ABBRUCH`,
    to: N.senderHandle,
    body: 'TREFFPUNKT VERRATEN. ABBRUCH.',
    when: { all: [{ flag: 'finaleOpen' }, { notFlag: 'gameOver' }] },
    effects: [{ type: 'scheduleEvent', id: 'ev_finale_k01', inMinutes: 10 }],
  },
];

export const SECRET_MAILBOX: MailboxSystem = {
  id: 'secret',
  name: N.nodeName,
  phoneNumber: N.phoneNumber,
  baud: 300,
  autoHandle: N.testHandle,
  access: 'module',
  historicalStatus: 'fictional',
  welcome: [],
  downloads: [],
  replies: [],
  boards: [
    {
      id: 'post',
      name: 'NACHRICHTEN',
      minStatus: 'gast',
      messages: [
        {
          id: 'msg_k01_all',
          from: N.senderHandle,
          to: 'ALLE',
          subject: '######## [VERSCHL.]',
          encrypted: true,
          // Echtes Chiffrat (src/engine/cipher.ts); mit Schlüssel zeigt das Modul den Klartext.
          body: ['SCHLUESSEL FEHLT - ROHDATEN:', '', ...groups(K01_CIPHERTEXT), '', '-- ENDE --'],
          effects: [
            { type: 'discoverFact', id: 'encrypted_msg' },
            { type: 'changeRelationship', id: 'seidelSuspicion', delta: 2 },
            {
              type: 'say',
              kind: 'thought',
              text: 'Lauter Buchstabensalat in Fünfergruppen. Ohne Schlüssel keine Chance.',
            },
          ],
        },
        {
          id: 'msg_sys_test',
          from: 'SYSTEM',
          to: N.testHandle,
          subject: 'TESTZUGANG',
          encrypted: false,
          body: [
            `TESTZUGANG ${N.testHandle} AKTIV.`,
            '',
            'KENNUNG WURDE MIT ARBEITSKOPIE',
            `${B} AUSGELIEFERT.`,
            'ABGLEICH: OK.',
            '',
            'TESTZUGAENGE WERDEN NACH ABSCHLUSS',
            'DER ERPROBUNG GELOESCHT.',
          ],
          effects: [
            { type: 'discoverFact', id: 'wt07_trace' },
            { type: 'changeRelationship', id: 'seidelSuspicion', delta: 1 },
            {
              type: 'say',
              kind: 'thought',
              text: `»${B}« – das steht auf Ralfs Diskette! Dieses Netz und das Spiel von Ralfs Stiefvater gehören zusammen.`,
            },
          ],
        },
        // Schlüssel-Strang (P07/P08): eine Meldung, die nur K-01 hätte erreichen sollen – Seidels Fehler.
        {
          id: 'msg_key_leak',
          from: 'SYSTEM',
          to: 'ALLE',
          subject: 'SCHLUESSELWECHSEL',
          encrypted: false,
          when: { timeAfter: GAME_CONFIG.keyStrand.partTwoFrom },
          body: [
            'SCHLUESSELWECHSEL ZUM 21.11.',
            `EMPFAENGER: ${N.senderHandle} (PERSOENLICH)`,
            'VERTEILER : ALLE',
            '',
            `K-SCHLUESSEL TEIL 2/3: ${GAME_CONFIG.keyStrand.parts[1]}`,
            '',
            'TEIL 1/3: WIE UEBLICH AUF DER',
            '          ARBEITSKOPIE (SICHTSCHUTZ)',
            'TEIL 3/3: PRUEFBAND, GEHT PER BOTEN',
          ],
          effects: [
            { type: 'discoverFact', id: 'key_part_2' },
            { type: 'discoverFact', id: 'key_leak' },
            { type: 'puzzle', id: 'P07', status: 'solved' },
            { type: 'puzzle', id: 'P08', status: 'discovered' },
            { type: 'changeRelationship', id: 'seidelSuspicion', delta: 1 },
            {
              type: 'say',
              kind: 'thought',
              text: `»Empfänger: ${N.senderHandle} – Verteiler: ALLE.« Da hat jemand den falschen Knopf erwischt. Ein Drittel des Schlüssels steht hier im Klartext – und der Rest ist auf der Arbeitskopie und auf irgendeinem Band?`,
            },
          ],
        },
        {
          id: 'msg_sys_meeting',
          from: 'SYSTEM',
          to: N.testHandle,
          subject: 'RE: TREFFPUNKT',
          encrypted: false,
          when: { flag: 'netMeeting' },
          body: [
            'FREITAG 2330',
            'RASTSTAETTE GT, PARKPLATZ NORD.',
            'STICHWORT: REWIND.',
            '',
            'NICHT ANTWORTEN.',
          ],
          effects: [{ type: 'discoverFact', id: 'net_meeting_point' }],
        },
        {
          id: 'msg_sys_who',
          from: 'SYSTEM',
          to: N.testHandle,
          subject: 'RUECKFRAGE',
          encrypted: false,
          when: { flag: 'netWho' },
          body: ['WER FRAGT?', '', `KENNUNG ${N.testHandle} WIRD GEPRUEFT.`],
          effects: [{ type: 'discoverFact', id: 'net_who' }],
        },
        // Symptome von Seidels Verdacht (GDD §9.3: sichtbar nur als Tonfall von Nachrichten).
        // Entschieden: Hinter SYSTEM steht Seidel, der die Infrastruktur des Netzes betreut. Das Spiel sagt es
        // nie ausdrücklich; der Tonfall und die Uhrzeiten (abends, wenn er „noch arbeitet“) verraten es.
        {
          id: 'msg_sys_watch',
          from: 'SYSTEM',
          to: 'ALLE',
          subject: 'PROTOKOLLIERUNG',
          encrypted: false,
          when: { rel: 'seidelSuspicion', atLeast: 'noticeable' },
          body: [
            'UNGEWOEHNLICHE AKTIVITAET AUF',
            'TESTZUGAENGEN FESTGESTELLT.',
            '',
            'ALLE ZUGRIFFE WERDEN AB SOFORT',
            'PROTOKOLLIERT.',
          ],
          effects: [{ type: 'discoverFact', id: 'net_watch' }],
        },
        {
          id: 'msg_sys_final',
          from: 'SYSTEM',
          to: N.testHandle,
          subject: 'LETZTE WARNUNG',
          encrypted: false,
          when: { rel: 'seidelSuspicion', atLeast: 'critical' },
          body: [
            `KENNUNG ${N.testHandle}:`,
            'UNBEFUGTE NUTZUNG.',
            '',
            'BEI WEITEREM ZUGRIFF WIRD DER',
            'ANSCHLUSS DES ANRUFERS ERMITTELT.',
          ],
          effects: [{ type: 'discoverFact', id: 'final_warning' }],
        },
      ],
    },
  ],
  sysinfo: [
    `KNOTEN     : ${N.nodeName}`,
    'TEILNEHMER : (NICHT ABRUFBAR)',
    `IHRE KENNG.: ${N.testHandle}`,
    'RECHTE     : LESEN (EINGESCHR.)',
    'LETZTE ANM.: ---- (KEINE)',
  ],
  sysinfoEffects: [{ type: 'discoverFact', id: 'never_logged_in' }],
};

const BS = GAME_CONFIG.mailboxes.bitschuppen;
const DK = GAME_CONFIG.mailboxes.datenkeller;
const GH = GAME_CONFIG.ghost.handle;

/** Erste reguläre Mailbox (Kleinanzeige im Heimcomputer-Journal) – freiwillige Spur. */
export const BITSCHUPPEN: MailboxSystem = {
  id: 'bitschuppen',
  name: BS.name,
  phoneNumber: BS.phoneNumber,
  baud: 300,
  access: 'public',
  sysop: BS.sysop,
  hours: BS.hours,
  validateAfterMinutes: BS.validateAfterMinutes,
  historicalStatus: 'fictional',
  welcome: [
    `*** ${BS.name} ***`,
    `SYSOP: ${BS.sysop}  -  300 BAUD 8N1`,
    `GEOEFFNET ${BS.hours.from}-${BS.hours.to} UHR`,
    'BITTE NICHT LAENGER ALS 30 MINUTEN -',
    'ANDERE WOLLEN AUCH REIN!',
  ],
  boards: [
    {
      id: 'allgemein',
      name: 'ALLGEMEIN',
      minStatus: 'gast',
      messages: [
        {
          id: 'bs_regeln',
          from: BS.sysop,
          to: 'ALLE',
          subject: 'REGELN - BITTE LESEN',
          encrypted: false,
          body: [
            '1. KEINE RAUBKOPIEN, KEINE CRACKS.',
            '2. ECHTER NAME BEIM SYSOP, HANDLE',
            '   IM BRETT IST OK.',
            '3. GAESTE KOENNEN LESEN. SCHREIBEN',
            '   UND DOWNLOADS ERST NACH',
            '   FREISCHALTUNG (DAUERT ETWAS).',
            '4. MAX. 30 MINUTEN PRO ANRUF.',
            '',
            'VIEL SPASS! ' + BS.sysop,
          ],
          effects: [],
        },
        {
          id: 'bs_gebuehren',
          from: 'KALLE',
          to: 'ALLE',
          subject: 'TELEFONRECHNUNG...',
          encrypted: false,
          body: [
            'MEIN VATER HAT DIE RECHNUNG GESEHEN.',
            '38 MARK. ICH BIN JETZT ERSTMAL',
            'EIN PAAR WOCHEN OFFLINE. GRUESSE',
            'AN ALLE, KALLE',
          ],
          effects: [],
        },
        {
          id: 'bs_liste',
          from: BS.sysop,
          to: 'ALLE',
          subject: 'MAILBOXLISTE OWL',
          encrypted: false,
          minStatus: 'mitglied',
          body: [
            'ANDERE BOXEN IN DER GEGEND:',
            '',
            `${pad(BS.name, 16)} ${BS.phoneNumber}  ${BS.hours.from}-${BS.hours.to}`,
            `${pad(DK.name, 16)} ${DK.phoneNumber}  ${DK.hours.from}-${DK.hours.to}`,
            '',
            'WEITERE NUMMERN BITTE AN MICH.',
          ],
          effects: [{ type: 'discoverFact', id: 'bbs_datenkeller' }],
        },
      ],
    },
    {
      id: 'c64',
      name: 'C64-ECKE',
      minStatus: 'gast',
      messages: [
        {
          id: 'bs_intruder',
          from: 'ZAPPO',
          to: 'ALLE',
          subject: 'INTRUDER VON 1001',
          encrypted: false,
          body: [
            'HAT JEMAND DIE INTRUDER-DEMO SCHON',
            'GESEHEN? DIE SCHREIBEN TEXT IN DEN',
            'RAHMEN! WIE GEHT DAS UEBERHAUPT??',
          ],
          effects: [],
        },
        {
          id: 'bs_koppler',
          from: BS.sysop,
          to: 'ZAPPO',
          subject: 'RE: KOPPLER PFEIFT',
          encrypted: false,
          body: [
            'WENN DER KOPPLER DAUERND AUSSTEIGT:',
            'HOERER FESTER IN DIE MUFFEN UND',
            'DIE TUER ZU. JEDES GERAEUSCH IM',
            'ZIMMER STOERT DIE UEBERTRAGUNG.',
          ],
          effects: [],
        },
      ],
    },
    {
      id: 'club',
      name: 'CLUB',
      minStatus: 'gast',
      messages: [
        {
          id: 'gh_1',
          from: GH,
          to: 'ALLE',
          subject: 'WILLKOMMEN, NEUE',
          encrypted: false,
          body: [
            'WER DAS HIER LIEST, GEHOERT',
            'ENTWEDER ZUM CLUB ODER WIRD ES',
            'BALD. FUERWAHR, DER DONNERSTAG',
            'LOHNT SICH: 19 UHR IM JUGEND-',
            'ZENTRUM. BRINGT DISKETTEN MIT.',
            '',
            'WEITER SO.  ' + GH,
          ],
          effects: [
            { type: 'discoverFact', id: 'ghost_poster' },
            { type: 'discoverFact', id: 'ghost_word' },
          ],
        },
        {
          id: 'gh_2',
          from: GH,
          to: 'ALLE',
          subject: 'NACHTSCHICHT',
          encrypted: false,
          when: { timeAfter: '1986-11-16T20:00' },
          body: [
            'DREI UHR, DER KAFFEE SCHWARZ',
            'WIE DIE LEITUNG. WER AUF FREMDEN',
            'TESTZUGAENGEN HERUMTURNT, SOLLTE',
            'WISSEN: JEDER ANRUF HINTERLAESST',
            'EINE SPUR. NICHT IM NETZ - AM',
            'ANSCHLUSS. DAS HIER IST NICHT',
            'WARGAMES. FUERWAHR.',
            '',
            'WEITER SO.  ' + GH,
          ],
          effects: [{ type: 'discoverFact', id: 'ghost_night' }],
        },
        {
          id: 'gh_3_brandt',
          from: GH,
          to: 'DEN GAST',
          subject: 'WER GERNE FRAGT',
          encrypted: false,
          when: { all: [{ flag: 'clubAttended' }, { fact: 'brandt_word' }] },
          body: [
            'AN DEN GAST, DER GERNE FRAGT:',
            'WER FRAGT, FINDET. WER ZU LAUT',
            'FRAGT, WIRD GEFUNDEN. FREITAG IST',
            'NICHT NUR EIN TAG. WILLST DU',
            'WISSEN, WAS FREITAG IST, DANN',
            'SCHREIB MIR HIER. NUR MIR.',
            'UND ERZAEHL ES NICHT WEITER,',
            'BIS WIR GESPROCHEN HABEN.',
            '',
            'FUERWAHR. WEITER SO.  ' + GH,
          ],
          effects: [
            { type: 'discoverFact', id: 'ghost_offer' },
            { type: 'discoverFact', id: 'brandt_is_ghost' },
            {
              type: 'say',
              kind: 'thought',
              text: '»Fürwahr.« »Weiter so.« Genau das sagt Herr Brandt, wenn er dir die Thermoskanne reicht. Der Betreuer des Clubs ist GHOST – und er weiß, dass du fragst.',
            },
          ],
        },
        {
          id: 'gh_3_plain',
          from: GH,
          to: 'DEN GAST',
          subject: 'WER GERNE FRAGT',
          encrypted: false,
          when: { all: [{ flag: 'clubAttended' }, { notFact: 'brandt_word' }] },
          body: [
            'AN DEN GAST, DER GERNE FRAGT:',
            'WER FRAGT, FINDET. WER ZU LAUT',
            'FRAGT, WIRD GEFUNDEN. FREITAG IST',
            'NICHT NUR EIN TAG. WILLST DU',
            'WISSEN, WAS FREITAG IST, DANN',
            'SCHREIB MIR HIER. NUR MIR.',
            'UND ERZAEHL ES NICHT WEITER,',
            'BIS WIR GESPROCHEN HABEN.',
            '',
            'FUERWAHR. WEITER SO.  ' + GH,
          ],
          effects: [{ type: 'discoverFact', id: 'ghost_offer' }],
        },
      ],
    },
    {
      id: 'markt',
      name: 'MARKT',
      minStatus: 'mitglied',
      messages: [
        {
          id: 'bs_markt1',
          from: 'BIRGIT',
          to: 'ALLE',
          subject: 'VERKAUFE DATASETTE',
          encrypted: false,
          body: ['DATASETTE, GEHT EINWANDFREI. 30 DM', 'ODER TAUSCH GEGEN LEERDISKETTEN.'],
          effects: [],
        },
      ],
    },
  ],
  downloads: [
    {
      name: 'BIORHYTHMUS',
      blocks: 4,
      description: 'BERECHNET DEINE TAGESFORM',
      basic: [
        '10 PRINT CHR$(147);"BIORHYTHMUS"',
        '20 INPUT "TAGE SEIT GEBURT";T',
        '30 K=SIN(6.28319*T/23):S=SIN(6.28319*T/28)',
        '40 G=SIN(6.28319*T/33)',
        '50 PRINT "KOERPER: ";INT(K*100);"%"',
        '60 PRINT "SEELE  : ";INT(S*100);"%"',
        '70 PRINT "GEIST  : ";INT(G*100);"%"',
      ],
    },
    {
      name: 'ZAHLENRATEN',
      blocks: 2,
      description: 'KLASSIKER FUER ZWISCHENDURCH',
      basic: [
        '10 Z=INT(RND(0)*100)+1:V=0',
        '20 INPUT "DEIN TIP (1-100)";T:V=V+1',
        '30 IF T<Z THEN PRINT "ZU KLEIN":GOTO 20',
        '40 IF T>Z THEN PRINT "ZU GROSS":GOTO 20',
        '50 PRINT "RICHTIG! VERSUCHE:";V',
      ],
    },
  ],
  replies: [
    {
      id: 'finale',
      when: { flag: 'finaleOpen' },
      to: GH,
      afterMinutes: 10,
      from: GH,
      subject: 'RE: BEWEISE',
      body: ['VERSTANDEN. ICH UEBERNEHME.', '', 'FUERWAHR.  ' + GH],
      onSend: [
        { type: 'setFlag', id: 'toldGhost', value: true },
        { type: 'scheduleEvent', id: 'ev_finale_ghost', inMinutes: 12 },
      ],
    },
    {
      to: GH,
      afterMinutes: 12,
      from: GH,
      subject: 'RE: FREITAG',
      body: [
        'DANKE FUER DEIN VERTRAUEN.',
        'FREITAG BEGINNT ETWAS, DAS NICHT',
        'WIEDER ZURUECKGEDREHT WERDEN',
        'KANN. NUTZ DIE TESTKENNUNG NICHT',
        'MEHR UND LOESCH, WAS DU NOTIERT',
        'HAST. ICH MELDE MICH. FUERWAHR.',
        '',
        'WEITER SO.  ' + GH,
      ],
      onSend: [
        { type: 'setFlag', id: 'toldGhost', value: true },
        { type: 'changeRelationship', id: 'seidelSuspicion', delta: -10 },
        { type: 'discoverFact', id: 'ghost_trusted' },
      ],
    },
    {
      to: BS.sysop,
      afterMinutes: 15,
      from: BS.sysop,
      subject: 'RE: HALLO',
      body: ['HI, DANKE FUER DIE NACHRICHT!', 'SCHOEN, DASS DU DABEI BIST.', 'GRUSS ' + BS.sysop],
    },
  ],
  memberMail: {
    from: BS.sysop,
    subject: 'FREIGESCHALTET',
    body: [
      'HALLO UND WILLKOMMEN!',
      'DU BIST JETZT FREIGESCHALTET:',
      'SCHREIBEN, POST UND DOWNLOADS.',
      'IM BRETT ALLGEMEIN STEHT JETZT AUCH',
      'DIE MAILBOXLISTE FUER OWL.',
      'GRUSS ' + BS.sysop,
    ],
    effects: [{ type: 'discoverFact', id: 'bbs_member' }],
  },
  sysinfo: [
    `SYSTEM  : ${BS.name}`,
    `SYSOP   : ${BS.sysop}`,
    'RECHNER : C64 + 1541 + KOPPLER',
    `ZEITEN  : TAEGLICH ${BS.hours.from}-${BS.hours.to}`,
  ],
  sysinfoEffects: [],
};

/** Zweites reguläres System: nur nachts, Nummer aus der Mailboxliste. */
export const DATENKELLER: MailboxSystem = {
  id: 'datenkeller',
  name: DK.name,
  phoneNumber: DK.phoneNumber,
  baud: 300,
  access: 'public',
  sysop: DK.sysop,
  hours: DK.hours,
  validateAfterMinutes: DK.validateAfterMinutes,
  historicalStatus: 'fictional',
  welcome: [`>>> ${DK.name} <<<`, 'NACHTBETRIEB. LEISE SEIN.', `SYSOP: ${DK.sysop}`],
  boards: [
    {
      id: 'keller',
      name: 'KELLERGEFLUESTER',
      minStatus: 'gast',
      messages: [
        {
          id: 'dk_hallo',
          from: DK.sysop,
          to: 'ALLE',
          subject: 'NEU HIER?',
          encrypted: false,
          body: [
            'DER KELLER IST NUR NACHTS OFFEN,',
            'TAGSUEBER BRAUCHT MEINE MUTTER DAS',
            'TELEFON. WER STOERT, FLIEGT.',
          ],
          effects: [],
        },
        {
          id: 'dk_ghost',
          from: DK.sysop,
          to: 'ALLE',
          subject: 'GERUECHT',
          encrypted: false,
          body: [
            'IM BIT-SCHUPPEN SCHREIBT EINER,',
            'DER ANGEBLICH NUR ZUHOERT. DER',
            'HOERT WIRKLICH ZU. MEHR ALS',
            'DIR LIEB IST. WER DORT FRAGT,',
            'SOLLTE WISSEN, WAS ER FRAGT.',
          ],
          effects: [{ type: 'discoverFact', id: 'dk_ghost_rumor' }],
        },
        {
          id: 'dk_k01',
          from: DK.sysop,
          to: 'ALLE',
          subject: 'NOCH EIN GERUECHT',
          encrypted: false,
          when: { timeAfter: '1986-11-18T22:00' },
          body: [
            'DAS NETZ MIT DEN K-NUMMERN: DER',
            'CHEF DAVON SITZT NICHT HIER. DER',
            'GEHOERT NACH DRUEBEN UND SPIELT',
            'SEIT JAHREN WESSI. ANGEBLICH WILL',
            'ER BALD NACH HAUSE. ICH HAB NIX',
            'GESAGT.  ' + DK.sysop,
          ],
          effects: [{ type: 'discoverFact', id: 'dk_k01_rumor' }],
        },
      ],
    },
  ],
  downloads: [],
  replies: [],
  sysinfo: [`SYSTEM  : ${DK.name}`, `SYSOP   : ${DK.sysop}`, `ZEITEN  : ${DK.hours.from}-${DK.hours.to}`],
  sysinfoEffects: [],
};

export const MAILBOXES: Record<string, MailboxSystem> = {
  secret: SECRET_MAILBOX,
  bitschuppen: BITSCHUPPEN,
  datenkeller: DATENKELLER,
};

/** Fiktives Telefonbuch: Nummer → Ziel. Keine Nummer wird jemals real gewählt. */
export const PHONEBOOK: Record<string, { kind: 'person' | 'carrier'; id: string }> = {
  [GAME_CONFIG.ralf.phoneNumber]: { kind: 'person', id: 'ralf' },
  [N.phoneNumber]: { kind: 'carrier', id: 'secret' },
  [BS.phoneNumber]: { kind: 'carrier', id: 'bitschuppen' },
  [DK.phoneNumber]: { kind: 'carrier', id: 'datenkeller' },
};

function pad(s: string, n: number): string {
  return (s + ' '.repeat(n)).slice(0, n);
}

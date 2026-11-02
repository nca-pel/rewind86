/**
 * Cracker-Szene (reiner Zeitvertreib, hat mit dem Agentenstrang um Seidel nichts zu tun):
 * - FLUX-HQ: Mailbox der Gruppe FLUX mit News und kleinen Demo-Effekten zum Herunterladen.
 * - STARDUST BBS: Mailbox mit Chat. Dort sitzt der Cracker RASTAR, mit dem sich Jan über Demos, Effekte
 *   und neue Releases unterhalten kann. Er nennt Effekte, die Jan in BASIC eintippen kann; der C64 zeigt sie
 *   dann wirklich (animiertes BASIC mit WAIT 53265,128 als Bildtakt).
 * Persona und Gesprächsregeln: docs/STORY_CRACKER.md. Die Antwortlogik steht in engine/cracker.ts.
 */
import { GAME_CONFIG } from './config';
import type { Condition, GameEffect } from '../engine/types';
import type { MailboxSystem } from './networks';

const FX = GAME_CONFIG.mailboxes.fluxhq;
const SD = GAME_CONFIG.mailboxes.stardust;

// ---------------------------------------------------------------------------- Effekte (BASIC)

export interface CrackerEffect {
  id: string;
  /** Anzeigename im Gespräch */
  name: string;
  /** Wörter, mit denen Jan den Effekt anspricht (normalisiert, ohne Umlaute) */
  match: RegExp;
  /** Einleitung, Listing (jede Zeile höchstens 38 Zeichen) und Schlusssatz */
  intro: string;
  listing: string[];
  outro: string;
}

/** Bildtakt: WAIT 53265,128 wartet am Original auf die Rasterzeile – im Spiel endet damit ein Animationsbild. */
export const CRACKER_EFFECTS: CrackerEffect[] = [
  {
    id: 'sinus',
    name: 'SINUS-SCROLLER',
    match: /(SINUS|SCROLL|LAUFSCHRIFT)/,
    intro:
      'DER SINUS-SCROLLER IST DAS ERSTE, WAS JEDE INTRO HAT: EIN TEXT, DER DURCHS BILD WELLT. IN BASIC GEHT DAS LANGSAM, ABER ER LAEUFT. ES SIND NEUN ZEILEN:',
    listing: [
      '10 T$="STARDUST GRUESST DEN CLUB   "',
      '20 L=LEN(T$)',
      '30 WAIT 53265,128:PRINT CHR$(147)',
      '40 FOR X=0 TO 38:P=X+T',
      '50 P=P-L*INT(P/L)',
      '60 A=1024+INT(12+8*SIN(X/4+T/3))*40+X',
      '70 POKE A,ASC(MID$(T$,P+1,1)) AND 63',
      '80 POKE A+54272,2+(X AND 7):NEXT',
      '90 T=T+1:GOTO 30',
    ],
    outro:
      'ERSETZ DEN TEXT IN ZEILE 10 DURCH DEINEN EIGENEN, NUR GROSSBUCHSTABEN. DIE 8 IN ZEILE 60 IST DIE WELLENHOEHE.',
  },
  {
    id: 'balken',
    name: 'FARBBALKEN',
    match: /(BALKEN|BORDER|RAHMEN|FLACKER)/,
    intro:
      'OKAY, DER KLASSIKER: DER RAHMEN WECHSELT JEDES BILD DIE FARBE. IN ASSEMBLER MACHT MAN DAS PRO RASTERZEILE, IN BASIC MUSST DU MIT EINER FARBE PRO BILD LEBEN. TIPP DAS EIN:',
    listing: ['10 FOR I=0 TO 15:POKE 53280,I', '20 POKE 53281,15-I:WAIT 53265,128', '30 NEXT:GOTO 10'],
    outro: 'DANN RUN. MIT RUN/STOP (ESC) HOERT ES AUF. DIE ZAHL 53280 IST DER RAHMEN, 53281 DER HINTERGRUND.',
  },
  {
    id: 'welle',
    name: 'FARBWELLE',
    match: /(WELLE|PLASMA|FARBLAUF|REGENBOGEN)/,
    intro:
      'EINE FARBWELLE IST EIN POOR-MANS-PLASMA. DU FUELLST DEN BILDSCHIRM MIT BLOECKEN UND VERSCHIEBST NUR DEN FARB-RAM. WENIG CODE, SIEHT GUT AUS. TIPP:',
    listing: [
      '10 PRINT CHR$(147)',
      '20 FOR I=0 TO 999:POKE 1024+I,160:NEXT',
      '30 FOR I=0 TO 999',
      '40 POKE 55296+I,(I+T) AND 15:NEXT',
      '50 T=T+1:WAIT 53265,128:GOTO 30',
    ],
    outro:
      'DER FARB-RAM BEGINNT BEI 55296. DAS AND 15 HAELT DIE FARBE ZWISCHEN 0 UND 15. PROBIER ES MIT 7 ODER 3 FUER ANDERE MUSTER!',
  },
];

// ---------------------------------------------------------------------------- FLUX-HQ

export const FLUXHQ: MailboxSystem = {
  id: 'fluxhq',
  name: FX.name,
  phoneNumber: FX.phoneNumber,
  baud: 300,
  access: 'public',
  sysop: FX.sysop,
  hours: FX.hours,
  validateAfterMinutes: FX.validateAfterMinutes,
  historicalStatus: 'fictional',
  welcome: [`>>> ${FX.name} <<<`, 'THE CRACKING CREW FLUX', `SYSOP: ${FX.sysop}`, 'NEWS - DEMOS - RELEASES'],
  boards: [
    {
      id: 'news',
      name: 'FLUX NEWS',
      minStatus: 'gast',
      messages: [
        {
          id: 'fx_welcome',
          from: FX.sysop,
          to: 'ALLE',
          subject: 'WILLKOMMEN BEI FLUX',
          encrypted: false,
          body: [
            'HIER SITZT FLUX. WIR MACHEN INTROS,',
            'DEMOS UND SAMMELN DIE BESTEN',
            'EFFEKTE. LEECHER BITTE EIN DEMO',
            'ZURUECKLASSEN. NUR ORIGINAL-',
            'SPIELE-NEWS, KEINE WARE HIER!',
          ],
          effects: [],
        },
        {
          id: 'fx_news1',
          from: FX.sysop,
          to: 'ALLE',
          subject: 'NEWS KW 46',
          encrypted: false,
          body: [
            'URIDIUM IST DA. DIE INTRO VOM',
            'GEGNER HAT 3 SCROLLER GLEICHZEITIG',
            'UND EINEN FARBBALKEN IM RAND.',
            'WIR SIND NEIDISCH. NEXT WEEK',
            'KOMMT UNSER ANSWER: EIN RASTER-',
            'TUNNEL. STAY TUNED.',
          ],
          effects: [],
        },
        {
          id: 'fx_news2',
          from: 'MONKEY',
          to: 'ALLE',
          subject: 'MUSIK',
          encrypted: false,
          body: [
            'HUBBARD HAT WIEDER ZUGESCHLAGEN.',
            'DIE TITELMUSIK VON COMMANDO LAEUFT',
            'BEI MIR SEIT TAGEN IN DER SCHLEIFE.',
            'MEIN VATER BITTET UM RUHE. ER',
            'BITTET AUCH UM MEHR LAUTSTAERKE.',
          ],
          effects: [],
        },
        {
          id: 'fx_stardust',
          from: FX.sysop,
          to: 'ALLE',
          subject: 'BOX-TIPP: STARDUST',
          encrypted: false,
          body: [
            'WER GERNE QUATSCHT: IM STARDUST BBS',
            `(${SD.phoneNumber}, AB ${SD.hours.from} UHR) GIBT ES`,
            'EINEN CHAT. DORT SITZT RASTAR,',
            'DER WEISS ALLES UEBER EFFEKTE.',
            'GRUESS IHN VON FLUX.',
          ],
          effects: [{ type: 'discoverFact', id: 'bbs_stardust' }],
        },
        {
          id: 'fx_news3',
          from: FX.sysop,
          to: 'ALLE',
          subject: 'NEWS KW 47',
          encrypted: false,
          when: { timeAfter: '1986-11-18T12:00' },
          body: [
            'FLUX-DEMO #4 IST FERTIG: EIN STERNEN-',
            'HIMMEL MIT 3 EBENEN UND TEXT.',
            'IN DEN DATEIEN ALS STERNE.',
            'BEI MIR LAEUFT ES AUF DEM 1541',
            'ZUM ERSTEN MAL OHNE LADEFEHLER.',
          ],
          effects: [],
        },
      ],
    },
    {
      id: 'scene',
      name: 'SZENE-TRATSCH',
      minStatus: 'gast',
      messages: [
        {
          id: 'fx_scene1',
          from: 'MONKEY',
          to: 'ALLE',
          subject: 'ROT GEGEN GRUEN',
          encrypted: false,
          body: [
            'WER HAT DEN SCHOENSTEN RAHMEN?',
            'MEIN SCHWAGER MEINT, JEDES DEMO',
            'FLACKERT. ICH SAGE: DAS IST KUNST.',
          ],
          effects: [],
        },
        {
          id: 'fx_scene2',
          from: 'TEXI',
          to: 'MONKEY',
          subject: 'RE: ROT GEGEN GRUEN',
          encrypted: false,
          body: ['ES SIND 38 MARK FUER DIE TELEFON-', 'RECHNUNG, MONKEY. DAS IST KUNST.'],
          effects: [],
        },
        {
          id: 'fx_scene3',
          from: 'DUSTY',
          to: 'ALLE',
          subject: 'AMIGA?',
          encrypted: false,
          when: { timeAfter: '1986-11-16T18:00' },
          body: [
            'DER AMIGA 1000 HAT 4096 FARBEN.',
            'MEIN C64 HAT 16. ICH HAB ALSO',
            'ZUMINDEST DIE BESSEREN AUSREDEN.',
          ],
          effects: [],
        },
      ],
    },
  ],
  downloads: [
    {
      name: 'STERNE',
      blocks: 3,
      description: 'STERNENHIMMEL, 3 EBENEN',
      basic: [
        '10 PRINT CHR$(147)',
        '20 DIM X(30),V(30)',
        '30 FOR I=0 TO 30:X(I)=INT(RND(1)*1000):V(I)=1+INT(RND(1)*3):NEXT',
        '40 REM EIN STERN = EIN PUNKT; LANGSAME STERNE SIND WEIT WEG',
        '50 WAIT 53265,128',
        '60 FOR I=0 TO 30',
        '70 POKE 1024+X(I),32',
        '80 X(I)=X(I)+V(I)*40:IF X(I)>999 THEN X(I)=X(I)-1000',
        '90 POKE 1024+X(I),46:POKE 55296+X(I),5+V(I)*3',
        '100 NEXT:GOTO 50',
      ],
    },
    {
      name: 'BALKEN',
      blocks: 2,
      description: 'RANDBALKEN, 16 FARBEN',
      basic: [
        '10 PRINT CHR$(147);"FLUX BALKEN"',
        '20 FOR I=0 TO 15',
        '30 POKE 53280,I:POKE 53281,15-I',
        '40 WAIT 53265,128',
        '50 NEXT:GOTO 20',
      ],
    },
    {
      name: 'FLUX-INTRO',
      blocks: 6,
      description: 'MINI-INTRO MIT LAUFSCHRIFT',
      basic: [
        '10 PRINT CHR$(147):POKE 53280,0:POKE 53281,0',
        '20 T$="                    FLUX PRAESENTIERT: DAS WARTEN HAT EIN ENDE   GREETINGS AN STARDUST, MONKEY, TEXI UND MUTTI   "',
        '30 L=LEN(T$):S=0',
        '40 WAIT 53265,128',
        '50 FOR X=0 TO 39:P=X+S:P=P-L*INT(P/L)',
        '60 POKE 1024+X+400,ASC(MID$(T$,P+1,1)) AND 63',
        '70 POKE 55296+X+400,2+((X+S) AND 7)',
        '80 POKE 1024+X+520,160:POKE 55296+X+520,1+((X-S) AND 7)',
        '90 NEXT',
        '100 POKE 53280,(S AND 15):S=S+1:GOTO 40',
      ],
    },
  ],
  replies: [],
  memberMail: {
    from: FX.sysop,
    subject: 'WILLKOMMEN IM CLUB',
    body: [
      'DU DARFST JETZT LADEN.',
      'FLUX GRUESST DICH.',
      'GIB NICHTS WEITER, WAS NICHT FUER',
      'DIE OEFFENTLICHKEIT IST.',
    ],
  },
  sysinfo: [`SYSTEM  : ${FX.name}`, `SYSOP   : ${FX.sysop}`, `ZEITEN  : ${FX.hours.from}-${FX.hours.to}`],
  sysinfoEffects: [],
};

// ---------------------------------------------------------------------------- STARDUST BBS

export const STARDUST: MailboxSystem = {
  id: 'stardust',
  name: SD.name,
  phoneNumber: SD.phoneNumber,
  baud: 300,
  access: 'public',
  sysop: SD.sysop,
  hours: SD.hours,
  validateAfterMinutes: SD.validateAfterMinutes,
  historicalStatus: 'fictional',
  welcome: [
    `>>> ${SD.name} <<<`,
    'STAR GROUP - DEMOS - SZENE',
    `SYSOP: ${SD.sysop}`,
    'CHAT MIT RASTAR: MENUE 6',
  ],
  chat: { handle: 'RASTAR' },
  boards: [
    {
      id: 'stern',
      name: 'STERNENSTAUB',
      minStatus: 'gast',
      messages: [
        {
          id: 'sd_hallo',
          from: SD.sysop,
          to: 'ALLE',
          subject: 'ZUM CHAT',
          encrypted: false,
          body: [
            'RASTAR IST FAST IMMER DA, WENN DIE',
            'BOX AUF IST. ER BEISST NICHT,',
            'SOLANGE MAN KEINE RAUBKOPIE-',
            'LISTEN VON IHM VERLANGT.',
          ],
          effects: [],
        },
        {
          id: 'sd_demo',
          from: 'RASTAR',
          to: 'ALLE',
          subject: 'EFFEKT DES MONATS',
          encrypted: false,
          body: [
            'DER BALKEN-TRICK MIT WAIT 53265',
            'GEHT AUCH IN BASIC! FRAGT MICH IM',
            'CHAT NACH FARBBALKEN, FARBWELLE',
            'UND SINUS-SCROLLER. ICH DIKTIERE',
            'EUCH DIE ZEILEN.',
          ],
          effects: [],
        },
        {
          id: 'sd_release',
          from: SD.sysop,
          to: 'ALLE',
          subject: 'RELEASES 11/86',
          encrypted: false,
          body: [
            'NEU: ELITE-VERSION ZWEI IM TEST,',
            'SPY-VS-SPY-CRACK MIT TRAINER,',
            'GHOSTS-N-GOBLINS-INTRO VON FLUX.',
            'SOLL JEDER SELBST BEURTEILEN.',
          ],
          effects: [],
        },
      ],
    },
  ],
  downloads: [],
  replies: [],
  sysinfo: [`SYSTEM  : ${SD.name}`, `SYSOP   : ${SD.sysop}`, `ZEITEN  : ${SD.hours.from}-${SD.hours.to}`],
  sysinfoEffects: [],
};

// ---------------------------------------------------------------------------- Persona RASTAR

/**
 * RASTAR (Rico, 17, Elektroniker-Azubi in Bielefeld, Gruppe STARDUST): Grafiker und Coder, mag Rasterbalken,
 * Hubbard-Musik und Uridium. Spart auf einen Amiga. Telefonrechnung ist sein Dauerthema. Redet in
 * Szene-Jargon (»krass«, »Lamer«, »greets«), duzt jeden, ist neugierig, ehrlich und ein bisschen angeberisch.
 * Er weiß nichts von Seidel, K-01 oder dem Netz; darauf antwortet er nur mit Ahnungslosigkeit.
 */
export interface Intent {
  id: string;
  /** Gegen den normalisierten Text (Großbuchstaben, ohne Umlaute) */
  re: RegExp;
  /** Antwortvarianten; bei jedem weiteren Treffer kommt die nächste, danach wird neu gemischt */
  replies: string[];
  effects?: GameEffect[];
  when?: Condition;
  /** Nach der Antwort angebotenes Anschlussthema (Intent-ID) */
  next?: string;
}

export const GREETINGS = [
  'HEY {NAME}! DU BIST ALSO DER NEUE. ICH BIN RASTAR, PIXELSCHIEBER BEI STARDUST. WAS GEHT?',
  'NA {NAME}, WIEDER DA? PRIMA. ICH HAB GERADE EINEN FARBBALKEN AUSGEPROBT UND BIN BREIT.',
  'MOIN {NAME}. ICH WOLLTE EH GERADE AUFHOEREN, ABER REDEN GEHT IMMER.',
];

export const INTENTS: Intent[] = [
  {
    id: 'bye',
    re: /\b(TSCHUESS|BYE|CIAO|BIS (SPAETER|MORGEN|BALD)|MUSS (WEG|LOS)|GUTE NACHT|ABMELDEN|ENDE)\b/,
    replies: [
      'OKAY, DANN BIS DANN! GRUESS DEINEN JOYSTICK VON MIR. UND DENK AN DIE TELEFONRECHNUNG.',
      'BYE! KOMM WIEDER, ICH HAB NOCH EFFEKTE IM KOPF.',
    ],
  },
  {
    id: 'hello',
    re: /\b(HALLO|HI|HEY|MOIN|SERVUS|TACH|GRUESS DICH|NABEND|GUTEN (TAG|ABEND))\b/,
    replies: [
      'HALLO! WIR HABEN DOCH SCHON GEGRUESST. FRAG MICH WAS, SONST WIRD ES ALBERN.',
      'HI HI. UND WEITER?',
    ],
  },
  {
    id: 'who',
    re: /\b(WER BIST DU|WER SIND SIE|DEIN NAME|WIE HEISST DU|STELL DICH VOR|WAS BIST DU|RASTAR)\b/,
    replies: [
      'RASTAR. ECHT HEISSE ICH RICO, ABER DAS ERZAEHLE ICH NUR LEUTEN, DIE SICH SCHON EINMAL MIT EINEM FARBBALKEN BLAMIERT HABEN. ICH BIN 17, MACHE EINE LEHRE ALS ELEKTRONIKER UND NEBENBEI GRAFIK UND CODE FUER STARDUST.',
      'ICH HEISSE RICO UND HEISSE RASTAR. BEIDES STIMMT. ICH SITZE IM KELLER BEI MEINEN ELTERN UND HABE EIN POSTER VON BOULDER DASH UEBER DEM BETT.',
    ],
    next: 'group',
  },
  {
    id: 'age',
    re: /\b(WIE ALT|ALTER|JAHRE ALT|SCHULE|LEHRE|AZUBI|BERUF|ARBEIT|JOB)\b/,
    replies: [
      'ICH BIN 17 UND MACHE EINE LEHRE ALS ELEKTRONIKER. TAGSUEBER LOETE ICH FERNSEHER, ABENDS PIXEL. DER MEISTER WEISS NICHT, DASS ICH ZWISCHENDURCH MEINEN RASTER-IRQ IM KOPF DURCHGEHE.',
      'LEHRE, 2. JAHR. DER AUSBILDER SAGT, ICH SOLL AUFHOEREN, VON SPRITES ZU TRAEUMEN. HAB ICH VERSPROCHEN. WAR GELOGEN.',
    ],
  },
  {
    id: 'group',
    re: /\b(GRUPPE|CREW|STARDUST|FLUX|KRAKEN|DUSTY|MONKEY|TEXI|SZENE|SCENE)\b/,
    replies: [
      'STARDUST SIND WIR VIER: DUSTY IST SYSOP UND ORGA, MONKEY UND ICH MACHEN CODE UND GRAFIK, TEXI IST UNSER MUSIKER. WIR HABEN SCHON ZWEI INTROS VERSCHICKT. FLUX SIND DIE ANDEREN, DIE MACHEN MEHR DEMOS, WIR MEHR EFFEKTE.',
      'DIE SZENE IST KLEIN: AM WOCHENENDE TAUSCHEN WIR PER POST DISKETTEN, UNTER DER WOCHE REDEN WIR UEBER DIE BOXEN. WER GUT IST, WIRD IN DEN GREETS GENANNT. DAS IST UNSER ORDEN.',
    ],
    next: 'demo',
  },
  {
    id: 'demo',
    re: /\b(DEMO|DEMOS|INTRO|INTROS|CRACKINTRO|VORSPANN|RELEASE|RELEASES|NEUHEIT|NEUES|NEU)\b/,
    replies: [
      'BEI DEN NEUEN RELEASES SIND DIE INTROS GERADE DAS SPANNENDSTE: URIDIUM HAT EINEN SCROLLER, DER SICH BEWEGT WIE EIN FISCH. FLUX HAT EIN STERNEN-DEMO IN DREI EBENEN. WIR ARBEITEN AN EINEM TUNNEL AUS RASTERBALKEN.',
      'DAS BESTE DEMO DER LETZTEN TAGE? GANZ KLAR DAS VON FLUX: DIE STERNE. WENN DU DAS NACHMACHEN WILLST, HOL DIR "STERNE" BEI FLUX-HQ. UND WENN DU EINEN EFFEKT SELBST TIPPEN WILLST, FRAG MICH.',
    ],
    next: 'effects',
  },
  {
    id: 'effects',
    re: /\b(EFFEKT|EFFEKTE|TRICK|TRICKS|IDEE|IDEEN|WAS KANN MAN|ZEIG MIR|BEISPIEL|PROGRAMM|LISTING|CODE|BASIC|TIPPEN|AUSPROBIEREN)\b/,
    replies: [
      'GEHT BEI MIR UM EFFEKTE, DIE DU AUCH IN BASIC SEHEN KANNST: FARBBALKEN, FARBWELLE ODER SINUS-SCROLLER. ASSEMBLER IST NATUERLICH SCHNELLER, ABER BASIC ZEIGT DIR DIE IDEE. SAG WELCHEN DU HABEN WILLST.',
      'ICH HAB DREI IM ANGEBOT: FARBBALKEN (EINFACH), FARBWELLE (MITTEL), SINUS-SCROLLER (NEUN ZEILEN). WAS DAVON?',
    ],
  },
  {
    id: 'how_fx',
    re: /\b(WIE FUNKTIONIERT|WIESO|WARUM|ERKLAER|VERSTEHE (ES )?NICHT|WIE GEHT|WAS HEISST)\b/,
    replies: [
      'DER C64 ZEICHNET 50 MAL IN DER SEKUNDE EIN BILD, UND DER RAHMEN IST NUR EIN SPEICHERPLATZ, 53280. WENN DU DA WAS REINSCHREIBST, AENDERT SICH DIE FARBE SOFORT. EIN EFFEKT IST NUR: ZAHL AENDERN, WARTEN, WIEDER AENDERN. DER REST IST FLEISS.',
      'DIE KUNST IST DAS TIMING. WAIT 53265,128 SAGT: BIS ZUR NAECHSTEN RASTERZEILE WARTEN. IN ASSEMBLER WIRD DARAUS EIN INTERRUPT, DER ZEILE FUER ZEILE DIE FARBE WECHSELT.',
    ],
  },
  {
    id: 'raster',
    re: /\b(RASTER\w*|IRQ|INTERRUPT|ZEILE FUER ZEILE)\b/,
    replies: [
      'RASTER-IRQ: DER VIC MELDET SICH BEI EINER ZEILE UND DER PROZESSOR MACHT, WAS DU IHM GESAGT HAST: FARBE WECHSELN, GRAFIK UMSCHALTEN. DAMIT BEKOMMST DU 100 BALKEN IN EINEM BILD. IN BASIC KANNST DU DAS NUR NACHSPIELEN, ABER DIE IDEE BLEIBT.',
    ],
    next: 'effects',
  },
  {
    id: 'sprite',
    re: /\b(SPRITE\w*|MULTIPLEX\w*|GEISTER|FIGUREN|OBJEKTE)\b/,
    replies: [
      'ACHT SPRITES HAT DER C64, MEHR NICHT. WER 16 ZEIGT, MULTIPLEXT: WENN DER STRAHL NACH UNTEN IST, SCHIEBT ER DEN SPRITE NACH OBEN. FUNKTIONIERT, WENN DU DEN RASTERSTRAHL IM GRIFF HAST UND NICHT SCHLAEFST.',
    ],
  },
  {
    id: 'music',
    re: /\b(MUSIK|SID|HUBBARD|DAGLISH|SOUND|LIED|MELODIE|TITELMUSIK|KOMPONIST|TEXI)\b/,
    replies: [
      'ROB HUBBARD IST GOTT. COMMANDO, MONTY ON THE RUN: DIE LAUFEN BEI MIR RAUF UND RUNTER. SOGAR MEINE MUTTER PFEIFT SIE, OBWOHL SIE SAGT, SIE HASST DAS GEPIEPSE.',
      'TEXI MACHT UNSERE MUSIK. ER SCHREIBT DIE NOTEN AUF KAESTCHENPAPIER UND TIPPT SIE ALS DATA-ZEILEN EIN. DAS DAUERT EWIG, ABER ES KLINGT NACH SID.',
    ],
  },
  {
    id: 'games',
    re: /\b(SPIEL|SPIELE|SPIELST|ZOCKEN|SPIELEN|URIDIUM|COMMANDO|ELITE|PARADROID|IMPOSSIBLE MISSION|BOULDER|SPY VS SPY|GHOSTS|SUMMER GAMES|WINTER GAMES|FERNHANDEL)\b/,
    replies: [
      'ICH SPIELE GERNE URIDIUM: NIEDRIGER FLUG UEBER DEN DREADNOUGHTS, DAS SCROLLING IST EIN WUNDER. UND PARADROID, WENN ICH GENUG NERVEN HABE. SPIELE SIND DIE EINE HAELFTE DER SZENE: DIE ANDERE SIND DIE LEUTE, DIE SIE ANGUCKEN.',
      'FERNHANDEL? HAB ICH GEHOERT, SOLL EIN HANDELSSPIEL SEIN. IST NICHT MEINS: ICH BIN EIN SCHIESSER UND BASTLER. ABER WENN JEMAND DIE ZAHLEN LIEBT, WIRD ER SICH GUT UNTERHALTEN FUEHLEN.',
    ],
  },
  {
    id: 'crack',
    re: /\b(CRACK\w*|KOPIERSCHUTZ|RAUBKOPIE\w*|KOPIEREN|KNACKEN|TRAINER|UNENDLICH LEBEN|CHEAT\w*)\b/,
    replies: [
      'CRACKEN IST FUER MICH EINE ART KNOBELN: WIE SCHUETZT SICH EIN PROGRAMM, WIE UMGEHT MAN DAS? DETAILS KRIEGST DU VON MIR NICHT, DAS IST UNSER HANDWERK. ABER EIN INTRO, DAS DIE KOPIE ZEIGT, DAS KANN JEDER LERNEN.',
      'ICH SAG DAS SO: DAS SCHOENSTE AM CRACKEN IST DIE INTRO, DIE DANN ERSCHEINT. DER REST IST NERVEN WIE BEIM ELEKTRONIKER, NUR OHNE LOETKOLBEN.',
    ],
  },
  {
    id: 'amiga',
    re: /\b(AMIGA|ATARI|ST|SCHNEIDER|CPC|SPECTRUM|PC|IBM|MSX|C 128|C128|C16|VC 20)\b/,
    replies: [
      'DER AMIGA 1000 HAT 4096 FARBEN UND EINEN PROZESSOR, DER MIR DIE TRAENEN IN DIE AUGEN TREIBT. ER KOSTET ABER 5000 MARK. DAS IST EIN LEHRLINGSGEHALT VON ZWOELF MONATEN. ICH SPARE.',
      'ATARI ST? ICH WAERE NICHT BOESE, ABER DIE FARBEN SIND MIR ZU FLACH. C64 IST MEINE LIEBE. DER ATMET WENIGSTENS.',
    ],
  },
  {
    id: 'phone',
    re: /\b(TELEFON\w*|RECHNUNG|GEBUEHR\w*|TELEKOM|POST|POSTAMT|ANRUF\w*|TAKT|KOSTEN|VATER|MUTTER|ELTERN)\b/,
    replies: [
      'DIE TELEFONRECHNUNG! MEIN VATER SAGT, DER ZAEHLER LAEUFT WIE BEI DER BUNDESBAHN. ICH CHATTE JETZT NUR NOCH ZWISCHEN ZEHN UND ELF, WEIL DANN DIE ELTERN SCHLAFEN. WENN DU ANRUFST, ACHTE AUF DEN ZAEHLER!',
      'MEINE MUTTER STELLT MANCHMAL DAS TELEFON AB, WENN ICH ZU LANGE BIN. DANN SITZE ICH DA UND BIN AUF EINMAL OFFLINE UND ALLES IST EINE SEKUNDE LANG STILL. DAS IST DER SCHLIMMSTE MOMENT.',
    ],
  },
  {
    id: 'drive',
    re: /\b(1541|FLOPPY|LAUFWERK|DISKETTE|DATASETTE|KASSETTE|LADEZEIT|FASTLOAD\w*|TURBO\w*|LADEN)\b/,
    replies: [
      'DIE 1541 IST EIN SCHNECKENHAUS. DREI MINUTEN FUER EIN SPIEL. EINEN FASTLOADER SCHREIBE ICH ZUM ZEITVERTREIB, ABER SOBALD ICH IHN DEBUGGT HABE, WILL ICH EINEN NEUEN. DAS IST DER KREISLAUF DES LEBENS.',
      'MEINE 1541 SURRT SO LAUT, DASS MEINE MUTTER DENKT, ICH HAETTE EINE NAEHMASCHINE IM KELLER.',
    ],
  },
  {
    id: 'joystick',
    re: /\b(JOYSTICK|STEUERKNUEPPEL|QUICKSHOT|COMPETITION PRO|TASTATUR|KEYBOARD)\b/,
    replies: [
      'MEIN JOYSTICK IST EIN QUICKSHOT UND HAT SCHON ZWEI MAL GELOETET WERDEN MUESSEN. ICH BIN ELEKTRONIKER, ICH DARF DAS.',
    ],
  },
  {
    id: 'school',
    re: /\b(KLASSENARBEIT|HAUSAUFGABEN|LEHRER|MATHE|KLASSE|PAUSE|ABITUR)\b/,
    replies: [
      'SCHULE IST BEI MIR ZWEI JAHRE HER. DER VORTEIL: JETZT BEZAHLEN SIE MICH DAFUER, DASS ICH FERNSEHER AUFSCHRAUBE. DER NACHTEIL: ICH HABE WENIGER ZEIT FUER INTROS.',
    ],
  },
  {
    id: 'club',
    re: /\b(COMPUTERCLUB|CLUB|JUGENDZENTRUM|BTX|BILDSCHIRMTEXT)\b/,
    replies: [
      'EIN COMPUTERCLUB? KRASS. BEI UNS IN BIELEFELD GIBT ES NUR DEN SCHACHVEREIN. ICH BIN SOGAR DORT GEWESEN UND HAB EINEN AUSDRUCK MITGENOMMEN. SOLL ICH EUCH ETWAS AUFSCHREIBEN?',
    ],
  },
  {
    id: 'opsec',
    re: /\b(SEIDEL|K 01|K01|KNOTEN|OPERATION|REWIND|AGENT\w*|GEHEIM\w*|STASI|DDR|BND|VERSCHLUESSEL\w*|CHIFFR\w*|KGB|SPION\w*)\b/,
    replies: [
      'KEINE AHNUNG, WOVON DU REDEST. ICH MACHE GRAFIK UND SO. WENN DU GEHEIMDIENST SPIELEN WILLST, SUCH DIR EINE ANDERE BOX. HIER GEHT ES NUR UM FARBBALKEN.',
      'DAS IST NICHT MEINE ABTEILUNG. ICH BIN DER MIT DEN PIXELN, NICHT DER MIT DEN ZAHLEN. ERZAEHL MIR LIEBER, WAS DU AM LIEBSTEN SPIELST.',
    ],
  },
  {
    id: 'thanks',
    re: /\b(DANKE|DANKESCHOEN|DANKE DIR|TOLL|SUPER|GEIL|KRASS|GENIAL|COOL|KLASSE|LAEUFT|KLAPPT|FUNKTIONIERT|HAT GEKLAPPT|WOW)\b/,
    replies: [
      'GERN! FREUT MICH, DASS ES KLAPPT. JETZT BIST DU OFFIZIELL MEIN ERSTER SCHUELER.',
      'SEHR GUT. ABER KEIN GRUND, ZU SCHWAERMEN: DAS WAR NUR EIN HAUCH VON DEM, WAS IN ASSEMBLER GEHT.',
      'FREUT MICH. FRAG MICH GERNE NACH DEM NAECHSTEN, WENN DU WILLST.',
    ],
    next: 'effects',
  },
  {
    id: 'trouble',
    re: /\b(GEHT NICHT|FEHLER|ERROR|SYNTAX|FUNKTIONIERT NICHT|KLAPPT NICHT|NICHTS PASSIERT|ABSTURZ|HAENGT|FALSCH|VERTIPPT|UNDEFINED|BREAK)\b/,
    replies: [
      'SYNTAX ERROR HEISST MEIST: VERTIPPT. SCHAU DIR DIE ZEILE GENAU AN, ALLE ZEICHEN, ALLE DOPPELPUNKTE. LIST ZEIGT DIR DAS PROGRAMM. AM BESTEN ZEILE FUER ZEILE VERGLEICHEN.',
      'WENN GAR NICHTS PASSIERT: HAST DU RUN GETIPPT? UND MIT RUN/STOP BRICHT MAN AB. SONST NEW, UND VON VORN. DAS IST KEINE SCHANDE, DAS MACHT JEDER.',
    ],
  },
  {
    id: 'lamer',
    re: /\b(DUMM\w*|BLOED\w*|IDIOT\w*|SCHEISS\w*|DOOF\w*|LAME\w*|LAMER\w*|QUATSCH|HALT DIE KLAPPE)\b/,
    replies: [
      'HEY, NICHT SO. WENN DU DICH STREITEN WILLST, SUCH DIR EINEN ANDEREN AUS. ICH BIN HIER FUER EFFEKTE.',
      'DAS REICHT. NOCH EIN SOLCHES WORT UND ICH LASSE DEN KANAL ZU.',
    ],
  },
  {
    id: 'bored',
    re: /\b(LANGWEILIG|LANGEWEILE|NICHTS (ZU TUN|LOS)|FAD|MUEDE|SCHLAFEN|ZEIT)\b/,
    replies: [
      'LANGEWEILE IST DER BESTE ANTRIEB. DESHALB HABE ICH DAS ERSTE MAL EINEN FARBBALKEN GEMACHT. DU KANNST HEUTE ANFANGEN.',
    ],
    next: 'effects',
  },
  {
    id: 'weather',
    re: /\b(WETTER|REGEN|SCHNEE|KALT|WARM|NEBEL|HERBST|WINTER)\b/,
    replies: [
      'WETTER IST BEI MIR ZWEITRANGIG: ICH SITZE IM KELLER. HAUPTSACHE, ES REGNET NICHT AUF DIE LEITUNG.',
    ],
  },
  {
    id: 'music_taste',
    re: /\b(LIEBLINGSBAND|BAND|RADIO|NENA|FALCO|DEPECHE MODE|KRAFTWERK|SCORPIONS|POP|ROCK|HOEREN)\b/,
    replies: [
      'KRAFTWERK, KLAR. DIE HABEN DAS GERAEUSCH VOM C64 VORAUSGEAHNT. UND FALCO FUER DIE LAUNE. DEPECHE MODE, WENN ICH LOETEN MUSS.',
    ],
  },
  {
    id: 'compliment',
    re: /\b(DU BIST (GUT|KLASSE|STARK|COOL|SCHLAU)|RESPEKT|BEEINDRUCKT)\b/,
    replies: ['ICH HAB ES GERNE GEHOERT. DANKE, DAS TUT GUT NACH EINEM TAG LOETKOLBEN.'],
  },
  {
    id: 'location',
    re: /\b(WOHER|WO WOHNST|WOHNORT|STADT|BIELEFELD|GUETERSLOH|GT|OWL)\b/,
    replies: [
      'ICH KOMME AUS BIELEFELD. ICH WOHNE IM KELLER. DIE LEITUNG IST MIT EINEM ANDEREN HAUS GETEILT, DESWEGEN KNACKT ES MANCHMAL.',
    ],
  },
  {
    id: 'yes',
    re: /^(JA|JO|JAWOHL|KLAR|GERNE|OKAY|OK|NA KLAR|MACH|BITTE)\b/,
    replies: ['PERFEKT. DANN SAG MIR, WELCHEN: FARBBALKEN, FARBWELLE ODER SINUS-SCROLLER?'],
  },
  {
    id: 'no',
    re: /^(NEIN|NE|NOE|NICHT|LIEBER NICHT)\b/,
    replies: ['KEIN PROBLEM. WIR KOENNEN AUCH EINFACH QUATSCHEN. WAS HAST DU ZULETZT GESPIELT?'],
  },
];

export const FALLBACKS_Q = [
  'GUTE FRAGE. DA WEISS ICH ZU WENIG DRUEBER, ABER ICH KENNE SICHER JEMANDEN. WOLLEN WIR LIEBER UEBER EFFEKTE REDEN?',
  'HM. DAS MUSS ICH ERST MAL AUSPROBIEREN. ERZAEHL DU MIR ERST, WAS DU SELBST DENKST.',
  'WEISS ICH NICHT. ABER ICH WEISS, WIE MAN EINEN RAND ROT KRIEGT. WILLST DU DAS HOEREN?',
];

export const FALLBACKS = [
  'JA, KANN SEIN. ERZAEHL MEHR.',
  'AHA. UND WAS SAGT DEIN C64 DAZU?',
  'DAS KANN ICH MIR VORSTELLEN. ICH HAB GERADE EINEN KRAMPF IN DEN FINGERN.',
  'HM. ICH TIPPE GERADE NEBENHER ETWAS. WAS MEINTEST DU?',
  'OKAY. ICH GLAUBE, WIR HABEN BEIDE KEINE AHNUNG, WORUM ES GEHT. FRAG MICH LIEBER NACH EFFEKTEN.',
];

/** Für »ICH HABE / MAG / SPIELE / BIN …«: eine Echo-Antwort, damit auch Unvorhergesehenes eine Reaktion bekommt */
export const ECHO: Array<{ re: RegExp; reply: (m: string) => string }> = [
  {
    re: /\bICH MAG (.{2,24})/,
    reply: (m) => `${m}? DAS MAG ICH AUCH, GLAUB ICH. ERZAEHL MAL, WAS DARAN SO GUT IST.`,
  },
  {
    re: /\bICH SPIELE (.{2,24})/,
    reply: (m) => `${m}? DAS HAB ICH NOCH NIE RICHTIG GESPIELT. HAT ES EINE GUTE INTRO?`,
  },
  {
    re: /\bICH HABE? (.{2,24})/,
    reply: (m) => `${m}? KRASS. DAS HAETTE ICH AUCH GERNE. ODER ZUMINDEST BEKOMMEN.`,
  },
  { re: /\bICH BIN (.{2,24})/, reply: (m) => `${m}? NA DANN SIND WIR ZWEI: ICH BIN RASTAR.` },
  { re: /\bICH MACHE? (.{2,24})/, reply: (m) => `${m}? INTERESSANT. WIE LANGE SCHON?` },
];

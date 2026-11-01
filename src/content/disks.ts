import type { VirtualDisk } from '../engine/types';
import { GAME_CONFIG } from './config';

const B = GAME_CONFIG.unreleasedGame.buildCode;
const NUM = GAME_CONFIG.secretNetwork.phoneNumber;
const KEY = GAME_CONFIG.keyStrand.parts;

/** PETSCII-Steuercodes: Textfarbe Blau (= Hintergrund beim Einschalten) bzw. Hellblau */
const BLUE = '\x1f';
const LIGHT_BLUE = '\x9a';

/** Ziffern der Ersatzwahl als PETSCII-Codes (48 = "0"). */
export const ACCESS_DATA_CODES = [...NUM].map((d) => d.charCodeAt(0));

/**
 * BASIC-Lader auf Ralfs Kopie. Die DATA-Zeile ist das erste Rätsel (P04).
 * Zeile 70 versteckt Schlüsselteil 1 (P08): Ein Farbcode in der REM-Zeile schaltet beim LIST auf Blau –
 * auf dem blauen Standardhintergrund unsichtbar. Seidel selbst arbeitet mit schwarzem Hintergrund (Zeile 20).
 */
export const LOADER_LINES = [
  `10 REM *** ${B} LADER ***`,
  '20 POKE 53280,0:POKE 53281,0',
  `30 PRINT CHR$(147);"${B} ARBEITSVERSION"`,
  '40 PRINT "NICHT ZUR WEITERGABE!":PRINT',
  '50 IF A=0 THEN A=1:PRINT "LADE SPIEL.07 ...":LOAD "SPIEL.07",8,1',
  '60 SYS 2064',
  `70 REM ${BLUE}K-SCHLUESSEL TEIL 1/3: ${KEY[0]}${LIGHT_BLUE}`,
  '900 REM ERSATZWAHL (NUR TEST)',
  `910 DATA ${ACCESS_DATA_CODES.join(',')}`,
];

export const INITIAL_DISKS: Record<string, VirtualDisk> = {
  game: {
    id: 'game',
    header: `${B} ARBEITSK.`,
    diskId: 'MS',
    writeProtected: true,
    blocksTotal: 664,
    files: [
      { name: 'LADER', type: 'PRG', blocks: 2, basic: LOADER_LINES },
      { name: 'SPIEL.07', type: 'PRG', blocks: 161, basic: ['10 SYS2064'], appId: 'wt07' },
      {
        name: 'DATEN.07',
        type: 'SEQ',
        blocks: 23,
        textContent: 'DATEN VERSCHLUESSELT - ZUGRIFF NUR MIT SCHLUESSELDISKETTE.',
      },
    ],
  },
  demo1001: {
    id: 'demo1001',
    header: '1001 FIGHTERS',
    diskId: '86',
    writeProtected: false,
    blocksTotal: 664,
    files: [
      { name: 'INTRUDER', type: 'PRG', blocks: 118, basic: ['1986 SYS2061'], appId: 'intruder' },
      { name: '----------------', type: 'DEL', blocks: 0 },
      { name: 'GREETINGS', type: 'SEQ', blocks: 3, textContent: 'GREETINGS TO ALL DEMO-FREAKS!' },
    ],
  },
  archive: {
    id: 'archive',
    header: 'JANS ARCHIV',
    diskId: 'JK',
    writeProtected: false,
    blocksTotal: 664,
    files: [
      { name: 'ARCHIV', type: 'PRG', blocks: 31, basic: ['10 SYS2061'], appId: 'archive' },
      { name: 'ARCHIV.DAT', type: 'SEQ', blocks: 12 },
      { name: 'TERMINAL', type: 'PRG', blocks: 22, basic: ['10 SYS2061'], appId: 'term' },
      {
        name: 'HALLO',
        type: 'PRG',
        blocks: 1,
        basic: ['10 PRINT "HALLO RALF!"', '20 FOR I=1 TO 3', '30 PRINT "C64 RULEZ ";I', '40 NEXT I'],
      },
    ],
  },
  key: {
    id: 'key',
    header: 'SCHLUESSEL',
    diskId: '??',
    writeProtected: true,
    blocksTotal: 664,
    files: [], // TODO-STORY: Inhalt der Schlüsseldiskette offen (GDD §7.5 / §22.6)
  },
};

/** Ralfs Fund aus Seidels Sperrmüllkarton: Datasette-Kassette mit einem kurzen BASIC-Programm (P08, Teil 3). */
export const CASSETTE_PROGRAM = {
  name: 'PRUEFBAND3',
  basic: [
    `10 REM ${B} PRUEFBAND`,
    '20 PRINT CHR$(147);"PRUEFBAND - NUR INTERN"',
    `30 PRINT:PRINT "K-SCHLUESSEL TEIL 3/3:";`,
    `40 T=${Number(KEY[2]) / 2}*2:PRINT T`,
    '50 PRINT:PRINT "BAND NACH GEBRAUCH LOESCHEN!"',
  ],
};

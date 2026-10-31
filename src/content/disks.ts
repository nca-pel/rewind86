import type { VirtualDisk } from '../engine/types';
import { GAME_CONFIG } from './config';

const B = GAME_CONFIG.unreleasedGame.buildCode;
const NUM = GAME_CONFIG.secretNetwork.phoneNumber;

/** Ziffern der Ersatzwahl als PETSCII-Codes (48 = "0"). */
export const ACCESS_DATA_CODES = [...NUM].map((d) => d.charCodeAt(0));

/** BASIC-Lader auf Ralfs Kopie. Die DATA-Zeile ist das erste Rätsel (P04). */
export const LOADER_LINES = [
  `10 REM *** ${B} LADER ***`,
  '20 POKE 53280,0:POKE 53281,0',
  `30 PRINT CHR$(147);"${B} ARBEITSVERSION"`,
  '40 PRINT "NICHT ZUR WEITERGABE!":PRINT',
  '50 IF A=0 THEN A=1:PRINT "LADE SPIEL.07 ...":LOAD "SPIEL.07",8,1',
  '60 SYS 2064',
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
        textContent: 'TODO-STORY: Inhalt verschlüsselt, Bedeutung offen.',
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

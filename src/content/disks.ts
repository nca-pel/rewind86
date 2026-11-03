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

/** Schwer: Fragment ohne Teilnummer – die Reihenfolge der drei Teile muss man selbst herausfinden. */
export const LOADER_LINES_HARD = LOADER_LINES.map((l) =>
  l.startsWith('70 REM') ? `70 REM ${BLUE}K-SCHLUESSEL: ${KEY[0]}${LIGHT_BLUE}` : l,
);

/** Fünferpack in Jans Schublade: fabrikneu und unformatiert, bis `N0:NAME,ID` sie beschreibbar macht. */
export const BLANK_DISKS: Record<string, VirtualDisk> = Object.fromEntries(
  ['new1', 'new2', 'new3', 'new4', 'new5'].map((id) => [
    id,
    { id, header: '', diskId: '', writeProtected: false, blocksTotal: 664, files: [], formatted: false },
  ]),
);

/**
 * Gimmick: »Schneewitchen« fällt unter dem Heimcomputer-Journal hervor. Die Bilddateien (Koala-Format, 41 Blöcke,
 * Endung .KOA) sehen nach »nicht jugendfrei« aus – jedes Laden stürzt den C64 ab. Es ist nie ein Bild zu sehen.
 */
const SW_PICTURE = (name: string) => ({
  name: `${name}.KOA`,
  type: 'PRG' as const,
  blocks: 41,
  crashes: true,
});
export const SCHNEEWITCHEN_DISK: VirtualDisk = {
  id: 'sw',
  header: 'SCHNEEWITCHEN',
  diskId: 'SW',
  writeProtected: true,
  blocksTotal: 664,
  files: ['SW_ZW1', 'SW_ZW2', 'SW_ZW3', 'GRUPPE'].map(SW_PICTURE),
};

export const INITIAL_DISKS: Record<string, VirtualDisk> = {
  ...BLANK_DISKS,
  sw: SCHNEEWITCHEN_DISK,
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
    // Seidels Original (STORY_DECISIONS: Diskette 2). Im regulären Spiel bekommt Jan sie nie in die Hand –
    // sie taucht nur in den Enden auf. Liegt sie (z. B. per Entwicklerkonsole) im Laufwerk, läuft MODUL K voll.
    files: [
      {
        name: 'WAHLDATEN',
        type: 'SEQ',
        blocks: 1,
        textContent: 'DATEN VERSCHLUESSELT - NUR UEBER MODUL LESBAR.',
      },
      {
        name: 'SCHLUESSEL',
        type: 'USR',
        blocks: 1,
        textContent: 'DATEN VERSCHLUESSELT - NUR UEBER MODUL LESBAR.',
      },
    ],
  },
};

/** Ralfs Fund aus Seidels Sperrmüllkarton: Datasette-Kassette mit einem kurzen BASIC-Programm (P08, Teil 3). */
export function cassetteProgram(hard = false): { name: string; basic: string[] } {
  return {
    name: 'PRUEFBAND3',
    basic: [
      `10 REM ${B} PRUEFBAND`,
      '20 PRINT CHR$(147);"PRUEFBAND - NUR INTERN"',
      hard ? `30 PRINT:PRINT "K-SCHLUESSEL:";` : `30 PRINT:PRINT "K-SCHLUESSEL TEIL 3/3:";`,
      `40 T=${Number(KEY[2]) / 2}*2:PRINT T`,
      '50 PRINT:PRINT "BAND NACH GEBRAUCH LOESCHEN!"',
    ],
  };
}
export const CASSETTE_PROGRAM = cassetteProgram();

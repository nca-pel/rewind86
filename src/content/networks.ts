import type { GameEffect } from '../engine/types';
import { GAME_CONFIG } from './config';

const N = GAME_CONFIG.secretNetwork;
const B = GAME_CONFIG.unreleasedGame.buildCode;

export interface MailboxMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  encrypted: boolean;
  body: string[];
  effects: GameEffect[];
}

export interface MailboxSystem {
  id: string;
  name: string;
  phoneNumber: string;
  baud: number;
  /** Handle, mit dem sich ein Programm automatisch anmeldet */
  autoHandle: string;
  access: 'restricted' | 'full';
  historicalStatus: 'fictional';
  messages: MailboxMessage[];
  sysinfo: string[];
  sysinfoEffects: GameEffect[];
}

/**
 * Deterministisch erzeugte Fünfergruppen als Chiffre-Platzhalter.
 * TODO-STORY: echtes Verfahren/Klartext der Nachricht offen (GDD §13.4, §22.6).
 */
function cipherGroups(seed: number, count: number): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let x = seed;
  const groups: string[] = [];
  for (let g = 0; g < count; g++) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      x = (x * 1103515245 + 12345) % 2147483648;
      s += letters[x % 26];
    }
    groups.push(s);
  }
  const lines: string[] = [];
  for (let i = 0; i < groups.length; i += 5) lines.push(groups.slice(i, i + 5).join(' '));
  return lines;
}

export const SECRET_MAILBOX: MailboxSystem = {
  id: 'secret',
  name: N.nodeName,
  phoneNumber: N.phoneNumber,
  baud: 300,
  autoHandle: N.testHandle,
  access: 'restricted',
  historicalStatus: 'fictional',
  messages: [
    {
      id: 'msg_k01_all',
      from: N.senderHandle,
      to: 'ALLE',
      subject: '######## [VERSCHL.]',
      encrypted: true,
      body: ['SCHLUESSEL FEHLT - ROHDATEN:', '', ...cipherGroups(1986, 30), '', '-- ENDE --'],
      effects: [
        { type: 'discoverFact', id: 'encrypted_msg' },
        { type: 'changeRelationship', id: 'seidelSuspicion', delta: 2 },
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

export const MAILBOXES: Record<string, MailboxSystem> = { secret: SECRET_MAILBOX };

/** Fiktives Telefonbuch: Nummer → Ziel. Keine Nummer wird jemals real gewählt. */
export const PHONEBOOK: Record<string, { kind: 'person' | 'carrier'; id: string }> = {
  [GAME_CONFIG.ralf.phoneNumber]: { kind: 'person', id: 'ralf' },
  [N.phoneNumber]: { kind: 'carrier', id: 'secret' },
};

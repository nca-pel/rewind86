import type { ArchiveEntry } from '../engine/types';
import { GAME_CONFIG } from './config';

/** Startbestand von Jans C64-Archiv (erweiterbar, im Spielzustand gespeichert). */
export const INITIAL_ARCHIVE: ArchiveEntry[] = [
  {
    id: 'a1',
    section: 'personen',
    title: 'RALF',
    text: 'BESTER KUMPEL, FRUEHER NACHBAR. JETZT EINSTEIN-GYM. RHEDA. FUSSBALL.',
  },
  { id: 'a2', section: 'telefon', title: 'RALF', text: GAME_CONFIG.ralf.phoneNumber },
  { id: 'a3', section: 'notizen', title: 'DEMOS', text: 'INTRUDER (1001) IMMER NOCH UNSCHLAGBAR!' },
];

export const ARCHIVE_SECTIONS: Array<{ key: ArchiveEntry['section']; label: string }> = [
  { key: 'personen', label: 'PERSONEN' },
  { key: 'telefon', label: 'TELEFON' },
  { key: 'mailboxen', label: 'MAILBOXEN' },
  { key: 'nachrichten', label: 'NACHRICHTEN' },
  { key: 'notizen', label: 'NOTIZEN' },
];

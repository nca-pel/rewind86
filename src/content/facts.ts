import { GAME_CONFIG } from './config';

export type FactCategory = 'personen' | 'kanaele' | 'codes' | 'verdacht' | 'dinge';

export interface FactDef {
  id: string;
  category: FactCategory;
  text: string;
}

const C = GAME_CONFIG;

export const FACT_CATEGORIES: Record<FactCategory, string> = {
  personen: 'Personen',
  kanaele: 'Orte & Kanäle',
  codes: 'Codes & Technik',
  verdacht: 'Verdachtsmomente',
  dinge: 'Gegenstände',
};

export const FACTS: FactDef[] = [
  {
    id: 'ralf_phone',
    category: 'personen',
    text: `Ralf ist unter ${C.ralf.phoneNumber} zu erreichen – wenn er nicht gerade beim Fußball ist.`,
  },
  {
    id: 'ralf_copied_game',
    category: 'personen',
    text: 'Ralf hat heimlich ein unveröffentlichtes Spiel von einer Arbeitsdiskette seines Stiefvaters kopiert.',
  },
  {
    id: 'seidel_strict',
    category: 'personen',
    text: 'Ralfs Stiefvater Martin Seidel ist streng. Er darf von der Kopie nichts erfahren.',
  },
  {
    id: 'seidel_job',
    category: 'personen',
    text: 'Seidel entwickelt Software in Gütersloh, irgendwo im Ariolasoft-Umfeld. Er redet nie darüber.',
  },
  { id: 'ralf_training', category: 'personen', text: 'Ralf hat freitags Fußballtraining.' },
  {
    id: 'disk_label',
    category: 'dinge',
    text: `Ralfs Kopie trägt das Etikett »${C.unreleasedGame.buildCode} ARBEITSKOPIE – DISK 1«. Disk 1 – also gibt es eine zweite?`,
  },
  {
    id: 'disk_directory',
    category: 'codes',
    text: `Auf der Kopie: ein BASIC-Lader, das eigentliche Programm SPIEL.07 und eine Datei DATEN.07.`,
  },
  {
    id: 'credits_ms',
    category: 'personen',
    text: 'In den Credits des Intros steht als Programmierer nur »M.S.« – Martin Seidel?',
  },
  {
    id: 'intro_arrow',
    category: 'codes',
    text: 'Während der Credits flackert der Rahmen, und oben links blitzt ein »←« auf.',
  },
  {
    id: 'secret_mode',
    category: 'codes',
    text: `Die Taste »←« während der Credits öffnet ein verstecktes Programm: »${C.secretNetwork.moduleName}«.`,
  },
  {
    id: 'needs_disk2',
    category: 'codes',
    text: `${C.secretNetwork.moduleName} verlangt eine Schlüsseldiskette (Diskette 2). Die hast du nicht.`,
  },
  {
    id: 'test_handle',
    category: 'codes',
    text: `Das Modul arbeitet mit einer eingebauten Kennung ${C.secretNetwork.testHandle} – Typ »Testzugang«, nur Lesen.`,
  },
  {
    id: 'loader_hint',
    category: 'codes',
    text: 'Das Modul verweist für die »Ersatzwahl« auf den LADER.',
  },
  {
    id: 'data_lines',
    category: 'codes',
    text: 'Im LADER stehen am Ende DATA-Zeilen mit Zahlen zwischen 48 und 57. Zeichencodes?',
  },
  {
    id: 'chr_table',
    category: 'codes',
    text: 'Zeichentabelle im Heimcomputer-Journal: Die Codes 48 bis 57 stehen für die Ziffern 0 bis 9.',
  },
  {
    id: 'coupler_howto',
    category: 'codes',
    text: 'Akustikkoppler: Nummer am Telefon wählen, auf den Pfeifton warten, Hörer in den Koppler drücken.',
  },
  {
    id: 'access_number',
    category: 'kanaele',
    text: `Die Ersatzwahl-Nummer aus dem LADER lautet ${C.secretNetwork.phoneNumber}. Dort antwortet ein Modem.`,
  },
  {
    id: 'secret_mailbox',
    category: 'kanaele',
    text: `Hinter der Nummer steckt eine geheime Mailbox (»${C.secretNetwork.nodeName}«). ${C.secretNetwork.testHandle} kommt hinein – eingeschränkt.`,
  },
  {
    id: 'encrypted_msg',
    category: 'codes',
    text: `Rundnachricht von ${C.secretNetwork.senderHandle} an »ALLE« – komplett verschlüsselt, Fünfergruppen. Ohne Schlüssel unlesbar.`,
  },
  {
    id: 'wt07_trace',
    category: 'verdacht',
    text: `Eine Systemmeldung erwähnt die Arbeitskopie ${C.unreleasedGame.buildCode}. Das Netz hängt mit dem Spiel aus Seidels Umfeld zusammen!`,
  },
  {
    id: 'never_logged_in',
    category: 'verdacht',
    text: `${C.secretNetwork.testHandle} war laut System vorher noch nie angemeldet. Fällt das jemandem auf?`,
  },
  {
    id: 'demo_seen',
    category: 'dinge',
    text: 'INTRUDER by 1001 FIGHTERS – immer noch die beste Demo, die du kennst.',
  },
  {
    id: 'demo_border',
    category: 'codes',
    text: 'In INTRUDER läuft Text durch den Bildschirmrand, wo eigentlich nichts sein dürfte.',
  },
];

export const FACT_BY_ID: Record<string, FactDef> = Object.fromEntries(FACTS.map((f) => [f.id, f]));

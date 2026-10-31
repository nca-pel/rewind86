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
    text: 'In den Credits des Intros steht als Programmierer nur »M.S.«.',
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
    id: 'club_evening',
    category: 'personen',
    text: `Rundbrief vom Computerclub: Clubabend am Donnerstag, ${C.club.eveningDate.slice(8, 10)}.${C.club.eveningDate.slice(5, 7)}., 19 Uhr im Jugendzentrum. Die Club-Mailbox ist der ${C.mailboxes.bitschuppen.name} (Tel. ${C.mailboxes.bitschuppen.phoneNumber}).`,
  },
  {
    id: 'ralf_schedule',
    category: 'personen',
    text: 'Ralf hat dienstags, donnerstags und freitags ab halb fünf Training, samstags nach der Schule ein Spiel. Sonst ist er meist zu Hause.',
  },
  {
    id: 'ralf_knows_module',
    category: 'verdacht',
    text: 'Ralf weiß jetzt vom versteckten Modus. Hoffentlich hält er dicht.',
  },
  {
    id: 'seidel_phones',
    category: 'verdacht',
    text: 'Ralf erzählt: Seidel telefoniert seit Tagen hinter verschlossener Tür im Arbeitszimmer.',
  },
  {
    id: 'net_watch',
    category: 'verdacht',
    text: `Neue Systemmeldung im Netz: Zugriffe auf Testzugänge werden jetzt protokolliert. Jemand schaut genauer hin.`,
  },
  {
    id: 'account_locked',
    category: 'verdacht',
    text: `${C.secretNetwork.testHandle} wurde gesperrt – vorübergehend. Zu viele Zugriffe fallen auf.`,
  },
  {
    id: 'anon_call',
    category: 'verdacht',
    text: 'Ein Anruf ohne Stimme: Jemand hat zugehört und wieder aufgelegt. Zufall?',
  },
  {
    id: 'final_warning',
    category: 'verdacht',
    text: `Letzte Warnung im Netz: Bei weiteren Zugriffen mit ${C.secretNetwork.testHandle} wird der Anschluss ermittelt.`,
  },
  {
    id: 'bbs_bitschuppen',
    category: 'kanaele',
    text: `Kleinanzeige: Mailbox »${C.mailboxes.bitschuppen.name}«, Tel. ${C.mailboxes.bitschuppen.phoneNumber}, täglich ${C.mailboxes.bitschuppen.hours.from}–${C.mailboxes.bitschuppen.hours.to} Uhr. Gäste willkommen.`,
  },
  {
    id: 'bbs_member',
    category: 'kanaele',
    text: `Im ${C.mailboxes.bitschuppen.name} bist du jetzt freigeschaltet: schreiben, private Post, Downloads.`,
  },
  {
    id: 'bbs_datenkeller',
    category: 'kanaele',
    text: `Mailbox »${C.mailboxes.datenkeller.name}«, Tel. ${C.mailboxes.datenkeller.phoneNumber} – nur nachts (${C.mailboxes.datenkeller.hours.from}–${C.mailboxes.datenkeller.hours.to} Uhr).`,
  },
  {
    id: 'hidden_text',
    category: 'codes',
    text: 'Lesertipp: Farbcodes in REM-Zeilen können Text beim LIST unsichtbar machen (Schrift = Hintergrundfarbe). Hintergrund ändern: POKE 53281,<Farbe>.',
  },
  {
    id: 'empty_rem',
    category: 'codes',
    text: 'Im LADER steht in Zeile 70 ein REM, hinter dem scheinbar nichts kommt.',
  },
  {
    id: 'key_leak',
    category: 'verdacht',
    text: `Systemmeldung »SCHLUESSELWECHSEL«: eigentlich nur für ${C.secretNetwork.senderHandle}, aber an ALLE verteilt. Der Schlüssel besteht aus drei Teilen – einer steckt auf der Arbeitskopie, einer kommt »per Band«.`,
  },
  {
    id: 'key_part_1',
    category: 'codes',
    text: `Schlüsselteil 1/3: ${C.keyStrand.parts[0]} (unsichtbar im LADER, Zeile 70).`,
  },
  {
    id: 'key_part_2',
    category: 'codes',
    text: `Schlüsselteil 2/3: ${C.keyStrand.parts[1]} (aus der fehlgeleiteten Systemmeldung).`,
  },
  {
    id: 'key_part_3',
    category: 'codes',
    text: `Schlüsselteil 3/3: ${C.keyStrand.parts[2]} (vom Prüfband).`,
  },
  {
    id: 'cassette',
    category: 'dinge',
    text: 'Ralf hat dir eine Kassette aus Seidels Sperrmüllkarton gebracht: »WT-07 PRÜFBAND 3«. Ein Datenband für die Datasette.',
  },
  {
    id: 'key_complete',
    category: 'codes',
    text: 'Alle drei Schlüsselteile zusammen ergeben zwölf Ziffern. Das Modul fragt nach genau so einem Schlüssel (Menüpunkt 3).',
  },
  {
    id: 'cipher_method',
    category: 'codes',
    text: 'Das Verfahren ist simpel: Jede Schlüsselziffer verschiebt den Buchstaben an ihrer Stelle im Alphabet, »X« trennt die Wörter.',
  },
  {
    id: 'k01_decrypted',
    category: 'verdacht',
    text: `Klartext des Rundschreibens von ${C.secretNetwork.senderHandle}: »Operation REWIND beginnt Freitag.« Alle Kennungen sollen sich bereithalten, Testzugänge werden abgeschaltet.`,
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

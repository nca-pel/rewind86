/** Deutsches Adventure-Vokabular (normalisiert). Reine Daten – keine Logik. */

export type VerbId =
  | 'examine'
  | 'lookat'
  | 'take'
  | 'drop'
  | 'insert'
  | 'place'
  | 'eject'
  | 'open'
  | 'close'
  | 'turnOn'
  | 'turnOff'
  | 'start'
  | 'read'
  | 'use'
  | 'pickup'
  | 'hangup'
  | 'call'
  | 'shout'
  | 'dial'
  | 'tune'
  | 'listen'
  | 'ask'
  | 'tell'
  | 'talk'
  | 'bye'
  | 'greet'
  | 'go'
  | 'search'
  | 'violence'
  | 'eat'
  | 'play'
  | 'type'
  | 'press'
  | 'note'
  | 'link';

export interface VerbEntry {
  words: string[];
  /** Abtrennbare Partikel am Satzende (z. B. "ein" in "SCHALTE RADIO EIN"); null = keiner. */
  particle: string | null;
  verb: VerbId;
}

const L = (words: string, particle: string | null, verb: VerbId): VerbEntry => ({
  words: words.split(' '),
  particle,
  verb,
});

/** Reihenfolge: Einträge mit Partikel werden vor partikellosen geprüft. */
export const VERBS: VerbEntry[] = [
  L('schau schaue sieh siehe guck gucke kuck kucke', 'an', 'examine'),
  L('heb hebe heben', 'auf', 'take'),
  L('heb hebe heben nimm nehme', 'ab', 'pickup'),
  L('geh gehe', 'ran', 'pickup'),
  L('geh gehe', 'dran', 'pickup'),
  L('leg lege legen', 'auf', 'hangup'),
  L('leg lege legen stell stelle tu tue', 'ab', 'drop'),
  L('leg lege legen stell stelle tu tue', 'weg', 'drop'),
  L('leg lege legen steck stecke schieb schiebe tu tue pack packe', 'ein', 'insert'),
  L('leg lege steck stecke schieb schiebe tu tue', 'rein', 'insert'),
  L('leg lege steck stecke schieb schiebe tu tue', 'hinein', 'insert'),
  L('nimm nehme nehm hol hole zieh ziehe', 'heraus', 'eject'),
  L('nimm nehme nehm hol hole zieh ziehe', 'raus', 'eject'),
  L('wirf wirft', 'aus', 'eject'),
  L('mach mache machen zieh ziehe reiss reisse klapp klappe', 'auf', 'open'),
  L('mach mache machen schieb schiebe klapp klappe drueck druecke', 'zu', 'close'),
  L('schalte schalt mach mache knips knipse dreh drehe', 'ein', 'turnOn'),
  L('schalte schalt mach mache knips knipse dreh drehe', 'an', 'turnOn'),
  L('schalte schalt mach mache knips knipse dreh drehe', 'aus', 'turnOff'),
  L('rufe ruf', 'an', 'call'),
  L('hoer hoere horch horche', 'zu', 'listen'),
  L('denk denke', 'nach', 'note'), // wird im Parser als Meta-Befehl abgefangen
  L('schreib schreibe', 'auf', 'note'),
  L('stell stelle', 'ein', 'tune'),
  L('such sucht suche', 'ab', 'search'),

  L(
    'untersuche untersuch untersuchen betrachte betracht betrachten inspiziere pruefe pruef x begutachte mustere anschauen ansehen beschreibe',
    null,
    'examine',
  ),
  L('schau schaue sieh siehe guck gucke kuck kucke blick blicke', null, 'lookat'),
  L('nimm nehme nehm nehmen hol hole holen greif greife schnapp schnappe', null, 'take'),
  L('leg lege legen stell stelle tu tue steck stecke schieb schiebe pack packe', null, 'place'),
  L('entnimm entnehme auswerfen', null, 'eject'),
  L('oeffne oeffnen oeffn aufmachen', null, 'open'),
  L('schliesse schliess schliessen zumachen', null, 'close'),
  L('einschalten anschalten anmachen', null, 'turnOn'),
  L('ausschalten ausmachen', null, 'turnOff'),
  L('starte start starten boote', null, 'start'),
  L('lies lese les lesen blaettere blaetter studiere ueberfliege', null, 'read'),
  L('benutze benutz verwende verwend bediene bedien nutze nutz benutzen', null, 'use'),
  L('abheben abnehmen antworte antworten', null, 'pickup'),
  L('auflegen', null, 'hangup'),
  L('anrufen telefoniere telefonier', null, 'call'),
  L('rufe ruf brulle bruelle schrei schreie', null, 'shout'),
  L('waehle waehl waehlen wahl', null, 'dial'),
  L('schalte schalt dreh drehe', null, 'tune'),
  L('hoer hoere horch horche lausche lausch', null, 'listen'),
  L('frage frag fragen erkundige', null, 'ask'),
  L('erzaehle erzaehl berichte bericht sag sage informiere', null, 'tell'),
  L('rede red sprich spreche sprech unterhalte quatsche plaudere', null, 'talk'),
  L('tschuess tschues ciao bye wiedersehen bis', null, 'bye'),
  L('hallo hi moin servus', null, 'greet'),
  L('geh gehe gehen lauf laufe renn renne verlasse verlass betritt betrete fahr fahre', null, 'go'),
  L('durchsuche durchsuch suche such wuehle', null, 'search'),
  L('schlage schlag tritt trete zerstoere wirf werfe kaputt', null, 'violence'),
  L('iss esse trink trinke', null, 'eat'),
  L('spiele spiel zocke zock', null, 'play'),
  L('tippe tipp', null, 'type'),
  L('druecke drueck betaetige', null, 'press'),
  L('notiere notier notiz schreib schreibe', null, 'note'),
  L('verknuepfe verknuepf verbinde verbind', null, 'link'),
];

export const PREPOSITIONS = new Set([
  'in',
  'ins',
  'im',
  'auf',
  'aufs',
  'mit',
  'nach',
  'ueber',
  'von',
  'vom',
  'zu',
  'zum',
  'zur',
  'an',
  'ans',
  'am',
  'aus',
  'fuer',
  'unter',
  'bei',
  'beim',
  'gegen',
  'hinter',
  'neben',
]);

export const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'des']);

export const FILLERS = new Set([
  ...ARTICLES,
  'ein',
  'eine',
  'einen',
  'einem',
  'einer',
  'eines',
  'mal',
  'bitte',
  'doch',
  'jetzt',
  'nun',
  'noch',
  'kurz',
  'schnell',
  'dir',
  'mir',
  'mich',
  'dich',
  'sich',
  'einfach',
  'endlich',
  'gleich',
  'nochmal',
  'nochmals',
  'wieder',
  'also',
  'halt',
  'ganz',
  'etwas',
  'mein',
  'meine',
  'meinen',
  'meinem',
  'meiner',
  'dein',
  'deine',
  'deinen',
  'deinem',
  'deiner',
  'sein',
  'seine',
  'seinen',
  'seinem',
  'genau',
  'genauer',
  'naeher',
  'erstmal',
  'erst',
  'vorsichtig',
  'langsam',
  'sofort',
  'ich',
  'du',
  'jan',
  'und',
]);

export const PRONOUNS = new Set([
  'es',
  'ihn',
  'sie',
  'ihm',
  'ihr',
  'dies',
  'diese',
  'diesen',
  'dieses',
  'dieser',
]);

export const MODERN_WORDS = new Set([
  'google',
  'googeln',
  'googel',
  'googele',
  'internet',
  'www',
  'web',
  'website',
  'webseite',
  'handy',
  'smartphone',
  'iphone',
  'whatsapp',
  'email',
  'wlan',
  'wifi',
  'laptop',
  'notebookcomputer',
  'tablet',
  'youtube',
  'wikipedia',
  'facebook',
  'instagram',
  'chatgpt',
  'ki',
  'bluetooth',
  'usb',
  'streamen',
  'netflix',
  'spotify',
  'online-banking',
  'navi',
  'gps',
]);

/** C64-Tasten, die per DRÜCKE erreichbar sind */
export const KEY_WORDS: Record<string, string> = {
  pfeil: 'ARROW_LEFT',
  pfeiltaste: 'ARROW_LEFT',
  linkspfeil: 'ARROW_LEFT',
  linkspfeiltaste: 'ARROW_LEFT',
  '←': 'ARROW_LEFT',
  leertaste: 'SPACE',
  space: 'SPACE',
  leerzeichen: 'SPACE',
  return: 'RETURN',
  enter: 'RETURN',
  eingabe: 'RETURN',
  eingabetaste: 'RETURN',
  runstop: 'RUNSTOP',
  run: 'RUNSTOP',
  stop: 'RUNSTOP',
  f1: 'F1',
  f3: 'F3',
  f5: 'F5',
  f7: 'F7',
  clr: 'CLRHOME',
  home: 'CLRHOME',
};

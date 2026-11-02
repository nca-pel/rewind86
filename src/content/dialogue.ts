import type { Condition, GameEffect } from '../engine/types';
import { GAME_CONFIG } from './config';

export interface TopicDef {
  id: string;
  label: string;
  /** normalisierte Schlüsselwörter */
  aliases: string[];
}

export const TOPICS: TopicDef[] = [
  { id: 'spiel', label: 'das Spiel', aliases: ['spiel', 'game', 'programm', 'software', 'neue'] },
  {
    id: 'seidel',
    label: 'Seidel (Ralfs Stiefvater)',
    aliases: ['seidel', 'stiefvater', 'martin', 'alter', 'alten', 'stiefvaters', 'vater', 'herr'],
  },
  {
    id: 'arbeit',
    label: 'Seidels Arbeit',
    aliases: ['arbeit', 'job', 'beruf', 'firma', 'ariolasoft', 'guetersloh'],
  },
  { id: 'diskette', label: 'die Diskette', aliases: ['diskette', 'disk', 'kopie', 'arbeitsdiskette'] },
  {
    id: 'training',
    label: 'das Training',
    aliases: ['training', 'fussball', 'fussballtraining', 'verein', 'sport'],
  },
  {
    id: 'treffen',
    label: 'zusammen spielen',
    aliases: ['treffen', 'zusammen', 'vorbeikommen', 'besuch', 'heute', 'abend'],
  },
  {
    id: 'mailbox',
    label: 'Mailboxen',
    aliases: ['mailbox', 'mailboxen', 'modem', 'koppler', 'dfue', 'netz'],
  },
  {
    id: 'band',
    label: 'das Prüfband',
    aliases: ['band', 'pruefband', 'kassette', 'kassetten', 'tape', 'datenband', 'baender', 'datasette'],
  },
  { id: 'disk2', label: 'Diskette 2', aliases: ['disk2', 'zweite', 'schluesseldiskette', '2'] },
  { id: 'schule', label: 'die Schule', aliases: ['schule', 'hausaufgaben', 'klausur', 'lehrer'] },
  {
    id: 'modul',
    label: 'den versteckten Modus',
    aliases: [
      'modul',
      'modus',
      'versteckt',
      'versteckte',
      'versteckten',
      'geheim',
      'geheime',
      'geheimen',
      'trick',
    ],
  },
  {
    id: 'ghost',
    label: 'GHOST und den Freitag',
    aliases: ['ghost', 'brandt', 'betreuer', 'freitag', 'operation', 'rewind'],
  },
  { id: 'ralf', label: 'Ralf', aliases: ['ralf', 'sohn', 'stiefsohn', 'junge'] },
  { id: 'club', label: 'den Computerclub', aliases: ['club', 'computerclub', 'clubabend', 'jugendzentrum'] },
];

export const TOPIC_BY_ID: Record<string, TopicDef> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export interface DialogueEntry {
  npc: string;
  topic: string;
  when?: Condition;
  speaker: string;
  text: string;
  effects?: GameEffect[];
}

const LATER: Condition = { flag: 'ralfDelivered' };

/**
 * Spätere Telefonate mit Ralf (nach der Übergabe). Stehen vor den Prolog-Einträgen, damit sie dort gewinnen.
 * Ralfs Strang wird in Akt 3–4 weiter ausgebaut (Loyalitätskrise).
 */
const RALF_LATER: DialogueEntry[] = [
  {
    npc: 'ralf',
    topic: 'ghost',
    when: { all: [LATER, { flag: 'finaleOpen' }, { notFlag: 'gameOver' }] },
    speaker: 'RALF',
    text: '»Heute Nacht? Dein Ernst?« Ralf atmet hörbar aus. »Okay. Ich bleib unten. Ich sag ihm irgendwas.«',
    effects: [
      { type: 'setFlag', id: 'toldRalf', value: true },
      { type: 'scheduleEvent', id: 'ev_finale_ralf', inMinutes: 8 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'ghost',
    when: { all: [LATER, { fact: 'ghost_offer' }, { notFlag: 'toldRalf' }] },
    speaker: 'RALF',
    text: '»Moment – du meinst, der Brandt aus deinem Club soll GHOST sein? Der mit der Thermoskanne?« Ralf schweigt einen Moment. »Freitag … da packt mein Alter seit Tagen seine Sachen für irgendwas zusammen. Er hat gesagt, am Freitag wäre alles vorbei. Meiner Mutter erzählt er, er geht Freitag mit Kollegen in die Spätvorstellung, ›Der Name der Rose‹. Der? Ins Kino? Der war seit Jahren nicht im Kino. Ich weiß nicht, was das soll. Aber ich sag’s keinem, großes Ehrenwort. Und du – pass auf dich auf.«',
    effects: [
      { type: 'setFlag', id: 'toldRalf', value: true },
      { type: 'discoverFact', id: 'ralf_told_ghost' },
      { type: 'discoverFact', id: 'seidel_alibi' },
      { type: 'changeRelationship', id: 'ralfTrust', delta: 12 },
      { type: 'changeRelationship', id: 'seidelSuspicion', delta: 6 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'ghost',
    when: { all: [LATER, { flag: 'toldRalf' }] },
    speaker: 'RALF',
    text: '»Ich hab dir alles gesagt, was ich weiß. Ruf an, wenn du mehr hast.«',
  },
  {
    npc: 'ralf',
    topic: 'ghost',
    when: LATER,
    speaker: 'RALF',
    text: '»GHOST? Was ist das denn für ein Name?« Ralf lacht unsicher. »Ich hab keine Ahnung, wovon du redest.«',
  },
  {
    npc: 'ralf',
    topic: 'spiel',
    when: LATER,
    speaker: 'RALF',
    text: `»${GAME_CONFIG.unreleasedGame.workingTitle}? Eine Wirtschaftssimulation? Ich dachte, da wird wenigstens geballert. Na super – da hab ich ja was riskiert für nix.«`,
  },
  // Prüfband (Schlüsselteil 3). Im Schwierigkeitsgrad »Schwer« bringt Ralf es nur, wenn Jan danach fragt.
  {
    npc: 'ralf',
    topic: 'band',
    when: { all: [LATER, { flag: 'cassetteDelivered' }] },
    speaker: 'RALF',
    text: '»Und? Hast du das Band schon ausprobiert? Erzähl mir bloß nicht, da ist Musik drauf.«',
  },
  {
    npc: 'ralf',
    topic: 'band',
    when: { all: [LATER, { flag: 'ralfAskedTape' }] },
    speaker: 'RALF',
    text: '»Ich halt die Augen offen, versprochen. Wenn da was mit WT-07 auftaucht, kriegst du’s.«',
  },
  {
    npc: 'ralf',
    topic: 'band',
    when: { all: [LATER, { fact: 'key_leak' }, { timeAfter: GAME_CONFIG.keyStrand.cassetteAt }] },
    speaker: 'RALF',
    text: '»Ein Band mit WT-07 drauf?« Ralf überlegt. »Warte mal … Mein Alter hat sein Arbeitszimmer ausgemistet, der Karton für den Sperrmüll steht noch im Flur. Da lagen Kassetten drin. Ich guck nach und bring’s dir gleich vorbei.«',
    effects: [
      { type: 'setFlag', id: 'ralfAskedTape', value: true },
      { type: 'changeRelationship', id: 'ralfTrust', delta: 3 },
      { type: 'scheduleEvent', id: 'ev_ralf_cassette', inMinutes: 30 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'band',
    when: { all: [LATER, { fact: 'key_leak' }] },
    speaker: 'RALF',
    text: '»Ein Band? Eine Kassette mit WT-07 drauf?« Ralf wird leiser. »Mein Alter fängt gerade an, sein Arbeitszimmer auszumisten. Wenn da so was auftaucht, bring ich’s dir. Spätestens am Feiertag, da hab ich frei.«',
    effects: [
      { type: 'setFlag', id: 'ralfAskedTape', value: true },
      { type: 'changeRelationship', id: 'ralfTrust', delta: 3 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'band',
    when: LATER,
    speaker: 'RALF',
    text: '»Was für ein Band? Mein Alter hat hundert Kassetten. Sag mir wenigstens, wonach ich suchen soll.«',
  },
  {
    npc: 'ralf',
    topic: 'modul',
    when: { all: [LATER, { fact: 'needs_disk2' }, { notFlag: 'ralfKnowsModule' }] },
    speaker: 'RALF',
    text: '»Ein versteckter Modus? In dem Spiel von meinem Alten? Echt jetzt?« Er wird leiser. »Der hat in letzter Zeit dauernd so komische Disketten rumliegen … Soll ich mal gucken, ob da eine zweite ist? Oder ihn ganz unauffällig fragen?«',
    effects: [
      { type: 'setFlag', id: 'ralfKnowsModule', value: true },
      { type: 'discoverFact', id: 'ralf_knows_module' },
      { type: 'changeRelationship', id: 'ralfTrust', delta: 5 },
      // Ralf ist neugierig und kein guter Lügner – das Risiko, dass Seidel etwas merkt, steigt.
      { type: 'changeRelationship', id: 'seidelSuspicion', delta: 8 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'modul',
    when: { all: [LATER, { flag: 'ralfKnowsModule' }] },
    speaker: 'RALF',
    text: '»Keine Sorge, ich hab nix gesagt. Aber sein Schrank im Arbeitszimmer ist neuerdings abgeschlossen. Keine Chance.«',
  },
  {
    npc: 'ralf',
    topic: 'modul',
    when: LATER,
    speaker: 'RALF',
    text: '»Was für ein Modus? Erzähl halt, wenn du was weißt.«',
  },
  {
    npc: 'ralf',
    topic: 'disk2',
    when: { all: [LATER, { flag: 'ralfKnowsModule' }] },
    speaker: 'RALF',
    text: '»Eine Diskette 2 hab ich nie gesehen. Wenn, dann liegt die in dem abgeschlossenen Schrank.«',
  },
  {
    npc: 'ralf',
    topic: 'seidel',
    when: { all: [LATER, { rel: 'seidelSuspicion', atLeast: 'noticeable' }] },
    speaker: 'RALF',
    text: '»Der ist seit zwei Tagen total komisch. Hängt dauernd im Arbeitszimmer am Telefon und macht die Tür zu. Meine Mutter sagt, Stress bei der Arbeit.«',
    effects: [{ type: 'discoverFact', id: 'seidel_phones' }],
  },
  {
    npc: 'ralf',
    topic: 'seidel',
    when: LATER,
    speaker: 'RALF',
    text: '»Wie immer. Redet nicht, guckt Nachrichten, sitzt im Arbeitszimmer. Hauptsache, er merkt nichts von der Kopie.«',
  },
  {
    npc: 'ralf',
    topic: 'diskette',
    when: LATER,
    speaker: 'RALF',
    text: '»Pass bloß drauf auf. Wenn mein Alter rauskriegt, dass ich an seinem Kram war, hab ich Hausarrest bis Weihnachten.«',
  },
  {
    npc: 'ralf',
    topic: 'training',
    when: LATER,
    speaker: 'RALF',
    text: '»Dienstag, Donnerstag und Freitag ab halb fünf. Samstagnachmittag haben wir Spiel. Sonst bin ich meistens zu Hause.«',
    effects: [{ type: 'discoverFact', id: 'ralf_schedule' }],
  },
  {
    npc: 'ralf',
    topic: 'treffen',
    when: LATER,
    speaker: 'RALF',
    text: '»Diese Woche wird schwierig. Training, Mathe-Klausur, und am Sonntag müssen wir zu Oma. Ruf einfach an.«',
  },
  {
    npc: 'ralf',
    topic: 'schule',
    when: LATER,
    speaker: 'RALF',
    text: `»Dienstag Mathe-Klausur. Frag nicht. Bei uns am ${GAME_CONFIG.schools.ralf.replace(' Rheda', '')} sind die Lehrer echt gnadenlos.«`,
  },
  {
    npc: 'ralf',
    topic: 'club',
    when: LATER,
    speaker: 'RALF',
    text: '»Dein Computerclub? Da sitzen doch nur Leute, die über Disketten reden. Nix für mich. Früher, als wir noch nebeneinander gewohnt haben, hast du mich da auch nie hingekriegt.«',
  },
];

/**
 * Seidels Anruf im Finale (Fr. 21:00). Er sucht nach dem Leck und kämpft dabei mit sich selbst: Auftrag oder
 * Familie (GDD §3.3). Nach drei Antworten oder einem Schreck legt er auf.
 */
const SEIDEL_CALL: DialogueEntry[] = [
  {
    npc: 'seidel',
    topic: 'ralf',
    speaker: 'SEIDEL',
    text: '»Ralf.« Eine lange Pause. »Er ist das Einzige, was ich hier richtig gemacht habe, weißt du das? Ich bin heute Nacht weg. Dienstreise. Halb zwölf an der Raststätte, dann ist alles erledigt, und am Montag …« Er bricht ab. »Warum erzähl ich dir das überhaupt?« Er atmet schwer. »Pass auf ihn auf, Jan. Falls ich mal nicht da bin.«',
    effects: [
      { type: 'discoverFact', id: 'seidel_rastplatz' },
      { type: 'setFlag', id: 'seidelDoubts', value: true },
    ],
  },
  {
    npc: 'seidel',
    topic: 'diskette',
    speaker: 'SEIDEL',
    text: '»Ralf hat dir etwas gegeben. Eine Diskette aus meinem Arbeitszimmer.« Kein Vorwurf, nur eine Feststellung. »Bring sie Montag vorbei. Dann vergessen wir das. Alle beide.«',
    effects: [
      { type: 'discoverFact', id: 'seidel_knows_copy' },
      { type: 'changeRelationship', id: 'seidelSuspicion', delta: 5 },
    ],
  },
  {
    npc: 'seidel',
    topic: 'spiel',
    speaker: 'SEIDEL',
    text: '»Ein Spiel. Ja.« Er lacht kurz und freudlos. »Eine Wirtschaftssimulation. Nichts, was einen Jungen in deinem Alter interessieren sollte.«',
  },
  {
    npc: 'seidel',
    topic: 'ghost',
    speaker: 'SEIDEL',
    text: 'Stille. So lang, dass du glaubst, er hätte aufgelegt. Dann, sehr leise: »Brandt. Natürlich.« Seine Stimme wird kalt. »Halt dich raus aus Dingen, die du nicht verstehst, Jan. Das ist kein Spiel.« Es klickt.',
    effects: [
      { type: 'setFlag', id: 'seidelWarned', value: true },
      { type: 'setFlag', id: 'seidelHangsUp', value: true },
      { type: 'changeRelationship', id: 'seidelSuspicion', delta: 15 },
      {
        type: 'scheduleEvent',
        id: 'ev_finale_close_early',
        inMinutes: GAME_CONFIG.finale.warnedCloseInMinutes,
      },
    ],
  },
  {
    npc: 'seidel',
    topic: 'seidel',
    speaker: 'SEIDEL',
    text: '»Mir geht’s gut. Viel Arbeit.« Du hörst, wie er sich eine Zigarette anzündet. »Du stellst Fragen wie ein Erwachsener, Jan.«',
  },
  {
    npc: 'seidel',
    topic: 'arbeit',
    speaker: 'SEIDEL',
    text: '»Software. Langweiliges Zeug. Man sitzt am Schreibtisch und wartet, dass etwas fertig wird.« Du bist sicher, dass er dabei auf die Uhr sieht.',
  },
];

/** Antworten werden in Reihenfolge geprüft; der erste Eintrag mit erfüllter Bedingung gewinnt. */
export const DIALOGUE: DialogueEntry[] = [
  ...SEIDEL_CALL,
  ...RALF_LATER,
  {
    npc: 'ralf',
    topic: 'spiel',
    speaker: 'RALF',
    text: '»Mein Stiefvater hatte eine Arbeitsdiskette im Arbeitszimmer liegen. Irgendein neues Spiel, das es noch nirgends gibt. Ich hab mir schnell eine Kopie gezogen, als er weg war. Läuft sogar – glaub ich.«',
    effects: [
      { type: 'discoverFact', id: 'ralf_copied_game' },
      { type: 'addTopic', id: 'seidel' },
      { type: 'addTopic', id: 'arbeit' },
    ],
  },
  {
    npc: 'ralf',
    topic: 'seidel',
    speaker: 'RALF',
    text: '»Wenn der das merkt, gibt’s Ärger. Der ist sowieso total pingelig mit seinem Kram, seit Wochen noch schlimmer. Also: kein Wort zu ihm, klar?«',
    effects: [
      { type: 'discoverFact', id: 'seidel_strict' },
      { type: 'changeRelationship', id: 'ralfTrust', delta: 2 },
    ],
  },
  {
    npc: 'ralf',
    topic: 'arbeit',
    speaker: 'RALF',
    text: '»Software, drüben in Gütersloh. Irgendwas bei Ariolasoft oder drumherum, keine Ahnung. Er redet nie darüber. Bei uns zu Hause redet er sowieso nicht viel.«',
    effects: [{ type: 'discoverFact', id: 'seidel_job' }],
  },
  {
    npc: 'ralf',
    topic: 'diskette',
    speaker: 'RALF',
    text: '»Ich bring sie dir gleich vorbei, liegt eh auf dem Weg. Aber nur kurz!«',
  },
  {
    npc: 'ralf',
    topic: 'training',
    speaker: 'RALF',
    text: '»Freitags ist Training, das weißt du doch. Wenn ich zu spät komme, lässt der Trainer mich Runden laufen.«',
    effects: [{ type: 'discoverFact', id: 'ralf_training' }],
  },
  {
    npc: 'ralf',
    topic: 'treffen',
    speaker: 'RALF',
    text: '»Heute geht nicht, Training. Probier du’s aus – morgen erzählst du mir, was drauf ist.«',
  },
  {
    npc: 'ralf',
    topic: 'mailbox',
    speaker: 'RALF',
    text: '»Mailbox? Das ist dein Ding mit dem Pfeifkasten. Ich versteh davon nix.«',
  },
  {
    npc: 'ralf',
    topic: 'disk2',
    speaker: 'RALF',
    text: '»Eine zweite? Keine Ahnung. Ich hab die kopiert, die da lag.«',
  },
  {
    npc: 'ralf',
    topic: 'schule',
    speaker: 'RALF',
    text: '»Schule? Es ist Freitag, Mann!«',
  },
];

export const DIALOGUE_FALLBACK: Record<string, string> = {
  ralf: '»Hä? Keine Ahnung, wovon du redest. Ich muss gleich los!«',
  seidel: '»Ich hab nicht viel Zeit, Jan. Ist Ralf bei dir gewesen heute?«',
};

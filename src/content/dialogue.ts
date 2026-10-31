import type { Condition, GameEffect } from '../engine/types';

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
  { id: 'disk2', label: 'Diskette 2', aliases: ['disk2', 'zweite', 'schluesseldiskette', '2'] },
  { id: 'schule', label: 'die Schule', aliases: ['schule', 'hausaufgaben', 'klausur', 'lehrer'] },
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

/** Antworten werden in Reihenfolge geprüft; der erste Eintrag mit erfüllter Bedingung gewinnt. */
export const DIALOGUE: DialogueEntry[] = [
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
};

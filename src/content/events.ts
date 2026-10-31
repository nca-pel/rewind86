import type { Condition, GameEffect } from '../engine/types';
import { GAME_CONFIG } from './config';

export interface EventDef {
  id: string;
  /** Zu Spielbeginn an diesem Zeitpunkt eingeplant. */
  at?: string;
  /** Bedingungsereignis: wird nach jedem Schritt geprüft und feuert einmal. */
  trigger?: Condition;
  /** Darf mehrfach feuern (Alltags-/Erinnerungsereignis). Sonst strikt einmalig. */
  repeatable?: boolean;
  /** Unterbricht WARTE. */
  interrupts?: boolean;
  /** Erste Variante mit erfüllter Bedingung wird ausgeführt. */
  variants: Array<{ when?: Condition; effects: GameEffect[] }>;
}

const START = GAME_CONFIG.startDate;
const day = START.slice(0, 10);

export const EVENTS: EventDef[] = [
  {
    id: 'ev_ralf_call',
    at: START,
    interrupts: true,
    variants: [
      {
        effects: [
          { type: 'telecom', op: 'ring', who: 'ralf' },
          { type: 'audio', cue: 'phone_ring' },
          { type: 'say', kind: 'caption', text: '[Das Telefon klingelt.]' },
          { type: 'say', text: 'Das Telefon auf deinem Schreibtisch klingelt.' },
          { type: 'scheduleEvent', id: 'ev_ring_reminder', inMinutes: 6 },
          { type: 'puzzle', id: 'P01', status: 'discovered' },
        ],
      },
    ],
  },
  {
    id: 'ev_ring_reminder',
    repeatable: true,
    interrupts: true,
    variants: [
      {
        when: { ringing: true },
        effects: [
          { type: 'audio', cue: 'phone_ring' },
          { type: 'say', kind: 'caption', text: '[Das Telefon klingelt weiter.]' },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '(von unten) »Jaaan! Telefon! Das ist bestimmt Ralf!«',
          },
          { type: 'scheduleEvent', id: 'ev_ring_reminder', inMinutes: 6 },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_doorbell',
    interrupts: true,
    variants: [
      {
        effects: [
          { type: 'audio', cue: 'doorbell' },
          { type: 'say', kind: 'caption', text: '[Es klingelt an der Haustür.]' },
          {
            type: 'say',
            text: 'Es klingelt an der Haustür. Schritte poltern die Treppe hoch – dann steht Ralf im Türrahmen, Sporttasche über der Schulter, Trainingsjacke halb offen, außer Atem.',
          },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Hier. Und kein Wort zu meinem Alten, versprochen?«',
          },
          { type: 'say', text: 'Er drückt dir eine Diskette in die Hand.' },
          { type: 'moveItem', id: 'disk_game', to: 'inventory' },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Ich muss sofort weiter zum Training, sonst killt mich der Trainer. Probier’s aus – erzähl mir morgen alles!«',
          },
          { type: 'discoverFact', id: 'ralf_training' },
          {
            type: 'say',
            text: 'Bevor du überhaupt etwas sagen kannst, ist er schon wieder die Treppe hinunter. Die Haustür fällt ins Schloss. Du bist allein mit der Diskette.',
          },
          { type: 'audio', cue: 'door' },
          { type: 'setFlag', id: 'ralfDelivered', value: true },
          { type: 'setFlag', id: 'ralfPresent', value: false },
          { type: 'ui', effect: { type: 'autosave', reason: 'Diskette erhalten' } },
        ],
      },
    ],
  },
  {
    id: 'ev_father_home',
    at: `${day}T18:00`,
    variants: [
      {
        effects: [
          { type: 'audio', cue: 'door' },
          {
            type: 'say',
            text: 'Unten fällt die Haustür ins Schloss. Dein Vater ist von der Arbeit zurück; du hörst ihn in der Küche mit deiner Mutter reden.',
          },
          { type: 'setFlag', id: 'fatherHome', value: true },
        ],
      },
    ],
  },
  {
    id: 'ev_father_phone',
    at: `${day}T18:30`,
    interrupts: true,
    variants: [
      {
        when: { lineBusy: true },
        effects: [
          { type: 'audio', cue: 'busy' },
          { type: 'say', text: 'Es klopft. Dein Vater steckt den Kopf zur Tür herein.' },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'VATER',
            text: '»Jan, hängst du schon wieder an der Leitung? Ich wollte Oma anrufen und hör nur Getute. Denk an die Telefonrechnung, ja?«',
          },
          {
            type: 'say',
            text: 'Er schließt die Tür wieder. Das Telefon unten und deins teilen sich eben dieselbe Leitung.',
          },
          { type: 'setFlag', id: 'fatherNoticedBusyLine', value: true },
        ],
      },
      {
        effects: [
          {
            type: 'say',
            text: 'Von unten hörst du deinen Vater am Flurtelefon: »Ja, Mutter … nein, uns geht’s gut …« – Er telefoniert mit Oma. Solange ist die Leitung belegt.',
          },
          { type: 'telecom', op: 'houseBusy', minutes: 15 },
        ],
      },
    ],
  },
  {
    id: 'ev_mother_modem',
    variants: [
      {
        when: { online: true },
        effects: [
          { type: 'audio', cue: 'modem' },
          { type: 'say', kind: 'caption', text: '[Durch die Leitung kreischt kurz das Modem.]' },
          {
            type: 'say',
            text: 'Plötzlich zischt es im Koppler, auf dem Monitor tauchen ein paar wirre Zeichen auf. Von unten ruft deine Mutter:',
          },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '»Jan! Was ist denn das für ein Gepfeife in der Leitung? Ich wollte Tante Gisela anrufen!«',
          },
          { type: 'say', text: 'Sie legt unten wieder auf. Die Verbindung hält – gerade so.' },
          { type: 'setFlag', id: 'motherHeardModem', value: true },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_slice_end',
    trigger: {
      all: [
        { fact: 'encrypted_msg' },
        { fact: 'wt07_trace' },
        { not: { online: true } },
        { not: { lineBusy: true } },
      ],
    },
    variants: [
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Du sitzt eine ganze Weile still vor dem Monitor. Ein Spiel aus dem Büro von Ralfs Stiefvater, ein verstecktes Modul, eine Mailbox, in der jemand verschlüsselte Rundschreiben an »ALLE« schickt – und deine Diskette, die dort namentlich erwähnt wird. Wer sind »ALLE«? Und was steht auf Diskette 2?',
          },
          {
            type: 'say',
            kind: 'system',
            text: '— Ende des spielbaren Ausschnitts. Fortsetzung folgt. —\nDu kannst weiterspielen: Notizen ergänzen, die Demo »1001« ansehen, BASIC ausprobieren oder dein Archiv pflegen.',
          },
          { type: 'setFlag', id: 'sliceEnded', value: true },
          { type: 'puzzle', id: 'P07', status: 'discovered' },
          { type: 'ui', effect: { type: 'sliceEnd' } },
          { type: 'ui', effect: { type: 'autosave', reason: 'Ende des Ausschnitts' } },
        ],
      },
    ],
  },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

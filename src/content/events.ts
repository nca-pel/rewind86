import type { Condition, GameEffect } from '../engine/types';
import { GAME_CONFIG } from './config';

export interface EventDef {
  id: string;
  /** Zu Spielbeginn an diesem Zeitpunkt eingeplant. */
  at?: string;
  /** Bedingungsereignis: wird nach jedem Schritt geprüft und feuert einmal. */
  trigger?: Condition;
  /** Täglich zu dieser Uhrzeit (HH:MM); wird nach dem Feuern für den nächsten Tag neu eingeplant. */
  daily?: string;
  /** Darf mehrfach feuern (Alltags-/Erinnerungsereignis). Sonst strikt einmalig. */
  repeatable?: boolean;
  /** Unterbricht WARTE. */
  interrupts?: boolean;
  /** Erste Variante mit erfüllter Bedingung wird ausgeführt. */
  variants: Array<{ when?: Condition; effects: GameEffect[] }>;
}

const START = GAME_CONFIG.startDate;
const day = START.slice(0, 10);
const CAL = GAME_CONFIG.calendar;
/** Samstag, der Tag nach Spielbeginn */
const DAY2 = '1986-11-15';

/** HH:MM plus Minuten (innerhalb eines Tages) */
function addHm(t: string, minutes: number): string {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
const DINNER_END = addHm(CAL.dinner, CAL.dinnerMinutes);
const SCHOOL_JAN = `im ${GAME_CONFIG.schools.jan}`;
const SCHOOL_BACK =
  'Kurz nach halb zwei bist du wieder zu Hause. Nach dem Mittagessen sitzt du endlich wieder an deinem Schreibtisch.';

/** Ralf ruft an (späteres Telefonat); der Grund bestimmt die Begrüßung beim Abheben. */
function ralfRings(reason: 'saturday' | 'callback'): GameEffect[] {
  return [
    { type: 'setFlag', id: 'ralfCallReason', value: reason },
    { type: 'telecom', op: 'ring', who: 'ralf' },
    { type: 'audio', cue: 'phone_ring' },
    { type: 'say', kind: 'caption', text: '[Das Telefon klingelt.]' },
    { type: 'say', text: 'Das Telefon auf deinem Schreibtisch klingelt.' },
    { type: 'scheduleEvent', id: 'ev_ring_reminder', inMinutes: 4 },
    { type: 'scheduleEvent', id: 'ev_ralf_ring_end', inMinutes: 9 },
  ];
}

/** Ralfs Kassette (Schlüsselteil 3): Klingeln an der Haustür */
function cassetteArrives(): GameEffect[] {
  return [
    { type: 'audio', cue: 'doorbell' },
    { type: 'say', kind: 'caption', text: '[Es klingelt an der Haustür.]' },
  ];
}

function ralfAtDoor(line: string): GameEffect[] {
  return [
    {
      type: 'say',
      text: 'Schritte auf der Treppe, dann steht Ralf in der Tür, die Jacke noch an. Er sieht sich um, als könnte jemand mithören.',
    },
    { type: 'say', kind: 'dialog', speaker: 'RALF', text: line },
    { type: 'say', text: 'Er drückt dir eine Kassette in die Hand.' },
  ];
}

function cassetteGiven(): GameEffect[] {
  return [
    { type: 'moveItem', id: 'cassette', to: 'inventory' },
    { type: 'discoverFact', id: 'cassette' },
    { type: 'setFlag', id: 'cassetteDelivered', value: true },
    { type: 'ui', effect: { type: 'autosave', reason: 'Kassette erhalten' } },
  ];
}

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
        when: { all: [{ ringing: true }, { notFlag: 'away' }] },
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
            text: '— Ende des Prologs. Fortsetzung folgt … —\nDie nächsten Tage laufen weiter: Schule, Ralf, Mailboxen, BASIC. Behalte das Netz im Auge – vorsichtig. Was auf Diskette 2 steht, findet sich vielleicht auch auf anderem Weg.',
          },
          { type: 'setFlag', id: 'sliceEnded', value: true },
          { type: 'puzzle', id: 'P07', status: 'discovered' },
          { type: 'ui', effect: { type: 'sliceEnd' } },
          { type: 'ui', effect: { type: 'autosave', reason: 'Ende des Ausschnitts' } },
        ],
      },
    ],
  },

  // ── Seidels Verdacht: erzählerische Symptome an benannten Schwellen (GDD §9.3/§10.3) ──────────
  // Werte steigen durch riskantes Verhalten im geheimen Netz (GAME_CONFIG.risk). Die Stufen
  // bauen aufeinander auf; das Spielende ist erst nach der letzten Warnung erreichbar.
  {
    id: 'ev_susp_noticeable',
    trigger: { rel: 'seidelSuspicion', atLeast: 'noticeable' },
    variants: [
      {
        when: { online: true },
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Hat die Verbindung eben kurz gestockt? Für einen Moment stand der Cursor still, als würde am anderen Ende jemand mitlesen.',
          },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_susp_dangerous',
    trigger: { rel: 'seidelSuspicion', atLeast: 'dangerous' },
    variants: [
      {
        effects: [
          { type: 'lockAccount', system: 'secret', minutes: GAME_CONFIG.risk.lockMinutes },
          { type: 'discoverFact', id: 'account_locked' },
          {
            type: 'say',
            kind: 'thought',
            text: 'Gesperrt. Das ist kein Zufall – irgendwer hat gemerkt, dass ein Testzugang benutzt wird, der nie benutzt werden sollte. Wenn du so weitermachst, findet er heraus, wer dahintersteckt.',
          },
          { type: 'scheduleEvent', id: 'ev_anon_call', inMinutes: 45 },
        ],
      },
    ],
  },
  {
    id: 'ev_anon_call',
    repeatable: true,
    interrupts: true,
    variants: [
      // Solange Jan oder jemand anderes die Leitung belegt, versucht es der Anrufer später noch einmal.
      { when: { flag: 'anonCallDone' }, effects: [] },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_anon_call', inMinutes: 20 }],
      },
      {
        effects: [
          { type: 'telecom', op: 'ring', who: 'anon' },
          { type: 'audio', cue: 'phone_ring' },
          { type: 'say', kind: 'caption', text: '[Das Telefon klingelt.]' },
          { type: 'say', text: 'Das Telefon auf deinem Schreibtisch klingelt.' },
          { type: 'scheduleEvent', id: 'ev_anon_call_end', inMinutes: 3 },
        ],
      },
    ],
  },
  {
    id: 'ev_anon_call_end',
    variants: [
      {
        when: { ringing: true },
        effects: [
          { type: 'telecom', op: 'stopRinging' },
          { type: 'setFlag', id: 'anonCallDone', value: true },
          {
            type: 'say',
            text: 'Unten nimmt deine Mutter ab. »Keller? … Hallo?« Eine Pause. »Aufgelegt. Komisch.«',
          },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_susp_critical',
    trigger: { rel: 'seidelSuspicion', atLeast: 'critical' },
    variants: [
      {
        effects: [
          { type: 'setFlag', id: 'seidelFinalWarning', value: true },
          {
            type: 'say',
            kind: 'thought',
            text: 'Dir wird kalt. Wer auch immer hinter diesem Netz steckt, ist dir dicht auf den Fersen. Noch ein Ausflug mit dieser Kennung – und er weiß, wer du bist.',
          },
          {
            type: 'say',
            kind: 'system',
            text: '(Warnung: Weitere riskante Zugriffe auf das geheime Netz beenden das Spiel. Jetzt wäre ein guter Moment zum Speichern.)',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_susp_discovered',
    trigger: {
      all: [{ rel: 'seidelSuspicion', atLeast: 'discovered' }, { flag: 'seidelFinalWarning' }],
    },
    variants: [{ effects: [{ type: 'gameOver', ending: 'end_discovered' }] }],
  },

  // ── Tagesablauf (GDD §10.2): erzählte Zeitblöcke und Alltagsereignisse ───────────────────────────
  {
    id: 'ev_school',
    daily: CAL.schoolFrom,
    variants: [
      {
        when: { all: [{ schoolDay: true }, { notFlag: 'away' }, { weekday: 'Samstag' }] },
        effects: [
          {
            type: 'absence',
            kind: 'school',
            until: CAL.schoolUntilSaturday,
            text: 'Samstag – und trotzdem Schule. Nur vier Stunden, aber die ziehen sich wie Kaugummi. Alle denken schon ans Wochenende.',
            backText: 'Mittags bist du wieder zu Hause. Endlich Wochenende – zumindest der Rest davon.',
          },
        ],
      },
      {
        when: { all: [{ schoolDay: true }, { notFlag: 'away' }, { weekday: 'Montag' }] },
        effects: [
          {
            type: 'absence',
            kind: 'school',
            until: CAL.schoolUntil,
            text: `Montag. Ab ins ${GAME_CONFIG.schools.jan.split(' ')[0]}. Erste Stunde Mathe, dann Deutsch, dann zwei Stunden Englisch, in denen du kein Wort mitbekommst – in Gedanken sitzt du die ganze Zeit vor deinem Monitor.`,
            backText: SCHOOL_BACK,
          },
        ],
      },
      {
        when: { all: [{ schoolDay: true }, { notFlag: 'away' }] },
        effects: [
          {
            type: 'absence',
            kind: 'school',
            until: CAL.schoolUntil,
            text: `Schule. Sechs Stunden ${SCHOOL_JAN} – Kreidestaub, Overheadprojektor, Pausenhof. In Gedanken bist du die ganze Zeit an deinem Schreibtisch.`,
            backText: SCHOOL_BACK,
          },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_dinner',
    daily: CAL.dinner,
    variants: [
      { when: { flag: 'away' }, effects: [] },
      {
        when: { online: true },
        effects: [
          { type: 'say', kind: 'dialog', speaker: 'MUTTER', text: '(von unten) »Jan! Abendbrot!«' },
          {
            type: 'say',
            text: 'Du rufst »Gleich!« – und bleibst sitzen. Mitten in einer Verbindung legt man nicht einfach auf.',
          },
          { type: 'setFlag', id: 'missedDinner', value: true },
        ],
      },
      {
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Deine Mutter ruft zum Abendbrot. Unten gibt es Schnittchen und Tee, im Fernsehen laufen die Nachrichten, und dein Vater kommentiert den Wetterbericht.',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_meter',
    daily: addHm(CAL.dinner, 10),
    variants: [
      { when: { weekday: GAME_CONFIG.household.meterReadingWeekday }, effects: [{ type: 'meterReading' }] },
      { effects: [] },
    ],
  },
  {
    id: 'ev_bedtime',
    daily: CAL.bedtimeWarning,
    variants: [
      {
        when: { all: [{ schoolTomorrow: true }, { notFlag: 'away' }, { lineBusy: true }] },
        effects: [
          { type: 'say', text: 'Es klopft. Dein Vater steckt den Kopf zur Tür herein.' },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'VATER',
            text: '»Jan, es ist halb elf. Morgen ist Schule. Leg das Telefon weg und mach das Licht aus.«',
          },
        ],
      },
      {
        when: { all: [{ schoolTomorrow: true }, { notFlag: 'away' }] },
        effects: [
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'VATER',
            text: '(durch die Tür) »Licht aus, Jan! Morgen ist Schule.«',
          },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_forced_sleep',
    daily: CAL.forcedSleep,
    variants: [{ when: { flag: 'away' }, effects: [] }, { effects: [{ type: 'sleep', forced: true }] }],
  },
  {
    id: 'ev_pocket_money',
    daily: GAME_CONFIG.household.pocketMoneyAt,
    variants: [{ when: { weekday: 'Samstag' }, effects: [{ type: 'pocketMoney' }] }, { effects: [] }],
  },
  {
    id: 'ev_mail',
    daily: CAL.mail,
    variants: [
      {
        when: { all: [{ date: '1986-11-15' }, { notFlag: 'away' }] },
        effects: [
          { type: 'moveItem', id: 'club_letter', to: 'desk' },
          {
            type: 'say',
            text: 'Deine Mutter kommt herein und legt dir einen Umschlag auf den Schreibtisch.',
          },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '»Post für dich. Vom Computerclub, glaub ich.«',
          },
        ],
      },
      {
        when: { date: '1986-11-15' },
        effects: [
          { type: 'moveItem', id: 'club_letter', to: 'desk' },
          { type: 'say', text: '(Währenddessen legt deine Mutter einen Brief auf deinen Schreibtisch.)' },
        ],
      },
      { effects: [] },
    ],
  },

  // ── Ralf nach Wochenplan ───────────────────────────────────────────────────────────────────────
  {
    id: 'ev_ralf_saturday',
    at: `${DAY2}T13:00`,
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { flag: 'ralfSaturdayDone' }, effects: [] },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_ralf_saturday', inMinutes: 20 }],
      },
      { effects: [...ralfRings('saturday')] },
    ],
  },
  {
    id: 'ev_ralf_callback',
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { notFlag: 'ralfCallbackPending' }, effects: [] },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_ralf_callback', inMinutes: 20 }],
      },
      { effects: [{ type: 'setFlag', id: 'ralfCallbackPending', value: false }, ...ralfRings('callback')] },
    ],
  },
  {
    id: 'ev_ralf_ring_end',
    repeatable: true,
    variants: [
      {
        when: { ringing: true },
        effects: [
          { type: 'telecom', op: 'stopRinging' },
          { type: 'cancelEvent', id: 'ev_ring_reminder' },
          {
            type: 'say',
            text: 'Unten nimmt deine Mutter ab. Kurz darauf ruft sie hoch: »Jan! Das war Ralf. Du sollst ihn zurückrufen!«',
          },
          { type: 'setFlag', id: 'ralfSaturdayDone', value: true },
        ],
      },
      { effects: [] },
    ],
  },

  // ── Schlüssel-Strang (P07–P09): drei Fragmente des Schlüssels von Diskette 2 ─────────────────────
  {
    id: 'ev_ralf_cassette',
    at: GAME_CONFIG.keyStrand.cassetteAt,
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { flag: 'cassetteDelivered' }, effects: [] },
      // Schwer: Ralf sucht nur, wenn Jan ihn gezielt nach dem Band gefragt hat (FRAGE RALF NACH DEM BAND).
      { when: { all: [{ flag: 'hardMode' }, { notFlag: 'ralfAskedTape' }] }, effects: [] },
      {
        when: { any: [{ flag: 'away' }, { ringing: true }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_ralf_cassette', inMinutes: 30 }],
      },
      {
        when: { rel: 'ralfTrust', below: 'trusting' },
        effects: [
          ...cassetteArrives(),
          {
            type: 'say',
            text: 'Kurz darauf kommt deine Mutter die Treppe hoch. »Das war Ralf. Er hatte es eilig, wollte nicht reinkommen – das soll ich dir geben.« Sie drückt dir eine Kassette in die Hand.',
          },
          ...cassetteGiven(),
        ],
      },
      {
        when: { flag: 'ralfKnowsModule' },
        effects: [
          ...cassetteArrives(),
          ...ralfAtDoor(
            '»Du wolltest doch alles, was mit dem Spiel zu tun hat. Mein Alter hat sein Arbeitszimmer ausgemistet, da stand ein Karton für den Sperrmüll. Die hier lag ganz unten. Steht WT-07 drauf – wie auf der Diskette.«',
          ),
          ...cassetteGiven(),
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Und Jan – sei vorsichtig mit dem Modul-Kram, ja? Mein Alter ist komisch drauf in letzter Zeit.« Dann ist er wieder weg.',
          },
          { type: 'audio', cue: 'door' },
        ],
      },
      {
        effects: [
          ...cassetteArrives(),
          ...ralfAtDoor(
            '»Mein Alter hat sein Arbeitszimmer ausgemistet. Im Karton für den Sperrmüll lag die hier – steht WT-07 drauf, wie auf der Diskette. Vielleicht ist da noch was vom Spiel drauf. Du hast doch noch deine alte Datasette.«',
          ),
          ...cassetteGiven(),
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Meine Mutter wartet unten im Auto. Erzähl mir, was drauf ist!« Dann ist er wieder weg.',
          },
          { type: 'audio', cue: 'door' },
        ],
      },
    ],
  },
  {
    id: 'ev_key_first_part',
    trigger: { any: [{ fact: 'key_part_1' }, { fact: 'key_part_2' }, { fact: 'key_part_3' }] },
    variants: [{ effects: [{ type: 'puzzle', id: 'P08', status: 'discovered' }] }],
  },
  {
    id: 'ev_key_complete',
    trigger: { all: [{ fact: 'key_part_1' }, { fact: 'key_part_2' }, { fact: 'key_part_3' }] },
    variants: [
      {
        when: { flag: 'hardMode' },
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Drei Fragmente, je vier Ziffern. Ohne Diskette 2 fragt das Modul nach einem zwölfstelligen »Ersatzschlüssel« – genau dafür. Nur: in welcher Reihenfolge? Das Modul prüft nichts. Das Rundschreiben wird es dir zeigen.',
          },
          { type: 'discoverFact', id: 'key_complete' },
          { type: 'puzzle', id: 'P08', status: 'solved' },
          { type: 'puzzle', id: 'P09', status: 'discovered' },
        ],
      },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: `Drei Teile, zwölf Ziffern: ${GAME_CONFIG.keyStrand.parts.join(' ')}. Ohne Diskette 2 fragt das Modul nach einem »Ersatzschlüssel« – genau dafür.`,
          },
          { type: 'discoverFact', id: 'key_complete' },
          { type: 'puzzle', id: 'P08', status: 'solved' },
          { type: 'puzzle', id: 'P09', status: 'discovered' },
        ],
      },
    ],
  },

  // Akt 2 beginnt für DENKE NACH, sobald das Rundschreiben lesbar ist oder Jan im Club war.
  {
    id: 'ev_act2_hint',
    trigger: { any: [{ fact: 'k01_decrypted' }, { flag: 'clubAttended' }, { fact: 'ghost_offer' }] },
    variants: [{ effects: [{ type: 'puzzle', id: 'P10', status: 'discovered' }] }],
  },

  // ── Ende von Akt 2: Jans Entscheidung (Vertrauen in GHOST, Ralf einweihen, beides oder allein) ──
  {
    id: 'ev_act2_end',
    at: GAME_CONFIG.ghost.actTwoEndsAt,
    variants: [
      {
        when: { all: [{ flag: 'toldGhost' }, { flag: 'toldRalf' }] },
        effects: [
          { type: 'setFlag', id: 'act2Choice', value: 'both' },
          {
            type: 'say',
            kind: 'story',
            text: '20:00. Zwei Menschen wissen es jetzt: ein Mann, der unter Decknamen schreibt, und ein Junge, der kein Geheimnis halten kann. Keiner kennt den anderen. Wenn einer redet, redet bald der Dritte. Die Uhr auf dem Fernseher unten springt um. Kein Zurück mehr.',
          },
        ],
      },
      {
        when: { flag: 'toldGhost' },
        effects: [
          { type: 'setFlag', id: 'act2Choice', value: 'ghost' },
          {
            type: 'say',
            kind: 'story',
            text: '20:00. GHOSTs Antwort steht noch auf dem Bildschirm: Spuren löschen. Still sein. Auf mein Zeichen warten. Jemand hat den Überblick. Gut. Nur: Woher weiß er so genau, worum es geht?',
          },
        ],
      },
      {
        when: { flag: 'toldRalf' },
        effects: [
          { type: 'setFlag', id: 'act2Choice', value: 'ralf' },
          {
            type: 'say',
            kind: 'story',
            text: '20:00. Ralf hört im Haus mit, du beobachtest das Netz. Zwei Jungen gegen etwas, das keiner von euch kennt. Und im Computerclub sitzt ein Mann mit Thermoskanne, dem du nicht traust – und den du nicht ignorieren kannst.',
          },
        ],
      },
      {
        effects: [
          { type: 'setFlag', id: 'act2Choice', value: 'alone' },
          {
            type: 'say',
            kind: 'story',
            text: '20:00. Niemand weiß etwas. Nicht GHOST, nicht Ralf. Du bist allein mit einem Bildschirm, der mehr weiß als du. Allein bist du unsichtbar. Allein bist du aber auch ohne Hilfe, wenn es ernst wird.',
          },
        ],
      },
    ],
  },
  // ── Senden im geheimen Netz (Modul mit Schlüssel) ──────────────────────────────────────────────
  {
    id: 'ev_net_reply',
    variants: [
      {
        when: { rel: 'networkCredibility', atLeast: 'established' },
        effects: [{ type: 'setFlag', id: 'netMeeting', value: true }],
      },
      {
        effects: [
          { type: 'setFlag', id: 'netWho', value: true },
          { type: 'changeRelationship', id: 'seidelSuspicion', delta: 10 },
        ],
      },
    ],
  },
  {
    id: 'ev_finale_k01',
    variants: [
      { when: { flag: 'gameOver' }, effects: [] },
      {
        when: { rel: 'networkCredibility', atLeast: 'established' },
        effects: [{ type: 'gameOver', ending: 'end_abort' }],
      },
      {
        effects: [
          { type: 'changeRelationship', id: 'seidelSuspicion', delta: 15 },
          {
            type: 'say',
            kind: 'thought',
            text: 'Keine Antwort. Natürlich nicht. Wer nimmt schon eine Warnung von einer Testkennung ernst, die nie etwas gesagt hat? Du hast dich nur verraten.',
          },
        ],
      },
    ],
  },
  // ── Finale: Operation REWIND (Fr. 21.11., Vorschlag) ───────────────────────────────────────────────
  {
    id: 'ev_finale_open',
    at: GAME_CONFIG.ghost.actTwoEndsAt,
    variants: [
      {
        effects: [
          { type: 'setFlag', id: 'finaleOpen', value: true },
          { type: 'puzzle', id: 'P11', status: 'discovered' },
          {
            type: 'say',
            kind: 'thought',
            text: 'Heute Nacht. »Operation REWIND beginnt Freitag« – und Freitag ist jetzt. Um 23:30 ist es vorbei, so oder so. Drei Wege: die 110. GHOST, über die Club-Mailbox, offen bis Mitternacht. Ralf, solange man dort noch anrufen kann. Oder nichts tun.',
          },
          { type: 'ui', effect: { type: 'autosave', reason: 'Beginn des Finales' } },
        ],
      },
    ],
  },
  {
    id: 'ev_finale_police',
    variants: [
      {
        when: {
          all: [
            ...GAME_CONFIG.finale.requiredEvidence.map((fact) => ({ fact })),
            { factsAtLeast: { of: GAME_CONFIG.finale.evidence, n: GAME_CONFIG.finale.strongEvidence } },
          ],
        },
        effects: [{ type: 'gameOver', ending: 'end_exposed' }],
      },
      { effects: [{ type: 'gameOver', ending: 'end_dismissed' }] },
    ],
  },
  {
    id: 'ev_finale_ghost',
    variants: [{ effects: [{ type: 'gameOver', ending: 'end_cover' }] }],
  },
  {
    id: 'ev_finale_ralf',
    variants: [
      {
        when: { rel: 'ralfTrust', atLeast: 'trusting' },
        effects: [{ type: 'gameOver', ending: 'end_ralf_stops' }],
      },
      { effects: [{ type: 'gameOver', ending: 'end_ralf_betrayal' }] },
    ],
  },
  {
    id: 'ev_finale_seidel',
    at: GAME_CONFIG.finale.seidelCallAt,
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { any: [{ flag: 'gameOver' }, { flag: 'seidelCallDone' }] }, effects: [] },
      {
        when: { timeAfter: GAME_CONFIG.finale.seidelCallUntil },
        effects: [{ type: 'setFlag', id: 'seidelCallDone', value: true }],
      },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_finale_seidel', inMinutes: 10 }],
      },
      {
        effects: [
          { type: 'telecom', op: 'ring', who: 'seidel' },
          { type: 'audio', cue: 'phone_ring' },
          { type: 'say', kind: 'caption', text: '[Das Telefon klingelt.]' },
          { type: 'say', text: 'Das Telefon klingelt. Um diese Zeit?' },
          { type: 'scheduleEvent', id: 'ev_finale_seidel_end', inMinutes: 3 },
        ],
      },
    ],
  },
  {
    id: 'ev_finale_seidel_end',
    variants: [
      {
        when: { ringing: true },
        effects: [
          { type: 'telecom', op: 'stopRinging' },
          { type: 'setFlag', id: 'seidelCallDone', value: true },
          { type: 'changeRelationship', id: 'seidelSuspicion', delta: 5 },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '(von unten) »Jan? Das war Herr Seidel, Ralfs Stiefvater. Er wollte dich sprechen. Er klang … komisch. Ich hab gesagt, du schläfst schon.«',
          },
          { type: 'discoverFact', id: 'seidel_called' },
        ],
      },
      { effects: [] },
    ],
  },
  {
    id: 'ev_finale_close_early',
    variants: [
      { when: { flag: 'gameOver' }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Viel zu früh wird es still im Netz. Seidel hat nicht bis halb zwölf gewartet.',
          },
          { type: 'gameOver', ending: 'end_silent' },
        ],
      },
    ],
  },
  {
    id: 'ev_finale_close',
    at: GAME_CONFIG.finale.closesAt,
    variants: [
      { when: { flag: 'gameOver' }, effects: [] },
      { effects: [{ type: 'gameOver', ending: 'end_silent' }] },
    ],
  },

  // ── Computerclub (Kontakt zu GHOST, GDD §3.4) ──────────────────────────────────────────────────
  {
    id: 'ev_club_reminder',
    at: `${GAME_CONFIG.club.eveningDate}T${GAME_CONFIG.club.leaveFrom}`,
    variants: [
      {
        when: { all: [{ fact: 'club_evening' }, { notFlag: 'away' }] },
        effects: [
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '(von unten) »Jan, ist heute nicht dein Computerclub? Wenn du hinwillst, musst du langsam los!«',
          },
          { type: 'say', kind: 'system', text: '(GEHE ZUM CLUB – bis 19:30 Uhr.)' },
        ],
      },
      { effects: [] },
    ],
  },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

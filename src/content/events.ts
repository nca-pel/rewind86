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
function ralfRings(reason: 'saturday' | 'callback' | 'match' | 'sunday' | 'tuesday'): GameEffect[] {
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

/** Jan erinnert sich an die Datasette: Sie steht verstaubt hinter dem Monitor und kommt zum Anschließen obenauf */
function datasetteFound(): GameEffect[] {
  return [
    {
      type: 'say',
      text: 'Eine Datasette? Du denkst kurz nach, dann schiebst du den Monitor ein Stück vor. Und tatsächlich: Hinter ihm, unter einer Staubschicht, steht noch deine alte Datasette – seit du die 1541 hast, hat sie niemand mehr angefasst. Du wischst sie mit dem Ärmel ab und stellst sie oben auf den Monitor. Der Stecker hängt noch lose herunter.',
    },
    { type: 'setFlag', id: 'datasetteFound', value: true },
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
            text: 'Samstag – und trotzdem Schule. Vier Stunden: Physik bei Herrn Wiegand (Stromkreise, du hättest sie im Schlaf zeichnen können), Deutsch, Erdkunde, zuletzt Kunst. In der großen Pause steht Tobias an der Fahrradständerreihe und erzählt, dass er sich am Wochenende Demos aus den Boxen zieht. »Dafür brauchst du formatierte Disketten«, sagt er. »Neue sind erst mal leer und unformatiert, sonst frisst die 1541 gar nichts.« Du nickst. Zu Hause liegt noch ein Fünferpack in der Schublade, und das Heimcomputer-Journal hat eine Diskettenseite.',
            backText:
              'Kurz nach zwölf bist du wieder zu Hause, die Tasche fliegt in die Ecke. Endlich Wochenende – zumindest der Rest davon. Der Plan für heute steht: eine der neuen Disketten aus der Schublade formatieren, dann abends die Boxen.',
          },
          { type: 'discoverFact', id: 'plan_saturday' },
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
        when: { weekday: 'Samstag' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Deine Mutter ruft zum Abendbrot. Samstags gibt es Bratkartoffeln mit Spiegelei. Dein Vater liest dabei die Wochenendzeitung von hinten nach vorn und liest dir die Meldung vor, dass die Volkszählung im nächsten Jahr wohl doch kommt. »Die wollen alles wissen«, brummt er. »Sogar, wie viele Zimmer man hat.«',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
      {
        when: { weekday: 'Sonntag' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Zum Abendbrot kommt die Familie zusammen: kalter Braten vom Mittag, dazu Brot und saure Gurken. Deine Mutter erzählt von Tante Gisela und ihrem Rücken, dein Vater schaut auf die Uhr, weil die Tagesschau gleich anfängt, und fragt nebenbei, ob du die Woche etwas Vernünftiges vorhast.',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
      {
        when: { weekday: 'Montag' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Deine Mutter ruft zum Abendbrot. Dein Vater ist von der Frühschicht müde und erzählt vom Ärger mit dem neuen Zulieferer in der Möbelfabrik. Deine Mutter stellt dir die Teekanne hin und fragt, ob die Hausaufgaben fertig sind. Im Fernsehen laufen die Nachrichten.',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
      {
        when: { weekday: 'Dienstag' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Deine Mutter hat Kartoffelsuppe gekocht. Dein Vater kommentiert den Wetterbericht (»Das wird nichts mehr vor Dezember«) und die Telefonrechnung vom letzten Monat gleich mit: »Nur, damit wir uns verstehen: 0,23 Mark die Einheit.«',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
      {
        when: { weekday: 'Mittwoch' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Heute ist Buß- und Bettag, und deine Mutter hat sich Zeit genommen: Es gibt Rouladen. Dein Vater ist ungewöhnlich gesprächig und redet über die Nachrichten, deine Mutter fragt, ob du in letzter Zeit schlecht schläfst, du siehst blass aus.',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
      {
        when: { weekday: 'Donnerstag' },
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: DINNER_END,
            text: 'Deine Mutter ruft zum Abendbrot, früh genug vor dem Club. »Iss ordentlich, Jan, wer weiß, wann du wiederkommst.« Dein Vater lässt die Zeitung sinken und fragt, was ein Computerclub eigentlich den ganzen Abend macht. »Disketten tauschen«, sagst du. Er nickt, als würde das etwas erklären.',
            backText: 'Satt und ein bisschen ungeduldig gehst du wieder nach oben an deinen Schreibtisch.',
          },
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
    variants: [
      {
        when: { weekday: 'Samstag' },
        effects: [{ type: 'pocketMoney' }],
      },
      { effects: [] },
    ],
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
      ...(['match', 'sunday', 'tuesday'] as const).map((reason) => ({
        when: { all: [{ ringing: true as const }, { flag: 'ralfCallReason', eq: reason }] },
        effects: [
          { type: 'telecom', op: 'stopRinging' } as GameEffect,
          { type: 'cancelEvent', id: 'ev_ring_reminder' } as GameEffect,
          {
            type: 'say',
            text: 'Unten nimmt deine Mutter ab. Kurz darauf ruft sie hoch: »Jan! Das war Ralf. Du sollst ihn zurückrufen!«',
          } as GameEffect,
          { type: 'setFlag', id: 'ralfMissedCall', value: reason } as GameEffect,
        ],
      })),
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
          { type: 'setFlag', id: 'ralfMissedCall', value: true },
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
            text: 'Kurz darauf kommt deine Mutter die Treppe hoch. »Das war Ralf. Er hatte es eilig, wollte nicht reinkommen – das soll ich dir geben.« Sie drückt dir eine Kassette in die Hand. »Er meinte, du hättest bestimmt noch eine Datasette?«',
          },
          ...cassetteGiven(),
          ...datasetteFound(),
        ],
      },
      {
        when: { flag: 'ralfKnowsModule' },
        effects: [
          ...cassetteArrives(),
          ...ralfAtDoor(
            '»Du wolltest doch alles, was mit dem Spiel zu tun hat. Mein Alter hat sein Arbeitszimmer ausgemistet, da stand ein Karton für den Sperrmüll. Die hier lag ganz unten. Steht WT-07 drauf – wie auf der Diskette. Ist ein Datenband – du hast doch noch eine Datasette, oder?«',
          ),
          ...cassetteGiven(),
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Und Jan – sei vorsichtig mit dem Modul-Kram, ja? Mein Alter ist komisch drauf in letzter Zeit.« Dann ist er wieder weg.',
          },
          { type: 'audio', cue: 'door' },
          ...datasetteFound(),
        ],
      },
      {
        effects: [
          ...cassetteArrives(),
          ...ralfAtDoor(
            '»Mein Alter hat sein Arbeitszimmer ausgemistet. Im Karton für den Sperrmüll lag die hier – steht WT-07 drauf, wie auf der Diskette. Vielleicht ist da noch was vom Spiel drauf. Du hast doch noch eine Datasette, oder?«',
          ),
          ...cassetteGiven(),
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Meine Mutter wartet unten im Auto. Erzähl mir, was drauf ist!« Dann ist er wieder weg.',
          },
          { type: 'audio', cue: 'door' },
          ...datasetteFound(),
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
            text: 'Heute Nacht. »Operation REWIND beginnt Freitag« – und Freitag ist jetzt. Um 23:30 ist es vorbei, so oder so. Irgendwann heute Abend könnte jemand anrufen – dann nimm den Hörer ab. Drei Wege: die 110. GHOST, über die Club-Mailbox, offen bis Mitternacht. Ralf, solange man dort noch anrufen kann. Oder nichts tun.',
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
            text: '(von unten) »Jan? Das war Herr Seidel, Ralfs Stiefvater. Er wollte dich sprechen. Er klang … komisch. Ich hab gesagt, du hast das Klingeln wohl nicht gehört. Er meinte, es sei nicht wichtig.«',
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

  // ── Wochenfüllung (Continuity): Samstagabend, Sonntag, Dienstag, Mittwoch, Freitag ──────────────
  {
    id: 'ev_sat_match_call',
    at: '1986-11-15T17:45',
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { timeAfter: '1986-11-15T21:00' }, effects: [] },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_sat_match_call', inMinutes: 20 }],
      },
      { effects: [...ralfRings('match')] },
    ],
  },
  {
    id: 'ev_sun_lunch',
    at: '1986-11-16T12:30',
    variants: [
      { when: { flag: 'away' }, effects: [] },
      {
        effects: [
          {
            type: 'absence',
            kind: 'meal',
            until: '13:45',
            text: 'Sonntagsbraten. Heute ist Volkstrauertag, im Radio läuft die Feierstunde aus Bonn, und dein Vater hört mit gesenktem Kopf zu. Beim Nachtisch erzählt er von deinem Großvater, der nie viel über den Krieg gesprochen hat – nur dass er jedes Jahr an diesem Tag still zum Friedhof ging. Deine Mutter schiebt dir den Rotkohl zu: »Iss. Und danach gehst du an die frische Luft, nicht wieder an den Computer.« Du sagst, vielleicht kommt ja Besuch.',
            backText: 'Satt und etwas nachdenklich gehst du wieder nach oben an deinen Schreibtisch.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_sun_ralf_call',
    at: '1986-11-16T14:30',
    repeatable: true,
    interrupts: true,
    variants: [
      {
        when: { any: [{ rel: 'ralfTrust', below: 'trusting' }, { timeAfter: '1986-11-16T15:30' }] },
        effects: [],
      },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_sun_ralf_call', inMinutes: 10 }],
      },
      { effects: [...ralfRings('sunday')] },
    ],
  },
  {
    id: 'ev_sun_ralf_arrive',
    at: '1986-11-16T15:45',
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { any: [{ flag: 'ralfVisit' }, { not: { date: '1986-11-16' } }] }, effects: [] },
      {
        when: { any: [{ rel: 'ralfTrust', below: 'trusting' }, { timeAfter: '1986-11-16T17:30' }] },
        effects: [
          {
            type: 'say',
            text: 'Deine Mutter ruft nach oben: »Jan, Ralf hat angerufen. Er schafft es heute nicht mehr, es ist zu spät geworden.«',
          },
        ],
      },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }, { flag: 'finaleOpen' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_sun_ralf_arrive', inMinutes: 15 }],
      },
      {
        effects: [
          { type: 'audio', cue: 'doorbell' },
          { type: 'say', kind: 'caption', text: '[Es klingelt an der Haustür.]' },
          {
            type: 'say',
            text: 'Unten klappt die Tür, dann hörst du Stimmen, Geschirrklappern und deine Mutter, die »Marmorkuchen!« ruft. Kurz darauf poltert Ralf die Treppe hoch: Fahrradhelm unter dem Arm, ein Mathebuch obenauf in der Sporttasche. Hinter ihm balanciert deine Mutter ein Tablett mit zwei Tassen und einem Teller Kuchen.',
          },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'MUTTER',
            text: '»Mathe, ja? Mit dem Computer?« Sie stellt das Tablett ab und mustert die beiden. »Soso. Ich komm in zwei Stunden mit der Wäsche vorbei.«',
          },
          {
            type: 'say',
            kind: 'dialog',
            speaker: 'RALF',
            text: '»Handel ist angewandte Mathematik, Frau Keller.« Er grinst, bis sie weg ist. Dann lässt er sich auf deinen Stuhl fallen. »Los, starten wir das Ding!«',
          },
          {
            type: 'say',
            text: 'Ihr startet FERNHANDEL und handelt abwechselnd: Kaffee aus Hamburg, Stahl aus Köln, einen Kredit, den ihr beide zu spät abbezahlt. Ralf ist ehrgeizig und flucht bei jedem Preissturz. Zwischendurch wird er stiller, und man merkt, dass er noch etwas sagen will.',
          },
          { type: 'setFlag', id: 'ralfVisit', value: true },
          { type: 'setFlag', id: 'ralfPresent', value: true },
          { type: 'setFlag', id: 'away', value: 'visit' },
          { type: 'startConversation', npc: 'ralf' },
          { type: 'scheduleEvent', id: 'ev_sun_ralf_end', inMinutes: 155 },
          {
            type: 'say',
            kind: 'system',
            text: '(Ralf ist bei dir. FRAGE RALF NACH … – z. B. DEM SPIEL, SEIDEL, DER DISKETTE, FRÜHER oder DEM MODUL. THEMEN zeigt mehr. VERABSCHIEDE DICH beendet den Besuch.)',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_sun_ralf_end',
    variants: [{ when: { flag: 'ralfVisit' }, effects: [{ type: 'endRalfVisit' }] }, { effects: [] }],
  },
  {
    id: 'ev_tue_ralf_call',
    at: '1986-11-18T20:00',
    repeatable: true,
    interrupts: true,
    variants: [
      { when: { timeAfter: '1986-11-18T21:30' }, effects: [] },
      {
        when: { any: [{ lineBusy: true }, { ringing: true }, { flag: 'away' }] },
        effects: [{ type: 'scheduleEvent', id: 'ev_tue_ralf_call', inMinutes: 20 }],
      },
      { effects: [...ralfRings('tuesday')] },
    ],
  },
  {
    id: 'ev_wed_morning',
    at: '1986-11-19T09:30',
    variants: [
      { when: { flag: 'away' }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            text: 'Buß- und Bettag. Unten ist es ungewohnt still: Dein Vater sitzt im Wohnzimmer, hört die Radiopredigt und liest dabei die Zeitung vom Anfang bis zum Ende. Deine Mutter backt. Als du die Treppe herunterkommst, drückt sie dir einen Becher Kakao in die Hand: »Heute ist Feiertag, Jan. Heute wird nichts gewählt, ja? Das Telefon braucht Ruhe.«',
          },
          {
            type: 'say',
            kind: 'thought',
            text: 'Ein ganzer freier Tag. Bis Ralf sich meldet, bleibt Zeit, den Schlüssel zu sortieren: ein Teil im Spiel, ein Teil im Netz, und der dritte soll irgendwo auf einem Band liegen.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_fri_storm',
    at: '1986-11-21T17:30',
    variants: [
      { when: { flag: 'away' }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Draußen biegen sich die Bäume, ein Dachziegel klappert irgendwo. Die Radiomeldung von heute früh fällt dir ein: Sturm am Abend. Und um acht läuft das ab, was seit Tagen auf dich zukommt. Höchste Zeit, alles zu ordnen: Was weißt du? Wem traust du?',
          },
        ],
      },
    ],
  },

  // ── Freitagabend (14.11.): Zeit zwischen Mailbox und Schlafen füllen, ohne den Plot zu bewegen ───
  {
    id: 'ev_fri_listing',
    at: '1986-11-14T19:30',
    variants: [
      { when: { any: [{ fact: 'listing_read' }, { flag: 'away' }] }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Halb acht, und die Mailbox ist abgegrast. Im Heimcomputer-Journal wirbt der Umschlag mit einem »Listing des Monats« zum Abtippen. Das richtige Programm für einen Freitagabend – und Papier und Finger hast du ja.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_fri_tagesschau',
    at: '1986-11-14T20:00',
    variants: [
      { when: { flag: 'away' }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            text: 'Von unten dringt die Titelmelodie der Tagesschau herauf. Dein Vater kommentiert die Nachrichten laut für niemanden Bestimmtes – irgendwas mit Bonn und der Kronzeugenregelung.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_fri_late',
    at: '1986-11-14T20:40',
    variants: [
      { when: { any: [{ flag: 'away' }, { fact: 'knacker_won' }] }, effects: [] },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Bald neun. Die Mutter wird gleich fragen, ob du nicht langsam ins Bett willst. Aber ein Rätsel will gelöst sein – oder schläft man besser darüber?',
          },
        ],
      },
    ],
  },

  // ── Alltag mit Ziel: kleine Gedanken an den toten Tagen Sa–Di (Wegweiser, keine Lösungen) ─────────
  {
    id: 'ev_sun_thought',
    at: '1986-11-16T19:30',
    variants: [
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Sonntagabend. Der Zählerstand ist abgelesen, die Rechnung hängt wie ein Damoklesschwert über dem Telefon. Die Nummer 41973 geht dir nicht aus dem Kopf. Vielleicht liegt dort bald Post – nachts wird in den Boxen gern getuschelt, wenn niemand lauscht.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_mon_thought',
    at: '1986-11-17T14:15',
    variants: [
      {
        when: { fact: 'key_part_2' },
        effects: [],
      },
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Montag, kurz nach der Schule. Ob im KNOTEN WEST inzwischen etwas liegt? Nach acht Uhr morgens vielleicht. Mit dem Modul kommst du hinein – ein Anruf kostet allerdings Einheiten.',
          },
        ],
      },
    ],
  },
  {
    id: 'ev_tue_thought',
    at: '1986-11-18T19:30',
    variants: [
      {
        effects: [
          {
            type: 'say',
            kind: 'thought',
            text: 'Morgen ist Buß- und Bettag, schulfrei. Ein freier Tag ohne Schule – ideal, um dem Schlüssel hinterherzujagen. Ein Teil steckt im Spiel selbst, einer im Netz. Und der dritte? Frag doch mal Ralf, ob er noch etwas vom Spiel gefunden hat.',
          },
        ],
      },
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

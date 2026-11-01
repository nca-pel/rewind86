/**
 * Telefon, Hausleitung und Akustikkoppler. Es wird nie eine echte Verbindung hergestellt;
 * alle Nummern werden ausschließlich gegen das fiktive Telefonbuch aufgelöst.
 */
import { DIALOGUE, DIALOGUE_FALLBACK, TOPIC_BY_ID } from '../content/dialogue';
import { MAILBOXES, PHONEBOOK } from '../content/networks';
import { modkDropCarrier } from '../sim/apps/modk';
import { btxDropCarrier } from '../sim/apps/btx';
import { termDropCarrier } from '../sim/apps/term';
import { GAME_CONFIG } from '../content/config';
import { isOpen } from './bbs';
import { diffMinutes } from './clock';
import { nextRalfHome, ralfWhere } from './routine';
import { houseLineBusy } from './conditions';
import type { Ctx } from './context';
import { applyEffects, discoverFact, scheduleEvent, setPuzzle } from './effects';
import { evalCondition } from './conditions';
import type { CallState } from './types';

const RALF_MAX_TURNS = 6;

function newCall(ctx: Ctx, partial: Partial<CallState> & Pick<CallState, 'kind'>): CallState {
  return {
    with: null,
    number: null,
    startedAt: ctx.state.gameClock,
    unitsCharged: 0,
    outgoing: true,
    ...partial,
  };
}

/** Datenverbindung bricht ab (Hörer aus dem Koppler / aufgelegt). */
export function dropCarrier(ctx: Ctx): void {
  const t = ctx.state.telecom;
  if (t.connectedSystemId) {
    t.connectedSystemId = null;
    t.currentUserHandle = null;
    ctx.say('Auf dem Monitor erscheint: NO CARRIER. Die Verbindung ist weg.');
  }
  ctx.state.objectStates.coupler.carrier = false;
  modkDropCarrier(ctx);
  termDropCarrier(ctx);
}

export function pickUp(ctx: Ctx): number {
  const t = ctx.state.telecom;
  if (t.handset === 'hand') {
    ctx.say('Du hältst den Hörer bereits in der Hand.');
    return 0;
  }
  if (t.handset === 'coupler') {
    t.handset = 'hand';
    if (t.call?.kind === 'carrier' || t.connectedSystemId) {
      dropCarrier(ctx);
      ctx.say('Du ziehst den Hörer aus den Gummimuffen. Aus der Muschel pfeift das Modem der Gegenstelle.');
    } else ctx.say('Du ziehst den Hörer aus den Gummimuffen des Kopplers.');
    return 0;
  }
  if (t.connectedSystemId === 'btx') {
    btxDropCarrier(ctx);
    ctx.say(
      'Du nimmst den Hörer ab – im selben Moment bricht das Postmodem die Verbindung ab. Auf dem Monitor steht: VERBINDUNG GETRENNT.',
    );
  }
  t.handset = 'hand';
  if (t.ringing === 'ralf' && ctx.state.flags.ralfDelivered) return answerRalfLater(ctx);
  if (t.ringing === 'ralf') {
    t.ringing = null;
    t.call = newCall(ctx, { kind: 'voice', with: 'ralf', outgoing: false });
    for (const ev of ctx.state.scheduledEvents)
      if (ev.id === 'ev_ring_reminder' && ev.status === 'pending') ev.status = 'cancelled';
    ctx.state.conversation = { npc: 'ralf', turns: 0 };
    ctx.state.mode = 'conversation';
    ctx.state.parser.lastObjectId = 'ralf';
    ctx.say('Du nimmst den Hörer ab.');
    ctx.say(
      '»Jan? Ich bin’s, Ralf. Ich hab was, das musst du sehen. Ein Spiel, das es noch gar nicht zu kaufen gibt! Ich bring dir die Diskette gleich vorbei – aber nur kurz, ich muss danach sofort weiter.«',
      'dialog',
      'RALF',
    );
    for (const id of ['spiel', 'diskette', 'training', 'treffen'])
      if (!ctx.state.knownTopics.includes(id)) ctx.state.knownTopics.push(id);
    discoverFact(ctx, 'ralf_phone');
    ctx.say(
      '(Du kannst Ralf etwas fragen, z. B. FRAGE RALF NACH DEM SPIEL – THEMEN zeigt mögliche Themen. LEGE AUF beendet das Gespräch.)',
      'system',
    );
    return 1;
  }
  if (t.ringing === 'anon') {
    // Symptom von Seidels Verdacht (ev_susp_dangerous). TODO-STORY: Wer anruft, bleibt offen.
    t.ringing = null;
    t.call = newCall(ctx, { kind: 'dead', with: 'anon', outgoing: false });
    ctx.state.flags.anonCallDone = true;
    for (const ev of ctx.state.scheduledEvents)
      if (ev.id === 'ev_anon_call_end' && ev.status === 'pending') ev.status = 'cancelled';
    ctx.say('Du nimmst ab. »Ja? Keller.«');
    ctx.say(
      'Stille. Kein Wort, nur ein leises Rauschen – und irgendwo im Hintergrund atmet jemand. Dann klickt es. Aufgelegt.',
    );
    discoverFact(ctx, 'anon_call');
    return 1;
  }
  if (houseLineBusy(ctx.state)) {
    t.call = newCall(ctx, { kind: 'occupied', outgoing: false });
    ctx.say(
      'Du nimmst den Hörer ab – und hörst deinen Vater: »… ja, Mutter, wir kommen Sonntag …« Die Leitung ist belegt.',
    );
    return 0;
  }
  t.call = newCall(ctx, { kind: 'dialtone', outgoing: false });
  ctx.cue('dialtone');
  ctx.say('Du nimmst den Hörer ab. Das Freizeichen tutet.');
  return 0;
}

/** Ralf ruft an einem späteren Zeitpunkt an (Samstag, Rückruf). */
function answerRalfLater(ctx: Ctx): number {
  const s = ctx.state;
  const t = s.telecom;
  t.ringing = null;
  t.call = newCall(ctx, { kind: 'voice', with: 'ralf', outgoing: false });
  for (const ev of s.scheduledEvents)
    if ((ev.id === 'ev_ring_reminder' || ev.id === 'ev_ralf_ring_end') && ev.status === 'pending')
      ev.status = 'cancelled';
  if (s.flags.ralfCallReason === 'saturday') s.flags.ralfSaturdayDone = true;
  startRalfTalk(ctx);
  ctx.say('Du nimmst den Hörer ab.');
  ctx.say(
    s.flags.ralfCallReason === 'saturday'
      ? '»Na? Und? Erzähl schon! Was ist auf der Diskette? Läuft das Ding?«'
      : '»Hi, hier ist Ralf. Meine Mutter meinte, du hättest angerufen?«',
    'dialog',
    'RALF',
  );
  return 1;
}

function startRalfTalk(ctx: Ctx): void {
  const s = ctx.state;
  s.conversation = { npc: 'ralf', turns: 0 };
  s.mode = 'conversation';
  s.parser.lastObjectId = 'ralf';
  if (!s.knownTopics.includes('modul') && s.knownFacts.includes('needs_disk2')) s.knownTopics.push('modul');
}

/** Bei Ralf anrufen (nach der Übergabe): Erreichbarkeit nach Wochenplan, sonst Rückruf. */
function dialRalf(ctx: Ctx, number: string): number {
  const s = ctx.state;
  const t = s.telecom;
  const where = ralfWhere(s.gameClock);
  if (where === 'home') {
    t.call = newCall(ctx, { kind: 'voice', with: 'ralf', number });
    s.flags.ralfCallbackPending = false;
    const evening = s.gameClock.slice(11, 16) >= '19:30';
    if (evening) {
      ctx.say(
        '»Seidel.« Eine ruhige Männerstimme – Ralfs Stiefvater. »Ralf? Einen Moment.« Du hörst, wie er den Hörer hinlegt und nach oben ruft.',
      );
      if (evalCondition(s, { rel: 'seidelSuspicion', atLeast: 'noticeable' }))
        ctx.say('Hat er eben einen Augenblick zu lange gezögert, bevor er nach Ralf gerufen hat?', 'thought');
    } else ctx.say('»Bei Seidel?« – Ralfs Mutter. »Ach, der Jan. Ich hol ihn.«');
    startRalfTalk(ctx);
    ctx.say('»Jan! Was gibt’s?«', 'dialog', 'RALF');
    return 1;
  }
  t.call = newCall(ctx, { kind: 'dead', number });
  if (where === 'late') {
    ctx.say(
      'Es klingelt lange. Dann eine verschlafene Frauenstimme: »Bei Seidel? … Jan? Weißt du, wie spät es ist? Ralf schläft.« Klick.',
    );
    return 1;
  }
  const reason =
    where === 'school'
      ? 'ist noch in der Schule'
      : where === 'training'
        ? 'ist beim Training'
        : where === 'match'
          ? 'spielt heute Fußball, auswärts'
          : 'ist unterwegs';
  ctx.say(`»Bei Seidel?« – Ralfs Mutter. »Ralf ${reason}. Ich sag ihm, er soll dich zurückrufen.« Klick.`);
  const back = nextRalfHome(s.gameClock);
  if (back) {
    s.flags.ralfCallbackPending = true;
    // Ralf ruft etwa zehn Minuten nach seiner Heimkehr zurück
    scheduleEvent(ctx, 'ev_ralf_callback', diffMinutes(back, s.gameClock) + 10);
  }
  return 1;
}

export function hangUp(ctx: Ctx, quiet = false): number {
  const t = ctx.state.telecom;
  if (t.handset === 'cradle') {
    if (!quiet) ctx.say('Der Hörer liegt bereits auf der Gabel.');
    return 0;
  }
  const talkingToRalf = t.call?.with === 'ralf' && t.call.kind === 'voice';
  const wasRalf = talkingToRalf && !t.call!.outgoing && !ctx.state.flags.ralfDelivered;
  if (t.connectedSystemId || t.call?.kind === 'carrier') dropCarrier(ctx);
  if (wasRalf) {
    ctx.say('»Okay, bis gleich! Ich bin in zehn Minuten da.«', 'dialog', 'RALF');
    scheduleEvent(ctx, 'ev_doorbell', 12);
    ctx.state.flags.ralfCallDone = true;
  } else if (talkingToRalf && !quiet) ctx.say('»Alles klar. Bis dann!«', 'dialog', 'RALF');
  t.handset = 'cradle';
  t.call = null;
  ctx.state.objectStates.coupler.carrier = false;
  if (ctx.state.conversation?.npc === 'ralf') {
    ctx.state.conversation = null;
    ctx.state.mode = 'desk';
  }
  ctx.cue('hangup');
  if (!quiet) ctx.say('Du legst den Hörer auf die Gabel.');
  return 0;
}

export function dial(ctx: Ctx, number: string): number {
  const t = ctx.state.telecom;
  if (t.ringing) {
    ctx.say('Das Telefon klingelt gerade. Nimm erst ab.');
    return 0;
  }
  if (!number) {
    ctx.say('Welche Nummer möchtest du wählen? (z. B. WÄHLE 12345)');
    return 0;
  }
  if (t.handset === 'coupler') {
    ctx.say('Der Hörer steckt im Koppler. Nimm ihn erst heraus.');
    return 0;
  }
  if (t.handset === 'cradle') {
    pickUp(ctx);
    if (t.call?.kind === 'occupied') return 0;
  } else if (t.call && t.call.kind !== 'dialtone' && t.call.kind !== 'dead') {
    ctx.say('Du telefonierst gerade. Leg erst auf.');
    return 0;
  } else if (houseLineBusy(ctx.state)) {
    ctx.say('In der Leitung hörst du deinen Vater telefonieren. Wählen geht jetzt nicht.');
    return 0;
  }

  ctx.say(`Du wählst ${number.split('').join(' ')}.`);
  if ((number === '110' || number === '112') && ctx.state.flags.finaleOpen && !ctx.state.flags.gameOver) {
    ctx.say(
      '»Notruf Polizei Gütersloh, was ist passiert?« Dir bleibt der Atem weg. Dann erzählst du es, so ruhig du kannst, von Anfang an.',
      'dialog',
      'POLIZEI',
    );
    scheduleEvent(ctx, 'ev_finale_police', 6);
    return 1;
  }
  if (number === '110' || number === '112') {
    ctx.say(
      'Mitten im Wählen hältst du inne und drückst schnell auf die Gabel. Dafür gibt es keinen Grund – noch nicht.',
    );
    hangUp(ctx, true);
    return 1;
  }
  const entry = PHONEBOOK[number];
  if (!entry) {
    t.call = newCall(ctx, { kind: 'dead', number });
    ctx.say('Es knackt. Eine Frauenstimme vom Band: »Kein Anschluss unter dieser Nummer.«');
    return 1;
  }
  if (entry.kind === 'person' && entry.id === 'ralf') {
    if (ctx.state.flags.ralfDelivered) return dialRalf(ctx, number);
    t.call = newCall(ctx, { kind: 'dead', number });
    ctx.say('Besetzt. Ralf telefoniert wohl gerade selbst.');
    return 1;
  }
  const sys = MAILBOXES[entry.id];
  if (sys && !isOpen(sys, ctx.state.gameClock)) {
    // Außerhalb der Öffnungszeiten hängt die Leitung am normalen Telefon des Sysops.
    t.call = newCall(ctx, { kind: 'dead', number });
    ctx.say(
      'Es klingelt und klingelt – kein Pfeifton, niemand hebt ab. Die Mailbox hat wohl gerade geschlossen.',
    );
    return 1;
  }
  // Modem
  t.call = newCall(ctx, { kind: 'carrier', with: entry.id, number });
  ctx.cue('modem');
  ctx.say('[Ein hoher, gleichbleibender Pfeifton.]', 'caption');
  ctx.say(
    'Es tutet zweimal, dann knackt es – und aus dem Hörer kommt ein schriller, gleichbleibender Pfeifton. Kein Mensch: ein Modem!',
  );
  if (entry.id === 'secret' && !ctx.state.knownFacts.includes('access_number')) {
    discoverFact(ctx, 'access_number');
    setPuzzle(ctx, 'P04', 'solved');
    setPuzzle(ctx, 'P05', 'solving');
  }
  return 1;
}

export function handsetIntoCoupler(ctx: Ctx): number {
  const t = ctx.state.telecom;
  if (t.handset === 'coupler') {
    ctx.say('Der Hörer steckt schon im Koppler.');
    return 0;
  }
  if (t.call?.with === 'ralf' && t.call.kind === 'voice') {
    ctx.say('Du willst Ralf doch nicht ins Ohr pfeifen. Leg erst auf.');
    return 0;
  }
  if (t.handset === 'cradle') pickUp(ctx);
  t.handset = 'coupler';
  if (t.call?.kind === 'carrier') {
    ctx.state.objectStates.coupler.carrier = true;
    ctx.say(
      'Du drückst den Hörer fest in die Gummimuffen. Die Träger-LED am Koppler leuchtet auf. Jetzt muss der Computer übernehmen.',
    );
  } else {
    ctx.say(
      'Du drückst den Hörer in die Gummimuffen. Ohne Modem am anderen Ende bleibt die Träger-LED aber dunkel.',
    );
  }
  return 1;
}

/** Gespräch mit einer Person über ein Thema. */
export function talkAbout(ctx: Ctx, npc: string, topic: string | null, rawTopic: string): number {
  const s = ctx.state;
  if (!topic) {
    ctx.say(DIALOGUE_FALLBACK[npc] ?? `Darüber weiß ${npc} nichts.`, 'dialog', npc.toUpperCase());
    return 1;
  }
  const entry = DIALOGUE.find((d) => d.npc === npc && d.topic === topic && evalCondition(s, d.when));
  if (!s.knownTopics.includes(topic)) s.knownTopics.push(topic);
  if (!entry) {
    ctx.say(
      DIALOGUE_FALLBACK[npc] ?? `»${TOPIC_BY_ID[topic]?.label ?? rawTopic}?« – Keine Antwort.`,
      'dialog',
      npc.toUpperCase(),
    );
  } else {
    ctx.say(entry.text, 'dialog', entry.speaker);
    applyEffects(ctx, entry.effects);
  }
  if (s.conversation) {
    s.conversation.turns++;
    const later = Boolean(s.flags.ralfDelivered);
    if (npc === 'ralf' && s.conversation.turns >= (later ? GAME_CONFIG.ralf.maxTurns : RALF_MAX_TURNS)) {
      ctx.say(
        later
          ? '»Du, meine Mutter will telefonieren. Ich muss Schluss machen – bis dann!«'
          : '»Du, ich muss echt los. Erzähl ich dir alles nachher!«',
        'dialog',
        'RALF',
      );
      hangUp(ctx, true);
      ctx.say('Ralf hat aufgelegt. Du legst den Hörer zurück auf die Gabel.');
    }
  }
  return 1;
}

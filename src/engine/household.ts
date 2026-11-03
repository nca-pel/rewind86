/**
 * Alltag im Haus (reine Stimmung, ohne Einfluss auf Verdacht, Vertrauen, Rätsel und Enden): die Szene hinter der
 * Zimmertür, zufällige Fragen der Mutter und Omas Anrufe. Der Zufall kommt aus `rngSeed` im Spielstand, ist also
 * deterministisch und wird mitgespeichert.
 */
import {
  DOOR_SCENES,
  MOTHER_QUESTIONS,
  OMA_CLOSERS,
  OMA_OPENERS,
  OMA_TOPICS,
  type DoorScene,
  type MotherQuestion,
} from '../content/household';
import { weekday } from './clock';
import { houseLineBusy } from './conditions';
import type { Ctx } from './context';
import { scheduleEvent } from './effects';
import { isSchoolDay } from './routine';
import type { GameState } from './types';

/** mulberry32: Zahl in [0, 1), schreibt den Zustand in `rngSeed` zurück. */
export function nextRandom(s: GameState): number {
  s.rngSeed = (s.rngSeed + 0x6d2b79f5) >>> 0;
  let t = s.rngSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pick<T>(s: GameState, list: readonly T[]): T {
  return list[Math.floor(nextRandom(s) * list.length)];
}

/** `HH:MM` liegt in [from, to); über Mitternacht (from > to) erlaubt. */
function inRange(time: string, from: string, to: string): boolean {
  return from <= to ? time >= from && time < to : time >= from || time < to;
}

function sceneMatches(sc: DoorScene, s: GameState): boolean {
  const date = s.gameClock.slice(0, 10);
  const time = s.gameClock.slice(11, 16);
  if (sc.date && sc.date !== date) return false;
  if (sc.days && !sc.days.includes(weekday(s.gameClock))) return false;
  if (sc.schoolDay !== undefined && sc.schoolDay !== isSchoolDay(s.gameClock)) return false;
  return inRange(time, sc.from, sc.to);
}

function questionMatches(q: MotherQuestion, s: GameState): boolean {
  const time = s.gameClock.slice(11, 16);
  if (q.schoolDay !== undefined && q.schoolDay !== isSchoolDay(s.gameClock)) return false;
  return !q.from || !q.to || inRange(time, q.from, q.to);
}

/** Um diese Uhrzeit sind die Eltern wach und ansprechbar. */
function parentsAwake(time: string): boolean {
  return time >= '06:00' && time < '23:00';
}

/** Chance, dass die Mutter beim Öffnen der Tür etwas fragt. */
const MOTHER_ASKS_CHANCE = 0.4;

/** Tür öffnen: Szene nach Wochentag und Tageszeit, gelegentlich eine Frage der Mutter. */
export function openDoorScene(ctx: Ctx): void {
  const s = ctx.state;
  const scene = DOOR_SCENES.find((sc) => sceneMatches(sc, s))!;
  ctx.say(pick(s, scene.texts));
  if (!parentsAwake(s.gameClock.slice(11, 16)) || nextRandom(s) >= MOTHER_ASKS_CHANCE) return;
  const fitting = MOTHER_QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => questionMatches(q, s));
  // dieselbe Frage nicht zweimal hintereinander
  const last = typeof s.flags.motherQ === 'number' ? s.flags.motherQ : -1;
  const pool = fitting.filter(({ i }) => i !== last);
  if (pool.length === 0) return;
  const { q, i } = pick(s, pool);
  s.flags.motherQ = i;
  ctx.say(q.ask, 'dialog', 'MUTTER');
  ctx.say(q.reply);
}

/** Omas Anrufe insgesamt und Mindestabstand (Stunden) */
const OMA_MAX_CALLS = 3;
const OMA_MIN_GAP_MIN = 20 * 60;

function minutesSince(clock: string, earlier: string): number {
  const a = Date.parse(`${clock}:00Z`);
  const b = Date.parse(`${earlier}:00Z`);
  return Math.round((a - b) / 60000);
}

/**
 * Gelegentlich klingelt das Telefon, und es ist Oma. Wird von zwei täglichen Ereignissen aufgerufen; Chance
 * 18 %, ab Dienstag 50 % solange sie noch gar nicht angerufen hat. Nur wenn Jan frei und die Leitung ruhig ist.
 */
export function omaMaybeRing(ctx: Ctx): void {
  const s = ctx.state;
  const t = s.telecom;
  const calls = typeof s.flags.omaCalls === 'number' ? s.flags.omaCalls : 0;
  if (calls >= OMA_MAX_CALLS) return;
  const last = s.flags.omaLast;
  if (typeof last === 'string' && minutesSince(s.gameClock, last) < OMA_MIN_GAP_MIN) return;
  // nicht, wenn etwas anderes läuft; im Finale lassen die Eltern Oma aus dem Spiel
  const busy =
    s.flags.away ||
    s.flags.gameOver ||
    s.flags.finaleOpen ||
    s.flags.ralfVisit ||
    s.flags.atClub ||
    s.conversation ||
    t.ringing ||
    t.connectedSystemId !== null ||
    t.handset !== 'cradle' ||
    houseLineBusy(s);
  if (busy) return;
  if (s.gameClock.slice(0, 10) >= '1986-11-21') return;
  const day = weekday(s.gameClock);
  const chance = calls === 0 && ['Dienstag', 'Mittwoch', 'Donnerstag'].includes(day) ? 0.5 : 0.18;
  if (nextRandom(s) >= chance) return;
  s.flags.omaCalls = calls + 1;
  s.flags.omaLast = s.gameClock.slice(0, 16);
  s.flags.omaRinging = true;
  t.ringing = 'oma';
  ctx.cue('phone_ring');
  ctx.say('[Das Telefon klingelt.]', 'caption');
  ctx.say('Das Telefon auf deinem Schreibtisch klingelt.');
  scheduleEvent(ctx, 'ev_ring_reminder', 4);
  scheduleEvent(ctx, 'ev_oma_ring_end', 9);
}

/** Oma abnehmen: kurzes, zufällig zusammengesetztes Gespräch, dann legt sie auf. */
export function omaCallLines(ctx: Ctx): string[] {
  const s = ctx.state;
  const topics: typeof OMA_TOPICS = [];
  while (topics.length < 2) {
    const t = pick(s, OMA_TOPICS);
    if (!topics.includes(t)) topics.push(t);
  }
  return [pick(s, OMA_OPENERS), ...topics.flatMap((t) => [t.oma, t.jan]), pick(s, OMA_CLOSERS)];
}

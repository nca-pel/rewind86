import { GAME_CONFIG } from '../content/config';
import { EVENTS, EVENT_BY_ID } from '../content/events';
import { fromMinutes, toMinutes } from './clock';
import { evalCondition } from './conditions';
import type { Ctx } from './context';
import { applyEffects } from './effects';
import { btxDropCarrier } from '../sim/apps/btx';
import { hangUp } from './phone';
import { accrueOnlineRisk } from './pressure';
import { nextOccurrence } from './routine';

/** Gebühren und Online-Minuten für das Intervall bis `nowMin` abrechnen. */
export function settleTelecom(ctx: Ctx, fromMin: number, nowMin: number): void {
  const t = ctx.state.telecom;
  if (nowMin <= fromMin) return;
  if (t.connectedSystemId) t.onlineMinutes += nowMin - fromMin;
  accrueOnlineRisk(ctx, nowMin - fromMin);
  const call = t.call;
  if (!call || !call.outgoing || (call.kind !== 'voice' && call.kind !== 'carrier')) return;
  const elapsed = nowMin - toMinutes(call.startedAt);
  const due = 1 + Math.floor(elapsed / GAME_CONFIG.economy.localMinutesPerUnit);
  if (due > call.unitsCharged) {
    const units = due - call.unitsCharged;
    call.unitsCharged = due;
    ctx.state.phoneCostsDm =
      Math.round((ctx.state.phoneCostsDm + units * GAME_CONFIG.economy.dmPerUnit) * 100) / 100;
  }
}

export function fireEvent(ctx: Ctx, id: string): void {
  const s = ctx.state;
  const def = EVENT_BY_ID[id];
  for (const ev of s.scheduledEvents) if (ev.id === id && ev.status === 'pending') ev.status = 'done';
  if (!def) return;
  const repeatable = def.repeatable || Boolean(def.daily);
  if (!repeatable && s.firedEvents.includes(id)) return; // Idempotenz
  if (!s.firedEvents.includes(id)) s.firedEvents.push(id);
  if (def.daily) scheduleDaily(s, id, def.daily);
  const variant = def.variants.find((v) => evalCondition(s, v.when));
  ctx.debug(`event ${id}`);
  const logBefore = ctx.log.length;
  applyEffects(ctx, variant?.effects);
  // Unterbricht WARTE nur, wenn dabei etwas Wahrnehmbares passiert (nicht bei stillem Neuplanen).
  if (def.interrupts && ctx.log.length > logBefore) ctx.interrupted = true;
}

/** Nächstes Vorkommen eines täglichen Ereignisses einplanen (falls nicht schon geplant). */
export function scheduleDaily(s: Ctx['state'], id: string, time: string): void {
  if (s.scheduledEvents.some((e) => e.id === id && e.status === 'pending')) return;
  s.scheduledEvents.push({ id, at: nextOccurrence(s.gameClock, time), status: 'pending' });
  // Erledigte Einträge täglicher Ereignisse nicht endlos ansammeln
  const done = s.scheduledEvents.filter((e) => e.id === id && e.status !== 'pending');
  if (done.length > 2) s.scheduledEvents = s.scheduledEvents.filter((e) => !done.slice(0, -2).includes(e));
}

/**
 * Angeforderten Zeitblock abarbeiten: Jan legt auf, die Zeit springt bis zum Ende des Blocks; Ereignisse
 * dazwischen laufen (mit gesetztem Flag `away`) ganz normal ab.
 */
function runAbsence(ctx: Ctx): void {
  const a = ctx.absence;
  if (!a || ctx.inAbsence) return;
  ctx.absence = null;
  const s = ctx.state;
  if (s.telecom.connectedSystemId === 'btx') {
    btxDropCarrier(ctx);
    ctx.say('Du beendest die BTX-Sitzung.');
  }
  if (s.telecom.handset !== 'cradle') {
    hangUp(ctx, true);
    ctx.say('Du legst den Hörer auf.');
  }
  if (s.conversation) {
    s.conversation = null;
    s.mode = 'desk';
  }
  ctx.say(a.text);
  s.flags.away = a.kind;
  ctx.inAbsence = true;
  advanceTime(ctx, a.untilMin - toMinutes(s.gameClock));
  ctx.inAbsence = false;
  delete s.flags.away;
  if (a.backText) ctx.say(a.backText);
  ctx.interrupted = true;
}

export function checkTriggers(ctx: Ctx): void {
  for (const def of EVENTS) {
    if (!def.trigger) continue;
    if (ctx.state.firedEvents.includes(def.id)) continue;
    if (evalCondition(ctx.state, def.trigger)) fireEvent(ctx, def.id);
  }
}

/**
 * Spielzeit aktionsbasiert vorrücken. Fällige Ereignisse werden in chronologischer Reihenfolge
 * verarbeitet. Bei `interruptible` (WARTE) bricht ein unterbrechendes Ereignis das Warten ab.
 * Gibt die tatsächlich vergangenen Minuten zurück.
 */
export function advanceTime(ctx: Ctx, minutes: number, interruptible = false): number {
  const s = ctx.state;
  const startMin = toMinutes(s.gameClock);
  let target = startMin + Math.max(0, Math.floor(minutes));
  ctx.interrupted = false;

  for (let guard = 0; guard < 500; guard++) {
    const due = s.scheduledEvents
      .filter((e) => e.status === 'pending' && toMinutes(e.at) <= target)
      .sort((a, b) => toMinutes(a.at) - toMinutes(b.at) || a.id.localeCompare(b.id))[0];
    if (!due) break;
    const nowMin = toMinutes(s.gameClock);
    const evMin = Math.max(nowMin, toMinutes(due.at));
    settleTelecom(ctx, nowMin, evMin);
    s.gameClock = fromMinutes(evMin);
    fireEvent(ctx, due.id);
    if (ctx.absence && !ctx.inAbsence) {
      runAbsence(ctx);
      target = Math.max(target, toMinutes(s.gameClock));
    }
    if (interruptible && ctx.interrupted) {
      target = Math.min(target, toMinutes(s.gameClock));
      break;
    }
  }
  const nowMin = toMinutes(s.gameClock);
  if (target > nowMin) {
    settleTelecom(ctx, nowMin, target);
    s.gameClock = fromMinutes(target);
  }
  checkTriggers(ctx);
  if (ctx.absence && !ctx.inAbsence) runAbsence(ctx);
  return toMinutes(s.gameClock) - startMin;
}

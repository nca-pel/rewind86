import { GAME_CONFIG } from '../content/config';
import { EVENTS, EVENT_BY_ID } from '../content/events';
import { fromMinutes, toMinutes } from './clock';
import { evalCondition } from './conditions';
import type { Ctx } from './context';
import { applyEffects } from './effects';

/** Gebühren und Online-Minuten für das Intervall bis `nowMin` abrechnen. */
export function settleTelecom(ctx: Ctx, fromMin: number, nowMin: number): void {
  const t = ctx.state.telecom;
  if (nowMin <= fromMin) return;
  if (t.connectedSystemId) t.onlineMinutes += nowMin - fromMin;
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
  if (!def.repeatable && s.firedEvents.includes(id)) return; // Idempotenz
  if (!s.firedEvents.includes(id)) s.firedEvents.push(id);
  const variant = def.variants.find((v) => evalCondition(s, v.when));
  ctx.debug(`event ${id}`);
  applyEffects(ctx, variant?.effects);
  if (def.interrupts && variant && variant.effects.length > 0) ctx.interrupted = true;
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
    if (interruptible && ctx.interrupted) {
      target = evMin;
      break;
    }
  }
  const nowMin = toMinutes(s.gameClock);
  if (target > nowMin) {
    settleTelecom(ctx, nowMin, target);
    s.gameClock = fromMinutes(target);
  }
  checkTriggers(ctx);
  return toMinutes(s.gameClock) - startMin;
}

import { EVENT_BY_ID } from '../content/events';
import { FACT_BY_ID } from '../content/facts';
import { addMinutes } from './clock';
import type { Ctx } from './context';
import type { GameEffect, PuzzleStatus } from './types';

const PUZZLE_RANK: Record<PuzzleStatus, number> = {
  unknown: 0,
  discovered: 1,
  solving: 2,
  solved: 3,
  bypassed: 3,
};

export function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function discoverFact(ctx: Ctx, id: string): void {
  const s = ctx.state;
  if (s.knownFacts.includes(id)) return;
  if (!FACT_BY_ID[id]) throw new Error(`Unbekannter Fakt: ${id}`);
  s.knownFacts.push(id);
  ctx.say(`✎ Notiert: ${FACT_BY_ID[id].text}`, 'system');
  ctx.debug(`fact ${id}`);
}

export function setPuzzle(ctx: Ctx, id: string, status: PuzzleStatus): void {
  const cur = ctx.state.puzzles[id] ?? 'unknown';
  if (PUZZLE_RANK[status] <= PUZZLE_RANK[cur]) return;
  ctx.state.puzzles[id] = status;
  ctx.debug(`puzzle ${id} -> ${status}`);
  if (status === 'solved') ctx.ui.push({ type: 'autosave', reason: `Rätsel ${id} gelöst` });
}

export function scheduleEvent(ctx: Ctx, id: string, inMinutes: number): void {
  const s = ctx.state;
  const def = EVENT_BY_ID[id];
  if (!def) throw new Error(`Unbekanntes Ereignis: ${id}`);
  // Einmalige Ereignisse werden nach dem Feuern nie erneut eingeplant (Idempotenz).
  if (!def.repeatable && s.firedEvents.includes(id)) return;
  const at = addMinutes(s.gameClock, inMinutes);
  const existing = s.scheduledEvents.find((e) => e.id === id && e.status === 'pending');
  if (existing) {
    if (def.repeatable) existing.at = at;
    return;
  }
  s.scheduledEvents.push({ id, at, status: 'pending' });
}

export function applyEffects(ctx: Ctx, effects: GameEffect[] | undefined): void {
  for (const e of effects ?? []) applyEffect(ctx, e);
}

export function applyEffect(ctx: Ctx, e: GameEffect): void {
  const s = ctx.state;
  switch (e.type) {
    case 'setFlag':
      s.flags[e.id] = e.value;
      break;
    case 'discoverFact':
      discoverFact(ctx, e.id);
      break;
    case 'addTopic':
      if (!s.knownTopics.includes(e.id)) s.knownTopics.push(e.id);
      break;
    case 'moveItem':
      s.itemLocations[e.id] = e.to;
      break;
    case 'setObjectState':
      (s.objectStates[e.id] ??= {})[e.key] = e.value as boolean | number | string;
      break;
    case 'changeRelationship':
      s.relationships[e.id] = clamp100(s.relationships[e.id] + e.delta);
      ctx.debug(`rel ${e.id} ${e.delta >= 0 ? '+' : ''}${e.delta} = ${s.relationships[e.id]}`);
      break;
    case 'changeMoney':
      s.moneyDm = Math.round((s.moneyDm + e.deltaDm) * 100) / 100;
      break;
    case 'scheduleEvent':
      scheduleEvent(ctx, e.id, e.inMinutes);
      break;
    case 'cancelEvent':
      for (const ev of s.scheduledEvents)
        if (ev.id === e.id && ev.status === 'pending') ev.status = 'cancelled';
      break;
    case 'puzzle':
      setPuzzle(ctx, e.id, e.status);
      break;
    case 'startConversation':
      s.conversation = { npc: e.npc, turns: 0 };
      s.mode = 'conversation';
      break;
    case 'endConversation':
      s.conversation = null;
      s.mode = 'desk';
      break;
    case 'say':
      ctx.say(e.text, e.kind ?? 'story', e.speaker);
      break;
    case 'audio':
      ctx.cue(e.cue);
      break;
    case 'ui':
      ctx.ui.push(e.effect);
      break;
    case 'telecom':
      if (e.op === 'ring') s.telecom.ringing = e.who ?? 'unknown';
      else if (e.op === 'stopRinging') s.telecom.ringing = null;
      else if (e.op === 'houseBusy') s.telecom.houseLineBusyUntil = addMinutes(s.gameClock, e.minutes);
      break;
  }
}

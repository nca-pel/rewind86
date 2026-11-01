import { isBefore, toMinutes, weekday } from './clock';
import { dateOf, isSchoolDay, isSchoolTomorrow } from './routine';
import { threshold } from './pressure';
import type { Condition, GameState } from './types';

/** Leitung durch Jan belegt: Hörer ist abgenommen (in der Hand oder im Koppler). */
export function janUsesLine(state: GameState): boolean {
  return state.telecom.handset !== 'cradle' || state.telecom.connectedSystemId === 'btx';
}

export function houseLineBusy(state: GameState): boolean {
  const until = state.telecom.houseLineBusyUntil;
  return until !== null && isBefore(state.gameClock, until);
}

export function evalCondition(state: GameState, c: Condition | undefined): boolean {
  if (!c) return true;
  if ('all' in c) return c.all.every((x) => evalCondition(state, x));
  if ('any' in c) return c.any.some((x) => evalCondition(state, x));
  if ('not' in c) return !evalCondition(state, c.not);
  if ('fact' in c) return state.knownFacts.includes(c.fact);
  if ('notFact' in c) return !state.knownFacts.includes(c.notFact);
  if ('notFlag' in c) return !state.flags[c.notFlag];
  if ('flag' in c) {
    const v = state.flags[c.flag];
    return c.eq === undefined ? Boolean(v) : v === c.eq;
  }
  if ('itemAt' in c) return state.itemLocations[c.itemAt] === c.loc;
  if ('notItemAt' in c) return state.itemLocations[c.notItemAt] !== c.loc;
  if ('objState' in c) return (state.objectStates[c.objState]?.[c.key] ?? false) === c.eq;
  if ('timeAfter' in c) return toMinutes(state.gameClock) >= toMinutes(c.timeAfter);
  if ('timeBefore' in c) return isBefore(state.gameClock, c.timeBefore);
  if ('lineBusy' in c) return janUsesLine(state);
  if ('online' in c) return state.telecom.connectedSystemId !== null;
  if ('ringing' in c) return state.telecom.ringing !== null;
  if ('schoolDay' in c) return isSchoolDay(state.gameClock);
  if ('schoolTomorrow' in c) return isSchoolTomorrow(state.gameClock);
  if ('weekday' in c) return weekday(state.gameClock) === c.weekday;
  if ('date' in c) return dateOf(state.gameClock) === c.date;
  if ('factsAtLeast' in c)
    return c.factsAtLeast.of.filter((f) => state.knownFacts.includes(f)).length >= c.factsAtLeast.n;
  if ('atLeast' in c) {
    const t = threshold(c.rel, c.atLeast);
    return t !== undefined && state.relationships[c.rel] >= t;
  }
  if ('below' in c) {
    const t = threshold(c.rel, c.below);
    return t !== undefined && state.relationships[c.rel] < t;
  }
  return false;
}

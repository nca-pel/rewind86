/**
 * Verdachts- und Vertrauenslogik (GDD §9.3, §10.3, §10.4).
 *
 * Die verdeckten Werte (0..100) werden nie angezeigt. Storydaten fragen benannte Schwellen ab
 * ({ rel, atLeast } / { rel, below }); die erzählerischen Symptome sind gewöhnliche Trigger-Ereignisse
 * in src/content/events.ts. Endgültige Folgen sind gedeckelt, bis eine Warnung gegeben wurde.
 */
import { riskConfig } from './difficulty';
import { GAME_CONFIG } from '../content/config';
import { addMinutes, formatTime, isBefore } from './clock';
import type { Ctx } from './context';
import type { GameState, RelationshipId } from './types';

type Thresholds = Record<RelationshipId, Record<string, number>>;
const THRESHOLDS: Thresholds = GAME_CONFIG.thresholds;
const TERMINAL: Partial<Record<RelationshipId, { at: string; warnedFlag: string }>> = GAME_CONFIG.terminal;

/** Zahlenwert einer benannten Schwelle; undefined bei unbekanntem Namen */
export function threshold(rel: RelationshipId, name: string): number | undefined {
  return THRESHOLDS[rel]?.[name];
}

export function thresholdNames(rel: RelationshipId): string[] {
  return Object.keys(THRESHOLDS[rel] ?? {});
}

/** Höchste erreichte Schwelle (für Entwicklerkonsole und Debug-Log), sonst null */
export function stageOf(state: GameState, rel: RelationshipId): string | null {
  let best: string | null = null;
  let bestAt = -1;
  for (const [name, at] of Object.entries(THRESHOLDS[rel] ?? {}))
    if (state.relationships[rel] >= at && at > bestAt) {
      best = name;
      bestAt = at;
    }
  return best;
}

/** Obergrenze: Ohne vorherige Warnung bleibt ein Wert unter seiner endgültigen Schwelle. */
function cap(state: GameState, rel: RelationshipId): number {
  const t = TERMINAL[rel];
  if (!t || state.flags[t.warnedFlag]) return 100;
  return (threshold(rel, t.at) ?? 101) - 1;
}

/** Einzige Stelle, an der verdeckte Werte verändert werden (außer der Entwicklerkonsole). */
export function changeRelationship(ctx: Ctx, rel: RelationshipId, delta: number, reason = ''): void {
  const s = ctx.state;
  const before = s.relationships[rel];
  const next = Math.max(0, Math.min(cap(s, rel), Math.round(before + delta)));
  // Ein bereits darüber liegender Wert (Entwicklerkonsole, Altstand) wird nicht nachträglich gesenkt.
  s.relationships[rel] = delta >= 0 ? Math.max(before, next) : next;
  const stageBefore = stageOf({ ...s, relationships: { ...s.relationships, [rel]: before } }, rel);
  const stage = stageOf(s, rel);
  ctx.debug(
    `rel ${rel} ${delta >= 0 ? '+' : ''}${delta} = ${s.relationships[rel]}${reason ? ` (${reason})` : ''}` +
      (stage !== stageBefore ? ` → Stufe ${stage ?? '–'}` : ''),
  );
}

/** Online-Minuten im geheimen Netz in Verdacht umrechnen (Rest bleibt für später stehen). */
export function accrueOnlineRisk(ctx: Ctx, minutes: number): void {
  const t = ctx.state.telecom;
  if (t.connectedSystemId !== 'secret' || minutes <= 0) return;
  const per = riskConfig(ctx.state).secretOnlineMinutesPerPoint;
  t.riskMinutes += minutes;
  const points = Math.floor(t.riskMinutes / per);
  if (points > 0) {
    t.riskMinutes -= points * per;
    changeRelationship(ctx, 'seidelSuspicion', points, `${points * per} min online`);
  }
}

/** Gesperrt bis (Spielzeit) oder null; abgelaufene Sperren zählen nicht. */
export function lockedUntil(state: GameState, system: string): string | null {
  const until = state.telecom.locks[system];
  return until && isBefore(state.gameClock, until) ? until : null;
}

export function lockNote(until: string): string {
  return `KENNUNG GESPERRT BIS ${formatTime(until)}`;
}

/**
 * Kennung sperren. Ist Jan gerade mit dem System verbunden, trennt die Gegenstelle; die Programme
 * zeigen beim nächsten Tastendruck NO CARRIER (sie prüfen connectedSystemId).
 */
export function lockAccount(ctx: Ctx, system: string, minutes: number): void {
  const s = ctx.state;
  const t = s.telecom;
  const until = addMinutes(s.gameClock, minutes);
  if (!t.locks[system] || isBefore(t.locks[system], until)) t.locks[system] = until;
  ctx.debug(`lock ${system} bis ${until}`);
  if (t.connectedSystemId === system) {
    t.connectedSystemId = null;
    t.currentUserHandle = null;
    if (t.call?.kind === 'carrier') t.call.kind = 'dead';
    s.objectStates.coupler.carrier = false;
    ctx.say('Mitten im Bildaufbau reißt die Verbindung ab. Auf dem Monitor: NO CARRIER.');
  }
}

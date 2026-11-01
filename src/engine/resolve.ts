import { OBJECTS, OBJECT_BY_ID, type WorldObject } from '../content/objects';
import { TOPICS } from '../content/dialogue';
import { editDistance, typoTolerance } from '../parser/normalize';
import { PRONOUNS } from '../parser/lexicon';
import { evalCondition } from './conditions';
import type { GameState } from './types';

export type Resolution =
  | { status: 'ok'; id: string }
  | { status: 'empty' }
  | { status: 'pronoun' }
  | { status: 'unknown'; word: string }
  | { status: 'unreachable'; id: string }
  | { status: 'ambiguous'; ids: string[] };

const OBJECT_VOCAB = new Set(OBJECTS.flatMap((o) => [...o.nouns, ...(o.adjectives ?? [])]));

export function isReachable(state: GameState, id: string): boolean {
  const o = OBJECT_BY_ID[id];
  if (!o) return false;
  if (o.npc) return evalCondition(state, o.present) || state.conversation?.npc === id;
  if (o.partOf) return isReachable(state, o.partOf);
  if (o.portable) {
    const loc = state.itemLocations[id];
    if (loc === 'inventory' || loc === 'desk' || loc === 'drive' || loc === 'datasette' || loc === 'port')
      return true;
    if (loc === 'drawer') return state.objectStates.drawer?.open === true;
    if (loc === 'package') return state.objectStates.package?.open === true;
    return false;
  }
  return true;
}

/** Einzelnes unbekanntes Wort per Tippfehler-Toleranz eindeutig korrigieren. */
function correctWord(word: string): string | null {
  if (OBJECT_VOCAB.has(word)) return word;
  const tol = typoTolerance(word);
  if (tol === 0) return null;
  const near = [...OBJECT_VOCAB].filter((v) => editDistance(v, word, tol) <= tol);
  return near.length === 1 ? near[0] : null;
}

function score(o: WorldObject, words: string[]): number {
  let matched = 0;
  let noun = false;
  for (const w of words) {
    if (o.nouns.includes(w)) {
      matched++;
      noun = true;
    } else if (o.adjectives?.includes(w)) matched++;
  }
  if (matched === 0) return 0;
  // Ohne Substantiv reicht ein Adjektiv nur, wenn alle Wörter passen ("NIMM 1001").
  if (!noun && matched < words.length) return 0;
  return matched * 10 - (words.length - matched);
}

export interface ResolveOptions {
  /** Bevorzugte Kandidaten, z. B. Gegenstände im Inventar für "LEGE … EIN" */
  prefer?: (id: string) => boolean;
  /** Nur diese Objekte zulassen (z. B. Mehrdeutigkeits-Nachfrage) */
  among?: string[];
}

export function resolveObject(state: GameState, rawWords: string[], opts: ResolveOptions = {}): Resolution {
  if (rawWords.length === 0) return { status: 'empty' };
  const direct = rawWords.find((w) => w.startsWith('#id:'));
  if (direct) return { status: 'ok', id: direct.slice(4) };

  if (rawWords.length === 1 && PRONOUNS.has(rawWords[0])) {
    const last = state.parser.lastObjectId;
    return last && isReachable(state, last) ? { status: 'ok', id: last } : { status: 'pronoun' };
  }

  const words: string[] = [];
  for (const w of rawWords) {
    if (PRONOUNS.has(w)) continue;
    const c = correctWord(w);
    if (c) words.push(c);
    else if (!/^\d+$/.test(w)) return { status: 'unknown', word: w };
    else words.push(w);
  }
  if (words.length === 0) return { status: 'empty' };

  const pool = opts.among ? OBJECTS.filter((o) => opts.among!.includes(o.id)) : OBJECTS;
  const scored = pool.map((o) => ({ o, s: score(o, words) })).filter((x) => x.s > 0);
  if (scored.length === 0) return { status: 'unknown', word: words.join(' ') };

  const top = Math.max(...scored.map((x) => x.s));
  const best = scored.filter((x) => x.s === top).map((x) => x.o.id);
  let reachable = best.filter((id) => isReachable(state, id));
  if (reachable.length === 0) {
    // Erreichbare Objekte mit schwächerem Treffer zählen nur, wenn das stärkere unerreichbar ist und
    // der Spieler kein unterscheidendes Wort benutzt hat.
    return { status: 'unreachable', id: best[0] };
  }
  if (reachable.length > 1 && opts.prefer) {
    const pref = reachable.filter(opts.prefer);
    if (pref.length > 0) reachable = pref;
  }
  if (reachable.length === 1) return { status: 'ok', id: reachable[0] };
  return { status: 'ambiguous', ids: reachable };
}

export function resolveTopic(words: string[]): string | null {
  for (const w of words) {
    const t = TOPICS.find((x) => x.aliases.includes(w) || x.id === w);
    if (t) return t.id;
  }
  for (const w of words) {
    const tol = typoTolerance(w);
    if (tol === 0) continue;
    const near = TOPICS.filter((x) => x.aliases.some((a) => editDistance(a, w, tol) <= tol));
    if (near.length === 1) return near[0].id;
  }
  return null;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

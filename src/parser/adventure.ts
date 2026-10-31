import type { C64Key } from '../engine/types';
import { ARTICLES, FILLERS, KEY_WORDS, MODERN_WORDS, PREPOSITIONS, VERBS, type VerbId } from './lexicon';
import { editDistance, normalize, parseNumberWord, typoTolerance } from './normalize';

export interface Segment {
  prep: string | null;
  words: string[];
}

export type MetaId =
  | 'help'
  | 'inventory'
  | 'notes'
  | 'think'
  | 'time'
  | 'save'
  | 'load'
  | 'saves'
  | 'wait'
  | 'look'
  | 'topics'
  | 'sleep'
  | 'c64hint';

export type Intent =
  | { kind: 'empty' }
  | { kind: 'meta'; meta: MetaId; arg?: string; minutes?: number }
  | { kind: 'verb'; verb: VerbId; verbWord: string; segments: Segment[] }
  | { kind: 'dial'; number: string; words: string[] }
  | { kind: 'type'; text: string }
  | { kind: 'press'; key: C64Key | null; raw: string }
  | { kind: 'note'; text: string }
  | { kind: 'link'; subject: string; target: string }
  | { kind: 'modern'; word: string }
  | { kind: 'unknownVerb'; word: string; suggestion?: string }
  | { kind: 'bare'; words: string[] };

const ALL_VERB_WORDS = [...new Set(VERBS.flatMap((v) => v.words))];

/** Text nach dem ersten Wort aus dem Rohtext (Groß-/Kleinschreibung und Anführungszeichen bleiben erhalten). */
function rawRest(raw: string): string {
  const t = raw.trim();
  const i = t.search(/\s/);
  return i < 0 ? '' : t.slice(i + 1).trim();
}

function parseWait(tokens: string[]): number {
  let minutes = 15;
  for (let i = 1; i < tokens.length; i++) {
    const n = parseNumberWord(tokens[i]);
    if (n !== null) {
      const unit = tokens[i + 1] ?? '';
      minutes = /^(stunde|stunden|std|h)$/.test(unit) ? n * 60 : n;
      if (tokens[i] === 'halbe' && /^stunde/.test(unit)) minutes = 30;
      break;
    }
    if (/^(stunde|stunden)$/.test(tokens[i])) minutes = 60;
  }
  return Math.max(1, Math.min(minutes, 12 * 60));
}

function parseMeta(tokens: string[], raw: string): Intent | null {
  const [w0, w1] = tokens;
  const rest = tokens.slice(1);
  if (raw.trim() === '?' || ['hilfe', 'help', 'befehle', 'kommandos'].includes(w0))
    return { kind: 'meta', meta: 'help' };
  if (['i', 'inv', 'inventar', 'inventory', 'taschen'].includes(w0) && tokens.length === 1)
    return { kind: 'meta', meta: 'inventory' };
  if (w0 === 'was' && tokens.includes('habe') && tokens.includes('ich'))
    return { kind: 'meta', meta: 'inventory' };
  if (w0 === 'notizen' && tokens.length === 1) return { kind: 'meta', meta: 'notes' };
  if ((w0 === 'denke' || w0 === 'denk') && (w1 === 'nach' || tokens.length === 1))
    return { kind: 'meta', meta: 'think' };
  if (['nachdenken', 'hinweis', 'tipp', 'grueble', 'ueberlege'].includes(w0) && tokens.length <= 2)
    return { kind: 'meta', meta: 'think' };
  if (['zeit', 'uhr', 'uhrzeit', 'datum'].includes(w0) && tokens.length === 1)
    return { kind: 'meta', meta: 'time' };
  if (w0 === 'wie' && w1 === 'spaet') return { kind: 'meta', meta: 'time' };
  if (['speichern', 'speichere', 'speicher', 'sichern', 'sichere', 'save'].includes(w0))
    return {
      kind: 'meta',
      meta: 'save',
      arg: rest.filter((w) => w !== 'spiel' && w !== 'in' && w !== 'slot' && w !== 'platz')[0],
    };
  if (['spielstaende', 'spielstand', 'speicherstaende'].includes(w0)) return { kind: 'meta', meta: 'saves' };
  if (['laden', 'lade', 'load', 'restore'].includes(w0)) {
    const r = rest.filter((w) => !['slot', 'spielstand', 'platz'].includes(w));
    if (r.length === 0 || /^(\d|auto|autosave)/.test(r[0])) return { kind: 'meta', meta: 'load', arg: r[0] };
    return { kind: 'meta', meta: 'c64hint', arg: rawRest(raw) };
  }
  if (['warte', 'warten', 'wart', 'z'].includes(w0))
    return { kind: 'meta', meta: 'wait', minutes: parseWait(tokens) };
  if (['umsehen', 'umschauen', 'l', 'look', 'umgucken'].includes(w0)) return { kind: 'meta', meta: 'look' };
  if (['schau', 'schaue', 'sieh', 'siehe', 'guck', 'gucke'].includes(w0) && tokens.includes('um'))
    return { kind: 'meta', meta: 'look' };
  if (['themen', 'thema', 'gespraechsthemen'].includes(w0)) return { kind: 'meta', meta: 'topics' };
  if (['schlafe', 'schlaf', 'penne', 'schlafen'].includes(w0) || (w0?.startsWith('geh') && w1 === 'schlafen'))
    return { kind: 'meta', meta: 'sleep' };
  return null;
}

function stripFillers(words: string[]): string[] {
  const kept = words.filter((w) => !FILLERS.has(w));
  // "ÖFFNE DAS" → Pronomen
  if (kept.length === 0 && words.length === 1 && ARTICLES.has(words[0])) return ['es'];
  return kept;
}

function splitSegments(words: string[]): Segment[] {
  const segments: Segment[] = [{ prep: null, words: [] }];
  for (const w of words) {
    if (PREPOSITIONS.has(w)) segments.push({ prep: w, words: [] });
    else segments[segments.length - 1].words.push(w);
  }
  return segments
    .map((s) => ({ prep: s.prep, words: stripFillers(s.words) }))
    .filter((s, i) => i === 0 || s.words.length > 0 || s.prep !== null);
}

function findVerb(
  tokens: string[],
): { entry: (typeof VERBS)[number]; verbWord: string; particleUsed: boolean } | null {
  const w0 = tokens[0];
  const last = tokens[tokens.length - 1];
  if (tokens.length > 1) {
    const withParticle = VERBS.find((v) => v.particle === last && v.words.includes(w0));
    if (withParticle) return { entry: withParticle, verbWord: w0, particleUsed: true };
  }
  const plain = VERBS.find((v) => v.particle === null && v.words.includes(w0));
  if (plain) return { entry: plain, verbWord: w0, particleUsed: false };
  return null;
}

function keyFromWords(words: string[], raw: string): C64Key | null {
  if (raw.includes('←')) return 'ARROW_LEFT';
  const joined = words.join('');
  if (joined.includes('runstop') || (words.includes('run') && words.includes('stop'))) return 'RUNSTOP';
  for (const w of words) if (KEY_WORDS[w]) return KEY_WORDS[w];
  const single = words.filter((w) => w !== 'taste' && w.length === 1);
  if (single.length === 1) return single[0].toUpperCase();
  return null;
}

/** Ein einzelner Befehl (ohne Satztrennung) → Intent */
export function parseAdventure(raw: string): Intent {
  const norm = normalize(raw);
  const tokens = norm ? norm.split(' ') : [];
  if (tokens.length === 0) return raw.trim() === '?' ? { kind: 'meta', meta: 'help' } : { kind: 'empty' };

  const modern = tokens.find((t) => MODERN_WORDS.has(t)) ?? (norm.includes('e mail') ? 'e-mail' : undefined);
  if (modern) return { kind: 'modern', word: modern };

  const meta = parseMeta(tokens, raw);
  if (meta) return meta;

  const found = findVerb(tokens);
  if (!found) {
    // Tippfehler-Toleranz für das Verb – nur bei eindeutigem Treffer.
    const tol = typoTolerance(tokens[0]);
    if (tol > 0) {
      const scored = ALL_VERB_WORDS.map((w) => ({ w, d: editDistance(w, tokens[0], tol) })).filter(
        (x) => x.d <= tol,
      );
      const best = Math.min(...scored.map((x) => x.d));
      const near = scored.filter((x) => x.d === best).map((x) => x.w);
      if (near.length === 1) return parseAdventure([near[0], ...tokens.slice(1)].join(' '));
      if (near.length > 1)
        return { kind: 'unknownVerb', word: tokens[0], suggestion: near.slice(0, 3).join(' / ') };
    }
    return { kind: 'bare', words: stripFillers(tokens) };
  }

  const { entry, verbWord, particleUsed } = found;
  const body = tokens.slice(1, particleUsed ? -1 : undefined);

  switch (entry.verb) {
    case 'type': {
      const text = rawRest(raw);
      return text ? { kind: 'type', text } : { kind: 'meta', meta: 'think' };
    }
    case 'note': {
      if (verbWord.startsWith('denk')) return { kind: 'meta', meta: 'think' };
      const text = rawRest(raw).replace(/\s+auf$/i, '');
      return { kind: 'note', text };
    }
    case 'press':
      return { kind: 'press', key: keyFromWords(body, raw), raw };
    case 'dial': {
      const digits = body.filter((w) => /^\d+$/.test(w)).join('');
      return { kind: 'dial', number: digits, words: stripFillers(body.filter((w) => !/^\d+$/.test(w))) };
    }
    case 'link': {
      const segs = splitSegments(body);
      const subject = segs[0]?.words.join(' ') ?? '';
      const target = segs.find((s) => s.prep === 'mit')?.words.join(' ') ?? '';
      return { kind: 'link', subject, target };
    }
  }
  return { kind: 'verb', verb: entry.verb, verbWord, segments: splitSegments(body) };
}

/** Mehrere Befehle in einer Zeile ("NIMM DISKETTE. LEGE SIE EIN") trennen. */
export function splitCommands(raw: string): string[] {
  const trimmed = raw.trim();
  if (/^(tippe?|notiere|notiz|notier)\b/i.test(trimmed)) return [trimmed];
  return trimmed
    .split(/\s*(?:[.;]\s+|[.;]$|\bund dann\b|\bdanach\b|\bdann\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

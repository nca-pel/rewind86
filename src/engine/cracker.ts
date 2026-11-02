/**
 * Chat mit dem Cracker RASTAR (STARDUST BBS). Kein Sprachmodell: Eine geordnete Liste von Absichten (Stichwörter),
 * ein Gedächtnis in den Spiel-Flags (`crk_*`), Echo-Antworten für »ICH MAG …« und Ausweichantworten sorgen dafür,
 * dass fast jeder Satz eine passende, nicht sich wiederholende Antwort bekommt. Persona: content/cracker.ts.
 */
import {
  CRACKER_EFFECTS,
  ECHO,
  FALLBACKS,
  FALLBACKS_Q,
  GREETINGS,
  INTENTS,
  type Intent,
} from '../content/cracker';
import type { Ctx } from './context';
import { applyEffects, discoverFact } from './effects';

export const CHAT_WIDTH = 40;

export interface ChatResult {
  /** Fertig umbrochene Zeilen; Listing-Zeilen sind höchstens 38 Zeichen lang */
  lines: string[];
  /** RASTAR beendet das Gespräch */
  end: boolean;
}

const NEXT_HINT: Record<string, string> = {
  group: 'FRAG MICH MAL NACH MEINER GRUPPE.',
  demo: 'WILLST DU WISSEN, WAS ES NEUES GIBT?',
  effects: 'SOLL ICH DIR EINEN EFFEKT DIKTIEREN?',
};

export function normalize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .replace(/ß/g, 'SS')
    .replace(/[^A-Z0-9?\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wrap(text: string, first = '', width = CHAT_WIDTH): string[] {
  const out: string[] = [];
  let line = first;
  const indent = ' '.repeat(first.length ? 2 : 0);
  for (const w of text.split(' ')) {
    if (line.trim() !== '' && (line + ' ' + w).length > width) {
      out.push(line);
      line = indent + w;
    } else line = line === '' || line === first ? line + w : line + ' ' + w;
  }
  if (line.trim() !== '') out.push(line);
  return out;
}

function count(ctx: Ctx, key: string): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : 0;
}
function bump(ctx: Ctx, key: string): number {
  const n = count(ctx, key) + 1;
  ctx.state.flags[key] = n;
  return n;
}

/** Begrüßung beim Betreten des Chats: erster Besuch, später Wiedersehen */
export function crackerOpen(ctx: Ctx, name: string): ChatResult {
  const visits = bump(ctx, 'crk_visits');
  discoverFact(ctx, 'rastar_met');
  const text = visits === 1 ? GREETINGS[0] : GREETINGS[1 + ((visits - 2) % (GREETINGS.length - 1))];
  return { lines: wrap(text.replace('{NAME}', name || 'GAST'), 'RASTAR> '), end: false };
}

function pickReply(ctx: Ctx, intent: Intent): string {
  const n = bump(ctx, `crk_n_${intent.id}`);
  const base = intent.replies[(n - 1) % intent.replies.length];
  return n > intent.replies.length ? `NOCH MAL: ${base}` : base;
}

function say(text: string): string[] {
  return wrap(text, 'RASTAR> ');
}

function effectAnswer(ctx: Ctx, id: string): ChatResult {
  const fx = CRACKER_EFFECTS.find((e) => e.id === id)!;
  const n = bump(ctx, `crk_fx_${id}`);
  discoverFact(ctx, `fx_${id === 'sinus' ? 'sinus' : id}`);
  ctx.state.flags.crk_last = id;
  const lines = [
    ...say(n === 1 ? fx.intro : `NOCH MAL DIE ZEILEN FUER DEN ${fx.name}:`),
    ...fx.listing,
    ...(n === 1 ? say(fx.outro) : []),
  ];
  return { lines, end: false };
}

/** Eine Zeile von Jan beantworten */
export function crackerSay(ctx: Ctx, raw: string): ChatResult {
  const text = normalize(raw);
  const total = bump(ctx, 'crk_total');
  if (text === '') return { lines: say('???'), end: false };
  ctx.state.flags.crk_asked =
    text.endsWith('?') || /\b(WER|WAS|WIE|WARUM|WIESO|WO|WANN|WELCHE\w*)\b/.test(text);

  // Effektwünsche zuerst: nur wenn Jan etwas Konkretes nennt
  for (const fx of CRACKER_EFFECTS) if (fx.match.test(text)) return effectAnswer(ctx, fx.id);

  for (const intent of INTENTS) {
    if (!intent.re.test(text)) continue;
    if (intent.id === 'yes' || intent.id === 'no') {
      // Kurze Antworten nur, wenn nichts Längeres gesagt wurde
      if (text.split(' ').length > 3) continue;
    }
    const reply = pickReply(ctx, intent);
    applyEffects(ctx, intent.effects);
    ctx.state.flags.crk_last = intent.id;
    if (intent.id === 'lamer') {
      const strikes = bump(ctx, 'crk_strikes');
      if (strikes >= 3) {
        ctx.state.flags.crk_strikes = 0;
        return { lines: [...say('REICHT. ICH MACH DEN KANAL ZU. BIS MORGEN.')], end: true };
      }
    }
    const hint = intent.next && count(ctx, `crk_n_${intent.next}`) === 0 ? NEXT_HINT[intent.next] : undefined;
    return { lines: say(hint ? `${reply} ${hint}` : reply), end: intent.id === 'bye' };
  }

  for (const e of ECHO) {
    const m = e.re.exec(text);
    if (m) return { lines: say(e.reply(m[1].trim())), end: false };
  }

  const q = ctx.state.flags.crk_asked === true;
  const pool = q ? FALLBACKS_Q : FALLBACKS;
  const reply = pool[total % pool.length];
  // Immer mal wieder ein Vorschlag, wenn die Unterhaltung festhängt
  const unseen = ['effects', 'demo', 'group'].find((id) => count(ctx, `crk_n_${id}`) === 0);
  const nudge = total % 3 === 0 && unseen ? ` ${NEXT_HINT[unseen]}` : '';
  return { lines: say(reply + nudge), end: false };
}

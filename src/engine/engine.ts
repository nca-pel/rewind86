/**
 * Öffentliche Engine-Schnittstelle: step(state, command) → neuer Zustand + Ausgaben.
 * Rein und deterministisch: kein Date.now(), kein Math.random(), keine DOM-Zugriffe.
 */
import { applyDifficulty, isHard } from './difficulty';
import { parseAdventure, splitCommands, type Intent } from '../parser/adventure';
import { c64Key, c64Line, c64Tick } from '../sim/c64';
import { giveHint, runIntent } from './actions';
import { formatClock } from './clock';
import { Ctx } from './context';
import { devCommand } from './dev';
import { resolveObject } from './resolve';
import { advanceTime, checkTriggers } from './time';
import type { Command, GameState, StepResult } from './types';

const MAX_INPUT = 300;
const MAX_NOTE = 500;

function introText(state: GameState): string {
  return `${formatClock(state.gameClock)}. Rheda-Wiedenbrück.

Herbst 1986. Seit Mittag nieselt es, dieses feine, zähe Novemberwetter, das nicht richtig regnet und nicht richtig aufhört. Drinnen ist es warm. Auf deinem Schreibtisch stehen der Commodore 64 mit Monitor, die 1541, das Telefon mit dem Akustikkoppler und dein Radio, und daneben liegt das neue »Heimcomputer-Journal«, heute mit der Post gekommen. Aus dem Wohnzimmer dringen gedämpfte Fernsehstimmen. Irgendwo im Gebälk knackt es, wie immer, wenn der Wind dreht.

Du bist Jan Keller, 16 – und das Wochenende fängt gerade erst an. Was soll schon passieren?`;
}

/** Offene Mehrdeutigkeitsrückfrage mit der neuen Eingabe beantworten, falls möglich. */
function applyPending(ctx: Ctx, intent: Intent): Intent {
  const pending = ctx.state.parser.pending;
  ctx.state.parser.pending = null;
  if (!pending) return intent;
  if (intent.kind !== 'bare') return intent;
  const r = resolveObject(ctx.state, intent.words, { among: pending.candidates });
  if (r.status !== 'ok') return intent;
  const original = JSON.parse(pending.intent) as Extract<Intent, { kind: 'verb' }>;
  original.segments[pending.segIndex] = { ...original.segments[pending.segIndex], words: [`#id:${r.id}`] };
  return original;
}

const AFTER_END_META = new Set(['load', 'saves', 'help', 'notes', 'time']);

function handleAdventure(ctx: Ctx, raw: string): void {
  ctx.input = raw.trim();
  let intent = parseAdventure(raw);
  if (ctx.state.flags.gameOver && !(intent.kind === 'meta' && AFTER_END_META.has(intent.meta))) {
    ctx.say('Das Spiel ist zu Ende. Mit LADEN kehrst du zu einem Spielstand zurück.', 'system');
    return;
  }
  intent = applyPending(ctx, intent);
  const minutes = runIntent(ctx, intent);
  if (minutes > 0) advanceTime(ctx, minutes);
}

export function step(state: GameState, cmd: Command): StepResult {
  const ctx = new Ctx(structuredClone(state));
  const s = ctx.state;

  switch (cmd.type) {
    case 'start':
      if (s.mode === 'title') {
        s.mode = 'desk';
        applyDifficulty(s, cmd.difficulty);
        ctx.say(introText(s));
        if (isHard(s))
          ctx.say(
            '(Schwierigkeit: SCHWER. Die Zeitschrift verrät weniger, das Netz ist misstrauischer, und die Telefonrechnung zahlst du selbst.)',
            'system',
          );
        ctx.say(
          '(Tippe HILFE für Beispielbefehle. Klick auf Gegenstände am Schreibtisch, um sie dir anzusehen.)',
          'system',
        );
        advanceTime(ctx, 0);
      }
      break;
    case 'adventure': {
      const raw = cmd.text.slice(0, MAX_INPUT);
      if (!raw.trim()) break;
      s.commandCount++;
      ctx.say(`> ${raw.trim()}`, 'echo');
      for (const part of splitCommands(raw)) handleAdventure(ctx, part);
      break;
    }
    case 'c64line': {
      if (s.flags.gameOver) break;
      s.commandCount++;
      const minutes = c64Line(ctx, cmd.text.slice(0, 80));
      if (minutes > 0) advanceTime(ctx, minutes);
      break;
    }
    case 'c64key': {
      if (s.flags.gameOver) break;
      const minutes = c64Key(ctx, cmd.key);
      if (minutes > 0) advanceTime(ctx, minutes);
      break;
    }
    case 'c64tick':
      // Animationstakt: verändert nie die Spielzeit (GDD §10.1)
      c64Tick(ctx);
      break;
    case 'note':
      if (cmd.op === 'add' && cmd.text.trim()) {
        s.deskNotes.push({
          id: `n${s.commandCount}_${s.deskNotes.length}_${s.nextLogId}`,
          text: cmd.text.trim().slice(0, MAX_NOTE),
          createdAtGameTime: s.gameClock,
        });
      } else if (cmd.op === 'edit') {
        const n = s.deskNotes.find((x) => x.id === cmd.id);
        if (n && cmd.text.trim()) n.text = cmd.text.trim().slice(0, MAX_NOTE);
      } else if (cmd.op === 'delete') {
        s.deskNotes = s.deskNotes.filter((x) => x.id !== cmd.id);
      }
      break;
    case 'hint':
      giveHint(ctx, cmd.puzzleId);
      break;
    case 'dev':
      devCommand(ctx, cmd.text.slice(0, MAX_INPUT));
      break;
  }
  checkTriggers(ctx);
  return { state: s, log: ctx.log, ui: ctx.ui, audio: ctx.audio };
}

/** Bequemer Helfer für Tests und Skripte: mehrere Befehle nacheinander ausführen. */
export function run(state: GameState, cmds: Command[]): StepResult {
  let res: StepResult = { state, log: [], ui: [], audio: [] };
  const log: StepResult['log'] = [];
  const ui: StepResult['ui'] = [];
  const audio: StepResult['audio'] = [];
  for (const c of cmds) {
    res = step(res.state, c);
    log.push(...res.log);
    ui.push(...res.ui);
    audio.push(...res.audio);
  }
  return { state: res.state, log, ui, audio };
}

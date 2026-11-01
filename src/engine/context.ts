import type { AbsenceKind, AudioCueId, GameState, LogEntry, ParseMissReason, UiEffect } from './types';

export interface PendingAbsence {
  kind: AbsenceKind;
  /** Ende in Spielminuten */
  untilMin: number;
  text: string;
  backText?: string;
}

const MAX_HISTORY = 400;
const MAX_DEBUG = 200;

/** Veränderbarer Arbeitskontext für genau einen Engine-Schritt (arbeitet auf einer Kopie des Zustands). */
export class Ctx {
  readonly log: LogEntry[] = [];
  readonly ui: UiEffect[] = [];
  readonly audio: AudioCueId[] = [];
  /** Wird von unterbrechenden Ereignissen gesetzt, um WARTE abzubrechen. */
  interrupted = false;
  /** Angeforderter Zeitblock (Schule, Schlaf …), wird von advanceTime() abgearbeitet. */
  absence: PendingAbsence | null = null;
  /** Läuft gerade ein Zeitblock? (keine verschachtelten Blöcke) */
  inAbsence = false;

  /** Aktuell verarbeitete Adventure-Eingabe (für das Playtest-Protokoll) */
  input = '';

  constructor(public state: GameState) {}

  /** Nicht verstandene Eingabe fürs lokale Playtest-Protokoll vormerken (nur UI-Effekt, ändert keinen Spielzustand) */
  miss(reason: ParseMissReason, detail?: string): void {
    if (this.input)
      this.ui.push({ type: 'parseMiss', input: this.input, reason, ...(detail ? { detail } : {}) });
  }

  say(text: string, kind: LogEntry['kind'] = 'story', speaker?: string): void {
    const entry: LogEntry = { id: this.state.nextLogId++, kind, text };
    if (speaker) entry.speaker = speaker;
    this.log.push(entry);
    this.state.history.push(entry);
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.splice(0, this.state.history.length - MAX_HISTORY);
    }
  }

  error(text: string): void {
    this.say(text, 'error');
  }

  debug(text: string): void {
    this.state.debugLog.push(`[${this.state.gameClock}] ${text}`);
    if (this.state.debugLog.length > MAX_DEBUG) this.state.debugLog.shift();
  }

  cue(id: AudioCueId): void {
    this.audio.push(id);
  }
}

import type { AudioCueId, GameState, LogEntry, UiEffect } from './types';

const MAX_HISTORY = 400;
const MAX_DEBUG = 200;

/** Veränderbarer Arbeitskontext für genau einen Engine-Schritt (arbeitet auf einer Kopie des Zustands). */
export class Ctx {
  readonly log: LogEntry[] = [];
  readonly ui: UiEffect[] = [];
  readonly audio: AudioCueId[] = [];
  /** Wird von unterbrechenden Ereignissen gesetzt, um WARTE abzubrechen. */
  interrupted = false;

  constructor(public state: GameState) {}

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

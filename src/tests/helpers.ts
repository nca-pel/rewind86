import { step } from '../engine/engine';
import { createInitialState } from '../engine/state';
import type { Command, GameState, LogEntry } from '../engine/types';
import { renderC64 } from '../sim/c64';

/** Kleines Testskript-Werkzeug: führt Befehle aus und sammelt Protokoll und Bildschirm. */
export class Session {
  state: GameState;
  log: LogEntry[] = [];
  ui: unknown[] = [];

  constructor(start = true) {
    this.state = createInitialState();
    if (start) this.do({ type: 'start' });
  }

  do(cmd: Command): LogEntry[] {
    const r = step(this.state, cmd);
    this.state = r.state;
    this.log.push(...r.log);
    this.ui.push(...r.ui);
    return r.log;
  }

  /** Adventure-Befehl; liefert den Ausgabetext */
  a(text: string): string {
    return this.do({ type: 'adventure', text })
      .map((l) => l.text)
      .join('\n');
  }

  /** C64-Zeile; liefert den Bildschirm */
  c(text: string): string {
    this.do({ type: 'c64line', text });
    return this.screen();
  }

  key(key: string): string {
    this.do({ type: 'c64key', key });
    return this.screen();
  }

  tick(n = 1): void {
    for (let i = 0; i < n; i++) this.do({ type: 'c64tick' });
  }

  screen(): string {
    return renderC64(this.state).lines.join('\n');
  }

  has(fact: string): boolean {
    return this.state.knownFacts.includes(fact);
  }
}

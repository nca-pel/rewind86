import type { Ctx } from '../../engine/context';
import type { AppState, C64Key, GameState } from '../../engine/types';

export interface Rendered {
  lines: string[];
  border: number;
  background: number;
  text: number;
  /** Rahmenflackern (wird bei reduzierter Bewegung unterdrückt) */
  flash?: boolean;
  /** Index eines Demo-Screens, der per Canvas gezeichnet wird */
  demoScreen?: number;
  /** Zeilenweise Textfarben (Index → C64-Farbe) */
  lineColors?: Record<number, number>;
  inputMode: 'basic' | 'keys' | 'line';
  cursor: boolean;
}

export interface AppResult {
  minutes?: number;
  exit?: boolean;
  switchTo?: string;
}

export interface AppDef<S extends AppState = AppState> {
  id: string;
  /** Intervall für c64tick in ms (null = kein Takt) */
  tickMs: number | null;
  start(ctx: Ctx): S;
  key(ctx: Ctx, app: S, key: C64Key): AppResult;
  line?(ctx: Ctx, app: S, text: string): AppResult;
  tick?(ctx: Ctx, app: S): AppResult;
  inputMode(app: S): 'keys' | 'line';
  render(state: GameState, app: S): Omit<Rendered, 'inputMode' | 'cursor'> & { cursor?: boolean };
}

export function pad(s: string, n: number): string {
  return (s + ' '.repeat(n)).slice(0, n);
}

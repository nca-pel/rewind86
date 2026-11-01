/**
 * Schwierigkeitsgrad (Normal/Schwer). Gewählt beim Spielstart, gespeichert als Flag `hardMode` im Spielstand –
 * so bleibt die Engine deterministisch und alte Spielstände laufen unverändert als »Normal« weiter.
 * Was »Schwer« ändert, steht bei GAME_CONFIG.hard.
 */
import { GAME_CONFIG } from '../content/config';
import { LOADER_LINES_HARD } from '../content/disks';
import type { Difficulty, GameState } from './types';

export function isHard(state: GameState): boolean {
  return state.flags.hardMode === true;
}

export function difficultyOf(state: GameState): Difficulty {
  return isHard(state) ? 'hard' : 'normal';
}

/** Risikowerte des geheimen Netzes für den aktuellen Schwierigkeitsgrad */
export type RiskConfig = { [K in keyof typeof GAME_CONFIG.risk]: number };

export function riskConfig(state: GameState): RiskConfig {
  return isHard(state) ? { ...GAME_CONFIG.risk, ...GAME_CONFIG.hard.risk } : GAME_CONFIG.risk;
}

/** Beim Spielstart: Flag setzen und die Inhalte anpassen, die im Zustand liegen (Ralfs Diskette). */
export function applyDifficulty(state: GameState, difficulty: Difficulty | undefined): void {
  if (difficulty !== 'hard') return;
  state.flags.hardMode = true;
  const loader = state.disks.game?.files.find((f) => f.name === 'LADER');
  if (loader) loader.basic = [...LOADER_LINES_HARD];
}

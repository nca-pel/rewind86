import { DISK_ITEM_TO_IMAGE } from '../content/objects';
import type { GameState, VirtualDisk } from '../engine/types';

/** Diskettenabbild, das gerade in der 1541 steckt */
export function diskInDrive(state: GameState): VirtualDisk | null {
  const item = Object.entries(state.itemLocations).find(([, loc]) => loc === 'drive')?.[0];
  if (!item) return null;
  return state.disks[DISK_ITEM_TO_IMAGE[item]] ?? null;
}

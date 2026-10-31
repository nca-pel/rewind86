import { GAME_CONFIG } from '../content/config';
import { INITIAL_DISKS } from '../content/disks';
import { EVENTS } from '../content/events';
import { OBJECTS } from '../content/objects';
import { INITIAL_ARCHIVE } from '../content/archive';
import { PUZZLES } from '../content/puzzles';
import type { GameState, ItemLocation, ScreenState } from './types';

export const SCHEMA_VERSION = 1;

export const C64_BOOT_LINES = [
  '',
  '    **** COMMODORE 64 BASIC V2 ****',
  '',
  ' 64K RAM SYSTEM  38911 BASIC BYTES FREE',
  '',
  'READY.',
];

export function bootScreen(): ScreenState {
  return { lines: [...C64_BOOT_LINES], border: 14, background: 6, text: 14 };
}

export function createInitialState(seed = 1986): GameState {
  const itemLocations: Record<string, ItemLocation> = {};
  for (const o of OBJECTS) if (o.portable && o.initialLocation) itemLocations[o.id] = o.initialLocation;

  return {
    schemaVersion: SCHEMA_VERSION,
    gameClock: GAME_CONFIG.startDate,
    mode: 'title',
    conversation: null,
    itemLocations,
    objectStates: {
      drawer: { open: false },
      package: { open: false },
      radio: { on: false, station: 'pop' },
      coupler: { carrier: false },
      door: { open: false },
    },
    flags: {},
    knownFacts: [],
    knownTopics: [],
    hypotheses: [],
    puzzles: Object.fromEntries(PUZZLES.map((p) => [p.id, 'unknown'])),
    hintLevels: {},
    relationships: { ...GAME_CONFIG.relationshipsStart },
    moneyDm: GAME_CONFIG.economy.startMoneyDm,
    phoneCostsDm: 0,
    deskNotes: [],
    archive: INITIAL_ARCHIVE.map((e) => ({ ...e })),
    computer: {
      powerOn: false,
      driveOn: false,
      screen: { lines: [], border: 14, background: 6, text: 14 },
      program: [],
      programIsDirectory: false,
      loaded: null,
      run: null,
      app: null,
      memory: {},
      inputHistory: [],
    },
    disks: structuredClone(INITIAL_DISKS),
    telecom: {
      ringing: null,
      handset: 'cradle',
      call: null,
      houseLineBusyUntil: null,
      connectedSystemId: null,
      currentUserHandle: null,
      messageReadIds: [],
      messagePostedIds: [],
      onlineMinutes: 0,
    },
    scheduledEvents: EVENTS.filter((e) => e.at).map((e) => ({
      id: e.id,
      at: e.at!,
      status: 'pending' as const,
    })),
    firedEvents: [],
    history: [],
    nextLogId: 1,
    parser: { lastObjectId: null, pending: null },
    rngSeed: seed,
    commandCount: 0,
    debugLog: [],
  };
}

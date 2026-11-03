import { bootVideo, getBootProfile, type BootProfile } from '../c64/boot';
import { createVideo } from '../c64/video';
import { GAME_CONFIG } from '../content/config';
import { INITIAL_DISKS } from '../content/disks';
import { EVENTS } from '../content/events';
import { OBJECTS } from '../content/objects';
import { INITIAL_ARCHIVE } from '../content/archive';
import { PUZZLES } from '../content/puzzles';
import { nextOccurrence } from './routine';
import type { GameState, ItemLocation, ScreenState } from './types';

/**
 * 2: Bildschirm als Bildschirm-/Farbspeicher statt Textzeilen · 3: Mailbox-Konten (telecom.bbs) ·
 * 4: Kennungssperren, Risiko-Minuten · 5: Tagesablauf (tägliche Ereignisse, Gebührenablesung, Brief)
 */
export const SCHEMA_VERSION = 9;

/** Erste Termine der täglichen Ereignisse ab `clock` */
export function dailySchedule(clock: string): Array<{ id: string; at: string; status: 'pending' }> {
  return EVENTS.filter((e) => e.daily).map((e) => ({
    id: e.id,
    at: nextOccurrence(clock, e.daily!),
    status: 'pending' as const,
  }));
}

/** Das konfigurierte (austauschbare) Startbildschirm-Profil */
export function bootProfile(): BootProfile {
  return getBootProfile(GAME_CONFIG.c64.bootProfile);
}

export function bootScreen(): ScreenState {
  return bootVideo(bootProfile());
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
      screen: createVideo(),
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
      bbs: {},
      locks: {},
      riskMinutes: 0,
      costsAtLastReading: 0,
    },
    scheduledEvents: [
      ...EVENTS.filter((e) => e.at).map((e) => ({
        id: e.id,
        at: e.at!,
        status: 'pending' as const,
      })),
      ...dailySchedule(GAME_CONFIG.startDate),
    ],
    firedEvents: [],
    history: [],
    nextLogId: 1,
    parser: { lastObjectId: null, pending: null },
    rngSeed: seed,
    commandCount: 0,
    debugLog: [],
  };
}

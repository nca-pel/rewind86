/**
 * Speicherformat, Validierung und Migration.
 * Virtuelle 1541-Disketten sind Teil des Spielzustands und strikt getrennt von dieser Browser-Speicherdatei.
 */
import { z } from 'zod';
import { CELLS, TEXT_COLS, TEXT_ROWS } from '../c64/geometry';
import { textToScreen } from '../c64/petscii';
import { videoFromLines, type VideoState } from '../c64/video';
import { GAME_CONFIG } from '../content/config';
import { BLANK_DISKS, LOADER_LINES } from '../content/disks';
import { EVENT_BY_ID } from '../content/events';
import { SCHEMA_VERSION, dailySchedule } from './state';
import type { GameState } from './types';

export const SAVE_FORMAT = 'rewind1986-save';
/** Obergrenze für importierte Dateien (GDD §16.4 / §20.4) */
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;

const flagValue = z.union([z.boolean(), z.number(), z.string()]);
const clock = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const location = z.enum(['inventory', 'desk', 'drawer', 'drive', 'datasette', 'port', 'nowhere']);
const puzzleStatus = z.enum(['unknown', 'discovered', 'solving', 'solved', 'bypassed']);
const color = z.number().int().min(0).max(15);
const shortStr = z.string().max(2000);

const virtualFile = z.object({
  name: z.string().max(16),
  type: z.enum(['PRG', 'SEQ', 'USR', 'REL', 'DEL']),
  blocks: z.number().int().min(0).max(664),
  appId: z.string().optional(),
  basic: z.array(z.string().max(255)).max(2000).optional(),
  textContent: z.string().max(20000).optional(),
  hiddenUntilFact: z.string().optional(),
});

const virtualDisk = z.object({
  id: z.string(),
  header: z.string().max(16),
  diskId: z.string().max(2),
  writeProtected: z.boolean(),
  blocksTotal: z.number().int(),
  files: z.array(virtualFile).max(144),
  formatted: z.boolean().optional(),
});

const basicRun = z.object({
  pc: z.object({ line: z.number().int(), stmt: z.number().int() }),
  vars: z.record(z.union([z.string(), z.number()])),
  arrays: z.record(
    z.object({
      dims: z.array(z.number().int()),
      data: z.array(z.union([z.string(), z.number()])).max(10000),
    }),
  ),
  forStack: z
    .array(z.object({ v: z.string(), to: z.number(), step: z.number(), line: z.number(), stmt: z.number() }))
    .max(64),
  gosubStack: z.array(z.object({ line: z.number(), stmt: z.number() })).max(64),
  dataPtr: z.number().int().min(0),
  awaitingInput: z.array(z.string()).nullable(),
  rng: z.number(),
  fns: z
    .record(
      z.object({
        param: z.string().max(3),
        body: z.array(z.object({ t: z.string(), v: z.union([z.string(), z.number()]) })).max(255),
      }),
    )
    .optional(),
  files: z
    .record(
      z.object({
        mode: z.enum(['r', 'w']),
        name: z.string().max(16),
        data: z.string().max(20000),
        pos: z.number().int().min(0),
        cmd: z.boolean().optional(),
      }),
    )
    .optional(),
});

const storedMessage = z.object({
  id: z.string().max(64),
  from: z.string().max(16),
  to: z.string().max(16),
  subject: z.string().max(40),
  body: z.array(z.string().max(80)).max(20),
  at: clock,
  board: z.string().max(32).optional(),
});

const callState = z.object({
  kind: z.enum(['incoming', 'dialtone', 'voice', 'carrier', 'dead', 'occupied']),
  with: z.string().nullable(),
  number: z.string().nullable(),
  startedAt: clock,
  unitsCharged: z.number().int().min(0),
  outgoing: z.boolean(),
});

export const gameStateSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  gameClock: clock,
  mode: z.enum(['title', 'desk', 'conversation']),
  conversation: z.object({ npc: z.string(), turns: z.number().int() }).nullable(),
  itemLocations: z.record(location),
  objectStates: z.record(z.record(flagValue)),
  flags: z.record(flagValue),
  knownFacts: z.array(z.string()).max(1000),
  knownTopics: z.array(z.string()).max(500),
  hypotheses: z
    .array(
      z.object({
        id: z.string(),
        subject: shortStr,
        target: shortStr,
        notes: shortStr.optional(),
        status: z.literal('vermutung'),
      }),
    )
    .max(500),
  puzzles: z.record(puzzleStatus),
  hintLevels: z.record(z.number().int().min(0).max(3)),
  relationships: z.object({
    seidelSuspicion: z.number().min(0).max(100),
    ralfTrust: z.number().min(0).max(100),
    networkCredibility: z.number().min(0).max(100),
  }),
  moneyDm: z.number(),
  phoneCostsDm: z.number().min(0),
  deskNotes: z.array(z.object({ id: z.string(), text: shortStr, createdAtGameTime: clock })).max(500),
  archive: z
    .array(
      z.object({
        id: z.string(),
        section: z.enum(['personen', 'telefon', 'mailboxen', 'nachrichten', 'notizen']),
        title: z.string().max(40),
        text: z.string().max(400),
      }),
    )
    .max(1000),
  computer: z.object({
    powerOn: z.boolean(),
    driveOn: z.boolean(),
    screen: z.object({
      chars: z.array(z.number().int().min(0).max(255)).length(CELLS),
      colors: z.array(color).length(CELLS),
      border: color,
      background: color,
      text: color,
      cx: z
        .number()
        .int()
        .min(0)
        .max(TEXT_COLS - 1),
      cy: z
        .number()
        .int()
        .min(0)
        .max(TEXT_ROWS - 1),
      links: z.array(z.boolean()).length(TEXT_ROWS),
      rvs: z.boolean(),
      quote: z.boolean(),
      lower: z.boolean(),
      blank: z.boolean(),
    }),
    program: z
      .array(z.object({ num: z.number().int().min(0).max(63999), text: z.string().max(255) }))
      .max(5000),
    programIsDirectory: z.boolean(),
    loaded: z.object({ name: z.string(), appId: z.string().optional(), diskId: z.string() }).nullable(),
    run: basicRun.nullable(),
    app: z.object({ id: z.string() }).passthrough().nullable(),
    memory: z.record(z.number().int().min(0).max(255)),
    inputHistory: z.array(z.string().max(80)).max(50),
  }),
  disks: z.record(virtualDisk),
  telecom: z.object({
    bbs: z
      .record(
        z.object({
          handle: z.string().min(1).max(12),
          status: z.enum(['neu', 'mitglied']),
          validateAt: clock,
          lastLogin: clock.nullable(),
          inbox: z.array(storedMessage).max(200),
          posts: z.array(storedMessage).max(200),
          downloads: z.array(z.string().max(16)).max(50),
        }),
      )
      .refine((r) => Object.keys(r).length <= 20),
    locks: z.record(clock).refine((r) => Object.keys(r).length <= 20),
    riskMinutes: z.number().int().min(0).max(100000),
    costsAtLastReading: z.number().min(0).max(100000),
    ringing: z.string().nullable(),
    handset: z.enum(['cradle', 'hand', 'coupler']),
    call: callState.nullable(),
    houseLineBusyUntil: clock.nullable(),
    connectedSystemId: z.string().nullable(),
    currentUserHandle: z.string().nullable(),
    messageReadIds: z.array(z.string()),
    messagePostedIds: z.array(z.string()),
    onlineMinutes: z.number().int().min(0),
  }),
  scheduledEvents: z
    .array(z.object({ id: z.string(), at: clock, status: z.enum(['pending', 'done', 'cancelled']) }))
    .max(2000),
  firedEvents: z.array(z.string()).max(2000),
  history: z
    .array(
      z.object({
        id: z.number().int(),
        kind: z.enum(['story', 'system', 'dialog', 'echo', 'thought', 'caption', 'error']),
        text: z.string().max(5000),
        speaker: z.string().optional(),
      }),
    )
    .max(1000),
  nextLogId: z.number().int(),
  parser: z.object({
    lastObjectId: z.string().nullable(),
    pending: z
      .object({ intent: z.string().max(5000), segIndex: z.number().int(), candidates: z.array(z.string()) })
      .nullable(),
  }),
  rngSeed: z.number(),
  commandCount: z.number().int(),
  debugLog: z.array(z.string()).max(500),
});

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  savedAt: string;
  label: string;
  gameClock: string;
  state: GameState;
}

const saveFileSchema = z.object({
  format: z.literal(SAVE_FORMAT),
  schemaVersion: z.number().int(),
  savedAt: z.string().max(40),
  label: z.string().max(100),
  gameClock: z.string(),
  state: z.unknown(),
});

/** v1 → v2: Textzeilen des Bildschirms in Bildschirm-/Farbspeicher überführen */
function migrateScreenV1(old: {
  lines?: unknown;
  border?: number;
  background?: number;
  text?: number;
}): VideoState {
  const lines = Array.isArray(old.lines) ? old.lines.filter((l): l is string => typeof l === 'string') : [];
  const opts = { border: old.border ?? 14, background: old.background ?? 6, text: old.text ?? 14 };
  const kept = lines.slice(-(TEXT_ROWS - 1));
  const v = videoFromLines(kept, opts, textToScreen);
  v.cy = Math.min(kept.length, TEXT_ROWS - 1);
  return v;
}

/** Migrationen des Spielzustands: schemaVersion n → n+1 */
const MIGRATIONS: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  1: (s) => {
    const comp = s.computer as { screen?: Record<string, unknown> } | undefined;
    const screen = comp?.screen ? migrateScreenV1(comp.screen) : undefined;
    return { ...s, schemaVersion: 2, computer: screen ? { ...comp, screen } : comp };
  },
  2: (s) => {
    const telecom = (s.telecom ?? {}) as Record<string, unknown>;
    return { ...s, schemaVersion: 3, telecom: { ...telecom, bbs: telecom.bbs ?? {} } };
  },
  3: (s) => {
    const telecom = (s.telecom ?? {}) as Record<string, unknown>;
    return {
      ...s,
      schemaVersion: 4,
      telecom: { ...telecom, locks: telecom.locks ?? {}, riskMinutes: telecom.riskMinutes ?? 0 },
    };
  },
  4: (s) => {
    const telecom = (s.telecom ?? {}) as Record<string, unknown>;
    const items = (s.itemLocations ?? {}) as Record<string, unknown>;
    const events = (s.scheduledEvents ?? []) as Array<{ id: string; status: string }>;
    const clock = typeof s.gameClock === 'string' ? s.gameClock : GAME_CONFIG.startDate;
    const missing = dailySchedule(clock).filter(
      (d) => !events.some((e) => e.id === d.id && e.status === 'pending'),
    );
    return {
      ...s,
      schemaVersion: 5,
      telecom: { ...telecom, costsAtLastReading: telecom.costsAtLastReading ?? s.phoneCostsDm ?? 0 },
      itemLocations: { club_letter: 'nowhere', ...items },
      scheduledEvents: [...events, ...missing],
    };
  },
  8: (s) => {
    // Neue Leerdisketten aus der Schublade (unformatiert) und ihre Gegenstände nachtragen
    const items = (s.itemLocations ?? {}) as Record<string, unknown>;
    const disks = (s.disks ?? {}) as Record<string, unknown>;
    return {
      ...s,
      schemaVersion: 9,
      itemLocations: {
        ...Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`disk_new${n}`, 'drawer'])),
        ...items,
      },
      disks: { ...structuredClone(BLANK_DISKS), ...disks },
    };
  },
  7: (s) => {
    // Das Päckchen ist kein eigener Gegenstand mehr: was darin lag, liegt jetzt auf dem Tisch
    const items = Object.fromEntries(
      Object.entries((s.itemLocations ?? {}) as Record<string, unknown>)
        .filter(([id]) => id !== 'package')
        .map(([id, loc]) => [id, loc === 'package' ? 'desk' : loc]),
    );
    const objectStates = { ...((s.objectStates ?? {}) as Record<string, unknown>) };
    delete objectStates.package;
    return { ...s, schemaVersion: 8, itemLocations: items, objectStates };
  },
  6: (s) => {
    const items = (s.itemLocations ?? {}) as Record<string, unknown>;
    return { ...s, schemaVersion: 7, itemLocations: { btx_kit: 'nowhere', ...items } };
  },
  5: (s) => {
    const items = (s.itemLocations ?? {}) as Record<string, unknown>;
    const events = (s.scheduledEvents ?? []) as Array<{ id: string; status: string }>;
    const known = new Set(events.map((e) => e.id));
    const clock = typeof s.gameClock === 'string' ? s.gameClock : GAME_CONFIG.startDate;
    // Neues terminiertes Ereignis des Schlüssel-Strangs nachtragen, sofern es noch bevorsteht
    const at = EVENT_BY_ID.ev_ralf_cassette.at!;
    const added =
      !known.has('ev_ralf_cassette') && clock < at ? [{ id: 'ev_ralf_cassette', at, status: 'pending' }] : [];
    // Der LADER auf Ralfs Kopie trägt jetzt die versteckte REM-Zeile (Diskette ist schreibgeschützt)
    const disks = (s.disks ?? {}) as Record<string, { files?: Array<{ name: string; basic?: string[] }> }>;
    const game = disks.game;
    const files = game?.files?.map((f) => (f.name === 'LADER' ? { ...f, basic: [...LOADER_LINES] } : f));
    return {
      ...s,
      schemaVersion: 6,
      disks: game ? { ...disks, game: { ...game, files } } : disks,
      itemLocations: { cassette: 'nowhere', ...items },
      scheduledEvents: [...events, ...added],
    };
  },
};

export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  let s = raw;
  let v = typeof s.schemaVersion === 'number' ? s.schemaVersion : 0;
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`Keine Migration von Version ${v} verfügbar.`);
    s = m(s);
    v = s.schemaVersion as number;
  }
  return s;
}

export function createSaveFile(state: GameState, label: string, savedAt: string): SaveFile {
  return {
    format: SAVE_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    savedAt,
    label,
    gameClock: state.gameClock,
    state,
  };
}

export function serializeSave(file: SaveFile): string {
  return JSON.stringify(file);
}

export type ParseResult = { ok: true; file: SaveFile } | { ok: false; error: string };

export function parseSave(text: string): ParseResult {
  if (text.length > MAX_SAVE_BYTES) return { ok: false, error: 'Die Datei ist zu groß (max. 2 MB).' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }
  const outer = saveFileSchema.safeParse(json);
  if (!outer.success) return { ok: false, error: 'Das ist keine REWIND-1986-Spielstanddatei.' };
  if (outer.data.schemaVersion > SCHEMA_VERSION)
    return { ok: false, error: 'Der Spielstand stammt aus einer neueren Spielversion.' };
  let migrated: Record<string, unknown>;
  try {
    migrated = migrate(outer.data.state as Record<string, unknown>);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const inner = gameStateSchema.safeParse(migrated);
  if (!inner.success) {
    const issue = inner.error.issues[0];
    return { ok: false, error: `Ungültiger Spielstand (${issue.path.join('.')}: ${issue.message}).` };
  }
  return {
    ok: true,
    file: { ...outer.data, schemaVersion: SCHEMA_VERSION, state: inner.data as unknown as GameState },
  };
}

/**
 * Zentrale, serialisierbare Datentypen der Game-Engine.
 * Alles im GameState muss JSON-tauglich sein (kein Date, keine Map, keine Funktionen).
 */

export type FactId = string;
export type FlagId = string;
export type ItemId = string;
export type EventId = string;
export type PuzzleId = string;

export type FlagValue = boolean | number | string;

export type PuzzleStatus = 'unknown' | 'discovered' | 'solving' | 'solved' | 'bypassed';

export type RelationshipId = 'seidelSuspicion' | 'ralfTrust' | 'networkCredibility';

export type GameMode = 'title' | 'desk' | 'conversation';

/** Orte, an denen sich bewegliche Gegenstände befinden können. */
export type ItemLocation = 'inventory' | 'desk' | 'drawer' | 'package' | 'drive' | 'nowhere';

export type C64Color = number; // 0..15, C64-Palettenindex

export interface VirtualFile {
  name: string;
  type: 'PRG' | 'SEQ' | 'USR' | 'REL' | 'DEL';
  blocks: number;
  /** Startet eine simulierte Anwendung, wenn das Programm per RUN/SYS gestartet wird. */
  appId?: string;
  /** BASIC-Programmzeilen (für LIST / RUN). */
  basic?: string[];
  /** Inhalt sequenzieller Dateien. */
  textContent?: string;
  /** Nur sichtbar, wenn dieser Fakt bekannt ist. */
  hiddenUntilFact?: FactId;
}

export interface VirtualDisk {
  id: string;
  /** Diskettenname im Directory-Header, max. 16 Zeichen. */
  header: string;
  diskId: string;
  writeProtected: boolean;
  blocksTotal: number;
  files: VirtualFile[];
}

export interface ProgramLine {
  num: number;
  text: string;
}

/** Laufzeitzustand eines BASIC-Programms – vollständig serialisierbar (für INPUT-Pausen). */
export interface BasicRun {
  pc: { line: number; stmt: number };
  vars: Record<string, string | number>;
  arrays: Record<string, { dims: number[]; data: Array<string | number> }>;
  forStack: Array<{ v: string; to: number; step: number; line: number; stmt: number }>;
  gosubStack: Array<{ line: number; stmt: number }>;
  dataPtr: number;
  /** Wartet auf INPUT in diese Variablen. */
  awaitingInput: string[] | null;
  rng: number;
}

export interface ScreenState {
  lines: string[];
  border: C64Color;
  background: C64Color;
  text: C64Color;
}

export interface AppState {
  id: string;
  [key: string]: unknown;
}

export interface ComputerState {
  powerOn: boolean;
  driveOn: boolean;
  screen: ScreenState;
  program: ProgramLine[];
  /** True, wenn der Programmspeicher ein geladenes Directory enthält (LOAD"$",8). */
  programIsDirectory: boolean;
  /** Zuletzt geladene Datei – bei Maschinenprogrammen startet RUN/SYS die zugehörige App. */
  loaded: { name: string; appId?: string; diskId: string } | null;
  run: BasicRun | null;
  app: AppState | null;
  memory: Record<string, number>;
  inputHistory: string[];
}

export interface CallState {
  /** 'ralf', 'number', 'carrier:<systemId>', 'dialtone', 'parent' */
  kind: 'incoming' | 'dialtone' | 'voice' | 'carrier' | 'dead' | 'occupied';
  with: string | null;
  number: string | null;
  startedAt: string;
  unitsCharged: number;
  outgoing: boolean;
}

export interface TelecomState {
  ringing: string | null;
  handset: 'cradle' | 'hand' | 'coupler';
  call: CallState | null;
  /** Ein anderes Familienmitglied benutzt die Leitung bis zu diesem Zeitpunkt. */
  houseLineBusyUntil: string | null;
  connectedSystemId: string | null;
  currentUserHandle: string | null;
  messageReadIds: string[];
  messagePostedIds: string[];
  onlineMinutes: number;
}

export interface ArchiveEntry {
  id: string;
  section: 'personen' | 'telefon' | 'mailboxen' | 'nachrichten' | 'notizen';
  title: string;
  text: string;
}

export interface DeskNote {
  id: string;
  text: string;
  createdAtGameTime: string;
}

export interface Hypothesis {
  id: string;
  subject: string;
  target: string;
  notes?: string;
  /** Hypothesen werden nie automatisch bestätigt. */
  status: 'vermutung';
}

export interface LogEntry {
  id: number;
  kind: 'story' | 'system' | 'dialog' | 'echo' | 'thought' | 'caption' | 'error';
  text: string;
  speaker?: string;
}

export interface ScheduledEvent {
  id: EventId;
  at: string;
  status: 'pending' | 'done' | 'cancelled';
}

export interface ParserContext {
  lastObjectId: string | null;
  /** Offene Mehrdeutigkeitsrückfrage. */
  pending: { intent: string; segIndex: number; candidates: string[] } | null;
}

export interface GameState {
  schemaVersion: number;
  gameClock: string;
  mode: GameMode;
  conversation: { npc: string; turns: number } | null;
  itemLocations: Record<ItemId, ItemLocation>;
  objectStates: Record<string, Record<string, FlagValue>>;
  flags: Record<FlagId, FlagValue>;
  knownFacts: FactId[];
  knownTopics: string[];
  hypotheses: Hypothesis[];
  puzzles: Record<PuzzleId, PuzzleStatus>;
  hintLevels: Record<PuzzleId, number>;
  relationships: Record<RelationshipId, number>;
  moneyDm: number;
  phoneCostsDm: number;
  deskNotes: DeskNote[];
  archive: ArchiveEntry[];
  computer: ComputerState;
  disks: Record<string, VirtualDisk>;
  telecom: TelecomState;
  scheduledEvents: ScheduledEvent[];
  firedEvents: EventId[];
  history: LogEntry[];
  nextLogId: number;
  parser: ParserContext;
  rngSeed: number;
  commandCount: number;
  debugLog: string[];
}

// ---------------------------------------------------------------------------
// Bedingungen und Effekte (deklarativ, ohne ausführbaren Code in Contentdaten)
// ---------------------------------------------------------------------------

export type Condition =
  | { fact: FactId }
  | { notFact: FactId }
  | { flag: FlagId; eq?: FlagValue }
  | { notFlag: FlagId }
  | { itemAt: ItemId; loc: ItemLocation }
  | { notItemAt: ItemId; loc: ItemLocation }
  | { objState: string; key: string; eq: FlagValue }
  | { timeAfter: string }
  | { timeBefore: string }
  | { lineBusy: true }
  | { online: true }
  | { ringing: true }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type GameEffect =
  | { type: 'setFlag'; id: FlagId; value: FlagValue }
  | { type: 'discoverFact'; id: FactId }
  | { type: 'addTopic'; id: string }
  | { type: 'moveItem'; id: ItemId; to: ItemLocation }
  | { type: 'setObjectState'; id: string; key: string; value: FlagValue }
  | { type: 'changeRelationship'; id: RelationshipId; delta: number }
  | { type: 'changeMoney'; deltaDm: number }
  | { type: 'scheduleEvent'; id: EventId; inMinutes: number }
  | { type: 'cancelEvent'; id: EventId }
  | { type: 'puzzle'; id: PuzzleId; status: PuzzleStatus }
  | { type: 'startConversation'; npc: string }
  | { type: 'endConversation' }
  | { type: 'say'; text: string; kind?: LogEntry['kind']; speaker?: string }
  | { type: 'audio'; cue: AudioCueId }
  | { type: 'ui'; effect: UiEffect }
  | { type: 'telecom'; op: 'stopRinging' | 'ring'; who?: string }
  | { type: 'telecom'; op: 'houseBusy'; minutes: number };

export type AudioCueId =
  | 'phone_ring'
  | 'doorbell'
  | 'drive'
  | 'modem'
  | 'dialtone'
  | 'busy'
  | 'keyclick'
  | 'door'
  | 'hangup';

export type UiEffect =
  | { type: 'focus'; target: 'c64' | 'adventure' }
  | { type: 'openDetail'; id: string }
  | { type: 'closeDetail' }
  | { type: 'openNotebook' }
  | { type: 'save'; slot: string }
  | { type: 'load'; slot: string }
  | { type: 'listSaves' }
  | { type: 'autosave'; reason: string }
  | { type: 'demoMusic'; on: boolean }
  | { type: 'sliceEnd' };

export interface StepResult {
  state: GameState;
  /** Neue Einträge im Adventure-Protokoll (auch in state.history enthalten). */
  log: LogEntry[];
  ui: UiEffect[];
  audio: AudioCueId[];
}

export type C64Key =
  | 'RETURN'
  | 'RUNSTOP'
  | 'SPACE'
  | 'ARROW_LEFT'
  | 'F1'
  | 'F3'
  | 'F5'
  | 'F7'
  | 'CLRHOME'
  | 'DEL'
  | string; // einzelnes Zeichen

export type Command =
  | { type: 'start' }
  | { type: 'adventure'; text: string }
  | { type: 'c64line'; text: string }
  | { type: 'c64key'; key: C64Key }
  | { type: 'c64tick' }
  | { type: 'note'; op: 'add'; text: string }
  | { type: 'note'; op: 'edit'; id: string; text: string }
  | { type: 'note'; op: 'delete'; id: string }
  | { type: 'hint'; puzzleId?: string };

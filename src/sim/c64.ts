/**
 * Simulierter Commodore 64 (kein Emulator): BASIC-V2-Teilmenge, 1541-Laufwerk mit virtuellen
 * Disketten und programmartige "Apps" für Maschinenprogramme.
 */
import { DISK_ITEM_TO_IMAGE } from '../content/objects';
import type { Ctx } from '../engine/context';
import { discoverFact } from '../engine/effects';
import { bootScreen } from '../engine/state';
import type { C64Key, GameState, ProgramLine, VirtualDisk, VirtualFile } from '../engine/types';
import { archiveApp } from './apps/archive';
import { intruderApp } from './apps/intruder';
import { modkApp } from './apps/modk';
import type { AppDef, AppResult, Rendered } from './apps/types';
import { wt07App } from './apps/wt07';
import { BasicError, Interpreter, newRun, type BasicHost, type RunStatus } from './basic/interpreter';
import { COLS, ROWS, printLine, toPetsciiText } from './screen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const APPS: Record<string, AppDef<any>> = {
  wt07: wt07App,
  modk: modkApp,
  archive: archiveApp,
  intruder: intruderApp,
};

const COLOR_CODES: Record<number, number> = {
  144: 0,
  5: 1,
  28: 2,
  159: 3,
  156: 4,
  30: 5,
  31: 6,
  158: 7,
  129: 8,
  149: 9,
  150: 10,
  151: 11,
  152: 12,
  153: 13,
  154: 14,
  155: 15,
};

export function diskInDrive(state: GameState): VirtualDisk | null {
  const item = Object.entries(state.itemLocations).find(([, loc]) => loc === 'drive')?.[0];
  if (!item) return null;
  return state.disks[DISK_ITEM_TO_IMAGE[item]] ?? null;
}

export function visibleFiles(state: GameState, disk: VirtualDisk): VirtualFile[] {
  return disk.files.filter((f) => !f.hiddenUntilFact || state.knownFacts.includes(f.hiddenUntilFact));
}

/** Directory wie bei LOAD"$",8 – Zeilennummer = Blockzahl. */
export function directoryProgram(state: GameState, disk: VirtualDisk): ProgramLine[] {
  const files = visibleFiles(state, disk);
  const used = files.reduce((a, f) => a + f.blocks, 0);
  const header = `"${(disk.header + ' '.repeat(16)).slice(0, 16)}" ${disk.diskId} 2A`;
  const lines: ProgramLine[] = [{ num: 0, text: header }];
  for (const f of files) {
    const name = `"${f.name}"`;
    const gap = ' '.repeat(Math.max(1, 4 - String(f.blocks).length));
    lines.push({ num: f.blocks, text: `${gap}${(name + ' '.repeat(18)).slice(0, 18)} ${f.type}` });
  }
  lines.push({ num: Math.max(0, disk.blocksTotal - used), text: 'BLOCKS FREE.' });
  return lines;
}

function parseBasicLines(src: string[]): ProgramLine[] {
  return src
    .map((l) => /^(\d+)\s*(.*)$/.exec(l))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ num: parseInt(m[1], 10), text: m[2] }));
}

function matchFile(files: VirtualFile[], pattern: string): VirtualFile | undefined {
  const prg = files.filter((f) => f.type === 'PRG');
  if (pattern === '*') return prg[0];
  if (pattern.endsWith('*')) return prg.find((f) => f.name.startsWith(pattern.slice(0, -1)));
  return files.find((f) => f.name === pattern);
}

/** BASIC-Host: verbindet den Interpreter mit Bildschirm, Speicher und Laufwerk. */
class Machine implements BasicHost {
  open = false;
  minutes = 0;
  constructor(private ctx: Ctx) {}

  private get comp() {
    return this.ctx.state.computer;
  }
  private get lines() {
    return this.comp.screen.lines;
  }
  private trim(): void {
    if (this.lines.length > ROWS) this.lines.splice(0, this.lines.length - ROWS);
  }

  write(text: string): void {
    for (const ch of toPetsciiText(text)) {
      if (!this.open || this.lines[this.lines.length - 1].length >= COLS) {
        this.lines.push('');
        this.open = true;
      }
      this.lines[this.lines.length - 1] += ch;
    }
    this.trim();
  }
  newline(): void {
    if (!this.open) this.lines.push('');
    this.open = false;
    this.trim();
  }
  column(): number {
    return this.open ? this.lines[this.lines.length - 1].length % COLS : 0;
  }
  clearScreen(): void {
    this.comp.screen.lines = [];
    this.open = false;
  }
  setTextColor(code: number): void {
    if (COLOR_CODES[code] !== undefined) this.comp.screen.text = COLOR_CODES[code];
  }
  note(text: string): void {
    this.ctx.say(text, 'system');
  }

  load(
    name: string | null,
    device: number,
    secondary: number,
    inProgram: boolean,
  ): 'basic' | 'machine' | 'error' {
    if (device === 1) {
      this.write('PRESS PLAY ON TAPE');
      this.newline();
      this.note(
        'Die Datasette ist gar nicht angeschlossen. Du drückst RUN/STOP. (Laden von Diskette: Gerät 8, z. B. LOAD"$",8)',
      );
      return 'error';
    }
    if (device !== 8) throw new BasicError('DEVICE NOT PRESENT');
    if (!name) throw new BasicError('MISSING FILE NAME');
    this.write(`SEARCHING FOR ${name}`);
    this.newline();
    this.ctx.cue('drive');
    this.minutes += 1;
    const disk = diskInDrive(this.ctx.state);
    if (!disk) {
      this.note('Die 1541 rattert, dann blinkt ihre rote LED: Es liegt keine Diskette im Laufwerk.');
      throw new BasicError('FILE NOT FOUND');
    }
    if (name === '$') {
      this.write('LOADING');
      this.newline();
      this.comp.program = directoryProgram(this.ctx.state, disk);
      this.comp.programIsDirectory = true;
      this.comp.loaded = { name: '$', diskId: disk.id };
      return 'basic';
    }
    const file = matchFile(visibleFiles(this.ctx.state, disk), name);
    if (!file || file.type !== 'PRG') {
      this.note('Die rote LED der 1541 blinkt.');
      throw new BasicError('FILE NOT FOUND');
    }
    this.write('LOADING');
    this.newline();
    this.minutes += Math.ceil(file.blocks / 100);
    if (file.appId && inProgram && secondary === 1) {
      this.comp.loaded = { name: file.name, appId: file.appId, diskId: disk.id };
      return 'machine';
    }
    this.comp.program = parseBasicLines(file.basic ?? []);
    this.comp.programIsDirectory = false;
    this.comp.loaded = { name: file.name, appId: file.appId, diskId: disk.id };
    return 'basic';
  }

  save(name: string, device: number): void {
    if (device !== 8) {
      this.write('PRESS RECORD & PLAY ON TAPE');
      this.newline();
      this.note(
        'Ohne angeschlossene Datasette wird das nichts. Du brichst ab. (Speichern auf Diskette: SAVE"NAME",8)',
      );
      return;
    }
    const disk = diskInDrive(this.ctx.state);
    const upper = toPetsciiText(name).slice(0, 16);
    this.write(`SAVING ${upper}`);
    this.newline();
    this.ctx.cue('drive');
    if (!disk) return this.note('Die rote LED der 1541 blinkt: keine Diskette im Laufwerk.');
    if (disk.writeProtected)
      return this.note('Die rote LED der 1541 blinkt: Die Diskette ist schreibgeschützt.');
    if (disk.files.some((f) => f.name === upper))
      return this.note('Die rote LED blinkt: Eine Datei mit diesem Namen gibt es schon.');
    const lines = this.comp.program.map((l) => `${l.num} ${l.text}`);
    const blocks = Math.max(1, Math.ceil(lines.join('\n').length / 254));
    disk.files.push({ name: upper, type: 'PRG', blocks, basic: lines });
    this.minutes += 1;
  }

  sys(addr: number): 'app' | 'reset' | 'none' {
    if (addr === 64738) return 'reset';
    if ((addr === 2061 || addr === 2064) && this.comp.loaded?.appId) return 'app';
    this.note('Ein SYS ins Blaue. Zum Glück passiert nichts.');
    return 'none';
  }
  poke(addr: number, value: number): void {
    this.comp.memory[String(addr)] = value;
    if (addr === 53280) this.comp.screen.border = value & 15;
    if (addr === 53281) this.comp.screen.background = value & 15;
    if (addr === 646) this.comp.screen.text = value & 15;
  }
  peek(addr: number): number {
    if (addr === 53280) return this.comp.screen.border | 240;
    if (addr === 53281) return this.comp.screen.background | 240;
    if (addr === 646) return this.comp.screen.text;
    return this.comp.memory[String(addr)] ?? 0;
  }
  getProgram(): ProgramLine[] {
    return this.comp.program;
  }
  setProgram(lines: ProgramLine[]): void {
    this.comp.program = lines;
    this.comp.programIsDirectory = false;
    this.comp.loaded = null;
  }
  programIsDirectory(): boolean {
    return this.comp.programIsDirectory;
  }
}

// ---------------------------------------------------------------------------- Apps

export function startApp(ctx: Ctx, id: string): number {
  const def = APPS[id];
  if (!def) throw new Error(`Unbekannte App ${id}`);
  ctx.state.computer.app = def.start(ctx);
  return 1;
}

export function exitApp(ctx: Ctx): void {
  const comp = ctx.state.computer;
  comp.app = null;
  comp.screen = { lines: ['READY.'], border: 14, background: 6, text: 14 };
}

function applyAppResult(ctx: Ctx, res: AppResult): number {
  let minutes = res.minutes ?? 0;
  if (res.switchTo) minutes += startApp(ctx, res.switchTo);
  else if (res.exit) exitApp(ctx);
  return minutes;
}

// ---------------------------------------------------------------------------- BASIC

function runBasic(ctx: Ctx, fn: (i: Interpreter) => RunStatus): number {
  const comp = ctx.state.computer;
  comp.run ??= newRun(ctx.state.rngSeed);
  const m = new Machine(ctx);
  m.open = comp.run.awaitingInput !== null;
  const interp = new Interpreter(m, comp.run);
  const status = fn(interp);
  let minutes = m.minutes;
  if (status === 'input') return minutes;
  if (status === 'app' && comp.loaded?.appId) {
    minutes += startApp(ctx, comp.loaded.appId);
    return minutes;
  }
  if (status === 'reset') {
    powerOnReset(ctx);
    return minutes;
  }
  if (m.open) m.newline();
  m.write('READY.');
  m.newline();
  afterBasic(ctx);
  return minutes;
}

/** Narrative Beobachtungen nach Bildschirmausgaben (nur im Adventure-Protokoll). */
function afterBasic(ctx: Ctx): void {
  const s = ctx.state;
  const screen = s.computer.screen.lines.join('\n');
  if (s.computer.loaded?.diskId === 'game') {
    if (
      s.computer.programIsDirectory &&
      screen.includes('SPIEL.07') &&
      !s.knownFacts.includes('disk_directory')
    )
      discoverFact(ctx, 'disk_directory');
    if (
      s.computer.loaded.name === 'LADER' &&
      /\b910 DATA/.test(screen) &&
      !s.knownFacts.includes('data_lines')
    ) {
      ctx.say(
        'Am Ende des Laders stehen seltsame Zeilen: eine »Ersatzwahl«-Bemerkung und DATA mit lauter Zahlen um die 50.',
        'thought',
      );
      discoverFact(ctx, 'data_lines');
      if (s.puzzles.P04 !== 'solved') s.puzzles.P04 = 'solving';
    }
  }
}

function powerOnReset(ctx: Ctx): void {
  const comp = ctx.state.computer;
  comp.screen = bootScreen();
  comp.program = [];
  comp.programIsDirectory = false;
  comp.run = null;
  comp.app = null;
  comp.loaded = null;
  comp.memory = {};
}

export function powerOn(ctx: Ctx): void {
  const comp = ctx.state.computer;
  comp.powerOn = true;
  comp.driveOn = true;
  powerOnReset(ctx);
}

export function powerOff(ctx: Ctx): void {
  const comp = ctx.state.computer;
  comp.powerOn = false;
  comp.driveOn = false;
  comp.app = null;
  comp.run = null;
  comp.program = [];
  comp.loaded = null;
  comp.screen = { lines: [], border: 14, background: 6, text: 14 };
  ctx.state.telecom.connectedSystemId = null;
  ctx.state.telecom.currentUserHandle = null;
}

const SIMPLE_DIR =
  /^(ZEIGE (DATEIEN|VERZEICHNIS|DIRECTORY|INHALT)|DIR|DIRECTORY|VERZEICHNIS|KATALOG|CATALOG|LS)$/;
const SIMPLE_RUN = /^(LADE|STARTE|START) (SPIEL|PROGRAMM|DEMO|DISKETTE|ARCHIV)$/;

function typed(ctx: Ctx, text: string): void {
  printLine(ctx.state.computer.screen, text);
}

/** Eine Zeile wurde im C64-Eingabefeld mit RETURN bestätigt. Rückgabe: verbrauchte Spielminuten. */
export function c64Line(ctx: Ctx, rawText: string): number {
  const comp = ctx.state.computer;
  if (!comp.powerOn) {
    ctx.say('Der Bildschirm bleibt dunkel – der C64 ist ausgeschaltet. (SCHALTE COMPUTER EIN)', 'error');
    return 0;
  }
  if (comp.app) {
    const def = APPS[comp.app.id];
    if (def.inputMode(comp.app) === 'line' && def.line)
      return applyAppResult(ctx, def.line(ctx, comp.app, rawText));
    // Tastenmodus: Zeichen einzeln weitergeben, leere Zeile = RETURN
    let minutes = 0;
    const keys: C64Key[] =
      rawText.length === 0
        ? ['RETURN']
        : [...rawText].map((c) => (c === ' ' ? 'SPACE' : c === '←' ? 'ARROW_LEFT' : c));
    for (const k of keys) {
      if (!comp.app) break;
      minutes += c64Key(ctx, k);
    }
    return minutes;
  }

  const text = toPetsciiText(rawText).trimEnd();
  if (text.trim()) {
    comp.inputHistory.push(text);
    if (comp.inputHistory.length > 50) comp.inputHistory.shift();
  }

  if (comp.run?.awaitingInput) {
    const lines = comp.screen.lines;
    lines[lines.length - 1] = (lines[lines.length - 1] + text).slice(0, COLS);
    return runBasic(ctx, (i) => i.provideInput(text));
  }

  typed(ctx, text);
  const cmd = text.trim();
  if (cmd === '') return 0;

  if (SIMPLE_DIR.test(cmd)) {
    ctx.say(
      '(Vereinfachter Befehl → LOAD"$",8 und LIST. Achtung: Das überschreibt das BASIC-Programm im Speicher.)',
      'system',
    );
    typed(ctx, 'LOAD"$",8');
    let min = runBasic(ctx, (i) => i.execDirect('LOAD"$",8'));
    if (comp.programIsDirectory) {
      typed(ctx, 'LIST');
      min += runBasic(ctx, (i) => i.execDirect('LIST'));
    }
    return min;
  }
  if (SIMPLE_RUN.test(cmd)) {
    ctx.say('(Vereinfachter Befehl → LOAD"*",8 und RUN)', 'system');
    typed(ctx, 'LOAD"*",8');
    let min = runBasic(ctx, (i) => i.execDirect('LOAD"*",8'));
    if (comp.program.length > 0 && !comp.programIsDirectory) {
      typed(ctx, 'RUN');
      min += runBasic(ctx, (i) => i.execDirect('RUN'));
    }
    return min;
  }
  if (/^(HILFE|HELP|\?HILFE)$/.test(cmd)) {
    printLine(comp.screen, '?SYNTAX  ERROR');
    printLine(comp.screen, 'READY.');
    ctx.say(
      'Der C64 versteht nur BASIC. Nützlich: LOAD"$",8 und LIST (Verzeichnis), LOAD"NAME",8 und RUN (Programm starten), LIST, NEW. Vereinfacht geht auch: ZEIGE DATEIEN, LADE SPIEL.',
      'system',
    );
    return 0;
  }

  const numbered = /^(\d+)\s*(.*)$/.exec(cmd);
  if (numbered) {
    const num = parseInt(numbered[1], 10);
    if (num > 63999) {
      printLine(comp.screen, '?SYNTAX  ERROR');
      printLine(comp.screen, 'READY.');
      return 0;
    }
    if (comp.programIsDirectory) {
      comp.programIsDirectory = false;
      comp.loaded = null;
    }
    const body = numbered[2].trim();
    comp.program = comp.program.filter((l) => l.num !== num);
    if (body) comp.program.push({ num, text: body });
    comp.program.sort((a, b) => a.num - b.num);
    return 0;
  }
  return runBasic(ctx, (i) => i.execDirect(cmd));
}

export function c64Key(ctx: Ctx, key: C64Key): number {
  const comp = ctx.state.computer;
  if (!comp.powerOn) {
    ctx.say('Der C64 ist ausgeschaltet.', 'error');
    return 0;
  }
  ctx.cue('keyclick');
  if (comp.app) return applyAppResult(ctx, APPS[comp.app.id].key(ctx, comp.app, key));
  if (key === 'RUNSTOP' && comp.run?.awaitingInput) {
    runBasic(ctx, (i) => {
      i.breakProgram();
      return 'ready';
    });
    return 0;
  }
  if (key === 'CLRHOME') {
    comp.screen.lines = [];
    return 0;
  }
  if (key === 'RETURN') return c64Line(ctx, '');
  return 0;
}

export function c64Tick(ctx: Ctx): void {
  const comp = ctx.state.computer;
  if (!comp.powerOn || !comp.app) return;
  const def = APPS[comp.app.id];
  if (def.tick) applyAppResult(ctx, def.tick(ctx, comp.app));
}

export function renderC64(state: GameState): Rendered & { powerOn: boolean; tickMs: number | null } {
  const comp = state.computer;
  if (!comp.powerOn)
    return {
      lines: [],
      border: 0,
      background: 0,
      text: 0,
      inputMode: 'basic',
      cursor: false,
      powerOn: false,
      tickMs: null,
    };
  if (comp.app) {
    const def = APPS[comp.app.id];
    const r = def.render(state, comp.app);
    return { cursor: false, ...r, inputMode: def.inputMode(comp.app), powerOn: true, tickMs: def.tickMs };
  }
  return {
    lines: comp.screen.lines,
    border: comp.screen.border,
    background: comp.screen.background,
    text: comp.screen.text,
    inputMode: 'basic',
    cursor: !comp.run?.awaitingInput,
    powerOn: true,
    tickMs: null,
  };
}

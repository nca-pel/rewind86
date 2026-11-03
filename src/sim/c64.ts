/**
 * Simulierter Commodore 64 (kein Emulator): BASIC-V2-Teilmenge, 1541-Laufwerk mit virtuellen
 * Disketten und programmartige "Apps" für Maschinenprogramme.
 */
import { GAME_CONFIG } from '../content/config';
import { cassetteProgram } from '../content/disks';
import { isHard } from '../engine/difficulty';
import type { Ctx } from '../engine/context';
import { discoverFact, setPuzzle } from '../engine/effects';
import { bootProfile, bootScreen } from '../engine/state';
import type { C64Key, GameState, ProgramLine, VirtualDisk, VirtualFile } from '../engine/types';
import { archiveApp } from './apps/archive';
import { btxApp, btxDropCarrier } from './apps/btx';
import { diskInDrive } from './drive';
import { ABANDON_FILE, abandonApp } from './apps/abandon';
import { crashApp } from './apps/crash';
import { intruderApp } from './apps/intruder';
import { termApp } from './apps/term';
import { modkApp } from './apps/modk';
import type { AppDef, AppResult, Rendered } from './apps/types';
import { wt07App } from './apps/wt07';
import {
  BasicError,
  DISK_OK,
  Interpreter,
  newRun,
  type BasicHost,
  type RunStatus,
} from './basic/interpreter';
import { printLine, toPetsciiText } from './screen';
import { TEXT_COLS } from '../c64/geometry';
import { stringToPetscii, textToScreen } from '../c64/petscii';
import {
  clearVideo,
  createVideo,
  newline,
  peekVideo,
  pokeVideo,
  printBytes,
  videoFromLines,
  videoLines,
  type VideoState,
} from '../c64/video';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const APPS: Record<string, AppDef<any>> = {
  wt07: wt07App,
  modk: modkApp,
  archive: archiveApp,
  intruder: intruderApp,
  term: termApp,
  btx: btxApp,
  abandon: abandonApp,
  crash: crashApp,
};

/** Easter-Egg: genau LOAD"ABANDON",8,1 (Leerzeichen egal) – funktioniert auch ohne Diskette */
const ABANDON_LOAD = new RegExp(`^LOAD\\s*"${ABANDON_FILE}"\\s*,\\s*8\\s*,\\s*1$`);

export { diskInDrive };

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
  minutes = 0;
  constructor(private ctx: Ctx) {}

  private get comp() {
    return this.ctx.state.computer;
  }
  private get video(): VideoState {
    return this.comp.screen;
  }

  /** Ausgabe als PETSCII-Bytes über die Bildschirmroutine (Steuercodes werden ausgeführt). */
  write(text: string): void {
    printBytes(this.video, stringToPetscii(text));
  }
  newline(): void {
    newline(this.video);
  }
  /** Spalte innerhalb der logischen Zeile (0–79), wie sie TAB, Komma und POS verwenden */
  column(): number {
    return this.video.cx + (this.video.links[this.video.cy] ? TEXT_COLS : 0);
  }
  bytesFree(): number {
    return bootProfile().bytesFree;
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
    if (device === 1) return this.loadTape(name);
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
    if (this.unformatted(disk)) throw new BasicError('FILE NOT FOUND');
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
    if (file.crashes) {
      // Gimmick »Schneewitchen«: Datenmüll, Stillstand, Reset – nie ein Bild
      this.comp.loaded = null;
      startApp(this.ctx, 'crash');
      return 'error';
    }
    if (file.appId && inProgram && secondary === 1) {
      this.comp.loaded = { name: file.name, appId: file.appId, diskId: disk.id };
      return 'machine';
    }
    this.comp.program = parseBasicLines(file.basic ?? []);
    this.comp.programIsDirectory = false;
    this.comp.loaded = { name: file.name, appId: file.appId, diskId: disk.id };
    return 'basic';
  }

  /** Laden von der Datasette (Gerät 1): nur Ralfs Prüfband enthält ein Programm */
  private loadTape(name: string | null): 'basic' | 'error' {
    const s = this.ctx.state;
    this.write('PRESS PLAY ON TAPE');
    this.newline();
    if (!s.flags.datasetteConnected) {
      this.note(
        'Die Datasette ist gar nicht angeschlossen. Du drückst RUN/STOP. (Laden von Diskette: Gerät 8, z. B. LOAD"$",8)',
      );
      return 'error';
    }
    if (s.itemLocations.cassette !== 'datasette') {
      this.note('Du drückst PLAY – aber in der Datasette liegt keine Kassette. Du drückst RUN/STOP.');
      return 'error';
    }
    this.write('OK');
    this.newline();
    this.write(name ? `SEARCHING FOR ${name}` : 'SEARCHING');
    this.newline();
    this.ctx.cue('drive');
    const prog = cassetteProgram(isHard(this.ctx.state));
    if (name && !(name === prog.name || (name.endsWith('*') && prog.name.startsWith(name.slice(0, -1))))) {
      this.minutes += 6;
      this.note(
        `Du drückst PLAY. Das Band läuft und läuft – bis zum Ende. Unter diesem Namen ist nichts drauf. Du spulst zurück und drückst RUN/STOP.`,
      );
      return 'error';
    }
    this.write(`FOUND ${prog.name}`);
    this.newline();
    this.write('LOADING');
    this.newline();
    this.minutes += 3;
    this.note(
      'Du drückst PLAY. Die Datasette surrt, der Bildschirm wird kurz leer – dann ist das Programm drin.',
    );
    this.comp.program = parseBasicLines(prog.basic);
    this.comp.programIsDirectory = false;
    this.comp.loaded = { name: prog.name, diskId: 'tape' };
    return 'basic';
  }

  openFile(
    device: number,
    _secondary: number,
    spec: string,
  ): { mode: 'r' | 'w'; name: string; data: string } {
    if (device === 3) throw new BasicError('NOT INPUT FILE');
    if (device !== 8) throw new BasicError('DEVICE NOT PRESENT');
    const [rawName, , rawMode] = toPetsciiText(spec).split(',');
    const name = (rawName ?? '').replace(/^\d*:/, '').trim().slice(0, 16);
    if (!name) throw new BasicError('MISSING FILE NAME');
    this.ctx.cue('drive');
    const disk = diskInDrive(this.ctx.state);
    if (!disk) {
      this.note('Die rote LED der 1541 blinkt: keine Diskette im Laufwerk.');
      throw new BasicError('FILE NOT FOUND');
    }
    if (this.unformatted(disk)) throw new BasicError('FILE NOT FOUND');
    if ((rawMode ?? 'R').trim().startsWith('W')) {
      if (disk.writeProtected) {
        this.note('Die rote LED der 1541 blinkt: Die Diskette ist schreibgeschützt.');
        throw new BasicError('WRITE PROTECT ON');
      }
      if (disk.files.some((f) => f.name === name)) {
        this.note('Die rote LED blinkt: Eine Datei mit diesem Namen gibt es schon.');
        throw new BasicError('FILE EXISTS');
      }
      return { mode: 'w', name, data: '' };
    }
    const file = visibleFiles(this.ctx.state, disk).find(
      (f) => f.name === name || (name.endsWith('*') && f.name.startsWith(name.slice(0, -1))),
    );
    if (!file || file.type !== 'SEQ') {
      this.note('Die rote LED der 1541 blinkt.');
      throw new BasicError('FILE NOT FOUND');
    }
    return { mode: 'r', name: file.name, data: file.textContent ?? '' };
  }

  writeFile(name: string, data: string): void {
    const disk = diskInDrive(this.ctx.state);
    this.ctx.cue('drive');
    if (!disk || disk.writeProtected || disk.formatted === false) {
      this.note('Die rote LED der 1541 blinkt: Die Datei konnte nicht geschrieben werden.');
      return;
    }
    const blocks = Math.max(1, Math.ceil(data.length / 254));
    disk.files.push({ name, type: 'SEQ', blocks, textContent: data });
    this.minutes += 1;
  }

  /** Fabrikneue Diskette: Die 1541 findet keine Spuren. Meldet das im Adventure-Protokoll. */
  private unformatted(disk: VirtualDisk): boolean {
    if (disk.formatted !== false) return false;
    this.note(
      'Die 1541 rattert, die rote LED blinkt: Die Diskette ist fabrikneu und noch nicht formatiert. (OPEN 15,8,15,"N0:NAME,01":CLOSE 15)',
    );
    return true;
  }

  /** `N0:NAME,ID`: Spuren und Directory anlegen. Ohne ID nur schnelles Löschen einer schon formatierten Diskette. */
  private format(
    disk: VirtualDisk,
    arg: string,
    msg: (nr: number, text: string, track?: number) => string,
  ): string {
    const [rawName, rawId] = arg.split(',');
    const name = (rawName ?? '').trim().slice(0, 16);
    if (!name) return msg(34, 'SYNTAX ERROR');
    if (disk.writeProtected) {
      this.note('Die rote LED der 1541 blinkt: Die Diskette ist schreibgeschützt.');
      return msg(26, 'WRITE PROTECT ON');
    }
    if (disk.files.some((f) => f.appId)) {
      this.note(
        'Die Diskette enthält deine Programme. Das Formatieren würde sie unwiederbringlich löschen – das lässt du lieber bleiben.',
      );
      return msg(26, 'WRITE PROTECT ON');
    }
    const full = rawId !== undefined;
    if (!full && disk.formatted === false) return msg(21, 'READ ERROR', 18);
    disk.files = [];
    disk.header = name;
    if (full) disk.diskId = rawId.trim().slice(0, 2);
    disk.formatted = true;
    this.minutes += full ? 2 : 1;
    this.note(
      full
        ? 'Die 1541 knattert, rattert, knattert – fast zwei Minuten lang. Dann ist die Diskette formatiert: Spuren, Directory, alles leer.'
        : 'Die 1541 räumt das Directory auf. Die Diskette ist leer.',
    );
    return DISK_OK;
  }

  /**
   * Kommandokanal 15: S (scratch), R (rename), I (initialize), V (validate). Antwort wie der Fehlerkanal der
   * 1541: »nr,TEXT,spur,sektor«, bei erfolgreichem Löschen mit der Dateizahl in der Spur.
   */
  diskCommand(cmd: string): string {
    const msg = (nr: number, text: string, track = 0): string =>
      `${String(nr).padStart(2, '0')},${text},${String(track).padStart(2, '0')},00\r`;
    this.ctx.cue('drive');
    const text = toPetsciiText(cmd).replace(/\r/g, '').trim();
    if (!text) return DISK_OK;
    const disk = diskInDrive(this.ctx.state);
    if (!disk) {
      this.note('Die rote LED der 1541 blinkt: keine Diskette im Laufwerk.');
      return msg(74, 'DRIVE NOT READY');
    }
    const kind = text[0];
    const arg = text.replace(/^[A-Z]*\d*:?/, '');
    if (kind === 'N') return this.format(disk, arg, msg);
    if (disk.formatted === false) {
      this.note('Die rote LED der 1541 blinkt: Diese Diskette ist noch unformatiert.');
      return msg(74, 'DRIVE NOT READY');
    }
    if (kind === 'I' || kind === 'V') {
      this.minutes += 1;
      return DISK_OK;
    }
    if (kind !== 'S' && kind !== 'R') return msg(31, 'SYNTAX ERROR');
    if (disk.writeProtected) {
      this.note('Die rote LED der 1541 blinkt: Die Diskette ist schreibgeschützt.');
      return msg(26, 'WRITE PROTECT ON');
    }
    const visible = visibleFiles(this.ctx.state, disk);
    if (kind === 'R') {
      const [to, from] = arg.split('=').map((x) => x.trim().slice(0, 16));
      if (!to || !from) return msg(34, 'SYNTAX ERROR');
      const file = visible.find((f) => f.name === from);
      if (!file) return msg(62, 'FILE NOT FOUND');
      if (visible.some((f) => f.name === to)) return msg(63, 'FILE EXISTS');
      if (file.appId) return msg(26, 'WRITE PROTECT ON');
      file.name = to;
      this.minutes += 1;
      return DISK_OK;
    }
    // Scratch: mehrere Namen mit Komma, Platzhalter * am Ende
    const names = arg
      .split(',')
      .map((x) => x.trim().slice(0, 16))
      .filter(Boolean);
    if (names.length === 0) return msg(34, 'SYNTAX ERROR');
    const hit = new Set<VirtualFile>();
    for (const n of names) {
      for (const f of visible) {
        if (f.name === n || (n.endsWith('*') && f.name.startsWith(n.slice(0, -1)))) hit.add(f);
      }
    }
    const locked = [...hit].filter((f) => f.appId || f.type === 'DEL');
    if (locked.length > 0) return msg(26, 'WRITE PROTECT ON');
    if (hit.size === 0) return msg(62, 'FILE NOT FOUND');
    disk.files = disk.files.filter((f) => !hit.has(f));
    this.minutes += 1;
    return msg(1, ' FILES SCRATCHED', hit.size);
  }

  save(name: string, device: number): void {
    if (device !== 8) {
      this.write('PRESS RECORD & PLAY ON TAPE');
      this.newline();
      const s = this.ctx.state;
      this.note(
        !s.flags.datasetteConnected
          ? 'Ohne angeschlossene Datasette wird das nichts. Du brichst ab. (Speichern auf Diskette: SAVE"NAME",8)'
          : s.itemLocations.cassette === 'datasette'
            ? 'Der Finger liegt schon auf RECORD – dann hältst du inne. In der Datasette steckt Seidels Prüfband. Das überspielst du ganz sicher nicht. (Speichern auf Diskette: SAVE"NAME",8)'
            : 'In der Datasette steckt keine Kassette. Du brichst ab. (Speichern auf Diskette: SAVE"NAME",8)',
      );
      return;
    }
    const disk = diskInDrive(this.ctx.state);
    const upper = toPetsciiText(name).slice(0, 16);
    this.write(`SAVING ${upper}`);
    this.newline();
    this.ctx.cue('drive');
    if (!disk) return this.note('Die rote LED der 1541 blinkt: keine Diskette im Laufwerk.');
    if (this.unformatted(disk)) return;
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
    // 64738 = Reset-Einsprung des Betriebssystems (wie beim Original)
    if (addr === 64738) return 'reset';
    if ((addr === 2061 || addr === 2064) && this.comp.loaded?.appId) return 'app';
    this.note('Ein SYS ins Blaue. Zum Glück passiert nichts.');
    return 'none';
  }
  poke(addr: number, value: number): void {
    if (pokeVideo(this.video, addr, value)) return;
    this.comp.memory[String(addr)] = value;
  }
  peek(addr: number): number {
    return peekVideo(this.video, addr) ?? this.comp.memory[String(addr)] ?? 0;
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
  if (comp.app?.id === 'btx') btxDropCarrier(ctx, 'ENDE');
  comp.app = null;
  const p = bootProfile();
  comp.screen = createVideo({ border: p.border, background: p.background, text: p.text });
  printLine(comp.screen, p.ready);
}

function applyAppResult(ctx: Ctx, res: AppResult): number {
  let minutes = res.minutes ?? 0;
  if (res.reset) {
    ctx.state.computer.app = null;
    powerOnReset(ctx);
    ctx.say(
      'Der C64 meldet sich mit dem Startbildschirm zurück. Dein Programm im Speicher ist weg.',
      'system',
    );
  } else if (res.switchTo) minutes += startApp(ctx, res.switchTo);
  else if (res.exit) exitApp(ctx);
  return minutes;
}

// ---------------------------------------------------------------------------- BASIC

function runBasic(ctx: Ctx, fn: (i: Interpreter) => RunStatus): number {
  const comp = ctx.state.computer;
  comp.run ??= newRun(ctx.state.rngSeed);
  const m = new Machine(ctx);
  const interp = new Interpreter(m, comp.run);
  const status = fn(interp);
  let minutes = m.minutes;
  if (status === 'input' || status === 'running') return minutes;
  if (status === 'app' && comp.loaded?.appId) {
    minutes += startApp(ctx, comp.loaded.appId);
    return minutes;
  }
  if (status === 'reset') {
    powerOnReset(ctx);
    return minutes;
  }
  if (m.column() > 0) m.newline();
  m.write(bootProfile().ready);
  m.newline();
  afterBasic(ctx);
  return minutes;
}

/** »K-SCHLUESSEL TEIL n/3: 1234« (Normal) oder »K-SCHLUESSEL: 1234« (Schwer) – erkannt wird der Wert. */
const KEY_PART = /K-SCHLUESSEL(?: TEIL [123]\/3)?:\s*(\d{4})/g;

/**
 * Schlüsselfragmente zählen erst, wenn sie wirklich auf dem Bildschirm zu sehen sind – Text in Hintergrundfarbe
 * (Zeile 70 des LADERs) bleibt verborgen, bis jemand die Farben ändert.
 */
function keyPartsOnScreen(ctx: Ctx): void {
  const s = ctx.state;
  const visible = videoLines(s.computer.screen).join('\n');
  for (const m of visible.matchAll(KEY_PART)) {
    const n = (GAME_CONFIG.keyStrand.parts as readonly string[]).indexOf(m[1]) + 1;
    if (n === 0 || s.knownFacts.includes(`key_part_${n}`)) continue;
    const hard = isHard(s);
    ctx.say(
      n === 1
        ? `Da steht ja doch etwas in Zeile 70! Blau auf Blau geschrieben – auf Seidels schwarzem Hintergrund wäre es ihm nie aufgefallen. ${hard ? 'Vier Ziffern hinter »K-SCHLUESSEL« – nur ein Stück davon, aber welches?' : 'Ein Schlüsselteil.'}`
        : hard
          ? `»K-SCHLUESSEL: ${m[1]}« – noch ein Stück des Schlüssels. Eine Teilnummer steht nicht dabei.`
          : `»TEIL ${n}/3: ${m[1]}« – noch ein Stück des Schlüssels.`,
      'thought',
    );
    discoverFact(ctx, `key_part_${n}`);
  }
  if (
    s.computer.loaded?.name === 'LADER' &&
    !s.knownFacts.includes('key_part_1') &&
    !s.knownFacts.includes('empty_rem') &&
    /^70 REM\s*$/m.test(visible) &&
    videoLines(s.computer.screen, null, true).some(
      (l) => l.includes(`K-SCHLUESSEL`) && l.includes(GAME_CONFIG.keyStrand.parts[0]),
    )
  ) {
    ctx.say(
      'Zeile 70: ein REM, hinter dem nichts steht. Wer schreibt denn eine leere Bemerkung in einen Lader?',
      'thought',
    );
    discoverFact(ctx, 'empty_rem');
  }
}

/** Narrative Beobachtungen nach Bildschirmausgaben (nur im Adventure-Protokoll). */
function afterBasic(ctx: Ctx): void {
  const s = ctx.state;
  keyPartsOnScreen(ctx);
  const screen = videoLines(s.computer.screen).join('\n');
  if (/CODE GEKNACKT IN\s*\d+\s*VERSUCH/.test(screen) && !s.knownFacts.includes('knacker_won')) {
    const tries = Number(/CODE GEKNACKT IN\s*(\d+)/.exec(screen)?.[1] ?? 99);
    ctx.say(
      tries <= 8
        ? `Geknackt – in ${tries} Versuchen! Ziffern ausschließen statt blind raten, so geht das. Das hat fast etwas von einem Schloss, das man Stück für Stück öffnet.`
        : `Geknackt, nach ${tries} Versuchen. Es geht auch ohne Glück: Ziffern ausschließen statt blind raten.`,
      'thought',
    );
    discoverFact(ctx, 'knacker_won');
    setPuzzle(ctx, 'P18', 'solved');
  }
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
  // Steckmodule starten von allein (BTX-Decoder im Modulschacht)
  if (ctx.state.itemLocations.btx_kit === 'port') startApp(ctx, 'btx');
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
  comp.screen = createVideo();
  btxDropCarrier(ctx, 'AUS');
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

  if (comp.run?.running) return 0;

  if (comp.run?.awaitingInput) {
    printLine(comp.screen, text);
    return runBasic(ctx, (i) => i.provideInput(text));
  }

  typed(ctx, text);
  const cmd = text.trim();
  if (cmd === '') return 0;

  if (ABANDON_LOAD.test(cmd)) {
    printLine(comp.screen, `SEARCHING FOR ${ABANDON_FILE}`);
    printLine(comp.screen, 'LOADING');
    ctx.cue('drive');
    return startApp(ctx, 'abandon');
  }

  if (SIMPLE_DIR.test(cmd)) {
    ctx.say(
      '(Vereinfachter Befehl → LOAD"$",8. Achtung: Das überschreibt das BASIC-Programm im Speicher.)',
      'system',
    );
    typed(ctx, 'LOAD"$",8');
    return runBasic(ctx, (i) => i.execDirect('LOAD"$",8'));
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
      'Der C64 versteht nur BASIC. Nützlich: LOAD"$",8 (Verzeichnis), LOAD"NAME",8 und RUN (Programm starten), LIST, NEW. Vereinfacht geht auch: ZEIGE DATEIEN, LADE SPIEL. Alle Befehle mit Beispielen: HILFE C64 im Adventure-Feld.',
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
  if (key === 'RUNSTOP' && (comp.run?.awaitingInput || comp.run?.running)) {
    runBasic(ctx, (i) => {
      i.breakProgram();
      return 'ready';
    });
    return 0;
  }
  if (key === 'CLRHOME') {
    clearVideo(comp.screen);
    return 0;
  }
  if (key === 'RETURN') return c64Line(ctx, '');
  return 0;
}

export function c64Tick(ctx: Ctx): void {
  const comp = ctx.state.computer;
  if (!comp.powerOn) return;
  if (!comp.app) {
    if (comp.run?.running) runBasic(ctx, (i) => i.resume());
    return;
  }
  const def = APPS[comp.app.id];
  if (def.tick) applyAppResult(ctx, def.tick(ctx, comp.app));
}

/** Alles, was die Oberfläche zum Zeichnen des C64-Bildschirms braucht */
export interface C64View {
  powerOn: boolean;
  /** Vollständiger Bildschirmzustand (Bildschirm-RAM, Farben, Register) */
  video: VideoState;
  /** Position des Eingabecursors; null = kein Cursor (Tastenmodus, ausgeschaltet) */
  cursor: { x: number; y: number } | null;
  /** Bildschirminhalt als Text (Screenreader, Tests) */
  lines: string[];
  inputMode: Rendered['inputMode'];
  flash?: boolean;
  demoScreen?: number;
  youtube?: string;
  tickMs: number | null;
}

export function renderC64(state: GameState): C64View {
  const comp = state.computer;
  if (!comp.powerOn)
    return { powerOn: false, video: comp.screen, cursor: null, lines: [], inputMode: 'basic', tickMs: null };
  if (comp.app) {
    const def = APPS[comp.app.id];
    const r = def.render(state, comp.app);
    const inputMode = def.inputMode(comp.app);
    const video = r.video ?? videoFromLines(r.lines, r, textToScreen);
    const cursor = inputMode === 'line' ? { x: 0, y: Math.min(r.lines.length, 24) } : null;
    return {
      powerOn: true,
      video,
      cursor,
      lines: videoLines(video, cursor),
      inputMode,
      flash: r.flash,
      demoScreen: r.demoScreen,
      youtube: r.youtube,
      tickMs: def.tickMs,
    };
  }
  if (comp.run?.running)
    return {
      powerOn: true,
      video: comp.screen,
      cursor: null,
      lines: videoLines(comp.screen, null),
      inputMode: 'keys',
      tickMs: 70,
    };
  const cursor = { x: comp.screen.cx, y: comp.screen.cy };
  return {
    powerOn: true,
    video: comp.screen,
    cursor,
    lines: videoLines(comp.screen, cursor),
    inputMode: 'basic',
    tickMs: null,
  };
}

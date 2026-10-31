/**
 * Interpreter für eine dokumentierte Teilmenge von Commodore BASIC V2.
 *
 * - Keine Host-Codeausführung (kein eval / new Function), nur ein eigener Ausdrucksparser.
 * - Harte Schrittbegrenzung: Endlosschleifen werden nach MAX_STEPS mit "BREAK IN n" beendet.
 * - Der Laufzeitzustand (BasicRun) ist serialisierbar, damit INPUT-Pausen gespeichert werden können.
 */
import type { BasicRun, ProgramLine } from '../../engine/types';
import { BasicSyntaxError, canonicalVar, tokenize, type Token } from './tokenizer';

export const MAX_STEPS = 50_000;
const MAX_STACK = 64;
const DIRECT = -1;

export type Value = number | string;

export class BasicError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Schnittstelle zum simulierten C64 (Bildschirm, Laufwerk, Speicher) */
export interface BasicHost {
  write(text: string): void;
  newline(): void;
  column(): number;
  clearScreen(): void;
  setTextColor(code: number): void;
  /** Liefert 'basic' (Programm ersetzt), 'machine' (Maschinenprogramm geladen) oder 'error' */
  load(
    name: string | null,
    device: number,
    secondary: number,
    inProgram: boolean,
  ): 'basic' | 'machine' | 'error';
  save(name: string, device: number): void;
  /** true = eine App wurde gestartet, Interpreter stoppt */
  sys(addr: number): 'app' | 'reset' | 'none';
  poke(addr: number, value: number): void;
  peek(addr: number): number;
  note(text: string): void;
  getProgram(): ProgramLine[];
  setProgram(lines: ProgramLine[], isDirectory?: boolean): void;
  programIsDirectory(): boolean;
}

export type RunStatus = 'ready' | 'input' | 'app' | 'reset';

export function newRun(seed = 1): BasicRun {
  return {
    pc: { line: DIRECT, stmt: 0 },
    vars: {},
    arrays: {},
    forStack: [],
    gosubStack: [],
    dataPtr: 0,
    awaitingInput: null,
    rng: seed,
  };
}

export function formatNumber(n: number): string {
  if (!isFinite(n)) return '0';
  if (Number.isInteger(n) && Math.abs(n) < 1e9) return String(n);
  let s = Math.abs(n) >= 1e9 || (Math.abs(n) < 0.01 && n !== 0) ? n.toExponential(8) : n.toPrecision(9);
  if (s.includes('e')) {
    const [m, e] = s.split('e');
    const mm = m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m;
    const ee = parseInt(e, 10);
    s = `${mm}E${ee < 0 ? '-' : '+'}${String(Math.abs(ee)).padStart(2, '0')}`;
  } else if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace(/^0\./, '.').replace(/^-0\./, '-.');
}

function printNumber(n: number): string {
  return (n >= 0 ? ' ' : '') + formatNumber(n) + ' ';
}

function splitStatements(tokens: Token[]): Token[][] {
  const out: Token[][] = [[]];
  for (const t of tokens) {
    if (t.t === 'op' && t.v === ':') out.push([]);
    else out[out.length - 1].push(t);
  }
  return out;
}

type Signal =
  | { k: 'next' }
  | { k: 'jump'; line: number; stmt: number }
  | { k: 'end' }
  | { k: 'input' }
  | { k: 'app' }
  | { k: 'reset' }
  | { k: 'restart' }
  | { k: 'break' }
  | { k: 'nextLine' };

export class Interpreter {
  private cache = new Map<number, Token[][]>();
  private sorted: number[] = [];
  private toks: Token[] = [];
  private p = 0;
  private data: string[] = [];

  constructor(
    private host: BasicHost,
    public run: BasicRun,
  ) {
    this.reindex();
  }

  private reindex(): void {
    this.cache.clear();
    const prog = this.host.getProgram();
    this.sorted = prog.map((l) => l.num).sort((a, b) => a - b);
    this.data = [];
    if (this.host.programIsDirectory()) return;
    for (const l of [...prog].sort((a, b) => a.num - b.num)) {
      const m = /^\s*DATA(.*)$/.exec(l.text) ?? /:\s*DATA(.*)$/.exec(l.text);
      if (!m) continue;
      for (const part of m[1].match(/("[^"]*"|[^,]*)(,|$)/g) ?? []) {
        const v = part.replace(/,$/, '').trim();
        if (v === '' && part === '') continue;
        this.data.push(v.replace(/^"|"$/g, ''));
      }
    }
  }

  private statements(line: number): Token[][] | null {
    if (this.cache.has(line)) return this.cache.get(line)!;
    const l = this.host.getProgram().find((x) => x.num === line);
    if (!l) return null;
    if (this.host.programIsDirectory()) throw new BasicError('SYNTAX');
    const st = splitStatements(tokenize(l.text));
    this.cache.set(line, st);
    return st;
  }

  private nextLineAfter(line: number): number | null {
    for (const n of this.sorted) if (n > line) return n;
    return null;
  }

  // ------------------------------------------------------------------ public API

  /** Direkteingabe (ohne Zeilennummer) ausführen. */
  execDirect(text: string): RunStatus {
    let tokens: Token[];
    try {
      tokens = tokenize(text);
    } catch {
      this.reportError(new BasicError('SYNTAX'), DIRECT);
      return 'ready';
    }
    this.cache.set(DIRECT, splitStatements(tokens));
    this.run.pc = { line: DIRECT, stmt: 0 };
    return this.loop();
  }

  /** INPUT-Antwort liefern und Programm fortsetzen. */
  provideInput(text: string): RunStatus {
    const names = this.run.awaitingInput ?? [];
    const parts = text.split(',');
    for (let i = 0; i < names.length; i++) {
      const raw = (parts[i] ?? '').trim();
      if (names[i].endsWith('$')) this.assign(names[i], raw);
      else {
        if (raw !== '' && !/^[-+]?(\d+\.?\d*|\.\d+)(E[-+]?\d+)?$/.test(raw)) {
          this.host.write('?REDO FROM START');
          this.host.newline();
          this.host.write('? ');
          return 'input';
        }
        this.assign(names[i], raw === '' ? 0 : parseFloat(raw));
      }
    }
    this.run.awaitingInput = null;
    this.host.newline();
    return this.loop();
  }

  breakProgram(): void {
    const line = this.run.pc.line;
    this.run.awaitingInput = null;
    this.host.newline();
    this.host.write(line >= 0 ? `BREAK IN ${line}` : 'BREAK');
    this.host.newline();
  }

  // ------------------------------------------------------------------ main loop

  private loop(): RunStatus {
    let steps = 0;
    while (true) {
      const { line, stmt } = this.run.pc;
      const sts = this.statements(line === DIRECT ? DIRECT : line);
      if (!sts) {
        // Zeile existiert nicht mehr (z. B. nach NEW)
        return 'ready';
      }
      if (stmt >= sts.length) {
        if (line === DIRECT) return 'ready';
        const nl = this.nextLineAfter(line);
        if (nl === null) return 'ready';
        this.run.pc = { line: nl, stmt: 0 };
        continue;
      }
      if (++steps > MAX_STEPS) {
        this.breakProgram();
        this.host.note('Das Programm läuft und läuft … Jan drückt RUN/STOP.');
        return 'ready';
      }
      let sig: Signal;
      try {
        sig = this.exec(sts[stmt]);
      } catch (e) {
        if (e instanceof BasicError || e instanceof BasicSyntaxError) {
          this.reportError(e instanceof BasicError ? e : new BasicError('SYNTAX'), line);
          return 'ready';
        }
        throw e;
      }
      switch (sig.k) {
        case 'next':
          this.run.pc = { line, stmt: stmt + 1 };
          break;
        case 'nextLine': {
          if (line === DIRECT) return 'ready';
          const nl = this.nextLineAfter(line);
          if (nl === null) return 'ready';
          this.run.pc = { line: nl, stmt: 0 };
          break;
        }
        case 'jump':
          this.run.pc = { line: sig.line, stmt: sig.stmt };
          break;
        case 'end':
          return 'ready';
        case 'break':
          this.breakProgram();
          return 'ready';
        case 'input':
          this.run.pc = { line, stmt: stmt + 1 };
          return 'input';
        case 'app':
          return 'app';
        case 'reset':
          return 'reset';
        case 'restart': {
          this.reindex();
          const first = this.sorted[0];
          if (first === undefined) return 'ready';
          this.run.pc = { line: first, stmt: 0 };
          break;
        }
      }
    }
  }

  private reportError(e: BasicError, line: number): void {
    if (this.host.column() > 0) this.host.newline();
    this.host.write(`?${e.code}  ERROR${line >= 0 ? ` IN ${line}` : ''}`);
    this.host.newline();
    this.run.awaitingInput = null;
  }

  // ------------------------------------------------------------------ token helpers

  private peekTok(): Token | undefined {
    return this.toks[this.p];
  }
  private isOp(v: string): boolean {
    const t = this.toks[this.p];
    return t?.t === 'op' && t.v === v;
  }
  private isKw(v: string): boolean {
    const t = this.toks[this.p];
    return t?.t === 'kw' && t.v === v;
  }
  private expectOp(v: string): void {
    if (!this.isOp(v)) throw new BasicError('SYNTAX');
    this.p++;
  }
  private atEnd(): boolean {
    return this.p >= this.toks.length;
  }

  // ------------------------------------------------------------------ statements

  private exec(tokens: Token[]): Signal {
    this.toks = tokens;
    this.p = 0;
    if (tokens.length === 0) return { k: 'next' };
    const t = tokens[0];
    if (t.t === 'id') return this.execLet();
    if (t.t !== 'kw') throw new BasicError('SYNTAX');
    this.p = 1;
    switch (t.v) {
      case 'LET':
        return this.execLet();
      case 'REM':
      case 'DATA':
        return { k: 'next' };
      case 'PRINT':
        return this.execPrint();
      case 'GOTO':
        return this.jumpTo(this.lineNumber(), false);
      case 'GOSUB': {
        const target = this.lineNumber();
        if (this.run.gosubStack.length >= MAX_STACK) throw new BasicError('OUT OF MEMORY');
        this.run.gosubStack.push({ line: this.run.pc.line, stmt: this.run.pc.stmt + 1 });
        return this.jumpTo(target, false);
      }
      case 'RETURN': {
        const r = this.run.gosubStack.pop();
        if (!r) throw new BasicError('RETURN WITHOUT GOSUB');
        return { k: 'jump', line: r.line, stmt: r.stmt };
      }
      case 'IF':
        return this.execIf();
      case 'FOR':
        return this.execFor();
      case 'NEXT':
        return this.execNext();
      case 'END':
        return { k: 'end' };
      case 'STOP':
        return { k: 'break' };
      case 'INPUT':
        return this.execInput();
      case 'GET': {
        const name = this.varName();
        this.assign(name, name.endsWith('$') ? '' : 0);
        return { k: 'next' };
      }
      case 'READ': {
        do {
          const name = this.varName();
          const idx = this.indexArgs();
          if (this.run.dataPtr >= this.data.length) throw new BasicError('OUT OF DATA');
          const raw = this.data[this.run.dataPtr++];
          if (name.endsWith('$')) this.assign(name, raw, idx);
          else {
            const n = Number(raw.trim() === '' ? 0 : raw);
            if (Number.isNaN(n)) throw new BasicError('SYNTAX');
            this.assign(name, n, idx);
          }
        } while (this.isOp(',') && ++this.p);
        return { k: 'next' };
      }
      case 'RESTORE':
        this.run.dataPtr = 0;
        return { k: 'next' };
      case 'DIM': {
        do {
          const name = canonicalVar(this.varName());
          this.expectOp('(');
          const dims = [this.num(this.expr())];
          while (this.isOp(',')) {
            this.p++;
            dims.push(this.num(this.expr()));
          }
          this.expectOp(')');
          this.dim(name, dims);
        } while (this.isOp(',') && ++this.p);
        return { k: 'next' };
      }
      case 'POKE': {
        const addr = this.intArg(0, 65535);
        this.expectOp(',');
        const val = this.intArg(0, 255);
        this.host.poke(addr, val);
        return { k: 'next' };
      }
      case 'SYS': {
        const r = this.host.sys(this.intArg(0, 65535));
        return r === 'app' ? { k: 'app' } : r === 'reset' ? { k: 'reset' } : { k: 'next' };
      }
      case 'CLR':
        this.clearVars();
        return { k: 'next' };
      case 'NEW':
        this.host.setProgram([]);
        this.clearVars();
        this.reindex();
        return { k: 'end' };
      case 'LIST':
        this.execList();
        return { k: 'next' };
      case 'RUN': {
        this.clearVars();
        this.reindex();
        const start = this.atEnd() ? this.sorted[0] : this.lineNumber();
        if (start === undefined) return { k: 'end' };
        if (this.host.programIsDirectory()) throw new BasicError('SYNTAX');
        return this.jumpTo(start, false);
      }
      case 'LOAD':
        return this.execLoad();
      case 'SAVE': {
        if (this.atEnd()) throw new BasicError('SYNTAX');
        const name = this.str(this.expr());
        let dev = 1;
        if (this.isOp(',')) {
          this.p++;
          dev = this.num(this.expr());
        }
        this.host.save(name, dev);
        return { k: 'next' };
      }
      case 'ON': {
        const v = Math.floor(this.num(this.expr()));
        const isSub = this.isKw('GOSUB');
        if (!this.isKw('GOTO') && !isSub) throw new BasicError('SYNTAX');
        this.p++;
        const targets = [this.lineNumber()];
        while (this.isOp(',')) {
          this.p++;
          targets.push(this.lineNumber());
        }
        if (v < 1 || v > targets.length) return { k: 'next' };
        if (isSub) this.run.gosubStack.push({ line: this.run.pc.line, stmt: this.run.pc.stmt + 1 });
        return this.jumpTo(targets[v - 1], false);
      }
      case 'CONT':
        throw new BasicError("CAN'T CONTINUE");
      default:
        this.host.note(`(${t.v} gehört nicht zur unterstützten BASIC-Teilmenge.)`);
        throw new BasicError('SYNTAX');
    }
  }

  private lineNumber(): number {
    const t = this.peekTok();
    if (t?.t !== 'num') throw new BasicError('SYNTAX');
    this.p++;
    return t.v;
  }

  private jumpTo(line: number, _keep: boolean): Signal {
    if (!this.host.getProgram().some((l) => l.num === line)) throw new BasicError("UNDEF'D STATEMENT");
    return { k: 'jump', line, stmt: 0 };
  }

  private clearVars(): void {
    this.run.vars = {};
    this.run.arrays = {};
    this.run.forStack = [];
    this.run.gosubStack = [];
    this.run.dataPtr = 0;
  }

  private varName(): string {
    const t = this.peekTok();
    if (t?.t !== 'id') throw new BasicError('SYNTAX');
    this.p++;
    return t.v;
  }

  private indexArgs(): number[] | null {
    if (!this.isOp('(')) return null;
    this.p++;
    const idx = [this.num(this.expr())];
    while (this.isOp(',')) {
      this.p++;
      idx.push(this.num(this.expr()));
    }
    this.expectOp(')');
    return idx.map((i) => {
      if (i < 0) throw new BasicError('BAD SUBSCRIPT');
      return Math.floor(i);
    });
  }

  private dim(name: string, dims: number[]): void {
    const size = dims.reduce((a, d) => a * (Math.floor(d) + 1), 1);
    if (size > 10_000) throw new BasicError('OUT OF MEMORY');
    const fill: Value = name.endsWith('$') ? '' : 0;
    this.run.arrays[name] = { dims: dims.map(Math.floor), data: new Array(size).fill(fill) };
  }

  private arrayIndex(name: string, idx: number[]): number {
    if (!this.run.arrays[name])
      this.dim(
        name,
        idx.map(() => 10),
      );
    const arr = this.run.arrays[name];
    if (idx.length !== arr.dims.length) throw new BasicError('BAD SUBSCRIPT');
    let flat = 0;
    for (let i = 0; i < idx.length; i++) {
      if (idx[i] > arr.dims[i]) throw new BasicError('BAD SUBSCRIPT');
      flat = flat * (arr.dims[i] + 1) + idx[i];
    }
    return flat;
  }

  private assign(name: string, v: Value, idx: number[] | null = null): void {
    const key = canonicalVar(name);
    const isStr = key.endsWith('$');
    if (isStr !== (typeof v === 'string')) throw new BasicError('TYPE MISMATCH');
    if (typeof v === 'string' && v.length > 255) throw new BasicError('STRING TOO LONG');
    const value = key.endsWith('%') && typeof v === 'number' ? Math.trunc(v) : v;
    if (idx) {
      this.run.arrays[key].data[this.arrayIndex(key, idx)] = value;
    } else this.run.vars[key] = value;
  }

  private execLet(): Signal {
    const name = this.varName();
    const idx = this.indexArgs();
    if (idx) this.arrayIndex(canonicalVar(name), idx);
    this.expectOp('=');
    this.assign(name, this.expr(), idx);
    if (!this.atEnd()) throw new BasicError('SYNTAX');
    return { k: 'next' };
  }

  private execPrint(): Signal {
    let newline = true;
    while (!this.atEnd()) {
      if (this.isOp(';')) {
        this.p++;
        newline = false;
        continue;
      }
      if (this.isOp(',')) {
        this.p++;
        const col = this.host.column();
        this.host.write(' '.repeat(10 - (col % 10)));
        newline = false;
        continue;
      }
      newline = true;
      if (this.isKw('TAB(') || this.isKw('SPC(')) {
        const isTab = this.isKw('TAB(');
        this.p++;
        const n = this.intArg(0, 255);
        this.expectOp(')');
        const col = this.host.column();
        this.host.write(' '.repeat(isTab ? Math.max(0, n - col) : n));
        continue;
      }
      const v = this.expr();
      if (typeof v === 'number') this.host.write(printNumber(v));
      else this.writeString(v);
    }
    if (newline) this.host.newline();
    return { k: 'next' };
  }

  private writeString(s: string): void {
    for (const ch of s) {
      const code = ch.charCodeAt(0);
      if (code === 147) this.host.clearScreen();
      else if (code === 13) this.host.newline();
      else if (code < 32 || (code >= 128 && code < 160)) this.host.setTextColor(code);
      else this.host.write(ch);
    }
  }

  private execIf(): Signal {
    const cond = this.expr();
    const truthy = typeof cond === 'number' ? cond !== 0 : cond !== '';
    if (this.isKw('THEN')) this.p++;
    else if (!this.isKw('GOTO')) throw new BasicError('SYNTAX');
    if (!truthy) return { k: 'nextLine' };
    if (this.isKw('GOTO')) this.p++;
    const t = this.peekTok();
    if (t?.t === 'num') return this.jumpTo(t.v, false);
    // Rest des Statements als eigenes Statement ausführen
    return this.exec(this.toks.slice(this.p));
  }

  private execFor(): Signal {
    const name = canonicalVar(this.varName());
    if (name.endsWith('$')) throw new BasicError('TYPE MISMATCH');
    this.expectOp('=');
    const start = this.num(this.expr());
    if (!this.isKw('TO')) throw new BasicError('SYNTAX');
    this.p++;
    const to = this.num(this.expr());
    let step = 1;
    if (this.isKw('STEP')) {
      this.p++;
      step = this.num(this.expr());
    }
    this.run.vars[name] = start;
    const existing = this.run.forStack.findIndex((f) => f.v === name);
    if (existing >= 0) this.run.forStack.splice(existing);
    if (this.run.forStack.length >= MAX_STACK) throw new BasicError('OUT OF MEMORY');
    this.run.forStack.push({ v: name, to, step, line: this.run.pc.line, stmt: this.run.pc.stmt + 1 });
    return { k: 'next' };
  }

  private execNext(): Signal {
    const names: (string | null)[] = [];
    if (this.atEnd()) names.push(null);
    else {
      names.push(canonicalVar(this.varName()));
      while (this.isOp(',')) {
        this.p++;
        names.push(canonicalVar(this.varName()));
      }
    }
    for (const name of names) {
      let idx = this.run.forStack.length - 1;
      if (name !== null) idx = this.run.forStack.findIndex((f) => f.v === name);
      if (idx < 0) throw new BasicError('NEXT WITHOUT FOR');
      this.run.forStack.splice(idx + 1);
      const f = this.run.forStack[idx];
      const v = (this.run.vars[f.v] as number) + f.step;
      this.run.vars[f.v] = v;
      if (f.step >= 0 ? v <= f.to : v >= f.to) return { k: 'jump', line: f.line, stmt: f.stmt };
      this.run.forStack.pop();
    }
    return { k: 'next' };
  }

  private execInput(): Signal {
    if (this.run.pc.line === DIRECT) throw new BasicError('ILLEGAL DIRECT');
    let prompt = '';
    const t = this.peekTok();
    if (t?.t === 'str') {
      prompt = t.v;
      this.p++;
      this.expectOp(';');
    }
    const names = [this.varName()];
    while (this.isOp(',')) {
      this.p++;
      names.push(this.varName());
    }
    this.host.write(`${prompt}? `);
    this.run.awaitingInput = names;
    return { k: 'input' };
  }

  private execList(): void {
    let from = 0;
    let to = 63999;
    if (!this.atEnd()) {
      if (this.isOp('-')) {
        this.p++;
        to = this.lineNumber();
      } else {
        from = this.lineNumber();
        to = from;
        if (this.isOp('-')) {
          this.p++;
          to = this.atEnd() ? 63999 : this.lineNumber();
        }
      }
    }
    const prog = this.host.getProgram();
    const lines = this.host.programIsDirectory() ? prog : [...prog].sort((a, b) => a.num - b.num);
    if (this.host.column() > 0) this.host.newline();
    for (const l of lines) {
      if (l.num < from || l.num > to) continue;
      this.host.write(`${l.num} ${l.text}`);
      this.host.newline();
    }
  }

  private execLoad(): Signal {
    let name: string | null = null;
    let dev = 1;
    let sec = 0;
    if (!this.atEnd()) {
      name = this.str(this.expr());
      if (this.isOp(',')) {
        this.p++;
        dev = this.num(this.expr());
        if (this.isOp(',')) {
          this.p++;
          sec = this.num(this.expr());
        }
      }
    }
    const inProgram = this.run.pc.line !== DIRECT;
    const r = this.host.load(name, dev, sec, inProgram);
    if (r === 'error') return { k: 'end' };
    this.reindex();
    if (inProgram) return { k: 'restart' };
    return { k: 'end' };
  }

  // ------------------------------------------------------------------ expressions

  private num(v: Value): number {
    if (typeof v !== 'number') throw new BasicError('TYPE MISMATCH');
    return v;
  }
  private str(v: Value): string {
    if (typeof v !== 'string') throw new BasicError('TYPE MISMATCH');
    return v;
  }
  private intArg(min: number, max: number): number {
    const n = Math.floor(this.num(this.expr()));
    if (n < min || n > max) throw new BasicError('ILLEGAL QUANTITY');
    return n;
  }

  expr(): Value {
    return this.orExpr();
  }

  private orExpr(): Value {
    let l = this.andExpr();
    while (this.isKw('OR')) {
      this.p++;
      l = this.num(l) | this.num(this.andExpr());
    }
    return l;
  }

  private andExpr(): Value {
    let l = this.notExpr();
    while (this.isKw('AND')) {
      this.p++;
      l = this.num(l) & this.num(this.notExpr());
    }
    return l;
  }

  private notExpr(): Value {
    if (this.isKw('NOT')) {
      this.p++;
      return ~Math.trunc(this.num(this.notExpr()));
    }
    return this.compare();
  }

  private compare(): Value {
    let l = this.additive();
    for (;;) {
      const t = this.peekTok();
      if (t?.t !== 'op' || !['=', '<>', '<', '>', '<=', '>='].includes(t.v)) return l;
      this.p++;
      const r = this.additive();
      if (typeof l !== typeof r) throw new BasicError('TYPE MISMATCH');
      const res =
        t.v === '='
          ? l === r
          : t.v === '<>'
            ? l !== r
            : t.v === '<'
              ? l < r
              : t.v === '>'
                ? l > r
                : t.v === '<='
                  ? l <= r
                  : l >= r;
      l = res ? -1 : 0;
    }
  }

  private additive(): Value {
    let l = this.term();
    for (;;) {
      if (this.isOp('+')) {
        this.p++;
        const r = this.term();
        if (typeof l === 'string' && typeof r === 'string') {
          l = l + r;
          if (l.length > 255) throw new BasicError('STRING TOO LONG');
        } else l = this.num(l) + this.num(r);
      } else if (this.isOp('-')) {
        this.p++;
        l = this.num(l) - this.num(this.term());
      } else return l;
    }
  }

  private term(): Value {
    let l = this.unary();
    for (;;) {
      if (this.isOp('*')) {
        this.p++;
        l = this.num(l) * this.num(this.unary());
      } else if (this.isOp('/')) {
        this.p++;
        const r = this.num(this.unary());
        if (r === 0) throw new BasicError('DIVISION BY ZERO');
        l = this.num(l) / r;
      } else return l;
    }
  }

  private unary(): Value {
    if (this.isOp('-')) {
      this.p++;
      return -this.num(this.unary());
    }
    if (this.isOp('+')) {
      this.p++;
      return this.unary();
    }
    return this.power();
  }

  private power(): Value {
    let l = this.primary();
    while (this.isOp('^')) {
      this.p++;
      l = Math.pow(this.num(l), this.num(this.primary()));
    }
    return l;
  }

  private fnArgs(): Value[] {
    this.expectOp('(');
    const args = [this.expr()];
    while (this.isOp(',')) {
      this.p++;
      args.push(this.expr());
    }
    this.expectOp(')');
    return args;
  }

  private primary(): Value {
    const t = this.peekTok();
    if (!t) throw new BasicError('SYNTAX');
    if (t.t === 'num') {
      this.p++;
      return t.v;
    }
    if (t.t === 'str') {
      this.p++;
      return t.v;
    }
    if (t.t === 'op' && t.v === '(') {
      this.p++;
      const v = this.expr();
      this.expectOp(')');
      return v;
    }
    if (t.t === 'id') {
      this.p++;
      const key = canonicalVar(t.v);
      const idx = this.indexArgs();
      if (idx) return this.run.arrays[key]?.data[this.arrayIndex(key, idx)] ?? (key.endsWith('$') ? '' : 0);
      if (key === 'TI') return 0;
      if (key === 'TI$') return '000000';
      return this.run.vars[key] ?? (key.endsWith('$') ? '' : 0);
    }
    if (t.t === 'kw') {
      this.p++;
      const fn = t.v;
      const a = () => this.fnArgs();
      switch (fn) {
        case 'CHR$': {
          const n = Math.floor(this.num(a()[0]));
          if (n < 0 || n > 255) throw new BasicError('ILLEGAL QUANTITY');
          return String.fromCharCode(n);
        }
        case 'ASC': {
          const s = this.str(a()[0]);
          if (s.length === 0) throw new BasicError('ILLEGAL QUANTITY');
          return s.charCodeAt(0);
        }
        case 'LEN':
          return this.str(a()[0]).length;
        case 'VAL': {
          const m = /^\s*[-+]?(\d+\.?\d*|\.\d+)(E[-+]?\d+)?/.exec(this.str(a()[0]));
          return m ? parseFloat(m[0]) : 0;
        }
        case 'STR$': {
          const n = this.num(a()[0]);
          return (n >= 0 ? ' ' : '') + formatNumber(n);
        }
        case 'LEFT$': {
          const [s, n] = a();
          return this.str(s).slice(0, Math.max(0, Math.floor(this.num(n))));
        }
        case 'RIGHT$': {
          const [s, n] = a();
          const k = Math.max(0, Math.floor(this.num(n)));
          return k === 0 ? '' : this.str(s).slice(-k);
        }
        case 'MID$': {
          const args = a();
          const s = this.str(args[0]);
          const start = Math.floor(this.num(args[1]));
          if (start < 1) throw new BasicError('ILLEGAL QUANTITY');
          const len = args[2] === undefined ? 255 : Math.floor(this.num(args[2]));
          return s.substr(start - 1, len);
        }
        case 'INT':
          return Math.floor(this.num(a()[0]));
        case 'ABS':
          return Math.abs(this.num(a()[0]));
        case 'SGN':
          return Math.sign(this.num(a()[0]));
        case 'SQR': {
          const n = this.num(a()[0]);
          if (n < 0) throw new BasicError('ILLEGAL QUANTITY');
          return Math.sqrt(n);
        }
        case 'RND': {
          a();
          // Deterministischer LCG – gleicher Spielstand + gleiche Eingaben = gleiche Werte
          this.run.rng = (this.run.rng * 1103515245 + 12345) % 2147483648;
          return this.run.rng / 2147483648;
        }
        case 'PEEK': {
          const n = Math.floor(this.num(a()[0]));
          if (n < 0 || n > 65535) throw new BasicError('ILLEGAL QUANTITY');
          return this.host.peek(n);
        }
      }
    }
    throw new BasicError('SYNTAX');
  }
}

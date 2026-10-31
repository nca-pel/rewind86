/**
 * Tokenizer für die unterstützte BASIC-V2-Teilmenge.
 * Wie beim echten C64 werden Schlüsselwörter auch ohne Leerzeichen erkannt ("FORI=1TO10").
 */

export const KEYWORDS = [
  'PRINT',
  'LET',
  'IF',
  'THEN',
  'GOTO',
  'GOSUB',
  'RETURN',
  'FOR',
  'TO',
  'STEP',
  'NEXT',
  'REM',
  'END',
  'STOP',
  'INPUT',
  'DATA',
  'READ',
  'RESTORE',
  'POKE',
  'PEEK',
  'CLR',
  'NEW',
  'LIST',
  'RUN',
  'LOAD',
  'SAVE',
  'SYS',
  'DIM',
  'AND',
  'OR',
  'NOT',
  'CHR$',
  'ASC',
  'LEN',
  'MID$',
  'LEFT$',
  'RIGHT$',
  'VAL',
  'STR$',
  'INT',
  'ABS',
  'RND',
  'SGN',
  'SQR',
  'TAB(',
  'SPC(',
  'GET',
  'OPEN',
  'CLOSE',
  'VERIFY',
  'CONT',
  'ON',
  'WAIT',
] as const;

// Längste zuerst, damit z. B. "RESTORE" vor "REM"/"RETURN" nicht falsch zerlegt wird.
const SORTED = [...KEYWORDS].sort((a, b) => b.length - a.length);

export type Token =
  | { t: 'kw'; v: string }
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'rem'; v: string };

function keywordAt(src: string, i: number): string | null {
  for (const k of SORTED) if (src.startsWith(k, i)) return k;
  return null;
}

export class BasicSyntaxError extends Error {}

export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') {
      i++;
      continue;
    }
    if (c === '"') {
      const end = src.indexOf('"', i + 1);
      const v = end < 0 ? src.slice(i + 1) : src.slice(i + 1, end);
      out.push({ t: 'str', v });
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (c === '?') {
      out.push({ t: 'kw', v: 'PRINT' });
      i++;
      continue;
    }
    const kw = keywordAt(src, i);
    if (kw) {
      out.push({ t: 'kw', v: kw });
      i += kw.length;
      if (kw === 'REM') {
        out.push({ t: 'rem', v: src.slice(i) });
        break;
      }
      if (kw === 'DATA') {
        // DATA-Inhalt bis zum nächsten ":" außerhalb von Strings roh übernehmen
        let j = i;
        let inStr = false;
        while (j < src.length && (inStr || src[j] !== ':')) {
          if (src[j] === '"') inStr = !inStr;
          j++;
        }
        out.push({ t: 'rem', v: src.slice(i, j) });
        i = j;
      }
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d*\.?\d*)(E[+-]?\d+)?/.exec(src.slice(i));
      const text = m ? m[0] : c;
      if (text === '.') {
        out.push({ t: 'num', v: 0 });
        i++;
        continue;
      }
      out.push({ t: 'num', v: parseFloat(text) });
      i += text.length;
      continue;
    }
    if (/[A-Z]/.test(c)) {
      let name = c;
      i++;
      while (i < src.length && /[A-Z0-9]/.test(src[i]) && !keywordAt(src, i)) name += src[i++];
      if (src[i] === '$' || src[i] === '%') name += src[i++];
      out.push({ t: 'id', v: name });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '<>' || two === '<=' || two === '>=' || two === '=<' || two === '=>' || two === '><') {
      const norm = two === '=<' ? '<=' : two === '=>' ? '>=' : two === '><' ? '<>' : two;
      out.push({ t: 'op', v: norm });
      i += 2;
      continue;
    }
    if ('+-*/^=<>(),;:'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    throw new BasicSyntaxError(c);
  }
  return out;
}

/** BASIC V2 berücksichtigt nur die ersten zwei Zeichen eines Variablennamens. */
export function canonicalVar(name: string): string {
  const suffix = name.endsWith('$') || name.endsWith('%') ? name.slice(-1) : '';
  const base = suffix ? name.slice(0, -1) : name;
  return base.slice(0, 2) + suffix;
}

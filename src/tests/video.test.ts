import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTHENTIC_PROFILE,
  BORDER_LEFT,
  BORDER_TOP,
  FRAME_H,
  FRAME_W,
  NEUTRAL_PROFILE,
  PALETTE_HEX,
  PALETTE_RGB,
  bannerLines,
  bootVideo,
  buildCharset,
  createVideo,
  getBootProfile,
  newline,
  petsciiToScreen,
  printBytes,
  registerBootProfile,
  renderFrame,
  rowText,
  screenToChar,
  stringToPetscii,
  textToScreen,
  videoLines,
  type VideoState,
} from '../c64';
import { createSaveFile, parseSave, serializeSave } from '../engine/save';
import { Session } from './helpers';

const print = (v: VideoState, s: string) => printBytes(v, stringToPetscii(s));
const glyph = (set: 'upper' | 'lower', code: number) => [...buildCharset(set).slice(code * 8, code * 8 + 8)];

describe('Eigener Zeichensatz', () => {
  test('256 Zeichen à 8 Byte; obere Hälfte ist die invertierte untere', () => {
    for (const set of ['upper', 'lower'] as const) {
      const rom = buildCharset(set);
      expect(rom).toHaveLength(2048);
      for (let i = 0; i < 1024; i++) expect(rom[1024 + i]).toBe(rom[i] ^ 0xff);
    }
  });

  test('Buchstaben, Ziffern und Satzzeichen sind alle verschieden und nicht leer', () => {
    const seen = new Map<string, number>();
    for (let code = 0; code < 64; code++) {
      if (code === 32) continue;
      const g = glyph('upper', code);
      expect(g.some((b) => b !== 0)).toBe(true);
      const key = g.join(',');
      expect(seen.get(key), `Code ${code} gleicht Code ${seen.get(key)}`).toBeUndefined();
      seen.set(key, code);
    }
  });

  test('Kleinschrift-Satz: Kleinbuchstaben auf 1–26, Großbuchstaben auf 65–90', () => {
    expect(glyph('lower', 1)).not.toEqual(glyph('upper', 1));
    expect(glyph('lower', 65)).toEqual(glyph('upper', 1));
    expect(screenToChar(1, 'lower')).toBe('a');
    expect(screenToChar(65, 'lower')).toBe('A');
  });

  test('Stil: senkrechte Striche zwei Pixel breit (z. B. „I“), unterste Zeile frei', () => {
    const I = glyph('upper', 9);
    expect(I[3]).toBe(0b00011000);
    for (let c = 1; c <= 26; c++) expect(glyph('upper', c)[7]).toBe(0);
  });
});

describe('PETSCII und Bildschirmcodes', () => {
  test('Standardabbildungen', () => {
    expect(petsciiToScreen(65)).toBe(1); // A
    expect(petsciiToScreen(64)).toBe(0); // @
    expect(petsciiToScreen(32)).toBe(32);
    expect(petsciiToScreen(97)).toBe(65); // ♠
    expect(petsciiToScreen(193)).toBe(65);
    expect(petsciiToScreen(147)).toBeNull(); // CLR
    expect(petsciiToScreen(255)).toBe(94); // π
  });

  test('Druckbares ASCII übersteht den Weg über Bildschirmcodes', () => {
    const ascii = 'ABCXYZ 0123456789 !"#$%&\'()*+,-./:;<=>?@[]';
    expect(
      textToScreen(ascii)
        .map((c) => screenToChar(c))
        .join(''),
    ).toBe(ascii);
    expect(screenToChar(textToScreen('←')[0])).toBe('←');
  });

  test('Alle 64 Grafikzeichen haben eine Textentsprechung', () => {
    for (let c = 64; c < 128; c++) expect(screenToChar(c)).toHaveLength(1);
  });
});

describe('Bildschirmspeicher und Steuercodes', () => {
  test('Text, RETURN, CLR und HOME', () => {
    const v = createVideo();
    print(v, 'HALLO');
    newline(v);
    expect(rowText(v, 0).trimEnd()).toBe('HALLO');
    expect([v.cx, v.cy]).toEqual([0, 1]);
    print(v, String.fromCharCode(19) + 'X');
    expect(rowText(v, 0).trimEnd()).toBe('XALLO');
    print(v, String.fromCharCode(147));
    expect(videoLines(v)).toEqual([]);
    expect([v.cx, v.cy]).toEqual([0, 0]);
  });

  test('Farbcodes setzen die Schreibfarbe, RVS ON invertiert, RETURN beendet RVS', () => {
    const v = createVideo();
    print(v, String.fromCharCode(28) + 'R' + String.fromCharCode(18) + 'V');
    expect(v.colors[0]).toBe(2);
    expect(v.chars[1]).toBe(22 | 0x80);
    newline(v);
    print(v, 'N');
    expect(v.chars[40]).toBe(14);
  });

  test('Logische Zeilen: genau 40 Zeichen + RETURN ergibt eine Leerzeile', () => {
    const v = createVideo();
    print(v, 'X'.repeat(40));
    newline(v);
    print(v, 'Y');
    expect(videoLines(v)).toEqual(['X'.repeat(40), '', 'Y']);
    expect(v.cy).toBe(2);
  });

  test('Scrollen nach der 25. Zeile', () => {
    const v = createVideo();
    for (let i = 0; i < 30; i++) {
      print(v, `ZEILE ${i}`);
      newline(v);
    }
    expect(rowText(v, 0).trimEnd()).toBe('ZEILE 6');
    expect(v.cy).toBe(24);
  });

  test('Quote-Modus: Steuerzeichen nach Anführungszeichen werden als inverses Symbol gezeigt', () => {
    const v = createVideo();
    print(v, 'A' + '"' + String.fromCharCode(147));
    expect(videoLines(v)[0]).toHaveLength(3);
    expect(v.chars[2] & 0x80).toBe(0x80);
  });

  test('Cursorbewegung und DEL', () => {
    const v = createVideo();
    print(v, 'ABC' + String.fromCharCode(157, 157) + String.fromCharCode(20));
    expect(rowText(v, 0).trimEnd()).toBe('BC');
    print(v, String.fromCharCode(17) + 'D');
    expect(videoLines(v)[1]).toBe('D');
  });
});

describe('Palette', () => {
  test('16 Farben; Schwarz/Weiß exakt, Grautöne unbunt und aufsteigend', () => {
    expect(PALETTE_HEX).toHaveLength(16);
    expect(PALETTE_HEX[0]).toBe('#000000');
    expect(PALETTE_HEX[1]).toBe('#ffffff');
    const greys = [11, 12, 15].map((i) => PALETTE_RGB[i]);
    for (const [r, g, b] of greys) expect(r === g && g === b).toBe(true);
    expect(greys[0][0]).toBeLessThan(greys[1][0]);
    expect(greys[1][0]).toBeLessThan(greys[2][0]);
  });

  test('Farbtöne plausibel: Blau ist blau, Gelb ist gelb, Rot ist rot', () => {
    const [r6, g6, b6] = PALETTE_RGB[6];
    expect(b6).toBeGreaterThan(r6);
    expect(b6).toBeGreaterThan(g6);
    const [r7, g7, b7] = PALETTE_RGB[7];
    expect(Math.min(r7, g7)).toBeGreaterThan(b7);
    const [r2, g2, b2] = PALETTE_RGB[2];
    expect(r2).toBeGreaterThan(Math.max(g2, b2));
  });
});

describe('Renderer (PAL-Geometrie)', () => {
  test('Rahmen, Hintergrund und Zeichenpixel an der richtigen Stelle', () => {
    const v = createVideo();
    print(v, 'I');
    const buf = new Uint8ClampedArray(FRAME_W * FRAME_H * 4);
    renderFrame(buf, v);
    const px = (x: number, y: number) => [...buf.slice((y * FRAME_W + x) * 4, (y * FRAME_W + x) * 4 + 3)];
    expect(px(0, 0)).toEqual([...PALETTE_RGB[14]]); // Rahmen hellblau
    expect(px(BORDER_LEFT + 100, BORDER_TOP + 100)).toEqual([...PALETTE_RGB[6]]); // Hintergrund blau
    // „I“: Zeile 1, Pixel 3 gesetzt, Pixel 0 nicht
    expect(px(BORDER_LEFT + 3, BORDER_TOP + 1)).toEqual([...PALETTE_RGB[14]]);
    expect(px(BORDER_LEFT, BORDER_TOP + 1)).toEqual([...PALETTE_RGB[6]]);
  });

  test('Cursor invertiert seine Zelle; abgeschalteter Bildschirm zeigt nur den Rahmen', () => {
    const v = createVideo();
    const buf = new Uint8ClampedArray(FRAME_W * FRAME_H * 4);
    renderFrame(buf, v, { cursor: { x: 0, y: 0, on: true } });
    expect([
      ...buf.slice((BORDER_TOP * FRAME_W + BORDER_LEFT) * 4, (BORDER_TOP * FRAME_W + BORDER_LEFT) * 4 + 3),
    ]).toEqual([...PALETTE_RGB[14]]);
    v.blank = true;
    renderFrame(buf, v);
    const mid = ((BORDER_TOP + 100) * FRAME_W + BORDER_LEFT + 100) * 4;
    expect([...buf.slice(mid, mid + 3)]).toEqual([...PALETTE_RGB[14]]);
  });
});

describe('Austauschbarer Startbildschirm', () => {
  test('Historisches Profil: Originalaufbau der Einschaltmeldung', () => {
    const lines = videoLines(bootVideo(AUTHENTIC_PROFILE));
    expect(lines).toEqual([
      '',
      '    **** COMMODORE 64 BASIC V2 ****',
      '',
      ' 64K RAM SYSTEM  38911 BASIC BYTES FREE',
      '',
      'READY.',
    ]);
  });

  test('Neutrales Profil: gleicher Aufbau, keine geschützten Namen', () => {
    const v = bootVideo(NEUTRAL_PROFILE);
    const text = videoLines(v).join('\n');
    expect(text).not.toMatch(/COMMODORE|C64/);
    expect(NEUTRAL_PROFILE.machineName).not.toMatch(/Commodore|C64/);
    expect(NEUTRAL_PROFILE.protectedElements).toEqual([]);
    expect(videoLines(v)[5]).toBe('READY.');
    expect([v.cx, v.cy]).toEqual([0, 6]);
  });

  test('Unbekannte Profile fallen auf neutral zurück; eigene Profile werden geprüft', () => {
    expect(getBootProfile('gibt-es-nicht').id).toBe('neutral');
    expect(() =>
      registerBootProfile({ ...NEUTRAL_PROFILE, id: 'kaputt', banner: ['X'.repeat(41)] }),
    ).toThrow();
    registerBootProfile({ ...NEUTRAL_PROFILE, id: 'eigen', banner: ['^MEIN RECHNER'], bytesFree: 30000 });
    expect(bannerLines(getBootProfile('eigen'))[0].trim()).toBe('MEIN RECHNER');
  });
});

describe('BASIC auf dem simulierten Bildschirm', () => {
  function on(): Session {
    const s = new Session();
    s.a('schalte computer ein');
    return s;
  }

  test('POKE in den Bildschirmspeicher erscheint auf dem Bildschirm, PEEK liest ihn', () => {
    const s = on();
    s.c('PRINT CHR$(147)');
    s.c('POKE 1024,1:POKE 55296,2');
    expect(s.state.computer.screen.chars[0]).toBe(1);
    expect(s.state.computer.screen.colors[0]).toBe(2);
    expect(s.screen().split('\n')[0]).toMatch(/^A/);
    expect(s.c('?PEEK(1024)')).toContain(' 1');
  });

  test('CHR$-Steuercodes: Bildschirm löschen, Farbe, Revers', () => {
    const s = on();
    s.c('PRINT CHR$(147);CHR$(28);"ROT";CHR$(18);"INV"');
    const v = s.state.computer.screen;
    expect(rowText(v, 0).trimEnd()).toBe('ROTINV');
    expect(v.colors[0]).toBe(2);
    expect(v.chars[3] & 0x80).toBe(0x80);
  });

  test('POKE 53272,23 schaltet auf Kleinschrift, POKE 53265,11 schaltet das Bild ab', () => {
    const s = on();
    s.c('POKE 53272,23');
    expect(s.state.computer.screen.lower).toBe(true);
    s.c('POKE 53265,11');
    expect(s.state.computer.screen.blank).toBe(true);
    // Abgeschaltetes Bild zeigt keinen Text – auch nicht für Screenreader
    expect(s.c('A=PEEK(53265)').trim()).toBe('');
    s.c('POKE 53265,27');
    expect(s.c('?A')).toContain(' 11');
  });

  test('FRE(0) direkt nach dem Einschalten ist wie am Original negativ', () => {
    const s = on();
    expect(s.c('?FRE(0)')).toContain('-26627');
    s.c('10 PRINT "HALLO"');
    // 2 Byte Verkettung + 2 Byte Zeilennummer + PRINT als 1 Token + ' "HALLO"' + Zeilenende = 14 Byte
    expect(s.c('?FRE(0)+65536')).toContain(' 38895');
  });

  test('Mathematische Funktionen, POS und Überlauf', () => {
    const s = on();
    expect(s.c('?INT(SIN(1)*1000);INT(COS(0));INT(ATN(1)*4*1000)')).toContain(' 841  1  3141');
    expect(s.c('?LOG(EXP(2))')).toContain(' 2');
    expect(s.c('?LOG(0)')).toContain('?ILLEGAL QUANTITY  ERROR');
    expect(s.c('?10^39')).toContain('?OVERFLOW  ERROR');
    expect(s.c('?"AB";POS(0)')).toContain('AB 2');
  });

  test('DEF FN und FN', () => {
    const s = on();
    s.c('10 DEF FNQ(X)=X*X+1');
    s.c('20 PRINT FNQ(3);FNQ(FNQ(1))');
    expect(s.c('RUN')).toContain(' 10  5');
    expect(s.c('DEF FNA(X)=1')).toContain('?ILLEGAL DIRECT  ERROR');
    expect(s.c('?FNZ(1)')).toContain("?UNDEF'D FUNCTION  ERROR");
  });

  test('Genau 40 Zeichen ausgeben erzeugt wie am Original eine Leerzeile', () => {
    const s = on();
    s.c('PRINT CHR$(147);"' + 'X'.repeat(40) + '"');
    const lines = s.screen().split('\n');
    expect(lines[0]).toBe('X'.repeat(40));
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('READY.');
  });

  test('Bildschirm mit Cursor- und Registerzustand übersteht Speichern/Laden', () => {
    const s = on();
    s.c('POKE 53280,2:PRINT CHR$(158);"GELB"');
    const r = parseSave(serializeSave(createSaveFile(s.state, 'T', '2026-10-31T12:00:00.000Z')));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.state.computer.screen).toEqual(s.state.computer.screen);
  });

  test('Alte Spielstände (Version 1, Bildschirm als Textzeilen) werden migriert', () => {
    const s = on();
    const v1 = JSON.parse(serializeSave(createSaveFile(s.state, 'Alt', '2026-10-31T12:00:00.000Z')));
    v1.schemaVersion = 1;
    v1.state.schemaVersion = 1;
    v1.state.computer.screen = { lines: ['', 'ALTER STAND', 'READY.'], border: 2, background: 0, text: 1 };
    const r = parseSave(JSON.stringify(v1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const scr = r.file.state.computer.screen;
    expect(videoLines(scr)).toEqual(['', 'ALTER STAND', 'READY.']);
    expect([scr.border, scr.cy]).toEqual([2, 3]);
  });
});

describe('Keine Original-ROM-Dateien im Projekt', () => {
  test('Quell- und Auslieferungsordner enthalten keine ROM-/Binärabbilder', () => {
    const bad: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (
          /\.(rom|bin|chr|64c|crt|d64|t64|prg)$/i.test(name) ||
          /kernal|basic.*rom|chargen/i.test(name)
        )
          bad.push(p);
      }
    };
    walk('src');
    walk('public');
    expect(bad).toEqual([]);
  });
});

describe('Robustheit', () => {
  test('Unbekanntes Zeichen in einer Programmzeile ergibt ?SYNTAX ERROR IN n statt eines Absturzes', () => {
    const s = new Session();
    s.a('schalte computer ein');
    s.c('10 PRINT "A"');
    s.c('20 PRINT 1@2');
    const scr = s.c('RUN');
    expect(scr).toMatch(/A\n\?SYNTAX {2}ERROR IN 20\nREADY\.$/);
  });
});

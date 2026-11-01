import { SECTIONS, SONG_BARS, SONG_SECONDS, SONG_STEPS, sectionAt, songStep } from '../audio/demoSong';
import { INTRUDER_GREETINGS, INTRUDER_PARTS, INTRUDER_SCREENS } from '../sim/apps/intruder';
import { PART_DRAWERS } from '../ui/demoParts';
import { Session } from './helpers';

function startDemo(): Session {
  const s = new Session();
  s.a('öffne schublade');
  s.a('nimm 1001');
  s.a('lege 1001 ins laufwerk');
  s.a('schalte computer ein');
  s.c('LOAD"*",8');
  s.c('RUN');
  return s;
}

const part = (s: Session) => (s.state.computer.app as unknown as { screen: number }).screen;

describe('INTRUDER-Demo: Song', () => {
  test('88 Takte in neun Abschnitten, über zwei Minuten lang', () => {
    expect(SECTIONS).toHaveLength(9);
    expect(SONG_BARS).toBe(88);
    expect(SONG_STEPS).toBe(88 * 16);
    expect(SONG_SECONDS).toBeGreaterThan(150);
    expect(sectionAt(0).index).toBe(0);
    expect(sectionAt(SONG_BARS - 1).index).toBe(8);
    expect(sectionAt(SONG_BARS).index).toBe(0);
  });

  test('jeder Abschnitt klingt, alle Noten liegen im Bereich, der Song ist deterministisch', () => {
    const perSection = new Array(SECTIONS.length).fill(0);
    for (let i = 0; i < SONG_STEPS; i++) {
      const e = songStep(i);
      expect(songStep(i)).toEqual(e);
      const notes = [e.lead, e.arp, e.bass?.note, ...(e.pad ?? [])].filter(
        (n): n is number => n !== undefined,
      );
      for (const n of notes) {
        expect(n).toBeGreaterThanOrEqual(28);
        expect(n).toBeLessThanOrEqual(96);
      }
      if (notes.length || e.kick || e.snare || e.hat) perSection[e.section]++;
    }
    for (const n of perSection) expect(n).toBeGreaterThan(0);
  });

  test('Abwechslung: Break ohne Schlagzeug mit Aufbau, Drop mit Kick, Schlussakkord klingt aus', () => {
    let breakDrums = 0;
    let riser = 0;
    let dropKicks = 0;
    let holds = 0;
    for (let i = 0; i < SONG_STEPS; i++) {
      const e = songStep(i);
      const name = SECTIONS[e.section].name;
      if (name === 'BREAK' && (e.kick || e.hat)) breakDrums++;
      if (name === 'BREAK' && e.riser) riser++;
      if (name === 'DROP' && e.kick) dropKicks++;
      if (e.hold) holds++;
    }
    expect(breakDrums).toBe(0);
    expect(riser).toBe(32);
    expect(dropKicks).toBeGreaterThan(40);
    expect(holds).toBe(1);
    // Die Tonart wechselt: Brücke und Finale liegen höher als das Thema
    const theme = songStep(8 * 16).bass?.note ?? 0;
    const bridge = songStep(72 * 16).bass?.note ?? 0;
    const finale = songStep(80 * 16).bass?.note ?? 0;
    expect(bridge).toBe(theme + 7);
    expect(finale).toBe(theme + 2);
  });
});

describe('INTRUDER-Demo: Rockteil', () => {
  test('Riff mit Powerchords und Palm Mute, dann Gitarrensolo mit Bendings; Rock-Schlagzeug', () => {
    let chords = 0;
    let mutes = 0;
    let solos = 0;
    let bends = 0;
    let crashes = 0;
    let soloInRiffHalf = 0;
    let kicks = 0;
    for (let i = 0; i < SONG_STEPS; i++) {
      const e = songStep(i);
      const inRock = SECTIONS[e.section].name === 'ROCK';
      if (!inRock) {
        expect(e.guitar ?? e.solo).toBeUndefined();
        continue;
      }
      if (e.guitar) {
        chords++;
        if (e.guitar.mute) mutes++;
        expect(e.guitar.notes).toHaveLength(3);
        expect(e.guitar.notes[1] - e.guitar.notes[0]).toBe(7);
        expect(e.guitar.notes[2] - e.guitar.notes[0]).toBe(12);
      }
      if (e.solo) {
        solos++;
        if (e.solo.bend) bends++;
        if (e.bar < 8) soloInRiffHalf++;
        expect(e.solo.note).toBeGreaterThanOrEqual(60);
        expect(e.solo.note).toBeLessThanOrEqual(90);
      }
      if (e.crash) crashes++;
      if (e.kick) kicks++;
    }
    expect(chords).toBeGreaterThan(80);
    expect(mutes).toBeGreaterThan(40);
    expect(solos).toBeGreaterThan(20);
    expect(bends).toBeGreaterThan(3);
    expect(soloInRiffHalf).toBe(0);
    expect(crashes).toBeGreaterThanOrEqual(4);
    expect(kicks).toBeGreaterThan(50);
  });
});

describe('INTRUDER-Demo: acht Teile', () => {
  test('Jeder Teil hat Titel, Effektbeschreibung und Laufschrift; es gibt einen Zeichner pro Teil', () => {
    expect(INTRUDER_SCREENS).toHaveLength(INTRUDER_PARTS);
    expect(PART_DRAWERS).toHaveLength(INTRUDER_PARTS);
    expect(new Set(INTRUDER_SCREENS.map((p) => p.title)).size).toBe(INTRUDER_PARTS);
    for (const p of INTRUDER_SCREENS) {
      expect(p.effect.length).toBeGreaterThan(20);
      expect(p.scroller.length).toBeGreaterThan(40);
    }
    expect(INTRUDER_GREETINGS.every((l) => l.length <= 40)).toBe(true);
  });

  test('Navigation: Leertaste, Zurück, Ziffern; Untertitel nennen Teil und Effekt', () => {
    const s = startDemo();
    expect(part(s)).toBe(0);
    s.key('SPACE');
    expect(part(s)).toBe(1);
    s.key('DEL');
    expect(part(s)).toBe(0);
    s.key('DEL');
    expect(part(s)).toBe(7);
    s.key('4');
    expect(part(s)).toBe(3);
    const caption = s.log.filter((l) => l.kind === 'caption').at(-1)!.text;
    expect(caption).toContain('PLASMA');
    expect(caption).toContain('(4/8)');
    expect(caption).toContain('Laufschrift');
    s.key('9');
    expect(part(s)).toBe(3);
    expect(s.screen()).toContain('TEIL 4/8');
  });

  test('Rand-Hinweis auch beim direkten Sprung; Jans Kommentare nur einmal; alle Teile → Fakt', () => {
    const s = startDemo();
    s.key('2');
    expect(s.has('demo_border')).toBe(true);
    const thoughts = () => s.log.filter((l) => l.kind === 'thought').length;
    s.key('5');
    const n = thoughts();
    s.key('1');
    s.key('5');
    expect(thoughts()).toBe(n);
    expect(s.has('demo_all')).toBe(false);
    for (const k of '12345678') s.key(k);
    expect(s.has('demo_all')).toBe(true);
  });
});

/**
 * INTRUDER by 1001 FIGHTERS – eigene, fiktive Demo (inspiriert von frühen C64-Demos, keine Übernahme).
 * Die Effekte zeichnet die UI per Canvas; hier liegen Zustand und Textinhalte, damit die Demo
 * auch stumm und ohne Animation vollständig erfahrbar ist (GDD §12.3).
 */
import { GAME_CONFIG } from '../../content/config';
import { discoverFact } from '../../engine/effects';
import type { Ctx } from '../../engine/context';
import type { AppState } from '../../engine/types';
import { centered } from '../screen';
import type { AppDef } from './types';

export interface IntruderState extends AppState {
  id: 'intruder';
  screen: number;
  /** schon gesehene Teile (für Jans Kommentare, nur einmal) */
  seen?: number[];
}

export interface IntruderPart {
  title: string;
  /** Beschreibung des Effekts für Untertitel und Screenreader (die Demo muss stumm und ohne Bild verständlich sein) */
  effect: string;
  scroller: string;
  /** Jans Reaktion beim ersten Sehen (optional) */
  thought?: string;
}

export const INTRUDER_PARTS = 8;

export const INTRUDER_SCREENS: IntruderPart[] = [
  {
    title: 'INTRUDER',
    effect:
      'Das gezeichnete INTRUDER-Logo in Chromblöcken mit Glanzstreifen, darunter das Wappen der Gruppe 1001 FIGHTERS mit gekreuzten Klingen, kreisenden Lichtern und Banderole.',
    scroller:
      'HELLO DEMO-FREAKS! 1001 FIGHTERS PROUDLY PRESENT: INTRUDER! ... CODE + GFX + SID BY 1001 FIGHTERS ... NO CRACKTRO, NO LAME LOGO, JUST EIGHT PARTS OF PURE RASTER MADNESS ... GREETINGS TO ALL SWAPPERS AND DEMO-MAKERS OUT THERE ... SPACE = NEXT PART, 1-8 = JUMP, DEL = BACK ...',
  },
  {
    title: 'NO BORDER',
    effect:
      'Raster im Rahmen, wo eigentlich nichts sein darf; die Schrift NO BORDER pulsiert in der Mitte, und die Laufschrift fliegt als Sinuswelle mitten hindurch.',
    scroller:
      'WHO SAYS THE SCREEN ENDS AT THE BORDER? ... THIS TEXT RUNS WHERE NO TEXT SHOULD BE ... LOOK CLOSER - THE BORDER IS JUST ANOTHER CANVAS ... SPACE = NEXT PART',
  },
  {
    title: 'STARFIELD',
    effect: 'Drei Sternschichten ziehen in verschiedenen Geschwindigkeiten vorbei, mittendrin die Zahl 1001.',
    scroller:
      '1001 STARS FOR 1001 FIGHTERS ... THE FASTER LAYER IS CLOSER TO YOU ... PARALLAX ON A ONE-MEGAHERTZ MACHINE? WHY NOT ...',
  },
  {
    title: 'PLASMA',
    effect: 'Ein Teppich aus Farbfeldern wabert in Wellen und wechselt langsam die Palette.',
    scroller:
      'SINE ON SINE ON SINE ... A TABLE OF 256 VALUES AND A LOT OF PATIENCE ... DO NOT STARE TOO LONG, YOUR MONITOR MIGHT BLUSH ...',
    thought:
      'Das wabert wie flüssiges Glas. Jede Farbe kommt aus ein paar Sinuswerten – vermutlich eine Tabelle, sonst wäre das viel zu langsam.',
  },
  {
    title: 'VECTOR',
    effect: 'Zwei Drahtgitterwürfel, einer im anderen, drehen sich gegenläufig und wechseln die Farben.',
    scroller:
      'REAL 3D ON AN 8-BIT: ROTATE, PROJECT, DRAW LINES ... THE SECRET IS A TABLE OF SINES AND NOT LOOKING AT THE FRAME RATE ... NEXT STOP: THE TUNNEL ...',
    thought:
      'Ein Drahtgittermodell in Echtzeit. Das ist kein BASIC mehr – dahinter steckt Maschinensprache und eine Menge Tricks.',
  },
  {
    title: 'TUNNEL',
    effect:
      'Ineinander liegende Quadrate rasen auf dich zu und drehen sich dabei, die Farben laufen im Kreis.',
    scroller:
      'DEEPER ... DEEPER ... SCREEN RAM IS ONLY 1000 BYTES, THE REST IS PURE IMAGINATION ... HOLD ON TO YOUR JOYSTICK ...',
  },
  {
    title: 'SINE SCROLLER',
    effect: 'Große Buchstaben schwingen wellenförmig über farbigen Balken, dazu läuft eine zweite Schrift.',
    scroller:
      'EVERY LETTER DANCES ON ITS OWN WAVE ... CHARACTER BY CHARACTER, LINE BY LINE ... THE SID DOES THE REST: THREE VOICES AND A LOT OF NERVE ...',
    thought:
      'Jeder Buchstabe tanzt auf seiner eigenen Welle. Wer sich das ausdenkt, hat zu viel Freizeit – und genau das ist das Schöne.',
  },
  {
    title: 'GREETINGS',
    effect: 'Eine Grußliste läuft von unten nach oben durchs Bild, darunter tanzt ein Equalizer zur Musik.',
    scroller:
      'THE END? NEVER! THE MUSIC LOOPS AFTER TWO MINUTES, THE DEMO LOOPS WHEN YOU PRESS SPACE ... SEE YOU IN THE NEXT ONE - 1001 FIGHTERS, NOVEMBER 1986 ... RUN/STOP TO EXIT ...',
    thought:
      'Greetings an Leute, die du nie getroffen hast – und trotzdem fühlst du dich ein bisschen dazugehörig. Und die Musik hat sich bis jetzt kein einziges Mal wiederholt.',
  },
];

/** Grußliste im letzten Teil (fiktive Gruppen) */
export const INTRUDER_GREETINGS = [
  'GREETINGS FLY TO:',
  '',
  'BYTE BANDITS',
  'RASTERBURG',
  'THE SILENT CARTRIDGES',
  'NIGHTSHIFT SOFT',
  'SWAPPERS OF THE NORTH',
  'ALL BBS SYSOPS',
  'EVERYONE WITH A DATASETTE',
  '',
  'CODE: THE 1001 TEAM',
  'GFX: THE 1001 TEAM',
  'SID:  THE 1001 TEAM',
  '',
  'BETTER LOADERS IN 1987',
];

function show(ctx: Ctx, app: IntruderState, n: number): void {
  app.screen = n;
  const part = INTRUDER_SCREENS[n];
  ctx.say(
    `[Demo-Teil »${part.title}« (${n + 1}/${INTRUDER_SCREENS.length}): ${part.effect} Laufschrift: ${part.scroller}]`,
    'caption',
  );
  app.seen ??= [];
  if (!app.seen.includes(n)) {
    app.seen.push(n);
    if (part.thought) ctx.say(part.thought, 'thought');
  }
  const cfg = GAME_CONFIG.intruder;
  if (n === cfg.hintScreen && !ctx.state.knownFacts.includes('demo_border')) {
    ctx.say(cfg.hintThought, 'thought');
    discoverFact(ctx, 'demo_border');
    // hintLink: Der Rand-Trick ist der Denkanstoß für das unsichtbare Schlüsselfragment (P08).
    if (cfg.hintLink) discoverFact(ctx, cfg.hintLink.factId);
  }
  if (app.seen.length === INTRUDER_SCREENS.length && !ctx.state.knownFacts.includes('demo_all'))
    discoverFact(ctx, 'demo_all');
}

export const intruderApp: AppDef<IntruderState> = {
  id: 'intruder',
  tickMs: null,
  start(ctx) {
    ctx.say(
      'INTRUDER! Rasterbalken in allen Farben, eine Laufschrift, hüpfende Sprites, und aus dem Monitorlautsprecher dudelt die Musik. Du grinst. Unglaublich, was die aus dem Brotkasten herausholen!',
      'thought',
    );
    discoverFact(ctx, 'demo_seen');
    ctx.ui.push({ type: 'demoMusic', on: true });
    ctx.say(`[Laufschrift: ${INTRUDER_SCREENS[0].scroller}]`, 'caption');
    return { id: 'intruder', screen: 0, seen: [0] };
  },
  key(ctx, app, key) {
    if (key === 'RUNSTOP') {
      ctx.ui.push({ type: 'demoMusic', on: false });
      return { exit: true };
    }
    let target: number | null = null;
    if (key === 'SPACE' || key === 'RETURN') target = (app.screen + 1) % INTRUDER_SCREENS.length;
    else if (key === 'DEL' || key.toUpperCase() === 'B')
      target = (app.screen + INTRUDER_SCREENS.length - 1) % INTRUDER_SCREENS.length;
    else if (/^[1-8]$/.test(key)) target = Number(key) - 1;
    if (target === null || target === app.screen) return {};
    show(ctx, app, target);
    return {};
  },
  inputMode: () => 'keys',
  render(_state, app) {
    const s = INTRUDER_SCREENS[app.screen];
    const L = new Array(25).fill('');
    L[2] = centered(`- ${s.title} -`);
    L[12] = centered('INTRUDER BY 1001 FIGHTERS');
    L[3] = centered(`TEIL ${app.screen + 1}/${INTRUDER_SCREENS.length}`);
    L[22] = centered('SPACE=WEITER 1-8=TEIL DEL=ZURUECK');
    L[23] = centered('RUN/STOP = ENDE');
    return { lines: L, border: 0, background: 0, text: 1, demoScreen: app.screen };
  },
};

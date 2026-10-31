/**
 * INTRUDER by 1001 FIGHTERS – eigene, fiktive Demo (inspiriert von frühen C64-Demos, keine Übernahme).
 * Die Effekte zeichnet die UI per Canvas; hier liegen Zustand und Textinhalte, damit die Demo
 * auch stumm und ohne Animation vollständig erfahrbar ist (GDD §12.3).
 */
import { GAME_CONFIG } from '../../content/config';
import { discoverFact } from '../../engine/effects';
import type { AppState } from '../../engine/types';
import { centered } from '../screen';
import type { AppDef } from './types';

export interface IntruderState extends AppState {
  id: 'intruder';
  screen: number;
}

export const INTRUDER_SCREENS = [
  {
    title: 'INTRUDER',
    scroller:
      'HELLO DEMO-FREAKS! 1001 FIGHTERS PROUDLY PRESENT: INTRUDER! ... CODE + GFX + SID BY 1001 FIGHTERS ... GREETINGS TO ALL CRACKERS, SWAPPERS AND DEMO-MAKERS OUT THERE ... PRESS SPACE FOR MORE ...',
  },
  {
    title: 'NO BORDER',
    scroller:
      'WHO SAYS THE SCREEN ENDS AT THE BORDER? ... THIS TEXT RUNS WHERE NO TEXT SHOULD BE ... LOOK CLOSER - THE BORDER IS JUST ANOTHER CANVAS ... SPACE = NEXT PART',
  },
  {
    title: 'STARFIELD',
    scroller: '1001 STARS FOR 1001 FIGHTERS ... THANKS FOR WATCHING ... RUN/STOP TO EXIT ...',
  },
];

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
    return { id: 'intruder', screen: 0 };
  },
  key(ctx, app, key) {
    if (key === 'RUNSTOP') {
      ctx.ui.push({ type: 'demoMusic', on: false });
      return { exit: true };
    }
    if (key === 'SPACE' || key === 'RETURN') {
      app.screen = (app.screen + 1) % INTRUDER_SCREENS.length;
      ctx.say(
        `[Demo-Teil »${INTRUDER_SCREENS[app.screen].title}« – Laufschrift: ${INTRUDER_SCREENS[app.screen].scroller}]`,
        'caption',
      );
      const cfg = GAME_CONFIG.intruder;
      if (app.screen === cfg.hintScreen && !ctx.state.knownFacts.includes('demo_border')) {
        ctx.say(cfg.hintThought, 'thought');
        discoverFact(ctx, 'demo_border');
        // hintLink: Der Rand-Trick ist der Denkanstoß für das unsichtbare Schlüsselfragment (P08).
        if (cfg.hintLink) discoverFact(ctx, cfg.hintLink.factId);
      }
    }
    return {};
  },
  inputMode: () => 'keys',
  render(_state, app) {
    const s = INTRUDER_SCREENS[app.screen];
    const L = new Array(25).fill('');
    L[2] = centered(`- ${s.title} -`);
    L[12] = centered('INTRUDER BY 1001 FIGHTERS');
    L[22] = centered('SPACE = WEITER   RUN/STOP = ENDE');
    return { lines: L, border: 0, background: 0, text: 1, demoScreen: app.screen };
  },
};

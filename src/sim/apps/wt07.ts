/**
 * Das unveröffentlichte Spiel aus Ralfs Kopie (Arbeitsversion).
 * Wiederholbares Intro in diskreten Phasen. Die geheime Taste wirkt während der gesamten
 * Credits-Phase – unabhängig von Reaktionsgeschwindigkeit (GDD §4.1, §19.4).
 * RETURN schaltet manuell zur nächsten Phase weiter.
 */
import { GAME_CONFIG } from '../../content/config';
import { discoverFact, setPuzzle } from '../../engine/effects';
import type { AppState } from '../../engine/types';
import { centered } from '../screen';
import type { AppDef } from './types';

type Phase = 'logo' | 'title' | 'credits' | 'hiscore' | 'play';

export interface Wt07State extends AppState {
  id: 'wt07';
  phase: Phase;
  t: number;
  loops: number;
}

const PHASES: Phase[] = ['logo', 'title', 'credits', 'hiscore'];
const DURATION: Record<Phase, number> = { logo: 3, title: 5, credits: 6, hiscore: 4, play: 999 };

const G = GAME_CONFIG.unreleasedGame;

function enterPhase(ctx: Parameters<AppDef['key']>[0], app: Wt07State, phase: Phase): void {
  app.phase = phase;
  app.t = 0;
  if (phase === 'logo') app.loops++;
  if (phase === 'credits') {
    if (!ctx.state.knownFacts.includes('credits_ms')) {
      ctx.say('In den Credits steht als Programmierer nur ein Kürzel: »M.S.«', 'thought');
      discoverFact(ctx, 'credits_ms');
    }
    if (!ctx.state.knownFacts.includes('intro_arrow')) {
      ctx.say(
        'Moment – während die Credits laufen, zuckt der Bildschirmrand, und ganz oben links blitzt für einen Augenblick ein kleiner Pfeil auf: »←«. Ein Grafikfehler? Oder Absicht?',
        'thought',
      );
      discoverFact(ctx, 'intro_arrow');
      setPuzzle(ctx, 'P03', 'solving');
    }
  }
}

function next(ctx: Parameters<AppDef['key']>[0], app: Wt07State): void {
  const i = PHASES.indexOf(app.phase);
  enterPhase(ctx, app, PHASES[(i + 1) % PHASES.length]);
}

export const wt07App: AppDef<Wt07State> = {
  id: 'wt07',
  tickMs: 1200,
  start(ctx) {
    if (!ctx.state.flags.introSeen) {
      ctx.say(
        'Der Bildschirm wird schwarz, dann baut sich ein Logo auf. Du rutschst näher an den Monitor. Ein Spiel, das noch niemand kennt – und du siehst es als Erster!',
        'thought',
      );
      ctx.state.flags.introSeen = true;
      setPuzzle(ctx, 'P01', 'solved');
      setPuzzle(ctx, 'P03', 'discovered');
    }
    return { id: 'wt07', phase: 'logo', t: 0, loops: 0 };
  },
  tick(ctx, app) {
    if (app.phase === 'play') return {};
    app.t++;
    if (app.t >= DURATION[app.phase]) next(ctx, app);
    return {};
  },
  key(ctx, app, key) {
    if (key === 'RUNSTOP') return { exit: true };
    if (app.phase === 'play') {
      enterPhase(ctx, app, 'logo');
      return {};
    }
    if (key === G.secretKey && app.phase === G.secretPhase) {
      ctx.say(
        'Du drückst die ←-Taste. Der Bildschirm flackert, das Intro bricht ab – und statt des Spiels erscheint eine nüchterne Textseite. Das gehört ganz sicher nicht zu einem Spiel.',
        'thought',
      );
      discoverFact(ctx, 'secret_mode');
      setPuzzle(ctx, 'P03', 'solved');
      ctx.ui.push({ type: 'autosave', reason: 'Geheimer Modus' });
      return { switchTo: 'modk', minutes: 1 };
    }
    if (key === 'SPACE') {
      enterPhase(ctx, app, 'play');
      return {};
    }
    if (key === 'RETURN') next(ctx, app);
    return {};
  },
  inputMode: () => 'keys',
  render(_state, app) {
    const L: string[] = new Array(25).fill('');
    let border = 0;
    let flash = false;
    const colors: Record<number, number> = {};
    switch (app.phase) {
      case 'logo':
        L[8] = centered('#   #  #####      ###  #####');
        L[9] = centered('#   #    #       #   #     #');
        L[10] = centered('# # #    #  ###  #   #    # ');
        L[11] = centered('## ##    #       #   #   #  ');
        L[12] = centered('#   #    #        ###    #  ');
        L[16] = centered('ENTWICKLERVERSION 0.7');
        L[17] = centered('NICHT ZUR WEITERGABE');
        colors[16] = 15;
        colors[17] = 2;
        break;
      case 'title':
        L[5] = centered(`*** ${G.workingTitle} ***`);
        L[7] = centered('(ARBEITSTITEL)');
        L[12] = centered('EIN SPIEL IN ENTWICKLUNG');
        L[20] = centered('LEERTASTE = START');
        L[22] = centered('RETURN = WEITER');
        colors[5] = 7;
        colors[20] = 1;
        border = 6;
        break;
      case 'credits':
        L[4] = centered('- C R E D I T S -');
        L[8] = centered('PROGRAMM ....... M.S.');
        L[10] = centered('GRAFIK ........ N.N.');
        L[12] = centered('MUSIK ......... N.N.');
        L[16] = centered(`BUILD ${G.buildCode} / ARBEITSKOPIE`);
        L[0] = '←';
        flash = true;
        colors[0] = 2;
        colors[4] = 7;
        border = 2;
        break;
      case 'hiscore':
        L[4] = centered('HIGHSCORES');
        L[7] = centered('1. M.S.   ...... 050000');
        L[8] = centered('2. TEST   ...... 025000');
        L[9] = centered('3. TEST   ...... 010000');
        L[10] = centered('4. ---   ...... 000000');
        colors[4] = 5;
        border = 11;
        break;
      case 'play':
        L[8] = centered('ARBEITSVERSION 0.7');
        L[11] = centered('SPIELTEIL IN DIESER');
        L[12] = centered('KOPIE NICHT ENTHALTEN.');
        L[16] = centered('TASTE = ZURUECK ZUM INTRO');
        border = 9;
        break;
    }
    return { lines: L, border, background: 0, text: 14, flash, lineColors: colors };
  },
};

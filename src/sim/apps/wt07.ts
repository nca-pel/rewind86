/**
 * Das unveröffentlichte Spiel aus Ralfs Kopie (Arbeitsversion).
 * Wiederholbares Intro in diskreten Phasen. Die geheime Taste wirkt während der gesamten
 * Credits-Phase – unabhängig von Reaktionsgeschwindigkeit (GDD §4.1, §19.4).
 * RETURN schaltet manuell zur nächsten Phase weiter.
 */
import { GAME_CONFIG } from '../../content/config';
import {
  FH_CITIES,
  FH_DAYS,
  FH_GOODS,
  FH_MAX_HOLD,
  FH_UPGRADE_COST,
  fare,
  handleKey,
  holdUsed,
  newGame,
  price,
  rating,
  type FhState,
} from '../../content/fernhandel';
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
  /** Laufendes Spiel FERNHANDEL (Phase »play«) */
  game?: FhState;
}

const PHASES: Phase[] = ['logo', 'title', 'credits', 'hiscore'];
const DURATION: Record<Phase, number> = { logo: 3, title: 5, credits: 6, hiscore: 4, play: 999 };

const G = GAME_CONFIG.unreleasedGame;

function enterPhase(ctx: Parameters<AppDef['key']>[0], app: Wt07State, phase: Phase): void {
  app.phase = phase;
  app.t = 0;
  if (phase === 'logo') app.loops++;
  if (phase === 'play' && !app.game) {
    const plays = Number(ctx.state.flags.fernhandelPlays ?? 0);
    app.game = newGame(1986 + plays);
    ctx.state.flags.fernhandelPlays = plays + 1;
    if (plays === 0)
      ctx.say(
        'Der Spielteil ist doch drin! Du stehst als Händler in Hamburg, mit ein paar tausend Mark Startkapital und einem Kredit im Nacken. Dreißig Tage – so lange hast du Zeit.',
        'thought',
      );
  }
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

function playKey(ctx: Parameters<AppDef['key']>[0], app: Wt07State, key: string): { minutes?: number } {
  const g = app.game!;
  if (g.mode === 'end') {
    if (key === 'RETURN') {
      app.game = undefined;
      enterPhase(ctx, app, 'play');
    } else if (key.toUpperCase() === 'I') {
      app.game = undefined;
      enterPhase(ctx, app, 'logo');
    }
    return {};
  }
  if (key.toUpperCase() === 'I' && g.mode === 'market') {
    enterPhase(ctx, app, 'logo');
    return {};
  }
  const traveled = handleKey(g, key);
  if ((g.mode as string) === 'end' && g.final !== null) {
    const best = Number(ctx.state.flags.fernhandelBest ?? -Infinity);
    if (g.final > best) ctx.state.flags.fernhandelBest = g.final;
    if (!ctx.state.flags.fernhandelFinished) {
      ctx.state.flags.fernhandelFinished = true;
      ctx.say(
        `Dreißig Tage sind um: ${rating(g.final)}. Ein richtiges kleines Spiel – und M.S. hat es nie veröffentlicht? Das ist schade. Die Highscore-Tafel im Intro kennt aber nur seinen Rekord von 50000.`,
        'thought',
      );
    }
  }
  return traveled ? { minutes: 1 } : {};
}

const num = (n: number, w: number) => String(Math.round(n)).padStart(w);

function renderGame(g: FhState): { lines: string[]; border: number; colors: Record<number, number> } {
  const L: string[] = new Array(25).fill('');
  const colors: Record<number, number> = {};
  const wrap = (s: string, row: number, max = 2) => {
    const words = s.split(' ');
    let line = '';
    let r = row;
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 40) {
        L[r++] = line.trim();
        line = '';
        if (r >= row + max) return;
      }
      line += ' ' + w;
    }
    if (line.trim()) L[r] = line.trim();
  };
  if (g.mode === 'end') {
    const f = g.final ?? 0;
    L[2] = centered('*** HANDELSBILANZ ***');
    L[5] = centered(`TAG ${FH_DAYS} ERREICHT`);
    L[7] = `KASSE:    ${num(g.cash, 8)}`;
    L[8] = `SCHULDEN: ${num(g.debt, 8)}`;
    L[9] = `GESAMT:   ${num(f, 8)}`;
    L[12] = centered(`RANG: ${rating(f)}`);
    L[14] = centered('(REKORD VON M.S.: 50000)');
    L[20] = centered('RETURN = NEUES SPIEL');
    L[21] = centered('I = INTRO   RUN/STOP = ENDE');
    colors[2] = 7;
    colors[12] = 5;
    return { lines: L, border: 5, colors };
  }
  if (g.mode === 'help') {
    L[0] = centered('FERNHANDEL - HILFE');
    L[2] = 'ZIEL: IN 30 TAGEN SO REICH WIE';
    L[3] = 'MOEGLICH WERDEN (KASSE - SCHULDEN).';
    L[5] = 'KAUFE WAREN, WO SIE BILLIG SIND,';
    L[6] = 'VERKAUFE SIE, WO SIE GEFRAGT SIND.';
    L[7] = 'DEINE KAEUFE TREIBEN DEN PREIS HOCH,';
    L[8] = 'DEINE VERKAEUFE DRUECKEN IHN.';
    L[10] = '1-5 WARE WAEHLEN   B/V  1 STUECK';
    L[11] = 'M = MAXIMAL KAUFEN (100 FAHRGELD BLEIBT)';
    L[12] = 'A = ALLES VERKAUFEN';
    L[13] = 'R = REISE (KOSTET FAHRGELD, 1 TAG)';
    L[14] = 'L = TELEX-AUFTRAG LIEFERN';
    L[15] = 'K = KREDIT +1000   T = 500 TILGEN';
    L[16] = `U = LAGER +10 (${FH_UPGRADE_COST}, MAX ${FH_MAX_HOLD})`;
    L[17] = 'I = INTRO   RUN/STOP = ENDE';
    L[21] = centered('TASTE DRUECKEN');
    colors[0] = 7;
    return { lines: L, border: 9, colors };
  }
  L[0] = `FERNHANDEL   TAG ${String(g.day).padStart(2, '0')}/${FH_DAYS}  ${FH_CITIES[g.city]}`;
  colors[0] = 7;
  if (g.mode === 'travel') {
    L[2] = 'WOHIN? (R = ZURUECK)';
    FH_CITIES.forEach((c, i) => {
      L[4 + i] = i === g.city ? `   ${c}  (HIER)` : ` ${i + 1} ${c.padEnd(10)} FAHRGELD ${fare(g.city, i)}`;
    });
    L[11] = `KASSE: ${g.cash}`;
    if (g.order) L[13] = `AUFTRAG: ${g.order.qty} ${FH_GOODS[g.order.good]} NACH ${FH_CITIES[g.order.city]}`;
    colors[2] = 1;
    return { lines: L, border: 6, colors };
  }
  L[1] = `KASSE ${num(g.cash, 6)}   SCHULDEN ${num(g.debt, 5)}`;
  L[2] = `LAGER ${holdUsed(g)}/${g.capacity}`;
  L[4] = ' NR WARE      PREIS   IM LAGER';
  colors[4] = 15;
  FH_GOODS.forEach((n, i) => {
    L[5 + i] = `${i === g.sel ? '>' : ' '}${i + 1}  ${n.padEnd(9)}${num(price(g, i), 6)}${num(g.hold[i], 9)}`;
    if (i === g.sel) colors[5 + i] = 1;
  });
  if (g.order) {
    const o = g.order;
    L[11] = `TELEX: ${o.qty} ${FH_GOODS[o.good]} NACH ${FH_CITIES[o.city]}`;
    L[12] = `BIS TAG ${o.deadline}, PRAEMIE ${o.reward}`;
    colors[11] = 7;
  }
  wrap(g.msg, 14);
  colors[14] = 5;
  L[19] = 'B/V KAUF/VERK  M/A MAX/ALLES  1-5 WARE';
  L[20] = 'R REISE  L LIEFERN  K/T KREDIT/TILGEN';
  L[21] = 'U LAGER+10  H HILFE  I INTRO';
  L[22] = 'RUN/STOP = ENDE';
  colors[19] = 15;
  return { lines: L, border: 6, colors };
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
    if (app.phase === 'play') return playKey(ctx, app, key);
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
  render(state, app) {
    const bestFlag = state.flags.fernhandelBest;
    const best = typeof bestFlag === 'number' ? String(Math.round(bestFlag)).padStart(6, '0') : '------';
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
        L[7] = centered(G.genre);
        L[8] = centered('(ARBEITSTITEL)');
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
        L[13] = centered(`DEIN BESTER: ${best}`);
        colors[4] = 5;
        border = 11;
        break;
      case 'play': {
        const r = renderGame(app.game ?? newGame(1986));
        return { lines: r.lines, border: r.border, background: 0, text: 14, lineColors: r.colors };
      }
    }
    return { lines: L, border, background: 0, text: 14, flash, lineColors: colors };
  },
};

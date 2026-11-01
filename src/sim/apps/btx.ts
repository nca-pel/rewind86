/**
 * BTX-Decoder (Bildschirmtext, Ausbauplan Punkt 7): Steckmodul im Modulschacht des C64 samt Postmodem.
 * Startet beim Einschalten bzw. Reset von selbst (wie ein Steckmodul). Die Verbindung läuft als Datenanruf über die
 * Hausleitung (Gebühren, Leitung belegt); es gibt nur das fiktive Angebot aus content/btx.ts.
 */
import { BTX_BY_ID, type BtxPage } from '../../content/btx';
import { GAME_CONFIG } from '../../content/config';
import { houseLineBusy } from '../../engine/conditions';
import type { Ctx } from '../../engine/context';
import { discoverFact, setPuzzle } from '../../engine/effects';
import type { AppState } from '../../engine/types';
import { centered } from '../screen';
import type { AppDef } from './types';

type Screen = 'start' | 'page';

export interface BtxState extends AppState {
  id: 'btx';
  screen: Screen;
  note: string | null;
  page: string;
  part: number;
  /** Eingabepuffer (»*123200«) */
  buf: string;
}

const B = GAME_CONFIG.btx;

/** Verbindung beenden (Modul, Telefon abgehoben, Zeitblock): Leitung frei, Anruf beendet */
export function btxDropCarrier(ctx: Ctx, note = 'VERBINDUNG GETRENNT'): void {
  const t = ctx.state.telecom;
  if (t.connectedSystemId !== 'btx') return;
  t.connectedSystemId = null;
  t.currentUserHandle = null;
  if (t.call?.with === 'btx') t.call = null;
  const app = ctx.state.computer.app;
  if (app && app.id === 'btx') {
    const a = app as BtxState;
    a.screen = 'start';
    a.note = note;
    a.buf = '';
  }
}

function connect(ctx: Ctx, app: BtxState): number {
  const s = ctx.state;
  const t = s.telecom;
  if (t.handset !== 'cradle') {
    app.note = 'TELEFON ABGEHOBEN - AUFLEGEN!';
    return 0;
  }
  if (t.ringing) {
    app.note = 'LEITUNG: ANRUF KOMMT HEREIN';
    return 0;
  }
  if (houseLineBusy(s)) {
    app.note = 'LEITUNG BELEGT (HAUS)';
    return 0;
  }
  t.connectedSystemId = 'btx';
  t.currentUserHandle = null;
  t.call = {
    kind: 'carrier',
    with: 'btx',
    number: B.accessNumber,
    startedAt: s.gameClock,
    unitsCharged: 0,
    outgoing: true,
  };
  ctx.cue('modem');
  ctx.say(
    'Das Postmodem wählt von allein und rauscht kurz. Dann baut sich auf dem Monitor eine bunte Seite auf – Zeile für Zeile, und auf 1200 Baud spürbar langsamer als alles, was du vom Textmodus kennst.',
  );
  app.screen = 'page';
  app.page = B.overviewPage;
  app.part = 0;
  app.buf = '';
  app.note = null;
  discoverFact(ctx, 'btx_howto');
  setPuzzle(ctx, 'P17', 'discovered');
  return 1;
}

/** Seite aufrufen; false = gibt es nicht */
function go(ctx: Ctx, app: BtxState, id: string): number {
  const page = BTX_BY_ID[id];
  app.buf = '';
  if (!page) {
    app.note = `SEITE *${id}# NICHT VORHANDEN`;
    return 1;
  }
  app.page = id;
  app.part = 0;
  app.note = null;
  if (!page.free) {
    const s = ctx.state;
    s.phoneCostsDm = Math.round((s.phoneCostsDm + B.pageFeeDm) * 100) / 100;
  }
  const factId = page.fact?.(ctx.state);
  if (factId) discoverFact(ctx, factId);
  if (id === B.clubBoardPage) setPuzzle(ctx, 'P17', 'solved');
  return 1;
}

function currentPage(app: BtxState): BtxPage {
  return BTX_BY_ID[app.page] ?? BTX_BY_ID[B.overviewPage];
}

export const btxApp: AppDef<BtxState> = {
  id: 'btx',
  tickMs: null,
  start() {
    return { id: 'btx', screen: 'start', note: null, page: B.overviewPage, part: 0, buf: '' };
  },
  key(ctx, app, key) {
    const k = key.toUpperCase();
    const online = ctx.state.telecom.connectedSystemId === 'btx';
    if (!online && app.screen === 'page') {
      // Verbindung wurde von außen beendet (Telefon abgehoben, Zeitblock)
      app.screen = 'start';
      app.note = 'VERBINDUNG GETRENNT';
    }
    if (app.screen === 'start') {
      if (k === 'RETURN') return { minutes: connect(ctx, app) };
      if (k === 'RUNSTOP') return { exit: true };
      return {};
    }
    const page = currentPage(app);
    if (k === 'RUNSTOP') {
      btxDropCarrier(ctx, 'VERBINDUNG BEENDET');
      ctx.say('Das Postmodem legt auf. Die Leitung ist wieder frei.');
      return { minutes: 1 };
    }
    if (k === 'DEL') {
      app.buf = app.buf.slice(0, -1);
      return {};
    }
    if (k === '*') {
      app.buf = '*';
      app.note = null;
      return {};
    }
    if (k === '#') {
      if (app.buf.startsWith('*')) {
        const target = app.buf.slice(1);
        if (target) return { minutes: go(ctx, app, target) };
        app.buf = '';
        return {};
      }
      const parts = page.parts(ctx.state);
      if (app.part + 1 < parts.length) {
        app.part++;
        app.note = null;
        return { minutes: 1 };
      }
      app.note = 'KEINE FOLGESEITE';
      return {};
    }
    if (/^\d$/.test(k)) {
      if (app.buf.startsWith('*')) {
        if (app.buf.length < 9) app.buf += k;
        return {};
      }
      const target = page.links[k] ?? (k === '0' ? B.overviewPage : undefined);
      if (target) return { minutes: go(ctx, app, target) };
      app.note = 'KEINE AUSWAHL MOEGLICH';
      return {};
    }
    return {};
  },
  inputMode: () => 'keys',
  render(state, app) {
    const L: string[] = [];
    const colors: Record<number, number> = {};
    const online = state.telecom.connectedSystemId === 'btx';
    const screen = !online && app.screen === 'page' ? 'start' : app.screen;
    const note = !online && app.screen === 'page' ? 'VERBINDUNG GETRENNT' : app.note;
    if (screen === 'start') {
      L.push(
        centered('BTX-DECODER'),
        centered('FUER BILDSCHIRMTEXT'),
        '',
        `TEILNEHMER : COMPUTERCLUB WD-86`,
        `ZUGANG     : ${B.accessNumber}  (1200/75 BAUD)`,
        '',
        'RETURN = VERBINDUNG HERSTELLEN',
        'RUN/STOP = ZURUECK ZU BASIC',
      );
      colors[0] = 7;
    } else {
      const page = currentPage(app);
      const parts = page.parts(state);
      const part = parts[Math.min(app.part, parts.length - 1)];
      L.push(`BTX  ${page.title}`.slice(0, 40), `*${page.id}#   CLUB-KENNUNG WD-86`, '');
      L.push(...part);
      if (parts.length > 1) L.push('', `SEITE ${app.part + 1}/${parts.length}  (# = BLAETTERN)`);
      colors[0] = 7;
      colors[1] = 3;
    }
    if (note) {
      L.push('', note);
      colors[L.length - 1] = 2;
    }
    if (screen === 'page') {
      while (L.length < 23) L.push('');
      L.push(app.buf ? `> ${app.buf}` : '> *NUMMER#  0=UEBERSICHT  STOP=ENDE');
      colors[L.length - 1] = 5;
    }
    return { lines: L, border: 0, background: 0, text: 1, lineColors: colors, cursor: false };
  },
};

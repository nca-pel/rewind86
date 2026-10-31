/**
 * Das versteckte Kommunikationsmodul auf Diskette 1 ("MODUL K", Name = Platzhalter).
 * Ohne Diskette 2 nur eingeschränkter Betrieb – aber der erste Netzkontakt ist möglich (GDD §7.5).
 */
import { GAME_CONFIG } from '../../content/config';
import { MAILBOXES } from '../../content/networks';
import type { Ctx } from '../../engine/context';
import { applyEffects, discoverFact, scheduleEvent, setPuzzle } from '../../engine/effects';
import type { AppState } from '../../engine/types';
import { centered } from '../screen';
import { pad, type AppDef } from './types';

type Screen = 'insert' | 'nokey' | 'menu' | 'status' | 'dial' | 'online' | 'list' | 'read' | 'sys';

export interface ModkState extends AppState {
  id: 'modk';
  screen: Screen;
  note: string | null;
  msg: number;
}

const N = GAME_CONFIG.secretNetwork;

export function modkDropCarrier(ctx: Ctx): void {
  const app = ctx.state.computer.app;
  if (app && app.id === 'modk') {
    const m = app as ModkState;
    m.screen = 'menu';
    m.note = 'NO CARRIER';
  }
}

function tryConnect(ctx: Ctx, app: ModkState): number {
  const t = ctx.state.telecom;
  if (t.handset === 'coupler' && t.call?.kind === 'carrier' && t.call.with) {
    const box = MAILBOXES[t.call.with];
    t.connectedSystemId = box.id;
    t.currentUserHandle = box.autoHandle;
    app.screen = 'online';
    app.note = null;
    ctx.cue('modem');
    ctx.say('[Modemton – dann Stille. Zeichen für Zeichen tröpfeln über den Bildschirm.]', 'caption');
    if (!ctx.state.flags.firstOnline) {
      ctx.state.flags.firstOnline = true;
      ctx.say(
        'Du bist drin. Dein Herz klopft bis zum Hals – mit 300 Baud in einem fremden System.',
        'thought',
      );
      discoverFact(ctx, 'secret_mailbox');
      setPuzzle(ctx, 'P05', 'solved');
      setPuzzle(ctx, 'P06', 'discovered');
      scheduleEvent(ctx, 'ev_mother_modem', 4);
      ctx.state.relationships.networkCredibility = Math.min(
        100,
        ctx.state.relationships.networkCredibility + 1,
      );
    }
    return 1;
  }
  app.note = t.handset !== 'coupler' ? 'KEIN TRAEGER - KOPPLER?' : 'KEIN TRAEGER (NO CARRIER)';
  return 0;
}

function logoff(ctx: Ctx, app: ModkState): void {
  const t = ctx.state.telecom;
  t.connectedSystemId = null;
  t.currentUserHandle = null;
  if (t.call?.kind === 'carrier') t.call.kind = 'dead';
  app.screen = 'menu';
  app.note = 'VERBINDUNG BEENDET';
  ctx.say(
    'Die Gegenstelle legt auf. Aus dem Koppler tutet nur noch das Besetztzeichen – du solltest auflegen.',
  );
  const read = ctx.state.telecom.messageReadIds;
  if (MAILBOXES.secret.messages.every((m) => read.includes(m.id))) setPuzzle(ctx, 'P06', 'solved');
}

export const modkApp: AppDef<ModkState> = {
  id: 'modk',
  tickMs: null,
  start() {
    return { id: 'modk', screen: 'insert', note: null, msg: 0 };
  },
  key(ctx, app, key) {
    const k = key.toUpperCase();
    const online = ctx.state.telecom.connectedSystemId !== null;
    switch (app.screen) {
      case 'insert':
        if (k === 'RETURN') {
          const inDrive = Object.entries(ctx.state.itemLocations).find(([, l]) => l === 'drive')?.[0];
          if (inDrive === 'disk_key') {
            // TODO-STORY: Verhalten mit echter Schlüsseldiskette offen (GDD §7.5)
            app.note = 'SCHLUESSEL ERKANNT (TODO-STORY)';
            return {};
          }
          app.screen = 'nokey';
          if (!ctx.state.knownFacts.includes('needs_disk2')) {
            ctx.say(
              'Diskette 2? Ralf hat dir nur eine gegeben. Auf dem Etikett stand ja »DISK 1« …',
              'thought',
            );
            discoverFact(ctx, 'needs_disk2');
          }
        } else if (k === 'RUNSTOP') return { exit: true };
        return {};
      case 'nokey':
        if (k === 'J') app.screen = 'menu';
        else if (k === 'N') app.screen = 'insert';
        else if (k === 'RUNSTOP') return { exit: true };
        return {};
      case 'menu':
        app.note = null;
        if (k === '1') {
          app.screen = 'dial';
          if (!ctx.state.knownFacts.includes('loader_hint')) {
            discoverFact(ctx, 'loader_hint');
            setPuzzle(ctx, 'P04', 'discovered');
            setPuzzle(ctx, 'P05', 'discovered');
          }
        } else if (k === '2') {
          app.screen = 'status';
          discoverFact(ctx, 'test_handle');
        } else if (k === '3' || k === 'RUNSTOP') return { exit: true };
        return {};
      case 'status':
        app.screen = 'menu';
        return {};
      case 'dial':
        if (k === 'RETURN') return { minutes: tryConnect(ctx, app) };
        if (k === 'RUNSTOP') {
          app.screen = 'menu';
          app.note = null;
        }
        return {};
      case 'online':
        if (!online) {
          app.screen = 'menu';
          app.note = 'NO CARRIER';
          return {};
        }
        if (k === '1') app.screen = 'list';
        else if (k === '2') app.note = 'GESPERRT: SCHLUESSEL FEHLT';
        else if (k === '3') {
          app.screen = 'sys';
          applyEffects(ctx, MAILBOXES.secret.sysinfoEffects);
        } else if (k === '4') logoff(ctx, app);
        else if (k === 'RUNSTOP') app.note = 'ERST ABMELDEN (4)';
        else return {};
        return { minutes: 1 };
      case 'list': {
        const msgs = MAILBOXES.secret.messages;
        const n = parseInt(k, 10);
        if (n >= 1 && n <= msgs.length) {
          app.msg = n - 1;
          app.screen = 'read';
          const m = msgs[n - 1];
          if (!ctx.state.telecom.messageReadIds.includes(m.id)) {
            ctx.state.telecom.messageReadIds.push(m.id);
            applyEffects(ctx, m.effects);
            if (m.encrypted)
              ctx.say('Lauter Buchstabensalat in Fünfergruppen. Ohne Schlüssel keine Chance.', 'thought');
            else
              ctx.say(
                `»${GAME_CONFIG.unreleasedGame.buildCode}« – das steht auf Ralfs Diskette! Dieses Netz und das Spiel von Ralfs Stiefvater gehören zusammen.`,
                'thought',
              );
          }
          return { minutes: 1 };
        }
        if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'online';
        return {};
      }
      case 'read':
        app.screen = 'list';
        return {};
      case 'sys':
        app.screen = 'online';
        return {};
    }
    return {};
  },
  inputMode: () => 'keys',
  render(state, app) {
    const L: string[] = [];
    const head = `** ${N.moduleName} ** V0.7`;
    const colors: Record<number, number> = { 0: 1 };
    switch (app.screen) {
      case 'insert':
        L.push(head, '', 'SCHLUESSELDISKETTE (2)', 'IN LAUFWERK 8 EINLEGEN.', '', 'WEITER: RETURN');
        break;
      case 'nokey':
        L.push(head, '', '?SCHLUESSEL NICHT GEFUNDEN', '', 'EINGESCHRAENKTER BETRIEB?', '', '(J/N)');
        colors[2] = 2;
        break;
      case 'menu':
        L.push(
          head,
          'EINGESCHRAENKTER BETRIEB',
          `KENNUNG: ${N.testHandle}`,
          '',
          ' 1  VERBINDUNG HERSTELLEN',
          ' 2  KENNUNG / STATUS',
          ' 3  ENDE',
        );
        break;
      case 'status':
        L.push(
          head,
          '',
          `KENNUNG  : ${N.testHandle}`,
          'TYP      : TESTZUGANG',
          'SCHLUESS.: FEHLT (DISK 2)',
          'RECHTE   : NUR LESEN',
          '',
          'TASTE = ZURUECK',
        );
        break;
      case 'dial':
        L.push(
          head,
          '',
          'WAHLDATEN: AUF DISK 2',
          'ERSATZWAHL: SIEHE LADER',
          '',
          'NUMMER AM TELEFON WAEHLEN,',
          'HOERER IN DEN KOPPLER,',
          'DANN: RETURN',
          '',
          'RUN/STOP = ZURUECK',
        );
        break;
      case 'online':
        L.push(
          `VERBUNDEN - ${MAILBOXES.secret.baud} BAUD`,
          '========================================',
          centered(`${MAILBOXES.secret.name}`),
          '========================================',
          `ANMELDUNG ${N.testHandle} ... OK`,
          'ZUGANG: EINGESCHRAENKT',
          '',
          ' 1  NACHRICHTEN',
          ' 2  NACHRICHT SENDEN',
          ' 3  SYSTEM',
          ' 4  ABMELDEN',
        );
        colors[2] = 7;
        break;
      case 'list':
        L.push('NACHRICHTEN', '----------------------------------------');
        MAILBOXES.secret.messages.forEach((m, i) => {
          const read = state.telecom.messageReadIds.includes(m.id) ? ' ' : '*';
          L.push(`${read}${i + 1} ${pad(m.from, 6)}> ${pad(m.to, 6)} ${m.subject}`.slice(0, 40));
        });
        L.push('', 'NUMMER = LESEN   RETURN = ZURUECK');
        break;
      case 'read': {
        const m = MAILBOXES.secret.messages[app.msg];
        L.push(
          `VON: ${m.from}   AN: ${m.to}`,
          `BETR: ${m.subject}`,
          '----------------------------------------',
          ...m.body,
          '',
          'TASTE = ZURUECK',
        );
        break;
      }
      case 'sys':
        L.push('SYSTEMINFORMATION', '', ...MAILBOXES.secret.sysinfo, '', 'TASTE = ZURUECK');
        break;
    }
    if (app.note) {
      L.push('', app.note);
      colors[L.length - 1] = 2;
    }
    return { lines: L, border: 0, background: 0, text: 5, lineColors: colors, cursor: true };
  },
};

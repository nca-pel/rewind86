/**
 * TERMINAL – Jans normales Terminalprogramm für reguläre Mailboxen (auf der Archivdiskette).
 * Menüs per Taste, Namen/Betreff/Text per Zeileneingabe. Die Mailbox-Logik steckt in engine/bbs.ts.
 * Die geheime Mailbox lässt sich hiermit nicht bedienen – dafür braucht es das Modul.
 */
import { MAILBOXES, type MailboxSystem } from '../../content/networks';
import {
  MAX_BODY_LINES,
  boardEntries,
  download,
  inbox,
  isRead,
  knownHandles,
  login,
  markRead,
  post,
  register,
  sendMail,
  sessionStatus,
  validHandle,
  visibleBoards,
  type BoardEntry,
} from '../../engine/bbs';
import type { Ctx } from '../../engine/context';
import { crackerOpen, crackerSay } from '../../engine/cracker';
import { lockNote, lockedUntil } from '../../engine/pressure';
import type { AppState, GameState, StoredMessage } from '../../engine/types';
import { centered, toPetsciiText } from '../screen';
import { pad, type AppDef, type AppResult } from './types';

type Screen =
  | 'offline'
  | 'login'
  | 'newuser'
  | 'main'
  | 'boards'
  | 'board'
  | 'mail'
  | 'files'
  | 'info'
  | 'read'
  | 'to'
  | 'subject'
  | 'body'
  | 'chat';

export interface TermState extends AppState {
  id: 'term';
  screen: Screen;
  note: string | null;
  /** Bei 'newuser': gewünschtes Handle */
  pendingHandle: string | null;
  board: string | null;
  /** Gelesene Nachricht: Liste, aus der sie kam, und Index */
  readFrom: 'board' | 'mail';
  msg: number;
  draft: { to: string | null; subject: string; body: string[] } | null;
  /** Verlauf des Chats (fertig umbrochene Zeilen, nur Bildschirm) */
  chat?: string[];
}

const LINE_SCREENS: Screen[] = ['login', 'to', 'subject', 'body', 'chat'];
const CHAT_LOG_MAX = 60;

function chatPush(app: TermState, lines: string[]): void {
  app.chat = [...(app.chat ?? []), ...lines].slice(-CHAT_LOG_MAX);
}
const STATUS_LABEL = { gast: 'GAST', neu: 'NEU (NICHT FREIGESCHALTET)', mitglied: 'MITGLIED' };

function connected(state: GameState): MailboxSystem | null {
  const id = state.telecom.connectedSystemId;
  const sys = id ? MAILBOXES[id] : null;
  return sys && sys.access === 'public' ? sys : null;
}

/** Verbindung weg (Hörer raus, aufgelegt): zurück in den Offline-Bildschirm */
export function termDropCarrier(ctx: Ctx): void {
  const app = ctx.state.computer.app;
  if (app && app.id === 'term') {
    const t = app as TermState;
    if (t.screen !== 'offline') {
      t.screen = 'offline';
      t.note = 'NO CARRIER';
      t.draft = null;
    }
  }
}

function tryConnect(ctx: Ctx, app: TermState): number {
  const t = ctx.state.telecom;
  if (t.handset !== 'coupler' || t.call?.kind !== 'carrier' || !t.call.with) {
    app.note = t.handset !== 'coupler' ? 'KEIN TRAEGER - KOPPLER?' : 'KEIN TRAEGER (NO CARRIER)';
    return 0;
  }
  const sys = MAILBOXES[t.call.with];
  if (sys.access !== 'public') {
    app.note = 'UNBEKANNTES PROTOKOLL - ABBRUCH';
    ctx.say(
      'Auf dem Bildschirm erscheint nur Zeichensalat, dann bricht das Terminalprogramm ab. Mit einem normalen Terminal kommt man hier offenbar nicht hinein.',
      'thought',
    );
    return 1;
  }
  t.connectedSystemId = sys.id;
  t.currentUserHandle = null;
  app.screen = 'login';
  app.note = null;
  ctx.cue('modem');
  ctx.say(`[Modemton – dann baut sich zeilenweise die Begrüßung von ${sys.name} auf.]`, 'caption');
  return 1;
}

function logoff(ctx: Ctx, app: TermState, sys: MailboxSystem): void {
  const t = ctx.state.telecom;
  t.connectedSystemId = null;
  t.currentUserHandle = null;
  if (t.call?.kind === 'carrier') t.call.kind = 'dead';
  app.screen = 'offline';
  app.note = 'VERBINDUNG BEENDET';
  app.draft = null;
  ctx.say(`${sys.name} verabschiedet sich und legt auf. Aus dem Koppler tutet es – Zeit aufzulegen.`);
}

function entries(state: GameState, sys: MailboxSystem, app: TermState): BoardEntry[] {
  const board = sys.boards.find((b) => b.id === app.board);
  return board ? boardEntries(state, sys.id, board) : [];
}

function cleanLine(text: string, max: number): string {
  return toPetsciiText(text).trim().slice(0, max);
}

function needMember(ctx: Ctx, app: TermState, sys: MailboxSystem): boolean {
  const st = sessionStatus(ctx.state, sys.id);
  if (st === 'mitglied') return true;
  app.note = st === 'neu' ? 'NOCH NICHT FREIGESCHALTET' : 'NUR FUER MITGLIEDER';
  return false;
}

function onLine(ctx: Ctx, app: TermState, raw: string): AppResult {
  const sys = connected(ctx.state);
  if (!sys) {
    termDropCarrier(ctx);
    return {};
  }
  app.note = null;
  switch (app.screen) {
    case 'login': {
      const text = cleanLine(raw, 12);
      if (text === '' || text === 'GAST') {
        login(ctx, sys.id, null);
        app.screen = 'main';
        return { minutes: 1 };
      }
      const handle = validHandle(text);
      if (!handle) {
        app.note = '2-10 ZEICHEN: A-Z, 0-9, -';
        return {};
      }
      const acc = ctx.state.telecom.bbs[sys.id];
      if (acc && acc.handle === handle) {
        const until = lockedUntil(ctx.state, sys.id);
        if (until) {
          app.note = lockNote(until);
          return {};
        }
        const before = acc.status;
        login(ctx, sys.id, handle);
        app.screen = 'main';
        if (before === 'neu' && acc.status === 'mitglied')
          ctx.say(
            sys.memberMail
              ? 'Freigeschaltet! Im Postfach wartet eine Nachricht vom Sysop.'
              : 'Freigeschaltet! Jetzt darfst du auch schreiben und Post verschicken.',
            'thought',
          );
        return { minutes: 1 };
      }
      if (acc) {
        app.note = `UNBEKANNT. DU BIST HIER ${acc.handle}`;
        return {};
      }
      if (knownHandles(sys).includes(handle)) {
        app.note = 'NAME SCHON VERGEBEN';
        return {};
      }
      app.pendingHandle = handle;
      app.screen = 'newuser';
      return {};
    }
    case 'chat': {
      const text = cleanLine(raw, 60);
      if (!text) return {};
      chatPush(app, [`${ctx.state.telecom.currentUserHandle ?? 'GAST'}> ${text}`.slice(0, 40)]);
      const r = crackerSay(ctx, text);
      chatPush(app, r.lines);
      if (r.end) {
        app.screen = 'main';
        app.note = 'RASTAR HAT DEN CHAT BEENDET';
      }
      return { minutes: 1 };
    }
    case 'to': {
      const to = cleanLine(raw, 12);
      if (!to) {
        app.screen = 'mail';
        app.draft = null;
        return {};
      }
      if (!knownHandles(sys).includes(to)) {
        app.note = 'EMPFAENGER UNBEKANNT';
        return {};
      }
      app.draft = { to, subject: '', body: [] };
      app.screen = 'subject';
      return {};
    }
    case 'subject': {
      const subject = cleanLine(raw, 24);
      if (!subject) {
        app.note = 'BETREFF FEHLT';
        return {};
      }
      app.draft = { to: app.draft?.to ?? null, subject, body: [] };
      app.screen = 'body';
      return {};
    }
    case 'body': {
      const draft = app.draft!;
      const line = cleanLine(raw, 38);
      if (line && draft.body.length < MAX_BODY_LINES) {
        draft.body.push(line);
        if (draft.body.length < MAX_BODY_LINES) return {};
      }
      if (draft.body.length === 0) {
        app.note = 'TEXT FEHLT (LEERE ZEILE = SENDEN)';
        return {};
      }
      const ok = draft.to
        ? sendMail(ctx, sys.id, draft.to, draft.subject, draft.body)
        : post(ctx, sys.id, app.board!, draft.subject, draft.body);
      app.screen = draft.to ? 'mail' : 'board';
      app.note = ok ? 'GESENDET.' : 'SENDEN FEHLGESCHLAGEN';
      app.draft = null;
      return { minutes: 2 };
    }
  }
  return {};
}

function onKey(ctx: Ctx, app: TermState, key: string): AppResult {
  const k = key.toUpperCase();
  if (app.screen === 'offline') {
    if (k === 'RETURN') return { minutes: tryConnect(ctx, app) };
    if (k === 'RUNSTOP') return { exit: true };
    return {};
  }
  const sys = connected(ctx.state);
  if (!sys) {
    termDropCarrier(ctx);
    return {};
  }
  if (LINE_SCREENS.includes(app.screen)) {
    // Zeilenmodus: RUN/STOP bricht ab
    if (k === 'RUNSTOP') {
      if (app.screen === 'login') return {};
      if (app.screen === 'chat') {
        app.screen = 'main';
        app.note = 'CHAT VERLASSEN';
        return {};
      }
      app.screen = app.draft && app.draft.to !== null ? 'mail' : 'board';
      app.draft = null;
      app.note = 'ABGEBROCHEN';
    }
    return {};
  }
  const n = parseInt(k, 10);
  app.note = null;
  switch (app.screen) {
    case 'newuser':
      if (k === 'J') {
        register(ctx, sys.id, app.pendingHandle!);
        login(ctx, sys.id, app.pendingHandle);
        app.note = 'ANGEMELDET. FREISCHALTUNG FOLGT.';
        app.screen = 'main';
        ctx.say(
          `Du bist jetzt »${app.pendingHandle}« im ${sys.name}. Bis der Sysop dich freischaltet, darfst du nur lesen.`,
          'thought',
        );
        return { minutes: 1 };
      }
      if (k === 'N') app.screen = 'login';
      return {};
    case 'main':
      if (k === '1') app.screen = 'boards';
      else if (k === '2') app.screen = 'mail';
      else if (k === '3') app.screen = 'files';
      else if (k === '4') {
        app.screen = 'info';
        markRead(ctx, `${sys.id}-sysinfo`, sys.sysinfoEffects);
      } else if (k === '5') {
        logoff(ctx, app, sys);
        return { minutes: 1 };
      } else if (k === '6' && sys.chat) {
        app.screen = 'chat';
        app.chat = [];
        chatPush(app, crackerOpen(ctx, ctx.state.telecom.currentUserHandle ?? '').lines);
        return { minutes: 1 };
      } else if (k === 'RUNSTOP') app.note = 'ERST ABMELDEN (5)';
      return {};
    case 'boards': {
      const boards = visibleBoards(sys, sessionStatus(ctx.state, sys.id));
      if (n >= 1 && n <= boards.length) {
        app.board = boards[n - 1].id;
        app.screen = 'board';
      } else if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'main';
      return {};
    }
    case 'board': {
      const list = entries(ctx.state, sys, app);
      if (n >= 1 && n <= Math.min(9, list.length)) {
        const e = list[n - 1];
        markRead(ctx, e.msg.id, e.kind === 'content' ? e.msg.effects : undefined);
        app.msg = n - 1;
        app.readFrom = 'board';
        app.screen = 'read';
        return { minutes: 1 };
      }
      if (k === 'S' && needMember(ctx, app, sys)) {
        app.draft = { to: null, subject: '', body: [] };
        app.screen = 'subject';
      } else if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'boards';
      return {};
    }
    case 'mail': {
      const list = inbox(ctx.state, sys.id);
      if (n >= 1 && n <= Math.min(9, list.length)) {
        markRead(ctx, list[n - 1].id);
        app.msg = n - 1;
        app.readFrom = 'mail';
        app.screen = 'read';
        return { minutes: 1 };
      }
      if (k === 'S' && needMember(ctx, app, sys)) {
        app.draft = { to: '', subject: '', body: [] };
        app.screen = 'to';
      } else if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'main';
      return {};
    }
    case 'files': {
      if (n >= 1 && n <= sys.downloads.length) {
        if (!needMember(ctx, app, sys)) return {};
        const r = download(ctx, sys.id, sys.downloads[n - 1].name);
        if (r.ok) {
          app.note = `${sys.downloads[n - 1].name}: OK`;
          ctx.say(
            `Die 1541 surrt. ${sys.downloads[n - 1].name} liegt jetzt auf der Diskette im Laufwerk (LOAD"${sys.downloads[n - 1].name}",8).`,
          );
          return { minutes: r.minutes };
        }
        app.note = {
          status: 'NUR FUER MITGLIEDER',
          nodisk: 'KEINE DISKETTE IM LAUFWERK',
          protected: 'DISKETTE SCHREIBGESCHUETZT',
          full: 'DISKETTE VOLL',
          exists: 'DATEI SCHON VORHANDEN',
        }[r.reason];
        return {};
      }
      if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'main';
      return {};
    }
    case 'info':
      app.screen = 'main';
      return {};
    case 'read':
      app.screen = app.readFrom;
      return {};
  }
  return {};
}

function readView(
  state: GameState,
  sys: MailboxSystem,
  app: TermState,
): { from: string; to: string; subject: string; body: string[] } | null {
  if (app.readFrom === 'mail') {
    const m: StoredMessage | undefined = inbox(state, sys.id)[app.msg];
    return m ?? null;
  }
  const e = entries(state, sys, app)[app.msg];
  return e ? e.msg : null;
}

export const termApp: AppDef<TermState> = {
  id: 'term',
  tickMs: null,
  start() {
    return {
      id: 'term',
      screen: 'offline',
      note: null,
      pendingHandle: null,
      board: null,
      readFrom: 'board',
      msg: 0,
      draft: null,
    };
  },
  key: (ctx, app, key) => onKey(ctx, app, key),
  line: (ctx, app, text) => onLine(ctx, app, text),
  inputMode: (app) => (LINE_SCREENS.includes(app.screen) ? 'line' : 'keys'),
  render(state, app) {
    const L: string[] = [];
    const colors: Record<number, number> = { 0: 1 };
    const sys = connected(state);
    const screen = sys || app.screen === 'offline' ? app.screen : 'offline';
    const status = sys ? sessionStatus(state, sys.id) : 'gast';
    const who = state.telecom.currentUserHandle ?? '';
    const head = sys ? `${sys.name} - ${who || '...'}` : 'TERMINAL V1.2  (300 BAUD)';
    switch (screen) {
      case 'offline':
        L.push(
          head,
          '',
          'NUMMER AM TELEFON WAEHLEN,',
          'AUF DEN PFEIFTON WARTEN,',
          'HOERER IN DEN KOPPLER,',
          'DANN: RETURN',
          '',
          'RUN/STOP = ENDE',
        );
        break;
      case 'login':
        L.push(
          `VERBUNDEN - ${sys!.baud} BAUD`,
          '========================================',
          ...sys!.welcome.map(centered),
          '========================================',
          '',
          'DEIN NAME (ODER GAST):',
        );
        colors[2] = 7;
        break;
      case 'newuser':
        L.push(head, '', `"${app.pendingHandle}" IST NEU HIER.`, '', 'ALS NEUER BENUTZER ANMELDEN? (J/N)');
        break;
      case 'main': {
        const mails = inbox(state, sys!.id).filter((m) => !isRead(state, m.id)).length;
        L.push(
          head,
          `STATUS: ${STATUS_LABEL[status]}`,
          '',
          ' 1  BRETTER',
          ` 2  POST${mails ? ` (${mails} NEU)` : ''}`,
          ' 3  DATEIEN',
          ' 4  SYSTEMINFO',
          ' 5  ABMELDEN',
          ...(sys!.chat ? [` 6  CHAT MIT ${sys!.chat.handle}`] : []),
        );
        break;
      }
      case 'boards':
        L.push(head, 'BRETTER', '----------------------------------------');
        visibleBoards(sys!, status).forEach((b, i) => {
          const fresh = boardEntries(state, sys!.id, b).filter((e) => !isRead(state, e.msg.id)).length;
          L.push(` ${i + 1}  ${pad(b.name, 20)}${fresh ? `${fresh} NEU` : ''}`);
        });
        L.push('', 'NUMMER = OEFFNEN   RETURN = ZURUECK');
        break;
      case 'board': {
        const board = sys!.boards.find((b) => b.id === app.board);
        L.push(head, `BRETT ${board?.name ?? '?'}`, '----------------------------------------');
        entries(state, sys!, app)
          .slice(0, 9)
          .forEach((e, i) => {
            const mark = isRead(state, e.msg.id) ? ' ' : '*';
            L.push(`${mark}${i + 1} ${pad(e.msg.from, 8)} ${e.msg.subject}`.slice(0, 40));
          });
        L.push('', 'NUMMER = LESEN  S = SCHREIBEN', 'RETURN = ZURUECK');
        break;
      }
      case 'mail': {
        L.push(head, 'POSTFACH', '----------------------------------------');
        const list = inbox(state, sys!.id).slice(0, 9);
        if (!list.length) L.push('(KEINE POST)');
        list.forEach((m, i) => {
          const mark = isRead(state, m.id) ? ' ' : '*';
          L.push(`${mark}${i + 1} ${pad(m.from, 8)} ${m.subject}`.slice(0, 40));
        });
        L.push('', 'NUMMER = LESEN  S = SCHREIBEN', 'RETURN = ZURUECK');
        break;
      }
      case 'files':
        L.push(head, 'DATEIEN (DOWNLOAD AUF LAUFWERK 8)', '----------------------------------------');
        if (!sys!.downloads.length) L.push('(KEINE DATEIEN)');
        sys!.downloads.forEach((d, i) => {
          L.push(` ${i + 1}  ${pad(d.name, 13)} ${String(d.blocks).padStart(3)} BL.`);
          L.push(`    ${d.description}`.slice(0, 40));
        });
        L.push('', 'NUMMER = LADEN   RETURN = ZURUECK');
        break;
      case 'info':
        L.push(head, 'SYSTEMINFO', '', ...sys!.sysinfo, '', 'TASTE = ZURUECK');
        break;
      case 'read': {
        const m = readView(state, sys!, app);
        if (m)
          L.push(
            `VON: ${m.from}   AN: ${m.to}`.slice(0, 40),
            `BETR: ${m.subject}`.slice(0, 40),
            '----------------------------------------',
            ...m.body,
          );
        L.push('', 'TASTE = ZURUECK');
        break;
      }
      case 'chat': {
        L.push(
          head,
          `CHAT MIT ${sys!.chat?.handle ?? '?'}  (RUN/STOP = ENDE)`,
          '----------------------------------------',
        );
        L.push(...(app.chat ?? []).slice(-19));
        break;
      }
      case 'to':
        L.push(head, 'NEUE POST', '', `BEKANNT: ${knownHandles(sys!).join(' ')}`.slice(0, 40), '', 'AN:');
        break;
      case 'subject':
        L.push(head, app.draft?.to ? `POST AN ${app.draft.to}` : 'NEUER BEITRAG', '', 'BETREFF:');
        break;
      case 'body':
        L.push(
          head,
          `BETR: ${app.draft?.subject ?? ''}`.slice(0, 40),
          `TEXT (MAX. ${MAX_BODY_LINES} ZEILEN, LEERE ZEILE = SENDEN)`.slice(0, 40),
          '----------------------------------------',
          ...(app.draft?.body ?? []),
        );
        break;
    }
    if (app.note) {
      L.push('', app.note);
      colors[L.length - 1] = 7;
    }
    return { lines: L.slice(0, 24), border: 11, background: 0, text: 13, lineColors: colors, cursor: true };
  },
};

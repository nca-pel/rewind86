/**
 * Allgemeines Mailbox-System (reguläre Mailboxen): Öffnungszeiten, Benutzerstatus, Bretter, private Post,
 * Downloads. Rein und deterministisch – verzögerte Vorgänge (Freischaltung, Antworten) werden über
 * Zeitstempel gelöst, die beim nächsten Zugriff ausgewertet werden, nicht über Ereignisse.
 *
 * Die geheime Mailbox (access 'module') läuft weiterhin über das Modul (sim/apps/modk.ts).
 */
import {
  MAILBOXES,
  type BbsStatus,
  type BoardDef,
  type MailboxMessage,
  type MailboxSystem,
} from '../content/networks';
import { DISK_ITEM_TO_IMAGE } from '../content/objects';
import { addMinutes, toMinutes } from './clock';
import { evalCondition } from './conditions';
import type { Ctx } from './context';
import { applyEffects } from './effects';
import type { BbsAccount, GameState, StoredMessage, VirtualDisk } from './types';

export const STATUS_RANK: Record<BbsStatus, number> = { gast: 0, neu: 1, mitglied: 2 };
const RESERVED = new Set(['GAST', 'ALLE', 'SYSOP', 'SYSTEM']);
export const MAX_BODY_LINES = 8;
/** 300 Baud ≈ 30 Zeichen pro Sekunde; ein Diskettenblock hat 254 Nutzbytes */
const BYTES_PER_MINUTE = 30 * 60;

function hm(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Ist das System zur Spielzeit erreichbar? Öffnungszeiten dürfen über Mitternacht gehen. */
export function isOpen(sys: MailboxSystem, clock: string): boolean {
  if (!sys.hours) return true;
  const now = hm(clock.slice(11, 16));
  const from = hm(sys.hours.from);
  const to = hm(sys.hours.to);
  return from <= to ? now >= from && now < to : now >= from || now < to;
}

/** Gültiges Handle: 2–10 Zeichen A–Z, 0–9, Bindestrich; keine reservierten Namen */
export function validHandle(raw: string): string | null {
  const h = raw.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,10}$/.test(h) || RESERVED.has(h)) return null;
  return h;
}

export function account(state: GameState, sysId: string): BbsAccount | null {
  return state.telecom.bbs[sysId] ?? null;
}

/** Aktueller Status der Sitzung: Gast, wenn nicht als Jans Handle angemeldet */
export function sessionStatus(state: GameState, sysId: string): BbsStatus {
  const acc = account(state, sysId);
  if (!acc || state.telecom.currentUserHandle !== acc.handle) return 'gast';
  return acc.status;
}

/** Neues Konto anlegen; die Freischaltung erfolgt später durch den Sysop. */
export function register(ctx: Ctx, sysId: string, handle: string): BbsAccount {
  const sys = MAILBOXES[sysId];
  const acc: BbsAccount = {
    handle,
    status: 'neu',
    validateAt: addMinutes(ctx.state.gameClock, sys.validateAfterMinutes ?? 30),
    lastLogin: null,
    inbox: [],
    posts: [],
    downloads: [],
  };
  ctx.state.telecom.bbs[sysId] = acc;
  ctx.debug(`bbs ${sysId} register ${handle}`);
  return acc;
}

/**
 * Anmeldung als Jans Handle oder als Gast. Wertet fällige Freischaltung aus und stellt die
 * Begrüßungspost zu.
 */
export function login(ctx: Ctx, sysId: string, handle: string | null): BbsStatus {
  const s = ctx.state;
  const sys = MAILBOXES[sysId];
  const acc = account(s, sysId);
  if (!handle || !acc || acc.handle !== handle) {
    s.telecom.currentUserHandle = 'GAST';
    return 'gast';
  }
  s.telecom.currentUserHandle = acc.handle;
  if (acc.status === 'neu' && toMinutes(s.gameClock) >= toMinutes(acc.validateAt)) {
    acc.status = 'mitglied';
    ctx.debug(`bbs ${sysId} member ${acc.handle}`);
    if (sys.memberMail) {
      acc.inbox.push({
        id: `${sysId}-member`,
        from: sys.memberMail.from,
        to: acc.handle,
        subject: sys.memberMail.subject,
        body: sys.memberMail.body,
        at: acc.validateAt,
      });
      applyEffects(ctx, sys.memberMail.effects);
    }
  }
  acc.lastLogin = s.gameClock;
  return acc.status;
}

export function visibleBoards(sys: MailboxSystem, status: BbsStatus): BoardDef[] {
  return sys.boards.filter((b) => STATUS_RANK[status] >= STATUS_RANK[b.minStatus]);
}

export type BoardEntry = { kind: 'content'; msg: MailboxMessage } | { kind: 'own'; msg: StoredMessage };

/** Beiträge eines Bretts: Content-Nachrichten (nach Status) plus Jans eigene Beiträge */
export function boardEntries(state: GameState, sysId: string, board: BoardDef): BoardEntry[] {
  const status = sessionStatus(state, sysId);
  const content: BoardEntry[] = board.messages
    .filter((m) => STATUS_RANK[status] >= STATUS_RANK[m.minStatus ?? 'gast'] && evalCondition(state, m.when))
    .map((msg) => ({ kind: 'content', msg }));
  const own: BoardEntry[] = (account(state, sysId)?.posts ?? [])
    .filter((p) => p.board === board.id)
    .map((msg) => ({ kind: 'own', msg }));
  return [...content, ...own];
}

/** Zugestellte private Post (verzögerte Antworten erscheinen erst ab ihrem Zeitpunkt) */
export function inbox(state: GameState, sysId: string): StoredMessage[] {
  const now = toMinutes(state.gameClock);
  return (account(state, sysId)?.inbox ?? []).filter((m) => toMinutes(m.at) <= now);
}

export function isRead(state: GameState, id: string): boolean {
  return state.telecom.messageReadIds.includes(id);
}

/** Nachricht als gelesen markieren; Effekte (Fakten …) nur beim ersten Lesen */
export function markRead(ctx: Ctx, id: string, effects?: MailboxMessage['effects']): void {
  if (isRead(ctx.state, id)) return;
  ctx.state.telecom.messageReadIds.push(id);
  applyEffects(ctx, effects);
}

function nextId(ctx: Ctx, sysId: string, kind: string): string {
  const acc = account(ctx.state, sysId)!;
  return `${sysId}-${kind}-${acc.posts.length + acc.inbox.length}-${ctx.state.commandCount}`;
}

/** Öffentlicher Beitrag in einem Brett (nur Mitglieder) */
export function post(ctx: Ctx, sysId: string, boardId: string, subject: string, body: string[]): boolean {
  const acc = account(ctx.state, sysId);
  if (!acc || sessionStatus(ctx.state, sysId) !== 'mitglied') return false;
  const msg: StoredMessage = {
    id: nextId(ctx, sysId, 'post'),
    from: acc.handle,
    to: 'ALLE',
    subject: subject.slice(0, 24),
    body: body.slice(0, MAX_BODY_LINES),
    at: ctx.state.gameClock,
    board: boardId,
  };
  acc.posts.push(msg);
  ctx.state.telecom.messagePostedIds.push(msg.id);
  ctx.state.telecom.messageReadIds.push(msg.id);
  return true;
}

/**
 * Private Post an ein Handle. Passt eine automatische Antwort, wird sie mit Verzögerung zugestellt.
 * Gibt false zurück, wenn der Empfänger im System unbekannt ist.
 */
export function sendMail(ctx: Ctx, sysId: string, to: string, subject: string, body: string[]): boolean {
  const s = ctx.state;
  const sys = MAILBOXES[sysId];
  const acc = account(s, sysId);
  if (!acc || sessionStatus(s, sysId) !== 'mitglied') return false;
  const target = to.trim().toUpperCase();
  if (!knownHandles(sys).includes(target)) return false;
  const msg: StoredMessage = {
    id: nextId(ctx, sysId, 'mail'),
    from: acc.handle,
    to: target,
    subject: subject.slice(0, 24),
    body: body.slice(0, MAX_BODY_LINES),
    at: s.gameClock,
  };
  acc.posts.push(msg);
  s.telecom.messagePostedIds.push(msg.id);
  s.telecom.messageReadIds.push(msg.id);
  const reply = sys.replies.find((r) => r.to === target);
  if (reply && !acc.inbox.some((m) => m.id === `${sysId}-reply-${target}`)) {
    acc.inbox.push({
      id: `${sysId}-reply-${target}`,
      from: reply.from,
      to: acc.handle,
      subject: reply.subject,
      body: reply.body,
      at: addMinutes(s.gameClock, reply.afterMinutes),
    });
  }
  return true;
}

/** Handles, die im System existieren (Sysop + Autoren der Content-Nachrichten) */
export function knownHandles(sys: MailboxSystem): string[] {
  const set = new Set<string>();
  if (sys.sysop) set.add(sys.sysop);
  for (const b of sys.boards) for (const m of b.messages) set.add(m.from);
  return [...set].filter((h) => !RESERVED.has(h));
}

function diskInDrive(state: GameState): VirtualDisk | null {
  const item = Object.entries(state.itemLocations).find(([, loc]) => loc === 'drive')?.[0];
  return item ? (state.disks[DISK_ITEM_TO_IMAGE[item]] ?? null) : null;
}

export function blocksFree(disk: VirtualDisk): number {
  return disk.blocksTotal - disk.files.reduce((a, f) => a + f.blocks, 0);
}

export type DownloadResult =
  | { ok: true; minutes: number; diskId: string }
  | { ok: false; reason: 'status' | 'nodisk' | 'protected' | 'full' | 'exists' };

/** Download auf die Diskette im Laufwerk. Dauer nach 300 Baud. */
export function download(ctx: Ctx, sysId: string, name: string): DownloadResult {
  const s = ctx.state;
  const sys = MAILBOXES[sysId];
  const file = sys.downloads.find((d) => d.name === name);
  if (!file || sessionStatus(s, sysId) !== 'mitglied') return { ok: false, reason: 'status' };
  const disk = diskInDrive(s);
  if (!disk) return { ok: false, reason: 'nodisk' };
  if (disk.writeProtected) return { ok: false, reason: 'protected' };
  if (disk.files.some((f) => f.name === file.name)) return { ok: false, reason: 'exists' };
  if (blocksFree(disk) < file.blocks) return { ok: false, reason: 'full' };
  disk.files.push({ name: file.name, type: 'PRG', blocks: file.blocks, basic: [...file.basic] });
  const acc = account(s, sysId)!;
  if (!acc.downloads.includes(file.name)) acc.downloads.push(file.name);
  ctx.cue('drive');
  ctx.debug(`bbs ${sysId} download ${file.name}`);
  return {
    ok: true,
    minutes: Math.max(1, Math.ceil((file.blocks * 254) / BYTES_PER_MINUTE)),
    diskId: disk.id,
  };
}

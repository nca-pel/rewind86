/**
 * Entwicklerwerkzeuge (nur mit ?dev=1 in der Oberfläche sichtbar).
 *
 * - devCommand: Zustand gezielt verändern (Fakten, Flags, Beziehungen, Rätsel, Gegenstände, Zeit, Geld,
 *   Ereignisse). Jede Änderung wird im debugLog mit „dev“ markiert, damit manipulierte Spielstände bei
 *   Playtest-Auswertungen erkennbar bleiben.
 * - Meilensteine: Spielstände, die durch Abspielen echter Spielbefehle entstehen (deterministisch) – nie
 *   handgebaute Zustände, die im Spiel unerreichbar wären.
 * - Content-Analyse: Ereignis-/Rätselgraph aus den deklarativen Contentdaten, inkl. Prüfungen auf
 *   nie eingeplante Ereignisse und nie gesetzte Rätsel.
 */
import { GAME_CONFIG } from '../content/config';
import { DIALOGUE } from '../content/dialogue';
import { EVENTS, EVENT_BY_ID } from '../content/events';
import { FACTS, FACT_BY_ID } from '../content/facts';
import { MAILBOXES, SECRET_SENDS } from '../content/networks';
import { OBJECTS } from '../content/objects';
import { PUZZLES } from '../content/puzzles';
import { formatShort, formatTime, toMinutes } from './clock';
import { evalCondition } from './conditions';
import type { Ctx } from './context';
import { discoverFact, clamp100, scheduleEvent } from './effects';
import { threshold } from './pressure';
import { createInitialState } from './state';
import { advanceTime, fireEvent } from './time';
import type {
  Command,
  Condition,
  FlagValue,
  GameEffect,
  GameState,
  ItemLocation,
  PuzzleStatus,
  RelationshipId,
} from './types';

const ITEM_LOCATIONS: ItemLocation[] = ['inventory', 'desk', 'drawer', 'drive', 'nowhere'];
const PUZZLE_STATES: PuzzleStatus[] = ['unknown', 'discovered', 'solving', 'solved', 'bypassed'];
export const RELATIONSHIP_IDS = Object.keys(GAME_CONFIG.relationshipsStart) as RelationshipId[];
export const ITEM_IDS = OBJECTS.filter((o) => o.portable).map((o) => o.id);

export const DEV_HELP = [
  'fakt <id> | fakt -<id>            Fakt hinzufügen / entfernen',
  'flag <id> <wert> | flag -<id>     Flag setzen (true/false/Zahl/Text) / löschen',
  'bez <id> <0–100>                  Verdeckten Beziehungswert setzen',
  'rätsel <id> <status>              unknown|discovered|solving|solved|bypassed',
  'item <id> <ort>                   inventory|desk|drawer|drive|nowhere',
  'zeit +<min> | <HH:MM> | <Datum>T<HH:MM>  Zeit vorspulen (Ereignisse und Zeitblöcke laufen ab)',
  'ereignis <id> | ereignis <id> +<min>   sofort auslösen / einplanen',
  'geld <DM>                         Taschengeld setzen',
  'hilfe                             diese Übersicht',
];

function parseValue(raw: string): FlagValue {
  if (raw === 'true' || raw === 'wahr') return true;
  if (raw === 'false' || raw === 'falsch') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function suggest(word: string, ids: string[]): string {
  const near = ids.filter((id) => id.toLowerCase().includes(word.toLowerCase())).slice(0, 6);
  return near.length
    ? ` Meintest du: ${near.join(', ')}?`
    : ` Bekannt: ${ids.slice(0, 12).join(', ')}${ids.length > 12 ? ' …' : ''}`;
}

/**
 * Einen Entwicklerbefehl ausführen. Gibt false zurück, wenn der Befehl ungültig war.
 * Ausgaben landen als 'system'-Einträge mit Präfix [DEV] im Protokoll.
 */
export function devCommand(ctx: Ctx, text: string): boolean {
  const s = ctx.state;
  const out = (t: string) => ctx.say(`[DEV] ${t}`, 'system');
  const fail = (t: string) => {
    out(t);
    return false;
  };
  const [cmdRaw = '', a = '', b = ''] = text.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace('ä', 'ae');
  ctx.debug(`dev ${text.trim()}`);

  switch (cmd) {
    case '':
    case 'hilfe':
    case 'help':
      DEV_HELP.forEach(out);
      return true;

    case 'fakt':
    case 'fact': {
      const remove = a.startsWith('-');
      const id = remove ? a.slice(1) : a;
      if (!FACT_BY_ID[id])
        return fail(
          `Unbekannter Fakt »${id}«.${suggest(
            id,
            FACTS.map((f) => f.id),
          )}`,
        );
      if (remove) {
        s.knownFacts = s.knownFacts.filter((f) => f !== id);
        out(`Fakt ${id} entfernt.`);
      } else discoverFact(ctx, id);
      return true;
    }

    case 'flag': {
      if (!a) return fail('flag <id> <wert>');
      if (a.startsWith('-')) {
        delete s.flags[a.slice(1)];
        out(`Flag ${a.slice(1)} gelöscht.`);
        return true;
      }
      if (!b) return fail(`Wert fehlt: flag ${a} <wert>`);
      s.flags[a] = parseValue(b);
      out(`Flag ${a} = ${JSON.stringify(s.flags[a])}`);
      return true;
    }

    case 'bez':
    case 'rel': {
      if (!RELATIONSHIP_IDS.includes(a as RelationshipId))
        return fail(`Unbekannte Beziehung »${a}«. Bekannt: ${RELATIONSHIP_IDS.join(', ')}`);
      const n = Number(b);
      if (!Number.isFinite(n)) return fail('Wert 0–100 angeben.');
      s.relationships[a as RelationshipId] = clamp100(n);
      out(`${a} = ${s.relationships[a as RelationshipId]}`);
      return true;
    }

    case 'raetsel':
    case 'puzzle': {
      if (!PUZZLES.some((p) => p.id === a))
        return fail(`Unbekanntes Rätsel »${a}«. Bekannt: ${PUZZLES.map((p) => p.id).join(', ')}`);
      if (!PUZZLE_STATES.includes(b as PuzzleStatus)) return fail(`Status: ${PUZZLE_STATES.join('|')}`);
      // Direkt setzen – auch rückwärts (setPuzzle erlaubt nur Fortschritt).
      s.puzzles[a] = b as PuzzleStatus;
      out(`Rätsel ${a} = ${b}`);
      return true;
    }

    case 'item': {
      if (!ITEM_IDS.includes(a)) return fail(`Unbekannter Gegenstand »${a}«.${suggest(a, ITEM_IDS)}`);
      if (!ITEM_LOCATIONS.includes(b as ItemLocation)) return fail(`Ort: ${ITEM_LOCATIONS.join('|')}`);
      if (b === 'drive') {
        for (const [id, loc] of Object.entries(s.itemLocations))
          if (loc === 'drive' && id !== a) s.itemLocations[id] = 'desk';
      }
      s.itemLocations[a] = b as ItemLocation;
      out(`${a} → ${b}`);
      return true;
    }

    case 'zeit':
    case 'time': {
      let minutes: number;
      const rel = /^\+(\d+)$/.exec(a);
      const abs = /^(\d{1,2}):(\d{2})$/.exec(a);
      const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.exec(a);
      if (rel) minutes = Number(rel[1]);
      else if (iso) {
        minutes = toMinutes(a) - toMinutes(s.gameClock);
        if (minutes < 0) return fail('Die Zeit läuft nur vorwärts (Ereignisse wären sonst inkonsistent).');
      } else if (abs) {
        const target = `${s.gameClock.slice(0, 11)}${abs[1].padStart(2, '0')}:${abs[2]}`;
        minutes = toMinutes(target) - toMinutes(s.gameClock);
        if (minutes < 0) return fail('Die Zeit läuft nur vorwärts (Ereignisse wären sonst inkonsistent).');
      } else return fail('zeit +<min>, zeit <HH:MM> oder zeit <JJJJ-MM-TTTHH:MM>');
      // Zeitblöcke (Schule, Schlaf …) laufen dabei wie im Spiel ab und können darüber hinaus führen.
      advanceTime(ctx, minutes);
      out(`Zeit jetzt ${formatShort(s.gameClock)}.`);
      return true;
    }

    case 'ereignis':
    case 'event': {
      if (!EVENT_BY_ID[a])
        return fail(
          `Unbekanntes Ereignis »${a}«.${suggest(
            a,
            EVENTS.map((e) => e.id),
          )}`,
        );
      const rel = /^\+(\d+)$/.exec(b);
      if (rel) {
        scheduleEvent(ctx, a, Number(rel[1]));
        out(`${a} eingeplant in ${rel[1]} min.`);
      } else {
        fireEvent(ctx, a);
        out(`${a} ausgelöst.`);
      }
      return true;
    }

    case 'geld':
    case 'money': {
      const n = Number(a.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) return fail('geld <DM>');
      s.moneyDm = Math.round(n * 100) / 100;
      out(`Taschengeld = ${s.moneyDm.toFixed(2)} DM`);
      return true;
    }
  }
  return fail(`Unbekannter Entwicklerbefehl »${cmdRaw}«. (hilfe zeigt alle)`);
}

// ---------------------------------------------------------------------------- Meilensteine

export interface Milestone {
  id: string;
  label: string;
  commands: Command[];
}

const A = (text: string): Command => ({ type: 'adventure', text });
const L = (text: string): Command => ({ type: 'c64line', text });
const K = (key: string): Command => ({ type: 'c64key', key });

const AFTER_DOOR = [A('nimm hörer'), A('frage ralf nach dem spiel'), A('lege auf'), A('warte')];
const C64_READY = [...AFTER_DOOR, A('lege diskette ins laufwerk'), A('schalte computer ein')];
const SECRET_MODE = [...C64_READY, L('LOAD"*",8'), L('RUN'), K('RETURN'), K('RETURN'), K('ARROW_LEFT')];
const NUMBER_KNOWN = [
  ...SECRET_MODE,
  K('RETURN'),
  K('J'),
  K('1'),
  K('RUNSTOP'),
  K('4'),
  L('LOAD"LADER",8'),
  L('LIST'),
  A('lies tabelle'),
];
const ONLINE = [
  ...NUMBER_KNOWN,
  L('LOAD"*",8'),
  L('RUN'),
  K('RETURN'),
  K('RETURN'),
  K('ARROW_LEFT'),
  K('RETURN'),
  K('J'),
  K('1'),
  A(`wähle ${GAME_CONFIG.secretNetwork.phoneNumber}`),
  A('lege hörer in den koppler'),
  K('RETURN'),
];
const SLICE_END = [
  ...ONLINE,
  K('1'),
  K('1'),
  K('X'),
  K('2'),
  K('X'),
  K('RETURN'),
  K('3'),
  K('X'),
  A('nimm hörer'),
  A('lege auf'),
];

/** Nach dem Ausschnitt den Abend verstreichen lassen und schlafen gehen → Samstagmorgen */
const SATURDAY = [...SLICE_END, A('warte 300'), A('warte 300'), A('warte 300'), A('schlafe')];

const BBS = GAME_CONFIG.mailboxes.bitschuppen;
const BBS_MEMBER = [
  ...AFTER_DOOR,
  A('öffne schublade'),
  A('nimm archivdiskette'),
  A('lege archivdiskette ins laufwerk'),
  A('schalte computer ein'),
  A('lies kleinanzeigen'),
  A('warte 100'),
  L('LOAD"TERMINAL",8'),
  L('RUN'),
  A(`wähle ${BBS.phoneNumber}`),
  A('lege hörer in den koppler'),
  K('RETURN'),
  L('JAN'),
  K('J'),
  K('5'),
  A('lege auf'),
  // WARTE wird um 18:30 vom Vater-Ereignis unterbrochen; danach ist die Leitung bis 18:45 belegt.
  A('warte 30'),
  A('warte 30'),
  A(`wähle ${BBS.phoneNumber}`),
  A('lege hörer in den koppler'),
  K('RETURN'),
  L('JAN'),
];

/** Meilensteine entlang des Lösungswegs. Die Reihenfolge entspricht dem Spielverlauf. */
export const MILESTONES: Milestone[] = [
  { id: 'start', label: 'Spielbeginn (Telefon klingelt)', commands: [] },
  { id: 'disk', label: 'Ralf war da, Diskette in der Hand', commands: AFTER_DOOR },
  { id: 'c64', label: 'Diskette im Laufwerk, C64 an', commands: C64_READY },
  { id: 'secret', label: 'Geheimer Modus (Modul) erreicht', commands: SECRET_MODE },
  { id: 'number', label: 'DATA-Zeilen und Tabelle gefunden', commands: NUMBER_KNOWN },
  { id: 'online', label: 'Online in der geheimen Mailbox', commands: ONLINE },
  { id: 'end', label: 'Ende des Ausschnitts', commands: SLICE_END },
  { id: 'saturday', label: 'Tagesablauf: Samstagmorgen nach dem Ausschnitt', commands: SATURDAY },
  { id: 'bbs', label: 'Nebenspur: Mitglied im BIT-SCHUPPEN (online)', commands: BBS_MEMBER },
];

/**
 * Spielstand eines Meilensteins erzeugen. `step` wird übergeben (statt importiert), damit dieses
 * Modul nicht zirkulär von engine.ts abhängt.
 */
export function milestoneState(
  id: string,
  step: (s: GameState, c: Command) => { state: GameState },
): GameState | null {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m) return null;
  let s = step(createInitialState(), { type: 'start' }).state;
  for (const c of m.commands) s = step(s, c).state;
  s.debugLog.push(`[${s.gameClock}] dev milestone ${id}`);
  return s;
}

// ---------------------------------------------------------------------------- Content-Analyse

export function describeCondition(c: Condition | undefined): string {
  if (!c) return 'immer';
  if ('all' in c) return c.all.map(describeCondition).join(' UND ');
  if ('any' in c) return `(${c.any.map(describeCondition).join(' ODER ')})`;
  if ('not' in c) return `NICHT ${describeCondition(c.not)}`;
  if ('fact' in c) return `Fakt ${c.fact}`;
  if ('notFact' in c) return `kein Fakt ${c.notFact}`;
  if ('notFlag' in c) return `!${c.notFlag}`;
  if ('flag' in c) return c.eq === undefined ? c.flag : `${c.flag}=${JSON.stringify(c.eq)}`;
  if ('itemAt' in c) return `${c.itemAt}@${c.loc}`;
  if ('notItemAt' in c) return `${c.notItemAt} nicht @${c.loc}`;
  if ('objState' in c) return `${c.objState}.${c.key}=${JSON.stringify(c.eq)}`;
  if ('timeAfter' in c) return `ab ${formatTime(c.timeAfter)}`;
  if ('timeBefore' in c) return `vor ${formatTime(c.timeBefore)}`;
  if ('factsAtLeast' in c) return `≥${c.factsAtLeast.n} Fakten aus ${c.factsAtLeast.of.length}`;
  if ('lineBusy' in c) return 'Leitung belegt';
  if ('online' in c) return 'online';
  if ('ringing' in c) return 'Telefon klingelt';
  if ('atLeast' in c) return `${c.rel} ≥ ${c.atLeast} (${threshold(c.rel, c.atLeast) ?? '?'})`;
  if ('below' in c) return `${c.rel} < ${c.below} (${threshold(c.rel, c.below) ?? '?'})`;
  return '?';
}

export interface GraphEdge {
  /** Quelle, z. B. „event:ev_doorbell“, „dialog:ralf/spiel“, „mailbox:secret/m1“ */
  from: string;
  kind: 'schedules' | 'fact' | 'puzzle' | 'flag' | 'cancels';
  to: string;
  detail?: string;
}

function edgesFrom(from: string, effects: GameEffect[]): GraphEdge[] {
  const out: GraphEdge[] = [];
  for (const e of effects) {
    if (e.type === 'scheduleEvent')
      out.push({ from, kind: 'schedules', to: e.id, detail: `+${e.inMinutes} min` });
    else if (e.type === 'cancelEvent') out.push({ from, kind: 'cancels', to: e.id });
    else if (e.type === 'discoverFact') out.push({ from, kind: 'fact', to: e.id });
    else if (e.type === 'puzzle') out.push({ from, kind: 'puzzle', to: e.id, detail: e.status });
    else if (e.type === 'setFlag')
      out.push({ from, kind: 'flag', to: e.id, detail: JSON.stringify(e.value) });
  }
  return out;
}

/** Alle deklarativen Abhängigkeiten aus Ereignissen, Dialogen und Mailbox-Inhalten. */
export function contentGraph(): GraphEdge[] {
  return [
    ...EVENTS.flatMap((ev) =>
      edgesFrom(
        `event:${ev.id}`,
        ev.variants.flatMap((v) => v.effects),
      ),
    ),
    ...DIALOGUE.flatMap((d) => edgesFrom(`dialog:${d.npc}/${d.topic}`, d.effects ?? [])),
    ...SECRET_SENDS.flatMap((x) => edgesFrom(`senden:${x.id}`, x.effects)),
    ...Object.entries(MAILBOXES).flatMap(([id, m]) => [
      ...m.boards.flatMap((b) => b.messages.flatMap((x) => edgesFrom(`mailbox:${id}/${x.id}`, x.effects))),
      ...edgesFrom(`mailbox:${id}/freischaltung`, m.memberMail?.effects ?? []),
      ...edgesFrom(`mailbox:${id}/sysinfo`, m.sysinfoEffects),
      ...m.replies.flatMap((r) =>
        edgesFrom(`mailbox:${id}/antwort-${r.id ?? r.to}`, [...(r.onSend ?? []), ...(r.effects ?? [])]),
      ),
    ]),
  ];
}

/**
 * Ereignisse und Rätsel, die nicht über Contentdaten, sondern im Code ausgelöst werden
 * (scheduleEvent/setPuzzle in engine/ und sim/). Ein Test gleicht diese Liste mit dem Quelltext ab.
 */
export const CODE_TRIGGERS = {
  events: ['ev_doorbell', 'ev_mother_modem', 'ev_ralf_callback', 'ev_finale_police'],
  puzzles: ['P01', 'P03', 'P04', 'P05', 'P06', 'P09', 'P17', 'P18'],
} as const;

export interface ContentWarning {
  kind: 'event-unreachable' | 'puzzle-unreferenced';
  id: string;
  text: string;
}

/**
 * Statische Prüfungen auf tote Enden: Ereignisse ohne Zeitpunkt/Auslöser/Einplanung und Rätsel, die
 * nie gesetzt werden. Fakten werden auch im Code entdeckt und sind hier nicht erfasst.
 */
export function contentWarnings(): ContentWarning[] {
  const edges = contentGraph();
  const w: ContentWarning[] = [];
  for (const ev of EVENTS) {
    const reachable =
      ev.at ||
      ev.daily ||
      ev.trigger ||
      (CODE_TRIGGERS.events as readonly string[]).includes(ev.id) ||
      edges.some((e) => e.kind === 'schedules' && e.to === ev.id);
    if (!reachable)
      w.push({
        kind: 'event-unreachable',
        id: ev.id,
        text: `Ereignis ${ev.id} hat weder Zeitpunkt noch Auslöser und wird von keinem Content eingeplant – unerreichbar.`,
      });
  }
  for (const p of PUZZLES) {
    const inCode = (CODE_TRIGGERS.puzzles as readonly string[]).includes(p.id);
    if (!inCode && !edges.some((e) => e.kind === 'puzzle' && e.to === p.id))
      w.push({
        kind: 'puzzle-unreferenced',
        id: p.id,
        text: `Rätsel ${p.id} wird von keinem Content-Effekt gesetzt – unerreichbar.`,
      });
  }
  return w;
}

export interface EventRow {
  id: string;
  kind: 'Zeit' | 'täglich' | 'Auslöser' | 'eingeplant';
  when: string;
  status: 'offen' | 'gefeuert' | 'abgesagt' | 'wartet' | '–';
  /** Bei Auslösern: Bedingung jetzt erfüllt? */
  conditionNow?: boolean;
}

/** Ereignisse mit Zustand im aktuellen Spielstand */
export function eventTable(s: GameState): EventRow[] {
  return EVENTS.map((ev) => {
    const sched = s.scheduledEvents.filter((e) => e.id === ev.id);
    const pending = sched.find((e) => e.status === 'pending');
    const fired = s.firedEvents.includes(ev.id);
    const cancelled = sched.some((e) => e.status === 'cancelled');
    const status: EventRow['status'] = pending
      ? 'wartet'
      : fired
        ? 'gefeuert'
        : cancelled
          ? 'abgesagt'
          : ev.trigger
            ? 'offen'
            : '–';
    if (ev.trigger)
      return {
        id: ev.id,
        kind: 'Auslöser',
        when: describeCondition(ev.trigger),
        status,
        conditionNow: evalCondition(s, ev.trigger),
      };
    return {
      id: ev.id,
      kind: ev.daily ? 'täglich' : ev.at ? 'Zeit' : 'eingeplant',
      when: pending ? formatShort(pending.at) : ev.at ? formatTime(ev.at) : '–',
      status,
    };
  });
}

/** Rätsel mit Status und der Hilfestufe, die DENKE NACH jetzt verwenden würde */
export function puzzleTable(s: GameState): Array<{
  id: string;
  title: string;
  status: PuzzleStatus;
  hintLevel: number;
  stage: string;
}> {
  return [...PUZZLES]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const idx = p.stages.findIndex((st) => evalCondition(s, st.when));
      return {
        id: p.id,
        title: p.title,
        status: s.puzzles[p.id] ?? 'unknown',
        hintLevel: s.hintLevels[p.id] ?? 0,
        stage: idx < 0 ? '–' : `${idx + 1}/${p.stages.length}: ${describeCondition(p.stages[idx].when)}`,
      };
    });
}

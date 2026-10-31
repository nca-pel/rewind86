/**
 * Tagesablauf (GDD §10.2): Kalender, Schlaf, Ralfs Erreichbarkeit, Taschengeld, Gebührenzähler.
 * Zeitblöcke werden hier nur angefordert (ctx.absence); advanceTime() in time.ts arbeitet sie ab.
 */
import { GAME_CONFIG } from '../content/config';
import { addMinutes, formatClock, formatDm, fromMinutes, toMinutes, weekday } from './clock';
import type { Ctx } from './context';
import type { AbsenceKind } from './types';

const CAL = GAME_CONFIG.calendar;
const HOUSE = GAME_CONFIG.household;
const RALF = GAME_CONFIG.ralf;

export const dateOf = (clock: string): string => clock.slice(0, 10);
const hm = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const minuteOfDay = (clock: string): number => hm(clock.slice(11, 16));

/** Schultag: Montag–Samstag (Samstagsunterricht in NRW 1986), außer schulfreien Tagen */
export function isSchoolDay(clock: string): boolean {
  return weekday(clock) !== 'Sonntag' && !(CAL.holidays as readonly string[]).includes(dateOf(clock));
}

/** Schulschluss an diesem Tag */
export function schoolUntil(clock: string): string {
  return weekday(clock) === 'Samstag' ? CAL.schoolUntilSaturday : CAL.schoolUntil;
}

export function isSchoolTomorrow(clock: string): boolean {
  return isSchoolDay(addMinutes(clock, 24 * 60));
}

/** Nächstes Vorkommen von HH:MM, echt nach `clock` */
export function nextOccurrence(clock: string, time: string): string {
  const today = `${dateOf(clock)}T${time}`;
  return toMinutes(today) > toMinutes(clock) ? today : addMinutes(today, 24 * 60);
}

/** Weckzeit nach dem Einschlafen zur Spielzeit `clock` */
export function wakeTime(clock: string): string {
  const day = minuteOfDay(clock) < 6 * 60 ? dateOf(clock) : dateOf(addMinutes(clock, 24 * 60));
  const probe = `${day}T12:00`;
  return `${day}T${isSchoolDay(probe) ? CAL.wakeSchoolDay : CAL.wakeFreeDay}`;
}

export function canSleepNow(clock: string): boolean {
  const m = minuteOfDay(clock);
  return m >= hm(CAL.sleepFrom) || m < 6 * 60;
}

/** Zeitblock anfordern; während eines laufenden Blocks wird nichts verschachtelt. */
export function requestAbsence(
  ctx: Ctx,
  kind: AbsenceKind,
  until: string,
  text: string,
  backText?: string,
): void {
  if (ctx.inAbsence || ctx.absence || ctx.state.flags.away) {
    ctx.debug(`absence ${kind} ignoriert (schon abwesend)`);
    return;
  }
  ctx.absence = { kind, untilMin: toMinutes(until), text, backText };
  ctx.debug(`absence ${kind} bis ${until}`);
}

export function sleep(ctx: Ctx, forced = false): void {
  const wake = wakeTime(ctx.state.gameClock);
  const school = isSchoolDay(`${dateOf(wake)}T12:00`);
  requestAbsence(
    ctx,
    'sleep',
    wake,
    forced
      ? 'Die Buchstaben auf dem Monitor verschwimmen. Dir fallen die Augen zu – du schaffst es gerade noch ins Bett.'
      : 'Du schaltest das Licht aus und kriechst unter die Decke. Die Gedanken kreisen noch eine Weile, dann schläfst du ein.',
    `${formatClock(wake)}.\n${
      school
        ? 'Der Wecker rasselt. Von unten ruft deine Mutter: »Jan! Aufstehen, Schule!« Für einen schnellen Blick auf den Schreibtisch bleibt gerade noch Zeit.'
        : 'Du wachst ohne Wecker auf. Kein Unterricht heute – der Tag gehört dir.'
    }`,
  );
}

// ------------------------------------------------------------------------------------- Ralf

export type RalfWhere = 'home' | 'school' | 'training' | 'match' | 'out' | 'late';

function ralfWindows(clock: string): ReadonlyArray<readonly [string, string]> {
  const wd = weekday(clock);
  const holiday = wd !== 'Sonntag' && !isSchoolDay(clock);
  return holiday ? RALF.homeHoliday : (RALF.home[wd] ?? []);
}

/** Wo ist Ralf gerade? (Telefonplan) */
export function ralfWhere(clock: string): RalfWhere {
  const m = minuteOfDay(clock);
  if (m >= hm('21:30') || m < hm('08:00')) return 'late';
  if (ralfWindows(clock).some(([a, b]) => m >= hm(a) && m < hm(b))) return 'home';
  if (isSchoolDay(clock) && m < hm(schoolUntil(clock)) + 30) return 'school';
  if (weekday(clock) === 'Samstag' && m >= hm('13:30') && m < hm('17:30')) return 'match';
  if (
    (RALF.trainingDays as readonly string[]).includes(weekday(clock)) &&
    m >= hm('16:30') &&
    m < hm('19:30')
  )
    return 'training';
  return 'out';
}

/** Nächster Zeitpunkt, an dem Ralf wieder zu Hause ist (für Rückrufe), höchstens 3 Tage voraus */
export function nextRalfHome(clock: string): string | null {
  const start = toMinutes(clock);
  for (let d = 0; d < 3; d++) {
    const day = fromMinutes(start + d * 24 * 60);
    for (const [a] of ralfWindows(`${dateOf(day)}T12:00`)) {
      const at = toMinutes(`${dateOf(day)}T${a}`);
      if (at > start) return fromMinutes(at);
    }
  }
  return null;
}

// ------------------------------------------------------------------------------ Haushalt

export function pocketMoney(ctx: Ctx): void {
  const s = ctx.state;
  const debt = Number(s.flags.phoneDebtDm ?? 0);
  const paid = Math.max(0, HOUSE.pocketMoneyDm - debt);
  const rest = Math.max(0, debt - HOUSE.pocketMoneyDm);
  s.moneyDm = Math.round((s.moneyDm + paid) * 100) / 100;
  if (rest > 0) s.flags.phoneDebtDm = rest;
  else delete s.flags.phoneDebtDm;
  ctx.debug(`pocket money +${paid}${debt ? ` (Schulden ${debt})` : ''}`);
  ctx.say(
    debt > 0
      ? `Dein Vater legt dir ${formatDm(paid)} Taschengeld hin. »Den Rest behalte ich – für die Telefonrechnung.«`
      : `Deine Mutter drückt dir dein Taschengeld in die Hand: ${formatDm(paid)}. »Nicht alles für Disketten ausgeben!«`,
  );
}

/** Der Vater liest den Gebührenzähler ab: Kosten seit der letzten Ablesung, Jans Anteil, Reaktion. */
export function meterReading(ctx: Ctx): void {
  const s = ctx.state;
  const t = s.telecom;
  const since = Math.round((s.phoneCostsDm - t.costsAtLastReading) * 100) / 100;
  t.costsAtLastReading = s.phoneCostsDm;
  const share = Math.max(0, Math.round((since - HOUSE.freePhoneDm) * 100) / 100);
  ctx.debug(`meter ${since} DM, Jans Anteil ${share} DM`);
  if (share <= 0) {
    ctx.say(
      'Nach dem Essen wirft dein Vater einen Blick auf den Gebührenzähler im Flur, nickt zufrieden und schreibt den Stand in sein Heftchen.',
    );
    return;
  }
  const paid = Math.min(share, s.moneyDm);
  s.moneyDm = Math.round((s.moneyDm - paid) * 100) / 100;
  const debt = Math.round((share - paid) * 100) / 100;
  if (debt > 0) s.flags.phoneDebtDm = Math.round((Number(s.flags.phoneDebtDm ?? 0) + debt) * 100) / 100;
  s.flags.phoneTalk = true;
  const angry = since >= HOUSE.angryPhoneDm;
  ctx.say(
    angry
      ? `Dein Vater kommt mit seinem Heftchen vom Gebührenzähler zurück und legt es wortlos neben deinen Teller. ${formatDm(since)} in einer Woche. »Jan. Das ist kein Spaß mehr. Du zahlst deinen Anteil, und ab jetzt will ich wissen, wen du da anrufst.«`
      : `Dein Vater liest den Gebührenzähler ab und rechnet nach. »${formatDm(since)} diese Woche. Drei Mark zahlen wir, den Rest du.«`,
    'dialog',
    'VATER',
  );
  ctx.say(
    debt > 0
      ? `Du gibst ihm, was du hast: ${formatDm(paid)}. Den Rest (${formatDm(debt)}) zieht er dir vom nächsten Taschengeld ab.`
      : `Du zahlst ${formatDm(paid)} aus deiner Kasse.`,
  );
  if (angry) s.flags.fatherAngryPhone = true;
}

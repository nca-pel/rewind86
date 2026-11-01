/**
 * FERNHANDEL – die kleine Wirtschaftssimulation aus der Arbeitskopie (Diskette 1, SPIEL.07).
 * Reine, deterministische Spiellogik ohne Zufallsquelle von außen: alle »Zufälle« folgen aus `world` und `seed`.
 * Handlung: 30 Tage lang Waren zwischen fünf Städten handeln (angeblich per Telex und Telefon bestellt), Kredit
 * abzahlen, Telex-Aufträge pünktlich liefern. Wertung = Kasse − Schulden am Ende von Tag 30.
 */

export const FH_DAYS = 30;
export const FH_CITIES = ['HAMBURG', 'KOELN', 'FRANKFURT', 'MUENCHEN', 'BREMEN'] as const;
export const FH_GOODS = ['KAFFEE', 'STAHL', 'TUCH', 'WEIN', 'OEL'] as const;
const BASE = [120, 60, 90, 70, 40];
/** Preisfaktor je Stadt und Ware (kleiner = dort billig, größer = dort gefragt) */
const FACTOR: number[][] = [
  [0.7, 0.9, 1.3, 1.3, 1.0],
  [1.2, 0.8, 1.1, 0.7, 1.1],
  [1.3, 1.1, 0.7, 1.0, 1.2],
  [1.2, 0.7, 1.0, 0.9, 1.3],
  [0.9, 1.3, 1.2, 1.2, 0.65],
];
export const FH_START_CASH = 3000;
export const FH_START_DEBT = 2000;
export const FH_START_HOLD = 30;
export const FH_MAX_HOLD = 60;
export const FH_UPGRADE_COST = 1500;
export const FH_MAX_DEBT = 5000;
const IMPACT = 0.006;
const DEBT_RATE = 0.01;

export interface FhEvent {
  city: number;
  good: number;
  /** Preisfaktor, bis einschließlich Tag `until` */
  mult: number;
  until: number;
}

export interface FhOrder {
  city: number;
  good: number;
  qty: number;
  deadline: number;
  reward: number;
}

export interface FhState {
  /** Welt (legt die Tagespreise fest) und Zufallsstrom für Ereignisse */
  world: number;
  seed: number;
  day: number;
  city: number;
  cash: number;
  debt: number;
  capacity: number;
  hold: number[];
  /** Preisverschiebung durch eigene Käufe/Verkäufe am aktuellen Ort (Bruchteil) */
  impact: number[];
  events: FhEvent[];
  order: FhOrder | null;
  sel: number;
  mode: 'market' | 'travel' | 'help' | 'end';
  msg: string;
  /** Endwertung, sobald das Spiel vorbei ist */
  final: number | null;
}

export function newGame(world: number): FhState {
  return {
    world,
    seed: (world * 2654435761) >>> 0,
    day: 1,
    city: 0,
    cash: FH_START_CASH,
    debt: FH_START_DEBT,
    capacity: FH_START_HOLD,
    hold: [0, 0, 0, 0, 0],
    impact: [0, 0, 0, 0, 0],
    events: [],
    order: null,
    sel: 0,
    mode: 'market',
    msg: 'WILLKOMMEN, HAENDLER! KAUFE BILLIG, VERKAUFE TEUER.',
    final: null,
  };
}

function hash(a: number, b: number, c: number, d: number): number {
  let h = (a ^ 0x9e3779b9) >>> 0;
  for (const v of [b, c, d]) {
    h = Math.imul(h ^ v, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}

/** Nächste Zufallszahl 0..1 aus dem Ereignisstrom */
function rnd(st: FhState): number {
  st.seed = (Math.imul(st.seed, 1664525) + 1013904223) >>> 0;
  return st.seed / 4294967296;
}

export function holdUsed(st: FhState): number {
  return st.hold.reduce((a, b) => a + b, 0);
}

/** Tagespreis ohne eigene Marktwirkung */
export function basePrice(st: FhState, city: number, good: number, day = st.day): number {
  const noise = 0.85 + (hash(st.world, day, city, good) % 31) / 100;
  let p = BASE[good] * FACTOR[city][good] * noise;
  for (const e of st.events) if (e.city === city && e.good === good && day <= e.until) p *= e.mult;
  return p;
}

export function price(st: FhState, good: number): number {
  return Math.max(1, Math.round(basePrice(st, st.city, good) * (1 + st.impact[good])));
}

export function netWorth(st: FhState): number {
  return st.cash - st.debt;
}

export function rating(score: number): string {
  if (score < 0) return 'PLEITE';
  if (score < 2000) return 'KLEINHAENDLER';
  if (score < 8000) return 'KAUFMANN';
  if (score < 20000) return 'GROSSHAENDLER';
  if (score < 50000) return 'HANDELSHERR';
  return 'HANDELSRAT';
}

/** `reserve`: Betrag, der in der Kasse bleiben soll (bei »M« das Fahrgeld) */
export function buy(st: FhState, good: number, qty: number, reserve = 0): void {
  let paid = 0;
  let got = 0;
  while (got < qty && holdUsed(st) + got < st.capacity) {
    const p = Math.max(1, Math.round(basePrice(st, st.city, good) * (1 + st.impact[good])));
    if (paid + p > st.cash - reserve) break;
    paid += p;
    got++;
    st.impact[good] = Math.min(0.5, st.impact[good] + IMPACT);
  }
  if (got === 0) {
    st.msg = holdUsed(st) >= st.capacity ? 'LAGER VOLL!' : 'KASSE REICHT NICHT.';
    return;
  }
  st.cash -= paid;
  st.hold[good] += got;
  st.msg = `${got} ${FH_GOODS[good]} GEKAUFT FUER ${paid}.`;
}

export function sell(st: FhState, good: number, qty: number): void {
  const n = Math.min(qty, st.hold[good]);
  if (n <= 0) {
    st.msg = `DU HAST KEIN(E) ${FH_GOODS[good]}.`;
    return;
  }
  let got = 0;
  for (let i = 0; i < n; i++) {
    got += Math.max(1, Math.round(basePrice(st, st.city, good) * (1 + st.impact[good])));
    st.impact[good] = Math.max(-0.5, st.impact[good] - IMPACT);
  }
  st.cash += got;
  st.hold[good] -= n;
  st.msg = `${n} ${FH_GOODS[good]} VERKAUFT FUER ${got}.`;
}

export function deliver(st: FhState): void {
  const o = st.order;
  if (!o) {
    st.msg = 'KEIN TELEX-AUFTRAG OFFEN.';
    return;
  }
  if (st.city !== o.city) {
    st.msg = `AUFTRAG GILT FUER ${FH_CITIES[o.city]}.`;
    return;
  }
  if (st.hold[o.good] < o.qty) {
    st.msg = `DU BRAUCHST ${o.qty} ${FH_GOODS[o.good]} IM LAGER.`;
    return;
  }
  st.hold[o.good] -= o.qty;
  st.cash += o.reward;
  st.msg = `AUFTRAG ERFUELLT! PRAEMIE ${o.reward}.`;
  st.order = null;
}

export function borrow(st: FhState): void {
  if (st.debt + 1000 > FH_MAX_DEBT) {
    st.msg = `DIE BANK GIBT NICHT MEHR ALS ${FH_MAX_DEBT} KREDIT.`;
    return;
  }
  st.debt += 1000;
  st.cash += 1000;
  st.msg = 'KREDIT 1000 AUFGENOMMEN (1% ZINS/TAG).';
}

export function repay(st: FhState): void {
  const n = Math.min(500, st.debt, st.cash);
  if (n <= 0) {
    st.msg = st.debt <= 0 ? 'DU BIST SCHULDENFREI.' : 'KASSE IST LEER.';
    return;
  }
  st.debt -= n;
  st.cash -= n;
  st.msg = `${n} ZURUECKGEZAHLT.`;
}

export function upgrade(st: FhState): void {
  if (st.capacity >= FH_MAX_HOLD) {
    st.msg = 'LAGER IST AUSGEBAUT.';
    return;
  }
  if (st.cash < FH_UPGRADE_COST) {
    st.msg = `LAGERAUSBAU KOSTET ${FH_UPGRADE_COST}.`;
    return;
  }
  st.cash -= FH_UPGRADE_COST;
  st.capacity += 10;
  st.msg = `LAGER NUN FUER ${st.capacity} EINHEITEN.`;
}

export function fare(from: number, to: number): number {
  const d = Math.abs(from - to);
  return 40 + 20 * Math.min(d, FH_CITIES.length - d);
}

/** Reise in eine andere Stadt: kostet Fahrgeld und einen Tag; danach Ereignisse. Ende nach Tag 30. */
export function travel(st: FhState, to: number): void {
  if (to === st.city || to < 0 || to >= FH_CITIES.length) return;
  const f = fare(st.city, to);
  if (st.cash < f) {
    st.msg = `FAHRGELD ${f} FEHLT.`;
    return;
  }
  st.cash -= f;
  st.city = to;
  st.day++;
  st.impact = [0, 0, 0, 0, 0];
  st.mode = 'market';
  st.debt = Math.round(st.debt * (1 + DEBT_RATE));
  st.events = st.events.filter((e) => e.until >= st.day);
  const notes: string[] = [];
  if (st.order && st.day > st.order.deadline) {
    notes.push('AUFTRAG VERFALLEN.');
    st.order = null;
  }
  const r = rnd(st);
  if (r < 0.12) {
    const good = Math.floor(rnd(st) * 5);
    st.events.push({ city: to, good, mult: 1.5, until: st.day + 3 });
    notes.push(`HAFENSTREIK: ${FH_GOODS[good]} KNAPP (+50%).`);
  } else if (r < 0.22) {
    const good = Math.floor(rnd(st) * 5);
    st.events.push({ city: to, good, mult: 0.6, until: st.day + 3 });
    notes.push(`UEBERANGEBOT: ${FH_GOODS[good]} BILLIG (-40%).`);
  } else if (r < 0.29 && st.cash > 2000) {
    const loss = Math.round(st.cash * 0.08);
    st.cash -= loss;
    notes.push(`DIEBSTAHL! ${loss} WEG.`);
  }
  if (!st.order && st.day < FH_DAYS - 3 && rnd(st) < 0.3) {
    const city = (to + 1 + Math.floor(rnd(st) * 4)) % FH_CITIES.length;
    const good = Math.floor(rnd(st) * 5);
    const qty = 8 + Math.floor(rnd(st) * 8);
    const deadline = Math.min(FH_DAYS, st.day + 4 + Math.floor(rnd(st) * 3));
    st.order = { city, good, qty, deadline, reward: Math.round(qty * BASE[good] * 1.8) };
    notes.push('TELEX-AUFTRAG EINGEGANGEN!');
  }
  if (st.day > FH_DAYS) {
    st.final = netWorth(st);
    st.mode = 'end';
    st.msg = '';
    return;
  }
  st.msg = (notes.join(' ') || `ANGEKOMMEN IN ${FH_CITIES[to]}.`).slice(0, 78);
}

/** Taste im Marktbild; liefert true, wenn ein Reisetag verstrichen ist */
export function handleKey(st: FhState, key: string): boolean {
  const k = key.toUpperCase();
  if (st.mode === 'help') {
    st.mode = 'market';
    return false;
  }
  if (st.mode === 'travel') {
    const n = parseInt(k, 10);
    if (k === 'R' || k === 'DEL') st.mode = 'market';
    else if (n >= 1 && n <= FH_CITIES.length) {
      const day = st.day;
      travel(st, n - 1);
      return st.day !== day;
    }
    return false;
  }
  const n = parseInt(k, 10);
  if (n >= 1 && n <= FH_GOODS.length) st.sel = n - 1;
  else if (k === 'B') buy(st, st.sel, 1);
  else if (k === 'M') buy(st, st.sel, 999, 100);
  else if (k === 'V') sell(st, st.sel, 1);
  else if (k === 'A') sell(st, st.sel, 999);
  else if (k === 'L') deliver(st);
  else if (k === 'K') borrow(st);
  else if (k === 'T') repay(st);
  else if (k === 'U') upgrade(st);
  else if (k === 'H') st.mode = 'help';
  else if (k === 'R') st.mode = 'travel';
  return false;
}

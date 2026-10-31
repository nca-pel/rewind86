/**
 * Startbildschirm als austauschbares Profil.
 *
 * Alles, was beim Einschalten erscheint und rechtlich geschützt sein kann (Marken- und
 * Produktnamen in der Einschaltmeldung, Gerätebezeichnung in der Oberfläche), steht ausschließlich
 * hier – nirgends sonst im Code. Zum Austauschen genügt es, ein anderes Profil zu wählen
 * (Konfiguration bzw. Build-Variable VITE_C64_BOOT_PROFILE) oder ein eigenes zu registrieren.
 */
import { DEFAULT_BACKGROUND, DEFAULT_BORDER, DEFAULT_TEXT, TEXT_COLS } from './geometry';
import { stringToPetscii } from './petscii';
import { createVideo, newline, printBytes, type VideoState } from './video';

export interface BootProfile {
  id: string;
  /** Beschreibung für Entwickler/Einstellungen */
  label: string;
  /** Gerätename für Beschriftungen und Screenreader (z. B. aria-label des Bildschirms) */
  machineName: string;
  /** Kurzlabel für das Bedienfeld */
  badge: string;
  border: number;
  background: number;
  text: number;
  /**
   * Zeilen der Einschaltmeldung. Platzhalter: {BYTES} = freie BASIC-Bytes.
   * Zeilen mit führendem „^“ werden automatisch zentriert.
   */
  banner: string[];
  /** Freier BASIC-Speicher nach dem Einschalten (Grundlage für FRE) */
  bytesFree: number;
  /** Bereitschaftsmeldung */
  ready: string;
  /**
   * Dokumentation: welche Elemente dieses Profils Marken/Produktnamen Dritter sind.
   * Leer = frei verwendbar.
   */
  protectedElements: string[];
}

/** Historisch getreue Einschaltmeldung (enthält Marken-/Produktnamen des Herstellers) */
export const AUTHENTIC_PROFILE: BootProfile = {
  id: 'authentic',
  label: 'Historisch (Originalmeldung)',
  machineName: 'Commodore 64',
  badge: 'C64',
  border: DEFAULT_BORDER,
  background: DEFAULT_BACKGROUND,
  text: DEFAULT_TEXT,
  banner: ['', '^**** COMMODORE 64 BASIC V2 ****', '', ' 64K RAM SYSTEM  {BYTES} BASIC BYTES FREE', ''],
  bytesFree: 38911,
  ready: 'READY.',
  protectedElements: [
    'Herstellername „COMMODORE“ in der Einschaltmeldung',
    'Produktbezeichnung „Commodore 64“/„C64“ in Beschriftungen',
  ],
};

/** Neutrale Variante ohne Marken- und Produktnamen – technisch identisches Verhalten */
export const NEUTRAL_PROFILE: BootProfile = {
  id: 'neutral',
  label: 'Neutral (ohne Markennamen)',
  machineName: 'Heimcomputer 64',
  badge: 'HC64',
  border: DEFAULT_BORDER,
  background: DEFAULT_BACKGROUND,
  text: DEFAULT_TEXT,
  banner: ['', '^**** HEIMCOMPUTER 64 BASIC V2 ****', '', ' 64K RAM SYSTEM  {BYTES} BASIC BYTES FREE', ''],
  bytesFree: 38911,
  ready: 'READY.',
  protectedElements: [],
};

const PROFILES = new Map<string, BootProfile>([
  [AUTHENTIC_PROFILE.id, AUTHENTIC_PROFILE],
  [NEUTRAL_PROFILE.id, NEUTRAL_PROFILE],
]);

/** Eigenes Profil registrieren (z. B. für eine lizenzierte oder eine fiktive Gerätevariante) */
export function registerBootProfile(p: BootProfile): void {
  validateBootProfile(p);
  PROFILES.set(p.id, p);
}

export function bootProfiles(): BootProfile[] {
  return [...PROFILES.values()];
}

/** Unbekannte IDs fallen auf das neutrale Profil zurück (nie stillschweigend auf geschützte Inhalte) */
export function getBootProfile(id: string | undefined | null): BootProfile {
  return (id && PROFILES.get(id)) || NEUTRAL_PROFILE;
}

export function validateBootProfile(p: BootProfile): void {
  for (const c of [p.border, p.background, p.text])
    if (!Number.isInteger(c) || c < 0 || c > 15) throw new Error(`Profil ${p.id}: ungültige Farbe ${c}`);
  for (const l of bannerLines(p))
    if (l.length > TEXT_COLS) throw new Error(`Profil ${p.id}: Zeile länger als ${TEXT_COLS} Zeichen: ${l}`);
}

export function bannerLines(p: BootProfile): string[] {
  return p.banner.map((raw) => {
    const l = raw.replace('{BYTES}', String(p.bytesFree));
    if (!l.startsWith('^')) return l;
    const t = l.slice(1);
    return ' '.repeat(Math.max(0, Math.floor((TEXT_COLS - t.length) / 2))) + t;
  });
}

/** Bildschirm direkt nach dem Einschalten bzw. nach einem Reset */
export function bootVideo(p: BootProfile): VideoState {
  const v = createVideo({ border: p.border, background: p.background, text: p.text });
  for (const l of [...bannerLines(p), p.ready]) {
    printBytes(v, stringToPetscii(l));
    newline(v);
  }
  return v;
}

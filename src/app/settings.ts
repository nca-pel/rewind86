import { createContext, useContext } from 'react';

export interface Settings {
  audio: boolean;
  volume: number;
  /** 'system' folgt prefers-reduced-motion */
  motion: 'system' | 'reduced' | 'full';
  crt: boolean;
  textSize: 's' | 'm' | 'l';
  highContrast: boolean;
  /** nicht verstandene Eingaben lokal protokollieren (verlässt den Browser nicht) */
  logMisses: boolean;
  /** Schreibtisch: true = Pixelgrafik im Stil von 1986, false = realistisch gezeichnet */
  pixelArt: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  audio: true,
  volume: 0.6,
  motion: 'system',
  crt: true,
  textSize: 'm',
  highContrast: false,
  logMisses: true,
  pixelArt: true,
};

const KEY = 'rewind1986.settings';

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function storeSettings(s: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignorieren */
  }
}

export function systemPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export function reducedMotion(s: Settings): boolean {
  return s.motion === 'reduced' || (s.motion === 'system' && systemPrefersReducedMotion());
}

export const SettingsContext = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void }>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

/**
 * Entwicklerwerkzeuge (Konsole, `dev`-Befehl, Graphprüfung) gibt es nur im Entwicklungsbuild und in Vitest
 * (`import.meta.env.DEV`) oder wenn ausdrücklich mit VITE_DEV_TOOLS=1 gebaut wird (E2E-Tests). Im
 * Produktionsbuild ist die Bedingung eine Konstante: der Code wird beim Bündeln entfernt.
 */
export const DEV_TOOLS: boolean = import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === '1';

/** Entwicklermodus über ?dev=1 (bleibt für die Sitzung aktiv) */
export function devEnabled(): boolean {
  if (!DEV_TOOLS) return false;
  try {
    const q = new URLSearchParams(window.location.search).get('dev');
    if (q === '1') sessionStorage.setItem('rewind86.dev', '1');
    if (q === '0') sessionStorage.removeItem('rewind86.dev');
    return q === '1' || sessionStorage.getItem('rewind86.dev') === '1';
  } catch {
    return false;
  }
}

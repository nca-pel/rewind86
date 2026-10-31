/**
 * Die 16 festen Farben des VIC-II.
 *
 * Die RGB-Werte werden hier aus einem YUV-Modell berechnet: jede Farbe hat eine Helligkeitsstufe und
 * (außer Schwarz/Weiß/Grautönen) einen Farbwinkel auf dem PAL-Farbkreis in 22,5°-Schritten. Die
 * Helligkeitsstufen entsprechen den öffentlich dokumentierten Messungen an PAL-Geräten der späteren
 * Revision (neun Stufen). Ergebnis ist eine eigene, nachvollziehbar hergeleitete Palette – keine
 * kopierte Tabelle.
 */

export const COLOR_NAMES = [
  'Schwarz',
  'Weiß',
  'Rot',
  'Cyan',
  'Violett',
  'Grün',
  'Blau',
  'Gelb',
  'Orange',
  'Braun',
  'Hellrot',
  'Dunkelgrau',
  'Grau',
  'Hellgrün',
  'Hellblau',
  'Hellgrau',
] as const;

/** Relative Helligkeit 0–32 (Schwarz … Weiß) */
const LUMA = [0, 32, 10, 20, 12, 16, 8, 24, 12, 8, 16, 10, 15, 24, 15, 20];
/** Farbwinkel in Vielfachen von 22,5° (null = unbunt) */
const ANGLE: Array<number | null> = [null, null, 4, 12, 2, 10, 15, 7, 5, 6, 4, null, null, 10, 15, null];

/** Parameter des Modells – bewusst als Konstanten, damit man die Palette nachjustieren kann. */
export const PALETTE_MODEL = { brightness: 55, contrast: 100, saturation: 45, gamma: 2.8 / 2.2 };

function clamp8(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function computePalette(model = PALETTE_MODEL): Array<[number, number, number]> {
  const sector = 360 / 16;
  const origin = sector / 2;
  const sat = model.saturation / 100;
  const con = model.contrast / 100;
  const bri = model.brightness - 50;
  return LUMA.map((l, i) => {
    // Schwarz bleibt Schwarz (Austastpegel); der Helligkeitsoffset hebt nur die übrigen Stufen an
    const y = l === 0 ? 0 : (l / 32) * 255 * con + bri;
    let u = 0;
    let v = 0;
    const a = ANGLE[i];
    if (a !== null) {
      const rad = ((origin + a * sector) * Math.PI) / 180;
      u = Math.cos(rad) * 255 * 0.31 * sat * con;
      v = Math.sin(rad) * 255 * 0.31 * sat * con;
    }
    const rgb = [y + 1.14 * v, y - 0.396 * u - 0.581 * v, y + 2.029 * u];
    // PAL-Gamma (2,8) auf sRGB-ähnliches Gamma (2,2) umrechnen
    return rgb.map((c) => clamp8(255 * Math.pow(Math.max(0, c) / 255, model.gamma))) as [
      number,
      number,
      number,
    ];
  });
}

export const PALETTE_RGB = computePalette();

export const PALETTE_HEX = PALETTE_RGB.map(
  ([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
);

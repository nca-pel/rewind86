/**
 * Bildschirmgeometrie und Timing des VIC-II in der PAL-Ausführung (6569), wie sie ein C64 in der
 * Bundesrepublik 1986 an Fernseher oder Monitor lieferte. Werte aus öffentlich dokumentierten
 * Hardware-Kenngrößen; keine ROM-Daten.
 */

/** Textmodus: 40 × 25 Zeichen à 8 × 8 Pixel */
export const TEXT_COLS = 40;
export const TEXT_ROWS = 25;
export const CHAR_W = 8;
export const CHAR_H = 8;
export const CELLS = TEXT_COLS * TEXT_ROWS;

/** Anzeigefenster (Display Window) in Pixeln */
export const DISPLAY_W = TEXT_COLS * CHAR_W; // 320
export const DISPLAY_H = TEXT_ROWS * CHAR_H; // 200

/**
 * Sichtbarer Bereich inklusive Rahmen, wie ihn ein typischer PAL-Bildschirm zeigt.
 * Rasterzeile 51 ist die erste Zeile des Anzeigefensters, sichtbar sind ca. die Zeilen 16–287.
 * Horizontal: 32 Pixel Rahmen links und rechts.
 */
export const FRAME_W = 384;
export const FRAME_H = 272;
export const BORDER_LEFT = 32;
export const BORDER_TOP = 35;
export const BORDER_RIGHT = FRAME_W - DISPLAY_W - BORDER_LEFT; // 32
export const BORDER_BOTTOM = FRAME_H - DISPLAY_H - BORDER_TOP; // 37

/** PAL-Raster: 312 Zeilen à 63 Taktzyklen, Systemtakt 985 248 Hz → ca. 50,12 Bilder/s */
export const PAL_CLOCK_HZ = 985_248;
export const PAL_RASTER_LINES = 312;
export const PAL_CYCLES_PER_LINE = 63;
export const PAL_FRAME_HZ = PAL_CLOCK_HZ / (PAL_RASTER_LINES * PAL_CYCLES_PER_LINE);

/**
 * Pixel-Seitenverhältnis (Breite/Höhe) eines PAL-C64-Pixels auf einem 4:3-Bildschirm.
 * Pixel sind etwas schmaler als hoch.
 */
export const PAL_PIXEL_ASPECT = 0.9365;
/** Seitenverhältnis des sichtbaren Bildes inkl. Rahmen */
export const FRAME_ASPECT = (FRAME_W * PAL_PIXEL_ASPECT) / FRAME_H;

/**
 * Das Betriebssystem stellt den System-Interrupt auch auf PAL-Geräten auf ca. 60 Hz („Jiffies“).
 * Der Cursor wechselt alle 20 Jiffies seinen Zustand → ca. 1,5 Blinkzyklen pro Sekunde.
 */
export const JIFFY_HZ = 60;
export const CURSOR_BLINK_JIFFIES = 20;
export const CURSOR_BLINK_MS = (CURSOR_BLINK_JIFFIES / JIFFY_HZ) * 1000;

/** Speicheradressen der Standardkonfiguration */
export const SCREEN_RAM = 1024; // $0400
export const COLOR_RAM = 55296; // $D800
export const VIC_CONTROL_1 = 53265; // $D011 (Bit 4: Bildschirm an)
export const VIC_MEMORY_SETUP = 53272; // $D018 (Bit 1: Zeichensatz)
export const VIC_BORDER = 53280; // $D020
export const VIC_BACKGROUND = 53281; // $D021
export const CURSOR_COLOR = 646; // $0286
export const RVS_FLAG = 199; // $00C7
export const CURSOR_COL = 211; // $00D3
export const CURSOR_ROW = 214; // $00D6

/** Einschaltfarben: hellblauer Rahmen, blauer Hintergrund, hellblaue Schrift */
export const DEFAULT_BORDER = 14;
export const DEFAULT_BACKGROUND = 6;
export const DEFAULT_TEXT = 14;

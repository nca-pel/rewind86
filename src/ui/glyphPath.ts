import { charset, textToScreen } from '../c64';

/** Text im eigenen 8×8-Zeichensatz als SVG-Pfad (1 Einheit = 1 Pixel), Ursprung oben links */
export function glyphPath(s: string, x: number, y: number): string {
  const rom = charset('upper');
  let d = '';
  textToScreen(s).forEach((code, i) => {
    for (let row = 0; row < 8; row++) {
      const bits = rom[code * 8 + row];
      let col = 0;
      while (col < 8) {
        if (bits & (0x80 >> col)) {
          let len = 1;
          while (col + len < 8 && bits & (0x80 >> (col + len))) len++;
          d += `M${x + i * 8 + col} ${y + row}h${len}v1h-${len}z`;
          col += len;
        } else col++;
      }
    }
  });
  return d;
}

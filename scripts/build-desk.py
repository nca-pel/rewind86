#!/usr/bin/env python3
"""
Baut das Schreibtischbild aus der generierten Vorlage docs/00-raw/finalpixel.jpg:

1. Zurückrechnen auf die Grundauflösung 384×216 (16:9, Amiga-Low-Res-artig), 32 Farben ohne Rasterung.
2. Nacharbeit auf Pixelebene mit Farben aus genau dieser Palette:
   - Schriftzug auf der Tastatur übermalt (Markenanklang)
   - Türschild: „COMPUTER / ZONE“ statt „NOVEMBER EVENING“
3. Ergebnis: src/assets/desk/desk.png (indiziert, 32 Farben) und desk-palette.json (Palette; die Overlays in
   src/ui/Desk.tsx verwenden nur diese Farben, ausgenommen das Monitorbild in C64-Farben).

Benötigt nur Python 3 und ImageMagick 7 (magick).
"""
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs/00-raw/finalpixel.jpg')
OUT = os.path.join(ROOT, 'src/assets/desk')
W, H = 384, 216
ACCENT = ['#c42a22', '#f2cf3a', '#5ec44a']

# 3×5-Pixelschrift (eigene Glyphen), Zeilen von oben, Bit 2 = linke Spalte
FONT = {
    'A': [2, 5, 7, 5, 5], 'B': [6, 5, 6, 5, 6], 'C': [3, 4, 4, 4, 3], 'E': [7, 4, 6, 4, 7],
    'I': [7, 2, 2, 2, 7], 'M': [5, 7, 7, 5, 5], 'N': [6, 5, 5, 5, 5], 'O': [2, 5, 5, 5, 2],
    'P': [6, 5, 6, 4, 4], 'R': [6, 5, 6, 5, 5], 'S': [3, 4, 2, 1, 6], 'T': [7, 2, 2, 2, 2],
    'U': [5, 5, 5, 5, 7], 'Y': [5, 5, 2, 2, 2], 'Z': [7, 1, 2, 4, 7], '8': [2, 5, 2, 5, 2],
    '6': [3, 4, 6, 5, 2], ' ': [0, 0, 0, 0, 0],
}


def magick(*args: str) -> str:
    return subprocess.run(['magick', *args], check=True, capture_output=True, text=True).stdout


def text_points(s: str, x0: int, y0: int, shear: float = 0.0) -> list[tuple[int, int]]:
    pts = []
    for i, ch in enumerate(s):
        rows = FONT[ch]
        for r, bits in enumerate(rows):
            for c in range(3):
                if bits & (4 >> c):
                    x = x0 + i * 4 + c
                    pts.append((x, y0 + r + int((x - x0) * shear)))
    return pts


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        base = os.path.join(tmp, 'base.png')
        # 29 Farben aus dem Bild + 3 feste Akzentfarben (Rot, Gelb, Grün) für LEDs und Markierungen = 32 wie beim Amiga
        reduced = os.path.join(tmp, 'reduced.png')
        magick(SRC, '-filter', 'box', '-resize', f'{W}x{H}!', '+dither', '-colors', '29', reduced)
        base = reduced
        txt = magick(base, '-unique-colors', '-depth', '8', 'txt:-')
        palette = []
        for line in txt.splitlines()[1:]:
            hexcol = line.split('#')[1][:6]
            palette.append('#' + hexcol.lower())
        palette += [c for c in ACCENT if c not in palette]

        def px(x: int, y: int) -> str:
            return '#' + magick(base, '-format', f'%[hex:p{{{x},{y}}}]', 'info:').strip()[:6].lower()

        def nearest(hexcol: str) -> str:
            r, g, b = (int(hexcol[i : i + 2], 16) for i in (1, 3, 5))
            return min(
                palette,
                key=lambda p: (int(p[1:3], 16) - r) ** 2 + (int(p[3:5], 16) - g) ** 2 + (int(p[5:7], 16) - b) ** 2,
            )

        draw: list[str] = []

        def rect(c: str, x0: int, y0: int, x1: int, y1: int) -> None:
            draw.extend(['-fill', c, '-draw', f'rectangle {x0},{y0} {x1},{y1}'])

        def points(c: str, pts: list[tuple[int, int]]) -> None:
            if pts:
                draw.extend(['-fill', c, '-draw', ' '.join(f'point {x},{y}' for x, y in pts)])

        # Tastatur: Schriftleiste über den Tasten in Gehäusefarbe
        rect(px(128, 121), 132, 115, 210, 118)

        # Türschild neu beschriften
        paper = px(346, 44)
        ink = nearest('#2a1c14')
        rect(paper, 342, 24, 375, 47)
        points(ink, text_points('COMPUTER', 343, 28))
        points(ink, text_points('ZONE', 351, 37))

        final = os.path.join(OUT, 'desk.png')
        magick(base, *draw, '-strip', f'PNG8:{final}')
        with open(os.path.join(OUT, 'desk-palette.json'), 'w') as f:
            json.dump(palette, f, indent=0)
            f.write('\n')
    print('fertig:', final)


if __name__ == '__main__':
    main()

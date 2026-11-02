#!/usr/bin/env python3
"""
Zeichnet das Clubbild (Jugendzentrum, Donnerstagabend) in Pixeln: 384×216, nur Farben aus der Palette des
Schreibtischbilds (src/assets/desk/desk-palette.json). Ergebnis: src/assets/desk/club.png.
Wird in src/ui/Desk.tsx gezeigt, solange Jan beim Clubabend ist (flags.atClub).
Benötigt Python 3 und ImageMagick 7 (magick).
"""
import os
import random
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/assets/desk/club.png')
W, H = 384, 216

P = dict(
    black='19120e', ink='2b2119', dark='392519', night='1b1e25', shade='2c2a2c', navy='2a314e', wood='945b34',
    woodDark='623c25', woodMid='6e4b32', woodDeep='4e311d', paper='e6c593', grey='555a65', greyDark='3c4350',
    blue='6e7c8d', beige='d8a56f', tan='af8964', brown='8d6f54', amber='eeb96f', orange='c47640', red='c42a22',
    yellow='f2cf3a', green='5ec44a', stone='504d4d',
)


def rgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


img = [[rgb(P['greyDark'])] * W for _ in range(H)]


def px(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        img[y][x] = rgb(P[c])


def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1):
        for x in range(x0, x1):
            px(x, y, c)


def disc(cx, cy, r, c):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r:
                px(x, y, c)


FONT = {
    'C': [3, 4, 4, 4, 3], 'O': [2, 5, 5, 5, 2], 'M': [5, 7, 7, 5, 5], 'P': [6, 5, 6, 4, 4],
    'U': [5, 5, 5, 5, 7], 'T': [7, 2, 2, 2, 2], 'E': [7, 4, 6, 4, 7], 'R': [6, 5, 6, 5, 5],
    'L': [4, 4, 4, 4, 7], 'B': [6, 5, 6, 5, 6], 'D': [6, 5, 5, 5, 6], 'N': [6, 5, 5, 5, 5],
    '8': [2, 5, 2, 5, 2], '6': [3, 4, 6, 5, 2], 'A': [2, 5, 7, 5, 5], 'I': [7, 2, 2, 2, 7],
    '4': [5, 5, 7, 1, 1], ' ': [0] * 5,
}


def text(s, x, y, c, scale=1):
    for i, ch in enumerate(s):
        for r, bits in enumerate(FONT[ch]):
            for b in range(3):
                if bits & (4 >> b):
                    rect(x + (i * 4 + b) * scale, y + r * scale, x + (i * 4 + b + 1) * scale, y + (r + 1) * scale, c)


rnd = random.Random(86)

# Wand und Boden
rect(0, 0, W, 140, 'greyDark')
rect(0, 0, W, 22, 'shade')
for y in range(22, 140, 4):  # feine Putzstruktur
    for x in range((y // 4) % 2 * 3, W, 7):
        px(x, y, 'stone')
rect(0, 118, W, 140, 'woodDeep')
rect(0, 118, W, 120, 'woodMid')
rect(0, 140, W, H, 'woodDark')
for y in range(144, H, 9):
    rect(0, y, W, y + 1, 'woodDeep')
for x in range(0, W, 38):
    for y in range(140, H, 9):
        rect(x + (y // 9 % 3) * 11, y, x + (y // 9 % 3) * 11 + 1, y + 9, 'woodDeep')

# Leuchtstofflampe und Lichtkegel
rect(110, 6, 270, 10, 'greyDark')
rect(112, 7, 268, 9, 'paper')
for i in range(0, 160, 2):
    px(112 + i, 11, 'brown')

# Fenster mit Regen und Laterne
rect(8, 22, 78, 108, 'dark')
rect(12, 26, 74, 104, 'night')
rect(41, 26, 45, 104, 'dark')
rect(12, 62, 74, 66, 'dark')
for _ in range(70):
    x, y = rnd.randrange(14, 72), rnd.randrange(28, 102)
    for k in range(4):
        px(x + k // 2, y + k, 'blue')
disc(24, 44, 3, 'yellow')
rect(23, 47, 25, 70, 'ink')
rect(8, 106, 82, 110, 'woodMid')

# Banner mit Schriftzug
rect(130, 20, 254, 42, 'dark')
rect(132, 22, 252, 40, 'paper')
text('COMPUTERCLUB', 138, 26, 'ink', 2)

# Pinnwand mit Zetteln
rect(284, 28, 366, 98, 'dark')
rect(287, 31, 363, 95, 'brown')
for (x, y, w, h, c) in [(292, 36, 20, 16, 'paper'), (318, 38, 18, 22, 'beige'), (342, 34, 16, 14, 'paper'),
                        (294, 60, 24, 18, 'amber'), (326, 68, 28, 20, 'paper'), (344, 54, 14, 10, 'blue')]:
    rect(x, y, x + w, y + h, c)
    for ly in range(y + 4, y + h - 2, 3):
        rect(x + 2, ly, x + w - 3, ly + 1, 'tan')
    px(x + w // 2, y + 1, 'red')
    px(x + w // 2 + 1, y + 1, 'red')

# Poster
rect(176, 56, 214, 100, 'dark')
rect(178, 58, 212, 98, 'navy')
rect(184, 66, 206, 84, 'green')
rect(188, 70, 202, 80, 'night')
text('C64', 186, 88, 'paper')

# Tische (Vorderansicht)
def table(x0, x1):
    rect(x0, 134, x1, 140, 'beige')
    rect(x0, 140, x1, 146, 'wood')
    rect(x0, 146, x1, 148, 'woodDark')
    rect(x0 + 6, 148, x0 + 12, 196, 'woodDark')
    rect(x1 - 12, 148, x1 - 6, 196, 'woodDark')


table(4, 178)
table(196, 380)

# Rechner auf dem linken Tisch (zwei C64 mit Monitor)
def setup(x, screen_c='navy'):
    rect(x, 104, x + 34, 132, 'tan')
    rect(x + 3, 107, x + 31, 126, 'dark')
    rect(x + 5, 109, x + 29, 124, screen_c)
    rect(x + 7, 111, x + 15, 112, 'blue')
    rect(x + 7, 114, x + 20, 115, 'blue')
    rect(x + 7, 117, x + 11, 119, 'blue')
    rect(x + 12, 126, x + 22, 128, 'greyDark')
    rect(x - 2, 128, x + 36, 134, 'beige')
    rect(x + 2, 129, x + 32, 131, 'brown')
    rect(x + 28, 107, x + 30, 108, 'green')


setup(16)
setup(66)
rect(114, 112, 134, 134, 'tan')  # Datasette/Floppy-Stapel
rect(116, 114, 132, 122, 'dark')
rect(118, 116, 123, 120, 'greyDark')
rect(125, 116, 130, 120, 'greyDark')
for i in range(3):
    rect(142, 126 - i * 3, 160, 129 - i * 3, ['red', 'navy', 'yellow'][i])  # Disketten
rect(146, 112, 150, 134, 'blue')  # Tasse
rect(146, 112, 150, 114, 'paper')

# Rechner und Leihset auf dem rechten Tisch
setup(210, 'night')
rect(250, 118, 276, 134, 'grey')  # BTX-Leihset
rect(252, 120, 274, 124, 'greyDark')
rect(254, 128, 258, 130, 'green')
rect(262, 128, 266, 130, 'yellow')

# Herr Brandt (Strickjacke, Brille, Thermoskanne)
rect(298, 96, 344, 134, 'woodMid')       # Oberkörper
rect(298, 96, 300, 134, 'woodDeep')
rect(342, 96, 344, 134, 'woodDeep')
rect(318, 98, 324, 134, 'paper')         # Hemd
for by in range(104, 130, 8):
    px(321, by, 'ink')
disc(321, 84, 10, 'beige')                # Kopf
rect(311, 74, 332, 79, 'blue')            # graues Haar
rect(311, 78, 313, 88, 'blue')
rect(329, 78, 331, 88, 'blue')
rect(313, 84, 319, 88, 'ink')             # Brille
rect(323, 84, 329, 88, 'ink')
rect(314, 85, 318, 87, 'amber')
rect(324, 85, 328, 87, 'amber')
rect(319, 85, 323, 86, 'ink')
rect(317, 92, 325, 93, 'orange')          # Mund
rect(302, 120, 330, 126, 'woodMid')       # Arm auf dem Tisch
rect(302, 126, 312, 130, 'beige')         # Hand
# Thermoskanne und Becher
rect(350, 112, 362, 134, 'blue')
rect(350, 108, 362, 112, 'red')
rect(352, 120, 360, 121, 'grey')
rect(284, 124, 292, 134, 'paper')
rect(292, 126, 294, 130, 'paper')
rect(285, 125, 291, 128, 'ink')
for k in range(2):  # Dampf
    px(288 + k, 120 - k * 2, 'blue')
    px(289 - k, 117 - k * 2, 'blue')

# Stuhl für Jan (Rückenlehne im Vordergrund) und Jacke
rect(180, 150, 218, 158, 'woodDark')
rect(182, 152, 216, 156, 'wood')
rect(186, 158, 190, 200, 'woodDark')
rect(208, 158, 212, 200, 'woodDark')
rect(184, 160, 214, 176, 'navy')          # nasse Jacke über der Lehne
rect(184, 160, 214, 163, 'greyDark')
rect(190, 166, 194, 176, 'night')
px(200, 172, 'blue')
px(204, 168, 'blue')

# Boden im Vordergrund: Pfütze Regenwasser vom Eingang
rect(300, 190, 340, 194, 'blue')
rect(304, 189, 336, 190, 'blue')

with tempfile.NamedTemporaryFile(suffix='.ppm', delete=False) as f:
    f.write(f'P6 {W} {H} 255\n'.encode())
    for row in img:
        f.write(bytes(v for p in row for v in p))
    tmp = f.name
subprocess.run(['magick', tmp, '-type', 'palette', f'png8:{OUT}'], check=True)
os.unlink(tmp)
print(OUT)

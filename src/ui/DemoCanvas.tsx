/** Canvas-Effekte der INTRUDER-Demo: Rasterbalken, Sprites, Laufschrift, Rahmen-Scroller, Sternenfeld. */
import { useEffect, useRef } from 'react';
import { INTRUDER_SCREENS } from '../sim/apps/intruder';
import { C64_PALETTE } from './palette';

const W = 384;
const H = 272;
const BX = 32;
const BY = 36;

export function DemoCanvas({ screen, reduced }: { screen: number; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    const text = INTRUDER_SCREENS[screen].scroller;
    const stars = Array.from({ length: 90 }, (_, i) => ({
      x: (i * 97) % W,
      y: (i * 53) % H,
      z: 1 + (i % 3),
    }));
    let frame = 0;
    let raf = 0;

    const draw = () => {
      const t = frame;
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      g.font = '8px "Press Start 2P", monospace';
      g.textBaseline = 'top';

      if (screen === 0) {
        for (let i = 0; i < 7; i++) {
          const y = BY + 100 + Math.sin((t + i * 7) / 18) * 70;
          const col = C64_PALETTE[[2, 8, 7, 1, 7, 8, 2][i]];
          g.fillStyle = col;
          g.fillRect(0, y, W, 4);
        }
        g.font = '24px "Press Start 2P", monospace';
        g.fillStyle = C64_PALETTE[Math.floor(t / 6) % 16 || 1];
        g.fillText('INTRUDER', BX + 16, BY + 20);
        for (let i = 0; i < 8; i++) {
          const x = BX + 20 + i * 36;
          const y = BY + 120 + Math.abs(Math.sin((t + i * 10) / 15)) * -40;
          g.fillStyle = C64_PALETTE[3 + (i % 10)];
          g.beginPath();
          g.arc(x, y, 7, 0, Math.PI * 2);
          g.fill();
        }
      } else if (screen === 1) {
        // "Offener Rahmen": Raster und Text im Bereich, in dem normalerweise der Rahmen liegt
        for (let y = 0; y < H; y += 4) {
          if (y > BY && y < H - BY) continue;
          g.fillStyle = C64_PALETTE[[6, 14, 3, 1, 3, 14][Math.floor((y + t) / 4) % 6]];
          g.fillRect(0, y, W, 3);
        }
        g.fillStyle = C64_PALETTE[6];
        g.fillRect(BX, BY, W - 2 * BX, H - 2 * BY);
        g.font = '16px "Press Start 2P", monospace';
        g.fillStyle = C64_PALETTE[1];
        g.fillText('NO BORDER', BX + 48, BY + 80);
      } else {
        for (const s of stars) {
          const x = (s.x - t * s.z + W * 10) % W;
          g.fillStyle = C64_PALETTE[s.z === 3 ? 1 : s.z === 2 ? 15 : 11];
          g.fillRect(x, s.y, s.z, 1);
        }
        g.font = '32px "Press Start 2P", monospace';
        g.fillStyle = C64_PALETTE[7];
        g.fillText('1001', BX + 96, BY + 70);
      }

      // Laufschrift (Teil 2: unten im Rahmen)
      g.font = '8px "Press Start 2P", monospace';
      const y = screen === 1 ? H - 22 : H - BY - 20;
      if (reduced) {
        g.fillStyle = C64_PALETTE[1];
        const words = text.split(' ');
        let line = '';
        let ly = screen === 1 ? H - 30 : H - BY - 40;
        for (const w of words) {
          if ((line + w).length > 44) {
            g.fillText(line, 8, ly);
            ly += 10;
            line = '';
          }
          line += w + ' ';
        }
        g.fillText(line, 8, ly);
      } else {
        const x = W - ((t * 2) % (text.length * 8 + W));
        for (let i = 0; i < text.length; i++) {
          g.fillStyle = C64_PALETTE[[1, 7, 13, 3, 14][(i + Math.floor(t / 4)) % 5]];
          g.fillText(text[i], x + i * 8, y + Math.sin((x + i * 8) / 20) * 3);
        }
      }
      frame++;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [screen, reduced]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="demo-canvas"
      role="img"
      aria-label={`INTRUDER-Demo, Teil »${INTRUDER_SCREENS[screen].title}«. Laufschrift: ${INTRUDER_SCREENS[screen].scroller}`}
    />
  );
}

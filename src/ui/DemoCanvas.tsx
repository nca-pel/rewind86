/** Canvas der INTRUDER-Demo: acht Teile (Zeichenroutinen in demoParts.ts) plus Laufschrift. */
import { useEffect, useRef } from 'react';
import { INTRUDER_SCREENS } from '../sim/apps/intruder';
import { BY, H, PART_DRAWERS, W, text } from './demoParts';

export function DemoCanvas({ screen, reduced }: { screen: number; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    const scroller = INTRUDER_SCREENS[screen].scroller;
    // Bei reduzierter Bewegung ein einzelnes, aussagekräftiges Standbild
    let frame = reduced ? 90 : 0;
    let raf = 0;

    const draw = () => {
      const t = frame;
      g.save();
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      PART_DRAWERS[screen](g, t);
      g.restore();

      // Laufschrift (Teil 2: durch die Bildmitte)
      const y = screen === 1 ? H / 2 - 4 : H - BY - 20;
      if (reduced) {
        const words = scroller.split(' ');
        let line = '';
        let ly = screen === 1 ? H / 2 + 50 : H - BY - 40;
        for (const w of words) {
          if ((line + w).length > 44) {
            text(g, line, 8, ly, 1);
            ly += 10;
            line = '';
          }
          line += w + ' ';
        }
        text(g, line, 8, ly, 1);
      } else {
        const x = W - ((t * 2) % (scroller.length * 8 + W));
        text(
          g,
          scroller,
          x,
          y,
          (i) => [1, 7, 13, 3, 14][(i + Math.floor(t / 4)) % 5],
          1,
          (i) => Math.round(Math.sin((x + i * 8) / 20) * (screen === 1 ? 14 : 3)),
        );
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
      aria-label={`INTRUDER-Demo, Teil »${INTRUDER_SCREENS[screen].title}« (${screen + 1}/${INTRUDER_SCREENS.length}). ${INTRUDER_SCREENS[screen].effect} Laufschrift: ${INTRUDER_SCREENS[screen].scroller}`}
    />
  );
}

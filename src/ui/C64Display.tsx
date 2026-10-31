/**
 * Pixelgenaue C64-Anzeige: Bildschirmspeicher + eigener Zeichensatz → 384×272-Bild (PAL) →
 * optional Röhreneffekte → Canvas in Gerätegröße. Darunter liegt eine unsichtbare Textebene für
 * Screenreader und Tests.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CURSOR_BLINK_MS,
  FRAME_ASPECT,
  FRAME_H,
  FRAME_W,
  cloneVideo,
  drawToCanvas,
  palBleed,
  printBytes,
  renderFrame,
  stringToPetscii,
  stripeBorder,
  videoLines,
  type VideoState,
} from '../c64';
import type { C64View } from '../sim/c64';

/** Farben der Rahmenstreifen beim „Flackern“ (z. B. im Intro des unveröffentlichten Spiels) */
const FLASH_COLORS = [2, 7, 4, 0, 10];

interface Props {
  view: C64View;
  /** Getippte, noch nicht mit RETURN bestätigte Eingabe */
  preview: string;
  crt: boolean;
  reduced: boolean;
  machineName: string;
  children?: ReactNode;
}

/** Bildschirm inkl. Live-Eingabe zusammensetzen; liefert auch die Cursorposition danach */
function compose(
  view: C64View,
  preview: string,
): { video: VideoState; cursor: { x: number; y: number } | null } {
  if (!view.cursor) return { video: view.video, cursor: null };
  if (!preview) return { video: view.video, cursor: view.cursor };
  const v = cloneVideo(view.video);
  v.cx = view.cursor.x;
  v.cy = view.cursor.y;
  v.quote = false;
  printBytes(v, stringToPetscii(preview));
  return { video: v, cursor: { x: v.cx, y: v.cy } };
}

export function C64Display({ view, preview, crt, reduced, machineName, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeRef = useRef<HTMLCanvasElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: FRAME_W, h: FRAME_H });
  const [blinkOn, setBlinkOn] = useState(true);
  const [flashSeed, setFlashSeed] = useState(0);
  const [powerAnim, setPowerAnim] = useState<'' | 'on' | 'off'>('');
  const prevPower = useRef(view.powerOn);

  const { video, cursor } = useMemo(() => compose(view, preview), [view, preview]);
  const lines = useMemo(() => (view.powerOn ? videoLines(video, cursor) : []), [view.powerOn, video, cursor]);

  // Ein-/Ausschalten: Bildröhre zieht auf bzw. fällt zu einem Strich zusammen
  useEffect(() => {
    if (prevPower.current === view.powerOn) return;
    prevPower.current = view.powerOn;
    if (reduced) return;
    setPowerAnim(view.powerOn ? 'on' : 'off');
    const id = window.setTimeout(() => setPowerAnim(''), 700);
    return () => window.clearTimeout(id);
  }, [view.powerOn, reduced]);

  // Cursor blinkt im Takt des System-Interrupts; nach jeder Eingabe beginnt er sichtbar
  const cursorKey = cursor ? `${cursor.x},${cursor.y}` : '';
  useEffect(() => {
    setBlinkOn(true);
    if (!cursorKey || reduced) return;
    const id = window.setInterval(() => setBlinkOn((b) => !b), CURSOR_BLINK_MS);
    return () => window.clearInterval(id);
  }, [cursorKey, reduced, preview]);

  // Rahmenflackern als Rasterstreifen
  const flash = !!view.flash && view.powerOn && !reduced;
  useEffect(() => {
    if (!flash) return;
    const id = window.setInterval(() => setFlashSeed((s) => s + 1), 60);
    return () => window.clearInterval(id);
  }, [flash]);

  // Canvas an die tatsächliche Größe in Gerätepixeln anpassen
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.max(FRAME_W / 2, Math.round(el.clientWidth * dpr));
      const h = Math.max(FRAME_H / 2, Math.round(el.clientHeight * dpr));
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    if (!nativeRef.current) {
      nativeRef.current = document.createElement('canvas');
      nativeRef.current.width = FRAME_W;
      nativeRef.current.height = FRAME_H;
    }
    const native = nativeRef.current;
    const ng = native.getContext('2d');
    if (!ng) return;
    const img = ng.createImageData(FRAME_W, FRAME_H);
    renderFrame(img.data, video, {
      off: !view.powerOn,
      cursor: cursor ? { ...cursor, on: blinkOn } : null,
      borderLines: flash ? stripeBorder(flashSeed, FLASH_COLORS) : null,
    });
    const effects = crt && view.powerOn;
    if (effects) palBleed(img.data, FRAME_W, FRAME_H);
    ng.putImageData(img, 0, 0);
    scratchRef.current ??= document.createElement('canvas');
    drawToCanvas(g, native, { crt: effects }, scratchRef.current);
  }, [video, cursor, blinkOn, flash, flashSeed, crt, view.powerOn, size]);

  return (
    <div
      ref={wrapRef}
      className={`c64-display${powerAnim ? ` power-${powerAnim}` : ''}${crt && !reduced ? ' crt' : ''}`}
      style={{ aspectRatio: String(FRAME_ASPECT) }}
    >
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        className="c64-canvas"
        role="img"
        aria-label={`Bildschirm des ${machineName}${view.powerOn ? '' : ' (ausgeschaltet)'}`}
      />
      {children}
      <pre className="c64-text" data-testid="c64-screen">
        {view.powerOn ? lines.join('\n') : 'Monitor aus'}
      </pre>
    </div>
  );
}

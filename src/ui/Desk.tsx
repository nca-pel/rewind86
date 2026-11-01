/**
 * Jans Schreibtisch als Pixelgrafik-Szene im Stil der Point-and-Click-Adventures Ende der 80er.
 *
 * - Grundbild: 384×216 Pixel, 32 Farben (src/assets/desk/desk.png, gebaut von scripts/build-desk.py aus der
 *   generierten Vorlage docs/00-raw/finalpixel.jpg).
 * - Alles liegt in EINEM SVG in diesen Pixelkoordinaten: Bild, Klickflächen (DESK_AREAS), Zustands-Sprites.
 *   Dadurch passen Klickflächen auf jeder Auflösung; die Bühne skaliert in ganzen Gerätepixeln (scharf).
 * - Hover/Fokus: Umriss des Gegenstands + Name in der Zeile unter dem Bild; „Namen“ (Taste N) zeigt alle Namen.
 * - Kleine Animationen: klingelndes Telefon, LEDs. Fenster, Radio, Päckchen (nur Kulisse) und Hörer bleiben wie im Bild.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import deskUrl from '../assets/desk/desk.png';
import { OBJECT_BY_ID } from '../content/objects';
import type { GameState } from '../engine/types';
import { renderC64 } from '../sim/c64';
import { Hotspot } from './Hotspot';
import { C64_PALETTE } from './palette';

export const DESK_W = 384;
export const DESK_H = 216;

/** Farben aus der Palette des Grundbilds (src/assets/desk/desk-palette.json) */
const C = {
  black: '#19120e',
  ink: '#2b2119',
  dark: '#392519',
  woodLight: '#945b34',
  paper: '#e6c593',
  grey: '#555a65',
  greyDark: '#3c4350',
  night: '#2a314e',
  red: '#c42a22',
  yellow: '#f2cf3a',
  green: '#5ec44a',
};

/** Klickflächen in Bildpixeln (eng am Umriss, am Bild vermessen). Reihenfolge = Zeichenreihenfolge. */
export const DESK_AREAS: Record<string, string> = {
  window: 'M0 0H64V112L0 118Z',
  door: 'M303 0H384V178H303Z',
  radio: 'M40 106L72 104L83 112V136L62 151L40 151Z',
  monitor: 'M145 52H211V112H145Z',
  c64: 'M121 112H226V152H121Z',
  drive1541: 'M253 105H311V130H253Z',
  tape: 'M284 92H306V108H284Z',
  coupler: 'M254 85H284V107H254Z',
  phone: 'M211 92H251V126H211Z',
  notebook: 'M74 143L100 136L125 157L97 167L84 164Z',
  magazine: 'M243 152L272 137L300 143L276 163Z',
  drawer: 'M229 176H317V203H229Z',
};

/** Bildschirmfläche des Monitors */
const SCREEN = { x: 150, y: 62, w: 53, h: 42 };
/** Hörer auf der Gabel */
const HANDSET = 'M214 96L219 93L245 93L250 96L250 104L244 105L242 99L222 99L219 105L213 104Z';

const DISKS: Record<string, { x: number; label: string }> = {
  disk_archive: { x: 130, label: C.night },
  disk_1001: { x: 149, label: C.red },
  disk_game: { x: 168, label: C.yellow },
};
const DRAWER_DISKS: Record<string, number> = { disk_1001: 240, disk_archive: 262, disk_game: 284 };

/** Abweichende Position der Namensschilder, wo Gegenstände eng beieinander stehen */
const NAME_POS: Record<string, [number, number]> = {
  phone: [226, 132],
  coupler: [262, 80],
  tape: [312, 88],
  drive1541: [282, 138],
  door: [344, 70],
};

/** Mittelpunkt der Begrenzung eines Pfads aus M/L/H/V-Befehlen (für Namensschilder) */
export function areaCenter(d: string): [number, number] {
  const xs: number[] = [];
  const ys: number[] = [];
  let x = 0;
  let y = 0;
  for (const m of d.matchAll(/([MLHV])([^MLHVZ]*)/g)) {
    const v = m[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (m[1] === 'M' || m[1] === 'L') [x, y] = v;
    else if (m[1] === 'H') x = v[0];
    else y = v[0];
    xs.push(x);
    ys.push(y);
  }
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

/** Rechteck in Bildpixeln */
function R({
  x,
  y,
  w,
  h,
  c,
  className,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  className?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} fill={c} className={className} />;
}

/** Diskette flach auf dem Tisch (15×10 Pixel) */
function TableDisk({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <R x={x + 1} y={y + 10} w={15} h={1} c={C.dark} />
      <R x={x} y={y} w={15} h={10} c={C.black} />
      <R x={x + 2} y={y + 1} w={11} h={3} c={C.paper} />
      <R x={x + 2} y={y + 1} w={11} h={1} c={label} />
      <R x={x + 6} y={y + 5} w={3} h={2} c={C.grey} />
      <R x={x + 6} y={y + 8} w={3} h={2} c={C.greyDark} />
    </g>
  );
}

/** Monitorbild: Rand- und Hintergrundfarbe des C64, Textzeilen angedeutet (lesbar im C64-Fenster) */
function Screen({ state }: { state: GameState }) {
  const c64 = renderC64(state);
  const s = SCREEN;
  if (!c64.powerOn)
    return (
      <g>
        <R x={s.x} y={s.y} w={s.w} h={s.h} c={C.greyDark} />
        <R x={s.x + 1} y={s.y + 1} w={s.w - 2} h={s.h - 2} c={C.black} />
        <R x={s.x + 4} y={s.y + 3} w={10} h={1} c={C.grey} />
      </g>
    );
  const ix = s.x + 4;
  const iy = s.y + 4;
  const iw = s.w - 8;
  const ih = s.h - 8;
  const fg = C64_PALETTE[c64.video.text];
  // 25 Textzeilen auf ih Pixel: jede zweite belegte Zeile als 1-Pixel-Strich, Länge nach Textlänge
  return (
    <g>
      <R x={s.x} y={s.y} w={s.w} h={s.h} c={C64_PALETTE[c64.video.border]} />
      <R x={ix} y={iy} w={iw} h={ih} c={C64_PALETTE[c64.video.background]} />
      {c64.lines.slice(-25).map((l, i) => {
        const len = l.trimEnd().length;
        if (!len || i % 2) return null;
        return (
          <R
            key={i}
            x={ix + 1}
            y={iy + 1 + Math.floor((i * (ih - 2)) / 25)}
            w={Math.max(1, Math.round((len * (iw - 2)) / 40))}
            h={1}
            c={fg}
          />
        );
      })}
    </g>
  );
}

interface SceneProps {
  state: GameState;
  onSelect: (id: string) => void;
  selected: string | null;
  /** Ausschnitt (Detailansicht); ohne Angabe die ganze Szene */
  viewBox?: string;
  interactive?: boolean;
  label?: string;
  showNames?: boolean;
  onHover?: (id: string | null) => void;
  width?: number;
}

export function DeskScene({
  state,
  onSelect,
  selected,
  viewBox,
  interactive = true,
  label = 'Jans Schreibtisch – klickbare Gegenstände',
  showNames = false,
  onHover,
  width,
}: SceneProps) {
  const loc = state.itemLocations;
  const t = state.telecom;
  const drawerOpen = state.objectStates.drawer.open === true;
  const inDrive = Object.entries(loc).find(([, l]) => l === 'drive')?.[0];
  const magVisible = loc.magazine === 'desk';
  const uid = useId().replace(/:/g, '');
  const ref = (n: string) => `${n}-${uid}`;

  const spot = (key: string, children: ReactNode = null, area = DESK_AREAS[key]) =>
    interactive ? (
      <Hotspot
        key={key}
        id={key}
        label={`${OBJECT_BY_ID[key].short} ansehen`}
        onSelect={onSelect}
        selected={selected === key}
        onHover={onHover}
      >
        {children}
        <path className="hs-area" d={area} />
      </Hotspot>
    ) : (
      <g key={key}>{children}</g>
    );

  // Hörer als Pfad mit dem Bild als Muster: Begrenzung = Hörer (ein Clip würde das ganze Bild mitzählen)
  const handsetImg = <path d={HANDSET} fill={`url(#${ref('img')})`} />;

  const named = interactive && showNames;
  const visibleAreas = (k: string) => k !== 'magazine' || magVisible;

  return (
    <svg
      className={interactive ? 'desk-svg desk-scene' : 'device-crop'}
      viewBox={viewBox ?? `0 0 ${DESK_W} ${DESK_H}`}
      width={width}
      height={width ? Math.round((width * DESK_H) / DESK_W) : undefined}
      role={interactive ? 'group' : 'img'}
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <defs>
        <pattern id={ref('img')} width={DESK_W} height={DESK_H} patternUnits="userSpaceOnUse">
          <image href={deskUrl} width={DESK_W} height={DESK_H} />
        </pattern>
      </defs>

      <image href={deskUrl} width={DESK_W} height={DESK_H} className="desk-image" />

      {spot('window')}
      {spot('door')}

      {spot('radio')}

      {spot(
        'monitor',
        <g>
          <Screen state={state} />
          {state.computer.powerOn && <R x={203} y={108} w={2} h={1} c={C.green} />}
        </g>,
      )}

      {spot('c64', state.computer.powerOn && <R x={217} y={118} w={2} h={1} c={C.red} />)}

      {spot(
        'drive1541',
        <g>
          {inDrive && <R x={276} y={120} w={14} h={2} c={C.black} />}
          {state.computer.driveOn && <R x={303} y={121} w={2} h={1} c={C.green} className="blink" />}
        </g>,
      )}

      {spot('tape')}

      {spot(
        'coupler',
        <g>{state.objectStates.coupler.carrier && <R x={279} y={103} w={2} h={1} c={C.green} />}</g>,
      )}

      {spot(
        'phone',
        <g>
          {t.handset === 'cradle' && t.ringing && <g className="ring">{handsetImg}</g>}
          {t.ringing && (
            <g className="ring-mark" pointerEvents="none">
              <R x={229} y={83} w={2} h={5} c={C.yellow} />
              <R x={229} y={89} w={2} h={2} c={C.yellow} />
            </g>
          )}
        </g>,
      )}

      {spot('notebook')}

      {/* Zeitschrift: so wie im Bild (im offenen Päckchen, das nur Kulisse ist) */}
      {magVisible && spot('magazine')}

      {/* Disketten vorn auf dem Tisch */}
      {Object.entries(DISKS).map(
        ([k, d]) =>
          loc[k] === 'desk' &&
          spot(k, <TableDisk x={d.x} y={154} label={d.label} />, `M${d.x} 154H${d.x + 15}V164H${d.x}Z`),
      )}

      {/* Schublade: herausgezogen, Inhalt von oben sichtbar */}
      {spot(
        'drawer',
        drawerOpen && (
          <g pointerEvents="none">
            <R x={229} y={176} w={88} h={10} c={C.black} />
            <R x={231} y={177} w={84} h={8} c={C.ink} />
            <R x={229} y={186} w={88} h={1} c={C.woodLight} />
          </g>
        ),
      )}
      {drawerOpen &&
        Object.entries(DRAWER_DISKS).map(
          ([k, x]) =>
            loc[k] === 'drawer' &&
            spot(
              k,
              <g>
                <R x={x} y={177} w={18} h={7} c={C.black} />
                <R x={x + 2} y={178} w={14} h={2} c={C.paper} />
                <R x={x + 2} y={178} w={14} h={1} c={DISKS[k].label} />
              </g>,
              `M${x} 177H${x + 18}V184H${x}Z`,
            ),
        )}

      {named &&
        Object.keys(DESK_AREAS)
          .filter(visibleAreas)
          .map((k) => {
            const [cx, cy] = NAME_POS[k] ?? areaCenter(DESK_AREAS[k]);
            return (
              <text key={k} x={cx} y={cy + 2} className="desk-name" textAnchor="middle" pointerEvents="none">
                {OBJECT_BY_ID[k].short}
              </text>
            );
          })}
    </svg>
  );
}

/** Breite der Bühne: so groß wie möglich, bei genug Platz in ganzen Gerätepixeln je Bildpixel (scharf) */
function useStageWidth(ref: RefObject<HTMLDivElement | null>): number {
  const [w, setW] = useState(DESK_W * 2);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth;
      if (!avail) return;
      const maxH = window.innerHeight * (window.matchMedia('(max-width: 760px)').matches ? 0.42 : 0.52);
      const s = Math.min(avail / DESK_W, maxH / DESK_H);
      const dpr = window.devicePixelRatio || 1;
      const dev = s * dpr;
      // ganze Gerätepixel je Bildpixel, solange das höchstens 15 % Größe kostet
      const whole = Math.floor(dev);
      const scale = whole >= 2 && whole / dev >= 0.85 ? whole / dpr : s;
      setW(Math.floor(DESK_W * scale));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
  return w;
}

export function Desk({
  state,
  onSelect,
  selected,
}: {
  state: GameState;
  onSelect: (id: string) => void;
  selected: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useStageWidth(ref);
  const [hover, setHover] = useState<string | null>(null);
  const [showNames, setShowNames] = useState(false);
  const name = hover ?? selected;

  // Taste N blendet alle Namen ein und aus (nicht in Eingabefeldern)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') setShowNames((v) => !v);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div className="desk-stage" ref={ref}>
      <DeskScene
        state={state}
        onSelect={onSelect}
        selected={selected}
        showNames={showNames}
        onHover={setHover}
        width={width}
      />
      <div className="desk-bar" style={{ width }}>
        <span className="desk-caption" data-testid="desk-caption">
          {name && OBJECT_BY_ID[name] ? OBJECT_BY_ID[name].short : 'Jans Schreibtisch'}
        </span>
        <button
          type="button"
          className="desk-names"
          aria-pressed={showNames}
          onClick={() => setShowNames((v) => !v)}
          title="Alle Gegenstände benennen (Taste N)"
          data-testid="desk-names"
        >
          Namen
        </button>
      </div>
    </div>
  );
}

/**
 * Schreibtisch in Pixelgrafik im Stil der Heimcomputerspiele von 1986: 320×205 Pixel, nur die 16 Farben der Palette,
 * Rasterung (Dithering) statt Verläufen, harte Kanten. Gleiche Hotspots und Zustände wie die realistische Ansicht.
 */
import type { ReactNode } from 'react';
import { OBJECT_BY_ID } from '../content/objects';
import { charset, textToScreen } from '../c64';
import { isReachable } from '../engine/resolve';
import type { GameState } from '../engine/types';
import { renderC64 } from '../sim/c64';
import { Hotspot } from './Hotspot';
import { C64_PALETTE } from './palette';

interface Props {
  state: GameState;
  onSelect: (id: string) => void;
  selected: string | null;
}

const P = (i: number) => C64_PALETTE[i];
type Fill = number | string;
const fill = (c: Fill) => (typeof c === 'number' ? P(c) : c);

/** Pixel-Rechteck */
function R({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: Fill }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill(c)} />;
}

/** Text im eigenen 8×8-Zeichensatz als Pixel-Pfad */
function PText({ s, x, y, c }: { s: string; x: number; y: number; c: Fill }) {
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
  return <path d={d} fill={fill(c)} />;
}

/** Gerät mit schwarzem Rand, heller Fläche und Schatten rechts/unten (klassischer Pixel-Look) */
function Box({
  x,
  y,
  w,
  h,
  body,
  shade,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  body: number;
  shade: number;
  children?: ReactNode;
}) {
  return (
    <g>
      <R x={x} y={y} w={w} h={h} c={0} />
      <R x={x + 1} y={y + 1} w={w - 2} h={h - 2} c={body} />
      <R x={x + w - 3} y={y + 1} w={2} h={h - 2} c={shade} />
      <R x={x + 1} y={y + h - 3} w={w - 2} h={2} c={shade} />
      <R x={x + 1} y={y + 1} w={w - 4} h={1} c={1} />
      {children}
    </g>
  );
}

const DISK_COLOR: Record<string, number> = { disk_game: 7, disk_1001: 2, disk_archive: 5 };

function PixelDisk({ x, y, id }: { x: number; y: number; id: string }) {
  return (
    <g>
      <R x={x} y={y} w={24} h={24} c={0} />
      <R x={x + 1} y={y + 1} w={22} h={22} c={11} />
      <R x={x + 3} y={y + 1} w={18} h={8} c={DISK_COLOR[id] ?? 1} />
      <R x={x + 5} y={y + 4} w={9} h={1} c={0} />
      <R x={x + 5} y={y + 6} w={6} h={1} c={0} />
      <R x={x + 9} y={y + 11} w={6} h={6} c={12} />
      <R x={x + 11} y={y + 13} w={2} h={2} c={0} />
      <R x={x + 8} y={y + 17} w={8} h={6} c={12} />
      <R x={x + 12} y={y + 19} w={2} h={3} c={0} />
    </g>
  );
}

export function DeskPixel({ state, onSelect, selected }: Props) {
  const c64 = renderC64(state);
  const loc = state.itemLocations;
  const t = state.telecom;
  const drawerOpen = state.objectStates.drawer.open === true;
  const pkgOpen = state.objectStates.package.open === true;
  const radioOn = state.objectStates.radio.on === true;
  const hour = parseInt(state.gameClock.slice(11, 13), 10);
  const dark = hour >= 17 || hour < 7;
  const inDrive = Object.entries(loc).find(([, l]) => l === 'drive')?.[0];
  const hs = (id: string) => ({
    id,
    label: `${OBJECT_BY_ID[id].short} ansehen`,
    onSelect,
    selected: selected === id,
  });
  const screenColor = c64.powerOn ? c64.video.background : 0;
  const borderColor = c64.powerOn ? c64.video.border : 11;
  const wall = dark ? 11 : 9;

  // Holztischplatte: Zeilenweise Trapez, Maserung durch Rasterung
  const desk: ReactNode[] = [];
  for (let y = 80; y < 192; y++) {
    const k = (y - 80) / 112;
    const x0 = Math.round(13 - 13 * k);
    const band = y < 100 ? 'url(#d-9-0)' : y < 140 ? 9 : y < 170 ? 'url(#d-9-8)' : 8;
    desk.push(<R key={y} x={x0} y={y} w={320 - 2 * x0} h={1} c={band} />);
  }
  const grain = [
    [30, 112, 40],
    [140, 120, 60],
    [230, 134, 50],
    [60, 150, 70],
    [180, 158, 40],
    [20, 176, 60],
    [250, 180, 40],
  ];

  // Breadbin-Gehäuse: Trapez
  const bread: ReactNode[] = [];
  for (let y = 106; y < 132; y++) {
    const k = (y - 106) / 25;
    const x0 = Math.round(86 - 9 * k);
    const w = Math.round(116 + 18 * k);
    bread.push(<R key={`b${y}`} x={x0} y={y} w={w} h={1} c={12} />);
    bread.push(<R key={`l${y}`} x={x0} y={y} w={1} h={1} c={0} />);
    bread.push(<R key={`r${y}`} x={x0 + w - 1} y={y} w={1} h={1} c={0} />);
  }

  return (
    <svg
      className="desk-svg pixel"
      viewBox="0 0 320 205"
      role="group"
      aria-label="Jans Schreibtisch – klickbare Gegenstände"
      shapeRendering="crispEdges"
    >
      <defs>
        {(
          [
            [9, 0],
            [9, 8],
            [11, 0],
            [6, 14],
          ] as const
        ).map(([a, b]) => (
          <pattern key={`${a}-${b}`} id={`d-${a}-${b}`} width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill={P(a)} />
            <rect width="1" height="1" fill={P(b)} />
            <rect x="1" y="1" width="1" height="1" fill={P(b)} />
          </pattern>
        ))}
      </defs>

      {/* Wand mit Tapetenmuster */}
      <R x={0} y={0} w={320} h={82} c={wall} />
      {Array.from({ length: 10 }).map((_, r) =>
        Array.from({ length: 40 }).map((__, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * 8 + (r % 2) * 4}
            y={r * 8 + 3}
            width={1}
            height={1}
            fill={P(dark ? 0 : 11)}
          />
        )),
      )}
      <R x={0} y={76} w={320} h={4} c="url(#d-11-0)" />

      {/* Fenster */}
      <Hotspot {...hs('window')}>
        <R x={12} y={5} w={60} h={47} c={0} />
        <R x={14} y={7} w={56} h={43} c={dark ? 0 : 14} />
        {!dark && <R x={14} y={26} w={56} h={24} c="url(#d-6-14)" />}
        {!dark && <R x={20} y={11} w={14} h={3} c={1} />}
        {!dark && <R x={24} y={9} w={8} h={2} c={1} />}
        {!dark && <R x={50} y={15} w={12} h={3} c={1} />}
        <R x={14} y={40} w={6} h={10} c={11} />
        <R x={22} y={36} w={8} h={14} c={12} />
        <R x={46} y={38} w={10} h={12} c={11} />
        <R x={58} y={42} w={12} h={8} c={12} />
        {dark && (
          <>
            <R x={56} y={12} w={4} h={4} c={7} />
            <R x={24} y={14} w={1} h={1} c={1} />
            <R x={34} y={22} w={1} h={1} c={1} />
            <R x={48} y={10} w={1} h={1} c={1} />
            <R x={24} y={40} w={2} h={2} c={7} />
            <R x={50} y={42} w={2} h={2} c={7} />
          </>
        )}
        <R x={40} y={7} w={3} h={43} c={0} />
        <R x={14} y={27} w={56} h={3} c={0} />
      </Hotspot>

      {/* Poster (fiktiv): Weltraum mit Raumschiff */}
      <R x={83} y={10} w={38} h={48} c={0} />
      <R x={85} y={12} w={34} h={44} c={6} />
      <PText s="SPACE" x={81} y={14} c={7} />
      <PText s="RIDER" x={81} y={23} c={7} />
      <R x={92} y={40} w={18} h={3} c={1} />
      <R x={96} y={36} w={10} h={4} c={15} />
      <R x={99} y={33} w={4} h={3} c={14} />
      <R x={94} y={43} w={4} h={3} c={8} />
      <R x={104} y={43} w={4} h={3} c={8} />
      {[
        [88, 30],
        [112, 28],
        [90, 50],
        [114, 48],
        [106, 52],
      ].map(([sx, sy]) => (
        <R key={`${sx}${sy}`} x={sx} y={sy} w={1} h={1} c={1} />
      ))}

      {/* Tür */}
      <Hotspot {...hs('door')}>
        <R x={282} y={3} w={35} h={80} c={0} />
        <R x={284} y={5} w={31} h={76} c={9} />
        <R x={288} y={26} w={23} h={26} c="url(#d-9-8)" />
        <R x={288} y={56} w={23} h={21} c="url(#d-9-8)" />
        <R x={288} y={10} w={23} h={11} c={7} />
        <R x={290} y={13} w={19} h={1} c={0} />
        <R x={290} y={16} w={14} h={1} c={0} />
        <R x={288} y={42} w={3} h={3} c={7} />
      </Hotspot>

      {/* Schreibtischplatte */}
      {desk}
      {grain.map(([gx, gy, gw]) => (
        <R key={`${gx}${gy}`} x={gx} y={gy} w={gw} h={1} c={8} />
      ))}
      <R x={0} y={80} w={320} h={1} c={0} />
      <R x={0} y={192} w={320} h={13} c={9} />
      <R x={0} y={192} w={320} h={1} c={0} />
      <R x={0} y={193} w={320} h={1} c={8} />

      {/* Radio */}
      <Hotspot {...hs('radio')}>
        <Box x={22} y={61} w={54} h={27} body={11} shade={0}>
          <R x={26} y={65} w={29} h={19} c={12} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <R key={i} x={27} y={67 + i * 3} w={27} h={1} c={0} />
          ))}
          <R x={62} y={66} w={9} h={9} c={15} />
          <R x={65} y={69} w={3} h={3} c={0} />
          <R x={60} y={79} w={12} h={3} c={radioOn ? 8 : 9} />
        </Box>
        {radioOn && (
          <>
            <R x={44} y={52} w={2} h={5} c={7} />
            <R x={42} y={56} w={3} h={2} c={7} />
            <R x={54} y={49} w={2} h={5} c={7} />
            <R x={52} y={53} w={3} h={2} c={7} />
          </>
        )}
      </Hotspot>

      {/* Monitor */}
      <Hotspot {...hs('monitor')}>
        <Box x={96} y={19} w={96} h={77} body={15} shade={12}>
          <R x={103} y={25} w={82} h={61} c={borderColor} />
          <R x={111} y={32} w={67} h={48} c={screenColor} />
          {c64.powerOn &&
            c64.lines
              .slice(-12)
              .map((l, i) =>
                l.trim() ? (
                  <R
                    key={i}
                    x={112}
                    y={33 + i * 4}
                    w={Math.min(65, Math.ceil(l.trimEnd().length * 1.6))}
                    h={2}
                    c={c64.video.text}
                  />
                ) : null,
              )}
        </Box>
        <R x={134} y={96} w={20} h={6} c={0} />
        <R x={135} y={96} w={18} h={4} c={12} />
      </Hotspot>

      {/* 1541 */}
      <Hotspot {...hs('drive1541')}>
        <Box x={200} y={64} w={64} h={34} body={15} shade={12}>
          <R x={205} y={75} w={50} h={4} c={0} />
          {inDrive && <R x={207} y={76} w={46} h={2} c={11} />}
          <R x={236} y={70} w={12} h={3} c={11} />
          <R x={204} y={90} w={3} h={3} c={state.computer.driveOn ? 13 : 11} />
          <PText s="1541" x={228} y={87} c={11} />
        </Box>
      </Hotspot>

      {/* C64 */}
      <Hotspot {...hs('c64')}>
        {bread}
        <R x={85} y={131} w={118} h={1} c={0} />
        <R x={78} y={131} w={132} h={1} c={0} />
        {[0, 1, 2, 3].map((row) =>
          Array.from({ length: 16 }).map((_, col) => (
            <R
              key={`${row}-${col}`}
              x={91 + col * 6 + row * 2 - 2}
              y={109 + row * 4}
              w={5}
              h={3}
              c={row === 3 ? 11 : 0}
            />
          )),
        )}
        <R x={116} y={127} w={50} h={2} c={11} />
        <R x={197} y={109} w={3} h={3} c={state.computer.powerOn ? 2 : 9} />
      </Hotspot>

      {/* Telefon */}
      <Hotspot {...hs('phone')}>
        <Box x={19} y={106} w={51} h={26} body={12} shade={11}>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <R key={`${r}${c}`} x={28 + c * 10} y={111 + r * 5} w={7} h={3} c={15} />),
          )}
        </Box>
        {t.handset === 'cradle' && (
          <g>
            <R x={17} y={98} w={55} h={9} c={0} />
            <R x={18} y={99} w={53} h={6} c={11} />
            <R x={18} y={99} w={53} h={1} c={12} />
          </g>
        )}
        {t.ringing && (
          <g className="ring">
            <PText s="!" x={40} y={88} c={7} />
          </g>
        )}
      </Hotspot>

      {/* Akustikkoppler */}
      <Hotspot {...hs('coupler')}>
        <Box x={19} y={141} w={64} h={22} body={15} shade={12}>
          <R x={27} y={146} w={11} h={11} c={0} />
          <R x={29} y={148} w={7} h={7} c={11} />
          <R x={63} y={146} w={11} h={11} c={0} />
          <R x={65} y={148} w={7} h={7} c={11} />
          <R x={48} y={156} w={3} h={3} c={state.objectStates.coupler.carrier ? 13 : 11} />
        </Box>
        {t.handset === 'coupler' && (
          <g>
            <R x={21} y={143} w={60} h={8} c={0} />
            <R x={22} y={144} w={58} h={6} c={11} />
          </g>
        )}
      </Hotspot>
      {t.handset === 'hand' && <PText s="(HOERER IN HAND)" x={22} y={165} c={1} />}

      {/* Kassettenrekorder */}
      <Hotspot {...hs('tape')}>
        <Box x={272} y={102} w={42} h={26} body={11} shade={0}>
          <R x={277} y={106} w={32} h={13} c={12} />
          <R x={281} y={109} w={6} h={6} c={0} />
          <R x={298} y={109} w={6} h={6} c={0} />
          <R x={283} y={111} w={2} h={2} c={15} />
          <R x={300} y={111} w={2} h={2} c={15} />
          <R x={277} y={122} w={32} h={3} c={15} />
        </Box>
      </Hotspot>

      {/* Notizblock */}
      <Hotspot {...hs('notebook')}>
        <R x={179} y={141} w={48} h={38} c={0} />
        <R x={180} y={142} w={46} h={36} c={1} />
        <R x={180} y={142} w={46} h={3} c={2} />
        {Array.from({ length: 7 }).map((_, i) => (
          <R key={i} x={183} y={148 + i * 4} w={40} h={1} c={14} />
        ))}
        <R x={180} y={142} w={2} h={36} c={15} />
        {state.knownFacts.length > 0 && (
          <PText s={String(Math.min(state.knownFacts.length, 99))} x={206} y={150} c={6} />
        )}
      </Hotspot>

      {/* Päckchen + Zeitschrift */}
      {loc.package === 'desk' && (
        <Hotspot {...hs('package')}>
          <R x={243} y={138} w={54} h={35} c={0} />
          <R x={244} y={139} w={52} h={33} c={8} />
          <R x={244} y={166} w={52} h={6} c={9} />
          {!pkgOpen ? (
            <>
              <R x={244} y={150} w={52} h={5} c={7} />
              <R x={266} y={139} w={5} h={33} c={7} />
            </>
          ) : (
            <>
              <R x={246} y={131} w={48} h={8} c={9} />
              <R x={250} y={133} w={40} h={1} c={8} />
            </>
          )}
        </Hotspot>
      )}
      {pkgOpen && isReachable(state, 'magazine') && (
        <Hotspot {...hs('magazine')}>
          <R x={251} y={133} w={38} h={24} c={0} />
          <R x={252} y={134} w={36} h={22} c={2} />
          <PText s="HEIM" x={254} y={137} c={1} />
          <R x={254} y={147} w={32} h={1} c={10} />
          <R x={254} y={150} w={20} h={1} c={10} />
        </Hotspot>
      )}

      {/* Disketten auf dem Tisch */}
      {loc.disk_game === 'desk' && (
        <Hotspot {...hs('disk_game')}>
          <PixelDisk x={134} y={146} id="disk_game" />
        </Hotspot>
      )}
      {loc.disk_1001 === 'desk' && (
        <Hotspot {...hs('disk_1001')}>
          <PixelDisk x={96} y={148} id="disk_1001" />
        </Hotspot>
      )}
      {loc.disk_archive === 'desk' && (
        <Hotspot {...hs('disk_archive')}>
          <PixelDisk x={109} y={160} id="disk_archive" />
        </Hotspot>
      )}

      {/* Schublade */}
      <Hotspot {...hs('drawer')}>
        <R x={121} y={193} w={98} h={12} c={0} />
        <R x={122} y={194} w={96} h={10} c={drawerOpen ? 11 : 9} />
        <R x={122} y={194} w={96} h={1} c={drawerOpen ? 12 : 8} />
        <R x={160} y={197} w={16} h={3} c={7} />
      </Hotspot>
      {drawerOpen && (
        <g>
          <R x={118} y={172} w={102} h={21} c={0} />
          <R x={119} y={173} w={100} h={20} c={11} />
          {loc.disk_1001 === 'drawer' && (
            <Hotspot {...hs('disk_1001')}>
              <PixelDisk x={128} y={171} id="disk_1001" />
            </Hotspot>
          )}
          {loc.disk_game === 'drawer' && (
            <Hotspot {...hs('disk_game')}>
              <PixelDisk x={160} y={171} id="disk_game" />
            </Hotspot>
          )}
          {loc.disk_archive === 'drawer' && (
            <Hotspot {...hs('disk_archive')}>
              <PixelDisk x={192} y={171} id="disk_archive" />
            </Hotspot>
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * Illustrierter Schreibtisch als Hub – eigene, austauschbare Platzhalter-Illustration (SVG)
 * in leicht schräger, erhöhter Perspektive. Jeder Hotspot ist per Tastatur und Klick erreichbar;
 * alle Aktionen gibt es zusätzlich als Textbefehl.
 */
import type { KeyboardEvent, ReactNode } from 'react';
import { OBJECT_BY_ID } from '../content/objects';
import type { GameState } from '../engine/types';
import { isReachable } from '../engine/resolve';
import { renderC64 } from '../sim/c64';
import { C64_PALETTE } from './palette';

interface Props {
  state: GameState;
  onSelect: (id: string) => void;
  selected: string | null;
}

function Hotspot({
  id,
  label,
  onSelect,
  selected,
  children,
}: {
  id: string;
  label: string;
  onSelect: (id: string) => void;
  selected: boolean;
  children: ReactNode;
}) {
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };
  return (
    <g
      className={`hotspot${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-hotspot={id}
      onClick={() => onSelect(id)}
      onKeyDown={key}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}

function Disk({ x, y, label, rot = 0 }: { x: number; y: number; label: string; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect width="74" height="74" rx="3" fill="#1d1d22" stroke="#000" />
      <circle cx="37" cy="37" r="9" fill="#4a4036" />
      <rect x="31" y="50" width="12" height="20" rx="5" fill="#2a2a30" />
      <rect x="8" y="5" width="58" height="18" fill="#efe6c8" />
      <text x="37" y="18" textAnchor="middle" fontSize="11" fill="#223" fontFamily="'Comic Sans MS', cursive">
        {label}
      </text>
    </g>
  );
}

export function Desk({ state, onSelect, selected }: Props) {
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
  const screenColor = c64.powerOn ? C64_PALETTE[c64.video.background] : '#1a1d1a';
  const borderColor = c64.powerOn ? C64_PALETTE[c64.video.border] : '#121412';

  return (
    <svg
      className="desk-svg"
      viewBox="0 0 1000 640"
      role="group"
      aria-label="Jans Schreibtisch – klickbare Gegenstände"
    >
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4a3a" />
          <stop offset="1" stopColor="#3a2e24" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset="1" stopColor="#5e3a1e" />
        </linearGradient>
        <linearGradient id="beige" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3d9c0" />
          <stop offset="1" stopColor="#bfb294" />
        </linearGradient>
        <linearGradient id="breadbin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d7f6a" />
          <stop offset="1" stopColor="#5f5445" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.55" cy="0.25" r="0.75">
          <stop offset="0" stopColor="#ffd89a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Wand + Fenster */}
      <rect width="1000" height="260" fill="url(#wall)" />
      <Hotspot {...hs('window')}>
        <rect
          x="40"
          y="20"
          width="180"
          height="140"
          fill={dark ? '#0e1830' : '#7f93a6'}
          stroke="#2b2118"
          strokeWidth="8"
        />
        <line x1="130" y1="20" x2="130" y2="160" stroke="#2b2118" strokeWidth="6" />
        {dark && <circle cx="185" cy="50" r="3" fill="#ffd27a" />}
      </Hotspot>
      {/* Poster (fiktiv) */}
      <g transform="translate(260 30) rotate(-2)">
        <rect width="120" height="150" fill="#1b2a4a" stroke="#111" />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          fill="#f2c14e"
          fontSize="18"
          fontFamily="'Press Start 2P', monospace"
        >
          SPACE
        </text>
        <text
          x="60"
          y="90"
          textAnchor="middle"
          fill="#f2c14e"
          fontSize="12"
          fontFamily="'Press Start 2P', monospace"
        >
          RIDERS
        </text>
        <text x="60" y="135" textAnchor="middle" fill="#88a" fontSize="8">
          (fiktives Filmplakat)
        </text>
      </g>
      {/* Tür */}
      <Hotspot {...hs('door')}>
        <rect x="880" y="10" width="110" height="250" fill="#6b4a2c" stroke="#2b1d10" strokeWidth="4" />
        <circle cx="900" cy="140" r="6" fill="#d4b26a" />
        <rect x="905" y="40" width="70" height="30" fill="#f4e04d" />
        <text x="940" y="52" textAnchor="middle" fontSize="8" fill="#222">
          COMPUTER-
        </text>
        <text x="940" y="64" textAnchor="middle" fontSize="8" fill="#222">
          ZONE
        </text>
      </Hotspot>

      {/* Schreibtischplatte in Schrägansicht */}
      <polygon points="40,250 960,250 1000,600 0,600" fill="url(#wood)" />
      <polygon points="0,600 1000,600 1000,640 0,640" fill="#4a2c16" />

      {/* Radio */}
      <Hotspot {...hs('radio')}>
        <rect x="70" y="190" width="170" height="85" rx="8" fill="#2f2f33" />
        <rect x="82" y="202" width="90" height="60" rx="4" fill="#4a4a50" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1="86" y1={208 + i * 9} x2="168" y2={208 + i * 9} stroke="#222" strokeWidth="3" />
        ))}
        <circle cx="205" cy="225" r="16" fill="#777" />
        <rect x="185" y="252" width="40" height="10" fill={radioOn ? '#ffb347' : '#553'} />
        {radioOn && (
          <text x="155" y="185" fill="#ffd27a" fontSize="16">
            ♪ ♫
          </text>
        )}
      </Hotspot>

      {/* Monitor */}
      <Hotspot {...hs('monitor')}>
        <rect
          x="300"
          y="60"
          width="300"
          height="240"
          rx="12"
          fill="url(#beige)"
          stroke="#8b7f63"
          strokeWidth="3"
        />
        <rect x="322" y="80" width="256" height="190" rx="10" fill={borderColor} />
        <rect x="346" y="100" width="208" height="150" fill={screenColor} />
        {c64.powerOn &&
          c64.lines
            .slice(-12)
            .map((l, i) =>
              l.trim() ? (
                <rect
                  key={i}
                  x="350"
                  y={104 + i * 12}
                  width={Math.min(200, l.trimEnd().length * 5)}
                  height="5"
                  fill={C64_PALETTE[c64.video.text]}
                  opacity="0.85"
                />
              ) : null,
            )}
        <rect x="420" y="300" width="60" height="18" fill="#a99d7f" />
      </Hotspot>

      {/* 1541 */}
      <Hotspot {...hs('drive1541')}>
        <rect
          x="625"
          y="200"
          width="200"
          height="105"
          rx="6"
          fill="url(#beige)"
          stroke="#8b7f63"
          strokeWidth="3"
        />
        <rect x="645" y="240" width="160" height="12" fill="#3a3530" />
        <rect x="700" y="232" width="50" height="10" fill="#5b544a" />
        <circle cx="650" cy="285" r="5" fill={state.computer.driveOn ? '#4dff6a' : '#234'} />
        <text x="760" y="292" fontSize="12" fill="#5b544a" fontFamily="sans-serif">
          1541
        </text>
        {inDrive && <rect x="690" y="226" width="70" height="8" fill="#1d1d22" />}
      </Hotspot>

      {/* C64 */}
      <Hotspot {...hs('c64')}>
        <path
          d="M270,330 L630,330 L660,410 L240,410 Z"
          fill="url(#breadbin)"
          stroke="#3d352b"
          strokeWidth="3"
        />
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 16 }).map((__, col) => (
            <rect
              key={`${row}-${col}`}
              x={290 + col * 20 + row * 4 - 6}
              y={342 + row * 14}
              width="15"
              height="10"
              rx="2"
              fill="#3a332a"
            />
          )),
        )}
        <rect x="370" y="398" width="150" height="8" rx="3" fill="#3a332a" />
        <circle cx="620" cy="345" r="4" fill={state.computer.powerOn ? '#ff3b30' : '#422'} />
      </Hotspot>

      {/* Telefon */}
      <Hotspot {...hs('phone')}>
        <rect x="60" y="330" width="160" height="80" rx="14" fill="#9aa0a3" stroke="#555" strokeWidth="2" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect
              key={`${r}${c}`}
              x={95 + c * 30}
              y={360 + r * 14}
              width="22"
              height="10"
              rx="2"
              fill="#e9eef0"
            />
          )),
        )}
        {t.handset === 'cradle' && (
          <rect x="55" y="315" width="170" height="26" rx="13" fill="#7e8487" stroke="#444" />
        )}
        {t.ringing && (
          <text x="140" y="305" textAnchor="middle" fill="#ffdc6a" fontSize="22" className="ring">
            ☎ !
          </text>
        )}
      </Hotspot>

      {/* Akustikkoppler */}
      <Hotspot {...hs('coupler')}>
        <rect x="60" y="440" width="200" height="70" rx="8" fill="#e6e1d3" stroke="#777" strokeWidth="2" />
        <circle cx="105" cy="475" r="22" fill="#222" />
        <circle cx="215" cy="475" r="22" fill="#222" />
        <circle cx="160" cy="498" r="5" fill={state.objectStates.coupler.carrier ? '#3cff5a' : '#2c3a2c'} />
        {t.handset === 'coupler' && (
          <rect x="70" y="455" width="180" height="26" rx="13" fill="#7e8487" stroke="#444" />
        )}
      </Hotspot>
      {t.handset === 'hand' && (
        <text x="160" y="540" textAnchor="middle" fill="#ffe7b0" fontSize="14" fontFamily="sans-serif">
          (Hörer in der Hand)
        </text>
      )}

      {/* Kassettenrekorder */}
      <Hotspot {...hs('tape')}>
        <rect x="850" y="320" width="130" height="80" rx="6" fill="#26262a" />
        <rect x="866" y="332" width="98" height="40" rx="3" fill="#3c3c44" />
        <circle cx="893" cy="352" r="9" fill="#111" />
        <circle cx="937" cy="352" r="9" fill="#111" />
      </Hotspot>

      {/* Notizblock */}
      <Hotspot {...hs('notebook')}>
        <g transform="translate(560 440) rotate(-6)">
          <rect width="150" height="120" fill="#fbf7e6" stroke="#bbb" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="8" y1={18 + i * 13} x2="142" y2={18 + i * 13} stroke="#b9d0e6" />
          ))}
          <text x="14" y="30" fontSize="12" fill="#335" fontFamily="'Comic Sans MS', cursive">
            {state.knownFacts.length ? `${state.knownFacts.length} Notizen` : 'Notizen'}
          </text>
        </g>
      </Hotspot>

      {/* Päckchen + Zeitschrift */}
      {loc.package === 'desk' && (
        <Hotspot {...hs('package')}>
          <rect x="760" y="430" width="170" height="110" fill="#c79a5b" stroke="#7a5a2c" strokeWidth="2" />
          {!pkgOpen ? (
            <rect x="760" y="476" width="170" height="16" fill="#e8d8a8" opacity="0.8" />
          ) : (
            <polygon points="760,430 800,400 890,400 930,430" fill="#a87c40" />
          )}
        </Hotspot>
      )}
      {pkgOpen && isReachable(state, 'magazine') && (
        <Hotspot {...hs('magazine')}>
          <rect x="785" y="420" width="120" height="70" fill="#d23c3c" stroke="#7a1f1f" />
          <text
            x="845"
            y="447"
            textAnchor="middle"
            fill="#fff"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            HEIMCOMPUTER
          </text>
          <text
            x="845"
            y="463"
            textAnchor="middle"
            fill="#fff"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            JOURNAL
          </text>
        </Hotspot>
      )}

      {/* Disketten auf dem Tisch */}
      {loc.disk_game === 'desk' && (
        <Hotspot {...hs('disk_game')}>
          <Disk x={420} y={450} label="WT-07" rot={8} />
        </Hotspot>
      )}
      {loc.disk_1001 === 'desk' && (
        <Hotspot {...hs('disk_1001')}>
          <Disk x={300} y={460} label="1001" rot={-6} />
        </Hotspot>
      )}
      {loc.disk_archive === 'desk' && (
        <Hotspot {...hs('disk_archive')}>
          <Disk x={340} y={500} label="ARCHIV" rot={3} />
        </Hotspot>
      )}

      {/* Schublade */}
      <Hotspot {...hs('drawer')}>
        <rect
          x="380"
          y="604"
          width="300"
          height="32"
          fill={drawerOpen ? '#3b2310' : '#6b4424'}
          stroke="#2b1a0a"
          strokeWidth="2"
        />
        <rect x="505" y="613" width="50" height="10" rx="4" fill="#d4b26a" />
      </Hotspot>
      {drawerOpen && (
        <g>
          <rect x="370" y="540" width="320" height="66" fill="#2d1a0b" opacity="0.9" />
          {loc.disk_1001 === 'drawer' && (
            <Hotspot {...hs('disk_1001')}>
              <Disk x={400} y={536} label="1001" rot={-4} />
            </Hotspot>
          )}
          {loc.disk_archive === 'drawer' && (
            <Hotspot {...hs('disk_archive')}>
              <Disk x={500} y={538} label="ARCHIV" rot={5} />
            </Hotspot>
          )}
        </g>
      )}

      <rect width="1000" height="640" fill="url(#lamp)" pointerEvents="none" />
      <text x="990" y="632" textAnchor="end" fontSize="11" fill="#e7cfa6" opacity="0.7" pointerEvents="none">
        Platzhalter-Illustration
      </text>
    </svg>
  );
}

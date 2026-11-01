/**
 * Gezeichnete Detailansichten der Geräte (eigene Platzhalter-Illustrationen, kein Foto, keine Vorlage).
 * Die Bilder zeigen den Zustand: Betriebs-LED, Diskette im Laufwerk, abgehobener Hörer, Radio an.
 */
import { C64_PALETTE } from './palette';
import { renderC64 } from '../sim/c64';
import type { ReactNode } from 'react';
import type { GameState } from '../engine/types';

const DISK_LABEL: Record<string, string> = { disk_game: 'WT-07', disk_1001: '1001', disk_archive: 'ARCHIV' };

function Led({ x, y, on, color = '#e33' }: { x: number; y: number; on: boolean; color?: string }) {
  return <circle cx={x} cy={y} r="4" fill={on ? color : '#411'} stroke="#000" />;
}

function Floppy({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <g>
      <rect x="30" y="10" width="140" height="140" rx="6" fill={dark ? '#0d0d12' : '#1d1d22'} stroke="#000" />
      <circle cx="100" cy="80" r="20" fill="#4a4036" />
      <rect x="86" y="108" width="28" height="38" rx="8" fill="#2a2a30" />
      <rect x="50" y="18" width="100" height="36" fill="#efe6c8" />
      <text
        x="100"
        y="42"
        textAnchor="middle"
        fontSize="20"
        fill="#223"
        fontFamily="'Comic Sans MS', cursive"
      >
        {label}
      </text>
    </g>
  );
}

function art(state: GameState, id: string): { viewBox: string; body: ReactNode } | null {
  const c = renderC64(state);
  const t = state.telecom;
  const inDrive = Object.entries(state.itemLocations).find(([, l]) => l === 'drive')?.[0];
  switch (id) {
    case 'c64':
    case 'monitor': {
      const screen = c.powerOn ? C64_PALETTE[c.video.background] : '#151815';
      const border = c.powerOn ? C64_PALETTE[c.video.border] : '#151815';
      return {
        viewBox: '0 0 300 210',
        body: (
          <g>
            <rect
              x="40"
              y="6"
              width="220"
              height="150"
              rx="12"
              fill="#cfc6a8"
              stroke="#6b6450"
              strokeWidth="3"
            />
            <rect x="56" y="20" width="188" height="118" rx="8" fill={border} />
            <rect x="74" y="34" width="152" height="90" fill={screen} />
            {c.powerOn && (
              <text x="80" y="52" fontSize="9" fill="#fff" fontFamily="monospace">
                READY.
              </text>
            )}
            <Led x={228} y={148} on={c.powerOn} color="#3d3" />
            <rect
              x="20"
              y="164"
              width="260"
              height="38"
              rx="6"
              fill="#a99f82"
              stroke="#6b6450"
              strokeWidth="2"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={32 + i * 20} y="174" width="16" height="9" rx="2" fill="#5b5440" />
            ))}
            <rect x="60" y="188" width="140" height="8" rx="2" fill="#5b5440" />
          </g>
        ),
      };
    }
    case 'drive1541':
      return {
        viewBox: '0 0 300 150',
        body: (
          <g>
            <rect
              x="10"
              y="20"
              width="280"
              height="110"
              rx="8"
              fill="#cfc6a8"
              stroke="#6b6450"
              strokeWidth="3"
            />
            <rect x="40" y="52" width="150" height="14" rx="3" fill="#222" />
            {inDrive && <rect x="48" y="55" width="134" height="8" fill="#1d1d22" />}
            <rect x="210" y="46" width="12" height="8" fill="#5b5440" />
            <Led x={250} y={60} on={!!inDrive} />
            <Led x={250} y={80} on={c.powerOn} color="#3d3" />
            <text x="40" y="100" fontSize="12" fill="#5b5440" fontFamily="monospace">
              FLOPPY DISK DRIVE
            </text>
          </g>
        ),
      };
    case 'phone':
    case 'handset':
      return {
        viewBox: '0 0 260 200',
        body: (
          <g>
            <rect
              x="30"
              y="70"
              width="200"
              height="110"
              rx="16"
              fill="#5d6b5a"
              stroke="#222"
              strokeWidth="3"
            />
            <circle cx="130" cy="140" r="38" fill="#e8e2c8" stroke="#222" strokeWidth="2" />
            <circle cx="130" cy="140" r="12" fill="#5d6b5a" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (-30 + i * 28) * (Math.PI / 180);
              return (
                <circle key={i} cx={130 + Math.cos(a) * 27} cy={140 + Math.sin(a) * 27} r="4" fill="#222" />
              );
            })}
            {t.handset === 'cradle' ? (
              <g transform={t.ringing ? 'rotate(-3 130 60)' : undefined}>
                <rect
                  x="45"
                  y="52"
                  width="170"
                  height="24"
                  rx="12"
                  fill="#3f4b3c"
                  stroke="#222"
                  strokeWidth="2"
                />
              </g>
            ) : (
              <g>
                <path d="M30 100 q-18 -40 10 -70" stroke="#222" strokeWidth="3" fill="none" />
                <rect
                  x="6"
                  y="12"
                  width="90"
                  height="22"
                  rx="11"
                  fill="#3f4b3c"
                  stroke="#222"
                  strokeWidth="2"
                  transform="rotate(-25 50 24)"
                />
              </g>
            )}
            {t.ringing && (
              <text x="130" y="28" textAnchor="middle" fontSize="18" fill="#e5c35a">
                ♪ klingelt ♪
              </text>
            )}
          </g>
        ),
      };
    case 'coupler':
      return {
        viewBox: '0 0 280 150',
        body: (
          <g>
            <rect x="20" y="40" width="240" height="90" rx="8" fill="#2b2b30" stroke="#000" strokeWidth="3" />
            <ellipse cx="80" cy="60" rx="34" ry="12" fill="#111" stroke="#555" />
            <ellipse cx="200" cy="60" rx="34" ry="12" fill="#111" stroke="#555" />
            <rect
              x="110"
              y="38"
              width="60"
              height="16"
              rx="8"
              fill="#3f4b3c"
              opacity={t.handset === 'coupler' ? 1 : 0.15}
            />
            <Led x={50} y={110} on={t.connectedSystemId !== null} color="#3d3" />
            <text x="75" y="115" fontSize="11" fill="#bbb" fontFamily="monospace">
              AKUSTIKKOPPLER
            </text>
          </g>
        ),
      };
    case 'radio': {
      const on = state.objectStates.radio.on === true;
      return {
        viewBox: '0 0 260 150',
        body: (
          <g>
            <rect
              x="20"
              y="30"
              width="220"
              height="100"
              rx="10"
              fill="#7a4e2a"
              stroke="#2b1a0a"
              strokeWidth="3"
            />
            <rect x="36" y="46" width="110" height="60" rx="4" fill="#d8c38a" />
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={44 + i * 10} y="52" width="2" height="14" fill="#6b4424" />
            ))}
            <line x1={on ? 100 : 54} y1="50" x2={on ? 100 : 54} y2="104" stroke="#c33" strokeWidth="2" />
            <circle cx="190" cy="76" r="22" fill="#2b1a0a" stroke="#d4b26a" strokeWidth="3" />
            <line x1="190" y1="76" x2="200" y2="62" stroke="#d4b26a" strokeWidth="3" />
            <Led x={50} y={118} on={on} color="#fc4" />
          </g>
        ),
      };
    }
    case 'tape':
    case 'datasette':
    case 'cassette':
      return {
        viewBox: '0 0 280 150',
        body: (
          <g>
            <rect
              x="20"
              y="30"
              width="240"
              height="100"
              rx="8"
              fill="#cfc6a8"
              stroke="#6b6450"
              strokeWidth="3"
            />
            <rect x="60" y="44" width="160" height="56" rx="6" fill="#222" />
            <rect x="72" y="52" width="136" height="26" rx="3" fill="#efe6c8" />
            <circle cx="100" cy="88" r="9" fill="#bbb" />
            <circle cx="180" cy="88" r="9" fill="#bbb" />
            <rect x="70" y="108" width="140" height="14" rx="3" fill="#a99f82" />
          </g>
        ),
      };
    case 'disk_game':
    case 'disk_1001':
    case 'disk_archive':
      return { viewBox: '0 0 200 160', body: <Floppy label={DISK_LABEL[id]} /> };
    case 'disk_key':
      return { viewBox: '0 0 200 160', body: <Floppy label="??" dark /> };
    case 'btx_kit':
      return {
        viewBox: '0 0 280 150',
        body: (
          <g>
            <rect x="30" y="40" width="130" height="90" rx="6" fill="#2b2b30" stroke="#000" strokeWidth="3" />
            <rect x="44" y="52" width="90" height="12" fill="#3b4b78" />
            <text x="48" y="62" fontSize="9" fill="#fff" fontFamily="monospace">
              BTX-DECODER
            </text>
            <rect
              x="170"
              y="60"
              width="90"
              height="50"
              rx="6"
              fill="#cfc6a8"
              stroke="#6b6450"
              strokeWidth="2"
            />
            <text x="176" y="88" fontSize="11" fill="#5b5440" fontFamily="monospace">
              POSTMODEM
            </text>
            <path d="M160 85 h10" stroke="#222" strokeWidth="3" />
          </g>
        ),
      };
    default:
      return null;
  }
}

export function DeviceArt({ state, id, label }: { state: GameState; id: string; label: string }) {
  const a = art(state, id);
  if (!a) return null;
  return (
    <figure className="device-art">
      <svg viewBox={a.viewBox} role="img" aria-label={`Zeichnung: ${label}`}>
        {a.body}
      </svg>
      <figcaption>Platzhalter-Illustration</figcaption>
    </figure>
  );
}

/**
 * Bild in der Detailansicht. Gegenstände, die im Schreibtischbild zu sehen sind, zeigen einen vergrößerten
 * Ausschnitt daraus – mit denselben Zustands-Overlays (Bildschirm, LEDs, Hörer, Radio). Alles andere
 * (Disketten, Datasette, BTX-Set) bleibt eine eigene Zeichnung.
 */
import { DeskScene } from './Desk';
import { glyphPath } from './glyphPath';
import type { ReactNode } from 'react';
import type { GameState } from '../engine/types';

const DISK_LABEL: Record<string, string> = { disk_game: 'WT-07', disk_1001: '1001', disk_archive: 'ARCHIV' };

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

function art(id: string): { viewBox: string; body: ReactNode } | null {
  switch (id) {
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

/** Ausschnitte aus der Schreibtisch-Szene (x, y, Breite, Höhe in Bildpixeln, siehe Desk.tsx) */
const CROPS: Record<string, [number, number, number, number]> = {
  c64: [116, 104, 116, 54],
  monitor: [138, 46, 80, 70],
  drive1541: [246, 80, 72, 54],
  phone: [205, 78, 52, 52],
  handset: [205, 78, 52, 52],
  coupler: [246, 78, 66, 36],
  tape: [276, 84, 40, 30],
  radio: [32, 98, 60, 58],
  window: [0, 0, 72, 122],
  door: [296, 0, 88, 180],
  notebook: [68, 130, 64, 42],
  drawer: [222, 170, 102, 46],
};

/** Titelseite der fiktiven Zeitschrift in Pixeln (eigener Zeichensatz) */
function MagazineCover() {
  return (
    <svg
      viewBox="0 0 120 90"
      role="img"
      aria-label="Titelseite Heimcomputer-Journal 11/86"
      shapeRendering="crispEdges"
    >
      <rect width="120" height="90" fill="#e6c593" />
      <rect width="120" height="26" fill="#c42a22" />
      <path d={glyphPath('HEIM-', 0, 0)} fill="#f2cf3a" transform="translate(4 3)" />
      <path d={glyphPath('COMPUTER', 0, 0)} fill="#f2cf3a" transform="translate(4 14)" />
      <rect x="86" y="3" width="30" height="9" fill="#e6c593" />
      <path d={glyphPath('11/86', 0, 0)} fill="#c42a22" transform="translate(88 5) scale(0.65)" />
      <rect y="26" width="120" height="8" fill="#2a314e" />
      <path d={glyphPath('JOURNAL', 0, 0)} fill="#e6c593" transform="translate(4 27.5) scale(0.7)" />
      <rect x="8" y="40" width="58" height="34" fill="#2b2119" />
      <rect x="12" y="43" width="34" height="24" fill="#2a314e" />
      <rect x="15" y="46" width="28" height="18" fill="#6e7c8d" />
      <rect x="50" y="46" width="12" height="20" fill="#af8964" />
      <circle cx="92" cy="54" r="14" fill="#f2cf3a" />
      <path d={glyphPath('TEST', 0, 0)} fill="#c42a22" transform="translate(81 46) scale(0.7)" />
      <path d={glyphPath('KOPPLER', 0, 0)} fill="#c42a22" transform="translate(79.5 55) scale(0.5)" />
      <path
        d={glyphPath('LISTINGS TIPPS DFUE', 0, 0)}
        fill="#2a314e"
        transform="translate(6 79) scale(0.6)"
      />
    </svg>
  );
}

export function DeviceArt({ state, id, label }: { state: GameState; id: string; label: string }) {
  if (id === 'magazine')
    return (
      <figure className="device-art pixel-art">
        <MagazineCover />
      </figure>
    );
  const crop = CROPS[id];
  if (crop)
    return (
      <figure className="device-art pixel-art">
        <DeskScene
          state={state}
          viewBox={crop.join(' ')}
          interactive={false}
          onSelect={() => {}}
          selected={null}
          label={`Bild: ${label}`}
        />
      </figure>
    );
  const a = art(id);
  if (!a) return null;
  return (
    <figure className="device-art" title="Eigene Zeichnung">
      <svg viewBox={a.viewBox} role="img" aria-label={`Zeichnung: ${label}`}>
        {a.body}
      </svg>
    </figure>
  );
}

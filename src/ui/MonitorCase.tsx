/**
 * Gehäuse des Farbmonitors: beiger Kunststoff, eingelassene Bildröhre mit Glasreflex und eine
 * Frontleiste mit Lüftungsschlitzen, Drehreglern und Betriebs-LED. Bewusst ohne echte Marke.
 */
import type { ReactNode } from 'react';

/** Glasreflex über der Bildröhre: gewölbter Lichtbogen oben links, leichter Schimmer unten rechts */
function Glass() {
  return (
    <svg className="monitor-glass" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="mon-glass-hi" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mon-glass-edge" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#mon-glass-edge)" />
      <path d="M4 30 C6 12 14 5 34 4 L58 3.5 C40 7 22 12 12 24 Z" fill="url(#mon-glass-hi)" />
      <path d="M96 78 C95 88 90 94 80 96 C88 91 93 86 96 78 Z" fill="#fff" fillOpacity="0.06" />
    </svg>
  );
}

function Knob({ x, label }: { x: number; label: string }) {
  return (
    <g transform={`translate(${x} 22)`}>
      <circle r="10" fill="#2b241d" />
      <circle r="8.5" fill="url(#mon-knob)" />
      <rect x="-0.9" y="-8" width="1.8" height="5" fill="#f4ecd8" transform="rotate(35)" />
      <text y="20" className="monitor-label" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** Frontleiste unter der Röhre (400×44 Einheiten, skaliert mit der Breite) */
function FrontPanel({ power }: { power: boolean }) {
  return (
    <svg className="monitor-front" viewBox="0 0 400 46" aria-hidden="true">
      <defs>
        <radialGradient id="mon-knob" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8a7c6a" />
          <stop offset="0.6" stopColor="#4c4237" />
          <stop offset="1" stopColor="#2b241d" />
        </radialGradient>
        <radialGradient id="mon-led">
          <stop offset="0" stopColor="#ff5a3c" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff5a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Typenschild */}
      <rect x="14" y="10" width="92" height="20" rx="2" fill="#3a332b" />
      <rect x="15" y="11" width="90" height="18" rx="1.5" fill="none" stroke="#8d806a" strokeWidth="0.8" />
      <text x="60" y="23.5" className="monitor-brand" textAnchor="middle">
        COLOR&#8201;14
      </text>
      {/* Lüftungsschlitze */}
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={132 + i * 9} y="12" width="4" height="18" rx="2" fill="#a8997c" />
      ))}
      <Knob x={262} label="HELL" />
      <Knob x={296} label="KONTR" />
      {/* Netzschalter und LED */}
      <rect x="326" y="12" width="26" height="18" rx="2" fill="#2b241d" />
      <rect x="328" y="13.5" width="22" height="14" rx="1.5" fill={power ? '#c9bb9c' : '#b3a586'} />
      <text x="339" y="40" className="monitor-label" textAnchor="middle">
        NETZ
      </text>
      {power && <circle cx="372" cy="21" r="9" fill="url(#mon-led)" />}
      <circle
        cx="372"
        cy="21"
        r="3.4"
        fill={power ? '#ff6a48' : '#5a2a22'}
        stroke="#2b241d"
        strokeWidth="1"
        className={power ? 'monitor-led on' : 'monitor-led'}
      />
    </svg>
  );
}

export function MonitorCase({
  power,
  onScreenClick,
  children,
}: {
  power: boolean;
  onScreenClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="monitor">
      <div className="monitor-bezel">
        <div className="c64-frame" onClick={onScreenClick}>
          {children}
          <Glass />
        </div>
      </div>
      <FrontPanel power={power} />
    </div>
  );
}

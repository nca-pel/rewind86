/**
 * Detailansicht eines Gegenstands. Alle Schaltflächen senden den gleichwertigen Textbefehl an den
 * Adventure-Parser – Klick und Text führen zum selben Ergebnis.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion, useSettings } from '../app/settings';
import type { GameUi } from '../app/useGame';
import { OBJECT_BY_ID } from '../content/objects';
import { STATIONS } from '../content/radio';
import { describe, itemsAt } from '../engine/describe';
import type { GameState } from '../engine/types';
import { COMMAND_NAME } from './commandNames';
import { DeviceArt } from './DeviceArt';

type Action = { label: string; cmd: string };

function actionsFor(state: GameState, id: string): Action[] {
  const t = state.telecom;
  const inv = itemsAt(state, 'inventory');
  const disks = ['disk_game', 'disk_1001', 'disk_archive'];
  const a: Action[] = [];
  switch (id) {
    case 'c64':
    case 'monitor':
      a.push(
        state.computer.powerOn
          ? { label: 'Ausschalten', cmd: 'SCHALTE COMPUTER AUS' }
          : { label: 'Einschalten', cmd: 'SCHALTE COMPUTER EIN' },
      );
      if (state.computer.powerOn) a.push({ label: 'Zur C64-Eingabe', cmd: 'BENUTZE COMPUTER' });
      break;
    case 'drive1541': {
      const inDrive = itemsAt(state, 'drive')[0];
      if (inDrive) a.push({ label: 'Diskette herausnehmen', cmd: 'NIMM DISKETTE AUS DEM LAUFWERK' });
      else
        for (const d of inv.filter((x) => disks.includes(x)))
          a.push({ label: `${OBJECT_BY_ID[d].short} einlegen`, cmd: `LEGE ${cmdName(d)} INS LAUFWERK` });
      break;
    }
    case 'phone':
    case 'handset':
      if (t.handset === 'cradle')
        a.push({ label: t.ringing ? 'Abheben!' : 'Hörer abnehmen', cmd: 'NIMM HÖRER' });
      else a.push({ label: 'Auflegen', cmd: 'LEGE AUF' });
      if (t.handset !== 'coupler') a.push({ label: 'Ralf anrufen', cmd: 'RUFE RALF AN' });
      break;
    case 'coupler':
      if (t.handset !== 'coupler')
        a.push({ label: 'Hörer in den Koppler', cmd: 'LEGE HÖRER IN DEN KOPPLER' });
      else a.push({ label: 'Hörer herausnehmen', cmd: 'NIMM HÖRER' });
      break;
    case 'radio':
      a.push(
        state.objectStates.radio.on
          ? { label: 'Ausschalten', cmd: 'SCHALTE RADIO AUS' }
          : { label: 'Einschalten', cmd: 'SCHALTE RADIO EIN' },
      );
      for (const s of STATIONS) a.push({ label: s.label, cmd: `STELLE RADIO AUF ${s.aliases[0]}` });
      break;
    case 'drawer':
      a.push(
        state.objectStates.drawer.open
          ? { label: 'Schließen', cmd: 'SCHLIESSE SCHUBLADE' }
          : { label: 'Öffnen', cmd: 'ÖFFNE SCHUBLADE' },
      );
      // Inhalt erst zeigen, wenn die Schublade offen ist
      if (state.objectStates.drawer.open)
        for (const d of itemsAt(state, 'drawer'))
          a.push({ label: `${OBJECT_BY_ID[d].short} nehmen`, cmd: `NIMM ${cmdName(d)}` });
      break;
    case 'package':
      if (!state.objectStates.package.open) a.push({ label: 'Öffnen', cmd: 'ÖFFNE PÄCKCHEN' });
      else a.push({ label: 'Zeitschrift lesen', cmd: 'LIES ZEITSCHRIFT' });
      break;
    case 'magazine':
      a.push(
        { label: 'Zeichentabelle', cmd: 'LIES ZEICHENTABELLE' },
        { label: 'Koppler-Artikel', cmd: 'LIES ARTIKEL' },
        { label: 'Kleinanzeigen', cmd: 'LIES KLEINANZEIGEN' },
      );
      break;
    case 'notebook':
      a.push({ label: 'Notizblock öffnen', cmd: 'NOTIZEN' }, { label: 'Denke nach', cmd: 'DENKE NACH' });
      break;
    case 'door':
      a.push({ label: 'Tür öffnen', cmd: 'ÖFFNE TÜR' });
      break;
    case 'disk_game':
    case 'disk_1001':
    case 'disk_archive': {
      const loc = state.itemLocations[id];
      if (loc !== 'inventory' && loc !== 'drive') a.push({ label: 'Nehmen', cmd: `NIMM ${cmdName(id)}` });
      if (loc !== 'drive') a.push({ label: 'Ins Laufwerk', cmd: `LEGE ${cmdName(id)} INS LAUFWERK` });
      else a.push({ label: 'Herausnehmen', cmd: 'NIMM DISKETTE AUS DEM LAUFWERK' });
      break;
    }
  }
  return a;
}

function cmdName(id: string): string {
  return COMMAND_NAME[id] ?? OBJECT_BY_ID[id].short.toUpperCase();
}

const ZOOM_IN_MS = 280;
const ZOOM_OUT_MS = 230;

/**
 * Transformation, die das Panel genau auf den Gegenstand im Schreibtischbild legt (Ausgangs- bzw. Endpunkt
 * des Zooms). null, wenn der Gegenstand gerade nicht sichtbar ist (z. B. mobil im C64-Tab).
 */
function zoomFrom(panel: HTMLElement, id: string): string | null {
  // Klickfläche als Bezug (die Gruppe kann Overlays enthalten, die über den Gegenstand hinausragen)
  const spot =
    document.querySelector(`[data-hotspot="${id}"] .hs-area`) ??
    document.querySelector(`[data-hotspot="${id}"]`);
  if (!spot) return null;
  const s = spot.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  if (!s.width || !s.height || !p.width || !p.height) return null;
  return `translate(${s.left - p.left}px, ${s.top - p.top}px) scale(${s.width / p.width}, ${s.height / p.height})`;
}

export function DetailPanel({ game }: { game: GameUi }) {
  const state = game.state!;
  const id = game.detail;
  const { settings } = useSettings();
  const reduced = reducedMotion(settings);
  const [number, setNumber] = useState('');
  const ref = useRef<HTMLElement>(null);
  const closing = useRef(false);

  // Aufzoomen aus dem angeklickten Gegenstand (vor dem ersten Zeichnen, damit nichts aufblitzt)
  useLayoutEffect(() => {
    const el = ref.current;
    closing.current = false;
    if (!el || !id || reduced || typeof el.animate !== 'function') return;
    const from = zoomFrom(el, id);
    if (!from) return;
    el.animate(
      [
        { transform: from, opacity: 0.4 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: ZOOM_IN_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  }, [id, reduced]);

  if (!id || !OBJECT_BY_ID[id]) return null;
  const o = OBJECT_BY_ID[id];
  const acts = actionsFor(state, id);

  // Schließen über ✕: zurück in den Gegenstand zoomen, dann ausblenden
  const close = () => {
    const el = ref.current;
    if (closing.current) return;
    const to = el && !reduced && typeof el.animate === 'function' ? zoomFrom(el, id) : null;
    if (!el || !to) return game.setDetail(null);
    closing.current = true;
    const anim = el.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: to, opacity: 0.2 },
      ],
      { duration: ZOOM_OUT_MS, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)', fill: 'forwards' },
    );
    anim.onfinish = () => game.setDetail(null);
  };

  return (
    <aside
      ref={ref}
      className="detail-panel"
      aria-label={`Detailansicht: ${o.short}`}
      data-testid="detail-panel"
    >
      <div className="detail-head">
        <h2>{o.short}</h2>
        <button type="button" className="close" aria-label="Detailansicht schließen" onClick={close}>
          ✕
        </button>
      </div>
      <div className="detail-body">
        <DeviceArt state={state} id={id} label={o.short} />
        <div className="detail-main">
          <p className="detail-text">{describe(state, id)}</p>
          <div className="detail-actions">
            {acts.map((a) => (
              <button
                key={a.cmd}
                type="button"
                onClick={() => game.dispatch({ type: 'adventure', text: a.cmd })}
                title={`Textbefehl: ${a.cmd}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {(id === 'phone' || id === 'handset') && state.telecom.handset !== 'coupler' && (
            <form
              className="dial-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!number.trim()) return;
                game.dispatch({ type: 'adventure', text: `WÄHLE ${number.replace(/\D/g, '')}` });
                setNumber('');
              }}
            >
              <label>
                Nummer wählen{' '}
                <input
                  inputMode="numeric"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.slice(0, 15))}
                  aria-label="Telefonnummer"
                />
              </label>
              <button type="submit">Wählen</button>
            </form>
          )}
          <p className="detail-note">Jede Schaltfläche entspricht einem Textbefehl (Tooltip).</p>
        </div>
      </div>
    </aside>
  );
}

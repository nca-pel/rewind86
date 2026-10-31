/**
 * Detailansicht eines Gegenstands. Alle Schaltflächen senden den gleichwertigen Textbefehl an den
 * Adventure-Parser – Klick und Text führen zum selben Ergebnis.
 */
import { useState } from 'react';
import type { GameUi } from '../app/useGame';
import { OBJECT_BY_ID } from '../content/objects';
import { STATIONS } from '../content/radio';
import { describe, itemsAt } from '../engine/describe';
import type { GameState } from '../engine/types';
import { COMMAND_NAME } from './commandNames';

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

export function DetailPanel({ game }: { game: GameUi }) {
  const state = game.state!;
  const id = game.detail;
  const [number, setNumber] = useState('');
  if (!id || !OBJECT_BY_ID[id]) return null;
  const o = OBJECT_BY_ID[id];
  const acts = actionsFor(state, id);
  return (
    <aside className="detail-panel" aria-label={`Detailansicht: ${o.short}`} data-testid="detail-panel">
      <div className="detail-head">
        <h2>{o.short}</h2>
        <button
          type="button"
          className="close"
          aria-label="Detailansicht schließen"
          onClick={() => game.setDetail(null)}
        >
          ✕
        </button>
      </div>
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
    </aside>
  );
}

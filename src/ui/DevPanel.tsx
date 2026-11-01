/**
 * Entwicklerkonsole (nur mit ?dev=1): Zustand ansehen und setzen, Zeit springen, Meilenstein-Spielstände
 * laden, Ereignis-/Rätselgraph prüfen. Nicht modal – das Spiel bleibt daneben bedienbar.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { clearLog, formatLog, readLog } from '../app/playtestLog';
import type { GameUi } from '../app/useGame';
import { FACTS } from '../content/facts';
import { formatShort } from '../engine/clock';
import {
  DEV_HELP,
  ITEM_IDS,
  MILESTONES,
  RELATIONSHIP_IDS,
  contentGraph,
  contentWarnings,
  eventTable,
  milestoneState,
  puzzleTable,
} from '../engine/dev';
import { step } from '../engine/engine';
import { stageOf, threshold, thresholdNames } from '../engine/pressure';

const TABS = ['Zustand', 'Ereignisse', 'Graph', 'Meilensteine', 'Parser', 'Log'] as const;
type Tab = (typeof TABS)[number];
const LOCATIONS = ['inventory', 'desk', 'drawer', 'package', 'drive', 'datasette', 'port', 'nowhere'];
const PUZZLE_STATES = ['unknown', 'discovered', 'solving', 'solved', 'bypassed'];

/** Entwicklermodus über ?dev=1 (bleibt für die Sitzung aktiv) */
export function devEnabled(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('dev');
    if (q === '1') sessionStorage.setItem('rewind86.dev', '1');
    if (q === '0') sessionStorage.removeItem('rewind86.dev');
    return q === '1' || sessionStorage.getItem('rewind86.dev') === '1';
  } catch {
    return false;
  }
}

/** Lokales Playtest-Protokoll: vom Parser nicht verstandene Eingaben (siehe app/playtestLog.ts) */
function ParserLog() {
  const [log, setLog] = useState(() => readLog());
  const text = formatLog(log);
  return (
    <>
      <h4>Nicht verstandene Eingaben ({log.length})</h4>
      <p className="muted">
        Bleibt im Browser. Häufigste zuerst – Kandidaten für neue Verben, Substantive oder Redewendungen.
      </p>
      <div className="dev-actions">
        <button type="button" onClick={() => setLog(readLog())}>
          Aktualisieren
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(text);
          }}
        >
          Kopieren
        </button>
        <button
          type="button"
          onClick={() => {
            clearLog();
            setLog([]);
          }}
        >
          Leeren
        </button>
      </div>
      <pre className="dev-out dev-log" data-testid="parser-log">
        {text || '(leer)'}
      </pre>
    </>
  );
}

export function DevPanel({ game }: { game: GameUi }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Zustand');
  const [cmd, setCmd] = useState('');
  const state = game.state!;
  const dev = (text: string) => game.dispatch({ type: 'dev', text });

  const devOutput = state.history.filter((l) => l.text.startsWith('[DEV]')).slice(-6);
  const graph = useMemo(contentGraph, []);
  const warnings = useMemo(contentWarnings, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    dev(cmd);
    setCmd('');
  };

  if (!open)
    return (
      <button type="button" className="dev-toggle" onClick={() => setOpen(true)} data-testid="dev-toggle">
        DEV
      </button>
    );

  return (
    <aside className="dev-panel" aria-label="Entwicklerkonsole" data-testid="dev-panel">
      <div className="dev-head">
        <strong>Entwicklerkonsole</strong>
        <span>{formatShort(state.gameClock)}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Entwicklerkonsole schließen">
          ✕
        </button>
      </div>

      <form className="dev-cmd" onSubmit={submit}>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="z. B. zeit +30 · fakt chr_table · hilfe"
          aria-label="Entwicklerbefehl"
          data-testid="dev-input"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit">OK</button>
      </form>
      {devOutput.length > 0 && (
        <pre className="dev-out" aria-live="polite">
          {devOutput.map((l) => l.text.replace(/^\[DEV\] /, '')).join('\n')}
        </pre>
      )}

      <div className="dev-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="dev-body" role="tabpanel">
        {tab === 'Zustand' && (
          <>
            <h4>Zeit & Geld</h4>
            <div className="dev-row">
              {[5, 15, 60].map((m) => (
                <button key={m} type="button" onClick={() => dev(`zeit +${m}`)}>
                  +{m} min
                </button>
              ))}
              <span>
                {state.moneyDm.toFixed(2)} DM · Telefon {state.phoneCostsDm.toFixed(2)} DM
              </span>
            </div>

            <h4>Verdeckte Werte</h4>
            {RELATIONSHIP_IDS.map((id) => (
              <label key={id} className="dev-row">
                <span className="dev-key">{id}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={state.relationships[id]}
                  onChange={(e) => dev(`bez ${id} ${e.target.value}`)}
                />
                <span className="dev-muted">
                  Stufe {stageOf(state, id) ?? '–'} · Schwellen{' '}
                  {thresholdNames(id)
                    .map((n) => `${n} ${threshold(id, n)}`)
                    .join(', ')}
                </span>
              </label>
            ))}
            {Object.entries(state.telecom.locks).map(([sys, until]) => (
              <p key={sys} className="dev-muted">
                Sperre {sys} bis {formatShort(until)}
              </p>
            ))}

            <h4>Rätsel</h4>
            <table className="dev-table">
              <tbody>
                {puzzleTable(state).map((p) => (
                  <tr key={p.id}>
                    <td title={p.title}>{p.id}</td>
                    <td>
                      <select
                        value={p.status}
                        onChange={(e) => dev(`rätsel ${p.id} ${e.target.value}`)}
                        aria-label={`Status ${p.id}`}
                      >
                        {PUZZLE_STATES.map((st) => (
                          <option key={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="dev-muted">
                      Hilfe {p.hintLevel}/3 · Stufe {p.stage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Gegenstände</h4>
            <table className="dev-table">
              <tbody>
                {ITEM_IDS.map((id) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>
                      <select
                        value={state.itemLocations[id] ?? 'nowhere'}
                        onChange={(e) => dev(`item ${id} ${e.target.value}`)}
                        aria-label={`Ort ${id}`}
                      >
                        {LOCATIONS.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Flags</h4>
            <ul className="dev-list">
              {Object.entries(state.flags).map(([k, v]) => (
                <li key={k}>
                  <span className="dev-key">{k}</span> = {JSON.stringify(v)}{' '}
                  <button type="button" onClick={() => dev(`flag -${k}`)} aria-label={`Flag ${k} löschen`}>
                    ✕
                  </button>
                </li>
              ))}
              {Object.keys(state.flags).length === 0 && <li className="dev-muted">keine</li>}
            </ul>

            <h4>
              Fakten ({state.knownFacts.length}/{FACTS.length})
            </h4>
            <ul className="dev-list">
              {FACTS.map((f) => (
                <li key={f.id}>
                  <label title={f.text}>
                    <input
                      type="checkbox"
                      checked={state.knownFacts.includes(f.id)}
                      onChange={(e) => dev(`fakt ${e.target.checked ? '' : '-'}${f.id}`)}
                    />{' '}
                    {f.id}
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'Ereignisse' && (
          <table className="dev-table">
            <thead>
              <tr>
                <th>Ereignis</th>
                <th>Art</th>
                <th>Wann</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Auslösen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {eventTable(state).map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td className="dev-nowrap">{e.kind}</td>
                  <td className="dev-muted">
                    {e.when}
                    {e.conditionNow !== undefined && (e.conditionNow ? ' ✓' : ' ✗')}
                  </td>
                  <td className="dev-nowrap">{e.status}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => dev(`ereignis ${e.id}`)}
                      aria-label={`${e.id} jetzt auslösen`}
                      title="jetzt auslösen"
                    >
                      ▶
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'Graph' && (
          <>
            <h4>Prüfungen</h4>
            {warnings.length === 0 ? (
              <p className="dev-ok">Keine toten Enden bei Ereignissen und Rätseln.</p>
            ) : (
              <ul className="dev-list">
                {warnings.map((w) => (
                  <li key={w.kind + w.id} className="dev-warn">
                    {w.text}
                  </li>
                ))}
              </ul>
            )}
            <h4>Abhängigkeiten aus Contentdaten</h4>
            <table className="dev-table">
              <tbody>
                {graph.map((g, i) => (
                  <tr key={i}>
                    <td>{g.from}</td>
                    <td className="dev-muted">{g.kind}</td>
                    <td>
                      {g.to}
                      {g.detail ? ` (${g.detail})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'Meilensteine' && (
          <>
            <p className="dev-muted">
              Erzeugt durch Abspielen echter Spielbefehle ab Spielbeginn. Ersetzt den aktuellen Spielstand.
            </p>
            <ul className="dev-list">
              {MILESTONES.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    data-testid={`milestone-${m.id}`}
                    onClick={() => {
                      const s = milestoneState(m.id, step);
                      if (s) game.loadState(s, `Meilenstein: ${m.label}`);
                    }}
                  >
                    {m.label}
                  </button>{' '}
                  <span className="dev-muted">({m.commands.length} Befehle)</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'Parser' && <ParserLog />}

        {tab === 'Log' && (
          <>
            <h4>Befehle</h4>
            <pre className="dev-out">{DEV_HELP.join('\n')}</pre>
            <h4>Debug-Log (neueste zuerst)</h4>
            <pre className="dev-out dev-log">{[...state.debugLog].reverse().join('\n')}</pre>
          </>
        )}
      </div>
    </aside>
  );
}

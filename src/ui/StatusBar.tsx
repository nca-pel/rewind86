import { MAILBOXES } from '../content/networks';
import type { GameUi } from '../app/useGame';
import { useSettings } from '../app/settings';
import { audio } from '../audio/audio';
import { formatDm, formatShort } from '../engine/clock';
import { houseLineBusy } from '../engine/conditions';
import { OBJECT_BY_ID } from '../content/objects';
import { itemsAt } from '../engine/describe';

export function StatusBar({ game }: { game: GameUi }) {
  const state = game.state!;
  const { settings, update } = useSettings();
  const t = state.telecom;
  const sys = t.connectedSystemId ? MAILBOXES[t.connectedSystemId] : null;
  const line =
    t.connectedSystemId === 'btx'
      ? 'online (BTX)'
      : sys
        ? sys.access === 'public'
          ? `online (${sys.name})`
          : 'online'
        : t.ringing
          ? 'klingelt'
          : t.handset !== 'cradle'
            ? 'belegt (Hörer ab)'
            : houseLineBusy(state)
              ? 'belegt (Haus)'
              : 'frei';
  const inv = itemsAt(state, 'inventory');
  return (
    <header className="status-bar">
      <h1 className="logo">
        REWIND <span>1986</span>
      </h1>
      <dl className="status-values">
        <div>
          <dt>Zeit</dt>
          <dd data-testid="clock">{formatShort(state.gameClock)}</dd>
        </div>
        <div>
          <dt>Geld</dt>
          <dd>{formatDm(state.moneyDm)}</dd>
        </div>
        <div>
          <dt>Telefon</dt>
          <dd>{formatDm(state.phoneCostsDm)}</dd>
        </div>
        <div>
          <dt>Leitung</dt>
          <dd className={`line-${line.split(' ')[0]}`} data-testid="line-state">
            {line}
          </dd>
        </div>
      </dl>
      <div className="inventory" aria-label="Inventar">
        <span className="inv-label">Hand:</span>
        {inv.length === 0 && <span className="inv-empty">leer</span>}
        {inv.map((id) => (
          <button key={id} type="button" className="inv-item" onClick={() => game.setDetail(id)}>
            {OBJECT_BY_ID[id].short}
          </button>
        ))}
      </div>
      <nav className="status-actions" aria-label="Spielmenü">
        <button type="button" onClick={() => game.setNotebookOpen(true)}>
          Notizblock
        </button>
        <button
          type="button"
          aria-pressed={settings.audio}
          onClick={() => {
            const on = !settings.audio;
            update({ audio: on });
            audio.setEnabled(on);
            if (on) audio.unlock();
          }}
        >
          Ton {settings.audio ? 'an' : 'aus'}
        </button>
        <button type="button" onClick={() => game.setMenuOpen('menu')}>
          Menü
        </button>
      </nav>
    </header>
  );
}

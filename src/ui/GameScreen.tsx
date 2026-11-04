import { lazy, Suspense, useEffect, useState } from 'react';
import type { GameUi, Panel } from '../app/useGame';
import { AdventurePanel } from './AdventurePanel';
import { C64Panel } from './C64Panel';
import { COMMAND_NAME } from './commandNames';
import { Desk } from './Desk';
import { DetailPanel } from './DetailPanel';
import { ENDING_BY_ID } from '../content/endings';
import { DEV_TOOLS, devEnabled } from '../engine/devFlag';
import { SaveList, SettingsForm } from './Menu';
import { Modal } from './Modal';
import { Notebook } from './Notebook';
import { StatusBar } from './StatusBar';
import { renderC64 } from '../sim/c64';
import { useCommandInput } from './useCommandInput';

/** Entwicklerkonsole: nur im Entwicklungsbuild (oder mit VITE_DEV_TOOLS=1) überhaupt im Bundle */
const DevPanel = DEV_TOOLS ? lazy(() => import('./DevPanel').then((m) => ({ default: m.DevPanel }))) : null;

export function GameScreen({ game }: { game: GameUi }) {
  const state = game.state!;
  const ending = state.flags.gameOver ? ENDING_BY_ID[String(state.flags.gameOver)] : undefined;
  const [panel, setPanel] = useState<Panel>('desk');
  const [advMax, setAdvMax] = useState(false);
  const view = renderC64(state);
  const input = useCommandInput(game, view);
  const [dev] = useState(devEnabled);

  useEffect(() => {
    if (game.focusRequest?.target === 'c64') setPanel('c64');
  }, [game.focusRequest]);

  // Detailansicht (auch aus dem Inventar geöffnet) liegt im Schreibtisch-Reiter, sonst bliebe sie auf dem Handy unsichtbar
  useEffect(() => {
    if (game.detail) setPanel('desk');
  }, [game.detail]);

  const select = (id: string) => {
    // Der Notizblock hat keine Detailansicht: Klick öffnet ihn direkt
    if (id === 'notebook') return game.dispatch({ type: 'adventure', text: 'NOTIZEN' });
    game.setDetail(id);
    game.dispatch({ type: 'adventure', text: `SCHAU ${COMMAND_NAME[id] ?? id}` });
  };

  return (
    <div className="game" data-panel={panel} data-adv-max={advMax || undefined}>
      <StatusBar game={game} />
      <nav className="mobile-tabs" aria-label="Ansicht wählen">
        <button type="button" aria-pressed={panel === 'desk'} onClick={() => setPanel('desk')}>
          Schreibtisch
        </button>
        <button
          type="button"
          aria-pressed={panel === 'c64'}
          onClick={() => setPanel('c64')}
          data-testid="tab-c64"
        >
          C64
        </button>
        <button type="button" onClick={() => game.setNotebookOpen(true)}>
          Notizen
        </button>
      </nav>
      <main className="main-grid">
        <div className="desk-area">
          <Desk
            state={state}
            onSelect={select}
            selected={game.detail}
            showNames={game.showNames}
            onToggleNames={() => game.setShowNames(!game.showNames)}
          />
          <DetailPanel game={game} />
        </div>
        <div className="c64-area">
          <C64Panel game={game} view={view} input={input} />
        </div>
        <div className="adv-area">
          <AdventurePanel
            game={game}
            input={input}
            maximized={advMax}
            onToggleMaximize={() => setAdvMax((v) => !v)}
          />
        </div>
      </main>

      {game.notebookOpen && <Notebook game={game} />}
      {game.menuOpen && (
        <Modal title="Menü" onClose={() => game.setMenuOpen(false)}>
          <h3>Spielstände</h3>
          <SaveList
            current={state}
            allowSave
            onLoad={(s, msg) => {
              game.loadState(s, msg);
              game.setMenuOpen(false);
            }}
            onError={game.showToast}
          />
          <h3>Einstellungen</h3>
          <SettingsForm />
          <h3>Spiel</h3>
          <button type="button" onClick={game.toTitle}>
            Zurück zum Titelbildschirm
          </button>
        </Modal>
      )}
      {game.sliceEnd && (
        <div className="slice-end" role="dialog" aria-label="Ende des Ausschnitts">
          <h2>
            <span>Fortsetzung folgt …</span>
          </h2>
          <p>
            Das war der Prolog von REWIND 1986. Die Geschichte geht weiter: Die nächsten Tage laufen als
            Alltag, und irgendwo muss sich finden lassen, was auf Diskette 2 steht.
          </p>
          <button type="button" onClick={game.dismissSliceEnd}>
            Weiterspielen
          </button>
        </div>
      )}
      {ending && !game.menuOpen && (
        <div className="slice-end game-over" role="alertdialog" aria-label={`Spielende: ${ending.title}`}>
          <h2>
            <span>Ende: {ending.title}</span>
          </h2>
          <p>{ending.text}</p>
          <div className="game-over-actions">
            <button type="button" onClick={game.undoGameOver} data-testid="undo-game-over">
              Letzten Schritt zurücknehmen
            </button>
            <button type="button" onClick={() => game.setMenuOpen('load')}>
              Spielstand laden
            </button>
            <button type="button" onClick={game.toTitle}>
              Zum Titelbildschirm
            </button>
          </div>
        </div>
      )}
      {DevPanel && dev && (
        <Suspense fallback={null}>
          <DevPanel game={game} />
        </Suspense>
      )}
      <div className="toast" role="status" aria-live="polite" data-testid="toast">
        {game.toast}
      </div>
    </div>
  );
}

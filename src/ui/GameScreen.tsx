import { useEffect, useState } from 'react';
import { useSettings } from '../app/settings';
import type { GameUi, Panel } from '../app/useGame';
import { AdventurePanel } from './AdventurePanel';
import { C64Panel } from './C64Panel';
import { COMMAND_NAME } from './commandNames';
import { Desk } from './Desk';
import { Credits } from './Credits';
import { DetailPanel } from './DetailPanel';
import { ENDING_BY_ID } from '../content/endings';
import { DevPanel, devEnabled } from './DevPanel';
import { SaveList, SettingsForm } from './Menu';
import { Modal } from './Modal';
import { Notebook } from './Notebook';
import { StatusBar } from './StatusBar';

export function GameScreen({ game }: { game: GameUi }) {
  const { settings } = useSettings();
  const state = game.state!;
  const ending = state.flags.gameOver ? ENDING_BY_ID[String(state.flags.gameOver)] : undefined;
  const [panel, setPanel] = useState<Panel>('desk');
  const [dev] = useState(devEnabled);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    if (game.focusRequest?.target === 'c64') setPanel('c64');
  }, [game.focusRequest]);

  const select = (id: string) => {
    game.setDetail(id);
    game.dispatch({ type: 'adventure', text: `UNTERSUCHE ${COMMAND_NAME[id] ?? id}` });
  };

  return (
    <div className="game" data-panel={panel}>
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
          <Desk state={state} onSelect={select} selected={game.detail} pixel={settings.pixelArt} />
          <DetailPanel game={game} />
        </div>
        <div className="c64-area">
          <C64Panel game={game} />
        </div>
        <div className="adv-area">
          <AdventurePanel game={game} />
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
          <div className="io-row">
            <button
              type="button"
              onClick={() => {
                game.setMenuOpen(false);
                setCreditsOpen(true);
              }}
              data-testid="open-credits"
            >
              Credits
            </button>
            <button type="button" onClick={game.toTitle}>
              Zurück zum Titelbildschirm
            </button>
          </div>
        </Modal>
      )}
      {creditsOpen && (
        <Modal title="Credits" onClose={() => setCreditsOpen(false)}>
          <Credits />
        </Modal>
      )}
      {game.sliceEnd && (
        <div className="slice-end" role="dialog" aria-label="Ende des Ausschnitts">
          <h2>Fortsetzung folgt …</h2>
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
          <h2>Ende: {ending.title}</h2>
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
      {dev && <DevPanel game={game} />}
      <div className="toast" role="status" aria-live="polite" data-testid="toast">
        {game.toast}
      </div>
    </div>
  );
}

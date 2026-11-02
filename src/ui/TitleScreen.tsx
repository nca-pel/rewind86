import { useEffect, useState } from 'react';
import { audio, TITLE_TRACK } from '../audio/audio';
import { readSlot } from '../app/storage';
import type { Difficulty, GameState } from '../engine/types';
import { formatShort } from '../engine/clock';
import { Credits } from './Credits';
import { SaveList, SettingsForm } from './Menu';
import { Modal } from './Modal';
import { PrinterStory } from './PrinterStory';

export function TitleScreen({
  onNew,
  onLoad,
  toast,
  showToast,
}: {
  onNew: (difficulty: Difficulty) => void;
  onLoad: (s: GameState, msg: string) => void;
  toast: string | null;
  showToast: (t: string) => void;
}) {
  const [dialog, setDialog] = useState<null | 'load' | 'settings' | 'credits'>(null);
  // Neue Spiele starten im Normalmodus. Der schwere Modus bleibt in der Engine erhalten und lässt sich
  // vorerst nur per Adresszeile wählen (?difficulty=hard), nicht mehr über das Titelbild.
  const difficulty: Difficulty =
    new URLSearchParams(window.location.search).get('difficulty') === 'hard' ? 'hard' : 'normal';
  // Titelmusik: startet nach der ersten Interaktion (Autoplay-Regeln) und endet mit dem Titelbild
  useEffect(() => {
    audio.startMusic(TITLE_TRACK);
    return () => audio.stopMusic();
  }, []);
  const auto = readSlot('auto');
  const autoFile = auto && auto.ok ? auto.file : null;
  return (
    <main className="title-screen">
      <header className="title-head">
        <h1>
          REWIND <span>1986</span>
        </h1>
        <p className="tagline">
          <span className="tagline-place">Rheda-Wiedenbrück, Herbst 1986</span>{' '}
          <span>Ein C64, eine kopierte Diskette –</span> <span>und ein Netz, das es nicht geben dürfte.</span>
        </p>
      </header>
      <div className="title-box">
        <div className="title-buttons">
          <button type="button" onClick={() => onNew(difficulty)} data-testid="new-game">
            Neues Spiel
          </button>
          {autoFile && (
            <button
              type="button"
              onClick={() => onLoad(autoFile.state, 'Weiter geht’s.')}
              data-testid="continue"
            >
              Fortsetzen ({formatShort(autoFile.gameClock)})
            </button>
          )}
          <button type="button" onClick={() => setDialog('load')}>
            Laden
          </button>
          <button type="button" onClick={() => setDialog('settings')}>
            Einstellungen
          </button>
          <button type="button" onClick={() => setDialog('credits')} data-testid="open-credits">
            Credits
          </button>
        </div>
        <p className="disclaimer">
          Fiktive Handlung: Alle Geheimdienstaktivitäten betreffen erfundene Personen und Netzwerke. Reale
          Firmen und Orte dienen nur als historisches Umfeld. Es werden keine echten Telefonnummern gewählt.
        </p>
      </div>
      <PrinterStory />
      {dialog === 'load' && (
        <Modal title="Spielstand laden" onClose={() => setDialog(null)}>
          <SaveList current={null} allowSave={false} onLoad={onLoad} onError={showToast} />
        </Modal>
      )}
      {dialog === 'settings' && (
        <Modal title="Einstellungen" onClose={() => setDialog(null)}>
          <SettingsForm />
        </Modal>
      )}
      {dialog === 'credits' && (
        <Modal title="Credits" onClose={() => setDialog(null)}>
          <Credits />
        </Modal>
      )}
      <div className="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}

import { useState } from 'react';
import { readSlot } from '../app/storage';
import type { GameState } from '../engine/types';
import { formatShort } from '../engine/clock';
import { SaveList, SettingsForm } from './Menu';
import { Modal } from './Modal';

export function TitleScreen({
  onNew,
  onLoad,
  toast,
  showToast,
}: {
  onNew: () => void;
  onLoad: (s: GameState, msg: string) => void;
  toast: string | null;
  showToast: (t: string) => void;
}) {
  const [dialog, setDialog] = useState<null | 'load' | 'settings'>(null);
  const auto = readSlot('auto');
  const autoFile = auto && auto.ok ? auto.file : null;
  return (
    <main className="title-screen">
      <div className="title-box">
        <h1>
          REWIND <span>1986</span>
        </h1>
        <p className="tagline">
          Rheda-Wiedenbrück, Herbst 1986. Ein C64, eine kopierte Diskette – und ein Netz, das es nicht geben
          dürfte.
        </p>
        <div className="title-buttons">
          <button type="button" onClick={onNew} data-testid="new-game">
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
        </div>
        <p className="disclaimer">
          Vertikaler Ausschnitt (ca. 15–30 Minuten). Fiktive Handlung: Alle Geheimdienstaktivitäten betreffen
          erfundene Personen und Netzwerke. Reale Firmen und Orte dienen nur als historisches Umfeld. Es
          werden keine echten Telefonnummern gewählt.
        </p>
      </div>
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
      <div className="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}

import { useRef, useState } from 'react';
import { useSettings, type Settings } from '../app/settings';
import { deleteSlot, downloadSave, listSlots, writeSlot, type Slot } from '../app/storage';
import { audio } from '../audio/audio';
import { formatShort } from '../engine/clock';
import { parseSave } from '../engine/save';
import type { GameState } from '../engine/types';

export function SaveList({
  current,
  onLoad,
  onError,
  allowSave,
}: {
  current: GameState | null;
  onLoad: (s: GameState, msg: string) => void;
  onError: (msg: string) => void;
  allowSave: boolean;
}) {
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const slots = listSlots();
  const importFile = async (f: File) => {
    if (f.size > 2 * 1024 * 1024) return onError('Die Datei ist zu groß (max. 2 MB).');
    const r = parseSave(await f.text());
    if (!r.ok) return onError(`Import fehlgeschlagen: ${r.error}`);
    onLoad(r.file.state, 'Spielstand importiert.');
  };
  return (
    <div className="save-list">
      <table>
        <thead>
          <tr>
            <th scope="col">Slot</th>
            <th scope="col">Spielzeit</th>
            <th scope="col">Gespeichert</th>
            <th scope="col">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {slots.map(({ slot, file, error }) => (
            <tr key={slot}>
              <th scope="row">{slot === 'auto' ? 'Auto' : slot}</th>
              <td>{file ? formatShort(file.gameClock) : error ? 'defekt' : '—'}</td>
              <td>{file ? new Date(file.savedAt).toLocaleString('de-DE') : ''}</td>
              <td className="slot-actions">
                {allowSave && current && slot !== 'auto' && (
                  <button
                    type="button"
                    onClick={() => {
                      onError(
                        writeSlot(slot as Slot, current)
                          ? `Gespeichert in Slot ${slot}.`
                          : 'Speichern fehlgeschlagen.',
                      );
                      force((n) => n + 1);
                    }}
                    data-testid={`save-${slot}`}
                  >
                    Speichern
                  </button>
                )}
                {file && (
                  <button
                    type="button"
                    onClick={() => onLoad(file.state, `Slot ${slot} geladen.`)}
                    data-testid={`load-${slot}`}
                  >
                    Laden
                  </button>
                )}
                {(file || error) && slot !== 'auto' && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteSlot(slot);
                      force((n) => n + 1);
                    }}
                  >
                    Löschen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="io-row">
        {current && (
          <button type="button" onClick={() => downloadSave(current)} data-testid="export">
            Exportieren (JSON)
          </button>
        )}
        <button type="button" onClick={() => fileRef.current?.click()}>
          Importieren …
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          data-testid="import-file"
          aria-label="Spielstand-Datei importieren"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function SettingsForm() {
  const { settings, update } = useSettings();
  const set = (p: Partial<Settings>) => {
    update(p);
    if (p.audio !== undefined) {
      audio.setEnabled(p.audio);
      if (p.audio) audio.unlock();
    }
    if (p.volume !== undefined) audio.setVolume(p.volume);
  };
  return (
    <form className="settings" onSubmit={(e) => e.preventDefault()}>
      <label>
        <input type="checkbox" checked={settings.audio} onChange={(e) => set({ audio: e.target.checked })} />{' '}
        Ton
      </label>
      <label>
        Lautstärke{' '}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => set({ volume: Number(e.target.value) })}
        />
      </label>
      <label>
        Bewegung{' '}
        <select
          value={settings.motion}
          onChange={(e) => set({ motion: e.target.value as Settings['motion'] })}
        >
          <option value="system">wie Systemeinstellung</option>
          <option value="reduced">reduziert</option>
          <option value="full">voll</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={settings.crt} onChange={(e) => set({ crt: e.target.checked })} />{' '}
        CRT-Effekt (Scanlines)
      </label>
      <label>
        Textgröße{' '}
        <select
          value={settings.textSize}
          onChange={(e) => set({ textSize: e.target.value as Settings['textSize'] })}
        >
          <option value="s">klein</option>
          <option value="m">mittel</option>
          <option value="l">groß</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => set({ highContrast: e.target.checked })}
        />{' '}
        Hoher Kontrast
      </label>
      <p className="muted">
        Alle Geräusche haben eine Textentsprechung im Protokoll – das Spiel ist ohne Ton vollständig lösbar.
      </p>
    </form>
  );
}

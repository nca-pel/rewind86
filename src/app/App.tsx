import { useCallback, useEffect, useMemo, useState } from 'react';
import { audio } from '../audio/audio';
import { GameScreen } from '../ui/GameScreen';
import { TitleScreen } from '../ui/TitleScreen';
import { loadSettings, reducedMotion, SettingsContext, storeSettings, type Settings } from './settings';
import { useGame } from './useGame';

export function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const update = useCallback((p: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...p };
      storeSettings(next);
      return next;
    });
  }, []);
  const game = useGame();

  useEffect(() => {
    audio.setEnabled(settings.audio);
    audio.setVolume(settings.volume);
    // Audio erst nach ausdrücklicher Nutzerinteraktion starten (kein Autoplay)
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [settings.audio, settings.volume]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = settings.textSize;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.motion = reducedMotion(settings) ? 'reduced' : 'full';
  }, [settings]);

  const ctx = useMemo(() => ({ settings, update }), [settings, update]);

  return (
    <SettingsContext.Provider value={ctx}>
      {game.state ? (
        <GameScreen game={game} />
      ) : (
        <TitleScreen
          onNew={game.newGame}
          onLoad={(s, m) => game.loadState(s, m)}
          toast={game.toast}
          showToast={game.showToast}
        />
      )}
    </SettingsContext.Provider>
  );
}

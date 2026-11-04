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

  // iOS legt die Bildschirmtastatur über die Seite, ohne das Layout zu verkleinern: Spielfläche auf den
  // sichtbaren Bereich (visualViewport) begrenzen, damit die Eingabezeile über der Tastatur bleibt
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const apply = () => {
      root.style.setProperty('--vv-h', `${vv.height}px`);
      root.style.setProperty('--vv-top', `${vv.offsetTop}px`);
    };
    // Fokus per Code (z. B. nach dem Einschalten) löst auf iOS nicht immer ein resize aus: nachmessen,
    // bis die Tastatur-Animation durch ist
    const timers: number[] = [];
    const remeasure = () => {
      timers.forEach(window.clearTimeout);
      timers.length = 0;
      for (const ms of [0, 150, 400, 800]) timers.push(window.setTimeout(apply, ms));
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    window.addEventListener('focusin', remeasure);
    window.addEventListener('focusout', remeasure);
    return () => {
      timers.forEach(window.clearTimeout);
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
      window.removeEventListener('focusin', remeasure);
      window.removeEventListener('focusout', remeasure);
      root.style.removeProperty('--vv-h');
      root.style.removeProperty('--vv-top');
    };
  }, []);

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

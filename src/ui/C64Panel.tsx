/**
 * C64-Ansicht: Monitor und Tastenleiste. Getippt wird in der gemeinsamen Eingabezeile des ADVENTURE-Fensters
 * (siehe useCommandInput); die Tasten hier wirken immer auf den C64.
 */
import { useEffect } from 'react';
import type { GameUi } from '../app/useGame';
import { reducedMotion, useSettings } from '../app/settings';
import type { C64Key } from '../engine/types';
import type { C64View } from '../sim/c64';
import { DemoCanvas } from './DemoCanvas';
import { MonitorVideo } from './MonitorVideo';
import { bootProfile } from '../engine/state';
import { C64Display } from './C64Display';
import { MonitorCase } from './MonitorCase';
import type { CommandInput } from './useCommandInput';

const SPECIAL_KEYS: Array<{ key: C64Key; label: string; aria: string }> = [
  { key: 'RUNSTOP', label: 'RUN/STOP', aria: 'Taste RUN/STOP' },
  { key: 'ARROW_LEFT', label: '←', aria: 'Taste Pfeil links (oben links auf der C64-Tastatur)' },
  { key: 'SPACE', label: 'SPACE', aria: 'Leertaste' },
  { key: 'RETURN', label: 'RETURN', aria: 'Taste RETURN' },
  { key: 'CLRHOME', label: 'CLR', aria: 'Taste CLR/HOME' },
  { key: 'F1', label: 'F1', aria: 'Funktionstaste F1' },
  { key: 'F3', label: 'F3', aria: 'Funktionstaste F3' },
  { key: 'F5', label: 'F5', aria: 'Funktionstaste F5' },
  { key: 'F7', label: 'F7', aria: 'Funktionstaste F7' },
];

export function C64Panel({ game, view: r, input }: { game: GameUi; view: C64View; input: CommandInput }) {
  const { dispatch } = game;
  const { settings } = useSettings();
  const reduced = reducedMotion(settings);

  useEffect(() => {
    if (!r.tickMs) return;
    const id = window.setInterval(() => {
      if (!document.hidden) dispatch({ type: 'c64tick' });
    }, r.tickMs);
    return () => window.clearInterval(id);
  }, [r.tickMs, dispatch]);

  const profile = bootProfile();

  return (
    <section
      className={`c64-panel${input.focused && input.target === 'c64' ? ' input-focused' : ''}`}
      aria-label={profile.machineName}
    >
      {/* Modus nur für Screenreader: sichtbar zeigen ihn Platzhalter der Eingabe und LED, der Monitor braucht die Höhe */}
      <p className="sr-only">
        {profile.badge}:{' '}
        {!r.powerOn
          ? 'ausgeschaltet'
          : input.keysMode
            ? 'Tastenmodus: Tasten gehen direkt an das Programm'
            : r.inputMode === 'line'
              ? 'Programm-Eingabe: Text tippen + RETURN'
              : 'BASIC: Zeile tippen + RETURN'}
      </p>
      <MonitorCase
        power={r.powerOn}
        onScreenClick={() => {
          if (r.powerOn) input.setTarget('c64');
          input.focusInput();
        }}
      >
        <C64Display
          view={r}
          preview={input.preview}
          crt={settings.crt && !reduced}
          reduced={reduced}
          machineName={profile.machineName}
        >
          {r.demoScreen !== undefined && <DemoCanvas screen={r.demoScreen} reduced={reduced} />}
          {r.youtube && <MonitorVideo id={r.youtube} crt={settings.crt && !reduced} />}
        </C64Display>
      </MonitorCase>
      <div className="keyboard-deck">
        <div className="keys" role="toolbar" aria-label="C64-Sondertasten">
          {SPECIAL_KEYS.map((k) => (
            <button
              key={k.key}
              type="button"
              aria-label={k.aria}
              onClick={() => input.pressSpecial(k.key)}
              data-key={k.key}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <p id="c64-help" className="sr-only">
        Die Eingabezeile im Adventure-Fenster wechselt mit dem Umschalter vor der Zeile oder dem Tastenkürzel
        Alt+C zwischen Adventure und C64; im C64-Modus gibt ein vorangestelltes Ausrufezeichen eine Zeile an
        das Adventure. Im Tastenmodus wird jede Taste sofort an das laufende Programm gesendet. Escape
        entspricht RUN/STOP; Backspace, ^ oder ` entspricht der Taste Pfeil links; Entf entspricht DEL.
      </p>
    </section>
  );
}

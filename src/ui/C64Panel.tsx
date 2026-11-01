/**
 * C64-Ansicht mit eigener Eingabezeile. Tastatureingaben gehen nur an diesen Bereich,
 * wenn dessen Eingabefeld fokussiert ist (GDD §6.2, §14.3).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { GameUi } from '../app/useGame';
import { reducedMotion, useSettings } from '../app/settings';
import type { C64Key } from '../engine/types';
import { renderC64 } from '../sim/c64';
import { DemoCanvas } from './DemoCanvas';
import { MonitorVideo } from './MonitorVideo';
import { bootProfile } from '../engine/state';
import { C64Display } from './C64Display';
import { MonitorCase } from './MonitorCase';

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

function mapKey(e: KeyboardEvent): C64Key | null {
  if (e.key === 'Enter') return 'RETURN';
  if (e.key === 'Escape') return 'RUNSTOP';
  if (e.key === ' ') return 'SPACE';
  if (e.code === 'Backquote' || e.key === '^' || e.key === '`' || e.key === '←' || e.key === '_')
    return 'ARROW_LEFT';
  if (/^F[1-8]$/.test(e.key)) return e.key;
  if (e.key === 'Home') return 'CLRHOME';
  if (e.key === 'Backspace') return 'DEL';
  if (e.key.length === 1) return e.key.toUpperCase();
  return null;
}

export function C64Panel({ game }: { game: GameUi }) {
  const state = game.state!;
  const { dispatch, focusRequest } = game;
  const { settings } = useSettings();
  const reduced = reducedMotion(settings);
  const r = renderC64(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [hist, setHist] = useState(-1);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!r.tickMs) return;
    const id = window.setInterval(() => {
      if (!document.hidden) dispatch({ type: 'c64tick' });
    }, r.tickMs);
    return () => window.clearInterval(id);
  }, [r.tickMs, dispatch]);

  useEffect(() => {
    if (focusRequest?.target === 'c64') inputRef.current?.focus({ preventScroll: true });
  }, [focusRequest]);

  const keysMode = r.powerOn && r.inputMode === 'keys';

  const submitLine = () => {
    dispatch({ type: 'c64line', text: value });
    setValue('');
    setHist(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (keysMode) {
      const k = mapKey(e);
      if (k) {
        e.preventDefault();
        dispatch({ type: 'c64key', key: k });
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitLine();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dispatch({ type: 'c64key', key: 'RUNSTOP' });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const h = state.computer.inputHistory;
      if (!h.length) return;
      e.preventDefault();
      const next =
        e.key === 'ArrowUp' ? (hist < 0 ? h.length - 1 : Math.max(0, hist - 1)) : hist < 0 ? -1 : hist + 1;
      if (next >= h.length || next < 0) {
        setHist(-1);
        setValue('');
      } else {
        setHist(next);
        setValue(h[next]);
      }
    }
  };

  const onChange = (v: string) => {
    if (keysMode) {
      // Mobile Bildschirmtastaturen liefern oft keine verwertbaren keydown-Ereignisse.
      for (const ch of v) dispatch({ type: 'c64key', key: ch === ' ' ? 'SPACE' : ch.toUpperCase() });
      setValue('');
      return;
    }
    setValue(v.slice(0, 80));
  };

  const pressSpecial = (k: C64Key) => {
    if (!keysMode && k === 'RETURN') submitLine();
    else dispatch({ type: 'c64key', key: k });
    inputRef.current?.focus({ preventScroll: true });
  };

  const preview = r.powerOn && r.inputMode !== 'keys' ? value.toUpperCase() : '';
  const profile = bootProfile();

  return (
    <section className={`c64-panel${focused ? ' input-focused' : ''}`} aria-label={profile.machineName}>
      {/* Modus nur für Screenreader: sichtbar zeigen ihn Platzhalter der Eingabe und LED, der Monitor braucht die Höhe */}
      <p className="sr-only">
        {profile.badge}:{' '}
        {!r.powerOn
          ? 'ausgeschaltet'
          : keysMode
            ? 'Tastenmodus: Tasten gehen direkt an das Programm'
            : r.inputMode === 'line'
              ? 'Programm-Eingabe: Text tippen + RETURN'
              : 'BASIC: Zeile tippen + RETURN'}
      </p>
      <MonitorCase power={r.powerOn} onScreenClick={() => inputRef.current?.focus({ preventScroll: true })}>
        <C64Display
          view={r}
          preview={preview}
          crt={settings.crt && !reduced}
          reduced={reduced}
          machineName={profile.machineName}
        >
          {r.demoScreen !== undefined && <DemoCanvas screen={r.demoScreen} reduced={reduced} />}
          {r.youtube && <MonitorVideo id={r.youtube} crt={settings.crt && !reduced} />}
        </C64Display>
      </MonitorCase>
      <div className="keyboard-deck">
        <label className="c64-input-row">
          <span className="sr-only">C64-Eingabe</span>
          <span className="prompt" aria-hidden="true">
            C64&gt;
          </span>
          <input
            ref={inputRef}
            data-testid="c64-input"
            className="c64-input"
            value={value}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              !r.powerOn
                ? 'C64 ist aus'
                : keysMode
                  ? 'Taste drücken …'
                  : r.inputMode === 'line'
                    ? 'Text + RETURN'
                    : 'z. B. LOAD"$",8'
            }
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-describedby="c64-help"
          />
        </label>
        <div className="special-keys" role="toolbar" aria-label="C64-Sondertasten">
          {SPECIAL_KEYS.map((k) => (
            <button
              key={k.key}
              type="button"
              aria-label={k.aria}
              onClick={() => pressSpecial(k.key)}
              data-key={k.key}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <p id="c64-help" className="sr-only">
        Eigene C64-Eingabe. Im Tastenmodus wird jede Taste sofort an das laufende Programm gesendet. Escape
        entspricht RUN/STOP; ^ oder ` entspricht der Taste Pfeil links.
      </p>
    </section>
  );
}

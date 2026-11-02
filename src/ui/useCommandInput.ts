/**
 * Gemeinsame Eingabezeile im ADVENTURE-Fenster. Sie spricht entweder mit dem Adventure-Parser oder mit dem
 * C64 (Zeilenmodus bzw. Tastenmodus). Der Umschalter ist das Prompt-Zeichen vor der Zeile; die Sondertasten
 * des C64 schalten selbst auf den C64 um. Im C64-Modus gibt ein vorangestelltes „!“ eine einzelne Zeile an das Adventure.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { GameUi } from '../app/useGame';
import type { C64Key } from '../engine/types';
import type { C64View } from '../sim/c64';

export type InputTarget = 'adventure' | 'c64';

function mapKey(e: KeyboardEvent): C64Key | null {
  if (e.key === 'Enter') return 'RETURN';
  if (e.key === 'Escape') return 'RUNSTOP';
  if (e.key === ' ') return 'SPACE';
  if (
    e.key === 'Backspace' ||
    e.code === 'Backquote' ||
    e.key === '^' ||
    e.key === '`' ||
    e.key === '←' ||
    e.key === '_'
  )
    return 'ARROW_LEFT';
  if (/^F[1-8]$/.test(e.key)) return e.key;
  if (e.key === 'Home') return 'CLRHOME';
  if (e.key === 'Delete') return 'DEL';
  if (e.key.length === 1) return e.key.toUpperCase();
  return null;
}

export function useCommandInput(game: GameUi, view: C64View) {
  const { dispatch, focusRequest } = game;
  const state = game.state!;
  const [target, setTargetRaw] = useState<InputTarget>('adventure');
  const [values, setValues] = useState({ adventure: '', c64: '' });
  const [advHist, setAdvHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const powerOn = view.powerOn;
  const keysMode = target === 'c64' && powerOn && view.inputMode === 'keys';

  const focusInput = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  const setTarget = useCallback((t: InputTarget) => {
    setTargetRaw(t);
    setHistIdx(-1);
  }, []);

  // Engine-Hinweise (z. B. „benutze Computer“) legen den Fokus auf die Zeile und wählen das Ziel
  useEffect(() => {
    if (!focusRequest) return;
    setTarget(focusRequest.target);
    focusInput();
  }, [focusRequest, setTarget, focusInput]);

  // Ohne laufenden C64 gibt es nichts, was die Zeile annehmen könnte
  useEffect(() => {
    if (!powerOn && target === 'c64') setTarget('adventure');
  }, [powerOn, target, setTarget]);

  const setValue = (t: InputTarget, v: string) => setValues((x) => ({ ...x, [t]: v }));

  const sendAdventure = (text: string) => {
    dispatch({ type: 'adventure', text });
    setAdvHist((h) => [...h.slice(-49), text]);
    setHistIdx(-1);
  };

  const submitC64Line = () => {
    const raw = values.c64;
    const t = raw.trim();
    if (t.startsWith('!')) {
      const rest = t.slice(1).trim();
      if (rest) sendAdventure(rest);
    } else {
      dispatch({ type: 'c64line', text: raw });
    }
    setValue('c64', '');
    setHistIdx(-1);
  };

  const submit = () => {
    if (target === 'adventure') {
      const text = values.adventure.trim();
      if (!text) return;
      sendAdventure(text);
      setValue('adventure', '');
    } else if (keysMode) {
      dispatch({ type: 'c64key', key: 'RETURN' });
    } else {
      submitC64Line();
    }
  };

  const history = target === 'c64' ? state.computer.inputHistory : advHist;

  const browseHistory = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!history.length) return;
    e.preventDefault();
    const next =
      e.key === 'ArrowUp'
        ? histIdx < 0
          ? history.length - 1
          : Math.max(0, histIdx - 1)
        : histIdx < 0
          ? -1
          : histIdx + 1;
    if (next < 0 || next >= history.length) {
      setHistIdx(-1);
      setValue(target, '');
    } else {
      setHistIdx(next);
      setValue(target, history[next]);
    }
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
    if (target === 'c64' && e.key === 'Escape') {
      e.preventDefault();
      dispatch({ type: 'c64key', key: 'RUNSTOP' });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      browseHistory(e);
    }
  };

  const onChange = (v: string) => {
    if (keysMode) {
      // Mobile Bildschirmtastaturen liefern oft keine verwertbaren keydown-Ereignisse.
      for (const ch of v) dispatch({ type: 'c64key', key: ch === ' ' ? 'SPACE' : ch.toUpperCase() });
      setValue('c64', '');
      return;
    }
    setValue(target, target === 'c64' ? v.slice(0, 80) : v);
  };

  /** Sondertasten-Leiste: wirkt immer auf den C64 und schaltet die Zeile dorthin um */
  const pressSpecial = (k: C64Key) => {
    const lineMode = powerOn && view.inputMode !== 'keys';
    if (powerOn) setTarget('c64');
    if (k === 'RETURN' && lineMode) submitC64Line();
    else if (lineMode && (k === 'SPACE' || k === 'ARROW_LEFT'))
      // Im Zeilenmodus tippt die Taste ins Eingabefeld (wie die normale Tastatur), statt an den C64 zu gehen
      setValues((x) => ({ ...x, c64: (x.c64 + (k === 'SPACE' ? ' ' : '←')).slice(0, 80) }));
    else dispatch({ type: 'c64key', key: k });
    focusInput();
  };

  const toggleTarget = () => {
    if (target === 'c64') setTarget('adventure');
    else if (powerOn) setTarget('c64');
    focusInput();
  };

  // Tastenkürzel Alt+C: zwischen Adventure und C64 wechseln, auch wenn der Fokus gerade woanders liegt.
  // (event.code statt event.key, weil Alt+Buchstabe auf manchen Systemen Sonderzeichen liefert)
  const toggleRef = useRef(toggleTarget);
  toggleRef.current = toggleTarget;
  useEffect(() => {
    const onWindowKey = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyC') {
        e.preventDefault();
        toggleRef.current();
      }
    };
    window.addEventListener('keydown', onWindowKey);
    return () => window.removeEventListener('keydown', onWindowKey);
  }, []);

  const placeholder =
    target === 'adventure'
      ? 'z. B. NIMM HÖRER'
      : keysMode
        ? 'Taste drücken …'
        : view.inputMode === 'line'
          ? 'Text + RETURN'
          : 'z. B. LOAD"$",8   (! = Adventure)';

  /** Nur im Zeilenmodus des C64 zeigt der Monitor die gerade getippte Zeile */
  const preview = target === 'c64' && powerOn && view.inputMode !== 'keys' ? values.c64.toUpperCase() : '';

  return {
    target,
    setTarget,
    powerOn,
    keysMode,
    value: values[target],
    placeholder,
    preview,
    focused,
    setFocused,
    inputRef,
    focusInput,
    submit,
    onKeyDown,
    onChange,
    pressSpecial,
    toggleTarget,
  };
}

export type CommandInput = ReturnType<typeof useCommandInput>;

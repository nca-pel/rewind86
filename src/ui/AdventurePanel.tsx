import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { GameUi } from '../app/useGame';
import type { LogEntry } from '../engine/types';

function Entry({ e }: { e: LogEntry }) {
  return (
    <p className={`log-entry log-${e.kind}`}>
      {e.speaker && <strong className="speaker">{e.speaker}: </strong>}
      {e.text}
    </p>
  );
}

export function AdventurePanel({ game }: { game: GameUi }) {
  const state = game.state!;
  const [value, setValue] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.history.length]);

  useEffect(() => {
    if (game.focusRequest?.target === 'adventure') inputRef.current?.focus({ preventScroll: true });
  }, [game.focusRequest]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    game.dispatch({ type: 'adventure', text });
    setHist((h) => [...h.slice(-49), text]);
    setHistIdx(-1);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if (!hist.length) return;
    e.preventDefault();
    const next =
      e.key === 'ArrowUp'
        ? histIdx < 0
          ? hist.length - 1
          : Math.max(0, histIdx - 1)
        : histIdx < 0
          ? -1
          : histIdx + 1;
    if (next < 0 || next >= hist.length) {
      setHistIdx(-1);
      setValue('');
    } else {
      setHistIdx(next);
      setValue(hist[next]);
    }
  };

  return (
    <section className={`adventure-panel${focused ? ' input-focused' : ''}`} aria-label="Adventure">
      <div className="panel-title">
        <span className="badge adv-badge">ADVENTURE</span>
        <span className="panel-hint">Was tust du? (HILFE für Beispiele)</span>
      </div>
      <div
        className="log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Adventure-Protokoll"
        data-testid="adventure-log"
      >
        {state.history.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </div>
      <form className="adv-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="adv-input">
          Adventure-Befehl
        </label>
        <span className="prompt" aria-hidden="true">
          &gt;
        </span>
        <input
          id="adv-input"
          ref={inputRef}
          data-testid="adventure-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          enterKeyHint="send"
          placeholder="z. B. NIMM HÖRER"
          maxLength={300}
        />
        <button type="submit">Los</button>
      </form>
    </section>
  );
}

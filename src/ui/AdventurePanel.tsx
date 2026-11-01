import { useEffect, useRef, type FormEvent } from 'react';
import type { GameUi } from '../app/useGame';
import type { LogEntry } from '../engine/types';
import type { CommandInput } from './useCommandInput';

function Entry({ e }: { e: LogEntry }) {
  return (
    <p className={`log-entry log-${e.kind}`}>
      {e.speaker && <strong className="speaker">{e.speaker}: </strong>}
      {e.text}
    </p>
  );
}

export function AdventurePanel({
  game,
  input,
  maximized,
  onToggleMaximize,
}: {
  game: GameUi;
  input: CommandInput;
  maximized: boolean;
  onToggleMaximize: () => void;
}) {
  const state = game.state!;
  const logRef = useRef<HTMLDivElement>(null);
  const c64 = input.target === 'c64';

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.history.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    input.submit();
  };

  return (
    <section
      className={`adventure-panel${input.focused ? ' input-focused' : ''}${c64 ? ' c64-mode' : ''}`}
      data-target={input.target}
      aria-label="Adventure"
    >
      <div className="panel-title">
        <button
          type="button"
          className="win-btn"
          onClick={onToggleMaximize}
          aria-pressed={maximized}
          aria-label={maximized ? 'Adventure verkleinern' : 'Adventure maximieren'}
          title={maximized ? 'Verkleinern (Schreibtisch einblenden)' : 'Maximieren (Schreibtisch ausblenden)'}
          data-testid="adventure-maximize"
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" shapeRendering="crispEdges">
            {maximized ? (
              <path
                d="M4 1h2v5H1V4h3zM6 1h2v3h3v2H6zM1 6h5v5H4V8H1zM6 6h5v2H8v3H6z"
                fill="currentColor"
                fillRule="evenodd"
              />
            ) : (
              <path d="M1 1h4v2H3v2H1zM7 1h4v4H9V3H7zM1 7h2v2h2v2H1zM9 7h2v4H7V9h2z" fill="currentColor" />
            )}
          </svg>
        </button>
        <span className="badge adv-badge">ADVENTURE</span>
        <span className="panel-hint">Was tust du? (HILFE für Beispiele)</span>
      </div>
      <div
        className="log"
        ref={logRef}
        tabIndex={0}
        role="log"
        aria-live="polite"
        aria-label="Adventure-Protokoll"
        data-testid="adventure-log"
      >
        {state.history.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </div>
      <form className="adv-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="adv-input">
          {c64 ? 'C64-Eingabe' : 'Adventure-Befehl'}
        </label>
        <button
          type="button"
          className="prompt-toggle"
          data-testid="input-toggle"
          aria-pressed={c64}
          aria-label={
            c64
              ? 'Eingabe geht an den C64. Umschalten auf Adventure'
              : 'Eingabe geht an das Adventure. Umschalten auf C64'
          }
          title={
            c64
              ? 'Eingabe geht an den C64 – klicken oder Alt+C für Adventure (oder ! vor die Zeile setzen)'
              : input.powerOn
                ? 'Eingabe geht an das Adventure – klicken oder Alt+C für C64'
                : 'Der C64 ist aus'
          }
          disabled={!c64 && !input.powerOn}
          onClick={input.toggleTarget}
        >
          {c64 ? 'C64>' : '>'}
        </button>
        <input
          id="adv-input"
          ref={input.inputRef}
          data-testid="adventure-input"
          value={input.value}
          onChange={(e) => input.onChange(e.target.value)}
          onKeyDown={input.onKeyDown}
          onFocus={() => input.setFocused(true)}
          onBlur={() => input.setFocused(false)}
          autoCapitalize={c64 ? 'characters' : 'sentences'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder={input.placeholder}
          maxLength={300}
          aria-describedby="c64-help"
        />
        <button type="submit">{c64 ? 'Return' : 'Los'}</button>
      </form>
    </section>
  );
}

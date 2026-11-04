/** Papiernotizblock: automatisch erkannte Fakten, eigene Notizen, Vermutungen, Denkhilfe (GDD §11.2/11.4). */
import { useState } from 'react';
import type { GameUi } from '../app/useGame';
import { FACT_BY_ID, FACT_CATEGORIES, factText } from '../content/facts';
import { Modal } from './Modal';

export function Notebook({ game }: { game: GameUi }) {
  const state = game.state!;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [subject, setSubject] = useState('');
  const [target, setTarget] = useState('');
  const lastThought = [...state.history]
    .reverse()
    .find((e) => e.kind === 'thought' && /\(\d\/3\)/.test(e.text));

  return (
    <Modal title="Notizblock" onClose={() => game.setNotebookOpen(false)} className="notebook">
      <section aria-labelledby="nb-facts">
        <h3 id="nb-facts">Was du herausgefunden hast</h3>
        {state.knownFacts.length === 0 && (
          <p className="muted">Noch nichts. Fakten landen hier automatisch, sobald Jan etwas entdeckt.</p>
        )}
        {Object.entries(FACT_CATEGORIES).map(([cat, label]) => {
          const facts = state.knownFacts.map((f) => FACT_BY_ID[f]).filter((f) => f?.category === cat);
          if (!facts.length) return null;
          return (
            <div key={cat} className="fact-group">
              <h4>{label}</h4>
              <ul>
                {facts.map((f) => (
                  <li key={f.id}>{factText(state, f.id)}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="nb-notes">
        <h3 id="nb-notes">Eigene Notizen</h3>
        <ul className="own-notes">
          {state.deskNotes.map((n) => (
            <li key={n.id}>
              {editing === n.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    game.dispatch({ type: 'note', op: 'edit', id: n.id, text: editText });
                    setEditing(null);
                  }}
                >
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    aria-label="Notiz bearbeiten"
                    maxLength={500}
                  />
                  <button type="submit">Speichern</button>
                </form>
              ) : (
                <>
                  <span>{n.text}</span>
                  <span className="note-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(n.id);
                        setEditText(n.text);
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => game.dispatch({ type: 'note', op: 'delete', id: n.id })}
                    >
                      Löschen
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            game.dispatch({ type: 'note', op: 'add', text: draft });
            setDraft('');
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Neue Notiz …"
            aria-label="Neue Notiz"
            maxLength={500}
            data-testid="note-input"
          />
          <button type="submit">Notieren</button>
        </form>
      </section>

      <section aria-labelledby="nb-hyp">
        <h3 id="nb-hyp">Vermutungen</h3>
        <p className="muted">
          Verknüpfungen sind nur Vermutungen – das Spiel bestätigt sie nicht automatisch.
        </p>
        <ul>
          {state.hypotheses.map((h) => (
            <li key={h.id}>
              {h.subject} ↔ {h.target}
            </li>
          ))}
        </ul>
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim() || !target.trim()) return;
            game.dispatch({ type: 'adventure', text: `VERKNÜPFE ${subject} MIT ${target}` });
            setSubject('');
            setTarget('');
          }}
        >
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Begriff A"
            aria-label="Vermutung: erster Begriff"
            maxLength={60}
          />
          <span>↔</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Begriff B"
            aria-label="Vermutung: zweiter Begriff"
            maxLength={60}
          />
          <button type="submit">Verknüpfen</button>
        </form>
      </section>

      <section aria-labelledby="nb-hint">
        <h3 id="nb-hint">Denkhilfe (optional)</h3>
        <p className="muted">
          Drei Stufen: Denkanstoß → konkreter Hinweis → ausführliche Hilfestellung. Nur auf Wunsch: Schließe den Block und tippe DENKE NACH.
        </p>
        {lastThought && <p className="hint-text">{lastThought.text}</p>}
      </section>

      <p className="muted">
        Jans digitales Archiv (Personen, Nummern, Mailboxen …) liegt auf der Diskette »JANS ARCHIV« in der
        Schublade und läuft am C64.
      </p>
    </Modal>
  );
}

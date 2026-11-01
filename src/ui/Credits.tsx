/** Credits und rechtlicher Hinweis – erreichbar über das Menü (im Spiel und auf dem Titelbildschirm). */

export const CREDITS: Array<{ role: string; names: string[] }> = [
  { role: 'Game-Designer', names: ['Peter Elbracht'] },
  { role: 'Coder', names: ['Claude Code'] },
  { role: 'FX-Artist', names: ['Claude Code'] },
  { role: 'Gfx-Artist', names: ['Claude Code'] },
];

export const LEGAL_DISCLAIMER =
  'REWIND 1986 ist ein fiktionales Computerspiel. Erwähnte Filmtitel, Produktnamen und Marken dienen ausschließlich der historischen Einordnung und Identifizierung. Die jeweiligen Rechte verbleiben bei ihren Inhabern. Es besteht keine Verbindung zu den genannten Rechteinhabern, soweit nicht ausdrücklich anders angegeben.';

export function Credits() {
  return (
    <div className="credits" data-testid="credits">
      <h3>REWIND 1986</h3>
      <dl className="credits-list">
        {CREDITS.map((c) => (
          <div key={c.role} className="credits-row">
            <dt>{c.role}</dt>
            <dd>{c.names.join(', ')}</dd>
          </div>
        ))}
      </dl>
      <h3>Hinweis</h3>
      <p className="credits-disclaimer" data-testid="legal-disclaimer">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}

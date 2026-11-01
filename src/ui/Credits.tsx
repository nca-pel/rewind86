/** Credits und rechtliche Hinweise – erreichbar nur über den Titelbildschirm. */

export const CREDITS: Array<{ role: string; names: string[] }> = [
  { role: 'Game-Designer', names: ['Peter Elbracht'] },
  { role: 'Coder', names: ['Claude Code'] },
  { role: 'FX-Artist', names: ['Claude Code'] },
  { role: 'Gfx-Artist', names: ['Claude Code'] },
];

export const LEGAL_DISCLAIMER =
  'REWIND 1986 ist ein fiktionales Computerspiel. Erwähnte Filmtitel, Produktnamen und Marken dienen ausschließlich der historischen Einordnung und Identifizierung. Die jeweiligen Rechte verbleiben bei ihren Inhabern. Es besteht keine Verbindung zu den genannten Rechteinhabern, soweit nicht ausdrücklich anders angegeben.';

export const YOUTUBE_DISCLAIMER =
  'Ein verstecktes Easter-Egg bettet ein Video von YouTube ein. Erst wenn es aufgerufen wird, verbindet sich der Browser mit YouTube (Google Ireland Limited) über die Domain youtube-nocookie.com; dabei werden Daten wie die IP-Adresse an YouTube übertragen. Das Video wird nicht mit dem Spiel ausgeliefert, die Rechte liegen bei den Urhebern. Es besteht keine Verbindung zu YouTube oder Google.';

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
      <p className="credits-disclaimer" data-testid="youtube-disclaimer">
        {YOUTUBE_DISCLAIMER}
      </p>
    </div>
  );
}

/** Nadeldrucker mit Endlospapier: Die Vorgeschichte scrollt von unten nach oben durch das Papierfenster. */
export const STORY: string[] = [
  'REWIND 1986',
  'Rheda-Wiedenbrück, November 1986.',
  'Es ist die Jahreszeit, in der es um vier schon dämmert und der Nieselregen so gleichmäßig fällt, dass man irgendwann aufhört, ihn zu bemerken. Die Laster der Möbelfabriken rollen durch die nassen Straßen, und im Radio läuft zum dritten Mal an diesem Tag derselbe Hit.',
  'Jan Keller ist sechzehn und geht aufs Ratsgymnasium Wiedenbrück. Er ist keiner, der in der Pause den Ton angibt. Er ist der, der am Rand steht, zuhört und sich merkt, was die anderen längst vergessen haben. Dinge reizen ihn, die sich nicht gleich zeigen: Muster, Schlösser, Rätsel.',
  'Sein Reich liegt unterm Dach. Ein alter Schreibtisch seines Vaters, ein Commodore 64 mit Floppy 1541, ein Telefon mit viel zu langer Schnur, ein altes Radio, Stapel von Computerzeitschriften, aus denen er BASIC-Listings abtippt, bis die Augen brennen. Er tauscht Disketten, bestaunt C64-Demos, schaut Filme, wenn die Eltern den Fernseher freigeben, und träumt davon, dass sein Rechner einmal mit der ganzen Welt sprechen kann.',
  'Unten im Haus leben seine Eltern. Mutter Ingrid arbeitet halbtags als Arzthelferin und hat ein feines Gespür dafür, wann ihr Sohn zu lange wach war. Vater Werner ist Schichtleiter in einer Möbelfabrik, ein Pragmatiker, der die Nachrichten verschlingt und sich über die Telefonrechnung aufregt, ohne es böse zu meinen.',
  'Und dann ist da Ralf, Jans bester Freund. Früher wohnten sie Tür an Tür, dann ließen sich Ralfs Eltern scheiden, und er zog mit seiner Mutter weg. Heute geht er aufs Einstein-Gymnasium in Rheda, spielt Fußball, als ginge es um sein Leben, und taucht trotzdem verlässlich auf, wenn es etwas zu erzählen gibt.',
  'Jan ist nicht der Mutigste und nicht der Schnellste. Aber er ist geduldig, und er gibt nicht auf, bevor ein Rätsel gelöst ist. Manchmal ist das eine Stärke. Manchmal ist es das, was einen in Schwierigkeiten bringt.',
  'Sein Leben hat einen Takt: Schule, Hausaufgaben, Rechner, Abendbrot, noch ein Stündchen Rechner. Niemand schaut zweimal hin. Das ist gut so.',
  'Morgen ist Schule, wie überall in Nordrhein-Westfalen, aber nur bis mittags.',
  'Es ist ein Freitag wie jeder andere.',
  'Fast.',
  '',
  '*** ENDE DER MELDUNG ***',
];

export function PrinterStory() {
  return (
    <section className="printer" aria-label="Vorgeschichte, ausgegeben von einem Nadeldrucker">
      <div className="printer-paper-window">
        <div className="printer-paper">
          {STORY.map((line, i) => (
            <p key={i} className={i === 0 ? 'printer-head' : undefined}>
              {line || ' '}
            </p>
          ))}
        </div>
      </div>
      <div className="printer-slot" aria-hidden="true" />
      <div className="printer-body" aria-hidden="true">
        <span className="printer-brand">NEEDLES 86</span>
        <span className="printer-leds">
          <i className="led led-on" /> POWER <i className="led led-online" /> ONLINE
        </span>
        <span className="printer-keys">
          <b>LF</b>
          <b>FF</b>
          <b>SEL</b>
        </span>
      </div>
    </section>
  );
}

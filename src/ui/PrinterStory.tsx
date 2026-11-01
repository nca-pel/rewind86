/** Nadeldrucker mit Endlospapier: Die Vorgeschichte scrollt von unten nach oben durch das Papierfenster. */
export const STORY: string[] = [
  'REWIND 1986',
  'Rheda-Wiedenbrück, November 1986.',
  'Es ist die Zeit, in der es um vier Uhr nachmittags schon dämmert, die Möbelwerke ihre Laster in alle Richtungen schicken und im Radio zum dritten Mal am Tag derselbe Hit läuft.',
  'Jan Keller ist sechzehn und geht aufs Ratsgymnasium Wiedenbrück. Er ist keiner, der in der Pause den Ton angibt, eher einer, der mehr zuhört als redet und Dinge lieber versteht, als sie nur zu benutzen. Samstags ist Schule, wie immer in Nordrhein-Westfalen, aber nur bis mittags.',
  'Sein Reich ist das Zimmer unterm Dach: ein Schreibtisch, ein Commodore 64 mit Floppy 1541, ein Telefon, ein altes Radio und Stapel von Computerzeitschriften, aus denen er BASIC-Listings abtippt, bis die Augen brennen. Er tauscht Disketten, bestaunt C64-Demos und träumt davon, dass sein Rechner einmal mit der ganzen Welt sprechen kann. Dazu schaut er Filme, wenn die Eltern im Wohnzimmer den Fernseher freigeben.',
  'Unten im Haus leben seine Eltern: Mutter Ingrid ist halbtags Arzthelferin und hat ein feines Gespür dafür, wann ihr Sohn zu lange wach war. Vater Werner ist Schichtleiter in einer Möbelfabrik, pragmatisch, nachrichtenhungrig und nicht begeistert, wenn die Telefonrechnung steigt.',
  'Ralf ist Jans bester Freund. Früher wohnten sie Tür an Tür, dann ließen sich Ralfs Eltern scheiden, und er zog mit seiner Mutter weg. Heute geht er aufs Einstein-Gymnasium in Rheda, spielt Fußball, als ginge es um sein Leben, und taucht trotzdem verlässlich auf, wenn es etwas zu erzählen gibt.',
  'Jan ist nicht der Mutigste und nicht der Schnellste. Aber er ist geduldig, sieht Muster, wo andere nur Zahlen sehen, und gibt nicht auf, bevor ein Rätsel gelöst ist.',
  'Das Leben hat seinen Takt: Schule, Hausaufgaben, Rechner, Abendbrot, noch ein Stündchen Rechner.',
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
        <span className="printer-brand">PRINTA 80</span>
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

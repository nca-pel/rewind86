/**
 * Endgültige Spielenden (GDD §10.3: wenige, vorher erkennbar angekündigt).
 * Der Spielstand mit gesetztem Ende wird nicht automatisch gespeichert – der Autosave bleibt auf dem
 * Stand vor der letzten Handlung, sodass „Letzten Schritt zurücknehmen“ immer möglich ist.
 */
import { GAME_CONFIG } from './config';

const N = GAME_CONFIG.secretNetwork;

export interface EndingDef {
  id: string;
  title: string;
  text: string;
}

export const ENDINGS: EndingDef[] = [
  {
    id: 'end_discovered',
    title: 'Entdeckt',
    // Entschieden (Storyworkshop): Seidel kommt persönlich – freundlich, manipulativ, ohne Gewalt.
    text: `Am nächsten Nachmittag klingelt es. Deine Mutter ruft die Treppe hinauf: »Jan, Besuch für dich – Herr Seidel, Ralfs Vater!« Er bleibt im Türrahmen stehen, freundlich, das Jackett ordentlich zugeknöpft. »Ich wollte nur kurz über Ralf reden. Er ist in letzter Zeit so … abgelenkt.« Sein Blick wandert über deinen Schreibtisch und bleibt am Akustikkoppler hängen. »${N.testHandle}«, sagt er leise, als läse er eine Telefonnummer vor. »Ein Testzugang. Die werden gelöscht, weißt du? Alle.« Dann lächelt er, wünscht deiner Mutter einen schönen Abend und geht. Am Abend ist die Nummer tot. Das Netz ist für dich verloren – und Seidel weiß, wer du bist.`,
  },
  {
    id: 'end_exposed',
    title: 'Enttarnt',
    text: 'Die 110. Eine Stimme, gelangweilt. Dann hörst du dich reden: Rohdaten, Schlüssel in drei Teilen, der Klartext »OPERATION REWIND BEGINNT FREITAG«, die Testkennung auf Ralfs Kopie. Die Stimme wird still. »Bleiben Sie, wo Sie sind.« 23:05. Zwei Wagen ohne Blaulicht vor dem Haus, deine Mutter mit der Kaffeekanne, dein Vater mit offenem Mund. 23:30. Auf einer Autobahnraststätte bei Gütersloh wartet jemand vergeblich auf einen Mann, der nicht kommt. In Seidels Arbeitszimmer geht der Schrank auf. Ganz oben: eine Diskette, auf dem Etikett nur zwei Fragezeichen. Am Montag steht ein Absatz in der Zeitung, ohne deinen Namen. Ralf grüßt dich auf dem Flur nicht mehr. Aber er ist bei seiner Mutter geblieben, und das ist vielleicht das Wichtigste.',
  },
  {
    id: 'end_dismissed',
    title: 'Zu wenig in der Hand',
    text: '»Name? Alter?« Der Beamte tippt mit zwei Fingern. Ein Netz, das nur du gesehen hast. Ein Spiel. Eine Nachricht, die niemand lesen kann. »Das notieren wir.« 23:30. Nichts passiert, weil du nichts beweisen kannst. Am Samstag ist die Kennung gelöscht, Seidels Schrank bleibt zu, die Operation ist vorbei, als wäre sie nie gewesen. Du hast getan, was ein Sechzehnjähriger tun konnte. Nur: Jetzt steht dein Name in einer Akte, in die er nicht gehört.',
  },
  {
    id: 'end_cover',
    title: 'Der Mentor räumt auf',
    text: 'Du schickst GHOST alles, was du hast. Zehn Minuten. Dann: »Fürwahr. Das genügt. Vergiss die Nummer, vergiss das Netz, vergiss mich.« 23:25. Das Netz bricht ab, mitten im Satz. 23:30. Der Bildschirm zeigt nur noch den Cursor. Am Montag sitzt Herr Brandt mit der Thermoskanne am Clubtisch und sagt »Weiter so«, als wäre nichts. Du fragst nicht. Du hast nicht gefragt, was er mit den Beweisen gemacht hat, wem er sie gegeben hat, warum er so genau wusste, worum es ging. Der Schaden ist abgewendet. Wem Brandt dient, weißt du nicht. Und er weiß jetzt, wer hinter der Testkennung saß.',
  },
  {
    id: 'end_ralf_stops',
    title: 'Ralf hält seinen Vater auf',
    text: '»Ich geh runter«, sagt Ralf. »Ich sag ihm, mir ist schlecht und er soll nicht weg.« Die schlechteste Ausrede der Welt. 22:40. Seidel zieht die Jacke wieder aus. 23:10. Er sitzt neben Ralf auf dem Sofa und sieht ständig auf die Uhr. 23:30. Ein Wagen wartet an einer Raststätte, vergeblich. Am Samstag ist Seidel weg. Koffer, Schlüssel, ein Zettel für Ralfs Mutter. Ralf bleibt zurück, auf der Treppe, mit dem Hörer in der Hand. Er ruft dich nicht an. Er sitzt nur da und weiß, dass er richtig gehandelt hat. Am Montag liegt in deinem Briefkasten ein Umschlag ohne Absender. Darin eine Diskette, zwei Fragezeichen auf dem Etikett, und ein Zettel in Ralfs Krakelschrift: »Mach sie kaputt.«',
  },
  {
    id: 'end_ralf_betrayal',
    title: 'Ralf plaudert',
    text: '»Das kann nicht sein.« Ralf legt auf. Zehn Minuten später klingelt es. Herr Seidel steht auf der Fußmatte, der Blick ruhig, die Stimme warm. »Ralf hat mir etwas erzählt. Von einer Kennung. Von einem Netz.« Deine Mutter holt Kaffee. 23:30. Die Operation läuft, ohne dass jemand sie aufhält. Die Nummer ist am nächsten Tag tot. Ralf sitzt auf der Treppe und weint. Er hat nicht verraten wollen. Er hat nur nicht gewusst, wem er trauen darf – so wenig wie du.',
  },
  {
    id: 'end_silent',
    title: 'Der Freitag vergeht',
    text: 'Die Hand liegt auf dem Hörer. 22:00. 23:00. Du wählst nicht. 23:30. Das Netz verstummt, die Testkennung wird gelöscht, auf dem Monitor blinkt der Cursor. Am Samstag ist alles wie immer: Schule bis zwölf, Taschengeld, Fußball. Ralf lacht am Telefon über etwas Dummes. Du wirst nie erfahren, ob es etwas gegeben hätte, das du hättest tun können.',
  },
  {
    id: 'end_abort',
    title: 'Abbruch',
    text: 'Die Warnung ist raus, unter der Kennung eines Fremden: TREFFPUNKT VERRATEN. ABBRUCH. 300 Baud, eine Ewigkeit, dann das GESENDET. Zehn Minuten später ist die Leitung tot. 23:30. An der Raststätte steht ein Wagen mit laufendem Motor. Niemand steigt ein. 23:45. Der Wagen fährt ohne Beifahrer zurück nach Osten. Die Software bleibt, wo sie ist, K-01 bleibt, wo er ist, und niemand erfährt je, wer die Warnung geschickt hat. Am Samstag ist das Netz tot. Seidel fährt Ralf zum Fußball, als wäre nichts gewesen. Nur sein Blick bleibt einmal zu lang an deinem Fenster hängen.',
  },
];

export const ENDING_BY_ID: Record<string, EndingDef> = Object.fromEntries(ENDINGS.map((e) => [e.id, e]));

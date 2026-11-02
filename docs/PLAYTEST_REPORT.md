# Playtest-Bericht – Durchlauf über die Oberfläche (Playwright)

Datum: 02.11.2026. Normalmodus. Gespielt: Prolog bis Ende `end_exposed` (»Enttarnt«), Fr 14.11. 16:00 – Fr 21.11. 21:45
Spielzeit. Die Eingaben kamen echt über die Oberfläche (Tastatur, Klicks auf die C64-Tasten, Adventure- und C64-Zeile).
Der Walkthrough (`docs/WALKTHROUGH.md`) und die Figurenbeschreibungen (`docs/CHARAKTERE.md`) entstanden vorab bzw. parallel.

Einschränkung: Der Durchlauf kannte die Lösungen. Das Testen mit »frischen« Menschen ersetzt er nicht. Die Aussagen zur
Spieldauer sind Schätzungen aus Befehlsanzahl, Textmenge und typischer Rätselzeit, keine Messungen an Testspielern.

## 1. Gefundene und behobene Fehler

| #   | Befund                                                                                             | Fix                                                                                          |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Ralf ruft Sa 13:00 an (»Erzähl schon!«), obwohl Jan ihn schon vorher angerufen hatte.              | `dialRalf` setzt `ralfSaturdayDone`.                                                         |
| 2   | Beim Rückruf tat Ralf so, als hätte er nie angerufen (»Was gibt's?«).                              | Neues Flag `ralfMissedCall`; Ralf: »Ah, da bist du ja. Ich hatte dich vorhin angeklingelt …« |
| 3   | DATENKELLER: »Im Postfach wartet eine Nachricht vom Sysop«, aber das Postfach war leer.            | Meldung nur, wenn das System eine Begrüßungspost hat (`term.ts`).                            |
| 4   | Fußballtraining 16:30–19:30 (3 Stunden): unplausibel, Ralf Fr erst ab 19:40 erreichbar.            | Training 16:30–18:30, Ralf ab 18:45 erreichbar (`config.ts`, `routine.ts`, Test).            |
| 5   | Notiz `seidel_alibi` verwies auf eine BTX-Kinoseite, die Jan nie gesehen hat.                      | Text neutral umformuliert.                                                                   |
| 6   | Ralfs Antwort auf »GHOST« setzte voraus, dass Jan ihm von Brandt erzählt hat.                      | Einstieg: »Moment – du meinst, der Brandt aus deinem Club soll GHOST sein?«                  |
| 7   | Mutter log Seidel am Telefon an (»du schläfst schon«), obwohl Jan wach war: passt nicht zu Ingrid. | Zeile umgeschrieben (Klingeln nicht gehört, Seidel: »nicht wichtig«).                        |
| 8   | Abendessen jeden Tag derselbe Text.                                                                | Varianten Sa–Do mit Eltern-Charakter (Volkszählung, Telefonrechnung, Club).                  |

Kein Fehler: Die ←-Taste in den Credits wirkt über die ganze Credits-Phase (ca. 7 s, Schleife alle ~18 s). Der anfängliche
Fehlschlag lag an meinem Testtreiber (falscher Tastenname `BackSpace`, verzögerte Screenshots).

Offen / vorbestehend: `e2e/detail.spec.ts` (Projekt mobile) schlägt schon vor diesen Änderungen fehl (Telefon-Detailpanel
scrollt: Höhe 422 px statt höchstens 401 px).

## 2. Handlungs- und Spannungsbogen

Stark:

- Prolog: Ein Spiel auf einer geliehenen Diskette → verstecktes Modul → Mailbox mit Rundschreiben → die Testkennung steht »auf Ralfs
  Diskette«. Das ist ein klarer, sich steigernder Haken.
- Mi 15:45: Rundschreiben im Klartext (»OPERATION REWIND BEGINNT FREITAG«). Das ist ein echter Wendepunkt.
- Fr 19:30: Die Quittung an K-01 (»Jetzt gibt es kein Zurück«), dann die Antwort mit Ort und Zeit, dann um 20:00 die drei Wege. Sehr gute
  Verdichtung, die Texte tragen.
- Figuren (Brandt, Ralf, Mutter, Vater) sind stimmig und klingen unterscheidbar.

Schwach:

1. **Leerlauf Sa–Di.** Zwischen dem Prolog und dem Mittwochabend gibt es zwei Pflichtereignisse (Mo: Systemmeldung, Mi: Kassette). Sa, So, Di
   passieren nur WARTE-Zyklen. Der Spieler hat kein Ziel (P07 sagt nur »schau in ein paar Tagen wieder rein«). Das ist der größte Bruch im
   Spannungsbogen. Empfehlung: pro Tag einen kleinen Auslöser (Sa Abend: ANDI-Post; So: GHOSTs »NACHTSCHICHT«-Hinweis per Post/Telefon;
   Di: DATENKELLER-Gerücht aktiv ankündigen; Mo: Mail von ZAPPO/KALLE).
2. **Clubabend (Do) ist ein einziger Erzählblock** ohne Eingaben. Die einzige direkte Begegnung mit Brandt hat keine Spielerentscheidung.
   Empfehlung: kurzer Dialog (`REDE MIT BRANDT`, 2–3 Themen) statt Textwand.
3. **Der Ersatzschlüssel wird nicht gespeichert.** Nach jedem Neustart des Moduls muss man die zwölf Ziffern erneut eintippen; das ist im Finale
   (Zeitdruck) lästig. Empfehlung: Schlüssel im Spielstand halten, solange das Modul läuft und danach als Fakt `key_complete`.
4. **Seidels Anruf (Fr 21:00–22:15)** ist leicht zu verpassen: Wer mit WARTE 15 vorspult, überspringt das Klingeln, und die Mutter beendet den
   Anruf nach 3 Minuten. Das ist beabsichtigt (Konsequenz), nur muss der Spieler wissen, dass er den Hörer abnehmen soll. Die Finale-Meldung um
   20:00 erwähnt den Anruf nicht. Empfehlung: Hinweis bei `ev_finale_open` (»Irgendwann heute Abend wird jemand anrufen …«).
5. **Mailbox-Bedienung** (Alt+C, `!`-Präfix, Panel-RETURN, getrennte Modi) ist für Neulinge schwer. Die Spielerführung steht im Hilfetext, ist
   aber nicht im Spiel sichtbar, wenn man nicht HILFE tippt.

## 3. Rätsel

| Rätsel                              | Bewertung                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P01 Diskette starten                | zu einfach, wie beabsichtigt (Einstieg)                                                                                             |
| P03 ← in den Credits                | gut: Hinweis (Pfeil blitzt) ist fair; 7-s-Fenster in Schleife                                                                       |
| P04 Ersatzwahl-Nummer               | fair, die Zeichentabelle im Journal macht es lösbar                                                                                 |
| P05/P06 Erste Verbindung            | gut (Koppler-Choreografie macht Spaß, Mutter stört)                                                                                 |
| P08a Unsichtbare Zeile (POKE 53281) | mittel bis schwer, aber durch LESERTIPPS und Denkhilfe gut abgesichert; das Highlight                                               |
| P07 Systemmeldung                   | keine Rätselarbeit, nur Warten – siehe Leerlauf                                                                                     |
| P08c Kassette (T=2213\*2)           | angenehm kleine Rechenaufgabe; Datasette-Einführung durch Ralf ist jetzt schlüssig                                                  |
| P09 Entschlüsseln                   | zu einfach, weil das Modul den Schlüssel nicht prüft und Klartext zeigt; Profi-Pfad (Rohdaten selbst entschlüsseln) bleibt optional |
| P10 Was ist Freitag                 | gut, mehrere Wege; die Reihenfolge Club → GHOST → Ralf → Anfrage ist gut gestuft                                                    |
| P17 BTX                             | in diesem Durchlauf nicht gespielt (Set steht bereit)                                                                               |

Insgesamt weder zu schwer noch abwegig. Die Rätsel sind gut »gefüttert« (Journal, Notizblock, DENKE NACH). Wer genau liest, kommt ohne Hilfe
durch; schwerer als »mittel« ist nur der Moment der unsichtbaren Zeile.

## 4. Spielzeit (Schätzung)

Mein Durchlauf (mit Lösungskenntnis, ohne Lesen): rund 40 Minuten echte Zeit, etwa 150 Adventure-Eingaben und 60 C64-Eingaben.

Hochrechnung für einen Menschen, der zum ersten Mal spielt (Hauptstrang bis zum Ende):

| Abschnitt                                                         | Schätzung             |
| ----------------------------------------------------------------- | --------------------- |
| Prolog P01–P06 (Bedienung lernen, ← finden, LADER, POKE, Koppler) | 60–90 min             |
| Fr–Di: BBS, GHOST, Ralf, Warten                                   | 40–60 min             |
| Mi: Kassette, Schlüssel, Rundschreiben                            | 30–45 min             |
| Do: Club, BTX (P17), GHOST                                        | 30–45 min             |
| Fr: Alibi, Anfrage, Finale, Ende                                  | 30–45 min             |
| **Hauptstrang gesamt**                                            | **ca. 3,5–5 Stunden** |

Mit optionalem Inhalt (FERNHANDEL-Durchläufe à 20–40 min, DATENKELLER, BTX-Seiten, BASIC-Experimente, mehrere Enden) erreicht man 8–10 Stunden.
Die GDD-Zielmarke »Hauptstory 8–12 h« wird mit dem aktuellen Inhalt im Hauptstrang **nicht** erreicht, nur mit Zusatzinhalt. Ehrlicher Ist-Wert:
Hauptstrang ~4–5 h. Die Zahl »12 Stunden« ist als Marketingaussage nur mit Wiederholungsspiel (andere Enden) haltbar.

Hebel, um die Dauer organisch zu erhöhen (statt zu strecken): mehr Alltag mit Entscheidungen Sa–Di (siehe 2.1), Clubabend als spielbare Szene,
zusätzliche Ermittlungsschritte vor dem Finale (z. B. Ralf zeigt Seidels Arbeitszimmer, DATENKELLER-Mailwechsel mit MOLE).

## 5. Umgesetzte Folgemaßnahmen

- Leerlauf Sa–Di: neue Gedanken So 17:30, Mo 14:15 (nur ohne Schlüsselteil 2) und Di 19:30 als Wegweiser; neue Beiträge im BIT-SCHUPPEN (ZAPPO »KNOTEN WEST??« ab So 10:00, ANDI-Antwort ab Mo 18:00) und im DATENKELLER (MOLE »TESTZUGAENGE« ab So 22:00).
- Clubabend: spielbares Gespräch mit Herrn Brandt (Themen Club, BTX, Mailboxen, Thermoskanne, WarGames, GHOST, Seidel, Ralf, Spiel). Jede Frage kostet 15 Minuten, nach sechs Fragen oder ab 20:30 endet der Abend; `VERABSCHIEDE DICH` beendet ihn früher. Antworten hängen vom Wissensstand ab; Brandt gibt nie zu, GHOST zu sein.
- Ersatzschlüssel: wird als Flag `modkKey` gespeichert und beim Start des Moduls wiederhergestellt.
- Finale: Die Meldung bei `ev_finale_open` weist auf den möglichen Anruf hin.

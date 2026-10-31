# Offene Storyfragen

Diese Punkte sind laut GDD `[OFFEN]` bzw. nicht verbindlich entschieden. Der Code verwendet neutrale,
austauschbare Platzhalter (überwiegend in `src/content/config.ts`, markiert mit `TODO-STORY`). **Keiner der Platzhalter
ist eine kanonische Storyentscheidung.**

| #   | Thema                                                           | GDD                     | Aktueller Platzhalter im Code                                                                                                                    | Ort                                 |
| --- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| 1   | Bürgerliche Identität von GHOST                                 | §3.4, §22.1             | `GHOST_CIVIL_IDENTITY_TBD`; GHOST kommt im Ausschnitt nicht vor                                                                                  | `config.ts`                         |
| 2   | Wann erkennt GHOST, dass Jan hinter der Kennung steckt?         | §3.4, §22.2             | `GHOST_RECOGNITION_ARC_TBD`                                                                                                                      | `config.ts`                         |
| 3   | GHOSTs britischer Kontakt und Motive                            | §3.4, §22.3             | nicht modelliert                                                                                                                                 | –                                   |
| 4   | Operation REWIND: Termin, Ziel, auszuschleusender Agent, Finale | §4.2, §22.4             | nicht modelliert; Systemnachricht erwähnt nur vage „Abschluss der Erprobung“                                                                     | `networks.ts`                       |
| 5a  | Titel/Genre des unveröffentlichten Spiels                       | §7.4, §22.5             | `WORKING_TITLE_TBD`, Projektkennung `WT-07` (neutral, austauschbar)                                                                              | `config.ts`                         |
| 5b  | Konkrete versteckte Taste und fairer Entdeckungsweg             | §4.1, §22.5             | Taste `←` während der Credits-Phase; Hinweis: aufblitzender Pfeil + Notiz + 3-stufige Hilfe                                                      | `config.ts`, `sim/apps/wt07.ts`     |
| 5c  | Intro-Grafik                                                    | §22.5                   | ASCII-Logo „WT-07“ und Textphasen                                                                                                                | `wt07.ts`                           |
| 5d  | Inhalt des eigentlichen Spielteils                              | §7.4                    | „Spielteil in dieser Kopie nicht enthalten“                                                                                                      | `wt07.ts`                           |
| 6   | Diskette 2: Verbleib, Inhalt, Rekonstruktionsmethode            | §7.5, §22.6             | Objekt `disk_key` existiert (Ort `nowhere`), leeres Image; Modul reagiert mit Platzhaltertext                                                    | `objects.ts`, `disks.ts`, `modk.ts` |
| 7   | Namen/Biografien der Eltern, Ralfs Familienname                 | §3.2, §3.5, §3.6, §22.7 | Eltern nur „Mutter“/„Vater“; `RALF_FAMILY_NAME_TBD` (nicht angezeigt)                                                                            | `config.ts`                         |
| 8   | Genaues Startdatum                                              | §2.2, §22.8             | Entwickler-Default Freitag, 14.11.1986, 16:00                                                                                                    | `config.ts`                         |
| 9   | Namen geheimer/regionaler Mailboxen, Sysops, BTX-Angebote       | §8, §22.9               | Modul „MODUL K“, Knoten „KNOTEN ?“, Kennungen `K-17` (Testzugang) und `K-01` – alles neutrale Arbeitsnamen; keine regionalen Mailboxen, kein BTX | `config.ts`, `networks.ts`          |
| 10  | Filmzitate und Zuordnung zu Rätseln                             | §13, §22.10             | keine Filmrätsel; nur fiktives Poster „SPACE RIDERS“ als Deko                                                                                    | `Desk.tsx`                          |
| 11  | Worauf zeigt der unbeabsichtigte INTRUDER-Hinweis?              | §12.2, §22.11           | `intruder.hintLink = null`; Demo-Teil 2 erzeugt nur den neutralen Fakt `demo_border`                                                             | `config.ts`, `intruder.ts`          |
| 12  | Umfang TV/VHS/Datasette                                         | §5.2, §22.12            | Datasette nur als Beschreibung („nicht angeschlossen“), kein TV/VHS                                                                              | `objects.ts`                        |
| 13  | Illustrationen, Sprecher, Musik                                 | §22.13                  | eigene SVG-/Canvas-Platzhalter, synthetisierte Klänge, keine Sprachausgabe                                                                       | `ui/`, `audio/`                     |
| 14  | Endgültiger BASIC-Umfang                                        | §7.3, §22.14            | dokumentierte Teilmenge, siehe `ARCHITECTURE.md`                                                                                                 | `sim/basic/`                        |

## Weitere im Ausschnitt getroffene Annahmen (bitte prüfen)

Diese Punkte waren für einen spielbaren Ausschnitt nötig. Sie sind bewusst klein gehalten und leicht änderbar:

- **Inhalt des ersten Rätsels:** Die „Ersatzwahl“-Nummer steht als PETSCII-Codes in einer DATA-Zeile des BASIC-Laders
  (`910 DATA 52,49,57,55,51` → `41973`). Lösbar über die Zeichentabelle im Heimcomputer-Journal oder per eigenem
  BASIC-Programm. (`content/disks.ts`)
- **Vorprovisionierte Testkennung** auf Diskette 1 (GDD §8.4 als Vorschlag): Systemnachricht „Kennung wurde mit
  Arbeitskopie WT-07 ausgeliefert“ dient als „identifizierbare Alltagsspur“. Formulierung und Konsequenz sind offen.
- **„M.S.“ in den Credits** als Programmiererkürzel – passt zu Seidel als Entwickler des Moduls (GDD §3.3), ist aber
  nur ein Hinweis, kein Beweis.
- **Elternereignisse:** Mutter hört beim ersten Online-Gang das Modem in der Leitung; Vater kommt 18:00 heim und will
  18:30 telefonieren (Varianten je nach Leitungszustand). „Tante Gisela“ und „Oma“ sind beiläufige Erwähnungen.
- **Ralf** ruft um 16:00 an, ist ca. 12 Minuten nach dem Auflegen an der Tür; Rückrufe bei Ralf führen im Ausschnitt
  ins Leere (Training).
- **Tarife:** 0,23 DM pro Einheit, 8 Minuten pro Ortseinheit – vereinfachte Spielökonomie, `needs_research`.
- **Fiktive Telefonnummern** `47112` (Ralf) und `41973` (Mailbox). Vor einer Veröffentlichung prüfen, ob ein realer
  Anschein entstehen könnte (GDD §20.4).
- **Radiosender:** fiktive Popwelle und Infowelle, dazu BFBS (real, als Umfeld plausibel). Keine echten
  Nachrichtenmeldungen, solange der Starttag nicht feststeht.
- **Heimcomputer-Journal** ist eine fiktive Zeitschrift.
- **Verdachtswerte:** Das Lesen der Mailbox erhöht `seidelSuspicion` leicht (+1/+2). Schwellenwerte sind benannt
  (`thresholds` in `config.ts`), haben im Ausschnitt aber noch keine Folgen.

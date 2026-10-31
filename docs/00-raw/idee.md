Du bist leitender Game-Developer und Softwarearchitekt. Erstelle ein deutschsprachiges, browserbasiertes Text-Adventure mit dem Arbeitstitel **REWIND 1986**.

## Verbindliche Spezifikation

Lies zuerst die vollständige Datei `docs/00-raw/REWIND_1986_GDD.md`. Sie enthält die von mir festgelegten Spielmechaniken, Figuren, historischen Grenzen, Szenarien, die vorgesehene Architektur, den visuellen Stil, Beispiele und Abnahmekriterien. Behandle `[FEST]` als verbindlich und `[OFFEN]` ausdrücklich als nicht entschieden. Entscheide offene Storyfragen nicht im Alleingang; benutze dafür neutrale, konfigurierbare Platzhalter und dokumentiere sie unter `docs/STORY_OPEN_QUESTIONS.md`.

## Ziel dieses Auftrags

Implementiere **nicht** sofort ein fiktiv fertig geschriebenes 8–12-Stunden-Spiel. Baue ein technisch belastbares, responsives Browserprojekt **und einen tatsächlich spielbaren vertikalen Ausschnitt von ungefähr 15–30 Minuten**. Die Architektur muss für das Vollspiel mit mehreren parallelen Strängen und verdeckten Storyakten erweiterbar sein.

## Verbindliche Arbeitsschritte

1. Prüfe das Repository und lege – falls noch nicht vorhanden – ein Projekt mit **TypeScript, React und Vite** an. Wähle eine schlanke, wartbare Implementierung. Richte Formatierung, Linting, Tests (Vitest) und mindestens einen Browser-E2E-Test (Playwright) ein.
2. Implementiere eine **separat testbare, deterministische Game-Engine** mit serialisierbarem Spielzustand, Inventar/Objektzuständen, Fakten, Flags, Ereignisplanung, aktionsbasierter Spielzeit, verstecktem Verdacht/Vertrauen und Save/Load. Spiele-Content nicht in UI-Komponenten hartkodieren.
3. Implementiere einen **erweiterten regelbasierten Adventure-Parser** mit deutschen Synonymen, Umlautvarianten, Objektbezügen, Kontextpronomen, einfachen Dialogthemen, Mehrdeutigkeitsnachfragen und verständlichen Fehlermeldungen.
4. Implementiere eine **getrennte, C64-inspirierte Computer-Eingabe** mit korrekt aussehendem BASIC-V2-Startbildschirm, Directory-Operationen, virtuell einlegbaren Disketten und einer kleinen, wohldokumentierten BASIC-Teilmenge. **Kein C64-Voll-Emulator**. Keine DOS-`C:\>`-Oberfläche.
5. Implementiere den **illustrierten Schreibtisch** als responsives Hub-Interface in leicht schräger Perspektive. Hotspots und Detailansichten müssen per Klick und vollständig per Text erreichbar sein. Separate Fokusbereiche für C64 und Adventure-Parser; mobile UI gut lesbar.
6. Baue den **Prolog** als spielbaren Ablauf: Ralf ruft an, spricht über die heimlich kopierte Diskette des Stiefvaters, bringt sie kurz persönlich vorbei, erwähnt sein Fußballtraining und verschwindet sofort. Jan untersucht das Spiel **allein**.
7. Ermögliche das Einlegen und Laden der Spielediskette, ein **wiederholbares Intro**, den fair entdeckbaren geheimen Modus und die Meldung, dass **Diskette 2** fehlt. Auf Diskette 1 muss ein **eingeschränkter** Zugang zur geheimen fiktiven Mailbox vorbereitet sein. Diskette 2 darf nicht Voraussetzung für den ersten Netzkontakt sein.
8. Baue eine kleine erste **simulierte Mailbox** mit einer verschlüsselten Nachricht und einem vollständigen, spielintern lösbaren Einstiegspuzzle. Implementiere einfache Telefon-/Datenleitungszustände. Stelle **keine echten Verbindungen** her.
9. Baue den **Papiernotizblock** mit automatisch bekannten Fakten, eigenen Notizen und einem optionalen dreistufigen Denkhilfe-System. Erstelle außerdem das erweiterbare Datenmodell des digitalen C64-Archivs.
10. Lege die Diskette **`1001`** in die Schreibtischschublade. Sie startet **`INTRUDER by 1001 FIGHTERS`**, eine eigene fiktive C64-Demo mit mindestens zwei verschiedenen, animierten Screens und einem einfachen selbst erstellten SID-inspirierten Audioplatzhalter oder einem klar definierten Audio-Adapter. Sie ist optional. Ihr zukünftiger Storyhinweis soll konfigurierbar sein.
11. Implementiere manuelle/automatische Spielstände, lokale persistente Speicherung und **Export/Import als validiertes JSON**. Der komplette Zustand muss korrekt wiederhergestellt werden.
12. Füge Audio-An/Aus, Texte für relevante Tonsignale, reduzierte Animationen, Tastaturbedienbarkeit und mobile Bedienbarkeit hinzu.
13. Verifiziere die Kernfunktionen durch automatisierte Tests und mindestens einen kompletten E2E-Test des Prologs. Stelle sicher, dass `npm install`, `npm run dev`, `npm run build` und die dokumentierten Testbefehle funktionieren.

## Unbedingt beachten

- Spielwelt: **Rheda-Wiedenbrück / Gütersloh, Herbst 1986**, C64 und zeitgenössische Technik. Keine moderne Internetrecherche im Spiel, keine Smartphone-Funktionen.
- Hauptfigur: **Jan Keller**, 17, Computer-Nerd. Er bleibt im Hauptspiel an seinem Schreibtisch beziehungsweise im unmittelbaren Zimmerkontext.
- Gegenspieler: **Martin Seidel**, Ralfs Stiefvater, erfundener Entwickler im Ariolasoft-Umfeld und geheimer Stasi-Agent. Reale Firmen werden nicht als historisch an Spionage beteiligt dargestellt.
- **GHOST** existiert als geheimnisvoller, dem britischen Nachrichtendienstumfeld verbundener Gegenspieler Seidels; seine konkrete bürgerliche Identität und sein Wissensstand über Jan sind **noch offen**. Nicht auflösen oder willkürlich festlegen.
- Story: Operation REWIND betrifft Informationen, eine bevorstehende Aktion und die Ausschleusung eines Agenten. Exakter Ablauf ist **noch offen**. Keinen künstlich vollständig geschriebenen Schluss behaupten.
- Verboten: externe Original-SID-Tracks, originalgeschützte Demos/Bilder/Filmdialoge ohne Rechte; unsicheres `eval` von Spielereingaben; unbegrenzte Interpreterloops; reale Anwahl von Telefonnummern.
- Fehlende Illustration/Audio als gut sichtbare, austauschbare **eigene Platzhalter** lösen. Funktionalität geht vor Blendwerk.
- Halte die Oberfläche/Spieltexte **deutschsprachig**; alle wichtigen Handlungen müssen via Textparser ausführbar sein.
- Arbeite sinnvoll in Etappen, halte den Build nach jeder Phase funktionsfähig. **Führe den Code und Tests tatsächlich aus**, bewerte die Ergebnisse und behebe Fehler, statt nur eine To-do-Liste zu schreiben.

## Erwartete Ergebnisse

- Funktionierendes Repository mit vollständigem Quellcode des vertikalen Ausschnitts.
- `README.md`: Installation, Entwicklung, Build, Test, Steuerung.
- `docs/ARCHITECTURE.md`: Engine, Parser, C64-Teilmenge, Events, Speicherformat.
- `docs/STORY_OPEN_QUESTIONS.md`: alle dramaturgisch offenen Punkte.
- `docs/NEXT_STEPS.md`: priorisierter Ausbauplan zum Vollspiel.
- Tests für Parser, Zeit, Disketten, Save/Load und Prolog-E2E.
- Klares Abschlussprotokoll: **implementiert**, **getestet**, **nicht implementiert**, **bekannte Grenzen**.

Beginne mit der Sichtung der GDD und der Repository-Struktur und implementiere dann diesen vertikalen Ausschnitt, ohne unnötig nach bereits dokumentierten Entscheidungen zu fragen.

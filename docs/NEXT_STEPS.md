# Nächste Schritte und Abschlussprotokoll

## Abschlussprotokoll (Stand: vertikaler Ausschnitt)

### Implementiert

- Projekt: TypeScript (strict), React 18, Vite 5, ESLint (inkl. `no-eval`), Prettier, Vitest, Playwright.
- Deterministische, UI-unabhängige Engine mit serialisierbarem Zustand: Inventar/Orte, Objektzustände, Fakten, Flags,
  Themen, Hypothesen, Rätselstatus, verdeckte Beziehungswerte, Geld/Telefonkosten, aktionsbasierte Uhr,
  Ereignisplanung (chronologisch, idempotent, unterbrechend), Debug-Log.
- Deutscher Adventure-Parser: Synonyme, Partikelverben, Umlautvarianten, Füllwörter, Pronomen, Mehrdeutigkeits-
  Rückfragen mit Antwortauflösung, Tippfehlertoleranz, Dialogthemen, Mehrfachbefehle, Meta-Befehle, historische
  Schranken.
- C64: BASIC-V2-Startbildschirm, BASIC-Teilmenge mit Schrittlimit, 1541 mit virtuellen Disketten, Directory-Semantik
  (überschreibt Programm), LOAD/SAVE/SYS, Schreibschutz, vereinfachte Befehle, Apps im Tastenmodus.
- Prolog: Anruf mit Dialogthemen, kurze Übergabe an der Tür, Fußballtraining, Jan allein.
- Spielediskette mit LADER, wiederholbarem Intro, fair entdeckbarem geheimem Modus, Diskette-2-Meldung,
  eingeschränktem Modul.
- Erste simulierte Mailbox mit verschlüsselter Rundnachricht, Alltagsspur (WT-07) und Systeminfo; Einstiegsrätsel
  (DATA-Codes → Nummer), Telefon/Koppler/Leitungszustände, Gebühren, Eltern-/Leitungsereignisse; keine echten Verbindungen.
- Notizblock (automatische Fakten nach Kategorien, eigene Notizen mit Bearbeiten/Löschen, Vermutungen),
  dreistufige Denkhilfe, C64-Archivprogramm mit Datenmodell.
- Diskette `1001` mit INTRUDER: drei animierte Demo-Teile, Laufschriften als Untertitel, synthetisierte Musik,
  konfigurierbarer `hintLink`.
- Illustrierter Schreibtisch (SVG-Platzhalter) mit zustandsabhängigen Hotspots, Detailansichten, Inventarleiste,
  Statusleiste (Zeit, Geld, Telefonkosten, Leitung).
- Speichern: Autosave, 3 Slots, Export/Import als validiertes JSON (zod, Größenlimit, Migration), Fortsetzen nach Reload.
- Barrierefreiheit/UX: Ton an/aus + Lautstärke, Texte für Tonsignale, reduzierte Bewegung, CRT-Effekt abschaltbar,
  Textgröße, hoher Kontrast, Tastaturbedienung, Fokusmarkierung, mobile Tabs und Sondertasten.

### Getestet (automatisiert, zuletzt alle grün)

- `npm test`: 64 Vitest-Tests in 5 Dateien (Parser, Zeit/Ereignisse, BASIC, Disketten, Save/Load, Prolog-Durchlauf,
  Demo, Archiv, Content-Integrität).
- `npm run test:e2e`: 4 Playwright-Szenarien × 2 Geräteprofile (Desktop Chrome, Pixel 7) = 8 Tests, darunter der
  komplette Prolog über die echte UI bis „Fortsetzung folgt“.
- `npm run lint`, `npm run build` fehlerfrei.
- Manuell: Screenshots Desktop/Mobil (Titel, Schreibtisch, C64, Demo) geprüft.

### Nicht implementiert

- Akte 2–6, weitere Handlungsstränge, GHOST, Operation REWIND, Enden, Game-Over.
- Reguläre regionale Mailboxen, BTX, Usenet-Gateway; Nachrichten senden im Netz.
- Diskette 2 und Schlüsselrekonstruktion; Entschlüsselung.
- Folgetage (Schlafen, Schule, Mahlzeiten), Ralf-Rückrufe, Briefe/Pakete als Ereignisse.
- Kassettenrekorder/Datasette-Inhalte, TV/VHS.
- Sprachausgabe, echte Illustrationen, komponierte Musik.
- Entwicklerkonsole (Flags setzen, Zeitsprung) – `debugLog` wird bereits geführt, aber nicht angezeigt.
- Folgen der verdeckten Werte (Verdachtsschwellen, Vertrauen).
- IndexedDB (derzeit `localStorage`, Datenmenge klein).

### Bekannte Grenzen

- BASIC ist eine dokumentierte Teilmenge (siehe `ARCHITECTURE.md`), kein Bildschirmeditor (Zeilen werden über das
  separate Eingabefeld eingegeben, nicht per Cursor auf dem Bildschirm editiert).
- Der Tastenmodus auf mobilen Bildschirmtastaturen wertet `input`-Ereignisse aus; manche Tastaturen liefern
  Sonderzeichen unzuverlässig – dafür gibt es die Sondertasten-Buttons.
- `^`/`` ` `` als Ersatz für die C64-Taste `←` hängt vom Tastaturlayout ab (Button und `DRÜCKE PFEILTASTE` gehen immer).
- Verb-/Objektvokabular ist auf den Ausschnitt zugeschnitten; seltene Formulierungen führen zu „verstehe ich nicht“
  statt zu falschen Aktionen.
- Gebühren und Tarife sind Spielökonomie, nicht historisch verifiziert.
- Die Schreibtisch-Illustration ist ein schlichter Platzhalter.

## Priorisierter Ausbauplan

1. **Storydesign-Workshop (Blocker für Akt 2+):** Fragen aus `STORY_OPEN_QUESTIONS.md` entscheiden – v. a.
   GHOST-Identität/-Erkennungsbogen, Operation REWIND (Termin, Ziel, Agent), Diskette 2, Titel des Spiels.
2. **Entwicklerkonsole** (`?dev=1`): Flags/Fakten/Beziehungen anzeigen und setzen, Zeit springen,
   Meilenstein-Spielstände, Ereignis-/Rätselgraph prüfen.
3. **Allgemeines Mailbox-System:** mehrere Systeme mit Brettern, privaten Nachrichten, Downloads, Öffnungszeiten,
   Kosten, Benutzerstatus; erste reguläre Mailbox (Kleinanzeige im Journal) als freiwillige Spur.
4. **Verdachts- und Vertrauenslogik:** Schwellen mit erzählerischen Symptomen (Tonfall, Anrufe, Accountsperre),
   Warnungen vor Game-Over.
5. **Tagesablauf:** Schlafen/Schule als Zeitblöcke, Ralf-Erreichbarkeit nach Plan, Post/Pakete als Ereignisse,
   Taschengeld und Telefonrechnung mit Elternreaktion.
6. **Schlüssel-Strang:** Teilrekonstruktion von Diskette 2 über Funde und eigene BASIC-Programme; vorgegebenes
   Entschlüsselungsprogramm (normaler Weg) + Expertenweg.
7. **BTX** mit eigener Seitendarstellung und historisch geprüfter Ausrüstung.
8. **Parser-Ausbau** anhand von Playtest-Protokollen (fehlgeschlagene Eingaben loggen, lokal).
9. **BASIC-Erweiterungen** nach Rätselbedarf (`OPEN/PRINT#/GET#` für SEQ-Dateien, `DEF FN`, Trigonometrie).
10. **Audio/Grafik:** echte Illustrationen, Detailansichten pro Gerät, komponierte SID-inspirierte Stücke,
    ausgewählte Sprachaufnahmen mit Transkript.
11. **Persistenz:** IndexedDB-Backend und Migrationstests, sobald Zustände wachsen.
12. **QA:** Historisches Fact-Checking (Tarife, Radio, Ortsbilder), Rechteklärung, Accessibility-Audit mit
    Screenreadern, Tests auf echten Geräten, PWA-Option.

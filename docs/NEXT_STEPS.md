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
- Entwicklerkonsole (`?dev=1`): Zustand ansehen/setzen, Zeitsprung, Meilenstein-Spielstände aus echten
  Spielbefehlen, Ereignis-/Rätselgraph mit Prüfung auf tote Enden, Debug-Log.
- Eigenständige C64-Bildschirmsimulation (`src/c64/`): PAL-Geometrie, berechnete Palette, eigener Zeichensatz,
  Röhreneffekte, austauschbares Startbild; BASIC mit Trigonometrie, `DEF FN`, `FRE`, `POS`.
- Allgemeines Mailbox-System: Öffnungszeiten, Gast/Anmeldung/Freischaltung, Bretter, private Post mit verzögerten
  Antworten, Downloads auf die Diskette; Terminalprogramm `TERMINAL`; zwei reguläre Mailboxen (Kleinanzeige →
  BIT-SCHUPPEN → Mailboxliste → DATENKELLER).
- Tagesablauf: Kalender mit Schultagen, erzählte Zeitblöcke (Schule, Schlaf, Abendbrot, Clubabend), Ralfs
  Wochenplan mit Rückrufen und späteren Telefonaten, Post, Taschengeld, Gebührenablesung durch den Vater.
- Verdachtslogik: benannte Schwellen, Risiko durch Verhalten im geheimen Netz, Symptome (Systemnachrichten,
  Kennungssperre, anonymer Anruf), letzte Warnung, Spielende mit „Letzten Schritt zurücknehmen“.
- Schlüssel-Strang: drei Fragmente (unsichtbare REM-Zeile im LADER, fehlgeleitete Netzmeldung, Datasette-Kassette
  von Ralf), Ersatzschlüssel im Modul mit Klartextanzeige, Expertenweg über Rohdaten als SEQ-Datei und eigenes
  BASIC-Programm (`OPEN`/`CLOSE`/`PRINT#`/`INPUT#`/`GET#`/`ST`), nutzbare Datasette, Rätsel P07–P09.
- Barrierefreiheit/UX: Ton an/aus + Lautstärke, Texte für Tonsignale, reduzierte Bewegung, CRT-Effekt abschaltbar,
  Textgröße, hoher Kontrast, Tastaturbedienung, Fokusmarkierung, mobile Tabs und Sondertasten.

### Getestet (automatisiert, zuletzt alle grün)

- `npm test`: 153 Vitest-Tests in 11 Dateien (Parser, Zeit/Ereignisse, BASIC, Disketten, Bildschirm/Video, Save/Load,
  Prolog-Durchlauf, Demo, Archiv, Content-Integrität, Entwicklerkonsole/Meilensteine, Mailbox-System, Verdacht,
  Tagesablauf, Schlüssel-Strang).
- `npm run test:e2e`: 8 Playwright-Szenarien × 2 Geräteprofile (Desktop Chrome, Pixel 7) = 16 Tests, darunter der
  komplette Prolog über die echte UI bis „Fortsetzung folgt“, die Entwicklerkonsole, eine reguläre Mailbox, das
  Spielende und die unsichtbare REM-Zeile.
- `npm run lint`, `npm run build` fehlerfrei.
- Manuell: Screenshots Desktop/Mobil (Titel, Schreibtisch, C64, Demo) geprüft.

### Nicht implementiert

- Akte 2–6, weitere Handlungsstränge, GHOST, Operation REWIND, reguläre Enden (ein Game-Over „Entdeckt“ existiert).
- BTX, Usenet-Gateway; Nachrichten senden im geheimen Netz.
- Die echte Diskette 2; was das Modul mit vollem Schlüssel zusätzlich kann (Senden).
- Story-Inhalte der Folgetage (Akt 2+); der Alltag selbst läuft.
- Weitere Kassetten, Speichern auf Band, TV/VHS.
- Sprachausgabe, echte Illustrationen, komponierte Musik.
- Symptome für Ralfs Vertrauen und Netzglaubwürdigkeit; Abklingen des Verdachts.
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

1. ~~**Storydesign-Workshop**~~ – erledigt am 31.10.2026, siehe `STORY_DECISIONS.md`. Details innerhalb der
   Entscheidungen (GHOSTs Name, Fragmente von Diskette 2, Ablauf des Finales …) werden mit den Akten ausgearbeitet,
   siehe `STORY_OPEN_QUESTIONS.md`.
2. ~~**Entwicklerkonsole**~~ – erledigt (siehe oben). Neue Meilensteine bei jedem neuen Akt ergänzen.
3. ~~**Allgemeines Mailbox-System**~~ – erledigt (siehe oben). Offen: Inhalte/Storyrolle der Mailboxen, Sysop als
   Gesprächspartner, Brett-Beiträge anderer Nutzer über die Zeit, Fernzone-Tarife, Verbindungsabbruch bei
   Sendeschluss.
4. ~~**Verdachts- und Vertrauenslogik**~~ – Mechanik und Seidel-Kette erledigt (siehe oben). Offen: Symptome für
   Ralfs Vertrauen (mit den Ralf-Rückrufen aus Punkt 5) und Netzglaubwürdigkeit (braucht Senden), Storytexte.
5. ~~**Tagesablauf**~~ – erledigt (siehe oben). Offen: Briefe/Pakete für Akt 2, Inhalte des Clubabends,
   Ralf-Strang (Überzeugen, Loyalitätskrise), weitere Ralf-Themen.
6. ~~**Schlüssel-Strang**~~ – erledigt (siehe oben). Offen: Folgen des Klartexts für Akt 2 (Freitag als Frist),
   Reaktion Ralfs auf den Inhalt der Kassette, Senden mit Schlüssel, ein Entwickler-Meilenstein für den Strang.
7. **BTX** mit eigener Seitendarstellung und historisch geprüfter Ausrüstung.
8. **Parser-Ausbau** anhand von Playtest-Protokollen (fehlgeschlagene Eingaben loggen, lokal).
9. **BASIC-Erweiterungen** nach Rätselbedarf (SEQ-Dateien, `DEF FN` und Trigonometrie sind erledigt; offen z. B.
   Kommandokanal 15, `CMD`, Bildschirmeditor).
10. **Audio/Grafik:** echte Illustrationen, Detailansichten pro Gerät, komponierte SID-inspirierte Stücke,
    ausgewählte Sprachaufnahmen mit Transkript.
11. **Persistenz:** IndexedDB-Backend und Migrationstests, sobald Zustände wachsen.
12. **QA:** Historisches Fact-Checking (Tarife, Radio, Ortsbilder), Rechteklärung, Accessibility-Audit mit
    Screenreadern, Tests auf echten Geräten, PWA-Option.

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
- Diskette `1001` mit INTRUDER: acht animierte Demo-Teile (Logo, Rand, Sterne, Plasma, Vektorwürfel, Tunnel, Sinus-Scroller, Grußliste mit Equalizer), Navigation per Leertaste/Ziffern, Effektbeschreibungen als Untertitel, 88-taktiger synthetisierter Song (rund 2:40, neun Abschnitte inkl. Rockteil mit nachgeahmter E-Gitarre und Solo),
  konfigurierbarer `hintLink`.
- Illustrierter Schreibtisch (SVG-Platzhalter) mit zustandsabhängigen Hotspots, Detailansichten, Inventarleiste,
  Statusleiste (Zeit, Geld, Telefonkosten, Leitung).
- Speichern: Autosave, 3 Slots (validiert per zod, Migration), Fortsetzen nach Reload.
- Entwicklerkonsole (`?dev=1`): Zustand ansehen/setzen, Zeitsprung, Meilenstein-Spielstände aus echten
  Spielbefehlen, Ereignis-/Rätselgraph mit Prüfung auf tote Enden, Debug-Log.
- Eigenständige C64-Bildschirmsimulation (`src/c64/`): PAL-Geometrie, berechnete Palette, eigener Zeichensatz,
  Röhreneffekte, austauschbares Startbild; BASIC mit Trigonometrie, `DEF FN`, `FRE`, `POS`.
- Allgemeines Mailbox-System: Öffnungszeiten, Gast/Anmeldung/Freischaltung, Bretter, private Post mit verzögerten
  Antworten, Downloads auf die Diskette; Terminalprogramm `TERMINAL`; vier reguläre Mailboxen (Kleinanzeige →
  BIT-SCHUPPEN → Mailboxliste → DATENKELLER; optional FLUX-HQ und STARDUST mit Chat, siehe `STORY_CRACKER.md`).
- Tagesablauf: Kalender mit Schultagen, erzählte Zeitblöcke (Schule, Schlaf, Abendbrot, Clubabend), Ralfs
  Wochenplan mit Rückrufen und späteren Telefonaten, Post, Taschengeld, Gebührenablesung durch den Vater.
- Verdachtslogik: benannte Schwellen, Risiko durch Verhalten im geheimen Netz, Symptome (Systemnachrichten,
  Kennungssperre, anonymer Anruf), letzte Warnung, Spielende mit „Letzten Schritt zurücknehmen“.
- Schlüssel-Strang: drei Fragmente (unsichtbare REM-Zeile im LADER, fehlgeleitete Netzmeldung, Datasette-Kassette
  von Ralf), Ersatzschlüssel im Modul mit Klartextanzeige, Expertenweg über Rohdaten als SEQ-Datei und eigenes
  BASIC-Programm (`OPEN`/`CLOSE`/`PRINT#`/`INPUT#`/`GET#`/`ST`), nutzbare Datasette, Rätsel P07–P09.
- BTX: Leih-Set vom Computerclub (Clubabend), Decoder-Modul im Modulschacht mit Autostart, Verbindung über die
  Hausleitung mit Gebühren, Seitennavigation (Ziffer, `*Nummer#`, `#`), tagesabhängige Seiten, verdeckte Clubtafel
  (P17).
- Parser-Ausbau (Punkt 8): lokales Playtest-Protokoll nicht verstandener Eingaben (Dev-Tab „Parser“, im Menü
  abschaltbar), Redewendungen (`WO BIN ICH`, `WAS IST IN DER SCHUBLADE`, `WAS SOLL ICH TUN` …), neue Verben/Nomen
  (`BEFRAGE`, `ERKLÄRE`, Schachtel, Etikett), hilfreichere Meldungen für Dinge im geschlossenen Päckchen/in der Schublade,
  Korpus-Test.
- Barrierefreiheit/UX: Ton an/aus + Lautstärke, Texte für Tonsignale, reduzierte Bewegung, CRT-Effekt abschaltbar,
  Textgröße, hoher Kontrast, Tastaturbedienung, Fokusmarkierung, mobile Tabs und Sondertasten.

### Getestet (automatisiert, zuletzt alle grün)

- `npm test`: 303 Vitest-Tests in 30 Dateien (Parser, Zeit/Ereignisse, BASIC, Disketten, Bildschirm/Video, Save/Load,
  Prolog-Durchlauf, Demo, Archiv, Content-Integrität, Entwicklerkonsole/Meilensteine, Mailbox-System, Verdacht,
  Tagesablauf, Schlüssel-Strang, BTX).
- `npm run test:e2e`: 16 Playwright-Szenarien × 2 Geräteprofile (Desktop Chrome, Pixel 7) = 32 Tests, darunter die Credits, das Easter-Egg, die Detailansicht, der
  komplette Prolog über die echte UI bis „Fortsetzung folgt“, die Entwicklerkonsole, eine reguläre Mailbox, das
  Spielende, die unsichtbare REM-Zeile, BTX und das Parser-Protokoll.
- `npm run lint`, `npm run build` fehlerfrei.
- Manuell: Screenshots Desktop/Mobil (Titel, Schreibtisch, C64, Demo) geprüft.

### Nicht implementiert

- Akt 2 und das Finale (Fr. 21.11.) sind spielbar, mit sieben Enden; Akte 3–6 sind im Finale zusammengefasst (siehe
  `STORY_DECISIONS.md`).
- Usenet-Gateway; historisch geprüfte BTX-Details (Mosaikgrafik/CEPT-Darstellung, Tarife).
- Weitere Kassetten, Speichern auf Band, TV/VHS.
- Sprachausgabe (braucht Aufnahmen und Rechte); echte, von Menschen gezeichnete Illustrationen (der Schreibtisch ist eine eigene Pixelszene).
- Abklingen des Verdachts (sinkt nur durch die Mail an GHOST).

### Bekannte Grenzen

- BASIC ist eine dokumentierte Teilmenge (siehe `ARCHITECTURE.md`), kein Bildschirmeditor (Zeilen werden über das
  separate Eingabefeld eingegeben, nicht per Cursor auf dem Bildschirm editiert).
- Der Tastenmodus auf mobilen Bildschirmtastaturen wertet `input`-Ereignisse aus; manche Tastaturen liefern
  Sonderzeichen unzuverlässig – dafür gibt es die Sondertasten-Buttons.
- `^`/`` ` `` als Ersatz für die C64-Taste `←` hängt vom Tastaturlayout ab (Button und `DRÜCKE PFEILTASTE` gehen immer).
- Verb-/Objektvokabular ist auf den Ausschnitt zugeschnitten; seltene Formulierungen führen zu „verstehe ich nicht“
  statt zu falschen Aktionen.
- Gebühren und Tarife sind Spielökonomie, nicht historisch verifiziert.
- Der Schreibtisch ist eine generierte Pixelszene (384×216, 32 Farben), keine Handillustration.

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
7. ~~**BTX**~~ – erledigt (siehe oben). Offen: historische Prüfung (`needs_research`), echte Mosaik-/Farbdarstellung
   der Seiten, weitere Angebote, Rolle im Finale, Entwickler-Meilenstein.
8. ~~**Parser-Ausbau**~~ – Werkzeug und erste Runde erledigt (siehe oben). Laufende Aufgabe: echte Protokolle von
   Testspielern auswerten (Dev-Tab „Parser“ → Kopieren), Fälle in `parserCorpus.test.ts` ergänzen.
9. **BASIC-Erweiterungen** nach Rätselbedarf (SEQ-Dateien, `DEF FN`, Trigonometrie und Kommandokanal 15 –
   löschen/umbenennen/Fehlerkanal – sind erledigt; offen z. B. `CMD`, Bildschirmeditor, echte `TI`/`TI$`).
10. **Audio/Grafik:** teilweise erledigt – gezeichnete Platzhalter-Detailbilder je Gerät (`ui/DeviceArt.tsx`: C64, Laufwerk,
    Telefon, Koppler, Radio, Datasette, Disketten, BTX-Set; zeigen Zustand wie LED, Diskette, Hörer), Diskette WT-07 in der
    Schublade, zweites komponiertes Stück (`audio/fernhandelSong.ts`, Marsch für FERNHANDEL, 20 Takte), Musik folgt jetzt dem
    Zustand (Demo/Spiel an → Musik, sonst Stille). Offen: echte Illustrationen, weitere Stücke (Titel, Ausblick),
    ausgewählte Sprachaufnahmen mit Transkript (Rechte/Aufnahme nötig).
11. ~~**Persistenz**~~ – erledigt: IndexedDB als Speicherort der Slots (`app/slotBackend.ts`, `app/storage.ts`), alter
    `localStorage` wird einmalig übernommen und bleibt Rückfall; Migrationskette 1→7 getestet. Offen: Zusatzdaten
    (Playtest-Protokoll, Einstellungen) liegen weiter in `localStorage`; Export/Import als Datei bleibt der Sicherungsweg.
12. **QA:** teilweise erledigt (siehe `QA_UND_RECHTE.md`): automatisierter Barrierefreiheitstest (axe, WCAG 2 A/AA),
    PWA-Option (Offline-Cache), Rechte- und Herkunftsübersicht. Offen, weil Menschen oder Hardware nötig sind:
    historisches Fact-Checking (Tarife, Radio, Ortsbilder, BTX), rechtliche Klärung (Bootprofil, Markennamen),
    Screenreader-Tests, Tests auf echten Geräten.

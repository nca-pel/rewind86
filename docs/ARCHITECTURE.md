# Architektur

## Überblick

```
src/
├── engine/       Deterministische Game-Engine (ohne DOM, ohne Zufall, ohne Systemzeit)
│   ├── types.ts      GameState, Bedingungen, Effekte, Befehle – alles JSON-serialisierbar
│   ├── state.ts      Initialzustand, SCHEMA_VERSION
│   ├── engine.ts     step(state, command) → { state, log, ui, audio }
│   ├── actions.ts    Ausführung aufgelöster Adventure-Intents, Meta-Befehle, Hilfesystem
│   ├── resolve.ts    Objektauflösung: Erreichbarkeit, Pronomen, Mehrdeutigkeit, Tippfehler
│   ├── phone.ts      Telefon, Hausleitung, Akustikkoppler, Gespräche
│   ├── time.ts       Aktionsbasierte Uhr, Ereignisplanung, Gebühren
│   ├── effects.ts    Deklarative Effekte anwenden
│   ├── conditions.ts Deklarative Bedingungen auswerten
│   ├── describe.ts   Zustandsabhängige Beschreibungen
│   └── save.ts       Speicherformat, zod-Schema, Migration, Import-Validierung
├── parser/       Adventure-Parser (Normalisierung, Lexikon, Intent-Erkennung)
├── sim/          C64-Simulation
│   ├── basic/        Tokenizer + Interpreter der BASIC-V2-Teilmenge
│   ├── c64.ts        Laufwerk, Directory, LOAD/SAVE/SYS, App-Steuerung, Bildschirm
│   └── apps/         Programmartige „Maschinenprogramme“: wt07, modk, archive, intruder
├── content/      Spielinhalte als Daten (Objekte, Fakten, Dialoge, Ereignisse, Rätsel, Disketten, Netze, Radio)
├── audio/        Web-Audio-Synthese (Effekte + Demo-Musik)
├── app/          React-Anbindung: useGame (Dispatch, UI-Effekte, Autosave), Speicher, Einstellungen
└── ui/           React-Komponenten (Schreibtisch-SVG, C64-Panel, Protokoll, Notizblock, Menüs)
```

**Grundregel:** Keine Storylogik in React-Komponenten. Die UI ruft ausschließlich `step()` auf und rendert den
zurückgegebenen Zustand. Klicks auf Hotspots/Schaltflächen erzeugen dieselben Textbefehle wie die Tastatur.

## Engine

`step(state, cmd)` klont den Zustand (`structuredClone`), arbeitet in einem `Ctx` (Protokoll, UI-Effekte,
Audio-Cues) und gibt den neuen Zustand zurück.

| Befehl               | Wirkung                                                    |
| -------------------- | ---------------------------------------------------------- |
| `start`              | Intro-Text, Startereignisse (Telefon klingelt)             |
| `adventure` (Text)   | Satztrennung → Parser → Intent → Aktion → Zeitfortschritt  |
| `c64line` / `c64key` | C64-Eingabe (BASIC-Zeile bzw. Einzeltaste an laufende App) |
| `c64tick`            | Animationstakt der App – **verändert nie die Spielzeit**   |
| `note` / `hint`      | Notizen anlegen/bearbeiten/löschen, Denkhilfe              |

Determinismus: kein `Date.now()`, kein `Math.random()`; BASIC-`RND` nutzt einen LCG im Spielzustand. Gleicher
Zustand + gleiche Befehle = gleicher Verlauf (getestet).

### Spielzustand

`GameState` (`engine/types.ts`) enthält u. a. `gameClock`, `itemLocations` (inventory/desk/drawer/package/drive/
nowhere), `objectStates`, `flags`, `knownFacts`, `knownTopics`, `hypotheses`, `puzzles`, `hintLevels`, verdeckte
`relationships` (`seidelSuspicion`, `ralfTrust`, `networkCredibility`, 0–100, **nie angezeigt**), `moneyDm`,
`phoneCostsDm`, `deskNotes`, `archive`, `computer` (Bildschirm, Programm, BASIC-Laufzeit inkl. INPUT-Pause,
laufende App), `disks` (virtuelle Disketten inkl. gespeicherter Dateien), `telecom`, `scheduledEvents`,
`firedEvents`, `history` (Adventure-Protokoll), `parser` (Pronomen-/Rückfragekontext), `debugLog`.

### Bedingungen & Effekte (deklarativ)

Content enthält keinen ausführbaren Code. Bedingungen: `fact`, `notFact`, `flag`, `notFlag`, `itemAt`, `objState`,
`timeAfter/Before`, `lineBusy`, `online`, `ringing`, `all/any/not`. Effekte: `setFlag`, `discoverFact`, `addTopic`,
`moveItem`, `setObjectState`, `changeRelationship`, `changeMoney`, `scheduleEvent`, `cancelEvent`, `puzzle`, `say`,
`audio`, `ui`, `telecom`.

### Zeit & Ereignisse

- Aktionen kosten Minuten (Standard 1; Meta-Befehle 0; Lesen 2–3; LOAD je nach Blockzahl; Online-Aktionen 1).
- `advanceTime()` verarbeitet alle fälligen Ereignisse **chronologisch**; bei `WARTE` unterbricht ein Ereignis mit
  `interrupts: true` das Warten fair.
- Einmalige Ereignisse werden in `firedEvents` vermerkt und nie erneut ausgelöst oder eingeplant (Idempotenz auch
  nach Laden). `repeatable` für Alltags-/Erinnerungsereignisse (Telefon klingelt weiter, bis abgehoben wird).
- Bedingungsereignisse (`trigger`) werden nach jedem Schritt geprüft (z. B. Ende des Ausschnitts).
- Gebühren: 1 Einheit bei Verbindungsaufbau, danach je `localMinutesPerUnit` (konfigurierbare Spielökonomie).

### Rätsel & Hilfe

`content/puzzles.ts`: Rätsel mit Status `unknown → discovered → solving → solved`, Stufen mit Bedingung und genau
drei Hilfetexten. `DENKE NACH` wählt das erste offene Rätsel und eskaliert pro Stufe 1 → 2 → 3. Die Hilfe führt nie
Aktionen aus.

## Adventure-Parser

Pipeline (`parser/adventure.ts`, `engine/resolve.ts`, `engine/actions.ts`):

1. **Satztrennung** an `.`, `;`, „dann“, „danach“ (nicht bei `TIPPE`/`NOTIERE`).
2. **Normalisierung**: Kleinschreibung, ä→ae/ö→oe/ü→ue/ß→ss, Satzzeichen entfernt.
3. **Moderne Begriffe** (Google, Handy, Internet …) → zeitgemäße Antwort ohne Aktion.
4. **Meta-Befehle** (HILFE, INVENTAR, NOTIZEN, DENKE NACH, ZEIT, WARTE n, SPEICHERN/LADEN, THEMEN, SCHLAFE).
5. **Verberkennung** mit abtrennbaren Partikeln am Satzende (`SCHALTE … EIN`, `HEBE … AB`, `LEGE … AUF`,
   `SCHAU DIR … AN`); Verb-Tippfehler (Damerau-Distanz) nur bei eindeutig nächstem Treffer.
6. **Segmentierung** nach Präpositionen (`in/ins/auf/mit/nach/über/von/aus …`), Artikel/Füllwörter entfernt.
7. **Objektauflösung**: Wertung über Substantive + Adjektive aller Objekte; erreichbare Objekte bevorzugt; bei
   Gleichstand Rückfrage (`Welche Diskette meinst du …?`), deren Antwort den gespeicherten Intent vervollständigt.
   Pronomen (`es`, `sie`, `ihn` …) → zuletzt genanntes Objekt. Unbekannte Wörter und unerreichbare Dinge erzeugen
   eine präzise Meldung statt einer erfundenen Handlung.
8. **Ausführung** über die Engine, danach Zeitfortschritt und Ereignisse.

Gespräche: Person = Wort direkt nach dem Verb oder nach „mit“, Thema = übrige Segmente
(`FRAGE RALF NACH SEINEM VATER` → Thema Seidel). Im laufenden Gespräch genügt das Thema allein. `THEMEN` listet nur
bekannte Themen; nicht gelistete bleiben eingebbar.

## C64-Simulation (kein Emulator)

### Bildschirm

Logisch 40 × 25 Zeichen, Umbruch bei 40 Zeichen, Eingabezeilen auf 80 Zeichen begrenzt (wie am Original). Farben
über simulierte Register `53280` (Rahmen), `53281` (Hintergrund), `646` (Text) und Farbcodes in `CHR$`.

### Unterstützte BASIC-V2-Teilmenge

| Kategorie   | Unterstützt                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Programm    | Zeilennummern 0–63999, Zeile löschen durch Nummer allein, `LIST [a][-b]`, `NEW`, `RUN [n]`, `CLR`                                                                                                                                                                                                |
| Anweisungen | `PRINT`/`?` (`;` `,` `TAB(` `SPC(`), `LET`/Zuweisung, `INPUT ["…";]v[,w]`, `GET` (liefert leer), `IF … THEN n`/Anweisung, `IF … GOTO`, `GOTO`, `GOSUB`/`RETURN`, `ON … GOTO/GOSUB`, `FOR … TO … [STEP]`/`NEXT [v,w]`, `REM`, `END`, `STOP`, `DATA`/`READ`/`RESTORE`, `DIM`, `POKE`, `SYS`        |
| Funktionen  | `CHR$ ASC LEN MID$ LEFT$ RIGHT$ VAL STR$ INT ABS SGN SQR RND PEEK`; `TI`/`TI$` konstant 0                                                                                                                                                                                                        |
| Operatoren  | `+ - * / ^`, `= <> < > <= >=`, `AND OR NOT` (wahr = −1)                                                                                                                                                                                                                                          |
| Variablen   | numerisch, `$`-Strings, `%`-Integer; nur die ersten 2 Zeichen zählen (wie V2); Keywords werden auch ohne Leerzeichen erkannt (`FORI=1TO3`)                                                                                                                                                       |
| Laufwerk    | `LOAD"$",8` (Directory als Programm, überschreibt Speicher), `LOAD"NAME",8[,1]`, Wildcards `*`/`PRE*`, `SAVE"NAME",8`                                                                                                                                                                            |
| Fehler      | `?SYNTAX`, `?TYPE MISMATCH`, `?UNDEF'D STATEMENT`, `?NEXT WITHOUT FOR`, `?RETURN WITHOUT GOSUB`, `?OUT OF DATA`, `?DIVISION BY ZERO`, `?ILLEGAL QUANTITY`, `?BAD SUBSCRIPT`, `?FILE NOT FOUND`, `?DEVICE NOT PRESENT`, `?MISSING FILE NAME`, `?ILLEGAL DIRECT`, `?REDO FROM START`, `BREAK IN n` |

**Bewusst nicht unterstützt:** `OPEN/CLOSE/PRINT#/GET#/INPUT#`, `VERIFY`, `CONT`, `WAIT`, `DEF FN`,
`SIN/COS/TAN/ATN/LOG/EXP/FRE/POS/USR`, Bildschirmeditor mit Cursorsteuerung, Grafik-/Sprite-Register,
Maschinensprache. Solche Befehle liefern `?SYNTAX ERROR` plus Hinweis im Adventure-Protokoll. Der Interpreter
behauptet keine vollständige V2-Kompatibilität.

**Sicherheit:** eigener Tokenizer + rekursiver Ausdrucksparser, kein `eval`/`new Function` (per ESLint verboten).
Schrittlimit `MAX_STEPS = 50 000` Anweisungen pro Ausführung → `BREAK IN n`. Stacktiefe (GOSUB/FOR) max. 64, Arrays
max. 10 000 Elemente, Strings max. 255 Zeichen. `POKE`/`PEEK` wirken nur auf eine simulierte Speichertabelle.

### Laden & Starten

- `LOAD"$",8` ersetzt den Programmspeicher durch das Directory (`programIsDirectory`); `LIST` zeigt es, `RUN`
  darauf ergibt `?SYNTAX ERROR` (wie am Original).
- PRG-Dateien mit `appId` sind „Maschinenprogramme“ mit BASIC-Stub (`10 SYS2064`); `RUN` bzw. `SYS 2061/2064`
  startet die App. `LOAD` innerhalb eines Programms mit `,1` lädt nach, ohne das BASIC-Programm zu ersetzen, und
  startet es mit erhaltenen Variablen neu (klassisches Ladeprogramm-Muster, siehe `LADER`).
- `SYS 64738` = Reset. Die Datasette ist nicht angeschlossen (`LOAD` ohne Gerät → `PRESS PLAY ON TAPE`, Abbruch).
- Vereinfachte Befehle: `ZEIGE DATEIEN`/`DIR` → `LOAD"$",8` + `LIST`; `LADE SPIEL`/`STARTE PROGRAMM` →
  `LOAD"*",8` + `RUN`. Die echten Befehle werden sichtbar mitgeschrieben.

### Apps

`AppDef` (`sim/apps/types.ts`): `start`, `key`, optional `line`, `tick`, `inputMode` (`keys`/`line`), `render`. Der
App-Zustand liegt serialisierbar in `computer.app`; der Bildschirm wird daraus abgeleitet.

| App        | Inhalt                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wt07`     | Intro des unveröffentlichten Spiels: Phasen logo → title → credits → hiscore (Schleife, Takt 1,2 s, RETURN = weiterschalten). Die geheime Taste wirkt in der **gesamten** Credits-Phase – keine Reaktionszeit nötig. |
| `modk`     | Verstecktes Modul: Diskette 2 fehlt → eingeschränkter Betrieb → Wahlhilfe → Mailbox (Nachrichten, System, Abmelden).                                                                                                 |
| `archive`  | Jans Archiv: Rubriken, Suche, neue Einträge (Daten in `state.archive`).                                                                                                                                              |
| `intruder` | Demo, drei Teile; Grafik per Canvas in der UI, Inhalte und Untertitel in der Engine.                                                                                                                                 |

## Telefon & Datenleitung

`telecom.handset`: `cradle | hand | coupler`; `telecom.call.kind`: `dialtone | voice | carrier | dead | occupied`.
Jans Leitung ist belegt, sobald der Hörer abgenommen ist; die Hausleitung kann durch Ereignisse belegt sein
(`houseLineBusyUntil`). Nummern werden ausschließlich gegen das fiktive `PHONEBOOK` aufgelöst; unbekannte Nummern →
„Kein Anschluss unter dieser Nummer“. Eine Datenverbindung entsteht nur durch Modemträger am Telefon + Hörer im
Koppler + Verbindungsbefehl im Terminalprogramm. Hörer heraus oder aufgelegt → `NO CARRIER`. Es gibt keinerlei
echte Netzwerk- oder Telefonzugriffe.

## Speicherformat

```json
{
  "format": "rewind1986-save",
  "schemaVersion": 1,
  "savedAt": "2026-10-31T12:00:00.000Z",
  "label": "Slot 1",
  "gameClock": "1986-11-14T16:42",
  "state": { "...": "vollständiger GameState" }
}
```

- `parseSave()` prüft Größe (≤ 2 MB), JSON, Format und `schemaVersion` (neuere werden abgelehnt), führt Migrationen
  (`MIGRATIONS[n]` → n+1) aus und validiert den kompletten Zustand mit zod (Wertebereiche, Längen, Enums).
- Slots in `localStorage`: `rewind1986.save.auto|1|2|3`; Einstellungen in `rewind1986.settings`.
- Autosave nach jedem Befehl (außer Animationstakt), bei Meilenstein-Effekten und bei `pagehide`.
- Virtuelle Disketten sind Spielobjekte in `state.disks` – getrennt von der Browser-Speicherdatei.

## UI

- `ui/Desk.tsx`: SVG-Platzhalterillustration in Schrägansicht; Hotspots sind `role="button"`, per Tab erreichbar,
  mit `aria-label`; ihr Aussehen folgt dem Zustand (Hörer, LEDs, Schublade, Päckchen, Disketten, Tageszeit).
- `ui/C64Panel.tsx`: 40×25-Raster, Größe über Container-Query-Einheiten skaliert; eigene Eingabe mit Fokusrahmen,
  Sondertasten, Tastenmodus inkl. Fallback für mobile Bildschirmtastaturen.
- `ui/AdventurePanel.tsx`: Protokoll (`role="log"`), Eingabe mit Historie.
- Barrierefreiheit: sichtbarer Fokus, Tastaturbedienung, Untertitel für Töne, Laufschrift als Text, reduzierte
  Bewegung (keine Animationen, statische Demo-Frames), Textgröße, hoher Kontrast.

## Tests

| Datei                      | Abdeckung                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/tests/parser.test.ts` | Normalisierung, Partikelverben, Synonyme, Pronomen, Rückfragen, Tippfehler, Dialogthemen, historische Schranken (GDD §19.1, §19.3) |
| `src/tests/time.test.ts`   | Uhr, chronologische Ereignisse bei WARTE 120, Unterbrechung, Idempotenz, Determinismus (§19.5)                                     |
| `src/tests/c64.test.ts`    | BASIC-Teilmenge, Fehler, Schrittlimit, INPUT, Directory/Überschreiben, LOAD/SAVE, vereinfachte Befehle (§19.2)                     |
| `src/tests/save.test.ts`   | Roundtrip, Fortsetzen nach Import, Ablehnung defekter/manipulierter Dateien (§19.5)                                                |
| `src/tests/prolog.test.ts` | Prolog auf Engine-Ebene, Intro-Fairness, Mailbox ohne Diskette 2, Leitungsereignisse, Demo, Archiv, Content-Integrität (§19.4)     |
| `e2e/prolog.spec.ts`       | Kompletter Prolog über die echte UI bis „Fortsetzung folgt“; Demo (Desktop Chrome + Pixel 7)                                       |
| `e2e/save.spec.ts`         | Reload/Fortsetzen, Slot-Speichern, Export/Import, Fehlerfall, LADEN per Parser; Eingabetrennung, kein horizontales Scrollen        |

## Inhalte erweitern

- Neues Objekt: `content/objects.ts` (Substantive/Adjektive normalisiert, Ort, Beschreibung mit Bedingungen).
- Neue Fakten/Themen/Dialoge/Ereignisse/Rätsel: jeweilige Datei in `content/`; Integritätstests prüfen Referenzen.
- Neue Mailbox: `content/networks.ts` (Nachrichten mit Effekten) + Eintrag im `PHONEBOOK`.
- Neue Diskette: `content/disks.ts` plus Objekt mit `DISK_ITEM_TO_IMAGE`-Zuordnung.
- Neues C64-Programm: `AppDef` in `sim/apps/`, in `APPS` registrieren, Datei mit `appId` auf eine Diskette legen.
- Neue Schemaversion: `SCHEMA_VERSION` erhöhen und Migration in `engine/save.ts` ergänzen.

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
│   ├── pressure.ts   Verdeckte Werte: benannte Schwellen, Deckel bis zur Warnung, Risiko, Kennungssperren
│   ├── routine.ts    Tagesablauf: Kalender, Schlaf, Ralfs Wochenplan, Taschengeld, Gebührenzähler
│   ├── describe.ts   Zustandsabhängige Beschreibungen
│   └── save.ts       Speicherformat, zod-Schema, Migration, Import-Validierung
├── parser/       Adventure-Parser (Normalisierung, Lexikon, Intent-Erkennung)
├── c64/          Eigenständige Bildschirmsimulation (ohne Engine-Abhängigkeit, ohne ROM-Daten)
├── sim/          C64-Simulation
│   ├── basic/        Tokenizer + Interpreter der BASIC-V2-Teilmenge
│   ├── c64.ts        Laufwerk, Directory, LOAD/SAVE/SYS, App-Steuerung, Bildschirm
│   └── apps/         Programmartige „Maschinenprogramme“: wt07, modk, archive, intruder
├── content/      Spielinhalte als Daten (Objekte, Fakten, Dialoge, Ereignisse, Rätsel, Disketten, Netze, Radio)
├── audio/        Web-Audio-Synthese (Effekte, Demo-Musik, Telefonklingel, Radio: Songs + Sprachausgabe)
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

`GameState` (`engine/types.ts`) enthält u. a. `gameClock`, `itemLocations` (inventory/desk/drawer/drive/
nowhere), `objectStates`, `flags`, `knownFacts`, `knownTopics`, `hypotheses`, `puzzles`, `hintLevels`, verdeckte
`relationships` (`seidelSuspicion`, `ralfTrust`, `networkCredibility`, 0–100, **nie angezeigt**), `moneyDm`,
`phoneCostsDm`, `deskNotes`, `archive`, `computer` (Bildschirm, Programm, BASIC-Laufzeit inkl. INPUT-Pause,
laufende App), `disks` (virtuelle Disketten inkl. gespeicherter Dateien), `telecom`, `scheduledEvents`,
`firedEvents`, `history` (Adventure-Protokoll), `parser` (Pronomen-/Rückfragekontext), `debugLog`.

### Bedingungen & Effekte (deklarativ)

Content enthält keinen ausführbaren Code. Bedingungen: `fact`, `notFact`, `flag`, `notFlag`, `itemAt`, `objState`,
`timeAfter/Before`, `lineBusy`, `online`, `ringing`, `rel` + `atLeast`/`below` (benannte Schwelle), `schoolDay`,
`schoolTomorrow`, `weekday`, `date`, `all/any/not`. Effekte: `setFlag`, `discoverFact`, `addTopic`, `moveItem`,
`setObjectState`, `changeRelationship`, `changeMoney`, `scheduleEvent`, `cancelEvent`, `puzzle`, `say`, `audio`, `ui`,
`telecom`, `lockAccount`, `gameOver`, `absence`, `sleep`, `pocketMoney`, `meterReading`. Objekte können
`readEffects` haben (z. B. Fakt beim Lesen eines Briefs).

### Zeit & Ereignisse

- Aktionen kosten Minuten (Standard 1; Meta-Befehle 0; Lesen 2–3; LOAD je nach Blockzahl; Online-Aktionen 1).
- `advanceTime()` verarbeitet alle fälligen Ereignisse **chronologisch**; bei `WARTE` unterbricht ein Ereignis mit
  `interrupts: true` das Warten fair – aber nur, wenn es dabei etwas ausgibt (stilles Neuplanen unterbricht nicht).
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

**Redewendungen** (`parsePhrase`, vor den Meta-Befehlen): `WO BIN ICH` → umsehen; `WAS SOLL/KANN ICH TUN`, `WAS NUN` →
Denkhilfe; `WAS IST IN DER SCHUBLADE` → untersuchen; `WAS STEHT AUF DEM ETIKETT` → lesen; `LEG DICH HIN` → schlafen;
`ZEIGE MIR DIE DATEIEN/DAS VERZEICHNIS` → Verzeichnis am C64.

**Playtest-Protokoll (lokal):** Scheitert die Eingabe (`unknownVerb`, `bare`, unbekanntes Wort, unerreichbares Objekt),
gibt die Engine einen UI-Effekt `parseMiss` aus (`Ctx.miss`, ändert keinen Spielzustand). `app/playtestLog.ts` führt
gleiche Eingaben zusammen (Zähler, höchstens 200 Einträge) und speichert sie in `localStorage` – nie ein Versand,
abschaltbar im Menü (`settings.logMisses`). Auswertung: Entwicklerkonsole → Tab „Parser“ (Aktualisieren, Kopieren,
Leeren). Neue Fehlschläge als Fall in `src/tests/parserCorpus.test.ts` aufnehmen, dann Lexikon/Objekte erweitern.

Gespräche: Person = Wort direkt nach dem Verb oder nach „mit“, Thema = übrige Segmente
(`FRAGE RALF NACH SEINEM VATER` → Thema Seidel). Im laufenden Gespräch genügt das Thema allein. `THEMEN` listet nur
bekannte Themen; nicht gelistete bleiben eingebbar.

## C64-Simulation (kein Emulator)

### Bildschirm (`src/c64/`)

Eigenständiges Modul ohne Abhängigkeit von der Spiel-Engine. **Es enthält keine Original-ROM-Dateien und keine
daraus extrahierten Daten** (ein Test prüft, dass keine ROM-/Binärabbilder im Projekt liegen).

| Datei         | Inhalt                                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geometry.ts` | PAL-VIC-II (6569): 40×25 Zeichen à 8×8, Anzeigefenster 320×200, sichtbares Bild 384×272 (Rahmen 32/35/32/37), Pixel-Seitenverhältnis 0,9365, 50,12 Hz, Cursorblinken alle 20 Jiffies (60 Hz), Speicheradressen                                                                                                     |
| `palette.ts`  | 16 Farben, **aus einem YUV-Modell berechnet** (Helligkeitsstufen + Farbwinkel in 22,5°-Schritten, PAL-Gamma) – keine kopierte Tabelle; Parameter in `PALETTE_MODEL`                                                                                                                                                |
| `charset.ts`  | **Eigener Zeichensatz**, von Hand gezeichnet bzw. aus Geometrieregeln erzeugt: Großschrift/Grafik und Klein-/Großschrift, je 128 Zeichen + Reversdarstellung (256 × 8 Byte). Senkrechte Striche 2 px breit (fernsehtauglich), Null mit Querstrich                                                                  |
| `petscii.ts`  | PETSCII ↔ Bildschirmcode ↔ Unicode (Text für Screenreader/Tests)                                                                                                                                                                                                                                                 |
| `video.ts`    | Serialisierbarer Zustand: Bildschirm-RAM (1000 Codes), Farb-RAM, Rahmen/Hintergrund/Schreibfarbe, Cursor, logische Zeilen (bis 80 Zeichen; 40 Zeichen + RETURN ⇒ Leerzeile wie am Original), RVS, Quote-Modus, Zeichensatz, Bildabschaltung. Steuercodes: Farben, RVS ON/OFF, CLR, HOME, Cursor, DEL, INST, 14/142 |
| `renderer.ts` | Pixelgenaue Ausgabe 384×272; PAL-Farbsäume (Farbanteile verschmieren stärker als Helligkeit), scharf-bilineare Skalierung, Zeilenlücken (ab ≥ 2,4 Gerätepixel/Rasterzeile), Nachleuchten, Rasterstreifen im Rahmen                                                                                                 |
| `boot.ts`     | Austauschbare Startbildschirm-Profile (siehe unten)                                                                                                                                                                                                                                                                |

Speicherabbildung: `1024–2023` Bildschirm-RAM, `55296–56295` Farb-RAM, `53280`/`53281` Rahmen/Hintergrund, `646`
Schreibfarbe, `53272` (Bit 1: Kleinschrift, z. B. `POKE 53272,23`), `53265` (Bit 4: Bild an), `199` RVS, `211`/`214`
Cursor (nur lesen). In der UI zeichnet `ui/C64Display.tsx` den Zustand auf ein Canvas; eine unsichtbare Textebene
(`data-testid="c64-screen"`) dient Screenreadern und Tests. Ein-/Ausschalten zeigt das Aufziehen bzw.
Zusammenfallen der Bildröhre; bei „reduzierter Bewegung“ entfallen Blinken, Streifen und Animationen.

### Startbildschirm austauschen

Alle möglicherweise geschützten Elemente (Herstellername in der Einschaltmeldung, Gerätebezeichnung im Panel und in
`aria-label`s) stehen ausschließlich in Profilen in `src/c64/boot.ts`:

- `authentic` (Standard): historische Einschaltmeldung.
- `neutral`: gleiche Geometrie, Speicheranzeige und Verhalten, ohne Marken-/Produktnamen („HEIMCOMPUTER 64“).
- Umschalten ohne Codeänderung: `VITE_C64_BOOT_PROFILE=neutral npm run build`, oder `GAME_CONFIG.c64.bootProfile`.
- Eigene Profile: `registerBootProfile({...})` (Zeilen werden auf 40 Zeichen geprüft; `^` zentriert, `{BYTES}` =
  freier Speicher). Unbekannte IDs fallen auf `neutral` zurück, nie auf geschützte Inhalte.

### Unterstützte BASIC-V2-Teilmenge

| Kategorie   | Unterstützt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Programm    | Zeilennummern 0–63999, Zeile löschen durch Nummer allein, `LIST [a][-b]`, `NEW`, `RUN [n]`, `CLR`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Anweisungen | `PRINT`/`?` (`;` `,` `TAB(` `SPC(`), `LET`/Zuweisung, `INPUT ["…";]v[,w]`, `GET` (liefert leer), `IF … THEN n`/Anweisung, `IF … GOTO`, `GOTO`, `GOSUB`/`RETURN`, `ON … GOTO/GOSUB`, `FOR … TO … [STEP]`/`NEXT [v,w]`, `REM`, `END`, `STOP`, `DATA`/`READ`/`RESTORE`, `DIM`, `POKE`, `SYS`                                                                                                                                                                                                                                                                                                                                     |
| Funktionen  | `CHR$ ASC LEN MID$ LEFT$ RIGHT$ VAL STR$ INT ABS SGN SQR RND PEEK SIN COS TAN ATN LOG EXP FRE POS`, `DEF FN`/`FN`; `TI`/`TI$` konstant 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Operatoren  | `+ - * / ^`, `= <> < > <= >=`, `AND OR NOT` (wahr = −1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Variablen   | numerisch, `$`-Strings, `%`-Integer; nur die ersten 2 Zeichen zählen (wie V2); Keywords werden auch ohne Leerzeichen erkannt (`FORI=1TO3`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Laufwerk    | `LOAD"$",8` (Directory als Programm, überschreibt Speicher), `LOAD"NAME",8[,1]`, Wildcards `*`/`PRE*`, `SAVE"NAME",8`; Datasette: `LOAD["NAME"][,1]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Dateien     | `OPEN n,8,sa,"NAME[,S,R\|W]"`, `CLOSE n`, `PRINT#n,…`, `INPUT#n,v[,w]`, `GET#n,v`, Status `ST` (64 = Dateiende); nur SEQ-Dateien auf der 1541; **Kommandokanal** `OPEN 15,8,15[,"Befehl"]`, `PRINT#15,"S0:NAME"` (löschen, mehrere Namen und `*` am Ende), `R0:NEU=ALT` (umbenennen), `N0:NAME,ID` (formatieren; ohne ID nur Schnell-Löschen einer formatierten Diskette; verweigert bei Disketten mit Programmen), `I0`/`V0`; Antwort per `INPUT#15,EN,EM$,ET,ES` (`00, OK`, `01, FILES SCRATCHED` mit Anzahl, `26`, `31`, `34`, `62`, `63`, `74`); Programmdateien (Apps) sind gesperrt; `CLR`/`RUN` schließen alle Dateien |
| Fehler      | `?SYNTAX`, `?TYPE MISMATCH`, `?UNDEF'D STATEMENT`, `?NEXT WITHOUT FOR`, `?RETURN WITHOUT GOSUB`, `?OUT OF DATA`, `?DIVISION BY ZERO`, `?ILLEGAL QUANTITY`, `?BAD SUBSCRIPT`, `?FILE NOT FOUND`, `?DEVICE NOT PRESENT`, `?MISSING FILE NAME`, `?ILLEGAL DIRECT`, `?REDO FROM START`, `BREAK IN n`; Dateien: `?FILE NOT OPEN`, `?FILE OPEN`, `?FILE EXISTS`, `?WRITE PROTECT ON`, `?NOT INPUT/OUTPUT FILE`                                                                                                                                                                                                                      |

**Bewusst nicht unterstützt:** relative Dateien, Drucker, `CMD`, `VERIFY`, `CONT`, `USR`, Bildschirmeditor mit Cursorsteuerung, Grafik-/Sprite-Register,
Maschinensprache. `WAIT adr,maske` ist nur als Bildtakt für Animationen gedacht (siehe `docs/STORY_CRACKER.md`). Solche Befehle liefern `?SYNTAX ERROR` plus Hinweis im Adventure-Protokoll. Der Interpreter
behauptet keine vollständige V2-Kompatibilität.

**Sicherheit:** eigener Tokenizer + rekursiver Ausdrucksparser, kein `eval`/`new Function` (per ESLint verboten).
Schrittlimit: höchstens `SLICE_STEPS` (6000) Anweisungen pro Takt; Programme laufen im Takt weiter (`WAIT` beendet ein Bild), eine Endlosschleife endet erst mit RUN/STOP. Stacktiefe (GOSUB/FOR) max. 64, Arrays
max. 10 000 Elemente, Strings max. 255 Zeichen. `POKE`/`PEEK` wirken nur auf eine simulierte Speichertabelle.

### Laden & Starten

- `LOAD"$",8` ersetzt den Programmspeicher durch das Directory (`programIsDirectory`) und listet es im Direktmodus
  sofort auf (Komfort; am Original war dafür `LIST` nötig, das weiterhin funktioniert). `RUN` darauf ergibt
  `?SYNTAX ERROR` (wie am Original).
- PRG-Dateien mit `appId` sind „Maschinenprogramme“ mit BASIC-Stub (`10 SYS2064`); `RUN` bzw. `SYS 2061/2064`
  startet die App. `LOAD` innerhalb eines Programms mit `,1` lädt nach, ohne das BASIC-Programm zu ersetzen, und
  startet es mit erhaltenen Variablen neu (klassisches Ladeprogramm-Muster, siehe `LADER`).
- `SYS 64738` (Reset-Einsprung des Originals) = Reset.
- Datasette (Gerät 1, Standard bei `LOAD` ohne Gerätenummer): zunächst abgestöpselt (`PRESS PLAY ON TAPE`, Abbruch).
  `LEGE KASSETTE IN DATASETTE` steckt sie an (`flags.datasetteConnected`, Ort `datasette`); dann lädt `LOAD` das
  Prüfband (`CASSETTE_PROGRAM` in `content/disks.ts`). Ein falscher Name spult das Band erfolglos durch.
- **Sichtbarkeit:** `videoLines()` liefert nur, was auf dem Bildschirm wirklich zu sehen ist – Zeichen in
  Hintergrundfarbe und ein abgeschaltetes Bild fehlen (Screenreader, Monitorbeschreibung, Tests). `raw = true` liest
  den Bildschirmspeicher. Darauf beruht das unsichtbare Schlüsselfragment im LADER (Farbcode in einer REM-Zeile);
  `afterBasic` erkennt Schlüsselteile erst, wenn sie sichtbar sind.
- Vereinfachte Befehle: `ZEIGE DATEIEN`/`DIR` → `LOAD"$",8`; `LADE SPIEL`/`STARTE PROGRAMM` →
  `LOAD"*",8` + `RUN`. Die echten Befehle werden sichtbar mitgeschrieben.

### Apps

`AppDef` (`sim/apps/types.ts`): `start`, `key`, optional `line`, `tick`, `inputMode` (`keys`/`line`), `render`. Der
App-Zustand liegt serialisierbar in `computer.app`; der Bildschirm wird daraus abgeleitet.

| App        | Inhalt                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wt07`     | Das unveröffentlichte Spiel FERNHANDEL: Intro-Phasen logo → title → credits → hiscore (Schleife, Takt 1,2 s, RETURN = weiterschalten), Leertaste startet das spielbare Spiel (Phase `play`, Logik rein in `content/fernhandel.ts`, Zustand in `app.game`). Die geheime Taste wirkt in der **gesamten** Credits-Phase – keine Reaktionszeit nötig.                                                  |
| `modk`     | Verstecktes Modul: Diskette 2 fehlt → eingeschränkter Betrieb (mit echter Diskette 2: Vollbetrieb, Schlüssel geladen) → Wahlhilfe, Ersatzschlüssel (Menü 3) → Mailbox (Nachrichten, System, Abmelden). Rundschreiben mit Ersatzschlüssel entschlüsselt; `S` speichert die Rohdaten als SEQ-Datei.                                                                                                  |
| `archive`  | Jans Archiv: Rubriken, Suche, neue Einträge (Daten in `state.archive`).                                                                                                                                                                                                                                                                                                                            |
| `intruder` | Demo, acht Teile (Zeichner in `ui/demoParts.ts`); Titel, Effektbeschreibung, Laufschrift und Jans Kommentare in der Engine. Leertaste/Ziffern 1–8/DEL navigieren. Musik (zustandsgesteuert in `useGame`: Demo bzw. FERNHANDEL läuft → Musik): `audio/demoSong.ts` (reine Daten: 88 Takte, 9 Abschnitte inkl. Rockteil mit E-Gitarren-Nachbildung, Tonartwechsel), gespielt von `audio.startMusic`. |
| `abandon`  | Easter-Egg: `LOAD"ABANDON",8,1` startet es direkt aus `c64Line` (auch ohne Diskette). Rendert schwarz mit `youtube`-ID; `ui/MonitorVideo.tsx` blendet das YouTube-Video (nocookie-Einbettung) in die Bildröhre ein, darüber Scanlines/Wölbung bei CRT-Effekt. RUN/STOP, RETURN oder Leertaste beenden.                                                                                             |

## Telefon & Datenleitung

`telecom.handset`: `cradle | hand | coupler`; `telecom.call.kind`: `dialtone | voice | carrier | dead | occupied`.
Jans Leitung ist belegt, sobald der Hörer abgenommen ist; die Hausleitung kann durch Ereignisse belegt sein
(`houseLineBusyUntil`). Nummern werden ausschließlich gegen das fiktive `PHONEBOOK` aufgelöst; unbekannte Nummern →
„Kein Anschluss unter dieser Nummer“. Eine Datenverbindung entsteht nur durch Modemträger am Telefon + Hörer im
Koppler + Verbindungsbefehl im Terminalprogramm. Hörer heraus oder aufgelegt → `NO CARRIER`. Es gibt keinerlei
echte Netzwerk- oder Telefonzugriffe.

## Mailbox-System

Inhalte in `content/networks.ts` (`MailboxSystem`), Logik in `engine/bbs.ts` (rein, getestet), Bedienung über zwei
C64-Programme:

| System            | Zugang                    | Programm                                       | Öffnungszeiten |
| ----------------- | ------------------------- | ---------------------------------------------- | -------------- |
| geheime Mailbox   | `access: 'module'`        | `MODUL K` (`sim/apps/modk.ts`, Auto-Anmeldung) | immer          |
| `BIT-SCHUPPEN GT` | `access: 'public'`, Gäste | `TERMINAL` auf der Archivdiskette (`term.ts`)  | 18–24 Uhr      |
| `DATENKELLER`     | `access: 'public'`, Gäste | `TERMINAL`                                     | 22–6 Uhr       |
| `FLUX-HQ`         | `access: 'public'`, Gäste | `TERMINAL`                                     | 17–23 Uhr      |
| `STARDUST BBS`    | `access: 'public'`, Gäste | `TERMINAL` (Menü 6: Chat mit RASTAR)           | 19–1 Uhr       |

- **Öffnungszeiten** (`hours`, auch über Mitternacht): Außerhalb klingelt es ohne Modemton durch.
- **Benutzerstatus**: `gast` (lesen) → `neu` (nach Anmeldung mit eigenem Handle) → `mitglied` (schreiben, private
  Post, Downloads). Die Freischaltung durch den Sysop erfolgt nach `validateAfterMinutes` und wird bei der nächsten
  Anmeldung ausgewertet (Zeitstempel statt Ereignis); dazu kommt die `memberMail` mit ihren Effekten.
- **Bretter** (`boards`) mit Mindeststatus je Brett und je Nachricht (`minStatus`); Jans Beiträge werden in
  `telecom.bbs[system].posts` gespeichert.
- **Private Post**: nur an im System bekannte Handles (Sysop + Autoren). `replies` liefern verzögerte Antworten
  (`afterMinutes`), die erst ab ihrem Zeitpunkt im Postfach erscheinen.
- **Downloads**: echte BASIC-Programme, die auf die Diskette im Laufwerk geschrieben werden (Schreibschutz, freie
  Blöcke und doppelte Namen werden geprüft); Dauer nach 300 Baud (254 Byte/Block, 30 Zeichen/s).
- **Kosten**: laufen über den normalen Gebührenzähler der Verbindung; `onlineMinutes` zählt mit.
- **Chat** (`chat: { handle }`): Gesprächsfigur im Terminalmenü 6, regelbasiert ohne Sprachmodell (`content/cracker.ts`, `engine/cracker.ts`, siehe `docs/STORY_CRACKER.md`).
- Das Modul verbindet sich nur mit der geheimen Mailbox, TERMINAL nicht mit ihr („unbekanntes Protokoll“).

- **Download-Kette (1986)**: Datei im Dateibereich wählen → Mitgliedsstatus → Diskette im Laufwerk, **formatiert** (`VirtualDisk.formatted`, fabrikneue `disk_new1..5` aus der Schublade sind `false`), nicht schreibgeschützt, genug freie Blöcke, Name noch frei. Dauer nach 300 Baud (~7 Blöcke/Min). Die Meldung nennt das Punter-Protokoll. Fünf unformatierte Disketten liegen zu Spielbeginn in der Schublade.

Neue Mailbox: Eintrag in `GAME_CONFIG.mailboxes` (Name, Nummer, Sysop, Zeiten), `MailboxSystem` in `networks.ts`,
in `MAILBOXES` und `PHONEBOOK` eintragen. Integritäts- und Graph-Prüfungen erfassen Effekte von Nachrichten und
`memberMail` automatisch.

## Tagesablauf

Jan verlässt den Schreibtisch nicht spielbar (GDD §3.1); Schule, Schlaf, Abendbrot und Clubabend sind **erzählte
Zeitblöcke**. Kalender und Zeiten stehen in `GAME_CONFIG.calendar`, Geld in `GAME_CONFIG.household`, Ralfs Plan in
`GAME_CONFIG.ralf.home`.

- **Tägliche Ereignisse** (`daily: 'HH:MM'` in `content/events.ts`) werden beim Feuern für den nächsten Tag neu
  eingeplant; Varianten entscheiden über Wochentag, Schultag, Datum, Abwesenheit.
- **Zeitblock** (`absence`-Effekt bzw. `requestAbsence()`): Jan legt auf, `flags.away` wird gesetzt, die Zeit springt
  bis zum Ende; Ereignisse dazwischen laufen normal (z. B. Post landet auf dem Tisch, Ralf ruft vergeblich an und
  versucht es später erneut). Danach wird WARTE abgebrochen. Blöcke werden nicht verschachtelt.
- **Schlafen:** `SCHLAFE` ab 21 Uhr; spätestens 01:30 schläft Jan ein. Geweckt wird 06:45 (Schultag) bzw. 09:30.
- **Schule** Mo–Fr 07:15–13:30, Sa bis 12:00 (Samstagsunterricht), außer Buß- und Bettag (19.11.). **Abendbrot** 18:50–19:15 (ausgelassen, wenn Jan
  online ist). **Vater** mahnt 22:30 vor Schultagen.
- **Ralf** ist nach Wochenplan erreichbar (`ralfWhere()`); sonst nimmt seine Mutter ab und Ralf ruft ~10 Min. nach
  seiner Heimkehr zurück (`ev_ralf_callback`). Ab 19:30 geht Seidel ans Telefon (bei Verdacht ≥ `noticeable` mit
  Zögern). Samstag 13:00 (nach der Schule) ruft Ralf von selbst an. Spätere Gespräche: `RALF_LATER` in `content/dialogue.ts`.
- **Post** Mo–Sa 10:30 (Samstag: Rundbrief des Computerclubs → Fakt `club_evening`). **Clubabend** Do 20.11.:
  `GEHE ZUM CLUB` zwischen 18:30 und 19:30: Anfahrt als Zeitblock, dann ein Gespräch mit Herrn Brandt (`flags.atClub`,
  `conversation.npc = 'brandt'`, Dialoge `BRANDT` in `content/dialogue.ts`). Jede Frage kostet 15 Minuten; `VERABSCHIEDE DICH`
  oder die sechste Frage beenden den Abend (`leaveClub` in `routine.ts`, 20 Minuten Heimweg).
- **Geld:** Samstag nach der Schule 10 DM Taschengeld; Sonntag beim Abendbrot liest der Vater den Gebührenzähler ab
  (`costsAtLastReading`): 3 DM frei, den Rest zahlt Jan, fehlendes Geld wird vom nächsten Taschengeld abgezogen.
- **Entwicklerkonsole:** `zeit 1986-11-17T10:00` springt zu einem Datum; Zeitblöcke laufen dabei mit ab.

## Verdacht und Vertrauen

Die verdeckten Werte `seidelSuspicion`, `ralfTrust`, `networkCredibility` (0–100) werden nie angezeigt (GDD §9.3).

- **Benannte Schwellen** in `GAME_CONFIG.thresholds`, jeweils „ab diesem Wert“. Storydaten fragen nur Namen ab:
  `{ rel: 'seidelSuspicion', atLeast: 'dangerous' }`, `{ rel: 'ralfTrust', below: 'trusting' }`. Ein Test prüft,
  dass jeder verwendete Name existiert.
- **Eine Stelle für Änderungen:** `changeRelationship()` in `engine/pressure.ts` (Effekt gleichen Namens); jede
  Änderung samt Grund und Stufenwechsel steht im Debug-Log.
- **Ankündigung vor dem Ende** (GDD §10.3): `GAME_CONFIG.terminal` deckelt einen Wert unter seiner Endschwelle, bis
  das Warn-Flag gesetzt ist. Zwischen Warnung und Spielende liegt also immer mindestens eine weitere Handlung.
- **Symptome** sind normale Trigger-Ereignisse in `content/events.ts` und Nachrichten mit `when` in
  `content/networks.ts`:

| Stufe Seidel | Wert | Symptom                                                                                   |
| ------------ | ---- | ----------------------------------------------------------------------------------------- |
| `noticeable` | 30   | Systemnachricht „PROTOKOLLIERUNG“ im Netz; online ein kurzer Moment des Stockens          |
| `dangerous`  | 70   | Gegenstelle trennt, Testkennung 180 Min. gesperrt, ausdrücklicher Gedanke; anonymer Anruf |
| `critical`   | 90   | Nachricht „LETZTE WARNUNG“, Gedanke + Systemhinweis, Warn-Flag `seidelFinalWarning`       |
| `discovered` | 100  | Spielende `end_discovered` (`content/endings.ts`)                                         |

- **Risiko** (`GAME_CONFIG.risk`): jede Anmeldung mit der Testkennung +3, je 5 Online-Minuten +1, Sendeversuch +2 (einmal
  pro Verbindung), gelesene Nachrichten laut Content. Der normale Lösungsweg endet bei etwa 7.
- **Kennungssperren** (`telecom.locks`, Effekt `lockAccount`): trennt eine laufende Verbindung; Modul und TERMINAL
  lehnen die Anmeldung bis zum Ablauf ab.
- **Anonymer Anruf**: klingelt erst, wenn die Leitung frei ist (sonst alle 20 Min. neuer Versuch); nimmt Jan nicht ab,
  geht nach 3 Min. die Mutter ran.
- **Spielende**: Flag `gameOver` = Ende-ID; die Engine nimmt danach nur noch Meta-Befehle (LADEN …) an. Die UI zeigt
  ein Fenster mit „Letzten Schritt zurücknehmen“. Ein beendeter Spielstand wird nie automatisch gespeichert, der
  Autosave bleibt also auf dem Stand vor der letzten Handlung.

## BTX (Bildschirmtext)

Content in `src/content/btx.ts` (fiktives Angebot »Wiedenbrücker Kurier«, Entwurf: `docs/BTX_PAGES_DRAFT.md`), App
`src/sim/apps/btx.ts`, Konfiguration `GAME_CONFIG.btx` (Zugangsnummer, Seitengebühr, Seitennummern).

- **Ausrüstung:** `btx_kit` (Decoder-Modul + Postmodem) hat den Ort `port` (Modulschacht). Einstecken/Entnehmen nur
  bei ausgeschaltetem C64. Beim Einschalten bzw. Reset (`SYS 64738`) startet der Decoder von selbst
  (`powerOnReset`); RUN/STOP führt zurück zu BASIC. Akustikkoppler und Modul K sind unabhängig davon.
- **Verbindung:** Das Postmodem wählt selbst. Es entsteht ein Datenanruf (`call.with = 'btx'`, `connectedSystemId =
'btx'`), also Gebühren wie bei Mailboxen und belegte Leitung (`janUsesLine`). Telefon abheben, Zeitblöcke und
  Ausschalten trennen (`btxDropCarrier`). Seitengebühr pro Abruf (Übersicht und Hilfe frei).
- **Bedienung:** Ziffer = Menüpunkt, `0` = Übersicht, `*Nummer#` = Direktwahl, `#` = Folgeseite, DEL, RUN/STOP = Ende.
  Seiten liefern ihren Text aus dem Spielzustand (Datum, Flags) – so gibt es tagesabhängige Nachrichten und Wetter.
- **Rätsel P17:** Die Nummer der Clubtafel steht im Rundbrief (`btx_club`); das Leihset gibt es am Clubabend
  (`goToClub` setzt `flags.clubAttended`). Der Tafeltext ändert sich nach dem Clubabend (Brücke zu GHOST, TODO-STORY).

## Schlüssel-Strang

Konfiguration in `GAME_CONFIG.keyStrand`, Verfahren in `src/engine/cipher.ts` (zyklische Verschiebung je
Schlüsselziffer, „X“ als Worttrenner – bewusst in BASIC nachrechenbar). Das Chiffrat des Rundschreibens wird aus
dem Klartext berechnet, nie von Hand gepflegt.

| Fragment | Fundort                                                      | Erkennung                                  |
| -------- | ------------------------------------------------------------ | ------------------------------------------ |
| 1/3      | LADER Zeile 70, `REM` + Farbcode Blau (`content/disks.ts`)   | sichtbar auf dem Bildschirm (`afterBasic`) |
| 2/3      | Nachricht `msg_key_leak` ab `partTwoFrom` (`when.timeAfter`) | Effekte der Nachricht                      |
| 3/3      | Kassette (`ev_ralf_cassette`), Programm `PRUEFBAND3`         | sichtbar auf dem Bildschirm nach `RUN`     |

`ev_key_first_part`/`ev_key_complete` (Trigger auf die Fakten) schalten P08/P09. Das Modul nimmt den
Ersatzschlüssel ungeprüft an; erst `readWithKey` beim Lesen entscheidet (Klartext → `k01_decrypted`, P09 gelöst).

## Speicherformat

```json
{
  "format": "rewind1986-save",
  "schemaVersion": 7,
  "savedAt": "2026-10-31T12:00:00.000Z",
  "label": "Slot 1",
  "gameClock": "1986-11-14T16:42",
  "state": { "...": "vollständiger GameState" }
}
```

- Version 2 speichert den Bildschirm als Bildschirm-/Farbspeicher; Version-1-Stände (Textzeilen) werden beim Laden
  migriert. Version 3 ergänzt Mailbox-Konten, Version 4 Kennungssperren und Risiko-Minuten, Version 5 den
  Tagesablauf (tägliche Ereignisse, Zählerstand, Clubbrief), Version 6 den Schlüssel-Strang (LADER mit versteckter
  Zeile, Kassette, Ort `datasette`, Ralfs Besuch; offene BASIC-Dateien in `computer.run.files`), Version 7 das BTX-Set (Ort `port`).
- `parseSave()` prüft Größe (≤ 2 MB), JSON, Format und `schemaVersion` (neuere werden abgelehnt), führt Migrationen
  (`MIGRATIONS[n]` → n+1) aus und validiert den kompletten Zustand mit zod (Wertebereiche, Längen, Enums).
- Slots `auto|1|2|3` in IndexedDB (Datenbank `rewind1986`, Store `saves`); `initStorage()` lädt sie beim Start in einen Zwischenspeicher, danach sind Lesen/Schreiben synchron, Schreiben läuft im Hintergrund durch (Fehler → Rückfall `localStorage`, `rewind1986.save.<slot>`). Alte `localStorage`-Stände werden einmalig übernommen. Einstellungen in `rewind1986.settings`.
- Autosave nach jedem Befehl (außer Animationstakt), bei Meilenstein-Effekten und bei `pagehide` – nie nach einem
  Spielende.
- Virtuelle Disketten sind Spielobjekte in `state.disks` – getrennt von der Browser-Speicherdatei.

## UI

- `ui/Desk.tsx` (`DeskScene`): Schreibtisch als Pixel-Szene, 384×216 Pixel, 32 Farben (`assets/desk/desk.png`, gebaut von `scripts/build-desk.py` aus `docs/00-raw/finalpixel.jpg`). Bild, Klickflächen (`DESK_AREAS`, Bildpixel) und Zustands-Sprites liegen in einem SVG; die Bühne skaliert in ganzen Gerätepixeln, solange das höchstens 15 % Größe kostet (geprüft in `e2e/desk.spec.ts` auf drei Fenstergrößen). Hover/Fokus: Pixel-Umriss (der Name steht nur in einer Screenreader-Zeile); der Befehl `ZEIGE NAMEN`/`BLENDE NAMEN AUS` (UI-Effekt `showNames`, Zustand in `useGame`) bzw. Taste N beschriftet alle Gegenstände; es gibt keine sichtbare Leiste unter dem Bild. Sprites nur, wo der Zustand fürs Spiel zählt: Monitorbild (C64-Farben, Zeilen angedeutet), LEDs, klingelnder Hörer, offene Schublade, Disketten; Fenster, Radio, Telefon und Zeitschrift bleiben wie im Bild. Das offene Päckchen ist reine Kulisse (kein Gegenstand, seit Spielstand-Schema 8); nur die Zeitschrift darin ist klickbar, und „Päckchen“/„Paket“ im Parser meinen die Zeitschrift. `DeviceArt.tsx` zeigt in der Detailansicht Ausschnitte derselben Szene, die Zeitschrift als eigenes Pixel-Titelbild („Heimcomputer-Journal 11/86“). Gemeinsame `Hotspot.tsx`; Hotspots sind `role="button"`, per Tab erreichbar,
  mit `aria-label`; ihr Aussehen folgt dem Zustand (Hörer, LEDs, Schublade, Disketten, Tageszeit).
- `ui/C64Panel.tsx`: 40×25-Raster, Größe über Container-Query-Einheiten skaliert; eigene Eingabe mit Fokusrahmen,
  Sondertasten, Tastenmodus inkl. Fallback für mobile Bildschirmtastaturen. `ui/MonitorCase.tsx` legt ein beiges
  Monitorgehäuse um die Röhre (CSS-Gehäuse, SVG-Glasreflex, SVG-Frontleiste mit Reglern und Betriebs-LED,
  Fantasiemodell „COLOR 14“); darunter die Tastenleiste mit Tastenkappen (F-Tasten hell, rechts).
- `ui/AdventurePanel.tsx`: Protokoll (`role="log"`), Eingabe mit Historie. Fenster mit gestreifter Titelleiste;
  jeder Absatz ist ein eigener Block – eigene Eingaben grün, alle Antworten, Durchsagen und Kommentare weiß.
- Stil (Retro-Layout, `styles.css`): Tapete als SVG-Muster, Kopfleiste mit Raster-Balken und LCD-Werten (VT323),
  kantige 3D-Schaltflächen. Detailansicht, Menü/Modals und Spielende-Dialoge sind „Pixel-Fenster“ (gestreifte
  Titelleiste, Schließkästchen links, harter Schatten) in eigenen Farben über die Variablen `--win*`. Schriften
  kommen lokal über `@fontsource` (Press Start 2P, Courier Prime für Detail- und Notiztexte, VT323; alle OFL). Hoher Kontrast schaltet
  Muster, Verläufe und Papierfarben ab.
- Barrierefreiheit: sichtbarer Fokus, Tastaturbedienung, Untertitel für Töne, Laufschrift als Text, reduzierte
  Bewegung (keine Animationen, statische Demo-Frames), Textgröße, hoher Kontrast.

## Entwicklerkonsole (`?dev=1`)

Schutz im Produktionsbuild: `engine/devFlag.ts` (`DEV_TOOLS` = `import.meta.env.DEV` oder `VITE_DEV_TOOLS=1`) macht die Konsole und den `dev`-Befehl zu toter Konstante, Rollup entfernt `dev.ts`/`DevPanel` (lazy). Der Spielcode wird per `javascript-obfuscator` (Plugin in `vite.config.ts`, Strings kodiert, Namen unlesbar, ohne Kontrollfluss-Verflachung) verschleiert; kein echter Schutz. E2E baut mit `VITE_DEV_TOOLS=1` (unverschleiert).

`engine/dev.ts` (rein, getestet) + `ui/DevPanel.tsx` (nicht modale Seitenleiste). Aktiv mit `?dev=1` für die
Browser-Sitzung, `?dev=0` schaltet ab. Ohne den Parameter wird nichts davon angezeigt.

- **Befehle** (Command `{ type: 'dev', text }`): `fakt <id>`/`fakt -<id>`, `flag <id> <wert>`/`flag -<id>`,
  `bez <id> <0–100>`, `rätsel <id> <status>` (auch rückwärts), `item <id> <ort>` (höchstens eine Diskette im
  Laufwerk), `zeit +<min>`/`zeit <HH:MM>` (nur vorwärts, fällige Ereignisse feuern regulär), `ereignis <id> [+<min>]`,
  `geld <DM>`. Ungültige Eingaben ändern nichts und schlagen ähnliche IDs vor. Jeder Eingriff steht als `dev …` im
  `debugLog` – manipulierte Spielstände bleiben erkennbar.
- **Meilensteine** (`MILESTONES`): entstehen durch Abspielen echter Spielbefehle ab Spielbeginn (deterministisch), nie
  als handgebauter Zustand. Ein Test prüft, dass jeder Meilenstein seinen Zustand erreicht – bricht eine
  Content-Änderung den Lösungsweg, schlägt er fehl.
- **Content-Analyse**: `contentGraph()` (Ereignis/Dialog/Mailbox → Folgeereignis, Fakt, Rätsel, Flag),
  `eventTable()` (Status, Auslöser-Bedingung jetzt erfüllt?), `puzzleTable()` (aktive Hilfestufe),
  `contentWarnings()` (Ereignisse ohne Zeitpunkt/Auslöser/Einplanung, nie gesetzte Rätsel). Im Code ausgelöste
  Ereignisse/Rätsel stehen in `CODE_TRIGGERS`; ein Test gleicht die Liste mit dem Quelltext ab.

## Alltag im Haus (reine Stimmung)

`content/household.ts` (Texte) und `engine/household.ts` (Auswahl, Zufall). Nichts davon wirkt auf Verdacht, Vertrauen, Rätsel oder Enden.

- **Tür öffnen**: `DOOR_SCENES` nach Datum, Wochentag, Schultag und Uhrzeit (Nacht, Schulmorgen, Sonntag in vier Abschnitten, Samstag, Tagesschau 19:30–20:15, Buß- und Bettag 19.11.). Erster passender Eintrag gewinnt, darin zufällige Variante. Mit 40 % ruft die Mutter von unten eine Frage (`MOTHER_QUESTIONS`, nicht zweimal dieselbe hintereinander, nie zwischen 23 und 6 Uhr); Jans Antwort ist erzählt.
- **Omas Anrufe**: zwei tägliche Prüfungen (`ev_oma_check_1` 16:30, `ev_oma_check_2` 19:35, Effekt `omaRing`). 18 % Chance, solange Jan frei ist (nicht online, nicht abwesend, Leitung frei, kein Besuch/Club, nicht im Finale), höchstens 3 Anrufe, mindestens 20 Stunden Abstand; Di–Do mit 50 %, solange sie noch nie angerufen hat. Abnehmen (`pickUp`, `ringing === 'oma'`) führt ein kurzes, zufällig zusammengesetztes Gespräch (Eröffnung, zwei Themen, Abschied) und legt dann auf; eingehende Anrufe kosten nichts. Verpasst Jan den Anruf, nimmt die Mutter ab (`ev_oma_ring_end`).
- **Zufall**: `nextRandom` (mulberry32) liest und schreibt `rngSeed` im Spielstand, ist also deterministisch und speicherbar.

## Gimmick: Diskette »Schneewitchen«

Versteckter Befehl (nirgends erklärt): `HEBE DAS MAGAZIN HOCH` (auch `…AN`, `LUPFE`, `SCHÜTTLE`) lässt `disk_sw` auf den Schreibtisch fallen (einmalig). Die Diskette (`SCHNEEWITCHEN`, ID `SW`, schreibgeschützt) trägt vier Koala-Bilder `SW_ZW1.KOA`, `SW_ZW2.KOA`, `SW_ZW3.KOA`, `GRUPPE.KOA` (PRG, je 41 Blöcke; der Unterstrich erscheint am C64 als `←`). Jedes Laden (`VirtualFile.crashes`, auch mit Platzhalter) startet die App `crash` (`sim/apps/crash.ts`): Datenmüll, Stillstand, dunkler Bildschirm, dann Reset über `AppResult.reset` (Programmspeicher weg). Es gibt kein Bild; der Witz ist die Erwartung.

## Tests

| Datei                             | Abdeckung                                                                                                                                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tests/parser.test.ts`        | Normalisierung, Partikelverben, Synonyme, Pronomen, Rückfragen, Tippfehler, Dialogthemen, historische Schranken (GDD §19.1, §19.3)                                                                                                |
| `src/tests/time.test.ts`          | Uhr, chronologische Ereignisse bei WARTE 120, Unterbrechung, Idempotenz, Determinismus (§19.5)                                                                                                                                    |
| `src/tests/c64.test.ts`           | BASIC-Teilmenge, Fehler, Schrittlimit, INPUT, Directory/Überschreiben, LOAD/SAVE, vereinfachte Befehle (§19.2)                                                                                                                    |
| `src/tests/video.test.ts`         | Zeichensatz, PETSCII, Steuercodes, logische Zeilen, Scrollen, Palette, Renderer, Startbild-Profile, POKE/PEEK, FRE, Mathe, DEF FN, Migration, keine ROM-Dateien                                                                   |
| `src/tests/save.test.ts`          | Roundtrip, Fortsetzen nach Import, Ablehnung defekter/manipulierter Dateien (§19.5)                                                                                                                                               |
| `src/tests/prolog.test.ts`        | Prolog auf Engine-Ebene, Intro-Fairness, Mailbox ohne Diskette 2, Leitungsereignisse, Demo, Archiv, Content-Integrität (§19.4)                                                                                                    |
| `src/tests/disks.test.ts`         | Fünferpack in der Schublade, unformatierte Disketten, `N0:` Formatieren, Schutz der Archivdiskette, Download nur auf formatierte Disketten                                                                                        |
| `src/tests/household.test.ts`     | Tür-Szenen nach Zeit/Wochentag, Fragen der Mutter, Omas Anrufe (Zufall, Grenzen, verpasster Anruf)                                                                                                                                |
| `src/tests/schneewitchen.test.ts` | Verstecktes Hochheben, Directory mit Koala-Dateien, Absturz und Reset bei jedem Laden                                                                                                                                             |
| `src/tests/bbs.test.ts`           | Öffnungszeiten, Handles, Gast/Anmeldung/Freischaltung, Bretter, Post mit Antwort, Download + RUN, Schreibschutz, NO CARRIER, zwei Systeme, Modul/TERMINAL-Trennung, Migration v2→v3                                               |
| `src/tests/cracker.test.ts`       | Cracker-Boxen FLUX-HQ/STARDUST, Chat mit RASTAR (Absichten, Gedächtnis, Strikes), Effektlistings, animierte BASIC-Läufe                                                                                                           |
| `src/tests/pressure.test.ts`      | Benannte Schwellen, Deckel bis zur Warnung, Risiko durch Anmeldung/Online-Zeit/Sendeversuch, alle Verdachtsstufen im Spiel, Sperre, anonymer Anruf, Spielende, Migration v3→v4                                                    |
| `src/tests/routine.test.ts`       | Kalender, Weckzeiten, Ralfs Wochenplan, Schlafen/Einschlafen, Samstag (Taschengeld, Post, Ralf ruft an, Risiko beim Erzählen), Rückruf, Schultag, Abendbrot, Gebührenzähler mit Schulden, Clubabend, Meilenstein, Migration v4→v5 |
| `src/tests/keystrand.test.ts`     | Chiffre, unsichtbare REM-Zeile + POKE 53281, Lesertipps, kompletter Schlüsselweg (Netzmeldung, Kassette, Datasette, Ersatzschlüssel), Expertenweg mit eigenem BASIC, SEQ-Dateien, Migration v5→v6                                 |
| `src/tests/btx.test.ts`           | Leihset vom Club, Modul nur bei ausgeschaltetem C64, Autostart/Reset, Verbindung, Navigation, Gebühren, Leitung, tagesabhängige Seiten, Clubtafel/P17, Zeilenbreiten, Migration v6→v7                                             |
| `src/tests/demo.test.ts`          | Song (Länge, Abschnitte, Notenbereich, Tonartwechsel, Break/Drop), acht Demo-Teile, Navigation, Hinweis beim Sprung, Fakt `demo_all`                                                                                              |
| `src/tests/parserCorpus.test.ts`  | Korpus natürlicher Eingaben aus der Playtest-Auswertung (Redewendungen, neue Verben/Nomen, hilfreiche Fehlermeldungen)                                                                                                            |
| `src/tests/playtestlog.test.ts`   | `parseMiss`-Effekte, Zusammenführen/Überlauf, Speichern/Abschalten/Leeren, defekte Daten                                                                                                                                          |
| `src/tests/dev.test.ts`           | Entwicklerbefehle, Zeitsprung, Meilensteine (Zustand, Determinismus, speicherbar), Content-Graph, `CODE_TRIGGERS` gegen Quelltext, keine toten Enden                                                                              |
| `e2e/bbs.spec.ts`                 | TERMINAL über die echte UI: Verbindung, Anmeldung, Brett lesen, Statusleiste                                                                                                                                                      |
| `e2e/keystrand.spec.ts`           | Unsichtbare REM-Zeile über die echte UI: LIST zeigt sie nicht, nach `POKE 53281,0` erscheint sie                                                                                                                                  |
| `e2e/btx.spec.ts`                 | BTX über die echte UI: Leihset, Decoder startet, Verbindung, Seitenwahl                                                                                                                                                           |
| `e2e/parserlog.spec.ts`           | Nicht verstandene Eingaben im Dev-Tab „Parser“, Leeren, Abschalten im Menü                                                                                                                                                        |
| `e2e/gameover.spec.ts`            | Spielende-Fenster, gesperrte Eingabe, „Letzten Schritt zurücknehmen“ lädt den Stand davor                                                                                                                                         |
| `e2e/dev.spec.ts`                 | Konsole nur mit `?dev=1`, Befehle, Meilenstein laden, Graph/Ereignisse, Abschalten mit `?dev=0`                                                                                                                                   |
| `e2e/prolog.spec.ts`              | Kompletter Prolog über die echte UI bis „Fortsetzung folgt“; Demo (Desktop Chrome + Pixel 7)                                                                                                                                      |
| `e2e/save.spec.ts`                | Reload/Fortsetzen, Slot-Speichern, Export/Import, Fehlerfall, LADEN per Parser; Eingabetrennung, kein horizontales Scrollen                                                                                                       |

## Inhalte erweitern

- Neues Objekt: `content/objects.ts` (Substantive/Adjektive normalisiert, Ort, Beschreibung mit Bedingungen).
- Neue Fakten/Themen/Dialoge/Ereignisse/Rätsel: jeweilige Datei in `content/`; Integritätstests prüfen Referenzen.
- Neue Mailbox: `content/networks.ts` (Nachrichten mit Effekten) + Eintrag im `PHONEBOOK`.
- Neue Diskette: `content/disks.ts` plus Objekt mit `DISK_ITEM_TO_IMAGE`-Zuordnung.
- Neues C64-Programm: `AppDef` in `sim/apps/`, in `APPS` registrieren, Datei mit `appId` auf eine Diskette legen.
- Neue Schemaversion: `SCHEMA_VERSION` erhöhen und Migration in `engine/save.ts` ergänzen.

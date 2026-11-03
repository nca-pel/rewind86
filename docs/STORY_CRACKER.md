# Cracker-Szene: Mailboxen, Chat und Demo-Effekte

Reiner Zeitvertreib, ohne Bezug zum Agentenstrang um Seidel. Jan kann sich in zwei Boxen der C64-Szene einwählen, News
lesen, kleine Demos laden und mit dem Cracker **RASTAR** über Effekte und neue Releases plaudern. RASTAR diktiert ihm
Effekte, die Jan in BASIC eintippt – der C64 zeigt sie animiert.

## Die Boxen

| Box          | Nummer | Zeiten    | Inhalt                                                                    |
| ------------ | ------ | --------- | ------------------------------------------------------------------------- |
| FLUX-HQ      | 58331  | 17–23 Uhr | Bretter FLUX NEWS und SZENE-TRATSCH; Downloads STERNE, BALKEN, FLUX-INTRO |
| STARDUST BBS | 61877  | 19–01 Uhr | Brett STERNENSTAUB, **Chat mit RASTAR** (Terminalmenü 6)                  |

Auffinden: Im BIT-SCHUPPEN (Brett C64-ECKE, Beitrag »DEMOS BEI FLUX« von ZAPPO) steht die FLUX-Nummer (Fakt
`bbs_fluxhq`). Bei FLUX NEWS empfiehlt der Sysop KRAKEN die STARDUST BBS (Fakt `bbs_stardust`). Beide Boxen sind reguläre
Terminalboxen (TERMINAL auf der Archivdiskette). Downloads brauchen die Freischaltung (20 Minuten), News und Chat nicht.

## Persona RASTAR

- **Rico, 17**, Elektroniker-Azubi im zweiten Lehrjahr, Bielefeld, wohnt bei den Eltern, Computer im Keller.
- **Gruppe STARDUST**: DUSTY (Sysop), MONKEY (Code), TEXI (Musik), RASTAR (Grafik/Code). Rivale und Freund: FLUX.
- **Mag**: Rasterbalken, Rob Hubbard, Uridium, Paradroid, Kraftwerk. Spart auf einen Amiga (5000 Mark), träumt davon.
- **Nervt**: die Telefonrechnung (Eltern drehen den Hahn zu), die langsame 1541, Lamer.
- **Sprache**: Szene-Jargon, duzt, kurze Sätze, ehrlich und ein bisschen angeberisch. Antwortet in Versalien (C64-Zeichensatz).
- **Grenzen**: Er verrät keine Cracking-Details (»das ist unser Handwerk«), kennt weder Seidel noch K-01 noch das Netz und
  weicht darauf mit Ahnungslosigkeit aus. Nach drei Beleidigungen beendet er den Chat.

## Wie das freie Gespräch funktioniert (`src/content/cracker.ts`, `src/engine/cracker.ts`)

Kein Sprachmodell. Stattdessen:

1. **Effektwünsche** (Farbbalken, Farbwelle, Sinus-Scroller) werden zuerst erkannt und mit dem Listing beantwortet.
2. **Absichten** (~30 Stichwortgruppen: Person, Gruppe, Demos, Musik, Spiele, Amiga, Telefonrechnung, 1541, Fehlersuche, Danke,
   Beleidigung, Tschüss …). Jede Absicht hat mehrere Varianten; die nächste kommt bei jedem Treffer, danach »NOCH MAL: …«.
3. **Gedächtnis** in den Spiel-Flags (`crk_*`): wie oft welches Thema, Besuche (erste Begrüßung, später Wiedersehen), Strikes.
   Schlägt eine Absicht an und das Anschlussthema wurde noch nicht besprochen, schlägt RASTAR es selbst vor.
4. **Echo** für »ICH MAG / SPIELE / HABE / BIN …« – damit auch Unvorhergesehenes eine Reaktion bekommt.
5. **Ausweichen** (Frage / Aussage) mit gelegentlichem Themenvorschlag, wenn das Gespräch hängt.

Jede Nachricht kostet eine Spielminute. Der Gesprächsverlauf ist nur Bildschirm (nicht gespeichert), das Gedächtnis schon.

## Die Effekte

Die Listings sind so kurz, dass sie in die 40 Zeichen der Chatzeile passen. Als Bildtakt dient `WAIT 53265,128`.

| Effekt         | Zeilen | Idee                                                                                 |
| -------------- | ------ | ------------------------------------------------------------------------------------ |
| FARBBALKEN     | 3      | `POKE 53280/53281` wechselt Rahmen und Hintergrund bei jedem Bild                    |
| FARBWELLE      | 5      | Bildschirm voller Blöcke, der Farb-RAM (55296) wird verschoben: diagonale Streifen   |
| SINUS-SCROLLER | 9      | Text läuft als Sinuswelle durchs Bild (Zeichen im Bildschirm-RAM, Farbe im Farb-RAM) |

Dazu die FLUX-Downloads: STERNE (Sternenhimmel, 3 Geschwindigkeiten), BALKEN, FLUX-INTRO (Laufschrift, Balken, Rahmen) und bei STARDUST FARBREGEN (fallende Kugeln) und PULSAR (pulsierender Rand).

Downloads brauchen eine **formatierte** Diskette (siehe `RECHERCHE_DOWNLOAD_1986.md`).

## Technik: animierte BASIC-Läufe

Vorher lief ein `RUN` synchron bis zum Ende. Jetzt gilt:

- `WAIT adr,maske` beendet ein Bild: Der Interpreter liefert `RunStatus 'running'`, `run.running = true`.
- Programme ohne WAIT laufen höchstens `SLICE_STEPS` (6000) Anweisungen pro Takt weiter (statt wie früher nach 50 000 mit BREAK
  zu enden – eine Endlosschleife läuft jetzt wie am Original, bis RUN/STOP kommt).
- `c64Tick` setzt den Lauf fort, `renderC64` meldet `tickMs: 70` und den Tastenmodus (Esc = RUN/STOP).
- Alles bleibt im Spielstand serialisierbar (`BasicRun.running`), der Takt verändert nie die Spielzeit.

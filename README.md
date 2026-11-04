# REWIND 1986

Deutschsprachiges, browserbasiertes Text-Adventure: Rheda-Wiedenbrück, Herbst 1986. Jan Keller (16, Schüler) bekommt von
seinem Freund Ralf die heimlich kopierte Arbeitsdiskette eines unveröffentlichten C64-Spiels – und stößt auf ein
verstecktes Kommunikationsmodul.

**Stand:** technisch belastbare Grundlage plus **spielbarer vertikaler Ausschnitt (ca. 15–30 Minuten)**. Das
8–12-Stunden-Vollspiel ist _nicht_ implementiert; der Ausschnitt endet mit „Fortsetzung folgt“.

## C64-Bildschirm und Startmeldung

Der C64-Bildschirm ist eine eigene Simulation (`src/c64/`): PAL-Geometrie, berechnete Farbpalette, eigener
Zeichensatz, Bildschirmspeicher mit PETSCII-Steuercodes und Röhreneffekte – ohne Original-ROMs. Die Einschaltmeldung
ist austauschbar; eine markenfreie Variante baut man mit `VITE_C64_BOOT_PROFILE=neutral npm run build`. Details:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#startbildschirm-austauschen).

## Voraussetzungen

- Node.js ≥ 20 (getestet mit 22), npm ≥ 10
- Für E2E-Tests: Chromium für Playwright (`npx playwright install chromium`, falls nicht vorhanden)

## Befehle

| Zweck                                      | Befehl                                  |
| ------------------------------------------ | --------------------------------------- |
| Abhängigkeiten installieren                | `npm install`                           |
| Entwicklungsserver (http://localhost:5173) | `npm run dev`                           |
| Produktions-Build nach `dist/`             | `npm run build`                         |
| Build im Netz ausliefern (Port 4173)       | `npm run serve`                         |
| Build lokal ansehen                        | `npm run preview`                       |
| Unit-/Integrationstests (Vitest)           | `npm test`                              |
| E2E-Tests Desktop + Mobil (Playwright)     | `npm run test:e2e`                      |
| Lint (ESLint) / Format prüfen (Prettier)   | `npm run lint` / `npm run format:check` |
| Alles: Lint, Unit, Build, E2E              | `npm run test:all`                      |

Der Build ist statisch (`base: './'`) und braucht keinen Server, kein Backend und keinen Login.

## Zugriff von Windows (Server ohne Bildschirm)

Das Spiel läuft komplett im Browser. Auf dem Ubuntu-Server muss nur ein kleiner Webserver laufen; geöffnet wird es
im Browser auf Windows (Chrome, Edge oder Firefox). Es gibt drei Wege – **Weg A ist der empfohlene**.

Platzhalter in den Beispielen: `user` = dein Login auf dem Server, `server` = Hostname oder IP des Servers
(IP herausfinden auf dem Server: `hostname -I`).

### Weg A: SSH-Tunnel (empfohlen, nichts wird ins Netz geöffnet)

1. Auf dem **Server** (z. B. per SSH-Sitzung) den Build ausliefern:

   ```bash
   cd /projects/rewind86
   npm install          # nur beim ersten Mal
   npm run build
   npx vite preview --port 4173
   ```

2. Auf **Windows** in PowerShell oder der Eingabeaufforderung (OpenSSH ist in Windows 10/11 enthalten) den Tunnel
   öffnen und das Fenster offen lassen:

   ```powershell
   ssh -N -L 4173:localhost:4173 user@server
   ```

3. Im Windows-Browser öffnen: **http://localhost:4173**

Der Port ist auf dem Server nur lokal erreichbar; der Verkehr läuft verschlüsselt durch SSH. Für die Entwicklung mit
automatischem Neuladen dasselbe mit `npm run dev` und Port `5173` (`ssh -N -L 5173:localhost:5173 user@server`,
dann http://localhost:5173).

**VS Code:** Wer per „Remote – SSH“ auf dem Server arbeitet, startet `npm run dev` im integrierten Terminal; VS Code
leitet den Port automatisch weiter (Reiter „Ports“) und bietet „Im Browser öffnen“ an.

**PuTTY statt OpenSSH:** _Connection → SSH → Tunnels_: Source port `4173`, Destination `localhost:4173`, „Add“,
dann wie gewohnt verbinden.

### Weg B: Direkt im lokalen Netz

Nur in einem vertrauenswürdigen Netz (Heim-/Firmen-LAN, VPN) verwenden – der Server ist dann für alle Rechner im
Netz erreichbar.

```bash
npm run serve        # baut und liefert auf 0.0.0.0:4173 aus
```

Im Windows-Browser: **http://server:4173** (bzw. die IP). Falls die Firewall `ufw` aktiv ist, den Port einmalig
freigeben: `sudo ufw allow 4173/tcp` (nur fürs LAN: `sudo ufw allow from 192.168.0.0/16 to any port 4173 proto tcp`).

`npm run dev:remote` macht dasselbe mit dem Entwicklungsserver (Port 5173). Den Entwicklungsserver nicht ins
Internet stellen – er ist nicht dafür gedacht.

### Weg C: Dauerhaft mit einem normalen Webserver

Der Build in `dist/` besteht nur aus statischen Dateien und kann von jedem Webserver ausgeliefert werden, z. B. nginx:

```bash
npm run build
sudo mkdir -p /var/www/rewind1986 && sudo cp -r dist/* /var/www/rewind1986/
```

```nginx
# /etc/nginx/sites-available/rewind1986  (danach nach sites-enabled verlinken, nginx neu laden)
server {
    listen 8080;
    root /var/www/rewind1986;
    index index.html;
}
```

Aufruf: http://server:8080. Alternativ den Ordner `dist/` nach Windows kopieren und dort mit einem beliebigen lokalen
Webserver ausliefern (z. B. `python -m http.server 8000` im Ordner, dann http://localhost:8000).
**Nicht** einfach `index.html` per Doppelklick öffnen – Browser blockieren JavaScript-Module über `file://`.

### Hinweise

- **Spielstände** liegen im Browser (IndexedDB, Rückfall `localStorage`), nicht auf dem Server. Sie sind an die Adresse
  gebunden: `http://localhost:4173` und `http://server:4173` haben getrennte Spielstände. Ein Export oder Import
  von Spielständen existiert nicht; wer ständig dieselbe Adresse nutzt (z. B. immer den SSH-Tunnel), behält seine Stände.
- **Ton** startet erst nach dem ersten Klick oder Tastendruck (Autoplay-Regel der Browser).
- **E2E-Tests** laufen headless direkt auf dem Server (`npm run test:e2e`), dafür ist kein Bildschirm nötig.
- **Port belegt?** Die Skripte brechen dann ab (`--strictPort`). Anderen Port wählen, z. B.
  `npx vite preview --port 4180`, und im Tunnel/Browser entsprechend anpassen.
- **Seite lädt nicht über Weg B?** Auf dem Server prüfen, ob er lauscht: `ss -ltn | grep 4173`
  (`0.0.0.0:4173` = von außen erreichbar, `127.0.0.1:4173` = nur lokal → Weg A oder `npm run serve` nutzen).

## Steuerung

Auf dem Titelbild stehen Neues Spiel (immer im Normalmodus; der schwere Modus bleibt im Code und lässt sich per `?difficulty=hard` wählen), Fortsetzen, Laden, Einstellungen und Credits links; rechts gibt ein Nadeldrucker die Vorgeschichte aus. Dazu läuft eine eigene, synthetisierte Titelmusik (nach dem ersten Klick oder Tastendruck).

### Gemeinsame Eingabezeile (im ADVENTURE-Fenster)

Es gibt **eine** Eingabezeile. Ein Umschalter links davon (`>` / `C64>`) bestimmt, wohin sie schickt; **Alt+C** wechselt den Modus. Im C64-Modus gibt ein vorangestelltes `!` eine einzelne Zeile an das Adventure.

**Adventure-Modus:** Freie deutsche Sätze, Groß-/Kleinschreibung und Umlaute (`ö`/`oe`) egal. Beispiele:

```
SCHAU DICH UM            UNTERSUCHE DISKETTE        ÖFFNE SCHUBLADE
NIMM HÖRER / HEBE AB     FRAGE RALF NACH DEM SPIEL  REDE MIT RALF ÜBER TRAINING
LEGE AUF                 WARTE / WARTE 30           LEGE DISKETTE INS LAUFWERK
SCHALTE COMPUTER EIN     STELLE RADIO AUF BFBS      LIES ZEICHENTABELLE
WÄHLE 12345              RUFE RALF AN               LEGE HÖRER IN DEN KOPPLER
TIPPE LOAD"$",8          DRÜCKE LEERTASTE           DRÜCKE PFEILTASTE
NOTIZEN / NOTIERE …      VERKNÜPFE RALF MIT FUSSBALL  DENKE NACH (3 Hilfestufen)
INVENTAR  ZEIT  THEMEN   SPEICHERN 1 / LADEN 1      HILFE
```

Pronomen (`ÖFFNE ES`), Rückfragen bei Mehrdeutigkeit (`Welche Diskette meinst du …?` → `die 1001`), mehrere
Befehle pro Zeile (`ÖFFNE SCHUBLADE. NIMM 1001`) und leichte Tippfehler werden unterstützt.

**C64-Modus:**

- **BASIC-Zeilen:** Zeile tippen + Enter, z. B. `LOAD"$",8` · `LIST` · `LOAD"*",8` · `RUN` · `10 PRINT "HALLO"`.
  ↑/↓ blättern in der Befehlshistorie. Vereinfacht geht auch `ZEIGE DATEIEN` und `LADE SPIEL`.
- **Tastenmodus** (laufende Programme): jede Taste geht sofort an das Programm.
  `Esc` = RUN/STOP, `^` oder `` ` `` = C64-Taste `←`. Die C64-Tastenleiste ist wie eine Tastatur angeordnet und auch mobil per Touch bedienbar.

### Klick / Touch

Gegenstände am illustrierten Schreibtisch sind anklickbar und per Tab erreichbar. Die Detailansicht bietet
Schaltflächen, die jeweils genau einen Textbefehl auslösen (Tooltip zeigt ihn). Auf Smartphones schalten Tabs
zwischen Schreibtisch und C64; die Adventure-Eingabe bleibt sichtbar.

### Einstellungen

Ton an/aus und Lautstärke, reduzierte Bewegung (folgt standardmäßig `prefers-reduced-motion`), CRT-Effekt,
Textgröße, hoher Kontrast. Alle Geräusche haben Texteinblendungen – das Spiel ist stumm vollständig lösbar.

### Spielstände

Autosave nach jedem Befehl und bei Meilensteinen (Slot „Auto“), drei manuelle Slots. Alles liegt lokal im Browser (IndexedDB; alte `localStorage`-Stände werden beim Start übernommen).

## Lösungsweg des Ausschnitts (Spoiler)

<details><summary>aufklappen</summary>

1. `NIMM HÖRER`, mit Ralf reden, `LEGE AUF`, `WARTE` → Ralf bringt die Diskette und muss zum Training.
2. `LEGE DISKETTE INS LAUFWERK`, `SCHALTE COMPUTER EIN`; am C64 `LOAD"*",8` + `RUN`.
3. Im Intro mit RETURN bis zu den Credits; dort `←` drücken → „MODUL K“ verlangt Diskette 2.
4. `J` (eingeschränkter Betrieb), `1` → „Ersatzwahl: siehe LADER“. Modul verlassen (`RUN/STOP`, `4`).
5. `LOAD"LADER",8` + `LIST` → `910 DATA 52,49,57,55,51`. Päckchen öffnen, `LIES TABELLE` → 48 = „0“ … → **41973**.
6. Modul erneut starten, `1`; im Adventure `WÄHLE 41973`, `LEGE HÖRER IN DEN KOPPLER`; am C64 RETURN.
7. Nachrichten lesen (`1`, `1`, `2`), abmelden (`4`), `LEGE AUF` → Ende des Ausschnitts.

Optional: Diskette `1001` aus der Schublade → Demo INTRUDER (acht Teile, Leertaste = weiter, `1`–`8` = direkt, `DEL` = zurück, über zwei Minuten Musik); Archivdiskette → Jans Archivprogramm.

Das Spiel auf Ralfs Diskette (FERNHANDEL) ist spielbar: Im Intro startet die **Leertaste** eine kleine Handelssimulation (30 Tage, fünf Städte, fünf Waren, Kredit, Telex-Aufträge, Lagerausbau). Tasten: `1`–`5` Ware, `B`/`V` kaufen/verkaufen, `M`/`A` maximal kaufen/alles verkaufen, `R` + Ziffer reisen, `L` Auftrag liefern, `K`/`T` Kredit/Tilgung, `U` Lagerausbau, `H` Hilfe, `I` zurück zum Intro. Der Pfeil-Hinweis in den Credits (Taste `←`) bleibt unverändert.

**Grafikstil des Schreibtischs:** Der Schreibtisch ist eine Pixelszene (384×216 Pixel, 32 Farben, ganzzahlig skaliert, harte Kanten); es gibt keinen zweiten, realistischen Stil mehr. Der C64-Bildschirm daneben ist eine eigene Simulation mit 16 Farben (siehe oben).

**Offline und Barrierefreiheit:** Im Produktionsbau lässt sich das Spiel als App installieren und offline spielen (Manifest + Service Worker). Ein automatisierter axe-Test (WCAG 2 A/AA) läuft in der Playwright-Suite. Siehe `docs/QA_UND_RECHTE.md`.

Nebenspur Mailbox: `LIES KLEINANZEIGEN` → BIT-SCHUPPEN GT (ab 18 Uhr). Archivdiskette einlegen, `LOAD"TERMINAL",8` +
`RUN`, `WÄHLE 23586`, Hörer in den Koppler, RETURN, eigenen Namen eingeben, `J`. Nach der Freischaltung (später erneut
anrufen) gibt es Post, Downloads und die Mailboxliste mit dem nächtlichen DATENKELLER.
Optional (Zeitvertreib): die Cracker-Boxen FLUX-HQ und STARDUST mit Chat und BASIC-Demoeffekten, siehe `docs/STORY_CRACKER.md`.

Nach dem Ausschnitt laufen die Tage als Alltag weiter: `SCHLAFE` ab 21 Uhr, Schule montags bis samstags, Abendbrot,
Taschengeld am Samstag und sonntags die Abrechnung des Gebührenzählers. Ralf ist nach seinem Wochenplan erreichbar
(`RUFE RALF AN`) und ruft sonst zurück; der Computerclub schickt einen Rundbrief (`GEHE ZUM CLUB` am Donnerstag).

Schlüssel-Strang (Diskette 2 rekonstruieren):

1. Im LADER ist Zeile 70 scheinbar leer: `LOAD"LADER",8`, `POKE 53281,0`, `LIST` → **Teil 1: 7302** (Tipp: `LIES
LESERTIPPS` in der Zeitschrift).
2. Ab Montag, 17.11., steht im Netz die Meldung „SCHLUESSELWECHSEL“ → **Teil 2: 1958**.
3. Mittwoch, 19.11., 15 Uhr bringt Ralf eine Kassette. `LEGE KASSETTE IN DATASETTE`, am C64 `LOAD` und `RUN` →
   **Teil 3: 4426**.
4. Modul starten, `3`, `730219584426` + RETURN, einwählen, Rundschreiben von K-01 lesen → Klartext. Expertenweg: im
   Rundschreiben `S` (Rohdaten auf die Archivdiskette) und mit `OPEN`/`INPUT#` selbst entschlüsseln.

BTX: `LIES RUNDBRIEF` (Samstag) verrät das Leihset und die Nummer der Clubtafel. `GEHE ZUM CLUB` (Donnerstag
18:30–19:30), dann `SCHALTE COMPUTER AUS`, `STECKE BTX-SET IN DEN C64`, `SCHALTE COMPUTER EIN` → Decoder startet,
RETURN verbindet. Seiten mit Ziffern oder `*Nummer#`; die Clubtafel liegt unter der Nummer aus dem Rundbrief.

Vorsicht im geheimen Netz: Wer sich immer wieder mit der Testkennung anmeldet oder lange online bleibt, fällt auf.
Das Spiel kündigt Folgen deutlich an (Systemnachrichten, Sperre, eine letzte Warnung), bevor es vorbei ist; nach einem
Spielende lässt sich der letzte Schritt zurücknehmen.

</details>

## Playtest-Protokoll

Eingaben, die das Spiel nicht versteht, merkt es sich lokal im Browser (nie gesendet; abschaltbar im Menü). Zum
Auswerten: `?dev=1`, Entwicklerkonsole → Tab „Parser“ → „Kopieren“. Daraus entstehen neue Vokabeln und Fälle in
`src/tests/parserCorpus.test.ts`.

## Entwicklerkonsole

Nur im Entwicklungsbuild (`npm run dev`) und in E2E-Tests (`VITE_DEV_TOOLS=1`); der Produktionsbuild (`npm run build`/`serve`) enthält die Konsole nicht und verschleiert den Spielcode (`vite.config.ts`). `http://…/?dev=1` blendet oben mittig einen **DEV**-Knopf ein (für die Browser-Sitzung; `?dev=0` schaltet ab):
Fakten/Flags/Rätsel/Gegenstände setzen, Zeit vorspulen, Ereignisse auslösen, Meilenstein-Spielstände laden
(„Geheimer Modus“, „Online“, „Ende des Ausschnitts“ …) und den Ereignis-/Rätselgraph prüfen. `hilfe` in der
Konsole listet alle Befehle. Eingriffe werden im Debug-Log des Spielstands markiert.

## Code-Graph für Claude Code (graphify)

Damit Claude Code beim Arbeiten am Code weniger Dateien roh lesen muss, ist
[graphify](https://github.com/Graphify-Labs/graphify) projektbezogen eingebunden (`CLAUDE.md`, `.claude/`).
Der Graph wird lokal aus dem Syntaxbaum erzeugt – ohne LLM, ohne API-Kosten – und ist nicht eingecheckt:

```bash
uv tool install graphifyy   # einmalig (Befehl heißt graphify)
graphify update .           # Graph nach graphify-out/ bauen bzw. aktualisieren (~3 s)
graphify hook install       # optional: bei Commit/Checkout automatisch aktualisieren
```

## Dokumentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – Engine, Parser, C64-Teilmenge, Events, Speicherformat
- [`docs/STORY_DECISIONS.md`](docs/STORY_DECISIONS.md) – im Storyworkshop getroffene Entscheidungen (enthält Spoiler)
- [`docs/STORY_OPEN_QUESTIONS.md`](docs/STORY_OPEN_QUESTIONS.md) – was innerhalb dieser Entscheidungen noch offen ist
- [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md) – priorisierter Ausbauplan und Abschlussprotokoll

## Rechte und Fiktion

Alle Grafiken sind eigene SVG-/Canvas-Platzhalter, alle Klänge werden zur Laufzeit synthetisiert (keine Samples, keine
SID-Originale). Schrift: „Press Start 2P“ (SIL Open Font License, via `@fontsource`). Geheimdienstaktivitäten
betreffen ausschließlich erfundene Personen und Netze; reale Firmen und Orte dienen nur als historisches Umfeld.
Telefonnummern sind fiktiv und werden niemals real gewählt.

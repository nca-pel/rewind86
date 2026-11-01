# Qualitätssicherung, Rechte und historische Prüfung (Stand: Abschluss des Ausschnitts)

## Rechte und Herkunft der Inhalte

| Bereich                      | Stand                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ROM-Dateien, Fremdressourcen | Keine. Zeichensatz, Töne, Musik, Grafiken, Texte und BASIC-Interpreter sind eigene Arbeiten (`src/c64/charset.ts` wurde aus Regeln neu gezeichnet).                                                                                                                                            |
| Musik und Klänge             | Eigene Synthese zur Laufzeit (`src/audio/*`); keine Samples, keine Übernahme von SID-Stücken.                                                                                                                                                                                                  |
| Radio und Telefon            | Telefonklingel physikalisch nachgebildet (`audio/bell.ts`, zwei Glockenschalen, 25-Hz-Rufstrom, 1 s an/4 s aus). Radiosongs regelbasiert selbst komponiert (`audio/popSongs.ts`). Stimmen über die Sprachausgabe des Browsers (Web Speech API); ohne Sprachausgabe läuft nur die Sendezeit ab. |
| Grafik                       | Eigene Zeichnungen: Pixel-Schreibtisch (`DeskPixel.tsx`), realistischer Schreibtisch (`Desk.tsx`), Gerätebilder (`DeviceArt.tsx`), Demo-Zeichner.                                                                                                                                              |
| Schrift                      | Press Start 2P (SIL Open Font License) über `@fontsource`; Lizenz liegt im Paket.                                                                                                                                                                                                              |
| Markennamen                  | Einschaltmeldung und Gerätebezeichnungen nur im Bootprofil `authentic` (`src/c64/boot.ts`); Profil `neutral` ohne Marken (`VITE_C64_BOOT_PROFILE=neutral`).                                                                                                                                    |
| Personen, Firmen, Gruppen    | Fiktiv (Demo-Gruppen, Mailboxen, Computerclub, Heimcomputer-Journal, Filmplakat „SPACE RIDERS“). Reale Orte nur als Umfeld.                                                                                                                                                                    |
| Telefonnummern, BTX-Nummern  | Fiktive fünfstellige Ortsnummern, nie mit Vorwahl genannt; Btx-Zugang `190` ist historisch (Dienst 2001 eingestellt). Es wird nichts real gewählt.                                                                                                                                             |
| Filmanspielungen             | Reale Titel, nur genannt (keine Zitate, Bilder, Musik): „WarGames“, „Der Name der Rose“, „Zurück in die Zukunft“. Titelnennung gilt als unkritisch; vor Veröffentlichung juristisch bestätigen.                                                                                                |

**Easter-Egg-Video:** `LOAD"ABANDON",8,1` bettet ein YouTube-Video ein (`youtube-nocookie.com`, nur beim Aufruf
geladen, keine sonstigen externen Inhalte). Das Video wird nicht kopiert, nur eingebettet; die Rechte liegen bei den
Urhebern bzw. YouTube. Vor einer Veröffentlichung im Datenschutzhinweis erwähnen (Verbindung zu YouTube/Google).

**Credits und Disclaimer:** Über „Credits“ (Titelbildschirm und Spielmenü) erreichbar, `src/ui/Credits.tsx`:
Game-Designer Peter Elbracht; Coder, FX-Artist, Gfx-Artist Claude Code; dazu der Hinweis zu Filmtiteln, Produktnamen
und Marken (historische Einordnung, Rechte bei den Inhabern, keine Verbindung). E2E-Test: `e2e/credits.spec.ts`.

**Vor einer Veröffentlichung:** Entscheidung über das Bootprofil (`authentic` oder `neutral`), Rechtsprüfung der Markennennung und der
Ortsnamen, Prüfung, ob fiktive Nummern/Kennungen unbeabsichtigt real wirken.

## Historische Prüfung (`needs_research`)

Nicht belegt, bewusst als Spielökonomie bzw. Annahme gekennzeichnet:

Recherchiert am 01.11.2026 (Quellen in `STORY_DECISIONS.md`, Abschnitt „Recherche“):

- **Telefongebühren:** 0,23 DM je Einheit und 8-Minuten-Takt im Ortsnetz seit 1980 sind mehrfach belegt (`plausible`).
  Der Takt außerhalb der Hauptzeit (12 oder 16 Minuten) ist strittig; das Spiel rechnet vereinfacht immer mit 8.
- **BTX:** Grundgebühr 8 DM/Monat, Seitenpreise 1 Pf bis 9,99 DM, 1200/75 Baud, Zugangsnummer 190 – umgesetzt.
  Offen: CEPT-Mosaik (nur Text dargestellt).
- **Radio:** Die Infowelle bringt an 14., 17., 18., 19. und 21.11. Meldungen, die für den Tag belegt oder sehr
  plausibel sind (Reagan/Iran, Kronzeugenregelung, Mord an Georges Besse erst ab 21 Uhr, Buß- und Bettag); sonst Regionales.
  Hörbar: Die Infowelle liest zur Spielzeit höchstens zehn Meldungen (inkl. Wetter) vor, dann 60 s Pause
  (`newsBulletin` in `content/radio.ts`). Popwelle: fünf eigene Songs (≈10 Min.). BFBS: vier englische Ansagen mit
  je einem Song fiktiver Bands (≈9–10 Min.). Alles in Schleife, über einen „Kofferradio“-Filter mit leisem Rauschen.
- **Feiertage:** 16.11.1986 Volkstrauertag (vorher fälschlich Totensonntag), 19.11. Buß- und Bettag.

Weiter offen:

- Ob ein Anschluss 1986 über die Bundespost ermittelbar war (Grundlage der Entdeckungslogik; als plausibel angenommen).
- Technische Details der 1541, Datasette und des Kommandokanals sind vereinfacht, aber im Verhalten an das Original angelehnt.

## Barrierefreiheit

- Automatisiert: `e2e/a11y.spec.ts` prüft Titel, Schreibtisch (Pixel und realistisch) und Menü mit axe-core gegen WCAG 2 A/AA, ohne Befunde.
- Bedienung: jede Aktion per Textbefehl; Schreibtischobjekte per Tastatur (Tab, Enter/Leertaste) und Klick; Schaltflächen der Detailansicht
  entsprechen Textbefehlen; Ton-Ereignisse haben Textentsprechungen; Demo mit Untertiteln und Effektbeschreibungen.
- Einstellungen: Textgröße, hoher Kontrast, reduzierte Bewegung, CRT-Effekt aus, Ton aus.
- **Noch nicht geprüft:** Test mit echten Screenreadern (NVDA, VoiceOver, TalkBack) und auf echten Geräten. Das braucht Menschen und Hardware.

## Spielstände und Datenschutz

IndexedDB im Browser (Rückfall `localStorage`), Export/Import als Datei. Kein Server, kein Login, keine Übertragung; das Playtest-Protokoll bleibt lokal
und ist abschaltbar.

## Offline (PWA)

`manifest.webmanifest`, `icon.svg` und `sw.js` (Cache nach erstem Besuch, nur Produktionsbau). Spielstände sind vom Cache unabhängig.

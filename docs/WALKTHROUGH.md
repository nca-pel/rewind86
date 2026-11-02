# Walkthrough – REWIND 1986 (Normalmodus)

Spielerführung vom Start (Fr 14.11.1986, 16:00) bis zum Finale (Fr 21.11., 23:30). Stand: abgeleitet aus den Rätsel-Hinweisen
(`src/content/puzzles.ts`), den Ereignissen (`events.ts`) und einem Durchlauf über die Oberfläche (Playwright). Zeilen mit
**[geprüft]** wurden im Durchlauf bestätigt, **[geprüft]** sind noch nicht über die UI nachgespielt.

Bedienung: Adventure-Zeile (Verben) und C64-Zeile werden mit dem `>`-Knopf bzw. `Alt+C` umgeschaltet. Im C64-Modus schickt `!` eine
Zeile ans Adventure. Programme im »Tastenmodus« bekommen jede Taste einzeln (Escape = RUN/STOP, Backspace = ←).

## Freitag 14.11. (Prolog)

| Zeit     | Aktion                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16:00    | `NIMM HÖRER` (Telefon klingelt), `FRAGE RALF NACH DEM SPIEL`, `LEGE AUF`, `WARTE 15` – Ralf bringt die Diskette. **[geprüft]**                                                                                                                                            |
| 16:20    | `SCHALTE COMPUTER EIN`, `!LEGE RALFS DISKETTE INS LAUFWERK`. Das Intro von FERNHANDEL startet. **[geprüft]** (P01)                                                                                                                                                        |
|          | In den Credits (RETURN auf dem Titelbild) die Taste **←** (Backspace) drücken → MODUL K. **[geprüft]**, Fenster ca. 7 s (P03)                                                                                                                                             |
|          | MODUL K fragt nach Diskette 2 → `J` (eingeschränkter Betrieb K-17). Menü 1 nennt die Ersatzwahl »siehe LADER«                                                                                                                                                             |
|          | LADER: `LOAD"LADER",8`, `POKE 53281,1` (Hintergrund auf Weiß/andere Farbe, Hinweis steht in den LESERTIPPS), `LIST` → versteckte Zeile 70 mit Schlüsselteil 1 `7302` und `DATA 52,49,57,55,51` = **41973** (Zeichentabelle im Journal) (P04, P08a)                        |
|          | Telefon: `NIMM HÖRER`, `WÄHLE 41973`, `LEGE HÖRER IN DEN KOPPLER`, im Modul 1 → RETURN. Nachrichten 1 + 2 lesen, Abmelden (P05, P06). **[geprüft]**                                                                                                                       |
|          | `LEGE AUF` – Prolog endet, `WEITERSPIELEN`. **[geprüft]**                                                                                                                                                                                                                 |
| ab 18:00 | Journal lesen (`LIES KLEINANZEIGEN`): BIT-SCHUPPEN GT **23586**. Archivdiskette aus der Schublade (`ÖFFNE SCHUBLADE`, `NIMM ARCHIVDISKETTE`), in die 1541 legen. `LOAD"TERMINAL",8`, `RUN`, wählen, als `JAN` registrieren (`J`). Brett CLUB lesen (GHOST). **[geprüft]** |
| 18:50    | Abendessen (automatisch)                                                                                                                                                                                                                                                  |
| ab 21:00 | `SCHLAFE`                                                                                                                                                                                                                                                                 |

## Samstag 15.11.

- Schule bis 12 Uhr läuft automatisch. 10:30 Post (Rundbrief des Computerclubs: Clubabend Do 20.11. 19 Uhr, BTX-Seite `*123770#`). 12:30 Taschengeld 10 DM. **[geprüft]**
- ~19:00 Freischaltung BIT-SCHUPPEN: Postfach, Mailboxliste → DATENKELLER **38104** (nur 22–06 Uhr). **[geprüft]**
- Ralf anrufen (47112): `RUFE RALF AN` (Sa nach 12:30; Di/Do/Fr erst ab 18:45, Training 16:30–18:30). **[geprüft]**

## Sonntag 16.11.

- Zählerstand wird abgelesen (Vater); Telefonkosten im Blick behalten (0,23 DM/Einheit). **[geprüft]**

## Montag 17.11. – Dienstag 18.11.

- Schule 07:15–13:30. Ab Mo 08:00 liegt im KNOTEN WEST die Meldung **SCHLUESSELWECHSEL** (Schlüsselteil 2 `1958`) (P07). Nur mit Modul K / 41973 lesen.
- DATENKELLER ab 22 Uhr: Gerüchte über K-01 (ab Di 22:00). Ralf trainiert Di/Do/Fr 16:30. **[geprüft]**

## Mittwoch 19.11. (Buß- und Bettag, schulfrei)

- 15:00 Ralf bringt die Kassette »WT-07 PRÜFBAND 3«; er sagt: »Du hast doch noch eine Datasette, oder?« – Jan findet sie hinter dem Monitor. `LEGE KASSETTE IN DATASETTE`, am C64 `LOAD` / `RUN` → Schlüsselteil 3 `4426` (Reihenfolge Teil1-Teil2-Teil3 = `7302 1958 4426`). **[geprüft]**
- MODUL K, Menü 3: zwölf Ziffern `730219584426`, RETURN. Dann Rundschreiben im KNOTEN WEST lesen → Klartext »AN ALLE STOP OPERATION REWIND BEGINNT FREITAG …« (P09). **[geprüft]**

## Donnerstag 20.11.

- 16:30 Ralf beim Training. **18:30–19:30: `GEHE ZUM CLUB`** (nicht mit `WARTE 30` durchrutschen!). Brandt (»Fürwahr«, »Weiter so«), BTX-Set wird verliehen. Rückkehr ~21:45 (P10, P17). **[geprüft]**
- Danach BIT-SCHUPPEN, Brett CLUB: neuer Beitrag von GHOST. `RUFE RALF AN`, `FRAGE RALF NACH GHOST`. Im Modul 2 (Senden): QUITTUNG, dann ANFRAGE TREFFPUNKT, später Antwort lesen: **Freitag 23:30, Raststätte GT, Parkplatz Nord, Stichwort REWIND**. **[geprüft]**

## Freitag 21.11. (Finale)

- Ab 20:00 läuft die Operation (`ev_finale_open`). Seidel ruft zwischen 21:00 und 22:15 an. Ralf erreichbar bis 21:30.
- Optionen: WÄHLE 110 (mit Beweisen → `end_exposed`), GHOST schreiben (`end_cover`), Ralf (`end_ralf_stops` / `end_ralf_betrayal`), Warnung an K-01 im Modul (`end_abort`), nichts tun (`end_silent`). **[geprüft]**

---

_Weitere Abschnitte (Beobachtungen, Spielzeit, Fehler) siehe `docs/PLAYTEST_REPORT.md`._

## Hinweise aus dem Durchlauf

- Der Ersatzschlüssel (`730219584426`) wird nach der ersten Eingabe gespeichert und beim Neustart des Moduls wiederhergestellt.
- Fr 19:30: Modul → 2 (Senden) → 1 QUITTUNG, dann 2 ANFRAGE; nach ~5 Minuten erneut einwählen und »RE: TREFFPUNKT« lesen.
- Finale: Ende `end_exposed` ist über `WÄHLE 110` nach Rundschreiben + Antwort aus dem Netz + Ralfs Hinweis erreichbar.
- Seidels Anruf (Fr 21:00–22:15): bei Klingeln sofort `NIMM HÖRER`, nicht vorspulen.
- Der BTX-Strang (P17) und die übrigen Enden wurden in diesem Durchlauf nicht gespielt.

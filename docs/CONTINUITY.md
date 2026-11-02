# Continuity-Prüfung: Handlungsstrang und Leerlauf

Prüfgrundlage: alle Zeitereignisse (`src/content/events.ts`), zeitgesteuerten Mailbox-Beiträge (`networks.ts`), Ralfs
Wochenplan (`config.ts`) und die Rätselreihenfolge (`puzzles.ts`). Maßstab: Zu jeder Tageszeit, in der Jan frei handeln
kann, soll ein Ziel, eine Figur oder eine Frage offen sein. Leerlauf = mehr als drei Stunden ohne Auslöser, Rätsel
oder Figurenkontakt.

## Befund (vorher)

| Tag       | Pflicht-/Zeitereignisse                                      | Leerlauf                                                                     |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Fr 14.11. | Anruf Ralf 16:00, Vater 18:00, Abendbrot, Mailbox            | **18:00–21:00** (bereits mit CODE-KNACKER gefüllt)                           |
| Sa 15.11. | Post 10:30, Geld 12:30, Ralf 13:00, BBS-Freischaltung ~19:00 | **13:30–19:00** (Nachmittag ohne Auslöser)                                   |
| So 16.11. | Zählerstand 19:00, GHOST-Beitrag 20:00                       | **fast der ganze Tag**                                                       |
| Mo 17.11. | Systemmeldung 08:00 (P07)                                    | **14:15–22:00** (nach P07 kein Ziel)                                         |
| Di 18.11. | DATENKELLER-Gerücht 22:00                                    | **ganzer Tag**, Ralfs Karton-Hinweis fehlt (Kassette kommt »aus dem Nichts«) |
| Mi 19.11. | Kassette 15:00 (P08c), Rundschreiben (P09)                   | **Vormittag bis 15:00**                                                      |
| Do 20.11. | Clubabend 19:00 (P10, P17)                                   | Tagsüber nur Schule, kein Hinweis auf den Abend                              |
| Fr 21.11. | Finale 20:00                                                 | **Nachmittag 14:00–20:00** ohne Vorbereitung                                 |

Die Handlung selbst ist durchgehend (Modul → Schlüssel → Rundschreiben → Club → Finale), aber die Wege zwischen den
Meilensteinen waren leer. Besonders auffällig: Ralf tritt zwischen Fr und Mi nur auf Anruf auf, die Kassette erscheint
ohne Vorwarnung, und das Finale kommt ohne Ankündigung am Freitagnachmittag.

## Neue Handlungsfäden

| Faden                   | Tag/Zeit          | Inhalt                                                                                                                                  | Wirkung                                             |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| CODE-KNACKER (P18)      | Fr abend          | Listing im Journal, am C64 abtippen, Ratespiel                                                                                          | optional; stimmt auf Schlüsselsuche ein             |
| Spielabend nach Spiel   | Sa 17:45          | Ralf ruft nach dem Fußballspiel an. Seidel war nicht beim Spiel, er ist samstags ins Büro gefahren (Fakt `seidel_saturday_office`).     | Verdachtsstrang, gute Dichte am Samstag             |
| Zwei Händler            | So 12:30–18:20    | Sonntagsbraten (Volkstrauertag), Ralfs Flüsteranruf 14:30, Besuch 15:45, Spielrunde mit Gesprächen, Wertung, Abschied 18:20             | Beziehung, Entscheidung »Ralf einweihen?«, Hinweise |
| Telex und Fünfergruppen | So (im Besuch)    | Ralf erkennt die Kölner Telexnummer aus FERNHANDEL, hörte Seidel nachts Zahlen in Fünfergruppen vorlesen (`ralf_telex`, `ralf_numbers`) | Brücke zum Rundschreiben (Fünfergruppen)            |
| Der Karton              | Di 20:00          | Ralf erzählt, dass Seidel sein Arbeitszimmer ausmistet und ein Karton mit Kassetten im Flur steht (`ralf_box`)                          | Erklärt die Kassette vom Mittwoch                   |
| Feiertag                | Mi 09:30          | Buß- und Bettag zu Hause: Vater, Radiopredigt, Mutter backt. Jan sortiert den Schlüssel.                                                | Füllt den Vormittag mit Figuren und Ziel            |
| Clubabend ankündigen    | Do ab 08:00       | ANDI im BIT-SCHUPPEN: »Heute Abend Clubabend, BTX-Set«                                                                                  | Do bekommt einen Tagesziel-Hinweis                  |
| Das Netz schließt       | Fr ab 12:00       | SYSTEM im KNOTEN WEST: Testzugänge werden um 20:00 gesperrt, Anschluss bleibt bis 23:30 offen (`net_shutdown`)                          | Countdown, erklärt das Finale schon vorab           |
| Sturmwarnung            | Fr ab 14:00/17:30 | GHOST warnt im BIT-SCHUPPEN, MOLE meldet im DATENKELLER die Sperre, Jan denkt an den Sturm                                              | Spannung vor 20:00                                  |

## Zeitplan (nachher)

| Tag       | Tagesziel / Hauptfaden                                                                           |
| --------- | ------------------------------------------------------------------------------------------------ |
| Fr 14.11. | Prolog (P01–P06), BBS, CODE-KNACKER (19:30–21:00)                                                |
| Sa 15.11. | Post, Taschengeld, Ralf (13:00), Spielergebnis (17:45), BIT-SCHUPPEN-Freischaltung (~19:00)      |
| So 16.11. | Sonntagsbraten, Ralfs Anruf 14:30, **Besuch 15:45–18:20**, Abendbrot, Zählerstand, GHOST-Beitrag |
| Mo 17.11. | Systemmeldung (P07), Mailbox-Diskussion über KNOTEN WEST                                         |
| Di 18.11. | Mathe-Klausur, DATENKELLER-Gerücht, **Ralfs Anruf 20:00 (Karton)**                               |
| Mi 19.11. | **Feiertags-Morgen**, Kassette 15:00 (P08c), Schlüssel, Rundschreiben (P09)                      |
| Do 20.11. | **Hinweis im BBS**, Clubabend 19:00 (P10, P17)                                                   |
| Fr 21.11. | **Netz schließt 20:00**, Sturmwarnung, Finale                                                    |

## Bleibende Lücken

- Montagabend und Mittwochabend sind weiter eher frei. Hier trägt der Spieler den Faden selbst (Schlüssel
  zusammensetzen, Rundschreiben lesen, FERNHANDEL, DATENKELLER). Sinnvolle Ergänzungen: ein Mailwechsel mit MOLE,
  ein zweiter Besuch Ralfs am Mittwochabend.
- Die Sonntagsrunde ist als erzählte Runde gebaut. Ein eigenes Bild (Ralf neben Jan) fehlt.
- Seidels Anruf am Freitag bleibt leicht zu verpassen (siehe `PLAYTEST_REPORT.md`).

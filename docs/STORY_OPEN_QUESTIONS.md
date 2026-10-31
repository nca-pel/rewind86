# Offene Storyfragen

Die 14 offenen Punkte aus GDD §22 wurden im Storydesign-Workshop am 31.10.2026 entschieden – siehe
[`STORY_DECISIONS.md`](STORY_DECISIONS.md). Hier steht nur noch, was **innerhalb** dieser Entscheidungen offen ist
und erst beim Schreiben der jeweiligen Akte konkretisiert wird.

| Thema               | Entschieden                                   | Noch offen (wird mit dem Akt ausgearbeitet)                                                                       |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| GHOST               | Computerclub-Betreuer, erkennt Jan spät       | Name, Auftreten im Club, persönliches Motiv im Detail, welcher Fehler Jans die Kennung verrät, Indizienkette      |
| Operation REWIND    | Fr. 21.11.1986, Fernmeldesoftware, K-01, Netz | Zeitplan der Woche, wer K-01 ist, Ablauf des Finales, Bedingungen der 3–5 Enden                                   |
| Diskette 2          | 3 Fragmente, Ersatzschlüssel im Modul         | Ob/wann Jan die echte Diskette 2 sieht; was das Modul mit echtem Schlüssel zusätzlich kann (Senden?)              |
| FERNHANDEL          | Wirtschaftssimulation, Taste `←` bleibt       | Intro-Grafik, Inhalt des Spielteils (bisher „nicht enthalten“)                                                    |
| Computerclub        | BIT-SCHUPPEN ist die Club-Mailbox             | Wo/wann der Club stattfindet und wie Jan dort ohne freie Erkundung Kontakt hat (GDD: Jan bleibt im Zimmer)        |
| Systemnachrichten   | –                                             | Ob Seidel selbst hinter „PROTOKOLLIERUNG“/„LETZTE WARNUNG“ steht (naheliegend, da er die Infrastruktur betreut)   |
| Filme               | 3–4 Anspielungen mit Rätselbezug              | Welche Filme, welche Rätsel; Rechteprüfung                                                                        |
| Datasette           | Prüfband 3 mit Schlüsselteil 3                | Weitere Kassetten, Speichern auf Band                                                                             |
| Historische Prüfung | –                                             | Ob ein Anschluss 1986 über die Bundespost ermittelbar war (`needs_research`); Tarife; fiktive Nummern (GDD §20.4) |

## Weitere im Ausschnitt getroffene Annahmen (bitte prüfen)

Diese Punkte waren für einen spielbaren Ausschnitt nötig. Sie sind bewusst klein gehalten und leicht änderbar:

- **Inhalt des ersten Rätsels:** Die „Ersatzwahl“-Nummer steht als PETSCII-Codes in einer DATA-Zeile des BASIC-Laders
  (`910 DATA 52,49,57,55,51` → `41973`). Lösbar über die Zeichentabelle im Heimcomputer-Journal oder per eigenem
  BASIC-Programm. (`content/disks.ts`)
- **Vorprovisionierte Testkennung** auf Diskette 1 (GDD §8.4 als Vorschlag): Systemnachricht „Kennung wurde mit
  Arbeitskopie WT-07 ausgeliefert“ dient als „identifizierbare Alltagsspur“. Formulierung und Konsequenz sind offen.
- **„M.S.“ in den Credits** als Programmiererkürzel – passt zu Seidel als Entwickler des Moduls (GDD §3.3). Der
  Notizblock nennt nur das Kürzel; die Verbindung zu Seidel muss der Spieler selbst ziehen.
- **Elternereignisse:** Mutter hört beim ersten Online-Gang das Modem in der Leitung; Vater kommt 18:00 heim und will
  18:30 telefonieren (Varianten je nach Leitungszustand). „Tante Gisela“ und „Oma“ sind beiläufige Erwähnungen.
- **Ralf** ruft um 16:00 an, ist ca. 12 Minuten nach dem Auflegen an der Tür; Rückrufe bei Ralf führen im Ausschnitt
  ins Leere (Training).
- **Tarife:** 0,23 DM pro Einheit, 8 Minuten pro Ortseinheit – vereinfachte Spielökonomie, `needs_research`.
- **Fiktive Telefonnummern** `47112` (Ralf) und `41973` (Mailbox). Vor einer Veröffentlichung prüfen, ob ein realer
  Anschein entstehen könnte (GDD §20.4).
- **Radiosender:** fiktive Popwelle und Infowelle, dazu BFBS (real, als Umfeld plausibel). Der Starttag steht jetzt
  fest (14.11.1986); echte Nachrichtenmeldungen nur nach historischer Prüfung.
- **Heimcomputer-Journal** ist eine fiktive Zeitschrift.
- **Reguläre Mailboxen** `BIT-SCHUPPEN GT` (Sysop ANDI, 18–24 Uhr, Tel. `23586`) und `DATENKELLER` (Sysop MOLE,
  22–6 Uhr, Tel. `38104`). Storyrolle entschieden (Club-Mailbox mit GHOST-Spuren bzw. Gerüchte), Inhalte dafür folgen
  mit Akt 2; bisher Stimmungsbilder und zwei Download-Programme. Namen ANDI/MOLE sind weiterhin Arbeitsnamen. Nummern
  vor Veröffentlichung prüfen (GDD §20.4).
- **Terminalprogramm** `TERMINAL` liegt auf Jans Archivdiskette – plausibel, weil Jan bereits einen Koppler besitzt.
- **Freischaltung** neuer Benutzer nach 30 bzw. 60 Spielminuten, ohne Passwortabfrage (Vereinfachung).
- **Verdachtswerte:** Riskantes Verhalten im geheimen Netz erhöht `seidelSuspicion` (Anmeldung +3, je 5 Online-Minuten
  +1, Sendeversuch +2, Lesen +1/+2). Schwellen 30/70/90/100 mit Symptomen: Systemnachricht „Protokollierung“,
  Sperre der Testkennung für 3 Stunden plus anonymer Anruf (bleibt eine offene Fährte), letzte Warnung, Spielende
  „Entdeckt“ (Seidel an der Tür). Die Zahlenwerte sind Spielbalance und frei justierbar. Der Verdacht sinkt bisher nie
  von selbst.
- **Tagesablauf:** Schule Mo–Fr 07:15–13:30, Sa bis 12:00 (Samstagsunterricht entschieden);
  Abendbrot 18:50; Weckzeiten 06:45/09:30; Taschengeld 10 DM pro Woche; Eltern zahlen 3 DM Telefon pro Woche, den
  Rest Jan; Ablesung des Gebührenzählers sonntags durch den Vater (privater Gebührenzähler war 1986 üblich,
  `needs_research`).
- **Ralfs Familie:** Am Telefon meldet sich die Familie mit „Seidel“ (Ralfs Mutter hat Seidel geheiratet); abends geht
  oft Seidel selbst ran. Ralfs Trainingstage Di/Do/Fr, Samstagnachmittag Spiel (Uhrzeiten angenommen). Schulnamen
  entschieden; ob die Schulen 1986 schon unter diesen Namen firmierten, ist `needs_research`.
- **Ralf vom versteckten Modus erzählen:** Vertrauen +5, aber Seidels Verdacht +8 (Ralf ist neugierig und kein
  guter Lügner). Ralf berichtet danach von einem abgeschlossenen Schrank in Seidels Arbeitszimmer.
- **Computerclub:** Rundbrief kommt Samstag mit der Post; Clubabend Do 20.11., 19 Uhr im Jugendzentrum (erzählter
  Zeitblock, Inhalte `TODO-STORY`, noch ohne GHOST-Indizien).
- **Ralfs Vertrauen / Netzglaubwürdigkeit:** Schwellen sind benannt (`trusting` 40, `close` 75; `established` 60),
  haben aber noch keine Symptome – Ralf kommt im Ausschnitt nur im Prolog vor, Senden im Netz fehlt.
- **Schlüssel-Strang:** Schlüssel `7302 1958 4426`; Meldung „Schlüsselwechsel“ ab Mo. 17.11. 08:00; Ralf bringt die
  Kassette Mi. 19.11. 15:00 (bei wenig Vertrauen gibt er sie nur unten ab). Das Modul prüft den Ersatzschlüssel
  nicht (es kennt ihn ja nicht) – erst der Klartext zeigt, ob er stimmt. Seidels Handle bleibt ungenannt; die
  fehlgeleitete Meldung kommt formal vom SYSTEM. Lesen der Meldung kostet wie jede andere +1 Verdacht.

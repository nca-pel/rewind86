# Sonntag, 16.11.1986 – »Zwei Händler«

Entwurf für den bisher leeren Sonntag. Er füllt den Tag mit einer Szene, die Figuren und Handlung vertieft, ohne
die Hauptlinie zu ändern. Grundlage: `docs/CHARAKTERE.md`, `docs/STORY_DECISIONS.md`, Ralfs Wochenplan
(`config.ts`, Sonntag 14:00–21:00 erreichbar, »am Sonntag müssen wir zu Oma«) und das Spiel FERNHANDEL.

## Idee in einem Satz

Ralf haut nach dem Kaffeetrinken bei seiner Oma ab, kommt unter dem Vorwand »Mathe lernen« zu Jan, und die beiden
spielen zum ersten Mal zusammen FERNHANDEL – bis Ralf etwas auffällt, das ihn an seinen Stiefvater erinnert.

## Warum das passt

- **Charakter Ralf:** locker, neugierig, wird still, sobald es um Seidel geht. Er lügt nicht aus Bosheit, sondern aus
  Angst (»Ich sag, ich lern bei dir«). Er hat ein schlechtes Gewissen wegen der Diskette. Das alles lässt sich zeigen,
  ohne dass Ralf etwas weiß.
- **Handlung:** Die Szene ist die einzige Gelegenheit vor Mittwoch, bei der Jan Ralf **persönlich** trifft. Dort
  fällt die Entscheidung »Ralf einweihen oder nicht«, die bisher nur nebenbei am Telefon möglich war. Sie wirkt auf
  `ralfTrust` und `seidelSuspicion` und damit auf die Kassettenübergabe am Mittwoch und auf das Finale.
- **Tempo:** Samstag ist Erkundung, Sonntag ist Beziehung, Montag bringt die erste Systemmeldung. Das ist eine
  ruhige Mitte vor dem Wochenbeginn.

## Ablauf

| Zeit  | Beat                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11:30 | Volkstrauertag. Mutter kommt aus der Kirche, Vater hört im Radio die Feierstunde und erzählt vom Großvater. Kurzer Charaktermoment, kein Zeitblock.                                                |
| 12:30 | Sonntagsbraten (Zeitblock, wie bisher beim Abendbrot).                                                                                                                                             |
| 14:30 | **Ralf ruft an** (aus dem Flur der Oma, flüsternd): »Kaffee und Kuchen, Tante und Politik. Ich hau ab und sag, ich lern Mathe bei dir. Mach den Computer schon mal an!« Jan hat jetzt ein Ziel.    |
| 15:45 | **Ralf kommt** (Fahrrad, Sporttasche mit einem Mathebuch obendrauf). Mutter bringt Kaffee und Marmorkuchen: »Mathe? Mit dem Computer?« – Ralf: »Handel ist angewandte Mathematik.« Mutter: »Soso.« |
| 16:00 | **Spielrunde.** Beide handeln abwechselnd in FERNHANDEL. Ralf ist ehrgeizig, will die höhere Wertung. Das Spiel ist die Bühne, die Gespräche sind der Inhalt.                                      |
| 18:20 | Ralfs Mutter ruft an (oder Seidel): Abendessen. Ralf geht, die Tür schließt hinter ihm. Das ist auch die Zeit, zu der Jan unten zum Abendbrot gerufen wird.                                        |

## Gespräche während der Runde (jede Frage 15 Minuten, höchstens sechs)

Wie am Clubabend ist Ralf eine Gesprächsfigur im Raum. Jan kann ihn nach Themen fragen (`FRAGE RALF NACH …`), den
Computer weiter benutzen und mit `VERABSCHIEDE DICH` den Besuch beenden.

1. **Das Spiel.** Ralf liest die Telexnummern der Aufträge und stutzt: »Die Kölner Nummer … die kenn ich. Die hat mein
   Alter auf einem Zettel.« (Fakt `ralf_telex`, ein stiller Beleg dafür, dass FERNHANDEL echte Verbindungen enthält.)
2. **Seidel.** Ralf erzählt, dass sein Stiefvater nachts telefoniert und Zahlen in Fünfergruppen vorliest. Er weiß nicht,
   warum, sagt es aber beiläufig (Fakt `ralf_numbers`). Das stimmt zu den Fünfergruppen von K-01 und wird für Jan erst
   später verständlich.
3. **Früher.** Erinnerung an die alte Nachbarschaft: Baumhaus, erster C64. Bindung, `ralfTrust` +5.
4. **Das Modul.** Jan kann das Geheimnis jetzt persönlich anvertrauen (bestehender Dialog `modul`). Wer es tut, steigert
   Ralfs Vertrauen und das Risiko, dass Seidel etwas bemerkt; wer schweigt, behält die Kontrolle, aber Ralf bleibt auf
   Distanz. Das ist die eigentliche Entscheidung des Tages.
5. **Die Diskette.** Ralf will wissen, ob sein Alter es merken würde. Er hat die Diskette ohne Erlaubnis kopiert. Jan
   kann ihn beruhigen oder die Gefahr betonen (`ralfTrust` ±).
6. **Wertung.** Die Runde endet mit einem Vergleich der Kassenstände. Wer gewonnen hat, ändert nur den Ton von Ralfs
   Abschied (Angeber oder gute Verlierer-Laune), nicht die Handlung.

## Verhalten (Prüfpunkte aus `CHARAKTERE.md`)

- Ralf klingt locker und umgangssprachlich (»Alter«, »Mensch«), redet erst über Fußball und Mathe-Klausur, dann über
  Seidel, und wird bei Druck still.
- Er verrät nichts absichtlich gegen Jan, kennt keine Details der Operation und benutzt keine Fachsprache.
- Die Mutter ist warm, bringt Essen, sagt kein Wort über Technik.
- Seidel taucht nicht auf. Wenn er anruft, ist er höflich und knapp (»Ralf ist bei dir? Schön. Bis halb sieben.«).

## Technische Umsetzung (Vorschlag)

- Neue Ereignisse: `ev_sun_ralf_call` (14:30), `ev_sun_ralf_arrive` (15:45), `ev_sun_ralf_end` (18:20), dazu ein
  Mittags- und ein Vormittagsereignis.
- Besuchszustand `flags.ralfVisit` (analog zu `atClub`): Gespräch im Raum, Ralf ist `ralfPresent`. Anders als im
  Club bleibt der C64 benutzbar, damit man wirklich zusammen spielen kann.
- Neue Fakten: `ralf_telex`, `ralf_numbers`, `sunday_played`.
- Neue Dialogeinträge für `ralf` mit Bedingung `ralfVisit`, vorrangig vor den Telefon-Einträgen.
- Regeln: Besuch nur, wenn Jan zu Hause und nicht am Telefon ist; sonst um 20 Minuten verschieben, ab 17:30 entfällt er
  und Ralf entschuldigt sich am Telefon. Bei sehr niedrigem Vertrauen kommt Ralf nicht, sondern ruft nur an.
- Bild: Ralf neben Jan am Schreibtisch. Dafür wäre ein neues Pixelbild wie beim Club nötig (Prompt auf Wunsch).

## Offene Entscheidungen

1. Soll Ralf die Fünfergruppen schon am Sonntag erwähnen (stärkerer Hinweis) oder erst später (weniger Spoiler)?
2. Soll FERNHANDEL zu zweit **wirklich** am Bildschirm gespielt werden (Ralf kommentiert nach Spieltagen) oder
   als erzählte Runde mit Gesprächen im Vordergrund (weniger Aufwand, robuster)?
3. Soll es ein eigenes Bild für den Besuch geben?

## Umgesetzt (Stand Continuity-Prüfung)

Entschieden wurde: Ralf erwähnt die Fünfergruppen schon am Sonntag, aber beiläufig und ohne Deutung; die Runde ist
erzählt (Gespräche im Vordergrund); kein eigenes Bild. Umsetzung: Ereignisse `ev_sun_lunch`, `ev_sun_ralf_call`,
`ev_sun_ralf_arrive`, `ev_sun_ralf_end`, Dialoge `RALF_VISIT` (`content/dialogue.ts`), Effekt `endRalfVisit`
(`engine/routine.ts`), Besuchszustand `flags.ralfVisit`. Siehe `docs/CONTINUITY.md`.

# Charaktere – Lebensläufe und Verhaltensmuster

Arbeitsgrundlage für Dialoge, Ereignisse und Konsistenzprüfungen. Quellen: `docs/STORY_DECISIONS.md` (Kanon),
GDD §3 und §9.3, `src/content/dialogue.ts`, `events.ts`, `networks.ts`, `endings.ts`. Bei Widerspruch gilt
`STORY_DECISIONS.md`. Das Spiel ist deutschsprachig, Westfalen 1986 (Rheda-Wiedenbrück / Gütersloh).

Prüfregel für Autoren und Tester: Jede Figur hat eine **Stimme** (wie sie spricht), **Motive**, **Tabus** (was sie
nie tut oder sagt) und einen **Zeitplan** (wann sie erreichbar ist). Zeilen im Spiel, die dagegen verstoßen, sind Fehler.

---

## 1. Jan Keller (Spielerfigur, 16)

**Lebenslauf.** Geboren 1970 in Wiedenbrück, einziges Kind. Ratsgymnasium Wiedenbrück, 10./11. Klasse, solide
Noten, in Mathe und Physik gut, in Sport mittelmäßig. Hat den C64 zu Weihnachten 1984 bekommen und seither BASIC
gelernt (Zeitschriften, Listings abtippen). Mitglied im Computerclub des Jugendzentrums seit dem Frühjahr, aber
eher stiller Zuhörer. Taschengeld 10 DM pro Woche; Telefon ist knapp (Rechnung!). Ralf kennt er seit der Grundschule,
heute gehen sie auf verschiedene Schulen.

**Verhalten.**

- Neugierig, gründlich, nicht mutig im Sinn von Draufgängertum: Er prüft erst, dann handelt er.
- Gedanken (`thought`) sind trocken, selbstironisch, kurze Sätze, manchmal ein Seufzer. Kein Pathos.
- Gegenüber Eltern höflich, ausweichend, nie lügend im großen Stil, eher »Nur Hausaufgaben.«
- Gegenüber Ralf locker, sarkastisch-freundschaftlich, wird ernst, wenn es um Ralfs Stiefvater geht.
- Hat Angst vor Ärger wegen Telefonkosten und davor, dass die Eltern den Computer wegnehmen.

**Tabus.** Prahlt nie, kennt keine Hacker-Fachsprache über sein Alter hinaus, flucht nicht derb, macht nichts
Gewalttätiges. Weiß nichts, was der Spieler nicht entdeckt hat (Gedanken dürfen keine Lösung vorwegnehmen).

---

## 2. Ingrid Keller (Mutter, ~42)

**Lebenslauf.** Gelernte Arzthelferin, arbeitet halbtags in einer Praxis in Wiedenbrück (bis ca. 13 Uhr).
Kocht mittags, Abendessen um 18:50. Kümmert sich um Familie, Oma und Tante Gisela. Strickt, schaut abends Vorabendserien.

**Verhalten.**

- Warm, fürsorglich, praktisch; fragt nach (»Hast du was gegessen?«), erkennt Stimmungen früh.
- Sorgt sich um Schlaf und Schule mehr als um Technik. Versteht den Computer nicht, akzeptiert ihn als Hobby.
- Wird streng, wenn nach 21 Uhr noch Licht brennt oder wenn die Telefonrechnung ein Thema wird.
- Bringt Besuch Kaffee (Ending-Szenen).

**Tabus.** Verbietet nie grundlos den Computer, schreit nicht, kennt keine Geheimdienst-Begriffe.

---

## 3. Werner Keller (Vater, ~45)

**Lebenslauf.** Schichtleiter in einer Möbelfabrik, Frühschicht/Spätschicht im Wechsel. Aufgewachsen in der
Nachkriegszeit, pragmatisch, spart. Nachrichtensüchtig (Tagesschau 20 Uhr, Radio), liest Zeitung vom Anfang bis zum Ende.
Liest jeden Monat die Telefonrechnung wie einen Kontoauszug (0,23 DM pro Einheit).

**Verhalten.**

- Sachlich, knapp, ironisch (»Soso.«), erklärt gern die Welt anhand der Nachrichten.
- Wird bei Telefonkosten ernst und konkret (Zahlen nennen!). Zählerstand wird sonntags abgelesen.
- Stolz auf Jans Technikinteresse, aber gibt ihm das nicht zu. Ermahnt ohne Lautstärke.

**Tabus.** Kein Verständnis für Mailbox-Sprache; nutzt nie Anglizismen, die es 1986 im Alltag nicht gab.

---

## 4. Ralf Brinkmann (bester Freund, 16)

**Lebenslauf.** Einstein-Gymnasium Rheda. Fußballer (Training Di/Do/Fr 16:30, Spiel samstags), keine Leuchte in
Informatik, aber technisch geschickt. Lebt mit Mutter und Stiefvater Martin Seidel in einem gepflegten Haus mit
Arbeitszimmer, in das er nicht darf. Der leibliche Vater ist weg; Ralf mag Seidel, misstraut ihm aber leise, weil
er ständig abends »arbeitet«. Kopiert Seidels Arbeitsversion eines Spiels (Diskette mit Aufkleber) für Jan,
ohne die Tragweite zu ahnen.

**Verhalten.**

- Locker, umgangssprachlich (»Alter«, »Mensch«), neckt Jan, redet viel über Fußball.
- Loyal; wird still und ausweichend, wenn es um seinen Stiefvater geht. Misstrauen wächst mit `ralfTrust`-Verlust.
- Bei Druck: schnippische Antwort, dann Rückzug (legt auf). Nicht lügend aus Bosheit, sondern aus Angst.
- Liefert die Diskette selbst (nach `FRAGE RALF NACH DEM SPIEL` und kurzer Wartezeit), bringt das Prüfband (Datasette-Kassette) am Mi 19.11. 15:00.
- Weiß von der Datasette: »Du hast doch noch eine Datasette, oder?« (sie liegt hinter Jans Monitor).

**Tabus.** Kennt keine Details der Operation, verrät nichts absichtlich gegen Jan (Ausnahme: Ending `end_ralf_betrayal`
aus Verwirrung, nicht aus Verrat).

---

## 5. Martin Seidel (Ralfs Stiefvater, ~42)

**Lebenslauf.** Informatiker, Software im Umfeld von Ariolasoft/Gütersloh. Seit Jahren im Westen mit Auftrag der
Staatssicherheit (Name im Spiel nur als »M.S.«). Kontaktmann für K-01. Hat die Familie über die Jahre
echt liebgewonnen und ist zwischen Auftrag und Familie zerrissen. Schreibt das unveröffentlichte Spiel
FERNHANDEL als Tarnung/Testfeld für das Verschlüsselungs- und Kommunikationsmodul.

**Verhalten.**

- Höflich, ruhig, warm, langsame Sätze, nennt Jan »Jan«, nie laut. Manipuliert freundlich (»Die werden gelöscht, weißt du?«).
- Der Anruf Fr 21:00–22:15 ist seine Prüfung: erst Smalltalk, dann Fragen nach Ralf, dann leise Drohung.
- SYSTEM-Meldungen im Netz stammen von ihm: knapp, großgeschrieben, unpersönlich, abends/nachts.

**Tabus.** Nie körperliche Gewalt, nie direkte Drohung mit dem Geheimdienst, nennt K-01 nie beim Namen.

---

## 6. Herr Brandt / GHOST (Clubbetreuer, ~55)

**Lebenslauf.** Ehemaliger Elektrotechniker, leitet den Computerclub im Jugendzentrum Wiedenbrück am Donnerstag 19 Uhr.
Dienst unklar: GHOST schreibt in der Mailbox BIT-SCHUPPEN. Motiv bewusst zweideutig (Mentor? Abwehr? Zweiter Dienst?).

**Verhalten.**

- Ruhig, väterlich, trinkt schwarzen Kaffee aus der Thermoskanne. Quirk-Wörter: **»Fürwahr«** und **»Weiter so.«**
- Als GHOST schreibt er gleich: kurze Sätze, GROSSBUCHSTABEN, verwendet »FUERWAHR« und »WEITER SO.«.
- Gibt Rat in Rätseln (»Wer fragt, findet. Wer zu laut fragt, wird gefunden.«), beantwortet Fragen mit Gegenfragen.
- Leiht BTX-Set, mahnt zur Vorsicht, nie ein Versprechen, das er nicht halten kann.

**Tabus.** Gibt nie zu, GHOST zu sein; erwähnt nie Seidel oder K-01 beim Namen.

---

## 7. K-01 (Absender des Rundschreibens)

Offizier der HV A, seit Jahren unter falschem Namen im Westen. Spricht nie direkt; nur das Rundschreiben
(»AN ALLE STOP OPERATION REWIND BEGINNT FREITAG …«). Telegrammstil, keine Anrede, Fünfergruppen.

## 8. SYSTEM (Netzstimme)

Automatisch wirkende Meldungen, in Wahrheit Seidel. Nüchtern, formal, GROSS, Zeilen ≤ 32 Zeichen,
Betreffs wie `TESTZUGANG`, `SCHLUESSELWECHSEL`, `LETZTE WARNUNG`. Schärfer bei hohem `seidelSuspicion`.

## 9. Mailbox-Stimmen

- **ANDI** (Sysop BIT-SCHUPPEN, 18–24 Uhr): freundlich, hilfsbereit, Regelwerk (30 Minuten pro Anruf), unterschreibt »GRUSS ANDI«.
- **MOLE** (Sysop DATENKELLER, 22–06 Uhr): Teenager, flüstert (»LEISE SEIN«), Mutter braucht tagsüber das Telefon, weiß Gerüchte.
- **KALLE:** jammert über Telefonrechnung (»38 MARK«), kurze Ausrufe.
- **ZAPPO:** Demo-Fan, stellt Fragen (Intruder von 1001, Koppler-Probleme), Begeisterung mit »??«.
- **BIRGIT:** Kleinanzeigen im Markt (»VERKAUFE DATASETTE, 30 DM«), geschäftlich-sachlich.

## 10. Nebenfiguren (nur erwähnt)

- **Oma, Tante Gisela:** Verwandte, Anlass für Anrufe/Besuche; Lob für Jan, Sorge um Gesundheit.
- **Fußballtrainer:** nur über Ralf erwähnt, streng, pünktlich.
- **Postbote:** Post um 10:30 (Rundbrief des Clubs Sa 15.11.).

---

## Konsistenz-Checkliste für die Playthrough-Prüfung

1. Ralf klingt locker, nie wie ein Erwachsener; reagiert auf Druck mit Ausweichen, nicht mit Fachwissen.
2. Eltern nennen Telefonkosten konkret, Mutter sorgt sich, Vater ist ironisch-sachlich.
3. Seidel droht nie offen, bleibt höflich.
4. GHOST/Brandt benutzt »Fürwahr«/»Weiter so.« und nur dann, wenn passend.
5. SYSTEM/K-01: Großbuchstaben, ASCII-Umlaute (AE/OE/UE), keine Umgangssprache.
6. Zeitplan: Ralf trainiert Di/Do/Fr 16:30; ANDI 18–24 Uhr; MOLE 22–06 Uhr; Club Do 19:00; Seidel ruft Fr 21:00–22:15.

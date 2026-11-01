# REWIND 1986
## Game Design Document (GDD) und technisches Pflichtenheft

**Version:** 1.0 (Konsolidierung der bisherigen Konzeptgespräche)  
**Sprache des Spiels:** Deutsch  
**Ausgabeplattform:** Webbrowser, Desktop und Smartphone  
**Zweck:** Implementierungsgrundlage für eine Coding-CLI (z. B. Codex oder Claude Code)  
**Status:** Konzept und Zielarchitektur; keine Behauptung, dass sämtliche Spielinhalte bereits ausformuliert sind

> **Leseregel für Coding-Agenten:** Dieses Dokument enthält verbindliche Entscheidungen, technisch abgeleitete Anforderungen und bewusst offene Storyfragen. Niemals einen offenen Punkt stillschweigend als kanonische Tatsache implementieren. Bei noch offenen Storydetails neutrale, austauschbare Platzhalter verwenden und als `TODO-STORY` markieren. Ziel ist zuerst eine funktionierende, erweiterbare Grundlage und ein spielbarer vertikaler Ausschnitt – nicht der Anschein eines fertig geschriebenen 12-Stunden-Spiels.

**Statuskennzeichen**  
`[FEST]` = im Gespräch explizit entschieden.  
`[ABGELEITET]` = logisch notwendige oder stark naheliegende technische Präzisierung.  
`[VORSCHLAG]` = Empfehlung, nicht endgültig beschlossen.  
`[OFFEN]` = dramaturgisch oder technisch noch zu entscheiden.

---

# 1. Vision und zentrale Leitplanken

## 1.1 Elevator Pitch [FEST]

**REWIND 1986** ist ein deutschsprachiges, storygetriebenes Browser-Text-Adventure im Herbst 1986 in **Rheda-Wiedenbrück, Nordrhein-Westfalen**. Protagonist **Jan Keller**, 17, lebt mit seinen Eltern und ist begeisterter Commodore-64-Nutzer. Sein bester Freund **Ralf** bringt ihm eine heimlich kopierte Diskette mit einem noch unveröffentlichten Spiel, an dem Ralfs Stiefvater **Martin Seidel** bei Ariolasoft arbeitet. Beim Ausprobieren aktiviert Jan zufällig einen versteckten Spielmodus. Er stößt auf eine verdeckte Kommunikationsinfrastruktur eines DDR-Spionagenetzwerks. Die zunächst aufregende Entdeckung entwickelt sich zu einem ernsthaften Katz-und-Maus-Thriller: Seidel ist selbst Stasi-Agent und sucht nach dem Eindringling im eigenen Netz, während Jan Indizien für eine bevorstehende Operation mit Bezug zu Industriespionage, britischen Militärstandorten und der Ausschleusung eines gefährdeten Agenten findet.

Die ganze Hauptspiel-Erfahrung findet **an Jans Schreibtisch bzw. im unmittelbaren Zimmerkontext** statt: Die Welt erreicht ihn über Telefon, Briefe, Pakete, Radio, Kassetten, Besucher, Disketten, Mailboxen und Bildschirmtext. Es gibt **keine frei begehbare Außenwelt**. Ein kurzer, inszenierter persönlicher Kontakt zu Ralf bei der Diskettenübergabe im Prolog ist ausdrücklich vorgesehen.

## 1.2 Kernversprechen an den Spieler [FEST]

1. Historisch glaubwürdige Heimcomputer- und Alltagswelt von 1986.
2. Freie, textbasierte Interaktion statt reinem Multiple-Choice-Spiel.
3. Reichhaltige digitale Erkundung: BASIC, Disketten, Mailboxen, BTX, Dateien, Nachrichten.
4. Grafisch illustriertes Jugendzimmer/Schreibtisch als zentrale Spieloberfläche.
5. Rätsel durch Beobachtung, Dialoge, Querverweise, Muster, Film- und Computerkultur – nie nur durch externes Faktenwissen.
6. Halb-offene Hauptgeschichte mit parallelen Ermittlungssträngen, verdeckten Akten und echten, aber fairen Konsequenzen.
7. Leichtfüßiger, nostalgischer Beginn, der zunehmend ernster und bedrohlicher wird.
8. Keine moderne Technik oder moderne Rechercheoptionen **innerhalb der Spielwelt**.

## 1.3 Nichtziele [FEST/ABGELEITET]

- Keine Google-Suche, kein WWW, keine Smartphones, keine modernen Messenger oder Onlinedienste im Jahr 1986.
- Kein frei navigierbares 3D-Stadtmodell, keine Bewegung des Spielers durch frei begehbare Gebäude.
- Kein C64-Voll-Emulator, keine unbeschränkte 6502/6510-Maschinencodeausführung.
- Kein rein passives Visual Novel-/Dialogauswahl-Spiel.
- Keine Pflicht, als Spieler reale Programmiersprachen oder Filmzitate bereits zu kennen.
- Kein Echtzeit-Zeitdruck durch die reale Uhr.
- Kein KI-Sprachmodell für die zentrale Spielsteuerung; die Regeln müssen deterministisch sein.
- Keine direkte Übernahme geschützter Demo-Programme, bekannter SID-Musik, Originalfilmdialoge oder geschützter Spieleassets ohne ausdrückliche Rechteklärung.

## 1.4 Zielumfang [FEST]

- Hauptgeschichte: **8–12 Stunden**.
- Freiwillige zusätzliche Beschäftigung: **ca. 5–10 Stunden** (Ziel, keine garantierte Laufzeit).
- Haupträtsel: **ca. 30–40** (Zielgröße für die Endfassung).
- Optionale Rätsel: **ca. 15–25**.
- Handlungsstränge: **4–6** miteinander verknüpfte Stränge.
- Enden: **3–5** unterschiedliche Ausgänge.
- Spielzeit innerhalb der Fiktion: **ca. 7–10 Tage**.
- Die genannten Zahlen beschreiben das **Vollspiel**. Der erste Entwicklungsauftrag soll ausdrücklich nur eine belastbare Architektur und einen hochwertigen spielbaren Ausschnitt liefern.

---

# 2. Schauplatz, Zeit und historische Korrektheit

## 2.1 Ort [FEST]

- Hauptschauplatz: **Rheda-Wiedenbrück, Bundesrepublik Deutschland, Herbst 1986**.
- Reales regionales Umfeld: **Gütersloh**, Bertelsmann, Ariolasoft, Sonopress, britischer Militärflugplatz **RAF Gütersloh**.
- Reale Institutionen dürfen der historischen Einbettung dienen; fiktive Geheimdienstaktivitäten werden ausschließlich **erfundenen Personen, Abteilungen, Projekten und Firmen** zugeordnet. Keine falsche Tatsachenbehauptung, ein reales Unternehmen sei historisch an Spionage beteiligt gewesen.
- Geografische Verweise, damalige Schreibweisen, Ortsbilder, Telefontechnik und öffentliche Ereignisse vor der Freigabe eines Spielinhalts verifizieren.

## 2.2 Datum [FEST/OFFEN]

- Das Spiel beginnt **freitagnachmittags im Herbst 1986** und umfasst ca. 7–10 Tage.
- Der genaue Tag ist **noch nicht verbindlich beschlossen**. Als leicht austauschbarer Entwickler-Default bietet sich **Freitag, 14.11.1986** an (`startDate` als Konfigurationswert), ohne diesen Tag als kanonisch festzuschreiben.
- Historische Nachrichten, Kinoprogramme und Veröffentlichungen dürfen nur Ereignisse berücksichtigen, die zum tatsächlich gewählten Spieltag bereits stattgefunden haben.

## 2.3 Verifizierte Anknüpfungspunkte [ABGELEITET]

- Ariolasoft GmbH wurde am **5. März 1986 in Gütersloh** gegründet (die Software-Aktivitäten entstanden in früheren Zusammenhängen). Quelle: Heinz Nixdorf MuseumsForum.
- Bertelsmann/Sonopress vervielfältigte seit **1985** Software auf Disketten und anderen Datenträgern. Quelle: Bertelsmann-Unternehmenschronik.
- Die **RAF** betrieb den Flugplatz Gütersloh in dieser Epoche; die spätere Verwendung durch die britische Army darf nicht in das Jahr 1986 zurückprojiziert werden. Quelle: LWL Westfalen regional.
- Der Übertritt des westdeutschen Verfassungsschutzmitarbeiters **Hansjoachim Tiedge** in die DDR am **19. August 1985** ist real; im Spiel nur als allgemeiner zeitgeschichtlicher Hintergrund oder zeitgenössischer Medienbericht verwenden. Quelle: Bundesarchiv.
- **BTX/Bildschirmtext** wurde 1983 bundesweit eingeführt. C64-Zugänge erforderten passende Modem-/Decoder-Hardware oder eingeschränkte Software-Lösungen; die Darstellung war nicht identisch mit dem gewöhnlichen C64-Textmodus. Das notwendige Zubehör muss Jans Ausrüstung bzw. als späterer Erwerb im Spiel erklären.
- **Usenet/Newsgroups** existierten 1986, waren aber nicht wie ein frei zugänglicher moderner Webdienst verfügbar. Für Jan höchstens als **seltener, gesondert begründeter Gateway-Zugang**; die normalen Erkundungsorte sind lokale BBS/Mailboxen und BTX.
- Die echte C64-Demo **ESCOS I** von **1001 Crew** stammt aus 1986 und ist ein gestalterisches Vorbild. Das Spiel verwendet ein eigenständiges fiktives Werk namens **INTRUDER by 1001 FIGHTERS**.

**Referenzen für Recherche und Abnahme**

- HNF Ariolasoft: https://blog.hnf.de/ariolasoft-computerspiele-aus-ostwestfalen/
- Bertelsmann Chronik: https://history.bertelsmann.com/de/milestones/view/169
- LWL Flugplatz Gütersloh: https://www.westfalen-regional.de/de/guetersloh_flughafenkonversion/
- Bundesarchiv Tiedge: https://www.bundesarchiv.de/themen-entdecken/online-entdecken/themenbeitraege/der-ueberlaeufer/
- Museumsstiftung BTX: https://onlinesammlung.museumsstiftung.de/detail/collection/b172a058-c781-49e9-b06f-7d290897e05c
- C64-BTX-Technik: https://www.c64-wiki.de/wiki/Btx
- ESCOS I: https://www.c64-wiki.de/wiki/Hyperscreen
- C64-Diskettenverzeichnis: https://www.c64-wiki.de/wiki/Directory

## 2.4 Historische Plausibilität als Testregel [ABGELEITET]

Jede interaktive Funktion erhält eine historische Einordnung:

- `historicalStatus: "verified" | "plausible" | "fictional" | "needs_research"`
- `availableFromYear <= 1986` (soweit sinnvoll)
- `historicalNotes` für Autoren/QA.

Das System verbietet **keine** fiktiven Inhalte, aber unplausible technische Effekte müssen vermieden werden. Nachrichten können nur durch ein vorhandenes lokales Programm, eine zuvor bestehende Datendatei, einen Datenträger oder eine nachvollziehbare Datenverbindung auftauchen. Kein moderner Fernzugriff ohne technische Grundlage.

---

# 3. Figuren und Beziehungsnetz

## 3.1 Jan Keller [FEST]

- **16 Jahre** (Stand 01.11.2026, siehe STORY_DECISIONS.md), Schüler, wohnhaft in Rheda-Wiedenbrück, 1986.
- Computerbegeistert, programmiert BASIC, tauscht Disketten, liebt C64-Demos, Computerzeitschriften, Filme und Datenfernübertragung.
- Analytisch, geduldig, gut in Mustern und Technik, sozial nicht immer sicher, nicht körperlich heldenhaft.
- Seine Gedanken und Gefühle werden gelegentlich wiedergegeben, ohne dem Spieler Handlungen abzunehmen.
- Er verlässt im Hauptspiel die Schreibtisch-/Zimmerwelt nicht zu frei erkundbaren Orten.
- Er ist **kein Geheimagent** und weiß beim Start nichts über Seidels Tätigkeit.

### Interaktionsprinzip der Spielfigur [FEST]

- Jan darf Erstaunen, Erinnerungen, Besorgnis, Freude und Vermutungen äußern.
- Er löst Rätsel **nicht automatisch** und entscheidet nicht selbstständig über kritische Handlungen.
- Optionale Hilfe über `DENKE NACH` / Notizsystem nur auf Spielerwunsch oder als sehr zurückhaltende narrative Reaktion.

## 3.2 Ralf [FEST]

- Jans bester Freund, ungefähr gleichaltrig, Fußballspieler.
- Ralf hat die unveröffentlichte Spielediskette **heimlich von einer Diskette seines Stiefvaters kopiert**, ohne dessen Wissen.
- Er weiß weder von einem versteckten Modus noch von der Arbeit seines Stiefvaters für die Stasi.
- Zwischen Ralf und dem Stiefvater herrscht ein gespanntes Verhältnis; der Stiefvater ist kontrollierend und streng.
- Zu Beginn ruft Ralf Jan an und gibt ihm die Diskette **persönlich**, muss aber **sofort zum Fußballtraining**. Er bleibt **nicht**, um mit Jan zu spielen.
- Jan muss ihn im Verlauf der Geschichte von Seidels Doppelrolle überzeugen; dabei ist Ralfs Vertrauen eine verdeckte Spielvariable.
- Ralf kann durch falsches Vertrauen seinem Stiefvater versehentlich Hinweise liefern und bleibt potenziell eine aktive Nebenfigur.
- Familienname Ralfs: `[OFFEN]`; die Beziehung zum Stiefvater ist wichtiger als der Nachname.

## 3.3 Martin Seidel [FEST]

- Ralfs **Stiefvater**, ca. 42 (Alter ist früher als Vorschlag genannt; feinjustierbar).
- Nach außen Softwareentwickler im Umfeld **Ariolasoft/Bertelsmann** in Gütersloh.
- In der Geschichte ein **fiktiver Agent des Ministeriums für Staatssicherheit (MfS)**.
- Hat das geheime Kommunikationsmodul im unveröffentlichten C64-Spiel entwickelt.
- Kennt aus Abschottungsgründen nicht notwendigerweise alle Beteiligten des Agentennetzwerks.
- Betreut wesentliche Teile der technischen Infrastruktur, kontrolliert aber **nicht alle** Kanäle und Personen.
- Bemerkt Unregelmäßigkeiten und vermutet einen Eindringling oder Verräter.
- Erkennt zunächst **nicht**, dass Jan hinter der unbekannten Kennung steckt; er wird schrittweise auf Jan aufmerksam.
- Er ist intelligent, vorsichtig, manipulativ und gefährlich – kein eindimensionaler Bösewicht.
- Er kann im Finale vor der Entscheidung zwischen Auftrag und familiären Bindungen stehen.
- **Wichtig für Recht/Redaktion:** Seidel ist eine erfundene Figur. Seine Geheimdiensttätigkeit darf nicht als historische Eigenschaft von Ariolasoft/Bertelsmann dargestellt werden.

## 3.4 GHOST [TEILWEISE FEST]

- Geheimnisvoller Teilnehmer im Agentennetzwerk.
- Wirkt gegen Seidel bzw. gegen Operation REWIND.
- Verfügt über Kenntnisse über das Netzwerk, die Jan zunächst fehlen.
- Steht **heimlich in Verbindung mit einem britischen Nachrichtendienst**; konkrete Dienstzuordnung und vollständige Motive `[OFFEN]`.
- Ist **jemand aus Jans erweitertem Umfeld**, dem Jan im Spiel früh in einer unscheinbaren Rolle begegnet.
- Kann Jan helfen, ihn manipulieren, Informationen zurückhalten und gelegentlich irreführen.
- Die Enttarnung erfolgt durch **Kombination aus technischen, sprachlichen und persönlichen Hinweisen**, nicht allein durch eine direkte Selbstenthüllung.
- Die tatsächlich bürgerliche Identität ist **noch nicht beschlossen**. Der Computerclub-Betreuer wurde als starke Option vorgeschlagen, aber nie verbindlich gewählt.
- **Ungeklärt aus der letzten Konzeptfrage:** Weiß GHOST von Anfang an, dass der unbekannte Teilnehmer Jan ist? Entdeckt er es erst später? Oder kennt er Jan persönlich, ohne zunächst die digitale Identität zuordnen zu können? **Keine Variante stillschweigend festschreiben.**
- In der Implementierung Platzhalter `GHOST_CIVIL_IDENTITY_TBD`, `GHOST_RECOGNITION_ARC_TBD` und Datenfelder für Wissen beider Seiten verwenden.

## 3.5 Jans Mutter [FEST]

- Aktive, aufmerksam beobachtende Nebenfigur.
- Nimmt Anrufe entgegen, übergibt Briefe/Pakete, meldet Besucher, kommentiert Jans Verhalten.
- Kann zufällig Informationen über Seidels Nachforschungen liefern.
- Nicht selbst als Spionin vorgesehen; **einzelne unfreiwillige Berührungen mit dem Geheimdienstfall** sind möglich.
- Name, Beruf, genaue Biografie `[OFFEN]`.

## 3.6 Jans Vater [FEST]

- Pragmatiker, interessiert sich für Nachrichten; respektiert Jan, versteht nicht alle Computeraktivitäten.
- Reagiert besonders auf Telefonkosten, Müdigkeit, ungewöhnliche Ereignisse.
- Kann hilfreiche Informationen aus Rundfunk/Nachrichten weitergeben.
- Nicht automatisch technikfeindlich; keine überzeichnete Karikatur.
- Name, Beruf, Biografie `[OFFEN]`.

## 3.7 Zusätzliche Figuren [VORSCHLAG]

Für Mailboxen und Szenen werden weitere fiktive Figuren benötigt, z. B. Sysop einer lokalen Mailbox, Computerclub-Mitglieder, Film-/Videothekenkontakte, anonyme Agenten und regionale Medienkontakte. **Diese sind noch nicht als Kanon festgelegt.** Jeder neue NPC braucht:

- Motiv, verfügbare Themen, Wissen, Kommunikationswege, Zeitplan;
- Abhängigkeiten von Spielzustand;
- Konsequenzen bei glaubwürdigen bzw. unvorsichtigen Aussagen;
- mindestens eine erkennbare Eigenheit, ohne platte Stereotype.

---

# 4. Story – gegebene Fakten, Geheimnisse, Ziele

## 4.1 Kanonische Ausgangskette [FEST]

1. Herbst 1986, Freitag, Rheda-Wiedenbrück.
2. Jan sitzt am Schreibtisch mit C64, 1541, Telefon, Funk-/Audiogeräten und persönlichen Unterlagen.
3. Ralf ruft an und erzählt von einem noch unveröffentlichten Spiel aus dem Arbeitsumfeld seines Stiefvaters.
4. Ralf kommt kurz vorbei, drückt Jan die heimlich kopierte Diskette in die Hand und muss sofort zum Fußballtraining.
5. Jan untersucht und startet das Spiel **allein**.
6. In einem spezifischen Moment des Intros drückt er zufällig eine bestimmte Taste. Der versteckte Modus erscheint.
7. Das Programm fordert **Diskette 2** an, die Jan nicht besitzt.
8. Die erste Diskette enthält trotzdem den Weg in eine **geheime Mailbox** bzw. ein Terminalmodul; die zweite ist **hauptsächlich die Schlüsseldiskette zur Entschlüsselung**. Der Spieler soll frühe Netzaktivitäten auch ohne sie ausführen können.
9. Jan liest zunächst nicht verständliche Nachrichten und entdeckt allmählich ein geheimes Agentennetzwerk.
10. Seidel bemerkt Unregelmäßigkeiten und entwickelt Verdacht gegen den unbekannten Netzteilnehmer.
11. Jan entdeckt nach und nach Verbindungen zu Industriespionage, britischen Militärstandorten und einer bevorstehenden Operation.
12. GHOST taucht als widersprüchlicher, potenzieller Helfer auf.
13. Jan muss Informationen auswerten, Ralf überzeugen und seine Identität schützen.
14. Finale und Ende hängen von Entscheidungen und gesammelten Beweisen ab.

**Faire Gestaltung der Zufallstaste:** Das Ereignis wird in der Handlung als zufällig beschrieben, darf aber nicht verlangen, dass der reale Spieler mit unklarer Millisekunden-Genauigkeit eine geheime Taste errät. Das Intro muss wiederholbar sein und über Beobachtung/Hinweise/alternative Eingaben zuverlässig zum Modus führen.

## 4.2 Operation REWIND [FEST]

Die **fiktive Geheimdienstoperation** ist keine bloße Sammelaktion:

- Letzte sensible Informationen sollen beschafft bzw. gesichert werden (Bezug zu Industrie/Kommunikation/britischer Militärpräsenz).
- Mindestens ein gefährdeter Agent soll ausgeschleust werden.
- Teile des Netzes sollen anschließend stillgelegt oder Spuren beseitigt werden.
- Ein **konkreter späterer Termin innerhalb der Spielwoche** erzeugt erzählerische Dringlichkeit.
- Die Gefahr für Unbeteiligte ist real, entsteht vor allem durch Enttarnung, Erpressung, Flucht und riskante Entscheidungen; einzelne weitergehende Gefahrenmomente sind erlaubt, ohne das Spiel zum Action-/Sabotagetraining zu machen.
- Das genaue operative Ziel, der Termin, die Identität des auszuschleusenden Agenten, die Rolle des Spiels für die letzte Phase und der Mechanismus des Finales sind **noch offen** und müssen in einem separaten Storydesign-Schritt ausgearbeitet werden.

## 4.3 Seidels Eigenkonflikt [FEST]

- Er hat eine bürgerliche Existenz mit Frau und Stiefsohn Ralf aufgebaut.
- Die Operation könnte sein Verschwinden/ seine Flucht erforderlich machen.
- Er sucht einen vermuteten Verräter im Netz und hält Jans digital auftauchende Kennung zunächst für eine Gefahr.
- Er und Jan verfügen jeweils nur über Teilinformationen; Spannung entsteht aus asymmetrischem Wissen.
- Ralf darf nicht als bloßes Druckmittel reduziert werden; seine glaubwürdige Loyalitätskrise soll spielrelevant sein.

## 4.4 Dramaturgie [FEST]

- **Beginn:** neugierig, warm, humorvoll, begeistert von Computern.
- **Mitte:** rätselhaft, technische Probleme und logische Unstimmigkeiten, zunehmendes Misstrauen.
- **Später Verlauf:** psychologischer Druck, verdeckte Kommunikation, eigene Fehler mit Folgen.
- **Finale:** moralische Entscheidungen und Zeitdruck **nur innerhalb der aktionsbasierten Spieluhr**.

## 4.5 Sechs verdeckte Akte [FEST]

| Akt | Interner Arbeitstitel | Inhalt | Eintritt/Ergebnis (Designziel) |
|---|---|---|---|
| 1 | Die Diskette | Ralf, Spiel, geheimer Modus | Erstes Mysterium, technische Zugangsspur |
| 2 | Das Netzwerk | Erste Mailbox, weitere Kontakte | Erkennen einer strukturierten geheimen Kommunikation |
| 3 | Die falsche Identität | Vertiefung, Codes, teilweise Entschlüsselung | Jan wird vom Beobachter zum aktiven Teilnehmer |
| 4 | Der Verdacht | Seidel sucht Eindringling; Ralf-Konflikt | Jans Anonymität gerät in Gefahr |
| 5 | Die Enttarnung | Seidels Rolle, Militärbezug, GHOST-Indizien | Zusammenführung der Handlungsstränge |
| 6 | Operation REWIND | Termin und finaler Eingriff/Entscheidung | Mehrere mögliche Enden |

**Spieler sieht keine sichtbaren Kapitelwechsel.** Akte sind interne Storyflags/Phasen. Frühere Disketten, Mailboxen und Geräte bleiben grundsätzlich zugänglich. Das Ereignissystem kann deren Inhalte ändern.

## 4.6 Parallelstränge [FEST/ABGELEITET]

1. **C64 / verstecktes Programm / Diskette 2** – technisches Hauptmysterium.
2. **Mailboxen und geheime Netzidentitäten** – Erkundung und Recherche.
3. **Ralf / Seidel / familiäres Misstrauen** – persönliche Konflikte.
4. **Industrie, britische Militärpräsenz, Operation** – konvergierende Fakten.
5. **GHOST / mögliche Gegenoperation** – Wahrheit, Fehlleitung, Identität.
6. **Alltag, Geld, Telefonkosten, Eltern** – unterstützendes Risiko und Atmosphäre.

Stränge können in unterschiedlicher Reihenfolge bearbeitet werden; das Finale erfordert das Zusammenführen hinreichender Beweisgruppen, nicht das Abarbeiten einer starren To-do-Liste.

## 4.7 Enden [FEST/ABGELEITET]

**Mehrere Enden sind verbindlich**, ihre finale schriftliche Ausgestaltung noch nicht. Mögliche, bislang diskutierte Ergebnisklassen:

- **Enttarnung:** belastbare Beweise über Seidel / das Netzwerk werden gesichert und einer geeigneten Stelle zugeführt.
- **Teilerfolg / Flucht:** die Operation wird verhindert, Seidel entkommt.
- **Vertuschung:** der unmittelbare Schaden wird verhindert, Hintermänner bleiben unbekannt.
- **Ralf-Konflikt:** Beziehungsentscheidungen verändern, ob Ralf hilft oder unbeabsichtigt Seidel informiert; dies kann ein eigenständiges schlechtes Ende oder eine Variation anderer Enden sein.
- **Scheitern / Entdeckung:** seltenes, früh signalisiertes Game Over, aus dem sich per Spielstand weiterspielen lässt.

**Keine feste Anzahl oder exakte Endbedingung vorgeben, bevor das Finale detailliert geschrieben ist.** Zielbereich 3–5 Enden.

---

# 5. Spielwelt: Jans Schreibtisch als Hub

## 5.1 Grundregel [FEST]

**Der Schreibtisch ist die begehbare Welt.** Die digitale Welt wird im C64 erkundet; physische Elemente werden im Zimmer bedient. Jan kann Ralf im kurzen Prolog an der Tür treffen, aber der Spieler erhält keinen Navigationsparser für die Stadt.

## 5.2 Interaktive Objekte [FEST/TEILWEISE OFFEN]

| ID | Objekt | Vorgesehene Funktionen | Status |
|---|---|---|---|
| `c64` | Commodore 64 mit Monitor | BASIC, Spiel, Programme, Mailbox, Archiv | FEST |
| `drive1541` | 1541-Floppy | Disketten einlegen/wechseln, Laufwerkszustand | FEST |
| `disketteGame` | Ralfs kopierte Spielediskette | Spiel starten, geheimer Modus | FEST |
| `disketteKey` | Diskette 2 | Geheimschlüssel; Original nicht von Anfang an vorhanden | FEST |
| `diskette1001` | Diskette mit Aufschrift `1001` | Demo `INTRUDER` | FEST |
| `phone` | Telefon | Anrufe, Rückrufe, Gesprächsparser | FEST |
| `acousticCoupler` | Akustikkoppler/Modem | Mailbox-Einwahl, Leitungsbelegung | FEST |
| `btxEquipment` | BTX-Zubehör/Software | historische BTX-Zugänge | FEST als Fähigkeit; exaktes Gerät OFFEN |
| `radio` | Radio | Sender, Nachrichten, Hinweise, Zeitereignisse | FEST |
| `tapeRecorder` | Kassettenrekorder | Kassetten/Töne/Audiohinweise | FEST |
| `deskDrawer` | Schreibtischschublade | Suchobjekte, Disketten, Unterlagen | FEST |
| `notebook` | Papiernotizblock | Hinweise, Spielertexte, Denk-Hilfe | FEST |
| `magazines` | Computerzeitschriften | Listings, Kleinanzeigen, Erklärungen | FEST |
| `deskDoor` | Zimmertür / Ruf aus dem Haus | familiäre Ereignisse, Paketübergabe | FEST |
| `television`, `vcr` | Fernseher/Videorekorder | Filmbezug, Videotext/VHS | aus früherem Gespräch als Möglichkeit diskutiert, aber konkreter Ausbau OFFEN |
| `datasette` | Datasette | Kassettenprogramme | als Jans Ausstattung erwähnt, Umfang OFFEN |

## 5.3 Beispielaktionen [FEST]

- `UNTERSUCHE DISKETTE`
- `NIMM DISKETTE`
- `LEGE DISKETTE INS LAUFWERK`
- `SCHALTE RADIO EIN`
- `STELLE RADIO AUF [SENDER]`
- `NIMM HOERER` / `HEBE HÖRER AB`
- `RUFE RALF AN`
- `ÖFFNE SCHUBLADE`
- `LIES ZEITSCHRIFT`
- `ÖFFNE PAKET`
- `BENUTZE COMPUTER`
- `SIEH AUF DEN MONITOR`
- `DENKE NACH`
- `INVENTAR` / `NOTIZEN` / `THEMEN`

## 5.4 Objektzustände [ABGELEITET]

Jedes Gerät besitzt echte Zustände: ein/aus, aktiv/inaktiv, verbunden/getrennt, Kassette eingelegt, Laufwerk belegt, diskretes Senderprofil. Aktionen werden kontextabhängig beantwortet. Kein Text behauptet eine Aktion, wenn sie physisch noch nicht möglich ist.

**Wichtige Wechselwirkung:** Im Basisszenario teilen Telefonate und Datenverbindungen **dieselbe Telefonleitung**. Während eines Modemanrufs kann Jan nicht gleichzeitig normal telefonieren, es sei denn, das Spiel etabliert glaubwürdig eine zweite Leitung (nicht vorgesehen). Ein besetzter Anschluss ist zugleich Rätsel- und Stimmungselement.

## 5.5 Smartphone [FEST]

- Desktop: Gesamt-Schreibtisch, Monitor, Adventure-Protokoll und Befehlszeile sinnvoll nebeneinander.
- Smartphone: Schreibtisch als navigierbares/zoomfähiges Hub-Bild, Geräte in eigenen gut lesbaren Detailansichten, Adventure-Befehlsleiste jederzeit erreichbar.
- Mobile C64-Eingabe: normale Bildschirmtastatur plus zugängliche Sondertasten-Aktionen (`RUN/STOP`, `RETURN`, `SHIFT`, ggf. Funktionstasten) als UI.
- Kein winziges „echtes“ 40×25-Raster, das auf Handys unlesbar wird: für Darstellung logisch 40×25, visuell skalierbar.

---

# 6. Zwei getrennte Eingabesysteme

## 6.1 Adventure-Parser [FEST]

Regelbasierter, erweiterter Parser, **keine KI als Voraussetzung**, keine starren exakten Eingabesätze.

Funktionen:

- Verb-Synonyme und Flexionen, z. B. `NIMM`, `NEHME`, `HEB ... AUF`.
- Satzvariationen, z. B. `SCHAU DIR DAS RADIO AN`, `UNTERSUCHE RADIO`.
- Objekt-Aliase, z. B. `DISK`, `DISKETTE`, `SPIELEDISKETTE` (kontextgebunden).
- Textnormalisierung: Groß-/Kleinschreibung, Umlaute/ae/oe/ue, Satzzeichen, optionale Füllwörter.
- Kurzkontext / Pronomen: nach `UNTERSUCHE PAKET` kann `ÖFFNE ES` Paket meinen.
- Mehrfachreferenzen mit gezielten Rückfragen: `Welche Diskette meinst du?`
- Themenspezifische Gesprächsbefehle: `FRAGE RALF NACH SEIDEL`, `ERZÄHLE RALF VON DER MAILBOX`.
- Einfache Tippfehler-Toleranz – bei hoher Mehrdeutigkeit **nicht blind handeln**.
- Präzise, situative Fehlermeldungen; keine erfundenen Aktionen.
- `THEMEN` zeigt nur bereits bekannte Dialogthemen, versteckte Themen bleiben über manuelle Texteingabe zugänglich.
- `HILFE`, `INVENTAR`, `NOTIZEN`, `DENKE NACH`, `ZEIT`, `SPEICHERN`, `LADEN`, `WARTE` als Metakommandos.

**Parser-Pipeline [VORSCHLAG]:**

1. Eingabetext normalisieren.
2. Sonder-/Meta-Kommando erkennen.
3. Verbgruppe, Objektgruppe, Präposition/Ziel, Thema extrahieren.
4. Aus aktuellem Kontext und sichtbaren/interagierbaren Objekten mögliche Intents bilden.
5. Intent anhand definierter Regeln auflösen; bei Unklarheit nachfragen.
6. Preconditions prüfen.
7. Aktion rein über zentrale Game-Engine ausführen.
8. Resultat (Texte, Zeiteffekt, Flag-/Inventaränderungen, UI-Effekt, Ton) anzeigen und speichern.

**Keine freie Code-Auswertung durch den Parser (`eval`, dynamische JavaScript-Ausführung etc.).**

## 6.2 C64-Interpreter [FEST]

- Im C64-Monitor existiert ein **separates Eingabefeld**, mit eigenem Fokus und eigener Befehlshistorie.
- Er interpretiert C64-/BASIC-, Disketten- und Terminalbefehle und ist vom Adventure-Parser getrennt.
- Beide nutzen den **gleichen serialisierbaren Spielzustand**; eine eingelegte Diskette ist z. B. im Adventure wie am Computer identisch.
- Spieler dürfen bei Bedarf vereinfachte Befehle benutzen (`ZEIGE DATEIEN`, `LADE SPIEL`), die sachlich sinnvoll auf C64-Aktionen abgebildet werden.
- Tastatureingaben gehen immer **nur an den aktiven Bereich**. Eine Eingabe für Jans Umfeld darf nicht versehentlich als BASIC-Befehl auf dem Monitor erscheinen.

## 6.3 Kein „echter PC-DOS“-Prompt [ABGELEITET]

- Für den C64 standardmäßig `**** COMMODORE 64 BASIC V2 ****`, `READY.` und blinkenden Cursor nutzen.
- **Kein** `C:\>`-Prompt im nativen C64-Modus.
- Mailboxen/Terminalprogramme dürfen eigene textbasierte Menüs und Prompts haben.
- `LOAD"$",8` gefolgt von `LIST` zeigt in BASIC V2 das Diskettenverzeichnis und **überschreibt dabei das zuvor im BASIC-Programmspeicher befindliche Programm**. Diese Semantik zumindest für die Kernbefehle korrekt modellieren.
- `LOAD"*",8,1` ist eine mögliche Ladevariante mit tatsächlicher C64-Bedeutung; die Art des Startens hängt von der geladenen Software ab. Für das Spiel kann ein passendes BASIC-Ladeprogramm mit `RUN` definiert werden.

## 6.4 Umfang der Simulation [FEST]

**Ausführlich, aber nicht vollständig emuliert**:

- Unterstützte BASIC-V2-Teilmenge für spielerseitige Programme und Anzeigen (siehe § 7).
- Authentische Disketten-Verzeichnisse/Programmstarts/virtuelle Dateien.
- Benutzbare Mailbox-Clients und BTX-Angebote.
- Installierte fiktive Spiele, Tools, Archivsoftware, Demos und kleine Extras.
- Grenzen klar dokumentieren: keine allgemeine 6510-Emulation, keine echte systemnahe C64-Binärkompatibilität.

---

# 7. C64-System, BASIC und Disketten

## 7.1 Ausstattung [FEST]

- Commodore 64 (klassisches Heimcomputer-Feeling, 64 KB RAM).
- Commodore 1541, 5,25-Zoll-Disketten.
- BASIC V2 als Standard.
- Datenfernübertragung mit historisch passendem Modem/Akustikkoppler und geeignetem Terminalprogramm.
- BTX als mögliche, besonders ausgestattete Zugriffsart; konkrete Module historisch prüfen.
- Datenkassetten-/Datasette-Option, wenn später in der Handlung benötigt.

## 7.2 Virtuelles Dateisystem [ABGELEITET]

Disketten sind eigene Spielobjekte mit:

- eindeutiger ID, Anzeigename, Etikett, Seitentyp, Schreibschutz;
- Einträgen mit C64-tauglichen Dateinamen (typisch bis 16 Zeichen), Typ (`PRG`, `SEQ` etc.), simulierten Blöcken;
- Dateiinhalten, Start-/Anwendungskennung, Sichtbarkeitsregeln;
- Storyflags und optionalen Geheimnissen, die nur über definierte Rätselmethoden sichtbar werden.

Disketteneinlegung ist ein Adventure-Vorgang, Laden/Listen ein Computer-Vorgang.

## 7.3 BASIC-Minimum [VORSCHLAG MIT HOHER PRIORITÄT]

Unterstützen:

- Programmzeilen mit Zeilennummern und `LIST`, `NEW`, `RUN`.
- `PRINT`, Zuweisungen, numerische und String-Variablen, einfache Arithmetik und Stringoperationen.
- `INPUT`, `IF ... THEN`, `GOTO`, `FOR ... TO ... STEP` / `NEXT`, `REM`.
- Für anspruchsvollere optionale Rätsel bei Bedarf `GOSUB`, `RETURN`, `MID$`, `ASC`, `CHR$`, `LEN`, `VAL`, `STR$`.
- `LOAD`, `SAVE` für definierte virtuellen Dateien und Disketten; ggf. reduzierte, sauber dokumentierte DOS-Fehler.
- `PEEK`/`POKE` **nur mit kontrolliertem, simuliertem Speicherbereich und klaren Auswirkungen**, nicht als beliebige Host-Hardware-/Browserzugriffe.
- CPU-/Script-Limits (maximale Schritte, Ausgaben und Speicher), damit Endlosschleifen die Webseite nicht blockieren.

**Kennzeichnung der Qualität:** Ein „BASIC-Simulator“ darf nicht behaupten, BASIC V2 vollständig kompatibel zu sein, wenn nur ein Subset implementiert ist. Referenzbefehle testen und dokumentieren.

## 7.4 Programme [FEST]

- Unveröffentlichtes Spiel aus Ralfs Kopie (`WORKING_TITLE_TBD`; **nicht** automatisch „REWIND 1986“, denn das ist vorerst der Titel des Gesamtadventures).
- Versteckter Kommunikations-/Terminalmodus im Spiel.
- Persönliches Archivprogramm von Jan (siehe § 11).
- Weitere zeittypische optionale Spiele, Utilities und Demos.
- `INTRUDER by 1001 FIGHTERS` (siehe § 12).

## 7.5 Die beiden Spionagedisketten [FEST]

**Diskette 1**

- Tarnung als unveröffentlichtes Spiel, von Ralf heimlich kopiert.
- Enthält versteckten Modus und Terminal-/Mailbox-Zugriff.
- Verweist auf fehlende Diskette 2.
- Gestattet bereits **eingeschränkten** Zugang, Lesen und Interaktion mit unverständlichen/verschlüsselten Informationen.

**Diskette 2**

- Enthält Codes/Schlüssel zur Entschlüsselung (nicht als triviale Einmalpasswortkarte behandeln).
- Ursprünglich bei Seidel bzw. in dessen Zugriff.
- Jan **muss nicht das Original physisch erhalten**. Alternative Lösungswege: Teilrekonstruktion über digitale Funde, Hinweise und eigene kleine Programme.
- In der Story keine automatische Superberechtigung nach Erwerb. Berechtigungen und Schlüssel sind unterschiedliche Dinge.

---

# 8. Datenfernübertragung, Mailboxen und BTX

## 8.1 Architektur aus Spielersicht [FEST]

1. **Geheime Zentral-Mailbox** aus dem versteckten Spielmodus.
2. **Normale regionale Mailboxen** für Computerfreunde, Software, Kleinanzeigen, Filmfans und Diskussionen.
3. **Weitere versteckte Nachrichtenwege** innerhalb solcher gewöhnlicher Systeme.
4. **BTX-Angebote**, die normale Informationen und einzelne Hinweise enthalten.
5. Optional ein besonders begründeter Zugang zu technischen Newsgroups/Usenet über ein Gateway; **kein Allgemeinzugang zum heutigen Internet**.

Es werden ausschließlich **simulierte Netzdienste** verwendet, keine echten Telefonnummern angewählt und keine echte Netzwerkspionage ausgeführt.

## 8.2 Mailbox-Metadaten [ABGELEITET]

Jede Mailbox kann enthalten:

- eindeutige ID, Name, fiktive lokale Telefonnummer, Beschreibung und Betreiber/Sysop;
- Öffnungszeiten oder Wartungsfenster, Benutzerstatus, Zugangsvoraussetzungen;
- Nachrichtenbretter/Threads, private Nachrichten, Dateien/Downloads, Benutzernamen und Postings;
- Kostenregel, Zeiteffekt und eventuelle Verbindungsabbrüche;
- kontextabhängige Änderungen, wenn die Hauptgeschichte fortschreitet.

Historischer Stil: schlichte Textmenüs, ASCII/PETSCII-nahe Darstellung, langsame Übertragung als stilistischer Effekt (abschaltbar/beschleunigbar). Kein 2026-Webforum-Layout innerhalb des C64.

## 8.3 Geheimes Netz [FEST]

- Anonyme Agentenkennungen/Decknamen.
- Keine vollständige Teilnehmerliste; Seidel kennt nur Teile.
- Jan wird zunächst **nicht automatisch als Fremder identifiziert**.
- Begrenzte Rechte und verschlüsselte Inhalte erlauben graduellen Fortschritt.
- Kommunikation kann weitere Netzbereiche erschließen.
- Seidel bemerkt Unstimmigkeiten und untersucht sie; konkrete Identitätsenttarnung braucht plausible Spuren und Fehler.

## 8.4 Plausibilität der Anonymität [ABGELEITET]

Die Behauptung „niemand kennt die Anzahl der Agenten“ allein genügt nicht als IT-Sicherheitsbegründung. Implementiere zusätzlich eine verständliche fiktionale Regel: Die erste Diskette enthält eine **vorprovisionierte, für den Tarnbetrieb gültige Kennung** mit begrenzten Rechten. Ralf hat eine Kopie einer echten Entwicklungs-/Testdiskette vervielfältigt. Die Nutzung ist im Netz zunächst plausibel, bis Seidel ungewöhnliche Aktivitäten bemerkt.

Diese Erklärung ist ein **technischer Gestaltungsvorschlag**, keine bereits detailliert beschlossene Agentenmethode. Sie verhindert eine offensichtliche Storylücke und kann durch eine andere glaubwürdige Autorenlösung ersetzt werden.

## 8.5 BTX [FEST]

- Historisch als **Bildschirmtext** benennen; unterschiedliche Anzeigetechnik gegenüber C64-BASIC.
- Eigene Seitenstruktur mit Kennungen, Seitentexten, Funktionen und Kosten.
- Möglichkeit, Auskünfte, lokale Angebote, Kleinanzeigen und relevante Hinweise zu finden.
- Keine allgemeine Textsuche über das gesamte Weltwissen.

## 8.6 Netz-/Telefonkosten [FEST]

- Verbindung kann Zeit und DM kosten. Die **exakten Tarife von 1986 müssen recherchiert werden**; bis dahin konfigurierbare vereinfachte, klar als Spielökonomie gekennzeichnete Tarife.
- Der Spieler sieht Budget/Telefonkosten; Eltern reagieren gelegentlich.
- Kosten dürfen kein unlösbares Hard-Lock verursachen – kostenlose Alternativen oder verlässliche Wege zu neuem Geld/Zeit müssen existieren.

---

# 9. Dialoge und Charakter-KI (regelbasiert)

## 9.1 Bedienung [FEST]

- Freitextbefehle: `FRAGE RALF NACH DEM SPIEL`, `REDE MIT RALF ÜBER SEIDEL`, `ERZÄHLE MUTTER VON DEM ANRUF`.
- `THEMEN` zeigt bekannte Gesprächsthemen für die aktuelle Person.
- Entdeckbare versteckte Themen lassen sich auch ohne vorausgehende Anzeige eingeben.
- Antworten variieren mit Storyflags, Vertrauen, Tageszeit und bekannten Informationen.

## 9.2 Konsistenzregeln [ABGELEITET]

- NPCs dürfen nur Dinge wissen, die ihr Wissensprofil zu diesem Zeitpunkt erlaubt.
- Kein NPC liefert unbegründete Exposition oder sagt geheim gehaltene Fakten ohne Trigger.
- Verpasste/verspätete Anrufe können als Nachrichten oder Rückrufgelegenheiten modelliert werden.
- Jeder Dialogknoten besitzt ID, Thema, Vorbedingungen, Antworten, Folgeeffekte und ggf. optionale Hinweise.

## 9.3 Beziehungssysteme [FEST]

Verborgene Zustände:

- `seidelSuspicion` – Seidels Verdacht.
- `ralfTrust` – Ralfs Vertrauen in Jan.
- `networkCredibility` – Jans Glaubwürdigkeit in seiner Netzrolle.
- bei Bedarf eigene NPC-Beziehungen für zusätzliche Figuren.

Sichtbar werden **nur erzählerische Symptome**: der Ton von Nachrichten, Verhalten und Anrufe. Keine Prozente oder Balken in der Spieleroberfläche.

---

# 10. Spielzeit, Alltag, Konsequenzen

## 10.1 Aktionsbasierte Uhr [FEST]

- Uhr steht still, solange der Spieler denkt oder Text liest.
- Definierte Handlungen kosten Minuten; `WARTE` und `SCHLAFE` springen weiter.
- Freitag bis etwa 7–10 Tage später; tageszeit- und wochentagsabhängige Ereignisse.
- Der Browser darf durch Animationen **keinen unkontrollierten Ingame-Zeitverlust** verursachen.
- Eine nicht verpassbare Schlüsselinformation braucht Wiederholungs-/Alternative-Zugänge oder rechtzeitige Warnung.

## 10.2 Alltagsmodell [FEST]

- Schule an Werktagen als erzählerisch simulierter Zeitblock (keine externen Schulraum-Level).
- Schlaf und gelegentliche Mahlzeiten, aber **keine ständige Hunger- oder Müdigkeitsleiste**.
- Eltern, Telefonkosten, Taschengeld und Alltagskontakte beeinflussen den Verlauf.
- Ralf ist wegen Training, Schule und Familie nicht jederzeit erreichbar.
- Normale Unterbrechungen können Informationen liefern, statt nur Zeit zu verbrauchen.

## 10.3 Fehler und Konsequenzen [FEST]

- Regelfall: nachvollziehbare Folgen mit alternativen Lösungswegen.
- Mögliche Folgen: vorübergehende Accountsperre, wachsende Aufmerksamkeit, verlorenes Vertrauen, neue Auskunftswege, teuer gewordene Verbindungen.
- Wenige endgültige Game Overs nach wiederholt riskanten Entscheidungen, **vorher erkennbar angekündigt**.
- Keine willkürlichen Todesfallen, keine unwiderruflichen Rätsel-Sackgassen durch einen einzigen Tippfehler.

## 10.4 Interne Parameter [VORSCHLAG]

- Parameter als Integer `0..100`; *nur intern*.
- Schwellenwerte konfigurierbar und namentlich statt magischer Zahlen in Storydaten.
- Veränderungen nachvollziehbar im Debug-Log; niemals als Punktestand im Spiel anzeigen.
- Zeit- und Budgetlogik ebenfalls zentral konfigurierbar, damit Autoren Szenen anpassen können.

---

# 11. Inventar, Notizen und Hilfesystem

## 11.1 Physische Gegenstände [FEST]

- Gegenstände gehören zur Schreibtisch-/Zimmerwelt; der Spieler kann sie nehmen, ablegen, untersuchen, kombinieren und in Geräte einlegen.
- Inventar ist sichtbar, die physische Darstellung am Tisch ändert sich gegebenenfalls.
- Wichtiges Objekt kann nicht versehentlich ohne Wiederherstellung endgültig zerstört werden, wenn es für das Finale zwingend nötig ist.

## 11.2 Notizblock auf dem Tisch [FEST]

- Automatisch erkannte Fakten werden gesammelt (nur das, was Jan tatsächlich entdeckt hat).
- Spieler kann eigene Notizen erfassen, bearbeiten und löschen.
- Fakten lassen sich nach Personen, Orten/Kanälen, Codes und Verdachtsmomenten gruppieren.
- Spieler kann Verbindungen/Hypothesen markieren, z. B. `VERKNÜPFE GHOST MIT COMPUTERCLUB`.
- Hypothesen werden **nicht automatisch als wahr bestätigt**; Beweisstatus ist getrennt von Vermutung.

## 11.3 C64-Archiv [FEST]

- Jan besitzt eine virtuelle Archiv-/Datendiskette mit eigenem textbasiertem Programm.
- Abteilungen: Personen, Telefonnummern, Mailboxen, Nachrichten, Notizen und begrenzte Suche.
- Inhalte sind **innerhalb des C64** bedienbar und im geteilten Spielzustand gespeichert.
- Das C64-Archiv ist keine moderne Cloud-Datenbank; Suchfunktionen bleiben historisch plausibel und bewusst überschaubar.

## 11.4 Optionales Hilfesystem [FEST]

- `DENKE NACH` oder Notizhilfe.
- Drei Stufen: **Denkanstoß**, **konkreter Hinweis**, **ausführlichere Hilfestellung**.
- Nur auf ausdrücklichen Wunsch, abhängig von bekannten Fakten und aktuellem Rätsel.
- Kein direktes automatisches Ausführen der Lösung, keine vorweggenommenen Spoiler für noch nicht entdeckte Stränge.
- Hilfestufen für jedes Haupträtsel als Content-Datensätze bereitstellen.

---

# 12. Easter Egg: 1001 / INTRUDER

## 12.1 Verbindlicher Inhalt [FEST]

- In Jans Schreibtisch befindet sich eine **5,25-Zoll-Diskette**, auf dem Etikett steht lediglich `1001`.
- Sie enthält die **fiktive** Demo **`INTRUDER by 1001 FIGHTERS`**.
- Inspiration: reale frühe C64-Demos, insbesondere **ESCOS I** von **1001 Crew** aus 1986.
- Jan liebt diese Demo; auf Wunsch des Spielers schaut er sie sich begeistert an.
- Auf dem C64 erscheinen **mehrere typische Demo-Screens**, animierte Effekte, Laufschrift, Rasterfarben/Sprites, und im Hintergrund läuft **eigens komponierte, SID-inspirierte Musik**.
- Ein Screen gibt **unbeabsichtigt** einen Denkanstoß für ein anderes Rätsel. Die Demoentwickler haben **keine Spionagenachricht absichtlich versteckt**.
- Der Hinweis hilft, ist aber **nicht zwingend für den Fortschritt**.

## 12.2 Bevorzugte Umsetzung [VORSCHLAG]

- Mehrere umschaltbare/durchlaufende Demoscreens als eigene programmartige Anwendung im Monitor.
- Ein Screen zeigt Effekte oder Text **im/über den normalen Bildschirmrand hinaus**. Daraus kann Jan eine Idee zu versteckten Bildschirmbereichen oder einem ungewöhnlichen Anzeigetrick ableiten.
- Alternative: thematisch neutrale Laufschrift oder eine grafische Wiederholung, die Jan auf ein anderes Rätselprinzip bringt.
- Die **konkrete Hauptstory-Rätselverbindung ist noch nicht verbindlich ausgewählt**. Inhalt über eine konfigurierbare `hintLink`-Relation statt ein festkodiertes Plot-Geheimnis modellieren.
- Beispielreaktion beim Start: Jan sagt sinngemäß, er finde es unglaublich, was aus dem Brotkasten herauszuholen sei.

## 12.3 Audio-/Rechte-Regeln [ABGELEITET]

- Keine Einbettung originaler ESCOS-I-Dateien, der Namen echter Urheber als Autoren der fiktiven Demo, oder geschützter SID-Tracks ohne Freigabe.
- Eigene Grafiken und Musik **nur inspiriert vom historischen Stil**.
- Demo muss auch stumm erfahrbar sein; sichtbare Laufschrift/Untertitel tragen entscheidende Informationen.

---

# 13. Rätselgestaltung und Filmkultur

## 13.1 Grundregel [FEST]

- Kein Filmquiz, bei dem man reale Filme auswendig kennen muss.
- Filmzitate, VHS, Popkultur und C64-Demo-/Spielekultur bleiben **Rätselmaterial**, sind aber nicht mehr der alleinige Motor des verschwundenen-Jugendlichen-Plots.
- Ursprünglicher Plot „Oliver Brandt, seit 1982 verschwunden, QUOTE.BAS“ wurde **zugunsten der Spionagehandlung verworfen**. Er darf **nicht** versehentlich als Hauptgeschichte wieder eingebaut werden.
- Anspielungen besser **fiktiv/paraphrasiert** statt langer realer Filmzitate.
- Rätsel müssen vollständig aus Spielinformationen lösbar sein.

## 13.2 Typen [FEST]

- Passwort-/Schlüsselwortsuche aus Indizien.
- Mustererkennung in Agentennachrichten.
- Codes vergleichen, einfache Substitutionen/Tabellen, Reihenfolgen.
- Filmtitel/Anspielungen als Hinweise auf Ort, Zeit, Kategorie, Reihenfolge oder sozialen Kontakt (spielintern erklärbar).
- Diskettenverzeichnis, BASIC-Listing, versteckte Programmteile.
- Kombinierte Hinweise aus Radio, Telefon, Paket, Zeitschrift und C64.
- Dialogrätsel und Vertrauen in Beziehungen.
- Optionale eigene BASIC-Programme als **alternativer** Lösungsweg.
- Meta-Easter-Egg mit Demo als thematischer Denkanstoß.

## 13.3 Puzzle-Datenmodell [ABGELEITET]

Für jedes Rätsel:

- ID, Titel (intern), verknüpfter Strang, aktbezogene Freischaltung;
- für Spieler zugängliche Hinweise/Beobachtungen;
- Voraussetzungen und lösbare Aktionen;
- **mindestens eine** sicher machbare Hauptlösung und im Regelfall alternative Route;
- Auswirkung auf Zeit, Fakten, Netzwerk, Beziehungen;
- Hinweise in Stufen 1–3;
- Zustände `unknown`, `discovered`, `solving`, `solved`, ggf. `bypassed`;
- Test, dass notwendige Gegenstände/Personen zugänglich sind und kein Soft-Lock entsteht.

## 13.4 Kryptografie [FEST]

**Mittlere Komplexität mit freiwilliger Expertenebene**:

- Normale Spieler kombinieren bekannte Regeln und Schlüssel.
- Schwierige Berechnungen kann ein vorgegebenes C64-Programm übernehmen.
- Wer möchte, kann selbst BASIC nutzen, um den Lösungsweg zu verkürzen oder zu automatisieren.
- Keine Pflicht für modernes Kryptografie-Vorwissen oder externen Computer.

---

# 14. Benutzeroberfläche und UX

## 14.1 Grafikstil [FEST]

- **Detailreicher illustrierter Retro-Stil**, weder Fotorealismus noch komplett Pixel-Art.
- Warme Beleuchtung, glaubwürdige 80er-Gegenstände.
- **Leicht schräge, erhöhte Grundperspektive** auf den Schreibtisch.
- Klickbare Gegenstände und **wechselbare Detailansichten**.
- Bei Vergrößerung eines Geräts bleibt die Spielwelt erhalten.
- Spätere Ereignisse können sichtbare Objekte verändern (neues Paket, Brief, Diskette).

## 14.2 Layout auf Desktop [FEST/ABGELEITET]

- **Schreibtisch-Hauptfläche** mit auswählbaren Hotspots.
- **C64-Ansicht** mit Monitorinhalt und eigenständiger Texteingabe; ggf. per Klick groß.
- **Adventure-Protokoll** mit Beschreibungen, Gesprächs- und Ereignisausgaben.
- **Eigene Adventure-Eingabezeile**, außerhalb des Monitors.
- Zugängliche Bereiche für Inventar, Notizen, Uhr, ggf. Spielmenü.
- Vergrößerungsansichten für Telefon, Radio, Kassetten, Disketten und Notizblock.

## 14.3 Fokus- und Eingaberegeln [ABGELEITET]

- Klar markierter Eingabefokus (`C64` vs. `ADVENTURE`).
- `Enter` führt nur den jeweiligen fokussierten Befehl aus.
- C64-Display zeigt Terminalausgaben, keine automatisch eingestreuten Adventure-Erzählertexte; solche Texte stehen im Adventure-Protokoll.
- Fenster-/Gerätewechsel darf Modemverbindungen und laufende virtuelle Programme **nicht ohne Grund beenden**.
- Statusinformationen sollen nicht auf dem C64 als unhistorische Overlay-Elemente erscheinen, sondern in modernerer, aber zurückhaltender Spiele-UI außerhalb.
- Lokalisierung: Deutsche Umlaute im Adventure; C64 kann nachgebildete PETSCII-Optik verwenden und Eingaben normalisieren.

## 14.4 Mobile UX [FEST/ABGELEITET]

- Responsives Interface ab ca. 320–360 px Breite, Vollbildgeräteansichten.
- Adventure-Befehlseingabe immer schnell erreichbar.
- Schreibtisch als Hub, kein permanenter Zwang zu horizontalem Scrollen.
- Gesten/Klicks sind Ergänzung; **alle spielrelevanten Aktionen mit Text erreichbar**.
- Zoom, Schriftgröße, Kontrast, Untertitel und Audiolautstärke konfigurierbar.
- Bei geöffneter Bildschirmtastatur keine Überdeckung der aktiven Eingabe.
- Pausieren/fortsetzen von Demoanimationen nach Tabwechsel; Spielzeit bleibt aktionsbasiert.

## 14.5 Barrierefreiheit [ABGELEITET]

- Tastaturbedienbar; Fokusreihenfolge und sichtbarer Fokus.
- Bildschirmlesbare Beschriftung von Objekten/Hotspots und Adventure-Ausgaben.
- Reduzierte Animationen (`prefers-reduced-motion`), abschaltbares CRT-Flimmern.
- Hinweise nie ausschließlich in Farbe, Audio oder kaum lesbaren animierten Einzelbildern.
- Audio mit Textalternative und unabhängigem Lautstärkeregler.
- Anpassbare Textskalierung und Verzicht auf Blinkzwang.

---

# 15. Audiokonzept

## 15.1 Stil [FEST]

**Authentische 80er-Klangwelt mit einigen ausgewählten dramatischen Elementen**; nicht durchgehend orchestraler Soundtrack.

- C64-Tasten, 1541-Laufwerk, Tonträger.
- Wähl-/Besetzt-/Anruftöne und Modemsignale.
- Eigene SID-inspirierte Musik für Demo, ggf. Programme.
- Radio: fiktive Moderation und regionale Nachrichten, ggf. zeitabhängige Hinweise.
- Elternhaus: gedämpfter Fernseher, Stimmen, Küche, Außengeräusche.
- Einige gesprochene Telefonate, Radionachrichten und Tonbandaufnahmen.
- Strategische Stille für spätere Spannungsphasen.

## 15.2 Umsetzung [ABGELEITET]

- Kein Autoplay vor Nutzerinteraktion; Audio-Engine erst nach ausdrücklichem Nutzerereignis starten.
- Mix-Gruppen `ambient`, `device`, `music`, `voice`, `effects` mit separater Lautstärke.
- Untertitel/Transkripte für sämtliche inhaltlich relevanten Audios.
- Eigene oder rechtmäßig lizenzierte Assets; keine Übernahme historischer Popmusik/SID-Tracks als Standard.
- Fallback: vollständig stumm spielbar.

---

# 16. Speichern, Laden, Geld, Anzeigen

## 16.1 Sichtbare Werte [FEST]

- Spieltag, Datum und Uhrzeit.
- Jans verfügbares Geld (`DM`).
- Angefallene Telefonkosten.
- Inventar / verfügbare Disketten.
- Notizen und erkannte Fakten.

## 16.2 Unsichtbare Werte [FEST]

- Seidels Verdacht.
- Ralfs Vertrauen.
- Glaubwürdigkeit im Agentennetzwerk.
- Bei Bedarf weitere Beziehungen und verdeckte Operationsfortschritte.

## 16.3 Speichersystem [FEST]

- **Autosaves** nach wichtigen Meilensteinen und in angemessenen Abständen.
- **Manuelle** Slots via `SPEICHERN` / `LADEN` und Spielmenü.
- Speicherstände im Browser (IndexedDB oder geeignetes Storage-Backend), nicht nur in der aktuellen JS-Sitzung.
- **Export/Import** als Datei für Gerätewechsel.
- Datenmigration durch `schemaVersion`.
- Spielstand umfasst Uhrzeit, sämtliche Storyflags, Inventarpositionen, Datenträgerdateien, BASIC-Programme, Mailboxzustände, Beziehungen, Notizen und aktive Oberfläche, soweit sinnvoll.
- Autosave vor irreversiblen kritischen Ereignissen/Finalentscheidungen empfohlen.
- Virtuelle 1541-Disketten als **Spielobjekte** strikt von den Browser-Speicherdateien trennen.

## 16.4 Datenschutzhinweise [ABGELEITET]

- Standard: rein lokal gespeicherte Spielstände, kein Login.
- Kein echter Kontakt zu simulierten Mailbox-Nummern oder Geheimdiensten.
- Keine Übermittlung persönlicher Eingabetexte an externe Server ohne spätere ausdrückliche Änderung der Produktkonzeption.
- Importdateien validieren und auf Größen begrenzen.

---

# 17. Datengetriebene Story- und Ereignis-Engine

## 17.1 Architekturprinzip [ABGELEITET]

**Spiellogik von UI und Textinhalten trennen**. Alle Systeme verwenden einen einzigen vorhersagbaren Zustandsübergang, keine Storylogik direkt in React-Komponenten und keine frei ausgeführten Scripts aus Contentdateien.

- `parseAdventureInput`: Eingabe zu Intent.
- `parseComputerInput`: Eingabe zu C64-/Terminal-Operation.
- `validateAction`: Vorbedingungen überprüfen.
- `applyAction`: diskrete Effekte anwenden.
- `advanceGameClock`: aktivitätsabhängige Zeit.
- `resolveScheduledEvents`: fällige Ereignisse und Priorität.
- `renderOutputs`: Text, Audio, UI-Änderungen.
- `saveGame/loadGame`: serialisieren, versionieren, validieren.

## 17.2 Typisierte Datenstrukturen (illustratives TypeScript) [VORSCHLAG]

```ts
type GameMode =
  | 'desk'
  | 'device-detail'
  | 'c64-basic'
  | 'c64-program'
  | 'c64-terminal'
  | 'phone-dialog'
  | 'demo';

type FactId = string;
type FlagId = string;
type ItemId = string;
type EventId = string;
type PuzzleId = string;

type GameState = {
  schemaVersion: number;
  gameClock: string;       // ISO-like lokale Spielzeit, z. B. 1986-11-14T16:30:00
  mode: GameMode;
  activeDeviceId: string | null;
  currentConversationId: string | null;
  inventory: ItemId[];
  objectStates: Record<string, Record<string, unknown>>;
  flags: Record<FlagId, boolean | number | string>;
  knownFacts: FactId[];
  hypotheses: Array<{ subject: string; target: string; notes?: string }>;
  puzzles: Record<PuzzleId, 'unknown' | 'discovered' | 'solving' | 'solved' | 'bypassed'>;
  relationships: {
    seidelSuspicion: number;
    ralfTrust: number;
    networkCredibility: number;
  };
  moneyDm: number;
  phoneCostsDm: number;
  deskNotes: Array<{ id: string; text: string; createdAtGameTime: string }>;
  computer: {
    powerOn: boolean;
    basicLines: Record<number, string>;
    variables: Record<string, string | number>;
    loadedProgramId: string | null;
    insertedDiskId: string | null;
    diskImages: Record<string, VirtualDisk>;
    screenBuffer: string[];
    activeApp: string | null;
  };
  telecommunications: {
    lineBusy: boolean;
    connectedSystemId: string | null;
    currentUserHandle: string | null;
    messageReadIds: string[];
    messagePostedIds: string[];
  };
  scheduledEvents: Array<{ id: EventId; at: string; status: 'pending' | 'done' }>;
  history: Array<{ id: string; text: string; kind: 'story' | 'system' | 'dialog' }>;
  rngSeed: number;
};

type VirtualDisk = {
  id: string;
  label: string;
  writeProtected: boolean;
  files: Array<{
    name: string;
    type: 'PRG' | 'SEQ' | 'USR' | 'REL';
    blocks: number;
    appId?: string;
    textContent?: string;
    hiddenUntilFact?: FactId;
  }>;
};

type GameAction = {
  type: string;
  actor?: string;
  targetId?: string;
  topicId?: string;
  args?: Record<string, string | number | boolean>;
};

type ActionResult = {
  accepted: boolean;
  output: Array<{ channel: 'adventure' | 'c64'; text: string }>;
  timeCostMinutes: number;
  effects: GameEffect[];
  uiEffects?: Array<{ type: string; targetId?: string }>;
  audioCueIds?: string[];
};

type GameEffect =
  | { type: 'setFlag'; id: FlagId; value: boolean | number | string }
  | { type: 'discoverFact'; id: FactId }
  | { type: 'addItem'; id: ItemId }
  | { type: 'setObjectState'; id: string; key: string; value: unknown }
  | { type: 'changeRelationship'; id: 'seidelSuspicion' | 'ralfTrust' | 'networkCredibility'; delta: number }
  | { type: 'changeMoney'; deltaDm: number }
  | { type: 'scheduleEvent'; id: EventId; at: string };
```

**Wichtig:** Dies ist ein Architekturvorschlag, keine vorgeschriebene endgültige Syntax. Coding-CLI darf Details verbessern, muss aber Daten- und UI-Trennung sowie sichere Serialisierbarkeit bewahren.

## 17.3 Event-Engine [ABGELEITET]

- Trigger durch Aktion, Uhrzeit oder Kombination aus Fakten/Flags.
- Ereignisse eindeutig idempotent: ein einmaliger Anruf oder Paketeingang darf bei einem Reload nicht doppelt ausgelöst werden.
- Bei `WARTE 120 MINUTEN` sind alle Ereignisse im Intervall **chronologisch** zu verarbeiten, mit fairer Unterbrechung bei wichtigen Ereignissen.
- Kein Event darf nötige Storyinformationen endgültig verschwinden lassen, ohne dass es eine alternative Beschaffung gibt.
- Wiederholbare Alltagsereignisse getrennt von einmaligen Hauptstory-Events.

## 17.4 Debug-/Autorentools [VORSCHLAG]

Separat aktivierbare Developer-Konsole:

- Flags/Fakten/Beziehungen anzeigen, manuell setzen.
- Spielzeit setzen/fortschalten.
- An definierten Story-Meilenstein springen.
- Puzzle-/Event-Abhängigkeitsgraph prüfen.
- Alle erreichbaren Enden automatisiert untersuchen (so weit formal prüfbar).
- Debugfunktionen **nicht** im Produktionsspiel als versehentlich aktivierbare C64-Spielbefehle verfügbar machen.

---

# 18. Inhaltliche Produktion: Rätsel- und Inhaltsplan

## 18.1 Vertikaler Ausschnitt (MVP) – wirklich spielbar [FEST/ABGELEITET]

**Ziel:** In ca. 15–30 Minuten alle Kernsysteme demonstrieren, ohne den gesamten Mystery-Plot zu spoilern.

**Inhalt:**

1. Startbildschirm mit `Neues Spiel`, `Laden`, `Einstellungen`.
2. Illustrierter interaktiver Schreibtisch mit C64/1541, Telefon, Schublade, Notizblock, Radio.
3. Ralf ruft an; interaktive Fragen über das neue Spiel und seinen Stiefvater.
4. Ralf erscheint kurz und übergibt die kopierte Diskette; Hinweis auf Fußballtraining. Ralf geht wieder.
5. Spieler kann die Diskette untersuchen, in die 1541 einlegen und per C64 laden.
6. Authentisch angelehnter C64-BASIC-Prompt, Directory-Ausgabe, Start des Spiels.
7. Kleines, wiederholbares Spielintro mit versteckter Taste / Zeitpunkt und klarer, erschließbarer Möglichkeit zur Aktivierung.
8. Meldung `DISKETTE 2 EINLEGEN`; Jan hat diese nicht.
9. Erster Zugang zu einer **fiktiven geheimen Mailbox** oder glaubwürdig vorbereiteter Zugangsschritt.
10. Eine unverständliche codierte Nachricht, eine identifizierbare Alltagsspur und ein kleines lösbares erstes Rätsel.
11. Notizbuch aktualisiert sich; Spieler kann eine eigene Notiz hinzufügen und `DENKE NACH` benutzen.
12. Die Diskette `1001` ist optional in der Schublade und startet eine **erste, kurze funktionierende INTRUDER-Demo** mit mindestens zwei Screens und originalem Audioplatzhalter.
13. Ein Telefon-/Elternereignis zeigt die getrennte physische und digitale Simulation.
14. Manuell speichern, automatisch speichern, exportieren/importieren und korrekt fortsetzen.
15. Auf Desktop und Smartphone benutzbar; alle Pflichtaktionen per Text möglich.

**Definition fertig:** Der gesamte Ablauf ist **ohne Entwicklerkonsole, ohne Hardcoding-Bedienung außerhalb der UI und ohne unlösbaren Platzhalter** spielbar. Storyende des Ausschnitts darf „Fortsetzung folgt“ anzeigen; keine falsche Behauptung, dass 8–12 Stunden bereits implementiert sind.

## 18.2 Plan für das Vollspiel [VORSCHLAG – Inhalts-Backlog, keine fertig ausformulierten Rätsel]

Diese IDs sind **Arbeitsüberschriften** für den weiteren Puzzleausbau. Sie definieren noch keine verbindlichen Lösungen:

| ID | Strang | Puzzle-/Szenenidee |
|---|---|---|
| P01 | Prolog | Die richtige Diskette erkennen und starten |
| P02 | C64 | Verzeichnis und Dateitypen verstehen |
| P03 | C64 | Geheime Intro-Umschaltung entdecken |
| P04 | Netz | Zugangshinweis aus Programmausgabe verstehen |
| P05 | Netz | Erste verdeckte Nachricht finden |
| P06 | Archiv | Erstes wichtiges Indiz dokumentieren |
| P07 | Schlüssel | Bedeutung von Diskette 2 erkennen |
| P08 | Netz | Credibility-Problem ohne Verrat lösen |
| P09 | Film | Film-/Spielanspielung intern entschlüsseln |
| P10 | Telefon | Kontakt zu Ralf unter Zeitbedingungen finden |
| P11 | Alltag | Kosten-/Leitungsproblem sinnvoll behandeln |
| P12 | BASIC | Verdächtige Programmzeilen vergleichen |
| P13 | Netz | Unterschiede in zwei Textnachrichten finden |
| P14 | Ralf | Vertrauensbildendes Gespräch |
| P15 | Industrie | Zusammenhang zu Gütersloh aus Indizien erkennen |
| P16 | Radio | Zeitabhängige Meldung richtig einordnen |
| P17 | BTX | Seite anhand zulässiger Kennung finden |
| P18 | Schlüssel | Teilinformationen zur Schlüsselrekonstruktion kombinieren |
| P19 | Seidel | Falsche Spur von tatsächlichem Indiz unterscheiden |
| P20 | GHOST | Ersten anonymen Kontakt bewerten |
| P21 | Netz | Zugang zu zweitem relevanten System erhalten |
| P22 | Disk | Virtuelle Datei genau untersuchen |
| P23 | Code | Nachricht mit bekannter Codetabelle auflösen |
| P24 | Ralf | Persönlichen Hinweis plausibel nutzen |
| P25 | Militär | Regionalen Sachverhalt korrekt einordnen |
| P26 | Seidel | Hinweis auf Identität stützen/widerlegen |
| P27 | GHOST | Technische Spur mit persönlicher Formulierung verbinden |
| P28 | Operation | Zweck einer Terminnachricht rekonstruieren |
| P29 | Netzwerk | Kommunikationslücke deuten |
| P30 | Schlüssel | Ersatz für nicht vorhandene Originaldiskette herstellen |
| P31 | Familie | Elternkontakt als Chance oder Risiko behandeln |
| P32 | Finale | Erforderliche Beweisketten zusammenführen |
| P33 | Finale | Verantwortlichen Kontakt auswählen |
| P34 | Finale | Gegen Zeit-/Verdachtsdruck die letzte Entscheidung treffen |
| P35 | Finale | Verzweigten Ausgang erreichen |

Zusätzliche optionale Inhaltssorten: Computerclub-Gespräche, BTX-Kleinanzeigen, weitere Mailboxen, optionale Radioinhalte, zusätzliche Disketten, BASIC-Miniprogramme, Demotexte, Film-Fundstücke, alternatives Entschlüsseln, Archiv-Recherchen, Familienepisoden, versteckte Easter Eggs. **Diese Inhalte sind Ausbauziele, keine bereits geschriebene Story.**

## 18.3 Mindestanforderungen an jeden vollständigen Rätsel-Contentdatensatz [ABGELEITET]

- Spieler sieht Hinweis X durch eine erreichbare Aktion.
- Spieler kann nötige Eingaben mit bekannten Parserformulierungen ausführen.
- Mindestens ein unabhängiger Hinweis deutet auf das Lösungsprinzip.
- Lösen kann auf mindestens einer Route nachvollzogen werden.
- Alternative Route für kritische Storypfade.
- Drei abgestufte Hilfetexte (soweit Haupträtsel).
- Testbar auf Vorbedingungen, Soft-Lock und logische Chronologie.

---

# 19. Szenarien zum Qualitätstest

## 19.1 Adventure-Parser

**Gegeben** Diskette liegt auf Tisch, **wenn** `NIMM DISKETTE` eingegeben wird, **dann** liegt sie im Inventar.  
**Wenn** `HEB DIE DISKETTE AUF` eingegeben wird, **dann** folgt dasselbe Verhalten.  
**Wenn** mehrere Disketten erreichbar sind und `NIMM DISKETTE` unklar ist, **dann** kommt eine eindeutige Rückfrage.  
**Wenn** zuvor `UNTERSUCHE PAKET` und dann `ÖFFNE ES`, **dann** wird das Paket geöffnet.  
**Wenn** ein verbotener/unerreichbarer Gegenstand genannt wird, **dann** gibt es keine halluzinierte Aktion.

## 19.2 C64-Interpreter

**Wenn** in C64-Ansicht `LOAD"$",8` und `LIST` ausgeführt werden, **dann** zeigt das Display das Verzeichnis der tatsächlich eingelegten virtuellen Diskette.  
**Wenn** keine Diskette eingelegt ist, **dann** erscheint eine passende historische Fehlerreaktion.  
**Wenn** ein BASIC-Programm im Speicher ist und das Verzeichnis wie unter BASIC V2 geladen wird, **dann** wird die Überschreibung korrekt behandelt.  
**Wenn** ein einfaches BASIC-Programm mit `10 PRINT "HALLO"` und `RUN` gestartet wird, **dann** erscheint `HALLO` und der Vorgang hängt nicht.

## 19.3 Historische Schranken

**Wenn** Spieler `GOOGLE SUCHEN` eingibt, **dann** reagiert Jan/der Computer passend zur Zeit, ohne einen modernen Dienst zu öffnen.  
**Wenn** BTX gestartet wird, **dann** ist dafür die dafür definierte historische Ausrüstung vorhanden.  
**Wenn** die Leitung mit einer Mailbox verbunden ist, **dann** kann Jan dieselbe Leitung nicht parallel für normales Telefonieren verwenden.

## 19.4 Prolog und Demo

**Wenn** Ralf die Diskette bringt, **dann** erwähnt er Fußballtraining und bleibt nicht im Zimmer, um die Software gemeinsam zu untersuchen.  
**Wenn** Jan das Spielintro wiederholt und die richtige Interaktion ausführt, **dann** erscheint die Diskette-2-Anforderung, unabhängig von menschlicher Reaktionsgeschwindigkeit.  
**Wenn** `1001` gestartet wird, **dann** erscheinen mehrere Demo-Screens und eine eindeutig erkennbare Jan-Reaktion.  
**Wenn** Spieler die Demo nie startet, **dann** bleibt die Hauptgeschichte trotzdem lösbar.

## 19.5 Zeit / Events / Save

**Wenn** `WARTE 120 MINUTEN` verwendet wird, **dann** werden terminierte Ereignisse in richtiger Reihenfolge verarbeitet.  
**Wenn** der Browser neu geladen wird, **dann** bleibt der Spielstand konsistent.  
**Wenn** ein exportierter Spielstand importiert wird, **dann** stimmen Inventar, Uhr, Beziehungen, Notizen und Computerzustand.  
**Wenn** eine bereits verbrauchte Ereignis-ID erneut ausgewertet wird, **dann** gibt es kein doppeltes Paket/kein doppelt ausgelöstes Pflichtgespräch.

## 19.6 Mobile / Accessibility

**Wenn** Smartphoneansicht aktiv ist, **dann** sind C64 und Adventure-Parser getrennt und gut lesbar.  
**Wenn** Spielton stummgeschaltet ist, **dann** gibt es keinen Informationsverlust.  
**Wenn** reduzierte Bewegung konfiguriert ist, **dann** werden essenzielle Hinweise weiterhin zugänglich gemacht.

---

# 20. Technische Zielarchitektur

## 20.1 Stack [VORSCHLAG]

- **TypeScript** mit strikten Typen.
- **React + Vite** für Weboberfläche und Browser-Entwicklung (oder ebenso wartbare, klar begründete Alternative).
- CSS (eigene Tokens/Layouts), Canvas/SVG für C64-Grafik, Demo-Effekte und Hotspots nach Bedarf.
- **Zustandsmaschine/Reducer oder isolierte Game Engine**, nicht UI-getriebene Storylogik.
- **IndexedDB** für Spielstände und virtuelle Inhalte; alternativ initial lokalStorage bei geringer Datenmenge, später migrationfähig.
- **Web Audio API** für einfache Synthese/Abspielen originaler Geräusche und Musik.
- **Vitest** für Parser, State, Events, Save; **Playwright** für End-to-End Desktop/Mobile.
- Kein Backend im MVP erforderlich; kein Nutzerkonto und kein echter Telco-Zugang.

## 20.2 Beispiel-Projektstruktur [VORSCHLAG]

```text
rewind-1986/
├── README.md
├── docs/
│   ├── GDD.md
│   ├── HISTORICAL_NOTES.md
│   ├── STORY_OPEN_QUESTIONS.md
│   ├── CONTENT_AUTHORING.md
│   └── ROADMAP.md
├── public/
│   ├── art/
│   ├── audio/
│   └── fonts/                 # nur zulässige Assets, keine Weitergabe von Fontdateien
├── src/
│   ├── app/
│   ├── engine/
│   │   ├── state/
│   │   ├── actionResolver/
│   │   ├── events/
│   │   ├── time/
│   │   ├── save/
│   │   └── rules/
│   ├── parser/
│   │   ├── adventure/
│   │   └── computer/
│   ├── sim/
│   │   ├── basic/
│   │   ├── disks/
│   │   ├── modem/
│   │   ├── btx/
│   │   ├── mailboxes/
│   │   └── demo/
│   ├── content/
│   │   ├── scenes/
│   │   ├── dialogue/
│   │   ├── events/
│   │   ├── items/
│   │   ├── puzzles/
│   │   ├── networks/
│   │   └── text/
│   ├── ui/
│   │   ├── desk/
│   │   ├── c64/
│   │   ├── adventure/
│   │   ├── devices/
│   │   ├── notebook/
│   │   └── menu/
│   ├── audio/
│   ├── types/
│   └── tests/
└── e2e/
```

## 20.3 Inhalt als Daten [ABGELEITET]

Dialoge, Nachrichtentexte, Disketten, Rätselregeln und Kalenderereignisse nach Möglichkeit in versionierten, deklarativen, strukturierten Contentdateien definieren (TS/JSON mit Schema-Validierung). Keine Storyverzweigung direkt an 15 Stellen in Komponenten verteilen. Ein Autoren-Workflow soll neue Mailboxen, Szenen und Rätsel hinzufügen können, ohne das UI zu verändern.

## 20.4 Sicherheit und Robustheit [ABGELEITET]

- Keine echte Codeausführung von beliebigem C64-/BASIC-/Mailbox-Text auf dem Host.
- BASIC-Interpreter wird isoliert und auf Ressourcen begrenzt.
- Spieltexte bei der Anzeige nicht als unbereinigtes HTML ausführen.
- Export-/Importdaten schema-validieren und gegen schädlich große oder fehlerhafte Dateien absichern.
- Keine echten fremden Telefonnummern in die Simulation übernehmen, wenn im Spiel der Anschein eines realen Kontaktwegs entstehen könnte.
- Determinismus wichtiger Ereignisse: gleiche Spielstände + gleiche Eingaben = gleicher Verlauf (sofern bewusst definierte Pseudozufallsereignisse denselben Seed verwenden).

---

# 21. Umsetzungsphasen und Abnahme

## Phase 0 – Repository-Grundlage [VORSCHLAG]

- Projekt initialisieren, README und GDD integrieren.
- TypeScript-Qualitätsstandards, Tests, Build und Lint einrichten.
- Content-Schemas und State-Versionierung definieren.
- Offene Storyfragen explizit dokumentieren.

**Abnahme:** Projekt baut und testet auf leerer Story-Engine; keine impliziten externen Dienste.

## Phase 1 – Schreibtisch & Parser [VORSCHLAG]

- Desktop-/Mobile-Hub und Geräteansichten.
- Adventure-Parser, Objektzustände, Inventar, Erzählprotokoll.
- Klare Fokus-/Eingabetrennung.

**Abnahme:** Gegenstände lassen sich per Text und Click wählen, alle Zustandsänderungen bleiben konsistent.

## Phase 2 – C64 & Disketten [VORSCHLAG]

- BASIC-Bildschirm und relevante Befehle.
- Diskettenformate, virtuelle Dateien, Start des unveröffentlichten Spiels.
- Begrenzter, getesteter BASIC-Interpreter.

**Abnahme:** Verzeichnis, Laden, einfache BASIC-Programme und Spielintro funktionieren.

## Phase 3 – Prolog & Vertikaler Ausschnitt [VORSCHLAG]

- Ralfs Anruf und persönliche Übergabe, Fußballtraining.
- Geheimmodus und Diskette 2, erste Mailbox, erste Rätsel.
- Notizen, drei Hilfestufen, erstes Zeit-/Elternereignis.

**Abnahme:** 15–30 Minuten spielbarer End-to-End-Ablauf ohne Entwicklerwerkzeuge.

## Phase 4 – Netze, Audio und Demo [VORSCHLAG]

- Allgemeines Mailbox-System, BTX-Engine, Telefonkosten.
- `1001`/INTRUDER in mindestens zwei Screens plus lizenzfreier/eigener Ton.
- Audio-Einstellungen, stumme Textalternative.

**Abnahme:** optionale Demo vollständig erreichbar, Mailbox- und BTX-Zustände werden gespeichert.

## Phase 5 – Storyproduktion Vollspiel [VORSCHLAG]

- Akte 2–6, 4–6 Stränge, alle Haupträtsel, Beziehungs-/Verdachtsbögen.
- GHOST-Identität und operationale Finaldetails **vorher dramaturgisch festlegen**, nicht in Code improvisieren.
- 3–5 Enden, unterlegte Beweisketten, durchgespielte Alternativrouten.

**Abnahme:** belastbare Inhaltstests/Manuell-Playtests, keine Hauptstory-Softlocks.

## Phase 6 – Qualität und Veröffentlichung [VORSCHLAG]

- Historisches Fact-Checking, Audio-/Grafikrechte, Textkorrektur.
- Performance und Accessibility, Testgeräte Desktop/Mobile, Save-Migration.
- Installer-/PWA-Option optional, keine Voraussetzung.

**Abnahme:** verständliche Anleitung, solide Stabilität, tatsächlich erreichbare Enden.

---

# 22. Noch offene Entscheidungen – nicht ohne Rücksprache kanonisieren

1. **GHOST:** bürgerliche Identität (Computerclub-Betreuer empfohlen, nicht entschieden).
2. **GHOST:** Wann erkennt GHOST, wer hinter Jans Netzkennung steckt? Die vorletzte Gesprächsfrage dazu blieb unbeantwortet.
3. **GHOST:** Konkreter britischer Kontakt/Geheimdienst und persönliche Motive.
4. **Operation REWIND:** Exakter Zeitplan, Art der Informationen, genauer Termin, Identität des auszuschleusenden Agenten, Mechanik und Ort des Finales.
5. **Unveröffentlichtes Spiel:** Titel, Genre, Intro-Grafik, konkret versteckte Taste und der faire Weg ihrer Entdeckung.
6. **Diskette 2:** Verbleib und exakte Rekonstruktionsmethode der Schlüssel.
7. **Jan/Ralf/Eltern:** zusätzliche Biografien, Namen der Eltern, Familienname Ralfs.
8. **Startdatum:** genaues Freitagsdatum im Herbst 1986; Datumsbeispiel ist Entwickler-Default.
9. **Mailbox-Namen, Sysops und BTX-Angebote:** konkrete Content-Entwürfe auszuarbeiten.
10. **Filmzitate:** genaue Menge und Zuordnung zu Rätseln (als sekundäres wiederkehrendes Motiv beschlossen).
11. **INTRUDER-Hinweis:** konkretes Haupt-/Nebenrätsel, auf das der unabsichtliche Screen verweist.
12. **TV/VHS/Datasette:** Umfang des Ausbaus gegenüber Radio, Telefon, Floppy, BTX.
13. **Graphik und Audio:** konkrete Illustrationen, Sprecher, Musikkomposition, Rechtefreigabe.
14. **BASIC-Teilmenge:** endgültige Erweiterungen jenseits des Mindestkerns und die Grenze historisch korrekter Fehlermeldungen.

**Programmierregel:** Offene Entscheidungen als Content-Konfiguration, Platzhalter und TODOs darstellen. Keine zufällig erfundenen endgültigen GHOST-Enthüllungen oder großen Operation-Details in die Release-Story schreiben.

---

# 23. Akzeptanzkriterien für das Gesamtsystem

Das Projekt erfüllt das Architekturziel, wenn:

- [ ] der Spieler Browser/Smartphone ohne separate Installation verwenden kann;
- [ ] Jan nur innerhalb der festgelegten Schreibtisch-/Zimmerstruktur handelt;
- [ ] der Prolog Anruf, knappe Übergabe und Ralfs Fußballtraining zeigt;
- [ ] Adventure-Parser und C64-Eingabe unabhängig und kontextsensitiv funktionieren;
- [ ] echte C64-Kommandos und passende vereinfachte Alternativen funktionieren;
- [ ] Programme, Disketten, BASIC, virtuelle Mailboxen und BTX datengetrieben erweiterbar sind;
- [ ] die zweite Diskette nicht Voraussetzung für die ersten Netzaktivitäten ist;
- [ ] 1001/INTRUDER optional, spielbar und stumm verständlich ist;
- [ ] Hinweise, Schlüsseldaten und Mailboxen keine unlösbaren externen Wissensfragen stellen;
- [ ] Ralfs Vertrauen, Seidels Verdacht und Netzglaubwürdigkeit intern geführt, aber nicht als Prozentwerte angezeigt werden;
- [ ] die Uhr aktionsbasiert verläuft, Zeitereignisse zuverlässig auslöst;
- [ ] Notizblock, Archiv und optionale drei-stufige Hilfe existieren;
- [ ] Save/Load, Export/Import und Autosave den vollständigen Zustand sichern;
- [ ] zentrale Mechanikfunktionen durch automatisierte Tests abgedeckt sind;
- [ ] das Spiel vollständig ohne Ton lösbar bleibt;
- [ ] reale Firmen/Orte nur als historisches Umfeld genutzt werden;
- [ ] nicht beschlossene Storydetails nachvollziehbar offen bleiben;
- [ ] das Repository dokumentiert, welche Inhalte im MVP funktionieren und welche erst für das Vollspiel geplant sind.

---

# 24. Beispiel: Erster spielbarer Ablauf (Referenz, noch kein endgültiges Dialogskript)

**Adventure-Protokoll:**

```text
Freitag, Herbst 1986. Rheda-Wiedenbrück.

Auf deinem Schreibtisch stehen dein Commodore 64,
ein 1541-Laufwerk, ein Telefon und ein Radio.
Aus dem Wohnzimmer dringen gedämpfte Fernsehstimmen.

Das Telefon klingelt.

> NIMM HÖRER
RALF: "Jan? Ich habe was, das musst du sehen.
       Ein Spiel, das es noch gar nicht zu kaufen gibt!"

> FRAGE RALF NACH DEM SPIEL
RALF: "Mein Stiefvater hat eine Arbeitsdiskette da.
       Ich hab mir nur schnell eine Kopie gemacht."

> FRAGE RALF NACH SEIDEL
RALF: "Wenn der das merkt, gibt's Ärger.
       Ich bring dir die Diskette gleich vorbei.
       Muss aber sofort weiter zum Fußballtraining."

[Etwas Spielzeit vergeht.]

Es klingelt an der Haustür. Wenig später hält dir Ralf
im Türrahmen eine Diskette hin.

RALF: "Bitte, hier. Und kein Wort zu meinem Alten!
       Bis morgen!"

> UNTERSUCHE DISKETTE
Eine beschriftete 5,25-Zoll-Kopie.
Der Titel ist noch provisorisch.

> LEGE DISKETTE IN LAUFWERK
Die 1541 schnappt zu.
```

**C64-Monitor (eigene Eingabe):**

```text
**** COMMODORE 64 BASIC V2 ****
 64K RAM SYSTEM  38911 BASIC BYTES FREE

READY.
LOAD"$",8
SEARCHING FOR $
LOADING
READY.
LIST
... VERZEICHNIS DER KOPIERTEN SPIELEDISKETTE ...
READY.
```

Nach passendem Laden des Programms folgt das wiederholbare Intro. Das geheime Umschalten wird **nicht** durch unvorhersehbares Zufallsglück des realen Spielers erzwungen. Nach Aktivierung fordert das Programm `DISKETTE 2` an, die nicht vorliegt. Daraus wird die Suche nach dem versteckten Terminalzugang eingeleitet.

---

# 25. Übergabehinweise für Coding-CLIs

1. **Diese Datei ist die Source of Truth** für bereits entschiedene Features. Nicht zu früh die gesamte 8–12-Stunden-Story „automatisch ausfüllen“.
2. Zuerst **Verzeichnisstruktur, Tests und vertikalen Ausschnitt** bauen.
3. Bei offenen Punkten mit neutralen konfigurierbaren Namen arbeiten (`TBD`), ohne zu behaupten, eine Storyentscheidung sei getroffen.
4. Historisch plausible Simulation priorisieren: besser wenige korrekte C64-Befehle als eine breite, inkonsistente Pseudoemulation.
5. **Alle** für die Spiellösung notwendigen Informationen sind im Spiel erreichbar; Debug-Menü ist kein Lösungsweg.
6. Vor jedem neuen größeren Feature Tests bauen/aktualisieren; Projekt nach Entwicklungsabschnitten weiter lauffähig halten.
7. Nach jedem Schritt dokumentieren: gebaut, getestet, bewusst nicht gebaut, noch unklar.
8. Keine echten Agenten- oder Militärdaten; fiktive Netzwerke und harmlose Rätseldaten.

**Empfohlene Arbeitsweise:** Für Codex oder Claude Code in Etappen implementieren: zuerst MVP, danach modulweise Erweiterungen anhand des GDD. Das vermeidet einen untestbaren, monolithischen Erstversuch.

---

*Ende – GDD/Pflichtenheft Version 1.0.*

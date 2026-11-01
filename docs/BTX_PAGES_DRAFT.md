# BTX-Entwurf: Anbieter „Wiedenbrücker Kurier“ (fiktiv)

> **Umgesetzt** in `src/content/btx.ts` – mit Abweichungen: Der Entwurf diente als Ideensammlung. Texte wurden
> überarbeitet (Rechtschreibung, 40 Spalten, kein Verweis auf REM-Zeilen auf der Tafel, kein Sturmtief-Name), die
> Mitteilungstafel ist die Clubtafel \*123770#, und die Seite „Post-Service“ entfällt. Maßgeblich ist der Code.

**Status:** Inhaltsentwurf für Punkt 7 des Ausbauplans. Alle Seitenadressen sind fiktiv;
keine realen Anbieter, keine realen Meldungen (GDD §2.2, §20.4).
Historisch geprüft werden müssen noch: genaue Adressformate, Zugangsnummern,
Seitengebühren und Titel-Layouts (`needs_research` im jeweiligen Abschnitt).

Zugang im Spiel: geliehene **Vereins-Teilnehmer-Kennung des Computerclubs Wiedenbrück**
(plausibel, weil Vereinsanschlüsse 1986 üblich waren – `needs_research` für Tarifdetails).
Das Seitenkopffeld zeigt daher immer: `TEILNEHMER: COMPUTERCLUB WD-86`.

Darstellungshinweise gelten für den Renderer (CEPT-ähnlich): Farbbalken-Headlines,
Mosaik-Wärmebild, maximal 24 Zeilen à 40 Zeichen; Zeilenlängen sind hier einzuhalten.

---

## Seite \*123000# – Übersicht

```
╔══════════════════════════════════════╗ (Render-Hinweis: Mosaik-Kopfband blau)
  BTX WIEDENBRUECKER KURIER
  Fuer die Teilnehmer des Computerclubs

  1 NACHRICHTEN
  2 WETTER
  3 FERNSEHPROGRAMM
  4 KLEINANZEIGEN
  5 MITTEILUNGSTAFEL
  6 COMPUTER-ECKE
  7 POST-SERVICE (GEBUEHREN/HILFE)
  9 WAS IST BTX? (HILFE)

  WAHL: ZIFFER ODER *123000#
```

Links: 1→*123100#, 2→*123200#, 3→*123300#, 4→*123400#, 5→*123500#, 6→*123600#, 7→*123700#, 9→*123900#, 0→(bleibt)

---

## Seite \*123100# – Nachrichten (tagesabhängig)

Wahl der Unterseite je Spieltag (Fr 14.11. = a, Sa 15.11. = b … Fr 21.11. = h). Immer gleiches
Skelett: drei Kurzmeldungen + Lokalsport. Keine Namen von Figuren des Spiels.

### a · Freitag, 14.11.1986

```
NACHRICHTEN HEUTE:
- KREISTAG EINIG UEBER FEUERWEHRETAT
- B61 IN WIEDENBRUECK: HAVARIE
  VERURSACHT STOSSVERKEHR
- WIEDENB.: SCHULBUSFAHRPLAN NEU ABG
  1. DEZEMBER
LOKALSPORT: C-JUGEND GT SÜD GEWINNT
6:2 IN RITEBERG
```

### b · Samstag, 15.11.

```
FUSSBALL-SAMSTAG: KLASSEN 6-8
ALLE SPIELE IM KREIS ABGSAGT WEGEN
NEBELAUFLOESEN; MORGEN TERMINE
WIE GEPLANT.
WIEDENB.: BAUHAUS-DONNERSTAG
BLEIBT. POLIZEI SUCHT ZEUGEN NACH
FAHRERFLUCHT AM BAHNHOF.
```

### c · Sonntag, 16.11.

```
RUHIGES WOCHENENDE. KRANZABWURF
ZUM TOTENSONNTAG AM STADTGARTER
RING. BUSNETZ GT ERHAELT ZWEI NEUE
LINIEN.
```

### d · Montag, 17.11.

```
GUETERSLOH: UNBEKANNTE SIND IN DIE
BUROS EINER SOFTWAREFIRMA EINGEDR.
POLIZEI: KEIN GROSSER SACH-SCHADEN;
TATZEIT WOCHENENDE. FIRMEN SPRECHER
NENNT KEINEN NAMEN. ERMITTLER:
"WIR GEHEN ALLEM NACH."
```

### e · Dienstag, 18.11.

```
FOLGENACHFRAGE IM GUETERSLOHER
EINBRUCH: VERMUTLICH REINE SPIELEREI
JUGENDLICHER. STAATSANWALT: "ES GIBT
KEINE TRAEGEBEWEISE."
KREIS: NEUE BUS-HALLE EROEFFNET.
```

### f · Mittwoch, 19.11. (Buß- und Bettag)

```
BUSS- UND BETTAG: GESCHAEFTE
GESCHLOSSEN; POLIZEI ERINNERT:
VORSICHT BEIM SUESSWARENKAUF. KEIN
UNTERNEHMEN IN GT SCHOSS ZU.
```

### g · Donnerstag, 20.11.

```
WIEDENB.: COMPUTERCLUB LADET ZUM
MONATS-ABEND IM JUGENDZENTRUM.
BTX: KUNDENZAHL WAECHST, VERBAND
ERWARTET 100.000 TNEHMER BIS 1987.
```

### h · Freitag, 21.11.

```
MET-DIENST WARNT: STURMFRONT
VERZIEHT SICH AUF NW; GLAETTE FOLGT.
GT: KEINE BESONDEREN VORFAELLE.
ENDE DES BTX-TAGES.
```

`needs_research`: genaue Meldungsformulierung im damaligen BTX-Ton; Lokalsport-Ergebnisse
sind bewusst fiktiv und wirken als Stimmung, nicht als Fakt.

---

## Seite \*123200# – Wetter (Deutscher Wetterdienst, tagesabhängig)

Render-Hinweis: Mosaik-Gebietskarte (Westfalen-Grobrisse), Farbband gelb/blau; Zahlenblock
weiß auf blau. Unterseiten a–h für Fr 14.–21.11.; Freitag 21.11. mit Sturmwarnung.

### a · Fr 14.11. `NEBLIG, SPÄTER AUSSICHT AUF SONNE. TAG 6, NACHT 1 GRAD. SW-WIND 3.`

### b · Sa 15.11. `WOCHENENDE WECHSELHAFT; ABEND REGEN. 5/0 GRAD.`

### c · So 16.11. `VIEL WOLKEN, GEGEBENFALLS SCHAUER. 6/2 GRAD.`

### d · Mo 17.11. `REGENFRONT VON W. 7/3 GRAD. VORSICHT GLAETTE AM MORGEN.`

### e · Di 18.11. `WAHRHAFT NOVEMBER: REGEN, WINDKALT. 8/4 GRAD.`

### f · Mi 19.11. (Buß- und Bettag) `TRUB; LOKAL NEBEL; NACHM. AUSSICHTEN FRUEHER TROCKEN. 6/2 GRAD.`

### g · Do 20.11. `SCHAUERFRONT, ABENDS STURMBOEN AUFKOMMEND. 9/3 GRAD.`

### h · Fr 21.11. `STURMTIEF BERND: SW, BOEN 10-11. NACH DUNKELWERDEN REGEN IM STURM: ABENDS 5 GRAD, GESCHAEFFTE GESCHLOSSEN.` _(Vorbereitungsstimmung für den finalen Abend – Spieler dürfen die Wetterlage planen lassen.)_

`needs_research`: exakte DWD-BTX-Terminologie 1986; Wind in Bft-Angaben oder km/h prüfen.

---

## Seite \*123300# – Fernsehprogramm (fiktiv; keine Sendungsmarken)

Unterseiten: a ARD, b ZDF, c WDR 3. Generische Programmblöcke nach Tagesabschnitt, damit
keine historischen Programmtabellen kopiert werden.

### a (ARD) – Spielwoche

```
ARD  ABEND:
18:00 REGIONALMAGAZIN
19:40 NACHRICHTEN
20:15 FAMILIENSERIE (FOLGE 8)
21:45 SPORT AUS DEM STADION
23:10 SPÄTMAGAZIN
```

### b (ZDF)

```
ZDF:
19:00 HEUTE-JOURNAL
19:25 RÄTSELSENDUNG
20:15 DOKU: "TECHNIK IM WANDEL"
22:00 THEATER AUS MUENSTER
```

### c (WDR 3)

```
WDR 3:
17:05 SCHULKURSE (PHYSIK)
18:00 ROCK IN DEUTSCHLAND
19:03 KLASSIK LIVE
20:15 KABARETT AUS AACHEN
```

`needs_research`: echte Sendezeiten 1986 erst nach Recherche; Titel bleiben generisch.

---

## Seite \*123400# – Kleinanzeigen

```
KLEINANZEIGEN, KOSTENLOS ZU LESEN:
- VERKAUFE COMMODORE-FLOPPY 1541-II,
  350 DM, TEL. 05223/1234 (ABENDS)
- SUCHE TAUCHPARTNER, TAUSCHE C64-
  PROG. GEGEN DTP-WISSEN? NEIN:
  GEMEINT: BASIC-LITERATUR.
- COMPUTERCLUB WD: MONATSKASSEN-
  OFFEN 20.11. IM JUGENDZENTRUM.
ANZEIGE AUFGEGEBEN AM 14.11.86
```

---

## Seite \*123500# – Mitteilungstafel (Story-Hook-Stelle)

```
MITTEILUNGSTAFEL – NUR LESEN.
[1] WILLKOMMEN NEUE TEILNEHMER!
    DER CLUB BEDANKT SICH BEI ALLEN,
    DIE MIT REDAKTIONELLEM PRAZISION
    IHRE SEITEN PRUEFEN.
[2] AN DEN GAST MIT DEN GUTEN
    FRAGEN: IHR WISSEN UEBER
    FARBCODES IN REM-ZEILEN IST
    SEHR GENAU. WIR SIND GESPANNT,
    WOHIN DIE SUCHE FUEHRT.
    – EIN FREUND DER CLUBMAILBOX
```

> TODO-STORY: Eintrag [2] ist die kryptische Brücke für Akt 3 (GHOST/Club), absichtlich vage,
> ohne Namen, ohne Handlung. Er ersetzt keine direkte Enthüllung und darf erst nach dem
> Clubabend vom 20.11. im Spiel wirken.

---

## Seite \*123600# – Computer-Ecke

```
RED. HINWEIS: BILD-SCHIRM-TEXT IST
KEIN GEWOHNLICHER ASCII-TEXT. ER
VERWENDET EIGENE SEITEN-CODES. MIT
* NUMMER # RUFEN SIE EINE SEITE
DIREKT. "0#" ZEIGT DIE UEBERSICHT.
WIR GRUSSEN DIE BIT-SCHUPPEN-MAILBOX!
```

---

## Seite \*123700# – Post-Service

```
BUNDESPOST BTX, GEBUEHREN:
- ANMELDUNG IM VEREIN: 8,00 DM/MON.
- SEITENGEBUEHR FREI: 0–20 PF.
- AUSKUNFT: *0130# (NEEDS_RESEARCH)
```

`needs_research`: historisches Tarifblatt der Bundespost (Anmeldung, Monatsgebühr,
Seitenpreise, Ortsgesprächszuschlag); Zugangsnummer bewusst fiktiv.

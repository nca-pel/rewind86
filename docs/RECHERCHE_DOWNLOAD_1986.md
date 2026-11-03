# Recherche: Dateien aus der Mailbox auf Diskette (C64, 1986)

Ziel: Der Mechanismus im Spiel soll so ablaufen, wie es am C64 plausibel war. Die Quellen sind überwiegend englischsprachig; für deutsche Verhältnisse (Akustikkoppler, Postmodem, 300 Baud) gibt es wenig zitierbares. Was nicht belegt ist, steht als **Annahme**.

## Was belegt ist

- Ein Terminalprogramm auf dem C64 empfängt Dateien über ein Übertragungsprotokoll. Auf Commodore-Boxen war **Punter (C1)** der Standard, daneben **XMODEM** ([Punter (protocol)](<https://en.wikipedia.org/wiki/Punter_(protocol)>), [CBterm](https://en.wikipedia.org/wiki/CBterm)).
- Bei XMODEM-Terminals gab es teils einen **Puffer im RAM**, den man nach der Sitzung auf Diskette speichern konnte ([XMODEM-Buffer-Handbuch](https://discmaster.textfiles.com/view/16616/Shareware%20Grab%20Bag.iso/001/xmobuf64.doc)). Nicht jedes Terminal hatte einen Puffer.
- Die Übertragung ganzer 1541-Disketten (rund 170 KB) bei 300 Baud war sehr langsam ([DiskSumo](https://git.catseye.tc/DiskSumo/blob/master/README.md?markup)).

## Annahmen für das Spiel

- 300 Baud ≈ 30 Zeichen pro Sekunde ≈ 7 Blöcke zu 254 Byte pro Minute. Die Gebührenuhr läuft mit.
- Eine **fabrikneue Diskette ist unformatiert**. Die 1541 muss sie mit `OPEN 15,8,15,"N0:NAME,ID"` (Kommandokanal) formatieren; der Befehl löscht alles darauf. Das ist durch die 1541-Dokumentation belegt, die Spieldauer von etwa zwei Minuten ist vereinfacht.
- Ein Download klappt nur mit Mitgliedsstatus, formatierter, nicht schreibgeschützter Diskette, freien Blöcken und freiem Dateinamen.
- Das Terminalprogramm (`TERMINAL` auf der Archivdiskette) gibt im Spiel das Punter-Protokoll als Meldung aus und schreibt die fertige Datei direkt auf die Diskette (kein RAM-Puffer).
- Jan hat ein Fünferpack Noname-Disketten in der Schublade (kein Einkauf im Spiel).

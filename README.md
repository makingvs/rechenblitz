# Rechenblitz ⚡ – Rechentraining im Zahlenraum 10

Offline-Web-App fürs iPad zum Automatisieren von Plus- und Minusaufgaben im ZR 10. Der Fokus liegt auf **Tempo** und **geschicktem Rechnen**.
Alle Daten bleiben **nur auf dem iPad** (IndexedDB). Es gibt keinen Server und kein Konto.

## Aufs iPad bringen (einmalig, ca. 10 Minuten)

1. Auf [github.com](https://github.com) ein kostenloses Konto anlegen und ein neues **öffentliches** Repository erstellen, z. B. `rechenblitz`.
2. Im Repository auf **„Add file → Upload files“** klicken und den **Inhalt** dieses Ordners hochladen:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - die Ordner `css`, `js` und `icons`
   
   Der Ordner `tools` wird nicht gebraucht.
3. **Settings → Pages**: Unter „Branch“ `main` und `/ (root)` wählen und speichern. Nach 1–2 Minuten ist die App unter `https://<name>.github.io/rechenblitz/` erreichbar.
4. Am iPad in **Safari** diese Adresse öffnen, dann **Teilen-Symbol → „Zum Home-Bildschirm“** wählen.
5. Die App ab jetzt **nur über das Symbol am Home-Bildschirm** starten. Sie läuft dann im Vollbild und ohne Internet.

> ⚠️ Die App am Home-Bildschirm hat einen eigenen Speicher. Daten aus einem normalen Safari-Tab tauchen dort nicht auf.

**Updates:** Geänderte Dateien einfach erneut hochladen. Das iPad holt sie beim nächsten Start mit Internet automatisch. In `sw.js` die `VERSION` erhöhen und neue Dateien in `FILES` eintragen.

## Erste Schritte

1. **⚙️ Für Erwachsene** öffnen und eine 4-stellige PIN festlegen.
2. Kinder anlegen: Name und Tier-Symbol wählen.
3. Das Kind wählt auf dem Startbildschirm sein Symbol und tippt **„Heute üben“**.

„PIN vergessen?“ lässt sich über zwei Einmaleins-Aufgaben zurücksetzen.

## Eine Einheit (25 Minuten)

| Teil | Dauer | Inhalt |
|---|---|---|
| 🔥 Aufwärmen | 3 min | fast nur sichere Aufgaben |
| 🧠 Üben | 7 min | aktuelle Strategie, mit Bild |
| 🤸 Bewegungspause | 1 min | |
| ⚡ Tempo | 5 min | gemischt, Sterne für schnelle richtige Antworten |
| 🌿 Atempause | 1 min | |
| ⚡ Tempo | 5 min | gemischt |
| 🏆 Abschluss | ca. 3 min | Ergebnis und Belohnung |

**Belohnung** (Ballonspiel, 2 Minuten): Dafür braucht es in den Tempo-Runden **mindestens 85 % richtig** und eine Verbesserung. Verglichen wird mit dem **eigenen** Schnitt der letzten 3 Einheiten, entweder beim Tempo oder bei der Anzahl richtiger Antworten pro Minute. Belohnt wird also der eigene Fortschritt, nicht der Vergleich mit anderen.

Entspannungsübungen sind immer verfügbar: Ballon-Atmen, Bewegungspause, Anspannen & Lockern.

## Didaktik

**Lernpfad**

Die nächste Strategie wird frei, sobald 80 % der Aufgaben der vorigen sicher sitzen (Box ≥ 3). Erwachsene können Strategien auch manuell freigeben.

1. 🖐️ **Kraft der 5**: Blitzblick auf Mengen, 5 + n
2. 🏠 **Zahlenhäuser**: Zerlegungen bis 10
3. 🤝 **Ergänzen auf 10**: die Zehnerfreunde
4. 👯 **Verdoppeln**: Halbieren, Nachbaraufgaben (4 + 5 = 4 + 4 + 1)
5. 🔄 **Tauschen & Umkehren**: große Zahl zuerst; Minus über Plus lösen
6. 🎲 **Alles gemischt**

**Bilder nur bei Bedarf**

Normalerweise wird **kein Bild** gezeigt, nur ein kleiner „💡 Hilfe“-Knopf. Bilder erscheinen nur in diesen Fällen:
- **Fehler oder Abzählen bei einer Aufgabe:** Das Bild bleibt bei dieser Aufgabe stehen, bis sie wieder zweimal schnell und richtig gelöst wurde.
- **Kind wird langsamer oder macht mehr Fehler** (≥ 2 Fehler in den letzten 6 Aufgaben oder deutlich langsamer als das Tempo-Ziel): Die Bilder werden kurz eingeblendet. Sobald es wieder fehlerfrei und im Tempo läuft, verschwinden sie.
- **Blitzblick-Mengen** (Kraft der 5) werden immer kurz gezeigt. Je sicherer das Kind ist, desto kürzer.

**Adaptivität**

- **Leitner-Boxen:** Jede Aufgabe hat eine Box von 1 bis 5.
- **Aufgabenmischung:** ca. 70 % sichere und 30 % unsichere oder neue Aufgaben. Neue Aufgaben kommen dosiert dazu, höchstens 3 gleichzeitig.
- **Wiederholung mit Abstand:** Lange nicht geübte Aufgaben werden bevorzugt.
- **Tempo-Ziel:** der eigene Median der letzten 60 richtigen Antworten minus 5 %. Es gibt **keinen sichtbaren Countdown**.
- **Zähl-Erkennung:** Ist ein Kind bei einer Aufgabe wiederholt mehr als doppelt so langsam wie sonst, erscheint der passende Strategie-Tipp mit Bild.
- **Fehler:** Nach einem Fehler werden die richtige Lösung, das Bild und ein Tipp gezeigt. Die Aufgabe kommt kurz danach noch einmal.
- **Fehleranalyse:** Viele Fehler genau um ±1 sind ein Hinweis auf Abzählen. Er erscheint in der Auswertung für Erwachsene.

## Gamification

- **Serie 🔥:** Alle 5 richtigen Antworten in Folge gibt es einen Bonus-Stern.
- **Erfahrungspunkte & Level:** Jede richtige Antwort bringt XP, jeder Stern doppelt, eine Belohnung +50. Die Level tragen Titel vom „Rechen-Küken 🐣“ bis zur „Rechenblitz-Legende 🌟“.
- **Tage-Serie 📅:** Wie viele Tage in Folge geübt wurde.
- **Rekorde:** Sterne pro Einheit, Tempo und längste Serie.
- **Abzeichen 🏅:** 18 Stück, z. B. Feuer-Serie, Fehlerfrei, Wochen-Held oder „Strategie gemeistert“.
- **Sticker-Album 📒:** Jede Einheit mit Belohnung bringt einen neuen Sticker (48 zum Sammeln).
- **Zwei Belohnungsspiele:** Ballonspiel und Memory.

Alles ist über „Meine Sammlung“ im Menü zu sehen.

## Bereich für Erwachsene

- **Übungsdauer** pro Kind: 10, 15, 20, 25 oder 30 Minuten.
- **Pausenlänge** pro Kind: 1, 2 oder 3 Minuten. Die Pausen werden nie gekürzt, auch nicht im Testmodus. Die Rechenzeit wird entsprechend angepasst, beträgt aber mindestens 40 % der Gesamtzeit. Die genaue Aufteilung wird direkt unter der Einstellung angezeigt.
- **Zeiten der Übungen:** Bewegung 15 s pro Anweisung, Anspannen 6 s und Lockern 10 s, Atmen 5 s ein und 5 s aus.
- **Spiele & Entspannung testen:** Ballonspiel, Memory und alle Entspannungsübungen direkt ausprobieren.

- **Überblick:** Einheiten, aktuelles Tempo, Hinweise
- **Verlauf:** Sekunden pro Aufgabe und Trefferquote, auch als Tabelle
- **Lernstand:** Heatmap aller Aufgaben (Plus, Minus, Ergänzen, Blitzblick)
- **Problemaufgaben**
- **Freigaben:** Lernpfad, Vorlesen, Töne
- **Sicherung:** Export und Import als JSON-Datei. Regelmäßig sichern, z. B. in iCloud Drive. Wird die App vom Home-Bildschirm gelöscht, sind auch die Daten weg.

## Erweiterungen (vorbereitet)

- **Zahlenraum 20:** Kraft der 10, Zehnerübergang, Zwanzigerfeld
- **Malreihen:** Kernaufgaben (1×, 2×, 5×, 10×), Hilfsaufgaben (6·7 = 5·7 + 7), Analogieaufgaben (3·4 → 3·40)

Neue Strategien kommen als Datei nach `js/strategies/`. Aufgaben-IDs haben das Format `typ:a:b`, und `mul` ist in `js/tasks/facts.js` bereits angelegt. Das Modul wird in `js/tasks/modules.js` aktiviert.

## Lokal testen

```
node tools/serve.mjs
```

Dann `http://localhost:8123` öffnen. Mit `?dauer=2` dauert eine Einheit zum Testen nur 2 Minuten.

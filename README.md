# Taxi Malik – Website

Statische, minimalistische Website mit scroll-gesteuerter Hero-Animation (GSAP + ScrollTrigger).

## Struktur

- `index.html` – Startseite (Hero, Leistungen, Kontakt-CTA)
- `impressum.html`, `datenschutz.html`, `kontakt.html`, `anfrage.html` – Unterseiten
- `assets/css/style.css` – gesamtes Styling
- `assets/js/main.js` – Scroll-Animationen, Navigation
- `assets/js/vendor/` – lokal eingebundenes GSAP + ScrollTrigger (Version 3.12.5)

Der Hero zeigt eine handgezeichnete SVG-Illustration eines gelben Taxis aus der Vogelperspektive
(kein Video) – ihre vier Türen öffnen sich synchron zum Scroll-Fortschritt (`index.html`, Element
`#taxiIllustration`; Steuerung in `assets/js/main.js`, Styling in `assets/css/style.css`).

## Lokal ansehen

Da die Seite per `fetch` lädt (GSAP-Dateien, Stylesheet), reicht Doppelklick auf `index.html` nicht
zuverlässig aus. Einen einfachen lokalen Server starten, z. B.:

```bash
npx serve .
```

und danach `http://localhost:3000` (oder den angezeigten Port) öffnen.

## Vor dem Live-Gang unbedingt erledigen

1. **Kontaktdaten prüfen**: Die Ordner-Inhalte enthielten widersprüchliche Angaben (drei
   verschiedene Telefonnummern, zwei verschiedene Postleitzahlen). Aktuell ist überall einheitlich
   eingetragen:
   - Adresse: Musterstraße 22, 65428 Rüsselsheim am Main
   - Mobil/Vorbestellung: 0176 55 66 77 88
   - Festnetz (Impressum): 06142 – 12 34 56
   - E-Mail: info@malik-taxi-service.de
   - Steuernummer: 000/000/00000

   **Alles Platzhalter** – bitte durch die echten Geschäftsdaten ersetzen (in `index.html`,
   `impressum.html`, `datenschutz.html`, `kontakt.html`, `anfrage.html`, Footer).
2. **Datenschutzerklärung**: War im Quellordner leer und wurde als generische DSGVO-Vorlage neu
   geschrieben (`datenschutz.html`). Vor Veröffentlichung durch einen Rechtsanwalt/
   Datenschutzbeauftragten prüfen lassen und an tatsächlich genutzte Dienste anpassen.
3. **Anfrageformular**: `anfrage.html` hat aktuell keine Backend-Anbindung (kein Versand). Für
   echten Betrieb an ein Buchungssystem/E-Mail-Backend anbinden.

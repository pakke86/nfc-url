# Swish NFC & QR URL Generator 📲

En modern, responsiv webbapplikation för att snabbt och enkelt generera Swish-betalningslänkar och skriva dem direkt till NFC-taggar (t.ex. NTAG213, NTAG215) eller förhandsgranska som QR-koder.

## 🌟 Funktioner

- **Flera URL-lägen:**
  - 🌐 **Universell HTTPS-länk (`app.swish.nu`)**: Bäst för NFC-taggar – fungerar direkt på iPhone (iOS bakgrunds-NFC) och Android utan appar.
  - ⚡ **Direkt App-länk (`swish://`)**: Startar Swish-appen omedelbart.
- **Flexibel betalningskonfiguration:**
  - Bara telefonnummer (valfritt belopp och meddelande)
  - Nummer + fast/valfritt belopp
  - Nummer + meddelande
  - Nummer + belopp + meddelande
- **Snabbmallar (Presets):**
  - Bara nummer
  - Fika (35 kr)
  - Lunch (125 kr)
  - Loppis (Valfritt belopp)
  - Parkering (50 kr)
- **NFC Tag Minnesberäknare:**
  - Visar exakt byte-storlek och kompatibilitet för NTAG213 (144 bytes) och NTAG215 (504 bytes).
- **Web NFC Direkt-skrivare:**
  - Skriv direkt till NFC-taggar med ett klick via Chrome på Android.
- **Offline QR-kod:**
  - Genereras direkt i webbläsaren och kan laddas ner som PNG.
- **Swish Live Mockup:**
  - Visuell förhandsgranskning av hur skärmen ser ut för den som blippar taggen.

---

## 🚀 Publicera på GitHub Pages (Gratis webbsida)

Eftersom appen är skapad med ren HTML, CSS och Vanilla JavaScript (inga externa beroenden eller byggsteg) kan den publiceras direkt via **GitHub Pages**:

1. Skapa ett nytt repository på GitHub (t.ex. `swish-nfc-url`).
2. Ladda upp eller pusha källkoden till repot:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Swish NFC URL Generator"
   git branch -M main
   git remote add origin https://github.com/DITT_ANVANDARNAMN/swish-nfc-url.git
   git push -u origin main
   ```
3. Gå till ditt repository på GitHub &rarr; **Settings** &rarr; **Pages**.
4. Under **Branch**, välj `main` och mappen `/ (root)`, klicka sedan på **Save**.
5. Klart! Din sida blir tillgänglig online på:
   ```text
   https://DITT_ANVANDARNAMN.github.io/swish-nfc-url/
   ```

---

## 🛠️ Lokal körning

Öppna mappen i valfri webbläsare, eller starta en lokal server:

```bash
# Med Python:
python -m http.server 8080
```
Öppna sedan `http://localhost:8080/`.

---

## ⚖️ Ansvarsfriskrivning
Swish är ett registrerat varumärke som tillhör Getswish AB. Detta projekt är ett oberoende verktyg för att underlätta programmering av NFC-taggar och QR-koder.

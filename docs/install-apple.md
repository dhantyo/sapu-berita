# Sapu Berita on iPhone, iPad and Mac

Read Indonesian news without ads or "Baca Juga" link lists, with every page of an article merged into one. Free, no App Store. One Shortcut works on iPhone, iPad and Mac, and syncs through iCloud.

> **For the maintainer:** replace `ICLOUD_LINK` below with the Shortcut's iCloud link (see `apps/ios-shortcut/README.md`).

Menu names are shown as they appear on a device set to English, with the Indonesian name in brackets.

## Install (once, about a minute)

1. Open this link on your iPhone, iPad or Mac: **ICLOUD_LINK**
2. Tap or click **Add Shortcut** (*Tambahkan Pintasan*).
3. Allow the Shortcut to run scripts:
   - **iPhone and iPad:** **Settings → Apps → Shortcuts → Advanced** → turn on **Allow Running Scripts**
     (*Pengaturan → Apps → Pintasan → Lanjutan → Izinkan Menjalankan Skrip*).
   - **Mac:** in the **Shortcuts** app, menu **Shortcuts → Settings → Advanced** → tick **Allow Running Scripts**.
     Then in **Safari**: **Settings → Advanced** → tick **Show features for web developers**, then menu **Develop** → tick **Allow JavaScript from Apple Events**.

## Use

1. Open a news article in **Safari**. Supported: Detik, Kompas, Tribunnews (including its regional sites), CNN Indonesia, CNBC Indonesia, Liputan6, Merdeka, Suara, Okezone, Viva, iNews, JPNN, ANTARA, Republika, Bisnis.com, Tirto.
2. **iPhone and iPad:** tap **Share** (the square with an arrow) → **Sapu Berita**.
   **Mac:** click **Share** in Safari's toolbar → **Sapu Berita**.
   - The first time on each site, you're asked whether the Shortcut may access it. Choose **Always Allow** (*Izinkan Selalu*).
3. The clean article appears. **Aa** sets text size, font, light, sepia or dark theme, and language. **Asli** takes you back to the original page.

**iPhone tip:** in the Share sheet, scroll the action list to the bottom → **Edit Actions** (*Edit Tindakan*) → add **Sapu Berita** to Favourites, so it's always near the top.

## Updates

When a new version is out, a box appears above the article: **"Sapu Berita … sudah tersedia"** (is available). Tap **Update**, open the new Shortcut link, and choose **Replace** to swap out the old one.

Fixes for news sites arrive on their own, without updating the Shortcut.

## If nothing happens

- Make sure the article is open in **Safari**, not in the built-in browser of WhatsApp, Instagram or X. In those apps, use the Safari or compass button, or **Open in Safari**.
- Homepages and section pages (not articles) aren't cleaned, on purpose.
- Settings (text size, theme) are saved per site, so set them once on each news site.
- Something wrong with an article? **Aa → Laporkan** (report it) sends us the link.

## On Chrome, Brave or Edge on a computer?

There's also a browser extension that runs on its own, without tapping anything: see the [extension guide](../apps/extension/README.md).

## Privacy

Everything runs on your device. Sapu Berita has no server, no analytics, and doesn't know what you read. Once a day it downloads the latest version number and site rules from GitHub; nothing about you is sent. Turn it off under **Aa → Cek update**.

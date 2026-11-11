# Changelog

Versions follow [semver](https://semver.org). Every tag `vX.Y.Z` publishes a GitHub Release built from this file.

## [0.1.0-beta.3] - 2026-11-11

- Install page: the browser extension gets its own tab with a direct download and step-by-step install and update instructions.
- Install page and README say plainly that Sapu Berita is built with AI.

## [0.1.0-beta.2] - 2026-11-11

- **New look:** a modernist sans, Geist, is now Sapu Berita's voice for headlines, text and labels, the same on every device. It's built in, so it shows instantly and offline.
- **Aa → Serif** is now Merriweather and **Aa → Jelas** is Fira Sans (a humanist sans in the tradition of German public signage); both download only when chosen.
- Install page and Android setup use the same type.

## [0.1.0-beta.1] - 2026-11-11

First public beta.

**Baca berita bersih / Clean reading**
- 16 news sites supported: Detik, Kompas, Tribunnews (including regional sites), CNN Indonesia, CNBC Indonesia, Liputan6, Merdeka, Suara, Okezone, Viva, iNews, JPNN, ANTARA, Republika, Bisnis.com, Tirto.
- Removes ads, "Baca Juga" link lists, share buttons, newsletter and Google News prompts.
- Multi-page articles are merged into one page.
- Editor summaries ("Ringkasan Berita", "Poin Penting", "Baca 10 Detik") are shown as one tidy box.
- Embedded posts that belong to the story (X/Twitter, Instagram, TikTok, YouTube, Facebook) are kept as link cards.
- The outlet's own logo is detected from the site and recoloured for dark mode when needed.
- Settings: text size, font (serif, sans, extra-legible), light, sepia or dark theme, Indonesian or English interface.
- **Updates on its own:** once a day it checks for a new version and shows an Update button in the reader; site fixes arrive without reinstalling. Can be turned off.
- **Laporkan:** report a broken article from the reader, with the link and version filled in.

**Apps**
- **Android:** app that opens only news-site links (Open by default); every other link still goes to your browser.
- **iPhone, iPad, Mac:** a Safari bookmark (one button on Mac) and an Apple Shortcut, both always running the latest version.
- **Install page** on GitHub Pages that shows the right steps for your device.
- **Chrome, Brave, Edge (desktop):** browser extension, loaded unpacked.

**Known limits**
- Tempo (paywall), Kumparan, Sindonews and IDN Times are not supported yet.
- Android: since 30 September 2026, certified phones in Indonesia only install apps from Google-verified developers. Until Sapu Berita's developer registration is done, Android may block installing the APK.

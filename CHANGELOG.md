# Changelog

Versions follow [semver](https://semver.org). Every tag `vX.Y.Z` publishes a GitHub Release built from this file.

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

**Apps**
- **Android:** app that opens only news-site links (Open by default); every other link still goes to your browser.
- **iPhone, iPad, Mac:** Apple Shortcut, run from Safari's Share menu.
- **Chrome, Brave, Edge (desktop):** browser extension, loaded unpacked.

**Known limits**
- Tempo (paywall), Kumparan, Sindonews and IDN Times are not supported yet.
- Android: since 30 September 2026, certified phones in Indonesia only install apps from Google-verified developers. Until Sapu Berita's developer registration is done, Android may block installing the APK.

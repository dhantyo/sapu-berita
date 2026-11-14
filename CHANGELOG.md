# Changelog

Versions follow [semver](https://semver.org): MAJOR.MINOR.PATCH. While the version starts with 0, Sapu Berita is in beta; 1.0.0 is the public launch. Every tag `vX.Y.Z` publishes a GitHub Release built from this file.

The first four releases were published as 0.1.0-beta.1 to beta.4 and renamed on 2026-11-13 to the scheme below; the app files inside those releases still report their original beta names.

## [0.3.0] - 2026-11-14

- **Videos and posts play in the article:** YouTube, Instagram, TikTok, X and Facebook posts a story quotes now play inside the reader, using each platform's own player. Turn off "Putar media di artikel" in settings to get the old link card back.
- **Photo viewer:** tap a photo to see it full screen with its caption; swipe between the article's photos, pinch or double-tap to zoom, swipe down or tap ✕ to close. Built on [PhotoSwipe](https://photoswipe.com) (MIT).
- **Photo captions** that outlets write as a line under the photo ("… (Foto: dok Instagram …)", set as a heading on Detik) now show as captions instead of headings.
- **New settings:** "Tampilkan link" (off: links inside the article read as plain text) and "Kotak ringkasan" (off: hides the outlet's summary boxes such as Ringkasan Berita and Executive Brief).
- **The outlet logo opens the outlet's homepage** (the regional site for regional articles). "Asli" still opens the original article.
- **Bookmark settings follow you across an outlet:** a change made on news.detik.com now also applies on hot.detik.com, detikJabar and the rest of Detik (likewise for every Tribun regional site). Before, each subdomain started from the defaults. Different outlets still keep separate settings: browsers keep each site's storage apart.
- **Desktop Detik photo stories** (detikHot) open in the reader with all their photos and captions; before, the desktop layout was refused as too short.
- **Install page works again:** since 0.2.3 a typo in the English text stopped the page's script, so its tabs and buttons did nothing.
- **detik Rekomendit** (rekomendit.detik.com) product guides open in the reader, without the shopping cards.
- **Detik's newer layout** (wolipop.detik.com and other sections moving to it): the article is read from its own text block again, so the author credit no longer shows as the first paragraph.

## [0.2.4] - 2026-11-13

- **Bisnis.com:** the "Executive Brief" summary shows as a summary box; the related-links list in the middle of articles is gone; foto.bisnis.com photo stories open, photos included.
- **Author** shows on detikHot and foto.bisnis.com articles whose page data lists the author as "-" or blank.
- Gallery counters ("1 / 4") no longer show as text.

## [0.2.3] - 2026-11-13

Fixes from testing on real phones.

- **Logos:** each outlet shows its own logo again. On phones, Detik and Tribun put a screen-tall ad above the header, which hid the real logo from the finder; regional sites (detikKalimantan, detikJabar, Tribun Jogja) showed Detik's "20D" anniversary image or Tribun's video logo instead. Logos drawn as inline SVG (Tirto, Viva) are now used too, and when a logo's server doesn't allow reading it (Merdeka), the outlet's other logo on the page is tried before falling back to a plate.
- **Editor** shown when the outlet names one (Tribun, Kompas, ANTARA).
- **Datelines** ("Banjarmasin -") run into the first paragraph instead of sitting on their own line (Detik).
- **Tirto:** italic words in titles show as italics, not as `<i>` tags; the publish date shows.
- **iPhone bookmark:** run it from the Bookmarks list; from the address bar Safari refuses with "Cannot Run Script". Install page and Apple guide updated.

## [0.2.2] - 2026-11-13

*Published as 0.1.0-beta.4.*

- Install page, after testing with a first-time iPhone user: Android offers two options (the app, or a Chrome bookmark with nothing to install); the iPhone bookmark setup is three plain steps (copy the link, save this page as a bookmark, edit it); a separate guide explains how to use the bookmark (only on an article page, from the address bar, Asli goes back).

## [0.2.1] - 2026-11-11

*Published as 0.1.0-beta.3.*

- Install page: the browser extension gets its own tab with a direct download and step-by-step install and update instructions.
- Install page and README say plainly that Sapu Berita is built with AI.

## [0.2.0] - 2026-11-11

*Published as 0.1.0-beta.2.*

- **New look:** a modernist sans, Geist, is now Sapu Berita's voice for headlines, text and labels, the same on every device. It's built in, so it shows instantly and offline.
- **Aa → Serif** is now Merriweather and **Aa → Jelas** is Fira Sans (a humanist sans in the tradition of German public signage); both download only when chosen.
- Install page and Android setup use the same type.

## [0.1.0] - 2026-11-11

*Published as 0.1.0-beta.1.*

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

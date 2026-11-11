# Apple: Shortcut and Safari bookmark

Free distribution for iPhone, iPad and Mac, with no App Store and no developer account. Two ways in, one code path:

- **Shortcut**, run from Safari's Share sheet (iPhone, iPad, Mac), shared through an iCloud link.
- **Bookmark (bookmarklet)**, tapped from Safari's bookmarks or Favourites bar. On a Mac it's the recommended way (no Shortcuts permissions, no Develop menu). It works in any desktop browser too.

User-facing guide: [docs/install-apple.md](../../docs/install-apple.md). Install page (bookmark button, Shortcut link): `site/index.html`, published on GitHub Pages.

## Self-updating

Both run the same tiny **loader** (`dist/apple-loader.js`, about 300 characters, one line, no `#`). It downloads the latest core (`sapu-berita.js` on the release channel) and runs it:

```
Shortcut / bookmark ─► loader ─► fetch https://<owner>.github.io/<repo>/sapu-berita.js ─► (0,eval)(core)
```

So a new release reaches Apple users the moment the release job publishes the channel. Nobody re-adds the Shortcut; the Shortcut and the bookmark never change. The core skips the "update available" bar (`selfUpdating`), since it is always current.

Trade-offs, accepted on purpose:
- Each run needs the network to fetch ~130 KB (Safari caches it; GitHub Pages sends `max-age=600`). A news page needs the network anyway.
- Whoever controls the GitHub account and Pages controls the code that runs on readers' pages. Protect the account with 2FA.

Checked 2026-11-11 with headless Chrome on a sample article from each of the 16 sites: the loader fetches and runs the core, and the overlay renders. Bisnis.com's strict CSP doesn't apply to its article pages; CNN Indonesia's service worker passes the request through. If a site ever blocks it, the Shortcut answers `{ rendered: false, reason: "load …" }`.

## Making the Shortcut (once, on any iPhone, iPad or Mac, about 2 minutes)

No Apple device of our own is needed beyond these 2 minutes: anyone with an iPhone can do it.

1. Shortcuts app → **+** → name it **Sapu Berita**, pick an icon (ochre colour).
2. Shortcut details (ⓘ) → turn on **Show in Share Sheet**; under *Share Sheet Types* keep only **Safari web pages**.
3. Add the action **Run JavaScript on Web Page**; its input is *Shortcut Input*.
4. Replace the action's sample code with the contents of `dist/apple-loader.js` (one line). It is also at `https://<owner>.github.io/<repo>/apple-loader.js` once the channel is published, easy to open and copy on the phone.
5. Settings → Apps → Shortcuts → Advanced → turn on **Allow Running Scripts**.
6. Test on a Kompas article: Share → Sapu Berita.
7. Share menu of the Shortcut → **Copy iCloud Link**. Put it in `site/index.html` (`ICLOUD_SHORTCUT`) and `docs/install-apple.md`.

Apple doesn't allow importing unsigned `.shortcut` files, and signing needs a Mac (`shortcuts sign`). The iCloud link is the free path that works for everyone. It never needs to change, because the Shortcut only holds the loader.

## Offline / pinned variant

`dist/shortcut.b64.js` is the whole core, base64-wrapped (no `#`, no whitespace), for a Shortcut that must work without fetching. It does not update itself. Each release also attaches it as `sapu-berita-shortcut-<version>.js`.

## Behaviour

- Running the Shortcut or tapping the bookmark is an explicit request, so the clean view opens even when "open automatically" is off.
- The Shortcut always gets an answer within 8 s through `completion()`; the overlay keeps rendering after that (it lives in the page). A bookmark has no `completion`, and the core doesn't need one.
- Settings are stored in the page's `localStorage`, which Safari keeps **per site**: a reader who changes the font on Kompas sets it again once on Detik.

## Still to verify on a real device

- [ ] Shortcut: `completion` is reachable from code run by `(0,eval)` (expected: it's a global)
- [ ] Shortcut: time budget for fetch + run
- [ ] iOS bookmarklet from the address-bar suggestion
- [ ] `localStorage` persists between runs
- [ ] Overlay stays after `completion()` returns (expected: yes)

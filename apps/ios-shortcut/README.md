# iOS Shortcut

Free iOS distribution: an Apple Shortcut shared through an iCloud link. The reader runs it from Safari's share sheet on a news article. No App Store, no developer account.

User-facing install guide (Indonesian): [docs/install-apple.md](../../docs/install-apple.md) (iPhone, iPad, Mac).

## Build

`npm run build` produces two candidates (CI also uploads them as the `builds` artifact):

| File | What it is | Status |
|---|---|---|
| `dist/shortcut.b64.js` | the core, base64 inside `eval(atob(…))`: no `#`, no whitespace | **ship this one** |
| `dist/shortcut.js` | the same core, minified, contains `#` | backup if eval ever gets blocked |

Why the base64 one: forum reports say Shortcuts' JavaScript action breaks on `#` (iOS 17+) and slows down on whitespace (iOS 18.4+). Its only risk is a site whose Content-Security-Policy forbids `eval`. **Checked 2026-11-11: none of the five outlets restrict `script-src` or `img-src`** (Detik and Tribun only send `frame-ancestors`, CNN Indonesia, Kompas and Liputan6 send no CSP), so eval, the logo pixel reads and YouTube thumbnails all work. Re-check with the canary if an outlet adds a CSP.

## Making the Shortcut (once, by the maintainer, on an iPhone or Mac)

1. Shortcuts app → **+** → name it **Sapu Berita**, pick an icon (the broom glyph if available, colour: orange/ochre).
2. Shortcut details (ⓘ) → turn on **Show in Share Sheet**; under *Share Sheet Types* keep only **Safari web pages**.
3. Add the action **Run JavaScript on Web Page**; its input is *Shortcut Input*.
4. Replace the action's sample code with the full contents of `dist/shortcut.b64.js` (one long line).
5. Optional: add **Show Notification** after it only when you want debugging; the script's result is `{ rendered, reason }`.
6. Settings → Apps → Shortcuts → Advanced → turn on **Allow Running Scripts** (each user must do this too; the guide says so).
7. In the shortcut's share menu → **Copy iCloud Link**. Put that link in the install guide and the README.

Apple doesn't allow importing unsigned `.shortcut` files anymore, and signing needs a Mac (`shortcuts sign`). The iCloud link is the free path that works for everyone.

## Behaviour on iPhone

- Running the Shortcut is an explicit request, so it opens the clean view even when "open automatically" is off.
- The script always calls `completion()` within 8 s; the overlay keeps rendering after that (it lives in the page).
- Settings are stored in the page's `localStorage`, which Safari keeps **per site**: a reader who changes the font on Kompas sets it again once on Detik. A shared store would need a native app (the Safari-extension upgrade path).

## Updating

Rule changes (site layouts) reach users through the remote `rules.json` once `REMOTE_RULES_URL` is set at build time. Code changes need a new Shortcut version: update the action's code, and users re-add it from the same iCloud link.

## Still to verify on a real device
- [ ] Time budget actually available to the action (the script answers within 8 s regardless)
- [ ] `localStorage` persists between runs
- [ ] Overlay stays after `completion()` returns (expected: yes)
- [ ] Base64 variant runs on iOS 17 and 18.4+

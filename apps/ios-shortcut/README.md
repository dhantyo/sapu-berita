# iOS Shortcut

Free iOS distribution: an Apple Shortcut shared through an iCloud link. The user runs it from Safari's share sheet on a news article.

## Build

`npm run build` produces two candidates:

| File | What it is | Why |
|---|---|---|
| `dist/shortcut.js` | minified core | smallest and fastest; contains `#` characters |
| `dist/shortcut.b64.js` | the same code, base64 inside `eval(atob(…))` | no `#` and no whitespace, to dodge reported iOS 17 / 18.4 quirks; **may be blocked** on sites whose CSP forbids `eval` |

Test both on a real iPhone. Keep whichever works on all 5 outlets and delete the other from the build.

## Making the Shortcut (once, by the maintainer)

1. Shortcuts app → **+** → name it "Baca Bersih".
2. Shortcut details (ⓘ) → turn on **Show in Share Sheet**, accept types: **Safari web pages**.
3. Add the action **Run JavaScript on Web Page**, input: *Shortcut Input*.
4. Paste the contents of the chosen build file.
5. Settings → Apps → Shortcuts → Advanced → turn on **Allow Running Scripts**. Every user needs this too, so the install guide must say it.
6. Share → **Copy iCloud Link**. That link is what you distribute.

## Updating

Rule changes reach users automatically through the remote `rules.json` (when `REMOTE_RULES_URL` is set at build time). Code changes need a new Shortcut version, and users re-add it from the link.

## Open questions to verify on a device
- [ ] Time budget actually available (the script answers within 8 s regardless)
- [ ] Does `localStorage` persist between runs (remote rules cache)?
- [ ] Does the overlay stay after `completion()` returns? (Expected yes: it's in the page DOM)
- [ ] `#` / whitespace issues: which build variant works

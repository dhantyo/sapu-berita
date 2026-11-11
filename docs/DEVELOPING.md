# Developing Sapu Berita

One TypeScript core (`src/`) finds the article on a news page, merges its pages, cleans it and draws the reading overlay. Thin wrappers ship that core to each platform:

| Wrapper | Folder | Built file |
|---|---|---|
| Android app (WebView + document-start script) | [apps/android](../apps/android/README.md) | `app/src/main/assets/webview.js` |
| Apple Shortcut and Safari bookmark (iPhone, iPad, Mac) | [apps/ios-shortcut](../apps/ios-shortcut/README.md) | `dist/apple-loader.js` (loads `dist/shortcut.js` from the release channel) |
| Browser extension (Chrome, Brave, Edge) | [apps/extension](../apps/extension/README.md) | `apps/extension/content.js` |

Site knowledge lives in JSON, not code: `rules/sites/*.json` (one per outlet, hand-verified) and `rules/common.json` (junk patterns shared by all sites). Generic page merging for about 20 more outlets is imported from [AutoAllPage](https://github.com/reforget-id/AutoAllPage), ad selectors from AdBlockID and ABPindo.

## Setup

Node 22.18 or newer (runs the `.ts` tools directly), plus JDK 17 and the Android SDK for the app.

```bash
npm install
npm run import:autoallpage   # pagination rules for ~20 extra sites
npm run import:adblock       # ad selectors from AdBlockID + ABPindo
npm run check                # typecheck + tests (schema, matching, real-article fixtures)
npm run build                # every wrapper
```

Android APK: `cd apps/android && ./gradlew assembleDebug`.

## Everyday scripts

| Command | What it does |
|---|---|
| `npm run preview` | Local page (port 5178) that runs the real pipeline on saved fixtures. `?fx=<site>/<slug>&theme=dark` |
| `npm run probe -- https://www.example.com` | Samples live articles from a new portal and drafts a rule: body, junk, pagination. |
| `npm run capture -- <url>` | Saves a live article as a test fixture. |
| `npm run fixtures:pull` / `fixtures:push` | Restore or back up the saved news pages. They're the outlets' copyrighted work, so they live in a private repository (`sapu-berita-fixtures`), not here; without them the tests that need a saved page are skipped. |
| `npm run rebaseline` | Recomputes fixture expectations after a deliberate cleaning change. |
| `npm run canary` | Checks every site live, like the daily CI job. |

## Releasing

1. Bump `version` in `package.json` (the extension, the APK and the Shortcut all read it) and add a section to `CHANGELOG.md`.
2. Commit, then tag and push: `git tag v0.1.0-beta.2 && git push --tags`.
3. CI builds and signs everything and publishes a GitHub Release with the APK, the extension zip and the Shortcut script. Versions with a `-` suffix are marked pre-release.
4. CI also publishes the **release channel** to GitHub Pages: `update.json` (latest version and per-platform update links) and `rules.json` (site rules). Installed copies read both once a day: a newer version shows an "update available" bar in the reader; newer rules apply silently, so most site fixes need no app update. It also carries the Apple core (`sapu-berita.js`), which the Shortcut and the Safari bookmark download on every run, and the install page (`site/`).

One-time setup: Settings → Pages → Source: **GitHub Actions** (needs a public repository on the free plan). Pages URLs don't follow repository renames, so rename before the first release.

`update.json` may also carry `"report": "<url template>"` to point the in-app **Laporkan** button somewhere other than GitHub issues (for example a form that needs no account); placeholders `{url} {title} {site} {version} {platform}`.

The APK signing key is only in the repository's Actions secrets (`SAPU_KEYSTORE_B64`, `SAPU_KEYSTORE_PASSWORD`, `SAPU_KEY_ALIAS`, `SAPU_KEY_PASSWORD`). Keep a backup of the keystore: if it is lost, existing users cannot update and must reinstall.

## More

- [Architecture](ARCHITECTURE.md): the pipeline, wrappers, rule lifecycle
- [Writing rules](RULES.md): fixing a site after a redesign
- [Prior art](PRIOR-ART.md): what we reuse and why
- `PRODUCT.md`, `DESIGN.md`: product principles and the overlay's design system

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
| `npm run inspect -- <url> … [--dark] [--desktop] [--shot <folder>]` | Opens real links in your installed Chrome and runs the built reader on them, exactly as the Apple bookmark does: reports the logo it chose, meta row, summary box, leftover link lists, image count and first paragraph. Works on sites that block plain downloads (Bisnis, Tirto). Run `npm run build` first; `CHROME_PATH` picks another Chromium browser. |

### Fixing a site from a bug report

1. Reproduce: `npm run build && npm run inspect -- <the link> --shot shots`.
2. Decide where the fix belongs, most general first: a shared pattern in `rules/common.json`, a general rule in `src/` that describes how news sites behave (never `if site === …`), or the site's own JSON in `rules/sites/`.
3. Add a regression test with the real markup in miniature (`test/regressions.test.ts` has examples), and a fixture with `npm run capture` when the site allows it.
4. `npm run check`, then `npm run inspect` again on the same link.

## Versions

[Semantic Versioning](https://semver.org): **MAJOR.MINOR.PATCH**.

| Bump | When | Example |
|---|---|---|
| PATCH | Fixes only: a wrong logo, a broken site, a typo, install-page or docs changes | 0.2.2 → 0.2.3 |
| MINOR | Something users notice: new sites, new settings, a redesign | 0.2.3 → 0.3.0 |
| MAJOR | The public launch (1.0.0), and later only for big breaking changes | 0.x → 1.0.0 |

- While MAJOR is 0, the app is in beta; no `-beta` suffix is used.
- Site-rule fixes need no app update, but they still ship with a release: the release channel (and its `rules.json`) is published only from a version tag. Installed copies then pick the new rules up within a day.
- Android's `versionCode` is derived from the version (`app/build.gradle.kts`) and must keep rising, so never reuse or lower a version.

## Releasing

1. While working, note each user-visible change under `## [Unreleased]` at the top of `CHANGELOG.md`.
2. `npm run release -- 0.3.4` sets the version in `package.json` (the extension, the APK and the Shortcut all read it), dates the changelog section, builds, runs every check, commits, pushes, and pushes the one tag `v0.3.4` (tags go one at a time: GitHub starts no build when more than three tags are pushed together). `--dry-run` stops after the checks and changes nothing.
3. CI builds and signs everything and publishes a GitHub Release with the APK, the extension zip and the Shortcut script. Versions with a `-` suffix are marked pre-release.
4. CI also publishes the **release channel** to GitHub Pages: `update.json` (latest version and per-platform update links) and `rules.json` (site rules). Installed copies read both once a day: a newer version shows an "update available" bar in the reader; newer rules apply silently, so most site fixes need no app update. It also carries the Apple core (`sapu-berita.js`), which the Shortcut and the Safari bookmark download on every run, and the install page (`site/`).

One-time setup: Settings → Pages → Source: **GitHub Actions** (needs a public repository on the free plan). Pages URLs don't follow repository renames, so rename before the first release.

### Reports without a GitHub account

By default **Laporkan** (in the reader) and **Laporkan masalah** (install page footer) open the GitHub "Broken article" form, which needs a GitHub account. To let anyone report, point them at a free form instead (Tally works well: no sign-in for the reporter, screenshot uploads included):

1. Create the form with these questions: *Apa yang salah?* (checkboxes: Sapu Berita tidak muncul · Teks artikel terpotong · Masih ada iklan / "Baca Juga" · Halaman 2, 3 tidak digabung · Foto atau video hilang · Tampilannya rusak), *Ceritakan sedikit* (long text, optional), *Screenshot* (file upload, optional). Add **hidden fields** named `url`, `site`, `version`, `platform` and `note` (`note` carries the text of a block the reader marked with **Tandai**).
2. Take the form's share link and add the placeholders, e.g. `https://tally.so/r/AbC123?url={url}&site={site}&version={version}&platform={platform}&note={note}`. Placeholders available: `{url} {title} {site} {version} {platform} {note}`.
3. Save it as the repository variable `SAPU_REPORT_URL` (Settings → Secrets and variables → Actions → Variables, or `gh variable set SAPU_REPORT_URL --body '<link>'`).

The next release builds it in and writes it into `update.json` as `"report"`, so installed copies switch to the form within a day and the bookmark on its next run. Changing the form later is the same: update the variable, release. Unset, everything falls back to GitHub. The GitHub forms stay for people who have an account (CONTRIBUTING.md).

The APK signing key is only in the repository's Actions secrets (`SAPU_KEYSTORE_B64`, `SAPU_KEYSTORE_PASSWORD`, `SAPU_KEY_ALIAS`, `SAPU_KEY_PASSWORD`). Keep a backup of the keystore: if it is lost, existing users cannot update and must reinstall.

## More

- [Architecture](ARCHITECTURE.md): the pipeline, wrappers, rule lifecycle
- [Writing rules](RULES.md): fixing a site after a redesign
- [Prior art](PRIOR-ART.md): what we reuse and why
- `PRODUCT.md`, `DESIGN.md`: product principles and the overlay's design system

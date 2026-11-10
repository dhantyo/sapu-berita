# Architecture

## Principles

1. **Client-side only.** The user's own browser downloads and reformats the page. No proxy server and nothing redistributed, so there's no server bill and no takedown target.
2. **One core, thin wrappers.** All logic lives in `src/`. Each platform is a small entry file that calls the core.
3. **Rules are data, not code.** Site knowledge lives in `rules/*.json`. Fixing a broken site means editing JSON, not shipping an app update. Rules can be fetched remotely.
4. **Never show a broken page.** Every step has a quality gate. If the result looks wrong, fall back to the next strategy, and in the worst case leave the original page alone.
5. **Reuse tested code.** See `docs/PRIOR-ART.md`. Hand-written code is limited to the glue, the overlay and the Indonesia-specific rules nobody else maintains.

## Pipeline

```
 page DOM + URL
      │
      ▼
 ┌────────────┐   rules/sites/*.json  (hand-written, verified)
 │ match rule │◄─ rules/generated/*   (imported: AdBlockID/ABPindo, AutoAllPage)
 └─────┬──────┘   remote rules.json   (cached, newer wins)
       ▼
 ┌────────────┐   JSON-LD NewsArticle → OpenGraph → <meta>
 │ metadata   │   (title, author, date, image, section)
 └─────┬──────┘
       ▼
 ┌────────────┐   1. site rule body selector
 │ extract    │   2. Readability fallback
 └─────┬──────┘   └─ quality gate (min chars, link density)
       ▼
 ┌────────────┐   strategy from rule: none | param (?page=all) |
 │ paginate   │   path | fetch (stitch ?page=N) | inline (all pages in DOM)
 └─────┬──────┘   same-origin fetch only
       ▼
 ┌────────────┐   1. site `remove` selectors ("Baca Juga" boxes)
 │ clean      │   2. adblock cosmetic selectors (generated)
 └─────┬──────┘   3. common paragraph patterns ("Baca juga:", "ADVERTISEMENT")
       │          4. DOMPurify sanitize + attribute strip
       ▼
 ┌────────────┐   Shadow DOM overlay on top of the page,
 │ render     │   "show original" toggle, light/dark
 └────────────┘
```

Each stage is a pure-ish function `(input, ctx) → output`, so it can be unit-tested against saved HTML fixtures in Node (linkedom/happy-dom).

## Wrappers (`src/entries/`)

| Entry | Output | How it runs |
|---|---|---|
| `extension.ts` | `apps/extension/content.js` | Desktop Chrome dev extension (load unpacked). Development and testing on Windows. |
| `shortcut.ts` | `dist/shortcut.js` | Pasted into an iOS Shortcut's "Run JavaScript on Web Page" action. Must call `completion()`. Must be small and fast. |
| `webview.ts` | `dist/webview.js` | Injected by the Android link-router app into its WebView at page load. |

### Platform constraints the core must respect
- **iOS Shortcuts:** strict time limit. Scripts containing `#` reportedly fail on iOS 17+, and whitespace slows execution on iOS 18.4+ (forum reports, unverified). The build therefore minifies and also emits a base64-wrapped variant. Test both on a real device.
- **Same-origin only:** pagination fetches stay on the article's own origin. Cross-subdomain fetches (e.g. www.detik.com → finance.detik.com) are blocked by CORS, which is fine because page N is always on the same host.
- **No `localStorage` dependence:** the remote rules cache is best-effort. The bundled rules must work alone.

## Rules lifecycle

```
rules/sites/*.json ──┐
generated/adblock ───┼─► tools/build-rules.ts ─► dist/rules.json ─► bundled into every entry
generated/aap     ───┘                                        └─► published (GitHub Pages / jsDelivr)
                                                                   fetched at runtime, cached, version-compared
```

- `tools/import-adblock.ts` uses `@ghostery/adblocker` (tested filter-list engine) to compute the cosmetic hiding selectors that AdBlockID and ABPindo define for each supported domain.
- `tools/import-autoallpage.ts` converts AutoAllPage's `websiteList` into our `pagination` format for the sites we haven't hand-verified.
- Hand-written `rules/sites/*.json` always win over generated rules.

## Keeping it working without babysitting

- **Fixtures:** `npm run capture <url>` saves a real article's HTML into `test/fixtures/`, and unit tests run the pipeline against it.
- **Canary (`.github/workflows/canary.yml`):** daily, it takes the newest article per site (from their RSS feeds, which are fine for *finding* articles), runs the pipeline, and fails the job if the quality gate fails. GitHub emails you.
- **Contributions:** a PR that edits a rule runs CI against the fixtures and live samples. If it's green, merge it.

## Repo layout

```
docs/                 architecture, rule-writing guide, prior art
rules/
  schema.json         JSON Schema for site rules (validated in CI)
  common.json         patterns shared by all sites ("Baca juga:", "ADVERTISEMENT", …)
  sites/*.json        one file per outlet/platform, hand-verified
  generated/          build output of import tools (gitignored)
src/
  index.ts            public API: run(document, url, options)
  types.ts            shared types (Rule, Article, Context)
  rules/              load (bundled + remote cache), match
  extract/            metadata, site body, Readability fallback, quality gate
  paginate/           strategies
  clean/              selector removal, text patterns, sanitize
  render/             overlay (Shadow DOM) + styles
  entries/            extension / shortcut / webview
test/                 vitest; fixtures/ holds saved article HTML
tools/                build, rule import, fixture capture, canary
apps/
  extension/          desktop dev extension (MV3 manifest)
  ios-shortcut/       Shortcut build notes + install guide
  android/            link-router app (planned: based on URLCheck)
```

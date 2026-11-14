# Writing and fixing site rules

A site rule is one JSON file in `rules/sites/`. It tells the core where the article is, how to merge pages, and what junk to cut. Editor autocomplete works through `"$schema": "../schema.json"`.

## Fixing a broken site (the common case)

1. Open a recent article on the site in desktop Chrome, with the dev extension loaded.
2. If the overlay doesn't appear, or looks wrong, open DevTools and find the element that wraps the article paragraphs.
3. Put its selector first in `body`. Prefer stable hooks:
   - semantic tags and ids (`#article-content-body`, `article`)
   - descriptive class names (`.detail__body-text`)
   - **avoid** generated or utility classes (`.css-1x2y3z`, `.mb-8.text-sm`)
4. Run `npm run capture <article-url>` to save it as a fixture, then run `npm test`.
5. Bump `verified` to today's date and open a PR. If CI is green, it gets merged.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `id` | ✅ | lowercase id, same as the file name |
| `domains` | ✅ | registrable domains; subdomains match automatically |
| `articleUrl` | ✅ | regex on the URL path that identifies article pages |
| `body` | ✅ | selectors for the article body, tried in order |
| `lead` | | selectors for blocks that belong at the top but sit outside the body: an editor's summary box (Bisnis `.bisnisai`), a photo gallery (foto.bisnis `.fotoslider`). Copied in front of the body when present |
| `trail` | | selectors for blocks that continue the article after the body but sit outside it: a photo slider after a one-line intro (detikHot photo stories on desktop, `#slider-foto__detail`). Copied after the body when present |
| `bodyAll` | | `true` = join every match (sites that inline all pages) |
| `remove` | | selectors deleted inside the body ("Baca Juga" boxes, video embeds) |
| `dropParagraphs` | | extra text regexes; matching paragraphs are deleted |
| `pagination` | ✅ | see below |
| `variants` | | per-section overrides, e.g. `"when": "^/bola/"` |
| `samples` | | real URLs for tests and the daily canary; include a multi-page one |
| `verified` | | last date someone checked this against the live site |

## Pagination methods

| `method` | Use when | Example |
|---|---|---|
| `none` | articles are never split | — |
| `inline` | old name for `none`, still accepted | use `none` (Liputan6 and Merdeka show every section on one page; `bodyAll: true` joins them) |
| `param` | the site has a "show all" URL | Kompas/Tribun `page=all`, Detik `single=1` |
| `fetch` | no working "show all"; download each page and stitch | Liputan6 bola, CNN Indonesia |

`param` and `fetch` only ever request URLs on the article's own host.

## What NOT to put in site rules

- Ad selectors already covered by AdBlockID/ABPindo. They're imported automatically (`npm run import:adblock`); send fixes upstream so everyone benefits.
- "Baca juga:" text patterns that apply everywhere. Those live in `rules/common.json`.

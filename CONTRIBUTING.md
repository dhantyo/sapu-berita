# Contributing

Thanks for helping! Three ways, easiest first.

## 1. Report an article that looks wrong

The quickest way: on that article, open **Aa → Report it**. The article link and your Sapu Berita version are filled in for you.

Or [open a report](../../issues/new/choose) → **Broken article**, with:
- **the article link** (most important),
- what you used (Android, iPhone, extension),
- what's wrong: missing text, ads or "Baca Juga" links left in, pages not merged, and so on. Screenshots help a lot.

Writing in Indonesian is fine.

## 2. Suggest a news site

[Open a suggestion](../../issues/new/choose) → **Suggest a site**, with the site's name and 2 or 3 article links.

## 3. Write or fix a site rule

Most fixes are a few lines of JSON in `rules/sites/<site>.json`. Read [docs/RULES.md](docs/RULES.md) first; the short version:

1. `npm install`, then load the extension (`npm run build`, then *Load unpacked* `apps/extension/` in `chrome://extensions`).
2. Open the broken article, find the element that wraps the paragraphs in DevTools, and fix `body`, `remove` or `pagination` in the rule.
3. Add the article as a test fixture: `npm run capture -- <url>`.
4. `npm run check` must pass. Then open a pull request with the article link in the description.

For a new site, `npm run probe -- https://www.example.com` drafts the rule for you.

Ground rules:
- **No paywall bypassing.** Sapu Berita cleans what the site already shows you.
- **No servers, no analytics.** Everything runs on the reader's device. The only request of our own is the daily, opt-out fetch of `update.json` and `rules.json` from the release channel; it carries nothing about the reader.
- Prefer stable selectors (ids, semantic class names) over generated ones like `.css-1x2y3z`.

More background: [docs/DEVELOPING.md](docs/DEVELOPING.md).

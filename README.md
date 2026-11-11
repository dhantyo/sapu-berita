# Sapu Berita

Clean reading overlay for Indonesian news sites. Opens an article and shows just the article: no ads, no "Baca Juga" interruptions, and every page merged into one.

**Supported (hand-verified rules, 16 portals):** Detik, CNN Indonesia, CNBC Indonesia, Kompas, Tribunnews (incl. regional sites), Liputan6, Merdeka, Suara, Okezone, Viva, iNews, JPNN, ANTARA, Republika, Bisnis.com, Tirto.
**Not yet:** Tempo (mostly paywalled; Sapu Berita does not bypass paywalls), Kumparan and Sindonews (article text is rendered by JavaScript; generic extraction may still work), IDN Times (auto-generated class names).
**Plus page merging, with generic extraction,** for about 20 more outlets via imported [AutoAllPage](https://github.com/reforget-id/AutoAllPage) rules.

| Platform | How users get it | Status |
|---|---|---|
| iPhone | Apple Shortcut (free, Share → Sapu Berita), [guide](docs/install-iphone.md) | script ready; Shortcut must be assembled once on an iPhone/Mac |
| Android | Link-router app set as default browser, [guide](docs/install-android.md) | alpha APK built by CI; tested on emulator |
| Desktop Chrome | Dev extension | working, for development |

## Develop

```bash
npm install
npm run import:autoallpage   # pagination rules for ~20 extra sites
npm run import:adblock       # ad selectors from AdBlockID + ABPindo
npm test                     # schema + matching + real-article fixtures
npm run build                # all wrappers into dist/ and apps/extension/
```

- Add a test article: `npm run capture -- <url>`
- Draft a rule for a new portal: `npm run probe -- https://www.example.com` (samples live articles, reports body, junk and pagination)
- Check live sites like the daily CI canary does: `npm run canary`

## Docs
- [Architecture](docs/ARCHITECTURE.md): pipeline, wrappers, rule lifecycle
- [Writing rules](docs/RULES.md): fixing a site when it redesigns
- [Prior art](docs/PRIOR-ART.md): what we reuse and why

## License
GPL-3.0-only. Rule data is derived from GPL-3.0 projects (AdBlockID, ABPindo, AutoAllPage).

## Dev scripts

- `npm run preview`: local page that runs the real pipeline on saved fixtures, to check the overlay at any viewport.
- `npm run rebaseline`: recompute fixture expectations from saved HTML after a deliberate cleaning change.

# Baca Bersih

Clean reading overlay for Indonesian news sites. Opens an article and shows just the article: no ads, no "Baca Juga" interruptions, and every page merged into one.

**Supported (hand-verified, desktop and mobile layouts):** Detik, CNN Indonesia, Kompas, Tribunnews, Liputan6.
**Plus page merging, with generic extraction,** for about 20 more outlets via imported [AutoAllPage](https://github.com/reforget-id/AutoAllPage) rules.

| Platform | How users get it | Status |
|---|---|---|
| iPhone | Apple Shortcut (free, Share → Baca Bersih) | build ready, needs on-device test |
| Android | Link-router app set as default browser (free APK) | planned |
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
- Check live sites like the daily CI canary does: `npm run canary`

## Docs
- [Architecture](docs/ARCHITECTURE.md): pipeline, wrappers, rule lifecycle
- [Writing rules](docs/RULES.md): fixing a site when it redesigns
- [Prior art](docs/PRIOR-ART.md): what we reuse and why

## License
GPL-3.0-only. Rule data is derived from GPL-3.0 projects (AdBlockID, ABPindo, AutoAllPage).

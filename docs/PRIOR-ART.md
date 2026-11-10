# Prior art and reused code

Checked 2026-11-10. Rule of the project: reuse tested code unless it's clearly inelegant.

## Reused

| What | Used for | License | Notes |
|---|---|---|---|
| [@mozilla/readability](https://github.com/mozilla/readability) | Fallback article extraction | Apache-2.0 | Powers Firefox reader mode. Tested on Detik, CNN Indonesia, Kompas, Tribun and Liputan6: finds the body on all 5, but leaves some junk and only reads page 1. |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Sanitizing extracted HTML before rendering | MPL-2.0 / Apache-2.0 | Standard choice for safe HTML re-rendering. |
| [@ghostery/adblocker](https://github.com/ghostery/adblocker) | Build-time: turn filter lists into per-domain hiding selectors | MPL-2.0 | Used only in `tools/`, not shipped. |
| [AdBlockID](https://github.com/realodix/AdBlockID) | Ad, video and annoyance selectors | GPL-3.0 | Updated 2026-11-09. Has no "Baca Juga" rules. |
| [ABPindo](https://github.com/ABPindo/indonesianadblockrules) | Ad selectors | GPL-3.0 | Updated 2026-11-08. |
| [AutoAllPage](https://github.com/reforget-id/AutoAllPage) | Pagination rules for 51 Indonesian sites; our `pagination` schema copies its `method` / `fullpage` model | GPL-3.0 | Last commit 2026-05-08. |
| [URLCheck](https://github.com/TrianguloY/URLCheck) | Planned base or reference for the Android link router | CC BY 4.0 | Modular link interceptor on F-Droid. |
| Mercury/Postlight Parser custom extractors | Design reference for per-site rule shape | MIT | Upstream looks unmaintained; only the idea is reused. |

## Considered and rejected

| What | Why not |
|---|---|
| Bacatari (Firefox extension) | Closest existing project, but stale (last update 2025-05), 1 user, Firefox-only. |
| Show All News, Indonesia news page all | Subsets of AutoAllPage, or dead. |
| Defuddle | Promising (MIT, has site extractors), but describes itself as "very much a work in progress" and has no published accuracy benchmark. Revisit as an alternative fallback; it's a one-line swap in `src/extract/fallback.ts`. |
| JSON-LD `articleBody` | None of the 5 outlets include it. Still used for metadata. |
| RSS full text | Summaries only on every outlet checked. Used only by the canary to discover fresh articles. |

## Licensing consequence

Shipping AdBlockID-, ABPindo- or AutoAllPage-derived data makes the project **GPL-3.0**. That fits a community-maintained project, and the repo is licensed GPL-3.0-only.

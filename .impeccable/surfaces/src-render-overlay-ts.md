---
version: 1
slug: "src-render-overlay-ts"
primary_target: "src/render/overlay.ts"
related_targets: ["src/render/styles.ts"]
---

# Reader overlay (Sapu Berita)

Scope: the article overlay drawn over Indonesian news pages (src/render). Mode: Read.
Audience/job: everyday readers finishing one article from a shared link, on phone and desktop equally.
Constraints: Shadow DOM, bundled Geist (other faces on demand), rgb() colours, small bundle, `<b>` not `<strong>`, Indonesian/English UI.
User-pinned direction (2026-11-11, replaces the NYT serif direction): a modernist sans is the identity: Geist for headline, text and labels; Merriweather and Fira Sans only as reader options. Outlet logo on top, "Aa" settings, sweep credit line at the end.

## Direction contract

THESIS: The swept page in one Swiss-modernist voice: a strict grotesk, white space, hairline order. Refuses the generic reader-mode card with blue accents and the outlets' cluttered chrome alike.
OWN-WORLD: Paper white / ink rgb(18 18 18); Geist for headline (700, tight tracking), text and every label (small, grey); hairline rules; one accent, lidi ochre, reserved for Sapu marks (progress, active setting, sweep line). Dark is ink-black, sepia is warm newsprint. Outlet logo sits on its own plate.
STORY: Reader sees whose journalism this is (logo), reads the whole story undisturbed, can tune text, and learns at the end what was swept and where the original is.
FIRST VIEWPORT: Slim bar: outlet logo left, "Aa" and "Asli" right, progress hairline under it. Centered column (~34em): large bold Geist headline, deck when distinct, then section · byline · date in sans below it (no kicker above the headline), hero image at column width.
FORM: user-pinned NYT-style editorial reader (category standard executed at full craft); roll seed:6783ac4b281530b9 overridden by user steer.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

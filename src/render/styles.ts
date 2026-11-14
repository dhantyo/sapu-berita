// Overlay styles, scoped by Shadow DOM so the site's CSS can't leak in (or ours out).
// Colours use rgb() rather than hex: iOS Shortcuts reportedly chokes on the hash character.
//
// World: an editorial web edition (NYT-grade). Paper and ink, hairline rules, serif for the
// journalism, grey sans for everything that is ours (labels, bylines, controls). One accent,
// lidi ochre (the colour of a sapu lidi), reserved for Sapu marks: progress, active settings,
// the sweep line. Never decoration.

const LIGHT = `
  --bg: rgb(255 255 255); --ink: rgb(18 18 18); --muted: rgb(92 92 92);
  --rule: rgb(0 0 0 / 0.1); --rule-strong: rgb(0 0 0 / 0.26); --chip: rgb(0 0 0 / 0.045);
  --panel: rgb(255 255 255); --accent: rgb(176 122 18); --plate: transparent; --shadow: rgb(0 0 0 / 0.16);
  --text-weight: 400; --text-track: 0em;`;
const SEPIA = `
  --bg: rgb(247 241 228); --ink: rgb(44 34 22); --muted: rgb(104 88 68);
  --rule: rgb(60 40 10 / 0.12); --rule-strong: rgb(60 40 10 / 0.3); --chip: rgb(60 40 10 / 0.06);
  --panel: rgb(251 247 238); --accent: rgb(160 106 10); --plate: rgb(255 255 255); --shadow: rgb(60 40 10 / 0.2);
  --text-weight: 400; --text-track: 0em;`;
const DARK = `
  --bg: rgb(18 18 18); --ink: rgb(232 232 230); --muted: rgb(168 168 165);
  --rule: rgb(255 255 255 / 0.12); --rule-strong: rgb(255 255 255 / 0.28); --chip: rgb(255 255 255 / 0.07);
  --panel: rgb(30 30 30); --accent: rgb(222 172 70); --plate: rgb(255 255 255); --shadow: rgb(0 0 0 / 0.5);
  /* Light text on black looks heavier: a touch lighter and looser (Geist is variable; others snap to 400). */
  --text-weight: 370; --text-track: 0.006em;`;

export const OVERLAY_CSS = `
:host { all: initial; }
.root {
  ${LIGHT}
  /* One modernist voice: Geist sets the journalism and every label (bundled, see render/fonts.ts).
     Aa → Serif swaps the journalism to Merriweather, Aa → Jelas to Fira Sans; labels stay Geist. */
  --sans: "Sapu Geist", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --serif: "Sapu Merriweather", Charter, "Iowan Old Style", Georgia, "Noto Serif", serif;
  --legible: "Sapu Fira Sans", Verdana, "Segoe UI", Tahoma, "DejaVu Sans", sans-serif;
  --head: var(--sans);
  --body: var(--sans);
  /* Per-face tuning, so text size 3 looks the same size in every face (x-heights differ). */
  --text-k: 0.95;
  --lead: 1.6;
  --head-lead: 1.08;
  --head-track: -0.028em;
  --sub-track: -0.016em;
  --fs: 19px;
  --narrow: 0px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  position: fixed; inset: 0; z-index: 2147483647; overflow-y: auto; overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch; scrollbar-color: var(--rule-strong) transparent;
  background: var(--bg); color: var(--ink);
  font: 15px/1.5 var(--sans); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
.root[data-theme="sepia"] { ${SEPIA} }
.root[data-theme="dark"] { ${DARK} }
@media (prefers-color-scheme: dark) { .root[data-theme="auto"] { ${DARK} } }
/* The pick layer over the original page (render/pagepicker.ts): same colours and face as the reader. */
.tokens { ${LIGHT} --sans: "Sapu Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; --ease: cubic-bezier(0.2, 0.8, 0.2, 1); font: 15px/1.5 var(--sans); color: var(--ink); }
.tokens[data-theme="sepia"] { ${SEPIA} }
.tokens[data-theme="dark"] { ${DARK} }
@media (prefers-color-scheme: dark) { .tokens[data-theme="auto"] { ${DARK} } }
.pagepick[hidden] { display: none; }
.pick-outline { position: fixed; z-index: 2147483646; pointer-events: none; border: 2px solid var(--accent); border-radius: 6px;
  background: color-mix(in srgb, var(--accent) 14%, transparent); box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.18); transition: all 120ms ease-out; }
.pick-outline[hidden] { display: none; }
.pagepick .pickbar { z-index: 2147483647; }
.root[data-font="serif"] { --body: var(--serif); --head: var(--serif); --text-k: 0.92; --lead: 1.68; --head-lead: 1.16; --head-track: -0.008em; --sub-track: 0em; }
.root[data-font="legible"] { --body: var(--legible); --head: var(--legible); --text-k: 1; --lead: 1.7; --head-lead: 1.14; --head-track: -0.01em; --sub-track: 0em; }
@media (max-width: 600px) { .root { --narrow: 1.5px; } }
.root ::selection { background: color-mix(in srgb, var(--accent) 32%, transparent); }
.root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
button { font: inherit; color: inherit; }

/* ── Masthead bar: whose journalism this is, and our two controls ── */
.bar {
  position: sticky; top: 0; z-index: 2; height: 56px; padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--bg); border-bottom: 1px solid var(--rule);
}
.outlet { display: flex; align-items: center; min-width: 0; color: inherit; text-decoration: none; }
/* Outlet logo. Fitted (pixels analysed): a window cropped to the drawn pixels, sized optically,
   recoloured with a filter only where its own colour wouldn't show on our ground. */
.logo { position: relative; display: block; overflow: hidden; flex: none; }
.logo img { display: block; }
.logo[data-state="pending"] { width: 96px; height: 22px; }
.logo[data-state="pending"] img { visibility: hidden; height: 22px; width: auto; }
.logo[data-state="fitted"] img { position: absolute; max-width: none; transition: filter 160ms var(--ease); }
.logo[data-badge="true"] { border-radius: 6px; }
/* Light and sepia grounds: a logo drawn for a dark header (white lettering) becomes ink. */
.logo[data-on-light="ink"] img { filter: brightness(0); opacity: 0.86; }
/* Dark ground: a logo drawn for a light header (dark lettering) becomes white; light-ground recolouring is undone. */
.root[data-theme="dark"] .logo[data-on-light="ink"] img { filter: none; opacity: 1; }
.root[data-theme="dark"] .logo[data-on-dark="white"] img { filter: brightness(0) invert(1); opacity: 0.92; }
@media (prefers-color-scheme: dark) {
  .root[data-theme="auto"] .logo[data-on-light="ink"] img { filter: none; opacity: 1; }
  .root[data-theme="auto"] .logo[data-on-dark="white"] img { filter: brightness(0) invert(1); opacity: 0.92; }
}
/* Plate fallback (server forbids pixel reads): whole logo on the site's own dark header colour, or white in dark themes. */
.logo[data-state="plate"] { display: inline-flex; align-items: center; border-radius: 4px; padding: 3px 0; background: var(--plate); }
.logo[data-state="plate"] img { height: 22px; width: auto; max-width: 150px; object-fit: contain; }
.root[data-theme="sepia"] .logo[data-state="plate"], .root[data-theme="dark"] .logo[data-state="plate"] { padding: 4px 8px; }
@media (prefers-color-scheme: dark) { .root[data-theme="auto"] .logo[data-state="plate"] { padding: 4px 8px; } }
.logo[data-state="plate"][data-plate="dark"] { background: var(--logo-ground, rgb(24 24 24)); padding: 4px 8px; }
.outlet-name { font: 700 18px/1 var(--sans); letter-spacing: -0.025em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.outlet.square { gap: 9px; }
.outlet.square .logo { border-radius: 6px; }
.outlet.square .logo[data-state="plate"] { padding: 0; background: transparent; }
.outlet.square .logo[data-state="plate"] img { height: 30px; }
.outlet.square .outlet-name { font-size: 17px; }
.tools { display: flex; gap: 8px; flex: none; }
.btn {
  height: 34px; padding: 0 13px; border-radius: 17px; border: 1px solid var(--rule-strong); background: transparent;
  font: 600 14px/1 var(--sans); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: background-color 160ms var(--ease), border-color 160ms var(--ease);
}
.btn:hover { background: var(--chip); }
a.btn { color: inherit; text-decoration: none; flex: none; }
.btn[aria-expanded="true"] { border-color: var(--accent); background: var(--chip); }
.aa { font-weight: 650; letter-spacing: -0.03em; padding: 0 12px; gap: 1px; }
.aa .big { font-size: 18px; } .aa .small { font-size: 13px; }
.progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); }

/* ── The article ── */
.column { font-size: calc((var(--fs) - var(--narrow)) * var(--text-k)); width: min(100% - 32px, 34em); margin: 0 auto; padding: 2.2em 0 0; }
h1 {
  margin: 0 0 0.45em; font: 700 clamp(1.6em, 1.1em + 2.3vw, 2.3em)/var(--head-lead) var(--head);
  letter-spacing: var(--head-track); text-wrap: balance;
}
.deck { margin: 0 0 0.9em; font: 400 1.1em/1.42 var(--head); letter-spacing: calc(var(--sub-track) / 2); color: var(--muted); text-wrap: pretty; }
/* Every item carries its "·" in a left gutter; the gutter is clipped, so a wrapped line never starts with a dot. */
.meta { display: flex; flex-wrap: wrap; margin: 0 0 0 -1.4em; clip-path: inset(-0.6em -0.6em -0.6em 1.4em); font: 400 0.74em/1.5 var(--sans); color: var(--muted); font-variant-numeric: tabular-nums; }
.meta .section { color: var(--ink); font-weight: 600; }
/* Each part (section, byline, date) stays whole; the row only breaks at the separators. */
.meta .section, .meta .date, .meta .name { white-space: nowrap; }
.meta > span { position: relative; margin-left: 1.4em; }
.meta > span::before { content: "·"; position: absolute; left: -0.95em; color: var(--rule-strong); }
.hero { margin: 1.4em 0 0; }
.hero img { display: block; width: 100%; height: auto; background: var(--chip); }
/* Photos open the viewer (gallery.ts). */
.hero img, .content img { cursor: zoom-in; }
.content figure[data-embed] img { cursor: pointer; }
.root[data-links="off"] .content a img { pointer-events: auto; }
.pswp { --pswp-bg: rgb(12 12 12); --pswp-icon-color: rgb(245 245 245); --pswp-icon-color-secondary: rgb(30 30 30); font-family: var(--sans); }
/* Viewer controls: the reader's pill buttons, on a dark glass so they read over any photo. */
.pswp__top-bar { height: auto; align-items: center; gap: 8px; padding: max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) 0 max(14px, env(safe-area-inset-left)); }
.pswp .pswp__button, .pswp .pswp__button:hover, .pswp .pswp__button:focus, .pswp .pswp__button:active {
  width: 40px; height: 40px; margin: 0; padding: 0; display: grid; place-items: center; overflow: visible;
  border: 1px solid rgb(255 255 255 / 0.22); border-radius: 20px; background: rgb(22 22 22 / 0.62); color: rgb(245 245 245);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 4px 14px -6px rgb(0 0 0 / 0.5); opacity: 1;
  transition: background-color 160ms var(--ease), border-color 160ms var(--ease);
}
.pswp .pswp__button:hover { background: rgb(52 52 52 / 0.78); border-color: rgb(255 255 255 / 0.36); }
.pswp .pswp__button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pswp .pswp__button--zoom { display: none; }
.pswp--zoom-allowed .pswp__button--zoom { display: grid; }
.pswp .pswp__icn { position: static; width: 20px; height: 20px; margin: 0; fill: none; color: inherit; transform: none; overflow: visible; }
.pswp .pswp__button--arrow { position: absolute; top: 50%; margin-top: -22px; width: 44px; height: 44px; border-radius: 22px; }
.pswp .pswp__button--arrow--prev { left: max(16px, env(safe-area-inset-left)); }
.pswp .pswp__button--arrow--next { right: max(16px, env(safe-area-inset-right)); left: auto; }
.pswp .pswp__button--arrow .pswp__icn { width: 22px; height: 22px; }
/* Arrows only with more than one photo, and only for a mouse: on touch screens you swipe. */
.pswp.pswp--one-slide .pswp__button--arrow { display: none; }
@media (hover: none), (pointer: coarse) { .pswp .pswp__button--arrow { display: none; } }
.pswp__counter { order: -1; margin: 0 auto 0 0; height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid rgb(255 255 255 / 0.22);
  background: rgb(22 22 22 / 0.62); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  font: 600 13px/30px var(--sans); font-variant-numeric: tabular-nums; color: rgb(245 245 245); text-shadow: none; opacity: 1; }
.pswp__caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 20px max(18px, env(safe-area-inset-bottom)); margin: 0 auto; max-width: 720px;
  font: 400 14px/1.5 var(--sans); color: rgb(235 235 235); background: linear-gradient(transparent, rgb(0 0 0 / 0.72) 40%); pointer-events: none; }
.pswp__caption[hidden] { display: none; }
.pswp--ui-visible .pswp__caption { opacity: 1; transition: opacity 0.25s; }
.pswp:not(.pswp--ui-visible) .pswp__caption { opacity: 0; }

.content { margin-top: 1.6em; font-family: var(--body); font-weight: var(--text-weight); letter-spacing: var(--text-track); line-height: var(--lead); overflow-wrap: break-word; text-wrap: pretty; }
.root[data-font="legible"] .content { letter-spacing: calc(var(--text-track) + 0.005em); }
.content > :first-child { margin-top: 0; }
.content p, .content div { margin: 0 0 1.05em; }
.content h2, .content h3, .content h4 { font-family: var(--head); line-height: 1.25; letter-spacing: var(--sub-track); margin: 1.7em 0 0.5em; text-wrap: balance; }
.content h2 { font-size: 1.28em; } .content h3 { font-size: 1.12em; } .content h4 { font-size: 1em; }
.content a { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.2em; text-decoration-color: var(--rule-strong); }
.content a:hover { text-decoration-color: var(--accent); }
.content img, .content picture, .content video { display: block; max-width: 100%; height: auto; margin: 1.6em 0 0.5em; }
.content figure { margin: 1.6em 0; }
.content figure img { margin: 0 0 0.5em; }
.content figure > p, .content figure > div { margin: 0; }
.content figcaption { font: 0.72em/1.45 var(--sans); color: var(--muted); }
.content ul, .content ol { margin: 0 0 1.1em; padding-left: 1.25em; }
.content li + li { margin-top: 0.4em; }
.content li::marker { color: var(--muted); }
.content blockquote { margin: 1.7em 0; padding: 0.9em 0 0.2em; border-top: 2px solid var(--ink); border-bottom: 1px solid var(--rule); font-size: 0.94em; }
.content blockquote > b:first-child { display: block; margin-bottom: 0.55em; font: 700 0.74em/1.3 var(--sans); letter-spacing: 0.04em; text-transform: uppercase; }
.content blockquote > ul { margin-bottom: 0.9em; }
/* Social-post cards: quoted posts are part of the story; static, no third-party scripts. */
.content figure[data-embed] {
  margin: 1.6em 0; padding: 0.85em 1em; border: 1px solid var(--rule); border-radius: 10px;
  font: 0.8em/1.5 var(--sans); color: var(--ink);
}
.content figure[data-embed] figcaption { margin: 0 0 0.45em; font: inherit; color: var(--muted); }
/* Embedded players: the platform's own post, edge to edge in the column; the card underneath waits for "off". */
.content iframe.player { display: block; width: 100%; border: 0; border-radius: 10px; background: var(--chip); }
.root[data-embeds="on"] .content figure[data-embed]:has(iframe.player) { padding: 0; border: 0; }
.root[data-embeds="on"] .content figure[data-embed]:has(iframe.player) > :not(iframe) { display: none; }
.root[data-embeds="off"] .content iframe.player { display: none; }
/* Reader switches: links as plain text, summary boxes hidden. Social-post links always work. */
.root[data-links="off"] .content a:not([data-embed-link]) { color: inherit; text-decoration: none; pointer-events: none; cursor: text; }
.root[data-summaries="off"] .content blockquote[data-summary] { display: none; }
.content figure[data-embed] figcaption b { color: var(--ink); }
.content figure[data-embed] p { margin: 0 0 0.6em; font-size: 1.06em; }
.content figure[data-embed] a[data-embed-link] { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; text-decoration: none; color: var(--ink); }
.content figure[data-embed] a[data-embed-link]:hover { text-decoration: underline; text-underline-offset: 0.2em; }
.content figure[data-embed="youtube"] { padding: 0; overflow: hidden; }
.content figure[data-embed="youtube"] a[data-embed-link] { position: relative; display: block; }
.content figure[data-embed="youtube"] img { margin: 0; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.content figure[data-embed="youtube"] .play {
  position: absolute; left: 50%; top: 50%; translate: -50% -50%; padding: 10px; border-radius: 50%;
  color: rgb(255 255 255); background: rgb(0 0 0 / 0.62); fill: currentColor; stroke: none;
}
.content figure[data-embed="youtube"] figcaption { margin: 0; padding: 0.7em 1em; }
.content table { width: 100%; border-collapse: collapse; margin: 1.6em 0; font: 0.78em/1.4 var(--sans); font-variant-numeric: tabular-nums; }
.content td, .content th { padding: 0.5em 0.6em 0.5em 0; border-bottom: 1px solid var(--rule); text-align: left; vertical-align: top; }
.content hr { border: 0; border-top: 1px solid var(--rule); margin: 2em 0; }

.status { display: flex; align-items: center; gap: 10px; margin: 0.4em 0 0; font: 0.74em/1.4 var(--sans); color: var(--muted); }
.spinner { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--rule-strong); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.sweep {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin: 2.6em 0 0; padding: 1em 0 3.5em;
  border-top: 1px solid var(--rule); font: 0.72em/1.45 var(--sans); color: var(--muted);
}
.sweep .mark { display: inline-flex; align-items: center; gap: 6px; color: var(--ink); font-weight: 600; }
.sweep .mark svg { color: var(--accent); }
.sweep a { margin-left: auto; color: var(--ink); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.sweep a:hover { text-decoration: underline; text-underline-offset: 0.2em; }
.end { height: 3.5em; }
svg { flex: none; }

/* ── Aa panel: popover on wide screens, bottom sheet on phones ── */
.panel {
  position: fixed; z-index: 3; top: 64px; right: 12px; width: 320px; max-height: calc(100vh - 72px); overflow-y: auto;
  padding: 14px 16px 18px; background: var(--panel); color: var(--ink); border: 1px solid var(--rule);
  border-radius: 14px; box-shadow: 0 16px 40px -8px var(--shadow), 0 2px 6px var(--shadow);
  opacity: 0; transform: translateY(-6px); visibility: hidden; transition: opacity 160ms var(--ease), transform 200ms var(--ease), visibility 0s linear 200ms;
}
.panel[data-open="true"] { opacity: 1; transform: none; visibility: visible; transition: opacity 160ms var(--ease), transform 200ms var(--ease); }
@media (max-width: 600px) {
  .panel { top: auto; left: 0; right: 0; bottom: 0; width: auto; max-height: 82vh; border-radius: 16px 16px 0 0;
    padding-bottom: max(18px, env(safe-area-inset-bottom)); transform: translateY(16px); }
}
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.panel .report { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel .report .text { font: 14px/1.3 var(--sans); }
.panel .hidden-row { padding: 0 0 12px; }
.panel .hidden-row .text { color: var(--muted); }
/* Tandai: blocks the reader hid, the pick outline, and the bar at the bottom while picking. */
.content [data-user-hidden] { display: none !important; }
.root[data-picking] .content, .root[data-picking] .content * { cursor: crosshair; }
.root[data-picking]::after { content: ""; display: block; height: 170px; }
.content [data-picked] { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 12%, transparent); }
.pickbar { position: fixed; z-index: 5; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; gap: 10px;
  padding: 14px max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: var(--panel); border-top: 1px solid var(--rule); box-shadow: 0 -10px 28px -14px var(--shadow); }
.pickbar .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin: 0 auto; width: 100%; max-width: 680px; }
.pickbar p { margin: 0; padding-top: 7px; font: 14px/1.45 var(--sans); color: var(--muted); }
.pickbar .head .btn { flex: none; margin-right: -8px; }
.pickbar .row { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 auto; width: 100%; max-width: 680px; }
.pickbar .btn { color: var(--ink); }
.pickbar .btn:disabled { opacity: 0.4; cursor: default; }
.pickbar .btn.primary { background: var(--accent); border-color: var(--accent); color: var(--bg); }
.pickbar .btn.quiet { border-color: transparent; color: var(--muted); }
.pickbar.done p { color: var(--ink); }
a.btn.primary { text-decoration: none; }
.update { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; margin: 0 0 28px; padding: 12px 14px; border: 1px solid var(--rule); border-radius: 10px; background: var(--chip); font: 14px/1.4 var(--sans); }
.update .actions { display: flex; align-items: center; gap: 8px; }
.update .later { border: 0; background: none; padding: 6px 4px; color: var(--muted); font: inherit; cursor: pointer; }
.update .later:hover { color: var(--ink); }
.panel .version { margin: 14px 0 0; font: 400 12px/1.4 var(--sans); color: var(--muted); }
.panel-head h2 { margin: 0; font: 600 15px/1.3 var(--sans); }
.icon-btn { width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 50%; background: transparent; cursor: pointer; color: var(--muted); }
.icon-btn:hover { background: var(--chip); color: var(--ink); }
.group { padding: 12px 0; border-top: 1px solid var(--rule); }
.group:first-of-type { border-top: 0; }
.label { display: block; margin: 0 0 8px; font: 600 12px/1.3 var(--sans); color: var(--muted); }
.seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; border: 1px solid var(--rule); border-radius: 10px; }
.seg button {
  min-height: 38px; padding: 6px 4px; border: 1px solid transparent; border-radius: 7px; background: transparent; cursor: pointer;
  font-size: 14px; line-height: 1.1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  transition: background-color 160ms var(--ease), border-color 160ms var(--ease);
}
.seg button:hover { background: var(--chip); }
.seg button[aria-checked="true"] { background: var(--chip); border-color: var(--accent); font-weight: 600; }
.swatch { flex: none; box-sizing: border-box; width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--rule-strong); background-clip: padding-box; }
.swatch.split { border: 0; border-radius: 0; }
.swatch.split svg { display: block; }
.swatch.split .ring { stroke: var(--rule-strong); stroke-width: 1; }
.size { display: flex; align-items: center; gap: 10px; }
.size .icon-btn { border: 1px solid var(--rule); border-radius: 10px; width: 44px; height: 38px; color: var(--ink); font-family: var(--sans); font-weight: 650; letter-spacing: -0.02em; }
.size .icon-btn:disabled { opacity: 0.35; cursor: default; }
.dots { flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--rule-strong); }
.dots i[data-on="true"] { background: var(--accent); width: 9px; height: 9px; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 0; }
.switch-row .text { font: 14px/1.3 var(--sans); }
.switch-row .hint { display: block; font-size: 12px; color: var(--muted); margin-top: 2px; }
/* Off track uses --muted: a UI component needs 3:1 against the panel, --rule-strong was ~1.9:1. */
.switch { flex: none; width: 42px; height: 26px; border-radius: 13px; border: 0; padding: 3px; cursor: pointer; background: var(--muted); transition: background-color 180ms var(--ease); }
.switch::after { content: ""; display: block; width: 20px; height: 20px; border-radius: 50%; background: rgb(255 255 255); box-shadow: 0 1px 3px rgb(0 0 0 / 0.3); transition: transform 180ms var(--ease); }
.switch[aria-checked="true"] { background: var(--accent); }
.switch[aria-checked="true"]::after { transform: translateX(16px); }

/* ── Floating button while the original page is showing ── */
/* Same spot as "Asli" in the reader's bar, so the two read as one toggle. Ochre border plus a white ring:
   it stands out on light and dark news sites alike. */
.reopen {
  position: fixed; z-index: 2147483647; top: calc(11px + env(safe-area-inset-top)); right: max(16px, env(safe-area-inset-right));
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px 0 11px; cursor: pointer;
  border: 1.5px solid rgb(222 172 70); border-radius: 17px;
  font: 650 14px/1 "Sapu Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; letter-spacing: -0.01em;
  color: rgb(255 255 255); background: rgb(18 18 18);
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9), 0 8px 22px -6px rgb(0 0 0 / 0.5);
  animation: reopen-in 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reopen svg { color: rgb(222 172 70); }
.reopen:hover { background: rgb(36 36 36); }
.reopen:focus-visible { outline: 2px solid rgb(222 172 70); outline-offset: 4px; }
@keyframes reopen-in { from { opacity: 0; transform: translateY(-6px) scale(0.96); } }

@media (prefers-reduced-motion: reduce) {
  .panel, .panel[data-open="true"], .btn, .seg button, .switch, .switch::after { transition: none; }
  .reopen { animation: none; }
  .spinner { animation-duration: 2.4s; }
}
`;

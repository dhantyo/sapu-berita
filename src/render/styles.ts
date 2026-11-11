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
  --panel: rgb(255 255 255); --accent: rgb(176 122 18); --plate: transparent; --shadow: rgb(0 0 0 / 0.16);`;
const SEPIA = `
  --bg: rgb(247 241 228); --ink: rgb(44 34 22); --muted: rgb(104 88 68);
  --rule: rgb(60 40 10 / 0.12); --rule-strong: rgb(60 40 10 / 0.3); --chip: rgb(60 40 10 / 0.06);
  --panel: rgb(251 247 238); --accent: rgb(160 106 10); --plate: rgb(255 255 255); --shadow: rgb(60 40 10 / 0.2);`;
const DARK = `
  --bg: rgb(18 18 18); --ink: rgb(232 232 230); --muted: rgb(168 168 165);
  --rule: rgb(255 255 255 / 0.12); --rule-strong: rgb(255 255 255 / 0.28); --chip: rgb(255 255 255 / 0.07);
  --panel: rgb(30 30 30); --accent: rgb(222 172 70); --plate: rgb(255 255 255); --shadow: rgb(0 0 0 / 0.5);`;

export const OVERLAY_CSS = `
:host { all: initial; }
.root {
  ${LIGHT}
  --serif: Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Cambria, Georgia, "Noto Serif", serif;
  /* Same families, but Windows gets Sitka's display cut for headlines instead of the small-text cut. */
  --display: Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Heading", Cambria, Georgia, "Noto Serif", serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --legible: Verdana, "Segoe UI", Tahoma, "DejaVu Sans", sans-serif;
  --body: var(--serif);
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
.root[data-font="sans"] { --body: var(--sans); }
.root[data-font="legible"] { --body: var(--legible); }
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
.outlet-name { font: 700 18px/1 var(--serif); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
.btn[aria-expanded="true"] { border-color: var(--accent); background: var(--chip); }
.aa { font-family: var(--serif); font-weight: 700; letter-spacing: -0.02em; padding: 0 12px; gap: 1px; }
.aa .big { font-size: 18px; } .aa .small { font-size: 13px; }
.progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); }

/* ── The article ── */
.column { font-size: calc(var(--fs) - var(--narrow)); width: min(100% - 32px, 34em); margin: 0 auto; padding: 2.2em 0 0; }
h1 {
  margin: 0 0 0.45em; font: 700 clamp(1.55em, 1.05em + 2.2vw, 2.15em)/1.14 var(--display);
  letter-spacing: -0.012em; text-wrap: balance;
}
.deck { margin: 0 0 0.9em; font: 400 1.08em/1.45 var(--serif); color: var(--muted); text-wrap: pretty; }
.meta { margin: 0; font: 400 0.74em/1.5 var(--sans); color: var(--muted); font-variant-numeric: tabular-nums; }
.meta .section { color: var(--ink); font-weight: 600; }
/* Each part (section, byline, date) stays whole; the row only breaks at the separators. */
.meta span { white-space: nowrap; }
.meta span + span::before { content: "·"; margin: 0 0.5em; color: var(--rule-strong); }
.hero { margin: 1.4em 0 0; }
.hero img { display: block; width: 100%; height: auto; background: var(--chip); }

.content { margin-top: 1.6em; font-family: var(--body); line-height: 1.62; overflow-wrap: break-word; }
.root[data-font="legible"] .content { line-height: 1.7; letter-spacing: 0.005em; }
.content > :first-child { margin-top: 0; }
.content p, .content div { margin: 0 0 1.05em; }
.content h2, .content h3, .content h4 { font-family: var(--serif); line-height: 1.25; margin: 1.7em 0 0.5em; text-wrap: balance; }
.content h2 { font-size: 1.28em; } .content h3 { font-size: 1.12em; } .content h4 { font-size: 1em; }
.content a { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.2em; text-decoration-color: var(--rule-strong); }
.content a:hover { text-decoration-color: var(--accent); }
.content img, .content picture, .content video { display: block; max-width: 100%; height: auto; margin: 1.6em 0 0.5em; }
.content figure { margin: 1.6em 0; }
.content figure img { margin: 0 0 0.5em; }
.content figcaption { font: 0.72em/1.45 var(--sans); color: var(--muted); }
.content ul, .content ol { margin: 0 0 1.1em; padding-left: 1.25em; }
.content li + li { margin-top: 0.4em; }
.content li::marker { color: var(--muted); }
.content blockquote { margin: 1.7em 0; padding: 0.9em 0 0.2em; border-top: 2px solid var(--ink); border-bottom: 1px solid var(--rule); font-size: 0.94em; }
.content blockquote > b:first-child { display: block; margin-bottom: 0.55em; font: 700 0.74em/1.3 var(--sans); letter-spacing: 0.04em; text-transform: uppercase; }
.content blockquote > ul { margin-bottom: 0.9em; }
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
.swatch { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--rule-strong); }
.size { display: flex; align-items: center; gap: 10px; }
.size .icon-btn { border: 1px solid var(--rule); border-radius: 10px; width: 44px; height: 38px; color: var(--ink); font-family: var(--serif); font-weight: 700; }
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
.reopen {
  position: fixed; z-index: 2147483647; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom));
  display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 14px; border: 0; border-radius: 22px; cursor: pointer;
  font: 600 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  color: rgb(255 255 255); background: rgb(18 18 18); box-shadow: 0 6px 20px -4px rgb(0 0 0 / 0.4);
}
.reopen svg { color: rgb(222 172 70); }
.reopen:focus-visible { outline: 2px solid rgb(222 172 70); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .panel, .panel[data-open="true"], .btn, .seg button, .switch, .switch::after { transition: none; }
  .spinner { animation-duration: 2.4s; }
}
`;

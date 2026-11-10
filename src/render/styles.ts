// Overlay styles, scoped by Shadow DOM so the site's CSS can't leak in (or ours out).
// Colors use rgb() rather than hex: iOS Shortcuts reportedly chokes on the hash character.
export const OVERLAY_CSS = `
:host { all: initial; }
.root {
  --bg: rgb(250 249 246); --fg: rgb(28 28 30); --muted: rgb(110 110 115);
  --accent: rgb(0 102 204); --line: rgb(225 225 228);
  position: fixed; inset: 0; z-index: 2147483647; overflow-y: auto; -webkit-overflow-scrolling: touch;
  background: var(--bg); color: var(--fg);
  font: 18px/1.7 Georgia, "Iowan Old Style", "Times New Roman", serif;
}
@media (prefers-color-scheme: dark) {
  .root { --bg: rgb(22 22 24); --fg: rgb(232 232 236); --muted: rgb(150 150 158); --accent: rgb(100 170 255); --line: rgb(50 50 56); }
}
.bar {
  position: sticky; top: 0; display: flex; gap: 8px; align-items: center; justify-content: space-between;
  padding: 10px 16px; background: var(--bg); border-bottom: 1px solid var(--line);
  font: 600 14px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.bar .site { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar button {
  font: inherit; color: var(--accent); background: none; border: 1px solid var(--line);
  border-radius: 999px; padding: 6px 12px; cursor: pointer;
}
article { max-width: 680px; margin: 0 auto; padding: 24px 16px 96px; }
h1 { font-size: 1.6em; line-height: 1.25; margin: 0 0 12px; }
.meta { color: var(--muted); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin-bottom: 20px; }
.hero { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
.content img, .content picture, .content video { max-width: 100%; height: auto; border-radius: 6px; }
.content figure { margin: 20px 0; }
.content figcaption { color: var(--muted); font-size: 0.8em; }
.content a { color: var(--accent); }
.content table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
.content td, .content th { border: 1px solid var(--line); padding: 6px; }
.content blockquote { margin: 16px 0; padding-left: 16px; border-left: 3px solid var(--line); color: var(--muted); }
.content blockquote > b:first-child { display: block; color: var(--fg); margin-bottom: 4px; }
.content blockquote > ul { margin: 0; padding-left: 20px; }
.content blockquote li + li { margin-top: 4px; }
.pages { color: var(--muted); font: 13px system-ui, sans-serif; margin-top: 32px; }
.loading::before {
  content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 8px; vertical-align: -1px;
  border: 2px solid var(--line); border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.reopen {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
  font: 600 14px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: rgb(255 255 255); background: rgb(0 102 204); border: 0; border-radius: 999px;
  padding: 12px 16px; box-shadow: 0 4px 16px rgb(0 0 0 / 0.25); cursor: pointer;
}
`;

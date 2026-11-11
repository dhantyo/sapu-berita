# Browser extension (Chrome, Brave, Edge)

On a computer, Sapu Berita runs on its own whenever you open an article from a supported site.

> During the beta the extension isn't in the Chrome Web Store yet, so it's installed by hand (about a minute).

## Install

1. Download **sapu-berita-extension-….zip** from the [Releases](https://github.com/dhantyo/sapu-berita/releases/latest) page and unzip it (right-click → *Extract All*).
2. Open `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`).
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and pick the unzipped folder.
5. Open an article on Detik, Kompas or another supported site.

Chrome may show a notice about developer-mode extensions when it starts. That's expected for extensions installed this way.

## Updates

When a new version is out, a box appears above the article: **"Sapu Berita … sudah tersedia"** (is available). Tap **Update**, download the new zip, replace the contents of the same folder, and click ↻ on the Sapu Berita card in the extensions page. Your settings are kept.

## For developers

1. `npm run build` writes `content.js` and `manifest.json` here.
2. Load this folder unpacked as above. The DevTools console shows `[sapuberita]` debug logs.
3. After changing code or rules, run `npm run build` again and click ↻ on the extension card.

To test the **mobile** layouts (Tribun and Liputan6 serve different markup), turn on DevTools' device toolbar (Ctrl+Shift+M) and reload.

# Desktop dev extension

For developing and testing rules on Windows/macOS/Linux with Chrome DevTools. Not meant for end users.

1. Run `npm run build`. This writes `content.js` here.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick this folder.
3. Open an article on a supported site. The overlay should appear, and DevTools' console shows `[bacabersih]` debug logs.
4. After changing code or rules, run `npm run build` again and click ↻ on the extension card.

To test the **mobile** layouts (Tribun and Liputan6 differ), turn on DevTools' device toolbar (Ctrl+Shift+M) and reload.

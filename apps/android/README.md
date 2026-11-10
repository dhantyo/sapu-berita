# Android link router (planned)

A tiny app the user sets as their **default browser** once:

- **News link** (domain is in `rules.json`): opens in the app's own WebView, injects `dist/webview.js`, and shows the overlay.
- **Anything else, or the overlay failed:** handed to the user's real browser right away.

The WebView entry reports back through `window.BacaBersihAndroid.onResult(json)` → `{ rendered, reason }`, so the app can fall back to Chrome when `rendered` is false.

## Plan
1. Study [URLCheck](https://github.com/TrianguloY/URLCheck) (CC BY 4.0), a modular link interceptor: intent filters for http/https, the "open with" chooser, and forwarding to another browser. Fork it if its structure fits, otherwise copy its link-handling approach.
2. Kotlin, one Activity with a WebView, `addJavascriptInterface` for the bridge, inject `webview.js` in `onPageFinished`.
3. Domain list taken from the same `rules.json` (bundled + remote), so new outlets work without an app update.

## Distribution
Free: a signed APK on GitHub Releases. **Check first:** Google's 2026 developer-verification rule for sideloaded apps (Indonesia was in the first wave). It may require a verified developer account even outside the Play Store.

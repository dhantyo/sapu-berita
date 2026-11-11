# Android link router

The app claims **only the news sites' links**, the way the YouTube app claims youtube.com. The reader's browser is untouched; no default-browser role.

- The manifest's link filter lists every news host (generated from the rules by `npm run build`, between the `sapu:hosts` markers). No `autoVerify`: we don't own these domains, so Android 12+ leaves them off until the reader turns them on once under **Open by default → Add link** (the setup screen opens that page and shows "Active on N of M" from `DomainVerificationManager`). Android 11 and older show the usual chooser on first tap; the reader picks **Always**.
- **Article link:** opens in the app's own WebView with the Sapu Berita script injected at document start. The overlay sits in the browser's top layer, so even full-screen interstitial ads can't cover it.
- **Homepage / section link of a news site, or any link tapped inside the reader that isn't an article:** handed to the reader's default browser.
- If a site's official app is installed and verified for its domain, Android sends that site's links to it; we can't override that.
- **Settings** (font, size, theme, language) are stored in the app and shared by every site, unlike the iPhone Shortcut's per-site storage.

User-facing install guide: [docs/install-android.md](../../docs/install-android.md).

## Build

```bash
npm run build                      # writes app/src/main/assets/{webview.js,domains.json}
cd apps/android && ./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`. CI builds the same APK on every push (artifact `sapu-berita-android-apk`).

Plain Java, no Kotlin, one dependency (`androidx.webkit` for document-start scripts). minSdk 26 (Android 8), targetSdk 35.

| File | Role |
|---|---|
| `RouterActivity` | Invisible. Receives news-site links; article → Reader, else → default browser. |
| `ReaderActivity` | WebView + injected script + JS bridge (`window.SapuBeritaAndroid`: shared settings, result log). Debug builds enable `chrome://inspect`. |
| `SetupActivity` | One-time setup: opens "Open by default", shows "Active on N of M sites", sample article. |
| `NewsSites` / `Browsers` | Domain + article-path matching from `domains.json`; default-browser lookup for forwarding. |

Testing without tapping through settings: `adb shell pm set-app-links-user-selection --user 0 --package id.sapu.berita true all`.

## Tested on the Pixel 5 emulator (Android 14), 2026-11-11

- Setup screen: "Active on 16 of 16 news sites" after enabling the links.
- A Kompas article link → clean reader on top of Kompas's interstitial ad (`rendered: true`). A Suara article → clean, summary box and byline intact.
- The Detik homepage → forwarded to Chrome.
- One "isn't responding" dialog at first launch, while the emulator ran at load average 7 to 10 and Android's own system process was also dropping frames (WebView engine start-up on the main thread). **Check on a real phone**; if it shows there too, show a lightweight view first and create the WebView a frame later.

## Distribution: Google's developer verification (Indonesia, since 2026-09-30)

From Google's announcement ([Android Developers Blog, March 2026](https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html)): apps must be registered by a **verified developer** to install on certified Android devices in Brazil, Indonesia, Singapore and Thailand from 30 September 2026, Play Store or not. Options:

| Path | Cost | Reach | Notes |
|---|---|---|---|
| **Limited distribution account** (students/hobbyists) | free, email only, no ID | **up to 20 devices** | Right for the beta with friends. |
| Full developer verification | identity verification (fee not stated in the post) | everyone | Needed for a public release, with or without Play Store. |
| Unregistered APK | free | anyone willing | Google's "advanced flow" (multi-step, with a waiting period) or `adb install`; too much for normal users. |

Before a public release: register the package `id.sapu.berita` under a verified account.

## Signing

Phones only accept an update signed with the same key as the installed app, so every published APK is signed by CI with one release key, read from Actions secrets:

| Secret | Value |
|---|---|
| `SAPU_KEYSTORE_B64` | the `.jks` keystore, base64-encoded |
| `SAPU_KEYSTORE_PASSWORD`, `SAPU_KEY_ALIAS`, `SAPU_KEY_PASSWORD` | its passwords and alias |

Without them (forks, pull requests, local builds) `assembleRelease` falls back to the debug key; a release tag fails instead. Back up the keystore and its passwords outside GitHub: a lost key means every user has to uninstall and reinstall.

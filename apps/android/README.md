# Android link router

A small app the reader sets as their **default browser** once:

- **News link** (a host from the same rules the cleaner uses): opens in the app's own WebView with the Sapu Berita script injected at document start. The overlay sits in the browser's top layer, so even full-screen interstitial ads can't cover it.
- **Any other link:** handed straight to the reader's real browser (picked once on the setup screen; defaults to Chrome, Brave, Firefox, Edge or Samsung Internet, whichever is installed).
- **Settings** (font, size, theme, language) are stored in the app and shared by every site, unlike the iPhone Shortcut's per-site storage.

User-facing install guide (Indonesian): [docs/install-android.md](../../docs/install-android.md).

## Build

```bash
npm run build                      # writes app/src/main/assets/{webview.js,domains.json}
cd apps/android && ./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`. CI builds the same APK on every push (artifact `sapu-berita-android-apk`).

Plain Java, no Kotlin, one dependency (`androidx.webkit` for document-start scripts). minSdk 26 (Android 8), targetSdk 35.

| File | Role |
|---|---|
| `RouterActivity` | Invisible. Receives every link; news → Reader, else → real browser. |
| `ReaderActivity` | WebView + injected script + JS bridge (`window.SapuBeritaAndroid`: shared settings, result log). Debug builds enable `chrome://inspect`. |
| `SetupActivity` | One-time setup: default-browser role request, browser for other links, sample article. |
| `NewsSites` / `Browsers` | Domain matching from `domains.json`; forwarding target. |

## Tested on the Pixel 5 emulator (Android 14), 2026-11-11

- Setup screen renders; Chrome detected as the browser for other links.
- With the app as default browser: a Kompas article link → clean reader on top of Kompas's interstitial ad (`rendered: true`).
- A Wikipedia link → forwarded straight to Chrome.
- One "isn't responding" dialog at first launch, while the emulator ran at load average 7 to 10 and Android's own system process was also dropping frames (WebView engine start-up on the main thread). **Check on a real phone**; if it shows there too, show a lightweight view first and create the WebView a frame later.

## Distribution: Google's developer verification (Indonesia, since 2026-09-30)

From Google's announcement ([Android Developers Blog, March 2026](https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html)): apps must be registered by a **verified developer** to install on certified Android devices in Brazil, Indonesia, Singapore and Thailand from 30 September 2026, Play Store or not. Options:

| Path | Cost | Reach | Notes |
|---|---|---|---|
| **Limited distribution account** (students/hobbyists) | free, email only, no ID | **up to 20 devices** | Right for the alpha with friends. |
| Full developer verification | identity verification (fee not stated in the post) | everyone | Needed for a public release, with or without Play Store. |
| Unregistered APK | free | anyone willing | Google's "advanced flow" (multi-step, with a waiting period) or `adb install`; too much for normal users. |

Before a public release: register the package `id.sapu.berita` under a verified account and replace the debug signing key with a real one (`app/build.gradle.kts`).

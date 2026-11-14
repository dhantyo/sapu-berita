# Who uses Sapu Berita, and how

Character cards for the people we build for, then every way they reach an article and every way they give (or don't give) feedback. Status marks:

- ✅ works and was tested
- 🟡 should work, not yet tested on a real device
- ❌ doesn't work today
- ❓ unknown, needs checking

Written 2026-11-11, at version 0.1.0 (then called 0.1.0-beta.1), before the first release.

---

## Character cards

### 1. Bu Rina, the family-group reader
| | |
|---|---|
| **Who** | 47, mother of three, Surabaya. Not technical. |
| **Device** | Samsung Galaxy A-series, Android 14, Chrome. |
| **Where links come from** | WhatsApp family and arisan groups: Detik, Tribun daerah, Kompas. 10 to 20 links a day. |
| **What she wants** | To read the story without ads jumping around and without tapping "halaman 2" five times. Bigger text. |
| **What annoys her** | Full-screen ads, videos that autoplay, "Baca Juga" cutting the paragraph, tiny text. |

**Journey today**
1. Her son sends the APK link. 🟡 She opens GitHub Releases on her phone, which is confusing (lots of files). ❓ Whether Play Protect or Google's developer verification **blocks the install outright** in Indonesia. Today it probably does, until we register (see State, below).
2. Allow "Instal aplikasi tidak dikenal" for Chrome or WhatsApp. 🟡 A scary system warning; this is where most people quit.
3. Opens Sapu Berita → "Atur link berita" → "Tambahkan link" → ticks 17 sites. 🟡 On Samsung (One UI) the screen is worded differently from Pixel; the guide's labels may not match.
4. Taps a Detik link in WhatsApp. 🟡 Should open clean. ❓ Depends on WhatsApp handing the link to Android (good) rather than its own in-app browser (bad).
5. Taps **Aa**, makes text bigger. ✅ Remembered for every site.

**Where it breaks:** if the official Detik app is installed, Detik links go there, not to us. Links to unsupported sites (Kumparan) just open in Chrome, so she may think Sapu Berita "stopped working".

**Feedback she would give:** none on GitHub. She would tell her son, or say "aplikasinya error" in the family group. If the reader looks broken, she taps **Asli** and carries on.

---

### 2. Dimas, the commuter on iPhone
| | |
|---|---|
| **Who** | 26, office worker in Jakarta, reads news on the KRL. |
| **Device** | iPhone 13, iOS 26, Safari plus Instagram, X and Telegram. |
| **Where links come from** | X threads, Instagram stories (link stickers), Telegram channels, Google search. |
| **What he wants** | The point of the story fast. The "Ringkasan Berita" box. Dark mode at night. |

**Journey today**
1. ❌ No iCloud link yet: the Shortcut hasn't been assembled. Nothing to install.
2. Once it exists: open the iCloud link → "Tambahkan Pintasan" → Settings → Pintasan → Lanjutan → "Izinkan Menjalankan Skrip". 🟡 That setting is buried; most people give up there.
3. Taps a link in X or Instagram → it opens in **their in-app browser**. ❌ The Shortcut can't run there. He must tap "Open in Safari" first.
4. In Safari: Share → Sapu Berita → "Izinkan Selalu" (once per site). 🟡
5. Reads. Settings are remembered **per site** (Safari storage), so he sets dark mode again on each outlet. 🟡

**Where it breaks:** every article costs two extra taps (Share, then Sapu Berita). There's no automatic mode on iOS without a paid App Store app.

**Feedback he would give:** a reply or quote-post on X ("kok error di Tribun"), or a DM. Maybe a GitHub issue if the link is in the Share sheet result. He has no GitHub account.

---

### 3. Pak Hendra, the low-vision reader
| | |
|---|---|
| **Who** | 63, retired teacher, Medan. Reading glasses, larger system font. |
| **Device** | Android tablet or phone with system font at 130%. |
| **What he needs** | Big, high-contrast text; no motion; nothing that moves while he reads. |

**Journey today:** like Bu Rina. ✅ Text size steps, the "Jelas" (legible) font and dark or sepia themes exist. 🟡 Not tested with Android's system font scaling and TalkBack.

**Feedback he would give:** to whoever installed it for him. Needs a way to report that doesn't require typing much.

---

### 4. Sari, the desktop reader at work
| | |
|---|---|
| **Who** | 31, analyst. Reads Bisnis.com, CNBC Indonesia and Kontan on her work laptop. |
| **Device** | Windows 11, Chrome or Edge, maybe managed by company IT. |

**Journey today**
1. Downloads the extension zip, unzips, turns on Developer mode, Load unpacked. 🟡 Possible on a personal laptop. ❌ Often blocked on a company-managed browser.
2. Chrome shows a "developer mode extensions" warning. Some people remove the extension because of it.
3. Opens a Bisnis.com article. 🟡 Should open clean automatically. ✅ Verified in a browser.
4. Updates: download a new zip, replace the folder, press ↻. ❌ No automatic updates.

**Where it breaks:** Kontan isn't supported. No Chrome Web Store listing, so no auto-update and no one-click install.

**Feedback she would give:** a GitHub issue is plausible (desktop, has time), or email.

---

### 5. Mbak Tia, the Mac and Safari user
| | |
|---|---|
| **Device** | MacBook Air, Safari. Same iCloud account as her iPhone. |

**Journey today:** ❌ Blocked by the missing iCloud link. Afterwards: the same Shortcut syncs to her Mac 🟡, plus Safari → "Izinkan JavaScript dari Apple Events" in the Develop menu ❓ (not yet verified as needed). Runs from Safari's Share button.

---

### 6. Fajar, the contributor
| | |
|---|---|
| **Who** | 22, CS student, knows DevTools and Git. Annoyed that his campus news site isn't supported. |

**Journey today**
1. Finds the repo. ❌ It's private, so he can't.
2. Once public: README → CONTRIBUTING → `npm run probe -- https://site` drafts a rule → `npm run capture` → `npm run check` → pull request. ✅ The tooling exists.
3. CI checks his PR. ✅ The site-rule schema rejects mistakes.

**Feedback he would give:** issues and PRs. Our best case, but rare.

---

### 7. The accidental user
Someone a friend set it up for, who opens a link from an **unsupported** site, a **homepage**, or a **paywalled** Tempo article. Nothing visible happens (Android sends it to the browser; on iOS the Shortcut says "bukan artikel"). They conclude it's broken. Feedback: none, or uninstall.

---

## Every way to reach an article

How a tap on a news link reaches the reader, per platform.

| Where the link is tapped | Android | iPhone / iPad | Desktop extension |
|---|---|---|---|
| WhatsApp chat | 🟡 opens clean (if WA hands off to Android) | Opens in Safari → Share → Sapu Berita 🟡 | ✅ WhatsApp Web/Desktop opens the browser, the extension runs |
| Telegram | ❓ Telegram's in-app browser may keep it | in-app browser → "Open in Safari" first | ✅ |
| X / Twitter | ❓ X in-app browser on by default | in-app browser → Safari first | ✅ |
| Instagram, Facebook, TikTok | ❌ in-app browser keeps it; user must pick "Buka di browser", which then goes to Chrome, not us | ❌ in-app browser → Safari first | ✅ |
| LINE | ❓ | in-app browser | ✅ |
| Gmail / email | 🟡 | Safari 🟡 | ✅ |
| Google Search app, Google Discover | ❌ opens in Google's own view | Google app's browser → Safari first | ✅ |
| Typed or browsed inside Chrome | ❌ stays in Chrome (Android doesn't hand off inside the browser) | ✅ Share → Sapu Berita | ✅ |
| Official outlet app installed (Detik, Kompas…) | ❌ that app wins for its own domain | n/a | n/a |
| Link to a homepage or section page | ✅ sent on to the browser, on purpose | Shortcut says "bukan artikel" | stays as is |
| Unsupported site | ✅ browser, untouched | ❓ generic extraction may kick in, or "bukan artikel" | not matched, untouched |
| Article split over pages | ✅ merged | ✅ merged | ✅ merged |
| Paywalled article (Tempo, Kompas.id) | not supported, by design | same | same |

The weakest spots: Instagram, Facebook and TikTok in-app browsers (no fix on either platform), and links opened inside Chrome on Android.

---

## Every way feedback can happen

| Situation | What the user does | Where it lands today | Gap |
|---|---|---|---|
| Article looks wrong, user is technical | GitHub issue "Artikel rusak" (form asks for the link) | ✅ GitHub, once the repo is public | Needs a GitHub account |
| Article looks wrong, user is not technical | **Aa → Laporkan** (link and version prefilled) | GitHub issue form | Still needs a GitHub account; `update.json` can switch it to a no-account form |
| Site redesign breaks a rule for everyone | Nobody reports it | ✅ daily canary goes red (most sites) | Bisnis, Tirto, and Tribun from CI are blocked; checked by hand only |
| Wants a new site | GitHub "Usul situs baru" | GitHub | Needs a GitHub account |
| Install fails (unknown sources, Play Protect, verification) | Gives up | Nowhere | No channel before the app even works |
| iOS "Izinkan Menjalankan Skrip" confusion | Gives up | Nowhere | Needs a video or GIF in the guide |
| Likes it | Shares the link in a WA group | Word of mouth | No simple landing page to share (GitHub is intimidating) |
| Complains publicly (X, TikTok) | Post or mention | Not seen | No account to monitor |
| Uninstalls | Silent | Nowhere | No analytics, by design (privacy) |
| Bug in the reader UI itself (settings, theme) | GitHub "Masalah lain" | GitHub | Needs an account; the version is under **Aa** |

### What would close the biggest gaps
1. ~~"Laporkan" button in the reader~~ Done (Aa panel). Remaining: a target that needs no GitHub account (Google Form, email or WhatsApp), set through `update.json` without an app update.
2. **A short landing page** (GitHub Pages) with one big button per platform, linked from the README. Easier to share in WhatsApp than a GitHub repo.
3. **A 30-second screen recording** for the Android "Open by default" step and the iOS "Allow Running Scripts" step.
4. **A Telegram or WhatsApp group** for beta testers, as the low-friction feedback channel for the first 20 people.

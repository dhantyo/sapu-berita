# Ikut membantu / Contributing

Terima kasih! Ada tiga cara membantu, dari yang paling mudah.

## 1. Laporkan artikel yang tampil aneh

Paling mudah: di artikel itu, buka **Aa → Laporkan**. Tautan artikel dan versi Sapu Berita sudah terisi otomatis.

Atau [buka laporan baru](../../issues/new/choose) → **Artikel rusak**. Sertakan:
- **tautan artikelnya** (paling penting),
- perangkat yang dipakai (Android, iPhone, ekstensi),
- apa yang salah: teks hilang, masih ada iklan atau "Baca Juga", halaman tidak tergabung, dan sebagainya. Tangkapan layar sangat membantu.

## 2. Usulkan situs berita baru

[Buka usulan baru](../../issues/new/choose) → **Usul situs baru**, dengan nama situs dan 2 sampai 3 tautan artikel.

## 3. Tulis atau perbaiki aturan situs (code)

*English from here on.*

Most fixes are a few lines of JSON in `rules/sites/<site>.json`. Read [docs/RULES.md](docs/RULES.md) first; the short version:

1. `npm install`, then load the extension (`npm run build`, then *Load unpacked* `apps/extension/` in `chrome://extensions`).
2. Open the broken article, find the element that wraps the paragraphs in DevTools, and fix `body`, `remove` or `pagination` in the rule.
3. Add the article as a fixture: `npm run capture -- <url>`.
4. `npm run check` must pass. Then open a pull request with the article link in the description.

For a new site, `npm run probe -- https://www.example.com` drafts the rule for you.

Ground rules:
- **No paywall bypassing.** Sapu Berita cleans what the site already shows you.
- **No servers, no analytics.** Everything runs on the reader's device. The only request of our own is the daily, opt-out fetch of `update.json` and `rules.json` from the release channel; it carries nothing about the reader.
- Prefer stable selectors (ids, semantic class names) over generated ones like `.css-1x2y3z`.

More background: [docs/DEVELOPING.md](docs/DEVELOPING.md).

# Ekstensi browser (Chrome, Brave, Edge)

Di komputer, Sapu Berita berjalan otomatis setiap kali kamu membuka artikel dari situs yang didukung.

> Selama beta, ekstensi belum ada di Chrome Web Store, jadi dipasang secara manual (±1 menit).

## Pasang

1. Unduh **sapu-berita-extension-….zip** dari halaman [Releases](https://github.com/dhantyo/bacabersih/releases/latest), lalu ekstrak (klik kanan → *Extract All*).
2. Buka `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`).
3. Nyalakan **Developer mode** / **Mode pengembang** di pojok kanan atas.
4. Klik **Load unpacked** / **Muat yang belum dibuka**, lalu pilih folder hasil ekstrak tadi.
5. Buka artikel dari Detik, Kompas, atau situs lain yang didukung.

**Memperbarui:** unduh zip versi baru, timpa isi folder yang sama, lalu klik ↻ di kartu Sapu Berita pada halaman ekstensi. Pengaturanmu tetap tersimpan.

## For developers

1. `npm run build` writes `content.js` and `manifest.json` here.
2. Load this folder unpacked as above. The DevTools console shows `[bacabersih]` debug logs.
3. After changing code or rules, run `npm run build` again and click ↻ on the extension card.

To test the **mobile** layouts (Tribun and Liputan6 serve different markup), turn on DevTools' device toolbar (Ctrl+Shift+M) and reload.

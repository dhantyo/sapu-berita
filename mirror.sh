#!/usr/bin/env bash
# Copy the release channel of dhantyo/berita-rapih into out/, served at the old address.
set -euo pipefail
SRC=https://dhantyo.github.io/berita-rapih/
rm -rf out && mkdir out
if curl -fsS "${SRC}files.txt" -o files.txt && grep -qx update.json files.txt; then :; else
  # Before the first release with files.txt, or the list came back empty.
  echo "using the built-in file list"
  printf '%s\n' update.json rules.json berita-rapih.js sapu-berita.js apple-loader.js bookmarklet.txt \
    fonts/geist.woff2 fonts/fira-sans-400.woff2 fonts/fira-sans-400-italic.woff2 fonts/fira-sans-700.woff2 \
    fonts/merriweather-400.woff2 fonts/merriweather-400-italic.woff2 fonts/merriweather-700.woff2 \
    fonts/OFL-FiraSans.txt fonts/OFL-Geist.txt fonts/OFL-Merriweather.txt > files.txt
fi
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in *.html|img/*) continue ;; esac   # pages are redirects here; images belong to the install page
  mkdir -p "out/$(dirname "$f")"
  curl -fsS "$SRC$f" -o "out/$f" || { rm -f "out/$f"; echo "could not copy $f"; }
done < files.txt
echo "files: $(wc -l < files.txt) listed, $(find out -type f | wc -l) copied"
# Must be there and valid, or keep the last good copy (fail the run before deploying).
for f in update.json rules.json; do node -e "JSON.parse(require('fs').readFileSync('out/$f','utf8'))"; done
# The Apple Shortcut and bookmark from before the rename download sapu-berita.js.
[ -s out/berita-rapih.js ] && cp out/berita-rapih.js out/sapu-berita.js
test -s out/sapu-berita.js
redirect() { # $1 file, $2 target
  cat > "out/$1" <<HTML
<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Berita Rapih</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="$2"><meta http-equiv="refresh" content="0; url=$2">
<script>location.replace("$2" + location.hash)</script></head>
<body><p>Sapu Berita sekarang bernama Berita Rapih: <a href="$2">$2</a></p></body></html>
HTML
}
redirect index.html "${SRC}"
redirect privacy.html "${SRC}privacy.html"
redirect 404.html "${SRC}"
(cd out && find . -type f | sort | xargs sha256sum) | sha256sum | cut -d' ' -f1 > out/mirror-hash.txt
echo "copied $(find out -type f | wc -l) files, hash $(cat out/mirror-hash.txt)"

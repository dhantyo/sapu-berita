// Build every wrapper from the one core.
//   apps/extension/content.js  desktop dev extension (readable, sourcemap)
//   dist/webview.js            Android WebView injection
//   dist/shortcut.js           iOS Shortcut (minified)
//   dist/shortcut.b64.js       same, base64-wrapped: no '#' and no whitespace (iOS 17+/18.4 quirks)
//   dist/apple-loader.js       what goes in the Shortcut: downloads the latest core and runs it
//   dist/bookmarklet.txt       the same loader as a Safari/Chrome bookmark
import { build, type Plugin } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ROOT } from './lib/rules.ts';
import { sharedDefines } from './lib/defines.ts';
import { buildRules } from './build-rules.ts';

// The GitHub repository this build belongs to: CI's own, else the local git remote.
const REPO = process.env.GITHUB_REPOSITORY ?? (() => {
  try {
    return execSync('git remote get-url origin', { encoding: 'utf8' }).trim().match(/github\.com[/:](.+?)(?:\.git)?$/)?.[1] ?? '';
  } catch {
    return '';
  }
})();
const [OWNER = '', NAME = ''] = REPO.split('/');
// Release channel: GitHub Pages of this repo, holding update.json + rules.json (published by the release job).
// Note: GitHub Pages URLs don't redirect after a repository rename; installed copies keep asking the old URL.
const CHANNEL_URL = process.env.SAPU_CHANNEL_URL ?? (REPO ? `https://${OWNER.toLowerCase()}.github.io/${NAME}/` : '');
// "Report a problem": a prefilled "Artikel rusak" issue form. update.json can swap in a form that needs no account.
const REPORT_URL = process.env.SAPU_REPORT_URL || (REPO
  ? `https://github.com/${REPO}/issues/new?template=broken-article.yml&url={url}&details={note}%0A%0A${encodeURIComponent('Sapu Berita ')}{version}%20(%7Bplatform%7D)`.replace('%7Bplatform%7D', '{platform}')
  : '');

const rules = buildRules();

const rulesPlugin: Plugin = {
  name: 'sapuberita-rules',
  setup(b) {
    b.onResolve({ filter: /^sapuberita:rules$/ }, () => ({ path: 'rules', namespace: 'sapuberita' }));
    b.onLoad({ filter: /.*/, namespace: 'sapuberita' }, () => ({ contents: JSON.stringify(rules), loader: 'json' }));
  },
};

const common = {
  bundle: true,
  format: 'iife' as const,
  target: ['safari15', 'chrome100'],
  plugins: [rulesPlugin],
  define: {
    __CHANNEL_URL__: JSON.stringify(CHANNEL_URL),
    __REPORT_URL__: JSON.stringify(REPORT_URL),
    ...sharedDefines(),
  },
  legalComments: 'eof' as const,
  logLevel: 'info' as const,
};

await Promise.all([
  build({
    ...common,
    entryPoints: [join(ROOT, 'src/entries/extension.ts')],
    outfile: join(ROOT, 'apps/extension/content.js'),
    sourcemap: true,
  }),
  build({ ...common, entryPoints: [join(ROOT, 'src/entries/webview.ts')], outfile: join(ROOT, 'dist/webview.js'), minify: true }),
  build({ ...common, entryPoints: [join(ROOT, 'src/entries/shortcut.ts')], outfile: join(ROOT, 'dist/shortcut.js'), minify: true }),
]);

// Base64 wrapper for iOS Shortcuts. `completion` is passed through because Shortcuts defines it as a global.
const shortcut = readFileSync(join(ROOT, 'dist/shortcut.js'), 'utf8');
const b64 = Buffer.from(shortcut, 'utf8').toString('base64');
writeFileSync(
  join(ROOT, 'dist/shortcut.b64.js'),
  `(0,eval)(decodeURIComponent(escape(atob("${b64}"))))`,
);

// Apple loader: what actually goes in the Shortcut and the Safari bookmark. It downloads the latest core
// (dist/shortcut.js, published as sapu-berita.js on the release channel) and runs it, so Apple users never
// re-add anything. Short, one line, no '#' (Shortcuts quirks); `completion` is Shortcuts' global, absent
// in a bookmark. Fails visibly (completion reason) rather than silently if the channel is unreachable.
const CORE_URL = CHANNEL_URL ? new URL('sapu-berita.js', CHANNEL_URL).href : '';
const loader =
  `(function(){var c=typeof completion=='function'?completion:function(){};` +
  `fetch('${CORE_URL}',{cache:'no-cache'}).then(function(r){if(!r.ok)throw r.status;return r.text()})` +
  `.then(function(s){(0,eval)(s)}).catch(function(e){c({rendered:false,reason:'load '+e})})})();`;
if (loader.includes('#')) throw new Error('Apple loader must not contain #');
writeFileSync(join(ROOT, 'dist/apple-loader.js'), loader);
writeFileSync(join(ROOT, 'dist/bookmarklet.txt'), 'javascript:' + encodeURIComponent(loader));

// Desktop dev extension: run on every hand-verified domain (generated, so new rules need no manifest edit).
const manifestPath = join(ROOT, 'apps/extension/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const domains = [...new Set(rules.sites.flatMap((s) => s.domains))].sort();
// A domain under another listed domain (rekomendit.detik.com under detik.com) is already covered by its wildcard.
const covered = (d: string) => domains.some((e) => e !== d && d.endsWith(`.${e}`));
manifest.content_scripts[0].matches = domains.filter((d) => !covered(d)).map((d) => `https://*.${d}/*`);
// One version for every wrapper, from package.json. Chrome wants dotted numbers; the label goes in version_name.
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };
manifest.version = version.split('-')[0];
manifest.version_name = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// Android app assets: the WebView script and the list of news hosts the router keeps in-app.
// Every other link goes straight to the user's normal browser.
const assets = join(ROOT, 'apps/android/app/src/main/assets');
mkdirSync(assets, { recursive: true });
copyFileSync(join(ROOT, 'dist/webview.js'), join(assets, 'webview.js'));
writeFileSync(
  join(assets, 'domains.json'),
  JSON.stringify({
    // Per site: its registrable domains (host === d or ends with "." + d) and its article-path regex.
    // Article links open in the reader; any other page on these hosts goes to the user's browser.
    sites: rules.sites.map((s) => ({ domains: s.domains, article: s.articleUrl })),
  }),
);

// Android manifest: the hosts whose links the app may open (user approves them under "Open by default").
const manifestXml = join(ROOT, 'apps/android/app/src/main/AndroidManifest.xml');
// Each host is one checkbox the reader must tick in Android's "Add link" dialog (there's no "select all"),
// so list only what articles use: "*.site" (news.detik.com, www.suara.com), plus the bare domain only
// for sites that publish articles there (tirto.id/…), judged from each rule's sample articles.
const apexArticles = new Set(rules.sites.flatMap((s) =>
  (s.samples ?? []).map((u) => new URL(u).hostname).filter((h) => s.domains.includes(h))));
const hosts = domains.filter((d) => !covered(d)).flatMap((d) => (apexArticles.has(d) ? [d, `*.${d}`] : [`*.${d}`]));
const xml = readFileSync(manifestXml, 'utf8').replace(
  /(<!-- sapu:hosts:start[^>]*-->)[\s\S]*?(\s*<!-- sapu:hosts:end -->)/,
  (_m, start: string, end: string) =>
    `${start}\n${hosts.map((h) => `                <data android:host="${h}" />`).join('\n')}${end}`,
);
writeFileSync(manifestXml, xml);

const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB`;
const hashes = (shortcut.match(/#/g) ?? []).length;
console.log(`shortcut.js ${kb(shortcut)} (contains ${hashes} '#'), shortcut.b64.js ${kb(b64)}, apple loader ${loader.length} chars`);

// Build every wrapper from the one core.
//   apps/extension/content.js  desktop dev extension (readable, sourcemap)
//   dist/webview.js            Android WebView injection
//   dist/shortcut.js           iOS Shortcut (minified)
//   dist/shortcut.b64.js       same, base64-wrapped: no '#' and no whitespace (iOS 17+/18.4 quirks)
import { build, type Plugin } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/rules.ts';
import { buildRules } from './build-rules.ts';

const REMOTE_RULES_URL = process.env.REMOTE_RULES_URL ?? '';

const rules = buildRules();

const rulesPlugin: Plugin = {
  name: 'bacabersih-rules',
  setup(b) {
    b.onResolve({ filter: /^bacabersih:rules$/ }, () => ({ path: 'rules', namespace: 'bacabersih' }));
    b.onLoad({ filter: /.*/, namespace: 'bacabersih' }, () => ({ contents: JSON.stringify(rules), loader: 'json' }));
  },
};

const common = {
  bundle: true,
  format: 'iife' as const,
  target: ['safari15', 'chrome100'],
  plugins: [rulesPlugin],
  define: { __REMOTE_RULES_URL__: JSON.stringify(REMOTE_RULES_URL) },
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

// Desktop dev extension: run on every hand-verified domain (generated, so new rules need no manifest edit).
const manifestPath = join(ROOT, 'apps/extension/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const domains = [...new Set(rules.sites.flatMap((s) => s.domains))].sort();
manifest.content_scripts[0].matches = domains.map((d) => `https://*.${d}/*`);
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
const hosts = domains.flatMap((d) => [d, `*.${d}`]);
const xml = readFileSync(manifestXml, 'utf8').replace(
  /(<!-- sapu:hosts:start[^>]*-->)[\s\S]*?(\s*<!-- sapu:hosts:end -->)/,
  (_m, start: string, end: string) =>
    `${start}\n${hosts.map((h) => `                <data android:host="${h}" />`).join('\n')}${end}`,
);
writeFileSync(manifestXml, xml);

const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB`;
const hashes = (shortcut.match(/#/g) ?? []).length;
console.log(`shortcut.js ${kb(shortcut)} (contains ${hashes} '#'), shortcut.b64.js ${kb(b64)}`);

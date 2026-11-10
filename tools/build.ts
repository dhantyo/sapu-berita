// Build every wrapper from the one core.
//   apps/extension/content.js  desktop dev extension (readable, sourcemap)
//   dist/webview.js            Android WebView injection
//   dist/shortcut.js           iOS Shortcut (minified)
//   dist/shortcut.b64.js       same, base64-wrapped: no '#' and no whitespace (iOS 17+/18.4 quirks)
import { build, type Plugin } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
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

const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB`;
const hashes = (shortcut.match(/#/g) ?? []).length;
console.log(`shortcut.js ${kb(shortcut)} (contains ${hashes} '#'), shortcut.b64.js ${kb(b64)}`);

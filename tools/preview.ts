// Serve the design preview: http://localhost:5178/  (pick a fixture, or ?fx=<site>/<slug>)
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { ROOT, assembleRuleSet } from './lib/rules.ts';

const PORT = Number(process.env.PORT ?? 5178);

async function bundle(): Promise<string> {
  const rules = assembleRuleSet(); // re-read on every load so rule edits show up without a restart
  const out = await build({
    entryPoints: [join(ROOT, 'src/entries/preview.ts')],
    bundle: true, format: 'iife', write: false, target: ['safari15', 'chrome100'],
    define: {
      __CHANNEL_URL__: '""',
      __GEIST__: JSON.stringify(readFileSync(join(ROOT, 'fonts/geist.woff2')).toString('base64')),
      __PSWP_CSS__: JSON.stringify(readFileSync(join(ROOT, 'node_modules/photoswipe/dist/photoswipe.css'), 'utf8')),
      __REPORT_URL__: '"https://github.com/example/repo/issues/new?url={url}&details={version}%20({platform})"',
      __SAPU_VERSION__: JSON.stringify((JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version),
    },
    plugins: [{
      name: 'rules',
      setup(b) {
        b.onResolve({ filter: /^sapuberita:rules$/ }, () => ({ path: 'rules', namespace: 'sb' }));
        b.onLoad({ filter: /.*/, namespace: 'sb' }, () => ({ contents: JSON.stringify(rules), loader: 'json' }));
      },
    }],
  });
  return out.outputFiles[0]!.text;
}

const fixtures = () => {
  const dir = join(ROOT, 'test', 'fixtures');
  return readdirSync(dir).flatMap((site) => readdirSync(join(dir, site)).map((slug) => `${site}/${slug}`));
};

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript' };

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': TYPES['.html']! });
      res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sapu Berita preview</title><body style="font:16px system-ui;margin:24px"><script src="/preview.js"></script>');
    } else if (url.pathname === '/preview.js') {
      res.writeHead(200, { 'content-type': TYPES['.js']!, 'cache-control': 'no-store' });
      res.end(await bundle()); // rebuilt on every load: edit, reload, see
    } else if (url.pathname === '/fixtures') {
      res.writeHead(200, { 'content-type': TYPES['.json']! });
      res.end(JSON.stringify(fixtures()));
    } else if (url.pathname.startsWith('/fonts/')) {
      const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
      if (!file.startsWith(join(ROOT, 'fonts')) || !existsSync(file)) throw new Error('not found');
      res.writeHead(200, { 'content-type': 'font/woff2' });
      res.end(readFileSync(file));
    } else if (url.pathname.startsWith('/test/fixtures/')) {
      const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
      if (!file.startsWith(join(ROOT, 'test', 'fixtures')) || !existsSync(file)) throw new Error('not found');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'text/plain' });
      res.end(readFileSync(file));
    } else {
      throw new Error('not found');
    }
  } catch (err) {
    res.writeHead(404).end(String(err));
  }
}).listen(PORT, () => console.log(`preview on http://localhost:${PORT}/`));

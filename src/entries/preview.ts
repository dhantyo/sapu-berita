// Dev preview (npm run preview): runs the real pipeline on a saved fixture and draws the overlay,
// so the design can be checked at any viewport without loading the extension on a live site.
import bundledRules from 'sapuberita:rules';
import { parseHtml, renderOverlay, run } from '../index.ts';
import { localStorageStore, normalizeSettings } from '../settings.ts';
import { ensureFonts } from '../render/fonts.ts';

declare const __GEIST__: string;

interface Fixture {
  url: string;
  pages: Record<string, string>;
}

const params = new URLSearchParams(location.search);
const fx = params.get('fx');

async function main() {
  if (!fx) {
    const list = (await (await fetch('/fixtures')).json()) as string[];
    document.body.innerHTML = '<h1>Sapu Berita preview</h1>' +
      list.map((f) => `<p><a href="?fx=${encodeURIComponent(f)}">${f}</a></p>`).join('');
    return;
  }
  const base = `/test/fixtures/${fx}/`;
  const meta = (await (await fetch(base + 'fixture.json')).json()) as Fixture;
  const doc = parseHtml(await (await fetch(base + 'page.html')).text(), meta.url);
  // ?theme=dark etc. override the saved settings (used for README screenshots).
  const overrides = Object.fromEntries(['theme', 'font', 'lang'].flatMap((k) => (params.get(k) ? [[k, params.get(k)]] : [])));
  const settings = normalizeSettings({ ...(await localStorageStore.load()), ...overrides });

  let overlay: ReturnType<typeof renderOverlay> | null = null;
  await run(
    {
      doc,
      url: new URL(meta.url),
      rules: bundledRules,
      fetchDocument: async (u) => {
        const file = meta.pages[u.href];
        if (!file) throw new Error(`no fixture page for ${u.href}`);
        return parseHtml(await (await fetch(base + file)).text(), u.href);
      },
      log: (m, d) => console.debug('[preview]', m, d ?? ''),
    },
    (r, loadingMore) => {
      if (!r.ok) {
        document.body.textContent = `Pipeline skipped this fixture: ${r.reason} ${r.detail ?? ''}`;
        return;
      }
      // The pipeline built the article in the fixture document; move it into this page.
      r.article.content = document.importNode(r.article.content, true) as HTMLElement;
      if (overlay) overlay.update(r.article, loadingMore);
      else overlay = renderOverlay(document, r.article, {
        settings, loadingMore, originalUrl: meta.url,
        onSettingsChange: (s) => void localStorageStore.save(s),
        reportUrl: () => 'https://github.com/example/repo/issues/new',
        loadFonts: (f) => ensureFonts(document, f, __GEIST__, new URL('/fonts/', location.href).href),
      });
      // ?update=0.2.0 shows the "new version" bar.
      const offered = params.get('update');
      if (offered && !loadingMore) overlay.offerUpdate({ version: offered, url: '#update' });
    },
  );
}

void main();

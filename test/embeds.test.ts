import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertEmbeds } from '../src/clean/embeds.ts';
import { run } from '../src/index.ts';
import { assembleRuleSet } from '../tools/lib/rules.ts';
import { documentFromHtml, nodeContext } from '../tools/lib/dom.ts';
import { savedPagesPresent } from './saved-pages.ts';

const convert = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  const n = convertEmbeds(root);
  return { n, root, card: root.querySelector('figure[data-embed]') };
};

describe('embed markup → static cards', () => {
  it('X / Twitter blockquote: text, handle, status link', () => {
    const { card } = convert(
      '<p>Kata dia:</p><blockquote class="twitter-tweet"><p lang="in">Hari ini rapat paripurna.</p>&mdash; DPR RI (@DPR_RI) <a href="https://twitter.com/DPR_RI/status/1234567890?ref_src=twsrc">November 10, 2026</a></blockquote><script src="https://platform.twitter.com/widgets.js"></script>',
    );
    expect(card?.getAttribute('data-embed')).toBe('x');
    expect(card?.querySelector('figcaption')?.textContent).toBe('X · @DPR_RI');
    expect(card?.querySelector('p')?.textContent).toBe('Hari ini rapat paripurna.');
    expect(card?.querySelector('a')?.getAttribute('href')).toBe('https://twitter.com/DPR_RI/status/1234567890');
  });

  it('TikTok blockquote: cite URL and author', () => {
    const { card } = convert(
      '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@kompascom/video/7300000000000000000"><section><a href="https://www.tiktok.com/@kompascom">@kompascom</a><p>Banjir di Jakarta</p></section></blockquote>',
    );
    expect(card?.getAttribute('data-embed')).toBe('tiktok');
    expect(card?.querySelector('figcaption')?.textContent).toBe('TikTok · @kompascom');
  });

  it('YouTube iframe: thumbnail + watch link, generic titles dropped', () => {
    const { card, root } = convert(
      '<figure class="op-interactive"><iframe src="https://www.youtube.com/embed/8N1Yi_ZcjlQ?enablejsapi=1" title="YouTube video player"></iframe></figure>',
    );
    expect(card?.getAttribute('data-embed')).toBe('youtube');
    expect(card?.querySelector('a')?.getAttribute('href')).toBe('https://www.youtube.com/watch?v=8N1Yi_ZcjlQ');
    expect(card?.querySelector('img')?.getAttribute('src')).toBe('https://i.ytimg.com/vi/8N1Yi_ZcjlQ/hqdefault.jpg');
    expect(card?.querySelector('figcaption')?.textContent).toBe('YouTube');
    expect(root.querySelector('iframe, .op-interactive')).toBeNull(); // wrapper replaced, no empty shell
  });

  it('leaves ordinary quotes alone', () => {
    const { n, root } = convert('<blockquote><p>"Kami akan patuh," katanya.</p></blockquote>');
    expect(n).toBe(0);
    expect(root.querySelector('blockquote')).not.toBeNull();
  });
});

describe.skipIf(!savedPagesPresent())('real articles keep their quoted posts', () => {
  const rules = assembleRuleSet();
  const cases: Array<[string, string, RegExp]> = [
    ['kompas/3-kali-batal-manggung-dongker-bersyukur-bisa-bawakan-nirimaj', 'instagram', /instagram\.com\/reel\//],
    ['cnnindonesia/patung-sexy-robot-konser-the-weeknd-tuai-polemik-di-malaysia', 'facebook', /facebook\.com\/drzulkiflihasan\/posts\//],
  ];
  it.each(cases)('%s → %s card', async (fixture, platform, href) => {
    const dir = join(import.meta.dirname, 'fixtures', fixture);
    const fx = JSON.parse(readFileSync(join(dir, 'fixture.json'), 'utf8'));
    const pages = Object.fromEntries(Object.entries(fx.pages as Record<string, string>).map(([u, f]) => [u, join(dir, f)]));
    const doc = documentFromHtml(readFileSync(join(dir, 'page.html'), 'utf8'), fx.url);
    const result = await run(nodeContext(doc, fx.url, rules, pages));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const card = result.article.content.querySelector(`figure[data-embed="${platform}"]`);
    expect(card, `no ${platform} card`).not.toBeNull();
    expect(card?.querySelector('a[data-embed-link]')?.getAttribute('href')).toMatch(href);
  });

  it("drops Tribun's inserted promo video for another story (also named as the article's video in its data)", async () => {
    const dir = join(import.meta.dirname, 'fixtures', 'tribun/pernyataan-lengkap-gibran-usai-sampaikan-niat-mundur-sebagai');
    const fx = JSON.parse(readFileSync(join(dir, 'fixture.json'), 'utf8'));
    const pages = Object.fromEntries(Object.entries(fx.pages as Record<string, string>).map(([u, f]) => [u, join(dir, f)]));
    const result = await run(nodeContext(documentFromHtml(readFileSync(join(dir, 'page.html'), 'utf8'), fx.url), fx.url, rules, pages));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.article.content.querySelector('figure[data-embed="youtube"]')).toBeNull();
  });
});

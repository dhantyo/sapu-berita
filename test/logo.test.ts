// The masthead logo is found automatically (no per-site lists) on every saved real article.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findLogo } from '../src/extract/logo.ts';
import { documentFromHtml } from '../tools/lib/dom.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');

// What each outlet's own header shows (checked by hand on 2026-11-11). Regional Tribun sites carry their own brand.
const EXPECTED: Array<[string, RegExp]> = [
  ['detik/pkb-pertimbangkan-hak-menyatakan-pendapat-terkait-polemik-gi', /logo-detiknews/],
  ['cnnindonesia/kubu-silmy-karim-klaim-perkara-pemerasan-akan-sulit-dibuktik', /logo__cnn/],
  ['kompas/hidayat-nur-wahid-mundur-dari-wakil-ketua-mpr', /logo-kompascom/],
  ['tribun/pernyataan-lengkap-gibran-usai-sampaikan-niat-mundur-sebagai', /tribunnews\.svg/],
  ['tribun/biaya-sekolah-rafathar-anak-raffi-fantastis-disorot-pasca-ic', /sriwijayapost/],
  ['liputan6/bunyi-putusan-lengkap-ma-terkait-suket-penyetaraan-ijazah-sm', /logo_Liputan6/],
];

describe('masthead logo detection', () => {
  it.each(EXPECTED)('%s', (fixture, expected) => {
    const dir = join(FIXTURES, fixture);
    const { url } = JSON.parse(readFileSync(join(dir, 'fixture.json'), 'utf8'));
    const doc = documentFromHtml(readFileSync(join(dir, 'page.html'), 'utf8'), url);
    expect(findLogo(doc)?.src).toMatch(expected);
  });

  it('ignores smart-banner and app-promo images that also say "logo"', () => {
    const doc = documentFromHtml(
      '<div class="bapps__icon"><img src="/sb-mockup-logo.png"></div>' +
        '<header><a href="/"><img src="/brand.png" alt="Brand logo"></a></header>',
      'https://example.com/read/1',
    );
    expect(findLogo(doc)?.src).toBe('https://example.com/brand.png');
  });

  it('does not mistake header classes containing "ad" for ad containers (palembang.tribunnews.com desktop)', () => {
    const doc = documentFromHtml(
      '<div class="thead theadrev"><div class="theader"><div class="tlogo"><a class="show" href="/">' +
        '<img src="/img/logo/daerah/svg3/sriwijayapost.svg" alt="Sripoku.com"></a></div></div></div>' +
        '<div class="trib-wachannel-img"><img src="/img/logo/tribun/tribunnework.png"></div>',
      'https://palembang.tribunnews.com/seleb/1/x',
    );
    expect(findLogo(doc)?.src).toMatch(/sriwijayapost/);
    const masthead = documentFromHtml('<div class="site-masthead"><img src="/logo.svg"></div>', 'https://example.com/a');
    expect(findLogo(masthead)?.src).toBe('https://example.com/logo.svg');
  });

  it('still skips real ad and footer containers', () => {
    const doc = documentFromHtml(
      '<div class="ads-top"><img src="/sponsor-logo.png"></div><div class="footer__logo"><img src="/logo-white.svg"></div>',
      'https://example.com/a',
    );
    expect(findLogo(doc)).toBeUndefined();
  });

  it('returns nothing when no image looks like a masthead logo (JSON-LD fallback applies)', () => {
    const doc = documentFromHtml('<main><img src="/photo.jpg" alt="Foto"></main>', 'https://example.com/a');
    expect(findLogo(doc)).toBeUndefined();
  });
});

// Regressions found by testing on real phones (2026-11-13). Each case copies the real markup in miniature,
// so the fix stays fixed even for sites that block saved test pages (Bisnis, Tirto).
import { describe, expect, it } from 'vitest';
import { findLogo, logoAlternates } from '../src/extract/logo.ts';
import { clean } from '../src/clean/index.ts';
import { findRule } from '../src/rules/match.ts';
import { extractByRule } from '../src/extract/content.ts';
import { parseNewsDate, titleNodes } from '../src/render/overlay.ts';
import { assembleRuleSet } from '../tools/lib/rules.ts';
import { documentFromHtml } from '../tools/lib/dom.ts';
import type { ResolvedRule } from '../src/types.ts';

const rules = assembleRuleSet();

/** Give a parsed document a fake layout: the page is tall, and each listed element sits at the given box. */
function layout(doc: Document, boxes: Record<string, { top: number; width: number; height: number }>) {
  const rect = (b: { top: number; width: number; height: number }) =>
    ({ top: b.top, left: 0, width: b.width, height: b.height, bottom: b.top + b.height, right: b.width, x: 0, y: b.top }) as DOMRect;
  doc.body.getBoundingClientRect = () => rect({ top: 0, width: 390, height: 4000 });
  for (const [sel, box] of Object.entries(boxes)) {
    for (const el of doc.querySelectorAll(sel)) el.getBoundingClientRect = () => rect(box);
  }
}

describe('masthead logo on a live page', () => {
  const html =
    '<div class="ads-top"><img src="/promo.png"></div>' +
    '<header><nav class="menu"><a href="/"><img class="menu-logo" src="https://cdn.example/logo/tribun-videocom.svg"></a></nav>' +
    '<a href="/"><img class="site-logo" src="https://cdn.example/logo/tribunjogja.svg" alt="tribunjogja.com"></a></header>';

  it('takes the real logo pushed down by a screen-tall ad, not a hidden menu logo (Tribun Jogja)', () => {
    const doc = documentFromHtml(html, 'https://jogja.tribunnews.com/diy/1/x');
    layout(doc, { '.menu-logo': { top: 0, width: 0, height: 0 }, '.site-logo': { top: 570, width: 133, height: 35 } });
    expect(findLogo(doc)?.src).toBe('https://cdn.example/logo/tribunjogja.svg');
  });

  it('ignores logos far down the page (an article image or footer)', () => {
    const doc = documentFromHtml(html, 'https://jogja.tribunnews.com/diy/1/x');
    layout(doc, { '.menu-logo': { top: 0, width: 0, height: 0 }, '.site-logo': { top: 1500, width: 133, height: 35 } });
    expect(findLogo(doc)).toBeUndefined();
  });
});

describe('other copies of the logo (Merdeka: masthead server forbids reading it)', () => {
  it('lists the home-linked footer logo, never the masthead itself', () => {
    const doc = documentFromHtml(
      '<header><a href="/"><img src="https://cdn1.example/mobile_logos/logo.png" alt="merdeka"></a></header>' +
        '<footer><div class="footer-logo"><a href="/"><img src="https://preview.example/merdeka/images/logo.png" alt="Merdeka Logo"></a></div></footer>' +
        '<p><a href="/other"><img src="https://cdn.example/partner-logo.png" alt="partner logo"></a></p>',
      'https://www.merdeka.com/peristiwa/x.html',
    );
    expect(logoAlternates(doc, 'https://cdn1.example/mobile_logos/logo.png')).toEqual(['https://preview.example/merdeka/images/logo.png']);
  });
});

describe('gallery counters (detikHot, foto.bisnis)', () => {
  it('drops a "1 / 4" label but keeps the photo beside it', () => {
    const doc = documentFromHtml('<body></body>', 'https://hot.detik.com/celeb/d-1/x');
    const container = doc.createElement('div');
    container.innerHTML = '<div class="slide"><img src="https://img.example/a.jpg"><span>1 / 4</span></div><p>Teks artikel yang cukup panjang.</p>';
    const rule = findRule(rules, new URL('https://hot.detik.com/celeb/d-1/x')) as ResolvedRule;
    clean(container, rule, rules, [], new URL('https://hot.detik.com/celeb/d-1/x'));
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.textContent).not.toMatch(/1\s*\/\s*4/);
  });
});

describe('Bisnis rule', () => {
  it('pulls in the Executive Brief and removes the related-links box on articles', () => {
    const r = findRule(rules, new URL('https://kabar24.bisnis.com/read/20261112/15/2020879/mundur-dari-wapres'))!;
    expect(r.id).toBe('bisnis');
    expect(r.lead).toEqual(['.bisnisai']);
    expect(r.remove).toContain('.baca-juga-box');
  });

  it('opens foto.bisnis.com photo stories with their slider first', () => {
    const r = findRule(rules, new URL('https://foto.bisnis.com/view/20261113/2021207/mpr-jadwalkan'))!;
    expect(r.id).toBe('bisnis');
    expect(r.lead).toEqual(['.fotoslider']);
  });
});

describe('dates without a time zone are Jakarta time (Detik, Tirto)', () => {
  it('reads "2026/11/13 14:59:46" and "2026-11-11 08:00:01" as WIB', () => {
    expect(parseNewsDate('2026/11/13 14:59:46').toISOString()).toBe('2026-11-13T07:59:46.000Z');
    expect(parseNewsDate('2026-11-11 08:00:01').toISOString()).toBe('2026-11-11T01:00:01.000Z');
  });

  it('keeps dates that carry their own offset', () => {
    expect(parseNewsDate('2026-11-13T14:59:46+07:00').toISOString()).toBe('2026-11-13T07:59:46.000Z');
  });
});

describe('italic words in titles (Tirto)', () => {
  it('renders <i> as real italics and nothing else as markup', () => {
    const nodes = titleNodes(document, 'Label Wapres <i>Giveaway</i> <b>x</b>');
    const h1 = document.createElement('h1');
    h1.append(...nodes);
    expect(h1.querySelector('i')?.textContent).toBe('Giveaway');
    expect(h1.querySelector('b')).toBeNull();
    expect(h1.textContent).toBe('Label Wapres Giveaway <b>x</b>');
  });
});

describe("Detik's newer layout (wolipop.detik.com)", () => {
  it('takes the text from .detail__body.itp_bodycontent, not the whole article with its author credit', () => {
    const url = 'https://wolipop.detik.com/entertainment-news/d-8748928/gaya-nagita';
    const doc = documentFromHtml(
      '<main><article><div class="flex"><div class="text-xs">Vina Oktiani - Wolipop</div></div>' +
        '<div class="detail__body itp_bodycontent"><strong>Jakarta</strong> - <p>Penampilan Nagita Slavina memang kerap mencuri perhatian.</p></div></article></main>',
      url,
    );
    const body = extractByRule(doc, findRule(rules, new URL(url))!)!;
    expect(body.textContent).not.toContain('Vina Oktiani');
    expect(body.textContent).toContain('Penampilan Nagita Slavina');
  });
});

describe('bookmark settings shared across an outlet (news.detik.com ↔ hot.detik.com)', () => {
  it('keys the cookie on the outlet main domain from the rules', async () => {
    const { outletDomain } = await import('../src/settings.ts');
    const domains = rules.sites.flatMap((s) => s.domains);
    expect(outletDomain('hot.detik.com', domains)).toBe('detik.com');
    expect(outletDomain('rekomendit.detik.com', domains)).toBe('detik.com');
    expect(outletDomain('jogja.tribunnews.com', domains)).toBe('tribunnews.com');
    expect(outletDomain('example.org', domains)).toBeUndefined();
  });
});

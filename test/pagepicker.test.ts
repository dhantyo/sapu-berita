import { describe, expect, it } from 'vitest';
import { applyAdded, insertFromPage, stableSelector } from '../src/render/pagepicker.ts';

const PARA = (n: number) => `Paragraf ${n} yang cukup panjang untuk dikenali sebagai bagian artikel ini.`;
// The original page: the article, a gallery the clean view left out between paragraphs 2 and 3, a sidebar.
const PAGE =
  `<main><article class="post"><div class="post-body"><p>${PARA(1)}</p><p>${PARA(2)}</p>` +
  `<div class="photo-gallery js-slider-123"><img src="https://img.example/1.jpg"><img src="https://img.example/2.jpg"></div>` +
  `<p>${PARA(3)}</p></div></article><aside class="sidebar"><div class="box"><p>Terpopuler hari ini</p></div></aside></main>`;

const setup = () => {
  document.body.innerHTML = PAGE;
  const content = document.createElement('div');
  content.innerHTML = `<p>${PARA(1)}</p><p>${PARA(2)}</p><p>${PARA(3)}</p>`;
  return content;
};

describe('stableSelector', () => {
  it('uses stable class names, never ids, positions or state/hash classes', () => {
    setup();
    expect(stableSelector(document.querySelector('.photo-gallery')!)).toBe('div.photo-gallery');
    const p = document.querySelector('.box p')!;
    expect(stableSelector(p)).toBe('div.box > p');
  });

  it('gives up on a block with no stable handle', () => {
    document.body.innerHTML = '<div><div><div><div><span id="x9">teks</span></div></div></div></div>';
    expect(stableSelector(document.querySelector('span')!)).toBeUndefined();
  });
});

describe('adding a part from the page', () => {
  it('lands next to the article text it follows on the page', () => {
    const content = setup();
    insertFromPage(document.querySelector('.photo-gallery')!, content);
    expect([...content.children].map((c) => (c.tagName === 'P' ? c.textContent!.slice(0, 11) : c.tagName))).toEqual([
      'Paragraf 1 ', 'Paragraf 2 ', 'DIV', 'Paragraf 3 ',
    ]);
    expect(content.querySelectorAll('[data-user-added] img').length).toBe(2);
    expect(content.querySelector('[data-user-added]')!.getAttribute('class')).toBeNull(); // cleaned like the article
  });

  it('re-adds remembered parts once, and skips what the clean view already has', () => {
    const content = setup();
    expect(applyAdded(content, ['div.photo-gallery'], document)).toBe(1);
    expect(applyAdded(content, ['div.photo-gallery'], document)).toBe(1); // replaced, not doubled
    expect(content.querySelectorAll('[data-user-added]').length).toBe(1);
    expect(applyAdded(content, ['div.post-body > p'], document)).toBe(0); // paragraph 1 is already there
    expect(applyAdded(content, ['div.nope'], document)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeSummaries } from '../src/clean/summary.ts';

const HEADINGS = ['^(ringkasan berita|poin penting)\\s*:?'];

function normalize(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  normalizeSummaries(root, HEADINGS);
  const box = root.querySelector('blockquote');
  return {
    title: box?.querySelector('b')?.textContent,
    items: [...(box?.querySelectorAll('li') ?? [])].map((li) => li.textContent),
    root,
  };
}

const EXPECTED = ['Satu poin.', 'Dua poin.', 'Tiga poin.'];

describe('summary boxes', () => {
  it('fixes numbered divs glued to the heading (Tribun Palembang)', () => {
    const r = normalize(
      '<blockquote><strong>Ringkasan Berita:</strong>1. Satu poin.\n\n<div><span>2. Dua poin.</span></div><div><span>3. Tiga poin.</span></div></blockquote><p>Isi artikel.</p>',
    );
    expect(r.title).toBe('Ringkasan Berita');
    expect(r.items).toEqual(EXPECTED);
    expect(r.root.querySelector('p')?.textContent).toBe('Isi artikel.');
  });

  it('keeps a proper list as a list (Tribun Banjarmasin)', () => {
    const r = normalize('<div><p>Ringkasan Berita:</p><ul><li>Satu poin.</li><li>Dua poin.</li><li>Tiga poin.</li></ul></div>');
    expect(r.items).toEqual(EXPECTED);
  });

  it('splits <br>-separated and same-line numbered points', () => {
    expect(normalize('<div>Poin Penting<br>• Satu poin.<br>• Dua poin.<br>• Tiga poin.</div>').items).toEqual(EXPECTED);
    expect(normalize('<div>Ringkasan Berita: 1. Satu poin. 2. Dua poin. 3. Tiga poin.</div>').items).toEqual(EXPECTED);
  });

  it('builds exactly one box, and running again changes nothing (Tribun blockquote.summary-article)', () => {
    const r = normalize('<blockquote class="summary-article"><strong>Ringkasan Berita:</strong><ul><li>Satu poin.</li><li>Dua poin.</li><li>Tiga poin.</li></ul></blockquote>');
    expect(r.root.querySelectorAll('blockquote').length).toBe(1);
    const once = r.root.innerHTML;
    normalizeSummaries(r.root, HEADINGS);
    expect(r.root.innerHTML).toBe(once);
  });

  it('leaves the article alone when there is no summary box', () => {
    const r = normalize('<div><p>Ringkasan berita hari ini dimulai dengan…</p>' + '<p>' + 'x '.repeat(900) + '</p></div>');
    expect(r.root.querySelector('blockquote')).toBeNull();
  });
});

describe('heading followed by a list (Suara "BACA 10 DETIK")', () => {
  it('turns a standalone heading + sibling list into a summary box', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Intro.</p><h2>BACA 10 DETIK</h2><ul><li>Satu poin.</li><li>Dua poin.</li></ul><p>Isi.</p>';
    normalizeSummaries(root, ['^(ringkasan berita|baca 10 detik)\s*:?']);
    const box = root.querySelector('blockquote');
    expect(box?.querySelector('b')?.textContent).toBe('BACA 10 DETIK');
    expect([...(box?.querySelectorAll('li') ?? [])].map((li) => li.textContent)).toEqual(['Satu poin.', 'Dua poin.']);
    expect(root.querySelector('h2')).toBeNull();
    // The only list left is the one inside the summary box.
    expect([...root.querySelectorAll('ul')].every((ul) => ul.parentElement === box)).toBe(true);
  });
});

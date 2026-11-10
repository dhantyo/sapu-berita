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

  it('leaves the article alone when there is no summary box', () => {
    const r = normalize('<div><p>Ringkasan berita hari ini dimulai dengan…</p>' + '<p>' + 'x '.repeat(900) + '</p></div>');
    expect(r.root.querySelector('blockquote')).toBeNull();
  });
});

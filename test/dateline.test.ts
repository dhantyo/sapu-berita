import { describe, expect, it } from 'vitest';
import { joinDatelines } from '../src/clean/dateline.ts';

const run = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  joinDatelines(root);
  return root;
};

describe('datelines', () => {
  it('runs a loose Detik dateline into the first paragraph', () => {
    const root = run('<!-- toc --> <strong>Banjarmasin</strong> - <p>Kepolisian telah melimpahkan berkas.</p><p>Dua.</p>');
    const first = root.querySelector('p')!;
    expect(first.textContent).toBe('Banjarmasin - Kepolisian telah melimpahkan berkas.');
    expect(first.querySelector('strong')?.textContent).toBe('Banjarmasin');
    expect(root.querySelectorAll('p').length).toBe(2);
  });

  it('works inside a multi-page section (detikNews)', () => {
    const root = run('<section class="multi-card"> <strong>Jakarta</strong> - <p><a href="#">Presiden</a> buka suara.</p></section>');
    expect(root.querySelector('p')!.textContent).toBe('Jakarta - Presiden buka suara.');
  });

  it('leaves real loose text and long runs alone', () => {
    const long = run('<span>' + 'Kata '.repeat(30) + '-</span><p>Isi.</p>');
    expect(long.querySelector('p')!.textContent).toBe('Isi.');
    const noDash = run('<strong>Catatan redaksi</strong><p>Isi.</p>');
    expect(noDash.querySelector('p')!.textContent).toBe('Isi.');
  });
});

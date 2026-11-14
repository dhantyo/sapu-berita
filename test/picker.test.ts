import { describe as group, expect, it } from 'vitest';
import { applyHidden, describe, fingerprint, startPicking } from '../src/render/picker.ts';
import { strings } from '../src/render/i18n.ts';

const article = (html: string) => {
  const root = document.createElement('div');
  root.className = 'root';
  const content = document.createElement('div');
  content.className = 'content';
  content.innerHTML = html;
  root.append(content);
  document.body.replaceChildren(root);
  return { root, content };
};
const BODY =
  '<p>Paragraf pertama yang panjang tentang kejadian hari ini di Jakarta dan sekitarnya.</p>' +
  '<div class="promo"><p>Simak video berikut ini:</p><img src="https://img.example/promo.jpg"></div>' +
  '<p>Paragraf kedua yang juga cukup panjang supaya artikelnya punya isi yang jelas.</p>' +
  '<p>Paragraf ketiga menutup cerita dengan kutipan narasumber yang panjang sekali.</p>';

group('fingerprint', () => {
  it('uses the opening text, else the image', () => {
    const { content } = article('<p>Simak video berikut ini:</p><figure><img src="https://img.example/a.jpg?w=700"></figure>');
    expect(fingerprint(content.querySelector('p')!)).toBe('t:simak video berikut ini');
    expect(fingerprint(content.querySelector('figure')!)).toBe('i:img.example/a.jpg');
  });
});

group('applyHidden', () => {
  it('hides the same junk on another article of the outlet', () => {
    const { content } = article(BODY);
    const key = fingerprint(content.querySelector('.promo')!)!;
    const other = article(BODY.replace('kejadian hari ini', 'kejadian kemarin')).content;
    expect(applyHidden(other, new Set([key]))).toBe(1);
    expect(other.querySelector('.promo')!.hasAttribute('data-user-hidden')).toBe(true);
    expect(applyHidden(other, new Set())).toBe(0);
    expect(other.querySelector('[data-user-hidden]')).toBeNull();
  });
});

group('describe', () => {
  it('quotes the block, or says it is a photo', () => {
    const { content } = article('<p>Baca juga: berita lain</p><figure><img src="a.jpg"></figure>');
    expect(describe(content.querySelector('p')!)).toBe('Baca juga: berita lain');
    expect(describe(content.querySelector('figure')!)).toBe('(foto)');
  });
});

group('startPicking', () => {
  const t = strings('id');
  const tap = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  it('taps choose a block, Wider climbs, Hide hands it over and ends', () => {
    const { root, content } = article(BODY);
    let hidden: Element | undefined;
    let ended = false;
    startPicking(root, content, t, (el) => (hidden = el), () => (ended = true));
    const bar = root.querySelector('.pickbar')!;
    const byLabel = (label: string) => [...bar.querySelectorAll('button')].find((b) => b.textContent === label)!;
    const [wider, smaller, hide] = [byLabel(t.pickWider), byLabel(t.pickSmaller), byLabel(t.pickHide)];
    expect(hide.disabled).toBe(true);

    tap(content.querySelector('.promo p')!);
    expect(content.querySelector('[data-picked]')?.textContent).toBe('Simak video berikut ini:');
    tap(wider);
    expect(content.querySelector('[data-picked]')?.className).toBe('promo');
    tap(smaller);
    expect(content.querySelector('[data-picked]')?.tagName).toBe('P');
    tap(wider);
    tap(hide);
    expect((hidden as Element).className).toBe('promo');
    expect(ended).toBe(true);
    expect(root.querySelector('.pickbar')).toBeNull();
    expect(content.querySelector('[data-picked]')).toBeNull();
  });

  it('never picks a wrapper holding most of the article', () => {
    const { root, content } = article(`<div class="wrap">${BODY}</div>`);
    startPicking(root, content, t, () => {}, () => {});
    tap(content.querySelector('.promo p')!);
    const wider = [...root.querySelectorAll('.pickbar button')].find((b) => b.textContent === t.pickWider)!;
    tap(wider); // to .promo
    expect(content.querySelector('[data-picked]')?.className).toBe('promo');
    expect((wider as HTMLButtonElement).disabled).toBe(true); // .wrap is most of the article
  });

  it('links and photos do nothing while picking', () => {
    const { root, content } = article('<p><a href="https://example.com/x">tautan</a> dan teks yang cukup panjang untuk artikel ini.</p>' + BODY);
    startPicking(root, content, t, () => {}, () => {});
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    content.querySelector('a')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });
});

group('splitBreaks (paragraphs separated by blank lines, Tribrata News)', () => {
  it('turns <br><br> into separate paragraphs and keeps single line breaks', async () => {
    const { splitBreaks } = await import('../src/clean/breaks.ts');
    const root = document.createElement('div');
    root.innerHTML = '<p><i><a href="/">Tribratanews.polri.go.id</a></i> – Manado – Satu.<br><br>Dua.<br> <br>Tiga, baris satu<br>baris dua.</p><p>Biasa.</p>';
    expect(splitBreaks(root)).toBe(1);
    expect([...root.querySelectorAll('p')].map((p) => p.textContent?.trim())).toEqual([
      'Tribratanews.polri.go.id – Manado – Satu.', 'Dua.', 'Tiga, baris satubaris dua.', 'Biasa.',
    ]);
    expect(root.querySelectorAll('p')[2]!.querySelector('br')).not.toBeNull();
    expect(root.querySelector('p a')?.getAttribute('href')).toBe('/');
  });
});

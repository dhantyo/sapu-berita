import { describe, expect, it } from 'vitest';
import { joinCaptions } from '../src/clean/captions.ts';
import { galleryPhotos, largestSource } from '../src/render/gallery.ts';

const container = (html: string) => {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
};

describe('joinCaptions (Detik sets photo captions as <h3>)', () => {
  it('turns a photo and its credit line into a figure with a caption', () => {
    const root = container(
      '<div><div><p><img src="https://img.example/a.jpg"></p></div><h3> Gaya Shania saat memancing. (Foto: dok Instagram shaniagracia31) </h3></div><p>Teks.</p>',
    );
    expect(joinCaptions(root)).toBe(1);
    expect(root.querySelector('h3')).toBeNull();
    expect(root.querySelector('figure img')).not.toBeNull();
    expect(root.querySelector('figure figcaption')?.textContent).toBe('Gaya Shania saat memancing. (Foto: dok Instagram shaniagracia31)');
  });

  it('accepts "Foto: …" at the start', () => {
    const root = container('<p><img src="a.jpg"></p><p>Foto: ANTARA/Hafidz Mubarak</p>');
    expect(joinCaptions(root)).toBe(1);
  });

  it('leaves a real subheading or paragraph after a photo alone', () => {
    const root = container('<p><img src="a.jpg"></p><h3>Putusan MK dan MA</h3><p><img src="b.jpg"></p><p>Ia mengatakan foto itu diambil kemarin.</p>');
    expect(joinCaptions(root)).toBe(0);
    expect(root.querySelector('h3')?.textContent).toBe('Putusan MK dan MA');
  });

  it('skips photos already in a figure', () => {
    const root = container('<figure><img src="a.jpg"></figure><p>(Foto: x)</p>');
    expect(joinCaptions(root)).toBe(0);
  });
});

describe('photo viewer', () => {
  it('collects the hero and article photos, not social-post thumbnails', () => {
    const root = container(
      '<figure class="hero"><img src="h.jpg"></figure><div class="content"><p><img src="a.jpg"></p>' +
        '<figure data-embed="youtube"><a data-embed-link="youtube"><img src="t.jpg"></a></figure></div>',
    );
    expect(galleryPhotos(root).map((i) => i.getAttribute('src'))).toEqual(['h.jpg', 'a.jpg']);
  });

  it('opens the widest srcset candidate', () => {
    const img = container('<img src="https://x.example/s.jpg" srcset="https://x.example/s.jpg 400w, https://x.example/l.jpg 1200w, https://x.example/m.jpg 800w">')
      .firstElementChild as HTMLImageElement;
    expect(largestSource(img)).toBe('https://x.example/l.jpg');
  });
});

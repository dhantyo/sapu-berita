import { describe, expect, it } from 'vitest';
import { startsWithImage } from '../src/render/overlay.ts';

const div = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};

describe('hero image', () => {
  it('is skipped when the body opens with a photo', () => {
    expect(startsWithImage(div('<figure><img src="a.jpg"><figcaption>cap</figcaption></figure><p>text</p>'))).toBe(true);
  });

  it('is shown when the only image is deep in the article (Tribun Banjarmasin case)', () => {
    const long = '<p>' + 'kata '.repeat(100) + '</p>';
    expect(startsWithImage(div(long + '<img src="old-2017.jpg">'))).toBe(false);
  });

  it('is shown when the body has no images', () => {
    expect(startsWithImage(div('<p>just text</p>'))).toBe(false);
  });
});

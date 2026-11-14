// Photo captions written as ordinary blocks: an image, then a short line naming the photo's source
// ("… (Foto: dok Instagram x)", "Foto: Antara/…"). Detik sets these as <h3>, so they read as headings.
// Each pair becomes <figure><img><figcaption>, which the reader styles as a caption and the photo
// viewer shows under the photo.
//
//   <p><img></p><h3>Gaya Shania … (Foto: dok Instagram)</h3>
//   → <figure><p><img></p><figcaption>Gaya Shania … (Foto: dok Instagram)</figcaption></figure>

import { collapse } from '../dom.ts';

const CREDIT = /^\s*(foto|dok(\.|umentasi)?|ilustrasi)\s*:|\(\s*(foto|dok(\.|umentasi)?|ilustrasi)\b[^)]*\)\s*$/i;
const MAX_CAPTION = 400;

const blank = (el: Element) => !(el.textContent ?? '').trim();

/** Returns how many captions were joined to their photos. */
export function joinCaptions(root: HTMLElement): number {
  const doc = root.ownerDocument;
  let n = 0;
  for (const img of [...root.querySelectorAll('img')]) {
    if (img.closest('figure')) continue;
    // The photo's own block: climb while the wrapper holds nothing but the photo.
    let block: Element = img;
    while (block.parentElement && block.parentElement !== root && blank(block.parentElement) && block.parentElement.querySelectorAll('img').length === 1) {
      block = block.parentElement;
    }
    const next = block.nextElementSibling;
    if (!next || next.querySelector('img, iframe, video') || /^(UL|OL|TABLE|BLOCKQUOTE|FIGURE)$/.test(next.tagName)) continue;
    const text = collapse(next.textContent);
    if (!text || text.length > MAX_CAPTION || !CREDIT.test(text)) continue;

    const figure = doc.createElement('figure');
    const caption = doc.createElement('figcaption');
    caption.textContent = text;
    block.replaceWith(figure);
    figure.append(block, caption);
    next.remove();
    n++;
  }
  return n;
}

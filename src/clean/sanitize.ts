import createDOMPurify from 'dompurify';

/**
 * Strip everything that isn't reading content: scripts, handlers, inline styles, classes, ids.
 * DOMPurify does the security part; the allow-list keeps the output looking like an article.
 */
export function sanitize(container: HTMLElement): HTMLElement {
  // A DOMParser document has no window of its own; the page's window works for it too.
  const win = container.ownerDocument.defaultView ?? (typeof window !== 'undefined' ? window : null);
  if (!win) throw new Error('sanitize: no window available');
  const purify = createDOMPurify(win as unknown as Window & typeof globalThis);

  const fragment = purify.sanitize(container.innerHTML, {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: [
      'a', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'div', 'em', 'figcaption', 'figure',
      'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'picture', 'pre', 'q', 's',
      'small', 'source', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
    ],
    ALLOWED_ATTR: ['href', 'src', 'srcset', 'sizes', 'alt', 'title', 'loading', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
  });

  const doc = container.ownerDocument;
  const clean = doc.createElement('div');
  clean.append(doc.importNode(fragment, true));

  // Brave Shields injects user-level cosmetic CSS on some news domains that hides every <strong>,
  // and user-level styles pierce Shadow DOM. <b> renders the same and isn't targeted.
  for (const strong of [...clean.querySelectorAll('strong')]) {
    const b = doc.createElement('b');
    b.append(...strong.childNodes);
    strong.replaceWith(b);
  }
  return clean;
}

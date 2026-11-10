/**
 * Normalize editor-written summary boxes ("Ringkasan Berita:", "Poin Penting:") into one shape:
 *
 *   <blockquote><b>Ringkasan Berita</b><ul><li>…</li>…</ul></blockquote>
 *
 * Sites write these inconsistently (a real <ul>, numbered <div>s, <br>-separated text, items glued to
 * the heading) and rely on their own CSS to make them look like a list. Once that CSS is gone, the
 * heading runs into the first item. Rebuilding from text gives the same result for every variant.
 */
const CONTAINERS = 'blockquote, div, section, aside';
const BREAKS = 'br, div, p, li, ul, ol, blockquote, section';
const MAX_BOX_CHARS = 1500; // bigger than this is an article wrapper, not a summary box

export function normalizeSummaries(root: HTMLElement, headingPatterns: string[]): void {
  if (!headingPatterns.length) return;
  const headings = headingPatterns.map((p) => new RegExp(p, 'i'));
  const headingOf = (el: Element) => {
    const text = norm(el.textContent);
    if (text.length > MAX_BOX_CHARS) return null;
    for (const r of headings) {
      const m = text.match(r);
      if (m) return m[0];
    }
    return null;
  };

  for (const box of [...root.querySelectorAll(CONTAINERS)]) {
    if (!root.contains(box)) continue;
    const heading = headingOf(box);
    if (!heading) continue;
    // Work on the innermost matching container, not every wrapper around it.
    if ([...box.querySelectorAll(CONTAINERS)].some((d) => headingOf(d))) continue;

    const items = summaryItems(box, heading);
    if (!items.length) continue;
    box.replaceWith(buildBox(box.ownerDocument, heading, items));
  }
}

function summaryItems(box: Element, heading: string): string[] {
  const listItems = [...box.querySelectorAll('li')].map((li) => norm(li.textContent)).filter(Boolean);
  if (listItems.length) return listItems.map(stripMarker);

  // No real list: turn block boundaries and <br> into newlines, then split.
  const copy = box.cloneNode(true) as Element;
  for (const el of copy.querySelectorAll(BREAKS)) {
    el.before('\n');
    el.after('\n');
  }
  const text = (copy.textContent ?? '').replace(/[ \t ]+/g, ' ');
  const body = text.trim().slice(heading.length);

  return body
    .split('\n')
    // Several numbered points on one line ("1. foo 2. bar") become separate items.
    .flatMap((line) => line.split(/\s(?=\d{1,2}[.)]\s)/))
    .map((s) => stripMarker(s.trim()))
    .filter((s) => s.length > 1);
}

function buildBox(doc: Document, heading: string, items: string[]): HTMLElement {
  const quote = doc.createElement('blockquote');
  const title = doc.createElement('b');
  title.textContent = heading.replace(/\s*:\s*$/, '').trim();
  const list = doc.createElement('ul');
  for (const item of items) {
    const li = doc.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  quote.append(title, list);
  return quote;
}

function stripMarker(s: string): string {
  return s.replace(/^(\d{1,2}[.)]|[•\-–—*·])\s*/, '').trim();
}

function norm(s: string | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

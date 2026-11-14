/**
 * "Pilih di halaman asli": the reader marks a part of the original page that the clean view left out
 * (a photo gallery, a summary box, a paragraph). It is copied into the clean view at the matching place,
 * remembered for the outlet by a selector made of stable class names, and can be reported in one tap.
 *
 * Why not a "unique selector" library (@medv/finder and the like): those aim for a selector unique to
 * this page, which usually means nth-child positions and per-article ids, and those break on the next
 * article. Here the selector only has to find the same kind of block on other articles of the outlet.
 */
import { collapse, textKey } from '../dom.ts';
import { sanitize } from '../clean/sanitize.ts';
import type { Strings } from './i18n.ts';

/** Class names that describe what a block is, not its state or a build hash. */
const STABLE_CLASS = /^[a-z][\w-]{2,}$/i;
const UNSTABLE_CLASS = /\d{3,}|[0-9a-f]{6,}|^(active|show|shown|open|selected|current|lazy|loaded|visible|hidden|js-|is-|has-)/i;
/** Parts too big to be "a part" of the article: the whole page or a column of it. */
const MAX_CHARS = 6000;

function part(el: Element): string {
  const classes = [...el.classList].filter((c) => STABLE_CLASS.test(c) && !UNSTABLE_CLASS.test(c)).slice(0, 2);
  return el.tagName.toLowerCase() + classes.map((c) => `.${c}`).join('');
}

/**
 * A selector that finds this block first on its page, built from tags and stable classes only (no ids,
 * no positions), climbing at most three ancestors. Undefined when the block has no such handle.
 */
export function stableSelector(el: Element): string | undefined {
  const doc = el.ownerDocument;
  let sel = part(el);
  let cur: Element | null = el;
  for (let i = 0; i < 4 && cur; i++) {
    if (sel.includes('.')) {
      try {
        if (doc.querySelector(sel) === el) return sel;
      } catch {
        return undefined;
      }
    }
    cur = cur.parentElement;
    if (!cur || cur === doc.body || cur === doc.documentElement) break;
    sel = `${part(cur)} > ${sel}`;
  }
  return undefined;
}

/** Text blocks in the clean view, keyed by how they start, to anchor added parts next to their neighbours. */
function readerAnchors(content: Element): Map<string, Element> {
  const anchors = new Map<string, Element>();
  for (const el of content.querySelectorAll('p, h2, h3, h4, li, figcaption, blockquote')) {
    const key = textKey(el.textContent).slice(0, 60);
    if (key.length >= 20 && !anchors.has(key)) anchors.set(key, el);
  }
  return anchors;
}

/** The clean-view block an added part goes after: the last article text that precedes it on the page. */
function anchorFor(source: Element, content: Element): Element | null {
  const anchors = readerAnchors(content);
  let found: Element | null = null;
  for (const el of source.ownerDocument.body.querySelectorAll('p, h2, h3, h4, li, figcaption, blockquote')) {
    if (!(el.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING)) break; // at or past the part
    const hit = anchors.get(textKey(el.textContent).slice(0, 60));
    if (hit) found = hit;
  }
  // Insert at the top level of the article.
  while (found && found.parentElement && found.parentElement !== content) found = found.parentElement;
  return found;
}

/** Copy a part of the original page into the clean view, cleaned like the article, at its place. */
export function insertFromPage(source: Element, content: HTMLElement): Element | undefined {
  const doc = content.ownerDocument;
  const holder = doc.createElement('div');
  holder.append(source.cloneNode(true));
  const cleaned = sanitize(holder);
  if (!collapse(cleaned.textContent) && !cleaned.querySelector('img')) return undefined;
  // One element stays as it is; anything else (the sanitizer may unwrap a container) goes in one block.
  const only = cleaned.childElementCount === 1 && !collapse([...cleaned.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''));
  let clean: Element;
  if (only) clean = cleaned.firstElementChild!;
  else {
    clean = doc.createElement('div');
    clean.append(...cleaned.childNodes);
  }
  clean.setAttribute('data-user-added', '');
  const after = anchorFor(source, content);
  if (after) after.after(clean);
  else content.prepend(clean);
  return clean;
}

/** Re-add remembered parts (selectors) from the live page; earlier copies are replaced. */
export function applyAdded(content: HTMLElement, selectors: Iterable<string>, page: Document): number {
  for (const el of content.querySelectorAll('[data-user-added]')) el.remove();
  let n = 0;
  for (const sel of selectors) {
    let source: Element | null = null;
    try {
      source = page.querySelector(sel);
    } catch {
      continue;
    }
    // Skip what the clean view already has (the site rule may have been fixed since).
    const key = source && textKey(source.textContent).slice(0, 60);
    if (!source || (key && key.length >= 20 && readerAnchors(content).has(key))) continue;
    if (insertFromPage(source, content)) n++;
  }
  return n;
}

/**
 * Pick mode over the original page. Taps choose an element instead of following links; an outline
 * follows it; the bar widens, narrows, adds or cancels. `layer` is a container in the reader's shadow
 * root (it carries the reader's theme). Calls onAdd with the chosen element.
 */
export function startPagePicking(layer: HTMLElement, host: Element, t: Strings, onAdd: (el: Element) => void, onEnd: () => void): () => void {
  const doc = host.ownerDocument;
  const win = doc.defaultView!;
  let picked: Element | null = null;
  const narrower: Element[] = [];

  const outline = doc.createElement('div');
  outline.className = 'pick-outline';
  const button = (label: string, cls = 'btn') => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    return b;
  };
  const bar = doc.createElement('div');
  bar.className = 'pickbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', t.addTitle);
  const hint = doc.createElement('p');
  const wider = button(t.pickWider);
  const smaller = button(t.pickSmaller);
  const add = button(t.addAction, 'btn primary');
  const cancel = button(t.pickCancel, 'btn quiet');
  const head = doc.createElement('div');
  head.className = 'head';
  head.append(hint, cancel);
  const row = doc.createElement('div');
  row.className = 'row';
  row.append(wider, smaller, add);
  bar.append(head, row);
  layer.replaceChildren(outline, bar);
  layer.hidden = false;

  let frame = 0;
  const place = () => {
    frame = 0;
    if (!picked) {
      outline.hidden = true;
      return;
    }
    const r = picked.getBoundingClientRect();
    outline.hidden = false;
    Object.assign(outline.style, { top: `${r.top - 4}px`, left: `${r.left - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
  };
  const follow = () => {
    if (!frame) frame = win.requestAnimationFrame(place);
  };
  const usable = (el: Element | null): el is Element =>
    !!el && el !== doc.body && el !== doc.documentElement && !host.contains(el) && collapse(el.textContent).length <= MAX_CHARS;
  const select = (el: Element | null) => {
    picked = el;
    wider.disabled = !picked || !usable(picked.parentElement);
    smaller.disabled = !narrower.length;
    add.disabled = !picked;
    hint.textContent = picked ? t.addChosen : t.addHint;
    place();
  };
  select(null);

  const ours = (e: Event) => e.composedPath().includes(host);
  // Taps on the page choose; the page's own links and scripts never see them.
  const onTap = (e: MouseEvent) => {
    if (ours(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const el = e.target as Element | null;
    if (!usable(el)) return;
    narrower.length = 0;
    select(el);
  };
  const block = (e: Event) => {
    if (!ours(e)) e.stopImmediatePropagation();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') stop();
  };
  wider.addEventListener('click', () => {
    if (!picked || !usable(picked.parentElement)) return;
    narrower.push(picked);
    select(picked.parentElement);
  });
  smaller.addEventListener('click', () => select(narrower.pop() ?? picked));
  add.addEventListener('click', () => {
    const el = picked;
    stop();
    if (el) onAdd(el);
  });
  cancel.addEventListener('click', () => stop());

  doc.addEventListener('click', onTap, true);
  for (const type of ['mousedown', 'pointerdown', 'touchstart', 'auxclick']) doc.addEventListener(type, block, true);
  doc.addEventListener('keydown', onKey, true);
  win.addEventListener('scroll', follow, { capture: true, passive: true });
  win.addEventListener('resize', follow);

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    doc.removeEventListener('click', onTap, true);
    for (const type of ['mousedown', 'pointerdown', 'touchstart', 'auxclick']) doc.removeEventListener(type, block, true);
    doc.removeEventListener('keydown', onKey, true);
    win.removeEventListener('scroll', follow, { capture: true });
    win.removeEventListener('resize', follow);
    if (frame) win.cancelAnimationFrame(frame);
    layer.replaceChildren();
    layer.hidden = true;
    onEnd();
  }
  return stop;
}

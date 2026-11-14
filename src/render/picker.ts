/**
 * "Tandai": the reader taps a block in the clean view that shouldn't be there (a promo, a leftover
 * "Baca juga"), widens or narrows the pick like uBlock's element picker, and hides it.
 *
 * A hidden block is remembered for the outlet by a fingerprint of what it says (or of its image when it
 * has no text), so recurring junk ("Simak video berikut ini:") stays hidden on every article there. The
 * same pick pre-fills a report, so the site rule can be fixed for everyone.
 */
import { collapse, textKey } from '../dom.ts';
import type { Strings } from './i18n.ts';

/** Blocks a reader can pick or that a remembered pick can match. */
const BLOCK = 'p, li, ul, ol, figure, blockquote, h2, h3, h4, h5, h6, table, div, section, aside, img';
/** A pick may never swallow most of the article (the one wrapper some outlets put everything in). */
const MAX_SHARE = 0.6;

/** What identifies a block across articles of one outlet: its opening text, else its image. */
export function fingerprint(el: Element): string | undefined {
  const text = textKey(el.textContent).slice(0, 80);
  if (text.length >= 8) return `t:${text}`;
  const src = el.tagName === 'IMG' ? el.getAttribute('src') : el.querySelector('img')?.getAttribute('src');
  if (!src) return undefined;
  try {
    const u = new URL(src, el.baseURI);
    return `i:${u.hostname}${u.pathname}`.slice(0, 120);
  } catch {
    return undefined;
  }
}

/** Mark the blocks matching remembered fingerprints as hidden (and unmark the rest). Returns how many. */
export function applyHidden(content: Element, keys: ReadonlySet<string>): number {
  let n = 0;
  for (const el of content.querySelectorAll(BLOCK)) {
    const hide = keys.size > 0 && !el.parentElement?.closest('[data-user-hidden]') && keys.has(fingerprint(el) ?? '');
    el.toggleAttribute('data-user-hidden', hide);
    if (hide) n++;
  }
  return n;
}

/** The text a report shows for a pick: what the block says, or that it is a photo. */
export function describe(el: Element): string {
  const text = collapse(el.textContent);
  return text ? text.slice(0, 200) : el.querySelector('img') || el.tagName === 'IMG' ? '(foto)' : '';
}

/**
 * Pick mode over the article. Taps choose a block instead of following links or opening photos;
 * the bar at the bottom widens, narrows, hides or cancels. Calls onHide with the chosen block.
 */
export function startPicking(root: HTMLElement, content: HTMLElement, t: Strings, onHide: (el: Element) => void, onEnd: () => void): () => void {
  const doc = root.ownerDocument;
  const total = collapse(content.textContent).length || 1;
  let picked: Element | null = null;
  const narrower: Element[] = []; // the picks "Lebih luas" came from, for "Lebih kecil"

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
  bar.setAttribute('aria-label', t.pickTitle);
  const hint = doc.createElement('p');
  hint.textContent = t.pickHint;
  const wider = button(t.pickWider);
  const smaller = button(t.pickSmaller);
  const hide = button(t.pickHide, 'btn primary');
  const cancel = button(t.pickCancel, 'btn quiet');
  const head = doc.createElement('div');
  head.className = 'head';
  head.append(hint, cancel);
  const row = doc.createElement('div');
  row.className = 'row';
  row.append(wider, smaller, hide);
  bar.append(head, row);
  root.append(bar);
  root.dataset.picking = 'on';

  const widerOf = (el: Element) => {
    const up = el.parentElement;
    return up && up !== content && content.contains(up) && collapse(up.textContent).length <= total * MAX_SHARE ? up : null;
  };
  const select = (el: Element | null) => {
    picked?.removeAttribute('data-picked');
    picked = el;
    picked?.setAttribute('data-picked', '');
    wider.disabled = !picked || !widerOf(picked);
    smaller.disabled = !narrower.length;
    hide.disabled = !picked;
    hint.textContent = picked ? t.pickChosen : t.pickHint;
  };
  select(null);

  const onTap = (e: MouseEvent) => {
    if (bar.contains(e.target as Node)) return;
    // While picking, a tap anywhere in the reader chooses; nothing else (links, photos, panel) reacts.
    e.preventDefault();
    e.stopPropagation();
    const el = (e.target as Element | null)?.closest?.(BLOCK);
    if (!el || el === content || !content.contains(el)) return;
    if (collapse(el.textContent).length > total * MAX_SHARE) return;
    narrower.length = 0;
    select(el);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      stop();
    }
  };
  wider.addEventListener('click', () => {
    const up = picked && widerOf(picked);
    if (!up) return;
    narrower.push(picked!);
    select(up);
  });
  smaller.addEventListener('click', () => select(narrower.pop() ?? picked));
  hide.addEventListener('click', () => {
    const el = picked;
    stop();
    if (el) onHide(el);
  });
  cancel.addEventListener('click', () => stop());

  root.addEventListener('click', onTap, true);
  root.addEventListener('keydown', onKey, true);

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    picked?.removeAttribute('data-picked');
    root.removeEventListener('click', onTap, true);
    root.removeEventListener('keydown', onKey, true);
    bar.remove();
    delete root.dataset.picking;
    onEnd();
  }
  return stop;
}

import type { Article } from '../types.ts';
import { OVERLAY_CSS } from './styles.ts';

const HOST_ID = 'bacabersih-overlay';

export interface OverlayHandle {
  /** Swap in a newer version of the article (e.g. after extra pages were merged). Keeps the scroll position. */
  update(article: Article, loadingMore?: boolean): void;
  /** Stop showing the "loading more pages" note without changing the article. */
  doneLoading(): void;
  show(): void;
  hide(): void;
  destroy(): void;
}

/** Draw the article over the page inside a Shadow DOM. The original page stays underneath, untouched. */
export function renderOverlay(doc: Document, article: Article, loadingMore = false): OverlayHandle {
  doc.getElementById(HOST_ID)?.remove();

  const host = doc.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = OVERLAY_CSS;

  const root = el(doc, 'div', { class: 'root', role: 'dialog', 'aria-label': article.meta.title });
  const bar = el(doc, 'div', { class: 'bar' });
  const site = el(doc, 'span', { class: 'site' }, article.meta.siteName ?? doc.location?.hostname ?? '');
  const toggle = el(doc, 'button', { type: 'button' }, 'Tampilkan asli');
  bar.append(site, toggle);

  // Shown while the overlay is hidden, so the reader can come back without reloading.
  const reopen = el(doc, 'button', { type: 'button', class: 'reopen' }, 'Baca Bersih');

  const art = el(doc, 'article');
  art.append(el(doc, 'h1', {}, article.meta.title));
  const metaLine = [article.meta.byline, formatDate(article.meta.published)].filter(Boolean).join(' · ');
  if (metaLine) art.append(el(doc, 'div', { class: 'meta' }, metaLine));
  const bodySlot = el(doc, 'div');
  art.append(bodySlot);

  const fillBody = (a: Article, loading: boolean) => {
    bodySlot.replaceChildren();
    if (a.meta.image && !startsWithImage(a.content)) {
      bodySlot.append(el(doc, 'img', { class: 'hero', src: a.meta.image, alt: '' }));
    }
    a.content.classList.add('content');
    bodySlot.append(a.content);
    if (loading) bodySlot.append(el(doc, 'div', { class: 'pages loading' }, 'Memuat halaman berikutnya…'));
    else if (a.pages > 1) bodySlot.append(el(doc, 'div', { class: 'pages' }, `Digabung dari ${a.pages} halaman`));
  };
  fillBody(article, loadingMore);

  root.append(bar, art);
  shadow.append(style, root, reopen);
  doc.documentElement.append(host);

  const prevOverflow = doc.documentElement.style.overflow;
  const show = () => {
    root.style.display = '';
    reopen.style.display = 'none';
    doc.documentElement.style.overflow = 'hidden';
  };
  const hide = () => {
    root.style.display = 'none';
    reopen.style.display = '';
    doc.documentElement.style.overflow = prevOverflow;
  };
  toggle.addEventListener('click', hide);
  reopen.addEventListener('click', show);
  show();

  return {
    update: (a, loading = false) => {
      const top = root.scrollTop;
      fillBody(a, loading);
      root.scrollTop = top;
    },
    doneLoading: () => bodySlot.querySelector('.loading')?.remove(),
    show,
    hide,
    destroy: () => {
      hide();
      host.remove();
    },
  };
}

/**
 * True if the body opens with its own photo (so the og:image hero would be a duplicate).
 * An image buried later in the article doesn't count: the hero is still the main photo.
 */
export function startsWithImage(content: Element, textBudget = 200): boolean {
  const walker = content.ownerDocument.createTreeWalker(content, 0x1 | 0x4); // elements + text
  let text = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === 3) text += (node.textContent ?? '').trim().length;
    else if ((node as Element).tagName === 'IMG') return true;
    if (text > textBudget) return false;
  }
  return false;
}

function el(doc: Document, tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const node = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB';
}

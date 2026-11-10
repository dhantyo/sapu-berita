import type { Article } from '../types.ts';
import { OVERLAY_CSS } from './styles.ts';

const HOST_ID = 'bacabersih-overlay';

export interface OverlayHandle {
  show(): void;
  hide(): void;
  destroy(): void;
}

/** Draw the article over the page inside a Shadow DOM. The original page stays underneath, untouched. */
export function renderOverlay(doc: Document, article: Article): OverlayHandle {
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

  const art = el(doc, 'article');
  art.append(el(doc, 'h1', {}, article.meta.title));
  const metaLine = [article.meta.byline, formatDate(article.meta.published)].filter(Boolean).join(' · ');
  if (metaLine) art.append(el(doc, 'div', { class: 'meta' }, metaLine));
  if (article.meta.image && !article.content.querySelector('img')) {
    art.append(el(doc, 'img', { class: 'hero', src: article.meta.image, alt: '' }));
  }
  article.content.classList.add('content');
  art.append(article.content);
  if (article.pages > 1) art.append(el(doc, 'div', { class: 'pages' }, `Digabung dari ${article.pages} halaman`));

  root.append(bar, art);
  shadow.append(style, root);
  doc.documentElement.append(host);

  const prevOverflow = doc.documentElement.style.overflow;
  const show = () => {
    host.style.display = '';
    doc.documentElement.style.overflow = 'hidden';
  };
  const hide = () => {
    host.style.display = 'none';
    doc.documentElement.style.overflow = prevOverflow;
  };
  toggle.addEventListener('click', hide);
  show();

  return {
    show,
    hide,
    destroy: () => {
      hide();
      host.remove();
    },
  };
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

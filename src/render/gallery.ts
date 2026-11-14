/**
 * Photo viewer: tap a photo in the article to see every photo full screen, swipe between them,
 * pinch or double-tap to zoom, swipe down or tap ✕ to close. Built on PhotoSwipe (MIT), which
 * handles the touch gestures; this file only collects the photos and fits it into the shadow root.
 */
import PhotoSwipe from 'photoswipe';
import type { SlideData } from 'photoswipe';
import type { Strings } from './i18n.ts';

/** PhotoSwipe's stylesheet, inlined at build time (tools/build.ts); absent in unit tests. */
declare const __PSWP_CSS__: string | undefined;
export const GALLERY_CSS = typeof __PSWP_CSS__ === 'string' ? __PSWP_CSS__ : '';

/** Photos that open the viewer: the hero and article photos, not social-post thumbnails or icons. */
const PHOTO = '.hero img, .content img';
const NOT_A_PHOTO = 'figure[data-embed], .logo';
const MIN_SIDE = 80;

export function galleryPhotos(root: ParentNode): HTMLImageElement[] {
  return [...root.querySelectorAll<HTMLImageElement>(PHOTO)].filter((img) => {
    if (img.closest(NOT_A_PHOTO)) return false;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    return !(w && h) || (w >= MIN_SIDE && h >= MIN_SIDE);
  });
}

/** The sharpest version the page offers: the widest srcset candidate, else the shown source. */
export function largestSource(img: HTMLImageElement): string {
  let best = '';
  let bestW = 0;
  for (const part of (img.getAttribute('srcset') ?? '').split(/,\s+/)) {
    const [url, size] = part.trim().split(/\s+/);
    const w = size?.endsWith('w') ? parseInt(size, 10) : size?.endsWith('x') ? parseFloat(size) * 1000 : 0;
    if (url && w > bestW) [best, bestW] = [url, w];
  }
  return best ? new URL(best, img.baseURI).href : img.currentSrc || img.src;
}

function captionOf(img: HTMLImageElement): string {
  const cap = img.closest('figure')?.querySelector('figcaption');
  return (cap?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Open the viewer on taps on article photos. `root` is the reader's scroll container (it outlives re-renders). */
export function attachGallery(root: HTMLElement, strings: () => Strings): void {
  let open: PhotoSwipe | undefined;
  root.addEventListener('click', (e) => {
    const img = (e.target as Element | null)?.closest?.('img');
    if (!img || open) return;
    const photos = galleryPhotos(root);
    const index = photos.indexOf(img as HTMLImageElement);
    if (index < 0) return;
    e.preventDefault(); // a photo wrapped in a link opens here, not on the original site
    e.stopPropagation();
    open = show(root, photos, index, strings());
    open.on('destroy', () => (open = undefined));
  });
}

/** Icons in the reader's own line style (24-unit grid, 1.6 stroke), sized by CSS. */
const svg = (paths: string, extra = '') =>
  `<svg class="pswp__icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}${extra}</svg>`;
const ICONS = {
  close: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  // "+" becomes "−" when zoomed in: PhotoSwipe hides .pswp__zoom-icn-bar-v then.
  zoom: svg('<circle cx="10.5" cy="10.5" r="6.25"/><path d="M15.2 15.2 20 20M7.9 10.5h5.2"/>', '<path class="pswp__zoom-icn-bar-v" d="M10.5 7.9v5.2"/>'),
  prev: svg('<path d="M14.5 6 8.5 12l6 6"/>'),
  next: svg('<path d="M9.5 6l6 6-6 6"/>'),
};

function show(root: HTMLElement, photos: HTMLImageElement[], index: number, t: Strings): PhotoSwipe {
  const reduceMotion = !!root.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const slides: SlideData[] = photos.map((img) => ({
    src: largestSource(img),
    msrc: img.currentSrc || img.src,
    // Unknown until the image loads; corrected below so zoom works at the photo's real size.
    width: img.naturalWidth || 1600,
    height: img.naturalHeight || 1067,
    alt: img.alt,
    element: img,
    caption: captionOf(img),
  }));

  const pswp = new PhotoSwipe({
    dataSource: slides,
    index,
    appendToEl: root,
    bgOpacity: 1,
    showHideAnimationType: reduceMotion ? 'none' : 'zoom',
    // The reader is already a modal dialog in a shadow root, where PhotoSwipe's own focus trap fights the retargeted focus events.
    trapFocus: false,
    returnFocus: true,
    closeTitle: t.galleryClose,
    zoomTitle: t.galleryZoom,
    arrowPrevTitle: t.galleryPrev,
    arrowNextTitle: t.galleryNext,
    errorMsg: t.galleryError,
    indexIndicatorSep: ' / ',
    closeSVG: ICONS.close,
    zoomSVG: ICONS.zoom,
    arrowPrevSVG: ICONS.prev,
    arrowNextSVG: ICONS.next,
    paddingFn: (viewport) => (viewport.x < 700 ? { top: 0, bottom: 0, left: 0, right: 0 } : { top: 40, bottom: 40, left: 60, right: 60 }),
  });

  // Captions under the photo, from the article's figcaption.
  pswp.on('uiRegister', () => {
    pswp.ui?.registerElement({
      name: 'caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el) => {
        pswp.on('change', () => {
          const text = (pswp.currSlide?.data as SlideData & { caption?: string })?.caption ?? '';
          el.textContent = text;
          el.hidden = !text;
        });
      },
    });
  });

  // Photos still loading (lazy) get their real size as soon as they arrive.
  slides.forEach((slide, i) => {
    if (photos[i]!.naturalWidth) return;
    const probe = new Image();
    probe.onload = () => {
      slide.width = probe.naturalWidth;
      slide.height = probe.naturalHeight;
      if (pswp.isOpen) pswp.refreshSlideContent(i);
    };
    probe.src = slide.src!;
  });

  // The photo being viewed is hidden in the article, so it isn't seen twice while the viewer opens and
  // closes (the enlarged copy flies back onto it).
  let hidden: HTMLImageElement | undefined;
  const hide = (img: HTMLImageElement | undefined) => {
    if (hidden) hidden.style.visibility = '';
    hidden = img;
    if (img) img.style.visibility = 'hidden';
  };
  pswp.on('change', () => hide(photos[pswp.currIndex]));
  pswp.on('destroy', () => hide(undefined));

  // Back (Android's back button, the browser's) closes the viewer, not the page: opening adds a history entry.
  const win = root.ownerDocument.defaultView;
  let entry = false;
  try {
    win?.history.pushState({ ...(win.history.state ?? {}), sapuPhoto: true }, '');
    entry = true;
  } catch {
    // Sandboxed or blocked history: Back simply leaves the page, as before.
  }
  const onBack = () => {
    entry = false;
    pswp.close();
  };
  win?.addEventListener('popstate', onBack);
  pswp.on('close', () => {
    win?.removeEventListener('popstate', onBack);
    if (entry) {
      entry = false;
      win?.history.back(); // closed with ✕, a swipe or Esc: drop the entry we added
    }
  });

  pswp.init();
  hide(photos[index]);
  (pswp.element as HTMLElement | undefined)?.focus({ preventScroll: true });
  return pswp;
}

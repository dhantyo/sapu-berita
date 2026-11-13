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

  pswp.init();
  (pswp.element as HTMLElement | undefined)?.focus({ preventScroll: true });
  return pswp;
}

// Find the outlet's own masthead logo on the live page, and the colour it sits on there.
// Fully automatic: no per-site lists, so a redesigned header or a new logo is picked up as is.

export interface FoundLogo {
  src: string;
  /** The background the site draws the logo on, as an rgb() string, when that background is dark. */
  darkGround?: string;
}

/**
 * Containers that hold promos, not the masthead (smart banners, app CTAs, footers, ads).
 * Whole words only, with -, _ and digits as word breaks (BEM classes): "thead" or "masthead" must not read as "ad".
 */
const NOT_MASTHEAD =
  /(?:^|[^a-z])(?:banner|smartbanner|bapps|smart|app-?promo|cta|footer|foot|ads?|advert|sponsor|partner|widget|wachannel|channel|popup|modal)(?:[^a-z]|$)/i;
// Image names that are never the masthead logo: promos, backgrounds, banners, network strips.
const NOT_LOGO_SRC = /mockup|smartbanner|sprite|favicon|appx?\d|app-?icon|placeholder|blank|pixel|1x1|(^|[/_-])bg[-_]|background|breaking|banner|network/i;
const HEADER = /header|masthead|navbar|topbar|brand|site-?logo/i;

/**
 * Pick the header logo: an <img> or an inline <svg> that names itself a logo (src, alt, class, id,
 * title, or a near ancestor) or links home, inside the header area, outside promo blocks.
 * `override` selectors (rare, from a site rule) win when they match.
 */
export function findLogo(doc: Document, override: string[] = []): FoundLogo | undefined {
  for (const sel of override) {
    const img = safeQuery(doc, sel);
    const found = img && toLogo(doc, img);
    if (found) return found;
  }

  const live = hasLayout(doc);
  let best: { img: Element; score: number } | undefined;
  for (const img of doc.querySelectorAll('img, svg')) {
    const score = scoreCandidate(doc, img, live);
    if (score > 0 && (!best || score > best.score)) best = { img, score };
  }
  return best ? toLogo(doc, best.img) : undefined;
}

/** A live page (real layout) versus a parsed document (tests, tools), where every box is zero. */
function hasLayout(doc: Document): boolean {
  return (doc.body?.getBoundingClientRect?.().height ?? 0) > 0;
}

function scoreCandidate(doc: Document, img: Element, live: boolean): number {
  const isSvg = img.tagName.toLowerCase() === 'svg';
  if (isSvg && img.parentElement?.closest('svg')) return 0; // only outermost <svg>
  const src = isSvg ? '' : img.getAttribute('src') || img.getAttribute('data-src') || '';
  if (!isSvg && (!src || src.startsWith('data:') || NOT_LOGO_SRC.test(src))) return 0;

  let score = 0;
  const label = isSvg ? `${img.querySelector('title')?.textContent ?? ''} ${img.getAttribute('aria-label') ?? ''}` : '';
  const own = `${src} ${img.getAttribute('alt') ?? ''} ${img.getAttribute('class') ?? ''} ${img.id} ${label}`;
  if (/logo/i.test(own)) score += 3;

  // Walk a few ancestors: logo/header hints add, promo containers disqualify.
  let el: Element | null = img.parentElement;
  for (let depth = 0; el && el !== doc.body && depth < 6; depth++, el = el.parentElement) {
    const tag = el.tagName.toLowerCase();
    const hint = `${el.getAttribute('class') ?? ''} ${el.id}`;
    if (NOT_MASTHEAD.test(hint)) return 0;
    if (depth < 3 && /logo/i.test(hint)) score += 2;
    if (tag === 'header' || HEADER.test(hint)) score += 2;
    if (tag === 'a' && isHomeLink(doc, el.getAttribute('href'))) score += 2;
  }
  if (score < 3) return 0;

  // On a live page the masthead logo is visible and in the upper part of the page. Not strictly at the
  // top: on phones Detik and Tribun put a screen-tall ad above the header (logo near 570px). Hidden
  // logos (desktop or menu variants, zero size) never count. Higher wins a tie.
  if (live) {
    const rect = img.getBoundingClientRect();
    const top = rect.top + (doc.defaultView?.scrollY ?? 0);
    if (rect.width < 40 || rect.height < 10 || top > 1100) return 0;
    score += top < 300 ? 2 : 1;
  }
  return score;
}

/**
 * For a logo URL from elsewhere (JSON-LD), find the same image on the page and read its ground there.
 * Unknown when the page never shows it.
 */
export function groundForSrc(doc: Document, src: string): string | undefined {
  for (const img of doc.querySelectorAll('img')) {
    const s = img.getAttribute('src') || img.getAttribute('data-src');
    if (!s) continue;
    try {
      if (new URL(s, doc.baseURI).href === src) return darkGroundOf(img);
    } catch {
      // ignore malformed src
    }
  }
  return undefined;
}

function isHomeLink(doc: Document, href: string | null): boolean {
  if (!href) return false;
  try {
    const u = new URL(href, doc.baseURI);
    return u.pathname === '/' || u.pathname === '';
  } catch {
    return false;
  }
}

function toLogo(doc: Document, img: Element): FoundLogo | undefined {
  if (img.tagName.toLowerCase() === 'svg') {
    const src = svgDataUrl(img);
    return src ? { src, darkGround: darkGroundOf(img) } : undefined;
  }
  const src = img.getAttribute('src') || img.getAttribute('data-src');
  if (!src || src.startsWith('data:')) return undefined;
  let abs: string;
  try {
    abs = new URL(src, doc.baseURI).href;
  } catch {
    return undefined;
  }
  return { src: abs, darkGround: darkGroundOf(img) };
}

/**
 * An inline <svg> logo as a standalone image. Colours often come from the site's CSS (fill: white via a
 * class), which a copy wouldn't carry, so each shape gets its computed fill and stroke written in.
 * Symbols it references with <use href="#id"> are copied along. Live pages only (needs computed styles).
 */
function svgDataUrl(svg: Element): string | undefined {
  const view = svg.ownerDocument.defaultView;
  if (!view?.getComputedStyle) return undefined;
  const copy = svg.cloneNode(true) as Element;
  const originals = [svg, ...svg.querySelectorAll('*')];
  const copies = [copy, ...copy.querySelectorAll('*')];
  originals.forEach((el, i) => {
    const target = copies[i];
    if (!target || /^(title|desc|defs|symbol)$/i.test(el.tagName)) return;
    const cs = view.getComputedStyle(el);
    for (const prop of ['fill', 'stroke', 'fill-opacity', 'stroke-width', 'opacity'] as const) {
      const value = cs.getPropertyValue(prop);
      if (value) target.setAttribute(prop, value);
    }
    target.removeAttribute('class');
    target.removeAttribute('style');
  });
  for (const use of copy.querySelectorAll('use')) {
    const ref = (use.getAttribute('href') || use.getAttribute('xlink:href') || '').replace(/^#/, '');
    const symbol = ref && svg.ownerDocument.getElementById(ref);
    if (symbol && !copy.querySelector(`[id="${ref}"]`)) {
      let defs = copy.querySelector('defs');
      if (!defs) copy.prepend((defs = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'defs')));
      defs.append(symbol.cloneNode(true));
    }
  }
  const box = svg.getBoundingClientRect();
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!copy.getAttribute('width')) copy.setAttribute('width', String(Math.round(box.width)));
  if (!copy.getAttribute('height')) copy.setAttribute('height', String(Math.round(box.height)));
  const markup = new (view as Window & typeof globalThis).XMLSerializer().serializeToString(copy);
  return markup.length < 200_000 ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}` : undefined;
}

/**
 * The colour behind the logo on the site itself (first non-transparent ancestor background).
 * Returned only when dark: then the logo is drawn for a dark header (white lettering) and must keep it.
 * Needs a live page with computed styles; elsewhere it returns undefined (treated as a light ground).
 */
function darkGroundOf(img: Element): string | undefined {
  const view = img.ownerDocument.defaultView;
  if (!view?.getComputedStyle) return undefined;
  for (let el: Element | null = img; el; el = el.parentElement) {
    const bg = view.getComputedStyle(el).backgroundColor;
    const rgba = parseRgb(bg);
    if (!rgba || rgba[3] < 0.5) continue;
    const [r, g, b] = rgba;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.45 ? `rgb(${r} ${g} ${b})` : undefined;
  }
  return undefined;
}

function parseRgb(value: string): [number, number, number, number] | undefined {
  const m = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?/);
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
}

function safeQuery(doc: Document, sel: string): Element | null {
  try {
    return doc.querySelector(sel);
  } catch {
    return null;
  }
}

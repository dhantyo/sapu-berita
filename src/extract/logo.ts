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
 * Pick the header logo: an <img> that names itself a logo (src, alt, class, id, or a near ancestor)
 * or links home, inside the header area and near the top of the page, outside promo blocks.
 * `override` selectors (rare, from a site rule) win when they match.
 */
export function findLogo(doc: Document, override: string[] = []): FoundLogo | undefined {
  for (const sel of override) {
    const img = safeQuery(doc, sel);
    const found = img && toLogo(doc, img);
    if (found) return found;
  }

  let best: { img: Element; score: number } | undefined;
  for (const img of doc.querySelectorAll('img')) {
    const score = scoreCandidate(doc, img);
    if (score > 0 && (!best || score > best.score)) best = { img, score };
  }
  return best ? toLogo(doc, best.img) : undefined;
}

function scoreCandidate(doc: Document, img: Element): number {
  const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
  if (!src || src.startsWith('data:') || NOT_LOGO_SRC.test(src)) return 0;

  let score = 0;
  const own = `${src} ${img.getAttribute('alt') ?? ''} ${img.getAttribute('class') ?? ''} ${img.id}`;
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

  // On a live page, the masthead logo is visible near the top. Parsed documents have no layout; skip this there.
  const rect = img.getBoundingClientRect?.();
  if (rect && rect.width > 0) {
    if (rect.top > 260 || rect.width < 40) return 0;
    score += 1;
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

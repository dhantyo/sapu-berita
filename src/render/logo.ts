// Look at the outlet logo's actual pixels so the masthead can (1) recolour it per theme when its own
// colour wouldn't show, and (2) size it optically, trimmed of the empty padding logos ship with.
// Needs the logo's server to allow CORS reads (all five main outlets do, checked 2026-11-11);
// otherwise analyzeLogo resolves undefined and the masthead falls back to plates.

export interface LogoAnalysis {
  naturalWidth: number;
  naturalHeight: number;
  /** Bounding box of the drawn pixels (alpha > 10%), in natural pixels. */
  box: { x: number; y: number; w: number; h: number };
  /** Opaque rectangle (app-icon badge or JPG): never recolour. */
  badge: boolean;
  /** Relative luminance (WCAG, linear) of the median drawn pixel: the logo's "ink". */
  inkLuminance: number;
  /** Luminance of the darker / lighter parts (35th / 65th percentile): a two-colour logo is judged by the part that would vanish. */
  darkPart: number;
  lightPart: number;
}

const cache = new Map<string, LogoAnalysis | undefined>();

/**
 * URL for loading the *displayed* logo in CORS mode, so one download serves both display and analysis.
 * The extra parameter keeps a non-CORS copy already in the page's cache from tainting the read.
 */
export function corsLogoUrl(src: string): string {
  return src + (src.includes('?') ? '&' : '?') + 'sapu=1';
}

/** Analyse an already-loaded logo <img> (loaded with crossOrigin="anonymous"). Cached per src. */
export function analyzeLoadedLogo(img: HTMLImageElement): LogoAnalysis | undefined {
  if (cache.has(img.src)) return cache.get(img.src);
  const result = measure(img);
  cache.set(img.src, result);
  return result;
}

function measure(img: HTMLImageElement): LogoAnalysis | undefined {
  // SVGs without intrinsic size report 0; draw them at a sane default.
  const nw = img.naturalWidth || 300;
  const nh = img.naturalHeight || 100;
  const scale = Math.min(1, 240 / nw); // analysis resolution: plenty for a logo
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return undefined; // tainted: the server didn't allow the read
  }

  let minX = w, minY = h, maxX = -1, maxY = -1, opaque = 0;
  const lum: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3]!;
      if (a > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (a > 128) {
        opaque++;
        lum.push(relativeLuminance(data[i]!, data[i + 1]!, data[i + 2]!));
      }
    }
  }
  if (maxX < 0 || !lum.length) return undefined;
  lum.sort((p, q) => p - q);
  return {
    naturalWidth: nw,
    naturalHeight: nh,
    box: { x: minX / scale, y: minY / scale, w: (maxX - minX + 1) / scale, h: (maxY - minY + 1) / scale },
    badge: opaque / (w * h) > 0.97,
    inkLuminance: lum[Math.floor(lum.length / 2)]!,
    darkPart: lum[Math.floor(lum.length * 0.35)]!,
    lightPart: lum[Math.floor(lum.length * 0.65)]!,
  };
}

/** WCAG relative luminance from 8-bit sRGB. */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Grounds of the overlay themes (relative luminance): light 255, sepia 247/241/228, dark 18. */
const LIGHT_GROUND = 1;
const SEPIA_GROUND = relativeLuminance(247, 241, 228);
const DARK_GROUND = relativeLuminance(18, 18, 18);
const MIN_CONTRAST = 3; // WCAG minimum for graphics

/** Would the logo, in its own colours, be too faint on our light/sepia ground? On our dark ground? */
export function recolourNeeds(a: LogoAnalysis): { onLight: boolean; onDark: boolean } {
  if (a.badge) return { onLight: false, onDark: false };
  // On a light ground the lighter part is the one at risk; on a dark ground, the darker part
  // (Tribunnews: its blue would vanish on black even though the red "news" survives).
  return {
    onLight: Math.min(contrast(a.lightPart, LIGHT_GROUND), contrast(a.lightPart, SEPIA_GROUND)) < MIN_CONTRAST,
    onDark: contrast(a.darkPart, DARK_GROUND) < MIN_CONTRAST,
  };
}

/**
 * Optical size: give every logo about the same visual weight (equal area of drawn pixels) instead of
 * equal height, so a long wordmark isn't huge and a compact one isn't tiny.
 */
export const LOGO_SIZE = { area: 3200, min: 20, max: 34, maxWidth: 210 };

export function opticalHeight(aspect: number, opts = LOGO_SIZE): number {
  const h = Math.min(opts.max, Math.max(opts.min, Math.sqrt(opts.area / Math.max(0.2, aspect))));
  // The width cap wins over the minimum height: a very long logo gets shorter rather than overflowing the bar.
  return Math.min(h, opts.maxWidth / aspect);
}

/**
 * Sapu Berita's own fonts, the same on every device:
 *   - Geist (the identity: headlines, text, labels) is built into the script, so it's there instantly,
 *     offline, and no news site's font policy can block it.
 *   - Merriweather (Aa → Serif) and Fira Sans (Aa → Jelas) download only when the reader picks them,
 *     from the release channel, and the browser caches them.
 *
 * Fonts are registered on the page's document.fonts (Shadow DOM trees use the document's fonts) under
 * "Sapu …" names, so they never clash with the news site's own fonts. Loading is from bytes (FontFace
 * with an ArrayBuffer), which no Content-Security-Policy font-src rule applies to.
 * All faces are SIL Open Font License 1.1 (fonts/OFL-*.txt).
 */
import type { Font } from '../settings.ts';

export const FAMILY = { sans: 'Sapu Geist', serif: 'Sapu Merriweather', legible: 'Sapu Fira Sans' } as const;

type Face = [file: string, descriptors: FontFaceDescriptors];
const OPTIONAL: Record<Exclude<Font, 'sans'>, Face[]> = {
  serif: [
    ['merriweather-400.woff2', { weight: '400' }],
    ['merriweather-700.woff2', { weight: '700' }],
    ['merriweather-400-italic.woff2', { weight: '400', style: 'italic' }],
  ],
  legible: [
    ['fira-sans-400.woff2', { weight: '400' }],
    ['fira-sans-700.woff2', { weight: '700' }],
    ['fira-sans-400-italic.woff2', { weight: '400', style: 'italic' }],
  ],
};

const started = new WeakMap<Document, Set<string>>();

/**
 * Make sure the faces for this setting are (being) loaded. Safe to call on every render.
 * @param geist  the built-in Geist file, base64 (variable weight 100 to 900)
 * @param fontBase  where the optional files live (release channel "…/fonts/"); none = system fallback
 */
export function ensureFonts(doc: Document, font: Font, geist: string, fontBase?: string): void {
  const fonts = doc.fonts as FontFaceSet | undefined;
  if (!fonts || typeof FontFace !== 'function') return;
  const done = started.get(doc) ?? new Set<string>();
  started.set(doc, done);

  if (!done.has('sans') && geist) {
    done.add('sans');
    add(fonts, FAMILY.sans, base64Bytes(geist), { weight: '100 900' });
  }
  if (font === 'sans' || done.has(font) || !fontBase) return;
  done.add(font);
  for (const [file, descriptors] of OPTIONAL[font]) {
    fetch(new URL(file, fontBase).href)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((bytes) => add(fonts, FAMILY[font], bytes, descriptors))
      .catch(() => done.delete(font)); // offline or blocked: system fallback now, retry on the next render
  }
}

function add(fonts: FontFaceSet, family: string, bytes: ArrayBuffer, descriptors: FontFaceDescriptors) {
  try {
    const face = new FontFace(family, bytes, { display: 'swap', ...descriptors });
    fonts.add(face);
    void face.load().catch(() => fonts.delete(face));
  } catch {
    // A browser without FontFace-from-bytes keeps the fallback stack.
  }
}

function base64Bytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

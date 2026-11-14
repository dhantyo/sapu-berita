import type { ArticleMeta } from '../types.ts';

type Json = Record<string, unknown>;

/** Title/author/date/image from JSON-LD NewsArticle (SEO-critical, so stable), falling back to OpenGraph/meta. */
export function extractMetadata(doc: Document): ArticleMeta {
  const nodes = jsonLdNodes(doc);
  const ld = nodes.find((n) => /Article|Posting/i.test(([] as unknown[]).concat(n['@type']).join(',')));
  // Some outlets (Merdeka) name their logo only on a separate Organization node, not on the article.
  const org = nodes.find((n) => /Organization/i.test(([] as unknown[]).concat(n['@type']).join(',')) && n.logo);
  const meta = (sel: string) => doc.querySelector<HTMLMetaElement>(sel)?.content?.trim() || undefined;

  const publisher = (ld?.publisher ?? undefined) as Json | undefined;
  const absolute = (u?: string) => {
    if (!u) return undefined;
    try {
      return new URL(u, doc.baseURI).href;
    } catch {
      return undefined;
    }
  };

  return decodeText({
    title:
      str(ld?.headline) ??
      meta('meta[property="og:title"]') ??
      doc.title.trim(),
    byline: authorNames(ld?.author) ?? meta('meta[name="author"]'),
    editor: authorNames(ld?.editor) ?? pageEditor(doc),
    published:
      str(ld?.datePublished) ??
      meta('meta[property="article:published_time"]') ??
      meta('meta[name="publishdate"]') ??
      // Tirto publishes no publish date at all; its "modified" time is the publish time on first release.
      str(ld?.dateModified) ??
      meta('meta[property="article:modified_time"]'),
    image: imageUrl(ld?.image) ?? meta('meta[property="og:image"]'),
    // publisher.name is the outlet's real name; og:site_name is sometimes a section ("nasional" on CNN Indonesia).
    siteName: str(publisher?.name) ?? meta('meta[property="og:site_name"]'),
    // Every supported outlet ships its official logo in NewsArticle.publisher.logo (verified 2026-11-11).
    logo: absolute(imageUrl(publisher?.logo)) ?? absolute(imageUrl(org?.logo)),
    section: str(([] as unknown[]).concat(ld?.articleSection ?? [])[0]),
    description: str(ld?.description) ?? meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
    video:
      mainVideo(nodes, ld, str(ld?.headline) ?? meta('meta[property="og:title"]')) ??
      videoFromThumbnail(imageUrl(ld?.image) ?? meta('meta[property="og:image"]')),
  });
}

/**
 * The story's own video, when the page is a video story: a VideoObject (top-level or the article's `video`)
 * with a YouTube embed address, whose name is the article's headline (video.tribunnews.com keeps its player
 * outside the article text). Tribun also lists its house promo for another story as the article's video;
 * that one carries the other story's name, so it doesn't count.
 */
/**
 * A page whose main image is a YouTube video's thumbnail is that video's page (video.tribunnews.com/view/
 * names no video in its data; its player is built by script from the same id).
 */
function videoFromThumbnail(image: string | undefined): string | undefined {
  const id = image && /^https?:\/\/(?:img\.youtube\.com|i\d?\.ytimg\.com)\/vi(?:_webp)?\/([\w-]{6,})\//.exec(image)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : undefined;
}

function mainVideo(nodes: Json[], ld: Json | undefined, headline: string | undefined): string | undefined {
  const key = (t: unknown) => (typeof t === 'string' ? t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 40) : '');
  const want = key(headline);
  if (want.length < 15) return undefined;
  const candidates = [
    ...nodes.filter((n) => /VideoObject/i.test(([] as unknown[]).concat(n['@type']).join(','))),
    ...([] as unknown[]).concat(ld?.video ?? []),
  ] as Json[];
  for (const v of candidates) {
    const url = str(v?.embedUrl);
    if (url && key(v?.name) === want && /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[\w-]{6,}/.test(url)) return url;
  }
  return undefined;
}

const TEXT_FIELDS = ['title', 'byline', 'editor', 'siteName', 'section', 'description'] as const;

/**
 * Sites HTML-escape JSON-LD strings, or double-escape meta tags ("&#039;Sindiran&#039;" on Detik), and
 * some put markup in them (Tirto: "Label Wapres <i>Giveaway</i>"). Decode, then keep text only; a title's
 * italics survive separately in titleMarkup.
 */
function decodeText(m: ArticleMeta): ArticleMeta {
  // An editor who is also the author (Bisnis, iNews often) is shown once, as the author.
  if (m.editor && m.byline && m.editor.trim().toLowerCase() === m.byline.trim().toLowerCase()) m.editor = undefined;
  for (const k of TEXT_FIELDS) if (m[k]) m[k] = decodeEntities(m[k]!);
  if (m.title && /<(i|em)>/i.test(m.title)) {
    m.titleMarkup = m.title.replace(/<(?!\/?(?:i|em)>)[^>]*>/gi, '').replace(/<(\/?)em>/gi, '<$1i>');
  }
  for (const k of TEXT_FIELDS) if (m[k]) m[k] = stripTags(m[k]!);
  return m;
}

function stripTags(s: string): string {
  return s.replace(/<\/?[a-z][^>]*>/gi, '').replace(/\s+/g, ' ').trim();
}

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', bull: '•', middot: '·',
};

export function decodeEntities(s: string): string {
  // Twice, for double-escaped input ("&amp;#039;").
  for (let i = 0; i < 2 && s.includes('&'); i++) {
    s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] !== '#') return NAMED[code.toLowerCase()] ?? whole;
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    });
  }
  return s;
}

function jsonLdNodes(doc: Document): Json[] {
  const nodes: Json[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Json;
      if (o['@graph']) walk(o['@graph']);
      nodes.push(o);
    }
  };
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      walk(JSON.parse(s.textContent ?? ''));
    } catch {
      // Malformed JSON-LD is common; skip it.
    }
  }
  return nodes;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * The editor as the page prints it, for outlets whose page data leaves it out:
 *   Liputan6, Merdeka:  <a class="editorial-articles__item"> … Muhamad Agil Aliansyah <span>Editor</span>
 *   Bisnis:             <div>Editor : <a>Media Digital</a></div>
 *   iNews:              <div class="editor">Editor : Aditya Pratama</div>
 * Only an exact "Editor"/"Penyunting" label counts, and the first one on the page (the article's own;
 * later ones belong to stories loaded below it).
 */
const EDITOR_LABEL = /^(editor|penyunting)\s*:?\s*$/i;
const EDITOR_INLINE = /^(?:editor|penyunting)\s*:\s*(.+)$/i;
export function pageEditor(doc: Document): string | undefined {
  const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
  const isName = (s: string) => s.length >= 3 && s.length <= 60 && /\p{L}/u.test(s) && !/[:|/]/.test(s) && s.split(' ').length <= 6;
  for (const el of doc.body?.querySelectorAll('*') ?? []) {
    if (el.closest('script, style, noscript, template')) continue;
    const own = clean([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
    if (!own) continue;
    const inline = EDITOR_INLINE.exec(own)?.[1]?.trim();
    if (inline && isName(inline)) return inline;
    if (!EDITOR_LABEL.test(own)) continue;
    // "Editor : <a>name</a>" (name inside), "Editor :" then the name in the next element, or the name
    // elsewhere in the label's own row.
    const inside = clean(el.textContent).replace(/^(editor|penyunting)\s*:?\s*/i, '');
    if (inside && isName(inside)) return inside;
    const next = clean(el.nextElementSibling?.textContent);
    if (next && isName(next)) return next;
    const row = el.parentElement;
    const rowText = clean(row?.textContent);
    const rest = rowText.slice(0, rowText.toLowerCase().lastIndexOf(own.toLowerCase())).trim();
    if (rest && isName(rest)) return rest;
  }
  return undefined;
}

function authorNames(v: unknown): string | undefined {
  const names = ([] as unknown[])
    .concat(v ?? [])
    .map((a) => (typeof a === 'string' ? a : str((a as Json)?.name)))
    // A name needs letters: detikHot writes "-" and foto.bisnis.com "" when the author is elsewhere.
    .filter((n): n is string => !!n && /\p{L}/u.test(n));
  return names.length ? names.join(', ') : undefined;
}

function imageUrl(v: unknown): string | undefined {
  const first = ([] as unknown[]).concat(v ?? [])[0];
  return typeof first === 'string' ? first : str((first as Json)?.url);
}

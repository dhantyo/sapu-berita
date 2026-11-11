import type { ArticleMeta } from '../types.ts';

type Json = Record<string, unknown>;

/** Title/author/date/image from JSON-LD NewsArticle (SEO-critical, so stable), falling back to OpenGraph/meta. */
export function extractMetadata(doc: Document): ArticleMeta {
  const ld = findArticleJsonLd(doc);
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
    published:
      str(ld?.datePublished) ??
      meta('meta[property="article:published_time"]') ??
      meta('meta[name="publishdate"]'),
    image: imageUrl(ld?.image) ?? meta('meta[property="og:image"]'),
    // publisher.name is the outlet's real name; og:site_name is sometimes a section ("nasional" on CNN Indonesia).
    siteName: str(publisher?.name) ?? meta('meta[property="og:site_name"]'),
    // Every supported outlet ships its official logo in NewsArticle.publisher.logo (verified 2026-11-11).
    logo: absolute(imageUrl(publisher?.logo)),
    section: str(([] as unknown[]).concat(ld?.articleSection ?? [])[0]),
    description: str(ld?.description) ?? meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
  });
}

const TEXT_FIELDS = ['title', 'byline', 'siteName', 'section', 'description'] as const;

/** Sites HTML-escape JSON-LD strings, or double-escape meta tags ("&#039;Sindiran&#039;" on Detik). */
function decodeText(m: ArticleMeta): ArticleMeta {
  for (const k of TEXT_FIELDS) if (m[k]) m[k] = decodeEntities(m[k]!);
  return m;
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

function findArticleJsonLd(doc: Document): Json | undefined {
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
  return nodes.find((n) => /Article|Posting/i.test(([] as unknown[]).concat(n['@type']).join(',')));
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function authorNames(v: unknown): string | undefined {
  const names = ([] as unknown[])
    .concat(v ?? [])
    .map((a) => (typeof a === 'string' ? a : str((a as Json)?.name)))
    .filter((n): n is string => !!n);
  return names.length ? names.join(', ') : undefined;
}

function imageUrl(v: unknown): string | undefined {
  const first = ([] as unknown[]).concat(v ?? [])[0];
  return typeof first === 'string' ? first : str((first as Json)?.url);
}

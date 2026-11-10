import type { ArticleMeta } from '../types.ts';

type Json = Record<string, unknown>;

/** Title/author/date/image from JSON-LD NewsArticle (SEO-critical, so stable), falling back to OpenGraph/meta. */
export function extractMetadata(doc: Document): ArticleMeta {
  const ld = findArticleJsonLd(doc);
  const meta = (sel: string) => doc.querySelector<HTMLMetaElement>(sel)?.content?.trim() || undefined;

  return {
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
    siteName: meta('meta[property="og:site_name"]'),
    description: str(ld?.description) ?? meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
  };
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

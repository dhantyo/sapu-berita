import type { Context, ResolvedRule } from '../types.ts';

export interface Paginated {
  container: HTMLElement;
  pages: number;
}

/** Same extractor that produced page 1 (site rule or Readability), reused on the other pages. */
export type Extractor = (doc: Document) => HTMLElement | null;

/**
 * Merge multi-page articles into one container.
 * Never throws: on any failure the page-1 container is returned unchanged.
 */
export async function paginate(
  container: HTMLElement,
  rule: ResolvedRule,
  extract: Extractor,
  ctx: Context,
): Promise<Paginated> {
  const p = rule.pagination;
  try {
    switch (p.method) {
      case 'none':
        return { container, pages: 1 };

      case 'inline': {
        const pageIds = new Set([...container.querySelectorAll('[data-page]')].map((e) => e.getAttribute('data-page')));
        const fromDoc = new Set([...ctx.doc.querySelectorAll('[data-page]')].map((e) => e.getAttribute('data-page')));
        return { container, pages: Math.max(pageIds.size, fromDoc.size, 1) };
      }

      case 'param': {
        if (p.onlyIf && !safeQuery(ctx.doc, p.onlyIf)) return { container, pages: 1 };
        const full = new URL(ctx.url.href);
        if (p.stripPathPage) full.pathname = full.pathname.replace(/\/\d+\/?$/, '');
        const [key, value] = p.fullpage.split('=') as [string, string];
        full.searchParams.set(key, value);
        if (full.href === ctx.url.href) return { container, pages: 1 };

        const doc = await ctx.fetchDocument(full);
        const merged = extract(doc);
        // Only accept if the "full" version is actually longer (some sites silently ignore the param).
        if (merged && textLength(merged) > textLength(container)) {
          return { container: adopt(ctx.doc, merged), pages: countPageLinks(ctx.doc, ctx.url) || 2 };
        }
        return { container, pages: 1 };
      }

      case 'fetch': {
        const urls = pageUrls(ctx, p.pageLinks, p.maxPages ?? 15);
        if (!urls.length) return { container, pages: 1 };
        const docs = await Promise.all(urls.map((u) => ctx.fetchDocument(u)));
        for (const doc of docs) {
          const part = extract(doc);
          if (part) container.append(...[...adopt(ctx.doc, part).childNodes]);
        }
        return { container, pages: urls.length + 1 };
      }
    }
  } catch (err) {
    ctx.log('pagination failed, keeping page 1', String(err));
    return { container, pages: 1 };
  }
}

/** Cheap check (no network): will paginate() need to fetch other pages? */
export function needsNetwork(rule: ResolvedRule, ctx: Context): boolean {
  const p = rule.pagination;
  switch (p.method) {
    case 'none':
    case 'inline':
      return false;
    case 'param':
      return !p.onlyIf || !!safeQuery(ctx.doc, p.onlyIf);
    case 'fetch':
      return pageUrls(ctx, p.pageLinks, p.maxPages ?? 15).length > 0;
  }
}

/** Numbered page links (text "2", "3", …) on the same origin, in order, deduplicated. */
function pageUrls(ctx: Context, selector: string, max: number): URL[] {
  const byNumber = new Map<number, URL>();
  for (const a of safeQueryAll<HTMLAnchorElement>(ctx.doc, selector)) {
    const n = Number(a.textContent?.trim());
    if (!Number.isInteger(n) || n < 2 || n > max) continue;
    const url = new URL(a.getAttribute('href') ?? '', ctx.url);
    if (url.origin !== ctx.url.origin) continue;
    if (!byNumber.has(n)) byNumber.set(n, url);
  }
  return [...byNumber.entries()].sort(([a], [b]) => a - b).map(([, u]) => u);
}

/** Highest numbered link that points at this same article (ignores section listings' "page=2" links). */
function countPageLinks(doc: Document, url: URL): number {
  const nums = [...doc.querySelectorAll('a')]
    .filter((a) => {
      try {
        return new URL(a.getAttribute('href') ?? '', url).pathname.replace(/\/\d+\/?$/, '') === url.pathname;
      } catch {
        return false;
      }
    })
    .map((a) => Number(a.textContent?.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n < 50);
  return nums.length ? Math.max(...nums) : 0;
}

function adopt(doc: Document, el: HTMLElement): HTMLElement {
  return el.ownerDocument === doc ? el : (doc.importNode(el, true) as HTMLElement);
}

function textLength(el: Element): number {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim().length;
}

function safeQuery(doc: ParentNode, selector: string): Element | null {
  try {
    return doc.querySelector(selector);
  } catch {
    return null;
  }
}

function safeQueryAll<T extends Element>(doc: ParentNode, selector: string): T[] {
  try {
    return [...doc.querySelectorAll<T>(selector)];
  } catch {
    return [];
  }
}

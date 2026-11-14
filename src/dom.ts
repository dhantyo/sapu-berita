/** Parse HTML into an inert Document: no scripts run, no subresources load. */
export function parseHtml(html: string, baseUrl: string): Document {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc.querySelector('base')) {
    const base = doc.createElement('base');
    base.href = baseUrl;
    doc.head.prepend(base);
  }
  return doc;
}

/** Browser implementation of Context.fetchDocument: same-origin only, cookies included like a normal page load. */
export async function fetchSameOriginDocument(url: URL, origin: string): Promise<Document> {
  if (url.origin !== origin) throw new Error(`cross-origin fetch refused: ${url.href}`);
  const res = await fetch(url.href, { credentials: 'include', redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.href}`);
  return parseHtml(await res.text(), res.url || url.href);
}

/** querySelector that treats an invalid selector (from a remote rule) as "no match" instead of throwing. */
export function safeQuery<T extends Element = Element>(root: ParentNode, selector: string): T | null {
  try {
    return root.querySelector<T>(selector);
  } catch {
    return null;
  }
}

export function safeQueryAll<T extends Element = Element>(root: ParentNode, selector: string): T[] {
  try {
    return [...root.querySelectorAll<T>(selector)];
  } catch {
    return [];
  }
}

/** Whitespace runs collapsed to one space, trimmed. */
export const collapse = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();

/** Text reduced to letters and digits, lowercased: for "is this the same text" comparisons. */
export const textKey = (s: string | null | undefined): string =>
  (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

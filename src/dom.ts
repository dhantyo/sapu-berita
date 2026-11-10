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

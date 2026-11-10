import { Readability } from '@mozilla/readability';
import { parseHtml } from '../dom.ts';

/**
 * Generic extraction via Mozilla Readability (Firefox reader mode).
 * Used when a site has no rule, or the rule's selectors stopped matching after a redesign.
 * Swap point if Defuddle ever proves better (see docs/PRIOR-ART.md).
 */
export function extractWithReadability(doc: Document): HTMLElement | null {
  const parsed = new Readability(doc.cloneNode(true) as Document, { charThreshold: 300 }).parse();
  if (!parsed?.content) return null;
  // Parse into an inert document so nothing (images, handlers) loads before sanitizing.
  const inert = parseHtml(`<div>${parsed.content}</div>`, doc.baseURI);
  const div = inert.body.firstElementChild as HTMLElement | null;
  return div ? (doc.importNode(div, true) as HTMLElement) : null;
}

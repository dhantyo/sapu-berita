import type { ResolvedRule } from '../types.ts';

/**
 * Pull the article body out of a document using the site rule.
 * Returns a detached container owned by `doc` (clones; the page itself is untouched).
 */
export function extractByRule(doc: Document, rule: ResolvedRule): HTMLElement | null {
  for (const selector of rule.body) {
    let matches: Element[];
    try {
      matches = [...doc.querySelectorAll(selector)];
    } catch {
      continue; // invalid selector in a (remote) rule must not crash the run
    }
    if (!matches.length) continue;

    const container = doc.createElement('div');
    for (const el of rule.bodyAll ? matches : matches.slice(0, 1)) {
      // Move children rather than the wrapper so per-page wrappers don't nest.
      for (const child of el.childNodes) container.append(child.cloneNode(true));
    }
    return container;
  }
  return null;
}

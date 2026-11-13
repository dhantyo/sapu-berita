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
    // Blocks outside the body: lead ones (summary box, photo gallery) go first, trail ones (a photo
    // slider after a one-line intro) after it, in rule order, when the page has them.
    const outside = (sel: string): Element | null => {
      let el: Element | null = null;
      try {
        el = doc.querySelector(sel);
      } catch {
        // invalid selector in a (remote) rule
      }
      return el && !matches.some((m) => m.contains(el!) || el!.contains(m)) ? el : null;
    };
    for (const sel of [...rule.lead].reverse()) {
      const el = outside(sel);
      if (el) container.prepend(el.cloneNode(true));
    }
    for (const sel of rule.trail) {
      const el = outside(sel);
      if (el) container.append(el.cloneNode(true));
    }
    return container;
  }
  return null;
}

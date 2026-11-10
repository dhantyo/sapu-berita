import type { ResolvedRule, RuleSet } from '../types.ts';

const BLOCKS = 'p, div, li, h2, h3, h4, h5, table, blockquote, section, aside, span, strong';
const LAZY_SRC_ATTRS = ['data-src', 'data-original', 'data-lazy-src', 'data-srcset'];

/**
 * Remove junk from an extracted body, in place:
 * 1. common + site + adblock selectors
 * 2. blocks whose text matches "Baca juga:" style patterns
 * 3. promote lazy-loaded images, absolutize URLs, drop empty leftovers
 * Sanitizing for safety is a separate step (sanitize.ts).
 */
export function clean(container: HTMLElement, rule: ResolvedRule, rules: RuleSet, adblock: string[], baseUrl: URL): void {
  removeSelectors(container, [...rules.common.remove, ...rule.remove, ...adblock]);
  dropMatchingBlocks(container, rule.dropParagraphs.length ? rule.dropParagraphs : rules.common.dropParagraphs);
  fixMedia(container, baseUrl);
  removeEmpty(container);
}

function removeSelectors(root: HTMLElement, selectors: string[]): void {
  for (const sel of selectors) {
    try {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    } catch {
      // Unsupported selector (e.g. engine without :has) or a bad rule; skip it.
    }
  }
}

function dropMatchingBlocks(root: HTMLElement, patterns: string[]): void {
  const regexes = patterns.map((p) => new RegExp(p, 'i'));
  for (const el of [...root.querySelectorAll(BLOCKS)]) {
    // The container is detached from the page, so isConnected is always false; check containment instead.
    if (!root.contains(el)) continue;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!regexes.some((r) => r.test(text))) continue;
    // Short blocks go. Long blocks only if they're mostly links (a "Baca Juga" list),
    // never a real paragraph that merely starts with similar words.
    if (text.length <= 400 || linkDensity(el, text.length) > 0.5) el.remove();
  }
}

function linkDensity(el: Element, textLength: number): number {
  const linkText = [...el.querySelectorAll('a')].reduce((n, a) => n + (a.textContent ?? '').trim().length, 0);
  return textLength ? linkText / textLength : 0;
}

function fixMedia(root: HTMLElement, baseUrl: URL): void {
  for (const img of root.querySelectorAll('img')) {
    for (const attr of LAZY_SRC_ATTRS) {
      const v = img.getAttribute(attr);
      if (!v) continue;
      if (attr === 'data-srcset') img.setAttribute('srcset', v);
      else img.setAttribute('src', v);
    }
    img.removeAttribute('loading');
    img.setAttribute('loading', 'lazy');
  }
  for (const el of root.querySelectorAll('[src], [href]')) {
    for (const attr of ['src', 'href']) {
      const v = el.getAttribute(attr);
      if (!v || v.startsWith('data:') || v.startsWith('#')) continue;
      try {
        el.setAttribute(attr, new URL(v, baseUrl).href);
      } catch {
        el.removeAttribute(attr);
      }
    }
  }
}

function removeEmpty(root: HTMLElement): void {
  for (const el of [...root.querySelectorAll('p, div, span, strong, em, section')].reverse()) {
    if (!el.textContent?.trim() && !el.querySelector('img, picture, video, figure, table')) el.remove();
  }
}

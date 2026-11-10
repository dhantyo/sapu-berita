import type { CommonRules } from '../types.ts';

export interface Quality {
  chars: number;
  linkDensity: number;
  ok: boolean;
}

/** Cheap sanity check so we never replace a page with an empty or link-farm "article". */
export function assessQuality(el: Element, q: CommonRules['quality']): Quality {
  const text = normalize(el.textContent);
  const linkText = [...el.querySelectorAll('a')].reduce((n, a) => n + normalize(a.textContent).length, 0);
  const chars = text.length;
  const linkDensity = chars ? linkText / chars : 1;
  return { chars, linkDensity, ok: chars >= q.minChars && linkDensity <= q.maxLinkDensity };
}

function normalize(s: string | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

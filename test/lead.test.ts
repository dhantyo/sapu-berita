import { describe, expect, it } from 'vitest';
import { extractByRule } from '../src/extract/content.ts';
import type { ResolvedRule } from '../src/types.ts';

const rule = (lead: string[]): ResolvedRule => ({
  id: 't', name: 't', body: ['article'], lead, bodyAll: false, remove: [], dropParagraphs: [],
  pagination: { method: 'none' }, logo: [], generic: false,
});

describe('lead blocks', () => {
  it('puts blocks from outside the body at the top, in rule order', () => {
    document.body.innerHTML = '<div class="gallery"><img src="a.jpg"></div><div class="brief"><ul><li>Poin</li></ul></div><article><p>Isi.</p></article>';
    const out = extractByRule(document, rule(['.brief', '.gallery']))!;
    expect([...out.children].map((c) => c.className || c.tagName)).toEqual(['brief', 'gallery', 'P']);
  });

  it('ignores missing lead blocks', () => {
    document.body.innerHTML = '<article><p>Isi.</p></article>';
    expect(extractByRule(document, rule(['.nope']))!.children.length).toBe(1);
  });
});

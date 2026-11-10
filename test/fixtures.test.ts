// Runs the full pipeline against saved real articles (captured with `npm run capture`).
// Offline and deterministic: extra pages come from the fixture, never the network.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from '../src/index.ts';
import { assembleRuleSet } from '../tools/lib/rules.ts';
import { documentFromHtml, nodeContext } from '../tools/lib/dom.ts';

interface Fixture {
  url: string;
  pages: Record<string, string>;
  expect: { ok: boolean; source?: string; pages?: number; chars?: number };
}

const FIXTURES = join(import.meta.dirname, 'fixtures');
const rules = assembleRuleSet();

const cases = existsSync(FIXTURES)
  ? readdirSync(FIXTURES, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((site) =>
        readdirSync(join(FIXTURES, site.name), { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => join(FIXTURES, site.name, d.name)),
      )
  : [];

// Leftovers seen in real use. Add to this list whenever a new kind of junk slips through.
const JUNK = [
  /^\s*baca juga\s*:/im,
  /\bADVERTISEMENT\b/,
  /SCROLL TO CONTINUE/i,
  /Dukung KOMPAS\.com/i,
  /Artikel Kompas\.id/i,
  /Tautan telah disalin/i,
];

describe.skipIf(!cases.length)('fixtures', () => {
  it.each(cases)('%s', async (dir) => {
    const fx = JSON.parse(readFileSync(join(dir, 'fixture.json'), 'utf8')) as Fixture;
    const pages = Object.fromEntries(Object.entries(fx.pages).map(([u, f]) => [u, join(dir, f)]));
    const doc = documentFromHtml(readFileSync(join(dir, 'page.html'), 'utf8'), fx.url);

    const result = await run(nodeContext(doc, fx.url, rules, pages));

    expect(result.ok, JSON.stringify(result)).toBe(fx.expect.ok);
    if (!result.ok) return;
    const text = result.article.content.textContent ?? '';
    expect(result.article.source).toBe(fx.expect.source);
    expect(result.article.pages).toBe(fx.expect.pages);
    // Allow small drift from rule tweaks, catch big regressions.
    expect(text.replace(/\s+/g, ' ').trim().length).toBeGreaterThan((fx.expect.chars ?? 0) * 0.9);
    for (const junk of JUNK) expect(text).not.toMatch(junk);
    // Brave Shields hides <strong> on some news domains, even inside our Shadow DOM.
    expect(result.article.content.querySelector('strong')).toBeNull();
  });
});

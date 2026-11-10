// Page 1 must be reported before pagination's network requests, then the merged result.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run, type RunResult } from '../src/index.ts';
import { assembleRuleSet } from '../tools/lib/rules.ts';
import { documentFromHtml, nodeContext } from '../tools/lib/dom.ts';

const rules = assembleRuleSet();
const FIXTURE = join(import.meta.dirname, 'fixtures', 'tribun', 'pernyataan-lengkap-gibran-usai-sampaikan-niat-mundur-sebagai');

describe('progressive rendering', () => {
  it('reports page 1 first, then the merged article', async () => {
    const fx = JSON.parse(readFileSync(join(FIXTURE, 'fixture.json'), 'utf8'));
    const pages = Object.fromEntries(Object.entries(fx.pages as Record<string, string>).map(([u, f]) => [u, join(FIXTURE, f)]));
    const doc = documentFromHtml(readFileSync(join(FIXTURE, 'page.html'), 'utf8'), fx.url);

    const calls: Array<{ result: RunResult; loadingMore: boolean }> = [];
    const final = await run(nodeContext(doc, fx.url, rules, pages), (result, loadingMore) =>
      calls.push({ result, loadingMore }),
    );

    expect(calls.map((c) => c.loadingMore)).toEqual([true, false]);
    const [first, last] = calls.map((c) => (c.result.ok ? c.result.article : null));
    expect(first?.pages).toBe(1);
    expect(last?.pages).toBe(3);
    const len = (a: typeof first) => a?.content.textContent?.length ?? 0;
    expect(len(last)).toBeGreaterThan(len(first));
    expect(final).toBe(calls[1]!.result);
  });

  it('reports once for articles that need no extra pages', async () => {
    const dir = join(import.meta.dirname, 'fixtures', 'cnnindonesia', 'kubu-silmy-karim-klaim-perkara-pemerasan-akan-sulit-dibuktik');
    const fx = JSON.parse(readFileSync(join(dir, 'fixture.json'), 'utf8'));
    const doc = documentFromHtml(readFileSync(join(dir, 'page.html'), 'utf8'), fx.url);
    const flags: boolean[] = [];
    await run(nodeContext(doc, fx.url, rules, {}), (_r, more) => flags.push(more));
    expect(flags).toEqual([false]);
  });
});

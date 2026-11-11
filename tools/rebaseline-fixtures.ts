// Recompute each fixture's expected result from its saved HTML (no network), after a deliberate
// change to cleaning rules. Review the printed diff before committing: a big drop means lost text.
//   npm run rebaseline
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run } from '../src/index.ts';
import { ROOT, assembleRuleSet } from './lib/rules.ts';
import { documentFromHtml, nodeContext } from './lib/dom.ts';

const rules = assembleRuleSet();
const dir = join(ROOT, 'test', 'fixtures');

for (const site of readdirSync(dir)) {
  for (const slug of readdirSync(join(dir, site))) {
    const fxDir = join(dir, site, slug);
    const file = join(fxDir, 'fixture.json');
    const fx = JSON.parse(readFileSync(file, 'utf8'));
    const pages = Object.fromEntries(Object.entries(fx.pages as Record<string, string>).map(([u, f]) => [u, join(fxDir, f)]));
    const doc = documentFromHtml(readFileSync(join(fxDir, 'page.html'), 'utf8'), fx.url);
    const result = await run(nodeContext(doc, fx.url, rules, pages));
    const before = fx.expect;
    fx.expect = result.ok
      ? {
          ok: true,
          source: result.article.source,
          pages: result.article.pages,
          chars: (result.article.content.textContent ?? '').replace(/\s+/g, ' ').trim().length,
          title: result.article.meta.title,
        }
      : { ok: false, reason: result.reason };
    writeFileSync(file, JSON.stringify(fx, null, 2) + '\n');
    console.log(`${site}/${slug.slice(0, 40)}: chars ${before.chars} → ${fx.expect.chars}, pages ${before.pages} → ${fx.expect.pages}`);
  }
}

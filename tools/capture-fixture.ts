// Save a live article (and the extra pages pagination would fetch) as a test fixture.
//   npm run capture -- <article-url> [<article-url> …]
// Writes test/fixtures/<rule-id>/<slug>/{page.html, pages/*.html, fixture.json}
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run } from '../src/index.ts';
import { findRule } from '../src/rules/match.ts';
import { ROOT, assembleRuleSet } from './lib/rules.ts';
import { documentFromHtml, fetchHtml, nodeContext } from './lib/dom.ts';

const urls = process.argv.slice(2);
if (!urls.length) {
  console.error('usage: npm run capture -- <article-url> [...]');
  process.exit(1);
}
const rules = assembleRuleSet();

for (const url of urls) {
  const rule = findRule(rules, new URL(url));
  if (!rule) {
    console.error(`no rule matches ${url}`);
    continue;
  }
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop()!.slice(0, 60);
  const dir = join(ROOT, 'test', 'fixtures', rule.id, slug);
  mkdirSync(join(dir, 'pages'), { recursive: true });

  const { html, finalUrl } = await fetchHtml(url);
  writeFileSync(join(dir, 'page.html'), html);

  // Run once against the network, recording every extra page it fetches.
  const pages: Record<string, string> = {};
  const ctx = nodeContext(documentFromHtml(html, finalUrl), finalUrl, rules);
  const networkFetch = ctx.fetchDocument;
  ctx.fetchDocument = async (u) => {
    const { html: pageHtml } = await fetchHtml(u.href);
    const name = `p${Object.keys(pages).length + 2}.html`;
    writeFileSync(join(dir, 'pages', name), pageHtml);
    pages[u.href] = `pages/${name}`;
    return networkFetch(u);
  };
  const result = await run(ctx);

  const summary = result.ok
    ? {
        ok: true,
        source: result.article.source,
        pages: result.article.pages,
        chars: (result.article.content.textContent ?? '').replace(/\s+/g, ' ').trim().length,
        title: result.article.meta.title,
      }
    : { ok: false, reason: result.reason, detail: result.detail };

  writeFileSync(
    join(dir, 'fixture.json'),
    JSON.stringify({ url: finalUrl, capturedAt: new Date().toISOString(), pages, expect: summary }, null, 2) + '\n',
  );
  console.log(`${rule.id}/${slug}:`, summary);
}

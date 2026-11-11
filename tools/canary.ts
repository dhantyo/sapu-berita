// Daily live check: newest article per site (via RSS) + each rule's samples must pass the pipeline.
// Exit code 1 if any site fails, so the GitHub Action goes red and emails the maintainer.
import { run } from '../src/index.ts';
import { assembleRuleSet } from './lib/rules.ts';
import { documentFromHtml, fetchHtml, nodeContext } from './lib/dom.ts';

const rules = assembleRuleSet();
let failures = 0;
let blocked = 0;
// 401/403/429 from a site means it refused the CI runner's datacenter IP, not that the rule broke.
const BLOCKED = /^Error: HTTP (401|403|429) /;

async function newestFromFeed(feed: string): Promise<string | undefined> {
  try {
    const { html: xml } = await fetchHtml(feed);
    return xml.match(/<item>[\s\S]*?<link>(?:<!\[CDATA\[)?\s*([^<\]\s]+)/)?.[1];
  } catch {
    return undefined;
  }
}

for (const site of rules.sites) {
  if (site.noCanary) {
    console.log(`⏭  ${site.id} skipped (blocks non-browser requests; verified in a browser)`);
    continue;
  }
  const fresh = site.feed ? await newestFromFeed(site.feed) : undefined;
  const urls = [...new Set([fresh, ...(site.samples ?? [])].filter((u): u is string => !!u))];

  for (const url of urls) {
    try {
      const { html, finalUrl } = await fetchHtml(url);
      const result = await run(nodeContext(documentFromHtml(html, finalUrl), finalUrl, rules));
      if (!result.ok) throw new Error(`${result.reason} ${result.detail ?? ''}`);
      // A rule that silently falls back to Readability is a rule that broke.
      if (result.article.source !== 'rule') throw new Error('site rule no longer matches (fell back to Readability)');
      const chars = (result.article.content.textContent ?? '').replace(/\s+/g, ' ').trim().length;
      console.log(`✅ ${site.id} ${chars} chars, ${result.article.pages} page(s)  ${url}`);
    } catch (err) {
      failures++;
      console.log(`❌ ${site.id}  ${url}\n   ${String(err)}`);
    }
  }
}

if (blocked) console.log(`${blocked} request(s) blocked by the site; check those in a browser.`);
process.exit(failures ? 1 : 0);

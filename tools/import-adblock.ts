// Turn the maintained Indonesian filter lists into per-domain hiding selectors for our sites.
// Uses @ghostery/adblocker (a tested filter engine) instead of hand-parsing ABP/uBO syntax.
import { FiltersEngine } from '@ghostery/adblocker';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_DIR, readSiteRules } from './lib/rules.ts';

const LISTS = [
  'https://raw.githubusercontent.com/realodix/AdBlockID/master/dist/adblockid.adfl.txt',
  'https://raw.githubusercontent.com/realodix/AdBlockID/master/dist/annoyance.txt',
  'https://raw.githubusercontent.com/ABPindo/indonesianadblockrules/master/subscriptions/abpindo.txt',
];

const texts = await Promise.all(
  LISTS.map(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }),
);

const engine = FiltersEngine.parse(texts.join('\n'), { loadCosmeticFilters: true, loadNetworkFilters: false });
const domains = [...new Set(readSiteRules().flatMap((s) => s.domains))].sort();

const out: Record<string, string[]> = {};
for (const domain of domains) {
  const { styles, extended } = engine.getCosmeticsFilters({
    url: `https://${domain}/`,
    hostname: domain,
    domain,
    getBaseRules: false, // skip generic rules; we only want what the lists say about this site
    getInjectionRules: false,
  });
  const selectors = new Set<string>();
  for (const block of styles.split('}')) {
    const head = block.split('{')[0]?.trim();
    if (head) head.split(/,\s*\n/).forEach((s) => s.trim() && selectors.add(s.trim()));
  }
  // Procedural filters like `.x:has(> .y):remove()` arrive in `extended`; keep the plain-CSS part.
  for (const f of extended as Array<{ selector?: string }>) {
    const sel = f.selector?.replace(/:remove\(\)$/, '').trim();
    if (sel) selectors.add(sel);
  }
  out[domain] = [...selectors].sort();
}

mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(join(GENERATED_DIR, 'adblock.json'), JSON.stringify(out, null, 2) + '\n');
console.log(Object.entries(out).map(([d, s]) => `${d}: ${s.length}`).join('\n'));

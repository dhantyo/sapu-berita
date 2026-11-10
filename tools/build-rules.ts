// Assemble rules/ into dist/rules.json (the file published for remote updates).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, assembleRuleSet } from './lib/rules.ts';

export function buildRules() {
  const rules = assembleRuleSet();
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  writeFileSync(join(ROOT, 'dist', 'rules.json'), JSON.stringify(rules));
  return rules;
}

if (import.meta.main) {
  const r = buildRules();
  console.log(
    `rules v${r.version}: ${r.sites.length} sites, ${r.paginationOnly.length} pagination-only, ` +
      `${Object.keys(r.adblock).length} adblock domains`,
  );
}

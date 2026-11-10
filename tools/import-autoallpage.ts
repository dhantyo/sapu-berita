// Import AutoAllPage's per-site pagination rules (51 Indonesian sites) as pagination-only rules.
// Sites with a hand-written rules/sites/*.json override these at assembly time.
// Only `param` rules are imported; xhr/dom/path ones need selectors we haven't verified.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import type { PaginationOnlyRule } from '../src/types.ts';
import { GENERATED_DIR } from './lib/rules.ts';

const SOURCE = 'https://raw.githubusercontent.com/reforget-id/AutoAllPage/main/script/autoallpage.user.js';

interface AapSite {
  id: string;
  hostname: RegExp;
  path: RegExp;
  method: 'param' | 'path' | 'xhr' | 'dom';
  fullpage?: string;
}

const script = await (await fetch(SOURCE)).text();
const start = script.indexOf('const websiteList = [');
const end = script.indexOf('\n    ]', start);
if (start < 0 || end < 0) throw new Error('websiteList not found; AutoAllPage layout changed');

// The slice is a plain array literal of strings/regexes/objects. Evaluate it in an empty sandbox with a timeout.
const literal = script.slice(start + 'const websiteList = '.length, end + '\n    ]'.length);
const sites = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 }) as AapSite[];

const rules: PaginationOnlyRule[] = sites
  .filter((s) => s.method === 'param' && s.fullpage && /^[a-z_]+=[a-z0-9_]+$/.test(s.fullpage))
  .map((s) => ({
    id: `aap-${s.id}`,
    hostname: s.hostname.source,
    path: s.path.source,
    pagination: {
      method: 'param',
      fullpage: s.fullpage!,
      stripPathPage: ['cnbc', 'detik', 'fajar'].includes(s.id),
    },
  }));

mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(join(GENERATED_DIR, 'autoallpage.json'), JSON.stringify(rules, null, 2) + '\n');
console.log(`imported ${rules.length} of ${sites.length} AutoAllPage sites (param method only)`);

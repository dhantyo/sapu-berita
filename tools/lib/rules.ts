// Node-side helpers for assembling the RuleSet from rules/ (used by build, tests, canary).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CommonRules, PaginationOnlyRule, RuleSet, SiteRule } from '../../src/types.ts';

export const ROOT = join(import.meta.dirname, '..', '..');
export const RULES_DIR = join(ROOT, 'rules');
export const GENERATED_DIR = join(RULES_DIR, 'generated');

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

export function readSiteRules(): SiteRule[] {
  const dir = join(RULES_DIR, 'sites');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const { $schema: _schema, ...rule } = readJson<SiteRule & { $schema?: string }>(join(dir, f));
      return rule;
    });
}

export function assembleRuleSet(now = new Date()): RuleSet {
  const sites = readSiteRules();
  const handled = new Set(sites.flatMap((s) => s.domains));

  const aapPath = join(GENERATED_DIR, 'autoallpage.json');
  const paginationOnly = existsSync(aapPath)
    ? readJson<PaginationOnlyRule[]>(aapPath).filter((r) => ![...handled].some((d) => new RegExp(r.hostname).test(d)))
    : [];

  const adblockPath = join(GENERATED_DIR, 'adblock.json');
  const adblock = existsSync(adblockPath) ? readJson<Record<string, string[]>>(adblockPath) : {};

  return {
    version: Number(now.toISOString().replace(/\D/g, '').slice(0, 12)), // YYYYMMDDHHmm
    common: readJson<CommonRules & { notes?: string }>(join(RULES_DIR, 'common.json')),
    sites,
    paginationOnly,
    adblock,
  };
}

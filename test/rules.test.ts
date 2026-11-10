import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRule } from '../src/rules/match.ts';
import { RULES_DIR, assembleRuleSet, readSiteRules } from '../tools/lib/rules.ts';

const schema = JSON.parse(readFileSync(join(RULES_DIR, 'schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
const sites = readSiteRules();
const rules = assembleRuleSet();

describe.each(sites.map((s) => [s.id, s] as const))('rule %s', (_id, site) => {
  it('matches the schema', () => {
    const ok = validate(site);
    expect(validate.errors ?? [], JSON.stringify(validate.errors, null, 2)).toEqual([]);
    expect(ok).toBe(true);
  });

  it('has valid regexes and selectors', () => {
    expect(() => new RegExp(site.articleUrl)).not.toThrow();
    const selectors = [
      ...site.body,
      ...(site.remove ?? []),
      ...(site.variants ?? []).flatMap((v) => [...(v.body ?? []), ...(v.remove ?? [])]),
    ];
    for (const sel of selectors) expect(() => document.querySelector(sel), sel).not.toThrow();
    for (const p of [...(site.dropParagraphs ?? []), ...(site.variants ?? []).flatMap((v) => v.dropParagraphs ?? [])]) {
      expect(() => new RegExp(p, 'i')).not.toThrow();
    }
  });

  it('matches its own sample URLs, and only those', () => {
    for (const sample of site.samples ?? []) {
      expect(findRule(rules, new URL(sample))?.id).toBe(site.id);
    }
  });
});

describe('matching', () => {
  it('ignores non-article pages', () => {
    expect(findRule(rules, new URL('https://news.detik.com/'))).toBeNull();
    expect(findRule(rules, new URL('https://www.kompas.com/'))).toBeNull();
    // Photo galleries have no article text; leave them alone (found by the canary).
    expect(findRule(rules, new URL('https://www.liputan6.com/photo/read/8332718/x'))).toBeNull();
  });

  it('applies liputan6 bola variant', () => {
    const r = findRule(rules, new URL('https://www.liputan6.com/bola/read/8332705/x'));
    expect(r?.pagination.method).toBe('fetch');
    expect(findRule(rules, new URL('https://www.liputan6.com/news/read/8332591/x'))?.pagination.method).toBe('inline');
  });
});

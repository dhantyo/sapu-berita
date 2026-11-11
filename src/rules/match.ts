import type { ResolvedRule, RuleSet, SiteRule } from '../types.ts';

export function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith('.' + domain);
}

/** Find the rule for a URL. Hand-written site rules win over AutoAllPage pagination-only rules. */
export function findRule(rules: RuleSet, url: URL): ResolvedRule | null {
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  const site = rules.sites.find(
    (s) => s.domains.some((d) => hostMatches(host, d)) && new RegExp(s.articleUrl).test(path),
  );
  if (site) return resolve(site, path, rules);

  const generic = rules.paginationOnly.find(
    (r) => new RegExp(r.hostname).test(host) && new RegExp(r.path).test(path),
  );
  if (generic) {
    return {
      id: generic.id,
      name: generic.id,
      body: [],
      bodyAll: false,
      remove: [],
      dropParagraphs: [],
      pagination: generic.pagination,
      logo: [],
      generic: true,
    };
  }
  return null;
}

function resolve(site: SiteRule, path: string, rules: RuleSet): ResolvedRule {
  const variant = site.variants?.find((v) => new RegExp(v.when).test(path));
  return {
    id: site.id,
    name: site.name,
    body: variant?.body ?? site.body,
    bodyAll: variant?.bodyAll ?? site.bodyAll ?? false,
    remove: [...(site.remove ?? []), ...(variant?.remove ?? [])],
    dropParagraphs: [
      ...rules.common.dropParagraphs,
      ...(site.dropParagraphs ?? []),
      ...(variant?.dropParagraphs ?? []),
    ],
    pagination: variant?.pagination ?? site.pagination,
    logo: site.logo ?? [],
    generic: false,
  };
}

/** Adblock selectors that apply to this host (any listed registrable domain it falls under). */
export function adblockSelectors(rules: RuleSet, host: string): string[] {
  return Object.entries(rules.adblock)
    .filter(([domain]) => hostMatches(host, domain))
    .flatMap(([, selectors]) => selectors);
}

// Shared types. Mirrors rules/schema.json; keep them in sync.

export type Pagination =
  | { method: 'none' }
  | { method: 'inline'; notes?: string }
  | { method: 'param'; fullpage: string; stripPathPage?: boolean; onlyIf?: string }
  | { method: 'fetch'; pageLinks: string; maxPages?: number };

export interface RuleOverrides {
  body?: string[];
  bodyAll?: boolean;
  remove?: string[];
  dropParagraphs?: string[];
  pagination?: Pagination;
}

export interface SiteRule extends RuleOverrides {
  id: string;
  name: string;
  domains: string[];
  articleUrl: string;
  body: string[];
  pagination: Pagination;
  variants?: Array<RuleOverrides & { when: string }>;
  feed?: string;
  samples?: string[];
  verified?: string;
  notes?: string;
}

/** Pagination-only rule imported from AutoAllPage, for sites without a hand-written SiteRule. */
export interface PaginationOnlyRule {
  id: string;
  hostname: string; // regex source
  path: string; // regex source
  pagination: Pagination;
}

export interface CommonRules {
  version: number;
  dropParagraphs: string[];
  remove: string[];
  quality: { minChars: number; maxLinkDensity: number };
}

export interface RuleSet {
  /** Monotonic version (YYYYMMDDHHmm). Remote rules replace bundled ones only if newer. */
  version: number;
  common: CommonRules;
  sites: SiteRule[];
  paginationOnly: PaginationOnlyRule[];
  /** Cosmetic hiding selectors per registrable domain, imported from AdBlockID/ABPindo. */
  adblock: Record<string, string[]>;
}

/** A SiteRule with its matching variant merged in and defaults filled. */
export interface ResolvedRule {
  id: string;
  name: string;
  body: string[];
  bodyAll: boolean;
  remove: string[];
  dropParagraphs: string[];
  pagination: Pagination;
  /** True when only pagination is known (AutoAllPage import) and the body must come from Readability. */
  generic: boolean;
}

export interface ArticleMeta {
  title: string;
  byline?: string;
  published?: string;
  image?: string;
  siteName?: string;
  description?: string;
}

export interface Article {
  meta: ArticleMeta;
  /** Cleaned, sanitized article body (detached element). */
  content: HTMLElement;
  source: 'rule' | 'readability';
  pages: number;
  ruleId?: string;
}

export type RunResult =
  | { ok: true; article: Article }
  | { ok: false; reason: FailReason; detail?: string };

export type FailReason = 'not-article' | 'no-content' | 'low-quality' | 'error';

export interface Context {
  doc: Document;
  url: URL;
  rules: RuleSet;
  /** Fetches a same-origin URL and returns an inert parsed Document. Injected so Node tests/canary can provide their own. */
  fetchDocument: (url: URL) => Promise<Document>;
  log: (msg: string, data?: unknown) => void;
}

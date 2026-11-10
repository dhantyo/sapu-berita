import type { Article, Context, RunResult } from './types.ts';
import { adblockSelectors, findRule } from './rules/match.ts';
import { extractMetadata } from './extract/metadata.ts';
import { extractByRule } from './extract/content.ts';
import { extractWithReadability } from './extract/fallback.ts';
import { assessQuality } from './extract/quality.ts';
import { paginate, type Extractor } from './paginate/index.ts';
import { clean } from './clean/index.ts';
import { sanitize } from './clean/sanitize.ts';

export type { Article, Context, RunResult, RuleSet } from './types.ts';
export { renderOverlay } from './render/overlay.ts';
export { loadRules } from './rules/load.ts';
export { fetchSameOriginDocument, parseHtml } from './dom.ts';

/**
 * The whole pipeline: match → metadata → extract (rule, else Readability) → paginate → clean → sanitize → quality gate.
 * Pure with respect to the page: it reads ctx.doc but never mutates it. Rendering is the caller's choice.
 */
export async function run(ctx: Context): Promise<RunResult> {
  try {
    const rule = findRule(ctx.rules, ctx.url);
    if (!rule) return { ok: false, reason: 'not-article' };

    const meta = extractMetadata(ctx.doc);
    const q = ctx.rules.common.quality;

    const byRule: Extractor = (doc) => extractByRule(doc, rule);
    let source: Article['source'] = 'rule';
    let extract: Extractor = byRule;
    let body = rule.generic ? null : byRule(ctx.doc);
    if (!body || !assessQuality(body, q).ok) {
      ctx.log(`rule ${rule.id} gave no usable body, trying Readability`);
      source = 'readability';
      extract = extractWithReadability;
      body = extract(ctx.doc);
    }
    if (!body) return { ok: false, reason: 'no-content' };

    // Other pages are extracted the same way page 1 was.
    const { container, pages } = await paginate(body, rule, extract, ctx);

    clean(container, rule, ctx.rules, adblockSelectors(ctx.rules, ctx.url.hostname), ctx.url);
    const content = sanitize(container);

    const quality = assessQuality(content, q);
    if (!quality.ok) return { ok: false, reason: 'low-quality', detail: JSON.stringify(quality) };

    return { ok: true, article: { meta, content, source, pages, ruleId: rule.id } };
  } catch (err) {
    return { ok: false, reason: 'error', detail: String(err) };
  }
}

import type { Article, ArticleMeta, Context, ResolvedRule, RunResult } from './types.ts';
import { adblockSelectors, findRule } from './rules/match.ts';
import { extractMetadata } from './extract/metadata.ts';
import { findLogo, groundForSrc, logoAlternates } from './extract/logo.ts';
import { extractByRule } from './extract/content.ts';
import { extractWithReadability } from './extract/fallback.ts';
import { assessQuality } from './extract/quality.ts';
import { needsNetwork, paginate, type Extractor } from './paginate/index.ts';
import { clean } from './clean/index.ts';
import { sanitize } from './clean/sanitize.ts';
import { prependMainVideo } from './clean/embeds.ts';

export type { Article, Context, RunResult, RuleSet } from './types.ts';
export { renderOverlay, type OverlayHandle } from './render/overlay.ts';
export { loadRules, refreshRulesIfStale } from './rules/load.ts';
export { fetchSameOriginDocument, parseHtml } from './dom.ts';

/** Called with the first (page 1) result right away, then again once extra pages are merged in. */
export type ProgressCallback = (result: RunResult, morePagesLoading: boolean) => void;

/**
 * The whole pipeline: match → metadata → extract (rule, else Readability) → paginate → clean → sanitize → quality gate.
 * Pure with respect to the page: it reads ctx.doc but never mutates it. Rendering is the caller's choice.
 *
 * With `onProgress`, page 1 is reported before pagination starts so the reader isn't kept waiting on
 * extra network requests. The returned promise always resolves to the final (merged) result.
 */
export async function run(ctx: Context, onProgress?: ProgressCallback): Promise<RunResult> {
  try {
    const rule = findRule(ctx.rules, ctx.url);
    if (!rule) return report({ ok: false, reason: 'not-article' });

    const extracted = extractMetadata(ctx.doc);
    // The site's own masthead logo (auto-detected, carries regional brands) beats the generic JSON-LD one.
    const masthead = findLogo(ctx.doc, rule.logo);
    const meta = masthead
      ? {
          ...extracted,
          logo: masthead.src,
          logoGround: masthead.darkGround,
          logoFallbacks: [...logoAlternates(ctx.doc, masthead.src), extracted.logo]
            .filter((u, i, all): u is string => !!u && u !== masthead.src && all.indexOf(u) === i),
        }
      : { ...extracted, logoGround: extracted.logo ? groundForSrc(ctx.doc, extracted.logo) : undefined };
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
    if (!body) return report({ ok: false, reason: 'no-content' });

    if (onProgress && needsNetwork(rule, ctx)) {
      // Show page 1 now instead of waiting on the network. Use a copy: pagination may append to `body`.
      onProgress(finish(body.cloneNode(true) as HTMLElement, 1), true);
    }

    // Other pages are extracted the same way page 1 was.
    const { container, pages } = await paginate(body, rule, extract, ctx);
    return report(finish(container, pages));

    function finish(container: HTMLElement, pages: number): RunResult {
      return finishArticle(container, pages, rule!, meta, source, ctx);
    }
  } catch (err) {
    return report({ ok: false, reason: 'error', detail: String(err) });
  }

  function report(result: RunResult): RunResult {
    onProgress?.(result, false);
    return result;
  }
}

function finishArticle(
  container: HTMLElement,
  pages: number,
  rule: ResolvedRule,
  meta: ArticleMeta,
  source: Article['source'],
  ctx: Context,
): RunResult {
  if (meta.video) prependMainVideo(container, meta.video);
  const swept = clean(container, rule, ctx.rules, adblockSelectors(ctx.rules, ctx.url.hostname), ctx.url);
  const content = sanitize(container);
  const quality = assessQuality(content, ctx.rules.common.quality);
  if (!quality.ok) return { ok: false, reason: 'low-quality', detail: JSON.stringify(quality) };
  return { ok: true, article: { meta, content, source, pages, swept, ruleId: rule.id } };
}

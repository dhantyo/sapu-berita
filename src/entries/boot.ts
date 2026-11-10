import bundledRules from 'bacabersih:rules';
import { fetchSameOriginDocument, loadRules, renderOverlay, run, type RunResult } from '../index.ts';

/** Where published rules live. Set at build time via esbuild `define`; empty disables remote updates. */
declare const __REMOTE_RULES_URL__: string;

export interface BootResult {
  result: RunResult;
  rendered: boolean;
}

/** Shared browser boot for every wrapper: load rules, run the pipeline on the live page, draw the overlay. */
export async function boot(options: { debug?: boolean } = {}): Promise<BootResult> {
  const url = new URL(location.href);
  const result = await run({
    doc: document,
    url,
    rules: loadRules(bundledRules, __REMOTE_RULES_URL__ || undefined),
    fetchDocument: (u) => fetchSameOriginDocument(u, url.origin),
    log: (msg, data) => {
      if (options.debug) console.debug('[bacabersih]', msg, data ?? '');
    },
  });

  if (!result.ok) {
    if (options.debug) console.debug('[bacabersih] skipped:', result.reason, result.detail ?? '');
    return { result, rendered: false };
  }
  renderOverlay(document, result.article);
  return { result, rendered: true };
}

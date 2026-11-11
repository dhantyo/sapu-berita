import bundledRules from 'bacabersih:rules';
import {
  fetchSameOriginDocument,
  loadRules,
  renderOverlay,
  run,
  type OverlayHandle,
  type RunResult,
} from '../index.ts';
import { localStorageStore, normalizeSettings, type SettingsStore } from '../settings.ts';

/** Where published rules live. Set at build time via esbuild `define`; empty disables remote updates. */
declare const __REMOTE_RULES_URL__: string;

export interface BootResult {
  result: RunResult;
  rendered: boolean;
}

export interface BootOptions {
  debug?: boolean;
  /** Where reader settings live. Defaults to localStorage (per site, best effort). */
  store?: SettingsStore;
  /** Ignore the "open automatically" setting (the user explicitly asked, e.g. via the iOS Shortcut). */
  forceOpen?: boolean;
}

/**
 * Shared browser boot for every wrapper: load rules and settings, run the pipeline on the live page,
 * draw the overlay. Page 1 is drawn as soon as it's extracted; merged pages replace it when they arrive.
 */
export async function boot(options: BootOptions = {}): Promise<BootResult> {
  const t0 = performance.now();
  const debug = (msg: string, data?: unknown) => {
    if (options.debug) console.debug('[sapuberita]', msg, data ?? '');
  };
  const url = new URL(location.href);
  const store = options.store ?? localStorageStore;
  const settingsReady = store.load().then(normalizeSettings, () => normalizeSettings(undefined));
  let overlay: OverlayHandle | null = null;
  let pending: Promise<void> = Promise.resolve();

  const result = await run(
    {
      doc: document,
      url,
      rules: loadRules(bundledRules, __REMOTE_RULES_URL__ || undefined),
      fetchDocument: (u) => fetchSameOriginDocument(u, url.origin),
      log: debug,
    },
    (r, loadingMore) => {
      // Settings load is async (extension storage); queue renders behind it, in order.
      pending = pending.then(async () => {
        const settings = await settingsReady;
        if (r.ok) {
          if (overlay) overlay.update(r.article, loadingMore);
          else {
            overlay = renderOverlay(document, r.article, {
              settings,
              loadingMore,
              startHidden: !settings.autoOpen && !options.forceOpen,
              originalUrl: url.href,
              onSettingsChange: (s) => void store.save(s),
            });
          }
          const now = Math.round(performance.now());
          debug(`${loadingMore ? 'page 1' : 'final'} rendered ${now} ms after navigation (${Math.round(now - t0)} ms of work)`, {
            pages: r.article.pages,
            swept: r.article.swept,
          });
          // Dev builds: expose timings to page-side tooling (DevTools, test automation). Content-script
          // console output isn't visible to every tool, page attributes are.
          if (options.debug) {
            document.documentElement.setAttribute(loadingMore ? 'data-sb-page1-ms' : 'data-sb-final-ms', String(now));
            document.documentElement.setAttribute('data-sb-start-ms', String(Math.round(t0)));
          }
        } else if (overlay) {
          // Merging failed after page 1 was shown: keep page 1 rather than yanking the overlay away.
          overlay.doneLoading();
          debug('merging failed, keeping page 1:', r.reason);
        }
      });
    },
  );
  await pending;

  if (!result.ok && !overlay) debug('skipped:', `${result.reason} ${result.detail ?? ''}`);
  return { result, rendered: overlay !== null };
}

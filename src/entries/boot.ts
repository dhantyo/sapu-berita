import bundledRules from 'sapuberita:rules';
import {
  fetchSameOriginDocument,
  loadRules,
  refreshRulesIfStale,
  renderOverlay,
  run,
  type OverlayHandle,
  type RunResult,
} from '../index.ts';
import { localStorageStore, normalizeSettings, type SettingsStore } from '../settings.ts';
import { cachedManifest, isSnoozed, latestManifest, offerFor, reportLink, snoozeOffer, type Platform } from '../update.ts';

/** Release channel (update.json + rules.json), set at build time via esbuild `define`; empty = no updates. */
declare const __CHANNEL_URL__: string;
/** Report link template with {url} {title} {site} {version} {platform}; update.json may override it. */
declare const __REPORT_URL__: string;
declare const __SAPU_VERSION__: string | undefined;
const VERSION = typeof __SAPU_VERSION__ === 'string' ? __SAPU_VERSION__ : 'dev';
const CHANNEL = __CHANNEL_URL__ || undefined;

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
  /** Which wrapper is running: picks the update link and labels bug reports. */
  platform?: Platform;
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
  const platform = options.platform ?? 'web';
  const checkForUpdates = async (shown: OverlayHandle) => {
    if (!CHANNEL) return;
    refreshRulesIfStale(new URL('rules.json', CHANNEL).href);
    const offer = offerFor(await latestManifest(CHANNEL), VERSION, platform);
    if (offer && !isSnoozed(offer.version)) shown.offerUpdate(offer);
  };
  const store = options.store ?? localStorageStore;
  const settingsReady = store.load().then(normalizeSettings, () => normalizeSettings(undefined));
  let overlay: OverlayHandle | null = null;
  let pending: Promise<void> = Promise.resolve();

  const result = await run(
    {
      doc: document,
      url,
      // Cached remote rules if newer than the bundled ones; refreshed below only if the reader allows updates.
      rules: loadRules(bundledRules),
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
              onSnoozeUpdate: snoozeOffer,
              reportUrl: (a) => {
                const template = cachedManifest()?.report || __REPORT_URL__;
                return template ? reportLink(template, {
                  url: url.href, title: a.meta.title, site: url.hostname, version: VERSION, platform,
                }) : undefined;
              },
            });
            if (settings.updates) void checkForUpdates(overlay);
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

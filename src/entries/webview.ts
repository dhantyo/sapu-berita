// Injected by the Android link-router app (apps/android) at document start.
// - Waits for the HTML to be parsed (DOMContentLoaded), like the desktop extension's document_end.
// - Stores reader settings in the app (SharedPreferences) through a JS bridge, so they apply on every
//   site, not per-site like localStorage.
// - Reports the outcome so the app can fall back to the user's normal browser.
import type { Settings, SettingsStore } from '../settings.ts';
import { boot } from './boot.ts';

interface AndroidBridge {
  onResult(json: string): void;
  loadSettings(): string;
  saveSettings(json: string): void;
}

declare global {
  interface Window {
    SapuBeritaAndroid?: AndroidBridge;
  }
}

const bridge = window.SapuBeritaAndroid;

const appStore: SettingsStore | undefined = bridge && {
  async load() {
    try {
      const raw = bridge.loadSettings();
      return raw ? (JSON.parse(raw) as Partial<Settings>) : undefined;
    } catch {
      return undefined;
    }
  },
  async save(settings) {
    bridge.saveSettings(JSON.stringify(settings));
  },
};

const start = () =>
  void boot({ store: appStore, platform: 'android' }).then(
    ({ result, rendered }) =>
      bridge?.onResult(JSON.stringify({ rendered, reason: result.ok ? null : result.reason, url: location.href })),
    (err) => bridge?.onResult(JSON.stringify({ rendered: false, reason: String(err), url: location.href })),
  );

// Document-start scripts run in every frame (ads included); only the page itself is the article.
const isTopFrame = (() => {
  try {
    return window.top === window;
  } catch {
    return false;
  }
})();

// Guard against double injection (document-start script plus the onPageFinished fallback).
const w = window as Window & { __sapuBerita?: boolean };
if (isTopFrame && !w.__sapuBerita) {
  w.__sapuBerita = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

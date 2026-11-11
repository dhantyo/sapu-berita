// Desktop dev extension content script (apps/extension). Runs automatically on supported sites.
import type { Settings, SettingsStore } from '../settings.ts';
import { boot } from './boot.ts';

declare const chrome: {
  storage?: { local: { get(key: string): Promise<Record<string, unknown>>; set(items: Record<string, unknown>): Promise<void> } };
};

const KEY = 'settings';

/** Extension storage is shared by every site, unlike localStorage, so settings follow the reader everywhere. */
const extensionStore: SettingsStore = {
  async load() {
    if (!chrome.storage) return undefined;
    return (await chrome.storage.local.get(KEY))[KEY] as Partial<Settings> | undefined;
  },
  async save(settings) {
    await chrome.storage?.local.set({ [KEY]: settings });
  },
};

void boot({ debug: true, store: extensionStore });

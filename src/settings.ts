// Reader settings: one shape for every platform, stored through whatever the wrapper provides.

export type Theme = 'auto' | 'light' | 'sepia' | 'dark';
export type Font = 'serif' | 'sans' | 'legible';
export type Lang = 'id' | 'en';

export interface Settings {
  /** Text size step, 0 (smallest) to SIZE_STEPS - 1. */
  size: number;
  font: Font;
  theme: Theme;
  lang: Lang;
  /** Show the outlet's main photo above the article. */
  hero: boolean;
  /** Open the clean view as soon as an article loads; off = only via the floating Sapu button. */
  autoOpen: boolean;
  /** Show the "N distractions swept · merged pages · original link" line at the end. */
  sweepLine: boolean;
  /** Once a day, fetch update.json and the latest site rules from the release channel. */
  updates: boolean;
}

export const SIZE_STEPS = 5;

export const DEFAULT_SETTINGS: Settings = {
  size: 2,
  font: 'serif',
  theme: 'auto',
  lang: 'id',
  hero: true,
  autoOpen: true,
  sweepLine: true,
  updates: true,
};

/** Storage adapter. Wrappers pick the most durable one they have (extension storage, else localStorage). */
export interface SettingsStore {
  load(): Promise<Partial<Settings> | undefined>;
  save(settings: Settings): Promise<void>;
}

const KEY = 'sapuberita:settings';

/** Best-effort store for the iOS Shortcut and the Android WebView: per-site, may be wiped by the browser. */
export const localStorageStore: SettingsStore = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Partial<Settings>) : undefined;
    } catch {
      return undefined;
    }
  },
  async save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Private mode or quota: settings simply won't persist.
    }
  },
};

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Accept anything (old versions, hand-edited storage) and return a valid Settings object. */
export function normalizeSettings(raw: Partial<Settings> | undefined): Settings {
  const d = DEFAULT_SETTINGS;
  const r = raw ?? {};
  const size = Number.isInteger(r.size) ? Math.min(SIZE_STEPS - 1, Math.max(0, r.size as number)) : d.size;
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  return {
    size,
    font: pick(r.font, ['serif', 'sans', 'legible'] as const, d.font),
    theme: pick(r.theme, ['auto', 'light', 'sepia', 'dark'] as const, d.theme),
    lang: pick(r.lang, ['id', 'en'] as const, d.lang),
    hero: bool(r.hero, d.hero),
    autoOpen: bool(r.autoOpen, d.autoOpen),
    sweepLine: bool(r.sweepLine, d.sweepLine),
    updates: bool(r.updates, d.updates),
  };
}

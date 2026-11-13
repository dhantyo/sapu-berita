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
  /** Links inside the article are clickable; off = they read as plain text. */
  links: boolean;
  /** Editors' summary boxes (Ringkasan Berita, Executive Brief) are shown. */
  summaries: boolean;
  /** Quoted social posts play in the article (official embeds); off = a card with a link. */
  embeds: boolean;
}

export const SIZE_STEPS = 5;

export const DEFAULT_SETTINGS: Settings = {
  size: 2,
  font: 'sans',
  theme: 'auto',
  lang: 'id',
  hero: true,
  autoOpen: true,
  sweepLine: true,
  updates: true,
  links: true,
  summaries: true,
  embeds: true,
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

/**
 * The bookmark's store: localStorage belongs to one subdomain (news.detik.com and hot.detik.com each start
 * from the defaults), so settings are also kept in a cookie on the outlet's main domain, which every
 * subdomain shares. The cookie wins when both exist: it holds the latest change made anywhere on the outlet.
 * Different outlets can't share anything: browsers keep each site's storage apart.
 */
export function outletStore(domain: string | undefined, doc: Document = document): SettingsStore {
  const name = 'sapuberita';
  const readCookie = (): Partial<Settings> | undefined => {
    try {
      const raw = doc.cookie.split('; ').find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
      return raw ? (JSON.parse(decodeURIComponent(raw)) as Partial<Settings>) : undefined;
    } catch {
      return undefined;
    }
  };
  const writeCookie = (settings: Partial<Settings>) => {
    if (!domain) return;
    try {
      // 400 days is the longest browsers keep a cookie; Safari caps script-set cookies at 7 days,
      // so it is rewritten every time the reader opens.
      const secure = doc.location?.protocol === 'https:' ? '; Secure' : '';
      doc.cookie = `${name}=${encodeURIComponent(JSON.stringify(settings))}; Domain=${domain}; Path=/; Max-Age=34560000; SameSite=Lax${secure}`;
    } catch {
      // Cookies blocked: the per-subdomain copy still works.
    }
  };
  return {
    async load() {
      const settings = (domain && readCookie()) || (await localStorageStore.load());
      if (settings) writeCookie(settings); // renew, and share settings saved before this existed
      return settings;
    },
    async save(settings) {
      await localStorageStore.save(settings);
      writeCookie(settings);
    },
  };
}

/** The outlet's main domain for a host, from the site rules (shortest listed domain the host belongs to). */
export function outletDomain(host: string, siteDomains: string[]): string | undefined {
  return siteDomains
    .filter((d) => host === d || host.endsWith(`.${d}`))
    .sort((a, b) => a.length - b.length)[0];
}

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
    font: pick(r.font, ['sans', 'serif', 'legible'] as const, d.font),
    theme: pick(r.theme, ['auto', 'light', 'sepia', 'dark'] as const, d.theme),
    lang: pick(r.lang, ['id', 'en'] as const, d.lang),
    hero: bool(r.hero, d.hero),
    autoOpen: bool(r.autoOpen, d.autoOpen),
    sweepLine: bool(r.sweepLine, d.sweepLine),
    updates: bool(r.updates, d.updates),
    links: bool(r.links, d.links),
    summaries: bool(r.summaries, d.summaries),
    embeds: bool(r.embeds, d.embeds),
  };
}

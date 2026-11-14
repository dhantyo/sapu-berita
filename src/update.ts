/**
 * "Is there a newer Sapu Berita?" One small JSON file (update.json), published with every release next to
 * the site rules, is fetched at most once a day. No identifiers are sent; the reader can turn it off.
 *
 *   { "version": "0.1.0-beta.2", "notes": "https://…/releases/tag/v0.1.0-beta.2",
 *     "android": "https://…/sapu-berita-0.1.0-beta.2.apk", "extension": "https://…/releases/tag/…",
 *     "apple": "https://…/docs/install-apple.md", "report": "https://…?url={url}&…" }
 */

export type Platform = 'android' | 'apple' | 'extension' | 'web';

export interface UpdateManifest {
  version: string;
  notes?: string;
  android?: string;
  extension?: string;
  apple?: string;
  /** Overrides the built-in report link template (e.g. a form that needs no account). */
  report?: string;
}

export interface UpdateOffer {
  version: string;
  /** Where the reader goes to update on this platform. */
  url: string;
}

const CACHE_KEY = 'sapuberita:update';
const CHECK_EVERY_MS = 24 * 60 * 60 * 1000;

interface Cached {
  checkedAt: number;
  manifest: UpdateManifest;
}

/**
 * The release manifest, fetched at most once a day (cached copy otherwise). Null when offline and
 * never fetched, or when no channel is configured (local builds).
 */
export async function latestManifest(channelUrl: string | undefined): Promise<UpdateManifest | null> {
  const cached = readCache();
  if (!channelUrl || (cached && Date.now() - cached.checkedAt < CHECK_EVERY_MS)) return cached?.manifest ?? null;
  return (await refresh(channelUrl)) ?? cached?.manifest ?? null;
}

/** The cached manifest, without touching the network. */
export function cachedManifest(): UpdateManifest | null {
  return readCache()?.manifest ?? null;
}

async function refresh(channelUrl: string): Promise<UpdateManifest | null> {
  try {
    const res = await fetch(new URL('update.json', channelUrl).href, { cache: 'no-cache' });
    if (!res.ok) return null;
    const manifest = (await res.json()) as UpdateManifest;
    if (typeof manifest.version !== 'string') return null;
    writeCache({ checkedAt: Date.now(), manifest });
    return manifest;
  } catch {
    return null; // offline, blocked or rate-limited: try again another day
  }
}

/** An update worth showing on this platform, or null. */
export function offerFor(manifest: UpdateManifest | null, current: string, platform: Platform): UpdateOffer | null {
  if (!manifest || !parse(current) || compareVersions(manifest.version, current) <= 0) return null;
  const url = platform === 'web' ? manifest.notes : manifest[platform] ?? manifest.notes;
  return url ? { version: manifest.version, url } : null;
}

/**
 * Semver order: 0.1.0-beta.1 < 0.1.0-beta.2 < 0.1.0 < 0.1.1. Unparseable input sorts lowest, so a
 * broken manifest never nags anyone. "dev" (local builds) is never offered an update.
 */
export function compareVersions(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  for (let i = 0; i < 3; i++) if (pa.core[i] !== pb.core[i]) return pa.core[i]! - pb.core[i]!;
  if (!pa.pre.length || !pb.pre.length) return pa.pre.length ? -1 : pb.pre.length ? 1 : 0;
  for (let i = 0; i < Math.max(pa.pre.length, pb.pre.length); i++) {
    const x = pa.pre[i];
    const y = pb.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    const nx = /^\d+$/.test(x) ? Number(x) : NaN;
    const ny = /^\d+$/.test(y) ? Number(y) : NaN;
    if (!isNaN(nx) && !isNaN(ny)) return nx - ny;
    if (!isNaN(nx)) return -1;
    if (!isNaN(ny)) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

function parse(v: string): { core: number[]; pre: string[] } | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v.trim());
  return m ? { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split('.') : [] } : null;
}

/** Fill a report link template. Placeholders: {url} {title} {site} {version} {platform} {note}. */
export function reportLink(template: string, fields: Record<'url' | 'title' | 'site' | 'version' | 'platform', string> & { note?: string }): string {
  return template.replace(/\{(url|title|site|version|platform|note)\}/g, (_, k: keyof typeof fields) => encodeURIComponent(fields[k] ?? ''));
}

const SNOOZE_KEY = 'sapuberita:update-snoozed';
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/** "Not now": don't show this version again for three days (on this site; storage is per site on iOS). */
export function snoozeOffer(version: string): void {
  try {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify({ version, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function isSnoozed(version: string): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? 'null') as { version: string; at: number } | null;
    return !!s && s.version === version && Date.now() - s.at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(value: Cached): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or quota: we'll just check again next time.
  }
}

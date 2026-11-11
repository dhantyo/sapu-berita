import type { RuleSet } from '../types.ts';

const CACHE_KEY = 'bacabersih:rules';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface Cached {
  fetchedAt: number;
  rules: RuleSet;
}

/**
 * Returns the newest rules available *right now* without waiting on the network:
 * cached remote rules if newer than the bundled copy, else the bundled copy.
 * Then refreshes the cache in the background for next time.
 *
 * Storage is best-effort: Shortcuts/WebViews may block or wipe it.
 */
export function loadRules(bundled: RuleSet, remoteUrl?: string): RuleSet {
  const cached = readCache();
  const best = cached && cached.rules.version > bundled.version ? cached.rules : bundled;
  if (remoteUrl) refreshRulesIfStale(remoteUrl);
  return best;
}

/** Refresh the cached remote rules if they are more than a day old (call once settings allow it). */
export function refreshRulesIfStale(remoteUrl: string): void {
  const cached = readCache();
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) void refresh(remoteUrl);
}

async function refresh(remoteUrl: string): Promise<void> {
  try {
    const res = await fetch(remoteUrl, { cache: 'no-cache' });
    if (!res.ok) return;
    const rules = (await res.json()) as RuleSet;
    if (typeof rules.version !== 'number' || !Array.isArray(rules.sites)) return;
    writeCache({ fetchedAt: Date.now(), rules });
  } catch {
    // Offline, CSP-blocked or rate-limited: keep using what we have.
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
    // Quota or privacy mode; ignore.
  }
}

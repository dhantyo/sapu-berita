// The install page's script must parse: one stray apostrophe in a translation ("Don't" inside a
// single-quoted string) stopped the whole page from responding (2026-11-14).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const html = readFileSync(join(import.meta.dirname, '..', 'site', 'index.html'), 'utf8');

describe('install page', () => {
  it('has inline scripts that parse', () => {
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
    expect(scripts.length).toBeGreaterThan(0);
    for (const code of scripts) expect(() => new Function(code)).not.toThrow();
  });
});

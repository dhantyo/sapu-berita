import { describe, expect, it } from 'vitest';
import { compareVersions, offerFor, reportLink } from '../src/update.ts';

describe('compareVersions', () => {
  it('orders releases and pre-releases like semver', () => {
    const order = ['0.1.0-alpha', '0.1.0-beta.1', '0.1.0-beta.2', '0.1.0-beta.10', '0.1.0', '0.1.1', '0.2.0', '1.0.0'];
    for (let i = 1; i < order.length; i++) {
      expect(compareVersions(order[i]!, order[i - 1]!)).toBeGreaterThan(0);
      expect(compareVersions(order[i - 1]!, order[i]!)).toBeLessThan(0);
    }
    expect(compareVersions('v0.1.0', '0.1.0')).toBe(0);
  });

  it('never ranks garbage above a real version', () => {
    expect(compareVersions('nonsense', '0.1.0')).toBeLessThan(0);
    expect(compareVersions('0.1.0', 'dev')).toBeGreaterThan(0);
  });
});

describe('offerFor', () => {
  const manifest = { version: '0.1.0-beta.2', notes: 'N', android: 'APK', apple: 'GUIDE', extension: 'ZIP' };

  it('offers the platform link when newer', () => {
    expect(offerFor(manifest, '0.1.0-beta.1', 'android')).toEqual({ version: '0.1.0-beta.2', url: 'APK' });
    expect(offerFor(manifest, '0.1.0-beta.1', 'apple')?.url).toBe('GUIDE');
    expect(offerFor({ version: '0.2.0', notes: 'N' }, '0.1.0', 'extension')?.url).toBe('N');
  });

  it('stays quiet when current, ahead, a local build, or the manifest is missing', () => {
    expect(offerFor(manifest, '0.1.0-beta.2', 'android')).toBeNull();
    expect(offerFor(manifest, '0.1.0', 'android')).toBeNull();
    expect(offerFor(null, '0.1.0', 'android')).toBeNull();
    expect(offerFor(manifest, 'dev', 'android')).toBeNull();
  });
});

describe('reportLink', () => {
  it('fills placeholders, URL-encoded', () => {
    expect(reportLink('https://x/new?url={url}&d={version}%20({platform})', {
      url: 'https://news.detik.com/a?b=1&c=2', title: 'T', site: 'detik.com', version: '0.1.0-beta.1', platform: 'android',
    })).toBe('https://x/new?url=https%3A%2F%2Fnews.detik.com%2Fa%3Fb%3D1%26c%3D2&d=0.1.0-beta.1%20(android)');
  });
});

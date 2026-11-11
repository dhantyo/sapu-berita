import { describe, expect, it } from 'vitest';
import { LOGO_SIZE, opticalHeight, recolourNeeds, type LogoAnalysis } from '../src/render/logo.ts';

const logo = (inkLuminance: number, badge = false, darkPart = inkLuminance, lightPart = inkLuminance): LogoAnalysis => ({
  naturalWidth: 300, naturalHeight: 60, box: { x: 0, y: 0, w: 300, h: 60 }, badge, inkLuminance, darkPart, lightPart,
});

// Ink luminances measured on the live logos (2026-11-11), converted to WCAG relative luminance.
describe('per-theme recolouring', () => {
  it('turns a white logo (Kompas) to ink on light grounds only', () => {
    expect(recolourNeeds(logo(1))).toEqual({ onLight: true, onDark: false });
  });
  it('turns a dark logo (Sriwijaya Post) white on the dark ground only', () => {
    expect(recolourNeeds(logo(0.015))).toEqual({ onLight: false, onDark: true });
  });
  it('leaves a mid-tone logo (Liputan6 orange) alone everywhere', () => {
    expect(recolourNeeds(logo(0.2))).toEqual({ onLight: false, onDark: false });
  });
  it('never recolours an opaque badge (CNN square)', () => {
    expect(recolourNeeds(logo(0.03, true))).toEqual({ onLight: false, onDark: false });
  });
});

describe('two-colour logos', () => {
  it('turns Tribunnews white on dark: its blue part would vanish even though the red part survives', () => {
    // median pulled up by red "news"; the darker 35% is the blue wordmark
    expect(recolourNeeds(logo(0.12, false, 0.06, 0.2)).onDark).toBe(true);
  });
});

describe('optical sizing', () => {
  it('gives long wordmarks less height than compact ones, within bounds', () => {
    const long = opticalHeight(6);
    const compact = opticalHeight(2.5);
    expect(long).toBeLessThan(compact);
    expect(long).toBeGreaterThanOrEqual(LOGO_SIZE.min);
    expect(compact).toBeLessThanOrEqual(LOGO_SIZE.max);
  });
  it('caps width for very long logos', () => {
    expect(opticalHeight(12) * 12).toBeLessThanOrEqual(LOGO_SIZE.maxWidth + 0.001);
  });
});

// The theme's skin.
//
// The setting already retints the reader per venue; a theme retints it per
// SEASON, on top. The rule that matters is the scoping one the setting skin
// established: a twist screen that brought its own identity must not have a
// season palette painted over it.
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { seasonConfig } from '../js/core.js';
import { THEME_LIST, BB_THEMES, themeAccent } from '../js/bb/themes.js';

// Mirrors the class computation in renderVPScreen so it can be tested without
// a full DOM render. Imported from vp-ui so the two cannot drift — and imported
// lazily because vp-ui.js calls window.matchMedia at module-eval time, which
// jsdom does not provide.
let applyThemeClass;
beforeAll(async () => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  }
  ({ applyThemeClass } = await import('../js/vp-ui.js'));
});

// The reader's stylesheet is a linked file, not inline in the shell — the
// venue skin lives here and the theme skin has to sit beside it.
const CSS_PATH = 'css/simulator.css';

describe('theme skin', () => {
  const _fmt = seasonConfig.format;
  const _theme = seasonConfig.theme;

  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
  });

  afterEach(() => {
    seasonConfig.format = _fmt;
    seasonConfig.theme = _theme;
  });

  it('has a CSS block for every registered theme', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    for (const id of THEME_LIST) {
      if (id === 'fixture' || id === 'voiced') continue;
      expect(css, `.rp-theme-${id} exists`).toContain(`.rp-theme-${id}`);
    }
  });

  it('scopes the theme palette to .rp-page like the setting skin does', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    const block = css.slice(css.indexOf('.rp-theme-summer-of-temptation'));
    expect(block.slice(0, 400)).toContain('.rp-page');
  });

  it('gives every animated theme layer a reduced-motion fallback', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    const block = css.slice(css.indexOf('/* ── VP: per-SEASON theme skin'));
    expect(block.slice(0, 2000)).toContain('prefers-reduced-motion');
  });

  it('applies the theme class to the reader root', () => {
    const content = { className: 'rp-set-bb-house' };
    const applied = applyThemeClass(content.className);
    expect(applied).toContain('rp-theme-summer-of-temptation');
    expect(applied).toContain('rp-set-bb-house');
  });

  it('strips a previous theme class rather than stacking them', () => {
    const applied = applyThemeClass('rp-set-bb-house rp-theme-old-thing');
    expect(applied).not.toContain('rp-theme-old-thing');
    expect(applied).toContain('rp-theme-summer-of-temptation');
  });

  it('adds no theme class to an unthemed season', () => {
    seasonConfig.theme = 'none';
    expect(applyThemeClass('rp-set-bb-house')).toBe('rp-set-bb-house');
  });

  it('leaves a Total Drama season unthemed even with a theme on the config', () => {
    seasonConfig.format = 'total-drama';
    expect(applyThemeClass('rp-set-hosted-camp')).toBe('rp-set-hosted-camp');
  });

  it('reports the theme accent for the reader to use', () => {
    expect(themeAccent()).toBe(BB_THEMES['summer-of-temptation'].palette.accent);
  });
});

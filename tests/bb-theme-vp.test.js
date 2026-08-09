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
const SECTION_START = '/* ── VP: per-SEASON theme skin';
const SECTION_END = '/* ── VP: Component classes ──';

/** Just the theme skin, so a `.rp-theme-` elsewhere in the file cannot mask a gap. */
function themeSection() {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const from = css.indexOf(SECTION_START);
  const to = css.indexOf(SECTION_END, from);
  expect(from, 'theme skin section not found').toBeGreaterThan(-1);
  expect(to, 'theme skin section is unterminated').toBeGreaterThan(from);
  return css.slice(from, to);
}

/**
 * (selector, body) pairs, descending into at-rules.
 *
 * Brace-aware rather than a split on `}`, because the section contains an
 * `@media` and a `@keyframes` whose inner rules are exactly the ones worth
 * checking.
 */
function cssRules(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open < 0) break;
    const prelude = src.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    let depth = 1, j = open + 1;
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
      j++;
    }
    const body = src.slice(open + 1, j - 1);
    if (prelude.startsWith('@')) out.push(...cssRules(body));
    else out.push({ selector: prelude, body });
    i = j;
  }
  return out;
}

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

  // The property that matters is not "the word .rp-page appears near the theme
  // block" — it is that NOTHING a theme paints escapes .rp-page, because a
  // twist screen brings its own visual identity and must keep it. A rule that
  // declares only custom properties is exempt: it hands down values and paints
  // nothing, which is how the palette line on the bare class works.
  it('paints nothing outside .rp-page', () => {
    let checked = 0;
    for (const rule of cssRules(themeSection())) {
      if (!rule.selector.includes('rp-theme-')) continue;
      const decls = rule.body.split(';').map(s => s.trim()).filter(Boolean);
      if (!decls.some(d => !d.startsWith('--'))) continue;   // custom props only
      checked++;
      expect(rule.selector, `${rule.selector} paints outside .rp-page`).toContain('.rp-page');
    }
    expect(checked, 'no painting theme rules found — the test is vacuous').toBeGreaterThan(0);
  });

  it('gives every animated theme layer a reduced-motion fallback', () => {
    expect(themeSection()).toContain('prefers-reduced-motion');
  });

  // The accent is written twice — once in the descriptor the engine reads, once
  // in the CSS the reader wears. Drift is silent and shows up as a reader
  // tinted a colour its own theme does not claim.
  it('paints each theme in the accent its descriptor claims', () => {
    const section = themeSection();
    for (const id of THEME_LIST) {
      if (id === 'fixture' || id === 'voiced') continue;
      const accent = BB_THEMES[id]?.palette?.accent;
      expect(accent, `${id} has no palette.accent`).toBeTruthy();
      const rule = new RegExp(`\\.rp-theme-${id}\\s*\\{([^}]*)\\}`).exec(section);
      expect(rule, `.rp-theme-${id} has no palette rule in the theme skin`).toBeTruthy();
      expect(rule[1].toLowerCase(), `.rp-theme-${id} does not use ${accent}`)
        .toContain(accent.toLowerCase());
    }
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

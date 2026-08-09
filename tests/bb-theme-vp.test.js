// The theme's skin.
//
// The setting already retints the reader per venue; a theme retints it per
// SEASON, on top. The rule that matters is the scoping one the setting skin
// established: a twist screen that brought its own identity must not have a
// season palette painted over it.
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { gs, seasonConfig, setGs } from '../js/core.js';
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
    // Comments come out of the BODY too, not just the prelude. A commented
    // declaration list splits on `;` into chunks that begin with `/*`, and a
    // caller asking "does this rule declare anything but custom properties?"
    // would count the comment as a painting declaration — which is how a
    // token-only block gets wrongly flagged as painting outside .rp-page.
    const body = src.slice(open + 1, j - 1).replace(/\/\*[\s\S]*?\*\//g, '');
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

// ── the token layer ────────────────────────────────────────────────────
//
// The weekly screens used to hard-code every colour, so a theme could not
// reach them and "themed season" meant one accent and a narrator card. They
// are drawn in `--bbx-*` tokens now, which is what lets a theme repaint the
// nomination ceremony, the veto meeting and the eviction without a single
// builder change.
//
// The failure mode this guards is quiet: a mistyped custom property is not an
// error, it just does nothing, and the screen keeps the default palette while
// the theme looks like it was applied.
describe('the weekly screens are drawn in tokens', () => {
  const css = fs.readFileSync('css/simulator.css', 'utf8');
  const declared = new Set(
    [...css.matchAll(/(--bbx-[a-z0-9-]+)\s*:/g)].map(m => m[1]));
  const rootBlock = css.slice(0, css.indexOf('}', css.indexOf(':root')));
  const rootTokens = new Set(
    [...rootBlock.matchAll(/(--bbx-[a-z0-9-]+)\s*:/g)].map(m => m[1]));

  // Two legitimate declaration sites, and the difference matters — see the
  // colour-form describe at the end of this file. What must hold is that every
  // token has a default OUTSIDE a theme block, so an unthemed reader is never
  // left undressed.
  it('gives every token a default, so an unthemed season is never undressed', () => {
    const formBlock = css.slice(css.indexOf('.rp-page {', css.indexOf('Colour forms of the weekly tokens')));
    const formTokens = new Set(
      [...formBlock.slice(0, formBlock.indexOf('}')).matchAll(/(--bbx-[a-z0-9-]+)\s*:/g)].map(m => m[1]));
    expect(rootTokens.size).toBeGreaterThan(10);
    for (const t of declared) {
      expect(rootTokens.has(t) || formTokens.has(t), `${t} has a default outside a theme`).toBe(true);
    }
  });

  it('never references a token that was never declared', () => {
    const used = new Set([...css.matchAll(/var\((--bbx-[a-z0-9-]+)/g)].map(m => m[1]));
    expect(used.size).toBeGreaterThan(10);
    for (const t of used) expect(declared, `${t} is declared`).toContain(t);
  });

  it('leaves no hard-coded accent behind in the weekly families', () => {
    // The six values the tokens replaced. A raw one reappearing means an edit
    // put a colour somewhere a theme cannot reach.
    const GONE = ['#f85149', '#f0a500', '#e3b341', '#3fb950', '#58a6ff', '#8b949e'];
    const offenders = [];
    for (const line of css.split('\n')) {
      if (!/\.(bbns|bbvc|bbev|bbct|bbop)\b/.test(line)) continue;
      for (const hex of GONE) {
        if (line.toLowerCase().includes(hex)) offenders.push(`${hex} in ${line.trim().slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('overrides only real tokens in the theme block, so no typo is silent', () => {
    const block = css.slice(css.indexOf('--- The Den, at rest'.replace('--- ','')) >= 0
      ? css.indexOf('.rp-theme-summer-of-temptation {', css.indexOf('The Den, at rest'))
      : css.indexOf('.rp-theme-summer-of-temptation {'));
    const set = [...block.slice(0, block.indexOf('}')).matchAll(/(--bbx-[a-z0-9-]+)\s*:/g)].map(m => m[1]);
    expect(set.length).toBeGreaterThan(8);
    for (const t of set) expect(rootTokens, `${t} is a real token`).toContain(t);
  });
});

describe('a mood is visible, not just audible', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    setGs({ bb: { weeks: [], theme: { id: 'summer-of-temptation', mood: 'neutral', booked: [], said: [] } } });
  });

  it('says nothing on the root while the season is still calm', () => {
    expect(applyThemeClass('rp-set-bb-house')).not.toContain('is-mood');
  });

  it('marks the reader when the theme turns', () => {
    gs.bb.theme.mood = 'hostile';
    expect(applyThemeClass('rp-set-bb-house')).toContain('is-mood-hostile');
  });

  it('swaps the mood rather than stacking two of them', () => {
    gs.bb.theme.mood = 'hostile';
    const applied = applyThemeClass('rp-set-bb-house is-mood-neutral');
    expect(applied).toContain('is-mood-hostile');
    expect(applied).not.toContain('is-mood-neutral');
  });

  // Both halves have to go, and the INSTALLED theme is the one that decides.
  // Pointing the picker at 'none' mid-season is deliberately a no-op — the
  // season keeps what it installed — so the reader is only undressed once the
  // installed state is gone too.
  it('keeps dressing a season whose picker changed but whose install did not', () => {
    seasonConfig.theme = 'none';
    gs.bb.theme.mood = 'hostile';
    expect(applyThemeClass('rp-set-bb-house')).toContain('rp-theme-summer-of-temptation');
  });

  it('drops the mood with the theme once nothing is installed', () => {
    seasonConfig.theme = 'none';
    setGs({ bb: { weeks: [] } });
    expect(applyThemeClass('rp-set-bb-house is-mood-hostile')).toBe('rp-set-bb-house');
  });

  it('has a stylesheet block behind the class, not just a class', () => {
    const css = fs.readFileSync('css/simulator.css', 'utf8');
    expect(css).toContain('.rp-theme-summer-of-temptation.is-mood-hostile');
  });
});

// The mood belongs to the WEEK, not to the save file.
//
// Found by playing a season in the browser and opening episode 2 after the Den
// had already escalated: the reader wore the escalated room, so the turn looked
// like it had happened four weeks before it did. Nothing in the suite could see
// it, because every test built one episode at one mood.
describe('replaying an early week shows the room as it was', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    setGs({ bb: { weeks: [], theme: { id: 'summer-of-temptation', mood: 'hostile', booked: [], said: [] } } });
  });

  it('dresses a calm episode calmly even when the season has since turned', () => {
    expect(applyThemeClass('rp-set-bb-house', 'neutral')).not.toContain('is-mood');
  });

  it('dresses the escalated episode as escalated', () => {
    expect(applyThemeClass('rp-set-bb-house', 'hostile')).toContain('is-mood-hostile');
  });

  it('falls back to live state for an episode saved before the mood was recorded', () => {
    expect(applyThemeClass('rp-set-bb-house')).toContain('is-mood-hostile');
  });

  it('records the mood on the episode so the reader has something to read', async () => {
    const { weekToEpisode } = await import('../js/bb-run.js');
    const ep = weekToEpisode({ num: 2, acts: [], themeMood: 'neutral' });
    expect(ep.themeMood).toBe('neutral');
  });
});

// Where a token is DECLARED decides whether a theme can move it.
//
// `--bbx-danger: rgb(var(--bbx-danger-rgb))` looks like it belongs beside the
// triplets in :root. Put it there and it silently stops working: a custom
// property's value is computed where it is declared, so the inner var()
// resolves against :root and bakes in the default before a theme on
// #vp-screen-content is ever consulted. The stylesheet would retint and every
// inline `style="color:…"` in the builders would stay on the old palette —
// which is exactly the bug this test was written after.
describe('the colour-form tokens are declared where a theme can reach them', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const COLOUR_FORMS = ['--bbx-danger', '--bbx-note', '--bbx-key', '--bbx-good', '--bbx-info', '--bbx-dim'];
  const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));

  it('never declares a colour form in :root, where it would bake in the default', () => {
    for (const t of COLOUR_FORMS) {
      expect(rootBlock, `${t} must not be declared in :root`).not.toContain(`${t}:`);
    }
  });

  it('declares every colour form below the theme class, on .rp-page', () => {
    const block = css.slice(css.indexOf('.rp-page {', css.indexOf('Colour forms of the weekly tokens')));
    const body = block.slice(0, block.indexOf('}'));
    for (const t of COLOUR_FORMS) {
      expect(body, `${t} is declared on .rp-page`).toContain(`${t}:`);
    }
  });

  it('keeps every triplet in :root, so an unthemed reader still has a palette', () => {
    for (const t of COLOUR_FORMS) {
      expect(rootBlock, `${t}-rgb has a :root default`).toContain(`${t}-rgb:`);
    }
  });
});

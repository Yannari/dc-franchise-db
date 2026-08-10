// A season number stopped being an identity the day a second show existed.
//
// Every stored key on current-season.html was `NAME_s<number>` — episodes,
// summaries, analytics, the event ledger, the story bible, the franchise
// context — so Big Brother 14 opened Total Drama 14's data. Worse, publishing
// it matched the seasons_database row on `seasonNumber` alone and OVERWROTE
// Total Drama 14, and the delete sweep filtered on `_s14_`, which is a
// substring of exactly the other show's keys.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, DEFAULT_FORMAT, seasonId } from '../js/shows.js';

const html = readFileSync('current-season.html', 'utf8');

/** Lift the page's own key builder out and run it. */
function keyBuilder() {
  const body = html.match(/const CS_SHOWS[\s\S]*?function _csGet/)[0].replace(/function _csGet$/, '');
  const prev = { d: globalThis.document, l: globalThis.localStorage, w: globalThis.window };
  globalThis.document = { getElementById: () => null };
  globalThis.localStorage = { getItem: () => null };
  globalThis.window = {};
  try {
    return new Function(`${body}\n return { _sKey };`)()._sKey;
  } finally {
    globalThis.document = prev.d; globalThis.localStorage = prev.l; globalThis.window = prev.w;
  }
}

describe('a season is a show and a number', () => {
  it('leaves every Total Drama key exactly where it already is', () => {
    // The rule js/shows.js declares permanent for every URL on the site: a bare
    // integer is Total Drama. Which means no migration at all — the legacy key
    // IS the Total Drama key, and always was.
    const _sKey = keyBuilder();
    expect(_sKey('SIMULATOR_EPISODE', 14, 'total-drama')).toBe('SIMULATOR_EPISODE_s14');
    expect(_sKey('AI_ANALYTICS', 14, 'total-drama')).toBe('AI_ANALYTICS_s14');
    expect(_sKey('STORY_BIBLE', 3, DEFAULT_FORMAT)).toBe('STORY_BIBLE_s3');
  });

  it('gives every other show its own bucket', () => {
    const _sKey = keyBuilder();
    expect(_sKey('SIMULATOR_EPISODE', 14, 'big-brother')).toBe('SIMULATOR_EPISODE_bb-14');
    expect(_sKey('AI_ANALYTICS', 14, 'big-brother'))
      .not.toBe(_sKey('AI_ANALYTICS', 14, 'total-drama'));
  });

  it('has no bare season key left in the page', () => {
    // The regression that matters: one missed call site is one panel still
    // reading the other show's data, and it would look like a partial fix.
    const bare = html.match(/`[A-Z_]+_s\$\{/g) || [];
    expect(bare, 'a stored key is still built from the season number alone').toEqual([]);
    expect((html.match(/_sKey\(/g) || []).length).toBeGreaterThan(20);
  });

  it('matches the seasons_database row on the show as well as the number', () => {
    expect(html, 'publishing one show still overwrites the other show’s row')
      .toMatch(/findIndex\(s =>\s*\n?\s*s\.seasonNumber === seasonData\.seasonNumber\s*\n?\s*&& \(s\.format \|\| CS_DEFAULT_FORMAT\) === _pubFormat\)/);
    // And stamps what it wrote, so it can never be ambiguous again.
    expect(html).toMatch(/format: _pubFormat,/);
    expect(html).toMatch(/seasonId: _pubFormat === CS_DEFAULT_FORMAT/);
  });

  it('refuses to sync a season from the other show', () => {
    // Sync WRITES, and every key it writes is built from the page's show while
    // every row comes from the simulator's season. With the simulator on Total
    // Drama and this page on Big Brother it filed a Total Drama season under
    // Big Brother 14, overwriting whatever was there, with no undo.
    expect(html).toMatch(/const payloadFormat = _payloadFormat\(payload\);/);
    expect(html).toMatch(/if \(payloadFormat !== pageFormat\)/);
    // And says so, instead of the generic "direct access is unavailable" that
    // would send you to import the same wrong season through the file picker.
    expect(html).toMatch(/err\.showMismatch = true;/);
    expect(html).toMatch(/if \(error\?\.showMismatch\) setStatus\(error\.message\);/);
  });

  it('can tell an unstamped Big Brother save by what is inside it', () => {
    // Saves stamp `format` now, but the ones already on disk do not — and a
    // Big Brother season is unmistakable from the inside.
    expect(html).toMatch(/if \(state\.bb \|\| payload\?\.bb\) return 'big-brother';/);
    // The simulator stamps it going forward.
    const save = readFileSync('js/savestate.js', 'utf8');
    expect(save, 'a save still cannot say which show it is').toMatch(/format: seasonFormat\(seasonConfig\)/);
  });

  it('uses the site-wide show switcher instead of adding a second control', () => {
    // There is already one, mounted by the header on every page. A second
    // dropdown for the same question is a second answer waiting to disagree.
    expect(html).not.toMatch(/id="aiShow"/);
    expect(html).toMatch(/import \{ currentShow, ALL \} from '\.\/js\/show-switcher\.js'/);
    expect(html).toMatch(/window\.addEventListener\('showchange'/);
  });

  it('reads the show list from shows.js rather than keeping a second one', () => {
    // The page carries a two-entry literal as a pre-module fallback only; the
    // module bridge replaces it. A third show must not need editing here.
    expect(html).toMatch(/import \{ SHOWS, DEFAULT_FORMAT, showName \} from '\.\/js\/shows\.js'/);
    expect(html).toMatch(/window\.__SHOWS/);
    expect(Object.keys(SHOWS)).toContain('big-brother');
  });

  it('agrees with the shared seasonId convention', () => {
    // `bb-14` here has to be the same `bb-14` the databases and URLs use.
    const _sKey = keyBuilder();
    expect(_sKey('X', 14, 'big-brother')).toBe(`X_${seasonId('big-brother', 14)}`);
  });
});

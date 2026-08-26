// The Traitors, as the registry sees it. Everything downstream of a show —
// filenames, storage keys, every sentence a screen generates about a season —
// comes from this entry, so it is worth asserting rather than assuming.
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, formatPrefix, showShort, showIcon, showAccent } from '../js/shows.js';
import { buildFranchiseMeta, setFranchiseLedger, activeSeasons }
  from '../js/franchise-meta.js';

describe('the traitors registry entry', () => {
  it('is registered with the prefix every filename depends on', () => {
    const tr = SHOWS['traitors'];
    expect(tr, 'no traitors entry in js/shows.js').toBeTruthy();
    expect(tr.prefix).toBe('tr');
    expect(tr.name).toBe('The Traitors');
    expect(tr.short).toBe('TR');
    expect(tr.emoji).toBeTruthy();
  });

  it('does not collide with another show on prefix or name', () => {
    const prefixes = Object.values(SHOWS).map(s => s.prefix);
    expect(new Set(prefixes).size, 'two shows share a prefix').toBe(prefixes.length);
    const names = Object.values(SHOWS).map(s => s.name);
    expect(new Set(names).size, 'two shows share a name').toBe(names.length);
  });

  it('speaks its own language, and never another show\'s', () => {
    const w = SHOWS['traitors'].words;
    expect(w.round).toBe('Episode');
    expect(w.exit).toBe('banished');
    expect(w.player).toBe('player');
    // The two words that shipped as bugs on the other shows.
    expect(w.exit).not.toBe('evicted');
    expect(w.exit).not.toBe('voted out');
    expect(w.player).not.toBe('houseguest');
    expect(w.player).not.toBe('contestant');
  });

  it('omits audienceAward rather than naming an award the format lacks', () => {
    expect('audienceAward' in SHOWS['traitors'].words).toBe(false);
  });

  it('declares an audience overlay, which tests/ratings.test.js requires', () => {
    const a = SHOWS['traitors'].audience;
    expect(a, 'no audience overlay — the show would rate as generic reality TV').toBeTruthy();
    // Must not be a copy of another show's, or the same week rates identically.
    expect(a).not.toEqual(SHOWS['big-brother'].audience);
    expect(a).not.toEqual(SHOWS['total-drama'].audience);
  });

  it('declares careerStats so a season rolls up into a career', () => {
    const cs = SHOWS['traitors'].careerStats;
    expect(Array.isArray(cs)).toBe(true);
    expect(cs.length).toBeGreaterThan(0);
    for (const row of cs) expect(row).toHaveLength(2);
  });

  it('takes its franchise history from the ledger, not a checkbox', () => {
    expect(SHOWS['traitors'].historyFromLedger).toBe(true);
    // The other two shows must NOT gain this behaviour.
    expect(SHOWS['total-drama'].historyFromLedger).toBeFalsy();
    expect(SHOWS['big-brother'].historyFromLedger).toBeFalsy();
  });
});

describe('identity lives only in the registry', () => {
  it('exposes every identity field a screen needs', () => {
    expect(formatPrefix('traitors')).toBe('tr');
    expect(showShort('traitors')).toBe('TR');
    expect(showIcon('traitors')).toBe(SHOWS['traitors'].emoji);
    expect(typeof showAccent('traitors')).toBe('string');
    // An unknown format must not throw, and must not silently be Total Drama.
    expect(() => showIcon('nope')).not.toThrow();
    expect(showIcon('nope')).not.toBe(SHOWS['total-drama'].emoji);
    expect(showShort('nope')).not.toBe(SHOWS['total-drama'].short);
  });

  // Each of these files held its own copy of the show list. Every one was a
  // place a third show could be forgotten, and none of them errored — they
  // described the new show as Total Drama.
  const COLLAPSED = [
    'player.html', 'js/wiki.js', 'js/wiki-view.js', 'season_ref.html',
    'current-season.html', 'compare.html', 'franchise.html', 'js/alumni.js',
  ];

  it.each(COLLAPSED)('%s holds no show list of its own', (file) => {
    // Repo-root-relative, the idiom the rest of tests/ uses: vitest runs from
    // the repo root, and import.meta.url does not survive its transform here.
    const src = readFileSync(file, 'utf8');
    // An object literal keyed by show slug is the shape being banned.
    expect(src, `${file} still maps show identity locally`)
      .not.toMatch(/['"]total-drama['"]\s*:/);
  });
});

describe('franchise history on a show where everyone has some', () => {
  // Two players with real ledger history; NEITHER is ticked as returning.
  const cast = [
    { name: 'Gwen',  isReturnee: false },
    { name: 'Owen',  isReturnee: false },
  ];

  // The ledger is module state reached through activeSeasons(), not a field on
  // gs — setFranchiseLedger is how the existing franchise-meta tests seed it.
  beforeEach(() => {
    setFranchiseLedger({ seasons: {} });
    activeSeasons()['3'] = { seasonName: 'Season 3', players: {
      Gwen: { placement: 1, winner: true, chalWins: 3, blindsidesAuthored: 2 },
      Owen: { placement: 2, finalist: true, chalWins: 1 },
    } };
  });

  it('gives a Traitors cast profiles without a single checkbox ticked', () => {
    const meta = buildFranchiseMeta(cast, { format: 'traitors' });
    expect(meta, 'no meta built — every prior is dead').toBeTruthy();
    expect(Object.keys(meta.profiles).sort()).toEqual(['Gwen', 'Owen']);
    expect(meta.profiles.Gwen.repScore).toBeGreaterThan(0);
  });

  it('does NOT change Total Drama, where the checkbox still means something', () => {
    expect(buildFranchiseMeta(cast, { format: 'total-drama' })).toBeNull();
  });

  it('does NOT change Big Brother either', () => {
    expect(buildFranchiseMeta(cast, { format: 'big-brother' })).toBeNull();
  });

  it('still skips a Traitors player with no history at all', () => {
    const meta = buildFranchiseMeta(
      [...cast, { name: 'Nobody', isReturnee: false }], { format: 'traitors' });
    expect(Object.keys(meta.profiles)).not.toContain('Nobody');
  });
});

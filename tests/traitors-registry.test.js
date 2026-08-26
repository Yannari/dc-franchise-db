// The Traitors, as the registry sees it. Everything downstream of a show —
// filenames, storage keys, every sentence a screen generates about a season —
// comes from this entry, so it is worth asserting rather than assuming.
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, formatPrefix, showShort, showIcon, showAccent, showWords } from '../js/shows.js';
import { buildFranchiseMeta, setFranchiseLedger, activeSeasons }
  from '../js/franchise-meta.js';
import { formatIsRunnable, seasonConfig } from '../js/core.js';
import { currentFormat } from '../js/social/session.js';
import { SHOWS as QS_SHOWS } from '../js/quick-setup.js';
import { initTraitorsState, prepTrForSave, repairTrSets } from '../js/tr/state.js';

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

  // Asserted through showWords(), which is what every caller actually reads.
  // The raw literal was asserted before and stayed green while the accessor
  // spread Total Drama's words underneath and returned 'Fan Favorite'.
  it('omits audienceAward rather than naming an award the format lacks', () => {
    expect('audienceAward' in SHOWS['traitors'].words).toBe(false);
    expect('audienceAward' in showWords('traitors')).toBe(false);
    expect(showWords('traitors').audienceAward).toBeUndefined();
    // The rest of the vocabulary still inherits — that is why a show can omit
    // a word and still get a readable one.
    expect(showWords('traitors').comp).toBe('mission');
    expect(showWords('traitors').show).toBe('The Traitors');
  });

  it('leaves the two shows that DO have an award holding theirs', () => {
    expect(showWords('total-drama').audienceAward).toBe('Fan Favorite');
    expect(showWords('big-brother').audienceAward).toBe("America's Favourite Houseguest");
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
    // The ledger read is gated on the engine actually running, so every
    // assertion below about profiles EXISTING has to say the engine is there.
    globalThis.window = globalThis.window || {};
    globalThis.window._trRunnable = true;
  });
  afterEach(() => { delete globalThis.window?._trRunnable; });

  // THE BUG: the show is selectable but not runnable, so a season stamped
  // 'traitors' is simulated by the Total Drama engine — and this read handed
  // that Total Drama season reputation, grudges and seeded bonds off the
  // ledger with no Returning checkbox ticked anywhere. The gate is runnability,
  // not a show name, so it lifts by itself the day the engine ships.
  it('reads no ledger while the engine that opted in cannot run', () => {
    delete globalThis.window._trRunnable;
    expect(buildFranchiseMeta(cast, { format: 'traitors' })).toBeNull();
  });

  it('reads the ledger the moment that engine can run', () => {
    globalThis.window._trRunnable = true;
    const meta = buildFranchiseMeta(cast, { format: 'traitors' });
    expect(Object.keys(meta.profiles).sort()).toEqual(['Gwen', 'Owen']);
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

describe('the show picker on the actual screen', () => {
  // configScopeFor('traitors') can be perfect while the show stays
  // unselectable: simulator.html's #cfg-format <select> is a hardcoded legacy
  // list, not generated from js/shows.js, and _cloneOptions() in
  // quick-setup.js mirrors THAT markup — so the registry can know about a
  // show a person can never pick. Assert against the registry's own keys,
  // never a literal list, or this test becomes the next place a fourth show
  // is silently forgotten.
  it('offers exactly one <option> per registered show', () => {
    const src = readFileSync('simulator.html', 'utf8');
    const selectMatch = src.match(/<select id="cfg-format"[^>]*>([\s\S]*?)<\/select>/);
    expect(selectMatch, 'no #cfg-format select found in simulator.html').toBeTruthy();
    const optionValues = [...selectMatch[1].matchAll(/<option value="([^"]+)"/g)]
      .map(m => m[1]);
    expect(new Set(optionValues)).toEqual(new Set(Object.keys(SHOWS)));
  });

  // The Quick Setup show cards were a NINTH hardcoded show list, missed by the
  // collapse, and already drifted: Big Brother's icon was a house there and a
  // camera in the registry. Derived from Object.keys(SHOWS) so a fourth show
  // cannot be forgotten, and asserted the same way for the same reason -- a
  // literal three-show list here would rebuild the defect one show later.
  it('renders one Quick Setup card per registered show, with registry identity', () => {
    expect(new Set(QS_SHOWS.map(s => s.id))).toEqual(new Set(Object.keys(SHOWS)));
    for (const card of QS_SHOWS) {
      expect(card.name, `${card.id} card name`).toBe(SHOWS[card.id].name);
      expect(card.icon, `${card.id} card icon`).toBe(SHOWS[card.id].emoji);
      // `tag` is this picker's own copy, not identity, but a blank card is a
      // show nobody can tell apart from the one above it.
      expect(card.tag, `${card.id} card has no tag`).toBeTruthy();
    }
  });
});

describe('a castle nobody can start yet', () => {
  afterEach(() => { delete globalThis.window?._trRunnable; });

  it('is not runnable while the engine is unbuilt', () => {
    expect(formatIsRunnable({ format: 'traitors' })).toBe(false);
  });

  it('becomes runnable only when the engine says so', () => {
    globalThis.window = globalThis.window || {};
    globalThis.window._trRunnable = true;
    expect(formatIsRunnable({ format: 'traitors' })).toBe(true);
  });

  it('leaves the other two shows alone', () => {
    expect(formatIsRunnable({ format: 'total-drama' })).toBe(true);
  });
});

describe('traitors state survives a round trip through JSON', () => {
  it('starts empty and well-formed', () => {
    const tr = initTraitorsState();
    expect(tr.alignment).toEqual({});
    expect(tr.roleHistory).toEqual([]);
    expect(tr.pot).toBe(0);
    expect(tr.threads).toEqual([]);
    expect(tr.conclaveTension).toEqual({});
  });

  it('restores Sets that JSON.stringify would have flattened', () => {
    const g = { tr: initTraitorsState() };
    g.tr.shieldedThisRound = new Set(['Gwen']);
    const revived = JSON.parse(JSON.stringify(prepTrForSave(g)));
    expect(Array.isArray(revived.tr.shieldedThisRound)).toBe(true);
    repairTrSets(revived);
    expect(revived.tr.shieldedThisRound instanceof Set).toBe(true);
    expect(revived.tr.shieldedThisRound.has('Gwen')).toBe(true);
  });

  it('repairTrSets is idempotent — safe to call twice, and safe on state that never had the Sets', () => {
    const g = { tr: initTraitorsState() };
    delete g.tr.shieldedThisRound; // simulate state that predates this field
    expect(() => repairTrSets(g)).not.toThrow();
    expect(g.tr.shieldedThisRound instanceof Set).toBe(true);
    // second call on already-repaired state must not throw or replace the Set
    const first = g.tr.shieldedThisRound;
    expect(() => repairTrSets(g)).not.toThrow();
    expect(g.tr.shieldedThisRound).toBe(first);
  });
});

describe('the social feed asks the registry which show it is', () => {
  const before = seasonConfig.format;
  afterEach(() => { seasonConfig.format = before; });

  // currentFormat() is the season's format for the ENTIRE Birdie/ChatAlumni
  // feed. It used to be `=== 'big-brother' ? 'big-brother' : 'total-drama'`,
  // which called a castle Total Drama and generated its whole feed in Total
  // Drama's words — the registry's own bug class, one level below the screens.
  it('does not call a third show Total Drama', () => {
    seasonConfig.format = 'traitors';
    expect(currentFormat()).toBe('traitors');
  });

  it('still answers exactly as before for the two shows that have engines', () => {
    seasonConfig.format = 'big-brother';
    expect(currentFormat()).toBe('big-brother');
    seasonConfig.format = 'total-drama';
    expect(currentFormat()).toBe('total-drama');
    // An unregistered or missing format is still Total Drama — the bare-integer
    // rule the whole site depends on.
    seasonConfig.format = 'nope';
    expect(currentFormat()).toBe('total-drama');
  });
});

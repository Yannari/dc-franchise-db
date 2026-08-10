// @vitest-environment jsdom
// A No Eviction week is still a week.
//
// Reported as "social doesn't work": the rebuild said *no episodes found for
// Big Brother* on a season whose first episode had just been played in full —
// move-in day, the twins, a Head of Household competition, the secret power
// competition, two rounds of house life.
//
// The week ran. It was simply never stored. `cancelEviction` returns early and
// both `gs.bb.weeks.push(week)` calls are below it, so the house's own week
// ledger stayed empty — and everything that reads it went blind.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { episodeRecords, ensureFeeds } from '../js/social/live.js';
import { extractEvents } from '../js/social/events.js';
import { readFileSync } from 'node:fs';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = twists;
}

describe('a week nobody was evicted in', () => {
  beforeEach(() => house());

  it('goes into the house’s week ledger like any other', () => {
    house([{ episode: 1, type: 'bb-no-eviction' }]);
    const ep = withSeededRandom(2026, () => simulateBBEpisode());
    expect(ep.acts.some(a => a.type === 'no-eviction'), 'the week was not a no-eviction week').toBe(true);
    expect(gs.bb.weeks.length, 'a No Eviction week was simulated and never stored').toBe(1);
    expect(gs.bb.weeks[0].num).toBe(1);
  });

  it('does not make the next week call itself week one as well', () => {
    // The number comes from `gs.bb.weeks.length + 1`, so an unstored week is
    // not merely missing — it hands its number to its successor.
    house([{ episode: 1, type: 'bb-no-eviction' }]);
    withSeededRandom(2026, () => { simulateBBEpisode(); simulateBBEpisode(); });
    expect(gs.bb.weeks.map(w => w.num)).toEqual([1, 2]);
  });

  it('is visible to the social feed, which is where this was noticed', () => {
    house([{ episode: 1, type: 'bb-no-eviction' }]);
    withSeededRandom(2026, () => simulateBBEpisode());
    expect(episodeRecords(gs, 'big-brother').length, 'the feed still cannot see the episode').toBe(1);
    const res = ensureFeeds(gs, { format: 'big-brother', season: 1, rebuild: true });
    expect(res.found).toBe(1);
    expect(res.built.length, 'the episode was found and still built nothing').toBe(1);
    expect(res.posts).toBeGreaterThan(0);
  });

  it('recovers a save that already lost the week, without replaying it', () => {
    // The push is fixed going forward. A season played BEFORE the fix still has
    // the hole, and a week that has already aired — move-in day, the twins, the
    // competition, two rounds of house life — is not something anybody should
    // have to play again to get back.
    house([{ episode: 1, type: 'bb-no-eviction' }]);
    withSeededRandom(2026, () => simulateBBEpisode());
    expect(gs.episodeHistory.length).toBe(1);

    // Exactly the damaged state: the episode happened, the ledger is empty.
    gs.bb.weeks = [];

    expect(episodeRecords(gs, 'big-brother').length,
      'the played week is unreachable and would have to be replayed').toBe(1);
    const res = ensureFeeds(gs, { format: 'big-brother', season: 1, rebuild: true });
    expect(res.found).toBe(1);
    expect(res.posts, 'recovered the episode but still built nothing').toBeGreaterThan(0);
  });

  it('does not double-count a week the ledger already has', () => {
    house([{ episode: 1, type: 'bb-no-eviction' }]);
    withSeededRandom(2026, () => simulateBBEpisode());
    // Stored AND in the history, which is the normal case after the fix.
    expect(gs.bb.weeks.length).toBe(1);
    expect(episodeRecords(gs, 'big-brother').map(r => r.episode)).toEqual([1]);
  });

  it('reacts to the rest of the week, not only the four spine facts', () => {
    // The feed read who won, who went up, whether the veto moved anybody and
    // who left. On a No Eviction week three of those are missing by design, so
    // a night with a twist announcement, a secret power competition, alliances
    // forming and a blow-up produced 2 events and about 19 posts — while the
    // record carried five acts and sixty-one social beats nothing read.
    house([{ episode: 1, type: 'bb-no-eviction' }, { episode: 1, type: 'bb-secret-power-comp' }]);
    withSeededRandom(2026, () => simulateBBEpisode());
    const rec = episodeRecords(gs, 'big-brother')[0];
    const ev = extractEvents(rec.record, { format: 'big-brother', season: 1, episode: 1 });
    const kinds = new Set(ev.map(e => e.kind));

    expect(kinds.has('twist'), 'a twist was announced and the audience never heard').toBe(true);
    expect(ev.length, 'the week is still being read as two facts').toBeGreaterThan(6);
    // And it turns into an actual feed rather than a handful of posts.
    const res = ensureFeeds(gs, { format: 'big-brother', season: 1, rebuild: true });
    expect(res.posts).toBeGreaterThan(60);
  });

  it('does not invent an alliance out of an alliance argument', () => {
    // Three hundred house events and a hundred and ninety-seven distinct badges
    // across a season: mapping them all by name guesses wrong constantly, and a
    // formation event fired for a row about a formation is a post about
    // something that did not happen. Only unambiguous signals are read.
    const src = readFileSync('js/social/events.js', 'utf8');
    expect(src).toMatch(/badge === 'ALLIANCE FORMED'/);
    expect(src, 'every alliance-ish event is being read as a formation')
      .not.toMatch(/id\.startsWith\('alliance-'\)/);
  });
});

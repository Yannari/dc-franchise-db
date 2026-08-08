// The night the season ends, and the one episode the audience never saw.
//
// A Big Brother finale is not a week. `simulateBBFinale` pushes it straight to
// `gs.episodeHistory` and never writes it to `gs.bb.weeks` — and `episodeRecords`
// read only the week ledger. So the episode everybody watches for, the jury vote
// and the half-million, was the single episode with no feed at all.
//
// And when it did get one it had nothing to say: only `prediction` and
// `legacy-take` fired on a finale, neither of which is about anybody WINNING, so
// the biggest night of the season produced posts arguing about where it ranked.
//
// The other half of this file is ORDER. The feed replays in timestamp order, so
// a reaction to the winner arriving before the jury has voted reads as a leak.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { extractEvents } from '../js/social/events.js';
import { episodeRecords, ensureFeeds } from '../js/social/live.js';
import { storeOf, postsForEpisode } from '../js/social/store.js';
import { TOPICS } from '../js/social/topics.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Gus', 'Iris', 'Wayne', 'Raj', 'Eli', 'Fern', 'Bowie', 'Kit',
  'Millie', 'Caleb', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

/** A whole season, played to a winner. */
function season() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
  for (let n = 0; n < 14; n++) if (!simulateBBEpisode()) break;
  return runBBFinale();
}

const slug = s => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

describe('the finale is an episode the feed can see', () => {
  it('is in the records even though it is not a week', () => {
    const fin = season();
    expect(fin, 'the finale never ran').toBeTruthy();
    expect(fin.winner).toBeTruthy();
    // The bug in one line: it is in the episode history and not in the ledger.
    expect(gs.bb.weeks.some(w => w.isFinale)).toBe(false);
    const recs = episodeRecords(gs, 'big-brother');
    const last = recs[recs.length - 1];
    expect(last.episode).toBe(fin.num);
    expect(last.record.isFinale).toBe(true);
    // Numbered in order, with nothing duplicated.
    const nums = recs.map(r => r.episode);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
  }, 200000);

  it('gets a feed like every other night', () => {
    const fin = season();
    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const recs = episodeRecords(gs, 'big-brother');
    const covered = new Set(storeOf(gs).posts.map(p => p.episode));
    const missing = recs.map(r => r.episode).filter(e => !covered.has(e));
    expect(missing, `episodes with no feed: ${missing.join(', ')}`).toEqual([]);
    expect(postsForEpisode(gs, fin.num).length).toBeGreaterThan(10);
  }, 200000);
});

describe('and it has something to say about it', () => {
  it('names the winner in the events', () => {
    const fin = season();
    const events = extractEvents(fin, { format: 'big-brother', season: 1, episode: fin.num });
    const finale = events.find(e => e.kind === 'finale');
    expect(finale, 'no finale event at all').toBeTruthy();
    // The whole point: a bare `finale` with no subject is a post about nobody.
    expect(finale.subject).toBe(slug(fin.winner));
    if (fin.runnerUp) expect(finale.actor).toBe(slug(fin.runnerUp));
  }, 200000);

  it('reads the last night in the order it happened', () => {
    // The last competition, then the cut at three, then the vote. A reaction to
    // the winner landing before the jury has voted reads as a leak.
    const fin = season();
    const events = extractEvents(fin, { format: 'big-brother', season: 1, episode: fin.num });
    const at = kind => events.find(e => e.kind === kind)?.at ?? null;
    expect(events.map(e => e.at)).toEqual([...events.map(e => e.at)].sort((a, b) => a - b));
    if (at('comp-win') != null && at('eviction') != null) {
      expect(at('comp-win')).toBeLessThan(at('eviction'));
    }
    if (at('eviction') != null) expect(at('eviction')).toBeLessThan(at('finale'));
  }, 200000);

  it('never stamps a post about somebody called [object Object]', () => {
    // America's Favourite is recorded as the whole result — winner, tally,
    // prize and reason — not as a name.
    const fin = season();
    const events = extractEvents(fin, { format: 'big-brother', season: 1, episode: fin.num });
    for (const e of events) {
      expect(String(e.subject ?? '')).not.toMatch(/object/);
      expect(String(e.actor ?? '')).not.toMatch(/object/);
    }
    if (fin.favourite?.winner && fin.favourite.winner !== fin.winner) {
      expect(events.some(e => e.subject === slug(fin.favourite.winner))).toBe(true);
    }
  }, 200000);

  it('has topics that are actually about winning', () => {
    const onFinale = TOPICS.filter(t => (t.triggers || []).includes('finale')).map(t => t.id);
    // `prediction` and `legacy-take` were the only two, and neither is about
    // anybody having just won.
    expect(onFinale).toContain('crowned');
    expect(onFinale).toContain('robbed');
    expect(onFinale).toContain('jury-verdict');
  });

  it('puts the winner in the posts', () => {
    const fin = season();
    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const posts = postsForEpisode(gs, fin.num);
    const named = posts.filter(p => (p.text || '').includes(fin.winner));
    expect(named.length, `not one of ${posts.length} finale posts named ${fin.winner}`)
      .toBeGreaterThan(0);
    // And the night ends on the vote rather than on generic season chatter.
    const order = posts.map(p => p.at);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const lastFew = posts.slice(-8).map(p => p.topic);
    expect(lastFew.some(t => ['crowned', 'robbed', 'jury-verdict', 'legacy-take', 'prediction'].includes(t)))
      .toBe(true);
  }, 200000);
});

describe('every other night still works', () => {
  it('leaves no ordinary episode without a feed', () => {
    season();
    const res = ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const recs = episodeRecords(gs, 'big-brother');
    expect(res.built.length).toBe(recs.length);
    for (const { record, episode } of recs) {
      const events = extractEvents(record, { format: 'big-brother', season: 1, episode });
      expect(events.length, `episode ${episode} produced no events`).toBeGreaterThan(0);
      const posts = postsForEpisode(gs, episode);
      expect(posts.length, `episode ${episode} has no posts`).toBeGreaterThan(0);
      // Ordered within the episode, always.
      const ats = posts.map(p => p.at);
      expect(ats, `episode ${episode} is out of order`).toEqual([...ats].sort((a, b) => a - b));
    }
  }, 200000);

  it('is idempotent, so refreshing costs nothing', () => {
    season();
    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const before = storeOf(gs).posts.length;
    const again = ensureFeeds(gs, { format: 'big-brother', season: 1 });
    expect(again.built).toEqual([]);
    expect(storeOf(gs).posts.length).toBe(before);
  }, 200000);
});

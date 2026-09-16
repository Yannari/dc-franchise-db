// ══════════════════════════════════════════════════════════════════════
// tr-social-feed.test.js — the castle's fandom, off real seasons
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors used to reach the feed through Total Drama's reader: a night
// with a murder, a Faithful banished on nothing and a recruitment in it came
// out as "eviction" and "episode aired", and the room argued about blindsides
// and jury votes. The pack (js/social/packs/traitors.js) reads the castle's own
// night. These guards run it on seasons the engine actually played, because a
// reader tested against a hand-written row reads the hand-written row.
//
// THREE PATHS BUILD A FEED and they have to agree: a season being played reads
// `gs.episodeHistory`, a published one reads its `votingHistory`, and the
// stored-posts path reuses the archive's events. The agreement arm below is
// the one that catches a fact only one of them can see.
import { describe, expect, it } from 'vitest';
import { gs as liveGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { buildTraitorsSeasonDocument } from '../js/tr/export.js';
import { extractEvents } from '../js/social/events.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { buildChatMessages } from '../js/social/chat.js';
import { episodesOf, eventsForEpisode, archiveEpisode } from '../js/social/archive.js';
import { episodeRecords, feedSeed } from '../js/social/live.js';
import { packFor } from '../js/social/packs/index.js';
import { TOPICS } from '../js/social/topics.js';
import { TRAITORS_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import roster from '../franchise_roster.json';

const F = TRAITORS_FORMAT;
const pack = packFor(F);
const NATIVE = new Set(Object.keys(pack.kinds));
const ROSTER = roster.players.slice(0, 20);

const SEASONS = [3, 7, 11, 19].map(seed => {
  setPlayers(ROSTER);
  const result = playTraitorsSeason({ cast: ROSTER.map(p => p.name), traitorCount: 3, seed });
  return { seed, state: liveGs, doc: buildTraitorsSeasonDocument(result, { seasonNumber: 1 }) };
});

const liveEvents = (state, rec) =>
  extractEvents(rec.record, { format: F, season: 1, episode: rec.episode }, pack.context(state));
const keyOf = e => `${e.kind}|${e.subject || ''}`;

const HOSTS = ['Deadpan and flat.', 'Theatrical, grand gestures.', 'Blunt, says it straight.',
  'Warm and kind.'].map((voice, i) => ({
  slug: `host-${i}`, name: `Host ${i}`, stars: 3, fameScore: 10, expertise: [], voice,
  native: false, wins: 0, bestPlacement: 5, seasonsPlayed: 1,
}));

describe('the castle reaches the feed as a castle', () => {
  it('reads every aired night, the first one included, and no unaired one', () => {
    for (const { state } of SEASONS) {
      const recs = episodeRecords(state, F);
      expect(recs.map(r => r.episode)).toEqual(state.episodeHistory.map(r => r.tr.ep ?? r.num));
      expect(recs[0].episode).toBe(1);
      const first = liveEvents(state, recs[0]);
      expect(first.some(e => NATIVE.has(e.kind)), 'night one produced nothing of its own').toBe(true);
      // Half a season aired: the feed sees half a season.
      const half = { ...state, episodeHistory: state.episodeHistory.slice(0, 3) };
      expect(episodeRecords(half, F).map(r => r.episode)).toEqual([1, 2, 3]);
    }
  });

  it('produces the castle\'s own moments across a few seasons', () => {
    const seen = new Set();
    for (const { state } of SEASONS) {
      for (const rec of episodeRecords(state, F)) for (const e of liveEvents(state, rec)) seen.add(e.kind);
    }
    for (const k of ['murder', 'mission-won', 'faithful-banished', 'traitor-caught', 'finale']) {
      expect(seen.has(k), `no "${k}" in four seasons`).toBe(true);
    }
    for (const k of ['blindside', 'nomination', 'comp-win', 'veto-used']) {
      expect(seen.has(k), `a castle produced a "${k}"`).toBe(false);
    }
  });

  it('knows the roles the way the audience does, and gets them right', () => {
    let checked = 0;
    for (const { state } of SEASONS) {
      for (const rec of episodeRecords(state, F)) {
        const truth = rec.record.tr?.table?.truth || {};
        for (const e of liveEvents(state, rec)) {
          const name = rec.record.eliminated;
          if (!name || !truth[name] || e.subject !== name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) continue;
          if (e.kind === 'faithful-banished') { expect(truth[name]).toBe('faithful'); checked++; }
          if (e.kind === 'traitor-caught') { expect(truth[name]).toBe('traitor'); checked++; }
        }
      }
    }
    expect(checked, 'no banishment was checked against the engine').toBeGreaterThan(8);
  });

  it('describes the same nights whether the season is played or published', () => {
    const diffs = [];
    for (const { seed, state, doc } of SEASONS) {
      const recs = episodeRecords(state, F);
      const last = recs[recs.length - 1].episode;
      for (const rec of recs) {
        if (rec.episode === last) continue;     // the finale row is built differently on each side
        const live = new Set(liveEvents(state, rec).filter(e => NATIVE.has(e.kind) && e.kind !== 'recruited').map(keyOf));
        const pub = new Set(eventsForEpisode(doc, F, 1, rec.episode)
          .filter(e => NATIVE.has(e.kind) && e.kind !== 'recruited').map(keyOf));
        const onlyLive = [...live].filter(k => !pub.has(k));
        const onlyPub = [...pub].filter(k => !live.has(k));
        if (onlyLive.length || onlyPub.length) {
          diffs.push(`seed ${seed} ep ${rec.episode}: live-only ${onlyLive.join(' ')} · published-only ${onlyPub.join(' ')}`);
        }
      }
    }
    expect(diffs).toEqual([]);
  });

  it('still names the reveal on a document published before roles were', () => {
    const { doc } = SEASONS[0];
    const old = { ...doc, roleHistory: [] };
    let found = 0;
    for (const { episode, record } of episodesOf(old, F)) {
      if (!record.eliminated || record.banishedWasTraitor == null) continue;
      const kinds = eventsForEpisode(old, F, 1, episode).map(e => e.kind);
      expect(kinds).toContain(record.banishedWasTraitor ? 'traitor-caught' : 'faithful-banished');
      found++;
    }
    expect(found).toBeGreaterThan(2);
  });

  it('the castle\'s own day reaches the fandom topics, not just the format', () => {
    /* The pack read the table, the night and the money, and nothing else — so
       every shared FANDOM topic (kindness noticed, the personality clash, the
       harassment defence) had one trigger available to it all season:
       `episode-aired`. The castle fires a dozen scenes a night and every one
       of them declares its own tone; they were being dropped on the way onto
       the row. */
    const kinds = new Set();
    const topics = new Set();
    for (const { state } of SEASONS) {
      for (const rec of episodeRecords(state, F)) {
        const events = liveEvents(state, rec);
        for (const e of events) kinds.add(e.kind);
        for (const p of buildEpisodeFeed(events, { seed: feedSeed(1, rec.episode) })) {
          topics.add(p.topic);
        }
      }
    }
    for (const k of ['kindness', 'argument']) {
      expect(kinds.has(k), `no "${k}" came off four seasons of castle scenes`).toBe(true);
    }
    // And the topics that could not fire before now do.
    const reachable = ['kindness-noticed', 'personality-clash', 'harassment-defence']
      .filter(t => topics.has(t));
    expect(reachable.length, `none of the day's topics fired: ${[...topics].join(', ')}`)
      .toBeGreaterThan(0);
  });

  it('every post, host line and comment speaks the castle, and no shared game topic is drawn', () => {
    const fandom = new Set(TOPICS.filter(t => t.layer === 'fandom').map(t => t.id));
    const mine = new Set(pack.topics.map(t => t.id));
    const bad = [];
    let posts = 0; let lines = 0;
    for (const { state, doc } of SEASONS) {
      for (const rec of episodeRecords(state, F)) {
        const events = liveEvents(state, rec);
        const feed = buildEpisodeFeed(events, { seed: feedSeed(1, rec.episode) });
        const archived = archiveEpisode(doc, F, 1, rec.episode).posts;
        for (const p of [...feed, ...archived]) {
          posts++;
          if (!fandom.has(p.topic) && !mine.has(p.topic)) bad.push(`topic ${p.topic}`);
          const foreign = foreignWordsIn(p.text, F);
          if (foreign.length) bad.push(`post ${p.topic}: ${foreign.join(',')} — ${p.text.slice(0, 90)}`);
        }
        const chat = buildChatMessages(events, HOSTS, { format: F, season: 1, episode: rec.episode,
          seed: rec.episode, crowd: feed.filter(p => p.stream === 'chat') });
        for (const m of chat) {
          lines++;
          for (const text of [m.text, ...(m.comments || []).map(c => c.text)]) {
            const foreign = foreignWordsIn(text, F);
            if (foreign.length) bad.push(`host ${m.kind}: ${foreign.join(',')} — ${text.slice(0, 90)}`);
          }
        }
      }
    }
    expect(posts, 'no posts were built').toBeGreaterThan(500);
    expect(lines, 'no host lines were built').toBeGreaterThan(50);
    expect(bad.slice(0, 25), `${bad.length} leaks`).toEqual([]);
  });
});

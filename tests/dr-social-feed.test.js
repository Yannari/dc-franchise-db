// ══════════════════════════════════════════════════════════════════════
// dr-social-feed.test.js — the runway's fandom, off real seasons
// ══════════════════════════════════════════════════════════════════════
//
// Drag Race reached the feed through kinds borrowed from shows decided by a
// vote: a lip sync win was a `domination`, the bottom two were `nomination`s,
// and every topic the room could draw was written about ballots, blindsides
// and jury verdicts — on a show where nobody votes at all. The pack
// (js/social/packs/drag-race.js) reads the night as a runway.
//
// THE CHART RULE IS GUARDED HERE. `BTM2` lip synced and survived; `LOW` was in
// the bottom and not up for elimination. The repo has shipped the collapse of
// those two twice, and on this side of the code it would read as a lip sync
// that never happened.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { extractEvents } from '../js/social/events.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { buildChatMessages } from '../js/social/chat.js';
import { eventsForEpisode, archiveEpisode } from '../js/social/archive.js';
import { episodeRecords, feedSeed } from '../js/social/live.js';
import { packFor } from '../js/social/packs/index.js';
import { TOPICS } from '../js/social/topics.js';
import { DRAG_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const F = DRAG_FORMAT;
const pack = packFor(F);
const NATIVE = new Set(Object.keys(pack.kinds));
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];

function cast(seed, n = 12) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen ${String.fromCharCode(65 + i)}`, slug: `queen-${i}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const SEASONS = [2, 5, 9].map(seed => {
  const season = playDragSeason({ cast: cast(seed), seed });
  const rows = season.rows;
  const state = { episodeHistory: rows, dr: { congeniality: season.congeniality || null } };
  return { seed, state, doc: buildDragSeasonDocument(rows, { seasonNumber: 1,
    congeniality: season.congeniality || null }) };
});

const liveEvents = (state, rec) =>
  extractEvents(rec.record, { format: F, season: 1, episode: rec.episode }, pack.context(state));
const keyOf = e => `${e.kind}|${e.subject || ''}`;

const HOSTS = ['Deadpan and flat.', 'Theatrical, grand gestures.', 'Blunt, says it straight.',
  'Warm and kind.'].map((voice, i) => ({
  slug: `host-${i}`, name: `Host ${i}`, stars: 3, fameScore: 10, expertise: [], voice,
  native: true, wins: 0, bestPlacement: 5, seasonsPlayed: 1,
}));

describe('the runway reaches the feed as a runway', () => {
  it('reads every aired episode', () => {
    for (const { state } of SEASONS) {
      const recs = episodeRecords(state, F);
      expect(recs.length).toBe(state.episodeHistory.length);
      expect(recs[0].episode).toBe(1);
    }
  });

  it('produces the show\'s own moments, and none from a vote show', () => {
    const seen = new Set();
    for (const { state } of SEASONS) {
      for (const rec of episodeRecords(state, F)) for (const e of liveEvents(state, rec)) seen.add(e.kind);
    }
    for (const k of ['maxi-win', 'bottom-two', 'lipsync-win', 'sashay', 'runway-category', 'finale']) {
      expect(seen.has(k), `no "${k}" in three seasons`).toBe(true);
    }
    for (const k of ['nomination', 'blindside', 'veto-used', 'domination']) {
      expect(seen.has(k), `a runway produced a "${k}"`).toBe(false);
    }
  });

  it('NEVER puts a LOW queen in the bottom two', () => {
    // The whole point of keeping BTM2 and LOW apart: a LOW queen did not lip
    // sync, and an event saying she did is a performance that never happened.
    let checkedLows = 0;
    for (const { state, doc } of SEASONS) {
      for (const rec of episodeRecords(state, F)) {
        const row = (doc.dr.episodes || []).find(e => e.episode === rec.episode);
        if (!row) continue;
        const lows = row.placements.filter(p => p.result === 'LOW').map(p => p.name);
        const btm2 = row.placements.filter(p => p.result === 'BTM2').map(p => p.name);
        checkedLows += lows.length;
        const inBottom = new Set(liveEvents(state, rec)
          .filter(e => e.kind === 'bottom-two').map(e => e.subject));
        for (const name of lows) {
          expect(inBottom.has(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
            `${name} was LOW and the feed says she lip synced`).toBe(false);
        }
        for (const name of btm2) {
          expect(inBottom.has(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
            `${name} was BTM2 and the feed never put her in the bottom two`).toBe(true);
        }
      }
    }
    expect(checkedLows, 'no LOW placement in three seasons — the arm is vacuous').toBeGreaterThan(3);
  });

  it('describes the same nights whether the season is played or published', () => {
    const diffs = [];
    for (const { seed, state, doc } of SEASONS) {
      const recs = episodeRecords(state, F);
      const last = recs[recs.length - 1].episode;
      for (const rec of recs) {
        if (rec.episode === last) continue;      // the finale is built from different halves
        const live = new Set(liveEvents(state, rec).filter(e => NATIVE.has(e.kind)).map(keyOf));
        const pub = new Set(eventsForEpisode(doc, F, 1, rec.episode)
          .filter(e => NATIVE.has(e.kind)).map(keyOf));
        const onlyLive = [...live].filter(k => !pub.has(k));
        const onlyPub = [...pub].filter(k => !live.has(k));
        if (onlyLive.length || onlyPub.length) {
          diffs.push(`seed ${seed} ep ${rec.episode}: live-only ${onlyLive.join(' ')} · published-only ${onlyPub.join(' ')}`);
        }
      }
    }
    expect(diffs).toEqual([]);
  });

  it('every post, host line and comment speaks the runway', () => {
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
    expect(posts, 'no posts were built').toBeGreaterThan(400);
    expect(lines, 'no host lines were built').toBeGreaterThan(40);
    expect(bad.slice(0, 25), `${bad.length} leaks`).toEqual([]);
  });
});

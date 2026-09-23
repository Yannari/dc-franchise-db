// ══════════════════════════════════════════════════════════════════════
// pm-social-feed.test.js — the villa's fandom, off real seasons (Plan 6)
// ══════════════════════════════════════════════════════════════════════
//
// The shared feed library is written for shows a room votes on: nominations,
// blindsides, a jury. The villa is decided by the public, and its fans talk
// about steals, Casa Amor and who is with whom. The pack
// (js/social/packs/perfect-match.js) reads a night as the villa.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { buildPerfectMatchSeasonDocument } from '../js/pm/export.js';
import { extractEvents } from '../js/social/events.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { eventsForEpisode } from '../js/social/archive.js';
import { episodeRecords, feedSeed } from '../js/social/live.js';
import { packFor } from '../js/social/packs/index.js';
import { PERFECT_MATCH_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const F = PERFECT_MATCH_FORMAT;
const pack = packFor(F);
const NATIVE = new Set(Object.keys(pack.kinds));

const SEASONS = [1, 2, 3].map(seed => {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows, winners } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  const state = { episodeHistory: rows, pmWinners: winners };
  return { seed, state, doc: buildPerfectMatchSeasonDocument(rows, { seasonNumber: 1 }) };
});
const liveEvents = (state, rec) => extractEvents(rec.record, { format: F, season: 1, episode: rec.episode }, pack.context(state));
const keyOf = e => `${e.kind}|${e.subject || ''}`;

describe('the villa reaches the feed as the villa', () => {
  it('reads every aired episode', () => {
    for (const { state } of SEASONS) {
      const recs = episodeRecords(state, F);
      expect(recs.length).toBe(state.episodeHistory.length);
      expect(recs[0].episode).toBe(1);
    }
  });
  it('produces the show\'s own moments, and none from a room-vote show', () => {
    const seen = new Set();
    for (const { state } of SEASONS) for (const rec of episodeRecords(state, F)) for (const e of liveEvents(state, rec)) seen.add(e.kind);
    for (const k of ['bombshell', 'dumped', 'casa-twist', 'casa-stick', 'bottom-couples', 'villa-challenge', 'finale']) {
      expect(seen.has(k), `no "${k}" in three seasons`).toBe(true);
    }
    for (const k of ['nomination', 'blindside', 'veto-used', 'domination']) {
      expect(seen.has(k), `a villa produced a "${k}"`).toBe(false);
    }
  });
  it('describes the same nights whether the season is played or published', () => {
    const diffs = [];
    for (const { seed, state, doc } of SEASONS) {
      const recs = episodeRecords(state, F);
      const last = recs[recs.length - 1].episode;
      for (const rec of recs) {
        if (rec.episode === last) continue;
        // Made-official is a scene the published record does not carry.
        const live = new Set(liveEvents(state, rec).filter(e => NATIVE.has(e.kind) && e.kind !== 'made-official').map(keyOf));
        const pub = new Set(eventsForEpisode(doc, F, 1, rec.episode).filter(e => NATIVE.has(e.kind)).map(keyOf));
        const onlyLive = [...live].filter(k => !pub.has(k)), onlyPub = [...pub].filter(k => !live.has(k));
        if (onlyLive.length || onlyPub.length) diffs.push(`seed ${seed} ep ${rec.episode}: live-only ${onlyLive.join(' ')} · published-only ${onlyPub.join(' ')}`);
      }
    }
    expect(diffs).toEqual([]);
  });
  it('the final names the winning couple and says the public decided it', () => {
    for (const { state } of SEASONS) {
      const recs = episodeRecords(state, F);
      const fin = liveEvents(state, recs.find(r => r.record.moment === 'final')).find(e => e.kind === 'finale');
      expect(fin.decidedBy).toBe('public');
      expect(fin.subjects.length).toBe(2);
    }
  });
  it('every post speaks the villa', () => {
    const bad = [];
    let posts = 0;
    for (const { state } of SEASONS) {
      for (const rec of episodeRecords(state, F)) {
        const feed = buildEpisodeFeed(liveEvents(state, rec), { seed: feedSeed(1, rec.episode) });
        for (const p of feed.posts || feed || []) {
          const text = p.text || p.body || '';
          if (!text) continue;
          posts++;
          const foreign = foreignWordsIn(String(text).toLowerCase(), F);
          if (foreign.length) bad.push(`ep ${rec.episode}: ${foreign.join(',')} — ${String(text).slice(0, 90)}`);
        }
      }
    }
    expect(posts).toBeGreaterThan(100);
    expect(bad).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// pm-dramagram-followers.test.js — the villa's own following reaches Dramagram
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-22: "the in-season follower should add to dramagram", and a
// villa season should pay by how many people watched it. Two things used to be
// missing on the way from a played season to a Dramagram profile: the export
// wrote no rating (so every villa season paid a flat 1x, however it rated) and
// nobody published the follower count the ledger kept all season.
//
// Walked end to end, the way the site does it: play, build the document, merge
// it into both databases, then ask Dramagram for every islander's history.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { buildPerfectMatchSeasonDocument } from '../js/pm/export.js';
import { followers } from '../js/pm/ledger.js';
import { mergePerfectMatchSeason, mergePerfectMatchSeasonsDatabase } from '../js/stats-export.js';
import { careersIn } from '../js/records.js';
import { followerHistory, FOLLOWERS } from '../js/dramagram.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function published(seed) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  const doc = buildPerfectMatchSeasonDocument(rows, { seasonNumber: 1 });
  const players = mergePerfectMatchSeason({ players: [] }, doc);
  // An empty database has no calendar to place a season after, and Dramagram
  // only counts a season that aired, so it is given a summer.
  const seasons = mergePerfectMatchSeasonsDatabase({ seasons: [] }, doc).seasons
    .map(x => ({ airYear: 2026, airSlot: 'summer', ...x }));
  return { rows, doc, names, careers: careersIn(players), seasons };
}

describe('a villa season in Dramagram', () => {
  const s = published(4);
  const reach = 0.6 + 0.72 * Math.max(0, Math.min(1, s.doc.ratings.score / 100));

  it('the document is rated by the villa reader', () => {
    expect(s.doc.ratings).toBeTruthy();
    expect(Number.isFinite(s.doc.ratings.score)).toBe(true);
    expect(s.doc.ratings.tier?.label).toBeTruthy();
    expect(s.doc.ratings.curve.length).toBe(s.rows.length);
    // …and the rating reaches the seasons database, where Dramagram reads it.
    expect(s.seasons[0].ratings.score).toBe(s.doc.ratings.score);
  });

  it('every islander carries the following the ledger kept, as the season ended', () => {
    const last = s.rows[s.rows.length - 1].pm;
    for (const p of s.doc.placements) {
      expect(p.pm.followers, p.name).toBe(followers({ approval: last.approval, fame: last.fame }, p.name));
      expect(p.pm.followers, p.name).toBeGreaterThan(0);
    }
  });

  it('Dramagram adds it on top of the debut, converted and scaled by viewership', () => {
    for (const p of s.doc.placements) {
      const h = followerHistory(p.playerSlug, { careers: s.careers, seasons: s.seasons });
      const step = h.steps.find(x => x.why === 'followed on air');
      expect(step, p.name).toBeTruthy();
      expect(step.delta).toBe(Math.round(p.pm.followers * FOLLOWERS.onAir * reach));
      // The debut is scaled by the same reach (no rating used to mean 1x).
      expect(h.steps.find(x => x.why === 'debut').delta).toBe(Math.round(FOLLOWERS.debut * reach));
    }
  });

  it('the best-followed islander gains more than the least, and both winners are paid', () => {
    const totals = s.doc.placements.map(p => ({ p, t: followerHistory(p.playerSlug, { careers: s.careers, seasons: s.seasons }).total }));
    const byFollow = [...totals].sort((a, b) => b.p.pm.followers - a.p.pm.followers);
    const nonFinal = byFollow.filter(x => x.p.placement > 3);
    expect(nonFinal[0].t).toBeGreaterThan(nonFinal[nonFinal.length - 1].t);
    for (const w of totals.filter(x => x.p.placement === 1)) {
      const won = followerHistory(w.p.playerSlug, { careers: s.careers, seasons: s.seasons }).steps.find(x => x.why === 'won');
      expect(won?.delta, w.p.name).toBe(Math.round(FOLLOWERS.win * reach));
    }
  });

  it('a season published before this (no following, no rating) pays exactly what it did', () => {
    const old = s.seasons.map(x => ({ ...x, ratings: undefined }));
    const careers = s.careers.map(c => ({ ...c, details: c.details.map(d => ({ ...d, pm: { ...d.pm, followers: undefined } })) }));
    const p = s.doc.placements.find(x => x.placement > 3);
    const h = followerHistory(p.playerSlug, { careers, seasons: old });
    expect(h.steps.find(x => x.why === 'followed on air')).toBeUndefined();
    expect(h.steps.find(x => x.why === 'debut').delta).toBe(FOLLOWERS.debut);
  });
});

// A drag season, synced to the site, in this show's words.
//
// Reported from the live page: "current-season sync doesn't work for drag
// race". Two separate faults, both the same shape as the Big Brother one in
// tests/bb-live-comp-counts.test.js — one show's vocabulary printed over
// another, which CLAUDE.md names as this project's first bug class.
//
//   1. `extractLiveSeasonSnapshot` branched two ways: Big Brother, or else
//      Total Drama. A drag season is neither, so it fell into Total Drama's
//      branch and was built from `_extractChallengeData` — which counts
//      `ep.immunityWinner`, `ep.rewardChalData` and `ep.chalMemberScores`,
//      none of which a drag night writes. Every queen published with
//      `challengeWins: 0`.
//
//   2. `_extractPlayerPlacements` collected eliminations from ten Total Drama
//      fields and not from `exits`, which is the only one the newer shows
//      write. So a nine-episode season published TWELVE queens all marked
//      "in" when four were left, and the site drew a full cast with nobody
//      sent home. That is the one that made it look broken rather than thin.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

async function playASeason(n = 12) {
  const core = await import('../js/core.js');
  const roster = JSON.parse(readFileSync(join(ROOT, 'franchise_roster.json'), 'utf8'));
  globalThis.FRANCHISE_ROSTER = Array.isArray(roster) ? roster : (roster.players || []);
  const cast = Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, 5])),
    drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
  }));
  core.setPlayers(cast);
  core.setGs({ episodeHistory: [], activePlayers: cast.map(p => p.name),
    eliminated: [], popularity: {}, phase: 'stage' });
  Object.assign(core.seasonConfig, { format: 'drag-race', drFinale: 'top4',
    seasonNumber: 1, twistSchedule: [], drSchedule: [], drSmackdown: false });
  globalThis.seasonConfig = core.seasonConfig;
  globalThis.seasonFormat = core.seasonFormat;
  globalThis.players = core.players;
  globalThis.gs = core.gs;
  const { simulateDragEpisode } = await import('../js/dr-run.js');
  let guard = 0;
  while (simulateDragEpisode() && guard++ < 20) { /* play it out */ }
  const { extractLiveSeasonSnapshot } = await import('../js/stats-export.js');
  return { snap: extractLiveSeasonSnapshot(), core };
}

describe('the live sync knows what show it is', () => {
  it('says who is still in, and agrees with the game', async () => {
    const { snap, core } = await playASeason();
    expect(snap.format, 'the snapshot did not say it was a drag season').toBe('drag-race');
    expect(snap.stillIn, 'the site would draw a cast with nobody eliminated')
      .toBe(core.gs.activePlayers.length);
    expect(snap.players.filter(p => p.status === 'out').length,
      'nobody was recorded as having left').toBeGreaterThan(0);
  }, 300000);

  it('counts a maxi win as a win', async () => {
    const { snap } = await playASeason();
    const winners = snap.players.filter(p => (p.challengeWins || 0) > 0);
    expect(winners.length, 'no queen won a maxi challenge all season').toBeGreaterThan(0);
    for (const p of winners) {
      expect(p.comps, `${p.name} has no comps block`).toBeTruthy();
      expect(p.comps.maxi, `${p.name}'s wins do not match her maxi count`)
        .toBe(p.challengeWins);
    }
    // The record's own words reach the page, so a standings table can show the
    // thing this show is actually scored on.
    expect(snap.players.some(p => (p.highs || 0) > 0 || (p.bottoms || 0) > 0),
      'not one HIGH or BTM2 in a whole season').toBe(true);
  }, 300000);
});

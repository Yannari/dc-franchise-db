// @vitest-environment jsdom
// Task 17 — a full season with coaches, run end to end and measured.
//
// Copies the bootstrap from tests/full-season-audit.test.js (headless season
// in vitest + jsdom) and adds a `coachesPerTribe` option that calls
// `addCoach` after the cast and tribes exist.
//
// IMPORTANT: coaches are added to `players` and to `gs.coaches` AFTER
// initGameState() runs, and are never given a `.tribe` property on their
// player record. `gs.tribes[i].members` is built once, at init, from the
// contestant cast only — a coach's player record is deliberately kept out of
// that grouping (js/coach-episode.js says outright: "Coaches are never in
// `tribe.members`"). Giving a coach a `.tribe` field before init would let
// them fall into `gs.tribes` and compete/vote like a contestant, which is
// exactly the bug this suite exists to catch.
import { describe, expect, it } from 'vitest';
import { runHeadlessSeason, episodeEliminated } from './helpers/coach-season.js';

describe('a season with coaches', () => {
  it('never lets a coach appear in a challenge result', async () => {
    // Once a coach survives to the merge, promoteCoaches() makes them a real
    // contestant — from that episode on they are SUPPOSED to compete. The
    // property under test is about coaches WHILE THEY ARE STILL COACHES, so
    // track promotions as they land and stop checking a name the moment it
    // graduates. (The brief's literal sample checked every coach for the
    // whole season, which would fail on any season where a coach survives to
    // merge — that is property 5 working, not a violation of property 1.)
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const stillCoach = new Set(season.coachNames);
    for (const ep of season.episodes) {
      // Promotion (if any) happens mid-episode, before that same episode's
      // challenge — so a coach promoted THIS episode is already a legitimate
      // competitor for it. Apply the promotion before checking.
      for (const p of (ep.coachPromotions || [])) stillCoach.delete(p.name);
      const scored = Object.keys(ep.chalMemberScores || {});
      for (const coach of stillCoach) {
        expect(scored, `${coach} competed in episode ${ep.num}`).not.toContain(coach);
      }
    }
  });

  it('never records a vote cast by a coach', async () => {
    // Same promotion carve-out as above: a promoted coach is a full player
    // and voting is exactly what they are now supposed to do.
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const stillCoach = new Set(season.coachNames);
    for (const ep of season.episodes) {
      for (const p of (ep.coachPromotions || [])) stillCoach.delete(p.name);
      for (const v of (ep.votingLog || [])) {
        if (v.voter === 'THE GAME') continue; // system-generated entries, not a ballot
        expect(stillCoach.has(v.voter), `${v.voter} cast a ballot`).toBe(false);
      }
    }
  });

  it('lets a coach be voted out', async () => {
    // "Voted out" means voted out AS A COACH — before promotion, while they
    // still fit the twist's own definition (never compete, never vote, can
    // be voted off directly). A promoted coach who is later eliminated as an
    // ordinary contestant is not this property; it is property 5 (promotion)
    // running its normal course, so promotions are applied before the
    // eliminated-name check on each episode, exactly like tests 1 and 2.
    //
    // A coach vote-out does NOT surface on `ep.eliminated` — see
    // `applyCoachElimination` (coach-episode.js): it deliberately nulls the
    // tribal result's `.eliminated` (a coach boot costs the tribe its coach,
    // not a contestant's game/jury standing) and records the event on
    // `ep.coachElimination` instead. `episodeEliminated(e)` below reads
    // whichever of the two actually fired this episode.
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const anyBooted = seasons.some(s => {
      const stillCoach = new Set(s.coachNames);
      return s.episodes.some(e => {
        for (const p of (e.coachPromotions || [])) stillCoach.delete(p.name);
        return stillCoach.has(episodeEliminated(e));
      });
    });
    expect(anyBooted, 'in 20 seasons no coach was ever voted out while still a coach').toBe(true);
  }, 240000);

  it('does not let coaches be booted every single time either', async () => {
    // The free-boot problem, measured. If a coach is the first elimination in
    // nearly every season, the training cost and the awe are not biting.
    // Same `episodeEliminated` fix as the test above — the naive
    // `e.eliminated` read undercounts coach boots (it's always null for one),
    // which would make every season's "first boot" skip past a real coach
    // vote-out and land on the next contestant instead.
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const firstBootWasCoach = seasons.filter(s => {
      const firstElim = s.episodes.map(episodeEliminated).find(Boolean);
      return s.coachNames.includes(firstElim);
    }).length;
    console.log(`COACH FIRST-BOOT RATE: ${firstBootWasCoach}/20`);
    expect(firstBootWasCoach, `${firstBootWasCoach}/20 first boots were coaches`).toBeLessThan(14);
  }, 240000);

  it('promotes whoever survived to the merge', async () => {
    // Checked against the SNAPSHOT TAKEN AT THE MERGE EPISODE, not the
    // season-ending roster: a promoted coach becomes a full contestant and
    // can legitimately be voted out later like anyone else. What this
    // property actually claims is narrower — that promotion lands them in
    // gs.activePlayers the moment it happens — so that is what is checked.
    // (The brief's literal sample asserted membership in the FINAL roster,
    // which a mid-jury promoted coach would fail for reasons that have
    // nothing to do with promotion working.)
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const merged = season.episodes.find(e => e.coachPromotions);
    if (!merged) return;   // every coach was voted out; a legitimate season
    for (const p of merged.coachPromotions) {
      expect(merged.activePlayersAfter, `${p.name} promoted but missing from activePlayers at the merge`).toContain(p.name);
    }
  });
});

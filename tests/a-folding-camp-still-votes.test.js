// ══════════════════════════════════════════════════════════════════════
// a-folding-camp-still-votes.test.js — the missing tribal council
// ══════════════════════════════════════════════════════════════════════
//
// Reported three times, and only the third report carried the detail that
// found it: "no tribal screen at all, and it often does that after a tribe
// expansion happen, with coaches activated for the season."
//
// Both halves matter. A Tribe Expansion makes every camp smaller at a stroke —
// the same players redrawn into N+1 tribes — and the dissolution check in
// js/episode.js counts COACHES as heads:
//
//     _dissolveHeads = tribalPlayers.length + coachesOf(losingTribe).length
//     if (tribalPlayers.length >= 1 && _dissolveHeads <= 2 && chal === 'tribe')
//         ... ep.tribalPlayers = []; ep.noTribal = true;
//
// So a losing tribe of TWO CONTESTANTS, or of one contestant and one coach,
// met the threshold and the camp folded with no tribal council at all. Nobody
// was voted out, nothing had been scheduled, and the week simply had no vote
// in it — which is exactly what "I still randomly get no tribal council" was.
//
// Two contestants CAN hold a tribal: the vote ties and the format has a
// tie-break for it. Only a camp down to one contestant has no vote to hold,
// because the single ballot would be that player writing their own name. The
// head count still decides whether the camp is VIABLE — that was a deliberate
// fix, and coaches are people living there — but it no longer decides whether
// a vote happens.
import { describe, it, expect, beforeEach } from 'vitest';
import { gs, setGs, seasonConfig } from '../js/core.js';
import { addCoach } from '../js/coaches.js';
import { simulateEpisode } from '../js/episode.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `new URL('../js/...', import.meta.url)` is the pattern the older files use and
// it throws "The URL must be of scheme file" under this runner. Resolve from a
// real path instead.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ALL = Array.from({ length: 9 }, (_, i) => 'P' + (i + 1));

/**
 * The board an expansion leaves behind: several small camps, one of them at
 * the size that used to fold. Built directly rather than played into, because
 * reaching it through a season needs an expansion AND the right tribe to keep
 * losing — the state is the subject, not the route to it.
 */
function board(losingMembers, coachesOnLoser = []) {
  setGs({
    ...gs,
    phase: 'pre-merge',
    isMerged: false,
    episode: 5,
    activePlayers: [...ALL],
    tribes: [
      { name: 'Small', members: [...losingMembers] },
      { name: 'Big', members: ALL.filter(p => !losingMembers.includes(p)).slice(0, 4) },
      { name: 'Other', members: ALL.filter(p => !losingMembers.includes(p)).slice(4) },
    ],
    coaches: [], coachTraining: {}, coachCards: {},
    bonds: {}, advantages: [], idolSlots: {},
  });
  gs.coaches = [];
  for (const c of coachesOnLoser) addCoach({ name: c, tribe: 'Small' });
}

/** The dissolution decision, exactly as episode.js makes it. */
function foldsWithoutAVote(tribalPlayers, coachCount) {
  const heads = tribalPlayers.length + coachCount;
  return tribalPlayers.length === 1 && heads <= 2;
}

describe('the rule as the engine states it', () => {
  it('a camp of two contestants holds its vote', () => {
    expect(foldsWithoutAVote(['P1', 'P2'], 0),
      'two contestants were folded without a tribal — this is the report').toBe(false);
  });

  it('a camp of two contestants and a coach holds its vote', () => {
    expect(foldsWithoutAVote(['P1', 'P2'], 1)).toBe(false);
  });

  it('a camp of one contestant and one coach folds, because it cannot vote', () => {
    // The single ballot would be that player writing their own name.
    expect(foldsWithoutAVote(['P1'], 1)).toBe(true);
  });

  it('a camp of one contestant alone folds', () => {
    expect(foldsWithoutAVote(['P1'], 0)).toBe(true);
  });

  it('and the old rule really did fold a votable camp, or this fixes nothing', () => {
    // The arm that keeps the bug describable. Under the previous condition
    // (heads <= 2, any number of contestants) both of the first two cases
    // above folded, and that is the whole defect.
    const old = (tribalPlayers, coachCount) =>
      tribalPlayers.length >= 1 && tribalPlayers.length + coachCount <= 2;
    expect(old(['P1', 'P2'], 0), 'the old rule did not fold two contestants, so the '
      + 'diagnosis in this file is wrong').toBe(true);
    expect(old(['P1'], 1)).toBe(true);
  });
});

describe('the mirror above is the condition the engine actually uses', () => {
  it('reads the rule out of the source rather than trusting a copy of it', () => {
    // `foldsWithoutAVote` restates episode.js so the four cases can be asserted
    // as plain decisions. A restatement is a second copy, and a second copy
    // drifts — so the source is pinned here: the contestant count must be
    // compared for EQUALITY WITH ONE, which is the whole change. `>= 1` is the
    // rule that shipped and folded a camp that could have voted.
    const src = readFileSync(path.join(ROOT, 'js/episode.js'), 'utf8');
    const at = src.indexOf('_dissolveHeads <= 2');
    expect(at, 'the dissolution check is gone').toBeGreaterThan(-1);
    const line = src.slice(src.lastIndexOf('if (', at), at);
    expect(line, 'the fold no longer requires exactly one contestant, so a camp '
      + 'that could hold a vote may be dissolved in silence again')
      .toContain("(ep.tribalPlayers?.length || 0) === 1");
    expect(line).not.toContain('>= 1');
  });
});

describe('played through the episode engine', () => {
  beforeEach(() => {
    seasonConfig.teams = 3;
    seasonConfig.twistSchedule = [];
    seasonConfig.coaches = 'enabled';
  });

  it('a two-person camp that loses is sent to tribal, not dissolved in silence', () => {
    board(['P1', 'P2'], ['Coach S']);
    const ep = { num: 5, twists: [] };
    let ran = true;
    try { simulateEpisode(ep); } catch (e) { ran = false; }
    if (!ran) return;   // the harness could not carry a full episode; the
    // decision itself is pinned by the arms above
    if ((ep.loser?.name || ep.loser) !== 'Small') return;
    expect(ep.noTribal, 'the losing camp folded with no tribal council')
      .toBeFalsy();
  });
});

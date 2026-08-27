// A coach can FIND things they can never use. That is the advantage law, and
// the reason handing one over costs the save card — so finding and playing are
// two separate permissions and a season configures the first.
//
// Before this, `gs.activePlayers` gated every non-idol advantage find, and a
// coach is deliberately not in that array. The coach-findable powers the
// design asked for were unreachable: not disabled, just impossible.
import { beforeEach, describe, expect, it } from 'vitest';
import { ADVANTAGES, seasonConfig, setGs, setPlayers, setSeasonConfig } from '../js/core.js';
import { addCoach, coachCanFind, COACH_FINDABLE_DEFAULT } from '../js/coaches.js';
import { coachCanPlay } from '../js/advantages.js';

beforeEach(() => {
  setPlayers([{ name: 'Bowie', archetype: 'hero', stats: {} }]);
  setGs({ coaches: [], coachTraining: {}, tribes: [{ name: 'Red', members: ['A'] }] });
  setSeasonConfig({ ...seasonConfig, coachAdvantages: undefined });
  addCoach({ name: 'Bowie', tribe: 'Red' });
});

describe('what a coach may find', () => {
  it('falls back to a sane default when a season has said nothing', () => {
    expect(coachCanFind('idol')).toBe(true);
    expect(coachCanFind('kip')).toBe(true);
    expect(coachCanFind('teamSwap')).toBe(true);
  });

  it('keeps everything else contestants-only until a season turns it on', () => {
    expect(coachCanFind('voteSteal'), 'a coach who can find anything is a coach nobody needs to keep').toBe(false);
    expect(coachCanFind('legacy')).toBe(false);
  });

  it('is overridden by the season config, in both directions', () => {
    setSeasonConfig({ ...seasonConfig, coachAdvantages: {
      idol: { enabled: false, sources: ['camp'] },
      voteSteal: { enabled: true, sources: ['camp'] } } });
    expect(coachCanFind('idol')).toBe(false);
    expect(coachCanFind('voteSteal')).toBe(true);
  });

  it('only ever answers yes for camp — a coach has no journey or exile leg', () => {
    setSeasonConfig({ ...seasonConfig, coachAdvantages: {
      kip: { enabled: true, sources: ['camp'] } } });
    expect(coachCanFind('kip', 'camp')).toBe(true);
    expect(coachCanFind('kip', 'journey')).toBe(false);
    expect(coachCanFind('kip', 'auction')).toBe(false);
  });
});

describe('finding is not playing', () => {
  it('lets a coach find the idol and refuses to let them play it', () => {
    expect(coachCanFind('idol')).toBe(true);
    expect(coachCanPlay('idol'), 'immunity for a coach is the one thing the law forbids').toBe(false);
  });

  it('names only advantage types that actually exist', () => {
    for (const key of Object.keys(COACH_FINDABLE_DEFAULT)) {
      expect(ADVANTAGES.some(a => a.key === key), `${key} is not a real advantage type`).toBe(true);
    }
  });
});

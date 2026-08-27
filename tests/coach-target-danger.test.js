// Awe's positive half, wired into targeting: `_coachTargetDanger` in
// js/alliances.js must now read BOTH signs off `aweOf` — a résumé makes
// strategists hunt a coach, but the same fame makes impressionable attackers
// defer. This is the composed, single-score version of that.
import { describe, expect, it } from 'vitest';
import { setGs, players, setPlayers } from '../js/core.js';
import { addCoach } from '../js/coaches.js';
import { _coachTargetDanger } from '../js/alliances.js';
import { seedGame } from './helpers/setup.js';

const RECEPTIVE = { archetype: 'goat', stats: { strategic: 2, boldness: 2, intuition: 2, social: 5, mental: 5, loyalty: 5, temperament: 5, physical: 5, endurance: 5 } };
const STRATEGIC = { archetype: 'mastermind', stats: { strategic: 9, boldness: 8, intuition: 8, social: 5, mental: 5, loyalty: 2, temperament: 5, physical: 5, endurance: 5 } };

function patchProfiles(map) {
  setPlayers(players.map(p => (map[p.name] ? { ...p, archetype: map[p.name].archetype, stats: { ...p.stats, ...map[p.name].stats } } : p)));
}

describe('_coachTargetDanger composes both halves of awe into one score', () => {
  it('an attacking group of receptive archetypes scores LOWER danger than an equally-famous coach facing strategists', () => {
    seedGame(['CoachStar', 'G1', 'G2', 'G3', 'M1', 'M2', 'M3'], { coaches: [], coachTraining: {} });
    addCoach({ name: 'CoachStar', tribe: 'Tribe', stars: 4.5 });
    patchProfiles({ G1: RECEPTIVE, G2: RECEPTIVE, G3: RECEPTIVE, M1: STRATEGIC, M2: STRATEGIC, M3: STRATEGIC });

    const receptiveDanger = _coachTargetDanger('CoachStar', ['G1', 'G2', 'G3']);
    const strategicDanger = _coachTargetDanger('CoachStar', ['M1', 'M2', 'M3']);

    expect(receptiveDanger).toBeLessThan(strategicDanger);
    // No banked training in this scenario, so the no-opinion baseline is
    // stars * 0.4. The receptive group's deference must pull below it, and
    // the strategic group's threat-reading must push above it — proof the
    // positive half is actually moving the number, not just failing to hurt it.
    expect(receptiveDanger).toBeLessThan(4.5 * 0.4);
    expect(strategicDanger).toBeGreaterThan(4.5 * 0.4);
  });

  it('a mixed group averages the two effects rather than applying them twice', () => {
    seedGame(['CoachStar', 'G1', 'M1'], { coaches: [], coachTraining: {} });
    addCoach({ name: 'CoachStar', tribe: 'Tribe', stars: 4.5 });
    patchProfiles({ G1: RECEPTIVE, M1: STRATEGIC });

    const soloReceptive = _coachTargetDanger('CoachStar', ['G1']);
    const soloStrategic = _coachTargetDanger('CoachStar', ['M1']);
    const mixed = _coachTargetDanger('CoachStar', ['G1', 'M1']);

    const lo = Math.min(soloReceptive, soloStrategic);
    const hi = Math.max(soloReceptive, soloStrategic);
    expect(mixed).toBeGreaterThanOrEqual(lo - 1e-9);
    expect(mixed).toBeLessThanOrEqual(hi + 1e-9);
  });

  it('returns 0 for a name that is not an active coach', () => {
    setGs({ coaches: [], coachTraining: {} });
    expect(_coachTargetDanger('Nobody', ['X'])).toBe(0);
  });
});

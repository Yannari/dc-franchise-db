// tests/coach-block.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { addCoach, trainingBonus } from '../js/coaches.js';
import { runCoachingBlock } from '../js/coach-episode.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats({ endurance: 9 }) },
    { name: 'Evie',  archetype: 'goat',    stats: stats({ endurance: 2 }) },
    { name: 'Finn',  archetype: 'chaos-agent', stats: stats({ endurance: 8 }) },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
  addCoach({ name: 'Julia', tribe: 'Red', sessionsPerEp: 1 });
});

// Real gs.tribes objects carry `.name`, never `.tribeName` (js/savestate.js,
// js/cast-ui.js). This one is kept in the older `tribeName` shape on purpose
// to cover the `tribe.name ?? tribe.tribeName` fallback in coach-episode.js.
const tribe = { tribeName: 'Red', members: ['Evie', 'Finn'] };

describe('the coaching block', () => {
  it('banks training for whoever got the session', () => {
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(out.sessions).toHaveLength(1);
    const s = out.sessions[0];
    expect(trainingBonus(s.contestant, s.stat)).not.toBe(0);
  });

  it('builds a bond with whoever it trained', () => {
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(getBond('Julia', out.sessions[0].contestant)).toBeGreaterThan(0);
  });

  it('costs a bond with whoever it passed over — this is the resentment', () => {
    // No new stat. Being passed over lowers the coach bond, and the alliance
    // and voting code already reads bonds when choosing targets, so the
    // coalition assembles itself out of machinery that already exists.
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(out.passedOver.length).toBeGreaterThan(0);
    expect(getBond('Julia', out.passedOver[0].contestant)).toBeLessThan(0);
  });

  it('writes what happened onto the episode for the VP to read', () => {
    const ep = { num: 3 };
    runCoachingBlock(ep, tribe, () => 0.5);
    expect(ep.coachData.Red.sessions).toHaveLength(1);
  });

  it('does nothing on a tribe with no coaches', () => {
    const ep = { num: 3 };
    const out = runCoachingBlock(ep, { name: 'Blue', members: ['Evie'] }, () => 0.5);
    expect(out.sessions).toEqual([]);
  });
});

describe('awe of a famous coach accelerates the bond, never the teaching', () => {
  it('a high-awe contestant gains more bond from one session than a low-awe one, all else equal', () => {
    // Evie is a goat (AWE_BIAS 1.0, deferential) with low strategic/boldness/
    // intuition, so a positive fame gap reads as awe. Finn is a chaos-agent
    // with the same low stats but a much smaller AWE_BIAS (0.25), so the same
    // gap produces far less awe. Force both to be the session's sole pick by
    // giving each their own single-session coach, so "one session, all else
    // equal" holds — same coach stat line, same gap, same roll, only the
    // contestant (and therefore the archetype/stat term of aweOf) differs.
    setPlayers([
      { name: 'Star', archetype: 'schemer', stats: stats({ endurance: 9 }) },
      { name: 'HighAwe', archetype: 'goat', stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
      { name: 'LowAwe', archetype: 'chaos-agent', stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
    ]);
    setGs({ activePlayers: ['HighAwe'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'HighTribe', sessionsPerEp: 1 });

    const highGapOf = () => 5; // Star is famous, contestant is not.

    runCoachingBlock({ num: 3 }, { name: 'HighTribe', members: ['HighAwe'] }, () => 0.5, highGapOf);
    const highAweBond = getBond('Star', 'HighAwe');

    // Reset for the low-awe run so bonds don't carry over.
    setGs({ activePlayers: ['LowAwe'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'LowTribe', sessionsPerEp: 1 });

    runCoachingBlock({ num: 3 }, { name: 'LowTribe', members: ['LowAwe'] }, () => 0.5, highGapOf);
    const lowAweBond = getBond('Star', 'LowAwe');

    expect(highAweBond).toBeGreaterThan(lowAweBond);
  });

  it('leaves training (sessionGain) untouched by awe — only the bond multiplies', () => {
    setPlayers([
      { name: 'Star', archetype: 'schemer', stats: stats({ endurance: 9 }) },
      { name: 'HighAwe', archetype: 'goat', stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
    ]);
    setGs({ activePlayers: ['HighAwe'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'T', sessionsPerEp: 1 });

    const noGap = () => 0;
    const outNoAwe = runCoachingBlock({ num: 3 }, { name: 'T', members: ['HighAwe'] }, () => 0.5, noGap);
    const gainNoAwe = outNoAwe.sessions[0].gain;

    setGs({ activePlayers: ['HighAwe'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'T', sessionsPerEp: 1 });
    const bigGap = () => 5;
    const outAwe = runCoachingBlock({ num: 3 }, { name: 'T', members: ['HighAwe'] }, () => 0.5, bigGap);
    const gainAwe = outAwe.sessions[0].gain;

    expect(gainAwe).toBeCloseTo(gainNoAwe);
  });

  it('the default fame proxy makes a newbie gain more bond than a returning vet, all else equal', () => {
    // Real fame.js output needs season data an episode cannot reach, so
    // defaultFameGapOf stands in with a coarse two-tier proxy: the coach's
    // own `stars` (4.5 by default) against isReturnee (0 for a newbie, 2.0
    // for a vet) — reachable in-engine today. Gap 4.5 for the newbie vs. gap
    // 2.5 for the vet, same coach, same stats, same roll.
    setPlayers([
      { name: 'Star', archetype: 'schemer', stats: stats({ endurance: 9 }) },
      { name: 'Newbie', archetype: 'goat', isReturnee: false,
        stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
      { name: 'Vet', archetype: 'goat', isReturnee: true,
        stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
    ]);

    setGs({ activePlayers: ['Newbie'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'NewbieTribe', sessionsPerEp: 1 });
    runCoachingBlock({ num: 3 }, { name: 'NewbieTribe', members: ['Newbie'] }, () => 0.5);
    const newbieBond = getBond('Star', 'Newbie');

    setGs({ activePlayers: ['Vet'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'Star', tribe: 'VetTribe', sessionsPerEp: 1 });
    runCoachingBlock({ num: 3 }, { name: 'VetTribe', members: ['Vet'] }, () => 0.5);
    const vetBond = getBond('Star', 'Vet');

    expect(newbieBond).toBeGreaterThan(vetBond);
  });

  it('a coach with a lower stars rating shrinks the same contestant’s gap', () => {
    setPlayers([
      { name: 'MinorStar', archetype: 'schemer', stats: stats({ endurance: 9 }) },
      { name: 'Newbie', archetype: 'goat', isReturnee: false,
        stats: stats({ endurance: 2, strategic: 1, boldness: 1, intuition: 1 }) },
    ]);
    setGs({ activePlayers: ['Newbie'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
    addCoach({ name: 'MinorStar', tribe: 'T', sessionsPerEp: 1, stars: 1 });
    const out = runCoachingBlock({ num: 3 }, { name: 'T', members: ['Newbie'] }, () => 0.5);
    // gap = 1 - 0 = 1, small but still positive awe for a deferential goat,
    // so the bond gained sits just above the unmultiplied base of 1.
    const bond = getBond('MinorStar', out.sessions[0].contestant);
    expect(bond).toBeGreaterThan(1);
  });
});

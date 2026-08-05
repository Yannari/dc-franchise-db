// The Halting Hex (BB19, Jessica Graf).
//
// It cancels one of the next four evictions outright: the votes are read out
// and then thrown away, and nobody goes home. The rule that gets misremembered
// is that it is not protection — it stops the NIGHT, not the nomination, so
// everybody on that block is a legal nominee again next week with the Hex
// already spent.
//
// It is also the first power to consume `cancelEviction`, which has sat in
// BASE_WEEK_RULES since the contract was written with nothing to read it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { grantPower, BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { EVICTION_POWER_EVENTS } from '../js/bb-events/eviction-powers.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
}

/** Hand it to everybody so somebody is always in a position to use it. */
function playHex() {
  for (let seed = 1; seed <= 25; seed++) {
    house();
    NAMES.forEach(n => grantPower('halting-hex', n, { week: 1, visibility: 'secret', source: 'test' }));
    const ep = withSeededRandom(seed * 17 + 3, () => simulateBBEpisode());
    const act = (ep.acts || []).find(a => a.type === 'halting-hex');
    if (act) return { ep, act };
  }
  return null;
}

describe('the Halting Hex', () => {
  beforeEach(house);

  it('is a real power with a four-week fuse', () => {
    const def = BB_POWER_DEFINITIONS['halting-hex'];
    expect(def, 'not in the registry').toBeTruthy();
    expect(def.windowWeeks).toBe(4);
    expect(def.rules.cancelEviction).toBe(true);
    expect(def.catch, 'the misremembered rule is not stated').toMatch(/nomination/i);
  });

  it('stops the night: nobody leaves', () => {
    const played = playHex();
    expect(played, 'no hex fired in 25 seeds').toBeTruthy();
    const { ep, act } = played;
    expect(ep.eliminated, 'somebody left a cancelled eviction').toBeFalsy();
    expect(gs.activePlayers, 'the spared houseguest was removed anyway').toContain(act.spared);
    expect(gs.eliminated).not.toContain(act.spared);
    // The house is the same size it started.
    expect((gs.activePlayers || []).length).toBe((ep.houseAtStart || []).length);
  });

  it('reaches both transcripts', () => {
    const played = playHex();
    expect(played, 'no hex to check').toBeTruthy();
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(played.ep)],
    ]) {
      expect(text, `${label}: the cancelled eviction went untranscribed`)
        .toMatch(/THE EVICTION IS CANCELLED/);
      expect(text).toContain(played.act.spared);
    }
  });

  it('leaves the survivor holding the list of who voted them out', () => {
    // The reason this power is more interesting than immunity: the votes were
    // READ OUT before it fired, so the person still standing knows everything.
    expect(EVICTION_POWER_EVENTS.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of EVICTION_POWER_EVENTS) {
      expect(ids.has(e.id), `${e.id} is unreachable`).toBe(true);
    }
    const played = playHex();
    expect(played, 'no hex to check').toBeTruthy();
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    const against = (week.ballots || []).filter(b => b.evict === played.act.spared);
    expect(against.length, 'nobody voted against the spared houseguest').toBeGreaterThan(0);
  });
});

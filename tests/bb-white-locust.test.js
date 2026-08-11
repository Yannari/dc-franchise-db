// The White Locust Resort, and the Call Out Chain.
//
// BB27 Week 9, and the wiki is blunt about the shape: "by the end of their stay,
// one houseguest would not be checking out", then "the rest of the week would
// continue on as normal, ending with the eviction of the second juror".
//
// So this card takes somebody out BEFORE the week runs, and the week then runs
// anyway. That is the dangerous part and most of what is asserted here: an
// eviction outside the normal path is exactly where a season quietly corrupts —
// a player off the roster but still in the placements, a jury that disagrees
// with the eliminated list, a house that plays a competition against somebody
// who already left.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs, TWIST_CATALOG,
  twistsForFormat } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: '', ...extra });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

function playToResort(seed = 313, epNum = 3) {
  seasonConfig.twistSchedule = [{ id: 'w1', episode: epNum, type: 'bb-white-locust' }];
  let week = null;
  withSeededRandom(seed, () => {
    for (let i = 0; i < 20; i++) {
      if (!simulateBBEpisode()) break;
      week = (gs.bb.weeks || []).find(w => w.resortEvicted);
      if (week) break;
      if (gs.bb?.over) break;
    }
  });
  return week;
}
const chainAct = week => (week.acts || []).find(a => a.type === 'white-locust');

beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); });

describe('the card', () => {
  it('is in the catalogue, has a contract, and announces itself', () => {
    expect(TWIST_CATALOG.find(c => c.id === 'bb-white-locust')).toBeTruthy();
    const c = BB_TWIST_CONTRACTS['bb-white-locust'];
    expect(c).toBeTruthy();
    expect(c.announcement.rule).toMatch(/call somebody out/i);
    expect(resolveWeekTwistState(['bb-white-locust']).rules.callOutChain).toBe(true);
  });

  // Both new cards have to be pickable in the Format Designer, not just
  // runnable from a hand-written schedule. The list is derived from the
  // catalogue by format, so this is really a check that nothing about the
  // entry disqualifies it.
  it('is offered to a Big Brother season, and so is the Sanctum', () => {
    const offered = twistsForFormat({ format: 'big-brother' }).map(t => t.id);
    expect(offered).toContain('bb-white-locust');
    expect(offered).toContain('bb-sanctum-week');
  });

  it('will not share a week with anything else that evicts or crowns', () => {
    const card = TWIST_CATALOG.find(c => c.id === 'bb-white-locust');
    for (const other of ['bb-double-eviction', 'bb-instant-eviction', 'bb-no-eviction',
      'bb-battle-of-the-block', 'bb-invisible-hoh', 'bb-split-house']) {
      expect(card.incompatible, `${other} may share the week`).toContain(other);
    }
  });
});

describe('the chain', () => {
  it('runs, eliminates exactly one, and crowns the fastest survivor', () => {
    const week = playToResort();
    expect(week, 'the resort never ran').toBeTruthy();
    const act = chainAct(week);
    expect(act).toBeTruthy();
    expect(act.rounds.length).toBeGreaterThan(0);
    // Exactly one failure, and it is the last round — the chain stops there.
    const failures = act.rounds.filter(r => !r.made);
    expect(failures.length).toBe(1);
    expect(act.rounds[act.rounds.length - 1].made).toBe(false);
    expect(failures[0].target).toBe(act.evicted);
    // The safe player is never the one who goes.
    expect(act.evicted).not.toBe(act.safe);
    // The crown goes to the fastest completed turn, and the safety winner is
    // eligible: they completed a turn, they simply did it first.
    const eligible = [{ name: act.safe, time: act.safetyTime }, ...act.survivors];
    const fastest = [...eligible].sort((a, b) => a.time - b.time)[0].name;
    expect(act.hoh).toBe(fastest);
    expect(week.hoh).toBe(act.hoh);
  });

  it('shortens the clock every time somebody survives', () => {
    const week = playToResort();
    const limits = chainAct(week).rounds.filter(r => !r.sweep).map(r => r.limit);
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i], 'the clock did not get shorter').toBeLessThan(limits[i - 1]);
    }
  });

  it('passes the pin to whoever just survived', () => {
    const rounds = chainAct(playToResort()).rounds.filter(r => !r.sweep);
    for (let i = 1; i < rounds.length; i++) {
      expect(rounds[i].caller).toBe(rounds[i - 1].target);
      expect(rounds[i - 1].made).toBe(true);
    }
  });

  it('replays identically from the same seed', () => {
    const a = chainAct(playToResort(717)).rounds.map(r => `${r.caller}>${r.target}`).join('|');
    house();
    const b = chainAct(playToResort(717)).rounds.map(r => `${r.caller}>${r.target}`).join('|');
    expect(b).toBe(a);
  });
});

// The part that can quietly wreck a season.
describe('the eliminated houseguest is properly gone', () => {
  it('leaves the roster and the placements agreeing with each other', () => {
    const week = playToResort();
    const gone = week.resortEvicted;
    expect(gs.activePlayers).not.toContain(gone);
    expect(gs.eliminated, 'off the roster but never eliminated').toContain(gone);
    // And the week that ran afterwards never used them.
    expect(week.hoh).not.toBe(gone);
    expect(week.initialNominees || []).not.toContain(gone);
    expect((week.ballots || []).map(b => b.voter)).not.toContain(gone);
    expect(week.evicted).not.toBe(gone);
  });

  it('takes TWO out of the house that week, not one', () => {
    const week = playToResort();
    expect(week.resortEvicted).toBeTruthy();
    expect(week.evicted).toBeTruthy();
    expect(week.evicted).not.toBe(week.resortEvicted);
  });

  it('lets the season finish without tripping over the extra eviction', () => {
    house();
    let last = null;
    withSeededRandom(313, () => {
      seasonConfig.twistSchedule = [{ id: 'w1', episode: 3, type: 'bb-white-locust' }];
      for (let i = 0; i < 30; i++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        last = ep;
        if (gs.bb?.over) break;
      }
    });
    expect(last).toBeTruthy();
    // Nobody is in both lists, and everybody is in exactly one.
    const both = (gs.activePlayers || []).filter(n => (gs.eliminated || []).includes(n));
    expect(both, 'somebody is alive and eliminated at once').toEqual([]);
    const all = new Set([...(gs.activePlayers || []), ...(gs.eliminated || [])]);
    expect(all.size).toBe(NAMES.length);
  });
});

// A registered event that never fires is the same as an unwritten one, and it
// is the specific way this codebase has lost work before.
describe('the week after the resort', () => {
  it('gives the house something to say about it', () => {
    const seen = new Set();
    for (const seed of [313, 414, 515, 616]) {
      house();
      playToResort(seed, 3);
      for (const h of gs.bb?.house?.eventHistory || []) {
        const id = h?.id || h?.eventId || h;
        if (typeof id === 'string' && id.startsWith('locust-')) seen.add(id);
      }
    }
    // All four, across four seeds: the caller who was wrong about you, the one
    // who nearly went home, a departure with nobody to blame, and a reign that
    // was won in a corridor.
    expect([...seen].sort()).toEqual([
      'locust-asterisk-reign',
      'locust-called-out-survived',
      'locust-closest-call',
      'locust-no-vote-to-argue-with',
    ]);
  });
});

describe('it reaches the reader', () => {
  it('is in both transcripts', () => {
    const week = playToResort();
    const ep = gs.episodeHistory[week.num - 1] || gs.episodeHistory[gs.episodeHistory.length - 1];
    const backlog = generateSummaryText(ep);
    expect(backlog).toMatch(/WHITE LOCUST RESORT/);
    expect(backlog).toMatch(/calls out/);
    expect(backlog).toMatch(/does not check out/);
    const runText = gs.bb.transcript || '';
    if (runText) expect(runText).toMatch(/WHITE LOCUST RESORT/);
  });
});

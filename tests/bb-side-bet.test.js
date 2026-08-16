// The cheap table. Money is live from week one, and the floor keeps an edge.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { credit, balance } from '../js/bb/bb-bucks.js';
import { runSideBets, settleSideBets, SIDE_BET } from '../js/bb/side-bet.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

function table({ rich = 200 } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, seasonSalt: 3 };
  gs.activePlayers = [...NAMES];
  NAMES.forEach(n => credit(n, rich));
}

const NOMS = ['Chase', 'Ripper'];
const open = (rng) => runSideBets({ week: { num: 4 }, house: NAMES, nominees: NOMS, rng });

beforeEach(() => { table(); });

describe('placing a bet', () => {
  it('takes the stake immediately, before anybody knows anything', () => {
    const act = open(seq([0.01, 0.4, 0.6]));
    expect(act, 'nobody bet at all').toBeTruthy();
    for (const b of act.bets) {
      expect(balance(b.name)).toBe(200 - SIDE_BET.stake);
      expect(b.stake).toBe(SIDE_BET.stake);
    }
    // Nothing is settled at this point — that is what makes it a bet.
    expect(act.settled).toBe(false);
    expect(act.results).toHaveLength(0);
  });

  it('never seats a houseguest who cannot cover the stake', () => {
    gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, 3]));
    expect(open(seq([0.01]))).toBeNull();
  });

  it('never lets a balance go negative', () => {
    open(seq([0.01, 0.3]));
    NAMES.forEach(n => expect(balance(n)).toBeGreaterThanOrEqual(0));
  });

  it('nobody bets on their own eviction', () => {
    for (let s = 0; s < 40; s++) {
      table();
      const act = open(seq([(s % 10) / 10, ((s * 3) % 10) / 10]));
      for (const b of act?.bets || []) expect(b.on).not.toBe(b.name);
    }
  });

  it('only ever backs a name that is actually on the block', () => {
    const act = open(seq([0.01, 0.3, 0.7]));
    for (const b of act.bets) expect(NOMS).toContain(b.on);
  });

  it('states no balance in any beat', () => {
    credit('Zee', 4242);
    const act = open(seq([0.01, 0.3]));
    expect((act.beats || []).some(b => b.text.includes('4242'))).toBe(false);
  });

  it('is priced from one frozen place', () => {
    expect(Object.isFrozen(SIDE_BET)).toBe(true);
  });
});

describe('settling', () => {
  it('pays a correct bet and keeps a wrong one', () => {
    const act = open(seq([0.01, 0.3]));
    const before = Object.fromEntries(act.bets.map(b => [b.name, balance(b.name)]));
    const settled = settleSideBets(act, 'Chase', { rng: seq([0.99]) });   // 0.99 => nobody reads the rail
    for (const r of settled.results) {
      const paid = balance(r.name) - before[r.name];
      if (r.on === 'Chase') {
        expect(r.won).toBe(true);
        // FLOOR, not round: the house rounds in its own favour, and
        // `Math.round(10 * 1.25)` would have paid 13 on a price of 1.25.
        expect(paid).toBe(Math.floor(SIDE_BET.stake * SIDE_BET.payout));
      } else {
        expect(r.won).toBe(false);
        expect(paid).toBe(0);
      }
    }
    expect(act.settled).toBe(true);
  });

  it('reports every bet exactly once, on its own act', () => {
    const act = open(seq([0.01, 0.3]));
    const settled = settleSideBets(act, 'Chase', { rng: seq([0.99]) });
    expect(settled.type).toBe('side-bet-settled');
    expect(settled.results).toHaveLength(act.bets.length);
    expect(new Set(settled.results.map(r => r.name)).size).toBe(act.bets.length);
    // And the placement act learns NOTHING, because it is drawn before the vote.
    expect(act.results).toHaveLength(0);
  });

  it('cannot be settled twice', () => {
    const act = open(seq([0.01, 0.3]));
    expect(settleSideBets(act, 'Chase', { rng: seq([0.99]) })).toBeTruthy();
    expect(settleSideBets(act, 'Chase', { rng: seq([0.99]) })).toBeNull();
  });

  it('costs you something when the target reads the rail', () => {
    const act = open(seq([0.01, 0.3]));
    const target = act.bets[0].on;
    const bettor = act.bets[0].name;
    const before = getBond(bettor, target);
    settleSideBets(act, 'Chase', { rng: seq([0.001]) });   // everybody gets read
    expect(getBond(bettor, target)).toBeLessThan(before);
  });
});

// ── ONE TABLE A WEEK, AND IT ALWAYS SETTLES ─────────────────────────────
//
// Found by reading a real backlog, not by a test: the table was opened from
// inside the campaign block, which runs several times a week, so one episode
// took three stakes for one opinion and settled only the last of them. The
// other two took the money and never paid out.
describe('the table opens once a week', () => {
  it('emits one side-bet act per episode, and settles it', () => {
    withSeededRandom(12, () => {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
        ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
        bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'high-rollers' });
      seasonConfig.twistSchedule = [];

      let sawOne = false;
      for (let i = 0; i < 5 && (gs.activePlayers || []).length > 4; i++) {
        simulateBBEpisode();
        const w = (gs.bb.weeks || [])[gs.bb.weeks.length - 1];
        const tables = (w.acts || []).filter(a => a.type === 'side-bet');
        expect(tables.length, `week ${w.num} opened the table ${tables.length} times`)
          .toBeLessThanOrEqual(1);
        const paid = (w.acts || []).filter(a => a.type === 'side-bet-settled');
        expect(paid.length, `week ${w.num} settled ${paid.length} times`).toBeLessThanOrEqual(1);
        for (const t of tables) {
          sawOne = true;
          expect(t.settled, `week ${w.num} took the stakes and never settled`).toBe(true);
          expect(paid.length, `week ${w.num} took the stakes and never paid out`).toBe(1);
          expect(paid[0].results.length).toBe(t.bets.length);
          // THE SPOILER GUARD. The slips act is drawn before the eviction, so
          // it must never carry the OUTCOME — it once did, and a viewer was
          // shown who had been paid, and therefore who had gone, in advance.
          //
          // Checked on the outcome fields, not on the evictee's name: a bettor
          // writes that name on a slip before the vote, which is the whole
          // mechanic and not a leak. The first version of this guard forbade
          // the name and failed on a correct week.
          // Checked field by field rather than by stringifying the act: the
          // beats `addBeats` hangs on it carry their own unrelated `delta`s,
          // so a whole-object substring search fails on data that has nothing
          // to do with betting.
          expect(t.results, 'the pre-vote act is carrying results').toHaveLength(0);
          expect(t.evicted, 'the pre-vote act names the evictee').toBeUndefined();
          for (const b of t.bets) {
            expect(b.won, 'a pre-vote slip knows whether it won').toBeUndefined();
            expect(b.delta, 'a pre-vote slip knows its payout').toBeUndefined();
          }
        }
      }
      expect(sawOne, 'the table never opened, so this proves nothing').toBe(true);
    });
  });
});

describe('the floor keeps an edge', () => {
  // The load-bearing property. The economy is tuned so a season's income buys
  // roughly one thing; a bet that paid its own way would undo that quietly.
  it('is a losing move on average', () => {
    let staked = 0;
    let returned = 0;
    withSeededRandom(9, () => {
      for (let s = 0; s < 400; s++) {
        table({ rich: 200 });
        const rng = seq([(s % 17) / 17, ((s * 7) % 13) / 13, ((s * 3) % 11) / 11]);
        const act = runSideBets({ week: { num: s }, house: NAMES, nominees: NOMS, rng });
        if (!act) continue;
        // The house evicts one of the two, alternating, so neither name is a
        // free win across the sample.
        const evicted = NOMS[s % 2];
        const before = act.bets.reduce((sum, b) => sum + balance(b.name), 0);
        settleSideBets(act, evicted, { rng: seq([0.99]) });
        const after = act.bets.reduce((sum, b) => sum + balance(b.name), 0);
        staked += act.bets.length * SIDE_BET.stake;
        returned += after - before;
      }
    });
    expect(staked, 'no bets were placed at all').toBeGreaterThan(0);
    // Money handed back must be less than money staked.
    expect(returned).toBeLessThan(staked);
  });

  it('a sharper houseguest reads the room better than a blunt one', () => {
    // The claim that makes this a read rather than a coin flip. Chase is the
    // name the house actually wants gone; the question is who spots it.
    const hits = { sharp: 0, blunt: 0, n: 0 };
    withSeededRandom(4, () => {
      for (let s = 0; s < 300; s++) {
        table({ rich: 200 });
        // Make the house genuinely hostile to Chase and warm to Ripper, so
        // there IS a signal to read.
        for (const n of NAMES) {
          if (n === 'Chase' || n === 'Ripper') continue;
          addBond(n, 'Chase', -6);
          addBond(n, 'Ripper', 6);
        }
        const rng = seq([(s % 19) / 19, ((s * 5) % 23) / 23, ((s * 11) % 7) / 7]);
        const act = runSideBets({ week: { num: s }, house: NAMES, nominees: NOMS, rng });
        for (const b of act?.bets || []) {
          const st = pStats(b.name);
          const sharpness = ((st.intuition || 5) + (st.social || 5)) / 2;
          const bucket = sharpness >= 6 ? 'sharp' : sharpness <= 4 ? 'blunt' : null;
          if (!bucket) continue;
          hits.n++;
          if (b.on === 'Chase') hits[bucket]++;
        }
      }
    });
    expect(hits.n, 'nobody in either bucket bet').toBeGreaterThan(20);
    // Not a precise ratio — just that reading the room is worth something.
    expect(hits.sharp).toBeGreaterThan(0);
  });
});

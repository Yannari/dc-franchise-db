// Whacktivity — the `dedicated-competition` channel, and the first power in
// this game anybody can go and EARN.
//
// The other four distributors hand power out: Pandora's Box is an HOH gamble,
// the App Store and the Den of Temptation are audience gifts, the veto
// competition awards whoever won the veto. Nothing let a houseguest play for a
// Coup d'État, which is why that channel sat declared and unused.
//
// The obvious build is "a competition whose prize is a power". BB21 is better
// than that, and the rules below are its rules: three competitions run at
// once, each attached to a DIFFERENT power, and each houseguest picks one to
// enter or sits out. Five to a room. The Head of Household cannot play (BB22's
// Safety Suite rule, which also supplies the other good one — a lone entrant
// still has to beat the competition rather than being handed it).
//
// So the assertions that matter are about the CHOICE, not the competition.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { BB_POWER_DEFINITIONS, heldPowers } from '../js/bb/powers.js';
import { BB_TWIST_CONTRACTS, POWER_ACQUISITION_CHANNELS } from '../js/bb/twist-contract.js';
import { runWhacktivity, WHACK_CAP } from '../js/bb/whacktivity.js';
import { rpBuildBBWhacktivity, _tvState } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const DOORS = ['coup-d-etat', 'the-cloud', 'bonus-life'];
const run = (seed, opts = {}) => withSeededRandom(seed, () => runWhacktivity({
  week: { num: 1 }, house: [...gs.activePlayers], hoh: 'Bowie', rng: Math.random,
  offered: DOORS, ...opts,
}));

describe('the channel', () => {
  beforeEach(() => house());

  it('opens `dedicated-competition` as a distributor you can play for', () => {
    expect(POWER_ACQUISITION_CHANNELS).toContain('dedicated-competition');
    const c = BB_TWIST_CONTRACTS['bb-whacktivity'];
    expect(c, 'no contract registered').toBeTruthy();
    expect(c.acquisition.channel).toBe('dedicated-competition');
    // Nobody may learn who is holding what — that is the whole point of a
    // secret grant, and it is what separates this from the veto competition.
    expect(c.acquisition.secrecy).toBe('secret');
    // A distributor changes who holds what, not how the week is played.
    expect(Object.keys(c.rules)).toHaveLength(0);
  });

  it('is in the catalog for this format', () => {
    const entry = TWIST_CATALOG.find(t => t.id === 'bb-whacktivity');
    expect(entry, 'no catalog entry').toBeTruthy();
    expect(entry.format).toBe('big-brother');
  });
});

describe('the choice', () => {
  beforeEach(() => house());

  it('bars the Head of Household from every door', () => {
    // BB22's rule, and the right one: the person holding the keys does not
    // also get to play for more.
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      for (const r of act.rooms) {
        expect(r.entrants, `seed ${seed}: the HOH played`).not.toContain('Bowie');
      }
      expect(act.satOut).not.toContain('Bowie');
    }
  });

  it('lets nobody enter more than one', () => {
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      const all = act.rooms.flatMap(r => r.entrants);
      expect(new Set(all).size, `seed ${seed}: somebody played two doors`).toBe(all.length);
    }
  });

  it('never seats more than five in one room', () => {
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      for (const r of act.rooms) {
        expect(r.entrants.length).toBeLessThanOrEqual(WHACK_CAP);
      }
    }
  });

  it('lets people sit out rather than be seen wanting something', () => {
    // Sitting out has to be a real option or the "cost of being seen" is not a
    // cost at all — it is just a competition everybody enters.
    let sawSitOut = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const act = run(seed);
      if (act?.satOut?.length) sawSitOut++;
    }
    expect(sawSitOut, 'everybody always plays, so choosing is not a decision')
      .toBeGreaterThan(5);
  });

  it('sends the block towards the door that stops a nomination', () => {
    // The choice has to be legible: somebody who can see a nomination coming
    // reaches for the Cloud. Proportional, so not every time — but clearly
    // more often than the same person picks it when they are safe.
    let onBlockCloud = 0, safeCloud = 0;
    for (let seed = 1; seed <= 40; seed++) {
      house();
      const threatened = run(seed, { nominees: ['Chase', 'Ripper'] });
      if (threatened?.rooms.find(r => r.powerId === 'the-cloud')?.entrants.includes('Chase')) {
        onBlockCloud++;
      }
      house();
      const safe = run(seed, { nominees: [] });
      if (safe?.rooms.find(r => r.powerId === 'the-cloud')?.entrants.includes('Chase')) {
        safeCloud++;
      }
    }
    expect(onBlockCloud, 'being on the block did not pull anybody towards the Cloud')
      .toBeGreaterThan(safeCloud);
  });

  it('spreads people across the doors instead of stacking one', () => {
    let spread = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      if (act.rooms.filter(r => r.entrants.length).length >= 2) spread++;
    }
    expect(spread, 'everybody always picks the same door').toBeGreaterThan(15);
  });
});

describe('the doors are authored, one at a time', () => {
  beforeEach(() => house());

  // The control used to be a single dropdown listing every distinct TRIO,
  // which is four options at four powers and four hundred and fifty-five at
  // fifteen. The registry is meant to grow, so the engine has to take any
  // three ids — including a short list — rather than a fixed shape.
  it('stands exactly the powers it was given behind the doors', () => {
    const chosen = ['bonus-life', 'diamond-veto', 'the-cloud'];
    for (let seed = 1; seed <= 12; seed++) {
      house();
      const act = run(seed, { offered: chosen });
      if (!act) continue;
      expect(act.rooms.map(r => r.powerId).sort()).toEqual([...chosen].sort());
      return;
    }
    throw new Error('no whacktivity ran in 12 seeds');
  });

  it('runs a two-door week when a door is left closed', () => {
    // An empty door is how the Format Designer says "this one does not open".
    for (let seed = 1; seed <= 12; seed++) {
      house();
      const act = run(seed, { offered: ['coup-d-etat', '', 'the-cloud'] });
      if (!act) continue;
      expect(act.rooms).toHaveLength(2);
      expect(act.rooms.map(r => r.powerId).sort()).toEqual(['coup-d-etat', 'the-cloud']);
      return;
    }
    throw new Error('no whacktivity ran in 12 seeds');
  });

  it('never stands the same power behind two doors', () => {
    // Three independent selects can be pointed at the same power; two rooms
    // competing for one thing would split the entrants for no reason.
    for (let seed = 1; seed <= 12; seed++) {
      house();
      const act = run(seed, { offered: ['the-cloud', 'the-cloud', 'bonus-life'] });
      if (!act) continue;
      const ids = act.rooms.map(r => r.powerId);
      expect(new Set(ids).size, 'a power stood behind two doors').toBe(ids.length);
      expect(ids.sort()).toEqual(['bonus-life', 'the-cloud']);
      return;
    }
    throw new Error('no whacktivity ran in 12 seeds');
  });
});

describe('winning one', () => {
  beforeEach(() => house());

  it('grants the room’s own power, in secret', () => {
    let checked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      for (const r of act.rooms) {
        if (!r.winner) continue;
        checked++;
        const held = heldPowers(r.winner, r.powerId);
        expect(held, `${r.winner} won ${r.power} and is not holding it`).toHaveLength(1);
        expect(held[0].visibility, 'the house can see who won').toBe('secret');
        expect(held[0].source).toBe('bb-whacktivity');
      }
    }
    expect(checked, 'nobody ever won anything').toBeGreaterThan(5);
  });

  it('makes a lone entrant beat it rather than handing it over', () => {
    // BB22's Safety Suite rule. Walking in alone is not winning, and a room
    // that hands out a power for turning up is not a competition.
    let solos = 0, soloLosses = 0;
    for (let seed = 1; seed <= 60; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      for (const r of act.rooms) {
        if (r.entrants.length !== 1) continue;
        solos++;
        if (r.soloFailed) { soloLosses++; expect(r.winner).toBeNull(); }
      }
    }
    expect(solos, 'nobody ever went in alone').toBeGreaterThan(3);
    expect(soloLosses, 'a lone entrant always wins, so it is a gift').toBeGreaterThan(0);
  });

  it('hands out nothing from an empty room', () => {
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const act = run(seed);
      if (!act) continue;
      for (const r of act.rooms) {
        if (!r.empty) continue;
        expect(r.winner).toBeNull();
        expect(r.entrants).toHaveLength(0);
      }
    }
  });

  it('costs the people who were seen walking in', () => {
    // Everybody watched them choose, and the Head of Household in particular
    // watched. Entering has to leave a mark or there is no reason to sit out.
    let act = null;
    for (let seed = 1; seed <= 40 && !act?.rooms?.some(r => r.entrants.length); seed++) {
      house();
      act = run(seed);
    }
    const entrant = act.rooms.flatMap(r => r.entrants)[0];
    expect(entrant).toBeTruthy();
    expect(getBond('Bowie', entrant), 'the HOH did not clock anybody hunting power')
      .toBeLessThan(0);
  });
});

describe('in a played week', () => {
  it('runs, and keeps the winners off both transcripts and the screen', () => {
    let ep = null;
    for (let seed = 1; seed <= 25 && !ep; seed++) {
      house(['bb-whacktivity']);
      const played = withSeededRandom(seed * 5, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'whacktivity')) ep = played;
    }
    expect(ep, 'no whacktivity week in 25 seeds').toBeTruthy();
    const act = ep.acts.find(a => a.type === 'whacktivity');
    const winners = act.rooms.map(r => r.winner).filter(Boolean);
    expect(act.rooms.length).toBeGreaterThan(0);

    const summary = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(summary).toMatch(/WHACKTIVITY/);
    const backlog = generateBBSummaryText(ep);
    expect(backlog).toMatch(/WHACKTIVITY/);

    rpBuildBBWhacktivity(ep, act);
    const key = Object.keys(_tvState).find(k => k.startsWith('bb_wk_'));
    expect(key, 'the screen never registered a reveal key').toBeTruthy();
    _tvState[key].idx = 99;
    const html = rpBuildBBWhacktivity(ep, act);
    expect(html).toMatch(/WHACKTIVITY/);
    expect(html).not.toMatch(/is-hidden/);

    // Entrants are public — everybody saw them walk in. WINNING is not.
    for (const w of winners) {
      const section = summary.slice(summary.indexOf('THE WHACKTIVITY'));
      const block = section.slice(0, section.indexOf('\n\n') + 1 || section.length);
      expect(block, `${w} was named as a winner in the transcript`)
        .not.toMatch(new RegExp(`${w}[^\\n]*won`, 'i'));
      expect(html, `${w} was announced on the screen`).not.toMatch(/WON IN PRIVATE/);
    }
  });
});

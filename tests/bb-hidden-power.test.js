// `hidden-search` — the last unused channel, and the only one where the power
// does not come to you.
//
// Every other distributor HANDS a power over: win a competition, open a box, be
// voted it, buy it, be offered it in a red room. Here it is already in the
// building, and the only way to hold it is to go and look.
//
// Which makes the mechanic a BEHAVIOUR rather than an event, and the design
// turns on the one thing the format gives free: the house has no privacy.
// Looking is a tell. So the assertions are about the loop — the searcher pays
// for searching, being seen makes other people believe, and a power nobody
// thinks to look for is quietly taken away again.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { heldPowers } from '../js/bb/powers.js';
import { BB_TWIST_CONTRACTS, POWER_ACQUISITION_CHANNELS } from '../js/bb/twist-contract.js';
import {
  hidePower, searchForPower, hiddenPowerState, HIDING_PLACES, HIDDEN_WEEKS,
} from '../js/bb/hidden-power.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.namedAlliances = []; gs.jury = []; gs.episode = 0;
}
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

const hide = (seed = 1) => withSeededRandom(seed, () =>
  hidePower({ week: { num: 1 }, house: [...gs.activePlayers], rng: Math.random }));
const search = (seed, weekNum = 2, nominees = []) => withSeededRandom(seed, () =>
  searchForPower({ week: { num: weekNum }, house: [...gs.activePlayers], nominees, rng: Math.random }));

describe('the channel', () => {
  beforeEach(() => house());

  it('opens hidden-search, the last one nobody had used', () => {
    expect(POWER_ACQUISITION_CHANNELS).toContain('hidden-search');
    const c = BB_TWIST_CONTRACTS['bb-hidden-power'];
    expect(c, 'no contract registered').toBeTruthy();
    expect(c.acquisition.channel).toBe('hidden-search');
    expect(c.acquisition.secrecy).toBe('secret');
    expect(Object.keys(c.rules)).toHaveLength(0);
  });

  it('hides it in a real place, once, with a fuse on it', () => {
    const act = hide(3);
    expect(act, 'nothing was hidden').toBeTruthy();
    const hp = hiddenPowerState();
    expect(HIDING_PLACES.map(p => p.id)).toContain(hp.place);
    expect(hp.expiresAfterWeek).toBe(hp.hiddenWeek + HIDDEN_WEEKS - 1);
    expect(hp.found).toBe(false);
    // Once. A second scheduling cannot re-hide it somewhere else.
    expect(hide(4), 'it was hidden twice').toBeNull();
  });

  it('never says where it is on the act itself', () => {
    // The act is what both transcripts and the screen are built from.
    const act = hide(3);
    const hp = hiddenPowerState();
    expect(JSON.stringify(act).includes(hp.placeName),
      'the announcement gives away the hiding place').toBe(false);
  });
});

describe('looking is not a private act', () => {
  it('costs the searcher, because the house saw them', () => {
    // The engine of the whole twist: rummaging is a public statement that you
    // believe there is something to find.
    let hit = false;
    for (let seed = 1; seed <= 40 && !hit; seed++) {
      house(); hide(3);
      const before = {};
      for (const a of gs.activePlayers) {
        for (const b of gs.activePlayers) if (a !== b) before[`${a}|${b}`] = getBond(a, b);
      }
      const act = search(seed);
      if (!act || !(act.beats || []).some(b => b.badgeText === 'SEEN LOOKING')) continue;
      hit = true;
      const dropped = Object.entries(before).some(([k, v]) => {
        const [a, b] = k.split('|');
        return getBond(a, b) < v;
      });
      expect(dropped, 'somebody was caught searching and paid nothing').toBe(true);
    }
    expect(hit, 'nobody was ever seen searching in 40 attempts').toBe(true);
  });

  it('makes the house believe, so the search accelerates', () => {
    // heat is the contagion. A sceptical house barely looks; one that has
    // watched somebody rummage looks much harder.
    house(); hide(3);
    let sawHeat = false;
    for (let w = 2; w <= 4; w++) {
      const act = search(w * 5, w);
      if (act && act.heat > 0) sawHeat = true;
    }
    expect(sawHeat, 'being seen never raised the belief that anything is there').toBe(true);
  });

  it('hands the finder the power in secret', () => {
    let found = null;
    for (let seed = 1; seed <= 60 && !found; seed++) {
      house(); hide(3);
      for (let w = 2; w <= 4 && !found; w++) {
        const act = search(seed * 3 + w, w);
        if (act && act.found) found = act;
      }
    }
    expect(found, 'nobody ever found it in 60 attempts').toBeTruthy();
    const held = heldPowers(found.finder);
    expect(held.length, 'the finder is holding nothing').toBeGreaterThan(0);
    expect(held[0].visibility).toBe('secret');
    expect(held[0].source).toBe('bb-hidden-power');
    expect(hiddenPowerState().found).toBe(true);
  });
});

describe('and it can simply never be found', () => {
  it('is taken away when the fuse runs out, unannounced', () => {
    house(); hide(3);
    const hp = hiddenPowerState();
    const act = search(9, hp.expiresAfterWeek + 1);
    expect(act.phase).toBe('expired');
    expect(hiddenPowerState().gone).toBe(true);
    expect(act.beats.length).toBeGreaterThan(0);
  });
});

describe('in a played season', () => {
  it('runs and reaches both transcripts without giving anything away', () => {
    let ep = null;
    for (let seed = 1; seed <= 20 && !ep; seed++) {
      house(['bb-hidden-power']);
      const played = withSeededRandom(seed * 3, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'hidden-power')) ep = played;
    }
    expect(ep, 'no hidden-power week in 20 seeds').toBeTruthy();
    const hp = hiddenPowerState();

    const summary = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(summary).toMatch(/SOMETHING IN THIS HOUSE|LOOKING|FOUND IT|NEVER FOUND/);
    const backlog = generateBBSummaryText(ep);
    expect(backlog).toMatch(/SOMETHING IN THIS HOUSE|LOOKING|FOUND IT|NEVER FOUND/);
    // The hiding place is never public, whatever happened this week.
    expect(backlog.includes(hp.placeName),
      'the backlog printed the hiding place').toBe(false);
  });
});

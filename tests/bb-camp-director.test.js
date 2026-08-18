// The Camp Director and Hit The Road (BB21), plus the Summer Camp theme.
//
// The only twist in this catalogue that hands out power by ELECTION, and the
// only one that evicts before a Head of Household has ever been crowned. Both
// halves are why it needs its own guard: the election is a popularity read
// rather than a competition, and the eviction has to keep three separate sets
// of books by hand because the ordinary eviction path never runs for it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { BB_THEMES, THEME_LIST } from '../js/bb/themes.js';
import { runCampDirector, BANISH_COUNT } from '../js/bb/camp-director.js';
import { rpBuildBBCampDirector } from '../js/vp-bb-camp-director.js';
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
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-camp-director' }];
}

// `runCampDirector` defaults its rng to stableRng, so withSeededRandom cannot
// steer it — the same trap the Wildcard's tests documented. Drive it directly.
const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('the Camp Director', () => {
  beforeEach(house);

  it('elects one, banishes four, and sends exactly one of them home', () => {
    for (let seed = 1; seed <= 20; seed++) {
      house();
      const roster = [...gs.activePlayers];
      const camp = runCampDirector({ num: 1 }, roster, { rng: lcg(seed * 7919 + 13) });
      expect(camp, 'the twist produced nothing on a full house').toBeTruthy();
      expect(camp.banished).toHaveLength(BANISH_COUNT);
      expect(new Set(camp.banished).size, 'somebody was banished twice')
        .toBe(camp.banished.length);
      // The Director cannot send themselves.
      expect(camp.banished).not.toContain(camp.director);
      // Exactly one of the four goes, and the rest come back.
      expect(camp.banished).toContain(camp.evicted);
      expect(camp.survivors).toHaveLength(BANISH_COUNT - 1);
      expect(camp.survivors).not.toContain(camp.evicted);
      expect([...camp.survivors, camp.evicted].sort()).toEqual([...camp.banished].sort());
    }
  });

  it('elects on warmth rather than on ability', () => {
    // The whole point of the twist: this is a vote, not a competition, so the
    // strongest competitor must not be the reliable winner of it.
    house();
    const roster = [...gs.activePlayers];
    const winners = new Set();
    for (let seed = 1; seed <= 24; seed++) {
      const camp = runCampDirector({ num: 1 }, roster, { rng: lcg(seed * 3571 + 11) });
      winners.add(camp.director);
    }
    expect(winners.size, 'the same houseguest was elected every single time')
      .toBeGreaterThan(1);
  });

  it('costs the Director every one of the four', () => {
    house();
    const roster = [...gs.activePlayers];
    const before = {};
    for (const n of roster) before[n] = getBond(n, roster[0]);
    const camp = runCampDirector({ num: 1 }, roster, { rng: lcg(4242) });
    for (const name of camp.banished) {
      expect(getBond(name, camp.director),
        `${name} did not mind being named`).toBeLessThan(0);
    }
    // And surviving it binds the survivors to each other.
    if (camp.survivors.length >= 2) {
      expect(getBond(camp.survivors[0], camp.survivors[1])).toBeGreaterThan(0);
    }
  });

  it('keeps all three sets of books when it evicts before the first crown', () => {
    // The ordinary eviction path is a thousand lines below this and never runs
    // for the player Hit The Road takes, so the dispatch does the roster, the
    // eliminated list and the local house array by hand. A player off the
    // roster but missing from gs.eliminated is one the placements, the jury
    // and the finale all disagree about.
    let checked = 0;
    for (let seed = 1; seed <= 12 && !checked; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if (!week?.campDirector) continue;
      checked++;
      const gone = week.campDirector.evicted;
      expect(gone, 'nobody was evicted').toBeTruthy();
      expect(gs.activePlayers, 'still on the roster').not.toContain(gone);
      expect(gs.eliminated, 'never marked eliminated').toContain(gone);
      // And they cannot have gone on to play the first competition.
      expect(week.hoh, 'an evicted houseguest won the first HOH').not.toBe(gone);
      expect(week.finalNominees || []).not.toContain(gone);
      // Two people left the house in week one: the banished one and the vote.
      if (week.evicted) expect(week.evicted).not.toBe(gone);
    }
    expect(checked, 'the twist never ran across 12 seeds').toBe(1);
  });

  it('reaches all three writers', () => {
    let checked = 0;
    for (let seed = 1; seed <= 12 && !checked; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'camp-director');
      if (!act) continue;
      checked++;
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      for (const [label, text] of [
        ['summariseWeek', summariseWeek(week)],
        ['generateSummaryText', generateSummaryText(ep)],
      ]) {
        expect(text, `${label}: untranscribed`).toMatch(/THE CAMP DIRECTOR/);
        expect(text, `${label}: never named the Director`).toContain(act.director);
        expect(text, `${label}: never said who went`).toContain(act.evicted);
      }
      const deps = { tvState: { [`bb_cdir_${ep.num}`]: { idx: 99 } }, reveal: () => '',
        esc: s => String(s), avatar: () => '' };
      const html = rpBuildBBCampDirector(ep, act, deps);
      expect(html, 'no screen at all').toBeTruthy();
      expect(html).toContain('HIT THE ROAD');
      expect(html).toContain('DID NOT COME BACK');
    }
    expect(checked, 'the twist never ran across 12 seeds').toBe(1);
  });

  it('is registered everywhere a twist has to be', () => {
    expect(BB_TWIST_CONTRACTS['bb-camp-director']).toBeTruthy();
    expect(BB_TWIST_CONTRACTS['bb-camp-director'].rules.campDirector).toBe(true);
    expect(TWIST_CATALOG.some(t => t.id === 'bb-camp-director')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE SUMMER CAMP THEME
// ══════════════════════════════════════════════════════════════════════
describe('Summer Camp', () => {
  const theme = () => BB_THEMES['summer-camp'];

  // Same guard High Roller's carries: every card the arc books must have a
  // line in the primer that explains it. An audit found three cards on that
  // theme booked and never described, and this is the shape that stops it.
  const EXPLAINED = {
    'bb-camp-director': /Camp Director/i,
    'bb-whacktivity': /three doors|one of three/i,
    'bb-camp-comeback': /Camp Comeback/i,
    'bb-double-eviction': /double eviction|two.*one night/i,
  };

  it('is registered in the engine and offered in the config', () => {
    expect(theme(), 'the theme is not in the registry').toBeTruthy();
    expect(THEME_LIST).toContain('summer-camp');
    expect(theme().antagonist?.name).toBe('The Head Counsellor');
  });

  it('describes every card in its own arc', () => {
    const booked = [...new Set(theme().arc.filter(a => a.book).map(a => a.book))];
    const rules = theme().primer.rules.join('\n');
    for (const id of booked) {
      const probe = EXPLAINED[id];
      expect(probe, `${id} is booked by the arc and nothing here explains it`).toBeTruthy();
      expect(rules, `the primer never explains ${id}`).toMatch(probe);
    }
    expect([...booked].sort()).toEqual([...theme().books].sort());
  });

  it('books only cards that exist, with engines behind them', () => {
    for (const id of theme().books) {
      expect(TWIST_CATALOG.some(t => t.id === id), `${id} is not in the catalog`).toBe(true);
    }
  });

  it('carries the arc to the end of the season', () => {
    // High Roller's shipped stopping at fromEnd:4 and had to be sent back for
    // it. Every theme should have something in the last fortnight.
    const ends = theme().arc
      .filter(a => a.book && a.at && typeof a.at.fromEnd === 'number')
      .map(a => a.at.fromEnd);
    expect(Math.min(...ends), 'nothing is booked in the last fortnight')
      .toBeLessThanOrEqual(2);
  });

  it('turns the register with both anchor forms', () => {
    const moods = theme().arc.filter(a => a.mood === 'hostile');
    expect(moods.length, 'a frac turn alone lands after the endgame on short seasons')
      .toBeGreaterThanOrEqual(2);
    expect(moods.some(m => typeof m.at?.frac === 'number')).toBe(true);
    expect(moods.some(m => typeof m.at?.fromEnd === 'number')).toBe(true);
  });
});

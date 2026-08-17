// Making the jury, as something the house says and the game feels.
//
// Two halves, tested together because either alone is the bug: scenes that
// describe a stake nothing reads are decoration, and reads nobody narrates are
// numbers the viewer never sees.
//
// The second half of this file is a CALIBRATION, not a guard on a fixed value.
// The whole family is written to influence and never to decide — the same rule
// the competition library was rebuilt for the week before this — so what is
// asserted is that each pressure moves outcomes a little and nothing like a
// lot. Run it and read the numbers when tuning.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { HOUSE_EVENTS, assertUniqueEventIds } from '../js/bb-events/index.js';
import { JURY_BUBBLE_EVENTS } from '../js/bb-events/jury-bubble.js';
import { initialVotePreference } from '../js/bb/strategy.js';
import { bubbleCompliance, bubblePressure, juryIsOpen,
  juryManagementWeight, juryPactKeepPull, juryToGo } from '../js/bb/jury-pressure.js';
import { juryOpensAt } from '../js/bb/jury.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ryan', 'Will', 'Eva', 'Arlo'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'challenge-beast', 'perceptive-player', 'chaos-agent', 'schemer'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

const IDS = JURY_BUBBLE_EVENTS.map(e => e.id);

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'twist', bbSafetyMode: 'off', theme: '' });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

function playSeason(seed) {
  house();
  withSeededRandom(seed, () => {
    for (let i = 0; i < 30; i++) {
      if (!simulateBBEpisode()) break;
      if (gs.bb?.over) break;
    }
  });
}

beforeEach(house);

describe('the line, as arithmetic', () => {
  it('counts from the live house, and only when the season has a jury', () => {
    const opens = juryOpensAt();
    expect(opens).toBe(seasonConfig.jurySize + 2);
    expect(juryToGo(new Array(opens + 3).fill('x'))).toBe(3);
    expect(juryToGo(new Array(opens).fill('x'))).toBe(0);
    expect(juryIsOpen(new Array(opens).fill('x'))).toBe(true);
    expect(juryIsOpen(new Array(opens + 1).fill('x'))).toBe(false);
    seasonConfig.jurySize = 0;
    expect(juryToGo(new Array(9).fill('x'))).toBe(null);
    seasonConfig.jurySize = 7;
  });

  it('rings only across the few weeks it belongs to', () => {
    const opens = juryOpensAt();
    const at = n => bubblePressure(new Array(n).fill('x'));
    // Far away: silent. This is what keeps the idea out of the whole season.
    expect(at(opens + 5)).toBe(0);
    // Closing in: louder each week.
    expect(at(opens + 4)).toBeGreaterThan(0);
    expect(at(opens + 2)).toBeGreaterThan(at(opens + 4));
    expect(at(opens + 1)).toBeGreaterThan(at(opens + 2));
    // Past it: silent again, and never above 1.
    expect(at(opens)).toBe(0);
    expect(at(opens - 2)).toBe(0);
    expect(at(opens + 1)).toBeLessThanOrEqual(1);
  });
});

describe('the scenes', () => {
  it('are registered, uniquely, and declare a category the registry knows', () => {
    expect(assertUniqueEventIds()).toBe(true);
    const registered = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const id of IDS) expect(registered.has(id), `${id} is not in HOUSE_EVENTS`).toBe(true);
    for (const e of JURY_BUBBLE_EVENTS) {
      expect(['social', 'deals'], `${e.id} has an unroutable category`).toContain(e.category);
    }
  });

  it('stay silent when the season has no jury at all', () => {
    seasonConfig.jurySize = 0;
    const ctx = { act: 'house', beat: 0, hoh: 'Bowie', nominees: ['Chase', 'Ripper'],
      week: { num: 4, houseAtStart: NAMES } };
    for (const e of JURY_BUBBLE_EVENTS) {
      expect(e.weight(NAMES, ctx), `${e.id} fired in a season with no jury`).toBe(0);
    }
    seasonConfig.jurySize = 7;
  });

  it('every one of them fires, and reaches both readers', () => {
    const fired = {};
    const backlogged = {};
    const transcribed = {};
    const seasonsWith = {};
    const SEEDS = [313, 414, 515, 616, 717, 818];
    for (const seed of SEEDS) {
      playSeason(seed);
      const here = new Set();
      const beats = [];
      for (const week of gs.bb?.weeks || []) {
        for (const act of week.acts || []) {
          for (const b of act.socialBeats || []) {
            if (!IDS.includes(b.eventId)) continue;
            fired[b.eventId] = (fired[b.eventId] || 0) + 1;
            here.add(b.eventId);
            beats.push(b);
          }
        }
      }
      for (const id of here) seasonsWith[id] = (seasonsWith[id] || 0) + 1;

      const flat = t => String(t || '').replace(/\s+/g, ' ');
      let runText = '';
      for (const week of gs.bb?.weeks || []) runText += '\n' + summariseWeek(week);
      let backlog = '';
      for (const ep of gs.episodeHistory || []) backlog += '\n' + generateSummaryText(ep);
      runText = flat(runText); backlog = flat(backlog);
      for (const b of beats) {
        const probe = flat(b.text).slice(0, 40);
        if (!probe) continue;
        if (backlog.includes(probe)) backlogged[b.eventId] = (backlogged[b.eventId] || 0) + 1;
        if (runText.includes(probe)) transcribed[b.eventId] = (transcribed[b.eventId] || 0) + 1;
      }
    }

    /* eslint-disable no-console */
    console.log('\n── the jury bubble, across ' + SEEDS.length + ' played seasons ──');
    for (const id of IDS) {
      console.log(`${id.padEnd(26)} fired ${String(fired[id] || 0).padStart(3)}  `
        + `seasons ${seasonsWith[id] || 0}/${SEEDS.length}  `
        + `backlog ${String(backlogged[id] || 0).padStart(3)}  transcript ${String(transcribed[id] || 0).padStart(3)}`);
    }
    /* eslint-enable no-console */

    const dead = IDS.filter(id => !fired[id]);
    expect(dead, `never fired in a real season: ${dead.join(', ')}`).toEqual([]);
    // Written, registered and unreachable is this project's recurring bug; a
    // beat that fires and never reaches a reader is the same bug one step later.
    for (const id of IDS) {
      expect(backlogged[id] || 0, `${id} never reached the text backlog`).toBeGreaterThan(0);
      expect(transcribed[id] || 0, `${id} never reached the run transcript`).toBeGreaterThan(0);
    }
    // The one the user actually asked about has to be common enough to see.
    expect(seasonsWith['jury-counting-down'] || 0,
      'the house rarely counts down to jury at all').toBeGreaterThanOrEqual(SEEDS.length - 1);
  }, 600000);
});

describe('the pressures influence and do not decide', () => {
  const bubbleHouse = () => NAMES.slice(0, juryOpensAt() + 2);

  // ── the read that is deliberately absent ──
  //
  // "Cut them before they get a vote" was a fourth read on nominationScore, and
  // measuring it is what removed it: resentment toward the Head of Household
  // correlates at r=0.873 with the `revenge` term already in that score, so it
  // could only ever reinforce a decision. Over 138 reads at sizes up to 2.8 it
  // changed the target zero times.
  //
  // This guards the conclusion rather than the code: if a future nomination
  // term is added for the jury bubble, it has to be measured against the terms
  // already there first. jury-bury-them-first carries the pressure instead, by
  // setting a target the existing plan pull reads — and by being visible.
  it('carries the "before they can vote" pressure through a scene, not a hidden term', () => {
    const strategy = readFileSync(resolve(process.cwd(), 'js/bb/strategy.js'), 'utf8');
    expect(strategy, 'a jury term was added back to nominationScore — measure it against `revenge` first')
      .not.toMatch(/bitterJurorPull/);
    const bury = JURY_BUBBLE_EVENTS.find(e => e.id === 'jury-bury-them-first');
    expect(bury, 'the event that carries the pressure is gone').toBeTruthy();
    const src = readFileSync(resolve(process.cwd(), 'js/bb-events/jury-bubble.js'), 'utf8');
    expect(src, 'jury-bury-them-first no longer sets a target, so nothing carries the pressure')
      .toMatch(/api\.setTarget/);
  });

  it('bends the pawn ask both ways, by character', () => {
    const house = bubbleHouse();
    // The loyal soldier bends toward the chair; the villain digs in.
    const loyal = bubbleCompliance('Brightly', house, 0.8);
    const bold = bubbleCompliance('Zee', house, 0.8);
    expect(loyal).toBeGreaterThan(bold);
    // Bounded, and worth less than the trust term it sits beside.
    for (const v of [loyal, bold]) expect(Math.abs(v)).toBeLessThanOrEqual(1.2);
    // No exposure, no pressure — this is about people in trouble.
    expect(bubbleCompliance('Brightly', house, 0)).toBe(0);
  });

  it('makes a jury vote worth more once there is a jury', () => {
    expect(juryManagementWeight(NAMES)).toBeLessThan(1);
    expect(juryManagementWeight(NAMES.slice(0, juryOpensAt()))).toBeGreaterThan(1);
  });

  it('lets a jury pact cost a vote, without buying one outright', () => {
    const house = bubbleHouse();
    gs.activePlayers = [...house];
    gs.sideDeals = [{ players: [house[0], house[1]], type: 'make-jury',
      tier: 'working', active: true, genuine: true }];
    const pull = juryPactKeepPull(house[0], house[1], house);
    expect(pull).toBeGreaterThan(0);
    // A final two is 3.6 and a landed campaign 2.6 — this must not outrank them.
    expect(pull, 'a jury pact is deciding evictions').toBeLessThan(2.2);
    // A seat bought with a vote is worth less than one promised between friends.
    gs.sideDeals[0].transactional = true;
    expect(juryPactKeepPull(house[0], house[1], house)).toBeLessThan(pull);
    // Gone once they are both across the line.
    expect(juryPactKeepPull(house[0], house[1], NAMES.slice(0, juryOpensAt()))).toBe(0);
  });

  // ── the calibration ──
  //
  // Measured on PLAYED seasons, not on a fixture. A hand-seeded grudge produces
  // resentment around 1.8; a season produces a median of 0.85 with a long tail
  // to 10, and the margins it has to work against are nothing like a fixture's.
  // Sizing a read against a fixture is how the deleted fourth one shipped as
  // decoration and had to be measured a second time to find that out.
  //
  // The pact is the read most able to over-reach, because it lands on a ballot
  // where the two options are often close. What is counted is how often it is
  // large enough to change one — not whether it did on some seed, which is a
  // fact about the seed.
  it('lets the pact reach a minority of the votes it touches', () => {
    let live = 0, couldFlip = 0, votes = 0, pactsMade = 0;
    for (const seed of [313, 414, 515]) {
      house();
      withSeededRandom(seed, () => {
        for (let i = 0; i < 30; i++) {
          if (!simulateBBEpisode()) break;
          if (gs.bb?.over) break;
          pactsMade = Math.max(pactsMade, (gs.sideDeals || [])
            .filter(d => d?.type === 'make-jury').length);
          for (const week of gs.bb?.weeks || []) {
            const noms = (week.finalNominees || []).filter(Boolean);
            if (noms.length !== 2) continue;
            const voters = (week.houseAtStart || [])
              .filter(n => !noms.includes(n) && n !== week.hoh);
            for (const voter of voters) {
              const pulls = noms.map(n => juryPactKeepPull(voter, n, week.houseAtStart));
              votes++;
              if (!pulls.some(p => p > 0)) continue;
              live++;
              const { margin } = initialVotePreference(voter, noms, () => 0.5);
              // The pull only matters as the DIFFERENCE between the two chairs.
              if (Math.abs(pulls[0] - pulls[1]) > Math.abs(margin)) couldFlip++;
            }
          }
          break;   // one sweep of the ledger per episode is enough
        }
      });
    }
    /* eslint-disable no-console */
    console.log(`\njury pact was live on ${live}/${votes} ballots `
      + `(${votes ? (live / votes * 100).toFixed(1) : 0}%), and large enough to change `
      + `${couldFlip} of them`);
    /* eslint-enable no-console */
    expect(votes, 'no ballots were sampled at all').toBeGreaterThan(20);
    // Of the ballots it is live on, it must not be deciding most of them.
    const reach = live ? couldFlip / live : 0;
    expect(reach, 'a jury pact is deciding the evictions it touches').toBeLessThan(0.5);
  }, 300000);
});

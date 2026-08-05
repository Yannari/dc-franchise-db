// Per-member alliance loyalty — the number under the face.
//
// Alliances form in week one, ten seasons out of ten, averaging 2.4 of them by
// the end of the first episode. None of that was visible: the Big Brother
// visual player had no alliance surface at all (rpBuildAllianceMap is wired
// only into the Survivor branch), so the whole strategic layer was legible
// only as prose scattered through twenty-five House Life beats.
//
// Group cohesion already existed in blocs.js and answers a DIFFERENT question:
// does this six hold together, averaged over every pair. A six can measure
// warm and still contain one person at the edge of it — and that person
// decides the season. This is the per-person view, and the assertions below
// are about it behaving like loyalty rather than like a random number.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { memberLoyalty, blocRoster, listBlocs } from '../js/bb/blocs.js';
import { rpBuildBBHouseLife, rpBuildBBOverview } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
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
    bbHaveNots: 'off', bbSafetyMode: 'off', twistSchedule: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.namedAlliances = []; gs.jury = [];
}

/** A four-person alliance with no bonds set, so each test states its own. */
function bloc(members = ['Bowie', 'Chase', 'Ripper', 'Scary']) {
  return { id: 'test-bloc', name: 'The Test', kind: 'alliance', members, power: 0.5, share: 0.3 };
}

describe('what moves a member’s loyalty', () => {
  beforeEach(house);

  it('rises with how they feel about these specific people', () => {
    const b = bloc();
    const cold = memberLoyalty('Bowie', b).loyalty;
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, 8);
    const warm = memberLoyalty('Bowie', b).loyalty;
    expect(warm).toBeGreaterThan(cold);
  });

  it('reads THEIR bonds, not the group average', () => {
    // The whole reason this exists. Everybody else adores each other; Bowie
    // cannot stand any of them. Cohesion looks fine, Bowie is gone.
    const b = bloc();
    addBond('Chase', 'Ripper', 9); addBond('Chase', 'Scary', 9); addBond('Ripper', 'Scary', 9);
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, -6);
    const roster = blocRoster(b);
    expect(roster.weakest?.name, 'the odd one out was not identified').toBe('Bowie');
    const bowie = roster.members.find(m => m.name === 'Bowie');
    const chase = roster.members.find(m => m.name === 'Chase');
    expect(bowie.loyalty).toBeLessThan(chase.loyalty);
  });

  it('separates two people with identical bonds by the loyalty stat', () => {
    // Same relationships, different person. This is the difference between
    // somebody who flips and somebody who does not, and it is what the stat is
    // for — it was read in twenty-four files and shown in none.
    const b = bloc(['Bowie', 'Chase', 'Ripper']);
    for (const [a, c] of [['Bowie', 'Chase'], ['Bowie', 'Ripper'], ['Chase', 'Ripper']]) {
      addBond(a, c, 5);
    }
    const loyal = players.find(p => p.name === 'Bowie');
    const flighty = players.find(p => p.name === 'Chase');
    loyal.stats = { ...loyal.stats, loyalty: 10 };
    flighty.stats = { ...flighty.stats, loyalty: 1 };
    expect(memberLoyalty('Bowie', b).loyalty)
      .toBeGreaterThan(memberLoyalty('Chase', b).loyalty);
  });

  it('falls when their closest person in the house is outside the group', () => {
    const b = bloc();
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, 3);
    const held = memberLoyalty('Bowie', b).loyalty;
    addBond('Bowie', 'Caleb', 10); // Caleb is not in it
    const pulled = memberLoyalty('Bowie', b).loyalty;
    expect(pulled, 'somebody better outside did not loosen them').toBeLessThan(held);
  });

  it('does not punish a popular houseguest for having friends', () => {
    // Warm outside but warmer inside: that is not disloyalty, that is a
    // sociable person, and the reading has to tell the difference.
    const b = bloc();
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, 9);
    const before = memberLoyalty('Bowie', b).loyalty;
    addBond('Bowie', 'Caleb', 5);
    expect(memberLoyalty('Bowie', b).loyalty).toBe(before);
  });

  it('stays inside 0 to 10 under absurd inputs', () => {
    const b = bloc();
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, 10);
    expect(memberLoyalty('Bowie', b).loyalty).toBeLessThanOrEqual(10);
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, -20);
    const low = memberLoyalty('Bowie', b).loyalty;
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThan(3);
  });

  it('always gives a reason a viewer could read', () => {
    const b = bloc();
    for (const m of blocRoster(b).members) {
      expect(typeof m.reason).toBe('string');
      expect(m.reason.length).toBeGreaterThan(8);
    }
  });
});

describe('naming the crack', () => {
  beforeEach(house);

  it('does not invent one when everybody is equally committed', () => {
    // Somebody has to sort last. That is not a weak link, and calling it one
    // would make the flag meaningless.
    const b = bloc();
    for (const [x, y] of [['Bowie', 'Chase'], ['Bowie', 'Ripper'], ['Bowie', 'Scary'],
      ['Chase', 'Ripper'], ['Chase', 'Scary'], ['Ripper', 'Scary']]) addBond(x, y, 7);
    const roster = blocRoster(b);
    expect(roster.cracking, `invented a crack: ${roster.weakest?.name}`).toBe(false);
    expect(roster.weakest).toBeNull();
  });

  it('never calls somebody a crack while saying they are held', () => {
    // A pair where one is marginally lower than the other reported
    // "CRACK: Millie — is held by the room", which contradicts itself. A crack
    // has to be somebody actually loose, not merely whoever sorted last.
    const b = bloc(['Bowie', 'Chase']);
    addBond('Bowie', 'Chase', 9);
    const roster = blocRoster(b);
    expect(roster.cracking).toBe(false);
    for (const m of roster.members) expect(m.loyalty).toBeGreaterThan(5);
  });

  it('needs three members before a gap counts as a crack', () => {
    // In a pair one of the two is always lower; that is arithmetic, not drama.
    const pair = bloc(['Bowie', 'Chase']);
    addBond('Bowie', 'Chase', 6);
    const loyal = players.find(p => p.name === 'Bowie');
    const flighty = players.find(p => p.name === 'Chase');
    loyal.stats = { ...loyal.stats, loyalty: 10 };
    flighty.stats = { ...flighty.stats, loyalty: 4 };
    expect(blocRoster(pair).cracking).toBe(false);
  });

  it('names one when somebody is genuinely adrift', () => {
    const b = bloc();
    for (const [x, y] of [['Chase', 'Ripper'], ['Chase', 'Scary'], ['Ripper', 'Scary']]) {
      addBond(x, y, 8);
    }
    for (const other of ['Chase', 'Ripper', 'Scary']) addBond('Bowie', other, -4);
    const roster = blocRoster(b);
    expect(roster.cracking).toBe(true);
    expect(roster.weakest.name).toBe('Bowie');
  });
});

describe('in a played season', () => {
  it('reaches the episode, the transcript and the screen', () => {
    house();
    let ep = null;
    for (let seed = 1; seed <= 12 && !ep?.allianceBoard?.length; seed++) {
      house();
      ep = withSeededRandom(seed * 9, () => simulateBBEpisode());
    }
    expect(ep?.allianceBoard?.length, 'no alliance board after a played week')
      .toBeGreaterThan(0);

    const b = ep.allianceBoard[0];
    expect(b.members.length).toBeGreaterThan(1);
    for (const m of b.members) {
      expect(m.loyalty).toBeGreaterThanOrEqual(0);
      expect(m.loyalty).toBeLessThanOrEqual(10);
    }
    // Sorted firmest-first, so the board reads top to bottom.
    const vals = b.members.map(m => m.loyalty);
    expect([...vals].sort((x, y) => y - x)).toEqual(vals);

    // BOTH transcript writers. The act-coverage guard only walks act TYPES,
    // and the board is a week-level field rather than an act — which is
    // exactly how it reached the tests-facing writer and missed the in-app
    // one on the first pass.
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text, 'missing from summariseWeek').toMatch(/THE ALLIANCE BOARD/);
    const backlog = generateBBSummaryText(ep);
    expect(backlog, 'missing from the in-app text backlog').toMatch(/THE ALLIANCE BOARD/);
    for (const m of b.members) {
      expect(backlog, `${m.name} is not in the backlog board`).toContain(m.name);
      expect(backlog).toContain(m.loyalty.toFixed(1));
    }

    // No screen of its own. The number goes under the avatar in the alliance
    // panel House Life already had — one digit per face is the whole feature,
    // and a dedicated page was more furniture than it was worth.
    // Note the panel shows the alliances that existed AT THAT BEAT, which is
    // correct and is not the same list as the end-of-week board — a group that
    // formed on Wednesday is on the board and not in Monday's panel. So the
    // check is that every digit drawn is a real member's hold, not that any
    // particular group appears.
    const houseActs = (ep.acts || []).filter(a => a.type === 'house');
    const drawn = houseActs
      .map((a, i) => rpBuildBBHouseLife(ep, a, i + 1))
      .filter(html => /bbf-hold/.test(html));
    expect(drawn.length, 'no House Life panel drew a hold digit').toBeGreaterThan(0);

    const real = new Set(ep.allianceBoard
      .flatMap(x => x.members.map(m => m.loyalty.toFixed(1))));
    for (const html of drawn) {
      const digits = [...html.matchAll(/class="bbf-hold[^"]*"[\s\S]*?<b[^>]*>([\d.]+)<\/b>/g)]
        .map(m => m[1]);
      expect(digits.length).toBeGreaterThan(0);
      for (const d of digits) {
        expect(real.has(d), `${d} is not any member's hold on the board`).toBe(true);
      }
    }

    // ...and the reasoning behind the digits lives on House Status.
    const status = rpBuildBBOverview(ep, 'closing');
    expect(status).toMatch(/holding on/i);
    for (const m of b.members) expect(status).toContain(m.name);
  });

  it('leaves the alliance panel readable when a week has no board', () => {
    // Old saves and any cycle that ended before the snapshot: the panel must
    // fall back to the bare avatar rather than breaking.
    house();
    const ep = withSeededRandom(9, () => simulateBBEpisode());
    const houseAct = (ep.acts || []).find(a => a.type === 'house');
    const life = rpBuildBBHouseLife({ ...ep, allianceBoard: [] }, houseAct, 1);
    expect(life).toBeTruthy();
    expect(life).not.toMatch(/bbf-hold/);
  });

  it('leaves group cohesion alone', () => {
    // Deliberately NOT wired into _measure: cohesion feeds power, power feeds
    // targeting, and targeting feeds whole seasons. A screen is not worth
    // re-rolling every read in the house for.
    house();
    withSeededRandom(9, () => simulateBBEpisode());
    for (const b of listBlocs()) {
      expect(b.loyalty).toBeGreaterThanOrEqual(0.2);
      expect(b.loyalty).toBeLessThanOrEqual(1);
    }
  });
});

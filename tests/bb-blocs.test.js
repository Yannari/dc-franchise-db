// The house organises against its own power structures.
//
// Before this layer the storytelling ran without the strategy underneath it. A
// showmance could reach the phase where somebody says "one of them has to go",
// spend a day pulling people aside about it, and then nominate a stranger —
// because that event wrote text and nothing else. Alliances voted as blocs,
// protected their own, and were priced by the threat model as
// `alliances.length * 0.55`: two loose pairs beat sitting at the centre of a
// six that had run the last four evictions. And nothing distinguished a secret
// four from one the whole house had been shouting about.
//
// The tests below are the four claims that were false and now are not.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  listBlocs, knowledgeOf, learnAbout, observeBlocs, readVoteTells, tellAbout,
  exposeBloc, readPower, pointOfAttack, chooseBlocTarget, visibleCentrality, blocExposure,
} from '../js/bb/blocs.js';
import { seedGame } from './helpers/setup.js';

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
    twistSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off',
    romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  gs.namedAlliances = []; gs.intentions = {};
}

/** A named alliance of exactly these people. */
function alliance(name, members) {
  gs.namedAlliances.push({ name, members: [...members], active: true, formedEp: 1 });
  // Alliances are warm by construction; loyalty is read off the bonds.
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) addBond(members[i], members[j], 5);
  }
  return listBlocs().find(b => b.label === name);
}

describe('a bloc is a couple or an alliance, measured the same way', () => {
  beforeEach(house);

  it('prices a big alliance above a small one', () => {
    // The claim: "a six-person alliance gives the same individual centrality
    // increase as a two-person alliance."
    const six = alliance('The Six', NAMES.slice(0, 6));
    const two = alliance('The Pair', NAMES.slice(6, 8));
    expect(six.power).toBeGreaterThan(two.power * 2);
    expect(six.share).toBeGreaterThan(two.share);
  });

  it('treats a showmance as a voting bloc, not a storyline', () => {
    gs.showmances.push({ players: [NAMES[0], NAMES[1]], phase: 'honeymoon', sparkEp: 1 });
    addBond(NAMES[0], NAMES[1], 6);
    const couple = listBlocs().find(b => b.kind === 'couple');
    expect(couple).toBeTruthy();
    // Two people who never write each other's names down hold tighter per head
    // than any alliance does, which is why the format hunts them first.
    expect(couple.loyalty).toBeGreaterThanOrEqual(0.85);
  });
});

describe('what the house knows is not what is true', () => {
  beforeEach(house);

  it('starts a new alliance invisible', () => {
    const bloc = alliance('The Secret', NAMES.slice(0, 4));
    for (const outsider of NAMES.slice(4)) {
      expect(knowledgeOf(outsider, bloc.id), `${outsider} should not know yet`).toBe(0);
    }
    expect(blocExposure(bloc)).toBe(0);
  });

  it('gives a secret group no threat and an exposed one plenty', () => {
    // The reward for keeping it quiet, which previously did not exist: threat
    // came from `alliances.length` whether or not a soul had noticed.
    const bloc = alliance('The Quiet Four', NAMES.slice(0, 4));
    const quiet = visibleCentrality(NAMES[0]);
    expect(quiet).toBe(0);
    exposeBloc(bloc, { everybody: true, week: 3 });
    expect(visibleCentrality(NAMES[0])).toBeGreaterThan(quiet);
  });

  it('reads a vote that moved as one', () => {
    const bloc = alliance('The Bloc', NAMES.slice(0, 4));
    const before = blocExposure(bloc);
    // Four members, one name, in public.
    readVoteTells(NAMES.slice(0, 4).map(voter => ({ voter, evict: NAMES[9] }))
      .concat([{ voter: NAMES[5], evict: NAMES[8] }]), NAMES);
    expect(blocExposure(bloc)).toBeGreaterThan(before);
  });

  it('makes a group that split in public look less like a group', () => {
    const bloc = alliance('The Four', NAMES.slice(0, 4));
    NAMES.slice(4).forEach(n => learnAbout(n, bloc, 0.6, 'watched them'));
    const before = blocExposure(bloc);
    readVoteTells([
      { voter: NAMES[0], evict: NAMES[9] }, { voter: NAMES[1], evict: NAMES[8] },
      { voter: NAMES[2], evict: NAMES[9] }, { voter: NAMES[5], evict: NAMES[9] },
    ], NAMES);
    expect(blocExposure(bloc)).toBeLessThan(before);
  });
});

describe('being told is not the same as knowing', () => {
  beforeEach(house);

  it('is disbelieved when the listener does not trust the teller', () => {
    const bloc = alliance('The Group', NAMES.slice(0, 4));
    const teller = NAMES[5], listener = NAMES[6];
    learnAbout(teller, bloc, 1, 'watched them');
    addBond(teller, listener, -5);
    const result = tellAbout(teller, listener, bloc);
    expect(result.believed).toBe(false);
    // And the listener learns nothing, which is the whole point — a true thing
    // from a distrusted mouth is not information.
    expect(knowledgeOf(listener, bloc.id)).toBe(0);
  });

  it('lands when they trust the teller', () => {
    const bloc = alliance('The Group', NAMES.slice(0, 4));
    const teller = NAMES[7], listener = NAMES[8];
    learnAbout(teller, bloc, 1, 'watched them');
    addBond(teller, listener, 6);
    expect(tellAbout(teller, listener, bloc).believed).toBe(true);
    expect(knowledgeOf(listener, bloc.id)).toBeGreaterThan(0);
  });

  it('needs no belief check when it is shouted in front of everybody', () => {
    // The blowup case the user asked for: nobody is relying on a messenger.
    const bloc = alliance('The Group', NAMES.slice(0, 4));
    const hostile = NAMES.slice(4);
    hostile.forEach(n => addBond(n, NAMES[5], -6));
    exposeBloc(bloc, { everybody: true, week: 4, how: 'blowup' });
    hostile.forEach(n => expect(knowledgeOf(n, bloc.id)).toBe(1));
  });

  it('keeps a quiet discovery to the people who were in the room', () => {
    const bloc = alliance('The Group', NAMES.slice(0, 4));
    exposeBloc(bloc, { everybody: false, witnesses: [NAMES[5]], week: 4, how: 'walked in on it' });
    expect(knowledgeOf(NAMES[5], bloc.id)).toBeGreaterThan(0.5);
    expect(knowledgeOf(NAMES[6], bloc.id)).toBe(0);
  });
});

describe('knowing it turns into a name', () => {
  beforeEach(house);

  it('aims at the member with the least protection elsewhere', () => {
    const bloc = alliance('The Five', NAMES.slice(0, 5));
    // Give one member a second home, which should make them somebody else's
    // problem rather than the point of attack.
    alliance('The Other Thing', [NAMES[0], NAMES[7], NAMES[8]]);
    const observer = NAMES[9];
    learnAbout(observer, bloc, 1, 'watched them');
    const aim = pointOfAttack(observer, listBlocs().find(b => b.label === 'The Five'));
    expect(aim.target).not.toBe(NAMES[0]);
  });

  it('produces nothing while the group is still secret', () => {
    alliance('The Five', NAMES.slice(0, 5));
    // Nobody has noticed, so nobody is organising. Previously indistinguishable
    // from the layer not existing.
    expect(chooseBlocTarget(NAMES[9])).toBeNull();
  });

  it('produces a real target once the group is visible', () => {
    const bloc = alliance('The Five', NAMES.slice(0, 5));
    const observer = NAMES[9];
    learnAbout(observer, bloc, 1, 'watched them');
    const plan = chooseBlocTarget(observer);
    expect(plan).toBeTruthy();
    expect(bloc.members).toContain(plan.target);
    expect(plan.why).toBeTruthy();
  });
});

describe('it reaches the block in a real season', () => {
  it('puts bloc targets on the block and does not take the season over', () => {
    // The claim being tested is the one the user made: the house can say "one of
    // them has to go" and then nominate somebody unrelated. It should now
    // sometimes nominate the person it named — and, equally, should not
    // nominate them EVERY week, because a bloc read is one pressure among many.
    let noms = 0, blocNoms = 0;
    for (let season = 0; season < 3; season++) {
      house();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 12) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const hunted = new Set(Object.values(gs.intentions || {})
          .flatMap(plan => Object.entries(plan?.origins?.targets || {}))
          .filter(([, why]) => /break up/i.test(String(why)))
          .map(([who]) => who));
        for (const nominee of ep.finalNominees || []) {
          noms++;
          if (hunted.has(nominee)) blocNoms++;
        }
      }
    }
    expect(noms).toBeGreaterThan(10);
    expect(blocNoms, 'no nomination ever came from a bloc read').toBeGreaterThan(0);
    expect(blocNoms / noms, 'bloc reads are the only thing driving the block').toBeLessThan(0.75);
  }, 120000);
});

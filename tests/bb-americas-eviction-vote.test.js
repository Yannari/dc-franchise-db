// America's Eviction Vote — one more ballot, cast by people who are not here.
//
// BBOTT's rule: the audience votes for a nominee to evict, and that vote is
// read out in the same tally as the houseguests'. It does not replace the
// house's vote and it does not overrule it — it is one more ballot, which is
// exactly why it matters in a six-person house that splits three-three.
//
// The engine reuses js/audience.js rather than growing a second popularity
// model. A favourite vote and an eviction vote are the same machine pointed in
// opposite directions, so this runs it with `scale: -1` and the audience puts
// its weight behind evicting whoever it likes LEAST.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { runAudienceVote } from '../js/audience.js';
import { resolveWeekTwistState, BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));

function playVote(avWeight) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  const entry = { episode: 2, type: 'bb-americas-eviction-vote' };
  if (avWeight) entry.avWeight = avWeight;
  Object.assign(seasonConfig, {
    format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
    bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
    twistSchedule: [entry],
  });
  gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  simulateBBEpisode();
  const ep = simulateBBEpisode();
  return { ep, week: gs.bb.weeks[gs.bb.weeks.length - 1] };
}

describe('the contract', () => {
  it('is registered and declares the extra ballot', () => {
    expect(BB_TWIST_CONTRACTS['bb-americas-eviction-vote']).toBeTruthy();
    expect(resolveWeekTwistState(['bb-americas-eviction-vote']).rules.audienceBallot).toBe(true);
  });
});

describe('the audience model, pointed the other way', () => {
  it('votes to evict the person it likes least', () => {
    // The inversion IS the feature. Run directly so the assertion is about the
    // model rather than about one simulated week's luck.
    seedGame([
      { name: 'Loved', archetype: 'hero', gender: 'f', sexuality: 'straight', stats: spread(1) },
      { name: 'Hated', archetype: 'villain', gender: 'm', sexuality: 'straight', stats: spread(2) },
    ], { episode: 0, eliminated: [], namedAlliances: [] });
    gs.popularity = { Loved: 90, Hated: -90 };
    gs.bb = { weeks: [{ num: 1 }, { num: 2 }] };
    let hated = 0;
    for (let i = 0; i < 40; i++) {
      const seedRng = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(i + 7);
      const out = runAudienceVote({ eligible: ['Loved', 'Hated'], rng: seedRng, scale: -1 });
      if (out.winner === 'Hated') hated++;
    }
    expect(hated, 'the eviction vote was not inverted').toBeGreaterThan(35);
  });
});

describe('the week', () => {
  it('adds exactly one vote to the tally, for a nominee', () => {
    const { week } = playVote();
    const av = week.americasVote;
    expect(av, 'the audience never voted').toBeTruthy();
    expect(week.finalNominees).toContain(av.target);
    expect(av.weight).toBe(1);
    // The tally is the house's ballots PLUS America's one.
    const cast = Object.values(week.votes).reduce((a, b) => a + b, 0);
    expect(cast).toBe(week.ballots.length + av.weight);
  });

  it('never signs a ballot with a name that is not in the house', () => {
    // Everything downstream reads `ballots` as houseguests: the knowledge
    // store writes a vote fact per voter and the alliance ledger looks for who
    // flipped. A ballot signed "America" would have the house detecting a
    // betrayal by somebody who is not in it.
    const { week } = playVote();
    const house = week.houseAtStart || [];
    for (const b of week.ballots || []) {
      expect(house, `${b.voter} voted and does not live here`).toContain(b.voter);
    }
  });

  it('is one vote, not a verdict', () => {
    // The house out-votes the audience whenever it wants to, which is the
    // whole difference between a ballot and an eviction button.
    //
    // Asserted as ARITHMETIC rather than by sampling outcomes. The sampled
    // version measured ~40% disagreement over twenty seasons and would have
    // flaked roughly one run in twenty at any sample size small enough to be
    // worth running — and it was measuring the wrong thing anyway: across
    // those twenty seasons the house's own tally already agreed with the
    // audience every single time it mattered, because a house that votes 7-1
    // is not moved by one more ballot.
    const { week } = playVote();
    const av = week.americasVote;
    const houseOnly = {};
    for (const b of week.ballots || []) houseOnly[b.evict] = (houseOnly[b.evict] || 0) + 1;
    // Whoever the house was already sending, plus America's one, is the tally.
    for (const [name, n] of Object.entries(houseOnly)) {
      expect(week.votes[name]).toBe(n + (av?.target === name ? av.weight : 0));
    }
    // And the eviction is simply the top of that tally — no override anywhere.
    const top = Object.entries(week.votes).sort((a, b) => b[1] - a[1])[0][1];
    expect(week.votes[week.evicted]).toBe(top);
    // The audience cannot reach a nominee the house did not vote against at
    // all unless the house was tied, which is exactly the case it exists for.
    const spread = Object.values(houseOnly).sort((a, b) => b - a);
    if (spread.length > 1 && spread[0] - spread[1] > av.weight) {
      expect(week.evicted, 'one ballot overturned a house that was not close')
        .toBe(Object.entries(houseOnly).sort((a, b) => b[1] - a[1])[0][0]);
    }
  });

  it('lets the author lean on it harder', () => {
    const { week } = playVote(3);
    expect(week.americasVote.weight).toBe(3);
    const cast = Object.values(week.votes).reduce((a, b) => a + b, 0);
    expect(cast).toBe(week.ballots.length + 3);
  });
});

describe('reaching the audience', () => {
  it('reads the public split out in the transcript', () => {
    const { ep, week } = playVote();
    const text = generateSummaryText(ep) || '';
    expect(text).toContain("AMERICA'S EVICTION VOTE");
    expect(text).toContain(`The audience votes to evict ${week.americasVote.target}`);
    expect(text).toContain('How the public split:');
  });

  it('does not open the week with a joke about winning a competition', () => {
    // The generic dread opener has somebody quipping about whoever wins the
    // comp. Nobody wins this one — the contract supplies its own first line.
    const { ep } = playVote();
    const text = generateSummaryText(ep) || '';
    expect(text).not.toContain('gets to end somebody’s game before dinner');
    expect(text).not.toContain("gets to end somebody's game before dinner");
  });

  it('draws a screen', async () => {
    const { ep } = playVote();
    const { buildBBWeekScreens } = await import('../js/vp-screens.js');
    const screen = buildBBWeekScreens(ep).find(s => s.id === 'bb-avote');
    expect(screen, 'the audience voted and drew nothing').toBeTruthy();
    expect(screen.label).toBe("America's Vote");
  });
});

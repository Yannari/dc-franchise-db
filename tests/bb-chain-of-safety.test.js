// The Chain of Safety — nobody is nominated, they are left over.
//
// Big Brother Canada's twist, in both of its documented variants: BBCan10 ran
// a safety competition to crown the first link, BBCan11 gave it to the sitting
// Head of Household. Everything after that first link is identical, which is
// why the variant is a flag here rather than a second engine.
//
// The thing most worth guarding is the SUBTRACTION. This twist removes the
// nomination ceremony and the veto, and a half-applied version of it — the
// chain running AND a Head of Household turning keys on two people they never
// chose — is worse than not having the twist at all, because every screen and
// every line of the transcript would then be telling the house something
// untrue about who did this to them.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { runChainOfSafety, chainFallout, CHAIN_FLOOR } from '../js/bb/chain-of-safety.js';
import { getBond as rawBond } from '../js/bonds.js';
import { resolveWeekTwistState, BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 14 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));

/** Week one plain, week two the chain. Returns { ep, week }. */
function playChain(chainStart = 'safety-comp') {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(seasonConfig, {
    format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
    bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
    twistSchedule: [{ episode: 2, type: 'bb-chain-of-safety', chainStart }],
  });
  gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  simulateBBEpisode();
  const ep = simulateBBEpisode();
  return { ep, week: gs.bb.weeks[gs.bb.weeks.length - 1] };
}

describe('the contract', () => {
  it('declares what the chain takes away', () => {
    expect(BB_TWIST_CONTRACTS['bb-chain-of-safety']).toBeTruthy();
    const { rules } = resolveWeekTwistState(['bb-chain-of-safety']);
    expect(rules.chainOfSafety).toBe(true);
    // No veto is not decoration — the block it produces is final.
    expect(rules.vetoCount).toBe(0);
  });

  it('tells the house the rule before it happens to them', () => {
    const { announcements } = resolveWeekTwistState(['bb-chain-of-safety']);
    const a = announcements.find(x => x.twist === 'bb-chain-of-safety');
    expect(a, 'the house was never told').toBeTruthy();
    expect(a.rule).toMatch(/no nomination ceremony/i);
  });
});

describe('the chain itself', () => {
  it('runs the whole house down to exactly three', () => {
    const { week } = playChain();
    const c = week.chainOfSafety;
    expect(c, 'no chain ran').toBeTruthy();
    const house = c.order.length + c.leftover.length;
    expect(c.leftover).toHaveLength(CHAIN_FLOOR);
    expect(house, 'the chain lost or invented a houseguest')
      .toBe(week.houseAtStart.length);
    // Everybody appears exactly once across the chain and the leftovers.
    expect(new Set([...c.order, ...c.leftover]).size).toBe(house);
  });

  it('hands each link to the person the previous link chose', () => {
    const { week } = playChain();
    const c = week.chainOfSafety;
    // The picker of link N is the person chosen at link N-1. If this ever
    // breaks, the chain is a list of names rather than a chain.
    c.links.forEach((l, i) => {
      const expected = i === 0 ? c.starter : c.links[i - 1].chosen;
      expect(l.picker, `link ${i + 2} was handed out by the wrong person`).toBe(expected);
      expect(c.order[i + 1]).toBe(l.chosen);
    });
    // Nobody picks themselves, and nobody is picked twice.
    for (const l of c.links) expect(l.picker).not.toBe(l.chosen);
    expect(new Set(c.links.map(l => l.chosen)).size).toBe(c.links.length);
  });

  it('starts where the author said it starts', () => {
    const hoh = playChain('hoh');
    expect(hoh.week.chainOfSafety.variant).toBe('hoh');
    expect(hoh.week.chainOfSafety.starter, 'the HOH variant did not start with the HOH')
      .toBe(hoh.week.hoh);
    expect(hoh.week.chainOfSafety.openingComp).toBeNull();

    const comp = playChain('safety-comp');
    expect(comp.week.chainOfSafety.variant).toBe('safety-comp');
    // A competition happened and the person who won it holds the first link.
    const oc = comp.week.chainOfSafety.openingComp;
    expect(oc, 'no safety competition was staged').toBeTruthy();
    expect(oc.placements[0]).toBe(comp.week.chainOfSafety.starter);
  });

  it('nominates the two who lose the second competition, and only those two', () => {
    const { week } = playChain();
    const c = week.chainOfSafety;
    expect(c.finalComp.placements[0]).toBe(c.safetyWinner);
    expect(c.nominees).toHaveLength(2);
    expect(c.nominees).not.toContain(c.safetyWinner);
    for (const n of c.nominees) expect(c.leftover).toContain(n);
    // And the week agrees — initial and final, because there is no veto in
    // between them to change anything.
    expect(week.initialNominees.sort()).toEqual([...c.nominees].sort());
    expect(week.finalNominees.sort()).toEqual([...c.nominees].sort());
    expect(week.evicted, 'somebody outside the block was evicted')
      .toSatisfy(n => c.nominees.includes(n));
  });

  it('is too small a house to be worth running below six', () => {
    // At five, "the last three" is most of the room and the chain stops being
    // a selection at all.
    expect(runChainOfSafety({ house: ['a', 'b', 'c', 'd', 'e'], hoh: 'a' })).toBeNull();
  });
});

describe('what it takes away', () => {
  it('runs no veto at all', () => {
    const { week } = playChain();
    expect(week.vetoWinner).toBeNull();
    expect(week.vetoCompetition).toBeNull();
    expect((week.acts || []).map(a => a.type)).not.toContain('veto');
  });

  it('holds no nomination ceremony, and is not announced as an Instant Eviction', () => {
    const { week } = playChain();
    const types = (week.acts || []).map(a => a.type);
    expect(types, 'a Head of Household turned keys on a block they never chose')
      .not.toContain('nominations');
    // The chain removes the veto the same way an Instant Eviction does, and
    // that made it borrow the Instant Eviction's act — a screen and a
    // transcript both telling the house the HOH's nominations were standing.
    expect(types, 'the chain was announced as an Instant Eviction').not.toContain('instant-eviction');
    expect(types).toContain('chain-of-safety');
  });

  it('does not bill the Head of Household for a block they did not choose', () => {
    // The nomination fallout charges the crown for the bond damage of putting
    // somebody up. Nobody put these two up, so charging it here would make the
    // house resent a person who never made a decision about them.
    const { week } = playChain();
    expect(week.nomFallout || []).toHaveLength(0);
  });
});

describe('reaching the audience', () => {
  it('prints the whole pick order in the transcript', () => {
    const { ep, week } = playChain();
    const c = week.chainOfSafety;
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('THE CHAIN OF SAFETY');
    // Every link, named, with who handed it over — the order IS the document.
    for (const l of c.links) {
      expect(text, `${l.chosen} was saved and the transcript never said by whom`)
        .toContain(`${l.chosen} — chosen by ${l.picker}`);
    }
    expect(text).toContain(`Chosen by nobody: ${c.leftover.join(', ')}`);
    expect(text).toContain(`${c.nominees.join(' and ')} are the nominees`);
  });

  it('draws the chain on a screen', async () => {
    const { ep, week } = playChain();
    const { buildBBWeekScreens } = await import('../js/vp-screens.js');
    const screens = buildBBWeekScreens(ep);
    const chain = screens.find(s => s.id === 'bb-chain');
    expect(chain, 'the chain ran and had no screen').toBeTruthy();
    expect(chain.label).toBe('Chain of Safety');
    expect(chain.html.length).toBeGreaterThan(500);
    // The screen must not draw the block before anything is revealed — the
    // whole reveal is worthless if the leftovers are on screen from step one.
    expect(chain.html).not.toContain('CHOSEN BY NOBODY');
    for (const n of week.chainOfSafety.nominees) {
      expect(chain.html, 'the screen named a nominee before the first reveal')
        .not.toContain(`>${n}<`);
    }
  });
});

describe('as the back half of a double eviction', () => {
  // Which is how the show ran it. Booked as a STYLE on the double rather than
  // as a second twist to schedule, because a chain in the second cycle is one
  // night, not two.
  it('runs the second cycle as a chain', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
      twistSchedule: [{ episode: 2, type: 'bb-double-eviction', deStyle: 'chain' }],
    });
    gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
      threatScore, getBond, getPerceivedBond, ordinal });
    simulateBBEpisode();
    const ep = simulateBBEpisode();
    const second = gs.bb.weeks[gs.bb.weeks.length - 1];

    expect(ep.doubleEvictionStyle).toBe('chain');
    // Two people leave the house on this night, as on any double.
    expect(ep.eliminated).toBeTruthy();
    expect(ep.alsoEliminated).toBeTruthy();
    expect(ep.alsoEliminated).not.toBe(ep.eliminated);

    // And the SECOND cycle is the chain: its own Head of Household starts it,
    // and the block is what the chain left over.
    const c = second.chainOfSafety;
    expect(c, 'the second cycle ran no chain').toBeTruthy();
    expect(c.starter).toBe(second.hoh);
    expect(second.finalNominees.sort()).toEqual([...c.nominees].sort());
    expect(c.nominees).toContain(ep.alsoEliminated);
    // The first cycle is an ordinary week and keeps its ceremony.
    const seg1 = (ep.acts || []).filter(a => (a.segment || 1) === 1).map(a => a.type);
    expect(seg1).toContain('nominations');
  });
});

describe('what the chain costs everybody in it', () => {
  // The first version priced this thinly: a flat bond bump for being picked,
  // one bond hit for one person per pick, and nothing at all afterwards. In a
  // fourteen-person house that meant most of the room went through the most
  // public night of the season owing nobody anything.

  it('never says the same thing twice about eleven different picks', () => {
    // ELEVEN picks out of four lines is each line three times, which is what
    // the first version shipped and what reading a real chain showed.
    const { week } = playChain();
    const c = week.chainOfSafety;
    const picks = (c.beats || []).filter(b => b.badgeText === 'SAFE').map(b => b.text);
    expect(picks.length).toBeGreaterThan(6);
    expect(new Set(picks).size, 'the chain repeated itself').toBe(picks.length);
  });

  it('pays gratitude by WHEN the name came, not just that it came', () => {
    // Being handed safety second is a different gift from being handed it
    // eleventh, when the person doing it had already gone past the whole room.
    //
    // Measured as a DELTA on a house with no history, because comparing raw
    // bonds afterwards would pass just as happily on the flat +2 this used to
    // pay — the two numbers would simply be equal.
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [{ num: 1 }], stats: {}, house: null };
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    const house = CAST.map(p => p.name);
    const before = {};
    for (const a of house) for (const b of house) before[`${a}|${b}`] = rawBond(a, b);
    const rng = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(31);
    const c = runChainOfSafety({ week: { num: 1 }, house, hoh: house[0], rng, variant: 'hoh' });
    expect(c.links.length).toBeGreaterThan(4);
    // Averaged over the first third against the last third, because addBond
    // scales every delta by the pair's own relationship: a single early pick
    // against a single late one is mostly that scaling, and comparing just
    // those two passed happily on the flat +2 this replaced.
    const gain = l => rawBond(l.picker, l.chosen) - before[`${l.picker}|${l.chosen}`];
    const third = Math.max(1, Math.floor(c.links.length / 3));
    const mean = ls => ls.reduce((a, l) => a + gain(l), 0) / ls.length;
    const early = mean(c.links.slice(0, third));
    const late = mean(c.links.slice(-third));
    expect(early, 'an early pick bought nothing').toBeGreaterThan(0);
    expect(early - late, 'being picked first paid the same as being picked last')
      .toBeGreaterThan(0.5);
  });

  it('charges every person who was passed over, not only the narrated one', () => {
    const { week } = playChain();
    const c = week.chainOfSafety;
    expect(c.slights, 'nobody was recorded as passed over').toBeTruthy();
    const narrated = (c.beats || []).filter(b => b.badgeText === 'PASSED OVER').length;
    expect(c.slights.length, 'only the narrated slights were applied')
      .toBeGreaterThanOrEqual(narrated);
    // Each recorded slight names a real pair from the chain, and the person
    // passed over was genuinely still unsafe at that moment.
    for (const sl of c.slights) {
      expect(c.order).toContain(sl.picker);
      expect(c.order.indexOf(sl.passed) === -1 || c.order.indexOf(sl.passed) > sl.position - 1)
        .toBe(true);
    }
  });

  it('keeps the prose selective even though the cost is not', () => {
    // Eleven snubs narrated beside eleven saves is unreadable. The cap is the
    // point: consequences broad, prose chosen.
    const { week } = playChain();
    const narrated = (week.chainOfSafety.beats || [])
      .filter(b => b.badgeText === 'PASSED OVER').length;
    expect(narrated).toBeLessThanOrEqual(4);
  });
});

describe('the house afterwards', () => {
  it('reacts to it at all', () => {
    // It shipped with no aftermath: eleven people made a public choice about
    // each other and the week simply carried on.
    const { week } = playChain();
    const act = (week.acts || []).find(a => a.chainFallout);
    expect(act, 'the house said nothing about the chain').toBeTruthy();
    expect(act.type, 'the fallout needs its own screen instead of reusing house life')
      .toBe('house');
    expect((act.socialBeats || []).length).toBeGreaterThan(2);
  });

  it('lets the nominees say the thing only this twist produces', () => {
    // On an ordinary week you can hate the Head of Household. Here the whole
    // house did it to you one at a time and there is nobody to campaign to.
    const { week } = playChain();
    const act = (week.acts || []).find(a => a.chainFallout);
    const said = (act.socialBeats || []).filter(b => b.badgeText === 'NOBODY PUT ME HERE');
    expect(said.length, 'neither nominee reacted').toBeGreaterThan(0);
    for (const b of said) {
      expect(week.chainOfSafety.nominees.some(n => b.players.includes(n))).toBe(true);
    }
    // Two nominees must not be handed the identical line.
    expect(new Set(said.map(b => b.text)).size).toBe(said.length);
  });

  it('says nothing when there was no chain to react to', () => {
    expect(chainFallout(null)).toBeNull();
    expect(chainFallout({ links: [] })).toBeNull();
  });

  it('puts the fallout in front of the viewer', async () => {
    const { ep, week } = playChain();
    const vp = await import('../js/vp-screens.js');
    vp.buildBBWeekScreens(ep);
    for (const k of Object.keys(vp._tvState)) {
      const st = vp._tvState[k];
      if (st && typeof st === 'object' && 'idx' in st) st.idx = 9999;
    }
    const html = vp.buildBBWeekScreens(ep).map(x => x.html || '').join(' ')
      .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const act = (week.acts || []).find(a => a.chainFallout);
    for (const b of act.socialBeats || []) {
      const probe = b.text.slice(0, 40).replace(/\s+/g, ' ');
      expect(html, `the house said "${probe}" and no screen showed it`).toContain(probe);
    }
  });
});

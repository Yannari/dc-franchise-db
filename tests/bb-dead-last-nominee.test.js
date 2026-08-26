// Dead Last Nominee — the scoreboard fills one of the chairs.
//
// A rule rather than a ceremony: whoever finishes last in the Head of
// Household competition is nominated before anybody speaks, and the Head of
// Household is left with one name to give instead of two.
//
// It reserves a seat rather than adding one, which is the same mechanism the
// Den of Temptation's curse already uses — so the block stays the size the
// season says it is, and the thing worth guarding is that the Head of
// Household is never credited with a chair they did not fill.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { resolveWeekTwistState, BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));

function playDeadLast() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(seasonConfig, {
    format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
    bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
    twistSchedule: [{ episode: 2, type: 'bb-dead-last-nominee' }],
  });
  gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  simulateBBEpisode();
  const ep = simulateBBEpisode();
  const week = gs.bb.weeks[gs.bb.weeks.length - 1];
  const comp = (week.acts || []).find(a => a.type === 'hoh')?.competition || null;
  return { ep, week, comp };
}

describe('the contract', () => {
  it('is registered, and says what it changes', () => {
    expect(BB_TWIST_CONTRACTS['bb-dead-last-nominee']).toBeTruthy();
    expect(resolveWeekTwistState(['bb-dead-last-nominee']).rules.deadLastNominee).toBe(true);
    // It does NOT remove the veto. Everything else about the week is ordinary.
    expect(resolveWeekTwistState(['bb-dead-last-nominee']).rules.vetoCount)
      .toBe(resolveWeekTwistState([]).rules.vetoCount);
  });
});

describe('the rule', () => {
  it('nominates whoever actually came last', () => {
    const { week, comp } = playDeadLast();
    expect(comp, 'no competition to come last in').toBeTruthy();
    const last = comp.placements[comp.placements.length - 1];
    expect(week.deadLastNominee).toBe(last);
    expect(week.initialNominees).toContain(last);
  });

  it('fills a chair instead of adding one', () => {
    // The block is the size it would have been anyway — the Head of Household
    // just gets one fewer name on it.
    const { week } = playDeadLast();
    expect(week.initialNominees).toHaveLength(2);
    const nomAct = (week.acts || []).find(a => a.type === 'nominations');
    expect(nomAct, 'no ceremony was held').toBeTruthy();
    expect(nomAct.deadLastChair).toBe(week.deadLastNominee);
    // And the ceremony credits the Head of Household with ONE name.
    expect(nomAct.hohNominees).toHaveLength(1);
    expect(nomAct.hohNominees).not.toContain(week.deadLastNominee);
  });

  it('leaves the veto alone', () => {
    const { week } = playDeadLast();
    expect((week.acts || []).map(a => a.type)).toContain('veto');
    expect(week.finalNominees.length).toBeGreaterThanOrEqual(2);
  });

  it('never takes the crown or somebody already safe', () => {
    const { week, comp } = playDeadLast();
    expect(week.deadLastNominee).not.toBe(week.hoh);
    expect(comp.placements).toContain(week.deadLastNominee);
  });
});

describe('reaching the audience', () => {
  it('says so in the transcript, with the placing that caused it', () => {
    const { ep, week, comp } = playDeadLast();
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('DEAD LAST');
    expect(text).toContain(
      `${week.deadLastNominee} finished ${comp.placements.length} of ${comp.placements.length}`);
  });

  it('has the Head of Household ask for one person, not two', () => {
    // The ceremony script floored its own count and promised "two people" and
    // "two keys" before turning a single key. Any week where something else
    // filled a chair hit it.
    const { ep } = playDeadLast();
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('to nominate one person for eviction');
    expect(text).toContain('I will turn one key to lock in my');
    expect(text).not.toContain('one people');
    expect(text).not.toContain('one keys');
  });

  it('does not announce a week with a veto as a week without one', () => {
    // Every twist declaring the 'dread' register inherited the Instant
    // Eviction's line about there being no veto to hide behind. This week has
    // one, and the house's best strategist was announcing otherwise hours
    // before playing in it.
    const { ep } = playDeadLast();
    const text = generateSummaryText(ep) || '';
    expect(text).not.toContain('no veto to hide behind');
  });

  it('draws a screen, and does not give the name away on it', async () => {
    const { ep, week } = playDeadLast();
    const vp = await import('../js/vp-screens.js');
    const screen = vp.buildBBWeekScreens(ep).find(s => s.id === 'bb-deadlast');
    expect(screen, 'the scoreboard nominated somebody and drew nothing').toBeTruthy();
    expect(screen.html).toContain('LAST PLACE TAKES A CHAIR');
    // Unrevealed, the card must not name them — the reveal is the whole point.
    expect(screen.html, 'the screen named them before the first reveal')
      .not.toContain(week.deadLastNominee);
    // Revealed, it must.
    vp._tvState[`bb_dl_${ep.num}`] = { idx: 9 };
    const shown = vp.buildBBWeekScreens(ep).find(s => s.id === 'bb-deadlast');
    expect(shown.html).toContain(week.deadLastNominee);
  });
});

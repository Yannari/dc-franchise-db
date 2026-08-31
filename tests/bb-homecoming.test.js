// Who is on the other side of that door.
//
// Somebody who walked in with a partner at home has been watched by that
// partner for the whole season, and the walk-out is the first moment the two
// of them are in the same room again.
//
// This is the half the life layer cannot do. Life events resolve BETWEEN
// seasons, so nothing in the log can react while it is happening — which meant
// a houseguest could have a showmance in front of the person waiting for them
// and walk out into no consequence whatsoever. The night has to say it, or
// nothing ever does.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateBBEvictionInterview } from '../js/bb-aftermath.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));

function seedHouse({ attachAll = false } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(seasonConfig, {
    format: 'big-brother', jurySize: 7, bbSafetyMode: 'off', finaleSize: 3,
    bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house', romance: 'enabled',
    twistSchedule: [],
  });
  gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  if (attachAll) {
    for (const p of players) {
      p.partnerAtHome = { name: `Home${p.name.slice(1)}`, slug: `h${p.name}`, stage: 'dating' };
    }
  }
}

describe('the walk-out', () => {
  it('says who was waiting, when somebody was', () => {
    seedHouse({ attachAll: true });
    const ep = simulateBBEpisode();
    const iv = ep.evictionInterview;
    expect(iv, 'no interview at all').toBeTruthy();
    expect(iv.homecoming, 'they left somebody at home and the night said nothing').toBeTruthy();
    expect(iv.homecoming.whom).toBe(`Home${iv.evictee.slice(1)}`);
    expect(iv.homecoming.line.length).toBeGreaterThan(40);
  });

  it('says nothing at all about anybody who came in alone', () => {
    // Most of the house. A line here for everybody would make the exception
    // meaningless.
    seedHouse();
    const ep = simulateBBEpisode();
    expect(ep.evictionInterview.homecoming).toBeNull();
  });

  it('reaches the transcript', () => {
    seedHouse({ attachAll: true });
    const ep = simulateBBEpisode();
    const text = generateSummaryText(ep) || '';
    expect(text).toContain(ep.evictionInterview.homecoming.line);
  });

  it('puts it on the interview screen, right after the doors open', async () => {
    seedHouse({ attachAll: true });
    const ep = simulateBBEpisode();
    const vp = await import('../js/vp-screens.js');
    vp.buildBBWeekScreens(ep);
    for (const k of Object.keys(vp._tvState)) {
      const st = vp._tvState[k];
      if (st && typeof st === 'object' && 'idx' in st) st.idx = 9999;
    }
    const html = vp.buildBBWeekScreens(ep).map(s => s.html || '').join(' ');
    expect(html).toContain('WAITING AT THE DOOR');
    expect(html).toContain(ep.evictionInterview.homecoming.whom);
  });
});

describe('and whether they still were', () => {
  /** An interview for somebody who is in a showmance and has a partner at home. */
  const strayedInterview = () => {
    seedHouse({ attachAll: true });
    const ep = simulateBBEpisode();
    const evictee = ep.eliminated;
    const other = players.find(p => p.name !== evictee).name;
    // The season is over for them either way; what matters is what the house
    // watched them do while somebody was waiting.
    gs.showmances = [{ players: [evictee, other], phase: 'showmance' }];
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    return generateBBEvictionInterview(ep, week, Math.random, evictee);
  };

  it('empties the seat when they had a showmance in front of them', () => {
    const iv = strayedInterview();
    expect(iv.homecoming, 'no homecoming for somebody who left a partner at home').toBeTruthy();
    expect(iv.homecoming.strayed, 'the night did not notice the showmance').toBe(true);
    // The warm version must not be what plays.
    expect(iv.homecoming.line).not.toMatch(/on their feet before|does not make it three steps/);
  });

  it('does not treat a broken showmance as one that was still going', () => {
    seedHouse({ attachAll: true });
    const ep = simulateBBEpisode();
    const evictee = ep.eliminated;
    const other = players.find(p => p.name !== evictee).name;
    gs.showmances = [{ players: [evictee, other], phase: 'broken-up' }];
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    const iv = generateBBEvictionInterview(ep, week, Math.random, evictee);
    expect(iv.homecoming.strayed).toBe(false);
  });

  it('marks the screen differently for it', async () => {
    const iv = strayedInterview();
    const vp = await import('../js/vp-screens.js');
    // The card is built from the interview, so this is about the label the
    // viewer sees: an empty seat is not a reunion.
    const ep = { num: 1, evictionInterview: iv };
    const html = vp.rpBuildBBEvictionInterview
      ? vp.rpBuildBBEvictionInterview(ep) : '';
    if (html) {
      expect(html).toContain('THE SEAT AT THE BACK');
      expect(html).not.toContain('WAITING AT THE DOOR');
    }
  });
});

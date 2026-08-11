// The Sanctum — the night the ballot stops being secret.
//
// BB27's final week: the Mastermind ran it out of a room the house had not been
// shown, with voodoo dolls in place of the nomination keys, and the eviction
// vote cast in public by pushing a pin into somebody in front of the room.
//
// The mechanic is a SUBTRACTION, which is what makes it worth having. Almost
// everything this game does with suspicion is downstream of the ballot being
// private: detection is a probability, an alliance that comes up one short
// blames the wrong chair, and an unseen flip is the best week of somebody's
// game. For one night none of that applies, and what these tests pin is that
// the absence actually reaches those systems rather than just the narration.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs, TWIST_CATALOG,
  resolveTwistSchedule } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState, BASE_WEEK_RULES } from '../js/bb/twist-contract.js';
import { simulateBBEpisode, bbTwistsForWeek } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: '', ...extra });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

/** Play until the scheduled Sanctum week has happened, and hand back its week. */
// Week 7 rather than week 2, and that matters: the claim this file exists to
// test is about BETRAYAL, and a house two weeks old has no alliances to betray.
// Scheduled early, every seed came back with nothing to check — which the
// counter at the bottom caught rather than passing quietly.
function playToSanctum(seed = 606, epNum = 7) {
  seasonConfig.twistSchedule = [{ id: 's1', episode: epNum, type: 'bb-sanctum-week' }];
  let week = null;
  withSeededRandom(seed, () => {
    for (let i = 0; i < 12; i++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      week = (gs.bb.weeks || []).find(w => w.publicVote);
      if (week) break;
      if (gs.bb?.over) break;
    }
  });
  return week;
}

beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); });

describe('the card', () => {
  it('is in the catalogue and has a contract', () => {
    const card = TWIST_CATALOG.find(c => c.id === 'bb-sanctum-week');
    expect(card).toBeTruthy();
    expect(card.format).toBe('big-brother');
    expect(BB_TWIST_CONTRACTS['bb-sanctum-week']).toBeTruthy();
  });

  it('announces itself, because the weight of it is knowing in advance', () => {
    const c = BB_TWIST_CONTRACTS['bb-sanctum-week'];
    expect(c.acquisition.secrecy).toBe('public');
    expect(c.announcement.rule).toMatch(/no secret ballot/i);
    const { announcements } = resolveWeekTwistState(['bb-sanctum-week']);
    expect(announcements.map(a => a.twist)).toContain('bb-sanctum-week');
  });

  it('turns the rule on, and nothing else does', () => {
    expect(BASE_WEEK_RULES.publicVote).toBe(false);
    expect(resolveWeekTwistState(['bb-sanctum-week']).rules.publicVote).toBe(true);
    expect(resolveWeekTwistState([]).rules.publicVote).toBe(false);
    // Every other card leaves the ballot alone.
    for (const id of Object.keys(BB_TWIST_CONTRACTS)) {
      if (id === 'bb-sanctum-week') continue;
      expect(resolveWeekTwistState([id]).rules.publicVote,
        `${id} opened the ballot`).toBe(false);
    }
  });

  // The user runs the Block Buster every season, so a finale that cannot sit
  // beside it is a finale they never see. The Block Buster decides who is
  // still on the block when the room is called down — that is upstream of the
  // vote, and this twist only owns the vote.
  it('runs beside the Block Buster', () => {
    const cfg = { ...seasonConfig, bbSafetyMode: 'block-buster' };
    expect(resolveTwistSchedule(['bb-sanctum-week'], cfg)).toEqual(['bb-sanctum-week']);
  });

  it('refuses to share a night with anything else that owns the vote', () => {
    const card = TWIST_CATALOG.find(c => c.id === 'bb-sanctum-week');
    for (const other of ['bb-double-eviction', 'bb-instant-eviction', 'bb-no-eviction']) {
      expect(card.incompatible, `${other} may share the night`).toContain(other);
    }
  });
});

describe('the night itself', () => {
  it('is scheduled, reaches the week, and produces an order', () => {
    const week = playToSanctum();
    expect(week, 'no week ever ran public').toBeTruthy();
    expect(bbTwistsForWeek(7)).toContain('bb-sanctum-week');
    const act = (week.acts || []).find(a => a.type === 'eviction');
    expect(act.publicVote).toBe(true);
    expect(act.sanctumOrder.length).toBe(act.ballots.length);
    // A running order, not a re-print of the ballots: every voter once, in
    // positions 1..n.
    expect(act.sanctumOrder.map(v => v.position)).toEqual(
      act.sanctumOrder.map((_, i) => i + 1));
    expect(new Set(act.sanctumOrder.map(v => v.voter)).size).toBe(act.ballots.length);
    for (const v of act.sanctumOrder) {
      expect(act.ballots.find(b => b.voter === v.voter).evict).toBe(v.evict);
    }
  });

  it('marks the chairs that voted into a result already decided', () => {
    const week = playToSanctum();
    const act = (week.acts || []).find(a => a.type === 'eviction');
    // Whoever votes after the majority has landed is voting in front of
    // somebody who knows they are already going. Not every night has one —
    // a unanimous late order can decide on the last chair — but when it does,
    // it must be the LATER positions, never an early one.
    const decided = act.sanctumOrder.filter(v => v.afterDecided);
    for (const v of decided) {
      expect(v.position).toBeGreaterThan(Math.floor(act.ballots.length / 2));
    }
  });

  it('replays identically from the same seed', () => {
    const a = playToSanctum(909).acts.find(x => x.type === 'eviction').sanctumOrder
      .map(v => `${v.position}${v.voter}`).join('|');
    house();
    const b = playToSanctum(909).acts.find(x => x.type === 'eviction').sanctumOrder
      .map(v => `${v.position}${v.voter}`).join('|');
    expect(b).toBe(a);
  });
});

// The whole argument for the twist. If this does not hold, the Sanctum is a
// different-looking eviction screen and nothing more.
describe('there is nothing left to work out', () => {
  it('leaves no betrayal unseen and nobody wrongly suspected', () => {
    let checked = 0;
    for (const seed of [606, 707, 808, 909, 1010]) {
      house();
      const week = playToSanctum(seed);
      if (!week) continue;
      for (const alliance of (gs.bb?.alliances || gs.namedAlliances || [])) {
        for (const b of alliance.betrayals || []) {
          if (b.week !== week.num) continue;
          checked++;
          expect(b.known, 'a flip went unseen on a night everybody watched').toBe(true);
        }
      }
      // And the beats that only exist for an unseen flip must be absent.
      const text = (week.acts || []).flatMap(a => a.beats || [])
        .map(x => `${x.eventId || ''} ${x.badgeText || ''}`).join(' ');
      expect(text).not.toContain('alliance-betrayal-unseen');
      expect(text).not.toContain('WRONG SUSPECT');
      expect(text).not.toContain('UNDER THE BUS');
    }
    expect(checked, 'no betrayals happened in any seed, so this proved nothing')
      .toBeGreaterThan(0);
  });
});

describe('it reaches every reader', () => {
  it('has a screen', () => {
    const week = playToSanctum();
    const ep = gs.episodeHistory[week.num - 1] || gs.episodeHistory[gs.episodeHistory.length - 1];
    const screens = buildVPScreens(ep);
    const sanctum = screens.find(s => /sanctum/i.test(s.id) || s.label === 'The Sanctum');
    expect(sanctum, 'no Sanctum screen was registered').toBeTruthy();
    expect(sanctum.html).toContain('bbsc-doll');
    expect(sanctum.html).toContain('The Sanctum');
  });

  // Both writers, always. A beat in only one of them is a beat half the
  // readers never see.
  it('is in both transcripts', () => {
    const week = playToSanctum();
    const ep = gs.episodeHistory[week.num - 1] || gs.episodeHistory[gs.episodeHistory.length - 1];
    const backlog = generateSummaryText(ep);
    expect(backlog).toMatch(/THE SANCTUM/);
    expect(backlog).toMatch(/puts the pin into/);
    const runText = gs.bb.transcript || '';
    if (runText) expect(runText).toMatch(/THE SANCTUM/);
  });
});

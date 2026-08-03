// The Battle Back — the return slice.
//
// The twist that puts somebody BACK, which is the first time this engine has
// had to un-do a departure. What these guard is mostly the bookkeeping, since
// a half-reversed eviction is the kind of bug that only shows up at the finale
// when a player who is still in the house votes on the jury.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, bbCompetitionsForSlot, BB_TWIST_IDS, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { runBattleBack, battleBackField } from '../js/bb/battle-back.js';
import { seatBBJury } from '../js/bb-finale.js';
import { resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({ name, gender: i % 2 ? 'f' : 'm', sexuality: 'straight',
    archetype: ['mastermind','hero','floater','villain'][i % 4] }));

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    twistSchedule: [], bbCompSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, returns: [] };
  gs.episodeHistory = [];
  gs.jury = [];
}

/** A house with three people already evicted, ready to fight their way back. */
function houseWithEvictees() {
  gs.activePlayers = ['A','B','C','D','E','F','G','H','I'];
  gs.eliminated = ['J','K','L'];
  gs.bb.weeks = [
    { num: 1, evicted: 'J', ballots: [{ voter:'A', evict:'J' }, { voter:'B', evict:'J' }, { voter:'C', evict:'D' }] },
    { num: 2, evicted: 'K', ballots: [{ voter:'A', evict:'K' }] },
    { num: 3, evicted: 'L', ballots: [{ voter:'B', evict:'L' }] },
  ];
}

describe('battle back', () => {
  beforeEach(reset);

  it('is registered as a house twist and adds the return slot', () => {
    expect(BB_TWIST_IDS.has('bb-battle-back')).toBe(true);
    const state = resolveWeekTwistState(['bb-battle-back']);
    expect(state.rules.addSlots).toContain('return');
    // A public twist announces itself — the house is told the door exists.
    expect(state.announcements.some(a => a.twist === 'bb-battle-back')).toBe(true);
  });

  it('fields the evictees in eviction order and never anybody still playing', () => {
    houseWithEvictees();
    const field = battleBackField();
    expect(field).toEqual(['J','K','L']);
    for (const n of field) expect(gs.activePlayers).not.toContain(n);
  });

  it('excludes walkouts and medical removals — those are not evictions', () => {
    houseWithEvictees();
    gs.eliminated.push('I');
    gs.activePlayers = gs.activePlayers.filter(n => n !== 'I');
    gs.bb.weeks.push({ num: 4, evicted: null, departure: { name: 'I', reason: 'quit' } });
    expect(battleBackField()).not.toContain('I');
  });

  it('gauntlet: every loser is finished and exactly one walks back in', () => {
    houseWithEvictees();
    const act = runBattleBack({ week: { num: 4 }, rng: seededRng(3), style: 'gauntlet' });
    expect(act.style).toBe('gauntlet');
    // Three contenders means two duels, and every duel eliminates somebody.
    expect(act.rounds.filter(r => r.kind === 'duel')).toHaveLength(2);
    expect(act.eliminatedForGood).toHaveLength(2);
    expect(act.returned).toBeTruthy();
    expect(act.eliminatedForGood).not.toContain(act.returned);
    expect(gs.activePlayers).toContain(act.returned);
    expect(gs.eliminated).not.toContain(act.returned);
  });

  it('showdown: the house elects a champion who can shut the door', () => {
    houseWithEvictees();
    const act = runBattleBack({ week: { num: 4 }, rng: seededRng(11), style: 'showdown' });
    expect(act.style).toBe('showdown');
    expect(act.rounds[0].kind).toBe('heat');
    expect(act.champion?.name).toBeTruthy();
    // The champion is a houseguest, not one of the people trying to get back.
    expect(act.contenders).not.toContain(act.champion.name);
    // Either somebody returned, or the champion held and nobody did.
    if (act.returned) expect(gs.activePlayers).toContain(act.returned);
    else expect(gs.activePlayers).toHaveLength(9);
  });

  it('the champion actually wins sometimes, and then nobody comes back', () => {
    let held = 0, returned = 0;
    for (let seed = 1; seed <= 40; seed++) {
      reset(); houseWithEvictees();
      const act = runBattleBack({ week: { num: 4 }, rng: seededRng(seed), style: 'showdown' });
      if (act.returned) returned++; else held++;
    }
    expect(held, 'the door never once held').toBeGreaterThan(0);
    expect(returned, 'nobody ever got back in').toBeGreaterThan(0);
  });

  it('a returnee remembers who voted them out', () => {
    houseWithEvictees();
    // Force J through: J is first in the field, so a gauntlet J wins is
    // reachable — search the seeds for one rather than faking the result.
    let act = null;
    for (let seed = 1; seed <= 60 && !act; seed++) {
      reset(); houseWithEvictees();
      const a = runBattleBack({ week: { num: 4 }, rng: seededRng(seed), style: 'gauntlet' });
      if (a.returned === 'J') act = a;
    }
    expect(act, 'the first evictee never won in 60 seeds').toBeTruthy();
    // A and B voted J out; C did not.
    expect(act.grudges).toEqual(expect.arrayContaining(['A','B']));
    expect(act.grudges).not.toContain('C');
    expect(getBond('J','A')).toBeLessThan(0);
    expect(getBond('J','C')).toBeGreaterThan(0);
  });

  it('needs two people to fight — an empty or single field runs nothing', () => {
    gs.activePlayers = [...CAST.map(p => p.name)];
    gs.eliminated = [];
    expect(runBattleBack({ week: { num: 1 }, rng: seededRng(2) })).toBeNull();
    gs.eliminated = ['L'];
    gs.activePlayers = gs.activePlayers.filter(n => n !== 'L');
    expect(runBattleBack({ week: { num: 2 }, rng: seededRng(2) })).toBeNull();
  });

  it('does not seat a returnee on the jury they are still playing against', () => {
    houseWithEvictees();
    const act = runBattleBack({ week: { num: 4 }, rng: seededRng(3), style: 'gauntlet' });
    const back = act.returned;
    // The week that evicted them is flagged, not rewritten: the vote still
    // happened and the transcript still says so.
    const evWeek = gs.bb.weeks.find(w => w.evicted === back);
    expect(evWeek.evictionReversed).toBe(true);
    expect(evWeek.ballots.length, 'the vote was erased').toBeGreaterThan(0);
    const jury = seatBBJury();
    expect(jury).not.toContain(back);
    // ...but a later eviction of the same person does seat them.
    gs.bb.weeks.push({ num: 9, evicted: back, ballots: [{ voter:'A', evict: back }] });
    expect(seatBBJury()).toContain(back);
  });

  it('offers a wider competition pool than either HOH or veto', () => {
    const bb = bbCompetitionsForSlot('battle-back').map(c => c.id);
    const hoh = bbCompetitionsForSlot('hoh').map(c => c.id);
    const veto = bbCompetitionsForSlot('veto').map(c => c.id);
    // It is neither slot, so it inherits neither restriction.
    expect(bb).toContain('bb-sig-otev');          // veto-only
    expect(bb).toContain('bb-sig-the-wall');      // hoh-only
    expect(bb.length).toBeGreaterThan(hoh.length);
    expect(bb.length).toBeGreaterThan(veto.length);
  });

  it('plays through a real scheduled week and puts somebody back in the house', () => {
    seasonConfig.twistSchedule = [{ id:'t1', episode: 3, type:'bb-battle-back', bbStyle:'gauntlet', bbComp:'' }];
    simulateBBEpisode();
    simulateBBEpisode();
    const before = gs.activePlayers.length;
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'battle-back');
    expect(act, 'no battle-back act in the scheduled week').toBeTruthy();
    expect(act.contenders.length).toBeGreaterThanOrEqual(2);
    // One evicted tonight, one possibly returned: the house shrank by one and
    // then grew by however many walked back.
    const expected = before - 1 + (act.returned ? 1 : 0);
    expect(gs.activePlayers).toHaveLength(expected);
    if (act.returned) expect(gs.activePlayers).toContain(act.returned);
    // That night's evictee was eligible, which is how both aired versions ran.
    expect(act.contenders).toContain(ep.eliminated);
  });

  // This project has shipped a twist that only one of the two transcript
  // writers knew about more than once. Both paths get asserted.
  it('appears in BOTH transcripts, not just whichever one the test happened to call', () => {
    seasonConfig.twistSchedule = [{ id:'t1', episode: 3, type:'bb-battle-back', bbStyle:'showdown', bbComp:'' }];
    simulateBBEpisode();
    simulateBBEpisode();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'battle-back');
    expect(act).toBeTruthy();

    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    const runText = summariseWeek(week);
    expect(runText).toMatch(/BATTLE BACK/);
    for (const n of act.contenders) expect(runText).toContain(n);

    const backlog = generateSummaryText(ep) || '';
    expect(backlog).toMatch(/BATTLE BACK/);
    for (const n of act.contenders) expect(backlog).toContain(n);
    // The outcome is stated either way round.
    const outcome = act.returned ? new RegExp(act.returned) : /Nobody re-enters/;
    expect(runText).toMatch(outcome);
    expect(backlog).toMatch(outcome);
  });

  it('gets a VP screen that renders the whole fight once revealed', () => {
    seasonConfig.twistSchedule = [{ id:'t1', episode: 3, type:'bb-battle-back', bbStyle:'gauntlet', bbComp:'' }];
    simulateBBEpisode(); simulateBBEpisode();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'battle-back');
    expect(act).toBeTruthy();

    // Reveal keys are created on the first build, so the screen has to be
    // built, opened, and built again — the gotcha the diamond suite recorded.
    buildVPScreens(ep);
    const key = `bb_battleback_${ep.num}`;
    expect(_tvState[key], 'the screen never registered a reveal key').toBeTruthy();
    _tvState[key].idx = 99;
    const screens = buildVPScreens(ep);
    const screen = screens.find(s => s.label === 'Battle Back');
    expect(screen, 'no Battle Back screen was registered').toBeTruthy();

    const text = screen.html.replace(/<[^>]*>/g, ' ');
    for (const n of act.contenders) expect(text).toContain(n);
    expect(text).not.toMatch(/undefined|NaN/);
    if (act.returned) expect(text).toContain(act.returned);
  });

  it('replays identically for the same seed', () => {
    houseWithEvictees();
    const a = runBattleBack({ week: { num: 4 }, rng: seededRng(21), style: 'showdown' });
    reset(); houseWithEvictees();
    const b = runBattleBack({ week: { num: 4 }, rng: seededRng(21), style: 'showdown' });
    expect(b.returned).toBe(a.returned);
    expect(b.beats.map(x => x.text)).toEqual(a.beats.map(x => x.text));
  });
});

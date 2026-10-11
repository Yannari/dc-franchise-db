// @vitest-environment jsdom
// Events the Total Drama engine wrote that no playthrough could reach, or that reached no screen.
// Found 2026-10-11 by playing ~400 headless seasons and diffing the event types that fired against the
// ones in the code; each case here is one of those, played until it happens.
import { describe, expect, it } from 'vitest';
import { runOneSeason, seededRun, makeCast, core } from './helpers/season-harness.js';
import * as savestateMod from '../js/savestate.js';
import { checkHeroVillainEvents } from '../js/camp-events.js';
import { _checkShowmanceChalMoment, _groupRomanceSpark } from '../js/romance.js';
import { addBond } from '../js/bonds.js';

const campEventsOf = ep => Object.values(ep.campEvents || {})
  .flatMap(c => (Array.isArray(c) ? c : [...(c.pre || []), ...(c.post || [])]));
const epAt = n => core.gs.episodeHistory.find(e => e.num === n);
const scheduled = (type, episode, extra = {}) => ({ twistSchedule: [{ id: `t-${type}`, episode, type }], romance: 'enabled', ...extra });

// a fresh merged-or-tribal state to call the engine functions on directly
function freshSeason(seed = 3) {
  return seededRun(() => {
    core.setPlayers(makeCast(12));
    core.setSeasonConfig({ ...core.defaultConfig(), teams: 2, mergeAt: 8, romance: 'enabled', twistSchedule: [] });
    savestateMod.initGameState();
    window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig;
    return core.gs;
  }, seed);
}

describe('Total Drama events reach a playthrough', () => {
  it('Basic Straining does not throw when nothing has created the injury ledger yet', () => {
    // it wrote gs.lingeringInjuries[player] without creating it: 2 seasons in 6 died on the obstacle course
    for (let seed = 1; seed <= 8; seed++) {
      expect(() => seededRun(() => runOneSeason(scheduled('basic-straining', 3)), seed)).not.toThrow();
      expect(epAt(3).twists.some(t => t.catalogId === 'basic-straining')).toBe(true);
    }
  }, 240000);

  it("the Auction's camp beat survives the merge camp being built", () => {
    // the merged camp was rebuilt with post: [], wiping what the auction filed before camp ran
    seededRun(() => runOneSeason(scheduled('auction', 12)), 11);
    const ep = epAt(12);
    expect(ep.twists.find(t => t.catalogId === 'auction')?.auction).toBeTruthy();
    const beat = campEventsOf(ep).find(e => /^auction/.test(e.type || ''));
    expect(beat, 'an auction camp event').toBeTruthy();
    expect(ep.summaryText).toContain(beat.text);
  }, 120000);

  for (const [id, type, at] of [['rapa-phooey', 'rapaImmune', 12], ['great-fake-out', 'gfo-winner', 12], ['alien-egg', /^alienEgg/, 4]]) {
    it(`${id} files its camp moments on the episode, not on gs.campEvents`, () => {
      // gs.campEvents has no reader: these never reached a screen or the backlog
      seededRun(() => runOneSeason(scheduled(id, at)), 5);
      const ep = epAt(at);
      expect(ep.twists.some(t => t.catalogId === id)).toBe(true);
      const ev = campEventsOf(ep).find(e => (type instanceof RegExp ? type.test(e.type || '') : e.type === type));
      expect(ev, String(type)).toBeTruthy();
      expect(ev.text).toBeTruthy();
      expect(core.gs.campEvents).toBeUndefined();
    }, 120000);
  }

  it('a showmance moment fires for a name list and airs at camp when the challenge has no phases', () => {
    const gs = freshSeason();
    const [a, b] = [gs.activePlayers.find(n => n === 'P1'), gs.activePlayers.find(n => n === 'P2')];
    gs.showmances = [{ players: [a, b], phase: 'showmance', sparkEp: 1 }];
    const ep = { num: 1, campEvents: {} };
    // tribeMembers as plain names used to flatten to nobody; phases null used to land on ep.chalTimeline
    seededRun(() => _checkShowmanceChalMoment(ep, null, null, null, 'danger', [a, b, 'P3']), 1);
    for (let s = 2; s < 40 && !campEventsOf(ep).length; s++) seededRun(() => _checkShowmanceChalMoment(ep, null, null, null, 'danger', [a, b]), s);
    const moment = campEventsOf(ep)[0];
    expect(moment, 'a showmance moment at camp').toBeTruthy();
    expect(moment.players.every(n => [a, b].includes(n))).toBe(true);
    expect(moment.badgeText).toBeTruthy();
    expect(ep.chalTimeline).toBeUndefined();
  });

  it('a group spark picks a pair and airs at camp', () => {
    const gs = freshSeason();
    gs.romanticSparks = []; gs.showmances = [];
    const ep = { num: 1, campEvents: {} };
    let sparked = false;
    for (let s = 1; s < 60 && !sparked; s++) sparked = seededRun(() => _groupRomanceSpark(ep, ['P1', 'P2', 'P3', 'P4'], 'the test'), s);
    expect(sparked).toBe(true);
    expect(gs.romanticSparks.length).toBe(1);
    expect(campEventsOf(ep).some(e => e.type === 'soShowmance' && e.badgeText)).toBe(true);
  });

  it('a villain gloats over the last episode\'s boot (camp runs before tonight\'s vote)', () => {
    const gs = freshSeason();
    const villain = core.players.find(p => p.archetype === 'villain').name;
    const fallen = gs.activePlayers.find(n => n !== villain);
    gs.activePlayers = gs.activePlayers.filter(n => n !== fallen);
    gs.tribes.forEach(t => { t.members = t.members.filter(n => n !== fallen); });
    gs.eliminated = [fallen];
    gs.episodeHistory = [{ num: 1, eliminated: fallen }];
    addBond(villain, fallen, -5);
    const tribe = gs.tribes.find(t => t.members.includes(villain)).name;
    const ep = { num: 2, campEvents: { [tribe]: { pre: [], post: [] } } };
    // 0.1 passes the 30% gate; 0.6 is the gloat slot of the roll; the rest feed the sentence draws
    const seq = [0.1, 0.6]; let i = 0;
    seededRun(() => { const real = Math.random; Math.random = () => (i < seq.length ? seq[i++] : real()); try { checkHeroVillainEvents(ep); } finally { Math.random = real; } }, 4);
    expect(campEventsOf(ep).some(e => e.type === 'villainGloat')).toBe(true);
  });

  it('a medevac airs in the stepped camp (it was always left off camera)', () => {
    let found = null;
    for (let seed = 1; seed <= 12 && !found; seed++) {
      seededRun(() => runOneSeason({ foodWater: 'enabled', survivalDifficulty: 'brutal' }, 16), seed);
      for (const ep of core.gs.episodeHistory) for (const [camp, block] of Object.entries(ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          const list = Array.isArray(block) ? (phase === 'pre' ? block : []) : (block[phase] || []);
          const i = list.findIndex(e => e?.type === 'medevac');
          if (i >= 0 && !found) found = { ep, camp, phase, i };
        }
      }
    }
    expect(found, 'a medevac in 12 brutal seasons').toBeTruthy();
    const plan = found.ep.campStory?.[found.camp]?.[found.phase] || [];
    expect(plan.some(it => it.ref === found.i)).toBe(true);
  }, 300000);
});

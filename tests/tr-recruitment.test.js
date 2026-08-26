// Recruitment is the only thing in this engine that changes what a player is
// trying to win. Everything else moves beliefs; this moves the truth.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes } from '../js/knowledge.js';
import { recordAlignment, alignmentAt, truthAtLearn, canRecruit, offerRecruitment, chooseRecruit }
  from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge, recordRound } from '../js/tr/deduction.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 10).map(p => p.name);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function world(traitors = CAST.slice(0, 2)) {
  setPlayers(roster.players.slice(0, 10));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  CAST.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}
beforeEach(() => world());

describe('when the traitors may recruit at all', () => {
  it('not until one of them has been banished', () => {
    expect(canRecruit(3)).toBe(false);
  });
  it('the night after a traitor is banished', () => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
    expect(canRecruit(4)).toBe(true);
  });
});

describe('the flip', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('changes what the recruit is trying to win, from that episode on', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });   // forced accept
    expect(r.accepted).toBe(true);
    expect(alignmentAt(CAST[5], 4)).toBe('traitor');
    expect(alignmentAt(CAST[5], 2), 'the flip rewrote who they were BEFORE it').toBe('faithful');
  });

  it('does not retroactively make an earlier correct read wrong', () => {
    expect(truthAtLearn(CAST[5], 2)).toBe(false);
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    expect(truthAtLearn(CAST[5], 2), 'a correct episode-2 read was rewritten as a mistake').toBe(false);
    expect(truthAtLearn(CAST[5], 5)).toBe(true);
  });

  it('lets an accepted recruit see the turret, and nobody else', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'the recruit does not know who they just joined').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    // And still nobody else can be certain of anything.
    const outsider = CAST.find(n => n !== CAST[5] && n !== r.recruiter && gs.activePlayers.includes(n));
    const ob = believes(outsider, alignmentFactId(r.recruiter), 4);
    if (ob) expect(ob.effectiveConfidence).toBeLessThan(0.63);
  });

  it('records how and when, because a two-night traitor owes nobody anything', () => {
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const flip = gs.tr.roleHistory.find(r => r.name === CAST[5] && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 4 });
  });
});

describe('refusing', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('by note: survivable, and they never learn who asked', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'note' });   // forced refuse
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers).toContain(CAST[5]);
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'an anonymous note told them who sent it').toBeNull();
  });

  it('by ultimatum: fatal, because they have seen the face', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'ultimatum' });
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers, 'they refused an ultimatum and lived').not.toContain(CAST[5]);
  });

  it('a high-loyalty faithful refuses more often than a bold strategist', () => {
    // Population: acceptance is proportional, not a threshold.
    const rate = (name) => {
      let yes = 0;
      for (let s = 1; s <= 80; s++) {
        world();
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        if (offerRecruitment(name, 4, seededRng(s), { mode: 'note' }).accepted) yes++;
      }
      return yes / 80;
    };
    // Must exclude the Traitors themselves — offering recruitment to somebody
    // who is already a Traitor is meaningless and would silently make this
    // test measure nothing.
    const TRAITOR_NAMES = CAST.slice(0, 2);
    const byLoyalty = [...roster.players.slice(0, 10)]
      .filter(p => !TRAITOR_NAMES.includes(p.name) && p.name !== CAST[0])
      .sort((a, b) => (b.stats.loyalty || 5) - (a.stats.loyalty || 5));
    const loyal = byLoyalty[0].name, disloyal = byLoyalty[byLoyalty.length - 1].name;
    const rLoyal = rate(loyal), rDisloyal = rate(disloyal);
    console.log(`[population] ${loyal} (loyal) accepts ${(rLoyal * 100).toFixed(0)}%, ` +
                `${disloyal} accepts ${(rDisloyal * 100).toFixed(0)}%`);
    expect(rLoyal, 'loyalty made no difference to whether they turned').toBeLessThan(rDisloyal);
  });
});

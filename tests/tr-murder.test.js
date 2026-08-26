// The conclave is where the Traitors get it wrong.
//
// Nothing here computes an optimal target. Each Traitor forms their own
// preference from their own read, the room resolves it on social weight rather
// than correctness, and the loser remembers. That last part is the point: by
// the endgame there is not a set of Traitors but a faction with a history, and
// this file is where the history is written.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { seedTraitorKnowledge } from '../js/tr/deduction.js';
import { formPreference, runConclave, murderCost } from '../js/tr/murder.js';
import { setBond } from '../js/bonds.js';
import { recordRound } from '../js/tr/deduction.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 10).map(p => p.name);
const TRAITORS = CAST.slice(0, 3);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function world(cast = CAST, traitors = TRAITORS) {
  setPlayers(roster.players.slice(0, 10));
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}

beforeEach(() => world());

describe('each traitor forms their own preference', () => {
  it('never names a fellow traitor', () => {
    for (const t of TRAITORS) {
      const p = formPreference(t, 2, seededRng(5));
      expect(TRAITORS, `${t} wanted to murder a fellow traitor`).not.toContain(p.target);
    }
  });

  it('gives a reason, because the reason drives the consequence', () => {
    const p = formPreference(TRAITORS[0], 2, seededRng(5));
    expect(typeof p.reason).toBe('string');
    expect(p.reason.length).toBeGreaterThan(0);
  });

  it('does not all agree — the room has to argue about something', () => {
    // Population, not one draw: preference is stat-weighted with noise.
    let disagreed = 0;
    for (let s = 1; s <= 60; s++) {
      world();
      const picks = TRAITORS.map(t => formPreference(t, 2, seededRng(s)).target);
      if (new Set(picks).size > 1) disagreed++;
    }
    const rate = disagreed / 60;
    console.log(`[population] conclaves with a genuine disagreement: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'the traitors always want the same person — nothing to argue about')
      .toBeGreaterThan(0.5);
  });

  it('a traitor is measurably less likely to name someone they are close to', () => {
    // Population, not one draw: a single seed flips only ~82% of the time
    // (scatter can still outweigh a fresh +9 bond on any given night), so
    // asserting one seed makes this test fail on roughly 1 in 5 alternate
    // seeds even though the underlying preference is real.
    let flipped = 0;
    for (let s = 1; s <= 60; s++) {
      world();
      const t = TRAITORS[0];
      const cold = formPreference(t, 2, seededRng(s)).target;
      world();
      setBond(t, cold, 9);
      const warm = formPreference(t, 2, seededRng(s)).target;
      if (warm !== cold) flipped++;
    }
    const rate = flipped / 60;
    console.log(`[population] bonding +9 moves the pick off the original target: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'raising the bond rarely changed who got named').toBeGreaterThan(0.6);
  });
});

describe('the room resolves it socially, not correctly', () => {
  it('records who was overruled, and on which night', () => {
    const r = runConclave(3, seededRng(11));
    expect(r.target).toBeTruthy();
    expect(TRAITORS).not.toContain(r.target);
    expect(Array.isArray(r.argued)).toBe(true);
    expect(r.argued.length).toBe(TRAITORS.length);
    for (const o of r.overruled) {
      expect(o).toMatchObject({ ep: 3, target: r.target });
      expect(o.theirTarget).not.toBe(r.target);
    }
  });

  it('writes the overrule to the season ledger, not just the return value', () => {
    const r = runConclave(3, seededRng(11));
    // Equality, unconditional — not "if there's anything to check". A
    // conditional-on-nonempty assertion goes green if a future change stops
    // writing the ledger at all, which is exactly the failure mode this test
    // exists to catch. The ledger must equal what was returned, seed empty
    // or not.
    expect(gs.tr.conclaveTension).toEqual(r.overruled);
    if (r.overruled.length) {
      expect(gs.tr.conclaveTension[0]).toHaveProperty('winner');
      expect(gs.tr.conclaveTension[0]).toHaveProperty('loser');
      expect(gs.tr.conclaveTension[0].ep).toBe(3);
    }
  });

  it('overrules actually happen — the ledger is not always empty', () => {
    // Population: measured 97.5-ish% of seeds produce at least one overrule
    // in this 3-traitor cast; bar set well below that with headroom so a
    // regression that makes overrules rare (not just this exact seed) fails
    // loudly instead of the assertion silently doing nothing.
    let withOverrule = 0;
    for (let s = 1; s <= 60; s++) {
      world();
      const r = runConclave(3, seededRng(s));
      if (r.overruled.length) withOverrule++;
    }
    const rate = withOverrule / 60;
    console.log(`[population] conclaves with at least one overrule: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'nobody is ever overruled — the ledger would never get written')
      .toBeGreaterThan(0.7);
  });

  it('the loudest traitor does not always win — that would be a calculation', () => {
    let winners = new Set();
    for (let s = 1; s <= 60; s++) {
      world();
      const r = runConclave(3, seededRng(s));
      if (r.decidedBy) winners.add(r.decidedBy);
    }
    expect(winners.size, 'the same traitor decides every single conclave').toBeGreaterThan(1);
  });

  it('a lone traitor argues with nobody and still picks', () => {
    world(CAST, [CAST[0]]);
    const r = runConclave(3, seededRng(4));
    expect(r.target).toBeTruthy();
    expect(r.overruled).toHaveLength(0);
  });
});

describe('what a bad murder costs', () => {
  it('names the decoy the traitors just destroyed', () => {
    // A Faithful the room was already voting for is worth more alive.
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: null,
      ballots: CAST.map(v => ({ voter: v, voted: CAST[5], channel: 'banishment' })) });
    const c = murderCost(CAST[5], 'wasted-decoy', 3);
    expect(c.kind).toBe('decoy-destroyed');
    expect(c.cost).toBeGreaterThan(0);
  });

  it('points suspicion at the traitor who had visibly clashed with the victim', () => {
    setBond(TRAITORS[0], CAST[6], -8);
    const c = murderCost(CAST[6], 'convenient', 3);
    expect(c.kind).toBe('clash-traced');
    expect(c.blames).toContain(TRAITORS[0]);
  });

  it('says nothing interesting about a clean kill', () => {
    const c = murderCost(CAST[7], 'beloved', 3);
    expect(c.kind).toBe('clean');
    expect(c.blames).toHaveLength(0);
  });
});

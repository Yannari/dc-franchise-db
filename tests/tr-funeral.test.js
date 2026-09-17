// ══════════════════════════════════════════════════════════════════════
// tests/tr-funeral.test.js — the Hidden Murder twist and The Funeral
// ══════════════════════════════════════════════════════════════════════
//
// The Funeral is a follow-up mission: it runs only on the afternoon after a
// hidden murder, so it is not in TRAITORS_MISSIONS and the shared bespoke
// suites never call it. Its checks live here, against a world where last night
// really was hidden.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { rngFor, playTraitorsSeason } from '../js/tr/headless.js';
import { createMissionCtx, POT_CEILING, MISSION_BEHAVIOURS } from '../js/tr/missions/contract.js';
import { funeral } from '../js/tr/missions/funeral.js';
import { TRAITORS_MISSIONS, _setBespokeMissionsEnabled } from '../js/tr/missions/index.js';
import { pickVariant } from '../js/tr/murder-variants.js';
import { TR_MISSION_CATALOG } from '../js/core.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 18);
const ALL = ROSTER.map(p => p.name);
const VICTIM = ALL[17];
const CAST = ALL.slice(0, 17);
const DECOYS = CAST.slice(13, 17);
const COFFINS = [DECOYS[0], VICTIM, DECOYS[1], DECOYS[2], DECOYS[3]];

function world() {
  setPlayers(ROSTER);
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
  gs.tr.castOrder = [...ALL];
  gs.tr.rounds = [{ ep: 2, variant: 'hidden', murdered: VICTIM,
    variantData: { decoys: [...DECOYS], coffins: [...COFFINS] } }];
}
function runs(n, { traitors = [], from = 0, shields = true } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    world();
    const ctx = createMissionCtx({ ep: 3, living: [...CAST], shieldsEnabled: shields,
      alignmentOf: nm => (traitors.includes(nm) ? 'traitor' : 'faithful') });
    out.push(funeral.simulate(ctx, rngFor(from + i + 1)));
  }
  return out;
}
const norm = s => String(s).toLowerCase().replace(/[^a-z ]+/g, '').replace(/\s+/g, ' ').trim();

describe('The Funeral', () => {
  it('runs only after a hidden murder, and is never in the random pool or the dropdown', () => {
    world();
    expect(funeral.eligibility(createMissionCtx({ ep: 3, living: CAST }))).toBe(true);
    gs.tr.rounds = [{ ep: 2, variant: 'standard', murdered: VICTIM }];
    expect(funeral.eligibility(createMissionCtx({ ep: 3, living: CAST }))).toBe(false);
    expect(TRAITORS_MISSIONS.map(m => m.id)).not.toContain('funeral');
    expect(TR_MISSION_CATALOG.map(m => m.id)).not.toContain('funeral');
  });

  it('keeps the decoys out of the procession and the victim out of the room', () => {
    for (const r of runs(40)) {
      expect(r.tally.mourners.some(n => DECOYS.includes(n))).toBe(false);
      expect(r.tally.coffins).toContain(VICTIM);
      for (const s of r.scenes) expect(s.participants).not.toContain(VICTIM);
      for (const c of r.tally.clues) expect(DECOYS).toContain(c.about);
      // A cleared decoy is never in a coffin; an uncleared one always is.
      for (const c of r.tally.clues) expect(r.tally.coffins.includes(c.about)).toBe(!c.solved);
      expect(r.tally.lilies.length).toBe(r.tally.mourners.length);
    }
  });

  it('every clue is a true fact about the person it describes', () => {
    for (const r of runs(60)) {
      for (const c of r.tally.clues) {
        if (c.kind === 'letter') expect(c.text).toContain(`begins with ${c.about[0].toUpperCase()}.`);
        if (c.kind === 'seat') {
          const nb = /beside (.+) at the Round Table/.exec(c.text)[1];
          const i = ALL.indexOf(c.about), j = ALL.indexOf(nb);
          expect(Math.abs(i - j) === 1 || Math.abs(i - j) === ALL.length - 1).toBe(true);
        }
      }
    }
  });

  it('the money follows the lilies: a wrong majority never pays for them', () => {
    for (const r of runs(80)) {
      if (!r.tally.majority) expect(['scraped', 'failed']).toContain(r.tier);
      else expect(['triumph', 'solid']).toContain(r.tier);
      expect(r.tally.majority).toBe(r.tally.rightCount * 2 > r.tally.voters);
    }
  });

  it('all four tiers and all five behaviours are reachable', () => {
    const rs = runs(300, { from: 500 });
    const tiers = new Set(rs.map(r => r.tier));
    expect([...tiers].sort()).toEqual(['failed', 'scraped', 'solid', 'triumph']);
    const seen = new Set(rs.flatMap(r => r.scenes.map(s => s.behaviour)).filter(Boolean));
    expect(MISSION_BEHAVIOURS.filter(b => !seen.has(b))).toEqual([]);
  });

  it('the first lily on the right coffin earns a Shield, and none with Shields off', () => {
    const on = runs(30, { from: 900 });
    expect(on.filter(r => r.shields.length).length).toBeGreaterThan(20);
    for (const r of on) if (r.shields.length) expect(r.shields[0].holder).toBe(r.tally.first);
    const off = runs(30, { from: 900, shields: false });
    expect(off.every(r => r.shields.length === 0)).toBe(true);
  });

  it('a Traitor knows the coffin and still sometimes lays the lily wrong: a nudge, not a switch', () => {
    const rs = runs(150, { traitors: CAST, from: 2000 });
    const lilies = rs.flatMap(r => r.tally.lilies);
    const rate = lilies.filter(l => l.on === VICTIM).length / lilies.length;
    expect(rate).toBeGreaterThan(0.6);
    expect(rate).toBeLessThan(0.8);
    // And a Faithful castle, which does not know, still gets it wrong sometimes.
    const clean = runs(150, { from: 2000 });
    expect(clean.filter(r => !r.tally.majority).length).toBeGreaterThan(15);
    // Being conflicted costs the procession something.
    const solved = xs => xs.flatMap(r => r.tally.clues).filter(c => c.solved).length
      / xs.flatMap(r => r.tally.clues).length;
    expect(solved(rs)).toBeLessThan(solved(clean));
  });

  it('a confessional adds something the scene did not say', () => {
    for (const r of runs(120, { from: 3000 })) {
      for (const s of r.scenes) {
        if (!s.confessional) continue;
        const a = new Set(norm(s.text).split(' ').filter(w => w.length > 4));
        const b = new Set(norm(s.confessional.text).split(' ').filter(w => w.length > 4));
        const shared = [...b].filter(w => a.has(w)).length;
        expect(b.size ? shared / b.size : 1, `${s.eventId}: ${s.confessional.text}`).toBeLessThan(0.6);
      }
    }
  });

  it('replays exactly', () => {
    const a = JSON.stringify(runs(1, { from: 77 })[0]);
    const b = JSON.stringify(runs(1, { from: 77 })[0]);
    expect(b).toBe(a);
  });
});

describe('the Hidden Murder twist in a season', () => {
  it('a pinned hidden night is followed by The Funeral, and breakfast names nobody', () => {
    _setBespokeMissionsEnabled(true);
    const R = roster.players.slice(0, 20);
    let funerals = 0;
    for (let seed = 1; seed <= 6; seed++) {
      setPlayers(R);
      playTraitorsSeason({ cast: R.map(p => p.name), traitorCount: 3, seed, murderSchedule: { 3: 'hidden' } });
      const rows = gs.episodeHistory;
      const night = rows.find(e => e.tr?.conclave?.variant === 'hidden' && !e.tr.conclave.blocked);
      if (!night) continue;
      const next = rows.find(e => e.num === night.num + 1);
      expect(next.tr.mission.id).toBe('funeral');
      expect(next.tr.mission.tally.victim).toBe(night.tr.conclave.victim);
      expect(next.tr.dawn.hidden.coffins).toContain(night.tr.conclave.victim);
      funerals++;
    }
    expect(funerals).toBeGreaterThan(3);
  });

  it('is never picked when missions cannot run the funeral', () => {
    world();
    gs.tr.murderSchedule = { 3: 'hidden' };
    _setBespokeMissionsEnabled(false);
    try { expect(pickVariant(3, CAST)).toBe('standard'); } finally { _setBespokeMissionsEnabled(true); }
    expect(pickVariant(3, CAST)).toBe('hidden');
  });
});

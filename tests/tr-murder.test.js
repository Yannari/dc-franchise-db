// The conclave is where the Traitors get it wrong.
//
// Nothing here computes an optimal target. Each Traitor forms their own
// preference from their own read, the room resolves it on social weight rather
// than correctness, and the loser remembers. That last part is the point: by
// the endgame there is not a set of Traitors but a faction with a history, and
// this file is where the history is written.
import { describe, expect, it, beforeEach, vi } from 'vitest';

// THE SPY WATCHES THE CALL, NOT THE STORE — Task 2's finding, reused verbatim
// because the defect it describes applies here word for word. The variant
// channels write two or three beliefs a night about people the murder channel
// and the reveal will both overwrite later, so a sweep of the belief store at
// season end is a sweep over the SURVIVORS of an overwriting process and would
// pass a mutation that wrote every one of them at `observed`. The credibility
// rule binds the write, so the guard inspects the write.
//
// Gated for the same reason it is gated in tests/tr-missions.test.js: this
// file plays several hundred seasons and an ungated capture grows to hundreds
// of thousands of entries.
const { learnCalls, capture } = vi.hoisted(() => ({ learnCalls: [], capture: { on: false } }));
vi.mock('../js/knowledge.js', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    learn: (knower, id, opts = {}) => {
      if (capture.on) {
        learnCalls.push({ knower, id, sourceType: opts.sourceType, source: opts.source,
          confidence: opts.confidence });
      }
      return orig.learn(knower, id, opts);
    },
  };
});
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { seedTraitorKnowledge } from '../js/tr/deduction.js';
import { formPreference, runConclave, murderCost, grantShield, isShielded, resolveMurder } from '../js/tr/murder.js';
import { setBond } from '../js/bonds.js';
import { recordRound, murderEvidence, suspicion } from '../js/tr/deduction.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { VARIANT_IDS, VARIANT_LINES, pickVariant, variantEvidence, _setVariantsEnabled,
  _setVariantReadsEnabled } from '../js/tr/murder-variants.js';
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

  it('still names the clashed traitor when the victim was ALSO a spent decoy', () => {
    // The overlap case: heat is checked before clash and reports first, but
    // `blames` must not be discarded just because 'decoy-destroyed' won the
    // `kind`. Real evidence (the clash) must not be dropped in favour of the
    // narrative label.
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: null,
      ballots: CAST.map(v => ({ voter: v, voted: CAST[6], channel: 'banishment' })) });
    setBond(TRAITORS[0], CAST[6], -8);
    const c = murderCost(CAST[6], 'wasted-decoy', 3);
    expect(c.kind).toBe('decoy-destroyed');
    expect(c.blames).toContain(TRAITORS[0]);
  });
});

describe('the shield, and the night nobody dies', () => {
  it('blocks the murder and kills nobody', () => {
    const r1 = resolveMurder(3, seededRng(7));
    world();
    grantShield(r1.target, 3);
    const r2 = resolveMurder(3, seededRng(7));
    expect(r2.target).toBe(r1.target);
    expect(r2.blocked).toBe(true);
    expect(r2.victim).toBeNull();
    expect(gs.activePlayers).toContain(r1.target);
  });

  it('is spent even when it blocks — it does not carry over', () => {
    const t = resolveMurder(3, seededRng(7)).target;
    world();
    grantShield(t, 3);
    resolveMurder(3, seededRng(7));
    expect(isShielded(t)).toBe(false);
  });

  it('records the blocked attempt, because the room can see nobody died', () => {
    const t = resolveMurder(3, seededRng(7)).target;
    world();
    grantShield(t, 3);
    const r = resolveMurder(3, seededRng(7));
    expect(r.blocked).toBe(true);
    expect(gs.tr.blockedMurders).toContainEqual(expect.objectContaining({ ep: 3 }));
  });

  it('an unshielded murder removes exactly one living faithful', () => {
    const before = [...gs.activePlayers];
    const r = resolveMurder(3, seededRng(7));
    expect(r.blocked).toBe(false);
    expect(gs.activePlayers).toHaveLength(before.length - 1);
    expect(gs.activePlayers).not.toContain(r.victim);
    expect(TRAITORS).not.toContain(r.victim);
  });
});

describe('reading the murder', () => {
  it('suspects whoever pushed the victim right before the victim died', () => {
    // Population — the read runs through _assess and is probabilistic.
    let hits = 0;
    const N = 100;
    for (let s = 1; s <= N; s++) {
      world();
      const victim = CAST[8], pusher = CAST[4], quiet = CAST[7];
      recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
        ballots: [{ voter: pusher, voted: victim, channel: 'banishment' },
                  { voter: quiet,  voted: CAST[9], channel: 'banishment' }],
        accusations: [{ accuser: pusher, target: victim }] });
      gs.activePlayers = CAST.filter(n => n !== victim);
      murderEvidence(3, seededRng(s));
      if (suspicion(CAST[3], pusher, 3) > suspicion(CAST[3], quiet, 3)) hits++;
    }
    const rate = hits / N;
    console.log(`[population] pusher out-suspected the quiet player: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'pushing a name the night the name died bought no suspicion at all')
      .toBeGreaterThan(0.15);
  });

  it('emits each murder exactly once, never re-walking history', () => {
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: CAST[4], voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: CAST[4], target: victim }] });
    gs.activePlayers = CAST.filter(n => n !== victim);
    const first = murderEvidence(3, seededRng(2));
    const second = murderEvidence(4, seededRng(2));
    // THE FLOOR IS WHAT MAKES THE ZERO MEAN ANYTHING. Without it this test
    // passes on `murderEvidence = () => []` — "never emitted" and "emitted
    // exactly once" are the same assertion once the second half is all you
    // check. Proven by stubbing: the emptied function passed, and fails here.
    expect(first.filter(e => e.ep === 2).length,
      'episode 2 emitted nothing at all -- "exactly once" is vacuous').toBeGreaterThan(0);
    expect(second.filter(e => e.ep === 2), 'episode 2 was re-read in episode 4').toHaveLength(0);
  });

  it('never breaks the credibility ceiling', () => {
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: CAST[4], voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: CAST[4], target: victim }] });
    gs.activePlayers = CAST.filter(n => n !== victim);
    murderEvidence(3, seededRng(2));
    for (const observer of gs.activePlayers) {
      for (const subject of gs.activePlayers) {
        // Traitor-on-traitor is excluded: seedTraitorKnowledge() legitimately
        // grants them `public` certainty about each other (they're standing
        // in the room wearing the cloaks) — one of the two sanctioned places
        // in the whole engine that beats the 0.62 deduced ceiling, and it has
        // nothing to do with murderEvidence. This test is about THIS task's
        // beliefs only.
        if (observer !== subject && TRAITORS.includes(observer) && TRAITORS.includes(subject)) {
          // The pair is skipped BECAUSE it is certain — assert that, so the
          // day the turret seeding silently breaks, this loop stops passing
          // by accident (nothing certain left to skip) and says so instead.
          expect(suspicion(observer, subject, 3)).toBeGreaterThanOrEqual(0.63);
          continue;
        }
        expect(suspicion(observer, subject, 3)).toBeLessThan(0.63);
      }
    }
  });

  it('forms no belief from a blocked murder — nobody died, there is nothing to reason from', () => {
    const victim = CAST[8], pusher = CAST[4];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: pusher, voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: pusher, target: victim }] });
    // The victim is still alive: a blocked murder kills nobody, so unlike the
    // other tests in this block, do NOT remove them from gs.activePlayers.
    gs.tr.blockedMurders = [{ ep: 2, target: victim }];
    const blocked = murderEvidence(3, seededRng(2));
    expect(blocked, 'a blocked murder should not indict the pusher').toHaveLength(0);

    // Prove the suppression is doing the work, not that nothing would have
    // happened anyway: remove the blocked marker, replay the identical round,
    // and confirm the same setup DOES form a belief once it is not blocked.
    world();
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: pusher, voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: pusher, target: victim }] });
    gs.activePlayers = CAST.filter(n => n !== victim);
    const unblocked = murderEvidence(3, seededRng(2));
    expect(unblocked.length, 'an unblocked murder with an identical pusher formed no belief at all').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE TWIST CATALOGUE (spec §7.4)
// ══════════════════════════════════════════════════════════════════════
//
// Seven shapes of night, one a round, and the reason the catalogue is worth
// building at all is that each one leaves the room DIFFERENT EVIDENCE. So the
// guards below are not "did the variant fire" — they are, for each variant, is
// the thing it uniquely produces actually there, is it reachable often enough
// to be measured, and does the absence it promises actually hold.
//
// ── WHY SO MUCH OF THIS ASSERTS AT THE DECISION POINT ─────────────────
//
// Seven variants sharing the nights means each of them is rare: about one
// round in twenty-five. Task 4's mutation survived a population guard for
// exactly this reason — the forbidden state occurred in 22 of 400 seasons and
// the assertion could not see the rule break. So the mutual-exclusion rule is
// asserted where it is DECIDED (every round record, every season) and every
// population arm below carries its own coverage floor, PER CHANNEL and never
// pooled: Task 5 shipped a pooled floor over two channels and it was carried
// by one of them while the other was dead.
const BIG_ROSTER = roster.players.slice(0, 20);
const BIG_CAST = BIG_ROSTER.map(p => p.name);

/** Alignment as it stood at `ep`, read off the season's own era ledger. */
function alignFor(season) {
  const eras = {};
  for (const n of BIG_CAST) eras[n] = [{ sinceEp: 1, truth: season.traitors.includes(n) }];
  for (const h of season.roleHistory || []) {
    (eras[h.name] ||= []).push({ sinceEp: h.ep, truth: h.to === 'traitor' });
  }
  return (name, ep) => {
    let cur = false;
    for (const e of (eras[name] || [])) if (e.sinceEp <= ep) cur = e.truth;
    return cur;
  };
}

function seasons(n, from = 1) {
  setPlayers(BIG_ROSTER);
  const out = [];
  for (let s = from; s < from + n; s++) out.push(playTraitorsSeason({ cast: BIG_CAST, seed: s }));
  return out;
}

/**
 * The shape each variant is allowed to leave on a round, and the ONLY shape.
 *
 * This is the mutual-exclusion rule made unrepresentable rather than asserted
 * over a population: a night that ran two variants carries two variants' worth
 * of fields, and the key sets below do not overlap. It is checked on every
 * round of every season played here, which is the decision point, not a
 * sample of it.
 */
const SHAPE = {
  standard: [],
  'on-trial': ['list', 'spared'],
  'plain-sight': ['actor', 'method', 'nearby'],
  'face-to-face': ['plea'],
  dungeon: ['companion', 'voice'],
  double: ['victims'],
  'name-your-own': ['decider', 'sacrificed'],
};

/**
 * Did this sentence really come out of that pool?
 *
 * The pool key on the round record says which fact the sentence is asserting,
 * and the key is only worth anything if the text honours it — otherwise the
 * key is a label and the guard checks a label against a fact. Templates carry
 * `{placeholders}`, so the comparison is a template match rather than an
 * equality.
 */
function poolIndex(key, text) {
  const pool = VARIANT_LINES[key];
  if (!pool || text == null) return -1;
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return pool.findIndex((tpl) => {
    const rx = new RegExp('^' + tpl.split(/\{[a-zA-Z_]+\}/).map(esc).join('.*') + '$');
    return rx.test(text);
  });
}
const fromPool = (key, text) => poolIndex(key, text) >= 0;

describe('the twist catalogue: one shape a night, and each leaves its own trail', () => {
  it('EXACTLY ONE VARIANT A NIGHT, decided on every night, and all seven are reachable', () => {
    const runs = seasons(400);
    const count = Object.fromEntries(VARIANT_IDS.map(id => [id, 0]));
    let rounds = 0, noMurder = 0;
    for (const season of runs) {
      for (const r of season.rounds) {
        rounds++;
        // A NIGHT WITH NO MURDER ON IT HAS NO SHAPE, and that is honest
        // rather than a hole: the Traitors get ONE action a night, so a night
        // spent making a recruitment offer is a night nobody dies and there
        // was nothing for the catalogue to be a catalogue of. The rule that
        // binds is the pairing — no variant if and only if no murder was
        // attempted — and asserting it here is what stops "undefined" being a
        // quiet way for a real murder to escape the catalogue.
        if (r.variant == null) {
          expect(r.murderTarget, `round ${r.ep} murdered somebody with no variant recorded`)
            .toBeFalsy();
          noMurder++;
          continue;
        }
        // ── THE DECISION POINT ──────────────────────────────────────
        // Every round, not a sample: one id, a string, from the catalogue.
        expect(typeof r.variant, `round ${r.ep} recorded no variant`).toBe('string');
        expect(VARIANT_IDS, `round ${r.ep} ran an unknown variant ${r.variant}`)
          .toContain(r.variant);
        count[r.variant]++;
        // ── AND ONLY ONE VARIANT'S WORTH OF CONSEQUENCES ────────────
        const keys = Object.keys(r.variantData || {}).filter(k => k !== 'secondBlocked');
        expect(keys.sort(), `round ${r.ep} ran ${r.variant} and carries fields from another variant`)
          .toEqual([...SHAPE[r.variant]].sort());
        // A second body belongs to exactly one shape of night.
        if (r.secondVictim) {
          expect(r.variant, 'a second body on a night that was not a double').toBe('double');
        }
      }
    }
    console.log(`[population] ${rounds} nights over 400 seasons (${noMurder} with no murder on them): `
      + VARIANT_IDS.map(id => `${id} ${count[id]} (${(count[id] / rounds * 100).toFixed(2)}%)`).join(', '));
    // THE REACHABILITY FLOOR, and it is the point of running four hundred
    // seasons rather than forty. A guard over a rule about variants is
    // unfalsifiable if the sample barely contains them.
    for (const id of VARIANT_IDS) {
      expect(count[id], `${id} is written, registered and effectively unreachable`)
        .toBeGreaterThan(40);
    }
    expect(count.standard / (rounds - noMurder), 'the twist has become the baseline')
      .toBeGreaterThan(0.6);
  });

  it('MURDER IN PLAIN SIGHT HOLDS NO CONCLAVE, and the absence is the mechanic', () => {
    const runs = seasons(200);
    let plainNights = 0, plainTension = 0, conclaveNights = 0, conclaveTension = 0;
    for (const season of runs) {
      const byEp = {};
      for (const r of season.rounds) byEp[r.ep] = r.variant;
      // An overrule is what a conclave leaves behind. `forced` entries are the
      // sacrifice ledger and are not a conclave — see _forcedSacrifice.
      const tension = {};
      for (const o of season.conclaveTension) {
        if (o.forced) continue;
        tension[o.ep] = (tension[o.ep] || 0) + 1;
      }
      for (const [ep, v] of Object.entries(byEp)) {
        if (v === 'plain-sight') { plainNights++; plainTension += tension[ep] || 0; }
        else if (v === 'standard') { conclaveNights++; conclaveTension += tension[ep] || 0; }
      }
    }
    console.log(`[population] ${plainNights} plain-sight nights left ${plainTension} overrules; `
      + `${conclaveNights} standard nights left ${conclaveTension}`);
    expect(plainNights, 'no plain-sight nights to measure').toBeGreaterThan(40);
    // THE ASSERTION. Nobody met, so nobody was overruled.
    expect(plainTension, 'a night with no conclave produced conclave tension').toBe(0);
    // AND THE CONTROL, without which the line above passes on an engine that
    // never records an overrule at all.
    expect(conclaveTension, 'no night in 200 seasons left an overrule — the arm above is vacuous')
      .toBeGreaterThan(100);
  });

  it('EACH VARIANT LEAVES EVIDENCE THE OTHERS DO NOT, and each channel carries its own floor', () => {
    // PER-CHANNEL FLOORS AND NEVER A POOLED ONE. Task 5 shipped "some claim
    // reached somebody" over two channels and it was carried by one of them
    // while the other was dead.
    const SIGNATURE = {
      'spared-from-the-list': /^was on the list with .+ and is still here$/,
      'in-plain-sight': /^was within reach of .+ at the table$/,
      'chapel-plea': / named them from the chapel$/,
      'came-back-up': /^went down with .+ and came back alone$/,
      'voice-on-the-stair': /^heard a voice on the dungeon stair$/,
      'the-dead-agreed': / had both been saying their name, and both are gone$/,
    };
    learnCalls.length = 0;
    capture.on = true;
    try { seasons(200); } finally { capture.on = false; }
    const hits = Object.fromEntries(Object.keys(SIGNATURE).map(k => [k, 0]));
    let matched = 0;
    for (const call of learnCalls) {
      let any = false;
      for (const [kind, re] of Object.entries(SIGNATURE)) {
        if (re.test(call.source || '')) { hits[kind]++; any = true; }
      }
      if (any) matched++;
    }
    console.log(`[population] variant channels over 200 seasons: ${JSON.stringify(hits)}`);
    // PER-CHANNEL FLOORS, and they are not all the same number because the
    // channels are not the same size. Five of them speak to the whole room, so
    // one night writes a dozen beliefs. `voice-on-the-stair` is ONE belief held
    // by ONE person — the thinnest channel in the file by construction, in the
    // way `late lift` is the thinnest band — so its floor is stated at what a
    // 200-season sample actually reaches rather than at a round number that
    // would make the guard fail for being honest.
    const FLOOR = { 'voice-on-the-stair': 12 };
    for (const [kind, n] of Object.entries(hits)) {
      expect(n, `${kind} wrote nothing in 200 seasons`).toBeGreaterThan(FLOOR[kind] ?? 30);
    }
    // The sources are distinct sentences, so a belief can only belong to one
    // channel — which is the mechanical form of "a variant is not a wording".
    const total = Object.values(hits).reduce((a, b) => a + b, 0);
    expect(matched, 'two channels are writing the same sentence').toBe(total);
    learnCalls.length = 0;
  });

  it('and NOT ONE of them writes a public or observed alignment belief', () => {
    learnCalls.length = 0;
    capture.on = true;
    try { seasons(60); } finally { capture.on = false; }
    const mine = learnCalls.filter(c => /on the list with|within reach of|from the chapel|dungeon stair|came back alone|had both been saying/.test(c.source || ''));
    expect(mine.length, 'the variant channels wrote nothing at all').toBeGreaterThan(200);
    for (const c of mine) {
      expect(['deduced', 'rumor'], `${c.source} wrote at ${c.sourceType}`).toContain(c.sourceType);
      expect(c.confidence, `${c.source} priced above the deduced ceiling`).toBeLessThanOrEqual(0.62);
    }
    learnCalls.length = 0;
  });

  it('emits a variant night EXACTLY ONCE, and never re-walks an old one', () => {
    // THE BUG THIS IS HERE FOR ALREADY SHIPPED ONCE in murderEvidence, as
    // `round.ep >= ep` — which stops a same-episode re-read and then re-emits
    // the same old round every round for the rest of the season. The equality
    // is the guard, and this asserts the equality rather than the symptom.
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      murderTarget: victim, ballots: [], accusations: [],
      variant: 'plain-sight', variantData: { actor: TRAITORS[0], method: 'a poisoned glass',
        nearby: [TRAITORS[0], CAST[5], CAST[6]] } });
    gs.activePlayers = CAST.filter(n => n !== victim);
    const first = variantEvidence(3, seededRng(4));
    expect(first.length, 'the night after a plain-sight murder taught the room nothing')
      .toBeGreaterThan(0);
    expect(variantEvidence(4, seededRng(4)), 'an old round was re-emitted a round later')
      .toHaveLength(0);
    expect(variantEvidence(9, seededRng(4)), 'an old round was re-emitted all season')
      .toHaveLength(0);
  });

  it('NEVER INDICTS SOMEBODY WHO HAS LEFT THE CASTLE, on any channel', () => {
    // THE SMALLEST CHANGE IN THIS TASK AND THE ONE WITH THE LARGEST EFFECT.
    // Every channel here names people chosen the night before, and a spared
    // name, a dinner guest or a dungeon companion can be banished or murdered
    // between then and the breakfast the room reasons at. Without this the
    // double-murder channel read 23.9% Traitor against a room of 21.6% over
    // 1,200 seasons -- indistinguishable from chance at z = 0.88 -- because
    // most of the names it indicted had already left. With it, the same
    // channel is 39.4% against 22.4%, z = 2.98. The signal was always there;
    // it was buried under beliefs about the departed.
    //
    // Asserted per channel and at the write, because it is a rule about the
    // WRITE and the belief store keeps only the survivors of an overwriting
    // process.
    const gone = CAST[7], here = CAST[6], victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      murderTarget: victim, ballots: [], accusations: [],
      variant: 'on-trial', variantData: { list: [victim, gone, here], spared: [gone, here] } });
    gs.activePlayers = CAST.filter(n => n !== victim && n !== gone);
    const formed = variantEvidence(3, seededRng(6));
    expect(formed.length, 'the death list taught the room nothing at all').toBeGreaterThan(0);
    expect(formed.map(f => f.subject), 'the castle is suspecting somebody who is not in it')
      .not.toContain(gone);
    // The control: the name that IS still standing was indicted, so the line
    // above is a filter doing work rather than a channel that emitted nothing.
    expect(formed.map(f => f.subject), 'the living spared name was not indicted either')
      .toContain(here);
  });

  it('a blocked variant night emits nothing: every chair is full and there is no body to read', () => {
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: null,
      murderTarget: victim, ballots: [], accusations: [],
      variant: 'plain-sight', variantData: { actor: TRAITORS[0], method: 'a poisoned glass',
        nearby: [TRAITORS[0], CAST[5], CAST[6]] } });
    gs.tr.blockedMurders = [{ ep: 2, target: victim }];
    expect(variantEvidence(3, seededRng(4)), 'a night nobody died on still indicted three people')
      .toHaveLength(0);
  });

  it('THE SENTENCE AGREES WITH THE NIGHT: a chapel that named nobody does not print a name', () => {
    // FOUR HUNDRED SEASONS AND NOT TWO HUNDRED, because the fact this guard
    // turns on is the rarer half of a rare variant: a chapel plea from a
    // victim whose board was empty. At 200 seasons the silent arm reached 13
    // firings, which is the population size Task 4's surviving mutation lived
    // in. Doubling the sample is the fix; lowering the floor would not be.
    const runs = seasons(400);
    let named = 0, silent = 0, lines = 0;
    // EVERY POOL AND EVERY LINE IN IT. Two pools in the first draft of this
    // file were written, registered and unreachable -- `on-trial-1` because
    // the death list always ran to three names, and the `{a}, {b} and {c}`
    // opening because nothing ever varied. That is the same defect shape as
    // the five castle twists that shipped with no VP screen, and the only
    // thing that catches it is sweeping the real output.
    const reached = {};
    for (const season of runs) {
      for (const r of season.rounds) {
        if (!r.variantLine) continue;
        lines++;
        // No pool anywhere may ship an unsubstituted placeholder. Task 4
        // printed `{They}` on 100% of one pool's firings.
        expect(r.variantLine, `an unsubstituted placeholder: ${r.variantLine}`)
          .not.toMatch(/\{[a-zA-Z_]+\}/);
        // ── THE KEY, AND THEN THE TEXT ──────────────────────────────
        // A mutation that forced every chapel scene through the accusing pool
        // was GREEN against a guard that read only the rendered sentence: with
        // no name to substitute, `{plea}` rendered empty and the sentence
        // contained no wrong name. So the fact is asserted against the POOL
        // KEY, and the key is held honest by checking the text really is one
        // of that pool's templates.
        const idx = poolIndex(r.variantLineKey, r.variantLine);
        expect(idx,
          `a ${r.variant} line does not come from the ${r.variantLineKey} pool: ${r.variantLine}`)
          .toBeGreaterThan(-1);
        (reached[r.variantLineKey] ||= new Set()).add(idx);
        if (r.variant === 'on-trial') {
          expect(r.variantLineKey, 'a death list narrated the wrong number of names')
            .toBe(`on-trial-${r.variantData.spared.length}`);
        }
        if (r.variant === 'face-to-face') {
          expect(r.variantLineKey, `a chapel with plea=${r.variantData.plea} used the wrong pool`)
            .toBe(r.variantData.plea ? 'chapel-named' : 'chapel-silent');
          if (r.variantData.plea) {
            named++;
            expect(r.variantLine, `the chapel named ${r.variantData.plea} and the line does not`)
              .toContain(r.variantData.plea);
          } else {
            silent++;
            // THE CLAIM THAT IS SOMETIMES FALSE, and the one this guard exists
            // for: a victim who worked nothing out must not be printed making
            // an accusation. The pool is keyed on it, so the contradiction is
            // unrepresentable — this checks the key was actually used.
            // Whole words only. The roster contains a one-letter name, and a
            // substring sweep reported every sentence with a capital B in it.
            //
            // THE ESCAPE IS DOUBLED, AND THAT IS THE WHOLE GUARD. Written as
            // `` `\b${n}\b` `` this was U+0008 (backspace) on both ends — a
            // template literal parses `\b` as a string escape before the regex
            // ever sees it, so the pattern was structurally incapable of
            // matching and the assertion had passed on every implementation
            // since it was written. Verified: source char codes 8,66,111,98,8
            // and `rx.test('Bob was named in the chapel.')` === false.
            // Any regex escape inside a string or template literal needs the
            // second backslash; `\\b` survives the parser, `\b` does not.
            for (const n of BIG_CAST) {
              if (n === r.murderTarget || n.length < 3) continue;
              expect(r.variantLine, `a silent chapel printed the name ${n}`)
                .not.toMatch(new RegExp(`\\b${n}\\b`));
            }
          }
        }
        if (r.variant === 'dungeon') {
          expect(r.variantLine, 'the dungeon line does not name who came back')
            .toContain(r.variantData.companion);
        }
        if (r.variant === 'double') {
          const [a, b] = r.variantData.victims;
          if (r.variantLine.includes(a)) {
            expect(r.variantLine, 'a double-murder line named one body and not the other')
              .toContain(b);
          }
        }
      }
    }
    console.log(`[population] ${lines} variant sentences; chapel ${named} named / ${silent} silent`);
    console.log('[coverage] lines reached per pool: ' + Object.keys(VARIANT_LINES)
      .map(k => `${k} ${(reached[k]?.size ?? 0)}/${VARIANT_LINES[k].length}`).join(', '));
    for (const [key, pool] of Object.entries(VARIANT_LINES)) {
      expect(reached[key]?.size ?? 0,
        `the ${key} pool has lines nothing ever reaches`).toBe(pool.length);
    }
    expect(named, 'no chapel plea ever named anybody').toBeGreaterThan(40);
    expect(silent, 'no chapel plea was ever empty — the split is untested').toBeGreaterThan(20);
  });

  it('THE LEDGER AGREES WITH THE NIGHT: two bodies on a double, a Traitor on a sacrifice', () => {
    const runs = seasons(200);
    let doubles = 0, sacrifices = 0;
    for (const season of runs) {
      const isTr = alignFor(season);
      for (const r of season.rounds) {
        if (r.variant === 'double' && r.variantData?.victims?.length === 2) {
          doubles++;
          expect(r.secondVictim, 'a double murder recorded two victims and removed one')
            .toBe(r.variantData.victims[1]);
          expect(season.survivors, 'a double-murder victim is still standing at the end')
            .not.toContain(r.variantData.victims[1]);
        }
        if (r.variant === 'name-your-own') {
          sacrifices++;
          // THE WHOLE POINT OF THE VARIANT, read off the era ledger rather
          // than recomputed at season end — alignment has eras and a recruit
          // banished later reads wrong from a season-end recompute.
          expect(isTr(r.variantData.sacrificed, r.ep),
            `${r.variantData.sacrificed} was made to die for the pact and was not in it`).toBe(true);
          expect(r.variantData.decider, 'nobody signed for it').toBeTruthy();
          expect(r.variantData.decider).not.toBe(r.variantData.sacrificed);
        }
      }
    }
    console.log(`[population] ${doubles} double murders, ${sacrifices} forced sacrifices over 200 seasons`);
    expect(doubles, 'no double murder to check').toBeGreaterThan(30);
    expect(sacrifices, 'no forced sacrifice to check').toBeGreaterThan(30);
  });

  it('a season the catalogue never touched is BIT-IDENTICAL to a season with no catalogue', () => {
    // THE EQUIVALENCE ARM, in the only form that is honest here. The
    // catalogue is a GAMEPLAY change — a double murder empties two chairs out
    // of a room whose size decides how many draws the next conclave takes — so
    // "the whole population is unchanged" would be a false claim. What IS
    // claimed, and what the no-draw discipline in murder-variants.js buys, is
    // that a season which happened to come up standard every night consumes
    // exactly the numbers it consumed before the file existed. A hash costs
    // nothing; a draw would have re-rolled every season in the sample.
    const project = (s) => s.log.map(r => [
      r.ep, r.banished, r.wasTraitor, r.murdered, r.murderTarget, r.blocked,
      r.executed, r.recruited?.target ?? null,
      (r.castleEvents || []).map(e => e.id).join(','),
    ].join('|')).join('\n') + `\n${s.winner}|${s.survivors.join(',')}`;

    const restore = _setVariantsEnabled(false);
    let off;
    try { off = seasons(60).map(project); } finally { restore(); }
    const on = seasons(60);

    let identical = 0, diverged = 0;
    for (let i = 0; i < on.length; i++) {
      const quiet = on[i].rounds.every(r => (r.variant ?? 'standard') === 'standard');
      if (quiet) {
        identical++;
        expect(project(on[i]), `season ${i + 1} ran no variant and still diverged`).toBe(off[i]);
      } else {
        diverged++;
      }
    }
    console.log(`[equivalence] ${identical} of 60 seasons ran no variant and reproduced the base `
      + `season exactly; ${diverged} ran one and are not claimed to`);
    // BOTH FLOORS. Without the first the assertion never runs; without the
    // second the seam under test never engaged and the arm is comparing an
    // engine with itself.
    expect(identical, 'no season came up standard throughout — nothing was compared')
      .toBeGreaterThan(4);
    expect(diverged, 'the catalogue never fired — the hold-out held nothing out')
      .toBeGreaterThan(20);
  });
});

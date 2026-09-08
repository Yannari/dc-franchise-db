// ══════════════════════════════════════════════════════════════════════
// tr-sacrifice.test.js — spending a burned fellow, and paying for a
// wrong call
// ══════════════════════════════════════════════════════════════════════
//
// Two rules land together because the second is what makes the first pay:
//
//   1. A Traitor may join a pile-on that is already forming on a FELLOW
//      Traitor, and may cut a burned fellow loose at the ballot more cheaply
//      than a safe one.
//   2. Everybody who publicly named the banished player is priced once the
//      reveal is in: credit if the name was a Traitor, a small mark if it was
//      a Faithful.
//
// Rule 1 buys cover ONLY because rule 2 exists and does not know about
// Traitors — the name really was a Traitor, so the credit is earned by the
// same rule that punishes anyone else for being wrong. That is the whole
// argument for writing it as a rule rather than as a Traitor power, and the
// last test in this file is the one that would catch it being special-cased.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { alignmentAt } from '../js/tr/roles.js';
import { pStats } from '../js/players.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/**
 * Seasons, with each round joined to the log line that says who went.
 *
 * ALIGNMENT IS SNAPSHOTTED HERE AND NOT READ LATER. `alignmentAt` resolves
 * against `gs`, which holds whichever season was played LAST — so calling it
 * from an assertion after a 60-season sweep answers about season 60 for every
 * row in the table. That produced a confident, entirely false "a non-Traitor
 * sacrificed" on the first run of this file, and the same trap silently zeroed
 * an exploratory measurement earlier the same day. Read it while its season is
 * still the current one, keep the answer.
 */
function sweep(n) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    setPlayers(ROSTER);
    seasonConfig.trShieldSource = 'mission';
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    const byEp = new Map();
    for (const r of (res.rounds || [])) byEp.set(r.ep, r);
    for (const L of (res.log || [])) {
      const r = byEp.get(L.ep);
      if (!r) continue;
      const align = {};
      for (const nm of CAST) align[nm] = alignmentAt(nm, L.ep);
      out.push({ seed, ep: L.ep, round: r, log: L, align });
    }
  }
  return out;
}
const NIGHTS = sweep(60);

describe('a Traitor can spend a fellow the room has already burned', () => {
  it('happens, and is rare enough to stay a move rather than a habit', () => {
    const sacs = NIGHTS.flatMap(n => (n.round.accusations || []).filter(a => a.sacrifice));
    const acc = NIGHTS.reduce((t, n) => t + (n.round.accusations || []).length, 0);
    const seasons = new Set(NIGHTS.filter(n =>
      (n.round.accusations || []).some(a => a.sacrifice)).map(n => n.seed));
    // MEASURED at 19 across these 60 seasons, in 14 of them. Banded rather
    // than pinned: the exact count rides the rng stream, and what this guards
    // is that the move is REACHABLE and stays a set piece. A pool where every
    // Traitor throws every burned ally is not this format.
    expect(sacs.length, 'the sacrifice never fires at all').toBeGreaterThan(4);
    expect(sacs.length / acc, 'the sacrifice is no longer a rare move')
      .toBeLessThan(0.03);
    expect(seasons.size, 'no season contains one').toBeGreaterThan(3);
  });

  it('is always aimed at a real fellow, and never on the first table', () => {
    for (const n of NIGHTS) {
      for (const a of (n.round.accusations || []).filter(x => x.sacrifice)) {
        expect(n.align[a.accuser], `s${n.seed} ep${n.ep}: a non-Traitor sacrificed`)
          .toBe('traitor');
        expect(n.align[a.target], `s${n.seed} ep${n.ep}: sacrificed a non-Traitor`)
          .toBe('traitor');
        // THE PILE-ON HAS TO EXIST FIRST. `burnedFellow` reads the accusations
        // made SO FAR TONIGHT and `debate()` fills them in speaking order, so
        // a Traitor can only ever join a burn already under way. This is what
        // stops the mechanic being a night-one confession — structurally,
        // rather than by a date check — so it is asserted rather than trusted.
        const before = [];
        for (const x of (n.round.accusations || [])) {
          if (x === a) break;
          before.push(x);
        }
        expect(before.filter(x => x.target === a.target).length,
          `s${n.seed} ep${n.ep}: sacrificed somebody nobody had named yet`)
          .toBeGreaterThanOrEqual(2);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// AND THE BALLOT HAS TO RESPOND TO THE BURN, NOT ONLY THE DEBATE
// ══════════════════════════════════════════════════════════════════════
//
// The arms above guard the SPEECH — a Traitor standing up and naming a fellow
// the room is already on. This one guards the vote, which is the half a viewer
// actually notices, and it exists because that half was broken in a way no
// assertion here could see.
//
// WHAT WAS MEASURED, 60 seasons, the share of Traitor ballots that named a
// fellow, split by how many people had publicly named that fellow at the same
// table:
//
//     accusers   before   after
//     1           13.3%     6.0%
//     2           16.8%    35.1%
//     3           36.8%    41.2%
//     4           20.2%    59.2%     <- it used to turn OVER at the top
//     5+           n/a     74.8%
//
// A response curve that falls at its top end is two terms fighting rather than
// a preference. `pactReluctance` is quadratic in the living count, so a table
// of twelve prices the pact at 13.75 against suspicion scores that live
// between 0 and about 2 — and the burn term was a PERCENTAGE off that. Four
// accusers also needs a big room to be available in, which is exactly where
// the quadratic is largest, so the most burned fellows were the hardest to
// name. See `PACT_BURNED_COST` in js/tr/deduction.js for that half of the fix:
// the burn blends toward a fixed price instead of scaling the old one.
//
// AND THE SIGNAL ITSELF WAS MEASURING THE WRONG THING, which is the half that
// reaches the ordinary table. It counted accusations against a saturation of
// three, and a table's most-accused person has three or more only two-thirds
// of the time — so on the other third the mechanism was simply switched off,
// and a fellow with two accusers was joined at 18.6%. What burns somebody at a
// Round Table is not a count, it is being THE NAME THE ROOM HAS SETTLED ON:
// two accusers is a landslide when nobody else has more than two, and three is
// nothing much when somebody else has five — that other person is the one
// going, so there is no fellow to abandon. `tonightsBurn` is the fellow's
// count against the table's LEADING count now, and the two-accuser table, the
// most common kind there is, moved 18.6% -> 35.1%.
//
// SO THE SHAPE IS ASSERTED, NOT THE NUMBERS. Rates ride the rng stream and
// this file has already said so once; what must not come back is a curve that
// stops rising, or a top end a Traitor cannot reach.
describe('a Traitor joins a landslide that has landed on a fellow', () => {
  const byAccusers = { 1: { n: 0, hit: 0 }, 2: { n: 0, hit: 0 }, 3: { n: 0, hit: 0 }, 4: { n: 0, hit: 0 } };
  for (const n of NIGHTS) {
    const ballots = n.round.ballots || [];
    if (!ballots.length) continue;
    const living = ballots.map(b => b.voter);
    const fellows = living.filter(x => n.align[x] === 'traitor');
    if (fellows.length < 2) continue;
    const accCount = {};
    for (const a of (n.round.accusations || [])) {
      if (a.target) accCount[a.target] = (accCount[a.target] || 0) + 1;
    }
    for (const b of ballots) {
      if (n.align[b.voter] !== 'traitor' || !b.voted) continue;
      // The most publicly accused fellow available to this voter tonight.
      let worst = null, worstN = 0;
      for (const f of fellows) {
        if (f === b.voter) continue;
        const c = accCount[f] || 0;
        if (c > worstN) { worstN = c; worst = f; }
      }
      if (!worst) continue;
      const bucket = byAccusers[Math.min(4, worstN)];
      if (!bucket) continue;
      bucket.n++;
      if (b.voted === worst) bucket.hit++;
    }
  }
  const rate = k => byAccusers[k].hit / Math.max(1, byAccusers[k].n);

  it('is rarer than chance when one person has said it and common when four have', () => {
    for (const k of [1, 2, 3, 4]) {
      expect(byAccusers[k].n, `no Traitor ballot faced a fellow with ${k} accusers — `
        + 'the measurement below is vacuous').toBeGreaterThan(20);
    }
    // ONE VOICE IS NOT A BURN. A single accusation must leave the pact
    // essentially intact, or "burned" means "mentioned".
    expect(rate(1), 'one accuser is already enough to break the pact').toBeLessThan(0.25);
    // AND FOUR IS. This is the arm the whole change exists for: with four
    // separate people naming a fellow out loud, writing that name is the
    // ordinary play and holding the line is the exception.
    expect(rate(4), 'a fellow four people have named out loud is still being protected')
      .toBeGreaterThan(0.5);
  });

  it('and WHO is sitting there changes it - loyalty is priced, not just the room', () => {
    // Every number in `pactReluctance` was about the SITUATION - bodies left,
    // pot, how burned the fellow is - so two Traitors at the same table, a
    // loyal soldier and a snake, made the identical call. The pact was a
    // property of the castle rather than of the people in it.
    //
    // MEASURED, cast 20, 120 seasons, share of Traitor ballots naming a fellow
    // by the VOTER's own loyalty:
    //
    //     loyalty 0-3    15.2%
    //     loyalty 4-6    14.8%
    //     loyalty 7-10   11.4%
    //
    // Proportional and not a threshold (AGENTS.md): there is no loyalty above
    // which betrayal is impossible and none below which it is automatic. A
    // loyal Traitor with the whole room shouting at a fellow will still
    // sometimes write the name. What moves is the price.
    const band = { low: { n: 0, hit: 0 }, high: { n: 0, hit: 0 } };
    for (const n of NIGHTS) {
      const ballots = (n.round.ballots || []).filter(b => b.voted);
      if (ballots.length < 5) continue;
      const trs = new Set(ballots.map(b => b.voter).filter(x => n.align[x] === 'traitor'));
      if (trs.size < 2) continue;
      for (const b of ballots) {
        if (!trs.has(b.voter)) continue;
        const l = pStats(b.voter)?.loyalty ?? 5;
        const k = l <= 3 ? 'low' : l >= 7 ? 'high' : null;
        if (!k) continue;
        band[k].n++;
        if (trs.has(b.voted)) band[k].hit++;
      }
    }
    expect(band.low.n, 'no low-loyalty Traitor ever voted').toBeGreaterThan(80);
    expect(band.high.n, 'no high-loyalty Traitor ever voted').toBeGreaterThan(80);
    const lowRate = band.low.hit / band.low.n;
    const highRate = band.high.hit / band.high.n;
    // THE DIRECTION, NOT THE GAP. The gap is a handful of points and rides the
    // stream; what must hold is that the loyal Traitor is the one who holds
    // the line. A mutation removing `pactCharacter` makes these equal.
    expect(lowRate, `loyalty 0-3 betray at ${(100 * lowRate).toFixed(1)}% and 7-10 at `
      + `${(100 * highRate).toFixed(1)}% - loyalty is not reaching the pact price`)
      .toBeGreaterThan(highRate);
    // AND NEITHER END IS ABSOLUTE: no stat gates this off or forces it.
    expect(highRate, 'a loyal Traitor never betrays at all - the stat has become a gate')
      .toBeGreaterThan(0.02);
    expect(lowRate, 'a disloyal Traitor always betrays - the stat has become a gate')
      .toBeLessThan(0.6);
  });

  it('and the table SHOWS it: a fellow going down on a pile-on gets a fellow\'s vote', () => {
    // ── THE NUMBER A VIEWER ACTUALLY SEES ────────────────────────────
    //
    // The arm above is a per-ballot rate, which is the right way to state the
    // mechanism and the wrong way to state the experience. What somebody
    // watching the reveal sees is one question: when a Traitor goes down with
    // the room shouting their name, did any of their own write it too?
    //
    // MEASURED at cast 20, 150 seasons, on a Traitor banished with three or
    // more public accusers against them:
    //
    //                     before   after
    //     any room         39.3%    87.2%
    //     rooms of 16+     19.0%    87.5%
    //
    // THE BIG-ROOM ROW IS THE ONE THAT WAS REPORTED FROM WATCHING A SEASON.
    // A twenty-handed first table, four people naming the same Traitor, seven
    // votes landing on her — and both her fellows wrote somebody else. On the
    // old code that was not bad luck, it was the 81% case: `pactReluctance`
    // prices the pact at 0.55 * 81 = 44.55 in a room of twenty, and eighty per
    // cent off 44.55 is 8.91, against reads worth 2. The bigger the room, the
    // more impossible it was — which is backwards, because a big room is
    // exactly where a clean public vote is worth the most.
    const cases = [];
    for (const n of NIGHTS) {
      const ballots = n.round.ballots || [];
      if (!ballots.length || !n.round.banished) continue;
      if (n.align[n.round.banished] !== 'traitor') continue;
      const living = ballots.map(b => b.voter);
      const others = living.filter(x => x !== n.round.banished && n.align[x] === 'traitor');
      if (!others.length) continue;
      const acc = (n.round.accusations || []).filter(a => a.target === n.round.banished).length;
      if (acc < 3) continue;
      cases.push({
        joined: ballots.some(b => others.includes(b.voter) && b.voted === n.round.banished),
        big: living.length >= 16,
      });
    }
    expect(cases.length, 'no Traitor was ever banished off a pile-on, so this measures nothing')
      .toBeGreaterThan(30);
    const rate = cases.filter(c => c.joined).length / cases.length;
    expect(rate, `only ${(100 * rate).toFixed(1)}% of burned Traitors got a vote from one of `
      + 'their own — the room is watching people hold a line that costs them everything')
      .toBeGreaterThan(0.6);
    // AND IT MUST NOT FALL AWAY IN THE BIG ROOMS, which is the whole defect.
    // Floored rather than banded: the sample here is the early tables of 60
    // seasons and it is not large, so this asserts the direction the old code
    // got wrong rather than pinning a rate.
    const big = cases.filter(c => c.big);
    if (big.length >= 15) {
      const bigRate = big.filter(c => c.joined).length / big.length;
      expect(bigRate, `${(100 * bigRate).toFixed(1)}% in rooms of 16+ — the pact price is `
        + 'growing with the room faster than the burn can discount it again')
        .toBeGreaterThan(0.5);
    }
  });

  it('and the response rises the whole way — a curve that turns over is a bug', () => {
    // THE MUTATION THIS CATCHES is the one that shipped: a burn term real
    // enough to move the two- and three-accuser cases and arithmetically
    // unable to reach the four-accuser case, which then reads LOWER than
    // three. Stated as an ordering rather than as four bands, because the
    // rates themselves ride the stream.
    expect(rate(4), `4 accusers (${(100 * rate(4)).toFixed(1)}%) reads lower than 2 `
      + `(${(100 * rate(2)).toFixed(1)}%) — the response curve turns over, which means `
      + 'a term that grows with room size is beating the burn discount')
      .toBeGreaterThan(rate(2));
    expect(rate(3), 'three accusers moves nobody more than one does')
      .toBeGreaterThan(rate(1));
  });
});

describe('the table prices who was right', () => {
  it('records the accusers it priced, and only on a night with a reveal', () => {
    let withPricing = 0;
    for (const n of NIGHTS) {
      if (!n.log.banished) continue;
      const priced = n.round.accusersPriced;
      if (!priced) continue;
      withPricing++;
      const named = new Set((n.round.accusations || [])
        .filter(a => a.target === n.log.banished).map(a => a.accuser));
      for (const p of priced) {
        expect(named.has(p), `s${n.seed} ep${n.ep}: priced somebody who never named them`)
          .toBe(true);
      }
    }
    expect(withPricing, 'no night priced anybody').toBeGreaterThan(50);
  });

  // THE RULE IS BLIND TO ALIGNMENT, which is the property the whole design
  // rests on. If a Traitor's correct call were credited by a different path
  // than a Faithful's, the sacrifice would be a Traitor power wearing a rule's
  // clothes — and the credit would stop being cover the room could believe.
  it('credits a Traitor who calls it exactly as it credits a Faithful', () => {
    let tCredited = 0, fCredited = 0;
    for (const n of NIGHTS) {
      if (!n.log.banished || !n.log.wasTraitor || !n.round.accusersPriced) continue;
      for (const p of n.round.accusersPriced) {
        if (n.align[p] === 'traitor') tCredited++; else fCredited++;
      }
    }
    // Both populations are reached by the same code path, so both must be
    // non-empty; a zero on either side means one of them is being routed
    // somewhere else.
    expect(fCredited, 'no Faithful was ever credited for a correct call')
      .toBeGreaterThan(0);
    expect(tCredited, 'no Traitor was ever credited for a correct call — the '
      + 'rule has stopped being blind to alignment').toBeGreaterThan(0);
  });
});

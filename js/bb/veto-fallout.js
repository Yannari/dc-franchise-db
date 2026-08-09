// ══════════════════════════════════════════════════════════════════════
// bb/veto-fallout.js — what the veto ceremony costs
// ══════════════════════════════════════════════════════════════════════
//
// The ceremony had exactly one social consequence in it. One line:
//
//   if (save && save !== holder) recordProtection(holder, save, ...)
//
// Being pulled off the block created a debt, and that was the entire footprint
// of the most-used power in the format. Nothing happened when it was NOT used —
// a nominee sat in that chair while the one person who could have saved them
// did nothing, and their relationship did not move by a point. Nothing happened
// to the replacement, who was seated because somebody else came down. Nothing
// happened to a Head of Household whose week had just been taken apart.
//
// The asymmetry is the tell. `shouldUseVeto` READS a rich model — perceived
// bonds, obligation, fear of the Head of Household, alliance ties, whether the
// save is the target, how big the replacement pool is — and wrote back one
// line. The decision was informed by the social graph and did not feed it.
//
// Everything here is proportional. The two things that scale it:
//
//   PLAUSIBILITY — how much saving you was ever on the cards. Being left on the
//   block by a stranger who owed you nothing is not a betrayal; being left up
//   by your own alliance-mate who had three safe renoms available is.
//
//   DAMAGE — how much the use actually cost the Head of Household. A veto can
//   be used and the HOH not care at all, because the person who came down was
//   never the point. Anger belongs to the week where the TARGET walked.
import { addBond, getPerceivedBond } from '../bonds.js';
import { pronouns } from '../players.js';
import { allyStake, rememberBBStrategy, setBBTarget } from './shared-strategy.js';
import { recordProtection, recordStrategicRespect } from '../relationship-events.js';

const beat = (text, players, badgeText, badgeClass = 'blue') =>
  ({ text, players: [...new Set((players || []).filter(Boolean))], badgeText, badgeClass });

const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
const stake = (a, b) => { try { return allyStake(a, b); } catch { return 0; } };
const pick = (pool, rng) => pool[Math.floor((rng ? rng() : Math.random()) * pool.length)];

/**
 * How much the Head of Household actually lost.
 *
 * The distinction the whole thing turns on, and the one a naive version gets
 * wrong: a veto being used is not the same as a plan being wrecked. If the
 * person who came down was a pawn and the target is still sitting there, the
 * Head of Household does not care and should not act as though they do —
 * the week still ends the way they wanted it to.
 *
 * @returns 0..1
 */
export function planDamage({ decision, priorBlock = [], nominees = [], plan, hoh, holder }) {
  if (!decision?.use || !hoh || holder === hoh) return 0;
  const target = plan?.target || plan?.backdoorTarget || null;
  const saved = decision.save;
  // The target walked off the block. This is the whole of the damage.
  if (target && saved === target) return 1;
  // No named target: fall back to whether the block even changed shape in a way
  // that mattered — somebody the HOH wanted up is no longer up.
  const wanted = (priorBlock || []).filter(n => n !== saved);
  const stillUp = wanted.every(n => nominees.includes(n));
  if (target && nominees.includes(target)) {
    // The target is STILL on the block. A pawn was swapped for a pawn and the
    // week lands where it was always going to land.
    return stillUp ? 0.08 : 0.16;
  }
  // The target came off some other way, or there never was one. Middling: an
  // HOH does not enjoy being overruled even when it costs them little.
  return target ? 0.55 : 0.3;
}

/**
 * How reasonable it was to expect to be saved.
 *
 * Nobody resents a stranger for not spending a veto on them. `allyStake` is the
 * same read the powers use — alliance first, bond second — and the rest is
 * whether saving them was even legal: with no eligible replacement the rules
 * made the decision and there is nothing to hold against anybody.
 *
 * @returns 0..1
 */
export function saveExpectation({ nominee, holder, decision, replacementPool = [] }) {
  if (!nominee || !holder || nominee === holder) return 0;
  // They saved themselves. Everybody understands that, and it still stings a
  // little less than being passed over for a third party.
  const selfSave = decision?.use && decision.save === holder;
  // The rules, not the person: no chair to fill means no choice was made.
  if (!replacementPool.length && !selfSave) return 0;
  const base = stake(holder, nominee);
  return Math.max(0, Math.min(1, base * (selfSave ? 0.45 : 1)));
}

const LEFT_UP = [
  (n, h, p) => `${n} watches ${h} put the veto back in the box and does not look away from ${h} `
    + `while ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} it.`,
  (n, h) => `${h} had one thing that could have moved ${n} off that block and chose to keep it. `
    + `${n} says nothing at the ceremony, which everybody notices more than shouting.`,
  (n, h) => `${n} thanks ${h} for nothing, quietly, on the way out of the room. It is not a joke `
    + 'and both of them know it.',
  (n, h) => `${n} had spent the week being told this was handled. ${h} handled it by doing `
    + 'absolutely nothing, and there is a version of this house where that is the last favour '
    + `${n} ever does ${h}.`,
];

const SEATED = [
  (r, hoh) => `${r} was not on anybody's list this morning and is on the block by the afternoon. `
    + `${hoh} says it is not personal. ${r} has heard that before.`,
  (r, hoh, saved) => `${r} takes the chair ${saved} was sitting in an hour ago and does the `
    + `arithmetic out loud: somebody had to go up, and ${hoh} thought about it for four seconds.`,
  (r, hoh) => `"Pawn." ${r} repeats the word back to ${hoh} without any particular expression. `
    + 'Pawns go home in this game and everybody in the room knows the statistics.',
  (r, hoh, saved) => `${r} is polite to ${hoh} and cannot look at ${saved} at all, which is the `
    + 'wrong way round and is going to matter in about nine days.',
];

const OVERRULED = [
  (h, hoh, saved) => `${hoh} runs the ceremony, says the right words, and watches ${saved} walk off `
    + `a block ${hoh} spent three days building. ${h} did that in front of everybody.`,
  (h, hoh) => `${hoh} does not react at the ceremony. ${hoh} reacts about forty minutes later, to `
    + `somebody else, in a room ${h} is not in.`,
  (h, hoh, saved) => `The week was pointed at ${saved} and is not any more. ${hoh} has one nomination `
    + `left to spend and a much shorter list of people to spend it on, and ${h} is now on it.`,
];

const SHRUG = [
  (h, hoh, saved) => `${saved} comes down and ${hoh} barely moves. The block still has the name on `
    + `it that ${hoh} wanted on it, and a swapped chair is not a wrecked week.`,
  (h, hoh) => `${hoh} shrugs it off, honestly rather than for show: the veto changed a face and did `
    + 'not change the plan.',
];

/**
 * Everything the ceremony costs, applied.
 *
 * @returns {{beats: object[], damage: number, resented: string[]}}
 */
export function applyVetoFallout({
  week, holder, decision, priorBlock = [], nominees = [], replacement = null,
  hoh = null, plan = null, house = [], rng = Math.random,
} = {}) {
  const beats = [];
  const resented = [];
  if (!holder) return { beats, damage: 0, resented };
  const weekNum = Number(week?.num) || 0;
  const saved = decision?.use ? decision.save : null;
  const replacementPool = (house || []).filter(n =>
    n !== hoh && n !== holder && !priorBlock.includes(n));

  // ── 1. THE DEBT, which was the only thing here before ──
  if (saved && saved !== holder) {
    try { recordProtection(holder, saved, { strength: 1.6, ep: weekNum }); } catch { /* texture */ }
    // And the bond, which even this did not move. Being taken off the block is
    // the single largest favour available in the format.
    addBond(holder, saved, 2.2);
    beats.push(beat(
      `${saved} comes off the block because ${holder} decided so. That is not a gesture in this `
        + 'house, it is a debt, and it will be called in.',
      [holder, saved], 'A DEBT', 'gold'));
    // ── 4. AND THE HOUSE READS IT ──
    //
    // A veto used on somebody in front of everybody is information. The Coup
    // files a strategic memory and the veto — every week — filed nothing, so
    // the loudest weekly signal about who is working with whom was invisible to
    // the targeting that runs off exactly that.
    for (const n of house) {
      if (n === holder || n === saved) continue;
      try {
        rememberBBStrategy(n, holder, 'protects', 1.4, { partner: saved, week: weekNum });
      } catch { /* memory is texture */ }
    }
  }

  // ── 2. LEFT UP ──
  //
  // The biggest social moment of the week and it did nothing at all.
  for (const n of nominees) {
    if (n === saved || n === holder) continue;
    // Only people who were already sitting there before the ceremony. The
    // replacement has their own grievance and it is not this one.
    if (!priorBlock.includes(n)) continue;
    const expectation = saveExpectation({ nominee: n, holder, decision, replacementPool });
    if (expectation < 0.12) continue;
    resented.push(n);
    addBond(n, holder, -(1.1 + expectation * 2.6));
    // Somebody who was genuinely counting on it starts playing against them.
    if (expectation >= 0.5 && bond(n, holder) < 0) {
      try { setBBTarget(n, holder, 'left me on the block', { week: weekNum }); } catch { /* texture */ }
    }
    beats.push(beat(pick(LEFT_UP, rng)(n, holder, pronouns(holder)),
      [n, holder], expectation >= 0.5 ? 'LEFT UP BY A FRIEND' : 'LEFT UP', 'red'));
  }

  // ── 3. THE CHAIR NOBODY VOLUNTEERED FOR ──
  if (replacement && replacement !== holder) {
    // Split, because two people put them there: the one who named them and the
    // one whose rescue emptied the chair. The second half only when the
    // replacement had no part in it — a renom who is close to the saved player
    // takes it better.
    if (hoh && replacement !== hoh) addBond(replacement, hoh, -1.8);
    if (saved && saved !== replacement) addBond(replacement, saved, -0.7);
    if (hoh && replacementPool.length > 2) {
      // Real choice was available, so it was a choice. With one or two names
      // left it is arithmetic and nobody blames arithmetic.
      try { setBBTarget(replacement, hoh, 'put me up as a replacement', { week: weekNum }); } catch { /* texture */ }
    }
    beats.push(beat(pick(SEATED, rng)(replacement, hoh || 'the Head of Household', saved || 'nobody'),
      [replacement, hoh, saved], 'AND ONE MORE', 'red'));
  }

  // ── 4. THE HEAD OF HOUSEHOLD, IN PROPORTION TO WHAT IT COST THEM ──
  const damage = planDamage({ decision, priorBlock, nominees, plan, hoh, holder });
  if (hoh && holder !== hoh && decision?.use) {
    if (damage >= 0.45) {
      addBond(hoh, holder, -(0.8 + damage * 2.2));
      // Overruling somebody is also a demonstration that you will. The house
      // does not only resent that; it revises upward.
      try { recordStrategicRespect(hoh, holder, damage * 1.8, 'used the veto against my week', weekNum); } catch { /* texture */ }
      try { rememberBBStrategy(hoh, holder, 'crossed-me', damage * 2, { week: weekNum }); } catch { /* texture */ }
      beats.push(beat(pick(OVERRULED, rng)(holder, hoh, saved || 'a nominee'),
        [hoh, holder], 'THE PLAN, IN PIECES', 'red'));
    } else if (saved && saved !== holder) {
      // Said out loud, because "the veto was used and the Head of Household did
      // not mind" is a real outcome and reads as an omission if nothing marks
      // it. A swapped pawn is not a wrecked week.
      beats.push(beat(pick(SHRUG, rng)(holder, hoh, saved),
        [hoh, holder], 'NO REAL DAMAGE', 'grey'));
    }
  }

  return { beats, damage, resented };
}

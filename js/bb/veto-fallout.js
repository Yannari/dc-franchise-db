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
import { allyStake, rememberBBStrategy, setBBTarget } from './shared-strategy.js';
import { recordProtection, recordStrategicRespect } from '../relationship-events.js';
import { scriptBeat } from './script/inject.js';

const beat = (text, players, badgeText, badgeClass = 'blue') =>
  ({ text, players: [...new Set((players || []).filter(Boolean))], badgeText, badgeClass });

// A ceremony consequence, written as a scene (lines/vfall.js). The plain
// sentence stays only for a scene that could not be written.
function scene(eventId, kind, who, data, plain, players, badgeText, badgeClass, { week, hoh }) {
  const b = { ...beat(plain, players, badgeText, badgeClass), eventId, category: 'ceremonies', location: 'living-room' };
  const s = scriptBeat(kind, who, data, { week, act: 'veto-ceremony', hoh, room: 'living-room',
    salt: `${eventId}|${who.a}` });
  return s ? { ...b, text: s.text, lines: s.lines, lineId: s.lineId } : b;
}

const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
const stake = (a, b) => { try { return allyStake(a, b); } catch { return 0; } };
// The wording used to be drawn from the ceremony's own dice. The draw stays, so
// the season after it rolls exactly as it did; the words now come from a scene.
const draw = rng => (rng ? rng() : Math.random());

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
    beats.push(scene('veto-debt', 'vfall.debt', { a: saved, b: holder }, { ending: 'scene' },
      `${holder} uses the veto on ${saved}.`, [holder, saved], 'A DEBT', 'gold', { week, hoh }));
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
    draw(rng);
    beats.push(scene('veto-left-up', 'vfall.leftup', { a: n, b: holder },
      { ending: expectation >= 0.5 ? 'friend' : 'plain' }, `${holder} leaves ${n} on the block.`,
      [n, holder], expectation >= 0.5 ? 'LEFT UP BY A FRIEND' : 'LEFT UP', 'red', { week, hoh }));
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
    draw(rng);
    beats.push(scene('veto-seated', 'vfall.seated',
      { a: replacement, b: hoh || null, c: saved && saved !== replacement ? saved : null },
      { ending: 'scene', intent: hoh ? 'hoh' : 'anon' }, `${replacement} goes up as the replacement.`,
      [replacement, hoh, saved], 'AND ONE MORE', 'red', { week, hoh }));
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
      draw(rng);
      beats.push(scene('veto-overruled', 'vfall.overruled', { a: hoh, b: holder },
        { ending: 'scene', saved: saved || 'a nominee' }, `${holder}'s veto breaks up ${hoh}'s block.`,
        [hoh, holder], 'THE PLAN, IN PIECES', 'red', { week, hoh }));
    } else if (saved && saved !== holder) {
      // Said out loud, because "the veto was used and the Head of Household did
      // not mind" is a real outcome and reads as an omission if nothing marks
      // it. A swapped pawn is not a wrecked week.
      draw(rng);
      beats.push(scene('veto-shrug', 'vfall.shrug', { a: hoh, b: holder }, { ending: 'scene', saved },
        `${hoh} shrugs off the veto.`, [hoh, holder], 'NO REAL DAMAGE', 'grey', { week, hoh }));
    }
  }

  return { beats, damage, resented };
}

// ══════════════════════════════════════════════════════════════════════
// tr/armoury.js — the room the best of the afternoon walk into, one at a time
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THE REAL SHOW DOES (thetraitors.fandom.com/wiki/Armoury, /wiki/Shield):
// the players who did best in the day's mission earn the right to visit the
// Armoury. They enter in turn and each opens ONE box. One or more of the boxes
// has a Shield behind it. Everybody in the castle knows WHO WENT IN — it was
// the afternoon's reward, in front of everyone — and nobody except the winner
// knows WHO CAME OUT WITH ANYTHING.
//
// THAT ASYMMETRY IS THE ENTIRE MECHANIC, and it is why this file exists rather
// than another way of handing out a Shield. The group walks out and says
// nothing, and now the Traitors cannot touch ANY of them without risking a
// wasted night — so four people are protected by one Shield that only one of
// them has. The wiki calls this the metagame that got the Armoury retired from
// the British and American versions; here it is the point, because a simulator
// wants the hesitation, not the tidy outcome.
//
// The knowledge, stated exactly:
//   entrants  PUBLIC.  The castle watched them earn it and watched them go in.
//   holder    SECRET.  Nobody is told. `witnesses` is EMPTY, deliberately —
//                      that is what makes this different from a Shield won in
//                      the open (js/tr/powers.js `awardShield`, which records
//                      who saw it and lets the pact steer around the name).
//   pactAware TRUE ONLY IF A TRAITOR WON IT. A Traitor who opened the right
//                      box knows the Shield is spent on themselves, and the
//                      pact can stop being careful about the rest of the group.
//
// NO GAME rng. The draw comes off the MISSION stream (`_missionRngFor`), same
// as everything else in the afternoon, so adding an Armoury cannot re-roll a
// single murder or ballot in a season that does not run one.
import { gs, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { alignmentAt } from './roles.js';

/**
 * The Shield grant, written here rather than imported.
 *
 * `grantShield` lives in js/tr/murder.js, and murder.js imports THIS file for
 * `armouryHesitation` — importing it back would make a cycle between the
 * conclave and the room it reasons about. It is one Set write against the same
 * `gs.tr.shieldedThisRound` every other Shield uses, so `isShielded`,
 * `expireShields` and the blocked-murder record all still see it; keeping the
 * dependency one-way is worth the three duplicated lines.
 */
function _grantShield(name) {
  if (!gs.tr) return;
  if (!(gs.tr.shieldedThisRound instanceof Set)) {
    gs.tr.shieldedThisRound = new Set(gs.tr.shieldedThisRound || []);
  }
  gs.tr.shieldedThisRound.add(name);
}

/** 'armoury' | 'mission' | 'off' — where a Shield can come from this season. */
export function shieldSource() {
  const v = seasonConfig && seasonConfig.trShieldSource;
  return (v === 'armoury' || v === 'off') ? v : 'mission';
}
/** How many boxes hide a Shield. 1 by default; 2 is the show's "double" twist. */
export function shieldCount() {
  const n = Number(seasonConfig && seasonConfig.trShieldCount);
  return Math.max(1, Math.min(2, Number.isFinite(n) && n > 0 ? n : 1));
}
/** How many players earn the visit. Three or four, as the show runs it. */
export function armourySize() {
  const n = Number(seasonConfig && seasonConfig.trArmourySize);
  return Math.max(2, Math.min(6, Number.isFinite(n) && n > 0 ? n : 4));
}

/**
 * One player's contribution to the afternoon, on the mission's own terms.
 *
 * The same weighting the mission itself scores a team by (`0.55 * primary +
 * 0.45 * secondary`, js/tr/missions.js), so "the best of the afternoon" means
 * the same thing here as it does there rather than being a second opinion.
 * Falls back to a flat read when the mission declares no stats.
 */
function _contribution(name, mission) {
  const st = pStats(name);
  const p = mission && mission.primary, s = mission && mission.secondary;
  const a = p && st[p] != null ? st[p] : 5;
  const b = s && st[s] != null ? st[s] : 5;
  return (0.55 * a + 0.45 * b) / 10;
}

/**
 * WHO EARNED THE VISIT. The winning team first — "the first team home may
 * enter the Armoury" is the line the missions already say out loud — and
 * within it the biggest contributors, topped up from the next team down when
 * the winning team is short. Deterministic given the mission record: the
 * afternoon decided this, not a dice roll.
 */
function _entrants(mission, size) {
  const living = new Set(gs.activePlayers || []);
  const teams = [...(mission?.teams || [])]
    .filter(t => t && Array.isArray(t.members))
    .sort((x, y) => (y.perf || 0) - (x.perf || 0));
  const ranked = [];
  for (const t of teams) {
    const mine = t.members
      .filter(n => living.has(n))
      .sort((a, b) => _contribution(b, mission) - _contribution(a, mission)
        || (a < b ? -1 : 1));
    ranked.push(...mine);
  }
  return ranked.slice(0, size);
}

/**
 * Run the Armoury for this afternoon, or return null when it does not apply.
 *
 * Returns the record the screens draw and the conclave reasons about:
 *   { ep, entrants, slots:[{ name, found }], holders, pactAware, count }
 * `slots` is in the order they walked in, so a screen can open the boxes one
 * at a time; `holders` is the answer, and no belief is written about it.
 *
 * IT CAN LEGITIMATELY FIND NOBODY. The wiki notes that some afternoons nobody
 * meets the condition; a room too small to field `size` entrants simply does
 * not run one, and that is a real outcome rather than a failure.
 */
export function runArmoury(ep, mission, rng = Math.random) {
  if (!gs || !gs.tr) return null;
  const src = shieldSource();
  if (src === 'off') return null;
  // A PIN IS AN INSTRUCTION, NOT A PREFERENCE. The author put an Armoury on
  // this episode from the timeline, so it opens — whatever the season's default
  // source is and whatever the mission scored. Being told "your Armoury did not
  // run because the afternoon was mediocre" is not a feature, it is a night the
  // author planned and did not get.
  const pinned = !!(gs.tr.armourySchedule && gs.tr.armourySchedule[ep]);
  if (!pinned) {
    // Unpinned, it only opens at all in the automatic Armoury mode...
    if (src !== 'armoury') return null;
    // ...and only after an afternoon the castle actually won. The wiki's own
    // note is that some days nobody meets the mission's condition; that is also
    // the balance, because opening on every afternoon put a Shield in the
    // castle every single night (8.4 a season against the 1.2 the mission route
    // gives) and turned a scarce, frightening object into weather.
    const tier = mission && mission.tier;
    if (tier !== 'triumph' && tier !== 'solid') return null;
  }
  const size = armourySize();
  const entrants = _entrants(mission, size);
  // Not enough of a room to make a group worth hiding inside: two people and
  // one Shield is not a hesitation, it is a coin toss the pact will simply take.
  if (entrants.length < 3) return null;

  const count = Math.min(shieldCount(), entrants.length - 1);
  // Which boxes are loaded. Drawn off the MISSION stream, and shuffled by
  // index rather than by name so the answer cannot correlate with the cast
  // order a season happens to have been built in.
  const idx = entrants.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const loaded = new Set(idx.slice(0, count));
  const slots = entrants.map((name, i) => ({ name, found: loaded.has(i) }));
  const holders = slots.filter(s => s.found).map(s => s.name);

  const rec = {
    ep,
    via: 'armoury',
    entrants: [...entrants],
    slots,
    holders,
    count,
    // The pact only learns anything if one of THEM opened the right box.
    pactAware: holders.some(n => alignmentAt(n, ep) === 'traitor'),
  };
  (gs.tr.armouries ||= []).push(rec);

  // The Shield itself goes onto the same ledger every other Shield uses, so
  // `isShielded`, `expireShields`, the blocked-murder record and the VP all
  // keep working unchanged. `witnesses: []` is the whole difference: nobody
  // watched this one be won, so `shieldSeenBy` can never name the holder and
  // the pact has to reason about the GROUP instead.
  for (const holder of holders) {
    (gs.tr.shields ||= []).push({
      ep, holder, via: 'armoury', witnesses: [], roomSize: (gs.activePlayers || []).length - 1,
      visibility: 'secret', pactAware: rec.pactAware, entrants: [...entrants],
      outcome: 'pending',
      seenLine: 'Nobody saw what came out of that room.',
    });
    _grantShield(holder);
  }
  return rec;
}

/** Tonight's Armoury, if one ran this episode. */
export function armouryAt(ep) {
  return (gs.tr?.armouries || []).find(a => a.ep === ep) || null;
}

/**
 * THE HESITATION, priced.
 *
 * What a Traitor knows at the conclave when an Armoury ran today: the names
 * that went in, and nothing else. So every one of them might be carrying the
 * Shield, and spending the night on a shielded name wastes the murder
 * entirely. This returns the penalty applied to an entrant in
 * `formPreference` — the chance that THIS name is the one, which is
 * `shields / entrants`, scaled by how much a wasted night is worth.
 *
 * ZERO WHEN THE PACT ALREADY KNOWS. If a Traitor opened the right box, the
 * Shield is accounted for: the rest of that group is not protected by it any
 * more and the pact stops being careful. That is the wiki's own note that a
 * Traitor holding the Shield is a liability, seen from the other side.
 */
export function armouryHesitation(name, ep) {
  const a = armouryAt(ep);
  if (!a || a.pactAware) return 0;
  if (!a.entrants.includes(name)) return 0;
  return (a.count / a.entrants.length) * WASTED_NIGHT;
}

// A whole night thrown away is worth about this much against a target score
// that otherwise runs on beloved/heat/accused terms of ~1 each. At a four-hand
// Armoury with one Shield the penalty is 0.45 — real hesitation that a strong
// reason (they are onto me) still overrides, which is the trade the format
// wants. It is NOT a filter: the pact can still choose an entrant and lose the
// night, and the audience gets to watch them do it.
const WASTED_NIGHT = 1.8;

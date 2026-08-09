// What the three secret powers actually DO.
//
// They were granted, tracked, expiring at the jury — and firing nowhere. A
// houseguest could trade the best week of their game for one and nothing would
// happen, which is the same "written and unreachable" fault the Halting Hex sat
// in for months.
//
// Each is a decision and not a windfall, and each is decided proportionally
// rather than on a threshold:
//
//   The Interrogation      take somebody's Head of Household — and then be
//                          hunted for it by the person you took it from. The
//                          only power in the shelf that can be REFUSED.
//   The Mystery Competitor an alumnus walks in and plays your veto for you.
//                          Buys a body in the draw, not a win.
//   The Mystery Veto       a second veto competition with one player in it.
//                          Nobody is standing in the way, and it can still be
//                          lost.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond } from '../bonds.js';
import { BB_POWER_DEFINITIONS, activePowersAt, usePower } from './powers.js';
import { believesPowerHeld, learnBBPower } from './knowledge.js';

const beat = (text, players, badgeText, badgeClass) =>
  ({ text, players: [...(players || [])], badgeText, badgeClass });
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** The one live instance of a power whose rule flag matches, or null. */
function livePower(rule, week) {
  for (const inst of gs.bb?.powers || []) {
    if (inst.used || inst.disposed) continue;
    if (week > inst.expiresAfterWeek) continue;
    if (BB_POWER_DEFINITIONS[inst.powerId]?.rules?.[rule]) return inst;
  }
  return null;
}

/**
 * The fields the shared power-played screen reads.
 *
 * Three plays, one screen. `rpBuildBBPowerPlayed` already draws "a secret power
 * fired, and here is what the house did and did not know" — writing three more
 * screens for three variations on that would be three places for the same
 * stamp to drift apart. What each play does differently lives in its BEATS,
 * which is where the difference actually is.
 */
function shown(inst, timing, detail) {
  return {
    powerId: inst.powerId,
    name: BB_POWER_DEFINITIONS[inst.powerId]?.name || inst.powerId,
    timing,
    secret: inst.visibility === 'secret',
    visibility: inst.visibility,
    detail,
  };
}

/**
 * The Interrogation.
 *
 * Fires after the crown and before nominations. The holder takes the week; the
 * deposed Head of Household then questions the house and, if they name the
 * person who did it, keeps their week and the power is spent for nothing.
 *
 * The guess is read off what the deposed HOH actually KNOWS — the knowledge
 * store — plus intuition, plus how obviously the usurper benefits. Somebody who
 * already suspected the holder is far more likely to land it, which is what
 * makes the secrecy worth keeping in the weeks before this.
 */
export function playInterrogation({ week, house = [], hoh, rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('usurpHoh', weekNum);
  if (!inst || !hoh || inst.holder === hoh || !house.includes(inst.holder)) return null;

  // Worth taking? A crown is worth most to somebody who is not safe and cannot
  // win one. Late in the power's life the calculation changes: an expiring
  // power is worth spending on a worse week than a fresh one.
  const s = pStats(inst.holder) || {};
  const expiring = weekNum >= inst.expiresAfterWeek;
  const nerve = (s.boldness || 5) / 10;
  const pull = 0.18 + nerve * 0.4 + (expiring ? 0.34 : 0);
  if (rng() > clamp(pull, 0.05, 0.9)) return null;

  usePower(inst, weekNum);

  // ── the questioning ──
  //
  // Everybody is asked. What decides it is whether the deposed HOH had any
  // reason to look at this person — a suspicion already held is worth more than
  // any amount of instinct.
  const d = pStats(hoh) || {};
  // Did the deposed HOH already think this person was holding something? That
  // is the single biggest thing pointing at them, and it is why keeping the
  // secret in the weeks before this was worth doing.
  let suspected = false;
  try { suspected = believesPowerHeld(hoh, inst.holder, inst.powerId); } catch { suspected = false; }
  let odds = 0.14 + ((d.intuition || 5) / 10) * 0.36;
  // A house of four is a much shorter list than a house of twelve.
  odds += Math.max(0, (8 - house.length)) * 0.03;
  if (suspected) odds += 0.3;
  const caught = rng() < clamp(odds, 0.06, 0.86);

  const p = pronouns(inst.holder);
  const beats = [beat(
    `${hoh} is not Head of Household any more. Somebody has taken it, the wall will not say who, `
      + 'and the only thing this house has been told is that it happened.',
    [hoh], 'DETHRONED', 'red')];
  beats.push(beat(
    `${hoh} gets to ask. One question each, the whole house, and one name at the end of it — `
      + `and if it is the right name, ${hoh} walks back into that room.`,
    [...house].slice(0, 6), 'THE INTERROGATION', 'gold'));

  if (caught) {
    beats.push(beat(
      `${hoh} says ${inst.holder}. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not get to argue with it. `
        + `${hoh} keeps the week, ${inst.holder} has spent the biggest thing ${p.sub} had for nothing, `
        + 'and every person in that room now knows exactly what kind of player they are dealing with.',
      [hoh, inst.holder], 'CAUGHT', 'red'));
    // Everybody watched the accusation land. There is no keeping this.
    for (const n of house) {
      if (n === inst.holder) continue;
      try { learnBBPower(n, inst.holder, inst.powerId, { from: hoh, week: weekNum, confidence: 1, rng: () => 0 }); } catch { /* belief store */ }
      addBond(n, inst.holder, -1.4);
    }
    return { type: 'interrogation', holder: inst.holder, deposed: hoh, caught: true,
      hoh, ...shown(inst, 'nominations', `${hoh} named ${inst.holder} and keeps the week.`), beats };
  }

  beats.push(beat(
    `${hoh} names somebody else. It is the wrong somebody, and the room watches ${hoh} be wrong `
      + `out loud — which costs more than the crown did. ${inst.holder} is Head of Household and `
      + 'nobody in this house knows it happened.',
    [hoh, inst.holder], 'THE WRONG NAME', 'gold'));
  addBond(hoh, inst.holder, -0.6);
  return { type: 'interrogation', holder: inst.holder, deposed: hoh, caught: false,
    hoh: inst.holder,
    ...shown(inst, 'nominations', `${inst.holder} is Head of Household and nobody knows it.`),
    beats };
}

/**
 * The Mystery Competitor.
 *
 * Only usable on the block, per the show. A former houseguest takes one of the
 * drawn veto spots and plays on the holder's behalf; if the alumnus wins, the
 * veto belongs to the holder.
 *
 * `alumni` is passed in rather than read here, because who is eligible to walk
 * back through that door is a franchise question (js/social/hosts.js reads the
 * player database for everybody who has finished a season) and this module
 * should not learn it.
 */
export function playMysteryCompetitor({ week, nominees = [], players = [], alumni = [],
  rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('vetoProxy', weekNum);
  if (!inst) return null;
  // On the block, or it does nothing — the one restriction the show put on it.
  if (!nominees.includes(inst.holder)) return null;
  if (!players.length || !alumni.length) return null;

  usePower(inst, weekNum);
  const guest = alumni[Math.floor(rng() * alumni.length)];
  // Somebody drawn has to give up their spot, and it is not the holder — the
  // point is a SECOND body in the draw.
  const displaced = players.filter(n => n !== inst.holder)[
    Math.floor(rng() * Math.max(1, players.filter(n => n !== inst.holder).length))] || null;

  // The alumnus is good, not certain. A competition is still a competition.
  const won = rng() < 0.44;

  const beats = [beat(
    'The veto draw stops. There is a name in the bag that does not belong to anybody in this '
      + `house, and the door opens for somebody who has played this game before: ${guest}.`,
    [inst.holder], 'A NAME NOBODY EXPECTED', 'gold')];
  if (displaced) {
    beats.push(beat(
      `${displaced} is out of the draw and did nothing to deserve it, which is the part nobody `
        + 'will be able to explain to them.',
      [displaced], 'BUMPED', 'red'));
  }
  beats.push(won
    ? beat(`${guest} wins it, and hands it straight to ${inst.holder}, who has been on the block `
      + 'all week and is now not going anywhere. Somebody paid for that, weeks ago, in private.',
    [inst.holder], 'PLAYED FOR, AND WON', 'gold')
    : beat(`${guest} loses. ${inst.holder} bought a body in the draw and not a veto, and the whole `
      + 'house just watched a stranger arrive for nothing.',
    [inst.holder], 'FOR NOTHING', 'red'));

  return { type: 'mystery-competitor', holder: inst.holder, guest, displaced,
    won, vetoTo: won ? inst.holder : null,
    ...shown(inst, 'veto-ceremony', won
      ? `${guest} won the veto on ${inst.holder}'s behalf.`
      : `${guest} played for ${inst.holder} and lost.`),
    beats };
}

/**
 * The Mystery Veto.
 *
 * A second veto competition at the end of the veto ceremony with exactly one
 * player in it. Usable whether or not the holder is a nominee, per the show —
 * which is what makes it more than a self-save: it can take somebody else off
 * a block that was already settled.
 */
export function playMysteryVeto({ week, nominees = [], house = [], rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('soloVetoComp', weekNum);
  if (!inst || !house.includes(inst.holder)) return null;

  // Spent when it is worth spending: on the block, or holding it on the last
  // week it exists, or with somebody worth saving sitting there.
  const onBlock = nominees.includes(inst.holder);
  const expiring = weekNum >= inst.expiresAfterWeek;
  const pull = onBlock ? 0.92 : expiring ? 0.55 : 0.18;
  if (rng() > pull) return null;

  usePower(inst, weekNum);
  const s = pStats(inst.holder) || {};
  // Alone against the clock. Better players win more, and nobody wins always.
  const skill = ((s.physical || 5) + (s.mental || 5) + (s.endurance || 5)) / 30;
  const won = rng() < clamp(0.34 + skill * 0.5, 0.2, 0.85);

  const beats = [beat(
    'The veto ceremony is over and this week was supposed to be settled. It is not: there is a '
      + 'second competition out there tonight and exactly one person is allowed to play in it.',
    [inst.holder], 'A SECOND VETO', 'gold')];
  beats.push(won
    ? beat(`${inst.holder} beats it alone, and walks back in holding a real veto on a block `
      + 'everybody had already stopped thinking about.',
    [inst.holder], 'WON ALONE', 'gold')
    : beat(`${inst.holder} does not beat it. Nobody was standing in the way and it was still lost, `
      + 'and the house now knows the power existed and did nothing.',
    [inst.holder], 'LOST ALONE', 'red'));

  return { type: 'mystery-veto', holder: inst.holder, won,
    saves: won ? (onBlock ? inst.holder : nominees[0] || null) : null,
    ...shown(inst, 'veto-ceremony', won
      ? 'A second veto, won alone, after the ceremony had already settled the week.'
      : 'A competition with one player in it, and it was still lost.'),
    beats };
}

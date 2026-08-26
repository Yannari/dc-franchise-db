// ══════════════════════════════════════════════════════════════════════
// bb/chain-of-safety.js — everybody watches you decide who you like
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother Canada's twist, and the reason it is divisive is the reason it
// is worth simulating: there is no block to hide behind and no veto to undo
// it. One person is made safe, THEY choose the next, and it runs down the
// house until three are left standing there having been chosen by nobody.
//
// Two documented variants, and the difference is only who starts it:
//   'safety-comp'  BBCan10 — a safety competition crowns the first link.
//   'hoh'          BBCan11 — the reigning Head of Household starts it.
// Everything after the first link is identical, so the variant is a flag
// rather than a second implementation.
//
// The last three play a second safety competition. Its winner is safe; the
// other two are the nominees, immediately, with no ceremony and no veto.
//
// ── WHAT MAKES IT DIFFERENT FROM A NOMINATION ──
//
// A Head of Household picks two people to sit down. A chain makes every
// houseguest in the room pick one person to save, out loud, in front of
// everybody they did not pick. That is a different social object entirely:
// nominations produce one villain, and a chain produces a public ranking of
// the whole house that nobody can pretend they did not participate in.
//
// So the fallout here is not modelled on the nomination fallout. Being picked
// is gratitude. Being picked LATE is an insult that everybody watched arrive.
// And being passed over by somebody you are in an alliance with is the event
// this twist exists to produce — that one is recorded as a betrayal, because
// in the house it is one.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** A safety run is a scramble, not a test of one stat. */
const SAFETY_MIX = { physical: 0.30, mental: 0.26, endurance: 0.24, temperament: 0.20 };

/** How many are left standing when the chain stops. Both variants stop at three. */
export const CHAIN_FLOOR = 3;

const HOH_START = [
  (n, p) => `${n} is handed the first link and told to make somebody safe. The room goes very quiet, because everybody in it has just worked out that ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} about to say a name and then never be able to unsay it.`,
  (n) => `${n} does not get to nominate this week. ${n} gets to SAVE, once, and then hand the decision to whoever that was.`,
  (n, p) => `The Head of Household starts the chain. ${n} takes ${p.posAdj} time about it, which everybody notices, and which does not help.`,
];

const COMP_START = [
  (n) => `${n} wins the safety competition and with it the first link of the chain. Safe, and now holding the only thing worth more than safety — the next name.`,
  (n, p) => `${n} takes it, and the prize is not really the safety. It is that ${p.sub} chooses who stands next to ${p.obj}.`,
];

/** How a pick lands on the person receiving it. */
const PICKED = [
  (a, b) => `${a} says ${b}'s name without hesitating. ${b} is out of the chain and visibly relieved about it.`,
  (a, b, p) => `${a} picks ${b}. ${b} does not look at the people still sitting down, which is its own kind of answer.`,
  (a, b) => `"${b}." ${a} does not explain it. Nobody asks ${a} to.`,
  (a, b, p) => `${a} takes a long look around the room and lands on ${b}, who exhales like ${pronouns(b).sub} had been holding it since the competition ended.`,
];

/** The people who were sitting right there and did not hear their name. */
const PASSED_OVER = [
  (a, b) => `${b} was watching ${a}'s mouth and it made a different shape. ${b} says nothing and files it.`,
  (a, b) => `${a} had one name to give and it was not ${b}'s. ${b} is going to remember exactly how long that took.`,
  (a, b) => `${b} had counted on ${a}. ${b} is now counting something else.`,
];

/** The last three, chosen by nobody. */
const LEFTOVER = [
  ns => `${ns.join(', ')} are the last three. Not one person in this house said any of their names.`,
  ns => `The chain runs out. ${ns.join(', ')} are standing there having been passed over by every single houseguest who had a choice.`,
];

/**
 * Who this houseguest saves.
 *
 * Not the same question as "who do I like most". A chain pick is spent, it is
 * public, and the person you save is out of the chain and therefore no longer
 * able to save YOU — so the read is loyalty first, then who is actually useful
 * to have walking around unnominated, with a real thumb on the scale for a
 * showmance because that is what the house always does and always gets mocked
 * for.
 */
function pickTarget(picker, pool, rng) {
  if (!pool.length) return null;
  const st = pStats(picker) || {};
  const loyal = (st.loyalty || 5) / 10;
  const strategic = (st.strategic || 5) / 10;
  const scored = pool.map(name => {
    let s = 0;
    try { s += getPerceivedBond(picker, name) * (0.7 + loyal * 0.6); } catch { /* no bond, no weight */ }
    // A showmance is picked first roughly always, and the house says so.
    try {
      const sh = (gs.showmances || []).find(x => !x.broken
        && ((x.a === picker && x.b === name) || (x.b === picker && x.a === name)));
      if (sh) s += 4.5;
    } catch { /* no romance this season */ }
    // Somebody in your alliance is somebody whose vote you still need.
    try {
      const shared = (gs.namedAlliances || []).filter(al => !al.dissolved
        && (al.members || []).includes(picker) && (al.members || []).includes(name));
      s += shared.length * 2.2;
    } catch { /* no alliances yet */ }
    // A strategist keeps a competition threat in the chain rather than out of
    // it — saving the strongest player in the house is a gift you cannot get
    // back, and the better a player is at this game the less likely they are
    // to hand one over.
    const th = pStats(name) || {};
    const threat = ((th.physical || 5) + (th.mental || 5) + (th.strategic || 5)) / 30;
    s -= threat * strategic * 3.4;
    return { name, s: s + (rng() - 0.5) * 3.2 };
  }).sort((a, b) => b.s - a.s);
  return scored[0].name;
}

/**
 * Run the chain.
 *
 * Returns an act carrying the full pick order, the final three, the second
 * competition and the two nominees it produced — or null when the house is too
 * small for a chain to mean anything (at five, "the last three" is most of the
 * room and the twist stops being a selection).
 */
export function runChainOfSafety({ week, house, hoh, rng = Math.random, variant = 'safety-comp' } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 6) return null;
  const say = makePicker(rng);
  const beats = [];
  const useHoh = variant === 'hoh' && hoh && room.includes(hoh);

  // ── the first link ──
  let starter = null;
  let openingComp = null;
  if (useHoh) {
    starter = hoh;
    const p = pronouns(starter);
    beats.push(beat(say(HOH_START)(starter, p), [starter], 'STARTS THE CHAIN', 'gold'));
  } else {
    // Everybody plays for it, including the Head of Household — the point of
    // this variant is that the chain does not belong to the person in power.
    const runs = room.map(name => ({
      name, score: aptitude(name, SAFETY_MIX) + (rng() - 0.5) * 4.6,
    })).sort((a, b) => b.score - a.score);
    starter = runs[0].name;
    openingComp = { participants: room.map(n => n), placements: runs.map(r => r.name),
      scores: Object.fromEntries(runs.map(r => [r.name, Math.round(r.score * 10) / 10])) };
    beats.push(beat(say(COMP_START)(starter, pronouns(starter)), [starter], 'FIRST LINK', 'gold'));
  }

  // ── the chain ──
  const order = [starter];
  const unsafe = room.filter(n => n !== starter);
  const links = [];
  let picker = starter;
  while (unsafe.length > CHAIN_FLOOR) {
    const chosen = pickTarget(picker, unsafe, rng);
    if (!chosen) break;
    unsafe.splice(unsafe.indexOf(chosen), 1);
    order.push(chosen);
    links.push({ picker, chosen, position: order.length });

    beats.push(beat(say(PICKED)(picker, chosen, pronouns(picker)), [picker, chosen],
      'SAFE', 'green'));

    // ── consequences, which are the whole twist ──
    //
    // Gratitude, and it is real: being handed safety in public by somebody who
    // had the whole house to choose from is the strongest thing one houseguest
    // can do for another without lying to anybody.
    try { addBond(picker, chosen, 2); } catch { /* bond store not up */ }
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[picker] = (gs.popularity[picker] || 0) + 1;

    // And the person who thought their name was coming. Only ONE of them gets
    // a line, and only when the passing-over actually stings — a stranger not
    // picking you is not an event, but an ally not picking you is.
    const slighted = unsafe
      .map(n => { let b = 0; try { b = getPerceivedBond(picker, n); } catch { /* none */ } return { n, b }; })
      .filter(x => x.b >= 4)
      .sort((a, b) => b.b - a.b)[0];
    if (slighted) {
      beats.push(beat(say(PASSED_OVER)(picker, slighted.n), [picker, slighted.n],
        'PASSED OVER', 'red'));
      try { addBond(picker, slighted.n, -2); } catch { /* bond store not up */ }
    }
    picker = chosen;
  }

  // ── the last three ──
  const leftover = [...unsafe];
  beats.push(beat(say(LEFTOVER)(leftover), [...leftover], 'CHOSEN BY NOBODY', 'red'));
  for (const n of leftover) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[n] = (gs.popularity[n] || 0) - 1;
  }

  // The second competition. The winner walks; the other two are already
  // nominated by the time they stand up.
  const finalRuns = leftover.map(name => ({
    name, score: aptitude(name, SAFETY_MIX) + (rng() - 0.5) * 4.6,
  })).sort((a, b) => b.score - a.score);
  const survivor = finalRuns[0]?.name || null;
  const nominees = finalRuns.slice(1).map(r => r.name);

  if (survivor) {
    beats.push(beat(
      `${survivor} wins the second safety competition and steps off the block before ever standing on it.`,
      [survivor], 'SAFE', 'green'));
  }
  if (nominees.length) {
    beats.push(beat(
      `${nominees.join(' and ')} are the nominees. There was no ceremony, there are no keys, and there is no veto `
        + `coming — the house arrived at this by choosing everybody else first.`,
      [...nominees], 'NOMINATED', 'red'));
  }

  return {
    type: 'chain-of-safety',
    week: week?.num || 0,
    variant: useHoh ? 'hoh' : 'safety-comp',
    starter,
    openingComp,
    // The public record: the order the house was saved in, first to last.
    order: [...order],
    links,
    leftover,
    finalComp: { participants: [...leftover], placements: finalRuns.map(r => r.name),
      scores: Object.fromEntries(finalRuns.map(r => [r.name, Math.round(r.score * 10) / 10])) },
    safetyWinner: survivor,
    nominees: [...nominees],
    beats,
  };
}

/** Everybody the chain made safe — read by the week's protection list. */
export const chainSafe = act => (act?.order || []).filter(Boolean)
  .concat(act?.safetyWinner ? [act.safetyWinner] : []);

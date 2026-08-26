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
import { setBBTarget } from './shared-strategy.js';
import { rememberStrategy } from '../strategy-memory.js';

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

// ── THE LINES ──
//
// A chain in a fourteen-person house makes ELEVEN picks, all on one screen,
// one after another. Four variants is what the house style asks for and it is
// nowhere near enough here: eleven draws out of four means every line appears
// three times in the same list, which is what the first version did.
//
// So the pools are large, and more importantly they are SORTED BY SITUATION.
// Being picked second is not the same event as being picked eleventh, and
// saving your showmance is not the same event as saving somebody you have
// barely spoken to. The narration picks the family first and the line second,
// so the prose varies because the situation does.

/** Early in the chain: the picks nobody has to justify. */
const PICK_EARLY = [
  (a, b) => `${a} says ${b}'s name without hesitating. ${b} is out of the chain before the room has settled.`,
  (a, b) => `"${b}." ${a} does not explain it. Nobody in this house needs it explained.`,
  (a, b) => `${a} does not even look around the room first, which tells everybody in it something.`,
  (a, b) => `${a} gives it to ${b} immediately. Two names in and the shape of this house is already on the table.`,
];

/** The middle: the picks that start costing something. */
const PICK_MID = [
  (a, b) => `${a} takes a moment over it, and gives it to ${b}.`,
  (a, b) => `${a} looks along the row twice before saying ${b}, which everybody notices and nobody mentions.`,
  (a, b) => `"${b}," says ${a}, and says it to the floor rather than to ${b}.`,
  (a, b) => `${a} picks ${b}. Somewhere behind ${pronouns(a).obj} somebody breathes out through their nose.`,
  (a, b) => `${a} weighs it properly — there are people left in this room ${pronouns(a).sub} likes — and lands on ${b}.`,
];

/** Late: the room is small, and everybody can count. */
const PICK_LATE = [
  (a, b) => `${a} is looking at a very short row of people now, and ${a} chooses ${b}.`,
  (a, b) => `There are four names left and ${a} has one to give. ${pronouns(a).Sub} gives it to ${b} and does not look up afterwards.`,
  (a, b) => `${a} says ${b}'s name quietly, which does not make it any quieter in the room.`,
  (a, b) => `${b} is safe. ${a} has just told the two or three people still sitting down exactly where they came on the list.`,
  (a, b) => `${a} hesitates long enough that everybody left has time to hope, and then says ${b}.`,
];

/** Saving the person you are in a showmance with. Nobody is surprised. */
const PICK_SHOWMANCE = [
  (a, b) => `${a} picks ${b}, and the room makes the noise a room makes when nobody is remotely surprised.`,
  (a, b) => `${a} says ${b} before the sentence asking is finished. It is the least secret decision of the night.`,
  (a, b) => `Of course it is ${b}. ${a} does not pretend otherwise, and somebody at the end of the row says "shocking" without any inflection at all.`,
];

/** Saving somebody you are openly aligned with. */
const PICK_ALLY = [
  (a, b) => `${a} picks ${b}, which is what ${a} was always going to do and confirms it in front of everybody.`,
  (a, b) => `${a} and ${b} have been a pair for weeks. ${a} has just said so out loud, on camera, to a room taking notes.`,
  (a, b) => `${b}. It costs ${a} nothing and tells the house everything.`,
];

/** Saving somebody you have no relationship with at all. */
const PICK_COLD = [
  (a, b) => `${a} picks ${b}, and the two of them have barely had a conversation this season. Half the room is trying to work out what that means.`,
  (a, b) => `${a} goes with ${b} — not a friend, not an enemy, and therefore not a debt anybody can call in.`,
  (a, b) => `${a} names ${b}, which surprises ${b} more than anybody, and ${b} does a poor job of hiding it.`,
];

/** Saving somebody you do not even like. That is a move. */
const PICK_RIVAL = [
  (a, b) => `${a} picks ${b}. They cannot stand each other, and ${a} has just bought something with that.`,
  (a, b) => `${b}, of all people. ${a} has spent six weeks on the other side of ${b} and has just handed ${pronouns(b).obj} a week.`,
  (a, b) => `${a} says ${b}'s name and the room actually turns round. That is not a friendship, it is an invoice.`,
];

/** The people who were sitting right there and did not hear their name. */
const PASSED_OVER = [
  (a, b) => `${b} was watching ${a}'s mouth and it made a different shape. ${b} says nothing and files it.`,
  (a, b) => `${a} had one name to give and it was not ${b}'s. ${b} is going to remember exactly how long that took.`,
  (a, b) => `${b} had counted on ${a}. ${b} is now counting something else.`,
  (a, b) => `${b} does not react at all, which from ${b} is the reaction.`,
  (a, b) => `${b} had already half-stood up. ${b} sits back down and spends a while looking at nothing in particular.`,
  (a, b) => `Whatever ${a} and ${b} had before tonight, it was worth less than one name, and both of them now know the number.`,
  (a, b) => `${b} smiles at ${a}. It is a bad smile and it arrives about a second too late.`,
  (a, b) => `${a} could have ended ${b}'s week right there and chose not to. ${b} will be doing arithmetic about that until Thursday.`,
];

/** The last three, chosen by nobody. */
const LEFTOVER = [
  ns => `${ns.join(', ')} are the last three. Not one person in this house said any of their names.`,
  ns => `The chain runs out. ${ns.join(', ')} are standing there having been passed over by every single houseguest who had a choice.`,
  ns => `Nobody is left to pick. ${ns.join(', ')} are still sitting down, and every single person who had a name to give gave it to somebody else.`,
  ns => `It stops. ${ns.join(', ')} — three people the whole house went past, one at a time, in front of each other.`,
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
  // Every slight the night produced, whether or not it got a line. The prose
  // is selective and the CONSEQUENCES are not: narrating eleven snubs a pick
  // would be unreadable, and applying only the narrated ones would mean most
  // of the room walked out of the most public night of the season owing
  // nothing to anybody.
  const slights = [];
  let narrated = 0;
  let picker = starter;
  const totalPicks = unsafe.length - CHAIN_FLOOR;

  const relation = (a, b) => {
    try {
      if ((gs.showmances || []).some(x => !x.broken
        && ((x.a === a && x.b === b) || (x.b === a && x.a === b)))) return 'showmance';
    } catch { /* no romance this season */ }
    try {
      if ((gs.namedAlliances || []).some(al => !al.dissolved
        && (al.members || []).includes(a) && (al.members || []).includes(b))) return 'ally';
    } catch { /* no alliances yet */ }
    let bond = 0;
    try { bond = getPerceivedBond(a, b); } catch { /* none */ }
    if (bond <= -3) return 'rival';
    if (bond >= 4) return 'ally';
    if (Math.abs(bond) <= 1) return 'cold';
    return null;
  };

  while (unsafe.length > CHAIN_FLOOR) {
    const chosen = pickTarget(picker, unsafe, rng);
    if (!chosen) break;
    unsafe.splice(unsafe.indexOf(chosen), 1);
    order.push(chosen);
    const position = order.length;
    links.push({ picker, chosen, position });

    // WHICH KIND OF PICK THIS WAS, then which line. The situation chooses the
    // family; the family only has to supply variety within itself.
    const rel = relation(picker, chosen);
    const done = links.length / Math.max(1, totalPicks);
    const pool = rel === 'showmance' ? PICK_SHOWMANCE
      : rel === 'rival' ? PICK_RIVAL
        : rel === 'ally' ? PICK_ALLY
          : rel === 'cold' ? PICK_COLD
            : done > 0.72 ? PICK_LATE
              : done < 0.3 ? PICK_EARLY : PICK_MID;
    beats.push(beat(say(pool)(picker, chosen, pronouns(picker)), [picker, chosen],
      'SAFE', 'green'));

    // ── consequences, which are the whole twist ──
    //
    // Gratitude, SCALED BY WHEN IT CAME. Being handed safety second is a
    // different gift from being handed it eleventh, when the person doing it
    // had already gone past everybody else in the room — and the flat +2 that
    // used to be here made those two the same event.
    const early = 1 - (links.length - 1) / Math.max(1, totalPicks);
    try { addBond(picker, chosen, 1 + Math.round(early * 2)); } catch { /* bond store not up */ }
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[picker] = (gs.popularity[picker] || 0) + 1;
    // And the house's read on the person chosen: picked early is the room
    // saying you matter, picked last is the room saying it ran out of people.
    gs.popularity[chosen] = (gs.popularity[chosen] || 0) + (early > 0.6 ? 1 : early < 0.25 ? -1 : 0);

    // EVERYBODY still sitting down who had a reason to expect that name.
    // Priced by how much of a relationship there was to spend, and by how late
    // it is — being gone past when nine people are left is a slight, being
    // gone past when three are is an answer.
    const late = 1 - early;
    const overlooked = unsafe.map(n => {
      let b = 0; try { b = getPerceivedBond(picker, n); } catch { /* none */ }
      return { n, b };
    }).filter(x => x.b >= 3).sort((a, b) => b.b - a.b);
    for (const { n, b } of overlooked) {
      const hit = -(0.5 + (b / 10) * 1.5 + late * 1.2);
      try { addBond(picker, n, Math.round(hit * 10) / 10); } catch { /* texture */ }
      slights.push({ picker, passed: n, bond: b, position, late });
      // A close ally going past you in public is not texture, it is a reason
      // to vote. Recorded so the rest of the week can act on it.
      if (b >= 5) {
        try {
          setBBTarget(n, picker, 'had one name to give in front of the whole house and did not say mine',
            { week });
        } catch { /* the bond hit still stands */ }
        try {
          rememberStrategy(n, picker, 'passed-me-over-in-the-chain', week?.num || 0,
            b >= 7 ? 2 : 1, { format: 'big-brother' });
        } catch { /* jury texture */ }
      }
    }
    // Narrated selectively but not rarely: the worst one each pick, capped so
    // eleven snubs do not bury eleven saves, and biased late because being
    // gone past with four people left is the version that changes a vote.
    const worst = overlooked[0];
    if (worst && narrated < 4 && (worst.b >= 3 || late > 0.5)) {
      narrated++;
      beats.push(beat(say(PASSED_OVER)(picker, worst.n), [picker, worst.n],
        'PASSED OVER', 'red'));
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
    // Everything the night owes somebody. Read by chainFallout below.
    slights,
    beats,
  };
}

/** Everybody the chain made safe — read by the week's protection list. */
export const chainSafe = act => (act?.order || []).filter(Boolean)
  .concat(act?.safetyWinner ? [act.safetyWinner] : []);

/** The conversation the person who was counted on has to have. */
const CONFRONT = [
  (b, a) => `${b} finds ${a} in the kitchen afterwards and asks it flatly: "You had one name." ${a} starts a sentence about numbers and does not finish it.`,
  (b, a) => `${b} has not said anything to ${a} since the chain, and the not-saying is doing considerably more work than saying it would.`,
  (b, a) => `"I would have picked you." ${b} says it once, to ${a}, in front of two other people, and then goes to bed.`,
  (b, a) => `${a} tries to explain it to ${b} twice. The second attempt is worse than the first and both of them know it.`,
  (b, a) => `${b} tells somebody else, loudly enough to carry, that ${pronouns(b).sub} now knows exactly where ${pronouns(b).sub} ${pronouns(b).sub === 'they' ? 'come' : 'comes'} on ${a}'s list.`,
];

/**
 * A nominee with nobody to be angry at.
 *
 * The specific misery of this twist: on an ordinary week you can hate the Head
 * of Household. Here the whole house did it to you one at a time, in public,
 * and there is nobody to campaign to about it.
 */
const NOMINEE_REACT = [
  (n) => `${n} does the maths out loud to nobody: every single person in this house had one name to give, and not one of them said ${n}. There is no Head of Household to be angry at. There is just the room.`,
  (n) => `${n} keeps coming back to the same thing — that there is nobody to campaign to about this, because everybody already voted with their mouth in front of everybody else.`,
  (n) => `Somebody tells ${n} it was not personal. ${n} points out, reasonably, that it was about as personal as this house gets.`,
  (n, p) => `${n} is on the block and cannot name the person who put ${p.obj} there, because it was all of them, one at a time, out loud.`,
  (n) => `${n} spends the evening being extremely pleasant to people, which is what ${n} does instead of saying any of it.`,
  (n, p) => `"Every one of you." ${n} does not raise ${p.posAdj} voice and does not need to; the room has already worked out that ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} right.`,
];

/**
 * What the house says about it afterwards.
 *
 * The chain was shipped with no aftermath at all: eleven people made a public
 * choice about each other and then the week simply carried on, which is the
 * one thing a house would never do. This is a house-life stretch built out of
 * what actually happened — so it names the real people, in the real order, and
 * says the thing the room would say.
 *
 * Deliberately typed as an ordinary `house` act. Every screen and both
 * transcripts already draw one, so the reactions land in house life the way
 * any other conversation does rather than needing a screen of their own.
 */
export function chainFallout(act, { rng = Math.random } = {}) {
  if (!act || !(act.links || []).length) return null;
  const say = makePicker(rng);
  const socialBeats = [];
  const add = (text, players, badgeText, badgeClass = 'grey') =>
    socialBeats.push({ text, players: [...players].filter(Boolean), badgeText, badgeClass,
      category: 'social', location: 'living-room' });

  // THE PEOPLE WHO WERE COUNTING ON SOMEBODY. The loudest one first, because
  // it is the thing the twist exists to produce.
  const worst = [...(act.slights || [])].sort((a, b) => b.bond - a.bond)[0];
  if (worst) {
    const p = pronouns(worst.passed);
    add(say(CONFRONT)(worst.passed, worst.picker), [worst.passed, worst.picker], 'ONE NAME', 'red');
  }
  // The second-worst, if there was one and it was a different pair.
  const second = [...(act.slights || [])].sort((a, b) => b.bond - a.bond)
    .find(x => worst && x.passed !== worst.passed && x.bond >= 4);
  if (second) {
    add(`${second.passed} and ${second.picker} are perfectly civil to each other all evening, which anybody watching can tell is the problem.`,
      [second.passed, second.picker], 'CIVIL', 'grey');
  }

  // THE NOMINEES, who were not nominated by anybody and have nobody to blame
  // in particular — which is its own specific misery and worth its own beat.
  for (const n of (act.nominees || []).slice(0, 2)) {
    add(say(NOMINEE_REACT)(n, pronouns(n)), [n], 'NOBODY PUT ME HERE', 'red');
  }

  // THE ONE WHO GOT OUT OF IT. Winning the second competition is a week of
  // safety and a permanent piece of information about where you stand.
  if (act.safetyWinner) {
    add(`${act.safetyWinner} is safe and knows exactly what it cost to find out — that the whole house went past ${pronouns(act.safetyWinner).obj} first, and only a competition fixed it.`,
      [act.safetyWinner], 'SAFE, AND COUNTING', 'blue');
  }

  // THE FIRST LINK, who is now holding a favour and a grudge in the same hand.
  const first = act.links[0];
  if (first) {
    add(`${first.chosen} was the first name said tonight and the house has not stopped mentioning it. ${first.chosen} is finding out that being chosen first is not only a good thing to have been.`,
      [first.chosen, first.picker], 'FIRST NAME CALLED', 'gold');
  }
  // And the last one made safe: picked, but only just.
  const last = act.links[act.links.length - 1];
  if (last && act.links.length > 2) {
    add(`${last.chosen} is safe by one place, and is being very careful not to look pleased about it in front of the three who are not.`,
      [last.chosen], 'SAFE BY ONE', 'grey');
  }

  if (!socialBeats.length) return null;
  return { type: 'house', phase: 'post-noms', chainFallout: true, socialBeats };
}

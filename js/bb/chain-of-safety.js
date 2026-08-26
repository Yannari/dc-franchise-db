// ══════════════════════════════════════════════════════════════════════
// bb/chain-of-safety.js — everybody watches you decide who you like
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother Canada's twist, and the reason it is divisive is the reason it
// is worth simulating: there is no block to hide behind and no veto to undo
// it. One person is made safe, THEY choose the next, and it runs down the
// house until three are left standing there having been chosen by nobody.
//
// WHO STARTS IT has two documented answers:
//   'safety-comp'  BBCan10 — a safety competition crowns the first link.
//   'hoh'          BBCan11 — the reigning Head of Household starts it.
// Everything after the first link is identical, so that one is a flag rather
// than a second implementation.
//
// HOW IT ENDS has two, and they are genuinely different weeks:
//
//   'canada'  The chain runs until THREE are left. Those three play a second
//             safety competition; its winner is safe and the other two are the
//             nominees, and the house votes one of them out.
//
//   'quebec'  Celebrity Big Brother Québec. The chain runs until ONE person is
//             left unchosen, and that person is nominated. Then the whole
//             thing runs AGAIN, and whoever is left unchosen the second time is
//             the other nominee. The two of them settle it in a head-to-head
//             duel and the loser is evicted — there is no vote at all. The
//             house does not decide who goes; it decides who is safe, twice,
//             and the two people it forgot fight over what is left.
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
  (n, p) => `${n} is handed the first link and told to make somebody safe. The room goes very quiet, because everybody in it has just worked out that ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} about to say a name out loud that ${p.sub} can never take back.`,
  (n) => `${n} does not get to nominate this week. ${n} gets to SAVE, once, and then hand the decision to whoever that was.`,
  (n, p) => `The Head of Household starts the chain. ${n} takes a long time over it, and every second of that is watched by people waiting to hear their own name.`,
];

const COMP_START = [
  (n) => `${n} wins the safety competition and takes the first link of the chain. Safe — and now the only person in the room who gets to say a name.`,
  (n, p) => `${n} takes it. The safety is not really the prize — the prize is that ${p.sub} decides who else gets to be safe.`,
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
  (a, b) => `${a} says ${b}'s name straight away, without looking round the room first.`,
  (a, b) => `"${b}." That is the whole sentence. ${a} does not add anything to it.`,
  (a, b) => `${a} barely waits to be asked. It is ${b}, and everybody could have guessed it.`,
  (a, b) => `${a} picks ${b} in about two seconds, and everybody can see how easy that was.`,
  (a, b) => `${a} goes with ${b} and does not explain why. Nobody expects ${pronouns(a).obj} to, this early.`,
  (a, b) => `First name of the night from ${a}, and it is ${b}. No hesitation at all.`,
];

/** The middle: the picks that start costing something. */
const PICK_MID = [
  (a, b) => `${a} thinks about it properly this time, then says ${b}.`,
  (a, b) => `${a} looks down the row twice before choosing ${b}. Everybody notices the second look.`,
  (a, b) => `"${b}," ${a} says, and says it to the floor instead of to ${b}.`,
  (a, b) => `${a} picks ${b}. Somebody further along the row lets out a breath.`,
  (a, b) => `There are people left in this room ${a} likes. ${pronouns(a).Sub} picks ${b} anyway.`,
  (a, b) => `${a} takes long enough that the room goes quiet, and then chooses ${b}.`,
  (a, b) => `${a} says ${b}'s name and immediately looks at the floor.`,
];

/** Late: the room is small, and everybody can count. */
const PICK_LATE = [
  (a, b) => `There are only a few people left to choose from now. ${a} chooses ${b}.`,
  (a, b, p, left) => `${a} has one name to give and ${left} people to give it to. ${pronouns(a).Sub} says ${b}, and does not look up.`,
  (a, b) => `${a} says ${b}'s name very quietly, and it goes round the room anyway.`,
  (a, b) => `${b} is safe. Everybody still sitting down has just learned where they came on ${a}'s list.`,
  (a, b) => `${a} waits long enough that the people left start to hope, then says ${b}.`,
  (a, b) => `${a} apologises before saying it, which does not help anybody, and then says ${b}.`,
];

/** Saving the person you are in a showmance with. Nobody is surprised. */
const PICK_SHOWMANCE = [
  (a, b) => `${a} picks ${b}. Half the room groans, because every one of them saw it coming.`,
  (a, b) => `${a} says ${b} before the question is finished. It is the least secret decision of the night.`,
  (a, b) => `It is ${b}, obviously. Somebody at the end of the row says "shocking" completely flatly.`,
  (a, b) => `${a} does not even pretend to weigh it up. ${b}, straight away, to nobody's surprise at all.`,
  (a, b) => `${a} and ${b} have not been fooling anybody for weeks, and ${a} has just stopped trying.`,
];

/** Saving somebody you are openly aligned with. */
const PICK_ALLY = [
  (a, b) => `${a} picks ${b}, which is what everybody expected and what ${a} was always going to do.`,
  (a, b) => `${a} and ${b} have been working together for weeks. ${a} has just confirmed it in front of the whole house.`,
  (a, b) => `${b}. It costs ${a} nothing to say, and everybody in the room knows it.`,
  (a, b) => `${a} chooses ${b} without hesitating, and half the room had already guessed it.`,
  (a, b) => `${a} says ${b}, and everybody in the room now knows for certain which of them are working together.`,
  (a, b) => `No surprise: ${a} looks after ${b}, the way ${pronouns(a).sub} ${pronouns(a).sub === 'they' ? 'have' : 'has'} all season.`,
  (a, b) => `${a} picks ${b}. They have voted together every week and now the whole house has seen why.`,
  (a, b) => `${b}, of course. ${a} did not have to think about that one and did not pretend to.`,
];

/** Saving somebody you have no relationship with at all. */
const PICK_COLD = [
  (a, b) => `${a} picks ${b}, and the two of them have barely spoken this season. Half the room is trying to work out what it means.`,
  (a, b) => `${a} goes with ${b}: not a friend and not an enemy, so nobody can say ${pronouns(a).sub} owed ${pronouns(b).obj} anything.`,
  (a, b) => `${a} says ${b}, and ${b} looks more surprised than anybody else in the room.`,
  (a, b) => `${b} was not expecting it. Neither was anybody else. ${a} does not explain.`,
  (a, b) => `${a} chooses somebody ${pronouns(a).sub} ${pronouns(a).sub === 'they' ? 'have' : 'has'} no history with at all, and ${b} takes the seat without asking why.`,
];

/** Saving somebody you do not even like. That is a move. */
const PICK_RIVAL = [
  (a, b) => `${a} picks ${b}. They cannot stand each other, and everybody in the room is now wondering what ${pronouns(a).sub} wants for it.`,
  (a, b) => `${b}, of all people. ${a} has been on the other side of ${pronouns(b).obj} for weeks and has just handed ${pronouns(b).obj} a week of safety.`,
  (a, b) => `${a} says ${b}'s name and people actually turn round to look. Whatever that was, it was not friendship.`,
  (a, b) => `${a} saves the one person nobody expected ${pronouns(a).obj} to, and offers no explanation for it.`,
];

/**
 * The people who were sitting right there and did not hear their name.
 *
 * Written to be SAID rather than admired. The first version reached for
 * phrases like "a bad smile" that no houseguest would ever use out loud, and
 * it read like something translated rather than something said.
 */
const PASSED_OVER = [
  (a, b) => `${b} was watching ${a}'s face the whole time, waiting for it, and it never came.`,
  (a, b) => `${a} had one name to give and did not give it to ${b}. ${b} will remember how long ${a} took over it.`,
  (a, b) => `${b} was counting on ${a}. ${b} is not counting on ${a} any more.`,
  (a, b) => `${b} does not react at all. From ${b}, that is a reaction, and the room reads it as one.`,
  (a, b) => `${b} had half stood up already. ${pronouns(b).Sub} sits back down and stares at the floor for a while.`,
  (a, b) => `${a} and ${b} were close before tonight. ${b} has just found out how close.`,
  (a, b) => `${b} smiles at ${a}. It takes ${pronouns(b).obj} a second too long, and it does not reach ${pronouns(b).posAdj} eyes.`,
  (a, b) => `${a} could have ended ${b}'s week right there and did not. ${b} will be thinking about that until Thursday.`,
  (a, b) => `${b} says "fair enough" to nobody in particular, and does not sound like ${pronouns(b).sub} ${pronouns(b).sub === 'they' ? 'mean' : 'means'} it.`,
];

/**
 * The last houseguest made safe, holding a link with nowhere to send it.
 *
 * The chain stops at three because those three have to compete. So the final
 * person saved gets the one thing nobody else in the room got: safety, the
 * power to save, and no permission to use it.
 */
const LAST_LINK = [
  (n, left) => `${n} is safe, and that is where it stops. Three people are left and ${n} is not allowed to save any of them — ${left.join(', ')} are going to settle it themselves.`,
  (n, left) => `The chain reaches ${n} and runs out. ${n} holds it, looks at ${left.join(', ')}, and is told the choosing is over.`,
  (n, left) => `${n} takes the last link and has nowhere to send it. ${left.join(', ')} are the three, and no houseguest gets a say in which of them stays.`,
  (n, left) => `That is the end of it. ${n} was the last name called, and the three people ${pronouns(n).sub} might have saved are now competing for it instead.`,
];

/** Québec: the chain ends on one person, and everybody watched it get there. */
const LAST_LINK_ONE = [
  (n, left) => `${n} is safe, and there is nobody left to hand it to but ${left}. The chain stops rather than save ${pronouns(left).obj}.`,
  (n, left) => `It comes down to ${n}, holding the last link, with ${left} the only person left to give it to. ${n} does not give it.`,
  (n, left) => `${n} takes the link and the room realises at the same moment that ${left} is the only name left uncalled.`,
];

/** And the one nobody said. */
const LEFTOVER_ONE = [
  n => `${n} is the only person in this house nobody chose. Not one name in that whole chain was ${n}'s.`,
  n => `The chain runs out on ${n}. Every single houseguest had a name to give and every single one of them gave it to somebody else.`,
  n => `${n} is left. There is no competition to win out of it and nobody to share it with — just ${n}, and a room that went all the way round.`,
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
export function runChainOfSafety({ week, house, hoh, rng = Math.random,
  variant = 'safety-comp', style = 'canada', skip = [] } = {}) {
  // Québec runs the chain down to ONE person left unchosen; Canada stops at
  // three so they have a field to compete in.
  const CHAIN_FLOOR_HERE = style === 'quebec' ? 1 : CHAIN_FLOOR;
  // A second chain does not offer safety to somebody already nominated by the
  // first one — they are on the block and out of it.
  const room = (house || []).filter(Boolean).filter(n => !skip.includes(n));
  if (room.length < (style === 'quebec' ? 4 : 6)) return null;
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
  const totalPicks = unsafe.length - CHAIN_FLOOR_HERE;

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

  while (unsafe.length > CHAIN_FLOOR_HERE) {
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
    // The FIELD at the moment of choosing — how many people were actually
    // available to be saved. A line that states the number has to be given it
    // rather than guessing: one of them said "four people to give it to" on
    // every week regardless of how many were left.
    const field = unsafe.length + 1;
    beats.push(beat(say(pool)(picker, chosen, pronouns(picker), field), [picker, chosen],
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

  // ── the chain dies in somebody's hands ──
  //
  // The last houseguest made safe is handed the link and has nowhere to put
  // it: three people are left and the rule stops there, because those three
  // are the ones who compete. Without this beat the screen simply showed the
  // chain ending one name early and it read as somebody skipping their turn.
  // It is also the best seat in the twist — safe, holding the power to save,
  // and not allowed to use it on any of the three people watching you hold it.
  const holder = order[order.length - 1];
  if (holder && holder !== starter && unsafe.length) {
    // Québec leaves ONE person over, not three, so the line about the three of
    // them settling it themselves is not true there — and the holder is not
    // stopped by a rule, they simply have nobody left worth the link.
    beats.push(style === 'quebec'
      ? beat(say(LAST_LINK_ONE)(holder, unsafe[0]), [holder, unsafe[0]],
        'THE LAST NAME NOBODY SAID', 'blue')
      : beat(say(LAST_LINK)(holder, unsafe), [holder, ...unsafe],
        'NOWHERE LEFT TO SEND IT', 'blue'));
  }

  // ── whoever the chain never reached ──
  const leftover = [...unsafe];
  beats.push(style === 'quebec'
    ? beat(say(LEFTOVER_ONE)(leftover[0]), [...leftover], 'CHOSEN BY NOBODY', 'red')
    : beat(say(LEFTOVER)(leftover), [...leftover], 'CHOSEN BY NOBODY', 'red'));
  for (const n of leftover) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[n] = (gs.popularity[n] || 0) - 1;
  }

  // ── QUÉBEC ENDS HERE ──
  //
  // One person is left unchosen and that is a nominee. There is no competition
  // among the leftovers because there is only one of them; the second nominee
  // comes from running the whole chain again, which the caller does.
  if (style === 'quebec') {
    return {
      type: 'chain-of-safety', week: week?.num || 0, style: 'quebec',
      variant: useHoh ? 'hoh' : 'safety-comp',
      starter, openingComp,
      order: [...order], links, leftover,
      finalComp: null, safetyWinner: null,
      nominees: [...leftover],
      slights, beats,
    };
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
    style: 'canada',
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
  (b, a) => `${b} has not spoken to ${a} once since the chain, and everybody in the house has noticed that ${pronouns(b).sub} ${pronouns(b).sub === 'they' ? 'have' : 'has'} not.`,
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
  (n) => `${n} counts it out loud to nobody in particular. Every single person in this house had one name to give and not one of them said ${n}. There is no Head of Household to blame for it. There is only everybody.`,
  (n) => `${n} keeps coming back to the same thing: there is nobody left to talk round, because every one of them already said their name out loud in front of the others.`,
  (n) => `Somebody tells ${n} it was not personal. ${n} asks them what would count as personal, if not that.`,
  (n, p) => `${n} is on the block and cannot name the person who put ${p.obj} there, because it was all of them, one at a time, out loud.`,
  (n, p) => `${n} is extremely pleasant to everybody all evening, which is what ${n} does instead of saying what ${p.sub} actually ${p.sub === 'they' ? 'think' : 'thinks'}.`,
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
    // `chainFallout` on the BEAT, not only on the act. The act it ends up in
    // is the week's ordinary house-life stretch, which carries everybody
    // else's beats too, so the flag has to travel with the sentences that
    // actually came from the chain.
    socialBeats.push({ text, players: [...players].filter(Boolean), badgeText, badgeClass,
      chainFallout: true, category: 'social', location: 'living-room' });

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
    add(`${second.passed} and ${second.picker} are polite to each other all evening. Neither of them is normally polite to anybody, and the room notices.`,
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
    add(`${act.safetyWinner} is safe, but had to win a competition for it. Everybody else was simply chosen, and ${pronouns(act.safetyWinner).sub} ${pronouns(act.safetyWinner).sub === 'they' ? 'were' : 'was'} not.`,
      [act.safetyWinner], 'SAFE, AND COUNTING', 'blue');
  }

  // THE FIRST LINK, who is now holding a favour and a grudge in the same hand.
  const first = act.links[0];
  if (first) {
    add(`${first.chosen} was the first name called tonight and nobody has stopped bringing it up. It was meant kindly, and it has made ${pronouns(first.chosen).obj} a target.`,
      [first.chosen, first.picker], 'FIRST NAME CALLED', 'gold');
  }
  // And the last one made safe: picked, but only just.
  const last = act.links[act.links.length - 1];
  if (last && act.links.length > 2) {
    add(`${last.chosen} was the last name called. One place further down and ${pronouns(last.chosen).sub} would be sitting with the other three, and ${pronouns(last.chosen).sub} ${pronouns(last.chosen).sub === 'they' ? 'know' : 'knows'} it.`,
      [last.chosen], 'SAFE BY ONE', 'grey');
  }

  if (!socialBeats.length) return null;
  return { type: 'house', phase: 'post-noms', chainFallout: true, socialBeats };
}

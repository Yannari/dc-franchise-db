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
import { pStats } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { aptitude, clamp } from '../bb-comps/_shared.js';
import { setBBTarget } from './shared-strategy.js';
import { rememberStrategy } from '../strategy-memory.js';
import { scriptBeat } from './script/inject.js';

const beat = (text, players, badgeText, badgeClass = 'gold', part = null, extra = {}) =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

/** A safety run is a scramble, not a test of one stat. */
const SAFETY_MIX = { physical: 0.30, mental: 0.26, endurance: 0.24, temperament: 0.20 };

/** How many are left standing when the chain stops. Both variants stop at three. */
export const CHAIN_FLOOR = 3;



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

/** The handover: last to be saved, first to choose. */

/** Early in the chain: the picks nobody has to justify. */

/** The middle: the picks that start costing something. */

/** Late: the room is small, and everybody can count. */

/** Saving the person you are in a showmance with. Nobody is surprised. */

/** Saving somebody you are openly aligned with. */

/** Saving somebody you have no relationship with at all. */

/** Saving somebody you do not even like. That is a move. */

/**
 * The people who were sitting right there and did not hear their name.
 *
 * Written to be SAID rather than admired. The first version reached for
 * phrases like "a bad smile" that no houseguest would ever use out loud, and
 * it read like something translated rather than something said.
 */

/**
 * The last houseguest made safe, holding a link with nowhere to send it.
 *
 * The chain stops at three because those three have to compete. So the final
 * person saved gets the one thing nobody else in the room got: safety, the
 * power to save, and no permission to use it.
 */

/** Québec: the chain ends on one person, and everybody watched it get there. */

/** And the one nobody said. */

/** The last three, chosen by nobody. */

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
  variant = 'safety-comp', style = 'canada', skip = [], startWith = null } = {}) {
  // Québec runs the chain down to ONE person left unchosen; Canada stops at
  // three so they have a field to compete in.
  const CHAIN_FLOOR_HERE = style === 'quebec' ? 1 : CHAIN_FLOOR;
  // A second chain does not offer safety to somebody already nominated by the
  // first one — they are on the block and out of it.
  const room = (house || []).filter(Boolean).filter(n => !skip.includes(n));
  if (room.length < (style === 'quebec' ? 4 : 6)) return null;
  // The words are written by bb/script/ceremony.js (lines/chainact.js). Each beat
  // keeps a plain fact and its part; `rng()` stands where a wording was drawn.
  const beats = [];
  const useHoh = variant === 'hoh' && hoh && room.includes(hoh);

  // ── the first link ──
  let starter = null;
  let openingComp = null;
  if (startWith && room.includes(startWith)) {
    // ── A SECOND CHAIN IS NOT THE FIRST ONE AGAIN ──
    //
    // Started from the same person, with the same room and the same bonds, the
    // second chain picked the same names in the same order — seventeen
    // identical links, which reads as the screen repeating itself rather than
    // as the house choosing twice.
    //
    // So it starts with whoever was holding the chain when it stopped: the
    // last person saved goes first this time. It is the natural handover, it
    // guarantees a different order, and it is the best thing that happens to
    // somebody who was picked seventeenth.
    starter = startWith;
    rng();
    beats.push(beat(`${starter} starts the chain again.`, [starter], 'STARTS IT THIS TIME', 'gold', 'start', { how: 'again' }));
  } else if (useHoh) {
    starter = hoh;
    rng();
    beats.push(beat(`${starter}, the Head of Household, starts the chain.`, [starter], 'STARTS THE CHAIN', 'gold', 'start', { how: 'hoh' }));
  } else {
    // Everybody plays for it, including the Head of Household — the point of
    // this variant is that the chain does not belong to the person in power.
    const runs = room.map(name => ({
      name, score: aptitude(name, SAFETY_MIX) + (rng() - 0.5) * 4.6,
    })).sort((a, b) => b.score - a.score);
    starter = runs[0].name;
    openingComp = { participants: room.map(n => n), placements: runs.map(r => r.name),
      scores: Object.fromEntries(runs.map(r => [r.name, Math.round(r.score * 10) / 10])) };
    rng();
    beats.push(beat(`${starter} wins the safety competition and starts the chain.`, [starter], 'FIRST LINK', 'gold', 'start', { how: 'comp' }));
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
    const kind = rel || (done > 0.72 ? 'late' : done < 0.3 ? 'early' : 'mid');
    rng();
    beats.push(beat(`${picker} picks ${chosen}.`, [picker, chosen], 'SAFE', 'green', 'link', { kind }));

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
      rng();
      beats.push(beat(`${worst.n} is not picked by ${picker}.`, [picker, worst.n], 'PASSED OVER', 'red', 'passed'));
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
    rng();
    beats.push(style === 'quebec'
      ? beat(`${holder} is the last link. Only ${unsafe[0]} is left.`, [holder, unsafe[0]], 'THE LAST NAME NOBODY SAID', 'blue', 'last')
      : beat(`${holder} is the last link. ${unsafe.join(', ')} are left.`, [holder, ...unsafe], 'NOWHERE LEFT TO SEND IT', 'blue', 'last'));
  }

  // ── whoever the chain never reached ──
  const leftover = [...unsafe];
  rng();
  beats.push(beat(`Nobody picked ${leftover.join(', ')}.`, [...leftover], 'CHOSEN BY NOBODY', 'red', 'leftover'));
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
    beats.push(beat(`${survivor} wins the second safety competition and is safe.`, [survivor], 'SAFE', 'green', 'final'));
  }
  if (nominees.length) {
    beats.push(beat(`${nominees.join(' and ')} are the nominees.`, [...nominees], 'NOMINATED', 'red', 'noms'));
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

/**
 * A nominee with nobody to be angry at.
 *
 * The specific misery of this twist: on an ordinary week you can hate the Head
 * of Household. Here the whole house did it to you one at a time, in public,
 * and there is nobody to campaign to about it.
 */

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
  const socialBeats = [];
  // Each one is a scene in the living room (lines/chainact.js `chainfall.*`),
  // written with the story's own dice; `text` is its transcript. `rng()` stands
  // where a wording used to be drawn, so the week rolls as it did.
  //
  // `chainFallout` on the BEAT, not only on the act. The act it ends up in
  // is the week's ordinary house-life stretch, which carries everybody
  // else's beats too, so the flag has to travel with the sentences that
  // actually came from the chain.
  const add = (fact, players, badgeText, badgeClass, kind, who) => {
    const script = scriptBeat(kind, who, { ending: 'scene' },
      { week: { num: act.week || 0 }, act: 'house', room: 'living-room', salt: `${kind}|${players.join('|')}` });
    socialBeats.push({ text: script ? script.text : fact, players: [...players].filter(Boolean), badgeText, badgeClass,
      chainFallout: true, category: 'social', location: 'living-room', eventId: kind.replace('chainfall.', 'chain-'),
      ...(script ? { lines: script.lines, lineId: script.lineId } : {}) });
  };

  // THE PEOPLE WHO WERE COUNTING ON SOMEBODY. The loudest one first, because
  // it is the thing the twist exists to produce.
  const worst = [...(act.slights || [])].sort((a, b) => b.bond - a.bond)[0];
  if (worst) {
    rng();
    add(`${worst.passed} confronts ${worst.picker} about the chain.`, [worst.passed, worst.picker], 'ONE NAME', 'red',
      'chainfall.confront', { a: worst.passed, b: worst.picker });
  }
  // The second-worst, if there was one and it was a different pair.
  const second = [...(act.slights || [])].sort((a, b) => b.bond - a.bond)
    .find(x => worst && x.passed !== worst.passed && x.bond >= 4);
  if (second) {
    add(`${second.passed} and ${second.picker} are polite to each other all evening.`,
      [second.passed, second.picker], 'CIVIL', 'grey', 'chainfall.civil', { a: second.passed, b: second.picker });
  }

  // THE NOMINEES, who were not nominated by anybody and have nobody to blame
  // in particular — which is its own specific misery and worth its own beat.
  for (const n of (act.nominees || []).slice(0, 2)) {
    rng();
    add(`${n} was left unchosen.`, [n], 'NOBODY PUT ME HERE', 'red', 'chainfall.nominee', { a: n });
  }

  // THE ONE WHO GOT OUT OF IT. Winning the second competition is a week of
  // safety and a permanent piece of information about where you stand.
  if (act.safetyWinner) {
    add(`${act.safetyWinner} won safety instead of being chosen.`,
      [act.safetyWinner], 'SAFE, AND COUNTING', 'blue', 'chainfall.counting', { a: act.safetyWinner });
  }

  // THE FIRST LINK, who is now holding a favour and a grudge in the same hand.
  const first = act.links[0];
  if (first) {
    add(`${first.chosen} was the first name called.`,
      [first.chosen, first.picker], 'FIRST NAME CALLED', 'gold', 'chainfall.first', { a: first.chosen, b: first.picker });
  }
  // And the last one made safe: picked, but only just.
  const last = act.links[act.links.length - 1];
  if (last && act.links.length > 2) {
    add(`${last.chosen} was the last name called.`,
      [last.chosen], 'SAFE BY ONE', 'grey', 'chainfall.byone', { a: last.chosen });
  }

  if (!socialBeats.length) return null;
  return { type: 'house', phase: 'post-noms', chainFallout: true, socialBeats };
}

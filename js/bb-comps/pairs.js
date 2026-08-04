// ══════════════════════════════════════════════════════════════════════
// bb-comps/pairs.js — Battle of the Block games, played two at a time
// ══════════════════════════════════════════════════════════════════════
//
// The Battle of the Block had no games of its own. It borrowed the arena
// library — written for the Block Buster, where three nominees fight alone and
// exactly one comes off the block — and then averaged the four individual
// scores into two pair results. That produced a number, but it never produced
// the competition: four people playing solo in the same yard, and a closing
// beat announcing each of their fates separately on a night when fate arrives
// in twos. The week had to strip those beats back out before they contradicted
// the screen.
//
// These are written for what the Battle of the Block IS. Two nominees are one
// unit. They cannot be scored apart, because the format's entire cruelty is
// that you do not lose it — your partner does, and you go to the block anyway.
// So a pair here has ONE progress track and the two of them feed it together,
// with three things the individual model could never express:
//
//   · The weak link matters more than the strong one. A pair moves at a rate
//     weighted toward its slower half, so a monster paired with somebody
//     drowning is a pair that is drowning. This is why the pick of a pawn is a
//     real decision and not a formality.
//   · Chemistry is worth points. Two people who trust each other move faster
//     than two people who do not, and two people who actively dislike each
//     other lose time to it visibly, in front of the house.
//   · Throwing is a pair decision made alone. Winning the Battle dethrones the
//     Head of Household who nominated you — so a nominee sitting under an ALLY
//     and facing a rival's reign has a reason to lose on purpose, and does,
//     without telling the person next to them.
//
// The one confirmed real game is here under its own name; the others are
// written to the same shape — cooperative, relay-structured, first pair home
// wins — because that is the shape every Battle of the Block took.

import { pronouns } from '../players.js';
import { aptitude, beat, choose, makePicker, vb, clamp } from './_shared.js';
import { bond } from '../bb-events/_read.js';

// ── the pair model ────────────────────────────────────────────────────

/**
 * How fast a pair moves, and why.
 *
 * Weighted 0.38/0.62 toward the WEAKER half on purpose. An even split makes a
 * strong partner able to carry anybody, which removes the only decision the
 * nominating Head of Household actually makes.
 */
function pairRate(members, mix, rng, thrown) {
  const apts = members.map(n => aptitude(n, mix));
  const strong = Math.max(...apts);
  const weak = Math.min(...apts);
  const skill = strong * 0.38 + weak * 0.62;
  // Two people who trust each other work as one; two who do not spend the
  // competition getting in each other's way. Bond runs -10..+10.
  const chem = bond(members[0], members[1]) * 0.14;
  const noise = (rng() - 0.5) * 3.0;
  const sabotage = thrown ? 2.6 + rng() * 2.2 : 0;
  return { rate: Math.max(0.2, skill + chem + noise - sabotage), skill, chem, noise, strong, weak, apts };
}

/**
 * Would this nominee rather lose?
 *
 * Winning the Battle takes the crown off the Head of Household who nominated
 * you. If that Head of Household is an ally and the other one is not, the
 * winning move can be to stay on the block and let your friend keep the house.
 * Proportional, never certain, and never told to the partner.
 */
function throwReadPair(name, ownHoh, otherHoh, rng) {
  const withOwn = bond(name, ownHoh);
  const withOther = bond(name, otherHoh);
  if (!ownHoh || !otherHoh) return { threw: false, chance: 0 };
  // Wanting your nominator to stay in power is only worth the block when the
  // alternative reign is genuinely worse for you.
  const appetite = clamp((withOwn - withOther) / 26, 0, 0.42);
  return { threw: rng() < appetite, chance: appetite, withOwn, withOther };
}

/** The pair's members, in the order the beats should name them. */
const lead = (members, mix) =>
  [...members].sort((a, b) => aptitude(b, mix) - aptitude(a, mix));

const CHEM_GOOD = [
  (a, b, p) => `${a} and ${b} do not need to talk about it. ${p.Sub} ${vb(p, 'moves', 'move')} when ${b} moves, and the pair gains ground without either of them noticing they are gaining it.`,
  (a, b) => `${a} calls it and ${b} is already doing it. Twice in a row. That is what the house is watching, more than the score.`,
  (a, b) => `Somewhere in the middle of it ${a} and ${b} stop being two people playing and start being one thing that is winning.`,
  (a, b) => `${b} makes a mistake and ${a} covers it before it costs anything, and says nothing about it afterwards.`,
];

const CHEM_BAD = [
  (a, b) => `${a} tells ${b} to go. ${b} does not go. They lose four seconds to a disagreement they have clearly been having since long before the horn.`,
  (a, b) => `${a} and ${b} both reach for the same thing at the same time, and the yard hears exactly what ${a} says about it.`,
  (a, b) => `${b} plays like ${a} is not there, which is a choice, and it costs them.`,
  (a, b) => `Two people who cannot stand each other have been handcuffed together in front of the whole house, and it shows in every single exchange.`,
];

const WEAK_LINK = [
  (weak, strong, p) => `${strong} is doing everything right and it does not matter, because ${weak} is the half of this pair the clock is actually measuring. ${pronouns(weak).Sub} ${vb(pronouns(weak), 'knows', 'know')} it too.`,
  (weak, strong) => `${weak} slips, resets, slips again. ${strong} watches the other pair pull ahead and says nothing, which is worse than saying something.`,
  (weak, strong) => `The gap is not ${strong}. Everyone in the yard can see exactly where the gap is, and so can ${weak}.`,
  (weak, strong) => `${strong} takes over ${weak}'s half of it. It is against the rules of nothing, and it is still humiliating.`,
];

const THROW_PAIR = [
  n => `${n} takes a long, careless run at it and comes up short in a way that a person of ${pronouns(n).posAdj} ability does not usually come up short.`,
  n => `${n} is not playing this. ${pronouns(n).Sub} ${vb(pronouns(n), 'is', 'are')} moving, and ${pronouns(n).sub} ${vb(pronouns(n), 'is', 'are')} not playing this.`,
  n => `Twice ${n} has it and twice ${n} lets it go. Nobody in the yard says the word out loud yet.`,
  n => `${n} loses this on purpose, with a partner beside ${pronouns(n).obj} who has no idea and is still trying.`,
];

/**
 * The shared engine. A game supplies its legs and its lines; this runs the two
 * pairs down them together and returns a full result.
 */
function runPairGame(participants, context, api, rng, game) {
  const pairs = (context.pairs || []).filter(p => (p.members || []).length === 2);
  // No pairing information means this is not a Battle of the Block — the week
  // is expected to fall back rather than have this invent partners.
  if (pairs.length !== 2) return null;

  const pick = makePicker(rng);
  const beats = [];
  const mix = game.stats;
  const [ownerA, ownerB] = pairs.map(p => p.owner);

  const state = pairs.map(p => {
    const members = lead(p.members, mix);
    const other = p.owner === ownerA ? ownerB : ownerA;
    const throws = Object.fromEntries(members.map(n => [n, throwReadPair(n, p.owner, other, rng)]));
    const thrown = members.filter(n => throws[n].threw);
    return { ...p, members, throws, thrown, progress: 0, legs: [] };
  });

  beats.push(beat(game.opening(state[0], state[1]),
    [...state[0].members, ...state[1].members], 'BATTLE OF THE BLOCK', 'challenge'));

  // ── the legs ──
  game.legs.forEach((leg, i) => {
    for (const s of state) {
      const r = pairRate(s.members, mix, rng, s.thrown.length > 0);
      s.progress += r.rate;
      s.noise = (s.noise || 0) + r.noise;
      s.legs.push({ leg: leg.name, gained: Math.round(r.rate * 100) / 100, ...r });
      beats.push(beat(leg.line(s.members[0], s.members[1], pick, rng),
        [...s.members], leg.badge, 'challenge'));
    }

    // One relationship beat per leg, on whichever pair has the story.
    const chemSorted = [...state].sort((a, b) =>
      Math.abs(bond(b.members[0], b.members[1])) - Math.abs(bond(a.members[0], a.members[1])));
    const s = chemSorted[0];
    const b12 = bond(s.members[0], s.members[1]);
    if (i === 0 && Math.abs(b12) >= 3) {
      const [x, y] = s.members;
      beats.push(beat(
        b12 > 0 ? choose(rng, CHEM_GOOD)(x, y, pronouns(x)) : choose(rng, CHEM_BAD)(x, y),
        [x, y], b12 > 0 ? 'IN STEP' : 'OUT OF STEP', b12 > 0 ? 'gold' : 'red'));
      // Being handcuffed to somebody for a competition changes what you are to
      // each other afterwards, in whichever direction it was already going.
      api.addBond(x, y, b12 > 0 ? 0.8 : -0.7);
    }
  });

  // ── the weak link, and the throw ──
  for (const s of state) {
    const apts = s.members.map(n => aptitude(n, mix));
    if (Math.abs(apts[0] - apts[1]) >= 2.2) {
      const [strong, weak] = apts[0] >= apts[1] ? s.members : [...s.members].reverse();
      beats.push(beat(choose(rng, WEAK_LINK)(weak, strong, pronouns(weak)),
        [weak, strong], 'CARRYING', 'red'));
    }
    for (const n of s.thrown) {
      beats.push(beat(choose(rng, THROW_PAIR)(n), [n], 'THROWN', 'red'));
      api.record(n, 'botb-thrown', { forHoh: s.owner });
    }
  }

  // ── the finish ──
  const [won, lost] = [...state].sort((a, b) => b.progress - a.progress);
  const gap = won.progress - lost.progress;
  beats.push(beat(game.finish(won.members, lost.members, gap),
    [...won.members], 'SAVED', 'gold'));

  // The contract wants a ranked field of individuals. There is no such thing
  // here, so the pair's result is every member's result, separated only by how
  // much of it each of them was: enough to order the board, never enough to
  // put a loser above a winner.
  const contribution = s => Object.fromEntries(s.members.map(n =>
    [n, aptitude(n, mix) * 0.05 - (s.throws[n].threw ? 1 : 0)]));
  const cw = contribution(won);
  const cl = contribution(lost);
  const scores = {};
  const breakdown = {};
  for (const [s, contrib, base] of [[won, cw, 10], [lost, cl, 0]]) {
    for (const n of s.members) {
      scores[n] = Math.round((base + s.progress + contrib[n]) * 100) / 100;
      breakdown[n] = {
        base: Math.round(aptitude(n, mix) * 100) / 100,
        pair: s.members.join(' & '), pairOwner: s.owner,
        pairProgress: Math.round(s.progress * 100) / 100,
        chemistry: Math.round(bond(s.members[0], s.members[1]) * 100) / 100,
        threwChance: Math.round(s.throws[n].chance * 100) / 100,
        threw: s.throws[n].threw, saved: s === won, score: scores[n],
      };
    }
  }
  const placements = [...won.members, ...lost.members].sort((a, b) => scores[b] - scores[a]);

  return {
    winner: placements[0], placements, scores, beats, events: [],
    variant: game.variant,
    breakdown,
    // What the week actually needs: the result as PAIRS. Averaging individual
    // scores was an approximation of this, and it could not represent a pair
    // that lost because of one of its halves.
    pairScores: { [won.owner]: Math.round(won.progress * 100) / 100,
      [lost.owner]: Math.round(lost.progress * 100) / 100 },
    pairWinner: won.owner,
    // The Debug panel explains a result with aptitude and luck. Both halves of
    // a pair are handed the PAIR's luck, because there is no such thing as one
    // of them having got a good bounce on a night they shared a rope.
    luck: Object.fromEntries([won, lost].flatMap(s =>
      s.members.map(n => [n, Math.round((s.noise || 0) * 100) / 100]))),
    text: beats.map(b => b.text).join(' '),
  };
}

/** Wrap a game definition into a dispatcher-shaped competition. */
const pairComp = game => ({
  id: game.id, name: game.name, category: game.category, types: ['pair'],
  desc: game.desc, stats: game.stats,
  simulate: (participants, context, api, rng) => runPairGame(participants, context, api, rng, game),
});

// ── the games ─────────────────────────────────────────────────────────

export const PAIR_COMPS = [
  pairComp({
    // The one Battle of the Block whose rules are confirmed rather than
    // reconstructed: a swing-and-pour relay where neither half of the pair can
    // score without the other half being exactly where they said they would be.
    id: 'pair-pouring-twenties', variant: 'pair-pour', name: 'The Pouring 20s',
    category: 'precision',
    desc: 'Two nominees, one vase. One of them swings out over the yard and fills a glass; the other swings back and catches what is thrown, then empties it into a vase packed with berries. Nothing scores unless both halves of the pair are exactly where they promised to be, at exactly the right moment, over and over. The pair that overflows the vase and spills a berry first wins, comes off the block — and takes the crown off the Head of Household who put them there.',
    stats: { physical: 0.30, temperament: 0.26, intuition: 0.22, endurance: 0.14, mental: 0.08 },
    opening: (a, b) => `Two vases, four nominees, and a rule that nobody can score alone. ${a.members.join(' and ')} against ${b.members.join(' and ')} — and the pair that fills first does not just save themselves, they take a crown off the wall.`,
    legs: [
      { name: 'first pours', badge: 'FIRST POURS', line: (x, y, pick) => pick([
        `${x} swings out, fills, and throws — and ${y} is there, which is the whole competition in one motion.`,
        `The first three attempts from ${x} and ${y} put more water on the yard than in the vase.`,
        `${y} catches everything ${x} sends and does not once look at the other vase.`,
        `${x} goes out too hard and comes back with an empty glass. ${y} says nothing and resets.`,
      ]) },
      { name: 'rhythm', badge: 'RHYTHM', line: (x, y, pick) => pick([
        `${x} and ${y} find a rhythm — out, throw, catch, pour — and for a stretch it looks easy, which it is not.`,
        `The berries start to lift in ${x} and ${y}'s vase. Slowly. It is going to come down to how long that lasts.`,
        `${y} shortens the swing and the pair immediately gains on it. ${x} adjusts without being asked.`,
        `Water is running off both of them now. ${x} and ${y} keep going anyway.`,
      ]) },
      { name: 'the last inch', badge: 'THE LAST INCH', line: (x, y, pick) => pick([
        `The last inch of the vase takes ${x} and ${y} longer than the first six did.`,
        `${x} is pouring on a full arm now, and the berries are up at the lip, and one more will do it.`,
        `${y}'s hands have gone somewhere past useful. The pair is running on ${x} and stubbornness.`,
        `${x} and ${y} can see the other vase from where they are standing. Neither of them looks at it, which takes more effort than the swinging.`,
      ]) },
    ],
    finish: (won, lost, gap) => gap < 1.2
      ? `A berry goes over the lip of ${won.join(' and ')}'s vase by the width of the yard's patience — and ${lost.join(' and ')} were one pour away. One.`
      : `${won.join(' and ')} overflow it clean, and the berry hits the grass while ${lost.join(' and ')} are still swinging.`,
  }),

  pairComp({
    id: 'pair-house-of-cards', variant: 'pair-build', name: 'Crash Pad',
    category: 'precision',
    desc: 'A tower of oversized cards, built by two people on opposite sides of it, neither able to see what the other is doing. Every card has to be placed by one nominee and steadied by the other, and a tower that comes down comes down on both of them. The first pair to the height line wins and comes off the block.',
    stats: { temperament: 0.32, mental: 0.24, physical: 0.20, intuition: 0.16, endurance: 0.08 },
    opening: (a, b) => `Two towers, and neither nominee can see their partner through it. ${a.members.join(' and ')} on one, ${b.members.join(' and ')} on the other, and every single card needs both of them.`,
    legs: [
      { name: 'the base', badge: 'THE BASE', line: (x, y, pick) => pick([
        `${x} lays the base wide and ${y} builds narrow onto it, and they have to stop and argue about it through a wall of cards.`,
        `${x} and ${y} get four levels up before either of them says a word. It is the fastest start in the yard.`,
        `${y} steadies, ${x} places. Steady, place. It is not exciting and it is working.`,
        `The first collapse takes ${x} and ${y} back to nothing, and they start again without discussing it.`,
      ]) },
      { name: 'the middle', badge: 'THE MIDDLE', line: (x, y, pick) => pick([
        `Halfway up, ${x} and ${y} start having to trust a pair of hands they cannot see.`,
        `${x} calls the placements now and ${y} just does them, and the tower goes up faster than it has any right to.`,
        `A card slips out of ${y}'s hand. The whole thing shivers and holds, and neither of them breathes for a second.`,
        `${x} is going too fast for ${y} and both of them know it and neither of them slows down.`,
      ]) },
      { name: 'the height line', badge: 'THE LINE', line: (x, y, pick) => pick([
        `The last few cards are above ${x}'s reach, which makes them ${y}'s problem, which ${y} did not sign up for.`,
        `${x} and ${y} are two cards under the line and the tower is moving on its own.`,
        `${y} places one-handed, arm shaking, with ${x} holding everything below it.`,
        `${x} and ${y} stop, look at what they have built, and decide together to put one more on it.`,
      ]) },
    ],
    finish: (won, lost, gap) => gap < 1.2
      ? `${won.join(' and ')} cross the height line with the tower still swaying, and it is close enough that ${lost.join(' and ')} genuinely do not know they have lost until the horn.`
      : `${won.join(' and ')} clear the line with room to spare. ${lost.join(' and ')}'s tower is on the grass.`,
  }),

  pairComp({
    id: 'pair-tethered', variant: 'pair-tether', name: 'Ball and Chain',
    category: 'physical',
    desc: 'Two nominees roped together at the waist and sent through the backyard course. Over, under and through, at the pace of whichever of them is slower, with a rope that punishes anybody who forgets there is a person on the end of it. The first pair through the finish wins and comes off the block.',
    stats: { physical: 0.36, endurance: 0.28, temperament: 0.18, boldness: 0.12, intuition: 0.06 },
    opening: (a, b) => `They rope them together at the waist. ${a.members.join(' and ')} on one line, ${b.members.join(' and ')} on the other, and from the horn neither of them gets to be an individual again until this is over.`,
    legs: [
      { name: 'the nets', badge: 'THE NETS', line: (x, y, pick) => pick([
        `${x} hits the net first and drags ${y} into it sideways. They lose ten seconds untangling a rope and a friendship.`,
        `${x} and ${y} go under the net flat and together, and come out the other side still moving.`,
        `${y} is faster than ${x} through the nets and has to keep not being faster, which is its own kind of work.`,
        `The rope catches on the frame. ${x} frees it while ${y} holds still, and neither of them wastes a word.`,
      ]) },
      { name: 'the wall', badge: 'THE WALL', line: (x, y, pick) => pick([
        `${x} goes over the wall first and then has to pull ${y} up a rope that is also tied to ${x}.`,
        `${y} makes a step of both hands and ${x} is over in one motion. That is a pair that has practised nothing and still knows how to do this.`,
        `Neither ${x} nor ${y} can get over the wall until they stop trying to do it at the same time.`,
        `${x} comes off the top of the wall badly and the rope takes ${y} down with ${pronouns(x).obj}.`,
      ]) },
      { name: 'the run in', badge: 'THE RUN IN', line: (x, y, pick) => pick([
        `${x} is pulling now — actually pulling, on the rope, with ${y} half a step behind and losing the half step.`,
        `${x} and ${y} run the last stretch matched stride for stride and the rope between them never once goes tight.`,
        `${y} is finished. ${x} is not, and ${x} has a rope, and the yard watches ${x} decide what to do about that.`,
        `${x} shortens up, takes ${y}'s arm, and they cover the last of it as one thing.`,
      ]) },
    ],
    finish: (won, lost, gap) => gap < 1.2
      ? `${won.join(' and ')} cross with the rope still swinging, half a body length of daylight over ${lost.join(' and ')}. Half.`
      : `${won.join(' and ')} come through the finish together, and ${lost.join(' and ')} are still on the course.`,
  }),

  pairComp({
    id: 'pair-blind-sort', variant: 'pair-blind', name: 'The Blind Spot',
    category: 'puzzle',
    desc: 'One nominee is blindfolded on the board; the other can see everything and touch nothing. Every piece the house has watched go up on the memory wall has to be placed by the person who cannot see it, described by the person who cannot reach it. The first pair with a finished board wins and comes off the block.',
    stats: { mental: 0.34, social: 0.24, intuition: 0.22, temperament: 0.14, strategic: 0.06 },
    opening: (a, b) => `One of each pair goes blindfolded, and the other one is not allowed to touch the board. ${a.members.join(' and ')} against ${b.members.join(' and ')}, and the only tool either pair has is how well they can talk to each other.`,
    legs: [
      { name: 'the first pieces', badge: 'FIRST PIECES', line: (x, y, pick) => pick([
        `${x} describes the first piece three different ways before ${y} finds it. The fourth way works.`,
        `${x} and ${y} get four pieces up before the other pair has one, purely on how ${x} talks.`,
        `${y} is placing by feel and getting it right, and ${x} has stopped saying anything except "yes".`,
        `${x} says left. ${y} goes left. It is the wrong left, and they lose the piece and a minute.`,
      ]) },
      { name: 'the middle of the board', badge: 'THE MIDDLE', line: (x, y, pick) => pick([
        `${x} has built a whole private language for this in about ninety seconds and ${y} is fluent in it.`,
        `${y} asks a question ${x} cannot answer without touching the board, and the pair stalls out on it.`,
        `${x}'s voice has gone very calm, which is the only reason ${y} has not come apart under the blindfold.`,
        `${x} and ${y} are talking over each other now, and the board is not getting any fuller.`,
      ]) },
      { name: 'the last piece', badge: 'THE LAST PIECE', line: (x, y, pick) => pick([
        `One piece left, and ${x} will not rush ${y}, and the other board is filling up.`,
        `${y} finds the last slot before ${x} has finished describing it.`,
        `${x} is shouting now. It does not help ${y}, and ${x} cannot stop.`,
        `${y} takes the blindfold half off out of pure frustration and puts it back before anybody has to say anything about it.`,
      ]) },
    ],
    finish: (won, lost, gap) => gap < 1.2
      ? `${won.join(' and ')}'s board locks a heartbeat before ${lost.join(' and ')}'s, and both blindfolds come off to the same news from opposite directions.`
      : `${won.join(' and ')} finish the board while ${lost.join(' and ')} are still arguing about a piece.`,
  }),
];

export default PAIR_COMPS;

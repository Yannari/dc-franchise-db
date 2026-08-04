// ══════════════════════════════════════════════════════════════════════
// bb-comps/arena.js — Block Buster games, and only Block Buster games
// ══════════════════════════════════════════════════════════════════════
//
// The arena had no games of its own: it borrowed whatever multi-type
// competition the picker handed it, so a last-chance fight for survival read
// exactly like a Tuesday veto. These seven are arena-exclusive and written
// for what the arena IS — three nominated houseguests, the whole house at
// the glass, a vote already on the schedule, and no version of losing that
// does not end in a chair.
//
// Mid-depth on purpose. A Block Buster game is ninety seconds of television,
// not a Total Drama twist engine: each one carries a distinct mechanic, a
// distinct stat mix, four to six beats that know the stakes, and a personal
// moment when the field's relationships supply one. Nothing here runs
// phases, maps or sidebars — the pressure IS the identity.
import { pronouns } from '../players.js';
import { scoreField, toResult, beat, margin, vb } from './_shared.js';
import { dislikes, bond } from '../bb-events/_read.js';

const say = (rng, lines) => lines[Math.floor(rng() * lines.length)];

/** The last-place fall, told with the clock in the room. */
const FALL_LINES = [
  (n, p) => `The horn goes for ${n} first. ${p.Sub} ${vb(p, 'stares', 'stare')} at the board a half-second longer than dignity strictly allows.`,
  (n, p) => `${n} is out of it. From the glass the house is perfectly silent, which everybody understands is not neutrality.`,
  (n, p) => `${n} runs out of arena before ${p.sub} ${vb(p, 'runs', 'run')} out of fight, which is somehow worse.`,
  (n, p) => `${n} steps back from the station slowly. The vote just got simpler for everybody except ${p.obj}.`,
];

const NEAR_MISS = [
  (a, b) => `${a} and ${b} finish so close the arena has to check its own numbers. Only one buzzer sounds.`,
  (a, b) => `For one second the board has ${b} ahead — then it corrects, and ${a} is the name in lights. ${b} watched it change.`,
  (a, b) => `${a} beats ${b} by less than the time it takes to say so.`,
  (a, b) => `${b} looks away before the last score posts. ${a} does not, and that is the whole difference in how the next minute goes.`,
];

function arenaFinish(entries, api, rng, beats) {
  const winner = entries[0];
  const runnerUp = entries[1];
  const m = margin(entries);
  if (runnerUp && m.word === 'photo finish') {
    beats.push(beat(say(rng, NEAR_MISS)(winner.name, runnerUp.name),
      [winner.name, runnerUp.name], 'BY NOTHING', 'gold'));
  }
  beats.push(beat(
    `${winner.name} hits the buzzer, and the block is one name shorter. Nobody saved ${pronouns(winner.name).obj} — ${pronouns(winner.name).sub} did it.`,
    [winner.name], 'OFF THE BLOCK', 'gold'));
  api.popDelta(winner.name, 2);
  api.record(winner.name, 'arena-save', { margin: m.word });
}

function arenaFalls(order, rng, beats) {
  order.slice(0, Math.max(1, order.length - 1)).forEach(e => {
    beats.push(beat(say(rng, FALL_LINES)(e.name, pronouns(e.name)), [e.name], 'STAYS NOMINATED', 'red'));
  });
}

/**
 * Every nominee gets seen PLAYING.
 *
 * Each game wrote one scene-setter and one incident, so exactly one nominee
 * per night was ever shown competing — the other two teleported from the
 * lockdown couch to the results. This emits a run card, in the game's own
 * mechanic, for every nominee the game's incident beats did NOT already
 * feature — coverage-aware because the games pick their incident stars
 * differently (most take the struggler, vertigo takes the middle, blackout
 * sometimes takes the leader), so no nominee goes unseen and nobody plays
 * the same moment twice.
 */
function arenaPlayByPlay(entries, rng, beats, lines) {
  const covered = new Set();
  for (const b of beats) {
    const featured = b?.players || [];
    // Scene-setters tag the whole field; only single-star beats count as
    // "this nominee was seen playing".
    if (featured.length && featured.length < entries.length) {
      featured.forEach(n => covered.add(n));
    }
  }
  entries.forEach((e, i) => {
    if (covered.has(e.name)) return;
    const role = i === 0 ? 'leader' : 'mid';
    const pool = lines[role] || lines.mid;
    if (!pool || !pool.length) return;
    beats.push(beat(say(rng, pool)(e.name, pronouns(e.name)), [e.name],
      role === 'leader' ? 'IN FRONT' : 'IN THE HUNT',
      role === 'leader' ? 'gold' : 'grey'));
  });
}

/** A grudge in the arena is a grudge with an audience. */
function arenaGrudge(entries, api, beats) {
  const [a, b] = entries;
  if (b && dislikes(a.name, b.name)) {
    beats.push(beat(
      `${a.name} and ${b.name} spend the whole game one station apart, not looking at each other with tremendous effort. One of them is about to be much easier to evict, and both of them are thinking it.`,
      [a.name, b.name], 'OLD BUSINESS', 'red'));
    // The comps api has no suspicion channel — a grudge sharpened in public
    // lands as bond damage, which it owns.
    api.addBond(a.name, b.name, -0.4);
  }
}

// ── the games ─────────────────────────────────────────────────────────

const PLAY_flashWall = {
    leader: [
      (n, p) => `${n} stops mouthing the sequence and just plays it — nine symbols, clean, like reading ${p.posAdj} own handwriting. The wall keeps getting longer and ${n} keeps not caring.`,
      (n, p) => `${n} closes ${p.posAdj} eyes for a half-second before each run, and every run lands. Whatever filing system is in there, it is winning.`,
      (n, p) => `${n} punches the seventh symbol before the light finishes fading. The glass goes quiet in the way that means the house is recalculating somebody.`,
    ],
    mid: [
      (n, p) => `${n} is one symbol behind the pace and knows it — every correct run ends with a glance at the other boards that costs exactly the focus it spends.`,
      (n, p) => `${n} recovers from an early fumble and strings four clean rounds together. Alive, chasing, and out of mistakes to give.`,
      (n, p) => `${n} talks through the sequence out loud, which the arena allows and dignity does not. It is working, barely.`,
    ],
  };

const flashWall = {
  id: 'bb-arena-flash-wall',
  name: 'Flash Wall',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'A wall flashes a sequence of symbols once. Each nominee must enter that sequence from memory; after every correct round, one more symbol is added. A second mistake eliminates a player. The last nominee remaining wins safety.',
  stats: { mental: 0.4, intuition: 0.28, temperament: 0.2, boldness: 0.12 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.8, context, rng });
    const beats = [];
    beats.push(beat(
      `The wall lights once — seven symbols, one look — and goes dark. Three nominees, three keypads, and a house at the glass mouthing sequences it will not have to answer for.`,
      participants.slice(0, 3), 'ONE LOOK'));
    const shakiest = [...entries].sort((x, y) => x.score - y.score)[0];
    beats.push(beat(
      `${shakiest.name}'s hand hovers over the fourth tile a beat too long. In here, hesitation is information, and everybody watching just received it.`,
      [shakiest.name], 'THE HOVER', 'grey'));
    arenaPlayByPlay(entries, rng, beats, PLAY_flashWall);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_houseOfCards = {
    leader: [
      (n, p) => `${n} builds low and wide first, then climbs — and when the horn tilts the tables, ${p.posAdj} tower sways and settles like it has done this before.`,
      (n, p) => `${n} places each card and takes ${p.posAdj} hands away slowly, the way you leave a sleeping dog. The tower grows anyway. Tallest in the arena, and steady.`,
      (n, p) => `The horn goes twice and ${n}'s tower gives up nothing. The other two podiums have started watching it instead of their own.`,
    ],
    mid: [
      (n, p) => `${n} loses the top third to a horn and rebuilds it without a word. The tower is shorter than the leader's and angrier.`,
      (n, p) => `${n} keeps pace card for card until a wobble costs a level. Standing, still in it, breathing like the table is the enemy.`,
      (n, p) => `${n} makes up ground between horns and freezes to a statue during them. It is a strategy, and it is almost enough.`,
    ],
  };

const houseOfCards = {
  id: 'bb-arena-house-of-cards',
  name: 'Steady Hands',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee stacks oversized card pieces into a tower. Every time the horn sounds, all three tables tilt and unstable towers may collapse. When time expires, the tallest tower still standing wins safety.',
  stats: { temperament: 0.36, physical: 0.24, endurance: 0.22, intuition: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.4, context, rng });
    const beats = [];
    beats.push(beat(
      `Three tables, three decks of cards the size of doors, and a horn that exists purely to ruin towers. The steadiest person in the arena is about to be the safest person in the house.`,
      participants.slice(0, 3), 'THE TABLES'));
    const collapse = [...entries].reverse()[0];
    beats.push(beat(
      `The horn blares and ${collapse.name}'s tower goes down to the felt — all of it, at once, with the whole house watching the exact moment ${pronouns(collapse.name).posAdj} night got harder.`,
      [collapse.name], 'COLLAPSE', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_houseOfCards);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_vertigo = {
    leader: [
      (n, p) => `${n} steers with tiny, patient shifts — the ball rolls past the third wrong hole close enough to touch and keeps going. The centre is two rings away and ${n} is not hurrying.`,
      (n, p) => `${n} has the maze doing what ${p.sub} ${vb(p, 'wants', 'want')}, which nobody else's maze is doing. Ring by ring, the ball spirals inward.`,
      (n, p) => `${n} leans, holds, and lets the ball do the work. It is the least dramatic run in the arena, which is exactly what winning this one looks like.`,
    ],
    mid: [
      (n, p) => `${n}'s ball kisses the rim of a wrong hole and everybody at the glass makes the same noise. Still rolling. Still in it.`,
      (n, p) => `${n} restarts once, swears once, and comes back faster — the second run knows where the traps are.`,
      (n, p) => `${n} is a full ring behind and steering like it, all-or-nothing leans that will win this or end it.`,
    ],
  };

const vertigo = {
  id: 'bb-arena-vertigo',
  name: 'Vertigo',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee steers a ball through a tilting maze by shifting their body weight. Landing the ball in any wrong hole forces a complete restart. The first nominee to guide the ball into the finish hole wins safety.',
  stats: { physical: 0.3, intuition: 0.28, boldness: 0.24, temperament: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.6, context, rng });
    const beats = [];
    beats.push(beat(
      `The mazes tilt with the nominees strapped to them, which means steering is done with your own bodyweight and your own nerve. The house lines the glass like it is watching surgery.`,
      participants.slice(0, 3), 'TILT'));
    const bold = [...entries].sort((x, y) => x.score - y.score)[Math.floor(entries.length / 2)];
    beats.push(beat(
      `${bold.name} takes the shortcut lane — the one with the two extra holes — because a careful route is a slow route and slow is just losing politely.`,
      [bold.name], 'THE SHORTCUT', 'gold'));
    arenaPlayByPlay(entries, rng, beats, PLAY_vertigo);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_lockout = {
    leader: [
      (n, p) => `${n} works the clues in order and out loud numbers stack up — the week the veto was first used, the count that sent the first houseguest out. Three digits lit and the fourth is close.`,
      (n, p) => `${n} has the season memorized the way people memorize grudges. The keypad lights another digit and the door starts to matter.`,
      (n, p) => `${n} solves the third clue off pure recall and does not even check the board. The house at the glass exchanges a look that will be a conversation later.`,
    ],
    mid: [
      (n, p) => `${n} argues with a clue for a full minute — was it week two or week three? — and the doubt costs more than the answer.`,
      (n, p) => `${n} has two digits lit and a theory about the third. Theories are what this arena eats.`,
      (n, p) => `${n} circles back to a skipped clue and cracks it, which puts ${p.obj} one digit behind with the clock leaning in.`,
    ],
  };

const lockout = {
  id: 'bb-arena-lockout',
  name: 'Lockout',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee must solve four clues about events and vote counts from the season, then enter the answers as a four-digit door code. Wrong codes do not open the door. The first nominee through their door wins safety.',
  stats: { mental: 0.34, strategic: 0.28, intuition: 0.24, endurance: 0.14 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `The code is the season: how many votes evicted the first houseguest, what week the veto was first used, how many sit on the block right now. The arena is a memory test disguised as a door.`,
      participants.slice(0, 3), 'THE DOOR'));
    const wrong = [...entries].reverse()[0];
    beats.push(beat(
      `${wrong.name} punches a code with total confidence and the door does not care. The season apparently happened differently than ${pronouns(wrong.name).sub} remembers it — which, tonight, is expensive.`,
      [wrong.name], 'WRONG CODE', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_lockout);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_lastShot = {
    leader: [
      (n, p) => `${n} shoots on a rhythm — draw, breathe, release — and the targets keep going down one ball apiece. The rack still looks healthy and the rail does not.`,
      (n, p) => `${n} banks a shot off the frame and takes the stubborn corner target with it. The kind of shot you only try when the arena feels like yours.`,
      (n, p) => `${n} is up targets with balls to spare, and everybody watching can do that arithmetic from the couch.`,
    ],
    mid: [
      (n, p) => `${n} misses twice, changes stance, and hits three straight. The rack is thinner than the leader's but the hands have stopped arguing.`,
      (n, p) => `${n} keeps pace on targets but spends more to do it — every knock-down costs a ball and a half, and the maths is on the wall.`,
      (n, p) => `${n} lines up the same target the leader just dropped and takes it a beat slower. Close enough to hear, not close enough to touch.`,
    ],
  };

const lastShot = {
  id: 'bb-arena-last-shot',
  name: 'Last Shot',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee receives a slingshot, ten standing targets and exactly twelve balls. Every ball may be fired only once and there are no refills. After all shots are used, the nominee who knocked down the most targets wins safety.',
  stats: { physical: 0.32, boldness: 0.26, temperament: 0.24, intuition: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.2, context, rng });
    const beats = [];
    beats.push(beat(
      `Twelve balls, ten targets, no restock. The arena has done the arithmetic out loud so nobody has to: you are allowed two mistakes tonight, and one of them is being here.`,
      participants.slice(0, 3), 'TWELVE BALLS'));
    const spender = [...entries].reverse()[0];
    beats.push(beat(
      `${spender.name} burns four shots on the same stubborn target and the rack starts looking very finite. The glass has gone quiet in that specific way.`,
      [spender.name], 'RUNNING DRY', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_lastShot);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_unravel = {
    leader: [
      (n, p) => `${n} reads the tangle before pulling anything — thirty seconds of looking that saves three minutes of fighting. The rope comes off the frame in long, obedient lengths.`,
      (n, p) => `${n} threads the last crossbar and the key swings free at the far end, close enough now to count its teeth.`,
      (n, p) => `${n} works the rope hand over hand without ever once yanking, which is the entire secret and apparently a personality trait.`,
    ],
    mid: [
      (n, p) => `${n} clears half the frame fast and then meets the knot the builders were proudest of. The pace survives. The mood does not.`,
      (n, p) => `${n} trades speed for care after a re-knot scare, and the rope grudgingly starts cooperating.`,
      (n, p) => `${n} is a crossbar behind with rope to spare — chasing, focused, narrating none of it.`,
    ],
  };

const unravel = {
  id: 'bb-arena-unravel',
  name: 'Unravel',
  category: 'endurance',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee must untangle fifty feet of rope, thread the whole length of it back out of a climbing frame and retrieve the key tied to its far end. Pulling the wrong strand is the danger — it re-knots what has already been cleared, and thirty seconds of work goes backwards in one movement. The first nominee to free their key and open their lock wins safety.',
  stats: { endurance: 0.32, temperament: 0.28, intuition: 0.22, physical: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `Fifty feet of rope each, knotted by somebody who was paid to be cruel. The fastest way through is patience, and patience is the one thing a nominee on vote night has the least of.`,
      participants.slice(0, 3), 'THE KNOTS'));
    const tangled = [...entries].reverse()[0];
    beats.push(beat(
      `${tangled.name} pulls the wrong strand and watches thirty seconds of work re-knot itself. The sound ${pronouns(tangled.name).sub} ${vb(pronouns(tangled.name), 'makes', 'make')} is not a word, quite.`,
      [tangled.name], 'RE-KNOTTED', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_unravel);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_blackout = {
    leader: [
      (n, p) => `${n} crosses the dark like the lights are only off for other people — the remembered line holding, step after step, obstacle after missed obstacle.`,
      (n, p) => `${n} counts steps under ${p.posAdj} breath and turns exactly where the course turns. Whatever ${p.sub} did with those thirty seconds of light, it is still working.`,
      (n, p) => `${n} slows at exactly the right moments, hands finding air where the pillars almost are. The night vision makes it look easy, which it is not.`,
    ],
    mid: [
      (n, p) => `${n} clips one obstacle, takes the penalty horn, and recalibrates mid-stride — the line is close to right, and close is costing five seconds at a time.`,
      (n, p) => `${n} freezes once, fully lost, then finds the wall with a fingertip and rebuilds the map from it. Moving again.`,
      (n, p) => `${n} is slower than the leader and cleaner than the clock suggests — the penalties are the whole gap.`,
    ],
  };

const blackout = {
  id: 'bb-arena-blackout',
  name: 'Blackout',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Nominees have thirty seconds to memorize an obstacle course. They then cross it in darkness and hit the finish buzzer. Every obstacle touched adds five seconds to their time; the fastest adjusted time wins safety.',
  stats: { intuition: 0.34, mental: 0.28, endurance: 0.2, boldness: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.4, context, rng });
    const beats = [];
    beats.push(beat(
      `Thirty seconds of light, then none. The arena becomes a memory of an arena, and three people cross it with their hands out in front of them while the house watches on night vision.`,
      participants.slice(0, 3), 'LIGHTS OUT'));
    const lost = [...entries].reverse()[0];
    beats.push(beat(
      `${lost.name} drifts two full steps off the remembered line and finds the foam pillar the hard way. The penalty horn, in the dark, sounds exactly like a verdict.`,
      [lost.name], 'OFF COURSE', 'red'));
    // Somebody always cheats toward a friend's voice — the house at the
    // glass is supposed to be silent, and never entirely is.
    const guided = entries[0];
    const friend = participants.find(n => n !== guided.name && bond(guided.name, n) >= 4) || null;
    if (friend) {
      beats.push(beat(
        `Somebody at the glass coughs — twice, pointedly — just as ${guided.name} drifts off line, and ${guided.name} corrects. The producers will review the tape. ${friend} will be studying the ceiling when they do.`,
        [guided.name, friend], 'THE COUGH', 'gold'));
      api.addBond(guided.name, friend, 0.5);
    }
    arenaPlayByPlay(entries, rng, beats, PLAY_blackout);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

// ── the second wave ───────────────────────────────────────────────────
//
// Six more, grounded in the real arena's register — speed-carries, live
// observation, puzzle-to-password hunts, pressure holds, dizzy balance,
// contraption builds — and written to the corrected house style: the desc
// is the RULES, stated plainly, ending on the win condition, because the
// HOW TO PLAY card and the transcript both print it verbatim.

const PLAY_downTheTube = {
    leader: [
      (n, p) => `${n} finds the beam's rhythm early — cross, drop, return — and the tube fills one honest ball at a time. The fill line is starting to look reachable.`,
      (n, p) => `${n} does not look at the other tubes once, which is either discipline or arrogance, and either way it is filling fastest.`,
      (n, p) => `${n} crosses the beam like it is a sidewalk. The bucket empties, the tube climbs, and the arena runs out of ways to make it interesting.`,
    ],
    mid: [
      (n, p) => `${n} loses one ball to a wobble and slows down exactly enough to lose no more. The tube is behind the leader's and gaining.`,
      (n, p) => `${n} matches the leader trip for trip but pauses at the beam's middle every time, and those pauses are the whole race.`,
      (n, p) => `${n} tries the leader's pace, wobbles hard, and settles for ${p.posAdj} own. Steady, second, stubborn.`,
    ],
  };

const downTheTube = {
  id: 'bb-arena-down-the-tube',
  name: 'Down the Tube',
  category: 'physical',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee must carry balls one at a time across a narrow beam and drop them into their tube. A dropped ball rolls away and is gone for good. The first nominee to fill their tube to the line wins safety.',
  stats: { physical: 0.3, endurance: 0.28, temperament: 0.24, boldness: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.2, context, rng });
    const beats = [];
    beats.push(beat(
      `Three beams, three tubes, one bucket of balls each — and the beam is exactly wide enough to make hurrying a bet. The fill lines look a lot higher from up there.`,
      participants.slice(0, 3), 'THE BEAM'));
    const spiller = [...entries].reverse()[0];
    beats.push(beat(
      `${spiller.name} tries to carry two at once and pays for it — both balls off the beam, gone, while the tube sits exactly as empty as before the shortcut.`,
      [spiller.name], 'THE SPILL', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_downTheTube);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_headCount = {
    leader: [
      (n, p) => `${n} answers before the question finishes — fourteen houseguests, three doors, two lies — and the podium keeps flashing green like it is enjoying itself.`,
      (n, p) => `${n} apparently watched that minute of chaos the way an accountant watches a ledger. Green, green, green.`,
      (n, p) => `${n} takes the one question everybody else missed — the count nobody thought to keep — and the scoreboard opens a gap.`,
    ],
    mid: [
      (n, p) => `${n} splits the difference on a count and gets lucky, then unlucky, then careful. Within reach, if the leader blinks.`,
      (n, p) => `${n} burns one lockout early and answers slower after it — right more often now, but the clock keeps its own score.`,
      (n, p) => `${n} closes to within a question and hovers over the buzzer, weighing speed against another ten seconds of silence.`,
    ],
  };

const headCount = {
  id: 'bb-arena-head-count',
  name: 'Head Count',
  category: 'mental',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee watches the same chaotic minute of house footage, then answers counting questions about it — how many houseguests, how many doors, how many lies of a named kind. A wrong answer locks their podium for ten seconds. The most correct answers when the clock ends wins safety.',
  stats: { intuition: 0.34, mental: 0.3, temperament: 0.2, social: 0.16 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `The screen plays one minute of the house at its loudest — a food fight, a comp, a hallway argument — and then goes dark. The questions start immediately, and they are all about what everybody was too entertained to count.`,
      participants.slice(0, 3), 'ONE MINUTE'));
    const locked = [...entries].reverse()[0];
    beats.push(beat(
      `${locked.name} guesses fast and wrong, and the podium goes cold for ten seconds. In here, ten seconds is a question and a half, and everybody can hear the other two answering.`,
      [locked.name], 'LOCKED OUT', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_headCount);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_theLongNumber = {
    leader: [
      (n, p) => `${n} finishes the puzzle first and reads the ten digits twice before moving — then finds the true number among the decoys on the second pass. The keypad is nine digits lit and holding.`,
      (n, p) => `${n} works the board in rows, eliminating decoys with a fingertip, and the real number surfaces like it wanted to be found.`,
      (n, p) => `${n} enters digit after digit without hurrying, because hurrying is how keypads get wiped, and ${n} has decided to be the one person here who knows that.`,
    ],
    mid: [
      (n, p) => `${n} has the puzzle done and the board half-eliminated — one decoy off the true number twice now, which the arena would call working as intended.`,
      (n, p) => `${n} loses the race to the puzzle but gains it back on the board, cross-checking digits the leader is trusting to memory.`,
      (n, p) => `${n} hovers over the keypad, seven digits sure and three digits brave. Entering it now is a coin flip dressed as confidence.`,
    ],
  };

const theLongNumber = {
  id: 'bb-arena-long-number',
  name: 'The Long Number',
  category: 'mental',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee must assemble a ten-piece puzzle that reveals a ten-digit number, find that exact number hidden among decoys on their board, and enter it on a keypad. A wrong entry clears the keypad completely. The first nominee to enter the true number wins safety.',
  stats: { mental: 0.36, endurance: 0.24, intuition: 0.22, temperament: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `Ten puzzle pieces, ten digits, and a board of decoy numbers that differ by exactly one digit each. The arena did not build this to be solved so much as to be survived.`,
      participants.slice(0, 3), 'TEN DIGITS'));
    const fumbler = [...entries].reverse()[0];
    beats.push(beat(
      `${fumbler.name} punches in a number that is right except where it is not. The keypad wipes itself with a cheerfulness nobody appreciates, and the whole ten digits start again.`,
      [fumbler.name], 'CLEARED', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_theLongNumber);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_whiteKnuckle = {
    leader: [
      (n, p) => `${n} holds through the third ramp-up without a visible tremor, eyes fixed on the middle distance where the pain apparently lives. The paddles push. ${n} declines.`,
      (n, p) => `${n} has gone somewhere else entirely — breathing in fours, shoulders level, outlasting the horn on schedule.`,
      (n, p) => `${n} adjusts grip a centimeter at a time between horns, banking comfort like a miser. Steadiest hold in the arena.`,
    ],
    mid: [
      (n, p) => `${n} shakes, steadies, and shakes again — losing the war in installments and refusing to lose it all at once.`,
      (n, p) => `${n} matches the leader horn for horn with a face that has stopped pretending. Still holding. Loudly.`,
      (n, p) => `${n} finds a second wind from somewhere around the fourth ramp-up, which the glass rewards with the night's first real cheer.`,
    ],
  };

const whiteKnuckle = {
  id: 'bb-arena-white-knuckle',
  name: 'White Knuckle',
  category: 'endurance',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee presses two paddles together at arm height and holds. The paddles push back harder every thirty seconds, and letting either one slip ends the run. The last nominee still holding wins safety.',
  stats: { endurance: 0.38, physical: 0.26, temperament: 0.24, boldness: 0.12 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.6, context, rng });
    const beats = [];
    beats.push(beat(
      `No puzzle, no trick, no shortcut — two paddles, a ramp-up horn every thirty seconds, and three people discovering in public exactly how much they want to stay. This one is just about who breaks.`,
      participants.slice(0, 3), 'HOLD'));
    const shaking = [...entries].reverse()[0];
    beats.push(beat(
      `${shaking.name}'s arms start the small shake everybody recognises from the glass. The next horn is in eight seconds, and all three of them are counting it.`,
      [shaking.name], 'THE SHAKE', 'grey'));
    arenaPlayByPlay(entries, rng, beats, PLAY_whiteKnuckle);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_spinCycle = {
    leader: [
      (n, p) => `${n} comes off the spins, plants a foot, waits one full second for the world to stop moving — and then walks the beam like it apologized. Third block stacked.`,
      (n, p) => `${n} has worked out the trick nobody says out loud: spin slow, walk fast. The stack grows while the other podiums wobble.`,
      (n, p) => `${n} places the fourth block with two hands and total contempt for gravity. One trip left.`,
    ],
    mid: [
      (n, p) => `${n} falls once, laughs once, and crosses clean the next two trips — behind on blocks, ahead on morale.`,
      (n, p) => `${n} takes the beam at a shuffle that costs seconds and saves restarts. The maths might even be right.`,
      (n, p) => `${n} stacks a third block on the second attempt and points at it, in case anybody at the glass missed the achievement.`,
    ],
  };

const spinCycle = {
  id: 'bb-arena-spin-cycle',
  name: 'Spin Cycle',
  category: 'physical',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee spins ten times around a bat, walks a balance beam, and stacks one block at the far end — then goes back and does it again. Falling off the beam sends the run back to the bat. The first nominee to stack five blocks wins safety.',
  stats: { physical: 0.3, temperament: 0.28, boldness: 0.24, endurance: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.6, context, rng });
    const beats = [];
    beats.push(beat(
      `Ten spins, one beam, five blocks. The arena floor is padded, which everybody understands as a promise about how the evening is going to go.`,
      participants.slice(0, 3), 'THE SPINS'));
    const dizzy = [...entries].reverse()[0];
    beats.push(beat(
      `${dizzy.name} comes off the bat aimed confidently at a beam that is no longer where ${pronouns(dizzy.name).sub} left it. The floor accepts the donation.`,
      [dizzy.name], 'DOWN', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_spinCycle);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const PLAY_chainReaction = {
    leader: [
      (n, p) => `${n} tests after every third piece, and every test rolls a foot further than the last. The buzzer is two ramps from being somebody's problem.`,
      (n, p) => `${n} rebuilds one sagging joint before it fails instead of after, which is the entire difference between this podium and the other two.`,
      (n, p) => `${n}'s ball makes the full run in a test and dies one inch from the buzzer. The fix is one shim. Everybody watching knows it.`,
    ],
    mid: [
      (n, p) => `${n} builds fast and tests late, and the first full run finds every flaw at once. The rebuild is smarter. The clock noticed.`,
      (n, p) => `${n} steals a design idea off the leader's track with a long sideways look, and ${p.posAdj} next test rolls three feet further.`,
      (n, p) => `${n} is one ramp short with pieces that refuse to be a ramp. The crate gets a second, more honest search.`,
    ],
  };

const chainReaction = {
  id: 'bb-arena-chain-reaction',
  name: 'Chain Reaction',
  category: 'mental',
  types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee builds a ball track from a crate of mismatched ramps and rails, from their start post to their buzzer. Test runs are unlimited, but the ball must roll the whole way unaided. The first nominee whose ball reaches the buzzer on its own wins safety.',
  stats: { mental: 0.32, strategic: 0.26, temperament: 0.24, intuition: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.2, context, rng });
    const beats = [];
    beats.push(beat(
      `A crate of ramps that almost fit together and a buzzer eleven feet away. The fastest builds lose to the ones that get tested, which is a sentence somebody in this arena needs to hear.`,
      participants.slice(0, 3), 'THE CRATE'));
    const rebuilder = [...entries].reverse()[0];
    beats.push(beat(
      `${rebuilder.name}'s ball makes it nine of the eleven feet and steps off the track like it had somewhere better to be. The rebuild starts from the middle, again.`,
      [rebuilder.name], 'NINE FEET', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_chainReaction);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

export const ARENA_COMPETITIONS = [
  flashWall, houseOfCards, vertigo, lockout, lastShot, unravel, blackout,
  downTheTube, headCount, theLongNumber, whiteKnuckle, spinCycle, chainReaction,
];

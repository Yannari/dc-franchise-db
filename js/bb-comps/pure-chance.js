// ══════════════════════════════════════════════════════════════════════
// bb-comps/pure-chance.js — Pure Chance
// ══════════════════════════════════════════════════════════════════════
//
// One ball each, one mark, and a board of pegs nobody can see into. There is
// nothing to be good at here and that is the point of it: every so often the
// power in this house lands on whoever it lands on, and a season where that
// never happens is a season the smartest player simply wins.
//
// WHAT IS NOT CHANGING, AND WHY. This competition has NO stat profile, cannot
// be thrown, and charges nothing for a week of slop. That is not an oversight
// to be tidied up — it is a correction somebody already made. It used to carry
// intuition, boldness and temperament under a comment calling them "almost
// inert", and they were not inert: a well-suited houseguest genuinely won this
// more often while the screen printed weight bars underneath a description
// promising nobody could be better at it. Both could not be true. Anything
// added here that lets a houseguest influence a ball puts that bug back, so
// there is no aptitude, no re-drop, no nerve check and no decision of any kind.
// `pureChance: true` is read by the have-not contract in house-twists.test.js.
//
// WHAT WAS ACTUALLY WRONG. The competition rolled every houseguest's ball in a
// single loop, sorted the results and reported them. Everybody dropped at once,
// in silence, and the only thing the house saw was a finished table — so the
// one competition in the library whose entire content is suspense had none in
// it. A crapshoot has no skill to narrate, which means the STRUCTURE is all it
// has, and it was throwing the structure away.
//
// So it is dropped one at a time now, in a drawn order, against a number that
// is already on the board. Whoever has the lead has it in front of everybody
// and can only stand there while the rest of the house tries to beat it, and
// the last houseguest to the mark knows exactly what they need. None of that
// changes anybody's odds by a single percentage point. It is the same ball and
// the same board; it is just no longer a spreadsheet.
//
// THE BOARD IS NOT SYMMETRICAL, which everybody notices and nobody can use. It
// mostly stops the night ending in a three-way tie on the same number — the
// symmetrical version tied constantly — and the two big slots are still worth
// the same as each other, so there is nothing to aim at even if aiming were
// possible.
//
// NOTE ON `breakdown`: one key per player — the Debug tab renders keys as rows.
// ══════════════════════════════════════════════════════════════════════

import { pronouns } from '../players.js';
import { toResult, beat, makePicker, vb } from './_shared.js';
import { threat } from '../bb-events/_read.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };

/**
 * The board. Eight rows of pegs, nine slots, and a ball that goes left or right
 * at every peg with no opinion about it.
 *
 * The distribution is therefore binomial and the middle is where most balls
 * end up, which is why the middle is worth the least — the same bargain every
 * board of this kind has ever offered. The outside slots come up about once in
 * every two hundred and fifty drops each, so a season sees one if it is lucky,
 * and that is the whole appeal of them.
 */
const ROWS = 8;
const SLOT_VALUES = [500, 210, 95, 45, 20, 40, 90, 200, 520];
const SLOT_NAMES = ['FAR LEFT', 'LEFT', 'INNER LEFT', 'LEFT OF CENTRE', 'CENTRE',
  'RIGHT OF CENTRE', 'INNER RIGHT', 'RIGHT', 'FAR RIGHT'];
const BIG = 400;              // what counts as one of the two big slots

/** Drop a ball. Eight coin flips and wherever they leave it. */
function drop(rng) {
  const path = [];
  let slot = 0;
  for (let i = 0; i < ROWS; i++) {
    const right = rng() < 0.5;
    path.push(right ? 'R' : 'L');
    if (right) slot++;
  }
  return { slot, path, value: SLOT_VALUES[slot] };
}

// ── narration ─────────────────────────────────────────────────────────

const OPEN_LINES = [
  'Nine slots, eight rows of pegs and one ball each. Nobody is going to be good at this. That is not a criticism of anybody out here — it is the competition, and every house needs one week a season where the power lands on whoever it lands on.',
  'The board goes up and the house goes quiet, because there is nothing to work out. They will drop in the order they are drawn, the board will do whatever the board does, and somebody will be Head of Household because of it.',
  'It is the one night nobody can prepare for. Same ball, same mark, same board, no technique — and the whole house standing behind a line watching a piece of plastic bounce.',
  'Somebody asks whether the release matters. It does not. Somebody asks it again ten minutes later.',
];

const ORDER_LINES = [
  names => `The order comes out of a bag: ${names}. Going last is not an advantage and everybody says so, and everybody drawn last is quietly pleased anyway.`,
  names => `Drop order: ${names}. It changes nothing about anybody's chances and it changes the entire experience of the next twenty minutes.`,
  names => `They draw for order — ${names} — and the first name up gets the worst job in the competition, which is setting a number with nothing to aim at.`,
];

const FIRST_DROP = [
  (n, p, v) => `${n} goes first with nothing on the board to beat and no idea what a good score even looks like. The ball takes the pegs, drifts, and settles for ${v}.`,
  (n, p, v) => `${n} has the unenviable job of going first. ${p.PosAdj} ball comes down the middle of the board, jumps once near the bottom, and stops on ${v}.`,
];

const TAKES_LEAD = [
  (n, p, v, old) => `${n} beats it — ${v}, past ${old}, and ${p.sub} ${vb(p, 'is', 'are')} suddenly the person everybody else has to get past.`,
  (n, p, v, old) => `The ball breaks right at the fourth row and keeps going. ${v} for ${n}. ${old} is not the number any more.`,
  (n, p, v) => `${n} takes the lead with ${v} and immediately looks like somebody who does not want to be looked at.`,
  (n, p, v, old) => `${v}. That is ${n} in front, and the ${old} that looked safe two minutes ago is now just a number somebody used to have.`,
];

const FALLS_SHORT = [
  (n, p, v, lead) => `${v} for ${n}, which is not ${lead}, and there is nothing to say about it because there is nothing anybody could have done differently.`,
  (n, p, v) => `${n} watches the ball the whole way down and it finishes on ${v}. ${p.Sub} ${vb(p, 'nods', 'nod')} once, at nobody.`,
  (n, p, v, lead) => `The ball goes where the board sends it. ${v}, well short of ${lead}, and ${n} is out of it before ${p.sub} ${vb(p, 'has', 'have')} let go of the rail.`,
  (n, p, v) => `${n} gets ${v}. The house makes the noise a house makes when it is glad and trying not to be.`,
];

const NEAR_MISS = [
  (n, p, v) => `${n}'s ball is one peg from the outside slot with two rows to go — the whole yard sees it — and the last bounce takes it back inside for ${v}.`,
  (n, p, v) => `It rides the edge of the board almost the whole way down and drops in at ${v} instead. ${n} puts both hands on ${p.posAdj} head.`,
  (n, p, v) => `Two rows from the bottom ${n} is looking at the biggest slot on the board. Then a peg. Then ${v}.`,
];

const BIG_HIT = [
  (n, p, v) => `The ball goes hard left at the second row and never comes back — all the way out to ${v}, the slot nobody hits, and the yard absolutely loses it.`,
  (n, p, v) => `${n} hits ${v}. Somebody screams. It is the biggest number this board has, it comes up about once in a season, and it has just come up.`,
];

const LAST_UP = [
  (n, p, need) => `Which leaves ${n}, who needs better than ${need} and knows it, and who has no way whatsoever of doing anything about it.`,
  (n, p, need) => `${n} is last to the mark. ${need} to beat, one ball, and the least useful thing in the world to be told at this point is "good luck".`,
];

const TIE_LINES = [
  (a, b, v) => `${a} and ${b} are tied on ${v} — the same slot, on a nine-slot board — so they drop again, alone, in front of everybody.`,
  (a, b, v) => `Both of them on ${v}. There is no countback on a board like this, so it goes to a drop-off between ${a} and ${b}.`,
];

const WIN_NOMINEE = [
  (n, p, v) => `It lands on ${n}, who was on the block an hour ago and is now holding the only thing in this house that matters. ${v} on a board nobody can steer, and the plan for the week dies in real time, on camera, in front of the person whose plan it was.`,
  (n, p, v) => `${n} was going home on Thursday. ${n} has just won Head of Household with ${v} and a piece of plastic. Somebody in that yard is going to have to go and be pleased about it.`,
];

const WIN_STRONG = [
  (n, p, v) => `Of course it is ${n}. The one person the house did not need to have any more power lands ${v} in the one competition nobody could stop ${p.obj} winning.`,
  (n, p, v) => `${v} to ${n} — the houseguest with the most already — off a board that does not know who anybody is and would not care.`,
];

const WIN_PLAIN = [
  (n, p, v) => `${v} stands. ${n} wins Head of Household, and the house spends the rest of the evening pretending to be pleased about it.`,
  (n, p, v) => `Nobody beats ${v}. ${n} takes it, having done exactly what everybody else did.`,
  (n, p, v) => `That is the competition: ${n} on ${v}, by nothing at all.`,
];

export const pureChance = {
  id: 'bb-luck-draw',
  name: 'Pure Chance',
  category: 'luck',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Every houseguest releases an identical ball from the same mark into a concealed board of pegs, one at a time, in an order drawn from a bag. Eight rows of pegs send it left or right with nobody able to steer it, and the slot it drops into is their score — the middle of the board is where most balls end up and is worth the least, and the two slots on the outside are worth the most and are almost never hit. Every houseguest after the first drops against a number already standing, and the last one to the mark knows exactly what they need and can do nothing whatever about it. Highest score takes the power, a tie is settled by a drop-off, and the house has to live with whoever that turns out to be.',
  // No `stats`, on purpose — see the header. The dispatcher permits it because
  // simulate() is written, the board draws no weight bars when there are none,
  // and the Debug tab reports an aptitude of zero for everybody, which is the
  // true reading of this competition rather than a formula that flatters it.
  pureChance: true,
  weight(ctx) {
    // Rarer than the skill competitions — a house where power is random every
    // week has no strategy in it at all.
    return ctx.type === 'hoh' ? 0.45 : 0.6;
  },

  simulate(participants, context, api, rng) {
    const beats = [];
    const steps = [];
    const breakdown = {};
    const leadSay = makePicker(rng);
    const shortSay = makePicker(rng);
    const missSay = makePicker(rng);

    // The order is drawn, and it is the only thing about this competition that
    // anybody will remember deciding. It confers nothing.
    const order = [...participants];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    beats.push(beat(OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'PURE CHANCE'));
    steps.push({ kind: 'open', order: [...order], board: [...SLOT_VALUES] });

    const say = (text, who, badgeText, badgeClass, step) => {
      beats.push(beat(text, who, badgeText, badgeClass));
      steps.push({ ...step, order: [...order] });
    };

    say(ORDER_LINES[Math.floor(rng() * ORDER_LINES.length)](order.join(', ')),
      order.slice(0, 4), 'THE DRAW', 'challenge',
      { kind: 'order' });

    const results = {};
    let lead = null;

    order.forEach((name, i) => {
      const p = pron(name);
      const ball = drop(rng);
      results[name] = ball;
      const last = i === order.length - 1;

      // Somebody dropping last against a standing number is the one moment
      // this competition has, so it is announced before the ball goes.
      if (last && lead && order.length > 2) {
        say(LAST_UP[Math.floor(rng() * LAST_UP.length)](name, p, lead.value),
          [name], 'LAST TO THE MARK', 'challenge',
          { kind: 'last-up', who: name, need: lead.value });
      }

      const beatsLead = !lead || ball.value > lead.value;
      // How close the ball came to the outside on its way down, which is the
      // only near-miss a board like this can produce.
      const flirted = !BIG_SLOT(ball.slot) && (ball.slot <= 1 || ball.slot >= SLOT_VALUES.length - 2);

      let text;
      let badge = `${ball.value}`;
      let cls = 'challenge';
      if (BIG_SLOT(ball.slot)) {
        text = BIG_HIT[Math.floor(rng() * BIG_HIT.length)](name, p, ball.value);
        badge = `${ball.value} — THE BIG SLOT`;
        cls = 'gold';
      } else if (flirted && rng() < 0.7) {
        text = missSay(NEAR_MISS)(name, p, ball.value);
        badge = `${ball.value} — NEARLY`;
        cls = 'grey';
      } else if (i === 0) {
        text = FIRST_DROP[Math.floor(rng() * FIRST_DROP.length)](name, p, ball.value);
        badge = `${ball.value} ON THE BOARD`;
      } else if (beatsLead) {
        text = leadSay(TAKES_LEAD)(name, p, ball.value, lead ? lead.value : 0);
        badge = `${ball.value} — TAKES THE LEAD`;
        cls = 'green';
      } else {
        text = shortSay(FALLS_SHORT)(name, p, ball.value, lead.value);
      }

      if (beatsLead) lead = { name, value: ball.value };
      say(text, [name], badge, cls, {
        kind: 'drop', who: name, slot: ball.slot, value: ball.value,
        path: ball.path.join(''), took: beatsLead, leader: lead.name, leadValue: lead.value,
      });
    });

    // ── the drop-off ──
    //
    // Nine slots and a whole house means two balls in the same slot is common,
    // and there is no countback on a board like this.
    let tied = participants.filter(n => results[n].value === lead.value);
    let rounds = 0;
    while (tied.length > 1 && rounds < 6) {
      rounds++;
      say(TIE_LINES[Math.floor(rng() * TIE_LINES.length)](tied[0], tied[1], lead.value),
        [...tied].slice(0, 4), 'DROP-OFF', 'gold',
        { kind: 'tie', who: [...tied], at: lead.value, round: rounds });
      const again = {};
      for (const name of tied) {
        const ball = drop(rng);
        again[name] = ball;
        // The drop-off does not change anybody's recorded score — it only
        // decides who the tie goes to, which is what a tiebreak is.
        say(`${name} drops again and gets ${ball.value}.`, [name], `${ball.value}`, 'challenge',
          { kind: 'tie-drop', who: name, slot: ball.slot, value: ball.value, path: ball.path.join(''), round: rounds });
      }
      const best = Math.max(...tied.map(n => again[n].value));
      const survivors = tied.filter(n => again[n].value === best);
      breakdown._dropOff = breakdown._dropOff || [];
      tied = survivors;
      if (tied.length === 1) lead = { name: tied[0], value: lead.value };
    }
    const winnerName = tied[0] || lead.name;

    // ── who it landed on ──
    const wp = pron(winnerName);
    const scores = participants.map(n => results[n].value);
    const lowest = Math.min(...scores);
    const nominated = (context.nominees || []).includes(winnerName);
    let strong = false;
    try {
      const worst = participants.reduce((a, b) => (results[a].value <= results[b].value ? a : b));
      strong = threat(winnerName) >= threat(worst) * 1.4;
    } catch { strong = false; }

    const pool = nominated ? WIN_NOMINEE : strong ? WIN_STRONG : WIN_PLAIN;
    say(pool[Math.floor(rng() * pool.length)](winnerName, wp, results[winnerName].value),
      [winnerName],
      nominated ? 'THE BLOCK SAVES ITSELF' : strong ? 'THE WRONG WINNER' : (context.type === 'veto' ? 'VETO' : 'HOH'),
      nominated ? 'gold' : strong ? 'red' : 'gold',
      { kind: 'win', who: winnerName, value: results[winnerName].value, nominated, strong });

    api.popDelta(winnerName, nominated ? 3 : strong ? 1 : 2);
    api.record(winnerName, 'luck-win',
      { nominated, strong, slot: results[winnerName].slot, value: results[winnerName].value });

    // Losing to nothing at all is its own small grievance, and it is the only
    // thing this competition leaves behind. Nobody did anything to anybody
    // here, so nothing else should follow from it — no bonds move on a night
    // decided by a board.
    const unlucky = participants.filter(n => results[n].value === lowest && n !== winnerName);
    if (unlucky.length) {
      const one = unlucky[Math.floor(rng() * unlucky.length)];
      say(`${one} does everything identically to everyone else and finishes last on ${lowest}, which is the only outcome this competition can produce for somebody.`,
        [one], 'NOTHING TO BLAME', 'grey',
        { kind: 'unlucky', who: one, value: lowest });
    }

    const entries = participants.map(name => ({
      name,
      // The recorded score is the ball. A drop-off decides a tie and does not
      // rewrite what anybody scored, so the winner is nudged above their equals
      // by a hair rather than being handed points they did not land.
      score: results[name].value + (name === winnerName ? 0.5 : 0),
      threw: false,
    })).sort((a, b) => b.score - a.score);

    participants.forEach(name => {
      breakdown[name] = {
        slot: results[name].slot,
        slotName: SLOT_NAMES[results[name].slot],
        path: results[name].path.join(''),
        dropOrder: order.indexOf(name) + 1,
        // The Debug tab's two levers, answered honestly: no aptitude in this
        // competition at all, and the ball IS the result.
        base: 0, roll: results[name].value,
        // Read by the have-not contract: slop cannot make a ball land worse.
        haveNot: (context.haveNots || []).includes(name), haveNotPenalty: 0,
        threw: false, threwChance: 0,
        score: results[name].value,
      };
    });
    delete breakdown._dropOff;

    return toResult(entries, {
      beats, breakdown, variant: 'crapshoot',
      detail: {
        steps, board: [...SLOT_VALUES], rows: ROWS, order: [...order],
        dropOffs: rounds,
        finished: rounds ? 'drop-off' : 'outright',
      },
      text: `${winnerName} wins Pure Chance on ${results[winnerName].value}, a competition with nothing in it to be good at.`,
    });
  },
};

/** The two slots on the outside, which are worth the most and never come up. */
function BIG_SLOT(slot) {
  return SLOT_VALUES[slot] >= BIG;
}

export const theDraw = pureChance;
export default pureChance;

// ══════════════════════════════════════════════════════════════════════
// bb-comps/morph-o-matic.js — Morph 'O' Matic
// ══════════════════════════════════════════════════════════════════════
//
// A recurring Power of Veto and Head of Household competition since Big Brother
// 5 — ten seasons, also aired as Two Faced, Blast Off, It's Alive and BB
// Freakshow. The rules are short:
//
//   A picture goes up with two houseguests morphed into one face. Work out who
//   is in it, register the answer, hit the button. Wrong, and you stay on that
//   picture until you get it right. Right, and the next face appears. Fastest
//   total time through every picture wins.
//
// It replaces a one-roll "spot the changed detail" comp that had no structure
// in it at all. This one is built out of the season's OWN cast: every face is a
// real pair, and the pool is drawn from everybody who has been in the house,
// which means the wall is full of people who are not in it any more. A
// houseguest freezing in front of a friend they voted out is not decoration —
// it is time on the clock, and it costs them the competition.
//
// NOTE ON `breakdown`: the Debug tab renders one row per key, so every key must
// be a player name. Per-morph structure lives inside each player's own record.
// ══════════════════════════════════════════════════════════════════════

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };
const bondTo = (a, b) => { try { return getBond(a, b) || 0; } catch { return 0; } };
const round1 = v => Math.round(v * 10) / 10;

// Written as functions of the board size — a fixed "twelve pictures" line
// contradicted a six-face board every time it came up.
const OPEN_LINES = [
  () => 'The screen lights up with a face that is two people and belongs to neither of them, which is somehow worse than either.',
  n => `${n} pictures, each one a person who does not exist, assembled out of two who do.`,
  () => 'The rule is the cruel one: you stay on the picture until you get it right, and the clock does not care how long that takes.',
  () => 'Nobody mentions that half the faces on the board left this house weeks ago. Everybody notices.',
  n => `${n} faces, none of them real, all of them familiar. The first button press is nearly a minute away.`,
];

const CLEAN_LINES = [
  (n, p, pair) => `${n} looks at it once, says both names, and moves on before the rest of the yard has focused.`,
  (n, p, pair) => `${n} has ${pair[0]} inside two seconds and ${pair[1]} a breath later.`,
  (n, p) => `${n} does not appear to be reading the face so much as remembering it.`,
  (n, p, pair) => `${n} calls ${pair[1]} off the jaw alone and is right.`,
];

const FLUB_LINES = [
  (n, p, pair, wrong) => `${n} registers ${wrong}, hits the button, and gets the noise nobody wants. Twice more before ${p.sub} ${vb(p, 'lands', 'land')} on ${pair[1]}.`,
  (n, p, pair, wrong) => `${n} is certain it is ${wrong}. It is not ${wrong}. ${p.Sub} ${vb(p, 'stands', 'stand')} there arguing with a photograph.`,
  (n, p, pair, wrong) => `${n} keeps putting ${wrong} in because ${wrong} is who ${p.sub} ${vb(p, 'has', 'have')} been thinking about all week, which is exactly how this competition gets you.`,
  (n, p) => `${n} cycles the whole board twice and comes back to the two ${p.sub} started with.`,
];

const GHOST_LINES = [
  (n, p, who) => `${who}'s face comes up half-merged into somebody else's and ${n} stops moving entirely. ${p.Sub} ${vb(p, 'loses', 'lose')} real time to it and does not pretend otherwise afterwards.`,
  (n, p, who) => `${n} gets to the picture with ${who} in it and just looks at it. The clock keeps going. ${p.Sub} ${vb(p, 'lets', 'let')} it.`,
  (n, p, who) => `Nobody expects ${who} to turn up on the board tonight. ${n} least of all, and it costs ${p.obj} the better part of a minute.`,
];

export const morphOMatic = {
  id: 'bb-mental-memory',
  name: "Morph 'O' Matic",
  category: 'memory',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Each picture on the screen is two houseguests morphed into a single face. A player must work out both names and register them before the next face appears — and a wrong answer means staying on that picture until it is right. The fastest total time through the whole board wins.',
  stats: { mental: 0.38, intuition: 0.26, temperament: 0.20, social: 0.16 },
  weight: () => 1.15,
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const clean = makePicker(rng);
    const flub = makePicker(rng);
    const ghost = makePicker(rng);
    const threwSay = makePicker(rng);

    // The board is built from everybody who has been in this house, not only
    // the people playing — which is what puts the evicted on the wall.
    const everybody = [...new Set([
      ...(context.week?.houseAtStart || []),
      ...(context.house || []),
      ...participants,
      ...(gs.eliminated || []),
    ])].filter(Boolean);
    const pool = everybody.length >= 2 ? everybody : [...participants];
    const gone = new Set((gs.eliminated || []).filter(n => pool.includes(n)));

    // Enough faces that a single lucky picture cannot decide it, few enough
    // that per-face luck does not average itself flat. At nine faces the field
    // finished within a second of each other every time — the noise cancelled
    // and the competition stopped separating anybody.
    const boardSize = clamp(Math.round(pool.length * 0.5), 4, 7);
    const board = [];
    for (let i = 0; i < boardSize; i++) {
      const bag = [...pool];
      const a = bag.splice(Math.floor(rng() * bag.length), 1)[0];
      const b = bag.splice(Math.floor(rng() * bag.length), 1)[0];
      if (a && b) board.push([a, b]);
    }
    if (!board.length) board.push([pool[0], pool[1] || pool[0]]);

    beats.push(beat(
      OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)](board.length),
      participants.slice(0, 3), `${board.length} FACES`));

    const runs = participants.map(name => {
      const s = pStats(name);
      const t = throwRead(name, context, rng);
      const skill = (s.mental * 0.38 + s.intuition * 0.26 + s.temperament * 0.20 + s.social * 0.16) / 10;
      const haveNot = (context.haveNots || []).includes(name);

      let time = 0, wrongTotal = 0, ghostOn = null, worst = null, hnCost = 0, luck = 0;
      const morphs = board.map(pair => {
        // Base read: skill shortens it hard, nerves and slop lengthen it. The
        // skill term has to dominate the noise or six faces of luck cancel out
        // into a dead heat.
        const noise = (rng() - 0.5) * 7;
        luck -= noise;                       // less time is better luck
        let secs = clamp(4.5 + (1 - skill) * 24 + noise, 2, 42);
        if (haveNot) { const hn = 1.4 + rng() * 1.8; secs += hn; hnCost += hn; }
        if (t.threw) secs += 6 + rng() * 9;

        // Wrong registrations. Every one is another lap of the board, and they
        // are skill-driven, so they widen the field rather than blur it.
        let wrong = 0;
        const missChance = clamp(0.58 - skill * 0.48 + (t.threw ? 0.3 : 0), 0.03, 0.76);
        while (rng() < missChance && wrong < 4) { wrong++; secs += 4.5 + rng() * 6; }

        // Somebody you sent home, looking back at you out of half a face.
        let haunted = false;
        const ghostName = pair.find(n => gone.has(n) && bondTo(name, n) >= 2);
        if (ghostName && !ghostOn && rng() < 0.5) {
          haunted = true; ghostOn = ghostName;
          secs += 9 + rng() * 14;
        }

        wrongTotal += wrong;
        time += secs;
        const entry = { pair: [...pair], wrong, secs: round1(secs), haunted };
        if (!worst || secs > worst.secs) worst = entry;
        return entry;
      });

      return { name, time: round1(time), wrongTotal, morphs, ghostOn, worst, luck: round1(luck),
        base: round1(aptitude(name, morphOMatic.stats)),
        threw: t.threw, threwChance: t.chance, haveNot, haveNotPenalty: round1(hnCost) };
    });

    // Fastest board wins.
    runs.sort((x, y) => x.time - y.time);

    // Narrated worst card first, building to the winner.
    //
    // `runs` stays sorted best-first because the placements are read off it,
    // but revealing in that order hands the viewer the winning score in the
    // first card and leaves the rest of the competition as a countdown to
    // nothing. The generic board already counts up from last place for exactly
    // this reason.
    [...runs].reverse().forEach(r => {
      const p = pron(r.name);
      if (r.threw) {
        beats.push(beat(threwSay(THROW_LINES)(r.name), [r.name], 'THREW IT', 'grey'));
      } else if (r.ghostOn) {
        beats.push(beat(ghost(GHOST_LINES)(r.name, p, r.ghostOn), [r.name, r.ghostOn], 'STOPPED DEAD', 'grey'));
      } else if (r.wrongTotal >= 3) {
        const stuck = r.worst || r.morphs[0];
        // The name they kept registering by mistake — somebody who is neither
        // in the picture nor the person standing at the button, because "A
        // registers A and gets it wrong" reads as a bug rather than a blunder.
        const wrongName = pool.find(n => n !== r.name && !stuck.pair.includes(n))
          || pool.find(n => n !== r.name) || stuck.pair[0];
        beats.push(beat(flub(FLUB_LINES)(r.name, p, stuck.pair, wrongName), [r.name], `${r.wrongTotal} WRONG`, 'grey'));
      } else {
        const best = r.morphs.reduce((a, b) => (b.secs < a.secs ? b : a), r.morphs[0]);
        beats.push(beat(clean(CLEAN_LINES)(r.name, p, best.pair), [r.name], `${r.time}s`));
      }
    // The Debug tab reports the levers behind every score — aptitude and the
    // luck that moved it. This competition spreads its randomness across many
    // small rolls rather than one, so `roll` is the accumulated deviation,
    // signed so that positive always means luck helped.
      breakdown[r.name] = {
        base: r.base, roll: r.luck,
        time: r.time, wrong: r.wrongTotal, faces: r.morphs.length, hauntedBy: r.ghostOn,
        morphs: r.morphs, threw: r.threw, threwChance: r.threwChance,
        // Reported, not merely applied: the have-not twist is verified by
        // reading this field back off the competition.
        haveNot: r.haveNot, haveNotPenalty: r.haveNotPenalty,
        score: round1(400 - r.time),
      };
    });

    const winner = runs[0];
    const second = runs[1];
    if (second) {
      beats.push(beat(
        `${winner.name} clears the board in ${winner.time} seconds. ${second.name} is next at ${second.time}, which is ${round1(second.time - winner.time)} seconds of standing in front of the wrong face.`,
        [winner.name, second.name], 'THE MARGIN', 'gold'));
    }
    const wp = pron(winner.name);
    beats.push(beat(
      `Every face on that board was somebody ${wp.sub} ${vb(wp, 'has', 'have')} lived with, and ${winner.name} named all of them faster than anybody else could.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'morph-win', { time: winner.time, wrong: winner.wrongTotal });

    // Freezing in front of somebody you evicted is a thing the house watches
    // you do, and it says something about you that the house files away.
    runs.filter(r => r.ghostOn).forEach(r => api.popDelta(r.name, 1));

    const entries = runs.map(r => ({ name: r.name, score: round1(400 - r.time), threw: r.threw }));

    return toResult(entries, {
      beats, breakdown, variant: 'memory',
      text: `${winner.name} clears the Morph 'O' Matic board in ${winner.time} seconds.`,
    });
  },
};

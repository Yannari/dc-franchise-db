// ══════════════════════════════════════════════════════════════════════
// bb-comps/classics.js — nine recurring competitions off the wiki's list
// ══════════════════════════════════════════════════════════════════════
//
// Chosen to fill holes rather than to be nine more competitions. The library
// before these ran four endurance comps and four "mental" ones against a
// single physical, a single precision, a single puzzle, a single luck and a
// single quiz — so a season of thirty competitions kept drawing from the same
// two shelves, and the houseguests built for the other seven stats never got a
// night that suited them. These are two physical, two precision, two puzzle,
// two luck and one quiz.
//
// All nine are recurring Big Brother competitions, taken from the wiki's own
// recurring HOH and recurring Veto categories.
//
// Each one is a MECHANIC, not a stat roll with a name on it. What separates
// them is the decision inside them:
//
//   · Rollerball and Stay or Fold are push-your-luck — the score is not what
//     you earned, it is what you were willing to stop at. Boldness is the stat
//     that actually plays.
//   · Ready, Set, Woah punishes the thing every other physical competition
//     rewards: going early. Temperament beats speed.
//   · Tower of Hanoi and Knight Moves punish a wrong move made confidently,
//     which is a different failure from being slow.
//   · Tumblin' Dice is a crapshoot and is meant to be. A house needs a night
//     where the best player loses to a bad bounce, or the season has no upsets
//     in it at all.
//
// NOTE ON `breakdown`: one key per player only — the Debug tab renders keys as
// houseguests, so a stray key becomes a phantom in the panel. Per-round detail
// lives inside each player's own record.
// ══════════════════════════════════════════════════════════════════════

import { pStats, pronouns } from '../players.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb, margin } from './_shared.js';
import { bond } from '../bb-events/_read.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };
const round2 = v => Math.round(v * 100) / 100;

/**
 * The scaffolding every competition here shares.
 *
 * Not a scoring model — each competition writes its own. This is only the
 * bookkeeping that the dispatcher, the Debug tab and the have-not twist all
 * require of every competition, gathered in one place so nine of them cannot
 * drift apart on it.
 */
function prepare(participants, context, self, rng) {
  return participants.map(name => {
    const t = throwRead(name, context, rng);
    return {
      name,
      p: pron(name),
      stats: pStats(name),
      // The declared profile, read rather than restated — a competition tuned
      // in `stats` and simulated off a second hard-coded copy is a competition
      // whose screen describes something it is not.
      skill: aptitude(name, self.stats) / 10,
      base: round2(aptitude(name, self.stats)),
      threw: t.threw, threwChance: t.chance,
      haveNot: (context.haveNots || []).includes(name),
      // The night they are having, rolled once.
      //
      // A competition of six shots or five trips adds per-attempt noise that
      // averages out across the run, leaving the stat ladder to decide it —
      // measured on the slingshot, four houseguests won 40 runs between them
      // and the best took 68%. A single roll applied to the whole run does not
      // average out. It is also the truer model: form is a night, not a shot.
      form: (rng() - 0.5) * 0.26,
      luck: 0,
    };
  });
}

/** Close the books: sort, narrate the throwers, and hand back a result. */
function finish(runs, { beats, self, sortBy, scoreOf, breakdownOf, pickThrow, text }) {
  runs.sort(sortBy);
  const entries = runs.map(r => ({ name: r.name, score: scoreOf(r), threw: r.threw }));
  entries.sort((a, b) => b.score - a.score);
  return toResult(entries, {
    beats,
    variant: self.variant,
    breakdown: Object.fromEntries(runs.map(r => [r.name, breakdownOf(r)])),
    luck: Object.fromEntries(runs.map(r => [r.name, round2(r.luck)])),
    text: text || beats.map(b => b.text).join(' '),
  });
}

/** A thrown competition looks the same in all nine of them. */
const threwBeat = (r, say) => beat(say(THROW_LINES)(r.name), [r.name], 'THREW IT', 'grey');

// ══════════════════════════════════════════════════════════════════════
// PRECISION
// ══════════════════════════════════════════════════════════════════════

const SLING_HIT = [
  (n, p, v) => `${n} pulls back to the shoulder, holds it a beat longer than anybody else has, and puts it through for ${v}.`,
  (n, p, v) => `${n} does not aim so much as decide. ${v}.`,
  (n, p, v) => `The band goes, the ball goes, and ${n} has ${v} before the sound reaches the seats.`,
  (n, p, v) => `${n} adjusts a hand's width left after the last one and it is exactly a hand's width. ${v}.`,
];
const SLING_MISS = [
  (n, p) => `${n} overpulls. The ball goes over everything and into the back netting, and ${p.sub} ${vb(p, 'knows', 'know')} it the moment it leaves.`,
  n => `${n} clips the frame. It rattles, it drops, it scores nothing.`,
  (n, p) => `${n} lets go soft and watches it fall short of the board entirely. ${p.Sub} ${vb(p, 'does', 'do')} not try to explain it.`,
  n => `Wide. ${n} does not even follow the flight.`,
];

const slingshotAim = {
  id: 'bb-classic-slingshot', variant: 'slingshot',
  name: 'Slingshot Aim', category: 'precision',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Each houseguest is given a giant slingshot anchored to the lawn and a crate of balls, with a board of scoring rings standing across the yard behind a run of hanging obstacles. They draw the band back themselves, judge the arc over the obstacles and let go, one ball at a time, with the tight centre rings worth several times the outer ones. A ball that clips an obstacle or sails long is gone from the crate and scores nothing, so nobody gets to simply fire until something lands. The highest total after six shots wins.',
  // Drawing and holding a heavy band is physical; the arc over the obstacles is
  // spatial judgement; and the last of it is not flinching on the release.
  stats: { physical: 0.30, intuition: 0.30, temperament: 0.22, mental: 0.18 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const hit = makePicker(rng); const miss = makePicker(rng); const say = makePicker(rng);
    const SHOTS = 6;
    beats.push(beat('Six balls each, one board, and a row of obstacles between the two that nobody gets to move.',
      participants.slice(0, 3), `${SHOTS} SHOTS`));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      r.shots = []; r.total = 0; r.misses = 0; r.best = 0;
      // A groove is real: hitting the board settles the next draw, and missing
      // costs a little of the hand. Kept very small — it is positive feedback,
      // and positive feedback on top of an additive score is how a competition
      // ends up owned by whoever started well.
      let groove = 0;
      for (let i = 0; i < SHOTS; i++) {
        const noise = (rng() - 0.5) * 0.82;
        r.luck += noise;
        // Skill weighted below 1: six shots of it was decisive enough that one
        // houseguest took 65% of forty runs, which is a competition with a
        // winner rather than a competition.
        const aim = clamp(0.22 + r.skill * 0.86 + r.form * 1.5 + groove + noise
          - (r.threw ? 0.42 : 0) - (r.haveNot ? 0.07 : 0), 0, 1);
        const value = aim >= 0.93 ? 10 : aim >= 0.79 ? 6 : aim >= 0.61 ? 4 : aim >= 0.38 ? 2 : 0;
        groove = clamp(groove + (value ? 0.02 : -0.035), -0.08, 0.06);
        if (!value) r.misses++;
        r.total += value;
        r.best = Math.max(r.best, value);
        r.shots.push({ shot: i + 1, value });
      }
    }

    [...runs].sort((a, b) => a.total - b.total).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.best >= 10) {
        beats.push(beat(hit(SLING_HIT)(r.name, r.p, r.best), [r.name], 'CENTRE RING', 'gold'));
      } else if (r.misses >= 3) {
        beats.push(beat(miss(SLING_MISS)(r.name, r.p), [r.name], `${r.misses} MISSED`, 'grey'));
      } else {
        beats.push(beat(`${r.name} finishes on ${r.total} — ${SHOTS - r.misses} of ${SHOTS} on the board, and none of them cheap.`,
          [r.name], `${r.total} POINTS`));
      }
    });

    const top = [...runs].sort((a, b) => b.total - a.total);
    beats.push(beat(`${top[0].name} wins it on ${top[0].total}.`, [top[0].name], 'WINS', 'gold'));
    api.popDelta(top[0].name, 1.5);
    api.record(top[0].name, 'slingshot-win', { total: top[0].total });

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.total - a.total || a.misses - b.misses,
      scoreOf: r => r.total,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), total: r.total, misses: r.misses,
        best: r.best, shots: r.shots, threw: r.threw, threwChance: r.threwChance, haveNot: r.haveNot }),
    });
  },
};

const ROLL_BANK = [
  (n, v) => `${n} takes the ${v} and steps off the ramp. No drama, no extra roll, no story — just a number the rest of them now have to beat.`,
  (n, p, v) => `${n} banks on ${v}, which is either discipline or nerves and ${p.sub} ${vb(p, 'is', 'are')} not saying which.`,
  (n, v) => `${n} looks at the deep pocket for a long moment and then takes the ${v} instead.`,
];
const ROLL_BUST = [
  (n, p, v) => `${n} goes again on ${v} and the ball comes straight back down the ramp. Everything ${p.sub} had is gone.`,
  (n, v) => `One more roll, ${n} says. The ball stops an inch short of the lip and rolls all the way back. ${v} points, into nothing.`,
  (n, p) => `${n} does not stop, and the yard makes the noise a yard makes when somebody does not stop.`,
  (n, v) => `${n} has ${v} banked in ${pron(n).posAdj} head and none of it on the board, and now none of it anywhere.`,
];
const ROLL_PUSH = [
  (n, v) => `${n} pushes past ${v} into the deep pocket and lands it. The yard has to reconsider ${n}.`,
  (n, p, v) => `${n} should have stopped at ${v}. ${p.Sub} ${vb(p, 'does', 'do')} not, and it works, which is the worst lesson anybody here could learn.`,
];

const rollerball = {
  id: 'bb-classic-rollerball', variant: 'rollerball',
  name: 'Rollerball', category: 'precision',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'A long ramp runs down to a bank of pockets, and the further up the bank a pocket sits the more it pays. A houseguest rolls a ball up the ramp and whatever pocket it drops into is added to a running total they are holding, not banking — and after every roll they choose to walk away with the total or roll again. A ball that fails to reach the pockets rolls back down and wipes the whole running total to nothing, so the deep pockets are worth most to the person least able to stop reaching for them. The highest banked total wins.',
  // Precision puts the ball where you meant it. Boldness decides how many
  // times you go back, which is the competition.
  stats: { physical: 0.26, intuition: 0.24, boldness: 0.24, temperament: 0.16, mental: 0.10 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const bankSay = makePicker(rng); const bustSay = makePicker(rng);
    const pushSay = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('One ramp, one bank of pockets, and one question after every single roll: is that enough?',
      participants.slice(0, 3), 'ROLL OR BANK'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      const bold = clamp(r.stats.boldness / 10, 0.05, 0.95);
      r.rolls = []; r.running = 0; r.total = 0; r.busted = false; r.pushes = 0;
      for (let i = 0; i < 8; i++) {
        const noise = (rng() - 0.5) * 0.55;
        r.luck += noise;
        const control = clamp(0.2 + r.skill * 1.05 + noise - (r.threw ? 0.4 : 0) - (r.haveNot ? 0.06 : 0), 0, 1);
        // Reaching for the deep pocket is what fails. The further into a run
        // somebody is, the more they are reaching.
        const reach = 0.06 + i * 0.045;
        if (control < reach) { r.busted = true; r.rolls.push({ roll: i + 1, value: 0, bust: true }); break; }
        const value = control >= 0.9 ? 9 : control >= 0.74 ? 6 : control >= 0.55 ? 4 : control >= 0.34 ? 2 : 1;
        r.running += value;
        r.rolls.push({ roll: i + 1, value });
        // Stop or go. A bold houseguest keeps reaching; a steady one banks a
        // decent number and leaves. Neither is right — that is the point.
        const enough = 12 + (1 - bold) * 10;
        const goAgain = r.running < enough || rng() < bold * 0.42;
        if (!goAgain) break;
        if (i >= 3) r.pushes++;
      }
      r.total = r.busted ? 0 : r.running;
    }

    [...runs].sort((a, b) => a.total - b.total).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.busted) {
        beats.push(beat(bustSay(ROLL_BUST)(r.name, r.p, r.running), [r.name], 'LOST THE LOT', 'red'));
        api.popDelta(r.name, -0.5);
      } else if (r.pushes >= 2) {
        beats.push(beat(pushSay(ROLL_PUSH)(r.name, r.p, r.total - 9), [r.name], `BANKED ${r.total}`, 'gold'));
      } else {
        beats.push(beat(bankSay(ROLL_BANK)(r.name, r.p, r.total), [r.name], `BANKED ${r.total}`));
      }
    });

    const top = [...runs].sort((a, b) => b.total - a.total)[0];
    // Everybody watched who could stop and who could not, and it tells them
    // something they will use later.
    for (const r of runs) {
      if (r.busted && !r.threw) api.record(r.name, 'rollerball-bust', { at: r.running });
    }
    api.popDelta(top.name, 1.5);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.total - a.total,
      scoreOf: r => r.total,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), banked: r.total, running: r.running,
        busted: r.busted, rolls: r.rolls, pushes: r.pushes, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// PUZZLE
// ══════════════════════════════════════════════════════════════════════

const HANOI_GOOD = [
  (n, p) => `${n} works it backwards from the finished tower, which is the only way anybody has ever solved this, and ${p.sub} ${vb(p, 'gets', 'get')} there without a single illegal move.`,
  n => `${n} does not touch a disc for the first ninety seconds. Then ${n} does not stop touching them.`,
  (n, p) => `${n} finds the rhythm of it — small onto large, never the other way — and after that it is just labour. ${p.Sub} ${vb(p, 'does', 'do')} the labour.`,
  n => `${n} solves it two moves under what the yard thought was possible and looks almost apologetic about it.`,
];
const HANOI_BAD = [
  (n, p) => `${n} puts a large disc on a small one, the horn goes, and the whole tower goes back to the start. ${p.Sub} ${vb(p, 'does', 'do')} it again four minutes later.`,
  n => `${n} is fast and wrong, which on this board is the worst thing a person can be.`,
  (n, p) => `${n} gets most of the way there and then cannot see the last three moves. ${p.Sub} ${vb(p, 'stares', 'stare')} at it until the buzzer.`,
  n => `Three resets. ${n} stops counting after the third.`,
];

const towerOfHanoi = {
  id: 'bb-classic-hanoi', variant: 'hanoi',
  name: 'Tower of Hanoi', category: 'puzzle',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Each houseguest stands at three pegs with a stack of graduated discs on the first one, and has to rebuild that stack in order on the third. Only one disc moves at a time and a larger disc may never come to rest on a smaller one — put one down wrong and a horn sounds, the board is cleared and the whole stack goes back to the start. The tower is deep enough that the solution is longer than it looks and every reset costs the entire run. Fastest completed tower wins, and anybody still building when time is called is ranked on how far up they got.',
  stats: { mental: 0.42, strategic: 0.22, temperament: 0.22, intuition: 0.14 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const good = makePicker(rng); const bad = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('Three pegs, one stack, and a rule that turns a moment of confidence into four minutes of work.',
      participants.slice(0, 3), 'THE TOWER'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      const noise = (rng() - 0.5) * 2.4;
      r.luck += noise;
      // Resets are the mechanic. A steady, patient houseguest gets few; a fast
      // confident one gets several and loses the competition to them.
      const care = clamp(r.skill + noise / 14 - (r.threw ? 0.35 : 0), 0.02, 1);
      r.resets = Math.max(0, Math.round((1 - care) * 4.2 + (rng() - 0.4)));
      // Progress up the tower, before the resets are charged against it.
      r.reached = clamp(0.25 + care * 0.95 + (rng() - 0.5) * 0.2, 0, 1);
      r.solved = r.reached >= 0.9 && r.resets <= 2;
      r.time = round2(240 - care * 95 + r.resets * 26 + (rng() - 0.5) * 20 + (r.haveNot ? 8 : 0));
      r.score = round2((r.solved ? 60 : 0) + r.reached * 40 - r.resets * 4 - (r.solved ? r.time * 0.06 : 0));
    }

    [...runs].sort((a, b) => a.score - b.score).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.solved) {
        beats.push(beat(good(HANOI_GOOD)(r.name, r.p), [r.name], `SOLVED · ${Math.round(r.time)}s`, 'gold'));
      } else if (r.resets >= 3) {
        beats.push(beat(bad(HANOI_BAD)(r.name, r.p), [r.name], `${r.resets} RESETS`, 'red'));
      } else {
        beats.push(beat(`${r.name} is ${Math.round(r.reached * 100)}% of the way up when time is called, with ${r.resets === 1 ? 'one reset' : `${r.resets} resets`} behind ${r.p.obj}.`,
          [r.name], 'UNFINISHED', 'grey'));
      }
    });

    const top = [...runs].sort((a, b) => b.score - a.score)[0];
    api.popDelta(top.name, 1.5);
    api.record(top.name, 'hanoi-win', { solved: top.solved, resets: top.resets });

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.score - a.score,
      scoreOf: r => r.score,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), score: r.score, solved: r.solved,
        resets: r.resets, reached: round2(r.reached), seconds: r.time, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

const SPELL_LONG = [
  (n, w) => `${n} lays out ${w} letters and steps back from the board like somebody who has been sitting on that word since the third trip.`,
  (n, p, w) => `${w} letters from ${n}, and ${p.sub} ${vb(p, 'spends', 'spend')} the last minute of the clock refusing to shorten it for safety.`,
  (n, w) => `${n} goes long — ${w} — and gets it down with the horn going.`,
];
const SPELL_SHORT = [
  (n, p) => `${n} runs the yard well and comes back with letters that do not want to be a word. ${p.Sub} ${vb(p, 'settles', 'settle')} for something small.`,
  n => `${n} has a good word and one letter short of it, which is the same as not having it.`,
  (n, p) => `${n} spends too long searching and too little thinking, and ${p.sub} ${vb(p, 'is', 'are')} still rearranging tiles when the horn goes.`,
];

const spellingSearch = {
  id: 'bb-classic-spelling', variant: 'spelling',
  name: 'Spelling Search', category: 'puzzle',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Letter tiles are buried across the yard — in the sand, under the astroturf, inside the pool filter — and each houseguest can only carry one at a time back to their own board. They dig, run a tile back, mount it, and go again, with the clock running the whole time and no way to know which letters are still out there. At the horn every board is read as a single word, and a board that does not spell one scores nothing at all no matter how many tiles are on it. The longest valid word wins.',
  // Digging and running is physical; knowing when to stop collecting and start
  // building is the whole competition, and that is mental.
  stats: { mental: 0.34, physical: 0.24, strategic: 0.20, endurance: 0.14, intuition: 0.08 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const long = makePicker(rng); const short = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('The letters are in the sand, in the turf and in the filter, and nobody can carry more than one at a time.',
      participants.slice(0, 3), 'DIG AND SPELL'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      const noise = (rng() - 0.5) * 2.2;
      r.luck += noise;
      const run = clamp(r.skill + noise / 15 - (r.threw ? 0.35 : 0) - (r.haveNot ? 0.05 : 0), 0.02, 1);
      r.tiles = Math.max(3, Math.round(5 + run * 9 + (rng() - 0.5) * 2));
      // Having the letters is not having the word. The gap between the two is
      // where this competition is won.
      const built = clamp(run + (rng() - 0.5) * 0.3, 0, 1);
      r.word = Math.max(0, Math.min(r.tiles, Math.round(built * r.tiles)));
      r.valid = r.word >= 3 && built > 0.22;
      if (!r.valid) r.word = 0;
      r.score = r.word * 10 + (r.valid ? run * 3 : 0);
    }

    [...runs].sort((a, b) => a.score - b.score).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.word >= 8) {
        beats.push(beat(long(SPELL_LONG)(r.name, r.p, r.word), [r.name], `${r.word} LETTERS`, 'gold'));
      } else if (!r.valid) {
        beats.push(beat(`${r.name} has ${r.tiles} tiles on the board and no word among them. It scores nothing, and ${r.p.sub} ${vb(r.p, 'knew', 'knew')} that before the horn.`,
          [r.name], 'NO WORD', 'red'));
      } else {
        beats.push(beat(short(SPELL_SHORT)(r.name, r.p), [r.name], `${r.word} LETTERS`, 'grey'));
      }
    });

    const top = [...runs].sort((a, b) => b.score - a.score)[0];
    api.popDelta(top.name, 1.5);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.score - a.score,
      scoreOf: r => r.score,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), letters: r.word, tiles: r.tiles,
        valid: r.valid, score: round2(r.score), threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// LUCK
// ══════════════════════════════════════════════════════════════════════

const FOLD_CALLED = [
  (a, b) => `${a} calls ${b}. There is nothing behind it, there never was, and now the whole house has watched ${b} try it.`,
  (a, b) => `${b} pushes. ${a} does not move. ${b} turns the card over and it is not what ${b} said it was.`,
  (a, b) => `${a} has been watching ${b}'s hands all night, and says so, out loud, before turning the card.`,
];
const FOLD_WORKED = [
  (a, b) => `${a} bluffs ${b} straight out of the round on nothing at all, and does not gloat, which somehow makes it worse.`,
  (a, b) => `${b} folds a better hand than ${a} is holding. ${a} shows it. ${b} will remember that for weeks.`,
  (a, b) => `${a} raises into ${b} with the worst card on the table and ${b} believes every part of it.`,
];

const stayOrFold = {
  id: 'bb-classic-stay-or-fold', variant: 'stayfold',
  name: 'Stay or Fold', category: 'luck',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'The houseguests play rounds at a table in the yard, each dealt a hidden card worth a hidden number of points. Before the cards are turned every player must declare — stay in and keep the card, or fold and take a small guaranteed score instead — and they declare out loud, in turn, watching each other do it. The lowest card left standing at the end of a round is wiped to zero, so staying in on a bad card costs everything it was worth and folding on a good one throws it away. The highest total after the last round wins.',
  // The cards are luck. Everything else is reading a face and controlling your
  // own, which is why this is the one competition a social player can steal.
  stats: { boldness: 0.28, intuition: 0.26, social: 0.22, strategic: 0.14, temperament: 0.10 },
  weight: () => 1.05,
  simulate(participants, context, api, rng) {
    const beats = [];
    const called = makePicker(rng); const worked = makePicker(rng); const say = makePicker(rng);
    const ROUNDS = 4;
    beats.push(beat('Cards face down, declarations out loud, and the lowest card still in the round loses everything it was worth.',
      participants.slice(0, 3), `${ROUNDS} ROUNDS`));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) { r.total = 0; r.wiped = 0; r.folds = 0; r.rounds = []; }

    for (let round = 0; round < ROUNDS; round++) {
      const table = runs.map(r => {
        const card = 1 + Math.floor(rng() * 10);          // the luck, undisguised
        const noise = (rng() - 0.5) * 0.5;
        r.luck += noise;
        // Reading the table is knowing roughly where your card sits. A good
        // read folds a bad card and stays on a good one; a poor read does the
        // opposite and pays for it.
        const read = clamp(r.skill + noise, 0, 1);
        const believesLow = card <= 4 ? read > 0.35 : read < 0.28;
        const stay = r.threw ? false : !believesLow;
        return { r, card, stay, read };
      });
      const inPlay = table.filter(t => t.stay);
      const lowest = inPlay.length ? inPlay.reduce((lo, t) => (t.card < lo.card ? t : lo)) : null;
      for (const t of table) {
        if (!t.stay) { t.r.folds++; t.r.total += 2; t.r.rounds.push({ round: round + 1, card: t.card, folded: true }); continue; }
        if (lowest && t === lowest && inPlay.length > 1) {
          t.r.wiped++; t.r.rounds.push({ round: round + 1, card: t.card, wiped: true }); continue;
        }
        t.r.total += t.card;
        t.r.rounds.push({ round: round + 1, card: t.card });
      }

      // The table is the story. Somebody gets read and somebody gets away with
      // it, and both of those are things people carry out of the yard.
      if (inPlay.length >= 2 && round < ROUNDS - 1) {
        const reader = [...table].sort((a, b) => b.read - a.read)[0];
        const mark = [...table].filter(t => t !== reader).sort((a, b) => a.read - b.read)[0];
        if (reader && mark) {
          const readerWon = reader.read > 0.55;
          beats.push(beat(
            readerWon ? called(FOLD_CALLED)(reader.r.name, mark.r.name)
              : worked(FOLD_WORKED)(mark.r.name, reader.r.name),
            [reader.r.name, mark.r.name],
            readerWon ? 'CALLED' : 'BLUFFED', readerWon ? 'gold' : 'red'));
          // Being read at a table in front of everybody is a small humiliation
          // and it lands where humiliations land.
          const loser = readerWon ? mark.r.name : reader.r.name;
          const winner = readerWon ? reader.r.name : mark.r.name;
          api.addBond(loser, winner, -0.5);
          api.popDelta(winner, 0.8);
          api.record(winner, 'read-them-at-the-table', { round: round + 1, opponent: loser });
        }
      }
    }

    [...runs].sort((a, b) => a.total - b.total).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.folds >= 3) {
        beats.push(beat(`${r.name} folds ${r.folds} of the four and finishes on ${r.total}. Safe, small, and out of it by the third round.`,
          [r.name], `FOLDED ${r.folds}`, 'grey'));
      } else if (r.wiped >= 2) {
        beats.push(beat(`${r.name} stays in twice on cards that could not survive the table and loses both. ${r.total} points, and a lot of information given away for free.`,
          [r.name], `WIPED ${r.wiped}×`, 'red'));
      } else {
        beats.push(beat(`${r.name} finishes on ${r.total}, having stayed in exactly when it was worth staying in.`,
          [r.name], `${r.total} POINTS`));
      }
    });

    const top = [...runs].sort((a, b) => b.total - a.total)[0];
    api.popDelta(top.name, 1.5);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.total - a.total,
      scoreOf: r => r.total,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), total: r.total, folds: r.folds,
        wiped: r.wiped, rounds: r.rounds, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

const DICE_LUCKY = [
  n => `${n} throws it badly, the dice hit the rail wrong, and both of them come up on the highest lane in the yard. ${n} has the grace to look embarrassed.`,
  (n, p) => `${n} does everything wrong and gets everything right. ${p.Sub} ${vb(p, 'is', 'are')} not going to apologise for it.`,
  n => `The dice do something on the second bounce that nobody in the yard can explain, least of all ${n}, and it is worth more than anybody else's night.`,
];
const DICE_ROBBED = [
  (n, p) => `${n} throws the best line of the competition and watches both dice settle in the cheapest lane on the board. ${p.Sub} ${vb(p, 'stands', 'stand')} there for a while.`,
  n => `${n} does not deserve that. Nobody says so out loud, but nobody has to.`,
  (n, p) => `A perfect throw from ${n}, and the rail gives it back. ${p.Sub} ${vb(p, 'laughs', 'laugh')}, because the alternative is worse.`,
];

const tumblinDice = {
  id: 'bb-classic-tumblin-dice', variant: 'dice',
  name: "Tumblin' Dice", category: 'luck',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'A pair of oversized dice is thrown down a raked table into a bank of scoring lanes at the far end, with the narrow high-value lanes at the back and the wide cheap ones at the front. Each houseguest gets three throws and the numbers showing on the dice are multiplied by the lane they land in, so a good number in a bad lane is worth almost nothing. Dice that come to rest against the rail or fall off the table score zero for that throw. The highest total after three throws wins.',
  // Deliberately the crapshoot in the library. A season with no night the best
  // player can simply lose has no upsets in it, and skill here is worth a
  // nudge rather than a result.
  stats: { intuition: 0.30, physical: 0.28, temperament: 0.24, boldness: 0.18 },
  weight: () => 0.95,
  simulate(participants, context, api, rng) {
    const beats = [];
    const lucky = makePicker(rng); const robbed = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('Three throws each down a raked table, and a competition where the best throw in the yard can be worth nothing at all.',
      participants.slice(0, 3), 'THREE THROWS'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      r.throws = []; r.total = 0; r.zeros = 0;
      let bestLine = 0;
      for (let i = 0; i < 3; i++) {
        // Skill buys a slightly better line. It does not buy a lane.
        const noise = rng();
        r.luck += noise - 0.5;
        const line = clamp(0.3 + r.skill * 0.5 + (rng() - 0.5) * 0.5 - (r.threw ? 0.35 : 0), 0, 1);
        bestLine = Math.max(bestLine, line);
        const off = noise < 0.11 + (1 - line) * 0.12;
        if (off) { r.zeros++; r.throws.push({ throwNo: i + 1, value: 0, off: true }); continue; }
        const pips = 2 + Math.floor(rng() * 11);
        const lane = rng() < line * 0.45 ? 3 : rng() < 0.5 ? 2 : 1;
        const value = pips * lane;
        r.total += value;
        r.throws.push({ throwNo: i + 1, pips, lane, value });
      }
      r.bestLine = round2(bestLine);
    }

    const field = [...runs].sort((a, b) => b.total - a.total);
    const luckiest = [...runs].filter(r => !r.threw).sort((a, b) => (b.total - b.bestLine * 40) - (a.total - a.bestLine * 40))[0];
    const unluckiest = [...runs].filter(r => !r.threw).sort((a, b) => (b.bestLine * 40 - b.total) - (a.bestLine * 40 - a.total))[0];

    [...runs].sort((a, b) => a.total - b.total).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r === luckiest && luckiest !== unluckiest) {
        beats.push(beat(lucky(DICE_LUCKY)(r.name, r.p), [r.name], `${r.total} — SOMEHOW`, 'gold'));
      } else if (r === unluckiest) {
        beats.push(beat(robbed(DICE_ROBBED)(r.name, r.p), [r.name], `${r.total} — ROBBED`, 'red'));
      } else {
        beats.push(beat(`${r.name} finishes on ${r.total}${r.zeros ? `, with ${r.zeros === 1 ? 'one throw' : `${r.zeros} throws`} off the table` : ''}.`,
          [r.name], `${r.total} POINTS`));
      }
    });

    api.popDelta(field[0].name, 1.2);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.total - a.total,
      scoreOf: r => r.total,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), total: r.total, zeros: r.zeros,
        bestLine: r.bestLine, throws: r.throws, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// PHYSICAL
// ══════════════════════════════════════════════════════════════════════

const DOUGH_HAUL = [
  (n, p, c) => `${n} loads up until ${p.sub} can barely see over it — ${c} coins in one trip — and somehow gets all of it to the vault.`,
  (n, c) => `${n} works out early that the wall is the slow part, not the wading, and starts taking ${c} at a time.`,
  (n, p) => `${n} goes in up to the waist and comes out looking like something the yard grew. ${p.Sub} ${vb(p, 'does', 'do')} not slow down.`,
];
const DOUGH_SPILL = [
  (n, p) => `${n} goes down in the middle of the pit and the whole armful goes with ${p.obj}. Some of it is never seen again.`,
  n => `${n} makes it to the wall, tries to climb it holding everything, and donates most of it to the dough.`,
  (n, p) => `${n} is too greedy on the third trip. The dough takes ${p.posAdj} footing and then ${p.posAdj} coins.`,
];

const rollinInTheDough = {
  id: 'bb-classic-dough', variant: 'dough',
  name: "Rollin' in the Dough", category: 'physical',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'The yard has been filled thigh-deep with dough, with a vault on the far side of it and a low wall to climb before you get there. Houseguests wade in, gather as many coins as they can hold from the pit, carry them across and drop them in their own vault, then go back for more, over and over, for the length of the clock. Nothing is strapped on and nothing is bagged — coins carried in the arms come out of the arms the moment somebody loses their footing or tries to climb the wall holding too much. The fullest vault at the horn wins.',
  stats: { physical: 0.38, endurance: 0.30, temperament: 0.16, boldness: 0.16 },
  weight: () => 1.15,
  simulate(participants, context, api, rng) {
    const beats = [];
    const haul = makePicker(rng); const spill = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('Thigh-deep dough, a wall, and a vault. Nothing is bagged, nothing is strapped on, and everything is carried in the arms.',
      participants.slice(0, 3), 'THE PIT'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      const greed = clamp(r.stats.boldness / 10, 0.05, 0.95);
      r.trips = []; r.vault = 0; r.spills = 0;
      // Trip count was a second helping of the same stat ladder on top of the
      // load, which squared the advantage and left three winners in forty.
      const trips = Math.max(3, Math.round(5 + r.skill * 2.4 + r.form * 6 + (rng() - 0.5) * 2 - (r.threw ? 3 : 0)));
      for (let i = 0; i < trips; i++) {
        const noise = (rng() - 0.5) * 0.5;
        r.luck += noise;
        // Carrying more is worth more and drops more. That is the whole choice.
        const load = Math.round(4 + greed * 9 + r.skill * 5 + noise * 4);
        const grip = clamp(r.skill * 1.1 + r.form * 1.6 + noise - load * 0.045 - (r.haveNot ? 0.06 : 0), 0, 1);
        if (grip < 0.16) { r.spills++; r.trips.push({ trip: i + 1, load, spilled: true }); continue; }
        r.vault += load;
        r.trips.push({ trip: i + 1, load });
      }
      r.bestLoad = r.trips.reduce((m, t) => Math.max(m, t.spilled ? 0 : t.load), 0);
    }

    [...runs].sort((a, b) => a.vault - b.vault).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.spills >= 2) {
        beats.push(beat(spill(DOUGH_SPILL)(r.name, r.p), [r.name], `${r.spills} SPILLS`, 'red'));
      } else if (r.bestLoad >= 14) {
        beats.push(beat(haul(DOUGH_HAUL)(r.name, r.p, r.bestLoad), [r.name], `${r.vault} IN THE VAULT`, 'gold'));
      } else {
        beats.push(beat(`${r.name} runs it small and steady — ${r.trips.length} trips, nothing dropped, ${r.vault} in the vault.`,
          [r.name], `${r.vault} IN THE VAULT`));
      }
    });

    const top = [...runs].sort((a, b) => b.vault - a.vault)[0];
    api.popDelta(top.name, 1.5);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.vault - a.vault,
      scoreOf: r => r.vault,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), vault: r.vault, spills: r.spills,
        trips: r.trips, bestLoad: r.bestLoad, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

const FALSE_START = [
  (n, p) => `${n} goes on the WOAH. The horn goes, the lights go red, and ${p.sub} ${vb(p, 'walks', 'walk')} all the way back to the line.`,
  n => `Second false start for ${n}, who has now spent more of this competition walking backwards than forwards.`,
  (n, p) => `${n} is moving before ${p.sub} ${vb(p, 'has', 'have')} finished hearing it. Back to the start.`,
];
const HELD_STILL = [
  (n, p) => `Everybody else twitches. ${n} does not — not a foot, not a shoulder — and by the fourth call ${p.sub} ${vb(p, 'is', 'are')} the only one who has not lost a length.`,
  n => `${n} treats every call like it might be the wrong one, which is slow, and which is why ${n} is winning.`,
  (n, p) => `${n} has worked out that this is not a race. ${p.Sub} ${vb(p, 'moves', 'move')} late every single time and gains on all of them.`,
];

const readySetWoah = {
  id: 'bb-classic-ready-set-woah', variant: 'readyset',
  name: 'Ready, Set, Woah', category: 'physical',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'A straight sprint course with a start line, a finish line and a voice calling the field forward. The call is the competition: "ready, set, GO" sends the field, but "ready, set, WOAH" is called just as often and anybody who moves on it is sent all the way back to the start line. The two calls are identical until the last syllable, so the fastest houseguest in the yard is not the one who wins — the one who can stand still is. First across the finish wins, and everybody else is placed on ground gained.',
  // Temperament first, deliberately. This is the physical competition a
  // challenge beast can lose to somebody who simply does not flinch.
  stats: { temperament: 0.34, physical: 0.28, intuition: 0.22, endurance: 0.16 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const falseSay = makePicker(rng); const held = makePicker(rng); const say = makePicker(rng);
    const CALLS = 7;
    beats.push(beat('Seven calls. "Ready, set" every time, and the last word is either the one you want or the one that sends you back to the line.',
      participants.slice(0, 3), `${CALLS} CALLS`));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) { r.ground = 0; r.falseStarts = 0; r.calls = []; }

    for (let c = 0; c < CALLS; c++) {
      const isGo = rng() < 0.5;
      for (const r of runs) {
        const noise = (rng() - 0.5) * 0.55;
        r.luck += noise;
        const discipline = clamp(r.skill * 1.1 + noise - (r.threw ? 0.4 : 0) - (r.haveNot ? 0.05 : 0), 0, 1);
        if (isGo) {
          const gained = round2(2 + discipline * 6);
          r.ground += gained;
          r.calls.push({ call: c + 1, word: 'GO', gained });
        } else {
          // Holding still is the check. Everything about the yard is telling
          // them to go.
          const held2 = rng() < clamp(0.25 + discipline * 0.72, 0, 0.97);
          if (held2) { r.calls.push({ call: c + 1, word: 'WOAH', held: true }); continue; }
          r.falseStarts++;
          r.ground = 0;
          r.calls.push({ call: c + 1, word: 'WOAH', falseStart: true });
        }
      }
    }

    [...runs].sort((a, b) => a.ground - b.ground).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.falseStarts >= 2) {
        beats.push(beat(falseSay(FALSE_START)(r.name, r.p), [r.name], `${r.falseStarts} FALSE STARTS`, 'red'));
      } else if (r.falseStarts === 0) {
        beats.push(beat(held(HELD_STILL)(r.name, r.p), [r.name], 'NEVER FLINCHED', 'gold'));
      } else {
        beats.push(beat(`${r.name} loses one to a WOAH early and spends the rest of it making the ground back up. ${Math.round(r.ground)} down the course at the horn.`,
          [r.name], `${Math.round(r.ground)}M`));
      }
    });

    const top = [...runs].sort((a, b) => b.ground - a.ground)[0];
    api.popDelta(top.name, 1.5);
    api.record(top.name, 'ready-set-woah-win', { falseStarts: top.falseStarts });

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.ground - a.ground,
      scoreOf: r => r.ground,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), ground: round2(r.ground),
        falseStarts: r.falseStarts, calls: r.calls, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// QUIZ
// ══════════════════════════════════════════════════════════════════════

const X_RIGHT = [
  (n, q) => `${n} answers ${q} without writing anything down first, which is either certainty or a very good impression of it.`,
  (n, p, q) => `${q}, says ${n}, and ${p.sub} ${vb(p, 'is', 'are')} the only one on the board with it.`,
  (n, q) => `${n} works it back from the number of votes rather than the number of days, gets ${q}, and gets it alone.`,
];
const X_WRONG = [
  (n, p) => `${n} answers fast and confidently and wrongly, and the confidence is the part the house notices.`,
  n => `${n} is out by one. ${n} is out by one on three of them, which stops being bad luck somewhere around the second.`,
  (n, p) => `${n} counts it on ${p.posAdj} fingers under the desk and still comes up short.`,
];

const solveForX = {
  id: 'bb-classic-solve-for-x', variant: 'solveforx',
  name: 'Solve For X', category: 'quiz',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'The houseguests stand at lit answer podiums while the house is described back to them as arithmetic — take the number of votes cast against one houseguest, subtract the days another has been a have-not, multiply by the number of vetoes used, and write the answer. Every quantity in the question is something that happened in front of them and nothing may be looked up. Answers are locked in on a timer and only the exact number scores, so being close is worth the same as being nowhere. The highest score after ten questions wins.',
  stats: { mental: 0.40, intuition: 0.24, strategic: 0.20, temperament: 0.16 },
  weight: () => 1.05,
  simulate(participants, context, api, rng) {
    const beats = [];
    const right = makePicker(rng); const wrong = makePicker(rng); const say = makePicker(rng);
    const QUESTIONS = 10;
    beats.push(beat('Ten questions, all of them arithmetic about a house these ten people have been living in, and no credit whatsoever for being close.',
      participants.slice(0, 3), `${QUESTIONS} QUESTIONS`));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      r.correct = 0; r.answers = [];
      for (let q = 0; q < QUESTIONS; q++) {
        const noise = (rng() - 0.5) * 0.6;
        r.luck += noise;
        const got = rng() < clamp(0.1 + r.skill * 0.85 + noise * 0.35 - (r.threw ? 0.35 : 0) - (r.haveNot ? 0.04 : 0), 0.02, 0.95);
        if (got) r.correct++;
        r.answers.push({ q: q + 1, correct: got });
      }
      // Being the only one who had it is worth something the raw count is not.
      r.solo = 0;
    }
    // Solo answers: a question most of the field missed.
    for (let q = 0; q < QUESTIONS; q++) {
      const got = runs.filter(r => r.answers[q].correct);
      if (got.length === 1) { got[0].solo++; got[0].answers[q].solo = true; }
    }

    [...runs].sort((a, b) => a.correct - b.correct).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.solo >= 2) {
        beats.push(beat(right(X_RIGHT)(r.name, r.p, 3 + Math.floor(rng() * 20)), [r.name],
          `${r.correct}/${QUESTIONS} · ${r.solo} ALONE`, 'gold'));
      } else if (r.correct <= QUESTIONS * 0.3) {
        beats.push(beat(wrong(X_WRONG)(r.name, r.p), [r.name], `${r.correct}/${QUESTIONS}`, 'red'));
      } else {
        beats.push(beat(`${r.name} finishes on ${r.correct} of ${QUESTIONS}, which on this board is a competitive night.`,
          [r.name], `${r.correct}/${QUESTIONS}`));
      }
    });

    const top = [...runs].sort((a, b) => b.correct - a.correct || b.solo - a.solo)[0];
    api.popDelta(top.name, 1.5);
    // Being visibly the person who remembers everything is a reputation, and
    // reputations get people nominated.
    api.record(top.name, 'solve-for-x-win', { correct: top.correct, solo: top.solo });

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.correct - a.correct || b.solo - a.solo,
      scoreOf: r => r.correct * 10 + r.solo * 3,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), correct: r.correct, solo: r.solo,
        answers: r.answers, threw: r.threw, threwChance: r.threwChance }),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// PRECISION — the balance one, with the field watching
// ══════════════════════════════════════════════════════════════════════

const SEESAW_HOLD = [
  (n, p) => `${n} finds the point where it stops arguing with ${p.obj} and simply stays there, and the ball does not move again for a long time.`,
  n => `${n} is barely breathing. It is the correct amount of breathing.`,
  (n, p) => `${n} corrects with the shoulders rather than the feet, which nobody else in the yard has worked out, and ${p.sub} ${vb(p, 'holds', 'hold')} the ball dead centre.`,
];
const SEESAW_DROP = [
  (n, p) => `${n} over-corrects, then over-corrects the over-correction, and the ball is gone before ${p.sub} ${vb(p, 'has', 'have')} finished the second one.`,
  n => `The board tips, ${n} chases it, and chasing it is the mistake.`,
  (n, p) => `${n} lasts a long time and loses it to a single twitch. ${p.Sub} ${vb(p, 'stands', 'stand')} on the empty board for a second afterwards.`,
];

const inTheBalance = {
  id: 'bb-classic-in-the-balance', variant: 'balance',
  name: 'In The Balance', category: 'precision',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Each houseguest stands on a long board pivoted at its centre with a heavy ball resting in a channel that runs the length of it. Shifting weight tips the board and sends the ball rolling, and the object is to keep it inside a narrow scoring zone at the middle of the channel for as long as possible while the pivot is loosened at intervals to make the board twitchier. The moment the ball leaves either end of the channel that houseguest is finished and their clock stops where it stopped. Longest time in the zone wins.',
  stats: { temperament: 0.34, physical: 0.22, endurance: 0.22, intuition: 0.22 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const hold = makePicker(rng); const drop = makePicker(rng); const say = makePicker(rng);
    beats.push(beat('One board, one pivot, one ball, and a pivot that gets looser every few minutes whether anybody is ready or not.',
      participants.slice(0, 3), 'THE BOARD'));

    const runs = prepare(participants, context, this, rng);
    for (const r of runs) {
      let t = 0; let stage = 0;
      // The board gets harder in stages, so surviving late is worth far more
      // than surviving early — the same shape as a real endurance comp without
      // being another endurance comp.
      while (stage < 6) {
        const noise = (rng() - 0.5) * 0.5;
        r.luck += noise;
        const steady = clamp(r.skill * 1.15 + noise - stage * 0.11
          - (r.threw ? 0.4 : 0) - (r.haveNot ? 0.07 : 0), 0, 1);
        if (rng() > steady) break;
        t += 40 + steady * 55;
        stage++;
      }
      r.stage = stage;
      r.seconds = round2(t);
    }

    [...runs].sort((a, b) => a.seconds - b.seconds).forEach(r => {
      if (r.threw) { beats.push(threwBeat(r, say)); return; }
      if (r.stage >= 5) {
        beats.push(beat(hold(SEESAW_HOLD)(r.name, r.p), [r.name], `${Math.round(r.seconds)}s`, 'gold'));
      } else if (r.stage <= 1) {
        beats.push(beat(drop(SEESAW_DROP)(r.name, r.p), [r.name], `${Math.round(r.seconds)}s`, 'red'));
      } else {
        beats.push(beat(`${r.name} holds the zone through ${r.stage} loosenings of the pivot and loses it on the next one. ${Math.round(r.seconds)} seconds.`,
          [r.name], `${Math.round(r.seconds)}s`, 'grey'));
      }
    });

    const ranked = [...runs].sort((a, b) => b.seconds - a.seconds);
    const m = margin(ranked.map(r => ({ name: r.name, score: r.seconds / 20 })));
    if (m.word === 'photo finish' && ranked[1]) {
      beats.push(beat(`${ranked[0].name} and ${ranked[1].name} lose the ball within a breath of each other, and the clocks have to be read twice.`,
        [ranked[0].name, ranked[1].name], 'BY NOTHING', 'gold'));
      // Two people who went to the wire together remember it.
      api.addBond(ranked[0].name, ranked[1].name, bond(ranked[0].name, ranked[1].name) < 0 ? 0.4 : 0.6);
    }
    api.popDelta(ranked[0].name, 1.5);

    return finish(runs, {
      beats, self: this,
      sortBy: (a, b) => b.seconds - a.seconds,
      scoreOf: r => r.seconds,
      breakdownOf: r => ({ base: r.base, roll: round2(r.luck), seconds: r.seconds, stage: r.stage,
        threw: r.threw, threwChance: r.threwChance, haveNot: r.haveNot }),
    });
  },
};

export const CLASSIC_COMPS = [
  slingshotAim, rollerball, inTheBalance,
  towerOfHanoi, spellingSearch,
  stayOrFold, tumblinDice,
  rollinInTheDough, readySetWoah,
  solveForX,
];

export default CLASSIC_COMPS;

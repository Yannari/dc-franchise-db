// ══════════════════════════════════════════════════════════════════════
// bb-comps/recall.js — Who Said It? and Drunk Speeches
// ══════════════════════════════════════════════════════════════════════
//
// Two of Big Brother's season-recall Head of Household competitions, both
// HOH-only on the wiki and both deliberately kept that way here. The library
// had 21 competitions that could serve either night and 2 that could only serve
// one, which is why Thursday and Saturday felt like the same evening with a
// different prize.
//
// WHO SAID IT? (wiki rules, confirmed): the houseguests are read a series of
// statements and score a point for naming who said each one. Most points wins.
//
// DRUNK SPEECHES (wiki rules, confirmed): a speech is played back SLOWED DOWN,
// so the speaker sounds drunk, and the houseguests write down which day it
// happened. Most correct wins.
//
// Both read `_recall.js`, which only hands over statements exactly one
// houseguest could have made — see the uniqueness rule there.
import { pStats, pronouns } from '../players.js';
import { beat, choose, clamp, makePicker, toResult } from './_shared.js';
import { attentionOf, castSeen, contextFacts, momentFacts, optionsFor, recallFacts } from './_recall.js';

/**
 * The floor, for a house with no past to be asked about.
 *
 * Only reachable outside a real season — a competition drawn in week two still
 * has a week of ledger and the live week on top of it. But the library's smoke
 * test runs every competition against an empty house, and a competition that
 * responds by narrating nothing at all is indistinguishable from a broken one.
 * So the field is asked how well it knows the room it is standing in, which is
 * the only honest question available when nothing has happened yet.
 */
function noSeasonYet(participants, beats, api, rng, luck, score) {
  beats.push(beat(
    'There is barely a season to be asked about yet, so the round is about the room instead: everybody writes down what they think they know about the people standing next to them.',
    participants.slice(0, 3), 'TOO EARLY TO REMEMBER', 'grey'));
  for (const name of participants) {
    const read = attentionOf(name, statOf);
    const roll = rng();
    luck[name] = round2((luck[name] || 0) + (read - roll));
    if (roll < read) score[name]++;
  }
  const best = [...participants].sort((a, b) => (score[b] || 0) - (score[a] || 0))[0];
  beats.push(beat(
    `${best} knows this house better than anybody else standing in it, which on a night with nothing to recall is the whole competition.`,
    [best], 'FIRST IMPRESSIONS', 'challenge'));
}

const round2 = v => Math.round(v * 100) / 100;
const statOf = name => pStats(name) || {};

/** Ranked from a running score, with the score riding in the decimals. */
function rankByScore(names, score) {
  const placements = [...names].sort((a, b) => (score[b] || 0) - (score[a] || 0));
  return placements.map((name, idx) => ({
    name,
    score: round2((placements.length - idx) * 10 + clamp(score[name] || 0, 0, 9.9)),
    threw: false,
    base: round2(score[name] || 0),
  }));
}

/**
 * Answer one question.
 *
 * A guess on three options is worth a third before anybody knows anything, and
 * attention takes it the rest of the way — capped short of certainty, because a
 * competition nobody can lose is not one.
 */
function answer(name, options, truthIndex, rng, luck) {
  const read = attentionOf(name, statOf);
  const chance = clamp(1 / options.length + read * 0.58, 0, 0.92);
  const roll = rng();
  luck[name] = round2((luck[name] || 0) + (chance - roll));
  const right = roll < chance;
  const given = right ? truthIndex
    : (truthIndex + 1 + Math.floor(rng() * (options.length - 1))) % options.length;
  return { right, given, read: round2(read) };
}

// ══════════════════════════════════════════════════════════════════════
// Who Said It?
// ══════════════════════════════════════════════════════════════════════

const WSI_HOST = [
  'The next one goes up on the screen and half the room mouths it back.',
  'Boards down. Nobody is allowed to look along the line.',
  'The statement is read out twice. It does not help.',
  'The room goes quiet in the way a room goes quiet when everybody is guessing.',
  'Somebody at the end of the line has already written a name and crossed it out.',
];

const WSI_RIGHT = [
  (n, s) => `${n} writes ${s} without waiting for the second reading.`,
  (n, s) => `${n} has ${s} down before the sentence is finished. Right.`,
  (n, s) => `${n} thinks about it, changes nothing, and turns the board around. ${s}.`,
  (n, s) => `${n} gets there — ${s} — and does a bad job of hiding how pleased ${n} is about it.`,
];

const WSI_WRONG = [
  (n, s, t) => `${n} writes ${s}. It was ${t}, and the groan along the line arrives before the answer does.`,
  (n, s, t) => `${n} goes with ${s} and is wrong by one whole houseguest. ${t} said it.`,
  (n, s, t) => `${n} guesses ${s}. ${t} looks personally insulted about it.`,
  (n, s, t) => `${n} had ${t} written down, crossed it out, and wrote ${s} instead.`,
];

export const whoSaidIt = {
  id: 'bb-recall-who-said-it',
  name: 'Who Said It?',
  category: 'quiz',
  types: ['hoh', 'tiebreaker'],
  variant: 'who-said-it',
  weight: () => 1,
  desc: 'Every houseguest takes a numbered station with a board and a marker while a series of statements about this season is read out to the room, each one something a single houseguest in this house could truthfully say about their own game. For each statement they write down which of three named houseguests said it, boards stay face down until the horn, and a wrong name simply scores nothing rather than eliminating anybody. The statements are drawn from what has actually happened in the house — who ran a week, who came off the block, who walked out of the door — and the houseguest with the most correct answers at the end wins Head of Household.',
  stats: { mental: 0.42, intuition: 0.30, social: 0.18, temperament: 0.10 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const host = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const score = Object.fromEntries(participants.map(n => [n, 0]));
    participants.forEach(n => { luck[n] = 0; });

    // Only statements that are true of exactly one houseguest, and never one
    // about somebody still standing at their own station being asked to
    // identify themselves — that is a free point, not a question.
    // Topped up from the live week, so a competition drawn in week two asks
    // about the week it is standing in rather than running to two questions.
    const pool = [...recallFacts(), ...contextFacts(context)].filter(f => f.subject);
    const cast = [...new Set([...castSeen(), ...participants])];
    const asked = [];
    const used = new Set();
    const rounds = Math.min(6, pool.length);

    for (let r = 0; r < rounds; r++) {
      const fresh = pool.filter(f => !used.has(f.statement));
      if (!fresh.length) break;
      const fact = fresh[Math.floor(rng() * fresh.length)];
      used.add(fact.statement);
      const { options, truthIndex } = optionsFor(fact.subject, cast, rng);
      if (options.length < 2) continue;

      const answers = {};
      participants.forEach(name => {
        const a = answer(name, options, truthIndex, rng, luck);
        answers[name] = a;
        if (a.right) score[name]++;
      });
      asked.push({ statement: fact.statement, options, truthIndex, answers, week: fact.week, kind: fact.kind });

      // One houseguest narrated per round, so a twelve-person house does not
      // print twelve lines a question.
      const spotlight = participants[Math.floor(rng() * participants.length)];
      const a = answers[spotlight];
      beats.push(beat(
        `${host(WSI_HOST)} ${fact.statement} `
        + (a.right ? say(WSI_RIGHT)(spotlight, options[truthIndex])
          : say(WSI_WRONG)(spotlight, options[a.given], options[truthIndex])),
        [spotlight], `ROUND ${r + 1}`, 'challenge'));
    }

    if (!asked.length) noSeasonYet(participants, beats, api, rng, luck, score);

    participants.forEach(name => {
      breakdown[name] = {
        correct: score[name], asked: asked.length,
        attention: round2(attentionOf(name, statOf)),
        score: round2(score[name]), threw: false,
      };
    });

    const entries = rankByScore(participants, score);
    const winner = entries[0]?.name;
    if (winner) {
      const p = pronouns(winner);
      beats.push(beat(
        asked.length
          ? `${winner} has ${score[winner]} of ${asked.length} and nobody is closer. ${p.Sub} ${p.sub === 'they' ? 'were' : 'was'} listening when it did not cost anything to listen.`
          : `${winner} takes it on a house with barely a past to be asked about.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'who-said-it-win', { correct: score[winner], asked: asked.length });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'who-said-it',
      detail: { rounds: asked },
      text: winner ? `${winner} names ${score[winner]} of ${asked.length} correctly and wins Head of Household.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Drunk Speeches
// ══════════════════════════════════════════════════════════════════════

const DS_DISTORT = [
  'The tape runs at about two-thirds speed and the voice comes out somewhere underwater.',
  'Played back slow enough that every vowel goes on twice as long as it should.',
  'The playback drags, and a perfectly composed speech turns into somebody who has had a long night.',
  'Slowed until the pauses are longer than the words, which is exactly the point.',
];

const DS_RIGHT = [
  (n, d) => `${n} writes day ${d} and sits back. Right.`,
  (n, d) => `${n} counts something off on ${n === 'they' ? 'their' : 'one'} hand, writes day ${d}, and gets it.`,
  (n, d) => `${n} recognises it before the second sentence and has day ${d} down early.`,
];

const DS_WRONG = [
  (n, d, t) => `${n} writes day ${d}. It was day ${t}, and it is not close.`,
  (n, d, t) => `${n} goes with day ${d} — one whole week out. Day ${t}.`,
  (n, d, t) => `${n} hears a week that never happened and writes day ${d}. Day ${t}.`,
];

export const drunkSpeeches = {
  id: 'bb-recall-drunk-speeches',
  name: 'Drunk Speeches',
  category: 'memory',
  types: ['hoh', 'tiebreaker'],
  variant: 'drunk-speeches',
  weight: () => 1,
  desc: 'Each houseguest stands at their own station with a board while a speech from earlier in this season is played back to the whole yard, slowed down far enough that the person who gave it sounds thoroughly drunk. They must write down which day of the season the speech was actually given, and the distortion is the difficulty — the words are all there, but the voice is barely recognisable and the delivery gives away nothing about when it happened. A wrong day scores nothing and nobody is eliminated for it. The houseguest who correctly dates the most speeches wins Head of Household.',
  stats: { mental: 0.38, temperament: 0.26, intuition: 0.24, social: 0.12 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const distort = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const score = Object.fromEntries(participants.map(n => [n, 0]));
    participants.forEach(n => { luck[n] = 0; });

    const moments = momentFacts();
    const allWeeks = [...new Set(moments.map(m => m.week))];
    const asked = [];
    const used = new Set();
    const rounds = Math.min(5, moments.length);

    for (let r = 0; r < rounds; r++) {
      const fresh = moments.filter(m => !used.has(`${m.week}|${m.kind}`));
      if (!fresh.length) break;
      const moment = fresh[Math.floor(rng() * fresh.length)];
      used.add(`${moment.week}|${moment.kind}`);
      // The options are DAYS, not people — the one comp in this family that
      // asks when instead of who.
      const { options, truthIndex } = optionsFor(moment.week, allWeeks, rng);
      if (options.length < 2) continue;

      const answers = {};
      participants.forEach(name => {
        const a = answer(name, options, truthIndex, rng, luck);
        answers[name] = a;
        if (a.right) score[name]++;
      });
      asked.push({ speech: moment.text, speaker: moment.speaker, options, truthIndex, answers, kind: moment.kind });

      const spotlight = participants[Math.floor(rng() * participants.length)];
      const a = answers[spotlight];
      beats.push(beat(
        `${distort(DS_DISTORT)} ${moment.text} `
        + (a.right ? say(DS_RIGHT)(spotlight, options[truthIndex])
          : say(DS_WRONG)(spotlight, options[a.given], options[truthIndex])),
        [spotlight], `SPEECH ${r + 1}`, 'challenge'));
    }

    if (!asked.length) noSeasonYet(participants, beats, api, rng, luck, score);

    participants.forEach(name => {
      breakdown[name] = {
        correct: score[name], asked: asked.length,
        attention: round2(attentionOf(name, statOf)),
        score: round2(score[name]), threw: false,
      };
    });

    const entries = rankByScore(participants, score);
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} dated ${score[winner]} of ${asked.length} and takes the Head of Household — off a recording of somebody who sounded nothing like themselves.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'drunk-speeches-win', { correct: score[winner], asked: asked.length });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'drunk-speeches',
      detail: { rounds: asked },
      text: winner ? `${winner} correctly dates ${score[winner]} of ${asked.length} slowed-down speeches and wins Head of Household.` : '',
    });
  },
};

export const RECALL_COMPS = [whoSaidIt, drunkSpeeches];
export default RECALL_COMPS;

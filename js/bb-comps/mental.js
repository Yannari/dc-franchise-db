// ══════════════════════════════════════════════════════════════════════
// bb-comps/mental.js — puzzles, questions and the wall of faces
// ══════════════════════════════════════════════════════════════════════
//
// The competitions where the house's biggest bodies are no help at all, which
// is exactly why they change weeks. A mental competition is how the quiet
// player who has been counted out all season suddenly holds the power.
//
// They also read the season back to the house: a quiz about who voted for whom
// is only answerable by people who were paying attention, and being seen to
// have paid attention is its own kind of exposure.

import { pronouns } from '../players.js';
import { scoreField, toResult, beat, margin, makePicker, THROW_LINES } from './_shared.js';
import { bond, memoriesOf } from '../bb-events/_read.js';

export const puzzleRace = {
  id: 'bb-mental-puzzle',
  name: 'Cut and Cover',
  category: 'puzzle',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'A puzzle that looks simple until the last four pieces, which are the only four that matter.',
  stats: { mental: 0.46, intuition: 0.22, temperament: 0.18, strategic: 0.14 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.4, context, rng });
    const beats = [];
    const leader = entries[Math.min(entries.length - 1, Math.floor(rng() * Math.min(3, entries.length)))];

    beats.push(beat(
      `Everyone gets the frame done inside two minutes and then the field stops moving all at once.`,
      participants.slice(0, 3), 'THE PUZZLE'));

    if (leader.name !== entries[0].name) {
      // Someone leads and loses it — the most Big Brother thing a puzzle can do.
      const p = pronouns(leader.name);
      beats.push(beat(
        `${leader.name} is ahead for most of it and knows ${p.sub} is ahead, which is the mistake. ${p.Sub} rushes the last corner and has to take it apart again.`,
        [leader.name], 'LED AND LOST'));
      api.popDelta(leader.name, -1);
    }

    const laggard = entries.at(-1);
    if (laggard && !laggard.threw) {
      beats.push(beat(
        `${laggard.name} is still on the same section when the horn goes and does not look up.`,
        [laggard.name], 'STRUGGLED', 'grey'));
    }
    const say = makePicker(rng);
    entries.filter(e => e.threw).forEach(e => {
      beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
    });

    const winner = entries[0];
    const m = margin(entries);
    beats.push(beat(
      m.word === 'photo finish'
        ? `${winner.name} slots the last piece maybe two seconds before the house realises the competition is over.`
        : `${winner.name} finishes clean and steps back from the board.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'puzzle-win', { margin: m.gap });

    return toResult(entries, {
      beats, breakdown, variant: 'puzzle',
      text: `${winner.name} solves Cut and Cover first.`,
    });
  },
};

export const seasonQuiz = {
  id: 'bb-mental-quiz',
  name: 'House Record',
  category: 'quiz',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Questions about this season, answerable only by houseguests who were actually watching.',
  stats: { mental: 0.40, intuition: 0.30, strategic: 0.20, social: 0.10 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `The questions are all about the last few weeks, which means the competition is really about who has been paying attention and who has been comfortable.`,
      participants.slice(0, 3), 'HOUSE RECORD'));

    // Somebody's answer reveals how closely they have been tracking the house.
    const sharp = entries[0];
    const watcher = entries.find(e => e.name !== sharp.name && memoriesOf(e.name).length > 2);
    if (watcher) {
      beats.push(beat(
        `${watcher.name} answers a question about a vote nobody thought ${pronouns(watcher.name).sub} had noticed. Two people turn around.`,
        [watcher.name], 'BEEN WATCHING'));
      // Being visibly observant is dangerous in this house.
      api.popDelta(watcher.name, 1);
      api.record(watcher.name, 'revealed-attention', {});
    }

    const wrong = entries.at(-1);
    if (wrong && !wrong.threw) {
      beats.push(beat(
        `${wrong.name} gets an early one badly wrong and spends the rest of the competition guessing against the buzzer.`,
        [wrong.name], 'OFF THE PACE', 'grey'));
    }

    const winner = entries[0];
    beats.push(beat(`${winner.name} takes it on the last question.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'quiz-win', {});

    return toResult(entries, {
      beats, breakdown, variant: 'quiz',
      text: `${winner.name} wins House Record.`,
    });
  },
};

export const memoryWall = {
  id: 'bb-mental-memory',
  name: 'The Wall of Faces',
  category: 'memory',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Every houseguest who has left, in order, with one detail changed.',
  stats: { mental: 0.44, intuition: 0.28, temperament: 0.16, strategic: 0.12 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.8, context, rng });
    const beats = [];
    const gone = (context.week?.houseAtStart || []).filter(n => !participants.includes(n));

    beats.push(beat(
      gone.length
        ? `The wall goes up with every evicted houseguest on it. Nobody enjoys looking at it, which is rather the idea.`
        : `The wall goes up. It is mostly empty, this early, and somehow that is worse.`,
      participants.slice(0, 2), 'THE WALL'));

    const rattled = entries.at(-1);
    if (rattled && gone.length) {
      beats.push(beat(
        `${rattled.name} keeps looking at one photograph instead of the puzzle, and loses about a minute to it.`,
        [rattled.name], 'DISTRACTED', 'grey'));
    }

    const winner = entries[0];
    const m = margin(entries);
    beats.push(beat(
      `${winner.name} spots the change ${m.word === 'runaway' ? 'almost immediately' : 'first'} and calls it.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'memory-win', {});

    return toResult(entries, {
      beats, breakdown, variant: 'memory',
      text: `${winner.name} wins The Wall of Faces.`,
    });
  },
};

export const MENTAL_COMPS = [puzzleRace, seasonQuiz, memoryWall];

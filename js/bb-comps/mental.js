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
import { majorityRules } from './majority-rules.js';
import { morphOMatic } from './morph-o-matic.js';
import { knockout } from './knockout.js';
import { scoreField, toResult, beat, margin, makePicker, THROW_LINES, vb } from './_shared.js';
import { bond, memoriesOf } from '../bb-events/_read.js';

export const puzzleRace = {
  id: 'bb-mental-puzzle',
  name: 'Cut and Cover',
  category: 'puzzle',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Houseguests race to fit a set of irregular pieces into one complete image. The first player to place every piece correctly and hit the buzzer wins.',
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
        `${leader.name} is ahead for most of it and knows ${p.sub} ${vb(p, 'is', 'are')} ahead, which is the mistake. ${p.Sub} ${vb(p, 'rushes', 'rush')} the last corner and has to take it apart again.`,
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

// House Record used to live here as a one-roll quiz. It is now Majority Rules —
// a real recurring competition with rounds, eliminations and a tiebreaker — and
// lives in its own file because it is far too big to sit in a shared one. The
// id (`bb-mental-quiz`) is unchanged, so the picker, the season schedule and any
// pinned week still resolve to it.
export { majorityRules } from './majority-rules.js';

// The Wall of Faces used to live here as a one-roll "spot the changed detail".
// It is now Morph 'O' Matic — a real recurring competition with a board of
// morphed faces, wrong registrations and a running clock — in its own file. The
// id (`bb-mental-memory`) is unchanged.
export { morphOMatic } from './morph-o-matic.js';

// Knockout: the most-run competition in the format's history and the only one
// where winning hands you a decision about somebody else rather than a score.
// New to the library rather than a replacement, so it carries its own id.
export { knockout } from './knockout.js';

export const MENTAL_COMPS = [puzzleRace, majorityRules, morphOMatic, knockout];

// ══════════════════════════════════════════════════════════════════════
// bb-comps/jury-quiz.js — part three, and the only comp the jury plays
// ══════════════════════════════════════════════════════════════════════
//
// Part three of the final Head of Household is a quiz, and it has been the same
// quiz since Big Brother 11: every juror records an open-ended statement, the
// two finalists are read the front half of it, and they choose which of three
// endings is the one that juror actually gave. A point each, one question per
// juror, most points wins. A tie goes to a number question on a chalkboard.
//
// The reason this belongs in the format rather than being any old quiz is what
// it MEASURES. Every other competition in the house asks whether somebody is
// strong, or quick, or good at puzzles. This one asks a finalist how well they
// know seven people they personally helped evict — and the answer is a real
// number the season has been quietly accumulating all along.
//
// So the read is not `mental`. It is:
//
//   How long were you in this house together? Did you have a bond, or did you
//   never speak? Were you in an alliance? And — the good one — did YOU put them
//   out? You know the person you blindsided better than you would like to,
//   because you spent a week thinking about exactly what they would say.
//
// A finalist who bulldozed the season and never learned anybody's name loses
// this. A floater who talked to everybody wins it. That is the correct outcome
// and no stat sort can produce it.
//
// Every statement is built from something that actually happened: the ballots
// of the week they were evicted, who held the power that night, who they were
// closest to when they walked. Nothing here is invented flavour, because a
// quiz about a season the viewer just watched cannot afford to be.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { beat, choose, clamp, makePicker, toResult } from './_shared.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const weeks = () => (Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : []);

/** The week that ended this juror's game, if the ledger recorded one. */
const evictionOf = juror => weeks().find(w => w?.evicted === juror) || null;

/**
 * Everybody who was ever in this house, for drawing plausible wrong answers.
 *
 * A decoy has to be somebody the viewer recognises or the question answers
 * itself — "was it Wayne, or was it a name you have never heard?" is not a
 * question. So decoys come from the cast, never from nowhere.
 */
function castNames() {
  const names = new Set();
  for (const w of weeks()) {
    (w?.houseAtStart || []).forEach(n => names.add(n));
    if (w?.evicted) names.add(w.evicted);
  }
  (gs.activePlayers || []).forEach(n => names.add(n));
  (gs.eliminated || []).forEach(n => names.add(n));
  return [...names].filter(Boolean);
}

/**
 * How well this finalist knows this juror, 0..1.
 *
 * The whole competition rests on this number, so it is built from behaviour
 * rather than from stats wherever it can be: weeks shared, closeness, whether
 * they ever sat on a block together, and whether the finalist is the reason the
 * juror is on the jury at all.
 */
export function readOf(finalist, juror) {
  const together = weeks().filter(w => (w.houseAtStart || []).includes(finalist)
    && (w.houseAtStart || []).includes(juror)).length;
  const shared = clamp(together / 8, 0, 1);
  const bond = clamp(Math.abs(getBond(finalist, juror)) / 7, 0, 1);
  const own = evictionOf(juror);
  // Putting somebody out means a week of working out what they would do, what
  // they would say, and who they would blame. That is knowledge, even when it
  // was not friendship.
  const votedThemOut = !!(own?.ballots || []).some(b => b.voter === finalist && b.evict === juror);
  const heldThePower = own?.hoh === finalist;
  const wits = (stat(finalist, 'mental') * 0.6 + stat(finalist, 'intuition') * 0.4) / 10;
  return clamp(
    shared * 0.26
    + bond * 0.28
    + (votedThemOut ? 0.14 : 0)
    + (heldThePower ? 0.10 : 0)
    + wits * 0.22,
    0, 0.96);
}

// ── the five things a juror is asked to finish ──
//
// Each returns { stem, truth, decoyPool } or null when the season did not
// record enough to ask it honestly. A question that has to guess at its own
// answer is worse than one fewer question.

const QUESTION_KINDS = [
  {
    key: 'blame',
    build(juror) {
      const own = evictionOf(juror);
      const votes = (own?.ballots || []).filter(b => b.evict === juror && b.voter !== juror);
      if (!votes.length) return null;
      // Whoever they name, they name from the room they left — the ledger's
      // truth, not the house's gossip.
      const truth = own.hoh && votes.some(v => v.voter === own.hoh) ? own.hoh : votes[0].voter;
      return {
        stem: `"The person I hold most responsible for me sitting on this jury is..."`,
        truth,
        decoyPool: votes.map(v => v.voter).filter(n => n !== truth),
      };
    },
  },
  {
    key: 'trust',
    build(juror) {
      const own = evictionOf(juror);
      const room = (own?.houseAtStart || []).filter(n => n !== juror);
      if (room.length < 2) return null;
      const ranked = [...room].sort((a, b) => getBond(juror, b) - getBond(juror, a));
      if (getBond(juror, ranked[0]) <= 0) return null;
      return {
        stem: `"The one person in that house I actually trusted was..."`,
        truth: ranked[0],
        decoyPool: ranked.slice(1),
      };
    },
  },
  {
    key: 'power',
    build(juror) {
      const own = evictionOf(juror);
      if (!own?.hoh) return null;
      return {
        stem: `"The week I went out, the person sitting in the Head of Household room was..."`,
        truth: own.hoh,
        decoyPool: (own.houseAtStart || []).filter(n => n !== own.hoh && n !== juror),
      };
    },
  },
  {
    key: 'block',
    build(juror) {
      const own = evictionOf(juror);
      const beside = (own?.nominees || []).filter(n => n !== juror);
      if (!beside.length) return null;
      return {
        stem: `"The person sitting next to me on that block was..."`,
        truth: beside[0],
        decoyPool: (own.houseAtStart || []).filter(n => n !== juror && !beside.includes(n)),
      };
    },
  },
  {
    key: 'saved',
    build(juror) {
      const own = evictionOf(juror);
      if (!own?.vetoWinner || own.vetoWinner === juror) return null;
      return {
        stem: `"The person holding the veto the week I was evicted — the one who could have taken me down — was..."`,
        truth: own.vetoWinner,
        decoyPool: (own.houseAtStart || []).filter(n => n !== juror && n !== own.vetoWinner),
      };
    },
  },
];

/** Three endings, one of them true, in an order the rng decides. */
function optionsFor(question, rng, cast, juror) {
  const pool = [...new Set([...(question.decoyPool || []), ...cast])]
    // Never offer the juror themselves as an ending to their own statement:
    // "the person I hold responsible is... me" answers itself, and reads as a
    // bug the moment anybody sees it on the board.
    .filter(n => n && n !== question.truth && n !== juror);
  const decoys = [];
  while (decoys.length < 2 && pool.length) {
    decoys.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  const options = [question.truth, ...decoys];
  // Deterministic shuffle on the competition's own rng.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, truthIndex: options.indexOf(question.truth) };
}

// Every line leads with the houseguest's name.
//
// Both finalists are narrated back to back in one beat, so a variant that
// opened on a bare verdict produced "…and locks it in. Right. Wrong. Priya
// spent a season managing Gus" — two verdicts colliding with no subject
// between them. Naming first also stops the reader having to work out which of
// the two people at the podiums a sentence is about.
const RIGHT = [
  (n, j, p) => `${n} does not hesitate — ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} exactly what ${j} thinks, and says so.`,
  (n, j, p) => `${n} takes a second, decides ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} ${j} better than that, and locks it in. Right.`,
  (n, j) => `${n} gets there — and the small nod ${j} gives from the jury bench confirms it before the answer is read out.`,
  (n, j, p) => `${n} answers like somebody who spent a week thinking about ${j}, which is exactly what ${p.sub} did.`,
  (n, j, p) => `${n} was listening, back when listening cost ${p.obj} nothing. Right.`,
  (n, j) => `${n} barely looks at the board. Some of these ${n} could have answered in week three.`,
];

const WRONG = [
  (n, j) => `${n} guesses, and guesses wrong. ${j} does not react at all, which is somehow worse.`,
  (n, j, p) => `${n} gets it wrong and knows it the moment ${p.sub} ${p.sub === 'they' ? 'see' : 'sees'} ${j}'s face.`,
  (n, j, p) => `${n} picks the answer ${p.sub} would have given. ${j} is not ${n}, and that is the entire problem.`,
  // `jp` is the JUROR's pronoun. Reaching for the finalist's produced "Priya
  // spent a season managing Gus and never once asked her anything", where
  // "her" is Priya — two people in one sentence and the wrong one referred to.
  (n, j, p, jp) => `${n} spent a season managing ${j} and never once asked ${jp.obj} anything. Wrong.`,
  (n, j) => `${n} goes with the safe one. ${j} was never the safe one.`,
  (n, j, p) => `${n} works it out from the game rather than from the person, which is how ${p.sub} got here and why ${p.sub} ${p.sub === 'they' ? 'get' : 'gets'} this one wrong.`,
];

const TIEBREAK_LINES = [
  'Level after every juror. The chalkboards come out.',
  'Dead level. Somebody has to answer a number.',
  'Tied, with the whole jury watching. One question, no options, closest wins.',
];

export const juryStatements = {
  id: 'bb-final-part-three',
  name: 'Jury Statements',
  category: 'quiz',
  types: ['final'],
  finalRole: 'quiz',
  weight: () => 1,
  desc: 'Every member of the jury has recorded a statement about their own game with the ending cut off, and the two finalists are read the front half of each one live. For every juror they must choose which of three endings is the one that juror actually gave — who they blame for their eviction, who they trusted, who held the power the week they went — and a correct answer is worth a point. The statements are read out in the jury\'s own words with the jury sitting there listening, so a wrong answer is delivered to the person it is about. Whoever has the most points after every juror has been read wins the final Head of Household, and a tie is settled by a single number question with no options at all.',
  stats: { mental: 0.30, intuition: 0.34, social: 0.28, temperament: 0.08 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const finalists = [...participants];
    const cast = castNames();

    // The jury, as the finale seats it. Falls back to whoever the context knows
    // about so the competition can still be run standalone.
    const jury = (context?.jury || gs.jury || [])
      .filter(n => n && !finalists.includes(n));

    const score = Object.fromEntries(finalists.map(n => [n, 0]));
    const questions = [];
    const askedKinds = new Set();
    // Banked up front so every player has a finite luck figure even in the
    // degenerate cases below, where nobody may end up rolling at all.
    finalists.forEach(name => { luck[name] = 0; });

    // One question per juror, in the order they were evicted, because that is
    // the order the jury walked out of the house in and the audience remembers.
    for (const juror of jury) {
      const kinds = QUESTION_KINDS
        .map(kind => ({ kind: kind.key, q: kind.build(juror) }))
        .filter(entry => entry.q);
      if (!kinds.length) continue;
      // Prefer a shape this quiz has not used yet. Seven jurors and five shapes
      // means repeats are unavoidable, but drawing blind asked two consecutive
      // jurors who held the veto, which makes the board look like it only knows
      // one question.
      const unused = kinds.filter(entry => !askedKinds.has(entry.kind));
      const from = unused.length ? unused : kinds;
      const picked = from[Math.floor(rng() * from.length)];
      askedKinds.add(picked.kind);
      const { options, truthIndex } = optionsFor(picked.q, rng, cast, juror);
      if (options.length < 2) continue;

      const answers = {};
      for (const finalist of finalists) {
        const read = readOf(finalist, juror);
        // A guess is worth 1/3 on three options; knowing them takes it the rest
        // of the way. Nobody is ever certain — the last question of the season
        // has to be losable by the person who deserves to win it.
        const chance = clamp(1 / options.length + read * 0.62, 0, 0.94);
        const roll = rng();
        luck[finalist] = round2((luck[finalist] || 0) + (chance - roll));
        const right = roll < chance;
        const answer = right
          ? truthIndex
          : (truthIndex + 1 + Math.floor(rng() * (options.length - 1))) % options.length;
        answers[finalist] = { answer, right, read: round2(read), chance: round2(chance) };
        if (right) score[finalist]++;
      }

      questions.push({ juror, kind: picked.kind, stem: picked.q.stem, options, truthIndex, answers });

      const p0 = pronouns(finalists[0]);
      const p1 = finalists[1] ? pronouns(finalists[1]) : p0;
      const jp = pronouns(juror);
      const lineFor = (finalist, p) => (answers[finalist].right
        ? say(RIGHT)(finalist, juror, p, jp)
        : say(WRONG)(finalist, juror, p, jp));
      beats.push(beat(
        `${juror}: ${picked.q.stem} — ${options.map((o, i) => `${'ABC'[i]}. ${o}`).join('  ')} `
        + `${lineFor(finalists[0], p0)}`
        + (finalists[1] ? ` ${lineFor(finalists[1], p1)}` : '')
        + ` The answer was ${options[truthIndex]}.`,
        [juror, ...finalists],
        `${score[finalists[0]]}–${finalists[1] ? score[finalists[1]] : 0}`,
        answers[finalists[0]].right === (finalists[1] ? answers[finalists[1]].right : false) ? 'challenge' : 'gold'));
    }

    // ── when there is no bench to quote ──
    //
    // The finale always seats a jury, so this is the case that only shows up
    // when the competition is run outside its slot — a smoke test, a season
    // played without a jury, a ledger too thin to build a statement from. It
    // still has to produce a playable competition rather than a winner and no
    // narration, so it falls back to the other thing part three has always been
    // allowed to be: questions about the house itself.
    if (questions.length < 2) {
      const facts = [];
      for (const w of weeks()) {
        const num = Number(w?.num) || facts.length + 1;
        if (w?.hoh) facts.push({ stem: `"In week ${num}, the Head of Household was..."`, truth: w.hoh, decoyPool: w.houseAtStart || [] });
        if (w?.evicted) facts.push({ stem: `"The houseguest who walked out of that door in week ${num} was..."`, truth: w.evicted, decoyPool: w.houseAtStart || [] });
      }
      while (questions.length < Math.min(5, facts.length)) {
        const fact = facts.splice(Math.floor(rng() * facts.length), 1)[0];
        const { options, truthIndex } = optionsFor(fact, rng, cast, null);
        if (options.length < 2) continue;
        const answers = {};
        for (const finalist of finalists) {
          const wits = (stat(finalist, 'mental') * 0.6 + stat(finalist, 'intuition') * 0.4) / 10;
          const chance = clamp(1 / options.length + wits * 0.5, 0, 0.94);
          const roll = rng();
          luck[finalist] = round2((luck[finalist] || 0) + (chance - roll));
          const right = roll < chance;
          answers[finalist] = { answer: right ? truthIndex : (truthIndex + 1) % options.length, right, read: 0, chance: round2(chance) };
          if (right) score[finalist]++;
        }
        questions.push({ juror: null, kind: 'house', stem: fact.stem, options, truthIndex, answers });
        beats.push(beat(
          `${fact.stem} — ${options.map((o, i) => `${'ABC'[i]}. ${o}`).join('  ')} `
          + finalists.map(f => `${f} ${answers[f].right ? 'has it' : 'does not'}.`).join(' ')
          + ` The answer was ${options[truthIndex]}.`,
          [...finalists], `${finalists.map(f => score[f]).join('–')}`, 'challenge'));
      }
    }

    // ── the chalkboard ──
    //
    // Runs for a tie, and runs as the floor: a competition with no bench to
    // quote and no season on record still has to be playable, and a number
    // question needs neither. Everybody writes, closest wins.
    const votesCast = weeks().reduce((sum, w) => sum + (w.ballots || []).length, 0);
    const board = votesCast > 0
      ? { question: 'How many votes have been cast in this house all season?', target: votesCast }
      : { question: 'How many houseguests walked through that door on the first night?',
        target: Math.max(castNames().length, finalists.length) };

    let tiebreak = null;
    const allLevel = finalists.every(n => score[n] === score[finalists[0]]);
    if (allLevel && (finalists.length === 2 || !questions.length)) {
      const guesses = {};
      for (const finalist of finalists) {
        const grasp = (stat(finalist, 'mental') * 0.5 + stat(finalist, 'strategic') * 0.5) / 10;
        const drift = (rng() - 0.5) * 2 * Math.max(2, board.target * (0.55 - grasp * 0.4));
        guesses[finalist] = Math.max(0, Math.round(board.target + drift));
      }
      // Ranked by closeness so a field of any size resolves, with the margins
      // kept small enough that the quiz itself still decides a normal night.
      const ranked = [...finalists].sort((a, b) =>
        Math.abs(guesses[a] - board.target) - Math.abs(guesses[b] - board.target));
      ranked.forEach((name, i) => { score[name] += Math.max(0, 0.5 - i * 0.05); });
      tiebreak = { question: board.question, target: board.target, guesses, winner: ranked[0] };
      beats.push(beat(
        `${choose(rng, TIEBREAK_LINES)} "${board.question}" `
        + ranked.slice(0, 4).map(n => `${n} writes ${guesses[n]}.`).join(' ')
        + ` The answer is ${board.target}, and ${ranked[0]} is closest.`,
        [...finalists], 'THE TIEBREAKER', 'red'));
    }

    const placements = [...finalists].sort((a, b) => score[b] - score[a]);
    const winner = placements[0];
    const wp = pronouns(winner);
    beats.push(beat(
      `${winner} is the final Head of Household, and ${wp.sub} ${wp.sub === 'they' ? 'get' : 'gets'} the only decision left in this game: who to sit beside.`,
      [winner], 'FINAL HOH', 'gold'));

    finalists.forEach(name => {
      breakdown[name] = {
        correct: Math.floor(score[name]),
        asked: questions.length,
        // What the season says this finalist knew about the people on that
        // bench, averaged — the number the whole competition is really about.
        juryRead: round2(jury.length
          ? jury.reduce((sum, j) => sum + readOf(name, j), 0) / jury.length : 0),
        tiebreakGuess: tiebreak?.guesses?.[name] ?? null,
        score: round2(score[name]), threw: false,
      };
    });

    api.popDelta(winner, 3);
    api.record(winner, 'final-hoh-win', { correct: Math.floor(score[winner]), asked: questions.length });

    const entries = placements.map((name, idx) => ({
      name,
      score: round2((placements.length - idx) * 10 + clamp(score[name], 0, 9.9)),
      threw: false,
      base: round2(score[name]),
    }));

    return toResult(entries, {
      luck, beats, breakdown, variant: 'jury-statements',
      // Carried so the finale screen can put the board up: every statement, both
      // answers, and which one was true.
      detail: { questions, tiebreak },
      text: `${winner} answers ${Math.floor(score[winner])} of ${questions.length} jury statements correctly and wins the final Head of Household.`,
    });
  },
};

export const JURY_QUIZ_COMPS = [juryStatements];
export default JURY_QUIZ_COMPS;

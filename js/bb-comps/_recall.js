// ══════════════════════════════════════════════════════════════════════
// bb-comps/_recall.js — turning the season into questions with one answer
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother runs a whole family of competitions that are just "were you
// paying attention": Who Said It?, Drunk Speeches, Diary Room Confessions,
// Name That Speech, Where Were You?, What Competition Was That?. Every one of
// them asks the house about the house.
//
// The obvious way to build them is to quote what people actually said, and it
// does not work yet. Measured over eight played weeks: three weeks produced
// last words, seven single-speaker quoted beats in total, and the lines
// REPEATED — "I don't know if I'm playing this right" was said by two different
// houseguests five weeks apart. A quiz built by harvesting those asks "who said
// this?" about a sentence two people said, which is not a question.
//
// So the statements are COMPOSED from the record instead, and the rule that
// makes that honest is:
//
//   A STATEMENT IS ONLY USED IF EXACTLY ONE HOUSEGUEST COULD HAVE SAID IT.
//
// "I was on the block in week four" is true of two people and is thrown away.
// "I came off that block in week four" is true of one. Every fact below is
// checked against the whole cast before it is offered, so a question can never
// have two right answers — which is the failure that killed the quoting
// version, arriving through a different door.
//
// The other rule is about early weeks. A season two weeks old has almost no
// past, and a quiz that pads itself out of a thin record starts inventing.
// These builders return FEWER questions rather than vaguer ones, and every
// competition that uses them is written to run short.
import { gs } from '../core.js';

const weeksOf = () => (Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : []);
const nameOf = v => (typeof v === 'string' ? v : (v && typeof v.name === 'string' ? v.name : null));

/** Everybody who has been in this house, for decoys. */
export function castSeen() {
  const names = new Set();
  for (const w of weeksOf()) {
    (w?.houseAtStart || []).forEach(n => names.add(n));
    if (nameOf(w?.evicted)) names.add(nameOf(w.evicted));
  }
  (gs.activePlayers || []).forEach(n => names.add(n));
  (gs.eliminated || []).forEach(n => names.add(n));
  return [...names].filter(Boolean);
}

/**
 * Every first-person claim the season can support, with the one houseguest it
 * belongs to.
 *
 * `statement` is written to be said out loud by the person it is about, because
 * that is what these competitions put on the screen. `week` is carried so the
 * day-recall competitions can ask WHEN instead of WHO from the same material.
 */
const ordinalOf = n => {
  const teen = n % 100;
  if (teen >= 11 && teen <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
};

export function recallFacts() {
  const raw = [];
  // A running view of what has been added, so the eviction-order statement can
  // count the evictions before it without walking the ledger twice.
  const out = raw;
  const add = (subject, week, kind, statement) => {
    if (subject && Number.isFinite(week) && statement) raw.push({ subject, week, kind, statement });
  };

  weeksOf().forEach((w, i) => {
    const num = Number(w?.num) > 0 ? Number(w.num) : i + 1;
    const hoh = nameOf(w?.hoh);
    const veto = nameOf(w?.vetoWinner);
    const evicted = w?.evictionReversed ? null : nameOf(w?.evicted);
    const noms = (w?.nominees || []).map(nameOf).filter(Boolean);
    const finalNoms = (w?.finalNominees || []).map(nameOf).filter(Boolean);

    add(hoh, num, 'hoh', `"I ran this house in week ${num}. I put two people on that block and I slept upstairs."`);
    add(veto, num, 'veto', `"I pulled the veto out of that box in week ${num}."`);
    add(evicted, num, 'evicted', `"I walked out of that door in week ${num}, and the audience was very kind about it."`);

    // Who came OFF the block — one person, unlike "was nominated", which is two.
    if (finalNoms.length && noms.length) {
      const saved = noms.find(n => !finalNoms.includes(n));
      add(saved, num, 'saved', `"I was sitting on that block in week ${num} and somebody took me off it."`);
      const replacement = finalNoms.find(n => !noms.includes(n));
      add(replacement, num, 'replacement', `"I was not even nominated in week ${num} until the veto meeting ended."`);
    }

    // The nominee who survived the vote — also exactly one person.
    const chairs = finalNoms.length ? finalNoms : noms;
    if (evicted && chairs.length === 2) {
      const survived = chairs.find(n => n !== evicted);
      add(survived, num, 'survived', `"I sat in that chair in week ${num} and watched somebody else leave."`);
      // ── and two that only an evicted houseguest can say ──
      //
      // The wiki's rule for this competition is that the statements are about
      // the EVICTED houseguests, and the kinds above only produce an evicted
      // subject when that person happened to hold power before they went. A
      // season could reach the quiz with one usable statement. These two exist
      // for every eviction there has ever been, and both are unique by
      // construction: only one person left beside a given houseguest, and only
      // one person is the third out.
      const beside = chairs.find(n => n !== evicted);
      if (beside) add(evicted, num, 'beside', `"I was sitting on that block next to ${beside} the night I left."`);
    }
    if (evicted) {
      const order = out.filter(f => f.kind === 'order').length + 1;
      add(evicted, num, 'order', `"I was the ${ordinalOf(order)} houseguest voted out of this house."`);
    }
  });

  // ── the uniqueness gate ──
  //
  // Two houseguests can end up with the same sentence — a repeated week number
  // in a rebuilt ledger, a name appearing twice — and one duplicate is enough
  // to make a competition unscoreable. Cheaper to drop it than to detect it on
  // screen.
  const bySentence = new Map();
  for (const f of raw) {
    const seen = bySentence.get(f.statement);
    if (!seen) bySentence.set(f.statement, f);
    else if (seen.subject !== f.subject) bySentence.set(f.statement, null);
  }
  return [...bySentence.values()].filter(Boolean);
}

/**
 * Statements about the week being played right now.
 *
 * The season-recall competitions can be drawn in week two, when the ledger
 * holds one week and the quiz would run to two questions. These top it up from
 * the live week — who is upstairs, who is in the chairs, who is holding the
 * veto — which is still the house asking about the house rather than the
 * competition inventing a past that has not happened.
 */
export function contextFacts(context) {
  const out = [];
  const week = Number(context?.week?.num) || (weeksOf().length + 1);
  const hoh = nameOf(context?.hoh);
  const noms = (context?.nominees || []).map(nameOf).filter(Boolean);
  if (hoh) out.push({ subject: hoh, week, kind: 'live-hoh', statement: `"I am the Head of Household this week, and I have been upstairs since Thursday."` });
  if (noms.length === 2) {
    // Two nominees share "I am on the block", so neither is usable — but the
    // pair is unique to each of them the other way round.
    out.push({ subject: noms[0], week, kind: 'live-nom', statement: `"I am sitting on that block this week, next to ${noms[1]}."` });
    out.push({ subject: noms[1], week, kind: 'live-nom', statement: `"I am sitting on that block this week, next to ${noms[0]}."` });
  }
  return out;
}

/**
 * Facts phrased as a moment rather than a claim, for the day-recall comps.
 *
 * Drunk Speeches plays a speech back and asks which DAY it happened, so the
 * material has to be a describable event with a week attached rather than a
 * sentence somebody said.
 */
// A speech is a KIND of speech, and every week's is worded differently.
//
// One canned sentence per kind meant a five-round competition played the exact
// same recording twice — the same nomination speech offered as two separate
// questions, which tells the viewer the rounds are decoration. The week number
// picks the wording, so a given week always sounds the same on replay and no
// two weeks sound alike.
const SPEECH_LINES = {
  noms: [
    `"It was nothing personal. I had to nominate somebody, and this week it's the two of you."`,
    `"If you're sitting in one of those chairs, it's because of where I am in this game, not where you are."`,
    `"I want you both to know I thought about every single person in this house before I landed on you two."`,
    `"I'm not going to stand here and pretend this was hard. It wasn't. You two made it easy."`,
  ],
  veto: [
    `"I've decided to use the Power of Veto — and I've thought about this a lot longer than any of you think I have."`,
    `"I've thought about this all week, and I've decided not to use the Power of Veto."`,
    `"There's a version of this where I do the safe thing. This is not going to be that version."`,
    `"Everybody in this yard has asked me for this. Only one of you asked me without asking."`,
  ],
  goodbye: [
    `"You all know where I stand. Whatever happens tonight, I'm not going to beg any of you."`,
    `"I've had the best few weeks of my life in here, and I'd still write half your names down."`,
    `"If I go tonight, I go knowing exactly who did it, and so do you."`,
    `"I'm not going to make a speech. You've all made up your minds and I'd rather keep the dignity."`,
  ],
};

export function momentFacts() {
  const out = [];
  const lineFor = (kind, week) => SPEECH_LINES[kind][week % SPEECH_LINES[kind].length];
  weeksOf().forEach((w, i) => {
    const num = Number(w?.num) > 0 ? Number(w.num) : i + 1;
    const hoh = nameOf(w?.hoh);
    const veto = nameOf(w?.vetoWinner);
    const evicted = w?.evictionReversed ? null : nameOf(w?.evicted);
    if (hoh) out.push({ week: num, speaker: hoh, kind: 'noms', text: lineFor('noms', num) });
    if (veto) out.push({ week: num, speaker: veto, kind: 'veto', text: lineFor('veto', num) });
    if (evicted) out.push({ week: num, speaker: evicted, kind: 'goodbye', text: lineFor('goodbye', num) });
  });
  return out;
}

/**
 * Three options, one true, in an order the competition's own rng decides.
 *
 * `exclude` keeps the subject of a statement out of their own decoy pool and
 * keeps a competition from offering the person being asked as an answer to a
 * question about themselves.
 */
export function optionsFor(truth, pool, rng, exclude = []) {
  const banned = new Set([truth, ...exclude].filter(Boolean));
  const candidates = [...new Set(pool)].filter(n => n && !banned.has(n));
  const decoys = [];
  while (decoys.length < 2 && candidates.length) {
    decoys.push(candidates.splice(Math.floor(rng() * candidates.length), 1)[0]);
  }
  const options = [truth, ...decoys];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, truthIndex: options.indexOf(truth) };
}

/**
 * How well this houseguest was paying attention, 0..1.
 *
 * Deliberately not `mental` alone. Somebody who has spent the season in every
 * room where a decision was made knows more of the answers than somebody
 * cleverer who was asleep — so the season's own record of who was IN the house
 * for the weeks being asked about is part of the read.
 */
export function attentionOf(name, statPick) {
  const s = statPick(name);
  const weeksHere = weeksOf().filter(w => (w?.houseAtStart || []).includes(name)).length;
  const total = Math.max(1, weeksOf().length);
  const present = weeksHere / total;
  return Math.max(0, Math.min(1,
    (Number(s.mental) || 0) / 10 * 0.45
    + (Number(s.intuition) || 0) / 10 * 0.30
    + present * 0.25));
}


/**
 * Numbers a house can be asked for when a quiz ends level.
 *
 * The wiki's rule, and it is the same for every quiz in this format: when the
 * questions run out and the top is tied, the competition goes to a number, and
 * if every houseguest writes the SAME number the question is nullified and
 * another one is asked. The examples given are "the number of seconds the
 * houseguests have lived in the house" and "the weight in pounds of an object"
 * — a quantity nobody can deduce and everybody can estimate.
 *
 * Counted off the real ledger, so the answer is checkable rather than invented.
 */
export const TIEBREAK_QUESTIONS = [
  { text: 'How many days have the houseguests been living in this house?',
    target: () => Math.max(1, (gs.bb?.weeks?.length || 1) * 7) },
  { text: 'How many votes have been cast to evict, in total, all season?',
    target: () => (gs.bb?.weeks || []).reduce((n, w) => n + (w.ballots || []).length, 0) || 1 },
  { text: 'How many times has somebody been nominated in this house?',
    target: () => (gs.bb?.weeks || []).reduce((n, w) => n + (w.nominees || []).length, 0) || 1 },
];

/**
 * Break a tie at the top, the way the format does.
 *
 * Mutates `score` and pushes its own beats. Returns the tiebreak record for the
 * screen. Sorting a tie away silently — which every quiz here used to do —
 * hands the power to whoever happens to be first in the array.
 *
 * @param {object} io  { participants, score, rng, beats, beat, statOf }
 */
export function breakQuizTie({ participants, score, rng, beats, beat, statOf }) {
  const out = [];
  const top = () => Math.max(...participants.map(n => score[n] || 0));
  let tied = participants.filter(n => (score[n] || 0) === top());
  for (let attempt = 0; tied.length > 1 && attempt < 3; attempt++) {
    const q = TIEBREAK_QUESTIONS[attempt % TIEBREAK_QUESTIONS.length];
    const target = q.target();
    const guesses = {};
    for (const name of tied) {
      const st = statOf(name) || {};
      const grasp = (Number(st.mental) || 0) * 0.5 + (Number(st.strategic) || 0) * 0.5;
      const drift = (rng() - 0.5) * 2 * Math.max(2, target * (0.5 - grasp * 0.035));
      guesses[name] = Math.max(0, Math.round(target + drift));
    }
    if (new Set(Object.values(guesses)).size === 1) {
      beats.push(beat(
        `Tiebreaker: ${q.text} Every board says ${Object.values(guesses)[0]}. The question is thrown out and another one is asked.`,
        [...tied], 'NULLIFIED', 'grey'));
      out.push({ question: q.text, target, guesses: { ...guesses }, nullified: true });
      continue;
    }
    const closest = [...tied].sort((a, b) =>
      Math.abs(guesses[a] - target) - Math.abs(guesses[b] - target))[0];
    beats.push(beat(
      `${tied.length} houseguests are level, so it goes to a number. ${q.text} `
      + tied.map(n => `${n} writes ${guesses[n]}.`).join(' ')
      + ` It is ${target}, and ${closest} is closest.`,
      [...tied], 'TIEBREAKER', 'red'));
    out.push({ question: q.text, target, guesses: { ...guesses }, winner: closest, nullified: false });
    score[closest] = (score[closest] || 0) + 0.5;
    tied = [closest];
  }
  return out;
}

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
export function recallFacts() {
  const raw = [];
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

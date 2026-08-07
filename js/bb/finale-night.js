// ══════════════════════════════════════════════════════════════════════
// bb/finale-night.js — the half hour that decides it
// ══════════════════════════════════════════════════════════════════════
//
// The season built a jury that remembers broken deals, blindsides and who
// wrote whose name down, and then the last night read the result off a
// spreadsheet. Two finalists sat down in front of seven people who had each
// been removed from the game by one of them, and neither of them said
// anything.
//
// Three things happen here, in the order the show does them:
//
//   1. THE QUESTIONING. Each juror asks one question. Both finalists answer.
//      An answer lands or it does not, and a landed one MOVES that juror.
//   2. THE STATEMENTS. Each finalist makes their case, one last time.
//   3. AMERICA'S FAVOURITE. The only prize the house has no vote in.
//
// The load-bearing rule, and the one that makes this worth building:
//
//   A JUROR IS NOT PERSUADED BY THE BEST ANSWER. THEY ARE PERSUADED BY THE
//   ANSWER THAT MATCHES WHAT THEY VALUE.
//
// Owning a betrayal to a juror who respects gameplay lands hard. The exact
// same sentence, delivered to somebody who valued loyalty and got cut, makes
// it worse. So a finalist cannot play to the room; they can only play to the
// game they actually played, and find out on the night how many people in
// front of them wanted that game.
//
// Movement runs through `moveRead` in jury-sentiment.js rather than through a
// lock of its own. That module's rule is that conviction is HEADROOM, not a
// threshold: a juror who has spent six weeks hardening barely shifts, a
// toss-up moves a long way, and nothing anywhere says "this vote cannot
// change". A bitter juror can be given the perfect answer and still vote the
// other way, which is the honest version and the one the user asked for.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { juryValueProfile, juryTopValue } from '../finale.js';
import { readOf, stanceOf, moveRead } from './jury-sentiment.js';
import { dealBetween, tierOf } from './deals.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const weeks = () => (Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : []);

const pick = (rng, list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/**
 * A picker that will not repeat a rendered line inside one night.
 *
 * Both finalists answer every question, so a plain pick handed the same
 * reaction to both of them in the same exchange — "Gus sits back. Whatever Gus
 * came in here wanting, that was closer to it than expected," twice, about two
 * different answers, in four printed lines.
 */
function makeSayer(rng) {
  const used = new Set();
  return (list, ...args) => {
    const fresh = list.filter(fn => !used.has(fn(...args)));
    const chosen = pick(rng, fresh.length ? fresh : list);
    used.add(chosen(...args));
    return chosen(...args);
  };
}

/** The week this juror's game ended, for questions that quote it. */
const evictionOf = juror => weeks().find(w => w?.evicted === juror) || null;

/**
 * What this juror is actually carrying into the room about this finalist.
 *
 * Everything here is a fact the season recorded, because a question built out
 * of nothing is a question the viewer cannot check.
 */
export function grievanceOf(juror, finalist) {
  const own = evictionOf(juror);
  const votedMeOut = !!(own?.ballots || []).some(b => b.voter === finalist && b.evict === juror);
  const heldThePower = own?.hoh === finalist;
  const deal = dealBetween(juror, finalist);
  const brokenDeal = deal && deal.broken && deal.brokenBy === finalist ? deal : null;
  const together = weeks().filter(w => (w.houseAtStart || []).includes(finalist)
    && (w.houseAtStart || []).includes(juror)).length;
  return {
    votedMeOut, heldThePower, brokenDeal,
    week: own?.num || null,
    together,
    // Somebody they genuinely never played with cannot be asked a grievance
    // question, and pretending otherwise is how a finale invents history.
    strangers: together <= 2 && !votedMeOut && !heldThePower,
    bond: getBond(juror, finalist),
    read: readOf(juror, finalist),
    stance: stanceOf(juror, finalist),
  };
}

// ══════════════════════════════════════════════════════════════════════
// The questions
// ══════════════════════════════════════════════════════════════════════
//
// Chosen by what the juror is carrying, not at random. Each returns the
// question text and the VALUE it is really testing — which is what decides
// whether an answer lands.

const QUESTIONS = {
  betrayal: [
    (j, f, g, p) => `"You sat on my bed in week ${g.week} and told me I was safe. Then you put my name in that box. I want you to say out loud, to my face, why you did it."`,
    (j, f, g, p) => `"We shook on the end together. You broke it. Tell me it was strategy — because if you tell me it was anything else, I'm going to know you're lying."`,
    (j, f, g, p) => `"I trusted you more than anybody in that house, and I left in week ${g.week} because of it. What was I to you? Be honest."`,
  ],
  cut: [
    (j, f, g, p) => `"You wrote my name down in week ${g.week}. I'm not angry about it — I want to know whether it was your idea or whether somebody handed it to you."`,
    (j, f, g, p) => `"Talk me through the week you got me out. Whose plan was it, actually?"`,
    (j, f, g, p) => `"Everyone up there is going to claim my eviction. Convince me it was yours."`,
  ],
  power: [
    (j, f, g, p) => `"You were Head of Household the week I went home. You could have put anybody in that chair. Why me?"`,
    (j, f, g, p) => `"You had the power and you used it on me. Was that fear, or was that a plan?"`,
  ],
  resume: [
    (j, f, g, p) => `"Give me one move — one — that was yours, that nobody else in this house could have made."`,
    (j, f, g, p) => `"I watched you play for a long time and I still cannot tell you what your game WAS. Tell me now."`,
    (j, f, g, p) => `"What was the week you would have gone home, and what did you do about it?"`,
  ],
  passenger: [
    (j, f, g, p) => `"I barely saw you play. I'm not being cruel — I genuinely do not know what you did in there. Change my mind."`,
    (j, f, g, p) => `"You never had to look me in the eye and lie to me, and I think that's because you were never in a position to. Tell me I'm wrong."`,
  ],
  loyalty: [
    (j, f, g, p) => `"You kept your word to me when it cost you something. Tell these people why that isn't just weakness dressed up as a strategy."`,
    (j, f, g, p) => `"You're the only person up there who never lied to me. Was that a choice, or did you just never need to?"`,
  ],
};

/** What the room is really asking about, which decides what answers it. */
const QUESTION_VALUE = {
  betrayal: 'loyalty', cut: 'control', power: 'control',
  resume: 'control', passenger: 'challenge', loyalty: 'honesty',
};

function questionFor(juror, finalist, g) {
  if (g.brokenDeal) return 'betrayal';
  if (g.votedMeOut && g.bond >= 2) return 'betrayal';
  if (g.heldThePower) return 'power';
  if (g.votedMeOut) return 'cut';
  if (g.strangers) return 'passenger';
  if (g.bond >= 3 && g.read > 0) return 'loyalty';
  return 'resume';
}

// ══════════════════════════════════════════════════════════════════════
// The answers
// ══════════════════════════════════════════════════════════════════════

/**
 * How this finalist answers under pressure.
 *
 * Not a choice they make on the night — it is the game they played, arriving
 * at the one moment where it has to be said out loud. A player who ran the
 * house owns it; a player who was carried says so; a player with neither
 * blames somebody, which is the worst thing you can do in that chair and
 * exactly what a low-social, low-strategic houseguest does.
 */
export function answerStyle(finalist) {
  const s = pStats(finalist);
  const scores = {
    'own-it': s.strategic * 0.7 + s.boldness * 0.3,
    'relationship': s.social * 0.75 + s.loyalty * 0.25,
    'honest': s.loyalty * 0.6 + (10 - s.strategic) * 0.4,
    'deflect': (10 - s.social) * 0.5 + (10 - s.strategic) * 0.3 + (10 - s.temperament) * 0.2,
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

/** Which value each way of answering actually appeals to. */
const STYLE_VALUE = {
  'own-it': 'control', relationship: 'social', honest: 'honesty', deflect: null,
};

/**
 * Answers, keyed by style AND by what was actually asked.
 *
 * The first version keyed on style alone, and the result was a finalist
 * responding to "did you write my name down in week six" with "everyone says I
 * got carried" — a true sentence about their game and a non-answer to the
 * question, in a segment whose whole subject is whether they answered it.
 *
 * Two families is enough: a question about something you DID to this person,
 * and a question about what your game WAS. Every question kind maps to one.
 */
const ANSWER_FAMILY = {
  betrayal: 'grievance', cut: 'grievance', power: 'grievance',
  resume: 'resume', passenger: 'resume', loyalty: 'resume',
};

const ANSWERS = {
  'own-it': {
    grievance: [
      f => `"Because you were the biggest threat to my game still breathing. I'd do it again tonight, and if you'd had the chance you'd have done it to me first."`,
      f => `"It was mine. The whole thing was mine — the pitch, the count, the timing. You didn't see it coming because I spent a week making sure you wouldn't."`,
      f => `"I'm not going to stand here and apologise for playing. You're on that bench because I put you there. That's the answer."`,
      f => `"I lied to you. I lied to most of the people sitting behind you. That's the game — and I'm the one who played it best."`,
    ],
    resume: [
      f => `"Every week somebody went home, I knew about it before they did, and most weeks I'm the reason. That's the game you're asking me to describe."`,
      f => `"I was never on that block because I made sure the block was always somebody else. That is not luck. That took work, every single week."`,
      f => `"You want one move? The week you all thought you were voting together. You weren't. I'd already split you."`,
    ],
  },
  relationship: {
    grievance: [
      f => `"Because it was you or me, and I have thought about it every day since. It was the worst thing I did in there and I'm not pretending otherwise."`,
      f => `"I know what I took from you. I'm not asking you to forgive it — I'm asking you to remember that everything I did in that house, I did with people, not to them."`,
      f => `"I could have let somebody else swing the axe and kept my hands clean with you. I didn't. You deserved to hear it from me."`,
    ],
    resume: [
      f => `"I couldn't have done any of it alone, and I never pretended I could. That's my game. It's the whole of it."`,
      f => `"Every person on that bench talked to me before they voted. Every one. That doesn't happen by accident and it doesn't happen to somebody who isn't playing."`,
      f => `"My game was that people wanted me in the room. You can call that soft if you like. It got me the seat."`,
    ],
  },
  honest: {
    grievance: [
      f => `"Honestly? I didn't have the votes to save you and I knew it. I could dress that up. I'd rather just tell you."`,
      f => `"It wasn't my plan. I went along with it, and going along with it is still a choice — I'm not going to hide behind whose idea it was."`,
      f => `"I told you the truth right up until the day I couldn't, and then I told you nothing rather than lie to you. That's the best I did."`,
    ],
    resume: [
      f => `"I know what people think I am. I'm not going to invent a game I didn't play. I stayed, I kept my word, and I'm here."`,
      f => `"Everyone says I got carried. Maybe. But somebody had to decide to carry me, and they had to keep deciding it, every single week."`,
      f => `"I never lied to you. That's the only thing I can offer you tonight and I'm not going to pretend it's more than it is."`,
    ],
  },
  deflect: {
    grievance: [
      f => `"That wasn't me, that was the house. If you want to be angry at somebody, be angry at the person who brought me your name."`,
      f => `"I did what I had to do. I don't know what else you want me to say."`,
      f => `"You'd have done the same thing. Everybody here would have."`,
    ],
    resume: [
      f => `"I don't think that's a fair question, honestly."`,
      f => `"I was there the whole time. I don't know how you missed it."`,
      f => `"I'd rather you judged the whole season than one week you happened to be watching."`,
    ],
  },
};

const LANDED = [
  (j, f, p) => `${j} sits back. Whatever ${j} came in here wanting, that was closer to it than expected.`,
  (j, f, p) => `${j} does not answer for a moment, and the room notices the moment.`,
  (j, f, p) => `Something goes out of ${j}'s shoulders. It is not forgiveness. It is close enough to count tonight.`,
  (j, f, p) => `${j} nods once, slowly, in the way of somebody adjusting a decision they thought was finished.`,
];

const FLUBBED = [
  (j, f, p) => `${j}'s face does not move at all, which everybody watching understands perfectly.`,
  (j, f, p) => `"That's not what I asked you," ${j} says, and does not ask again.`,
  (j, f, p) => `${j} looks at ${f} for a long second and then looks away, and that is the whole answer.`,
  (j, f, p) => `The room goes quiet in the specific way a room goes quiet when somebody has just lost a vote.`,
];

const IMMOVABLE = [
  (j, f, p) => `${j} has known how this vote was going since the door shut, and nothing said in this room was ever going to touch it.`,
  (j, f, p) => `${j} listens politely. ${j}'s mind was made up in a lodge six weeks ago.`,
  (j, f, p) => `It is a good answer. ${j} decided a long time ago that a good answer would not be enough.`,
];

/**
 * Does this answer land?
 *
 * Match between what the answer appeals to and what this juror values, scaled
 * by the finalist's ability to deliver it — and pulled down hard by how far
 * this juror already is from them, because a hostile juror hears the same
 * sentence differently.
 */
function answerLands(juror, finalist, style, kind, rng) {
  const values = juryValueProfile(juror);
  const wanted = QUESTION_VALUE[kind] || 'control';
  const offered = STYLE_VALUE[style];
  const match = offered
    // How much this juror cares about what the answer actually appealed to,
    // plus a bonus for answering the question that was asked.
    ? (values[offered] || 0.3) * 0.5 + (offered === wanted ? 0.28 : 0)
    // Deflecting appeals to nothing. It can still work on somebody who was
    // never listening, which is why it is not zero.
    : 0.06;
  const delivery = (stat(finalist, 'social') * 0.6 + stat(finalist, 'strategic') * 0.4) / 10;
  const hostility = Math.max(0, -readOf(juror, finalist)) * 0.05;
  const chance = Math.max(0.04, Math.min(0.93, 0.18 + match * 0.55 + delivery * 0.3 - hostility));
  return { landed: rng() < chance, chance: round2(chance), match: round2(match) };
}

/**
 * The questioning.
 *
 * Runs BEFORE the vote's adjustments are computed, because the whole point is
 * that the vote reads what happened in this room.
 */
export function runJuryQuestioning({ finalTwo = [], jury = [], week = 0, rng = Math.random } = {}) {
  const exchanges = [];
  if (finalTwo.length < 2 || !jury.length) return { exchanges };

  const before = {};
  for (const juror of jury) before[juror] = Object.fromEntries(finalTwo.map(f => [f, round2(readOf(juror, f))]));

  const say = makeSayer(rng);
  // How many questions each finalist has already had to take. A juror asks the
  // person they have the most to say to, but a house where one finalist held
  // most of the power means EVERY juror has the most to say to them — and the
  // first version produced four consecutive questions to the same man while the
  // other finalist sat there and was never addressed once. The balance term
  // pushes back on that without overriding a genuine grievance.
  const askedCount = Object.fromEntries(finalTwo.map(f => [f, 0]));

  for (const juror of jury) {
    const jp = pronouns(juror);
    const grievances = Object.fromEntries(finalTwo.map(f => [f, grievanceOf(juror, f)]));
    const asked = [...finalTwo].sort((a, b) => {
      const weight = (g, n) => (g.brokenDeal ? 3 : 0) + (g.votedMeOut ? 2 : 0) + (g.heldThePower ? 1 : 0)
        + (g.strangers ? 0.5 : 0)
        // Hostility is a reason to speak to somebody.
        + Math.max(0, -g.read) * 0.25
        - askedCount[n] * 0.9
        + rng() * 0.6;
      return weight(grievances[b], b) - weight(grievances[a], a);
    })[0];
    askedCount[asked]++;
    const kind = questionFor(juror, asked, grievances[asked]);
    const question = say(QUESTIONS[kind], juror, asked, grievances[asked], jp);

    // Both answer. The one who was not asked still has to follow it, which is
    // the position everybody in that chair dreads.
    const answers = [];
    // The person who was asked answers first, then the other one has to follow
    // it. Printing them in roster order had the unasked finalist replying to a
    // question addressed to somebody else, one line above the person it was
    // actually put to.
    for (const finalist of [asked, ...finalTwo.filter(f => f !== asked)]) {
      const g = grievances[finalist];
      const style = answerStyle(finalist);
      const fp = pronouns(finalist);
      const verdict = answerLands(juror, finalist, style, kind, rng);
      // Answers the question that was asked, in the voice of the game they
      // played. Both halves matter: the style is who they are, the family is
      // whether they are responding.
      const text = say(ANSWERS[style][ANSWER_FAMILY[kind] || 'resume'], finalist);

      // Move the read. Strength is what was said; `moveRead` applies this
      // juror's remaining headroom, so a locked mind barely shifts and a
      // toss-up can swing the whole vote.
      const strength = verdict.landed
        ? (finalist === asked ? 1.5 : 0.7)
        : (finalist === asked ? -1.4 : -0.5);
      const delta = moveRead(juror, finalist, {
        strength, credibility: 1, kind: 'ftc-answer', week,
        text: `${finalist} ${verdict.landed ? 'answered' : 'failed'} ${juror}'s question at the final vote`,
      });
      // Barely moved despite a good answer — that is a mind made up, and the
      // screen should say so rather than showing a number that did not change.
      const immovable = verdict.landed && Math.abs(delta) < 0.18;
      answers.push({
        finalist, style, text, landed: verdict.landed, chance: verdict.chance,
        delta: round2(delta), immovable,
        reaction: say(immovable ? IMMOVABLE : verdict.landed ? LANDED : FLUBBED, juror, finalist, fp),
      });
    }

    exchanges.push({
      juror, asked, kind, question, answers,
      values: juryTopValue(juror),
      stanceBefore: stanceOf(juror, asked),
    });
  }

  const after = {};
  for (const juror of jury) after[juror] = Object.fromEntries(finalTwo.map(f => [f, round2(readOf(juror, f))]));

  // Who actually changed their mind in that room — the number this whole
  // segment exists to produce.
  const swung = jury.filter(j => {
    const [a, b] = finalTwo;
    const leaning = reads => (reads[a] === reads[b] ? null : (reads[a] > reads[b] ? a : b));
    return leaning(before[j]) !== leaning(after[j]);
  });

  return { exchanges, before, after, swung };
}

// ══════════════════════════════════════════════════════════════════════
// The statements
// ══════════════════════════════════════════════════════════════════════

const STATEMENTS = {
  'own-it': f => `"I'm not going to stand here and tell you I was nice to you. I ran this house. Every vote that mattered, I was in the room where it was counted, and most of them I counted. You don't have to like the person who did that. You just have to be honest about who did it."`,
  relationship: f => `"Everything I did in there, I did with somebody. I never had the numbers on my own — I had people, and I kept them, and when I couldn't keep them I told them why to their face. If that's not a game to you, then I played the wrong one. But I don't think it is."`,
  honest: f => `"I know what I look like sitting here. I'm not going to invent a résumé tonight to impress you. I told the truth more often than anybody in that house, I kept the promises I made, and I am still here. Do what you want with that."`,
  deflect: f => `"Look — this game did things to all of us. I made calls I'd take back. So did everybody behind you. I don't think I'm worse than the person next to me, and I'd rather you decided on the whole thing than on one bad week."`,
};

const STATEMENT_INTROS = [
  f => `${f} goes first, and takes a second to find the start of it.`,
  f => `${f} does not stand up. Whatever this is, it is going to be said sitting down.`,
  f => `${f} looks along the bench, one face at a time, before saying anything at all.`,
  f => `${f} has clearly had this written for a week, and it does not sound written.`,
];

/**
 * Closing statements.
 *
 * A last, small push — deliberately smaller than the questioning, because a
 * speech is delivered to the whole room and a question was asked by one person
 * about something they are still carrying. `moveRead`'s headroom does the rest:
 * this can tip a toss-up and cannot rescue a season.
 */
export function runClosingStatements({ finalTwo = [], jury = [], week = 0, rng = Math.random } = {}) {
  const statements = [];
  for (const finalist of finalTwo) {
    const style = answerStyle(finalist);
    const moved = [];
    for (const juror of jury) {
      const values = juryValueProfile(juror);
      const offered = STYLE_VALUE[style];
      const appeal = offered ? (values[offered] || 0.3) : 0.1;
      const strength = (appeal - 0.55) * 1.1 + (rng() - 0.5) * 0.4;
      const delta = moveRead(juror, finalist, {
        strength, credibility: 0.85, kind: 'ftc-statement', week,
        text: `${finalist}'s closing statement`,
      });
      if (Math.abs(delta) >= 0.12) moved.push({ juror, delta: round2(delta) });
    }
    statements.push({
      finalist, style,
      intro: pick(rng, STATEMENT_INTROS)(finalist),
      text: STATEMENTS[style](finalist),
      moved,
    });
  }
  return { statements };
}

// ══════════════════════════════════════════════════════════════════════
// The reunion
// ══════════════════════════════════════════════════════════════════════
//
// Everybody who was ever in that house is on the stage at once, for the first
// and only time, and half of them have spent a season being wrong about
// something. The vote is secret while the game is running — that is the whole
// reason the house eats itself — and this is the night the secret stops.
//
// So this segment is not a curtain call. It is the ledger being read out loud:
//
//   • A FLIP NOBODY CAUGHT. `settleBBAllianceWeek` records every ally-on-ally
//     vote with a `known` flag, and an unknown one means the victim walked out
//     of that house never learning who did it. Tonight they learn.
//   • A GRUDGE HELD AGAINST THE WRONG PERSON. When a flip goes uncaught the
//     house reaches for a plausible culprit instead, and that misattribution is
//     recorded too — with the innocent party's name on it.
//   • THE PRE-JURY. Seven people with no vote and nothing to protect, which
//     makes them the only honest witnesses in the building.
//
// And it MOVES VOTES. A juror who learns tonight that the person on the left
// wrote their name down in week four is a juror whose read has just changed,
// minutes before they cast the only ballot that pays. Revelations run through
// `moveRead` like everything else, at a lower credibility than a question asked
// face to face — this is new information, not persuasion, and headroom still
// decides how far a hardened mind travels.

const WALKONS = {
  bitter: [
    (n, p, wk) => `"Week ${wk}. I've had a long time to think about week ${wk}, and I've come to the conclusion that I was robbed by people who are worse at this than me."`,
    (n, p, wk) => `"Do I look like somebody who's made peace with it? No. Next question."`,
    (n, p, wk) => `"I'd love to say there are no hard feelings. There are several, and I've named them."`,
    (n, p, wk) => `"I watched the episodes. I know exactly what was said about me in that storage room, and I remember every name."`,
  ],
  gracious: [
    (n, p, wk) => `"I went out in week ${wk} and I've spent months telling people it was the best thing I ever did. Most of the time I even mean it."`,
    (n, p, wk) => `"They got me fair. I'd like it on the record that they got me fair, and also that I'd have got them eventually."`,
    (n, p, wk) => `"I loved being in there. I hated most of you at the time. Both of those are still true."`,
    (n, p, wk) => `"No hard feelings — genuinely. I've seen what it did to the people who stayed."`,
  ],
  baffled: [
    (n, p, wk) => `"I still don't know what happened in week ${wk}, and I have watched it back four times."`,
    (n, p, wk) => `"Somebody in this room lied to my face for a month and I have narrowed it down to everybody."`,
    (n, p, wk) => `"I thought I was in the majority. I was in a group chat of one."`,
    (n, p, wk) => `"I keep waiting for the part where it makes sense. It hasn't come yet."`,
  ],
};

const TAPE_INTROS = [
  (v, w) => `The wall lights up, and it is week ${w} again — the vote ${v} never got to see.`,
  (v, w) => `"Before we go any further," the wall says, "let's look at week ${w}." ${v} is already sitting forward.`,
  (v, w) => `They play the week ${w} ballots. All of them, in order, with the names on.`,
  (v, w) => `The screen goes to a Diary Room chair from week ${w}, and half this stage stops breathing.`,
];

const CONFESSIONS = [
  (t, v, p) => `"It was me. You spent three months thinking it was somebody else and it was me, and I let you."`,
  (t, v, p) => `"I wrote your name. I'm not going to sit here on live television and let you keep being wrong about it."`,
  (t, v, p) => `"Yeah. That one was mine." ${t} does not look away while ${p.sub} says it, which is worth something and not very much.`,
  (t, v, p) => `"You hugged me on the way out," ${t} says. "I've thought about that hug a lot."`,
];

const REACTIONS = {
  juror: [
    (v, t, p) => `${v} does not shout. ${p.Sub} looks at the person ${p.sub} is about to vote for, and then at the ballot in ${p.posAdj} hand.`,
    (v, t, p) => `"Minutes," ${v} says. "You told me that in there, and I'm finding out about it four minutes before I vote."`,
    (v, t, p) => `${v} laughs once, with nothing funny in it, and writes something on the back of ${p.posAdj} card.`,
    (v, t, p) => `${v} says nothing at all. Everybody on that bench watches ${p.obj} decide what it is worth.`,
  ],
  prejury: [
    (v, t, p) => `${v} throws both hands up. "I KNEW it. I said it in the jury house and nobody believed me — I was gone by then, I said it to a wall."`,
    (v, t, p) => `"So all that," ${v} says slowly, "the whole speech about how it wasn't you. That was a performance."`,
    (v, t, p) => `${v} stands up, thinks better of it, and sits down again, which the audience enjoys enormously.`,
    (v, t, p) => `"I don't get a vote," ${v} says. "I want everybody to notice how much I wish I did."`,
  ],
};

const REPAIRS = [
  (r, w, t) => `${r} turns to ${w}. "I have been horrible to you for two months about something you didn't do."`,
  (r, w, t) => `"${w}. I'm sorry." ${r} means it, and it is the first time all night anybody has said a sentence that short.`,
  (r, w, t) => `${r} spent a season certain it was ${w}. It was ${t}. The apology is public and it costs ${r} something to make.`,
  (r, w, t) => `"I told the whole house you flipped on me," ${r} says to ${w}. "You didn't. ${t} did, and ${t} let me say it."`,
];

const CLASHES = [
  (a, b) => `${a} and ${b} start talking at the same time and neither of them stops, and for about fifteen seconds nobody on that stage can be heard at all.`,
  (a, b) => `"Say it to me now," ${a} says to ${b}. "There's no vote left to protect. Say it now."`,
  (a, b) => `${b} tries to explain it as strategy. ${a} has heard the word strategy enough times this year and says so, loudly.`,
  (a, b) => `It takes the host twice to get between ${a} and ${b}, and even then only one of them sits down.`,
];

const OWNINGS = [
  (f, p) => `"I did it," ${f} says. "In front of all of you, before the vote, because if I win I want to have said it first."`,
  (f, p) => `${f} does not deny a word of it. "Every name on that screen, I had a hand in. That's why I'm still sitting here."`,
  (f, p) => `"I'd rather you hate me and know why," ${f} says, "than like me for something I didn't do."`,
  (f, p) => `${f} takes it standing up, which is not nothing, and does not offer anybody an excuse.`,
];

const DUCKINGS = [
  (f, p) => `${f} calls it a group decision. Four people on that bench say the group's name at the same time and it is not a flattering noise.`,
  (f, p) => `"It wasn't like that," ${f} says, to a stage that has just watched the tape of it being exactly like that.`,
  (f, p) => `${f} explains for a while. Nobody interrupts, which is worse than being interrupted.`,
  (f, p) => `"I don't remember it that way," ${f} says, and lets it sit there.`,
];

/** Every ally-on-ally flip the season recorded, with the week attached. */
function betrayalLedger() {
  const out = [];
  for (const w of weeks()) {
    for (const inc of (w?.allianceChanges?.betrayals || [])) {
      if (inc?.voter && inc?.victim) out.push({ ...inc, num: Number(w.num) || Number(inc.week) || 0 });
    }
  }
  return out;
}

/**
 * The reunion.
 *
 * Runs after the questioning and before the closing statements, so anything it
 * reveals is still in the room when the last speeches are made — and, more to
 * the point, before anybody votes.
 */
export function runReunion({ finalTwo = [], jury = [], prejury = [], week = 0, rng = Math.random } = {}) {
  const segments = [];
  const moved = [];
  const onStage = [...new Set([...prejury, ...jury])].filter(Boolean);
  if (!onStage.length) return { segments, moved };

  // Deduped on the TEMPLATE, not on the rendered line.
  //
  // `makeSayer` compares finished sentences, which is right for the
  // questioning — two finalists answering the same juror produce the same
  // string. Here every line carries a different name, so the same template
  // rendered for two different jurors is two different strings and the sayer
  // let both through: "Minutes," Gus says… followed immediately by "Minutes,"
  // Fern says…
  const used = new Set();
  const say = (list, ...args) => {
    const fresh = list.filter(fn => !used.has(fn));
    const from = fresh.length ? fresh : list;
    const chosen = from[Math.min(from.length - 1, Math.floor(rng() * from.length))];
    used.add(chosen);
    return chosen(...args);
  };
  const isJuror = name => jury.includes(name);
  const isFinalist = name => finalTwo.includes(name);
  const exitWeek = name => evictionOf(name)?.num || 0;

  // ── the walk-on ──
  //
  // The pre-jury only. The jury has been on camera all night and is about to be
  // asked to vote; these are the people the finale normally never hears from.
  for (const name of prejury.slice(0, 6)) {
    const p = pronouns(name);
    const s = pStats(name);
    // How they wear it: bitterness is low temperament and a real grievance,
    // grace is high loyalty, and being baffled is what happens to somebody who
    // never saw the house they were living in.
    const tone = (s.intuition || 5) <= 4 ? 'baffled'
      : (s.temperament || 5) <= 4 && getBond(name, finalTwo[0]) < 2 ? 'bitter'
        : 'gracious';
    segments.push({
      kind: 'walkon', speaker: name, players: [name], tone,
      text: say(WALKONS[tone], name, p, exitWeek(name) || week),
      badgeText: tone === 'bitter' ? 'STILL ANGRY' : tone === 'baffled' ? 'STILL CONFUSED' : 'NO HARD FEELINGS',
      badgeClass: tone === 'bitter' ? 'red' : tone === 'baffled' ? 'challenge' : 'green',
    });
  }

  // ── the tape ──
  //
  // Ranked by how much the reveal is worth to the night: a finalist caught in
  // front of the people voting is the top of the list, and an innocent party
  // who has worn the blame all season is right behind it.
  const hidden = betrayalLedger()
    .filter(inc => inc.known === false && onStage.includes(inc.victim) && inc.voter !== inc.victim)
    .filter(inc => isFinalist(inc.voter) || onStage.includes(inc.voter));
  const drama = inc => (isFinalist(inc.voter) ? 3 : 0) + (isJuror(inc.victim) ? 2 : 0)
    + (inc.misattribution ? 2 : 0) + (inc.num || 0) * 0.05;
  const reveals = [...hidden].sort((a, b) => drama(b) - drama(a)).slice(0, 3);

  const exposed = new Set();
  for (const inc of reveals) {
    const { voter: traitor, victim } = inc;
    const tp = pronouns(traitor);
    const vp = pronouns(victim);
    segments.push({
      kind: 'reveal', speaker: traitor, players: [traitor, victim], week: inc.num,
      text: `${say(TAPE_INTROS, victim, inc.num || week)} ${say(CONFESSIONS, traitor, victim, tp)}`,
      badgeText: 'THE VOTE THEY NEVER SAW', badgeClass: 'red',
    });

    // The consequence. A juror who has just learned the person in front of them
    // wrote their name down is a juror whose read has moved, minutes before the
    // ballot — at a lower credibility than a question they asked themselves,
    // because this is new information rather than an argument.
    let delta = 0;
    if (isJuror(victim) && isFinalist(traitor)) {
      delta = moveRead(victim, traitor, {
        strength: -1.6, credibility: 0.75, kind: 'reunion-reveal', week,
        text: `${victim} found out at the reunion that ${traitor} wrote their name down in week ${inc.num}`,
      });
      if (Math.abs(delta) >= 0.05) moved.push({ juror: victim, finalist: traitor, delta: round2(delta), kind: 'reveal' });
    }
    segments.push({
      kind: 'reaction', speaker: victim, players: [victim, traitor],
      delta: round2(delta),
      text: say(REACTIONS[isJuror(victim) ? 'juror' : 'prejury'], victim, traitor, vp),
      badgeText: isJuror(victim) ? (Math.abs(delta) >= 0.05 ? 'A VOTE MOVES' : 'ALREADY DECIDED') : 'NO VOTE, PLENTY TO SAY',
      badgeClass: isJuror(victim) ? 'gold' : 'grey',
    });
    if (isFinalist(traitor)) exposed.add(traitor);

    // ── and the person who wore it ──
    const mis = inc.misattribution;
    if (mis?.reactor && mis?.wrongSuspect && onStage.includes(mis.reactor)) {
      try { addBond(mis.reactor, mis.wrongSuspect, 2.5); } catch { /* the apology still happened */ }
      segments.push({
        kind: 'repair', speaker: mis.reactor, players: [mis.reactor, mis.wrongSuspect, traitor],
        text: say(REPAIRS, mis.reactor, mis.wrongSuspect, traitor),
        badgeText: 'BLAMED THE WRONG PERSON', badgeClass: 'blue',
      });
      // The wrongly-blamed juror was voting against somebody for a season on
      // the strength of a lie. That is worth something to the person who
      // actually did it, and it is worth something back to the innocent one.
      if (isJuror(mis.reactor) && isFinalist(mis.wrongSuspect)) {
        const d = moveRead(mis.reactor, mis.wrongSuspect, {
          strength: 1.4, credibility: 0.8, kind: 'reunion-cleared', week,
          text: `${mis.wrongSuspect} was cleared at the reunion of a flip ${mis.reactor} blamed them for`,
        });
        if (Math.abs(d) >= 0.05) moved.push({ juror: mis.reactor, finalist: mis.wrongSuspect, delta: round2(d), kind: 'cleared' });
      }
    }
  }

  // ── the row ──
  //
  // One, and only where the season earned it: a broken deal between two people
  // who are both on that stage and no longer have any reason to be polite.
  const pairs = [];
  for (const a of onStage) {
    for (const b of onStage) {
      if (a >= b) continue;
      const deal = dealBetween(a, b);
      if (deal?.broken) pairs.push({ a: deal.brokenBy === a ? b : a, b: deal.brokenBy === a ? a : b, deal });
    }
  }
  if (pairs.length) {
    const row = pairs[Math.floor(rng() * pairs.length)];
    try { addBond(row.a, row.b, -2); } catch { /* they were not friends anyway */ }
    segments.push({
      kind: 'clash', speaker: row.a, players: [row.a, row.b],
      text: say(CLASHES, row.a, row.b),
      badgeText: `${tierOf(row.deal) === 'final-two' ? 'A FINAL TWO' : 'A DEAL'} THAT DIED`, badgeClass: 'red',
    });
  }

  // ── and the two people who have to sit through all of it ──
  for (const finalist of finalTwo) {
    if (!exposed.has(finalist)) continue;
    const p = pronouns(finalist);
    const owns = answerStyle(finalist) !== 'deflect';
    segments.push({
      kind: 'answer', speaker: finalist, players: [finalist],
      text: say(owns ? OWNINGS : DUCKINGS, finalist, p),
      badgeText: owns ? 'OWNS IT' : 'WILL NOT SAY IT', badgeClass: owns ? 'gold' : 'red',
    });
    // Owning it in front of the whole stage is a small, real credit with a
    // jury that has just watched the tape; ducking it in the same room is not.
    for (const juror of jury) {
      const d = moveRead(juror, finalist, {
        strength: owns ? 0.5 : -0.6, credibility: 0.6, kind: 'reunion-answer', week,
        text: `${finalist} ${owns ? 'owned' : 'would not own'} the reunion tape`,
      });
      if (Math.abs(d) >= 0.1) moved.push({ juror, finalist, delta: round2(d), kind: 'answer' });
    }
  }

  return { segments, moved, revealed: reveals.length, onStage };
}

// ══════════════════════════════════════════════════════════════════════
// America's Favourite
// ══════════════════════════════════════════════════════════════════════

const AFH_REASONS = [
  (n, p) => `the diary rooms — ${p.sub} said out loud what everybody at home was already shouting`,
  (n, p) => `never once being boring, which is a harder season-long game than any of the ones being judged tonight`,
  (n, p) => `the way ${p.sub} took a genuinely rotten week and made it funny at ${p.posAdj} own expense`,
  (n, p) => `being the person the house was nicest about behind ${p.posAdj} back`,
  (n, p) => `going out with more grace than the people who did it deserved`,
  (n, p) => `being, by a distance, the most watchable person in that house`,
];

/**
 * The only prize the house does not vote on.
 *
 * Popularity has been tracked all season by every competition, every heroic or
 * cowardly moment and every camp event, and until now precisely nothing
 * consumed it at the end. Every evicted houseguest is eligible — the finalists
 * are playing for the money and are not on this ballot.
 */
export function runAmericasFavourite({ finalTwo = [], rng = Math.random } = {}) {
  if (seasonConfig?.popularityEnabled === false) return null;
  const pop = gs.popularity || {};
  const eligible = [...new Set([...(gs.eliminated || []), ...Object.keys(pop)])]
    .filter(n => n && !finalTwo.includes(n));
  if (eligible.length < 2) return null;

  // Weighted by popularity, floored so that somebody the audience never warmed
  // to still has a vote out there — America's Favourite is not a ranking of
  // gameplay and should not resolve like one.
  const weights = eligible.map(n => ({ name: n, w: Math.max(0.6, (Number(pop[n]) || 0) + 6) }));
  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = rng() * total;
  let winner = weights[0].name;
  for (const entry of weights) {
    roll -= entry.w;
    if (roll <= 0) { winner = entry.name; break; }
  }
  const p = pronouns(winner);
  const tally = weights
    .map(x => ({ name: x.name, share: round2((x.w / total) * 100) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 5);
  return {
    winner, tally, prize: 5000,
    reason: pick(rng, AFH_REASONS)(winner, p),
    // The audience's read and the jury's are different things, and the gap
    // between them is frequently the most interesting number of the night.
    popularity: round2(Number(pop[winner]) || 0),
  };
}

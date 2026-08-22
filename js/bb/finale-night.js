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
import { engagement } from '../ratings.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { juryValueProfile, juryTopValue } from '../finale.js';
import { readOf, stanceOf, moveRead } from './jury-sentiment.js';
import { dealBetween, tierOf } from './deals.js';
import { saboteurState } from './saboteur.js';
import { twinState } from './twin-twist.js';

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

/**
 * What a season twist put on this finalist's record — if the house knows.
 *
 * Both season twists build all season to a reveal and then the reveal
 * evaporated: a saboteur could bank fifty thousand dollars for wrecking these
 * people's weeks, sit down in front of seven of them, and not one juror would
 * mention it. A pair of twins could both walk in, one of them reach the end,
 * and the jury vote on six weeks of conversations without ever saying out loud
 * that half of those conversations were with somebody else.
 *
 * Gated on the house actually knowing. A saboteur who was never revealed is a
 * secret, not a grievance, and a jury cannot ask about something it was never
 * told.
 */
function twistRecordOf(finalist) {
  const sab = saboteurState();
  if (sab?.revealed && sab.player === finalist) {
    return {
      kind: 'saboteur',
      banked: sab.banked || 0,
      missions: (sab.missions || []).filter(m => m.worked).length,
      caught: !!sab.caught,
      // Somebody they wrongly convicted along the way, which is the part that
      // actually stings on a jury bench.
      framed: [...new Set(Object.keys(sab.suspicion || {}).filter(n => n !== finalist))],
    };
  }
  const tw = twinState();
  // 'evicted' cannot reach this chair; the other three all can.
  if (tw?.ending && tw.ending !== 'evicted' && (tw.front === finalist || tw.other === finalist)) {
    return {
      kind: 'twin',
      ending: tw.ending,
      other: tw.front === finalist ? tw.other : tw.front,
      swaps: (tw.swaps || []).length,
      completed: tw.completed || 0,
      quota: tw.quota || 0,
      // Both of them made it in, and possibly both to the end.
      entered: !!tw.entered,
    };
  }
  return null;
}

/** The case this finalist can truthfully make, distilled from the BB ledger. */
function finalistCase(name) {
  const ws = weeks();
  const st = gs.bb?.stats?.[name] || {};
  const hohs = Number(st.hohWins) || ws.filter(w => w.hoh === name).length;
  const vetos = Number(st.vetoWins) || ws.filter(w => w.vetoWinner === name).length;
  const blocks = Number(st.timesOnTheBlock ?? st.timesNominated)
    || ws.filter(w => (w.finalNominees || w.nominees || []).includes(name)).length;
  const boots = ws.filter(w => w.evicted && ((w.voteOperation?.plans || []).some(p =>
    p.organizer === name && p.target === w.evicted) || w.hoh === name)).map(w => w.evicted);
  const flips = ws.reduce((n, w) => n + (w.ballots || []).filter(b => b.changedBy === name).length, 0);
  const correctVotes = ws.filter(w => w.evicted).reduce((n, w) => n
    + (w.ballots || []).filter(b => b.voter === name && b.evict === w.evicted).length, 0);
  const votes = ws.reduce((n, w) => n + (w.ballots || []).filter(b => b.voter === name).length, 0);
  const deals = (gs.sideDeals || []).filter(d => (d.players || []).includes(name));
  const broken = deals.filter(d => d.broken && d.brokenBy === name).length;
  const honoured = deals.filter(d => d.honouredBy === name).length;
  const survived = ws.filter(w => w.evicted && w.evicted !== name
    && (w.finalNominees || []).includes(name)).length;
  return { name, hohs, vetos, wins: hohs + vetos, blocks, boots, flips, correctVotes, votes,
    broken, honoured, survived, weeks: ws.length };
}

/**
 * A claim rewritten to sit mid-sentence.
 *
 * `.toLowerCase()` on the whole string is what it used to do, and it flattened
 * every houseguest's name along with the leading "I": "the moment I earned this
 * seat was when put julia on the jury". Only the first letter should move.
 */
const midSentence = s => {
  const cut = String(s).replace(/^I /, '');
  return cut.charAt(0).toLowerCase() + cut.slice(1);
};

const moveClaim = c => c.boots.length
  ? `I put ${c.boots[0]} on the jury when leaving ${c.boots[0]} in the game was bad for mine`
  : c.flips
    ? `I changed ${c.flips} vote${c.flips === 1 ? '' : 's'} when the easy plan was going to beat me`
    : c.hohs
      ? `I won Head of Household ${c.hohs === 1 ? 'when I needed power' : `${c.hohs} times and had to show my hand`}`
      : c.survived
        ? `I sat on the block and survived ${c.survived === 1 ? 'the vote' : `${c.survived} votes`}`
        : `I made people believe keeping me was better for them than taking me out`;

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
    (j, f, g, p) => `"Do not tell me you love me and do not tell me it was just game. Tell me why losing me was worth sitting in that chair."`,
    (j, f, g, p) => `"When did you stop protecting me—and why did you keep asking me to protect you after that?"`,
    (j, f, g, p) => `"If our relationship was real, explain the lie. If it was not real, say that now."`,
  ],
  cut: [
    (j, f, g, p) => `"You wrote my name down in week ${g.week}. I'm not angry about it — I want to know whether it was your idea or whether somebody handed it to you."`,
    (j, f, g, p) => `"Talk me through the week you got me out. Whose plan was it, actually?"`,
    (j, f, g, p) => `"Everyone up there is going to claim my eviction. Convince me it was yours."`,
    (j, f, g, p) => `"What did my eviction change for your game besides making the house one person smaller?"`,
    (j, f, g, p) => `"Who did you have to persuade to get me out, and what did you tell them?"`,
    (j, f, g, p) => `"If I had stayed in week ${g.week}, what exactly were you afraid I would do?"`,
  ],
  power: [
    (j, f, g, p) => `"You were Head of Household the week I went home. You could have put anybody in that chair. Why me?"`,
    (j, f, g, p) => `"You had the power and you used it on me. Was that fear, or was that a plan?"`,
    (j, f, g, p) => `"Your HOH ended my game. Name the person who benefited most from that week, because I am not convinced it was you."`,
    (j, f, g, p) => `"You got the room, the key and the photographs. Who actually controlled your HOH?"`,
    (j, f, g, p) => `"What was the path forward you saw after evicting me? I want the plan, not the slogan."`,
  ],
  resume: [
    (j, f, g, p) => `"Give me one move — one — that was yours, that nobody else in this house could have made."`,
    (j, f, g, p) => `"I watched you play for a long time and I still cannot tell you what your game WAS. Tell me now."`,
    (j, f, g, p) => `"What was the week you would have gone home, and what did you do about it?"`,
    (j, f, g, p) => `"What did you understand about this house before the person sitting next to you understood it?"`,
    (j, f, g, p) => `"Tell me the difference between a move you made and a move that merely helped you."`,
    (j, f, g, p) => `"What mistake did you make in there, and what did you change after it?"`,
  ],
  passenger: [
    (j, f, g, p) => `"I barely saw you play. I'm not being cruel — I genuinely do not know what you did in there. Change my mind."`,
    (j, f, g, p) => `"You never had to look me in the eye and lie to me, and I think that's because you were never in a position to. Tell me I'm wrong."`,
    (j, f, g, p) => `"Was staying invisible your strategy, or is that the explanation you found after it worked?"`,
    (j, f, g, p) => `"Name one week where your decision changed the outcome. Not your vote—your decision."`,
    (j, f, g, p) => `"Why should surviving other people's moves earn my vote over somebody who made them?"`,
  ],
  // ── the two season twists, arriving on the bench ──
  //
  // Asked once a night at most. Seven people all asking the same houseguest
  // about the same reveal is a bench with one idea, and the point of these is
  // that they are the loudest single thing anybody in that room lived through.
  saboteur: [
    (j, f, g, p, t) => `"You were being PAID. Every week we were losing our minds about who was doing this to us, you were sitting in that room collecting for it. So I want to hear you say what the money was worth, out loud, to the people it was taken from."`,
    (j, f, g, p, t) => `"I want to know one thing and I want a straight answer. When we were all in that kitchen at two in the morning accusing each other — were you enjoying it?"`,
    (j, f, g, p, t) => `"${t.framed.length ? `${t.framed[0]} wore that for weeks. ${t.framed[0]} got looked at like a liar in a house of eleven people because of something you did.` : 'You watched this house tear itself apart looking for you.'} What do you say to that? And do not tell me it was a job."`,
    (j, f, g, p, t) => `"Here is my problem. Everything you have said tonight about your game — I do not know which half of it was the game and which half was the other thing you were doing. So convince me there was a player in there at all."`,
    (j, f, g, p, t) => `"You finished ${t.missions} of them. ${t.missions === 1 ? 'One night' : `${t.missions} weeks`} of my season was something you were told to do to me. Was any single week in that house actually yours?"`,
  ],
  twin: [
    (j, f, g, p, t) => `"I need to know something before I can vote. Every conversation I had with you — was I talking to you, or was I talking to ${t.other}? Because I cannot tell any more, and you can."`,
    (j, f, g, p, t) => `"${t.swaps} times. ${t.swaps} times one of you walked out of that storeroom and the other one walked in, and we sat there like idiots. When you tell me you built something with me, which of you built it?"`,
    (j, f, g, p, t) => `"I am not angry about the twist. I am angry that I defended you. I told people they were imagining it. So tell me: how many times did you let me be wrong out loud?"`,
    (j, f, g, p, t) => `"There is a version of this where it is the best thing anybody has ever done in this house. There is a version where two people played one game and got one vote's worth of scrutiny for it. Tell me which one I watched."`,
    (j, f, g, p, t) => `"Everybody up there had one body and one set of hours. You had two. Give me the reason that is a résumé and not just an advantage you were handed."`,
  ],
  loyalty: [
    (j, f, g, p) => `"You kept your word to me when it cost you something. Tell these people why that isn't just weakness dressed up as a strategy."`,
    (j, f, g, p) => `"You're the only person up there who never lied to me. Was that a choice, or did you just never need to?"`,
    (j, f, g, p) => `"Who did your loyalty cost you, and why was keeping that promise worth the damage?"`,
    (j, f, g, p) => `"At what point does loyalty stop being integrity and start being fear of making the decision?"`,
    (j, f, g, p) => `"Tell me about the promise you nearly broke. I want to know whether your loyalty was ever tested."`,
  ],
};

/** What the room is really asking about, which decides what answers it. */
const QUESTION_VALUE = {
  betrayal: 'loyalty', cut: 'control', power: 'control',
  resume: 'control', passenger: 'challenge', loyalty: 'honesty',
  // Being paid to wreck a season is a nerve question. Being two people is a
  // question about whether anything was real, which is a different thing
  // entirely and answered by a different kind of person.
  saboteur: 'control', twin: 'honesty',
};

function questionFor(juror, finalist, g, twist) {
  // The reveal outranks almost everything, because it is the loudest thing
  // anybody in that room lived through — but not a deal this person personally
  // shook on and broke, which is still the one that gets asked first.
  if (twist && !g.brokenDeal) return twist.kind;
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
  // A third family, because neither of the other two answers the question. "I
  // chose my game over you" is not a reply to "were you being paid", and a
  // résumé is not a reply to "which of you did I have that conversation with".
  saboteur: 'twist', twin: 'twist',
};

const ANSWERS = {
  'own-it': {
    grievance: [
      f => `"I did it because your path to the end ran through mine. I could keep you comfortable or keep myself alive. I chose myself, and I won't insult you by pretending otherwise."`,
      f => `"The vote was not personal, but the lie was. I needed you calm long enough for the numbers to hold. That hurt you, it helped me, and both parts are true."`,
      f => `"I knew exactly what taking you out might cost me tonight. I did it anyway because there is no jury vote for a player who never reaches these chairs."`,
      f => `"I should have owned it sooner. The move was mine to benefit from, so the damage is mine too. I am sorry for the way I handled you—not for choosing my game."`,
      f => `"You are asking whether I made the decision or hid inside it. I made it. I counted what I had, decided the week was worth the risk, and accepted that you might never vote for me."`,
      f => `"I won't give you the easy answer that everyone wanted it. I wanted it, I helped make it happen, and I am sitting here because it did."`,
    ],
    resume: [
      f => { const c = finalistCase(f); return `"My game was not one magic week. ${moveClaim(c)}. I kept doing the next necessary thing before the room understood why it was necessary."`; },
      f => { const c = finalistCase(f); return `"The clean version is ${c.hohs} HOH win${c.hohs === 1 ? '' : 's'}, ${c.vetos} veto${c.vetos === 1 ? '' : 'es'}, and ${c.correctVotes} of my ${c.votes} votes landing on the person who left. The honest version is that every one of those numbers cost me somebody."`; },
      f => { const c = finalistCase(f); return `"My best move was simple: ${moveClaim(c)}. It was not flashy from every angle. It changed who had options afterward, and I made sure I still did."`; },
      f => { const c = finalistCase(f); return `"I was exposed more than once. I touched the block ${c.blocks} time${c.blocks === 1 ? '' : 's'} and survived ${c.survived}. Control is not never being in danger. It is making danger miss."`; },
      f => { const c = finalistCase(f); return `"I broke ${c.broken} deal${c.broken === 1 ? '' : 's'} and honoured ${c.honoured}. I am not proud of every promise. I am proud that every promise had a purpose, and I can explain the purpose now."`; },
      f => { const c = finalistCase(f); return `"Look at the order people left, then look at who benefited. ${c.boots.length ? `${c.boots.join(' and ')} leaving opened the game I needed.` : 'I kept bigger names in front of me until I no longer needed them there.'} That positioning is my résumé."`; },
    ],
    twist: [
      f => `"Yes. I was, and I did it well, and I am not going to sit here and be sorry about the one part of my game none of you could have done. You are allowed to hate it. You are not allowed to call it nothing."`,
      f => `"I had two games running at once and I did not drop either of them. Everybody on that bench had one thing to keep straight. I had one thing to keep straight and one thing to keep hidden, in the same house, from all of you, for the whole season."`,
      f => `"Ask yourself the real question, which is not whether it was fair. It is whether any of you would have survived doing it. I did. That is the answer."`,
      f => `"Every single person up here lied to keep a seat. Mine was bigger and I held it longer, and the reason it is the only lie anybody wants to talk about tonight is that it is the only one that worked all the way to the end."`,
    ],
  },
  relationship: {
    grievance: [
      f => `"I cared about you, and I still chose a game where you left before me. I know how ugly that sounds. The relationship was real; so was the decision."`,
      f => `"I handled your last week badly. I kept trying to protect your feelings after I had stopped protecting your game, and that only made the betrayal land harder."`,
      f => `"You were not disposable to me. You were dangerous precisely because I trusted you and knew how many people trusted you too. I chose the seat, and I lost you doing it."`,
      f => `"I am asking you to separate two things I failed to separate in there: what I felt about you and what I needed to do. You do not owe me forgiveness for either one."`,
      f => `"I should have looked you in the face before the vote and told you where I stood. I was afraid the truth would ruin the move. The move worked, and the cowardice is still mine."`,
      f => `"If you vote against me because of the way I sent you out, I understand. I just need you to know the weeks before that were not fake because the ending was cruel."`,
    ],
    resume: [
      f => { const c = finalistCase(f); return `"My game was relationships with consequences. People gave me information, safety and time, and I used that time to ${midSentence(moveClaim(c))}. That is social strategy, not an absence of strategy."`; },
      f => `"I was the person people could tell the dangerous version of the plan to. I listened, I kept enough of it private, and I made myself useful to people who did not always like each other."`,
      f => { const c = finalistCase(f); return `"I did not dominate every week. I survived ${c.weeks} of them by knowing when somebody needed reassurance, when they needed a vote, and when they needed to think an idea was theirs."`; },
      f => `"The move I am proudest of is not a nomination. It is that people who had every reason to compare notes kept trusting me long enough for me to reach this chair."`,
      f => { const c = finalistCase(f); return `"I won ${c.wins} competitions. Everything else I won came one conversation at a time. If that looks quieter than control, ask why the loud players are sitting over there."`; },
      f => `"I do not want credit for using people. I want credit for understanding them, showing up for them, and still making the decision when their game stopped fitting mine."`,
    ],
    twist: [
      f => `"It was me. Every conversation you are thinking about right now — the ones that mattered — that was me, and I can tell you what was in them, which is how you will know. The rest was logistics."`,
      f => `"I know what I am being accused of and it is not lying. It is that you were kind to me and you are not sure who received it. You did. I felt all of it, and I am the one who has to live with knowing you did not know."`,
      f => `"I could stand here and tell you it was all strategy. It was not. I got close to people I was not supposed to get close to, and the hardest part of the whole thing was not the hiding. It was liking you and not being able to say why I kept getting it wrong."`,
      f => `"I am not asking you to forgive the secret. I am asking you to notice that I kept every promise I made you while I was carrying it, which was harder than keeping it would have been for anybody else in this room."`,
    ],
  },
  honest: {
    grievance: [
      f => `"I was not the architect of your eviction. I knew where the vote was going, chose not to risk my game stopping it, and wrote your name. That is less impressive than control and more honest than stealing it."`,
      f => `"I let you believe you had me when you did not. I was scared that telling you would make me the next target. I can explain it, but I cannot make it noble."`,
      f => `"There was a point when I could have warned you. I did not. I picked my place in the house over giving you a fair chance, and I understand why that matters now."`,
      f => `"I did not hate you and I was not secretly laughing at you. I made a frightened decision in a game that rewards frightened decisions when they work."`,
      f => `"I cannot tell you it was you or me if it was not. It was you or a harder week for me, and I chose the easier week. That is the truth."`,
      f => `"You deserved a cleaner goodbye than I gave you. I cannot fix that with a finale answer. I can only stop lying about it now."`,
    ],
    resume: [
      f => { const c = finalistCase(f); return `"I did not run this house. I won ${c.wins} competition${c.wins === 1 ? '' : 's'}, survived ${c.survived} vote${c.survived === 1 ? '' : 's'} from the block, and made enough correct decisions to be here. Judge that game, not a bigger one I invent tonight."`; },
      f => { const c = finalistCase(f); return `"My résumé has holes. I can see them. What it also has is ${c.correctVotes} correct eviction vote${c.correctVotes === 1 ? '' : 's'}, ${c.honoured} promise${c.honoured === 1 ? '' : 's'} kept when it mattered, and no quit in it."`; },
      f => `"There were weeks I followed. There were weeks surviving was the move. I would rather admit that than claim everybody else's idea because I happen to be in the chair."`,
      f => { const c = finalistCase(f); return `"The moment I earned this seat was when ${midSentence(moveClaim(c))}. It was not the biggest move of the season. It was the move my game needed."`; },
      f => `"I benefited from stronger players. I also watched them leave while they kept deciding I was safe for one more week. At some point, being underestimated becomes something you did."`,
      f => `"My case is not that I made no mistakes. My case is that I knew what kind of player I was, adjusted when it failed, and arrived here without pretending I was somebody else."`,
    ],
    twist: [
      f => `"Yes. All of it, exactly the way you think. I am not going to dress it up as a masterclass either — most weeks I was terrified and improvising, and the reason it lasted is that you were all decent enough not to look too hard."`,
      f => `"I will answer it properly. There were things I did that I would not do again, and there were people in that house who deserved better from me than a secret. I cannot give it back. I can stop pretending it was clever."`,
      f => `"You are right to be angry and I am not going to argue you out of it. What I will say is that I never once used it to hurt somebody who had not already come for me. That is a small thing. It is the only thing I have."`,
      f => `"I had an advantage. I am not going to stand here and call it a skill. What I did with it is the part I would like judged, and if the answer is that it was not enough, I would rather hear that than a vote I got by lying twice."`,
    ],
  },
  deflect: {
    grievance: [
      f => `"That wasn't me, that was the house. If you want to be angry at somebody, be angry at the person who brought me your name."`,
      f => `"I did what I had to do. I don't know what else you want me to say."`,
      f => `"You'd have done the same thing. Everybody here would have."`,
      f => `"I think you are remembering that week very differently from the way it happened."`,
      f => `"There were seven people voting. Making me answer for the entire house is convenient, but it is not fair."`,
      f => `"I am sorry you were hurt. I am not going to accept that I was the only reason you left."`,
    ],
    resume: [
      f => `"I don't think that's a fair question, honestly."`,
      f => `"I was there the whole time. I don't know how you missed it."`,
      f => `"I'd rather you judged the whole season than one week you happened to be watching."`,
      f => `"A lot happened that you did not see, and I cannot fit all of it into one answer."`,
      f => `"People keep asking for one move because it makes their decision easier. My game was bigger than one move."`,
      f => `"If reaching the final two is not evidence that I played, I do not know what answer you expect from me."`,
    ],
    twist: [
      f => `"That was not my idea. I was put in that position and I did what anybody would have done with it."`,
      f => `"It's a twist. Every season has one. I don't know why I'm the one being asked to apologise for the format."`,
      f => `"I think people are making it much bigger tonight than it ever was in the house."`,
      f => `"Honestly? Half of you would have taken the same deal in about four seconds."`,
    ],
  },
};

const LANDED = [
  (j, f, p) => `${j} sits back. Whatever ${j} came in here wanting, that was closer to it than expected.`,
  (j, f, p) => `${j} does not answer for a moment, and the room notices the moment.`,
  (j, f, p) => `Something goes out of ${j}'s shoulders. It is not forgiveness. It is close enough to count tonight.`,
  (j, f, p) => `${j} nods once, slowly, in the way of somebody adjusting a decision they thought was finished.`,
  (j, f, p) => `${j} tries not to react and fails at the corners of the mouth. That answer bought something.`,
  (j, f, p) => `A juror two seats down whispers, "That was good." ${j} hears it and does not disagree.`,
  (j, f, p) => `${j} came ready for an excuse. ${f} gave ${p.obj} an answer instead.`,
  (j, f, p) => `For the first time tonight, ${j} writes something down and underlines it.`,
];

const FLUBBED = [
  (j, f, p) => `${j}'s face does not move at all, which everybody watching understands perfectly.`,
  (j, f, p) => `"That's not what I asked you," ${j} says, and does not ask again.`,
  (j, f, p) => `${j} looks at ${f} for a long second and then looks away, and that is the whole answer.`,
  (j, f, p) => `The room goes quiet in the specific way a room goes quiet when somebody has just lost a vote.`,
  (j, f, p) => `${j} blinks twice. "That was a lot of words to avoid one very small question."`,
  (j, f, p) => `Somebody on the jury winces for ${f}. ${j} does not offer the same courtesy.`,
  (j, f, p) => `${j} gives a tight little smile—the kind that means the answer has somehow made things worse.`,
  (j, f, p) => `${f} keeps talking after the answer is already dead. ${j} lets ${p.obj} bury it properly.`,
];

const IMMOVABLE = [
  (j, f, p) => `${j} has known how this vote was going since the door shut, and nothing said in this room was ever going to touch it.`,
  (j, f, p) => `${j} listens politely. ${j}'s mind was made up in a lodge six weeks ago.`,
  (j, f, p) => `It is a good answer. ${j} decided a long time ago that a good answer would not be enough.`,
  (j, f, p) => `${j} has already written a name in ${j}'s head. This is just the part where everybody pretends the ink is still wet.`,
  (j, f, p) => `${f} lands the point. It lands on a locked door.`,
  (j, f, p) => `${j} listens with perfect manners and absolutely no availability.`,
  (j, f, p) => `Nothing in ${j}'s face changes. Some jury votes are questions; this one arrived as a sentence.`,
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
  // What a season twist left on each finalist's name, and whether it has been
  // put to them yet. Once a night: a whole bench asking the same person about
  // the same reveal is seven people with one idea between them, and it would
  // crowd out every grievance the season actually recorded.
  const twists = Object.fromEntries(finalTwo.map(f => [f, twistRecordOf(f)]));
  const twistAsked = Object.fromEntries(finalTwo.map(f => [f, false]));

  for (const juror of jury) {
    const jp = pronouns(juror);
    const grievances = Object.fromEntries(finalTwo.map(f => [f, grievanceOf(juror, f)]));
    const asked = [...finalTwo].sort((a, b) => {
      const weight = (g, n) => (g.brokenDeal ? 3 : 0) + (g.votedMeOut ? 2 : 0) + (g.heldThePower ? 1 : 0)
        + (g.strangers ? 0.5 : 0)
        // A reveal is the single loudest thing anybody in this room lived
        // through, and somebody is going to want it said out loud.
        + (twists[n] && !twistAsked[n] ? 2.5 : 0)
        // Hostility is a reason to speak to somebody.
        + Math.max(0, -g.read) * 0.25
        - askedCount[n] * 0.9
        + rng() * 0.6;
      return weight(grievances[b], b) - weight(grievances[a], a);
    })[0];
    askedCount[asked]++;
    const twist = twistAsked[asked] ? null : twists[asked];
    const kind = questionFor(juror, asked, grievances[asked], twist);
    if (twist && kind === twist.kind) twistAsked[asked] = true;
    const question = say(QUESTIONS[kind], juror, asked, grievances[asked], jp, twist);

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
      // A twist question belongs to exactly one person in that chair. The other
      // finalist was not being paid and was not two people, so handing them the
      // twist pool would have them confessing to somebody else's season — they
      // fall back to making their own case, which is what anybody does when a
      // question is not for them. Both twins reaching the end is the one case
      // where it genuinely is for both.
      let family = ANSWER_FAMILY[kind] || 'resume';
      if (family === 'twist' && twists[finalist]?.kind !== kind) family = 'resume';
      const text = say(ANSWERS[style][family], finalist);

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
  'own-it': [
    f => { const c = finalistCase(f); return `"I played to have options when everybody else ran out of them. I won ${c.hohs} HOH${c.hohs === 1 ? '' : 's'} and ${c.vetos} veto${c.vetos === 1 ? '' : 'es'}, helped send ${c.boots.length ? c.boots.join(' and ') : 'the people blocking my path'} out, and survived every consequence. Some of you are angry because my game worked against yours. I respect that anger. I am asking you to respect the game that caused it."`; },
    f => { const c = finalistCase(f); return `"I will not use my last minute to become nicer or smaller. ${moveClaim(c)}. I broke ${c.broken} promise${c.broken === 1 ? '' : 's'}, kept ${c.honoured}, and took responsibility when those choices reached this room. You do not have to reward how I made you feel. Reward the person who understood what each week required and had the nerve to do it."`; },
    f => { const c = finalistCase(f); return `"My résumé is not a list I assembled tonight: ${c.wins} competition win${c.wins === 1 ? '' : 's'}, ${c.correctVotes} correct eviction vote${c.correctVotes === 1 ? '' : 's'}, ${c.flips} vote${c.flips === 1 ? '' : 's'} changed, and a chair nobody gave me. I lied when truth would have ended my game, and I told the truth when hiding would have been easier. That is the game I am owning."`; },
    f => `"Every person on that bench can point to a moment when my interests stopped matching theirs. That is not proof I played without relationships; it is proof I knew when a relationship had stopped being a path forward. I made decisions before they became comfortable, and I reached the end before they became somebody else's."`,
    f => { const c = finalistCase(f); return `"The hardest part of this game is not getting power. It is using it without leaving yourself nowhere to stand. I held power ${c.wins} time${c.wins === 1 ? '' : 's'}, touched the block ${c.blocks} time${c.blocks === 1 ? '' : 's'}, and still found the next week. If you want the player who shaped the season and survived the shape of it, that is me."`; },
  ],
  relationship: [
    f => { const c = finalistCase(f); return `"My game lived in conversations nobody gave a trophy for. People trusted me with plans, fear, anger and information, and I turned that trust into ${c.correctVotes} correct vote${c.correctVotes === 1 ? '' : 's'} and this chair. I hurt some of you when my path narrowed. I will not call that good jury management. I will call the relationships real, even when the decisions were brutal."`; },
    f => `"I did not get here alone, and I refuse to erase you from my story just to sound dominant. Every person on that bench changed my game. I listened better than I spoke, made myself necessary to people who did not need the same things, and survived the moment those groups collided. My social game was not being liked. It was knowing what trust could carry—and when it could not."`,
    f => { const c = finalistCase(f); return `"I won ${c.wins} competitions. The rest of my power came from people choosing to tell me the truth. They did that because I built something with them before I ever needed their vote. When I broke trust, I felt it because the trust existed. Judge the damage, but also judge the work it took to be trusted in the first place."`; },
    f => `"There is a version of social strategy that means smiling while other people play. That was not mine. I used relationships to learn where the vote was moving, to pull people back when it moved against me, and to keep enemies from comparing the right notes. It looked human because it was human. It was still strategy every day."`,
    f => { const c = finalistCase(f); return `"My case is not that everybody loved me. Clearly, some of you do not. My case is that for ${c.weeks} weeks, people with different plans kept finding a reason to include me in the next one. I made connection useful without making it meaningless. That is why I am here asking people I helped evict to choose me."`; },
  ],
  honest: [
    f => { const c = finalistCase(f); return `"I am not going to claim every eviction or rename survival as control. I won ${c.wins} competition${c.wins === 1 ? '' : 's'}, voted correctly ${c.correctVotes} time${c.correctVotes === 1 ? '' : 's'}, survived ${c.survived} vote${c.survived === 1 ? '' : 's'} from the block, and kept adapting when my position was worse than I admitted. It was imperfect. It was mine."`; },
    f => `"Some weeks I led. Some weeks I followed because following was safer than becoming the next name. I know that is not the cinematic answer. Big Brother is not won by looking impressive every Thursday; it is won by reaching the Thursday when there is nowhere left to hide. I reached it, and tonight I am not hiding from how."`,
    f => { const c = finalistCase(f); return `"I made mistakes. I trusted people too long, waited too long on some decisions, and benefited from moves I did not create. I also kept ${c.honoured} promise${c.honoured === 1 ? '' : 's'}, survived the block ${c.survived} time${c.survived === 1 ? '' : 's'}, and never stopped looking for the next path. Vote for the real game, not the speech version."`; },
    f => `"The person beside me may have a louder résumé. My argument is that restraint is also a decision. I knew which fights would expose me, which allies needed space, and which weeks were not mine to own. I stayed teachable in a house that punishes certainty. If that is the game you value, I played it honestly."`,
    f => { const c = finalistCase(f); return `"I entered this night knowing there are gaps in my case. What fills them is that I lasted ${c.weeks} weeks without becoming somebody I could not defend. I lied sometimes. I compromised. I also admitted when a move was not mine. If credibility matters after a season of claims, let that matter now."`; },
  ],
  deflect: [
    f => `"Everybody wants one villain and one hero because it makes the vote simple. The house was not simple. Decisions belonged to groups, information arrived late, and every person here made compromises. I survived the same game as the person beside me. I am asking you to judge all of it, not the version that hurts you most."`,
    f => `"I have answered for every bad week tonight while other people have taken credit for every good one. That tells you what story this jury arrived wanting. I cannot rewrite months in sixty seconds. I can remind you that I reached these chairs and ask whether the easy narrative is actually the true one."`,
    f => `"I made mistakes, but nobody on that bench played a mistake-free game. If the standard is perfection, neither finalist wins. If the standard is surviving pressure, adapting and still having a case at the end, then I deserve consideration."`,
    f => `"You have heard a lot of certainty tonight—people certain they controlled votes, certain they understood motives, certain one conversation explains a season. I am not going to manufacture that certainty. My game was messier than the summary, and it still got me here."`,
    f => `"I know some of you decided before the questions began. Nothing I say now will turn resentment into respect. For the people still listening: compare both complete games. Do not let one painful week become the only week you remember."`,
  ],
};

const STATEMENT_INTROS = [
  f => `${f} goes first, and takes a second to find the start of it.`,
  f => `${f} does not stand up. Whatever this is, it is going to be said sitting down.`,
  f => `${f} looks along the bench, one face at a time, before saying anything at all.`,
  f => `${f} has clearly had this written for a week, and it does not sound written.`,
  f => `${f} grips the microphone with both hands, loses the first sentence, and starts again without apologising.`,
  f => `${f} smiles at the jury, gets no smile back, and decides to speak anyway.`,
  f => `${f} begins too quickly, stops, breathes, and starts with the part ${f} was clearly hoping to avoid.`,
  f => `${f} stands. The chair scrapes loudly across the floor, and for a second that is the only sound in the studio.`,
  f => `${f} looks at the person sitting beside them, then turns the microphone back toward the jury.`,
];

/**
 * The last line of a statement, when the person giving it spent the season
 * being something the room did not know about.
 *
 * A finalist who carries a reveal cannot make a closing statement that never
 * mentions it — it is the only thing anybody on that bench is thinking about,
 * and a speech that talks around it reads as a speech that hopes nobody
 * noticed. Whether they own it or dodge it is the same axis as everything else
 * they have said tonight: the game they actually played, arriving at the moment
 * where it has to be said out loud.
 */
const TWIST_CODAS = {
  saboteur: {
    'own-it': (f, t) => `"And one more thing, because none of you are going to stop thinking about it. `
      + `I was the saboteur. I did ${t.missions} job${t.missions === 1 ? '' : 's'} in this house and `
      + `not one of you stopped me. If you want to call that cheating, call it cheating — but I was `
      + `playing two games in the same building and I am the only person here who got to the end of both."`,
    relationship: (f, t) => `"I need to say the other thing. I was the saboteur, and the part I want you `
      + `to hear is that the friendships were not part of the job. Nobody paid me for those. `
      + `I kept them because I wanted them, in the middle of doing something I could not tell you about, `
      + `and that is the only bit of it I would do again."`,
    honest: (f, t) => `"And yes — it was me. I am not going to end on anything cleverer than that. `
      + `You spent weeks accusing each other and I let you, because the alternative was going home. `
      + `${t.framed.length ? `${t.framed[0]}, I am sorry. You should not have worn that.` : 'I am sorry for the weeks it cost you.'} `
      + `Vote how you need to."`,
    deflect: (f, t) => `"About the other thing — I did not ask for it. It was given to me on night one `
      + `and there was no version of this where I said no. I would rather be judged on the game `
      + `I chose than the one I was handed."`,
  },
  twin: {
    'own-it': (f, t) => `"And let us not pretend the last thing is not the only thing. There were two of us. `
      + `${t.swaps} changeover${t.swaps === 1 ? '' : 's'} and ${t.completed} job${t.completed === 1 ? '' : 's'} `
      + `that needed both of us, in a house that counts everybody every single day. `
      + `You are not angry that it was unfair. You are angry that it worked."`,
    relationship: (f, t) => `"I know what I am asking. I am asking people who are not sure who they were `
      + `talking to for six weeks to vote for me anyway. So here is what I can offer: I remember all of it. `
      + `Every conversation, both halves. ${t.other} and I could not afford to forget a single one of you, `
      + `and somewhere in that is the most attention anybody in this house has ever paid you."`,
    honest: (f, t) => `"The last thing is the hard thing. There were two of us and you did not know, `
      + `and I cannot hand that back. What I will not do is stand here and call it a strategy I designed. `
      + `It was a secret I was given and spent ${t.swaps} week${t.swaps === 1 ? '' : 's'} being frightened of. `
      + `Judge what I did around it."`,
    deflect: (f, t) => `"And on the twin thing — that was the format. I did not write it, I did not ask `
      + `for it, and every season has something. I would rather you looked at the weeks than the gimmick."`,
  },
};

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
  // Two finalists, one pool of openers, and a plain pick gave both of them the
  // same one: "Cole does not stand up…" immediately above "Wayne does not stand
  // up…", in the segment where the whole point is that these are two different
  // people making two different cases.
  const usedIntros = new Set();
  const intro = name => {
    const fresh = STATEMENT_INTROS.filter(fn => !usedIntros.has(fn));
    const from = fresh.length ? fresh : STATEMENT_INTROS;
    const chosen = pick(rng, from);
    usedIntros.add(chosen);
    return chosen(name);
  };
  for (const finalist of finalTwo) {
    const style = answerStyle(finalist);
    const twist = twistRecordOf(finalist);
    const coda = twist ? TWIST_CODAS[twist.kind]?.[style]?.(finalist, twist) || null : null;
    const moved = [];
    for (const juror of jury) {
      const values = juryValueProfile(juror);
      const offered = STYLE_VALUE[style];
      const appeal = offered ? (values[offered] || 0.3) : 0.1;
      let strength = (appeal - 0.55) * 1.1 + (rng() - 0.5) * 0.4;
      // Addressing it moves the room, in whichever direction the room was
      // already leaning. A jury that respects the nerve of it hears a case; a
      // jury that feels lied to hears a confession. Dodging it costs you either
      // way, because everybody in that room noticed you got to the end of a
      // speech without saying the word.
      if (twist) {
        strength += style === 'deflect'
          ? -0.35
          : ((values.control || 0.3) + (values.honesty || 0.3) - 0.7) * 0.6;
      }
      const delta = moveRead(juror, finalist, {
        strength, credibility: 0.85, kind: 'ftc-statement', week,
        text: `${finalist}'s closing statement`,
      });
      if (Math.abs(delta) >= 0.12) moved.push({ juror, delta: round2(delta) });
    }
    statements.push({
      finalist, style,
      intro: intro(finalist),
      text: pick(rng, STATEMENTS[style])(finalist),
      // The last line, when there is something the room already knows and is
      // waiting to hear said.
      coda, twist: twist ? twist.kind : null,
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
// ── the season twists, said on a stage with everybody watching ──

const SAB_STAGE = [
  (n, p, jobs, paid) => `The host does not build up to it. "Let's talk about the saboteur." `
    + `${n} gets the look from every seat on that stage at once — including the ones belonging to people `
    + `who went home in week two and have spent the whole time since finding out what happened after.`,
  (n, p, jobs, paid) => `"${jobs} job${jobs === 1 ? '' : 's'}." The number goes up on the screen behind them `
    + `and somebody in the second row says it out loud, slowly, as if hearing it makes it worse. `
    + `${n} does not look at the screen. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} known the number for months.`,
  (n, p, jobs, paid) => `Everything that went wrong in that house gets put back up on the screen in order, `
    + `and the room watches its own season happen to it a second time knowing who was doing it. `
    + `The laughing stops about four clips in.`,
  (n, p, jobs, paid) => `"Was any of it real?" It comes from the back of the stage, from somebody `
    + `with no vote and nothing to lose, and it is the only question all night that ${n} `
    + `does not have a prepared answer to.`,
];

const SAB_WRONGED = [
  (accuser, wronged, sab, wp) => `"${wronged}." ${accuser} says it to the floor rather than to anybody. `
    + `"I told four people it was ${wronged}. I said it like I knew. I have thought about that every day since."`,
  (accuser, wronged, sab, wp) => `${accuser} does not wait to be asked. `
    + `"I owe ${wronged} an apology in front of these people, because that is where I did it. `
    + `I decided it was ${wronged} and I was wrong, and it was never even close."`,
  (accuser, wronged, sab, wp) => `"I want to say this to ${wronged} and not to ${sab}." ${accuser} turns `
    + `in the chair. "You spent weeks with people looking at you like that because of something I started. `
    + `${sab} did it. You just happened to be the one I could believe it about."`,
  (accuser, wronged, sab, wp) => `${accuser} apologises, and ${wronged} says it is fine in the voice `
    + `of somebody for whom it has not been fine at any point.`,
];

// Split on whether the second twin ever got through the door. A pair who both
// entered have been standing next to each other in front of this cast for
// weeks — telling that stage they are meeting for the first time is a sentence
// half the room watched not happen.
const TWIN_STAGE_HIDDEN = [
  (front, other, swaps) => `The front door opens and ${other} walks out onto the stage, `
    + `and the noise the rest of that cast makes is not applause. Half of them stand up. `
    + `Two people sit very still and start counting backwards through the season.`,
  (front, other, swaps) => `They stand next to each other for the first time in front of the people `
    + `they did it to. ${swaps} changeover${swaps === 1 ? '' : 's'}. The screen behind them runs the storeroom `
    + `footage and the room watches a door open twice.`,
  (front, other, swaps) => `"Say both names." So they do, and the second one lands in a room `
    + `where about half the people have never heard it before — the ones who went home early, `
    + `who spent this whole season being told about a twist they were never in the house for.`,
  (front, other, swaps) => `Only one of them ever got to play, and the other one has been watching `
    + `this cast on a screen for weeks with nothing to do about any of it. `
    + `${other} gets a microphone tonight for the first and only time.`,
];

const TWIN_STAGE_ENTERED = [
  (front, other, swaps) => `They both played, and they are both standing there, and somebody on the far end `
    + `of the stage says quite clearly "I voted for one of you" and cannot finish the sentence.`,
  (front, other, swaps) => `The screen behind them runs the storeroom footage — ${swaps} `
    + `changeover${swaps === 1 ? '' : 's'} in a room nobody thought about twice — and the half of that cast `
    + `who went home before the reveal watch it with their mouths open.`,
  (front, other, swaps) => `"How many of the people on this stage do you think worked it out?" `
    + `${front} looks along the row and says a number. It is lower than the number of hands that go up, `
    + `and considerably higher than the number of people who ever said it out loud.`,
  (front, other, swaps) => `${front} and ${other} get asked to stand together and there is a long moment `
    + `where the room simply looks at them, which is the thing the whole season was arranged to prevent.`,
];

const TWIN_FELT = [
  (felt, front, other, p) => `"I KNEW." ${felt} is not angry so much as vindicated to the point of shaking. `
    + `"I said it. In week four, in the kitchen, and everybody told me I was being paranoid."`,
  (felt, front, other, p) => `${felt} has the calmest voice on the stage. `
    + `"I want to know which one of you was there the night I told you about my dad. That is all. `
    + `I am not asking for anything else."`,
  (felt, front, other, p) => `"Every single time I thought I was going mad, I was right." ${felt} laughs, `
    + `once, with nothing much in it. "That is somehow worse. I would rather have been going mad."`,
  (felt, front, other, p) => `${felt} looks at the two of them and takes a long time about it. `
    + `"I liked you," ${p.sub} ${p.sub === 'they' ? 'say' : 'says'} eventually. `
    + `"I would just like somebody to tell me which of you I mean."`,
];

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

  // ══════════════════════════════════════════════════════════════════
  // The season twists, in front of everybody
  // ══════════════════════════════════════════════════════════════════
  //
  // The one room where this belongs. The jury got to ask about it, but the jury
  // is seven people who were all still in the house when it came out — and the
  // pre-jury is a bench of people who went home before any of it was known,
  // watched the rest of the season on a screen, and have been waiting weeks to
  // say something to somebody's face.
  //
  // It also settles the debt the Saboteur's whole engine exists to create: the
  // house convicted somebody who had done nothing, and until now the only place
  // that was ever put right was a bond adjustment nobody could see.
  const sab = saboteurState();
  if (sab?.revealed && onStage.concat(finalTwo).includes(sab.player)) {
    const who = sab.player;
    const wp = pronouns(who);
    // Whoever wore it worst. Not the loudest accuser — the person the house
    // actually became certain about, who was innocent the entire time.
    const wronged = Object.entries(sab.suspicion || {})
      .filter(([n]) => n !== who && (onStage.includes(n) || isFinalist(n)))
      .map(([n, by]) => ({ name: n, total: Object.values(by).reduce((x, y) => x + y, 0),
        loudest: Object.entries(by).sort((a, b) => b[1] - a[1])[0]?.[0] }))
      .sort((a, b) => b.total - a.total)[0];

    segments.push({
      kind: 'twist-saboteur', speaker: who, players: [who],
      text: say(SAB_STAGE, who, wp, (sab.missions || []).filter(m => m.worked).length, sab.banked || 0),
      badgeText: 'PAID TO WRECK IT', badgeClass: 'red',
    });

    if (wronged?.name && wronged.loudest) {
      const w = wronged.name;
      try { addBond(wronged.loudest, w, 2.5); } catch { /* the apology still happened */ }
      segments.push({
        kind: 'twist-cleared', speaker: wronged.loudest, players: [wronged.loudest, w, who],
        text: say(SAB_WRONGED, wronged.loudest, w, who, pronouns(w)),
        badgeText: 'CONVICTED THE WRONG PERSON', badgeClass: 'blue',
      });
      // Two real consequences, both landing minutes before a ballot: the person
      // who spent a season being suspected for nothing gets it back, and the
      // person who actually did it wears it.
      if (isJuror(wronged.loudest) && isFinalist(w)) {
        const d = moveRead(wronged.loudest, w, {
          strength: 1.5, credibility: 0.8, kind: 'reunion-saboteur-cleared', week,
          text: `${w} was cleared at the reunion — it was ${who} the whole time`,
        });
        if (Math.abs(d) >= 0.05) moved.push({ juror: wronged.loudest, finalist: w, delta: round2(d), kind: 'cleared' });
      }
      if (isJuror(wronged.loudest) && isFinalist(who)) {
        const d = moveRead(wronged.loudest, who, {
          strength: -1.5, credibility: 0.8, kind: 'reunion-saboteur', week,
          text: `${wronged.loudest} spent a season blaming ${w} for what ${who} was being paid to do`,
        });
        if (Math.abs(d) >= 0.05) moved.push({ juror: wronged.loudest, finalist: who, delta: round2(d), kind: 'reveal' });
      }
    }
  }

  const tw = twinState();
  if (tw?.ending && tw.ending !== 'evicted') {
    const front = tw.front;
    const other = tw.other;
    // Whoever was closest to a person who was never entirely one person. The
    // twist's own suspicion map is the right place to look: these are the people
    // who felt something all season and could not name it.
    const felt = Object.entries(tw.suspicion || {})
      .filter(([n]) => onStage.includes(n) || isFinalist(n))
      .sort((a, b) => b[1] - a[1])[0]?.[0]
      || onStage.filter(n => n !== front && n !== other)
        .sort((a, b) => getBond(front, b) - getBond(front, a))[0];

    segments.push({
      kind: 'twist-twin', speaker: front, players: [front, other].filter(Boolean),
      text: say(tw.entered ? TWIN_STAGE_ENTERED : TWIN_STAGE_HIDDEN,
        front, other, (tw.swaps || []).length),
      badgeText: tw.entered ? 'BOTH OF THEM, ALL SEASON' : 'THERE WERE ALWAYS TWO', badgeClass: 'red',
    });

    if (felt) {
      segments.push({
        kind: 'twist-felt', speaker: felt, players: [felt, front],
        text: say(TWIN_FELT, felt, front, other, pronouns(felt)),
        badgeText: 'KNEW SOMETHING AND COULD NOT NAME IT', badgeClass: 'blue',
      });
      if (isJuror(felt) && isFinalist(front)) {
        // Being told you were right all along, minutes before you vote. Which
        // way it cuts depends on the juror, and `moveRead` owns that — a bench
        // that respects the nerve of it is not the same bench as one that spent
        // six weeks being quietly gaslit.
        const admires = (juryValueProfile(felt).control || 0.3) > (juryValueProfile(felt).honesty || 0.3);
        const d = moveRead(felt, front, {
          strength: admires ? 1.2 : -1.6, credibility: 0.8, kind: 'reunion-twin', week,
          text: `${felt} found out at the reunion that ${front} was two people the whole season`,
        });
        if (Math.abs(d) >= 0.05) moved.push({ juror: felt, finalist: front, delta: round2(d), kind: admires ? 'cleared' : 'reveal' });
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
  (n, p) => `being, by a distance, the most watchable person in that house`,
];

// One of them only makes sense about somebody who LEFT. Now that a finalist can
// win this, a houseguest who walked to the end would have been congratulated
// for "going out with more grace than the people who did it deserved".
const AFH_REASONS_EVICTED = [
  (n, p) => `going out with more grace than the people who did it deserved`,
];

/**
 * The only prize the house does not vote on.
 *
 * Popularity has been tracked all season by every competition, every heroic or
 * cowardly moment and every camp event, and until now precisely nothing
 * consumed it at the end.
 *
 * THE WHOLE CAST IS ON THE BALLOT, FINALISTS INCLUDED. They were struck off
 * here on the reasoning that they are "playing for the money", which is not the
 * rule the real show uses -- Tyler Crispen won America's Favorite in BB20 as
 * the runner-up, having just lost the jury vote 5-4, and Jordan Lloyd and
 * Taylor Hale won their seasons AND the award. Excluding them also produces the
 * one result the prize should never produce: Big Brother 1's most-loved
 * houseguest by a clear margin was barred from the ballot for being good at the
 * game, and the audience award went to somebody seventeen points behind him.
 */
export function runAmericasFavourite({ finalTwo = [], rng = Math.random } = {}) {
  if (seasonConfig?.popularityEnabled === false) return null;
  const pop = gs.popularity || {};
  const eligible = [...new Set([...(gs.eliminated || []), ...finalTwo, ...Object.keys(pop)])]
    .filter(Boolean);
  if (eligible.length < 2) return null;

  // ── HOW FAR ABOVE THE FIELD, NOT HOW BIG THE NUMBER ──
  //
  // The weight was popularity itself, and with a cast of seventeen that is
  // almost a flat ballot: the season's runaway favourite on 145 sat at an
  // expected 11.9% against 11.1% for the next name down, because the absolute
  // scores are large and their RATIOS are mild. Being twice as beloved as the
  // average houseguest barely moved the odds, so the prize resolved as a
  // lottery with extra steps and no block count could fix it -- more blocks
  // only converge harder on the near-tie.
  //
  // Favourite is a comparative word. The weight is now how far above the
  // average houseguest the audience rated you, which is self-normalising: a
  // season the country adored across the board does not flatten into a raffle,
  // and one nobody warmed to still has a clear favourite.
  const eng = engagement();
  const scores = eligible.map(n => Number(pop[n]) || 0);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  // Floored, so somebody the audience never warmed to still has a vote out
  // there — America's Favourite is not a ranking of gameplay and should not
  // resolve like one.
  const weights = eligible.map(n => ({ name: n,
    w: Math.max(0.6, ((Number(pop[n]) || 0) - mean) * eng + 6) }));
  const total = weights.reduce((s, x) => s + x.w, 0);

  // ── an actual count ──
  //
  // This used to draw the winner from the weights and then print the weights as
  // the tally, which meant the screen could show one houseguest on 33% and
  // crown somebody on 26% underneath it — a vote graphic that contradicts its
  // own result. So the votes are counted instead: twenty-five blocks of
  // audience, each drawn against popularity, and whoever holds the most blocks
  // wins. Few enough blocks that the second-favourite can still take it, which
  // is the upset the old roll was there to allow.
  // AND THE ELECTORATE ITSELF. The blocks were already a count of how many
  // people voted, so a season the country stopped watching simply has fewer
  // of them — and fewer blocks is a noisier count with a likelier upset.
  // Nothing else here changes: the same vote, run by fewer people.
  // Enough of them that the count means something. At twenty-five, one block
  // was four points of share and the winner was decided by a margin of one --
  // Big Brother 1 was 5 blocks to 4, with a houseguest on half the favourite's
  // popularity outpolling one on all of it. The upset is still reachable, it
  // just has to be earned by more than a single lucky draw.
  const BLOCKS = Math.max(25, Math.min(120, Math.round(75 * eng)));
  const counts = Object.fromEntries(eligible.map(n => [n, 0]));
  for (let i = 0; i < BLOCKS; i++) {
    let roll = rng() * total;
    let landed = weights[0].name;
    for (const entry of weights) {
      roll -= entry.w;
      if (roll <= 0) { landed = entry.name; break; }
    }
    counts[landed]++;
  }
  const ranked = [...weights].sort((a, b) => (counts[b.name] - counts[a.name]) || (b.w - a.w));
  const winner = ranked[0].name;
  const p = pronouns(winner);
  const tally = ranked
    .map(x => ({ name: x.name, share: round2((counts[x.name] / BLOCKS) * 100) }))
    .filter(x => x.share > 0)
    .slice(0, 5);
  return {
    winner, tally, prize: 5000,
    reason: pick(rng, finalTwo.includes(winner)
      ? AFH_REASONS : [...AFH_REASONS, ...AFH_REASONS_EVICTED])(winner, p),
    // The audience's read and the jury's are different things, and the gap
    // between them is frequently the most interesting number of the night.
    popularity: round2(Number(pop[winner]) || 0),
  };
}

// ══════════════════════════════════════════════════════════════════════
// pm/challenges.js — the villa's named challenges (Plan 4.5 phase 4)
// ══════════════════════════════════════════════════════════════════════
//
// The afternoon's game, one a day at most, each one a format the real show
// plays (the challenge tables of UK 10-13; the plan names the day of each).
// A game is only ever the excuse: what it is for is what comes out of it —
// a statement read aloud about the wrong person, a partner who gave somebody
// else the higher score, the couple the villa's friends wrote down as the
// fakest. So every one of them moves bonds, beliefs or feelings, and the
// scenes carry only what the players could know.
//
// Couple of Sorts and the Grafties bring the PUBLIC's view into the villa.
// This file does not read the ledger (tests/pm-ledger-readers.test.js): the
// ranking comes from public-vote.js, and what the islanders make of it is here.
import { addBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf } from './events.js';
import { romance, friendship, revealTruth, believed } from './feelings.js';
import { nudgeAttraction, attr } from './chemistry.js';
import { coupleStrength } from './ladder.js';
import { emo, feel, jealousyHit } from './emotions.js';
import { publicSorts, publicAwards } from './public-vote.js';
import { CHALLENGE_NAMES } from './schedule.js';
import { lieDetector } from './lie-detector.js';
import { MORE_CHALLENGES } from './challenges-more.js';
import { kissRound, roundSize } from './kiss-round.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pop = (...rows) => Object.fromEntries(rows.filter(r => r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const S = (state, n) => state.profiles[n].stats;
const side = (state, g) => state.villa.filter(n => state.profiles[n].gender === g);
// Every challenge scene is on screen: that is what the challenge is for.
const scene = (state, rng, kind, players, extra = {}, major = []) =>
  makeEvent(state, rng, { phase: 'challenge', kind, players, aired: true, major, extra });

// ── GOT THE RECEIPTS (UK 12 d8; Wary Tales UK 10 d2; It's Not That Deep UK 13 d9)
// A card with something an islander on the other side has done; the reader
// kisses whoever they think it is, and then the card is turned over. What the
// producers print is what the cameras saw, so it can be something the
// partner never did — and now does.
const RECEIPT_KINDS = { pull: 'pull', 'head-turned': 'head-turned', ick: 'ick', 'challenge-kiss': 'pull',
  argument: 'row', 'love-said': 'love' };
function receiptsFor(state) {
  const out = [], seen = new Set();
  // A secret first: the kiss or the pull the partner does not know about.
  for (const s of state.secrets) {
    if (s.known || s.public || s.ep >= state.ep || !state.villa.includes(s.who) || !state.villa.includes(s.partner) || seen.has(s.who)) continue;
    if (partnerOf(state, s.who) !== s.partner) continue;
    out.push({ of: 'secret', who: s.who, with: s.with, secret: s }); seen.add(s.who);
    break;                  // one a game: the rest of the cards are lighter
  }
  const per = {};
  for (const e of [...(state.history || [])].reverse()) {
    const of = RECEIPT_KINDS[e.kind];
    if (e.ep < state.ep - 2 || e.ep >= state.ep || !of || (per[of] || 0) >= 2) continue;
    const who = e.players[0];
    if (!state.villa.includes(who) || seen.has(who)) continue;
    // A pull only makes a receipt when the one pulling was coupled up; a row
    // and an "I love you" only when they were with the partner they still have.
    if (of === 'pull' && !partnerOf(state, who)) continue;
    if ((of === 'row' || of === 'love') && partnerOf(state, who) !== e.players[1]) continue;
    out.push({ of, who, with: e.players[1] || null }); seen.add(who);
    per[of] = (per[of] || 0) + 1;
  }
  return out;
}

function receipts(state, rng) {
  const cards = receiptsFor(state).slice(0, 4);
  if (cards.length < 2) return [];
  const out = [];
  for (const card of cards) {
    const g = state.profiles[card.who].gender;
    // Never the subject's own partner: that is not a guess, it is the reveal.
    const readers = state.villa.filter(n => state.profiles[n].gender !== g && n !== card.with
      && n !== partnerOf(state, card.who) && !out.some(e => e.players[0] === n));
    const suspects = side(state, g);
    if (!readers.length || suspects.length < 2) continue;
    const reader = readers[Math.floor(rng() * readers.length)];
    // Knowing is not guessing: the reader who saw it, or reads people well, gets it.
    const knew = state.secrets.some(s => s.who === card.who && s.witnesses?.includes(reader));
    const right = rng() < (knew ? 0.75 : 0.1 + 0.45 * S(state, reader).intuition / 10);
    // A wrong guess is a kiss for somebody else — usually whoever they fancy.
    const kissed = right ? card.who : suspects.filter(n => n !== card.who)
      .sort((a, b) => (romance(reader, b) + rng() * 3) - (romance(reader, a) + rng() * 3))[0];
    const rp = partnerOf(state, reader);
    if (rp && kissed !== rp) jealousyHit(state, rp, reader, kissed, 1.5);
    if (attr(state, kissed, reader) != null) nudgeAttraction(state, kissed, reader, 0.2);
    // The card turned over lands on the subject's partner.
    const p = partnerOf(state, card.who);
    const hit = { secret: 5, pull: 3, 'head-turned': 2.5, ick: 0, row: 0, love: 0 }[card.of];
    if (p && hit) {
      revealTruth(state, p, card.who);
      if (card.with && card.with !== p) jealousyHit(state, p, card.who, card.with, hit, { confirmed: true });
      addRelationshipDimension(p, card.who, 'trust', -hit / 4);
      feel(state, p, 'security', -hit / 3);
      if (card.secret) card.secret.known = true;
    }
    // The kind card: said out loud, it lands on the partner it was said to.
    if (card.of === 'love' && p) { feel(state, p, 'security', 1); addRelationshipDimension(p, card.who, 'trust', 0.3); }
    if (card.of === 'row' && p) feel(state, p, 'stress', 0.5);
    if (card.of === 'ick' && card.with && state.villa.includes(card.with)) {
      feel(state, card.with, 'confidence', -1.5);
      addRelationshipDimension(card.with, card.who, 'resentment', 0.8);
    }
    out.push(scene(state, rng, 'receipt', [reader, kissed, card.who, ...(p ? [p] : [])],
      { of: card.of, guessed: right, pop: pop([card.who, card.of === 'love' ? 0.4 : card.of === 'ick' || card.of === 'row' ? -0.3 : -hit / 3, 2], [reader, 0.1, 1]) },
      hit >= 3 ? [card.who] : []));
  }
  return out;
}

// ── LOOK WHO'S TALKING (UK 12 d11; the Villa Receipts, UK 13 d21)
// A card with something an islander SAID, and the villa guesses who. The
// cards are the beach hut: what they said to camera about somebody who is
// sitting right there.
function lookWho(state, rng) {
  const quotes = [], used = new Set();
  for (const e of [...(state.history || [])].reverse()) {
    if (e.ep < state.ep - 3 || e.ep >= state.ep || !e.hut?.script?.lines?.length) continue;
    const who = e.hut.who, text = e.hut.script.lines[0].text;
    const about = e.players.find(n => n !== who && state.villa.includes(n) && text.includes(n));
    if (!about || !state.villa.includes(who) || used.has(who)) continue;
    quotes.push({ who, about, stance: e.hut.stance, text }); used.add(who);
    if (quotes.length >= 3) break;
  }
  if (quotes.length < 2) return [];
  return quotes.map(q => {
    const readers = state.villa.filter(n => n !== q.who && n !== q.about);
    const reader = readers[Math.floor(rng() * readers.length)] || q.about;
    const right = rng() < 0.2 + 0.5 * S(state, reader).intuition / 10 + (friendship(reader, q.who) > 4 ? 0.2 : 0);
    // What they said is out now, and the one it was about heard it: they
    // learn what the speaker really feels, and a hut that said one thing to
    // camera and another to their face costs trust on top.
    // Narration only picks the words; the feeling itself is what moves them.
    const feeling = Math.max(romance(q.who, q.about), friendship(q.who, q.about));
    const of = q.stance === 'two-faced' ? 'two-faced' : feeling >= 2.5 ? 'warm' : feeling < 1 ? 'cold' : 'plain';
    const mine = partnerOf(state, q.who) === q.about;
    if (mine) revealTruth(state, q.about, q.who);
    if (of === 'two-faced') {
      addRelationshipDimension(q.about, q.who, 'trust', -1.2);
      addRelationshipDimension(q.about, q.who, 'resentment', 1);
      if (mine) feel(state, q.about, 'security', -1.5);
    } else if (of === 'cold') {
      addRelationshipDimension(q.about, q.who, 'resentment', 0.6);
      feel(state, q.about, 'confidence', -0.8);
    } else {
      addRelationshipDimension(q.about, q.who, 'affection', 0.25 * feeling);
      if (mine) feel(state, q.about, 'security', 0.3 * feeling);
    }
    return scene(state, rng, 'look-who', [reader, q.who, q.about],
      { quote: q.text, quoteWho: q.who, guessed: right, of,
        pop: pop([q.who, of === 'two-faced' ? -1 : of === 'warm' ? 0.4 : 0, 1.5]) },
      of === 'two-faced' ? [q.who] : []);
  });
}

// ── SAUCIEST SNOGGER (UK 10 d23, UK 11 d38, UK 12 d41, UK 13 d12)
// The girls kiss every boy, the boys are blindfolded, and each boy gives each
// kiss a score out of ten. The scores are read out, so everyone hears what
// their partner gave them — and what they gave everybody else.
function snogger(state, rng) {
  const girls = side(state, 'f'), boys = side(state, 'm');
  if (girls.length < 2 || boys.length < 2) return [];
  const score = {};
  for (const b of boys) for (const g of girls) {
    if (attr(state, b, g) == null) continue;
    const mine = partnerOf(state, b) === g;
    // Blindfolded, but a boy who is loyal knows his partner's kiss (or says he does).
    // Generous, like the real scores (a lot of sevens to tens): what moves
    // them is how much he likes her and how much she goes for it.
    const raw = 3.5 + 0.5 * romance(b, g) + 0.3 * S(state, g).boldness + (mine ? S(state, b).loyalty / 10 : 0) + (rng() - 0.5) * 3;
    score[`${b}|${g}`] = clamp(Math.round(raw), 1, 10);
  }
  const total = g => boys.reduce((s, b) => s + (score[`${b}|${g}`] || 0), 0);
  const ranked = [...girls].sort((x, y) => total(y) - total(x));
  const winner = ranked[0];
  // The kisses themselves, before the scores: each girl's turn is her choice
  // — her partner, the one she fancies, a laugh, or a schemer's stir — and
  // the boys, blindfolded, only find out from the villa's faces.
  // Every girl takes her turn (user: "and everyone participates").
  const out = kissRound(state, rng, { kissers: [...girls].sort(() => rng() - 0.5), targets: boys, n: girls.length, game: 'snogger', scene });
  // The best kiss of the day.
  const [bestKey] = Object.entries(score).sort((x, y) => y[1] - x[1])[0] || [];
  if (bestKey) {
    const [b, g] = bestKey.split('|');
    nudgeAttraction(state, b, g, 0.3);
    const bp = partnerOf(state, b);
    out.push(scene(state, rng, 'snogger-kiss', [g, b],
      { of: score[bestKey] >= 10 ? 'ten' : score[bestKey] === 9 ? 'nine' : 'high', pop: pop([g, 0.2, 1.5]) }));
    if (bp && bp !== g) jealousyHit(state, bp, b, g, 1.5, { confirmed: true });
  }
  feel(state, winner, 'confidence', 2);
  out.push(scene(state, rng, 'snogger-win', [winner, ranked[1]].filter(Boolean), { pop: pop([winner, 0.5, 2]) }));
  // The row: his partner's kiss scored under somebody else's. Every girl
  // hears it and minds; the one with the biggest gap says so.
  const hurt = [];
  for (const g of girls) {
    const b = partnerOf(state, g);
    if (!b || !boys.includes(b)) continue;
    const mine = score[`${b}|${g}`] || 0;
    const [rival, top] = girls.filter(o => o !== g).map(o => [o, score[`${b}|${o}`] || 0]).sort((x, y) => y[1] - x[1])[0] || [];
    // A point either way is the blindfold; two is a preference everyone heard.
    if (rival && top - mine >= 2) hurt.push({ g, b, rival, gap: top - mine });
  }
  hurt.sort((x, y) => y.gap - x.gap);
  hurt.forEach(({ g, b, rival, gap }, i) => {
    jealousyHit(state, g, b, rival, 1.5 + gap, { confirmed: true });
    feel(state, g, 'security', -0.6 * gap);
    addRelationshipDimension(g, b, 'trust', -0.3 * gap);
    if (i === 0) out.push(scene(state, rng, 'snogger-row', [g, b, rival], { of: gap >= 3 ? 'big' : 'small',
      pop: pop([b, -0.3 * gap, 1.5], [g, 0.3, 1.5]) }, gap >= 3 ? [b] : []));
  });
  return out;
}

// ── COUPLE GOALS (UK 10 d46, UK 11 d46, UK 12 d50, UK 13 d31)
// Each couple writes down which couple a question fits best, and the boards
// are turned round. The kind questions cost nothing; the other two are where
// friends find out what their friends really think of them.
const GOALS_QUESTIONS = [['marry', 1], ['fake', -1], ['break', -1]];
function coupleGoals(state, rng) {
  if (state.couples.length < 3) return [];
  const view = (by, [c, d]) => 10 * coupleStrength(state, c, d)
    + 0.25 * (friendship(by[0], c) + friendship(by[0], d) + friendship(by[1], c) + friendship(by[1], d)) + (rng() - 0.5) * 4;
  const out = [], after = [];
  let rowed = false;
  for (const [q, sign] of GOALS_QUESTIONS) {
    const boards = state.couples.map(by => {
      const others = state.couples.filter(c => c !== by);
      const answer = others.sort((x, y) => sign * (view(by, y) - view(by, x)))[0];
      return { by, answer };
    });
    const tally = new Map();
    for (const { answer } of boards) tally.set(answer, (tally.get(answer) || 0) + 1);
    const [named, votes] = [...tally.entries()].sort((x, y) => y[1] - x[1])[0];
    for (const n of named) {
      if (sign > 0) { feel(state, n, 'security', 1); feel(state, n, 'confidence', 0.5); }
      else { feel(state, n, 'security', -0.4 * votes); feel(state, n, 'stress', 0.4 * votes); }
    }
    // The board that hurts most: a couple of friends who wrote them down.
    const writers = boards.filter(b => b.answer === named);
    const sting = sign < 0 ? writers.sort((x, y) =>
      (friendship(named[0], y.by[0]) + friendship(named[1], y.by[1])) - (friendship(named[0], x.by[0]) + friendship(named[1], x.by[1])))[0] : writers[0];
    if (sign < 0) for (const { by } of writers) for (const n of named) for (const w of by) {
      const hurt = friendship(n, w) > 4 ? 1.2 : 0.4;
      addRelationshipDimension(n, w, 'resentment', hurt);
      addRelationshipDimension(n, w, 'affection', -hurt / 2);
    }
    const close = (x, y) => Math.max(friendship(x[0], y[0]), friendship(x[0], y[1]), friendship(x[1], y[0]), friendship(x[1], y[1]));
    const friends = sign < 0 && sting && close(named, sting.by) >= 3;
    // `guessed`: most of the boards say the same couple.
    // The row goes to whichever of the named pair is closest to the writers.
    const [hurtOne, other] = friendship(named[0], sting.by[0]) + friendship(named[0], sting.by[1])
      >= friendship(named[1], sting.by[0]) + friendship(named[1], sting.by[1]) ? named : [named[1], named[0]];
    const writer = friendship(hurtOne, sting.by[0]) >= friendship(hurtOne, sting.by[1]) ? sting.by[0] : sting.by[1];
    out.push(scene(state, rng, 'couple-goals', [...sting.by, ...named],
      { of: q, guessed: 2 * votes > boards.length, pop: pop([named[0], sign * 0.4, 1.5], [named[1], sign * 0.4, 1.5]) }));
    if (friends && !rowed) {
      rowed = true;             // one confrontation an afternoon
      // Said after the game, not in the middle of it.
      after.push(scene(state, rng, 'couple-goals-row', [hurtOne, writer, other],
        { of: q, pop: pop([hurtOne, 0.2, 1.5], [writer, -0.3, 1]) }));
    }
  }
  return [...out, ...after];
}

// ── KNOWING ME, KNOWING YOU (UK 12 d52, UK 13 d39; Situationship, UK 10 d15)
// The couples answer questions about each other on boards, back to back.
// A couple that matches knows each other; the last question — which of them
// is more likely to stray — is the one that starts the argument.
function knowingMe(state, rng) {
  if (state.couples.length < 2) return [];
  const rows = state.couples.map(([a, b]) => {
    const p = clamp(0.3 + 0.5 * coupleStrength(state, a, b) + 0.03 * (romance(a, b) + romance(b, a)) / 2, 0.2, 0.92);
    let got = 0;
    for (let i = 0; i < 6; i++) if (rng() < p) got++;
    return { couple: [a, b], got };
  });
  rows.forEach(r => { r.tie = rng(); });
  rows.sort((x, y) => y.got - x.got || x.tie - y.tie);
  const out = [];
  const shown = new Set([rows[0], rows[rows.length - 1], rows[1]]);
  rows.forEach((r, i) => {
    const [a, b] = r.couple;
    const result = i === 0 ? 'high' : i === rows.length - 1 && r.got < rows[0].got ? 'low' : 'mid';
    for (const n of r.couple) {
      if (result === 'high') { feel(state, n, 'security', 1.2); addRelationshipDimension(n, partnerOf(state, n), 'trust', 0.5); }
      if (result === 'low') { feel(state, n, 'security', -1); feel(state, n, 'stress', 1); }
    }
    if (shown.has(r)) out.push(scene(state, rng, 'knowing-me', [a, b], { of: result, pop: pop([a, result === 'high' ? 0.4 : 0, 1], [b, result === 'high' ? 0.4 : 0, 1]) }));
    // "Who is more likely to stray?" Each writes what they believe.
    for (const [x, y] of [[a, b], [b, a]]) {
      const doubt = Math.max(0, ...Object.values(emo(state, x).jealousy || {})) + 3 * (1 - believed(state, x, y) / 10);
      if (doubt < 4.5 + rng() * 2) continue;
      const guilty = state.secrets.some(s => !s.known && s.who === y && s.partner === x);
      if (guilty) feel(state, y, 'guilt', 1.5);
      else { addRelationshipDimension(y, x, 'resentment', 0.6); feel(state, y, 'security', -0.8); }
      out.push(scene(state, rng, 'knowing-row', [x, y], { of: guilty ? 'guilty' : 'hurt', pop: pop([x, 0, 1.5], [y, guilty ? -0.3 : 0.2, 1.5]) }));
      break;
    }
  });
  return out;
}

// ── THE TALENT SHOW (UK 10 d50, UK 11 d51, UK 12 d51)
// Everyone does an act; the villa votes for its favourite. Nerve counts more
// than talent. The vote is by show of hands, so a partner who votes for
// somebody else does it in front of everyone.
function talentShow(state, rng) {
  if (state.villa.length < 4) return [];
  const q = Object.fromEntries(state.villa.map(n =>
    [n, 0.5 * S(state, n).boldness + 0.3 * S(state, n).social + 0.2 * S(state, n).temperament + (rng() - 0.5) * 4]));
  const votes = {}, ballot = {};
  for (const v of state.villa) {
    const pick = state.villa.filter(n => n !== v)
      .map(n => [n, q[n] + 0.25 * friendship(v, n) + (partnerOf(state, v) === n ? 2.5 * S(state, v).loyalty / 10 : 0)])
      .sort((x, y) => y[1] - x[1])[0][0];
    ballot[v] = pick; votes[pick] = (votes[pick] || 0) + 1;
  }
  const ranked = [...state.villa].sort((x, y) => (votes[y] || 0) - (votes[x] || 0) || q[y] - q[x]);
  const winner = ranked[0];
  const flop = [...state.villa].sort((x, y) => q[x] - q[y])[0];
  const out = [];
  // The best-matched couple do their act together.
  const duet = [...state.couples].sort((x, y) => coupleStrength(state, y[0], y[1]) - coupleStrength(state, x[0], x[1]))[0];
  if (duet && coupleStrength(state, duet[0], duet[1]) > 0.4) {
    addBond(duet[0], duet[1], 0.4);
    for (const n of duet) feel(state, n, 'security', 0.5);
    out.push(scene(state, rng, 'talent-act', [...duet], { of: 'duet', pop: pop([duet[0], 0.4, 1.2], [duet[1], 0.4, 1.2]) }));
  }
  if (flop !== winner) {
    feel(state, flop, 'confidence', -1);
    // The public like the one who tried.
    out.push(scene(state, rng, 'talent-act', [flop], { of: 'flop', pop: pop([flop, 0.6, 1.5]) }));
  }
  out.push(scene(state, rng, 'talent-win', [winner, ...(partnerOf(state, winner) ? [partnerOf(state, winner)] : [])],
    { pop: pop([winner, 1, 2]) }));
  feel(state, winner, 'confidence', 2);
  // A partner's hand went up for somebody else.
  for (const [a, b] of state.couples) for (const [x, y] of [[a, b], [b, a]]) {
    // Only the one who put a hand up for their partner minds.
    if (ballot[x] !== y || ballot[y] === x) continue;
    feel(state, x, 'security', -0.7);
    addRelationshipDimension(x, y, 'resentment', 0.4);
    out.push(scene(state, rng, 'talent-snub', [x, y, ballot[y]], { pop: pop([y, -0.2, 1]) }));
    return out;                              // one snub is the story
  }
  return out;
}

// ── THE BABY DOLLS (UK 12 d52; UK 3-5)
// Each couple gets a doll to look after, day and night. Who gets up for it,
// and who leaves it by the pool, is the most honest preview the villa gets.
function babyDolls(state, rng) {
  if (state.couples.length < 2) return [];
  const effort = (n, p) => 0.4 * S(state, n).loyalty + 0.3 * S(state, n).temperament + 0.3 * romance(n, p) + (rng() - 0.5) * 4;
  const out = [];
  for (const [a, b] of state.couples) {
    const ea = effort(a, b), eb = effort(b, a);
    const [worker, slacker] = ea >= eb ? [a, b] : [b, a];
    const gap = Math.abs(ea - eb);
    if (gap >= 2.5 && Math.max(ea, eb) >= 4) {
      nudgeAttraction(state, worker, slacker, -0.4);
      addRelationshipDimension(worker, slacker, 'resentment', 0.6);
      feel(state, worker, 'stress', 1);
      out.push(scene(state, rng, 'baby-doll', [worker, slacker], { of: 'left-it', pop: pop([worker, 0.5, 1.2], [slacker, -0.6, 1.5]) }));
    } else if (Math.min(ea, eb) >= 4.5) {
      addBond(a, b, 0.3);
      for (const n of [a, b]) { feel(state, n, 'security', 1); addRelationshipDimension(n, partnerOf(state, n), 'trust', 0.4); }
      out.push(scene(state, rng, 'baby-doll', [a, b], { of: 'team', pop: pop([a, 0.5, 1], [b, 0.5, 1]) }));
    } else if (Math.max(ea, eb) < 4) {
      // Neither of them is ready. The villa finds this very funny, and so,
      // eventually, do they: failing at it together still counts for something.
      addBond(a, b, 0.25);
      out.push(scene(state, rng, 'baby-doll', [a, b], { of: 'lost', pop: pop([a, 0.2, 1.5], [b, 0.2, 1.5]) }));
    } else {
      // They got through it, and nobody filmed anything worth showing.
      for (const n of [a, b]) feel(state, n, 'security', 0.3);
    }
  }
  return out;
}

// ── COUPLE OF SORTS (UK 11 d52, UK 12 d38)
// The public have ranked the couples; the couples stand on the podium where
// they think they placed. The first time the villa hears what the country
// thinks of them.
function coupleOfSorts(state, rng) {
  if (state.couples.length < 3) return [];
  const sorts = publicSorts(state, { rng });
  const out = [];
  // Where each couple stands is their own read of themselves.
  const guess = [...state.couples].sort((x, y) => (coupleStrength(state, y[0], y[1]) + emo(state, y[0]).confidence / 10 + rng() * 0.3)
    - (coupleStrength(state, x[0], x[1]) + emo(state, x[0]).confidence / 10 + rng() * 0.3));
  const top = sorts.favourite[0];
  out.push(scene(state, rng, 'sorts-podium', [...top], { of: 'top', guessed: guess[0] === top, pop: pop([top[0], 0.3, 1.5], [top[1], 0.3, 1.5]) }));
  for (const n of top) feel(state, n, 'confidence', 1.5);
  // A couple who stood on first and were placed last.
  const wrong = guess[0] !== top && sorts.favourite.indexOf(guess[0]) === sorts.favourite.length - 1 ? guess[0] : null;
  if (wrong) {
    for (const n of wrong) { feel(state, n, 'confidence', -1.5); feel(state, n, 'stress', 1); }
    out.push(scene(state, rng, 'sorts-podium', [...wrong], { of: 'wrong', pop: pop([wrong[0], 0.3, 1.5]) }));
  }
  // The last category: the couple least likely to last on the outside.
  const least = sorts.last[sorts.last.length - 1];
  for (const [x, y] of [least, [least[1], least[0]]]) {
    feel(state, x, 'security', -1.2);
    // The one less invested takes it as a sign.
    if (romance(x, y) < romance(y, x)) nudgeAttraction(state, x, y, -0.3);
  }
  out.push(scene(state, rng, 'sorts-podium', [...least], { of: 'least', pop: pop([least[0], 0.2, 1.5], [least[1], 0.2, 1.5]) }, [...least]));
  return out;
}

// ── THE GRAFTIES (UK 11 d49)
// An awards night the public voted for. On the night of a vote: the villa
// hears who the public love just before the public decide who goes.
function grafties(state, rng) {
  if (state.couples.length < 2) return [];
  const { couple, grafter, least } = publicAwards(state, { rng });
  const out = [];
  if (couple) {
    for (const n of couple) { feel(state, n, 'confidence', 1.5); feel(state, n, 'security', 0.8); }
    out.push(scene(state, rng, 'grafties-award', [...couple], { of: 'couple', pop: pop([couple[0], 0.3, 1.5], [couple[1], 0.3, 1.5]) }));
  }
  if (grafter) {
    feel(state, grafter, 'confidence', 1);
    const p = partnerOf(state, grafter);
    // "Grafter of the year" is a compliment until your partner hears it.
    if (p) { feel(state, p, 'security', -0.8); addRelationshipDimension(p, grafter, 'trust', -0.3); }
    out.push(scene(state, rng, 'grafties-award', [grafter, ...(p ? [p] : [])], { of: 'grafter', pop: pop([grafter, 0.2, 2]) }));
  }
  if (least) {
    feel(state, least, 'confidence', -1.5); feel(state, least, 'stress', 1.5);
    const p = partnerOf(state, least);
    if (p) feel(state, p, 'stress', 0.8);
    out.push(scene(state, rng, 'grafties-award', [least, ...(p ? [p] : [])], { of: 'least', pop: pop([least, 0.4, 1.5]) }, [least]));
  }
  return out;
}

// The names, and when each is drawn, live in schedule.js (data only).
export const CHALLENGES = { receipts, 'look-who': lookWho, snogger, 'couple-goals': coupleGoals,
  'knowing-me': knowingMe, talent: talentShow, baby: babyDolls, 'couple-of-sorts': coupleOfSorts, grafties,
  'lie-detector': lieDetector, ...MORE_CHALLENGES };
export { CHALLENGE_NAMES };

/** The day's named challenge, or [] when the villa cannot play it tonight. */
export function runChallenge(state, rng, id) {
  const run = CHALLENGES[id];
  if (!run) return [];
  state.phase = 'challenge';
  const events = run(state, rng) || [];
  if (!events.length) return [];
  // Every game starts with a text, read out by whoever gets to the phone.
  const reader = state.villa[Math.floor(rng() * state.villa.length)];
  const text = scene(state, rng, 'challenge-text', [reader], { of: id, pop: pop([reader, 0, 0.3]) });
  // …and then how it works: the set-up, what they do, how it is won
  // (lines/challenge-rules.js). The text alone left the viewer asking what
  // was happening.
  const how = scene(state, rng, 'challenge-rules', [], { of: id, pop: {} });
  return [text, how, ...events];
}

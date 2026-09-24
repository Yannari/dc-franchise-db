// ══════════════════════════════════════════════════════════════════════
// pm/challenges-more.js — eight more of the villa's named challenges
// ══════════════════════════════════════════════════════════════════════
//
// User: "write more named challenges" (a season drew about five, so most
// days had only the unnamed game). Every one is a format the real show
// plays season after season — from the wiki's challenge tables for UK 5-9
// (loveisland.fandom.com): the day, and what it is for, beside each. Same
// rule as pm/challenges.js: the game is the excuse; what comes out of it
// moves bonds, beliefs and feelings, and the scenes carry only what the
// players could know.
import { addBond } from '../bonds.js';
import { addRelationshipDimension, getRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf } from './events.js';
import { romance, friendship, revealTruth } from './feelings.js';
import { nudgeAttraction, attr, ickHit } from './chemistry.js';
import { coupleStrength } from './ladder.js';
import { feel, jealousyHit } from './emotions.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pop = (...rows) => Object.fromEntries(rows.filter(r => r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const S = (state, n) => state.profiles[n].stats;
const side = (state, g) => state.villa.filter(n => state.profiles[n].gender === g);
const scene = (state, rng, kind, players, extra = {}, major = []) =>
  makeEvent(state, rng, { phase: 'challenge', kind, players, aired: true, major, extra });
const shuffle = (rng, xs) => xs.map(x => [x, rng()]).sort((a, b) => a[1] - b[1]).map(([x]) => x);
// Who a has eyes for, other than a's own partner (null when nobody).
const eyeFor = (state, a) => state.villa.filter(n => n !== a && n !== partnerOf(state, a) && attr(state, a, n) != null)
  .sort((x, y) => (attr(state, a, y) ?? 0) - (attr(state, a, x) ?? 0))[0] || null;

// ── SUCK AND BLOW (UK 5 d15, UK 8 d42)
// A line of islanders, boy-girl-boy, passing a card mouth to mouth. Whoever
// drops it does the dare written on it. The drop is the nerves (temper);
// the dare is where it goes wrong: kissing the one you fancy in front of the
// one you're with.
function suckAndBlow(state, rng) {
  const f = shuffle(rng, side(state, 'f')), m = shuffle(rng, side(state, 'm'));
  const line = [];
  for (let i = 0; i < Math.max(f.length, m.length); i++) { if (m[i]) line.push(m[i]); if (f[i]) line.push(f[i]); }
  if (line.length < 6) return [];
  const out = [];
  let slips = 0, dares = 0;
  for (let i = 0; i + 1 < line.length && dares < 3; i++) {
    const [x, y] = [line[i], line[i + 1]];
    // Lips touching mid-pass, between two who are not together.
    if (slips < 1 && partnerOf(state, x) !== y && (attr(state, x, y) ?? 0) + (attr(state, y, x) ?? 0) > 9 && rng() < 0.5) {
      slips++;
      nudgeAttraction(state, x, y, 0.3); nudgeAttraction(state, y, x, 0.3);
      for (const [a, b] of [[x, y], [y, x]]) { const p = partnerOf(state, a); if (p) jealousyHit(state, p, a, b, 1.5); }
      out.push(scene(state, rng, 'blow-slip', [x, y], { pop: pop([x, 0, 1.5], [y, 0, 1.5]) }));
    }
    // The drop, in proportion to nerves.
    if (rng() >= 0.12 + 0.25 * (1 - S(state, x).temperament / 10)) continue;
    dares++;
    const r = rng(), p = partnerOf(state, x), eye = eyeFor(state, x);
    if (eye && r < 0.45) {
      // "Kiss the islander you fancy most in here, other than your partner."
      nudgeAttraction(state, x, eye, 0.4); nudgeAttraction(state, eye, x, 0.2);
      if (p) { jealousyHit(state, p, x, eye, 2.5, { confirmed: true }); addRelationshipDimension(p, x, 'trust', -0.4); }
      out.push(scene(state, rng, 'blow-dare', [x, eye, ...(p ? [p] : [])], { of: 'kiss-other', pop: pop([x, p ? -0.4 : 0, 2]) }, p ? [x] : []));
    } else if (p && r < 0.75) {
      addBond(x, p, 0.4); feel(state, p, 'security', 0.5);
      out.push(scene(state, rng, 'blow-dare', [x, p], { of: 'kiss-partner', pop: pop([x, 0.3, 1], [p, 0.2, 1]) }));
    } else {
      feel(state, x, 'confidence', 0.4);
      out.push(scene(state, rng, 'blow-dare', [x], { of: 'forfeit', pop: pop([x, 0.4, 1.5]) }));
    }
  }
  return out;
}

// ── LIP SERVICE (UK 5 d16 "Eyes on the Fries", UK 6 d16 "Getting Trollied",
// UK 7 d15 "Spit the Roast", UK 8 d15 "Lip Service")
// Couples pass a cocktail's ingredients mouth to mouth across a slippery
// floor. The couple who work best together win; the worst either laugh it
// off or turn on each other.
function lipService(state, rng) {
  if (state.couples.length < 3) return [];
  const score = ([a, b]) => coupleStrength(state, a, b) * 3 + (S(state, a).physical + S(state, b).physical) / 10 + rng() * 2.5;
  const ranked = [...state.couples].map(c => [c, score(c)]).sort((x, y) => y[1] - x[1]).map(([c]) => c);
  const [win, worst] = [ranked[0], ranked[ranked.length - 1]];
  const out = [];
  addBond(win[0], win[1], 0.5);
  for (const n of win) feel(state, n, 'confidence', 0.6);
  out.push(scene(state, rng, 'lip-race', [...win], { of: 'win', pop: pop([win[0], 0.3, 1.5], [win[1], 0.3, 1.5]) }));
  // Somebody who wants one of the winners has to watch it.
  const watcher = state.villa.find(n => !win.includes(n) && win.some(w => romance(n, w) >= 5 && partnerOf(state, n) !== w));
  if (watcher) {
    const w = win.find(x => romance(watcher, x) >= 5);
    jealousyHit(state, watcher, w, win.find(x => x !== w), 2);
    out.push(scene(state, rng, 'lip-watch', [watcher, w, win.find(x => x !== w)], { pop: pop([watcher, 0.2, 1]) }));
  }
  // The worst couple: a laugh, or a row, by their tempers.
  const hot = (20 - S(state, worst[0]).temperament - S(state, worst[1]).temperament) / 20;
  if (rng() < 0.2 + 0.6 * hot) {
    addBond(worst[0], worst[1], -0.5); addRelationshipDimension(worst[0], worst[1], 'resentment', 0.3);
    out.push(scene(state, rng, 'lip-race', [...worst], { of: 'row', pop: pop([worst[0], -0.3, 1.5], [worst[1], 0, 1]) }));
  } else {
    addBond(worst[0], worst[1], 0.2);
    out.push(scene(state, rng, 'lip-race', [...worst], { of: 'laugh', pop: pop([worst[0], 0.3, 1], [worst[1], 0.3, 1]) }));
  }
  return out;
}

// ── TOWER OF TRUTHS (UK 5 d6)
// Each couple pulls blocks out of a tower; every block is a question they
// have to ask the one they're coupled with. The dangerous one: "Who would you
// go for, if I wasn't here?" — answered honestly (loyalty to the truth) or
// dodged, and the partner can tell (intuition).
function towerOfTruths(state, rng) {
  if (state.couples.length < 2) return [];
  const out = [];
  for (const [p, q] of shuffle(rng, state.couples).slice(0, 4)) {
    const [asker, a] = rng() < 0.5 ? [p, q] : [q, p];
    const r = rng();
    const eye = eyeFor(state, a);
    if (eye && r < 0.5) {
      // A real answer exists only if a fancies somebody else.
      const real = (attr(state, a, eye) ?? 0) >= (attr(state, a, asker) ?? 0) - 1;
      if (real && rng() < 0.3 + 0.5 * S(state, a).loyalty / 10) {
        revealTruth(state, asker, a); jealousyHit(state, asker, a, eye, 2.5, { confirmed: true });
        addRelationshipDimension(asker, a, 'trust', 0.2);           // honest, at least
        out.push(scene(state, rng, 'tower-q', [a, asker, eye], { of: 'other-honest', pop: pop([a, 0.2, 1.5], [asker, 0.3, 1]) }, [a, asker]));
      } else {
        // A dodge: "You. Obviously." True, or not; the partner may read it.
        if (real) feel(state, a, 'guilt', 0.4);
        const seen = real && rng() < S(state, asker).intuition / 12;
        if (seen) { addRelationshipDimension(asker, a, 'trust', -0.5); feel(state, asker, 'security', -0.5); }
        else feel(state, asker, 'security', 0.4);
        out.push(scene(state, rng, 'tower-q', [a, asker], { of: seen ? 'dodge-seen' : 'dodge', pop: pop([a, 0, 1]) }));
      }
    } else if (r < 0.8) {
      // "Out of ten, how happy are you with me?" — the number is the feeling.
      const n = Math.round(clamp(romance(a, asker) + (rng() - 0.5), 1, 10));
      feel(state, asker, 'security', (n - 6) / 3);
      out.push(scene(state, rng, 'tower-q', [a, asker], { of: n >= 8 ? 'rate-high' : n >= 5 ? 'rate-mid' : 'rate-low', pop: pop([a, 0.1, 1]) }));
    } else {
      // "What's your ick about me?" — somebody has one, or nobody does.
      const hit = ickHit(state.profiles[a], state.profiles[asker]);
      if (hit > 0.3) { feel(state, asker, 'confidence', -0.5); nudgeAttraction(state, a, asker, -0.1); }
      out.push(scene(state, rng, 'tower-q', [a, asker], { of: hit > 0.3 ? 'ick' : 'no-ick', pop: pop([a, 0, 1]) }));
    }
  }
  return out;
}

// ── THE COURSE (the boys: UK 5 d5 "The Good, the Bad and the Sexy", UK 6 d11
// "Lads Vegas", UK 7 d6 "Undercover Lover", UK 8 d9 "Men-chanics" and d47
// "You've Got Male", UK 9 d22 "Ladiators"; the girls: UK 5 d21 "Gym Bunnies",
// UK 6 d6 "Booty Camp", UK 8 d12 "Sex Sea" and d51 "Mile High", UK 9 d9
// "Space Raunch")
// One side runs a themed obstacle course in costume, and at the end each of
// them "rescues" the islander of their choice — the other side then picks a
// winner. Choosing somebody who is not your partner is the point.
function course(state, rng, g) {
  const runners = side(state, g), judges = state.villa.filter(n => state.profiles[n].gender !== g);
  if (runners.length < 3 || judges.length < 3) return [];
  const q = Object.fromEntries(runners.map(n => [n, 0.4 * S(state, n).physical + 0.4 * S(state, n).boldness + 0.2 * S(state, n).social + (rng() - 0.5) * 3]));
  const out = [];
  const ranked = [...runners].sort((x, y) => q[y] - q[x]);
  out.push(scene(state, rng, 'course-run', [ranked[0]], { of: 'strong', pop: pop([ranked[0], 0.4, 1.5]) }));
  const flop = ranked[ranked.length - 1];
  feel(state, flop, 'confidence', -0.4);
  out.push(scene(state, rng, 'course-run', [flop], { of: 'flop', pop: pop([flop, 0.5, 1.5]) }));
  // The rescue: the partner, or the one they have eyes for — in proportion
  // to how much more they fancy them and how little loyalty holds them.
  let strays = 0;
  for (const a of shuffle(rng, runners)) {
    const p = partnerOf(state, a), eye = eyeFor(state, a);
    const pull = eye ? (attr(state, a, eye) ?? 0) - (p ? attr(state, a, p) ?? 0 : 0) : -10;
    const stray = eye && (!p || rng() < clamp(0.15 + pull / 10, 0, 0.8) * (1.1 - S(state, a).loyalty / 10));
    if (stray && strays < 2) {
      strays++;
      nudgeAttraction(state, eye, a, 0.4);
      if (p) { jealousyHit(state, p, a, eye, 3, { confirmed: true }); addRelationshipDimension(p, a, 'trust', -0.6); }
      const ep = partnerOf(state, eye);
      if (ep && ep !== a) jealousyHit(state, ep, eye, a, 1.5);
      out.push(scene(state, rng, 'course-pick', [a, eye, ...(p ? [p] : [])], { of: p ? 'other' : 'single', pop: pop([a, p ? -0.5 : 0.2, 2]) }, p ? [a, p] : []));
    } else if (p && out.filter(e => e.kind === 'course-pick').length < 3) {
      addBond(a, p, 0.3); feel(state, p, 'security', 0.5);
      out.push(scene(state, rng, 'course-pick', [a, p], { of: 'partner', pop: pop([a, 0.2, 1]) }));
    }
  }
  // The judges vote: the performance, and who they fancy.
  const votes = {};
  for (const j of judges) {
    const pick = runners.map(n => [n, q[n] + 0.4 * (attr(state, j, n) ?? 0)]).sort((x, y) => y[1] - x[1])[0][0];
    votes[pick] = (votes[pick] || 0) + 1;
  }
  const winner = [...runners].sort((x, y) => (votes[y] || 0) - (votes[x] || 0) || q[y] - q[x])[0];
  feel(state, winner, 'confidence', 1.5);
  out.push(scene(state, rng, 'course-win', [winner, ...(partnerOf(state, winner) ? [partnerOf(state, winner)] : [])], { pop: pop([winner, 0.5, 2]) }));
  return out;
}

// ── THE BLINDFOLD COURSE (UK 5 d44 "Doggy Style", UK 6 d30 "Girl Racers")
// One of each couple blindfolded, the other shouting directions. The couple
// who trust each other get round; the ones who don't end up in the pool,
// laughing or not.
function blindCourse(state, rng) {
  if (state.couples.length < 3) return [];
  const g = rng() < 0.5 ? 'f' : 'm';
  const pairs = state.couples.map(([a, b]) => state.profiles[a].gender === g ? [b, a] : [a, b]);   // [guide, blind]
  const score = ([gd, bl]) => (getRelationshipDimension(bl, gd, 'trust') + 10) / 20 * 3 + (S(state, gd).social + S(state, bl).intuition) / 10 + rng() * 2;
  const ranked = pairs.map(p => [p, score(p)]).sort((x, y) => y[1] - x[1]).map(([p]) => p);
  const [win, worst] = [ranked[0], ranked[ranked.length - 1]];
  const out = [];
  addRelationshipDimension(win[1], win[0], 'trust', 0.6); addBond(win[0], win[1], 0.4);
  out.push(scene(state, rng, 'blind-run', [...win], { of: 'win', pop: pop([win[0], 0.3, 1.5], [win[1], 0.3, 1.5]) }));
  const hot = (20 - S(state, worst[0]).temperament - S(state, worst[1]).temperament) / 20;
  if (rng() < 0.15 + 0.6 * hot) {
    addRelationshipDimension(worst[1], worst[0], 'trust', -0.4); addBond(worst[0], worst[1], -0.4);
    out.push(scene(state, rng, 'blind-run', [...worst], { of: 'crash-row', pop: pop([worst[0], -0.2, 1.5], [worst[1], 0, 1]) }));
  } else {
    addBond(worst[0], worst[1], 0.2);
    out.push(scene(state, rng, 'blind-run', [...worst], { of: 'crash-laugh', pop: pop([worst[0], 0.3, 1], [worst[1], 0.3, 1]) }));
  }
  return out;
}

// ── SPORTS DAY (UK 7 d28, UK 9 d46)
// Two teams, a string of school sports-day races. Team scores are averages,
// never sums (CLAUDE.md). The captains square up; the losing team has one
// who takes it badly.
function sportsDay(state, rng) {
  if (state.villa.length < 6) return [];
  const all = shuffle(rng, state.villa);
  const teams = [all.filter((_, i) => i % 2 === 0), all.filter((_, i) => i % 2 === 1)];
  const avg = t => t.reduce((s, n) => s + 0.5 * S(state, n).physical + 0.3 * S(state, n).endurance + 0.2 * S(state, n).boldness, 0) / t.length;
  const score = teams.map(t => avg(t) + rng() * 1.5);
  const [W, L] = score[0] >= score[1] ? teams : [teams[1], teams[0]];
  const cap = t => [...t].sort((x, y) => S(state, y).boldness - S(state, x).boldness)[0];
  const [cw, cl] = [cap(W), cap(L)];
  const out = [];
  // The captains: banter or a clash, by temper.
  const clash = rng() < ((10 - S(state, cw).temperament) + (10 - S(state, cl).temperament)) / 25;
  if (clash) { addBond(cw, cl, -0.6); addRelationshipDimension(cl, cw, 'resentment', 0.4); }
  else addBond(cw, cl, 0.3);
  out.push(scene(state, rng, 'sports-captains', [cw, cl], { of: clash ? 'clash' : 'banter', pop: pop([cw, clash ? -0.2 : 0.2, 1.2], [cl, clash ? -0.2 : 0.2, 1.2]) }));
  for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) addBond(W[i], W[j], 0.15);
  out.push(scene(state, rng, 'sports-win', [cw, ...W.filter(n => n !== cw).slice(0, 3)], { pop: Object.fromEntries(W.map(n => [n, { approval: 0.1, fame: 0.8 }])) }));
  // The sore loser: the one on the losing side with the shortest fuse.
  const sore = [...L].sort((x, y) => S(state, x).temperament - S(state, y).temperament)[0];
  if (S(state, sore).temperament < 6 && rng() < 0.7) {
    feel(state, sore, 'stress', 0.5);
    const mate = L.filter(n => n !== sore).sort((x, y) => friendship(sore, y) - friendship(sore, x))[0];
    if (mate) addBond(sore, mate, -0.2);
    out.push(scene(state, rng, 'sports-sore', [sore, ...(mate ? [mate] : [])], { pop: pop([sore, -0.4, 1.2]) }));
  }
  return out;
}

// ── THE HEADLINES (UK 5 d50 "Sidebar of Shame", UK 6 d32 "News Splash",
// UK 5 d24 "Online Buzz", UK 4 d52 "Shake It Off")
// Headlines about the islanders, as the papers wrote them — from what AIRED,
// so only what the public saw. An islander reads one out and throws a drink
// at whoever they think it's about. Right, and the villa hears it; wrong,
// and somebody innocent is soaked.
const HEADLINE_KINDS = { pull: 'pull', argument: 'row', ick: 'ick', 'love-said': 'love', comedy: 'clown', 'jealous-confront': 'jealous' };
function headlines(state, rng) {
  const cards = [], seen = new Set();
  for (const e of [...(state.history || [])].reverse()) {
    const of = HEADLINE_KINDS[e.kind];
    if (!of || !e.aired || e.ep < state.ep - 3 || e.ep >= state.ep || cards.some(c => c.of === of)) continue;
    const who = e.players[0];
    if (!state.villa.includes(who) || seen.has(who)) continue;
    if (of === 'pull' && !partnerOf(state, who)) continue;
    cards.push({ of, who, with: e.players[1] || null }); seen.add(who);
    if (cards.length >= 3) break;
  }
  if (cards.length < 2) return [];
  const out = [];
  for (const c of cards) {
    const readers = state.villa.filter(n => n !== c.who && n !== partnerOf(state, c.who));
    const reader = readers[Math.floor(rng() * readers.length)];
    if (!reader) continue;
    const right = rng() < 0.25 + 0.5 * S(state, reader).intuition / 10;
    const soaked = right ? c.who : shuffle(rng, state.villa.filter(n => n !== reader && n !== c.who))[0];
    const p = partnerOf(state, c.who);
    if (right && c.of === 'pull' && p) {
      // The partner hears, out loud, what the country already saw.
      revealTruth(state, p, c.who);
      if (c.with) jealousyHit(state, p, c.who, c.with, 2.5, { confirmed: true });
      addRelationshipDimension(p, c.who, 'trust', -0.6);
    }
    if (right && c.of === 'love' && p) feel(state, p, 'security', 0.6);
    if (!right && soaked) addRelationshipDimension(soaked, reader, 'resentment', 0.2);
    // Named in front of everyone and soaked for it, whatever the headline:
    // it stings, and so does the one who threw it (a right guess on a row's
    // headline used to change nothing at all).
    if (right) { feel(state, c.who, 'confidence', -0.4); addBond(c.who, reader, -0.3); }
    out.push(scene(state, rng, 'headline', [reader, soaked, c.who, ...(p && c.of === 'pull' ? [p] : [])],
      { of: c.of, guessed: right, pop: pop([c.who, c.of === 'pull' ? -0.4 : c.of === 'love' ? 0.3 : 0, 1.5], [reader, 0.1, 1]) },
      right && c.of === 'pull' ? [c.who] : []));
  }
  return out;
}

export const MORE_CHALLENGES = {
  'suck-blow': suckAndBlow, 'lip-service': lipService, tower: towerOfTruths,
  'lads-course': (s, rng) => course(s, rng, 'm'), 'girls-course': (s, rng) => course(s, rng, 'f'),
  'blind-course': blindCourse, 'sports-day': sportsDay, headlines,
};

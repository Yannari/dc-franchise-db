// ══════════════════════════════════════════════════════════════════════
// pm/villa-day.js — the ladder, the feelings and the friendships as scenes
// ══════════════════════════════════════════════════════════════════════
//
// Runs once per episode after the day's events: the ladder moves, feelings
// come out (a confrontation, a sulk, a staged flirt, a reassurance chat, or
// nothing but an overthinking beach hut), guilt confesses, confidants advise,
// Hideaway nights happen, and the scheduled ritual runs. Every scene has a
// consequence and takes only what its people could know (spec §6.7-6.9, §7).
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates, airLater } from './events.js';
import { romance, friendship, revealTruth, setMask } from './feelings.js';
import { nudgeAttraction, attr } from './chemistry.js';
import { syncLadder, decideLadder, closedness } from './ladder.js';
import { attachment, emo, feel, jealousyHit, jealousyOutlet, breakHeart, tickEmotions } from './emotions.js';
import { confidantOf, verdict, judgement } from './circle.js';
import { familyVerdict } from './arrivals.js';
import { BETRAYAL } from './ledger.js';
import { movieNight } from './movie-night.js';
import { secondChances } from './exes.js';
import { blowups } from './blowup.js';
import { breakdowns } from './breakdown.js';
import { triangles } from './triangle.js';
import { streamFor } from '../dr/rng.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (rng, arr) => (arr.length ? arr[Math.floor(rng() * arr.length)] : null);
const pop = (...rows) => Object.fromEntries(rows.map(([n, approval, fame]) => [n, { approval, fame }]));
const scene = (state, rng, kind, players, extra = {}, { aired = null, major = [], phase = 'evening' } = {}) =>
  makeEvent(state, rng, { phase, kind, players, aired, major, extra });

function ladderScenes(state, rng, days = 1) {
  const out = [];
  // An episode is two or three villa days, and the ladder moves by the day.
  const decisions = [];
  for (let i = 0; i < Math.max(1, days); i++) decisions.push(...decideLadder(state, rng, attachment));
  for (const d of decisions) {
    const { from: a, to: b } = d;
    const love = romance(a, b) / 10, loveBack = romance(b, a) / 10;
    if (d.kind === 'close-off') {
      feel(state, b, 'security', 1.5 * loveBack);
      out.push(scene(state, rng, 'close-off', [a, b], { pop: pop([a, 0.4, 1], [b, 0.2, 0.5]) }));
    } else if (d.kind === 'keeping-open') {
      feel(state, b, 'security', -1 * loveBack);
      out.push(scene(state, rng, 'keeping-open', [a, b], { pop: pop([a, -0.1, 1]) }));
    } else if (d.kind === 'open-back-up') {
      if (d.told) {
        breakHeart(state, b, a, 3 * loveBack * (0.5 + closedness(state, b, a)));
        addRelationshipDimension(b, a, 'resentment', 1.5 * loveBack);
        out.push(scene(state, rng, 'open-back-up', [a, b], { pop: pop([a, -1, 2], [b, 1, 1.5]) },
          { aired: true, major: [a, b] }));
      } else {
        // Nobody was told: a situationship now, and it will surface.
        out.push(scene(state, rng, 'head-turned', [a], { pop: pop([a, -0.3, 1]) }, { phase: 'day' }));
      }
    } else if (d.kind === 'exclusive-ask' || d.kind === 'official-ask') {
      const big = d.kind === 'official-ask';
      if (d.yes) {
        for (const n of [a, b]) { feel(state, n, 'security', big ? 3 : 2); feel(state, n, 'confidence', 1); }
        addRelationshipDimension(a, b, 'trust', 1); addRelationshipDimension(b, a, 'trust', 1);
        out.push(scene(state, rng, d.kind, [a, b], { yes: true, pop: pop([a, big ? 3 : 1.5, 3], [b, big ? 3 : 1.5, 3]) },
          { aired: true, major: big ? [a, b] : [] }));
        out.push(...hideaway(state, rng, a, b));
      } else {
        breakHeart(state, a, b, (big ? 3 : 2) * love);
        feel(state, b, 'guilt', 1);
        out.push(scene(state, rng, 'ask-declined', [a, b], { of: d.kind, pop: pop([a, 1.5, 2], [b, -0.5, 1.5]) },
          { aired: true, major: [a] }));
      }
    } else if (d.kind === 'love-said') {
      for (const n of [a, b]) feel(state, n, 'security', 2.5);
      addRelationshipDimension(a, b, 'love', 0.5); addRelationshipDimension(b, a, 'love', 0.5);
      out.push(scene(state, rng, 'love-said', [a, b], { pop: pop([a, 2, 2.5], [b, 2, 2.5]) }, { aired: true, major: [a, b] }));
    } else if (d.kind === 'love-hanging') {
      breakHeart(state, a, b, 2.5 * love);
      out.push(scene(state, rng, 'love-hanging', [a, b], { pop: pop([a, 1.5, 2], [b, -0.5, 1.5]) }, { aired: true, major: [a] }));
    }
  }
  return out;
}

function hideaway(state, rng, a, b) {
  addRelationshipDimension(a, b, 'love', 0.8); addRelationshipDimension(b, a, 'love', 0.8);
  const out = [scene(state, rng, 'hideaway', [a, b], { pop: pop([a, 0.5, 2], [b, 0.5, 2]) }, { aired: true })];
  // Anyone still carrying a torch for either of them feels it, unconfirmed.
  for (const o of state.villa) {
    if (o === a || o === b) continue;
    for (const t of [a, b]) if (romance(o, t) >= 6) {
      breakHeart(state, o, t, 0.8 * romance(o, t) / 10);
      out.push(scene(state, rng, 'torch', [o, t], { pop: pop([o, 0.3, 0.5]) }));
    }
  }
  return out;
}

/** Jealousy has to come out somewhere. */
function feelingScenes(state, rng) {
  const out = [];
  for (const n of state.villa) {
    const e = emo(state, n), partner = partnerOf(state, n);
    if (!partner) continue;
    const [rival, j] = Object.entries(e.jealousy).sort((x, y) => y[1] - x[1])[0] || [null, 0];
    if (!rival || rng() >= clamp(j / 10, 0, 0.9)) continue;
    const how = jealousyOutlet(state, n, rng);
    if (how === 'confront') {
      addRelationshipDimension(n, partner, 'trust', -0.5);
      addRelationshipDimension(partner, n, 'resentment', 0.3 * (1 - emo(state, partner).guilt / 10));
      e.jealousy[rival] *= 0.5;
      out.push(scene(state, rng, 'jealous-confront', [n, partner, rival], { pop: pop([n, -0.3, 2], [partner, 0, 1.5]) }, { aired: true }));
    } else if (how === 'sulk') {
      feel(state, n, 'security', -0.5);
      const noticed = rng() < state.profiles[partner].stats.intuition / 10;
      out.push(scene(state, rng, 'jealous-sulk', [n], { noticed, pop: pop([n, 0.1, 0.8]) }, { phase: 'day' }));
      if (noticed) out.push(reassurance(state, rng, n, partner));
    } else if (how === 'retaliate') {
      const bait = pick(rng, roomMates(state, n).filter(o => o !== partner && attr(state, n, o) != null));
      if (bait) {
        nudgeAttraction(state, bait, n, 0.4);
        jealousyHit(state, partner, n, bait, 3, { confirmed: true });
        out.push(scene(state, rng, 'jealous-retaliate', [n, bait, partner], { pop: pop([n, -0.6, 2], [bait, 0, 1]) }, { aired: true }));
      }
    } else if (how === 'reassure') {
      out.push(reassurance(state, rng, n, partner));
    } else {
      feel(state, n, 'stress', 0.5);
      out.push(scene(state, rng, 'overthinking', [n], { pop: pop([n, 0.3, 0.6]) }, { phase: 'day' }));
    }
  }
  return out;
}

function reassurance(state, rng, n, partner) {
  const e = emo(state, n);
  const real = romance(partner, n) / 10;
  const avo = attachment(state.profiles[partner]).avoidance;
  feel(state, n, 'security', 3 * real - 0.5);
  for (const r of Object.keys(e.jealousy)) e.jealousy[r] *= 1 - 0.6 * real;
  // An avoidant partner can find the checking-in wearing.
  if (avo > 0.4) nudgeAttraction(state, partner, n, -0.3 * avo);
  return scene(state, rng, 'reassurance', [n, partner], { pop: pop([n, 0.2, 1], [partner, 0.2 * real, 0.8]) });
}

/** Guilt that has grown heavy enough gets confessed — loyalty decides it. */
function confessions(state, rng) {
  const out = [];
  for (const n of state.villa) {
    const partner = partnerOf(state, n), e = emo(state, n);
    if (!partner || rng() >= (e.guilt / 10) * (state.profiles[n].stats.loyalty / 10)) continue;
    const secrets = state.secrets.filter(s => !s.known && s.who === n && s.partner === partner);
    if (!secrets.length) continue;
    for (const s of secrets) s.known = true;
    revealTruth(state, partner, n);
    jealousyHit(state, partner, n, secrets[0].with || n, 4, { confirmed: true });
    addRelationshipDimension(partner, n, 'trust', -1);
    addRelationshipDimension(partner, n, 'resentment', 0.8);    // less than being caught
    e.guilt = Math.max(0, e.guilt - 3);
    // The secret rides along, so the words say what it was (a kiss is not a chat).
    out.push(scene(state, rng, 'confession', [n, partner], { secret: secrets[0].id, pop: pop([n, 0.5, 2], [partner, 0.8, 1.5]) }, { aired: true, major: [partner] }));
  }
  return out;
}

/** Confidants say what they think of the partner, and it moves them. */
function advice(state, rng) {
  const out = [];
  for (const n of state.villa) {
    const partner = partnerOf(state, n), c = confidantOf(state, n);
    if (!partner || !c || rng() >= 0.3) continue;
    const v = verdict(state, c, partner);
    nudgeAttraction(state, n, partner, 0.6 * v);
    addRelationshipDimension(n, partner, 'trust', 0.5 * v);
    feel(state, n, 'security', v);
    out.push(scene(state, rng, 'advice', [c, n, partner], { verdict: v, pop: pop([c, 0.1, 0.8]) }, { phase: 'day' }));
  }
  return out;
}

// ── The villa's rituals ────────────────────────────────────────────────
// The two that are games open on how they work, like every named challenge
// (lines/challenge-rules.js). Made after the game, so its dice are the ones
// it always had; shown first.
function withRules(state, rng, id, out) {
  if (!out.length) return out;
  return [scene(state, rng, 'challenge-rules', [], { of: id, pop: {} }, { phase: 'event', aired: true }), ...out];
}

const RITUALS = {
  // The monitor airs who really gets their heart going — hidden crushes included.
  'heart-rate': (state, rng) => withRules(state, rng, 'heart-rate', state.villa.flatMap(x => {
    const top = state.villa.filter(o => attr(state, x, o) != null).sort((a, b) => romance(x, b) - romance(x, a))[0];
    if (!top) return [];
    const partner = partnerOf(state, x);
    const out = [scene(state, rng, 'heart-rate', [x, top], { partner, pop: pop([x, 0.2, 1.5]) }, { phase: 'event', aired: true })];
    if (partner && top !== partner) {
      setMask(state, x, top, null);
      jealousyHit(state, partner, x, top, 3, { confirmed: true });
      revealTruth(state, partner, x);
    }
    return out;
  })),
  'snog-marry-pie': (state, rng) => withRules(state, rng, 'snog-marry-pie', state.villa.flatMap(x => {
    const partner = partnerOf(state, x);
    const others = state.villa.filter(o => o !== x);
    const snog = others.filter(o => o !== partner && attr(state, x, o) != null).sort((a, b) => romance(x, b) - romance(x, a))[0];
    const marry = partner || others.filter(o => attr(state, x, o) != null).sort((a, b) => romance(x, b) - romance(x, a))[0];
    const pie = others.filter(o => o !== partner).sort((a, b) => friendship(x, a) - friendship(x, b))[0];
    if (pie) { addRelationshipDimension(pie, x, 'resentment', 1.5); feel(state, pie, 'confidence', -1); }
    if (snog && partner) jealousyHit(state, partner, x, snog, 3, { confirmed: true });
    if (marry) feel(state, marry, 'security', 1.5);
    return [scene(state, rng, 'snog-marry-pie', [x, snog, marry, pie].filter(Boolean), { snog, marry, pie, pop: pop([x, 0, 1.5]) },
      { phase: 'event', aired: true })];
  })),
  // Unaired moments played to the villa; the partners find out, and the
  // villa is accused of judging friends more softly than rivals.
  // Movie Night (pm/movie-night.js): the text, the seats, clips of what really
  // happened in their own words, the faces, and the rows after.
  'movie-night': (state, rng) => {
    const out = movieNight(state, rng);
    // Two islanders caught doing the same thing, judged differently by the
    // villa: the double standard, said out loud.
    const caught = out.filter(e => e.kind === 'movie-clip' && e.extra.of !== 'loyalty').map(e => e.extra.audience[1]);
    if (caught.length >= 2) {
      const gap = Math.max(...state.villa.map(v => Math.abs(judgement(state, v, caught[0]) - judgement(state, v, caught[1]))));
      if (gap > 0.4) out.push(scene(state, rng, 'double-standard', [caught[0], caught[1]], { pop: {} }, { aired: true, phase: 'cinema' }));
    }
    return out;
  },
  // Anonymous notes: said out loud, then everyone guesses who wrote it.
  notes: (state, rng) => state.villa.flatMap(x => {
    const t = state.villa.filter(o => o !== x).sort((a, b) => friendship(x, a) - friendship(x, b))[0];
    if (!t) return [];
    feel(state, t, 'confidence', -1.5); feel(state, t, 'stress', 1);
    const guess = state.villa.filter(o => o !== t).sort((a, b) => friendship(t, a) - friendship(t, b))[0];
    if (guess === x && rng() < state.profiles[t].stats.intuition / 10) addRelationshipDimension(t, x, 'resentment', 1.5);
    return [scene(state, rng, 'notes', [x, t], { guessed: guess === x, pop: pop([t, 0.3, 1]) }, { phase: 'event', aired: true })];
  }),
  // The families watched the aired show; what they think lands on the couple.
  families: (state, rng) => state.couples.flatMap(([a, b]) => [[a, b], [b, a]].map(([x, y]) => {
    const v = familyVerdict(state, x, y);
    nudgeAttraction(state, x, y, 0.8 * v);
    addRelationshipDimension(x, y, 'trust', v);
    feel(state, x, 'security', 1.5 * v);
    return scene(state, rng, 'families', [x, y], { verdict: v, pop: pop([x, 0.8, 1.5], [y, 0.5 * v, 1]) }, { phase: 'event', aired: true });
  })),
};

export function runVillaDay(state, rng, entry) {
  syncLadder(state);
  const days = entry.days ? Math.max(1, entry.days[1] - entry.days[0] + 1) : 1;
  const out = [...ladderScenes(state, rng, days), ...feelingScenes(state, rng),
    ...confessions(state, rng), ...advice(state, rng), ...secondChances(state, rng, entry)];
  for (const r of entry.rituals || []) out.push(...(RITUALS[r]?.(state, rng) || []));
  // The love triangles (pm/triangle.js), each a story over episodes — on
  // their own dice, before the fights (a rivalry can boil over tonight).
  out.push(...triangles(state, streamFor(state.seed ?? 1, `triangle:${state.ep}${state.epSalt || ''}`), entry));
  // When it kicks off (pm/blowup.js): after the night's reveals — Movie Night
  // included — never before them.
  out.push(...blowups(state, rng, entry, out));
  // …and when it all gets too much (pm/breakdown.js): after the night's hurt.
  // (On its own dice, so the rest of the day plays exactly as it did without it.)
  out.push(...breakdowns(state, streamFor(state.seed ?? 1, `breakdown:${state.ep}${state.epSalt || ''}`), entry));
  tickEmotions(state);
  return out;
}

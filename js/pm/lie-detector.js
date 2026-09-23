// ══════════════════════════════════════════════════════════════════════
// pm/lie-detector.js — the Lie Detector (UK 1 d34, UK 2 d40, UK 3 d45,
// UK 4 d51, AU 1 d37)
// ══════════════════════════════════════════════════════════════════════
//
// Read from the wiki's own tables (love-island-itv.fandom.com, "Lie Detector
// Test"): one side of the couples is strapped in; each partner writes the
// questions; ANOTHER islander reads them out; the light goes green (true),
// red (lie) or blue (uncertain). Four seasons of five put the boys in the
// chair, UK 3 the girls. The questions are the partner's worries — "Do you
// see a future with Hannah outside the villa?", "Do you still wish you were
// coupled up with Naomi?", "Are you in the villa just for fame?", "Could you
// be tempted by other girls outside the villa?" (UK 4, Jack and Dani: the red
// on that one was the row). The machine is not always right — Alex's "Are your
// feelings real towards Olivia?" came up red, and they married — so it reads
// the TRUTH, not the answer, and gets it wrong now and then.
//
// Everyone watches, so every light lands on the partner in front of the villa.
// It was dropped after 2018 over welfare concerns; the simulator keeps it as
// an occasional late-season game.
//
//   lie-write     [p, f, a]      p tells friend f what they are going to ask a
//                                `of` is the worry: fancy-other · behind-back · love · tempted
//   lie-question  [a, b, c, (x)] b reads c's question to a; x is the one named in it.
//                                extra.parts: ask (q) → answer → read (green/red/blue) → react
//                                extra.of (the truth of it): clean · caught · false-red ·
//                                got-away · admit · blue
//   lie-row       [a, c]         after a red: `of` own-it · deny · broken
import { addBond } from '../bonds.js';
import { addRelationshipDimension, getRelationshipDimension } from '../relationships.js';
import { makeEvent } from './events.js';
import { romance, friendship, revealTruth } from './feelings.js';
import { attr } from './chemistry.js';
import { emo, feel, jealousOf, jealousyHit, breakHeart, attachment } from './emotions.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const anx = (s, n) => s.profiles[n] ? attachment(s.profiles[n]).anxiety : 0;
const S = (state, n) => state.profiles[n]?.stats || {};
const scene = (state, rng, kind, players, extra = {}, major = []) =>
  makeEvent(state, rng, { phase: 'challenge', kind, players, aired: true, major, extra: { pop: {}, ...extra } });

// Each question: what makes the partner ask it, how likely the true answer is
// "yes", and the answer the one in the chair wants to give. `loaded` is a
// question whose red light hurts; the rest get a laugh.
const QUESTIONS = {
  future:  { yes: (s, a, c) => clamp(romance(a, c) / 10 * 1.1, 0.05, 0.95), want: 'yes', loaded: true,
    worry: (s, a, c) => 0.8 + anx(s, c) / 2 },
  love:    { yes: (s, a, c) => clamp((romance(a, c) - 2) / 8, 0.03, 0.95), want: 'yes', loaded: true,
    worry: (s, a, c) => 0.6 + romance(c, a) / 10 },
  'fancy-other': { yes: (s, a, c, x) => clamp((attr(s, a, x) ?? 0) / 10, 0.03, 0.9), want: 'no', loaded: true, named: true,
    worry: (s, a, c, x) => x ? 0.4 + jealousOf(s, c, x) / 3 : 0 },
  'behind-back': { fact: true, want: 'no', loaded: true,
    // trust runs -10..10
    worry: (s, a, c) => 0.3 + clamp((5 - (getRelationshipDimension(c, a, 'trust') ?? 0)) / 10, 0, 1) },
  tempted: { yes: (s, a) => clamp(0.2 + 0.6 * (1 - (S(s, a).loyalty ?? 5) / 10), 0.1, 0.8), want: 'no', loaded: true,
    worry: (s, a, c) => 0.3 + 0.6 * (1 - (S(s, a).loyalty ?? 5) / 10) + anx(s, c) / 4 },
  happy:   { yes: (s, a, c) => clamp(romance(a, c) / 9, 0.05, 0.95), want: 'yes', loaded: true,
    worry: (s, a, c) => 0.3 + (10 - emo(s, c).security) / 20 },
  fame:    { yes: (s, a) => ['fame', 'win', 'money'].includes(s.profiles[a]?.intent) ? 0.85 : 0.1, want: 'no', loaded: false,
    worry: (s, a) => 0.25 + (['fame', 'win', 'money', 'stir'].includes(s.profiles[a]?.intent) ? 0.3 : 0) },
  ex:      { yes: (s, a) => { const ex = s.profiles[a]?.ex; return ex && s.villa.includes(ex) ? clamp(romance(a, ex) / 10, 0.05, 0.9) : 0.3; },
    want: 'no', loaded: true, worry: (s, a) => s.profiles[a]?.ex ? 0.7 : 0 },
};

// The one they would be asked about: whoever they fancy most who is not their partner.
function rivalFor(state, a, c) {
  return state.villa.filter(n => n !== a && n !== c && state.profiles[n].gender !== state.profiles[a].gender)
    .map(n => [n, attr(state, a, n) ?? 0]).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
}

/** Which three questions c writes for a: always one about the two of them, then the worries. */
function questionsFor(state, rng, a, c, x) {
  const w = id => QUESTIONS[id].worry(state, a, c, x) * (0.6 + 0.8 * rng());
  const core = w('future') >= w('love') ? 'future' : 'love';
  const rest = Object.keys(QUESTIONS).filter(id => id !== 'future' && id !== 'love' && (id !== 'fancy-other' || x))
    .map(id => [id, w(id)]).sort((p, q) => q[1] - p[1]).slice(0, 2).map(([id]) => id);
  return [core, ...rest];
}

export function lieDetector(state, rng) {
  // Who sits in the chair is the season's, like the real show's (4 of 5: the boys).
  state.lieSide ||= rng() < 0.8 ? 'm' : 'f';
  const chair = state.couples.map(([p, q]) => state.profiles[p].gender === state.lieSide ? [p, q] : [q, p])
    .filter(([a, c]) => state.profiles[a].gender === state.lieSide && state.profiles[c].gender !== state.lieSide).slice(0, 5);
  if (chair.length < 2) return [];
  const out = [];
  const plans = chair.map(([a, c]) => {
    const x = rivalFor(state, a, c);
    return { a, c, x, qs: questionsFor(state, rng, a, c, x) };
  });

  // Writing the questions: the most worried partner tells a friend what they will ask.
  const worst = plans.map(pl => [pl, QUESTIONS[pl.qs[1]].worry(state, pl.a, pl.c, pl.x)]).sort((p, q) => q[1] - p[1])[0][0];
  const friend = state.villa.filter(n => n !== worst.c && n !== worst.a && state.profiles[n].gender === state.profiles[worst.c].gender)
    .sort((p, q) => friendship(worst.c, q) - friendship(worst.c, p))[0];
  const worryKind = ['fancy-other', 'behind-back', 'tempted'].includes(worst.qs[1]) ? worst.qs[1] : 'love';
  if (friend) {
    feel(state, worst.c, 'stress', 0.5);
    out.push(scene(state, rng, 'lie-write', [worst.c, friend, worst.a], { of: worryKind, pop: { [worst.c]: { approval: 0.2, fame: 1 } } }));
  }

  for (const { a, c, x, qs } of plans) {
    // Whoever reads them: somebody on c's side who is not c.
    // (Never the one the questions name: they are the one everybody turns to.)
    const readers = state.villa.filter(n => n !== c && n !== x && state.profiles[n].gender === state.profiles[c].gender);
    const b = readers[Math.floor(rng() * readers.length)] || c;
    let reds = 0, realReds = 0, caughtSecret = null;
    for (const q of qs) {
      const Q = QUESTIONS[q];
      const secret = q === 'behind-back' ? (state.secrets || []).find(s => s.who === a && s.partner === c && !s.known && !s.public) : null;
      const truth = Q.fact ? (secret ? 'yes' : 'no') : (rng() < Q.yes(state, a, c, x) ? 'yes' : 'no');
      // The answer they want to give, unless they are honest enough to say
      // the thing nobody wants to hear on camera.
      const unwelcome = truth !== Q.want;
      const admits = unwelcome && rng() < 0.35 * (S(state, a).loyalty ?? 5) / 10;
      const answer = admits ? truth : Q.want;
      const lie = answer !== truth;
      // The machine reads the truth, mostly (the wiki's own tables have
      // true answers read as lies and the other way round).
      const r = rng();
      const read = lie ? (r < 0.75 ? 'red' : r < 0.92 ? 'green' : 'blue') : (r < 0.82 ? 'green' : r < 0.94 ? 'red' : 'blue');
      const of = read === 'blue' ? 'blue' : admits ? 'admit' : lie ? (read === 'red' ? 'caught' : 'got-away') : (read === 'red' ? 'false-red' : 'clean');
      const hurts = Q.loaded && (read === 'red' || admits);
      const w = q === 'behind-back' || q === 'fancy-other' || q === 'love' ? 1.2 : 1;
      const pops = { [a]: { approval: 0, fame: 1.2 }, [c]: { approval: 0, fame: 0.8 } };

      if (hurts) {
        feel(state, c, 'security', -1.1 * w); feel(state, c, 'stress', 0.8);
        addRelationshipDimension(c, a, 'trust', -0.8 * w);
        pops[c].approval = 0.5;
        if (q === 'fancy-other' && x) jealousyHit(state, c, a, x, 2.5, { confirmed: of === 'caught' || admits });
        if (q === 'love' || q === 'future' || q === 'happy') breakHeart(state, c, a, 1.5 * romance(c, a) / 10);
        reds++;
        if (of === 'caught' || admits) {
          // They now know the answer — the belief moves to the truth.
          revealTruth(state, c, a); realReds++;
          pops[a].approval = admits ? -0.2 : -1;
          if (secret) caughtSecret = secret;
        } else pops[a].approval = 0.3;         // a red light on a true answer: the public saw it was true
        if (admits) addRelationshipDimension(c, a, 'trust', 0.3);   // honest, at least
      } else if (read === 'green' && Q.loaded && Q.want === answer) {
        // The good light, on the question they were scared of.
        feel(state, c, 'security', 0.7); addRelationshipDimension(c, a, 'trust', 0.4); addBond(c, a, 0.4);
        pops[a].approval = of === 'got-away' ? 0 : 0.4;
        if (of === 'got-away') feel(state, a, 'guilt', 0.6);
      } else if (!Q.loaded && read === 'red') {
        // In it for the fame? The villa laughs; the public do not, much.
        pops[a].approval = of === 'caught' ? -0.5 : 0;
        addRelationshipDimension(c, a, 'trust', -0.2);
      }
      if (read === 'blue') feel(state, c, 'stress', 0.4);
      const react = read === 'blue' ? 'confused' : !Q.loaded ? 'laugh' : admits ? 'stung' : read === 'red' ? 'hurt' : 'relief';
      const answerPart = admits ? `${answer}-admit` : lie && rng() < 0.5 ? `${answer}-slow` : answer;
      out.push(scene(state, rng, 'lie-question', Q.named && x ? [a, b, c, x] : [a, b, c], {
        q, read, of, parts: [['lie-ask', q], ['lie-answer', answerPart], ['lie-read', read], ['lie-react', react]], pop: pops,
      }, hurts ? [a, c] : []));
    }

    // After a red light on something that mattered: the row by the daybeds —
    // more likely the more reds, and always when a secret is on the line.
    if (!reds || (!caughtSecret && rng() >= 0.35 + 0.25 * (reds - 1) + 0.2 * attachment(state.profiles[c]).anxiety)) continue;
    let rowOf;
    if (caughtSecret && rng() < 0.3 + 0.5 * (emo(state, a).guilt / 10) + 0.2 * (S(state, a).loyalty ?? 5) / 10) rowOf = 'own-it';
    else if (realReds) rowOf = 'deny';
    else rowOf = 'broken';
    if (rowOf === 'own-it') {
      caughtSecret.known = true;
      if (caughtSecret.with) jealousyHit(state, c, a, caughtSecret.with, 4, { confirmed: true });
      breakHeart(state, c, a, 3 * romance(c, a) / 10);
      addRelationshipDimension(c, a, 'resentment', 1.2);
      feel(state, a, 'guilt', -1);
    } else if (rowOf === 'deny') {
      addBond(c, a, -0.8); addRelationshipDimension(c, a, 'resentment', 0.6);
    } else {
      // "That machine's broken" — and it was. Believing them is up to c.
      const believes = rng() < 0.3 + 0.5 * romance(c, a) / 10;
      if (believes) { addRelationshipDimension(c, a, 'trust', 0.5); feel(state, c, 'security', 0.5); }
      else addBond(c, a, -0.5);
    }
    out.push(scene(state, rng, 'lie-row', [a, c], { of: rowOf,
      pop: { [a]: { approval: rowOf === 'own-it' ? -0.8 : rowOf === 'deny' ? -0.3 : 0.3, fame: 2 }, [c]: { approval: 0.6, fame: 1.5 } } }, [a, c]));
  }
  return out;
}

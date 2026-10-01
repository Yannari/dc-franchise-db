// ══════════════════════════════════════════════════════════════════════
// vp-ci/teasers.js — Previously, Coming up, Next time
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-09-30): "we need a coming up next episode or some kind of things
// to really feel like a complete episode of a reality show, like watching
// Netflix". The edit around the day:
//   PREVIOUSLY ON THE CIRCLE  the last episode in three clips, ending on what
//                             it ended on (who was blocked): it aired, so the
//                             recap may say it;
//   COMING UP                 before the night (the ratings, a blocking, the
//                             Hangout, a visit, the finale): the night's lines
//                             cut off before they land, and what kind of night
//                             it is — never who, never how it ends;
//   NEXT TIME ON THE CIRCLE   the next episode's lines, cut off the same way.
//
// PURE: screens in, screens out. A clip carries its own face, name and ring,
// because "previously" and "next time" are about rows the stage is not on.
import { faceOf } from './steps.js';
import { ringOf, nameOf, realOf, isCatfish } from './parts.js';

// The night begins at the first of these.
const NIGHT = new Set(['ratings', 'final-ratings', 'blocking', 'hangout', 'visit', 'meet', 'reveal']);
// When the night aired at the top of the episode (a blocking the morning after
// the ratings), the break goes before the day's next big moment instead.
const BIG = new Set(['game', 'party', 'alert', 'power-reveal', 'disrupter', 'hack', 'swap', 'recognise', 'burner-exposed']);
// Lines that tell how something ENDS: a teaser never shows them.
const OUTCOME = /^(result\.|rate\.|block\.|vote\.|goodbye\.|reveal\.|meet\.|visit\.|final\.|winner|influencer|crown)/;
// How much a scene is worth teasing.
const HOT = { blocking: 3, alert: 3, 'power-reveal': 3, disrupter: 3, hack: 3, 'burner-exposed': 3, recognise: 3, swap: 3,
  visit: 3, meet: 3, plead: 3, game: 2, party: 2, 'after-party': 2, date: 2, chat: 1, 'circle-chat': 1, report: 2, lurk: 2, hangout: 2 };
const SPICY = /(argue|fight|shade|lie|plant|suspect|catfish|flirt|accuse|confront|jealous|betray|expose|doubt|cold|slip)/;

/** A line cut off before it lands: the teaser's whole trick. */
export function cutLine(text) {
  const t = String(text || '').trim();
  const w = t.split(/\s+/).filter(Boolean);
  if (w.length <= 5) return w.join(' ');
  const first = t.match(/^[^.!?…]+[.!?…]+/)?.[0];
  if (first && first.length < t.length - 2 && first.split(/\s+/).length >= 3) return first.replace(/[.!?…]+$/, '') + '…';
  return w.slice(0, Math.ceil(w.length * 0.6)).join(' ').replace(/[.,!?;:…'"”]+$/, '') + '…';
}

function clipOf(row, screen, st, cut) {
  const h = st.who;
  return { part: 'teaser', who: null, text: cut ? cutLine(st.text) : st.text, key: 'teaser.clip',
    clip: { cam: faceOf(row, h, 'cam'), real: realOf(row, h), as: isCatfish(row, h) ? nameOf(row, h) : null,
      ring: ringOf(row, h), where: screen.title, day: row.day, aloud: st.part === 'say' || st.part === 'react' } };
}

/** The best few lines of these screens to tease, in the order they air. */
export function clipsFrom(row, screens, { max = 3, cut = true } = {}) {
  const cands = [];
  screens.forEach((sc, si) => {
    let best = null;
    sc.steps.forEach((st, k) => {
      if (!st.who || st.host || OUTCOME.test(st.key || '')) return;
      if (!['say', 'react', 'send', 'post', 'video'].includes(st.part)) return;
      const len = String(st.text || '').length;
      if (len < 18 || len > 170) return;
      // A cut that leaves two words ("Oh my God…") teases nothing.
      if (cut && cutLine(st.text).split(/\s+/).length < 4) return;
      const score = (HOT[sc.kind] || 0) + (SPICY.test(st.key || '') ? 2 : 0) + (st.part === 'say' || st.part === 'react' ? 1 : 0) + (st.text.includes('?') ? 0.5 : 0);
      if (!best || score > best.score) best = { sc, st, score, at: si * 1000 + k };
    });
    if (best && best.score >= 1.5) cands.push(best);
  });
  // The best, one per speaker where the episode allows it.
  const ranked = cands.sort((a, b) => b.score - a.score || a.at - b.at);
  const picked = [], who = new Set();
  for (const c of ranked) if (picked.length < max && !who.has(c.st.who)) { picked.push(c); who.add(c.st.who); }
  for (const c of ranked) if (picked.length < max && !picked.includes(c)) picked.push(c);
  return picked.sort((a, b) => a.at - b.at).map(c => clipOf(row, c.sc, c.st, cut));
}

// What kind of night is coming: the thing, never the who.
function hookFor(screens, from) {
  const kinds = new Set(screens.slice(from).map(s => s.kind));
  if (kinds.has('reveal') || kinds.has('meet')) return 'Still to come: the finale. Everyone meets, and the truth comes out.';
  if (kinds.has('final-ratings')) return 'Still to come: the final ratings.';
  if (kinds.has('ratings') && kinds.has('blocking')) return 'Still to come: the ratings, and somebody gets blocked.';
  if (kinds.has('blocking')) return 'Still to come: somebody gets blocked.';
  if (kinds.has('ratings')) return 'Still to come: the ratings, and new Influencers.';
  if (kinds.has('hangout')) return 'Still to come: the Influencers meet in the Hangout.';
  if (kinds.has('alert') || kinds.has('power-reveal') || kinds.has('disrupter') || kinds.has('hack')) return 'Still to come: an alert nobody saw coming.';
  if (kinds.has('game')) return 'Still to come: a game, and the answers say more than anyone meant.';
  if (kinds.has('party')) return 'Still to come: a party in The Circle.';
  return null;
}
function nextHook(next) {
  const kinds = new Set((next || []).map(s => s.kind));
  if (kinds.has('reveal') || kinds.has('meet')) return 'Next time on The Circle: the finale.';
  if (kinds.has('final-ratings')) return 'Next time on The Circle: the last ratings before the finale.';
  if (kinds.has('blocking')) return 'Next time on The Circle: another player gets blocked.';
  if (kinds.has('game')) return 'Next time on The Circle: a game, and nobody is safe.';
  return 'Next time on The Circle…';
}

const teaser = (kind, row, title, opener, clips, tail = null) => ({
  id: `teaser-${kind}`, kind, stage: 'teaser', title, who: [], cast: [], teaser: kind,
  steps: [{ part: 'teaser', who: null, host: true, key: `teaser.${kind}`, text: opener, open: true },
    ...clips, ...(tail ? [tail] : [])],
});

/**
 * The episode as it airs: Previously first (not on day one), Coming up before
 * the night (when the day has run long enough to need a break), Next time at
 * the end (not after the finale). `prev` and `next` are the neighbouring
 * rows, or null.
 */
export function withTeasers(row, screens, { prev = null, next = null, screensOf } = {}) {
  if (!screens.length || typeof screensOf !== 'function') return screens;
  const out = [...screens];
  // Coming up: before the first night screen, from the night onwards.
  // Coming up: before the night when it has lines to tease; otherwise before
  // the day's next big moment; otherwise the break mid-episode, where one
  // kind of scene gives way to another, teasing the rest of the day.
  const teasable = i => clipsFrom(row, out.slice(i), { max: 3, cut: true }).length >= 2;
  const half = Math.floor(out.length * 0.45);
  let at = out.findIndex((s, i) => i >= 3 && NIGHT.has(s.kind) && teasable(i));
  if (at < 0) at = out.findIndex((s, i) => i >= 4 && BIG.has(s.kind) && teasable(i));
  if (at < 0) at = out.findIndex((s, i) => i >= Math.max(3, half) && s.kind !== out[i - 1]?.kind && teasable(i));
  if (at >= 3) {
    const clips = clipsFrom(row, out.slice(at), { max: 3, cut: true });
    out.splice(at, 0, teaser('comingup', row, 'Coming up', hookFor(out, at) || 'Still to come on The Circle…', clips));
  }
  // Next time: the next episode, cut off. Nothing after the finale.
  const isFinale = out.some(s => s.kind === 'reveal');
  if (next?.ci && !isFinale) {
    const ns = screensOf(next);
    const clips = clipsFrom(next, ns, { max: 3, cut: true });
    // Before the finale every line is an ending: the card alone says what's next.
    if (clips.length || ns.some(s => s.kind === 'reveal' || s.kind === 'meet')) out.push(teaser('nexttime', row, 'Next time', nextHook(ns), clips));
  }
  // Previously: the last episode, ending on how it ended.
  if (prev?.ci) {
    const ps = screensOf(prev);
    const clips = clipsFrom(prev, ps, { max: 3, cut: false });
    const block = ps.find(s => s.kind === 'blocking');
    // The message that blocked somebody, as it was sent, by who sent it.
    const named = block?.steps.find(x => /^block\.announce\./.test(x.key || '') && x.part === 'send' && x.who && x.text);
    // No blocking (the night carried over): end on the Influencers crowned.
    const rated = !named && ps.find(s => s.kind === 'ratings' || s.kind === 'final-ratings');
    const crowned = rated && rated.steps.find(x => /^result\.(influencers|sole|super|secret)$/.test(x.key || '') && x.text);
    const tail = named ? { ...clipOf(prev, block, named, false), key: 'teaser.ended' }
      : crowned?.who ? { ...clipOf(prev, rated, crowned, false), key: 'teaser.ended' }
        : crowned ? { part: 'teaser', who: null, host: true, key: 'teaser.ended', text: crowned.text } : null;
    if (clips.length) out.unshift(teaser('previously', row, 'Previously on The Circle', "Here's what happened last time…", clips, tail));
  }
  return out;
}

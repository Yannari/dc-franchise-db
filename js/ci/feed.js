// ══════════════════════════════════════════════════════════════════════
// ci/feed.js — the Newsfeed and Circle Chat, where everybody sees everything
// ══════════════════════════════════════════════════════════════════════
//
// Morning: "Please update your status." Statuses are posted and read aloud
// in other apartments; likes are counted and noticed. Circle Chat: the only
// room with everyone in it — and so the place a catfish theory goes public
// (US 1 Ep 1's Ice Breaker: three players decide out loud that Sammie might
// be a man). Parties are Plan 3; here a `party` flag only loosens tongues.
import { rel, bump, S, addScene } from './state.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { rollSlips, hasTheory } from './slips.js';

export const LIKES_EACH = 3;
export const PUBLIC_THEORY = 0.15;

// A narration label only (CLAUDE.md: thresholds pick words, never outcomes).
function toneOf(state, h) {
  if (mood(state, h, 'stress') > 6 || mood(state, h, 'loneliness') > 6) return 'low';
  if (mood(state, h, 'elation') > 6) return 'high';
  return 'steady';
}

export function morningFeed(state, rng) {
  const all = [...state.active];
  for (const h of all) addScene(state, 'status', [h], { tone: toneOf(state, h) }, all);
  const likes = {};
  for (const h of all) {
    likes[h] = all.filter(o => o !== h).map(o => [o, rel(h, o, 'affection') + rng()])
      .sort((a, b) => b[1] - a[1]).slice(0, LIKES_EACH).filter(([, v]) => v > 0).map(([o]) => o);
    for (const o of likes[h]) bump(o, h, 'affection', 0.3);
  }
  state.likesCount = Object.fromEntries(all.map(h => [h, Object.values(likes).filter(l => l.includes(h)).length]));
  for (const h of all) feel(state, h, 'elation', state.likesCount[h] * 0.3 - 0.5);
  return addScene(state, 'likes', all, { likes }, all);
}

export function runCircleChat(state, rng, { party = false, final = false } = {}) {
  const all = [...state.active];
  const sc = addScene(state, 'circle-chat', all, { party, final, posts: [], theories: [] }, all);
  for (const h of all) {
    const n = Math.round(S(state, h, 'social') / 5 * rng() + (party ? 1 : 0));
    for (let i = 0; i < n; i++) {
      sc.data.posts.push({ by: h });
      rollSlips(state, rng, h, all, { specific: 0.2, party, attention: 0.3 }, sc);
    }
    if (final) continue;
    for (const o of all) {
      if (o === h || !hasTheory(state, h, o)) continue;
      if (rng() >= S(state, h, 'boldness') / 10 * PUBLIC_THEORY) continue;
      const c = makeClaim(state, { kind: 'catfish', holder: h, about: o,
        truth: state.profiles[o].mode === 'catfish', secrecy: 'public', by: h });
      for (const x of all) if (x !== h) learn(state, x, c, h, sc);
      sc.data.theories.push({ by: h, about: o, claim: c.id });
      feel(state, o, 'stress', 2);
      bump(o, h, 'resentment', 2);
      break;
    }
  }
  for (const a of all) for (const b of all) if (a !== b && rel(a, b, 'affection') > 2) bump(a, b, 'affection', 0.2);
  for (const h of all) feel(state, h, 'loneliness', party ? -2 : -0.8);
  return sc;
}

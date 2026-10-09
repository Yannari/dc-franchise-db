// ══════════════════════════════════════════════════════════════════════
// td/story/runners.js — the season's running gags
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "we're lacking drama, comedy". A running gag is a bit that belongs to one
// person, from their own voice and life, that comes back and builds: set up (stage 1), called back
// (stage 2, again and again), and paid off once (stage 3). Up to two per season, chosen from the
// most comic voices (voice.js tags). gs.tdStory.runners = { name: { kind, stage, last } }.
//   food      hides snacks everywhere            nickname  gives everybody nicknames
//   secret    can't keep a secret to save a life  pet       adopts an animal (a crab, a gull)
//   fitness   runs a workout club nobody joined   drama     narrates their own life like a show
//   job       can't stop talking about their job ({job}, authored)
// run.<kind>.<stage>: a is the person, b somebody who has to put up with it, c (may be missing).
// Stage 2 carries call (1, 2, 3+): which callback this is, so the bit escalates in order.
// Words only.
import { gs, players } from '../../core.js';
import { voiceOf } from './voice.js';

const KIND_BY_TAG = [['food', 'food'], ['chaotic', 'pet'], ['theatrical', 'drama'], ['ditzy', 'secret'], ['goofy', 'nickname'], ['loud', 'fitness']];
const COMIC = new Set(['goofy', 'chaotic', 'food', 'ditzy', 'theatrical', 'loud', 'dry']);

/** The season's runners, chosen once from the cast. */
export function runnersOf(cast) {
  const book = ((gs.tdStory ||= {}).runners ||= null);
  if (book) return book;
  const scored = cast.map(name => {
    const tags = voiceOf(name) || [];
    return { name, tags, n: tags.filter(t => COMIC.has(t)).length + ((name.length * 7) % 3) * 0.1 };
  }).filter(x => x.n >= 1).sort((x, y) => y.n - x.n || x.name.localeCompare(y.name)).slice(0, 2);
  const out = {};
  const used = new Set();
  for (const s of scored) {
    const p = (players || []).find(x => x.name === s.name) || {};
    let kind = (KIND_BY_TAG.find(([t, k]) => s.tags.includes(t) && !used.has(k)) || [])[1];
    if (!kind && p.job && !used.has('job')) kind = 'job';
    if (!kind) kind = ['nickname', 'fitness', 'food'].find(k => !used.has(k));
    used.add(kind);
    out[s.name] = { kind, stage: 0, last: -9 };
  }
  gs.tdStory.runners = out;
  return out;
}

/** The runner beat due at this camp this episode, if any: { name, kind, stage } (and advances it). */
export function runnerDue(ep, members) {
  const book = runnersOf([...new Set([...(gs.activePlayers || []), ...members])]);
  for (const [name, r] of Object.entries(book)) {
    if (!members.includes(name) || r.stage >= 3) continue;
    if (ep.num - r.last < 2) continue;
    // set up early, called back while the season runs, paid off once it's late
    const late = (gs.activePlayers || []).length <= 7;
    const stage = r.stage === 0 ? 1 : late && r.stage >= 2 ? 3 : 2;
    // three callbacks, then it waits for its payoff: a fourth would be the same joke again
    if (stage === 2 && (r.calls || 0) >= 3) continue;
    // the callbacks build in order (call 1, 2, 3...), so each one is the next step of the bit, not the same joke again
    const call = stage === 2 ? Math.min(3, (r.calls || 0) + 1) : 0;
    return { name, kind: r.kind, stage, call, commit: () => { r.stage = Math.max(r.stage, stage); r.last = ep.num; if (stage === 2) r.calls = (r.calls || 0) + 1; } };
  }
  return null;
}

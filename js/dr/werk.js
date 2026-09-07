// ══════════════════════════════════════════════════════════════════════
// dr/werk.js — drawing the room's scenes
// ══════════════════════════════════════════════════════════════════════
//
// The pool is js/dr/data/werk-events.js; this decides which of it happens.
//
// Three things this file is careful about, each of them a bug the project has
// already shipped once in another show:
//
//  1. IT DRAWS FROM WHAT IS ELIGIBLE, and reports how much that was. A pool of
//     sixty that filters to three on a normal night reads worse than a pool of
//     twenty that all apply, and the only way to know which you have is to
//     count it — so `eligible` comes back on every draw.
//  2. IT DOES NOT REPEAT ITSELF within a season. An event that has already
//     happened is heavily discouraged rather than banned: banning it empties
//     the pool late in a long season, and a season that runs out of scenes
//     starts showing the same one anyway.
//  3. EVERY SCENE IT DRAWS HAS A CONSEQUENCE, applied through one function, so
//     "did this change anything" is answerable by reading one place.
//
// Arcs raise the weight rather than gating: a villain gets villain scenes more
// often, and a hero can still have a bad day. A gate would make every queen
// her own label and nothing else.
import { WERK_EVENTS } from './data/werk-events.js';
import { dragOf } from './queen.js';
import { canScheme } from './rules.js';

/** How much an arc match is worth. Multiplicative on the base weight. */
const ARC_BONUS = 2.5;
/** How much a scene already used this season is discouraged. Not banned. */
const REPEAT_PENALTY = 0.08;
/**
 * How hard the room pushes toward a queen nobody has seen tonight.
 *
 * MEASURED, and the reason this exists: drawing the subject at random gave 32%
 * of a fourteen-queen cast ZERO scenes in a given episode — four or five queens
 * silent every week — and fourteen queens across twenty seasons who never
 * appeared once all season. That is not an edit, it is a dice roll. A queen who
 * gets nothing should be the filler edit, chosen because nobody is watching
 * her, and star power decides that below rather than chance.
 */
const UNSEEN_BONUS = 6;

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

/**
 * What the pool's eligibility tests are allowed to know.
 *
 * Assembled once per candidate pairing. Everything here is a fact about the
 * room right now — nothing is a decision, so an event can never reach in and
 * change the week from inside its own `when`.
 */
function factsFor({ a, b, players, state, storylines, ctx }) {
  const arcsOf = n => storylines
    .filter(s => s.alive && s.players.includes(n))
    .map(s => s.arc);
  const rec = n => state.record?.[n] || [];
  const pa = players[a] || null;
  const pb = b ? players[b] || null : null;
  return {
    a: pa,
    b: pb,
    nameA: a,
    nameB: b || null,
    bond: b ? ctx.bond(a, b) : 0,
    canScheme: canScheme(pa),
    // NOT SUPPLIED, deliberately: the room is drawn before the challenge hands
    // out its teams, so no werk room event may gate on team membership. An
    // event that did was drawn zero times in thirty seasons.
    sameTeam: false,
    lastCall: rec(a)[rec(a).length - 1] || null,
    winsA: rec(a).filter(r => r === 'WIN').length,
    winsB: b ? rec(b).filter(r => r === 'WIN').length : 0,
    safesA: rec(a).filter(r => r === 'SAFE').length,
    phase: ctx.phase ?? 0,
    episode: ctx.episode ?? 1,
    roomSize: (state.living || []).length,
    someoneLeft: !!ctx.someoneLeft,
    lostAFriend: !!(ctx.gone || []).some(g => ctx.bond(a, g) >= 4),
    lostAnEnemy: !!(ctx.gone || []).some(g => ctx.bond(a, g) <= -4),
    arcsA: arcsOf(a),
    arcsB: b ? arcsOf(b) : [],
  };
}

/** Fill {a} and {b}. A line with no variants written yet renders as null. */
function render(event, facts, rng) {
  if (!event.lines || !event.lines.length) return null;
  const line = event.lines[Math.floor(rng() * event.lines.length)];
  return line.replace(/\{a\}/g, facts.nameA).replace(/\{b\}/g, facts.nameB || '');
}

/**
 * One werk room scene.
 *
 * Returns `null` when the slot has nothing eligible, which is a real outcome
 * rather than an error: a quiet morning is allowed. The caller decides whether
 * to try again for a second scene.
 */
/**
 * Who this scene is about.
 *
 * Weighted toward whoever has not been on screen tonight, then by how much the
 * camera wants her. The unseen bonus is much the larger term, so the room
 * covers itself before it plays favourites — but a low-star queen benefits from
 * it less, which is how a filler edit happens on purpose rather than by
 * accident.
 */
function pickSubject(pool, seen, state, rng) {
  const weights = pool.map(n => {
    const times = seen[n] || 0;
    const unseen = times === 0 ? UNSEEN_BONUS : 1 / (1 + times);
    const star = 0.6 + ((state.star?.[n] ?? 5) / 10) * 0.8;
    return { n, w: unseen * star };
  });
  const total = weights.reduce((t, x) => t + x.w, 0);
  let roll = rng() * total;
  return (weights.find(x => (roll -= x.w) <= 0) || weights[0]).n;
}

export function drawWerkScene({
  slot, living, players, state, storylines, rng, ctx, used = new Set(), seen = {},
}) {
  if (!living || living.length < 1) return null;

  const candidates = [];
  for (const ev of WERK_EVENTS) {
    if (ev.slot !== slot) continue;

    // A pair event needs somebody to be with. Rather than testing every pair
    // in the room, which would make one well-connected queen dominate, each
    // event gets one shot at a subject and a partner — both drawn toward
    // whoever has not been seen yet tonight.
    const a = pickSubject(living, seen, state, rng);
    const others = living.filter(n => n !== a);
    const b = ev.cast === 'pair'
      ? (others.length ? pickSubject(others, seen, state, rng) : null)
      : null;
    if (ev.cast === 'pair' && !b) continue;

    const facts = factsFor({ a, b, players, state, storylines, ctx });
    let ok = false;
    try { ok = !!ev.when(facts); } catch { ok = false; }
    if (!ok) continue;

    // The arc bonus, from either queen in the pair: a scene typical of the
    // villain fires more often when a villain is actually in it.
    const inPlay = new Set([...facts.arcsA, ...facts.arcsB]);
    const matches = (ev.arcs || []).some(x => inPlay.has(x));
    const weight = (ev.weight || 1)
      * (matches ? ARC_BONUS : 1)
      * (used.has(ev.id) ? REPEAT_PENALTY : 1);

    candidates.push({ ev, facts, weight });
  }

  if (!candidates.length) return null;

  const total = candidates.reduce((t, c) => t + c.weight, 0);
  let roll = rng() * total;
  const picked = candidates.find(c => (roll -= c.weight) <= 0) || candidates[0];

  return {
    id: picked.ev.id,
    slot,
    players: picked.facts.nameB ? [picked.facts.nameA, picked.facts.nameB] : [picked.facts.nameA],
    text: render(picked.ev, picked.facts, rng),
    note: picked.ev.note,
    effects: picked.ev.effects,
    // How much choice there actually was. This is the number that decides
    // whether a season repeats itself, and it is worth carrying rather than
    // recomputing later.
    eligible: candidates.length,
  };
}

/**
 * Write what a scene did.
 *
 * The one place werk room consequences land, on the same principle as
 * `applyEvents` in the maxi engine: a scene that changes nothing throws here
 * rather than being quietly dropped.
 */
export function applyWerkScene(scene, ctx) {
  if (!scene) return null;
  const e = scene.effects || {};
  const changes = (e.bond ? 1 : 0) + Object.keys(e.pop || {}).length + (e.state ? 1 : 0);
  if (!changes) {
    throw new Error(
      `drag-race: werk room scene "${scene.id}" has no consequence — every scene `
      + 'must move a bond, a popularity number or a state flag');
  }
  const [a, b] = scene.players;
  if (e.bond && b) ctx.addBond(a, b, e.bond);
  for (const [who, delta] of Object.entries(e.pop || {})) {
    const name = who === 'a' ? a : b;
    if (name) ctx.popDelta(name, delta);
  }
  return { applied: changes, state: e.state || null };
}

/**
 * Every werk room scene for one week, in slot order.
 *
 * THE SCENE COUNT FOLLOWS THE ROOM. A fixed two per slot gave eight scenes to
 * cover fourteen queens, and a third of the cast was silent every episode.
 *
 * Checked against a real episode rather than guessed: Wikipedia's summary of
 * "Draggle Rock" lists five distinct werk room blocks — the return after an
 * elimination, the mini challenge, picking teams and building characters, the
 * host's walkthrough, and elimination-day preparation — and each block holds
 * several separate conversations. So the honest target is roughly one scene
 * per queen, which for a full cast is a dozen or more beats spread across the
 * four slots, not eight.
 */
export function runWerkRoom({ slots, living, players, state, storylines, rng, ctx, perSlot = null }) {
  const scenes = [];
  const seen = {};
  const used = state._drWerkUsed instanceof Set
    ? state._drWerkUsed
    : (state._drWerkUsed = new Set(state._drWerkUsedList || []));

  // Enough for everybody to get a moment, spread across the slots, with a
  // floor so a top four still has a room worth watching.
  const perSlotN = perSlot ?? Math.max(2, Math.ceil((living.length + 2) / slots.length));

  for (const slot of slots) {
    for (let i = 0; i < perSlotN; i++) {
      // Once every queen has had a scene, stop padding this slot.
      if (i >= 2 && living.every(n => seen[n])) break;

      const scene = drawWerkScene({
        slot, living, players, state, storylines, rng, ctx, used, seen,
      });
      if (!scene) break;
      // A slot never runs the same scene twice in one night, whatever the
      // weighting says.
      if (scenes.some(s => s.id === scene.id)) continue;
      scenes.push(scene);
      used.add(scene.id);
      for (const n of scene.players) seen[n] = (seen[n] || 0) + 1;
    }
  }

  // A Set does not survive JSON, and this goes into the save. The list is the
  // stored form and the Set is rebuilt from it — the same repair the rest of
  // the project does with `prepGsForSave`.
  state._drWerkUsedList = [...used];
  return scenes;
}

/** Facts about how well the pool is holding up, for the audit. */
export function werkCoverage(scenes) {
  const ids = scenes.map(s => s.id);
  const eligible = scenes.map(s => s.eligible);
  return {
    drawn: ids.length,
    distinct: new Set(ids).size,
    written: scenes.filter(s => s.text).length,
    minEligible: eligible.length ? Math.min(...eligible) : 0,
    meanEligible: eligible.length
      ? Math.round((eligible.reduce((a, b) => a + b, 0) / eligible.length) * 10) / 10 : 0,
  };
}

export { dragOf, stat };

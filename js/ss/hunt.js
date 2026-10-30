// ══════════════════════════════════════════════════════════════════════
// ss/hunt.js — the secret hunt: theories, clues, tells, talk, the buzz
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §4–§5 (docs/superpowers/specs/2026-10-27-secret-story-game-design.md).
//
// WHAT A HOUSEMATE KNOWS is a THEORY per target: the secret they think that
// person hides, how sure they are, and the evidence behind it. A theory can be
// WRONG — the real show's wrong buzzes were near misses ("born in the jungle"
// for "raised among wild animals"), so a wrong theory is drawn from the same
// KIND as the real secret. Evidence (a clue on the table, a tell noticed, an
// ally's theory, a confrontation) makes a theory surer and, for a sharp
// reader, more likely to swing to the truth. Planted fake clues pull the other
// way.
//
// RULING (build, 2026-10-27): the design said "on js/knowledge.js". The hunt
// keeps its own theory table instead, because every number here has to be
// calibrated against the real seasons (§22) and the general model's
// acceptance rolls are tuned for other shows. Nothing else reads the
// knowledge store for secrets today; a mirror can be added when a reader needs it.
//
// Pure: everything takes the state and a context `{ stat, bond, rng, week }`;
// the engine adapter (js/bb/secret-story.js) supplies them.

import { SECRET_POOL } from './secret-pool.js';
import { BUZZ_STAKE, balance, transfer, takeAll } from './kitty.js';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const readSkill = (ctx, n) => (st(ctx, n, 'mental') * 0.6 + st(ctx, n, 'intuition') * 0.4) / 10;
const guard = (ctx, n) => Math.min(1, ((st(ctx, n, 'strategic') * 0.5 + st(ctx, n, 'temperament') * 0.5) / 10) + (Number(playOf(ctx, n).guard) || 0));
/** How a housemate plays the hunt (the adapter's ctx.play, from their game style): watch, bar, press, guard, bluff. */
const playOf = (ctx, n) => ctx?.play?.(n) || {};
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** The secret a housemate holds (shared secrets have several holders). */
export const secretOf = (state, n) => (state?.secrets || []).find(s => (s.holders || []).includes(n)) || null;
const partnersOf = (state, n) => (secretOf(state, n)?.holders || []).filter(h => h !== n);

/** The hunt's tables on the state, created on first touch. */
export function huntOf(state) {
  state.theories ||= {};
  state.shownClues ||= [];
  state.buzzes ||= [];
  state.freeBuzz ||= {};
  state.buzzBan ||= {};
  return state;
}

/** Near-miss texts for a secret: same kind from the pool, never the truth. */
export function nearMisses(secret) {
  const kind = secret.secretKind || secret.kind;
  const same = SECRET_POOL.filter(e => e.kind === kind && e.text !== secret.text).map(e => e.text);
  return same.length ? same : SECRET_POOL.filter(e => e.text !== secret.text).map(e => e.text);
}

/** A knower's theory about a target, or null. */
export const theoryOf = (state, knower, target) => state?.theories?.[knower]?.[target] || null;

/**
 * Fold one piece of evidence about `target`'s secret into `knower`'s theory.
 *   strength 0..1   how loud the evidence is (a sound clue louder than a tell)
 *   toward          a specific text the evidence points at (an ally's theory,
 *                   a fake clue); omitted = it points at the TRUTH
 */
export function addEvidence(state, ctx, knower, target, { strength = 0.2, how = 'clue', toward = null } = {}) {
  huntOf(state);
  const secret = secretOf(state, target);
  if (!secret || secret.found || knower === target || (secret.holders || []).includes(knower)) return null;
  const rng = ctx.rng || Math.random;
  const r = readSkill(ctx, knower);
  const diff = Number(secret.difficulty) || 0.55;
  const t = (state.theories[knower] ||= {});
  let th = t[target];
  const pointsAtTruth = toward == null || toward === secret.text;
  // Watching somebody (a tell, a friend's hunch) makes a guess feel surer, but only a CLUE, or a friend who already has
  // the truth, points a theory AT the truth (the user, 2026-10-29: "how do we get 2 secrets found with no clue revealed
  // in the first week", "not every buzz is a correct buzz"): a theory built on behaviour alone is a near miss.
  // ...and so does a MISTAKE somebody saw: a slip, a pair caught together, a role's trace (the user, 2026-10-29: "mistake
  // can happen someone blurting something it shouldnt giving clue especially from production or shared secret")
  const canFind = strength >= 0.28 || toward === secret.text || /slip|caught|jealousy|defended|old-joke|^role:/.test(String(how));
  if (!th) {
    // A first theory: the truth if the evidence is clear and the reader sharp,
    // otherwise a near miss of the same kind.
    const right = pointsAtTruth && canFind && rng() < clamp(0.12 + strength * r * 1.3 - diff * 0.25, 0.03, 0.9);
    const text = right ? secret.text : (pointsAtTruth ? pick(nearMisses(secret), rng) : toward);
    th = t[target] = { text, right: text === secret.text, conf: 0, ev: [] };
  } else if (!th.right && pointsAtTruth && canFind && rng() < clamp(strength * r * 0.9 - diff * 0.15, 0, 0.8)) {
    // The penny drops: the theory swings to the truth, keeping most of its weight.
    th.text = secret.text; th.right = true; th.conf *= 0.75;
  } else if (!pointsAtTruth && toward !== th.text && rng() < strength * (1 - r) * 0.8) {
    // A fake clue or a wrong ally talks a soft reader into their version.
    th.text = toward; th.right = toward === secret.text; th.conf *= 0.6;
  }
  // Ambiguous evidence still makes a WRONG theory feel surer — which is how
  // wrong buzzes happen — but less than it would a right one.
  const fits = th.right === pointsAtTruth || th.text === toward;
  // Calibrated on six seeded seasons (2026-10-27): right finds and wrong buzzes
  // come out in the real show's proportions only when a wrong theory grows at
  // three quarters the rate of a right one.
  const gain = strength * (0.5 + 0.7 * r) * (1 - diff * 0.4) * (fits ? 1 : 0.75);
  th.conf = clamp(th.conf + gain, 0, 0.98);
  th.ev.push({ week: ctx.week ?? 0, how, s: Math.round(strength * 100) / 100 });
  if (th.ev.length > 8) th.ev.shift();
  return th;
}

/**
 * A clue goes on the table (§4 channels). `to` = who sees it ('house' = every
 * housemate in `house`). A FAKE clue points at `fakeText` instead of the truth.
 * Returns the act for the viewer.
 */
export function showClue(state, ctx, { holder = undefined, clue = null, how = 'game', to = 'house', house = [], fake = false, fakeText = null, by = null } = {}) {
  huntOf(state);
  const secret = secretOf(state, holder);
  if (!secret || secret.found) return null;
  const rng = ctx.rng || Math.random;
  const used = new Set(state.shownClues.filter(c => c.secretId === secret.id).map(c => c.clue));
  const fresh = (secret.clues || []).filter(c => !used.has(c));
  const shown = clue || (fresh.length ? pick(fresh, rng) : null);
  if (!shown && !fake) return null;
  const viewers = to === 'house' ? house.filter(n => !(secret.holders || []).includes(n)) : [].concat(to);
  const ftxt = fake ? (fakeText || pick(nearMisses(secret), rng)) : null;
  // (calibrated by the ss-spec audit, 2026-10-27: 0.24 found 30% of the secrets; the real show finds half or more)
  // (2026-10-29: 0.34 once a tell could no longer find a secret on its own, so half are still found by a buzz)
  const strength = /cassette|song|sound|video/i.test(shown || '') ? 0.42 : 0.34;
  for (const v of viewers) addEvidence(state, ctx, v, holder, { strength, how: fake ? 'fake-clue' : `clue:${how}`, toward: ftxt });
  const rec = { week: ctx.week ?? 0, secretId: secret.id, holders: [...secret.holders], clue: shown || 'a clue', how, fake, to: to === 'house' ? 'house' : viewers, by };
  state.shownClues.push(rec);
  return { type: 'ss-clue', ...rec, beats: [{ text: `${to === 'house' ? 'The house' : viewers.join(' and ')} ${to === 'house' ? 'sees' : 'see'} a clue about ${secret.holders.join(' and ')}'s secret: ${shown || 'a clue'}.`,
    players: [...secret.holders, ...(by ? [by] : [])].slice(0, 4), badgeText: fake ? 'A CLUE?' : 'CLUE', badgeClass: 'gold', part: 'clue' }] };
}

/**
 * A day in the house: people watch each other and notice TELLS (the secret's
 * behaviours, part 1's pool); allies compare theories. Returns the private
 * moments worth a scene, best first.
 */
export function huntDay(state, ctx, { house = [], watchesPer = 2 } = {}) {
  huntOf(state);
  const rng = ctx.rng || Math.random;
  const moments = [];
  for (const n of house) {
    const others = house.filter(x => x !== n && !partnersOf(state, n).includes(x) && !secretOf(state, x)?.found);
    // a hunter watches more people; a housemate lying low watches fewer (ctx.play: their game style)
    const watches = Math.max(1, watchesPer + (Number(playOf(ctx, n).watch) || 0));
    for (let k = 0; k < watches && others.length; k++) {
      const t = others.splice(Math.floor(rng() * others.length), 1)[0];
      const s = secretOf(state, t);
      if (!s) continue;
      // A tell: noticed by the perceptive, hidden by the guarded. Pairs give
      // themselves away by being together.
      const p = clamp(st(ctx, n, 'intuition') / 10 * 0.3 * (1 - guard(ctx, t) * 0.6) + ((s.holders || []).length > 1 ? 0.06 : 0));
      if (rng() < p) {
        const tell = (s.tells || [])[Math.floor(rng() * Math.max(1, (s.tells || []).length))] || 'acts strangely when a certain subject comes up';
        const th = addEvidence(state, ctx, n, t, { strength: 0.2, how: 'tell' });
        if (th) moments.push({ kind: 'tell', who: n, about: t, tell, theory: th.text, right: th.right, conf: th.conf });
      }
    }
  }
  // Talk: friends compare notes. A theory passes along, right or wrong.
  for (const a of house) {
    for (const [target, th] of Object.entries(state.theories[a] || {})) {
      if (th.conf < 0.3 || !house.includes(target)) continue;
      const friends = house.filter(b => b !== a && b !== target && (ctx.bond?.(a, b) ?? 0) >= 3 && !(secretOf(state, target)?.holders || []).includes(b));
      if (!friends.length || rng() > 0.25) continue;
      const b = pick(friends, rng);
      const got = addEvidence(state, ctx, b, target, { strength: 0.1 + th.conf * 0.15, how: `told:${a}`, toward: th.text });
      if (got) moments.push({ kind: 'talk', who: a, to: b, about: target, theory: th.text, right: th.right, conf: got.conf });
    }
  }
  return moments.sort((x, y) => y.conf - x.conf);
}

/** How sure a housemate must be before they press the buzzer. */
export function buzzBar(state, ctx, n, { weeksLeft = 6 } = {}) {
  const bold = st(ctx, n, 'boldness');
  const rich = balance(state, n) > 30000 ? 0.06 : 0;
  const late = weeksLeft <= 2 ? -0.14 : weeksLeft <= 4 ? -0.06 : 0;
  return clamp(0.74 - bold * 0.03 + rich + late, 0.4, 0.9);
}

/**
 * The week's buzzes (§5): press → confrontation → withdraw or confirm →
 * reveal. At most `maxPerWeek` presses. Returns one act per press.
 */
export function runBuzzes(state, ctx, { house = [], weeksLeft = 6, maxPerWeek = 3 } = {}) {
  huntOf(state);
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const candidates = [];
  for (const n of house) {
    if (state.buzzBan[n] === week) continue;
    const free = (state.freeBuzz[n] || 0) > 0;
    if (!free && balance(state, n) < BUZZ_STAKE) continue;
    const best = Object.entries(state.theories[n] || {})
      .filter(([t]) => house.includes(t) && !secretOf(state, t)?.found && !partnersOf(state, n).includes(t))
      .sort((x, y) => y[1].conf - x[1].conf)[0];
    if (!best) continue;
    const [target, th] = best;
    // ...and how it will look on air (the adapter's ctx.buzzCost: a friend, the country's favourite)
    const p = playOf(ctx, n);
    const bar = buzzBar(state, ctx, n, { weeksLeft }) - (free ? 0.12 : 0) + (Number(ctx.buzzCost?.(n, target)) || 0) + (Number(p.bar) || 0);
    if (th.conf >= bar && rng() < 0.55 + st(ctx, n, 'boldness') * 0.03 + (Number(p.press) || 0)) candidates.push({ n, target, th, free });
  }
  candidates.sort((a, b) => b.th.conf - a.th.conf);
  const acts = [];
  const taken = new Set();
  for (const c of candidates) {
    if (acts.length >= maxPerWeek) break;
    if (taken.has(c.target) || secretOf(state, c.target)?.found) continue;
    taken.add(c.target);
    acts.push(resolveBuzz(state, ctx, c.n, c.target, { free: c.free, bar: buzzBar(state, ctx, c.n, { weeksLeft }) }));
  }
  return acts;
}

/** One buzz, start to finish. Exported so a twist can force one (a free buzz on the prime). */
export function resolveBuzz(state, ctx, by, target, { free = false, bar = 0.7 } = {}) {
  huntOf(state);
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const secret = secretOf(state, target);
  const th = theoryOf(state, by, target) || { text: '…', right: false, conf: 0.5, ev: [] };
  const confBefore = th.conf;
  // ── the confrontation: the target defends without revealing anything ──
  // a calculating player bluffs better in the confessional (ctx.play)
  const defence = (st(ctx, target, 'strategic') * 0.4 + st(ctx, target, 'temperament') * 0.3 + st(ctx, target, 'social') * 0.3) / 10 + (Number(playOf(ctx, target).bluff) || 0);
  const read = readSkill(ctx, by);
  let shift;
  let leak = false;
  if (th.right) {
    shift = (read - defence) * 0.3 + (rng() - 0.5) * 0.12;
    // A nervous holder gives something away in the room.
    if (rng() < clamp(0.25 - defence * 0.2)) { leak = true; shift += 0.12; }
  } else {
    // Real bewilderment reads as innocence to a sharp listener.
    shift = -(0.08 + read * 0.22) + (rng() - 0.5) * 0.1 + (1 - defence) * 0.08;
  }
  th.conf = clamp(confBefore + shift, 0, 0.98);
  // (to confirm, the buzzer must still be as sure as when they pressed: many presses end in the room, withdrawn)
  const confirmed = th.conf >= bar || (free && th.conf >= bar * 0.8);
  const rec = { week, by, target, guess: th.text, right: !!th.right, free, confBefore: Math.round(confBefore * 100) / 100,
    confAfter: Math.round(th.conf * 100) / 100, leak, outcome: confirmed ? (th.right ? 'right' : 'wrong') : 'withdrawn', took: 0, lost: 0,
    // the hunter was RIGHT and the holder talked their way out of it: a secret kept under pressure
    held: !!th.right && !confirmed };
  if (free) state.freeBuzz[by] = Math.max(0, (state.freeBuzz[by] || 0) - 1);
  if (confirmed && th.right && secret) {
    rec.took = takeAll(state, target, by, `found ${target}'s secret`, week);
    secret.found = true; secret.foundBy = by; secret.week = week;
    // Everybody now knows; every theory about this secret is settled.
    for (const t of Object.values(state.theories)) for (const h of secret.holders) delete t[h];
  } else if (confirmed) {
    rec.lost = free ? 0 : transfer(state, by, target, BUZZ_STAKE, `wrong buzz on ${target}`, week);
    // The house heard the guess: anybody hunting this target crosses it off.
    for (const [k, t] of Object.entries(state.theories)) {
      if (k !== by && t[target]?.text === th.text) { t[target].conf *= 0.5; }
    }
    th.conf *= 0.3;
  }
  state.buzzes.push(rec);
  const beats = rec.outcome === 'right'
    ? [{ text: `${by} buzzes ${target} — "${rec.guess}" — and is right. ${target}'s kitty is ${by}'s.`, players: [by, target], badgeText: 'SECRET FOUND', badgeClass: 'gold', part: 'found' }]
    : rec.outcome === 'wrong'
      ? [{ text: `${by} buzzes ${target} — "${rec.guess}" — and is wrong.`, players: [by, target], badgeText: 'WRONG BUZZ', badgeClass: 'red', part: 'wrong' }]
      : [{ text: `${by} buzzes ${target}, hears ${target} out, and withdraws.`, players: [by, target], badgeText: 'WITHDRAWN', badgeClass: 'grey', part: 'withdrawn' }];
  // (the clues about this secret the buzzer saw: their evidence in the confrontation, vp-bb-ep/steps.js)
  const seenClues = secret ? (state.shownClues || []).filter(c => c.secretId === secret.id && !c.fake && (c.to === 'house' || (Array.isArray(c.to) && c.to.includes(by))) && c.week <= week).map(c => c.clue).slice(-3) : [];
  return { type: 'ss-buzz', ...rec, clues: seenClues, secretText: secret?.text || null, secretKind: secret?.secretKind || secret?.kind || null, poolId: secret?.poolId || null, holders: [...(secret?.holders || [])],
    kitty: { [by]: balance(state, by), [target]: balance(state, target) }, beats };
}

/** The secrets still hidden, and who kept them. */
export const hiddenSecrets = state => (state?.secrets || []).filter(s => !s.found);

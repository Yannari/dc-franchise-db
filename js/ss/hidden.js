// ══════════════════════════════════════════════════════════════════════
// ss/hidden.js — the fake elimination and the secret room
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §14. The real show's signature twist (seasons 1, 2, 3, 5, 6, 7,
// 8, 9, 11, 13): the public's verdict looks like an elimination, the house
// says goodbye, and the "eliminated" walks into the SECRET ROOM instead of the
// studio. From up there they watch the house on the screens: who cried, who
// celebrated, what everybody really thinks, what everybody is hiding. Days
// later they come back down, to the house's shock, usually with a power (they
// nominated live on the prime in seasons 5 and 6).
//
// One mechanic for every hidden person (the design's warning: Big Brother's
// Twin Twist bug class, a player in the game but not in the house): a hidden
// housemate is OFF the house list (no nominations, no hunt, no house life) and
// OFF the eliminated list, recorded here, and put back by `bringBack`.
//
// Pure: state + ctx `{ stat, bond, rng, week }`.

import { addEvidence, secretOf } from './hunt.js';
import { mint } from './kitty.js';

// ── TWIST FAMILY 1, F1.2 (docs/superpowers/specs/2026-10-28-secret-story-hidden-spaces-design.md) ──
// Every way the show faked an elimination, how long they stayed up there, and what they did:
//   kind:  'verdict' (the public's lowest share), 'double' (two leave together, S1/S2/S7), 'voluntary' (a
//          housemate takes the money and walks out mid-prime, S6/S7), 'power' (a housemate is handed the power to
//          eliminate, S5/S9/S12);
//   weeks: one or two;
//   role:  'watch' (the screens), 'master' (adds a nominee every week from up there, S5/S6/S7/S12), 'remote'
//          (an accomplice in the house is told, keeps the act going and runs their orders, S8/S12).
export const FAKE_KINDS = ['verdict', 'double', 'voluntary', 'power'];
export const HIDDEN_ROLES = ['watch', 'master', 'remote'];
const weighted = (pairs, rng) => { let r = rng() * pairs.reduce((t, [, w]) => t + w, 0); for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; } return pairs.at(-1)[0]; };

/**
 * The season's fake eliminations: none, once or twice (the draw's `secretRoom` level), each with its kind,
 * its length and its role. Kept on `state.plan.fakes`; `secretRoomWeek` stays the first one's week.
 */
export function planFakes(state, { castSize = 14, level = 'once', rng = Math.random, first = null } = {}) {
  state.plan ||= {};
  const n = level === 'twice' ? 2 : level === 'off' ? 0 : 1;
  const last = Math.max(3, castSize - 7);
  const fakes = [];
  let wk = first || (3 + Math.floor(rng() * Math.max(1, last - 2)));
  for (let i = 0; i < n && wk <= last + 1; i++) {
    fakes.push({ week: wk, kind: weighted([['verdict', 0.4], ['double', 0.2], ['voluntary', 0.2], ['power', 0.2]], rng),
      weeks: rng() < 0.7 ? 1 : 2, role: weighted([['watch', 0.4], ['master', 0.3], ['remote', 0.3]], rng) });
    wk += 3 + Math.floor(rng() * 2);
  }
  state.plan.fakes = fakes;
  state.plan.secretRoomWeek = fakes[0]?.week ?? null;
  return fakes;
}
/** This week's planned fake elimination, if it can happen (nobody up there already, a house big enough). */
export function fakePlanFor(state, week, houseSize) {
  if (!state?.plan || hiddenNow(state).length || houseSize < 6) return null;
  const p = (state.plan.fakes || []).find(f => f.week === week && !f.used);
  if (p) return p;
  // an old save planned the single verdict
  return !state.plan.fakes && state.plan.secretRoomWeek === week ? { week, kind: 'verdict', weeks: 1, role: 'watch' } : null;
}
/** Marks the plan played (and how it was really played: a double needs three nominees, or it is a verdict). */
export const usePlan = (p, kind) => { if (p) { p.used = true; p.played = kind || p.kind; } };


/** Who is hidden right now. */
export const hiddenNow = state => (state?.hidden || []).filter(h => !h.back);

/**
 * When this season's fake elimination comes, if it has one: about seven
 * seasons in ten, in the middle of the season, while the house is still big
 * enough that one week without an elimination matters.
 */
export function planSecretRoom(state, { castSize = 14, rng = Math.random, force = null } = {}) {
  state.plan ||= {};
  const on = force ?? rng() < 0.7;
  const last = Math.max(3, castSize - 7);
  state.plan.secretRoomWeek = on && last >= 3 ? 3 + Math.floor(rng() * (last - 2)) : null;
  return state.plan.secretRoomWeek;
}

/** Whether tonight's verdict is the fake one. */
export const isFakeNight = (state, week, houseSize) => !!fakePlanFor(state, week, houseSize);

/**
 * The verdict was fake: the house said goodbye, and `name` climbs the hidden
 * stairs. Who mourned them and who was glad, as the house is now.
 */
export function sendToSecretRoom(state, ctx, { name = undefined, house = [], weeks = 1, role = 'watch', kind = 'verdict', partner = null } = {}) {
  state.hidden ||= [];
  const week = ctx.week ?? 0;
  const mourners = house.filter(n => n !== name && (ctx.bond?.(n, name) ?? 0) >= 3);
  const glad = house.filter(n => n !== name && (ctx.bond?.(n, name) ?? 0) <= -3);
  // remote control: the closest friend still in the house is told, and keeps the act going (S8, S12)
  const accomplice = role === 'remote'
    ? house.filter(n => n !== name && n !== partner).sort((a, b) => (ctx.bond?.(name, b) ?? 0) - (ctx.bond?.(name, a) ?? 0))[0] || null : null;
  state.hidden.push({ name, from: week, returnWeek: week + Math.max(1, weeks), mourners, glad, back: null, role, kind, partner, accomplice, orders: 0, slipped: false });
  return { name, mourners, glad, role, kind, weeks: Math.max(1, weeks), accomplice, partner };
}

/**
 * A week upstairs: they watch everybody (the screens show every room), so their
 * theories jump, and they HEAR what was said about them. Returns the moments.
 */
export function watchFromSecretRoom(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const out = [];
  for (const h of hiddenNow(state).map(r => r.name)) {
    const moments = [];
    // the secrets: up there you see the tells nobody notices in the room
    const targets = house.filter(n => secretOf(state, n) && !secretOf(state, n).found && !(secretOf(state, h)?.holders || []).includes(n))
      .sort(() => rng() - 0.5).slice(0, 4);
    for (const t of targets) {
      const th = addEvidence(state, ctx, h, t, { strength: 0.32, how: 'secret-room' });
      if (th) moments.push({ kind: 'watch', who: h, about: t, theory: th.text, right: th.right, conf: th.conf });
    }
    // what they hear about themselves: the glad and the mourners, now from the screens
    const rec = (state.hidden || []).find(x => x.name === h && !x.back);
    const heard = [];
    for (const n of (rec?.glad || []).filter(x => house.includes(x))) heard.push({ who: n, kind: 'glad', d: -1.5 });
    for (const n of (rec?.mourners || []).filter(x => house.includes(x))) heard.push({ who: n, kind: 'mourned', d: 1.2 });
    const week = ctx.week ?? 0;
    // the master of the nominations from above: one nominee this week, the one they saw at their worst
    let masterPick = null;
    if (rec?.role === 'master') {
      const immune = new Set((state.nextImmune || {})[week] || []);
      masterPick = house.filter(n => !immune.has(n) && n !== rec.partner)
        .sort((a, b) => ((ctx.bond?.(h, a) ?? 0) - ((rec.glad || []).includes(a) ? 3 : 0)) - ((ctx.bond?.(h, b) ?? 0) - ((rec.glad || []).includes(b) ? 3 : 0)))[0] || null;
      if (masterPick) {
        state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
        (state.rules.dOffice[week] ||= []).includes(masterPick) || state.rules.dOffice[week].push(masterPick);
      }
    }
    // remote control: the accomplice runs one order a week for $500, and might give it away
    let order = null;
    if (rec?.role === 'remote' && rec.accomplice && house.includes(rec.accomplice)) {
      const a = rec.accomplice;
      const kind = ['tears', 'steer', 'plant'][(rec.orders || 0) % 3];
      const other = house.filter(n => n !== a).sort(() => rng() - 0.5)[0] || null;
      const ok = rng() < Math.min(0.92, 0.45 + (Number(ctx.stat?.(a, 'social')) || 5) * 0.05);
      // a slip: the accomplice laughs at the wrong moment, or knows something they shouldn't (once at most)
      const slip = !rec.slipped && rng() < Math.max(0.03, 0.22 - (Number(ctx.stat?.(a, 'temperament')) || 5) * 0.02);
      if (ok) mint(state, a, 500, `ran ${h}'s order from the secret room`, week);
      if (slip) rec.slipped = true;
      rec.orders = (rec.orders || 0) + 1;
      order = { accomplice: a, kind, other, ok, slip, money: ok ? 500 : 0 };
    }
    out.push({ name: h, moments, heard, role: rec?.role || 'watch', masterPick, order, accomplice: rec?.accomplice || null, partner: rec?.partner || null, first: rec?.from === week - 1 });
  }
  return out;
}

/**
 * The return, on the prime: they walk back into the house. Their power (S5,
 * S6): one housemate nominated for next week, chosen from what they saw, and
 * immunity for themselves. Writes the nomination and the immunity for next week.
 */
export function bringBack(state, ctx, { house = [] } = {}) {
  const week = ctx.week ?? 0;
  const back = [];
  for (const rec of (state.hidden || []).filter(x => !x.back && x.returnWeek <= week)) {
    rec.back = week;
    const glad = (rec.glad || []).filter(n => house.includes(n));
    const target = (glad.length ? glad : house.filter(n => n !== rec.name))
      .sort((a, b) => (ctx.bond?.(rec.name, a) ?? 0) - (ctx.bond?.(rec.name, b) ?? 0))[0] || null;
    state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
    if (target) (state.rules.dOffice[week + 1] ||= []).includes(target) || state.rules.dOffice[week + 1].push(target);
    state.nextImmune ||= {};
    (state.nextImmune[week + 1] ||= []).includes(rec.name) || state.nextImmune[week + 1].push(rec.name);
    back.push({ name: rec.name, target, glad, mourners: (rec.mourners || []).filter(n => house.includes(n)), from: rec.from,
      role: rec.role || 'watch', fakeKind: rec.kind || 'verdict', partner: rec.partner || null, accomplice: rec.accomplice && house.includes(rec.accomplice) ? rec.accomplice : null, slipped: !!rec.slipped });
  }
  return back;
}

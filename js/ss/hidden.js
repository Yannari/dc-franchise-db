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
export const isFakeNight = (state, week, houseSize) =>
  !!state?.plan?.secretRoomWeek && state.plan.secretRoomWeek === week && !hiddenNow(state).length && houseSize >= 6;

/**
 * The verdict was fake: the house said goodbye, and `name` climbs the hidden
 * stairs. Who mourned them and who was glad, as the house is now.
 */
export function sendToSecretRoom(state, ctx, { name = undefined, house = [] } = {}) {
  state.hidden ||= [];
  const week = ctx.week ?? 0;
  const mourners = house.filter(n => n !== name && (ctx.bond?.(n, name) ?? 0) >= 3);
  const glad = house.filter(n => n !== name && (ctx.bond?.(n, name) ?? 0) <= -3);
  state.hidden.push({ name, from: week, returnWeek: week + 1, mourners, glad, back: null });
  return { name, mourners, glad };
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
    out.push({ name: h, moments, heard });
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
    back.push({ name: rec.name, target, glad, mourners: (rec.mourners || []).filter(n => house.includes(n)), from: rec.from });
  }
  return back;
}

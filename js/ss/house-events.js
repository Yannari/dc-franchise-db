// ══════════════════════════════════════════════════════════════════════
// ss/house-events.js — the week's big house event
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "there's so much more to Secret Story: random collective missions for some money, sexy
// housework, Miss and Mister Secret for some clues, clan war, more than one secret room". One of these most weeks,
// never the same twice running, each decided from the housemates and each with its stakes:
//
// - THE HOUSE MISSION: the Voice sets the whole house a task (the generic sung in harmony, silence for an hour,
//   a giant egg kept whole for three days, a human pyramid). The house succeeds together or fails because of
//   somebody: everybody's kitty, or a house punishment.
// - THE SEXY HOUSEWORK: two housemates clean the whole house in uniform, to music, for the Voice's money; the
//   house watches from the sofas.
// - MISS AND MISTER SECRET: a pageant on the living-room catwalk (the walk, a talent, a question); the house votes,
//   and the winners each get a clue on the secret of their choice.
// - THE CLAN WAR: the house split in two by the Voice, along its friendships; the clans compete, the winners
//   eat well and the losers sleep in the store; the clans stick together, and against each other, for a while.
// - A SECRET ROOM: somebody finds a hidden door (the house has more than one: behind the library, under the
//   stairs, inside the wardrobe); inside, the Voice has left money or a clue, for whoever finds it.
//
// Pure: returns { kind, ..., effects } for the adapter (js/bb/secret-story.js) to apply.

import { mint } from './kitty.js';
import { addEvidence, secretOf } from './hunt.js';
import { surpriseOk } from './schedule.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const pick = (l, rng) => l[Math.floor(rng() * l.length) % Math.max(1, l.length)];

export const HOUSE_MISSIONS = [
  { id: 'generic', text: "sing the show's theme together, in harmony, live on the prime", stat: 'social', reward: 400 },
  { id: 'silence', text: 'stay completely silent for one hour, all of you, wherever you are', stat: 'temperament', reward: 300 },
  { id: 'egg', text: 'keep a giant egg whole for three days, carried everywhere, never left alone', stat: 'loyalty', reward: 500 },
  { id: 'pyramid', text: 'build a human pyramid in the garden and hold it for thirty seconds', stat: 'physical', reward: 400 },
  { id: 'pyjamas', text: 'wear pyjamas all day, every one of you, without a single complaint', stat: 'temperament', reward: 300 },
  { id: 'dance', text: 'learn a dance routine and perform it, all together, without a mistake', stat: 'endurance', reward: 400 },
];
export const SECRET_ROOMS = [
  { id: 'library', where: 'behind a bookcase in the library', plate: 'library-wide' },
  { id: 'wardrobe', where: "at the back of the girls' wardrobe", plate: 'bedroom-wide' },
  { id: 'stairs', where: 'under the attic stairs', plate: 'ss-attic-stairs' },
  { id: 'vault', where: 'behind the mirror in the bathroom', plate: 'ss-vault' },
];
export const PAGEANT_ROUNDS = ['the catwalk', 'a talent', 'a question from the Voice'];

/**
 * This week's big house event, or null.
 * @param {any} state @param {any} ctx huntCtx @param {{ house?: string[] }} o
 * @returns {any}
 */
export function houseEvent(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  const wk = ctx.week ?? 0;
  if (room.length < 5 || wk < 1) return null;
  const done = (state.houseEvents ||= []);
  const last = done.at(-1);
  const count = k => done.filter(e => e.kind === k).length;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const fx = { bond: [], pub: [] };
  // what can happen this week (one per season for the big ones, never the same twice running)
  const can = [
    ['mission', 0.5, count('mission') < 4],
    ['housework', 0.25, count('housework') < 2],
    ['pageant', 0.55, count('pageant') < 1 && wk >= 3 && room.length >= 6],
    // (the Clan War splits the house: never a surprise when Surprise twists is off)
    ['clans', 0.5, count('clans') < 1 && room.length >= 8 && !state.surpriseOff && surpriseOk(state, wk, 'clans-event')],
    ['room', 0.35, count('room') < 2 && wk >= 2],
  ].filter(([k, , ok]) => ok && k !== last?.kind);
  const total = can.reduce((t, [, w]) => t + w, 0);
  if (!can.length || rng() > 0.7) return null;
  let r = rng() * total, kind = can[0][0];
  for (const [k, w] of can) { r -= w; if (r <= 0) { kind = k; break; } }

  let ev = null;
  if (kind === 'mission') {
    const m = pick(HOUSE_MISSIONS.filter(x => !done.some(e => e.mission === x.id)), rng) || pick(HOUSE_MISSIONS, rng);
    // the weakest link at the task decides it
    const weak = room.slice().sort((a, b) => S(a, m.stat) - S(b, m.stat))[0];
    const avg = room.reduce((t, n) => t + S(n, m.stat), 0) / room.length;
    const ok = rng() < clamp(0.25 + avg * 0.06 - (6 - S(weak, m.stat)) * 0.04, 0.15, 0.9);
    if (ok) for (const n of room) mint(state, n, m.reward, `the house mission: ${m.id}`, wk);
    else { state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} }; (state.rules.house ||= {})[wk] ||= 'hot-water'; (state.rules.houseBlame ||= {})[wk] ||= weak; }
    for (const n of room) if (n !== weak) fx.bond.push([n, weak, ok ? 0.1 : -0.35]);
    for (let i = 0; i < room.length - 1; i++) fx.bond.push([room[i], room[i + 1], ok ? 0.25 : 0]);
    fx.pub.push([weak, ok ? 'warmth' : 'pity', 0.1, ok ? 'pulled the house mission off with everybody' : 'cost the house its mission']);
    ev = { kind, mission: m.id, text: m.text, reward: m.reward, ok, weak };
  } else if (kind === 'housework') {
    const bold = room.slice().sort((a, b) => (S(b, 'boldness') + S(b, 'social') * 0.5 + rng() * 3) - (S(a, 'boldness') + S(a, 'social') * 0.5 + rng() * 3));
    const [a, b] = bold;
    const ok = rng() < clamp(0.4 + (S(a, 'endurance') + S(b, 'endurance')) * 0.03, 0.2, 0.92);
    if (ok) { mint(state, a, 500, 'the housework in uniform', wk); mint(state, b, 500, 'the housework in uniform', wk); }
    // the sofas enjoy the show; a crush in the room enjoys it a little more
    const fan = room.filter(n => n !== a && n !== b && ctx.compat?.(n, a) && B(n, a) >= 2)[0] || null;
    fx.bond.push([a, b, 0.4], ...(fan ? [[fan, a, 0.5]] : []));
    fx.pub.push([a, 'fun', 0.2, 'did the housework in uniform'], [b, 'fun', 0.2, 'did the housework in uniform']);
    ev = { kind, who: a, other: b, ok, fan };
  } else if (kind === 'pageant') {
    const score = n => S(n, 'social') * 0.6 + S(n, 'boldness') * 0.5 + (Number(ctx.pop(n)) || 0) * 2 + rng() * 4;
    const sc = Object.fromEntries(room.map(n => [n, score(n)]));
    const g = n => (ctx.gender?.(n) || 'x');
    const women = room.filter(n => g(n) === 'f').sort((a, b) => sc[b] - sc[a]);
    const men = room.filter(n => g(n) === 'm').sort((a, b) => sc[b] - sc[a]);
    const miss = women[0] || room.slice().sort((a, b) => sc[b] - sc[a])[0];
    const mister = men[0] || room.filter(n => n !== miss).sort((a, b) => sc[b] - sc[a])[0];
    // each winner picks the secret they most want a clue on: the strongest theory they hold that is still hidden
    const want = n => room.filter(t => t !== n && secretOf(state, t) && !secretOf(state, t).found && !(secretOf(state, t).holders || []).includes(n))
      .sort((a, b) => (Number(state.theories?.[n]?.[b]?.conf) || 0) - (Number(state.theories?.[n]?.[a]?.conf) || 0))[0];
    const clues = [];
    for (const w of [miss, mister].filter(Boolean)) {
      const t = want(w);
      if (t) { addEvidence(state, ctx, w, t, { strength: 0.35, how: 'pageant' }); clues.push({ who: w, on: t, clue: (secretOf(state, t)?.clues || [])[1] || (secretOf(state, t)?.clues || [])[0] || null }); }
    }
    const runnerUp = [women[1], men[1]].filter(Boolean);
    for (const w of [miss, mister].filter(Boolean)) fx.pub.push([w, 'seen', 0.2, 'won Miss and Mister Secret'], [w, 'fun', 0.12, 'won Miss and Mister Secret']);
    for (const r2 of runnerUp) fx.bond.push([r2, r2 === women[1] ? miss : mister, -0.3]);
    ev = { kind, miss, mister, clues, field: [...women.slice(0, 3), ...men.slice(0, 3)], runnerUp };
  } else if (kind === 'clans') {
    // two captains: the two who like each other least among the strongest characters; each picks by friendship
    const caps = room.slice().sort((a, b) => (S(b, 'social') + S(b, 'boldness')) - (S(a, 'social') + S(a, 'boldness'))).slice(0, 4);
    let best = null;
    for (const a of caps) for (const b of caps) if (a < b && (!best || B(a, b) < B(best[0], best[1]))) best = [a, b];
    if (!best) return null;
    const A = [best[0]], Bc = [best[1]];
    // everybody else goes to the captain they like more, the house split in half
    const pref = room.filter(n => !best.includes(n)).map(n => [n, B(best[0], n) - B(best[1], n) + (rng() - 0.5) * 0.5]).sort((x, y) => y[1] - x[1]);
    const half = Math.ceil(pref.length / 2);
    pref.forEach(([n], i) => (i < half ? A : Bc).push(n));
    const strength = l => l.reduce((t, n) => t + S(n, 'physical') * 0.5 + S(n, 'mental') * 0.5, 0) / l.length + rng() * 2;
    const winA = strength(A) >= strength(Bc);
    const [win, lose] = winA ? [A, Bc] : [Bc, A];
    for (const n of win) mint(state, n, 300, 'won the clan war', wk);
    for (const l of [A, Bc]) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) fx.bond.push([l[i], l[j], 0.35]);
    for (const a of A.slice(0, 3)) for (const b of Bc.slice(0, 3)) fx.bond.push([a, b, -0.25]);
    fx.pub.push([best[0], 'game', 0.1, 'led a clan'], [best[1], 'game', 0.1, 'led a clan']);
    ev = { kind, captains: best, clans: [A, Bc], names: ['The Pinks', 'The Blues'], winners: winA ? 0 : 1, game: pick(['a relay with buckets of water', 'a quiz about the house', 'a tug of war over the pool', 'a blind taste test'], rng) };
  } else if (kind === 'room') {
    const rooms = SECRET_ROOMS.filter(x => !done.some(e => e.room === x.id));
    const R = pick(rooms.length ? rooms : SECRET_ROOMS, rng);
    const who = room.slice().sort((a, b) => (S(b, 'intuition') + rng() * 5) - (S(a, 'intuition') + rng() * 5))[0];
    const money = rng() < 0.5;
    let clue = null, on = null;
    if (money) mint(state, who, 1500, `found the secret room ${R.where}`, wk);
    else {
      on = room.filter(t => t !== who && secretOf(state, t) && !secretOf(state, t).found && !(secretOf(state, t).holders || []).includes(who))[0] || null;
      if (on) { addEvidence(state, ctx, who, on, { strength: 0.3, how: 'room' }); clue = (secretOf(state, on)?.clues || [])[0] || null; }
    }
    const told = room.filter(n => n !== who && B(who, n) >= 5).slice(0, 1)[0] || null;
    if (told) fx.bond.push([who, told, 0.5]);
    fx.pub.push([who, 'game', 0.15, 'found a secret room']);
    ev = { kind, room: R.id, where: R.where, plate: R.plate, who, money: money ? 1500 : 0, clue, on, told };
  }
  if (!ev) return null;
  done.push({ week: wk, kind: ev.kind, ...(ev.mission ? { mission: ev.mission } : {}), ...(ev.room ? { room: ev.room } : {}) });
  return { ...ev, effects: fx };
}

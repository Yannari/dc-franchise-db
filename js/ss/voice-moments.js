// ══════════════════════════════════════════════════════════════════════
// ss/voice-moments.js — the Voice, between the housemates and the world
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "the Voice does so much more, from lighthearted
// conversation to game-changing announcements, secret announcements: it's the
// bridge between the housemates and the production and real life". Read off
// every "Ici la voix" in the S14 and S12 dailies (scratch transcripts):
//
// - small paid missions in the confessional: get somebody to wear the trapped
//   mask (a clue on their secret if it works), the garlic-breath mission ($500),
//   tuck every housemate into bed one by one;
// - the red phone on speaker: "who is the funniest housemate? Pass the phone to
//   them", round the house;
// - good news: "the Voice brings you good news: you've won $2,000";
// - a test of nerve in the red room (catch ten balls), counting the coins in
//   the piggy bank to the dollar;
// - the light telling-off ("a little more sense of responsibility, please");
// - real life coming in: a birthday, a letter from home.
//
// Each moment is decided here from the state and the housemates (their stats,
// their bonds, the country's favourites) and has its consequence: money, a bond,
// a clue, the public. Pure: the adapter (js/bb/secret-story.js) applies `effects`.

import { mint, burn } from './kitty.js';
import { addEvidence, secretOf } from './hunt.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const pick = (l, rng) => l[Math.floor(rng() * l.length) % Math.max(1, l.length)];
const odds = (rng, p) => rng() < clamp(p, 0.05, 0.95);

// what the Voice can be heard telling somebody off for (light, never cruel)
export const SCOLDS = [
  { id: 'dishes', text: 'your dishes have been in the sink since yesterday', stat: 'temperament' },
  { id: 'mic', text: 'your microphone has been off for most of the afternoon', stat: 'loyalty' },
  { id: 'nap', text: "you've been asleep on the sofa since lunch", stat: 'endurance' },
  { id: 'singing', text: "you've been singing in the bathroom since four in the morning", stat: 'boldness' },
  { id: 'lights', text: 'you left the garden lights on all night', stat: 'mental' },
];
// what the red phone asks, round the house
export const POLLS = [
  { id: 'funniest', q: 'which housemate is the funniest in the house', by: 'fun' },
  { id: 'sincere', q: 'which housemate is the most sincere in the house', by: 'warm' },
  { id: 'messiest', q: 'which housemate is the messiest in the house', by: 'loose' },
  { id: 'strategist', q: 'which housemate is the best strategist in the house', by: 'brain' },
];

/**
 * Two or three of the Voice's moments this week. Each: { kind, who, other?, money?, ok?, ... , effects }.
 * @param {any} state the season's Secret Story state
 * @param {any} ctx huntCtx (rng, week, stat, bond, pop)
 * @param {{ house?: string[] }} o
 */
export function voiceMoments(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  const wk = ctx.week ?? 0;
  if (room.length < 4) return [];
  const used = (state.voiceMomentsUsed ||= {});
  const fresh = k => !(used[k] && wk - used[k] < 3);       // the same kind of moment, not two weeks running
  const out = [];
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const by = f => room.slice().sort((a, b) => f(b) - f(a) + (rng() - 0.5) * 3);
  const take = new Set();
  const free = l => l.filter(n => !take.has(n));
  const add = m => { if (!m) return; out.push(m); used[m.kind] = wk; take.add(m.who); if (m.other) take.add(m.other); };

  // the candidates, each built only if it can happen this week
  const make = {
    // the trapped mask: get somebody to wear it, without saying why; a clue on their secret if it works
    mask() {
      const who = free(by(n => S(n, 'social') + S(n, 'boldness')))[0];
      if (!who) return null;
      const other = free(room.filter(n => n !== who && secretOf(state, n) && !secretOf(state, n).found && !(secretOf(state, n).holders || []).includes(who)))
        .sort((a, b) => B(who, b) - B(who, a))[0];
      if (!other) return null;
      const ok = odds(rng, 0.25 + S(who, 'social') * 0.05 + Math.max(0, B(other, who)) * 0.03);
      const clue = ok ? addEvidence(state, ctx, who, other, { strength: 0.3, how: 'voice' }) : null;
      return { kind: 'mask', who, other, ok, clue: clue ? (secretOf(state, other)?.clues || [])[0] || null : null,
        effects: { bond: ok ? [[who, other, 0.3]] : [[other, who, -0.3]], pub: [[who, 'fun', 0.1, 'got the mask on somebody for a clue']] } };
    },
    // the garlic-breath mission: $500 to eat raw garlic, onion and a shallot, then talk to everyone up close
    garlic() {
      const who = free(by(n => S(n, 'boldness') + S(n, 'endurance')))[0];
      if (!who) return null;
      const ok = odds(rng, 0.3 + S(who, 'endurance') * 0.06);
      const money = ok ? mint(state, who, 500, 'the garlic-breath mission', wk) : 0;
      const victims = room.filter(n => n !== who).sort(() => rng() - 0.5).slice(0, 2);
      return { kind: 'garlic', who, ok, money, victims,
        effects: { bond: victims.map(v => [v, who, -0.15]), pub: [[who, 'fun', 0.22, 'did the garlic-breath mission']] } };
    },
    // tuck every housemate into bed, one by one, tonight; nobody may know why
    tuck() {
      const pair = free(by(n => S(n, 'social') + S(n, 'loyalty')));
      const who = pair[0], other = pair.find(n => n !== who && B(who, n) >= 0);
      if (!who || !other) return null;
      const ok = odds(rng, 0.35 + (S(who, 'social') + S(other, 'social')) * 0.03);
      const money = ok ? mint(state, who, 250, 'tucked the house into bed', wk) + mint(state, other, 250, 'tucked the house into bed', wk) : 0;
      return { kind: 'tuck', who, other, ok, money,
        effects: { bond: [[who, other, 0.6], ...room.filter(n => n !== who && n !== other).slice(0, 4).map(n => [n, who, 0.15])],
          pub: [[who, 'warmth', 0.15, 'tucked the whole house into bed'], [other, 'warmth', 0.15, 'tucked the whole house into bed']] } };
    },
    // the red phone on speaker, round the house: each answer names the next to hold it
    poll() {
      const P = pick(POLLS, rng);
      const score = n => (P.by === 'fun' ? S(n, 'boldness') + S(n, 'social') * 0.5 : P.by === 'warm' ? S(n, 'loyalty') + S(n, 'temperament') * 0.5
        : P.by === 'loose' ? 10 - S(n, 'temperament') + S(n, 'boldness') * 0.3 : S(n, 'strategic') + S(n, 'mental') * 0.5);
      const chain = [];
      let holder = by(n => S(n, 'boldness'))[0];
      for (let i = 0; i < 3 && holder; i++) {
        const named = room.filter(n => n !== holder && !chain.some(c => c.holder === n)).sort((a, b) => (score(b) + B(holder, b) * 0.3 + rng()) - (score(a) + B(holder, a) * 0.3 + rng()))[0];
        if (!named) break;
        chain.push({ holder, named });
        holder = named;
      }
      if (chain.length < 2) return null;
      const good = P.by !== 'loose';
      return { kind: 'poll', who: chain[0].holder, poll: P.id, q: P.q, chain,
        effects: { bond: chain.map(c => [c.named, c.holder, good ? 0.3 : -0.2]), pub: chain.map(c => [c.named, good ? 'warmth' : 'fun', 0.08, `was named ${P.id} on the red phone`]) } };
    },
    // good news: the country's favourite of the week gets a present from the public
    present() {
      const who = free(room.slice().sort((a, b) => (Number(ctx.pop(b)) || 0) - (Number(ctx.pop(a)) || 0)))[0];
      if (!who) return null;
      const money = mint(state, who, 1000, 'a present from the public', wk);
      return { kind: 'present', who, money, effects: { pub: [[who, 'warmth', 0.1, 'got a present from the public']], bond: [] } };
    },
    // the red room: catch ten balls before they touch the floor, for $2,000
    balls() {
      const who = free(by(n => S(n, 'physical') + S(n, 'boldness') * 0.5))[0];
      if (!who) return null;
      const caught = clamp(Math.round(4 + S(who, 'physical') * 0.6 + (rng() - 0.5) * 6), 0, 14);
      const ok = caught >= 10;
      const money = ok ? mint(state, who, 2000, 'caught the balls in the red room', wk) : 0;
      return { kind: 'balls', who, caught, ok, money, effects: { pub: [[who, ok ? 'game' : 'fun', 0.12, `caught ${caught} balls in the red room`]], bond: [] } };
    },
    // count the coins in the piggy bank: close enough, and they're yours
    coins() {
      const who = free(by(n => S(n, 'mental') + S(n, 'endurance') * 0.3))[0];
      if (!who) return null;
      const truth = 900 + Math.floor(rng() * 900);
      const miss = Math.round((11 - S(who, 'mental')) * (rng() * 2.2));
      const said = truth + (rng() < 0.5 ? -miss : miss);
      const ok = Math.abs(said - truth) <= 5;
      const money = ok ? mint(state, who, truth, 'counted the piggy bank to within five dollars', wk) : 0;
      return { kind: 'coins', who, truth, said, ok, money, effects: { pub: [[who, 'fun', 0.08, 'counted the piggy bank']], bond: [] } };
    },
    // a light telling-off, in front of everybody
    scold() {
      const sc = pick(SCOLDS, rng);
      const who = free(room.slice().sort((a, b) => (S(a, sc.stat) - S(b, sc.stat)) + (rng() - 0.5) * 3))[0];
      if (!who) return null;
      const fine = sc.id === 'mic' ? burn(state, who, 100, 'microphone off', wk) : 0;
      return { kind: 'scold', who, scold: sc.id, text: sc.text, money: fine,
        effects: { pub: [[who, 'fun', 0.12, 'got told off by the Voice']], bond: [] } };
    },
    // real life: a birthday in the house
    birthday() {
      const done = new Set(state.birthdays || []);
      const who = free(room.filter(n => !done.has(n)))[Math.floor(rng() * room.length) % Math.max(1, room.length)];
      if (!who) return null;
      (state.birthdays ||= []).push(who);
      return { kind: 'birthday', who, effects: { bond: room.filter(n => n !== who).slice(0, 5).map(n => [n, who, 0.2]), pub: [[who, 'warmth', 0.12, 'had a birthday in the house']] } };
    },
    // real life: a letter from home, read in the confessional (the hardest-hit housemate)
    letter() {
      const who = free(room.slice().sort((a, b) => (S(a, 'temperament') - S(b, 'temperament')) + (rng() - 0.5) * 2))[0];
      if (!who) return null;
      return { kind: 'letter', who, effects: { pub: [[who, 'pity', 0.1, 'got a letter from home'], [who, 'warmth', 0.08, 'got a letter from home']], bond: [] } };
    },
  };
  const order = Object.keys(make).filter(fresh).sort(() => rng() - 0.5);
  const n = room.length >= 8 ? 3 : 2;
  for (const k of order) { if (out.length >= n) break; try { add(make[k]()); } catch { /* a moment that cannot happen this week */ } }
  return out;
}

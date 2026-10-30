// ══════════════════════════════════════════════════════════════════════
// ss/nomination-twists.js — the week the Voice changes the nominations
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 2, F2.2 (docs/superpowers/specs/2026-10-28-secret-story-powers-design.md). About one week in
// three from week two, announced before the nominations, never the same twice running:
//
//   'linked'     S6, S11, S13, S14  housemates in pairs this week: nominate one, both go up;
//   'for-life'   S5, S11            one housemate nominated every week until it is lifted, or taken by a friend;
//   'inverted'   S5, S6             the house names who it wants to SAVE; the least saved go up;
//   'houses'     S5, S6, S7         a duel splits the house: the Immunity House cannot be named, the Nomination
//                                  House nominates among itself;
//   'red-room'   S6                 a red door opens; whoever goes in is nominated, and drags one more in;
//   'exclusive'  S3, S9             one housemate names the week's nominees alone.
//
// Pure: decides and records on state.weekTwists[week]; the nominations (js/bb/secret-story.js) read it.

import { surpriseOk, markSurprise, earliestOf } from './schedule.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const WEEK_TWISTS = ['linked', 'for-life', 'inverted', 'houses', 'red-room', 'exclusive', 'everybody'];
export const WEEK_TWIST_NAMES = { linked: 'Linked Destinies', 'for-life': 'Nominated for Life', inverted: 'The Inverted Nominations', houses: 'Immunity House against Nomination House', 'red-room': 'The Red Room', exclusive: 'One Name for Everybody', everybody: 'Everybody Is Nominated' };

/**
 * This week's nomination twist, decided before the nominations (or null). Also keeps a running
 * nomination-for-life going, and lifts it.
 * @returns {any}
 */
export function weekTwist(state, ctx, { house = [], winner = null } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  state.weekTwists ||= {};
  // a nomination for life still running: lifted by the Voice, or taken by a friend
  const life = state.forLife;
  let lifeNews = null;
  if (life && !life.over && house.includes(life.who) && wk > life.from) {
    const friend = house.filter(n => n !== life.who).sort((a, b) => B(b, life.who) - B(a, life.who))[0];
    if (wk >= life.until) { life.over = wk; lifeNews = { kind: 'lifted', who: life.who }; }
    else if (friend && B(friend, life.who) >= 5 && rng() < clamp(0.1 + S(friend, 'loyalty') * 0.03, 0.05, 0.4)) {
      lifeNews = { kind: 'taken', who: life.who, by: friend };
      life.who = friend; life.takenBy = friend;
    } else lifeNews = { kind: 'still', who: life.who };
  } else if (life && !life.over && !house.includes(life.who)) life.over = wk;
  // (a test, or a setting, can pin this week's twist: state.forceWeekTwist[week])
  const forced = state.forceWeekTwist?.[wk];
  if (forced === 'none') return lifeNews ? { kind: null, life: lifeNews } : null;
  if (!forced && (wk < 2 || house.length < 7)) return lifeNews ? { kind: null, life: lifeNews } : null;
  const last = state.weekTwists[wk - 1]?.kind;
  if (!forced && (!surpriseOk(state, wk) || rng() > 0.33)) return lifeNews ? { kind: null, life: lifeNews } : null;
  // (the whole house in front of the public is rare and late, and half as likely as the rest; every twist has its
  // earliest week: js/ss/schedule.js SS_EARLIEST)
  const can = WEEK_TWISTS.filter(k => k !== last && wk >= earliestOf(`ss-${k}`) && (k !== 'for-life' || !life || life.over) && (k !== 'houses' || house.length >= 8)
    && (k !== 'everybody' || (house.length >= 8 && Object.values(state.weekTwists).every(x => x?.kind !== 'everybody') && rng() < 0.5)));
  if (!forced && !can.length) return lifeNews ? { kind: null, life: lifeNews } : null;
  const kind = forced || can[Math.floor(rng() * can.length) % can.length];
  markSurprise(state, wk, `ss-${kind}`);
  const t = { kind, week: wk };
  if (kind === 'linked') {
    // the Voice pairs them by chance, as the show did (sometimes the worst of enemies)
    const pool = house.slice().sort(() => rng() - 0.5);
    t.pairs = [];
    for (let i = 0; i + 1 < pool.length; i += 2) t.pairs.push([pool[i], pool[i + 1]]);
  } else if (kind === 'for-life') {
    // who gets it: a housemate the masters of the house (the week's winner, or the Voice) want gone
    const by = winner && house.includes(winner) ? winner : null;
    const who = house.filter(n => n !== by).sort((a, b) => (by ? B(by, a) - B(by, b) : S(a, 'social') - S(b, 'social')) + (rng() - 0.5) * 2)[0];
    state.forLife = { who, by, from: wk, until: wk + 2 + Math.floor(rng() * 2), over: null };
    t.who = who; t.by = by;
  } else if (kind === 'houses') {
    // the Voice draws two houses; their champions duel, and the winning side is immune this week
    const pool = house.slice().sort(() => rng() - 0.5);
    const a = pool.filter((_, i) => i % 2 === 0), b = pool.filter((_, i) => i % 2 === 1);
    const champ = l => l.slice().sort((x, y) => (S(y, 'physical') + S(y, 'mental')) - (S(x, 'physical') + S(x, 'mental')))[0];
    const ca = champ(a), cb = champ(b);
    const aWins = (S(ca, 'physical') + S(ca, 'mental') + rng() * 6) >= (S(cb, 'physical') + S(cb, 'mental') + rng() * 6);
    t.immuneHouse = aWins ? a : b; t.nominationHouse = aWins ? b : a; t.champions = [ca, cb]; t.winner = aWins ? ca : cb;
  } else if (kind === 'red-room') {
    // the curious go in first; whoever goes in is nominated and names one more
    const who = house.slice().sort((a, b) => (S(b, 'boldness') + rng() * 5) - (S(a, 'boldness') + rng() * 5))[0];
    const dragged = house.filter(n => n !== who).sort((a, b) => B(who, a) - B(who, b))[0];
    t.who = who; t.dragged = dragged;
  } else if (kind === 'exclusive') {
    const who = winner && house.includes(winner) ? winner : house.slice().sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0];
    t.who = who;
  }
  state.weekTwists[wk] = t;
  return { ...t, life: lifeNews };
}

/** The twist recorded for this week (the nominations read it). */
export const twistOf = (state, wk) => state?.weekTwists?.[wk] || null;
/** Whoever is nominated for life this week. */
export const forLifeNow = (state, wk) => (state?.forLife && !state.forLife.over && wk > state.forLife.from - 1 ? state.forLife.who : null);

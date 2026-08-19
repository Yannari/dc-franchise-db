// ══════════════════════════════════════════════════════════════════════
// bb-events/wildcard.js — the week that serves what one person decided
// ══════════════════════════════════════════════════════════════════════
//
// The Wildcard act lands its consequences at fire time — bonds, popularity,
// the punishment itself — and then the week went silent about it. A house
// serving one person's bill for seven days without a single scene about it,
// or a refusal ("I don't need saving") that nobody ever tested in
// conversation: both were missing, and both are the twist's best material.
//
// THEY COULD TAKE IT WELL OR LESS WELL, REALLY DEPENDS — nothing here has one
// reaction. A server needles the winner or tips their cap; the refuser is
// admired or re-priced as somebody who must already have the votes.
import { pronouns } from '../players.js';
import { pStats, band, perceived } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _wc = (ctx, house) => {
  const wc = ctx?.week?.wildcard;
  if (!wc?.winner || !house.includes(wc.winner)) return null;
  return wc;
};

// ── serving somebody else's bill ──────────────────────────────────────
const servingTheBill = {
  id: 'wildcard-serving',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const wc = _wc(ctx, house);
    return wc?.accepted && wc.houseWide
      && (wc.served || []).some(n => house.includes(n)) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const wc = _wc(ctx, house);
    const winner = wc.winner;
    // WHO fronts the scene varies week to week — always casting the shortest
    // temper in the house guaranteed the needling branch every single time,
    // which the aftermath test caught on its first run. The salt picks the
    // server; the server's own temperament picks the direction.
    const pool = (wc.served || []).filter(n => house.includes(n));
    if (!pool.length) return null;
    let h = 0;
    const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}`;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const server = pool[h % pool.length];
    const st = pStats(server);
    const bill = wc.punishmentLabel || 'the punishment';
    // Short tempers collect; long ones tip their cap and bank it.
    const needles = st.temperament < 5.5;
    if (needles) {
      const text = _variant([
        `${server} makes sure ${winner} is in the room every single time ${bill} goes off. "Don't look away. This is yours. We're just wearing it."`,
        `${server} has started keeping a tally where the whole kitchen can see it — every time the house serves ${bill}, another mark, and the column is headed with ${winner}'s name.`,
        `"Comfortable?" ${server} asks ${winner}, mid-${bill}, in front of everybody. It is not a question. It is an invoice.`,
      ], ctx, server, winner);
      api.addBond(server, winner, -0.7);
      api.popDelta(winner, -0.5);
      return { text, players: [server, winner], badgeText: 'THE BILL, PRESENTED', badgeClass: 'red' };
    }
    const text = _variant([
      `${server} serves ${bill} without one word of complaint, and tells ${winner} so: "Good move. I'd have done the same." Then, later, quietly, to somebody else: "And I'll remember it the same, too."`,
      `${server} treats the whole thing as comedy — takes a bow every time ${bill} fires — which keeps the house laughing and keeps ${winner} from ever quite relaxing.`,
      `${server} tips an imaginary cap at ${winner} across the yard. Respect, genuinely. Also arithmetic: a person who will spend the whole house once will spend it twice.`,
    ], ctx, server, winner);
    api.remember(server, winner, 'spent-the-house-once', 1, { twist: 'bb-wildcard' });
    return { text, players: [server, winner], badgeText: 'SERVED WITH A SMILE', badgeClass: 'blue' };
  },
};

// ── the refusal, tested ───────────────────────────────────────────────
//
// Turning down safety in front of the house is a claim. Claims get tested.
const refusalTested = {
  id: 'wildcard-refusal-tested',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const wc = _wc(ctx, house);
    return wc && !wc.accepted ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const wc = _wc(ctx, house);
    const who = wc.winner;
    const p = pronouns(who);
    const reader = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!reader) return null;
    // High intuition reads it as information; the rest read it as style.
    const suspects = pStats(reader).intuition >= 5.5;
    if (suspects) {
      const text = _variant([
        `${reader} cannot leave it alone: nobody turns down safety unless they already HAVE safety. "So who's got ${p.obj} covered?" The question does a lap of the house by evening.`,
        `${reader} walks through it out loud — the punishment was survivable, the block is not, and ${who} said no anyway. "That's not brave. That's a person who's counted."`,
        `${reader} starts watching who ${who} eats with, who ${p.sub} whispers with, who laughed first when ${p.sub} refused. Somewhere in that list is the reason no was affordable.`,
      ], ctx, who, reader);
      api.suspicion(reader, who, 1.3);
      api.remember(reader, who, 'refused-too-easily', 1.5, { twist: 'bb-wildcard' });
      return { text, players: [reader, who], badgeText: 'THE NO GETS COUNTED', badgeClass: 'grey' };
    }
    const text = _variant([
      `The refusal has aged well by mid-week: ${who} looked at a deal and said no thanks, and the house has decided that was the coolest thing anybody has done here. ${who} lets them.`,
      `${reader} brings it up admiringly at dinner — "I'd have taken it, no shame" — and the table agrees ${who} has a spine. Spines get remembered in this house, in every sense.`,
      `${who} gets asked about the no exactly once and shrugs: "Didn't feel like owing anyone." Half the room falls a little in line behind ${p.obj} on the spot.`,
    ], ctx, who, reader);
    api.popDelta(who, 1);
    return { text, players: [who, reader], badgeText: 'THE NO, ADMIRED', badgeClass: 'gold' };
  },
};

// ── wearing the receipt ───────────────────────────────────────────────
//
// The solo price: safe all week, and dressed as the reason why.
const wearingIt = {
  id: 'wildcard-wearing-it',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const wc = _wc(ctx, house);
    return wc?.accepted && !wc.houseWide ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const wc = _wc(ctx, house);
    const who = wc.winner;
    const p = pronouns(who);
    const bill = wc.punishmentLabel || 'the punishment';
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).social - pStats(a).social)[0];
    const st = pStats(who);
    // Own it and it plays; sulk in it and it reads as weakness.
    const owns = st.boldness >= 5;
    if (owns) {
      const text = _variant([
        `${who} has decided ${bill} is a bit, and commits. By Wednesday the house is requesting encores, and it is genuinely impossible to plot against somebody this ridiculous.`,
        `${who} wears the price like it was the prize — poses for the memory wall in it, thanks the academy. ${watcher || 'The house'} laughs, and threat assessments quietly drop a notch.`,
        `"Safe AND fabulous." ${who} says it every time ${bill} fires, and the joke has stopped being a joke: it is a week-long advertisement for being harmless.`,
      ], ctx, who);
      api.popDelta(who, 1);
      if (watcher) api.remember(watcher, who, 'harmless-in-costume', 1, { twist: 'bb-wildcard' });
      return { text, players: [who, watcher].filter(Boolean), badgeText: 'OWNS THE RECEIPT', badgeClass: 'gold' };
    }
    const text = _variant([
      `${who} is safe and miserable about it in equal measure, and the house has noticed the maths: ${p.sub} paid for the week and hates every visible minute of the price.`,
      `${who} flinches every time ${bill} fires, and ${watcher || 'somebody'} murmurs the obvious: imagine what a NOMINATION would do to ${p.obj}.`,
      `The safety was the easy part. Being watched serving ${bill} is the bill behind the bill, and ${who} is paying it with less grace by the day.`,
    ], ctx, who);
    api.popDelta(who, -0.5);
    return { text, players: [who, watcher].filter(Boolean), badgeText: 'HATES THE RECEIPT', badgeClass: 'grey' };
  },
};

export const WILDCARD_EVENTS = [servingTheBill, refusalTested, wearingIt];

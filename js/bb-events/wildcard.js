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
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('wildcard-serving', Number(ctx?.week?.num) || 0)) return 0;
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
      const scene = makeScene('wild.serving', { a: server, b: winner }, { ending: 'needles', bill }, [], 'kitchen');
      api.addBond(server, winner, -0.7);
      api.popDelta(winner, -0.5);
      return { scene, players: [server, winner], badgeText: 'THE BILL, PRESENTED', badgeClass: 'red' };
    }
    const scene = makeScene('wild.serving', { a: server, b: winner }, { ending: 'smiles', bill }, [], 'kitchen');
    api.remember(server, winner, 'spent-the-house-once', 1, { twist: 'bb-wildcard' });
    return { scene, players: [server, winner], badgeText: 'SERVED WITH A SMILE', badgeClass: 'blue' };
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('wildcard-refusal-tested', Number(ctx?.week?.num) || 0)) return 0;
    const wc = _wc(ctx, house);
    return wc && !wc.accepted ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const wc = _wc(ctx, house);
    const who = wc.winner;
    const reader = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!reader) return null;
    // High intuition reads it as information; the rest read it as style.
    const suspects = pStats(reader).intuition >= 5.5;
    if (suspects) {
      const scene = makeScene('wild.refusal', { a: reader, b: who }, { ending: 'suspects' }, [], 'kitchen');
      api.suspicion(reader, who, 1.3);
      api.remember(reader, who, 'refused-too-easily', 1.5, { twist: 'bb-wildcard' });
      return { scene, players: [reader, who], badgeText: 'THE NO GETS COUNTED', badgeClass: 'grey' };
    }
    const scene = makeScene('wild.refusal', { a: reader, b: who }, { ending: 'admired' }, [], 'kitchen');
    api.popDelta(who, 1);
    return { scene, players: [who, reader], badgeText: 'THE NO, ADMIRED', badgeClass: 'gold' };
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('wildcard-wearing-it', Number(ctx?.week?.num) || 0)) return 0;
    const wc = _wc(ctx, house);
    return wc?.accepted && !wc.houseWide ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const wc = _wc(ctx, house);
    const who = wc.winner;
    const bill = wc.punishmentLabel || 'the punishment';
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).social - pStats(a).social)[0];
    const st = pStats(who);
    // Own it and it plays; sulk in it and it reads as weakness.
    const owns = st.boldness >= 5;
    if (owns) {
      const scene = makeScene('wild.wearing', { a: who, b: watcher || null }, { ending: 'owns', intent: watcher ? 'seen' : 'alone', bill }, [], 'living-room');
      api.popDelta(who, 1);
      if (watcher) api.remember(watcher, who, 'harmless-in-costume', 1, { twist: 'bb-wildcard' });
      return { scene, players: [who, watcher].filter(Boolean), badgeText: 'OWNS THE RECEIPT', badgeClass: 'gold' };
    }
    const scene = makeScene('wild.wearing', { a: who, b: watcher || null }, { ending: 'hates', intent: watcher ? 'seen' : 'alone', bill }, [], 'living-room');
    api.popDelta(who, -0.5);
    return { scene, players: [who, watcher].filter(Boolean), badgeText: 'HATES THE RECEIPT', badgeClass: 'grey' };
  },
};

export const WILDCARD_EVENTS = [servingTheBill, refusalTested, wearingIt];

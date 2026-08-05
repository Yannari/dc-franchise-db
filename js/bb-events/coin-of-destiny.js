// ══════════════════════════════════════════════════════════════════════
// bb-events/coin-of-destiny.js — dethroned by nobody in particular
// ══════════════════════════════════════════════════════════════════════
//
// The Coin is the Coup with the name taken off, and the whole family lives in
// that difference.
//
// A Coup leaves a dethroned Head of Household with somebody to hate, which is
// painful and clean. The Coin leaves them with a LIST — everybody who bought
// in, publicly, in front of the room — one of whom took their week, and no way
// to tell which. That is worse, and it is worse in a way the house can watch:
// the suspicion is aimed at four or five people who are all equally, visibly
// guilty of having wanted it.
//
// The other half nobody else has: buying in is itself the announcement. You
// paid, in public, to try to take the nominations. Even the person who called
// it WRONG has told the entire house what they would have done with it.
//
// Rules: the winner is never named as the person who called it, and no beat
// may state that the call went a particular way for a particular person. Who
// bought in is public and fair game — that is the material.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _coin = ctx => ctx?.week?.coin || null;
/** Internal casting only — never narrated as the person who called it. */
const _winner = ctx => _coin(ctx)?.winner || null;

const _dethronedCast = (house, ctx) => {
  const c = _coin(ctx);
  const hoh = ctx?.week?.hohSecret ? null : (ctx?.week?.hoh || ctx?.hoh);
  if (!c?.calledRight || !hoh || !house.includes(hoh)) return null;
  const buyers = (c.buyers || []).filter(n => house.includes(n) && n !== hoh);
  return buyers.length ? { c, hoh, buyers } : null;
};
const _buyerCast = (house, ctx) => {
  const c = _coin(ctx);
  const buyers = (c?.buyers || []).filter(n => house.includes(n));
  if (!buyers.length) return null;
  const who = buyers[0];
  const watcher = _others(house, who).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { c, who, watcher, buyers } : null;
};
const _abstainerCast = (house, ctx) => {
  const c = _coin(ctx);
  const out = (c?.buyers || []);
  const abstained = house.filter(n => !out.includes(n) && n !== (ctx?.week?.hoh));
  if (!c || abstained.length < 1) return null;
  const who = [...abstained].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const reader = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return reader ? { c, who, reader } : null;
};
const _seatedCast = (house, ctx) => {
  const c = _coin(ctx);
  const who = (c?.nominees || []).find(n => house.includes(n));
  if (!who) return null;
  const buyers = (c.buyers || []).filter(n => house.includes(n) && n !== who);
  return buyers.length ? { c, who, buyers } : null;
};
const _winnerCast = (house, ctx) => {
  const c = _coin(ctx);
  const w = _winner(ctx);
  if (!c || !w || !house.includes(w)) return null;
  const watcher = _others(house, w).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { c, w, watcher } : null;
};

// ── a list of suspects who all paid to be on it ───────────────────────
const dethronedByNobody = {
  id: 'coin-dethroned-by-nobody',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _dethronedCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _dethronedCast(house, ctx);
    if (!cast) return null;
    const { hoh, buyers } = cast;
    const p = pronouns(hoh);
    const named = buyers.slice(0, 3).join(', ');
    const text = _variant([
      `${hoh} has lost the week and has nobody to lose it to. ${buyers.length} people bought in — ${named} — one of them took it, and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} going to spend the rest of the week looking at all of them.`,
      `A Coup would at least have given ${hoh} a name. This gave ${p.obj} a receipt: everybody who paid, and no way to narrow it down further than that.`,
      `"One of you is sitting there knowing." ${hoh} says it to a room containing ${named}, and every one of them looks equally innocent because every one of them is equally suspicious.`,
      `${hoh} won a competition, ran a week, and had it taken by somebody ${p.sub} will never be able to name. That is the part that will still be there at the final vote.`,
    ], ctx, hoh, named);
    for (const b of buyers) {
      api.suspicion(hoh, b, 1.1);
      api.addBond(hoh, b, -0.8);
    }
    api.popDelta(hoh, -0.5);
    return { text, players: [hoh, ...buyers.slice(0, 3)],
      badgeText: 'A ROOM FULL OF SUSPECTS', badgeClass: 'red' };
  },
};

// ── paying is the announcement ────────────────────────────────────────
const paidInPublic = {
  id: 'coin-paid-in-public',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _buyerCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _buyerCast(house, ctx);
    if (!cast) return null;
    const { who, watcher, buyers } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} paid to try to take the nominations, in front of everybody, and that is true whether or not ${p.sub} ${p.sub === 'they' ? 'got' : 'got'} anything for it. ${watcher} has filed it under things that do not need proving.`,
      `Buying in is a sentence with only one meaning, and ${who} said it out loud with money. ${watcher} heard it.`,
      `"${who} wanted it enough to pay." ${watcher} keeps the observation short, because it does not need help.`,
      `${buyers.length} people bought in and every one of them told the house the same thing about how safe they feel. ${who} was the loudest about it.`,
    ], ctx, who, watcher);
    api.suspicion(watcher, who, 1.2);
    try { api.remember(watcher, who, 'paid-for-power', 1, { twist: 'bb-coin-of-destiny' }); } catch { /* texture */ }
    return { text, players: [who, watcher], badgeText: 'PAID IN PUBLIC', badgeClass: 'gold' };
  },
};

// ── and not paying is one too ─────────────────────────────────────────
const keptTheirMoney = {
  id: 'coin-kept-their-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _abstainerCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _abstainerCast(house, ctx);
    if (!cast) return null;
    const { who, reader } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} did not buy in. ${reader} finds that more interesting than any of the people who did — you only decline a swing at the whole week if you already believe the week cannot touch you.`,
      `Everybody who paid told the house they were worried. ${who} told it the opposite, by keeping ${p.posAdj} hands in ${p.posAdj} pockets, and ${reader} noticed that too.`,
      `"You didn't want it?" ${reader} asks it lightly. ${who} gives an answer that is a shrug with words attached, and ${reader} keeps the question.`,
      `${who} watched the whole thing from the sofa and paid nothing. That is either the calmest read in the house or the most comfortable, and ${reader} intends to find out which.`,
    ], ctx, who, reader);
    api.suspicion(reader, who, 0.9);
    return { text, players: [who, reader], badgeText: 'KEPT OUT OF IT', badgeClass: 'grey' };
  },
};

// ── seated by an anonymous hand ───────────────────────────────────────
const seatedByNobody = {
  id: 'coin-seated-by-nobody',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _seatedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _seatedCast(house, ctx);
    if (!cast) return null;
    const { who, buyers } = cast;
    const p = pronouns(who);
    const suspect = buyers[0];
    const text = _variant([
      `${who} is on the block and the Head of Household did not put ${p.obj} there. The person who did is in this room, paid to be able to, and is not going to say so.`,
      `${who} works the room and gets nowhere, because there is nobody to work: the hand that wrote ${p.posAdj} name down is anonymous and the only clue is a list of people who bought in.`,
      `${who} settles on ${suspect}, for no better reason than that ${suspect} paid. It is not evidence. It is the only thing available.`,
      `Being nominated by nobody is a strange kind of insult, and ${who} spends the evening trying to work out who to take it from.`,
    ], ctx, who, suspect);
    api.suspicion(who, suspect, 1.3);
    api.addBond(who, suspect, -0.8);
    api.popDelta(who, 1);
    return { text, players: [who, suspect], badgeText: 'NOMINATED BY NOBODY', badgeClass: 'red' };
  },
};

// ── the person who called it, being ordinary ──────────────────────────
const calledItQuietly = {
  id: 'coin-called-it-quietly',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _winnerCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _winnerCast(house, ctx);
    if (!cast) return null;
    const { c, w, watcher } = cast;
    const st = pStats(w);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(w);
    const text = overplayed ? _variant([
      `${w} has opinions about the new nominations that are a shade too complete for somebody who found out when everybody else did. ${watcher} listens to all of them.`,
      `${w} keeps saying "whoever did it" with a warmth nobody else is managing. ${watcher} notices the warmth before the words.`,
      `${watcher} invents a detail about how the call was made and watches ${w} agree with something that did not happen.`,
    ], ctx, w, watcher) : _variant([
      `${w} won the game in front of everybody and then said nothing at all about the rest of the night, which is exactly what the other ${(c.buyers || []).length - 1 || 'few'} would have done.`,
      `Somebody asks ${w} how the call went. "They don't tell you anything in there." It is a good answer and it is even mostly true.`,
      `${w} is as blank about the coin as everybody who did not touch it, and ${p.sub} ${p.sub === 'they' ? 'stay' : 'stays'} blank for the rest of the week.`,
    ], ctx, w, watcher);
    if (overplayed) {
      api.suspicion(watcher, w, 1.5);
      try { api.remember(watcher, w, 'suspected-the-coin', 1, { twist: 'bb-coin-of-destiny' }); } catch { /* texture */ }
    }
    return { text, players: [w, watcher],
      badgeText: overplayed ? 'KNOWS TOO MUCH ABOUT IT' : 'AS BLANK AS ANYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const COIN_EVENTS = [
  dethronedByNobody, paidInPublic, keptTheirMoney, seatedByNobody, calledItQuietly,
];

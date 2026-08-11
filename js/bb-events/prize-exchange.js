// ══════════════════════════════════════════════════════════════════════
// bb-events/prize-exchange.js — what a trade is remembered as
// ══════════════════════════════════════════════════════════════════════
//
// The exchange produces the most legible act in this game — everybody watched
// every trade, nothing was hidden, and the ledger is public — and until now
// all of it died inside the act. Nobody in the house ever mentioned it again.
//
// What makes this family different from the rest of the folder is that there
// is nothing to suspect. Every other twist here runs on incomplete information;
// this one runs on total information and a decision everybody saw you make. So
// the beats are not hunts, they are verdicts:
//
//   the sell-out     somebody chose money over the only thing that could have
//                    saved them, in public, and a jury will hear about it
//   the robbery      taking the veto off a nominee is not a trade, it is a
//                    declaration — and the person it was taken from has to
//                    campaign for their life afterwards
//   the mercy        somebody could have taken it and did not. That is either
//                    loyalty or cowardice and the house cannot tell which
//   the costume      two people spend the week in something ridiculous, and it
//                    costs them every conversation
//
// The act carries `steals` with `kind` and `gave`, so which of these fired is
// a fact about the week rather than a guess.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, closestTo } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/**
 * The exchange this week, or last — the fallout of a public trade outlives the
 * night it happened, and the campaign that follows it is where it gets used.
 */
function _exchange(ctx) {
  const live = ctx?.week?.prizeExchange;
  if (live) return live;
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num <= now && now - w.num <= 1 && w.prizeExchange) return w.prizeExchange;
  }
  return null;
}

/** Somebody who was on the block and walked away holding a prize instead. */
const _soldOutCast = (house, ctx) => {
  const ex = _exchange(ctx);
  if (!ex) return null;
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || [];
  const who = (ex.held || []).find(h => h.kind === 'prize' && noms.includes(h.name)
    && house.includes(h.name));
  if (!who) return null;
  const judge = _others(house, who.name)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return judge ? { ex, who: who.name, item: who.item, judge } : null;
};
/** The veto taken off somebody who was sitting on the block. */
const _robbedCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const steal = (ex?.steals || []).find(s => s.kind === 'veto');
  if (!steal || !house.includes(steal.victim) || !house.includes(steal.thief)) return null;
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || [];
  return { ex, victim: steal.victim, thief: steal.thief,
    onBlock: noms.includes(steal.victim), gave: steal.gave };
};
/** Somebody who traded the veto AWAY for a prize. */
const _gaveItAwayCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const steal = (ex?.steals || []).find(s => s.gaveKind === 'veto');
  if (!steal || !house.includes(steal.thief)) return null;
  const watcher = _others(house, steal.thief)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { ex, who: steal.thief, took: steal.item, watcher } : null;
};
/** Who is wearing what, out of the boxes. */
const _costumeCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const worn = (ex?.punished || []).filter(p => house.includes(p.name));
  if (!worn.length) return null;
  const who = worn[0];
  const other = _others(house, who.name)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return other ? { ex, who: who.name, item: who.punishment, other, all: worn } : null;
};

// ── the money, in front of a jury ─────────────────────────────────────
const choseTheMoney = {
  id: 'exchange-chose-the-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _soldOutCast(house, ctx) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const cast = _soldOutCast(house, ctx);
    if (!cast) return null;
    const { who, item, judge } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} is on the block holding ${item}. Everybody in this house watched ${p.obj} choose it, `
        + `and ${judge} has already worked out how that sentence sounds at a jury vote.`,
      `"${item}." ${judge} says it flatly, twice, at two different people, and does not add anything to it. `
        + 'It does not need anything added to it.',
      `${who} explains the choice to anybody who will listen, and the explanation gets longer every time, `
        + `which ${judge} finds more revealing than the choice did.`,
      `There was one thing on that table that could have saved ${who} and ${p.sub} came away with ${item}. `
        + `${judge} will still be able to describe this moment in nine weeks.`,
    ], ctx, who, judge);
    api.popDelta(who, -1);
    api.suspicion(judge, who, 0.8);
    try { api.remember(judge, who, 'chose-a-prize-over-the-veto', 2, { twist: 'bb-prizes-and-punishments', item }); } catch { /* texture */ }
    return { text, players: [who, judge], badgeText: 'A JURY WILL HEAR THIS', badgeClass: 'red' };
  },
};

// ── taking a lifeline is a declaration ────────────────────────────────
const theRobbery = {
  id: 'exchange-the-robbery',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const cast = _robbedCast(house, ctx);
    return cast && cast.onBlock ? band(13, 16) : 0;
  },
  fire(house, ctx, api) {
    const cast = _robbedCast(house, ctx);
    if (!cast) return null;
    const { victim, thief, gave } = cast;
    const p = pronouns(victim);
    const text = _variant([
      `${thief} took the veto out of ${victim}'s hands while ${victim} was sitting on the block, and handed `
        + `over ${gave} for it. There is no reading of that ${victim} has to pretend not to have.`,
      `${victim} had the only thing on that table that mattered for about ninety seconds. ${thief} has it now, `
        + `and ${victim} has ${gave} and a campaign to run.`,
      `"You knew where I was sitting." ${victim} says it once, quietly, and ${thief} does not have an answer `
        + 'that survives being said out loud.',
      `Everybody watched it happen, which is the part ${thief} did not think about: this was not a trade, `
        + `it was a public decision about whether ${victim} stays in this house.`,
    ], ctx, victim, thief);
    api.addBond(victim, thief, -2.2);
    api.suspicion(victim, thief, 1.8);
    api.popDelta(victim, 1.5);
    try { api.setTarget(victim, thief, 'took the veto off me on the block'); } catch { /* texture */ }
    try { api.remember(victim, thief, 'robbed-me-of-the-veto', 3, { twist: 'bb-prizes-and-punishments' }); } catch { /* texture */ }
    return { text, players: [victim, thief], badgeText: 'NOT A TRADE', badgeClass: 'red' };
  },
};

// ── letting it go ─────────────────────────────────────────────────────
const gaveItAway = {
  id: 'exchange-gave-it-away',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _gaveItAwayCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _gaveItAwayCast(house, ctx);
    if (!cast) return null;
    const { who, took, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} had the Power of Veto and swapped it for ${took}. ${watcher} cannot decide whether that is `
        + `somebody who is not playing or somebody who wanted the house to think so.`,
      `Handing the veto away is either the most relaxed thing anybody has done all season or the most `
        + `calculated, and ${watcher} has been turning it over since it happened.`,
      `"${p.Sub} gave it away." ${watcher} keeps saying it like the sentence has more in it than it does. `
        + `It might.`,
      `${who} looks perfectly happy with ${took}, which is exactly what ${watcher} would do in ${p.posAdj} position `
        + 'if it had been deliberate.',
    ], ctx, who, watcher);
    api.suspicion(watcher, who, 0.9);
    return { text, players: [who, watcher], badgeText: 'LET IT GO', badgeClass: 'blue' };
  },
};

// ── and the ones in the costumes ──────────────────────────────────────
const outOfTheBoxes = {
  id: 'exchange-out-of-the-boxes',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _costumeCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _costumeCast(house, ctx);
    if (!cast) return null;
    const { who, item, other, all } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} opened a box at a competition and is in ${item} because of it. ${other} keeps pointing out `
        + `that ${p.sub} did not have to open that one, which is not true and is not the point.`,
      `${all.length > 1 ? `${all.map(x => x.name).join(' and ')} are` : `${who} is`} paying for a competition `
        + `that was over on Wednesday, and will still be paying on Thursday when it matters.`,
      `The costume was luck. What it costs ${who} for the rest of the week is not: nobody negotiates with `
        + `${item}, and ${other} has noticed how much easier that makes this week.`,
      `${who} unwrapped ${item} in front of everybody and has to live in it. ${other} finds it funny for `
        + 'about a day and useful for the rest of them.',
    ], ctx, who, other);
    api.popDelta(who, 1);
    api.suspicion(other, who, -0.3);
    // The trailing slot is "somebody else still serving it" and was taken
    // straight off the list, so when that happened to be `other` the card
    // showed the same face twice.
    const alsoWearing = all.slice(1, 3).map(x => x.name).filter(n => n !== who && n !== other);
    return { text, players: [who, other, alsoWearing[0]].filter(Boolean),
      badgeText: 'STILL WEARING IT', badgeClass: 'red' };
  },
};

export const PRIZE_EXCHANGE_EVENTS = [choseTheMoney, theRobbery, gaveItAway, outOfTheBoxes];

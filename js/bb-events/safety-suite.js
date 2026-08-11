// ══════════════════════════════════════════════════════════════════════
// bb-events/safety-suite.js — you only get one, and everybody is counting
// ══════════════════════════════════════════════════════════════════════
//
// The Safety Suite is the only twist in this catalogue whose material is
// ARITHMETIC. Nothing is hidden and nothing is anonymous; the whole house can
// see exactly who swiped and exactly who has an entry left, and by the third
// week that list is the most useful document in the building.
//
// Which gives this family four things nothing else here has:
//
//   · spending it early is a public confession that you cannot survive a
//     normal week, and the house files that
//   · holding it is a bet, and a nominee holding an unspent pass is somebody
//     whose read on the week was wrong in front of everybody
//   · running out is permanent — from then on every week is played with no
//     net, and everybody knows it
//   · the Plus One is a gift with a bill attached: safe, and punished for it,
//     with one person's name on both halves
//
// Nothing here needs protecting. Every fact in this twist is public, which is
// exactly why the pressure lands where it does.
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

const _suite = ctx => ctx?.week?.safetySuite || null;
const _spent = house => (gs?.bb?.safetySuiteUsed || []).filter(n => house.includes(n));

const _plusOneCast = (house, ctx) => {
  const s = _suite(ctx);
  if (!s?.plusOne || !house.includes(s.plusOne) || !house.includes(s.winner)) return null;
  const watcher = _others(house, s.plusOne, s.winner)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { s, who: s.plusOne, giver: s.winner, watcher } : null;
};
const _wastedCast = (house, ctx) => {
  const s = _suite(ctx);
  if (!s) return null;
  const wasted = (s.entrants || []).filter(n => n !== s.winner && house.includes(n));
  if (!wasted.length) return null;
  const who = wasted[0];
  const watcher = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { s, who, watcher } : null;
};
const _heldWrongCast = (house, ctx) => {
  const s = _suite(ctx);
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || ctx?.nominees || [];
  if (!s) return null;
  // Somebody who kept the pass and is on the block anyway, which is the bet
  // losing in the most public way available.
  const who = (s.held || []).find(n => house.includes(n) && noms.includes(n));
  if (!who) return null;
  const watcher = _others(house, who).sort((a, b) => pStats(b).social - pStats(a).social)[0];
  return { s, who, watcher };
};
const _exhaustedCast = (house, ctx) => {
  const s = _suite(ctx);
  const spent = _spent(house);
  const left = house.filter(n => !spent.includes(n));
  if (!s || spent.length < 2 || !left.length) return null;
  const counter = [...house].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const bare = spent.find(n => n !== counter) || spent[0];
  return counter ? { s, counter, bare, spent, left } : null;
};
const _timingCast = (house, ctx) => {
  const s = _suite(ctx);
  const spent = _spent(house);
  const holders = house.filter(n => !spent.includes(n) && n !== (ctx?.week?.hoh));
  if (!s || holders.length < 2) return null;
  const who = [...holders].sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
  const pressed = closestTo(who, _others(holders, who)) || _others(holders, who)[0];
  return pressed ? { s, who, pressed } : null;
};

// ── safe, and paying for it ───────────────────────────────────────────
const thePlusOne = {
  id: 'suite-plus-one',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _plusOneCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _plusOneCast(house, ctx);
    if (!cast) return null;
    const { s, who, giver, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} is safe this week and paying for it in ${s.punishmentLabel || 'public'}, which is a strange thing to have to thank somebody for. `
        + `${p.Sub} ${p.sub === 'they' ? 'thank' : 'thanks'} ${giver} anyway, twice, in front of people.`,
      `${giver} had exactly one of those to give and gave it to ${who}. ${watcher} did not need any more than that to know where those two stand.`,
      `"You could have just not picked me." "You'd be on the block." ${who} does not have an answer to that and resents having to not have one.`,
      `A gift with a bill attached: ${who} cannot be nominated and cannot stop being reminded why. ${watcher} has written the pair of them down as a pair.`,
    ], ctx, who, giver);
    api.addBond(who, giver, 1.4);
    api.suspicion(watcher, giver, 1.2);
    try { api.remember(watcher, giver, 'named-a-plus-one', 1, { twist: 'bb-safety-suite', plusOne: who }); } catch { /* texture */ }
    return { text, players: [who, giver, watcher], badgeText: 'SAFE, AND PAYING FOR IT', badgeClass: 'gold' };
  },
};

// ── spent it for nothing ──────────────────────────────────────────────
const spentForNothing = {
  id: 'suite-spent-for-nothing',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _wastedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _wastedCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} has nothing left. The one entry ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} ever going to get went on a week `
        + `${p.sub} lost, and every week after this one gets played without a net.`,
      `${watcher} watched ${who} spend it and lose, and has been thinking about that ever since — not unkindly. `
        + 'It is simply a name that can no longer buy its way off the block.',
      `"At least I tried." ${who} says it a few times. ${watcher} agrees warmly and moves ${who} up a list.`,
      `The entry is gone and the safety never arrived, which is the worst outcome the suite has, and ${who} `
        + `has been carrying it around all week like ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} not.`,
    ], ctx, who, watcher);
    api.popDelta(who, -0.5);
    try { api.setTarget(watcher, who, 'no entry left and no protection'); } catch { /* texture */ }
    return { text, players: [who, watcher], badgeText: 'NOTHING LEFT TO SPEND', badgeClass: 'red' };
  },
};

// ── the bet, lost in public ───────────────────────────────────────────
const heldItAndLost = {
  id: 'suite-held-it-and-lost',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _heldWrongCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _heldWrongCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} kept the pass, because this was not going to be the week. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} on the block `
        + 'with it still in hand, which is a bet lost in front of the entire house.',
      `The pass is worth nothing on the block and ${who} still has one, which is the single most expensive `
        + `read ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} made all season.`,
      `"I didn't think it was me." Everybody nods. ${watcher || 'The room'} does not point out that this is what the suite is FOR.`,
      `${who} sat out an hour that was designed for exactly this situation, and is now campaigning through it.`,
    ], ctx, who, watcher);
    api.popDelta(who, 1);
    if (watcher) api.suspicion(watcher, who, 0.6);
    return { text, players: [who, watcher].filter(Boolean),
      badgeText: 'THE BET, LOST IN PUBLIC', badgeClass: 'red' };
  },
};

// ── the count everybody is keeping ────────────────────────────────────
const countingTheEntries = {
  id: 'suite-counting-entries',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _exhaustedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _exhaustedCast(house, ctx);
    if (!cast) return null;
    const { counter, bare, spent, left } = cast;
    const text = _variant([
      `${counter} keeps the count in ${pronouns(counter).posAdj} head and it is the most useful thing anybody in this house owns: `
        + `${spent.length} people have nothing left, ${left.length} still do, and the first list is where next week's nominations come from.`,
      `Nobody is hiding anything here — that is what makes it dangerous. ${counter} can name every houseguest who can no longer buy safety, `
        + `starting with ${bare}.`,
      `"Who's still got one?" It gets asked at the table like a card count, and ${counter} answers before anybody else can.`,
      `${bare} is out of entries and there is no version of the rest of this season where that stops being true. ${counter} has built a plan on it.`,
    ], ctx, counter, bare);
    api.suspicion(counter, bare, 1.1);
    try { api.setTarget(counter, bare, 'no safety left to buy'); } catch { /* texture */ }
    return { text, players: [counter, bare], badgeText: 'THE COUNT', badgeClass: 'blue' };
  },
};

// ── when to spend it ──────────────────────────────────────────────────
const whenToSpendIt = {
  id: 'suite-when-to-spend',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _timingCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _timingCast(house, ctx);
    if (!cast) return null;
    const { who, pressed } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} and ${pressed} spend an hour on the only question the suite actually asks: not whether to use it, but when. `
        + `Neither of them says a number out loud and both of them are holding one.`,
      `"If we both go in, one of us wastes it." ${pressed} is right, and ${who} now knows ${pressed} has been thinking about it as a pair.`,
      `${who} tries to talk ${pressed} into going first, warmly, for ${pressed}'s own sake. ${pressed} notices the warmth arriving before the argument.`,
      `The entry is worth more every week ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not spend it and worth nothing at all the week `
        + `${p.sub} ${p.sub === 'they' ? 'are' : 'is'} evicted holding it. ${who} says that sentence to ${pressed} like it is a plan.`,
    ], ctx, who, pressed);
    api.addBond(who, pressed, 0.5);
    api.suspicion(pressed, who, 0.5);
    return { text, players: [who, pressed], badgeText: 'NOT WHETHER — WHEN', badgeClass: 'blue' };
  },
};

export const SAFETY_SUITE_EVENTS = [
  thePlusOne, spentForNothing, heldItAndLost, countingTheEntries, whenToSpendIt,
];

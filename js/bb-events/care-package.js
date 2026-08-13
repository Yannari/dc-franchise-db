// ══════════════════════════════════════════════════════════════════════
// bb-events/care-package.js — a public gift is a public verdict
// ══════════════════════════════════════════════════════════════════════
//
// Every other twist family in this folder is about not knowing. The Hacker,
// Roadkill, the Coin, America's Nominee — a hand moves, the house hunts, and
// the material is the hunting.
//
// This family has no hunt in it at all, and that is the whole reason it exists
// alongside them. The audience's choice is announced, the box is handed over
// on camera, and the only new information in the room is a ranking: the
// country has now told this house, out loud, who its favourite is. Everybody
// else is standing there having been told they are not.
//
// So the beats point in the opposite direction from the secret twists. Instead
// of "who did this to me" they run on "why not me", which is a grievance with
// nobody to aim at and therefore ends up aimed at the person holding the box.
//
// Rules: everything here is nameable — there is nothing to protect. The only
// hidden fact in the family is who took the bribe, and that one stays hidden.
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

const _cp = ctx => ctx?.week?.carePackage || null;

/**
 * The package as it stood at the eviction.
 *
 * Super Safety and the Co-HOH key are facts from the moment the box is handed
 * over, so those beats read the live week. The vote block and the bribe do not
 * EXIST until the ballots are in — they fire after the last campaign act — so
 * their reactions belong to the following week's house life, the way the
 * Halting Hex's do.
 */
function _spentCp(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (!w || w.num > now || now - w.num > 1) continue;
    const c = w.carePackage;
    if (c && (c.blocked?.length || c.bribe)) return c;
  }
  // The live week too, for a re-run that reaches house life after the vote.
  const live = _cp(ctx);
  return (live && (live.blocked?.length || live.bribe)) ? live : null;
}

const _favouriteCast = (house, ctx) => {
  const c = _cp(ctx);
  if (!c || !house.includes(c.recipient)) return null;
  // Whoever takes a public ranking worst: the person who has been playing for
  // the cameras hardest and still did not get called.
  const stung = _others(house, c.recipient)
    .sort((a, b) => (pStats(b).social + pStats(b).boldness - pStats(b).temperament)
      - (pStats(a).social + pStats(a).boldness - pStats(a).temperament))[0];
  return stung ? { c, who: c.recipient, stung } : null;
};
const _passedOverCast = (house, ctx) => {
  const c = _cp(ctx);
  const had = new Set((gs?.bb?.carePackages || []).map(d => d.recipient));
  const never = house.filter(n => !had.has(n));
  // Only interesting once the house has watched a few of these land.
  if (!c || (gs?.bb?.carePackages || []).length < 2 || never.length < 2) return null;
  const who = [...never].sort((a, b) => pStats(b).social - pStats(a).social)[0];
  const friend = closestTo(who, _others(house, who));
  return who ? { c, who, friend } : null;
};
const _costumeCast = (house, ctx) => {
  const c = _cp(ctx);
  if (c?.effect !== 'super-safety' || !house.includes(c.recipient)) return null;
  const watcher = _others(house, c.recipient)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return watcher ? { c, who: c.recipient, watcher } : null;
};
const _coHohCast = (house, ctx) => {
  const c = _cp(ctx);
  const hoh = ctx?.week?.hohSecret ? null : (ctx?.week?.hoh || ctx?.hoh);
  if (c?.effect !== 'co-hoh' || !hoh || c.recipient === hoh
    || !house.includes(hoh) || !house.includes(c.recipient)) return null;
  return { c, hoh, co: c.recipient };
};
const _silencedCast = (house, ctx) => {
  const c = _spentCp(ctx);
  const blocked = (c?.blocked || []).filter(n => house.includes(n));
  if (c?.effect !== 'vote-block' || !blocked.length || !house.includes(c.recipient)) return null;
  return { c, who: blocked[0], all: blocked };
};
const _moneyCast = (house, ctx) => {
  const c = _spentCp(ctx);
  if (c?.effect !== 'bribe' || !c.bribe || !house.includes(c.recipient)) return null;
  // The house knows the money exists. Somebody with a nose is going to try to
  // work out where it went, and will be wrong as often as not.
  const hunter = _others(house, c.recipient, c.bribe.mark)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return hunter ? { c, hunter } : null;
};

// ── the country has a favourite, and it is not you ────────────────────
const countryHasAFavourite = {
  id: 'care-country-favourite',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _favouriteCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _favouriteCast(house, ctx);
    if (!cast) return null;
    const { c, who, stung } = cast;
    const p = pronouns(stung);
    const weekNum = Math.max(1, Number(ctx?.week?.num) || 1);
    const elapsed = `${weekNum} ${weekNum === 1 ? 'week' : 'weeks'}`;
    const text = _variant([
      `${stung} has spent ${elapsed} making sure every room notices ${p.obj}, and the box went to ${who}. `
        + `There is nobody to be angry at about that, which is why ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} angry at ${who}.`,
      `The house has just been handed a ranking it did not ask for. ${who} is at the top of it and ${stung} `
        + `is not, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} no way of appealing to a room ${p.sub} cannot enter.`,
      `"They don't see what I do in here." ${stung} says it about ${who}'s package, and means it, and it does not help.`,
      `${who} was chosen by the audience for something nobody in the house could earn. ${stung} keeps circling that point without saying the part that actually hurts: the audience chose somebody else.`,
    ], ctx, who, stung);
    api.suspicion(stung, who, 0.9);
    api.addBond(stung, who, -1);
    api.popDelta(who, 1.5);
    return { text, players: [who, stung], badgeText: 'A RANKING NOBODY ASKED FOR', badgeClass: 'gold' };
  },
};

// ── never once called ─────────────────────────────────────────────────
const passedOverAgain = {
  id: 'care-passed-over',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _passedOverCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _passedOverCast(house, ctx);
    if (!cast) return null;
    const { who, friend } = cast;
    const p = pronouns(who);
    const count = (gs?.bb?.carePackages || []).length;
    const text = _variant([
      `${count} packages have gone out and ${who} has not been named on one of them. `
        + `${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} started wondering, out loud to ${friend || 'nobody in particular'}, whether ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} even on the show.`,
      `${who} works out that ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been eligible every single week and chosen none of them, and that this is a fact about ${p.posAdj} edit rather than ${p.posAdj} game.`,
      `"Maybe that's good," ${who} tells ${friend || 'the mirror'}. "Nobody out there is watching me either." It is half a comfort and ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not believe the other half.`,
      `Being invisible to the audience keeps ${who} off every target list in the building, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} decided to start calling that strategy.`,
    ], ctx, who, friend);
    api.popDelta(who, -0.5);
    if (friend) api.addBond(who, friend, 0.4);
    return { text, players: [who, friend].filter(Boolean),
      badgeText: 'NEVER ONCE CALLED', badgeClass: 'grey' };
  },
};

// ── safe, and dressed like it ─────────────────────────────────────────
const theCostume = {
  id: 'care-the-costume',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _costumeCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _costumeCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} has to wear the thing all week, so there is no hour of any day when the rest of the house `
        + `is not being reminded that ${p.sub} ${p.sub === 'they' ? 'cannot' : 'cannot'} be touched and they can.`,
      `${who} makes a joke of the costume at breakfast. ${watcher} laughs and does the sum underneath it: one fewer name available, all week, for nothing anybody in here decided.`,
      `The safest houseguest in the game is dressed as a cartoon, and ${watcher} finds that harder to be around than the safety itself.`,
      `"You look ridiculous." "I look ridiculous and safe." ${who} has said it four times today and it has worked less each time on ${watcher}.`,
    ], ctx, who, watcher);
    api.suspicion(watcher, who, 0.8);
    api.popDelta(who, 1);
    try { api.setTarget(watcher, who, 'untouchable all week and visible about it'); } catch { /* texture */ }
    return { text, players: [who, watcher], badgeText: 'SAFE, AND DRESSED LIKE IT', badgeClass: 'gold' };
  },
};

// ── half a week, given away ───────────────────────────────────────────
const theAppointedCoHoh = {
  id: 'care-appointed-co-hoh',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _coHohCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _coHohCast(house, ctx);
    if (!cast) return null;
    const { hoh, co } = cast;
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} won a competition for this week and is now sharing it with ${co}, who won a popularity vote. `
        + `${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been very gracious about it in every room with a camera in it.`,
      `Half of ${hoh}'s block belongs to somebody else now. The half ${p.sub} had the plan for.`,
      `"We're a team this week." ${hoh} says it to ${co} and the word lands somewhere between an agreement and a complaint.`,
      `${co} is safe, holds a key, and did nothing in this house to earn either. ${hoh} keeps finding new ways to mention that ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not mind.`,
    ], ctx, hoh, co);
    api.suspicion(hoh, co, 1.1);
    api.addBond(hoh, co, -0.9);
    api.popDelta(co, 1);
    return { text, players: [hoh, co], badgeText: 'HALF A WEEK, GIVEN AWAY', badgeClass: 'red' };
  },
};

// ── struck by name ────────────────────────────────────────────────────
const silencedInPublic = {
  id: 'care-silenced-in-public',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _silencedCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _silencedCast(house, ctx);
    if (!cast) return null;
    const { c, who, all } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} was not allowed to vote at the eviction and does not have to wonder why. ${c.recipient} said ${p.posAdj} name in front of everybody, `
        + `which removes the one comfort a silenced houseguest usually gets: not knowing.`,
      `${all.join(' and ')} sat through the eviction without a vote between them, watching ${c.recipient} avoid looking over.`,
      `"You could have picked anybody." ${who} says it to ${c.recipient} directly, because for once there is somebody to say it to.`,
      `There was no mystery to solve afterwards. ${who} left the eviction with a name, witnesses and no way to get the vote back.`,
    ], ctx, who, c.recipient);
    for (const name of all) {
      api.suspicion(name, c.recipient, 1.6);
      api.addBond(name, c.recipient, -1.2);
      try { api.setTarget(name, c.recipient, 'took my vote in front of everybody'); } catch { /* texture */ }
    }
    return { text, players: [...all, c.recipient],
      badgeText: 'STRUCK BY NAME', badgeClass: 'red' };
  },
};

// ── five thousand dollars, somewhere in this building ─────────────────
const publicMoney = {
  id: 'care-public-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _moneyCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _moneyCast(house, ctx);
    if (!cast) return null;
    const { c, hunter } = cast;
    // The hunter is guessing. Being right is possible and never confirmed.
    const guess = furthestFrom(hunter, _others(house, hunter, c.recipient))
      || _others(house, hunter, c.recipient)[0];
    const right = guess === c.bribe.mark && c.bribe.taken;
    const text = _variant([
      `Everybody watched five thousand dollars arrive in this house and nobody has seen where it went. `
        + `${hunter} has decided it went to ${guess}, on the evidence of a mood ${guess} was in on Tuesday.`,
      `${hunter} spends the evening pricing people. "What would you take? Honestly. What's the number?" `
        + 'Nobody gives a real answer and every non-answer goes in the file.',
      `The money is public and the spending is not, so ever since the eviction the house has been unable to tell `
        + `an ordinary vote from a bought one. ${hunter} thinks ${guess}'s was bought.`,
      `"It's not about the money, it's about who takes it." ${hunter} is right about that and wrong, probably, about ${guess}.`,
    ], ctx, hunter, guess);
    api.suspicion(hunter, guess, 1.2);
    if (!right) api.addBond(hunter, guess, -0.6);
    return { text, players: [hunter, guess, c.recipient].filter(Boolean),
      badgeText: right ? 'THE RIGHT NAME, UNPROVABLE' : 'PRICING THE ROOM',
      badgeClass: right ? 'gold' : 'blue' };
  },
};

export const CARE_PACKAGE_EVENTS = [
  countryHasAFavourite, passedOverAgain, theCostume, theAppointedCoHoh,
  silencedInPublic, publicMoney,
];

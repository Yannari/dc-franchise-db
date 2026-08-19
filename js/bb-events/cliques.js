// ══════════════════════════════════════════════════════════════════════
// bb-events/cliques.js — being safe because of people you did not pick
// ══════════════════════════════════════════════════════════════════════
//
// The sorting act happens once, on night one, and the immunity happens in
// silence at every ceremony after it — a name quietly missing from a block
// nobody watching would know to look for. Without this family the twist would
// be invisible for the whole middle of a season: four people safe every week
// and not one conversation about it.
//
// THE STANDING LAW: they could take it well or less well, really depends.
// Being covered by three strangers is a gift or a humiliation, and which one
// it is depends on the person, not on the week.
//
// The state this family is really about is the CRACK — somebody safe because
// of a clique they cannot stand, which is the one thing an assigned group can
// produce that a chosen one never can.
import { pronouns } from '../players.js';
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { teamOf, teammates, teamsDissolved, allTeams } from '../bb/teams.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';
const _hoh = ctx => (ctx?.week?.hohSecret ? null : ctx?.week?.hoh) || null;

/** The people safe this week purely because a clique-mate is in charge. */
function _covered(ctx, house) {
  if (teamsDissolved() || !allTeams().length) return null;
  const hoh = _hoh(ctx);
  if (!hoh) return null;
  const mates = teammates(hoh).filter(n => house.includes(n));
  return mates.length ? { hoh, mates } : null;
}

// ── safe, and not by anything you did ─────────────────────────────────
const coveredThisWeek = {
  id: 'cliques-covered',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    if (firedThisWeek('cliques-covered', Number(ctx?.week?.num) || 0)) return 0;
    return _covered(ctx, house) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const c = _covered(ctx, house);
    if (!c) return null;
    // WHICH clique-mate fronts the scene is salted; how they take it is their
    // own bond with the Head of Household. Always casting the coldest mate
    // guaranteed the resentful branch every single week — the same trap the
    // Wildcard's serving scene fell into, caught the same way, by a test that
    // asked whether both directions were reachable.
    let hh = 0;
    const salt = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${c.hoh}`;
    for (let i = 0; i < salt.length; i++) hh = (hh * 31 + salt.charCodeAt(i)) >>> 0;
    const who = c.mates[hh % c.mates.length];
    const p = pronouns(who);
    const cold = perceived(who, c.hoh) < 1;
    if (cold) {
      const text = _variant([
        `${who} is safe this week and has not spoken to ${c.hoh} since Sunday. "I didn't ask for that. I don't want to owe it." ${p.Sub} owes it anyway, and the whole house can see the arithmetic.`,
        `${who} spends the week being protected by somebody ${p.sub} would nominate in a heartbeat, and the indignity of that is doing more damage than a week on the block would have.`,
        `"We're not a group. We're a HEADING." ${who} says it once, too loudly, in a kitchen that had not asked — and everybody understands ${p.sub} is safe and furious about the reason.`,
      ], ctx, who);
      api.popDelta(who, -0.5);
      api.remember(who, c.hoh, 'covered-me-without-asking', 1, { twist: 'bb-cliques' });
      return { text, players: [who, c.hoh], badgeText: 'SAFE, AND HATING IT', badgeClass: 'grey' };
    }
    const text = _variant([
      `${who} did nothing this week and cannot be touched, and has decided to be extremely relaxed about that in front of people who can be.`,
      `${who} makes ${c.hoh} breakfast without being asked. It is not strategy — ${p.sub} genuinely got handed a free week by somebody ${p.sub} likes, and that is a rare thing in here.`,
      `The clique eats together on Thursday because they can. ${who} points out, cheerfully, that not one of them earned it, and somebody at the next table hears ${p.obj}.`,
    ], ctx, who);
    api.addBond(who, c.hoh, 0.6);
    return { text, players: [who, c.hoh], badgeText: 'COVERED', badgeClass: 'gold' };
  },
};

// ── the house looks at the heading ────────────────────────────────────
const theHeadingHolds = {
  id: 'cliques-heading-holds',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    if (firedThisWeek('cliques-heading-holds', Number(ctx?.week?.num) || 0)) return 0;
    const c = _covered(ctx, house);
    // Only worth a scene when there is somebody OUTSIDE it to resent it.
    return c && _others(house, c.hoh, ...c.mates).length >= 2 ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const c = _covered(ctx, house);
    if (!c) return null;
    const outsider = _others(house, c.hoh, ...c.mates)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!outsider) return null;
    const clique = teamOf(c.hoh);
    const patient = pStats(outsider).temperament >= 5.5;
    if (patient) {
      const text = _variant([
        `${outsider} works out the only thing worth working out this week: the block was decided by a list, and the list is the same every time. "So I don't beat ${c.hoh}. I beat the rota." Then ${pronouns(outsider).sub} starts counting whose turn is coming.`,
        `${outsider} stops being annoyed about ${clique?.name || 'the clique'} around Tuesday and starts being useful about it, which is the more dangerous of the two.`,
        `${outsider} says nothing about the immunity all week and privately writes down which weeks are survivable and which are not. It is the first real plan anybody in this house has had.`,
      ], ctx, outsider);
      api.remember(outsider, c.hoh, 'counted-the-rota', 1, { twist: 'bb-cliques' });
      return { text, players: [outsider, c.hoh], badgeText: 'COUNTS THE ROTA', badgeClass: 'blue' };
    }
    const text = _variant([
      `${outsider} has done the maths at the table and does not care who hears it: "Four of them are safe and one of them won something. How is that a game?" Nobody answers, because there is not an answer.`,
      `${outsider} keeps saying ${clique?.name || 'that clique'} the way other people say a swear word, and by Thursday two other houseguests have picked up the habit.`,
      `"It's not personal, it's ADMINISTRATIVE." ${outsider} is not being funny. ${pronouns(outsider).Sub} has been on the wrong side of a heading for three weeks and it has stopped being survivable.`,
    ], ctx, outsider);
    api.addBond(outsider, c.hoh, -0.5);
    api.popDelta(outsider, 0.5);
    return { text, players: [outsider, c.hoh], badgeText: 'THE WRONG HEADING', badgeClass: 'red' };
  },
};

// ── on your own, for the first time ───────────────────────────────────
//
// The week after the cliques dissolve. Everybody who has been quietly covered
// all season finds out whether any of it turned into a friendship.
const onYourOwn = {
  id: 'cliques-on-your-own',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    if (firedThisWeek('cliques-on-your-own', Number(ctx?.week?.num) || 0)) return 0;
    if (!teamsDissolved() || !allTeams().length) return 0;
    return house.length >= 4 ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    // The person whose old clique-mates are still here is in the strangest
    // position: the people are unchanged and the reason to sit with them is
    // gone.
    const who = house.find(n => teammates(n).some(m => house.includes(m))) || house[0];
    const mate = teammates(who).find(m => house.includes(m));
    const p = pronouns(who);
    const st = pStats(who);
    const keeps = st.social >= 5.5;
    if (keeps && mate) {
      const text = _variant([
        `${who} and ${mate} sit together at breakfast out of pure habit, and halfway through it becomes obvious to both of them that habit is all it needs to be now. Nobody made them do this one.`,
        `The headings are gone and ${who} goes looking for ${mate} anyway, which is the first genuinely voluntary thing either of them has done together.`,
        `"We were only ever put together." ${mate} says it like a joke. ${who} says "yeah" and does not move, and that is the whole conversation and the whole alliance.`,
      ], ctx, who);
      api.addBond(who, mate, 1.4);
      return { text, players: [who, mate], badgeText: 'CHOSE IT THIS TIME', badgeClass: 'gold' };
    }
    const text = _variant([
      `${who} has been safe so often that being nominatable has come as genuine news, and ${p.sub} spends the day discovering ${p.sub} does not have anybody to take it to.`,
      `${who} goes to find the people who have been covering ${p.obj} all season and finds three houseguests who were never friends, only filed nearby.`,
      `Nobody is coming for ${who} yet. Nobody is coming FOR ${who} either, and by evening ${p.sub} has worked out which of those is the problem.`,
    ], ctx, who);
    api.popDelta(who, -0.5);
    return { text, players: [who, mate].filter(Boolean),
      badgeText: 'ONLY EVER A CATEGORY', badgeClass: 'red' };
  },
};

export const CLIQUES_EVENTS = [coveredThisWeek, theHeadingHolds, onYourOwn];

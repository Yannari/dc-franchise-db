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
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { teamOf, teammates, teamsDissolved, allTeams } from '../bb/teams.js';
import { makeScene } from '../bb/script/scene.js';

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
    const cold = perceived(who, c.hoh) < 1;
    if (cold) {
      const scene = makeScene('clique.covered', { a: who, b: c.hoh }, { ending: 'cold' }, [], 'kitchen');
      api.popDelta(who, -0.5);
      api.remember(who, c.hoh, 'covered-me-without-asking', 1, { twist: 'bb-cliques' });
      return { scene, players: [who, c.hoh], badgeText: 'SAFE, AND HATING IT', badgeClass: 'grey' };
    }
    const scene = makeScene('clique.covered', { a: who, b: c.hoh }, { ending: 'warm' }, [], 'kitchen');
    api.addBond(who, c.hoh, 0.6);
    return { scene, players: [who, c.hoh], badgeText: 'COVERED', badgeClass: 'gold' };
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
      const scene = makeScene('clique.heading', { a: outsider, b: c.hoh }, { ending: 'patient', clique: clique?.name || 'that group' }, [], 'living-room');
      api.remember(outsider, c.hoh, 'counted-the-rota', 1, { twist: 'bb-cliques' });
      return { scene, players: [outsider, c.hoh], badgeText: 'COUNTS THE ROTA', badgeClass: 'blue' };
    }
    const scene = makeScene('clique.heading', { a: outsider, b: c.hoh }, { ending: 'loud', clique: clique?.name || 'that group' }, [], 'kitchen');
    api.addBond(outsider, c.hoh, -0.5);
    api.popDelta(outsider, 0.5);
    return { scene, players: [outsider, c.hoh], badgeText: 'THE WRONG HEADING', badgeClass: 'red' };
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
    const st = pStats(who);
    const keeps = st.social >= 5.5;
    if (keeps && mate) {
      const scene = makeScene('clique.alone', { a: who, b: mate }, { ending: 'kept' }, [], 'kitchen');
      api.addBond(who, mate, 1.4);
      return { scene, players: [who, mate], badgeText: 'CHOSE IT THIS TIME', badgeClass: 'gold' };
    }
    const scene = makeScene('clique.alone', { a: who, b: mate || null }, { ending: 'alone' }, [], 'bedroom');
    api.popDelta(who, -0.5);
    return { scene, players: [who, mate].filter(Boolean),
      badgeText: 'ONLY EVER A CATEGORY', badgeClass: 'red' };
  },
};

export const CLIQUES_EVENTS = [coveredThisWeek, theHeadingHolds, onYourOwn];

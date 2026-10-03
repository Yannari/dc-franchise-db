// ══════════════════════════════════════════════════════════════════════
// bb-events/team-america.js — the tell the job creates
// ══════════════════════════════════════════════════════════════════════
//
// The twist's own trap, and the reason it is worth having events at all: to do
// the missions the three of them have to keep being seen together, and being
// seen together is exactly what the rest of the house reads as an alliance.
// The better they work, the more obviously they are working.
//
// So this family is not about the missions. It is about the RESIDUE:
//
//   the tell        three people who keep ending up in the same room, noticed
//                   by somebody who counts that sort of thing
//   the saboteur    a house that knows it is being steered and cannot find the
//                   hand, so it invents one — usually an innocent
//   the reluctance  a member who is genuinely targeting another member and has
//                   to keep sitting down with them anyway
//   the cover       a member burning real social capital to explain a
//                   conversation that had nothing innocent about it
//
// SECRECY: the house is never told this twist exists, so no beat may name the
// team as a team or say a member is on it. Everything here is what an outsider
// could actually observe.
import { gs } from '../core.js';
import { pStats, band, perceived, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _list = names => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/** Internal casting only — never narrated as membership. */
const _team = house => {
  try { return (gs.bb?.teamAmerica?.members || []).filter(n => house.includes(n)); }
  catch { return []; }
};
/** The most recent mission, this week or last. */
const _mission = ctx => {
  try {
    const ms = gs.bb?.teamAmerica?.missions || [];
    const now = ctx?.week?.num || 0;
    for (let i = ms.length - 1; i >= 0; i--) {
      if (ms[i].week <= now && now - ms[i].week <= 1) return ms[i];
    }
  } catch { /* no missions, no residue */ }
  return null;
};

const _tellCast = (house, ctx) => {
  if (!_mission(ctx)) return null;
  const team = _team(house);
  if (team.length < 2) return null;
  const watcher = _others(house, ...team)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { team, watcher } : null;
};
const _saboteurCast = (house, ctx) => {
  const m = _mission(ctx);
  const team = _team(house);
  if (!m?.noticed || team.length < 2) return null;
  const accuser = _others(house, ...team)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  // The house lands on somebody who is NOT on the team, which is the joke.
  const blamed = furthestFrom(accuser, _others(house, ...team, accuser));
  return accuser && blamed ? { m, accuser, blamed } : null;
};
const _reluctantCast = (house, ctx) => {
  if (!_mission(ctx)) return null;
  const team = _team(house);
  if (team.length < 2) return null;
  // Two members who genuinely dislike each other, obliged to keep meeting.
  let worst = null;
  for (const a of team) {
    for (const b of team) {
      if (a === b) continue;
      const v = perceived(a, b);
      if (!worst || v < worst.v) worst = { a, b, v };
    }
  }
  return worst && worst.v < 1 ? worst : null;
};
const _coverCast = (house, ctx) => {
  const m = _mission(ctx);
  const team = _team(house);
  if (!m || !team.includes(m.lead) || team.length < 2) return null;
  const asked = _others(house, ...team)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return asked ? { m, who: m.lead, asked } : null;
};

// ── three people who keep ending up in the same room ──────────────────
const theTell = {
  id: 'team-the-tell',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _tellCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _tellCast(house, ctx);
    if (!cast) return null;
    const { team, watcher } = cast;
    const scene = makeScene('team.tell', { a: watcher, b: team[0] }, { ending: 'scene', group: _list(team.slice(0, 3)) }, [], 'living-room');
    for (const n of team) api.suspicion(watcher, n, 1.1);
    return { scene, players: [...team.slice(0, 3), watcher],
      badgeText: 'THE SAME ROOM, AGAIN', badgeClass: 'red' };
  },
};

// ── hunting a hand that will not be found ─────────────────────────────
const theSaboteur = {
  id: 'team-the-saboteur',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _saboteurCast(house, ctx) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const cast = _saboteurCast(house, ctx);
    if (!cast) return null;
    const { accuser, blamed } = cast;
    const scene = makeScene('team.saboteur', { a: accuser, b: blamed }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(accuser, blamed, 1.6);
    api.addBond(blamed, accuser, -0.9);
    try { api.remember(blamed, accuser, 'called-me-a-saboteur', 2, { twist: 'bb-team-america' }); } catch { /* texture */ }
    return { scene, players: [accuser, blamed], badgeText: 'A HAND, ANY HAND', badgeClass: 'red' };
  },
};

// ── obliged to sit down with somebody you are hunting ─────────────────
const theReluctance = {
  id: 'team-the-reluctance',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _reluctantCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _reluctantCast(house, ctx);
    if (!cast) return null;
    const { a, b } = cast;
    const scene = makeScene('team.reluctant', { a, b }, { ending: 'scene' }, [], 'backyard');
    api.addBond(a, b, -0.4);
    return { scene, players: [a, b], badgeText: 'NOT EVEN FRIENDS', badgeClass: 'blue' };
  },
};

// ── explaining a conversation that will not explain ───────────────────
const theCover = {
  id: 'team-the-cover',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _coverCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _coverCast(house, ctx);
    if (!cast) return null;
    const { who, asked } = cast;
    const scene = makeScene('team.cover', { a: who, b: asked }, { ending: 'scene' }, [], 'backyard');
    api.suspicion(asked, who, 1.3);
    return { scene, players: [who, asked], badgeText: 'SLIGHTLY TOO GOOD', badgeClass: 'gold' };
  },
};

export const TEAM_AMERICA_EVENTS = [theTell, theSaboteur, theReluctance, theCover];

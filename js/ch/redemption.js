// ══════════════════════════════════════════════════════════════════════
// ch/redemption.js — Redemption House (a season twist)
// ══════════════════════════════════════════════════════════════════════
//
// XXX: Dirty 30 and Final Reckoning (Wikipedia, read 2026-10-16): an Arena loser
// does not go home, they go to Redemption House, away from the game, and every
// so often the people there fight each other for the way back in. The one who
// wins walks back into the villa; everybody they beat goes home for good. The
// house closes a few weeks before the final, and from then on a loss is a loss.
//
// Residents are out of the villa (state.active) but not out of the season
// (state.gone): their placement is written when they are finally sent home, as
// one of the people still ahead of everybody already gone.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { addScene } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { playDuel } from './arena.js';
import { removePlayer } from './exits.js';

const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
export const redemptionOn = state => !!state.options?.redemption;
const house = state => (state.redemption ||= { open: true, residents: [], out: [], returned: [], pending: null });

/** Is the house taking people tonight? It closes when three regular episodes are left. */
export function houseTakes(state, idx) {
  if (!redemptionOn(state)) return false;
  const H = house(state);
  return H.open && (state.plannedEpisodes || 14) - idx > 3;
}
export const residentsOf = state => (state.redemption?.residents || []).map(r => r.name);

/** An Arena loser goes to Redemption House instead of home: out of the villa, not out of the game. */
export function sendToRedemption(state, loser, winner, voters = []) {
  const H = house(state);
  const company = H.residents.map(r => r.name);
  removePlayer(state, loser, 'redemption', { pending: true });
  H.residents.push({ name: loser, since: state.ep, by: winner, voters: voters.filter(v => v !== loser) });
  nudge(state, loser, 'morale', -1.2);
  // the people already there: an old friend is a comfort, an old enemy is a long week
  for (const c of company) addBond(loser, c, getBond(loser, c) <= -2 ? -0.4 : 0.6);
  // the arrival airs later that night, with whatever happens at Redemption House (one chapter, not three)
  (H.arriving ||= []).push({ name: loser, company, by: winner });
}
function arrivals(state) {
  const H = state.redemption;
  for (const a of H?.arriving || []) addScene(state, 'redemption-arrive', [a.name, ...a.company.slice(0, 2)], { company: a.company.length, by: a.by }, [a.name, ...a.company], 'redemption');
  if (H) H.arriving = [];
}

/** Gone for good from Redemption House: placed behind everybody still in the villa or still in the house. */
function goHome(state, name, how, extra = {}) {
  const H = house(state);
  H.residents = H.residents.filter(r => r.name !== name);
  H.out.push(name);
  const place = state.active.length + H.residents.length + 1;
  state.gone.push({ name, ep: state.ep, day: state.day, how, place, ...extra });
}

/**
 * The night after the vote: the residents watch it on the television. Whoever sent them there is on the
 * screen; it hardens the grudge, and two who agree on who they are coming back for get closer.
 */
export function redemptionWatch(state, ballots = []) {
  const H = state.redemption;
  if (!H || !H.residents.length) return;
  const res = H.residents;
  const a = res[res.length - 1];
  const target = (a.voters || []).find(v => state.active.includes(v)) || (state.active.includes(a.by) ? a.by : null);
  if (target) { remember(a.name, target, 'sent-me-away', 0.5); nudge(state, a.name, 'confidence', 0.3); }
  const mate = res.find(r => r.name !== a.name);
  if (mate) addBond(a.name, mate.name, getBond(a.name, mate.name) <= -2 ? -0.5 : 0.5);
  const feud = mate && getBond(a.name, mate.name) <= -2;
  addScene(state, feud ? 'redemption-feud' : 'redemption-watch', [a.name, ...(mate ? [mate.name] : [])],
    { target, voted: ballots.length > 0 }, res.map(r => r.name), 'redemption');
}

/**
 * After the Arena: when two or more are waiting (every other week, or every week once there are three, or
 * on the night it closes) they fight. The longest there defends first; whoever is left standing goes back
 * in at the start of next episode, everybody they beat goes home. Closing night with one resident: home.
 */
export function redemptionNight(state, rng, { closing = false } = {}) {
  const H = state.redemption;
  if (!H || !H.open) return null;
  arrivals(state);
  const res = H.residents;
  const fight = res.length >= 2 && (res.length >= 3 || state.ep % 2 === 0 || closing);
  let champ = null;
  if (fight) {
    const order = [...res].sort((x, y) => x.since - y.since).map(r => r.name);
    champ = order[0];
    for (const next of order.slice(1)) {
      const duel = playDuel(state, rng, champ, next);
      const { winner, loser } = duel;
      state.rec[winner].arenaW++; state.rec[loser].arenaL++;
      nudge(state, winner, 'confidence', 1);
      addBond(loser, winner, -0.4);
      addScene(state, 'redemption-duel', [winner, loser], { game: duel.game, gameName: duel.gameName, winner, loser, defending: champ === winner }, [winner, loser], 'redemption');
      goHome(state, loser, 'redemption', { by: winner, game: duel.game });
      champ = winner;
    }
    H.pending = champ;
    pop(champ, 1);
  }
  if (closing) {
    H.open = false;
    for (const r of [...H.residents]) if (r.name !== champ) {
      addScene(state, 'redemption-closed', [r.name], {}, [r.name], 'redemption');
      goHome(state, r.name, 'redemption', { closed: true });
    }
  }
  return champ;
}

/** The episode starts: the one who fought their way back walks into the villa. */
export function returnFromRedemption(state) {
  const H = state.redemption;
  if (!H?.pending) return null;
  const name = H.pending;
  const r = H.residents.find(x => x.name === name);
  H.residents = H.residents.filter(x => x.name !== name);
  H.pending = null;
  H.returned.push(name);
  state.active.push(name);
  nudge(state, name, 'confidence', 1.5); nudge(state, name, 'morale', 2);
  pop(name, 1.5);
  const voters = (r?.voters || []).filter(v => state.active.includes(v));
  // the people who sent them there: they are back, and they know who did it
  for (const v of voters) { nudge(state, v, 'paranoia', 1); remember(name, v, 'sent-me-away', 0.8); addBond(name, v, -0.4); }
  if (r?.by && state.active.includes(r.by)) nudge(state, r.by, 'paranoia', 0.6);
  addScene(state, 'redemption-return', [name, ...voters.slice(0, 2)], { by: r?.by && state.active.includes(r.by) ? r.by : null, voters: voters.length },
    state.active, 'villa');
  return name;
}

/** The final: anybody still waiting in Redemption House goes home before it. */
export function closeForFinal(state) {
  const H = state.redemption;
  if (!H) return;
  if (H.pending) { const p = H.pending; H.pending = null; goHome(state, p, 'redemption', { closed: true }); }
  for (const r of [...H.residents]) goHome(state, r.name, 'redemption', { closed: true });
  H.open = false;
}

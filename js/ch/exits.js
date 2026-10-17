// ══════════════════════════════════════════════════════════════════════
// ch/exits.js — leaving without a vote: quits, medicals, disqualifications
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 "Exits outside the vote". All three are real and frequent on the
// show. Quits come from the mind (homesickness, morale, endurance and
// temperament), per DAY, so a longer season is not a quieter one per day
// (manual §16.3). A medical comes from an injury that does not heal. TJ has an
// outraged bit for quitters; respect pays for it (respect.js).
import { getBond } from '../bonds.js';
import { S, addScene, clamp } from './state.js';
import { giveRespect } from './respect.js';
import { partnerGone } from './romance.js';

// The day's quit risk for one player.
export function quitRisk(state, name) {
  const m = state.mind[name];
  if (!m) return 0;
  const home = Math.max(0, m.homesick - 4) / 6;            // 0 below 4, 1 at 10
  const low = Math.max(0, 5 - m.morale) / 5;
  const grit = (S(name, 'endurance') + S(name, 'temperament') + S(name, 'boldness')) / 30;
  const friends = state.active.filter(o => o !== name && getBond(name, o) >= 4).length;
  // Pride: respect earned is respect a quit throws away, and nobody wants TJ's speech.
  const pride = 1 / (1 + Math.max(0, state.rec[name]?.respect || 0) * 0.25 + (state.rec[name]?.arenaW || 0) * 0.3);
  return clamp(0.014 * home * home * (0.6 + low) * (1.4 - grit) * (friends ? 0.7 : 1.15) * pride
    * (state.psyche[name] === 'home' ? 1.5 : 1), 0, 0.1);
}

export function removePlayer(state, name, how, extra = {}) {
  if (!state.active.includes(name)) return;
  // Their placement: how many were still in when they left (the people waiting in Redemption House are still in).
  const place = state.active.length + (state.redemption?.residents?.length || 0)
    + (state.late || []).filter(n => !state.active.includes(n) && !state.gone.some(g => g.name === n) && n !== name).length;   // still to arrive
  state.active = state.active.filter(n => n !== name);
  // Redemption House: out of the villa, not yet out of the season (redemption.js writes the placement later)
  if (!extra.pending) state.gone.push({ name, ep: state.ep, day: state.day, how, place, ...extra });
  partnerGone(state, name);
  // Their alliances lose them. A group whose leader went home is led by the
  // most strategic member still in the house, or it is over (manual §11.5:
  // nobody who has left the game takes part in a scene).
  for (const al of state.alliances) {
    if (al.ended || !al.members.includes(name)) continue;
    al.members = al.members.filter(m => m !== name);
    (al.former ||= []).push(name);
    const inside = al.members.filter(m => state.active.includes(m));
    if (inside.length < 2) { al.ended = true; al.endedEp = state.ep; al.why = 'numbers'; continue; }
    if (al.leader === name) al.leader = [...inside].sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0];
  }
}

export function quit(state, name) {
  giveRespect(state, name, 'quit');
  addScene(state, 'quit', [name], {}, state.active, 'public');
  removePlayer(state, name, 'quit');
}

export function medical(state, name) {
  addScene(state, 'medical', [name], {}, state.active, 'public');
  removePlayer(state, name, 'medical');
}

export function disqualify(state, name, victim, witness = null) {
  state.tj[name] = (state.tj[name] || 0) - 2;
  // TJ hears from a witness first, when there is one (party.js dqDebate)
  addScene(state, 'disqualified', [name, victim, ...(witness ? [witness] : [])], witness ? { witness } : {}, state.active, 'public');
  removePlayer(state, name, 'disqualified', { victim });
}

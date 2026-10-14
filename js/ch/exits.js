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
  return clamp(0.02 * home * home * (0.6 + low) * (1.4 - grit) * (friends ? 0.7 : 1.15)
    * (state.psyche[name] === 'home' ? 1.5 : 1), 0, 0.12);
}

export function removePlayer(state, name, how, extra = {}) {
  if (!state.active.includes(name)) return;
  // Their placement: how many were still in when they left.
  const place = state.active.length;
  state.active = state.active.filter(n => n !== name);
  state.gone.push({ name, ep: state.ep, day: state.day, how, place, ...extra });
  partnerGone(state, name);
  // Grudges against someone who has gone are settled.
  for (const a of Object.keys(state.revenge)) delete state.revenge[a][name];
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

export function disqualify(state, name, victim) {
  state.tj[name] = (state.tj[name] || 0) - 2;
  addScene(state, 'disqualified', [name, victim], {}, state.active, 'public');
  removePlayer(state, name, 'disqualified', { victim });
}

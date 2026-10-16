// ══════════════════════════════════════════════════════════════════════
// ch/cruel.js — the mean ones being mean
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "yul is not sweet is cruel and mean and we should see that ... sometimes the events are
// far too nice for a sim based on the challenge x disventure camp / total drama". A villain enjoys watching
// people fail, and says so; a hothead can't keep it in. Two moments the house lives through:
//
//   mock   after a daily, somebody mocks whoever choked or came last. A kind friend of theirs may step in.
//   gloat  after the vote, somebody who said the name rubs it in.
//
// Neither is cosmetic: the one mocked goes cold on the mocker and remembers it, their morale drops, a
// defender earns their thanks and the mocker's dislike, and the fans like a bully a little less.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { S, addScene, archetypeOf } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';

const MEAN = { villain: 1, mastermind: 0.7, schemer: 0.8, hothead: 0.6, 'chaos-agent': 0.4 };
const KIND = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };

// how much somebody wants to twist the knife into n: their nature, how little they like n, how short their fuse is
const spite = (m, n) => (MEAN[archetypeOf(m)] || 0) * (1 + Math.max(0, -getBond(m, n)) * 0.25) * (0.6 + (10 - S(m, 'temperament')) * 0.05);

function bullyFor(state, rng, target, among = state.active) {
  const cands = among.filter(m => m !== target && MEAN[archetypeOf(m)]).map(m => [m, spite(m, target)]).sort((x, y) => y[1] - x[1]);
  const [m, w] = cands[0] || [];
  if (!m || rng() >= Math.min(0.7, w * 0.45)) return null;
  return m;
}

/** After the daily: mock the one who choked, or the one who came last. */
export function mockAfterDaily(state, rng, daily) {
  const choke = (daily.moments || []).find(x => x.kind === 'choke')?.who;
  const target = [choke, ...(daily.last || [])].find(n => n && state.active.includes(n) && !(daily.winners || []).includes(n));
  if (!target) return null;
  const bully = bullyFor(state, rng, target);
  if (!bully) return null;
  // a kind friend of the target, bold enough to say something
  const def = state.active.filter(n => n !== target && n !== bully && KIND.has(archetypeOf(n)) && getBond(n, target) >= 2)
    .sort((x, y) => getBond(y, target) - getBond(x, target))[0];
  const defender = def && rng() < 0.25 + S(def, 'boldness') * 0.05 ? def : null;
  addBond(target, bully, -0.6); remember(target, bully, 'mocked-me', 0.8);
  nudge(state, target, 'morale', -0.5); nudge(state, target, 'confidence', -0.3);
  pop(bully, -0.2);
  if (defender) { addBond(target, defender, 0.6); addBond(bully, defender, -0.4); remember(target, defender, 'stood-up-for-me', 0.8); pop(defender, 0.3); }
  addScene(state, 'mock', [bully, target, ...(defender ? [defender] : [])], { why: target === choke ? 'choke' : 'last', daily: daily.name || null, defender },
    state.active, 'villa');
  return { bully, target, defender };
}

/** After the vote: a voter with no love for the one voted in rubs it in. */
export function gloatAfterVote(state, rng, vote) {
  const target = vote?.votedIn;
  if (!target || !state.active.includes(target)) return null;
  const voters = (vote.ballots || []).filter(b => b.target === target).map(b => b.voter).filter(v => state.active.includes(v) && getBond(v, target) <= 1);
  const bully = bullyFor(state, rng, target, voters);
  if (!bully) return null;
  addBond(target, bully, -0.6); remember(target, bully, 'gloated', 1);
  nudge(state, target, 'confidence', 0.3);   // it lights a fire
  pop(bully, -0.2);
  addScene(state, 'gloat', [bully, target], {}, state.active, 'villa');
  return { bully, target };
}

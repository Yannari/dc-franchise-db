// ══════════════════════════════════════════════════════════════════════
// ch/house.js — a day in the villa
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.6, §4.7, §5 "House life". Every event changes something (a bond, a
// meter, a deal, a record) and leaves a scene with who saw it. Nothing here is
// cosmetic (CLAUDE.md: every social event has consequences).
//
//   hangs        two people talk; the bond moves by how well they mix
//   deals        insurance: "I won't vote you; you won't call me out"
//   cliques      original-show loyalty, strong on day one, fading
//   vets/rookies a vet treating a rookie as a number; rookies banding together
//   apologies    guilt turned into a talk
//   paranoia     a paranoid leader cutting a member loose
//   psyche       one person's need gets a moment (the C-story)
//   the return   the Arena winner walks back in and faces the ones who voted
import { getBond, addBond, getPerceivedBond } from '../bonds.js';
import { S, addScene, shuffle, weighted, mayScheme, archetypeOf } from './state.js';
import { gs } from '../core.js';
import { remember, resentOf, intimidated } from './rel.js';
import { noteDeal } from './knowledge.js';
import { nudge } from './mind.js';
import { allianceOf, activeAlliances, formAlliances, growAlliances, leave, allianceShifts } from './alliances.js';
import { dealBetween } from './callout.js';
import { addRivalry } from './events.js';
import { stableRng } from '../script/rng.js';

export function allianceCap(state) {
  const j = stableRng(state.seed, 'alliance-cap')();
  const cap = Math.max(2, Math.min(5, Math.round(state.active.length / 6) + (j < 0.3 ? -1 : j > 0.8 ? 1 : 0)));
  // the first days: fewer, the house still finding out who is who
  return state.ep <= 1 ? Math.min(cap, j < 0.5 ? 2 : 3) : cap;
}

export function houseDay(state, rng) {
  // Hangs: each person spends the day with a few others, chosen by pull.
  for (const a of shuffle(rng, state.active)) {
    const others = state.active.filter(b => b !== a);
    const who = weighted(rng, others.map(b => ({ item: b,
      w: Math.exp((getPerceivedBond(a, b) + (state.origin[a] && state.origin[a] === state.origin[b] ? 2 * state.cliqueStrength : 0)) * 0.25) })));
    if (!who) continue;
    const mix = ((S(a, 'social') + S(who, 'social')) / 20 - 0.45) * 1.2 + (rng() - 0.5) * 0.9;
    addBond(a, who, mix * 0.6);
  }
  deals(state, rng);
  vetsAndRookies(state, rng);
  apologies(state, rng);
  paranoidLeaders(state, rng);
  // members walking away, defecting, groups merging or drifting apart (alliances.js)
  allianceShifts(state, rng);
  // New alliances where the house has drifted (and early, the first ones).
  // How many groups the house holds at once (the user, 2026-10-16: "do we have an alliance limit, it seems to be
  // always 4"; it was 3, then 4, every season): a season's own number, by the house's size, two to five
  formAlliances(state, rng, { max: allianceCap(state) });
  growAlliances(state, rng);
}

function deals(state, rng) {
  for (const a of state.active) {
    if (rng() > S(a, 'strategic') * 0.012) continue;
    const cands = state.active.filter(b => b !== a && state.division[b] === state.division[a]
      && !dealBetween(state, a, b) && getPerceivedBond(a, b) > 0.5 && getPerceivedBond(a, b) < 6);
    if (!cands.length) continue;
    const b = cands[Math.floor(rng() * cands.length)];
    // b agrees if they see value in it.
    if (rng() < 0.4 + S(b, 'strategic') * 0.04) {
      state.deals.push({ id: state.deals.length + 1, a, b, ep: state.ep, broken: null });
      addBond(a, b, 0.6);
      noteDeal(state, a, b);
      remember(a, b, 'promise', 1); remember(b, a, 'promise', 1);
      addScene(state, 'deal', [a, b], { kind: 'insurance' }, [a, b], 'private');
    }
  }
}

function vetsAndRookies(state, rng) {
  const rookies = state.active.filter(n => state.rookie[n]);
  const vets = state.active.filter(n => !state.rookie[n]);
  if (!rookies.length || !vets.length) return;
  // A vet dismisses a rookie (a scheme or a hothead's mouth).
  if (rng() < 0.35) {
    const v = vets[Math.floor(rng() * vets.length)];
    if (mayScheme(v) || S(v, 'boldness') >= 7) {
      const r = rookies[Math.floor(rng() * rookies.length)];
      addBond(v, r, -1);
      intimidated(v, r, 0.5);
      remember(r, v, 'talked-down-to', 1);
      addScene(state, 'vet-dismisses', [v, r], {}, state.active, 'public');
    }
  }
  // Rookies rising: two rookies voted into the Arena in a row, and enough left.
  const lastTwo = state.episodes.slice(-2).map(e => e.votedIn?.[0]);
  if (lastTwo.length === 2 && lastTwo.every(n => n && state.rookie[n]) && rookies.length >= 3
    && !state.alliances.some(a => !a.ended && a.rookies)) {
    const members = rookies.filter(n => !allianceOf(state, n)).slice(0, 6);
    if (members.length >= 3) {
      const al = { id: state.alliances.length + 1, name: 'The New Threats', leader: [...members].sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0],
        members, formedEp: state.ep, formedDay: state.day, ended: false, rookies: true, origin: null };
      state.alliances.push(al);
      for (const a of members) for (const b of members) if (a < b) addBond(a, b, 1);
      addScene(state, 'rookie-uprising', members, { alliance: al.id }, members, 'private');
    }
  }
}

function apologies(state, rng) {
  for (const a of state.active) {
    for (const [b, g] of Object.entries(state.guilt[a] || {})) {
      if (!state.active.includes(b) || rng() > 0.3 * g) continue;
      const accepted = rng() < 0.35 + S(b, 'temperament') * 0.05 - resentOf(b, a) * 0.08;
      addBond(a, b, accepted ? 1.2 : -0.3);
      if (accepted) { remember(b, a, 'made-amends', 1.2); addRivalry(state, a, b, -3); }
      delete state.guilt[a][b];
      addScene(state, 'apology', [a, b], { accepted }, [a, b], 'private');
    }
  }
}

function paranoidLeaders(state, rng) {
  for (const al of activeAlliances(state)) {
    const L = al.leader;
    if ((state.mind[L]?.paranoia || 0) < 6.5 || rng() > 0.25) continue;
    const coldest = al.members.filter(m => m !== L && state.active.includes(m)).sort((a, b) => getBond(L, a) - getBond(L, b))[0];
    if (!coldest) continue;
    addBond(L, coldest, -1.5);
    leave(state, al, coldest, 'cut-loose');
    nudge(state, coldest, 'paranoia', 1.5);
  }
}

// One person's need, once an episode (the C-story the director will air).
export function psycheMoment(state, rng) {
  const who = state.active[Math.floor(rng() * state.active.length)];
  if (!who) return;
  const need = state.psyche[who];
  const m = state.mind[who];
  const confidant = state.active.filter(o => o !== who).sort((a, b) => getBond(who, b) - getBond(who, a))[0];
  if (confidant && getBond(who, confidant) >= 3) {
    addBond(who, confidant, 0.8);
    nudge(state, who, 'morale', 0.6);
    if (need === 'home') nudge(state, who, 'homesick', -0.6);
  }
  addScene(state, 'psyche', confidant && getBond(who, confidant) >= 3 ? [who, confidant] : [who],
    { need, homesick: +m.homesick.toFixed(1), morale: +m.morale.toFixed(1) }, [who].concat(confidant ? [confidant] : []), 'private');
}

// The Arena winner walks back in: the ones who voted them in have to face it.
export function returnToHouse(state, winner, voters, how = {}) {
  for (const v of voters) {
    if (!state.active.includes(v)) continue;
    addBond(winner, v, -0.6);
    nudge(state, v, 'paranoia', 0.6);
  }
  const faced = voters.filter(v => state.active.includes(v));
  // the friends who meet them at the door (the user, 2026-10-16: scenes that aired as one confessional)
  const friends = state.active.filter(n => n !== winner && !faced.includes(n) && getBond(winner, n) >= 2).sort((x, y) => getBond(winner, y) - getBond(winner, x)).slice(0, 2);
  // the mood they walk back in with (the user, 2026-10-16: "the return is always the same structure is boring
  // ... strategy comedy mockery taunt drama possible fight ... sadness for the eliminated want revenge bitter happy
  // me vs the rest of the house my alliance vs the rest of the house"): read off what happened, and it costs
  const mood = returnMood(state, winner, faced, how);
  const pop = d => { gs.popularity ||= {}; gs.popularity[winner] = (gs.popularity[winner] || 0) + d; };
  if (mood === 'sad') { nudge(state, winner, 'morale', -0.6); for (const f of friends) addBond(winner, f, 0.3); }
  if (mood === 'revenge' || mood === 'mock' || mood === 'house') { for (const v of faced) { addBond(v, winner, -0.3); nudge(state, v, 'paranoia', 0.3); } pop(0.2); }
  if (mood === 'alliance') { const al = allianceOf(state, winner); for (const m of al?.members || []) if (m !== winner && state.active.includes(m)) addBond(winner, m, 0.3); }
  if (mood === 'comedy') for (const n of state.active) if (n !== winner) addBond(n, winner, 0.1);
  if (mood === 'strategy') nudge(state, winner, 'confidence', 0.4);
  if (mood === 'happy') nudge(state, winner, 'morale', 0.5);
  const al = allianceOf(state, winner);
  addScene(state, 'return', [winner, ...faced, ...friends], { how: how.volunteered ? 'volunteered' : how.calledOut ? 'calledout' : 'voted', volunteered: !!how.volunteered, calledOut: !!how.calledOut, beat: how.beat || null, voters: faced.length,
    mood, wins: state.rec[winner]?.arenaW || 0, alliance: mood === 'alliance' ? al?.name || null : null }, state.active, 'public');
}

const MEAN = new Set(['villain', 'mastermind', 'schemer']);
const LOOSE = new Set(['goat', 'wildcard', 'chaos-agent']);
function returnMood(state, winner, faced, how) {
  const wins = state.rec[winner]?.arenaW || 0;
  const arch = archetypeOf(winner);
  const al = allianceOf(state, winner);
  const allied = al && al.members.filter(m => m !== winner && state.active.includes(m)).length >= 2;
  const flip = (state.ep + winner.length) % 2;
  if (how.beat && getBond(winner, how.beat) >= 2) return 'sad';
  if (wins >= 3) return allied && flip ? 'alliance' : 'house';
  if (faced.length >= 3 && (MEAN.has(arch) || S(winner, 'temperament') <= 4)) return 'revenge';
  if (MEAN.has(arch)) return flip ? 'mock' : 'strategy';
  if (LOOSE.has(arch)) return 'comedy';
  if (allied && wins >= 2) return 'alliance';
  return 'happy';
}

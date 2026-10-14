// ══════════════════════════════════════════════════════════════════════
// ch/vote.js — deliberation, volunteering, and the open house vote
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.1 and §4.6.
//
// DELIBERATION happens in front of everybody. Alliance leaders put their
// target on the table and pitch it; anyone in danger can threaten ("put me in
// and I'm calling YOU out"), credible from a strong Arena record and boldness,
// sometimes a bluff; a strong player can volunteer instead of the vote.
//
// THE VOTE is out loud and in order. Each voter scores every eligible player
// of the week's division on: threat (by the voter's strategic), perceived
// bond (by loyalty), the bloc's target (by loyalty, less any doubt), free-ride
// heat, revenge, fear of the call-out (voting in someone who resents you), the
// strategist's question "will they actually lose?", the final (late in the
// season, who could beat me in the final), pitches and threats heard at
// deliberation, debts, deals, a showmance, the old show's clique, and — at the
// moment of casting — the count so far (the bandwagon). The voter's intent at
// deliberation is what they TOLD the house; a ballot that differs is a flip.
//
// Every ballot is a public act and costs something: the person voted in
// remembers each name (revenge), a friend's vote hurts the bond, guilt for
// the voter who did it to a friend.
import { getPerceivedBond, getBond, addBond } from '../bonds.js';
import { S, addScene, bumpMap, feel, noise, shuffle, logistic, clamp } from './state.js';
import { arenaRead, threatRead, freeRide, arenaBase } from './respect.js';
import { allianceOf, activeAlliances, proposeTarget, memberDoubt } from './alliances.js';
import { coupleOf, dealBetween, calloutTerms } from './callout.js';
import { nudge } from './mind.js';

// The opponent the house expects X to call out (a quick read, not the real
// choice): the one X's terms like most.
function expectedCallout(state, x, eligible) {
  let best = null, top = -Infinity;
  for (const y of eligible) {
    if (y === x) continue;
    const t = calloutTerms(state, x, y);
    const tot = t.survive + t.grudge + t.prove + t.avoid + t.protect;
    if (tot > top) { top = tot; best = y; }
  }
  return best;
}

export function deliberate(state, rng, { division, eligible, immune }) {
  const out = { targets: {}, pitches: [], threats: [], volunteer: null, intents: {} };
  // 1. Each alliance's target, said out loud.
  for (const al of activeAlliances(state)) {
    const t = proposeTarget(state, al, eligible);
    if (!t) continue;
    out.targets[al.id] = t;
    addScene(state, 'deliberation-target', [al.leader, t], { alliance: al.id, target: t }, al.members, 'private');
  }
  // 2. Pitches: leaders and social players work the room for their target.
  for (const al of activeAlliances(state)) {
    const t = out.targets[al.id];
    if (!t) continue;
    const pitcher = al.leader;
    for (const v of state.active) {
      if (al.members.includes(v) || v === t) continue;
      const strength = (S(pitcher, 'social') / 10) * clamp((getPerceivedBond(v, pitcher) + 3) / 8, 0, 1);
      if (rng() < 0.25 + strength * 0.5) out.pitches.push({ from: pitcher, to: v, target: t, strength: +strength.toFixed(2) });
    }
  }
  // 3. Leverage threats from the ones who feel the heat.
  const heat = eligible.map(n => ({ n, h: activeAlliances(state).filter(a => out.targets[a.id] === n).length + freeRide(state, n) }))
    .sort((a, b) => b.h - a.h).slice(0, 3);
  for (const { n, h } of heat) {
    if (h <= 0) continue;
    const bold = S(n, 'boldness') / 10;
    if (rng() > 0.2 + bold * 0.6) continue;
    const at = expectedCallout(state, n, eligible.concat(state.active.filter(x => state.division[x] === state.division[n] && !immune.includes(x))));
    if (!at) continue;
    const credible = clamp(arenaRead(state, n) / 10 * 0.7 + bold * 0.3, 0, 1);
    out.threats.push({ from: n, at, credible: +credible.toFixed(2), bluff: arenaBase(n) < 5.5 });
    addScene(state, 'leverage-threat', [n, at], { credible, bluff: arenaBase(n) < 5.5 }, state.active, 'public');
  }
  // 4. A volunteer.
  if (state.fmt.volunteers) {
    const cands = eligible.map(c => {
      const target = Object.entries(state.revenge[c] || {}).filter(([y]) => eligible.includes(y)).sort((a, b) => b[1] - a[1])[0];
      const w = (arenaRead(state, c) - 5.5) * 0.45 + S(c, 'boldness') * 0.14 + (state.psyche[c] === 'prove' ? 0.5 : 0)
        + (target ? target[1] * 0.35 : 0) + freeRide(state, c) * 0.8 + (state.rookie[c] ? 0.2 : 0);
      return { c, w, target: target?.[0] || null };
    }).sort((a, b) => b.w - a.w);
    const top = cands[0];
    if (top && rng() < logistic(top.w - 3.4) * 0.5) {
      out.volunteer = { name: top.c, target: top.target };
      addScene(state, 'volunteer', [top.c], { target: top.target }, state.active, 'public');
    }
  }
  // 5. Each voter's intent: what they tell the house they will do.
  for (const v of state.active) out.intents[v] = topChoice(state, rng, v, eligible, out, null).target;
  return out;
}

// The voter's score for each eligible target. `tally` is the count so far
// (null at deliberation).
export function voteTerms(state, v, t, eligible, delib, tally) {
  const strat = S(v, 'strategic') / 10, loyal = S(v, 'loyalty') / 10, bold = S(v, 'boldness') / 10;
  const share = state.ep / Math.max(1, state.plannedEpisodes || 14);
  const terms = {};
  terms.threat = threatRead(state, t) * strat * 0.32;
  terms.bond = -getPerceivedBond(v, t) * (0.22 + loyal * 0.38);
  const al = allianceOf(state, v);
  const blocTarget = al ? delib?.targets?.[al.id] : null;
  terms.bloc = blocTarget === t ? 2.4 * (0.35 + loyal * 0.65) * (1 - memberDoubt(state, al, v, t)) : 0;
  if (al && al.members.includes(t)) terms.bloc -= 3 * (0.3 + loyal);
  terms.freeRide = freeRide(state, t) * 1.3;
  terms.revenge = feel(state.revenge, v, t) * 0.9;
  // Fear: t resents v, and v could be the one t calls out if t is put in.
  const resent = feel(state.revenge, t, v) + Math.max(0, -getBond(t, v)) * 0.25;
  const callable = state.division[v] === state.division[t] && eligible.includes(v);
  const threatAt = (delib?.threats || []).find(x => x.from === t && x.at === v);
  terms.fear = -(resent * (callable ? 0.9 : 0.3) * (arenaRead(state, t) / 10) * (1.2 - bold)
    + (threatAt ? threatAt.credible * 2.8 * (1.15 - bold) : 0));
  // Will they lose? A beast voted in removes whoever they call out; the
  // strategist would rather put in somebody likely to lose — unless the beast
  // is expected to call out one of the strategist's enemies.
  terms.willLose = -Math.max(0, arenaRead(state, t) - 6) * 0.45 * strat;
  // The final: late in the season, who could beat me in it.
  const finalThreat = (S(t, 'endurance') + S(t, 'mental') + S(t, 'physical')) / 3;
  terms.final = share > 0.45 ? (finalThreat - 5) * (share - 0.45) * 1.4 * strat : 0;
  // Shields: a strategist keeps a bigger threat around to hide behind.
  const mine = threatRead(state, v);
  terms.shield = (state.division[v] === state.division[t] && threatRead(state, t) > mine + 2 && share < 0.7) ? -strat * 0.9 : 0;
  // What the room said: pitches heard, a showmance, a deal, a debt, the old show.
  terms.pitch = (delib?.pitches || []).filter(p => p.to === v && p.target === t).reduce((a, p) => a + p.strength * 1.6, 0);
  terms.couple = coupleOf(state, v) === t ? -9 : 0;
  terms.deal = dealBetween(state, v, t) ? -2.6 * (0.3 + loyal) : 0;
  terms.debt = -feel(state.debts, v, t) * 0.8;
  terms.clique = state.origin[v] && state.origin[v] === state.origin[t] ? -0.9 * state.cliqueStrength : 0;
  // The bandwagon, at the moment of casting: the count so far pulls the
  // agreeable and the timid.
  if (tally) {
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    const conform = (1 - bold) * (S(v, 'social') / 10) * 1.6;
    terms.bandwagon = total ? (tally[t] || 0) / total * conform * 2 : 0;
  }
  return terms;
}

function topChoice(state, rng, v, eligible, delib, tally) {
  const rows = eligible.filter(t => t !== v).map(t => {
    const terms = voteTerms(state, v, t, eligible, delib, tally);
    const total = Object.values(terms).reduce((a, b) => a + b, 0) + noise(rng) * 0.55;
    return { target: t, terms, total };
  });
  rows.sort((a, b) => b.total - a.total);
  return rows[0] || { target: null };
}

// What the voter WANTED on their own (no bloc, no pitch, no count).
function wanted(state, v, eligible, delib) {
  let best = null, top = -Infinity;
  for (const t of eligible) {
    if (t === v) continue;
    const terms = voteTerms(state, v, t, eligible, null, null);
    const tot = Object.values(terms).reduce((a, b) => a + b, 0);
    if (tot > top) { top = tot; best = t; }
  }
  return best;
}

// The open vote. Returns { order, ballots, tally, votedIn, tied, flips }.
export function houseVote(state, rng, { eligible, delib, immune, winners, exclude = [] }) {
  const pool = eligible.filter(n => !exclude.includes(n));
  const order = shuffle(rng, state.active);
  const tally = {};
  const ballots = [];
  for (const v of order) {
    const pick = topChoice(state, rng, v, pool, delib, tally);
    if (!pick.target) continue;
    tally[pick.target] = (tally[pick.target] || 0) + 1;
    const al = allianceOf(state, v);
    const asked = (al && delib.targets[al.id]) || (delib.pitches.find(p => p.to === v)?.target) || null;
    const told = delib.intents[v] ?? null;
    ballots.push({ voter: v, target: pick.target, wanted: wanted(state, v, pool, delib), asked, told,
      flip: told != null && told !== pick.target,
      why: topTerm(pick.terms), countBefore: Object.values(tally).reduce((a, b) => a + b, 0) - 1 });
  }
  const max = Math.max(0, ...Object.values(tally));
  const tied = Object.keys(tally).filter(n => tally[n] === max);
  let votedIn = tied[0] || null, tiebreak = null;
  if (tied.length > 1) {
    // The daily winners break it, each by their own read.
    const breakers = winners.filter(w => state.active.includes(w));
    if (breakers.length) {
      const score = {};
      for (const b of breakers) for (const t of tied) {
        const terms = voteTerms(state, b, t, pool, delib, null);
        score[t] = (score[t] || 0) + Object.values(terms).reduce((a, x) => a + x, 0);
      }
      votedIn = tied.sort((a, b) => score[b] - score[a])[0];
      tiebreak = { by: breakers, chose: votedIn, between: tied };
    } else {
      votedIn = tied[Math.floor(rng() * tied.length)];
      tiebreak = { by: [], chose: votedIn, between: tied, draw: true };
    }
  }
  return { order, ballots, tally, votedIn, tied: tied.length > 1, tiebreak };
}

// The public cost of every ballot.
export function voteFallout(state, vote) {
  for (const b of vote.ballots) {
    const t = b.target;
    state.rec[t].votesReceived++;
    nudge(state, t, 'paranoia', 0.35);
    const friend = getBond(b.voter, t) >= 3;
    addBond(b.voter, t, friend ? -1.4 : -0.5);
    if (t === vote.votedIn) bumpMap(state.revenge, t, b.voter, friend ? 1.6 : 1);
    if (friend) bumpMap(state.guilt, b.voter, t, 1);
    // A deal broken in public.
    const deal = dealBetween(state, b.voter, t);
    if (deal) breakDeal(state, deal, b.voter, 'vote');
  }
  // The flips the room saw.
  for (const b of vote.ballots.filter(x => x.flip)) {
    if (b.told) addBond(b.voter, b.told, 0.3);
  }
}

export function breakDeal(state, deal, by, how) {
  deal.broken = { by, how, ep: state.ep };
  const other = deal.a === by ? deal.b : deal.a;
  addBond(by, other, -3);
  bumpMap(state.revenge, other, by, 1.5);
  addScene(state, 'deal-broken', [by, other], { deal: deal.id, how }, state.active, 'public');
}

function topTerm(terms) {
  return Object.entries(terms).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}


// ══════════════════════════════════════════════════════════════════════
// ch/vote.js — deliberation as an operation, then the open vote
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.1 and §4.6, built the way Big Brother's vote operation is
// (js/bb/vote-operation.js): the vote is people fighting over a count, so the
// fighting has to exist.
//
// DELIBERATION, in order:
//   1. Every alliance MEETS. The organiser puts a name on the table (from the
//      members' plans, weighted by how much each trusts the organiser), and
//      every member answers: yes, reluctant, refuses (the name is a friend, a
//      partner, a deal), or a FALSE YES (says it, means another name) — the one
//      outcome the audience knows and the house does not. A meeting can be
//      spotted.
//   2. An alliance short of a majority RECRUITS among the unaffiliated:
//      accepted, refused, left hanging, or agreed to falsely.
//   3. The people in danger CAMPAIGN in front of everybody: a plea to a friend,
//      a leverage threat ("put me in and I'm calling YOU out"; credible from an
//      Arena record, sometimes a bluff), or OUTING the alliance that is coming
//      for them — which makes it public and turns the room on it.
//   4. A strong player may VOLUNTEER instead of the vote.
//   5. Everybody's position is what they TOLD the house.
//
// THE VOTE is out loud and in a random order. A committed voter casts their
// word unless something breaks it (a false yes, the bandwagon, nerves); the
// uncommitted vote their own read with the count so far pulling the timid.
// Each ballot carries its chain: wanted → asked → told → cast, and why.
import { getBond, addBond } from '../bonds.js';
import { S, mayScheme, addScene, noise, shuffle, logistic, clamp } from './state.js';
import { arenaRead, freeRide, arenaBase } from './respect.js';
import { allianceOf, activeAlliances, leave } from './alliances.js';
import { coupleOf, dealBetween, calloutTerms } from './callout.js';
import { nudge } from './mind.js';
import { planOf, targetScore } from './plans.js';
import { trustOf, protectOf, grudgeOf, cooperateWith, believePitch, votedFor, betrayed, remember, intimidated, fearOf } from './rel.js';
import { spotMeeting, noteFalseYes, outAlliance, believedAlliances, believedHunters } from './knowledge.js';
import { breakThePower } from './blocs.js';

// The opponent the house expects X to call out (a quick read).
function expectedCallout(state, x, pool) {
  let best = null, top = -Infinity;
  for (const y of pool) {
    if (y === x) continue;
    const t = calloutTerms(state, x, y);
    const tot = t.survive + t.grudge + t.prove + t.avoid + t.protect;
    if (tot > top) { top = tot; best = y; }
  }
  return best;
}

// ── 1. the meetings ──────────────────────────────────────────────────
// The house's prediction of each player's call-out, once per deliberation.
function predictor(state, eligible) {
  const memo = {};
  return x => (x in memo ? memo[x] : (memo[x] = expectedCallout(state, x, eligible.filter(y => y !== x))));
}

function meet(state, rng, al, eligible, ctx) {
  const present = al.members.filter(m => state.active.includes(m));
  const outside = eligible.filter(n => !al.members.includes(n));
  if (!outside.length || present.length < 2) return null;
  // Each member's preference, weighted by how much they back the organiser.
  const tallies = {};
  for (const m of present) {
    const w = m === al.leader ? 2 : clamp(1 + cooperateWith(m, al.leader) * 0.1, 0.3, 1.6);
    const ranked = outside.map(n => ({ n, s: targetScore(state, m, n, planOf(state, m), ctx).total })).sort((a, b) => b.s - a.s);
    ranked.slice(0, 2).forEach((r, i) => { tallies[r.n] = (tallies[r.n] || 0) + w * (i === 0 ? 1 : 0.45) * Math.max(0.2, r.s); });
  }
  const name = Object.entries(tallies).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!name) return null;
  const leaderPlan = planOf(state, al.leader);
  const reasonKey = targetScore(state, al.leader, name, leaderPlan, ctx).why;
  const reason = reasonKey;
  const theirPick = ctx.predict(name);
  const responses = {};
  for (const m of present) {
    if (m === al.leader) { responses[m] = 'organiser'; continue; }
    const own = outside.map(n => ({ n, s: targetScore(state, m, n, planOf(state, m), ctx).total })).sort((a, b) => b.s - a.s);
    const mine = own[0];
    const theirs = own.find(x => x.n === name)?.s ?? 0;
    const friend = protectOf(m, name) > 3 || coupleOf(state, m) === name || !!dealBetween(state, m, name)
      || planOf(state, m)?.core?.includes(name);
    const loyal = S(m, 'loyalty') / 10;
    if (friend) {
      // Protect the friend out loud, or lie about it.
      responses[m] = mayScheme(m) && S(m, 'strategic') >= 6 && rng() < 0.55 ? 'false-yes' : 'refuses';
    } else if (mine && mine.n !== name && mine.s - theirs > 2.2 - loyal * 1.2) {
      responses[m] = mayScheme(m) && rng() < 0.35 + S(m, 'strategic') * 0.03 ? 'false-yes' : 'reluctant';
    } else {
      responses[m] = 'yes';
    }
    if (responses[m] === 'false-yes') noteFalseYes(state, m, al.id);
    if (responses[m] === 'refuses') addBond(m, al.leader, -0.6);
  }
  const spotted = spotMeeting(state, al, present);
  const meeting = { alliance: al.id, name: al.name, organiser: al.leader, target: name, reason, reasonKey, expectedCallout: theirPick, responses, spotted };
  addScene(state, 'meeting', present, meeting, present, 'private');
  if (spotted.length) addScene(state, 'meeting-spotted', spotted, { alliance: al.id, present }, spotted, 'private');
  return meeting;
}

// ── 2. recruiting ────────────────────────────────────────────────────
function recruit(state, rng, meeting, al, eligible, committed, ctx) {
  const out = [];
  const votes = Object.values(meeting.responses).filter(r => r !== 'refuses').length;
  const need = Math.floor(state.active.length / 2) + 1 - votes;
  if (need <= 0) return out;
  const free = state.active.filter(n => !allianceOf(state, n) && !committed[n] && n !== meeting.target);
  const ranked = free.map(n => {
    // Approached by whoever in the group they trust most.
    const by = al.members.filter(m => state.active.includes(m)).sort((a, b) => trustOf(n, b) - trustOf(n, a))[0];
    return { n, by, pull: believePitch(n, by) + cooperateWith(n, al.leader) * 0.5 };
  // A couple of targeted asks, not a canvass of the whole house: the swing
  // votes this group can actually reach.
  }).filter(r => r.pull > 0).sort((a, b) => b.pull - a.pull).slice(0, Math.min(need, 2 + (S(al.leader, 'social') >= 7 ? 1 : 0)));
  for (const r of ranked) {
    const own = targetScore(state, r.n, meeting.target, planOf(state, r.n), ctx).total;
    const friend = protectOf(r.n, meeting.target) > 2.5;
    const p = logistic(r.pull * 0.35 + own * 0.25 - (friend ? 3 : 0));
    const roll = rng();
    let answer;
    if (friend && mayScheme(r.n) && roll < 0.4) answer = 'false-yes';
    else if (roll < p) answer = 'accepted';
    else if (roll < p + 0.2) answer = 'hanging';
    else answer = 'refused';
    if (answer === 'false-yes') noteFalseYes(state, r.n, al.id);
    out.push({ alliance: al.id, by: r.by, to: r.n, target: meeting.target, answer });
    addScene(state, 'recruit', [r.by, r.n], { alliance: al.id, target: meeting.target, answer }, [r.by, r.n], 'private');
  }
  return out;
}

// ── 3. campaigns ─────────────────────────────────────────────────────
function campaign(state, rng, { eligible, immune, meetings, committed }) {
  const out = [];
  // Expected votes against each eligible from what the room has committed.
  const against = {};
  for (const [v, c] of Object.entries(committed)) if (c.target) against[c.target] = (against[c.target] || 0) + 1;
  const danger = eligible.filter(n => (against[n] || 0) > 0).sort((a, b) => (against[b] || 0) - (against[a] || 0)).slice(0, 3);
  for (const n of danger) {
    const bold = S(n, 'boldness') / 10;
    // a) Out the alliance coming for them, if they know it exists.
    const hunting = meetings.find(m => m.target === n);
    const knownBloc = hunting && believedAlliances(state, n)[hunting.alliance];
    const huntingAl = hunting && state.alliances.find(a => a.id === hunting.alliance);
    if (hunting && knownBloc && !huntingAl.outed && rng() < 0.04 + bold * 0.16) {
      const al = huntingAl;
      al.outed = state.ep;
      outAlliance(state, al, n);
      for (const m of al.members) nudge(state, m, 'paranoia', 0.8);
      out.push({ kind: 'outing', from: n, alliance: al.id });
      addScene(state, 'outing', [n, al.leader], { alliance: al.id, name: al.name }, state.active, 'public');
      continue;
    }
    // b) A leverage threat.
    // A threat is worth making when you would actually win the fight, or you
    // are bold enough to bluff; and it loses force if you made one last time.
    const lastThreat = state.lastThreat?.[n] ?? -9;
    if (state.ep - lastThreat > 1 && rng() < (0.05 + bold * 0.2) * (0.6 + arenaRead(state, n) / 15)) {
      (state.lastThreat ||= {})[n] = state.ep;
      const pool = state.active.filter(x => state.division[x] === state.division[n] && !immune.includes(x) && x !== n);
      const at = expectedCallout(state, n, pool);
      if (at) {
        const credible = clamp(arenaRead(state, n) / 10 * 0.7 + bold * 0.3, 0, 1);
        out.push({ kind: 'threat', from: n, at, credible: +credible.toFixed(2), bluff: arenaBase(n) < 5.5 });
        intimidated(n, at, credible);
        addScene(state, 'leverage-threat', [n, at], { credible, bluff: arenaBase(n) < 5.5 }, state.active, 'public');
        continue;
      }
    }
    // c) A plea to the closest friend among the committed.
    const friend = Object.keys(committed).filter(v => committed[v].target === n && v !== n)
      .sort((a, b) => trustOf(b, n) - trustOf(a, n))[0];
    if (friend && trustOf(friend, n) > 1) {
      const moved = rng() < logistic(trustOf(friend, n) * 0.4 + S(n, 'social') * 0.15 - S(friend, 'loyalty') * 0.2 - 1);
      out.push({ kind: 'plea', from: n, to: friend, moved });
      if (moved) committed[friend] = { ...committed[friend], target: null, movedBy: n };
      addScene(state, 'plea', [n, friend], { moved }, state.active, 'public');
    }
  }
  return out;
}

// ── 4. volunteering ──────────────────────────────────────────────────
function volunteer(state, rng, eligible) {
  if (!state.fmt.volunteers) return null;
  const cands = eligible.map(c => {
    const plan = planOf(state, c);
    const target = (plan?.revenge || []).concat(plan?.targets || []).find(t => eligible.includes(t) && t !== c) || null;
    const edge = target ? arenaRead(state, c) - arenaRead(state, target) : 0;
    const w = (arenaRead(state, c) - 5.5) * 0.4 + S(c, 'boldness') * 0.14 + (state.psyche[c] === 'prove' ? 0.5 : 0)
      + (target ? grudgeOf(c, target) * 0.25 + edge * 0.3 : 0) + freeRide(state, c) * 0.9 + (state.rookie[c] ? 0.2 : 0);
    return { c, w, target };
  }).sort((a, b) => b.w - a.w);
  const top = cands[0];
  if (!top || rng() >= logistic(top.w - 3.4) * 0.5) return null;
  addScene(state, 'volunteer', [top.c].concat(top.target ? [top.target] : []), { target: top.target }, state.active, 'public');
  return { name: top.c, target: top.target };
}

export function deliberate(state, rng, { division, eligible, immune }) {
  const meetings = [];
  const committed = {};
  const ctx = { predict: predictor(state, eligible) };
  for (const al of activeAlliances(state)) {
    const m = meet(state, rng, al, eligible, ctx);
    if (!m) continue;
    meetings.push(m);
    for (const [v, r] of Object.entries(m.responses)) {
      if (r === 'refuses') continue;
      committed[v] = { target: m.target, via: `alliance:${al.id}`, response: r };
    }
  }
  const pitches = [];
  for (const m of meetings) {
    const al = state.alliances.find(a => a.id === m.alliance);
    for (const p of recruit(state, rng, m, al, eligible, committed, ctx)) {
      pitches.push(p);
      if (p.answer === 'accepted' || p.answer === 'false-yes') committed[p.to] = { target: p.target, via: `recruited:${al.id}`, response: p.answer === 'false-yes' ? 'false-yes' : 'yes' };
    }
  }
  const campaigns = campaign(state, rng, { eligible, immune, meetings, committed });
  const vol = volunteer(state, rng, eligible);
  // Everybody's position: their commitment, or their own read.
  const intents = {};
  const delib = { ctx, meetings, pitches, campaigns, committed, volunteer: vol, intents,
    threats: campaigns.filter(c => c.kind === 'threat'), targets: Object.fromEntries(meetings.map(m => [m.alliance, m.target])) };
  for (const v of state.active) intents[v] = committed[v]?.target ?? topChoice(state, rng, v, eligible, delib, null).target;
  // The hunted learn they are hunted (from what has spread).
  delib.hunted = Object.fromEntries(eligible.map(n => [n, believedHunters(state, n)]));
  return delib;
}

// ── the voter's read ─────────────────────────────────────────────────
export function voteTerms(state, v, t, eligible, delib, tally) {
  const plan = planOf(state, v);
  const strat = S(v, 'strategic') / 10, bold = S(v, 'boldness') / 10;
  const base = targetScore(state, v, t, plan, delib?.ctx || { predict: predictor(state, eligible) });
  const terms = { ...base.parts };
  terms.freeRide = freeRide(state, t) * 1.3;
  terms.power = breakThePower(state, v, t);
  // Fear: t resents v, and v could be the one t calls out.
  const callable = state.division[v] === state.division[t] && eligible.includes(v);
  const threatAt = (delib?.threats || []).find(x => x.from === t && x.at === v);
  // And the plain fear of somebody who keeps coming back from the Arena: the
  // ones they could call out think twice before sending them in again.
  terms.fear = -(grudgeOf(t, v) * (callable ? 0.5 : 0.15) * (arenaRead(state, t) / 10) * (1.2 - bold)
    + (threatAt ? threatAt.credible * 2.8 * (1.15 - bold) : 0)
    + fearOf(v, t) * (callable ? 0.45 : 0.12) * (1.1 - bold));
  terms.couple = coupleOf(state, v) === t ? -9 : 0;
  terms.deal = dealBetween(state, v, t) ? -2.4 * (0.3 + S(v, 'loyalty') / 10) : 0;
  terms.clique = state.origin[v] && state.origin[v] === state.origin[t] ? -0.9 * state.cliqueStrength : 0;
  const al = allianceOf(state, v);
  if (al && al.members.includes(t)) terms.ally = -3 * (0.3 + S(v, 'loyalty') / 10);
  if (tally) {
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    terms.bandwagon = total ? (tally[t] || 0) / total * (1 - bold) * (S(v, 'social') / 10) * 3.2 : 0;
  }
  return terms;
}

function topChoice(state, rng, v, eligible, delib, tally) {
  const rows = eligible.filter(t => t !== v).map(t => {
    const terms = voteTerms(state, v, t, eligible, delib, tally);
    return { target: t, terms, total: Object.values(terms).reduce((a, b) => a + b, 0) + noise(rng) * 0.35 };
  }).sort((a, b) => b.total - a.total);
  return rows[0] || { target: null };
}

// ── the vote ─────────────────────────────────────────────────────────
export function houseVote(state, rng, { eligible, delib, winners, exclude = [] }) {
  const pool = eligible.filter(n => !exclude.includes(n));
  const order = shuffle(rng, state.active);
  const tally = {};
  const ballots = [];
  for (const v of order) {
    const own = topChoice(state, rng, v, pool, delib, tally);
    const c = delib.committed[v];
    const told = delib.intents[v] && pool.includes(delib.intents[v]) ? delib.intents[v] : null;
    let target = own.target, why = 'own read';
    if (c && c.target && pool.includes(c.target) && c.response !== 'false-yes') {
      // Keeping your word, unless the room has visibly gone the other way and
      // you are the kind to follow it.
      const ownScore = own.total;
      const word = voteTerms(state, v, c.target, pool, delib, tally);
      const wordScore = Object.values(word).reduce((a, b) => a + b, 0) + 2 + S(v, 'loyalty') * 0.35;
      if (wordScore >= ownScore || own.target === c.target) { target = c.target; why = c.via.startsWith('alliance') ? 'the plan' : 'kept their word'; }
      else why = 'broke from the plan';
    } else if (c?.response === 'false-yes') {
      why = 'false yes';
    }
    if (!target) continue;
    tally[target] = (tally[target] || 0) + 1;
    const flip = told != null && told !== target;
    ballots.push({ voter: v, target, told, bond: +getBond(v, target).toFixed(2), wanted: Object.keys(own.terms || {}).length ? own.target : null,
      asked: c?.target || null, via: c?.via || null, flip, why: flip ? (why === 'own read' ? 'changed their mind' : why) : why,
      countBefore: Object.values(tally).reduce((a, b) => a + b, 0) - 1 });
  }
  const max = Math.max(0, ...Object.values(tally));
  const tied = Object.keys(tally).filter(n => tally[n] === max);
  let votedIn = tied[0] || null, tiebreak = null;
  if (tied.length > 1) {
    const breakers = winners.filter(w => state.active.includes(w));
    if (breakers.length) {
      const score = {};
      for (const b of breakers) for (const t of tied) score[t] = (score[t] || 0) + Object.values(voteTerms(state, b, t, pool, delib, null)).reduce((a, x) => a + x, 0);
      votedIn = [...tied].sort((a, b) => score[b] - score[a])[0];
      tiebreak = { by: breakers, chose: votedIn, between: tied };
    } else {
      votedIn = tied[Math.floor(rng() * tied.length)];
      tiebreak = { by: [], chose: votedIn, between: tied, draw: true };
    }
  }
  return { order, ballots, tally, votedIn, tied: tied.length > 1, tiebreak };
}

// ── what every ballot costs, out loud ────────────────────────────────
export function voteFallout(state, vote, delib) {
  for (const b of vote.ballots) {
    const t = b.target;
    state.rec[t].votesReceived++;
    nudge(state, t, 'paranoia', 0.35);
    const friend = getBond(b.voter, t) >= 3;
    addBond(b.voter, t, friend ? -1.4 : -0.5);
    if (t === vote.votedIn) votedFor(b.voter, t, { friend });
    else remember(t, b.voter, 'voted-for-me', 0.8);
    if (friend) state.guilt[b.voter] = { ...(state.guilt[b.voter] || {}), [t]: (state.guilt[b.voter]?.[t] || 0) + 1 };
    const deal = dealBetween(state, b.voter, t);
    if (deal) breakDeal(state, deal, b.voter, 'vote');
    // A false yes, exposed by the open vote: the alliance sees it happen.
    if (b.why === 'false yes' || b.why === 'broke from the plan') {
      const al = state.alliances.find(a => !a.ended && a.members.includes(b.voter));
      if (al) {
        for (const m of al.members) if (m !== b.voter) { addBond(m, b.voter, -1.2); remember(m, b.voter, 'alliance-betrayal', 1.8); }
        if (rng01(state, b.voter) < 0.55) leave(state, al, b.voter, 'exposed');
      }
    }
  }
  // The tiebreakers decided someone's fate in public.
  if (vote.tiebreak?.by?.length) {
    for (const t of vote.tiebreak.between) if (t !== vote.votedIn) for (const by of vote.tiebreak.by) remember(t, by, 'saved-me', 1);
  }
}

const rng01 = (state, key) => {
  let h = 2166136261;
  for (const ch of `${state.seed}|${state.ep}|${key}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};

export function breakDeal(state, deal, by, how) {
  deal.broken = { by, how, ep: state.ep };
  const other = deal.a === by ? deal.b : deal.a;
  betrayed(other, by, 1, 'deal-broken');
  addScene(state, 'deal-broken', [by, other], { deal: deal.id, how }, state.active, 'public');
}


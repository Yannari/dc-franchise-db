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
import { S, mayScheme, addScene, noise, shuffle, logistic, clamp, weighted } from './state.js';
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
// The people in danger work the room. The one most in danger makes two or three moves, the others one or
// two (a social player gets an extra one); each move is chosen by who they are:
//   outing        name the alliance coming for them, in front of everybody (bold, and they know it exists)
//   threat        "put me in and I'm calling YOU out" — a PROMISE, held against them at the call-out
//                 (callout.js); a broken one costs their word, and the next threat is doubted (state.word)
//   counter       "not me, them": name somebody else and make the case to the soft votes (strategic)
//   spare         a quiet offer to one voter they could call out: "don't vote me, and I won't pick you"
//                 (a deal; voting them anyway, or calling the voter out, breaks it in public)
//   plea          ask a friend who is voting for them to stop (social; one per friend)
//   quiet         keep their head down
const wordOf = (state, n) => state.word?.[n] || 0;

// The name a player in danger would put up instead: somebody the soft votes could accept, who is not their friend.
function altFor(state, n, eligible, soft, ctx) {
  const rows = eligible.filter(x => x !== n && protectOf(n, x) < 2.5 && coupleOf(state, n) !== x).map(x => ({ x,
    s: soft.reduce((t, v) => t + (v === x ? 0 : targetScore(state, v, x, planOf(state, v), ctx).total), 0) / Math.max(1, soft.length)
      + grudgeOf(n, x) * 0.5 - protectOf(n, x) * 0.2 }));
  return rows.sort((a, b) => b.s - a.s)[0]?.x || null;
}

function campaign(state, rng, { eligible, immune, meetings, committed, ctx }) {
  const out = [];
  // Expected votes against each eligible from what the room has committed.
  const against = {};
  for (const [v, c] of Object.entries(committed)) if (c.target) against[c.target] = (against[c.target] || 0) + 1;
  const danger = eligible.filter(n => (against[n] || 0) > 0).sort((a, b) => (against[b] || 0) - (against[a] || 0)).slice(0, 3);
  for (const [i, n] of danger.entries()) {
    const bold = S(n, 'boldness') / 10, strat = S(n, 'strategic') / 10, social = S(n, 'social') / 10;
    const done = new Set();
    const moves = 1 + (i === 0 ? 1 : 0) + (rng() < social * 0.6 ? 1 : 0);
    for (let k = 0; k < moves; k++) {
      const opts = [];
      // a) the outing
      const hunting = meetings.find(m => m.target === n);
      const huntingAl = hunting && state.alliances.find(a => a.id === hunting.alliance);
      if (hunting && believedAlliances(state, n)[hunting.alliance] && !huntingAl?.outed && !done.has('outing'))
        opts.push({ kind: 'outing', w: 0.06 + bold * 0.3 });
      // b) the threat: worth making when you would win the fight, or you are bold enough to bluff; not two weeks running
      const lastThreat = state.lastThreat?.[n] ?? -9;
      const pool = state.active.filter(x => state.division[x] === state.division[n] && !immune.includes(x) && x !== n);
      if (state.ep - lastThreat > 1 && !done.has('threat') && pool.length)
        opts.push({ kind: 'threat', w: (0.08 + bold * 0.4) * (0.6 + arenaRead(state, n) / 15) * (wordOf(state, n) < 0 ? 0.5 : 1) });
      // c) the counter-pitch: a name instead of theirs, to the votes that are not locked in
      const soft = state.active.filter(v => v !== n && (!committed[v]?.target || (committed[v].target === n && committed[v].response === 'reluctant')));
      if (!done.has('counter') && soft.length) opts.push({ kind: 'counter', w: 0.04 + strat * 0.3, soft });
      // d) the quiet offer: to a voter on them who they could call out
      const spareTo = Object.keys(committed).filter(v => committed[v].target === n && pool.includes(v) && !dealBetween(state, n, v))
        .sort((x, y) => (trustOf(y, n) + fearOf(y, n)) - (trustOf(x, n) + fearOf(x, n)))[0];
      if (!done.has('spare') && spareTo) opts.push({ kind: 'spare', w: 0.04 + strat * 0.16 + social * 0.08, to: spareTo });
      // e) a plea, to each friend still voting for them
      for (const f of Object.keys(committed).filter(v => committed[v].target === n && v !== n && !done.has(`plea:${v}`) && trustOf(v, n) > 1))
        opts.push({ kind: 'plea', w: (0.2 + social * 0.5) * Math.min(1.5, trustOf(f, n) / 2), to: f });
      opts.push({ kind: 'quiet', w: 0.12 + (1 - bold) * 0.2 + k * 0.15 });
      const pick = weighted(rng, opts.map(o => ({ item: o, w: o.w })));
      if (pick.kind === 'quiet') break;
      done.add(pick.kind === 'plea' ? `plea:${pick.to}` : pick.kind);
      if (pick.kind === 'outing') {
        const al = huntingAl;
        al.outed = state.ep;
        outAlliance(state, al, n);
        for (const m of al.members) nudge(state, m, 'paranoia', 0.8);
        out.push({ kind: 'outing', from: n, alliance: al.id });
        addScene(state, 'outing', [n, al.leader], { alliance: al.id, name: al.name }, state.active, 'public');
        break;
      }
      if (pick.kind === 'threat') {
        const at = expectedCallout(state, n, pool);
        if (!at) continue;
        (state.lastThreat ||= {})[n] = state.ep;
        // An empty threat last time is remembered: the word is part of the credibility.
        const word = wordOf(state, n);
        const credible = clamp(arenaRead(state, n) / 10 * 0.7 + bold * 0.3 + word * 0.12, 0, 1);
        const bluff = arenaBase(n) < 5.5;
        (state.promises ||= {})[n] = { at, ep: state.ep, credible: +credible.toFixed(2), bluff };
        out.push({ kind: 'threat', from: n, at, credible: +credible.toFixed(2), bluff, doubted: word < 0 });
        intimidated(n, at, credible);
        addScene(state, 'leverage-threat', [n, at], { credible, bluff, doubted: word < 0, word }, state.active, 'public');
        continue;
      }
      if (pick.kind === 'counter') {
        const alt = altFor(state, n, eligible, pick.soft, ctx);
        if (!alt) continue;
        // The case is made to the room, and three of the soft votes take it in.
        const heard = [...pick.soft].filter(v => v !== alt).sort((x, y) => trustOf(y, n) - trustOf(x, n)).slice(0, 3);
        const moved = [], held = [];
        for (const v of heard) {
          const own = targetScore(state, v, alt, planOf(state, v), ctx).total;
          const p = logistic(trustOf(v, n) * 0.3 + S(n, 'social') * 0.12 + S(n, 'strategic') * 0.08 + own * 0.25 - protectOf(v, alt) * 0.4 - 1.6);
          if (rng() < p) { moved.push(v); committed[v] = { target: alt, via: `counter:${n}`, response: 'yes' }; } else held.push(v);
        }
        // The name said out loud is somebody who now knows who said it.
        addBond(alt, n, -1);
        remember(alt, n, 'named-me', moved.length ? 1.4 : 0.8);
        nudge(state, alt, 'paranoia', 0.6);
        out.push({ kind: 'counter', from: n, alt, moved, held });
        addScene(state, 'counter-pitch', [n, alt, ...(moved[0] ? [moved[0]] : held[0] ? [held[0]] : [])], { alt, moved, held }, state.active, 'public');
        continue;
      }
      if (pick.kind === 'spare') {
        const v = pick.to;
        // The offer is worth what n's Arena record is worth to v, and what v owes the plan.
        const al = allianceOf(state, v);
        const fearsIt = arenaRead(state, n) / 10;
        const p = logistic(fearsIt * 2.4 + trustOf(v, n) * 0.25 + fearOf(v, n) * 0.3 - (al ? S(v, 'loyalty') * 0.18 : 0) - 1);
        let answer = rng() < p ? 'accepted' : 'refused';
        // A schemer says yes and votes them anyway (the audience knows; the open vote will show it).
        if (answer === 'refused' && mayScheme(v) && S(v, 'strategic') >= 6 && rng() < 0.45) answer = 'false';
        if (answer !== 'refused') state.deals.push({ id: state.deals.length + 1, a: n, b: v, ep: state.ep, broken: null, tier: 'spare' });
        if (answer === 'accepted') committed[v] = { target: null, via: `spare:${n}`, response: 'spared' };
        if (answer === 'false') noteFalseYes(state, v, `spare:${n}`);
        out.push({ kind: 'spare', from: n, to: v, answer });
        addScene(state, 'spare-deal', [n, v], { answer }, answer === 'false' ? [n, v] : [n, v], 'private');
        continue;
      }
      if (pick.kind === 'plea') {
        const friend = pick.to;
        const moved = rng() < logistic(trustOf(friend, n) * 0.4 + S(n, 'social') * 0.15 - S(friend, 'loyalty') * 0.2 - 1);
        out.push({ kind: 'plea', from: n, to: friend, moved });
        if (moved) committed[friend] = { ...committed[friend], target: null, movedBy: n };
        addScene(state, 'plea', [n, friend], { moved }, state.active, 'public');
      }
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

// The house talks it out before the vote, in front of everybody (the real show's deliberation: a name said
// out loud, the target answering, somebody objecting, "this is the game"). Built from what deliberation
// decided: the biggest group's organiser proposes, one of their yeses backs it, the target answers, and a
// friend of the target (or somebody who wanted another name) objects.
export function houseDebate(state, delib, eligible) {
  const big = [...(delib.meetings || [])].filter(m => m.target && eligible.includes(m.target) && state.active.includes(m.organiser))
    .sort((x, y) => Object.keys(y.responses || {}).length - Object.keys(x.responses || {}).length)[0];
  if (!big) return null;
  const target = big.target, a = big.organiser;
  const yes = Object.entries(big.responses || {}).filter(([n, v]) => v === 'yes' && n !== a && n !== target && state.active.includes(n)).map(([n]) => n);
  const d = yes.sort((x, y) => getBond(a, y) - getBond(a, x))[0] || null;
  const intents = delib.intents || {};
  const objectors = state.active.filter(n => n !== a && n !== target && n !== d && intents[n] && intents[n] !== target)
    .sort((x, y) => getBond(target, y) - getBond(target, x));
  const c = objectors[0] || null;
  if (!c) return null;
  const alt = intents[c] && intents[c] !== target && eligible.includes(intents[c]) && intents[c] !== c ? intents[c] : null;
  const who = [a, target, c, ...(d ? [d] : [])];
  return addScene(state, 'house-debate', who, { target, alt, organiser: a }, state.active, 'deliberation');
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
  const campaigns = campaign(state, rng, { eligible, immune, meetings, committed, ctx });
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
    } else if (c?.response === 'spared') {
      why = 'kept the deal';
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


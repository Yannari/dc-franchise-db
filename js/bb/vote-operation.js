// The vote as an operation, not a tally.
//
// The week's voting mechanics existed — initial preferences, an alliance nudge,
// a bandwagon — but they ran as ballot arithmetic: silent mutations applied in
// a fixed order, with only the CHANGED ballots recorded. Nothing showed people
// building a vote: nobody organised a meeting, nobody was asked and refused,
// nobody said yes and meant no. A blindside is people fighting over a count,
// and none of the fighting was anywhere.
//
// This module runs the middle of the week as the show describes it: each
// alliance that can field votes settles on a name (organiser, target, reason —
// and EVERY member's response, not just the moved ones), a voter claimed by two
// rooms is resolved to the stronger claim, plans that are short go recruiting
// among the unaffiliated with named approaches that can be accepted, refused,
// left hanging — or agreed to falsely, which is the one outcome the audience
// gets to know and the house does not.
//
// It runs BEFORE the nominees campaign, so a campaign is fought against real
// plans rather than against loose individual reads, and the final forecast is
// taken AFTER everything has moved — which fixes the two timing bugs this
// replaces: `stated` used to be written down after the campaign had already
// flipped ballots (so a flipped vote read as never having moved), and the
// blindside "truth" was counted before the blocs whipped (so the count the
// verdict judged people against was a count that no longer existed).
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { tacticalCooperation } from '../relationships.js';
import { bbAllianceStrength } from './shared-strategy.js';
import { dealBetween, sincerityOf, tierOf } from './deals.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const noise = (rng, amount = 1) => (rng() - 0.5) * amount;
const archetype = name => players.find(player => player.name === name)?.archetype || 'floater';

// Deterministic per-context line pick, same discipline as strategyText: the
// argument a recruiter makes should not reroll on re-render.
const opText = (lines, ...salt) => {
  const key = `${gs.episode || 0}|${salt.filter(Boolean).join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return lines[hash % lines.length];
};

/**
 * Why this alliance wants this name. Stored as prose because it IS prose — the
 * sentence the organiser says in the room, and the sentence the screen shows.
 */
function planReason(alliance, target, protectedMember, hoh) {
  if (protectedMember) return opText([
    `${protectedMember} is one of ours — the vote goes the other way.`,
    `keeping ${protectedMember} means every one of us writes ${target}'s name.`,
    `${protectedMember} sits on the block, so this is not a debate, it is a headcount.`,
    `the group protects its own: ${protectedMember} stays, ${target} goes.`,
  ], alliance, target, 'protect');
  if (hoh && (alliance.members || []).includes(hoh)) return opText([
    `the Head of Household built this week for exactly this vote.`,
    `${hoh} put the nominations up for a reason, and the room finishes the job.`,
    `this is ${hoh}'s week — the alliance delivers the vote the nominations asked for.`,
    `backing the HOH's plan is the whole point of having one in power.`,
  ], alliance.name, target, 'hoh');
  return opText([
    `${target} is the bigger threat to everybody in this room.`,
    `${target} has more ways to win than anyone here is comfortable with.`,
    `of the two names on the block, ${target} is the one who comes after this group next.`,
    `nobody in the room trusts where ${target}'s vote lands next week.`,
  ], alliance.name, target, 'threat');
}

/** The argument a recruiter actually makes to one specific outsider. */
function approachArgument(recruiter, voter, target, keeping) {
  return opText([
    `${recruiter} walks ${voter} through the math: the votes for ${target} are already there, and being one of them is safer than being outside them.`,
    `${recruiter} tells ${voter} that ${target} has said ${voter}'s name — true or not, it is the argument that works.`,
    `${recruiter} offers ${voter} a week of cover: vote with the group on ${target} and nobody in it writes ${voter}'s name for a while.`,
    `${recruiter} keeps it simple with ${voter}: ${keeping} will remember who kept them, and ${target} will not be here to remember anything.`,
    `${recruiter} asks ${voter} where they think the house is landing, lets the silence sit, and then says ${target}'s name like it is already decided.`,
    `${recruiter} does not pitch ${voter} so much as warn them: this vote is happening, and the only question is whether ${voter} is on the record with it.`,
  ], recruiter, voter, target, 'approach');
}

/**
 * Steps 2–6 of the operation: alliance meetings, member responses, ballot
 * ownership, the count, and recruitment. Mutates ballots the way the old
 * bloc pass did — but records everything, not just the changes.
 *
 * Returns { plans, independents, moves } and stamps each ballot with the
 * four-stage chain the eviction can replay: `preference` (set by the caller
 * at creation), `assignment` (which room claimed the ballot and for whom),
 * `stated` (the position they gave the house — a liar's differs from the
 * ballot), and `evict` (where it actually is right now).
 */
export function runVoteOperation({ ballots = [], nominees = [], hoh = null, commitments = new Map(), rng = Math.random } = {}) {
  const empty = { plans: [], independents: [], moves: [] };
  if (ballots.length < 2 || nominees.length < 2) {
    ballots.forEach(b => { b.stated = b.evict; });
    return empty;
  }
  const voters = ballots.map(b => b.voter);
  const majority = Math.floor(voters.length / 2) + 1;
  const ballotOf = new Map(ballots.map(b => [b.voter, b]));

  // ── Step 2: the meetings. Every alliance that can field two votes holds one.
  const alliances = (gs.namedAlliances || []).filter(a => a.active !== false && Array.isArray(a.members));
  const plans = [];
  for (const alliance of alliances) {
    const inside = alliance.members.filter(m => ballotOf.has(m));
    if (inside.length < 2) continue;
    const protectedMember = nominees.find(n => alliance.members.includes(n)) || null;
    // The bloc protects its own; failing that, it goes after whichever nominee
    // the room already leans against, so the meeting ratifies the mood rather
    // than inventing one.
    let target = protectedMember ? nominees.find(n => n !== protectedMember)
      : nominees.find(n => !alliance.members.includes(n));
    if (!target) continue;
    if (!protectedMember) {
      const lean = nominees.filter(n => !alliance.members.includes(n))
        .map(n => ({ n, count: inside.filter(v => ballotOf.get(v).evict === n).length }))
        .sort((a, b) => b.count - a.count);
      if (lean.length > 1 && lean[0].count > lean[1].count) target = lean[0].n;
    }
    // The organiser is whoever in the room actually runs rooms.
    const organizer = inside.slice().sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.strategic + sb.social * 0.3) - (sa.strategic + sa.social * 0.3);
    })[0];
    plans.push({
      alliance: alliance.name || 'an alliance',
      organizer, target,
      keeping: nominees.find(n => n !== target) || null,
      reason: planReason(alliance.name || 'the group', target, protectedMember, hoh),
      members: inside, protectedMember,
      stances: [], approaches: [], outsideSupport: [],
      committed: 0, locked: 0, needed: 0, expected: 0, majority,
    });
  }

  // ── Step 6 first, because it decides step 3: a voter claimed by two rooms
  // belongs to the one they are actually closer to. The loser finds out at
  // the vote, which is how alliances discover they overlap.
  const ownerOf = new Map();
  for (const voter of voters) {
    const claims = plans.filter(p => p.members.includes(voter));
    if (!claims.length) continue;
    const strength = plan => plan.members.filter(m => m !== voter)
      .reduce((sum, m) => sum + bbAllianceStrength(voter, m) + Math.max(0, getPerceivedBond(voter, m)) * 0.3, 0)
      / Math.max(1, plan.members.length - 1);
    claims.sort((a, b) => strength(b) - strength(a));
    ownerOf.set(voter, claims[0]);
    // Same target twice is overlap without conflict; different targets is the
    // kind of crack a week turns on, and both rooms get to know they had it.
    for (const losing of claims.slice(1)) {
      if (losing.target !== claims[0].target) {
        losing.stances.push({ voter, stance: 'elsewhere', with: claims[0].alliance });
      }
    }
  }

  // ── Step 3: every owned member answers the room, and the answer is recorded
  // whether or not the ballot moves.
  const moves = [];
  for (const plan of plans) {
    for (const voter of plan.members) {
      if (ownerOf.get(voter) !== plan) continue;
      const ballot = ballotOf.get(voter);
      const c = commitments.get(voter);
      const strength = c?.strength ?? 0.4;
      if (ballot.evict === plan.target) {
        plan.stances.push({ voter, stance: strength >= 0.6 ? 'dependable' : 'leaning' });
        ballot.assignment = { by: plan.alliance, target: plan.target, kind: 'bloc' };
        continue;
      }
      // A firm commitment elsewhere beats the room — that crack is the story.
      if (strength >= 0.6) { plan.stances.push({ voter, stance: 'refusing' }); continue; }
      // An endgame deal with the target makes the move cost something; they go
      // with the room, but the room can see the hesitation.
      const dealWithTarget = dealBetween(voter, plan.target);
      const torn = dealWithTarget && sincerityOf(dealWithTarget, voter) > 0.4;
      ballot.evict = plan.target;
      ballot.changed = true;
      ballot.blocMove = plan.alliance;
      ballot.assignment = { by: plan.alliance, target: plan.target, kind: 'bloc' };
      plan.stances.push({ voter, stance: torn ? 'conflicted' : 'pulled' });
      moves.push({ voter, target: plan.target, alliance: plan.alliance });
    }
    // ── Step 4: the count, taken honestly. Locked votes are the ones the room
    // could take to the bank; committed adds the ones that merely said yes.
    plan.locked = plan.stances.filter(s => s.stance === 'dependable').length;
    plan.committed = plan.stances.filter(s => ['dependable', 'leaning', 'pulled', 'conflicted'].includes(s.stance)).length;
    plan.needed = Math.max(0, majority - plan.committed);
  }

  // ── Step 5: recruitment. Plans that are short go to the unaffiliated —
  // loosest first, because everybody in the house knows who is movable.
  const unaffiliated = voters.filter(v => !ownerOf.has(v));
  const approached = new Set();
  for (const plan of plans.slice().sort((a, b) => b.committed - a.committed)) {
    // Outside voters already on the plan's side count without being asked —
    // and get recorded, because a count that ignores them reads as wrong.
    for (const voter of unaffiliated) {
      if (ballotOf.get(voter).evict === plan.target && !approached.has(voter)) {
        plan.outsideSupport.push(voter);
      }
    }
    // The room counts the outsiders already with it before calling itself
    // short — a plan two votes over the line does not go recruiting.
    plan.needed = Math.max(0, majority - plan.committed - plan.outsideSupport.length);
    if (!plan.needed) { plan.expected = plan.committed + plan.outsideSupport.length; continue; }
    const recruiters = plan.members
      .filter(m => ownerOf.get(m) === plan)
      .sort((a, b) => pStats(b).social - pStats(a).social);
    const pool = unaffiliated
      .filter(v => !approached.has(v) && ballotOf.get(v).evict !== plan.target)
      .sort((a, b) => (commitments.get(a)?.strength ?? 0.4) - (commitments.get(b)?.strength ?? 0.4));
    for (const voter of pool.slice(0, plan.needed + 1)) {
      const recruiter = recruiters[plan.approaches.length % Math.max(1, recruiters.length)] || plan.organizer;
      approached.add(voter);
      const ballot = ballotOf.get(voter);
      const rStats = pStats(recruiter);
      const vStats = pStats(voter);
      const strength = commitments.get(voter)?.strength ?? 0.4;
      // Whether the ask lands is tacticalCooperation, not friendship: a voter
      // can distrust the recruiter personally and still respect the plan
      // enough to be one vote of it — and can like them fine while resenting
      // them too much to cooperate. The bond stays as a smaller term because
      // people do also just say yes to their friends.
      const persuade = rStats.social * 0.35 + rStats.strategic * 0.2
        + tacticalCooperation(voter, recruiter) * 0.45
        + Math.max(0, getPerceivedBond(voter, recruiter)) * 0.25 + noise(rng, 3);
      const resist = strength * 6 + vStats.loyalty * 0.15 + vStats.intuition * 0.1;
      const argument = approachArgument(recruiter, voter, plan.target, plan.keeping);
      let outcome;
      if (persuade > resist) {
        outcome = 'agrees';
        ballot.evict = plan.target;
        ballot.changed = true;
        ballot.recruitedBy = recruiter;
        ballot.assignment = { by: plan.alliance, target: plan.target, kind: 'recruited', recruiter };
        moves.push({ voter, target: plan.target, alliance: plan.alliance });
      } else {
        // Saying no to a room takes something. The alternative is saying yes
        // and voting your own way — proportional to how a person plays, never
        // a threshold: the strategic and the disloyal lie more, and villains
        // lie for sport.
        const arch = archetype(voter);
        const archLie = { villain: 0.18, mastermind: 0.15, schemer: 0.15, 'chaos-agent': 0.1, wildcard: 0.06 }[arch] || 0;
        const lieChance = clamp(vStats.strategic * 0.05 + (10 - vStats.loyalty) * 0.045 + archLie, 0, 0.6);
        if (rng() < lieChance) {
          outcome = 'lies';
          ballot.lied = plan.target;   // what they SAY; the ballot stays theirs
        } else {
          outcome = Math.abs(persuade - resist) < 1.2 ? 'undecided' : 'refuses';
        }
      }
      plan.approaches.push({ recruiter, voter, argument, outcome });
    }
    // ── What the room BELIEVES it has: everyone who said yes, including the
    // ones who did not mean it. The gap between expected and real is the
    // blindside, measured.
    plan.expected = plan.committed + plan.outsideSupport.length
      + plan.approaches.filter(a => a.outcome === 'agrees' || a.outcome === 'lies').length;
  }

  // ── The stated position. Taken HERE — after the rooms have settled, before
  // the nominees campaign — so a campaign flip is visible as a flip, and a
  // liar's public position is the lie.
  ballots.forEach(ballot => { ballot.stated = ballot.lied || ballot.evict; });

  // ── The people no room owns and nobody moved: the swing of the house,
  // recorded with their own read so the screen can show votes that belong to
  // a person rather than a plan.
  const independents = voters
    .filter(v => !ownerOf.has(v) && !ballotOf.get(v).recruitedBy)
    .map(voter => {
      const ballot = ballotOf.get(voter);
      const c = commitments.get(voter);
      const refused = plans.some(p => p.approaches.some(a => a.voter === voter && (a.outcome === 'refuses' || a.outcome === 'undecided')));
      const lying = !!ballot.lied;
      const endgame = c?.endgameDeal ? tierOf(c.endgameDeal) : null;
      return {
        voter, evict: ballot.evict, strength: c?.strength ?? 0.4,
        promised: !!c?.promised, endgame, refused, lying,
        conflicted: plans.filter(p => p.members.includes(voter)).length > 1,
      };
    });

  return { plans, independents, moves, majority };
}

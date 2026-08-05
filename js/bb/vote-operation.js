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
import { tacticalCooperation, getRelationshipDimensions, addRelationshipDimension, targetProtection } from '../relationships.js';
import { rememberStrategy } from '../strategy-memory.js';
import { listBlocs, learnAbout } from './blocs.js';
import { bbAllianceStrength, bbThreat, getBBTarget } from './shared-strategy.js';
import { dealBetween, sincerityOf, tierOf } from './deals.js';
import { socialDrag } from './punishments.js';

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
export function runVoteOperation({ ballots = [], nominees = [], hoh = null,
  commitments = new Map(), rng = Math.random, week = 0 } = {}) {
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
        + Math.max(0, getPerceivedBond(voter, recruiter)) * 0.25 + noise(rng, 3)
        // Nobody takes the room seriously while it is dressed as an egg.
        - socialDrag(recruiter, week);
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

/**
 * Step 9's opening act: the final pleas, with mechanics.
 *
 * The pleas rendered after the ballots were already decided, which made them
 * scenery — a speech that cannot move a vote is not a plea, it is a eulogy.
 * This resolves them where the show does: after the campaigns, the rooms and
 * the bandwagon have settled, and immediately before the tally.
 *
 * Restraint is the design constraint. Real pleas move zero votes most weeks
 * and one vote sometimes; a house-wide flip from a speech is fiction. Firm
 * commitments and endgame deals barely hear the speech; the loose, the
 * conflicted and the unowned are who a plea is actually for.
 *
 * Each nominee gets a STRUCTURED record — argument type, voice, the facts the
 * argument leans on and whether the state actually supports them, and one
 * response per eligible voter. The eviction screen renders its speech FROM
 * this record, so the words on screen and the mechanics that moved (or did
 * not move) the room can never be two different pleas.
 */
export function resolveFinalPleas({ nominees = [], ballots = [], hoh = null, week = null, commitments = new Map(), rng = Math.random } = {}) {
  if (nominees.length !== 2 || !ballots.length) return [];
  ballots.forEach(b => { b.prePleaEvict = b.evict; });
  const weekNum = week?.num || (gs.episode || 0) + 1;
  const plan = week?.plan || {};
  const stats = name => { try { return pStats(name); } catch { return {}; } };
  const suspicionOf = (a, b) => gs.bb?.house?.suspicion?.[`${a}→${b}`] || 0;
  const bumpSuspicion = (a, b, d) => {
    gs.bb ||= {};
    gs.bb.house ||= { suspicion: {}, targets: {}, memories: {}, eventHistory: [] };
    gs.bb.house.suspicion ||= {};
    const key = `${a}→${b}`;
    gs.bb.house.suspicion[key] = clamp((gs.bb.house.suspicion[key] || 0) + d, 0, 10);
  };

  const records = nominees.map(speaker => {
    const other = nominees.find(n => n !== speaker);
    const s = stats(speaker);
    const arch = archetype(speaker);
    const rec = gs.bb?.stats?.[speaker] || {};
    const comps = (rec.hohWins || 0) + (rec.vetoWins || 0) + (rec.blockBusterWins || 0);
    const blockCount = rec.timesOnTheBlock || 0;

    // ── The argument, in the same priority order the speech pools use ──
    const showmance = (gs.showmances || [])
      .find(sh => sh.phase !== 'broken-up' && !sh.broken && (sh.players || []).includes(speaker)) || null;
    const partner = showmance?.players?.find(n => n !== speaker) || null;
    const partnerVotes = !!partner && ballots.some(b => b.voter === partner);
    const allies = [...new Set((gs.namedAlliances || [])
      .filter(a => a.active !== false && (a.members || []).includes(speaker))
      .flatMap(a => a.members.filter(m => m !== speaker)))]
      .filter(ally => ballots.some(b => b.voter === ally));
    let threat = 0;
    try { threat = bbThreat(speaker); } catch { threat = 0; }
    const argumentType = partnerVotes ? 'showmance'
      : plan.pawn === speaker ? 'pawn-promise'
      : plan.backdoorTarget === speaker ? 'backdoor-warning'
      : plan.target === speaker ? 'target-warning'
      : (threat >= 7 || comps >= 2) ? 'competition-shield'
      : blockCount >= 3 ? 'repeat-nominee'
      : allies.length ? 'alliance-loyalty'
      : 'personal';

    // ── The voice, mirrored from the speech selector ──
    const forceful = (s.boldness || 5) >= 7
      || ['challenge-beast', 'hothead', 'chaos-agent', 'wildcard', 'villain'].includes(arch);
    const reserved = (s.social || 5) <= 4 || ['goat', 'underdog'].includes(arch);
    const loyal = (s.loyalty || 5) >= 7
      || ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer'].includes(arch);
    const voice = forceful ? 'forceful' : reserved ? 'reserved' : loyal ? 'loyal' : 'strategic';

    // ── The facts the argument leans on, each checked against the state ──
    const factsUsed = [];
    if (argumentType === 'pawn-promise') factsUsed.push({
      claim: 'was promised safety as the pawn',
      supported: week?.pawnAsk?.pawn === speaker || (gs.sideDeals || []).some(d => d.active !== false
        && d.type === 'safety' && (d.players || []).includes(speaker)),
    });
    if (argumentType === 'backdoor-warning') factsUsed.push({
      claim: 'this week was built as a backdoor',
      supported: plan.backdoorTarget === speaker || week?.vetoDecision?.replacement === speaker,
    });
    if (argumentType === 'target-warning') factsUsed.push({
      claim: 'a group is finishing a plan tonight',
      supported: (week?.voteOperation?.plans || []).some(p => p.target === speaker),
    });
    if (argumentType === 'competition-shield') factsUsed.push({
      claim: `has won ${comps} competitions`, supported: comps >= 1 || threat >= 7,
    });
    // A liar embellishes. Proportional to how the person plays — never a
    // threshold, and never free: an unsupported claim persuades until an
    // intuitive voter catches it, and then it costs more than it bought.
    const lieChance = clamp((s.strategic || 5) * 0.04 + (10 - (s.loyalty || 5)) * 0.04
      + ({ villain: 0.15, schemer: 0.12, mastermind: 0.12, 'chaos-agent': 0.08 }[arch] || 0), 0, 0.55);
    if (rng() < lieChance) {
      factsUsed.push({ claim: `the votes to keep ${speaker} are already there`, supported: false });
    }
    // A strategic speaker may expose a REAL deal the other nominee holds —
    // true, damaging, and the exposed voter does not thank them for it.
    let exposedVoter = null;
    if ((argumentType === 'target-warning' || argumentType === 'backdoor-warning')
      && rng() < (s.strategic || 5) * 0.05) {
      const held = ballots.map(b => b.voter).find(v => {
        const deal = dealBetween(other, v);
        return deal && sincerityOf(deal, other) > 0.4;
      });
      if (held) {
        exposedVoter = held;
        factsUsed.push({ claim: `${other} is protected by a deal with ${held}`, supported: true, exposes: held });
      }
    }

    return {
      speaker, argumentType, voice, factsUsed,
      eligibleListeners: ballots.map(b => b.voter),
      responses: [], variantKey: `${weekNum}|${speaker}|${argumentType}|${voice}`,
      other, exposedVoter, threat, comps, blockCount,
      partner: partnerVotes ? partner : null, allies,
    };
  });

  // ── Every voter answers every plea, independently ──
  for (const record of records) {
    const { speaker, other } = record;
    const s = stats(speaker);
    const unsupported = record.factsUsed.filter(f => !f.supported);
    for (const ballot of ballots) {
      const voter = ballot.voter;
      const v = stats(voter);
      const dims = getRelationshipDimensions(voter, speaker);
      const c = commitments.get(voter);
      const strength = c?.strength ?? 0.4;

      // An intuitive voter catches an unsupported claim, and the plea dies
      // with it — for THIS voter. Catching is private; the room does not gasp.
      const caught = unsupported.length > 0
        && rng() < clamp((v.intuition || 5) * 0.075 + (v.strategic || 5) * 0.035, 0, 0.8);

      // Does keeping the speaker actually serve this voter's game?
      const benefit = Math.max(0, -getPerceivedBond(voter, other)) * 0.3
        + (getBBTarget(voter) === other ? 2 : 0);

      const persuade = (s.social || 5) * 0.28 + (s.strategic || 5) * 0.14
        + (record.voice === 'forceful' ? (s.boldness || 5) * 0.08 : 0)
        + dims.trust * 0.35 + dims.obligation * 0.3 + dims.affection * 0.15
        - dims.resentment * 0.35 - suspicionOf(voter, speaker) * 0.3
        + benefit
        + (caught ? -3 : unsupported.length * 0.7)
        // Campaigning for your life in a costume is measurably worse than
        // campaigning for it in your own clothes.
        - socialDrag(speaker, week);

      const keepDeal = dealBetween(voter, other);
      const resist = strength * 5.5
        + (ballot.assignment ? 2.2 : 0)
        + (keepDeal ? sincerityOf(keepDeal, voter) * (tierOf(keepDeal) === 'final-two' ? 3.2 : 2.2) : 0)
        + Math.max(0, targetProtection(voter, other)) * 0.35
        + (v.loyalty || 5) * 0.1;

      const margin = persuade - resist + noise(rng, 2);
      record.responses.push({
        voter, margin: Number(margin.toFixed(2)), caught,
        receptive: !caught && margin > 0,
        evictingSpeaker: ballot.evict === speaker,
      });

      // ── Restrained social consequences, all directional ──
      if (caught) {
        addRelationshipDimension(voter, speaker, 'trust', -0.8);
        bumpSuspicion(voter, speaker, 0.6);
      } else if (margin > 0 && (record.voice === 'loyal' || record.argumentType === 'personal')) {
        addRelationshipDimension(voter, speaker, 'trust', 0.5);
        addRelationshipDimension(voter, speaker, 'obligation', 0.4);
      }
      if (record.voice === 'forceful' && margin < 0) {
        addRelationshipDimension(voter, speaker, 'resentment', 0.5);
        bumpSuspicion(voter, speaker, 0.3);
        try { rememberStrategy(voter, speaker, 'threatened-me-live', weekNum, 1, { plea: record.argumentType }); } catch { /* texture */ }
      }
      // A callout about the structure lands only with the voters who BELIEVE
      // it — awareness is not broadcast, it is accepted or it is not.
      if (record.argumentType === 'target-warning' && !caught && margin > 0) {
        try {
          for (const bloc of listBlocs()) {
            if ((week?.voteOperation?.plans || []).some(p => p.alliance === bloc.label && p.target === speaker)) {
              learnAbout(voter, bloc, 0.15, `${speaker} named the structure in a final plea`);
            }
          }
        } catch { /* knowledge store optional in harnesses */ }
      }
    }
    // The exposed voter's answer to being named on live television.
    if (record.exposedVoter) {
      addRelationshipDimension(record.exposedVoter, speaker, 'resentment', 0.8);
      try { rememberStrategy(record.exposedVoter, speaker, 'exposed-on-live', weekNum, 2, { deal: true }); } catch { /* texture */ }
    }
  }

  // ── Movement: normally zero or one; two is rare and earned ──
  for (const record of records) {
    const candidates = record.responses
      .filter(r => r.evictingSpeaker && !r.caught && r.margin > 1.3)
      .sort((a, b) => b.margin - a.margin);
    let moved = 0;
    for (const response of candidates) {
      const ballot = ballots.find(b => b.voter === response.voter);
      if (!ballot || ballot.evict !== record.speaker) continue;
      if (moved >= 2) break;
      // The second vote has a much higher bar: a big margin AND a genuinely
      // loose ballot. A speech does not reorganise a house.
      if (moved === 1) {
        const strength = commitments.get(response.voter)?.strength ?? 0.4;
        if (response.margin <= 3.2 || strength >= 0.35) break;
      }
      ballot.evict = record.other;
      ballot.changed = true;
      ballot.pleaMove = true;
      ballot.movedBy = record.speaker;
      ballot.pleaArgument = record.argumentType;
      ballot.pleaMargin = response.margin;
      response.moved = true;
      moved++;
      try { rememberStrategy(record.speaker, response.voter, 'final-plea-saved-me', weekNum, 2, { argument: record.argumentType }); } catch { /* texture */ }
    }
  }

  return records;
}

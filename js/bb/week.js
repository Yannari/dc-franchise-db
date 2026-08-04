// Headless Big Brother week engine: a run of acts, one eviction.
//
// Built like a Total Drama episode rather than a calendar. Acts are what the VP
// renders and what events hang off; the day numbers were scaffolding sitting on
// top of acts that already existed. The campaign carries a VARIABLE number of
// beats, the way a challenge fires a variable number of social events between
// its phases.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond, addBond } from '../bonds.js';
import { rollDeparture } from '../departures.js';
import { runBattleBack } from './battle-back.js';
import {
  updateRomanticSparks, checkFirstMove, checkShowmanceFormation,
  updateShowmancePhases, checkShowmanceBreakup,
  checkShowmanceSabotage, checkLoveTriangleFormation, updateLoveTrianglePhases,
  checkLoveTriangleBreakup, updateAffairExposure,
} from '../romance.js';
import { checkPerceivedBondTriggers, recoverBonds } from '../bonds.js';
import { decayAllianceTrust } from '../alliances.js';
import { tickIntentions } from '../intentions.js';
import { applySocialStatusEffects, recordChallengeDominance, recordStrategicRespect, recordProtection } from '../relationship-events.js';
import { updateSocialStatus } from '../social-status.js';
import { updateEditLayer } from '../edit-layer.js';
import { updateAdaptationFromEpisode } from '../adaptation.js';
import {
  chooseNominationPlan, chooseReplacement, explainReplacement, initialVotePreference,
  shouldUseVeto, houseVoteCommitment, applyHouseBandwagon,
  buildHouseVotePlans,
} from './strategy.js';
import { scheduleHouseBeats } from './house-events.js';
import { campaignArgument } from '../bb-events/_read.js';
import { runBBCompetition } from './comps.js';
import { runVoteOperation, resolveFinalPleas } from './vote-operation.js';
import { resolveBBCampaignAct, settleBBAllianceWeek, updateBBAllianceLifecycle, updateBBPerceptions, setBBTarget, getBBTarget } from './shared-strategy.js';
import { ensureHousePlan, reviseHousePlans, dropFromHousePlans, describeHousePlan } from './plans.js';
import { settleDeals, endgameDealSummary, dealBetween, breakDeal, exposeDeal, tierOf, sincerityOf } from './deals.js';
import { rememberStrategy, strategicMemoryScore } from '../strategy-memory.js';
import { observeBlocs, readVoteTells, listBlocs, learnAbout, pointOfAttack } from './blocs.js';
import { recordBBVotes, tickBBKnowledge } from './knowledge.js';
import { recordReign, reignMadeAnEnemy } from './reign.js';
import { resolveWeekTwistState } from './twist-contract.js';
import { grantPower, activePowerAt, usePower, expirePowers, BB_POWER_DEFINITIONS } from './powers.js';

/**
 * A competition win, seen by the whole house, becomes strategic respect and a
 * little comp fear — scaled by how badly the field was beaten. This is the
 * event-driven source those dimensions were designed around; without it a
 * season ended with every strategicRespect value still at zero.
 */
function recordCompDominance(competition, house, weekNum) {
  try {
    const margin = Number(competition?.debug?.winnerMargin);
    const scaled = Number.isFinite(margin) ? Math.min(2, 0.6 + Math.abs(margin) * 0.25) : 0.8;
    recordChallengeDominance(competition.winner,
      house.filter(name => name !== competition.winner),
      { margin: scaled, ep: weekNum });
  } catch { /* dimensions are texture; a comp must never fail on them */ }
}

// ── The bond-movement cap, at module scope so EVERY path can be fenced ──
//
// The ±2.5-per-stretch cap lived inside simulateBBWeek and was applied only
// at act boundaries (houseAct / addBeats). Everything that mutates bonds
// OUTSIDE those boundaries walked around it: the romance and maintenance
// bridges attach their beats to an act that has already been capped, the pawn
// negotiation, the broken-promise hit at nominations, the renomination
// reaction, deal settlement and the alliance-betrayal settle all call addBond
// in open air. Every one of those paths now runs inside a window.
const STRETCH_BOND_CAP = 2.5;
function _capBondDeltas(before) {
  for (const [key, was] of Object.entries(before)) {
    const now = Number(gs.bonds[key]);
    if (!Number.isFinite(now)) continue;
    const delta = now - was;
    if (Math.abs(delta) <= STRETCH_BOND_CAP) continue;
    gs.bonds[key] = was + Math.sign(delta) * STRETCH_BOND_CAP;
  }
  // Pairs that had no bond at all before this stretch.
  for (const [key, now] of Object.entries(gs.bonds)) {
    if (key in before) continue;
    const v = Number(now);
    if (Number.isFinite(v) && Math.abs(v) > STRETCH_BOND_CAP) {
      gs.bonds[key] = Math.sign(v) * STRETCH_BOND_CAP;
    }
  }
}
function _cappedBondWindow(fn) {
  const before = { ...(gs.bonds || {}) };
  try { return fn(); } finally { _capBondDeltas(before); }
}

function hook(hooks, name, value, context) {
  const result = hooks?.[name]?.(value, context);
  return result === undefined ? value : result;
}

/**
 * Who this week is ABOUT.
 *
 * Published as the week goes, because the event library decides who carries the
 * next beat by asking who has been seen least — which is good for variety and
 * actively hostile to the shape of an episode. A week belongs to the person
 * with the power and the people who might go home; a houseguest nobody is
 * playing against should be background.
 *
 * Kept on gs rather than threaded through ctx because eleven event files order
 * their casting pools through the same one-line helper, and none of them takes
 * a context.
 */
function setSpotlight(patch) {
  gs.bb ||= {};
  gs.bb.spotlight = { ...(gs.bb.spotlight || {}), ...patch };
}

function ensureBBState() {
  gs.bb ||= {};
  gs.bb.outgoingHoh ??= null;
  gs.bb.weeks ||= [];
  gs.bb.stats ||= {};
  gs.eliminated ||= [];
  for (const name of gs.activePlayers || []) {
    gs.bb.stats[name] ||= { hohWins: 0, vetoWins: 0, blockBusterWins: 0, timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    gs.bb.stats[name].timesOnTheBlock ||= 0;
    gs.bb.stats[name].blockBusterWins ||= 0;
  }
}

/**
 * The veto draw.
 *
 * Six houseguests play: the Head of Household, the nominees, and three drawn
 * out of a bag. This used to be three names picked at random with nothing
 * around them, which threw away one of the few moments in the week where the
 * house has to make a decision in public and cannot lie about it.
 *
 * The real thing: the HOH and each nominee reach into a bag of chips carrying
 * houseguests' names and some marked HOUSEGUEST'S CHOICE. A name means that
 * person plays. A choice — or drawing your own name — means the drawer picks
 * somebody, in front of everybody, and everybody watches who they pick.
 *
 * Who a drawer picks is not random either. A nominee picks whoever they think
 * will take them off; a Head of Household picks whoever they think will leave
 * their nominations alone. Both read PERCEIVED bonds, so a houseguest can pick
 * somebody they are wrong about, which is the best version of this moment.
 */
function drawVetoPlayers(house, hoh, nominees, rng, readBond, backdoorTarget = null) {
  const playing = [hoh, ...nominees].filter(Boolean);
  const eligible = house.filter(name => !playing.includes(name));
  const seats = Math.max(0, Math.min(3, house.length - playing.length));
  const read = (a, b) => (typeof readBond === 'function' ? readBond(a, b) : 0);

  // One chip per eligible houseguest, plus a couple of choice chips.
  const bag = [
    ...eligible.map(name => ({ kind: 'name', name })),
    { kind: 'choice' }, { kind: 'choice' },
  ];
  const draws = [];
  const drawers = [hoh, ...nominees].filter(Boolean);

  for (let i = 0; i < seats; i++) {
    const drawer = drawers[i % drawers.length];
    if (!bag.length) break;
    const chip = bag.splice(Math.floor(rng() * bag.length), 1)[0];

    // A name chip belonging to somebody already playing is a choice chip: the
    // house rule is that drawing your own — or an unusable — chip hands you the
    // pick instead.
    const usable = chip.kind === 'name' && !playing.includes(chip.name);
    if (usable) {
      playing.push(chip.name);
      draws.push({ drawer, chip: 'name', drew: chip.name, chose: null });
      continue;
    }

    const left = house.filter(name => !playing.includes(name));
    if (!left.length) break;
    // Nominees want somebody who would take them down. The Head of Household
    // wants somebody who would leave the block alone. Both are reading their
    // own idea of the room.
    //
    // And an HOH running a backdoor will not pick the person they are trying to
    // backdoor, for the reason the whole move exists: the veto winner cannot be
    // named as a replacement, so a target who plays and wins is safe. Keeping
    // them out of the competition IS the strategy.
    const avoid = drawer === hoh ? backdoorTarget : null;
    const pickable = left.filter(n => n !== avoid);
    const from = pickable.length ? pickable : left;
    // Somebody who spent the last two days promising to take this nominee down
    // has bought themselves a place at the front of the queue. It is the whole
    // point of making the promise, and without this the lobbying was theatre.
    const promised = new Set((gs.sideDeals || [])
      .filter(deal => deal.active !== false && deal.type === 'veto' && deal.players?.includes(drawer))
      .flatMap(deal => deal.players.filter(name => name !== drawer)));
    const pull = name => read(drawer, name) + (promised.has(name) ? 3 : 0);
    const wanted = from.slice().sort((a, b) => pull(b) - pull(a))[0];
    playing.push(wanted);
    // Why that name. A choice chip is a decision made in front of everybody,
    // and the house reads who somebody reaches for.
    const why = drawer === hoh
      ? (avoid && pickable.length < left.length
        ? `${hoh} picks ${wanted} and pointedly does not pick ${avoid}.`
        : `${hoh} picks ${wanted}, who has no reason to want the block changed.`)
      : promised.has(wanted)
        ? `${drawer} is on the block and picks ${wanted}, who spent two days promising exactly this.`
        : `${drawer} is on the block and picks ${wanted} — the person they think would use it on them.`;
    draws.push({ drawer, chip: 'choice', drew: null, chose: wanted, why });
  }

  // Anything the bag could not fill, fill at random rather than leave short.
  const rest = house.filter(name => !playing.includes(name));
  while (playing.length < Math.min(6, house.length) && rest.length) {
    playing.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  }
  return { players: playing, draws, automatic: [hoh, ...nominees].filter(Boolean) };
}

/**
 * The pawn ask — a real decision, made before the ceremony.
 *
 * The plan used to seat its pawn unilaterally: chooseNominationPlan picked the
 * best-fitting chair and the ceremony executed it, while a scheduler event ran
 * a PARALLEL ask against closestTo(hoh) — a person the plan often never
 * nominated — and recorded agreements the week ignored and refusals the week
 * never punished. Two disconnected worlds, and the report that flagged it was
 * right on every count: no request, no refusal, no alternative, no forced-pawn
 * resentment.
 *
 * Now the Head of Household works down their pawn ranking asking for real.
 * Whether somebody says yes runs on what a yes actually costs: trust in this
 * particular HOH (a person they remember breaking promises does not get a
 * volunteer), nerve, loyalty, and above all how dangerous a pawn seat IS right
 * now — in a full house a pawn is furniture, at seven people pawns go home.
 * A willing yes creates a real safety deal and a debt. A grudging yes is
 * remembered as one. A refusal costs the refuser standing with the HOH — and
 * a spiteful HOH puts them straight onto the list — and if everybody refuses,
 * somebody sits anyway, forced, which is the resentment that lasts longest.
 */
export function negotiatePawn(hoh, house, plan, rng) {
  const ranking = (plan.pawnRanking && plan.pawnRanking.length ? plan.pawnRanking : [plan.pawn])
    .filter(name => name && name !== hoh && name !== plan.target && house.includes(name));
  if (!ranking.length) return { pawn: plan.pawn, asked: [], forced: false, willing: false };
  const hohStats = pStats(hoh);
  const asked = [];

  for (const candidate of ranking.slice(0, 3)) {
    const stats = pStats(candidate);
    // How deadly the seat is: at fourteen a pawn is a formality, at seven it is
    // a coin toss, and everybody in the house can do that arithmetic.
    const danger = house.length <= 6 ? 3 : house.length <= 8 ? 1.8 : house.length <= 10 ? 0.8 : 0.2;
    // Trust in THIS Head of Household, not trust in general.
    const trust = getPerceivedBond(candidate, hoh);
    const burned = strategicMemoryScore(candidate, hoh, gs.bb.weeks.length + 1) < -1 ? 1.6 : 0;
    const score = stats.loyalty * 0.5 + stats.boldness * 0.3 + trust * 0.7
      - danger - burned + (rng() - 0.5) * 2;
    const accepted = score > 4.6;
    const willing = score > 6.4;
    asked.push({ name: candidate, accepted, willing });

    if (accepted) {
      // A pawn seat taken on a promise IS a promise. Recording it as a real
      // safety deal means nominating them as the target later, or voting them
      // out, breaks something on the record — the whole betrayal machinery
      // downstream already knows what to do with that.
      gs.sideDeals ||= [];
      gs.sideDeals.push({
        players: [hoh, candidate], type: 'safety', tier: 'working', active: true,
        genuine: true, about: 'you are the pawn, not the target',
        madeEp: gs.bb.weeks.length + 1, format: 'big-brother',
      });
      addBond(hoh, candidate, willing ? 1.1 : 0.4);
      try {
        rememberStrategy(candidate, hoh, willing ? 'went-up-for-them' : 'made-me-the-pawn',
          gs.bb.weeks.length + 1, willing ? 2 : 2, { format: 'big-brother' });
        rememberStrategy(hoh, candidate, 'sat-when-asked', gs.bb.weeks.length + 1, 2,
          { format: 'big-brother' });
      } catch { /* the seat is still taken */ }
      plan.pawn = candidate;
      return { pawn: candidate, asked, forced: false, willing };
    }

    // A refusal is the boldest thing a non-HOH does all week, and it costs.
    addBond(hoh, candidate, -1.2);
    try {
      rememberStrategy(hoh, candidate, 'refused-to-sit', gs.bb.weeks.length + 1, 2,
        { format: 'big-brother' });
      rememberStrategy(candidate, hoh, 'asked-me-to-risk-it', gs.bb.weeks.length + 1, 1,
        { format: 'big-brother' });
      // A short-tempered Head of Household does not hear "no" as strategy —
      // proportional, like every stat in this project: the hotter the temper,
      // the likelier the refusal goes straight onto the list.
      if (rng() < (10 - hohStats.temperament) * 0.09) {
        setBBTarget(hoh, candidate, 'refused to go up for me', {});
      }
    } catch { /* the no still stands */ }

    // And sometimes the ask does not move on to the next name at all.
    //
    // Spite is not one stat. Temper supplies the fuse, but WHO the Head of
    // Household is decides whether it lights: a villain or a hothead punishes a
    // refusal in public because the punishment is the point; a mastermind or a
    // schemer with the same temper swallows it and collects it, because
    // seating a refuser wastes a nomination on an impulse; the warm archetypes
    // barely have the move at all. A standing grudge against the refuser feeds
    // it, discipline and any real warmth between them starve it. Refusing a
    // calm strategist is safe-ish; refusing a hothead who already resents you
    // is how you end up in the chair mid-sentence.
    const arch = players.find(pl => pl.name === hoh)?.archetype || '';
    const spiteArch = { villain: 0.25, hothead: 0.25, 'chaos-agent': 0.15, wildcard: 0.08 }[arch]
      ?? ({ mastermind: -0.18, schemer: -0.15, 'perceptive-player': -0.12,
            hero: -0.3, 'loyal-soldier': -0.3, goat: -0.25, 'social-butterfly': -0.2 }[arch] ?? 0);
    let spiteGrudge = 0;
    try { spiteGrudge = Math.min(3, Math.max(0, -strategicMemoryScore(candidate === hoh ? '' : hoh, candidate, gs.bb.weeks.length + 1))) * 0.05; } catch { spiteGrudge = 0; }
    const spite = Math.max(0, Math.min(0.85,
      (10 - hohStats.temperament) * 0.055
      + spiteArch
      + spiteGrudge
      - hohStats.strategic * 0.02
      - Math.max(0, getBond(hoh, candidate)) * 0.03));
    if (rng() < spite) {
      plan.pawn = candidate;
      addBond(candidate, hoh, -2);
      try {
        rememberStrategy(candidate, hoh, 'forced-me-up', gs.bb.weeks.length + 1, 3,
          { format: 'big-brother', about: 'I said no and sat anyway' });
        setBBTarget(candidate, hoh, 'put me on the block after I refused', {});
      } catch { /* seated all the same */ }
      return { pawn: candidate, asked, forced: true, willing: false };
    }
  }

  // Everybody said no. Somebody sits anyway — the best fit among the refusers —
  // and being seated against a spoken no is the grudge that outlasts the week.
  const forced = asked[0].name;
  plan.pawn = forced;
  addBond(forced, hoh, -2);
  try {
    rememberStrategy(forced, hoh, 'forced-me-up', gs.bb.weeks.length + 1, 3,
      { format: 'big-brother', about: 'I said no and sat anyway' });
    setBBTarget(forced, hoh, 'put me on the block after I refused', {});
  } catch { /* forced is forced */ }
  return { pawn: forced, asked, forced: true, willing: false };
}

function tally(ballots, nominees) {
  const counts = Object.fromEntries(nominees.map(name => [name, 0]));
  ballots.forEach(ballot => { if (ballot.evict in counts) counts[ballot.evict]++; });
  return counts;
}

/**
 * Who goes on slop.
 *
 * The Head of Household picks, which is the point of the twist: it is the
 * first thing a new HOH does with power, it is public, and it is remembered.
 * The read is the HOH's own — perceived bond, not real bond — so an HOH can
 * punish somebody who was never actually against them, and take the blame for
 * it either way. Noise keeps it from being a pure enemies list.
 */
/**
 * Who goes on slop: the bottom of the Head of Household competition.
 *
 * This used to be the HOH's private pick, scored on their PERCEIVED bond toward
 * each houseguest plus noise — which meant the most public punishment in the
 * week landed on whoever the person in power happened to dislike, with no way
 * for anybody to have avoided it and nothing on screen explaining it.
 *
 * The show did it by competition for its first fifteen seasons and only handed
 * the choice to the Head of Household from the sixteenth. Competition is the
 * better rule here for the same reason it was the original one: it is earned
 * rather than decreed, everybody had the same chance to avoid it, and it needs
 * no explanation beyond the scoreboard.
 *
 * Two things follow from the real rules. The Head of Household is automatically
 * a Have — they won, so they cannot be last anyway, but it is guarded rather
 * than assumed. And anybody who did not play cannot be last in a competition
 * they were not in: the outgoing HOH sits out by rule, so they are exempt.
 */
function chooseHaveNots(placements, house, wanted, hoh) {
  // Worst-first among the people who actually competed.
  const played = (placements || []).filter(name => house.includes(name) && name !== hoh);
  if (!played.length) return { names: [], reasons: [], count: 0, field: 0 };
  const worstFirst = [...played].reverse();

  const auto = Math.max(2, Math.min(4, Math.floor(played.length / 3)));
  // A fixed count can be asked for, but never more than the field can spare —
  // putting everybody on slop is not a twist, it is a different show.
  const count = Math.min(Number(wanted) > 0 ? Number(wanted) : auto, Math.max(1, played.length - 1));
  const chosen = worstFirst.slice(0, count);

  // Placings are quoted against the REAL field, including the winner. Counting
  // only the people eligible for slop made the scoreboard lie: somebody who
  // came last of twelve was told they finished last of eleven.
  const field = (placements || []).filter(name => house.includes(name)).length;
  return {
    names: chosen,
    reasons: chosen.map(name => {
      const place = (placements || []).filter(n => house.includes(n)).indexOf(name) + 1;
      return {
        name, place, field,
        why: place === field ? `finished last of ${field}`
          : place === field - 1 ? `second from last of ${field}`
          : `finished ${place} of ${field}`,
      };
    }),
    count,
    field,
    // Nobody chose this, and the screen should be able to say so.
    exempt: house.filter(n => n !== hoh && !played.includes(n)),
  };
}

/**
 * Run the shared romance pipeline over the house.
 *
 * The house created sparks and nothing ever promoted one: eight seasons made
 * a hundred sparks and zero showmances, which also left the kiss trap — a
 * scheme that needs a showmance to break — permanently unreachable.
 *
 * Total Drama owns the whole pipeline already (spark, intensity, first move,
 * formation, phases, breakup) and none of it is tribe-specific; it keys camp
 * events off `merge` whenever a season is merged, which a house always is. So
 * the house runs the real thing rather than half of it.
 *
 * This lives in the WEEK rather than the run adapter on purpose: a headless
 * season and a played one must produce the same house, and behaviour that
 * depends on which entry point you used is the bug this format keeps finding.
 *
 * Returns the beats it produced so they join the week rather than being left
 * in a camp-events structure a house never renders.
 */
function runHouseRomance(week, rng) {
  if (seasonConfig.romance === 'disabled') return [];
  const mergeBlock = { pre: [], post: [] };
  const ep = { num: week.num, campEvents: { merge: mergeBlock },
               eliminated: week.evicted || null, votingLog: week.ballots || [] };
  // The pipeline keys some pushes on the literal 'merge' and some on
  // gs.mergeName — which a house sets to 'the house'. Both names point at the
  // SAME block, or half the romance (triangles especially) lands in a bucket
  // the harvest never reads.
  if (gs.mergeName && gs.mergeName !== 'merge') ep.campEvents[gs.mergeName] = mergeBlock;
  // The pipeline is Total Drama code and writes gs.popularity directly, which
  // walks straight past the house's own switch. Snapshot and restore rather
  // than edit a module the other simulator depends on.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;

  // Tell the shared pipeline what a house is before asking it to run.
  //
  // Every stage of it asks whether two people are on the same tribe, and a
  // house answers that with `gs.tribes` — which is `{}` rather than an array
  // until something says otherwise, making `gs.tribes.some(...)` a TypeError on
  // the first spark of the first week.
  //
  // prepareHouse() in bb-run.js already says otherwise, so a played season is
  // fine. simulateBBSeason() does not, so a headless one dies here every week,
  // silently, and measures zero showmances across forty seasons while the same
  // cast played through the UI pairs off constantly. Anything calibrated
  // against the headless number is calibrated against a crash.
  //
  // Hence here, in the week both entry points share: a house is not a tribe
  // game with the merge pending, it is a merge from the day everybody moves in.
  if (!Array.isArray(gs.tribes)) gs.tribes = [];
  gs.isMerged = true;
  const house = [...(gs.activePlayers || [])];
  if (!gs.tribes.length) gs.tribes.push({ name: 'merge', tribeName: 'merge', members: house });
  else gs.tribes[0].members = house;

  // The pipeline rolls Math.random directly — it predates the house having a
  // seed at all. While it was crashing that cost nothing; now that it runs, an
  // unseeded stage sits in the middle of a seeded week and the same seed stops
  // replaying the same season. Lend it the week's generator for the duration.
  const realRandom = Math.random;
  if (typeof rng === 'function') Math.random = rng;
  try {
    updateRomanticSparks(ep);
    checkFirstMove(ep);
    checkShowmanceSabotage(ep);
    checkShowmanceFormation(ep);
    updateShowmancePhases(ep);
    // The stages a house never ran: three-way tension, its phases, the
    // breakup check for evicted corners, and secret affairs — the exact
    // systems the jealousy tracker was feeding into a void.
    checkLoveTriangleFormation(ep);
    updateLoveTrianglePhases(ep);
    checkLoveTriangleBreakup(ep);
    updateAffairExposure(ep);
    checkShowmanceBreakup(ep);
  } catch (err) {
    // Texture never takes a week down — but it does not get to fail invisibly
    // either. That silence is what hid the bug above for an entire format.
    gs.bb ||= {};
    (gs.bb.romanceFailures ||= []).push({ week: week.num, message: String(err?.message || err) });
  } finally {
    Math.random = realRandom;
  }
  if (popOff) gs.popularity = popBefore;
  const romanceLine = (type, lines, ...names) => {
    const key = `${week.num || 0}|${type}|${names.filter(Boolean).join('|')}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return lines[hash % lines.length];
  };
  const bbRomanceText = e => {
    const [a, b, c] = e.players || [];
    const pa = pronouns(a);
    switch (e.type) {
      case 'firstMove':
        return romanceLine(e.type, [
          `${a} asks ${b} to stay behind after everyone leaves the backyard. The conversation stalls, ${a} admits why, and ${b} reaches for ${pa.posAdj} hand.`,
          `${a} pulls ${b} into the storage room, starts with “This is awkward,” and finally says what half the house has already guessed. ${b} smiles before ${a} finishes.`,
          `${a} tells ${b} that pretending there is nothing between them has become harder than admitting it. ${b} answers by moving closer.`,
          `${a} waits until the bedroom is empty and asks whether ${b} feels this too. ${b} says yes, then laughs at how relieved ${a} looks.`,
          `${a} tries to make the first move casually. It is not casual at all, but ${b} meets ${pa.obj} halfway.`,
        ], a, b);
      case 'showmanceSpark':
        return romanceLine(e.type, [
          `${a} and ${b} stop calling it flirting. They tell each other this is real, then spend breakfast failing to act normal around everyone else.`,
          `${b} asks what ${a} plans to call this in the Diary Room. By the time ${a} answers, both of them are smiling too much to keep denying it.`,
          `${a} and ${b} agree they are together. The decision is private; the way they walk back into the kitchen is not.`,
          `${a} says, “So we're really doing this?” ${b} says yes. Outside the room, someone hears them laugh and immediately goes looking for details.`,
          `${a} and ${b} finally put a name to what has been happening between them. Neither expects the house to treat it as only romantic.`,
        ], a, b);
      case 'showmanceRekindle':
        return romanceLine(e.type, [
          `${a} and ${b} sit on opposite ends of the bed and talk through the argument without an audience. They do not solve everything, but neither leaves.`,
          `${b} returns something ${a} left on the other side of the bedroom. The handoff becomes an apology, then a conversation neither was ready to start earlier.`,
          `${a} tells ${b} exactly what still hurts. ${b} listens without defending it, and that is enough to keep the door open.`,
          `${a} and ${b} agree that making up does not erase what happened. They also agree they are not finished trying.`,
        ], a, b);
      case 'showmanceBreakup':
        return romanceLine(e.type, [
          `${a} and ${b} sit down to repair things and realize neither is describing the same relationship. ${b} moves ${pronouns(b).posAdj} things before bedtime.`,
          `${a} tells ${b} that every personal conversation has started feeling like strategy. ${b} does not argue. They agree to stop pretending this still works.`,
          `${a} asks for space. ${b} says, “In this house?” and almost laughs, but the breakup is real even if privacy is not.`,
          `${a} and ${b} end it quietly in the bedroom. The rest of the house notices when they come to dinner separately and choose different seats.`,
          `${b} asks whether they are still a couple or only two votes protecting each other. ${a} cannot answer quickly enough.`,
        ], a, b);
      case 'showmanceRideOrDie':
        return romanceLine(e.type, [
          `${a} and ${b} promise that neither will cut the other before the end. They make the agreement in private and defend it publicly before the day is over.`,
          `${b} asks whether ${a} would choose the relationship over the easier path to the finale. ${a} says yes without asking who is listening.`,
          `${a} tells ${b}, “If one of us gets there, both of us got there.” It is romantic, strategic and immediately dangerous.`,
          `${a} and ${b} stop discussing separate endgames. From now on every plan has two seats in it, and the house can see both.`,
        ], a, b);
      case 'showmanceHoneymoon':
        return romanceLine(e.type, [
          `${a} and ${b} whisper across their beds until somebody throws a pillow and tells them to sleep. They only get quieter.`,
          `${a} makes breakfast for ${b} and gets ${pronouns(b).posAdj} order exactly right. Three people at the table exchange a look.`,
          `${a} and ${b} claim the hammock and lose track of the conversation happening around them. The house does not lose track of either of them.`,
          `${b} finds an excuse to follow ${a} into the storage room. They return with no supplies and matching smiles.`,
          `${a} and ${b} spend the evening inventing reasons to sit beside each other. By the third reason, nobody is fooled.`,
        ], a, b);
      case 'showmanceNoticed':
        return romanceLine(e.type, [
          `${a} points out that ${b} checks ${c}'s reaction before agreeing to any plan. The person listening asks which half of the pair is easier to remove.`,
          `${a} counts ${b} and ${c} as one vote during a kitchen conversation. Nobody corrects the math.`,
          `${a} tells an ally that pitching ${b} without ${c} is a waste of time. They begin comparing which of the two has fewer people protecting them.`,
          `${a} watches ${b} abandon a conversation the moment ${c} leaves the room. That night, ${a} starts describing them as a pair instead of two names.`,
        ], a, b, c);
      case 'showmanceTarget':
        return romanceLine(e.type, [
          `${a} tells two people that leaving ${b} and ${c} together means surrendering two votes every week. The next conversation is about which name goes up first.`,
          `${a} starts a campaign to split ${b} and ${c}. Instead of attacking the relationship, ${a} lists every vote the pair can control together.`,
          `${a} asks who benefits from keeping both ${b} and ${c}. Nobody has a convincing answer, and the pair becomes the day's easiest target discussion.`,
          `${a} pitches breaking up ${b} and ${c} before either wins power. By dinner, the idea has travelled farther than ${a} expected.`,
          `${a} stops referring to ${b} and ${c} separately. “The pair” needs to lose a number, and ${a} begins testing which name the house will accept.`,
        ], a, b, c);
      case 'showmanceJealousy':
        return romanceLine(e.type, [
          `${a} asks ${b} to talk, but ${b} is waiting for ${c}. “It's fine,” ${a} says, then eats dinner in another room.`,
          `${a} jokes that ${b} and ${c} have become impossible to separate. The joke lands badly because ${a} is the only person not smiling.`,
          `${a} walks into the bedroom, sees ${b} and ${c} sharing a bed and turns around before either notices. ${pa.Sub} keeps ${pa.posAdj} distance afterward.`,
          `${b} cancels another conversation with ${a} to spend time with ${c}. This time ${a} stops asking for a replacement time.`,
        ], a, b, c);
      case 'friendshipJealousy':
        return romanceLine(e.type, [
          `${a} brings two mugs to the kitchen table and finds ${b} already there with ${c}. ${a} leaves one mug behind and takes the other outside.`,
          `${a} asks ${b} whether they can finish yesterday's conversation. ${b} looks toward ${c} before answering, and ${a} says, “Never mind.”`,
          `${a} joins ${b} and ${c} in the backyard, but every story has context only the couple understands. ${a} stops trying to enter the conversation.`,
          `${b} promises ${a} they will talk later, then disappears upstairs with ${c}. ${a} waits long enough to realize later is not coming.`,
        ], a, b, c);
      default:
        return String(e.text || '')
          .replace(/\bThe tribe\b/g, 'The house').replace(/\bthe tribe\b/g, 'the house')
          .replace(/\btribe\b/g, 'house').replace(/\bTribe\b/g, 'House')
          .replace(/\bthe camp\b/g, 'the house').replace(/\bcamp\b/g, 'the house');
    }
  };
  // "Several houseguests are discussing the pair as a single target."
  //
  // That sentence was the whole of it. showmanceTarget is Total Drama's event
  // and Total Drama has nowhere to put a strategic target, so in a house it
  // narrated a targeting conversation and wrote nothing: the plotter could
  // spend a day asking people to split a couple up and then nominate somebody
  // unrelated on Thursday. A couple is a bloc, so it goes through the same
  // layer as an alliance does — somebody works out which half is reachable, and
  // that half is on their list.
  const consequences = [];
  for (const e of ep.campEvents.merge.pre) {
    if (e.type !== 'showmanceTarget' && e.type !== 'showmanceNoticed') continue;
    const [plotter, x, y] = (e.players || []).filter(Boolean);
    if (!plotter || !x || !y) continue;
    try {
      const bloc = listBlocs().find(b => b.kind === 'couple'
        && b.members.includes(x) && b.members.includes(y));
      if (!bloc || bloc.members.includes(plotter)) continue;
      // They are talking about it, so they can see it.
      learnAbout(plotter, bloc, 0.45, 'watched them');
      if (e.type !== 'showmanceTarget') continue;
      const aim = pointOfAttack(plotter, bloc);
      if (!aim) continue;
      setBBTarget(plotter, aim.target, `to break up ${bloc.label}`, { week });
      rememberStrategy(plotter, aim.target, 'bloc-threat', week.num, 2,
        { format: 'big-brother', about: bloc.label });
      consequences.push({ plotter, target: aim.target, why: aim.why });
    } catch { /* the couple has already broken up, or the house has moved on */ }
  }
  week.coupleTargets = consequences;

  return [...ep.campEvents.merge.pre, ...ep.campEvents.merge.post].map(e => {
    const hit = e.type === 'showmanceTarget'
      && consequences.find(c => c.plotter === (e.players || [])[0]);
    return {
      text: bbRomanceText(e) + (hit ? ` ${hit.plotter} settles on ${hit.target} — ${hit.why}.` : ''),
      players: (e.players || []).filter(Boolean),
      badgeText: hit ? 'A NAME, NOT A COMPLAINT' : (e.badgeText || 'SHOWMANCE'),
      badgeClass: hit ? 'red' : (e.badgeClass || 'gold'),
      eventId: `romance-${e.type || 'beat'}`, category: 'social', location: 'bedroom',
    };
  }).filter(b => b.text);
}


/**
 * The end-of-episode maintenance every Total Drama episode runs, and no Big
 * Brother week ever did.
 *
 * Eight shared systems, all skipped: perceived bonds never diverged on their
 * own, alliance trust never decayed, intentions never aged out, social roles
 * were never computed, the edit never updated, learned behaviour never
 * updated — and, most visibly, bonds never RECOVERED toward neutral. That
 * last one is why every measured season ended with somebody at a perfect 10:
 * relationships in a house could only ever ratchet upward.
 *
 * updatePlayerStates is deliberately not here. It lives in js/episode.js, and
 * a Big Brother week does not run the Total Drama engine.
 *
 * Each call is guarded on its own so one throwing system cannot take the rest
 * of the maintenance — or the week — down with it. That is exactly how the
 * romance pipeline stayed silently broken for as long as it did.
 */
function runHouseMaintenance(week, rng = Math.random) {
  const ep = {
    num: week.num,
    eliminated: week.evicted || null,
    votingLog: (week.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed })),
    votes: { ...(week.votes || {}) },
    alliances: [],
    campEvents: { merge: { pre: [], post: [] } },
    knowledgeEvents: [],
  };
  const steps = [
    // Suspicion is attention, and attention fades. Without this, suspicion
    // was a pure ratchet — 3,063 upward moves against 18 downward across
    // eight measured seasons, average climbing monotonically to a flat 10.0
    // by week eleven — and every system that reads it (nomination heat,
    // friction, vote preference, plea resistance) went blind exactly when
    // the endgame needed the resolution. Same law the relationship
    // dimensions already obey: an incident spikes it, quiet weeks melt it,
    // and somebody who KEEPS doing suspicious things stays hot because the
    // events keep reinforcing. A six earned once fades to about two across
    // four quiet weeks; below 0.3 the entry is noise and goes.
    ['suspicion fades', () => {
      const sus = gs.bb?.house?.suspicion;
      if (!sus) return;
      for (const key of Object.keys(sus)) {
        const next = (Number(sus[key]) || 0) * 0.78;
        if (next < 0.3) delete sus[key];
        else sus[key] = next;
      }
    }],
    ['perceived bonds', () => checkPerceivedBondTriggers(ep)],
    ['bond recovery', () => recoverBonds(ep)],
    ['alliance trust', () => decayAllianceTrust(week.num)],
    ['intentions', () => tickIntentions(ep)],
    ['status effects', () => applySocialStatusEffects(ep)],
    ['social status', () => updateSocialStatus(ep)],
    ['edit layer', () => updateEditLayer(ep)],
    ['adaptation', () => updateAdaptationFromEpisode(ep)],
    // The tally is the one piece of evidence about a bloc that needs no trust
    // in anybody: a group can be careful in the kitchen for a month and then
    // put four votes on the same name twice.
    ['vote tells', () => { week.voteTells = readVoteTells(ep.votingLog, gs.activePlayers || []); }],
    // The ballots become facts that exactly one person each has observed. The
    // house watched somebody leave and knows nothing about who did it — which
    // is the whole difference between this format and one where the votes are
    // read out loud.
    ['ballot knowledge', () => { recordBBVotes(week); }],
    // Then a week of people talking, which is the only way any of it moves.
    ['knowledge spread', () => { week.knowledgeEvents = tickBBKnowledge(week, rng); }],
  ];
  // Same guard as the romance and scheme bridges: these are shared Total Drama
  // systems and several of them write gs.popularity directly rather than
  // through the house's api, which walks straight past the season's switch.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;
  week.maintenanceErrors = [];
  // The same loan the romance pipeline gets, for the same reason. Several of
  // these are shared Total Drama systems that roll bare Math.random — the
  // betrayal-denial trigger in bonds.js alone has half a dozen calls — and an
  // unseeded roll inside a seeded week means the same seed stops replaying the
  // same season. It stayed invisible for months because the trigger paths were
  // rarely reachable in a house; the bond events made them reachable, and the
  // replay test caught it within a day.
  const realRandom = Math.random;
  if (typeof rng === 'function') Math.random = rng;
  try {
    for (const [label, run] of steps) {
      try { run(); } catch (e) { week.maintenanceErrors.push(`${label}: ${e && e.message}`); }
    }
  } finally {
    Math.random = realRandom;
  }
  if (popOff) gs.popularity = popBefore;
  const bbMaintenanceText = e => {
    const [a, b] = e.players || [];
    switch (e.type) {
      case 'villainManipulation':
        return `${a} spends an hour reassuring ${b} and agreeing with every concern ${b} raises. As soon as ${b} leaves, ${a} gives the camera a very different account of the conversation.`;
      case 'goatKeeping':
        return `${b} tells ${a} they are going to the end together. ${a} believes the deal is exclusive; ${b} has made the same promise elsewhere.`;
      case 'allianceBlindspot':
        return `${a} checks in with the alliance and hears that the plan has not changed. After ${a} leaves, the group resumes discussing a vote that includes ${a}'s name.`;
      case 'betrayalDenial':
        return `${a} insists ${b} did not choose to betray them and must have been forced by the numbers. The other alliance members know ${b} made the decision willingly.`;
      case 'showmanceBlindspot':
        return `${a} believes ${b} is protecting them above everyone else. Meanwhile, ${b} keeps holding strategy meetings that ${a} does not know about.`;
      case 'providerEntitlement':
        return `${a} points to everything they do around the house as proof that nobody should nominate them. The rest of the house does not see chores as a deal for safety.`;
      case 'swapLoyaltyAssumption':
        return `${a} mistakes a few friendly conversations for a firm agreement. Nobody has promised ${a} safety, but ${a} begins acting as though they have.`;
      case 'perceptionRealization':
        return b
          ? `${a} compares what ${b} said with what actually happened during the vote. For the first time, ${a} accepts that the relationship was not what they believed it was.`
          : `${a} goes back over the week and realizes they misunderstood where they stood in the house.`;
      default:
        return String(e.text || '')
          .replace(/\bThe tribe\b/g, 'The house').replace(/\bthe tribe\b/g, 'the house')
          .replace(/\btribe\b/g, 'house').replace(/\bTribe\b/g, 'House')
          .replace(/\bthe camp\b/g, 'the house').replace(/\bcamp\b/g, 'the house');
    }
  };
  return ep.campEvents.merge.pre.map(e => ({
    text: bbMaintenanceText(e), players: (e.players || []).filter(Boolean),
    badgeText: e.badgeText || 'THE HOUSE SHIFTS', badgeClass: e.badgeClass || 'grey',
    eventId: `upkeep-${e.type || 'beat'}`, category: 'social', location: 'living-room',
  })).filter(b => b.text);
}

/**
 * Hang the romance beats on the last stretch of house life.
 *
 * Both exits from a week run this — the ordinary one and the one where
 * somebody walked out — so a departure week still has a love life.
 */
/**
 * The end of an alliance, or the survival of one, said out loud.
 *
 * Betrayals, repair attempts and collapses all happened silently — they moved
 * bonds, memories and trust and never once appeared on screen, so a viewer
 * watched an alliance vanish between weeks with nothing to explain it. Every
 * transition in the lifecycle now has a beat, because a consequence nobody can
 * see is indistinguishable from no consequence at all.
 */
function _attachAllianceFallout(week, house) {
  const beats = [];
  const inHouse = n => house.includes(n) || (gs.activePlayers || []).includes(n);

  for (const incident of week.allianceChanges?.betrayals || []) {
    const { player, victim, alliance, repair } = incident;
    beats.push({
      text: `<strong>${player}</strong> votes to evict <strong>${victim}</strong>, even though they `
        + `were together in <strong>${alliance}</strong>. By the time everyone gets back inside, `
        + `the remaining members are comparing votes and asking where ${player} was.`,
      players: [player, victim].filter(Boolean),
      badgeText: 'VOTED OUT AN ALLY', badgeClass: 'red',
      eventId: 'alliance-betrayal', category: 'deals', location: 'living-room',
    });

    if (!repair) continue;
    const how = repair.approach === 'apology' ? `${player} admits the vote was a betrayal and apologizes`
      : repair.approach === 'strategic-explanation' ? `${player} walks everyone through the votes and insists there was no other option`
      : repair.approach === 'refusal' ? `${player} says the vote was personal game information and refuses to discuss it`
      : `${player} denies flipping, even as the others tell ${player} the numbers only work one way`;
    const outcome = repair.outcome === 'forgiven'
      ? { text: `${how}. After a long conversation, <strong>${alliance}</strong> agrees to keep working with ${player}. Nobody calls the trust repaired.`,
          badgeText: 'FORGIVEN', badgeClass: 'green' }
      : repair.outcome === 'working-truce'
        ? { text: `${how}. Some members of <strong>${alliance}</strong> accept the explanation. The others agree to work with ${player} only until the next vote.`,
            badgeText: 'WORKING TRUCE', badgeClass: 'grey' }
        : { text: `${how}. The rest of <strong>${alliance}</strong> reject the explanation. The meeting ends with people leaving separately.`,
            badgeText: repair.outcome === 'fracture' ? 'FRACTURED' : 'REJECTED', badgeClass: 'red' };
    beats.push({
      ...outcome, players: [player].filter(inHouse),
      eventId: 'alliance-repair', category: 'deals', location: 'bedroom',
    });
  }

  // Anything that died this week, for whatever reason.
  for (const alliance of gs.namedAlliances || []) {
    if (alliance.dissolved !== week.num) continue;
    if (gs.bb.mourned?.includes(alliance.id)) continue;
    (gs.bb.mourned ||= []).push(alliance.id);
    const left = (alliance.members || []).filter(inHouse);
    const collapsed = alliance.dissolutionReason === 'trust-collapsed';
    beats.push({
      text: collapsed
        ? `Nobody calls a meeting to end <strong>${alliance.name}</strong>. Its members simply stop sharing information, `
          + `stop checking in before votes and eventually stop using the name.`
        : `<strong>${alliance.name}</strong> is down to ${left.length === 1 ? `${left[0]}, alone` : 'nobody'}. `
          + `There are not enough members left to keep the alliance going.`,
      players: left.slice(0, 4),
      badgeText: collapsed ? 'IT STOPS BEING TRUE' : 'OUT OF NUMBERS', badgeClass: 'red',
      eventId: 'alliance-collapsed', category: 'deals', location: 'living-room',
    });
  }

  if (!beats.length) return;
  const host = (week.acts || []).find(a => a.type === 'eviction')
    || [...(week.acts || [])].reverse().find(a => a.type === 'house');
  if (host) (host.socialBeats ||= []).push(...beats);
}

/**
 * What the house looks like right now: enough for the panels, nothing more.
 *
 * Two sizes, because this ran at full size once per house STRETCH and the
 * heavy stores — intentions, the directional dimensions and their cause
 * trails — are only ever read from the episode-level opening and closing
 * snapshots. Seven full copies a week put a nine-week season at nineteen
 * megabytes of gs, and every checkpoint, save and replay paid to clone and
 * serialize all of it: that is the "loading an episode takes a while".
 * The per-stretch panels read bonds, alliances and showmances, so that is
 * what a per-stretch snapshot carries.
 */
function _snapshotHouse(full = true) {
  const light = {
    bonds: { ...(gs.bonds || {}) },
    alliances: (gs.namedAlliances || [])
      .filter(a => a.active !== false && !a.dissolved)
      .map(a => ({ name: a.name, members: [...(a.members || [])], formed: a.formed,
                   parentName: a.parentName || null, formationEvidence: a.formationEvidence || null })),
    showmances: (gs.showmances || [])
      .filter(sh => sh.phase !== 'broken-up')
      .map(sh => ({ players: [...(sh.players || [])], phase: sh.phase })),
  };
  if (!full) return light;
  return {
    ...light,
    // The bookends carry romance at FULL fidelity — phases, first moves,
    // breakup forensics, saboteurs, affairs — because the Debug romance tab
    // reviews old weeks, and a tab that reads the LIVE stores shows next
    // month's heartbreak on last month's episode. The per-stretch snapshot
    // keeps its slim pair list; only the bookends pay for the history.
    showmances: (gs.showmances || []).map(sh => ({ ...sh })),
    romanticSparks: (gs.romanticSparks || []).map(sp => ({ ...sp })),
    affairs: (gs.affairs || []).map(af => ({ ...af })),
    // The status screen also reads who is hunting whom and who is misreading
    // whom, and both of those move during a week — so they belong in the
    // snapshot rather than being pulled live and spoiling the opening screen.
    intentions: JSON.parse(JSON.stringify(gs.intentions || {})),
    perceivedBonds: JSON.parse(JSON.stringify(gs.perceivedBonds || {})),
    stats: JSON.parse(JSON.stringify(gs.bb?.stats || {})),
    // The directional dimensions and their cause trails, frozen at this
    // moment. These now drive nominations, the veto, votes and recruitment,
    // and Total Drama's episodes snapshot them per episode for exactly the
    // reason a house must: a replayed week shown with TODAY'S feelings would
    // quietly rewrite why everything happened.
    relationshipDimensions: JSON.parse(JSON.stringify(gs.relationshipDimensions || {})),
    relationshipCauses: JSON.parse(JSON.stringify(gs.relationshipCauses || {})),
  };
}

function _attachRomance(week, rng) {
  // These beats are appended to an act whose cap window has already closed,
  // so the bridges' addBond calls were the biggest hole in the fence.
  const beats = _cappedBondWindow(() =>
    [...runHouseRomance(week, rng), ...runHouseMaintenance(week, rng)]);
  // A house showmance forms ORGANICALLY — the shared pipeline stamps it
  // "camp events", which answers nothing. The week knows better: it just
  // aired the scenes. A newly formed showmance gets the last beat this week
  // that featured both partners as its trigger, so the debug tab can say
  // "week 6, the slop-duty argument" instead of a shrug.
  for (const sh of gs.showmances || []) {
    // Formed THIS week: organically (sparkEp is the formation week) or via a
    // first move (firstMoveEp is; sparkEp then points at the older spark).
    const formedThisWeek = (sh.firstMoveEp || sh.sparkEp || 0) === week.num;
    if (sh.trigger || !formedThisWeek) continue;
    const [a, b] = sh.players || [];
    if (!a || !b) continue;
    const shared = (week.acts || []).flatMap(act => act.socialBeats || [])
      .filter(beat => (beat.players || []).includes(a) && (beat.players || []).includes(b)
        && beat.eventId !== 'showmance-formed');
    const last = shared[shared.length - 1];
    sh.trigger = last
      ? { week: week.num, eventId: last.eventId || null, badge: last.badgeText || null,
          excerpt: String(last.text || '').slice(0, 140) }
      : { week: week.num, eventId: null, badge: null, excerpt: null };
  }
  if (!beats.length) return;
  const houseActs = (week.acts || []).filter(a => a.type === 'house');
  const host = houseActs[houseActs.length - 1] || (week.acts || [])[week.acts.length - 1];
  if (host) (host.socialBeats ||= []).push(...beats);
}

export function simulateBBWeek(options = {}) {
  const rng = options.rng || Math.random;
  const hooks = options.hooks || {};
  const house = [...(options.house || gs.activePlayers || [])];
  if (house.length < 4) throw new Error('The standard Big Brother week engine requires at least four houseguests.');
  ensureBBState();
  // The season's perception salt, drawn once from the season's own dice so a
  // replayed seed reads everybody identically and two different seasons do
  // not. See bbThreatProfile's quirk term.
  if (!gs.bb.seasonSalt) gs.bb.seasonSalt = Math.floor(rng() * 2147483647) || 1;
  const week = { num: gs.bb.weeks.length + 1, format: 'big-brother', acts: [], houseAtStart: house };

  // A week of living in the same building, before anybody does anything.
  //
  // This runs FIRST because what the house has worked out about its own power
  // structures is an input to the week, not a summary of it: nominations, the
  // veto and the vote all read targets, and targets come from somebody having
  // noticed a group. Reading the tells from the last vote happens at the other
  // end, in the upkeep, which is the right order — you learn from a vote after
  // you have watched it.
  try { week.blocReads = observeBlocs({ house, rng }); } catch { week.blocReads = []; }
  // A fresh week is nobody's yet.
  setSpotlight({ hoh: null, nominees: [], vetoWinner: null, vetoPlayers: [] });

  /**
   * Twists change the SHAPE of a week, not just its numbers.
   *
   * Instant Eviction removes the veto — nominations stand and the house votes
   * the same night. A compressed cycle drops house life entirely and runs one
   * campaign act, which is what the back half of a double eviction is: the
   * same week with no time in it. Everything else is unchanged, so a twist
   * week is still a week rather than a separate engine.
   */
  const twists = new Set(options.twists || []);
  const compressed = !!options.compressed;
  const skipVeto = compressed ? !!options.skipVeto : (twists.has('bb-instant-eviction') || !!options.skipVeto);
  week.twists = [...twists];
  week.compressed = compressed;
  if (options.segment) week.segment = options.segment;
  else if (compressed) week.segment = 2;
  // The resolved twist contract: every rule a twist may change, merged with
  // an applied log saying which twist changed what. The engine consults the
  // RULES at its interception points rather than asking for twists by name;
  // the pre-contract twists (instant/double eviction, have-nots) keep their
  // existing paths and are merely recorded here.
  week.twistState = resolveWeekTwistState(compressed ? [] : week.twists);
  // The Invisible HOH (BBCAN9): the competition runs, the result is sealed,
  // and only the winner knows. Everything the engine writes on the house's
  // behalf this week has to pass one test — could the house actually know
  // this? — because a hidden winner is not useful if every strategy function
  // silently knows the identity.
  const hohSecret = week.twistState?.rules?.hohSecret === true;
  week.hohSecret = hohSecret;

  /**
   * Season modes that put a third houseguest on the block.
   *
   * The Block Buster: three nominees every week, and immediately before the
   * vote those three compete for one spot off the block. A nomination stops
   * being a death sentence and becomes a competition, which changes what an
   * HOH is willing to try — and the person who leaves has now lost twice.
   *
   * Runs from week one and stops when the house gets small enough that a third
   * nominee would leave nobody to vote.
   */
  // Any value that is not "off" means the Block Buster — seasons saved while
  // there were two modes still load.
  const safetyMode = options.safetyMode && options.safetyMode !== 'off' ? 'block-buster' : null;
  const stopsAt = Number.isFinite(options.safetyStopsAt) ? options.safetyStopsAt : 6;
  // Three nominees plus an HOH leaves house.length - 4 voters; below five in
  // the house that is nobody, so the mode has to stop before it breaks a vote.
  const safetyActive = !!safetyMode && house.length > Math.max(stopsAt, 5);
  week.safetyMode = safetyActive ? safetyMode : null;
  // The international double eviction: three nominees, ONE vote, and the two
  // highest evict-getters both walk the same night. No second cycle, no
  // arena — the block itself is the twist. Incompatible with a safety mode
  // (that machinery owns the third chair) and needs enough house left for
  // three nominees, an HOH and at least two voters.
  const doubleVote = !!options.doubleVote && !compressed && !safetyActive && house.length >= 6;
  week.doubleVote = doubleVote;
  const nomineeCount = (safetyActive || doubleVote) ? 3 : 2;
  // The house as it stands before a single thing happens this week. The status
  // screen shown at the top of an episode reads this, so it cannot show an
  // alliance nobody has formed yet or a target nobody has set.
  week.openingState = _snapshotHouse();
  // What was promised walking in, so the opening screen cannot show a deal
  // that had not been made yet.
  week.openingDeals = endgameDealSummary(house);

  // Reconcile first; formation itself happens inside the stretches below, so
  // that a new alliance always has a scene in the same act that created it.
  const allianceOpening = updateBBAllianceLifecycle({ phase:'reconcile', house, week, rng });
  week.allianceChanges = { formed:[], betrayals:[] };
  const eventLibrary = options.houseEvents || [];
  const competitionLibrary = options.competitions || [];

  const addBeats = (act, extra = {}) => {
    // Ceremony acts schedule beats too, and a competition night can move a
    // relationship as far as a whole morning of house life. Same limit.
    const bondsBefore = { ...(gs.bonds || {}) };
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: act.type, phase: act.phase || act.type,
      // On an invisible week the event pool does not get to know either —
      // a scene about "the HOH's room" would out the winner in narration.
      hoh: week.hohSecret ? null : week.hoh,
      nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng,
      // Campaign acts are where the vote operation's stories live — the
      // meetings noticed, the recruit reporting the pitch, the liar pressed —
      // and at one-to-three beats they starved: eleven eligible events took
      // turns going silent across whole ten-season runs. One extra pair of
      // beats in ONLY this act type is two or three scenes a week, spent
      // exactly where the format's drama is.
      min: eventLibrary.length ? (act.type === 'campaign' ? 2 : 1) : 0,
      max: eventLibrary.length ? (act.type === 'campaign' ? 4 : 3) : 0 });
    _capBondDeltas(bondsBefore);
    return act;
  };

  /**
   * A stretch of house life, as its own act.
   *
   * The phase matters more than the label. What a house does depends entirely
   * on what it knows: before the Head of Household is decided nobody is safe
   * and nobody is a target, and everything after that is a reaction to a fact
   * that did not exist an hour earlier. Attaching beats only to the ceremonies
   * meant an event could never tell those apart.
   *
   * Runs longer than a ceremony act, because this is where the week lives.
   */
  /**
   * A beat for an alliance that has just changed.
   *
   * The lifecycle returns the same field for two different events: a brand new
   * alliance, and an existing one that recruited somebody. Treating both as a
   * formation announced "for the first time" on every recruitment — six
   * seasons produced 229 formation beats and never more than one live
   * alliance, which is the tell.
   *
   * An alliance is announced once, ever. After that a new member joining is
   * its own smaller moment.
   */
  const allianceBeat = alliance => {
    const members = (alliance.members || []).filter(n => house.includes(n));
    if (members.length < 2) return null;
    gs.bb.announced ||= [];
    const isNew = !gs.bb.announced.includes(alliance.id);

    if (isNew) {
      gs.bb.announced.push(alliance.id);
      const named = members.length === 2
        ? `${members[0]} and ${members[1]}`
        : `${members.slice(0, -1).join(', ')} and ${members[members.length - 1]}`;

      // An alliance formed INSIDE another one is a different event, and the
      // more dangerous of the two: the people who made it are still sitting in
      // the room they are quietly playing against.
      if (alliance.parent) {
        return {
          text: `${named} meet without the rest of <strong>${alliance.parentName}</strong>. `
            + `They agree to protect each other first, then return to the larger group without mentioning the new deal.`,
          players: members.slice(0, 4),
          badgeText: 'AN ALLIANCE INSIDE AN ALLIANCE', badgeClass: 'gold',
          eventId: 'alliance-inner-circle', category: 'deals', location: 'pantry',
          newAlliance: true, allianceName: alliance.name, allianceId: alliance.id,
        };
      }

      return {
        text: `${named} meet in the bedroom and finally make the agreement official. `
          + `They name the alliance <strong>${alliance.name}</strong>, decide who is allowed to know about it `
          + `and leave the room one at a time.`,
        players: members.slice(0, 4),
        badgeText: 'ALLIANCE FORMED', badgeClass: 'gold',
        eventId: 'alliance-formed', category: 'deals', location: 'bedroom',
        newAlliance: true, allianceName: alliance.name, allianceId: alliance.id,
      };
    }

    // A recruitment. The newest name in the history is the person who just
    // came in, and the room they came into already had a name.
    const joined = [...(alliance.history || [])].reverse()
      .find(h => h.type === 'recruited')?.member;
    if (!joined || !house.includes(joined)) return null;
    return {
      text: `The members of <strong>${alliance.name}</strong> bring <strong>${joined}</strong> into the bedroom `
        + `and offer them a place in the alliance. ${joined} agrees, then asks who outside the room already knows.`,
      players: [joined, ...members.filter(n => n !== joined).slice(0, 3)],
      badgeText: 'BROUGHT IN', badgeClass: 'blue',
      eventId: 'alliance-recruited', category: 'deals', location: 'bedroom',
      newAlliance: false, allianceName: alliance.name, allianceId: alliance.id, joined,
    };
  };

  const houseAct = (phase, extra = {}) => {
    const act = { type: 'house', phase, socialBeats: [] };
    const bondsBefore = { ...(gs.bonds || {}) };
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: 'house', phase,
      hoh: week.hohSecret ? null : (week.hoh || null),
      nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng, min: eventLibrary.length ? 22 : 0, max: eventLibrary.length ? 30 : 0 });
    // People decide to work together at any hour of the day, not only in the
    // gap before the week starts. Formation is attempted in every stretch of
    // house life and the lifecycle's own caps decide whether one happens —
    // so an alliance can be born after an HOH win, in the middle of
    // nominations, or during the campaign, and the scene appears exactly
    // where it happened.
    const formedHere = updateBBAllianceLifecycle({ phase: 'opening', house, week, rng }).formed;
    if (formedHere) {
      const beat = allianceBeat(formedHere);
      if (beat) {
        act.socialBeats.unshift(beat);
        if (beat.newAlliance) week.allianceChanges.formed.push(formedHere.name);
      }
    }

    _capBondDeltas(bondsBefore);

    // The state as it stands when this stretch ends.
    //
    // The panels used to read the episode's single end-of-week snapshot, so
    // the FIRST screen of the week already showed the numbers the week
    // finished on — bonds that had not happened yet and alliances nobody had
    // formed on screen. Each stretch carries its own picture now — the light
    // one; only the episode's bookend snapshots carry the heavy stores.
    act.state = _snapshotHouse(false);
    week.acts.push(act);
    return act;
  };

  /**
   * Push everybody's plan through what just happened, and say so.
   *
   * Plans that only ever get written are decoration; plans that get written
   * and never shown are worse, because the game starts behaving on reasons the
   * user cannot see. Every revision comes back with a sentence, and the
   * sentences ride on the act that caused them.
   */
  const revise = (trigger, extra = {}) => {
    let changes = [];
    try {
      changes = reviseHousePlans({
        house: (gs.activePlayers || house).filter(Boolean), week, trigger, ...extra });
    } catch { changes = []; }
    week.planChanges.push(...changes.map(c => ({ ...c, trigger })));
    const act = week.acts[week.acts.length - 1];
    if (act && changes.length) act.planChanges = changes;
    return changes;
  };

  // Everybody arrives with a plan, even if the plan is thin.
  week.planChanges = [];
  for (const name of house) {
    try { ensureHousePlan(name, { house, week }); } catch { /* a thin plan is still a plan */ }
  }
  try { _cappedBondWindow(() => settleDeals({ house, week })); } catch { /* deals outlive a bad week */ }
  revise('week');

  // ── The announcement ──
  // A public twist is a rule the whole house plays under, so the house is
  // told the rule before the week starts moving — the wall screen lights up,
  // the sofas fill, the voice reads it out. A house that finds out a rule
  // mid-ceremony is a house that was never told the rules; the announcement
  // is also information, and information moves people.
  // ── can the Battle of the Block actually happen this week? ──
  //
  // Decided here, before the announcement, because the announcement is a
  // promise to the house. The Block Buster already owns the third chair and
  // its own way off the block, and the Battle owns four chairs across two
  // blocks — they cannot both run, and the mode wins because it is the
  // season's standing rule rather than one week's card. Working that out at
  // the HOH act (where it used to be) meant the voice announced two Heads of
  // Household on a week that then quietly seated one.
  const botbWanted = !compressed && week.twistState?.rules?.hohCount === 2;
  week.botbStoodDown = !botbWanted ? null
    : safetyActive ? 'block-buster'
      : doubleVote ? 'double-vote'
        : hohSecret ? 'invisible-hoh'
          // Two HOHs and four nominees leaves house.length - 6 people who are
          // neither, and the week still needs somebody left to vote.
          : house.length < 8 ? 'house-too-small'
            : null;
  const botbPossible = botbWanted && !week.botbStoodDown;

  if (!compressed && (week.twistState?.announcements || []).length) {
    // A twist that will not run does not get announced. The house is told the
    // rules it is about to live under, not the ones that were considered.
    const announced = week.twistState.announcements
      .filter(a => a?.twist !== 'bb-battle-of-the-block' || botbPossible);
    if (announced.length) {
    const beats = [];
    const byStat = (stat, pool = house) => [...pool].sort((a, b) => pStats(b)[stat] - pStats(a)[stat]);
    // The sharpest player in the room starts recalculating before the voice
    // finishes. Confidence in front of the room plays well outside it.
    const schemer = byStat('strategic')[0];
    const bold = byStat('boldness').find(n => n !== schemer) || byStat('boldness')[0];
    if (bold) {
      beats.push({
        text: `${bold} breaks the silence first: "Good. I hope I win it." Half the room laughs; the other half writes it down.`,
        players: [bold], badgeText: 'FIRST WORD', badgeClass: 'gold',
        eventId: 'twist-announcement-bravado', category: 'ceremonies', location: 'living-room',
        effects: [{ kind: 'pop', text: `${bold} +1`, delta: 1 }],
      });
      if (seasonConfig.popularityEnabled !== false) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[bold] = (gs.popularity[bold] || 0) + 1;
      }
    }
    if (schemer && schemer !== bold) {
      beats.push({
        text: `${schemer} says nothing at all, which from ${schemer} is the loudest possible reaction. The rule has already been taken apart and reassembled twice behind those eyes.`,
        players: [schemer], badgeText: 'RECALCULATING', badgeClass: 'grey',
        eventId: 'twist-announcement-recalc', category: 'ceremonies', location: 'living-room',
      });
    }
    // The two people with the least power in the room hear the same rule and
    // reach for each other — shared dread is how outsiders become a pair.
    const outsiders = byStat('strategic').slice(-2);
    if (outsiders.length === 2 && getBond(outsiders[0], outsiders[1]) > -1) {
      _cappedBondWindow(() => addBond(outsiders[0], outsiders[1], 0.3));
      beats.push({
        text: `${outsiders[0]} and ${outsiders[1]} trade one look across the sofas that says the same thing: whatever this rule is for, it is not for people like us. They spend the rest of the evening within arm's reach of each other.`,
        players: [...outsiders], badgeText: 'SHARED DREAD', badgeClass: 'blue',
        eventId: 'twist-announcement-dread', category: 'ceremonies', location: 'living-room',
        effects: [{ kind: 'bond', text: `${outsiders[0]} & ${outsiders[1]} +0.3`, delta: 0.3 }],
      });
    }
    week.acts.push({ type: 'twist-announcement', announced, socialBeats: beats });
    }
  }

  // Before anybody has power. No HOH, no nominees, nothing decided.
  if (!compressed) houseAct('pre-hoh');

  // HOH act and the first scramble.
  const hohPlayers = house.filter(name => name !== gs.bb.outgoingHoh);
  const hohCompetition = runBBCompetition({ type:'hoh', participants:hohPlayers, excluded:house.filter(name => !hohPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.hoh, seed:options.seed });
  const hohResults = hohCompetition.placements.map(name => ({ name, score:hohCompetition.scores[name], threw:!!hohCompetition.debug.scoreBreakdown[name]?.threw }));
  let hoh = hook(hooks, 'hohResult', hohCompetition.winner, { week, results: hohResults, competition:hohCompetition, house });
  if (!hohPlayers.includes(hoh)) hoh = hohCompetition.winner;

  // ── two thrones ──
  //
  // The Battle of the Block seats a SECOND Head of Household: the runner-up in
  // the same competition. Both nominate, all four nominees play, and the
  // winning pair dethrones whoever put them up. The co-HOH is decided here so
  // the nomination stretch below can run twice; the battle itself and the
  // dethroning happen after both ceremonies, further down.
  const botbActive = botbPossible;
  const coHoh = botbActive
    ? (hohCompetition.placements.find(n => n !== hoh && hohPlayers.includes(n)) || null)
    : null;
  week.botbActive = botbActive && !!coHoh;

  week.hoh = hoh;
  if (!hohSecret) setSpotlight({ hoh });
  gs.bb.stats[hoh].hohWins++;
  if (week.botbActive) {
    // A dethroned reign does not count as a reign — the wiki is explicit that
    // Frankie Grande's two dethroned weeks are not in his HOH record. The
    // co-HOH's win is credited only if they survive the battle, below.
    week.coHoh = coHoh;
    if (!hohSecret) setSpotlight({ hoh: coHoh });
  }
  week.hohCompetition = hohCompetition;
  // Winning in front of everybody is where strategic respect and comp fear
  // actually come from. The dimension writers existed and the house never
  // called them, so nobody in a season ever became "a comp threat" in
  // anyone's head no matter how many competitions they won.
  // Comp fear and strategic respect come from WATCHING somebody win. A
  // sealed result is watched by nobody, so the dimension writers stay quiet.
  if (!hohSecret) recordCompDominance(hohCompetition, house, week.num);
  week.acts.push(addBeats({ type: 'hoh', winner: hoh, results: hohResults, competition:hohCompetition,
    outgoingHoh: gs.bb.outgoingHoh, secret: hohSecret,
    coHoh: week.botbActive ? coHoh : null }));
  // The most disruptive moment of the week. One person can no longer be
  // evicted, so for seven days everybody else's plan bends around theirs.
  revise('hoh', { hoh });

  // Slop is the first thing a new Head of Household does with power, and the
  // house watches them do it. Chosen before nominations so the week's first
  // grievance is already in the room when the block is named.
  if (twists.has('bb-have-nots')) {
    // Read off the competition that just happened, so the two acts are the same
    // story rather than a result followed by an unrelated punishment.
    const slop = chooseHaveNots(hohCompetition.placements, house, options.haveNotCount, hoh);
    const haveNots = slop.names;
    week.haveNots = [...haveNots];
    gs.bb.haveNots = [...haveNots];
    week.acts.push(addBeats(
      { type: 'have-nots', hoh, names: [...haveNots], reasons: slop.reasons,
        field: slop.field, exempt: slop.exempt },
      { haveNots: [...haveNots] }));
  } else {
    gs.bb.haveNots = [];
  }

  // The nomination plan is decided HERE, before the post-hoh stretch — because
  // the pawn ask is part of it, the ask is a conversation, and the house-life
  // events of this stretch are where that conversation is seen. Deciding it at
  // the ceremony meant the scene and the decision could never be the same
  // thing.
  let plan = chooseNominationPlan(hoh, house, rng);
  // The pawn ask only happens when the chosen structure actually seats a
  // pawn. Two real targets, a split pair, a couple of expendables — none of
  // those weeks involve asking anybody to volunteer, and a season where every
  // single Head of Household ran the pawn play was the bug being fixed.
  // Asking somebody to sit as a pawn is a conversation, and an invisible
  // HOH cannot have it without handing over the only thing the twist gives
  // them. The plan runs both chairs as real targets instead.
  if (hohSecret && plan.pawn) {
    plan.pawn = null;
    plan.structure = 'two-targets';
    plan.structureWhy = 'An invisible HOH cannot negotiate a pawn without revealing themselves, so both nominations are meant.';
  }
  week.pawnAsk = plan.pawn
    ? _cappedBondWindow(() => negotiatePawn(hoh, house, plan, rng))
    : null;
  // The negotiation may have changed the chair.
  if (plan.pawn) {
    plan.nominees = [plan.nominees[0] === plan.pawn ? plan.target : plan.nominees[0], plan.pawn]
      .filter(Boolean);
  }
  week.plan = plan;

  // ── Pandora's Box ──
  // A door with a question mark on it appears in the brand-new HOH room. The
  // choice is private, the prize is SECRET — the house sees only that the box
  // was opened and that something happened to them because of it. This is the
  // first real distributor: what goes in the box is configuration, and the
  // canonical cargo (BB12) is the Diamond Power of Veto with a two-eviction
  // fuse.
  if (!compressed && twists.has('bb-pandoras-box')) {
    const prizeId = options.pandorasPrize || 'diamond-veto';
    const st = pStats(hoh);
    // Curiosity is boldness; caution is intuition. Nobody is immune to a
    // mystery box at fifty-fifty odds of a very good day.
    const openChance = Math.min(0.9, Math.max(0.2,
      0.32 + st.boldness * 0.045 - st.intuition * 0.015));
    const opened = rng() < openChance;
    const boxAct = { type: 'pandoras-box', hoh, opened, socialBeats: [] };
    if (opened) {
      grantPower(prizeId, hoh, { week: week.num, visibility: 'secret', source: 'bb-pandoras-box' });
      // The public half of the bargain: the house pays for the HOH's
      // curiosity, and the HOH pays in credibility. The claim is the lie
      // Matt told — the prize itself never appears in a public field.
      const claims = ['a dollar', 'a protein bar', 'a photo from home', 'twenty-four hours of elevator music'];
      boxAct.publicClaim = claims[Math.floor(rng() * claims.length)];
      boxAct.consequence = 'backyard-lockdown';
      if (seasonConfig.popularityEnabled !== false) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[hoh] = (gs.popularity[hoh] || 0) - 1;
      }
      // Whoever reads people best in this house smells the lie first.
      const readers = house.filter(n => n !== hoh)
        .sort((a, b) => pStats(b).intuition - pStats(a).intuition).slice(0, 2);
      for (const reader of readers) {
        _cappedBondWindow(() => addBond(reader, hoh, -0.3));
        boxAct.socialBeats.push({
          text: `${reader} listens to ${hoh} explain that the box held ${boxAct.publicClaim}, nods along, and believes approximately none of it. Nobody locks down a backyard over ${boxAct.publicClaim}.`,
          players: [reader, hoh], badgeText: 'SMELLS A LIE', badgeClass: 'grey',
          eventId: 'pandoras-box-doubt', category: 'ceremonies', location: 'backyard',
          effects: [{ kind: 'bond', text: `${reader} & ${hoh} -0.3`, delta: -0.3 }],
        });
      }
      boxAct.socialBeats.unshift({
        text: `The backyard doors lock with everybody's laundry still on the line, and a voice announces that the house can thank ${hoh} for it. ${hoh} emerges from the HOH room holding, apparently, ${boxAct.publicClaim}.`,
        players: [hoh], badgeText: 'THE PRICE', badgeClass: 'red',
        eventId: 'pandoras-box-consequence', category: 'ceremonies', location: 'backyard',
        effects: [{ kind: 'pop', text: `${hoh} -1`, delta: -1 }],
      });
    } else {
      boxAct.socialBeats.push({
        text: `${hoh} looks at the question mark on the door for a long time, and leaves it closed. The house never finds out what was inside, which is exactly how ${hoh} wants to sleep tonight.`,
        players: [hoh], badgeText: 'LEFT CLOSED', badgeClass: 'grey',
        eventId: 'pandoras-box-declined', category: 'ceremonies', location: 'hoh-room',
      });
    }
    week.pandorasBox = { hoh, opened, publicClaim: boxAct.publicClaim || null };
    week.acts.push(boxAct);
  }

  // The house now knows who holds power, and reacts to it.
  if (!compressed) houseAct('post-hoh');

  // Nomination act — directed power: target, pawn, and an optional backdoor plan.
  plan = hook(hooks, 'nominationResult', plan, { week, house, hoh }) || plan;
  let nominees = [...new Set(plan.nominees)].filter(name => house.includes(name) && name !== hoh).slice(0, 2);
  if (nominees.length < 2) nominees = chooseNominationPlan(hoh, house, rng).nominees;
  // A Block Buster week is always three on the block — the third chair is the
  // mode, not a choice the Head of Household gets to make. Three go up, the
  // three compete, and two face the vote.
  //
  // The third is named by the same read that names a replacement, so it is
  // another target rather than a name out of a hat.
  while ((safetyActive || doubleVote) && nominees.length < nomineeCount) {
    const third = chooseReplacement(hoh, house, [hoh, ...nominees], plan, rng);
    if (!third || nominees.includes(third)) break;
    nominees.push(third);
  }
  nominees.forEach(name => gs.bb.stats[name].timesNominated++);
  setSpotlight({ nominees: [...nominees] });
  week.initialNominees = [...nominees];
  week.plan = plan;

  // ── the promises this ceremony just broke ──
  //
  // Safety deals are made BEFORE nominations, which is the only time they are
  // worth anything: a houseguest buys a week out of the box from the person
  // holding the pen. Then the Head of Household nominates them anyway, and
  // until now that cost precisely nothing. The deal stayed active, the person
  // who had been promised safety carried no grievance about it, and the house
  // never found out that the word of the person in power was worthless.
  //
  // Breaking it here rather than at the vote matters: the betrayal is the
  // NOMINATION. By Thursday it is old news and the block has already done the
  // damage.
  //
  // What counts, and what does not. Sitting your final-two partner in a chair
  // as a pawn is not a broken promise — the promise is about the END, and using
  // somebody you trust as the safe half of a block is ordinary, survivable
  // Big Brother. Measured without this distinction, 55% of weeks broke a
  // promise, which makes a promise worth nothing.
  //
  // Two things are betrayals. Breaking a SAFETY deal, which is a specific
  // promise not to do this exact thing. And nominating a partner as the actual
  // TARGET, where the chair is not a formality.
  week.brokenPromises = [];
  _cappedBondWindow(() => {
    for (const nominee of nominees) {
      const deal = dealBetween(hoh, nominee);
      if (!deal || deal.active === false) continue;
      const isSafety = (deal.type || '') === 'safety';
      const isTarget = plan.target === nominee && plan.pawn !== nominee;
      if (!isSafety && !isTarget) continue;
      const broken = breakDeal(deal, hoh, { week, reason: isSafety
        ? 'promised safety and nominated them anyway' : 'nominated their own partner as the target' });
      if (!broken) continue;
      const sincere = (() => { try { return sincerityOf(deal, hoh); } catch { return 1; } })();
      week.brokenPromises.push({ hoh, victim: nominee, type: deal.type || 'deal', sincere,
        kind: isSafety ? 'safety' : 'target' });
      // Being nominated by somebody who gave you their word is worse than being
      // nominated. It is the difference between a move and a lie.
      addBond(nominee, hoh, -2.6);
      try {
        setBBTarget(nominee, hoh, isSafety
          ? 'promised me safety and put me up anyway'
          : 'shook on the end with me and then came for me', { week });
        rememberStrategy(nominee, hoh, 'broke-a-promise', week.num, 3,
          { format: 'big-brother', about: deal.type || 'safety', at: 'the nomination ceremony' });
        // And it is a public act — the wall says so — which is exactly the kind
        // of enemy a reign is scored on making.
        reignMadeAnEnemy(week, nominee);
      } catch { /* the promise still broke */ }
    }
  });

  week.acts.push(addBeats({ type: 'nominations', nominees: [...nominees], target: plan.target, pawn: plan.pawn, backdoorTarget: plan.backdoorTarget,
    structure: plan.structure || 'target-pawn', structureWhy: plan.structureWhy || '',
    anonymous: hohSecret,
    brokenPromises: [...week.brokenPromises], pawnAsk: week.pawnAsk || null }, { nominees: [...nominees] }));
  revise('noms', { hoh, nominees: [...nominees] });

  // ══════════════════════════════════════════════════════════════════
  // The Battle of the Block
  // ══════════════════════════════════════════════════════════════════
  //
  // The co-Head of Household names two of their own, all four nominees play as
  // pairs, and the winning pair comes off the block AND takes their Head of
  // Household's power with them. What is left is one HOH and two nominees —
  // an ordinary week — which is why nothing downstream of here needs to know
  // this twist exists.
  if (week.botbActive && coHoh) {
    const ineligible = new Set([hoh, coHoh, ...nominees]);
    let coPlan = chooseNominationPlan(coHoh, house, rng);
    let coNominees = [...new Set(coPlan.nominees)]
      .filter(name => house.includes(name) && !ineligible.has(name)).slice(0, 2);
    // Nobody can sit on both blocks, and the pool can run thin, so the second
    // pair is topped up the same way a replacement is chosen.
    while (coNominees.length < 2) {
      const extra = chooseReplacement(coHoh, house, [...ineligible, ...coNominees], coPlan, rng);
      if (!extra || coNominees.includes(extra) || ineligible.has(extra)) break;
      coNominees.push(extra);
    }
    if (coNominees.length === 2) {
      coNominees.forEach(name => gs.bb.stats[name].timesNominated++);
      week.coNominees = [...coNominees];
      week.acts.push(addBeats({ type: 'nominations', nominees: [...coNominees],
        target: coPlan.target, pawn: coPlan.pawn, backdoorTarget: coPlan.backdoorTarget,
        structure: coPlan.structure || 'target-pawn', structureWhy: coPlan.structureWhy || '',
        byCoHoh: true, hoh: coHoh, brokenPromises: [], pawnAsk: null },
        { nominees: [...coNominees] }));

      // ── the competition ──
      //
      // Four nominees, two pairs, and the pair is the unit that wins. The
      // dispatcher scores individuals, so the pair's result is its members'
      // average — a partner who cannot play is a partner who costs you the
      // week, which is the whole social cruelty of the format.
      const four = [...nominees, ...coNominees];
      const botbComp = runBBCompetition({
        type: 'arena', participants: four, excluded: house.filter(n => !four.includes(n)),
        house, week, rng, library: competitionLibrary,
        forcedId: options.forcedCompetitions?.botb, seed: options.seed,
        haveNots: week.haveNots || [],
      });
      // The arena library is written for the Block Buster, where ONE nominee
      // comes off the block alone, so its closing beats announce each player's
      // fate individually — "Axel stays nominated" on a night Axel was saved by
      // a partner. The pair result supersedes them, so they come off here
      // rather than contradicting the screen and the transcript.
      const TERMINAL = new Set(['STAYS NOMINATED', 'OFF THE BLOCK']);
      botbComp.beats = (botbComp.beats || []).filter(b => !TERMINAL.has(b?.badgeText));

      const avg = pair => pair.reduce((sum, n) => sum + (botbComp.scores[n] || 0), 0) / Math.max(1, pair.length);
      const hohPairScore = avg(nominees);
      const coPairScore = avg(coNominees);
      const hohPairWins = hohPairScore >= coPairScore;

      const savedPair = hohPairWins ? [...nominees] : [...coNominees];
      const stuckPair = hohPairWins ? [...coNominees] : [...nominees];
      const dethroned = hohPairWins ? hoh : coHoh;
      const reigning = hohPairWins ? coHoh : hoh;

      week.battleOfTheBlock = {
        hohs: [hoh, coHoh], pairs: { [hoh]: [...nominees], [coHoh]: [...coNominees] },
        scores: { [hoh]: Math.round(hohPairScore * 100) / 100, [coHoh]: Math.round(coPairScore * 100) / 100 },
        saved: savedPair, stuck: stuckPair, dethroned, reigning,
        competition: botbComp,
      };
      week.acts.push(addBeats({ type: 'battle-of-the-block',
        hohs: [hoh, coHoh], pairs: { [hoh]: [...nominees], [coHoh]: [...coNominees] },
        saved: savedPair, stuck: stuckPair, dethroned, reigning,
        // What it cost, recorded rather than only applied — a bond delta is
        // invisible against a pre-existing friendship, so the act carries the
        // penalty itself for the transcript and the debug panel.
        fallout: { savedToDethroned: -1.2, stuckToReigning: -0.8, dethronedPopularity: -2, savedPopularity: 2 },
        winner: savedPair[0], competition: botbComp,
        results: botbComp.placements.map(n => ({ name: n, score: botbComp.scores[n] })),
      }, { nominees: [...stuckPair] }));

      // ── what it costs ──
      //
      // Being dethroned is a public humiliation: the house watched somebody's
      // own nominees take their power off them, and the pair who did it walk
      // away safe. None of that is cosmetic.
      for (const name of savedPair) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[name] = (gs.popularity[name] || 0) + 2;
        gs.bb.competitionMemories ||= {};
        (gs.bb.competitionMemories[name] ||= []).push({
          type: 'botb-saved', competitionId: botbComp.id, week: week.num,
          detail: { dethroned, partner: savedPair.find(x => x !== name) || null },
        });
        // You do not forgive the person who put you up just because you got
        // yourself down again.
        try { addBond(name, dethroned, -1.2); } catch { /* no bond, no fallout */ }
      }
      gs.popularity[dethroned] = (gs.popularity[dethroned] || 0) - 2;
      (gs.bb.competitionMemories[dethroned] ||= []).push({
        type: 'botb-dethroned', competitionId: botbComp.id, week: week.num,
        detail: { by: [...savedPair], reigning },
      });
      // The pair still on the block know exactly who left them there.
      for (const name of stuckPair) {
        try { addBond(name, reigning, -0.8); } catch { /* no bond, no fallout */ }
      }

      // The week collapses back to one HOH and two nominees.
      hoh = reigning;
      week.hoh = reigning;
      week.dethronedHoh = dethroned;
      nominees = [...stuckPair];
      week.initialNominees = [...stuckPair];
      plan = hohPairWins ? coPlan : plan;
      week.plan = plan;
      gs.bb.stats[reigning].hohWins++;      // credited to the reign that survived
      gs.bb.stats[dethroned].hohWins--;     // and taken back off the one that did not
      setSpotlight({ hoh: reigning, nominees: [...stuckPair] });
      revise('noms', { hoh: reigning, nominees: [...stuckPair] });
    } else {
      // Not enough of a house left to seat a second pair; the week runs normally.
      week.botbActive = false;
      week.coHoh = null;
    }
  }

  /**
   * Who a houseguest DECIDES did this to them, when nobody signed the work.
   *
   * The guess is intuition-proportional and it is allowed to be wrong —
   * that is the entire realism of the twist. A wrong guess is not cosmetic:
   * the grievance, the bond damage and the strategic memory all land on the
   * innocent name, exactly like the vote-detection misattribution layer.
   * One guess per person per week, stored, so every later reaction stays
   * consistent with the first one.
   */
  const _invisibleGuess = who => {
    week.hohGuesses ||= [];
    const prior = week.hohGuesses.find(g => g.who === who);
    if (prior) return prior.guess;
    const blockNow = week.initialNominees || nominees;
    const candidates = house.filter(n => n !== who && !blockNow.includes(n));
    const st = pStats(who);
    const correct = rng() < Math.min(0.75, 0.22 + st.intuition * 0.05);
    let guess = hoh;
    if (!correct) {
      guess = candidates.filter(n => n !== hoh)
        .sort((a, b) => getPerceivedBond(who, a) - getPerceivedBond(who, b))[0] || hoh;
    }
    week.hohGuesses.push({ who, guess, correct: guess === hoh });
    return guess;
  };

  // ── The bloc's fingerprints on the block ──
  // Alliances were shaping nominations invisibly: the plan protects the
  // preferred core, every member dodges the block, and the screen never said
  // so — which reads as alliances not mattering. When the HOH's alliance
  // walked away clean, the ceremony names it, with the small real
  // consequence that being protected in public is: the members notice.
  if (!hohSecret) {
    const hohBloc = (gs.namedAlliances || [])
      .filter(a => a.active !== false && !a.dissolved && (a.members || []).includes(hoh))
      .map(a => ({ ...a, inHouse: (a.members || []).filter(m => house.includes(m)) }))
      .filter(a => a.inHouse.length >= 3)
      .sort((a, b) => b.inHouse.length - a.inHouse.length)[0];
    if (hohBloc && !nominees.some(n => hohBloc.inHouse.includes(n))) {
      const nomAct = week.acts[week.acts.length - 1];
      const shielded = hohBloc.inHouse.filter(m => m !== hoh);
      shielded.forEach(m => _cappedBondWindow(() => addBond(hoh, m, 0.15)));
      (nomAct.socialBeats ||= []).push({
        text: `Nobody says the name out loud, but the block has a shape: every member of ${hohBloc.name} is off it. ${shielded.slice(0, 3).join(', ')}${shielded.length > 3 ? ' and the rest' : ''} clock what ${hoh} just did for them — and so does everybody who is NOT in that room.`,
        players: [hoh, ...shielded.slice(0, 3)],
        badgeText: 'THE BLOC HOLDS', badgeClass: 'blue',
        eventId: 'alliance-shaped-block', category: 'ceremonies', location: 'living-room',
        effects: shielded.slice(0, 3).map(m => ({ kind: 'bond', text: `${hoh} & ${m} +0.15`, delta: 0.15 })),
      });
      nomAct.allianceShield = { alliance: hohBloc.name, protected: shielded };
    }
  }

  if (hohSecret) {
    const nomAct = week.acts[week.acts.length - 1];
    for (const nom of nominees) {
      const guess = _invisibleGuess(nom);
      const entry = week.hohGuesses.find(g => g.who === nom);
      const temper = pStats(nom).temperament;
      const hit = -(0.5 + (10 - temper) * 0.06);
      _cappedBondWindow(() => addBond(nom, guess, hit));
      try {
        rememberStrategy(nom, guess, 'renomination', week.num, entry.correct ? 2 : 1.5,
          { act: 'nominations', invisible: true, certain: false });
      } catch { /* memory is texture */ }
      (nomAct.socialBeats ||= []).push({
        text: entry.correct
          ? `${nom} does the arithmetic — who benefits, who has been too calm, who would not meet ${pronouns(nom).posAdj} eye this morning — and lands on ${guess}. ${nom} is right, and has no way to know it.`
          : `${nom} runs the week back and decides it was ${guess}. The logic is airtight, the certainty grows by the hour, and it is aimed at entirely the wrong person.`,
        players: [nom, guess],
        badgeText: entry.correct ? 'DEAD RIGHT' : 'THE WRONG NAME',
        badgeClass: entry.correct ? 'gold' : 'red',
        eventId: 'invisible-hoh-guess', category: 'ceremonies', location: 'bedroom',
        effects: [{ kind: 'bond', text: `${nom} & ${guess} ${hit.toFixed(1)}`, delta: hit }],
      });
    }
  }

  // Two people are on the block and the rest of the house is not.
  if (!compressed) houseAct('post-noms', { nominees: [...nominees] });

  // ── Instant Eviction: there is no veto, so nominations stand ──
  // The whole middle of the week — the draw, the competition, the ceremony and
  // the two stretches of house life around them — simply does not happen. The
  // pair named by the HOH are the pair the house votes on.
  if (skipVeto) {
    week.vetoWinner = null;
    week.vetoCompetition = null;
    week.finalNominees = [...nominees];
    nominees.forEach(name => gs.bb.stats[name].timesOnTheBlock++);
    week.acts.push(addBeats(
      { type: 'instant-eviction', nominees: [...nominees], hoh },
      { nominees: [...nominees] }));
  }

  if (!skipVeto) {
    // Veto act — player draw, competition, and lobbying.
    const vetoDraw = drawVetoPlayers(house, hoh, nominees, rng,
      (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } },
      plan?.backdoorTarget || null);
    week.vetoDraw = vetoDraw;
    let vetoPlayers = vetoDraw.players;
    vetoPlayers = hook(hooks, 'vetoParticipants', vetoPlayers, { week, house, hoh, nominees: [...nominees] }) || vetoPlayers;
    vetoPlayers = [...new Set(vetoPlayers)].filter(name => house.includes(name));
    const vetoCompetition = runBBCompetition({ type:'veto', participants:vetoPlayers, excluded:house.filter(name => !vetoPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.veto, nominees, hoh, seed:options.seed, haveNots: week.haveNots || [] });
    const vetoResults = vetoCompetition.placements.map(name => ({ name, score:vetoCompetition.scores[name], threw:!!vetoCompetition.debug.scoreBreakdown[name]?.threw }));
    let vetoWinner = hook(hooks, 'vetoOutcome', vetoCompetition.winner, { week, results:vetoResults, competition:vetoCompetition, nominees: [...nominees] });
    if (!vetoPlayers.includes(vetoWinner)) vetoWinner = vetoCompetition.winner;
    gs.bb.stats[vetoWinner].vetoWins++;
    week.vetoWinner = vetoWinner;
    setSpotlight({ vetoWinner, vetoPlayers: [...vetoPlayers] });
    week.vetoCompetition = vetoCompetition;
    recordCompDominance(vetoCompetition, house, week.num);
    week.acts.push(addBeats({ type: 'veto', participants: vetoPlayers, winner: vetoWinner,
      results:vetoResults, competition:vetoCompetition, draw: vetoDraw.draws,
      automatic: vetoDraw.automatic }, { nominees: [...nominees], vetoWinner }));

    // Somebody holds the veto and has not yet said what they will do with it.
    if (!compressed) houseAct('post-veto', { nominees: [...nominees], vetoWinner });

    // Veto ceremony. The twist contract decides who owns the empty chair:
    // by default the HOH names the replacement; under the Diamond Power of
    // Veto that authority belongs to the veto holder, which is the entire
    // twist — winning it means controlling both chairs.
    //
    // The diamond week is the power inventory's first preset: the week's own
    // veto competition is the distributor, so winning the comp IS the grant.
    // The instance is the record — holder, window, visibility — and any
    // OTHER distributor that hands somebody a public diamond lands on the
    // same ceremony path through activePowerAt.
    if (week.twistState?.rules?.replacementAuthority === 'veto-holder') {
      grantPower('diamond-veto', vetoWinner,
        { week: week.num, visibility: 'public', source: 'bb-diamond-veto' });
    }
    const grantedDiamond = activePowerAt('veto-ceremony', week.num);
    const diamond = week.twistState?.rules?.replacementAuthority === 'veto-holder'
      || (grantedDiamond?.holder === vetoWinner && grantedDiamond?.powerId === 'diamond-veto');
    const chairAuthority = diamond ? vetoWinner : hoh;
    let vetoDecision = shouldUseVeto(vetoWinner, nominees, plan, rng, { hoh, house, diamond, hohSecret });
    vetoDecision = hook(hooks, 'vetoDecision', vetoDecision, { week, house, hoh, nominees: [...nominees], vetoWinner }) || vetoDecision;
    let replacement = null;
    let replacementWhy = '';
    // The vetoed houseguest cannot be renominated the same week — the
    // show's actual rule, and previously only an accident of the HOH's
    // scoring. A diamond holder reasoning from their own target list made
    // the gap reachable: save your target, name your target. And when that
    // rule leaves NOBODY eligible for the chair — a small house where the
    // HOH, the holder and the other nominee are everyone — the veto cannot
    // change the block, so it stays in the box and the ceremony says why.
    if (vetoDecision.use && nominees.includes(vetoDecision.save)
      && !house.some(n => n !== hoh && n !== vetoWinner && !nominees.includes(n))) {
      vetoDecision = { use: false, save: null, reason: 'no-replacement',
        why: `${vetoWinner} could take ${vetoDecision.save} down, but there is no eligible houseguest left to put up in the empty chair. The rules make the decision: the medallion stays in the box.` };
    }
    if (vetoDecision.use && nominees.includes(vetoDecision.save)) {
      const protectedNames = [hoh, vetoWinner, vetoDecision.save, ...nominees.filter(name => name !== vetoDecision.save)];
      // The chooser reasons from their OWN plan. An HOH follows the week's
      // nomination plan; a diamond holder follows their own read of the house,
      // which is what makes the twist a hijacking rather than a formality.
      const chooserPlan = diamond && vetoWinner !== hoh
        ? { target: getBBTarget(vetoWinner) || null, pawn: null, backdoorTarget: getBBTarget(vetoWinner) || null }
        : plan;
      replacement = chooseReplacement(chairAuthority, house, protectedNames, chooserPlan, rng);
      replacement = hook(hooks, 'replacementChoice', replacement, { week, house, hoh, vetoWinner, saved: vetoDecision.save, protectedNames }) || replacement;
      if (!house.includes(replacement) || protectedNames.includes(replacement)) replacement = chooseReplacement(chairAuthority, house, protectedNames, chooserPlan, rng);
      // Why that name, given who was actually eligible. The chair's owner
      // and the veto winner are immune, so late in a season this can be a pool
      // of one — which the reasoning says out loud rather than pretending to a
      // decision that was not available.
      replacementWhy = explainReplacement(chairAuthority, replacement,
        house.filter(n => !protectedNames.includes(n)), chooserPlan, nominees);
      nominees = nominees.map(name => name === vetoDecision.save ? replacement : name);
      gs.bb.stats[vetoDecision.save].timesSaved++;
      gs.bb.stats[replacement].timesNominated++;
      // Being pulled off the block is the clearest debt the game can create,
      // and the writer for it existed unused — obligation was empty across
      // entire seasons while the veto decision was busy READING it. Saving
      // yourself creates no debt to anybody.
      if (vetoDecision.save !== vetoWinner) {
        try { recordProtection(vetoWinner, vetoDecision.save, { strength: 1.6, ep: week.num }); } catch { /* texture */ }
      }
    }
    week.finalNominees = [...nominees];
    nominees.forEach(name => gs.bb.stats[name].timesOnTheBlock++);
    // The reasoning travels with the decision. Without it the ceremony could
    // report what happened and never why, which is the whole complaint.
    week.vetoDecision = { ...vetoDecision, holder: vetoWinner, replacement,
      diamond, chairAuthority };
    if (diamond) {
      week.diamondVeto = { holder: vetoWinner, used: !!vetoDecision.use, replacement };
      // The ceremony spends the instance either way: a public diamond IS this
      // week's veto, so an unused one leaves the ceremony as a record, not a
      // live power somebody could sit on.
      const inst = activePowerAt('veto-ceremony', week.num);
      if (inst?.holder === vetoWinner) usePower(inst, week.num);
    }
    week.acts.push(addBeats({ type: 'veto-ceremony', used: !!vetoDecision.use,
      saved: vetoDecision.save, replacement, holder: vetoWinner,
      diamond, chairAuthority, anonymous: hohSecret && !diamond,
      reason: vetoDecision.reason, why: vetoDecision.why, replacementWhy,
      nominees: [...nominees] },
      // Handed over explicitly rather than left to be inferred. actFacts works
      // `saved` out by diffing week.initialNominees against week.finalNominees,
      // and finalNominees is not written until after this act exists — so every
      // event on this act that needs to know who came down was reading null,
      // and veto-saved-gratitude could never fire.
      { nominees: [...nominees], vetoWinner,
        saved: vetoDecision.save || null, replacement, used: !!vetoDecision.use }));
    revise('veto', { hoh, nominees: [...nominees], vetoWinner, saved: vetoDecision.save || null });

    // The person who just went up ALWAYS reacts. The ceremony act schedules
    // one to three beats from the general pool, and in about half of all
    // measured weeks none of them so much as mentioned the replacement — so
    // somebody could be backdoored at noon and spend the evening on the feed
    // laughing at a card game. If the scheduler did not produce their scene,
    // this writes it, with the consequences a renomination actually has.
    if (vetoDecision.use && replacement && replacement !== chairAuthority) {
      // The anger lands on whoever actually named them. Under the Diamond
      // Veto that is the holder — the HOH spent the week planning a block the
      // holder just rewrote, and the replacement knows exactly whose voice
      // said their name. On an invisible week nobody's voice said it, so the
      // grievance lands on the replacement's own guess — right or wrong.
      const namer = (hohSecret && !diamond) ? _invisibleGuess(replacement) : chairAuthority;
      const ceremonyAct = week.acts[week.acts.length - 1];
      const mentioned = (ceremonyAct.socialBeats || []).some(b => (b.players || []).includes(replacement));
      if (!mentioned) {
        const temper = pStats(replacement).temperament;
        const bondHit = -(0.8 + (10 - temper) * 0.08);
        _cappedBondWindow(() => addBond(replacement, namer, bondHit));
        try { rememberStrategy(replacement, namer, 'renomination', week.num, 2, { act: 'veto-ceremony', diamond }); } catch { /* memory is texture */ }
        const effects = [{ kind: 'bond', text: `${replacement} & ${namer} ${bondHit.toFixed(1)}`, delta: bondHit }];
        // The hotter the head, the more likely the week now has a mission.
        if (rng() < ((10 - temper) / 10) * 0.5) {
          try {
            setBBTarget(replacement, namer, diamond
              ? `${namer} used the Diamond Veto to put me up`
              : `${namer} put me up as the veto came down`, { week });
            effects.push({ kind: 'target', text: `${replacement} is coming for ${namer}` });
          } catch { /* target store missing in odd harnesses */ }
        }
        const lines = [
          `${replacement} does not sit down when the meeting ends. The chair is not the problem; the week ${replacement} spent believing ${namer} was fine with ${pronouns(replacement).obj} is.`,
          `${replacement} walks straight past ${namer} into the bedroom and starts packing a bag nobody asked ${pronouns(replacement).obj} to pack. Everybody understands the message.`,
          `"So that was the plan the whole time." ${replacement} says it to the room, but it is aimed at ${namer}, and it lands.`,
          `${replacement} laughs once, too loudly, and asks who else knew. The silence answers more precisely than anybody wanted it to.`,
          `${replacement} finds ${namer} within the hour and asks for the real reason. What ${pronouns(replacement).sub} gets is the speech version, and both of them know it.`,
        ];
        let hash = 0;
        const salt = `${week.num}|${replacement}|${namer}`;
        for (let i = 0; i < salt.length; i++) hash = (hash * 31 + salt.charCodeAt(i)) >>> 0;
        ceremonyAct.socialBeats.push({
          text: lines[hash % lines.length],
          players: [replacement, namer],
          badgeText: 'RENOMINATED', badgeClass: 'red',
          eventId: 'veto-renomination-reaction', category: 'ceremonies', location: 'living-room',
          effects,
        });
      }
      // And the dethroned half of it: an HOH whose replacement was chosen FOR
      // them has a grievance of their own, aimed at the holder who rewrote
      // the week in public.
      if (diamond && vetoWinner !== hoh) {
        const hohTemper = pStats(hoh).temperament;
        const hohHit = -(0.5 + (10 - hohTemper) * 0.06);
        _cappedBondWindow(() => addBond(hoh, vetoWinner, hohHit));
        try { rememberStrategy(hoh, vetoWinner, 'diamond-hijack', week.num, 2, { act: 'veto-ceremony', replacement }); } catch { /* memory is texture */ }
        ceremonyAct.socialBeats.push({
          text: `${hoh} keeps the Head of Household key and loses the week it was supposed to buy. ${vetoWinner} named ${replacement} from ${hoh}'s own ceremony chair, and everybody watched ${hoh} find out with the rest of the room.`,
          players: [hoh, vetoWinner],
          badgeText: 'HIJACKED', badgeClass: 'red',
          eventId: 'diamond-veto-hijack', category: 'ceremonies', location: 'living-room',
          effects: [{ kind: 'bond', text: `${hoh} & ${vetoWinner} ${hohHit.toFixed(1)}`, delta: hohHit }],
        });
      }
    }
  }

  // ── The last competition of the week, played by the people on the block ──
  // Three went up; two will face the vote. Whoever wins here has saved
  // themselves rather than been saved, which the house reads very differently
  // from a veto — and the two who lose have now been beaten in front of
  // everybody on the night they most needed not to be.
  let heldSafetyAct = null;
  if (safetyActive && nominees.length >= 3) {
    const arena = runBBCompetition({
      type: 'arena', participants: [...nominees], excluded: house.filter(n => !nominees.includes(n)),
      house, week, rng, library: competitionLibrary, forcedId: options.forcedCompetitions?.arena,
      nominees: [...nominees], hoh, seed: options.seed, haveNots: week.haveNots || [],
    });
    const results = arena.placements.map(name => ({ name, score: arena.scores[name] }));
    let saved = hook(hooks, 'safetyOutcome', arena.winner, { week, results, competition: arena, nominees: [...nominees] });
    if (!nominees.includes(saved)) saved = arena.winner;
    week.blockBeforeSafety = [...nominees];
    week.safetyWinner = saved;
    week.safetyCompetition = arena;
    gs.bb.stats[saved].timesSaved++;
    // Winning your way off the block is a competition win, and the house
    // watched you do it. It was only recorded as "times saved", so somebody who
    // took the Block Buster three weeks running never registered as a
    // competition threat and nobody ever came for them because of it.
    gs.bb.stats[saved].blockBusterWins++;
    nominees = nominees.filter(name => name !== saved);
    // The RESULT is computed here because everything downstream — ballots,
    // plans, campaigns — is modelled over the final two. But the ACT is held
    // back and pushed after the campaign stretch, because that is when the
    // house plays it: the Block Buster is the last competition of the week,
    // minutes before the vote. Pushing it here made the whole back half of
    // the week behave as if it had already aired — the third nominee lost
    // their place on the wall, sat out the campaigning, and read as safe
    // three days before anybody was.
    // The arena is a competition the whole house watched — it writes respect
    // and comp fear like any other win, and doubly so: this one was won with
    // the winner's life on the line.
    recordCompDominance(arena, house, week.num);
    // The Block Buster act does NOT draw from the general event pool. The
    // scheduler kept decorating the most pressurised ninety seconds of the
    // week with kitchen texture — somebody starting a card game in the middle
    // of a last-chance competition — because almost no event gates the
    // 'safety' act. The moment has exactly four stories and they are always
    // the same four: the save, each defeat, and the room doing arithmetic.
    // They are written here, with their consequences.
    heldSafetyAct = { type: 'safety', mode: safetyMode, participants: [...week.blockBeforeSafety],
      winner: saved, results, competition: arena, nominees: [...nominees], socialBeats: [] };
    {
      const pick = (lines, ...salt) => {
        const key = `${week.num}|${salt.join('|')}`;
        let h = 0;
        for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
        return lines[h % lines.length];
      };
      const stillUp = week.blockBeforeSafety.filter(n => n !== saved);
      const winnerStats = pStats(saved);
      if (seasonConfig.popularityEnabled !== false) {
        gs.popularity ||= {};
        gs.popularity[saved] = (gs.popularity[saved] || 0) + 1;
      }
      // Written first, PUSHED last — the broadcast closes on the winner. The
      // original order aired the exhale before the defeats it was an answer
      // to, which read backwards on screen: losers absorb it, the last two
      // find each other, and only then does the camera give the winner the
      // final word.
      const saveBeat = {
        text: pick([
          `${saved} hits the buzzer and does not let go of it. Whatever composure ${pronouns(saved).sub} carried into the arena is gone — this was not a competition win, it was a stay of execution, and everybody in the room can tell the difference.`,
          `${saved} does not celebrate so much as exhale for the first time in four days. The block is a place, and ${pronouns(saved).sub} just walked out of it in front of everybody.`,
          `${saved} looks at the two podiums beside ${pronouns(saved).obj} before looking at anything else. Winning this meant somebody else did not, and the somebody is standing right there.`,
          `The horn goes and ${saved} sits down on the arena floor, right there, in front of the house. Nobody laughs.`,
        ], saved, 'save'),
        players: [saved], badgeText: 'OFF THE BLOCK', badgeClass: 'green',
        eventId: 'arena-save', category: 'ceremonies', location: 'backyard',
        effects: [{ kind: 'pop', text: `${saved} plays well on camera`, delta: 1 }],
      };
      for (const loser of stillUp) {
        const temper = pStats(loser).temperament;
        try { rememberStrategy(loser, saved, 'beat-me-in-the-arena', week.num, 1, { act: 'safety' }); } catch { /* texture */ }
        heldSafetyAct.socialBeats.push({
          text: pick(temper <= 4 ? [
            `${loser} kicks the podium hard enough that a producer somewhere flinches. Beaten, in public, with the vote hours away — there is no version of this ${pronouns(loser).sub} can stand.`,
            `${loser} says nothing, which for ${loser} is the loudest possible reaction. The jaw does the talking.`,
            `${loser} walks off the arena floor before the horn finishes sounding. Somebody starts to say something kind and thinks better of it.`,
            `${loser} looks at the scoreboard like it owes ${pronouns(loser).obj} money. Hours from the vote, and the last chance just went to somebody else.`,
          ] : [
            `${loser} claps for ${saved}, because that is who ${loser} is — and then holds the clap a half-second too long, because the vote is tonight and the last door just closed.`,
            `${loser} stands very still on the podium while the house files out. Losing the arena is not losing the vote. ${pronouns(loser).Sub} repeats that a few times.`,
            `${loser} congratulates ${saved} and means it, mostly. There is a version of this night where that buzzer was ${pronouns(loser).pos}, and it is going to play all evening.`,
            `${loser} manages a smile that everybody recognises as work. Two chairs left, and ${pronouns(loser).sub} is still in one of them.`,
          ], loser, 'defeat'),
          players: [loser], badgeText: 'STILL ON THE BLOCK', badgeClass: 'red',
          eventId: 'arena-defeat', category: 'ceremonies', location: 'backyard',
          effects: [{ kind: 'memory', text: `${loser} remembers this`, players: [loser] }],
        });
      }
      // The two who remain share the worst seat in the house, and shared
      // dread is a real bond — the format's least likely friendships start
      // exactly here.
      if (stillUp.length === 2) {
        _cappedBondWindow(() => addBond(stillUp[0], stillUp[1], 0.7));
        heldSafetyAct.socialBeats.push({
          text: pick([
            `${stillUp[0]} and ${stillUp[1]} end up next to each other on the walk back inside, because nobody else knows what to say to either of them. One of them is leaving tonight, and for about thirty seconds they are the only two people in the house who understand each other completely.`,
            `The house gives ${stillUp[0]} and ${stillUp[1]} a wide, kind berth. The two of them split the last of something from the fridge without discussing it.`,
            `${stillUp[0]} catches ${stillUp[1]}'s eye across the arena floor. Rivals until the horn, and now the only two people in the same boat, hours from the shore.`,
            `${stillUp[0]} and ${stillUp[1]} sit on opposite ends of the same couch, which in this house counts as solidarity.`,
          ], 'pair'),
          players: [...stillUp], badgeText: 'THE LAST TWO', badgeClass: 'grey',
          eventId: 'arena-shared-fate', category: 'ceremonies', location: 'living-room',
          effects: [{ kind: 'bond', text: `${stillUp[0]} & ${stillUp[1]} +0.7`, delta: 0.7 }],
        });
      }
      // The closing card: the winner gets the last word.
      heldSafetyAct.socialBeats.push(saveBeat);
    }
  }
  week.finalNominees = [...nominees];
  setSpotlight({ nominees: [...new Set([...(gs.bb.spotlight?.nominees || []), ...nominees])] });

  // ── Somebody leaves before the house gets to decide ──
  // A walkout or an expulsion takes the week's eviction with it: the house is
  // already down one, so there is nothing to vote on. Checked here so the week
  // still played out normally up to the point it went wrong.
  const departure = rollDeparture(house, {
    mode: options.departures || 'off', rng, round: week.num || 1,
    atRisk: nominees, deprived: week.haveNots || [],
  });
  if (departure) {
    week.departure = { ...departure };
    week.evicted = departure.name;
    try { dropFromHousePlans(departure.name); } catch { /* plans survive it */ }
    week.votes = {};
    week.ballots = [];
    week.tieBreak = null;
    week.voteChanges = 0;
    week.acts.push(addBeats(
      { type: 'departure', ...departure, nominees: [...nominees] },
      { nominees: [...nominees], evicted: departure.name }));

    gs.activePlayers = house.filter(name => name !== departure.name);
    expirePowers(week.num, gs.activePlayers);
    if (!gs.eliminated.includes(departure.name)) gs.eliminated.push(departure.name);
    week.allianceChanges.betrayals = _cappedBondWindow(() => settleBBAllianceWeek(week, rng));
  _attachAllianceFallout(week, house);
  week.endgameDeals = endgameDealSummary(gs.activePlayers || []);
  week.housePlans = Object.fromEntries((gs.activePlayers || [])
    .map(name => [name, describeHousePlan(name)]).filter(([, text]) => text));
  week.closingState = _snapshotHouse();
    week.perceptionChanges = updateBBPerceptions({ house: gs.activePlayers, week, rng });
    _attachRomance(week, rng);
    // How they wore it, judged on what the week actually achieved rather than on
  // what they meant. The house holds this against them next week.
  try { week.reign = week.hohSecret ? null : recordReign(week); } catch { week.reign = null; }
  gs.bb.outgoingHoh = week.hohSecret ? null : hoh;
    gs.bb.weeks.push(week);
    gs.episode = (gs.episode || 0) + 1;
    return week;
  }

  // Days 5–6 — votes begin from bonds, then campaigning can visibly move them.
  let voters = house.filter(name => name !== hoh && !nominees.includes(name));
  voters = hook(hooks, 'voteEligibility', voters, { week, house, hoh, nominees: [...nominees] }) || voters;
  voters = [...new Set(voters)].filter(name => house.includes(name) && name !== hoh && !nominees.includes(name));
  // Step 1 of the operation: everybody's own starting position, kept on the
  // ballot as `preference` so eviction night can replay the whole chain —
  // what they wanted, what a room asked of them, what they claimed, what
  // they cast.
  const ballots = voters.map(voter => {
    const pref = initialVotePreference(voter, nominees, rng);
    return { voter, ...pref, preference: pref.evict, changed: false };
  });
  week.preCampaignVotes = tally(ballots, nominees);
  // Commitments read off the STARTING positions — how firmly each voter holds
  // what they walked in wanting — because that firmness is what the rooms are
  // about to push against.
  const commitments = new Map(ballots.map(b => [b.voter, houseVoteCommitment(b, nominees)]));
  week.voteCommitments = [...commitments.values()];
  // Steps 2–6: the alliances meet, settle names, count what they hold, and go
  // recruiting. This runs BEFORE the nominees campaign, so the campaign is
  // fought against real plans — and it is the pass that used to be the silent
  // applyAllianceVoteBloc mutation, now recorded in full: every member's
  // answer, every approach, every refusal, every yes that was a lie. It also
  // writes `stated` — the public position — HERE, so anything that moves a
  // ballot after this point is visible as a move.
  week.voteOperation = runVoteOperation({ ballots, nominees, hoh, commitments, rng });
  week.blocMoves = week.voteOperation.moves;
  week.campaign = [];
  // A compressed cycle has no time in it: one round of campaigning, live, with
  // the house voting on the spot. That compression IS the twist.
  const campaignActCount = compressed ? 1
    : (options.campaignActCount || (house.length >= 12 ? 3 : house.length >= 7 ? 2 : 1));
  // Which pitcher has already worked which voter this week, and how it went —
  // so the feed shows each conversation once, plus the follow-up if it lands.
  const pitchPairSeen = new Map();
  for (let campaignIndex = 0; campaignIndex < campaignActCount; campaignIndex++) {
    const campaign = resolveBBCampaignAct({ nominees, ballots, house, campaignIndex, rng });
    week.campaign.push(campaign);
    // Until the Block Buster airs, THREE people are on the block, and the
    // campaign days have to look like it: events, badges and the memory wall
    // read the pre-arena nominees. The ballots underneath stay on the final
    // two — that is the result the arena has already decided — but nobody in
    // the house gets to act like they know it.
    const visibleBlock = week.blockBeforeSafety || nominees;
    const campaignAct = addBeats({
      type:'campaign', campaignIndex, events:campaign.pitches,
      pitches:campaign.pitches, pitchIntel:campaign.intel,
      counterplay:campaign.counterplay, voteChanges:campaign.changed,
      votesAfterAct:tally(ballots, nominees),
    }, { nominees:[...visibleBlock], ballots });

    // The pitches were structured data rendered only by a screen of their own.
    // With that screen gone they become beats like everything else, so
    // campaigning reads in the feed alongside the rest of the day — and carries
    // the actual argument rather than the fact that one was made.
    // One beat per VOTER WORKED, not per pitch.
    //
    // A pitch is one nominee's whole campaign — it carries `pitcher`,
    // `pitchTarget` and a `responses` array, one entry per person they got
    // alone. Reading it as though it were a single conversation produced
    // "undefined gets undefined alone" and printed the same argument three
    // times, because the argument is a read of the VOTER and there was no voter
    // to read.
    // One conversation per pair per WEEK, not per act. The engine re-runs the
    // pitches every campaign act — that is fine for the ballots — but showing
    // each run put the identical argument on the feed three times, and a voter
    // who moved in act one could be shown "not moving" in act three, which
    // reads as a contradiction rather than persistence. A repeat is only worth
    // a card when something CHANGED: the holdout finally moves.
    const pitchBeats = (campaign.pitches || []).flatMap(pitch =>
      (pitch.responses || []).map(response => {
        const pairKey = `${pitch.pitcher}→${response.voter}`;
        const before = pitchPairSeen.get(pairKey);
        pitchPairSeen.set(pairKey, before || response.accepted);
        if (before !== undefined && !(response.accepted && before !== true)) return null;
        const worn = before !== undefined;   // this is the follow-up that landed
        let words = '';
        try { words = campaignArgument(pitch.pitcher, response.voter, pitch.pitchTarget); } catch { words = ''; }
        return {
          text: worn
            ? `${pitch.pitcher} goes back to ${response.voter} — same argument, new day. This time ${response.voter} listens, and something in the count changes.`
            : `${pitch.pitcher} gets ${response.voter} alone. ${words}`
              + ` ${response.accepted
                ? `${response.voter} listens, and something in the count changes.`
                : `${response.voter} hears all of it and does not move.`}`,
          players: [pitch.pitcher, response.voter],
          badgeText: response.accepted ? (worn ? 'WORN DOWN' : 'RECEPTIVE') : 'UNMOVED',
          badgeClass: response.accepted ? 'green' : 'grey',
          eventId: 'campaign-pitch', category: 'deals', location: 'bedroom',
        };
      }).filter(Boolean));
    // The arena winner works the room like everybody else — they are on the
    // block as far as they know. One conversation per voter for the week,
    // same discipline as the real pitches; a small real consequence so the
    // scene is not scenery.
    const thirdBeats = [];
    if (week.safetyWinner && week.blockBeforeSafety && campaignIndex === 0) {
      const third = week.safetyWinner;
      const rival = [...nominees].sort((a, b) =>
        getPerceivedBond(third, a) - getPerceivedBond(third, b))[0];
      for (const ballot of ballots.slice()
        .sort((a, b) => (Number(a.margin) || 0) - (Number(b.margin) || 0)).slice(0, 2)) {
        let words = '';
        try { words = campaignArgument(third, ballot.voter, rival); } catch { words = ''; }
        _cappedBondWindow(() => addBond(ballot.voter, third, 0.3));
        thirdBeats.push({
          text: `${third} gets ${ballot.voter} alone — three chairs, and ${third} is not waiting `
            + `for a competition to decide which ones matter. ${words}`,
          players: [third, ballot.voter],
          badgeText: 'STILL ON THE BLOCK', badgeClass: 'red',
          eventId: 'campaign-pitch-third', category: 'deals', location: 'bedroom',
          effects: [{ kind: 'bond', text: `${ballot.voter} & ${third} +0.3`, delta: 0.3 }],
        });
      }
    }
    campaignAct.socialBeats = [...thirdBeats, ...pitchBeats, ...(campaignAct.socialBeats || [])];
    week.acts.push(campaignAct);
  }
  // The Block Buster airs HERE — after the campaigning it was invisibly
  // hanging over, immediately before the vote it decides the shape of.
  if (heldSafetyAct) week.acts.push(heldSafetyAct);

  // ── After the campaigns: the last consolidation, then the forecast ──
  // The bandwagon rolls once the count is visible; the forecast is taken LAST,
  // after every room, pitch and jump has moved whatever it is going to move.
  // That ordering is the fix: the blindside verdict used to be judged against
  // a count recorded before the blocs whipped, so the "truth" it compared
  // beliefs to was a count that no longer existed by Thursday.
  week.bandwagon = applyHouseBandwagon({ ballots, nominees, commitments, rng });
  // Step 8: what everybody THINKS is about to happen — believed counts stay
  // private reads (allies assumed with you, strangers guessed from bonds),
  // while `truth` is now the ballots as they will actually be cast.
  week.votePlans = buildHouseVotePlans({ ballots, nominees, hoh });
  // The final pleas, with mechanics — AFTER the forecast, because the Voting
  // Plans screen is the house's read walking into the live show, and a plea
  // that lands is exactly the thing a forecast cannot see. The verdict is
  // then re-trued against the post-plea ballots so a plea-moved vote does not
  // read as everybody having counted wrong.
  week.finalPleas = resolveFinalPleas({ nominees, ballots, hoh, week, commitments, rng });
  if ((ballots || []).some(b => b.pleaMove)) {
    for (const p of week.votePlans) {
      p.truth = ballots.filter(b => b.evict === p.target).length;
      p.error = p.believed - p.truth;
      p.wrong = (p.believed >= p.majority) !== (p.truth >= p.majority);
    }
  }
  week.voteBroken = ballots
    .filter(b => b.stated !== b.evict && commitments.get(b.voter)?.promised)
    .map(b => ({ voter: b.voter, promised: b.stated, cast: b.evict }));

  // ── The detonation ──
  // A secret Diamond Power of Veto fires HERE — at the live show, after every
  // plea and forecast, exactly where Matt Hoffman detonated the canonical one:
  // the holder stands up, takes a nominee off the block, names the
  // replacement personally, and the house votes on a pair it did not know
  // existed two minutes ago. Every plan, plea and forecast this week was
  // built on a block that was never real.
  if (!compressed) {
    const inst = activePowerAt('eviction-night', week.num);
    const holder = inst?.holder;
    if (inst && inst.powerId === 'diamond-veto' && house.includes(holder)) {
      const hst = pStats(holder);
      const myTarget = getBBTarget(holder);
      const lastWindowWeek = week.num >= inst.expiresAfterWeek;
      let save = null;
      if (nominees.includes(holder)) {
        save = holder; // sitting on the block holding this is not a dilemma
      } else {
        const ally = [...nominees].sort((a, b) =>
          getPerceivedBond(holder, b) - getPerceivedBond(holder, a))[0];
        const allyWorth = Math.max(0, getPerceivedBond(holder, ally)) * 0.09;
        // Saving an ally, or spending expiry pressure on a move: both scale
        // with how strategically the holder thinks, never a hard gate.
        const targetSeatable = myTarget && myTarget !== hoh && myTarget !== holder
          && !nominees.includes(myTarget);
        const pull = allyWorth
          + (lastWindowWeek ? 0.18 : 0)
          + (targetSeatable ? hst.strategic * 0.035 : 0);
        if (rng() < Math.min(0.85, pull)) save = ally;
      }
      if (save) {
        const other = nominees.find(n => n !== save);
        const protectedNames = [hoh, holder, save, other].filter(Boolean);
        const chooserPlan = { target: myTarget || null, pawn: null, backdoorTarget: myTarget || null };
        let replacement = chooseReplacement(holder, house, protectedNames, chooserPlan, rng);
        if (replacement && house.includes(replacement) && !protectedNames.includes(replacement)) {
          usePower(inst, week.num);
          inst.revealed = true;
          nominees = nominees.map(n => (n === save ? replacement : n));
          week.finalNominees = [...nominees];
          gs.bb.stats[save].timesSaved++;
          gs.bb.stats[replacement].timesNominated++;
          gs.bb.stats[replacement].timesOnTheBlock++;
          // Ballot surgery, in the open: the replacement stops voting, the
          // saved houseguest starts, and everybody who had written the saved
          // name recasts between the pair that actually exists.
          const dropped = ballots.findIndex(b => b.voter === replacement);
          if (dropped >= 0) ballots.splice(dropped, 1);
          for (const b of ballots) {
            if (b.evict === save) {
              const pref = initialVotePreference(b.voter, nominees, rng);
              b.evict = pref.evict; b.changed = true; b.dpovMove = true;
            }
          }
          if (!ballots.some(b => b.voter === save) && save !== hoh) {
            const pref = initialVotePreference(save, nominees, rng);
            ballots.push({ voter: save, ...pref, preference: pref.evict, changed: false, dpovAdded: true });
          }
          const replacementWhy = explainReplacement(holder, replacement,
            house.filter(n => !protectedNames.includes(n)), chooserPlan, nominees);
          week.diamondDetonation = { holder, saved: save, replacement,
            source: inst.source, selfSave: save === holder, replacementWhy };
          // The fallout is immediate and public. The replacement's grievance
          // and the HOH's are both aimed at the one person whose voice did
          // this — and the whole house just learned what the box really held.
          const beats = [];
          _cappedBondWindow(() => addBond(replacement, holder, -(1.0 + (10 - pStats(replacement).temperament) * 0.08)));
          try { rememberStrategy(replacement, holder, 'renomination', week.num, 3, { act: 'diamond-detonation' }); } catch { /* texture */ }
          beats.push({
            text: `${replacement} was on the sofa in eviction-night clothes with a speech ${pronouns(replacement).sub} never expected to give. There is no campaign, no plea, no time. ${replacement} takes the nomination chair while the room is still processing the rule.`,
            players: [replacement, holder], badgeText: 'AMBUSHED', badgeClass: 'red',
            eventId: 'dpov-ambush', category: 'ceremonies', location: 'living-room',
            effects: [{ kind: 'bond', text: `${replacement} & ${holder}`, delta: -1 }],
          });
          if (hoh && hoh !== holder) {
            _cappedBondWindow(() => addBond(hoh, holder, -0.7));
            try { rememberStrategy(hoh, holder, 'diamond-hijack', week.num, 3, { act: 'diamond-detonation', replacement }); } catch { /* texture */ }
            beats.push({
              text: `${hoh} finds out with the rest of the house that the week ${pronouns(hoh).sub} ran was never the real one. ${holder} had the actual power the whole time, and chose eviction night to say so.`,
              players: [hoh, holder], badgeText: 'HIJACKED', badgeClass: 'red',
              eventId: 'diamond-veto-hijack', category: 'ceremonies', location: 'living-room',
              effects: [{ kind: 'bond', text: `${hoh} & ${holder} -0.7`, delta: -0.7 }],
            });
          }
          if (week.pandorasBox?.opened && week.pandorasBox.hoh === holder) {
            beats.push({
              text: `Somebody says it out loud: "${week.pandorasBox.publicClaim}. You told us it was ${week.pandorasBox.publicClaim}." ${holder} does not apologize, because a lie that works this well is not something you apologize for.`,
              players: [holder], badgeText: 'THE LIE, COLLECTED', badgeClass: 'gold',
              eventId: 'dpov-lie-collected', category: 'ceremonies', location: 'living-room',
            });
          }
          week.acts.push({ type: 'diamond-detonation', ...week.diamondDetonation, socialBeats: beats });
        }
      }
    }
  }

  // Eviction act; HOH breaks a tie.
  const votes = tally(ballots, nominees);
  let evicted;
  let secondEvicted = null;
  let tieBreak = null;
  if (doubleVote && nominees.length >= 3) {
    // One vote, three chairs, two walks. The two highest evict-getters both
    // leave; the only tie that matters is the BOUNDARY — second place versus
    // the survivor — and the HOH's preference settles it, exactly like an
    // ordinary tied vote.
    const ranked = [...nominees].sort((a, b) => (votes[b] || 0) - (votes[a] || 0));
    evicted = ranked[0];
    secondEvicted = ranked[1];
    if ((votes[ranked[1]] || 0) === (votes[ranked[2]] || 0)) {
      const preference = initialVotePreference(hoh, [ranked[1], ranked[2]], rng);
      secondEvicted = preference.evict;
      tieBreak = { voter: hoh, evict: secondEvicted, slot: 2, anonymous: hohSecret };
    }
  } else if (votes[nominees[0]] === votes[nominees[1]]) {
    const preference = initialVotePreference(hoh, nominees, rng);
    evicted = preference.evict;
    // An invisible HOH still breaks the tie — through the wall screen, with
    // the room watching nobody stand up.
    tieBreak = { voter: hoh, evict: evicted, anonymous: hohSecret };
  } else {
    evicted = votes[nominees[0]] > votes[nominees[1]] ? nominees[0] : nominees[1];
  }
  if (!doubleVote) {
    evicted = hook(hooks, 'evictionResult', evicted, { week, house, hoh, nominees: [...nominees], ballots, votes, tieBreak }) || evicted;
    if (!nominees.includes(evicted)) evicted = votes[nominees[0]] >= votes[nominees[1]] ? nominees[0] : nominees[1];
  }
  week.evicted = evicted;
  week.secondEvicted = secondEvicted;
  week.votes = votes;
  week.ballots = ballots;
  // The canonical reveal: the Invisible HOH tells the EVICTEE in a goodbye
  // message — the house keeps its guesses, the person on the jury knows.
  if (hohSecret && evicted) {
    week.invisibleReveal = { to: evicted, hoh };
    try { rememberStrategy(evicted, hoh, 'invisible-hoh-was', week.num, 2, { format: 'big-brother' }); } catch { /* jury texture */ }
  }
  // An organizer who named the vote and then delivered it earns strategic
  // respect from the people who watched it happen — the other event-driven
  // source of the dimension, and the one that makes "big move" mean something
  // in the next week's reads.
  for (const plan of week.voteOperation?.plans || []) {
    if (plan.target !== evicted || plan.expected < plan.majority) continue;
    for (const s of plan.stances) {
      if (s.voter === plan.organizer || s.stance === 'elsewhere') continue;
      try {
        recordStrategicRespect(s.voter, plan.organizer, 0.45,
          `${plan.organizer} called the vote and delivered it`, week.num);
      } catch { /* texture only */ }
    }
  }
  week.tieBreak = tieBreak;
  week.voteChanges = ballots.filter(ballot => ballot.changed).length;
  // Eviction night gets its beats like every other act. It was the one act
  // hardcoded to silence, which made a farewell speech - one of the format's
  // signature moments - impossible to write. The evicted houseguest is passed
  // through so events can be about the person actually leaving.
  week.acts.push(addBeats(
    { type: 'eviction', nominees: [...nominees], ballots, votes, tieBreak, evicted,
      secondEvicted, doubleVote },
    { nominees: [...nominees], evicted, votes, ballots }));

  // Voting out the person you promised the end to IS breaking the deal, and it
  // was going unrecorded: thirty-two final twos were made across a season and
  // not one of them was ever broken before the final three, because only the
  // final cut could break one. The vote is where most betrayals actually
  // happen — somebody walks to the jury knowing exactly who did it.
  week.dealBreaks = [];
  for (const gone of [evicted, secondEvicted].filter(Boolean)) {
    for (const ballot of ballots) {
      if (ballot.evict !== gone) continue;
      const deal = dealBetween(ballot.voter, gone);
      if (!deal) continue;
      const broken = breakDeal(deal, ballot.voter, { week, reason: 'voted them out' });
      if (!broken) continue;
      // The person leaving knows. So does anybody who was in the room when
      // the votes were read, which in this house is everybody.
      exposeDeal(deal, [gone, ...gs.activePlayers]);
      try {
        rememberStrategy(gone, ballot.voter, 'broken-final-two', week.num, 3,
          { format: 'big-brother', tier: tierOf(deal) });
      } catch { /* the break still stands */ }
      week.dealBreaks.push({ breaker: ballot.voter, victim: gone, tier: tierOf(deal), madeEp: deal.madeEp });
    }
  }
  gs.activePlayers = house.filter(name => name !== evicted && name !== secondEvicted);
  // Powers whose holder just left, or whose window just closed, end here.
  expirePowers(week.num, gs.activePlayers);
  if (!gs.eliminated.includes(evicted)) gs.eliminated.push(evicted);
  if (secondEvicted && !gs.eliminated.includes(secondEvicted)) gs.eliminated.push(secondEvicted);
  // Somebody leaving rearranges everybody's plan: a shield walks out and the
  // person hiding behind them is suddenly the biggest thing in the room, and a
  // promise made to somebody who is now in the jury is not a promise any more.
  try { dropFromHousePlans(evicted); } catch { /* plans survive a bad eviction */ }
  if (secondEvicted) { try { dropFromHousePlans(secondEvicted); } catch { /* both walks count */ } }

  // ── The door opens backwards ──
  //
  // Run AFTER the eviction is on the books, because both aired versions put
  // that night's evictee in the field — the person who just lost the vote gets
  // to fight it immediately. A returnee is added back to the house here, so
  // everything downstream (plans, deals, perceptions, the closing snapshot)
  // already sees them standing in the room.
  if (!compressed && (week.twistState?.rules?.addSlots || []).includes('return')) {
    try {
      week.battleBack = runBattleBack({
        week, rng,
        style: options.battleBackStyle || 'gauntlet',
        competition: options.battleBackCompetition || null,
      });
      if (week.battleBack) {
        week.acts.push(week.battleBack);
        if (week.battleBack.returned) week.returnedHouseguest = week.battleBack.returned;
      }
    } catch (e) {
      // A twist that throws must not cost the season the week that already
      // happened — the eviction above is real whether the door opens or not.
      week.battleBack = null;
    }
  }
  try { _cappedBondWindow(() => settleDeals({ house: gs.activePlayers, week })); } catch { /* deals too */ }
  revise('eviction', { evicted });
  week.allianceChanges.betrayals = _cappedBondWindow(() => settleBBAllianceWeek(week, rng));
  _attachAllianceFallout(week, house);
  week.endgameDeals = endgameDealSummary(gs.activePlayers || []);
  week.housePlans = Object.fromEntries((gs.activePlayers || [])
    .map(name => [name, describeHousePlan(name)]).filter(([, text]) => text));
  week.closingState = _snapshotHouse();
  week.perceptionChanges = updateBBPerceptions({ house:gs.activePlayers, week, rng });
  _attachRomance(week, rng);
  // How they wore it, judged on what the week actually achieved rather than on
  // what they meant. The house holds this against them next week.
  try { week.reign = week.hohSecret ? null : recordReign(week); } catch { week.reign = null; }
  // An invisible winner was never publicly HOH, so nothing locks them out
  // of next week's competition — the twist's stated perk.
  gs.bb.outgoingHoh = week.hohSecret ? null : hoh;
  gs.bb.weeks.push(week);
  gs.episode = (gs.episode || 0) + 1;
  return week;
}

export function simulateBBSeason(options = {}) {
  const weeks = [];
  const finaleSize = options.finaleSize || 3;
  while ((gs.activePlayers || []).length > finaleSize) {
    weeks.push(simulateBBWeek(options));
  }
  return { weeks, finalists: [...gs.activePlayers] };
}

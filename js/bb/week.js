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
import { resolveBonusLife } from './bonus-life.js';
import { resolveHaltingHex } from './eviction-powers.js';
import { runCoinOfDestiny, coinNominations } from './coin-of-destiny.js';
import { runSafetySuite, safetySuiteSafe } from './safety-suite.js';
import { runCarePackage, runTimeCapsule, carePackageProtects, coHohNominee,
  carePackageVoteBlock, carePackageBribe, neverNots } from './care-package.js';
import { punishedHaveNots, applyPunishment, drawPunishment, BB_PUNISHMENTS } from './punishments.js';
import { resolveVetoRules, isDiamond } from './veto-rules.js';
import { applyVetoDrawTwist } from './veto-draw.js';
import { runPrizeExchange } from './prize-exchange.js';
import { sendToCamp, runCampComeback, campers, CAMP_SIZE } from './camp-comeback.js';
import { fillTeam, runMission } from './team-america.js';
import { runDenOfTemptation, resolveCurse } from './temptation.js';
import { runWhacktivity } from './whacktivity.js';
import { hidePower, searchForPower, hiddenPowerState } from './hidden-power.js';
import {
  chooseHackerBlockHack, chooseHackerVetoHack, chooseHackerVoteHack,
  makeHackerGuesser, recordHackerWin,
} from './hacker.js';
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
import { rememberBBStrategy } from './shared-strategy.js';
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
import { observeBlocs, readVoteTells, listBlocs, learnAbout, pointOfAttack, blocRoster } from './blocs.js';
import { recordBBVotes, tickBBKnowledge } from './knowledge.js';
import { checkBBLastWords } from './last-words.js';
import { generateBBJuryHouse } from './jury-house.js';
import { recordReign, reignMadeAnEnemy } from './reign.js';
import { resolveWeekTwistState } from './twist-contract.js';
import { grantPower, activePowerAt, usePower, expirePowers, powerLedgerFor, BB_POWER_DEFINITIONS } from './powers.js';

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
function chooseHaveNots(placements, house, wanted, hoh, passHolders = []) {
  // Worst-first among the people who actually competed — minus anybody holding
  // a Never-Not Pass, which is the one care package that outlives its week and
  // the only standing exemption in the game.
  const played = (placements || []).filter(name => house.includes(name) && name !== hoh
    && !passHolders.includes(name));
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
    // AFTER the ballots are facts and the house has talked, because the person
    // at the door is working from what they managed to piece together — not
    // from the ballots, which nobody but each voter has ever seen.
    //
    // Deliberately NOT handed the week's generator. Both of these draw their
    // own stable stream keyed by the week and the person, for the reason
    // knowledge.js gives for doing the same: whether somebody goes off at the
    // door should not depend on how many unrelated dice were rolled earlier in
    // the week. Threading `rng` in here also silently reseats every draw made
    // after it, which is not a bug in this feature but is a rewrite of every
    // seeded season anybody has saved.
    ['last words', () => { checkBBLastWords(week); }],
    // And then the room they walk into, which is the only place any of it can
    // be argued with.
    ['jury house', () => { generateBBJuryHouse(week); }],
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
/**
 * The faces a fallout beat should actually carry.
 *
 * Deduped, and never the person who was just evicted: these beats live on the
 * eviction screen, whose card header already draws the evictee, so repeating
 * them there sets the same face beside itself. It also reads wrong — the
 * argument about who flipped is had by the people still in the room.
 */
function _reactingFaces(names, week) {
  return [...new Set(names.filter(Boolean))].filter(n => n !== week?.evicted);
}

function _attachAllianceFallout(week, house) {
  const beats = [];
  // The cycle's own house. ORing in the global roster let alliance fallout
  // name somebody sealed off on the other side of a Split House wall.
  const inHouse = n => house.includes(n);

  for (const incident of week.allianceChanges?.betrayals || []) {
    const { player, victim, alliance, repair, known } = incident;

    // An undetected flip is not nothing — it is the best week of that player's
    // game — but it cannot be narrated as an accusation, because nobody has
    // anybody to accuse. The vote is read as a COUNT, so what the room actually
    // has is arithmetic that does not work, and the wrong person to suspect.
    if (!known) {
      beats.push({
        text: `The count does not work. <strong>${alliance}</strong> went into the vote sure of `
          + `its own numbers and came out of it one short, and nobody in that room is going to `
          + `admit which chair it came from. <strong>${player}</strong> asks the question twice, `
          + `loudly, and is believed.`,
        // The room, not the person who left. The eviction screen already draws
        // the evictee in its card header, so naming them again here put the
        // same face beside itself — which is how this reads as a bug even
        // though the beat is about the people staying behind.
        players: _reactingFaces([player, victim], week),
        badgeText: 'THE NUMBERS DO NOT ADD UP', badgeClass: 'grey',
        eventId: 'alliance-betrayal-unseen', category: 'deals', location: 'living-room',
      });
      // Somebody has to have done it, and the room has picked. This is the
      // half the viewer needs and the house never gets: the accusation lands
      // on a person who did nothing, and — when the real one steered it —
      // lands there because the real one put it there.
      const mis = incident.misattribution;
      if (mis) {
        beats.push({
          text: mis.deflected
            ? `<strong>${player}</strong> does not wait to be asked. By the time anybody has finished `
              + `counting, ${player} has walked <strong>${mis.reactor}</strong> through it twice and left `
              + `<strong>${mis.wrongSuspect}</strong>'s name sitting in the middle of it — not accused, `
              + `just the only one who fits. ${mis.reactor} arrives at it alone, which is why it sticks.`
            : `<strong>${mis.reactor}</strong> has decided it was <strong>${mis.wrongSuspect}</strong>. `
              + `It was not. There is no evidence and no confession, only a number that will not `
              + `reconcile and somebody who was already easy to believe it of — and the house now has a `
              + `feud running along a line that does not exist.`,
          players: _reactingFaces([mis.reactor, mis.wrongSuspect], week),
          badgeText: mis.deflected ? 'UNDER THE BUS' : 'WRONG SUSPECT',
          badgeClass: 'red',
          eventId: mis.deflected ? 'alliance-deflected-blame' : 'alliance-misattributed',
          category: 'deals', location: 'living-room',
        });
      }
      continue;
    }

    beats.push({
      text: `<strong>${player}</strong> votes to evict <strong>${victim}</strong>, even though they `
        + `were together in <strong>${alliance}</strong>. By the time everyone gets back inside, `
        + `the remaining members are comparing votes and asking where ${player} was.`,
      players: _reactingFaces([player, victim], week),
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
      // Deduped: a members array that picked up the same name twice drew the
      // same face beside itself in the card header.
      players: [...new Set(left)].slice(0, 4),
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
/**
 * Who was holding which alliance together, as it stood at the end of THIS week.
 *
 * Snapshotted rather than recomputed on replay: loyalty is made of bonds and
 * bonds keep moving, so a board rebuilt in December would show a season that
 * never happened. Taken at both week exits — the ordinary eviction and the
 * walkout/expulsion path — because a week that ended strangely still had
 * alliances in it.
 */
function _snapshotAllianceBoard() {
  try {
    const house = gs.activePlayers || [];
    return listBlocs()
      .filter(b => (b.members || []).every(m => house.includes(m)))
      .map(b => ({
        ...blocRoster(b),
        name: b.label || b.name || null,
        power: Math.round((b.power || 0) * 100) / 100,
        share: Math.round((b.share || 0) * 100) / 100,
        exposed: !!b.exposed,
      }));
  } catch { return []; }
}

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
  // A half-house behind a wall, and who is on the other side of it. Recorded
  // rather than inferred: `segment` is also set by a compressed second cycle,
  // so nothing downstream can tell the two apart without this.
  if (options.splitSide) {
    week.splitSide = options.splitSide;
    week.splitOther = [...(options.splitOther || [])];
    week.splitPicks = (options.splitPicks || []).map(p => ({ ...p }));
  }
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
      // A Battle of the Block week has TWO of them until the battle resolves,
      // and house life was only ever told about one — so half the power in the
      // room was invisible to every event that reacts to holding it.
      coHoh: week.hohSecret ? null : (week.coHoh || null),
      hohs: week.hohSecret ? []
        : (week.crownedHohs || [week.hoh, week.coHoh]).filter(Boolean),
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
        // The cycle's OWN house, never the global roster.
        //
        // Preferring gs.activePlayers was harmless while every week was played
        // by the whole house. Split House runs the engine over half of one, and
        // this line reached straight through the wall: plans revised on one
        // side named houseguests the side had not seen in days. Intersecting
        // still tracks anybody removed mid-week (a walkout, an expulsion)
        // without ever adding somebody who was never here.
        house: house.filter(n => !gs.activePlayers || gs.activePlayers.includes(n)),
        week, trigger, ...extra });
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
  //
  // A Split House gets exactly ONE of these and the whole house is in it. The
  // division has not happened yet at this point in the night — the crowning
  // comes first and the wall after it — so running this per side produced two
  // opening stretches behind a wall that did not exist, and put two House Life
  // screens in front of each nomination ceremony instead of one.
  //
  // A Split House skips it on BOTH sides (`skipOpeningHouse`) and builds the
  // stretch outside either week, because the sides are sealed: an opener run
  // in here — even over the undivided roster — forms cross-side bonds and
  // alliances inside a week that later names them out loud, which is the one
  // wall this twist exists to put up.
  if (!compressed && !options.skipOpeningHouse) houseAct('pre-hoh');

  // ── a Head of Household who was crowned before this cycle began ──
  //
  // Split House crowns both Heads of Household in ONE competition over the
  // whole house and only then divides it, so each half arrives with its power
  // already decided. Running a second competition inside the half would invent
  // a contest that never happened, so the cycle takes the name it was handed
  // and says where it came from.
  const preCrowned = options.preCrownedHoh && house.includes(options.preCrownedHoh)
    ? options.preCrownedHoh : null;

  // HOH act and the first scramble.
  const hohPlayers = house.filter(name => name !== gs.bb.outgoingHoh);
  const hohCompetition = preCrowned ? null
    : runBBCompetition({ type:'hoh', participants:hohPlayers, excluded:house.filter(name => !hohPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.hoh, seed:options.seed });
  const hohResults = hohCompetition
    ? hohCompetition.placements.map(name => ({ name, score:hohCompetition.scores[name], threw:!!hohCompetition.debug.scoreBreakdown[name]?.threw }))
    : [];
  let hoh = preCrowned
    || hook(hooks, 'hohResult', hohCompetition.winner, { week, results: hohResults, competition:hohCompetition, house });
  if (!preCrowned && !hohPlayers.includes(hoh)) hoh = hohCompetition.winner;

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
  // A pre-crowned Head of Household was already credited when they won the
  // competition that crowned them; counting it again here would double it.
  if (!preCrowned) gs.bb.stats[hoh].hohWins++;
  if (week.botbActive) {
    // A dethroned reign does not count as a reign — the wiki is explicit that
    // Frankie Grande's two dethroned weeks are not in his HOH record. The
    // co-HOH's win is credited only if they survive the battle, below.
    week.coHoh = coHoh;
    // Who was crowned, as a fact that survives the battle.
    //
    // `week.hoh` becomes the reign that SURVIVES, and roughly half the time
    // that is the co-HOH — at which point `hoh` and `coHoh` name the same
    // person and the pair of them no longer says who the two crowns were. Any
    // surface asking "who held power this week" then saw one name twice.
    week.crownedHohs = [hoh, coHoh];
    if (!hohSecret) setSpotlight({ hoh: coHoh });
  }
  week.hohCompetition = hohCompetition;
  // Winning in front of everybody is where strategic respect and comp fear
  // actually come from. The dimension writers existed and the house never
  // called them, so nobody in a season ever became "a comp threat" in
  // anyone's head no matter how many competitions they won.
  // Comp fear and strategic respect come from WATCHING somebody win. A
  // sealed result is watched by nobody, so the dimension writers stay quiet.
  if (!hohSecret && hohCompetition) recordCompDominance(hohCompetition, house, week.num);
  week.acts.push(addBeats({ type: 'hoh', winner: hoh, results: hohResults, competition:hohCompetition,
    outgoingHoh: gs.bb.outgoingHoh, secret: hohSecret,
    // Crowned before this cycle began, in a competition the other half of the
    // house also played. Flagged so the screen and the transcript can say so
    // instead of presenting a competition that is not there.
    preCrowned: !!preCrowned,
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
    const slop = chooseHaveNots(hohCompetition.placements, house, options.haveNotCount, hoh,
      neverNots().filter(n => house.includes(n)));
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
  // ── THE APP STORE: the audience hands out the powers ──
  //
  // The first distributor that is neither a competition nor a box. Nobody in
  // the house can earn one of these, so the only currency is screen time —
  // the audience votes for who it has been watching, which is popularity, and
  // popularity in this game is built by being loud rather than by playing
  // well. That is the twist: the powers land on the most WATCHED houseguests,
  // not the best ones, and the house cannot work out who got them.
  if (!compressed && twists.has('bb-app-store')) {
    // What is on the shelf, from the Format Designer. The default stocks the
    // whole inventory minus the Diamond Veto, which has its own distributors
    // and would otherwise be handed out twice in a week that ran both.
    const wanted = options.appStoreShelf || 'all';
    const shelf = (wanted === 'all'
      ? Object.keys(BB_POWER_DEFINITIONS).filter(id => id !== 'diamond-veto')
      : [wanted]).filter(id => BB_POWER_DEFINITIONS[id]);
    // Weighted by how much of the show a houseguest has been, with a floor so
    // an invisible houseguest is a long shot rather than an impossibility.
    const pool = house.map(name => ({
      name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)),
    }));
    const winners = [];
    for (const powerId of shelf) {
      const live = pool.filter(c => !winners.some(w => w.name === c.name));
      if (!live.length) break;
      const total = live.reduce((sum, c) => sum + c.weight, 0);
      let roll = rng() * total;
      let picked = live[live.length - 1];
      for (const c of live) { roll -= c.weight; if (roll <= 0) { picked = c; break; } }
      grantPower(powerId, picked.name,
        { week: week.num, visibility: 'holder-secret', source: 'bb-app-store' });
      winners.push({ name: picked.name, powerId, power: BB_POWER_DEFINITIONS[powerId].name });
    }
    if (winners.length) {
      week.appStore = { winners: winners.map(w => ({ ...w })) };
      week.acts.push(addBeats({
        type: 'app-store', secret: true, winners: winners.map(w => ({ ...w })),
        shelf: shelf.map(id => BB_POWER_DEFINITIONS[id].name),
      }, { players: winners.map(w => w.name) }));
    }
  }

  // ── TEAM AMERICA: three people with a job ──
  //
  // Runs at week opening, before nominations, because half the missions are
  // about steering a nomination and a job handed out after the keys turn is
  // not a job. Empty seats refill first — the show replaced members as they
  // were evicted, and a team of one cannot run a rumour.
  //
  // The plan goes in because the block mission edits it: "get a specific name
  // nominated" has to be able to actually seat somebody, and this is the last
  // point in the week where that is still possible. It only ever moves the
  // chair nobody was asked to sit in — the pawn negotiation above is a scene
  // the week has already shown, and quietly overwriting it would be a lie.
  if (!compressed && twists.has('bb-team-america')) {
    try {
      fillTeam(house, rng);
      week.teamAmerica = runMission({
        week, house, rng, forced: options.teamMission || null, plan, hoh,
      });
      if (week.teamAmerica) {
        week.acts.push(addBeats(week.teamAmerica, { players: week.teamAmerica.members }));
      }
    } catch { week.teamAmerica = null; }
  }

  // ── THE SAFETY SUITE: one entry, one season ──
  //
  // Runs before nominations because that is the only place it means anything,
  // and after the Head of Household is crowned because who holds the key is
  // most of what anybody is deciding about when they choose whether to swipe.
  if (!compressed && twists.has('bb-safety-suite')) {
    try {
      week.safetySuite = runSafetySuite({ week, house, hoh, rng });
      if (week.safetySuite) {
        // The Plus One's punishment is a real cost, so slop is real slop.
        if (week.safetySuite.punishment === 'slop' && week.safetySuite.plusOne) {
          week.haveNots = [...new Set([...(week.haveNots || []), week.safetySuite.plusOne])];
          gs.bb.haveNots = [...week.haveNots];
        }
        week.acts.push(addBeats(week.safetySuite,
          { players: [...safetySuiteSafe(week.safetySuite)] }));
      }
    } catch { week.safetySuite = null; }
  }

  // ── AMERICA'S CARE PACKAGE: the only distributor that hides nothing ──
  //
  // Contents announced before the vote, recipient named in front of everybody.
  // It runs here, with the other distributors and before nominations, because
  // two of the five packages (Super Safety, Co-HOH) change who can be seated
  // and the house has to be told who holds them before the keys turn.
  if (!compressed && twists.has('bb-care-package')) {
    try {
      // Two shapes on one audience channel. The Time Capsule (BB28) makes the
      // favourite EARN it — a challenge, a power if they beat it, a punishment
      // from a past season if they do not — and is the default, because a vote
      // that only ever hands out gifts has no second act in it. 'care-package'
      // runs BB18's straight delivery.
      const style = options.carePackageStyle === 'care-package' ? 'care-package' : 'time-capsule';
      week.carePackage = style === 'time-capsule'
        ? runTimeCapsule({ week, house, hoh, rng,
          shelf: options.capsuleShelf || null, rack: options.capsuleRack || null })
        : runCarePackage({
          week, house, hoh, rng, forced: options.carePackageForced || null,
        });
      if (week.carePackage) {
        week.acts.push(addBeats(week.carePackage, { players: [week.carePackage.recipient] }));
      }
    } catch { week.carePackage = null; }
  }

  // ── something in this house ──
  //
  // Hidden once, then looked for every week it stays findable. The search runs
  // at week opening because being SEEN looking is the cost, and the house has
  // to have all week to hold it against them.
  if (!compressed && twists.has('bb-hidden-power')) {
    try {
      const hid = hidePower({ week, house, rng, powerId: options.hiddenPowerId || 'the-cloud' });
      if (hid) week.acts.push(addBeats(hid, {}));
    } catch { /* the week runs with nothing behind the cereal */ }
  }
  if (!compressed && hiddenPowerState()) {
    try {
      const hunt = searchForPower({ week, house, nominees: [], rng });
      if (hunt) {
        week.hiddenPower = hunt;
        week.acts.push(addBeats(hunt, { players: (hunt.searchers || []).slice(0, 3) }));
      }
    } catch { /* nobody looked */ }
  }

  // Three doors, one choice each, and the Head of Household barred. Runs at
  // week opening alongside the other distributors and BEFORE nominations,
  // because the whole reason somebody picks the door that stops a nomination
  // is that they can see one coming.
  if (!compressed && twists.has('bb-whacktivity')) {
    try {
      const wanted = options.whacktivityDoors;
      // 'auto' stocks three of the shelf. Anything the Diamond Veto already has
      // two distributors for stays available here too — this is the only
      // channel you can actually PLAY for, so nothing is held back from it.
      const doors = Array.isArray(wanted) && wanted.length
        ? wanted
        : Object.keys(BB_POWER_DEFINITIONS).slice(0, 3);
      week.whacktivity = runWhacktivity({
        week, house, hoh, nominees: [], rng, offered: doors,
      });
      if (week.whacktivity) {
        week.acts.push(addBeats(week.whacktivity,
          { players: week.whacktivity.rooms.flatMap(r => r.entrants).slice(0, 4) }));
      }
    } catch (e) {
      week.whacktivity = null;
    }
  }

  // The only distributor whose price is paid by somebody who was not in the
  // room. Runs before nominations because the curse has to be able to seat a
  // third chair before the ceremony reads any names out.
  if (!compressed && twists.has('bb-den-of-temptation')) {
    try {
      week.temptation = runDenOfTemptation({
        week, house, rng, offered: options.temptationOffer || 'random',
      });
      if (week.temptation) {
        week.acts.push(addBeats(week.temptation, { players: [week.temptation.entrant] }));
      }
    } catch (e) {
      week.temptation = null;
    }
  }

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

      // ── the price, which used to be a string ──
      //
      // `consequence: 'backyard-lockdown'` was narration with nothing behind
      // it: the box cost a paragraph and a popularity point. It costs a real
      // punishment now, and the punishment lands on the HOH — they opened it
      // for personal gain, so they pay the visible half of a secret win.
      //
      // Which is the best interaction this twist has. The prize is invisible
      // and the price is not, so the house spends the week looking at a Head
      // of Household in a costume, knowing they opened that box for SOMETHING,
      // and never finding out what. It also makes the lie much harder to sell:
      // nobody gets put in a unitard over a protein bar.
      //
      // Costumes only. Slop is the Have-Not economy's currency and borrowing
      // it here would quietly make a second have-not every time the box opens.
      const priceId = drawPunishment(rng, p => !p.slop && !p.tether) || 'red-unitard';
      const priceDef = BB_PUNISHMENTS[priceId];
      applyPunishment(hoh, priceId, { week: week.num });
      boxAct.consequence = priceId;
      boxAct.consequenceName = priceDef.name;
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
          text: `${reader} listens to ${hoh} explain that the box held ${boxAct.publicClaim}, nods along, and believes approximately none of it. Nobody gets put in ${priceDef.name} over ${boxAct.publicClaim}.`,
          players: [reader, hoh], badgeText: 'SMELLS A LIE', badgeClass: 'grey',
          eventId: 'pandoras-box-doubt', category: 'ceremonies', location: 'backyard',
          effects: [{ kind: 'bond', text: `${reader} & ${hoh} -0.3`, delta: -0.3 }],
        });
      }
      boxAct.socialBeats.unshift({
        text: `${hoh} emerges from the HOH room in ${priceDef.name}, holding, apparently, ${boxAct.publicClaim}. `
          + `${priceDef.cost} Whatever was actually in that box, it is going to have to be worth a week of this.`,
        players: [hoh], badgeText: 'THE PRICE', badgeClass: 'red',
        eventId: 'pandoras-box-consequence', category: 'ceremonies', location: 'backyard',
        effects: [{ kind: 'pop', text: `${hoh} -1`, delta: -1 },
          { kind: 'punishment', text: `${hoh}: ${priceDef.name}` }],
      });
    } else {
      boxAct.socialBeats.push({
        text: `${hoh} looks at the question mark on the door for a long time, and leaves it closed. The house never finds out what was inside, which is exactly how ${hoh} wants to sleep tonight.`,
        players: [hoh], badgeText: 'LEFT CLOSED', badgeClass: 'grey',
        eventId: 'pandoras-box-declined', category: 'ceremonies', location: 'hoh-room',
      });
    }
    week.pandorasBox = { hoh, opened, publicClaim: boxAct.publicClaim || null,
      punishmentId: boxAct.consequence || null, punishment: boxAct.consequenceName || null };
    week.acts.push(boxAct);
  }

  // ── slop handed out by a PUNISHMENT, from wherever ──
  //
  // The have-not act ran before any of these distributors, so a punishment
  // that puts somebody on slop has to merge into the list rather than choose
  // from it. This used to live inside the care package block, which meant it
  // only worked for the one source that existed at the time; it is general
  // now, so anything that can punish can put somebody on slop.
  if (!compressed) {
    const punished = punishedHaveNots(week.num).filter(n => house.includes(n));
    if (punished.length) {
      week.haveNots = [...new Set([...(week.haveNots || []), ...punished])];
      gs.bb.haveNots = [...week.haveNots];
    }
  }

  // The house now knows who holds power, and reacts to it.
  if (!compressed) houseAct('post-hoh');

  // Nomination act — directed power: target, pawn, and an optional backdoor plan.
  plan = hook(hooks, 'nominationResult', plan, { week, house, hoh }) || plan;
  // A Head of Household cannot be nominated, and on a Battle of the Block week
  // there are two of them. The second ceremony already excluded both; the
  // first excluded only its own, so the first Head of Household could put the
  // other one on the block — which is not a nomination the format allows, and
  // which the draw had simply never produced until the competition library
  // grew and reshuffled it.
  // ── THE CLOUD ──
  //
  // Preventative and narrow. It is spent BEFORE the ceremony is read out and
  // it covers that ceremony only, so the holder walks out of nominations safe
  // and is still a legal replacement at the veto ceremony three days later.
  // That is the whole decision in the power: spend it on the ceremony you can
  // see, and hope the one you cannot see does not come for you.
  //
  // It used to fire the instant it existed, which threw the decision away: the
  // holder burned an eight-week power on the first ceremony whether or not
  // anybody was coming for them. So it is now a READ. The holder cannot see
  // the HOH's plan; intuition is how close they get to seeing it, warmth with
  // the Head of Household is why they talk themselves out of it, and an
  // expiring window is why they spend it on a quiet week anyway.
  const cloud = activePowerAt('nominations', week.num);
  let cloudPlayed = false;
  if (cloud && house.includes(cloud.holder) && cloud.holder !== hoh) {
    const st = pStats(cloud.holder);
    const aimedAt = (plan.nominees || []).includes(cloud.holder);
    const read = 0.30 + (st.intuition || 5) * 0.062;   // how well they sense it
    const comfort = Math.max(0, (() => {
      try { return getPerceivedBond(cloud.holder, hoh); } catch { return 0; }
    })()) * 0.045;
    const lastChance = week.num >= cloud.expiresAfterWeek ? 0.5 : 0;
    const pull = 0.06 + (aimedAt ? read : 0) + lastChance - comfort;
    cloudPlayed = rng() < Math.min(0.94, pull);
  }
  if (cloudPlayed) {
    usePower(cloud, week.num);
    week.cloud = { holder: cloud.holder, visibility: cloud.visibility };
    week.acts.push(addBeats({
      type: 'power-played', powerId: 'the-cloud', holder: cloud.holder,
      name: BB_POWER_DEFINITIONS['the-cloud'].name, timing: 'nominations',
      secret: cloud.visibility === 'secret', visibility: cloud.visibility,
      detail: `${cloud.holder} cannot be nominated at this ceremony. It does not cover the veto ceremony, `
        + 'and everybody who can count knows that.',
    }, { players: [cloud.holder] }));
  }

  // Super Safety and the Co-HOH key both protect for the whole WEEK, not for
  // one ceremony — which is the line between them and the Cloud sitting
  // directly above.
  const untouchable = [hoh, week.botbActive ? coHoh : null, week.cloud?.holder,
    carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite)].filter(Boolean);
  let nominees = [...new Set(plan.nominees)]
    .filter(name => house.includes(name) && !untouchable.includes(name)).slice(0, 2);
  while (nominees.length < 2) {
    const extra = chooseReplacement(hoh, house, [...untouchable, ...nominees], plan, rng);
    if (!extra || nominees.includes(extra) || untouchable.includes(extra)) break;
    nominees.push(extra);
  }
  if (nominees.length < 2) {
    nominees = chooseNominationPlan(hoh, house, rng).nominees
      .filter(name => house.includes(name) && !untouchable.includes(name)).slice(0, 2);
  }
  // ── the second key the Head of Household did not agree to ──
  //
  // A Co-HOH names one of the two nominees. It goes in the SECOND chair, so
  // the Head of Household keeps the target they actually wanted and loses only
  // the half of the block they were using as a pawn — which is precisely the
  // half they had a plan for.
  if (week.carePackage?.effect === 'co-hoh' && house.includes(week.carePackage.recipient)) {
    const co = coHohNominee({ act: week.carePackage, house, hoh, rng,
      untouchable: [...untouchable, nominees[0]].filter(Boolean) });
    if (co && !nominees.includes(co)) nominees = [nominees[0], co].filter(Boolean);
  }

  // A Block Buster week is always three on the block — the third chair is the
  // mode, not a choice the Head of Household gets to make. Three go up, the
  // three compete, and two face the vote.
  //
  // The third is named by the same read that names a replacement, so it is
  // another target rather than a name out of a hat.
  while ((safetyActive || doubleVote) && nominees.length < nomineeCount) {
    const third = chooseReplacement(hoh, house, [...untouchable, ...nominees], plan, rng);
    if (!third || nominees.includes(third)) break;
    nominees.push(third);
  }
  // ── BB ROADKILL: the third key nobody's hand is on ──
  //
  // Everybody plays, one at a time and out of sight of the rest, and only the
  // winner is told they won. They name a third nominee who goes up with the
  // Head of Household's two and no explanation attached.
  //
  // It runs HERE, after the Head of Household has settled on two and before
  // the ceremony reads them out, because that is the order the twist needs:
  // the winner is choosing a third name knowing the other two, and the house
  // hears all three at once with only two of them accounted for.
  const roadkillActive = week.twistState?.rules?.secretThirdNominator === true
    && !compressed && house.length >= 6;
  if (roadkillActive) {
    const rkComp = runBBCompetition({
      // A one-at-a-time side competition with a single winner is exactly the
      // tiebreaker slot's shape, and it keeps Roadkill out of the HOH and veto
      // pools so a week never plays the same competition twice.
      type: 'tiebreaker', participants: [...house], house, week, rng,
      library: competitionLibrary, seed: options.seed,
      forcedId: options.forcedCompetitions?.roadkill,
      haveNots: week.haveNots || [],
      // Nobody throws a competition they cannot be seen losing.
      allowThrowing: false,
    });
    const rkWinner = rkComp.winner;
    // Anybody except the Head of Household and whoever is already up — which
    // explicitly includes the winner's own allies, and is most of the reason
    // this twist hurts.
    const offLimits = [hoh, ...untouchable, ...nominees];
    let third = chooseReplacement(rkWinner, house, offLimits, plan, rng);
    if (!third || offLimits.includes(third) || !house.includes(third)) {
      third = house.find(n => !offLimits.includes(n) && n !== rkWinner)
        || house.find(n => !offLimits.includes(n));
    }
    if (third) {
      nominees.push(third);
      week.roadkill = { winner: rkWinner, nominee: third, competition: rkComp };
      week.acts.push(addBeats({
        type: 'roadkill', secret: true, winner: rkWinner, nominee: third,
        competition: rkComp,
        results: rkComp.placements.map(n => ({ name: n, score: rkComp.scores[n] })),
        // Why they picked this name, in their own read rather than the HOH's.
        why: explainReplacement(rkWinner, third, house.filter(n => !offLimits.includes(n)), plan, nominees),
      }, { nominees: [third] }));
      // Being put up by nobody is still being put up.
      gs.bb.competitionMemories ||= {};
      (gs.bb.competitionMemories[rkWinner] ||= []).push({
        type: 'roadkill-win', competitionId: rkComp.id, week: week.num,
        detail: { nominated: third },
      });
    }
  }

  // ── THE COIN OF DESTINY ──
  //
  // Runs after the Head of Household has settled on two, because the whole
  // power is taking those two away. Buying in is public, the game is public,
  // the call is not — so the house ends the night knowing the block changed
  // and never knowing whose hand changed it.
  const coinActive = week.twistState?.rules?.ceremonyAuthority === 'coin-holder'
    && !compressed && house.length >= 5;
  if (coinActive) {
    const coin = runCoinOfDestiny({ week, house, hoh, nominees: [...nominees], rng });
    if (coin) {
      const named = coinNominations({ act: coin, house, hoh, untouchable, rng });
      if (named && named.length === 2) {
        nominees = [...named];
        week.initialNominees = [...nominees];
        named.forEach(name => gs.bb.stats[name].timesNominated++);
        setSpotlight({ nominees: [...nominees] });
        revise('noms', { hoh, nominees: [...nominees] });
        // The dethroning is public and the hand is not, so the grievance has
        // nowhere to land — which is the entire difference from a Coup.
        week.coinDethroned = hoh;
      }
      week.coin = {
        winner: coin.winner, calledRight: coin.calledRight,
        buyers: [...coin.buyers], dethroned: coin.dethroned || null,
        nominees: [...(coin.nominees || [])],
      };
      week.acts.push(addBeats(coin, { nominees: [...(coin.nominees || [])] }));
    }
  }

  // ── AMERICA'S NOMINEE ──
  //
  // BB15's third chair, and the one nobody in the building filled. Two shapes,
  // both real: the audience votes a houseguest MVP and that houseguest names
  // the third nominee in secret, or the audience names the third itself.
  //
  // The MVP is chosen by popularity, which is the honest model of an audience
  // vote and also the cruel one — the house's most WATCHED player gets the
  // power, not its best. The nominee is chosen the same way in reverse: the
  // audience puts up whoever it has least time for.
  const mvpActive = week.twistState?.rules?.thirdChairNoReplacement === true
    && !compressed && house.length >= 6;
  if (mvpActive) {
    const style = options.americasNomineeStyle === 'mvp' ? 'mvp' : 'direct';
    const offLimits = [hoh, ...untouchable, ...nominees];
    const pool = house.filter(n => !offLimits.includes(n));
    if (pool.length) {
      const pop = name => (gs.popularity?.[name] || 0);
      let mvp = null;
      let third = null;
      if (style === 'mvp') {
        // The audience's favourite holds the pen, and uses their own read.
        mvp = [...house].sort((a, b) => pop(b) - pop(a))[0] || null;
        const theirPool = pool.filter(n => n !== mvp);
        third = theirPool.length
          ? chooseReplacement(mvp, house, [...offLimits, mvp], plan, rng) || theirPool[0]
          : null;
        if (third && !theirPool.includes(third)) third = theirPool[0];
      } else {
        // The audience nominates directly: least watched, least liked, with
        // enough noise that it is not simply a popularity sort every week.
        third = [...pool]
          .sort((a, b) => (pop(a) + rng() * 2) - (pop(b) + rng() * 2))[0] || null;
      }
      if (third) {
        nominees.push(third);
        week.americasNominee = { nominee: third, style, mvp };
        week.acts.push(addBeats({
          type: 'americas-nominee', secret: true, nominee: third, style, mvp,
          detail: style === 'mvp'
            ? `${mvp} was voted the Most Valuable Player and has named a third nominee. The house is told there is a third chair and not who filled it.`
            : 'The audience has named a third nominee. Nobody in this house had a vote and nobody in this house can be blamed.',
        }, { nominees: [third] }));
        if (style === 'mvp' && mvp) {
          gs.bb.competitionMemories ||= {};
          (gs.bb.competitionMemories[mvp] ||= []).push({
            type: 'mvp-nomination', week: week.num, detail: { nominated: third },
          });
        }
      }
    }
  }

  // ── the curse takes its chair ──
  //
  // Nobody chose this name and nobody can be blamed for it, which is what
  // separates it from Roadkill's third nominee: there is no chooser to hunt,
  // only a beneficiary. The cursed houseguest nominates THEMSELVES, so the
  // Head of Household's two are untouched and the ceremony gains a third
  // chair that the room cannot attribute to anybody in it.
  // The victim is drawn HERE rather than back in the Den, from houseguests who
  // can actually take the chair — everybody safe is off the list, so the draw
  // cannot land somewhere it is unable to sit. It used to be drawn at week
  // opening over the whole house, and a curse that hit the Head of Household
  // was announced to the viewer and then silently never seated.
  if (week.temptation?.accepted) {
    const curseAct = resolveCurse({
      week, house, rng,
      protectedNames: [...untouchable, ...nominees],
    });
    if (curseAct) {
      if (curseAct.cursed) {
        nominees.push(curseAct.cursed);
        week.temptationChair = curseAct.cursed;
      } else {
        week.temptationCurseMissed = true;
      }
      week.acts.push(addBeats(curseAct,
        curseAct.cursed ? { nominees: [curseAct.cursed] } : {}));
    }
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
    // Whose ceremony this was. On an ordinary week it is the week's only Head
    // of Household and nothing reads it; on a Battle of the Block week the
    // screen was crediting this ceremony to whichever HOH survived the battle,
    // which on half of them is the wrong person entirely.
    hoh,
    // Which chairs the Head of Household did NOT fill. A third nominee who
    // arrived by curse or by a secret winner's pen is still on the block, but
    // the ceremony is not the HOH's to claim: without this the script says "it
    // is my responsibility to nominate THREE people" and turns three keys for
    // somebody the HOH never chose.
    hohNominees: nominees.filter(n => n !== week.temptationChair && n !== week.roadkill?.nominee),
    curseChair: week.temptationChair || null,
    roadkillChair: week.roadkill?.nominee || null,
    brokenPromises: [...week.brokenPromises], pawnAsk: week.pawnAsk || null }, { nominees: [...nominees] }));
  revise('noms', { hoh, nominees: [...nominees] });

  // ══════════════════════════════════════════════════════════════════
  // THE HACKER
  // ══════════════════════════════════════════════════════════════════
  //
  // It runs HERE, after the ceremony, because that is the order the twist
  // needs: the house has heard two names read out and watched somebody take
  // responsibility for them, and then the wall changes by itself.
  //
  // Everybody plays alone, only the winner is told, and the winner is never
  // named. The first of their three authorities is spent now; the second at
  // the veto draw and the third at the count, each recorded separately because
  // they are separate decisions with separate fallout.
  const hackerActive = week.twistState?.rules?.hackerActive === true
    && !compressed && house.length >= 6;
  if (hackerActive) {
    const hkComp = runBBCompetition({
      // Same slot as Roadkill's: a lone time-trial with one winner, kept out of
      // the HOH and veto pools so a week never plays the same competition twice.
      type: 'tiebreaker', participants: [...house], house, week, rng,
      library: competitionLibrary, seed: options.seed,
      forcedId: options.forcedCompetitions?.hacker,
      haveNots: week.haveNots || [],
      // Nobody throws a competition nobody can see them lose.
      allowThrowing: false,
    });
    const hacker = hkComp.winner;
    week.hacker = { winner: hacker, competition: hkComp,
      blockHack: null, vetoHack: null, voteHack: null };

    const blockHack = chooseHackerBlockHack({
      hacker, nominees: [...nominees], house, hoh, plan, rng,
      protectedNames: [...untouchable, ...(week.botbSafe || [])],
    });
    if (blockHack.use && nominees.includes(blockHack.down) && house.includes(blockHack.up)) {
      nominees = nominees.map(name => (name === blockHack.down ? blockHack.up : name));
      week.initialNominees = [...nominees];
      gs.bb.stats[blockHack.up].timesNominated++;
      setSpotlight({ nominees: [...nominees] });
      revise('noms', { hoh, nominees: [...nominees] });
    }
    week.hacker.blockHack = blockHack.use
      ? { down: blockHack.down, up: blockHack.up, why: blockHack.why, reason: blockHack.reason }
      : null;

    week.acts.push(addBeats({
      type: 'hacker', secret: true, winner: hacker, competition: hkComp,
      results: hkComp.placements.map(n => ({ name: n, score: hkComp.scores[n] })),
      blockHack: week.hacker.blockHack, why: blockHack.why,
    }, { nominees: week.hacker.blockHack ? [week.hacker.blockHack.up] : [] }));
    recordHackerWin(hacker, week, { block: !!week.hacker.blockHack });

    // ── the empty chair looks for a hand ──
    //
    // Roadkill's blame shape, applied to a nomination that REPLACED one the
    // house watched somebody take responsibility for. The grievance, the bond
    // damage and the strategic memory all land on the name the victim picked,
    // right or wrong.
    const hkGuess = makeHackerGuesser({ week, house, hoh, rng });
    if (week.hacker.blockHack) {
      const { down, up } = week.hacker.blockHack;
      const guess = hkGuess(up);
      const beats = [];
      if (guess && guess !== up) {
        try { addBond(up, guess, -1.5); } catch { /* no bond, no grievance */ }
        rememberBBStrategy(up, guess, 'put-me-up-anonymously', 2,
          { twist: 'bb-hacker', correct: guess === hacker }, { week, act: 'nominations' });
        beats.push({
          eventId: 'hacker-blame',
          text: `${up} was not on that block when the ceremony ended and is on it now, with nobody's name attached to the change. `
            + `${up} settles on ${guess}. ${guess === hacker
              ? 'It is the right name, and it will never be provable.'
              : `It is the wrong name. ${guess} spends the week answering for something ${guess} did not do.`}`,
          players: [up, guess],
          badgeText: 'WHO DID THIS', badgeClass: 'red',
        });
      }
      // The Head of Household ran a ceremony that lasted an hour. Their reign
      // is scored on the block, and the block is no longer the one they made.
      if (hoh && hoh !== hacker && !hohSecret) {
        try { rememberStrategy(hoh, up, 'block-rewritten', week.num, 1, { act: 'hacker' }); } catch { /* texture */ }
        beats.push({
          eventId: 'hacker-overwritten',
          text: `${hoh} nominated ${down} in front of the whole house and defended the choice for an hour. `
            + `The wall now reads ${up}, and ${hoh} has no more idea why than anybody else does.`,
          players: [hoh, up].filter(Boolean),
          badgeText: 'A REIGN OVERWRITTEN', badgeClass: 'red',
        });
      }
      if (down && down !== up) {
        beats.push({
          eventId: 'hacker-stay-of-execution',
          text: `${down} comes off the block and gets told, in the same breath, that it changes nothing about the veto ceremony — `
            + `a houseguest taken down by the hacker can be put straight back up as the replacement. It is a stay, not a pardon.`,
          players: [down],
          badgeText: 'A STAY, NOT A PARDON', badgeClass: 'blue',
        });
      }
      if (beats.length) {
        week.acts.push(addBeats({ type: 'house', phase: 'post-noms', hackerBlame: true,
          socialBeats: beats }, {}));
      }
    }
  }

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
      const pairing = [
        { owner: hoh, members: [...nominees] },
        { owner: coHoh, members: [...coNominees] },
      ];
      const runBotb = (type, extra = {}) => runBBCompetition({
        type, participants: four, excluded: house.filter(n => !four.includes(n)),
        house, week, rng, library: competitionLibrary,
        forcedId: options.forcedCompetitions?.botb, seed: options.seed,
        haveNots: week.haveNots || [], ...extra,
      });

      // The pair slot first. These games are written for two nominees who are
      // one unit — the pair has a single progress track, the slower half weighs
      // more than the faster one, and a nominee can throw it to keep an ally
      // in power. None of that can be recovered from four solo scores.
      let botbComp = null;
      try {
        botbComp = runBotb('pair', { pairs: pairing });
      } catch {
        // Nothing eligible — every pair game on cooldown, or a forced id that
        // only the arena serves. The week still happens.
        botbComp = null;
      }

      if (!botbComp) {
        botbComp = runBotb('arena');
        // The arena library is written for the Block Buster, where ONE nominee
        // comes off the block alone, so its closing beats announce each
        // player's fate individually — "Axel stays nominated" on a night Axel
        // was saved by a partner. The pair result supersedes them, so they come
        // off here rather than contradicting the screen and the transcript.
        const TERMINAL = new Set(['STAYS NOMINATED', 'OFF THE BLOCK']);
        botbComp.beats = (botbComp.beats || []).filter(b => !TERMINAL.has(b?.badgeText));
      }

      // A pair game reports the pairs; the arena fallback can only be averaged.
      const avg = pair => pair.reduce((sum, n) => sum + (botbComp.scores[n] || 0), 0) / Math.max(1, pair.length);
      const hohPairScore = botbComp.pairScores?.[hoh] ?? avg(nominees);
      const coPairScore = botbComp.pairScores?.[coHoh] ?? avg(coNominees);
      const hohPairWins = botbComp.pairWinner ? botbComp.pairWinner === hoh : hohPairScore >= coPairScore;

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
      // Winning the Battle is not "off the block until somebody thinks of you
      // again" — it is safety for the week. Nothing recorded that, so the veto
      // ceremony's replacement chooser could take a saved nominee straight back
      // up, and only the draw was stopping it.
      week.botbSafe = [...savedPair];
      plan = hohPairWins ? coPlan : plan;
      week.plan = plan;
      // Exactly one reign goes in the record, and which adjustment is needed
      // depends on WHICH of the two survived — because only the first Head of
      // Household was credited at the crowning, and the co-HOH never was.
      //
      // Crediting the survivor unconditionally and debiting the dethroned
      // unconditionally is right only when the co-HOH survives. When the FIRST
      // HOH survives it double-counts them and pushes the dethroned co-HOH to
      // minus one win. Nothing caught it because it needs the first HOH's pair
      // to win the battle, and no seeded fixture had produced that branch.
      if (hohPairWins) {
        // The first Head of Household's own pair won, so they are the one
        // dethroned: credit the co-HOH, who was never credited, and take the
        // crowning back off the first.
        gs.bb.stats[reigning].hohWins++;
        gs.bb.stats[dethroned].hohWins--;
      }
      // Otherwise the first Head of Household survives — already credited at
      // the crowning — and the dethroned co-HOH never had a win to remove.
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
  /**
   * Who a houseguest decides turned the THIRD key.
   *
   * Same shape as the invisible-HOH guess and the same point: it is
   * intuition-proportional and allowed to be wrong, and a wrong guess costs
   * the innocent name exactly what a right one would cost the guilty. The
   * Head of Household is the obvious suspect and is the one person it cannot
   * have been, which is what makes this twist worth playing.
   */
  const _roadkillGuess = who => {
    if (!week.roadkill) return null;
    week.roadkillGuesses ||= [];
    const prior = week.roadkillGuesses.find(g => g.who === who);
    if (prior) return prior.guess;
    const truth = week.roadkill.winner;
    const st = pStats(who);
    const candidates = house.filter(n => n !== who && n !== hoh);
    const correct = rng() < Math.min(0.7, 0.18 + st.intuition * 0.05);
    let guess = truth;
    if (!correct) {
      // Wrong guesses land on whoever they already trust least.
      guess = candidates.filter(n => n !== truth)
        .sort((a, b) => getPerceivedBond(who, a) - getPerceivedBond(who, b))[0] || truth;
    }
    week.roadkillGuesses.push({ who, guess, correct: guess === truth });
    return guess;
  };

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

  // ── the third nominee looks for a hand to blame ──
  //
  // Somebody put them up and did not sign it. They pick a name, they are
  // frequently wrong, and either way they spend the week playing against
  // whoever they picked.
  if (week.roadkill) {
    const victim = week.roadkill.nominee;
    const guess = _roadkillGuess(victim);
    if (guess && guess !== victim) {
      try { addBond(victim, guess, -1.6); } catch { /* no bond, no grievance */ }
      // The grievance is recorded against whoever they NAMED, right or wrong.
      // That is the whole point: a misattributed block is a real enemy made.
      rememberBBStrategy(victim, guess, 'put-me-up-anonymously', 2,
        { twist: 'bb-roadkill', correct: guess === week.roadkill.winner }, { week, act: 'nominations' });
      week.acts.push(addBeats({
        type: 'house', phase: 'post-noms', roadkillBlame: true,
        socialBeats: [{
          eventId: 'roadkill-blame',
          text: `${victim} has been put on the block by somebody who did not have to say so, and settles on ${guess}. `
            + `${guess === week.roadkill.winner ? 'It is the right name, and nobody can prove it either.' : `It is the wrong name. ${guess} spends the week defending something ${guess} did not do.`}`,
          players: [victim, guess],
          badgeText: 'WHO DID THIS', badgeClass: 'red',
        }],
      }, {}));
    }
  }

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
    // ── the hacker's second authority: a seat nobody drew a chip for ──
    //
    // The loudest of the three, and the only one with witnesses: the house
    // watches a name walk into the competition with no chip to account for it.
    // The pick CONSUMES a drawn seat rather than adding one, so the field is
    // the size it always was — the hacker is choosing who plays, not how many.
    if (week.hacker && !compressed) {
      const vetoHack = chooseHackerVetoHack({
        hacker: week.hacker.winner, house, playing: [...vetoPlayers],
        nominees: [...nominees], hoh, rng,
      });
      if (vetoHack.pick && house.includes(vetoHack.pick) && !vetoPlayers.includes(vetoHack.pick)) {
        // Whoever was drawn last and is neither the HOH nor a nominee loses the
        // seat: those three play by right, and the hacker cannot take that away.
        const byRight = [hoh, ...nominees].filter(Boolean);
        const droppable = [...vetoPlayers].reverse().find(n => !byRight.includes(n));
        if (droppable) {
          vetoPlayers = vetoPlayers.map(n => (n === droppable ? vetoHack.pick : n));
          week.hacker.vetoHack = { pick: vetoHack.pick, replaced: droppable,
            self: vetoHack.self, why: vetoHack.why, reason: vetoHack.reason };
          vetoDraw.hacked = { pick: vetoHack.pick, replaced: droppable };
        }
      }
    }
    // ── THE FIELD ITSELF ──
    //
    // After the hacker's pick and before anything is played: the only hook in
    // the week that edits WHO IS STANDING THERE. Deliberately after the draw
    // rather than instead of it — the twist is a thing done to a field that
    // already exists, and the scene is people losing seats they were already
    // holding.
    //
    // NOT pushed as its own act. It happens between the draw and the
    // competition, and both of those live inside the single `veto` act — so an
    // act of its own lands BEFORE the draw in week.acts and every transcript
    // and screen showed the redraw happening before the thing it redraws.
    // It rides on the veto act instead and is rendered between the two.
    let drawTwist = null;
    if (!compressed) {
      try {
        const redrawn = applyVetoDrawTwist({
          week, players: [...vetoPlayers], house, hoh, nominees: [...nominees], rng,
        });
        if (redrawn) {
          vetoPlayers = redrawn.players;
          drawTwist = redrawn.act;
          week.vetoDrawTwist = {
            kind: drawTwist.kind, changed: drawTwist.changed, holder: drawTwist.holder,
            lost: [...drawTwist.lost], gained: [...drawTwist.gained],
          };
        }
      } catch { /* the field stands as it was drawn */ }
    }
    // Set when Prizes and Punishments turns the competition into an
    // order-setter rather than a veto-awarder.
    let vetoOrderOnly = null;
    let pendingExchangeAct = null;
    vetoPlayers = hook(hooks, 'vetoParticipants', vetoPlayers, { week, house, hoh, nominees: [...nominees] }) || vetoPlayers;
    vetoPlayers = [...new Set(vetoPlayers)].filter(name => house.includes(name));
    const vetoCompetition = runBBCompetition({ type:'veto', participants:vetoPlayers, excluded:house.filter(name => !vetoPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.veto, nominees, hoh, seed:options.seed, haveNots: week.haveNots || [] });
    const vetoResults = vetoCompetition.placements.map(name => ({ name, score:vetoCompetition.scores[name], threw:!!vetoCompetition.debug.scoreBreakdown[name]?.threw }));
    let vetoWinner = hook(hooks, 'vetoOutcome', vetoCompetition.winner, { week, results:vetoResults, competition:vetoCompetition, nominees: [...nominees] });
    if (!vetoPlayers.includes(vetoWinner)) vetoWinner = vetoCompetition.winner;
    // ── PRIZES AND PUNISHMENTS ──
    //
    // The competition just decided the PICK ORDER, not the holder. Worst
    // finisher picks first out of unopened boxes; the winner picks last with
    // everything visible and stealable, which is what winning buys in this
    // format. The veto is one of the boxes and can change hands several times
    // before it settles.
    //
    // It runs here, between the competition and the credit, so the houseguest
    // who ends up HOLDING the veto is the one the rest of the week — the
    // ceremony, the replacement, the record — treats as the winner.
    if (!compressed && twists.has('bb-prizes-and-punishments')) {
      try {
        const exchange = runPrizeExchange({
          week, order: [...vetoCompetition.placements].reverse(),
          nominees: [...nominees], hoh, rng,
          archetypeOf: n => players.find(p => p.name === n)?.archetype || '',
        });
        if (exchange?.vetoHolder) {
          week.prizeExchange = exchange;
          // The competition still happened and still had a winner — it simply
          // did not award the veto. Keeping both facts apart is the difference
          // between a coherent episode and one that shows a scoreboard and
          // then contradicts it a line later.
          exchange.compWinner = vetoWinner;
          vetoOrderOnly = { compWinner: vetoWinner, order: [...exchange.order] };
          vetoWinner = exchange.vetoHolder;
          // Held back rather than pushed here. The competition act has not been
          // pushed yet, and acts render in order — pushing the exchange now put
          // the boxes on screen BEFORE the competition that decided who opens
          // one first.
          pendingExchangeAct = exchange;
          // A punishment out of the boxes can put somebody on slop, and the
          // have-not act ran long before this.
          const late = punishedHaveNots(week.num).filter(n => house.includes(n));
          if (late.length) {
            week.haveNots = [...new Set([...(week.haveNots || []), ...late])];
            gs.bb.haveNots = [...week.haveNots];
          }
        }
      } catch { week.prizeExchange = null; }
    }

    gs.bb.stats[vetoWinner].vetoWins++;
    week.vetoWinner = vetoWinner;
    setSpotlight({ vetoWinner, vetoPlayers: [...vetoPlayers] });
    week.vetoCompetition = vetoCompetition;
    recordCompDominance(vetoCompetition, house, week.num);
    week.acts.push(addBeats({ type: 'veto', participants: vetoPlayers,
      // On a Prizes and Punishments week the competition's winner is NOT the
      // veto holder, and the act says so rather than quietly relabelling one
      // as the other. `vetoHolder` is who walks away with it.
      winner: vetoOrderOnly ? vetoOrderOnly.compWinner : vetoWinner,
      orderOnly: !!vetoOrderOnly, pickOrder: vetoOrderOnly?.order || null,
      vetoHolder: vetoWinner,
      results:vetoResults, competition:vetoCompetition, draw: vetoDraw.draws,
      // Between the draw and the competition, chronologically and on screen.
      drawTwist,
      // A seat that no chip accounts for, if the hacker spent their second
      // authority — the one hack the whole house watches happen.
      hacked: vetoDraw.hacked || null,
      automatic: vetoDraw.automatic }, { nominees: [...nominees], vetoWinner }));

    // ...and the boxes come out after the competition that set the order.
    if (pendingExchangeAct) {
      week.acts.push(addBeats(pendingExchangeAct, { nominees: [...nominees], vetoWinner }));
    }

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
    // What shape the medallion is this week, resolved in one place from the
    // twist contract and from any power somebody is holding. `diamond` is
    // derived from it rather than computed separately, so a Diamond week runs
    // through the new profile down exactly the path it always ran down — which
    // is the only way to know the generalisation did not change anything.
    week.vetoRules = resolveVetoRules({
      week, vetoWinner, placements: [...(vetoCompetition?.placements || [])],
      vetoPlayers: [...vetoPlayers], house, hoh, rng,
    });
    const diamond = isDiamond(week.vetoRules);
    let vetoDecision = shouldUseVeto(vetoWinner, nominees, plan, rng, { hoh, house, diamond, hohSecret });
    // A veto that MUST be used stops being a decision about whether and starts
    // being a decision about who — and the holder cannot decline it just
    // because the honest answer this week was nobody.
    if (week.vetoRules.primary.mustUse && !vetoDecision.use) {
      const forced = [...nominees].sort((a, b) =>
        getPerceivedBond(vetoWinner, b) - getPerceivedBond(vetoWinner, a))[0];
      if (forced) {
        vetoDecision = { use: true, save: forced, reason: 'forced',
          why: `${vetoWinner} has no say in whether the medallion comes out of the box — only in whose name is on it. `
            + `${forced} comes down because somebody had to.` };
      }
    }
    vetoDecision = hook(hooks, 'vetoDecision', vetoDecision, { week, house, hoh, nominees: [...nominees], vetoWinner }) || vetoDecision;
    // Saving the Roadkill nominee hands the pen to whoever put them there, not
    // to the Head of Household — the third chair was never the HOH's to fill,
    // and it is not theirs to refill either.
    // BB15's rule: save the audience's nominee and the chair simply empties.
    // Nobody in the house filled it, so nobody in the house owns the pen for
    // it — which is the one thing that makes this different from Roadkill.
    const americasChair = !!week.americasNominee
      && vetoDecision?.use && vetoDecision?.save === week.americasNominee.nominee;
    const roadkillChair = !!week.roadkill && vetoDecision?.save === week.roadkill.nominee;
    const chairAuthority = diamond ? vetoWinner : (roadkillChair ? week.roadkill.winner : hoh);
    if (roadkillChair) week.roadkillRefilled = true;
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
    if (americasChair && nominees.includes(vetoDecision.save)) {
      // No replacement, and no ceremony beyond the saving.
      nominees = nominees.filter(n => n !== vetoDecision.save);
      gs.bb.stats[vetoDecision.save].timesSaved++;
      week.americasChairEmptied = true;
    } else if (vetoDecision.use && nominees.includes(vetoDecision.save)) {
      // Super Safety and the Co-HOH key cover the WEEK, so they cover this
      // chair too. The Cloud deliberately does not: it buys one ceremony, and
      // this is the ceremony it does not buy.
      const protectedNames = [hoh, vetoWinner, vetoDecision.save, ...(week.botbSafe || []), carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite), ...nominees.filter(name => name !== vetoDecision.save)].filter(Boolean);
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
    // ── THE COUP D'ETAT ──
    //
    // The holder stands up when the ceremony is over and takes the week off
    // the Head of Household: up to two nominees come down and the holder names
    // who goes up instead. The two names it may not name are the Head of
    // Household and the veto holder — the only two people in the room whose
    // safety was earned rather than granted.
    //
    // It fires after the veto ceremony has settled the block because it
    // OVERRULES that ceremony rather than taking part in it: the house has
    // just watched the week resolve, and then it does not resolve.
    //
    // ORDER MATTERS ON THE SCREEN, and it was wrong: the coup resolves here,
    // after the ceremony, but its card was pushed BEFORE the ceremony's — so a
    // viewer watched somebody overrule a block they had not been shown yet,
    // and then watched the veto meeting produce the block that had already
    // been overruled. The act is built now and pushed after the ceremony.
    const blockAfterCeremony = [...nominees];
    let coupAct = null;
    const coup = (gs.bb?.powers || []).find(pw => pw.powerId === 'coup-d-etat'
      && !pw.used && !pw.disposed && week.num <= pw.expiresAfterWeek
      && house.includes(pw.holder));
    if (coup) {
      const protectedNow = [hoh, vetoWinner, coup.holder, carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite)].filter(Boolean);
      const eligible = house.filter(n => !protectedNow.includes(n));
      if (eligible.length >= 2) {
        usePower(coup, week.num);
        const coupPlan = chooseNominationPlan(coup.holder, eligible, rng);
        const named = [...new Set(coupPlan.nominees)]
          .filter(n => eligible.includes(n)).slice(0, 2);
        while (named.length < 2) {
          const extra = chooseReplacement(coup.holder, house, [...protectedNow, ...named], coupPlan, rng);
          if (!extra || named.includes(extra) || protectedNow.includes(extra)) break;
          named.push(extra);
        }
        if (named.length === 2) {
          const taken = nominees.filter(n => !named.includes(n));
          nominees = [...named];
          week.finalNominees = [...nominees];
          week.coup = { holder: coup.holder, removed: taken, named: [...named],
            visibility: coup.visibility };
          nominees.forEach(name => gs.bb.stats[name].timesNominated++);
          setSpotlight({ nominees: [...nominees] });
          coupAct = addBeats({
            type: 'power-played', powerId: 'coup-d-etat', holder: coup.holder,
            name: BB_POWER_DEFINITIONS['coup-d-etat'].name, timing: 'veto-ceremony',
            secret: false, visibility: coup.visibility,
            removed: [...taken], nominees: [...named],
            detail: `${coup.holder} takes ${taken.join(' and ')} off the block and puts up `
              + `${named.join(' and ')}. ${hoh} watches a week of work come apart from a chair `
              + 'nobody can put them in.',
          }, { nominees: [...named], players: [coup.holder] });
          // Overruling somebody in public is not free, and the two people just
          // put up did not have a week that ended this way an hour ago.
          try { addBond(hoh, coup.holder, -2.4); } catch { /* no bond, no fallout */ }
          // Bonds moved and nothing REMEMBERED, which meant the loudest public
          // act in the game left no strategic trace: the dethroned Head of
          // Household carried no grievance into next week's targeting, and two
          // houseguests seated by somebody else's hand filed it as nothing.
          // Same records the Diamond's detonation writes, for the same event.
          try {
            rememberStrategy(hoh, coup.holder, 'coup-hijack', week.num, 3,
              { act: 'coup-d-etat', named: [...named] });
          } catch { /* texture */ }
          for (const name of named) {
            try { addBond(name, coup.holder, -1.8); } catch { /* no bond */ }
            try {
              rememberStrategy(name, coup.holder, 'renomination', week.num, 3,
                { act: 'coup-d-etat' });
            } catch { /* texture */ }
          }
          for (const name of taken) {
            try { addBond(name, coup.holder, 2.2); } catch { /* no bond */ }
            // Being lifted off a block by somebody else's power is the largest
            // debt this game can create, and it was not being recorded either.
            try { recordProtection(coup.holder, name, { strength: 2.2, ep: week.num }); } catch { /* texture */ }
          }
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[coup.holder] = (gs.popularity[coup.holder] || 0) + 4;
        }
      }
    }

    week.acts.push(addBeats({ type: 'veto-ceremony', used: !!vetoDecision.use,
      saved: vetoDecision.save, replacement, holder: vetoWinner,
      diamond, chairAuthority, anonymous: hohSecret && !diamond,
      reason: vetoDecision.reason, why: vetoDecision.why, replacementWhy,
      // The block as the CEREMONY left it. `nominees` may already have been
      // rewritten by a Coup d'Etat below, and reporting that here had the
      // ceremony announcing a final block that contradicted its own
      // replacement in the same breath.
      nominees: [...blockAfterCeremony] },
      // Handed over explicitly rather than left to be inferred. actFacts works
      // `saved` out by diffing week.initialNominees against week.finalNominees,
      // and finalNominees is not written until after this act exists — so every
      // event on this act that needs to know who came down was reading null,
      // and veto-saved-gratitude could never fire.
      { nominees: [...blockAfterCeremony], vetoWinner,
        saved: vetoDecision.save || null, replacement, used: !!vetoDecision.use }));
    revise('veto', { hoh, nominees: [...blockAfterCeremony], vetoWinner,
      saved: vetoDecision.save || null });

    // ...and NOW the coup, standing up on a block the house has just watched
    // settle. Everything downstream — campaigning, the vote, the plans — reads
    // `nominees`, which the coup already rewrote.
    if (coupAct) {
      week.acts.push(coupAct);
      revise('veto', { hoh, nominees: [...nominees], vetoWinner, saved: null });
    }

    // ── THE SECOND MEDALLION ──
    //
    // A Double veto is not a stronger veto, it is another one, and a Secret is
    // another one nobody can see being used. Either way the block gets
    // rewritten a second time in the same meeting.
    //
    // Deliberately its own pass rather than a generalisation of the block
    // above. That block carries a decade of rules — the americas chair, the
    // roadkill pen, the no-eligible-replacement case, the protection debt —
    // and folding a second holder through it would have put all of that at
    // risk to save a few lines. The one rule that MUST cross over is that a
    // nominee taken down by the first medallion cannot be put back up by the
    // second, which is what `savedThisWeek` carries.
    const savedThisWeek = [vetoDecision.use ? vetoDecision.save : null].filter(Boolean);
    for (const extra of (week.vetoRules?.extra || [])) {
      if (!house.includes(extra.holder)) continue;
      // Nothing left to save, or nobody left to put up in the empty chair.
      const eligible = house.filter(n => n !== hoh && n !== vetoWinner && n !== extra.holder
        && !nominees.includes(n) && !savedThisWeek.includes(n));
      if (!nominees.length || !eligible.length) continue;
      let dec = shouldUseVeto(extra.holder, nominees, plan, rng,
        { hoh, house, diamond: extra.authority === 'veto-holder', hohSecret,
          second: true, anonymous: extra.visibility === 'anonymous' });
      if (!dec?.use || !nominees.includes(dec.save)) {
        // A FOUND power that goes unspent is not a scene. The house never knew
        // it was in the building, so there is nothing to narrate and nothing
        // for anybody to react to — and the instance stays live for the next
        // ceremony, which is the whole reason it is measured in weeks. The
        // announced Double is the opposite: everybody watched that medallion
        // be won, so a meeting where it does not come out is the story.
        if (extra.hidden) continue;
        const pq = pronouns(extra.holder);
        week.acts.push(addBeats({
          type: 'second-veto', kind: extra.kind, holder: extra.holder, used: false,
          anonymous: extra.visibility === 'anonymous', saved: null, replacement: null,
          nominees: [...nominees],
          beats: [
            { text: `The veto meeting is over. Everybody in the room knows there is a second medallion in it, `
              + `and everybody in the room is still sitting down.`,
            players: [...nominees], badgeText: 'NOBODY GETS UP', badgeClass: 'grey' },
            { text: `${extra.holder} keeps it. ${pq.Sub} ${pq.sub === 'they' ? 'have' : 'has'} just told this `
              + `house, without saying a word, that the block is exactly where ${pq.sub} wanted it — which is `
              + `a thing ${(nominees[0] || 'the nominees')} will be doing arithmetic about all week.`,
            players: [...new Set([extra.holder, ...nominees].filter(Boolean))], badgeText: 'LEFT IN THE BOX', badgeClass: 'grey' },
          ],
        }, { players: [extra.holder], nominees: [...nominees] }));
        // On the WEEK, not only in the act. Everything downstream that wants to
        // react to a second medallion — the event library, the campaign, next
        // week's arithmetic — reads `week`, and an outcome that lives only
        // inside an act it was written on is an outcome nothing can answer.
        week.secondVeto = { kind: extra.kind, holder: extra.holder, used: false,
          anonymous: extra.visibility === 'anonymous', saved: null, replacement: null };
        continue;
      }
      const authority = extra.authority === 'veto-holder' ? extra.holder : hoh;
      const protectedNames = [hoh, vetoWinner, extra.holder, dec.save, ...savedThisWeek,
        ...(week.botbSafe || []), carePackageProtects(week.carePackage),
        ...safetySuiteSafe(week.safetySuite),
        ...nominees.filter(n => n !== dec.save)].filter(Boolean);
      const secondRep = chooseReplacement(authority, house, protectedNames, plan, rng);
      if (!secondRep || !house.includes(secondRep) || protectedNames.includes(secondRep)) continue;
      nominees = nominees.map(n => (n === dec.save ? secondRep : n));
      savedThisWeek.push(dec.save);
      gs.bb.stats[dec.save].timesSaved++;
      gs.bb.stats[secondRep].timesNominated++;
      week.finalNominees = [...nominees];
      if (dec.save !== extra.holder) {
        try { recordProtection(extra.holder, dec.save, { strength: 1.6, ep: week.num }); } catch { /* texture */ }
      }
      week.secondVeto = { kind: extra.kind, holder: extra.holder, used: true,
        anonymous: extra.visibility === 'anonymous', saved: dec.save, replacement: secondRep,
        authority, hidden: !!extra.hidden };
      // Spent. Without this the found power sits live in the store and comes
      // out again at every ceremony inside its window.
      if (extra.instance) { try { usePower(extra.instance, week.num); } catch { /* ledger */ } }
      const ph = pronouns(extra.holder);
      const pr = pronouns(secondRep);
      week.acts.push(addBeats({
        type: 'second-veto', kind: extra.kind, holder: extra.holder, used: true,
        anonymous: extra.visibility === 'anonymous', hidden: !!extra.hidden,
        saved: dec.save, replacement: secondRep,
        authority, nominees: [...nominees],
        // The scene the screen is built on: a ceremony that had already ended,
        // ending again. Written here rather than in the builder because the
        // engine is the only thing that knows who was in the room.
        beats: [
          { text: `The veto meeting is over. The block is settled, the chairs have been pushed back, and `
            + `${extra.holder} does not get up with everybody else.`,
          players: [extra.holder], badgeText: 'IT IS NOT OVER', badgeClass: 'blue' },
          { text: extra.visibility === 'anonymous'
            ? `A second medallion comes out and the room does not get to see whose hand it came out of. `
              + `${dec.save} comes down. Nobody is told anything else.`
            : extra.hidden
              ? `${extra.holder} takes out a veto this house did not know existed. It was not won, it was `
                + `found — in the building the whole time, in a room every one of them walks through — and `
                + `${dec.save} comes down off the block because ${ph.sub} went looking and nobody else did.`
              : `${extra.holder} has been holding the second medallion since the competition, through every `
                + `conversation this house had about the block, and uses it now on ${dec.save}.`,
          players: [...new Set([extra.holder, dec.save])], badgeText: 'THE SECOND MEDALLION', badgeClass: 'gold' },
          { text: `${secondRep} was on the sofa when this meeting started. ${pr.Sub} `
            + `${pr.sub === 'they' ? 'are' : 'is'} on the block now, put there by a ceremony that had `
            + `already finished once, and ${hoh} — who built this block — did not choose either name on it.`,
          players: [...new Set([secondRep, hoh].filter(Boolean))], badgeText: 'THE CHAIR FILLS AGAIN', badgeClass: 'red' },
          { text: `${ph.Sub} ${ph.sub === 'they' ? 'have' : 'has'} spent one week's goodwill and bought one `
            + `person a week. ${dec.save} knows exactly what that cost, and so does everybody who was `
            + `counting on the block staying where it was.`,
          players: [...new Set([extra.holder, dec.save])], badgeText: 'WHAT IT COST', badgeClass: 'blue' },
        ],
      }, { players: [extra.holder, dec.save, secondRep].filter(Boolean), nominees: [...nominees] }));
      revise('veto', { hoh, nominees: [...nominees], vetoWinner, saved: dec.save });
    }

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
    // ── what quietly left the game ──
  //
  // A power carried for a month and never spent used to vanish in silence:
  // disposed in the store, mentioned nowhere, and the only trace was a line in
  // the debug panel nobody opens mid-season. The HOUSE is told nothing — most
  // of these it never knew existed — but the viewer is owed it, so this is a
  // note to the audience and nothing else. No bonds move, no reads change.
  const _binned = expirePowers(week.num, gs.activePlayers) || [];
  if (!compressed && _binned.length) {
    week.powersExpired = _binned.map(p => ({
      powerId: p.powerId, holder: p.holder, reason: p.disposedReason,
      name: BB_POWER_DEFINITIONS[p.powerId]?.name || p.powerId,
      heldSince: p.acquiredWeek,
    }));
    week.acts.push({
      type: 'power-expired', week: week.num, viewerOnly: true,
      expired: week.powersExpired.map(x => ({ ...x })),
      beats: week.powersExpired.map(x => ({
        type: 'power-expired',
        text: x.reason === 'holder-evicted'
          ? `${x.holder} walks out of the front door still holding ${x.name}, and it goes out with them. Nobody in that house ever knew it was in the building.`
          : `${x.holder} has been carrying ${x.name} since week ${x.heldSince} and never played it. The window closes tonight. It is simply gone, and the house will never learn there was anything to use.`,
        players: [x.holder],
        badgeText: x.reason === 'holder-evicted' ? 'LEFT WITH THEM' : 'NEVER PLAYED',
        badgeClass: 'grey',
      })),
    });
  }
    if (!gs.eliminated.includes(departure.name)) gs.eliminated.push(departure.name);
    week.allianceChanges.betrayals = _cappedBondWindow(() => settleBBAllianceWeek(week, rng));
  _attachAllianceFallout(week, house);
  week.endgameDeals = endgameDealSummary(gs.activePlayers || []);
  week.housePlans = Object.fromEntries((gs.activePlayers || [])
    .map(name => [name, describeHousePlan(name)]).filter(([, text]) => text));
  week.closingState = _snapshotHouse();
  week.allianceBoard = _snapshotAllianceBoard();
    week.perceptionChanges = updateBBPerceptions({ house: gs.activePlayers, week, rng });
    _attachRomance(week, rng);
    // How they wore it, judged on what the week actually achieved rather than on
  // what they meant. The house holds this against them next week.
  try { week.reign = week.hohSecret ? null : recordReign(week); } catch { week.reign = null; }
  gs.bb.outgoingHoh = week.hohSecret ? null : hoh;
    gs.bb.weeks.push(week);
    // One episode, however many cycles it took. A double eviction runs the week
  // engine twice and a Split House runs it once per side, so an unconditional
  // bump made the counter jump 4 -> 6 and every episode after it was misnumbered
  // for the rest of the season. The second segment is the same night.
  if (Number(options.segment || 1) <= 1) gs.episode = (gs.episode || 0) + 1;
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
  week.voteOperation = runVoteOperation({ ballots, nominees, hoh, commitments, rng, week: week.num });
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
    // ── The nominee who does not campaign ──
    //
    // Not everybody works the room, and the ones who do not are half the real
    // stories: the pawn who was told they were safe and believed it, the goat
    // who does not think it is their place to ask, the player who read the
    // count wrong. Dropping their beats silently would delete them from the
    // week; this says what they did instead, and — where it applies — that
    // they are wrong. Only in the first campaign act, because it is one
    // decision about the week rather than a new one every day.
    const quietBeats = [];
    if (campaignIndex === 0) {
      for (const pitch of campaign.pitches || []) {
        const d = pitch.drive;
        if (!d || d.campaigns) continue;
        const p = pronouns(pitch.pitcher);
        const text = d.misread
          ? `${pitch.pitcher} does not campaign. ${p.Sub} has counted the room and made it `
            + `${d.believedAgainst} against — and there are ${d.votesAgainst}. Nobody in the house `
            + `corrects ${p.obj}, because everybody who could has already decided.`
          : d.felt < 0.34
            ? `${pitch.pitcher} does not campaign. As far as ${p.sub} can tell there is nothing `
              + `to campaign about, and a nominee who goes around asking for votes ${p.sub} `
              + `already has looks like a nominee who knows something.`
            : `${pitch.pitcher} does not campaign. ${p.Sub} knows the number and has decided that `
              + `walking up to people and asking would not change it — which may be the read of `
              + `the week, or the last mistake of a season.`;
        quietBeats.push({
          text, players: [pitch.pitcher],
          badgeText: d.misread ? 'DOES NOT SEE IT' : 'SITS IT OUT',
          badgeClass: d.misread ? 'red' : 'grey',
          eventId: 'campaign-declined', category: 'deals', location: 'bedroom',
        });
      }
    }

    campaignAct.socialBeats = [...thirdBeats, ...pitchBeats, ...quietBeats,
      ...(campaignAct.socialBeats || [])];
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
    const inst = activePowerAt('eviction-night', week.num, 'diamond-veto');
    const holder = inst?.holder;
    if (inst && house.includes(holder)) {
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
        // ── who the detonation may NOT seat ──
        //
        // The veto winner and anybody the veto took off the block are both
        // safe for the week, and this list was missing both of them. Caught by
        // playing a season rather than by a test: a houseguest was nominated,
        // won the veto, used it on himself, and was then seated straight back
        // onto the block by a secret Diamond and evicted. Two rules broken in
        // one ceremony.
        //
        // The ordinary replacement path already protects them; this path built
        // its own list and `save` here means the DIAMOND's save, which is a
        // different person from the veto's.
        // ...and `other` is not "the rest of the block", it is ONE name. This
        // list was written for a two-chair block and a third chair is no longer
        // exotic: the Den's curse seats one, so does Roadkill, so does
        // America's Nominee. With three up, the third was not protected here
        // and chooseReplacement could name somebody who was ALREADY on the
        // block — which produced a final block of three with the same
        // houseguest in two of the chairs, and an eviction card that drew their
        // face twice. Protect the whole block, since the whole block is what
        // cannot be renominated onto itself.
        const protectedNames = [hoh, holder, save, other, ...nominees,
          week.vetoWinner, week.vetoDecision?.use ? week.vetoDecision.save : null,
          ...(week.botbSafe || []), carePackageProtects(week.carePackage),
          ...safetySuiteSafe(week.safetySuite)].filter(Boolean);
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

  // ── the care package's eviction-night halves ──
  //
  // Both fire here, with the Hacker's cancel, for the same reason: the ballots
  // below are the ones that would really have been cast, so a vote removed or
  // bought now is a real move rather than a guess at one.
  //
  // The contrast with the Hacker is the whole point of running them in the
  // same season. The Hacker takes a ballot anonymously and leaves the voter
  // hunting. This takes two by name, out loud, and leaves them with nothing to
  // work out and nowhere to put it.
  if (!compressed && week.carePackage
    && (week.carePackage.effect === 'vote-block' || week.carePackage.effect === 'bribe')) {
    try {
      // The opening act has already been played, so anything these produce is
      // a separate scene on eviction night rather than a retroactive edit to a
      // screen the viewer watched three acts ago.
      const beatsBefore = week.carePackage.beats.length;
      const blocked = carePackageVoteBlock({
        act: week.carePackage, ballots, nominees: [...nominees], house, rng,
      });
      for (const name of blocked) {
        const idx = ballots.findIndex(b => b.voter === name);
        if (idx >= 0) ballots.splice(idx, 1);
      }
      if (blocked.length) {
        week.carePackageBlocked = [...blocked];
        for (const name of blocked) {
          try { addBond(name, week.carePackage.recipient, -1.6); } catch { /* no bond, no grievance */ }
          rememberBBStrategy(name, week.carePackage.recipient, 'took-my-vote', 2,
            { twist: 'bb-care-package', public: true }, { week, act: 'eviction' });
        }
      }
      const bribe = carePackageBribe({
        act: week.carePackage, ballots, nominees: [...nominees], house, rng,
      });
      if (bribe) {
        week.carePackageBribe = { ...bribe };
        // Taking money to move a vote is a debt; refusing it is intelligence.
        try {
          if (bribe.taken) addBond(bribe.mark, week.carePackage.recipient, 1.2);
          else addBond(bribe.mark, week.carePackage.recipient, -0.8);
        } catch { /* no bond, no debt */ }
        rememberBBStrategy(bribe.mark, week.carePackage.recipient,
          bribe.taken ? 'bought-my-vote' : 'tried-to-buy-me', 2,
          { twist: 'bb-care-package', amount: bribe.amount }, { week, act: 'eviction' });
      }
      const fresh = week.carePackage.beats.slice(beatsBefore);
      if (fresh.length) {
        week.acts.push(addBeats({
          type: 'care-package-play', secret: false,
          packageId: week.carePackage.packageId, package: week.carePackage.package,
          recipient: week.carePackage.recipient,
          blocked: [...(blocked || [])], bribe: bribe ? { ...bribe } : null,
          beats: fresh,
        }, { players: [week.carePackage.recipient, ...(blocked || []),
          bribe?.mark].filter(Boolean) }));
      }
    } catch { /* a package that cannot fire leaves the week intact */ }
  }

  // ── the hacker's third authority: one ballot, cancelled ──
  //
  // The first consumer of `cancelVotes`, which has been sitting in
  // BASE_WEEK_RULES since the contract was written with nothing to read it.
  //
  // It fires HERE, after every plea, plan and forecast — the ballots below are
  // the ones that would really have been cast — and it fires before the count,
  // so the number the house hears read out is one short of the number of people
  // who believe they voted. The silenced houseguest is told in private and told
  // to say nothing, which is a burden rather than an alibi: admitting it means
  // admitting somebody chose you, and you cannot say who.
  if (!compressed && week.hacker && (week.twistState?.rules?.cancelVotes || 0) > 0) {
    const voteHack = chooseHackerVoteHack({
      hacker: week.hacker.winner, ballots, nominees: [...nominees], hoh, house, rng,
    });
    const idx = voteHack.voter ? ballots.findIndex(b => b.voter === voteHack.voter) : -1;
    if (idx >= 0) {
      const [killed] = ballots.splice(idx, 1);
      week.hacker.voteHack = { voter: voteHack.voter, saved: voteHack.saved,
        wouldHaveVoted: killed.evict, flips: voteHack.flips, levels: voteHack.levels,
        why: voteHack.why, reason: voteHack.reason };
      week.hackerVote = { ...week.hacker.voteHack };
      const beats = [];
      // The silenced voter has to blame somebody, and cannot see the hand.
      const hkGuess = makeHackerGuesser({ week, house, hoh, rng });
      const guess = hkGuess(voteHack.voter);
      beats.push({
        eventId: 'hacker-vote-cancelled',
        text: `${voteHack.voter} is called in before the vote and told, privately, that ${pronouns(voteHack.voter).posAdj} ballot will not be counted tonight — `
          + `and that ${pronouns(voteHack.voter).sub} may not tell the house why. `
          + `${pronouns(voteHack.voter).Sub} ${pronouns(voteHack.voter).sub === 'they' ? 'sit' : 'sits'} through the whole eviction with a vote ${pronouns(voteHack.voter).sub} already knows does not exist.`,
        players: [voteHack.voter],
        badgeText: 'CANCELLED', badgeClass: 'red',
      });
      if (guess && guess !== voteHack.voter) {
        try { addBond(voteHack.voter, guess, -1.2); } catch { /* no bond, no grievance */ }
        rememberBBStrategy(voteHack.voter, guess, 'cancelled-my-vote', 2,
          { twist: 'bb-hacker', correct: guess === week.hacker.winner }, { week, act: 'eviction' });
        beats.push({
          eventId: 'hacker-vote-blame',
          text: `${voteHack.voter} spends the walk back to the sofa working out who did it, and settles on ${guess}. `
            + `${guess === week.hacker.winner ? 'It is the right name, and saying it out loud would mean admitting the whole thing.' : `It is the wrong name, and ${guess} will never know ${pronouns(guess).sub} ${pronouns(guess).sub === 'they' ? 'were' : 'was'} tried and convicted.`}`,
          players: [voteHack.voter, guess],
          badgeText: guess === week.hacker.winner ? 'DEAD ON' : 'THE WRONG DOOR',
          badgeClass: guess === week.hacker.winner ? 'gold' : 'red',
        });
      }
      week.acts.push(addBeats({
        type: 'hacker-vote', secret: true, voter: voteHack.voter,
        saved: voteHack.saved, wouldHaveVoted: killed.evict,
        flips: voteHack.flips, levels: voteHack.levels,
        why: voteHack.why, winner: week.hacker.winner, socialBeats: beats,
      }, {}));
    } else if (voteHack.why) {
      // Declining to use it is a decision too, and the debug panel is owed the
      // reasoning even though nothing happened in front of anybody.
      week.hacker.voteHack = { voter: null, held: true, why: voteHack.why,
        reason: voteHack.reason };
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
  } else {
    // WHOEVER HAS THE MOST VOTES LEAVES — over every chair, not the first two.
    //
    // This compared nominees[0] against nominees[1] and nothing else, which is
    // correct for exactly as long as a block has two people on it. It has not
    // for a long time: America's Nominee, Roadkill, the Den's curse and the
    // Block Buster all seat a third, and on those weeks the third chair's
    // votes were never read at all.
    //
    // Reported from a real week that voted 11-2-0 and evicted the houseguest
    // with TWO — because two beat the zero next to it and the eleven was not
    // in the comparison. The tally was right the whole time; the wrong name
    // was pulled out of it.
    const ranked = [...nominees].sort((a, b) => (votes[b] || 0) - (votes[a] || 0));
    const most = votes[ranked[0]] || 0;
    const tied = ranked.filter(n => (votes[n] || 0) === most);
    if (tied.length > 1) {
      const preference = initialVotePreference(hoh, tied, rng);
      evicted = preference.evict;
      // An invisible HOH still breaks the tie — through the wall screen, with
      // the room watching nobody stand up.
      tieBreak = { voter: hoh, evict: evicted, anonymous: hohSecret };
    } else {
      evicted = ranked[0];
    }
  }
  if (!doubleVote) {
    evicted = hook(hooks, 'evictionResult', evicted, { week, house, hoh, nominees: [...nominees], ballots, votes, tieBreak }) || evicted;
    if (!nominees.includes(evicted)) {
      // Same rule as above: the most votes, over every chair.
      evicted = [...nominees].sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0];
    }
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
  // ── The Halting Hex ──
  //
  // Before anybody is removed from the roster, because the whole power is that
  // the removal does not happen. The votes stand as a matter of record; the
  // result does not, and the block empties by default.
  week.haltingHex = null;
  if (!compressed && evicted) {
    try {
      const hex = resolveHaltingHex({ week, evicted, nominees, hoh, rng });
      if (hex) {
        week.haltingHex = hex;
        week.acts.push(hex);
        week.evictionCancelled = true;
        week.evicted = null;
        evicted = null;
      }
    } catch { week.haltingHex = null; }
  }

  gs.activePlayers = house.filter(name => name !== evicted && name !== secondEvicted);
  if (evicted && !gs.eliminated.includes(evicted)) gs.eliminated.push(evicted);
  if (secondEvicted && !gs.eliminated.includes(secondEvicted)) gs.eliminated.push(secondEvicted);

  // ── CAMP COMEBACK ──
  //
  // The eviction above is real and stays real: they are out of the roster, out
  // of the vote and out of the nominations. They simply do not leave the
  // house. Nothing else in the week engine has to know, which is exactly why
  // this runs AFTER the removal rather than instead of it.
  if (!compressed && twists.has('bb-camp-comeback') && evicted) {
    try {
      const camped = sendToCamp({ week, evicted, house, rng });
      if (camped) {
        week.campComeback = camped;
        week.acts.push(addBeats(camped, { players: [evicted] }));
        // A camper is not in the jury — they have not finished losing yet.
        gs.jury = (gs.jury || []).filter(n => n !== evicted);
        if (camped.full) {
          const back = runCampComeback({ week, house: gs.activePlayers, rng });
          if (back?.winner) {
            week.campReturn = back;
            week.acts.push(addBeats(back, { players: [back.winner] }));
            gs.activePlayers = [...new Set([...gs.activePlayers, back.winner])];
            gs.eliminated = (gs.eliminated || []).filter(n => n !== back.winner);
            week.returnedHouseguest = back.winner;
          }
        }
      }
    } catch { week.campComeback = null; }
  }

  // ── The Bonus Life ──
  //
  // BEFORE expirePowers, and the ordering is the whole trick: every other
  // power is disposed the moment its holder walks, and this one is SPENT by
  // its holder walking. Sweeping first would bin the fuse on the one night it
  // exists to go off. It also runs before the battle back so that a house
  // running both does not send the same evictee through two doors.
  if (!compressed && evicted && !week.roundTrip?.returned) {
    try {
      week.bonusLife = resolveBonusLife({ week, evicted, rng });
      if (week.bonusLife) {
        week.acts.push(week.bonusLife);
        if (week.bonusLife.returned) week.returnedHouseguest = week.bonusLife.returned;
      }
    } catch (e) {
      // The eviction above is real whether the second chance resolves or not.
      week.bonusLife = null;
    }
  }

  // What was in somebody's pocket this week, snapshotted BEFORE the sweep —
  // a power that expires tonight was live for the whole week and belongs on
  // the week's screen saying so. Without this the only record of a power
  // between the night it was granted and the night it fires is the Debug
  // panel, which is not a thing anybody watches.
  week.powerLedger = powerLedgerFor(week.num);
  // Powers whose holder just left, or whose window just closed, end here.
  // ── what quietly left the game ──
  //
  // A power carried for a month and never spent used to vanish in silence:
  // disposed in the store, mentioned nowhere, and the only trace was a line in
  // the debug panel nobody opens mid-season. The HOUSE is told nothing — most
  // of these it never knew existed — but the viewer is owed it, so this is a
  // note to the audience and nothing else. No bonds move, no reads change.
  const _binned = expirePowers(week.num, gs.activePlayers) || [];
  if (!compressed && _binned.length) {
    week.powersExpired = _binned.map(p => ({
      powerId: p.powerId, holder: p.holder, reason: p.disposedReason,
      name: BB_POWER_DEFINITIONS[p.powerId]?.name || p.powerId,
      heldSince: p.acquiredWeek,
    }));
    week.acts.push({
      type: 'power-expired', week: week.num, viewerOnly: true,
      expired: week.powersExpired.map(x => ({ ...x })),
      beats: week.powersExpired.map(x => ({
        type: 'power-expired',
        text: x.reason === 'holder-evicted'
          ? `${x.holder} walks out of the front door still holding ${x.name}, and it goes out with them. Nobody in that house ever knew it was in the building.`
          : `${x.holder} has been carrying ${x.name} since week ${x.heldSince} and never played it. The window closes tonight. It is simply gone, and the house will never learn there was anything to use.`,
        players: [x.holder],
        badgeText: x.reason === 'holder-evicted' ? 'LEFT WITH THEM' : 'NEVER PLAYED',
        badgeClass: 'grey',
      })),
    });
  }
  // Somebody leaving rearranges everybody's plan: a shield walks out and the
  // person hiding behind them is suddenly the biggest thing in the room, and a
  // promise made to somebody who is now in the jury is not a promise any more.
  // ...unless the Bonus Life just put them back in it. Dropping the plans of
  // somebody standing in the room erases every read the house has on them.
  const _stillGone = name => name && !(gs.activePlayers || []).includes(name);
  if (_stillGone(evicted)) { try { dropFromHousePlans(evicted); } catch { /* plans survive a bad eviction */ } }
  if (_stillGone(secondEvicted)) { try { dropFromHousePlans(secondEvicted); } catch { /* both walks count */ } }

  // ── The door opens backwards ──
  //
  // Run AFTER the eviction is on the books, because both aired versions put
  // that night's evictee in the field — the person who just lost the vote gets
  // to fight it immediately. A returnee is added back to the house here, so
  // everything downstream (plans, deals, perceptions, the closing snapshot)
  // already sees them standing in the room.
  // One door a night: a house running the Bonus Life and the Battle Back in
  // the same week must not send tonight's evictee through both of them.
  if (!compressed && !week.bonusLife?.returned && !week.roundTrip?.returned
      && (week.twistState?.rules?.addSlots || []).includes('return')) {
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
  week.allianceBoard = _snapshotAllianceBoard();
  week.perceptionChanges = updateBBPerceptions({ house:gs.activePlayers, week, rng });
  _attachRomance(week, rng);
  // How they wore it, judged on what the week actually achieved rather than on
  // what they meant. The house holds this against them next week.
  try { week.reign = week.hohSecret ? null : recordReign(week); } catch { week.reign = null; }
  // An invisible winner was never publicly HOH, so nothing locks them out
  // of next week's competition — the twist's stated perk.
  gs.bb.outgoingHoh = week.hohSecret ? null : hoh;
  gs.bb.weeks.push(week);
  // One episode, however many cycles it took. A double eviction runs the week
  // engine twice and a Split House runs it once per side, so an unconditional
  // bump made the counter jump 4 -> 6 and every episode after it was misnumbered
  // for the rest of the season. The second segment is the same night.
  if (Number(options.segment || 1) <= 1) gs.episode = (gs.episode || 0) + 1;
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

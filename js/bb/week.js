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
import { resolveRewind } from './rewind.js';
import { runCoinOfDestiny, coinNominations, COIN_PRICE } from './coin-of-destiny.js';
import { runSafetySuite, safetySuiteSafe } from './safety-suite.js';
import { openRoom, roomGameForNight, ROOM_GAMES } from './high-rollers-room.js';
import { runCarePackage, runTimeCapsule, carePackageProtects, coHohNominee,
  carePackageVoteBlock, carePackageBribe, neverNots } from './care-package.js';
import { punishedHaveNots, applyPunishment, drawPunishment, BB_PUNISHMENTS } from './punishments.js';
import { resolveVetoRules, isDiamond } from './veto-rules.js';
import { applyVetoDrawTwist } from './veto-draw.js';
import { runPrizeExchange } from './prize-exchange.js';
import { sendToCamp, runCampComeback, campers, CAMP_SIZE } from './camp-comeback.js';
import { duosActive, duosSittingOut, duoNominees, grantGoldenKey, expireKeys,
  announceDuos, keyHolders, repairOrphans, duosWeekLife, duoBlock,
  duoSafeWith, duoReplacementBlock, duoKinLabel, duoDoubleBlock, duoVoteResult,
  twoDuoBlock } from './duos.js';
import { openDuoWeek, duoWeekActive, duoWeekNominees, duoWeekAfterVeto,
  duoWeekSecondEvictee, duoWeekEviction, duoWeekEvents, duoWeekSafe,
  DUO_WEEK_MIN_HOUSE } from './duo-week.js';
import { fillTeam, runMission } from './team-america.js';
import { runDenOfTemptation, resolveCurse } from './temptation.js';
import { runWhacktivity } from './whacktivity.js';
import { runSecretPowerComp, SECRET_POWER_DOORS } from './secret-power.js';
import { playInterrogation, playMysteryCompetitor, playMysteryVeto,
  mysteryCompetitorResult } from './secret-power-plays.js';
import { activeSeasons } from '../franchise-meta.js';
import { applyVetoFallout } from './veto-fallout.js';
import { alumniPool } from '../alumni.js';
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
import { rememberBBStrategy, allyStake } from './shared-strategy.js';
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
import { recordBBVotes, tickBBKnowledge, stableRng } from './knowledge.js';
import { runCallOutChain } from './white-locust.js';
import { runPremiereMystery } from './premiere-mystery.js';
import { checkBBLastWords } from './last-words.js';
import { generateBBJuryHouse } from './jury-house.js';
// The pawn ask is where the jury bubble is most visible in a decision: an
// exposed houseguest a week from a seat takes a chair they would have refused.
import { bubbleCompliance } from './jury-pressure.js';
import { recordReign, reignMadeAnEnemy } from './reign.js';
import { advanceThemeArc, currentTheme, installTheme, themeBeat, themeState,
  themePrimer, themeTwistAnnouncement } from './themes.js';
import { awardWeeklyBucks, bucksLedgerFor } from './bb-bucks.js';
import { runSideBets, settleSideBets } from './side-bet.js';
import { derbySlotHolders, placeDerbyBets, resolveDerbyBets } from './veto-derby.js';
import { resolveWeekTwistState } from './twist-contract.js';
import { offerSaboteurMission, resolveSaboteurMission, checkSaboteurBank, saboteurEvicted,
  announceSaboteur, runSaboteurAccusation, saboteurState } from './saboteur.js';
import { sequesterHoh, leakDeliberation, sequesterRegret } from './instant-eviction.js';
import { swapTwins, twinTells, twinDiscovery, checkTwinEntry, twinEvicted, twinState,
  openTwinTwist, offerTwinMission, resolveTwinMission, twinUnfinished,
  twinExposure as twinExposureLevel } from './twin-twist.js';
import { rivalsState, announceRivals, openRivals, seatRivals, rivalsSittingOut, rivalsImmune,
  rivalsChooseHoh, rivalWeekEvents, rivalEvicted } from './rivals.js';
import { grantPower, activePowerAt, usePower, expirePowers, powerLedgerFor, spendPull, BB_POWER_DEFINITIONS } from './powers.js';

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
  const read = (a, b) => (typeof readBond === 'function' ? readBond(a, b) : 0);

  // ── the field is six, not "the block plus three" ──
  //
  // Seats were hardcoded to three, which is right for the ordinary week and
  // wrong for every week with a third nominee. Roadkill, America's Nominee and
  // the Block Buster all push a third name into `nominees`, so the house was
  // fielding SEVEN players for a veto — the one number the format never moves.
  // Since BB15 the rule is explicit: with three nominees the Head of Household
  // draws two names, and six play.
  const FIELD = 6;
  const seats = Math.max(0, Math.min(FIELD - playing.length, eligible.length));

  // ── and at six houseguests there is nothing to draw for ──
  //
  // The Head of Household, the nominees and the rest ARE the field, so the bag
  // never comes out. Drawing chips to select all three remaining houseguests is
  // a ceremony with no outcome, and the house knows it.
  if (house.length <= FIELD) {
    return { players: [...house], draws: [], automatic: [...house], everybodyPlays: true };
  }

  // One chip per HOUSEGUEST — including the three people doing the drawing.
  // Leaving the Head of Household and the nominees out of the bag made the
  // format's best small moment unreachable: drawing your own chip, or a
  // nominee's, hands the drawer the pick, and those three chips are a real part
  // of the odds. The `usable` branch below has always handled it; nothing could
  // ever reach it.
  const bag = [
    ...house.map(name => ({ kind: 'name', name })),
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
    // WHY they are picking, which is a different scene each way: a blank chip
    // is luck, your own name out of your own hand is the house laughing, and a
    // nominee's chip means the person on the block just handed the drawer the
    // pick.
    const chipWas = chip.kind === 'choice' ? 'choice'
      : chip.name === drawer ? 'own' : 'playing';

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
    const how = chipWas === 'own'
      ? `${drawer} pulls out ${drawer}'s own chip, to a room that enjoys it far too much, and picks again. `
      : chipWas === 'playing'
        ? `${drawer} draws ${chip.name}'s chip — already playing, so the pick comes back to ${drawer}. `
        : '';
    const why = how + (drawer === hoh
      ? (avoid && pickable.length < left.length
        ? `${hoh} picks ${wanted} and pointedly does not pick ${avoid}.`
        : `${hoh} picks ${wanted}, who has no reason to want the block changed.`)
      : promised.has(wanted)
        ? `${drawer} is on the block and picks ${wanted}, who spent two days promising exactly this.`
        : `${drawer} is on the block and picks ${wanted} — the person they think would use it on them.`);
    draws.push({ drawer, chip: 'choice', chipWas, drew: chipWas === 'choice' ? null : chip.name,
      chose: wanted, why });
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
    // Somebody an eviction or two from a jury seat, and exposed, has a reason
    // to be useful to whoever is holding the power this week — and a bold one
    // has the opposite reaction to the same pressure. See js/bb/jury-pressure.js.
    // `danger` here is the SEAT's deadliness rather than this houseguest's own
    // exposure, so the exposure term is derived from the house instead.
    const exposure = Math.min(1, Math.max(0, (danger + burned) / 4));
    const score = stats.loyalty * 0.5 + stats.boldness * 0.3 + trust * 0.7
      - danger - burned + bubbleCompliance(candidate, house, exposure)
      + (rng() - 0.5) * 2;
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

/**
 * Push the antagonist's line for this point in the week, if it has one.
 *
 * `house` is the week's OWN roster, not `gs.activePlayers`. On a Split House
 * cycle the two are not the same object and only one of them is the house the
 * antagonist is talking about; handing over the wrong one refuses legitimate
 * lines silently, which reads as bad writing rather than as a bug.
 */
function _themeSay(week, hook, ctx) {
  // `themeWeek` is the CALENDAR week, which is not `week.num` on a Split House
  // cycle — see the note where it is computed. `side` keeps the two halves of
  // one night from drawing the identical taunt out of the same seed.
  const beat = themeBeat(hook, { week: week.themeWeek ?? week.num,
    house: week.houseAtStart, side: week.splitSide || null, ...ctx });
  if (beat) week.acts.push(beat);
}

/**
 * The last act that is a SCENE, skipping anything the antagonist said.
 *
 * Four places in this file reach for `week.acts[week.acts.length - 1]` to hang
 * a consequence on the ceremony they just pushed — the bloc shield, the
 * Invisible HOH's guesses, the renomination reaction and every plan revision.
 * That idiom held for as long as nothing else pushed in between, and the theme
 * engine broke it: the antagonist speaks at nominations and at the veto, right
 * after those ceremonies, so the last act became a `theme-beat`. It crashed
 * outright at the renomination reaction (a theme beat has no `socialBeats`) and
 * failed silently everywhere else — the bloc-shield narration and the HOH
 * guesses rendered on the Den's card instead of the ceremony they belong to.
 *
 * A commentary line is not a scene the house can act in, so it is never a host
 * for one. The one deliberate exception is `_attachRomance`, which falls back
 * to the last act on purpose when a compressed cycle has no `house` act at all,
 * and keeps its own behaviour.
 */
function _lastStagedAct(week) {
  const acts = week.acts || [];
  for (let i = acts.length - 1; i >= 0; i--) {
    if (acts[i] && acts[i].type !== 'theme-beat') return acts[i];
  }
  return null;
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

  // Where the endgame is, counted from HERE: a house loses one a week and ends
  // at three. Computed rather than stored because a season can gain weeks it
  // did not plan for — a battle-back puts somebody back in the building — and
  // an arc act pinned to `fromEnd` should move with the real endgame rather
  // than with the one the premiere predicted.
  //
  // MINUS FOUR, not three, and the difference is a whole week. `installTheme`
  // counts `houseSize - 3` from the PREMIERE house; this counts from the house
  // standing in front of us, which has already lost `week.num - 1` people. The
  // two must agree or `fromEnd` names one week when the arc books a twist and a
  // different week when it turns the antagonist. Twelve houseguests in week
  // one: 1 + 12 - 4 = 9, which is what installTheme says. The brief's `- 3`
  // said 10 for every week of the same season, and it went unnoticed only
  // because nothing read a `fromEnd` mood yet.
  //
  // ── AND NEITHER INPUT IS WHAT IT LOOKS LIKE ON A SPLIT HOUSE ──
  //
  // `house` is `options.house`, which on a split cycle is HALF the roster, and
  // `week.num` is `gs.bb.weeks.length + 1`, which the two halves increment in
  // turn — both sides push a week record, so side B thinks it is a week later
  // than side A even though they are the same Thursday. Left alone the
  // antagonist printed two different week numbers for one week and measured the
  // endgame at roughly half its true distance, so a `fromEnd` mood could turn
  // many weeks early and stop agreeing with the bookings `installTheme` made
  // off the premiere house — exactly the disagreement the `- 4` above exists to
  // close.
  //
  // So the theme is told the calendar: the week the audience is watching, and
  // the whole house, wall or no wall. `gs.episode` is guarded against the same
  // double-increment a few hundred lines below, which is the precedent.
  //
  // Gated on `splitSide` rather than on `segment`, because a double eviction's
  // second cycle also carries `segment: 2` and genuinely IS a second week
  // record with its own number.
  const _splitB = week.splitSide === 'B';
  const _themeWeek = Math.max(1, week.num - (_splitB ? 1 : 0));
  const _wholeHouse = house.length + (week.splitSide ? (week.splitOther || []).length : 0);
  week.themeWeek = _themeWeek;
  const _totalWeeks = _themeWeek + Math.max(0, _wholeHouse - 4);
  // The register BEFORE the arc gets to move it, so the turn below can tell a
  // change from a restatement.
  const _moodBefore = themeState()?.mood || null;
  advanceThemeArc(_themeWeek, _totalWeeks);
  // The mood AS IT WAS THIS WEEK, kept on the record.
  //
  // The reader dressed every episode in the theme's CURRENT mood, so once a
  // season escalated, replaying week 2 showed the escalated room and the turn
  // appeared to have happened before it did. A mood is a fact about a week, not
  // about the save file.
  week.themeMood = themeState()?.mood || null;
  week.themeId = currentTheme()?.id || null;

  // ── THE SEASON EXPLAINS ITSELF ────────────────────────────────────────
  //
  // Both acts below exist because a viewer said the themes were unreadable:
  // they SPOKE every week and never once said what they were. A theme's
  // antagonist could taunt a house for sixteen weeks without the audience ever
  // being told what it was or what it wanted.
  //
  // Both are gated on the calendar week, not the cycle: `simulateBBWeek` runs
  // twice on a double eviction and once per side on a Split House, and a
  // premiere card printed twice on night one is worse than none.
  const _themeCal = !compressed && (week.segment == null || week.segment === 1);
  const _primer = themePrimer();
  if (_themeCal && _primer && _themeWeek === 1) {
    const th = currentTheme();
    week.acts.push({
      type: 'theme-primer', week: week.num, themeId: th.id,
      name: th.name, tagline: th.tagline || '',
      speaker: th.antagonist?.name || 'The Voice',
      primer: JSON.parse(JSON.stringify(_primer)),
      mood: week.themeMood, players: [], beats: [],
    });
  }
  // A turn is a CHANGE of register, not a week that happens to be hostile.
  // High Roller's books `hostile` at two anchors on purpose (a proportional
  // one and a house-size backstop), so a season that announced on every
  // matching act would announce the same turn twice.
  if (_themeCal && _primer && _moodBefore && week.themeMood && _moodBefore !== week.themeMood) {
    const th = currentTheme();
    week.acts.push({
      type: 'theme-turn', week: week.num, themeId: th.id,
      speaker: th.antagonist?.name || 'The Voice',
      from: _moodBefore, to: week.themeMood,
      headline: _primer.turn?.headline || '', body: _primer.turn?.body || '',
      registers: { from: _primer.register?.[_moodBefore] || '',
        to: _primer.register?.[week.themeMood] || '' },
      players: [], beats: [],
    });
  }

  _themeSay(week, 'open', {});

  // ── the second game, if one is running ──
  //
  // After the twist state resolves, because night one's announcement is pushed
  // onto that list and drawn by the same machinery as every other rule the
  // house is handed. The bank date is checked before the week rather than
  // during it: the reveal changes who this house is willing to sit next to, and
  // a house that finds out on eviction night has already made every decision of
  // the week without knowing.
  // ── the other season twist ──
  //
  // No announcement, because the house is never told: BB5 and BB17 both ran
  // this with the room having to work it out. The swap happens first so the
  // whole week — competitions, plans, threat reads — is played against whichever
  // of them is actually in the building.
  // Two screens a week, at opposite ends of it. The QUOTA is checked first —
  // last week's job may have been the one that got them both in — then the
  // changeover, then the job they are being asked to bring off. Everything
  // else (did it work, who noticed, whether anybody says it out loud) waits
  // until after eviction night, where the results belong.
  try {
    const entered = checkTwinEntry(week);
    if (entered) {
      week.acts.push(entered);
      // She walks in at the TOP of the week, so she plays this one. The rest of
      // the week reads the local `house` array — the competition field, the
      // nomination pool, the vote — and without this she spent her own arrival
      // week unable to win anything, be nominated for anything or vote, which
      // is a strange first week for somebody whose whole storyline was getting
      // into the house. `houseAtStart` is this same array on purpose: she was
      // in the building before the week started, just not in the open.
      for (const name of (gs.activePlayers || [])) {
        if (!house.includes(name)) house.push(name);
      }
    }
    else {
      // Night one is not a changeover — there is nothing to change over from.
      // It is the only place the rules get said out loud, to the only people
      // allowed to hear them, and the two of them decide between themselves
      // which one walks through the front door.
      try {
        const duoOpen = announceDuos(week);
        if (duoOpen) week.acts.push(duoOpen);
      } catch { /* the season plays without the announcement */ }
      const opening = openTwinTwist(week, { rng });
      if (opening) week.acts.push(opening);
      const swap = opening ? null : swapTwins(week, { rng });
      const brief = offerTwinMission(week, { rng });
      if (swap) week._twinSwap = swap;
      if (brief) week.acts.push({ ...brief, swap: swap || null });
    }
  } catch { /* the house plays a normal week */ }

  // The three who walk in late. Announced like any other rule the house is
  // handed — the wiki is explicit that the eleven already living there were
  // INFORMED — and then they actually arrive, which is its own screen.
  // Only the RULE, here. They do not walk in until after the competition — see
  // the arrival block below the crowning.
  try { announceRivals(week); } catch { /* the season plays without them */ }

  try {
    announceSaboteur(week);
    const banked = checkSaboteurBank(week);
    if (banked) week.acts.push(banked);
    // This week's job, briefed before anything happens — the audience is told
    // what is coming and the house is not, which is the whole pleasure. Held
    // rather than pushed: on the install week the announcement act has not been
    // built yet, and a briefing that airs before the house has been told the
    // twist exists is the season's first screen out of order.
    week._sabBrief = offerSaboteurMission(week, { rng });
  } catch { /* the twist ends quietly rather than ending the week */ }
  // The Invisible HOH (BBCAN9): the competition runs, the result is sealed,
  // and only the winner knows. Everything the engine writes on the house's
  // behalf this week has to pass one test — could the house actually know
  // this? — because a hidden winner is not useful if every strategy function
  // silently knows the identity.
  const hohSecret = week.twistState?.rules?.hohSecret === true;
  week.hohSecret = hohSecret;

  // ── THE SANCTUM: no secret ballot ────────────────────────────────────
  //
  // The inverse of the line above. Where the Invisible HOH asks "could the
  // house know this?" and answers no, this week answers YES to the one thing
  // the house is never allowed to know for certain — who voted how.
  //
  // Set here, next to its opposite, because everything downstream is written
  // on the assumption that a ballot is private: detection is a probability,
  // an alliance that comes up short blames the wrong chair, and a flip that is
  // never seen is the best week of somebody's game. For one night none of that
  // is true, and the places that care read this flag.
  week.publicVote = week.twistState?.rules?.publicVote === true;

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

  // ── the audience pays the house ──
  //
  // Gated on the theme DECLARING an economy rather than on its id: a theme is
  // a schedule, a voice and a skin, and the engine asking "does this season
  // run on money?" is how the fifth theme gets a currency without a sixth
  // engine edit. It also keeps an unthemed season exactly as it was.
  //
  // First thing in the week, before anybody nominates anybody, because the
  // payout is information — it tells the room who the audience is watching,
  // and the room is allowed to act on that all week.
  //
  // It sits here rather than up beside `week.blocReads` for one mechanical
  // reason: `addBeats` is a `const` declared just above, so calling it any
  // earlier is a temporal dead zone — and inside this try/catch that would
  // fail SILENTLY, paying nobody all season with no error to show for it.
  // Nothing has nominated, competed or voted yet, so the payout still lands
  // ahead of every decision it is supposed to inform.
  //
  // ── ONCE PER CALENDAR WEEK, OVER THE UNDIVIDED HOUSE ──
  //
  // `simulateBBWeek` is a CYCLE, not a week, and two twists run it more than
  // once for one night. Unguarded, both corrupted a ledger that persists into
  // the save and gets spent weeks later:
  //
  //   • A double eviction runs a second cycle the same night, so the house was
  //     paid TWICE — two acts, two transcript sections, two VP screens.
  //   • A split house runs each half as its own cycle. Each side of ≥7 drew a
  //     COMPLETE tier set, so six people took the top hundred instead of
  //     three; and a side of ≤6 returned null, so half the house was silently
  //     never paid at all.
  //
  // So: pay on the FIRST cycle only, over the roster the audience actually
  // voted on — which on a split week is both halves, because the vote is not
  // behind the wall even though the game is. `segment` is 1 on side A, 2 on
  // side B and 2 on either flavour of second cycle; a plain week has none.
  // `compressed` is belt-and-braces (it implies segment 2), and it is checked
  // explicitly because the `week-in-one` double eviction runs its second cycle
  // UNCOMPRESSED — guarding on `compressed` alone would still have paid twice.
  const _payThisCycle = !compressed && (week.segment == null || week.segment === 1);
  // Side A's cycle pays for everybody, so the tiers are drawn over twelve
  // people rather than twice over six. Deduped defensively: nothing should put
  // a name on both sides of the wall, and a double payout is exactly the bug
  // this block is fixing.
  const _calendarHouse = week.splitOther?.length
    ? [...new Set([...house, ...week.splitOther])]
    : house;
  if (_payThisCycle && currentTheme()?.economy === 'bb-bucks') {
    try {
      const payout = awardWeeklyBucks({ week, house: _calendarHouse, rng });
      if (payout) week.acts.push(addBeats(payout, { players: payout.payouts.map(p => p.name).slice(0, 4) }));
      // The wallet each houseguest carries INTO the week's decisions, taken
      // after the audience has paid and before anybody has bet or bought a
      // seat. House Status · Before draws from this and House Status · After
      // draws from the end-of-week snapshot, so the two differ for exactly the
      // people who did something with their money — which is the comparison
      // worth having.
      week.bucksLedgerOpen = bucksLedgerFor(_calendarHouse);
    } catch { /* money is not load-bearing for the week */ }
  }

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
    const jp = pronouns(joined);
    return {
      text: `The members of <strong>${alliance.name}</strong> bring <strong>${joined}</strong> into the bedroom `
        + `and offer ${jp.obj} a place in the alliance. ${joined} agrees, then asks who outside the room already knows.`,
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
    const act = _lastStagedAct(week);
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

  // ── WHAT THE FLOOR IS SELLING, DECIDED BEFORE THE HOUSE IS TOLD ──────
  //
  // The room does not open until after nominations, but the rules are read out
  // hours earlier — so the game has to be chosen HERE, or the announcement
  // cannot name it. It used to name the wheel and its 125 unconditionally, and
  // read that out verbatim on a night the floor was selling a 50 Derby: the
  // wrong price for the wrong game, told to the whole house.
  //
  // The author's pick wins if the card carries one; otherwise the room's own
  // order, counted off the weeks that have already aired.
  if (twists.has('bb-high-rollers-room')) {
    week.roomGame = (options.roomGame && ROOM_GAMES.find(g => g.id === options.roomGame))
      || roomGameForNight((gs.bb.weeks || [])
        .filter(w => (w.acts || []).some(a => a.type === 'high-rollers-room')).length);
    for (const a of week.twistState?.announcements || []) {
      if (a?.twist !== 'bb-high-rollers-room' || !week.roomGame) continue;
      if (week.roomGame.announceRule) a.rule = week.roomGame.announceRule;
      if (week.roomGame.announceSting) a.sting = week.roomGame.announceSting;
    }
  }

  if (!compressed && (week.twistState?.announcements || []).length) {
    // A twist that will not run does not get announced. The house is told the
    // rules it is about to live under, not the ones that were considered.
    const announced = week.twistState.announcements
      .filter(a => a?.twist !== 'bb-battle-of-the-block' || botbPossible);
    // ── one rule per gathering ──
    //
    // The house is called in, told a thing, and reacts to that thing. Two rules
    // read out at one meeting produced a single reaction — whichever register
    // won — so on a week that opened with both the Saboteur and an Instant
    // Eviction the room said "well, it's one of you" and nobody mentioned that
    // somebody was going home that night with no veto to stop it. The second
    // rule was on the screen and in the transcript and had happened to nobody.
    //
    // So they are separate meetings, which is also what the show does: a season
    // twist is announced on its own night and a week's rule when it applies.
    for (let annIdx = 0; annIdx < announced.length; annIdx++) {
    const group = [announced[annIdx]];
    const again = annIdx > 0;
    const beats = [];
    const byStat = (stat, pool = house) => [...pool].sort((a, b) => pStats(b)[stat] - pStats(a)[stat]);
    // What the room was actually told.
    //
    // These three reactions were written for a POWER — somebody says "good, I
    // hope I win it", somebody does the arithmetic on holding it, and the two
    // people who will never get near it huddle. Handed to the Saboteur they
    // were nonsense: nothing about that announcement is winnable, and a house
    // that has just been told one of its own is working against it does not
    // react by hoping to be picked. An announcement declares its own register
    // now, and 'paranoia' is the one where the rule is a person in the room.
    const paranoid = group.some(a => a?.reactions === 'paranoia');
    // A rule that removes something rather than offering something. Nobody is
    // hoping to win an Instant Eviction, and nobody is looking round the room
    // wondering who it is — the safety net is simply gone and everybody in here
    // is standing on it.
    const dread = !paranoid && group.some(a => a?.reactions === 'dread');
    const schemer = byStat('strategic')[0];
    const bold = byStat('boldness').find(n => n !== schemer) || byStat('boldness')[0];
    if (bold) {
      beats.push({
        text: paranoid
          ? `${bold} breaks the silence first, and does it by looking straight down the sofa: "Well. It's one of you." Half the room laughs. The other half works out where they were sitting.`
          : dread
            ? `${bold} breaks the silence first: "So whoever wins that comp gets to end somebody's game before dinner." Nobody laughs, because nobody can think of a reason to.`
            : `${bold} breaks the silence first: "Good. I hope I win it." Half the room laughs; the other half writes it down.`,
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
        text: paranoid
          ? `${schemer} says nothing at all, and is already doing the only arithmetic that matters: ${house.length - 1} other people, one of them lying, and a whole season to find out which. Nobody in this room is going to be believed about anything again.`
          : dread
            ? `${schemer} works out the only thing worth working out: there is no afternoon of talking anybody round this week, and no veto to hide behind if it goes wrong. Everything has to be done before that competition ends.`
            : `${schemer} says nothing at all, which from ${schemer} is the loudest possible reaction. The rule has already been taken apart and reassembled twice behind those eyes.`,
        players: [schemer], badgeText: paranoid ? 'COUNTING THE ROOM' : dread ? 'NO TIME TO WORK' : 'RECALCULATING', badgeClass: 'grey',
        eventId: 'twist-announcement-recalc', category: 'ceremonies', location: 'living-room',
      });
    }
    // The two people with the least power in the room hear the same rule and
    // reach for each other — shared dread is how outsiders become a pair. Under
    // a hidden-agenda twist the same look means something colder: the first
    // thing anybody does is decide who they are prepared to rule out.
    const outsiders = byStat('strategic').slice(-2);
    if (outsiders.length === 2 && getBond(outsiders[0], outsiders[1]) > -1) {
      _cappedBondWindow(() => addBond(outsiders[0], outsiders[1], 0.3));
      beats.push({
        text: paranoid
          ? `${outsiders[0]} and ${outsiders[1]} find each other before anybody has moved. Neither says the sentence out loud, because the sentence is "it isn't you, is it" and saying it makes it a question. They rule each other out, on nothing, and stay that way for weeks.`
          : dread
            ? `${outsiders[0]} and ${outsiders[1]} do the same sum at the same time and arrive at the same answer: neither of them is winning that competition, and neither of them has anybody upstairs to ask for anything.`
            : `${outsiders[0]} and ${outsiders[1]} trade one look across the sofas that says the same thing: whatever this rule is for, it is not for people like us. They spend the rest of the evening within arm's reach of each other.`,
        players: [...outsiders], badgeText: paranoid ? 'RULING EACH OTHER OUT' : dread ? 'NOTHING TO ASK FOR' : 'SHARED DREAD', badgeClass: 'blue',
        eventId: 'twist-announcement-dread', category: 'ceremonies', location: 'living-room',
        effects: [{ kind: 'bond', text: `${outsiders[0]} & ${outsiders[1]} +0.3`, delta: 0.3 }],
      });
    }
    // Only decorate a rule the contract already made public. The theme helper
    // also verifies that this exact week/type came from the theme's stamped
    // arc, so CORA or the Den never takes credit for a card the user booked.
    const themeAnnouncer = themeTwistAnnouncement(group[0], {
      week: week.themeWeek ?? week.num,
      side: options.splitSide || '',
    });
    week.acts.push({ type: 'twist-announcement', announced: group,
      secondCall: again, socialBeats: beats, themeAnnouncer });
    }
  }
  // After the wall has spoken, if it spoke this week.
  if (week._sabBrief) { week.acts.push(week._sabBrief); delete week._sabBrief; }

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
  let preCrowned = options.preCrownedHoh && house.includes(options.preCrownedHoh)
    ? options.preCrownedHoh : null;

  // ── THE WHITE LOCUST RESORT ──────────────────────────────────────────
  //
  // The other way to arrive with the power already decided. The Call Out Chain
  // crowns whoever survived their turn fastest, so it hands back a Head of
  // Household exactly like a Split House does — and it takes somebody out of
  // the game on the way, before a single nomination is made.
  //
  // It runs HERE, in front of the competition it replaces, because everything
  // below assumes the yard it is about to play in still contains everybody.
  if (!compressed && week.twistState?.rules?.callOutChain && !preCrowned) {
    try {
      const chain = runCallOutChain(week, house, { rng });
      if (chain) {
        week.acts.push(addBeats(chain.act, { players: [chain.evicted], evicted: chain.evicted }));
        week.resortEvicted = chain.evicted;
        // Out of the house before the week runs. Every roster-scoped system
        // reads gs.activePlayers, so this is the only place it has to be said
        // — and the local `house` is narrowed too, or the week plays a
        // competition against somebody who has already gone.
        gs.activePlayers = (gs.activePlayers || []).filter(n => n !== chain.evicted);
        // And ELIMINATED, not merely off the roster. The normal eviction path
        // does both a thousand lines below this one; a player removed from the
        // roster but missing from `gs.eliminated` is a player the placements,
        // the jury and the finale all disagree about.
        gs.eliminated ||= [];
        if (!gs.eliminated.includes(chain.evicted)) gs.eliminated.push(chain.evicted);
        const at = house.indexOf(chain.evicted);
        if (at >= 0) house.splice(at, 1);
        preCrowned = house.includes(chain.hoh) ? chain.hoh : null;
        week.resortHoh = preCrowned;
      }
    } catch (err) {
      // Loud, like the detection catch below: a resort week that silently does
      // not happen is a scheduled twist that vanished.
      (week._resortError ||= []).push(String(err?.message || err));
    }
  }

  // HOH act and the first scramble.
  //
  // "The Rivals could not compete nor could they be nominated during the first
  // week." They sit this one out and then decide it, which is the twist.
  let rivalsOut = [];
  try { rivalsOut = rivalsSittingOut(week); } catch { rivalsOut = []; }
  // "Holders of a Golden Key did not compete in competitions." Same seam as the
  // Rivals sitting out, for the same reason: it is a filter on who is in the
  // yard, and nothing downstream has to know why.
  let keysOut = [];
  try { keysOut = duosSittingOut(); } catch { keysOut = []; }
  /* THE YARD CANNOT BE EMPTIED BY PEOPLE WHO ARE NOT PLAYING.
     Key holders sit out, and with an early expiry threshold enough of them
     accumulate that the competition had nobody left to run — the engine threw
     "requires at least two unique participants" and took the season with it.
     A key is a rule about that houseguest, not a rule that can cancel the
     week, so when honouring it would leave fewer than two in the yard the
     keys give way and their holders play. Rivals sitting out is the harder
     rule and gives way second. */
  let sittingOut = [...rivalsOut, ...keysOut];
  const yard = out => house.filter(name => name !== gs.bb.outgoingHoh && !out.includes(name));
  if (yard(sittingOut).length < 2) sittingOut = [...rivalsOut];
  if (yard(sittingOut).length < 2) sittingOut = [];
  // ── PREMIERE NIGHT ───────────────────────────────────────────────────
  //
  // Runs before the relic is read below, because it is what hands the relic
  // out: the two hunts happen, the two prizes are granted through the ordinary
  // power shelf, and the gatekeeper block underneath then finds a live power
  // and acts on it in the same week. Nothing here knows about the other; they
  // meet at the ledger.
  if (!compressed && week.twistState?.rules?.premiereMystery) {
    try {
      const opening = runPremiereMystery(week, house, { rng });
      if (opening) {
        week.premiereMystery = { relicWinner: opening.relicWinner, hostWinner: opening.hostWinner };
        week.acts.push(addBeats(opening.act,
          { players: [opening.relicWinner, opening.hostWinner] }));
      }
    } catch (err) {
      (week._premiereError ||= []).push(String(err?.message || err));
    }
  }

  let hohPlayers = yard(sittingOut);

  // ── THE RELIC ────────────────────────────────────────────────────────
  //
  // BB27 premiere night: whoever recovered the stolen HOH relic chose which
  // four houseguests were allowed to play for the first crown, themselves
  // optional. It acts on the YARD rather than on a ceremony, which is what
  // makes it worse than it sounds — there is no veto for not being in it.
  //
  // The holder either backs themselves or backs a friend. Both are legible on
  // screen and both are somebody's whole week.
  try {
    const relic = activePowerAt('hoh-competition', week.num, 'hoh-gatekeeper');
    if (relic && house.includes(relic.holder) && hohPlayers.length > 4) {
      const strength = n => {
        try {
          const s = pStats(n);
          return (s.physical + s.endurance + s.mental + s.intuition) / 4;
        } catch { return 5; }
      };
      const stat_ = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };
      const others = hohPlayers.filter(n => n !== relic.holder);
      const median = [...hohPlayers].map(strength).sort((a, b) => a - b)[Math.floor(hohPlayers.length / 2)];

      // ── THE HOURS BEFORE THE NAMES ARE READ ──────────────────────────
      //
      // The pick was a sort, and a sort is not what this power is. Everybody
      // in that house knows the four names have not been decided yet and that
      // the person deciding them is standing in the kitchen, so the interval
      // between winning this and spending it is the most intensely political
      // stretch of the season — and it was happening off screen, instantly,
      // with nobody allowed to say anything.
      //
      // So the house LOBBIES. Each pitch is a real offer with a real price,
      // it lands or it does not on social against the holder's read, and
      // whatever was promised is remembered by both of them afterwards —
      // which is the point. A promise made to get into a competition is a
      // debt somebody is holding in week four.
      const lobby = [];
      // WHO ASKS, and it must not be "the five most social" — selecting on
      // social and then branching on social gave every pitch in the house the
      // same shape, five times in a row.
      //
      // Three different reasons to go and knock: you are good at asking, you
      // are the most obviously about to be left out, or you simply decided to.
      const byNerve = others.slice().sort((a, b) =>
        (stat_(b, 'social') + stat_(b, 'boldness')) - (stat_(a, 'social') + stat_(a, 'boldness')));
      const byExposure = others.slice().sort((a, b) => strength(a) - strength(b));
      const askers = [...new Set([
        ...byNerve.slice(0, 2),
        ...byExposure.slice(0, 2),
        ...others.filter(() => rng() < 0.25),
      ])].slice(0, Math.min(5, others.length));
      const owed = new Set();
      for (const asker of askers) {
        const st = pStats(asker);
        let warmth = 0;
        try { warmth = getPerceivedBond(relic.holder, asker); } catch { warmth = 0; }
        // What they are actually offering. A weak player has nothing to trade
        // but loyalty; a strong one can offer to take somebody else out.
        // What they can actually put on the table, and it has to differ across
        // a cast or every pitch reads the same. Strategic players trade a
        // target, social ones trade a vote, the bold ask outright, and whoever
        // has neither offers the only thing they have.
        const offer = st.strategic >= 6 && strength(asker) >= median ? 'target'
          : st.social >= 6 ? 'vote'
            : st.boldness >= 7 ? 'plea'
              : strength(asker) >= median ? 'safety'
                : 'loyalty';
        const chance = 0.18
          + ((st.social || 5) / 10) * 0.3
          + Math.max(0, warmth) * 0.035
          + (offer === 'target' ? 0.1 : 0)
          - Math.max(0, strength(asker) - median) * 0.05;   // strong asks are scarier
        const won = rng() < Math.max(0.05, Math.min(0.9, chance));
        lobby.push({ asker, offer, won, warmth: Math.round(warmth * 10) / 10 });
        if (won) {
          owed.add(asker);
          // Both of them remember what was said. This is the debt.
          try {
            rememberStrategy(relic.holder, asker, 'promised-me-a-seat', week.num, 2,
              { format: 'big-brother', offer });
            rememberStrategy(asker, relic.holder, 'let-me-play', week.num, 2,
              { format: 'big-brother', offer });
          } catch { /* texture */ }
          try { addBond(relic.holder, asker, 1.1); } catch { /* fine */ }
        } else {
          try { addBond(relic.holder, asker, -0.5); } catch { /* fine */ }
        }
      }
      week.relicLobby = lobby;

      let picked;
      if (hohPlayers.includes(relic.holder) && strength(relic.holder) >= median) {
        // Back yourself, against the three you are most likely to beat — but a
        // promise made an hour ago outranks the arithmetic, because breaking
        // one on night one is a thing the whole house watches you do.
        const rest = others.sort((a, b) => (owed.has(b) - owed.has(a)) || (strength(a) - strength(b)));
        picked = [relic.holder, ...rest.slice(0, 3)];
      } else {
        // You cannot win it, so buy a friendly reign instead: the people who
        // asked and were told yes first, then the people who like you most.
        picked = others.sort((a, b) => {
          if (owed.has(a) !== owed.has(b)) return owed.has(b) - owed.has(a);
          let ba = 0; let bb = 0;
          try { ba = getPerceivedBond(relic.holder, a); } catch { ba = 0; }
          try { bb = getPerceivedBond(relic.holder, b); } catch { bb = 0; }
          return bb - ba;
        }).slice(0, 4);
      }
      hohPlayers = picked.filter(Boolean);

      // A promise made and then not kept, in public, before anybody has played
      // a single competition. This is the worst thing that can happen to
      // somebody on night one and it is entirely self-inflicted.
      const broken = [...owed].filter(n => !hohPlayers.includes(n));
      week.relicBroken = broken;
      for (const n of broken) {
        try { addBond(n, relic.holder, -3.2); } catch { /* fine */ }
        try {
          rememberStrategy(n, relic.holder, 'promised-and-did-not', week.num, 3,
            { format: 'big-brother' });
        } catch { /* texture */ }
      }
      usePower(relic, week.num);
      week.relicPick = { holder: relic.holder, eligible: [...hohPlayers],
        includedSelf: hohPlayers.includes(relic.holder) };
      week.acts.push(addBeats({
        type: 'power-played', powerId: 'hoh-gatekeeper', holder: relic.holder,
        name: BB_POWER_DEFINITIONS['hoh-gatekeeper'].name, timing: 'nominations',
        secret: relic.visibility === 'secret', visibility: relic.visibility,
        eligible: [...hohPlayers], includedSelf: hohPlayers.includes(relic.holder),
        detail: `${relic.holder} names the only four houseguests allowed to play for this week's `
          + `crown: ${hohPlayers.join(', ')}. Everybody else watches, and everybody can count who `
          + 'is missing.',
        lobby: lobby.map(l => ({ ...l })), broken: [...broken],
        beats: [
          // The hours before the names, one beat each. A power whose whole
          // weight is who lobbied for it should not resolve in one sentence.
          ...lobby.map(l => ({
            text: l.won
              ? `${l.asker} gets to ${relic.holder} early and offers ${
                l.offer === 'target' ? 'to go after somebody on their behalf'
                  : l.offer === 'vote' ? 'a vote, whenever it is needed and without asking why'
                    : l.offer === 'safety' ? 'a week of safety if it ever comes to that'
                      : l.offer === 'plea' ? 'nothing at all, and simply asks'
                        : `the only thing ${l.asker} has on night one, which is loyalty`}. `
                + `${relic.holder} says yes. Neither of them writes it down and both of them will remember it.`
              : `${l.asker} makes the case and ${relic.holder} listens to all of it and does not say yes. `
                + `${l.asker} goes back to the bedroom having spent something and bought nothing.`,
            players: [l.asker, relic.holder],
            badgeText: l.won ? 'A PROMISE' : 'TURNED DOWN',
            badgeClass: l.won ? 'gold' : 'grey',
            eventId: l.won ? 'relic-promise' : 'relic-refused',
            category: 'deals', location: 'kitchen',
          })),
          ...broken.map(n => ({
            text: `${n} was told yes. ${n} is not one of the four names. On night one, in front of `
              + `everybody, before a single competition has been played.`,
            players: [n, relic.holder],
            badgeText: 'PROMISED AND NOT KEPT', badgeClass: 'red',
            eventId: 'relic-promise-broken', category: 'deals', location: 'living-room',
          })),
          {
          // No markup in a power-played beat: the shared power screen escapes
          // beat text (it has never carried any, so nothing was broken by
          // that), and tags here would render as literal <strong> on the page.
          text: `${relic.holder} reads out four names, and the rest of the house `
            + `is not playing today. ${hohPlayers.join(', ')} go to the yard`
            + `${hohPlayers.includes(relic.holder) ? '' : ` — and ${relic.holder} does not`}. `
            + `Everybody can count who is missing.`,
          players: [...new Set([relic.holder, ...hohPlayers])].slice(0, 5),
          badgeText: 'THE RELIC', badgeClass: 'gold',
          eventId: 'relic-gatekeeper', category: 'power', location: 'backyard',
        }],
      }, { players: [relic.holder] }));
      // Being locked out of a crown is not forgotten by the people locked out.
      for (const n of house) {
        if (hohPlayers.includes(n) || n === relic.holder) continue;
        try { addBond(n, relic.holder, -1.6); } catch { /* fine */ }
      }
    }
  } catch { /* the yard stands as it was */ }
  const hohCompetition = preCrowned ? null
    : runBBCompetition({ type:'hoh', participants:hohPlayers, excluded:house.filter(name => !hohPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.hoh, seed:options.seed,
      // The saboteur got to the yard first. Chosen at the briefing, before any
      // of this ran — see js/bb/saboteur.js.
      sabotaged: week._sabRig?.slot === 'hoh' ? week._sabRig.mark : null });
  // What moving that marker actually cost, recorded off the finished board so
  // the debrief can say it in numbers rather than in adjectives.
  if (week._sabRig && hohCompetition?.sabotage) {
    week._sabRig.outcome = { ...hohCompetition.sabotage, comp: hohCompetition.name, slot: 'Head of Household' };
  }
  const hohResults = hohCompetition
    ? hohCompetition.placements.map(name => ({ name, score:hohCompetition.scores[name], threw:!!hohCompetition.debug.scoreBreakdown[name]?.threw }))
    : [];
  // ── the competition that is secretly three competitions ──
  //
  // BB27. This does not replace the Head of Household competition, it replaces
  // what some of the people in it were playing FOR — so it runs off the board
  // that already exists, and the crown goes to the best finisher who actually
  // wanted it. Somebody chasing a door can hand the week to a player who would
  // otherwise have lost it, which is the entire point and the only way the
  // gamble costs anything.
  let secretPowers = null;
  if (!compressed && !preCrowned && twists.has('bb-secret-power-comp')) {
    try {
      const wanted = options.secretPowerDoors;
      const doors = Array.isArray(wanted) && wanted.length
        ? wanted.slice(0, SECRET_POWER_DOORS)
        : ['hoh-interrogation', 'mystery-competitor', 'mystery-veto'];
      secretPowers = runSecretPowerComp({
        week, house: hohPlayers, outgoingHoh: gs.bb.outgoingHoh,
        results: hohResults, offered: doors, rng,
      });
    } catch { secretPowers = null; }
  }
  // BUILT HERE, PUSHED AFTER THE CROWN. Acts render in the order they are
  // pushed, and pushing this one where it is computed put the powers on screen
  // BEFORE the Head of Household competition that was hiding them — a viewer
  // watching somebody win a door in a competition they had not been shown yet.
  // The coup has a comment about this exact mistake three thousand lines down;
  // it is easy to make and invisible until somebody watches it.
  if (secretPowers) week.secretPowerComp = secretPowers;

  let hoh = preCrowned
    // The crown is whoever won it among the people who were running for it. A
    // week where everybody chased a door has no winner from this, and falls
    // back to the board rather than crowning nobody.
    || (secretPowers?.winner)
    || hook(hooks, 'hohResult', hohCompetition.winner, { week, results: hohResults, competition:hohCompetition, house });
  if (!preCrowned && !hohPlayers.includes(hoh)) hoh = hohCompetition.winner;

  // ── the only time power in this house is given rather than won ──
  //
  // The competition comes down to two and then stops. Three people who have
  // been in the building for an hour, who cannot win it themselves and cannot
  // be nominated, hand the crown to one of them — and the person who receives
  // it spends the rest of the season knowing exactly who to thank.
  let rivalHandover = null;
  try {
    if (!preCrowned && hohCompetition) {
      rivalHandover = rivalsChooseHoh(week, hohCompetition, { rng });
      if (rivalHandover) hoh = rivalHandover.winner;
    }
  } catch { /* the competition result stands */ }

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
  // AFTER the crown, because the crown is what the yard looked like and this is
  // what it actually was. Shown before it, the audience watched people win
  // doors in a competition they had not been shown yet.
  if (secretPowers) {
    week.acts.push(addBeats(secretPowers,
      { players: secretPowers.granted.map(g => g.name).slice(0, 3) }));
  }
  // ── and only now do they come through the door ──
  //
  // The order the night actually runs in: the room is told three more are
  // coming, the house spends its first evening together WITHOUT them, the
  // competition plays, it comes down to two — and the three people nobody in
  // that building has met yet decide which one gets it. Then they walk in.
  //
  // Arriving before any of that put them in the opening House Life, on the
  // memory wall, and in a room reacting to an announcement about themselves.
  /* ── YOU GO, THEY GO: the pairing ──
     After the crowning and before anything in the week reads a nomination
     plan, because from here on every target drags a second name with it. The
     Head of Household is deliberately left out of the pairing: they cannot be
     nominated, so pairing them would hand somebody a free week nobody chose. */
  if (!compressed && twists.has('bb-duo-week') && house.length >= DUO_WEEK_MIN_HOUSE) {
    try {
      const paired = openDuoWeek(week, { house, hoh, rng });
      if (paired) week.acts.push(addBeats(paired, { players: paired.pairs.flat() }));
    } catch { /* the house plays an ordinary week */ }
  }

  if (rivalHandover) week.acts.push(rivalHandover);
  try {
    const arrived = openRivals(week, { rng });
    if (arrived) {
      seatRivals(week, house);
      week.acts.push(arrived);
    }
  } catch { /* the season plays without them */ }
  // The most disruptive moment of the week. One person can no longer be
  // evicted, so for seven days everybody else's plan bends around theirs.
  revise('hoh', { hoh });

  // Slop is the first thing a new Head of Household does with power, and the
  // house watches them do it. Chosen before nominations so the week's first
  // grievance is already in the room when the block is named.
  // ── and there is not always a competition to read it off ──
  //
  // Slop is chosen from the Head of Household board, worst first. A PRE-CROWNED
  // week has no board: the White Locust hands the crown to whoever survived the
  // Call Out Chain, and a Split House week is handed its winner by the episode
  // that crowned two of them. `hohCompetition` is null in both cases — the
  // hohResults line above already knows that — and this call dereferenced it
  // anyway, so a resort week in a season with slop on threw
  // "Cannot read properties of null" and took the whole season down with it.
  // Never seen because the resort's own suite plays it without have-nots, and
  // the sweep that plays real seasons had never scheduled the resort at all.
  //
  // No board, no slop that week, and no ceremony either: an empty have-nots act
  // would draw a room being told who is on slop with nobody named.
  if (twists.has('bb-have-nots') && hohCompetition) {
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
  // ── Instant Eviction: the door locks before anybody can reach them ──
  //
  // The whole twist, and the part the catalogue was missing. A sequestered Head
  // of Household nominates on what they knew at the top of the stairs, so this
  // has to happen BEFORE the plan is chosen — not as narration after it.
  if (skipVeto && !compressed) {
    try { sequesterHoh(week, house, rng); } catch { /* they nominate normally */ }
  }

  // ── somebody takes the crown that was just handed out ──
  //
  // After the Head of Household exists and BEFORE THE NOMINATION PLAN, which is
  // the part that took a second look: run after the plan, the week was planned
  // by the old Head of Household and `untouchable` still protected them — so
  // the new HOH was nominatable and turned up as their own nominee, drawn
  // twice in the same card header. Everything downstream reads `hoh`, so this
  // has to be the first thing that happens after the crown.
  if (!compressed) {
    try {
      const usurp = playInterrogation({ week, house, hoh, rng });
      if (usurp) {
        week.interrogation = usurp;
        week.acts.push(addBeats(usurp, { players: [usurp.deposed, usurp.holder] }));
        if (!usurp.caught) {
          const deposed = hoh;
          hoh = usurp.hoh;
          week.hoh = hoh;
          gs.bb.hoh = hoh;
          // WHO THE HOUSE THINKS RAN THE WEEK.
          //
          // The Interrogation is announced, so the room knows the ceremony
          // changed hands and the blame has nowhere to go. The Deepfake reads
          // the nominations out in the deposed HOH's own voice, so the room
          // believes it watched them choose — and the grievance has to land
          // where the house puts it, not where it belongs.
          if (usurp.creditsDeposed) week.hohPublic = deposed;
        }
      }
    } catch { /* the crown stands */ }
  }

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
  // You cannot ask somebody to sit as a pawn through a locked door. A
  // sequestered Head of Household runs both chairs as real nominations for the
  // same reason an invisible one does — the conversation that makes a pawn a
  // pawn is not available to them.
  if (week.sequestered && plan.pawn) {
    plan.pawn = null;
    plan.structure = 'two-targets';
    plan.structureWhy = 'Sequestered before nominations, with no way to ask anybody to volunteer.';
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
    const comfort = Math.max(0, (() => {
      try { return getPerceivedBond(cloud.holder, hoh); } catch { return 0; }
    })()) * 0.02;
    // If your name is on the plan you are going up, and the only question left
    // is whether you can tell. Intuition shaves a little off being sure and
    // warmth with the Head of Household shaves a little more — but neither of
    // them is allowed to talk somebody out of a power written for exactly this
    // ceremony, which is what a 0.30 floor and a 0.062-per-point read were
    // doing to one holder in five.
    const need = aimedAt
      ? Math.max(0.5, 0.99 - (10 - (st.intuition || 5)) * 0.014 - comfort)
      : 0.05;
    const pull = spendPull({ need,
      weeksLeft: Math.max(0, cloud.expiresAfterWeek - week.num),
      nerve: (st.boldness || 5) / 10,
      exposes: (cloud.visibility || 'public') === 'public' });
    cloudPlayed = rng() < pull;
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
  // The Rivals' other week-one rule, and the half that matters most: they have
  // just handed somebody the house and cannot be punished for it. Only ever
  // true in the week they arrive.
  let rivalsSafe = [];
  try { rivalsSafe = rivalsImmune(week); } catch { rivalsSafe = []; }
  // A Golden Key is safety from nomination AND eviction until the house is
  // down to the size the twist named.
  let keySafe = [];
  try { keySafe = keyHolders(); } catch { keySafe = []; }
  /* YOU CANNOT NOMINATE YOUR OWN DUO.
     The Head of Household cannot go up, so the pair they are half of cannot go
     up either — which makes their partner safe for the week, at this ceremony
     and at the veto replacement after it. Winning the competition saves two
     people, and that is the strategic centre of the twist rather than a
     technicality. */
  let duoCrownSafe = [];
  try { duoCrownSafe = duoSafeWith(hoh, house); } catch { duoCrownSafe = []; }
  const untouchable = [hoh, week.botbActive ? coHoh : null, week.cloud?.holder,
    carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite),
    ...rivalsSafe, ...keySafe, ...duoCrownSafe].filter(Boolean);

  /* TWO DUOS, FOUR KEYS.
     Read before the ordinary plan because it replaces the block wholesale
     rather than adjusting it. Returns null when the house cannot field two
     clean pairs — everybody left is protected, or the pairs have been eaten
     into — and the week falls back to an ordinary two-chair block, which is
     the only honest thing to do with a rule that has run out of people. */
  // ── the week where nobody goes home ──
  //
  // `cancelEviction` has been in BASE_WEEK_RULES since the contract was
  // written, the Halting Hex has been declaring it since it was added, and
  // NOTHING HAS EVER READ IT. So the Hex has been a power that grants, expires
  // and does nothing, and there was no way to author a no-eviction week at all.
  //
  // Read here, at the top of the nomination phase, because that is exactly what
  // it cancels: no ceremony, no veto, no vote, nobody leaves. Everything before
  // this line still happens — the Head of Household is still crowned, and any
  // competition hiding powers inside it still hands them out — which is what
  // makes this pairable with the secret power competition: a whole episode
  // whose only outcome is who is holding what.
  if (week.twistState?.rules?.cancelEviction) {
    week.nominees = [];
    week.evicted = null;
    week.cancelledEviction = true;
    week.acts.push(addBeats({
      type: 'no-eviction',
      beats: [{
        text: 'There is no ceremony this week. No nominations, no veto, no vote — this house is '
          + 'the same size on Thursday as it is right now, and everybody in it has to spend the '
          + 'week looking at each other knowing that.',
        players: [...house].slice(0, 6), badgeText: 'NOBODY GOES HOME', badgeClass: 'gold',
      }, {
        text: `${hoh} holds a Head of Household with nothing to spend it on, which is either the `
          + 'safest week of their game or the most useless.',
        players: [hoh].filter(Boolean), badgeText: 'A CROWN AND NO BLOCK', badgeClass: 'blue',
      }],
    }, { players: [hoh].filter(Boolean) }));
    // ── STORE IT. THE WEEK STILL HAPPENED. ──
    //
    // This returned straight out, and both `gs.bb.weeks.push(week)` calls are
    // further down — so a No Eviction week was simulated in full, written to
    // the transcript, and never added to the house's own week ledger.
    //
    // Everything that reads that ledger therefore could not see it. The social
    // feed builds from `gs.bb.weeks` and reported "no episodes found for Big
    // Brother" on a season whose first episode had just been played. The season
    // export maps over the same array. And the next week's number comes from
    // `gs.bb.weeks.length + 1`, so the following week would have called itself
    // week one as well — two week ones in a season, from one early return.
    gs.bb.weeks.push(week);
    return week;
  }

  /* THE DUOS TWIST NAMES A PAIR.
     Computed HERE rather than up with the ceremony's other inputs because the
     crown can still change hands above this line, and a block chosen for the
     wrong Head of Household is chosen against the wrong reads. Naming one of a
     duo names both; when no whole duo can go up this returns null and the
     ordinary two-name plan runs. */
  let duoPair = null;
  let duoPairs = null;
  if (duosActive()) {
    /* TWO DUOS WHERE THE HOUSE CAN FIELD THEM.
       Four on the block turns eviction night into a choice between two
       relationships rather than between two people who happen to know each
       other — see duoVoteResult. Falls back to one duo the moment the pairs
       have been eaten into far enough that a second clean one does not exist,
       which is most of the back half of a season. */
    try {
      if (twoDuoBlock() && house.length >= 8) {
        const dbl = duoDoubleBlock({ plan, house, protectedNames: untouchable, hoh, rng });
        if (dbl) { duoPair = dbl.nominees; duoPairs = dbl.pairs; }
      }
      if (!duoPair) duoPair = duoBlock({ plan, house, protectedNames: untouchable, hoh, rng });
    } catch { duoPair = null; duoPairs = null; }
  }

  let duoWeekNoms = null;
  if (duoWeekActive(week)) {
    try {
      duoWeekNoms = duoWeekNominees(week, { plan, house,
        untouchable: [...untouchable, ...duoWeekSafe(week)], hoh, rng });
    } catch { duoWeekNoms = null; }
    if (!duoWeekNoms) week.duoWeekCollapsed = true;
  }

  // ── THE CURSE TAKES A CHAIR; IT DOES NOT ADD ONE ──
  //
  // It used to append a nominee, which made the block one bigger than whatever
  // else was shaping it — and every other third-chair mechanic in the game
  // refused to run beside it for that reason alone. Nine cards and the Block
  // Buster, all incompatible with the one twist whose curse could just as
  // easily have taken a seat instead of adding one.
  //
  // Reserved, so the Head of Household knows the cost while they are choosing:
  // they name ONE this week instead of two, or two instead of three under the
  // Block Buster, and the last chair is filled by somebody nobody chose. The
  // block is exactly the size it would have been. The Den now costs the HOH a
  // nomination rather than costing the week its shape.
  //
  // Resolved HERE rather than at the ceremony because the curse is allowed to
  // MISS — everybody eligible can be protected — and a seat reserved for a
  // curse that never lands leaves the block one short and the vote broken. The
  // name has to be known before the Head of Household starts counting.
  //
  // A duo week is left alone: its block is pairs, and half a pair beside a
  // cursed stranger is not a duo block.
  let curseSeat = null;
  const _curseCanReserve = !duoWeekNoms && !duoPair;
  if (week.temptation?.accepted && _curseCanReserve) {
    const curseAct = resolveCurse({ week, house, rng, protectedNames: [...untouchable] });
    if (curseAct) {
      if (curseAct.cursed) {
        curseSeat = curseAct.cursed;
        week.temptationChair = curseSeat;
      } else {
        week.temptationCurseMissed = true;
      }
      week.acts.push(addBeats(curseAct,
        curseAct.cursed ? { nominees: [curseAct.cursed] } : {}));
    }
  }
  // How many the Head of Household actually gets to name.
  const hohSeats = Math.max(1, nomineeCount - (curseSeat ? 1 : 0));

  // `duoBlock` already guarantees both halves are in the house and neither is
  // protected, so this no longer re-filters the pair — that filter is exactly
  // what used to leave half a duo on the block beside a stranger.
  let nominees = duoWeekNoms ? [...duoWeekNoms]
    : duoPair ? [...duoPair]
      : [...new Set(plan.nominees)]
        .filter(name => house.includes(name) && !untouchable.includes(name)
          && name !== curseSeat).slice(0, hohSeats);
  if (duoWeekNoms) week.duoWeekNominees = [...duoWeekNoms];
  if (duoPair && nominees.length === duoPair.length) {
    week.duoNomination = [...nominees];
    if (duoPairs) week.duoBlocks = duoPairs.map(p => [...p]);
  }
  while (nominees.length < hohSeats) {
    const extra = chooseReplacement(hoh, house,
      [...untouchable, ...nominees, curseSeat].filter(Boolean), plan, rng);
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
  while ((safetyActive || doubleVote) && nominees.length < hohSeats) {
    const third = chooseReplacement(hoh, house,
      [...untouchable, ...nominees, curseSeat].filter(Boolean), plan, rng);
    if (!third || nominees.includes(third)) break;
    nominees.push(third);
  }
  // And the reserved chair, last, so the block reads as the Head of
  // Household's names plus the one that is not theirs.
  if (curseSeat && !nominees.includes(curseSeat)) nominees.push(curseSeat);
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
      //
      // The Head of Household does not play. On the show the HOH can neither
      // win this nor be named by it, and the second half was already enforced
      // below while the first was not — so the HOH could quietly win the thing
      // and become the anonymous third nominator. That breaks the deduction the
      // whole twist runs on: the house reasons about the third key by ruling
      // OUT the one person holding the other two keys in public, so a week
      // where the HOH turned it makes every houseguest provably wrong.
      type: 'tiebreaker', participants: house.filter(n => n !== hoh), house, week, rng,
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
    // ── THE PRICE IS A SEASON CAPABILITY, NOT A PROPERTY OF THE TWIST ──
    //
    // The Coin is older than BB Bucks and is schedulable on any season. Only a
    // theme declaring an economy can charge for it, so on every other season
    // the buy-in is what it always was — a public decision to play, with
    // nothing to hand over. Gating the twist on the currency instead would
    // silently delete it from every season that is not High Roller's.
    const coinPrice = currentTheme()?.economy === 'bb-bucks' ? COIN_PRICE : 0;
    const coin = runCoinOfDestiny({ week, house, hoh, nominees: [...nominees],
      price: coinPrice, rng });
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
        // ── AND THE WEEK GOES WITH IT ──
        //
        // Canon does not hand the week back after the nomination ceremony: the
        // winner IS the Head of Household until Thursday, which means the
        // post-veto replacement is theirs too. Without this the person who was
        // just dethroned walks into the veto meeting and refills the block they
        // no longer own — the twist would take a ceremony rather than a week.
        //
        // Read by `chairAuthority` at the veto ceremony. Secret: it must never
        // reach a surface, which is why the ceremony act declares itself
        // anonymous wherever this is set.
        week.coinAuthority = coin.winner;
      }
      week.coin = {
        winner: coin.winner, calledRight: coin.calledRight,
        buyers: [...coin.buyers], short: [...(coin.short || [])],
        price: coin.price ?? null, dethroned: coin.dethroned || null,
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

  /* THE CEREMONY HAS TO KNOW IT NOMINATED A DUO.
     Without this the screen wrote two separate individual reasons — "there is
     a group in this house and you are in it", then an unrelated grievance
     against the other one — for a block the Head of Household did not choose
     twice. They chose once. The second name came with the first, and a
     ceremony that cannot say so makes the whole twist invisible on the night
     it matters most. */
  let duoNom = null;
  if (week.duoNomination && week.duoNomination.every(n => nominees.includes(n))) {
    const blocks = week.duoBlocks?.length ? week.duoBlocks : [week.duoNomination];
    const wanted = [plan.target, ...(plan.nominees || []), plan.backdoorTarget].filter(Boolean);
    duoNom = {
      pair: [...week.duoNomination],
      blocks: blocks.map(p => [...p]),
      // Which half the Head of Household actually came for. The other one is
      // there because of who they walked in with, and the ceremony has to be
      // able to tell the difference or it invents a grievance for somebody
      // nobody chose.
      targets: blocks.map(p => p.find(n => wanted.includes(n)) || p[0]),
      kins: blocks.map(p => { try { return duoKinLabel(p[0], p[1]); } catch { return ''; } }),
    };
    try { duoNom.kin = duoKinLabel(blocks[0][0], blocks[0][1]); } catch { duoNom.kin = ''; }
  }

  /* ── WHAT BEING PUT UP ACTUALLY COSTS ──
     Until now: nothing. The only fallout from a nomination was for a BROKEN
     PROMISE — put somebody up after shaking on their safety and it cost a deal,
     a bond and a target. Put up somebody you had never promised anything and
     the relationship layer did not move at all, which made the most public act
     in the format free.

     IT IS PRICED IN TRUST, NOT IN CHAIRS. A nomination is only a betrayal to
     the extent there was something to betray: putting up somebody you have
     never spoken to costs a Head of Household almost nothing, and putting up
     the person who has voted with them for six weeks costs them that person.
     So the size of the hit comes from the bond that already existed, and it
     lands on both of them, because bonds here are symmetric — the crown pays
     for what it spends.

     THE PAWN IS NOT IN THIS. Sitting somebody down and asking them to take a
     chair is its own economy and already has one: agreeing earns bond, being
     asked and refusing costs it, being seated after saying no costs more. A
     second charge on top would price the same conversation twice. */
  week.nomFallout = [];
  const askedPawn = week.pawnAsk?.pawn || null;
  for (const nominee of nominees) {
    if (!nominee || nominee === hoh) continue;
    // A broken promise already cost more than this, and worse.
    if ((week.brokenPromises || []).some(b => b.victim === nominee)) continue;
    // The pawn's conversation was already priced. See above.
    if (nominee === askedPawn || (plan.pawn === nominee && plan.target !== nominee)) continue;

    const collateral = duoNom && duoNom.blocks.some((p, i) =>
      p.includes(nominee) && duoNom.targets[i] !== nominee);
    const isTarget = plan.target === nominee || plan.backdoorTarget === nominee;

    let prior = 0, temper = 5;
    try { prior = getBond(nominee, hoh) || 0; } catch { prior = 0; }
    try { temper = pStats(nominee)?.temperament ?? 5; } catch { temper = 5; }
    // Only trust can be betrayed. Somebody who already disliked them has
    // nothing left to lose and reads the chair as confirmation.
    const treason = Math.max(0, prior) / 10;
    const weight = 0.3 + treason * 1.7;
    const takesItHard = 0.6 + (10 - temper) * 0.08;
    // The half nobody chose takes the least — they were told out loud it was
    // not about them — and the target takes the most.
    const base = collateral ? 0.5 : isTarget ? 1.6 : 1.0;
    const hit = -base * weight * takesItHard;
    // Aimed at whoever the house believes named them. Normally that is the Head
    // of Household; under a Deepfake it is somebody who named nobody, and the
    // whole week is spent resenting them for it.
    const blamed = week.hohPublic || hoh;
    try { _cappedBondWindow(() => addBond(nominee, blamed, hit)); } catch { /* no bond, no grievance */ }

    /* AND THE PART THAT ONLY EXISTS IN THIS SEASON.
       You are on that block because of who you walked in with. Somebody wears
       that, and it is not the Head of Household — it is your partner. Loyalty
       decides whether it gets worn quietly. */
    if (collateral) {
      const pairOf = duoNom.blocks.find(p => p.includes(nominee));
      const partner = pairOf?.find(n => n !== nominee);
      let loyal = 5;
      try { loyal = pStats(nominee)?.loyalty ?? 5; } catch { loyal = 5; }
      const strain = -(0.5 + (10 - loyal) * 0.11) * takesItHard;
      if (partner) {
        try { _cappedBondWindow(() => addBond(nominee, partner, strain)); } catch { /* texture */ }
      }
      week.nomFallout.push({ nominee, hoh, hit, partner, strain, treason, kind: 'dragged' });
      continue;
    }

    /* A BETRAYAL BUYS AN ENEMY. THE OTHER KIND BUYS A CHAIR.
       Being nominated by somebody you trusted is what makes a houseguest come
       back for the person who did it — and it takes both halves: enough of a
       relationship to have been broken, and enough game in them to answer it. */
    let bold = 5, strategic = 5;
    try { bold = pStats(nominee)?.boldness ?? 5; strategic = pStats(nominee)?.strategic ?? 5; } catch { /* defaults */ }
    if ((isTarget || treason >= 0.4) && (bold + strategic) / 2 >= 5) {
      try {
        setBBTarget(nominee, hoh, treason >= 0.4
          ? 'looked me in the eye all week and then put me up'
          : 'put me on that block', { week });
        reignMadeAnEnemy(week, nominee);
      } catch { /* the bond hit still stands */ }
    }
    week.nomFallout.push({ nominee, hoh, hit, treason, kind: isTarget ? 'target' : 'nominee' });
  }

  week.acts.push(addBeats({ type: 'nominations', nominees: [...nominees], target: plan.target, pawn: plan.pawn, backdoorTarget: plan.backdoorTarget,
    duo: duoNom, nomFallout: week.nomFallout,
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

  // `week.nominees` is NOT the block — it is written only by the cancelled-
  // eviction branch, which sets it to []. The block as the ceremony left it is
  // `initialNominees`, assigned a few hundred lines above this and rewritten by
  // the Hacker below. Passing the field the brief named would have handed the
  // antagonist an empty list and silenced every `{nominees}` line it owns.
  // `cursed` is the third chair a Den curse seated, and it is the whole reason
  // a Temptation antagonist has anything to say at a nomination ceremony: the
  // person on the block is not the person who accepted anything. It is null in
  // any week nobody took an offer, and every line that names it is walked past.
  _themeSay(week, 'noms', { hoh: week.hohSecret ? null : week.hoh,
    nominees: week.initialNominees || week.nominees || [],
    cursed: week.temptationChair || null });

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
    // The competition result is private. Individual competition writers
    // normally celebrate the winner by name, so publishing their ordinary
    // beats here silently reveals the Hacker before the anonymous powers are
    // even used. Keep the mechanical result for simulation, but replace its
    // public transcript with the only fact the house receives.
    hkComp.beats = [{
      text: 'Each houseguest competes alone. When the final attempt ends, the result is sealed and only the winner is told.',
      players: [], badgeText: 'RESULT SEALED', badgeClass: 'grey',
    }];
    hkComp.text = 'The Hacker competition ends with no public result.';
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

  // ── WHO THEY BLAME, AND WHO ACTUALLY DID IT ──
  //
  // `truth` used to be hard-coded to the Head of Household, because the only
  // anonymous week this engine had was an invisible HOH — the hidden hand and
  // the HOH were the same person. The Coin breaks that: the hand belongs to
  // whoever bought the week, and the HOH is the person it was taken FROM. With
  // the truth still pinned to `hoh`, a houseguest who guessed "correctly" would
  // be pointed at the one person in the house who is provably innocent, and
  // `week.hohGuesses` would record that as a read rather than as a miss.
  const _invisibleGuess = (who, truth = hoh) => {
    week.hohGuesses ||= [];
    const prior = week.hohGuesses.find(g => g.who === who);
    if (prior) return prior.guess;
    const blockNow = week.initialNominees || nominees;
    const candidates = house.filter(n => n !== who && !blockNow.includes(n));
    const st = pStats(who);
    const correct = rng() < Math.min(0.75, 0.22 + st.intuition * 0.05);
    let guess = truth;
    if (!correct) {
      guess = candidates.filter(n => n !== truth)
        .sort((a, b) => getPerceivedBond(who, a) - getPerceivedBond(who, b))[0] || truth;
    }
    week.hohGuesses.push({ who, guess, correct: guess === truth });
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
  // ── AND NOT ON A COIN WEEK EITHER ──
  //
  // This beat reads a block for the shape of the HOH's alliance and says "what
  // ${hoh} just did for them". On a coin week the HOH did not choose a single
  // name on that block — it was taken off them by somebody nobody can identify
  // — so the sentence is false in the one way this project cares most about:
  // it hands the house a confident, wrong answer about who is protecting whom.
  // The coin's own event family already covers a rewritten block.
  if (!hohSecret && !week.coinAuthority) {
    const hohBloc = (gs.namedAlliances || [])
      .filter(a => a.active !== false && !a.dissolved && (a.members || []).includes(hoh))
      .map(a => ({ ...a, inHouse: (a.members || []).filter(m => house.includes(m)) }))
      .filter(a => a.inHouse.length >= 3)
      .sort((a, b) => b.inHouse.length - a.inHouse.length)[0];
    if (hohBloc && !nominees.some(n => hohBloc.inHouse.includes(n))) {
      const nomAct = _lastStagedAct(week) || {};
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
    const nomAct = _lastStagedAct(week) || {};
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

  // ══════════════════════════════════════════════════════════════════
  // THE HIGH ROLLER'S ROOM
  // ══════════════════════════════════════════════════════════════════
  //
  // The door opens HERE and nowhere earlier. The entry decision is a market
  // reading — `entryNeed` returns 1.0 flat for anybody on the block and a
  // fraction of that for everybody else — so the room has to be able to see a
  // block. Opened before the ceremony it would be selling a way off a block
  // nobody was on yet, and every nominee in the house would price it as though
  // they were comfortable.
  //
  // It also sits AFTER the Hacker and after the Battle of the Block, which is
  // deliberate: both of those rewrite the block during the week, and the room
  // is meant to see the block the house is actually looking at.
  //
  // ── THE GAME RUNS NOW; IT LANDS AT THE VETO MEETING ──
  //
  // `openRoom` charges the entries and resolves the Chopping Block Roulette in
  // the same pass — the money has to leave on the way in, and the game is a
  // competition over the whole field, so it cannot be held open. What it
  // produces is two NAMES on the winning entry, and those are applied at the
  // veto ceremony, the way the show played it: the winner used the power at the
  // veto meeting, and the Power of Veto was a separate decision at that same
  // meeting.
  //
  // ── ONCE PER CALENDAR WEEK, NOT ONCE PER CYCLE ──
  //
  // The same gate the BB Bucks payout carries and for the same reason: this
  // takes people's MONEY, and `simulateBBWeek` runs once per cycle. A
  // `week-in-one` double runs its second cycle UNCOMPRESSED, so `!compressed`
  // alone would open the door twice in one night and charge the house twice.
  // `bb-split-house` is refused by the catalogue rather than handled here —
  // one door per calendar week cannot serve two sides of a wall fairly.
  //
  // `!skipVeto` is the third condition and it is not belt-and-braces: an
  // instant eviction has no veto meeting, so a Roulette won on that week could
  // never be spent. The catalogue refuses the pairing too; this is the guard
  // for a season that reaches it another way (`options.skipVeto`).
  if (!compressed && !skipVeto && twists.has('bb-high-rollers-room')
    && (week.segment == null || week.segment === 1)) {
    try {
      // ── THE EXCLUSION SET, BUILT FROM THE CEREMONY'S OWN SOURCES ──
      //
      // Handed to the room, which hands it to the wheel, which uses it to
      // decide who may legally be spun into the replacement chair. `openRoom`
      // defaults this to `[]`, and an empty list here would let the wheel seat
      // a Golden Key holder, a Safety Suite winner, a care-package holder or
      // the half of a duo the crown covers — everybody the nomination ceremony
      // already refused to touch. So it is read off `untouchable`, the list the
      // ceremony itself was built from, plus the pair the Battle of the Block
      // took off the block, which is week-long safety recorded separately.
      const roomSafe = [...untouchable, ...(week.botbSafe || [])].filter(Boolean);
      week.highRollers = openRoom({
        week, house, hoh,
        // The INITIAL block. If the room ever saw a post-veto block the wheel
        // would be taking down a replacement nominee, which is not the rule.
        nominees: [...nominees],
        // Nobody holds a veto yet — the competition has not been played.
        vetoHolder: null,
        protectedNames: roomSafe,
        // WHAT IS ON SALE TONIGHT. The floor runs the cheap table on its first
        // night and the wheel on the two after it — counted off the weeks that
        // have already aired rather than off a flag, so a reloaded save cannot
        // sell the opening game twice.
        // Chosen up where the announcement is written, so the game the house
        // was TOLD about is the game it gets. Deciding it twice is how those
        // two drift apart.
        game: week.roomGame,
        // The week's own seeded generator. A bare Math.random anywhere in here
        // and the same seed stops producing the same house.
        rng,
      });
      if (week.highRollers) {
        week.acts.push(addBeats(week.highRollers,
          { players: (week.highRollers.entries || []).map(e => e.name).slice(0, 4) }));
      }
    } catch {
      // The week runs without the room. Nothing downstream requires it: the
      // ceremony reads `week.highRollers?.entries` and finds nothing.
      //
      // ── THE EXPOSURE THIS CATCH CARRIES, STATED RATHER THAN HIDDEN ──
      //
      // `openRoom` charges on the way in: it calls `spend` and `recordPlay` for
      // every entrant in its first pass, BEFORE the game resolves. So a throw
      // out of the resolver (or anything after the door) lands here with `gs`
      // already mutated — houseguests down 125 with their one seat at that game
      // burned for the season — and this line then deletes the act, so there is
      // no beat, no transcript line and nothing on any screen. The money is
      // gone invisibly, which is worse than a loud failure.
      //
      // Not rolled back, deliberately, and the reason is the room's own rule:
      // the money leaving on the way in is never refunded, and week.js is the
      // wrong place to reverse it anyway — it would need `openRoom` to publish
      // who it charged before it failed, which is new state on `gs` and a new
      // serialisation surface for a branch that cannot fire today (the only
      // resolver on the menu, `rouletteResolver`, has no throwing path). The
      // alternative — synthesising an all-lose night — invents a result nobody
      // played for.
      //
      // If a second game lands on the menu, or the Roulette grows a path that
      // can throw, this stops being theoretical: fix it in `high-rollers-room.js`
      // by making PASS TWO resilient, so the act (and the losses it narrates)
      // survives the resolver rather than being swallowed here.
      week.highRollers = null;
    }
  }

  // ── Instant Eviction: there is no veto, so nominations stand ──
  // The whole middle of the week — the draw, the competition, the ceremony and
  // the two stretches of house life around them — simply does not happen. The
  // pair named by the HOH are the pair the house votes on.
  if (skipVeto) {
    week.vetoWinner = null;
    week.vetoCompetition = null;
    week.finalNominees = [...nominees];
    nominees.forEach(name => gs.bb.stats[name].timesOnTheBlock++);

    // What the locked room actually cost them. Both of these are the twist
    // rather than decoration: one is the house hearing every private reason the
    // Head of Household had, and the other is them finding out an hour too late
    // that they nominated the wrong person and having no ceremony to fix it at.
    let overheard = null;
    let regret = null;
    try { overheard = leakDeliberation(week, house, week.plan, rng); } catch { overheard = null; }
    try { regret = sequesterRegret(week, house, rng); } catch { regret = null; }
    if (overheard) week.sequestered.overheard = overheard;
    if (regret) week.sequestered.regret = regret;

    week.acts.push(addBeats(
      { type: 'instant-eviction', nominees: [...nominees], hoh,
        sequestered: week.sequestered || null, overheard, regret },
      { nominees: [...nominees] }));
  }

  if (!skipVeto) {
    // Veto act — player draw, competition, and lobbying.
    const vetoDraw = drawVetoPlayers(house, hoh, nominees, rng,
      (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } },
      plan?.backdoorTarget || null);
    week.vetoDraw = vetoDraw;
    let vetoPlayers = vetoDraw.players;

    // ── somebody who does not live here takes a spot ──
    //
    // Only usable on the block, per the show, and it buys a BODY in the draw
    // rather than a win — the alumnus still has to beat the room. Read from the
    // franchise's own finished players so the person who walks in is somebody
    // this show actually has.
    let mysteryGuest = null;
    if (!compressed) {
      try {
        // ── from FINISHED seasons, not from this one ──
        //
        // The first version filtered the current cast for anybody not in the
        // house, which is not an alumnus: it is somebody this season evicted
        // three weeks ago, sitting in the jury, who cannot walk back in for an
        // afternoon. The franchise ledger is the record of who has actually
        // played and finished, so the door opens on a real one — with their
        // placement, so the screen can say who it is.
        // ── WHO HAS ACTUALLY PLAYED A SEASON ──
        //
        // The franchise ledger first, and players_database.json — the real
        // record — behind it. NOT the roster, which is a cast list rather than
        // a career: everybody in the franchise is on it, including hosts who
        // have never competed and characters scheduled for a season that has
        // not aired, so the door opened on Chef Hatchet and then on somebody
        // whose debut is still ahead of them.
        //
        // An empty pool means the twist does not fire, which is the correct
        // answer to "who has played a season" in a franchise with no record of
        // anybody having played one.
        let alumni = [];
        try {
          for (const [num, rec] of Object.entries(activeSeasons() || {})) {
            for (const [name, r] of Object.entries(rec?.players || {})) {
              if (house.includes(name)) continue;
              alumni.push({ name, seasonName: rec.seasonName || `Season ${num}`,
                winner: !!r?.winner, finalist: !!r?.finalist, chalWins: r?.chalWins || 0 });
            }
          }
        } catch { /* a franchise with no history has no alumni, and no twist */ }
        if (!alumni.length) {
          // This show's own alumni first. A returning houseguest is a
          // houseguest; somebody out of Total Drama is a crossover, and the two
          // are not the same event. On a first season there are no houseguests
          // to call, which is exactly when the other show is worth having.
          try { alumni = alumniPool({ exclude: house, format: 'big-brother' }); }
          catch { alumni = []; }
        }
        mysteryGuest = playMysteryCompetitor({ week, nominees, players: vetoPlayers, alumni,
          library: competitionLibrary, hoh, house, rng });
        if (mysteryGuest) {
          week.mysteryCompetitor = mysteryGuest;
          week.acts.push(addBeats(mysteryGuest, { players: [mysteryGuest.holder] }));
          // ── THE DRAW ITSELF, which nobody was telling ──
          //
          // Only the local `vetoPlayers` was filtered, and `week.vetoDraw` had
          // already been handed off two dozen lines up. The draw screen reads
          // that record — so it drew the bumped houseguest still holding a
          // chip, listed them as playing, and never showed the guest at all.
          // The audience watched a stranger take somebody's spot on one screen
          // and watched that somebody keep it on the next.
          if (mysteryGuest.displaced) {
            vetoPlayers = vetoPlayers.filter(n => n !== mysteryGuest.displaced);
            vetoDraw.players = (vetoDraw.players || []).filter(n => n !== mysteryGuest.displaced);
            vetoDraw.bumped = mysteryGuest.displaced;
          }
          // The guest is NOT added to the field the engine competes: they are
          // not a houseguest, they have no stats sheet in this cast, and a
          // proxy who could win the medallion outright is a different power
          // from the one the show ran. Their run is scored inside the play and
          // handed to the holder. This is the record the SCREEN needs, so the
          // yard it draws is the yard that was out there.
          vetoDraw.guest = { name: mysteryGuest.guest, for: mysteryGuest.holder,
            displaced: mysteryGuest.displaced || null };
          // ── AND THEY ACTUALLY PLAY IT ──
          //
          // They used to post a number against a par, in a private simulation
          // running alongside the real competition. So the draw listed six
          // players, the competition showed five, and the shelf at the end had
          // no line for the person the whole twist is about. `pStats` falls
          // back to the franchise roster now, which means an alumnus has a real
          // stat sheet and can simply be entered like anybody else.
          vetoPlayers = [...vetoPlayers, mysteryGuest.guest];
        }
      } catch { week.mysteryCompetitor = null; }
    }
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
    // Held back for the veto act, which does not exist yet — the guest's run
    // belongs on the screen that shows the competition, not on the arrival
    // card at the ceremony.
    let pendingGuestBeats = null;
    vetoPlayers = hook(hooks, 'vetoParticipants', vetoPlayers, { week, house, hoh, nominees: [...nominees] }) || vetoPlayers;
    // The guest is the one legal exception. This line exists to stop a hook
    // seating somebody who has been evicted, and it was also throwing out the
    // alumnus one step after they were added — so the draw announced six
    // players and the competition ran five, every time.
    vetoPlayers = [...new Set(vetoPlayers)]
      .filter(name => house.includes(name) || name === mysteryGuest?.guest);
    // ── THE DERBY SLIPS, PLACED ON THE FINAL SIX ──────────────────────
    //
    // HERE and not at the draw, which is where it looks like it belongs. The
    // draw is not the last word on who plays: a mystery guest can bump
    // somebody out of their own chip, the Hacker can swap a name in, and a
    // redraw can replace the field wholesale. A slip written at the draw could
    // therefore back a houseguest who never competes — a bet nobody could win
    // and nobody could lose. This line is the first point at which the six are
    // final, and it is still before a single round is played.
    if (currentTheme()?.economy === 'bb-bucks') {
      try {
        const slots = derbySlotHolders(week).filter(n => house.includes(n));
        week.derbyBets = placeDerbyBets({ week, slots, vetoPlayers: [...vetoPlayers], rng });
        if (week.derbyBets) {
          week.acts.push(addBeats(week.derbyBets,
            { players: week.derbyBets.bets.map(b => b.name).slice(0, 4) }));
        }
      } catch { week.derbyBets = null; }
    }

    const vetoCompetition = runBBCompetition({ type:'veto', participants:vetoPlayers, guest: mysteryGuest?.guest || null, excluded:house.filter(name => !vetoPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.veto, nominees, hoh, seed:options.seed, haveNots: week.haveNots || [] });
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

    // The alumnus played the real thing; the result is read off it rather than
    // invented, and a win belongs to whoever paid for them to be there.
    if (mysteryGuest?.guest) {
      try {
        mysteryCompetitorResult({ act: mysteryGuest, competition: vetoCompetition,
          winner: vetoWinner });
      } catch { /* the competition stands */ }
      // The run, and the goodbye, on the VETO act — where the competition is
      // actually shown. See mysteryCompetitorResult.
      if (mysteryGuest.resultBeats?.length) {
        pendingGuestBeats = mysteryGuest.resultBeats;
      }
      if (mysteryGuest.vetoTo && house.includes(mysteryGuest.vetoTo)) {
        vetoWinner = mysteryGuest.vetoTo;
      } else if (vetoWinner === mysteryGuest.guest) {
        // They won and the person who summoned them is gone: the guest cannot
        // hold a medallion in a house they do not live in.
        vetoWinner = vetoCompetition.placements.find(n => house.includes(n)) || vetoWinner;
      }
    }
    gs.bb.stats[vetoWinner].vetoWins++;
    week.vetoWinner = vetoWinner;
    // ── AND THE SLIPS ARE TURNED OVER ─────────────────────────────────
    //
    // Its own act, pushed after the competition, for the reason the side bet
    // had to learn twice: a settlement written back into the placement act
    // renders on a screen drawn BEFORE the event that decided it, and tells
    // the viewer the result in advance.
    //
    // `derbyHolders` is what the ceremony below reads. A name here holds a
    // veto it never competed for.
    if (week.derbyBets && !week.derbyBets.settled) {
      try {
        const settled = resolveDerbyBets(week.derbyBets, vetoWinner, { rng });
        if (settled) {
          week.derbySettled = settled;
          week.derbyHolders = settled.holders.filter(n => house.includes(n));
          week.acts.push(addBeats(settled,
            { players: settled.results.map(r => r.name).slice(0, 4) }));
        }
      } catch { week.derbyHolders = []; }
    }
    setSpotlight({ vetoWinner, vetoPlayers: [...vetoPlayers] });
    week.vetoCompetition = vetoCompetition;
    recordCompDominance(vetoCompetition, house, week.num);
    const vetoAct = addBeats({ type: 'veto', participants: vetoPlayers,
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
      // The stranger who took one of the drawn seats, so the draw screen can
      // show the swap it was silently not showing.
      guest: vetoDraw.guest || null,
      automatic: vetoDraw.automatic }, { nominees: [...nominees], vetoWinner });
    // After addBeats, which ASSIGNS socialBeats rather than merging. The
    // alumnus's run and their goodbye go here, on the screen that shows the
    // competition, instead of on the arrival card that is drawn at the ceremony
    // — which was opening by telling you the result of a competition you had
    // not watched yet.
    if (pendingGuestBeats) {
      vetoAct.socialBeats = [...pendingGuestBeats, ...(vetoAct.socialBeats || [])];
    }
    week.acts.push(vetoAct);

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
    // The block as it stood BEFORE the medallion moved anybody, which the
    // fallout needs: who was already sitting there is a different grievance
    // from who got seated because of it.
    const preCeremonyBlock = [...nominees];

    // ══════════════════════════════════════════════════════════════════
    // THE CHOPPING BLOCK ROULETTE, SPUN AT THE VETO MEETING
    // ══════════════════════════════════════════════════════════════════
    //
    // Bought in the High Roller's Room the night the nominations went up, and
    // used HERE — before the veto is decided, the way it was played on the
    // broadcast: the winner used it at the veto meeting, and the Power of Veto
    // was a separate decision at the same meeting. So the block the veto holder
    // then reasons about is the post-Roulette block, which is the whole point.
    // Resolved before `shouldUseVeto` for exactly that reason.
    //
    // ── THE WINNER'S OWN SAFETY IS THE HALF THAT IS NEVER CONDITIONAL ──
    //
    // Won it, and three things happen: you are safe, one nominee comes down,
    // and the wheel fills the chair. Only the last two can fail. The catalog
    // `desc`, the twist announcement and the game's own beats all say "safe for
    // the week" out loud, and for one revision the engine wrote down the
    // NOMINEE'S safety and nothing else — so a non-nominee could pay 125, take
    // an ally off the block, and be named as the replacement an hour later by a
    // `chooseReplacement` that had never heard of them. A generated sentence
    // the mechanics do not honour is this codebase's defining bug, and this is
    // the line that stops it: the winner is safe on EVERY branch below.
    //
    // So the entry is looked up on `won` alone rather than on the two names.
    // A win with no legal chair to fill (`NO CHAIR TO FILL` in the game) carries
    // `removed: null, replacement: null` and would otherwise have been skipped
    // entirely, taking the winner's safety with it.
    const _roulette = (week.highRollers?.entries || []).find(e => e && e.won);
    if (_roulette) {
      const winner = _roulette.name;
      const down = _roulette.removed;
      const up = _roulette.replacement;
      // The safety half, first and unconditionally. Guarded on `house` only
      // because a name that is not playing cannot be protected from anything.
      const rouletteSafe = house.includes(winner) ? [winner] : [];

      // The block half. Everything here is the ceremony checking the two names
      // are still legal — the block can have moved since the room closed (a
      // Hacker hack, a Battle of the Block collapse) and a name that has
      // stopped being legal is not forced through.
      //
      // Every one of these is a real condition and none of them is paranoia.
      // `gs.bb.stats[up]` last, because it is the one that kills a season: an
      // undefined name reaching `timesNominated++` throws out of the whole week.
      const legal = !!down && !!up
        && down !== up
        && nominees.includes(down)
        && house.includes(up) && !nominees.includes(up)
        && up !== hoh && up !== vetoWinner
        && !untouchable.includes(up)
        && !(week.botbSafe || []).includes(up)
        && !!gs.bb.stats[up];
      if (legal) {
        nominees = nominees.map(name => (name === down ? up : name));
        gs.bb.stats[up].timesNominated++;
        // Every other route off the block records the save — the veto, the
        // mystery veto, the Block Buster, the emptied America's chair. The
        // wheel is a route off the block, so it records one too; without it a
        // career record under-counts and anything reading `timesSaved` is
        // looking at a save that never happened.
        if (gs.bb.stats[down]) gs.bb.stats[down].timesSaved++;
        // ── AND SAFE FOR THE REST OF THE WEEK, NOT FOR THIS CEREMONY ──
        //
        // Canon, and the difference between this and the Hacker's stay of
        // execution: a houseguest the hacker takes down can be put straight
        // back up, and a houseguest the wheel takes down cannot. Recorded on
        // the week so every replacement chooser that runs after this point
        // reads it — without it the veto's own chooser can re-seat them, and
        // the power a houseguest paid 125 for buys nothing at all.
        if (!rouletteSafe.includes(down)) rouletteSafe.push(down);
        week.rouletteSwap = { winner, down, up };
        // The block as the wheel left it, for the transcripts and the tests.
        week.rouletteBlock = [...nominees];
        setSpotlight({ nominees: [...nominees] });
        revise('noms', { hoh, nominees: [...nominees] });
      } else if (down || up) {
        // The wheel won and the names stopped being spendable. Recorded rather
        // than swallowed: somebody paid for this, and a viewer is owed the fact
        // that it could not be used.
        //
        // NOT an edge case, which is why the safety above is set outside this
        // branch: the wheel spins BEFORE the veto competition is played, so any
        // spun replacement who then goes and wins the veto voids the whole
        // block change. The winner keeps what they bought regardless.
        week.rouletteVoid = { winner, down, up };
      }

      // ── THE NO-CHAIR CORNER, AND WHY THE BLOCK IS RIGHT TO NOT MOVE ──
      //
      // A winner who was ALREADY a nominee and whose week hits the game's
      // `NO CHAIR TO FILL` branch stays on the block. `runRoulette` returns
      // early there, BEFORE `chooseRemoval`, so the self-removal that function
      // performs for a nominee-winner never runs; and `rouletteSafe` cannot
      // rescue them, because it is read by replacement choosers and does
      // nothing for a name already sitting in a nominee slot.
      //
      // Emptying the chair instead — the way BB15's America's Nominee does a
      // few lines down — was implemented and MEASURED, and this engine will not
      // take it. `resolveBBCampaignAct` (js/bb/shared-strategy.js:1251) throws
      // `A Big Brother campaign requires at least two nominees.` and takes the
      // whole episode with it: 21 of 120 seeded runs across house sizes 4, 5
      // and 6 died there, none of them reaching a vote. America's Nominee never
      // trips it because it empties a chair off a block of THREE and lands on
      // two; this path would empty one off a block of two and land on one.
      // A legal one-name block is a real engine slice — campaign, vote and
      // majority over a single nominee are all undefined today — and it is
      // recorded as one rather than smuggled in here.
      //
      // So the block does not move, and the COPY was narrowed to match: the
      // catalog `desc`, the twist announcement and the game's WON and NO_CHAIR
      // beats now state what a win actually grants — no replacement chair may
      // be filled with the winner's name, the removal and the spin happen only
      // when there is a legal name to land on, and a nominated winner on a
      // no-chair week stays nominated. `tests/bb-high-rollers-room.test.js`
      // pins the invariant that forced the call.
      week.rouletteSafe = [...new Set(rouletteSafe)];
    }

    // ══════════════════════════════════════════════════════════════════
    // THE DERBY'S VETO GOES FIRST
    // ══════════════════════════════════════════════════════════════════
    //
    // Canon, and the whole reason the Derby is worth building: "Whoever won
    // their Veto through the bet would make their decision FIRST, and the HoH
    // would name a replacement if it was used. From there, whoever won their
    // Veto through the competition then made their decision and could
    // potentially force the HoH to nominate a replacement A SECOND TIME."
    //
    // So a Head of Household can lose two nominees in one meeting and have to
    // refill the block twice, which is the only week in this game where that
    // can happen.
    //
    // Written as a step BEFORE the ordinary ceremony rather than as a second
    // pass through it: the block below already knows how to run one holder,
    // and the Roulette a few dozen lines up already rewrites the block ahead
    // of it. This mirrors that shape, with the same legality guards, and the
    // ordinary ceremony then runs unchanged on whatever block this leaves.
    const derbySafe = [];
    // A holder who ALSO won the competition holds two vetoes and has one
    // decision worth making — running them twice would let one person save two
    // people, which is not what backing a winner buys.
    const derbyHolder = (week.derbyHolders || [])
      .find(n => house.includes(n) && n !== vetoWinner) || null;
    if (derbyHolder) {
      const d = shouldUseVeto(derbyHolder, nominees, plan, rng,
        { hoh, house, diamond: false, hohSecret });
      if (d?.use && nominees.includes(d.save)) {
        // The chair is the Head of Household's to refill, always — the bet
        // bought a veto, not a pen.
        const protectedNow = [hoh, vetoWinner, derbyHolder, d.save,
          ...(week.botbSafe || []), ...(week.rouletteSafe || []), ...(week.derbySafe || []), ...untouchable,
          ...nominees.filter(n => n !== d.save)].filter(Boolean);
        const up = chooseReplacement(hoh, house, protectedNow, plan, rng);
        // Same chain the wheel uses, ending on `gs.bb.stats[up]` — an undefined
        // name reaching that is a dead season and has killed a real one.
        const legal = !!up && house.includes(up) && !protectedNow.includes(up)
          && !!gs.bb.stats[up];
        if (legal) {
          nominees = nominees.map(n => (n === d.save ? up : n));
          gs.bb.stats[up].timesNominated++;
          if (gs.bb.stats[d.save]) gs.bb.stats[d.save].timesSaved++;
          derbySafe.push(d.save);
          week.derbyVeto = { holder: derbyHolder, saved: d.save, replacement: up,
            why: d.why || '' };
          setSpotlight({ nominees: [...nominees] });
          revise('noms', { hoh, nominees: [...nominees] });
        } else {
          // Nobody legal left to seat. Same rule the ordinary ceremony already
          // applies to itself: the medallion stays in the box and the block
          // does not move, rather than emptying a chair the engine cannot
          // refill — `resolveBBCampaignAct` throws on a block of one.
          week.derbyVetoVoid = { holder: derbyHolder, saved: d.save };
        }
      } else {
        week.derbyVetoUnused = { holder: derbyHolder };
      }
    }
    // Read by every replacement chooser that runs after this point, so the
    // second holder cannot put back the person the first one took down.
    week.derbySafe = [...new Set(derbySafe)];

    // ── WHO THE VETO HOLDER IS AFRAID OF CROSSING ──
    //
    // `shouldUseVeto` prices the anger of the person whose week gets undone,
    // and halves it on an invisible week because the holder cannot name who
    // they would be crossing. A coin week is exactly that and was not being
    // treated as one: found by reading a real backlog, where the veto holder
    // weighed "using it makes an enemy of Eva" about a Head of Household the
    // whole house had watched lose the block to somebody else. Nobody in that
    // room believed Eva chose those two, so nobody should have been pricing
    // her temper.
    const coinChair = week.coinAuthority && house.includes(week.coinAuthority)
      ? week.coinAuthority : null;
    const anonymousChair = hohSecret || !!coinChair;
    let vetoDecision = shouldUseVeto(vetoWinner, nominees, plan, rng,
      { hoh, house, diamond, hohSecret: anonymousChair });
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
    // The Coin sits under both of the exceptions above and over the Head of
    // Household, which is the order the rules give it. A Diamond holder and a
    // Roadkill chair are both won THIS week for THIS ceremony and neither was
    // ever the HOH's to fill; the Coin only replaces the HOH, so it takes the
    // pen exactly where the HOH would have held it. `house.includes` because a
    // holder who has left the house cannot name anybody, and `chooseReplacement`
    // on a name that is not there is a dead season.
    const chairAuthority = diamond ? vetoWinner
      : (roadkillChair ? week.roadkill.winner : (coinChair || hoh));
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
      && !house.some(n => n !== hoh && n !== vetoWinner && !nominees.includes(n)
        // The wheel's rescue is week-long safety, so they are not one of the
        // bodies that makes the chair fillable either.
        && !(week.rouletteSafe || []).includes(n) && !(week.derbySafe || []).includes(n))) {
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
      /* A GOLDEN KEY IS SAFETY FROM EVICTION, NOT FROM ONE CEREMONY.
         The wiki: a key "guaranteed this houseguest a spot in the top ten and
         immunity from all challenges and eviction". The nomination ceremony
         honoured that because it reads `untouchable`; this list is built
         separately and did not carry it, so a key holder could be seated in
         the replacement chair and voted out the same night — reported from a
         real season, one week after being handed the key. The crown's cover
         for a Head of Household's partner goes in for the same reason. */
      /* AND THE NOMINEE THE WHEEL TOOK DOWN.
         The Chopping Block Roulette's rule, and the one thing that makes the
         power worth 125: the houseguest it takes off the block is safe for the
         REST of the week and cannot be seated in the replacement chair. Without
         the name on this list the chooser can put them straight back up an hour
         later, which is the shape of gap this codebase has shipped before —
         the Golden Key holder two comments down was exactly it. */
      // `coinChair` is in here for the same reason `hoh` is: a Head of
      // Household cannot be renominated, and for this week that is who the coin
      // holder is. Without it `chooseReplacement` can hand the holder the pen
      // and have them write their own name — and the dethroned HOH stays in the
      // list too, because canon leaves them safe for the week they lost.
      const protectedNames = [hoh, coinChair, vetoWinner, vetoDecision.save, ...(week.botbSafe || []), ...(week.rouletteSafe || []), ...(week.derbySafe || []), carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite), ...keySafe, ...duoCrownSafe, ...nominees.filter(name => name !== vetoDecision.save)].filter(Boolean);
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
      /* NOBODY ELIGIBLE MEANS NOBODY ELIGIBLE.
         There is a guard above for the empty chair, but it only counts the
         Head of Household, the veto winner and the current nominees — every
         other week-long protection (a Golden Key, the crown's cover for a
         partner, Super Safety, a care package) is invisible to it, so a house
         where all of those overlap returned no replacement at all and the next
         line read `timesNominated` off undefined. Crashed a real season the
         moment key holders became genuinely untouchable.
         The rule is the one the ceremony already has for this: if the chair
         cannot be filled, the veto is not used and the block stands. */
      if (!replacement || !gs.bb.stats[replacement]) {
        vetoDecision = { use: false, save: null, reason: 'no-replacement',
          why: `${vetoWinner} could take ${vetoDecision.save} down, but every houseguest left is `
            + `protected this week and there is nobody to put in the empty chair. The rules make `
            + `the decision: the medallion stays in the box.` };
        replacement = null;
        replacementWhy = '';
      } else {
      replacementWhy = explainReplacement(chairAuthority, replacement,
        house.filter(n => !protectedNames.includes(n)), chooserPlan, nominees);
      nominees = nominees.map(name => name === vetoDecision.save ? replacement : name);
      gs.bb.stats[vetoDecision.save].timesSaved++;
      gs.bb.stats[replacement].timesNominated++;
      /* A DUOS SEASON: THE VETO SAVES THE PAIR.
         The wiki's rule, which this used to cancel every time somebody won the
         veto — one nominee saved, one stranger seated, and a block that stopped
         being a duo halfway through the week. Runs after the ordinary swap so
         the replacement the week already reasoned about is the first name
         considered for the new pair. */
      if (duosActive() && !duoWeekActive(week)) {
        try {
          const swapped = duoReplacementBlock({ nominees, saved: vetoDecision.save, house, plan, hoh, rng,
            replacement, protectedNames: [...protectedNames, replacement] });
          if (swapped) {
            nominees = [...swapped.nominees];
            week.duoVetoSwap = { down: swapped.down, up: swapped.up };
            // The vote is counted against THESE pairs, so the record follows
            // the wall rather than remembering the ceremony.
            if (week.duoBlocks) {
              week.duoBlocksFinal = week.duoBlocks
                .filter(p => !p.some(n => swapped.down.includes(n)))
                .concat([[...swapped.up]]);
            }
            // The other half was saved too, by the rule rather than by the medallion.
            for (const name of swapped.down) {
              if (name !== vetoDecision.save) gs.bb.stats[name].timesSaved++;
            }
            // The single replacement the ordinary ceremony seated never made it
            // onto the wall, so it does not keep the nomination it was credited.
            if (replacement && !swapped.up.includes(replacement)) {
              gs.bb.stats[replacement].timesNominated =
                Math.max(0, (gs.bb.stats[replacement].timesNominated || 1) - 1);
            }
            for (const name of swapped.up) {
              if (name !== replacement) gs.bb.stats[name].timesNominated++;
            }
          }
        } catch { /* the block stands as the ordinary ceremony left it */ }
      }

      /* YOU GO, THEY GO: you cannot half-save a duo.
         Saving one of them takes the other one down too — a lone nominee this
         week would be playing a different game from the three beside them — so
         the chair's owner names a whole replacement PAIR. Runs after the
         ordinary swap so the replacement the week already reasoned about is
         one half of the new duo wherever the pairing allows it. */
      if (duoWeekActive(week)) {
        try {
          const swapped = duoWeekAfterVeto(week, { nominees, saved: vetoDecision.save,
            house, protectedNames: [...protectedNames, replacement], rng });
          if (swapped) {
            nominees = [...swapped.nominees];
            week.duoWeekVeto = { down: swapped.down, up: swapped.up };
            for (const name of swapped.down) {
              if (name !== vetoDecision.save) gs.bb.stats[name].timesSaved++;
            }
            for (const name of swapped.up) {
              if (name !== replacement) gs.bb.stats[name].timesNominated++;
            }
          }
        } catch { /* the block stands as the ordinary ceremony left it */ }
      }
      // Being pulled off the block is the clearest debt the game can create,
      // and the writer for it existed unused — obligation was empty across
      // entire seasons while the veto decision was busy READING it. Saving
      // yourself creates no debt to anybody.
      // Moved into applyVetoFallout with everything else the ceremony costs —
      // it used to be the ONLY consequence in the whole ceremony.
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
    // ── THE BUY-OFF ──────────────────────────────────────────────────
    //
    // BB27's premiere prize. The holder won ten thousand dollars in public and
    // was privately told what it was really for: if they are a final nominee,
    // they hand the money to the Head of Household and come off the block, and
    // the Head of Household CANNOT REFUSE and must name a replacement on the
    // spot.
    //
    // Every other save in this game is used on you or by you. This one is done
    // TO the person in charge, in front of the room, and it is the only reason
    // it is worth having: the week does not just change, somebody's authority
    // is publicly overruled by a cheque.
    //
    // Spent as late as it can be — after the veto has settled the block —
    // because a nominee who was going to come down anyway should not waste it.
    try {
      const bo = activePowerAt('veto-ceremony', week.num, 'buy-off');
      if (bo && nominees.includes(bo.holder) && house.includes(bo.holder)) {
        const pool = house.filter(n => n !== hoh && n !== vetoWinner && !nominees.includes(n));
        if (pool.length) {
          // The Head of Household names the replacement, with no time to think
          // — so it is the person they liked least of whoever is left.
          const replacementUp = pool.slice().sort((a, b) => {
            let ba = 0; let bb = 0;
            try { ba = getPerceivedBond(hoh, a); } catch { ba = 0; }
            try { bb = getPerceivedBond(hoh, b); } catch { bb = 0; }
            return ba - bb;
          })[0];
          const at = nominees.indexOf(bo.holder);
          nominees.splice(at, 1, replacementUp);
          usePower(bo, week.num);
          week.buyOff = { holder: bo.holder, hoh, replacement: replacementUp, amount: 10000 };
          // A `power-played` act, not an invented one. This game already has a
          // shared screen and a transcript line for "somebody spent a power",
          // and every power in the shelf arrives through it — a bespoke act
          // type here would have been a second way to say the same thing, with
          // its own page, in a house where every other power looks alike.
          week.acts.push(addBeats({
            type: 'power-played', powerId: 'buy-off', holder: bo.holder,
            name: BB_POWER_DEFINITIONS['buy-off'].name, timing: 'veto-ceremony',
            secret: bo.visibility === 'secret', visibility: bo.visibility,
            removed: [bo.holder], seated: [replacementUp], nominees: [...nominees],
            detail: `${bo.holder} pays ${hoh} ten thousand dollars to come off the block, and `
              + `${hoh} has no say in it — ${replacementUp} goes up in their place, named on the `
              + 'spot in front of the room.',
            hoh, replacement: replacementUp, amount: 10000,
            beats: [{
              text: `${bo.holder} does not ask. The envelope goes across the table to `
                + `${hoh}, and the ten thousand dollars everybody watched `
                + `${bo.holder} win turns out to have been a key all along. ${bo.holder} steps off `
                + `the block; ${hoh} has to put ${replacementUp} up in their place `
                + `with the room watching and no say in it.`,
              players: [bo.holder, hoh, replacementUp],
              badgeText: 'BOUGHT OFF THE BLOCK', badgeClass: 'gold',
              eventId: 'buy-off-played', category: 'power', location: 'living-room',
            }],
          }, { players: [bo.holder, hoh, replacementUp] }));
          // Being overruled in public costs the Head of Household, and the
          // replacement did not volunteer.
          try { addBond(hoh, bo.holder, -2.4); } catch { /* fine */ }
          try { addBond(replacementUp, bo.holder, -2.8); } catch { /* fine */ }
        }
      }
    } catch { /* the block stands as the ceremony left it */ }

    const blockAfterCeremony = [...nominees];

    // ── a second veto, with one player in it ──
    //
    // Decided here, where the block has just settled, and SHOWN after the
    // ceremony — see below. Usable whether or not the holder is a nominee, per
    // the show, which is what makes it more than a self-save: it can take
    // somebody off a block everybody had stopped thinking about.
    let solo = null;
    if (!compressed) {
      try {
        solo = playMysteryVeto({ week, nominees, house, rng,
          // The same library the week's own competitions come from, so what
          // gets played alone is a competition this season actually has.
          library: competitionLibrary });
      } catch { solo = null; }
    }

    let coupAct = null;
    const coup = (gs.bb?.powers || []).find(pw => pw.powerId === 'coup-d-etat'
      && !pw.used && !pw.disposed && week.num <= pw.expiresAfterWeek
      && house.includes(pw.holder));
    if (coup) {
      const protectedNow = [hoh, vetoWinner, coup.holder, carePackageProtects(week.carePackage), ...safetySuiteSafe(week.safetySuite)].filter(Boolean);
      const eligible = house.filter(n => !protectedNow.includes(n));
      // ── whether, before who ──
      //
      // This had no decision in it whatsoever: `if (coup)` and then straight to
      // `usePower`. The loudest power in the game fired the first legal minute
      // it existed, on whatever block happened to be sitting there — so a
      // fortnight-long window was always spent on week one, and a holder whose
      // own alliance was nowhere near the block detonated it anyway and bought
      // themselves two new enemies and a dethroned Head of Household for
      // nothing. The whole tension the two-week window was written for (the
      // house knowing it exists and not knowing who has it) never happened once.
      //
      // The one power on the shelf that can empty a block ought to ask who is
      // standing on it.
      const cst = pStats(coup.holder) || {};
      const coupNeed = nominees.includes(coup.holder) ? 0.98
        : Math.max(0, ...nominees.map(n => {
          try { return allyStake(coup.holder, n); } catch { return 0; }
        }), 0);
      const coupPull = spendPull({ need: coupNeed,
        weeksLeft: Math.max(0, coup.expiresAfterWeek - week.num),
        nerve: (cst.boldness || 5) / 10,
        // Replacing the whole block in front of everybody is the loudest thing
        // anybody can do, whatever the instance calls itself.
        exposes: true });
      if (eligible.length >= 2 && rng() < coupPull) {
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

    // ── WHAT IT COST ──
    //
    // One line lived here before: a debt recorded when somebody was saved. Not
    // using it cost nothing, being seated as the replacement cost nothing, and
    // a Head of Household could watch their target walk off the block with no
    // consequence at all. See veto-fallout.js.
    let vetoFallout = { beats: [], damage: 0, resented: [] };
    try {
      vetoFallout = applyVetoFallout({ week, holder: vetoWinner, decision: vetoDecision,
        priorBlock: preCeremonyBlock, nominees: [...nominees], replacement,
        hoh, plan, house, rng });
    } catch { /* the ceremony stands whatever the fallout does */ }
    week.vetoFallout = { damage: vetoFallout.damage, resented: [...vetoFallout.resented] };

    const vetoCeremonyAct = addBeats({ type: 'veto-ceremony', used: !!vetoDecision.use,
      // A DUOS VETO TAKES TWO OFF AND PUTS TWO ON. Without these the ceremony
      // screen stamped one face and drew one replacement for a decision that
      // moved four people, so the twist's own rule was invisible at the
      // ceremony that enforces it.
      duoDown: week.duoVetoSwap ? [...week.duoVetoSwap.down] : null,
      duoUp: week.duoVetoSwap ? [...week.duoVetoSwap.up] : null,
      // The ordinary ceremony seats ONE stand-in and the duo rule then throws
      // that name away for a whole pair. The screen was still announcing the
      // discarded one — "Julia, take a seat" on a week whose replacements were
      // Priya and Raj — so the name it reads out comes from the wall, not from
      // the step that got overruled.
      replacementNames: week.duoVetoSwap ? [...week.duoVetoSwap.up] : (replacement ? [replacement] : []),
      // THE WHEEL, CARRIED ON THE ACT THAT SPENDS IT.
      //
      // The Roulette is won in the High Roller's Room two days earlier and
      // lands HERE — this is the meeting where the block moves. `summariseWeek`
      // is handed the week and can read `week.rouletteSwap` for itself, but the
      // text backlog and the viewing party are both built from the EPISODE and
      // only ever see acts, so the outcome has to ride on one. Copied the same
      // way `duoDown`/`duoUp` above copy the duo swap, and for the same reason.
      //
      // Deliberately NOT `week.rouletteSafe`: that list holds the winner as
      // well as the rescued nominee, and a writer reading it as "who came
      // down" names one person too many.
      roulette: week.rouletteSwap ? { ...week.rouletteSwap } : null,
      rouletteVoid: week.rouletteVoid ? { ...week.rouletteVoid } : null,
      saved: vetoDecision.save, replacement, holder: vetoWinner,
      // A coin week is an anonymous week. The act carries `chairAuthority` so
      // the Diamond Veto can say who named a replacement — under the Coin that
      // is the one fact the house must never be given, so the flag that hides
      // it covers both cases.
      diamond, chairAuthority, anonymous: (hohSecret || !!coinChair) && !diamond,
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
        saved: vetoDecision.save || null, replacement, used: !!vetoDecision.use });
    // AFTER addBeats, never inside it. `addBeats` ASSIGNS `act.socialBeats`
    // from the ambient event library — it does not merge — so handing the
    // fallout in on the object literal wrote it and then threw it away one line
    // later, which is the same written-and-unreachable shape as the rest of
    // this week's bugs. The ceremony's own consequences go first; the ambient
    // house beats follow them.
    vetoCeremonyAct.socialBeats = [...vetoFallout.beats, ...(vetoCeremonyAct.socialBeats || [])];
    week.acts.push(vetoCeremonyAct);

    // ── WHAT THE VETO ITSELF DID, RECORDED RATHER THAN INFERRED ──
    //
    // Nothing wrote this down, so everything downstream worked it out by
    // diffing initialNominees against finalNominees: if a name left the block,
    // the veto must have taken it off. It must not. A Coup d'Etat replaces the
    // whole block and a detonated Diamond takes somebody down on its holder's
    // authority, and neither has anything to do with the person who won the
    // veto — who, on those weeks, gets told in front of the house that they
    // are "now a person who makes moves" for a move they declined to make.
    //
    // The ceremony knows the truth and passes it to its own act already. This
    // puts it somewhere the acts AFTER the ceremony can read it too, which is
    // where the fallout events live.
    week.vetoUsed = !!vetoDecision.use;
    week.vetoSaved = vetoDecision.save || null;
    week.vetoReplacement = replacement || null;
    // A duos veto takes two down and puts two up, so the single name is not
    // the whole story on those weeks.
    week.vetoSavedAll = week.duoVetoSwap ? [...week.duoVetoSwap.down]
      : (vetoDecision.save ? [vetoDecision.save] : []);
    revise('veto', { hoh, nominees: [...blockAfterCeremony], vetoWinner,
      saved: vetoDecision.save || null });

    _themeSay(week, 'veto', { hoh: week.hohSecret ? null : week.hoh,
      nominees: week.finalNominees || week.nominees || [],
      veto: vetoWinner || null, cursed: week.temptationChair || null });
    // ── AFTER the ceremony, because it happens after the ceremony ──
    //
    // Pushed where it was computed, it rendered BEFORE the veto meeting it
    // comes after — and its second ceremony rendered as a full `veto-ceremony`
    // act, so the viewer got the same meeting twice, speeches and all, before
    // the first one had been shown. Third time this file has taught the same
    // lesson: acts render in push order, and where a thing is decided is not
    // where it happened.
    if (solo) {
      week.mysteryVeto = solo;
      week.acts.push(addBeats(solo, { players: [solo.holder] }));
      if (solo.won && solo.saves && nominees.includes(solo.saves)) {
        /* THE SECOND VETO OBEYS THE SAME RULES AS THE FIRST.
           The chair was filled with `pool[Math.floor(rng() * pool.length)]` — a
           name out of a hat, from a pool that knew about the Head of Household
           and the holder and NOTHING else. Not the nomination plan, not Super
           Safety, not a care package, not a Golden Key, not the crown's cover
           for a partner. So a power that fires after everybody has gone to bed
           could seat somebody the ceremony three hours earlier was forbidden
           from seating, and the name it produced looked random because it was.
           It uses `chooseReplacement` against the week's real protections now,
           exactly like every other chair in the format. */
        const takenDown = [solo.saves];
        // And in a Duos season it takes the pair, because that is what a veto
        // does to a duo — the same rule the first ceremony already follows.
        let duoPartnerDown = null;
        try {
          if (duosActive()) {
            const p = partnerOf(solo.saves, house);
            if (p && nominees.includes(p)) { duoPartnerDown = p; takenDown.push(p); }
          }
        } catch { duoPartnerDown = null; }

        nominees = nominees.filter(n => !takenDown.includes(n));
        week.mysteryVetoSaved = solo.saves;
        if (duoPartnerDown) week.mysteryVetoDuoDown = [...takenDown];

        // ── SAFE IS SAFE FOR THE WEEK, NOT UNTIL THE NEXT CEREMONY ──
        //
        // Whoever the FIRST veto took down was missing from this list, and they
        // are not in `nominees` either — the ceremony replaced them there. So
        // when a second veto emptied a chair, the houseguest who had already
        // saved themselves that same week was eligible to be put straight back
        // into it. That is not a rule anywhere: a veto save is safety for the
        // week, and a second veto ceremony does not reopen it.
        //
        // Read off the week's own record rather than the ceremony's local
        // variable, so a duos week — which takes a whole pair down — protects
        // both of them and not just the one whose name was announced.
        const savedByFirstVeto = week.vetoUsed
          ? ((week.vetoSavedAll || []).length ? week.vetoSavedAll
            : [week.vetoSaved].filter(Boolean))
          : [];
        const protectedNames2 = [hoh, solo.holder, ...takenDown, ...nominees,
          ...savedByFirstVeto, ...untouchable, ...(week.rouletteSafe || []), ...(week.derbySafe || [])].filter(Boolean);
        let seated2 = [];
        try {
          if (duoPartnerDown) {
            // A whole duo came down, so a whole duo goes up.
            const up = duoBlock({ plan, house, hoh, rng, protectedNames: protectedNames2 });
            if (up) seated2 = [...up];
          }
          if (!seated2.length) {
            const one = chooseReplacement(hoh, house, protectedNames2, plan, rng);
            if (one && house.includes(one) && !protectedNames2.includes(one)) seated2 = [one];
          }
        } catch { seated2 = []; }

        const replacement2 = seated2[0] || null;
        if (seated2.length) {
          nominees = [...nominees, ...seated2];
          week.mysteryVetoReplacement = replacement2;
          week.mysteryVetoSeated = [...seated2];
          for (const n of seated2) {
            try { gs.bb.stats[n].timesNominated++; } catch { /* record only */ }
          }
        }
        for (const n of takenDown) {
          try { gs.bb.stats[n].timesSaved++; } catch { /* record only */ }
        }
        // Its OWN act, not a second `veto-ceremony`. Reusing that type replayed
        // the whole meeting — the speeches, the pleading, the adjournment —
        // for a scene that is four sentences long and happens after everybody
        // has already gone to bed.
        week.acts.push(addBeats({
          type: 'second-veto-ceremony', holder: solo.holder, saved: solo.saves,
          replacement: replacement2, nominees: [...nominees],
          // What MOVED, which is not the same as the block. The power screen
          // was reading `nominees` as "named instead" and printing the whole
          // wall, and `removed` was never set at all, so it drew a dash.
          removed: [...takenDown], seated: [...seated2],
          duoDown: duoPartnerDown ? [...takenDown] : null,
          duoUp: duoPartnerDown && seated2.length === 2 ? [...seated2] : null,
          powerId: 'mystery-veto', name: 'The Mystery Veto',
          timing: 'veto-ceremony', visibility: 'secret', secret: true,
          detail: `${solo.holder} used a veto nobody knew existed, after the meeting had ended.`,
          beats: [
            { text: 'The house is called back into the living room. Nobody has been told why, and '
                + 'the veto meeting finished hours ago.',
              players: [...house].slice(0, 5), badgeText: 'CALLED BACK', badgeClass: 'gold' },
            { text: `${solo.holder} is holding a second veto. ${takenDown.join(' and ')} `
                + `${takenDown.length > 1 ? 'come' : 'comes'} off a block the whole house had `
                + 'already accepted, and every plan made since the last meeting was made about a '
                + 'block that no longer exists.',
              // Deduped: on a self-save the holder and the person coming down
              // are the same houseguest, and the card drew their face twice
              // side by side. Exactly the fault the Halting Hex was fixed for,
              // repeated here because the fix lived in the Hex rather than in
              // anything shared.
              players: [...new Set([solo.holder, ...takenDown])], badgeText: 'USED AGAIN', badgeClass: 'gold' },
            ...(duoPartnerDown ? [{
              text: `${duoPartnerDown} was never the point. The rule takes the pair, and it takes `
                + 'it at one in the morning with nobody in the room expecting it.',
              players: [duoPartnerDown], badgeText: 'THE PAIR GOES TOO', badgeClass: 'blue',
            }] : []),
            ...(seated2.length ? [{
              text: `${hoh} has to fill ${seated2.length > 1 ? 'two chairs that were' : 'a chair that was'} `
                + `settled an hour ago. "${seated2.join(', ')} — take a seat."`,
              players: [...new Set([hoh, ...seated2])], badgeText: 'AND ONE MORE', badgeClass: 'red',
            }] : [{
              text: `Nobody in this house is eligible to fill the chair, so it stays empty and the `
                + 'block is simply smaller than it was an hour ago.',
              players: [hoh], badgeText: 'AN EMPTY CHAIR', badgeClass: 'red',
            }]),
          ],
        }, { players: [...new Set([solo.holder, ...takenDown, ...seated2])].filter(Boolean) }));
      }
    }


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
      // Same rule, same reason — see the note on the first veto's chair.
      const protectedNames = [hoh, vetoWinner, extra.holder, dec.save, ...keySafe, ...duoCrownSafe, ...savedThisWeek,
        ...(week.rouletteSafe || []), ...(week.derbySafe || []),
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
      // On an invisible week nobody's voice said the name, so the grievance
      // lands on the replacement's own guess — right or wrong. A coin week is
      // exactly that case: the block moved and the hand did not show. Miss this
      // and the whole twist inverts, because the fallout writes the holder's
      // name into the transcript as the person who renominated you.
      const namer = ((hohSecret || coinChair) && !diamond)
        ? _invisibleGuess(replacement, coinChair || hoh) : chairAuthority;
      const ceremonyAct = _lastStagedAct(week);
      const mentioned = !ceremonyAct
        || (ceremonyAct.socialBeats || []).some(b => (b.players || []).includes(replacement));
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

    // Same snapshot problem as the eviction write below — see the note there.
    gs.activePlayers = [...house, ...(gs.activePlayers || []).filter(n => !house.includes(n))]
      .filter(name => name !== departure.name);
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
  // `week.rewound` wins: the reign was erased, so there is no outgoing Head of
  // Household to bar from next week's competition. Without this the line below
  // would hand the crown straight back to somebody the twist just took it from,
  // one screen after telling the house they were never crowned.
  // ── A DETHRONED HEAD OF HOUSEHOLD IS NOT AN OUTGOING ONE ──
  //
  // `outgoingHoh` is what bars somebody from the next competition, and it has
  // always carried two exemptions for people who did not get the reign it is
  // recording — an invisible HOH and a rewound week. A coin week is a third of
  // exactly that kind. Canon is explicit that the dethroned HOH stays safe and
  // competes in the next Head of Household; without this we take their week
  // AND the chance to win it back, which is a punishment nothing in the rules
  // asks for and which no surface ever explains to the viewer.
  gs.bb.outgoingHoh = (week.hohSecret || week.rewound || week.coinDethroned) ? null : hoh;
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

    // ── THE CHEAP TABLE ───────────────────────────────────────────────
    //
    // Opens with the FIRST campaign act, because that is when a houseguest has
    // formed an opinion about Thursday and before anybody knows whether it is
    // right. The money leaves now; `settleSideBets` pays out after the vote.
    //
    // `campaignIndex === 0` is load-bearing and was learned the hard way: this
    // block sits inside a loop that runs a campaign act several times a week,
    // so without it the table opened three times in one episode, took three
    // stakes for one opinion, and only the last one was ever settled — the
    // other two took the money and never paid out. Found by reading a real
    // backlog, not by a test.
    //
    // The calendar-week half of the gate is the same one the payout uses:
    // `simulateBBWeek` runs twice on a double eviction and once per side on a
    // Split House.
    if (campaignIndex === 0 && currentTheme()?.economy === 'bb-bucks'
      && !compressed && (week.segment == null || week.segment === 1)) {
      try {
        week.sideBets = runSideBets({ week, house, nominees: [...visibleBlock], rng });
        if (week.sideBets) week.acts.push(addBeats(week.sideBets, { players: week.sideBets.bets.map(b => b.name).slice(0, 4) }));
      } catch { week.sideBets = null; }
    }

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
  // Who went back on their word, and — new — WHO TO. `promisee` is set when
  // the vote operation recorded a promise being renegotiated by the person on
  // the other side of it; without it the aftermath scene had to nominate a
  // bystander as the wronged party. Still null for the looser cases (a liar, a
  // bandwagon jump), where there is no single person who was promised.
  week.voteBroken = ballots
    .filter(b => b.stated !== b.evict && commitments.get(b.voter)?.promised)
    .map(b => ({ voter: b.voter, promised: b.stated, cast: b.evict,
      promisee: b.brokePromiseTo || commitments.get(b.voter)?.promisedTo || null }));

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
        // Sorted by what they are actually worth to the holder — an alliance
        // they are sworn to, not just a bond they happen to have. Somebody's
        // own alliance-mate was losing the chair to a warmer stranger.
        const ally = [...nominees].sort((a, b) => allyStake(holder, b) - allyStake(holder, a))[0];
        // Saving an ally, or spending expiry pressure on a move: both scale
        // with how strategically the holder thinks, never a hard gate.
        const targetSeatable = myTarget && myTarget !== hoh && myTarget !== holder
          && !nominees.includes(myTarget);
        const need = Math.min(1, allyStake(holder, ally)
          + (targetSeatable ? (hst.strategic || 5) * 0.04 : 0));
        // `lastWindowWeek` was worth +0.18 here. It is the whole decision on
        // the last night — see spendPull — because a Diamond nobody detonated
        // is a Diamond that was never in the season.
        const pull = spendPull({ need,
          weeksLeft: lastWindowWeek ? 0 : Math.max(1, inst.expiresAfterWeek - week.num),
          nerve: (hst.boldness || 5) / 10,
          exposes: (inst.visibility || 'public') === 'public' });
        if (rng() < pull) save = ally;
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
          ...(week.botbSafe || []), ...(week.rouletteSafe || []), ...(week.derbySafe || []), carePackageProtects(week.carePackage),
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

  // ── the saboteur's week ──
  //
  // Here, and not earlier: the week's shape is known — who holds power, who is
  // on the block, what the saboteur played in and lost — and nothing has been
  // decided by the vote yet, so a mission that breaks somebody's campaign
  // breaks it while campaigning still matters.
  try {
    // Resolved HERE, because a mission that breaks somebody's campaign has to
    // break it while campaigning still matters — but the act is held back and
    // pushed after eviction night. The result of the week's sabotage is a
    // better watch once you know how the week ended, and it belongs next to the
    // eviction rather than three screens before it.
    week._sabHeld = [];
    const sabAct = resolveSaboteurMission(week, { rng });
    if (sabAct) week._sabHeld.push(sabAct);
    // And then, if the house has become certain about somebody, it says so —
    // in front of everybody, once. This is the only thing that can end the
    // second game early, and it ends it whether or not the name is right.
    const called = runSaboteurAccusation(week, { rng });
    if (called) week._sabHeld.push(called);
    // And the consequence lands in the house feed, where the room lives —
    // unattributed, because the room never sees who did it.
    if (week._saboteurFeed) {
      const feed = [...week.acts].reverse().find(a => a?.type === 'house' && Array.isArray(a.socialBeats));
      if (feed) feed.socialBeats.push(week._saboteurFeed);
      delete week._saboteurFeed;
    }
  } catch { /* the house has a normal week */ }

  /* ── A DUOS SEASON, MID-WEEK ──
     The twist that only fires at nominations is a rule; what makes this a
     season is eleven weeks of what being chained to somebody does. Power
     couples, public splits nobody can act on, one name carrying two, and the
     orphans everybody has quietly decided are free. */
  if (!compressed) {
    try {
      const life = duosWeekLife(week, { house, rng });
      /* INTO HOUSE LIFE, NOT ONTO A SCREEN OF ITS OWN.
         Three lines about who is carrying whom do not earn their own stop in
         the viewing party, and putting them there fragmented the week: the
         same kind of texture as every other camp beat, sitting in a separate
         room with a roster of every pair in the house printed above it. They
         go in the feed with the rest of the week's social beats, which is
         where a reader is already looking for them. The standalone act
         survives only for a week that has no House Life to fold into. */
      if (life) {
        const feed = [...week.acts].reverse()
          .find(a => a?.type === 'house' && Array.isArray(a.socialBeats));
        if (feed) feed.socialBeats.push(...(life.beats || []));
        else {
          week.acts.push(addBeats(life,
            { players: [...new Set((life.events || []).flatMap(e => e.players))] }));
        }
        week.duosLife = life;
      }
    } catch { /* the season plays without it */ }
  }

  /* ── YOU GO, THEY GO: strategy for two ──
     Fired once the block is settled and before the votes are read, because
     every one of these is a thing somebody does about a block they can see.
     Bonds, popularity and one very public betrayal, all of which outlive the
     week the twist is scheduled on. */
  if (duoWeekActive(week)) {
    try {
      const duoEvents = duoWeekEvents(week, { house, nominees, rng });
      if (duoEvents) week.acts.push(addBeats(duoEvents,
        { players: [...new Set((duoEvents.events || []).flatMap(e => e.players))] }));
    } catch { /* the week plays without them */ }
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
    /* ── TOTALLED BY DUO ──
       Four on the block and the votes are counted by PAIR: the duo the room
       wrote down most loses somebody, and it is the half of that pair with the
       most votes of their own. So a houseguest can go home on fewer votes than
       people sitting in the other chairs, because their partner dragged their
       side of the wall down — which is the reason to seat two duos at all. */
    // The wall as it stands on eviction night, which is not the wall the
    // ceremony built if the veto moved a whole duo off it.
    const voteBlocks = week.duoBlocksFinal || week.duoBlocks;
    let duoVote = null;
    if (voteBlocks?.length === 2) {
      try {
        duoVote = duoVoteResult({ nominees, votes, pairs: voteBlocks });
      } catch { duoVote = null; }
    }
    if (duoVote) {
      week.duoVote = duoVote;
      if (duoVote.evicted) evicted = duoVote.evicted;
      else {
        // The losing duo split its own votes evenly, so the Head of Household
        // says which half of it goes — the same tie the format always breaks.
        // Two names, or there is nothing to break — a losing "pair" of one is
        // not a tie, it is the only answer.
        const preference = duoVote.losing.length === 2
          ? initialVotePreference(hoh, duoVote.losing, rng)
          : { evict: duoVote.losing[0] };
        evicted = preference.evict;
        week.duoVote.evicted = evicted;
        week.duoVote.survivor = duoVote.losing.find(n => n !== evicted);
        tieBreak = { voter: hoh, evict: evicted, anonymous: hohSecret };
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
  }
  if (!doubleVote) {
    evicted = hook(hooks, 'evictionResult', evicted, { week, house, hoh, nominees: [...nominees], ballots, votes, tieBreak }) || evicted;
    if (!nominees.includes(evicted)) {
      // Same rule as above: the most votes, over every chair.
      evicted = [...nominees].sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0];
    }
  }
  week.evicted = evicted;
  /* ── AND THEIR PARTNER ──
     The whole twist, in three lines. Whoever took the most votes is evicted
     and the person they were chained to is evicted beside them — on zero
     votes, if that is what the room wrote down. `secondEvicted` is the same
     channel the double eviction's second walk already uses, so the roster, the
     jury, the deal-breaks and the eviction screen all handle it without
     knowing why there are two names tonight. */
  if (duoWeekActive(week) && evicted) {
    try {
      const taken = duoWeekSecondEvictee(week, evicted, house);
      if (taken) {
        secondEvicted = taken;
        week.duoWeekTaken = { evicted, taken };
      }
    } catch { /* one name tonight */ }
  }
  // The twist's other ending. Somebody walks out of that door with weeks of
  // banked money and nothing to show for it, and the house is told at the door
  // what it has just done.
  //
  // Held rather than pushed: this runs before the eviction act is built, so
  // pushing it here put the reveal on screen BEFORE the result it is reacting
  // to. It goes on the end of the held pile, which is flushed after the
  // eviction — so the night reads eviction, then the week's job, then who it
  // turns out had been doing it.
  try {
    const blown = saboteurEvicted(evicted, week);
    if (blown) (week._sabHeld ||= []).push(blown);
  } catch { /* the eviction stands either way */ }
  // ── living with somebody you already could not live with ──
  //
  // The twist has no clock and no weekly job. What it has is two people who
  // cannot be in a room together and eleven who can watch, so every week the
  // pairs still standing produce a flashpoint, a thaw, or somebody else
  // noticing that a permanent grudge is a permanent tool.
  try {
    const grudges = rivalWeekEvents(week, { rng });
    if (grudges) week.acts.push(grudges);
  } catch { /* the house has a normal week */ }

  // ── the twins' week, resolved ──
  //
  // After the vote, and deliberately: no twin job changes a ballot, and one of
  // them turns on having sat on the block and got off it, which is a thing that
  // is only true once the votes are read. The whole week arrives as one screen —
  // the changeover, whether the job came off, who noticed, and whether anybody
  // is sure enough to say it in front of everybody.
  try {
    const tw0 = twinState();
    if (tw0 && !tw0.entered && !tw0.caught) {
      const debrief = resolveTwinMission(week, { rng });
      // All three sources of suspicion arrive through one door: the handoff
      // governs the memory slips, the stat gap governs the form slips, and the
      // job's own noise is handed in here.
      const tells = twinTells(week, { rng, extraNoise: week._twinJobNoise || 0 });
      delete week._twinJobNoise;
      const found = twinDiscovery(week, { rng });
      const tw = twinState();
      /* A SWAP IS ALWAYS WORTH A SCREEN.
         This used to fire only when there was a job debrief, a tell or a
         discovery — so a pair who declined the jobs and went unnoticed swapped
         ten times across a season with nothing ever shown. From outside it read
         as a twist that did nothing: same name, same icon, week after week.
         The changeover IS the mechanic; it gets its own week regardless. */
      if (debrief || tells || found || week._twinSwap) {
        (week._sabHeld ||= []).push({
          type: 'twin-week', secret: true, week: week.num,
          front: tw?.front || null,
          swap: week._twinSwap || null,
          handoff: tw?.handoff || null,
          debrief: debrief || null, tells, exposed: found || null,
          twins: tw ? { other: tw.other, active: tw.active,
            statsA: { ...tw.statsA }, statsB: { ...tw.statsB } } : null,
          exposureLevel: twinExposureLevel(),
          quota: tw?.quota || 0, completed: tw?.completed || 0, banked: tw?.banked || 0,
          beats: [...(debrief?.beats || []), ...(tells?.beats || [])],
        });
      }
      // Said out loud in front of everybody: the jobs stop and the second twin
      // never gets through the door. Its own screen, because it is the ending.
      if (found) (week._sabHeld ||= []).push(found);
      // And what the room actually saw, dropped into the feed unattributed.
      if (week._twinFeed) {
        const feed = [...week.acts].reverse().find(a => a?.type === 'house' && Array.isArray(a.socialBeats));
        if (feed) feed.socialBeats.push(week._twinFeed);
        delete week._twinFeed;
      }
    }
    delete week._twinSwap;
    // One of a pair goes, and the other one walks back into a house that has
    // spent weeks understanding them entirely through somebody else.
    const rival = rivalEvicted(evicted, week);
    if (rival) (week._sabHeld ||= []).push(rival);
    const twins = twinEvicted(evicted, week);
    if (twins) (week._sabHeld ||= []).push(twins);
    // The fourth ending: never caught, never got there. Once the house is down
    // to the finale there is nowhere left for a second houseguest to walk into,
    // so the twist is told to the room as a thing that already happened — which
    // is the worst outcome for the twins and the best one to watch.
    else {
      const floor = Math.max(3, Number(seasonConfig?.finaleSize) || 3);
      const left = (gs.activePlayers || []).filter(n => n !== evicted && n !== secondEvicted).length;
      if (left <= floor) {
        const quiet = twinUnfinished(week);
        if (quiet) (week._sabHeld ||= []).push(quiet);
      }
    }
  } catch { /* the eviction stands either way */ }
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
  // ── the Sanctum's running order ──────────────────────────────────────
  //
  // A public vote is not the same votes read out loud: it is a SEQUENCE, and
  // the order is the drama. Each voter walks to the table knowing every vote
  // cast before theirs, so the room watches the count build — and the last
  // chair votes into a result that is already decided, in front of the person
  // it decides.
  //
  // The order is not the house's to choose. Seeded off the week so a replay
  // reads the same, and stored on the act rather than resorting the ballots,
  // because the ledger everything else reads must stay the ledger.
  if (week.publicVote && ballots.length) {
    const seq = [...ballots];
    const r = stableRng('sanctum-order', gs?.bb?.seasonSalt || 0, week.num);
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    let running = 0;
    week.sanctumOrder = seq.map((b, i) => {
      running += (b.evict === evicted) ? 1 : 0;
      return {
        voter: b.voter, evict: b.evict, position: i + 1,
        // Was the night already over when this one walked up? The reader wants
        // to mark the chair that voted into a decided result.
        afterDecided: running > Math.floor(ballots.length / 2),
        forEvicted: b.evict === evicted,
      };
    });
  }

  week.acts.push(addBeats(
    { type: 'eviction', nominees: [...nominees], ballots, votes, tieBreak, evicted,
      secondEvicted, doubleVote,
      // The night the room watched each other vote.
      publicVote: !!week.publicVote,
      sanctumOrder: week.sanctumOrder || null,
      // Four on the block and a result nobody can reconstruct from the ballots
      // alone: the reader has to be shown the two sides added up, or the night
      // reads as the wrong name being called.
      duoVote: week.duoVote || null },
    { nominees: [...nominees], evicted, votes, ballots }));

  // ── THE FLOOR SETTLES ─────────────────────────────────────────────────
  //
  // Pushed HERE, after the eviction act, and the position is the whole point.
  // The settlement first lived inside the placement act, which sits before the
  // vote — so the betting screen rendered the result and told a viewer watching
  // in order who had been paid, and therefore who had gone home, in advance.
  // Splitting it into its own act was only half the fix: pushing it where
  // `week.evicted` is assigned still put it several hundred lines and three
  // sections ahead of the eviction the viewer had not seen yet. A backlog read
  // end to end caught both halves.
  if (week.sideBets && !week.sideBets.settled) {
    try {
      const settled = settleSideBets(week.sideBets, evicted, { rng });
      if (settled) {
        week.sideBetResults = settled;
        week.acts.push(addBeats(settled, { players: settled.results.map(r => r.name).slice(0, 4) }));
      }
    } catch { /* the vote stands regardless */ }
  }

  // The second name, read out after the votes, which nobody cast for.
  if (week.duoWeekTaken) {
    try {
      const act = duoWeekEviction(week, { evicted, taken: week.duoWeekTaken.taken, votes });
      if (act) week.acts.push(addBeats(act, { players: [evicted, week.duoWeekTaken.taken] }));
    } catch { /* the eviction act already named them both */ }
  }

  // Held from before the vote — see the comment where they are produced. After
  // the door, before the interview.
  if (week._sabHeld?.length) {
    week.acts.push(...week._sabHeld);
    delete week._sabHeld;
  }

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
        // Nobody was removed, so nobody was chained to a removal either.
        if (week.duoWeekTaken) { secondEvicted = null; week.duoWeekTaken = null; }
      }
    } catch { week.haltingHex = null; }
  }

  // ── The Rewind ──
  //
  // Same seam as the Hex, and after it on purpose: if the Hex has already
  // stopped the night there is nothing left to stop, and a Rewind spent on an
  // eviction that is not happening is the "do not waste the power" fault this
  // shelf has been fixed for twice.
  //
  // The difference from the Hex is the line that erases `outgoingHoh`. That
  // single field is the whole of "the reign is gone": it is what bars last
  // week's Head of Household from competing, so clearing it puts them back on
  // the same starting line as the two people they nominated.
  week.rewind = null;
  if (!compressed && evicted) {
    try {
      const rw = resolveRewind({ week, evicted, nominees, hoh, house,
        ballots: week.votingLog || [], rng });
      if (rw) {
        week.rewind = rw;
        week.acts.push(addBeats(rw, { players: [rw.holder, rw.spared].filter(Boolean) }));
        week.evictionCancelled = true;
        week.rewound = true;
        week.evicted = null;
        evicted = null;
        if (week.duoWeekTaken) { secondEvicted = null; week.duoWeekTaken = null; }
        // The week never happened: no block, no reign, nobody barred.
        week.finalNominees = [];
        nominees = [];
        gs.bb.outgoingHoh = null;
        gs.bb.rewoundWeek = week.num;
      }
    } catch { week.rewind = null; }
  }

  // AFTER the Hex, not after the eviction act. The Hex un-evicts somebody the
  // house has already voted out and nulls `week.evicted`, so a line placed at
  // the act would announce a departure that the very next card cancels.
  // No `cursed` here on purpose. `houseAtStart` still contains whoever just
  // left, so a `{cursed}` line at the count could name the very person the
  // eviction removed — and the curse's victim is by far the likeliest person to
  // be that. `{evicted}` is the only name this hook needs.
  // The shape of the count, "5-2", read off the ballots that were actually
  // cast. Null when nobody left, which is the same night the hook goes silent.
  // `week.votes` is a TALLY — nominee to count — not a ballot list of voter to
  // target. Read as ballots it counted one entry per nominee and reported every
  // eviction as "0-1", a line that is worse than no line because it is
  // confidently wrong. The evictee's own count against everything else on the
  // block is the number the house would recognise.
  let _margin = null;
  if (week.evicted) {
    const tally = week.votes || {};
    const against = Number(tally[week.evicted] || 0);
    const rest = Object.entries(tally)
      .filter(([n]) => n !== week.evicted)
      .reduce((sum, [, v]) => sum + Number(v || 0), 0);
    if (against > 0) _margin = `${against}-${rest}`;
  }
  _themeSay(week, 'vote', { evicted: week.evicted || null, margin: _margin,
    hoh: week.hohSecret ? null : week.hoh });

  // ── ANYBODY WHO WALKED IN DURING THE WEEK IS STILL HERE ──
  //
  // `house` is a snapshot taken before the week started, and rebuilding the
  // roster from it deleted everyone who joined after that line ran. The twin
  // twist is where it shows: the second twin enters, gets a player record, gets
  // a stats record, is pushed onto gs.activePlayers by checkTwinEntry — and
  // then this line, forty-one hundred lines later, quietly removed her again.
  // Every week after that she was in the cast and not in the house: no
  // competitions, no votes, nobody targeting her, and a grey frame on the
  // memory wall that made her look evicted. She had in fact survived, which
  // was the entire point of the twist.
  //
  // Read the difference off the live roster rather than naming the mechanics,
  // so a late arrival from any of them — the twin, a rival, a returnee — keeps
  // the seat it was given.
  const walkedIn = (gs.activePlayers || []).filter(name => !house.includes(name));
  gs.activePlayers = [...house, ...walkedIn]
    .filter(name => name !== evicted && name !== secondEvicted);
  if (evicted && !gs.eliminated.includes(evicted)) gs.eliminated.push(evicted);
  if (secondEvicted && !gs.eliminated.includes(secondEvicted)) gs.eliminated.push(secondEvicted);

  // ── CAMP COMEBACK ──
  //
  // The eviction above is real and stays real: they are out of the roster, out
  // of the vote and out of the nominations. They simply do not leave the
  // house. Nothing else in the week engine has to know, which is exactly why
  // this runs AFTER the removal rather than instead of it.
  /* One of a pair is gone, so the other one is handed a key. AFTER the
     eviction, exactly like Camp Comeback: the evictee is already out of the
     roster, the vote and the nominations. This only hands the survivor a
     status. */
  if (evicted) {
    try {
      const key = grantGoldenKey({ week, evicted, house: gs.activePlayers });
      if (key) { week.goldenKey = key; week.acts.push(addBeats(key, { players: [key.holder] })); }
      const done = expireKeys({ week, house: gs.activePlayers });
      if (done) { week.keysExpired = done; week.acts.push(addBeats(done, { players: done.holders })); }
      /* THE OTHER MODE. No key was handed out, so somebody is running around
         this house with no partner — and an orphan can be put on that block by
         themselves, which costs the next Head of Household nobody. The moment
         two of them exist they become each other's, chosen for them. */
      const chained = repairOrphans({ week, house: gs.activePlayers, rng });
      if (chained) {
        week.duosRepaired = chained;
        week.acts.push(addBeats(chained, { players: chained.pairs.flat() }));
      }
    } catch { /* the season plays on without the paperwork */ }
  }

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
  // The same argument for the money. PRIVATE: this is a snapshot for a later
  // surface and for a replay, never something the house is shown — what the
  // room was told is the announced tiers, which live on the act.
  //
  // Over the UNDIVIDED house for the same reason the payout is: only side A's
  // week reaches `weekToEpisode`, so snapshotting `house` on a split night
  // carried six names onto the episode and lost the other six.
  week.bucksLedger = bucksLedgerFor(_calendarHouse);
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
  // `week.rewound` wins: the reign was erased, so there is no outgoing Head of
  // Household to bar from next week's competition. Without this the line below
  // would hand the crown straight back to somebody the twist just took it from,
  // one screen after telling the house they were never crowned.
  // ── A DETHRONED HEAD OF HOUSEHOLD IS NOT AN OUTGOING ONE ──
  //
  // `outgoingHoh` is what bars somebody from the next competition, and it has
  // always carried two exemptions for people who did not get the reign it is
  // recording — an invisible HOH and a rewound week. A coin week is a third of
  // exactly that kind. Canon is explicit that the dethroned HOH stays safe and
  // competes in the next Head of Household; without this we take their week
  // AND the chance to win it back, which is a punishment nothing in the rules
  // asks for and which no surface ever explains to the viewer.
  gs.bb.outgoingHoh = (week.hohSecret || week.rewound || week.coinDethroned) ? null : hoh;
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
  // Headless and audit seasons come in here without ever calling
  // `prepareHouse()`, so a theme installed only on the played path would leave
  // this one silently running unthemed — the played-vs-headless divergence this
  // codebase has been bitten by before. The install is idempotent, so both
  // paths calling it is free.
  try { installTheme((gs.activePlayers || []).length); } catch { /* the season plays unthemed */ }
  while ((gs.activePlayers || []).length > finaleSize) {
    weeks.push(simulateBBWeek(options));
  }
  return { weeks, finalists: [...gs.activePlayers] };
}

// js/episode.js - Main episode orchestration: simulation loop, survival, popularity, tribal aftermath
import { gs, seasonConfig, players, repairGsSets } from './core.js';
import { pStats, pronouns, getPlayerState, updateChalRecord, isAllianceBottom, threatScore } from './players.js';
import { getBond, addBond, checkPerceivedBondTriggers, updateBonds, updatePerceivedBonds, recoverBonds } from './bonds.js';
import { wRandom, computeHeat, formAlliances, detectBetrayals, decayAllianceTrust } from './alliances.js';
import { simulateVotes, resolveVotes, checkShotInDark, simulateRevote } from './voting.js';
import { checkIdolPlays, checkIdolPreTribal, checkNonIdolAdvantageUse, findAdvantages, handleAdvantageInheritance } from './advantages.js';
import { simulateIndividualChallenge, simulateTribeChallenge, pickChallenge, simulateLastChance } from './challenges-core.js';
import { applyTwist, generateTwistScenes, generateDockArrivals, simulateJourney } from './twists.js';
import {
  generateCampEvents, checkAllianceRecruitment, executeEmissarySelection,
  generateEmissaryScoutEvents, checkVolunteerExileDuel, checkMoleSabotage,
  checkSideDealBreaks, checkConflictingDeals, checkFalseInfoBlowup
} from './camp-events.js';
import {
  isRIStillActive, simulateRIChoice, simulateRIDuel, simulateRIReentry,
  generateRILifeEvents, generateRIPostDuelEvents, generateRescueIslandLife
} from './rescue-island.js';
import { generateSummaryText } from './text-backlog.js';

// Challenge simulate functions
import { simulateCliffDive } from './chal/cliff-dive.js';
import { simulateAwakeAThon } from './chal/awake-a-thon.js';
import { simulateDodgebrawl } from './chal/dodgebrawl.js';
import { simulateTalentShow } from './chal/talent-show.js';
import { simulateSuckyOutdoors } from './chal/sucky-outdoors.js';
import { simulateUpTheCreek } from './chal/up-the-creek.js';
import { simulatePaintballHunt } from './chal/paintball-hunt.js';
import { simulateHellsKitchen } from './chal/hells-kitchen.js';
import { simulateTrustChallenge } from './chal/trust.js';
import { simulateBasicStraining } from './chal/basic-straining.js';
import { simulateXtremeTorture } from './chal/x-treme-torture.js';
import { simulatePhobiaFactor } from './chal/phobia-factor.js';
import { simulateBrunchOfDisgustingness } from './chal/brunch.js';
import { simulateLuckyHunt } from './chal/lucky-hunt.js';
import { simulateSayUncle } from './chal/say-uncle.js';
import { simulateTripleDogDare } from './chal/triple-dog-dare.js';
import { simulateSlasherNight } from './chal/slasher-night.js';
import { simulateHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
import { simulateOffTheChain } from './chal/off-the-chain.js';

// Functions still in simulator.html inline script — accessed via window at call time:
//   patchEpisodeHistory, saveGameState, snapshotGameState, buildCrashout

export function updatePlayerStates(ep) {
  if (!gs.playerStates) gs.playerStates = {};
  if (!gs.jurorHistory) gs.jurorHistory = {};
  const epNum = ep.num;

  // Record how the eliminated player was voted out (for jury bitterness later)
  if (ep.eliminated && ep.votingLog?.length) {
    const voters = ep.votingLog.filter(e => e.voted === ep.eliminated).map(e => e.voter);
    const finalBonds = {};
    gs.activePlayers.forEach(p => { finalBonds[p] = getBond(ep.eliminated, p); });
    gs.jurorHistory[ep.eliminated] = { voters, ep: epNum, finalBonds };
  }

  gs.activePlayers.forEach(name => {
    const state = gs.playerStates[name] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    const s = pStats(name);
    const votesThisEp = ep.votes?.[name] || 0;

    if (votesThisEp > 0) {
      state.votesReceived = (state.votesReceived || 0) + votesThisEp;
      state.lastVotedEp = epNum;
    }
    const _priorBigMoves = state.bigMoves || 0;
    // Big moves: actions that build a FTC resume
    // Broke alliance consensus (intentional flip) [STEALABLE]
    if (ep.votingLog?.some(e => e.voter === name && e.reason?.includes('broke '))) {
      state.bigMoves = (state.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
    }
    // Played an idol successfully (on self or ally) [STEALABLE — "I convinced them to play it"]
    if (ep.idolPlays?.some(p => p.player === name && !p.misplay && !p.failed && (p.votesNegated || 0) > 0)) {
      state.bigMoves = (state.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
    }
    // Used KiP successfully [STEALABLE — "I told them who had the idol"]
    if (ep.kipSteal?.holder === name && ep.kipSteal?.success) {
      state.bigMoves = (state.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
    }
    // Survived being the top target (received most votes but wasn't eliminated)
    if (votesThisEp >= 3 && ep.eliminated !== name) {
      state.bigMoves = (state.bigMoves || 0) + 1;
    }
    // Orchestrated a blindside — target didn't see it coming [STEALABLE]
    if (ep.eliminated && ep.eliminated !== name && ep.votingLog?.some(e => e.voter === name && e.voted === ep.eliminated)) {
      const _elimPlayedIdol = (ep.idolPlays || []).some(p => (p.player === ep.eliminated || p.playedFor === ep.eliminated) && (p.votesNegated || 0) > 0);
      const _elimVoteCount = ep.votingLog.filter(e => e.voted === ep.eliminated).length;
      const _elimTotalVoters = ep.votingLog.filter(e => e.voter !== 'THE GAME').length;
      const _elimWasObvious = _elimTotalVoters > 0 && _elimVoteCount / _elimTotalVoters >= 0.7;
      const _elimFeltSafe = ['confident', 'comfortable', 'content'].includes(gs.playerStates?.[ep.eliminated]?.emotional || '');
      // Blindside = target felt safe OR wasn't obvious consensus, AND didn't protect themselves
      if (!_elimPlayedIdol && !_elimWasObvious && (_elimFeltSafe || _elimVoteCount < _elimTotalVoters * 0.5)) {
        state.bigMoves = (state.bigMoves || 0) + 1;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
      }
    }
    // Clutch immunity win — won immunity when you received votes last episode
    if (ep.immunityWinner === name) {
      const prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
      const _votedLastEp = prevEp?.votingLog?.some(e => e.voted === name);
      if (_votedLastEp) {
        state.bigMoves = (state.bigMoves || 0) + 1;
      }
    }
    // Split vote caught an idol — alliance's split plan flushed an idol successfully
    if (ep.splitVotePlans?.length && ep.eliminated) {
      const _myPlan = ep.splitVotePlans.find(sp => {
        const _allianceObj = (gs.namedAlliances || []).find(a => a.name === sp.alliance);
        return _allianceObj?.members?.includes(name);
      });
      if (_myPlan) {
        const _primaryIdol = (ep.idolPlays || []).some(p => (p.player === _myPlan.primary || p.playedFor === _myPlan.primary) && (p.votesNegated || 0) > 0);
        // Idol was flushed AND secondary went home = split worked perfectly
        if (_primaryIdol && ep.eliminated === _myPlan.secondary) {
          // Credit goes to highest strategic in the alliance [STEALABLE]
          const _allianceObj = (gs.namedAlliances || []).find(a => a.name === _myPlan.alliance);
          const _leader = (_allianceObj?.members || []).filter(m => gs.activePlayers.includes(m))
            .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
          if (_leader === name) {
            state.bigMoves = (state.bigMoves || 0) + 1;
            if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
            if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
          }
        }
      }
    }
    // Successful vote steal / extra vote that changed the outcome [STEALABLE — "I said we needed the extra vote"]
    if (ep.idolPlays?.some(p => p.player === name && (p.type === 'voteSteal' || p.type === 'extraVote')) && ep.eliminated) {
      // Check if the advantage user voted for the eliminated player
      if (ep.votingLog?.some(e => e.voter === name && e.voted === ep.eliminated)) {
        state.bigMoves = (state.bigMoves || 0) + 1;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
      }
    }
    // Survived a rock draw
    if (ep.isRockDraw && ep.eliminated !== name) {
      state.bigMoves = (state.bigMoves || 0) + 1;
    }
    // Engineered someone else's idol misplay — voted for someone ELSE but the eliminated player wasted their idol [STEALABLE]
    if (ep.idolPlays?.some(p => p.misplay && p.player !== name)) {
      // You were part of the vote that caused the misplay (you didn't vote for the idol player)
      const _misplayer = ep.idolPlays.find(p => p.misplay)?.player;
      if (_misplayer && ep.votingLog?.some(e => e.voter === name && e.voted !== _misplayer)) {
        state.bigMoves = (state.bigMoves || 0) + 1;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
      }
    }
    // Survived unanimous target — everyone voted for you but you survived (idol/advantage)
    if (votesThisEp >= 2 && ep.eliminated !== name) {
      const _totalVoters = ep.votingLog?.filter(e => e.voter !== 'THE GAME').length || 0;
      if (_totalVoters > 0 && votesThisEp >= _totalVoters) {
        state.bigMoves = (state.bigMoves || 0) + 1; // stacks with "survived top target"
      }
    }
    // Won the fire-making duel — earned your finale spot through fire
    if (ep.firemakingResult?.winner === name) {
      state.bigMoves = (state.bigMoves || 0) + 1;
    }
    // Won a tiebreaker challenge — survived a deadlocked vote through a head-to-head challenge
    if (ep.tiebreakerResult?.winner === name) {
      state.bigMoves = (state.bigMoves || 0) + 1;
    }
    // Pulled off a tight margin vote — in minority but still got target out (3-2, 2-1, 4-3) [STEALABLE]
    if (ep.eliminated && ep.votingLog?.length) {
      const _elimVotes = ep.votingLog.filter(e => e.voted === ep.eliminated).length;
      const _totalVotes = ep.votingLog.filter(e => e.voter !== 'THE GAME').length;
      const _margin = _elimVotes - (_totalVotes - _elimVotes);
      // Margin of 1 = tight vote, and this player voted for the eliminated
      if (_margin >= 1 && _margin <= 2 && _elimVotes < _totalVotes * 0.6 && ep.votingLog.some(e => e.voter === name && e.voted === ep.eliminated)) {
        state.bigMoves = (state.bigMoves || 0) + 1;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
      }
    }
    // First post-merge boot architect — orchestrated the first elimination after merge [STEALABLE]
    if (ep.isMerge && ep.eliminated && ep.votingLog?.some(e => e.voter === name && e.voted === ep.eliminated)) {
      state.bigMoves = (state.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
    }
    // Took out the biggest threat — eliminated player had the highest threat score [STEALABLE]
    if (ep.eliminated && ep.votingLog?.some(e => e.voter === name && e.voted === ep.eliminated)) {
      const _elimThreat = threatScore(ep.eliminated);
      const _maxThreat = Math.max(...gs.activePlayers.map(p => threatScore(p)), _elimThreat);
      if (_elimThreat >= _maxThreat && _elimThreat > 5) {
        state.bigMoves = (state.bigMoves || 0) + 1;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
      }
    }
    // Challenge beast — 3+ individual immunity wins total
    if (gs.isMerged) {
      const _immWins = gs.episodeHistory.filter(e => e.immunityWinner === name && e.challengeType === 'individual').length + (ep.immunityWinner === name ? 1 : 0);
      if (_immWins === 3) { // award once when hitting 3
        state.bigMoves = (state.bigMoves || 0) + 1;
      }
    }
    // Betrayed a ride-or-die / showmance partner — voted out your closest ally
    if (ep.eliminated && ep.votingLog?.some(e => e.voter === name && e.voted === ep.eliminated)) {
      const _showmance = gs.showmances?.find(sm => sm.players.includes(name) && sm.players.includes(ep.eliminated) && sm.phase !== 'broken-up');
      const _elimBond = getBond(name, ep.eliminated);
      if (_showmance || _elimBond >= 5) {
        state.bigMoves = (state.bigMoves || 0) + 1;
      }
    }
    // Note: bigMoveEarnersThisEp tracking is done inline above — only STEALABLE moves
    // (strategic/social moves where someone can reframe the narrative) push to the array.
    // Personal achievements (challenge wins, idol plays, survival) can't be stolen.

    const wasTargeted = votesThisEp >= 2;
    const wasTagged    = votesThisEp === 1; // got one vote — noticed but not the main target
    const wasTargetedRecently = state.lastVotedEp && (epNum - state.lastVotedEp) <= 2;
    const hasIdol = gs.advantages?.some(a => a.holder === name && a.type === 'idol');
    const allianceForMe = (ep.alliances || []).find(a => a.type === 'alliance' && a.members.includes(name));
    const atBottom = allianceForMe && isAllianceBottom(name, allianceForMe.members);
    const unallied = !allianceForMe && gs.isMerged; // no alliance, post-merge — exposed
    const _allyBond = ep.eliminated ? getBond(name, ep.eliminated) : 0;
    const lostCloseAlly = ep.eliminated && _allyBond >= 3 && Math.random() < _allyBond * 0.12; // scales: bond 3=36%, 5=60%, 8=96%
    const longSafeStreak = (epNum - (state.lastVotedEp || 0)) >= 5 && epNum >= 5;

    // State priority: desperate → paranoid → uneasy → comfortable (complacent) → calculating → confident → content
    let emotional;
    if (wasTargeted && (state.votesReceived || 0) >= 4)            emotional = 'desperate';   // repeatedly on the block
    else if (wasTargeted || (wasTargetedRecently && atBottom))     emotional = 'paranoid';    // targeted or recently threatened + exposed
    else if (atBottom && !hasIdol && gs.isMerged)                  emotional = 'paranoid';    // bottom of alliance, no safety net
    else if (wasTagged || unallied || lostCloseAlly)               emotional = 'uneasy';      // mild anxiety — something's off
    else if (longSafeStreak && s.boldness < 5 && s.strategic < 6) emotional = 'comfortable'; // complacent blind spot
    else if (s.strategic >= 7 && !atBottom)                        emotional = 'calculating'; // strategic mind, actively plotting
    else if (Math.random() < s.boldness * 0.10 || (hasIdol && !wasTargetedRecently)) emotional = 'confident'; // proportional: stat 5=50%, stat 8=80%
    else                                                            emotional = 'content';     // genuinely fine, nothing to report

    // High temperament players resist extreme emotional states — they stay composed
    // Temperament-scaled emotional resistance: proportional
    // High temperament resists negative states, low temperament escalates
    const _tempResist = s.temperament * 0.08; // stat 3=0.24, stat 5=0.40, stat 8=0.64, stat 10=0.80
    const _tempEscalate = (10 - s.temperament) * 0.05; // stat 3=0.35, stat 5=0.25, stat 8=0.10
    if (emotional === 'desperate' && Math.random() < _tempResist) {
      emotional = 'paranoid'; // composed players downgrade
    } else if (emotional === 'paranoid' && Math.random() < _tempResist * 0.7) {
      emotional = 'calculating'; // very composed → strategic mindset under pressure
    }
    if (emotional === 'uneasy' && Math.random() < _tempEscalate) {
      emotional = 'paranoid'; // volatile players spiral
    } else if (emotional === 'paranoid' && wasTargeted && Math.random() < _tempEscalate * 0.7) {
      emotional = 'desperate'; // volatile + targeted → full meltdown
    }
    state.emotional = emotional;
    gs.playerStates[name] = state;
  });
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: SURVIVAL MECHANICS
// ══════════════════════════════════════════════════════════════════════

export function updateSurvival(ep) {
  if (seasonConfig.foodWater !== 'enabled') return;
  if (!gs.survival) gs.survival = {};
  if (!gs.tribeFood) gs.tribeFood = {};
  const difficulty = seasonConfig.survivalDifficulty || 'casual';
  const epNum = ep.num || (gs.episode || 0) + 1;

  // ── 1. Tribe food decay ──
  const decayRanges = { casual: [3, 5], realistic: [6, 10], brutal: [10, 16] };
  const [decayMin, decayMax] = decayRanges[difficulty] || decayRanges.casual;

  // Get current tribe groups (pre-merge: gs.tribes, post-merge: single merged group)
  const tribeGroups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.filter(t => t.members.length > 0);

  tribeGroups.forEach(tribe => {
    if (!gs.tribeFood[tribe.name] && gs.tribeFood[tribe.name] !== 0) gs.tribeFood[tribe.name] = 60;
    const decay = decayMin + Math.random() * (decayMax - decayMin);
    gs.tribeFood[tribe.name] = Math.max(0, gs.tribeFood[tribe.name] - decay);
  });

  // ── 2. Provider/slacker calculation ──
  gs.currentProviders = [];
  gs.currentSlackers = [];
  if (!gs.providerHistory) gs.providerHistory = {};

  tribeGroups.forEach(tribe => {
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    if (!members.length) return;

    // Calculate contributions
    const contributions = members.map(name => {
      const s = pStats(name);
      const willingness = s.loyalty * 0.3 + s.social * 0.3 + (10 - s.boldness) * 0.1;
      const ability = s.endurance * 0.3 + s.physical * 0.2;
      const contribution = (willingness + ability) * 0.5 + (Math.random() * 1.5 - 0.75);
      return { name, contribution };
    });

    const avg = contributions.reduce((s, c) => s + c.contribution, 0) / contributions.length;

    contributions.forEach(({ name, contribution }) => {
      const isProvider = contribution > avg;
      const isSlacker = contribution < avg;
      const diff = Math.abs(contribution - avg);

      if (isProvider) {
        gs.currentProviders.push(name);
        gs.providerHistory[name] = (gs.providerHistory[name] || 0) + 1;
        // Provider adds extra to tribe food
        gs.tribeFood[tribe.name] = Math.min(100, gs.tribeFood[tribe.name] + diff * 0.5);
        // Provider bond boost with tribemates
        members.filter(m => m !== name).forEach(m => addBond(m, name, diff * 0.03));
        // Energy cost — providing is exhausting
        gs.survival[name] = Math.max(0, (gs.survival[name] || 80) - contribution * 0.3);
      } else if (isSlacker) {
        gs.currentSlackers.push(name);
        // Slacker drags tribe food down
        gs.tribeFood[tribe.name] = Math.max(0, gs.tribeFood[tribe.name] - diff * 0.3);
        // Slacker bond decay with non-slackers
        members.filter(m => m !== name && !gs.currentSlackers.includes(m)).forEach(m => addBond(m, name, -0.1));
        // Energy conservation — resting preserves survival
        gs.survival[name] = Math.min(100, (gs.survival[name] || 80) + diff * 0.2);
      }
    });

    // ── 3. Player survival sync toward tribe food ──
    members.forEach(name => {
      if (!gs.survival[name] && gs.survival[name] !== 0) gs.survival[name] = 80;
      const s = pStats(name);
      const tribeFood = gs.tribeFood[tribe.name] || 0;
      const shift = (tribeFood - gs.survival[name]) * 0.3 + s.endurance * 0.2;
      gs.survival[name] = Math.max(0, Math.min(100, gs.survival[name] + shift));
    });
  });

  // ── 4. Injury drain — injured players lose survival faster ──
  if (gs.lingeringInjuries) {
    const _epNum = (gs.episode || 0) + 1;
    gs.activePlayers.forEach(name => {
      const inj = gs.lingeringInjuries[name];
      if (!inj || (_epNum - inj.ep) >= inj.duration) return;
      // Injury drains survival proportional to penalty severity
      const _injDrain = inj.penalty * 1.5; // penalty 1.5 = drain 2.25/ep, penalty 2.5 = drain 3.75/ep
      gs.survival[name] = Math.max(0, (gs.survival[name] || 80) - _injDrain);
      // Severe injury on low survival → immediate collapse risk
      if ((gs.survival[name] || 0) < 30 && inj.penalty >= 2.0 && !gs.collapseWarning?.[name]) {
        if (!gs.collapseWarning) gs.collapseWarning = {};
        gs.collapseWarning[name] = _epNum; // triggers medevac check next episode
      }
    });
  }

  // ── 5. Save provider/slacker data to episode ──
  ep.providerSlackerData = { providers: [...gs.currentProviders], slackers: [...gs.currentSlackers] };
  ep.survivalSnapshot = { ...gs.survival };
  ep.tribeFoodSnapshot = { ...gs.tribeFood };
}

export function generateSurvivalEvents(ep) {
  if (seasonConfig.foodWater !== 'enabled') return;
  const difficulty = seasonConfig.survivalDifficulty || 'casual';
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

  const tribeGroups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.filter(t => t.members.length > 0);

  tribeGroups.forEach(tribe => {
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    if (!members.length) return;
    const campKey = tribe.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    const tribeFood = gs.tribeFood[campKey] || 0;
    const providers = members.filter(m => gs.currentProviders.includes(m));
    const slackers = members.filter(m => gs.currentSlackers.includes(m));

    // ── Provider events ──
    if (providers.length && tribeFood < 70 && Math.random() < 0.35) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const pr = pronouns(provider);
      const isFishing = Math.random() < 0.5;
      if (isFishing) {
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 8);
        gs.survival[provider] = Math.max(0, (gs.survival[provider] || 80) + 5);
        members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.5));
        ep.campEvents[campKey].pre.push({ type: 'providerFishing', players: [provider],
          text: _pick([
            `${provider} is up before dawn, waist-deep in the ocean with a makeshift spear. Two hours later, ${pr.sub} ${pr.sub==='they'?'come':'comes'} back with three fish. The tribe eats tonight.`,
            `Nobody asked ${provider} to go fishing. ${pr.Sub} just went. Came back with enough to feed the camp. ${pr.Sub} didn't say a word about it — didn't need to. Everyone saw.`,
            `${provider} catches a fish the size of ${pr.pos} forearm. The camp erupts. It's been two days since anyone had protein. ${pr.Sub} ${pr.sub==='they'?'grin':'grins'}: "Dinner's on me."`,
          ], provider + 'fishing'), badgeText: 'PROVIDER', badgeClass: 'gold' });
      } else {
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 5);
        members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.3));
        ep.campEvents[campKey].pre.push({ type: 'providerForaging', players: [provider],
          text: _pick([
            `${provider} disappears into the jungle and comes back with an armful of coconuts and wild fruit. Not glamorous, but it keeps the tribe going.`,
            `While everyone else debates strategy, ${provider} is out collecting firewood and cracking coconuts. ${pronouns(provider).Sub} ${pronouns(provider).sub==='they'?'know':'knows'} what actually matters out here.`,
          ], provider + 'forage'), badgeText: 'FORAGING', badgeClass: 'gold' });
      }
    }

    // Provider praised (tribe food < 60, separate from fishing/foraging)
    if (providers.length && tribeFood < 60 && Math.random() < 0.3) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const pr = pronouns(provider);
      members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.3));
      ep.campEvents[campKey].pre.push({ type: 'providerPraised', players: [provider],
        text: _pick([
          `"I don't know what we'd do without ${provider}," someone says at the fire. Nobody disagrees. ${pr.Sub} ${pr.sub==='they'?'have':'has'} been carrying this camp.`,
          `The tribe is running on fumes — but ${provider} keeps showing up. Fishing, firewood, water runs. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} complain. The tribe notices.`,
        ], provider + 'praised'), badgeText: 'PRAISED', badgeClass: 'gold' });
    }

    // ── Slacker events ──
    if (slackers.length && tribeFood < 50) {
      const slacker = slackers[Math.floor(Math.random() * slackers.length)];
      const spr = pronouns(slacker);
      const sS = pStats(slacker);
      // Find a bold/hothead caller
      const callers = members.filter(m => m !== slacker && (pStats(m).boldness >= 5 || pStats(m).temperament <= 5));
      if (callers.length && Math.random() < 0.35) {
        const caller = callers[Math.floor(Math.random() * callers.length)];
        const cPr = pronouns(caller);
        const cS = pStats(caller);
        const isEscalated = cS.boldness >= 7 || cS.temperament <= 3;
        addBond(caller, slacker, isEscalated ? -1.5 : -1.0);
        ep.campEvents[campKey].pre.push({ type: isEscalated ? 'slackerConfrontation' : 'slackerCalledOut',
          players: [caller, slacker],
          text: isEscalated ? _pick([
            `${caller} finally snaps. "We're out here starving and ${slacker} is lying in the shelter doing NOTHING. I'm done carrying ${spr.obj}." ${slacker} ${sS.temperament <= 4 ? `fires back: "You want to go? Let's go."` : `says nothing. The silence is worse.`}`,
            `${caller} throws a coconut shell at the shelter wall. "Get up. We need water. We need firewood. We need someone who actually DOES something." ${slacker} doesn't move. ${caller} walks away shaking ${cPr.pos} head.`,
          ], caller + slacker + 'escalated') : _pick([
            `${caller} pulls ${slacker} aside: "People are noticing that you don't help around camp. It's going to be a problem." ${slacker} shrugs. That shrug costs ${spr.obj} more than ${spr.sub} ${spr.sub==='they'?'know':'knows'}.`,
            `"Hey ${slacker}, when's the last time you went to the well?" ${caller} asks it casually, but the message is clear. The tribe is watching who works and who doesn't.`,
          ], caller + slacker + 'callout'),
          badgeText: isEscalated ? 'CONFRONTATION' : 'CALLED OUT', badgeClass: 'red' });
      }
    }

    // ── Slacker bonding (lazy alliance) ──
    if (slackers.length >= 2 && Math.random() < 0.4) {
      const [s1, s2] = slackers.slice(0, 2);
      addBond(s1, s2, 0.2);
      ep.campEvents[campKey].pre.push({ type: 'slackerBonding', players: [s1, s2],
        text: _pick([
          `While the rest of the tribe hauls water, ${s1} and ${s2} are sitting in the shelter comparing bug bites. Nobody says anything. But everyone notices.`,
          `${s1} and ${s2} have found a rhythm: wake up late, eat whatever's left, avoid eye contact with the people working. It's not a strategy. It's a lifestyle. And somehow, it's working.`,
          `"You know what? Let them fish," ${s1} says to ${s2}. "We'll handle the strategy." ${s2} nods. Neither of them has handled any strategy either. But at least they have each other.`,
        ], s1 + s2 + 'lazy'), badgeText: 'LAZY ALLIANCE', badgeClass: 'green' });
    }

    // ── Food crisis events ──
    if (tribeFood < 40 && Math.random() < 0.3) {
      const fighters = members.filter((m, i) => members.some((o, j) => j > i && getBond(m, o) < 0));
      if (fighters.length >= 2) {
        const f1 = fighters[0];
        const f2 = members.find(o => o !== f1 && getBond(f1, o) < 0) || fighters[1];
        addBond(f1, f2, -1.5);
        ep.campEvents[campKey].pre.push({ type: 'foodConflict', players: [f1, f2],
          text: _pick([
            `The rice is almost gone. ${f1} catches ${f2} taking a second scoop. "That's not yours." What follows isn't pretty.`,
            `${f1} and ${f2} argue over who ate the last of the coconut. It's not about the coconut. It's about everything. The hunger makes everything worse.`,
          ], f1 + f2 + 'food'), badgeText: 'FOOD FIGHT', badgeClass: 'red' });
      }
    }

    // Food hoarding (tribe food < 50, low loyalty player)
    if (tribeFood < 50) {
      const hoarders = members.filter(m => pStats(m).loyalty <= 4 && Math.random() < 0.1);
      const discoverers = members.filter(m => pStats(m).intuition >= 6 && !hoarders.includes(m));
      if (hoarders.length && discoverers.length) {
        const hoarder = hoarders[0], discoverer = discoverers[0];
        addBond(discoverer, hoarder, -2.0);
        members.filter(m => m !== hoarder).forEach(m => addBond(m, hoarder, -1.0));
        ep.campEvents[campKey].pre.push({ type: 'foodHoarding', players: [discoverer, hoarder],
          text: _pick([
            `${discoverer} finds a stash of coconut meat hidden under ${hoarder}'s bag. The look on ${pronouns(discoverer).pos} face says everything. ${hoarder} has been stealing from the tribe.`,
            `${discoverer} catches ${hoarder} sneaking food from the supply at night. Word spreads by morning. The tribe is furious.`,
          ], hoarder + discoverer + 'hoard'), badgeText: 'HOARDING', badgeClass: 'red' });
      }
    }

    // Starvation bond (tribe food < 35, two players with bond >= 1)
    if (tribeFood < 35) {
      const bondPairs = [];
      for (let i = 0; i < members.length; i++) for (let j = i+1; j < members.length; j++) {
        if (getBond(members[i], members[j]) >= 1) bondPairs.push([members[i], members[j]]);
      }
      if (bondPairs.length && Math.random() < 0.3) {
        const [a, b] = bondPairs[Math.floor(Math.random() * bondPairs.length)];
        addBond(a, b, 1.0);
        ep.campEvents[campKey].pre.push({ type: 'starvationBond', players: [a, b],
          text: _pick([
            `${a} and ${b} sit by a dying fire, splitting the last handful of rice between them. Nobody speaks. They don't need to. Hunger has a way of stripping everything down to what matters.`,
            `It's been two days since the tribe had a real meal. ${a} and ${b} share a coconut in silence. The game feels very far away right now.`,
          ], a + b + 'starve'), badgeText: 'SHARED SUFFERING', badgeClass: 'green' });
      }
    }

    // Food rationing (tribe food < 50, strategic player manages)
    if (tribeFood < 50) {
      const strategists = members.filter(m => pStats(m).strategic >= 7 && Math.random() < 0.2);
      if (strategists.length) {
        const mgr = strategists[0];
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 3);
        members.filter(m => m !== mgr).forEach(m => addBond(m, mgr, 0.5));
        ep.campEvents[campKey].pre.push({ type: 'foodRationing', players: [mgr],
          text: _pick([
            `${mgr} takes charge of the food. "We portion this out or we starve in three days." Nobody argues. ${pronouns(mgr).Sub} ${pronouns(mgr).sub==='they'?'count':'counts'} every grain of rice.`,
            `${mgr} implements a rationing system. Equal portions, no exceptions. The tribe doesn't love it — but they're still eating on day ${(ep.num || 1) * 3}.`,
          ], mgr + 'ration'), badgeText: 'RATIONING', badgeClass: 'gold' });
      }
    }

    // ── Food crisis (tribe food < 20) ──
    if (tribeFood < 20) {
      members.forEach(m => {
        const state = gs.playerStates[m] || {};
        if (state.emotional !== 'paranoid') state.emotional = 'desperate';
        gs.playerStates[m] = state;
      });
      ep.campEvents[campKey].pre.push({ type: 'foodCrisis', players: members.slice(0, 3),
        text: _pick([
          `The rice is gone. The coconuts are gone. The tribe sits in silence, too tired to strategize, too hungry to sleep. This is what the game looks like when the island wins.`,
          `Day ${(ep.num || 1) * 3}. No food left. The fire went out and nobody has the energy to restart it. Eyes are hollow. Conversations have stopped. The game is secondary now — survival is the game.`,
        ], campKey + 'crisis'), badgeText: 'FOOD CRISIS', badgeClass: 'red' });
    }

    // ── Collapse warning (survival < 25, realistic/brutal only) ──
    if (difficulty !== 'casual') {
      members.forEach(name => {
        const surv = gs.survival[name] || 0;
        if (surv < 25 && !gs.collapseWarning?.[name]) {
          if (!gs.collapseWarning) gs.collapseWarning = {};
          gs.collapseWarning[name] = ep.num || (gs.episode || 0) + 1;
          const pr = pronouns(name);
          const s = pStats(name);
          ep.campEvents[campKey].pre.push({ type: 'survivalCollapse', players: [name],
            text: _pick([
              `${name} collapses at the water well. ${pr.Sub} ${pr.sub==='they'?'try':'tries'} to stand — legs buckle. The tribe rushes over. ${s.temperament >= 7 ? `"I'm fine," ${pr.sub} ${pr.sub==='they'?'say':'says'}. ${pr.Sub} ${pr.sub==='they'?'are':'is'}n't fine.` : `${pr.Sub} can't hide it anymore. The body is giving out.`}`,
              `${name}'s hands are shaking too hard to hold a coconut. ${pr.Sub} ${pr.sub==='they'?'haven\'t':'hasn\'t'} eaten properly in days. The medical team is called for a check. ${s.social >= 7 ? `"Don't pull me. Please. I can do this." The medic hesitates.` : `The tribe watches in silence. Nobody knows what to say.`}`,
              `In the middle of a conversation, ${name} goes pale and sits down hard. ${pr.Sub} ${pr.sub==='they'?'stare':'stares'} at the ground, breathing heavy. This isn't strategy. This isn't the game. This is the island saying: you're running out of time.`,
            ], name + 'collapse'), badgeText: 'COLLAPSE', badgeClass: 'red' });
          // Empathetic tribemates bond
          members.filter(m => m !== name && getBond(m, name) >= 0).forEach(m => addBond(m, name, 0.5));
        }
      });
    }

    // ── Medevac (survival < 15, post-collapse, realistic/brutal) ──
    if (difficulty !== 'casual') {
      const medevacChance = difficulty === 'brutal' ? 0.12 : 0.05;
      members.forEach(name => {
        const surv = gs.survival[name] || 0;
        const collapseEp = gs.collapseWarning?.[name];
        const currentEp = ep.num || (gs.episode || 0) + 1;
        if (surv < 15 && collapseEp && currentEp > collapseEp && Math.random() < medevacChance) {
          // MEDEVAC FIRES
          const pr = pronouns(name);
          const isPostMerge = gs.isMerged;

          ep.campEvents[campKey].pre.push({ type: 'medevac', players: [name],
            text: _pick([
              `The medical team arrives at dawn. ${name} is pulled from the game. ${pr.Sub} ${pr.sub==='they'?'fight':'fights'} it — of course ${pr.sub} ${pr.sub==='they'?'do':'does'} — but the decision is made. The stretcher. The helicopter. The game goes on without ${pr.obj}.`,
              `${name} can't stand up this morning. The tribe gathers around as the medics check vitals. The verdict comes fast: "${name} is done." ${pr.Sub} ${pr.sub==='they'?'cry':'cries'}. The tribe cries. This is the part of Survivor nobody wants to see.`,
            ], name + 'medevac'), badgeText: 'MEDEVAC', badgeClass: 'red' });

          // Remove from game
          gs.activePlayers = gs.activePlayers.filter(p => p !== name);
          tribe.members = tribe.members.filter(p => p !== name);
          gs.eliminated.push(name);
          if (isPostMerge) gs.jury.push(name); // post-merge: goes to jury
          // Track medevac
          if (!gs.medevacs) gs.medevacs = [];
          gs.medevacs.push({ name, ep: currentEp, survival: surv, postMerge: isPostMerge });
          ep.medevac = { name, survival: surv, postMerge: isPostMerge };
          // Tribe morale boost (shared trauma)
          members.filter(m => m !== name && gs.activePlayers.includes(m)).forEach(m => {
            members.filter(o => o !== name && o !== m && gs.activePlayers.includes(o)).forEach(o => addBond(m, o, 0.5));
          });
          // Provider medevac = food crisis
          if (gs.currentProviders.includes(name)) {
            gs.tribeFood[campKey] = Math.max(0, (gs.tribeFood[campKey] || 0) - 15);
          }

          // ── KL-3 REPLACEMENT: most recently voted-out player returns ──
          if (seasonConfig.replacementOnMedevac && !seasonConfig.ri) {
            // Find the most recently voted-out player (not quitters, not medevaced)
            const _medevacNames = new Set((gs.medevacs || []).map(m => m.name));
            const _votedOut = gs.eliminated.filter(p => p !== name && !_medevacNames.has(p) && !gs.activePlayers.includes(p));
            const _replacement = _votedOut.length ? _votedOut[_votedOut.length - 1] : null;
            if (_replacement) {
              gs.activePlayers.push(_replacement);
              gs.eliminated = gs.eliminated.filter(p => p !== _replacement);
              // Remove from jury if they were on it
              gs.jury = (gs.jury || []).filter(p => p !== _replacement);
              // Add to tribe
              if (!isPostMerge && tribe.members) tribe.members.push(_replacement);
              // Reset survival
              if (gs.survival) gs.survival[_replacement] = 60;
              // Bonds: soften extreme negatives (time away)
              gs.activePlayers.filter(p => p !== _replacement).forEach(p => {
                if (getBond(_replacement, p) < -1) addBond(_replacement, p, 0.5);
              });

              // Returning player's mindset — personality-driven camp event
              const _rS = pStats(_replacement);
              const _rPr = pronouns(_replacement);
              // Who voted them out?
              const _votedOutEp = gs.episodeHistory?.slice().reverse().find(e => e.eliminated === _replacement);
              const _voters = _votedOutEp?.votingLog?.filter(v => v.voted === _replacement).map(v => v.voter).filter(v => gs.activePlayers.includes(v)) || [];
              const _hasEnemies = _voters.length > 0;
              let _returnText;
              if (_rS.boldness >= 7 && _hasEnemies) {
                // Vengeful — comes back aggressive
                const _enemy = _voters[0];
                _returnText = _pick([
                  `${_replacement} walks back into camp. ${_rPr.Sub} ${_rPr.sub==='they'?'scan':'scans'} the faces until ${_rPr.sub} ${_rPr.sub==='they'?'find':'finds'} ${_enemy}. "You thought you got rid of me." The temperature at camp just dropped ten degrees.`,
                  `${_replacement} is back. And ${_rPr.sub} ${_rPr.sub==='they'?'haven\'t':'hasn\'t'} forgotten. "I know exactly who wrote my name. ${_enemy} — we're going to have a conversation." The tribe watches ${_rPr.obj} like a lit fuse.`,
                ], _replacement + 'vengeful');
                addBond(_replacement, _enemy, -1.0);
              } else if (_rS.strategic >= 7) {
                // Strategic reset — recalculates everything
                _returnText = _pick([
                  `${_replacement} comes back different. Quieter. More calculated. "I had time to think about every mistake I made. This time I play with perfect information." The tribe doesn't know what to make of the new version.`,
                  `${_replacement} walks into camp and immediately starts reading the room. Who's allied with who now? What changed while ${_rPr.sub} ${_rPr.sub==='they'?'were':'was'} gone? The old ${_replacement} played with heart. This one plays with a plan.`,
                ], _replacement + 'strategic');
              } else if (_rS.loyalty >= 7 || _rS.social >= 7) {
                // Grateful/humble — rebuilds bonds
                _returnText = _pick([
                  `${_replacement} comes back with tears in ${_rPr.pos} eyes. "I didn't think I'd get this chance. I'm not wasting it." ${_rPr.Sub} hugs the first person ${_rPr.sub} ${_rPr.sub==='they'?'see':'sees'}. The tribe is shaken — but there's something genuine about the gratitude.`,
                  `"I know I was voted out. I know why. And I'm not holding grudges," ${_replacement} says. "I just want to play. Whatever happened before — clean slate." Some believe ${_rPr.obj}. Some don't.`,
                ], _replacement + 'grateful');
                gs.activePlayers.filter(p => p !== _replacement).forEach(p => addBond(_replacement, p, 0.3));
              } else {
                // Default — mixed emotions
                _returnText = _pick([
                  `${_replacement} walks back into a game ${_rPr.sub} thought was over. The tribe stares. "Yeah," ${_rPr.sub} ${_rPr.sub==='they'?'say':'says'}. "I'm back." Nobody knows what that means yet — including ${_replacement}.`,
                  `${_replacement} returns to camp. It's the same shelter, the same fire, the same people — but everything feels different. ${_rPr.Sub} ${_rPr.sub==='they'?'sit':'sits'} down quietly. The game gave ${_rPr.obj} a second chance. Now ${_rPr.sub} has to figure out what to do with it.`,
                ], _replacement + 'default');
              }

              ep.campEvents[campKey].pre.push({
                type: 'medevacReplacement', players: [_replacement, name],
                text: `${name} is out. But the game doesn't lose a player today — ${_replacement} returns to take ${pronouns(name).pos} spot. ` + _returnText,
                badgeText: 'REPLACEMENT', badgeClass: 'gold',
              });
              ep.medevacReplacement = { returned: _replacement, replaced: name, mindset: _rS.boldness >= 7 && _hasEnemies ? 'vengeful' : _rS.strategic >= 7 ? 'strategic' : _rS.loyalty >= 7 || _rS.social >= 7 ? 'grateful' : 'neutral' };
              // Refresh tribesAtStart — medevac+replacement changed the roster mid-episode
              ep.tribesAtStart = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
            }
          }
          // Even without replacement, refresh tribesAtStart after medevac removal
          if (!ep.medevacReplacement) {
            ep.tribesAtStart = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
          }
        }
      });
    }

    // ── Provider voted out aftermath (from previous episode) ──
    if (gs.providerVotedOutLastEp?.tribeName === campKey) {
      gs.tribeFood[campKey] = Math.max(0, (gs.tribeFood[campKey] || 0) - 15);
      const provider = gs.providerVotedOutLastEp.name;
      ep.campEvents[campKey].pre.push({ type: 'providerVotedOut', players: members.slice(0, 3),
        text: _pick([
          `The camp feels different without ${provider}. Nobody's fishing. Nobody's starting the fire at dawn. The tribe voted out the one person who kept them fed — and now the island is collecting the debt.`,
          `First morning without ${provider}. The rice is almost gone and nobody knows how to catch fish. "We really messed up," someone mutters. The silence that follows is deafening.`,
        ], provider + 'gone'), badgeText: 'FOOD CRISIS', badgeClass: 'red' });
      gs.providerVotedOutLastEp = null; // consume
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: MAIN EPISODE DRIVER
// ══════════════════════════════════════════════════════════════════════

// [9] TRIBAL COUNCIL BLOWUP — eliminated player with boldness >= 8 OR temperament <= 3
// who received >= 60% of votes blows up the game on the way out. Fires deterministically.
// Boldness = controlled aggression ("I have something to say before I go");
// Low temperament = emotional explosion (can't hold it in, goes off).
export function checkTribalBlowup(ep) {
  const elim = ep.eliminated;
  if (!elim || elim === 'No elimination') return;
  const s = pStats(elim);
  // Trigger: bold enough to make a scene OR hotheaded enough not to stay quiet
  if (s.boldness < 8 && s.temperament > 3) return;
  const totalVotes = Object.values(ep.votes || {}).reduce((a, b) => a + b, 0);
  if (!totalVotes) return;
  const elimVotes = (ep.votes || {})[elim] || 0;
  if (elimVotes / totalVotes < 0.60) return;
  const rollVal = ([...elim].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 31) % 100;
  const threshold = s.boldness >= 9 ? 40 : s.boldness >= 8 ? 33 : s.temperament <= 2 ? 35 : 25;
  if (rollVal >= threshold) return;

  // isHothead = low temperament is doing the work here, not high boldness
  const isHothead = s.temperament <= 3 && s.boldness < 8;
  const trigger = isHothead ? 'temperament' : 'boldness';
  const toneIdx = ([...elim].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 3) % 2;

  const tribalPlayers = ep.tribalPlayers || gs.activePlayers;
  const reveals = [];
  const revHash = ([...elim].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 7) % 3;

  // Callout: expose the orchestrator (always fires if one exists)
  const spearAlliance = (ep.alliances||[]).find(a => a.target === elim && a.type !== 'solo');
  const spearhead = spearAlliance?.leader || spearAlliance?.members?.[0];
  if (spearhead) {
    const calloutLines = isHothead ? [
      `Are you KIDDING me?! ${spearhead}! Every vote — EVERY vote — has been ${spearhead}'s call! And you all just go along with it like that's okay!`,
      `Oh I'm going? Fine. But ${spearhead} is sitting there right now laughing at every single one of you. Every. One.`
    ] : [
      `Let me tell you something before I leave — ${spearhead} has been calling every vote in this game. Everyone here has been playing ${spearhead}'s game and half of you don't even realize it.`,
      `This was ${spearhead}'s move. It always is. You all voted how you were told. Think about that on the walk back to camp.`
    ];
    reveals.push({
      type: 'callout',
      text: calloutLines[toneIdx],
      consequence: `${spearhead} exposed as the strategic center. Bond hits with all tribemates.`
    });
    if (!gs.publicKnowledge) gs.publicKnowledge = {};
    gs.publicKnowledge[`${spearhead}_organizer_ep${ep.num}`] = { type: 'organizer', player: spearhead, ep: ep.num };
    tribalPlayers.filter(p => p !== elim && p !== spearhead).forEach(m => addBond(spearhead, m, -0.5));
    if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
    gs.blowupHeatNextEp.add(spearhead);
  }

  // Idol callout (fires if revHash >= 1 and a holder exists)
  if (revHash >= 1) {
    const idolAdv = gs.advantages?.find(a => a.type === 'idol' && tribalPlayers.includes(a.holder) && a.holder !== elim);
    if (idolAdv) {
      const holder = idolAdv.holder;
      const idolLines = isHothead ? [
        `You want to talk about fair?! ${holder} has been sitting on a hidden immunity idol this WHOLE time! That's fair to everybody?!`,
        `${holder}! Check ${holder}'s bag right now! They've had an idol for days and nobody's saying ANYTHING!`
      ] : [
        `One more thing before I go — ${holder} has an idol. Has had it for a while now. You're welcome.`,
        `Ask ${holder} what's in their bag. Just ask. I'll wait.`
      ];
      reveals.push({
        type: 'idol',
        text: idolLines[toneIdx],
        consequence: `${holder}'s idol is now public knowledge. They become the next priority target.`
      });
      if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
      gs.knownIdolHoldersThisEp.add(holder);
      if (!gs.publicKnowledge) gs.publicKnowledge = {};
      gs.publicKnowledge[`${holder}_idol_ep${ep.num}`] = { type: 'idol', player: holder, ep: ep.num };
    }
  }

  // Alliance exposure (fires if revHash >= 2)
  if (revHash >= 2) {
    const bloc = (ep.alliances||[]).find(a => a.type !== 'solo' && (a.members?.length||0) >= 3 && !a.members.includes(elim));
    if (bloc) {
      const firstMember = bloc.members?.[0] || 'someone';
      const allianceLines = isHothead ? [
        `${bloc.label}! Does anyone here even KNOW about ${bloc.label}?! They've had this entire game locked from the start and none of you are in it!`,
        `You know what, just ask ${firstMember} about ${bloc.label}. Just ask. See what they say. See if they can keep a straight face.`
      ] : [
        `${bloc.label}. That's the alliance that's been controlling every vote. Ask ${firstMember} what that means to them.`,
        `There's a reason this game has been going one direction the whole time. It's called ${bloc.label}. You might want to worry about that.`
      ];
      reveals.push({
        type: 'alliance',
        text: allianceLines[toneIdx],
        consequence: `${bloc.label} alliance is now public. Members carry heat into the next tribal.`
      });
      if (!gs.publicKnowledge) gs.publicKnowledge = {};
      gs.publicKnowledge[`${bloc.label}_exposed_ep${ep.num}`] = { type: 'alliance', alliance: bloc.label, ep: ep.num };
      if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
      bloc.members?.forEach(m => gs.blowupHeatNextEp.add(m));
    }
  }

  if (!reveals.length) return;
  ep.tribalBlowup = { player: elim, boldness: s.boldness, temperament: s.temperament, trigger, reveals };
}

// ── Crashout game effects — fires when checkTribalBlowup didn't (boldness 7, any vote%) ──
// window.buildCrashout() generates the visual; this applies the actual mechanical consequences.
export function applyCrashoutEffects(ep) {
  if (ep.tribalBlowup) return; // checkTribalBlowup already applied effects
  const elim = ep.eliminated;
  if (!elim || elim === 'No elimination') return;
  const s = pStats(elim);
  if (s.boldness < 7) return;
  const roll = ([...elim].reduce((a,c) => a+c.charCodeAt(0), 0) + ep.num * 17) % 100;
  const threshold = s.boldness >= 9 ? 50 : s.boldness >= 8 ? 38 : 25;
  if (roll >= threshold) return;

  const alliances = ep.alliances || [];
  const tribalPlayers = ep.tribalPlayers || gs.activePlayers;
  if (!gs.publicKnowledge) gs.publicKnowledge = {};

  if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();

  // Callout: expose the orchestrator — bond hit + heat for the named player
  const againstBloc = alliances.find(a => a.target === elim && a.type !== 'solo' && a.members?.length);
  if (againstBloc) {
    const spearhead = againstBloc.members[0];
    gs.publicKnowledge[`${spearhead}_organizer_ep${ep.num}`] = { type: 'organizer', player: spearhead, ep: ep.num };
    tribalPlayers.filter(p => p !== elim && p !== spearhead).forEach(m => addBond(spearhead, m, -0.5));
    gs.blowupHeatNextEp.add(spearhead);
  }

  // Alliance exposure: their own alliance composition goes public — mild heat on all members
  const theirAlliance = alliances.find(a => a.members?.includes(elim) && a.type !== 'solo' && a.members.length > 1);
  if (theirAlliance) {
    const others = theirAlliance.members.filter(m => m !== elim && gs.activePlayers.includes(m));
    if (others.length) {
      gs.publicKnowledge[`${theirAlliance.label || 'alliance'}_exposed_ep${ep.num}`] = { type: 'alliance', alliance: theirAlliance.label || '?', ep: ep.num };
      others.forEach(m => {
        tribalPlayers.filter(p => p !== m && !others.includes(p)).forEach(o => addBond(m, o, -0.3));
        gs.blowupHeatNextEp.add(m);
      });
    }
  }
}

// ── Post-tribal consequences: close calls, lost allies, vote discovery ──
// Runs after detectBetrayals(). Stores narrative triggers in gs.discoveredVotesLastEp
// which generateCampEvents() consumes as pre-events in the NEXT episode.
export function applyPostTribalConsequences(ep) {
  const vlog = ep.votingLog || [];
  if (!vlog.length) return;

  const active = gs.activePlayers;
  const elim = ep.eliminated;
  const isOpen = !!ep.openVote;

  if (!gs.discoveredVotesLastEp) gs.discoveredVotesLastEp = [];
  if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();

  // Bond hit scaled by prior relationship
  const scaledHit = (a, b) => {
    const prior = getBond(a, b);
    if (prior >= 1)    return -1.0; // betrayal
    if (prior >= -0.5) return -0.5; // neutral
    return -0.2;                    // already negative — confirms what they knew
  };

  // Deterministic per-episode roll (avoids run-to-run variance from Math.random)
  const epSeed = ep.num * 31;
  const pctRoll = (key, extra) =>
    ([...key].reduce((s, c) => s + c.charCodeAt(0), 0) + epSeed + extra * 17) % 100;

  // Build vote counts (exclude game-generated votes)
  const voteCounts = {};
  vlog.forEach(({ voter, voted }) => {
    if (voter !== 'THE GAME' && voted) voteCounts[voted] = (voteCounts[voted] || 0) + 1;
  });

  // ── 1. CLOSE CALL: survivors who received 2+ votes ──
  // Each voter gets an immediate bond hit toward the survivor — no discovery needed, it was visible.
  Object.entries(voteCounts).forEach(([target, count]) => {
    if (count < 2 || !active.includes(target)) return;
    vlog.filter(l => l.voted === target && l.voter !== 'THE GAME' && active.includes(l.voter))
        .forEach(({ voter }) => addBond(voter, target, -0.5));
  });

  // ── 2. LOST ALLY: surviving alliance members resent who voted out their ally ──
  if (elim && elim !== 'No elimination') {
    const allyAlliance = (gs.namedAlliances || []).find(a =>
      a.members?.includes(elim) && a.type !== 'solo' && a.members.length > 1
    );
    if (allyAlliance) {
      const survivors = allyAlliance.members.filter(m => active.includes(m));
      const votersAgainst = vlog
        .filter(l => l.voted === elim && l.voter !== 'THE GAME' && active.includes(l.voter))
        .map(l => l.voter);
      survivors.forEach(ally => {
        votersAgainst.forEach(voter => {
          if (voter === ally) return;
          // Open vote = always knows; closed = 40% + intuition*3%
          const threshold = 40 + (pStats(ally).intuition || 5) * 3;
          const knows = isOpen || pctRoll(ally + voter, ep.num) < threshold;
          if (!knows) return;
          addBond(ally, voter, scaledHit(ally, voter));
          gs.blowupHeatNextEp.add(ally);
          gs.discoveredVotesLastEp.push({ type: 'lost-ally', ally, voter, elim });
        });
      });
    }
  }

  // ── 3. VOTE DISCOVERY: targets figure out who wrote their name ──
  Object.entries(voteCounts).forEach(([target, count]) => {
    if (!active.includes(target)) return; // eliminated — skip
    const targetVoters = vlog.filter(l => l.voted === target && l.voter !== 'THE GAME' && active.includes(l.voter));
    if (!targetVoters.length) return;

    const intuition = pStats(target).intuition || 5;
    const isIsolated = count === 1;
    // If target voted for the boot they were in the majority — less paranoid, lower discovery
    const votedForBoot = elim && vlog.some(l => l.voter === target && l.voted === elim);

    let threshold;
    if (isOpen)       threshold = 100; // open vote — everyone knows
    else if (isIsolated)  threshold = 80;  // sole vote — nobody else wrote that name
    else if (votedForBoot) threshold = 15; // majority voter, not worried about counter-votes
    else              threshold = 30 + Math.round(intuition * 2); // 30–50% intuition-gated

    targetVoters.forEach(({ voter }) => {
      if (threshold < 100 && pctRoll(target + voter, ep.num + 7) >= threshold) return;
      addBond(target, voter, scaledHit(target, voter));
      gs.discoveredVotesLastEp.push({ type: 'vote-discovery', target, voter });
    });
  });

  // ── 4. MISCOMMUNICATION FALLOUT: voter accidentally eliminated their own ally ──
  if (elim && ep.voteMiscommunications?.length) {
    ep.voteMiscommunications.forEach(mc => {
      if (mc.actual !== elim) return; // misfire didn't land on the eliminated player — no extra consequences
      const miscVoter = mc.voter;
      if (!active.includes(miscVoter)) return;

      // Check if the misfire actually changed the outcome
      // (would the eliminated player have survived without this accidental vote?)
      const elimVoteCount = voteCounts[elim] || 0;
      const secondHighest = Object.entries(voteCounts).filter(([n]) => n !== elim).sort(([,a],[,b]) => b-a)[0]?.[1] || 0;
      const misfireChangedOutcome = elimVoteCount - 1 <= secondHighest; // without this vote, it would've been tied or someone else goes

      // Were they in the same alliance? That makes it much worse
      const sharedAlliance = (gs.namedAlliances || []).find(a =>
        a.active && a.members.includes(miscVoter) && a.members.includes(elim));

      if (sharedAlliance) {
        // Voted out your own ally by accident — devastating
        addBond(elim, miscVoter, misfireChangedOutcome ? -3.0 : -1.5);
        // Other alliance members lose trust in the miscommunicator
        sharedAlliance.members.filter(m => m !== miscVoter && m !== elim && active.includes(m))
          .forEach(m => addBond(m, miscVoter, misfireChangedOutcome ? -1.0 : -0.5));
      } else if (getBond(miscVoter, elim) >= 1.5) {
        // Not in same alliance but had a bond — still bad
        addBond(elim, miscVoter, misfireChangedOutcome ? -2.0 : -1.0);
      }

      // Save for next-episode camp events
      if (!gs.miscommunicationFallout) gs.miscommunicationFallout = [];
      gs.miscommunicationFallout.push({
        voter: miscVoter, eliminated: elim, intended: mc.intended,
        alliance: mc.alliance, changedOutcome: misfireChangedOutcome,
        wasAlly: !!sharedAlliance
      });
    });
  }
}

export function handleExileFormat(ep) {
  const cfg = seasonConfig;
  if (!cfg.exile || gs.activePlayers.length <= 4) return;
  if (gs.phase === 'finale') return;
  // Phase check: pre = pre-merge only, post = post-merge only, both = always
  const phase = cfg.exilePhase || 'both';
  if (phase === 'pre' && gs.isMerged) return;
  if (phase === 'post' && !gs.isMerged) return;
  // Don't fire on special episode types
  if (ep.isMultiTribal || ep.isDoubleTribal || ep.isSlasherNight || ep.isSuddenDeath || ep.isTripleDogDare) return;
  // Don't double up with exile-island twist (which handles its own exile selection)
  if (ep.exileIslandPending) return;
  // Don't double up with schoolyard pick exile (unpicked player already on exile)
  if (ep.schoolyardPick?.exiled) return;

  let _exiled = null, _chooser = null, _chooserTribe = null, _chooserMembers = null;

  if (!gs.isMerged && ep.winner && ep.loser) {
    // Pre-merge: winning tribe picks from losing tribe
    const _winM = ep.winner.members.filter(m => gs.activePlayers.includes(m));
    const _losM = ep.loser.members.filter(m => gs.activePlayers.includes(m));
    if (_winM.length && _losM.length) {
      _chooserTribe = ep.winner.name;
      _chooserMembers = _winM;
      _exiled = wRandom(_losM, n => Math.max(0.1, pStats(n).intuition * 0.35 + pStats(n).strategic * 0.15 + 0.5));
    }
  } else if (gs.isMerged && ep.immunityWinner) {
    // Post-merge: immunity winner picks (excludes immune players)
    _chooser = ep.immunityWinner;
    const _eligible = gs.activePlayers.filter(p => p !== ep.immunityWinner && p !== ep.sharedImmunity && p !== ep.secondImmune);
    if (_eligible.length) {
      _exiled = wRandom(_eligible, n => Math.max(0.1, pStats(n).intuition * 0.35 + pStats(n).strategic * 0.15 + 0.5));
    }
  }

  if (!_exiled) return;

  gs.exiledThisEp = _exiled;
  ep.exileFormatMode = true; // flag: don't remove from tribal, clear exile before vote

  // Bond consequences
  if (_chooser) addBond(_exiled, _chooser, -1.5); // post-merge: personal pick carries cost
  if (!gs.isMerged && ep.loser) {
    // Strategists may exploit the absence — vote out the missing player's closest ally
    const _opp = ep.loser.members.filter(p => p !== _exiled && gs.activePlayers.includes(p) && pStats(p).strategic >= 6);
    if (_opp.length && Math.random() < 0.35) {
      const _plotter = _opp[Math.floor(Math.random() * _opp.length)];
      ep.loser.members.filter(p => p !== _exiled && p !== _plotter && gs.activePlayers.includes(p)).forEach(p => addBond(_exiled, p, -0.5));
    }
  }

  // Survival drain — exile island is harsh (no food, no shelter, no fire)
  if (seasonConfig.foodWater === 'enabled' && gs.survival) {
    const _exEndurance = pStats(_exiled).endurance || 5;
    const _exDrain = 12 - _exEndurance * 0.4; // high endurance = less drain (8-12 range)
    gs.survival[_exiled] = Math.max(0, (gs.survival[_exiled] || 80) - _exDrain);
  }

  // Store data for VP and for the search block below
  ep.exileFormatData = { exiled: _exiled, chooser: _chooser, chooserTribe: _chooserTribe, chooserMembers: _chooserMembers, exileFound: null };
}

export function simulateEpisode() {
  if (!gs?.initialized || !players.length) return null;
  // Save full checkpoint before any mutation so this episode can be replayed
  const _cpNum = gs.episode + 1;
  gsCheckpoints[_cpNum] = JSON.parse(JSON.stringify(gs));
  repairGsSets(gsCheckpoints[_cpNum]);
  try { localStorage.setItem('simulator_cp_' + _cpNum, JSON.stringify(gsCheckpoints[_cpNum])); } catch(e) {}
  const cfg = seasonConfig;
  // Fire-making / Koh-Lanta force F4 finale — override every episode start
  if ((cfg.firemaking || cfg.finaleFormat === 'fire-making' || cfg.finaleFormat === 'koh-lanta') && cfg.finaleSize < 4) cfg.finaleSize = 4;
  const epNum = gs.episode + 1;
  const ep = { num: epNum, bondChanges: [], riDuel: null, isRIReentry: false, isMerge: false,
                idolFinds: [], idolPlays: [], idolRehide: false, journey: null, twist: null, twists: [], campEvents: {},
                revoteVotes: null, revoteLog: null, isRockDraw: false,
                tribesAtStart: gs.tribes.map(t => ({ name: t.name, members: [...t.members] })),
                exileDuelPlayerAtStart: gs.exileDuelPlayer || null };

  // ── RETURN KIDNAPPED PLAYER to their original tribe ──
  if (gs.kidnappedPlayer) {
    const _kr = gs.kidnappedPlayer;
    const _fromT = gs.tribes.find(t => t.name === _kr.from);
    if (_fromT && !_fromT.members.includes(_kr.name)) _fromT.members.push(_kr.name);
    // Drama event: what happened while they were gone?
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const _krP = pronouns(_kr.name);
    if (_kr.wasInDanger) {
      ep.twistNarrativeEvents[_kr.from + '_return'] = { type: 'rumor', players: [_kr.name], text:
        `${_kr.name} walks back into ${_kr.from} camp. Someone was voted out while ${_krP.sub} ${_krP.sub==='they'?'were':'was'} gone. ${_krP.Sub} ${_krP.sub==='they'?'scan':'scans'} the faces — trying to figure out who survived and who didn't. The tribe watches ${_krP.obj} like a stranger.` };
    } else {
      ep.twistNarrativeEvents[_kr.from + '_return'] = { type: 'doubt', players: [_kr.name], text:
        `${_kr.name} returns from ${_kr.to}. The tribe wants to know what ${_krP.sub} said over there, who ${_krP.sub} bonded with, what information ${_krP.sub} gave up. ${_kr.name} smiles. The answers don't come easy.` };
    }
    delete gs.kidnappedPlayer;
  }

  // ── RESET EPISODE VOTE-LOSS & TWIST FLAGS ──
  // Preserve journey lost votes until the player actually attends tribal (dedup to prevent stale repeats)
  // Post-merge: everyone attends tribal, so clear all journey lost votes — they should only last one tribal
  if (gs.isMerged) {
    gs.journeyLostVotes = [];
    gs.lostVotes = [];
  } else {
    const _journeyCarry = [...new Set((gs.journeyLostVotes || []).filter(p => gs.activePlayers.includes(p)))];
    gs.journeyLostVotes = _journeyCarry;
    gs.lostVotes = [..._journeyCarry];
  }
  ep.bewareLostVotes = [];
  // Carry forward persistent idol knowledge, then reset episode-specific set
  if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
  // Merge episode knowledge into persistent memory
  (gs.knownIdolHoldersThisEp || new Set()).forEach(name => gs.knownIdolHoldersPersistent.add(name));
  // Clean out players who no longer have an idol (played it, got voted out, KiP'd)
  gs.knownIdolHoldersPersistent.forEach(name => {
    if (!gs.advantages.some(a => a.type === 'idol' && a.holder === name)) gs.knownIdolHoldersPersistent.delete(name);
  });
  // Episode set starts with persistent knowledge + gets new discoveries added during the ep
  gs.knownIdolHoldersThisEp = new Set(gs.knownIdolHoldersPersistent);
  // Known Second Life Amulet holders — persists like idol knowledge
  if (!gs.knownAmuletHoldersPersistent) gs.knownAmuletHoldersPersistent = new Set();
  gs.knownAmuletHoldersPersistent.forEach(name => {
    if (!gs.advantages.some(a => a.type === 'secondLife' && a.holder === name)) gs.knownAmuletHoldersPersistent.delete(name);
  });
  gs.knownAmuletHoldersThisEp = new Set(gs.knownAmuletHoldersPersistent);
  gs.socialBombHeatThisEp = new Set(); // cleared each episode — only affects current tribal
  // blowupHeatNextEp is NOT reset here — it carries from last episode's tribal blowup/crashout
  // and is consumed by computeHeat() during alliance formation. Stale entries are harmless
  // since computeHeat only fires for players still in tribalPlayers.
  if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
  // Beware holders lose their vote each tribal until all tribes have found their beware
  // Skip if this is a merge episode — bewares activate at merge and votes are restored
  const _willMerge = !gs.isMerged && gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
  if (gs.bewares && seasonConfig.advantages?.beware?.enabled && !_willMerge) {
    Object.values(gs.bewares).forEach(b => {
      if (b.holder && !b.activated && gs.activePlayers.includes(b.holder)) {
        gs.lostVotes.push(b.holder);
        ep.bewareLostVotes.push(b.holder);
      }
    });
  }
  gs.exiledThisEp = null;
  gs.penaltyVoteThisEp = null;
  // Clean up perceived bonds for eliminated players
  if (gs.perceivedBonds) {
    Object.keys(gs.perceivedBonds).forEach(k => {
      const [from, to] = k.split('→');
      if (!gs.activePlayers.includes(from) || !gs.activePlayers.includes(to)) delete gs.perceivedBonds[k];
    });
  }
  // ── BLACK VOTE: stage pending black votes — consumed AFTER tribal if the target attended ──
  if (!gs.blackVotes) gs.blackVotes = []; // safety init for saves/checkpoints without this field
  if (gs.blackVotes.length) {
    const _bvToApply = gs.blackVotes.filter(bv => bv.type === 'classic' && gs.activePlayers.includes(bv.target));
    if (_bvToApply.length) {
      const _bv = _bvToApply[0];
      gs.penaltyVoteThisEp = _bv.target;
      gs._activeBlackVote = _bv; // accessible from simulateVotes (which doesn't have ep)
      ep.blackVoteApplied = _bv;
      ep.blackVotePending = _bv; // mark for consumption after tribal confirms target was there
    }
  }
  gs.guaranteedImmuneThisEp = null;
  gs._chalStandouts = null;
  // Clear per-episode eavesdrop boost flags
  Object.values(gs.playerStates).forEach(s => { delete s.eavesdropBoostThisEp; });
  gs._chalStragglers = null;
  gs.journeyForcedThisEp = false;
  // SID is a season-wide rule if enabled in config; disabled at F5 or smaller (too few players)
  gs.shotInDarkEnabledThisEp = (cfg.shotInDark || false) && gs.activePlayers.length >= 5;

  // ── RI RE-ENTRY (fires FIRST so returnee participates in twists, challenge, camp, tribal) ──
  if (!gs.riReturnCount) gs.riReturnCount = 0;
  const isReentry = cfg.ri && gs.riPlayers.length > 0 && (
    (gs.riReturnCount === 0 && gs.activePlayers.length <= cfg.riReentryAt) ||
    (gs.riReturnCount === 1 && (cfg.riReturnPoints || 1) >= 2 && gs.activePlayers.length <= (cfg.riSecondReturnAt || 5))
  );
  if (isReentry) {
    ep.isRIReentry = true;
    if (cfg.riFormat === 'rescue') {
      const challenge = RI_DUEL_CHALLENGES[Math.floor(Math.random() * RI_DUEL_CHALLENGES.length)];
      const _rescuePlayers = [...gs.riPlayers];
      const winner = wRandom(_rescuePlayers, n => {
        const base = Math.max(0.1, challenge.stat(pStats(n)) + Math.random() * 3);
        const daysOn = epNum - (gs.riArrivalEp?.[n] || epNum);
        return base + daysOn * 0.5;
      });
      const losers = _rescuePlayers.filter(p => p !== winner);
      ep.riReentrant = winner; ep.riReentryLosers = losers;
      ep.riReentry = { winner, losers, challengeType: challenge.id, challengeLabel: challenge.name };
      ep.rescueReturnChallenge = { winner, losers, challengeType: challenge.id, challengeLabel: challenge.name };
      if (gs.riReturnCount === 0) { gs.riPlayers = []; } else { gs.riPlayers = gs.riPlayers.filter(p => !_rescuePlayers.includes(p)); }
      losers.forEach(l => { gs.eliminated.push(l); gs.jury.push(l); });
      gs.activePlayers.push(winner);
      gs.riReturnCount++;
      if (!gs.isMerged && gs.tribes.length) {
        const smallest = [...gs.tribes].sort((a,b) => a.members.length-b.members.length)[0];
        smallest.members.push(winner);
      }
      if (gs.playerStates?.[winner]) gs.playerStates[winner].emotional = 'confident';
      gs.activePlayers.forEach(p => {
        if (p === winner) return;
        const bond = getBond(winner, p);
        if (bond >= 3) addBond(winner, p, 1.0);
        else if (bond <= -2) addBond(winner, p, -0.5);
      });
      (gs.riAlliancesFormed || []).filter(a => a.members.includes(winner)).forEach(a => {
        const allyInGame = a.members.find(m => m !== winner && gs.activePlayers.includes(m));
        if (allyInGame) addBond(winner, allyInGame, 1.5);
      });
    } else {
      const _riResult = simulateRIReentry(gs.riPlayers);
      const winner = _riResult.winner;
      const losers = _riResult.losers;
      ep.riReentrant = winner; ep.riReentryLosers = losers;
      ep.riReentry = { winner, losers, challengeType: _riResult.challengeType, challengeLabel: _riResult.challengeLabel };
      gs.riPlayers = [];
      losers.forEach(l => { gs.eliminated.push(l); if (gs.isMerged) gs.jury.push(l); });
      gs.activePlayers.push(winner);
      gs.riReturnCount++;
      if (!gs.isMerged && gs.tribes.length) {
        const smallest = [...gs.tribes].sort((a,b) => a.members.length-b.members.length)[0];
        smallest.members.push(winner);
      }
      Object.keys(gs.bonds).forEach(k => { if (k.includes(winner) && gs.bonds[k] < -1) gs.bonds[k] = -1; });
      gs.activePlayers.forEach(p => {
        if (p === winner) return;
        const bond = getBond(winner, p);
        if (bond >= 3) addBond(winner, p, 1.0);
        else if (bond <= -2) addBond(winner, p, -0.5);
      });
    }
    // Update tribesAtStart to include the returnee
    ep.tribesAtStart = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
  }

  // ── TWIST CHECK ──
  // Filter incompatible twists: if two immunity twists conflict, keep the first scheduled
  // Auto-inject reward challenge when survival + auto-reward is enabled (stops at F4)
  if (cfg.autoRewardChallenges && cfg.foodWater === 'enabled' && gs.activePlayers.length > 4) {
    const _hasReward = (cfg.twistSchedule||[]).some(t => Number(t.episode) === epNum && t.type === 'reward-challenge');
    if (!_hasReward) {
      if (!cfg.twistSchedule) cfg.twistSchedule = [];
      cfg.twistSchedule.push({ episode: epNum, type: 'reward-challenge', id: 'auto-reward-' + epNum });
    }
  }
  const _rawScheduled = (cfg.twistSchedule||[]).filter(t => Number(t.episode) === epNum);
  const _usedTypes = new Set();
  const scheduledTwists = _rawScheduled.filter(twist => {
    const cat = TWIST_CATALOG.find(c => c.id === twist.type);
    const incomp = cat?.incompatible || [];
    if (incomp.some(ic => _usedTypes.has(ic))) return false; // blocked by already-scheduled twist
    _usedTypes.add(twist.type);
    return true;
  });
  // ── Aftermath Fan Vote return: winner comes back at the start of this episode ──
  if (gs.pendingFanVoteReturn) {
    const _fvReturnee = gs.pendingFanVoteReturn;
    if (gs.eliminated.includes(_fvReturnee) && !gs.activePlayers.includes(_fvReturnee)) {
      gs.eliminated = gs.eliminated.filter(p => p !== _fvReturnee);
      gs.jury = (gs.jury || []).filter(p => p !== _fvReturnee);
      gs.activePlayers.push(_fvReturnee);
      if (gs.phase === 'pre-merge' && gs.tribes.length) {
        const _smallest = [...gs.tribes].sort((a, b) => a.members.length - b.members.length)[0];
        if (_smallest) _smallest.members.push(_fvReturnee);
      }
      // Soften extreme negative bonds (time away shifts perspective)
      Object.keys(gs.bonds).forEach(k => {
        if (k.includes(_fvReturnee) && gs.bonds[k] < -1) gs.bonds[k] = -1;
      });
      ep.fanVoteReturnee = _fvReturnee;
      ep.twists.push({ type: 'fan-vote-return', returnee: _fvReturnee });
    }
    delete gs.pendingFanVoteReturn;
  }

  // ── Schoolyard Pick exile return: exiled player joins the tribe that lost someone last tribal ──
  if (gs._schoolyardExiled) {
    const _syExiled = gs._schoolyardExiled;
    const _syEmotion = gs._schoolyardExiledEmotion || 'shame';
    const _syScores = gs._schoolyardExiledScores || {};
    // Find which tribe lost a member last episode — smallest tribe (player already removed from roster)
    const _losingTribe = [...gs.tribes].sort((a, b) => a.members.length - b.members.length)[0];
    if (_losingTribe) {
      _losingTribe.members.push(_syExiled);
      if (!gs.activePlayers.includes(_syExiled)) gs.activePlayers.push(_syExiled);
      ep.schoolyardExileReturn = { player: _syExiled, tribe: _losingTribe.name, emotion: _syEmotion, emotionScores: _syScores };
      // Refresh tribesAtStart — the snapshot was taken BEFORE this return
      ep.tribesAtStart = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    }
    delete gs._schoolyardExiled;
    delete gs._schoolyardExiledEmotion;
    delete gs._schoolyardExiledScores;
  }

  // Sort twist processing order: first-impressions FIRST (changes rosters) → returns → eliminations → everything else
  // First-impressions must fire before any other twist so roster changes are visible to subsequent twists
  // Returns first so returnees are in the active pool for ambassador selection
  // Eliminations before rewards so eliminated players don't compete in reward challenges
  scheduledTwists.sort((a, b) => {
    const aCat = TWIST_CATALOG.find(c => c.id === a.type)?.category || '';
    const bCat = TWIST_CATALOG.find(c => c.id === b.type)?.category || '';
    const aOrder = a.type === 'first-impressions' ? -1 : aCat === 'returns' ? 0 : aCat === 'elim' ? 1 : 2;
    const bOrder = b.type === 'first-impressions' ? -1 : bCat === 'returns' ? 0 : bCat === 'elim' ? 1 : 2;
    return aOrder - bOrder;
  });
  scheduledTwists.forEach((twist, i) => applyTwist(ep, twist, i === 0));
  // Refresh tribesAtStart after team-changing twists (swap, dissolve, expansion, mutiny, abduction)
  const _teamTwists = ['tribe-swap','tribe-dissolve','tribe-expansion','mutiny','abduction','first-impressions','schoolyard-pick'];
  if (ep.twists.some(t => _teamTwists.includes(t.type))) {
    // Track who changed tribes for Trigger H (swap loyalty assumption)
    const _oldTribes = ep.tribesAtStart || [];
    const _curEpNum = (gs.episode || 0) + 1;
    if (!gs._recentSwaps) gs._recentSwaps = {};
    gs.activePlayers.forEach(name => {
      const oldTribe = _oldTribes.find(t => t.members.includes(name))?.name;
      const newTribe = gs.tribes.find(t => t.members.includes(name))?.name;
      if (oldTribe && newTribe && oldTribe !== newTribe) {
        gs._recentSwaps[name] = _curEpNum;
      }
    });
    ep.tribesAtStart = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
  }

  // ── RI LIFE EVENTS ──
  // Rescue format: generate every episode (no duels, full social game)
  // Redemption format: only solo events here (1 on RI). Pre-duel events handled in post-elimination handler.
  if (!isReentry && cfg.ri && gs.riPlayers.length > 0) {
    if (cfg.riFormat === 'rescue') {
      generateRescueIslandLife(ep);
    } else if (gs.riPlayers.length === 1) {
      generateRILifeEvents(ep);
    }
  }

  // ── MERGE CHECK ──
  // Use pre-return player count so returns don't prevent merge from firing
  // Subtract RI returns and twist-based returns (second-chance, returning-player)
  const _twistReturns = (ep.twists || []).reduce((sum, t) => {
    if (t.type === 'second-chance' && t.returnee) return sum + 1;
    if (t.type === 'returning-player' && t.returnees?.length) return sum + t.returnees.length;
    return sum;
  }, 0);
  const _preReturnActive = gs.activePlayers.length - (isReentry ? 1 : 0) - _twistReturns;
  const isMerge = !gs.isMerged && _preReturnActive <= cfg.mergeAt;
  if (isMerge) {
    ep.isMerge = true; gs.isMerged = true; gs.phase = 'post-merge'; gs.tribes = [];
    gs.sitOutHistory = {}; // sit-out back-to-back rule doesn't carry into individual game
    gs.advantagesFoundThisPhase = {}; // reset per-phase advantage caps (e.g., KiP 1 pre + 1 post)
    if (cfg.advantages?.idol?.enabled) gs.mergeIdolHidden = cfg.idolsAtMerge ?? 1;
    // Transfer tribe food to merged pool — average of pre-merge tribes (NO automatic feast bonus)
    if (seasonConfig.foodWater === 'enabled' && gs.tribeFood) {
      const _preMergeFoods = Object.values(gs.tribeFood).filter(v => v > 0);
      const _avgFood = _preMergeFoods.length ? _preMergeFoods.reduce((s, v) => s + v, 0) / _preMergeFoods.length : 60;
      gs.tribeFood = {};
      gs.tribeFood[gs.mergeName || 'merge'] = Math.min(100, _avgFood);
      // Feast bonus only if a merge-reward or the-feast twist is scheduled this episode
      const _hasMergeFeast = (cfg.twistSchedule || []).some(t => Number(t.episode) === epNum && (t.type === 'merge-reward' || t.type === 'the-feast'));
      if (_hasMergeFeast) {
        gs.tribeFood[gs.mergeName || 'merge'] = Math.min(100, gs.tribeFood[gs.mergeName || 'merge'] + 30);
        gs.activePlayers.forEach(p => { gs.survival[p] = Math.min(100, (gs.survival[p] || 80) + 20); });
      }
    }
    // Beware Advantage: activate all found bewares at merge — tribes no longer exist, condition can never be met
    if (gs.bewares) {
      Object.values(gs.bewares).forEach(b => {
        if (b.holder && !b.activated && gs.activePlayers.includes(b.holder)) {
          b.activated = true;
          gs.lostVotes = (gs.lostVotes || []).filter(p => p !== b.holder);
          if (!gs.advantages.some(a => a.type === 'idol' && a.fromBeware && a.holder === b.holder)) {
            gs.advantages.push({ holder: b.holder, type: 'idol', foundEp: gs.episode, fromBeware: true });
          }
        }
      });
      ep.bewareLostVotes = [];
    }
    // Team Swap: useless post-merge (can't swap tribes), auto-remove
    const _tsRemoved = gs.advantages.filter(a => a.type === 'teamSwap');
    if (_tsRemoved.length) {
      _tsRemoved.forEach(a => {
        gs.advantages.splice(gs.advantages.indexOf(a), 1);
        gs.knownTeamSwapHolders?.delete(a.holder);
      });
      ep.teamSwapExpiredAtMerge = _tsRemoved.map(a => a.holder);
    }
  }

  // ── NO TRIBAL — flag only; the episode runs normally (challenge, camp, etc.)
  // The actual skip happens after the challenge, right before the vote.
  const _hasNoTribalTwist = ep.noTribal
    || ep.twist?.type === 'no-tribal'
    || ep.twists?.some(t => t.type === 'no-tribal')
    || (cfg.twistSchedule||[]).some(t => Number(t.episode) === epNum && t.type === 'no-tribal');
  if (_hasNoTribalTwist) ep.noTribal = true;
  // ── SLASHER NIGHT — round-by-round survival challenge replaces immunity + tribal ──
  if (ep.isSlasherNight) {
    // Pre-slasher: journey, advantages, camp events fire normally
    simulateJourney(ep); findAdvantages(ep);
    if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
    generateCampEvents(ep, 'pre');
    checkMoleSabotage(ep);
    updatePerceivedBonds(ep);

    // Run the slasher night challenge
    simulateSlasherNight(ep);

    // Set results from slasher night
    ep.eliminated = ep.slasherNight.eliminated;
    ep.immunityWinner = ep.slasherNight.immunityWinner;
    ep.challengeType = 'slasher-night';

    // Post-slasher camp reactions
    generateCampEvents(ep, 'post');

    // Handle elimination — with RI check
    if (ep.eliminated) {
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(ep.eliminated);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[ep.eliminated] = epNum;
        } else {
          const _slRiC = simulateRIChoice(ep.eliminated);
          ep.riChoice = _slRiC;
          if (_slRiC === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
          else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
        }
      } else {
        gs.eliminated.push(ep.eliminated);
        if (gs.isMerged) gs.jury.push(ep.eliminated);
      }
      gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
      handleAdvantageInheritance(ep.eliminated, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
    }

    ep.bondChanges = updateBonds([], ep.eliminated, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, riChoice: ep.riChoice || null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: 'slasher-night', isMerge: ep.isMerge,
      isSlasherNight: true,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      slasherNight: ep.slasherNight,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      bewareLostVotes: ep.bewareLostVotes || [],
      riDuel: ep.riDuel || null,
      riPlayersPreDuel: ep.riPlayersPreDuel || null,
      riLifeEvents: ep.riLifeEvents || [],
      riReentry: ep.riReentry || null,
      rescueIslandEvents: ep.rescueIslandEvents || [],
      rescueReturnChallenge: ep.rescueReturnChallenge || null,
      riArrival: ep.riArrival || null,
      riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState()
    });
    const stSN = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stSN; ep.summaryText = stSN;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── TRIPLE DOG DARE — dare challenge replaces immunity + tribal ──
  if (ep.isTripleDogDare) {
    // Pre-challenge: journey, advantages, camp events fire normally
    simulateJourney(ep); findAdvantages(ep);
    if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
    generateCampEvents(ep, 'pre');
    checkMoleSabotage(ep);
    updatePerceivedBonds(ep);

    // Run the dare challenge
    simulateTripleDogDare(ep);

    // Post-challenge camp reactions
    generateCampEvents(ep, 'post');

    // Handle elimination — with RI check
    if (ep.eliminated) {
      handleAdvantageInheritance(ep.eliminated, ep);
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(ep.eliminated);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[ep.eliminated] = epNum;
        } else {
          const _tddRiC = simulateRIChoice(ep.eliminated);
          ep.riChoice = _tddRiC;
          if (_tddRiC === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
          else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
        }
      } else {
        gs.eliminated.push(ep.eliminated);
        if (gs.isMerged) gs.jury.push(ep.eliminated);
      }
      gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
      gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);

      // Tied Destinies collateral
      if (gs._tiedDestiniesActive) {
        const _tdPair = gs._tiedDestiniesActive.find(p => p.a === ep.eliminated || p.b === ep.eliminated);
        if (_tdPair) {
          const _tdPartner = _tdPair.a === ep.eliminated ? _tdPair.b : _tdPair.a;
          if (gs.activePlayers.includes(_tdPartner)) {
            ep.tiedDestiniesCollateral = _tdPartner;
            handleAdvantageInheritance(_tdPartner, ep);
            if (isRIStillActive()) {
              if (cfg.riFormat === 'rescue') { gs.riPlayers.push(_tdPartner); }
              else {
                const _tdRi = simulateRIChoice(_tdPartner);
                if (_tdRi === 'REDEMPTION ISLAND') gs.riPlayers.push(_tdPartner);
                else { gs.eliminated.push(_tdPartner); if (gs.isMerged) gs.jury.push(_tdPartner); }
              }
            } else {
              gs.eliminated.push(_tdPartner);
              if (gs.isMerged) gs.jury.push(_tdPartner);
            }
            gs.activePlayers = gs.activePlayers.filter(p => p !== _tdPartner);
            gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _tdPartner)}));
            gs.advantages = gs.advantages.filter(a => a.holder !== _tdPartner);
          }
        }
      }
    }

    ep.bondChanges = updateBonds([], ep.eliminated, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, riChoice: ep.riChoice || null,
      immunityWinner: null,
      challengeType: 'triple-dog-dare', isMerge: ep.isMerge,
      isTripleDogDare: true,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      tripleDogDare: ep.tripleDogDare,
      tiedDestiniesCollateral: ep.tiedDestiniesCollateral || null,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      bewareLostVotes: ep.bewareLostVotes || [],
      riDuel: ep.riDuel || null,
      riPlayersPreDuel: ep.riPlayersPreDuel || null,
      riLifeEvents: ep.riLifeEvents || [],
      riReentry: ep.riReentry || null,
      rescueIslandEvents: ep.rescueIslandEvents || [],
      rescueReturnChallenge: ep.rescueReturnChallenge || null,
      riArrival: ep.riArrival || null,
      riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState()
    });
    const stTDD = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stTDD; ep.summaryText = stTDD;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── SUDDEN DEATH — last place in challenge is auto-eliminated, no tribal ──
  if (ep.isSuddenDeath) {
    simulateJourney(ep); findAdvantages(ep);
    if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
    generateCampEvents(ep, 'both');
    checkMoleSabotage(ep);
    updatePerceivedBonds(ep);

    // Run the immunity challenge — last place is eliminated
    const _sdPool = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
    const _sdResult = simulateIndividualChallenge(_sdPool, null);
    ep.challengeType = 'individual';
    ep.immunityWinner = _sdResult?.name || _sdPool[0];
    ep.challengeLabel = _sdResult?.challengeLabel || 'Sudden Death';
    ep.challengeCategory = _sdResult?.challengeCategory || 'mixed';
    ep.challengeDesc = _sdResult?.challengeDesc || '';
    ep.chalPlacements = _sdResult?.chalPlacements || [];
    ep.chalMemberScores = _sdResult?.chalMemberScores || {};
    ep.challengeThrows = _sdResult?.challengeThrows || null;

    // Last place = eliminated
    const _sdLastPlace = ep.chalPlacements.length ? ep.chalPlacements[ep.chalPlacements.length - 1] : null;
    if (_sdLastPlace) {
      ep.eliminated = _sdLastPlace;
      ep.suddenDeathEliminated = _sdLastPlace;
      handleAdvantageInheritance(_sdLastPlace, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== _sdLastPlace);
      gs.eliminated.push(_sdLastPlace);
      if (gs.isMerged) gs.jury.push(_sdLastPlace);
      gs.advantages = gs.advantages.filter(a => a.holder !== _sdLastPlace);

      // Provider tracking
      if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(_sdLastPlace)) {
        const _sdTribe = gs.isMerged ? (gs.mergeName || 'merge') : '';
        gs.providerVotedOutLastEp = { name: _sdLastPlace, tribeName: _sdTribe };
      }

      // Black vote for sudden death elimination
      if (seasonConfig.blackVote && seasonConfig.blackVote !== 'off' && gs.activePlayers.length > 4) {
        const _sdPool = gs.activePlayers.filter(p => p !== _sdLastPlace);
        if (_sdPool.length) {
          if (seasonConfig.blackVote === 'classic') {
            const _sdBvTarget = [..._sdPool].sort((a, b) => getBond(_sdLastPlace, a) - getBond(_sdLastPlace, b))[0];
            if (_sdBvTarget) {
              if (!gs.blackVotes) gs.blackVotes = [];
              gs.blackVotes.push({ from: _sdLastPlace, target: _sdBvTarget, ep: epNum, type: 'classic', reason: getBond(_sdLastPlace, _sdBvTarget) <= -2 ? `grudge — ${_sdLastPlace} and ${_sdBvTarget} had bad blood` : `${_sdLastPlace} wants ${_sdBvTarget} gone — lowest bond of anyone left` });
              ep.blackVote = { from: _sdLastPlace, target: _sdBvTarget, type: 'classic', reason: getBond(_sdLastPlace, _sdBvTarget) <= -2 ? `grudge` : `lowest bond` };
            }
          } else if (seasonConfig.blackVote === 'modern') {
            const _sdBvRecip = [..._sdPool].sort((a, b) => getBond(_sdLastPlace, b) - getBond(_sdLastPlace, a))[0];
            if (_sdBvRecip) {
              gs.advantages.push({ holder: _sdBvRecip, type: 'extraVote', foundEp: epNum, fromBlackVote: true, giftedBy: _sdLastPlace });
              ep.blackVote = { from: _sdLastPlace, recipient: _sdBvRecip, type: 'modern', reason: `closest ally` };
            }
          }
        }
      }
    }

    // Challenge record + camp events
    updateChalRecord(ep);
    if (ep.challengeThrows?.length) {
      ep.challengeThrowData = ep.challengeThrows;
    }
    generateCampEvents(ep, 'post');
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= seasonConfig.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, riChoice: null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: 'individual', challengeLabel: ep.challengeLabel,
      challengeCategory: ep.challengeCategory, challengeDesc: ep.challengeDesc,
      chalPlacements: ep.chalPlacements, chalMemberScores: ep.chalMemberScores,
      isMerge: ep.isMerge, isSuddenDeath: true, noTribal: true, suddenDeathEliminated: ep.suddenDeathEliminated || null,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState()
    });
    const stSD = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stSD; ep.summaryText = stSD;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── JOURNEY & IDOL FINDING ──
  simulateJourney(ep);
  findAdvantages(ep);
  // Save scramble/shield data before camp events clear them
  if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
  if (gs._shieldActivations) ep._debugShield = Object.fromEntries(Object.entries(gs._shieldActivations).map(([k, v]) => [k, { ...v }]));
  // Generate dock arrivals for Episode 1 (if not already generated by first-impressions twist)
  if ((gs.episode || 0) === 0 && !ep.dockArrivals) generateDockArrivals(ep);
  generateCampEvents(ep, 'pre');
  checkMoleSabotage(ep); // The Mole: bond sabotage, laying low events, exposure checks
  checkVolunteerExileDuel(ep); // Volunteer Exile Duel: bold player asks to be voted out
  updatePerceivedBonds(ep); // close perception gaps before tribal decisions

  // Inject camp events for journey losers returning without their vote
  if (ep.journey?.results) {
    ep.journey.results.filter(r => r.result === 'lostVote').forEach(r => {
      const tribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(r.name))?.name;
      if (!tribe || !ep.campEvents?.[tribe]) return;
      const p = pronouns(r.name);
      const evts = Array.isArray(ep.campEvents[tribe]) ? ep.campEvents[tribe] : (ep.campEvents[tribe].pre || []);
      const texts = [
        `${r.name} comes back from the Journey empty-handed — and without a vote. ${p.Sub} say${p.sub==='they'?'':'s'} nothing about what happened. The tribe notices the silence.`,
        `${r.name} returns from the Journey. ${p.Sub} lost. No advantage, no vote at the next tribal. ${p.Sub} sit${p.sub==='they'?'':'s'} by the fire and stare${p.sub==='they'?'':'s'} at the flames.`,
        `${r.name} walks back into camp with nothing. The Journey cost ${p.obj} ${p.pos} vote. The tribe reads it on ${p.pos} face before ${p.sub} say${p.sub==='they'?'':'s'} a word.`,
      ];
      const text = texts[([...r.name].reduce((s,c) => s + c.charCodeAt(0), 0) + ep.num) % texts.length];
      evts.unshift({ type: 'journeyLoss', players: [r.name], text });
    });
  }

  // ── Schoolyard Pick camp events: last-picked shame/anger/fire + exile return events ──
  if (ep.schoolyardPick?.lastPicked && ep.campEvents) {
    const _syp = ep.schoolyardPick;
    const _sypTarget = _syp.exiled || _syp.lastPicked;
    const _sypEmotion = _syp.dominantEmotion || 'shame';
    const _sypTribe = gs.tribes.find(t => t.members.includes(_sypTarget))?.name;
    // Last picked event (only if not exiled — exiled player isn't on a tribe yet)
    if (!_syp.exiled && _sypTribe && ep.campEvents[_sypTribe]) {
      const _lp = _syp.lastPicked;
      const _lpP = pronouns(_lp);
      const _lpCap = _syp.picks[_syp.picks.length - 1]?.captain;
      const _lastPickedTexts = {
        anger: [
          `${_lp} is the last one picked. ${_lpP.Sub} ${_lpP.sub==='they'?'don\'t':'doesn\'t'} say a word walking over to ${_sypTribe} — but the look ${_lpP.sub} ${_lpP.sub==='they'?'give':'gives'} ${_lpCap} says everything.`,
          `Last pick. ${_lp} absorbs the humiliation in silence. Then ${_lpP.sub} start${_lpP.sub==='they'?'':'s'} working harder than anyone at camp. The anger is fuel.`,
        ],
        shame: [
          `${_lp} walks to ${_sypTribe}'s mat — the last one chosen. ${_lpP.Sub} ${_lpP.sub==='they'?'try':'tries'} to smile, but everyone saw the order. Everyone knows what it means.`,
          `"It's fine." ${_lp} says it twice. It is clearly not fine. Being picked last has ${_lpP.obj} questioning everything about ${_lpP.posAdj} position in this game.`,
        ],
        fire: [
          `${_lp} was the last pick, and ${_lpP.sub} want${_lpP.sub==='they'?'':'s'} everyone to remember that. "Watch what happens next." The tribe exchanges glances.`,
          `Last picked. ${_lp} takes it personally — exactly as intended. ${_lpP.Sub} ${_lpP.sub==='they'?'channel':'channels'} every ounce of that rejection into a promise: outlast them all.`,
        ],
      };
      const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const _lpText = _pick(_lastPickedTexts[_sypEmotion]);
      const _lpEvts = Array.isArray(ep.campEvents[_sypTribe]) ? ep.campEvents[_sypTribe] : (ep.campEvents[_sypTribe].pre || []);
      _lpEvts.unshift({ type: 'schoolyardLastPicked', players: [_lp], text: _lpText, badgeText: 'LAST PICKED', badgeClass: 'red' });
      // Bond damage with captain who picked them last
      if (_lpCap) addBond(_lpCap, _lp, -0.3);
    }
  }
  // Exile return camp events (injected when exile player rejoins)
  if (ep.schoolyardExileReturn && ep.campEvents) {
    const _ret = ep.schoolyardExileReturn;
    const _retP = pronouns(_ret.player);
    const _retTribe = _ret.tribe;
    if (_retTribe && ep.campEvents[_retTribe]) {
      const _retEvts = Array.isArray(ep.campEvents[_retTribe]) ? ep.campEvents[_retTribe] : (ep.campEvents[_retTribe].pre || []);
      const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
      // Arrival event (bond-driven)
      const _retMembers = gs.tribes.find(t => t.name === _retTribe)?.members.filter(m => m !== _ret.player) || [];
      const _avgBond = _retMembers.length ? _retMembers.reduce((s, m) => s + getBond(_ret.player, m), 0) / _retMembers.length : 0;
      const _arrivalTexts = _avgBond >= 2
        ? [`${_ret.player} walks into ${_retTribe}'s camp and is greeted with open arms. "We're glad to have you."`,
           `Warm reception for ${_ret.player}. The tribe needed numbers, and ${_retP.sub} ${_retP.sub==='they'?'are':'is'} someone they actually want around.`]
        : _avgBond >= -1
        ? [`${_ret.player} arrives at ${_retTribe}. Polite nods. No celebration. Another mouth to feed, another variable in the game.`,
           `${_ret.player} joins ${_retTribe}. The reception is lukewarm — not hostile, but nobody's throwing a party.`]
        : [`${_ret.player} shows up at ${_retTribe}'s camp. The silence is deafening. "Great. Just what we needed."`,
           `Cold reception for ${_ret.player}. ${_retTribe} didn't ask for this, and they're not pretending otherwise.`];
      _retEvts.unshift({ type: 'schoolyardExileArrival', players: [_ret.player], text: _pick(_arrivalTexts), badgeText: 'EXILE RETURN', badgeClass: 'gold' });
      // Proving event (dominant emotion)
      const _provingTexts = {
        anger: [
          `${_ret.player} doesn't ease in quietly. ${_retP.Sub} confront${_retP.sub==='they'?'':'s'} the game head-on — calling out the captains, making it clear that being left out was a mistake.`,
          `The anger from exile hasn't faded. ${_ret.player} channels it into every interaction — aggressive strategy talk, pointed comments, a refusal to be overlooked again.`,
        ],
        shame: [
          `${_ret.player} doesn't talk about exile. Instead, ${_retP.sub} ${_retP.sub==='they'?'do':'does'} everything around camp — firewood, water, cooking — without being asked. Earning respect through work.`,
          `Quiet. Focused. ${_ret.player} lets ${_retP.posAdj} actions speak. By sundown, even the skeptics notice how much ${_retP.sub}'${_retP.sub==='they'?'ve':'s'} contributed.`,
        ],
        fire: [
          `${_ret.player} came back from exile with something to prove. Everyone can see it. The fire in ${_retP.posAdj} eyes is unmistakable.`,
          `"I'm still here." ${_ret.player} doesn't say it to anyone in particular. But everyone hears it. Exile didn't break ${_retP.obj} — it sharpened ${_retP.obj}.`,
        ],
      };
      _retEvts.push({ type: 'schoolyardExileProving', players: [_ret.player], text: _pick(_provingTexts[_ret.emotion] || _provingTexts.shame), badgeText: 'PROVING GROUND', badgeClass: 'gold' });
      // Bond effects: arrival bonds
      _retMembers.forEach(m => {
        if (_avgBond >= 2) addBond(_ret.player, m, 0.2);
        else if (_avgBond < -1) addBond(_ret.player, m, -0.1);
      });
    }
  }

  // ── CHALLENGE ──
  if (ep.isDoubleTribal && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    // Double tribal: challenge runs, winner safe, losing tribes merge into ONE council, one elimination
    const _dtResult = simulateTribeChallenge(gs.tribes);
    ep.challengeType = 'double-tribal';
    ep.winner = _dtResult.winner;
    ep.challengeLabel    = _dtResult.challengeLabel    || 'Immunity Challenge';
    ep.challengeCategory = _dtResult.challengeCategory || 'mixed';
    ep.challengeDesc     = _dtResult.challengeDesc     || '';
    ep.challengePlacements = (_dtResult.placements || []).map(t => ({ ...t, members: [...t.members] }));
    ep.chalMemberScores  = _dtResult.memberScores || {};
    ep.chalSitOuts       = _dtResult.sitOuts      || {};
    ep.prevChalSitOuts   = _dtResult.prevSitOuts  || {};
    ep.safeTribes = [_dtResult.winner];
    // All losing tribe members merge into one combined tribal
    const _dtLosingTribes = gs.tribes.filter(t => t.name !== _dtResult.winner?.name);
    ep.loser = _dtResult.loser || _dtLosingTribes[_dtLosingTribes.length - 1];
    ep.tribalPlayers = _dtLosingTribes.flatMap(t => [...t.members]);
    ep.doubleTribalLosingTribes = _dtLosingTribes; // track for VP display
  } else if (ep.isMultiTribal && gs.phase === 'pre-merge' && gs.tribes.length >= 3) {
    // Multi-tribal: challenge runs, winner safe, ALL OTHER tribes (2+) each vote someone out
    const result = simulateTribeChallenge(gs.tribes);
    ep.challengeType = 'multi-tribal';
    ep.winner = result.winner;
    ep.challengeLabel    = result.challengeLabel    || 'Immunity Challenge';
    ep.challengeCategory = result.challengeCategory || 'mixed';
    ep.challengeDesc     = result.challengeDesc     || '';
    ep.challengePlacements = (result.placements || []).map(t => ({ ...t, members: [...t.members] }));
    ep.chalMemberScores  = result.memberScores || {};
    ep.chalSitOuts       = result.sitOuts      || {};
    ep.prevChalSitOuts   = result.prevSitOuts  || {};
    // Safe tribe = winner; losing tribes = all others
    ep.safeTribes = [result.winner];
    ep.multiTribalLosingTribes = gs.tribes.filter(t => t.name !== result.winner?.name);
    ep.loser = result.loser || ep.multiTribalLosingTribes[ep.multiTribalLosingTribes.length - 1]; // worst performer
    ep.multiTribalResults = [];
    ep.tribalPlayers = ep.multiTribalLosingTribes.flatMap(t => [...t.members]); // combined for display
  } else if (ep.isCliffDive && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateCliffDive(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateCliffDive
  } else if (ep.isAwakeAThon && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateAwakeAThon(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateAwakeAThon
  } else if (ep.isDodgebrawl && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateDodgebrawl(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateDodgebrawl
  } else if (ep.isTalentShow && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateTalentShow(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateTalentShow
  } else if (ep.isSuckyOutdoors && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateSuckyOutdoors(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateSuckyOutdoors
  } else if (ep.isUpTheCreek && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateUpTheCreek(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateUpTheCreek
  } else if (ep.isPaintballHunt && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulatePaintballHunt(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulatePaintballHunt
  } else if (ep.isHellsKitchen && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateHellsKitchen(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateHellsKitchen
  } else if (ep.isTrustChallenge && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateTrustChallenge(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateTrustChallenge
  } else if (ep.isBasicStraining && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateBasicStraining(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateBasicStraining
  } else if (ep.isXtremeTorture && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateXtremeTorture(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateXtremeTorture
  } else if (ep.isPhobiaFactor && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    // Phobia Factor replaces the tribe challenge
    simulatePhobiaFactor(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulatePhobiaFactor
  } else if (gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    const result = simulateTribeChallenge(gs.tribes);
    ep.challengeType = 'tribe';
    ep.winner = result.winner; ep.loser = result.loser;
    ep.safeTribes = result.safe || [];
    ep.challengePlacements = (result.placements || []).map(t => ({ ...t, members: [...t.members] }));
    ep.tribalPlayers = [...result.loser.members];
    ep.challengeLabel    = result.challengeLabel    || 'Immunity Challenge';
    ep.challengeCategory = result.challengeCategory || 'mixed';
    ep.challengeDesc     = result.challengeDesc     || '';
    ep.chalMemberScores  = result.memberScores      || {};
    ep.chalSitOuts       = result.sitOuts           || {};
    ep.prevChalSitOuts   = result.prevSitOuts       || {};
    // Straggler = weakest competing member of losing tribe (exclude sit-outs)
    const _loserSitOuts = ep.chalSitOuts[result.loser?.name] || [];
    const _loserMs = (result.loser?.members || [])
      .filter(m => !_loserSitOuts.includes(m))
      .sort((a,b)=>(result.memberScores?.[a]||0)-(result.memberScores?.[b]||0));
    gs._chalStragglers = _loserMs.slice(0, Math.min(2, _loserMs.length));
    // Top performers on the LOSING tribe — they shouldn't be called "challenge liability"
    const _loserMsDesc = [..._loserMs].reverse(); // best to worst
    gs._chalStandouts = _loserMsDesc.slice(0, Math.min(2, _loserMsDesc.length));
    gs._chalTopHalf = _loserMsDesc.slice(0, Math.ceil(_loserMsDesc.length / 2));
    // Also store placements for the losing tribe so targetCategory can read them
    ep.chalPlacements = _loserMsDesc;

    // ── KIDNAPPING: winner tribe takes one player from loser tribe for this episode ──
    if (gs.kidnappingPending && ep.winner && ep.loser) {
      gs.kidnappingPending = false;
      const _kidTw = ep.twists?.find(t => t.type === 'kidnapping');
      const _winMembers = ep.winner.members;
      const _loseMembers = ep.loser.members;
      if (_loseMembers.length >= 3 && _kidTw) {
        // Winner tribe picks strategically: prefer players in danger (high heat = they'll be grateful)
        // or players with bonds to winner tribe (existing connection)
        const _kidPick = wRandom(_loseMembers, n => {
          const heat = computeHeat(n, _loseMembers, []);
          const bondW = _winMembers.reduce((s,m) => s + Math.max(0, getBond(n,m)), 0);
          return heat * 0.5 + bondW * 0.3 + threatScore(n) * 0.2 + Math.random() * 1.5;
        });
        const _kidP = pronouns(_kidPick);
        const _kidS = pStats(_kidPick);
        const _oldBondAvg = _loseMembers.filter(m=>m!==_kidPick).reduce((s,m)=>s+getBond(_kidPick,m),0) / Math.max(1,_loseMembers.length-1);
        const _wasInDanger = computeHeat(_kidPick, _loseMembers, []) >= 2;

        // Remove from losing tribe's tribal players (safe this episode)
        ep.tribalPlayers = ep.tribalPlayers.filter(p => p !== _kidPick);

        // Track for return next episode
        gs.kidnappedPlayer = { name: _kidPick, from: ep.loser.name, to: ep.winner.name, wasInDanger: _wasInDanger };

        // Determine reason
        let _kidReason;
        if (_wasInDanger) _kidReason = `${_kidPick} was on the chopping block at ${ep.loser.name}. Taking ${_kidP.obj} saves ${_kidP.obj} — and creates a debt.`;
        else if (_winMembers.some(m => getBond(_kidPick, m) >= 2)) _kidReason = `${_kidPick} has connections on ${ep.winner.name}. An easy choice.`;
        else if (_kidS.physical >= 8) _kidReason = `${_kidPick} is a physical threat. Pulling ${_kidP.obj} out weakens ${ep.loser.name} and shows ${_kidP.obj} a good time.`;
        else _kidReason = `${ep.winner.name} wanted to shake things up. ${_kidPick} was the pick.`;

        // Bond events based on how kidnappee feels
        const _likesOldTribe = _oldBondAvg >= 1.5;
        const _relieved = _wasInDanger;
        let _kidReaction;
        if (_relieved) {
          // Grateful — was about to go home, kidnapping saved them
          _winMembers.forEach(m => addBond(_kidPick, m, 1.2));
          _kidReaction = 'grateful';
        } else if (_likesOldTribe) {
          // Frustrated — misses allies, worried about what's happening at tribal without them
          _winMembers.forEach(m => addBond(_kidPick, m, -0.3));
          _kidReaction = 'frustrated';
        } else {
          // Open to it — no strong attachment, enjoys the break
          _winMembers.forEach(m => addBond(_kidPick, m, 0.5));
          _kidReaction = 'open';
        }

        _kidTw.kidnapped = _kidPick;
        _kidTw.fromTribe = ep.loser.name;
        _kidTw.toTribe = ep.winner.name;
        _kidTw.reason = _kidReason;
        _kidTw.reaction = _kidReaction;
        _kidTw.wasInDanger = _wasInDanger;

        // Camp events for winner tribe (kidnappee spending the episode there)
        ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
        const _kidEvts = {
          grateful: [
            `${_kidPick} can barely hide the relief. ${_kidP.Sub} ${_kidP.sub==='they'?'were':'was'} dead at ${ep.loser.name} — and ${_kidP.sub} know${_kidP.sub==='they'?'':'s'} it. The ${ep.winner.name} camp feels like sanctuary.`,
            `${_kidPick} opens up fast. ${_kidP.Sub} tell${_kidP.sub==='they'?'':'s'} the ${ep.winner.name} players things about ${ep.loser.name} that nobody was supposed to hear. The gratitude is real — and so is the information.`,
          ],
          frustrated: [
            `${_kidPick} is polite but clearly somewhere else. ${_kidP.Pos} mind is at ${ep.loser.name}'s tribal. ${_kidP.Sub} ${_kidP.sub==='they'?'have':'has'} allies over there — and no idea what's happening to them.`,
            `${_kidPick} keeps to ${_kidP.ref}. The ${ep.winner.name} players try to include ${_kidP.obj}, but ${_kidP.sub} ${_kidP.sub==='they'?'aren\'t':'isn\'t'} here to make friends. ${_kidP.Sub} ${_kidP.sub==='they'?'are':'is'} here because ${_kidP.sub} had no choice.`,
          ],
          open: [
            `${_kidPick} surprises everyone by settling in. The food, the fire, the conversation — it's different over here. ${_kidP.Sub} ${_kidP.sub==='they'?'don\'t':'doesn\'t'} hate it.`,
            `${_kidPick} treats the kidnapping like a vacation. No tribal, no drama, just a night with strangers who don't want ${_kidP.obj} dead. For one episode, the game feels different.`,
          ],
        };
        ep.twistNarrativeEvents[ep.winner.name + '_kidnap'] = {
          type: _kidReaction === 'frustrated' ? 'doubt' : 'bond',
          players: [_kidPick],
          text: _kidEvts[_kidReaction][([..._kidPick].reduce((s,c)=>s+c.charCodeAt(0),0) + ep.num) % _kidEvts[_kidReaction].length],
        };

        // Update tribesAtStart so camp screens show kidnappee with winner tribe, not home tribe
        ep.tribesAtStart = ep.tribesAtStart.map(t => ({
          name: t.name,
          members: t.name === ep.loser.name ? t.members.filter(m => m !== _kidPick)
                 : t.name === ep.winner.name ? [...t.members, _kidPick]
                 : [...t.members],
        }));
      }
    }

    // ── PENALTY VOTE: assign to worst performer on losing tribe ──
    if (ep.penaltyVoteTwistPending) {
      const _penTw = ep.twists?.find(t => t.type === 'penalty-vote');
      const _pvLoser = _loserMs[0] || null; // lowest score, non-sit-out, losing tribe
      if (_pvLoser && _penTw) {
        _penTw.penaltyTarget = _pvLoser;
        gs.penaltyVoteThisEp = _pvLoser;
        ep.penaltyVoteTwistPending = false;
      }
    }
  } else if (ep.isBasicStraining) {
    // ── BASIC STRAINING: Chef's boot camp ──
    simulateBasicStraining(ep);
    if (!ep.winner && !ep.immunityWinner) {
      ep.tribalPlayers = gs.activePlayers;
    }
  } else if (ep.isSayUncle) {
    // ── SAY UNCLE: torture endurance challenge replaces immunity ──
    simulateSayUncle(ep);
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  } else if (ep.isBrunchOfDisgustingness) {
    simulateBrunchOfDisgustingness(ep);
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  } else if (ep.isLuckyHunt) {
    // ── LUCKY HUNT: post-merge scavenger hunt replaces immunity ──
    simulateLuckyHunt(ep);
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && p !== gs.exileDuelPlayer);
  } else if (ep.isHideAndBeSneaky) {
    // ── HIDE AND BE SNEAKY: post-merge hide-and-seek manhunt ──
    simulateHideAndBeSneaky(ep);
    if (!ep.tribalPlayers) {
      ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);
    }
  } else if (ep.isOffTheChain) {
    // ── OFF THE CHAIN: post-merge bike-building and racing ──
    simulateOffTheChain(ep);
    if (!ep.tribalPlayers) {
      ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);
    }
  } else {
    // ── TIED DESTINIES: paired immunity challenge ──
    const _tdTwist = ep.tiedDestinies;
    if (_tdTwist?.pairs?.length) {
      const chal = pickChallenge('individual');
      const _pairScores = _tdTwist.pairs.map(pair => {
        const sA = chal.stat(pStats(pair.a)), sB = chal.stat(pStats(pair.b));
        const bondBonus = getBond(pair.a, pair.b) * 0.1;
        const pairScore = (sA + sB) / 2 + bondBonus + (Math.random() * 6 - 3);
        return { pair, score: pairScore, scoreA: sA, scoreB: sB };
      }).sort((a, b) => b.score - a.score);
      const winPair = _pairScores[0].pair;
      _tdTwist.immunePair = winPair;
      _tdTwist.pairScores = _pairScores;
      ep.challengeType = 'individual';
      ep.immunityWinner = winPair.a; // primary winner for display
      ep.extraImmune = [...(ep.extraImmune || []), winPair.b]; // partner also immune
      ep.challengeLabel = chal.name || 'Paired Immunity Challenge';
      ep.challengeCategory = chal.category || 'mixed';
      ep.challengeDesc = chal.desc || '';
      ep.chalPlacements = _pairScores.flatMap(ps => [ps.pair.a, ps.pair.b]);
      ep.chalMemberScores = {};
      _pairScores.forEach(ps => { ep.chalMemberScores[ps.pair.a] = ps.scoreA; ep.chalMemberScores[ps.pair.b] = ps.scoreB; });
      ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
    } else {
    const _chalPool = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
    const immResult = simulateIndividualChallenge(_chalPool, null);
    ep.challengeType = 'individual'; ep.immunityWinner = immResult?.name || null;
    ep.challengeLabel    = immResult?.challengeLabel    || 'Immunity Challenge';
    ep.challengeCategory = immResult?.challengeCategory || 'mixed';
    ep.challengeDesc     = immResult?.challengeDesc     || '';
    ep.chalPlacements    = immResult?.chalPlacements    || [];
    ep.chalMemberScores  = immResult?.chalMemberScores  || {};
    ep.challengeThrows   = immResult?.challengeThrows   || null;
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
    } // end tied-destinies else
    // Store standouts/stragglers for voter-specific targeting logic (cleared after tribal)
    const _immune = ep.immunityWinner;
    const _ranked = (ep.chalPlacements || []).filter(n => n !== _immune);
    gs._chalStandouts = _ranked.slice(0, Math.min(2, _ranked.length));
    gs._chalTopHalf = _ranked.slice(0, Math.ceil(_ranked.length / 2)); // top half performers — shouldn't be called "liability"
    gs._chalStragglers = _ranked.slice(Math.max(0, _ranked.length - 2));

    // ── PENALTY VOTE: assign to challenge loser (last-place finisher) ──
    if (ep.penaltyVoteTwistPending) {
      const _penTw = ep.twists?.find(t => t.type === 'penalty-vote');
      const _pvLoser = _ranked[_ranked.length - 1] || null;
      if (_pvLoser && _penTw) {
        _penTw.penaltyTarget = _pvLoser;
        gs.penaltyVoteThisEp = _pvLoser;
        ep.penaltyVoteTwistPending = false;
      }
    }

    // ── TWIST: shared-immunity — winner picks someone to share the necklace with ──
    const sharedTw = ep.twists?.find(t => t.type === 'shared-immunity');
    if (sharedTw && ep.immunityWinner) {
      const winner = ep.immunityWinner;
      const wS = pStats(winner);
      const candidates = gs.activePlayers.filter(p => p !== winner);
      if (candidates.length) {
        // Decision: bond-driven (loyalty) vs strategic (protect a shield/number)
        const sharedWith = wRandom(candidates, n => {
          const bond = getBond(winner, n);
          const ts = threatScore(n);
          const inAlliance = (gs.namedAlliances||[]).some(a => a.active && a.members.includes(winner) && a.members.includes(n));
          const heat = computeHeat(n, gs.activePlayers, []);
          // Loyal players protect allies; strategic players protect shields or numbers
          const loyaltyPull = bond * 1.5 + (inAlliance ? 3 : 0);
          const strategicPull = (heat >= 3 ? 2 : 0) + (ts >= 7 ? 1.5 : 0); // save someone in danger or a shield
          const weight = wS.loyalty >= 7 ? loyaltyPull * 1.5 + strategicPull * 0.5
                       : wS.strategic >= 7 ? loyaltyPull * 0.5 + strategicPull * 1.5
                       : loyaltyPull + strategicPull;
          return Math.max(0.1, weight + Math.random() * 1.5);
        });
        // Reasoning
        const sBond = getBond(winner, sharedWith);
        const sInAlliance = (gs.namedAlliances||[]).some(a => a.active && a.members.includes(winner) && a.members.includes(sharedWith));
        const sHeat = computeHeat(sharedWith, gs.activePlayers, []);
        sharedTw.reason = sInAlliance ? `${winner} and ${sharedWith} are in the same alliance. Loyalty rewarded.`
                        : sBond >= 3 ? `${winner} and ${sharedWith} have a strong bond. This is personal, not strategic.`
                        : sHeat >= 3 ? `${sharedWith} was in danger. ${winner} saw it — and used the necklace as a lifeline.`
                        : threatScore(sharedWith) >= 7 ? `${sharedWith} is a shield. Keeping them safe keeps ${winner} safe.`
                        : `${winner} made a calculated choice. ${sharedWith} is a number ${winner} needs.`;
        // Snubbed player: the person who expected to be picked but wasn't
        const snubbed = candidates.filter(p => p !== sharedWith && getBond(winner, p) >= 2)
          .sort((a,b) => getBond(winner, b) - getBond(winner, a))[0] || null;
        if (snubbed && getBond(winner, snubbed) >= sBond - 1) {
          sharedTw.snubbed = snubbed;
          addBond(snubbed, winner, -1.5); // feels betrayed
        }
        // Grateful player
        addBond(sharedWith, winner, 1.5);
        sharedTw.sharedWith = sharedWith;
        ep.sharedImmunity = sharedWith;
      }
    }
    // ── TWIST: double-safety — winner + challenge runner-up both earn immunity ──
    const dblSafeTw = ep.twists?.find(t => t.type === 'double-safety');
    if (dblSafeTw && ep.immunityWinner) {
      // Runner-up from the challenge placements
      const placements = ep.chalPlacements || [];
      const runnerUp = placements.length >= 2 ? placements[1] : null;
      const second = runnerUp && runnerUp !== ep.immunityWinner ? runnerUp
        : gs.activePlayers.filter(p => p !== ep.immunityWinner)[0] || null;
      if (second) {
        dblSafeTw.secondImmune = second;
        dblSafeTw.reason = runnerUp === second
          ? `${second} finished second in the challenge — close enough to earn safety.`
          : `${second} earned safety as the next-best performer.`;
        ep.secondImmune = second;
      }
    }
  }

  // ── TWIST: hero-duel — participants from challenge results, duel for immunity ──
  // Runs AFTER challenge regardless of type (tribe or individual)
  const heroTw = ep.twists?.find(t => t.type === 'hero-duel');
  if (heroTw && gs.heroDuelPending) {
    gs.heroDuelPending = false;
    let duelA, duelB, duelReason;
    if (gs.phase === 'pre-merge' && ep.loser && ep.chalMemberScores) {
      // Pre-merge: best vs worst on the LOSING tribe
      const loserMembers = ep.loser.members || [];
      const loserScored = loserMembers
        .filter(m => ep.chalMemberScores[m] !== undefined)
        .sort((a,b) => (ep.chalMemberScores[b]||0) - (ep.chalMemberScores[a]||0));
      if (loserScored.length >= 2) {
        duelA = loserScored[0];
        duelB = loserScored[loserScored.length - 1];
        duelReason = `${duelA} was the best performer on the losing tribe. ${duelB} was the worst. One of them earns safety — the other stays vulnerable.`;
      }
    } else if (ep.chalPlacements?.length >= 3) {
      // Post-merge: 2nd place vs last place (winner already has immunity)
      const nonWinner = ep.chalPlacements.filter(n => n !== ep.immunityWinner);
      if (nonWinner.length >= 2) {
        duelA = nonWinner[0];
        duelB = nonWinner[nonWinner.length - 1];
        duelReason = `${duelA} finished second in the challenge. ${duelB} finished last. They duel for a second immunity necklace.`;
      }
    }
    if (!duelA || !duelB) {
      const pool = gs.activePlayers.filter(p => p !== ep.immunityWinner);
      duelA = pool[0]; duelB = pool[pool.length - 1];
      duelReason = `Two players face off head-to-head.`;
    }
    heroTw.duelParticipants = [duelA, duelB];
    heroTw.duelReason = duelReason;
    const duelResult = simulateIndividualChallenge([duelA, duelB], null);
    const duelWinner = duelResult?.name || duelA;
    const duelLoser = duelWinner === duelA ? duelB : duelA;
    heroTw.duelWinner = duelWinner;
    heroTw.duelLoser = duelLoser;
    ep.extraImmune = ep.extraImmune || [];
    ep.extraImmune.push(duelWinner);
    heroTw.duelType = gs.phase === 'pre-merge' ? 'safety' : 'immunity';
    // Bond consequences
    if (getBond(duelWinner, duelLoser) <= -2) {
      addBond(duelWinner, duelLoser, -0.8);
    } else if (pStats(duelWinner).temperament >= 7 && pStats(duelLoser).temperament >= 7) {
      addBond(duelWinner, duelLoser, 0.5);
    }
  }

  // ── TWIST: guardian-angel — resolve after challenge, exclude immunity winner ──
  const gaTw = ep.twists?.find(t => t.type === 'guardian-angel');
  if (gaTw && gs.guardianAngelPending) {
    gs.guardianAngelPending = false;
    const juryWeight = 0.6, campWeight = 0.4;
    const candidates = gs.activePlayers.filter(p => p !== ep.immunityWinner);
    const scores = candidates.map(n => {
      const juryBonds = (gs.jury || []).reduce((s,j) => s + getBond(j, n), 0);
      const campBonds = gs.activePlayers.filter(m=>m!==n).reduce((s,m) => s + getBond(n, m), 0);
      const juryNorm = (gs.jury?.length || 1);
      const campNorm = Math.max(1, gs.activePlayers.length - 1);
      return { name: n, score: (juryBonds / juryNorm) * juryWeight + (campBonds / campNorm) * campWeight, juryBonds, campBonds };
    });
    scores.sort((a,b) => b.score - a.score);
    const gaWinner = scores[0];
    const gaRunnerUp = scores[1] || null;
    gaTw.guardianAngel = gaWinner?.name || null;
    gaTw.gaScore = gaWinner?.score || 0;
    gaTw.gaRunnerUp = gaRunnerUp?.name || null;
    gaTw.gaRunnerUpScore = gaRunnerUp?.score || 0;
    gaTw.gaReason = gaWinner ? (
      gaWinner.juryBonds > gaWinner.campBonds ? `The jury remembers ${gaWinner.name}. The bonds ${pronouns(gaWinner.name).sub} built before being in power are now a shield.`
      : `${gaWinner.name} is the most connected player in the game. Camp bonds run deep — deep enough to earn protection.`
    ) : null;
    if (gaTw.guardianAngel) {
      ep.extraImmune = ep.extraImmune || [];
      ep.extraImmune.push(gaTw.guardianAngel);
    }
  }

  // ── CHALLENGE RECORD UPDATE: track wins/podiums/bombs, inject chalThreat events ──
  // Skip if a challenge twist already called updateChalRecord (dodgebrawl, cliff-dive, etc.)
  if (!ep.isDodgebrawl && !ep.isCliffDive && !ep.isAwakeAThon && !ep.isPhobiaFactor && !ep.isSayUncle && !ep.isTripleDogDare && !ep.isSlasherNight && !ep.isTalentShow && !ep.isSuckyOutdoors && !ep.isUpTheCreek && !ep.isPaintballHunt && !ep.isHellsKitchen && !ep.isTrustChallenge && !ep.isBasicStraining && !ep.isXtremeTorture && !ep.isBrunchOfDisgustingness && !ep.isLuckyHunt && !ep.isHideAndBeSneaky && !ep.isOffTheChain) {
    updateChalRecord(ep);
  }

  // ── CHALLENGE THROW CAMP EVENTS ──
  if (ep.challengeThrows?.length) {
    const _throwCampKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes[0]?.name || 'merge');
    ep.challengeThrows.forEach(ct => {
      const tPr = pronouns(ct.thrower);
      const tS = pStats(ct.thrower);
      if (ct.caught && ct.detectedBy?.length) {
        const detector = ct.detectedBy[0];
        const dPr = pronouns(detector);
        const dS = pStats(detector);
        const _pick = arr => arr[([...ct.thrower + detector].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
        // Camp event: someone saw through the throw
        if (ep.campEvents?.[_throwCampKey]) {
          const evtText = dS.boldness >= 7
            ? _pick([
              `${detector} pulls ${ct.thrower} aside after the challenge. "You threw that." ${ct.thrower} starts to deny it. ${detector}: "Don't. I watched you. You're better than that performance and we both know it." The accusation hangs in the air.`,
              `"Interesting performance out there, ${ct.thrower}," ${detector} says at camp. The sarcasm is barely concealed. "Funny how someone with ${tS.physical >= 7 ? 'your physical ability' : 'your track record'} suddenly can't keep up." ${ct.thrower}'s jaw tightens.`,
              `${detector} to confessional: "I've seen ${ct.thrower} compete. That was not ${tPr.pos} best. That was ${tPr.pos} worst — on purpose. ${tPr.Sub} ${tPr.sub==='they'?'think':'thinks'} nobody noticed. I noticed."`,
            ])
            : _pick([
              `${detector} doesn't say anything to ${ct.thrower} directly. But at camp, ${dPr.sub} ${dPr.sub==='they'?'mention':'mentions'} to someone: "Did that challenge look off to you? ${ct.thrower} just... stopped trying." The seed is planted.`,
              `${detector} watches ${ct.thrower} at camp after the challenge. Something doesn't add up. ${ct.thrower} was fine yesterday — strong, focused. Today ${tPr.sub} ${tPr.sub==='they'?'fell':'fell'} apart? ${detector} files it away. Not forgotten.`,
              `${detector} to confessional: "I think ${ct.thrower} threw that challenge. I can't prove it, but my gut says ${tPr.sub} didn't want to win today. And that tells me ${tPr.sub} ${tPr.sub==='they'?'are':'is'} playing a different game than the rest of us."`,
            ]);
          if (!ep.campEvents[_throwCampKey].post) ep.campEvents[_throwCampKey].post = [];
          ep.campEvents[_throwCampKey].post.push({
            type: 'challengeThrowCaught', players: [detector, ct.thrower], text: evtText,
            badgeText: 'THREW THE CHALLENGE', badgeClass: 'red',
          });
        }
      }
    });
    // Save throw data to ep for VP display on challenge screen
    ep.challengeThrowData = ep.challengeThrows;
  }

  // ── EXILE FORMAT: automatic exile every episode (winning tribe sends one from losing tribe) ──
  handleExileFormat(ep);

  // ── EXILE ISLAND: select exile BEFORE post-camp gen so they're excluded from events ──
  let _exileEvtData = null; // deferred camp-event injection (needs post arrays to exist)
  if (ep.exileIslandPending) {
    ep.exileIslandPending = false;
    const _exileTw = ep.twists?.find(t => t.type === 'exile-island');
    // Don't fire on multi/double tribal — can't pick a loser when everyone's going
    if (_exileTw && !ep.isMultiTribal && !ep.isDoubleTribal) {
      const _rp = a => a[Math.floor(Math.random() * a.length)];
      let _exiled = null, _chooser = null, _chooserTribe = null, _chooserMembers = null;

      if (!gs.isMerged && ep.winner && ep.loser) {
        // Pre-merge: WHOLE winning tribe decides together — weighted random from losing tribe
        const _winM = ep.winner.members.filter(m => gs.activePlayers.includes(m));
        const _losM = ep.loser.members.filter(m => gs.activePlayers.includes(m));
        if (_winM.length && _losM.length) {
          _chooserTribe   = ep.winner.name;
          _chooserMembers = _winM;
          // Tribe collectively targets perceived threats or intuitive players (idol hunters)
          _exiled = wRandom(_losM, n => Math.max(0.1, pStats(n).intuition * 0.35 + pStats(n).strategic * 0.15 + 0.5));
        }
      } else if (gs.isMerged && ep.immunityWinner) {
        // Post-merge: immunity winner alone picks someone (non-immune) to exile
        _chooser = ep.immunityWinner;
        const _eligible = gs.activePlayers.filter(p => p !== ep.immunityWinner && p !== ep.sharedImmunity && p !== ep.secondImmune);
        if (_eligible.length) {
          _exiled = wRandom(_eligible, n => Math.max(0.1, pStats(n).intuition * 0.35 + pStats(n).strategic * 0.15 + 0.5));
        }
      }

      if (_exiled) {
        _exileTw.exiled              = _exiled;
        _exileTw.exileChooser        = _chooser;        // null for pre-merge (tribe decision)
        _exileTw.exileChooserTribe   = _chooserTribe;
        _exileTw.exileChooserMembers = _chooserMembers; // winning tribe roster for VP display
        gs.exiledThisEp = _exiled; // set NOW so generateCampEvents excludes them

        // Post-merge only: immunity winner's personal call — bond hit is personal
        if (_chooser) addBond(_exiled, _chooser, -1.5);

        // Losing tribe: absent member drifts from tribemates; strategists may exploit the gap
        if (!gs.isMerged && ep.loser) {
          const _opp = ep.loser.members.filter(p => p !== _exiled && gs.activePlayers.includes(p) && pStats(p).strategic >= 6);
          if (_opp.length && Math.random() < 0.35) {
            const _plotter = _opp[Math.floor(Math.random() * _opp.length)];
            ep.loser.members.filter(p => p !== _exiled && p !== _plotter && gs.activePlayers.includes(p)).forEach(p => addBond(_exiled, p, -0.5));
            _exileTw.exileOpportunist = _plotter;
          }
        }

        // Prepare the event text — injection happens after post arrays are created
        const _evtKey = gs.isMerged ? (gs.mergeName || 'merge') : (_chooserTribe || ep.winner?.name);
        if (_evtKey) {
          const _exiledP = pronouns(_exiled);
          const _evtText = gs.isMerged
            ? _rp([
                `${_chooser} didn't hesitate. With the necklace secured, ${pronouns(_chooser).sub} pointed at ${_exiled} — sending ${_exiledP.obj} to Exile Island before tonight's vote.`,
                `The immunity win gave ${_chooser} a choice. ${pronouns(_chooser).Sub} chose ${_exiled}. No explanation offered.`,
                `${_chooser} used the power of immunity to remove ${_exiled} from camp. Exile Island. Gone until the vote happens.`,
              ])
            : _rp([
                `${_chooserTribe} made their decision. ${_exiled} was going to Exile Island — chosen by the whole tribe.`,
                `After the challenge, ${_chooserTribe} huddled. They didn't take long. ${_exiled} was heading to Exile Island.`,
                `${_chooserTribe} spoke with one voice: ${_exiled} was the pick. Exile Island.`,
              ]);
          _exileEvtData = { key: _evtKey, evt: { type: 'exile-selection', text: _evtText, players: _chooser ? [_chooser, _exiled] : [_exiled] } };
        }
      } else {
        // No valid pick — cancel the exile twist
        const _idx = ep.twists.indexOf(_exileTw);
        if (_idx >= 0) ep.twists.splice(_idx, 1);
        if (ep.twist === _exileTw) ep.twist = null;
      }
    }
  }

  // ── Emissary Vote: selection + scouting (runs post-challenge, needs ep.winner/ep.loser) ──
  if (ep.isEmissaryVote) executeEmissarySelection(ep);
  if (ep.emissary) generateEmissaryScoutEvents(ep);

  // ── POST-CHALLENGE CAMP EVENTS (outcome now known — exiled player already excluded) ──
  generateCampEvents(ep, 'post');
  // ── HUNGER FLAVOR: when tribe food is Critical, add starvation context to some camp events ──
  if (seasonConfig.foodWater === 'enabled' && ep.campEvents) {
    const _hungerSuffixes = [
      ' The hunger is making everything worse.',
      ' Nobody has eaten properly in days — it shows.',
      ' The exhaustion is visible. Every conversation is slower, every reaction sharper.',
      ' Empty stomachs make bad decisions. This might be one of them.',
      ' The tribe is running on fumes. This conversation wouldn\'t be happening on a full stomach.',
    ];
    Object.entries(ep.campEvents).forEach(([campKey, phaseData]) => {
      const tribeFood = gs.tribeFood?.[campKey] || 60;
      if (tribeFood >= 20) return; // only Critical food level
      const allEvs = [...(Array.isArray(phaseData) ? phaseData : [...(phaseData?.pre || []), ...(phaseData?.post || [])])];
      // Add hunger flavor to ~30% of strategy/social events (not survival events which already have it)
      const _hungerTypes = new Set(['doubt', 'strategicTalk', 'sideDeal', 'allianceCrack', 'scramble', 'lie', 'confessional']);
      allEvs.forEach(evt => {
        if (_hungerTypes.has(evt.type) && Math.random() < 0.3 && evt.text && !evt.text.includes('hunger') && !evt.text.includes('starv')) {
          evt.text += _hungerSuffixes[Math.floor(Math.random() * _hungerSuffixes.length)];
        }
      });
    });
  }

  // Save pre-tribal advantage snapshot for VP post-challenge camp display
  ep.advantagesPreTribal = gs.advantages.map(a => ({...a}));
  // Save pre-tribal alliance snapshot for VP camp display (captures in-episode recruitment)
  ep.alliancesPreTribal = (gs.namedAlliances || []).map(a => ({ ...a, members: [...a.members], betrayals: [...(a.betrayals || [])] }));

  // ── Inject exile-selection event into winner tribe's post events ──
  if (_exileEvtData && ep.campEvents?.[_exileEvtData.key]) {
    const _ce = ep.campEvents[_exileEvtData.key];
    if (Array.isArray(_ce)) _ce.unshift(_exileEvtData.evt);
    else (_ce.post = _ce.post || []).unshift(_exileEvtData.evt);
  }

  // ── Inject shared-immunity / double-safety camp events ──
  const _mergeCampKey = gs.isMerged ? (gs.mergeName || 'merge') : null;
  const sharedTw = (ep.twists||[]).find(t => t.type === 'shared-immunity');
  const dblSafeTw = (ep.twists||[]).find(t => t.type === 'double-safety');
  if (sharedTw?.sharedWith && _mergeCampKey && ep.campEvents?.[_mergeCampKey]) {
    const _ce = ep.campEvents[_mergeCampKey];
    const _postArr = Array.isArray(_ce) ? _ce : (_ce.post = _ce.post || []);
    const _sp = pronouns(sharedTw.sharedWith);
    _postArr.unshift({ type: 'bond', players: [ep.immunityWinner, sharedTw.sharedWith],
      text: `${ep.immunityWinner} walks over to ${sharedTw.sharedWith} and places the necklace around ${_sp.pos} neck. No words needed. The tribe watches in silence.` });
    if (sharedTw.snubbed) {
      const _snP = pronouns(sharedTw.snubbed);
      _postArr.push({ type: 'doubt', players: [sharedTw.snubbed, ep.immunityWinner],
        text: `${sharedTw.snubbed} stares at the ground. ${_snP.Sub} thought that necklace was coming ${_snP.pos} way. It didn't. That changes things.` });
    }
  }
  if (dblSafeTw?.secondImmune && _mergeCampKey && ep.campEvents?.[_mergeCampKey]) {
    const _ce = ep.campEvents[_mergeCampKey];
    const _postArr = Array.isArray(_ce) ? _ce : (_ce.post = _ce.post || []);
    const _dp = pronouns(dblSafeTw.secondImmune);
    _postArr.unshift({ type: 'bond', players: [dblSafeTw.secondImmune],
      text: `${dblSafeTw.secondImmune} came second in the challenge — and earned safety for it. ${_dp.Sub} can breathe tonight. The rest of the tribe cannot.` });
  }

  if (gs.exiledThisEp) {
    const exiled = gs.exiledThisEp;
    // Twist version: player skips tribal (removed from tribalPlayers)
    // Format version: player returns for tribal (stays in tribalPlayers)
    if (!ep.exileFormatMode && ep.tribalPlayers) ep.tribalPlayers = ep.tribalPlayers.filter(p => p !== exiled);
    // Exile Island search — separate roll for each find tier
    // Idol: hard (~15-25%), Extra Vote: moderate (~25-35%), Idol Clue: easier (~35-50%)
    // Rolls are exclusive — first hit wins, checked from hardest to easiest
    const eS = pStats(exiled);
    const _intMod = eS.intuition * 0.01;
    const _exileTwObj = (ep.twists||[]).find(t => t.type === 'exile-island');
    const _hasIdol = gs.advantages.some(a => a.holder === exiled && a.type === 'idol');
    const _idolMax = cfg.advantages?.idol?.count || 2;
    const _idolsInPlay = gs.advantages.filter(a => a.type === 'idol').length;
    const _exileSrc = type => (cfg.advantages?.[type]?.sources || ADVANTAGES.find(a => a.key === type)?.defaultSources || []).includes('exile');
    const _roll = Math.random();

    if (!_hasIdol && _idolsInPlay < _idolMax && cfg.advantages?.idol?.enabled && _roll < 0.12 + _intMod) {
      // ~13-22% — Hidden Immunity Idol (hardest)
      gs.advantages.push({ holder: exiled, type: 'idol', foundEp: epNum });
      ep.idolFinds.push({ finder: exiled, location: 'Exile Island' });
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'idol', label: 'Hidden Immunity Idol' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'idol', label: 'Hidden Immunity Idol' };
    } else if (cfg.advantages?.secondLife?.enabled && _exileSrc('secondLife')
      && !gs.advantages.some(a => a.type === 'secondLife')
      && _roll < 0.16 + _intMod) {
      // ~4-6% window — Second Life Amulet (rare)
      gs.advantages.push({ holder: exiled, type: 'secondLife', foundEp: epNum });
      ep.idolFinds.push({ finder: exiled, type: 'secondLife', location: 'Exile Island' });
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'secondLife', label: 'Second Life Amulet' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'secondLife', label: 'Second Life Amulet' };
    } else if (cfg.advantages?.safetyNoPower?.enabled && _exileSrc('safetyNoPower')
      && gs.advantages.filter(a => a.type === 'safetyNoPower').length < (cfg.advantages.safetyNoPower.count || 1)
      && _roll < 0.19 + _intMod) {
      // ~3-5% window — Safety Without Power (rare)
      gs.advantages.push({ holder: exiled, type: 'safetyNoPower', foundEp: epNum });
      ep.idolFinds.push({ finder: exiled, type: 'safetyNoPower', location: 'Exile Island' });
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'safetyNoPower', label: 'Safety Without Power' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'safetyNoPower', label: 'Safety Without Power' };
    } else if (cfg.advantages?.soleVote?.enabled && _exileSrc('soleVote')
      && gs.advantages.filter(a => a.type === 'soleVote').length < (cfg.advantages.soleVote.count || 1)
      && _roll < 0.22 + _intMod) {
      // ~3-5% window — Sole Vote (rare)
      gs.advantages.push({ holder: exiled, type: 'soleVote', foundEp: epNum });
      ep.idolFinds.push({ finder: exiled, type: 'soleVote', location: 'Exile Island' });
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'soleVote', label: 'Sole Vote' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'soleVote', label: 'Sole Vote' };
    } else if (cfg.advantages?.extraVote?.enabled && _exileSrc('extraVote')
      && gs.advantages.filter(a => a.type === 'extraVote').length < (cfg.advantages.extraVote.count || 1)
      && _roll < 0.30 + _intMod) {
      // ~8-18% window — Extra Vote
      gs.advantages.push({ holder: exiled, type: 'extraVote', foundEp: epNum });
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'extraVote', label: 'Extra Vote' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'extraVote', label: 'Extra Vote' };
    } else if (cfg.advantages?.idol?.enabled && _roll < 0.45 + _intMod) {
      // ~15-25% window — Idol Clue
      if (_exileTwObj) _exileTwObj.exileFound = { type: 'clue', label: 'Idol Clue' };
      if (ep.exileFormatData) ep.exileFormatData.exileFound = { type: 'clue', label: 'Idol Clue' };
      gs.playerStates[exiled] = gs.playerStates[exiled] || {};
      gs.playerStates[exiled].eavesdropBoostThisEp = true;
    } else {
      // ~55-84% — found nothing
      if (_exileTwObj) _exileTwObj.exileFound = null;
      if (ep.exileFormatData) ep.exileFormatData.exileFound = null;
    }

    // Exile Format: player returns for tribal — clear exile flag so they're included
    if (ep.exileFormatMode) {
      gs.exiledThisEp = null;
    }
    // Re-snapshot advantages after exile search so found advantages appear in camp display
    ep.advantagesPreTribal = gs.advantages.map(a => ({...a}));
  }

  // ── LAST CHANCE CHALLENGE: 2-player tribe loses → 1v1 duel, loser out, winner absorbed ──
  // Last Chance only fires when tribe would dissolve AND there are 3+ tribes remaining
  // (otherwise run a normal tribal — 2 people can still vote each other out)
  // Last Chance: disabled — 2-person tribes go to normal tribal, dissolution handled post-vote
  if (false && ep.tribalPlayers?.length === 2 && ep.challengeType === 'tribe' && gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 1).length >= 3) {
    const [_lcA, _lcB] = ep.tribalPlayers;
    const _lc = simulateLastChance(_lcA, _lcB);
    ep.lastChance = _lc;
    ep.eliminated = _lc.loser;
    const _lcFromName = ep.loser.name;
    // Find destination for winner — best bond fit among other tribes
    const _lcCands = gs.tribes.filter(t => t.name !== _lcFromName && t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
    const _lcDest = _lcCands.slice().sort((a, b) => {
      const bA = a.members.reduce((s, m) => s + getBond(_lc.winner, m), 0) / (a.members.length || 1);
      const bB = b.members.reduce((s, m) => s + getBond(_lc.winner, m), 0) / (b.members.length || 1);
      return bB - bA;
    })[0] || null;
    ep.lastChance.toTribe = _lcDest?.name || null;
    ep.tribeDissolve = _lcDest ? { player: _lc.winner, fromTribe: _lcFromName, toTribe: _lcDest.name } : null;
    // Eliminate loser — with RI check
    if (isRIStillActive()) {
      if (cfg.riFormat === 'rescue') {
        gs.riPlayers.push(_lc.loser);
        if (!gs.riArrivalEp) gs.riArrivalEp = {};
        gs.riArrivalEp[_lc.loser] = epNum;
      } else {
        const _lcRi = simulateRIChoice(_lc.loser);
        if (_lcRi === 'REDEMPTION ISLAND') gs.riPlayers.push(_lc.loser);
        else { gs.eliminated.push(_lc.loser); if (gs.isMerged) gs.jury.push(_lc.loser); }
      }
    } else {
      gs.eliminated.push(_lc.loser);
      if (gs.isMerged) gs.jury.push(_lc.loser);
    }
    gs.activePlayers = gs.activePlayers.filter(p => p !== _lc.loser);
    handleAdvantageInheritance(_lc.loser, ep);
    gs.advantages = gs.advantages.filter(a => a.holder !== _lc.loser);
    // Move winner, dissolve tribe
    gs.tribes = gs.tribes
      .filter(t => t.name !== _lcFromName)
      .map(t => _lcDest && t.name === _lcDest.name ? { ...t, members: [...t.members, _lc.winner] } : t);
    // Generate post-challenge events including arrival
    generateCampEvents(ep, 'post');
    if (_lcDest) {
      const _wP = pronouns(_lc.winner);
      const _arrLc = [
        `${_lc.winner} survived the Last Chance Challenge and walks straight into ${_lcDest.name} camp. No alliance, no history here — just the fact that ${_wP.sub} ${_wP.sub==='they'?'beat':'beat'} someone to get here.`,
        `${_lcFromName} is gone. ${_lc.winner} earned ${_wP.posAdj} spot and ${_wP.sub} ${_wP.sub==='they'?'know':'knows'} it. ${_lcDest.name} gets a new face who just proved they'll fight to stay.`,
        `${_lc.winner} shows up at ${_lcDest.name} camp after winning a head-to-head duel. The tribe watches ${_wP.obj} settle in and immediately starts doing the math.`,
        `${_lcFromName} is dissolved. ${_lc.winner} arrives at ${_lcDest.name} — the survivor of a challenge that eliminated ${_lc.loser}. Everyone knows what that means about ${_wP.obj}.`,
      ];
      if (!ep.campEvents[_lcDest.name]) ep.campEvents[_lcDest.name] = { pre: [], post: [] };
      ep.campEvents[_lcDest.name].post.unshift({ type: 'tribeArrival', text: _arrLc[Math.floor(Math.random() * _arrLc.length)] });
    }
    ep.alliances = [];
    ep.bondChanges = updateBonds([], ep.eliminated, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
    gs.episode = epNum;
    gs.episodeHistory.push({ num: epNum, eliminated: ep.eliminated, riChoice: ep.riChoice || null, immunityWinner: null,
      challengeType: ep.challengeType, isMerge: ep.isMerge, votes: {}, alliances: [],
      lastChance: true, riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState() });
    const stLC = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stLC; ep.summaryText = stLC;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── TRIBE DISSOLUTION: if the losing tribe has only 1 player left, dissolve it ──
  if (ep.tribalPlayers?.length === 1 && ep.challengeType === 'tribe') {
    const _soloP = ep.tribalPlayers[0];
    const _fromName = ep.loser.name;
    const _candTribes = gs.tribes.filter(t => t.name !== _fromName && t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
    if (_candTribes.length) {
      // Send them to the tribe they have the most bonds with
      const _destTribe = _candTribes.slice().sort((a, b) => {
        const bA = a.members.reduce((s, m) => s + getBond(_soloP, m), 0) / (a.members.length || 1);
        const bB = b.members.reduce((s, m) => s + getBond(_soloP, m), 0) / (b.members.length || 1);
        return bB - bA;
      })[0];
      ep.tribeDissolve = { player: _soloP, fromTribe: _fromName, toTribe: _destTribe.name };
      // Rebuild tribe list: remove dissolved tribe, add player to destination
      gs.tribes = gs.tribes
        .filter(t => t.name !== _fromName)
        .map(t => t.name === _destTribe.name ? { ...t, members: [...t.members, _soloP] } : t);
      ep.tribalPlayers = [];
      ep.noTribal = true;
      // Generate post events — destination tribe now includes the arrival
      generateCampEvents(ep, 'post');
      // Inject a guaranteed arrival event for the destination tribe
      const _sP = pronouns(_soloP);
      const _arrLines = [
        `${_soloP} arrives at ${_destTribe.name} camp with nothing but ${_sP.posAdj} bag and no allies. The tribe takes stock. Someone is already thinking about what this means.`,
        `${_destTribe.name} gets a new addition. ${_soloP} was the last one standing on ${_fromName}. Now ${_sP.sub} ${_sP.sub==='they'?'have':'has'} to rebuild from scratch with strangers.`,
        `${_soloP} walks into ${_destTribe.name} camp. ${_sP.Sub} ${_sP.sub==='they'?'try':'tries'} to look confident. Nobody here knows ${_sP.obj} — which is both the problem and the opening.`,
        `${_fromName} is gone. ${_soloP} joins ${_destTribe.name} — the tribe ${_sP.sub} ${_sP.sub==='they'?'have':'has'} been watching from across the challenge course. Everything starts over.`,
      ];
      if (!ep.campEvents[_destTribe.name]) ep.campEvents[_destTribe.name] = { pre: [], post: [] };
      ep.campEvents[_destTribe.name].post.unshift({ type: 'tribeArrival', text: _arrLines[Math.floor(Math.random() * _arrLines.length)] });
      // Close episode with no vote
      ep.alliances = [];
      ep.bondChanges = updateBonds([], null, []);
      detectBetrayals(ep);
      updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
      updateSurvival(ep);
      if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
      gs.episode = epNum;
      gs.episodeHistory.push({ num: epNum, eliminated: null, riChoice: null, immunityWinner: null,
        challengeType: ep.challengeType, isMerge: ep.isMerge, votes: {}, alliances: [],
        riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
        advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState() });
      const stTD = generateSummaryText(ep);
      gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stTD; ep.summaryText = stTD;
      window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
    }
  }

  // ── NO TRIBAL — episode ran normally (challenge, camp, journey) but no vote tonight ──
  if (ep.noTribal) {
    // No tribal this episode — journey lost votes are consumed (no vote to lose, penalty spent)
    if (gs.journeyLostVotes?.length) {
      gs.journeyLostVotes = gs.journeyLostVotes.filter(p => !gs.activePlayers.includes(p));
    }
    ep.eliminated = null;
    ep.alliances = [];
    ep.bondChanges = updateBonds([], null, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
    gs.episodeHistory.push({ num: epNum, eliminated: null, riChoice: null,
      immunityWinner: ep.immunityWinner || null, challengeType: ep.challengeType || null,
      isMerge: ep.isMerge, votes: {}, alliances: [], noTribal: true,
      twists: (ep.twists||[]).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      challengeLabel: ep.challengeLabel || null, challengeCategory: ep.challengeCategory || null,
      challengeDesc: ep.challengeDesc || null, challengePlacements: ep.challengePlacements || null,
      chalPlacements: ep.chalPlacements || null,
      chalMemberScores: ep.chalMemberScores || null, chalSitOuts: ep.chalSitOuts || null,
      winner: ep.winner ? { name: ep.winner.name, members: [...ep.winner.members] } : null,
      loser: ep.loser ? { name: ep.loser.name, members: [...ep.loser.members] } : null,
      riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
      spiritIslandEvents: ep.spiritIslandEvents || null,
      shotInDark: ep.shotInDark || null, kipSteal: ep.kipSteal || null, idolShares: ep.idolShares || [],
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState() });
    const stNT = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stNT; ep.summaryText = stNT;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── ALLIANCES ──
  const tribeLabel = ep.challengeType === 'tribe' ? ep.loser.name : null;
  gs._pendingDepartures = [];
  // Guaranteed immunity (auction, legacy advantage, etc.) → merge into extraImmune
  if (gs.guaranteedImmuneThisEp && !ep.extraImmune?.includes(gs.guaranteedImmuneThisEp)) {
    ep.extraImmune = [...new Set([...(ep.extraImmune || []), gs.guaranteedImmuneThisEp])];
  }
  // Track immune players so pickTarget/formAlliances won't target them
  gs._currentImmuneNames = [ep.immunityWinner, ...(ep.extraImmune || [])].filter(Boolean);
  // Expose lost-vote players to formAlliances so fallbackLabel uses voter count for size labels
  gs.lostVoteThisEp = [...(gs.lostVotes || [])];
  let alliances  = formAlliances(ep.tribalPlayers, tribeLabel, ep.challengeCategory);
  // Volunteer Exile Duel: override alliance targets to the volunteer
  if (ep.volunteerDuel && gs._volunteerDuelHeat?.[ep.volunteerDuel.volunteer]) {
    const _volName = ep.volunteerDuel.volunteer;
    if (ep.tribalPlayers.includes(_volName)) {
      // The biggest alliance should target the volunteer — they asked for it
      const _biggestAlliance = alliances.filter(a => a.type !== 'solo').sort((a, b) => b.members.length - a.members.length)[0];
      if (_biggestAlliance && _biggestAlliance.target !== _volName) {
        _biggestAlliance.target = _volName;
      }
    }
  }
  ep.alliances = alliances;
  // Save split vote plans for betrayal exemption + VP display
  ep.splitVotePlans = alliances.filter(a => a.splitTarget).map(a => ({
    alliance: a.label, primary: a.target, secondary: a.splitTarget,
    primaryVoters: [...(a.splitPrimary || [])], secondaryVoters: [...(a.splitSecondary || [])],
    reason: a.splitReason,
  }));
  // Flush pre-tribal fractures detected inside formAlliances into ep.allianceQuits
  if (gs._pendingDepartures?.length) {
    ep.allianceQuits = ep.allianceQuits || [];
    ep.allianceQuits.push(...gs._pendingDepartures);
    // Generate a camp event for each departure so it shows up in the VP viewer
    gs._pendingDepartures.forEach(q => {
      const _pdTribeName = gs.isMerged ? 'merge'
        : gs.tribes.find(t => t.members.includes(q.player))?.name;
      if (!_pdTribeName || !ep.campEvents?.[_pdTribeName]) return;
      const _pdPrn = pronouns(q.player);
      const _pdLines = [
        `${q.player} walks into tribal knowing ${_pdPrn.sub} ${_pdPrn.sub==='they'?'are':'is'} no longer part of ${q.alliance}. The alliance made the call without ${_pdPrn.obj}. ${_pdPrn.Sub} got the message.`,
        `${q.player} is out of ${q.alliance}. Not by choice — the group stopped including ${_pdPrn.obj} in the plan. ${_pdPrn.Sub} ${_pdPrn.sub==='they'?'notice':'notices'} it before tribal and files it away.`,
        `The conversations before tribal tell ${q.player} everything. ${_pdPrn.Sub} ${_pdPrn.sub==='they'?'aren\'t':'isn\'t'} in the ${q.alliance} plan anymore. ${_pdPrn.Sub} ${_pdPrn.sub==='they'?'have':'has'} to figure out what that means for tonight's vote.`,
      ];
      const _pdText = _pdLines[Math.floor(Math.random() * _pdLines.length)];
      const _pdBlock = ep.campEvents[_pdTribeName];
      (_pdBlock.post?.length >= 0 ? _pdBlock.post : _pdBlock.pre).push({ type: 'allianceCrack', text: _pdText, players: [q.player] });
    });
    gs._pendingDepartures = [];
  }
  if (gs.phase === 'pre-merge') {
    gs.alliances = [];
    gs.tribes.forEach(t => gs.alliances.push(...formAlliances(t.members, t.name, ep.challengeCategory)));
  } else {
    gs.alliances = formAlliances(gs.activePlayers, null, null);
  }

  // Helper: run one full vote + idol + resolve (with revote on tie)
  function runTribal(tribalPlayers, immuneName, allianceSet) {
    // open-vote: boost loyalty pressure — pass flag to simulateVotes
    // Combine challenge winner + shared-immunity/double-safety immune players
    const _allImmune = [immuneName, ...(ep.extraImmune || [])].filter(Boolean);
    // ── OPEN VOTE: generate voting order ──
    // The immunity winner chooses the order — driven by relationships, alliance, and personality
    if (ep.openVote && !ep.openVoteOrder) {
      const _orderer = ep.immunityWinner || (() => {
        const _majA = (allianceSet||[]).sort((a,b) => b.members.length - a.members.length)[0];
        if (_majA?.members.length) {
          return _majA.members.slice().sort((a,b) => (pStats(b).social + pStats(b).strategic) - (pStats(a).social + pStats(a).strategic))[0];
        }
        return tribalPlayers[0];
      })();
      const _ordererS = _orderer ? pStats(_orderer) : null;
      const _voters = tribalPlayers.filter(n => !gs.lostVotes?.includes(n));
      const _ordererAlliance = (allianceSet||[]).find(a => a.members.includes(_orderer));
      const _allianceTarget = _ordererAlliance?.target;

      // Score each voter for position priority (lower score = votes earlier)
      // The orderer constructs the sequence based on who they want pressured vs protected
      _voters.sort((a, b) => {
        const bondA = getBond(_orderer, a), bondB = getBond(_orderer, b);
        let scoreA = 0, scoreB = 0;

        // ENEMIES go first — power move, make them sweat
        if (bondA <= -3) scoreA -= 5;
        if (bondB <= -3) scoreB -= 5;
        if (bondA <= -1) scoreA -= 2;
        if (bondB <= -1) scoreB -= 2;

        // Alliance TARGET goes first — watch the votes pile up against you
        if (a === _allianceTarget) scoreA -= 4;
        if (b === _allianceTarget) scoreB -= 4;

        // High threats go early — force them to commit under pressure
        scoreA -= threatScore(a) * 0.3;
        scoreB -= threatScore(b) * 0.3;

        // Swing votes go early — force undecideds to pick a side before they see momentum
        const aInAlliance = _ordererAlliance?.members.includes(a);
        const bInAlliance = _ordererAlliance?.members.includes(b);
        if (!aInAlliance) scoreA -= 1.5;
        if (!bInAlliance) scoreB -= 1.5;

        // ALLIES go later — let the plan build, they vote with confidence from safety
        if (bondA >= 3) scoreA += 3;
        if (bondB >= 3) scoreB += 3;
        if (aInAlliance) scoreA += 2;
        if (bInAlliance) scoreB += 2;

        // Closest ally goes second-to-last — maximum protection
        if (bondA >= 5) scoreA += 2;
        if (bondB >= 5) scoreB += 2;

        // SELF goes last — maximum information advantage
        if (a === _orderer) scoreA += 10;
        if (b === _orderer) scoreB += 10;

        // Bold orderer: self FIRST instead (leads by example)
        if (_ordererS?.boldness >= 8) {
          if (a === _orderer) scoreA -= 20; // override to first
          if (b === _orderer) scoreB -= 20;
        }

        // Tiebreak: slight randomness so the order isn't perfectly predictable
        scoreA += Math.random() * 0.5;
        scoreB += Math.random() * 0.5;

        return scoreA - scoreB;
      });
      ep.openVoteOrder = _voters;
      ep.openVoteOrderedBy = _orderer;
    }

    // ── TRIBAL DISRUPTION: hotheads may blow up at tribal, shifting the vote ──
    // Low temperament players who sense they're targeted sometimes confront their accuser publicly.
    // This can redirect votes AWAY from the hothead (the outburst makes others reconsider)
    // or TOWARD them (the outburst confirms they're dangerous). Coin flip of chaos.
    if (!ep.tribalDisruption) {
      const _disruptCandidates = tribalPlayers.filter(p => {
        const _ts = pStats(p);
        // Proportional: disruption chance = inverse temperament + boldness
        return Math.random() < ((10 - _ts.temperament) * 0.04 + _ts.boldness * 0.03) && !_allImmune.includes(p)
          && computeHeat(p, tribalPlayers, allianceSet) >= 2.5;
      });
      if (_disruptCandidates.length && Math.random() < 0.20) {
        const _disruptor = _disruptCandidates[Math.floor(Math.random() * _disruptCandidates.length)];
        const _dPr = pronouns(_disruptor);
        // Find who's organizing against them
        const _organizer = tribalPlayers.find(p => p !== _disruptor
          && allianceSet.some(a => a.members.includes(p) && a.target === _disruptor));
        if (_organizer) {
          // 50/50: disruption helps or hurts
          const _helpsDisruptor = Math.random() < 0.50;
          if (_helpsDisruptor) {
            // Outburst makes tribe reconsider — some voters shift away
            // Reduce heat on disruptor, increase on organizer (exposed)
            addBond(_disruptor, _organizer, -1.0); // feud deepens
            tribalPlayers.filter(p => p !== _disruptor && p !== _organizer).forEach(p => {
              if (getBond(p, _disruptor) > -2 && Math.random() < 0.30) addBond(p, _organizer, -0.3);
            });
          } else {
            // Outburst confirms they're dangerous — votes pile on
            tribalPlayers.filter(p => p !== _disruptor).forEach(p => {
              if (Math.random() < 0.20) addBond(p, _disruptor, -0.3);
            });
          }
          ep.tribalDisruption = { disruptor: _disruptor, organizer: _organizer, helped: _helpsDisruptor };
        }
      }
    }

    // ── Safety Without Power: holder leaves tribal before votes are cast ──
    const _snpAdvs = gs.advantages.filter(a => a.type === 'safetyNoPower' && tribalPlayers.includes(a.holder));
    for (const _snpAdv of _snpAdvs) {
      const _snpHolder = _snpAdv.holder;
      const _snpS = pStats(_snpHolder);
      const _snpHeat = computeHeat(_snpHolder, tribalPlayers, []);
      const _snpForcePlay = ep._forceAdvantages || gs.activePlayers.length <= (seasonConfig.advExpire || 4);
      const _snpPlayChance = _snpForcePlay ? 1.0 : _snpHeat * (0.05 + _snpS.strategic * 0.005) + (10 - _snpS.loyalty) * 0.02 + _snpS.boldness * 0.02;
      if (Math.random() >= _snpPlayChance) continue;

      // Warning decision: tell closest ally?
      const _snpAllyPool = tribalPlayers.filter(p => p !== _snpHolder && getBond(_snpHolder, p) >= 2)
        .sort((a, b) => getBond(_snpHolder, b) - getBond(_snpHolder, a));
      const _snpClosestAlly = _snpAllyPool[0] || null;
      const _snpWarnChance = _snpClosestAlly
        ? _snpS.loyalty * 0.06 + getBond(_snpHolder, _snpClosestAlly) * 0.04
        : 0;
      const _snpWarned = _snpClosestAlly && Math.random() < _snpWarnChance ? _snpClosestAlly : null;

      // Execute: remove holder from tribal
      gs.advantages.splice(gs.advantages.indexOf(_snpAdv), 1);
      gs.knownSafetyNoPowerHolders?.delete(_snpHolder);
      tribalPlayers.splice(tribalPlayers.indexOf(_snpHolder), 1);
      gs.lostVotes.push(_snpHolder);

      // Bond consequences
      const _snpPr = pronouns(_snpHolder);
      tribalPlayers.forEach(p => {
        const bond = getBond(p, _snpHolder);
        if (p === _snpWarned) {
          addBond(p, _snpHolder, -0.5); // warned ally — mild
        } else if (bond >= 2) {
          addBond(p, _snpHolder, _snpWarned ? -1.0 : -1.5); // ally not warned — abandonment
        } else {
          addBond(p, _snpHolder, -0.3); // general coward perception
        }
      });

      // Popularity
      if (seasonConfig.popularityEnabled && gs.popularity) {
        gs.popularity[_snpHolder] = (gs.popularity[_snpHolder] || 0) + (_snpWarned ? -0.2 : 0.3);
      }

      // Heat next episode
      gs.safetyNoPowerHeat = { player: _snpHolder, ep: (gs.episode || 0) + 1 };

      // bigMoves
      const _snpBmState = getPlayerState(_snpHolder);
      _snpBmState.bigMoves = (_snpBmState.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(_snpHolder)) gs.bigMoveEarnersThisEp.push(_snpHolder);

      // Record
      ep.idolPlays = ep.idolPlays || [];
      ep.idolPlays.push({ player: _snpHolder, type: 'safetyNoPower', warned: _snpWarned, surprise: !_snpWarned, forced: _snpForcePlay });
      ep.safetyNoPowerPlayed = { holder: _snpHolder, warnedAlly: _snpWarned, surprise: !_snpWarned };
      gs.safetyNoPowerPlayed = { holder: _snpHolder, warnedAlly: _snpWarned, surprise: !_snpWarned };
      // SNP holder leaves tribal — immune to votes AND cannot vote
      _allImmune.push(_snpHolder);
      if (!gs.lostVotes) gs.lostVotes = [];
      if (!gs.lostVotes.includes(_snpHolder)) gs.lostVotes.push(_snpHolder);
      break; // one per tribal
    }

    // Snapshot bonds before vote — triggers need pre-vote bond values
    ep._preVoteBondSnapshot = { ...gs.bonds };

    const { votes, log, defections, voteMiscommunications, votePitches: _vpResult } = simulateVotes(tribalPlayers, _allImmune, allianceSet, gs.lostVotes, ep.openVote);
    if (_vpResult) ep.votePitches = _vpResult;
    if (voteMiscommunications?.length) ep.voteMiscommunications = (ep.voteMiscommunications || []).concat(voteMiscommunications);
    if (defections?.length) ep.defections = [...(ep.defections || []), ...defections];

    // ── OPEN VOTE: sequential cascade — re-process votes with visible tally ──
    if (ep.openVote && ep.openVoteOrder?.length) {
      const _origLog = [...log];
      const _newVotes = {};
      const _newLog = [];
      const _cascadeSwitches = [];
      const _openReactions = [];
      const _intimidators = new Set();

      ep.openVoteOrder.forEach((voter, position) => {
        const origEntry = _origLog.find(l => l.voter === voter);
        if (!origEntry) return; // lost vote, skipped

        let finalTarget = origEntry.voted;
        let switched = false;

        // Check cascade pressure (position 2+)
        if (position > 0 && Object.keys(_newVotes).length > 0) {
          const _sorted = Object.entries(_newVotes).sort(([,a],[,b]) => b - a);
          const _leader = _sorted[0]?.[0];
          const _leaderVotes = _sorted[0]?.[1] || 0;
          const _totalSoFar = Object.values(_newVotes).reduce((s,v) => s + v, 0);

          if (_leader && _leader !== finalTarget) {
            const s = pStats(voter);
            const _myAlliance = (allianceSet||[]).find(a => a.members.includes(voter));
            const _leaderIsAllianceTarget = _myAlliance?.target === _leader;
            const _bondWithLeader = getBond(voter, _leader);
            const _isIntimidated = s.boldness <= 4 && (_intimidators.size > 0 || ep._openFirstVoterIntimidates);

            // Strategic players resist cascade pressure — they see the bigger picture and stick to the plan
            const _strategicResist = -(s.strategic * 0.03); // proportional: stat 5=-0.15, stat 8=-0.24, stat 10=-0.30
            const _cascade = (_leaderVotes / Math.max(1, _totalSoFar)) * 0.4
              + (_leaderIsAllianceTarget ? 0.2 : 0)
              - (_bondWithLeader >= 4 ? 0.3 : 0)
              - (s.boldness >= 7 ? 0.15 : 0)
              + (_isIntimidated ? 0.15 : 0)
              + _strategicResist
              + Math.random() * 0.1;

            const _loyaltyThreshold = (s.loyalty - (s.boldness - 5) * 0.3) / 11;

            if (_cascade > _loyaltyThreshold) {
              finalTarget = _leader;
              switched = true;
              _cascadeSwitches.push({ voter, originalTarget: origEntry.voted, newTarget: _leader, position });
            }
          }
        }

        // Track intimidation (early voters with high physical/boldness)
        const _vs = pStats(voter);
        if (position <= 2 && (_vs.physical >= 8 || _vs.boldness >= 8)) {
          _intimidators.add(voter);
        }

        // Record vote
        _newVotes[finalTarget] = (_newVotes[finalTarget] || 0) + 1;
        _newLog.push({
          voter, voted: finalTarget,
          reason: switched ? `switched under pressure \u2014 originally planned ${origEntry.voted}` : origEntry.reason,
          cascadeSwitched: switched,
          originalTarget: switched ? origEntry.voted : null,
          position
        });

        // Generate reaction from target
        const _targetS = pStats(finalTarget);
        const _bond = getBond(voter, finalTarget);
        let _reaction;
        if (_bond >= 3) _reaction = `${finalTarget}'s eyes widen. Didn't expect that from ${voter}.`;
        else if (_bond <= -2) _reaction = `${finalTarget} nods. Knew it was coming.`;
        else if (_targetS.temperament >= 7) _reaction = `${finalTarget} doesn't react. Just watches.`;
        else if (_targetS.temperament <= 3) _reaction = `${finalTarget} looks away.`;
        else _reaction = `${finalTarget} nods slowly.`;

        _openReactions.push({ voter, target: finalTarget, position, reaction: _reaction, switched });
      });

      // Apply per-vote bond consequences
      _newLog.forEach((entry) => {
        const { voter, voted: target } = entry;
        const _bond = getBond(voter, target);

        // Voting against a friend: extra bond damage
        if (_bond >= 3) addBond(voter, target, -0.5);

        // Voting against an enemy: solidarity with co-voters
        if (_bond <= -2) {
          _newLog.filter(l => l.voted === target && l.voter !== voter).forEach(l => addBond(voter, l.voter, 0.3));
        }

        // Friend watching you vote against them: double damage
        if (_bond >= 3) addBond(target, voter, -2.0);
        else if (_bond <= -2) addBond(target, voter, -0.5);
      });

      // First voter consequences — immediate + stored for post-resolution
      const _firstVoter = _newLog[0];
      if (_firstVoter) {
        ep._openFirstVoter = _firstVoter;
        const _fvS = pStats(_firstVoter.voter);
        const _fvTarget = _firstVoter.voted;

        // 1. Stronger intimidation: first voter with boldness/physical >= 7 intimidates
        //    ALL remaining voters (not just positions 1-3 like normal intimidation)
        if (_fvS.boldness >= 7 || _fvS.physical >= 7) {
          ep._openFirstVoterIntimidates = true;
        }

        // 2. Target emotional hit: hearing YOUR name first is the hardest
        const _fvTargetState = getPlayerState(_fvTarget);
        const _fvTargetBond = getBond(_fvTarget, _firstVoter.voter);
        if (_fvTargetBond >= 3) {
          // A friend said your name first — devastating
          addBond(_fvTarget, _firstVoter.voter, -1.0); // on top of the -2.0 friend betrayal
          if (_fvTargetState.emotional !== 'desperate') _fvTargetState.emotional = 'desperate';
        } else if (_fvTargetBond >= 0) {
          // A neutral player said your name first — alarming
          _fvTargetState.emotional = 'paranoid';
        }
        // Enemy said it first — expected, no extra damage

        // 3. Strategic credit: the first voter is the person who "started" the elimination
        //    If the target goes home, the first voter gets credit in the WHY section
        //    (handled in post-resolution below)
      }

      // Last voter consequences — stored for post-resolution
      const _lastVoter = _newLog[_newLog.length - 1];
      if (_lastVoter) {
        ep._openLastVoter = _lastVoter;
        const _lastVotedMajority = _newVotes[_lastVoter.voted] === Math.max(...Object.values(_newVotes));
        ep._openLastVoterPiledOn = _lastVotedMajority;
      }

      // 3+ votes against same person: emotional pressure
      Object.entries(_newVotes).forEach(([target, count]) => {
        if (count >= 3 && gs.activePlayers.includes(target)) {
          const state = getPlayerState(target);
          state.emotional = 'paranoid';
        }
      });

      // Replace votes and log with cascade-processed versions
      Object.keys(votes).forEach(k => delete votes[k]);
      Object.entries(_newVotes).forEach(([k, v]) => { votes[k] = v; });
      log.length = 0;
      _newLog.forEach(e => log.push(e));

      ep.cascadeSwitches = _cascadeSwitches;
      ep.openVoteReactions = _openReactions;
    }

    // Clear journey lost votes for players who attended this tribal (penalty consumed)
    if (gs.journeyLostVotes?.length) {
      gs.journeyLostVotes = gs.journeyLostVotes.filter(p => !tribalPlayers.includes(p));
    }

    // ── [3] OVERPLAYING AT TRIBAL ──
    // A scared player (paranoid/desperate) who is chatty, scheming, or bold starts
    // working everyone at tribal — pulling people aside, making side deals, being visibly
    // desperate. The tribe notices and flips votes onto them instead of the original target.
    // Trigger: paranoid/desperate + (strategic >= 7 OR social >= 7 OR boldness >= 7)
    if (!ep.overplayer) {
      const _ovpTotals = {};
      log.forEach(({ voted }) => { if (voted) _ovpTotals[voted] = (_ovpTotals[voted]||0)+1; });
      const _ovpTopTarget = Object.entries(_ovpTotals).sort(([,a],[,b]) => b-a)[0]?.[0];
      if (_ovpTopTarget) {
        const _ovpCandidates = tribalPlayers.filter(p => {
          if (p === _ovpTopTarget || p === immuneName) return false;
          const _s = pStats(p);
          if (_s.strategic < 7 && _s.social < 7 && _s.boldness < 7) return false;
          const em = gs.playerStates?.[p]?.emotional;
          return em === 'paranoid' || em === 'desperate';
        });
        if (_ovpCandidates.length) {
          const _ovp = _ovpCandidates[0];
          const _rollOvp = ([..._ovp].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 13) % 100;
          if (_rollOvp < 20) {
            const _votersOnTarget = log.filter(e => e.voted === _ovpTopTarget && e.voter !== _ovp).slice();
            _votersOnTarget.sort((a, b) => getBond(a.voter, _ovp) - getBond(b.voter, _ovp));
            const _toFlip = _votersOnTarget.slice(0, Math.min(2, _votersOnTarget.length));
            if (_toFlip.length) {
              _toFlip.forEach(e => {
                const idx = log.indexOf(e);
                if (idx !== -1) {
                  log[idx] = { ...log[idx], voted: _ovp,
                    reason: `[OVERPLAYING] ${_ovp} whispered too loudly at tribal — ${log[idx].voter} flipped their vote.` };
                }
              });
              votes[_ovpTopTarget] = Math.max(0, (votes[_ovpTopTarget]||0) - _toFlip.length);
              votes[_ovp] = (votes[_ovp]||0) + _toFlip.length;
              ep.overplayer = { player: _ovp, originalTarget: _ovpTopTarget,
                votesRedirected: _toFlip.length, votersFlipped: _toFlip.map(e => e.voter),
                emotional: gs.playerStates?.[_ovp]?.emotional || 'paranoid' };
            }
          }
        }
      }
    }

    // Snapshot who held idols going into this vote (for WHY section non-play analysis)
    ep.idolHoldersAtVote = (ep.idolHoldersAtVote || []).concat(
      gs.advantages.filter(a => a.type === 'idol' && tribalPlayers.includes(a.holder)).map(a => a.holder)
    );

    // ── FORCE-PLAY / EXPIRE: advantages must be used or lost ──
    const _advExpireAt = seasonConfig.advExpire || 4;
    const _isLastChanceTribal = gs.activePlayers.length <= _advExpireAt + 1; // force-play one episode before expiry
    const _isExpired = gs.activePlayers.length <= _advExpireAt; // at or below expiry = no advantages allowed
    if (_isExpired) {
      // Remove ALL advantages — no force-play, just gone
      gs.advantages = gs.advantages.filter(a => !tribalPlayers.includes(a.holder));
    } else if (_isLastChanceTribal) {
      // Force-play all idols: holders play for themselves first, then allies if already safe
      const _forceIdols = gs.advantages.filter(a => a.type === 'idol' && tribalPlayers.includes(a.holder));
      const _alreadyProtected = new Set(); // track who already has idol protection
      _forceIdols.forEach(idol => {
        const holder = idol.holder;
        if (!_alreadyProtected.has(holder)) {
          // Play for SELF — highest priority
          const votesAgainst = votes[holder] || 0;
          ep.idolPlays.push({
            player: holder, playedFor: null, type: 'idol',
            votesNegated: votesAgainst, forced: true,
          });
          if (votesAgainst > 0) votes[holder] = 0;
          _alreadyProtected.add(holder);
        } else {
          // Already safe — play for closest unprotected ally
          const _allies = tribalPlayers
            .filter(p => p !== holder && !_alreadyProtected.has(p) && p !== immuneName && getBond(holder, p) >= 0)
            .sort((a, b) => getBond(holder, b) - getBond(holder, a));
          const _playFor = _allies[0] || null;
          if (_playFor) {
            const votesAgainst = votes[_playFor] || 0;
            ep.idolPlays.push({
              player: holder, playedFor: _playFor, type: 'idol',
              votesNegated: votesAgainst, forced: true,
            });
            if (votesAgainst > 0) votes[_playFor] = 0;
            _alreadyProtected.add(_playFor);
            addBond(holder, _playFor, 2.0); // forced ally-play still builds trust
          }
        }
        gs.advantages = gs.advantages.filter(a => a !== idol);
      });
      // Force-play extra votes, vote steals, and KiP
      ep._forceAdvantages = true;
      // Remove advantages that can't be used at tribal (they expire at F5)
      const _expireTypes = ['kip', 'legacy', 'amulet', 'safetyNoPower', 'secondLife'];
      // KiP: force-fire before idol plays (checkIdolPlays handles it, _forceAdvantages makes it auto-fire)
      // For other non-tribal advantages, just consume them
      gs.advantages = gs.advantages.filter(a => {
        if (_expireTypes.includes(a.type) && a.type !== 'kip' && tribalPlayers.includes(a.holder)) {
          return false; // consumed — expired at F5
        }
        return true;
      });
    }

    // SITD fires first — player sacrifices their vote before votes are read
    checkShotInDark(tribalPlayers, votes, log, ep);
    checkIdolPlays(tribalPlayers, votes, ep, log);
    checkNonIdolAdvantageUse(tribalPlayers, votes, ep, log);
    // Rival tip-off betrayal: if a cross-alliance player saved the idol holder and it was played
    if (ep.tipOffBetrayalRisk) {
      const risk = ep.tipOffBetrayalRisk;
      const wasPlayed = ep.idolPlays?.some(p => p.player === risk.saved && p.tippedOff);
      if (wasPlayed && Math.random() < 0.40) {
        risk.allianceMembers.forEach(m => addBond(risk.tipper, m, -1.5));
        ep.tipOffBetrayalFired = { ...risk };
      }
      delete ep.tipOffBetrayalRisk;
    }

    // Build full tribal immunity list: anyone PROTECTED by an idol OR survived SitD is safe
    // for the ENTIRE tribal — original vote, revote, and rock draw.
    // Playing an idol for SOMEONE ELSE does NOT make the player immune — only the recipient is safe.
    // Playing an idol for YOURSELF makes you immune.
    const tribalImmune = [
      ...(ep.idolPlays || []).flatMap(p => {
        if (p.playedFor) return [p.playedFor]; // ally play: only the recipient is immune, NOT the player
        return [p.player]; // self play: the player is immune
      }),
      ...(ep.shotInDark?.safe ? [ep.shotInDark.player] : []),
    ];
    const isTribalImmune = p => tribalImmune.includes(p);

    // Helper: run a tiebreaker challenge between tiedPlayers
    const runTiebreakerChallenge = (tiedPlayers) => {
      const tcTypes = [
        { label: 'Fire-Making',    stat: s => s.physical * 0.5 + s.endurance * 0.5 },
        { label: 'Endurance',      stat: s => s.endurance },
        { label: 'Strength',       stat: s => s.physical },
        { label: 'Obstacle Course',stat: s => s.physical * 0.6 + s.mental * 0.4 },
        { label: 'Puzzle',         stat: s => s.mental },
      ];
      const tcType = tcTypes[Math.floor(Math.random() * tcTypes.length)];
      const scores = tiedPlayers.map(p => ({ player: p, score: tcType.stat(pStats(p)) + (Math.random() * 2 - 1) }));
      scores.sort((a, b) => a.score - b.score);
      ep.tiebreakerResult = { participants: [...tiedPlayers], loser: scores[0].player, winner: scores[scores.length - 1].player, challengeLabel: tcType.label };
      return scores[0].player; // loser is eliminated
    };

    // Rock draw: safe = tiedPlayers + tribalImmune + challenge winner
    const rockDraw = (tiedPlayers) => {
      ep.isRockDraw = true;
      const pool = tribalPlayers.filter(p => !tiedPlayers.includes(p) && !isTribalImmune(p) && p !== immuneName && p !== ep.sharedImmunity && p !== ep.secondImmune);
      const drawFrom = pool.length > 0 ? pool : tiedPlayers.filter(p => !isTribalImmune(p));
      return drawFrom[Math.floor(Math.random() * drawFrom.length)];
    };

    // Safety: remove any self-votes that slipped through (overplaying edge case)
    for (let _si = log.length - 1; _si >= 0; _si--) {
      if (log[_si].voter === log[_si].voted && log[_si].voter !== 'THE GAME') {
        votes[log[_si].voted] = Math.max(0, (votes[log[_si].voted] || 0) - 1);
        if (votes[log[_si].voted] <= 0) delete votes[log[_si].voted];
        log.splice(_si, 1);
      }
    }

    const res = resolveVotes(votes);

    // ── SUPER IDOL: plays AFTER votes are read ──
    // The holder sees who's going home, then decides whether to save them (or themselves).
    // Can't be misplayed — perfect information. That's the reward for winning the wager.
    if (res.eliminated) {
      const _superIdols = gs.advantages.filter(a => a.type === 'idol' && a.superIdol && tribalPlayers.includes(a.holder));
      for (const _si of _superIdols) {
        const _siHolder = _si.holder;
        const _siTarget = res.eliminated;
        let _siPlayFor = null;

        if (_siHolder === _siTarget) {
          // Holder IS the target — always plays for self
          _siPlayFor = _siHolder;
        } else {
          // Holder is safe — consider playing for the target if they're a close ally
          // BUT: check if saving the target would make the HOLDER the new target (suicide play)
          const _siTestVotes = { ...votes };
          delete _siTestVotes[_siTarget];
          const _siTestRes = resolveVotes(_siTestVotes);
          if (_siTestRes.eliminated === _siHolder) {
            // Playing for the ally would get the holder voted out instead — never do this
            _siPlayFor = null;
          } else {
            const _siBond = getBond(_siHolder, _siTarget);
            const _siS = pStats(_siHolder);
            // Loyalty + bond drives ally saves; boldness raises willingness to burn advantage for someone else
            const _siAllyChance = _siBond * 0.08 + _siS.loyalty * 0.04 + _siS.boldness * 0.02;
            // Same alliance = higher motivation
            const _siSameAlliance = (gs.namedAlliances || []).some(a => a.active && a.members.includes(_siHolder) && a.members.includes(_siTarget));
            const _siAllyBonus = _siSameAlliance ? 0.20 : 0;
            if (Math.random() < Math.min(0.85, _siAllyChance + _siAllyBonus)) {
              _siPlayFor = _siTarget;
            }
          }
        }

        if (_siPlayFor) {
          // Snapshot votes BEFORE negation so VP can show who was going home
          ep.votesBeforeSuperIdol = { ...votes };
          const _siVotesNeg = votes[_siPlayFor] || 0;
          delete votes[_siPlayFor];
          gs.advantages.splice(gs.advantages.indexOf(_si), 1);
          ep.idolPlays = ep.idolPlays || [];
          ep.idolPlays.push({
            player: _siHolder,
            playedFor: _siHolder !== _siPlayFor ? _siPlayFor : undefined,
            votesNegated: _siVotesNeg,
            superIdol: true,
          });
          ep.superIdolPlayed = { holder: _siHolder, savedPlayer: _siPlayFor, votesNegated: _siVotesNeg };
          ep.idolRehide = true;
          // Add to tribal immune list so they're safe through revotes/rocks too
          tribalImmune.push(_siPlayFor);
          if (_siHolder !== _siPlayFor) {
            // Massive bond boost for saving someone's game
            addBond(_siHolder, _siPlayFor, 3.0);
            // Observers impressed/alarmed
            tribalPlayers.filter(p => p !== _siHolder && p !== _siPlayFor).forEach(p => {
              addBond(p, _siHolder, pStats(p).strategic * 0.05 - 0.3); // strategic players see threat; others see hero
            });
          }
          // Re-resolve votes with the super idol negation
          const _siRes2 = resolveVotes(votes);
          // Overwrite original result
          res.eliminated = _siRes2.eliminated;
          res.isTie = _siRes2.isTie;
          res.tiedPlayers = _siRes2.tiedPlayers;
          res.allVotesCancelled = _siRes2.allVotesCancelled;
          break; // only one super idol play per tribal
        }
      }
    }

    // All votes cancelled by idols — treat all non-immune players as tied
    if (res.allVotesCancelled) {
      // If Sole Vote caused this (idol cancelled the sole vote), restore everyone's voting rights for the revote
      const _svPlay = (ep.idolPlays || []).find(p => p.type === 'soleVote');
      if (_svPlay?.silencedPlayers?.length) {
        _svPlay.silencedPlayers.forEach(p => {
          const idx = gs.lostVotes.indexOf(p);
          if (idx >= 0) gs.lostVotes.splice(idx, 1);
        });
      }
      const _nonImmune = tribalPlayers.filter(p => !isTribalImmune(p));
      res.tiedPlayers = _nonImmune;
      // Edge case: 0 non-immune players = no elimination possible
      if (_nonImmune.length === 0) {
        return { votes, log, eliminated: null, isTie: false, tiedPlayers: [] };
      }
      // Edge case: 1 non-immune player = automatic elimination (no tiebreaker needed)
      if (_nonImmune.length === 1) {
        return { votes, log, eliminated: _nonImmune[0], isTie: false, tiedPlayers: _nonImmune };
      }
      // Skip straight to tiebreaker (revote would just repeat the same deadlock)
      if (ep.tiebreakerChallenge || cfg.tiebreakerMode === 'challenge') {
        const loser = runTiebreakerChallenge(_nonImmune);
        // runTiebreakerChallenge already set ep.tiebreakerResult with challengeLabel — merge, don't overwrite
        ep.tiebreakerResult = { ...ep.tiebreakerResult, type: 'challenge', winner: _nonImmune.find(p => p !== loser), loser, participants: _nonImmune };
        return { votes, log, eliminated: loser, isTie: true, tiedPlayers: _nonImmune };
      }
      // Survivor mode: revote, then rocks
      const rv = simulateVotes(tribalPlayers, [...tribalImmune, ...(ep.idolPlays||[]).map(p => p.player)], allianceSet, gs.lostVotes, ep.openVote);
      ep.revoteVotes = rv.votes; ep.revoteLog = rv.log;
      const res2 = resolveVotes(rv.votes);
      if (res2.eliminated) return { votes, log, eliminated: res2.eliminated, isTie: true, tiedPlayers: _nonImmune };
      if (res2.isTie) {
        const rockElim = rockDraw(res2.tiedPlayers?.length ? res2.tiedPlayers : _nonImmune);
        ep.isRockDraw = true;
        return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: _nonImmune };
      }
    }

    // Votes wiped (SitD + idol both fired) — run a fresh open vote with all immune players excluded
    if (!res.eliminated && !res.isTie && ep.shotInDark?.safe) {
      const rv2 = simulateVotes(tribalPlayers, tribalImmune, allianceSet, gs.lostVotes, ep.openVote);
      ep.revoteVotes = rv2.votes; ep.revoteLog = rv2.log;
      ep.sidFreshVote = true;
      const res2 = resolveVotes(rv2.votes);
      if (res2.eliminated) return { votes, log, eliminated: res2.eliminated, isTie: false };
      if (res2.isTie && res2.tiedPlayers) {
        // Filter immune players out of the tie — they can't be eliminated regardless
        const eligibleTied = res2.tiedPlayers.filter(p => !isTribalImmune(p));
        if (ep.tiebreakerChallenge || cfg.tiebreakerMode === 'challenge') {
          const loser = runTiebreakerChallenge(eligibleTied.length ? eligibleTied : res2.tiedPlayers);
          return { votes, log, eliminated: loser, isTie: true, tiedPlayers: res2.tiedPlayers };
        }
        const rockElim = rockDraw(res2.tiedPlayers);
        return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res2.tiedPlayers };
      }
    }

    if (res.isTie && res.tiedPlayers) {
      // Remove immune players from the tie — they cannot be eliminated
      const eligibleTied = res.tiedPlayers.filter(p => !isTribalImmune(p));
      // If only one non-immune player is in the tie, they're eliminated directly
      if (eligibleTied.length === 1) {
        return { votes, log, eliminated: eligibleTied[0], isTie: true, tiedPlayers: res.tiedPlayers };
      }
      // Challenge tiebreaker
      if (ep.tiebreakerChallenge || cfg.tiebreakerMode === 'challenge') {
        const loser = runTiebreakerChallenge(eligibleTied.length ? eligibleTied : res.tiedPlayers);
        return { votes, log, eliminated: loser, isTie: true, tiedPlayers: res.tiedPlayers };
      }
      // forceRockDraw: skip re-vote
      if (ep.forceRockDraw) {
        ep.isRockDraw = true;
        const rockElim = rockDraw(res.tiedPlayers);
        return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res.tiedPlayers };
      }
      // Full deadlock — no eligible voters for revote
      const eligibleRevoters = tribalPlayers.filter(p => !res.tiedPlayers.includes(p) && !gs.lostVotes.includes(p));
      if (!eligibleRevoters.length) {
        ep.isFullDeadlock = true;
        const fdRv = simulateVotes(tribalPlayers, tribalImmune.length ? tribalImmune : immuneName, allianceSet, gs.lostVotes, ep.openVote);
        ep.revoteVotes = fdRv.votes; ep.revoteLog = fdRv.log;
        const fdRes = resolveVotes(fdRv.votes);
        if (fdRes.eliminated) return { votes, log, eliminated: fdRes.eliminated, isTie: true, tiedPlayers: res.tiedPlayers };
        ep.isRockDraw = true;
        const rockElim = rockDraw(fdRes.tiedPlayers || res.tiedPlayers);
        return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res.tiedPlayers };
      }
      // Standard revote — pass tribalImmune so immune players can't be targeted
      const rv = simulateRevote(tribalPlayers, res.tiedPlayers, gs.lostVotes, log, tribalImmune);
      ep.revoteVotes = rv.votes; ep.revoteLog = rv.log;
      const res2 = resolveVotes(rv.votes);
      if (res2.isTie) {
        if (ep.tiebreakerChallenge || cfg.tiebreakerMode === 'challenge') {
          const eligibleTied2 = res2.tiedPlayers.filter(p => !isTribalImmune(p));
          const loser = runTiebreakerChallenge(eligibleTied2.length ? eligibleTied2 : res2.tiedPlayers);
          return { votes, log, eliminated: loser, isTie: true, tiedPlayers: res2.tiedPlayers };
        }
        ep.isRockDraw = true;
        // Use REVOTE tied players for rock draw safety — only the still-tied players are safe
        // Players who got fewer votes in the revote ARE eligible for rocks
        const rockElim = rockDraw(res2.tiedPlayers);
        return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res2.tiedPlayers };
      }
      return { votes, log, eliminated: res2.eliminated, isTie: true, tiedPlayers: res.tiedPlayers };
    }
    // Safety net: if resolveVotes returned an elimination but the top 2 vote counts are actually tied,
    // force a revote. This catches edge cases where vote modifications create ties that resolveVotes
    // didn't detect (e.g. Extra Vote creating a tie after the initial tally was clear).
    if (res.eliminated && !res.isTie) {
      const _finalSorted = Object.entries(votes).sort(([,a],[,b]) => b-a);
      if (_finalSorted.length >= 2 && _finalSorted[0][1] === _finalSorted[1][1]) {
        const _lateTied = _finalSorted.filter(([,v]) => v === _finalSorted[0][1]).map(([n]) => n);
        const _lateEligible = _lateTied.filter(p => !isTribalImmune(p));
        if (_lateEligible.length >= 2) {
          ep.tiedPlayers = _lateTied;
          // Challenge tiebreaker: skip revote, go straight to challenge
          if (ep.tiebreakerChallenge || cfg.tiebreakerMode === 'challenge') {
            const loser = runTiebreakerChallenge(_lateEligible);
            return { votes, log, eliminated: loser, isTie: true, tiedPlayers: _lateTied };
          }
          // Standard: revote first, then rock draw if still tied
          const rv = simulateRevote(tribalPlayers, _lateTied, gs.lostVotes, log, tribalImmune);
          ep.revoteVotes = rv.votes; ep.revoteLog = rv.log;
          const res2 = resolveVotes(rv.votes);
          if (res2.isTie) {
            ep.isRockDraw = true;
            const rockElim = rockDraw(res2.tiedPlayers);
            return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res2.tiedPlayers };
          }
          return { votes, log, eliminated: res2.eliminated, isTie: true, tiedPlayers: _lateTied };
        }
      }
    }
    // Final safeguard: if we're about to return a clean elimination but the votes show a tie,
    // something upstream missed it. Force the tie path.
    if (res.eliminated && !res.isTie) {
      const _finalCheck = Object.entries(votes).filter(([,v]) => v > 0).sort(([,a],[,b]) => b-a);
      if (_finalCheck.length >= 2 && _finalCheck[0][1] === _finalCheck[1][1]) {
        // This IS a tie — resolveVotes or upstream code missed it
        const _fcTied = _finalCheck.filter(([,v]) => v === _finalCheck[0][1]).map(([n]) => n);
        const _fcEligible = _fcTied.filter(p => !isTribalImmune(p));
        if (_fcEligible.length >= 2) {
          ep.tiedPlayers = _fcTied;
          const rv = simulateRevote(tribalPlayers, _fcTied, gs.lostVotes, log, tribalImmune);
          ep.revoteVotes = rv.votes; ep.revoteLog = rv.log;
          const res2 = resolveVotes(rv.votes);
          if (res2.isTie) {
            ep.isRockDraw = true;
            const rockElim = rockDraw(res2.tiedPlayers);
            return { votes, log, eliminated: rockElim, isTie: true, tiedPlayers: res2.tiedPlayers };
          }
          return { votes, log, eliminated: res2.eliminated, isTie: true, tiedPlayers: _fcTied };
        }
      }
    }
    return { votes, log, ...res };
  }

  // ── DOUBLE TRIBAL: losing tribes merge into one council, one elimination ──
  if (ep.isDoubleTribal && ep.challengeType === 'double-tribal') {
    // All losing tribe members vote together as one merged council
    const _dtMembers = ep.tribalPlayers;
    const _dtLosingTribes = ep.doubleTribalLosingTribes || [];

    // Cross-tribe awareness: players from different tribes assess each other before voting.
    // They don't know each other well, so they rely on:
    // - Threat reputation (challenge beasts, strategic players visible from across the course)
    // - Shared enemies (if both tribes have someone they want gone, natural alignment)
    // - Alliance bridges (players in cross-tribe alliances pull their tribemates toward allies)
    _dtLosingTribes.forEach((tribeA, ai) => {
      _dtLosingTribes.forEach((tribeB, bi) => {
        if (bi <= ai) return; // only process each pair once
        tribeA.members.forEach(a => {
          tribeB.members.forEach(b => {
            const existing = getBond(a, b);
            if (Math.abs(existing) > 1) return; // already have a real relationship — skip
            // Shared alliance bridge: both in the same named alliance → trust
            const sharedAlliance = (gs.namedAlliances || []).find(al =>
              al.active && al.members.includes(a) && al.members.includes(b));
            if (sharedAlliance) { addBond(a, b, 1.5); return; }
            // Similar archetypes may respect each other
            const sA = pStats(a), sB = pStats(b);
            if (sA.strategic >= 7 && sB.strategic >= 7) addBond(a, b, 0.3);
            else if (sA.physical >= 8 && sB.physical >= 8) addBond(a, b, 0.2);
            // Reputation-based first impression: high-threat strangers are targets, not allies
            if (threatScore(b) >= 3.0 && sA.strategic >= 6) addBond(a, b, -0.5);
            if (threatScore(a) >= 3.0 && sB.strategic >= 6) addBond(b, a, -0.5);
          });
        });
      });
    });

    // Label the council as the combined losing tribes
    const _dtTribeLabel = _dtLosingTribes.map(t => t.name).join(' + ');
    const _dtAlliances = formAlliances(_dtMembers, _dtTribeLabel, ep.challengeCategory);
    ep.alliances = _dtAlliances;
    // Pre-tribal idol mechanics
    checkIdolPreTribal(ep, _dtMembers);
    const _dtResult = runTribal(_dtMembers, null, _dtAlliances);
    ep.votes = _dtResult.votes; ep.votingLog = _dtResult.log;
    ep.isTie = _dtResult.isTie; ep.tiedPlayers = _dtResult.tiedPlayers;
    // Second Life twist/amulet checks
    if (ep.isFireMaking && !ep.fireMaking && _dtResult.eliminated) {
      // [handled by the main Second Life block below — ep.isFireMaking flag already set]
    }
    ep.eliminated = _dtResult.eliminated;
    // RI choice — only if RI is still accepting players
    if (ep.eliminated) {
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(ep.eliminated);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[ep.eliminated] = epNum;
          ep.riArrival = { name: ep.eliminated, existingResidents: gs.riPlayers.filter(p => p !== ep.eliminated) };
        } else {
          const choice = simulateRIChoice(ep.eliminated);
          ep.riChoice = choice;
          if (choice === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
          else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
        }
      } else { gs.eliminated.push(ep.eliminated); ep.riChoice = null; if (gs.isMerged) gs.jury.push(ep.eliminated); }
      gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
      handleAdvantageInheritance(ep.eliminated, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
    }
    // Post-elimination Rescue Island life events
    if (cfg.ri && cfg.riFormat === 'rescue' && gs.riPlayers.length > 0) {
      generateRescueIslandLife(ep);
    }
    // Post-elimination RI: life events + duel (Redemption format)
    if (cfg.ri && cfg.riFormat !== 'rescue' && gs.riPlayers.length > 0 && !ep.riDuel) {
      ep.riPlayersPreDuel = [...gs.riPlayers];
      generateRILifeEvents(ep);
      if (gs.riPlayers.length >= 2) {
        const duel = simulateRIDuel(gs.riPlayers);
        ep.riDuel = duel;
        gs.riPlayers = gs.riPlayers.filter(p => p !== duel.loser);
        if (gs.isMerged) gs.jury.push(duel.loser);
        gs.eliminated.push(duel.loser);
        if (!gs.riDuelHistory) gs.riDuelHistory = [];
        gs.riDuelHistory.push({ ep: epNum, resident: duel.winner, arrival: duel.loser, winner: duel.winner, loser: duel.loser, challengeType: duel.challengeType, isThreeWay: duel.isThreeWay, duelists: duel.duelists });
        generateRIPostDuelEvents(ep);
      }
    }
    ep.bondChanges = updateBonds(ep.votingLog, ep.eliminated, _dtAlliances);
    detectBetrayals(ep); applyPostTribalConsequences(ep); checkAllianceRecruitment(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
    gs.episode = epNum;
    gs.episodeHistory.push({ num: epNum, eliminated: ep.eliminated, riChoice: ep.riChoice || null,
      immunityWinner: null, challengeType: 'double-tribal', isMerge: ep.isMerge,
      challengeLabel: ep.challengeLabel || null, challengeCategory: ep.challengeCategory || null,
      challengeDesc: ep.challengeDesc || '', challengePlacements: ep.challengePlacements || null,
      chalMemberScores: ep.chalMemberScores || null, chalSitOuts: ep.chalSitOuts || null,
      votes: ep.votes, alliances: (ep.alliances||[]).map(a=>({...a})),
      votingLog: ep.votingLog || [],
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      tribalPlayers: ep.tribalPlayers ? [...ep.tribalPlayers] : null,
      tribalTribe: _dtTribeLabel,
      twists: (ep.twists||[]).map(t => ({...t})),
      campEvents: ep.campEvents || null,
      bewareLostVotes: ep.bewareLostVotes || [],
      idolPlays: ep.idolPlays || [], idolMisplays: ep.idolMisplays || [],
      shotInDark: ep.shotInDark || null, kipSteal: ep.kipSteal || null, idolShares: ep.idolShares || [], spiritIslandEvents: ep.spiritIslandEvents || null, amuletCoordination: ep.amuletCoordination || null, tribalDisruption: ep.tribalDisruption || null, feastEvents: ep.feastEvents || null, idolWagerResults: ep.idolWagerResults || null,
      fireMaking: ep.fireMaking || null,
      doubleTribalLosingTribes: (ep.doubleTribalLosingTribes || []).map(t => ({ name: t.name, members: [...t.members] })),
      allianceQuits: ep.allianceQuits || [], allianceRecruits: ep.allianceRecruits || [],
      riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState(),
    });
    const stDT = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stDT; ep.summaryText = stDT;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── MULTI-TRIBAL: challenge winner safe, each losing tribe votes independently ──
  if (ep.isMultiTribal && ep.challengeType === 'multi-tribal' && ep.multiTribalLosingTribes?.length) {
    const multiElims = [];
    ep.multiTribalLosingTribes.forEach(tribe => {
      // Track per-tribe idol plays: snapshot before, diff after
      const _preIdolCount = (ep.idolPlays || []).length;
      // Pre-tribal idol mechanics per tribe
      checkIdolPreTribal(ep, tribe.members);
      const tAlliances = formAlliances(tribe.members, tribe.name, ep.challengeCategory);
      const tResult = runTribal(tribe.members, null, tAlliances);
      // Capture idol plays that fired for THIS tribe
      const _tribeIdolPlays = (ep.idolPlays || []).slice(_preIdolCount);

      // Second Life twist check per tribe
      if (ep.isFireMaking && !ep.fireMaking && tResult.eliminated) {
        const _slElim = tResult.eliminated;
        const _slS = pStats(_slElim);
        const _slPool = tribe.members.filter(p => p !== _slElim);
        if (_slPool.length) {
          const _slOpp = wRandom(_slPool, p => { const os = pStats(p); const bond = getBond(_slElim, p);
            return Math.max(0.1, _slS.strategic >= 7 ? ((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*1.5+(bond<=-3?0.6:0) : ((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*0.5+(bond<=-3?3:bond<=-1?0.75:0))+Math.random()*0.5; });
          const _slDuelTypes = [
            { id:'fire', name:'Fire-Making', desc:'First to build a sustainable fire wins.', stat:s=>s.endurance*0.5+s.physical*0.4+s.temperament*0.1 },
            { id:'puzzle', name:'Speed Puzzle', desc:'First to solve a slide puzzle wins.', stat:s=>s.mental*0.6+s.strategic*0.3+s.temperament*0.1 },
            { id:'endurance', name:'Last One Standing', desc:'Hold position on a narrow beam.', stat:s=>s.endurance*0.6+s.physical*0.2+s.temperament*0.2 },
            { id:'balance', name:'Balancing Act', desc:'Stack blocks on a wobbly platform.', stat:s=>s.endurance*0.3+s.temperament*0.4+s.mental*0.3 },
            { id:'precision', name:'Dead Shot', desc:'Toss sandbags onto a target.', stat:s=>s.physical*0.4+s.mental*0.3+s.temperament*0.3 },
          ];
          const _slD = _slDuelTypes[Math.floor(Math.random()*_slDuelTypes.length)];
          const eS = _slD.stat(_slS)+Math.random()*3, oS = _slD.stat(pStats(_slOpp))+Math.random()*3;
          const w = eS>oS?_slElim:_slOpp, l = eS>oS?_slOpp:_slElim;
          const _pr = pronouns(_slElim);
          ep.fireMaking = { player:_slElim, opponent:_slOpp, winner:w, loser:l,
            reason: getBond(_slElim,_slOpp)<=-2 ? `${_slElim} picked ${_slOpp} — personal.` : `${_slElim} picked ${_slOpp}. The tribe watches in silence.`,
            duelType:_slD.id, duelName:_slD.name, duelDesc:_slD.desc };
          tResult.eliminated = l;
          if (w===_slElim) addBond(_slOpp, _slElim, -2.5);
        }
      }
      // Second Life Amulet check per tribe
      if (!ep.isFireMaking && !ep.fireMaking && tResult.eliminated) {
        let _slaIdx = gs.advantages.findIndex(a => a.type === 'secondLife' && a.holder === tResult.eliminated);
        let _slaAlly = null;
        if (_slaIdx < 0) {
          for (const { adv, idx } of gs.advantages.map((a,i)=>({adv:a,idx:i})).filter(({adv})=>adv.type==='secondLife'&&adv.holder!==tResult.eliminated&&tribe.members.includes(adv.holder))) {
            const bond = getBond(adv.holder, tResult.eliminated); const s = pStats(adv.holder);
            if (bond>=3 && Math.random()<0.15+s.loyalty*0.04+bond*0.03) { _slaIdx=idx; _slaAlly=adv.holder; break; }
          }
        }
        if (_slaIdx >= 0) {
          gs.advantages.splice(_slaIdx, 1);
          if (_slaAlly) addBond(tResult.eliminated, _slaAlly, 3.0);
          const _sl2E = tResult.eliminated; const _sl2S = pStats(_sl2E);
          const _sl2P = tribe.members.filter(p => p !== _sl2E);
          if (_sl2P.length) {
            const _sl2O = wRandom(_sl2P, p => { const os=pStats(p); const bond=getBond(_sl2E,p);
              return Math.max(0.1, _sl2S.strategic>=7?((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*1.5+(bond<=-3?0.6:0):((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*0.5+(bond<=-3?3:bond<=-1?0.75:0))+Math.random()*0.5; });
            const _slDT = [
              { id:'fire', name:'Fire-Making', desc:'First to build fire.', stat:s=>s.endurance*0.5+s.physical*0.4+s.temperament*0.1 },
              { id:'puzzle', name:'Speed Puzzle', desc:'First to solve wins.', stat:s=>s.mental*0.6+s.strategic*0.3+s.temperament*0.1 },
              { id:'endurance', name:'Last One Standing', desc:'Hold position.', stat:s=>s.endurance*0.6+s.physical*0.2+s.temperament*0.2 },
              { id:'balance', name:'Balancing Act', desc:'Stack blocks.', stat:s=>s.endurance*0.3+s.temperament*0.4+s.mental*0.3 },
              { id:'precision', name:'Dead Shot', desc:'Toss sandbags.', stat:s=>s.physical*0.4+s.mental*0.3+s.temperament*0.3 },
            ];
            const _slD = _slDT[Math.floor(Math.random()*_slDT.length)];
            const eS=_slD.stat(_sl2S)+Math.random()*3, oS=_slD.stat(pStats(_sl2O))+Math.random()*3;
            const w=eS>oS?_sl2E:_sl2O, l=eS>oS?_sl2O:_sl2E;
            ep.fireMaking = { player:_sl2E, opponent:_sl2O, winner:w, loser:l,
              reason: getBond(_sl2E,_sl2O)<=-2?`${_sl2E} picked ${_sl2O} — personal.`:`${_sl2E} picked ${_sl2O}. Silence.`,
              duelType:_slD.id, duelName:_slD.name, duelDesc:_slD.desc, fromAmulet:true, allyPlayer:_slaAlly||null };
            ep.isFireMaking = true;
            tResult.eliminated = l;
            if (w===_sl2E) addBond(_sl2O, _sl2E, -2.5);
          }
        }
      }

      ep.multiTribalResults.push({
        tribe: tribe.name,
        tribalPlayers: [...tribe.members],
        votes: tResult.votes, log: tResult.log,
        alliances: tAlliances,
        eliminated: tResult.eliminated, isTie: tResult.isTie, tiedPlayers: tResult.tiedPlayers,
        fireMaking: ep.fireMaking || null,
        idolPlays: _tribeIdolPlays,
        shotInDark: ep.shotInDark || null, kipSteal: ep.kipSteal || null, idolShares: ep.idolShares || [], spiritIslandEvents: ep.spiritIslandEvents || null, amuletCoordination: ep.amuletCoordination || null, tribalDisruption: ep.tribalDisruption || null, feastEvents: ep.feastEvents || null, idolWagerResults: ep.idolWagerResults || null,
        tiebreakerResult: ep.tiebreakerResult || null,
        revoteVotes: ep.revoteVotes || null, revoteLog: ep.revoteLog || null,
        sidFreshVote: ep.sidFreshVote || false,
        isRockDraw: ep.isRockDraw || false,
      });
      // Reset per-tribe state so it doesn't bleed into the next tribe
      ep.fireMaking = null;
      ep.shotInDark = null;
      ep.tiebreakerResult = null;
      ep.revoteVotes = null; ep.revoteLog = null;
      ep.sidFreshVote = false;
      ep.isRockDraw = false;
      if (tResult.eliminated) multiElims.push(tResult.eliminated);
    });
    // Eliminate all
    multiElims.forEach(elim => {
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          gs.riPlayers.push(elim);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[elim] = epNum;
        } else {
          const c = simulateRIChoice(elim);
          if (c === 'REDEMPTION ISLAND') gs.riPlayers.push(elim);
          else { gs.eliminated.push(elim); if (gs.isMerged) gs.jury.push(elim); }
        }
      } else { gs.eliminated.push(elim); if (gs.isMerged) gs.jury.push(elim); }
      gs.activePlayers = gs.activePlayers.filter(p => p !== elim);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== elim)}));
      handleAdvantageInheritance(elim, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== elim);
    });
    ep.eliminated = multiElims[multiElims.length - 1] || null;
    ep.multiTribalElims = multiElims;
    // Set primary votes/log from first losing tribe for compatibility
    const firstMT = ep.multiTribalResults[0] || {};
    ep.votes = firstMT.votes || {}; ep.votingLog = firstMT.log || [];
    ep.alliances = firstMT.alliances || ep.alliances;
    ep.isTie = firstMT.isTie; ep.tiedPlayers = firstMT.tiedPlayers;
    // Detect betrayals per-tribe (each tribe's vote log + eliminated)
    ep.multiTribalResults.forEach(r => {
      if (r.eliminated && r.log?.length) {
        detectBetrayals({ ...ep, votingLog: r.log, eliminated: r.eliminated, alliances: r.alliances });
      }
    });
    // Post-elimination Rescue Island life events
    if (cfg.ri && cfg.riFormat === 'rescue' && gs.riPlayers.length > 0) {
      generateRescueIslandLife(ep);
    }
    // Post-elimination RI: life events + duel (Redemption format)
    if (cfg.ri && cfg.riFormat !== 'rescue' && gs.riPlayers.length > 0 && !ep.riDuel) {
      ep.riPlayersPreDuel = [...gs.riPlayers];
      generateRILifeEvents(ep);
      if (gs.riPlayers.length >= 2) {
        const duel = simulateRIDuel(gs.riPlayers);
        ep.riDuel = duel;
        gs.riPlayers = gs.riPlayers.filter(p => p !== duel.loser);
        if (gs.isMerged) gs.jury.push(duel.loser);
        gs.eliminated.push(duel.loser);
        if (!gs.riDuelHistory) gs.riDuelHistory = [];
        gs.riDuelHistory.push({ ep: epNum, resident: duel.winner, arrival: duel.loser, winner: duel.winner, loser: duel.loser, challengeType: duel.challengeType, isThreeWay: duel.isThreeWay, duelists: duel.duelists });
        generateRIPostDuelEvents(ep);
      }
    }
    ep.bondChanges = updateBonds(ep.votingLog, ep.eliminated, alliances);
    applyPostTribalConsequences(ep); checkAllianceRecruitment(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
    gs.episode = epNum;
    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated, riChoice: ep.riChoice || null,
      immunityWinner: null, challengeType: 'multi-tribal', isMerge: ep.isMerge,
      challengeLabel: ep.challengeLabel || null, challengeCategory: ep.challengeCategory || null,
      challengeDesc: ep.challengeDesc || '', challengePlacements: ep.challengePlacements || null,
      chalMemberScores: ep.chalMemberScores || null, chalSitOuts: ep.chalSitOuts || null,
      votes: ep.votes, alliances: (ep.alliances||[]).map(a=>({...a})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      twists: (ep.twists||[]).map(t => ({...t})),
      campEvents: ep.campEvents || null,
      idolPlays: ep.idolPlays || [], idolMisplays: ep.idolMisplays || [],
      shotInDark: ep.shotInDark || null, kipSteal: ep.kipSteal || null, idolShares: ep.idolShares || [], spiritIslandEvents: ep.spiritIslandEvents || null, amuletCoordination: ep.amuletCoordination || null, tribalDisruption: ep.tribalDisruption || null, feastEvents: ep.feastEvents || null, idolWagerResults: ep.idolWagerResults || null,
      multiTribalResults: ep.multiTribalResults, multiTribalElims: multiElims,
      votingLog: ep.votingLog || [],
      bewareLostVotes: ep.bewareLostVotes || [],
      allianceQuits: ep.allianceQuits || [], allianceRecruits: ep.allianceRecruits || [],
      riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState(),
    });
    const stMT = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stMT; ep.summaryText = stMT;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── Merge all extra immune players: shared-immunity, double-safety, hero-duel winner ──
  const _sharedSecond = [ep.sharedImmunity, ep.secondImmune].filter(Boolean);
  if (_sharedSecond.length) {
    ep.extraImmune = [...new Set([...(ep.extraImmune || []), ..._sharedSecond])];
  }
  // Recompute alliances excluding ALL extra immune players (they can't be targeted)
  if (ep.extraImmune?.length) {
    const _voteablePlayers = ep.tribalPlayers.filter(p => !ep.extraImmune.includes(p));
    alliances = formAlliances(_voteablePlayers, tribeLabel, ep.challengeCategory);
    ep.alliances = alliances;
  }

  // ── Jury Roundtable: lobbying & persuasion among jurors before jury elimination vote ──
function simulateJuryRoundtable(ep) {
  const jurors = [...new Set(gs.eliminated || [])];
  const activePlayers = gs.activePlayers || [];
  if (jurors.length < 3 || activePlayers.length < 2) return null;

  const lobbyists = [];
  const shifts = [];
  const pushbacks = [];

  // ── Step 1: Identify lobbyists (proportional activation) ──
  jurors.forEach(juror => {
    const jS = pStats(juror);
    // Find strongest positive and negative bond with active players
    let bestBond = -Infinity, worstBond = Infinity, bestPlayer = null, worstPlayer = null;
    activePlayers.forEach(p => {
      const b = getBond(juror, p);
      if (b > bestBond) { bestBond = b; bestPlayer = p; }
      if (b < worstBond) { worstBond = b; worstPlayer = p; }
    });
    const strongestMag = Math.max(Math.abs(bestBond), Math.abs(worstBond));
    const lobbyChance = strongestMag * 0.08 + jS.boldness * 0.03;
    if (Math.random() >= lobbyChance) return;

    // Pick agenda: champion (positive) or oppose (negative)
    const type = Math.abs(bestBond) >= Math.abs(worstBond) && bestBond > 0 ? 'champion' : 'oppose';
    const target = type === 'champion' ? bestPlayer : worstPlayer;
    if (!target) return;
    lobbyists.push({ juror, type, target, attempts: 0, successes: 0 });
  });

  // ── Step 2: Identify persuadable jurors (proportional margin) ──
  const persuadable = new Set();
  const alreadyShifted = new Set();
  jurors.forEach(juror => {
    if (lobbyists.some(l => l.juror === juror)) return; // lobbyists aren't persuadable
    const jS = pStats(juror);
    const bonds = activePlayers.map(p => ({ name: p, bond: getBond(juror, p) }))
      .sort((a, b) => b.bond - a.bond);
    if (bonds.length < 2) return;
    const margin = bonds[0].bond - bonds[1].bond;
    const threshold = 2.0 - jS.social * 0.08;
    if (margin < threshold) persuadable.add(juror);
  });

  // ── Step 3: Lobbying rolls (all proportional) ──
  lobbyists.forEach(lobby => {
    const lS = pStats(lobby.juror);
    persuadable.forEach(targetJuror => {
      if (alreadyShifted.has(targetJuror)) return; // cap: one shift per juror
      lobby.attempts++;
      const tS = pStats(targetJuror);

      // Persuasion chance
      const persuasionChance = lS.social * 0.04 + Math.max(0, getBond(lobby.juror, targetJuror)) * 0.05;
      if (Math.random() >= persuasionChance) return;

      // Pushback resistance
      const existingBond = getBond(targetJuror, lobby.target);
      const resistance = Math.abs(existingBond) * 0.12 + tS.strategic * 0.03;
      if (Math.random() < resistance) {
        pushbacks.push({ lobbyist: lobby.juror, resistedBy: targetJuror, finalist: lobby.target,
          reason: Math.abs(existingBond) > tS.strategic * 0.25 ? 'strong-opinion' : 'strategic-mind' });
        return;
      }

      // Success — shift bond
      const delta = lobby.type === 'champion'
        ? (0.15 + lS.social * 0.03)
        : -(0.15 + lS.social * 0.03);
      addBond(targetJuror, lobby.target, delta);
      alreadyShifted.add(targetJuror);
      lobby.successes++;
      shifts.push({ lobbyist: lobby.juror, persuaded: targetJuror, finalist: lobby.target,
        direction: lobby.type === 'champion' ? 'for' : 'against', bondDelta: delta });
    });
  });

  // ── Step 4: Generate discussion events per active player ──
  const discussions = activePlayers.map(player => {
    const evts = [];
    const _pr = pronouns(player);

    // Lobbyists who targeted this player
    const champLobbyists = lobbyists.filter(l => l.target === player && l.type === 'champion');
    const opposeLobbyists = lobbyists.filter(l => l.target === player && l.type === 'oppose');

    // Seeded pick for variety — different juror+player combos get different lines
    const _seed = (a, b) => [...(a+b)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const _pickFrom = (arr, a, b) => arr[_seed(a, b) % arr.length];

    // Champion arguments
    champLobbyists.forEach(l => {
      const lPr = pronouns(l.juror);
      const lS = pStats(l.juror);
      const pool = lS.boldness >= 7 ? [
        `${l.juror} slams the table. "${player} played the best game out here. Period. If you can't see that, you weren't paying attention."`,
        `${l.juror} leans forward. "I watched ${player} play from day one. ${_pr.Sub} outplayed everyone. End of discussion."`,
        `${l.juror} stands up. "You want to know who deserves this? ${player}. And I dare anyone here to argue otherwise."`,
      ] : lS.strategic >= 7 ? [
        `${l.juror} lays out ${lPr.posAdj} case methodically. "${player} made moves when it counted. The numbers don't lie — ${_pr.sub} earned this."`,
        `${l.juror} counts on ${lPr.posAdj} fingers. "Idol play. Alliance flip. Challenge win when it mattered. ${player} has the resume."`,
        `${l.juror} walks through the timeline. "Look at what ${player} did at merge, at final seven, at the last tribal. That's a winner's game."`,
      ] : lS.social >= 7 ? [
        `${l.juror} gets personal. "I know ${player}. ${_pr.Sub} ${_pr.sub === 'they' ? 'are' : 'is'} a good person who played a real game. That matters to me."`,
        `${l.juror} speaks from the heart. "${player} was there for people when it mattered. That's not nothing. That's the whole game."`,
        `${l.juror} looks around the table. "How many of you can say ${player} treated you badly? Exactly. That counts."`,
      ] : lS.loyalty >= 7 ? [
        `${l.juror} appeals to honor. "${player} played with integrity. ${_pr.Sub} didn't backstab ${_pr.posAdj} way here. That should count for something."`,
        `${l.juror} keeps it simple. "${player} kept ${_pr.posAdj} word. In this game, that's rare. I respect it."`,
        `${l.juror} nods firmly. "You can win this game without lying. ${player} proved that. I want to reward that."`,
      ] : [
        `${l.juror} makes ${lPr.posAdj} pitch for ${player}. "${player} deserves this. I've seen enough to know."`,
        `${l.juror} speaks up. "I've been thinking about this a lot. ${player} is the right winner."`,
        `${l.juror} clears ${lPr.posAdj} throat. "I'm voting ${player}. And I think some of you should too."`,
      ];
      evts.push({ juror: l.juror, type: 'support', text: _pickFrom(pool, l.juror, player), badge: 'IN FAVOR', badgeClass: 'win', players: [l.juror, player] });
    });

    // Oppose arguments
    opposeLobbyists.forEach(l => {
      const lPr = pronouns(l.juror);
      const lS = pStats(l.juror);
      const pool = lS.boldness >= 7 ? [
        `${l.juror} doesn't hold back. "${player} doesn't deserve to sit in those chairs. And I'll tell anyone who'll listen exactly why."`,
        `${l.juror} points across the table. "If ${player} wins, this whole season meant nothing. I said what I said."`,
        `${l.juror} is on ${lPr.posAdj} feet. "You're really going to reward ${player}? After everything? Come on."`,
      ] : lS.temperament <= 4 ? [
        `${l.juror} can barely contain ${lPr.ref}. "Don't even get me started on ${player}. What ${_pr.sub} did to me — to US — that's not gameplay."`,
        `${l.juror}'s voice cracks. "${player} looked me in the eye and lied. I can't forgive that. And neither should you."`,
        `${l.juror} is shaking. "I have sat on that bench replaying what ${player} did. Every single night. Don't tell me to let it go."`,
      ] : lS.strategic >= 7 ? [
        `${l.juror} breaks it down. "${player} rode coattails. ${_pr.Sub} didn't make a single real decision all game. I'm not rewarding that."`,
        `${l.juror} ticks off the episodes. "${player} was carried to this point. Name one move ${_pr.sub} made alone. I'll wait."`,
        `${l.juror} leans back. "${player}'s whole game was being in the right alliance at the right time. That's luck, not skill."`,
      ] : [
        `${l.juror} shakes ${lPr.posAdj} head. "I've had a lot of time to think about ${player}'s game. It wasn't as impressive as ${_pr.sub} think${_pr.sub === 'they' ? '' : 's'}."`,
        `${l.juror} sighs. "I wanted to root for ${player}. I really did. But ${_pr.sub} lost me."`,
        `${l.juror} folds ${lPr.posAdj} arms. "${player} had chances to play a bigger game. ${_pr.Sub} didn't. That's on ${_pr.obj}."`,
      ];
      evts.push({ juror: l.juror, type: 'oppose', text: _pickFrom(pool, l.juror, player), badge: 'AGAINST', badgeClass: 'bad', players: [l.juror, player] });
    });

    // Lobby outcomes for this player
    shifts.filter(s => s.finalist === player).forEach(s => {
      const sPr = pronouns(s.persuaded);
      const lPr = pronouns(s.lobbyist);
      const forPool = [
        `${s.persuaded} listens to ${s.lobbyist}'s argument and nods slowly. Something landed. ${sPr.Sub} ${sPr.sub === 'they' ? 'are' : 'is'} reconsidering ${player}.`,
        `After ${s.lobbyist}'s pitch, ${s.persuaded} goes quiet. When ${sPr.sub} finally speak${sPr.sub === 'they' ? '' : 's'}, it's clear — ${sPr.posAdj} mind is shifting toward ${player}.`,
        `${s.lobbyist}'s words hit home. ${s.persuaded} didn't expect to be swayed, but ${sPr.sub} ${sPr.sub === 'they' ? 'are' : 'is'} starting to see ${player} differently.`,
      ];
      const againstPool = [
        `${s.persuaded} hears ${s.lobbyist} out. By the end, ${sPr.posAdj} expression has changed. ${sPr.Sub} ${sPr.sub === 'they' ? 'are' : 'is'} cooling on ${player}.`,
        `${s.lobbyist}'s argument plants a seed of doubt. ${s.persuaded} had been leaning toward ${player} — now ${sPr.sub} ${sPr.sub === 'they' ? 'aren\'t' : 'isn\'t'} so sure.`,
        `${s.persuaded} thought ${sPr.sub} had ${sPr.posAdj} mind made up. Then ${s.lobbyist} started talking. Now ${player} doesn't look as strong.`,
      ];
      const text = _pickFrom(s.direction === 'for' ? forPool : againstPool, s.persuaded, s.lobbyist);
      evts.push({ juror: s.persuaded, type: 'lobbied', text, badge: 'LOBBIED', badgeClass: 'gold', players: [s.persuaded, player] });
    });

    pushbacks.filter(pb => pb.finalist === player).forEach(pb => {
      const pbPr = pronouns(pb.resistedBy);
      const pool = pb.reason === 'strategic-mind' ? [
        `${pb.resistedBy} cuts in. "I appreciate the pitch, but I'll make up my own mind about ${player}. I've been watching the game too."`,
        `${pb.resistedBy} holds up a hand. "I hear you. But I've done my own analysis on ${player}. I don't need help."`,
        `${pb.resistedBy} stays measured. "Interesting take. But I've already thought this through. ${player} is who ${pronouns(player).sub} ${pronouns(player).sub === 'they' ? 'are' : 'is'}."`,
      ] : [
        `${pb.resistedBy} pushes back. "I know how I feel about ${player}. You're not changing that."`,
        `${pb.resistedBy} shuts it down. "Save it. My mind's made up on ${player}."`,
        `${pb.resistedBy} crosses ${pbPr.posAdj} arms. "You can argue all night. I know what I saw from ${player}."`,
      ];
      evts.push({ juror: pb.resistedBy, type: 'pushback', text: _pickFrom(pool, pb.resistedBy, player), badge: 'PUSHED BACK', badgeClass: 'bad', players: [pb.resistedBy, player] });
    });

    // General jury sentiment (fill to at least 2 events if not enough lobby activity)
    if (evts.length < 2) {
      const supporters = jurors.filter(j => getBond(j, player) >= 2 && !evts.some(e => e.juror === j));
      const detractors = jurors.filter(j => getBond(j, player) <= -2 && !evts.some(e => e.juror === j));
      if (supporters.length && evts.length < 2) {
        const s = supporters[0];
        const sPr = pronouns(s);
        evts.push({ juror: s, type: 'support',
          text: `${s} speaks up. "I've got nothing bad to say about ${player}. ${_pr.Sub} played a solid game."`,
          badge: 'IN FAVOR', badgeClass: 'win', players: [s, player] });
      }
      if (detractors.length && evts.length < 2) {
        const d = detractors[0];
        evts.push({ juror: d, type: 'oppose',
          text: `${d} folds ${pronouns(d).posAdj} arms. "${player} and I have unfinished business. I don't see a winner there."`,
          badge: 'AGAINST', badgeClass: 'bad', players: [d, player] });
      }
    }

    return { player, events: evts.slice(0, 4) }; // cap at 4 events per player
  }).filter(d => d.events.length > 0);

  const result = { activePlayers: activePlayers.slice(), lobbyists, shifts, pushbacks, discussions };
  ep.juryRoundtable = result;
  return result;
}

  // ── TWIST: jury-elimination — all eliminated players vote to boot one active player (replaces tribal) ──
  const juryElimTw = ep.twists?.find(t => t.type === 'jury-elimination');
  if (juryElimTw && gs.eliminated.length > 0) {
    // Jury roundtable: lobbying and persuasion among jurors before the vote
    simulateJuryRoundtable(ep);
    const immune = ep.immunityWinner;
    const candidates = gs.activePlayers.filter(p => p !== immune);
    if (candidates.length > 0) {
      const jurors = gs.eliminated;
      const elimVotes = Object.fromEntries(candidates.map(p => [p, 0]));
      const elimLog = [];
      jurors.forEach(juror => {
        const scores = candidates.map(p => ({
          name: p,
          score: -getBond(juror, p) + pStats(juror).strategic * 0.05 + Math.random() * 2
        }));
        scores.sort((a, b) => b.score - a.score);
        const target = scores[0].name;
        elimVotes[target]++;
        elimLog.push({ juror, votedOut: target });
      });
      const elimSorted = Object.entries(elimVotes).sort(([,a],[,b]) => b-a);
      const topVoteCount = elimSorted[0][1];
      const tiedPlayers = elimSorted.filter(([,v]) => v === topVoteCount).map(([n]) => n);
      let juryBooted;
      if (tiedPlayers.length > 1) {
        // Tiebreaker: jury deliberates again — lowest average bond with jurors loses (most disliked)
        const tieScores = tiedPlayers.map(p => ({
          name: p,
          avgBond: jurors.reduce((s, j) => s + getBond(j, p), 0) / jurors.length,
        }));
        tieScores.sort((a, b) => a.avgBond - b.avgBond); // lowest bond = most disliked = eliminated
        juryBooted = tieScores[0].name;
        juryElimTw.juryTie = true;
        juryElimTw.juryTiedPlayers = tiedPlayers;
        juryElimTw.juryTiebreaker = 'deliberation';
      } else {
        juryBooted = tiedPlayers[0];
      }
      juryElimTw.juryBooted = juryBooted;
      juryElimTw.elimVotes = elimVotes;
      juryElimTw.elimLog = elimLog;
      ep.eliminated = juryBooted;
      // RI check for jury-eliminated player
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(juryBooted);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[juryBooted] = epNum;
          ep.riArrival = { name: juryBooted, existingResidents: gs.riPlayers.filter(p => p !== juryBooted) };
        } else {
          const _jrc = simulateRIChoice(juryBooted);
          ep.riChoice = _jrc;
          if (_jrc === 'REDEMPTION ISLAND') gs.riPlayers.push(juryBooted);
          else { gs.eliminated.push(juryBooted); if (gs.isMerged) gs.jury.push(juryBooted); }
        }
      } else {
        gs.eliminated.push(juryBooted);
        if (gs.isMerged) gs.jury.push(juryBooted);
      }
      gs.activePlayers = gs.activePlayers.filter(p => p !== juryBooted);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== juryBooted)}));
      handleAdvantageInheritance(juryBooted, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== juryBooted);
    }
    // No tribal vote — jury elimination replaces it
    gs.episode = epNum;
    ep.bondChanges = updateBonds([], ep.eliminated, alliances);
    detectBetrayals(ep);
    applyPostTribalConsequences(ep);
    checkAllianceRecruitment(ep);
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

    // ── RI LIFE / DUEL / RESCUE after jury elimination ──
    if (cfg.ri && gs.riPlayers && gs.riPlayers.length > 0 && !ep.riDuel) {
      ep.riPlayersPreDuel = [...gs.riPlayers];
      if (cfg.riFormat === 'rescue') {
        generateRescueIslandLife(ep);
      } else {
        generateRILifeEvents(ep);
      }
      if (cfg.riFormat !== 'rescue' && gs.riPlayers.length >= 2) {
        const duel = simulateRIDuel(gs.riPlayers);
        ep.riDuel = duel;
        gs.riPlayers = gs.riPlayers.filter(p => p !== duel.loser);
        if (gs.isMerged) gs.jury.push(duel.loser);
        gs.eliminated.push(duel.loser);
        if (!gs.riDuelHistory) gs.riDuelHistory = [];
        gs.riDuelHistory.push({ ep: epNum, resident: duel.winner, arrival: duel.loser, winner: duel.winner, loser: duel.loser, challengeType: duel.challengeType, isThreeWay: duel.isThreeWay, duelists: duel.duelists });
        generateRIPostDuelEvents(ep);
      }
    }
    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, firstEliminated: null, riChoice: ep.riChoice || null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: ep.challengeType || 'individual', isMerge: ep.isMerge,
      challengeLabel: ep.challengeLabel || null,
      challengeCategory: ep.challengeCategory || null,
      challengeDesc: ep.challengeDesc || '',
      challengePlacements: ep.challengePlacements
        ? ep.challengePlacements.map(t => ({ name: t.name, members: [...(t.members||[])] }))
        : null,
      chalMemberScores: ep.chalMemberScores || null,
      chalPlacements: ep.chalPlacements || null,
      rewardChalData: (() => {
        const rct = (ep.twists||[]).find(t => t.type === 'reward-challenge');
        if (!rct) return null;
        return {
          winner: rct.rewardWinner, winnerType: rct.rewardWinnerType || 'individual',
          placements: rct.rewardChalPlacements || [], label: rct.rewardChalLabel || 'Reward Challenge',
          category: rct.rewardChalCategory || 'mixed', desc: rct.rewardChalDesc || '',
          rewardItemId: rct.rewardItemId || null, rewardItemLabel: rct.rewardItemLabel || null,
          rewardItemDesc: rct.rewardItemDesc || null, rewardCompanions: rct.rewardCompanions || null,
          rewardPickReasons: rct.rewardPickReasons || null, rewardPickStrategy: rct.rewardPickStrategy || null,
          rewardSnubs: rct.rewardSnubs || null, rewardAlliancePitched: rct.rewardAlliancePitched || false, rewardAllianceFormed: rct.rewardAllianceFormed || null, rewardAllianceFailed: rct.rewardAllianceFailed || false, rewardAllianceMembers: rct.rewardAllianceMembers || null, rewardAllianceStrengthened: rct.rewardAllianceStrengthened || null, rewardFailedPairs: rct.rewardFailedPairs || null, rewardPitchLeaks: rct.rewardPitchLeaks || null,
          rewardMaxCompanions: rct.rewardMaxCompanions || null,
          rewardCluedPlayer: rct.rewardCluedPlayer || null, rewardShareInvite: rct.rewardShareInvite || null,
          rewardBackfire: rct.rewardBackfire || null,
        };
      })(),
      tribalTribe: null,
      tribalPlayers: ep.tribalPlayers ? [...ep.tribalPlayers] : null,
      votes: {}, alliances: (ep.alliances||[]).map(a=>({...a})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      twistScenes: [], campEvents: null, summaryText: '', gsSnapshot: window.snapshotGameState(),
      twists: (ep.twists||[]).map(t => ({...t})),
      votingLog: [], revoteLog: [],
      idolPlays: ep.idolPlays || [], shotInDark: null,
      socialBombs: ep.socialBombs || [],
      chalThreatEvents: ep.chalThreatEvents || [],
      goatEvents: ep.goatEvents || [],
      allianceQuits: ep.allianceQuits || [],
      allianceRecruits: ep.allianceRecruits || [],
      chalSitOuts: ep.chalSitOuts || null,
      riDuel: ep.riDuel || null, riPlayersPreDuel: ep.riPlayersPreDuel || null, riLifeEvents: ep.riLifeEvents || [], riReentry: ep.riReentry || null, rescueIslandEvents: ep.rescueIslandEvents || [], rescueReturnChallenge: ep.rescueReturnChallenge || null, riArrival: ep.riArrival || null, riQuit: ep.riQuit || null,
    });
    const twistScenesJE = generateTwistScenes(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].twistScenes = twistScenesJE;
    ep.twistScenes = twistScenesJE;
    gs.episodeHistory[gs.episodeHistory.length-1].campEvents = ep.campEvents || null;
    gs.episodeHistory[gs.episodeHistory.length-1].tipOffCampEvents = ep.tipOffCampEvents || null;
    const stJE = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stJE; ep.summaryText = stJE;
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }

  // ── PRE-TRIBAL IDOL MECHANICS (share, flush plant, give & betray) ──
  checkIdolPreTribal(ep, ep.tribalPlayers);

  // ── VOTE ──
  const r1 = runTribal(ep.tribalPlayers, ep.immunityWinner||null, alliances);
  ep.votes = r1.votes; ep.votingLog = r1.log;
  ep.isTie = r1.isTie; ep.tiedPlayers = r1.tiedPlayers;

  // ── OPEN VOTE: first/last voter post-resolution consequences ──
  if (ep.openVote && r1.eliminated) {
    if (ep._openFirstVoter) {
      const _fv = ep._openFirstVoter;
      const _fvS = pStats(_fv.voter);
      if (_fv.voted === r1.eliminated) {
        // First voter's target was eliminated — leadership respected
        // Bond boost with every follower (they trusted the first voter's direction)
        r1.log.filter(l => l.voted === _fv.voted && l.voter !== _fv.voter).forEach(l => addBond(_fv.voter, l.voter, 1.0));
        // Strategic reputation boost: the tribe sees them as someone who calls shots
        if (_fvS.strategic >= 6) {
          gs.playerStates[_fv.voter] = gs.playerStates[_fv.voter] || {};
          gs.playerStates[_fv.voter].bigMoves = (gs.playerStates[_fv.voter].bigMoves || 0) + 1;
        }
        // Camp event text for next episode
        ep._openFirstVoterSuccess = true;
      } else if (gs.activePlayers.includes(_fv.voted)) {
        // First voter's target survived — showed hand and failed
        // The target now knows who came for them first — grudge is personal
        addBond(_fv.voter, _fv.voted, -0.5);
        addBond(_fv.voted, _fv.voter, -1.5); // target REMEMBERS who said their name first
        // Tribe sees the miss — slight credibility hit
        gs.activePlayers.filter(p => p !== _fv.voter && p !== _fv.voted && pStats(p).strategic >= 6).forEach(p => {
          addBond(p, _fv.voter, -0.2); // "they tried to lead and it didn't work"
        });
        ep._openFirstVoterFailed = true;
      }
    }
    if (ep._openLastVoter) {
      if (ep._openLastVoterPiledOn) {
        // Cowardice: strategic players notice
        gs.activePlayers.filter(p => pStats(p).strategic >= 6 && p !== ep._openLastVoter.voter).forEach(p => {
          addBond(p, ep._openLastVoter.voter, -0.3);
        });
      } else {
        // Defiance: respect from bold players + bond with protected person
        const _defiantTarget = ep._openLastVoter.voted;
        const _majorityTarget = Object.entries(r1.votes).sort(([,a],[,b]) => b-a)[0]?.[0];
        if (_majorityTarget && _defiantTarget !== _majorityTarget) {
          addBond(ep._openLastVoter.voter, _majorityTarget, 0.5);
          gs.activePlayers.filter(p => pStats(p).boldness >= 7 && p !== ep._openLastVoter.voter).forEach(p => {
            addBond(p, ep._openLastVoter.voter, 0.3);
          });
        }
      }
    }
  }

  // ── SECOND LIFE: voted-out player picks an opponent, random duel type ──
  if (ep.isFireMaking && r1.eliminated) {
    const _slElim = r1.eliminated;
    const _slS = pStats(_slElim);
    const _slPool = ep.tribalPlayers.filter(p =>
      p !== _slElim && p !== ep.immunityWinner && !(ep.extraImmune||[]).includes(p)
      && p !== gs.exileDuelPlayer && p !== ep.exileDuelResult?.loser && p !== ep.exileDuelResult?.exilePlayer
    );
    if (_slPool.length) {
      // Strategic players pick the weakest opponent; bold/desperate pick their enemy
      const opponent = wRandom(_slPool, p => {
        const os = pStats(p);
        const bond = getBond(_slElim, p);
        const weakScore = (10 - os.endurance) * 0.3 + (10 - os.physical) * 0.3 + (10 - os.mental) * 0.2;
        const revengeMod = bond <= -3 ? 2.0 : bond <= -1 ? 0.5 : 0;
        return Math.max(0.1, _slS.strategic >= 7
          ? weakScore * 1.5 + revengeMod * 0.3
          : weakScore * 0.5 + revengeMod * 1.5
        ) + Math.random() * 0.5;
      });
      // Pick reason
      const _opBond = getBond(_slElim, opponent);
      const _opS = pStats(opponent);
      const _slPr = pronouns(_slElim);
      const _slReason = _opBond <= -2 ? `${_slElim} picked ${opponent} — personal. This isn't just about survival. It's about taking someone down with ${_slPr.obj}.`
                       : _slS.strategic >= 7 ? `${_slElim} picked ${opponent} — calculated. ${_slPr.Sub} studied everyone and chose the most beatable opponent.`
                       : _slS.boldness >= 7 ? `${_slElim} picked ${opponent} — the biggest threat. If ${_slPr.sub} ${_slPr.sub==='they'?'are':'is'} going down, ${_slPr.sub} ${_slPr.sub==='they'?'are':'is'} going down swinging.`
                       : `${_slElim} picked ${opponent}. The tribe watches in silence.`;
      // ── Randomize duel type — each uses different stats so everyone has a chance ──
      const _slDuelTypes = [
        { id: 'fire',      name: 'Fire-Making',       desc: 'First to build a sustainable fire wins.',
          stat: s => s.endurance * 0.5 + s.physical * 0.4 + s.temperament * 0.1 },
        { id: 'puzzle',    name: 'Speed Puzzle',       desc: 'First to solve a slide puzzle wins.',
          stat: s => s.mental * 0.6 + s.strategic * 0.3 + s.temperament * 0.1 },
        { id: 'endurance', name: 'Last One Standing',  desc: 'Hold position on a narrow beam. Last one standing wins.',
          stat: s => s.endurance * 0.6 + s.physical * 0.2 + s.temperament * 0.2 },
        { id: 'balance',   name: 'Balancing Act',      desc: 'Stack blocks on a wobbly platform. First to complete the tower wins.',
          stat: s => s.endurance * 0.3 + s.temperament * 0.4 + s.mental * 0.3 },
        { id: 'precision', name: 'Dead Shot',          desc: 'Toss sandbags onto a target. Closest to center wins.',
          stat: s => s.physical * 0.4 + s.mental * 0.3 + s.temperament * 0.3 },
      ];
      const _slDuel = _slDuelTypes[Math.floor(Math.random() * _slDuelTypes.length)];
      const eScore = _slDuel.stat(_slS) + Math.random() * 3;
      const oScore = _slDuel.stat(_opS) + Math.random() * 3;
      const elimWins = eScore > oScore;
      const winner = elimWins ? _slElim : opponent;
      const loser = elimWins ? opponent : _slElim;
      ep.fireMaking = { player: _slElim, opponent, winner, loser, reason: _slReason,
        duelType: _slDuel.id, duelName: _slDuel.name, duelDesc: _slDuel.desc };
      r1.eliminated = loser;
      // Grudge: if the voted-out player wins and eliminates their pick, the loser holds a grudge
      if (winner === _slElim && loser === opponent) {
        addBond(opponent, _slElim, -2.5); // opponent resents being dragged down
      }
    }
  }

  // ── SECOND LIFE AMULET: advantage that works like the twist — auto-activates on elimination ──
  // Check: (1) eliminated player holds it, or (2) an ally at tribal plays it for them
  if (!ep.isFireMaking && !ep.fireMaking && r1.eliminated) {
    let _slaIdx = gs.advantages.findIndex(a => a.type === 'secondLife' && a.holder === r1.eliminated);
    let _slaAllyPlay = null;
    if (_slaIdx < 0) {
      // Check if an ally at tribal holds one and would play it for the eliminated player
      const _slaAllies = gs.advantages
        .map((a, i) => ({ adv: a, idx: i }))
        .filter(({ adv }) => adv.type === 'secondLife' && adv.holder !== r1.eliminated
          && ep.tribalPlayers.includes(adv.holder));
      for (const { adv, idx } of _slaAllies) {
        const bond = getBond(adv.holder, r1.eliminated);
        const s = pStats(adv.holder);
        // Only play for a close ally — bond >= 3 and loyalty-scaled chance
        if (bond >= 3 && Math.random() < 0.15 + s.loyalty * 0.04 + bond * 0.03) {
          _slaIdx = idx;
          _slaAllyPlay = adv.holder;
          break;
        }
      }
    }
    if (_slaIdx >= 0) {
      // Consume the amulet
      gs.advantages.splice(_slaIdx, 1);
      // Bond boost for ally play
      if (_slaAllyPlay) addBond(r1.eliminated, _slaAllyPlay, 3.0);
      const _slElim = r1.eliminated;
      const _slS = pStats(_slElim);
      const _slPool = ep.tribalPlayers.filter(p =>
        p !== _slElim && p !== ep.immunityWinner && !(ep.extraImmune||[]).includes(p)
      );
      if (_slPool.length) {
        const opponent = wRandom(_slPool, p => {
          const os = pStats(p);
          const bond = getBond(_slElim, p);
          const weakScore = (10 - os.endurance) * 0.3 + (10 - os.physical) * 0.3 + (10 - os.mental) * 0.2;
          const revengeMod = bond <= -3 ? 2.0 : bond <= -1 ? 0.5 : 0;
          return Math.max(0.1, _slS.strategic >= 7
            ? weakScore * 1.5 + revengeMod * 0.3
            : weakScore * 0.5 + revengeMod * 1.5
          ) + Math.random() * 0.5;
        });
        const _opBond = getBond(_slElim, opponent);
        const _opS = pStats(opponent);
        const _slPr = pronouns(_slElim);
        const _slReason = _opBond <= -2 ? `${_slElim} picked ${opponent} — personal. This isn't just about survival. It's about taking someone down with ${_slPr.obj}.`
                         : _slS.strategic >= 7 ? `${_slElim} picked ${opponent} — calculated. ${_slPr.Sub} studied everyone and chose the most beatable opponent.`
                         : _slS.boldness >= 7 ? `${_slElim} picked ${opponent} — the biggest threat. If ${_slPr.sub} ${_slPr.sub==='they'?'are':'is'} going down, ${_slPr.sub} ${_slPr.sub==='they'?'are':'is'} going down swinging.`
                         : `${_slElim} picked ${opponent}. The tribe watches in silence.`;
        const _slDuelTypes = [
          { id: 'fire',      name: 'Fire-Making',       desc: 'First to build a sustainable fire wins.',
            stat: s => s.endurance * 0.5 + s.physical * 0.4 + s.temperament * 0.1 },
          { id: 'puzzle',    name: 'Speed Puzzle',       desc: 'First to solve a slide puzzle wins.',
            stat: s => s.mental * 0.6 + s.strategic * 0.3 + s.temperament * 0.1 },
          { id: 'endurance', name: 'Last One Standing',  desc: 'Hold position on a narrow beam. Last one standing wins.',
            stat: s => s.endurance * 0.6 + s.physical * 0.2 + s.temperament * 0.2 },
          { id: 'balance',   name: 'Balancing Act',      desc: 'Stack blocks on a wobbly platform. First to complete the tower wins.',
            stat: s => s.endurance * 0.3 + s.temperament * 0.4 + s.mental * 0.3 },
          { id: 'precision', name: 'Dead Shot',          desc: 'Toss sandbags onto a target. Closest to center wins.',
            stat: s => s.physical * 0.4 + s.mental * 0.3 + s.temperament * 0.3 },
        ];
        const _slDuel = _slDuelTypes[Math.floor(Math.random() * _slDuelTypes.length)];
        const eScore = _slDuel.stat(_slS) + Math.random() * 3;
        const oScore = _slDuel.stat(_opS) + Math.random() * 3;
        const elimWins = eScore > oScore;
        const winner = elimWins ? _slElim : opponent;
        const loser = elimWins ? opponent : _slElim;
        ep.fireMaking = { player: _slElim, opponent, winner, loser, reason: _slReason,
          duelType: _slDuel.id, duelName: _slDuel.name, duelDesc: _slDuel.desc,
          fromAmulet: true, allyPlayer: _slaAllyPlay || null };
        ep.isFireMaking = true; // so VP renders the Second Life screens
        r1.eliminated = loser;
        if (winner === _slElim && loser === opponent) {
          addBond(opponent, _slElim, -2.5);
        }
      }
    }
  }

  // ── DOUBLE ELIM: announced (top-2 from single vote) or surprise double boot (second vote) ──
  if (ep.isDoubleElim && r1.eliminated) {
    ep.firstEliminated = r1.eliminated;
    ep.firstRIChoice = null;
    if (isRIStillActive()) {
      if (cfg.riFormat === 'rescue') {
        ep.firstRIChoice = 'RESCUE ISLAND';
        gs.riPlayers.push(r1.eliminated);
        if (!gs.riArrivalEp) gs.riArrivalEp = {};
        gs.riArrivalEp[r1.eliminated] = epNum;
      } else {
        const c = simulateRIChoice(r1.eliminated);
        ep.firstRIChoice = c;
        if (c === 'REDEMPTION ISLAND') gs.riPlayers.push(r1.eliminated);
        else { gs.eliminated.push(r1.eliminated); if (gs.isMerged) gs.jury.push(r1.eliminated); }
      }
    } else {
      gs.eliminated.push(r1.eliminated);
      if (gs.isMerged) gs.jury.push(r1.eliminated);
    }
    gs.activePlayers = gs.activePlayers.filter(p => p!==r1.eliminated);
    gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p!==r1.eliminated)}));
    handleAdvantageInheritance(r1.eliminated, ep);
    gs.advantages = gs.advantages.filter(a => a.holder !== r1.eliminated);

    // BLACK VOTE for vote 1 eliminated player (double boot — first elimination)
    if (cfg.blackVote && cfg.blackVote !== 'off' && gs.activePlayers.length > 4) {
      const _bv1Pool = ep.tribalPlayers?.filter(p => p !== r1.eliminated && gs.activePlayers.includes(p)) || [];
      if (_bv1Pool.length) {
        const _bv1Elim = r1.eliminated;
        if (cfg.blackVote === 'classic') {
          const _bv1Target = [..._bv1Pool].sort((a, b) => getBond(_bv1Elim, a) - getBond(_bv1Elim, b))[0];
          if (_bv1Target) {
            if (!gs.blackVotes) gs.blackVotes = [];
            gs.blackVotes.push({ from: _bv1Elim, target: _bv1Target, ep: epNum, type: 'classic', reason: getBond(_bv1Elim, _bv1Target) <= -2 ? `grudge — ${_bv1Elim} and ${_bv1Target} had bad blood` : `${_bv1Elim} wants ${_bv1Target} gone — lowest bond of anyone left` });
            ep.blackVote1 = { from: _bv1Elim, target: _bv1Target, type: 'classic', reason: getBond(_bv1Elim, _bv1Target) <= -2 ? `grudge — ${_bv1Elim} and ${_bv1Target} had bad blood` : `${_bv1Elim} wants ${_bv1Target} gone — lowest bond of anyone left` };
          }
        } else if (cfg.blackVote === 'modern') {
          const _bv1Recipient = [..._bv1Pool].sort((a, b) => getBond(_bv1Elim, b) - getBond(_bv1Elim, a))[0];
          if (_bv1Recipient) {
            gs.advantages.push({ holder: _bv1Recipient, type: 'extraVote', foundEp: epNum, fromBlackVote: true, giftedBy: _bv1Elim });
            ep.blackVote1 = { from: _bv1Elim, recipient: _bv1Recipient, type: 'modern', reason: `${_bv1Elim}'s closest remaining connection` };
          }
        }
      }
    }

    if (ep.announcedDoubleElim) {
      // Announced: top 2 vote-getters both go — no second vote needed
      const _a2Sorted = Object.entries(ep.votes||{}).sort(([,a],[,b]) => b-a);
      const _second = _a2Sorted.find(([n]) => n !== r1.eliminated && gs.activePlayers.includes(n))?.[0] || null;
      ep.eliminated = _second;
      if (_second) {
        if (isRIStillActive()) {
          if (cfg.riFormat === 'rescue') {
            gs.riPlayers.push(_second);
            if (!gs.riArrivalEp) gs.riArrivalEp = {};
            gs.riArrivalEp[_second] = epNum;
          } else {
            const _c2 = simulateRIChoice(_second);
            if (_c2 === 'REDEMPTION ISLAND') gs.riPlayers.push(_second);
            else { gs.eliminated.push(_second); if (gs.isMerged) gs.jury.push(_second); }
          }
        } else {
          gs.eliminated.push(_second);
          if (gs.isMerged) gs.jury.push(_second);
        }
        gs.activePlayers = gs.activePlayers.filter(p => p !== _second);
        gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _second)}));
        handleAdvantageInheritance(_second, ep);
        gs.advantages = gs.advantages.filter(a => a.holder !== _second);
        // BLACK VOTE for announced double boot second elimination
        if (cfg.blackVote && cfg.blackVote !== 'off' && gs.activePlayers.length > 4) {
          const _bvA2Pool = ep.tribalPlayers?.filter(p => p !== _second && p !== r1.eliminated && gs.activePlayers.includes(p)) || [];
          if (_bvA2Pool.length) {
            if (cfg.blackVote === 'classic') {
              const _bvA2Target = [..._bvA2Pool].sort((a, b) => getBond(_second, a) - getBond(_second, b))[0];
              if (_bvA2Target) {
                if (!gs.blackVotes) gs.blackVotes = [];
                gs.blackVotes.push({ from: _second, target: _bvA2Target, ep: epNum, type: 'classic', reason: `${_second} wants ${_bvA2Target} gone — lowest bond of anyone left` });
                ep.blackVote2 = { from: _second, target: _bvA2Target, type: 'classic', reason: `${_second} wants ${_bvA2Target} gone — lowest bond of anyone left` };
              }
            } else if (cfg.blackVote === 'modern') {
              const _bvA2Recipient = [..._bvA2Pool].sort((a, b) => getBond(_second, b) - getBond(_second, a))[0];
              if (_bvA2Recipient) {
                gs.advantages.push({ holder: _bvA2Recipient, type: 'extraVote', foundEp: epNum, fromBlackVote: true, giftedBy: _second });
                ep.blackVote2 = { from: _second, recipient: _bvA2Recipient, type: 'modern', reason: `${_second}'s closest remaining connection` };
              }
            }
          }
        }
      }
    } else {
      // Surprise double boot: run a second tribal vote
      const remaining = ep.tribalPlayers.filter(p => p !== r1.eliminated);
      ep.immunityWinner2 = null; // no separate immunity challenge for vote 2
      gs._currentImmuneNames = [ep.immunityWinner, ...(ep.extraImmune || [])].filter(Boolean);
      const alliances2 = formAlliances(remaining, tribeLabel);
      ep.alliances2 = alliances2;
      ep.tiebreakerResult1 = ep.tiebreakerResult || null; // capture vote-1 tiebreaker before vote-2 may overwrite
      ep.tiebreakerResult = null;
      // Save vote-1 idol plays and reset for vote 2 — idol protection doesn't carry over
      ep.idolPlays1 = ep.idolPlays || [];
      ep.idolPlays = [];
      ep.shotInDark1 = ep.shotInDark || null;
      ep.shotInDark = null;
      const r2 = runTribal(remaining, ep.immunityWinner2, alliances2);
      ep.votes2 = r2.votes; ep.votingLog2 = r2.log;
      ep.isTie = r2.isTie; ep.tiedPlayers = r2.tiedPlayers;

      // ── Second Life twist check for vote 2 ──
      if (ep.isFireMaking && !ep.fireMaking && r2.eliminated) {
        // Same duel logic as vote 1 — reuse the full Second Life path
        const _sl2Elim = r2.eliminated;
        const _sl2S = pStats(_sl2Elim);
        const _sl2Pool = remaining.filter(p =>
          p !== _sl2Elim && p !== ep.immunityWinner && !(ep.extraImmune||[]).includes(p)
        );
        if (_sl2Pool.length) {
          const _sl2Opp = wRandom(_sl2Pool, p => {
            const os = pStats(p); const bond = getBond(_sl2Elim, p);
            const weakScore = (10 - os.endurance) * 0.3 + (10 - os.physical) * 0.3 + (10 - os.mental) * 0.2;
            const revengeMod = bond <= -3 ? 2.0 : bond <= -1 ? 0.5 : 0;
            return Math.max(0.1, _sl2S.strategic >= 7 ? weakScore * 1.5 + revengeMod * 0.3 : weakScore * 0.5 + revengeMod * 1.5) + Math.random() * 0.5;
          });
          const _sl2Pr = pronouns(_sl2Elim);
          const _sl2Bond = getBond(_sl2Elim, _sl2Opp);
          const _sl2Reason = _sl2Bond <= -2 ? `${_sl2Elim} picked ${_sl2Opp} — personal.`
            : _sl2S.strategic >= 7 ? `${_sl2Elim} picked ${_sl2Opp} — calculated.`
            : `${_sl2Elim} picked ${_sl2Opp}. The tribe watches in silence.`;
          const _slDuelTypes = [
            { id:'fire', name:'Fire-Making', desc:'First to build a sustainable fire wins.', stat:s=>s.endurance*0.5+s.physical*0.4+s.temperament*0.1 },
            { id:'puzzle', name:'Speed Puzzle', desc:'First to solve a slide puzzle wins.', stat:s=>s.mental*0.6+s.strategic*0.3+s.temperament*0.1 },
            { id:'endurance', name:'Last One Standing', desc:'Hold position on a narrow beam.', stat:s=>s.endurance*0.6+s.physical*0.2+s.temperament*0.2 },
            { id:'balance', name:'Balancing Act', desc:'Stack blocks on a wobbly platform.', stat:s=>s.endurance*0.3+s.temperament*0.4+s.mental*0.3 },
            { id:'precision', name:'Dead Shot', desc:'Toss sandbags onto a target.', stat:s=>s.physical*0.4+s.mental*0.3+s.temperament*0.3 },
          ];
          const _sl2Duel = _slDuelTypes[Math.floor(Math.random() * _slDuelTypes.length)];
          const _sl2eS = _sl2Duel.stat(_sl2S) + Math.random() * 3;
          const _sl2oS = _sl2Duel.stat(pStats(_sl2Opp)) + Math.random() * 3;
          const _sl2Win = _sl2eS > _sl2oS;
          const winner = _sl2Win ? _sl2Elim : _sl2Opp;
          const loser = _sl2Win ? _sl2Opp : _sl2Elim;
          ep.fireMaking = { player: _sl2Elim, opponent: _sl2Opp, winner, loser, reason: _sl2Reason,
            duelType: _sl2Duel.id, duelName: _sl2Duel.name, duelDesc: _sl2Duel.desc };
          r2.eliminated = loser;
          if (winner === _sl2Elim) addBond(_sl2Opp, _sl2Elim, -2.5);
        }
      }
      // ── Second Life Amulet check for vote 2 ──
      if (!ep.isFireMaking && !ep.fireMaking && r2.eliminated) {
        let _sla2Idx = gs.advantages.findIndex(a => a.type === 'secondLife' && a.holder === r2.eliminated);
        let _sla2Ally = null;
        if (_sla2Idx < 0) {
          const _sla2Allies = gs.advantages.map((a, i) => ({ adv: a, idx: i }))
            .filter(({ adv }) => adv.type === 'secondLife' && adv.holder !== r2.eliminated && remaining.includes(adv.holder));
          for (const { adv, idx } of _sla2Allies) {
            const bond = getBond(adv.holder, r2.eliminated); const s = pStats(adv.holder);
            if (bond >= 3 && Math.random() < 0.15 + s.loyalty * 0.04 + bond * 0.03) { _sla2Idx = idx; _sla2Ally = adv.holder; break; }
          }
        }
        if (_sla2Idx >= 0) {
          gs.advantages.splice(_sla2Idx, 1);
          if (_sla2Ally) addBond(r2.eliminated, _sla2Ally, 3.0);
          const _sl2Elim = r2.eliminated; const _sl2S = pStats(_sl2Elim);
          const _sl2Pool = remaining.filter(p => p !== _sl2Elim && p !== ep.immunityWinner && !(ep.extraImmune||[]).includes(p));
          if (_sl2Pool.length) {
            const _sl2Opp = wRandom(_sl2Pool, p => {
              const os = pStats(p); const bond = getBond(_sl2Elim, p);
              return Math.max(0.1, _sl2S.strategic >= 7 ? ((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*1.5 + (bond<=-3?0.6:0) : ((10-os.endurance)*0.3+(10-os.physical)*0.3+(10-os.mental)*0.2)*0.5 + (bond<=-3?3:bond<=-1?0.75:0)) + Math.random()*0.5;
            });
            const _sl2Pr = pronouns(_sl2Elim); const _sl2Bond = getBond(_sl2Elim, _sl2Opp);
            const _sl2Reason = _sl2Bond <= -2 ? `${_sl2Elim} picked ${_sl2Opp} — personal.`
              : _sl2S.strategic >= 7 ? `${_sl2Elim} picked ${_sl2Opp} — calculated.`
              : `${_sl2Elim} picked ${_sl2Opp}. The tribe watches in silence.`;
            const _slDuelTypes = [
              { id:'fire', name:'Fire-Making', desc:'First to build a sustainable fire wins.', stat:s=>s.endurance*0.5+s.physical*0.4+s.temperament*0.1 },
              { id:'puzzle', name:'Speed Puzzle', desc:'First to solve a slide puzzle wins.', stat:s=>s.mental*0.6+s.strategic*0.3+s.temperament*0.1 },
              { id:'endurance', name:'Last One Standing', desc:'Hold position on a narrow beam.', stat:s=>s.endurance*0.6+s.physical*0.2+s.temperament*0.2 },
              { id:'balance', name:'Balancing Act', desc:'Stack blocks on a wobbly platform.', stat:s=>s.endurance*0.3+s.temperament*0.4+s.mental*0.3 },
              { id:'precision', name:'Dead Shot', desc:'Toss sandbags onto a target.', stat:s=>s.physical*0.4+s.mental*0.3+s.temperament*0.3 },
            ];
            const _sl2Duel = _slDuelTypes[Math.floor(Math.random() * _slDuelTypes.length)];
            const _sl2eS = _sl2Duel.stat(_sl2S) + Math.random() * 3;
            const _sl2oS = _sl2Duel.stat(pStats(_sl2Opp)) + Math.random() * 3;
            const _sl2Win = _sl2eS > _sl2oS;
            const winner = _sl2Win ? _sl2Elim : _sl2Opp;
            const loser = _sl2Win ? _sl2Opp : _sl2Elim;
            ep.fireMaking = { player: _sl2Elim, opponent: _sl2Opp, winner, loser, reason: _sl2Reason,
              duelType: _sl2Duel.id, duelName: _sl2Duel.name, duelDesc: _sl2Duel.desc,
              fromAmulet: true, allyPlayer: _sla2Ally || null };
            ep.isFireMaking = true;
            r2.eliminated = loser;
            if (winner === _sl2Elim) addBond(_sl2Opp, _sl2Elim, -2.5);
          }
        }
      }

      ep.eliminated = r2.eliminated;
      // BLACK VOTE for vote 2 eliminated player
      if (r2.eliminated && cfg.blackVote && cfg.blackVote !== 'off' && gs.activePlayers.length > 4) {
        const _bv2Pool = ep.tribalPlayers?.filter(p => p !== r2.eliminated && p !== r1.eliminated && gs.activePlayers.includes(p)) || [];
        if (_bv2Pool.length) {
          const _bv2Elim = r2.eliminated;
          if (cfg.blackVote === 'classic') {
            const _bv2Target = [..._bv2Pool].sort((a, b) => getBond(_bv2Elim, a) - getBond(_bv2Elim, b))[0];
            if (_bv2Target) {
              if (!gs.blackVotes) gs.blackVotes = [];
              gs.blackVotes.push({ from: _bv2Elim, target: _bv2Target, ep: epNum, type: 'classic', reason: `${_bv2Elim} wants ${_bv2Target} gone — lowest bond of anyone left` });
              ep.blackVote2 = { from: _bv2Elim, target: _bv2Target, type: 'classic', reason: `${_bv2Elim} wants ${_bv2Target} gone — lowest bond of anyone left` };
            }
          } else if (cfg.blackVote === 'modern') {
            const _bv2Recipient = [..._bv2Pool].sort((a, b) => getBond(_bv2Elim, b) - getBond(_bv2Elim, a))[0];
            if (_bv2Recipient) {
              gs.advantages.push({ holder: _bv2Recipient, type: 'extraVote', foundEp: epNum, fromBlackVote: true, giftedBy: _bv2Elim });
              ep.blackVote2 = { from: _bv2Elim, recipient: _bv2Recipient, type: 'modern', reason: `${_bv2Elim}'s closest remaining connection` };
            }
          }
        }
      }
    }
  } else {
    ep.eliminated = r1.eliminated;
  }

  // Track if Safety Without Power caused an ally's elimination
  if (gs.safetyNoPowerPlayed && ep.eliminated) {
    const _snpBond = getBond(gs.safetyNoPowerPlayed.holder, ep.eliminated);
    if (_snpBond >= 2) gs.safetyNoPowerPlayed.allyCost = ep.eliminated;
  }

  // Track whether sole vote target survived (for aftermath events)
  if (gs.soleVotePlayed) {
    if (ep.eliminated) {
      gs.soleVotePlayed.target = ep.eliminated;
      gs.soleVotePlayed.survived = false;
    } else {
      gs.soleVotePlayed.survived = true;
    }
  }

  // ── [9] TRIBAL COUNCIL BLOWUP ──
  checkTribalBlowup(ep);
  applyCrashoutEffects(ep); // applies game effects when full blowup threshold not met

  // ── TEAM SWAP ALLY-SAVE: holder plays Team Swap for an eliminated ally ──
  if (ep.eliminated && !ep.eliminationSwap && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    const _tsAllyAdvs = gs.advantages.filter(a => a.type === 'teamSwap' && gs.activePlayers.includes(a.holder) && a.holder !== ep.eliminated);
    for (const _tsAdv of _tsAllyAdvs) {
      const _tsHolder = _tsAdv.holder;
      const _tsS = pStats(_tsHolder);
      const _tsBond = getBond(_tsHolder, ep.eliminated);
      // Only save allies with strong bond — proportional to loyalty and bond
      const _tsAllyPlayChance = _tsBond * 0.08 + _tsS.loyalty * 0.04;
      if (_tsBond < 2 || Math.random() >= _tsAllyPlayChance) continue;
      // Play it — flag for elimination-swap
      gs.advantages.splice(gs.advantages.indexOf(_tsAdv), 1);
      gs.knownTeamSwapHolders?.delete(_tsHolder);
      ep.eliminationSwap = true;
      ep.teamSwapAdvantage = true;
      ep.idolPlays = ep.idolPlays || [];
      ep.idolPlays.push({ player: _tsHolder, type: 'teamSwap', playedFor: ep.eliminated, forced: false });
      ep.teamSwapPlayed = { holder: _tsHolder, savedAlly: ep.eliminated };
      // bigMoves + bond boost
      const _tsBmState = getPlayerState(_tsHolder);
      _tsBmState.bigMoves = (_tsBmState.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(_tsHolder)) gs.bigMoveEarnersThisEp.push(_tsHolder);
      addBond(_tsHolder, ep.eliminated, 1.5); // saved your game
      break;
    }
  }

  // ── ELIMINATION SWAP: voted-out moves to another tribe; picks one member to come back ──
  if (ep.eliminated && ep.eliminationSwap && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    const swapper = ep.eliminated;
    const swapperTribe = gs.tribes.find(t => t.members.includes(swapper));
    const otherTribes = gs.tribes.filter(t => t !== swapperTribe);
    const destTribe = otherTribes.sort((a,b) => b.members.length - a.members.length)[0];
    const destPool = destTribe?.members.filter(p => gs.activePlayers.includes(p)) || [];
    if (swapperTribe && destTribe && destPool.length > 0) {
      // Swapper picks whoever they're least bonded with (or weakest challenge threat)
      const pickedPlayer = wRandom(destPool, p => Math.max(0.1, -getBond(swapper, p) + (10 - pStats(p).strategic) * 0.3 + 1));
      swapperTribe.members = swapperTribe.members.filter(p => p !== swapper);
      destTribe.members    = destTribe.members.filter(p => p !== pickedPlayer);
      destTribe.members.push(swapper);
      swapperTribe.members.push(pickedPlayer);
      ep.swapResult = { swapper, fromTribe: swapperTribe.name, toTribe: destTribe.name, pickedPlayer };
      ep.eliminated = null; // no one is eliminated
      // Track skipped elimination so buildEpisodeMap extends the season
      if (!gs.skippedEliminationEps) gs.skippedEliminationEps = [];
      if (!gs.skippedEliminationEps.includes(epNum)) gs.skippedEliminationEps.push(epNum);
      // Shift all future twists forward by 1 to match the inserted blank episode
      if (!gs._twistShiftedForEps) gs._twistShiftedForEps = [];
      if (!gs._twistShiftedForEps.includes(epNum) && seasonConfig.twistSchedule?.length) {
        gs._twistShiftedForEps.push(epNum);
        seasonConfig.twistSchedule.forEach(tw => {
          if (Number(tw.episode) > epNum) tw.episode = Number(tw.episode) + 1;
        });
        try { localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); } catch(e) {}
      }
    }

  // ── EXILE DUEL RESOLUTION: duel between exile player and this episode's boot ──
  // Must check BEFORE exile setup — if someone is already on exile, resolve the duel first
  } else if (ep.eliminated && gs.exileDuelPlayer) {
    // Volunteer Exile Duel: mark granted if the volunteer was voted out into the duel
    if (ep.volunteerDuel && ep.eliminated === ep.volunteerDuel.volunteer) {
      ep.volunteerDuel.granted = true;
    }
    const exilePlayer = gs.exileDuelPlayer;
    const newBoot = ep.eliminated;
    ep.exileDuelVotedOut = newBoot; // preserve who was actually voted out (for WHY card)
    const _edResult = simulateLastChance(exilePlayer, newBoot);
    ep.exileDuelResult = { exilePlayer, newBoot, winner: _edResult.winner, loser: _edResult.loser, challengeLabel: _edResult.challengeLabel, challengeCategory: _edResult.challengeCategory, challengeDesc: _edResult.challengeDesc };
    gs.exileDuelPlayer = null;
    const _edLoser = _edResult.loser; const _edWinner = _edResult.winner;
    gs.eliminated.push(_edLoser);
    if (gs.isMerged) gs.jury.push(_edLoser);
    gs.activePlayers = gs.activePlayers.filter(p => p !== _edLoser);
    gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _edLoser)}));
    handleAdvantageInheritance(_edLoser, ep);
    gs.advantages = gs.advantages.filter(a => a.holder !== _edLoser);
    if (_edWinner === exilePlayer) {
      // Exile player won — add back to activePlayers and rejoin a tribe
      if (!gs.activePlayers.includes(exilePlayer)) gs.activePlayers.push(exilePlayer);
      const _smallest = [...gs.tribes].sort((a,b) => a.members.length - b.members.length)[0];
      if (_smallest) _smallest.members.push(_edWinner);
      // New boot is the loser — already handled above, also remove from tribe/advantages
      gs.activePlayers = gs.activePlayers.filter(p => p !== newBoot);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== newBoot)}));
      handleAdvantageInheritance(newBoot, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== newBoot);
    }
    ep.eliminated = _edLoser;
    ep.riChoice = null;

    // ── Volunteer Exile Duel: apply grudge bonus if the volunteer won ──
    // Check previous episode's volunteerDuel (the volunteer was voted out last ep, duel happens this ep)
    const _prevEpVD = gs.episodeHistory?.[gs.episodeHistory.length - 1]?.volunteerDuel;
    if (_prevEpVD?.granted && _edWinner === _prevEpVD.volunteer) {
      _prevEpVD.duelResult = 'won';
      ep.volunteerDuelReturn = { volunteer: _edWinner, rival: _edLoser, result: 'won' };
      // Grudge bonus: heat reduction, bond damage with rival, popularity
      if (!gs._volunteerDuelReturnHeat) gs._volunteerDuelReturnHeat = {};
      gs._volunteerDuelReturnHeat[_edWinner] = (gs.episode || 0) + 1;
      addBond(_edWinner, _edLoser, -2.0);
      if (gs.popularity) gs.popularity[_edWinner] = (gs.popularity[_edWinner] || 0) + 5;
    } else if (_prevEpVD?.granted && _edLoser === _prevEpVD.volunteer) {
      _prevEpVD.duelResult = 'lost';
      ep.volunteerDuelReturn = { volunteer: _edLoser, rival: _edWinner, result: 'lost' };
    }

  // ── EXILE DUEL SETUP: voted-out goes to exile instead of eliminated (only when nobody is already on exile) ──
  } else if (ep.eliminated && ep.exileDuelActive && !gs.exileDuelPlayer) {
    // Volunteer Exile Duel: mark if the volunteer was granted their wish
    if (ep.volunteerDuel && ep.eliminated === ep.volunteerDuel.volunteer) {
      ep.volunteerDuel.granted = true;
    }
    gs.exileDuelPlayer = ep.eliminated;
    // Remove from activePlayers AND tribes — they're on exile, not in the game right now
    // They'll be added back if they win the duel
    gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
    gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
    gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
    ep.exilePlayer = ep.eliminated;
    ep.eliminated = null; // in exile — not permanently out yet

  // ── RI CHOICE (standard elimination) — only if RI is still accepting players ──
  } else if (ep.eliminated) {
    if (isRIStillActive()) {
      if (cfg.riFormat === 'rescue') {
        ep.riChoice = 'RESCUE ISLAND';
        gs.riPlayers.push(ep.eliminated);
        if (!gs.riArrivalEp) gs.riArrivalEp = {};
        gs.riArrivalEp[ep.eliminated] = epNum;
        ep.riArrival = { name: ep.eliminated, existingResidents: gs.riPlayers.filter(p => p !== ep.eliminated) };
      } else {
        const choice = simulateRIChoice(ep.eliminated);
        ep.riChoice = choice;
        if (choice === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
        else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
      }
    } else {
      gs.eliminated.push(ep.eliminated); ep.riChoice = null;
      if (gs.isMerged) gs.jury.push(ep.eliminated);
    }
    gs.activePlayers = gs.activePlayers.filter(p => p!==ep.eliminated);
    gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p!==ep.eliminated)}));
    handleAdvantageInheritance(ep.eliminated, ep);
    gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
    // Track if a provider was voted out (for food crisis next episode)
    if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(ep.eliminated)) {
      const _elimTribe = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(ep.eliminated))?.name || '');
      gs.providerVotedOutLastEp = { name: ep.eliminated, tribeName: _elimTribe };
    }

    // ── TIED DESTINIES: partner elimination ──
    if (ep.tiedDestinies && ep.eliminated) {
      const _tdPair = ep.tiedDestinies.pairs.find(p => p.a === ep.eliminated || p.b === ep.eliminated);
      if (_tdPair) {
        const _tdPartner = _tdPair.a === ep.eliminated ? _tdPair.b : _tdPair.a;
        if (gs.activePlayers.includes(_tdPartner)) {
          ep.tiedDestinies.eliminatedTarget = ep.eliminated;
          ep.tiedDestinies.eliminatedPartner = _tdPartner;
          // Handle partner elimination — same flow as main elimination
          handleAdvantageInheritance(_tdPartner, ep);
          gs.advantages = gs.advantages.filter(a => a.holder !== _tdPartner);
          if (isRIStillActive()) {
            if (cfg.riFormat === 'rescue') {
              gs.riPlayers.push(_tdPartner);
              if (!gs.riArrivalEp) gs.riArrivalEp = {};
              gs.riArrivalEp[_tdPartner] = epNum;
            } else {
              gs.eliminated.push(_tdPartner);
              if (gs.isMerged) gs.jury.push(_tdPartner);
            }
          } else {
            gs.eliminated.push(_tdPartner);
            if (gs.isMerged) gs.jury.push(_tdPartner);
          }
          gs.activePlayers = gs.activePlayers.filter(p => p !== _tdPartner);
          gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _tdPartner)}));
          // Track provider voted out for food crisis
          if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(_tdPartner)) {
            gs.providerVotedOutLastEp = gs.providerVotedOutLastEp || {};
          }
        }
      }
      // Clean up pair-aware state
      delete gs._tiedDestiniesActive;
    }

    // ── EMISSARY VOTE: second elimination by emissary pick ──
    if (ep.emissary && !ep.eliminationSwap) {
      const _evPick = window.simulateEmissaryVote(ep);
      if (_evPick) {
        ep.emissaryEliminated = _evPick.name;
        // ── Bond consequences ──
        const _evEmissary = ep.emissary.name;
        const _evPickName = _evPick.name;
        ep.emissaryBondShifts = [];
        const _evLoseMembers = (ep.tribalPlayers || []).filter(p => p !== ep.eliminated && p !== _evPickName && gs.activePlayers.includes(p));

        // Allies of the picked player: grudge proportional to bond, resentment for neutrals
        _evLoseMembers.forEach(p => {
          const allyBond = getBond(p, _evPickName);
          // Proportional: positive bond = scaled grudge, neutral/negative = flat resentment
          const delta = allyBond > 0 ? -(allyBond * 0.22) : -0.3;
          const reason = allyBond > 0 ? 'ally-grudge' : 'resentment';
          addBond(p, _evEmissary, delta);
          ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta, reason });
        });

        // Players who pitched against the picked player or had them as vote target: gratitude
        const _evVotersAgainst = (ep.votingLog || []).filter(l => l.voted === _evPickName).map(l => l.voter);
        const _evPitchersAgainst = (ep.emissaryScoutEvents || []).filter(e => e.type === 'emissaryPitch' && e.pitchTarget === _evPickName).map(e => e.pitcher);
        const _evGrateful = [...new Set([..._evVotersAgainst, ..._evPitchersAgainst])].filter(p => p !== _evPickName && gs.activePlayers.includes(p));
        _evGrateful.forEach(p => {
          addBond(p, _evEmissary, 0.8);
          ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: 0.8, reason: 'gratitude' });
        });

        // Emissary's own tribe: strategic tribemates approve high-threat pick, hero/loyal disapprove low-threat
        const _evOwnMembers = (gs.tribes.find(t => t.name === ep.emissary.tribe)?.members || []).filter(p => p !== _evEmissary && gs.activePlayers.includes(p));
        const _evPickThreat = threatScore(_evPickName);
        _evOwnMembers.forEach(p => {
          const pS = pStats(p);
          // Proportional: strategic players approve proportional to target's threat
          const approval = _evPickThreat * 0.04 * pS.strategic * 0.04; // max ~0.64 at threat 10/strat 10
          // Hero/loyal types disapprove proportional to how NON-threatening the pick was
          const disapproval = ['hero', 'loyal', 'protector'].includes(pS.archetype)
            ? (10 - _evPickThreat) * 0.03 * pS.loyalty * 0.03 // max ~0.27 at threat 1/loyalty 10
            : 0;
          const delta = approval - disapproval;
          if (Math.abs(delta) > 0.02) {
            addBond(p, _evEmissary, delta);
            ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta, reason: delta > 0 ? 'good-move' : 'cruel-pick' });
          }
        });

        // ── Heat: emissary gets +1.5 heat for 2 episodes ──
        if (!gs._emissaryHeat) gs._emissaryHeat = {};
        gs._emissaryHeat[_evEmissary] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };

        // ── Popularity ──
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[_evEmissary] = (gs.popularity[_evEmissary] || 0) - 2;
        gs.popularity[_evPickName] = (gs.popularity[_evPickName] || 0) + 3;

        // ── Eliminate the emissary's pick ──
        if (isRIStillActive()) {
          if (cfg.riFormat === 'rescue') {
            gs.riPlayers.push(_evPickName);
            if (!gs.riArrivalEp) gs.riArrivalEp = {};
            gs.riArrivalEp[_evPickName] = (gs.episode || 0) + 1;
          } else {
            const _evRIChoice = simulateRIChoice(_evPickName);
            if (_evRIChoice === 'REDEMPTION ISLAND') gs.riPlayers.push(_evPickName);
            else { gs.eliminated.push(_evPickName); if (gs.isMerged) gs.jury.push(_evPickName); }
          }
        } else {
          gs.eliminated.push(_evPickName);
          if (gs.isMerged) gs.jury.push(_evPickName);
        }
        gs.activePlayers = gs.activePlayers.filter(p => p !== _evPickName);
        gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _evPickName)}));
        handleAdvantageInheritance(_evPickName, ep);
        gs.advantages = gs.advantages.filter(a => a.holder !== _evPickName);

        // ── Post-emissary tribe dissolution: if losing tribe has ≤1 member, dissolve ──
        const _evLoseTribe = gs.tribes.find(t => t.name === ep.emissary.targetTribe);
        const _evLoseActive = _evLoseTribe?.members.filter(m => gs.activePlayers.includes(m)) || [];
        if (_evLoseTribe && _evLoseActive.length <= 1 && _evLoseActive.length > 0) {
          const _evSolo = _evLoseActive[0];
          const _evFromName = _evLoseTribe.name;
          // Send to smallest tribe; if tied, random
          const _evCandTribes = gs.tribes.filter(t => t.name !== _evFromName && t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
          if (_evCandTribes.length) {
            const _evSorted = _evCandTribes.slice().sort((a, b) => {
              const aSize = a.members.filter(m => gs.activePlayers.includes(m)).length;
              const bSize = b.members.filter(m => gs.activePlayers.includes(m)).length;
              return aSize - bSize || (Math.random() - 0.5); // smallest first, random tiebreak
            });
            const _evDestTribe = _evSorted[0];
            ep.emissaryDissolve = { player: _evSolo, fromTribe: _evFromName, toTribe: _evDestTribe.name };
            gs.tribes = gs.tribes
              .filter(t => t.name !== _evFromName)
              .map(t => t.name === _evDestTribe.name ? { ...t, members: [...t.members, _evSolo] } : t);
            // Camp event for the arrival
            const _edPr = pronouns(_evSolo);
            const _evArrKey = _evDestTribe.name;
            if (!ep.campEvents) ep.campEvents = {};
            if (!ep.campEvents[_evArrKey]) ep.campEvents[_evArrKey] = { pre: [], post: [] };
            if (!ep.campEvents[_evArrKey].post) ep.campEvents[_evArrKey].post = [];
            ep.campEvents[_evArrKey].post.push({
              type: 'tribeArrival',
              players: [_evSolo],
              text: `${_evFromName} is gone. ${_evSolo} joins ${_evDestTribe.name} — the emissary vote wiped out ${_edPr.posAdj} entire tribe. ${_edPr.Sub} ${_edPr.sub==='they'?'have':'has'} to start over.`,
              badgeText: 'TRIBE DISSOLVED', badgeClass: 'red'
            });
          }
        }
      }
    }

    // Clear volunteer duel heat after tribal
    if (gs._volunteerDuelHeat) delete gs._volunteerDuelHeat;
    // Clear phobia blame after tribal
    if (gs._phobiaBlame) delete gs._phobiaBlame;
    if (gs._cliffDiveBlame) delete gs._cliffDiveBlame;
    if (gs._awakeAThonBlame) delete gs._awakeAThonBlame;
    // Clear reward backfire heat after tribal
    if (gs._rewardBackfireHeat && (gs.episode || 0) + 1 >= gs._rewardBackfireHeat.expiresEp) delete gs._rewardBackfireHeat;
    // Clear expired emissary heat
    if (gs._emissaryHeat) {
      Object.keys(gs._emissaryHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._emissaryHeat[k].expiresEp) delete gs._emissaryHeat[k];
      });
      if (!Object.keys(gs._emissaryHeat).length) delete gs._emissaryHeat;
    }
    // Clear expired dodgebrawl heat
    if (gs._dodgebrawlHeat) {
      Object.keys(gs._dodgebrawlHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._dodgebrawlHeat[k].expiresEp) delete gs._dodgebrawlHeat[k];
      });
      if (!Object.keys(gs._dodgebrawlHeat).length) delete gs._dodgebrawlHeat;
    }
    // Clear expired talent show heat
    if (gs._talentShowHeat) {
      Object.keys(gs._talentShowHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._talentShowHeat[k].expiresEp) delete gs._talentShowHeat[k];
      });
      if (!Object.keys(gs._talentShowHeat).length) delete gs._talentShowHeat;
    }
    if (gs._suckyOutdoorsHeat) {
      Object.keys(gs._suckyOutdoorsHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._suckyOutdoorsHeat[k].expiresEp) delete gs._suckyOutdoorsHeat[k];
      });
      if (!Object.keys(gs._suckyOutdoorsHeat).length) delete gs._suckyOutdoorsHeat;
    }
    if (gs._schemeHeat) {
      Object.keys(gs._schemeHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._schemeHeat[k].expiresEp) delete gs._schemeHeat[k];
      });
      if (!Object.keys(gs._schemeHeat).length) delete gs._schemeHeat;
    }
    if (gs._upTheCreekHeat) {
      Object.keys(gs._upTheCreekHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._upTheCreekHeat[k].expiresEp) delete gs._upTheCreekHeat[k];
      });
      if (!Object.keys(gs._upTheCreekHeat).length) delete gs._upTheCreekHeat;
    }
    if (gs._paintballHeat) {
      Object.keys(gs._paintballHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._paintballHeat[k].expiresEp) delete gs._paintballHeat[k];
      });
      if (!Object.keys(gs._paintballHeat).length) delete gs._paintballHeat;
    }
    if (gs._cookingHeat) {
      Object.keys(gs._cookingHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._cookingHeat[k].expiresEp) delete gs._cookingHeat[k];
      });
      if (!Object.keys(gs._cookingHeat).length) delete gs._cookingHeat;
    }
    if (gs._trustHeat) {
      Object.keys(gs._trustHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._trustHeat[k].expiresEp) delete gs._trustHeat[k];
      });
      if (!Object.keys(gs._trustHeat).length) delete gs._trustHeat;
    }

    // ── BLACK VOTE: eliminated player casts a parting vote/gift (until F4) ──
    if (cfg.blackVote && cfg.blackVote !== 'off' && gs.activePlayers.length > 4) {
      const _bvElim = ep.eliminated;
      const _bvS = pStats(_bvElim);
      const _bvPr = pronouns(_bvElim);
      const _bvPick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];

      // Pre-merge: only target/gift players from the same tribal (your tribemates)
      // Post-merge: anyone is fair game
      const _bvPool = ep.tribalPlayers?.length
        ? ep.tribalPlayers.filter(p => p !== _bvElim && gs.activePlayers.includes(p))
        : gs.activePlayers.filter(p => p !== _bvElim);

      if (cfg.blackVote === 'classic') {
        // Classic: eliminated votes AGAINST someone — extra vote at next tribal
        // Target: lowest bond rival from the tribal pool
        const _bvCandidates = [..._bvPool].sort((a, b) => getBond(_bvElim, a) - getBond(_bvElim, b));
        const _bvTarget = _bvCandidates[0];
        if (_bvTarget) {
          if (!gs.blackVotes) gs.blackVotes = [];
          gs.blackVotes.push({ from: _bvElim, target: _bvTarget, ep: epNum, type: 'classic' });
          ep.blackVote = { from: _bvElim, target: _bvTarget, type: 'classic',
            reason: getBond(_bvElim, _bvTarget) <= -2
              ? `grudge — ${_bvElim} and ${_bvTarget} had bad blood`
              : `${_bvElim} wants ${_bvTarget} gone — lowest bond of anyone left`,
          };
        }
      } else if (cfg.blackVote === 'modern') {
        // Modern: eliminated gives an Extra Vote to their closest ally (from tribal pool)
        const _bvAllies = [..._bvPool].sort((a, b) => getBond(_bvElim, b) - getBond(_bvElim, a));
        const _bvRecipient = _bvAllies[0];
        if (_bvRecipient) {
          gs.advantages.push({ holder: _bvRecipient, type: 'extraVote', foundEp: epNum, fromBlackVote: true, giftedBy: _bvElim });
          ep.blackVote = { from: _bvElim, recipient: _bvRecipient, type: 'modern',
            reason: getBond(_bvElim, _bvRecipient) >= 3
              ? `loyalty — ${_bvElim} wanted to help ${_bvRecipient} get to the end`
              : `${_bvElim}'s closest remaining connection`,
          };
        }
      }
    }
  }

  // ── BLACK VOTE: consume fired black votes (OUTSIDE elimination branches so it runs even on Team Swap / exile) ──
  if (ep.blackVotePending && gs.blackVotes?.length) {
    const _bvP = ep.blackVotePending;
    gs.blackVotes = gs.blackVotes.filter(bv => !(bv.from === _bvP.from && bv.target === _bvP.target && bv.ep === _bvP.ep));
  }
  if (gs.blackVotes?.length) {
    gs.blackVotes = gs.blackVotes.filter(bv => !bv._applied);
  }
  delete ep.blackVotePending;
  delete gs._activeBlackVote;

  // ── POST-ELIMINATION RESCUE ISLAND: generate life events for new arrival ──
  if (cfg.ri && cfg.riFormat === 'rescue' && gs.riPlayers.length > 0) {
    generateRescueIslandLife(ep);
  }

  // ── POST-ELIMINATION RI: generate life events + fire duel if 2+ on RI ──
  // This makes the duel happen in the same episode the person arrives (not next episode)
  if (cfg.ri && cfg.riFormat !== 'rescue' && gs.riPlayers.length > 0 && !ep.riDuel) {
    ep.riPlayersPreDuel = [...gs.riPlayers];
    generateRILifeEvents(ep);
    if (gs.riPlayers.length >= 2) {
      const duel = simulateRIDuel(gs.riPlayers);
      ep.riDuel = duel;
      gs.riPlayers = gs.riPlayers.filter(p => p !== duel.loser);
      if (gs.isMerged) gs.jury.push(duel.loser);
      gs.eliminated.push(duel.loser);
      if (!gs.riDuelHistory) gs.riDuelHistory = [];
      gs.riDuelHistory.push({ ep: epNum, resident: duel.winner, arrival: duel.loser, winner: duel.winner, loser: duel.loser, challengeType: duel.challengeType, isThreeWay: duel.isThreeWay, duelists: duel.duelists });
      generateRIPostDuelEvents(ep);
    }
  }

  // ── REHIDE IDOL IF PLAYED (only if season config allows it) ──
  if (ep.idolRehide && seasonConfig.idolRehide) {
    if (gs.isMerged) gs.mergeIdolHidden = (gs.mergeIdolHidden || 0) + 1;
    else if (ep.loser) gs.idolSlots[ep.loser.name] = (gs.idolSlots[ep.loser.name] || 0) + 1;
  }

  // ── TRIBE DISSOLUTION: if any tribe has ≤2 members with 3+ tribes, dissolve and distribute ──
  if (!gs.isMerged && !ep.isMerge && gs.tribes.length >= 3) {
    const _activeTribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
    if (_activeTribes.length >= 3) {
      const _tinyTribes = _activeTribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length <= 2);
      _tinyTribes.forEach(_tinyTribe => {
        const _tinyMembers = _tinyTribe.members.filter(m => gs.activePlayers.includes(m));
        if (_tinyMembers.length === 0 || _tinyMembers.length > 2) return;
        // Only dissolve if there are still 3+ tribes after removal
        const _remainingTribes = gs.tribes.filter(t => t.name !== _tinyTribe.name && t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
        if (_remainingTribes.length < 2) return;

        // Distribute members: each goes to the tribe with fewest members (alternating if tie)
        const _dissolved = [];
        _tinyMembers.forEach(member => {
          const dest = _remainingTribes.slice().sort((a, b) => {
            const aSize = a.members.filter(m => gs.activePlayers.includes(m)).length;
            const bSize = b.members.filter(m => gs.activePlayers.includes(m)).length;
            return aSize - bSize || (Math.random() - 0.5);
          })[0];
          if (dest) {
            _tinyTribe.members = _tinyTribe.members.filter(m => m !== member);
            dest.members.push(member);
            _dissolved.push({ player: member, fromTribe: _tinyTribe.name, toTribe: dest.name });
          }
        });

        if (_dissolved.length) {
          // Remove the empty tribe
          gs.tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 1);
          // Store dissolution data
          if (!ep.tribeDissolutions) ep.tribeDissolutions = [];
          ep.tribeDissolutions.push({ tribe: _tinyTribe.name, members: _dissolved });
          // Camp events for arrivals
          _dissolved.forEach(d => {
            const pr = pronouns(d.player);
            if (!ep.campEvents) ep.campEvents = {};
            if (!ep.campEvents[d.toTribe]) ep.campEvents[d.toTribe] = { pre: [], post: [] };
            if (!ep.campEvents[d.toTribe].post) ep.campEvents[d.toTribe].post = [];
            ep.campEvents[d.toTribe].post.push({
              type: 'tribeArrival', players: [d.player],
              text: `${_tinyTribe.name} is gone. ${d.player} joins ${d.toTribe}. ${pr.Sub} ${pr.sub === 'they' ? 'arrive' : 'arrives'} with nothing but ${pr.posAdj} bag and a game to rebuild.`,
              badgeText: 'TRIBE DISSOLVED', badgeClass: 'red'
            });
          });
        }
      });
    }
  }

  // ── BOND UPDATES ──
  ep.bondChanges = updateBonds(ep.votingLog, ep.eliminated, alliances);
  // Open vote: public declarations carry extra bond damage — being named to your face stings more
  if (ep.openVote) {
    (ep.votingLog || []).forEach(({ voter, voted }) => {
      if (voted !== ep.eliminated && gs.activePlayers.includes(voted)) {
        addBond(voter, voted, -0.5); // on top of the standard -0.5 in updateBonds
      }
    });
  }
  detectBetrayals(ep);
  applyPostTribalConsequences(ep);
  checkAllianceRecruitment(ep); // scenario C: blindside swing voters
  checkSideDealBreaks(ep); checkConflictingDeals(ep); checkFalseInfoBlowup(ep);
  updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);

  // ── PHASE CHECK ──
  if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

  // ── INCREMENT & SAVE ──
  gs.episode = epNum;
  gs.episodeHistory.push({
    num: epNum, eliminated: ep.eliminated, firstEliminated: ep.firstEliminated || null, riChoice: ep.riChoice,
    immunityWinner: ep.challengeType === 'tribe' ? null : (ep.immunityWinner || null),
    challengeType: ep.challengeType, isMerge: ep.isMerge,
    challengeLabel: ep.challengeLabel || null,
    challengeCategory: ep.challengeCategory || null,
    challengeDesc: ep.challengeDesc || '',
    challengePlacements: ep.challengePlacements
      ? ep.challengePlacements.map(t => ({ name: t.name, members: [...(t.members||[])] }))
      : null,
    chalMemberScores: ep.chalMemberScores || null,
    chalPlacements: ep.chalPlacements || null,
    rewardChalData: (() => {
      const rct = (ep.twists||[]).find(t => t.type === 'reward-challenge');
      if (!rct) return null;
      return {
        winner: rct.rewardWinner,
        winnerType: rct.rewardWinnerType || 'individual',
        placements: rct.rewardChalPlacements || [],
        label: rct.rewardChalLabel || 'Reward Challenge',
        category: rct.rewardChalCategory || 'mixed',
        desc: rct.rewardChalDesc || '',
        rewardItemId:    rct.rewardItemId    || null,
        rewardItemLabel: rct.rewardItemLabel || null,
        rewardItemDesc:  rct.rewardItemDesc  || null,
        rewardCompanions:  rct.rewardCompanions  || null,
        rewardPickReasons: rct.rewardPickReasons || null, rewardPickStrategy: rct.rewardPickStrategy || null,
        rewardSnubs: rct.rewardSnubs || null, rewardAlliancePitched: rct.rewardAlliancePitched || false, rewardAllianceFormed: rct.rewardAllianceFormed || null, rewardAllianceFailed: rct.rewardAllianceFailed || false, rewardAllianceMembers: rct.rewardAllianceMembers || null, rewardAllianceStrengthened: rct.rewardAllianceStrengthened || null, rewardFailedPairs: rct.rewardFailedPairs || null, rewardPitchLeaks: rct.rewardPitchLeaks || null,
        rewardMaxCompanions: rct.rewardMaxCompanions || null,
        rewardCluedPlayer: rct.rewardCluedPlayer || null,
        rewardBackfire: rct.rewardBackfire || null,
      };
    })(),
    tribalTribe: ep.loser?.name || null,
    tribalPlayers: ep.tribalPlayers ? [...ep.tribalPlayers] : null,
    votes: ep.votes, alliances: ep.alliances.map(a=>({...a})),
    tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
    twistScenes: [], campEvents: ep.campEvents || null, tribeDissolutions: ep.tribeDissolutions || null, summaryText: '', gsSnapshot: window.snapshotGameState(),
    // Post-elimination twist results — saved here so VP can rebuild them on reload
    twists: (ep.twists||[]).map(t => ({...t})),
    votingLog:        ep.votingLog        || [],
    revoteLog:        ep.revoteLog        || [],
    revoteVotes:      ep.revoteVotes      || null,
    swapResult:       ep.swapResult       || null,
    emissary:           ep.emissary           || null,
    emissaryPick:       ep.emissaryPick       || null,
    emissaryEliminated: ep.emissaryEliminated || null,
    emissaryScoutEvents: ep.emissaryScoutEvents || null,
    emissaryBondShifts: ep.emissaryBondShifts || null,
    emissaryDissolve: ep.emissaryDissolve || null,
    isDodgebrawl:       ep.isDodgebrawl       || false,
    dodgebrawl:         ep.dodgebrawl         || null,
    isTalentShow:       ep.isTalentShow       || false,
    talentShow:         ep.talentShow         || null,
    isSuckyOutdoors:    ep.isSuckyOutdoors    || false,
    suckyOutdoors:      ep.suckyOutdoors      || null,
    isUpTheCreek:       ep.isUpTheCreek       || false,
    upTheCreek:         ep.upTheCreek         || null,
    isPaintballHunt:    ep.isPaintballHunt    || false,
    paintballHunt:      ep.paintballHunt      || null,
    isHellsKitchen:     ep.isHellsKitchen     || false,
    hellsKitchen:       ep.hellsKitchen        || null,
    isTrustChallenge:   ep.isTrustChallenge   || false,
    trustChallenge:     ep.trustChallenge      || null,
    exilePlayer:      ep.exilePlayer      || null,
    exileDuelResult:  ep.exileDuelResult  || null,
    exileDuelVotedOut: ep.exileDuelVotedOut || null,
    fireMaking:       ep.fireMaking       || null,
    tiebreakerResult:  ep.tiebreakerResult  || null,
    tiebreakerResult1: ep.tiebreakerResult1 || null,
    // Double elimination: type + second vote data
    announcedDoubleElim: ep.announcedDoubleElim || false,
    votes2:       ep.votes2       || null,
    votingLog2:   ep.votingLog2   || null,
    alliances2:   ep.alliances2   ? ep.alliances2.map(a=>({...a})) : null,
    immunityWinner2: ep.immunityWinner2 || null,
    sidFreshVote:     ep.sidFreshVote     || false,
    idolFinds:        ep.idolFinds        || [],
    idolPlays:        [...(ep.idolPlays1 || []), ...(ep.idolPlays || [])],
    idolPlays1:       ep.idolPlays1       || null,
    shotInDark1:      ep.shotInDark1      || null,
    idolMisplays:     ep.idolMisplays     || [],
    shotInDark:       ep.shotInDark       || null,
    kipSteal:         ep.kipSteal         || null,
    idolShares:       ep.idolShares       || [],
    spiritIslandEvents: ep.spiritIslandEvents || null,
    amuletCoordination: ep.amuletCoordination || null,
    feastEvents:      ep.feastEvents      || null,
    idolWagerResults: ep.idolWagerResults || null,
    overplayer:       ep.overplayer       || null,
    tribalBlowup:     ep.tribalBlowup     || null,
    chalSitOuts:      ep.chalSitOuts      || null,
    allianceQuits:    ep.allianceQuits    || [],
    allianceRecruits: ep.allianceRecruits || [],
    socialBombs:      ep.socialBombs      || [],
    _politicsLog:     ep._politicsLog     || [],
    votePitches:      ep.votePitches      || null,
    chalThreatEvents: ep.chalThreatEvents || [],
    goatEvents:       ep.goatEvents       || [],
    openVote:          ep.openVote         || false,
    openVoteOrder:     ep.openVoteOrder    || null,
    openVoteOrderedBy: ep.openVoteOrderedBy|| null,
    cascadeSwitches:   ep.cascadeSwitches  || [],
    openVoteReactions: ep.openVoteReactions|| [],
    riDuel:        ep.riDuel        || null,
    riPlayersPreDuel: ep.riPlayersPreDuel || null,
    riLifeEvents:  ep.riLifeEvents  || [],
    riReentry:     ep.riReentry     || null,
    rescueIslandEvents: ep.rescueIslandEvents || [],
    rescueReturnChallenge: ep.rescueReturnChallenge || null,
    riArrival:     ep.riArrival     || null,
    riQuit:        ep.riQuit        || null,
  });

  const twistScenes = generateTwistScenes(ep);
  gs.episodeHistory[gs.episodeHistory.length-1].twistScenes = twistScenes;
  ep.twistScenes = twistScenes;

  // Save campEvents + tipOffCampEvents — needed for VP Camp Life & Post-Challenge screens
  gs.episodeHistory[gs.episodeHistory.length-1].campEvents = ep.campEvents || null;
  gs.episodeHistory[gs.episodeHistory.length-1].tipOffCampEvents = ep.tipOffCampEvents || null;
  gs.episodeHistory[gs.episodeHistory.length-1].comfortBlindspotPlayer = ep.comfortBlindspotPlayer || null;
  gs.episodeHistory[gs.episodeHistory.length-1].advantagesPreTribal = ep.advantagesPreTribal || null;
  gs.episodeHistory[gs.episodeHistory.length-1].tribalPlayers = ep.tribalPlayers || null;
  gs.episodeHistory[gs.episodeHistory.length-1].bewareLostVotes = ep.bewareLostVotes || null;
  gs.episodeHistory[gs.episodeHistory.length-1].journey = ep.journey || null;
  gs.episodeHistory[gs.episodeHistory.length-1].sharedImmunity = ep.sharedImmunity || null;
  gs.episodeHistory[gs.episodeHistory.length-1].secondImmune = ep.secondImmune || null;
  gs.episodeHistory[gs.episodeHistory.length-1].extraImmune = ep.extraImmune || null;

  const summaryText = generateSummaryText(ep);
  gs.episodeHistory[gs.episodeHistory.length-1].summaryText = summaryText;
  ep.summaryText = summaryText;

  updatePlayerStates(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
  updateSurvival(ep);

  // Inject vote pitch camp events (after all camp event generation is complete)
  if (ep.votePitches?.length) {
    const _vpCampKey = gs.isMerged ? (gs.mergeName || 'merge') : (ep.loser?.name || ep.tribalTribe || gs.tribes[0]?.name || 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_vpCampKey]) ep.campEvents[_vpCampKey] = { pre: [], post: [] };
    if (!ep.campEvents[_vpCampKey].post) ep.campEvents[_vpCampKey].post = [];
    const _vpPick = arr => arr[Math.floor(Math.random() * arr.length)];
    ep.votePitches.forEach(p => {
      const pr = pronouns(p.pitcher);
      if (p.success) {
        ep.campEvents[_vpCampKey].post.push({
          type: 'votePitch', players: [p.pitcher, ...p.flipped],
          text: _vpPick([
            `${p.pitcher} worked the tribe before the vote. By the time they sat down, ${p.flipped.join(' and ')} had changed ${p.flipped.length > 1 ? 'their minds' : 'their mind'}. The target shifted to ${p.pitchTarget}.`,
            `${p.pitcher} pulled ${p.flipped.join(' and ')} aside minutes before tribal. The plan changed. ${p.pitchTarget}'s name replaced ${p.originalTarget || 'the original target'}.`,
            `Nobody saw ${p.pitcher} coming. ${pr.Sub} made ${pr.pos} case quietly, and ${p.flipped.join(' and ')} flipped. The vote landed on ${p.pitchTarget}.`,
          ]),
          badgeText: 'VOTE PITCH', badgeClass: 'gold'
        });
      } else {
        ep.campEvents[_vpCampKey].post.push({
          type: 'votePitchFailed', players: [p.pitcher],
          text: _vpPick([
            `${p.pitcher} tried to change the plan at the last minute. Nobody moved. The original target held.`,
            `${p.pitcher} made ${pr.pos} pitch before tribal. It didn't land. The tribe had already decided.`,
            `${p.pitcher} scrambled. ${pr.Sub} talked to everyone ${pr.sub} could. Nobody flipped.`,
          ]),
          badgeText: 'FAILED PITCH', badgeClass: 'red'
        });
      }
    });
    // Update saved campEvents in episode history
    gs.episodeHistory[gs.episodeHistory.length-1].campEvents = ep.campEvents;
  }

  // Save debug data to episode history before patching
  if (gs._scrambleActivations && !ep._debugScramble) ep._debugScramble = { ...gs._scrambleActivations };
  if (ep.challengeThrows?.length && !ep._debugThrows) ep._debugThrows = [...ep.challengeThrows];
  window.patchEpisodeHistory(ep);
  window.saveGameState();
  return ep;
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: POPULARITY SYSTEM
// ══════════════════════════════════════════════════════════════════════

export function updatePopularity(ep) {
  if (seasonConfig.popularityEnabled === false) return;
  if (!gs.popularity)             gs.popularity = {};
  if (!gs.popularityArcs)         gs.popularityArcs = {};
  if (!gs.topVoteStreak)          gs.topVoteStreak = {};
  if (!gs.dominantAllianceStreak) gs.dominantAllianceStreak = { id: null, count: 0 };

  // ── Flatten all camp events for this episode ──
  const allEvents = [];
  if (ep.campEvents) {
    Object.values(ep.campEvents).forEach(phaseData => {
      const pre  = Array.isArray(phaseData) ? phaseData : (phaseData?.pre  || []);
      const post = Array.isArray(phaseData) ? []         : (phaseData?.post || []);
      allEvents.push(...pre, ...post);
    });
  }

  // ── Per-axis per-episode accumulators ──
  const caps = { drama: 6, like: 4, under: 5 };
  const axisTotals = {};
  const epDeltas = {};

  const ensure = name => {
    if (!axisTotals[name]) axisTotals[name] = { drama: 0, like: 0, under: 0 };
    if (!epDeltas[name])   epDeltas[name] = [];
  };

  const add = (name, axis, rawDelta, reason) => {
    ensure(name);
    let delta = rawDelta;
    if (delta > 0) {
      const headroom = caps[axis] - axisTotals[name][axis];
      delta = Math.min(delta, headroom);
      if (delta <= 0) return;
    }
    axisTotals[name][axis] += delta;
    epDeltas[name].push({ axis, delta, reason });
  };

  // ── Archetype popularity bonuses ──
  gs.activePlayers.forEach(name => {
    const _arch = players.find(p => p.name === name)?.archetype || '';
    if (_arch === 'villain') add(name, 'drama', 3, 'villain archetype — drama machine');
    if (_arch === 'hero') add(name, 'like', 2, 'hero archetype — fan favorite energy');
    if (_arch === 'underdog') add(name, 'under', 2, 'underdog archetype — crowd support');
  });

  // ── Build per-player event index ──
  const epEventsByPlayer = {};
  allEvents.forEach(evt => {
    const pp = evt.players ? evt.players : (evt.player ? [evt.player] : []);
    pp.forEach(n => {
      if (!epEventsByPlayer[n]) epEventsByPlayer[n] = [];
      epEventsByPlayer[n].push(evt.type);
    });
  });

  // ── Scan camp events for deltas ──
  allEvents.forEach(evt => {
    const p  = evt.player;
    const ps = evt.players;

    switch (evt.type) {
      // Positive Drama
      case 'hotheadExplosion':    if (p)       add(p, 'drama', 3, evt.type); break;
      case 'showmancerMoment':    if (ps?.[0]) { add(ps[0], 'drama', 2, evt.type); add(ps[0], 'like', 1, evt.type); } break;
      case 'paranoiaSpiral':      if (ps?.[0]) { add(ps[0], 'drama', 3, evt.type); add(ps[0], 'like', -1, evt.type); } break;
      case 'brokerWhisper':       case 'brokerManipulate': case 'brokerConfidence': case 'brokerClose':
                                  if (ps?.[0]) add(ps[0], 'drama', 2, evt.type); break;
      case 'brokerExposed':       if (ps?.[0]) { add(ps[0], 'drama', 4, evt.type); add(ps[0], 'like', -2, evt.type); }
                                  if (ps?.[1]) add(ps[1], 'drama', 2, 'brokerExposer'); break;
      case 'brokerFallout':       break; // no individual scoring — it's a group reaction
      case 'brokerDefense':       if (ps?.[0]) add(ps[0], 'drama', 2, evt.type); break;
      case 'showmanceSpark':      if (ps?.[0]) { add(ps[0], 'drama', 3, evt.type); add(ps[0], 'like', 2, evt.type); } break;
      case 'showmanceHoneymoon':  if (ps?.[0]) { add(ps[0], 'drama', 1, evt.type); add(ps[0], 'like', 1, evt.type); } break;
      case 'showmanceTarget':     if (ps?.[0]) add(ps[0], 'drama', 2, evt.type); break;
      case 'showmanceJealousy':   if (ps?.[0]) { add(ps[0], 'drama', 3, evt.type); add(ps[0], 'like', -1, evt.type); } break;
      case 'showmanceRideOrDie':  if (ps?.[0]) { add(ps[0], 'drama', 2, evt.type); add(ps[0], 'like', 2, evt.type); } break;
      case 'showmanceRekindle':  if (ps?.[0]) { add(ps[0], 'drama', 3, evt.type); add(ps[0], 'like', 2, evt.type); } break;
      // Love triangle — drama + likability penalties for center (cheater), sympathy for rejected
      case 'triangleTension':    if (ps?.[0]) add(ps[0], 'drama', 2, evt.type); break;
      case 'triangleConfrontation': if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'triangleEscalation': if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'trianglePublicFight':if (ps) { ps.forEach(n => add(n, 'drama', 3, evt.type)); } break;
      case 'triangleUltimatum':  if (ps) { ps.forEach(n => add(n, 'drama', 4, evt.type)); } break;
      case 'triangleResolved':   if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      // Affair events
      case 'affairSecret':     if (ps?.[0]) add(ps[0], 'drama', 1, evt.type); break;
      case 'affairRumor':      if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'affairCaught':     if (ps) { ps.forEach(n => add(n, 'drama', 3, evt.type)); } break;
      case 'affairSilent':     if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'affairExposed':    if (ps) { ps.forEach(n => add(n, 'drama', 4, evt.type)); } break;
      case 'affairChoice':     if (ps) { ps.forEach(n => add(n, 'drama', 3, evt.type)); } break;
      case 'bigMoveThoughts':     if (p)       add(p, 'drama', 2, evt.type); break;
      case 'allianceCrack':       if (ps?.[0]) add(ps[0], 'drama', 2, evt.type); break;
      case 'confessional':        if (p)       add(p, 'drama', 1, evt.type); break;
      case 'tdStrategy':          if (p)       add(p, 'drama', 1, evt.type); break;
      case 'schemerManipulates':  if (p)       add(p, 'drama', 1, evt.type); break;
      // Positive Likability
      case 'socialBoost':         if (p)       add(p, 'like', 2, evt.type); break;
      case 'comfort':             if (ps?.[0]) add(ps[0], 'like', 1, evt.type); break;
      case 'tdBond':              if (ps?.[0]) add(ps[0], 'like', 1, evt.type); break;
      case 'underdogMoment':      if (p)       { add(p, 'like', 2, evt.type); add(p, 'under', 1, evt.type); } break;
      case 'hardWork':            if (p)       add(p, 'like', 1, evt.type); break;
      case 'soldierCheckin':      if (p)       add(p, 'like', 1, evt.type); break;
      case 'unexpectedCompetence':if (p)       { add(p, 'like', 1, evt.type); add(p, 'under', 1, evt.type); } break;
      // Negative Drama
      case 'floaterInvisible':    if (p)       add(p, 'drama', -2, evt.type); break;
      case 'overplay':            if (p)       add(p, 'drama', -1, evt.type); break;
      // Negative Likability
      case 'showboat':            if (p)       add(p, 'like', -2, evt.type); break;
      case 'overconfidence':      if (p)       add(p, 'like', -1, evt.type); break;
      case 'foodConflict':        if (p)       add(p, 'like', -2, evt.type); break;
      case 'loneWolf':            if (p)       add(p, 'like', -1, evt.type); break;
    }
  });

  // ── bigMoveThoughts AND voted correctly → +2 drama ──
  allEvents.filter(e => e.type === 'bigMoveThoughts' && e.player).forEach(e => {
    if (ep.votingLog?.some(l => l.voter === e.player && l.voted === ep.eliminated)) {
      add(e.player, 'drama', 2, 'bigMoveVoted');
    }
  });

  // ── Social bomb backlash: -1 like to the bomber ──
  (ep.socialBombs || []).forEach(sb => {
    add(sb.player, 'like', -1, 'socialBomb');
  });

  // ── Showmance betrayal: voted out your own partner → likability crash ──
  if (ep.showmanceBreakup?.voter) {
    add(ep.showmanceBreakup.voter, 'like', -3, 'showmanceBetrayal');
    add(ep.showmanceBreakup.voter, 'drama', 3, 'showmanceBetrayal');
  }
  // Showmance separation (didn't vote them): sympathy for survivor
  if (ep.showmanceSeparation?.survivor) {
    add(ep.showmanceSeparation.survivor, 'like', 1, 'showmanceSeparation');
    add(ep.showmanceSeparation.survivor, 'under', 2, 'showmanceSeparation');
  }
  // ── Love triangle resolution: center penalized, rejected gets sympathy ──
  if (ep.triangleResolution) {
    const _tr = ep.triangleResolution;
    add(_tr.center, 'like', -2, 'triangleCheater');       // led two people on
    add(_tr.rejected, 'like', 2, 'triangleRejected');     // sympathy vote
    add(_tr.rejected, 'under', 3, 'triangleRejected');    // underdog boost
  }
  // Affair exposure popularity
  if (ep.affairExposure) {
    const _af = ep.affairExposure;
    add(_af.cheater, 'like', -4, 'affairCheater');
    add(_af.partner, 'like', 3, 'affairBetrayed');
    add(_af.partner, 'under', 3, 'affairBetrayed');
    if (_af.staysWithPartner) {
      add(_af.cheater, 'like', -2, 'affairStayed');
      add(_af.partner, 'like', 1, 'affairPartnerTookBack');
    } else {
      add(_af.cheater, 'like', -3, 'affairLeft');
      add(_af.cheater, 'drama', 4, 'affairLeft');
      add(_af.partner, 'like', 2, 'affairAbandoned');
      add(_af.partner, 'under', 4, 'affairAbandoned');
    }
    if (_af.complicit) {
      add(_af.secretPartner, 'like', -2, 'affairComplicit');
      add(_af.secretPartner, 'drama', 2, 'affairComplicit');
    } else {
      add(_af.secretPartner, 'like', 1, 'affairDidntKnow');
      add(_af.secretPartner, 'under', 1, 'affairDidntKnow');
    }
  }

  // ── Tribal blowup: +3 drama to the player who caused it ──
  if (ep.tribalBlowup?.player) {
    add(ep.tribalBlowup.player, 'drama', 3, 'tribalBlowup');
  }

  // ── Idol plays: +2 drama to the player who played, +4 for Super Idol ──
  (ep.idolPlays || []).forEach(play => {
    if (play.superIdol && play.player) { add(play.player, 'drama', 4, 'superIdolPlay'); return; }
    if (play.player) add(play.player, 'drama', 2, 'idolPlay');
  });

  // ── Survived idol play against them: +3 underdog ──
  (ep.idolPlays || []).forEach(play => {
    if (play.playedFor && play.votesNegated > 0 && play.playedFor !== ep.eliminated) {
      add(play.playedFor, 'under', 3, 'survivedIdolPlay');
    }
  });

  // ── Survived being top vote-getter (most votes, not eliminated): +4 underdog ──
  if (ep.votes && ep.eliminated) {
    const sortedV = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    const [topName, topCount] = sortedV[0] || [];
    if (topName && topName !== ep.eliminated && topCount >= 2) {
      add(topName, 'under', 4, 'survivedTopVotes');
    }
  }

  // ── Came back from bottom (was top-target last ep, safe this ep): +3 underdog ──
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  if (prevEp) {
    const prevTopTarget = (prevEp.alliances || [])
      .filter(a => a.target && a.type !== 'solo' && a.members?.length >= 2)
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))[0]?.target;
    if (prevTopTarget && gs.activePlayers.includes(prevTopTarget) && prevTopTarget !== ep.eliminated) {
      add(prevTopTarget, 'under', 3, 'cameBackFromBottom');
    }
  }

  // ── Voted out with unplayed idol: +2 drama, +1 underdog ──
  if (ep.eliminated && prevEp) {
    const hadIdol = (prevEp.gsSnapshot?.advantages || [])
      .some(a => a.holder === ep.eliminated && a.type === 'idol');
    if (hadIdol) {
      add(ep.eliminated, 'drama', 2, 'eliminatedWithIdol');
      add(ep.eliminated, 'under', 1, 'eliminatedWithIdol');
    }
  }

  // ── Tiebreaker win: +2 underdog ──
  if (ep.tiebreakerResult?.winner)  add(ep.tiebreakerResult.winner,  'under', 2, 'tiebreakerWin');
  if (ep.tiebreakerResult1?.winner) add(ep.tiebreakerResult1.winner, 'under', 2, 'tiebreakerWin');

  // ── Has camp events but all atmospheric: -2 drama (boring presence) ──
  // ── No camp events at all: no drama penalty (they'd net 0 anyway, floor handles it) ──
  const atmoTypes = new Set(['weirdMoment', 'tribeMood', 'homesick', 'doubt']);
  const activePop = gs.activePlayers || [];
  activePop.forEach(name => {
    const playerEvts = epEventsByPlayer[name] || [];
    if (playerEvts.length > 0 && playerEvts.every(t => atmoTypes.has(t))) {
      add(name, 'drama', -2, 'boringEpisode');
    }
  });

  // ── Tribal invisible: only penalise players who ALSO had zero player-tagged camp events ──
  // (fires for most of the tribe otherwise and wipes out all positive gains)
  if (ep.tribalPlayers?.length && ep.votes && ep.eliminated) {
    ep.tribalPlayers.forEach(name => {
      if (name !== ep.eliminated && !(ep.votes[name] > 0)) {
        const hadTaggedEvents = (epEventsByPlayer[name] || []).length > 0;
        if (!hadTaggedEvents) add(name, 'drama', -1, 'tribalInvisible');
      }
    });
  }

  // ── Voted out a player with popularity >= 10: -2 like to each voter ──
  if (ep.eliminated && (gs.popularity[ep.eliminated] || 0) >= 10) {
    (ep.votingLog || [])
      .filter(l => l.voted === ep.eliminated)
      .forEach(l => add(l.voter, 'like', -2, 'votedOutPopular'));
  }

  // ── Was #1 vote-getter 3+ straight tribals without elimination (bully): -2 like ──
  if (ep.votes) {
    const vSorted = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    const topGetter = vSorted[0]?.[0];
    if (topGetter) {
      if (topGetter === ep.eliminated) {
        gs.topVoteStreak[topGetter] = 0;
      } else {
        gs.topVoteStreak[topGetter] = (gs.topVoteStreak[topGetter] || 0) + 1;
        if (gs.topVoteStreak[topGetter] >= 3) add(topGetter, 'like', -2, 'bullyPerception');
      }
      Object.keys(gs.topVoteStreak).forEach(n => { if (n !== topGetter) gs.topVoteStreak[n] = 0; });
    }
  }

  // ── Dominant alliance 3+ consecutive controlled votes: -2 underdog ──
  if (ep.eliminated) {
    const controlAlliance = (ep.alliances || [])
      .filter(a => a.target === ep.eliminated && a.type !== 'solo' && a.members?.length >= 2)
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))[0];
    const controlNaName = controlAlliance
      ? (gs.namedAlliances || []).find(na => na.active &&
          controlAlliance.members.every(m => na.members.includes(m)))?.name || null
      : null;

    if (controlNaName && controlNaName === gs.dominantAllianceStreak.id) {
      gs.dominantAllianceStreak.count++;
    } else {
      gs.dominantAllianceStreak = { id: controlNaName || null, count: controlNaName ? 1 : 0 };
    }
    if (gs.dominantAllianceStreak.count >= 3 && controlAlliance) {
      controlAlliance.members.forEach(m => {
        if (gs.activePlayers.includes(m)) add(m, 'under', -2, 'dominantAlliance');
      });
    }
  }

  // ── Won immunity but never threatened that episode: -1 underdog ──
  if (ep.immunityWinner && ep.challengeType === 'individual') {
    const wasTargeted = (ep.alliances || []).some(a => a.target === ep.immunityWinner);
    if (!wasTargeted) add(ep.immunityWinner, 'under', -1, 'immunityUnthreatened');
  }

  // ── Apply all deltas to gs.popularity ──
  Object.entries(epDeltas).forEach(([name, deltas]) => {
    if (!gs.popularity[name]) gs.popularity[name] = 0;
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    gs.popularity[name] = (gs.popularity[name] || 0) + total;
  });

  // ── Save arc data for VP (episode-by-episode history) ──
  Object.entries(epDeltas).forEach(([name, deltas]) => {
    if (!gs.popularityArcs[name]) gs.popularityArcs[name] = [];
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    if (total !== 0) gs.popularityArcs[name].push({ ep: ep.num, delta: total, score: gs.popularity[name] || 0 });
  });

  // ── Save to current episode history record ──
  const lastRec = gs.episodeHistory[gs.episodeHistory.length - 1];
  if (lastRec) {
    lastRec.popularityDeltas = epDeltas;
    lastRec.popularitySnapshot = { ...gs.popularity };
  }
}

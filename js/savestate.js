// js/savestate.js — Game state persistence: save, snapshot, init, reset
import { gs, gsCheckpoints, players, seasonConfig, relationships, preGameAlliances,
         prepGsForSave, repairGsSets, setGs, setGsCheckpoints, setViewingEpNum } from './core.js';
import { pStats, pronouns } from './players.js';
import { bKey } from './bonds.js';
import { checkShowmanceBreakup, checkLoveTriangleBreakup } from './romance.js';
import { generateAftermathShow } from './aftermath.js';
import { _checkMoleExposure } from './camp-events.js';

export function saveGameState() {
  prepGsForSave(gs);
  try {
    localStorage.setItem('simulator_gs', JSON.stringify(gs));
  } catch (e) {
    // localStorage full — prune old checkpoints and retry
    console.warn('localStorage quota exceeded — pruning checkpoints...');
    const cpKeys = Object.keys(localStorage).filter(k => k.startsWith('simulator_cp_')).sort();
    // Remove oldest half of checkpoints
    const removeCount = Math.max(1, Math.ceil(cpKeys.length / 2));
    cpKeys.slice(0, removeCount).forEach(k => { localStorage.removeItem(k); delete gsCheckpoints[parseInt(k.replace('simulator_cp_', ''))]; });
    try { localStorage.setItem('simulator_gs', JSON.stringify(gs)); }
    catch (e2) { console.error('Still over quota after pruning. Season data may be too large.', e2); }
  }
  repairGsSets(gs);
}

// Patch commonly-missing fields onto the last episode history entry.
// Called after every gs.episodeHistory.push() to ensure VP screens have the data they need.
export function patchEpisodeHistory(ep) {
  const h = gs.episodeHistory[gs.episodeHistory.length - 1];
  if (!h) return;
  // Challenge data
  if (!h.chalPlacements && ep.chalPlacements) h.chalPlacements = ep.chalPlacements;
  if (!h.challengeLabel && ep.challengeLabel) h.challengeLabel = ep.challengeLabel;
  if (!h.challengeCategory && ep.challengeCategory) h.challengeCategory = ep.challengeCategory;
  if (!h.challengeDesc && ep.challengeDesc) h.challengeDesc = ep.challengeDesc;
  if (!h.challengePlacements && ep.challengePlacements) h.challengePlacements = ep.challengePlacements;
  if (!h.chalMemberScores && ep.chalMemberScores) h.chalMemberScores = ep.chalMemberScores;
  if (!h.chalSitOuts && ep.chalSitOuts) h.chalSitOuts = ep.chalSitOuts;
  // Camp events
  if (!h.campEvents && ep.campEvents) h.campEvents = ep.campEvents;
  if (!h.tipOffCampEvents && ep.tipOffCampEvents) h.tipOffCampEvents = ep.tipOffCampEvents;
  // Tribal data
  if (!h.tribalPlayers && ep.tribalPlayers) h.tribalPlayers = [...ep.tribalPlayers];
  if (!h.votingLog && ep.votingLog) h.votingLog = ep.votingLog;
  // Advantages
  if (!h.advantagesPreTribal && ep.advantagesPreTribal) h.advantagesPreTribal = ep.advantagesPreTribal;
  if (!h.idolShares && ep.idolShares?.length) h.idolShares = ep.idolShares;
  if (!h.kipSteal && ep.kipSteal) h.kipSteal = ep.kipSteal;
  if (!h.superIdolPlayed && ep.superIdolPlayed) h.superIdolPlayed = ep.superIdolPlayed;
  if (!h.votesBeforeSuperIdol && ep.votesBeforeSuperIdol) h.votesBeforeSuperIdol = ep.votesBeforeSuperIdol;
  if (!h.spiritIslandEvents && ep.spiritIslandEvents) h.spiritIslandEvents = ep.spiritIslandEvents;
  // Misc
  if (!h.comfortBlindspotPlayer && ep.comfortBlindspotPlayer) h.comfortBlindspotPlayer = ep.comfortBlindspotPlayer;
  if (!h._pbTriggerLog && ep._pbTriggerLog?.length) h._pbTriggerLog = ep._pbTriggerLog;
  if (!h._politicsLog && ep._politicsLog?.length) h._politicsLog = ep._politicsLog;
  if (!h.votePitches && ep.votePitches) h.votePitches = ep.votePitches;
  if (!h._debugScramble && ep._debugScramble) h._debugScramble = ep._debugScramble;
  if (!h.challengeThrows && ep.challengeThrows?.length) h.challengeThrows = ep.challengeThrows;
  if (!h.bewareLostVotes && ep.bewareLostVotes) h.bewareLostVotes = ep.bewareLostVotes;
  if (!h.journey && ep.journey) h.journey = ep.journey;
  if (!h.extraImmune && ep.extraImmune) h.extraImmune = ep.extraImmune;
  // Winner/loser tribe
  if (!h.winner && ep.winner) h.winner = { name: ep.winner.name, members: [...(ep.winner.members||[])] };
  if (!h.loser && ep.loser) h.loser = { name: ep.loser.name, members: [...(ep.loser.members||[])] };
  // Tribes at start
  if (!h.tribesAtStart && ep.tribesAtStart) h.tribesAtStart = ep.tribesAtStart.map(t => ({ name: t.name, members: [...t.members] }));
  if (!h.dockArrivals && ep.dockArrivals) h.dockArrivals = ep.dockArrivals;
  // Save tie/revote state so VP can detect ties for display
  if (ep.isTie !== undefined && !h.isTie) h.isTie = ep.isTie;
  if (ep.tiedPlayers?.length && !h.tiedPlayers) h.tiedPlayers = [...ep.tiedPlayers];
  if (ep.revoteVotes && !h.revoteVotes) h.revoteVotes = ep.revoteVotes;
  if (ep.revoteLog?.length && !h.revoteLog) h.revoteLog = ep.revoteLog;
  if (ep.isRockDraw && !h.isRockDraw) h.isRockDraw = ep.isRockDraw;
  // Clear journey lost votes for players who attended this tribal — vote loss is consumed
  if (ep.tribalPlayers?.length && gs.journeyLostVotes?.length) {
    gs.journeyLostVotes = gs.journeyLostVotes.filter(p => !ep.tribalPlayers.includes(p));
  }
  // Refresh alliance data in snapshot — decayAllianceTrust runs AFTER the initial snapshot,
  // so dissolutions aren't captured. Update the snapshot so Camp Overview can show them.
  if (h.gsSnapshot) {
    h.gsSnapshot.namedAlliances = (gs.namedAlliances || []).filter(a => a.active).map(a => ({
      name: a.name, formed: a.formed, members: [...a.members],
      betrayals: a.betrayals ? [...a.betrayals] : [], quits: a.quits ? [...a.quits] : [], active: true,
    }));
    h.gsSnapshot.dissolvedAlliances = (gs.namedAlliances || []).filter(a => !a.active).map(a => ({
      name: a.name, formed: a.formed, members: [...a.members],
      betrayals: a.betrayals ? [...a.betrayals] : [], active: false,
    }));
  }
  // Showmance lifecycle
  if (!h.showmanceBreakup && !h.showmanceSeparation) checkShowmanceBreakup(ep);
  checkLoveTriangleBreakup(ep);
  if (ep.paranoiaSpirals?.length) h.paranoiaSpirals = ep.paranoiaSpirals;
  if (ep.stolenCreditEvents?.length) h.stolenCreditEvents = ep.stolenCreditEvents;
  h.ambassadorData = ep.ambassadorData || null;
  if (ep.alliancesPreTribal) h.alliancesPreTribal = ep.alliancesPreTribal;
  h.blackVote = ep.blackVote || null;
  if (ep.tiedDestinies) h.tiedDestinies = ep.tiedDestinies;
  if (ep.tripleDogDare) h.tripleDogDare = ep.tripleDogDare;
  if (ep.sayUncle) h.sayUncle = ep.sayUncle;
  if (ep.isSayUncle) h.isSayUncle = true;
  if (ep.isLuckyHunt) { h.isLuckyHunt = true; if (ep.luckyHunt) h.luckyHunt = ep.luckyHunt; }
  if (ep.isBrunchOfDisgustingness) { h.isBrunchOfDisgustingness = true; if (ep.brunch) h.brunch = ep.brunch; if (ep.brunchTeams) h.brunchTeams = ep.brunchTeams; }
  if (ep.phobiaFactor) h.phobiaFactor = ep.phobiaFactor;
  if (ep.isPhobiaFactor) h.isPhobiaFactor = true;
  if (ep.isCliffDive) h.isCliffDive = true;
  if (!h.cliffDive && ep.cliffDive) h.cliffDive = ep.cliffDive;
  if (ep.isAwakeAThon) h.isAwakeAThon = true;
  if (!h.awakeAThon && ep.awakeAThon) h.awakeAThon = ep.awakeAThon;
  if (ep.isDodgebrawl) h.isDodgebrawl = true;
  if (!h.dodgebrawl && ep.dodgebrawl) h.dodgebrawl = ep.dodgebrawl;
  if (ep.isTalentShow) h.isTalentShow = true;
  if (!h.talentShow && ep.talentShow) h.talentShow = ep.talentShow;
  if (ep.isSuckyOutdoors) h.isSuckyOutdoors = true;
  if (!h.suckyOutdoors && ep.suckyOutdoors) h.suckyOutdoors = ep.suckyOutdoors;
  if (ep.isUpTheCreek) h.isUpTheCreek = true;
  if (!h.upTheCreek && ep.upTheCreek) h.upTheCreek = ep.upTheCreek;
  if (ep.isPaintballHunt) h.isPaintballHunt = true;
  if (!h.paintballHunt && ep.paintballHunt) h.paintballHunt = ep.paintballHunt;
  if (ep.isHellsKitchen) h.isHellsKitchen = true;
  if (!h.hellsKitchen && ep.hellsKitchen) h.hellsKitchen = ep.hellsKitchen;
  if (ep.isTrustChallenge) h.isTrustChallenge = true;
  if (!h.trustChallenge && ep.trustChallenge) h.trustChallenge = ep.trustChallenge;
  if (ep.isBasicStraining) h.isBasicStraining = true;
  if (!h.basicStraining && ep.basicStraining) h.basicStraining = ep.basicStraining;
  if (ep.isXtremeTorture) h.isXtremeTorture = true;
  if (!h.xtremeTorture && ep.xtremeTorture) h.xtremeTorture = ep.xtremeTorture;
  if (!h.tribeDissolutions && ep.tribeDissolutions) h.tribeDissolutions = ep.tribeDissolutions;
  if (ep.isTripleDogDare) h.isTripleDogDare = true;
  if (ep.isHideAndBeSneaky) h.isHideAndBeSneaky = true;
  if (!h.hideAndBeSneaky && ep.hideAndBeSneaky) h.hideAndBeSneaky = ep.hideAndBeSneaky;
  if (ep.isOffTheChain) h.isOffTheChain = true;
  if (!h.bikeRace && ep.bikeRace) h.bikeRace = ep.bikeRace;
  if (ep.isWawanakwaGoneWild) h.isWawanakwaGoneWild = true;
  if (!h.wawanakwaGoneWild && ep.wawanakwaGoneWild) h.wawanakwaGoneWild = ep.wawanakwaGoneWild;
  if (ep.exileDuelPlayerAtStart) h.exileDuelPlayerAtStart = ep.exileDuelPlayerAtStart;
  if (ep.volunteerDuel) h.volunteerDuel = ep.volunteerDuel;
  if (ep.fanVoteReturnee) h.fanVoteReturnee = ep.fanVoteReturnee;
  if (ep.volunteerDuelReturn) h.volunteerDuelReturn = ep.volunteerDuelReturn;
  if (ep.schoolyardPick) h.schoolyardPick = ep.schoolyardPick;
  if (ep.schoolyardExileReturn) h.schoolyardExileReturn = ep.schoolyardExileReturn;
  if (ep.isEmissaryVote) h.isEmissaryVote = true;
  if (ep.emissary) h.emissary = ep.emissary;
  if (ep.emissaryPick) h.emissaryPick = ep.emissaryPick;
  if (ep.emissaryEliminated) h.emissaryEliminated = ep.emissaryEliminated;
  if (ep.emissaryScoutEvents) h.emissaryScoutEvents = ep.emissaryScoutEvents;
  if (ep.emissaryBondShifts) h.emissaryBondShifts = ep.emissaryBondShifts;
  if (ep.emissaryDissolve) h.emissaryDissolve = ep.emissaryDissolve;
  h.blackVote1 = ep.blackVote1 || null;
  h.blackVote2 = ep.blackVote2 || null;
  h.blackVoteApplied = ep.blackVoteApplied || null;
  h.fakeIdolEvents = ep.fakeIdolEvents || null;
  h.survivalSnapshot = ep.survivalSnapshot || null;
  h.tribeFoodSnapshot = ep.tribeFoodSnapshot || null;
  h.providerSlackerData = ep.providerSlackerData || null;
  h.medevac = ep.medevac || null;
  if (ep.splitVotePlans?.length) h.splitVotePlans = ep.splitVotePlans;
  if (ep.voteMiscommunications?.length) h.voteMiscommunications = ep.voteMiscommunications;
  if (ep.brokerEvents?.length) h.brokerEvents = ep.brokerEvents;
  if (ep.brokerExposure) h.brokerExposure = ep.brokerExposure;
  if (ep.showmanceBreakup) h.showmanceBreakup = ep.showmanceBreakup;
  if (ep.showmanceSeparation) h.showmanceSeparation = ep.showmanceSeparation;
  if (ep.showmanceEvents?.length) h.showmanceEvents = ep.showmanceEvents;
  if (ep.showmanceTests?.length) h.showmanceTests = ep.showmanceTests;
  // Love triangle
  if (ep.triangleEvents?.length) h.triangleEvents = ep.triangleEvents;
  if (ep.triangleResolution) h.triangleResolution = ep.triangleResolution;
  // Secret affairs
  if (ep.affairEvents?.length) h.affairEvents = ep.affairEvents;
  if (ep.affairExposure) h.affairExposure = ep.affairExposure;
  // Resolve affairs on elimination
  if (gs.affairs?.length && ep.eliminated) {
    const _afElim = ep.eliminated;
    gs.affairs.forEach(af => {
      if (af.resolved) return;
      if (af.cheater !== _afElim && af.partner !== _afElim && af.secretPartner !== _afElim) return;
      af.resolved = true;
      af.resolution = { type: 'eliminated', who: _afElim, ep: (gs.episode || 0) + 1 };
    });
  }
  // Clean expired triangle rejection heat
  if (gs._triangleRejectionHeat) {
    const _curEp = (gs.episode || 0) + 1;
    for (const _trn of Object.keys(gs._triangleRejectionHeat)) {
      if (_curEp > gs._triangleRejectionHeat[_trn].expiresEp) delete gs._triangleRejectionHeat[_trn];
    }
  }
  if (ep.safetyNoPowerPlayed) h.safetyNoPowerPlayed = ep.safetyNoPowerPlayed;
  if (ep.soleVotePlayed) h.soleVotePlayed = ep.soleVotePlayed;
  if (ep.exileFormatData) h.exileFormatData = ep.exileFormatData;
  if (ep.juryRoundtable) h.juryRoundtable = ep.juryRoundtable;
  // Reward sharing: ensure it lands on rewardChalData even if the push path didn't build it
  if (ep.rewardShareInvite && h.rewardChalData) h.rewardChalData.rewardShareInvite = ep.rewardShareInvite;
  if (ep.rewardShareInvite && !h.rewardChalData) {
    // Build minimal rewardChalData from twist if the push path skipped it
    const _rct = (ep.twists||[]).find(t => t.type === 'reward-challenge');
    if (_rct) h.rewardChalData = { winner: _rct.rewardWinner, winnerType: _rct.rewardWinnerType || 'individual', placements: _rct.rewardChalPlacements || [], label: _rct.rewardChalLabel || 'Reward Challenge', category: _rct.rewardChalCategory || 'mixed', desc: _rct.rewardChalDesc || '', rewardItemId: _rct.rewardItemId || null, rewardItemLabel: _rct.rewardItemLabel || null, rewardItemDesc: _rct.rewardItemDesc || null, rewardShareInvite: ep.rewardShareInvite };
  }
  // ── The Mole: challenge throw events + vote disruption events + suspicion (all deferred to here because ep/challenge happen after checkMoleSabotage) ──
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Challenge sabotage camp events + suspicion (self-throw and target sabotage)
  if (gs._moleChalThrows?.length && ep.campEvents && gs.moles?.length) {
    gs._moleChalThrows.forEach(thr => {
      const mole = gs.moles.find(m => m.player === thr.player);
      if (!mole) return;
      const mp = pronouns(thr.player);
      const _campKey = thr.tribe || (gs.isMerged ? (gs.mergeName || 'merge') : Object.keys(ep.campEvents)[0]);

      if (thr.mode === 'target' && thr.target) {
        // Target sabotage: Mole made someone else look bad
        const tp = pronouns(thr.target);
        const _targetTexts = [
          `${thr.target} struggled in the challenge — fumbling at a key moment. What nobody saw was ${thr.player} nudging things just enough to make it happen.`,
          `The challenge came down to execution, and ${thr.target} faltered. It looked like nerves. It wasn't. ${thr.player} made sure ${tp.sub} ${tp.sub === 'they' ? 'were' : 'was'} set up to fail.`,
          `${thr.player} was positioned right next to ${thr.target} during the challenge. A small bump, a shifted piece — nothing anyone could prove. ${thr.target} took the blame.`,
          `${thr.target}'s challenge performance was surprisingly poor. The tribe side-eyes ${tp.obj}. ${thr.player} offers sympathetic words and hides a smile.`,
          `${thr.player} "helped" ${thr.target} during the challenge in a way that actually made things harder. Nobody caught it. ${thr.target} just looked bad.`,
        ];
        if (_campKey && ep.campEvents) {
          // Ensure camp events structure exists for this tribe
          if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
          const _cd = ep.campEvents[_campKey];
          if (typeof _cd === 'object' && !Array.isArray(_cd) && !_cd.post) _cd.post = [];
          const evts = (typeof _cd === 'object' && !Array.isArray(_cd)) ? (_cd.post || _cd.pre) : (Array.isArray(_cd) ? _cd : []);
          evts.push({
            type: 'moleChallengeThrow', text: _pick(_targetTexts),
            players: [thr.player, thr.target], badgeText: 'MOLE'
          });
        }
        // Suspicion scales inversely with blame-ability (Dawn/Scott dynamic)
        // If the target is already weak (low physical), blame sticks → low suspicion on Mole
        // If the target is strong (high physical), their failure is suspicious → more suspicion on Mole
        const _targetStats = pStats(thr.target);
        const _blameFactor = Math.max(0.1, _targetStats.physical / 10); // physical 3 → 0.3 (easy blame), physical 9 → 0.9 (hard blame)
        // Also factor in penalty size — big drops from good players look more suspicious
        const _penaltyFactor = Math.min(1.0, thr.penalty / 3.5); // penalty 1.5 → 0.43, penalty 3.5 → 1.0
        const _suspMultiplier = _blameFactor * _penaltyFactor; // low when blame sticks, high when it doesn't
        const _tribe = gs.tribes?.find(t => t.name === thr.tribe);
        const _tribeMembers = _tribe ? _tribe.members.filter(p => p !== thr.player) : gs.activePlayers.filter(p => p !== thr.player);
        // How many times has this target been sabotaged by this Mole? Cumulative pattern recognition
        const _timesSabotaged = mole.sabotageLog.filter(s => s.type === 'challengeSabotage' && s.target === thr.target).length;
        _tribeMembers.forEach(w => {
          if (!gs.activePlayers.includes(w)) return;
          const suspGain = (pStats(w).intuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance) * _suspMultiplier;
          if (Math.random() < suspGain) {
            if (!mole.suspicion[w]) mole.suspicion[w] = 0;
            mole.suspicion[w] += 0.25 + _suspMultiplier * 0.3 + mole.sabotageCount * 0.02;
          }
        });
        // The TARGET gets extra suspicion — they notice the pattern of choking near the Mole
        if (gs.activePlayers.includes(thr.target)) {
          const _targetIntuition = pStats(thr.target).intuition;
          // Base chance + cumulative bonus (3rd time sabotaged = much higher chance of noticing)
          const _targetSuspChance = (_targetIntuition * 0.05 + pStats(thr.target).mental * 0.018) * (1.1 - mole.resistance) + _timesSabotaged * 0.12;
          if (Math.random() < _targetSuspChance) {
            if (!mole.suspicion[thr.target]) mole.suspicion[thr.target] = 0;
            mole.suspicion[thr.target] += 0.3 + _timesSabotaged * 0.2; // escalates: 0.5 first time, 0.7 second, 0.9 third
          }
        }
      } else {
        // Self-throw: Mole looked weak
        const _throwTexts = [
          `${thr.player} looked off during the challenge. Sluggish, unfocused — not the performance anyone expected. "Just didn't have it today," ${mp.sub} ${mp.sub === 'they' ? 'say' : 'says'} with a shrug.`,
          `${thr.player} fumbles at a critical moment. It looks accidental. It isn't.`,
          `The tribe loses, and ${thr.player}'s contribution was noticeably weak. Nobody says anything — but a few are thinking it.`,
          `${thr.player} sandbagged the challenge. Dropped a puzzle piece, stumbled on the obstacle. Subtle enough to pass as a bad day. Deliberate enough to cost the tribe the win.`,
          `${thr.player} pulls back just enough to hurt the tribe's score without making it obvious. The loss feels close — and that's by design.`,
        ];
        if (_campKey && ep.campEvents) {
          if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
          const _cd2 = ep.campEvents[_campKey];
          if (typeof _cd2 === 'object' && !Array.isArray(_cd2) && !_cd2.post) _cd2.post = [];
          const evts = (typeof _cd2 === 'object' && !Array.isArray(_cd2)) ? (_cd2.post || _cd2.pre) : (Array.isArray(_cd2) ? _cd2 : []);
          evts.push({
            type: 'moleChallengeThrow', text: _pick(_throwTexts),
            players: [thr.player], badgeText: 'MOLE'
          });
        }
        // Full suspicion — self-throw is more visible
        const _tribe = gs.tribes?.find(t => t.name === thr.tribe);
        const _tribeMembers = _tribe ? _tribe.members.filter(p => p !== thr.player) : gs.activePlayers.filter(p => p !== thr.player);
        _tribeMembers.forEach(w => {
          if (!gs.activePlayers.includes(w)) return;
          const suspGain = (pStats(w).intuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance);
          if (Math.random() < suspGain) {
            if (!mole.suspicion[w]) mole.suspicion[w] = 0;
            mole.suspicion[w] += 0.5 + mole.sabotageCount * 0.03; // self-throw most visible
          }
        });
      }
    });
    // Exposure check after challenge suspicion gains
    gs.moles.forEach(mole => {
      if (mole.exposed) return;
      const _tribeKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members?.includes(mole.player))?.name || Object.keys(ep.campEvents || {})[0]);
      if (_tribeKey) _checkMoleExposure(mole, ep, _tribeKey);
    });
    delete gs._moleChalThrows;
  }

  // Vote disruption — save data for VP votes screen rendering (not camp events — these happen AT tribal)
  if (gs._moleVoteDisruptionEvents?.length || gs._moleCorruptedPitches?.length) {
    if (!h.moleVoteDisruptions) h.moleVoteDisruptions = [];
    (gs._moleVoteDisruptionEvents || []).forEach(vd => {
      h.moleVoteDisruptions.push({ ...vd, type: 'rogue' });
    });
    (gs._moleCorruptedPitches || []).forEach(cp => {
      h.moleVoteDisruptions.push({ ...cp, type: 'pitch' });
    });
    delete gs._moleCorruptedPitches;
    // Suspicion from vote disruption — process each rogue vote
    (gs._moleVoteDisruptionEvents || []).forEach(vd => {
      const mole = gs.moles?.find(m => m.player === vd.voter);
      if (mole) {
        const _allAlliances = gs.namedAlliances || [];
        const _voterAlliances = _allAlliances.filter(a => a.active && a.members.includes(vd.voter));
        _voterAlliances.forEach(al => {
          al.members.filter(m => m !== vd.voter && gs.activePlayers.includes(m)).forEach(m => {
            const suspGain = (pStats(m).intuition * 0.04 + pStats(m).mental * 0.015) * (1.1 - mole.resistance);
            if (Math.random() < suspGain) {
              if (!mole.suspicion[m]) mole.suspicion[m] = 0;
              mole.suspicion[m] += 0.6 + mole.sabotageCount * 0.03;
            }
          });
        });
        (ep.tribalPlayers || gs.activePlayers).filter(p => p !== vd.voter).forEach(p => {
          if (!gs.activePlayers.includes(p)) return;
          const suspGain = (pStats(p).intuition * 0.04 + pStats(p).mental * 0.015) * (1.1 - mole.resistance) * 0.3;
          if (Math.random() < suspGain) {
            if (!mole.suspicion[p]) mole.suspicion[p] = 0;
            mole.suspicion[p] += 0.4 + mole.sabotageCount * 0.02;
          }
        });
      }
    });
    // Exposure check after vote disruption suspicion gains
    if (gs.moles?.length) {
      gs.moles.forEach(mole => {
        if (mole.exposed) return;
        const _tribeKey2 = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members?.includes(mole.player))?.name || Object.keys(ep.campEvents || {})[0]);
        if (_tribeKey2) _checkMoleExposure(mole, ep, _tribeKey2);
      });
    }
    delete gs._moleVoteDisruptionEvents;
  }
  // ── Universal Mole exposure check — catches any suspicion source that pushed past 3.0 ──
  // Removed ep.campEvents requirement — exposure can fire even without camp events
  if (gs.moles?.length) {
    gs.moles.forEach(mole => {
      if (mole.exposed) return;
      if (!gs.activePlayers.includes(mole.player)) return;
      const _tribeKeyFinal = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members?.includes(mole.player))?.name
        || (ep.campEvents ? Object.keys(ep.campEvents)[0] : 'merge');
      _checkMoleExposure(mole, ep, _tribeKeyFinal || 'merge');
    });
  }
  if (gs.moles?.length) {
    if (h.gsSnapshot) h.gsSnapshot.moles = gs.moles.map(m => ({ ...m, suspicion: { ...m.suspicion }, sabotageLog: [...m.sabotageLog], leaks: [...m.leaks] }));
    // Save Mole exposure data to episode history
    if (gs._moleExposureEvents?.length) {
      h.moleExposure = gs._moleExposureEvents.map(e => ({ ...e }));
      ep.moleExposure = h.moleExposure; // also set on ep for VP screen builder
      delete gs._moleExposureEvents;
    }
    // Save Mole reveal data to episode history — VP renders it in rpBuildVotes after torch snuff
    const _elimThisEp = h.eliminated || ep.eliminated;
    if (_elimThisEp) {
      const _elimMole = gs.moles.find(m => m.player === _elimThisEp && !m.exposed);
      if (_elimMole && _elimMole.sabotageCount > 0) {
        h.moleReveal = { player: _elimThisEp, sabotageCount: _elimMole.sabotageCount, sabotageLog: [..._elimMole.sabotageLog], undiscovered: true };
      }
    }
  }
  // ── Aftermath Show: generate after everything else is patched ──
  if (!ep.aftermath) generateAftermathShow(ep);
  if (ep.aftermath) h.aftermath = ep.aftermath;
}

export function snapshotGameState() {
  return {
    episode:      gs.episode,
    phase:        gs.phase,
    isMerged:     gs.isMerged,
    activePlayers: [...gs.activePlayers],
    tribes:       gs.tribes.map(t => ({ name: t.name, members: [...t.members] })),
    riPlayers:    [...gs.riPlayers],
    eliminated:   [...gs.eliminated],
    jury:         [...(gs.jury || [])],
    namedAlliances: (gs.namedAlliances || [])
      .filter(a => a.active)
      .map(a => ({
        name:      a.name,
        formed:    a.formed,
        members:   [...a.members],
        betrayals: a.betrayals ? [...a.betrayals] : [],
        quits:     a.quits     ? [...a.quits]     : [],
        active:    true,
      })),
    dissolvedAlliances: (gs.namedAlliances || [])
      .filter(a => !a.active)
      .map(a => ({
        name:      a.name,
        formed:    a.formed,
        members:   [...a.members],
        betrayals: a.betrayals ? [...a.betrayals] : [],
        active:    false,
      })),
    playerStates: Object.fromEntries(
      Object.entries(gs.playerStates || {}).map(([k, v]) => [k, { emotional: v.emotional || 'comfortable' }])
    ),
    advantages: (gs.advantages || []).map(a => ({ ...a })),
    journeyLostVotes: gs.journeyLostVotes ? [...gs.journeyLostVotes] : [],
    lostVotes: gs.lostVotes ? [...gs.lostVotes] : [],
    romanticSparks: (gs.romanticSparks || []).map(sp => ({ ...sp, players: [...sp.players] })),
    showmances: (gs.showmances || []).map(sh => ({ ...sh, players: [...sh.players] })),
    loveTriangles: (gs.loveTriangles || []).map(t => ({ ...t, suitors: [...t.suitors], showmanceRef: [...t.showmanceRef], resolution: t.resolution ? { ...t.resolution } : null })),
    affairs: (gs.affairs || []).map(af => ({ ...af, rumorSources: [...af.rumorSources], showmanceRef: [...af.showmanceRef], resolution: af.resolution ? { ...af.resolution } : null })),
    broker: gs.broker ? { ...gs.broker, alliances: [...gs.broker.alliances] } : null,
    perceivedBonds: gs.perceivedBonds ? Object.fromEntries(
      Object.entries(gs.perceivedBonds).map(([k, v]) => [k, { ...v }])
    ) : {},
    sideDeals: (gs.sideDeals || []).map(d => ({ ...d, players: [...d.players] })),
    bonds: gs.bonds ? { ...gs.bonds } : {},
    moles: (gs.moles || []).map(m => ({ ...m, suspicion: { ...m.suspicion }, sabotageLog: [...m.sabotageLog], leaks: [...m.leaks] })),
    exileDuelPlayer: gs.exileDuelPlayer || null,
    chalRecord: gs.chalRecord ? Object.fromEntries(
      Object.entries(gs.chalRecord).map(([k, v]) => [k, { ...v }])
    ) : {},
  };
}

export function initGameState() {
  if (!players.length) return false;

  // Fire-making / Koh-Lanta force F4 finale
  if (seasonConfig.firemaking || seasonConfig.finaleFormat === 'fire-making' || seasonConfig.finaleFormat === 'koh-lanta') seasonConfig.finaleSize = Math.max(seasonConfig.finaleSize || 3, 4);

  const bonds = {};
  // Pre-game relationship bonds
  relationships.forEach(r => { bonds[bKey(r.a,r.b)] = r.bond; });
  // Small same-tribe bonus (+0.5)
  const tribeMap = {};
  players.forEach(p => { if(!p.tribe) return; if(!tribeMap[p.tribe]) tribeMap[p.tribe]=[]; tribeMap[p.tribe].push(p.name); });
  Object.values(tribeMap).forEach(members => {
    for (let i=0;i<members.length;i++) for (let j=i+1;j<members.length;j++) {
      const k=bKey(members[i],members[j]); bonds[k]=(bonds[k]||0)+0.5;
    }
  });

  // Pre-game alliance bond boost (+2 permanent, +1.5 normal, +1 fragile)
  (preGameAlliances || []).forEach(a => {
    const boost = a.permanence === 'permanent' ? 2 : a.permanence === 'fragile' ? 1 : 1.5;
    for (let i = 0; i < a.members.length; i++) {
      for (let j = i + 1; j < a.members.length; j++) {
        const k = bKey(a.members[i], a.members[j]);
        bonds[k] = (bonds[k] || 0) + boost;
      }
    }
  });

  // Hero-Villain auto-rivalry: if both exist, they start with -3.0 bond (natural conflict)
  const _heroes = players.filter(p => p.archetype === 'hero').map(p => p.name);
  const _villains = players.filter(p => p.archetype === 'villain').map(p => p.name);
  const _heroVillainRivalries = [];
  _heroes.forEach(h => {
    _villains.forEach(v => {
      const k = bKey(h, v);
      bonds[k] = Math.min(bonds[k] || 0, -3.0);
      _heroVillainRivalries.push({ hero: h, villain: v });
    });
  });

  const tribeList = Object.entries(tribeMap).map(([name,members]) => ({name, members:[...members]}));

  // Any player with no tribe property gets added to the smallest tribe so nobody is orphaned
  if (tribeList.length) {
    players.forEach(p => {
      if (p.tribe) return;
      tribeList.sort((a,b) => a.members.length - b.members.length)[0].members.push(p.name);
    });
  }

  const idolSlots = {};
  if (seasonConfig.advantages?.idol?.enabled) tribeList.forEach(t => { idolSlots[t.name] = seasonConfig.idolsPerTribe || 1; });

  const bewares = {};
  if (seasonConfig.advantages?.beware?.enabled) tribeList.forEach(t => { bewares[t.name] = { hidden: true, holder: null, activated: false }; });

  setGs({
    initialized: true, episode: 0, phase: 'pre-merge', isMerged: false,
    activePlayers: players.map(p=>p.name),
    tribes: tribeList,
    riPlayers: [], riReturnCount: 0, riDuelHistory: [], riLifeEvents: {},
    riArrivalEp: {}, riQuits: [], riAlliancesFormed: [],
    eliminated: [], bonds, perceivedBonds: {}, sideDeals: [], loyaltyTests: [], alliances: [], episodeHistory: [],
    advantages: [],      // [{ holder, type, foundEp, fromBeware? }]
    idolSlots,           // { tribeName: bool }
    bewares,             // { tribeName: { hidden, holder, activated } }
    exileDuelPlayer: null, // player sent to exile — duels the next boot
    mergeIdolHidden: false,
    lostVotes: [],       // players who cannot vote this episode
    jury: [],            // players eliminated post-merge
    journeyHistory: [],
    exiledThisEp: null,
    penaltyVoteThisEp: null,
    shotInDarkEnabledThisEp: false,
    namedAlliances: (preGameAlliances || []).filter(a => a.members.every(m => players.some(p => p.name === m))).map(a => ({
      id: 'pre-' + a.id, name: a.name, members: [...a.members], formed: 0, betrayals: [], quits: [], active: true,
      permanence: a.permanence || 'normal', preGame: true,
    })),
    playerStates: {},    // { [name]: { emotional, votesReceived, lastVotedEp, bigMoves } }
    jurorHistory: {},    // { [name]: { voters, ep, finalBonds } } — tracks how each jury member was voted out
    popularity: {},               // { [name]: running score }
    popularityArcs: {},           // { [name]: [{ep, delta, score}] } — episode-by-episode arc
    topVoteStreak: {},            // { [name]: consecutive eps as top vote-getter }
    dominantAllianceStreak: { id: null, count: 0 },
    heroVillainRivalries: _heroVillainRivalries, // [{ hero, villain }] — auto-detected at init
    // Survival mechanics
    survival: {},                  // { [name]: 0-100 } per-player survival
    tribeFood: {},                 // { [tribeName]: 0-100 } per-tribe food reserve
    currentProviders: [],          // provider names this episode
    currentSlackers: [],           // slacker names this episode
    providerHistory: {},           // { [name]: episodeCount } — how many eps as provider
    collapseWarning: {},           // { [name]: epNum } — collapse event fired
    medevacs: [],                  // medevac records for season stats
    lastAftermathEp: 0,            // last episode that had an Aftermath
    aftermathHistory: [],          // [{ ep, interviewees }]
    // The Mole
    moles: [],                     // [{ player, exposed, exposedEp, exposedBy, suspicion, sabotageCount, sabotageLog, leaks, layingLow, resistance }]
    loveTriangles: [],             // [{ center, suitors, phase, jealousyLevel, resolved, resolution }]
    _triangleRejectionHeat: {},    // { [name]: { heat, expiresEp } }
    affairs: [],                   // [{ cheater, partner, secretPartner, exposure, resolved, resolution }]
  });

  // Initialize survival values when food/water system is enabled
  if (seasonConfig.foodWater === 'enabled') {
    gs.activePlayers.forEach(p => { gs.survival[p] = 80; });
    gs.tribes.forEach(t => { gs.tribeFood[t.name] = 60; });
  }

  // ── THE MOLE — assign secret saboteur(s) ──
  if (seasonConfig.mole && seasonConfig.mole !== 'disabled') {
    const _moleMake = (name) => ({
      player: name, exposed: false, exposedEp: null, exposedBy: null,
      suspicion: {}, sabotageCount: 0, sabotageLog: [], leaks: [],
      layingLow: false, resistance: 0.5
    });
    if (seasonConfig.mole === '1-random') {
      const pick = gs.activePlayers[Math.floor(Math.random() * gs.activePlayers.length)];
      gs.moles = [_moleMake(pick)];
    } else if (seasonConfig.mole === '2-random') {
      const pool = [...gs.activePlayers];
      const i1 = Math.floor(Math.random() * pool.length);
      const p1 = pool.splice(i1, 1)[0];
      const p2 = pool[Math.floor(Math.random() * pool.length)];
      gs.moles = [_moleMake(p1), _moleMake(p2)];
    } else if (seasonConfig.mole === 'choose' && seasonConfig.molePlayers?.length) {
      gs.moles = seasonConfig.molePlayers
        .filter(n => gs.activePlayers.includes(n))
        .slice(0, 2)
        .map(n => _moleMake(n));
    }
  }

  saveGameState();
  return true;
}

export function resetSeason() {
  if (!confirm('Reset season? This clears all episode history. Your cast and setup are kept.')) return;
  setGs(null); localStorage.removeItem('simulator_gs');
  setGsCheckpoints({});
  Object.keys(localStorage).filter(k => k.startsWith('simulator_cp_')).forEach(k => localStorage.removeItem(k));
  setViewingEpNum(null);
  initGameState();
  window.renderRunTab();
}


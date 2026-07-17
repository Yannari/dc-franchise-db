// js/alliances.js - Heat computation, alliance formation, targeting, betrayals
import { gs, players, ARCHETYPES, seasonConfig } from './core.js';
import { pStats, pronouns, threatScore, isAllianceBottom, getPlayerState, challengeWeakness, threat } from './players.js';
import { getBond, getPerceivedBond, addBond, addPerceivedBond } from './bonds.js';
import { allianceIdolRead, recordIdolIntel } from './advantage-intel.js';
import { rememberStrategy } from './strategy-memory.js';
import { recordDetectedBetrayalKnowledge } from './knowledge-integration.js';
import { addRelationshipDimension } from './relationships.js';

const _arch = (n) => players.find(p => p.name === n)?.archetype || 'floater';
const _VILLAINY = ['villain', 'mastermind', 'schemer'];
export function coalitionMajority(members, lostVotes = []) {
  const lost = new Set(lostVotes || []);
  const eligible = (members || []).filter(name => !lost.has(name)).length;
  return { eligible, majority: Math.floor(eligible / 2) + 1 };
}

export function evaluateSplitVoteSafety({ primaryVoters = [], backupVoters = [], eligibleVoterCount = 0,
  strongestOpposition = 0, reliableVoters = [], idolKnown = false, idolSuspected = false } = {}) {
  const coordinated = primaryVoters.length + backupVoters.length;
  const majority = Math.floor(eligibleVoterCount / 2) + 1;
  const unreliable = [...primaryVoters, ...backupVoters].filter(v => !reliableVoters.includes(v));
  let rejectionReason = null;
  if (!idolKnown && !idolSuspected) rejectionReason = 'no-credible-idol-risk';
  else if (coordinated < majority) rejectionReason = 'coalition-lacks-majority';
  else if (!backupVoters.length) rejectionReason = 'no-backup-ballots';
  else if (unreliable.length) rejectionReason = 'assignments-not-reliable';
  else if (primaryVoters.length <= strongestOpposition) rejectionReason = 'primary-side-too-small';
  else if (backupVoters.length <= strongestOpposition) rejectionReason = 'backup-side-too-small';
  return { safe: !rejectionReason, rejectionReason, coordinated, majority, strongestOpposition, unreliable,
    primaryCount: primaryVoters.length, backupCount: backupVoters.length };
}
// How likely a player is to jump to conclusions and blame the WRONG person for a flip. Driven by a hot
// temper, boldness, and a poor read (low intuition); perceptive/careful minds rarely misfire.
function _impulsiveness(name) {
  const s = pStats(name), a = _arch(name);
  let v = (6 - s.temperament) * 0.10 + (s.boldness - 5) * 0.03 + (5 - s.intuition) * 0.04;
  if (a === 'hothead') v += 0.22;
  else if (a === 'chaos-agent' || a === 'wildcard') v += 0.10;
  else if (a === 'perceptive-player') v -= 0.15;
  else if (a === 'mastermind' || a === 'schemer') v -= 0.08;
  return Math.max(0.03, Math.min(0.9, v));
}
// SPICY MISATTRIBUTION: an undetected flip left the alliance paranoid. The most impulsive loyal member
// may lash out at the WRONG person — a plausible suspect they already distrust — instead of the real
// (undetected) traitor. The grudge is real: bond crashes, steering their next vote onto an innocent.
function _misattributeBlame(ep, alliance, realBetrayer, realTarget, loyalReaders, severity, plannedTarget, actualBoot) {
  if (!loyalReaders.length) return null;
  const reactor = [...loyalReaders].sort((a, b) => _impulsiveness(b) - _impulsiveness(a))[0];
  // A MAJOR undetected betrayal (an ally's name written) ALWAYS demands a culprit — the fallout is big
  // enough that someone always ends up pointing a finger. Moderate/minor stay gated by the reactor's
  // impulsiveness: a stray vote doesn't necessarily start a witch hunt, and calm heads don't jump.
  const _fireChance = severity === 'major' ? 1.0 : _impulsiveness(reactor);
  if (Math.random() >= _fireChance) return null; // kept a cool head — quiet paranoia, no wrong-blame
  // a plausible wrong suspect: not the reactor / real traitor / boot; bias to someone already distrusted
  // or a shifty archetype (villain/schemer reads as guilty), preferring inside the alliance for the irony.
  const insiders = alliance.members.filter(p => p !== reactor && p !== realBetrayer && gs.activePlayers.includes(p) && p !== realTarget);
  const outsiders = gs.activePlayers.filter(p => p !== reactor && p !== realBetrayer && p !== realTarget && !alliance.members.includes(p));
  const pool = (insiders.length && Math.random() < 0.6) ? insiders : (insiders.concat(outsiders));
  if (!pool.length) return null;
  const suspectScore = (p) => getBond(reactor, p) - (_VILLAINY.includes(_arch(p)) ? 2 : 0) + (Math.random() * 2 - 1);
  const wrongSuspect = [...pool].sort((a, b) => suspectScore(a) - suspectScore(b))[0]; // lowest = most suspected
  if (!wrongSuspect) return null;
  addBond(reactor, wrongSuspect, -2.0); // a real grudge — drives targeting via perceived bond next vote
  if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
  gs.blowupHeatNextEp.add(reactor);
  // Dedicated camp-event channel for the wrong-blame confrontation (its own beat next episode),
  // separate from the traitor's "got away with it" reveal. Fires for any flip severity. Carries the plan
  // context (what the alliance was voting, who actually went home) so the beat can name specifics —
  // the reactor is blaming wrongSuspect for THAT disruption.
  if (!gs.discoveredVotesLastEp) gs.discoveredVotesLastEp = [];
  gs.discoveredVotesLastEp.push({ type: 'misattribution', reactor, wrongSuspect, realBetrayer,
    alliance: alliance.name, plannedTarget: plannedTarget || null, actualBoot: actualBoot || null,
    votedAlly: alliance.members.includes(realTarget) });
  return { reactor, wrongSuspect };
}

export function computeHeat(name, tribalPlayers, alliances) {
  const s = pStats(name);
  let heat = 0;
  tribalPlayers.filter(p => p !== name).forEach(voter => {
    const a = alliances.find(al => al.members.includes(voter));
    if (a?.target === name) heat += 1.5;
    const bond = getPerceivedBond(voter, name); // voter's perception drives targeting
    // Scale heat with bond intensity — deeper hatred = much more heat
    if (bond <= -1) heat += Math.min(2.5, (-bond) * 0.3);
  });
  if (gs.phase === 'post-merge') {
    const ts = threatScore(name);
    heat += Math.max(0, (ts - 4) * 0.3);
    // Challenge record carry-over: people remember pre-merge performance
    // Dominators are threats, but chronic bombers can also be targeted (dead weight / goat-cutting)
    const rec = gs.chalRecord?.[name];
    if (rec) {
      // Immunity wins create direct heat — proven winner = must go before they win again
      heat += rec.wins * 0.35;
      // Weak performers post-merge: not a liability anymore, but can be seen as a goat
      // Strategic players might cut them before FTC to avoid dragging a goat who gets 0 jury respect
      // OR keep them as a shield — this creates nuance, not a binary
    }
  }
  // Betrayed idol holder — their secret is out, they're now a priority target
  if (gs.knownIdolHoldersThisEp?.has(name)) heat += 2.0;
  // Known Second Life Amulet holder — reaction depends on who's evaluating
  // Challenge beasts/bold players want to flush it (they'd win the duel)
  // Strategic players avoid (wasteful vote). Weak players are terrified of being picked.
  // Computed per-voter in the context of the tribal, but computeHeat is called without
  // a specific attacker — so we use the average reaction across archetypes.
  // The per-voter nuance happens in pickTarget instead.
  if (gs.knownAmuletHoldersThisEp?.has(name)) heat -= 0.5; // mild general deterrent only
  // Known Team Swap holder — get them before they escape
  if (gs.knownTeamSwapHolders?.has(name)) heat += 0.6;
  // Known Vote Block holder — mild tactical awareness
  if (gs.knownVoteBlockHolders?.has(name)) heat += 0.3;
  // Known Vote Steal holder — mild tactical awareness
  if (gs.knownVoteStealHolders?.has(name)) heat += 0.3;
  // Known Safety Without Power holder — people want to flush it
  if (gs.knownSafetyNoPowerHolders?.has(name)) heat += 0.5;
  // Used Safety Without Power last episode — "ran away, get them before they run again"
  if (gs.safetyNoPowerHeat?.player === name && gs.safetyNoPowerHeat?.ep === ((gs.episode || 0) + 1)) heat += 1.0;
  // Known Sole Vote holder — everyone wants it flushed, it's terrifying
  if (gs.knownSoleVoteHolders?.has(name)) heat += 1.5;
  // Used Sole Vote last episode — dictator backlash
  if (gs.soleVoteHeat?.player === name && gs.soleVoteHeat?.ep === ((gs.episode || 0) + 1)) heat += 1.0;
  // Tribal blowup fallout — someone named this player on the way out
  if (gs.blowupHeatNextEp?.has(name)) heat += 1.5;
  // Social bomb — said something that landed badly at camp this episode
  if (gs.socialBombHeatThisEp?.has(name)) heat += 1.0;
  // KiP holder — stolen advantage makes you a known threat
  if (gs.kipStealLastEp?.holder === name) heat += 0.3;
  // Fan vote winner — being fan favorite = FTC threat
  if (gs.fanVoteWinner === name || gs.fanVoteEp === (gs.episode || 0) + 1 && gs.advantages?.some(a => a.holder === name && a.fromFanVote)) heat += 0.5;
  // Stolen credit: stealer gets heat after losing confrontation
  if (gs.stolenCreditHeat?.player === name && gs.stolenCreditHeat.ep >= ((gs.episode || 0) + 1) - 1) heat += 0.3;
  // Challenge throw: caught = suspicion heat. Uncaught = significant heat reduction (the whole point of throwing)
  if (gs.challengeThrowHeat?.[name] >= ((gs.episode || 0) + 1) - 1) heat += 0.8;
  if (gs.challengeThrowHeatReduction?.[name] >= ((gs.episode || 0) + 1) - 1) heat -= 1.0;
  // Reward backfire: left-behind players organized against reward group
  if (gs._rewardBackfireHeat?.targets?.[name] && gs._rewardBackfireHeat.expiresEp > (gs.episode || 0)) heat += gs._rewardBackfireHeat.targets[name];
  // Survival: provider protection + villain/schemer targeting + slacker resentment
  if (seasonConfig.foodWater === 'enabled') {
    if (gs.currentProviders?.includes(name)) {
      const _villSchem = tribalPlayers.filter(p => {
        const a = players.find(x => x.name === p)?.archetype || '';
        return a === 'villain' || a === 'schemer';
      }).length;
      const _protectors = tribalPlayers.filter(p => p !== name).length - _villSchem;
      heat += _villSchem * 0.5 - _protectors * 0.05;
      heat -= 0.3; // base provider protection
    }
    if (gs.currentSlackers?.includes(name)) {
      const _nonSlackers = tribalPlayers.filter(p => p !== name && !gs.currentSlackers?.includes(p)).length;
      heat += _nonSlackers * 0.04;
    }
  }
  // Hero/Villain archetype heat modifiers
  const _nameArch = players.find(p => p.name === name)?.archetype || '';
  if (_nameArch === 'villain') {
    heat += 1.5; // everyone wants the villain gone
    // BUT low-boldness players FEAR voting for the villain (intimidation effect)
    // This is applied per-voter in simulateVotes, not here (computeHeat is voterless)
  }
  if (_nameArch === 'hero') {
    heat -= 1.0; // people don't want to vote for the hero (proportional with game stage)
    // Strategic players see the hero as a jury threat
    const _stratVoters = tribalPlayers.filter(p => pStats(p).strategic * 0.1 > 0.6);
    if (_stratVoters.length && gs.isMerged) heat += _stratVoters.length * 0.3; // late-game jury threat targeting
  }
  // ── Jury Management: strategic players factor FTC math into targeting ──
  // Only post-merge, 8 or fewer active, jury-decided finale
  if (gs.activePlayers.length <= 8 && (gs.jury?.length || 0) >= 1) {
    const _jury = gs.jury || [];
    const _targetJuryVotes = _jury.filter(j => getBond(j, name) >= 2).length;
    // Each strategic voter at tribal runs the math
    tribalPlayers.filter(p => p !== name && pStats(p).strategic >= 6).forEach(voter => {
      const _myJuryVotes = _jury.filter(j => getBond(j, voter) >= 2).length;
      const _juryAdv = _targetJuryVotes - _myJuryVotes;
      if (_juryAdv > 0) {
        // Target would beat me at FTC — I need them gone
        heat += _juryAdv * 0.4;
      } else if (_juryAdv < 0) {
        // I would beat target — protect them, they're my goat
        heat -= 0.5;
      }
    });
  }
  // Legacy holder — known holders are late-game threats (they have guaranteed immunity coming)
  const _nameHasLegacy = gs.advantages?.some(a => a.type === 'legacy' && a.holder === name);
  if (_nameHasLegacy) {
    if (gs.knownLegacyHolders?.has(name)) heat += 0.8; // tribe knows — threat to let them reach activation
    // The Sarah Play: someone who'd inherit the legacy has extra incentive to vote the holder out
    if (gs.legacyConfessedTo?.[name]) {
      const _heir = gs.legacyConfessedTo[name];
      if (tribalPlayers.includes(_heir) && pStats(_heir).strategic >= 6) {
        heat += 1.2; // the heir is actively scheming to inherit
      }
    }
  }
  // Amulet holder — other holders want to eliminate them to upgrade their own amulet power
  const _nameHasAmulet = gs.advantages?.some(a => a.type === 'amulet' && a.holder === name);
  if (_nameHasAmulet) {
    // Heat from OTHER amulet holders who want the upgrade
    const _otherAmuletHolders = (gs.advantages || []).filter(a => a.type === 'amulet' && a.holder !== name && tribalPlayers.includes(a.holder));
    if (_otherAmuletHolders.length) heat += 1.0 + _otherAmuletHolders.length * 0.3;
    // Strategic players who KNOW about the amulet also see them as a threat
    if (gs.knownAmuletHoldersPersistent?.has(name)) heat += 0.5;
    // BOUNTY AWARENESS: non-holders who know about the amulet system factor the upgrade math
    // Eliminating this holder makes OTHER holders stronger — strategic players think twice
    // But if you're NOT an amulet holder and you want to weaken the amulet group, target the strongest one
    const _knownAmuletCount = (gs.advantages || []).filter(a => a.type === 'amulet' && gs.knownAmuletHoldersPersistent?.has(a.holder)).length;
    if (_knownAmuletCount >= 2 && gs.knownAmuletHoldersPersistent?.has(name)) {
      // Non-holders see amulet holders as a threat GROUP — eliminating one makes others stronger
      // Strategic non-holders might AVOID this holder to prevent the upgrade
      const _nonHolderStrategists = tribalPlayers.filter(p =>
        !gs.advantages.some(a => a.type === 'amulet' && a.holder === p) && pStats(p).strategic >= 7
      );
      if (_nonHolderStrategists.length) {
        // If there's only 2 amulet holders left, eliminating one gives the other an IDOL — very dangerous
        const _amuCount = (gs.advantages || []).filter(a => a.type === 'amulet').length;
        if (_amuCount === 2) heat -= 0.5; // strategic non-holders AVOID creating an idol for the other holder
        else heat += 0.3; // with 3 holders, eliminating one is still worth it (upgrade is minor: extra vote → vote steal)
      }
    }
  }
  // Pre-merge: challenge liability adds heat — tribe needs strength, weak players get targeted
  if (gs.phase !== 'post-merge') {
    // Blend stats + actual performance: bombs make you a bigger liability than stats alone
    const _cwStats = challengeWeakness(name);
    const _rec = gs.chalRecord?.[name];
    const _bombs = _rec?.bombs || 0;
    const _cwActual = _cwStats + (_bombs >= 3 ? 2.0 : _bombs >= 2 ? 1.0 : _bombs >= 1 ? 0.3 : 0);
    if (_cwActual >= 5.5) heat += 1.5;       // serious liability (stats + performance)
    else if (_cwActual >= 4.0) heat += 0.6;   // noticeable weakness
    // Physical beasts get slight protection pre-merge — tribe wants their strength
    // BUT not immune: bad bonds or strategic threat can override this
    if ((s.physical >= 8 || s.endurance >= 8) && _cwActual < 4.0) heat -= 0.3;
    // BUT: if someone is dominating pre-merge challenges (4+ podiums), strategic players start planning for merge
    const _podiums = _rec?.podiums || 0;
    if (_podiums >= 4) heat += 0.4; // tribe starts thinking about merge — this player becomes untouchable soon
  }
  // Lost vote — can't defend themselves, others smell blood
  if (gs.lostVotes?.includes(name)) heat += 1.2;
  // Penalty vote — already has a vote against them, easier to pile on
  if (gs.penaltyVoteThisEp === name) heat += 1.5;
  // Visible pair heat — scales with bond intensity. Stronger pairs are bigger targets.
  const maxPartnerBond = tribalPlayers.filter(p => p !== name).reduce((m, p) => Math.max(m, getBond(name, p)), 0);
  if (maxPartnerBond >= 5) {
    const pairHeat = (maxPartnerBond - 4) * (gs.phase === 'post-merge' ? 0.2 : 0.08);
    heat += Math.min(1.5, pairHeat);
  }
  // Showmance — recognized romantic pair draws even more heat
  const _shm = getShowmance(name);
  if (_shm) {
    // Heat scales by phase: spark barely noticed, target = full heat
    const _shmHeat = _shm.phase === 'target' ? 1.2 : _shm.phase === 'honeymoon' ? 0.6 : _shm.phase === 'ride-or-die' ? 1.5 : 0.2;
    heat += gs.phase === 'post-merge' ? _shmHeat : _shmHeat * 0.3;
  }
  // Love triangle heat — all 3 members get collateral heat
  const _tri = (gs.loveTriangles || []).find(t => !t.resolved && (t.center === name || t.suitors.includes(name)));
  if (_tri) {
    const triHeat = _tri.center === name
      ? 0.4 * (_tri.jealousyLevel / 10)   // center gets more heat
      : 0.2 * (_tri.jealousyLevel / 10);  // suitors get less
    heat += gs.phase === 'post-merge' ? triHeat : triHeat * 0.3;
  }
  // Rejected player revenge heat (temporary, 2 episodes)
  const _rejHeat = gs._triangleRejectionHeat?.[name];
  if (_rejHeat && ((gs.episode || 0) + 1) <= _rejHeat.expiresEp) {
    heat += _rejHeat.heat; // can be negative for villain sympathy
  }
  // Active affair heat — cheater gets pressure as exposure grows
  const _affair = (gs.affairs || []).find(af => !af.resolved && af.cheater === name);
  if (_affair) {
    const afHeat = _affair.exposure === 'exposed' ? 1.5
      : _affair.exposure === 'caught' ? 0.8
      : _affair.exposure === 'rumors' ? 0.4
      : 0.1;
    heat += gs.phase === 'post-merge' ? afHeat : afHeat * 0.3;
  }
  // Information Broker — active: hard to target (-0.5), exposed: massive target (+2.0 for 2 eps)
  if (gs.broker?.player === name && !gs.broker.exposed) heat -= 0.5;
  if (gs.brokerExposedHeat === name && gs.brokerExposedEp && ((gs.episode || 0) + 1) - gs.brokerExposedEp <= 2) heat += 2.0;
  // ── Scramble Effect: high social/strategic players work the camp to deflect pressure ──
  if (heat > 3) {
    const _scramblePower = s.social * 0.04 + s.strategic * 0.04;
    heat -= _scramblePower;
    // Track for camp event injection (done in generateCampEvents where ep is available)
    if (_scramblePower >= 0.5) {
      if (!gs._scrambleActivations) gs._scrambleActivations = {};
      gs._scrambleActivations[name] = _scramblePower;
    }
  }
  // Shield network removed — replaced by vote pitches in social politics system
  // Bold unpredictability — proportional: every point of boldness makes you slightly harder to target
  const _nameBoldness = s.boldness;
  heat -= _nameBoldness * 0.04; // stat 4=-0.16, stat 7=-0.28, stat 10=-0.40
  // Floater invisibility — floaters fly under the radar, drawing less heat naturally
  const _nameArch2 = players.find(p => p.name === name)?.archetype;
  if (_nameArch2 === 'floater') heat *= 0.85; // 15% heat reduction — nobody thinks of them
  // Chaos dividend: if the last tribal was chaotic (scattered votes), bold players benefit
  // They thrive in disorganization — when nobody can agree, the wildcard survives
  const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (_prevEp) {
    const _prevVotes = _prevEp.votes || {};
    const _uniqueTargets = Object.keys(_prevVotes).length;
    const _totalVoters = Object.values(_prevVotes).reduce((s, v) => s + v, 0);
    if (_uniqueTargets >= 4 && _uniqueTargets / Math.max(1, _totalVoters) >= 0.35) {
      heat -= _nameBoldness * 0.03; // proportional: stat 4=-0.12, stat 7=-0.21, stat 10=-0.30
    }
  }
  // Spirit Island intel — jury visitor told someone who the jury respects/resents
  // Expires after 3 episodes (info becomes stale as jury dynamics shift)
  if (gs.spiritIntel) {
    const _curEp = (gs.episode || 0) + 1;
    Object.entries(gs.spiritIntel).forEach(([recipient, intel]) => {
      if (intel.expires && _curEp > intel.expires) return; // expired
      if (!tribalPlayers.includes(recipient)) return;
      if (intel.type === 'jury-respects' && intel.target === name) {
        heat += getBond(recipient, name) >= 2 ? 0.5 : 1.5;
      } else if (intel.type === 'jury-resents' && intel.target === name) {
        heat -= 1.0;
      }
    });
  }
  // ── The Mole: exposed = massive heat spike, laying low = faster decay ──
  if (gs.moles?.length) {
    const _moleObj = gs.moles.find(m => m.player === name);
    if (_moleObj) {
      if (_moleObj.exposed && gs.moleExposedHeat?.[name]) {
        const _epsSinceExposed = ((gs.episode || 0) + 1) - gs.moleExposedHeat[name];
        if (_epsSinceExposed <= 2) heat += 3.0; // +3.0 for 2 episodes after exposure
      }
      if (_moleObj.layingLow && !_moleObj.exposed) {
        heat *= 0.67; // 1.5x faster decay ≈ 33% heat reduction while laying low
      }
    }
    // Detective reward: player who exposed the Mole gets heat reduction for 2 episodes
    if (gs.moleDetectiveHeatReduction?.[name]) {
      const _epsSinceDetective = ((gs.episode || 0) + 1) - gs.moleDetectiveHeatReduction[name];
      if (_epsSinceDetective <= 2) heat -= 1.5; // tribe protects the person who saved them
    }
  }
  // ── Phobia Factor blame: player who failed their fear and cost the tribe ──
  if (gs._phobiaBlame?.[name]) heat += gs._phobiaBlame[name];
  if (gs._cliffDiveBlame?.[name]) heat += gs._cliffDiveBlame[name];
  if (gs._awakeAThonBlame?.[name]) heat += gs._awakeAThonBlame[name];
  if (gs._emissaryHeat?.[name] && ((gs.episode || 0) + 1) < gs._emissaryHeat[name].expiresEp) heat += gs._emissaryHeat[name].amount;
  if (gs._dodgebrawlHeat?.[name] && ((gs.episode || 0) + 1) < gs._dodgebrawlHeat[name].expiresEp) heat += gs._dodgebrawlHeat[name].amount;
  if (gs._talentShowHeat?.[name] && ((gs.episode || 0) + 1) < gs._talentShowHeat[name].expiresEp) heat += gs._talentShowHeat[name].amount;
  if (gs._suckyOutdoorsHeat?.[name] && ((gs.episode || 0) + 1) < gs._suckyOutdoorsHeat[name].expiresEp) heat += gs._suckyOutdoorsHeat[name].amount;
  if (gs._upTheCreekHeat?.[name] && ((gs.episode || 0) + 1) < gs._upTheCreekHeat[name].expiresEp) heat += gs._upTheCreekHeat[name].amount;
  if (gs._paintballHeat?.[name] && ((gs.episode || 0) + 1) < gs._paintballHeat[name].expiresEp) heat += gs._paintballHeat[name].amount;
  if (gs._cookingHeat?.[name] && ((gs.episode || 0) + 1) < gs._cookingHeat[name].expiresEp) heat += gs._cookingHeat[name].amount;
  if (gs._trustHeat?.[name] && ((gs.episode || 0) + 1) < gs._trustHeat[name].expiresEp) heat += gs._trustHeat[name].amount;
  // Social Manipulation: exposed schemer heat / campaign rally target heat
  if (gs._schemeHeat?.[name] && ((gs.episode || 0) + 1) < gs._schemeHeat[name].expiresEp) heat += gs._schemeHeat[name].amount;
  // Hung Out to Dry: the lie detector forced a real secret into the open (ran a vote, outed a strong
  // alliance, confessed a power-couple) — the cast targets whoever was exposed.
  if (gs._hungHeat?.[name] && ((gs.episode || 0) + 1) < gs._hungHeat[name].expiresEp) heat += gs._hungHeat[name].amount;
  // Hung Out to Dry: an ally named to their face as the least-trusted seeks revenge on the betrayer.
  if (gs._hungBetrayHeat) {
    Object.entries(gs._hungBetrayHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Merry-Go-Round-Up: a schemer's carousel blindside was overheard by the target, who now hunts them.
  if (gs._spinHeat?.[name] && ((gs.episode || 0) + 1) < gs._spinHeat[name].expiresEp) heat += gs._spinHeat[name].amount;
  if (gs._spinBetrayHeat) {
    Object.entries(gs._spinBetrayHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Basic Straining: bullied players target the bully's ally
  if (gs._basicStrainingHeat) {
    Object.entries(gs._basicStrainingHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Hide and Be Sneaky: betrayal targets seek revenge on their betrayer
  if (gs._hideSeekHeat) {
    Object.entries(gs._hideSeekHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Slasher Night: sabotage victims target perpetrators
  if (gs._slasherHeat) {
    Object.entries(gs._slasherHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Monster Cash heat
  if (gs._monsterCashHeat) {
    Object.entries(gs._monsterCashHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Operation: Classified heat
  if (gs._operationClassifiedHeat) {
    Object.entries(gs._operationClassifiedHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Beach Blanket Bogus: sabotage victims want the saboteur gone
  if (gs._beachBogusHeat) {
    Object.entries(gs._beachBogusHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // 3:10 to Crazytown: betrayal targets seek revenge
  if (gs._crazytownHeat) {
    Object.entries(gs._crazytownHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Chefshank Redemption: sabotage/threat heat
  if (gs._chefshankHeat) {
    Object.entries(gs._chefshankHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // One Flu Over the Cuckoos: rivalry prank + refusal-to-help heat
  if (gs._fluHeat) {
    Object.entries(gs._fluHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Masters of Disasters: panic drowning dragger + Chef projectile targeting
  if (gs._disasterHeat) {
    Object.entries(gs._disasterHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  // Off the Chain: bike race sabotage/rivalry heat
  if (gs._bikeRaceHeat?.[name] && ((gs.episode || 0) + 1) < gs._bikeRaceHeat[name].expiresEp) heat += gs._bikeRaceHeat[name].amount;
  // African Lying Safari: theft/extortion heat
  if (gs._safariHeat?.[name] && ((gs.episode || 0) + 1) < gs._safariHeat[name].expiresEp) heat += gs._safariHeat[name].amount;
  // Rock the Dock: lost at sea blame heat
  if (gs._rockTheDockHeat?.[name] && ((gs.episode || 0) + 1) < gs._rockTheDockHeat[name].expiresEp) heat += gs._rockTheDockHeat[name].amount;
  // Full Metal Drama: friendly fire, sabotage, desertion heat
  if (gs._warHeat) {
    Object.entries(gs._warHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
  if (gs._heistHeat) {
    for (const h of gs._heistHeat) {
      if (h.target === name && ((gs.episode || 0) + 1) < h.expiresEp) heat += h.amount;
    }
  }
  // ── Volunteer Exile Duel: volunteer WANTS to be voted out ──
  if (gs._volunteerDuelHeat?.[name] === ((gs.episode || 0) + 1)) heat += 8.0;
  // Volunteer duel winner returns with reduced heat
  if (gs._volunteerDuelReturnHeat?.[name]) {
    const _epsSinceReturn = ((gs.episode || 0) + 1) - gs._volunteerDuelReturnHeat[name];
    if (_epsSinceReturn <= 2) heat -= 2.0;
  }
  // ── Tied Destinies: pair-aware heat — voting out this player also eliminates their partner ──
  if (gs._tiedDestiniesActive) {
    const _tdPair = gs._tiedDestiniesActive.find(p => p.a === name || p.b === name);
    if (_tdPair) {
      const partner = _tdPair.a === name ? _tdPair.b : _tdPair.a;
      const partnerThreat = threatScore(partner);
      // If partner is a bigger threat, this player becomes a juicy target (affordable path to eliminate the threat)
      if (partnerThreat > threatScore(name)) heat += (partnerThreat - threatScore(name)) * 0.4;
      // If partner is an ally to many, targeting this pair has a higher cost — reduce heat
      const _partnerAvgBond = tribalPlayers.filter(p => p !== name && p !== partner)
        .reduce((s, p) => s + Math.max(0, getBond(p, partner)), 0) / Math.max(1, tribalPlayers.length - 2);
      heat -= _partnerAvgBond * 0.3;
    }
  }
  return Math.min(10, heat);
}

export function decayAllianceTrust(epNum) {
  if (!gs.namedAlliances?.length) return;
  if (!gs.allianceDissolutions) gs.allianceDissolutions = [];
  gs.namedAlliances.forEach(alliance => {
    if (!alliance.active) return;

    const activeMembers = alliance.members.filter(m => gs.activePlayers.includes(m));
    const perm = alliance.permanence || 'normal';

    // ── Dissolve: only 1 (or 0) active member left — alliance is dead (even permanent) ──
    if (activeMembers.length <= 1) {
      alliance.active = false;
      const lastMember = activeMembers[0] || null;
      gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'last-member', members: [...alliance.members], lastMember });
      return;
    }

    // Permanent alliances never dissolve from bonds or betrayals
    if (perm === 'permanent') return;

    // ── Dissolve: internal bonds have collapsed — nobody likes each other anymore ──
    if (activeMembers.length >= 2) {
      let totalBond = 0, pairs = 0;
      for (let i = 0; i < activeMembers.length; i++) {
        for (let j = i + 1; j < activeMembers.length; j++) {
          totalBond += getBond(activeMembers[i], activeMembers[j]);
          pairs++;
        }
      }
      const avgBond = pairs > 0 ? totalBond / pairs : 0;
      // Only count moderate+ betrayals for dissolution (minor rogue votes don't kill alliances).
      // Betrayals by members who've been eliminated or expelled no longer drag the alliance down —
      // each member owns their own betrayals; a departed traitor's sins leave with them.
      const _significantBetrayals = (alliance.betrayals || []).filter(b => b.severity !== 'minor' && activeMembers.includes(b.player)).length;
      const betrayalCount = _significantBetrayals;
      const recentBetrayals = (alliance.betrayals || []).filter(b => b.ep === epNum);
      // Grace period: alliances younger than 3 episodes need 1 extra betrayal before dissolution
      const _age = epNum - (alliance.formed || 0);
      const _graceBonus = _age < 3 ? 1 : 0;
      // Fragile: dissolves easier (avg bond <= 0 or any significant betrayal)
      if (perm === 'fragile') {
        if (avgBond <= 0 || betrayalCount >= 1 + _graceBonus) {
          alliance.active = false;
          gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: betrayalCount >= 1 ? 'betrayal' : 'bonds-collapsed', members: [...activeMembers], betrayals: recentBetrayals, avgBond: Math.round(avgBond * 10) / 10 });
          return;
        }
      } else {
        // ── BONDS COLLAPSED: nobody likes each other — alliance is dead ──
        if (avgBond <= -1) {
          alliance.active = false;
          gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'bonds-collapsed', members: [...activeMembers], avgBond: Math.round(avgBond * 10) / 10 });
          return;
        }

        // ── BETRAYAL HANDLING: prioritize EXPELLING the betrayer over dissolving the alliance ──
        // Count betrayals PER MEMBER to find the cancer
        const _betrayalsByMember = {};
        (alliance.betrayals || []).filter(b => b.severity !== 'minor').forEach(b => {
          _betrayalsByMember[b.player] = (_betrayalsByMember[b.player] || 0) + 1;
        });
        const _majorByMember = {};
        (alliance.betrayals || []).filter(b => b.severity === 'major').forEach(b => {
          _majorByMember[b.player] = (_majorByMember[b.player] || 0) + 1;
        });

        // Find repeat offenders (2+ betrayals from the same person)
        const _repeatOffenders = Object.entries(_betrayalsByMember)
          .filter(([player, count]) => count >= 2 && activeMembers.includes(player))
          .map(([player]) => player);
        // Find major betrayers (voted against alliance member)
        const _majorBetrayers = Object.entries(_majorByMember)
          .filter(([player, count]) => count >= 1 && activeMembers.includes(player))
          .map(([player]) => player);

        // How many UNIQUE members have betrayed?
        const _uniqueBetrayers = new Set(Object.keys(_betrayalsByMember).filter(p => activeMembers.includes(p)));

        // EXPEL: if betrayals come from 1-2 specific members, kick THEM out — don't dissolve
        // The alliance survives by cutting the cancer
        if ((_repeatOffenders.length || _majorBetrayers.length) && _uniqueBetrayers.size <= Math.ceil(activeMembers.length / 2)) {
          const _toExpel = [...new Set([..._repeatOffenders, ..._majorBetrayers])];
          const _remainingAfterExpel = activeMembers.filter(m => !_toExpel.includes(m));

          // Only expel if the alliance survives with 2+ members
          if (_remainingAfterExpel.length >= 2) {
            _toExpel.forEach(expelled => {
              alliance.members = alliance.members.filter(m => m !== expelled);
              alliance.quits = alliance.quits || [];
              alliance.quits.push({ player: expelled, ep: epNum, reason: 'expelled — betrayed the alliance' });
              // Camp event: the expulsion
              if (!gs._pendingExpulsions) gs._pendingExpulsions = [];
              gs._pendingExpulsions.push({
                player: expelled,
                alliance: alliance.name,
                reason: _majorByMember[expelled] ? 'voted against an alliance member' : 'repeated betrayals',
                remainingMembers: [..._remainingAfterExpel],
              });
            });
            // Bond damage: remaining members lose trust with expelled
            _toExpel.forEach(expelled => {
              _remainingAfterExpel.forEach(member => addBond(member, expelled, -1.5));
            });
            // Remaining members get a small trust boost — they survived together
            for (let i = 0; i < _remainingAfterExpel.length; i++) {
              for (let j = i + 1; j < _remainingAfterExpel.length; j++) {
                addBond(_remainingAfterExpel[i], _remainingAfterExpel[j], 0.3);
              }
            }
            // Check if alliance is still viable
            if (alliance.members.filter(m => gs.activePlayers.includes(m)).length < 2) {
              alliance.active = false;
              gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'last-member', members: [...alliance.members] });
            }
            return;
          }
        }

        // DISSOLVE: betrayals from MULTIPLE members across the board — the alliance is rotten
        if (_uniqueBetrayers.size >= Math.ceil(activeMembers.length * 0.6) && betrayalCount >= 3 + _graceBonus) {
          alliance.active = false;
          gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'betrayals-and-low-trust', members: [...activeMembers], betrayals: recentBetrayals, betrayalCount, avgBond: Math.round(avgBond * 10) / 10 });
          return;
        }
        // DISSOLVE: widespread major betrayals from different people
        if (_uniqueBetrayers.size >= 2 && Object.keys(_majorByMember).filter(p => activeMembers.includes(p)).length >= 2) {
          alliance.active = false;
          gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'ally-betrayals', members: [...activeMembers], betrayals: recentBetrayals, betrayalCount: Object.keys(_majorByMember).length, avgBond: Math.round(avgBond * 10) / 10 });
          return;
        }
        // Absolute cap: too much damage from too many sources (only from members still in the game)
        const _totalBetrayals = (alliance.betrayals || []).filter(b => activeMembers.includes(b.player)).length;
        const _quitCount = alliance.quits?.length || 0;
        if (_totalBetrayals >= 6 || _quitCount >= 4 || (_totalBetrayals + _quitCount) >= 8) {
          alliance.active = false;
          gs.allianceDissolutions.push({ name: alliance.name, ep: epNum, reason: 'too-many-betrayals', members: [...activeMembers], betrayals: recentBetrayals, betrayalCount, avgBond: Math.round(avgBond * 10) / 10 });
          return;
        }
      }
    }

    // ── Decay: old alliances with strategic players naturally erode ──
    const age = epNum - alliance.formed;
    if (age < 5) return;
    const decay = Math.min(0.1, (age - 4) * 0.015);
    activeMembers.forEach(m => {
      const s = pStats(m);
      if (s.strategic < 6) return;
      activeMembers.filter(o => o !== m).forEach(o => {
        if (getBond(m, o) > 2.5) addBond(m, o, -(decay * (s.strategic - 5) * 0.25));
      });
    });
  });
}

export function wRandom(pool, weightFn) {
  if (!pool.length) return null;
  const weights = pool.map((item,i) => Math.max(0.01, weightFn(item,i)));
  const total   = weights.reduce((a,b)=>a+b, 0);
  let r = Math.random() * total;
  for (let i=0; i<pool.length; i++) { r -= weights[i]; if (r<=0) return pool[i]; }
  return pool[pool.length-1];
}

export function detectBetrayals(ep) {
  if (!gs.namedAlliances?.length || !ep.votingLog?.length || !ep.eliminated) return;
  gs.namedAlliances.forEach(alliance => {
    if (!alliance.active) return;
    // Alliance members who cast a vote in this tribal (they were present)
    const voters = alliance.members.filter(m => ep.votingLog.some(v => v.voter === m));
    if (voters.length < 2) return;
    // Find consensus — prefer the alliance's PLANNED target over what the majority actually voted
    // The plan is the commitment; voting differently is the betrayal, even if most members defected
    const _epAlliances = ep.alliances || [];
    const _ownPlan = _epAlliances.find(a => a.label === alliance.name)?.target;
    const tally = {};
    voters.forEach(member => {
      const entry = ep.votingLog.find(l => l.voter === member);
      if (entry) tally[entry.voted] = (tally[entry.voted] || 0) + 1;
    });
    const sorted = Object.entries(tally).sort(([,a],[,b]) => b-a);
    if (sorted.length < 2) return; // unanimous — no betrayal
    let consensusVote;
    if (_ownPlan) {
      // Use the alliance's stated plan as consensus — deviating from the plan = betrayal
      consensusVote = _ownPlan;
      // If everyone voted the plan, no betrayal
      if (voters.every(v => ep.votingLog.find(l => l.voter === v)?.voted === _ownPlan)) return;
    } else {
      // No explicit plan found — fall back to majority vote
      if (voters.length >= 3 && sorted[0][1] === sorted[1][1]) return;
      consensusVote = sorted[0][0];
    }
    const formedThisEp = alliance.formed === ep.num;
    // ── who actually deviated this round (drives lone-vs-bloc detection + who can read it) ──
    const _deviators = voters.filter(v => {
      const e = ep.votingLog.find(l => l.voter === v);
      if (!e || e.voted === consensusVote) return false;
      const sp = (ep.splitVotePlans || []).find(s => s.alliance === alliance.name);
      if (sp && e.voted === sp.secondary && sp.secondaryVoters.includes(v)) return false;
      return true;
    });
    // FIELD SIZE = the suspect pool at THIS tribal (who actually cast a vote), NOT the whole season.
    // Pre-merge this is the attending tribe (~6), so a flip in a small tribe is very visible; post-merge
    // everyone attends so it's the full merged field. A flip hides behind SUSPECTS, not distant tribes.
    const _numLeft = new Set((ep.votingLog || []).filter(v => v.voter && v.voter !== 'THE GAME').map(v => v.voter)).size
      || gs.activePlayers.length;
    const _isLone = _deviators.length === 1;
    // Only people who attended and cast a loyal ballot can directly read this
    // Tribal. Off-tribe allies may learn later through the knowledge network.
    const _loyalReaders = voters.filter(m => !_deviators.includes(m) && gs.activePlayers.includes(m));
    const _bestRead = _loyalReaders.length ? Math.max(..._loyalReaders.map(m => pStats(m).intuition + (_arch(m) === 'perceptive-player' ? 4 : 0))) : 0;

    voters.forEach(voter => {
      const entry = ep.votingLog.find(l => l.voter === voter);
      if (!entry || entry.voted === consensusVote) return;
      // Split vote exemption: if voter was assigned to vote the split target, that's the plan, not betrayal
      const _splitPlan = (ep.splitVotePlans || []).find(sp => sp.alliance === alliance.name);
      if (_splitPlan && entry.voted === _splitPlan.secondary && _splitPlan.secondaryVoters.includes(voter)) return;
      // This player voted against the alliance consensus — betrayal
      const betrayerVotedFor = entry.voted;
      const consensusTargetEliminated = ep.eliminated === consensusVote;
      const betrayerVotedForEliminated = betrayerVotedFor === ep.eliminated;
      const votedForAllyMember = alliance.members.includes(betrayerVotedFor);
      const _betrayalSeverity = votedForAllyMember ? 'major' : (consensusTargetEliminated || betrayerVotedForEliminated) ? 'minor' : 'moderate';

      // ── DETECTION GATE: does the alliance actually pin the flip on THEM? (open votes are public.)
      // Fewer players left = obvious (matches "when there's not a lot left, they know"); sharp allies
      // read it; a known flipper is the first suspect; a lone rogue vote is glaring while a bloc diffuses
      // blame; and a smooth operator (high social+strategic) covers their tracks. ──
      const _bs = pStats(voter);
      const _knownFlips = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === voter).length, 0);
      // FIELD SIZE is the dominant lever: at the final few a flip is near-impossible to hide; in a big
      // tribe your vote is one of many. Cover (social+strategic), a sharp ally's read, a repeat-flipper
      // reputation, lone-vs-bloc, and voting an ally all nudge it from there.
      let _detectP = 0.45
        + (8 - _numLeft) * 0.07                        // final 4: +0.28 · 8 left: 0 · 12: -0.28 · 16: -0.56
        + (_isLone ? 0.15 : -0.12)                      // a lone rogue vote is glaring; a bloc diffuses blame
        + _knownFlips * 0.10                             // known flipper = first suspect
        + (votedForAllyMember ? 0.12 : 0)               // voting an ally is more noticeable
        + _bestRead * 0.02                              // a sharp/perceptive ally reads it
        - (_bs.social + _bs.strategic - 10) * 0.022;    // smooth operator covers tracks (avg-5 = no effect)
      _detectP = Math.max(0.05, Math.min(0.97, _detectP));
      // GRADUAL FLOOR as the field thins: fewer suspects = harder to hide, climbing smoothly rather than
      // in a cliff. Starts easing in around 11, reaches ~nearly-impossible by 6-7 even for a smooth operator.
      const _detectFloor = Math.max(0, Math.min(0.96, (11.5 - _numLeft) * 0.15));
      _detectP = Math.max(_detectP, _detectFloor);
      const _detected = !!ep.openVote || Math.random() < _detectP;

      // ── DEBUG LOG: record every flip's detection outcome for the Hidden Moves tab (the true story) ──
      const _dbg = { player: voter, alliance: alliance.name, votedFor: betrayerVotedFor, consensusWas: consensusVote,
        votedAlly: votedForAllyMember, severity: _betrayalSeverity,
        detected: _detected, detectP: +_detectP.toFixed(2), open: !!ep.openVote, reactor: null, wrongSuspect: null };
      (ep._flipDetectionLog = ep._flipDetectionLog || []).push(_dbg);

      if (!_detected) {
        // ── UNDETECTED: the flip got away with it. No punishment to the betrayer; log as a secret for
        // history/VP — the alliance ledger only tracks betrayals it actually KNOWS about (so dissolution
        // and track-record stay honest). Then an impulsive loyal member may blame the WRONG person. ──
        (ep._secretBetrayals = ep._secretBetrayals || []).push({ player: voter, alliance: alliance.name, votedFor: betrayerVotedFor, severity: _betrayalSeverity, ep: ep.num });
        const _mis = _misattributeBlame(ep, alliance, voter, betrayerVotedFor, _loyalReaders, _betrayalSeverity, consensusVote, ep.eliminated);
        if (_mis) { _dbg.reactor = _mis.reactor; _dbg.wrongSuspect = _mis.wrongSuspect; }
        // Surface it to the VIEWER next episode (dramatic irony — the cast never learns it). ALL
        // undetected flips are surfaced so the viewer always knows a rank was broken, even with debug off;
        // the camp-event handler scales the treatment by severity (full betrayal vs a lighter stray vote).
        if (!gs.secretFlipsLastEp) gs.secretFlipsLastEp = [];
        gs.secretFlipsLastEp.push({ traitor: voter, alliance: alliance.name, votedFor: betrayerVotedFor,
          consensusWas: consensusVote, votedAlly: votedForAllyMember,
          severity: _betrayalSeverity, reactor: _mis?.reactor || null, wrongSuspect: _mis?.wrongSuspect || null });
        return;
      }

      // ── DETECTED: recorded + punished (original behavior) ──
      alliance.betrayals.push({ player: voter, ep: ep.num, votedFor: entry.voted, consensusWas: consensusVote, formedThisEp, reason: entry.reason || '', severity: _betrayalSeverity });
      recordDetectedBetrayalKnowledge({
        traitor: voter,
        votedFor: betrayerVotedFor,
        witnesses: _loyalReaders,
        ep: ep.num,
      });
      // Queue a dedicated camp confrontation for MAJOR/MODERATE detected betrayals (the caught traitor
      // faces the alliance's reckoning next episode). Minor stray votes don't warrant a confrontation.
      // Skip if the traitor was themselves voted out (nothing to confront). Consumed in camp-events.js.
      if (_betrayalSeverity !== 'minor' && gs.activePlayers.includes(voter)) {
        if (!gs.detectedFlipsLastEp) gs.detectedFlipsLastEp = [];
        gs.detectedFlipsLastEp.push({ traitor: voter, alliance: alliance.name, votedFor: betrayerVotedFor,
          consensusWas: consensusVote, votedAlly: votedForAllyMember, severity: _betrayalSeverity,
          allyEliminated: votedForAllyMember && betrayerVotedForEliminated });
      }
      // Scale bond cost by impact + severity
      let bondCost;
      if (votedForAllyMember) {
        // Voted for someone IN the alliance — worst betrayal, personal
        bondCost = consensusTargetEliminated ? -2.0 : -3.0;
      } else if (betrayerVotedForEliminated) {
        bondCost = -0.5;  // went rogue but voted the right person — disrespectful, not devastating
      } else if (consensusTargetEliminated) {
        bondCost = -0.75; // broke unity but consensus target still went home — wasted vote
      } else {
        bondCost = -1.5;  // consensus target survived — rogue vote may have cost someone's game
      }
      alliance.members.filter(m => m !== voter && gs.activePlayers.includes(m)).forEach(other => {
        // Betraying someone who was ACTUALLY loyal hurts more — based on their betrayal record, not their stat
        const _victimBetrayalCount = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === other).length, 0);
        const _victimWasLoyal = _victimBetrayalCount === 0; // never betrayed anyone
        const _loyaltyMultiplier = _victimWasLoyal ? 1.3 : _victimBetrayalCount <= 1 ? 1.1 : 1.0;
        addBond(voter, other, bondCost * _loyaltyMultiplier);
        // The old bond is mutual for compatibility. The richer reaction is
        // directional: the betrayed ally loses trust and gains resentment.
        addRelationshipDimension(other, voter, 'trust', bondCost * 0.7 * _loyaltyMultiplier);
        addRelationshipDimension(other, voter, 'resentment', Math.abs(bondCost) * 0.8 * _loyaltyMultiplier);
      });
      const newAllianceNote = formedThisEp
        ? ` (alliance formed this episode — bonds never had time to solidify)`
        : '';
      entry.reason = (entry.reason ? entry.reason + ' — ' : '') + `broke ${alliance.name}${newAllianceNote}`;
    });
  });
  // Deactivate alliances whose membership is now too small (< 2 active)
  gs.namedAlliances.forEach(alliance => {
    const activeCount = alliance.members.filter(m => gs.activePlayers.includes(m)).length;
    if (activeCount < 2) alliance.active = false;
  });
}

// Exposed negotiation is not automatically betrayal: credible alliance witnesses
// react in proportion to the organizer's eventual ballot and prior incidents.
export function applyPitchAllianceFallout(ep) {
  if (!ep?.votePitches?.length || !ep?.pitchIntel?.length || !gs.namedAlliances?.length) return [];
  const ballot = new Map((ep.votingLog || []).map(v => [v.voter, v.voted]));
  const fallout = [];
  ep.votePitches.forEach(pitch => {
    const organizer = pitch.pitcher;
    if (!organizer || !gs.activePlayers.includes(organizer)) return;
    gs.namedAlliances.filter(a => a.active && a.members?.includes(organizer)).forEach(alliance => {
      const planTarget = (ep.alliances || []).find(a => a.label === alliance.name)?.target;
      if (!planTarget || planTarget === pitch.pitchTarget) return;
      const witnesses = (ep.pitchIntel || []).filter(info => info.pitcher === organizer
        && info.target === pitch.pitchTarget && info.believed && info.confidence >= 0.55
        && info.knower !== organizer && alliance.members.includes(info.knower));
      if (!witnesses.length) return;
      alliance.pitchIncidents = alliance.pitchIncidents || [];
      const prior = alliance.pitchIncidents.filter(i => i.player === organizer).length;
      const actual = ballot.get(organizer) || null;
      const followedPitch = actual === pitch.pitchTarget;
      const targetedAlly = alliance.members.includes(pitch.pitchTarget);
      const outcome = followedPitch ? 'confirmed-break' : targetedAlly ? 'attempted-internal-hit' : 'backed-down';
      const severity = followedPitch && targetedAlly ? 'major' : followedPitch || targetedAlly ? 'moderate' : 'warning';
      const incident = { player: organizer, alliance: alliance.name, target: pitch.pitchTarget,
        planTarget, outcome, severity, witnesses: [...new Set(witnesses.map(w => w.knower))],
        source: [...witnesses].sort((a, b) => b.confidence - a.confidence)[0]?.source || null,
        confidence: Math.max(...witnesses.map(w => w.confidence)), ep: ep.num, repeat: prior > 0 };
      alliance.pitchIncidents.push(incident);
      const bondCost = severity === 'major' ? -1.2 : severity === 'moderate' ? -0.7 : -0.3;
      incident.witnesses.forEach(member => {
        addBond(member, organizer, bondCost);
        rememberStrategy(member, organizer, 'exposed-alliance-pitch', ep.num,
          severity === 'major' ? 2 : severity === 'moderate' ? 1.35 : 0.65,
          { alliance: alliance.name, target: pitch.pitchTarget, outcome });
      });
      if (severity !== 'warning' || prior > 0) {
        gs.strategyExclusions = gs.strategyExclusions || {};
        gs.strategyExclusions[organizer] = { alliance: alliance.name, untilEp: ep.num + 1,
          reason: followedPitch ? 'confirmed exposed pitch' : 'repeated exposed pitch' };
        incident.excluded = true;
        alliance.members = [...alliance.members.filter(m => m !== organizer), organizer];
      }
      const alreadyRecorded = (alliance.betrayals || []).some(b => b.player === organizer && b.ep === ep.num);
      if (prior > 0 && !alreadyRecorded) {
        alliance.betrayals = alliance.betrayals || [];
        alliance.betrayals.push({ player: organizer, ep: ep.num, votedFor: actual,
          consensusWas: planTarget, reason: `repeated exposed pitch against ${pitch.pitchTarget}`,
          severity: targetedAlly ? 'major' : 'moderate', pitchAttempt: true });
      }
      fallout.push(incident);
    });
  });
  ep.pitchAllianceFallout = fallout;
  return fallout;
}

export function resolveAllianceRepair(incident, epNum = (gs.episode || 0) + 1, roll = Math.random) {
  if (!incident?.traitor || !incident?.alliance) return null;
  const alliance = (gs.namedAlliances || []).find(a => a.name === incident.alliance && a.active);
  if (!alliance || !alliance.members.includes(incident.traitor)) return null;
  const traitor = incident.traitor;
  const peers = alliance.members.filter(m => m !== traitor && gs.activePlayers.includes(m));
  if (!peers.length) return null;
  gs.allianceRepairHistory = gs.allianceRepairHistory || [];
  const previous = gs.allianceRepairHistory.filter(r => r.player === traitor && r.alliance === alliance.name);
  const stats = pStats(traitor);
  const repeatPenalty = Math.min(0.35, previous.length * 0.12);
  const priorFalseDenial = previous.some(r => r.approach === 'denial' && r.evidenceWasClear);

  let approach;
  if (stats.loyalty >= 7 || stats.temperament >= 7) approach = 'apology';
  else if (stats.strategic >= 7) approach = 'strategic-explanation';
  else if (stats.boldness >= 7 && stats.loyalty <= 4) approach = 'refusal';
  else approach = 'denial';
  const evidenceWasClear = !!incident.votedAlly || incident.severity === 'major' || incident.allyEliminated;
  let credibility = approach === 'apology'
    ? 0.30 + stats.social * 0.045 + stats.loyalty * 0.025
    : approach === 'strategic-explanation'
      ? 0.24 + stats.strategic * 0.05 + stats.social * 0.025
      : approach === 'denial'
        ? 0.34 + stats.social * 0.035 - (evidenceWasClear ? 0.30 : 0.08)
        : 0.12 + stats.boldness * 0.015;
  credibility = Math.max(0.05, Math.min(0.92, credibility - repeatPenalty - (priorFalseDenial ? 0.18 : 0)));

  const reactions = peers.map(peer => {
    const ps = pStats(peer);
    const bond = getBond(peer, traitor);
    const personallyTargeted = incident.votedFor === peer;
    let acceptChance = 0.12 + credibility * 0.48 + Math.max(-2, Math.min(5, bond)) * 0.045
      + ps.strategic * 0.018 - ps.loyalty * 0.012
      - (personallyTargeted ? 0.28 : 0) - (incident.allyEliminated ? 0.20 : 0)
      - (approach === 'refusal' ? 0.22 : 0);
    acceptChance = Math.max(0.03, Math.min(0.88, acceptChance));
    return { player:peer, accepted:roll() < acceptChance, acceptChance, personallyTargeted };
  });
  const accepted = reactions.filter(r => r.accepted).length;
  const acceptanceRate = accepted / reactions.length;
  const outcome = acceptanceRate >= 0.67 && approach !== 'refusal' ? 'forgiven'
    : acceptanceRate >= 0.34 ? 'working-truce'
      : (evidenceWasClear || previous.length) ? 'fracture' : 'rejected';
  const result = { player:traitor, alliance:alliance.name, approach, credibility, evidenceWasClear,
    outcome, reactions, accepted, total:reactions.length, ep:epNum, repeatAttempt:previous.length > 0 };

  if (outcome === 'forgiven') {
    peers.forEach(peer => addBond(peer, traitor, approach === 'apology' ? 0.55 : 0.35));
    if (gs.strategyExclusions?.[traitor]?.alliance === alliance.name) delete gs.strategyExclusions[traitor];
  } else if (outcome === 'working-truce') {
    peers.filter(peer => reactions.find(r => r.player === peer)?.accepted).forEach(peer => addBond(peer, traitor, 0.18));
    gs.strategyExclusions = gs.strategyExclusions || {};
    gs.strategyExclusions[traitor] = { alliance:alliance.name, untilEp:epNum, reason:'working relationship without restored trust' };
  } else {
    peers.forEach(peer => addBond(peer, traitor, outcome === 'fracture' ? -0.45 : -0.2));
    gs.strategyExclusions = gs.strategyExclusions || {};
    gs.strategyExclusions[traitor] = { alliance:alliance.name, untilEp:epNum + 2, reason:'repair attempt failed' };
  }
  const betrayal = [...(alliance.betrayals || [])].reverse().find(b => b.player === traitor);
  if (betrayal) betrayal.repairOutcome = outcome;
  gs.allianceRepairHistory.push(result);
  return result;
}

export function formAlliances(members, tribeLabel, challengeLabel) {
  if (members.length <= 1) return [];
  const alliances = [];
  const present = new Set(members);
  const _lostVoteSet = new Set([...(gs.lostVoteThisEp || []), ...(gs.lostVotes || [])]);
  const _canVote = name => present.has(name) && !_lostVoteSet.has(name);
  const _eligibleMembers = members.filter(_canVote);

  // Active named alliances with 2+ members present at tribal
  // Use full active players for membership check (immune players still coordinate with their alliance)
  const _allAtTribal = new Set([...present, ...(gs._currentImmuneNames || []).filter(n => gs.activePlayers?.includes(n))]);
  const activeNamed = (gs.namedAlliances || []).filter(a =>
    a.active && a.members.filter(m => _allAtTribal.has(m)).length >= 2
  );

  // ── Try to form majority from the largest named alliance first ──
  const _alliancesBySize = activeNamed
    .map(a => ({ alliance: a, present: a.members.filter(m => _allAtTribal.has(m)) }))
    .filter(a => a.present.length >= 2)
    .sort((a,b) => b.present.filter(_canVote).length - a.present.filter(_canVote).length || b.present.length - a.present.length);

  // ── Build majority: start from the largest alliance core, recruit to majority ──
  let majority, minority, hub;
  const majSize = coalitionMajority(members, _lostVoteSet).majority;
  const _bestAlliance = _alliancesBySize[0];

  if (_bestAlliance && _bestAlliance.present.length >= 2) {
    // Named alliance forms the CORE — recruit non-members by affinity to reach majority
    const core = [..._bestAlliance.present];
    hub = core.sort((a,b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.social + sb.strategic) - (sa.social + sa.strategic);
    })[0];

    // Recruit from non-core members by bond with the hub + alliance affinity
    const nonCore = members.filter(m => !core.includes(m) && _canVote(m));
    const recruited = nonCore
      .map(m => ({
        name: m,
        score: getBond(hub, m) * 1.5
          + core.reduce((s, c) => s + getBond(m, c), 0) / core.length * 0.5 // avg bond with core
          + (activeNamed.some(a => a !== _bestAlliance.alliance && a.members.includes(m) && a.members.includes(hub)) ? 3 : 0) // shared other alliance
          + Math.random() * 0.5
      }))
      .sort((a,b) => b.score - a.score);

    // Fill up to majority size
    const needed = Math.max(0, majSize - core.filter(_canVote).length);
    const recruits = recruited.slice(0, needed).filter(r => r.score > -1).map(r => r.name);
    majority = [...core, ...recruits];
    minority = members.filter(m => !majority.includes(m));
    majority.sort();
  } else {
    // No named alliance present — fall back to hub-affinity system
    const hubScore = n => {
      const s = pStats(n);
      const namedBonus = activeNamed.some(a => a.members.includes(n)) ? 2 : 0;
      return s.social * 0.5 + s.strategic * 0.5 + namedBonus + Math.random() * 0.5;
    };
    hub = [...(_eligibleMembers.length ? _eligibleMembers : members)].sort((a,b) => hubScore(b)-hubScore(a))[0];

    const affinityFor = other => {
      const bond = getBond(hub, other);
      const sh = pStats(hub), so = pStats(other);
      const compat = (sh.social + so.social) / 20;
      const rel = relationships.find(r => [r.a,r.b].sort().join('|') === [hub,other].sort().join('|'));
      const ubBonus = rel?.type === 'unbreakable' ? 5 : 0;
      const rivalPenalty = (rel?.type === 'rival' || rel?.type === 'enemy') ? -4 : 0;
      return bond + compat*2 + ubBonus + rivalPenalty + (Math.random()-0.5)*0.4;
    };

    const others = _eligibleMembers.filter(m => m!==hub).sort((a,b) => affinityFor(b)-affinityFor(a));
    majority = [hub, ...others.slice(0, majSize-1)];
    minority = members.filter(m => !majority.includes(m));
    majority.sort();
  }
  majority.sort();

  // Measure how bonded a group is (avg pairwise bond)
  const groupBondStrength = grp => {
    if (grp.length < 2) return 0;
    let total = 0, pairs = 0;
    for (let i = 0; i < grp.length; i++)
      for (let j = i+1; j < grp.length; j++) { total += getBond(grp[i], grp[j]); pairs++; }
    return total / pairs;
  };
  const hasUB = (grp) => grp.some(a => grp.some(b => a !== b &&
    relationships.find(r => [r.a,r.b].sort().join('|') === [a,b].sort().join('|'))?.type === 'unbreakable'
  ));
  // Generate a creative label when no named alliance matches.
  // Size labels (Three/Trio/Four) are based on actual voters — players who lost their vote
  // this episode are excluded so a 3-person group where one can't vote isn't called "a Trio".
  const lostVoteThisEp = new Set((gs.lostVoteThisEp || []));
  const fallbackLabel = (grp, lead, target) => {
    const voterCount = grp.filter(m => !lostVoteThisEp.has(m)).length || grp.length;
    const duoNames = [`The ${grp[0]} & ${grp[1]} Pact`, `The ${grp[0]}-${grp[1]} Duo`];
    if (voterCount <= 2) return duoNames[Math.floor(Math.random() * duoNames.length)];
    const options = [
      `${lead}'s Bloc`,
      `The ${lead} Core`,
    ];
    if (target) {
      options.push(`Anti-${target} Bloc`, `Anti-${target} Front`, `The Anti-${target} Coalition`);
    }
    if (voterCount === 3) options.push(`${lead}'s Three`, `The ${lead} Trio`);
    else if (voterCount === 4) options.push(`The ${lead} Four`, `${lead}'s Four`);
    else options.push(`${lead}'s Alliance`, `The ${lead} Majority`);
    return options[Math.floor(Math.random() * options.length)];
  };
  // Classify a voting group: find matching named alliance, else use bonds to distinguish
  const classifyGroup = (grp, lead, target) => {
    // Mostly matches one named alliance?
    const match = activeNamed.find(a => {
      const presentAlly = a.members.filter(m => present.has(m));
      const overlap = grp.filter(m => presentAlly.includes(m));
      return overlap.length >= Math.ceil(grp.length * 0.6) && overlap.length >= 2;
    });
    if (match) return { label: match.name, type: 'alliance' };
    // Multiple named alliances coordinating this vote — require majority overlap to use that alliance's name
    const covered = activeNamed.filter(a => {
      const presentAlly = a.members.filter(m => present.has(m));
      const overlap = grp.filter(m => presentAlly.includes(m));
      return overlap.length >= Math.ceil(grp.length * 0.5) && overlap.length >= 2;
    });
    if (covered.length >= 2) return { label: covered.slice(0,2).map(a => a.name).join(' + '), type: 'consensus' };
    if (covered.length === 1) return { label: covered[0].name, type: 'consensus' };
    // No named alliance — use bond strength + loyalty + unbreakable bonds to decide
    const avgBond = groupBondStrength(grp);
    const avgLoyalty = grp.reduce((s, n) => s + pStats(n).loyalty, 0) / grp.length;
    const isRealAlliance = hasUB(grp) || avgBond >= 2 || (avgBond >= 0.8 && avgLoyalty >= 6);
    return { label: fallbackLabel(grp, lead, target), type: isRealAlliance ? 'alliance' : 'consensus' };
  };

  const majTarget = pickTarget(majority, minority, challengeLabel);
  const { label: majLabel, type: majType } = classifyGroup(majority, hub, majTarget);
  // Guard: a named alliance must never have one of its own members as its stated target.
  // Exception: if bonds have genuinely deteriorated, allow the betrayal — but first remove the
  // player from the alliance (pre-tribal fracture) so the departure shows up before the vote.
  const _resolveAllianceTarget = (na, target, attackers, victims) => {
    if (!na || !na.members.includes(target)) return target; // not a conflict
    const _allies = na.members.filter(m => m !== target && present.has(m));
    const _avgBond = _allies.length
      ? _allies.reduce((sum, m) => sum + getBond(m, target), 0) / _allies.length : 0;
    const _ts = pStats(target);
    const _priorBetrayal = na.betrayals?.some(b => b.voter === target);
    // Bonds degraded enough OR member already betrayed the group: justified fracture
    const _justified = _avgBond < 0 || (_avgBond < 1.5 && _ts.loyalty <= 4) || _priorBetrayal;
    if (_justified) {
      // Remove from alliance pre-tribal — they're effectively cut loose before the vote
      na.members = na.members.filter(m => m !== target);
      na.quits = na.quits || [];
      na.quits.push({ player: target, ep: gs.episodeNum || 0, reason: 'alliance turned' });
      if (na.members.filter(m => gs.activePlayers.includes(m)).length < 2) na.active = false;
      gs._pendingDepartures = gs._pendingDepartures || [];
      gs._pendingDepartures.push({ player: target, alliance: na.name, reason: 'alliance turned' });
      return target; // now safe — they've been removed
    }
    // Not justified — redirect to an external player
    return pickTarget(attackers, victims.filter(m => !na.members.includes(m)), challengeLabel) || null;
  };

  // If majority was built from a named alliance core, force the label to that alliance name
  const _majForceLabel = _bestAlliance?.alliance?.name || null;
  const _majFinalLabel = _majForceLabel || majLabel;
  const _majFinalType = _majForceLabel ? 'alliance' : majType;
  const _majNa = _majFinalType === 'alliance' ? activeNamed.find(a => a.name === _majFinalLabel) : null;
  const _majSafeTarget = _resolveAllianceTarget(_majNa, majTarget, majority, minority) ?? majTarget;
  alliances.push({ members: majority, target: _majSafeTarget, label: _majFinalLabel, type: _majFinalType, tribe: tribeLabel, challengeLabel });

  if (minority.length >= 2) {
    // ── Check if minority has its own named alliance(s) to coordinate counter-vote ──
    const _minAlliancesUsed = new Set();
    const _minAllianceBlocs = [];
    _alliancesBySize.forEach(({ alliance, present: aPresent }) => {
      if (alliance === _bestAlliance?.alliance) return; // skip the majority alliance
      const minMembers = aPresent.filter(m => minority.includes(m));
      if (minMembers.length < 2) return;
      if (minMembers.every(m => _minAlliancesUsed.has(m))) return; // all already in a bloc
      minMembers.forEach(m => _minAlliancesUsed.add(m));
      const minTarget = pickTarget(minMembers, majority, challengeLabel);
      const _minNa = alliance;
      const _minSafeTarget = _resolveAllianceTarget(_minNa, minTarget, minMembers, majority) ?? minTarget;
      _minAllianceBlocs.push({ members: minMembers, target: _minSafeTarget, label: _minNa.name, type: 'alliance', tribe: tribeLabel, challengeLabel });
    });
    if (_minAllianceBlocs.length) {
      _minAllianceBlocs.forEach(bloc => alliances.push(bloc));
      // Remaining minority members not in any alliance bloc vote as a loose group or solo
      const _unaligned = minority.filter(m => !_minAlliancesUsed.has(m));
      if (_unaligned.length >= 2) {
        const _uLead = _unaligned.sort((a,b) => (pStats(b).social + pStats(b).strategic) - (pStats(a).social + pStats(a).strategic))[0];
        const _uTarget = pickTarget(_unaligned, majority, challengeLabel);
        const { label: _uLabel, type: _uType } = classifyGroup(_unaligned, _uLead, _uTarget);
        alliances.push({ members: _unaligned, target: _uTarget, label: _uLabel, type: _uType, tribe: tribeLabel, challengeLabel });
      }
      // Solo unaligned players still need a vote entry
      _unaligned.filter(m => _unaligned.length < 2 || !alliances.some(a => a.members.includes(m))).forEach(solo => {
        alliances.push({ members: [solo], target: pickTarget([solo], majority, challengeLabel), label: 'Solo', type: 'solo', tribe: tribeLabel, challengeLabel });
      });
    } else {
      // No minority alliance — original behavior: bond-based or solo
      const minAvgBond = groupBondStrength(minority);
      if (minAvgBond > 0 || hasUB(minority)) {
        const _minHubScore = n => { const s = pStats(n); return s.social * 0.5 + s.strategic * 0.5 + Math.random() * 0.5; };
        const minLead = minority.slice().sort((a,b) => _minHubScore(b)-_minHubScore(a))[0];
        const minTarget = pickTarget(minority, majority, challengeLabel);
        const { label: minLabel, type: minType } = classifyGroup(minority, minLead, minTarget);
        const _minNa = minType === 'alliance' ? activeNamed.find(a => a.name === minLabel) : null;
        const _minSafeTarget = _resolveAllianceTarget(_minNa, minTarget, minority, majority) ?? minTarget;
        alliances.push({ members: minority, target: _minSafeTarget, label: minLabel, type: minType, tribe: tribeLabel, challengeLabel });
      }
    }
  } else if (minority.length === 1) {
    alliances.push({ members: minority, target: pickTarget(minority, majority, challengeLabel), label: 'Solo', type: 'solo', tribe: tribeLabel, challengeLabel });
  }

  // Add ALL remaining named alliances as their own voting blocs
  // Every alliance with 2+ members at tribal gets a plan — they coordinated for a reason
  activeNamed.forEach(na => {
    const naMembers = na.members.filter(m => _allAtTribal.has(m));
    if (naMembers.length < 2) return;
    if (alliances.some(a => a.label === na.name)) return; // already used
    const targets = members.filter(m => !naMembers.includes(m) && !gs._currentImmuneNames?.includes(m));
    if (!targets.length) return;
    alliances.push({ members: naMembers, target: pickTarget(naMembers, targets, challengeLabel), label: na.name, type: 'alliance', tribe: tribeLabel, challengeLabel });
  });

  // ── SPLIT VOTE: evaluate each alliance for idol-flush split ──
  alliances.forEach(a => {
    const _eligibleAllianceMembers = a.members.filter(_canVote);
    if (a.type === 'solo' || _eligibleAllianceMembers.length < 4) return; // need 4+ actual ballots to split
    if (!a.target) return;
    const _atTribal = _eligibleAllianceMembers;
    if (_atTribal.length < 4) return;

    // Check: confirmed idol on target?
    const _idolRead = allianceIdolRead(a.target, _atTribal);
    const _confirmedIdol = _idolRead.confirmed;
    // Check: suspected idol? Strategic roll.
    const _maxStrategic = Math.max(..._atTribal.map(m => pStats(m).strategic));
    const _organicSuspicion = !_confirmedIdol && !_idolRead.suspected && threatScore(a.target) >= 2.0 && Math.random() < _maxStrategic * 0.06;
    if (_organicSuspicion) {
      const _reader = [..._atTribal].sort((x,y) => (pStats(y).strategic + pStats(y).intuition) - (pStats(x).strategic + pStats(x).intuition))[0];
      recordIdolIntel(_reader, a.target, { source:'strategic suspicion', confidence:0.58, truth:'unknown' });
    }
    const _finalIdolRead = _organicSuspicion ? allianceIdolRead(a.target, _atTribal) : _idolRead;
    const _suspectedIdol = !_confirmedIdol && _finalIdolRead.suspected;

    if (!_confirmedIdol && !_suspectedIdol) return;

    // Pick secondary target: primary's closest ally outside the alliance
    const _nonAlliance = members.filter(m => !a.members.includes(m) && m !== a.target
      && !(gs._currentImmuneNames || []).includes(m));
    let _secondary = null;
    // Option C: closest ally of primary target (bond >= 2)
    const _primaryAllies = _nonAlliance
      .filter(m => getBond(a.target, m) >= 2)
      .sort((x, y) => getBond(a.target, y) - getBond(a.target, x));
    if (_primaryAllies.length) {
      _secondary = _primaryAllies[0];
    } else {
      // Fallback A: lowest-threat non-immune outside alliance
      const _safe = _nonAlliance.sort((x, y) => threatScore(x) - threatScore(y));
      if (_safe.length) _secondary = _safe[0];
    }
    if (!_secondary) return;

    // Assign voters: majority on primary, minority on secondary
    // Bond protection: if voter has bond >= 3 with secondary, force to primary group
    const _primaryGroup = [];
    const _secondaryGroup = [];
    const _secondaryCount = _atTribal.length <= 4 ? 1 : 2;
    // Sort by bond with secondary (lowest bond = best candidate for secondary group)
    const _sorted = [..._atTribal].sort((x, y) => getBond(x, _secondary) - getBond(y, _secondary));
    _sorted.forEach((m, i) => {
      if (_secondaryGroup.length < _secondaryCount && getBond(m, _secondary) < 3) {
        _secondaryGroup.push(m);
      } else {
        _primaryGroup.push(m);
      }
    });
    // If we couldn't fill secondary group (everyone has bond >= 3 with secondary), skip split
    if (!_secondaryGroup.length) return;

    // A split is only rational if both assignments are trustworthy and each
    // half can beat the strongest currently visible competing plan. Membership
    // alone is not treated as a guaranteed ballot.
    const _reliableVoters = _atTribal.filter(voter => {
      const s = pStats(voter);
      const allies = _atTribal.filter(m => m !== voter);
      const avgBond = allies.length ? allies.reduce((sum, m) => sum + getPerceivedBond(voter, m), 0) / allies.length : 0;
      const assignedTarget = _secondaryGroup.includes(voter) ? _secondary : a.target;
      const targetBond = getPerceivedBond(voter, assignedTarget);
      return s.loyalty >= 5 && avgBond >= 0 && targetBond < 3 && getPlayerState(voter).emotional !== 'desperate';
    });
    const _competingPlans = alliances.filter(other => other !== a && other.target && other.target !== a.target && other.target !== _secondary);
    const _strongestOpposition = Math.max(0, ..._competingPlans.map(other =>
      other.members.filter(v => _canVote(v) && !a.members.includes(v)).length
    ));
    const _safety = evaluateSplitVoteSafety({
      primaryVoters: _primaryGroup, backupVoters: _secondaryGroup,
      eligibleVoterCount: members.filter(_canVote).length,
      strongestOpposition: _strongestOpposition, reliableVoters: _reliableVoters,
      idolKnown: _confirmedIdol, idolSuspected: _suspectedIdol,
    });
    a.splitEvaluation = _safety;
    a.idolKnowledge = _finalIdolRead;
    if (!_safety.safe) {
      a.splitRejected = _safety.rejectionReason;
      return;
    }

    // Decorate the alliance object
    a.splitTarget = _secondary;
    a.splitPrimary = _primaryGroup;
    a.splitSecondary = _secondaryGroup;
    a.splitReason = _confirmedIdol ? 'confirmed-idol' : 'suspected-idol';
  });

  return alliances;
}

export function pickTarget(attackers, victims, challengeLabel) {
  // Filter out immune players — can't target someone with immunity
  const _immune = new Set([
    ...(gs._currentImmuneNames || []),
    ...(gs.guaranteedImmuneThisEp ? [gs.guaranteedImmuneThisEp] : []),
  ]);
  const _filteredVictims = victims.filter(v => !_immune.has(v));
  // Tied Destinies: never target someone who is a TD partner of one of the attackers (suicide vote)
  const _tdPairs = gs._tiedDestiniesActive || [];
  const _tdFiltered = _filteredVictims.filter(v => {
    return !_tdPairs.some(p => (p.a === v && attackers.includes(p.b)) || (p.b === v && attackers.includes(p.a)));
  });
  const _victims = (_tdFiltered.length ? _tdFiltered : _filteredVictims.length ? _filteredVictims : victims);
  if (!_victims.length) return null;
  const phase = gs?.phase || 'pre-merge';
  // Hub personality: the lead attacker's stats influence what kind of target they prioritize
  const _hub = attackers[0];
  const _hubS = _hub ? pStats(_hub) : null;
  return wRandom(_victims, v => {
    const avgBond = attackers.reduce((sum,a) => sum+getPerceivedBond(a,v), 0) / attackers.length;
    if (phase === 'pre-merge') {
      const s = pStats(v);
      const dramaRisk = (s.boldness > 7 && s.loyalty < 5) ? 1.5 : 0;
      // Pre-merge: challenge weakness matters but bonds, threat, and personal friction also drive votes
      // Strong players CAN be targeted if relationships are bad enough or they're strategic threats
      const _cwScore = challengeWeakness(v, challengeLabel);
      const _threatMod = threatScore(v) >= 2.5 ? (threatScore(v) - 2.0) * 0.3 : 0; // emerging threats targetable even pre-merge
      // Solo/unallied players are easier targets — no one fights for them
      const _hasAlliance = (gs.namedAlliances || []).some(a => a.active && a.members.includes(v) && a.members.some(m => m !== v && attackers.includes(m) === false));
      const _soloMod = _hasAlliance ? 0 : 0.4;
      const _volunteerModPre = gs._volunteerDuelHeat?.[v] === ((gs.episode || 0) + 1) ? 5.0 : 0;
      return Math.max(0.1, _cwScore * 0.35 + (-avgBond) * 0.35 + _threatMod + dramaRisk + _soloMod + _volunteerModPre + Math.random() * 0.5);
    } else {
      const allAtTribal = [...attackers, v];
      const maxBond = allAtTribal.filter(p => p !== v).reduce((m, p) => Math.max(m, getPerceivedBond(p, v)), 0);
      const pairThreat = (maxBond >= 8 ? 1.0 : maxBond >= 7 ? 0.5 : 0)
                       + (gs.showmances?.some(sm => sm.phase !== 'broken-up' && sm.players?.includes(v)) ? 0.5 : 0);
      const standoutMod = gs._chalStandouts?.includes(v) ? 0.35 : 0;
      // Hub personality shifts targeting priority
      let personalityMod = 0;
      if (_hubS) {
        const vs = pStats(v);
        // Strategic hubs target other strategic threats (cut the competition)
        if (_hubS.strategic >= 7) personalityMod += vs.strategic >= 7 ? 1.0 : 0;
        // Social hubs target antisocial players (they can't be controlled)
        if (_hubS.social >= 7) personalityMod += vs.social <= 4 ? 0.5 : vs.social >= 8 ? 0.8 : 0;
        // Proportional personality targeting
        personalityMod += _hubS.boldness * 0.03 * Math.max(vs.physical, vs.endurance) * 0.1; // bold targets physical threats
        personalityMod += _hubS.loyalty * 0.07 * Math.max(0, (5 - vs.loyalty) * 0.2); // loyal targets disloyal
        if (gs.knownIdolHoldersThisEp?.has(v)) personalityMod += _hubS.intuition * 0.15; // intuitive targets known idol holders
      }
      // Known Second Life Amulet holder — personality-driven reaction
      let _amuletMod = 0;
      if (gs.knownAmuletHoldersThisEp?.has(v) && _hubS) {
        const _hubAvgDuel = (_hubS.physical + _hubS.endurance + _hubS.mental) / 3;
        const _vAvgDuel   = (pStats(v).physical + pStats(v).endurance + pStats(v).mental) / 3;
        if (_hubAvgDuel >= 6 || (_hubS.boldness * 0.1 > Math.random() && _hubAvgDuel > _vAvgDuel)) {
          // Proportional: confident in duel based on actual stats
          _amuletMod = Math.max(_hubS.physical, _hubS.endurance, _hubS.mental) * 0.15; // stat 6=0.9, stat 8=1.2, stat 10=1.5
        } else if (_hubS.strategic >= 7) {
          // Strategic players: avoid — unpredictable, wastes a vote
          _amuletMod = -2.0;
        } else if (_hubAvgDuel < _vAvgDuel - 1) {
          // Weak players terrified of being picked for the duel
          _amuletMod = -3.0;
        } else {
          // Average players: mild deterrent
          _amuletMod = -1.0;
        }
      }
      // Heat as tiebreaker: existing momentum toward this target from multiple sources
      const _heatMod = computeHeat(v, [...attackers, v], []) * 0.15;
      // Volunteer exile duel: massive targeting boost — they ASKED to go
      const _volunteerMod = gs._volunteerDuelHeat?.[v] === ((gs.episode || 0) + 1) ? 5.0 : 0;
      return Math.max(0.1, threatScore(v) * 0.6 + (-avgBond) * 0.4 + pairThreat + standoutMod + personalityMod + _amuletMod + _heatMod + _volunteerMod + Math.random() * 0.5);
    }
  });
}

export function nameNewAlliance(size) {
  const namesBySize = {
    2: [
      'The Pact', 'The Deal', 'The Bond', 'The Handshake', 'The Oath',
      'The Double Edge', 'The Quiet Two', 'The Tandem', 'The Foundation',
      'The Lifeline', 'The Anchor', 'The Undertow', 'The Signal',
      'The Lock', 'The Bridge', 'The Wire', 'The Thread',
      'The Foxhole', 'The Firewall', 'The Shadow Pact', 'The Backbone',
      'The Last Resort', 'The Safety Net', 'The Iron Grip', 'The Pinky Swear',
      'The Blood Oath', 'The Switchblade', 'The Velvet Rope', 'The Tightrope',
      // Total Drama / Disventure Camp style
      'The Drama Duo', 'The Chaos Pact', 'The Ride or Die', 'The Plot Twist',
      'The Power Couple', 'The Secret Weapon', 'The Wildcard Pact',
      'The Confessional Crew', 'The Elimination Insurance', 'The Marshmallow Pact',
      'The Final Two Deal', 'The Campfire Compact', 'The Dock Deal',
    ],
    3: [
      'The Core', 'The Unit', 'The Trinity', 'The Trio', 'The Trident',
      'The Inner Circle', 'The Nerve Center', 'The Triangle',
      'The Three Headed Snake', 'The Triumvirate', 'The Trifecta',
      'The Wolfpack', 'The Tripwire', 'The Third Rail', 'The Bermuda Triangle',
      'The Hat Trick', 'The Triple Threat', 'The Three Amigos',
      // Total Drama / Disventure Camp style
      'The Drama Triangle', 'The Chaos Trio', 'The Triple Blindside',
      'The Three Torches', 'The Outhouse Alliance',
      'The Camp Legends', 'The Marshmallow Club', 'The Dock Rats',
    ],
    4: [
      'The Four', 'The Bloc', 'The Circle', 'The Core Four',
      'The Fortress', 'The Iron Four', 'The Quadrant', 'The Square',
      'The Four Corners', 'The Citadel', 'The Compound', 'The Grid',
      'The Diamond', 'The Bunker', 'The Stronghold', 'The Four Walls',
      // Total Drama / Disventure Camp style
      'The Final Four Pact', 'The Campfire Four', 'The Drama Squad',
      'The Chaos Crew', 'The Elimination Squad', 'The Four Horsemen',
    ],
  };
  const general = [
    'The Coalition', 'The Power Bloc', 'The Alliance', 'The Majority',
    'The Network', 'The Web', 'The Machine', 'The Engine',
    'The Underground', 'The Current', 'The Pipeline', 'The Assembly',
    'The Syndicate', 'The Collective', 'The Movement', 'The Front',
    'The Guard', 'The Shield Wall', 'The Barricade', 'The War Room',
    // Total Drama / Disventure Camp style
    'The Drama Club', 'The Chaos Brigade',
    'The Confessional Clique', 'The Campfire Crew', 'The Dock Pact',
    'The Marshmallow Mafia', 'The Island Syndicate', 'The Outwit Club',
    'The Blindside Brigade', 'The Torch Carriers', 'The Camp Takeover',
    'The Merge Mob', 'The Tribal Terrors', 'The Immunity Hunters',
    'The Snuff Squad',
  ];
  const pool = [...(namesBySize[size] || []), ...general];
  const used = new Set((gs.namedAlliances || []).map(a => a.name));
  const available = pool.filter(n => !used.has(n));
  return available[Math.floor(Math.random() * available.length)] || `Alliance ${(gs.namedAlliances?.length || 0) + 1}`;
}


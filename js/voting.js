// js/voting.js - Vote simulation, vote reasons, shot in the dark, revotes
import { gs, players, ARCHETYPES, seasonConfig, ADVANTAGES } from './core.js';
import { pStats, pronouns, threatScore, getPlayerState, isAllianceBottom, challengeWeakness, threat } from './players.js';
import { getBond, getPerceivedBond, addBond } from './bonds.js';
import { computeHeat, wRandom } from './alliances.js';

export function buildVoteReason(voter, target, type, ctx = {}) {
  const voterS = pStats(voter);
  const targetS = pStats(target);
  const bond = getPerceivedBond(voter, target);
  const th = threatScore(target);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const priorVotesAgainst = (gs.episodeHistory || []).reduce((n, h) => n + (h.votingLog||[]).filter(v => v.voted === target).length, 0);

  if (type === 'loyal') {
    const { myAlliance, openVote, phase, splitVote } = ctx;
    if (splitVote) return pick([
      `split vote — covering the idol`,
      `split vote — assigned to the backup target`,
      `the alliance split the votes — this is the insurance plan`,
    ]);
    // For consensus groups, invented labels ("The Mike Trio", "Zoey's Three") should NOT appear
    // in vote reasons — they're tactical voting blocs, not real alliances. Use the lead player's
    // name instead. Only real named alliances (gs.namedAlliances) or strong bond-based alliances
    // (type 'alliance') get to use a label.
    const _rawLabel = myAlliance?.label || 'the group';
    const label = (() => {
      if (!myAlliance || myAlliance.type !== 'consensus') return _rawLabel;
      // Consensus: find the lead (highest social+strategic among members, excluding this voter)
      const others = (myAlliance.members || []).filter(m => m !== voter);
      if (!others.length) return 'the group';
      return others.sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.social + sb.strategic) - (sa.social + sa.strategic);
      })[0];
    })();
    if (openVote) return pick([
      `public commitment — standing with ${label}`,
      `${label} has the numbers and they're making it visible`,
      `no reason to hide it — fully aligned with ${label} this vote`,
    ]);
    if (voterS.loyalty >= 8) return pick([
      `loyal to ${label} — not breaking ranks`,
      `${label} made the call and they're committed`,
      `trust is everything out here — following ${label}`,
      `this is what ${label} decided — they don't second-guess that`,
      `${label} has been solid — staying put`,
    ]);
    if (voterS.loyalty >= 5) return pick([
      `following ${label} — it's the right call for now`,
      `${label} has the numbers and this is clean`,
      `${label} agreed on this name — going along with it`,
      `this vote makes sense — staying with ${label}`,
      `goes with ${label}'s read — no reason to deviate`,
    ]);
    return pick([
      `${label} gets the vote this round — convenient alignment`,
      `going with ${label} for now, not out of pure loyalty`,
      `${label}'s agenda lines up with theirs this vote`,
      `follows ${label} — for now`,
    ]);
  }

  if (type === 'spearhead-defect') {
    // Bloc leader who sent their alliance one way and privately voted elsewhere
    const { myAlliance, underlyingReason } = ctx;
    const stated = myAlliance?.target || '?';
    const base = underlyingReason || 'a personal read';
    if (voterS.strategic >= 8) return pick([
      `told ${myAlliance?.label || 'the group'} to vote ${stated} — cast a completely different ballot — ${base}`,
      `ran the plan, then used the cover to quietly eliminate ${target} — ${base}`,
      `the alliance voted where they were pointed; ${voter} had a different endgame in mind — ${base}`,
      `publicly committed to ${stated}, privately chose ${target} — ${base}`,
    ]);
    if (voterS.boldness >= 7) return pick([
      `sent the bloc after ${stated} and slipped a personal vote to ${target} under the chaos — ${base}`,
      `the stated plan was ${stated} — the real plan was ${target} — ${base}`,
      `two targets this tribal: the one they told everyone about (${stated}), and this one — ${base}`,
      `bold move — led the alliance one direction, stepped aside at the last second — ${base}`,
    ]);
    return pick([
      `stated plan was ${stated}, actual vote was ${target} — ${base}`,
      `broke from their own bloc at the last moment — ${base}`,
      `the group followed the plan; ${voter} didn't — ${base}`,
      `went to tribal with a plan, left it at the urn — voted ${target} instead — ${base}`,
    ]);
  }

  if (type === 'conflict-flip') {
    const { conflictAlliance, myAlliance } = ctx;
    const cLabel = conflictAlliance?.label || 'another group';
    const mLabel = myAlliance?.label || 'their alliance';
    return pick([
      `split — ${cLabel} made a more compelling case`,
      `two alliances, one vote — went with ${cLabel}`,
      `${mLabel} had the target but ${cLabel} is where the numbers are going`,
      `couldn't fully commit to ${mLabel} this round — sided with ${cLabel}`,
      `chose ${cLabel} over ${mLabel} — loyalty has a limit`,
      `${mLabel} lost this one — ${cLabel} offered a better deal`,
      `caught between two plans — ${cLabel} felt safer tonight`,
      `${mLabel} pushed too hard — ${cLabel} let them make their own read`,
      `the pitch from ${cLabel} landed better — sometimes it's about delivery`,
    ]);
  }

  if (type === 'grudge') {
    const { myAlliance } = ctx;
    const aLabel = myAlliance?.label || 'the alliance';
    if (bond <= -5) return pick([
      `${aLabel} says one name — but the hatred for ${target} runs deeper than any plan`,
      `this isn't strategy. This is personal. ${target} has made every day out here harder than it needed to be`,
      `the alliance can have opinions. This vote belongs to something older and uglier than a plan`,
      `deep personal animosity — this has been building since before the game`,
    ]);
    if (voterS.boldness >= 7) return pick([
      `broke ranks — can't sit across from ${target} one more tribal and pretend it's fine`,
      `${aLabel} wanted discipline. ${voter}'s grudge wanted ${target} gone. The grudge won`,
      `the plan was someone else. But ${target} has had this coming, and ${voter} is done waiting`,
    ]);
    return pick([
      `can't work with ${target} — the distrust has gotten too personal`,
      `${aLabel} had a target but the relationship with ${target} is beyond repair`,
      `the alliance says vote together. The bond with ${target} says something different`,
      `every conversation with ${target} reminds ${voter} why this vote was always coming`,
    ]);
  }

  if (type === 'preemptive') {
    const { emotional } = ctx;
    return pick([
      `preemptive strike — sensed they were being targeted and hit first`,
      `read the room — the vote was coming their way, they redirected it`,
      `${emotional === 'desperate' ? 'desperate and cornered' : 'paranoid and right'} — identified the source before it was too late`,
      `intuition kicked in — this was the person organizing the vote against them`,
      `struck before being struck — calculated, not reactive`,
      `felt the heat building and chose to act instead of waiting`,
      `saw the move forming and decided to be the one throwing, not catching`,
      `the whispers got loud enough — this vote is self-defense`,
      `if you wait until they come for you, it's too late — this was the window`,
    ]);
  }

  if (type === 'protect-bond') {
    const { allianceTarget } = ctx;
    const allyBond = getPerceivedBond(voter, allianceTarget);
    if (allyBond >= 4) return pick([
      `protecting ${allianceTarget} — the bond runs too deep to go against`,
      `${allianceTarget} is untouchable to them — ${target} absorbs the vote instead`,
      `refused to write ${allianceTarget}'s name — this was the only redirect`,
      `${allianceTarget} is their person — ${target} pays for it`,
      `would rather go home than write ${allianceTarget}'s name — ${target} is the alternative`,
      `this vote isn't about ${target} — it's about keeping ${allianceTarget} safe`,
    ]);
    return pick([
      `redirected — couldn't vote ${allianceTarget}, landed on ${target}`,
      `protecting ${allianceTarget} at ${target}'s expense`,
      `${allianceTarget} stays safe — ${target} absorbs the vote`,
      `the real target was ${allianceTarget} but they couldn't pull the trigger — ${target} instead`,
      `refused to write ${allianceTarget}'s name — ${target} was the path of least resistance`,
    ]);
  }

  if (type === 'personal') {
    const { phase } = ctx;
    if (bond <= -5) return pick([
      `deep personal animosity — this has been building since before the game`,
      `pure hostility — the name was never going to be anyone else`,
      `wanted ${target} gone from day one — this was always going to happen eventually`,
      `the dislike is mutual and it's been simmering for weeks`,
    ]);
    if (bond <= -3) return pick([
      `can't work with ${target} — the distrust has gotten too personal`,
      `the tension finally reached a breaking point`,
      `${target} rubs them the wrong way — has since the beginning`,
      `too much history to trust — the only honest vote they could make`,
      `the friction between them is too obvious to ignore anymore`,
    ]);
    if (voterS.intuition >= 7) return pick([
      `gut feeling — ${target} doesn't sit right with them`,
      `reads people well — and ${target} is not what they're presenting`,
      `something about ${target} feels calculated in the wrong direction`,
      `can't shake the feeling — ${target} is not safe to keep`,
    ]);
    return pick([
      `low-level distrust — hasn't clicked with ${target} since day one`,
      `${target} never gave them a real reason to feel safe`,
      `something feels off — not willing to ignore it`,
      `can't fully commit to protecting ${target}`,
    ]);
  }

  if (type === 'challenge-liability') {
    const { cLabel, phase } = ctx;
    // Check all challenge-relevant stats, prioritize the one matching THIS challenge's category
    const _catStats = cLabel === 'physical' ? ['physical']
      : cLabel === 'endurance' ? ['endurance','physical']
      : cLabel === 'puzzle' ? ['mental']
      : cLabel === 'social' ? ['social','mental']
      : cLabel === 'balance' ? ['endurance','physical']
      : []; // mixed — no single stat dominates
    const _allStats = ['physical','endurance','mental','social'];
    // Sort: challenge-category stats first, then others
    const _sorted = [..._catStats, ..._allStats.filter(k => !_catStats.includes(k))];
    const ws = _sorted.filter(k => targetS[k] <= 5);
    const weakLabel = ws.length ? ws[0] : 'challenges';
    const challengeContext = cLabel && cLabel !== 'Mixed' ? ` — they just lost a ${cLabel} challenge` : '';
    return pick([
      `dead weight in challenges — ${target} has been costing the tribe${challengeContext}`,
      `can't afford to keep losing — ${target} is the answer to that problem`,
      `challenge liability${challengeContext} — the tribe needs to cut somewhere`,
      `${target} hasn't pulled their weight${ws.length ? ', especially in ' + weakLabel : ''}`,
      `${ws.length ? 'weak in ' + weakLabel : 'no challenge value'} — hard to justify keeping them when the tribe is losing`,
      `tribe comes first — ${target} is the weakest link and everyone knows it`,
      ...(gs?.lingeringInjuries?.[target] ? [
        `${target} is hurt — can't compete at full strength and the tribe can't carry that`,
        `the injury is holding ${target} back — voting them out is doing them a favor and the tribe a service`,
      ] : []),
    ]);
  }

  if (type === 'threat') {
    if (th >= 8) return pick([
      `most dangerous person left — has to go now or it's too late`,
      `${target} wins the game if they reach the end — everyone in that room knows it`,
      `somebody had to pull the trigger — this was the moment`,
      `the threat is too real to look past anymore`,
    ]);
    // Jury management: voter ran the FTC math and this target wins
    if (voterS.strategic >= 6 && gs.activePlayers?.length <= 8 && gs.jury?.length) {
      const _tJV = (gs.jury || []).filter(j => getBond(j, target) >= 2).length;
      const _vJV = (gs.jury || []).filter(j => getBond(j, voter) >= 2).length;
      if (_tJV > _vJV) return pick([
        `${target} wins the game if ${pronouns(target).sub} ${pronouns(target).sub === 'they' ? 'reach' : 'reaches'} the end — everyone in that room knows it`,
        `jury math doesn't lie — ${target} has too many friends on the jury to let ${pronouns(target).obj} get to FTC`,
        `can't sit next to ${target} at Final Tribal — the jury loves ${pronouns(target).obj} and that's a death sentence`,
        `the jury would hand ${target} the win. ${pronouns(target).Sub} ${pronouns(target).sub === 'they' ? 'have' : 'has'} to go before that happens`,
      ]);
    }
    if (targetS.strategic >= 8 && targetS.social >= 7) return pick([
      `complete player — controls votes and has the jury wrapped`,
      `strategic and likeable is the worst combination to be sitting next to`,
      `${target} is playing all angles — too dangerous to leave any longer`,
      `running the game and building the jury at the same time — cut now or lose`,
    ]);
    if (targetS.strategic >= 8) return pick([
      `${target} is running the game from behind — too smart to keep`,
      `finally targeting the puppeteer — the numbers won't be better than this`,
      `${target} has been orchestrating votes without anyone calling it out`,
      `strategic threat — the longer they stay, the more locked-in their position becomes`,
    ]);
    if (targetS.social >= 8) return pick([
      `jury favorite — ${target} has built real bonds with everyone`,
      `too likeable — wins any jury vote that's asked to compare`,
      `${target} is everyone's friend, which means everyone is their weapon`,
      `social threat — they don't need to win challenges to win this game`,
    ]);
    if (priorVotesAgainst >= 2) return pick([
      `${target}'s name keeps coming up — eventually you vote the name everyone writes`,
      `been a target for a while — the stars finally aligned`,
      `the third time their name comes up, it usually sticks`,
    ]);
    return pick([
      `long-term threat — has to go before the finale window closes`,
      `${target} is playing well enough to win — not worth the risk`,
      `the threat is real enough that keeping them another round feels like a mistake`,
      `jury threat that nobody wants to face in a Final Tribal`,
    ]);
  }

  // ── Amulet targeting: voting out another holder to upgrade your own amulet ──
  const _voterAmulet = gs.advantages?.find(a => a.type === 'amulet' && a.holder === voter);
  const _targetAmulet = gs.advantages?.find(a => a.type === 'amulet' && a.holder === target);
  if (_voterAmulet && _targetAmulet) {
    const _nextPow = _voterAmulet.amuletPower === 'extraVote' ? 'Vote Steal' : _voterAmulet.amuletPower === 'voteSteal' ? 'Hidden Immunity Idol' : null;
    return pick([
      `amulet holder targeting amulet holder — if ${target} goes, the amulet upgrades to ${_nextPow || 'something stronger'}`,
      `the shared advantage makes ${target} the most strategic target in the game — eliminate a holder, gain power`,
      `the amulet math is simple: ${target} leaves, the advantage gets stronger. The alliance was never going to last`,
      `turned on a fellow amulet holder — the upgrade was too tempting to pass up`,
    ]);
  }
  if (_targetAmulet && gs.knownAmuletHoldersPersistent?.has(target)) {
    return pick([
      `targeting the amulet holder — the advantage is too dangerous to leave in play`,
      `knows about ${target}'s amulet — wants it out of the game before it gets stronger`,
      `${target} is carrying shared power that gets scarier every tribal — has to go now`,
    ]);
  }

  // ── Legacy targeting: voting out the holder to inherit or prevent activation ──
  const _targetLegacy = gs.advantages?.find(a => a.type === 'legacy' && a.holder === target);
  if (_targetLegacy && gs.legacyConfessedTo?.[target] === voter) {
    return pick([
      `${target} told ${voter} about the Legacy Advantage — now ${voter} wants to inherit it`,
      `the Legacy Advantage changes hands on elimination — ${voter} is the heir and ${voter} knows it`,
      `vote out ${target}, inherit the Legacy Advantage — the math writes itself`,
      `${target} trusted ${voter} with a secret. ${voter} is using that trust as a weapon`,
    ]);
  }
  if (_targetLegacy && gs.knownLegacyHolders?.has(target)) {
    return pick([
      `targeting the Legacy Advantage holder — can't let them reach activation`,
      `${target} has guaranteed immunity waiting — has to go before the numbers get too low`,
      `the Legacy Advantage makes ${target} a ticking time bomb — defuse it now`,
    ]);
  }

  return pick([
    `strategic read`,
    `the numbers pointed here — followed the math`,
    `process of elimination — everyone else had protection`,
    `couldn't find a reason to keep ${target} over anyone else`,
    `${target}'s name came up and nobody defended it — that tells you everything`,
    `this was the vote that made the most sense tonight`,
    `no strong reason to protect ${target} — and that's a reason in itself`,
    `the game needed a name — ${target}'s was available`,
  ]);
}

export function simulateVotes(tribalPlayers, immuneName, alliances, lostVotes = [], openVote = false) {
  // immuneName may be a string or an array — normalise to a Set for O(1) lookup
  const _immArr = Array.isArray(immuneName) ? immuneName : immuneName ? [immuneName] : [];
  const _immSet = new Set(_immArr);
  const isImmune = p => _immSet.has(p);
  // Tied Destinies: can't vote for your own partner
  const _tdPartnerOf = (voter) => {
    if (!gs._tiedDestiniesActive) return null;
    const pair = gs._tiedDestiniesActive.find(p => p.a === voter || p.b === voter);
    return pair ? (pair.a === voter ? pair.b : pair.a) : null;
  };
  const _tdBlocked = (voter, target) => _tdPartnerOf(voter) === target;

  const votes = {}, log = [], defections = [];
  let _voteMiscommunications = null;

  // Penalty vote: a pre-cast vote against the penalty target (if they're at this tribal)
  if (gs.penaltyVoteThisEp && tribalPlayers.includes(gs.penaltyVoteThisEp) && !isImmune(gs.penaltyVoteThisEp)) {
    votes[gs.penaltyVoteThisEp] = (votes[gs.penaltyVoteThisEp] || 0) + 1;
    const _pvBv = gs._activeBlackVote || null;
    const _pvReason = _pvBv ? `Black Vote from ${_pvBv.from} — ${_pvBv.reason || 'parting shot'}` : 'penalty vote — pre-cast by the twist';
    log.push({ voter: _pvBv ? _pvBv.from : 'THE GAME', voted: gs.penaltyVoteThisEp, reason: _pvReason, isBlackVote: !!_pvBv });
    if (_pvBv) _pvBv._applied = true;
  }
  // ── BLACK VOTE: direct injection if penalty vote didn't fire (target on different tribe) ──
  // Check gs.blackVotes for any pending classic vote whose target is at THIS tribal
  if (gs.blackVotes?.length) {
    const _bvDirect = gs.blackVotes.find(bv => bv.type === 'classic' && tribalPlayers.includes(bv.target) && !isImmune(bv.target) && bv.target !== gs.penaltyVoteThisEp);
    if (_bvDirect) {
      votes[_bvDirect.target] = (votes[_bvDirect.target] || 0) + 1;
      log.push({ voter: _bvDirect.from, voted: _bvDirect.target, reason: `Black Vote from ${_bvDirect.from} — ${_bvDirect.reason || 'parting shot'}`, isBlackVote: true });
      // Mark for consumption
      _bvDirect._applied = true;
    }
  }

  // ── VOTE PITCHES: active lobbying to flip voters before they decide ──
  const _votePitches = [];
  {
    const _pitchCandidates = tribalPlayers.filter(p => !lostVotes.includes(p));
    let _pitchCount = 0;
    _pitchCandidates.forEach(pitcher => {
      if (_pitchCount >= 2) return;
      const pS = pStats(pitcher);
      const pitchWeight = pS.social * 0.05 + pS.strategic * 0.03 + pS.boldness * 0.02;
      if (Math.random() >= pitchWeight * 0.2) return;
      // Only pitch if disagreeing with alliance target or unallied
      const myAlliance = alliances.find(a => a.members.includes(pitcher));
      const myTarget = myAlliance?.target;
      // Pick who the pitcher wants out instead
      const pitchVictims = tribalPlayers.filter(p => p !== pitcher && !_immSet.has(p) && p !== myTarget);
      if (!pitchVictims.length) return;
      const pitchTarget = wRandom(pitchVictims, v =>
        Math.max(0.1, threatScore(v) * 0.4 + (-getPerceivedBond(pitcher, v)) * 0.3 + Math.random() * 0.3));
      if (pitchTarget === myTarget) return; // already the plan — no pitch needed
      // Lobby each voter
      const _flipped = [];
      _pitchCandidates.filter(v => v !== pitcher && !lostVotes.includes(v)).forEach(voter => {
        if (_flipped.length >= 2) return;
        const vS = pStats(voter);
        const flipChance = pS.social * 0.03 + getPerceivedBond(voter, pitcher) * 0.04
          - vS.loyalty * 0.02 - getPerceivedBond(voter, myTarget || '') * 0.03;
        if (flipChance > 0 && Math.random() < flipChance) {
          _flipped.push(voter);
        }
      });
      _votePitches.push({ pitcher, pitchTarget, originalTarget: myTarget, flipped: _flipped, success: _flipped.length > 0 });
      _pitchCount++;
    });
  }
  // Store pitches for VP/debug
  if (_votePitches.length) {
    if (!gs._votePitchesThisEp) gs._votePitchesThisEp = [];
    gs._votePitchesThisEp = _votePitches;
  }
  // Build a set of flipped voters and their new targets
  const _flippedVoters = new Map();
  _votePitches.forEach(p => {
    p.flipped.forEach(voter => _flippedVoters.set(voter, p.pitchTarget));
    // Consequences
    if (p.success) {
      p.flipped.forEach(v => addBond(v, p.pitcher, 0.3));
    } else {
      // Failed pitch: +0.3 heat next episode
      if (!gs.pitchFailHeat) gs.pitchFailHeat = {};
      gs.pitchFailHeat[p.pitcher] = (gs.episode || 0) + 2; // heat applies next episode
    }
  });

  tribalPlayers.forEach(voter => {
    if (lostVotes.includes(voter)) return;

    const s = pStats(voter);
    // Primary alliance this player is voting with
    const myAlliance = alliances.find(a => a.type === 'alliance' && a.members.includes(voter))
                   || alliances.find(a => a.members.includes(voter));
    let allianceTarget = myAlliance?.target;

    // Vote pitch override: if this voter was flipped by a pitcher, use the pitched target
    if (_flippedVoters.has(voter)) {
      const _pitchedTarget = _flippedVoters.get(voter);
      if (_pitchedTarget && tribalPlayers.includes(_pitchedTarget) && !isImmune(_pitchedTarget)) {
        allianceTarget = _pitchedTarget;
      }
    }

    // All real alliances this player belongs to (they may be in multiple)
    const allMyAlliances = alliances.filter(a => a.type === 'alliance' && a.members.includes(voter));
    // A conflicting target exists if another alliance wants to vote someone different
    const conflictAlliance = allMyAlliances.find(a =>
      a !== myAlliance && a.target && a.target !== allianceTarget && a.target !== voter && !isImmune(a.target)
    );

    // Bond with the alliance's intended target — strong bond creates resistance (uses voter's perception)
    const targetBond = allianceTarget ? getPerceivedBond(voter, allianceTarget) : 0;
    const _voterSh = getShowmance(voter);
    const isShowmanceTarget = allianceTarget && _voterSh?.players.includes(allianceTarget);
    // Bond resistance scales proportionally — stronger bonds make it harder to vote someone out
    // Bond resistance: scales with bond strength. Strong bonds = near-impossible to betray.
    // Bond 2 → 20%, Bond 5 → 50%, Bond 7 → 75%, Bond 9 → 92%
    const bondResistChance = isShowmanceTarget ? 0.92
      : targetBond >= 7 ? Math.min(0.95, 0.50 + targetBond * 0.05)
      : targetBond >= 1 ? Math.min(0.75, targetBond * 0.10) : 0;
    // Showmance partner — even in free-vote situations, won't write their name
    const showmancePartner = getShowmancePartner(voter);
    const showmanceResist = showmancePartner && tribalPlayers.includes(showmancePartner)
      && Math.random() < 0.82;

    // Emotional state + structural position modifiers
    const state = getPlayerState(voter);
    const emotional = state.emotional;
    const emotionalMod = emotional === 'desperate'   ? -0.18
      : emotional === 'paranoid'    ? -0.10
      : emotional === 'uneasy'      ? -0.05
      : emotional === 'calculating' ?  0.08
      : emotional === 'confident'   ?  0.05
      : 0; // comfortable
    const allianceForPos = alliances.find(a => a.type === 'alliance' && a.members.includes(voter));
    const atBottomNow = allianceForPos && isAllianceBottom(voter, allianceForPos.members);
    const bottomMod = atBottomNow ? -0.12 : 0;
    // Late-game restlessness: strategic player who hasn't made a move yet wants to shake things up.
    // But only if they're NOT in a named alliance executing a coordinated plan — voting with
    // your alliance to eliminate a threat IS a strategic move, not complacency.
    const isLateGame = gs.isMerged && gs.activePlayers.length <= 7;
    const _inNamedAlliance = myAlliance?.type === 'alliance';
    const resumeMod = isLateGame && (state.bigMoves || 0) === 0 && !_inNamedAlliance ? -(s.strategic * 0.015) : 0; // proportional: stat 5=-0.075, stat 10=-0.15

    // Named alliance bond boost: trust in your allies makes you more likely to follow through.
    // Purely relationship-driven — strong bonds = high trust = follow the plan.
    // Weak/negative bonds = alliance exists in name only = go rogue.
    const _allianceBondMod = (() => {
      if (!_inNamedAlliance) return 0;
      const _allyMembers = myAlliance.members.filter(m => m !== voter);
      if (!_allyMembers.length) return 0;
      const _avgBond = _allyMembers.reduce((sum, m) => sum + getPerceivedBond(voter, m), 0) / _allyMembers.length;
      // New alliance grace period: alliances formed this episode get a loyalty boost
      // You don't join an alliance and immediately betray it — even wildcards follow through once
      const _namedAlliance = (gs.namedAlliances || []).find(a => a.name === myAlliance.label);
      const _formedThisEp = _namedAlliance?.formed === (gs.episode || 0) + 1;
      const _gracePeriod = _formedThisEp ? 0.20 : 0;
      // Scales proportionally with bond AND alliance size — bigger alliances with good bonds hold tighter
      // Bond 4, size 5 → +0.12 + 0.10 = +0.22. Bond 2, size 3 → +0.06 + 0.04 = +0.10
      const _sizeBonus = Math.max(0, (_allyMembers.length - 1) * 0.03); // 2-member=0.03, 4-member=0.09, 5-member=0.12
      return _avgBond * 0.03 + _sizeBonus + _gracePeriod;
    })();

    // Track record: past betrayals erode the loyalty stat's influence
    // A loyalty 10 player who has betrayed 3 times isn't actually loyal — their actions say otherwise
    const _voterBetrayals = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === voter).length, 0);
    const _trackRecordPenalty = _voterBetrayals >= 3 ? -0.15 : _voterBetrayals >= 2 ? -0.08 : _voterBetrayals >= 1 ? -0.03 : 0;
    // Paranoia spiral nudge: if someone accused this voter of disloyalty this episode, they're less likely to cooperate
    // Self-fulfilling prophecy — accuse your ally and they actually turn on you
    const _paranoiaNudge = gs.paranoiaNudges?.[voter]?.ep === ((gs.episode || 0) + 1) ? -0.15 : 0;
    // Loyalty check — open vote adds social pressure to follow the group
    const loyaltyThreshold = (s.loyalty - (s.boldness - 5) * 0.3) / 11 + (openVote ? 0.1 : 0) + emotionalMod + bottomMod + resumeMod + _allianceBondMod + _trackRecordPenalty + _paranoiaNudge;
    const isLoyal = Math.random() < Math.max(0.10, Math.min(0.95, loyaltyThreshold));
    const resistsBond = Math.random() < bondResistChance;
    // Conflicting alliance pull: bolder + less loyal players more likely to honor the other alliance
    const conflictFlip = conflictAlliance && Math.random() < (0.12 + s.boldness * 0.02 + (10 - s.loyalty) * 0.015);
    // Comfort blindspot: checked-out player (low stats + comfortable) doesn't adapt mid-tribal
    const isComfortBlindspot = emotional === 'comfortable' && s.boldness < 6 && s.strategic < 6;

    let target, reason, isDefecting = false;

    // ── Grudge vote: alliance member votes against a hated ally despite the plan ──
    // Not a random defection — a deliberate choice driven by personal animosity.
    // The relationship has decayed past the point where strategy holds it together.
    // Grace period: alliances formed THIS episode are immune to grudge votes — you just committed
    const _grudgeNamedAlliance = (gs.namedAlliances || []).find(a => a.name === myAlliance?.label);
    const _grudgeGracePeriod = _grudgeNamedAlliance?.formed === ((gs.episode || 0) + 1);
    if (_inNamedAlliance && !target && !_grudgeGracePeriod) {
      const _grudgeTargets = myAlliance.members.filter(m =>
        m !== voter && tribalPlayers.includes(m) && !isImmune(m) && getPerceivedBond(voter, m) <= -2
      );
      if (_grudgeTargets.length) {
        // Worst enemy in the alliance
        const _worstEnemy = _grudgeTargets.sort((a, b) => getPerceivedBond(voter, a) - getPerceivedBond(voter, b))[0];
        const _enemyBond = getPerceivedBond(voter, _worstEnemy);
        // Chance scales with how deep the hatred runs + low loyalty + boldness
        // Bond -2 → ~8%, bond -5 → ~20%, bond -8 → ~32%
        // Late-game discipline: at F5 or smaller, grudges are suppressed — every vote is too critical
        const _lateGameGrudgePenalty = tribalPlayers.length <= 5 ? -0.15 : tribalPlayers.length <= 7 ? -0.05 : 0;
        const _grudgeChance = Math.max(0, 0.02 + Math.abs(_enemyBond) * 0.04
          + s.boldness * 0.008                                              // proportional: stat 5=0.04, stat 8=0.064, stat 10=0.08
          + (10 - s.loyalty) * 0.006                                        // proportional: loyalty 3=0.042, loyalty 7=0.018, loyalty 10=0
          + (emotional === 'desperate' || emotional === 'paranoid' ? 0.04 : 0)
          + _lateGameGrudgePenalty);
        if (Math.random() < Math.min(0.40, _grudgeChance)) {
          target = _worstEnemy;
          reason = buildVoteReason(voter, target, 'grudge', { myAlliance });
          isDefecting = true;
        }
      }
    }

    if (!target && conflictFlip) {
      // Split loyalty — sides with the other alliance this vote
      target = conflictAlliance.target;
      reason = buildVoteReason(voter, target, 'conflict-flip', { conflictAlliance, myAlliance });
      isDefecting = true;
    } else if (!target && isLoyal && !resistsBond && allianceTarget && allianceTarget !== voter && !isImmune(allianceTarget)) {
      // Split vote: if voter is in the secondary group, vote the split target instead
      if (myAlliance?.splitTarget && myAlliance.splitSecondary?.includes(voter) && !isImmune(myAlliance.splitTarget)) {
        target = myAlliance.splitTarget;
        reason = buildVoteReason(voter, target, 'loyal', { myAlliance, openVote, phase: gs.phase, splitVote: true });
      } else {
        target = allianceTarget;
        reason = buildVoteReason(voter, target, 'loyal', { myAlliance, openVote, phase: gs.phase });
      }
      // [8] VOTE MISCOMMUNICATION: low mental or social player votes the wrong name
      // They were loyal — they TRIED to follow the plan — but miscounted, misheard, or got confused.
      if (target && myAlliance && myAlliance.members.length >= 3) {
        const _miscChance = (10 - s.mental) * 0.008 + (10 - s.social) * 0.006;
        if (Math.random() < _miscChance) {
          // Wrong target: alliance's secondary (if split), or 2nd-highest-heat player, or personal grudge
          const _miscCandidates = tribalPlayers.filter(p => p !== voter && p !== target && !isImmune(p));
          let _miscTarget = null;
          // If split vote exists, vote the wrong half
          if (myAlliance.splitTarget && target === allianceTarget) _miscTarget = myAlliance.splitTarget;
          else if (myAlliance.splitTarget && target === myAlliance.splitTarget) _miscTarget = allianceTarget;
          // Personal grudge override
          if (!_miscTarget) {
            const _grudge = _miscCandidates.filter(p => getBond(voter, p) <= -2).sort((a,b) => getBond(voter, a) - getBond(voter, b))[0];
            if (_grudge) _miscTarget = _grudge;
          }
          // Fallback: someone discussed but not the final pick (2nd highest heat)
          if (!_miscTarget && _miscCandidates.length) {
            _miscTarget = _miscCandidates.sort((a,b) => computeHeat(b, tribalPlayers, alliances) - computeHeat(a, tribalPlayers, alliances))[0];
          }
          if (_miscTarget) {
            target = _miscTarget;
            reason = `[MISCOMMUNICATION] ${voter} tried to follow the plan but voted the wrong name`;
            if (!_voteMiscommunications) _voteMiscommunications = [];
            _voteMiscommunications.push({ voter, intended: allianceTarget, actual: _miscTarget, alliance: myAlliance.label });
          }
        }
      }
    } else {
      isDefecting = true;
      // Intuition-based preemptive strike: paranoid/desperate player senses they're being targeted and strikes first
      // Proportional: any intuition level can sense danger, higher = better
      if (emotional === 'paranoid' || emotional === 'desperate') {
        const heat = computeHeat(voter, tribalPlayers, alliances);
        if (heat >= 2.5 && Math.random() < s.intuition * 0.03) { // proportional: stat 4=12%, stat 7=21%, stat 10=30%
          const orchestrators = tribalPlayers.filter(p => p !== voter && !isImmune(p)
            && alliances.some(a => a.members.includes(p) && a.target === voter));
          if (orchestrators.length) {
            target = wRandom(orchestrators, p => Math.max(0.1, threatScore(p) + Math.random() * 0.5));
            reason = buildVoteReason(voter, target, 'preemptive', { emotional });
          }
        }
      }
      if (!target && !myAlliance && !isComfortBlindspot) {
        // No formal alliance — check if a bonded player has a target already cast/planned
        // This simulates informal pre-tribal coordination ("I'm writing X, you in?")
        const bondedWithTarget = tribalPlayers.filter(p =>
          p !== voter && getBond(voter, p) > 0 && !isImmune(p)
        );
        for (const ally of bondedWithTarget.sort((a, b) => getBond(voter, b) - getBond(voter, a))) {
          const allyAlliance = alliances.find(a => a.members.includes(ally));
          const allyTarget = allyAlliance?.target;
          if (allyTarget && allyTarget !== voter && !isImmune(allyTarget)) {
            const followChance = 0.35 + Math.min(getBond(voter, ally) * 0.08, 0.30);
            if (Math.random() < followChance) {
              target = allyTarget;
              reason = buildVoteReason(voter, target, 'loyal', { myAlliance: allyAlliance, openVote, phase: gs.phase });
              isDefecting = false;
              break;
            }
          }
        }
      }

      // ── Self-preservation: strategic/intuitive player senses they're the target and scrambles ──
      // Fires for any unallied player (target still null) who is listed as a target by a bloc of ≥2.
      if (!target) {
        const _targetedByBlocs = alliances.filter(a => a.target === voter && a.type !== 'solo' && a.members.length >= 2);
        if (_targetedByBlocs.length) {
          const _iState = getPlayerState(voter);
          const _emotMod = _iState.emotional === 'paranoid'    ?  0.15
                         : _iState.emotional === 'desperate'   ?  0.10
                         : _iState.emotional === 'uneasy'      ?  0.06
                         : _iState.emotional === 'comfortable' ? -0.10
                         : _iState.emotional === 'content'     ? -0.05 : 0;
          const _eavMod = gs.playerStates[voter]?.eavesdropBoostThisEp ? s.intuition * 0.015 : 0;
          const _lateGameBoost = tribalPlayers.length <= 5 ? 0.25 : tribalPlayers.length <= 7 ? 0.10 : 0;
          const _senseChance = s.strategic * 0.05 + s.intuition * 0.02 + _emotMod + _eavMod + _lateGameBoost; // proportional: stat 4=0.20, stat 8=0.40
          if (Math.random() < _senseChance) {
            // Join the largest bloc not targeting them — scramble to safety
            const _safeBlocs = alliances
              .filter(a => a.target && a.target !== voter && a.type !== 'solo' && !isImmune(a.target) && a.members.length >= 2)
              .sort((a, b) => b.members.length - a.members.length);
            if (_safeBlocs.length) {
              target = _safeBlocs[0].target;
              reason = buildVoteReason(voter, target, 'threat', { voterS: s });
            }
          }
        }
      }

      if (!target) {
        // Exclude: bond-protected target, showmance partner, strong allies (won't freely vote them)
        // Villain intimidation: low-boldness voters avoid targeting the villain (fear)
        const _voterFeared = (p) => {
          const _pArch = players.find(pl => pl.name === p)?.archetype;
          return _pArch === 'villain' && s.boldness * 0.1 < Math.random(); // bold 3 = 70% avoid, bold 7 = 30% avoid, bold 10 = never avoid
        };
        const candidates = tribalPlayers.filter(p => p !== voter && !isImmune(p)
          && (!resistsBond || p !== allianceTarget)
          && (!showmanceResist || p !== showmancePartner)
          && getPerceivedBond(voter, p) < 5 // won't freely target someone they genuinely like
          && !_voterFeared(p)); // low-boldness voters fear the villain
        if (candidates.length) {
          const cLabel = myAlliance?.challengeLabel || null;
          const voterArch = players.find(p => p.name === voter)?.archetype;
          const isChalBeast = voterArch === 'challenge-beast' || s.physical * 0.1 > Math.random(); // proportional: phys 5=50%, phys 8=80%
          const isSchemer   = voterArch === 'schemer' || voterArch === 'mastermind' || s.strategic * 0.1 > Math.random();
          // Vote gravity: each existing vote pulls later voters toward the same target,
          // simulating real-time consolidation at tribal. Prevents perfect round-robin scatter.
          // Floaters feel the pull harder — they go where the numbers go
          const _isFloater = voterArch === 'floater';
          const voteGravity = t => (votes[t] || 0) * (_isFloater ? 0.9 : 0.5);
          if (gs.phase === 'pre-merge') {
            const stragMod = t => gs._chalStragglers?.includes(t) ? 0.5 : 0;
            target = wRandom(candidates, t => Math.max(0.1,
              challengeWeakness(t, cLabel) * 0.4 + (-getPerceivedBond(voter, t)) * 0.35 + stragMod(t) + Math.random() * 0.15 + voteGravity(t)));
          } else {
            // Voter-specific challenge performance signal
            const chalMod = t => {
              const rec = gs.chalRecord?.[t];
              const isCurrentStandout = gs._chalStandouts?.includes(t);
              const historicForce = rec ? (rec.wins >= 2 ? 2 : rec.wins >= 1 ? 1 : 0) + (rec.podiums >= 4 ? 1 : rec.podiums >= 2 ? 0 : 0) : 0;
              if (!isCurrentStandout && historicForce === 0) return 0;
              // Schemers react most aggressively to cumulative record; challenge beasts respect it
              const base = isCurrentStandout ? (isSchemer ? 0.8 : isChalBeast ? -0.5 : 0.25)
                                             : (isSchemer ? 0.4 : isChalBeast ? -0.2 : 0.15);
              // Scale up if their record is long — pre-merge dominance is visible history
              return base + (historicForce >= 2 ? 0.4 : historicForce >= 1 ? 0.2 : 0);
            };
            const _penPileMod = t => (gs.penaltyVoteThisEp === t && s.strategic >= 5) ? 0.4 : 0;
            // Known SL Amulet holder: reaction depends on voter's archetype
            const _slAmuletMod = t => {
              if (!gs.knownAmuletHoldersThisEp?.has(t)) return 0;
              const _tS = pStats(t);
              const _vAvg = (s.physical + s.endurance + s.mental) / 3;
              const _tAvg = (_tS.physical + _tS.endurance + _tS.mental) / 3;
              if (isChalBeast || _vAvg >= 7 || (s.boldness * 0.1 > Math.random() && _vAvg > _tAvg)) return 1.5; // proportional: confident in duel
              if (isSchemer) return -2.0; // waste of a vote
              if (_vAvg < _tAvg - 1) return -3.0; // terrified of being picked
              return -1.0;
            };
            target = wRandom(candidates, t => Math.max(0.1, threatScore(t) - getPerceivedBond(voter, t) + chalMod(t) + _penPileMod(t) + _slAmuletMod(t) + voteGravity(t)));
          }
          const bond = getPerceivedBond(voter, target);
          // Pick the underlying reason first
          let underlyingType, underlyingCtx;
          if (resistsBond && allianceTarget)  { underlyingType = 'protect-bond';        underlyingCtx = { allianceTarget }; }
          else if (bond <= -1)                { underlyingType = 'personal';            underlyingCtx = { phase: gs.phase }; }
          else if (gs.phase === 'pre-merge' && challengeWeakness(target, myAlliance?.challengeLabel) >= 4.0
                   && !(gs._chalStandouts || []).includes(target)
                   && !(gs._chalTopHalf || []).includes(target))  {
            // Only call them a challenge liability if they actually performed poorly — not top half of placements
            underlyingType = 'challenge-liability'; underlyingCtx = { cLabel: myAlliance?.challengeLabel, phase: gs.phase };
          }
          else                                { underlyingType = 'threat';              underlyingCtx = { voterS: s }; }
          // If this player is the spearheader of their bloc and is defecting from their own stated target, wrap with spearhead-defect narrative
          const isSpearheader = myAlliance && myAlliance.members[0] === voter && allianceTarget && target !== allianceTarget;
          if (isSpearheader) {
            const underlyingReason = buildVoteReason(voter, target, underlyingType, underlyingCtx);
            reason = buildVoteReason(voter, target, 'spearhead-defect', { myAlliance, underlyingReason });
          } else {
            reason = buildVoteReason(voter, target, underlyingType, underlyingCtx);
          }
        } else {
          // Fallback: alliance target if not immune, else ANY non-immune player
          if (allianceTarget && !isImmune(allianceTarget)) {
            target = allianceTarget;
          } else {
            const _fallbackCandidates = tribalPlayers.filter(p => p !== voter && !isImmune(p));
            target = _fallbackCandidates.length ? _fallbackCandidates[Math.floor(Math.random() * _fallbackCandidates.length)] : null;
          }
          reason = 'no other options';
          isDefecting = false;
        }
      }
    }

    // Track defections for alliance damage detection
    if (isDefecting && myAlliance && target && allianceTarget && target !== allianceTarget) {
      defections.push({ player: voter, alliance: myAlliance.label, votedFor: target, consensusWas: allianceTarget });
    }

    // ── THE MOLE: vote disruption — rogue vote or corrupted pitch ──
    // Only fires if the Mole is actually at this tribal (tribalPlayers check is implicit — voter is from tribalPlayers)
    if (gs._moleVoteDisruption?.includes(voter) && tribalPlayers.includes(voter) && target && allianceTarget) {
      // Mole votes off-plan: pick someone other than alliance target
      const _roguePool = tribalPlayers.filter(p =>
        p !== voter && p !== allianceTarget && !isImmune(p)
      );
      if (_roguePool.length) {
        let _rogueTarget;
        if (gs.isMerged && _roguePool.length > 1) {
          // Post-merge Scott mode: strategic rogue vote — target threats to the Mole
          const _moleObj = gs.moles?.find(m => m.player === voter);
          const _moleAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(voter));
          const _moleAllySet = new Set(_moleAlliances.flatMap(a => a.members));
          const _scored = _roguePool.map(p => {
            let sc = 0;
            // Prefer high threats
            sc += threatScore(p) * 0.3;
            // Prefer players not allied with the Mole
            if (!_moleAllySet.has(p)) sc += 1.0;
            // Prefer players who've voted for the Mole recently
            const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
            if (_prevEp?.voteDetail?.some(v => v.voter === p && v.target === voter)) sc += 1.5;
            // Prefer players with low bond to the Mole (enemies)
            sc += Math.max(0, -getBond(voter, p) * 0.3);
            // PRIORITY: target whoever suspects the Mole most — get them out before they talk
            if (_moleObj?.suspicion?.[p] >= 0.5) sc += 2.0 + (_moleObj.suspicion[p] || 0) * 0.8;
            return { name: p, score: sc + Math.random() * 0.5 };
          }).sort((a, b) => b.score - a.score);
          _rogueTarget = _scored[0].name;
        } else {
          // Pre-merge Owen mode: random chaos
          _rogueTarget = _roguePool[Math.floor(Math.random() * _roguePool.length)];
        }
        target = _rogueTarget;
        reason = 'rogue vote (Mole disruption)';
        isDefecting = true;
        // Log the sabotage NOW — we know it actually fired
        const _moleObj3 = gs.moles?.find(m => m.player === voter);
        if (_moleObj3) {
          _moleObj3.sabotageCount++;
          _moleObj3.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'voteDisruption' });
          _moleObj3.resistance = Math.max(0.15, 0.5 - _moleObj3.sabotageCount * 0.03);
        }
        // Store for post-vote camp event + suspicion rendering in patchEpisodeHistory
        if (!gs._moleVoteDisruptionEvents) gs._moleVoteDisruptionEvents = [];
        gs._moleVoteDisruptionEvents.push({ voter, originalTarget: allianceTarget, rogueTarget: _rogueTarget });
      }
    }
    // Mole corrupted pitch: convince 1 voter to switch targets
    if (gs._moleVoteDisruption?.length && !gs._moleVoteDisruption.includes(voter)) {
      const _molePitcher = gs._moleVoteDisruption.find(mp =>
        tribalPlayers.includes(mp) && mp !== voter && getBond(voter, mp) >= 1
      );
      if (_molePitcher && Math.random() < 0.25) { // 25% chance per eligible voter
        const _badPool = tribalPlayers.filter(p =>
          p !== voter && p !== _molePitcher && p !== target && !isImmune(p)
        );
        if (_badPool.length) {
          let _badTarget;
          if (gs.isMerged && _badPool.length > 1) {
            // Post-merge: redirect toward the Mole's enemies
            const _moleAlliances2 = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(_molePitcher));
            const _moleAllySet2 = new Set(_moleAlliances2.flatMap(a => a.members));
            const _scored2 = _badPool.map(p => {
              let sc = 0;
              sc += threatScore(p) * 0.3;
              if (!_moleAllySet2.has(p)) sc += 1.0;
              sc += Math.max(0, -getBond(_molePitcher, p) * 0.3);
              // PRIORITY: redirect votes toward whoever suspects the Mole
              const _moleObj4 = gs.moles?.find(m => m.player === _molePitcher);
              if (_moleObj4?.suspicion?.[p] >= 0.5) sc += 2.0 + (_moleObj4.suspicion[p] || 0) * 0.8;
              return { name: p, score: sc + Math.random() * 0.5 };
            }).sort((a, b) => b.score - a.score);
            _badTarget = _scored2[0].name;
          } else {
            // Pre-merge: random
            _badTarget = _badPool[Math.floor(Math.random() * _badPool.length)];
          }
          target = _badTarget;
          reason = `swayed by ${_molePitcher} (Mole misdirection)`;
          // Track the pitch for VP rendering
          if (!gs._moleCorruptedPitches) gs._moleCorruptedPitches = [];
          gs._moleCorruptedPitches.push({ pitcher: _molePitcher, swayed: voter, newTarget: _badTarget, originalTarget: target });
        }
      }
    }

    // Tied Destinies: can't vote for your partner — redirect to next best target
    if (target && _tdBlocked(voter, target)) {
      const _altTargets = tribalPlayers.filter(p => p !== voter && p !== target && !isImmune(p) && !_tdBlocked(voter, p));
      target = _altTargets.length ? _altTargets.sort((a, b) => (computeHeat(b, tribalPlayers, alliances) || 0) - (computeHeat(a, tribalPlayers, alliances) || 0))[0] : null;
    }
    // Final safety: NEVER vote for an immune player regardless of how target was selected
    if (target && isImmune(target)) {
      const _safetyFallback = tribalPlayers.filter(p => p !== voter && !isImmune(p));
      target = _safetyFallback.length ? _safetyFallback[Math.floor(Math.random() * _safetyFallback.length)] : null;
    }
    if (target && target !== voter) {
      votes[target] = (votes[target] || 0) + 1;
      log.push({ voter, voted: target, reason: reason || 'strategic read' });
    }
  });

  // Clean up per-episode Mole vote disruption flags
  delete gs._moleVoteDisruption;

  return { votes, log, defections, voteMiscommunications: _voteMiscommunications, votePitches: _votePitches.length ? _votePitches : null };
}

export function resolveVotes(votes) {
  if (!Object.keys(votes).length) {
    // All votes cancelled (e.g., multiple idols) — deadlock, force a revote
    return { eliminated: null, isTie: true, tiedPlayers: [], allVotesCancelled: true };
  }
  const sorted = Object.entries(votes).sort(([,a],[,b]) => b-a);
  if (sorted.length >= 2 && sorted[0][1] === sorted[1][1]) {
    const tied = sorted.filter(([,v]) => v===sorted[0][1]).map(([n]) => n);
    return { eliminated: null, isTie: true, tiedPlayers: tied };
  }
  return { eliminated: sorted[0][0], isTie: false, tiedPlayers: null };
}

export function checkShotInDark(tribalPlayers, votes, log, ep) {
  if (!gs.shotInDarkEnabledThisEp) return;
  const sorted = Object.entries(votes).sort(([,a],[,b]) => b - a);
  if (!sorted.length) return;
  const [target, voteCount] = sorted[0];
  if (voteCount < 2) return; // only desperate players risk it
  // One-time per player per season — once you roll, you can't roll again
  if (!gs.shotInDarkUsed) gs.shotInDarkUsed = new Set();
  if (gs.shotInDarkUsed.has(target)) return;
  // Don't play SITD if you have any protective advantage (idol, team swap, safety without power — all strictly better)
  const _sitdHasProtection = gs.advantages.some(a => a.holder === target && (a.type === 'idol' || a.type === 'teamSwap' || a.type === 'safetyNoPower' || a.type === 'soleVote' || (a.type === 'amulet' && a.amuletPower === 'idol')));
  if (_sitdHasProtection) return;
  // Don't play SITD if already protected this tribal (idol played for you, or already swapped out)
  if (ep.idolPlays?.some(p => p.playedFor === target || (p.type === 'teamSwap' && p.swappedPlayer === target))) return;
  if (ep.safetyNoPowerPlayed?.holder === target) return;
  if (ep.shotInDark?.player === target) return; // already played SitD this episode — can't play again in vote 2
  const s = pStats(target);
  const eavBonus = gs.playerStates[target]?.eavesdropBoostThisEp ? 0.10 + s.intuition * 0.01 : 0;
  const willPlay = Math.random() < 0.1 + s.boldness * 0.04 + (voteCount >= 4 ? 0.25 : 0) + eavBonus;
  if (!willPlay) return;
  const safe = Math.random() < 1 / 6;
  ep.shotInDark = { player: target, safe, voteCount };
  gs.shotInDarkUsed.add(target);
  // SID player sacrifices their vote — remove from tally but keep in log (flagged)
  // so voting plans can still show their pre-tribal strategy
  const myVoteIdx = log?.findIndex(v => v.voter === target);
  if (myVoteIdx !== undefined && myVoteIdx >= 0) {
    const myVote = log[myVoteIdx];
    votes[myVote.voted] = (votes[myVote.voted] || 0) - 1;
    if (votes[myVote.voted] <= 0) delete votes[myVote.voted];
    ep.shotInDark.ownVoteCancelled = myVote.voted;
    ep.shotInDark.ownVoteEntry = { ...myVote };
    myVote.sitdSacrificed = true; // flag instead of removing — VP can filter
  }
  if (safe) {
    ep.shotInDark.votesNegated = votes[target];
    delete votes[target];
  }
}

export function simulateRevote(tribalPlayers, tiedPlayers, lostVotes, originalLog = [], immunePlayers = []) {
  const _rvImmSet = new Set(immunePlayers);
  const votes = {}, log = [];
  const voters = tribalPlayers.filter(p => !tiedPlayers.includes(p) && !lostVotes.includes(p));
  // Tied players who also have tribal immunity (idol/SitD) cannot be voted on the revote
  const validTied = tiedPlayers.filter(p => !_rvImmSet.has(p));

  voters.forEach(voter => {
    const s = pStats(voter);

    // What did this player originally vote for?
    const originalVote = originalLog.find(e => e.voter === voter)?.voted;
    // Which tied player were they voting against (their original position)?
    // If their original target is now immune, treat as no original position
    const originalTarget = validTied.includes(originalVote) ? originalVote : null;
    // The other valid tied player(s) — flipping to one of these breaks the tie from their side
    const otherTied = validTied.filter(p => p !== originalTarget);

    // How much do they care about the person they're trying to protect (their ally in the tie)?
    const allyInTie = validTied.filter(p => p !== originalTarget).sort((a,b) => getBond(voter,b) - getBond(voter,a))[0] || null;
    const allyBond = allyInTie ? getBond(voter, allyInTie) : 0;
    // How much do they hate the person they're currently targeting?
    const hatredOfTarget = originalTarget ? -getBond(voter, originalTarget) : 0;

    // Rock tolerance: base is LOW — most people want to avoid drawing rocks
    // Raised by: loyalty to alliance, boldness, protecting a close ally, deep hatred of target
    const flipCandidates = originalTarget ? otherTied : validTied;
    // If every flip candidate is a strong ally, holding is much more attractive — you'd be
    // voting out your own person. Bond >= 2 = notable ally, >= 3 = close ally.
    const bestFlipAllyBond = flipCandidates.reduce((max, t) => Math.max(max, getBond(voter, t)), 0);
    const allyFlipPenalty = bestFlipAllyBond >= 3 ? 0.35   // close ally — strongly resist flipping
                          : bestFlipAllyBond >= 2 ? 0.18   // notable ally — moderately resist
                          : 0;

    const rockTolerance =
      0.08                               // base: ~8% willing to go to rocks
      + (s.loyalty - 5) * 0.04          // very loyal players hold firm
      + s.boldness * 0.03               // bold players risk rocks
      + allyBond * 0.05                 // strong bond with the person they're protecting
      + Math.min(hatredOfTarget, 5) * 0.04 // deep hatred of original target
      + allyFlipPenalty;                // resistance to flipping onto a close ally

    const holdsPosition = originalTarget && Math.random() < Math.max(0.04, Math.min(0.90, rockTolerance));

    let target, reason;
    if (!validTied.length) return; // all tied players are immune — no valid target, skip vote
    if (holdsPosition) {
      // Sticking — willing to draw rocks for their position
      target = originalTarget;
      reason = allyBond >= 3 ? `held — protecting ${allyInTie}`
             : allyFlipPenalty >= 0.3 ? `held — not willing to vote out an ally to avoid rocks`
             : hatredOfTarget >= 3 ? `held — refuses to let ${originalTarget} stay`
             : `held position — willing to draw rocks`;
    } else {
      // Flips to avoid rocks — votes for whichever valid tied player they're less bonded to
      target = wRandom(flipCandidates.length ? flipCandidates : validTied, t =>
        Math.max(0.1, (5 - getBond(voter, t)) * 0.6 + Math.random() * 0.5)
      );
      reason = allyFlipPenalty >= 0.18 ? `flipped to avoid rocks — chose numbers over loyalty`
             : `flipped to avoid rocks`;
    }

    votes[target] = (votes[target] || 0) + 1;
    log.push({ voter, voted: target, reason });
  });

  return { votes, log };
}


// ── EMISSARY VOTE: emissary picks a second elimination after normal tribal ──
export function simulateEmissaryVote(ep) {
  if (!ep.emissary) return null;
  const emissary = ep.emissary.name;
  const emS = pStats(emissary);
  const emPr = pronouns(emissary);
  const emArch = emS.archetype || 'neutral';

  // Pool: remaining tribal players minus the just-eliminated player and immune players
  const pool = (ep.tribalPlayers || []).filter(p =>
    p !== ep.eliminated && gs.activePlayers.includes(p) && p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p)
  );
  if (!pool.length) return null;

  // ── Collect pitch influence from scouting ──
  const pitchInfluence = {};
  (ep.emissaryScoutEvents || []).forEach(evt => {
    if (evt.type === 'emissaryPitch' && evt.pitchTarget) {
      pitchInfluence[evt.pitchTarget] = (pitchInfluence[evt.pitchTarget] || 0) + (evt.pitchStrength || 0.3);
    }
  });

  // ── Archetype weight modifiers ──
  let threatWeight = 0.30, bondWeight = 0.20, heatWeight = 0.15;
  if (['villain', 'schemer', 'mastermind'].includes(emArch)) {
    threatWeight = 0.40;
  } else if (['hero', 'loyal', 'protector'].includes(emArch)) {
    bondWeight = 0.30;
  } else if (['floater', 'follower'].includes(emArch)) {
    heatWeight = 0.25;
  }

  // ── Score each candidate ──
  const scores = pool.map(target => {
    const tThreat = threatScore(target);
    const tBond = getBond(emissary, target);
    const tHeat = computeHeat(target, pool, ep.alliances || []);
    const tPitch = pitchInfluence[target] || 0;

    const score = tThreat * threatWeight
                + tPitch * 0.25
                - tBond * bondWeight
                + tHeat * heatWeight
                + Math.random() * 0.10;

    return { name: target, score, threat: tThreat, bond: tBond, heat: tHeat, pitch: tPitch };
  }).sort((a, b) => b.score - a.score);

  const pick = scores[0];
  if (!pick) return null;

  // ── Generate reason text ──
  const pickPr = pronouns(pick.name);
  let reason;
  if (pick.pitch > 0.3) {
    const pitcher = (ep.emissaryScoutEvents || []).find(e => e.type === 'emissaryPitch' && e.pitchTarget === pick.name)?.pitcher;
    reason = pitcher
      ? `${emissary} was swayed by ${pitcher}'s pitch against ${pick.name}.`
      : `${emissary} heard enough to make ${emPr.pos} mind up about ${pick.name}.`;
  } else if (pick.bond <= -1) {
    reason = `${emissary} and ${pick.name} have history. This is personal.`;
  } else if (pick.threat > 6) {
    reason = `${emissary} points at the biggest threat. "${pick.name}. You're too dangerous to keep around."`;
  } else if (pick.heat > 3) {
    reason = `${emissary} reads the room. "${pick.name}. Your own tribe wanted you gone."`;
  } else {
    reason = `${emissary} makes ${emPr.pos} choice. "${pick.name}."`;
  }

  ep.emissaryPick = { name: pick.name, reason, scores: scores.slice(0, 5) };
  return ep.emissaryPick;
}


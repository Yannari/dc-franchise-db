// js/camp-events.js - Camp events: alliance recruitment, paranoia, social politics, etc.
import { gs, seasonConfig, players } from './core.js';
import { pStats, pronouns, getPlayerState, romanticCompat } from './players.js';
import { getBond, addBond, getPerceivedBond } from './bonds.js';
import { wRandom, computeHeat, nameNewAlliance } from './alliances.js';
import {
  checkShowmanceFormation, updateRomanticSparks, getShowmancePartner,
  updateShowmancePhases, checkLoveTriangleFormation, updateAffairExposure,
  updateLoveTrianglePhases, checkFirstMove, checkShowmanceSabotage
} from './romance.js';
import { generateSocialManipulationEvents } from './social-manipulation.js';
import { simulateTribeChallenge } from './challenges-core.js';

export const CAMP_EVENT_TYPES = [
  // ═══ POSITIVE (~300 weight = 50%) — bonding, comfort, growth, alliance building ═══
  { id: 'bond',                twoPlayer: true,  weight: 18 },
  { id: 'tdBond',              twoPlayer: true,  weight: 18 },
  { id: 'comfort',             twoPlayer: true,  weight: 12 },
  { id: 'hardWork',            twoPlayer: false, weight: 12 },
  { id: 'groupLaugh',          twoPlayer: false, weight: 12 },
  { id: 'sharedStruggle',      twoPlayer: true,  weight: 12 },
  { id: 'rivalThaw',           twoPlayer: true,  weight: 10 },
  { id: 'flirtation',          twoPlayer: true,  weight: 10 },
  { id: 'unexpectedCompetence',twoPlayer: false, weight: 8  },
  { id: 'teachingMoment',      twoPlayer: true,  weight: 10 },
  { id: 'vulnerability',       twoPlayer: true,  weight: 10 },
  { id: 'insideJoke',          twoPlayer: true,  weight: 11 },
  { id: 'loyaltyProof',        twoPlayer: true,  weight: 10 },
  { id: 'showmancerMoment',    twoPlayer: true,  weight: 8  },
  { id: 'socialBoost',         twoPlayer: false, weight: 8  },
  { id: 'soldierCheckin',      twoPlayer: true,  weight: 8  },
  { id: 'underdogMoment',      twoPlayer: false, weight: 8  },
  { id: 'beastDrills',         twoPlayer: false, weight: 7  },
  { id: 'allianceForm',        twoPlayer: false, weight: 18 }, // builds protection structure
  { id: 'sideDeal',            twoPlayer: true,  weight: 10 }, // builds connection
  { id: 'idolSearch',          twoPlayer: false, weight: 10 }, // empowers finder
  { id: 'wildcardPivot',       twoPlayer: false, weight: 8  }, // wildcard finds new path (positive for them)
  // ═══ NEGATIVE (~270 weight = 45%) — conflict, damage, drama, scheming, suspicion ═══
  { id: 'fight',               twoPlayer: true,  weight: 15 },
  { id: 'dispute',             twoPlayer: true,  weight: 13 },
  { id: 'meltdown',            twoPlayer: false, weight: 10 },
  { id: 'injury',              twoPlayer: false, weight: 7  },
  { id: 'rumor',               twoPlayer: true,  weight: 12 },
  { id: 'overplay',            twoPlayer: false, weight: 10 },
  { id: 'leadershipClash',     twoPlayer: true,  weight: 12 },
  { id: 'foodConflict',        twoPlayer: true,  weight: 9  },
  { id: 'intimidation',        twoPlayer: true,  weight: 9  },
  { id: 'lie',                 twoPlayer: true,  weight: 11 },
  { id: 'hotheadExplosion',    twoPlayer: false, weight: 11 },
  { id: 'chaosAgentStirsUp',   twoPlayer: true,  weight: 11 },
  { id: 'jealousy',            twoPlayer: true,  weight: 11 },
  { id: 'exclusion',           twoPlayer: false, weight: 9  },
  { id: 'blame',               twoPlayer: true,  weight: 10 },
  { id: 'passiveAggressive',   twoPlayer: true,  weight: 9  },
  { id: 'trustCrack',          twoPlayer: true,  weight: 10 },
  { id: 'allianceCrack',       twoPlayer: true,  weight: 11 },
  { id: 'eavesdrop',           twoPlayer: true,  weight: 9  }, // creates suspicion
  { id: 'paranoia',            twoPlayer: false, weight: 8  },
  { id: 'scramble',            twoPlayer: true,  weight: 9  }, // desperation
  { id: 'overconfidence',      twoPlayer: false, weight: 7  }, // blindside setup
  { id: 'doubt',               twoPlayer: false, weight: 8  },
  { id: 'watchingYou',         twoPlayer: true,  weight: 8  }, // surveillance = negative
  { id: 'prank',               twoPlayer: true,  weight: 9  }, // usually causes friction
  { id: 'showboat',            twoPlayer: false, weight: 6  }, // rubs people wrong
  { id: 'schemerManipulates',  twoPlayer: true,  weight: 9  },
  { id: 'mastermindOrchestrates',twoPlayer: true, weight: 8  },
  { id: 'goatOblivious',       twoPlayer: false, weight: 7  }, // negative perception
  // ═══ TRUE NEUTRAL (~30 weight = 5%) — pure flavor, no real consequences ═══
  { id: 'confessional',        twoPlayer: false, weight: 8  },
  { id: 'weirdMoment',         twoPlayer: false, weight: 5  },
  { id: 'readingRoom',         twoPlayer: false, weight: 5  },
  { id: 'tribeMood',           twoPlayer: false, weight: 4  },
  { id: 'homesick',            twoPlayer: false, weight: 4  },
  { id: 'loneWolf',            twoPlayer: false, weight: 4  },
  // ═══ MIXED (lean positive or negative based on context) ═══
  { id: 'strategicTalk',       twoPlayer: true,  weight: 14 },
  { id: 'tdStrategy',          twoPlayer: true,  weight: 14 },
  { id: 'bigMoveThoughts',     twoPlayer: false, weight: 6  },
  { id: 'perceptiveReads',     twoPlayer: true,  weight: 8  },
  { id: 'floaterInvisible',    twoPlayer: false, weight: 6  },
];


// Flatten campEvents for code that just needs all events (handles both old array and new {pre,post} format)
export function allCampEvents(ep) {
  return Object.values(ep.campEvents || {}).flatMap(v =>
    Array.isArray(v) ? v : [...(v.pre || []), ...(v.post || [])]
  );
}

  // ── EMISSARY VOTE: post-challenge selection (called from simulateEpisode after challenge) ──
export function executeEmissarySelection(ep) {
    if (!ep.isEmissaryVote || !ep.winner || !ep.loser) return;
    const _evWinTribe = ep.winner;
    const _evLoseTribe = ep.loser;
    const _evWinMembers = _evWinTribe.members.filter(m => gs.activePlayers.includes(m));
    if (_evWinMembers.length < 2) return;

    // ── Emissary selection: boldness + strategic + social scoring ──
    const _evScores = _evWinMembers.map(name => {
      const s = pStats(name);
      return { name, score: s.boldness * 0.06 + s.strategic * 0.05 + s.social * 0.04 + Math.random() * 0.15 };
    }).sort((a, b) => b.score - a.score);
    const _evEmissary = _evScores[0].name;
    const _evEmS = pStats(_evEmissary);
    const _evArch = _evEmS.archetype || 'neutral';

    ep.emissary = { name: _evEmissary, tribe: _evWinTribe.name, targetTribe: _evLoseTribe.name };

    // ── Archetype-flavored volunteer dialogue ──
    const _evVolunteerText = ['villain','schemer','mastermind'].includes(_evArch)
      ? `${_evEmissary} volunteers with a thin smile. "I'll handle this."`
      : ['hero','loyal','protector'].includes(_evArch)
      ? `${_evEmissary} steps forward reluctantly. "Someone has to do it. Might as well be me."`
      : ['floater','follower'].includes(_evArch)
      ? `${_evEmissary} shrugs and volunteers. "Sure, I'll go check it out."`
      : `${_evEmissary} volunteers. "I want to see what's going on over there."`;

    // ── Own tribe bond shifts ──
    _evWinMembers.filter(p => p !== _evEmissary).forEach(p => {
      const pS = pStats(p);
      if (['villain','schemer','mastermind'].includes(_evArch)) {
        const suspicion = -pS.intuition * 0.04;
        const admiration = 0.3;
        addBond(p, _evEmissary, admiration + suspicion);
      } else {
        addBond(p, _evEmissary, 0.3);
      }
    });

    // ── Camp event on winning tribe ──
    const _evWinKey = _evWinTribe.name;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evWinKey]) ep.campEvents[_evWinKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evWinKey].post) ep.campEvents[_evWinKey].post = [];
    ep.campEvents[_evWinKey].post.push({
      type: 'emissaryVolunteer',
      players: [_evEmissary, ..._evWinMembers.filter(p => p !== _evEmissary).slice(0, 2)],
      text: _evVolunteerText,
      consequences: `${_evEmissary} will visit ${_evLoseTribe.name}'s tribal council.`,
      badgeText: 'EMISSARY', badgeClass: 'gold'
    });
  }

  // ── EMISSARY VOTE: scouting events at losing tribe's camp ──
export function generateEmissaryScoutEvents(ep) {
    if (!ep.emissary) return;
    const emissary = ep.emissary.name;
    const emS = pStats(emissary);
    const emPr = pronouns(emissary);
    const emArch = emS.archetype || 'neutral';
    const loseTribeName = ep.emissary.targetTribe;
    const loseTribe = gs.tribes.find(t => t.name === loseTribeName);
    if (!loseTribe) return;
    const loseMembers = loseTribe.members.filter(m => gs.activePlayers.includes(m));
    if (!loseMembers.length) return;

    ep.emissaryScoutEvents = [];
    const _evCampKey = loseTribeName;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evCampKey]) ep.campEvents[_evCampKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evCampKey].post) ep.campEvents[_evCampKey].post = [];

    // ── 1. PITCHES (1-2 losing tribe members approach the emissary) ──
    const _evPitchCandidates = loseMembers.map(name => {
      const s = pStats(name);
      const heat = computeHeat(name, loseMembers, ep.alliances || []);
      const bond = getBond(emissary, name);
      return { name, score: s.social * 0.05 + s.strategic * 0.04 + heat * 0.03 + bond * 0.02 + Math.random() * 0.10 };
    }).sort((a, b) => b.score - a.score);

    const _evPitchCount = Math.min(_evPitchCandidates.length, Math.random() < 0.4 ? 2 : 1);
    const _evPitchers = _evPitchCandidates.slice(0, _evPitchCount);

    _evPitchers.forEach(pitcher => {
      const pS = pStats(pitcher.name);
      const pPr = pronouns(pitcher.name);
      const _evRivals = loseMembers.filter(p => p !== pitcher.name)
        .map(p => ({ name: p, bond: getBond(pitcher.name, p) }))
        .sort((a, b) => a.bond - b.bond);
      const pitchTarget = _evRivals[0]?.name || null;
      if (!pitchTarget) return;

      const receptiveness = getBond(emissary, pitcher.name) * 0.10 + pS.social * 0.05 + Math.random() * 0.15;
      const pitchStrength = Math.max(0, Math.min(1, receptiveness));

      const pitchEvent = {
        type: 'emissaryPitch',
        players: [pitcher.name, emissary],
        pitcher: pitcher.name,
        pitchTarget: pitchTarget,
        pitchStrength: pitchStrength,
        text: (['villain','schemer','mastermind'].includes(pS.archetype)
          ? `${pitcher.name} corners ${emissary}. "Get rid of ${pitchTarget}. ${pronouns(pitchTarget).Sub} ${pronouns(pitchTarget).sub==='they'?'are':'is'} playing everyone."`
          : pS.strategic >= 7
          ? `${pitcher.name} lays out the case to ${emissary}. "${pitchTarget} is the biggest threat here. The numbers don't lie."`
          : pS.social >= 7
          ? `${pitcher.name} pulls ${emissary} aside. "Nobody here would miss ${pitchTarget}. Trust me on this."`
          : `${pitcher.name} approaches ${emissary}. "${pitchTarget} is the weakest link. Just saying."`),
        consequences: `Pitch influence: ${(pitchStrength * 100).toFixed(0)}% receptiveness.`,
        badgeText: 'PITCH', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(pitchEvent);
      ep.campEvents[_evCampKey].post.push(pitchEvent);

      addBond(pitcher.name, emissary, 0.3);
      addBond(emissary, pitcher.name, pitchStrength * 0.4);
    });

    // ── 2. OBSERVATION (emissary reads the tribe) ──
    const _evObsQuality = emS.intuition * 0.07 + emS.mental * 0.025 + Math.random() * 0.10;
    const _evMostIsolated = loseMembers.map(name => {
      const avgBond = loseMembers.filter(p => p !== name).reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, loseMembers.length - 1);
      return { name, avgBond };
    }).sort((a, b) => a.avgBond - b.avgBond)[0];

    const obsText = _evObsQuality > 0.5
      ? `${emissary} watches carefully. ${emPr.Sub} notices ${_evMostIsolated?.name || 'tension'} seems isolated — conversations stop when ${pronouns(_evMostIsolated?.name || emissary).sub} walks by.`
      : `${emissary} tries to read the tribe, but it's hard to tell who's really on the outs.`;

    const obsEvent = {
      type: 'emissaryObservation',
      players: [emissary, ...(_evMostIsolated ? [_evMostIsolated.name] : [])],
      text: obsText,
      observationQuality: _evObsQuality,
      isolatedPlayer: _evMostIsolated?.name || null,
      consequences: _evObsQuality > 0.5 ? `${emissary} identified ${_evMostIsolated?.name} as isolated.` : 'Surface-level read only.',
      badgeText: 'EMISSARY', badgeClass: 'blue'
    };
    ep.emissaryScoutEvents.push(obsEvent);
    ep.campEvents[_evCampKey].post.push(obsEvent);

    // ── 3. ALLIANCE OFFER (optional — if emissary has strong existing bond) ──
    const _evAllyCandidate = loseMembers.find(p => getBond(emissary, p) >= 3.0);
    if (_evAllyCandidate && Math.random() < 0.6) {
      const _evAllyBond = getBond(emissary, _evAllyCandidate);
      if (!gs.sideDeals) gs.sideDeals = [];
      const _evGenuine = emS.loyalty * 0.08 + _evAllyBond * 0.05 + Math.random() * 0.15 > 0.5;
      gs.sideDeals.push({
        players: [emissary, _evAllyCandidate],
        initiator: emissary,
        madeEp: (gs.episode || 0) + 1,
        type: 'f2',
        active: true,
        genuine: _evGenuine
      });

      const dealEvent = {
        type: 'emissaryDeal',
        players: [emissary, _evAllyCandidate],
        text: `${emissary} and ${_evAllyCandidate} make a cross-tribe deal. "When we merge, we look out for each other."`,
        consequences: `F2 pact formed (${_evGenuine ? 'genuine' : 'strategic'}).`,
        badgeText: 'CROSS-TRIBE DEAL', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(dealEvent);
      ep.campEvents[_evCampKey].post.push(dealEvent);
      addBond(emissary, _evAllyCandidate, 0.5);
      addBond(_evAllyCandidate, emissary, 0.5);
    }
  }

export function generateCampEventsForGroup(group, finds, twistBoosts = {}, maxEvents = null, ep = null) {
  const events = [];
  if (group.length < 2) return events;

  const numEvents = maxEvents ?? (Math.floor(Math.random() * 5) + Math.max(10, Math.floor(group.length * 1.5)));
  const boosts = twistBoosts || {};
  // Social players generate more bonding events — proportional boost per social player on tribe
  // Also generates conflict — high-social tribes have more drama too (people care more → conflicts matter more)
  const _groupSocialBoost = group.reduce((sum, p) => sum + pStats(p).social * 0.01, 0);
  if (_groupSocialBoost > 0) {
    boosts.tdBond = (boosts.tdBond || 0) + Math.round(_groupSocialBoost * 6);
    boosts.bond = (boosts.bond || 0) + Math.round(_groupSocialBoost * 5);
    boosts.comfort = (boosts.comfort || 0) + Math.round(_groupSocialBoost * 3);
    boosts.groupLaugh = (boosts.groupLaugh || 0) + Math.round(_groupSocialBoost * 3);
    // Social tribes also have more interpersonal friction — people who care have bigger reactions
    boosts.dispute = (boosts.dispute || 0) + Math.round(_groupSocialBoost * 3);
    boosts.rumor = (boosts.rumor || 0) + Math.round(_groupSocialBoost * 2);
    boosts.watchingYou = (boosts.watchingYou || 0) + Math.round(_groupSocialBoost * 2);
  }

  // If any advantage was found by someone in this group, always open with that event
  // beware-activated is a global event — include it regardless of finder
  const findsInGroup = finds.filter(f => f.type === 'beware-activated' || group.includes(f.finder));
  findsInGroup.forEach(find => {
    const name = find.finder;
    // Auction idol find — use auction-specific narrative
    if (find.fromAuction) {
      const _ap = pronouns(name);
      events.push({ type: 'idolFound', players: [name], text: `${name} spent their auction money on an idol clue and followed it immediately. ${_ap.Sub} come${_ap.sub==='they'?'':'s'} back to camp quiet — and armed.` });
      return;
    }
    // Gift 2 (idol clue) — narrative already handled by ep.giftNarrativeEvents injection; skip duplicate
    if (find.fromGift2) return;
    // Beware activation is a group event — handle separately
    if (find.type === 'beware-activated') {
      const holderList = find.holders.join(', ');
      events.push({ type: 'idolFound', players: find.holders || [], text: `The final Beware Advantage has been found. Every tribe has now claimed theirs. The idols activate: ${holderList}. The vote restriction is lifted. Each holder now has a live Hidden Immunity Idol.` });
      return;
    }
    const advType = find.type || 'idol';
    const _fp = pronouns(name);
    const _fhv = _fp.sub === 'they' ? "they've" : _fp.sub === 'she' ? "she's" : "he's";
    const advTextMap = {
      idol: [
        `${name} slips away to search and comes back with more than ${_fp.sub} left with. Nobody else knows what ${_fp.sub} found.`,
        `${name} finds a Hidden Immunity Idol buried near camp. Heart pounding, ${_fp.sub} pocket${_fp.sub==='they'?'':'s'} it and return${_fp.sub==='they'?'':'s'} to the group like nothing happened.`,
        `${name} locates the idol during a quiet moment alone. ${_fp.Sub} do${_fp.sub==='they'?'':'es'} not tell a single person.`,
        `${name} finds the Hidden Immunity Idol. ${_fp.PosAdj} expression gives nothing away when ${_fp.sub} return${_fp.sub==='they'?'':'s'} to tribe.`,
      ],
      extraVote: [
        `${name} finds a note tucked under a rock near camp. An Extra Vote. ${_fp.Sub} read${_fp.sub==='they'?'':'s'} it twice, pocket${_fp.sub==='they'?'':'s'} it, and act${_fp.sub==='they'?'':'s'} like nothing happened.`,
        `${name} discovers a hidden parchment while collecting water. Extra Vote. ${_fp.Sub} tell${_fp.sub==='they'?'':'s'} nobody.`,
      ],
      voteSteal: [
        `${name} uncovers a Vote Steal advantage hidden at camp. One vote, taken from someone else at tribal. ${_fp.Sub} keep${_fp.sub==='they'?'':'s'} it quiet.`,
        `${name} finds a note near the fire pit. Vote Steal. The power to take someone else's voice — ${_fp.posAdj} now.`,
      ],
      legacy: [
        `${name} finds the Legacy Advantage buried at camp. It can only be used at a specific moment near the end. ${_fp.Sub} tuck${_fp.sub==='they'?'':'s'} it away silently.`,
        `${name} discovers the Legacy Advantage. It will only activate at the right moment — but that moment will come.`,
      ],
      kip: [
        `${name} finds Knowledge is Power — the ability to steal any advantage from any player at tribal. Nobody sees ${_fp.obj} find it.`,
        `${name} locates a hidden note near the water well. Knowledge is Power. ${_fp.Sub} now know${_fp.sub==='they'?'':'s'} what everyone else is holding.`,
      ],
      amulet: [
        `${name} finds an Amulet Advantage at camp. Its power grows as other holders are eliminated.`,
        `${name} discovers the Amulet — it starts weak but gets stronger the longer it survives. ${_fp.Sub} say${_fp.sub==='they'?'':'s'} nothing.`,
      ],
      secondLife: [
        `${name} finds the Second Life Amulet hidden at camp. If ${_fp.sub} ${_fp.sub==='they'?'are':'is'} voted out, ${_fp.sub} can activate it — pick an opponent and duel for survival.`,
        `${name} discovers a glowing amulet buried near the well. The Second Life Amulet. One chance to cheat elimination. ${_fp.Sub} hide${_fp.sub==='they'?'':'s'} it deep.`,
      ],
      'idol-totem': [
        `${name} unwraps the third gift. Inside: a fully-operative Immunity Totem. An idol — no searching required. Just a decision, and a secret. ${_fp.Sub} close${_fp.sub==='they'?'':'s'} the box, pocket${_fp.sub==='they'?'':'s'} it, and head${_fp.sub==='they'?'':'s'} back to camp with the cover story ready.`,
        `${name} chose the Immunity Totem at the Three Gifts ceremony. ${_fp.Sub} walk${_fp.sub==='they'?'':'s'} back to camp holding a live Hidden Immunity Idol. Nobody knows. The story ${_fp.sub} told${_fp.sub==='they'?'':'s'} their tribe is something about a fire-starting challenge. It worked.`,
      ],
      beware: [
        `${name} finds the Beware Advantage — a Hidden Immunity Idol buried with a note attached. The catch: ${_fp.sub} cannot vote at tribal council until every tribe has found their own beware. ${_fp.Sub} pocket${_fp.sub==='they'?'':'s'} it in silence.`,
        `${name} discovers something buried near camp. The Beware Advantage. A powerful idol — but it costs ${_fp.obj} the vote. Until all tribes have found theirs, ${_fp.sub} sit${_fp.sub==='they'?'':'s'} at tribal mute. ${_fp.Sub} debate${_fp.sub==='they'?'':'s'} for a moment. Then ${_fp.sub} keep${_fp.sub==='they'?'':'s'} it.`,
      ],
    };
    // Tactical advantages (teamSwap, voteBlock, voteSteal, safetyNoPower, soleVote) already
    // generate their own discovery camp events via key+'Found' in findAdvantages — skip them here
    if (['teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower', 'soleVote'].includes(advType)) return;
    const lines = advTextMap[advType] || advTextMap.idol;
    events.push({ type: 'idolFound', advType, text: lines[Math.floor(Math.random() * lines.length)], players: [name] });
  });

  // Participation tracker — penalises players already featured in loop events (weight ÷ 1.9^appearances).
  // Idol finds are excluded so finding an advantage doesn't burn a player's screentime quota.
  const _parts = {};
  const _pick = (arr, fn) => {
    const r = wRandom(arr, n => Math.max(0.01, fn(n) / Math.pow(1.9, _parts[n]||0)));
    if (typeof r === 'string') _parts[r] = (_parts[r]||0)+1;
    return r;
  };

  // Track per-pair bond events to prevent the same pair from stacking too many in one phase
  const _pairBondCount = {};
  const _pairKey = (a, b) => [a, b].sort().join('|');
  const _canBond = (a, b) => (_pairBondCount[_pairKey(a, b)] || 0) < 2; // max 2 bond events per pair per phase
  const _trackBond = (a, b) => { const k = _pairKey(a, b); _pairBondCount[k] = (_pairBondCount[k] || 0) + 1; };

  for (let i = 0; i < numEvents; i++) {
    const eventType = wRandom(CAMP_EVENT_TYPES, e => e.weight + (boosts[e.id] || 0)).id;

    if (eventType === 'fight') {
      // Low temperament = more likely to snap. Low loyalty = doesn't suppress it for the group.
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.5 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.4 + (10 - pStats(n).temperament) * 0.15 + 1));
      addBond(a, b, -1.5);
      const tmpA = pStats(a).temperament;
      const fightLines = tmpA <= 2
        ? [`${a} erupts at ${b} with zero warning. Nobody knows what triggered it. The tribe just watches.`,
           `Something snaps in ${a} and ${b} is directly in the blast radius. Loud, raw, no filter.`]
        : tmpA <= 4
        ? [`${a} snaps at ${b} and doesn't apologize. The tribe goes quiet. Everyone notices.`,
           `${a} gets in ${b}'s face over something that felt minor. It doesn't stay minor.`,
           `${a} makes a comment that cuts. ${b} fires back. It escalates faster than anyone expected.`]
        : tmpA <= 6
        ? [`${a} and ${b} get into a tense back-and-forth. Neither raises their voice — but the edge is there.`,
           `Frustration spills over between ${a} and ${b}. It stays controlled, barely.`]
        : [`${a} pushes back on ${b} in a way that surprises everyone — they're usually so composed.`,
           `Even ${a}, who rarely reacts, finally says something to ${b}. That's how you know it's bad.`];
      events.push({ type: 'fight', text: fightLines[Math.floor(Math.random() * fightLines.length)] });
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.includes(a)) gs._blowupPlayers.push(a);

    } else if (eventType === 'bond') {
      // High social = initiates. High temperament = calm enough to open up genuinely.
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).temperament * 0.15 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.3 + 2));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const socA = pStats(a).social;
      const tmpA = pStats(a).temperament;
      const bondLines = (socA >= 8 && tmpA >= 7)
        ? [`${a} gravitates toward ${b} effortlessly. By the end of the day it doesn't feel strategic — it feels real.`,
           `${a} makes ${b} feel like the most important person on the tribe. Whether that's intentional doesn't matter.`]
        : (tmpA >= 8)
        ? [`${a} sits with ${b} and just listens. ${b} opens up more than they planned to. Something shifts.`,
           `${a}'s calm energy draws ${b} in. They talk for hours. Neither wanted to stop.`]
        : (socA >= 7)
        ? [`${a} and ${b} find a rhythm together at camp. The comfort between them grows without much effort.`,
           `${a} checks in on ${b} after a rough stretch. Small thing. ${b} remembers it.`]
        : [`${a} and ${b} stay up talking long after everyone else is asleep.`,
           `${a} and ${b} share a quiet moment. Something real is forming between them.`,
           `${a} opens up to ${b} about something personal. The trust between them grows.`,
           `${a} and ${b} spend the afternoon working together. By sunset they feel like a unit.`];
      events.push({ type: 'bond', text: bondLines[Math.floor(Math.random() * bondLines.length)] });

    } else if (eventType === 'meltdown') {
      // Very low temperament + high boldness = full breakdown. Low temperament alone = implosion.
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.6 + pStats(n).boldness * 0.3 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.3));
      const tmpP = pStats(p).temperament;
      const _mpP = pronouns(p);
      const _hve = _mpP.sub === 'they' ? "they've" : _mpP.sub === 'she' ? "she's" : "he's";
      const meltdownLines = tmpP <= 2
        ? [`${p} goes completely off the rails. Full breakdown — loud, uncontrolled, impossible to ignore.`,
           `${p} explodes at camp. No single trigger. Pure accumulated pressure finally breaking the seal.`]
        : tmpP <= 4
        ? [`${p} loses it at camp. The composure ${_hve} been holding slips — and the whole tribe sees it.`,
           `The pressure finally gets to ${p}. ${_mpP.Sub} crack${_mpP.sub==='they'?'':'s'}. Not quietly.`]
        : [`${p}'s controlled exterior breaks down for a rare moment. The tribe takes a mental note.`,
           `${p} usually keeps it together. Not today. The cracks are visible now.`];
      events.push({ type: 'meltdown', text: meltdownLines[Math.floor(Math.random() * meltdownLines.length)] });
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.includes(p)) gs._blowupPlayers.push(p);

    } else if (eventType === 'hardWork') {
      const p = _pick(group, n => Math.max(0.1, pStats(n).loyalty + pStats(n).endurance * 0.2 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, 0.08)); // was 0.15 — hardWork to ALL tribe is too much
      const _hwP = pronouns(p);
      const hwLines = [
        `${p} is up before sunrise chopping wood and keeping the fire going. Nobody asked. Everyone noticed.`,
        `${p} handles camp entirely while others rest. It earns quiet respect from the tribe.`,
        `${p} refuses to sit still — fishing, fixing the shelter, hauling water. ${_hwP.Sub} ${_hwP.sub==='they'?'are':'is'} making ${_hwP.ref} indispensable.`,
        `${p} works harder than anyone else today. It does not go unnoticed.`,
        `${p} rebuilds the fire pit without being asked. By the time the tribe wakes up, camp looks different. Better.`,
        `${p} spends the afternoon patching holes in the shelter roof. It's thankless work. ${_hwP.Sub} ${_hwP.sub==='they'?'do':'does'} it anyway.`,
        `${p} catches three fish before anyone else has left their shelter. ${_hwP.Sub} ${_hwP.sub==='they'?'don\'t':'doesn\'t'} brag about it. The fish speak for themselves.`,
        `${p} carries water for the entire tribe today. Two trips. Nobody else offered. The gesture isn't lost on anyone.`,
      ];
      events.push({ type: 'hardWork', text: hwLines[Math.floor(Math.random() * hwLines.length)], player: p, players: [p] });

    } else if (eventType === 'strategicTalk') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * pStats(n).strategic * 0.1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.5);
      const strA = pStats(a).strategic;
      const tmpA = pStats(a).temperament;
      const socA = pStats(a).social;
      const stalkLines = (strA >= 9 && tmpA <= 5)
        ? [`${a} lays out the next three votes for ${b} like a chess match. ${b} realizes they're being recruited, not informed.`,
           `${a} and ${b} spend an hour mapping out paths to the end. They leave with a shared plan and a shared secret.`]
        : (strA >= 8 && socA <= 5)
        ? [`${a} pulls ${b} in and tells them exactly what they need to hear. Whether all of it is true is another question.`,
           `${a} makes ${b} feel indispensable. That's always been the move.`]
        : (tmpA >= 7 && strA >= 6)
        ? [`${a} reads the game out loud to ${b}. ${b} mostly listens. Both leave knowing more than they did.`,
           `${a} and ${b} do a full check-in after camp duties. ${a} sees angles ${b} hasn't noticed yet.`]
        : (socA >= 8)
        ? [`${a} floats the conversation casually but walks away with everything they needed. ${b} barely noticed.`,
           `${a} approaches ${b} as a check-in. An hour later they have a working understanding.`]
        : [`${a} pulls ${b} aside for a long game conversation. Names are floated. A loose agreement is made.`,
           `${a} approaches ${b} quietly. "We need to talk." They do. For a long time.`,
           `${a} and ${b} find a spot away from camp. A check-in becomes a full strategic session.`];
      events.push({ type: 'strategicTalk', text: stalkLines[Math.floor(Math.random() * stalkLines.length)] });

    } else if (eventType === 'dispute') {
      // Strategic + bold initiates disputes. Low temperament makes them escalate faster.
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.3 + pStats(n).strategic * 0.2 + 1));
      addBond(a, b, -0.8);
      const tmpA = pStats(a).temperament;
      const strA = pStats(a).strategic;
      const disputeLines = (tmpA <= 3 && strA >= 7)
        ? [`${a} calls ${b} out directly — no diplomatic framing, just the accusation. ${b} didn't see it coming.`,
           `${a} has had enough of ${b}'s game and says so. In front of people. Loudly.`]
        : (tmpA <= 5 && strA >= 7)
        ? [`${a} presses ${b} on who they're really voting for. ${b} deflects. ${a} doesn't accept the deflection.`,
           `${a} pulls ${b} aside and challenges their read on the game. They leave with different plans.`]
        : (strA >= 8)
        ? [`${a} questions ${b}'s logic with quiet precision. ${b} knows it's a power move. Everyone does.`,
           `${a} and ${b} have a measured disagreement about direction. Calm on the surface. Damaging underneath.`]
        : [`${a} and ${b} disagree on the next vote. Neither backs down. The alliance is showing its first crack.`,
           `${b} confronts ${a} about a name they heard floating. ${a} denies it. ${b} doesn't believe them.`,
           `${a} and ${b} clash over who's actually in control. The argument is quiet — but the damage is real.`];
      events.push({ type: 'dispute', text: disputeLines[Math.floor(Math.random() * disputeLines.length)] });

    } else if (eventType === 'idolSearch') {
      const searchers = group.filter(n => !findsInGroup.some(f => f.finder === n));
      if (!searchers.length) continue;
      const p = _pick(searchers, n => Math.max(0.1, pStats(n).intuition * 0.5 + 1));
      const _srP = pronouns(p);
      const _gone = _srP.sub === 'they' ? "they're" : _srP.sub === 'she' ? "she's" : "he's";
      const searchLines = [
        `${p} slips away from camp while everyone else is distracted. ${_srP.Sub} come${_srP.sub==='they'?'':'s'} back empty-handed — for now.`,
        `${p} wanders far from camp, searching for a hidden advantage. No one notices ${_gone} gone.`,
        `${p} is seen disappearing into the woods alone. Nobody follows. Nobody asks.`,
        `${p} searches the entire shoreline methodically. ${_srP.Sub} find${_srP.sub==='they'?'':'s'} nothing — but ${_srP.sub} ${_srP.sub==='they'?'are':'is'} not done looking.`,
        `${p} volunteers for a water run and takes twice as long as usual. The tribe suspects exactly what ${_gone} doing.`,
        `${p} digs through tree roots near camp while the others sleep. Nothing yet — but the desperation is building.`,
        `${p} checks behind the same rock for the third time this week. The idol isn't there. The paranoia is.`,
        `${p} comes back from a "walk" with dirt on ${_srP.posAdj} hands and a face that says nothing. The tribe reads everything.`,
      ];
      events.push({ type: 'idolSearch', text: searchLines[Math.floor(Math.random() * searchLines.length)], players: [p] });

    } else if (eventType === 'injury') {
      // Low survival = more injury-prone (weakened body). Survival 80 = 1x, 40 = 1.6x, 20 = 2.2x
      const p = _pick(group, n => {
        const _survMult = seasonConfig.foodWater === 'enabled' && gs.survival
          ? 1.0 + Math.max(0, (70 - (gs.survival[n] || 80)) * 0.02) : 1.0;
        return Math.max(0.1, ((10 - pStats(n).endurance) * 0.5 + 1) * _survMult);
      });
      const _ijP = pronouns(p);
      const injuryLines = [
        `${p} rolls ${_ijP.posAdj} ankle on the way back from the water well. ${_ijP.Sub} play${_ijP.sub==='they'?'':'s'} it down, but ${_ijP.sub} ${_ijP.sub==='they'?'are':'is'} clearly in pain.`,
        `${p} cuts ${_ijP.posAdj} hand badly at camp. Medical checks on ${_ijP.obj}. The tribe watches nervously.`,
        `${p} collapses briefly after a long day in the sun. The tribe rallies — but questions start.`,
        `${p} wakes up sick. ${_ijP.Sub} push${_ijP.sub==='they'?'':'es'} through the day, but ${_ijP.posAdj} tribemates are keeping a close eye.`,
        `${p} burns ${_ijP.posAdj} hand on the fire. Nothing serious — but the grimace lingers all day.`,
        `${p} barely sleeps. The bags under ${_ijP.posAdj} eyes tell a story. The tribe sees a liability forming.`,
        `${p} twists ${_ijP.posAdj} knee during a camp task. ${_ijP.Sub} ${_ijP.sub==='they'?'don\'t':'doesn\'t'} sit out, but the limp is obvious.`,
        `${p} throws up in the bushes. Nobody says "weak" out loud — but someone is thinking it.`,
      ];
      // Liability effect: tribe quietly reassesses the injured player as a challenge risk
      group.filter(x => x !== p).forEach(other => addBond(other, p, -0.3));
      if (!gs.injuredThisEp) gs.injuredThisEp = new Set();
      gs.injuredThisEp.add(p);
      // Lingering injury: challenge penalty for 2-3 episodes
      if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
      gs.lingeringInjuries[p] = { ep: (gs.episode || 0) + 1, duration: 2 + Math.floor(Math.random() * 2), penalty: 1.5 + Math.random() };
      events.push({ type: 'injury', text: injuryLines[Math.floor(Math.random() * injuryLines.length)], player: p, players: [p] });

    } else if (eventType === 'allianceForm') {
      // Skip if this group already has an allianceForm this episode
      if (events.filter(e => e.type === 'allianceForm').length >= 2) continue;

      // Helper: create alliance, boost bonds, push event
      // Guards: duplicate check + hostile members check
      const _createAlliance = (members, formText) => {
        const _sorted = [...members].sort();
        const _alreadyAllied = gs.namedAlliances?.some(a => a.active && _sorted.length === a.members.length && _sorted.every(m => a.members.includes(m)));
        const _pairAlreadyAllied = members.length === 2 && gs.namedAlliances?.some(a => a.active && a.members.includes(members[0]) && a.members.includes(members[1]));
        if (_alreadyAllied || _pairAlreadyAllied) return;
        // Don't form alliances between players who dislike each other
        // Strategic players (≥7) can bridge slight negativity — they make pitches that work even without chemistry
        const _maxStrategic = Math.max(...members.map(m => pStats(m).strategic));
        const _bondFloor = 0.5 - _maxStrategic * 0.15; // stat 5=-0.25, stat 8=-0.70, stat 10=-1.0
        for (let x = 0; x < members.length; x++) {
          for (let y = x + 1; y < members.length; y++) {
            if (getBond(members[x], members[y]) < _bondFloor) return;
          }
        }
        const allianceName = nameNewAlliance(members.length);
        gs.namedAlliances.push({ id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`, name: allianceName, members: [...members], formed: gs.episode + 1, betrayals: [], active: true });
        for (let x = 0; x < members.length; x++) for (let y = x + 1; y < members.length; y++) addBond(members[x], members[y], 0.2);
        events.push({ type: 'allianceForm', text: formText.replace(/\{name\}/g, allianceName), alliance: allianceName, members, players: members });
      };
      const _isAllied = p => gs.namedAlliances?.some(a => a.active && a.members.includes(p) && a.members.filter(m => group.includes(m)).length >= 2);
      // Global cap: max active alliances scales with active player count
      // 10 players → max 4 alliances, 8 → max 3, 6 → max 2
      const _globalAllianceCount = (gs.namedAlliances || []).filter(a => a.active).length;
      const _globalCap = Math.max(3, Math.floor(gs.activePlayers.length / 2));
      if (_globalAllianceCount >= _globalCap) continue; // don't form more — skip to next event type
      // Cap: players in too many active alliances shouldn't form more (overcommitted)
      // Strategic players can juggle more alliances without being overcommitted
      const _isOvercommitted = p => {
        const _activeCount = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(p)).length;
        const _cap = 1 + Math.floor(pStats(p).strategic * 0.2); // stat 3=1, stat 5=2, stat 7=2, stat 10=3
        return _activeCount >= _cap;
      };
      const _rpl = arr => arr[Math.floor(Math.random() * arr.length)];

      // Pick which formation trigger to attempt (weighted by game state)
      const _triggers = [];

      // ── TRIGGER 1: Strategic pitch — strategic OR social player recruits by affinity ──
      // Strategic players recruit via game logic; social players recruit via personal charm
      // Proportional: any player can initiate, chance scales with strategic/social
      const _stratPlayers = group.filter(n => {
        const _ns = pStats(n);
        return Math.random() < Math.max(_ns.strategic, _ns.social) * 0.08 && !_isOvercommitted(n);
      });
      if (_stratPlayers.length) _triggers.push({ id: 'strategic-pitch', weight: 10 });

      // ── TRIGGER 2: Power couple — two players with strong bond who aren't allied ──
      // Probability scales: bond 2 = unlikely, bond 5 = likely, bond 8+ = near-certain
      let _pcPair = null;
      for (let i = 0; i < group.length && !_pcPair; i++) {
        for (let j = i + 1; j < group.length && !_pcPair; j++) {
          const _pcBond = getBond(group[i], group[j]);
          if (_pcBond >= 1 && Math.random() < (_pcBond - 1) * 0.15 && !gs.namedAlliances?.some(a => a.active && a.members.includes(group[i]) && a.members.includes(group[j])))
            _pcPair = [group[i], group[j]];
        }
      }
      if (_pcPair) _triggers.push({ id: 'power-couple', weight: 8 });

      // ── TRIGGER 3: Mutual enemy — two unallied players who both dislike someone ──
      // Scales: deeper mutual hatred = easier trigger
      let _mePair = null, _meEnemy = null;
      const _unallied = group.filter(n => !_isOvercommitted(n));
      for (let i = 0; i < _unallied.length && !_mePair; i++) {
        for (let j = i + 1; j < _unallied.length && !_mePair; j++) {
          if (getBond(_unallied[i], _unallied[j]) < -0.5) continue;
          const enemy = group.find(e => {
            if (e === _unallied[i] || e === _unallied[j]) return false;
            const h1 = getBond(_unallied[i], e), h2 = getBond(_unallied[j], e);
            return h1 <= -1 && h2 <= -1 && (h1 + h2) <= -3; // combined hatred must be significant
          });
          if (enemy) { _mePair = [_unallied[i], _unallied[j]]; _meEnemy = enemy; }
        }
      }
      if (_mePair) _triggers.push({ id: 'mutual-enemy', weight: 7 });

      // ── TRIGGER 4: Survival pact — minority players (bottom bonds) band together ──
      const _bottomPlayers = [...group].sort((a,b) => {
        const avgA = group.filter(p=>p!==a).reduce((s,p)=>s+getBond(a,p),0)/(group.length-1||1);
        const avgB = group.filter(p=>p!==b).reduce((s,p)=>s+getBond(b,p),0)/(group.length-1||1);
        return avgA - avgB;
      }).slice(0, 2).filter(n => !_isAllied(n));
      if (_bottomPlayers.length >= 2 && getBond(_bottomPlayers[0], _bottomPlayers[1]) > -1) _triggers.push({ id: 'survival-pact', weight: 6 });

      // ── TRIGGER 5: Shared struggle — two players who survived close votes together ──
      let _ssPair = null;
      const _recentEps = (gs.episodeHistory || []).slice(-3);
      for (const re of _recentEps) {
        const vlog = re.votingLog || [];
        const targetedPlayers = group.filter(n => vlog.filter(v => v.voted === n).length >= 2 && n !== re.eliminated);
        if (targetedPlayers.length >= 2 && getBond(targetedPlayers[0], targetedPlayers[1]) >= 0) {
          if (!gs.namedAlliances?.some(a => a.active && a.members.includes(targetedPlayers[0]) && a.members.includes(targetedPlayers[1]))) {
            _ssPair = targetedPlayers.slice(0, 2);
            break;
          }
        }
      }
      if (_ssPair) _triggers.push({ id: 'shared-struggle', weight: 7 });

      if (!_triggers.length) continue;

      // Weighted random pick from available triggers
      const _totalW = _triggers.reduce((s,t) => s + t.weight, 0);
      let _roll = Math.random() * _totalW;
      let _chosen = _triggers[0];
      for (const t of _triggers) { _roll -= t.weight; if (_roll <= 0) { _chosen = t; break; } }

      // Execute the chosen trigger
      if (_chosen.id === 'strategic-pitch') {
        // Pick initiator: highest strategic OR social (social butterflies can recruit too)
        const initiator = _stratPlayers.sort((a,b) => Math.max(pStats(b).strategic, pStats(b).social) - Math.max(pStats(a).strategic, pStats(a).social))[0];
        const _initS = pStats(initiator);
        // Social initiators get a charm bonus — people are drawn to them naturally
        const _socialCharm = _initS.social * 0.05; // proportional: stat 3=0.15, stat 7=0.35, stat 10=0.50
        const recruits = group.filter(p => p !== initiator)
          .map(p => ({ name: p, score: getBond(initiator, p) * 0.5 + pStats(p).loyalty * 0.15 + _socialCharm + Math.random() * 0.5 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(2 + Math.floor(Math.random() * 2), group.length - 1))
          .filter(r => r.score > -0.5 && getBond(initiator, r.name) > -2.5)
          .filter(r => { const rel = relationships.find(rx => [rx.a,rx.b].sort().join('|') === [initiator,r.name].sort().join('|')); return !rel || rel.type !== 'enemy'; })
          .map(r => r.name);
        const safeRecruits = recruits.reduce((acc, name) => {
          const conflict = acc.some(ex => getBond(ex, name) <= -2);
          return conflict ? acc : [...acc, name];
        }, []);
        if (!safeRecruits.length) continue;
        const allianceMembers = [initiator, ...safeRecruits];
        if (gs.namedAlliances?.some(a => a.active && allianceMembers.every(m => a.members.includes(m)))) continue;
        const strI = pStats(initiator).strategic;
        const formText = strI >= 8
          ? _rpl([`${initiator} approaches ${safeRecruits.join(' and ')} with a clear proposal. Names, targets, order. {name} is formed before the sun goes down.`,
                  `${initiator} maps it out for ${safeRecruits.join(' and ')}. The logic is clean. Everyone nods. {name}.`])
          : _rpl([`${initiator} pulls ${safeRecruits.join(' and ')} aside. "It should be us." Nobody disagrees. {name} begins.`,
                  `A quiet conversation between ${initiator} and ${safeRecruits.join(' and ')} turns into something more. {name} is real now.`]);
        _createAlliance(allianceMembers, formText);

      } else if (_chosen.id === 'power-couple') {
        const [a, b] = _pcPair;
        const formText = _rpl([
          `${a} and ${b} have been gravitating toward each other all game. Tonight they made it official. {name} \u2014 built on trust, not strategy.`,
          `"I trust you more than anyone out here." ${a} said it first. ${b} didn't hesitate. {name} is real.`,
          `No pitch. No strategy talk. ${a} and ${b} just looked at each other and knew. {name} forms naturally \u2014 the way the best alliances do.`,
        ]);
        _createAlliance([a, b], formText);

      } else if (_chosen.id === 'mutual-enemy') {
        const [a, b] = _mePair;
        const formText = _rpl([
          `${a} and ${b} realized they share a common enemy: ${_meEnemy}. "I can't stand ${_meEnemy}." "Neither can I." {name} was born from frustration.`,
          `"We both know who needs to go." ${a} looked at ${b}. ${b} nodded. {name} forms around one shared goal: ${_meEnemy} has to leave.`,
        ]);
        _createAlliance([a, b], formText);

      } else if (_chosen.id === 'survival-pact') {
        const [a, b] = _bottomPlayers;
        const formText = _rpl([
          `${a} and ${b} are both on the outside looking in. They know it. "If we don't stick together, we're next." {name} is a survival move \u2014 nothing more, nothing less.`,
          `Nobody's including ${a} or ${b} in their plans. So they made their own. {name} forms at the bottom \u2014 two players with nothing to lose and everything to fight for.`,
          `${a} found ${b} sitting alone by the water. "Everyone's got someone. We don't." By the time they walked back to camp, {name} existed.`,
        ]);
        _createAlliance([a, b], formText);

      } else if (_chosen.id === 'shared-struggle') {
        const [a, b] = _ssPair;
        const formText = _rpl([
          `${a} and ${b} both survived close votes recently. That kind of fear bonds people. "We almost went home. Let's make sure it doesn't happen again." {name} forms from shared survival.`,
          `They both know what it feels like to see your name on the parchment. ${a} and ${b} form {name} \u2014 born from the shared experience of almost going home.`,
        ]);
        _createAlliance([a, b], formText);
      }

    } else if (eventType === 'rumor') {
      // Someone hears their name is being floated — rattles them, slightly damages the spreader's bond
      const target = _pick(group, n => Math.max(0.1, (10 - pStats(n).social) * 0.4 + (10 - pStats(n).boldness) * 0.2 + 1));
      const others = group.filter(p => p !== target);
      if (!others.length) continue;
      const spreader = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + (10 - pStats(n).loyalty) * 0.2 + 1));
      addBond(target, spreader, -0.7);
      const tmpT = pStats(target).temperament;
      const _rP = pronouns(target);
      const rumorLines = tmpT <= 3
        ? [`${target} finds out ${_rP.posAdj} name has been floating. ${_rP.Sub} do${_rP.sub==='they'?'':'es'} not take it calmly.`,
           `Word gets back to ${target} that ${spreader} has been talking. ${_rP.Sub} file${_rP.sub==='they'?'':'s'} it away. For now.`]
        : tmpT <= 6
        ? [`${target} hears ${_rP.posAdj} name came up in a conversation ${_rP.sub} wasn't part of. The paranoia sets in quietly.`,
           `${target} realizes people are talking about them without them. ${_rP.Sub} smile${_rP.sub==='they'?'':'s'} at camp. Internally, ${_rP.sub} ${_rP.sub==='they'?'are':'is'} already rethinking everything.`]
        : [`${target} gets wind that ${_rP.posAdj} name was thrown out. ${_rP.Sub} brush${_rP.sub==='they'?'':'es'} it off in public — but quietly starts paying closer attention.`,
           `Someone lets it slip that ${target}'s name was mentioned. ${_rP.Sub} tuck${_rP.sub==='they'?'':'s'} that information away and say nothing.`];
      events.push({ type: 'rumor', text: rumorLines[Math.floor(Math.random() * rumorLines.length)] });

    } else if (eventType === 'comfort') {
      // One player supports another after a hard day — builds a real bond
      const struggling = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.4 + (10 - pStats(n).endurance) * 0.2 + 1));
      const comforterPool = group.filter(p => p !== struggling && _canBond(p, struggling));
      if (!comforterPool.length) continue;
      const comforter = wRandom(comforterPool, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).temperament * 0.2 + 1));
      addBond(comforter, struggling, 0.6);
      addBond(struggling, comforter, 0.4);
      _trackBond(comforter, struggling);
      const socC = pStats(comforter).social;
      const comfortLines = socC >= 8
        ? [`${comforter} notices ${struggling} is struggling before anyone else does. By the time the tribe catches up, the bond is already there.`,
           `${comforter} doesn't say much to ${struggling} — just stays close. That's enough.`,
           `${comforter} pulls ${struggling} aside and says exactly the right thing. The tribe doesn't know what was said. ${struggling} looks different after.`,
           `${comforter} makes ${struggling} laugh on the worst day of the game. It's a gift nobody else could have given.`]
        : [`${comforter} sits with ${struggling} after a rough stretch. Nobody else checked in. ${comforter} did.`,
           `${comforter} checks on ${struggling} without being asked. It's a small thing. ${struggling} won't forget it.`,
           `${comforter} and ${struggling} share a quiet moment by the water. Something real passes between them.`,
           `${comforter} brings ${struggling} food when nobody's looking. Small gesture. Huge in this game.`,
           `${comforter} stays up with ${struggling} by the fire long after everyone else is asleep. No strategy. Just presence.`];
      events.push({ type: 'comfort', text: comfortLines[Math.floor(Math.random() * comfortLines.length)], players: [comforter, struggling] });

    } else if (eventType === 'overplay') {
      // Someone is visibly making too many deals — slight bond damage with everyone who notices
      const p = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.5 + pStats(n).boldness * 0.3 + (10 - pStats(n).temperament) * 0.1 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.4));
      const strP = pStats(p).strategic;
      const _opP = pronouns(p);
      const overplayLines = strP >= 9
        ? [`${p} is everywhere today — talking to everyone, making deals in every corner of camp. The tribe is starting to notice.`,
           `${p} can't stop. Every conversation is a potential angle. The tribe watches and takes notes.`]
        : strP >= 7
        ? [`${p} is clearly working overtime. Too many check-ins, too many whispers. It's visible from across camp.`,
           `${p} pulls too many people aside in too short a window. The energy ${_opP.sub} ${_opP.sub==='they'?'give':'gives'} off is making people uncomfortable.`]
        : [`${p} is moving too hard for this early in the game. ${_opP.Sub} ${_opP.sub==='they'?'aren\'t':'isn\'t'} subtle about it. People are noticing.`,
           `${p} is nervous and it shows. ${_opP.Sub} ${_opP.sub==='they'?'keep':'keeps'} bringing up the vote when nobody asked. The tribe goes quiet.`];
      events.push({ type: 'overplay', text: overplayLines[Math.floor(Math.random() * overplayLines.length)], player: p, players: [p] });

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — SOCIAL & BONDING
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'tdBond') {
      // TD-flavored bonding — covers archetypes the generic 'bond' doesn't
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).loyalty * 0.2 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.3 + 2));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const sA = pStats(a), sB = pStats(b);
      const tdBondLines = (sA.boldness >= 8 && sB.boldness >= 8)
        ? [`${a} and ${b} somehow get into a competition about who can go the longest without blinking. The tribe has no idea what they're watching.`,
           `${a} and ${b} challenge each other to something ridiculous. Somehow it makes them closer.`]
        : (sA.social >= 8 || sB.social >= 8)
        ? [`${a} does a dead-on impression of the host. ${b} loses it completely. The whole camp is laughing.`,
           `${a} and ${b} spend an hour making up nicknames for everyone on the tribe. Half of them stick.`]
        : (sA.temperament <= 4 || sB.temperament <= 4)
        ? [`${a} and ${b} get into a huge fight — and then immediately start laughing about it. The tribe has no idea how to process this.`,
           `${a} snaps at ${b}, then immediately apologizes. ${b} waves it off. Somehow it broke the ice.`]
        : (sA.loyalty >= 8 || sB.loyalty >= 8)
        ? [`${a} covers for ${b} when someone else asks a pointed question. ${b} notices. Doesn't forget.`,
           `${a} and ${b} make a quiet agreement — nothing formal, no name for it. Just understood.`]
        : [`${a} and ${b} end up on the same shift and bond over how exhausting this is. It's the most honest conversation either has had out here.`,
           `${a} teaches ${b} something random — a card trick, a knot, a song. By sunset they feel like old friends.`,
           `${a} and ${b} get stuck on a camp task together and it takes twice as long as it should. Neither minds.`];
      events.push({ type: 'tdBond', text: tdBondLines[Math.floor(Math.random() * tdBondLines.length)], players: [a, b] });

    } else if (eventType === 'groupLaugh') {
      // A funny shared moment — eases tension camp-wide, small bond to several random pairs
      const p = _pick(group, n => Math.max(0.1, pStats(n).social * 0.5 + pStats(n).boldness * 0.2 + 1));
      const _glP = pronouns(p);
      // Give small bond boost to a random subset of the group
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 1; i += 2) addBond(shuffled[i], shuffled[i+1], 0.5);
      const sP = pStats(p);
      const groupLaughLines = sP.social >= 8
        ? [`${p} has everyone in tears — a story from before the game that somehow lands perfectly out here. For a few minutes the game doesn't exist.`,
           `${p} makes a joke at exactly the right moment. The whole tribe is laughing. Even the people who don't like ${_glP.obj} are laughing.`]
        : sP.boldness >= 8
        ? [`${p} does something completely unhinged and accidentally hilarious. Camp loses it. Nobody expected that.`,
           `${p} tries something and fails spectacularly. The whole tribe is crying laughing. ${_glP.Sub} takes the bow.`]
        : [`Someone makes a joke at just the right moment and camp completely loses it. The tension that's been building all day just — breaks.`,
           `An argument about something dumb devolves into everyone laughing. Nobody even remembers what started it.`,
           `Camp has a rare good evening. People are talking, laughing, not thinking about the vote. These moments don't last long out here.`,
           `${p} says something that catches the whole tribe off guard. The laughter is genuine. Real. A reminder that these are actual people.`];
      events.push({ type: 'groupLaugh', text: groupLaughLines[Math.floor(Math.random() * groupLaughLines.length)], player: p, players: [p] });

    } else if (eventType === 'sharedStruggle') {
      // Two players endure something hard together — builds bond even between unlikely pairs
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).endurance) * 0.4 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      // Prefer pairs that aren't already close — shared struggle matters more between neutrals/rivals
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.3 + (10 - pStats(n).endurance) * 0.2 + 1));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const sA = pStats(a), sB = pStats(b);
      const _ssA = pronouns(a), _ssB = pronouns(b);
      const sharedStruggleLines = (sA.endurance <= 4 || sB.endurance <= 4)
        ? [`${a} and ${b} are both running on empty. They don't say much — but they don't leave each other's side either. Something about surviving this together changes things.`,
           `${a} hits a wall. ${b} notices before anyone else does and stays close without making it a big deal. ${_ssA.Sub} ${_ssA.sub==='they'?'don\'t':'doesn\'t'} forget it.`]
        : (getBond(a, b) < 0)
        ? [`${a} and ${b} have barely spoken. But when the shelter floods at night, they're the only two who get up and fix it. They work in silence. It counts.`,
           `${a} and ${b} haven't agreed on much. But out here, right now, they're the only two still pushing. Neither says anything about the game.`]
        : [`${a} and ${b} spend the day dealing with the same misery — rain, hunger, cold — and come out the other side closer than they expected.`,
           `A hard day at camp leaves ${a} and ${b} sitting together in silence. The kind of silence where nothing needs to be said.`,
           `${a} and ${b} push through a rough stretch together. It's nothing dramatic — just grinding through it side by side. That's enough.`,
           `${b} sees ${a} struggling and says nothing, just starts helping. No comment. No big gesture. ${_ssA.Sub} ${_ssA.sub==='they'?'notice':'notices'}.`];
      events.push({ type: 'sharedStruggle', text: sharedStruggleLines[Math.floor(Math.random() * sharedStruggleLines.length)], players: [a, b] });

    } else if (eventType === 'rivalThaw') {
      // Two players who have been in conflict find unexpected common ground
      // Only fires if a pair in the group has a negative bond
      const rivals = [];
      for (let i = 0; i < group.length; i++)
        for (let j = i+1; j < group.length; j++)
          if (getBond(group[i], group[j]) < -0.5) rivals.push([group[i], group[j]]);
      if (!rivals.length) continue;
      const [a, b] = rivals[Math.floor(Math.random() * rivals.length)];
      addBond(a, b, 1.2); // partial recovery — doesn't erase the conflict, just softens it
      const sA = pStats(a), sB = pStats(b);
      const _rtA = pronouns(a);
      const rivalThawLines = (sA.strategic >= 8 || sB.strategic >= 8)
        ? [`${a} and ${b} have been circling each other for days. Then — quietly, away from camp — they actually talk. Not strategy. Just talk. Neither will admit it changed anything.`,
           `${a} and ${b} find themselves alone together. The conversation that follows is nothing like the ones they've had in front of everyone else.`]
        : (sA.temperament <= 4 && sB.temperament <= 4)
        ? [`${a} and ${b} argue again — and then, somehow, it clears something. They're still not friends. But the air between them is different now.`,
           `${a} and ${b} have a blowup that ends with both of them laughing at themselves. Something resets.`]
        : [`${a} and ${b} haven't been getting along. But today, something small shifts — a shared frustration, a moment of honesty, a favor that didn't have to happen.`,
           `${b} does something for ${a} they didn't have to do. ${a} doesn't say much. But ${_rtA.sub} ${_rtA.sub==='they'?'stop':'stops'} treating ${_rtA.obj} like an enemy.`,
           `${a} and ${b} share a meal in near-silence. By the end of it, whatever was between them has loosened slightly. Not gone — but loosened.`,
           `${a} catches ${b} doing something unexpectedly decent. It doesn't fit the version of them ${_rtA.sub} ${_rtA.sub==='they'?'have':'has'} been holding onto.`];
      events.push({ type: 'rivalThaw', text: rivalThawLines[Math.floor(Math.random() * rivalThawLines.length)], players: [a, b] });

    } else if (eventType === 'flirtation') {
      // Romantic tension — bond boost for both; others notice
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.5 + pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a && romanticCompat(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.4 + pStats(n).social * 0.3 + 1));
      addBond(a, b, 1.2);
      const _fA = pronouns(a), _fB = pronouns(b);
      const flirtLines = [
        `${a} and ${b} keep ending up next to each other. Neither seems to mind. Everyone else has already noticed.`,
        `Something is happening between ${a} and ${b}. It started as nothing. It's not nothing anymore.`,
        `${a} and ${b} talk by the water long after the work is done. It's not about the game.`,
        `${a} laughs at everything ${b} says — and ${b} keeps finding new things to say. The rest of the tribe exchanges a look.`,
        `${a} does something small for ${b} — brings food, fixes something, remembers a detail. ${b} doesn't say anything. But ${_fB.sub} ${_fB.sub==='they'?'are':'is'} smiling.`,
        `The tribe watches ${a} and ${b} be completely unaware they're being watched. This is fine. Totally fine.`,
        `${a} teases ${b} about something small. ${b} teases back. It goes on longer than it should. Nobody at camp is fooled.`,
        `${a} finds an excuse to sit next to ${b} at every meal. Nobody has said anything yet. But they've all noticed.`,
        `${b} catches ${a} looking. ${a} doesn't look away. ${b} doesn't either. The tribe pretends to be busy.`,
        `${a} and ${b} have some kind of inside joke that nobody else is in on. The laughing is getting louder.`,
        `${a} reaches for the same thing as ${b} and their hands brush. Neither of them moves away immediately. The tribe files this away for later.`,
        `${b} passes ${a} something without being asked. ${a} holds it a beat longer than necessary before saying thank you. Everyone saw that.`,
      ];
      events.push({ type: 'flirtation', text: flirtLines[Math.floor(Math.random() * flirtLines.length)] });

    } else if (eventType === 'showmancerMoment') {
      // Showmancer deepens their most important relationship — bigger bond boost than flirtation
      // Strongly prefers showmancer archetype players; falls back to highest-social if none present
      const isShowmancer = n => players.find(p => p.name === n)?.archetype === 'showmancer';
      const showmancers = group.filter(isShowmancer);
      const a = showmancers.length
        ? _pick(showmancers, n => Math.max(0.1, pStats(n).social * 0.5 + 1))
        : _pick(group, n => Math.max(0.1, pStats(n).social * 0.6 + pStats(n).boldness * 0.15 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      // Prefer confirmed showmance partner if present, otherwise closest compatible person
      const compatOthers = others.filter(p => romanticCompat(a, p));
      if (!compatOthers.length) continue;
      const smPartner = getShowmancePartner(a);
      const b = (smPartner && compatOthers.includes(smPartner))
        ? smPartner
        : compatOthers.reduce((best, p) => getBond(a, p) >= getBond(a, best) ? p : best, compatOthers[0]);
      addBond(a, b, 1.5);
      const _sA = pronouns(a), _sB = pronouns(b);
      const isCouple = gs.showmances?.some(sh => sh.players.includes(a) && sh.players.includes(b) && sh.phase !== 'broken-up');
      const smLines = isCouple ? [
        `${a} and ${b} aren't hiding it anymore. They walk back from the well holding hands and nobody says a word.`,
        `${b} leans in and ${a} meets them halfway. The kiss is quick, easy — like they've done it before. The tribe tactfully looks elsewhere.`,
        `${a} falls asleep on ${b}'s shoulder by the fire. Nobody wakes them up. Nobody dares.`,
        `${a} and ${b} are spotted kissing near the treeline. They don't seem particularly embarrassed. The tribe is a different story.`,
        `${b} fixes ${a}'s hair without thinking about it. ${a} lets ${_sA.sub==='they'?'them':_sA.sub==='she'?'her':'him'}. It's the kind of small thing that makes everyone else feel like they're intruding.`,
        `${a} wraps an arm around ${b} at the fire and ${b} doesn't move away. The tribe watches with a mix of warmth and mild strategic dread.`,
        `They whisper to each other until the fire goes down to embers. Whatever they're saying, it's not about the game.`,
        `${a} pulls ${b} aside before the rest of camp is up. When they rejoin the group twenty minutes later, both of them are smiling in a way that answers everyone's question.`,
      ] : [
        `${a} gravitates toward ${b} in a way the tribe has stopped pretending not to notice. Whatever is between them is real — and everyone can see it.`,
        `${a} and ${b} disappear for an hour. When they come back, the energy between them has shifted in a way that makes the rest of the tribe quietly recalculate.`,
        `${b} says something small. ${a} remembers it for the rest of the day. That's the thing about ${a} — ${_sA.sub} ${_sA.sub==='they'?'feel':'feels'} everything out loud.`,
        `${a} sits next to ${b} and the whole camp gets smaller. Everyone gives them space. Nobody knows if that's instinct or strategy.`,
        `There's a moment between ${a} and ${b} that nobody can put into words. The tribe just looks away.`,
        `${a} catches ${b}'s eye from across the camp. It's a second too long to be nothing.`,
        `${b} reaches over and moves something out of ${a}'s way — barely a gesture. ${a} doesn't say anything. But the tribe notices every single time.`,
        `${a} says something that makes ${b} laugh and then immediately looks around to see if anyone else caught it. Everyone did.`,
      ];
      events.push({ type: 'showmancerMoment', text: smLines[Math.floor(Math.random() * smLines.length)], players: [a, b] });

    } else if (eventType === 'prank') {
      // Prank — goes well or badly depending on target's temperament
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (10 - getBond(a, n)) * 0.1 + 1 + Math.random() * 2));
      const goesWell = pStats(b).temperament >= 6 && pStats(a).social >= 6;
      if (goesWell) {
        addBond(a, b, 0.7);
        group.filter(x => x !== a && x !== b).forEach(x => addBond(a, x, 0.2));
      } else {
        addBond(a, b, -1.2);
      }
      const prankLines = goesWell
        ? [`${a} hides ${b}'s stuff as a joke. ${b} finds it, shakes ${a} by the shoulders, and starts laughing. The whole tribe is in.`,
           `${a} sets up something ridiculous and ${b} walks right into it. Even ${b} has to admit it was good.`,
           `${a} and ${b} end up in a full prank war that the rest of the tribe watches like a sporting event.`]
        : [`${a} thinks the prank on ${b} is hilarious. ${b} does not. The tribe goes very quiet.`,
           `${a} pulls something on ${b} at entirely the wrong moment. ${b}'s reaction is not a laugh.`,
           `${a} meant it as a joke. ${b} took it personally. Now there's a thing.`];
      events.push({ type: 'prank', text: prankLines[Math.floor(Math.random() * prankLines.length)], player: a, players: [a], goesWell });

    } else if (eventType === 'unexpectedCompetence') {
      // A "weak" player surprises everyone — threat perception shifts
      const p = _pick(group, n => Math.max(0.1, ((10 - pStats(n).physical) * 0.3 + (10 - pStats(n).social) * 0.2) + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, 0.12)); // was 0.25
      const _ucP = pronouns(p);
      const ucLines = [
        `${p} fixes the shelter from scratch while everyone else argues about how. Nobody expected that.`,
        `${p} catches more fish before breakfast than the tribe has seen all week. The tribe does a quiet recount of who they thought ${p} was.`,
        `${p} solves a camp problem nobody else could crack. The looks around the fire shift.`,
        `${p} carries more than their body weight back from the well without a word. ${_ucP.Sub} ${_ucP.sub==='they'?'drop':'drops'} it at camp and go${_ucP.sub==='they'?'':'es'} back for more.`,
        `${p} navigates something the tribe's been struggling with all day in about thirty seconds. The silence after is respectful.`,
        `Everyone underestimated ${p}. That was a mistake. The tribe is starting to figure that out.`,
      ];
      events.push({ type: 'unexpectedCompetence', text: ucLines[Math.floor(Math.random() * ucLines.length)], player: p, players: [p] });

    } else if (eventType === 'homesick') {
      // Emotional exhaustion — doesn't want sympathy, but the tribe sees it
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.3 + pStats(n).loyalty * 0.25 + (10 - pStats(n).endurance) * 0.15 + 1));
      const _hkP = pronouns(p);
      const hkLines = [
        `${p} goes quiet at camp. Not angry — just somewhere else. The tribe gives ${_hkP.obj} space.`,
        `${p} has a rough night. By morning ${_hkP.sub} ${_hkP.sub==='they'?'are':'is'} composed again, but the tribe saw it.`,
        `${p} stares at the fire for a long time without saying anything. Nobody pushes it.`,
        `${p} doesn't eat much. Doesn't say why. The camp just carries on around ${_hkP.obj}.`,
        `${p} mentions home — just once, just briefly. Then changes the subject. The moment hangs.`,
        `${p} is fine. ${_hkP.Sub} keep${_hkP.sub==='they'?'':'s'} saying ${_hkP.sub} ${_hkP.sub==='they'?'are':'is'} fine. The tribe isn't sure.`,
      ];
      events.push({ type: 'homesick', text: hkLines[Math.floor(Math.random() * hkLines.length)] });

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — CONFLICT & DRAMA
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'leadershipClash') {
      // Two players both try to direct the group — both take a hit
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).strategic * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).strategic * 0.3 + 1));
      addBond(a, b, -1.0);
      group.filter(x => x !== a && x !== b).forEach(x => { addBond(a, x, -0.2); addBond(b, x, -0.2); });
      const lcLines = [
        `${a} gives an instruction. ${b} countermands it immediately. Neither backs down.`,
        `${a} and ${b} both try to take control of camp at the same time. The tribe stops listening to either.`,
        `${a} is running the show — or thinks ${pronouns(a).sub} ${pronouns(a).sub==='they'?'are':'is'}. ${b} has other ideas. Two operations, one exhausted tribe.`,
        `${a} takes charge. ${b} takes charge louder. The tribe picks sides based on who they find less annoying.`,
        `${a} tells the group what to do. ${b} immediately explains why that's wrong. The actual task doesn't get done.`,
        `${a} starts organizing the group. ${b} undercuts it with a different plan. Nobody wants to pick a side, so nothing happens.`,
        `${a} and ${b} are both convinced they're the leader today. The tribe has a third opinion about who's actually in charge: nobody.`,
        `${a} delegates tasks. ${b} reassigns them. By noon the tribe is doing whatever they want and ignoring both.`,
      ];
      events.push({ type: 'leadershipClash', text: lcLines[Math.floor(Math.random() * lcLines.length)] });

    } else if (eventType === 'showboat') {
      // Someone brags — tribe gets quietly irritated
      const p = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.5 + (10 - pStats(n).temperament) * 0.1 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.35));
      const _sbP = pronouns(p);
      const sbLines = [
        `${p} won't stop talking about the challenge. The tribe nods along. They've heard it three times now.`,
        `${p} gives the tribe a full re-enactment of ${_sbP.posAdj} best moment. The tribe claps politely. ${_sbP.Sub} do${_sbP.sub==='they'?'':'es'} it again.`,
        `${p} is very confident about ${_sbP.posAdj} position in this game. Very confident. Out loud. Repeatedly.`,
        `${p} narrates ${_sbP.posAdj} own moves like a sports commentator. It was funny once. It is not funny anymore.`,
        `${p} rates everyone at camp — including ${_sbP.ref} — on a scale of ten. ${_sbP.Sub} give${_sbP.sub==='they'?'':'s'} ${_sbP.ref} a nine. Everyone else gets a four.`,
        `${p} tells the group exactly how ${_sbP.sub} would've played differently if ${_sbP.sub} ${_sbP.sub==='they'?'were':'was'} in charge. Nobody asked.`,
        `${p} describes ${_sbP.posAdj} game to someone like it's already a documentary. The other person smiles and quietly reconsiders the alliance.`,
        `${p} announces that ${_sbP.sub} ${_sbP.sub==='they'?'have':'has'} this figured out. The tribe exchanges looks. Nobody corrects ${_sbP.obj}.`,
      ];
      events.push({ type: 'showboat', text: sbLines[Math.floor(Math.random() * sbLines.length)], player: p, players: [p] });

    } else if (eventType === 'foodConflict') {
      // Someone takes more than their share — targeted resentment
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + (10 - pStats(n).loyalty) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).loyalty * 0.4 + (10 - pStats(n).temperament) * 0.1 + 1));
      addBond(a, b, -1.0);
      group.filter(x => x !== a && x !== b).forEach(x => addBond(a, x, -0.2));
      const fcLines = [
        `${a} takes the last of the rice without asking. ${b} saw it happen and says nothing — at camp.`,
        `${a} eats ${a}'s share and then some. ${b} tracks every bite. This will come up later.`,
        `There's not enough food and ${a} doesn't seem to register that. ${b} does. The rest of the tribe does too.`,
        `${a} "borrows" supplies without clearing it with the group. ${b} calls it out directly. ${a} acts confused.`,
        `${a} finishes eating and immediately asks if there's more. There isn't. The tribe just looks at ${a}.`,
        `${b} catches ${a} cooking extra rice while the rest of the tribe sleeps. The confrontation is quiet and devastating.`,
        `${a} ate while others were working. ${b} says something about it. ${a} says it's not a big deal. ${b} disagrees. The tribe takes sides.`,
        `${a} suggests rationing. Then eats more than the ration. ${b} counts and says nothing. For now.`,
      ];
      events.push({ type: 'foodConflict', text: fcLines[Math.floor(Math.random() * fcLines.length)], player: a, players: [a] });

    } else if (eventType === 'intimidation') {
      // Physical or social dominant player establishes presence — target is unnerved
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.4 + pStats(n).boldness * 0.4 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.4 + (10 - pStats(n).physical) * 0.2 + 1));
      addBond(b, a, -0.8);
      const phA = pStats(a).physical;
      const _intA = pronouns(a);
      const intLines = phA >= 8
        ? [`${a} hauls a log that ${b} couldn't move yesterday. ${b} watches and doesn't say anything.`,
           `${a} doesn't need to threaten anyone. ${_intA.Sub} just exist${_intA.sub==='they'?'':'s'} in the space and everyone adjusts around ${_intA.obj}.`,
           `${a} stands up during a group discussion. Just stands. The conversation changes direction. ${b} noticed.`,
           `${a} walks past ${b} on a narrow path and doesn't move. ${b} does. The tribe saw the whole thing.`]
        : [`${a} has been watching ${b} all day. ${b} noticed. Now ${b} is uncomfortable.`,
           `${a} challenges ${b} to something small — a bet, a task, a point of logic. ${b} backs down.`,
           `${a} makes a comment that wasn't technically a threat. ${b} heard it as one. Maybe that was the point.`,
           `${a} holds eye contact with ${b} a beat too long during a group conversation. ${b} looks away first.`];
      events.push({ type: 'intimidation', text: intLines[Math.floor(Math.random() * intLines.length)] });

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — STRATEGY & SCHEMING
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'tdStrategy') {
      // TD-flavored strategy — covers villain scheming, paranoia, manipulation
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * pStats(n).strategic * 0.1 + pStats(n).boldness * 0.2));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.4);
      const sA = pStats(a);
      const tdStratLines = (sA.strategic >= 9 && sA.loyalty <= 4)
        ? [`${a} has a plan. ${b} is in it — but not in the way ${b} thinks.`,
           `${a} spends two hours with ${b} building the perfect picture of trust. Every word was deliberate.`,
           `${a} tells ${b} exactly what they need to hear. What ${a} actually wants is something else entirely.`]
        : (sA.strategic >= 8 && sA.boldness >= 7)
        ? [`${a} and ${b} map out the next three votes over cold rice and bad water. The plan is solid. Whether it holds is another question.`,
           `${a} doesn't ask ${b} if they're in — ${a} tells ${b} what the plan already is. ${b} finds themselves nodding.`]
        : (sA.social >= 8 && sA.strategic >= 6)
        ? [`${a} works the conversation so naturally that ${b} doesn't realize they've made a commitment until it's already made.`,
           `${a} and ${b} check in on the tribe's mood together. By the end they have the same read — and the same target.`]
        : (sA.boldness <= 4 && sA.strategic >= 7)
        ? [`${a} pulls ${b} aside quietly — no drama, no production. Just two people exchanging information and walking away.`,
           `${a} and ${b} have a conversation that looks like nothing. It was not nothing.`]
        : [`${a} and ${b} take a walk that lasts too long to be casual. They come back with the same energy.`,
           `${a} floats a name to ${b}. ${b} floats one back. They leave it there for now, but it's in the air.`,
           `${a} and ${b} run through the numbers. The math is clear. The question is whether anyone else will see it first.`];
      events.push({ type: 'tdStrategy', text: tdStratLines[Math.floor(Math.random() * tdStratLines.length)], player: a, players: [a] });

    } else if (eventType === 'lie') {
      // Someone plants false information — bond damage if the target finds out
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + (10 - pStats(n).loyalty) * 0.35 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      // b = the person being lied TO (receptive)
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.1 + 2));
      // subject = the person being lied ABOUT (a third player if possible)
      const subjects = others.filter(p => p !== b);
      const subject = subjects.length ? subjects[Math.floor(Math.random() * subjects.length)] : b;
      // Slight negative for subject since they're being targeted
      addBond(subject, a, -0.5);
      const _lyA = pronouns(a);
      const lieLines = [
        `${a} tells ${b} that ${subject} has been saying their name — completely fabricated. ${b} doesn't question it.`,
        `${a} plants a story with ${b}. ${subject} is the target. By tomorrow it will sound like everyone's been saying it.`,
        `${a} bends the truth with ${b} about what ${subject} said at camp. The original quote was nothing. The new version is not nothing.`,
        `${a} and ${b} talk about ${subject} in a way that slowly shifts ${b}'s read of the game. ${a} doesn't call it lying. ${a} calls it context.`,
        `${a} manufactures a grievance about ${subject} and delivers it to ${b} as fact. ${_lyA.Sub} ${_lyA.sub==='they'?'are':'is'} very good at this.`,
        `${a} casually mentions to ${b} that ${subject} was asking questions about the vote — ${subject} wasn't. But now ${b} is on alert.`,
        `${a} tells ${b} a version of last night's conversation that didn't happen. It's close enough to real that ${b} doesn't catch the edit.`,
        `${a} invents a quote from ${subject} and drops it into conversation with ${b}. The seed is planted. ${a} moves on like nothing happened.`,
      ];
      if (!gs.lieTargetsThisEp) gs.lieTargetsThisEp = new Set();
      gs.lieTargetsThisEp.add(subject);
      events.push({ type: 'lie', text: lieLines[Math.floor(Math.random() * lieLines.length)], player: a, players: [a, b] });

    } else if (eventType === 'eavesdrop') {
      // Someone overhears a conversation — strategic info gain, bond shift
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.5 + pStats(n).strategic * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + 1));
      addBond(a, b, -0.8); // a now trusts b less for what they heard
      // Eavesdropper gains an intuition-flavored edge — more likely to play an advantage this episode
      if (!gs.playerStates[a]) gs.playerStates[a] = {};
      gs.playerStates[a].eavesdropBoostThisEp = true;
      const tmpA = pStats(a).temperament;
      const _evA = pronouns(a), _evB = pronouns(b);
      const eavLines = tmpA <= 4
        ? [`${a} rounds the corner and catches ${b} in a conversation they weren't supposed to hear. ${_evA.Sub} do${_evA.sub==='they'?'':'es'}n't hide that ${_evA.sub} heard it.`,
           `${a} overhears ${b} talking about them. ${_evA.Sub} come${_evA.sub==='they'?'':'s'} back to camp with a different expression on ${_evA.posAdj} face.`]
        : tmpA <= 6
        ? [`${a} catches the tail end of a conversation ${b} is having. ${_evA.Sub} file${_evA.sub==='they'?'':'s'} it away and say${_evA.sub==='they'?'':'s'} nothing.`,
           `${a} doesn't mean to overhear — but does. The game just changed, quietly.`]
        : [`${a} was nearby when ${b} said something ${_evA.sub} wasn't meant to. ${_evA.Sub} nod${_evA.sub==='they'?'':'s'}, smile${_evA.sub==='they'?'':'s'}, and keep moving. This will matter later.`,
           `${a} absorbs what ${b} said when ${_evB.sub} thought no one was listening. No reaction. Perfect poker face. The information is already being processed.`];
      events.push({ type: 'eavesdrop', text: eavLines[Math.floor(Math.random() * eavLines.length)] });

    // ══════════════════════════════════════════════════════════
    // FLAVOR / NO IMPACT
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'confessional') {
      // Player speaks honestly — pure character voice, no bond change
      const p = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + (10 - pStats(n).temperament) * 0.2 + 1));
      const sP = pStats(p);
      const _cfP = pronouns(p);
      const confLines = (sP.strategic >= 9 && sP.loyalty <= 4)
        ? [`${p} in the confessional: "Everyone thinks I'm with them. I'm with me. I've always been with me."`,
           `${p} leans back in the confessional and smiles. "They have no idea. None of them."`,
           `${p} tells the confessional exactly what ${_cfP.sub} ${_cfP.sub==='they'?'are':'is'} going to do — in order, with names. It's uncomfortably specific.`]
        : (sP.temperament <= 3 && sP.boldness >= 7)
        ? [`${p} in the confessional: "I cannot stand it here. I cannot stand half these people. I am going to win this game and it is going to feel incredible."`,
           `${p} vents to the confessional for three uninterrupted minutes. It is deeply sincere. None of it is suitable for camp.`]
        : (sP.social >= 8)
        ? [`${p} to the confessional: "I just like people! I can't help it." ${_cfP.Sub} genuinely mean${_cfP.sub==='they'?'':'s'} it. That's either the best or worst quality you can have in this game.`,
           `${p} tells the confessional that ${_cfP.sub} ${_cfP.sub==='they'?'care':'cares'} about everyone here. Then pauses. "That's going to be a problem, isn't it."`]
        : (sP.boldness <= 3)
        ? [`${p} in the confessional, quietly: "I know exactly what's happening. I just can't figure out when to say it."`,
           `${p} tells the confessional something they haven't told anyone at camp. It changes how the whole game looks.`]
        : [`${p} tells the confessional they're fine. ${_cfP.Sub} are not fine. ${_cfP.Sub} know${_cfP.sub==='they'?'':'s'} ${_cfP.sub} ${_cfP.sub==='they'?'are':'is'} not fine.`,
           `${p} to the confessional: "Okay. Here's what I actually think." What follows is more honest than anything said at camp.`,
           `${p} recaps the episode from ${_cfP.posAdj} perspective. The version in ${_cfP.posAdj} head is very different from what the tribe thinks happened.`,
           `${p} in the confessional: "I came here to play the game." Beat. "I just didn't think it would feel like this."`];
      events.push({ type: 'confessional', text: confLines[Math.floor(Math.random() * confLines.length)], player: p, players: [p] });

    } else if (eventType === 'doubt') {
      // Player privately questions their position — no bond change, foreshadowing
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.3 + (10 - pStats(n).social) * 0.2 + 1));
      const _dbP = pronouns(p);
      const doubtLines = [
        `${p} sits alone for a while after camp duties are done. Not searching. Not scheming. Just sitting.`,
        `Something shifts in ${p}'s expression when no one is looking. The game is getting to ${_dbP.obj}.`,
        `${p} stares into the middle distance and does the math in ${_dbP.posAdj} head. The math is not adding up.`,
        `${p} has been quieter than usual. The tribe hasn't asked why. They should probably ask why.`,
        `${p} replays a conversation from earlier. The more ${_dbP.sub} think${_dbP.sub==='they'?'':'s'} about it, the less comfortable ${_dbP.sub} ${_dbP.sub==='they'?'feel':'feels'}.`,
        `${p} thought ${_dbP.sub} knew where ${_dbP.sub} stood in this game. Today raised a question ${_dbP.sub} didn't have before.`,
      ];
      events.push({ type: 'doubt', text: doubtLines[Math.floor(Math.random() * doubtLines.length)] });

    } else if (eventType === 'weirdMoment') {
      // Total Drama absurdism — chaotic, funny, or bizarre — but with real consequences
      const p = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + (10 - pStats(n).temperament) * 0.1 + Math.random() * 2 + 1));
      const others = group.filter(x => x !== p);
      const b = others.length ? others[Math.floor(Math.random() * others.length)] : null;
      const _pPr = pronouns(p);

      // Categorize: argument (conflict), bonding (shared absurdity), solo (chaos/embarrassment)
      const _wmRoll = Math.random();
      if (b && _wmRoll < 0.35) {
        // ── Argument: two players clash over something dumb, tribe picks sides ──
        const _bPr = pronouns(b);
        const _tempAvg = (pStats(p).temperament + pStats(b).temperament) / 2;
        const _bondDrop = _tempAvg <= 4 ? -1.5 : _tempAvg <= 6 ? -1.0 : -0.5;
        addBond(p, b, _bondDrop);
        // Bystanders pick sides — bond toward whoever they're closer to, drift from the other
        others.filter(x => x !== b).forEach(bystander => {
          const _bpBond = getBond(bystander, p);
          const _bbBond = getBond(bystander, b);
          if (_bpBond > _bbBond + 0.5) {
            addBond(bystander, p, 0.3);
            addBond(bystander, b, -0.3);
          } else if (_bbBond > _bpBond + 0.5) {
            addBond(bystander, b, 0.3);
            addBond(bystander, p, -0.3);
          }
        });
        const argLines = [
          `${p} and ${b} get into a passionate argument about something completely irrelevant to the game. The tribe takes sides.`,
          `${p} and ${b} clash over something nobody expected to be a thing. It escalates fast. Camp splits.`,
          `${p} says something. ${b} takes it wrong. Within minutes the whole camp is involved in an argument that has nothing to do with strategy.`,
          `What started as ${p} making a comment turned into a full confrontation with ${b}. The tribe watched — and quietly chose sides.`,
        ];
        events.push({ type: 'weirdMoment', text: argLines[Math.floor(Math.random() * argLines.length)], players: [p, b] });

      } else if (b && _wmRoll < 0.60) {
        // ── Bonding: shared absurdity builds connection ──
        addBond(p, b, 0.5);
        // Tribe lightens up — small boost for everyone present
        others.filter(x => x !== b).forEach(bystander => {
          addBond(bystander, p, 0.1);
          addBond(bystander, b, 0.1);
        });
        const bondLines = [
          `${p} and ${b} start a camp tradition that makes no sense to anyone else. They commit to it fully.`,
          `${p} challenges ${b} to a staring contest. It goes on for an uncomfortable length of time. The tribe can't stop watching.`,
          `${p} and ${b} overhear the host say something they weren't meant to hear. Neither of them brings it up. It haunts them both — and brings them closer.`,
          `${p} and ${b} spend an hour building something out of coconuts. It's terrible. They're proud of it. The tribe lets them have this.`,
        ];
        events.push({ type: 'weirdMoment', text: bondLines[Math.floor(Math.random() * bondLines.length)], players: [p, b] });

      } else {
        // ── Solo chaos: embarrassment or endearing moment depending on how they handle it ──
        const _pS = pStats(p);
        if (_pS.boldness >= 6) {
          // Bold players lean into the chaos — tribe finds it endearing
          others.forEach(o => addBond(o, p, 0.2));
          const boldLines = [
            `${p} attempts to do something impressive and fails in a way that is genuinely spectacular. ${_pPr.Sub} own${_pPr.sub==='they'?'':'s'} it completely. The tribe respects that.`,
            `${p} invents a camp rule that only applies to ${_pPr.obj}. The tribe allows it. Somehow it works.`,
            `It rains for exactly four minutes. ${p} stands in it deliberately. Nobody asks why. Nobody needs to.`,
            `${p} does something so inexplicable at camp that the tribe just agrees not to address it. But everyone's smiling.`,
          ];
          events.push({ type: 'weirdMoment', text: boldLines[Math.floor(Math.random() * boldLines.length)], players: [p] });
        } else {
          // Shy/low-temperament players get embarrassed — slight social friction
          others.slice(0, 2).forEach(o => addBond(o, p, -0.2));
          const shyLines = [
            `The shelter partially collapses. ${p} is somehow to blame. This is disputed — but not loudly enough.`,
            `A raccoon walks into camp and takes ${p}'s shoes. No one helps. Everyone watches. ${p} does not recover socially.`,
            `${p} gets into a one-sided argument with a seagull. The seagull wins. The tribe pretends not to notice.`,
            `${p} talks to the camera for ten minutes when no one is filming. Someone catches ${_pPr.obj}. It's awkward.`,
          ];
          events.push({ type: 'weirdMoment', text: shyLines[Math.floor(Math.random() * shyLines.length)], players: [p] });
        }
      }

    } else if (eventType === 'paranoia') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, (10 - pStats(n).temperament) * 0.3 + (st.emotional === 'paranoid' ? 3 : st.emotional === 'desperate' ? 2 : st.emotional === 'uneasy' ? 1 : 0) + 1);
      });
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.2));
      const paSt = getPlayerState(p);
      const _paP = pronouns(p);
      const paraLines = paSt.emotional === 'desperate'
        ? [`${p} pulls three people aside in one hour. Nobody thinks that's normal.`,
           `${p} is visibly unraveling. The tribe watches ${_paP.obj} scramble and quietly agrees this changes nothing.`,
           `${p} cannot stop talking about the vote. Every conversation circles back. The tribe is exhausted by it.`]
        : [`${p} has been watching everyone too carefully. The tribe notices the noticing.`,
           `${p} reads a normal conversation as something threatening. ${_paP.Sub} spend${_paP.sub==='they'?'':'s'} the rest of the day quietly processing that.`,
           `${p} is in ${_paP.posAdj} own head today. The tribe can feel the energy shift.`,
           `Something has gotten to ${p}. ${_paP.Sub} ${_paP.sub==='they'?'are':'is'} still functional — but barely.`];
      events.push({ type: 'paranoia', text: paraLines[Math.floor(Math.random() * paraLines.length)], players: [p] });

    } else if (eventType === 'scramble') {
      const a = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, pStats(n).strategic * 0.3 + (st.emotional === 'desperate' ? 4 : st.emotional === 'paranoid' ? 2 : st.emotional === 'uneasy' ? 1 : 0) + 1);
      });
      const scOthers = group.filter(p => p !== a);
      if (!scOthers.length) continue;
      const scB = wRandom(scOthers, n => Math.max(0.1, getBond(a, n) * 0.2 + pStats(n).social * 0.3 + 2));
      addBond(a, scB, 0.3);
      // Tribe reads the scramble — everyone else gets slightly more wary of the scrambler
      group.filter(x => x !== a && x !== scB).forEach(other => addBond(other, a, -0.2));
      if (!gs.scramblingThisEp) gs.scramblingThisEp = new Set();
      gs.scramblingThisEp.add(a);
      const scSt = getPlayerState(a);
      const _scA = pronouns(a);
      const scrambleLines = scSt.emotional === 'desperate'
        ? [`${a} is doing everything to stay. ${scB} gets pulled in. So does everyone else. The tribe knows the energy.`,
           `${a} works every angle before tonight. ${scB} hears a version that sounds controlled. It is not controlled.`,
           `${a} approaches ${scB} with a plan that makes logical sense. The desperation underneath it is visible anyway.`]
        : [`${a} is checking in with everyone — more than usual. ${scB} gets a longer conversation than expected.`,
           `${a} pulls ${scB} aside and floats a plan. It feels slightly rushed. ${scB} files that away.`,
           `${a} moves through camp with too much purpose today. ${scB} notices.`];
      events.push({ type: 'scramble', text: scrambleLines[Math.floor(Math.random() * scrambleLines.length)], player: a, players: [a] });

    } else if (eventType === 'overconfidence') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, (st.emotional === 'comfortable' || st.emotional === 'content' || st.emotional === 'confident' ? 3 : 0) + pStats(n).boldness * 0.2 + 1);
      });
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.15));
      const _ocP = pronouns(p);
      const ocLines = [
        `${p} is very relaxed today. Too relaxed. The tribe starts wondering if ${_ocP.sub} know${_ocP.sub==='they'?'':'s'} something they don't.`,
        `${p} stops asking questions, stops checking in. ${_ocP.Sub} act${_ocP.sub==='they'?'':'s'} like the vote is settled. That energy makes people nervous.`,
        `${p} laughs a lot today — the kind that only happens when someone feels completely safe. The tribe watches.`,
        `${p} clearly thinks ${_ocP.sub} ${_ocP.sub==='they'?'are':'is'} fine. ${_ocP.Sub} might be. But assuming it out loud is how people get voted out.`,
        `${p} tells someone ${_ocP.sub} ${_ocP.sub==='they'?'aren\'t':'isn\'t'} worried about tonight. Word travels. Now other people are worried about ${p}.`,
        `${p} naps in the middle of the afternoon while everyone else strategizes. Either ${_ocP.sub} ${_ocP.sub==='they'?'have':'has'} nothing to fear — or ${_ocP.sub} ${_ocP.sub==='they'?'have':'has'} no idea what's coming.`,
        `${p} walks around camp with the energy of someone who's already won today. The tribe reads it as arrogance.`,
        `${p} makes a comment about how "the vote is obvious tonight." Three people in earshot disagree silently.`,
      ];
      events.push({ type: 'overconfidence', text: ocLines[Math.floor(Math.random() * ocLines.length)], player: p, players: [p] });

    } else if (eventType === 'readingRoom') {
      const p = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.6 + pStats(n).strategic * 0.2 + 1));
      const _rrP = pronouns(p);
      const intP = pStats(p).intuition;
      const rrLines = intP >= 8
        ? [`${p} hasn't been in every conversation — but ${_rrP.sub} know${_rrP.sub==='they'?'':'s'} what was said in all of them.`,
           `${p} puts together three separate conversations ${_rrP.sub} wasn't part of and reads the game with eerie accuracy.`,
           `${p} in confessional: "I know exactly who's in trouble tonight. I didn't need anyone to tell me."`]
        : [`${p} notices something the rest of the tribe missed. ${_rrP.Sub} don't${_rrP.sub==='they'?'':'es'} say it out loud. Not yet.`,
           `${p} watches two people talk across camp and reads the whole dynamic from body language alone.`,
           `${p} has been paying quiet attention. More than anyone realized. The picture ${_rrP.sub} ${_rrP.sub==='they'?'have':'has'} is fuller than everyone else's.`];
      events.push({ type: 'readingRoom', text: rrLines[Math.floor(Math.random() * rrLines.length)], players: [p] });

    } else if (eventType === 'allianceCrack') {
      const naMembers = group.filter(n => gs.namedAlliances?.some(a => a.active && a.members.includes(n) && a.members.some(m => group.includes(m) && m !== n)));
      if (!naMembers.length) continue;
      const acA = _pick(naMembers, n => {
        const na = gs.namedAlliances?.find(al => al.active && al.members.includes(n));
        if (!na) return 0.1;
        const allies = na.members.filter(m => group.includes(m) && m !== n);
        const avgB = allies.reduce((s, o) => s + getBond(n, o), 0) / (allies.length || 1);
        return Math.max(0.1, (5 - avgB) * 0.4 + (10 - pStats(n).loyalty) * 0.2 + 1);
      });
      const acNa = gs.namedAlliances?.find(al => al.active && al.members.includes(acA));
      if (!acNa) continue;
      const acAllies = acNa.members.filter(m => group.includes(m) && m !== acA);
      if (!acAllies.length) continue;
      const acB = wRandom(acAllies, n => Math.max(0.1, 5 - getBond(acA, n) + 1));
      addBond(acA, acB, -0.25);
      const _acA = pronouns(acA);
      const crackLines = [
        `${acNa.name} is showing cracks. ${acA} questions whether the alliance can actually last.`,
        `Inside ${acNa.name}, ${acA} watches ${acB} and wonders how much of it is real. The trust is thinning.`,
        `Something ${acB} said lands differently to ${acA} today. ${acNa.name} isn't as solid as it looks.`,
        `${acA} starts wondering whether ${acB} is playing ${_acA.obj} or playing with ${_acA.obj}. ${acNa.name} feels fragile.`,
        `${acA} and ${acB} don't argue. They just stop talking for a stretch. Inside ${acNa.name}, that silence means something.`,
        `${acA} catches ${acB} in a conversation that wasn't meant for ${_acA.obj}. ${acNa.name} has a leak.`,
        `${acA} hasn't been told the full ${acNa.name} plan in two days. The exclusion is quiet but deliberate.`,
        `${acA} tests ${acB} with a small piece of information. When it comes back wrong, ${_acA.sub} ${_acA.sub==='they'?'know':'knows'} ${acNa.name} has a trust problem.`,
      ];
      events.push({ type: 'allianceCrack', text: crackLines[Math.floor(Math.random() * crackLines.length)], players: [acA, acB], alliance: acNa.name });

    } else if (eventType === 'sideDeal') {
      const sdCandidates = group.filter(n => {
        const na = gs.namedAlliances?.find(a => a.active && a.members.includes(n));
        if (!na) return true;
        const allies = na.members.filter(m => group.includes(m) && m !== n);
        return !allies.length || isAllianceBottom(n, na.members);
      });
      if (!sdCandidates.length) continue;
      const sdA = _pick(sdCandidates, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).boldness * 0.2 + 1));
      const sdOthers = group.filter(p => p !== sdA);
      if (!sdOthers.length) continue;
      const sdB = wRandom(sdOthers, n => Math.max(0.1, getBond(sdA, n) * 0.2 + pStats(n).social * 0.3 + 1));
      addBond(sdA, sdB, 0.5);
      const _sdA = pronouns(sdA);
      const sdLines = [
        `${sdA} finds a quiet moment with ${sdB}. What starts as small talk becomes something deliberate.`,
        `${sdA} approaches ${sdB} away from the group. The conversation is short. The implications are not.`,
        `${sdA} makes a quiet move toward ${sdB}. ${_sdA.Sub} ${_sdA.sub==='they'?'don\'t':'doesn\'t'} need permission from anyone. That's the point.`,
        `${sdA} tests the waters with ${sdB}. Nothing committed. But the door is open now.`,
        `${sdA} has been thinking about a different path. ${sdB} is the first person ${_sdA.sub} bring${_sdA.sub==='they'?'':'s'} it to.`,
        `${sdA} whispers something to ${sdB} on the walk back from the well. ${sdB} doesn't react publicly. Privately, the gears start turning.`,
        `${sdA} and ${sdB} have a conversation the rest of the tribe doesn't see. By tomorrow, the game might look different.`,
        `${sdA} pulls ${sdB} aside with a pitch that's either brilliant or desperate. ${sdB} is going to sleep on it.`,
      ];
      events.push({ type: 'strategicApproach', text: sdLines[Math.floor(Math.random() * sdLines.length)], players: [sdA, sdB] });

    } else if (eventType === 'bigMoveThoughts') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, pStats(n).strategic * 0.5 + pStats(n).boldness * 0.2 + ((st.bigMoves || 0) === 0 ? 2 : 0) + 1);
      });
      const _bmP = pronouns(p);
      const strP = pStats(p).strategic;
      const bmLines = strP >= 8
        ? [`${p}: "I've been patient. Too patient. Something has to change — and I'm the one who changes it."`,
           `${p} has been running the numbers on a move nobody else has considered. ${_bmP.Sub} might actually do it.`,
           `${p} knows the jury is watching. ${_bmP.Sub} know${_bmP.sub==='they'?'':'s'} ${_bmP.sub} need${_bmP.sub==='they'?'':'s'} a moment ${_bmP.sub} can point to.`]
        : [`${p} has been playing it safe for too long. ${_bmP.Sub} know${_bmP.sub==='they'?'':'s'} it. The game is moving past ${_bmP.obj}.`,
           `${p} to the confessional: "I need to do something. I need them to know I was here."`,
           `${p} contemplates a move that could flip everything. ${_bmP.Sub} run${_bmP.sub==='they'?'':'s'} it over and over.`];
      events.push({ type: 'bigMoveThoughts', text: bmLines[Math.floor(Math.random() * bmLines.length)], player: p, players: [p] });

    } else if (eventType === 'watchingYou') {
      const wyA = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.5 + pStats(n).strategic * 0.2 + 1));
      const wyOthers = group.filter(p => p !== wyA);
      if (!wyOthers.length) continue;
      const wyB = wRandom(wyOthers, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + 1));
      addBond(wyA, wyB, -0.5);
      const intA = pStats(wyA).intuition;
      const _wyA = pronouns(wyA);
      const wyLines = intA >= 7
        ? [`${wyA} catches ${wyB} watching ${_wyA.obj} from across camp. ${_wyA.Sub} smile${_wyA.sub==='they'?'':'s'} back and give${_wyA.sub==='they'?'':'s'} nothing away.`,
           `${wyA} clocks that ${wyB} has been paying close attention and adjust${_wyA.sub==='they'?'':'s'} accordingly.`,
           `${wyA} notices the surveillance and uses it — feeds ${wyB} exactly what ${_wyA.sub} want${_wyA.sub==='they'?'':'s'} ${wyB} to see.`,
           `${wyA} catches ${wyB}'s eye and holds it. A small acknowledgment: I know you're watching. ${wyB} looks away first.`]
        : [`${wyA} gets the feeling that ${wyB} is watching every move. ${_wyA.Sub} ${_wyA.sub==='they'?'are':'is'} not wrong.`,
           `${wyA} notices ${wyB} tracking where ${_wyA.sub} go${_wyA.sub==='they'?'':'es'} and who ${_wyA.sub} talk${_wyA.sub==='they'?'':'s'} to. It makes ${_wyA.obj} uncomfortable.`,
           `Something changes in how ${wyA} moves through camp after noticing ${wyB}'s attention. ${_wyA.Sub} ${_wyA.sub==='they'?'are':'is'} more careful now.`,
           `${wyA} can feel ${wyB}'s eyes on ${_wyA.obj} during every group conversation. It's not paranoia. It's accurate.`];
      events.push({ type: 'watchingYou', text: wyLines[Math.floor(Math.random() * wyLines.length)] });

    } else if (eventType === 'loneWolf') {
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).loyalty) * 0.4 + pStats(n).boldness * 0.25 + 1));
      const _lwP = pronouns(p);
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.15));
      const lwLines = [
        `${p} declines an alliance approach today. Politely, but clearly. The tribe takes note.`,
        `${p} handles camp alone — no check-ins, no alliances. ${_lwP.Sub} seem${_lwP.sub==='they'?'':'s'} fine with that.`,
        `${p} makes it clear — quietly — that ${_lwP.sub} ${_lwP.sub==='they'?'are':'is'} not locking in right now. The tribe finds this suspicious.`,
        `${p} pulls back from the social game entirely for a day. Confidence or detachment. The tribe hasn't decided which.`,
        `${p} eats alone. Not angrily — just... alone. The tribe watches from a distance and wonders what ${_lwP.posAdj} game actually is.`,
        `${p} goes for a walk and doesn't come back for hours. When ${_lwP.sub} ${_lwP.sub==='they'?'do':'does'}, ${_lwP.sub} ${_lwP.sub==='they'?'don\'t':'doesn\'t'} explain where ${_lwP.sub} went.`,
        `${p} sits at the edge of every group conversation. Present but not participating. It's calculated or it's checked out. Nobody can tell.`,
        `Someone tries to loop ${p} into the vote discussion. ${p} listens, nods, contributes nothing. The non-answer is an answer.`,
      ];
      events.push({ type: 'loneWolf', text: lwLines[Math.floor(Math.random() * lwLines.length)], player: p, players: [p] });

    } else if (eventType === 'tribeMood') {
      const tmP = group[Math.floor(Math.random() * group.length)];
      const tmOthers = group.filter(x => x !== tmP);
      const tmB = tmOthers.length ? tmOthers[Math.floor(Math.random() * tmOthers.length)] : null;
      const _tmP = pronouns(tmP);
      const moodLines = [
        `A quiet morning at camp. For one hour, nobody talks about the game.`,
        tmB ? `The tribe reaches an unspoken agreement to just exist today. ${tmP} and ${tmB} fish. Nobody makes a move.` : `For once, camp feels like a place people are living — not just surviving.`,
        `The collective exhaustion sets in. Everyone feels it. Nobody wants to be the first to say so.`,
        tmB ? `${tmP} and ${tmB} exchange a look across camp that says everything the game won't let them say out loud.` : `${tmP} stands at the edge of camp watching the water for a long time. Nobody disturbs ${_tmP.obj}.`,
        `There's a moment at sunset where the game disappears — for everyone, briefly. Then it comes back.`,
        `The tribe laughs together at something dumb. For thirty seconds it doesn't feel like a competition.`,
      ];
      events.push({ type: 'tribeMood', text: moodLines[Math.floor(Math.random() * moodLines.length)] });

    // ══════════════════════════════════════════════════════════
    // ARCHETYPE-SPECIFIC EVENTS
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'schemerManipulates') {
      // Schemer builds false trust — target bond rises (they're being played)
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.5 + (10 - pStats(n).loyalty) * 0.4 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.2 + 2));
      addBond(b, a, 0.6); // b trusts a more — they're being played
      const strA = pStats(a).strategic, loA = pStats(a).loyalty;
      const _smA = pronouns(a);
      const smLines = (strA >= 9 && loA <= 3)
        ? [`${a} builds ${b} into their plan so naturally that ${b} thinks the idea was theirs.`,
           `${a} tells ${b} exactly the right things — each word calculated. ${b} walks away feeling trusted. That was the goal.`,
           `${a} spends an hour with ${b} creating a loyalty that doesn't actually exist. ${_smA.Sub} ${_smA.sub==='they'?'are':'is'} very good at this.`]
        : [`${a} pulls ${b} close with information that sounds valuable. Some of it is. The rest is useful to ${a}.`,
           `${a} makes ${b} feel like an equal partner. The split of power in their arrangement is not equal.`,
           `${a} works ${b} through a slow conversation that ends with ${b} committed to something ${_smA.sub} barely had to ask for.`];
      events.push({ type: 'schemerManipulates', text: smLines[Math.floor(Math.random() * smLines.length)], player: a, players: [a, b] });

    } else if (eventType === 'mastermindOrchestrates') {
      // Mastermind quietly engineers something without anyone knowing
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).mental * 0.3 + pStats(n).temperament * 0.1 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.4);
      const strA = pStats(a).strategic, tmpA = pStats(a).temperament;
      const _mmA = pronouns(a);
      const mmLines = (strA >= 9 && tmpA >= 5)
        ? [`${a} doesn't tell anyone what ${_mmA.sub} ${_mmA.sub==='they'?'are':'is'} doing. The tribe just finds itself moving in the direction ${_mmA.sub} chose.`,
           `${a} runs three separate conversations through ${b} without ${b} realizing they're a relay. The message arrives exactly where it needed to.`,
           `${a} made something happen today without being visible anywhere near it. That's the whole point.`]
        : [`${a} positions ${b} for a move ${_mmA.sub} won't make until next week. ${b} has no idea ${_mmA.sub}'s already that far ahead.`,
           `${a} and ${b} have a conversation that looks like small talk and functions as architecture.`,
           `${a} didn't speak much at camp today. ${_mmA.Sub} didn't need to. The pieces are already where ${_mmA.sub} put${_mmA.sub==='they'?'':'s'} them.`];
      events.push({ type: 'mastermindOrchestrates', text: mmLines[Math.floor(Math.random() * mmLines.length)], player: a, players: [a, b] });

    } else if (eventType === 'hotheadExplosion') {
      // Hothead loses control — wide bond damage
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.7 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = others[Math.floor(Math.random() * others.length)];
      addBond(a, b, -2.0);
      group.filter(x => x !== a && x !== b).forEach(other => addBond(a, other, -0.5));
      const tmpA = pStats(a).temperament;
      const _hhA = pronouns(a);
      const hhLines = tmpA <= 2
        ? [`${a} goes off. Completely. There is no specific trigger — there doesn't need to be. ${b} is just in the way.`,
           `${a} erupts at ${b} over something trivial and the escalation is immediate. The whole tribe takes two steps back.`,
           `Something flips in ${a} and ${b} is directly in the blast radius. The tribe doesn't intervene. Nobody wants to be next.`]
        : tmpA <= 4
        ? [`${a} snaps hard at ${b}. The comment lands like a slap. ${_hhA.Sub} don't${_hhA.sub==='they'?'':'es'} take it back.`,
           `${a} says something to ${b} that cannot be unsaid. The tribe goes silent. Nobody looks at anyone.`,
           `${a} gets in ${b}'s face. The words are sharp and personal. ${b} doesn't respond. That might be worse.`]
        : [`${a} loses the composure ${_hhA.sub} usually ${_hhA.sub==='they'?'maintain':'maintains'}. It comes out on ${b}. The tribe clocks it.`,
           `${a} cracks and it's aimed at ${b}. The outburst is brief but the damage is real.`];
      events.push({ type: 'hotheadExplosion', text: hhLines[Math.floor(Math.random() * hhLines.length)], player: a, players: [a] });

    } else if (eventType === 'beastDrills') {
      // Challenge beast is training — tribe grows quietly threatened
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.5 + pStats(n).endurance * 0.4 + 1));
      group.filter(x => x !== a).forEach(other => addBond(other, a, -0.2));
      const phA = pStats(a).physical, enA = pStats(a).endurance;
      const _bdA = pronouns(a);
      const bdLines = (phA >= 9 && enA >= 8)
        ? [`${a} is up at dawn running the perimeter. Twice. Then comes back and does camp chores. The tribe watches with unease.`,
           `${a} doesn't stop moving. Drills, physical tasks, hauling, lifting. ${_bdA.Sub} ${_bdA.sub==='they'?'are':'is'} preparing for something. The tribe can feel it.`,
           `The tribe quietly counts how many challenges ${a} would have won so far. It's all of them. This is a problem.`]
        : (phA >= 7 || enA >= 7)
        ? [`${a} pushes through camp tasks like they're warmups. The rest of the tribe can't keep up and tries not to show it.`,
           `${a} works longer than everyone else and shows zero fatigue. The others exchange a look.`,
           `${a} is still going when everyone else has stopped. The tribe files it away: challenge threat. Real one.`]
        : [`${a} takes on the hardest physical camp task without hesitation. It's done in half the time anyone expected.`,
           `${a} doesn't train — ${_bdA.sub} just ${_bdA.sub==='they'?'work':'works'}. The output is the same. The tribe takes note.`];
      if (!gs.beastDrillsThisEp) gs.beastDrillsThisEp = new Set();
      gs.beastDrillsThisEp.add(a);
      events.push({ type: 'beastDrills', text: bdLines[Math.floor(Math.random() * bdLines.length)], player: a, players: [a] });

    } else if (eventType === 'socialBoost') {
      // Social butterfly lifts the whole tribe's mood
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.6 + pStats(n).temperament * 0.2 + 1));
      group.filter(x => x !== a).forEach(other => addBond(a, other, 0.15)); // was 0.3
      const socA = pStats(a).social;
      const _sbA = pronouns(a);
      const sbLines = socA >= 9
        ? [`${a} lifts the entire camp without appearing to try. By evening the tribe is laughing again. Nobody tracks it back to ${_sbA.obj}.`,
           `${a} moves through camp touching every conversation. By sunset everyone feels slightly better. Nobody knows exactly why.`,
           `${a} turns a miserable morning around. The tribe doesn't understand the mechanism. They just know ${_sbA.sub} ${_sbA.sub==='they'?'were':'was'} there.`]
        : socA >= 7
        ? [`${a} keeps the energy at camp from collapsing today. It's not a dramatic thing. It's a dozen small things.`,
           `${a} tells a story after dinner. The tribe listens. For a moment the game disappears and everyone is just present.`,
           `${a} checks in on everyone individually. Nobody felt singled out. Everyone felt seen.`]
        : [`${a} has a way of making silence feel comfortable. Today that was exactly what the tribe needed.`,
           `${a} says the right thing at the right moment. Camp exhales.`];
      events.push({ type: 'socialBoost', text: sbLines[Math.floor(Math.random() * sbLines.length)], player: a, players: [a] });

    } else if (eventType === 'soldierCheckin') {
      // Loyal soldier reaffirms alliance — bond boost
      const a = _pick(group, n => Math.max(0.1, pStats(n).loyalty * 0.6 + (10 - pStats(n).boldness) * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.5 + pStats(n).loyalty * 0.2 + 2));
      addBond(a, b, 0.6);
      const loA = pStats(a).loyalty;
      const _lsA = pronouns(a);
      const lsLines = loA >= 9
        ? [`${a} finds ${b} and says, simply: "We're good. I'm not moving." ${b} believes ${_lsA.obj}. That's the thing about ${_lsA.obj}.`,
           `${a} checks in with ${b} at the end of the day — not to plan, just to confirm. ${_lsA.Sub} ${_lsA.sub==='they'?'are':'is'} steady. That steadiness costs ${_lsA.obj} nothing.`,
           `${a} reassures ${b} without being asked. "Same plan, same people." ${b} nods. In this game that counts for something.`]
        : loA >= 7
        ? [`${a} finds a quiet moment to check in with ${b}. Nothing has changed. ${_lsA.Sub} just want${_lsA.sub==='they'?'':'s'} ${b} to know that.`,
           `${a} pulls ${b} aside — not with information, just with presence. "We're fine." ${b} believes it.`]
        : [`${a} and ${b} exchange a look across camp that means something. No words needed. No words used.`,
           `${a} shows up for ${b} in a small way today. ${b} clocks it. That's how loyalty works in here.`];
      events.push({ type: 'soldierCheckin', text: lsLines[Math.floor(Math.random() * lsLines.length)], player: a, players: [a, b] });

    } else if (eventType === 'wildcardPivot') {
      // Wildcard does something nobody predicted — direction could go either way
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.5 + (10 - pStats(n).loyalty) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      const b = others.length ? wRandom(others, n => Math.max(0.1, Math.random() * 3 + 1)) : null;
      if (b) addBond(a, b, (Math.random() > 0.5 ? 1.0 : -1.0));
      const boA = pStats(a).boldness;
      const _wcA = pronouns(a);
      const wcLines = boA >= 8
        ? [`Nobody predicted ${a}'s next move. Not even ${a}, probably.`,
           `${a} flips the dynamic at camp in a way nobody can immediately explain. The tribe takes a moment.`,
           b ? `${a} gravitates toward ${b} for reasons that don't fit the obvious pattern. The tribe adjusts its read of both of them.`
             : `${a} shifts ${_wcA.posAdj} energy entirely between breakfast and dinner. It is not the same person at both meals.`,
           `${a} says something so unexpected that the tribe goes completely silent. Then looks at each other. Then at ${_wcA.obj}.`]
        : [`${a} moves differently today — not toward the obvious play. The tribe tries to read it.`,
           b ? `${a} and ${b} end up in conversation nobody would have predicted. Nobody knows what to do with that.`
             : `${a} declines to play the expected role today. What ${_wcA.sub} ${_wcA.sub==='they'?'do':'does'} instead doesn't fit any pattern.`];
      events.push({ type: 'wildcardPivot', text: wcLines[Math.floor(Math.random() * wcLines.length)] });

    } else if (eventType === 'chaosAgentStirsUp') {
      // Chaos agent deliberately engineers drama between two others
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + (10 - pStats(n).temperament) * 0.3 + (10 - pStats(n).loyalty) * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (others.length < 2) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.2 + 1));
      const cOthers = others.filter(p => p !== b);
      if (!cOthers.length) continue;
      const c = wRandom(cOthers, n => Math.max(0.1, (5 - getBond(b, n)) * 0.3 + 1));
      addBond(b, c, -0.6);
      const boA = pStats(a).boldness;
      const _caA = pronouns(a);
      const caLines = boA >= 8
        ? [`${a} drops something into the camp conversation that ${_caA.sub} know${_caA.sub==='they'?'':'s'} will land between ${b} and ${c}. ${_caA.Sub} watch${_caA.sub==='they'?'':'es'} from across camp.`,
           `${a} tells ${b} what ${c} said. There are two problems with that: one, ${c} didn't say it. Two, ${b} believes it.`,
           `${a} engineers a misunderstanding between ${b} and ${c}. It takes about thirty seconds and ${_caA.sub}'s already moved on.`]
        : [`${a} says the wrong thing — or exactly the right wrong thing — and watches ${b} and ${c} deal with the fallout.`,
           `${a} stirs something between ${b} and ${c} with one offhand comment. Whether it was intentional is the question.`,
           `${a} pokes at the tension between ${b} and ${c} until it becomes something. That was the goal.`];
      events.push({ type: 'chaosAgentStirsUp', text: caLines[Math.floor(Math.random() * caLines.length)] });

    } else if (eventType === 'floaterInvisible') {
      // Floater successfully goes unnoticed — no bond change, pure flavor
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.4 + pStats(n).social * 0.2 + 1));
      const _flA = pronouns(a);
      const fiLines = [
        `${a} is at every conversation and central to none of them. ${_flA.Sub} ${_flA.sub==='they'?'are':'is'} exactly where ${_flA.sub} want${_flA.sub==='they'?'':'s'} to be.`,
        `The tribe plans around ${a} rather than against ${_flA.obj}. That's not an accident.`,
        `${a} does not come up in any strategic conversation today. ${_flA.Sub} ${_flA.sub==='they'?'have':'has'} worked very hard to ensure that.`,
        `${a} is present at every meal, every task, every fireside chat — and nobody considers ${_flA.obj} a threat. The perfect position.`,
        `Nobody names ${a} as a target today. To the untrained eye that means ${_flA.sub} ${_flA.sub==='they'?'are':'is'} safe. It means more than that.`,
        `${a} agrees with whoever is speaking. Always. The tribe thinks ${_flA.sub} ${_flA.sub==='they'?'have':'has'} no opinion. ${_flA.Sub} ${_flA.sub==='they'?'have':'has'} plenty — ${_flA.sub} just ${_flA.sub==='they'?'keep':'keeps'} them quiet.`,
        `${a} moves through camp like wallpaper. People talk freely around ${_flA.obj} because they forget ${_flA.sub} ${_flA.sub==='they'?'are':'is'} there. That's the whole strategy.`,
        `${a} hasn't been on anyone's radar for three episodes. In this game, invisibility is a superpower — until it isn't.`,
      ];
      events.push({ type: 'floaterInvisible', text: fiLines[Math.floor(Math.random() * fiLines.length)], player: a, players: [a] });

    } else if (eventType === 'underdogMoment') {
      // Underdog shows quiet resilience — small bond boost with tribe
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).physical) * 0.3 + pStats(n).loyalty * 0.3 + (10 - pStats(n).boldness) * 0.1 + 1));
      group.filter(x => x !== a).forEach(other => addBond(a, other, 0.2));
      const loA = pStats(a).loyalty, phA = pStats(a).physical;
      const _udA = pronouns(a);
      const udLines = (loA >= 8 && phA <= 5)
        ? [`${a} has no business still being here — and knows it. That knowledge drives ${_udA.obj} harder than talent ever could.`,
           `${a} does more at camp than anyone expected. Not because ${_udA.sub} ${_udA.sub==='they'?'are':'is'} the best at any of it. Because ${_udA.sub} won't stop trying.`,
           `The tribe looks at ${a} and sees a non-threat. ${a} looks at the tribe and sees an opportunity.`]
        : [`${a} doesn't fit the profile of someone who makes it far. ${_udA.Sub} ${_udA.sub==='they'?'are':'is'} still here, still contributing, still invisible on the threat board.`,
           `${a} earns something from the tribe today — not respect exactly, but something adjacent to it.`,
           `Nobody expected ${a} to matter this much. ${_udA.Sub} ${_udA.sub==='they'?'are':'is'} quietly compiling a case for why ${_udA.sub} belongs here.`];
      events.push({ type: 'underdogMoment', text: udLines[Math.floor(Math.random() * udLines.length)], player: a, players: [a] });

    } else if (eventType === 'goatOblivious') {
      // Goat is unaware of how the tribe actually sees them, gets actively used
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).strategic) * 0.5 + (10 - pStats(n).boldness) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      const b = others.length ? wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.4 + 1)) : null;
      if (b) addBond(b, a, 0.3); // strategic player values their goat
      const strA = pStats(a).strategic;
      const _goA = pronouns(a);
      const goLines = strA <= 3
        ? [`${a} is having a great day. The tribe is having a great day because ${_goA.sub} ${_goA.sub==='they'?'are':'is'} having a great day. Nobody mentions what they all know.`,
           `${a} tells the confessional ${_goA.sub} think${_goA.sub==='they'?'':'s'} ${_goA.sub} ${_goA.sub==='they'?'are':'is'} in a really good spot. ${_goA.Sub} ${_goA.sub==='they'?'are':'is'} in the spot everyone wants ${_goA.obj} in.`,
           b ? `${b} protects ${a} from a conversation that would have changed ${_goA.posAdj} whole read of the game. ${b} needs ${a} exactly as ${_goA.sub} ${_goA.sub==='they'?'are':'is'}.`
             : `${a} is safe. Completely. That safety has nothing to do with ${_goA.posAdj} game and everything to do with who everyone is planning to beat.`]
        : [`${a} moves through camp without reading the subtext. The subtext is about ${_goA.obj}.`,
           b ? `${b} makes sure ${a} feels valued today. It costs ${b} nothing. It means everything to ${a}.`
             : `${a} isn't playing the game aggressively. The tribe has filed that information in a very specific place.`];
      events.push({ type: 'goatOblivious', text: goLines[Math.floor(Math.random() * goLines.length)] });

    } else if (eventType === 'perceptiveReads') {
      // Perceptive player catches something others missed — trust in target drops
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.6 + pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + 1));
      addBond(a, b, -0.5);
      const intA = pStats(a).intuition, socA = pStats(a).social;
      const _prA = pronouns(a);
      const prLines = (intA >= 8 && socA >= 7)
        ? [`${a} catches something in ${b}'s story that doesn't line up. ${_prA.Sub} don't${_prA.sub==='they'?'':'es'} call it out. ${_prA.Sub} just know${_prA.sub==='they'?'':'s'} now.`,
           `${a} reads ${b}'s body language through a conversation they weren't technically part of. The conclusion changes how ${_prA.sub} see${_prA.sub==='they'?'':'s'} the next three days.`,
           `${a} in confessional: "They think they're being subtle. They're not. I've known for two days."`,
           `${a} watches ${b} talk to the tribe and hears the version under the version. The tribe takes it at face value. ${_prA.Sub} can't.`]
        : intA >= 7
        ? [`${a} doesn't have proof — but ${_prA.sub} ${_prA.sub==='they'?'have':'has'} enough. ${_prA.Sub} start${_prA.sub==='they'?'':'s'} adjusting accordingly.`,
           `Something ${b} said confirms what ${a} suspected. The tribe doesn't see it yet.`,
           `${a} has been watching ${b}. Today, ${b} gave something away without knowing it. ${a} filed it.`]
        : [`${a} senses something is off with ${b} before anyone else does. ${_prA.Sub} can't explain exactly how. ${_prA.Sub} know${_prA.sub==='they'?'':'s'} what ${_prA.sub} know${_prA.sub==='they'?'':'s'}.`,
           `${a} checks in with ${b}. The response is slightly wrong. Not wrong enough for anyone else to notice. ${a} notices.`];
      events.push({ type: 'perceptiveReads', text: prLines[Math.floor(Math.random() * prLines.length)] });

    // ── NEW POSITIVE EVENTS ──

    } else if (eventType === 'teachingMoment') {
      // Experienced player helps someone with a skill — requires stat gap
      const teachers = group.filter(n => pStats(n).physical >= 7 || pStats(n).strategic >= 7 || pStats(n).mental >= 7);
      if (!teachers.length) continue;
      const a = _pick(teachers, n => Math.max(0.1, Math.max(pStats(n).physical, pStats(n).strategic, pStats(n).mental) * 0.4 + 1));
      const aS = pStats(a);
      // Pick what they teach based on their strongest stat
      const _teachStat = aS.physical >= aS.strategic && aS.physical >= aS.mental ? 'physical'
        : aS.strategic >= aS.mental ? 'strategic' : 'mental';
      // Recipient must be weak in that stat
      const learners = group.filter(p => p !== a && pStats(p)[_teachStat] <= 5);
      if (!learners.length) continue;
      const b = wRandom(learners, n => Math.max(0.1, (6 - pStats(n)[_teachStat]) * 0.4 + 1));
      addBond(a, b, 0.5);
      addBond(b, a, 0.5);
      const pA = pronouns(a), pB = pronouns(b);
      const _teachLines = _teachStat === 'physical'
        ? [`${a} shows ${b} a better technique for the obstacle course. ${b} picks it up fast. The tribe watches the dynamic shift.`,
           `${a} spends an hour coaching ${b} through a challenge drill. By the end, ${b} is noticeably better. And noticeably grateful.`,
           `${b} was struggling with the physical demands. ${a} pulled ${pB.obj} aside and worked through it. No judgment. Just help.`]
        : _teachStat === 'strategic'
        ? [`${a} walks ${b} through the vote math — who's with who, where the cracks are. ${b}'s eyes widen. ${pB.Sub} didn't see it before.`,
           `${a} and ${b} sit on the beach and ${a} breaks down the game in a way ${b} has never heard. Teacher and student. The tribe doesn't know this is happening.`,
           `${a} doesn't tell ${b} what to do — ${pA.sub} ask${pA.sub==='they'?'':'s'} questions until ${b} figures it out. It's more effective than any alliance pitch.`]
        : [`${a} helps ${b} with a puzzle technique. Something clicks. ${b} solves it twice as fast the second time.`,
           `${a} shows ${b} a memory trick for keeping track of camp conversations. Small thing. But ${b} starts catching things ${pB.sub} missed before.`,
           `${a} and ${b} practice puzzle patterns by the fire. It's quiet, focused, and by the end ${b} feels sharper. ${a} feels useful.`];
      events.push({ type: 'teachingMoment', text: _teachLines[Math.floor(Math.random() * _teachLines.length)], players: [a, b] });

    } else if (eventType === 'vulnerability') {
      // Player opens up emotionally — requires social >= 5, temperament <= 6, bond >= 1 with recipient
      const openers = group.filter(n => pStats(n).social >= 5 && pStats(n).temperament <= 6);
      if (!openers.length) continue;
      const a = _pick(openers, n => Math.max(0.1, pStats(n).social * 0.4 + (7 - pStats(n).temperament) * 0.3 + 1));
      const trusted = group.filter(p => p !== a && getBond(a, p) >= 1);
      if (!trusted.length) continue;
      const b = wRandom(trusted, n => Math.max(0.1, getBond(a, n) * 0.5 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.6);
      addBond(b, a, 0.6);
      const pA = pronouns(a);
      const _vulnLines = [
        `${a} tells ${b} something ${pA.sub} haven't told anyone else out here. About home. About why ${pA.sub} ${pA.sub==='they'?'are':'is'} really here. ${b} listens without interrupting.`,
        `It's late. The fire is low. ${a} opens up to ${b} about something real — not strategy, not the game. Just life. ${b} doesn't know what to say, but ${pA.sub} stay${pA.sub==='they'?'':'s'}.`,
        `${a} breaks down in front of ${b}. Not in a dramatic way — just honestly. ${b} doesn't try to fix it. Just sits there. That's enough.`,
        `${a} admits to ${b} that ${pA.sub}'${pA.sub==='they'?'re':'s'} scared. Not of the game — of what it's bringing out in ${pA.obj}. ${b} says something simple that lands.`,
        `${a} talks about missing home. ${b} lets ${pA.obj} talk. By the end, something has shifted between them — not strategy, just trust.`,
      ];
      events.push({ type: 'vulnerability', text: _vulnLines[Math.floor(Math.random() * _vulnLines.length)], players: [a, b] });

    } else if (eventType === 'insideJoke') {
      // Two bonded players develop a running bit — bond >= 1, at least one has temperament >= 6
      const candidates = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (getBond(group[i], group[j]) >= 1 && (pStats(group[i]).temperament >= 6 || pStats(group[j]).temperament >= 6)) {
            candidates.push([group[i], group[j]]);
          }
        }
      }
      if (!candidates.length) continue;
      const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
      addBond(a, b, 0.3);
      const _jokeLines = [
        `${a} and ${b} have a bit going. Nobody else gets it. Every time they make eye contact across camp, one of them breaks.`,
        `${a} says two words and ${b} is gone. Full tears laughing. The tribe watches, confused. "You had to be there" doesn't cover it.`,
        `${a} and ${b} have been doing a running impression of the host all day. It's gotten worse. It's gotten funnier.`,
        `There's a noise from the jungle and ${a} and ${b} say the exact same thing at the exact same time. The tribe stares. They lose it.`,
        `${a} and ${b} invented a handshake. It's stupid. They do it every time they pass each other. The tribe is either charmed or annoyed.`,
      ];
      events.push({ type: 'insideJoke', text: _jokeLines[Math.floor(Math.random() * _jokeLines.length)], players: [a, b] });

    } else if (eventType === 'loyaltyProof') {
      // Player defends someone who isn't present — loyalty >= 6, bond >= 2
      const defenders = group.filter(n => pStats(n).loyalty >= 6);
      if (!defenders.length) continue;
      const a = _pick(defenders, n => Math.max(0.1, pStats(n).loyalty * 0.5 + 1));
      // Defended person must be in the group and bonded to defender
      const defended = group.filter(p => p !== a && getBond(a, p) >= 2);
      if (!defended.length) continue;
      const b = wRandom(defended, n => Math.max(0.1, getBond(a, n) * 0.4 + 1));
      addBond(a, b, 0.8);
      const pA = pronouns(a), pB = pronouns(b);
      const _defLines = [
        `Someone starts talking about ${b} when ${pB.sub}'${pB.sub==='they'?'re':'s'} not around. ${a} shuts it down. "That's not what happened." The conversation ends.`,
        `${a} hears ${b}'s name come up as a target. ${pA.Sub} don't${pA.sub==='they'?'':'es'}n't campaign — ${pA.sub} just say${pA.sub==='they'?'':'s'} one thing: "Not ${b}." It carries weight.`,
        `${a} catches wind of a plan against ${b} and quietly redirects the conversation. ${b} will never know. ${a} doesn't need ${pB.obj} to.`,
        `The tribe is venting about ${b}. ${a} stays quiet until it goes too far, then says something that changes the temperature. Nobody comes for ${b} again that day.`,
        `${a} goes to bat for ${b} in a strategy conversation. It's not subtle. The tribe reads it as loyalty — because it is.`,
      ];
      events.push({ type: 'loyaltyProof', text: _defLines[Math.floor(Math.random() * _defLines.length)], players: [a, b] });

    // ── NEW NEGATIVE EVENTS ──

    } else if (eventType === 'jealousy') {
      // Player resents another's challenge success — worse record + loyalty <= 6
      const _chalRec = gs.chalRecord || {};
      const withRecords = group.filter(n => (_chalRec[n]?.wins || 0) > 0 || (_chalRec[n]?.podiums || 0) > 0);
      if (!withRecords.length) continue;
      // Target: someone with good challenge record
      const target = wRandom(withRecords, n => Math.max(0.1, (_chalRec[n]?.wins || 0) * 2 + (_chalRec[n]?.podiums || 0) + 1));
      // Jealous player: worse record AND loyalty <= 6
      const jealousPool = group.filter(p => p !== target && pStats(p).loyalty <= 6 &&
        ((_chalRec[p]?.wins || 0) < (_chalRec[target]?.wins || 0) || (_chalRec[p]?.podiums || 0) < (_chalRec[target]?.podiums || 0)));
      if (!jealousPool.length) continue;
      const a = _pick(jealousPool, n => Math.max(0.1, (7 - pStats(n).loyalty) * 0.4 + pStats(n).boldness * 0.2 + 1));
      addBond(a, target, -0.6);
      const pA = pronouns(a), pT = pronouns(target);
      const _jealLines = [
        `${a} watches ${target} get congratulated after the challenge. ${pA.Sub} clap${pA.sub==='they'?'':'s'} along. The smile doesn't reach ${pA.posAdj} eyes.`,
        `${a} tells the confessional: "${target} wins again. Good for ${pT.obj}. I'm thrilled." ${pA.Sub} ${pA.sub==='they'?'are':'is'} not thrilled.`,
        `${target}'s challenge streak is getting attention. ${a} notices — and not in a supportive way. The resentment is quiet but growing.`,
        `${a} makes a comment about ${target}'s wins that sounds like a compliment but lands like something else. The tribe catches the tone.`,
        `Every time ${target}'s name comes up as a threat, ${a} nods a little too eagerly. The jealousy is becoming strategy.`,
      ];
      events.push({ type: 'jealousy', text: _jealLines[Math.floor(Math.random() * _jealLines.length)], players: [a, target] });

    } else if (eventType === 'exclusion') {
      // Player left out of group conversation — low social OR minority position
      const socialScores = group.map(n => ({ name: n, social: pStats(n).social })).sort((a, b) => a.social - b.social);
      // Excluded: lowest social, or lowest average bond with group
      const excluded = socialScores[0].name;
      if (pStats(excluded).social > 5) continue; // only fires for genuinely low-social players
      const others = group.filter(p => p !== excluded);
      // Need at least 3 others who are bonded to each other
      const _groupBonds = others.filter(p => others.filter(q => q !== p && getBond(p, q) >= 1).length >= 2);
      if (_groupBonds.length < 3) continue;
      _groupBonds.forEach(p => addBond(excluded, p, -0.4));
      const pE = pronouns(excluded);
      const _exclLines = [
        `The tribe clusters into a conversation that ${excluded} isn't part of. ${pE.Sub} hover${pE.sub==='they'?'':'s'} at the edge, waiting for an opening. It doesn't come.`,
        `${excluded} walks up to a group conversation and it goes quiet. They say it's nothing. ${excluded} knows it's not nothing.`,
        `${excluded} eats alone today. Not by choice — the tribe just... forgot to include ${pE.obj}. Or didn't forget.`,
        `There's a strategy meeting happening. ${excluded} finds out about it after. ${pE.Sub} pretend${pE.sub==='they'?'':'s'} not to care. The pretending is visible.`,
        `The tribe laughs at something. ${excluded} asks what's funny. "You had to be there." ${pE.Sub} ${pE.sub==='they'?'were':'was'} there. Just not included.`,
      ];
      events.push({ type: 'exclusion', text: _exclLines[Math.floor(Math.random() * _exclLines.length)], players: [excluded] });

    } else if (eventType === 'blame') {
      // Someone blamed for challenge loss — target must have actually performed poorly
      const _lastChalScores = gs.episodeHistory?.[gs.episodeHistory.length - 1]?.chalMemberScores;
      if (!_lastChalScores) continue;
      // Find worst performers who are in this group
      const _groupScores = group.filter(n => _lastChalScores[n] !== undefined)
        .map(n => ({ name: n, score: _lastChalScores[n] }))
        .sort((a, b) => a.score - b.score);
      if (_groupScores.length < 2) continue;
      const target = _groupScores[0].name; // worst performer
      // Blamer: someone who performed better and is bold enough to say it
      const blamers = group.filter(p => p !== target && (_lastChalScores[p] || 0) > (_lastChalScores[target] || 0) && pStats(p).boldness >= 5);
      if (!blamers.length) continue;
      const a = _pick(blamers, n => Math.max(0.1, pStats(n).boldness * 0.4 + (10 - pStats(n).loyalty) * 0.2 + 1));
      addBond(a, target, -0.7);
      addBond(target, a, -0.7);
      const pA = pronouns(a), pT = pronouns(target);
      const _blameLines = [
        `${a} brings it up at camp. "We lost because of that puzzle." Everyone knows ${pA.sub} mean${pA.sub==='they'?'':'s'} ${target}. ${target} knows too.`,
        `${a} doesn't name names — but the way ${pA.sub} describe${pA.sub==='they'?'':'s'} the challenge loss makes it clear who ${pA.sub} blame${pA.sub==='they'?'':'s'}. ${target} stares at the fire.`,
        `"We had it. We literally had it." ${a} looks at ${target} for one second too long. The accusation is silent but deafening.`,
        `${a} replays the challenge loss out loud. Every detail points to ${target}. ${pA.Sub} ${pA.sub==='they'?'say':'says'} it's just analysis. It's not just analysis.`,
        `${target} apologizes for the challenge performance. ${a} accepts the apology in a way that makes it worse. "It's fine." It's not fine.`,
      ];
      events.push({ type: 'blame', text: _blameLines[Math.floor(Math.random() * _blameLines.length)], players: [a, target] });

    } else if (eventType === 'passiveAggressive') {
      // Subtle dig — initiator: temperament <= 5, target: bond <= 1 with initiator
      const paPool = group.filter(n => pStats(n).temperament <= 5);
      if (!paPool.length) continue;
      const a = _pick(paPool, n => Math.max(0.1, (6 - pStats(n).temperament) * 0.4 + pStats(n).strategic * 0.2 + 1));
      const targets = group.filter(p => p !== a && getBond(a, p) <= 1);
      if (!targets.length) continue;
      const b = wRandom(targets, n => Math.max(0.1, (2 - getBond(a, n)) * 0.3 + 1));
      addBond(a, b, -0.4);
      // Witnesses lose respect for the initiator
      group.filter(p => p !== a && p !== b).forEach(p => addBond(p, a, -0.2));
      const pA = pronouns(a), pB = pronouns(b);
      const _paLines = [
        `${a} makes a comment about ${b}'s strategy that sounds like a compliment. It's not. Everyone at the fire shifts uncomfortably.`,
        `"No, that's a great idea, ${b}." The way ${a} says it makes ${b} want to take it back. The tribe exchanges glances.`,
        `${a} offers to help ${b} with camp duties in a tone that implies ${b} can't handle it alone. ${b} declines. The damage is done.`,
        `${a} says something to ${b} with a smile. The words are fine. The delivery is surgical. The tribe pretends not to notice.`,
        `${a} brings up something ${b} said three days ago — casually, in front of everyone. The context makes ${b} look bad. ${a} acts surprised that it landed that way.`,
      ];
      events.push({ type: 'passiveAggressive', text: _paLines[Math.floor(Math.random() * _paLines.length)], players: [a, b] });

    } else if (eventType === 'trustCrack') {
      // Caught in a contradiction — target must have actually contradicted themselves
      // Detector needs intuition >= 6
      const detectors = group.filter(n => pStats(n).intuition >= 6);
      if (!detectors.length) continue;
      // Target: in multiple alliances with conflicting members, OR voted differently than stated
      const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
      const _multiAlliancePlayers = group.filter(n => {
        const myAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(n));
        if (myAlliances.length < 2) return false;
        // Check if alliances have conflicting membership (members in one but not the other)
        const allMembers = myAlliances.flatMap(a => a.members);
        const unique = [...new Set(allMembers)];
        return unique.length > myAlliances[0].members.length + 1; // overlapping but different groups
      });
      const _contradictors = _prevEp?.votingLog
        ? group.filter(n => {
            const vote = _prevEp.votingLog.find(v => v.voter === n);
            if (!vote) return false;
            // Check if they voted against their own alliance's target
            const myAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(n));
            return myAlliance && vote.voted !== n && _prevEp.votes?.[vote.voted] !== undefined;
          })
        : [];
      const targets = [...new Set([..._multiAlliancePlayers, ..._contradictors])].filter(n => detectors.some(d => d !== n));
      if (!targets.length) continue;
      const b = targets[Math.floor(Math.random() * targets.length)];
      const detectPool = detectors.filter(d => d !== b);
      if (!detectPool.length) continue;
      const a = _pick(detectPool, n => Math.max(0.1, pStats(n).intuition * 0.5 + 1));
      addBond(a, b, -0.8);
      const pA = pronouns(a), pB = pronouns(b);
      const _isMulti = _multiAlliancePlayers.includes(b);
      const _crackLines = _isMulti
        ? [`${a} has been doing the math. ${b} is in two alliances that can't both survive. ${a} brings it up — not to ${b}. To someone who matters more.`,
           `${a} realizes ${b} has been making promises to two different groups. The timelines don't match. ${a} files that information somewhere dangerous.`,
           `"Who are you actually with?" ${a} asks ${b} directly. ${b}'s answer takes half a second too long. ${a} got what ${pA.sub} needed.`,
           `${a} compares notes with someone else. ${b}'s story to them doesn't match ${b}'s story to ${a}. The contradiction is undeniable.`]
        : [`${a} noticed something at the last tribal. ${b}'s vote didn't match what ${pB.sub} said ${pB.sub} ${pB.sub==='they'?'were':'was'} going to do. ${a} hasn't mentioned it yet. But ${pA.sub} will.`,
           `${a} pulls the voting data apart in ${pA.posAdj} head. ${b} was supposed to vote one way. ${pB.Sub} didn't. ${a} doesn't confront — ${pA.sub} adjust${pA.sub==='they'?'':'s'}.`,
           `Something ${b} said yesterday contradicts what ${pB.sub} did at tribal. ${a} caught it. The trust between them just cracked.`];
      events.push({ type: 'trustCrack', text: _crackLines[Math.floor(Math.random() * _crackLines.length)], players: [a, b] });
    }
  }

  // ── EXTREME BOND EVENTS: rare events that only fire for very high or very low bonds ──
  const _rp2 = arr => arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const _eb = getBond(group[i], group[j]);
      const a = group[i], b = group[j];
      const pA = pronouns(a), pB = pronouns(b);

      // ── PURE HATRED (-9 or worse) ──
      if (_eb <= -9 && Math.random() < 0.55) {
        addBond(a, b, -0.8);
        group.filter(p => p !== a && p !== b).forEach(p => { addBond(p, a, -0.3); addBond(p, b, -0.3); });
        events.push({ type: 'pureHatred', players: [a, b], text: _rp2([
          `${a} and ${b} can't be in the same space. The tribe has stopped trying to fix it. They just keep them apart now.`,
          `${a} moves ${pA.pos} things to the other side of camp. Nobody asks why. Everyone already knows — ${b} is the reason.`,
          `${a} refuses to eat if ${b} is at the fire. It's not strategy. It's not a move. It's personal in a way this game rarely sees.`,
          `The hatred between ${a} and ${b} is so visible that the rest of the tribe routes around it. Nobody sits between them. Nobody mediates. They just survive it.`,
          `${b} says something and ${a} stands up and walks into the jungle without a word. ${pA.Sub} ${pA.sub==='they'?'don\'t':'doesn\'t'} come back for an hour.`,
          `${a} talks about ${b} to the confessional like ${pB.sub} ${pB.sub==='they'?'aren\'t':'isn\'t'} even a person anymore. Just a problem to solve. The contempt is total.`,
          `The tribe tried to have a group conversation. ${a} walked away the moment ${b} sat down. Nobody even pretended to be surprised.`,
          `${a} won't say ${b}'s name. Not at tribal, not at camp, not in confessional. ${pA.Sub} just ${pA.sub==='they'?'say':'says'} "that person." The tribe knows exactly who ${pA.sub} ${pA.sub==='they'?'mean':'means'}.`,
          `${b} accidentally brushes past ${a} on the way to the well. ${a} recoils like ${pA.sub} ${pA.sub==='they'?'were':'was'} burned. The rest of the tribe freezes.`,
          `Someone makes the mistake of sitting between ${a} and ${b} at the fire. The temperature on both sides drops. They don't make that mistake again.`,
        ]) });
      }

      // ── NEMESIS (-7 to -9) ──
      else if (_eb <= -7 && Math.random() < 0.40) {
        addBond(a, b, -0.5);
        if (gs.playerStates?.[a] && pStats(a).temperament <= 5) gs.playerStates[a].emotional = 'paranoid';
        else if (gs.playerStates?.[b] && pStats(b).temperament <= 5) gs.playerStates[b].emotional = 'paranoid';
        events.push({ type: 'nemesis', players: [a, b], text: _rp2([
          `${a} and ${b} have a conversation that starts normal and ends with both of them walking away shaking.`,
          `Every time ${a} speaks at camp, ${b} visibly tenses. It's the tribe's unspoken tension.`,
          `${a} makes a pointed comment clearly aimed at ${b}. ${b} doesn't respond. The silence is louder than any argument.`,
          `${b} tells someone quietly that ${pB.sub} will do whatever it takes to make sure ${a} doesn't make it to the end.`,
          `${a} and ${b} end up on the same task. They complete it without exchanging a single word. The efficiency is terrifying.`,
          `${a} laughs at something someone else says. ${b} looks at the ground. It's not jealousy. It's something colder.`,
          `The tribe has learned to read the weather between ${a} and ${b}. Today is a storm warning. Nobody pushes it.`,
          `${b} brings up ${a}'s name in a strategy conversation — not as a target, just as a reference. The edge in ${pB.pos} voice is unmistakable.`,
        ]) });
      }

      // ── UNBREAKABLE (+9 or better) ──
      if (_eb >= 9 && Math.random() < 0.55) {
        addBond(a, b, 0.3);
        group.filter(p => p !== a && p !== b).forEach(p => {
          if (getBond(p, a) < 3) addBond(p, a, -0.2);
          if (getBond(p, b) < 3) addBond(p, b, -0.2);
        });
        events.push({ type: 'unbreakableBond', players: [a, b], text: _rp2([
          `${a} and ${b} don't need to talk strategy anymore. A look across the fire is enough. The tribe has noticed — and some of them are afraid of it.`,
          `${a} and ${b} have a conversation late at night that has nothing to do with the game. The kind that makes everyone else feel like outsiders.`,
          `The bond between ${a} and ${b} is so obvious it's become a liability. Everyone can see it. Neither of them cares.`,
          `${a} tells the confessional: "I came into this game alone. I'm not alone anymore. Whatever happens, ${b} changed that."`,
          `${a} gives ${b} the last of the rice without being asked. ${b} doesn't say thank you — ${pB.sub} just ${pB.sub==='they'?'nod':'nods'}. They're past words.`,
          `${a} falls asleep at the fire. ${b} stays up and keeps it going. In the morning, neither mentions it. They don't have to.`,
          `Someone tries to pull ${a} into a side conversation about ${b}. ${a} shuts it down so fast the other person apologizes. The loyalty isn't strategic — it's reflexive.`,
          `${a} and ${b} build the shelter together in silence. It takes half the time it took the rest of the tribe. They've been in sync since the beginning and everyone knows it.`,
          `The tribe debates the plan. ${a} looks at ${b}. ${b} nods. That's the vote. Nobody questions it because nobody can compete with what those two have.`,
          `${a} gets emotional at the fire tonight. ${b} doesn't say "it's okay" or "stay strong." ${pB.Sub} just ${pB.sub==='they'?'sit':'sits'} closer. That's enough.`,
        ]) });
      }

      // ── RIDE OR DIE (+7 to +9) ──
      else if (_eb >= 7 && Math.random() < 0.40) {
        addBond(a, b, 0.5);
        const protector = pStats(a).loyalty >= pStats(b).loyalty ? a : b;
        group.filter(p => p !== a && p !== b).forEach(p => { if (Math.random() < 0.3) addBond(p, protector, 0.3); });
        events.push({ type: 'rideOrDie', players: [a, b], text: _rp2([
          `${a} and ${b} sit together at every meal, every challenge, every tribal. The tribe has started referring to them as a single unit.`,
          `${a} catches wind that ${b}'s name was mentioned. ${pA.Sub} shut${pA.sub==='they'?'':'s'} it down immediately — not with strategy, with loyalty.`,
          `${a} and ${b} finish each other's sentences in a way that makes other players uncomfortable. Because it's clearly not fake.`,
          `Someone asks ${a} who ${pA.sub}'d take to the end. ${a} doesn't hesitate. The answer is ${b}. It's been ${b} since day one.`,
          `${b} has a rough day. ${a} doesn't fix it or talk about it. ${pA.Sub} just ${pA.sub==='they'?'stay':'stays'} nearby. That's what loyalty looks like out here.`,
          `${a} volunteers for the hardest camp task so ${b} doesn't have to. ${b} notices. The tribe notices ${b} noticing.`,
          `${a} and ${b} have a way of communicating across the camp with just eye contact. The tribe has caught on but can't decode it.`,
          `${a} tells the confessional: "${b} is the only person in this game I trust completely. That's either going to save me or get me killed. I'm okay with both."`,
        ]) });
      }

      // ── REKINDLE: damaged bond (-4 to -7) starts to heal ──
      if (_eb >= -7 && _eb <= -4 && Math.random() < 0.12) {
        const canRekindle = pStats(a).social >= 6 || pStats(b).social >= 6 || pStats(a).temperament >= 7 || pStats(b).temperament >= 7;
        if (canRekindle) {
          const initiator = pStats(a).social >= pStats(b).social ? a : b;
          const receiver = initiator === a ? b : a;
          const pI = pronouns(initiator), pR = pronouns(receiver);
          addBond(a, b, 2.5);
          events.push({ type: 'rekindle', players: [initiator, receiver], text: _rp2([
            `${initiator} sits down next to ${receiver} for the first time in days. Neither says anything for a while. Then ${initiator} speaks — about home. ${receiver} listens. Something cracks open.`,
            `${initiator} catches ${receiver} alone at the water well. "I know we've had our issues. I'm just saying — we don't have to keep doing this." ${receiver} doesn't walk away.`,
            `The game stripped everything back today. ${initiator} and ${receiver} had a conversation that was raw, uncomfortable, and longer than either expected. Not forgiveness. But something.`,
            `It starts with a shared task — firewood, water, something neither can do alone. By the end, ${initiator} and ${receiver} have talked more than they have in a week.`,
            `${initiator} apologizes. Not for everything — just for one specific thing. ${receiver} wasn't expecting it. The silence that follows isn't awkward for the first time.`,
            `${receiver} is struggling with the shelter. ${initiator} helps without being asked, without making it a thing. ${receiver} looks up, surprised. The wall between them feels thinner.`,
            `Rain drives everyone under the same tarp. ${initiator} and ${receiver} end up side by side. Neither moves. By morning, the coldness has thawed — just slightly.`,
            `${initiator} makes a joke at the fire. ${receiver} laughs before ${pR.sub} can stop ${pR.ref}. It's the first real laugh between them in a long time. The tribe notices.`,
            `${initiator} passes ${receiver} during a challenge and mutters "nice move." Two words. But from ${initiator} to ${receiver}, after everything? That's a lot.`,
            `${receiver} defends ${initiator} in a group conversation — not warmly, but factually. "That's not what happened." ${initiator} hears about it later. Doesn't say anything. But remembers.`,
          ]) });
        }
      }

      // ── BREAKUP: strong bond (+5 to +8) fractures ──
      if (_eb >= 5 && _eb <= 8 && Math.random() < 0.10) {
        const hasStrategist = pStats(a).strategic >= 7 || pStats(b).strategic >= 7;
        const hasLowLoyalty = pStats(a).loyalty <= 4 || pStats(b).loyalty <= 4;
        if (hasStrategist || hasLowLoyalty) {
          const instigator = pStats(a).strategic > pStats(b).strategic ? a : b;
          const hurt = instigator === a ? b : a;
          const pIn = pronouns(instigator), pH = pronouns(hurt);
          const damage = -1.5 - Math.random() * 1.5;
          addBond(a, b, damage);
          if (gs.playerStates?.[hurt]) gs.playerStates[hurt].emotional = 'uneasy';
          events.push({ type: 'breakup', players: [instigator, hurt], text: _rp2([
            `${instigator} pulls back from ${hurt} today. Not a fight — something quieter. The conversations get shorter. The eye contact disappears.`,
            `${instigator} is seen having long strategy talks with other players — talks that used to include ${hurt}. When ${hurt} asks, ${instigator} deflects.`,
            `${hurt} overhears something ${instigator} said about ${pH.obj}. Not cruel — worse. Dismissive. Like the bond was a phase ${instigator} has moved past.`,
            `It's not dramatic. ${instigator} just starts treating ${hurt} like everyone else — and that's the part that hurts.`,
            `${instigator} makes a strategic calculation that doesn't include ${hurt}. ${hurt} finds out through someone else. The betrayal is in not being told.`,
            `${hurt} reaches for the usual check-in before tribal. ${instigator} is already talking to someone else. The moment passes. It keeps passing.`,
            `${instigator} doesn't save ${hurt} a seat at the fire tonight. Small thing. Huge signal. ${hurt} sits somewhere else and pretends not to care.`,
            `${hurt} asks ${instigator} directly: "Are we good?" ${instigator} says yes too quickly. ${hurt} knows what too-quickly means by now.`,
            `The tribe watches ${instigator} build a new inner circle that doesn't include ${hurt}. Everyone sees it except — no, ${hurt} sees it too. ${pH.Sub} just ${pH.sub==='they'?'haven\'t':'hasn\'t'} decided what to do about it yet.`,
            `${instigator} tells the confessional: "I love ${hurt}. But I can't win sitting next to ${pH.obj}." It's the most honest and most devastating thing ${pIn.sub}'ve said all season.`,
          ]) });
        }
      }
    }
  }

  // ── Social Manipulation Events ──
  const _schemeBoost = ep?.isLuckyHunt ? 0.40 : 0.15;
  const socialEvents = generateSocialManipulationEvents(group, ep, _schemeBoost);
  socialEvents.forEach(evt => events.push(evt));

  return events;
}

export function checkAllianceRecruitment(ep) {
  if (!gs.namedAlliances?.length) return;

  const active = gs.activePlayers;
  if (!ep.allianceRecruits) ep.allianceRecruits = [];

  // Deterministic per-episode roll keyed by player+alliance+scenario
  const epSeed = ep.num * 43;
  const pctRoll = (key) => ([...key].reduce((s, c) => s + c.charCodeAt(0), 0) + epSeed) % 100;

  // Avg bond between a player and an array of members
  const avgBondWith = (player, members) => {
    const others = members.filter(m => m !== player && active.includes(m));
    if (!others.length) return 0;
    return others.reduce((sum, m) => sum + getBond(player, m), 0) / others.length;
  };

  // Perform the recruitment: add player to alliance, boost bonds, inject camp event
  const doRecruit = (alliance, recruit, recruiter, scenario) => {
    // Prevent double-recruitment this episode
    if (ep.allianceRecruits.some(r => r.player === recruit)) return;
    if (alliance.members.includes(recruit)) return;
    // Cap: don't recruit if alliance already has 5+ active members
    if (alliance.members.filter(m => active.includes(m)).length >= 6) return;

    // ── Acceptance check: based on RELATIONSHIPS, not stats ──
    const _rS = pStats(recruit);
    const _rState = gs.playerStates?.[recruit]?.emotional || 'comfortable';
    const bondWithRecruiter = getPerceivedBond(recruit, recruiter);
    const allianceActives = alliance.members.filter(m => active.includes(m));
    const avgBondAlliance = allianceActives.length ? allianceActives.reduce((s,m) => s + getPerceivedBond(recruit, m), 0) / allianceActives.length : 0;
    // Has the recruiter ever voted against the recruit?
    const _recruiterVotedMe = (gs.episodeHistory || []).some(e =>
      (e.votingLog || []).some(v => v.voter === recruiter && v.voted === recruit && v.voter !== 'THE GAME')
    );
    // Does the recruit have an existing alliance they're loyal to?
    const _hasExistingAlliance = gs.namedAlliances.some(a => a.active && a.members.includes(recruit) && a.members.filter(m => active.includes(m)).length >= 2);

    // Acceptance is relationship-driven:
    // Strong bond = easy yes. Negative bond = hard no. History matters.
    let acceptChance = 40; // base
    acceptChance += bondWithRecruiter * 12;  // bond 3 = +36%, bond -2 = -24% (THE main driver)
    acceptChance += avgBondAlliance * 6;     // avg 2 = +12% (do I trust this group?)
    if (_recruiterVotedMe && bondWithRecruiter < 2) acceptChance -= 20; // you voted me out, now you want to ally?
    if (_hasExistingAlliance && _rS.loyalty >= 6) acceptChance -= 15; // loyal to my current people
    // Emotional state — desperation makes you say yes to anyone
    if (_rState === 'desperate') acceptChance += 20;
    else if (_rState === 'paranoid') acceptChance += 10;
    else if (_rState === 'comfortable') acceptChance -= 8;

    acceptChance = Math.max(10, Math.min(90, acceptChance)); // clamp 10-90%

    const _roll = pctRoll(recruit + recruiter + alliance.name + scenario);
    if (_roll >= acceptChance) {
      // Refused — small bond hit (recruiter feels rejected)
      addBond(recruit, recruiter, -0.2);
      ep.allianceRefusals = ep.allianceRefusals || [];
      ep.allianceRefusals.push({ player: recruit, recruiter, alliance: alliance.name, scenario });
      // Refusal camp event
      const _refKey = Object.keys(ep.campEvents || {})[0];
      if (_refKey && ep.campEvents[_refKey]) {
        const _refBlock = ep.campEvents[_refKey].post || ep.campEvents[_refKey].pre;
        if (Array.isArray(_refBlock)) _refBlock.push({ type: 'allianceRefusal', players: [recruit, recruiter],
          text: _getRefusalEventText(recruit, recruiter, alliance.name, scenario) });
      }
      return;
    }

    alliance.members.push(recruit);

    // Bond boost with all existing members
    alliance.members.filter(m => m !== recruit && active.includes(m))
      .forEach(m => { addBond(recruit, m, 0.25); });

    // Emotional state → confident
    if (gs.playerStates?.[recruit]) gs.playerStates[recruit].emotional = 'confident';

    // If recruit was in a rival alliance: bond hit there + blowup heat (betrayal risk next tribal)
    const rivalAlliance = gs.namedAlliances.find(a =>
      a !== alliance && a.active && a.members.includes(recruit) &&
      a.members.filter(m => active.includes(m)).length >= 2
    );
    if (rivalAlliance) {
      rivalAlliance.members.filter(m => m !== recruit && active.includes(m))
        .forEach(m => addBond(recruit, m, -0.5));
      if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
      gs.blowupHeatNextEp.add(recruit);
    }

    ep.allianceRecruits.push({ player: recruit, toAlliance: alliance.name, fromAlliance: rivalAlliance?.name || null, scenario });

    // Camp event — guaranteed: find recruit's tribe block, fall back to any available block
    const _recruitCampKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(recruit))?.name;
    const _campKey = (_recruitCampKey && ep.campEvents?.[_recruitCampKey])
      ? _recruitCampKey
      : Object.keys(ep.campEvents || {})[0];
    if (_campKey && ep.campEvents?.[_campKey]) {
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      const _rPrn = pronouns(recruit);
      const _block = ep.campEvents[_campKey];
      const _target = _block.post?.length >= 0 ? _block.post : _block.pre;
      _target.push({ type: 'allianceRecruit', players: [recruit, recruiter],
        text: _getRecruitEventText(recruit, recruiter, alliance, scenario) });
    }
  };

  // ── SCENARIO A: Post-swap outsider recruited by alliance majority on new tribe ──
  const hadSwap = ep.twists?.some(t =>
    ['tribe-swap', 'tribe-dissolve', 'tribe-expansion', 'abduction', 'kidnapping', 'mutiny'].includes(t.type) // kidnapping included: cross-tribe bond formation counts as swap-adjacent
  );
  if (hadSwap && ep.tribesAtStart?.length && gs.phase === 'pre-merge' && gs.tribes.length) {
    gs.tribes.forEach(newTribe => {
      newTribe.members.filter(m => active.includes(m)).forEach(outsider => {
        // Did this player change tribes this episode?
        const preTribe = ep.tribesAtStart.find(t => t.members.includes(outsider));
        if (!preTribe || preTribe.name === newTribe.name) return;
        // Skip if already in a named alliance with members on this new tribe
        const alreadyCovered = gs.namedAlliances.some(a =>
          a.active && a.members.includes(outsider) &&
          a.members.some(m => m !== outsider && newTribe.members.includes(m) && active.includes(m))
        );
        if (alreadyCovered) return;
        // Find qualifying alliances: 2+ members on new tribe, positive avg bond with outsider
        gs.namedAlliances.forEach(alliance => {
          if (!alliance.active) return;
          const onNewTribe = alliance.members.filter(m => m !== outsider && newTribe.members.includes(m) && active.includes(m));
          if (onNewTribe.length < 2) return;
          const _avgB = avgBondWith(outsider, onNewTribe);
          if (_avgB < 1) return;
          if (Math.random() >= Math.min(0.65, _avgB * 0.12)) return; // bond 2=24%, 4=48%, 6+=65%
          const recruiter = onNewTribe.sort((a, b) => getBond(outsider, b) - getBond(outsider, a))[0];
          doRecruit(alliance, outsider, recruiter, 'swap-outsider');
        });
      });
    });
  }

  // ── SCENARIO B: Just quit a named alliance, has bond >= 3 with a member of another ──
  (ep.allianceQuits || []).forEach(({ player }) => {
    if (!active.includes(player)) return;
    gs.namedAlliances.forEach(alliance => {
      if (!alliance.active || alliance.members.includes(player)) return;
      const allianceActives = alliance.members.filter(m => active.includes(m));
      if (allianceActives.length < 2) return;
      const anchor = allianceActives.sort((a,b) => getBond(player,b) - getBond(player,a))[0];
      const anchorBond = getBond(player, anchor);
      if (anchorBond < 1) return;
      if (Math.random() >= Math.min(0.60, anchorBond * 0.10)) return; // bond 2=20%, 5=50%, 6+=60% cap
      doRecruit(alliance, player, anchor, 'post-quit');
    });
  });

  // ── SCENARIO C: Blindside — swing voter absorbed into winning bloc ──
  // Only fires post-tribal (ep.eliminated + ep.votingLog must exist)
  const vlog = ep.votingLog || [];
  if (ep.eliminated && ep.eliminated !== 'No elimination' && vlog.length) {
    // Alliance the eliminated player belonged to (the "blindsided" side)
    const elimAlliance = gs.namedAlliances.find(a =>
      a.active && a.members.includes(ep.eliminated) &&
      a.members.filter(m => active.includes(m)).length >= 1
    );
    if (elimAlliance) {
      // Swing voters: voted for the eliminated AND not in the eliminated's alliance
      const swingVoters = vlog.filter(l =>
        l.voted === ep.eliminated && l.voter !== 'THE GAME' &&
        active.includes(l.voter) && !elimAlliance.members.includes(l.voter)
      ).map(l => l.voter);
      // Winning blocs: alliances that had members voting for the eliminated
      const winningBlocs = gs.namedAlliances.filter(a =>
        a !== elimAlliance && a.active &&
        a.members.some(m => vlog.some(l => l.voter === m && l.voted === ep.eliminated))
      );
      swingVoters.forEach(voter => {
        winningBlocs.forEach(bloc => {
          if (bloc.members.includes(voter)) return;
          const blocActives = bloc.members.filter(m => active.includes(m));
          if (!blocActives.length) return;
          const anchor = blocActives.sort((a,b) => getBond(voter,b) - getBond(voter,a))[0];
          if (!anchor || getBond(voter, anchor) < 1) return;
          if (pctRoll(voter + bloc.name + 'C') >= 30) return; // ~30%
          doRecruit(bloc, voter, anchor, 'blindside-swing');
        });
      });
    }
  }

  // ── SCENARIO D: Free agents post-merge — unallied players seek existing alliances ──
  if (gs.isMerged) {
    const _activeAlliances = gs.namedAlliances.filter(a => a.active && a.members.filter(m => active.includes(m)).length >= 2);
    active.forEach(freeAgent => {
      // Skip if already in an active alliance
      if (_activeAlliances.some(a => a.members.includes(freeAgent))) return;
      // Skip if already recruited this episode
      if (ep.allianceRecruits?.some(r => r.player === freeAgent)) return;
      // Find best alliance to join: highest avg bond with active members
      const candidates = _activeAlliances.map(a => {
        const actives = a.members.filter(m => active.includes(m));
        const avg = avgBondWith(freeAgent, actives);
        const bestMember = actives.sort((x,y) => getBond(freeAgent, y) - getBond(freeAgent, x))[0];
        return { alliance: a, avg, bestMember };
      }).filter(c => c.avg >= 0.5 && c.bestMember).sort((a,b) => b.avg - a.avg);

      if (candidates.length) {
        const _faS = pStats(freeAgent);
        const _faState = gs.playerStates?.[freeAgent]?.emotional || 'comfortable';
        // Base chance scaled by personality:
        // - Strategic players actively seek alliances (they know they need numbers)
        // - Social players naturally gravitate toward groups
        // - Desperate/paranoid players scramble for safety
        // - Comfortable/content players feel less urgency
        // - Low strategic + comfortable = barely tries
        let _faChance = 20; // base 20%
        _faChance += _faS.strategic * 2.5;  // strategic 1=+2.5%, 10=+25%
        _faChance += _faS.social * 1.5;     // social 1=+1.5%, 10=+15%
        if (_faState === 'desperate') _faChance += 25;  // scrambling for any lifeline
        else if (_faState === 'paranoid') _faChance += 20;  // knows they need protection
        else if (_faState === 'uneasy') _faChance += 10;   // starting to worry
        else if (_faState === 'calculating') _faChance += 15; // actively planning
        else if (_faState === 'comfortable') _faChance -= 10; // doesn't feel the urgency
        else if (_faState === 'content') _faChance -= 5;
        if (_faS.loyalty >= 7) _faChance += 5; // loyal players want a group
        if (_faS.boldness >= 8) _faChance += 5; // bold players make moves
        if (_faS.boldness <= 3) _faChance -= 10; // passive players wait to be approached
        _faChance = Math.max(5, Math.min(85, _faChance)); // clamp 5-85%

        if (pctRoll(freeAgent + 'D' + ep.num) < _faChance) {
          const best = candidates[0];
          doRecruit(best.alliance, freeAgent, best.bestMember, 'free-agent');
        }
      }
    });

    // ── SCENARIO E: No alliances at all — force create one from the two closest players ──
    if (_activeAlliances.length === 0 && active.length >= 3) {
      let bestPair = null, bestBond = -Infinity;
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const b = getBond(active[i], active[j]);
          if (b > bestBond) { bestBond = b; bestPair = [active[i], active[j]]; }
        }
      }
      if (bestPair && bestBond > -1) {
        const allianceName = nameNewAlliance(2);
        gs.namedAlliances.push({
          id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          name: allianceName,
          members: [...bestPair],
          formed: ep.num,
          betrayals: [],
          active: true,
        });
        addBond(bestPair[0], bestPair[1], 0.4);
        ep.allianceRecruits = ep.allianceRecruits || [];
        ep.allianceRecruits.push({ player: bestPair[1], toAlliance: allianceName, fromAlliance: null, scenario: 'emergency-pair' });
      }
    }

    // ── SCENARIO F+H+I moved to camp event allianceForm triggers (prevents double-firing) ──

    // ── SCENARIO G: Post-betrayal refuge — betrayed player recruited by rivals ──
    (ep.allianceQuits || []).forEach(({ player, alliance: quitAlliance }) => {
      if (!active.includes(player)) return;
      if (ep.allianceRecruits?.some(r => r.player === player)) return;
      // Find rival alliances that opposed the one they left
      const rivalAlliances = gs.namedAlliances.filter(a =>
        a.active && a.name !== quitAlliance && !a.members.includes(player) &&
        a.members.filter(m => active.includes(m)).length >= 2
      );
      rivalAlliances.forEach(rival => {
        const bestAnchor = rival.members.filter(m => active.includes(m)).sort((x,y) => getBond(player, y) - getBond(player, x))[0];
        if (!bestAnchor || getBond(player, bestAnchor) < 0) return;
        if (pctRoll(player + rival.name + 'G') >= 45) return; // ~45%
        doRecruit(rival, player, bestAnchor, 'post-betrayal');
      });
    });

    // ── SCENARIOS H+I: Power couple and idol shield now handled by camp event allianceForm triggers ──
  }
}

// ── Scenario-specific camp event text for recruitment ──
// Called from doRecruit's camp event injection — replaces generic text with scenario-aware narration
export function _getRecruitEventText(recruit, recruiter, alliance, scenario) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const rPrn = pronouns(recruit);
  switch (scenario) {
    case 'swap-outsider': return _rp([
      `${recruit} is the new face on this tribe. ${recruiter} doesn't waste time \u2014 by sundown, ${recruit} is part of ${alliance.name}. "You need us. We need numbers. Let's not overthink it."`,
      `After the swap, ${recruit} was on the outside looking in. ${recruiter} saw an opportunity: bring ${recruit} in, and ${alliance.name} controls this new tribe. The pitch worked.`,
    ]);
    case 'post-quit': return _rp([
      `${recruit} just walked away from everything. ${recruiter} was waiting. "Your old alliance is done. We're not. Come with us." ${recruit} didn't need to think long.`,
      `After leaving ${rPrn.pos} old alliance, ${recruit} was floating. ${recruiter} offered a lifeline: ${alliance.name}. "We saw what they did to you. That won't happen here."`,
    ]);
    case 'blindside-swing': return _rp([
      `${recruit} voted with the majority last tribal. ${recruiter} noticed. "You made the right call. Now make another one \u2014 join us." ${alliance.name} just got stronger.`,
      `The blindside reshuffled everything. ${recruit} was the swing vote, and now ${recruiter} wants to lock that in. ${alliance.name} absorbs the free agent before anyone else can.`,
    ]);
    case 'free-agent': return _rp([
      `${recruit} has been on the outside for too long. ${recruiter} finally extended the invitation. "You don't have to play alone anymore." ${recruit} joined ${alliance.name} \u2014 not out of love, but necessity.`,
      `"I need people," ${recruit} told ${recruiter}. "And you need numbers." It wasn't romantic. It was math. ${alliance.name} adds ${recruit} to the fold.`,
      `${recruiter} pulled ${recruit} aside after the challenge. "Everyone's talking about targeting you. Come with us." ${recruit} didn't hesitate. ${alliance.name} has a new member.`,
    ]);
    case 'emergency-pair': return _rp([
      `With no alliances left standing, ${recruit} and the others had to start from scratch. It began with a look across the fire. By morning, they had a name for it.`,
    ]);
    case 'mutual-enemy': return _rp([
      `${recruit} found someone who hates the same person. That's not trust \u2014 but it's a starting point. ${alliance.name} was built on shared frustration.`,
    ]);
    case 'post-betrayal': return _rp([
      `${recruit}'s old alliance stabbed ${rPrn.obj} in the back. ${recruiter} saw the wreckage and moved in. "They threw you away. We won't." ${recruit} joins ${alliance.name} \u2014 hurt, angry, and looking for payback.`,
      `${recruiter} approached ${recruit} the morning after the betrayal. "I know what they did to you. Come with us." ${recruit} was already nodding before ${recruiter} finished the sentence.`,
    ]);
    case 'power-couple': return _rp([
      `${recruit} and ${recruiter} have been inseparable all season. It was only a matter of time before they made it official. ${alliance.name} is less a strategy and more a bond.`,
      `Everyone at camp already knew ${recruit} and ${recruiter} were a pair. Now they have a name for it: ${alliance.name}. "We trust each other more than anyone else out here. That's enough."`,
    ]);
    case 'idol-shield': return _rp([
      `${recruiter} has something hidden \u2014 and needs someone big enough to draw fire away. ${recruit} is the perfect shield. ${alliance.name} forms with an unspoken deal: protection for loyalty.`,
      `${recruiter} brought ${recruit} in close. "I have safety. You have strength. Together, nobody touches us." ${recruit} doesn't know about the idol yet \u2014 but ${recruiter} knows ${recruit} is the kind of target that keeps ${recruiter} safe.`,
    ]);
    default: return _rp([
      `${recruiter} brought ${recruit} into the fold. ${alliance.name} just got bigger.`,
      `${recruit} is now part of ${alliance.name}. ${recruiter} made the pitch. The numbers shifted.`,
    ]);
  }
}

// ── Refusal camp event text ──
export function _getRefusalEventText(recruit, recruiter, allianceName, scenario) {
  const rPrn = pronouns(recruit);
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const bond = getPerceivedBond(recruit, recruiter);
  if (bond <= -1) return _rp([
    `${recruiter} tried to bring ${recruit} into ${allianceName}. ${recruit} didn't even let ${recruiter} finish. "After what you did? No." The rejection was immediate.`,
    `${recruiter} approached ${recruit} about joining ${allianceName}. ${recruit} looked ${recruiter} dead in the eye. "I don't trust you. And I'm not going to pretend I do." ${recruiter} walked away empty-handed.`,
  ]);
  if (bond >= 2) return _rp([
    `${recruiter} pitched ${allianceName} to ${recruit}. Surprisingly, ${recruit} said no. "I like you, ${recruiter}. But I don't like where this alliance is going. I need to keep my options open."`,
    `${recruit} turned down ${recruiter}'s offer to join ${allianceName}. "It's not about you. I just can't commit right now. I need to see how the next vote plays out first."`,
  ]);
  return _rp([
    `${recruiter} made the pitch. ${recruit} listened. Then shook ${rPrn.pos} head. "I'm not ready to lock in with anyone yet." ${recruiter} tried not to look hurt.`,
    `${recruit} heard ${recruiter} out about ${allianceName}. Thought about it. Walked away. "I'll think about it" is a no in this game \u2014 and ${recruiter} knows it.`,
    `${recruiter} offered ${recruit} a spot in ${allianceName}. ${recruit} paused. "I appreciate the offer. But I need to play my own game right now." The conversation ended there.`,
    `"Not right now," ${recruit} told ${recruiter}. It wasn't hostile. It wasn't personal. But it was a no. ${recruiter} will have to look elsewhere.`,
  ]);
}

// [1] PARANOIA SPIRAL — paranoid + strategic player turns on a real ally, creating a self-fulfilling prophecy.
// The ally was loyal. Now they might not be.
export function checkParanoiaSpiral(ep) {
  if (!ep.paranoiaSpirals) ep.paranoiaSpirals = [];
  const active = gs.activePlayers;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Group by tribe (pre-merge) or merge
  const groups = gs.isMerged ? [{ name: 'merge', members: [...active] }] : gs.tribes;

  groups.forEach(tribe => {
    const members = tribe.members?.filter(m => active.includes(m)) || [];
    if (members.length < 3) return;

    // Find paranoid + strategic players
    const candidates = members.filter(p => {
      const em = gs.playerStates?.[p]?.emotional;
      if (em !== 'paranoid') return false;
      const s = pStats(p);
      // Proportional: strategic * 0.03 chance (stat 5=15%, stat 7=21%, stat 10=30%)
      return Math.random() < s.strategic * 0.03;
    });

    candidates.forEach(paranoid => {
      // Already spiraled this episode? One per player max
      if (ep.paranoiaSpirals.some(ps => ps.paranoid === paranoid)) return;

      const s = pStats(paranoid);
      const _pr = pronouns(paranoid);

      // Pick the target: their CLOSEST ally on the tribe — the person they should trust most
      // That's what makes paranoia devastating — it attacks the strongest bonds
      const allies = members.filter(p => p !== paranoid && getBond(paranoid, p) >= 2)
        .sort((a, b) => getBond(paranoid, b) - getBond(paranoid, a));
      if (!allies.length) return; // no allies to turn on
      const target = allies[0];
      const targetBond = getBond(paranoid, target);
      const _tPr = pronouns(target);

      // Bond damage — proportional to strategic (smarter paranoid players build more elaborate theories)
      const bondDrop = -(0.8 + s.strategic * 0.1); // stat 5: -1.3, stat 8: -1.6, stat 10: -1.8
      addBond(paranoid, target, bondDrop);
      // The target also loses trust — being accused when you're innocent creates distance
      addBond(target, paranoid, bondDrop * 0.6);

      // Flag the accused ally for vote nudge: they're now less likely to follow the paranoid player's plan
      // This is stored and read by simulateVotes — makes the self-fulfilling prophecy work
      if (!gs.paranoiaNudges) gs.paranoiaNudges = {};
      gs.paranoiaNudges[target] = { accusedBy: paranoid, ep: ep.num || (gs.episode || 0) + 1 };

      const campKey = gs.isMerged ? 'merge' : tribe.name;
      const spiralData = { paranoid, target, bondDrop, campKey };
      ep.paranoiaSpirals.push(spiralData);

      // Camp event — two tonal variants: confrontation (bold) vs quiet campaign (strategic)
      if (ep.campEvents?.[campKey]) {
        const block = ep.campEvents[campKey];
        const evts = Array.isArray(block) ? block : (block.pre || []);
        const isBold = s.boldness >= 6;
        const texts = isBold ? [
          `${paranoid} pulled ${target} aside after the challenge and the conversation went sideways fast. "I know what you're doing." ${target} didn't know what ${_tPr.sub} ${_tPr.sub==='they'?'were':'was'} being accused of. That didn't matter — ${paranoid} had already decided.`,
          `${paranoid} confronted ${target} in front of half the tribe. The accusation wasn't subtle. ${target} denied it. ${paranoid} didn't believe ${_tPr.obj}. The damage was already done.`,
          `Something snapped in ${paranoid} today. ${_pr.Sub} went after ${target} — ${_pr.posAdj} closest ally — with an accusation nobody saw coming. ${target} stood there, stunned. The tribe watched.`,
        ] : [
          `${paranoid} has been talking to people about ${target}. Quietly. Carefully. Planting the idea that ${target} isn't as loyal as everyone thinks. The thing is — ${target} has been completely loyal. But the seed is planted now.`,
          `${paranoid} didn't say it to ${target}'s face. ${_pr.Sub} said it to three other people first. "Watch ${target}. Something's off." Nobody had noticed anything off about ${target} until ${paranoid} pointed it out. Now everyone's watching.`,
          `${paranoid} pulled two people aside today with the same quiet message: ${target} is playing both sides. ${target} isn't. But try proving a negative in this game.`,
        ];
        evts.push({
          type: 'paranoiaSpiral',
          text: _pick(texts),
          players: [paranoid, target],
        });
      }
    });
  });
}

// [4] INFORMATION BROKER — player in 2+ alliances with high social + low loyalty plays both sides.
// Intel from both alliances, bond boosts while active, escalating exposure risk per episode.
// Exposure: bond collapse with both alliances, heat spike, named exposer gets credit.
export function checkInformationBroker(ep) {
  const active = gs.activePlayers;
  const epNum = ep.num || (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  if (!gs.broker) gs.broker = null;

  // ── PATH 1: No broker yet — check if one emerges ──
  if (!gs.broker) {
    // Once per game
    const activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.filter(m => active.includes(m)).length >= 2);
    if (activeAlliances.length < 2) return;

    for (const player of active) {
      const s = pStats(player);
      if (s.social < 5 || s.loyalty > 5) continue;
      const playerAlliances = activeAlliances.filter(a => a.members.includes(player));
      if (playerAlliances.length < 2) continue;

      // Proportional roll: social * 0.025 * (6 - loyalty) * 0.1
      const chance = s.social * 0.025 * (6 - s.loyalty) * 0.1;
      if (Math.random() >= chance) continue;

      // Broker emerges
      gs.broker = {
        player,
        alliances: playerAlliances.slice(0, 2).map(a => a.name),
        startEp: epNum,
        episodesActive: 0,
        exposed: false,
        exposedEp: null,
      };

      // Activation camp event
      const campKey = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
      if (ep.campEvents?.[campKey]) {
        const block = ep.campEvents[campKey];
        const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
        const _pr = pronouns(player);
        evts.push({ type: 'brokerConfidence', text: _pick([
          `${player} has ${_pr.posAdj} hands in two pots and nobody knows it yet. ${_pr.Sub} ${_pr.sub==='they'?'sit':'sits'} between two alliances, hearing everything, saying exactly what each side needs to hear. It's working. For now.`,
          `${player} knows what ${gs.broker.alliances[0]} is planning. ${player} also knows what ${gs.broker.alliances[1]} is planning. Neither group knows ${_pr.sub} ${_pr.sub==='they'?'know':'knows'} the other side's plan. That's the game ${_pr.sub}'s playing.`,
          `There's a version of this game where ${player} gets caught. But right now? Right now ${_pr.sub} ${_pr.sub==='they'?'have':'has'} more information than anyone else on this island. That's power.`,
        ]), players: [player] });
      }
      ep.brokerEvents = ep.brokerEvents || [];
      ep.brokerEvents.push({ type: 'activation', player });
      return; // one broker per game
    }
    return;
  }

  // ── PATH 2: Broker exists but already exposed — nothing to do ──
  if (gs.broker.exposed) return;

  // ── PATH 3: Broker is active — run per-episode effects ──
  const broker = gs.broker;
  const player = broker.player;
  if (!active.includes(player)) { broker.exposed = true; return; } // broker eliminated

  broker.episodesActive++;
  const s = pStats(player);
  const _pr = pronouns(player);
  const campKey = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
  ep.brokerEvents = ep.brokerEvents || [];

  // Gather all alliance members (excluding broker)
  const allianceMembers = new Set();
  broker.alliances.forEach(aName => {
    const alliance = (gs.namedAlliances || []).find(a => a.name === aName && a.active);
    if (alliance) alliance.members.filter(m => m !== player && active.includes(m)).forEach(m => allianceMembers.add(m));
  });

  // If both alliances dissolved, broker status ends quietly
  if (!allianceMembers.size) { broker.exposed = true; return; }

  // ── Intel gain: eavesdrop boost ──
  if (!gs.playerStates[player]) gs.playerStates[player] = {};
  gs.playerStates[player].eavesdropBoostThisEp = true;

  // ── Bond boost: +0.15 with all alliance members ──
  allianceMembers.forEach(m => addBond(player, m, 0.15));

  // ── Exposure check ──
  const baseRisk = broker.episodesActive * 0.08;
  const mergeSwapSpike = (ep.isMerge || ep.swapResult) ? 0.30 : 0;
  const exposureRisk = Math.min(0.85, baseRisk + mergeSwapSpike);

  // Detector: highest intuition among all alliance members
  let bestDetector = null, bestDetectorScore = 0;
  allianceMembers.forEach(m => {
    const score = pStats(m).intuition * 0.04 + pStats(m).mental * 0.015 + Math.random() * 0.1;
    if (score > bestDetectorScore) { bestDetectorScore = score; bestDetector = m; }
  });

  if (Math.random() < exposureRisk && bestDetector) {
    // ── EXPOSURE FIRES ──
    broker.exposed = true;
    broker.exposedEp = epNum;
    broker.exposer = bestDetector;

    // Bond collapse with all alliance members
    const bondHit = -(1.0 + broker.episodesActive * 0.4);
    allianceMembers.forEach(m => {
      addBond(player, m, bondHit);
    });

    // Light secondary hit between alliance members (-0.3 "how did we not see this")
    const memberArr = [...allianceMembers];
    for (let i = 0; i < memberArr.length; i++) {
      for (let j = i + 1; j < memberArr.length; j++) {
        addBond(memberArr[i], memberArr[j], -0.3);
      }
    }

    // Exposer bond boost
    allianceMembers.forEach(m => {
      if (m !== bestDetector) addBond(bestDetector, m, 0.5);
    });

    // Heat spike flag
    gs.brokerExposedHeat = player;
    gs.brokerExposedEp = epNum;

    // Camp events: exposure blowup (guaranteed)
    if (ep.campEvents?.[campKey]) {
      const block = ep.campEvents[campKey];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      const _dPr = pronouns(bestDetector);
      const isBoldDetector = pStats(bestDetector).boldness >= 6;

      // Event 1: The confrontation
      evts.push({ type: 'brokerExposed', text: _pick(isBoldDetector ? [
        `${bestDetector} stood up at camp and said it in front of everyone. "${player} has been playing both sides. ${gs.broker.alliances[0]} and ${gs.broker.alliances[1]}. Ask ${_pr.obj}." The silence that followed was worse than any argument.`,
        `${bestDetector} didn't wait for the right moment. ${_dPr.Sub} walked up to ${player} and laid it out: "You've been feeding ${gs.broker.alliances[0]} our plans and feeding us theirs. It's done." ${player} didn't deny it fast enough.`,
      ] : [
        `${bestDetector} pulled three people aside before ${player} woke up. By breakfast, everyone knew. ${player} walked into a camp that had already made up its mind.`,
        `It started with a question ${bestDetector} asked ${player} that didn't add up. Then another. Then ${bestDetector} went to ${gs.broker.alliances[0]} and asked what ${player} had told them. The story didn't match. It was over.`,
      ]), players: [bestDetector, player] });

      // Event 2: Fallout
      evts.push({ type: 'brokerFallout', text: _pick([
        `The camp split open. Not into new alliances — into silence. Nobody trusted anyone. ${player} did that. Even the people who weren't involved are recalculating.`,
        `${gs.broker.alliances[0]} and ${gs.broker.alliances[1]} spent the afternoon comparing notes. Every conversation ${player} had with either side — exposed. The betrayal wasn't the worst part. The worst part was how long it worked.`,
        `People are angry. Not screaming angry — the quiet kind. The kind where you don't talk to someone at camp and everybody notices.`,
      ]), players: [player] });

      // Event 3: Broker's defense
      const isBoldBroker = s.boldness >= 6;
      const isLowTemp = s.temperament <= 4;
      evts.push({ type: 'brokerDefense', text: _pick(isBoldBroker ? [
        `${player} didn't apologize. "I played the game. Both of you were using me too — you just didn't know I was using you back." The audacity almost earned respect. Almost.`,
        `"You can be mad," ${player} said. "But I had more information than anyone in this game for ${broker.episodesActive} episodes. That's not betrayal — that's strategy." Nobody agreed, but nobody could argue the math.`,
      ] : isLowTemp ? [
        `${player} tried to explain. It came out wrong. Then it came out worse. By the end, ${_pr.sub} ${_pr.sub==='they'?'were':'was'} sitting alone by the fire, and the explanation had turned into an apology nobody accepted.`,
        `The confrontation broke ${player}. Not strategically — emotionally. ${_pr.Sub} didn't have a speech prepared for this. ${_pr.Sub} just said "I'm sorry" and it wasn't enough.`,
      ] : [
        `${player} tried to reframe it. "I was keeping options open for all of us." The room didn't buy it. ${_pr.Sub} knew ${_pr.sub} ${_pr.sub==='they'?'were':'was'} done the moment ${bestDetector} opened ${pronouns(bestDetector).posAdj} mouth.`,
        `${player} went quiet after the confrontation. Not defeated — calculating. But the math has changed. The numbers aren't there anymore.`,
      ]), players: [player] });
    }

    ep.brokerExposure = { player, exposer: bestDetector, episodesActive: broker.episodesActive, bondHit, alliances: [...broker.alliances] };
    ep.brokerEvents.push({ type: 'exposed', player, exposer: bestDetector });
    return;
  }

  // ── Not exposed this episode — generate active-phase camp event (~60%) ──
  if (Math.random() < 0.60 && ep.campEvents?.[campKey]) {
    const block = ep.campEvents[campKey];
    const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
    const memberArr = [...allianceMembers];
    const randomAlly = memberArr[Math.floor(Math.random() * memberArr.length)];

    const eventRoll = Math.random();
    if (eventRoll < 0.25) {
      evts.push({ type: 'brokerWhisper', text: _pick([
        `${player} caught ${randomAlly} alone and dropped a name. "Watch out for that one. I've been hearing things." ${randomAlly} didn't question where the intel came from. That's the trick.`,
        `${player} slipped ${randomAlly} a piece of information that nobody else had. It was true. That's what makes ${player} dangerous — the lies are mixed in with just enough truth.`,
      ]), players: [player, randomAlly] });
      ep.brokerEvents.push({ type: 'whisper', player, target: randomAlly });
    } else if (eventRoll < 0.50) {
      const scapegoat = active.filter(p => p !== player && !allianceMembers.has(p))[0] || randomAlly;
      evts.push({ type: 'brokerManipulate', text: _pick([
        `${player} mentioned ${scapegoat}'s name in two separate conversations today — casually, but deliberately. By sunset, ${scapegoat} was a topic. ${player} wasn't.`,
        `Somebody asked who was running things. ${player} said nothing — but glanced at ${scapegoat}. The redirect was so smooth nobody noticed it was a redirect.`,
      ]), players: [player, scapegoat] });
      ep.brokerEvents.push({ type: 'manipulate', player, scapegoat });
    } else if (eventRoll < 0.75) {
      evts.push({ type: 'brokerConfidence', text: _pick([
        `${player} is ${broker.episodesActive} episodes into the double game and it's still holding. ${_pr.Sub} ${_pr.sub==='they'?'know':'knows'} what both sides are planning before they plan it. The question isn't whether it works — it's how long.`,
        `Confessional: "${_pr.Sub === 'They' ? 'I have' : 'I have'} two alliances. Two sets of plans. Two sets of trust. And neither one knows about the other. This is the best position in the game." — ${player}`,
      ]), players: [player] });
      ep.brokerEvents.push({ type: 'confidence', player });
    } else {
      evts.push({ type: 'brokerClose', text: _pick([
        `${randomAlly} asked ${player} a question today that came a little too close. "Who told you that?" ${player} deflected. ${randomAlly} let it go. But ${_pr.sub} won't forget the question.`,
        `There was a moment at camp where ${player}'s story didn't quite line up. ${randomAlly} noticed. ${player} noticed that ${randomAlly} noticed. Neither said anything. The clock is ticking.`,
      ]), players: [player, randomAlly] });
      ep.brokerEvents.push({ type: 'close', player, suspector: randomAlly });
    }
  }
}

// [5] STOLEN CREDIT — bold player takes public credit for another's big move
export function checkStolenCredit(ep) {
  // ── PHASE 1: Check for CONFRONTATION from previous episode's theft ──
  if (gs.stolenCredit && !gs.stolenCredit.confronted) {
    const { stealer, architect, ep: theftEp } = gs.stolenCredit;
    const currentEp = (gs.episode || 0) + 1;
    if (!gs.activePlayers.includes(stealer) || !gs.activePlayers.includes(architect)) {
      gs.stolenCredit.confronted = true; // one of them got eliminated, consume
    } else if (currentEp - theftEp >= 3) {
      gs.stolenCredit.confronted = true; // expired — architect let it go
    } else if (currentEp > theftEp) {
      // Confrontation roll
      const aS = pStats(architect);
      const aPr = pronouns(architect);
      const sPr = pronouns(stealer);
      const sS = pStats(stealer);
      const confrontChance = aS.boldness * 0.08 + (10 - aS.temperament) * 0.05;
      if (Math.random() < confrontChance) {
        // Confrontation fires
        const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

        // Beat 1: The Callout (architect speaks)
        let calloutText;
        if (aS.temperament <= 4) {
          // Hothead — explosive
          calloutText = _pick([
            `${architect} snaps. It's been building since last tribal. "You sat there and did NOTHING and then you told everyone it was YOUR move? Say it to my face, ${stealer}. Say it right now." The camp goes dead silent.`,
            `${architect} doesn't plan it. It just comes out — at the well, in front of three people. "You want to know who ACTUALLY flipped the vote? Because it wasn't ${stealer}. Ask me. Ask anyone who was actually paying attention." ${stealer} puts down ${sPr.pos} canteen.`,
            `${architect} explodes at the fire. "I am DONE watching ${stealer} walk around this camp like ${sPr.sub} ${sPr.sub==='they'?'run':'runs'} this game. That was MY move. MINE. And every single person here knows it." ${stealer} doesn't blink.`,
          ], architect + stealer + 'hothead');
        } else if (aS.boldness >= 7) {
          // Bold + composed — calculated confrontation
          calloutText = _pick([
            `${architect} pulls ${stealer} aside after the challenge. "We both know what happened at that tribal. You didn't orchestrate anything. I did. And if you keep telling people otherwise, I'll make sure the jury knows exactly who did what." It's not a threat. It's a promise.`,
            `${architect} waits until the right moment — when enough people are listening. "Hey ${stealer}, tell them again about how you planned the blindside. I love that story. Especially the part where I came to YOU with the plan." ${stealer}'s smile freezes.`,
            `${architect} corners ${stealer} at the water well. ${aPr.Sub} ${aPr.sub==='they'?'keep':'keeps'} ${aPr.pos} voice low but every word lands: "I know what you're doing. Taking credit for my game. It ends now — or I tell everyone exactly how that vote really went down."`,
          ], architect + stealer + 'bold');
        } else {
          // Emotional crack — wasn't planning to confront
          calloutText = _pick([
            `${architect} didn't mean to say anything. But sitting there listening to ${stealer} take credit one more time — something breaks. "That was MY move. You know it was my move. Why are you doing this?" The rawness catches everyone off guard.`,
            `It happens at the worst possible time — right before tribal. ${architect}'s voice cracks: "I just — I can't listen to this anymore. ${stealer} didn't do anything. I did. And I'm tired of pretending otherwise." The tribe freezes.`,
            `${architect} has been holding it in for days. ${aPr.Sub} finally ${aPr.sub==='they'?'break':'breaks'} at camp, voice shaking: "You took my move. You took the one thing I did in this game that mattered and you put your name on it. I can't just — I can't let that go."`,
          ], architect + stealer + 'emotional');
        }

        // Beat 2: The Response + Outcome
        const architectScore = aS.social + aS.strategic;
        const stealerScore = sS.social + sS.boldness;
        const architectWins = architectScore > stealerScore;

        let responseText;
        if (architectWins) {
          responseText = _pick([
            `${stealer} tries to laugh it off, but ${architect} has receipts. ${aPr.Sub} ${aPr.sub==='they'?'name':'names'} the conversation, the timing, the exact words. ${stealer} has nothing. The tribe watches ${stealer} shrink. Nobody believes ${sPr.pos} version anymore.`,
            `${stealer} starts to respond — and stops. There's nothing to say. ${architect} laid it out too clearly. The tribe exchanges looks. ${stealer}'s credibility just evaporated.`,
            `"That's not how it happened—" ${stealer} starts. ${architect} cuts ${sPr.obj} off with specifics: who said what, when, where. ${stealer} goes quiet. The silence is the verdict.`,
          ], architect + stealer + 'awin');
          // Architect reclaims partial credit
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = (aState.bigMoves || 0) + 0.5;
          gs.playerStates[architect] = aState;
          const sState = gs.playerStates[stealer] || {};
          sState.bigMoves = Math.max(0, (sState.bigMoves || 0) - 0.5);
          gs.playerStates[stealer] = sState;
          // Stealer loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, stealer, -0.5));
          // Stealer gets heat
          gs.stolenCreditHeat = { player: stealer, ep: currentEp };
        } else {
          responseText = _pick([
            `${stealer} doesn't flinch. "${sPr.Sub} ${sPr.sub==='they'?'don\'t':'doesn\'t'} know what ${architect} is talking about. We all saw what happened. I'm sorry ${aPr.sub} ${aPr.sub==='they'?'feel':'feels'} that way." It's so smooth it almost sounds sincere. The tribe nods along. ${architect} looks like the petty one.`,
            `${stealer} turns it around: "If ${architect} really made that move, why didn't ${aPr.sub} say something at the time? Why now?" The tribe looks at ${architect}. ${aPr.Sub} ${aPr.sub==='they'?'have':'has'} no answer. ${stealer} walks away looking vindicated.`,
            `${stealer} sighs, shakes ${sPr.pos} head. "I'm not going to argue about who did what. The game speaks for itself." It's dismissive. It's condescending. And it works. ${architect} looks desperate.`,
          ], architect + stealer + 'swin');
          // Architect looks petty — loses MORE standing
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 0.5);
          gs.playerStates[architect] = aState;
          // Architect loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, architect, -0.3));
        }

        // Both outcomes: additional bond damage
        addBond(architect, stealer, -1.0);
        gs.stolenCredit.confronted = true;

        // Push camp event
        const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
        if (ep.campEvents?.[_campKey]) {
          const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
          if (phase) {
            ep.campEvents[_campKey].pre.push({
              type: 'stolenCreditConfrontation',
              players: [architect, stealer],
              text: calloutText + ' ' + responseText,
              badgeText: architectWins ? 'CREDIT RECLAIMED' : 'CONFRONTATION FAILED',
              badgeClass: architectWins ? 'gold' : 'red',
            });
          }
        }
        // Save to episode history
        if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
        ep.stolenCreditEvents.push({ type: 'confrontation', architect, stealer, architectWins, ep: currentEp });
      } else {
        // No confrontation — resentment simmers
        addBond(architect, stealer, -0.3);
      }
    }
    return; // Don't check for new theft in the same call as confrontation
  }

  // ── PHASE 2: Check for NEW theft ──
  if (gs.stolenCreditFired) return; // once per game
  const currentEp = (gs.episode || 0) + 1;
  if (currentEp < 2) return; // need at least one tribal

  // Check previous episode's bigMoves earners
  const architects = gs.bigMoveEarnersThisEp || [];
  gs.bigMoveEarnersThisEp = []; // consume
  if (!architects.length) return;

  for (const architect of architects) {
    if (!gs.activePlayers.includes(architect)) continue;
    const aS = pStats(architect);

    // Find potential stealer at same camp
    const campMembers = gs.isMerged
      ? gs.activePlayers
      : (gs.tribes.find(t => t.members.includes(architect))?.members || []);
    const candidates = campMembers.filter(p => {
      if (p === architect) return false;
      const s = pStats(p);
      if (s.boldness < 6) return false;
      // Not in strong alliance with architect
      const sharedAlliance = (gs.namedAlliances || []).find(a =>
        a.active !== false && a.members.includes(p) && a.members.includes(architect)
      );
      if (sharedAlliance && getBond(p, architect) >= 3) return false;
      return true;
    });
    if (!candidates.length) continue;

    // Pick best candidate: boldness * 0.6 + social * 0.4
    candidates.sort((a, b) => {
      const aScore = pStats(a).boldness * 0.6 + pStats(a).social * 0.4;
      const bScore = pStats(b).boldness * 0.6 + pStats(b).social * 0.4;
      return bScore - aScore;
    });
    const stealer = candidates[0];
    const sS = pStats(stealer);
    const sPr = pronouns(stealer);
    const aPr = pronouns(architect);

    // Roll
    const bond = getBond(stealer, architect);
    const chance = sS.boldness * 0.015 + (bond <= -1 ? 0.05 : 0);
    if (Math.random() >= chance) continue;

    // THEFT FIRES
    gs.stolenCreditFired = true;

    // bigMoves transfer
    const sState = gs.playerStates[stealer] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    sState.bigMoves = (sState.bigMoves || 0) + 1;
    gs.playerStates[stealer] = sState;
    const aState = gs.playerStates[architect] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 1);
    gs.playerStates[architect] = aState;

    // Bond damage
    addBond(architect, stealer, -(1.5 + sS.boldness * 0.1));

    // State
    gs.stolenCredit = { stealer, architect, ep: currentEp, confronted: false };

    // Generate theft camp event text
    const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

    let theftText;
    if (sS.boldness >= 8) {
      theftText = _pick([
        `${stealer} is holding court at the fire, retelling the blindside like ${sPr.sub} drew it up on a whiteboard. "I pulled them aside before tribal and told them exactly what was going to happen." ${architect} is sitting three feet away. ${aPr.Sub} didn't say a word.`,
        `${stealer} can't stop talking about last tribal. The story gets bigger every time ${sPr.sub} ${sPr.sub==='they'?'tell':'tells'} it. "That was the biggest move of the season and I'm not afraid to say I made it." ${architect} stares at the ground.`,
        `At the water well, ${stealer} is explaining the vote to anyone who'll listen. "I saw the opening and I took it. Simple as that." ${architect} was there. ${architect} MADE the opening. But ${stealer} is louder. And louder wins at camp.`,
      ], stealer + architect + 'shameless');
    } else {
      theftText = _pick([
        `${stealer} keeps saying "we" but meaning "I." Every time someone brings up last tribal, ${sPr.sub} ${sPr.sub==='they'?'steer':'steers'} the story. ${architect} notices. Everyone else doesn't.`,
        `It's subtle. ${stealer} doesn't outright claim the move — ${sPr.sub} just... positions ${sPr.ref} at the center of every retelling. "Yeah, I talked to them first, and then the rest of us got on board." ${architect} bites ${aPr.pos} tongue.`,
        `${stealer} drops it casually at dinner: "I've been thinking about this game strategically, and I think last tribal was my best move." ${architect} almost chokes on ${aPr.pos} rice. That was NOT ${stealer}'s move.`,
      ], stealer + architect + 'subtle');
    }

    // Architect reaction (brief — confrontation comes next episode)
    let reactionText;
    if (aS.temperament >= 7) {
      reactionText = _pick([
        `${architect} says nothing. But in confessional: "I'm watching someone take credit for MY move and I can't even—" ${aPr.Sub} stops. Breathes. "This isn't over."`,
        `${architect} keeps ${aPr.pos} face neutral. Inside, something is boiling. ${aPr.Sub} ${aPr.sub==='they'?'know':'knows'} the truth. The question is whether anyone else does.`,
      ], architect + 'composed');
    } else if (aS.temperament <= 4) {
      reactionText = _pick([
        `${architect}'s jaw clenches. ${aPr.Sub} ${aPr.sub==='they'?'stand':'stands'} up, ${aPr.sub==='they'?'walk':'walks'} away from the fire. Everyone notices. The tension is thick enough to cut.`,
        `${architect} slams a pot down and walks into the jungle. The tribe exchanges looks. Something just broke — they're just not sure what yet.`,
      ], architect + 'hothead');
    } else {
      reactionText = _pick([
        `${architect} forces a smile when ${stealer} retells the story. In confessional: "If ${stealer} wants to tell people ${sPr.sub} did that, fine. The jury will know the truth. I hope."`,
        `${architect} rolls ${aPr.pos} eyes and looks away. ${aPr.Sub} ${aPr.sub==='they'?'don\'t':'doesn\'t'} trust ${aPr.ref} to respond without losing it. Not yet. But soon.`,
      ], architect + 'mid');
    }

    // Push camp event
    const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
    if (ep.campEvents?.[_campKey]) {
      const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
      if (phase) {
        ep.campEvents[_campKey].pre.push({
          type: 'stolenCredit',
          players: [stealer, architect],
          text: theftText + ' ' + reactionText,
          badgeText: 'STOLEN CREDIT',
          badgeClass: 'gold',
        });
      }
    }

    // Save to episode history
    if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
    ep.stolenCreditEvents.push({ type: 'theft', stealer, architect, ep: currentEp });

    break; // one theft per episode max
  }
}

// [2] SOCIAL BOMB / FAUX PAS — player with low temperament or high boldness says something
// that lands badly at camp. All tribemates take a bond hit (high-social players feel it more).
// Adds vote heat for that episode's tribal via gs.socialBombHeatThisEp.
export function checkSocialBomb(ep) {
  if (!ep.socialBombs) ep.socialBombs = [];
  const epSeed = ep.num * 17;
  const groups = gs.isMerged
    ? [{ members: [...gs.activePlayers], campKey: Object.keys(ep.campEvents)[0] }]
    : gs.tribes.filter(t => ep.campEvents[t.name])
        .map(t => ({ members: t.members.filter(m => gs.activePlayers.includes(m)), campKey: t.name }));

  groups.forEach(({ members, campKey }) => {
    if (!campKey || !ep.campEvents[campKey]) return;
    members.forEach(name => {
      if (ep.socialBombs.some(b => b.player === name)) return;
      const s = pStats(name);
      // Proportional: chance = inverse temperament + boldness
      const roll = ([...name].reduce((a, c) => a + c.charCodeAt(0), 0) + epSeed) % 100;
      const threshold = Math.round((10 - s.temperament) * 1.5 + s.boldness * 0.8); // temp 3 + bold 8 = 17%, temp 5 + bold 5 = 11.5%
      if (roll >= threshold) return;

      // Bond damage to all tribemates — high social = more offended
      const tribemates = members.filter(m => m !== name);
      tribemates.forEach(tm => {
        const tmS = pStats(tm);
        const dmg = -(0.5 + Math.max(0, (tmS.social - 5) * 0.2));
        addBond(name, tm, Math.max(-1.5, dmg));
      });

      // Vote heat for this episode's tribal
      if (!gs.socialBombHeatThisEp) gs.socialBombHeatThisEp = new Set();
      gs.socialBombHeatThisEp.add(name);
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.includes(name)) gs._blowupPlayers.push(name);

      // Tone: arrogant (bold) vs hothead (low temperament)
      const isArrogant = s.boldness >= 8;
      const prn = pronouns(name);
      const s3 = prn.sub === 'they';
      const arrogantLines = [
        `${name} says something at camp that no one asked for. ${prn.Sub} probably ${s3 ? 'think' : 'thinks'} ${prn.sub} ${s3 ? 'are' : 'is'} being direct. The tribe calls it something else.`,
        `${name} shares ${prn.posAdj} read on everyone — unfiltered. The tribe smiles and files it away the moment ${prn.sub} ${s3 ? 'walk' : 'walks'} off.`,
        `${name} makes a comment that isn't wrong exactly — it's just the kind of thing you don't say out loud. ${prn.Sub} said it.`,
        `${name} makes a joke that isn't a joke. A few people laugh. The rest quietly reconsider ${prn.obj}.`,
        `Nobody asked ${name} for ${prn.posAdj} opinion on how the tribe is playing. ${prn.Sub} gave it anyway. The silence afterward said everything.`,
        `${name} talks like ${prn.sub} ${s3 ? 'have' : 'has'} already won. It registers across every face at camp. ${prn.Sub} ${s3 ? "don't" : "doesn't"} notice.`,
        `${name} delivers ${prn.posAdj} honest read on camp dynamics to whoever will listen. It lands as arrogance. The tribe starts mentally moving ${prn.obj}.`,
        `${name} makes a comment about someone's performance and clearly think${s3 ? '' : 's'} ${prn.sub} ${s3 ? 'are' : 'is'} being helpful. The room disagrees.`,
      ];
      const hotheadLines = [
        `${name} snap${s3 ? '' : 's'} at someone over something small. The volume surprises the tribe. The target doesn't forget.`,
        `${name} say${s3 ? '' : 's'} something ${prn.sub} can't take back. The camp goes quiet.`,
        `${name} lose${s3 ? '' : 's'} ${prn.posAdj} temper at the wrong moment, in front of the wrong people. The tribe notes it.`,
        `Something crosses a line at camp today — not enough to blow up the game, but enough for everyone to quietly reconsider ${prn.obj}.`,
        `${name} go${s3 ? '' : 'es'} off. It isn't the words so much as the tone — the kind that makes people around a fire suddenly find somewhere else to be.`,
        `${name} pick${s3 ? '' : 's'} a fight over nothing and win${s3 ? '' : 's'} the argument and lose${s3 ? '' : 's'} the game. The tribe saw exactly who ${prn.sub} ${s3 ? 'are' : 'is'} today.`,
        `${prn.Sub} was fine all morning. Then something trip${s3 ? '' : 's'} ${prn.obj} and the version of ${name} that emerge${s3 ? '' : 's'} is the one the tribe has been quietly bracing for.`,
        `${name} say${s3 ? '' : 's'} the quiet part loud. Nobody responds. They just remember.`,
      ];
      const lines = isArrogant ? arrogantLines : hotheadLines;
      const hashBase = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
      const text = lines[(hashBase + epSeed * 3) % lines.length];

      // Reaction event — most-offended tribemate (highest social stat) clocks it
      const witness = tribemates.length
        ? tribemates.reduce((best, tm) => pStats(tm).social > pStats(best).social ? tm : best, tribemates[0])
        : null;
      let reactionText = '';
      if (witness) {
        const wPrn = pronouns(witness);
        const ws3 = wPrn.sub === 'they';
        const reactionLines = isArrogant ? [
          `${witness} clock${ws3 ? '' : 's'} it immediately. ${wPrn.Sub} keep${ws3 ? '' : 's'} ${wPrn.posAdj} expression neutral but ${wPrn.posAdj} read on ${name} just changed.`,
          `${witness} watch${ws3 ? '' : 'es'} ${name} hold court and say${ws3 ? '' : 's'} nothing. ${wPrn.Sub} ${ws3 ? "don't" : "doesn't"} need to. That's a name to bring up later.`,
          `${witness} file${ws3 ? '' : 's'} ${name}'s performance away. No reaction, no confrontation. Just information.`,
          `${witness} hear${ws3 ? '' : 's'} what ${name} said and quietly start${ws3 ? '' : 's'} doing the math on how many others felt the same way.`,
        ] : [
          `${witness} see${ws3 ? '' : 's'} the whole thing. ${wPrn.Sub} wait${ws3 ? '' : 's'} until ${name} is out of earshot, then say${ws3 ? '' : 's'} exactly nothing. The look on ${wPrn.posAdj} face was enough.`,
          `${witness} don't overreact. ${wPrn.Sub} ${ws3 ? "just" : "just"} make${ws3 ? '' : 's'} a mental note. ${name} did the work for ${wPrn.obj} today.`,
          `${witness} pull${ws3 ? '' : 's'} someone aside after. Not to campaign — just to confirm ${wPrn.sub} saw what ${wPrn.sub} saw. ${wPrn.Sub} ${ws3 ? "did" : "did"}.`,
          `${witness} absorb${ws3 ? '' : 's'} ${name}'s outburst with a stillness that means more than anything ${wPrn.sub} could have said out loud.`,
        ];
        reactionText = reactionLines[(hashBase + epSeed * 7) % reactionLines.length];
      }

      // Always inject into post events (fire during post-phase, show in "After The Challenge")
      const block = ep.campEvents[campKey];
      const arr = Array.isArray(block.post) ? block.post : block.pre;
      arr.push({ type: 'socialBomb', text, players: [name] });
      if (witness && reactionText) {
        arr.push({ type: 'socialBombReaction', text: reactionText, players: [witness, name] });
      }
      ep.socialBombs.push({ player: name, tribe: campKey, type: isArrogant ? 'arrogant' : 'hothead' });
    });
  });
}

// Goat targeting — two parts:
// Part 1 (merge): player with bombs >= 3 reaches merge → someone clocks them as a drag-along.
// Part 2 (late game, <= 9 left): strategic player recognizes that goat is dangerous at FTC
//   and starts mentally targeting them. Injects camp events + heat for next tribal.
export function checkGoatTargeting(ep) {
  if (!gs.isMerged || !gs.chalRecord) return;
  const campKey = Object.keys(ep.campEvents)[0];
  if (!campKey || !ep.campEvents[campKey]) return;
  const arr = ep.campEvents[campKey].post;
  const epSeed = ep.num * 29;
  const active = gs.activePlayers;
  if (!ep.goatEvents) ep.goatEvents = [];

  // ── PART 1: merge arrival — fires once per goat on the merge episode ──
  if (ep.isMerge) {
    const goats = active.filter(name => {
      const rec = gs.chalRecord[name];
      return rec && rec.bombs >= 3 && !ep.goatEvents.some(g => g.player === name && g.type === 'mergeGoat');
    });
    goats.forEach(name => {
      const prn = pronouns(name);
      const s3 = prn.sub === 'they';
      // Pick a strategic observer
      const observers = active.filter(p => p !== name);
      if (!observers.length) return;
      const observer = observers.reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best, observers[0]);
      const oPrn = pronouns(observer);
      const os3 = oPrn.sub === 'they';

      const goatLines = [
        `${name} made it to the merge. ${prn.Sub} ${s3 ? 'struggled' : 'struggled'} every challenge — and ${prn.sub} ${s3 ? 'are' : 'is'} still here. Someone is going to decide that's a useful quality.`,
        `${name} reach${s3 ? '' : 'es'} the merge with a challenge record that would embarrass most players. The tribe see${s3 ? '' : 's'} it. Some of them are already filing ${prn.obj} under "bring to the end."`,
        `${name} survived to the merge on social capital, not challenge performance. ${prn.Sub} ${s3 ? "know" : "knows"} it. So does everyone else — but that's exactly why ${prn.sub} ${s3 ? "aren't" : "isn't"} going home tonight.`,
        `Nobody writes ${name}'s name down going into merge. Not because they like ${prn.obj} — because ${prn.sub} ${s3 ? "lose" : "loses"} every challenge. ${prn.Sub} ${s3 ? "are" : "is"} a tool. Someone will use ${prn.obj}.`,
        `${name} walks into the merge knowing exactly what ${prn.sub} ${s3 ? "are" : "is"} to most people: an easy vote for whenever someone bigger needs to go. ${prn.Sub} ${s3 ? "plan" : "plans"} to use that.`,
        `The tribe sees ${name}'s challenge history and makes a mental note. Safe for now. Useful later. That's the most dangerous kind of player to have around.`,
      ];
      const observerLines = [
        `${observer} look${os3 ? '' : 's'} at ${name} and see${os3 ? '' : 's'} a number. Not a threat — a vote. Something to deploy when the time is right.`,
        `${observer} ha${os3 ? 've' : 's'} already decided ${name} goes deep. Not because ${oPrn.sub} ${os3 ? 'like' : 'likes'} ${prn.obj} — because ${prn.sub} ${s3 ? 'are' : 'is'} controllable.`,
        `${observer} quietly slot${os3 ? '' : 's'} ${name} into ${oPrn.posAdj} endgame plans. Goats don't need to be charmed. They just need to be kept comfortable.`,
        `${observer} clock${os3 ? '' : 's'} ${name}'s record and see${os3 ? '' : 's'} an asset. A vote to pocket. A name to throw when ${oPrn.sub} need${os3 ? '' : 's'} a shield.`,
      ];

      const hashBase = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
      const goatText = goatLines[(hashBase + epSeed) % goatLines.length];
      const obsText  = observerLines[(hashBase + epSeed * 7) % observerLines.length];

      arr.push({ type: 'goatIdentified', text: goatText, players: [name] });
      arr.push({ type: 'goatObserver',   text: obsText,  players: [observer, name] });
      ep.goatEvents.push({ player: name, observer, type: 'mergeGoat', ep: ep.num });
    });
  }

  // ── PART 2: FTC threat reassessment — late game only (9 or fewer left) ──
  if (active.length > 9) return;

  const goats = active.filter(name => {
    const rec = gs.chalRecord[name];
    return rec && rec.bombs >= 3;
  });
  if (!goats.length) return;

  goats.forEach(goat => {
    // Guard: each goat can only be re-assessed once per episode
    if (ep.goatEvents.some(g => g.player === goat && g.type === 'ftcThreat' && g.ep === ep.num)) return;

    // Find a strategist who hasn't already clocked this goat recently
    const strategists = active.filter(p => p !== goat && pStats(p).strategic >= 7);
    if (!strategists.length) return;

    // Deterministic roll per goat per episode
    const hashBase = [...goat].reduce((a, c) => a + c.charCodeAt(0), 0);
    const roll = (hashBase + epSeed) % 100;
    if (roll >= 22) return;

    const strategist = strategists.reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best, strategists[0]);
    const gPrn = pronouns(goat);
    const gs3 = gPrn.sub === 'they';
    const sPrn = pronouns(strategist);
    const ss3 = sPrn.sub === 'they';

    const ftcLines = [
      `${goat} hasn't won a single challenge. But ${gPrn.sub} ${gs3 ? 'are' : 'is'} liked. And liked players win jury votes. That's a problem.`,
      `${goat} look${gs3 ? '' : 's'} easy to beat on paper. But ${gPrn.sub} ${gs3 ? 'have' : 'has'} been sitting next to people at every tribal. The jury will remember that.`,
      `Everyone's been treating ${goat} like a goat. But goats who make it deep don't need immunity wins. They need relationships. And ${gPrn.sub} ${gs3 ? 'have' : 'has'} those.`,
      `The challenge résumé is a distraction. ${goat} will sit in front of the jury, smile, and explain how ${gPrn.sub} played ${gPrn.posAdj} social game quietly for 30 days. And it'll work.`,
      `${goat} is the most dangerous person at this stage — not because ${gPrn.sub} ${gs3 ? 'win' : 'wins'} challenges, but because nobody's afraid of ${gPrn.obj}. Jury never hates someone they never feared.`,
      `Losing every challenge didn't make ${goat} powerless. It made ${gPrn.obj} invisible. And invisible players make it to the end and win.`,
    ];
    const strategistLines = [
      `${strategist} recalculate${ss3 ? '' : 's'}. ${gPrn.Sub} ${gs3 ? 'weren\'t' : 'wasn\'t'} supposed to be a concern. Now ${sPrn.sub} ${ss3 ? 'aren\'t' : 'isn\'t'} sure anymore.`,
      `${strategist} run${ss3 ? '' : 's'} the jury math in ${sPrn.posAdj} head and land${ss3 ? '' : 's'} somewhere uncomfortable. ${goat}'s name is near the top now.`,
      `${strategist} ha${ss3 ? 've' : 's'} been sleeping on ${goat}. ${sPrn.Sub} ${ss3 ? 'aren\'t' : 'isn\'t'} anymore.`,
      `${strategist} start${ss3 ? '' : 's'} asking around about ${goat} quietly — not loudly, not yet. Just testing whether other people see what ${sPrn.sub} ${ss3 ? 'see' : 'sees'}.`,
    ];

    const hashBase2 = [...strategist].reduce((a, c) => a + c.charCodeAt(0), 0);
    const ftcText  = ftcLines[(hashBase + epSeed * 3) % ftcLines.length];
    const stratText = strategistLines[(hashBase2 + epSeed * 11) % strategistLines.length];

    arr.push({ type: 'ftcThreatAlert',    text: ftcText,  players: [goat] });
    arr.push({ type: 'ftcThreatStrategist', text: stratText, players: [strategist, goat] });

    // Bump vote heat for next tribal — strategist is now mentally targeting this goat
    if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
    gs.blowupHeatNextEp.add(goat);

    ep.goatEvents.push({ player: goat, strategist, type: 'ftcThreat', ep: ep.num });
  });
}

export function checkAllianceQuitting(ep) {
  if (!gs.namedAlliances?.length) return;
  gs.namedAlliances.forEach(alliance => {
    if (!alliance.active) return;
    const activeMembers = alliance.members.filter(m => gs.activePlayers.includes(m));
    [...activeMembers].forEach(member => {
      const s = pStats(member);
      const allies = activeMembers.filter(m => m !== member);
      if (!allies.length) return;
      // Average bond with alliance members
      const avgBond = allies.reduce((sum, m) => sum + getBond(member, m), 0) / allies.length;
      const wasBetrayed = alliance.betrayals?.some(b => b.votedFor === member);
      // Tribe split: member is on a different tribe from the majority of their alliance
      let isSplit = false;
      if (gs.phase === 'pre-merge' && gs.tribes.length) {
        const memberTribe = gs.tribes.find(t => t.members.includes(member))?.name;
        const allyTribeNames = allies.map(m => gs.tribes.find(t => t.members.includes(m))?.name).filter(Boolean);
        const majorityTribe = allyTribeNames.sort((a, b) =>
          allyTribeNames.filter(t => t === b).length - allyTribeNames.filter(t => t === a).length
        )[0];
        isSplit = !!(memberTribe && majorityTribe && memberTribe !== majorityTribe);
      }
      // Quit chance: bad bonds, low loyalty, high boldness, betrayal, tribe split
      const splitBonus = isSplit ? Math.max(0, 0.08 + (s.boldness - 5) * 0.015 + (5 - s.loyalty) * 0.015) : 0;
      const quitChance = Math.max(0,
        (avgBond < 0 ? -avgBond * 0.08 : 0)
        + (s.boldness - 5) * 0.015
        + (5 - s.loyalty) * 0.02
        + (wasBetrayed ? 0.2 : 0)
        + splitBonus
        + 0.015
      );
      if (Math.random() < quitChance) {
        const reason = wasBetrayed ? 'betrayed by alliance member'
          : isSplit ? 'tribe split — drifted away on separate tribe'
          : avgBond < -1 ? 'relationship breakdown'
          : (s.strategic >= 7 && s.loyalty <= 4 && Math.random() < 0.55) ? 'strategic pivot'
          : 'went solo';
        alliance.members = alliance.members.filter(m => m !== member);
        alliance.quits = alliance.quits || [];
        alliance.quits.push({ player: member, ep: ep.num, reason });
        if (alliance.members.filter(m => gs.activePlayers.includes(m)).length < 2) alliance.active = false;
        ep.allianceQuits = ep.allianceQuits || [];
        ep.allianceQuits.push({ player: member, alliance: alliance.name, reason });
        // Inject a camp event so the VP shows HOW and WHY the quit happened
        const _qTribeName = gs.isMerged ? 'merge'
          : gs.tribes.find(t => t.members.includes(member))?.name;
        if (_qTribeName && ep.campEvents?.[_qTribeName]) {
          const _qPrn = pronouns(member);
          const _qLines = {
            'betrayed by alliance member': [
              `${member} found out someone in ${alliance.name} voted against them. No confrontation. But ${_qPrn.sub} ${_qPrn.sub==='they'?'are':'is'} done with that group.`,
              `${member} knows who in ${alliance.name} turned on them. ${_qPrn.Sub} say${_qPrn.sub==='they'?'':'s'} nothing. The quiet is loud.`,
            ],
            'tribe split — drifted away on separate tribe': [
              `${member} quietly steps away from ${alliance.name}. The swap put them on opposite sides — the alliance can't survive the distance, and ${_qPrn.sub} know${_qPrn.sub==='they'?'':'s'} it.`,
              `The tribe swap ends ${member}'s commitment to ${alliance.name}. ${_qPrn.Sub} ${_qPrn.sub==='they'?'are':'is'} out — separated by geography, done by choice.`,
            ],
            'relationship breakdown': [
              `${member} stops showing up to ${alliance.name} conversations. The bonds were already gone. The behavior finally matches.`,
              `Something about ${alliance.name} stopped working for ${member}. ${_qPrn.Sub} ${_qPrn.sub==='they'?'don\'t':'doesn\'t'} say it out loud — ${_qPrn.sub} just stop${_qPrn.sub==='they'?'':'s'} being present.`,
            ],
            'strategic pivot': [
              `${member} is still friendly to the ${alliance.name} crowd. But the math has changed. ${_qPrn.Sub} ${_qPrn.sub==='they'?'have':'has'} already moved on.`,
              `${member} recalculates quietly. ${alliance.name} doesn't fit the new plan. ${_qPrn.Sub} start${_qPrn.sub==='they'?'':'s'} working around them instead of through them.`,
            ],
            'went solo': [
              `${member} decides ${alliance.name} is more liability than asset. ${_qPrn.Sub} detach${_qPrn.sub==='they'?'':'es'} quietly — no announcement, just a shift in where the energy goes.`,
              `${member} steps back from ${alliance.name}. No drama, no blow-up. ${_qPrn.Sub} just stop${_qPrn.sub==='they'?'':'s'} showing up to those conversations.`,
            ],
          };
          const _qOpts = _qLines[reason] || _qLines['went solo'];
          const _qText = _qOpts[Math.floor(Math.random() * _qOpts.length)];
          const _qBlock = ep.campEvents[_qTribeName];
          (_qBlock.post?.length >= 0 ? _qBlock.post : _qBlock.pre).push({ type: 'allianceCrack', text: _qText, players: [member] });
        }
      }
    });
  });
}

// phase: 'pre' (before challenge), 'post' (after challenge result known), 'both' (no-tribal/finale)
// How much each archetype resists romantic entanglement
export const SHOWMANCE_ARCHETYPE_MULT = {
  'showmancer':        2.5,  // built for this
  'social-butterfly':  0.70, // warm but not specifically romantic
  'underdog':          0.75, // genuine connections happen, but rare
  'wildcard':          0.75, // unpredictable — could go either way
  'hothead':           0.40, // intense but burns fast, not deep romance
  'goat':              0.45, // low social skills reduce the odds
  'chaos-agent':       0.35, // uses relationships as tools, doesn't feel them
  'floater':           0.30, // avoids any visible entanglement
  'perceptive-player': 0.30, // knows a showmance is a liability, actively avoids it
  'loyal-soldier':     0.25, // loyalty is to the alliance, not a person
  'schemer':           0.20, // relationships are instruments, not feelings
  'mastermind':        0.15, // too calculated to let emotion in
  'challenge-beast':   0.15, // focused on winning, not bonding
};

// Helper: check if a player is in any active showmance

// [6] FALSE IDOL PLANT — strategic player crafts and plants a fake idol
export function checkFakeIdolPlant(ep) {
  if (gs.fakeIdolPlanted) return; // once per game
  const epNum = (gs.episode || 0) + 1;
  if (epNum < 3) return; // too early — nobody's searching yet

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];

  // Find potential planters: strategic >= 7, being targeted (heat >= 3)
  const _campMembers = gs.isMerged ? gs.activePlayers : (gs.tribes.flatMap(t => t.members).filter(m => gs.activePlayers.includes(m)));
  const _planters = _campMembers.filter(name => {
    const s = pStats(name);
    if (s.strategic < 7) return false;
    const heat = computeHeat(name, _campMembers, gs.namedAlliances || []);
    if (heat < 3) return false;
    return true;
  });
  if (!_planters.length) return;

  // Roll for each potential planter: strategic * 0.015 + boldness * 0.01
  for (const planter of _planters) {
    const pS = pStats(planter);
    const pPr = pronouns(planter);
    if (Math.random() >= pS.strategic * 0.015 + pS.boldness * 0.01) continue;

    // FAKE IDOL PLANT FIRES
    gs.fakeIdolPlanted = true;
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(planter))?.name || 'merge');

    // ── ARC 1: Planter caught crafting? ──
    const _witnesses = _campMembers.filter(p => p !== planter);
    const _caughtBy = _witnesses.find(w => Math.random() < pStats(w).intuition * 0.03 + pStats(w).mental * 0.01);
    if (_caughtBy) {
      // Exposed — no fake idol enters the game
      const cPr = pronouns(_caughtBy);
      addBond(_caughtBy, planter, -1.0);
      _witnesses.filter(w => w !== _caughtBy).forEach(w => addBond(w, planter, -0.3));
      if (!gs.challengeThrowHeat) gs.challengeThrowHeat = {};
      // Reuse heat mechanism — schemer exposed
      const evtText = _pick([
        `${_caughtBy} catches ${planter} behind the shelter, carving something out of wood and paint. "What is that?" ${planter} freezes. "Nothing." It's not nothing — it's a fake idol. ${_caughtBy} tells the tribe. ${planter}'s credibility evaporates.`,
        `${_caughtBy} follows ${planter} into the jungle and watches ${pPr.obj} bury something near the water well. ${cPr.Sub} digs it up later — a fake idol, crudely made but convincing enough. "You tried to play us." Word spreads by morning.`,
        `${_caughtBy} notices ${planter} working on something at night. A carved coconut shell, wrapped in string, painted with charcoal. It looks like an idol. It's not. "${planter} was making a fake idol. I SAW it." The tribe turns. ${planter} has nowhere to hide.`,
      ], planter + _caughtBy + 'caught');

      if (ep.campEvents?.[campKey]) {
        (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push({
          type: 'fakeIdolCaught', players: [_caughtBy, planter], text: evtText,
          badgeText: 'FAKE IDOL EXPOSED', badgeClass: 'red',
        });
      }
      if (!ep.fakeIdolEvents) ep.fakeIdolEvents = [];
      ep.fakeIdolEvents.push({ arc: 'caught-crafting', planter, caughtBy: _caughtBy });
      return;
    }

    // ── ARC 2-4: Fake idol successfully planted ──
    // Find the victim — target based on planter's lowest bond (enemy) who searches
    const _searchers = _campMembers.filter(p => p !== planter && pStats(p).intuition >= 4);
    // Targeted victim: planter's enemy or the person the planter most wants to deceive
    let victim;
    const _enemies = _campMembers.filter(p => p !== planter && getBond(planter, p) <= -1)
      .sort((a, b) => getBond(planter, a) - getBond(planter, b));
    if (_enemies.length && _searchers.some(s => _enemies.includes(s))) {
      victim = _enemies.find(e => _searchers.includes(e)) || _enemies[0];
    } else if (_searchers.length) {
      victim = _searchers[Math.floor(Math.random() * _searchers.length)];
    } else {
      victim = _campMembers.filter(p => p !== planter)[0];
    }
    if (!victim) return;

    const vPr = pronouns(victim);
    const vS = pStats(victim);

    // Plant the fake idol as an advantage with fake flag
    gs.advantages.push({ holder: victim, type: 'idol', fake: true, plantedBy: planter, foundEp: epNum });

    // Camp event: victim finds the "idol" — they're excited
    const _findText = _pick([
      `${victim} finds something buried near the tree mail. ${vPr.Sub} ${vPr.sub==='they'?'unwrap':'unwraps'} it with shaking hands — it looks like a Hidden Immunity Idol. ${vPr.Sub} ${vPr.sub==='they'?'can\'t':'can\'t'} believe it. "${vPr.Sub === 'They' ? 'We found' : 'I found'} an idol." ${planter} watches from across camp. ${pPr.Sub} ${pPr.sub==='they'?'say':'says'} nothing.`,
      `${victim} stumbles onto something half-buried near the water well. It's wrapped in a leaf with a note: "This is a Hidden Immunity Idol." ${vPr.Sub} ${vPr.sub==='they'?'tuck':'tucks'} it away before anyone sees. But ${planter} already knows — because ${pPr.sub} put it there.`,
      `${victim} has been searching for days. Today, ${vPr.sub} finally ${vPr.sub==='they'?'find':'finds'} it — or what ${vPr.sub} ${vPr.sub==='they'?'think':'thinks'} is it. An idol. The relief on ${vPr.pos} face is real. The idol is not.`,
    ], victim + planter + 'find');

    if (ep.campEvents?.[campKey]) {
      (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push({
        type: 'fakeIdolFound', players: [victim], text: _findText,
        badgeText: 'IDOL FOUND', badgeClass: 'gold', // looks real to the viewer at this point? No — viewer should know
      });
      // Also show the planter's satisfaction (viewer knows it's fake)
      (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push({
        type: 'fakeIdolPlanted', players: [planter], text: _pick([
          `${planter} to confessional: "That idol ${victim} just found? I made it. Last night. Coconut shell, string, and a prayer. If ${vPr.sub} ${vPr.sub==='they'?'play':'plays'} it at tribal — and ${vPr.sub} will — the look on ${vPr.pos} face will be worth more than any real idol."`,
          `${planter} watches ${victim} celebrate the find from across camp. ${pPr.Sub} almost ${pPr.sub==='they'?'feel':'feels'} bad. Almost. "That's not an idol. That's a death sentence wrapped in a leaf."`,
        ], planter + 'satisfaction'),
        badgeText: 'FAKE IDOL PLANTED', badgeClass: 'red',
      });
    }

    // ── ARC 3: Tip-off check — can someone warn the victim? ──
    // Players who are close to the victim AND perceptive might notice something is off
    const _tipOffers = _campMembers.filter(p => p !== planter && p !== victim && getBond(p, victim) >= 2);
    const _tipOff = _tipOffers.find(t => Math.random() < pStats(t).intuition * 0.035 + getBond(t, victim) * 0.02);

    if (_tipOff) {
      // Someone warns the victim — fake idol exposed before tribal
      const tPr = pronouns(_tipOff);
      gs.advantages = gs.advantages.filter(a => !(a.fake && a.holder === victim && a.plantedBy === planter));
      addBond(victim, _tipOff, 1.0); // gratitude
      addBond(victim, planter, -2.0); // betrayal
      addBond(_tipOff, planter, -0.5); // suspicion confirmed

      // Store tip-off for next-episode camp event (confrontation happens after they verify)
      gs.fakeIdolTipOff = { victim, tipOffer: _tipOff, planter, ep: epNum };
    }

    if (!ep.fakeIdolEvents) ep.fakeIdolEvents = [];
    ep.fakeIdolEvents.push({
      arc: _tipOff ? 'tipped-off' : 'planted',
      planter, victim, tippedOffBy: _tipOff || null,
    });
    return; // one fake idol per game
  }
}

// Fake idol tip-off confrontation — fires next episode if someone warned the victim
export function generateFakeIdolTipOffEvents(ep) {
  if (!gs.fakeIdolTipOff) return;
  const { victim, tipOffer, planter, ep: tipEp } = gs.fakeIdolTipOff;
  if ((gs.episode || 0) + 1 <= tipEp) return; // wait for next episode
  gs.fakeIdolTipOff = null; // consume

  if (!gs.activePlayers.includes(victim) || !gs.activePlayers.includes(planter)) return;

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
  const vPr = pronouns(victim);
  const pPr = pronouns(planter);
  const vS = pStats(victim);

  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(victim))?.name || 'merge');
  if (!ep.campEvents?.[campKey]) return;

  // Confrontation — personality-driven
  let confrontText;
  if (vS.temperament <= 4 || vS.boldness >= 7) {
    confrontText = _pick([
      `${victim} holds up the fake idol in front of the tribe. "This is what ${planter} thinks of me. A FAKE. ${pPr.Sub} planted this hoping I'd humiliate myself at tribal." ${victim} throws it in the fire. ${planter} doesn't deny it.`,
      `${victim} walks straight up to ${planter}. "You made this." ${vPr.Sub} ${vPr.sub==='they'?'hold':'holds'} up the fake idol. "You thought I was stupid enough to play this." ${planter}: "I thought you were desperate enough." The camp goes nuclear.`,
    ], victim + planter + 'confrontBold');
  } else if (vS.strategic >= 7) {
    confrontText = _pick([
      `${victim} doesn't confront ${planter} publicly. Instead, ${vPr.sub} quietly ${vPr.sub==='they'?'show':'shows'} the fake to two allies. "This is what we're dealing with. ${planter} is playing dirty." The fake becomes ammunition — not for tribal, but for the social game.`,
      `${victim} to confessional: "${tipOffer} warned me. The idol is fake — ${planter} made it. I'm not going to blow up at camp. I'm going to use this information when it matters most. ${planter} doesn't know I know. And that's power."`,
    ], victim + planter + 'confrontStrat');
  } else {
    confrontText = _pick([
      `${victim} sits by the fire holding the fake idol. ${vPr.Sub} ${vPr.sub==='they'?'know':'knows'} now. ${tipOffer} told ${vPr.obj} everything. The hurt on ${vPr.pos} face isn't anger — it's disbelief. "I actually believed it was real. I was so happy." ${vPr.Sub} ${vPr.sub==='they'?'drop':'drops'} it in the dirt.`,
      `${victim} doesn't say anything to ${planter}. But ${vPr.sub} ${vPr.sub==='they'?'stop':'stops'} talking to ${pPr.obj}. ${vPr.Sub} ${vPr.sub==='they'?'stop':'stops'} making eye contact. The silence is the punishment. Everyone notices. Nobody asks why.`,
    ], victim + planter + 'confrontEmotional');
  }

  (ep.campEvents[campKey].pre || []).push({
    type: 'fakeIdolConfrontation', players: [victim, planter, tipOffer],
    text: `${tipOffer} pulled ${victim} aside last night. "That idol you found? I don't think it's real. I saw ${planter} working on something." ${victim} checked. ${tipOffer} was right. ` + confrontText,
    badgeText: 'FAKE IDOL', badgeClass: 'red',
  });
}

// Black Vote guess events — players speculate about who received the black vote
export function generateBlackVoteGuessEvents(ep) {
  if (!gs.blackVotes?.length && !ep.blackVoteApplied) return;
  if (seasonConfig.blackVote === 'off' || !seasonConfig.blackVote) return;

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

  // Who knows there's a black vote in play? Everyone — it's a known rule.
  // But who received it is secret. Players try to guess.
  const _pendingBVs = gs.blackVotes?.filter(bv => bv.type === 'classic' && gs.activePlayers.includes(bv.target)) || [];
  if (!_pendingBVs.length) return;

  const _bv = _pendingBVs[0]; // the active black vote
  const _realTarget = _bv.target;
  const _from = _bv.from;

  // Each strategic/intuitive player guesses who got the black vote
  const _guessers = gs.activePlayers.filter(p => {
    const s = pStats(p);
    return (s.strategic >= 5 || s.intuition >= 6) && Math.random() < s.strategic * 0.04 + s.intuition * 0.03;
  });

  if (!_guessers.length) return;

  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(_guessers[0]))?.name || 'merge');
  if (!ep.campEvents?.[campKey]) return;

  _guessers.forEach(guesser => {
    const gS = pStats(guesser);
    const gPr = pronouns(guesser);

    // Correct guess? proportional to intuition
    const _guessCorrect = Math.random() < gS.intuition * 0.08; // intuition 7 = 56%, intuition 3 = 24%
    const _guessedTarget = _guessCorrect ? _realTarget
      : gs.activePlayers.filter(p => p !== guesser).sort((a, b) => getBond(_from, a) - getBond(_from, b))[0]; // wrong guess — picks someone with bad bond to the eliminated

    if (!_guessedTarget) return;

    // Heat consequences of the guess
    if (!_guessCorrect) {
      // Wrong guess — heat on the wrong person
      // Other players who hear this might pile on
      if (Math.random() < 0.4) {
        if (!gs.blackVoteGuessHeat) gs.blackVoteGuessHeat = {};
        gs.blackVoteGuessHeat[_guessedTarget] = (gs.episode || 0) + 1;
      }
    }

    const _guessText = _pick([
      `${guesser} pulls someone aside. "I've been thinking about ${_from}'s Black Vote. I think ${gPr.sub} ${gPr.sub==='they'?'sent':'sent'} it to ${_guessedTarget}." ${_guessCorrect ? 'The read is correct — but nobody can confirm it.' : 'The read is wrong. But nobody knows that yet.'}`,
      `${guesser} to confessional: "Who did ${_from} target with the Black Vote? ${gS.intuition >= 7 ? `My gut says ${_guessedTarget}. ${_from} never trusted ${pronouns(_guessedTarget).obj}.` : `I have no idea. But if I had to guess... ${_guessedTarget}. ${_from} would want to hurt ${pronouns(_guessedTarget).obj} one last time.`}"`,
      `At camp, ${guesser} brings it up: "We need to talk about the Black Vote. ${_from} is gone but ${pronouns(_from).pos} vote isn't. I think it's on ${_guessedTarget}." The tribe considers this. ${_guessCorrect ? 'They should — because it\'s right.' : 'They shouldn\'t — because it\'s wrong.'}`,
    ], guesser + _guessedTarget + 'bvguess');

    (ep.campEvents[campKey].pre || []).push({
      type: 'blackVoteGuess', players: [guesser, _guessedTarget],
      text: _guessText,
      badgeText: _guessCorrect ? 'CORRECT READ' : 'WRONG READ',
      badgeClass: _guessCorrect ? 'gold' : 'red',
    });
  });
}


// ── Showmance Lifecycle: phase progression + events each episode ──

// ── Showmance Test: fires when a partner is the top vote target at tribal ──

// ── Showmance Breakup: detect when one partner votes out the other ──

// ── Love Triangle Breakup: resolve when any member is eliminated ──

// ── Love Triangle Detection: dual-showmance or one-sided crush ──


// ── Secret Affair Lifecycle: exposure tier progression each episode ──

// ── Affair Resolution: the confrontation and choice ──

export function checkIdolConfessions(ep) {
  if (!gs.advantages?.length) return;
  if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
  ep.idolConfessions = ep.idolConfessions || [];
  ep.idolBetrayals   = ep.idolBetrayals   || [];

  const idolHolders = gs.advantages.filter(a => a.type === 'idol' && gs.activePlayers.includes(a.holder));
  idolHolders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    // Confession chance: social + bold players talk; high loyalty keeps secrets
    // Strategic players are more deliberate — they confess less randomly but more purposefully
    const _stratPenalty = -(s.strategic * 0.007); // proportional: stat 5=-0.035, stat 10=-0.07
    const confChance = Math.max(0.03, Math.min(0.28, 0.03 + s.social * 0.015 + s.boldness * 0.01 - s.loyalty * 0.008 + _stratPenalty));
    if (Math.random() >= confChance) return;

    // Find best ally on same tribe with bond >= 2
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    // Strategic players pick confidants smarter — they factor in the person's loyalty stat
    // (less likely to pick a leaky low-loyalty player as their confidant)
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p), trustScore: getBond(holder, p) + s.strategic * 0.04 * pStats(p).loyalty }))
      .filter(x => x.bond > 0)
      .sort((a, b) => b.trustScore - a.trustScore);
    if (!allies.length) return;

    const confidant = allies[0].name;
    ep.idolConfessions.push({ holder, confidant });

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside after everyone else had gone to sleep. ${_pr.Sub} trusted ${confidant} with something ${_pr.sub} hadn't told anyone else.`,
      `${holder} needed to tell someone. ${confidant} was the one ${_pr.sub} trusted most out here. That trust might have a price.`,
      `In the dark, ${holder} leaned close and told ${confidant} what was in ${_pr.posAdj} bag. It felt like the right call at the time.`,
    ];
    const confEvt = { type: 'idolConfession', text: confLines[Math.floor(Math.random() * confLines.length)] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }

    // Roll betrayal: low loyalty, low bond with holder, or rival alliance pressure
    const cs = pStats(confidant);
    const bondVal = getBond(confidant, holder);
    const rivalAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(confidant) && !a.members.includes(holder));
    const betrayChance = Math.max(0.05, Math.min(0.45,
      0.05 + (10 - cs.loyalty) * 0.025 + (5 - Math.max(-5, Math.min(5, bondVal))) * 0.02 + (rivalAlliance ? 0.15 : 0)
    ));
    if (Math.random() >= betrayChance) return;

    // Betrayal fires
    ep.idolBetrayals.push({ holder, betrayer: confidant });
    gs.knownIdolHoldersThisEp.add(holder);
    addBond(confidant, holder, -1.5);

    const betrayLines = [
      `${confidant} didn't sleep after that conversation. By morning, the information had moved.`,
      `${confidant} thought about it for hours. By the time the sun came up, a decision had been made — one that ${holder} doesn't know about yet.`,
      `The secret lasted until ${confidant} found someone who needed to hear it.`,
    ];
    const betrayEvt = { type: 'idolBetrayal', text: betrayLines[Math.floor(Math.random() * betrayLines.length)] };
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(betrayEvt);
    }
  });
}

// ── Team Swap confession: holder confides in closest ally about the Team Swap advantage ──
export function checkTeamSwapConfessions(ep) {
  const tsHolders = (gs.advantages || []).filter(a => a.type === 'teamSwap' && gs.activePlayers.includes(a.holder));
  if (!tsHolders.length || !ep.campEvents) return;
  if (!gs.knownTeamSwapHolders) gs.knownTeamSwapHolders = new Set();

  tsHolders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    // ~15% chance, proportional to social
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    // Find best ally on same tribe with bond >= 2
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownTeamSwapHolders.add(holder);
    addBond(holder, confidant, 0.3); // trust gesture

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. ${_pr.Sub} showed ${confidant} the Team Swap — the power to move someone between tribes. ${confidant}'s eyes widened. That kind of trust doesn't come cheap.`,
      `${holder} needed someone to know. ${_pr.Sub} told ${confidant} about the Team Swap. If things go south, ${_pr.sub} ${_pr.sub === 'they' ? 'have' : 'has'} an exit strategy — and now ${confidant} knows it too.`,
      `In a quiet moment, ${holder} confided in ${confidant} about the Team Swap. It felt like the right move — sharing the weight of that kind of power.`,
    ];
    const confEvt = { type: 'teamSwapConfession', players: [holder, confidant],
      text: confLines[Math.floor(Math.random() * confLines.length)] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

export function checkSafetyNoPowerConfessions(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'safetyNoPower' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;
  if (!gs.knownSafetyNoPowerHolders) gs.knownSafetyNoPowerHolders = new Set();

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownSafetyNoPowerHolders.add(holder);
    addBond(holder, confidant, 0.3);

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. "I found something. If things go bad, I can leave tribal. Just... walk out." ${confidant} stared. "And your vote?" ${holder} shrugged. "Gone."`,
      `${holder} told ${confidant} about the Safety Without Power. An escape route — but it means abandoning the vote. ${confidant} didn't say much. The weight of it sat between them.`,
      `In a quiet moment, ${holder} confided in ${confidant}. "I have a way out. But if I use it, you're on your own at tribal." ${confidant} nodded slowly. That kind of honesty costs something.`,
    ];
    const _seed = [...(holder+confidant)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const confEvt = { type: 'safetyNoPowerConfession', players: [holder, confidant],
      text: confLines[_seed % confLines.length] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

export function checkSoleVoteConfessions(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'soleVote' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;
  if (!gs.knownSoleVoteHolders) gs.knownSoleVoteHolders = new Set();

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    const confChance = s.loyalty * 0.06 + getBond(holder, confidant) * 0.04;
    if (Math.random() >= confChance) return;

    gs.knownSoleVoteHolders.add(holder);
    addBond(holder, confidant, 0.3);

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside and lowered ${_pr.posAdj} voice. "I found something that changes everything. I can cast the only vote at tribal. Everyone else? Silenced." ${confidant} went pale.`,
      `${holder} confided in ${confidant}. "I have a Sole Vote. When I play it, I decide who goes. Just me." ${confidant} didn't know whether to feel protected or terrified.`,
      `${holder} trusted ${confidant} enough to share the truth: ${_pr.sub} ${_pr.sub === 'they' ? 'hold' : 'holds'} a Sole Vote. One person decides the entire elimination. ${confidant} nodded slowly, already calculating what that means for ${pronouns(confidant).obj}.`,
    ];
    const _seed = [...(holder+confidant)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const confEvt = { type: 'soleVoteConfession', players: [holder, confidant],
      text: confLines[_seed % confLines.length] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

// ── Social intel gathering: social butterflies learn things through conversation, not sneaking ──
export function checkSocialIntel(ep) {
  if (!ep.campEvents) return;
  // Proportional: every player has a chance, scales with social stat
  const _socialPlayers = gs.activePlayers;

  _socialPlayers.forEach(socialP => {
    const _socialChance = pStats(socialP).social * 0.03; // proportional: stat 4=12%, stat 7=21%, stat 10=30%
    if (Math.random() > _socialChance) return;
    const _sS = pStats(socialP);
    const _pr = pronouns(socialP);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(socialP))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const _pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);

    // What do they learn? Check what secrets exist on their tribe
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== socialP)
      : (gs.tribes.find(t => t.members.includes(socialP))?.members || []).filter(p => p !== socialP);

    // 1. Discover an idol holder through natural conversation (not snooping — they just READ people)
    const _hiddenIdolHolder = tribeMembers.find(p =>
      gs.advantages.some(a => (a.type === 'idol' || a.type === 'legacy') && a.holder === p)
      && !gs.knownIdolHoldersPersistent?.has(p)
      && getBond(socialP, p) > -1 // needs at least neutral relationship to have a conversation
    );
    if (_hiddenIdolHolder && Math.random() < _sS.social * 0.05) { // proportional: stat 4=20%, stat 7=35%, stat 10=50%
      if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
      gs.knownIdolHoldersThisEp.add(_hiddenIdolHolder);
      if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
      gs.knownIdolHoldersPersistent.add(_hiddenIdolHolder);
      _pushEvt({ type: 'socialIntel', players: [socialP, _hiddenIdolHolder], text:
        `${socialP} has a way of making people talk without asking direct questions. After a long conversation with ${_hiddenIdolHolder}, ${_pr.sub} ${_pr.sub==='they'?'know':'knows'} something ${_pr.sub} ${_pr.sub==='they'?'weren\'t':'wasn\'t'} supposed to know.`,
        badgeText: 'Social Intel', badgeClass: 'gold' });
      return; // one intel per episode max
    }

    // 2. Pick up on vote plans — learn who's being targeted through camp gossip
    const _targetedPlayers = tribeMembers.filter(p => computeHeat(p, tribeMembers.concat(socialP), []) >= 3);
    if (_targetedPlayers.length && Math.random() < 0.30) {
      const _target = _targetedPlayers[Math.floor(Math.random() * _targetedPlayers.length)];
      _pushEvt({ type: 'socialIntel', players: [socialP], text:
        `${socialP} doesn't need to eavesdrop. ${_pr.Sub} just listen${_pr.sub==='they'?'':'s'} — really listen${_pr.sub==='they'?'':'s'} — and by sunset ${_pr.sub} ${_pr.sub==='they'?'know':'knows'} ${_target}'s name is floating. Nobody told ${_pr.obj} directly. ${_pr.Sub} just pieced it together.`,
        badgeText: 'Social Read', badgeClass: 'gold' });
      // Boost their eavesdrop flag so voting plans are more accurate for them
      if (gs.playerStates?.[socialP]) gs.playerStates[socialP].eavesdropBoostThisEp = true;
      return;
    }

    // 3. Read the room — sense alliance dynamics others miss
    const _crackingAlliances = (gs.namedAlliances || []).filter(a => {
      if (!a.active) return false;
      const members = a.members.filter(m => tribeMembers.includes(m) || m === socialP);
      if (members.length < 2) return false;
      const avgBond = members.reduce((s, m) => s + members.filter(o => o !== m).reduce((ss, o) => ss + getBond(m, o), 0), 0) / Math.max(1, members.length * (members.length - 1));
      return avgBond < 1;
    });
    if (_crackingAlliances.length && Math.random() < 0.25) {
      const _crackA = _crackingAlliances[Math.floor(Math.random() * _crackingAlliances.length)];
      _pushEvt({ type: 'socialIntel', players: [socialP], text:
        `${socialP} watches ${_crackA.name} interact at camp and sees what nobody else is admitting: the trust isn't there anymore. ${_pr.Sub} file${_pr.sub==='they'?'':'s'} that away for later.`,
        badgeText: 'Social Read', badgeClass: 'gold' });
    }
  });
}

// ── Second Life Amulet events: tension, leaks, strategic ripple ──
export function checkSecondLifeAmuletEvents(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'secondLife' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const _pr = pronouns(holder);
    const tribeName = gs.isMerged ? (gs.mergeName || 'merge')
      : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (!tribeName || !ep.campEvents[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => { (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt); };

    // Only fire one event per holder per episode, ~30% chance
    if (Math.random() > 0.30) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const bestAlly = tribeMembers.slice().sort((a, b) => getBond(holder, b) - getBond(holder, a))[0];
    const rival = tribeMembers.slice().sort((a, b) => getBond(holder, a) - getBond(holder, b))[0];

    const _roll = Math.random();

    if (_roll < 0.20 && bestAlly && getBond(holder, bestAlly) >= 2) {
      // ── Confession: tells a close ally about the amulet ──
      const confLines = [
        `${holder} pulled ${bestAlly} aside after the challenge. "If they come for me, I have something." ${_pr.Sub} didn't say what. ${bestAlly} didn't ask.`,
        `${holder} leaned in close. "I found something at camp. If I go to tribal and it goes wrong — I'm not done." ${bestAlly}'s expression said everything.`,
        `${holder} told ${bestAlly} about the amulet. It felt like insurance. It also felt like a target if the wrong person finds out.`,
      ];
      pushEvt({ type: 'amuletConfession', players: [holder, bestAlly],
        text: confLines[Math.floor(Math.random() * confLines.length)] });
      addBond(holder, bestAlly, 0.5); // trust deepens

      // Betrayal roll: ally leaks it
      const cs = pStats(bestAlly);
      const betrayChance = Math.max(0.05, 0.08 + (10 - cs.loyalty) * 0.02 - getBond(bestAlly, holder) * 0.02);
      if (Math.random() < betrayChance) {
        const leakTarget = tribeMembers.filter(p => p !== bestAlly && p !== holder)
          .sort((a, b) => getBond(bestAlly, b) - getBond(bestAlly, a))[0];
        if (leakTarget) {
          const leakLines = [
            `${bestAlly} told ${leakTarget} about ${holder}'s amulet. The information is out. What happens next depends on who moves first.`,
            `By nightfall, ${leakTarget} knew about the Second Life Amulet. ${bestAlly} let it slip — maybe on purpose, maybe not. Either way, the secret is no longer a secret.`,
          ];
          pushEvt({ type: 'amuletLeak', players: [bestAlly, leakTarget, holder],
            text: leakLines[Math.floor(Math.random() * leakLines.length)] });
          addBond(holder, bestAlly, -1.5); // betrayal
          addBond(leakTarget, holder, -0.5); // suspicion
          // Tribe now knows — amulet holder becomes less attractive target
          if (!gs.knownAmuletHoldersThisEp) gs.knownAmuletHoldersThisEp = new Set();
          gs.knownAmuletHoldersThisEp.add(holder);
          if (!gs.knownAmuletHoldersPersistent) gs.knownAmuletHoldersPersistent = new Set();
          gs.knownAmuletHoldersPersistent.add(holder);
        }
      }

    } else if (_roll < 0.45) {
      // ── False Security: holder plays looser, others notice ──
      const secLines = [
        `${holder} has been different since finding the amulet. Looser. Less worried. The tribe hasn't figured out why yet — but someone will.`,
        `Something shifted in ${holder}'s game. ${_pr.Sub} stopped scrambling before tribal. Started sitting back. That kind of calm is suspicious when you're supposed to be fighting for your life.`,
        `${holder} doesn't flinch when names come up anymore. ${_pr.Sub} used to. The tribe is starting to notice the difference.`,
      ];
      pushEvt({ type: 'amuletFalseSecurity', players: [holder],
        text: secLines[Math.floor(Math.random() * secLines.length)] });

    } else if (_roll < 0.65 && rival && getBond(holder, rival) <= -1) {
      // ── Strategic Dilemma: holder considers who to pick if it activates ──
      const stratLines = [
        `${holder} has been watching ${rival} all day. If the amulet fires, ${rival}'s name is already written in ${_pr.posAdj} head. This isn't just survival — it's personal.`,
        `${holder} sat by the fire thinking. If tribal goes south, the Second Life Amulet gives ${_pr.obj} a choice. And ${_pr.sub} already know${_pr.sub==='they'?'':'s'} who ${_pr.sub}'d pick.`,
      ];
      pushEvt({ type: 'amuletDilemma', players: [holder, rival],
        text: stratLines[Math.floor(Math.random() * stratLines.length)] });

    } else if (_roll < 0.80) {
      // ── The Weight: holding power and saying nothing takes a toll ──
      const weightLines = [
        `${holder} checked the amulet again tonight. Third time today. The weight of carrying it — knowing what it does, knowing when it fires — sits heavier than ${_pr.sub} expected.`,
        `The Second Life Amulet doesn't do anything until you're already dead in the game. That's the cruelest part. ${holder} carry${_pr.sub==='they'?'':'ies'} hope and dread in the same pocket.`,
        `${holder} almost told someone tonight. Almost. Then ${_pr.sub} looked around the fire and decided that silence was the only safe play left.`,
      ];
      pushEvt({ type: 'amuletWeight', players: [holder],
        text: weightLines[Math.floor(Math.random() * weightLines.length)] });

    } else {
      // ── Snooping: someone spots the amulet ──
      // Proportional: any player can snoop, chance scales with intuition
      const snooper = tribeMembers.filter(p => Math.random() < pStats(p).intuition * 0.04 + pStats(p).mental * 0.015)
        .sort(() => Math.random() - 0.5)[0];
      if (snooper) {
        const snoopLines = [
          `${snooper} saw something in ${holder}'s bag. ${pronouns(snooper).Sub} didn't get a clear look — but it wasn't nothing. The shape was wrong for anything normal.`,
          `${snooper} caught ${holder} reaching into ${_pr.posAdj} bag near the water well. ${holder} froze for a half-second. That was enough.`,
          `${snooper} has been watching ${holder} for days. Something about ${_pr.posAdj} posture changed after that morning alone at camp. ${pronouns(snooper).Sub} think${pronouns(snooper).sub==='they'?'':'s'} ${holder} found something.`,
        ];
        pushEvt({ type: 'amuletSnoop', players: [snooper, holder],
          text: snoopLines[Math.floor(Math.random() * snoopLines.length)] });
        addBond(snooper, holder, -0.3); // suspicion
        // Snooper suspects — adds to known holders (they'll share the info)
        if (!gs.knownAmuletHoldersThisEp) gs.knownAmuletHoldersThisEp = new Set();
        gs.knownAmuletHoldersThisEp.add(holder);
        if (!gs.knownAmuletHoldersPersistent) gs.knownAmuletHoldersPersistent = new Set();
        gs.knownAmuletHoldersPersistent.add(holder);
      }
    }
  });
}

// ── Legacy Advantage Camp Events: confession, weight, heir scheming ──
export function checkLegacyCampEvents(ep) {
  if (!ep.campEvents) return;
  const legacyAdvs = gs.advantages.filter(a => a.type === 'legacy' && gs.activePlayers.includes(a.holder));
  if (!legacyAdvs.length) return;

  legacyAdvs.forEach(adv => {
    const holder = adv.holder;
    const _pr = pronouns(holder);
    const s = pStats(holder);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(holder))?.name;
    if (!tribeName || !ep.campEvents[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => { (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt); };

    // ~25% chance per episode
    if (Math.random() > 0.25) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const bestAlly = tribeMembers.slice().sort((a, b) => getBond(holder, b) - getBond(holder, a))[0];
    const likelyHeir = bestAlly; // highest bond = most likely to be willed the advantage

    const _roll = Math.random();
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

    if (_roll < 0.25 && bestAlly && getBond(holder, bestAlly) >= 2) {
      // ── Confession: tells ally about the Legacy Advantage (like Sierra → Sarah) ──
      pushEvt({ type: 'legacyConfession', players: [holder, bestAlly], text: _rp([
        `${holder} pulled ${bestAlly} aside. "I have the Legacy Advantage. If I go home, it goes to you." The weight of that statement hangs between them.`,
        `${holder} told ${bestAlly} about the Legacy Advantage. Trust — or a mistake. Time will tell which.`,
        `"If something happens to me, check your bag the next morning." ${holder} didn't explain further. ${bestAlly} understood.`,
      ]), badgeText: 'Legacy Confessed', badgeClass: 'gold' });
      addBond(holder, bestAlly, 0.5);
      // Track knowledge
      if (!gs.knownLegacyHolders) gs.knownLegacyHolders = new Set();
      gs.knownLegacyHolders.add(holder);
      // Store who the holder confessed to — they now know about the will
      if (!gs.legacyConfessedTo) gs.legacyConfessedTo = {};
      gs.legacyConfessedTo[holder] = bestAlly;

      // Betrayal roll: ally leaks the secret (lower chance than amulet — legacy is more personal)
      const _allyS = pStats(bestAlly);
      const _betrayChance = Math.max(0.03, 0.06 + (10 - _allyS.loyalty) * 0.015 - getBond(bestAlly, holder) * 0.02);
      if (Math.random() < _betrayChance) {
        const leakTarget = tribeMembers.filter(p => p !== bestAlly).sort((a, b) => getBond(bestAlly, b) - getBond(bestAlly, a))[0];
        if (leakTarget) {
          pushEvt({ type: 'legacyLeak', players: [bestAlly, leakTarget, holder], text: _rp([
            `${bestAlly} told ${leakTarget} about ${holder}'s Legacy Advantage. The information is out — and now ${leakTarget} knows exactly what's at stake.`,
            `By nightfall, ${leakTarget} knew. ${bestAlly} let it slip. The Legacy Advantage just became everyone's business.`,
          ]), badgeText: 'Legacy Leaked', badgeClass: 'red' });
          addBond(holder, bestAlly, -1.5);
          gs.knownLegacyHolders.add(holder);
        }
      }

    } else if (_roll < 0.50 && gs.legacyConfessedTo?.[holder]) {
      // ── The Sarah Play: someone who knows about the legacy wants the holder gone to inherit it ──
      const _knower = gs.legacyConfessedTo[holder];
      if (gs.activePlayers.includes(_knower) && _knower !== holder) {
        const _knowerS = pStats(_knower);
        // Strategic players with low loyalty see the opportunity
        if (_knowerS.strategic >= 6 && _knowerS.loyalty <= 6) {
          pushEvt({ type: 'legacyScheme', players: [_knower, holder], text: _rp([
            `${_knower} does the math. If ${holder} goes home, the Legacy Advantage lands in ${pronouns(_knower).posAdj} bag. The thought isn't going away.`,
            `${_knower} has been thinking about it since ${holder} told ${pronouns(_knower).obj}. Vote ${holder} out → inherit the Legacy Advantage. The logic is clean. The loyalty is complicated.`,
            `"${holder} trusts me with everything." ${_knower} says it to the confessional. Then pauses. "That might be the problem."`,
          ]), badgeText: 'Heir Scheming', badgeClass: 'red' });
          // The knower's heat toward the holder increases — they WANT them gone
          addBond(_knower, holder, -0.3); // subtle erosion
        }
      }

    } else if (_roll < 0.75) {
      // ── Weight: holder feels the burden of carrying a ticking clock ──
      pushEvt({ type: 'legacyWeight', players: [holder], text: _rp([
        `${holder} checks ${_pr.posAdj} bag for the third time today. The Legacy Advantage is still there. The question is whether ${_pr.sub}'ll make it to the day it activates.`,
        `The Legacy Advantage sits in ${holder}'s bag like a promise. But promises don't mean anything if you don't survive long enough to keep them.`,
        `${holder} knows the number. ${(adv.activatesAt || [5]).join(' or ')} players left. That's when it fires. The math says ${_pr.sub} ${_pr.sub==='they'?'need':'needs'} to survive ${gs.activePlayers.length - Math.min(...(adv.activatesAt || [5]))} more tribals. The game says nothing is guaranteed.`,
      ]), badgeText: 'Legacy Weight', badgeClass: '' });

    } else {
      // ── Heir awareness: tribe speculates about who'd inherit if the holder left ──
      if (likelyHeir) {
        const _obs = tribeMembers.filter(p => p !== likelyHeir && pStats(p).strategic >= 6);
        const _observer = _obs[Math.floor(Math.random() * _obs.length)];
        if (_observer && gs.knownLegacyHolders?.has(holder)) {
          pushEvt({ type: 'legacyHeirWatch', players: [_observer, holder, likelyHeir], text: _rp([
            `${_observer} has been watching ${holder} and ${likelyHeir}. If ${holder} goes, the Legacy Advantage goes to ${likelyHeir}. That changes the calculus on both of them.`,
            `${_observer} clocks the bond between ${holder} and ${likelyHeir}. If the Legacy Advantage exists — and ${_observer} thinks it does — ${likelyHeir} is the heir. That makes ${likelyHeir} valuable. And ${holder} expendable.`,
          ]), badgeText: 'Watching the Heir', badgeClass: 'gold' });
        }
      }
    }
  });
}

// ── Tactical advantage snoop: intuitive players notice Team Swap / Vote Block / Vote Steal holders ──
export function checkTacticalAdvantageSnoop(ep) {
  if (!ep.campEvents) return;
  const _snoopTypes = [
    { type: 'teamSwap', setKey: 'knownTeamSwapHolders', chance: 0.02, evtType: 'teamSwapSnooped', label: 'Team Swap' },
    { type: 'voteBlock', setKey: 'knownVoteBlockHolders', chance: 0.015, evtType: 'voteBlockSnooped', label: 'Vote Block' },
    { type: 'voteSteal', setKey: 'knownVoteStealHolders', chance: 0.015, evtType: 'voteStealSnooped', label: 'Vote Steal' },
    { type: 'safetyNoPower', setKey: 'knownSafetyNoPowerHolders', chance: 0.02, evtType: 'safetyNoPowerSnooped', label: 'Safety Without Power' },
    { type: 'soleVote', setKey: 'knownSoleVoteHolders', chance: 0.02, evtType: 'soleVoteSnooped', label: 'Sole Vote' },
  ];

  _snoopTypes.forEach(({ type: _sType, setKey, chance, evtType, label }) => {
    const _sHolders = (gs.advantages || []).filter(a => a.type === _sType && gs.activePlayers.includes(a.holder));
    _sHolders.forEach(_sAdv => {
      const _sHolder = _sAdv.holder;
      if (!gs[setKey]) gs[setKey] = new Set();

      const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_sHolder))?.name);
      if (!tribeName || !ep.campEvents?.[tribeName]) return;

      const tribeMembers = gs.isMerged
        ? gs.activePlayers.filter(p => p !== _sHolder)
        : (gs.tribes.find(t => t.members.includes(_sHolder))?.members || []).filter(p => p !== _sHolder);

      // Skip if all tribemates already know
      const _sUnaware = tribeMembers.filter(p => !gs[setKey].has(p));
      if (!_sUnaware.length) return;

      // Find snooper — proportional to intuition
      const _sSnooper = _sUnaware.filter(p => Math.random() < pStats(p).intuition * chance)
        .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (!_sSnooper) return;

      gs[setKey].add(_sHolder);
      const _sPr = pronouns(_sHolder);
      const _sSnoopPr = pronouns(_sSnooper);
      const _sSnoopLines = [
        `${_sSnooper} noticed ${_sHolder} checking ${_sPr.posAdj} bag one too many times. Something's in there — and ${_sSnoopPr.sub} think${_sSnoopPr.sub === 'they' ? '' : 's'} it's a ${label}.`,
        `${_sSnooper} caught a glimpse of something in ${_sHolder}'s things. ${_sSnoopPr.Sub} ${_sSnoopPr.sub === 'they' ? 'aren\'t' : 'isn\'t'} sure, but it looked like a ${label}. ${_sSnooper} is keeping that to ${_sSnoopPr.ref}.`,
        `${_sSnooper} has been watching ${_sHolder}. The way ${_sPr.sub} ${_sPr.sub === 'they' ? 'move' : 'moves'} around camp changed a few days ago. ${_sSnooper} is almost certain ${_sHolder} has a ${label}.`,
      ];

      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push({
        type: evtType, players: [_sSnooper, _sHolder],
        text: _sSnoopLines[Math.floor(Math.random() * _sSnoopLines.length)]
      });
    });
  });
}

// ── Comfort Blindspot: foreshadowing for complacent players sitting on danger ──
// Fires ~25% when a checked-out player (comfortable + low stats) is the heat leader on their tribe.
// Pushes a comfortBlindspot event + clockingIt reaction into pre-challenge camp events.
// ep.comfortBlindspotPlayer is used by rpBuildTribal to flag a comfort blindside if they're eliminated.
// ── Hero + Villain archetype camp events ──
export function checkHeroVillainEvents(ep) {
  if (!ep.campEvents) return;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  const _heroes = gs.activePlayers.filter(p => players.find(pl => pl.name === p)?.archetype === 'hero');
  const _villains = gs.activePlayers.filter(p => players.find(pl => pl.name === p)?.archetype === 'villain');

  // ── VILLAIN EVENTS (~30% per villain per episode) ──
  _villains.forEach(v => {
    if (Math.random() > 0.30) return;
    const _vPr = pronouns(v);
    const _vS = pStats(v);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(v))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);
    const tribeMembers = gs.isMerged ? gs.activePlayers.filter(p => p !== v) : (gs.tribes.find(t => t.members.includes(v))?.members || []).filter(p => p !== v);

    const _roll = Math.random();

    if (_roll < 0.25 && tribeMembers.length) {
      // Intimidation — villain asserts dominance
      const _target = tribeMembers.sort((a, b) => getBond(v, a) - getBond(v, b))[0]; // worst enemy
      addBond(_target, v, -0.4);
      pushEvt({ type: 'villainIntimidate', players: [v, _target], text: _rp([
        `${v} walks past ${_target} at the fire and doesn't sit down. Just stands there. Looking. The message is clear.`,
        `"You know it's coming, right?" ${v} says it to ${_target} like ${_vPr.sub} ${_vPr.sub==='they'?'are':'is'} discussing the weather. ${_target} doesn't respond.`,
        `${v} positions ${_vPr.ref} between ${_target} and the rest of the tribe. It's not accidental. Everyone notices.`,
      ]), badgeText: 'Intimidation', badgeClass: 'red' });
    } else if (_roll < 0.50) {
      // Power declaration — villain announces control
      pushEvt({ type: 'villainPower', players: [v], text: _rp([
        `"I'm running this game and everyone knows it." ${v} says it at camp. Out loud. The tribe goes quiet.`,
        `${v} doesn't whisper strategy. ${_vPr.Sub} announce${_vPr.sub==='they'?'':'s'} it. The tribe can accept it or fight it — but ${_vPr.sub} ${_vPr.sub==='they'?'aren\'t':'isn\'t'} hiding.`,
        `${v} lays out exactly what's going to happen tonight. No deception. No spin. Just power.`,
      ]), badgeText: 'Power Play', badgeClass: 'red' });
    } else if (_roll < 0.70 && ep.eliminated) {
      // Gloating — villain celebrates an enemy's departure
      const _elimBond = getBond(v, ep.eliminated);
      if (_elimBond < -1) {
        pushEvt({ type: 'villainGloat', players: [v], text: _rp([
          `${v} doesn't hide ${_vPr.posAdj} satisfaction this morning. ${ep.eliminated} is gone and ${v} wants everyone to know ${_vPr.sub} ${_vPr.sub==='they'?'are':'is'} happy about it.`,
          `"One down." ${v} says it with a smile that makes the rest of the tribe uncomfortable.`,
        ]), badgeText: 'Gloating', badgeClass: 'red' });
        tribeMembers.forEach(p => { if (getBond(p, ep.eliminated) >= 2) addBond(p, v, -0.3); }); // allies of eliminated resent
      }
    } else {
      // Villain's inner circle — fierce loyalty to their #1
      const _bestAlly = tribeMembers.sort((a, b) => getBond(v, b) - getBond(v, a))[0];
      if (_bestAlly && getBond(v, _bestAlly) >= 1) {
        addBond(v, _bestAlly, 0.4);
        pushEvt({ type: 'villainLoyalty', players: [v, _bestAlly], text: _rp([
          `${v} is ruthless with everyone — except ${_bestAlly}. The loyalty there is real. And it makes ${_bestAlly} untouchable.`,
          `${v} pulls ${_bestAlly} aside. "Nobody touches you. That's not strategy — that's a promise." ${_bestAlly} believes it.`,
        ]), badgeText: 'Inner Circle', badgeClass: 'gold' });
      }
    }
  });

  // ── HERO EVENTS (~30% per hero per episode) ──
  _heroes.forEach(h => {
    if (Math.random() > 0.30) return;
    const _hPr = pronouns(h);
    const _hS = pStats(h);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(h))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);
    const tribeMembers = gs.isMerged ? gs.activePlayers.filter(p => p !== h) : (gs.tribes.find(t => t.members.includes(h))?.members || []).filter(p => p !== h);

    const _roll = Math.random();

    if (_roll < 0.25 && _villains.some(v => tribeMembers.includes(v) || v === h)) {
      // Confronting the villain — the hero stands up
      const _villain = _villains.find(v => tribeMembers.includes(v));
      if (_villain) {
        addBond(h, _villain, -0.5);
        // Tribe respects the stand
        tribeMembers.filter(p => p !== _villain).forEach(p => addBond(p, h, 0.2));
        pushEvt({ type: 'heroConfront', players: [h, _villain], text: _rp([
          `${h} walks up to ${_villain} and says what nobody else will. The camp holds its breath.`,
          `"Enough." ${h} says it to ${_villain}'s face in front of everyone. ${_villain} ${pronouns(_villain).sub==='they'?'don\'t':'doesn\'t'} flinch — but the tribe sees something shift.`,
          `${h} stands between ${_villain} and the rest of the tribe. Not physically — but in a way that everyone understands.`,
        ]), badgeText: 'Hero vs Villain', badgeClass: 'gold' });
      }
    } else if (_roll < 0.50) {
      // Standing up for the weak — protect an underdog/bottom player
      const _weak = tribeMembers.sort((a, b) => {
        const avgA = tribeMembers.reduce((s, p) => s + getBond(a, p), 0) / Math.max(1, tribeMembers.length);
        const avgB = tribeMembers.reduce((s, p) => s + getBond(b, p), 0) / Math.max(1, tribeMembers.length);
        return avgA - avgB;
      })[0]; // most isolated player
      if (_weak) {
        addBond(h, _weak, 0.6);
        addBond(_weak, h, 0.8);
        pushEvt({ type: 'heroProtect', players: [h, _weak], text: _rp([
          `${h} notices ${_weak} is on the outside. Instead of using it, ${_hPr.sub} sit${_hPr.sub==='they'?'':'s'} with ${_weak}. Not strategy — just decency.`,
          `"Leave ${_weak} alone." ${h} doesn't say it loudly. But the people who needed to hear it, heard it.`,
          `Everyone else is circling ${_weak}. ${h} is the only one who extends a hand instead of writing a name.`,
        ]), badgeText: 'Protecting the Weak', badgeClass: 'green' });
      }
    } else if (_roll < 0.70) {
      // Sacrifice — giving up something for the tribe
      pushEvt({ type: 'heroSacrifice', players: [h], text: _rp([
        `${h} gives up ${_hPr.posAdj} portion of rice so someone else can eat. Nobody asked ${_hPr.obj} to. That's the point.`,
        `${h} volunteers for the hardest camp task — the one nobody wants. Again. The tribe notices, even if they don't say it.`,
        `${h} could have kept the information to ${_hPr.ref}. Instead, ${_hPr.sub} shared it with the group. It's a risk — but ${_hPr.sub} ${_hPr.sub==='they'?'play':'plays'} with a code.`,
      ]), badgeText: 'Sacrifice', badgeClass: 'green' });
      tribeMembers.forEach(p => addBond(p, h, 0.15)); // tribe respects the sacrifice
    } else {
      // Emotional weight — the cost of being the hero
      pushEvt({ type: 'heroWeight', players: [h], text: _rp([
        `Everyone comes to ${h} with their problems. Nobody asks how ${h} is doing.`,
        `${h} sits alone at the end of the day. The moral compass of the tribe is heavy. ${_hPr.Sub} carry${_hPr.sub==='they'?'':'s'} it because nobody else will.`,
        `${h} is tired. Not physically — emotionally. Being the person everyone trusts means being the person everyone leans on.`,
      ]), badgeText: 'The Weight', badgeClass: '' });
    }
  });
}

// ── Social Politics: active campaigning between tribals ──
// ══════════════════════════════════════════════════════════════════════════════
// THE MOLE — sabotage actions + suspicion accumulation
// ══════════════════════════════════════════════════════════════════════════════
export function checkMoleSabotage(ep) {
  if (!gs.moles?.length || !ep.campEvents) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  const coordinated = seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2;

  gs.moles.forEach(mole => {
    if (!gs.activePlayers.includes(mole.player)) return; // eliminated

    // Post-exposure: no sabotage, but inject survival-mode camp events
    if (mole.exposed) {
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (_moleTribe && ep.campEvents[_moleTribe] && Math.random() < 0.40) {
        const mp = pronouns(mole.player);
        const _survTexts = [
          `${mole.player} tries to rebuild. ${mp.Sub} pull${mp.sub === 'they' ? '' : 's'} people aside one by one, making ${mp.posAdj} case. "I was playing the game — same as everyone else."`,
          `${mole.player} is scrambling. The tribe knows what ${mp.sub} did, and the trust is gone. But ${mp.sub} ${mp.sub === 'they' ? 'aren\'t' : 'isn\'t'} done yet.`,
          `Nobody sits next to ${mole.player} at the fire anymore. ${mp.Sub} eat${mp.sub === 'they' ? '' : 's'} alone. But ${mp.sub} ${mp.sub === 'they' ? 'keep' : 'keeps'} talking, keeps working, keeps trying to find a crack.`,
          `${mole.player} plays the victim card. "Production put me up to this — I had no choice." Some buy it. Most don't.`,
          `${mole.player} offers information — real information — to anyone who'll listen. It's the only currency ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} left.`,
        ];
        const evts = ep.campEvents[_moleTribe].post || ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleExposedSurvival', text: _pick(_survTexts),
          players: [mole.player], badgeText: 'EXPOSED'
        });
      }
      return;
    }

    // ── Laying low check — but max 2 consecutive episodes, then forced back ──
    const _moleHeat = computeHeat(mole.player, gs.activePlayers, gs.namedAlliances || []);
    const _maxSusp = Math.max(0, ...Object.values(mole.suspicion));
    const _recentActs = mole.sabotageLog.filter(s => s.ep >= curEp - 2).length;
    // Track consecutive lay-low episodes
    if (!mole._layLowStreak) mole._layLowStreak = 0;
    const _shouldLayLow = (_moleHeat >= 4 || _maxSusp >= 2.0 || _recentActs >= 4);
    const _forcedBack = mole._layLowStreak >= 1; // max 1 consecutive — then the Mole acts
    if (_shouldLayLow && !_forcedBack && Math.random() > 0.15) {
      mole.layingLow = true;
      // Inject a laying-low camp event
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (_moleTribe && ep.campEvents[_moleTribe]) {
        const mp = pronouns(mole.player);
        const _layLowTexts = [
          `${mole.player} is unusually helpful today — carrying firewood, fetching water, staying out of strategy talks. ${mp.Sub} ${mp.sub === 'they' ? 'seem' : 'seems'} to be making a point of being useful.`,
          `${mole.player} spends the day bonding with anyone who'll listen. Jokes, stories, camp chores. No game talk. Just vibes.`,
          `${mole.player} keeps ${mp.posAdj} head down. No scheming, no whispering. Just another day at camp. Nobody notices — which is exactly the point.`,
          `${mole.player} volunteers to cook for the tribe. It's a small gesture, but it lands. ${mp.Sub} ${mp.sub === 'they' ? 'know' : 'knows'} the heat is on — and the best move is no move at all.`,
          `${mole.player} is all smiles today. Checking in on alliances, affirming commitments. The perfect teammate. If only they knew.`,
        ];
        const evts = ep.campEvents[_moleTribe].post || ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleLayingLow', text: _pick(_layLowTexts),
          players: [mole.player], badgeText: 'LAYING LOW'
        });
      }
      mole._layLowStreak = (mole._layLowStreak || 0) + 1;
      return; // no sabotage this episode
    }
    mole.layingLow = false;
    mole._layLowStreak = 0; // reset streak — Mole is back in action

    // Love triangle / affair cover — drama distracts from suspicion
    const _moleInTriangle = (gs.loveTriangles || []).some(t => !t.resolved && (t.center === mole.player || t.suitors.includes(mole.player)));
    const _moleInAffair = (gs.affairs || []).some(af => !af.resolved && (af.cheater === mole.player || af.secretPartner === mole.player));
    if (_moleInTriangle || _moleInAffair) mole.resistance = Math.min(0.85, mole.resistance + 0.15);

    // ── SUSPICION EVENTS — players getting closer to the truth ──
    const _moleTribeSusp = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(mole.player))?.name;
    if (_moleTribeSusp && ep.campEvents) {
      if (!ep.campEvents[_moleTribeSusp]) ep.campEvents[_moleTribeSusp] = { pre: [], post: [] };
      const _suspEvts = (typeof ep.campEvents[_moleTribeSusp] === 'object' && !Array.isArray(ep.campEvents[_moleTribeSusp]))
        ? (ep.campEvents[_moleTribeSusp].pre || []) : (Array.isArray(ep.campEvents[_moleTribeSusp]) ? ep.campEvents[_moleTribeSusp] : []);

      Object.entries(mole.suspicion).forEach(([observer, susp]) => {
        if (!gs.activePlayers.includes(observer)) return;
        const op = pronouns(observer), mp = pronouns(mole.player);

        // Suspicion >= 2.0 — player starts talking to others, planting doubt
        if (susp >= 2.0 && susp < 2.5 && Math.random() < 0.40) {
          // Only fire once per observer (track to avoid repeat events)
          if (!mole._suspEvtFired) mole._suspEvtFired = {};
          if (mole._suspEvtFired[observer + '_talk']) return;
          mole._suspEvtFired[observer + '_talk'] = true;
          const _talkTexts = [
            `${observer} pulls someone aside. "Have you noticed anything about ${mole.player}? Every time something goes wrong, ${mp.sub} ${mp.sub === 'they' ? 'are' : 'is'} right there." The other person pauses. They have noticed.`,
            `${observer} has been comparing notes. The challenge where ${mole.player} underperformed. The alliance that cracked right after ${mp.sub} joined it. The leaked intel. ${observer} isn't sure yet — but the pattern is forming.`,
            `"I'm not accusing anyone," ${observer} says carefully. "But I think we need to talk about ${mole.player}." The conversation is quiet. The implications are not.`,
            `${observer} asks around camp: who told you that? Who started that rumor? Every answer leads back to ${mole.player}. ${observer} isn't ready to say it out loud yet. But ${op.sub} ${op.sub === 'they' ? 'are' : 'is'} getting close.`,
          ];
          _suspEvts.push({
            type: 'moleSuspicionTalk', text: _pick(_talkTexts),
            players: [observer, mole.player], badgeText: 'GROWING SUSPICION'
          });
          // Talking spreads suspicion — nearby players gain a small amount
          gs.activePlayers.filter(p => p !== observer && p !== mole.player).forEach(p => {
            if (getBond(observer, p) >= 1 && Math.random() < 0.25) {
              if (!mole.suspicion[p]) mole.suspicion[p] = 0;
              mole.suspicion[p] += 0.2; // word spreads
            }
          });
        }

        // Suspicion >= 2.5 — direct confrontation or trap
        if (susp >= 2.5 && Math.random() < 0.50) {
          if (!mole._suspEvtFired) mole._suspEvtFired = {};
          if (mole._suspEvtFired[observer + '_confront']) return;
          mole._suspEvtFired[observer + '_confront'] = true;
          const _confrontTexts = [
            `${observer} corners ${mole.player} at camp. "I know what you've been doing." ${mole.player} laughs it off. ${observer} doesn't laugh. The tension doesn't break.`,
            `${observer} sets a trap — tells ${mole.player} a fake piece of intel and waits to see where it goes. If it leaks, ${observer} has ${mp.posAdj} proof.`,
            `${observer} brings it up at the fire, in front of everyone. "Something isn't right about ${mole.player}'s game." The tribe shifts uncomfortably. ${mole.player} keeps ${mp.posAdj} face neutral. Barely.`,
            `${observer} confronts ${mole.player} directly. "Every time you're involved in a conversation, someone ends up on the wrong side of the vote. That's not a coincidence." ${mole.player} deflects. ${observer} isn't buying it.`,
          ];
          _suspEvts.push({
            type: 'moleSuspicionConfront', text: _pick(_confrontTexts),
            players: [observer, mole.player], badgeText: 'CONFRONTATION'
          });
          // Confrontation damages bond and spreads suspicion faster
          addBond(observer, mole.player, -0.5);
          gs.activePlayers.filter(p => p !== observer && p !== mole.player).forEach(p => {
            if (Math.random() < 0.35) {
              if (!mole.suspicion[p]) mole.suspicion[p] = 0;
              mole.suspicion[p] += 0.3; // public confrontation — everyone hears it
            }
          });
        }
      });
    }

    // ── GUARANTEED SABOTAGE: Mole always does at least 1-2 acts per episode ──
    // Pick 1-2 sabotage types that are guaranteed to fire (if their gates pass)
    // Remaining types still roll independently at normal rates
    const _availableTypes = ['bondSabotage', 'infoLeak', 'voteDisruption', 'advantageSabotage'];
    const _guaranteedCount = Math.random() < 0.5 ? 2 : 1; // 50% chance of 2 guaranteed
    const _shuffled = _availableTypes.sort(() => Math.random() - 0.5);
    const _guaranteed = new Set(_shuffled.slice(0, _guaranteedCount));

    // ── THREAT ASSESSMENT: who suspects the Mole most? Target them. ──
    const _suspEntries = Object.entries(mole.suspicion).filter(([n, v]) => v >= 0.5 && gs.activePlayers.includes(n));
    _suspEntries.sort((a, b) => b[1] - a[1]);
    const _moleThreat = _suspEntries.length ? _suspEntries[0][0] : null; // most suspicious player
    const _moleThreatLevel = _moleThreat ? mole.suspicion[_moleThreat] : 0;

    // ── BOND SABOTAGE — guaranteed or 30% chance ──
    if (_guaranteed.has('bondSabotage') || Math.random() < 0.30) {
      // Find the Mole's tribe/group
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (!_moleTribe) return;
      const _tribeMembers = gs.isMerged
        ? gs.activePlayers.filter(p => p !== mole.player)
        : (gs.tribes.find(t => t.name === _moleTribe)?.members || []).filter(p => p !== mole.player);

      // Find two players with bond >= 2 to sabotage
      const _otherMole = coordinated ? gs.moles.find(m => m.player !== mole.player)?.player : null;
      const _candidates = [];
      for (let i = 0; i < _tribeMembers.length; i++) {
        for (let j = i + 1; j < _tribeMembers.length; j++) {
          const a = _tribeMembers[i], b = _tribeMembers[j];
          // Coordinated moles don't sabotage each other
          if (_otherMole && (a === _otherMole || b === _otherMole)) continue;
          if (getBond(a, b) >= 0.5) _candidates.push([a, b]); // low gate — Mole can fabricate conflict between anyone not already enemies
        }
      }
      if (!_candidates.length) return;

      // Pre-merge: Owen mode — random chaos, weaken the tribe
      // Post-merge: Scott mode — surgical, target pairs that threaten the Mole
      let _selectedPair;
      if (gs.isMerged && _candidates.length > 1) {
        // Score each pair: higher = more valuable to sabotage
        const _scored = _candidates.map(([a, b]) => {
          let score = 0;
          const bondAB = getBond(a, b);
          const moleBondA = getBond(mole.player, a);
          const moleBondB = getBond(mole.player, b);
          // Prefer strong pairs (bigger bond = more damage when broken)
          score += bondAB * 0.3;
          // Prefer pairs where neither is the Mole's ally (don't wreck your own network)
          if (moleBondA < 2) score += 0.5;
          if (moleBondB < 2) score += 0.5;
          // Prefer pairs containing players who are threats to the Mole
          const threatA = threatScore(a), threatB = threatScore(b);
          score += (threatA + threatB) * 0.15;
          // Prefer pairs in alliances the Mole isn't part of
          const _moleAlliances = (gs.namedAlliances || []).filter(al => al.active && al.members.includes(mole.player));
          const _moleAllianceMembers = new Set(_moleAlliances.flatMap(al => al.members));
          if (!_moleAllianceMembers.has(a) && !_moleAllianceMembers.has(b)) score += 1.0;
          // Prefer players who have been voting for the Mole (weaken their support)
          const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
          if (_prevEp?.voteDetail) {
            const _votedForMole = _prevEp.voteDetail.filter(v => v.target === mole.player).map(v => v.voter);
            if (_votedForMole.includes(a)) score += 0.8;
            if (_votedForMole.includes(b)) score += 0.8;
          }
          // PRIORITY: target pairs involving the most suspicious player — weaken their social network
          if (_moleThreat) {
            if (a === _moleThreat || b === _moleThreat) score += 1.5 + _moleThreatLevel * 0.5;
          }
          return { pair: [a, b], score: score + Math.random() * 0.5 };
        });
        _scored.sort((a, b) => b.score - a.score);
        _selectedPair = _scored[0].pair;
      } else {
        // Pre-merge: random
        _selectedPair = _pick(_candidates);
      }

      const [targetA, targetB] = _selectedPair;
      const ms = pStats(mole.player);
      // Bond damage proportional to Mole's social stat
      const bondDmg = -(ms.social * 0.12 + 0.5);
      addBond(targetA, targetB, bondDmg);

      // Log the sabotage
      mole.sabotageCount++;
      mole.sabotageLog.push({ ep: curEp, type: 'bondSabotage', targets: [targetA, targetB], bondDmg });

      // Erode stealth resistance
      mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

      // Inject camp event
      const mp = pronouns(mole.player);
      const pA = pronouns(targetA), pB = pronouns(targetB);
      const _sabTexts = [
        `${mole.player} pulls ${targetA} aside. "You know what ${targetB} said about you?" The quote is fabricated — but ${targetA} doesn't know that. ${pA.PosAdj} expression changes.`,
        `${mole.player} casually mentions to ${targetA} that ${targetB} has been talking about ${pA.obj} behind ${pA.posAdj} back. It's an exaggeration at best, a lie at worst — but the seed is planted.`,
        `At camp, ${mole.player} plays telephone. A minor disagreement between ${targetA} and ${targetB} becomes a full-blown conflict after ${mp.sub} ${mp.sub === 'they' ? 'twist' : 'twists'} the words on both sides.`,
        `${mole.player} approaches ${targetB} with concern. "I'm worried about you — ${targetA} has been saying some things." The empathy is convincing. The information is not.`,
        `${mole.player} sits between ${targetA} and ${targetB} at the fire. By the time ${mp.sub} ${mp.sub === 'they' ? 'leave' : 'leaves'}, both think the other has been plotting against them. Neither confronts the other — they just trust ${mole.player} more.`,
      ];
      if (ep.campEvents[_moleTribe]) {
        const evts = ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleBondSabotage', text: _pick(_sabTexts),
          players: [mole.player, targetA, targetB], badgeText: 'MOLE'
        });
      }

      // ── SUSPICION ACCUMULATION — nearby high-intuition players may notice ──
      const _witnesses = _tribeMembers.filter(p => p !== targetA && p !== targetB);
      _witnesses.forEach(w => {
        const wIntuition = pStats(w).intuition;
        // Roll: intuition * 0.04, halved by Mole's resistance
        const suspGain = (wIntuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance);
        if (Math.random() < suspGain) {
          if (!mole.suspicion[w]) mole.suspicion[w] = 0;
          mole.suspicion[w] += 0.4 + mole.sabotageCount * 0.03; // scales with sloppiness
        }
      });
      // The targets themselves might notice the fabrication
      [targetA, targetB].forEach(t => {
        const tIntuition = pStats(t).intuition;
        const suspGain = (tIntuition * 0.04 + pStats(t).mental * 0.015) * (1.1 - mole.resistance);
        if (Math.random() < suspGain) {
          if (!mole.suspicion[t]) mole.suspicion[t] = 0;
          mole.suspicion[t] += 0.4 + mole.sabotageCount * 0.03;
        }
      });

      // ── EXPOSURE CHECK — any observer hits suspicion threshold 3.0? ──
      _checkMoleExposure(mole, ep, _moleTribe);
    }

    // Helper: get Mole's tribe for remaining actions
    const _moleTribe2 = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(mole.player))?.name;
    if (!_moleTribe2) return;
    const _tribeMembers2 = gs.isMerged
      ? gs.activePlayers.filter(p => p !== mole.player)
      : (gs.tribes.find(t => t.name === _moleTribe2)?.members || []).filter(p => p !== mole.player);
    const _otherMole2 = coordinated ? gs.moles.find(m => m.player !== mole.player)?.player : null;

    // NOTE: Challenge throw camp events + suspicion handled in patchEpisodeHistory
    // (checkMoleSabotage runs BEFORE simulateTribeChallenge, so gs._moleChalThrows is empty here)

    // ── INFO LEAK — guaranteed or 30% chance ──
    if (!mole.exposed && (_guaranteed.has('infoLeak') || Math.random() < 0.30)) {
      const _moleAlliances = (gs.namedAlliances || []).filter(a =>
        a.active && a.members.includes(mole.player)
      );
      // Actionable intel: alliance vote targets or idol knowledge (doesn't require Mole's own alliance)
      const _knownIdols = (gs.advantages || []).filter(a =>
        (a.type === 'idol' || a.type === 'legacy' || a.type === 'amulet') &&
        a.holder !== mole.player
      );
      // Pick a leak recipient — someone NOT in the Mole's alliances (or anyone if no alliances)
      const _allianceMembers = new Set(_moleAlliances.flatMap(a => a.members));
      const _leakTargets = _allianceMembers.size
        ? _tribeMembers2.filter(p => !_allianceMembers.has(p) && (_otherMole2 ? p !== _otherMole2 : true))
        : _tribeMembers2.filter(p => (_otherMole2 ? p !== _otherMole2 : true));
      if (_leakTargets.length) {
        const _leakTo = _pick(_leakTargets);
        let _leakInfo, _leakType;
        if (_knownIdols.length && Math.random() < 0.4) {
          // Leak idol knowledge — Mole may have overheard or snooped
          const _idol = _pick(_knownIdols);
          _leakInfo = `${_idol.holder} has a ${_idol.type === 'idol' ? 'Hidden Immunity Idol' : _idol.type}`;
          _leakType = 'idolLeak';
          if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
          gs.knownIdolHoldersPersistent.add(_idol.holder);
        } else if (_moleAlliances.length) {
          // Leak alliance plans
          const _al = _pick(_moleAlliances);
          const _alMembers = _al.members.filter(m => m !== mole.player).slice(0, 3).join(', ');
          _leakInfo = `${_al.name} (${_alMembers}) is targeting someone — watch your back`;
          _leakType = 'allianceLeak';
        } else {
          // No alliance, no idols — fabricate a rumor to stir paranoia
          // PRIORITY: target whoever suspects the Mole — turn others against them
          const _rumorPool = _tribeMembers2.filter(p => p !== _leakTo && (_otherMole2 ? p !== _otherMole2 : true));
          const _rumorTarget = (_moleThreat && _rumorPool.includes(_moleThreat) && Math.random() < 0.7)
            ? _moleThreat
            : _pick(_rumorPool);
          if (_rumorTarget) {
            _leakInfo = `${_rumorTarget} has been talking about making a move — you might be on the wrong side`;
            _leakType = 'fabrication';
            addBond(_leakTo, _rumorTarget, -0.4); // the recipient now distrusts the rumor target
          }
        }
        if (_leakInfo) {
          addBond(mole.player, _leakTo, 0.3); // "helpful" relationship building
          mole.sabotageCount++;
          mole.sabotageLog.push({ ep: curEp, type: 'infoLeak', leakedTo: _leakTo, info: _leakInfo });
          mole.leaks.push({ ep: curEp, leakedTo: _leakTo, info: _leakInfo });
          mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

          const mp = pronouns(mole.player);
          const _leakTexts = [
            `${mole.player} pulls ${_leakTo} aside for what looks like a casual chat. By the end, ${_leakTo} knows something ${pronouns(_leakTo).sub} shouldn't: ${_leakInfo}.`,
            `Over the fire, ${mole.player} drops a piece of intel to ${_leakTo}. "Just thought you should know." The tip is real — and it came from ${mp.posAdj} own alliance.`,
            `${mole.player} slips ${_leakTo} a warning. It looks like friendship. It's sabotage.`,
            `"Between you and me," ${mole.player} whispers to ${_leakTo}, "you might want to be careful." The intel is genuine — stolen from ${mp.posAdj} own alliance's plans.`,
            `${mole.player} bonds with ${_leakTo} over shared information. What ${_leakTo} doesn't realize is that this "trust" is a tool — and ${mole.player} just weaponized ${mp.posAdj} own alliance's secrets.`,
          ];
          if (ep.campEvents[_moleTribe2]) {
            const evts = ep.campEvents[_moleTribe2].pre || (Array.isArray(ep.campEvents[_moleTribe2]) ? ep.campEvents[_moleTribe2] : []);
            evts.push({
              type: 'moleInfoLeak', text: _pick(_leakTexts),
              players: [mole.player, _leakTo], badgeText: 'MOLE'
            });
          }
          // Suspicion: if the leaked info comes back around, alliance members notice
          _moleAlliances.forEach(al => {
            al.members.filter(m => m !== mole.player && gs.activePlayers.includes(m)).forEach(m => {
              const suspGain = (pStats(m).intuition * 0.04 + pStats(m).mental * 0.015) * (1.1 - mole.resistance);
              if (Math.random() < suspGain * 0.5) { // harder to trace back
                if (!mole.suspicion[m]) mole.suspicion[m] = 0;
                mole.suspicion[m] += 0.4 + mole.sabotageCount * 0.03;
              }
            });
          });
          _checkMoleExposure(mole, ep, _moleTribe2);
        }
      }
    }

    // ── VOTE DISRUPTION — guaranteed or 30% chance, store for use in simulateVotes ──
    // Flag only — sabotageCount/log NOT incremented here. simulateVotes handles that
    // because we don't know yet if the Mole's tribe goes to tribal (pre-merge).
    if (!mole.exposed && (_guaranteed.has('voteDisruption') || Math.random() < 0.30)) {
      if (!gs._moleVoteDisruption) gs._moleVoteDisruption = [];
      gs._moleVoteDisruption.push(mole.player);
    }

    // ── ADVANTAGE SABOTAGE — guaranteed or 35% chance while holding an advantage ──
    if (!mole.exposed) {
      const _moleAdvs = (gs.advantages || []).filter(a => a.holder === mole.player);
      if (_moleAdvs.length && (_guaranteed.has('advantageSabotage') || Math.random() < 0.35)) {
        const _adv = _pick(_moleAdvs);
        const mp = pronouns(mole.player);
        let _advSabText, _advSabAction;

        if (Math.random() < 0.4) {
          // Leak advantage existence to a rival
          const _rivals = _tribeMembers2.filter(p =>
            getBond(mole.player, p) < 1 && (_otherMole2 ? p !== _otherMole2 : true)
          );
          if (_rivals.length) {
            const _rival = _pick(_rivals);
            _advSabAction = 'leaked';
            const _typeLabel = _adv.type === 'idol' ? 'Hidden Immunity Idol' : _adv.type === 'extraVote' ? 'Extra Vote' : _adv.type === 'voteSteal' ? 'Vote Steal' : _adv.type;
            _advSabText = `${mole.player} "accidentally" lets it slip to ${_rival} that ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} a ${_typeLabel}. The leak looks careless. It's calculated — now the wrong people know.`;
            // Mark advantage as known
            if (_adv.type === 'idol') {
              if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
              gs.knownIdolHoldersPersistent.add(mole.player);
            }
          }
        } else if (Math.random() < 0.5) {
          // Plant false idol/advantage location
          _advSabAction = 'falseInfo';
          _advSabText = `${mole.player} plants false information about where an idol might be hidden. A couple of players spend hours searching the wrong spot. ${mp.Sub} ${mp.sub === 'they' ? 'watch' : 'watches'} from a distance.`;
          if (!gs._falseInfoPlanted) gs._falseInfoPlanted = [];
          gs._falseInfoPlanted.push({ planter: mole.player, ep: curEp, type: 'mole' });
        } else {
          // Will waste the play at tribal — flag for checkIdolPlays/checkNonIdolAdvantageUse
          _advSabAction = 'wastePlan';
          _advSabText = `${mole.player} has a plan for ${mp.posAdj} advantage — and it's not a good one. ${mp.Sub} ${mp.sub === 'they' ? 'intend' : 'intends'} to use it at the worst possible moment. Maximum chaos, minimum strategy.`;
          if (!gs._moleAdvWaste) gs._moleAdvWaste = [];
          gs._moleAdvWaste.push(mole.player);
        }

        if (_advSabText) {
          mole.sabotageCount++;
          mole.sabotageLog.push({ ep: curEp, type: 'advantageSabotage', action: _advSabAction, advType: _adv.type });
          mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

          if (ep.campEvents[_moleTribe2]) {
            const evts = ep.campEvents[_moleTribe2].pre || (Array.isArray(ep.campEvents[_moleTribe2]) ? ep.campEvents[_moleTribe2] : []);
            evts.push({
              type: 'moleAdvSabotage', text: _advSabText,
              players: [mole.player], badgeText: 'MOLE'
            });
          }
          // Suspicion from advantage sabotage
          _tribeMembers2.forEach(w => {
            const suspGain = (pStats(w).intuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance);
            if (Math.random() < suspGain * 0.3) { // subtle
              if (!mole.suspicion[w]) mole.suspicion[w] = 0;
              mole.suspicion[w] += 0.3 + mole.sabotageCount * 0.02;
            }
          });
          _checkMoleExposure(mole, ep, _moleTribe2);
        }
      }
    }
  });

  // Clear per-episode Mole challenge throw tracking
  delete gs._moleChalThrows;
}

export function _checkMoleExposure(mole, ep, tribeName) {
  const curEp = (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  for (const [observer, susp] of Object.entries(mole.suspicion)) {
    if (susp < 3.0) continue;
    if (!gs.activePlayers.includes(observer)) continue;

    // EXPOSED!
    mole.exposed = true;
    mole.exposedEp = curEp;
    mole.exposedBy = observer;
    mole.resistance = 1.0;

    // Bond damage: -1.5 with everyone except closest ally
    const closestAlly = gs.activePlayers.filter(p => p !== mole.player)
      .sort((a, b) => getBond(mole.player, b) - getBond(mole.player, a))[0];
    gs.activePlayers.forEach(p => {
      if (p === mole.player || p === closestAlly) return;
      addBond(mole.player, p, -1.5);
    });

    // Heat spike stored for computeHeat
    if (!gs.moleExposedHeat) gs.moleExposedHeat = {};
    gs.moleExposedHeat[mole.player] = curEp;

    // Reveal advantages (mark as public knowledge)
    const _moleAdvs = (gs.advantages || []).filter(a => a.holder === mole.player);
    _moleAdvs.forEach(a => { a.knownBy = 'all'; });

    // Exposure camp event
    const op = pronouns(observer), mp = pronouns(mole.player);
    const _expTexts = [
      `${observer} has been watching. The patterns were too clear — the whispers, the convenient conflicts, the too-good-to-be-true alliance loyalty. ${op.Sub} ${op.sub === 'they' ? 'confront' : 'confronts'} ${mole.player} in front of the tribe. "You've been playing all of us."`,
      `It clicks for ${observer}. Every time something went wrong at camp, ${mole.player} was nearby. Every leaked plan, every fabricated quote — it all traces back. ${op.Sub} ${op.sub === 'they' ? 'don\'t' : 'doesn\'t'} wait for tribal. "We need to talk about ${mole.player}."`,
      `${observer} pulls the tribe together. "I've been keeping track. ${mole.player} has been sabotaging us from the inside." The evidence is damning. ${mole.player} has nowhere to hide.`,
    ];
    // Exposure rendered as dedicated VP screen — no camp event needed
    // Save exposure data to gs for episode history
    if (!gs._moleExposureEvents) gs._moleExposureEvents = [];
    gs._moleExposureEvents.push({ mole: mole.player, exposedBy: observer, ep: curEp, sabotageCount: mole.sabotageCount });

    // If coordinated, spike the other Mole's suspicion
    if (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2) {
      const otherMole = gs.moles.find(m => m.player !== mole.player);
      if (otherMole && !otherMole.exposed) {
        // +0.8 suspicion from all witnesses
        gs.activePlayers.forEach(p => {
          if (p === otherMole.player) return;
          if (!otherMole.suspicion[p]) otherMole.suspicion[p] = 0;
          otherMole.suspicion[p] += 0.8;
        });
      }
    }

    // ── DETECTIVE REWARDS — the player who exposed the Mole gets rewarded ──
    // Bond boost: tribe respects the detective
    gs.activePlayers.forEach(p => {
      if (p === mole.player || p === observer) return;
      addBond(observer, p, 0.5); // everyone trusts the person who figured it out
    });
    // Heat reduction: detective is seen as an ally, not a threat
    if (!gs.moleDetectiveHeatReduction) gs.moleDetectiveHeatReduction = {};
    gs.moleDetectiveHeatReduction[observer] = curEp; // tracked for computeHeat
    // Popularity boost
    if (gs.popularity) {
      gs.popularity[observer] = (gs.popularity[observer] || 0) + 6; // big fan moment
    }

    break; // only one exposure per check
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VOLUNTEER EXILE DUEL — bold player asks to be voted out to face rival
// ══════════════════════════════════════════════════════════════════════════════
export function checkVolunteerExileDuel(ep) {
  // Prerequisite: exile duel must be active AND someone on exile to duel
  if (!ep.exileDuelActive && !gs.exileDuelPlayer) return;
  if (!gs.exileDuelPlayer) return; // nobody on exile to duel
  const curEp = (gs.episode || 0) + 1;
  if (curEp < 3) return; // too early
  if (!gs._volunteerExileUsed) gs._volunteerExileUsed = new Set();

  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const exileRival = gs.exileDuelPlayer;

  // Check each active player for volunteer motivation
  gs.activePlayers.forEach(name => {
    if (gs._volunteerExileUsed.has(name)) return; // once per game
    if (ep.volunteerDuel) return; // one volunteer per episode
    if (name === ep.immunityWinner || (ep.extraImmune || []).includes(name)) return; // can't volunteer if immune
    const bond = getBond(name, exileRival);
    if (bond > -3) return; // needs genuine rivalry
    const s = pStats(name);
    const chance = s.boldness * 0.015 + (10 - s.temperament) * 0.01;
    if (Math.random() >= chance) return;

    // VOLUNTEER!
    gs._volunteerExileUsed.add(name);
    ep.volunteerDuel = { volunteer: name, rival: exileRival, granted: false, duelResult: null, heatBoost: 8.0, targetBoost: 5.0 };

    // Heat boost — they WANT to be targeted
    if (!gs._volunteerDuelHeat) gs._volunteerDuelHeat = {};
    gs._volunteerDuelHeat[name] = curEp;

    // Camp event
    const mp = pronouns(name);
    const campKey = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(name))?.name;
    if (campKey && ep.campEvents) {
      if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
      const _cd = ep.campEvents[campKey];
      const evts = (typeof _cd === 'object' && !Array.isArray(_cd)) ? (_cd.pre || []) : (Array.isArray(_cd) ? _cd : []);

      const _volTexts = s.temperament <= 4
        ? [
            `${name} stands up at camp. "Vote me out tonight. I want ${exileRival}." The tribe goes silent. ${mp.Sub} ${mp.sub === 'they' ? 'aren\'t' : 'isn\'t'} bluffing.`,
            `"Send me to exile." ${name} says it like ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} been thinking about it for days. ${mp.Sub} probably ${mp.sub === 'they' ? 'have' : 'has'}. "I want to look ${exileRival} in the eye and end this."`,
            `${name} loses it at camp. "I'm done waiting. Vote me out. Let me face ${exileRival}. I'll handle this myself." The tribe watches, stunned.`,
          ]
        : [
            `${name} makes the announcement calmly, but the fire behind it is obvious. "I'm volunteering. Send me to the duel. I want ${exileRival}."`,
            `"This is my choice," ${name} tells the tribe. "Vote me out tonight. I'll beat ${exileRival} and I'll come back stronger. Trust me."`,
            `${name} pulls the tribe together. "I know this sounds crazy. But I need to face ${exileRival}. It's personal. Send me."`,
          ];

      evts.push({
        type: 'volunteerExileDuel', text: _pick(_volTexts),
        players: [name, exileRival], badgeText: 'VOLUNTEER DUEL'
      });
    }
  });
}

export function checkSocialPolitics(ep) {
  if (!ep.campEvents) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  if (!gs.sideDeals) gs.sideDeals = [];
  if (!gs.loyaltyTests) gs.loyaltyTests = [];
  if (!ep._politicsLog) ep._politicsLog = [];

  // ── TEMPERAMENT RECOVERY: high-social players apologize after blowups ──
  const prevEp = gs.episodeHistory?.find(e => e.num === curEp - 1);
  if (prevEp && gs._blowupPlayers?.length) {
    gs._blowupPlayers.forEach(name => {
      if (!gs.activePlayers.includes(name)) return;
      const s = pStats(name);
      // Recovery chance: social determines damage control ability
      const recoveryChance = s.social * 0.07 + s.loyalty * 0.02;
      if (Math.random() >= recoveryChance) {
        // No recovery — the damage stands. Low social players can't fix it.
        return;
      }
      const pr = pronouns(name);
      // Find the most damaged relationship from the blowup
      const tribeMembers = gs.isMerged ? gs.activePlayers : (gs.tribes.find(t => t.members.includes(name))?.members || []);
      const damaged = tribeMembers.filter(m => m !== name && getBond(name, m) < 0)
        .sort((a, b) => getBond(name, a) - getBond(name, b));
      if (!damaged.length) return;
      // Recover bond with 1-2 most damaged relationships
      const toRecover = damaged.slice(0, Math.min(2, damaged.length));
      const recoveryAmount = s.social * 0.06; // social 10 = +0.6, social 5 = +0.3
      toRecover.forEach(target => addBond(name, target, recoveryAmount));
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(name))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        const target = toRecover[0];
        ep.campEvents[campKey].pre.push({
          type: 'apology', players: [name, target],
          text: _pick([
            `${name} finds ${target} before anyone else is up. The conversation is short. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} make excuses. ${target} listens. Something shifts.`,
            `${name} pulls ${target} aside. "About yesterday — I'm sorry." ${target} doesn't respond immediately. But the wall comes down a little.`,
            `${name} doesn't bring it up directly. ${pr.Sub} just show${pr.sub==='they'?'':'s'} up differently today — quieter, more helpful, present. ${target} notices the effort.`,
            `${name} and ${target} sit by the fire in silence for a while. Eventually ${name} says something honest. It's not a speech — it's a sentence. It's enough.`,
          ]),
          badgeText: 'MAKING AMENDS', badgeClass: 'green'
        });
      }
      ep._politicsLog.push(`RECOVERY: ${name} apologized to ${toRecover.join(', ')} (+${recoveryAmount.toFixed(1)} bond)`);
    });
    delete gs._blowupPlayers;
  }

  const groups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));

  let budget = 3 + Math.floor(Math.random() * 3); // 3-5 actions

  groups.forEach(group => {
    const members = group.members;
    if (members.length < 3) return;
    const campKey = group.name;
    const pre = ep.campEvents[campKey]?.pre;
    if (!pre) return;

    // ── SIDE DEALS ──
    if (budget > 0) {
      members.forEach(initiator => {
        if (budget <= 0) return;
        const s = pStats(initiator);
        const dealChance = s.strategic * 0.06 + s.social * 0.02;
        if (Math.random() >= dealChance * 0.15) return; // scale down so not everyone deals every ep
        // Already has 3 deals? Can't make more
        const existingDeals = gs.sideDeals.filter(d => d.active && d.players.includes(initiator));
        if (existingDeals.length >= 3) return;
        // Pick best partner: highest bond, not already in a deal with initiator
        const candidates = members.filter(m => m !== initiator
          && !gs.sideDeals.some(d => d.active && d.players.includes(initiator) && d.players.includes(m)));
        if (!candidates.length) return;
        const partner = wRandom(candidates, p => Math.max(0.1, getBond(initiator, p) * 0.3 + pStats(p).social * 0.05));
        const bond = getBond(initiator, partner);
        // Acceptance check
        const partnerDeals = gs.sideDeals.filter(d => d.active && d.players.includes(partner)).length;
        const acceptChance = bond * 0.08 + pStats(partner).social * 0.03 + (10 - partnerDeals * 3) * 0.05;
        if (Math.random() >= acceptChance) return;
        // Deal forms
        // Genuine check: loyalty makes you honest, strong bond makes it real,
        // multiple deals make each one less genuine, low loyalty makes you a liar
        const _genuineChance = s.loyalty * 0.09 + getBond(initiator, partner) * 0.06
          - (10 - s.loyalty) * 0.02 - existingDeals.length * 0.2;
        const genuine = Math.random() < Math.max(0.15, Math.min(0.95, _genuineChance));
        const dealType = members.length <= 5 ? 'f2' : (Math.random() < 0.3 ? 'f3' : 'f2');
        gs.sideDeals.push({
          players: [initiator, partner], initiator, madeEp: curEp,
          type: dealType, active: true, genuine
        });
        addBond(initiator, partner, 1.0);
        // Non-genuine: create perceived bond gap on partner
        if (!genuine) {
          addPerceivedBond(partner, initiator, getBond(partner, initiator) + 1.5, 'side-deal-fake');
        }
        const pr = pronouns(initiator);
        const pPr = pronouns(partner);
        pre.push({
          type: 'sideDeal', players: [initiator, partner],
          text: _pick([
            `${initiator} pulled ${partner} aside after dark. "Final ${dealType === 'f2' ? 'two' : 'three'}." The conversation lasted ten minutes. When they came back, something had changed.`,
            `${initiator} and ${partner} made a final ${dealType === 'f2' ? 'two' : 'three'} deal. Whether it means anything is a question for later.`,
            `${initiator} looked ${partner} in the eye: "Final ${dealType === 'f2' ? 'two' : 'three'}. You and me." ${partner} didn't hesitate.`,
            `${initiator} and ${partner} shook on a final ${dealType === 'f2' ? 'two' : 'three'} deal. Not in front of anyone. That's the point.`,
          ]),
          badgeText: 'SIDE DEAL', badgeClass: 'gold'
        });
        ep._politicsLog.push(`DEAL: ${initiator} + ${partner} (${dealType}, genuine=${genuine})`);
        budget--;
      });
    }

    // ── INFO TRADES ──
    if (budget > 0) {
      members.forEach(trader => {
        if (budget <= 0) return;
        const s = pStats(trader);
        const tradeChance = s.intuition * 0.04 + s.strategic * 0.03;
        if (Math.random() >= tradeChance * 0.12) return;
        // Must have knowledge to trade
        const _knownIdols = [...(gs.knownIdolHoldersPersistent || [])].filter(h => h !== trader);
        const _inAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(trader));
        const _knownAdvs = (gs.advantages || []).filter(a => a.holder !== trader &&
          (gs.knownVoteStealHolders?.has(a.holder) || gs.knownVoteBlockHolders?.has(a.holder) || gs.knownSoleVoteHolders?.has(a.holder)));
        if (!_knownIdols.length && !_inAlliance && !_knownAdvs.length) return;
        // Pick trade partner
        const targets = members.filter(m => m !== trader);
        if (!targets.length) return;
        const target = wRandom(targets, p => Math.max(0.1, getBond(trader, p) * 0.06 + (10 - threatScore(p)) * 0.02));
        // False info chance — only deceptive/villainous players plant lies
        const _traderArch = players.find(p => p.name === trader)?.archetype || '';
        const _isDeceptive = _traderArch === 'villain' || _traderArch === 'schemer' || _traderArch === 'mastermind';
        const _falseChance = _isDeceptive
          ? (10 - s.loyalty) * 0.08 + 0.10  // villains/schemers: high base + loyalty scales
          : s.loyalty >= 7 ? 0              // loyal/hero types: never plant false info
          : (10 - s.loyalty) * 0.03;         // average players: very rare, only if low loyalty
        const isFalse = Math.random() < _falseChance;
        // What to trade
        let infoType, infoDetail;
        if (_knownIdols.length && Math.random() < 0.5) {
          infoType = 'idol-holder';
          infoDetail = isFalse ? members.filter(m => !_knownIdols.includes(m) && m !== trader && m !== target)[0] || _knownIdols[0] : _knownIdols[0];
        } else if (_inAlliance && Math.random() < 0.5) {
          infoType = 'alliance-target';
          infoDetail = _inAlliance.name;
        } else {
          infoType = 'general-intel';
          infoDetail = null;
        }
        addBond(trader, target, 0.5);
        addBond(target, trader, 0.5);
        if (isFalse && infoType === 'idol-holder') {
          // Target now "knows" the wrong idol holder
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(infoDetail);
          // Create perceived bond gap — target trusts liar
          addPerceivedBond(target, trader, getBond(target, trader) + 1.0, 'false-info-trade');
          // Track for blowup detection
          if (!gs._falseInfoPlanted) gs._falseInfoPlanted = [];
          gs._falseInfoPlanted.push({ liar: trader, victim: target, fakeHolder: infoDetail, plantedEp: curEp });
        } else if (!isFalse && infoType === 'idol-holder') {
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(infoDetail);
        }
        const tPr = pronouns(trader);
        const rPr = pronouns(target);
        pre.push({
          type: 'infoTrade', players: [trader, target],
          text: _pick([
            `${trader} sat down next to ${target} and said: "I'm going to tell you something. And then you're going to owe me." ${target} listened.`,
            `${trader} traded information for trust. Whether the information was real is another question.`,
            `A quiet exchange at the water well. ${trader} knows something ${target} didn't. Now ${target} knows too — or thinks ${rPr.sub} ${rPr.sub==='they'?'do':'does'}.`,
            `${trader} whispered something to ${target} before the challenge. ${target}'s expression changed. The game just shifted for both of them.`,
          ]),
          badgeText: isFalse ? null : 'INFO TRADE', badgeClass: 'gold'
        });
        ep._politicsLog.push(`TRADE: ${trader} → ${target} (${infoType}, false=${isFalse})`);
        budget--;
      });
    }

    // ── LOYALTY TESTS ──
    if (budget > 0) {
      members.forEach(tester => {
        if (budget <= 0) return;
        const s = pStats(tester);
        const testChance = s.strategic * 0.05 + (10 - s.loyalty) * 0.03;
        if (Math.random() >= testChance * 0.08) return;
        // Don't test if already running a test
        if (gs.loyaltyTests.some(t => t.tester === tester && !t.resolved)) return;
        // Pick target: someone you're unsure about
        const targets = members.filter(m => m !== tester);
        if (!targets.length) return;
        const target = wRandom(targets, p => Math.max(0.1, (10 - getBond(tester, p)) * 0.05 + pStats(tester).strategic * 0.03));
        // Counter-detection: target might realize they're being tested
        if (Math.random() < pStats(target).intuition * 0.05) {
          addBond(target, tester, -1.0);
          pre.push({
            type: 'loyaltyTestCaught', players: [target, tester],
            text: _pick([
              `${target} figured out what ${tester} was doing. The "information" was too convenient, too specific. ${target} said nothing — but the trust is damaged.`,
              `${tester} tried to test ${target}. ${target} saw through it. That's worse than failing the test.`,
            ]),
            badgeText: 'TEST CAUGHT', badgeClass: 'red'
          });
          ep._politicsLog.push(`TEST CAUGHT: ${tester} tried to test ${target}, caught`);
          budget--;
          return;
        }
        // Plant the test
        const fakeTarget = members.filter(m => m !== tester && m !== target)[Math.floor(Math.random() * (members.length - 2))] || members[0];
        gs.loyaltyTests.push({
          tester, target, falseInfo: `voting for ${fakeTarget}`,
          plantedEp: curEp, resolved: false
        });
        const tPr = pronouns(tester);
        pre.push({
          type: 'loyaltyTest', players: [tester, target],
          text: _pick([
            `${tester} told ${target} something very specific. Something that isn't true. Now ${tester} waits.`,
            `A test disguised as a conversation. ${tester} planted a seed with ${target}. If it grows somewhere it shouldn't, ${tester} will know who to cut.`,
            `${tester} leaned in close to ${target}: "I heard something about the vote." What ${tester} said was a lie. The question is whether ${target} keeps it.`,
          ]),
          badgeText: 'LOYALTY TEST', badgeClass: 'gold'
        });
        ep._politicsLog.push(`TEST: ${tester} → ${target} (planted false info about ${fakeTarget})`);
        budget--;
      });
    }
  });

  // ── LOYALTY TEST RESOLUTION: check pending tests ──
  gs.loyaltyTests.filter(t => !t.resolved).forEach(test => {
    const epsSincePlant = curEp - test.plantedEp;
    if (epsSincePlant < 1) return; // give it at least 1 episode
    if (!gs.activePlayers.includes(test.tester) || !gs.activePlayers.includes(test.target)) {
      test.resolved = true; return;
    }
    const targetS = pStats(test.target);
    const spreadChance = (10 - targetS.loyalty) * 0.06 + targetS.social * 0.02;
    const spread = Math.random() < spreadChance;
    if (spread) {
      test.resolved = true;
      addBond(test.tester, test.target, -1.5);
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(test.tester))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        ep.campEvents[campKey].pre.push({
          type: 'loyaltyTestFailed', players: [test.tester, test.target],
          text: _pick([
            `${test.tester} planted a seed. It grew. Now ${test.tester} knows exactly who can't keep their mouth shut.`,
            `The false information came back. ${test.tester} heard it from someone else — which means ${test.target} talked. Trust revoked.`,
          ]),
          badgeText: 'FAILED TEST', badgeClass: 'red'
        });
      }
      ep._politicsLog.push(`TEST FAILED: ${test.target} leaked (planted ep ${test.plantedEp})`);
    } else if (epsSincePlant >= 2) {
      test.resolved = true;
      addBond(test.tester, test.target, 0.8);
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(test.tester))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        ep.campEvents[campKey].pre.push({
          type: 'loyaltyTestPassed', players: [test.tester, test.target],
          text: _pick([
            `${test.tester} told ${test.target} something nobody else knows. ${test.target} kept it quiet. That means something.`,
            `Two episodes. Not a word. ${test.target} passed a test they didn't know they were taking.`,
          ]),
          badgeText: 'TRUST EARNED', badgeClass: 'green'
        });
      }
      ep._politicsLog.push(`TEST PASSED: ${test.target} kept quiet (planted ep ${test.plantedEp})`);
    }
  });
}

// ── Side Deal Breaks: detect when someone votes against their deal partner ──
export function checkSideDealBreaks(ep) {
  if (!gs.sideDeals?.length || !ep.votingLog?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;

  ep.votingLog.forEach(v => {
    if (!v.voter || v.voter === 'THE GAME' || !v.voted) return;
    gs.sideDeals.filter(d => d.active && d.players.includes(v.voter)).forEach(deal => {
      const partner = deal.players.find(p => p !== v.voter);
      if (v.voted !== partner) return; // didn't vote against partner
      // Deal broken
      deal.active = false;
      addBond(partner, v.voter, -2.0);
      // Emotional state shift
      if (gs.playerStates?.[partner]) {
        const _pBond = getBond(partner, v.voter);
        gs.playerStates[partner].emotional = _pBond <= -2 ? 'desperate' : 'paranoid';
      }
      // Camp event next episode (saved on gs for pickup)
      if (!gs._brokenDeals) gs._brokenDeals = [];
      gs._brokenDeals.push({ breaker: v.voter, partner, deal, ep: curEp });
    });
  });
}

// ── Conflicting Deal Detection: multiple F2 deals get discovered ──
export function checkConflictingDeals(ep) {
  if (!gs.sideDeals?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;

  // Find players with 2+ active deals
  const dealCounts = {};
  gs.sideDeals.filter(d => d.active).forEach(d => {
    d.players.forEach(p => { dealCounts[p] = (dealCounts[p] || 0) + 1; });
  });

  Object.entries(dealCounts).forEach(([player, count]) => {
    if (count < 2) return;
    if (!gs.activePlayers.includes(player)) return;
    // Each partner rolls intuition to discover the double-dealing
    const deals = gs.sideDeals.filter(d => d.active && d.players.includes(player));
    deals.forEach(deal => {
      const partner = deal.players.find(p => p !== player);
      if (!gs.activePlayers.includes(partner)) return;
      const discoverChance = pStats(partner).intuition * 0.03;
      if (Math.random() >= discoverChance) return;
      // Discovered!
      addBond(partner, player, -2.5);
      deal.active = false;
      const pr = pronouns(player);
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        const otherPartners = deals.filter(d => d !== deal && d.active).map(d => d.players.find(p => p !== player)).filter(Boolean);
        ep.campEvents[campKey].pre.push({
          type: 'conflictingDeals', players: [partner, player, ...(otherPartners.slice(0, 1))],
          text: _pick([
            `${partner} found out. ${player} promised final two to ${partner} — and to ${otherPartners[0] || 'someone else'}. The math doesn't work. ${partner} knows it now.`,
            `${player} has been making deals. Too many deals. ${partner} just figured that out the hard way.`,
            `"How many final twos do you have?" ${partner} asked it quietly. ${player} didn't answer. That was the answer.`,
          ]),
          badgeText: 'DOUBLE DEALER', badgeClass: 'red'
        });
      }
    });
  });
}

// ── False Info Blowup: when planted lies get exposed ──
export function checkFalseInfoBlowup(ep) {
  if (!gs._falseInfoPlanted?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  // Check each false info plant — was the "idol holder" voted for but didn't play an idol?
  for (let i = gs._falseInfoPlanted.length - 1; i >= 0; i--) {
    const plant = gs._falseInfoPlanted[i];
    if (!gs.activePlayers.includes(plant.victim)) { gs._falseInfoPlanted.splice(i, 1); continue; }
    if (!gs.activePlayers.includes(plant.liar)) { gs._falseInfoPlanted.splice(i, 1); continue; }
    // High-mental victims may catch the lie before acting on it — mental * 0.03 chance to avoid the trap
    const _victimMental = pStats(plant.victim).mental;
    if (Math.random() < _victimMental * 0.03) { gs._falseInfoPlanted.splice(i, 1); continue; } // saw through it
    // Did the victim vote for the fake idol holder this episode?
    const _victimVote = ep.votingLog?.find(v => v.voter === plant.victim);
    if (!_victimVote || _victimVote.voted !== plant.fakeHolder) continue;
    // Did the fake holder NOT play an idol?
    const _holderPlayedIdol = ep.idolPlays?.some(p => p.player === plant.fakeHolder);
    if (_holderPlayedIdol) continue; // they actually had one — the info was accidentally right
    // BLOWUP — the lie is exposed
    const pr = pronouns(plant.liar);
    const vPr = pronouns(plant.victim);
    // Bond damage: victim → liar
    addBond(plant.victim, plant.liar, -3.0);
    // Tribe-wide credibility hit: everyone at tribal loses trust in the liar
    const _tribal = ep.tribalPlayers || gs.activePlayers;
    _tribal.filter(p => p !== plant.liar && p !== plant.victim).forEach(p => {
      addBond(p, plant.liar, -0.5);
    });
    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (ep.loser?.name || gs.tribes[0]?.name || 'merge');
    if (ep.campEvents?.[campKey]?.post) {
      ep.campEvents[campKey].post.push({
        type: 'falseInfoBlowup', players: [plant.victim, plant.liar],
        text: _pick([
          `${plant.victim} voted ${plant.fakeHolder} to flush an idol that didn't exist. The info came from ${plant.liar}. ${plant.victim} hasn't said a word to ${plant.liar} since.`,
          `The lie traced back. ${plant.liar} told ${plant.victim} that ${plant.fakeHolder} had an idol. ${plant.fakeHolder} didn't. ${plant.victim} wasted ${vPr.pos} vote. The trust is gone.`,
          `${plant.victim} figured it out. ${plant.liar} planted false information. The idol was never real. The alliance might not be either.`,
        ]),
        badgeText: 'LIE EXPOSED', badgeClass: 'red'
      });
    }
    // Remove the plant — it's resolved
    gs._falseInfoPlanted.splice(i, 1);
    // Perceived bond correction
    const pbKey = plant.victim + '→' + plant.liar;
    if (gs.perceivedBonds?.[pbKey]) delete gs.perceivedBonds[pbKey];
  }
}

export function checkComfortBlindspot(ep) {
  if (!ep.campEvents) return;
  const groups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: gs.activePlayers }]
    : gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));

  groups.forEach(group => {
    const campKey = gs.isMerged ? 'merge' : group.name;
    if (!ep.campEvents[campKey]) return;

    // Candidates: comfortable players with low boldness + strategic
    const candidates = group.members.filter(p => {
      const state = getPlayerState(p);
      const s = pStats(p);
      return state.emotional === 'comfortable' && s.boldness < 6 && s.strategic < 6;
    });
    if (!candidates.length) return;

    // Heat proxy: low avg-bond from tribe + known blowup heat = more in danger than they realise
    const heatProxy = p => {
      const others = group.members.filter(m => m !== p);
      const avgBond = others.length
        ? others.reduce((sum, m) => sum + getBond(m, p), 0) / others.length
        : 0;
      return threatScore(p) * 0.3 - avgBond * 0.5 + (gs.blowupHeatNextEp?.has(p) ? 1 : 0);
    };
    const heatLeader = candidates.reduce((best, p) => heatProxy(p) > heatProxy(best) ? p : best, candidates[0]);

    // ~25% chance per episode
    if (Math.random() >= 0.25) return;

    // Observer: intuitive tribemate who notices the checked-out player
    const observers = group.members.filter(p => p !== heatLeader && pStats(p).intuition >= 6);
    if (!observers.length) return;
    const observer = observers[Math.floor(Math.random() * observers.length)];

    const _p  = pronouns(heatLeader);
    const _o  = pronouns(observer);
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const os3 = _o.sub !== 'they';

    const cbText = _rp([
      `${observer} watch${os3 ? 'es' : ''} ${heatLeader} move through camp — easy, unhurried, like there's nothing to worry about. ${_o.Sub} file${os3 ? 's' : ''} that away.`,
      `${heatLeader} seems settled. Too settled. ${observer} clock${os3 ? 's' : ''} it and doesn't say anything.`,
      `${observer} notice${os3 ? 's' : ''} that ${heatLeader} hasn't asked about the vote in days. ${_o.Sub} wonder${os3 ? 's' : ''} if ${_p.sub} even know${_p.sub==='they'?'':'s'} what's coming.`,
      `There's a stillness about ${heatLeader} at camp today. ${observer} has a read on it but isn't sure what to do with it yet.`,
    ]);
    const reText = _rp([
      `${observer} check${os3 ? 's' : ''} in on ${heatLeader} — casual, nothing to flag. But ${_o.sub === 'they' ? "they're" : _o.sub === 'he' ? "he's" : "she's"} paying attention in a way ${heatLeader} isn't.`,
      `${observer} mention${os3 ? 's' : ''} ${heatLeader}'s name quietly to one other person. Just to float it. Just to see.`,
    ]);

    ep.campEvents[campKey].pre.push(
      { type: 'comfortBlindspot', text: cbText, players: [heatLeader, observer] },
      { type: 'clockingIt',       text: reText, players: [observer] }
    );
    ep.comfortBlindspotPlayer = heatLeader;
  });
}

export function generateCampEvents(ep, phase = 'both') {
  // Clear per-episode camp event heat flags
  gs.injuredThisEp    = new Set();
  gs.scramblingThisEp = new Set();
  gs.beastDrillsThisEp = new Set();
  gs.lieTargetsThisEp  = new Set();
  delete gs._scrambleActivations;

  const idolFinds = ep.idolFinds || [];
  const allTwists = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);

  // ── Build twist-driven event weight boosts ──
  const boosts = {};
  const boost = (id, amount) => { boosts[id] = (boosts[id] || 0) + amount; };

  allTwists.forEach(tw => {
    if (!tw?.type) return;
    switch (tw.type) {
      case 'tribe-swap':
      case 'tribe-dissolve':
      case 'tribe-expansion':
      case 'abduction':
      case 'kidnapping':
        // New faces, new pecking order — bonding + power struggle
        boost('tdBond', 30); boost('bond', 20);
        boost('leadershipClash', 25); boost('dispute', 15);
        boost('eavesdrop', 15); boost('doubt', 15);
        boost('idolSearch', 15); // new camps = new idol locations
        break;
      case 'mutiny':
        // Someone left — those who stayed are rattled
        boost('fight', 25); boost('dispute', 20);
        boost('leadershipClash', 20); boost('confessional', 15);
        boost('rumor', 15);
        break;
      case 'journey':
        // Players came back changed — strategy shifts, others paranoid
        boost('tdStrategy', 25); boost('doubt', 20);
        boost('confessional', 20); boost('eavesdrop', 15);
        boost('rumor', 15); // those who didn't go want to know what happened
        break;
      case 'exile-island':
        // Exiled player missed everything — isolation and paranoia on return
        boost('doubt', 25); boost('confessional', 20);
        boost('rumor', 20); boost('eavesdrop', 15);
        break;
      case 'loved-ones':
        // Emotional episode — homesick guaranteed, comfort and bonding up
        boost('homesick', 80); boost('comfort', 40);
        boost('tdBond', 30); boost('confessional', 25);
        boost('doubt', 15); // seeing family can crack your resolve
        break;
      case 'the-feast':
      case 'merge-reward':
        // Shared food, cross-tribe bonding — alliances form across lines
        boost('tdBond', 35); boost('bond', 25);
        boost('flirtation', 20); boost('tdStrategy', 20);
        boost('foodConflict', -20); // plenty to eat — no scarcity conflict
        break;
      case 'reward-challenge':
        // Winners bond on reward; those left behind stew
        boost('tdBond', 20); boost('dispute', 15);
        boost('rumor', 10); boost('doubt', 10);
        break;
      case 'double-elim':
      case 'double-tribal':
        // Chaos — everyone is stressed, paranoia is high
        boost('doubt', 30); boost('confessional', 25);
        boost('comfort', 20); boost('tdStrategy', 20);
        boost('fight', 15);
        break;
      case 'returning-player': {
        // Disruption — existing alliances rattled, scheming to handle returners
        const _rpCount = tw.returnees?.length || 1;
        boost('tdStrategy', 30 * _rpCount); boost('dispute', 25 * _rpCount);
        boost('eavesdrop', 20 * _rpCount); boost('leadershipClash', 15 * _rpCount);
        boost('rumor', 15 * _rpCount);
        break;
      }
      case 'cultural-reset':
        // Everything is exposed — alliances public, people scrambling
        boost('dispute', 30); boost('leadershipClash', 25);
        boost('tdStrategy', 25); boost('fight', 20);
        boost('doubt', 20); boost('confessional', 20);
        break;
      case 'slasher-night':
        // Someone was eliminated in the night — camp is shaken
        boost('doubt', 35); boost('confessional', 30);
        boost('rumor', 25); boost('homesick', 15);
        boost('weirdMoment', 15); // paranoia makes people act strange
        break;
      case 'triple-dog-dare':
        // Dare challenge aftermath — drama, doubt, strategic talk
        boost('doubt', 30); boost('confessional', 30);
        boost('strategicTalk', 25); boost('rumor', 20);
        break;
      case 'say-uncle':
        boost('doubt', 25); boost('confessional', 30);
        boost('strategicTalk', 20); boost('fight', 15);
        break;
      case 'brunch-of-disgustingness':
        // Social chaos — gender split + eating stress + blame game
        boost('dispute', 30); boost('tdStrategy', 25);
        boost('confessional', 25); boost('fight', 20);
        boost('doubt', 15); boost('rumor', 15);
        break;
      case 'phobia-factor':
        boost('confessional', 35); boost('vulnerability', 25);
        boost('bond', 20); boost('doubt', 15);
        break;
      case 'auction':
        // After an auction — well-fed players are social; strategic players are thinking about advantages
        boost('tdBond', 20); boost('comfort', 25); boost('flirtation', 15);
        boost('tdStrategy', 20); boost('confessional', 15);
        boost('fight', -10); // less tension — people got what they needed
        break;
      case 'elimination-swap':
        // Chaos — alliances scrambled, strangers arriving at camp
        boost('doubt', 30); boost('tdStrategy', 25); boost('dispute', 20);
        boost('eavesdrop', 20); boost('scramble', 25); boost('rumor', 15);
        break;
      case 'exile-duel':
        // Someone just escaped elimination — survivors relieved, but watching
        boost('confessional', 20); boost('comfort', 15); boost('doubt', 20);
        boost('tdStrategy', 15); boost('rumor', 15);
        break;
      case 'no-tribal':
        // Relaxed episode — more flavor, less strategy stress
        boost('tdBond', 25); boost('flirtation', 20);
        boost('prank', 20); boost('weirdMoment', 20);
        boost('confessional', 15);
        boost('fight', -15); boost('dispute', -10); // lower tension
        break;
      case 'rock-draw':
        // Rock draw means chaos next tribal — paranoia up in advance
        boost('doubt', 25); boost('confessional', 20);
        boost('rumor', 15);
        break;
    }
  });

  // ── Rock draw AFTERMATH (previous episode was a rock draw) ──
  const prevEp = gs.episodeHistory.find(e => e.num === ep.num - 1);
  if (prevEp?.isRockDraw) {
    boost('doubt', 25); boost('confessional', 20);
    boost('homesick', 15); boost('comfort', 15);
    boost('weirdMoment', 10); // people are still processing the chaos
  }

  // (Post-save aftermath injected after pre events are generated — see below)
  // ── Emotional state boosts — driven by current player mental states ──
  if (gs.playerStates) {
    const paranoidN    = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'paranoid').length;
    const desperateN   = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'desperate').length;
    const uneasyN      = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'uneasy').length;
    const calculatingN = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'calculating').length;
    const comfortableN = gs.activePlayers.filter(p => ['comfortable', 'content'].includes(getPlayerState(p).emotional)).length;
    if (paranoidN >= 2) { boost('paranoia', paranoidN * 7); boost('scramble', paranoidN * 5); boost('watchingYou', paranoidN * 5); boost('readingRoom', paranoidN * 4); }
    if (desperateN >= 1) { boost('scramble', desperateN * 10); boost('sideDeal', desperateN * 8); boost('bigMoveThoughts', desperateN * 7); boost('paranoia', desperateN * 5); }
    if (uneasyN >= 2) { boost('paranoia', uneasyN * 4); boost('scramble', uneasyN * 3); boost('watchingYou', uneasyN * 3); }
    if (calculatingN >= 1) { boost('bigMoveThoughts', calculatingN * 8); boost('sideDeal', calculatingN * 6); boost('allianceCrack', calculatingN * 4); }
    if (comfortableN >= 3) boost('overconfidence', comfortableN * 5);
  }
  if (gs.namedAlliances?.some(a => a.active && (ep.num - a.formed) >= 5)) { boost('allianceCrack', 12); boost('sideDeal', 8); }
  if (gs.isMerged && gs.activePlayers.length <= 8) { boost('bigMoveThoughts', 15); boost('allianceCrack', 12); boost('sideDeal', 10); }
  // Boost alliance formation when alliances are thin post-merge
  if (gs.isMerged) {
    const _activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
    const _unallied = gs.activePlayers.filter(p => !_activeAlliances.some(a => a.members.includes(p)));
    if (_activeAlliances.length <= 2) boost('allianceForm', 20); // few alliances left — new ones should form
    if (_unallied.length >= 2) boost('allianceForm', _unallied.length * 5); // free agents need alliances
  }

  // ── Per-group event count: total split across pre and post ──
  const getGroupPresent = (tribe) => gs.exiledThisEp ? tribe.members.filter(m => m !== gs.exiledThisEp) : tribe.members;
  const totalForGroup = (present) => Math.floor(Math.random() * 5) + Math.max(8, Math.floor(present.length * 1.4));

  // ── PRE-CHALLENGE phase: initialize structure, fill pre events ──
  if (phase === 'pre' || phase === 'both') {
    if (gs.phase === 'pre-merge' && gs.tribes.length > 0) {
      if (!ep.campEvents) ep.campEvents = {};
      gs.tribes.forEach(tribe => {
        const present = getGroupPresent(tribe);
        const total = totalForGroup(present);
        const preCount = phase === 'both' ? total : Math.ceil(total / 2);
        // Merge tribe-specific gift boosts (from Three Gifts Gift 1) into the base boosts
        const tribeBoosts = ep.giftTribeBoosts?.[tribe.name]
          ? (() => { const tb = { ...boosts }; Object.entries(ep.giftTribeBoosts[tribe.name]).forEach(([k,v]) => { tb[k] = (tb[k]||0) + v; }); return tb; })()
          : boosts;
        const preEvents = generateCampEventsForGroup(present, idolFinds, tribeBoosts, preCount);
        // Prepend gift return narrative as the first camp event for this tribe
        if (ep.giftNarrativeEvents?.[tribe.name]) preEvents.unshift(ep.giftNarrativeEvents[tribe.name]);
        if (ep.twistNarrativeEvents?.[tribe.name]) preEvents.unshift(ep.twistNarrativeEvents[tribe.name]);
        const _existingPre = ep.campEvents[tribe.name]?.pre || [];
        const _existingPost = ep.campEvents[tribe.name]?.post || [];
        ep.campEvents[tribe.name] = { pre: [..._existingPre, ...preEvents], post: [..._existingPost] };

        // ── PRE-MERGE SPECIFIC EVENTS: drama unique to small tribal camps ──
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        const pre = preEvents;

        // Challenge pressure: if this tribe lost last episode, anxiety builds
        const _prevLoss = gs.episodeHistory?.find(h => h.num === ep.num - 1);
        if (_prevLoss?.tribalTribe === tribe.name && Math.random() < 0.50) {
          const _cpSpeaker = present[Math.floor(Math.random() * present.length)];
          const _cpP = pronouns(_cpSpeaker);
          pre.push({ type: 'strategicTalk', players: present, text: _rp([
            `The mood at ${tribe.name} is heavy. They lost last time and everyone knows what another loss means. ${_cpSpeaker} says it out loud: "We can't afford to go back there."`,
            `${_cpSpeaker} addresses the tribe. "We lose again, one of us goes home. That's the reality." Nobody argues. Nobody has to.`,
            `${tribe.name} is on edge. The last vote is still fresh. ${_cpSpeaker} tries to rally the group: "We need this one. No excuses." The tribe nods. Whether they believe it is another question.`,
            `The shelter is quiet this morning. Last tribal took something out of ${tribe.name}. ${_cpSpeaker} breaks the silence: "We're not going back. Not tonight."`,
          ]) });
        }

        // Cross-tribe rivalry speculation
        if (gs.tribes.length >= 2 && Math.random() < 0.25) {
          const _otherTribe = gs.tribes.filter(t => t.name !== tribe.name)[Math.floor(Math.random() * (gs.tribes.length - 1))];
          const _speculator = present[Math.floor(Math.random() * present.length)];
          if (_otherTribe) {
            pre.push({ type: 'strategicTalk', players: [_speculator], text: _rp([
              `${_speculator} wonders aloud what's happening at ${_otherTribe.name} camp. "You think they're falling apart over there?" The tribe laughs. But they're all thinking the same thing.`,
              `${_speculator} brings up ${_otherTribe.name} at the fire. "They looked off at the challenge. Something's going on over there." The speculation fuels the tribe's confidence.`,
              `"I bet ${_otherTribe.name} is a mess right now." ${_speculator} says it with a grin. Nobody disagrees. Whether it's true or not, believing it helps.`,
              `The tribe talks about ${_otherTribe.name} more than their own game tonight. ${_speculator} starts it: "Did you see their faces?" It becomes the camp's favorite topic.`,
            ]) });
          }
        }

        // Underdog rally: small tribe or tribe that's been losing rallies together
        if (present.length <= 4 && Math.random() < 0.35) {
          const _rallier = present.reduce((best, p) => pStats(p).social + pStats(p).loyalty > pStats(best).social + pStats(best).loyalty ? p : best, present[0]);
          const _raP = pronouns(_rallier);
          pre.push({ type: 'bond', players: present, text: _rp([
            `${_rallier} gathers the tribe. "We're small. That means every single person here matters. We go out there and we fight." It's not a speech — it's a promise.`,
            `${tribe.name} is outnumbered and they know it. ${_rallier} turns that into fuel. "They think we're done. Let's make them wrong." The energy shifts.`,
            `${_rallier} sits the tribe down. "I know the numbers aren't great. But look around — everyone here is still fighting. That counts for something." It does.`,
            `The fire is low and the tribe is smaller than ever. ${_rallier} keeps it burning. Not the fire — the belief that they can still do this.`,
          ]) });
          present.forEach(p => { if (p !== _rallier) addBond(p, _rallier, 0.3); });
        }

        // New arrival / tribe reshuffle events
        const _swapTw = (ep.twists || []).find(t => ['tribe-swap','tribe-dissolve','abduction','mutiny','kidnapping'].includes(t.type));
        if (_swapTw) {
          const _prevTribes = gs.episodeHistory?.find(h => h.num === ep.num - 1)?.gsSnapshot?.tribes || [];
          const _prevMembers = _prevTribes.find(t => t.name === tribe.name)?.members || [];
          const _newArrivals = present.filter(p => !_prevMembers.includes(p));
          const _originals = present.filter(p => _prevMembers.includes(p));
          const _isFullReshuffle = _newArrivals.length >= present.length * 0.5; // half or more are new = full swap

          if (_isFullReshuffle && _newArrivals.length >= 2) {
            // Full tribe swap: everyone cautious — small universal bond penalty
            present.forEach(a => present.forEach(b => {
              if (a < b && !_prevMembers.includes(a) !== !_prevMembers.includes(b)) addBond(a, b, -0.3);
            }));
            if (Math.random() < 0.60) {
              pre.push({ type: 'strategicTalk', players: present, text: _rp([
                `New tribe. New faces. The first day at ${tribe.name} is a chess match disguised as small talk. Everyone is sizing each other up.`,
                `${tribe.name} camp feels different with the new blood. Old alliances mean nothing here — or everything. Nobody knows which yet.`,
                `The swap changed the numbers, the relationships, and the pecking order at ${tribe.name}. The first conversations are careful. Nobody shows their hand.`,
                `${tribe.name} is a brand new tribe in everything but name. The shelter is the same. The people aren't. The game starts over.`,
              ]) });
            }
            // Originals vs newcomers tension — originals bond tighter, newcomers scramble
            if (_originals.length >= 2 && _newArrivals.length >= 2 && Math.random() < 0.45) {
              // Originals consolidate
              for (let _oi = 0; _oi < _originals.length; _oi++)
                for (let _oj = _oi+1; _oj < _originals.length; _oj++) addBond(_originals[_oi], _originals[_oj], 0.5);
              // Newcomers try to bond with each other
              for (let _ni = 0; _ni < _newArrivals.length; _ni++)
                for (let _nj = _ni+1; _nj < _newArrivals.length; _nj++) addBond(_newArrivals[_ni], _newArrivals[_nj], 0.3);
              const _origNames = _originals.slice(0, 2).join(' and ');
              const _newNames = _newArrivals.slice(0, 2).join(' and ');
              pre.push({ type: 'doubt', players: [..._originals.slice(0,2), ..._newArrivals.slice(0,2)], text: _rp([
                `The originals — ${_origNames} — already have a rhythm at camp. The newcomers — ${_newNames} — are watching from the outside.`,
                `There's a line between who was here before and who just arrived. ${_origNames} know the camp. ${_newNames} know nothing except they need allies fast.`,
                `${_origNames} have home-court advantage. ${_newNames} have fresh perspective. Neither lasts — but right now, both matter.`,
                `The first meal at the new ${tribe.name} is tense. ${_origNames} serve. ${_newNames} accept. The power dynamic is silent but everyone feels it.`,
              ]) });
            }
            // Cross-tribe intel: newcomer bonds with tribe by sharing info, reveals idol holders
            if (_newArrivals.length >= 1 && Math.random() < 0.40) {
              const _intelSource = _newArrivals[Math.floor(Math.random() * _newArrivals.length)];
              const _iP = pronouns(_intelSource);
              // Real consequence: intel source gains trust with originals
              _originals.forEach(o => addBond(_intelSource, o, 0.6));
              // Chance to expose an idol holder from the other tribe
              const _otherTribes = gs.tribes.filter(t => t.name !== tribe.name);
              const _otherIdolHolder = gs.advantages.find(a => a.type === 'idol' && _otherTribes.some(t => t.members.includes(a.holder)));
              if (_otherIdolHolder && Math.random() < 0.35) {
                if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
                gs.knownIdolHoldersThisEp.add(_otherIdolHolder.holder);
              }
              pre.push({ type: 'eavesdrop', players: [_intelSource], text: _rp([
                `${_intelSource} has information about the other tribe that ${tribe.name} didn't have before. Whether ${_iP.sub} ${_iP.sub==='they'?'share':'shares'} it — and how much — is ${_iP.posAdj} first strategic decision.`,
                `The tribe wants to know what was happening at ${_intelSource}'s old camp. ${_intelSource} gives them enough to seem useful. Not enough to seem dangerous.`,
                `${_intelSource} knows who has idols, who's on the bottom, and who's been lying on the other side. That knowledge is currency.`,
                `${_intelSource} drops a piece of information at camp — casually, like it doesn't matter. It does.`,
              ]) });
            }
          } else {
            // 1-2 newcomers into existing group: individual integration with real bond consequences
            _newArrivals.forEach(newcomer => {
              if (Math.random() < 0.55) {
                const _ncP = pronouns(newcomer);
                const _ncBondAvg = present.filter(m => m !== newcomer).reduce((s,m) => s + getBond(newcomer,m), 0) / Math.max(1, present.length - 1);
                if (_ncBondAvg >= 1) {
                  // Good integration: bonds grow with new tribe
                  present.filter(m => m !== newcomer).forEach(m => addBond(newcomer, m, 0.4));
                } else if (_ncBondAvg <= -1) {
                  // Bad integration: outsider status worsens
                  present.filter(m => m !== newcomer).forEach(m => addBond(newcomer, m, -0.3));
                  if (gs.playerStates?.[newcomer]) gs.playerStates[newcomer].emotional = 'uneasy';
                }
                // Neutral: no bond change, just observing
                const _ncText = _ncBondAvg >= 1 ? _rp([
                  `${newcomer} is settling in faster than expected. ${_ncP.Sub} already ${_ncP.sub==='they'?'have':'has'} inside jokes with half the tribe.`,
                  `${newcomer} fits. ${_ncP.Sub} ${_ncP.sub==='they'?'contribute':'contributes'} at camp, ${_ncP.sub} ${_ncP.sub==='they'?'listen':'listens'} at strategy talks. The new tribemates are warming up.`,
                  `${newcomer} brings an energy ${tribe.name} didn't know it needed. By sundown, ${_ncP.sub} ${_ncP.sub==='they'?'feel':'feels'} less like an outsider and more like a missing piece.`,
                ]) : _ncBondAvg <= -1 ? _rp([
                  `${newcomer} hasn't found ${_ncP.pos} footing at ${tribe.name}. The conversations are polite but short.`,
                  `${newcomer} eats alone again. The tribe isn't hostile — just closed. Breaking in is harder than it looks.`,
                  `${newcomer} tries to join a strategy talk. The conversation stops. It starts again when ${_ncP.sub} ${_ncP.sub==='they'?'leave':'leaves'}.`,
                ]) : _rp([
                  `${newcomer} is still reading the room. Who's in charge, who's on the outs, who can be trusted — all new questions.`,
                  `${newcomer} watches more than ${_ncP.sub} ${_ncP.sub==='they'?'talk':'talks'} today. Every conversation is data.`,
                  `${newcomer} keeps ${_ncP.pos} head down and does the work. No alliances yet. Just proving ${_ncP.sub} ${_ncP.sub==='they'?'belong':'belongs'} here.`,
                ]);
                pre.push({ type: 'doubt', players: [newcomer], text: _ncText });
              }
            });
          }
        }
      });
    } else {
      const total = totalForGroup(gs.activePlayers);
      const preCount = phase === 'both' ? total : Math.ceil(total / 2);
      const _campActivePlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
      const mergePreEvents = generateCampEventsForGroup(_campActivePlayers, idolFinds, boosts, preCount);
      if (ep.twistNarrativeEvents?.['merge']) mergePreEvents.unshift(ep.twistNarrativeEvents['merge']);
      if (!ep.campEvents) ep.campEvents = {};
      const _existingMergePre = ep.campEvents.merge?.pre || [];
      ep.campEvents.merge = { pre: [..._existingMergePre, ...mergePreEvents], post: [] };
    }
  }

  // ── LINGERING INJURY EVENTS: recovery or ongoing pain ──
  if (gs.lingeringInjuries && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    Object.entries(gs.lingeringInjuries).forEach(([name, inj]) => {
      if (!gs.activePlayers.includes(name)) { delete gs.lingeringInjuries[name]; return; }
      const age = ep.num - inj.ep;
      if (age >= inj.duration) { delete gs.lingeringInjuries[name]; return; } // fully healed
      const _ip = pronouns(name);
      const tribe = gs.isMerged ? (Object.keys(ep.campEvents)[0] || 'merge')
        : gs.tribes.find(t => t.members.includes(name))?.name;
      if (!tribe || !ep.campEvents?.[tribe]) return;
      const pre = Array.isArray(ep.campEvents[tribe]) ? ep.campEvents[tribe] : (ep.campEvents[tribe].pre || []);
      if (age === 0) return; // injury event itself already fired this episode
      if (age === inj.duration - 1) {
        // Last episode of injury — recovery event
        pre.push({ type: 'injury', players: [name], text: _rp([
          `${name} moves differently today — looser, faster. The injury from a few days ago is finally fading. The tribe notices.`,
          `${name} is back to full strength. ${_ip.Sub} ${_ip.sub==='they'?'don\'t':'doesn\'t'} announce it — ${_ip.sub} just ${_ip.sub==='they'?'start':'starts'} keeping up again. The worry is over.`,
          `The limp is gone. ${name} pushes through a camp task that would've been painful yesterday. The tribe watches and recalculates.`,
        ]) });
      } else {
        // Still injured — ongoing pain event
        if (Math.random() < 0.45) {
          pre.push({ type: 'injury', players: [name], text: _rp([
            `${name} is still hurting. ${_ip.Sub} ${_ip.sub==='they'?'hide':'hides'} it well — but not well enough. The tribe is watching.`,
            `${name} winces during a camp task. ${_ip.Sub} ${_ip.sub==='they'?'wave':'waves'} it off. Nobody believes ${_ip.obj}.`,
            `The injury is slowing ${name} down. ${_ip.Sub} ${_ip.sub==='they'?'know':'knows'} it. The tribe knows it. A challenge is coming.`,
            `${name} sits out of a camp task for the first time. "I'm fine," ${_ip.sub} ${_ip.sub==='they'?'say':'says'}. ${_ip.Sub} ${_ip.sub==='they'?'are':'is'} not fine.`,
          ]) });
        }
      }
    });
  }

  // ── SCRAMBLE camp events (post-merge only) ──
  if (gs.phase === 'post-merge' && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _campKey = Object.keys(ep.campEvents || {}).find(k => ep.campEvents[k]?.pre) || 'merge';
    const _pre = ep.campEvents?.[_campKey]?.pre;
    if (_pre) {
      // Scramble Effect camp events
      if (gs._scrambleActivations) {
        Object.entries(gs._scrambleActivations).forEach(([name, power]) => {
          if (Math.random() >= 0.35) return; // ~35% chance to show the event
          const pr = pronouns(name);
          const allies = gs.activePlayers.filter(p => p !== name && getBond(name, p) >= 2);
          // Bond boost: +0.3 with 1-2 random allies
          const bondTargets = allies.sort(() => Math.random() - 0.5).slice(0, Math.min(2, allies.length));
          bondTargets.forEach(a => addBond(a, name, 0.3));
          _pre.push({ type: 'scramble', players: [name, ...bondTargets], text: _rp([
            `${name} pulled three people aside before tribal. By sundown, the conversation had shifted.`,
            `Nobody's sure who changed the plan. ${name} knows.`,
            `${name} spent the afternoon making rounds. By dinner, ${pr.pos} name wasn't coming up anymore.`,
            `The vote was locked — until ${name} had a conversation with the right person at the right time.`,
            `${name} doesn't panic. ${pr.Sub} work${pr.sub==='they'?'':'s'} the camp like it's a job. Two hours later, the target is someone else.`,
            `There was a plan. Then ${name} talked to everyone individually. Now there's a different plan. Nobody can explain how it happened.`,
          ], name + 'scramble' + ep.num), badgeText: 'SCRAMBLE', badgeClass: 'gold' });
        });
        ep._debugScramble = { ...gs._scrambleActivations };
        delete gs._scrambleActivations;
      }
      // Shield network removed — replaced by vote pitches in social politics system
    }
  }

  // ── IDOL SNOOPING: bold/low-loyalty players search through belongings ──
  if ((phase === 'pre' || phase === 'both') && gs.advantages?.some(a => a.type === 'idol')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    Object.entries(ep.campEvents || {}).forEach(([tribeName, phaseData]) => {
      const pre = Array.isArray(phaseData) ? phaseData : (phaseData.pre || []);
      const tribeMembers = gs.isMerged ? gs.activePlayers
        : (gs.tribes.find(t => t.name === tribeName)?.members || []);

      // Snooping: bold + low-loyalty player searches through belongings
      const idolHoldersHere = gs.advantages.filter(a => a.type === 'idol' && tribeMembers.includes(a.holder));
      if (idolHoldersHere.length && Math.random() < 0.08) {
        const snooper = tribeMembers.filter(n =>
          !idolHoldersHere.some(a => a.holder === n) && pStats(n).boldness >= 6 && pStats(n).loyalty <= 5
        ).sort((a,b) => (pStats(b).boldness + pStats(b).intuition) - (pStats(a).boldness + pStats(a).intuition))[0];
        if (snooper) {
          const target = idolHoldersHere[Math.floor(Math.random() * idolHoldersHere.length)];
          const _spP = pronouns(snooper);
          const caught = Math.random() < 0.35;
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(target.holder);
          if (caught) {
            addBond(target.holder, snooper, -2.5);
            tribeMembers.filter(m => m !== snooper && m !== target.holder).forEach(m => addBond(m, snooper, -0.5));
            pre.push({ type: 'idolBetrayal', players: [snooper, target.holder], text: _rp([
              `${snooper} goes through ${target.holder}'s bag while the tribe is at the water well. ${_spP.Sub} find${_spP.sub==='they'?'':'s'} it — the idol. But ${target.holder} walks back early and catches ${_spP.obj} red-handed. The camp goes silent.`,
              `${snooper} searches ${target.holder}'s belongings and discovers a hidden idol. ${_spP.Sub} barely ${_spP.sub==='they'?'get':'gets'} it back in the bag before someone sees. Someone did see.`,
              `${target.holder} finds ${snooper} rummaging through ${pronouns(target.holder).pos} things. The excuse is bad. The damage is real. Everyone at camp heard what happened.`,
            ]) });
          } else {
            pre.push({ type: 'eavesdrop', players: [snooper, target.holder], text: _rp([
              `${snooper} searches ${target.holder}'s bag while nobody is looking. ${_spP.Sub} find${_spP.sub==='they'?'':'s'} what ${_spP.sub} ${_spP.sub==='they'?'were':'was'} looking for. Nobody knows. Not yet.`,
              `${snooper} waits until ${target.holder} is gone and checks ${pronouns(target.holder).pos} things. There it is — the idol. ${snooper} puts everything back exactly as it was. The secret is ${_spP.posAdj} now.`,
              `${snooper} discovers ${target.holder}'s idol during a quiet moment at camp. ${_spP.Sub} ${_spP.sub==='they'?'don\'t':'doesn\'t'} take it — ${_spP.sub} just ${_spP.sub==='they'?'need':'needs'} to know it's there. And now ${_spP.sub} ${_spP.sub==='they'?'do':'does'}.`,
            ]) });
          }
        }
      }

      // Ally tip-off: someone with high social tells their close ally about an idol holder
      if (idolHoldersHere.length && Math.random() < 0.10) {
        const knownHolders = [...(gs.knownIdolHoldersThisEp || [])].filter(n => tribeMembers.includes(n));
        if (knownHolders.length) {
          const holder = knownHolders[Math.floor(Math.random() * knownHolders.length)];
          // Find a social player who knows and has a close ally who DOESN'T know
          const informers = tribeMembers.filter(n =>
            n !== holder && pStats(n).social >= 6 && getBond(n, holder) <= 1
          );
          const informer = informers[Math.floor(Math.random() * informers.length)];
          if (informer) {
            const recipient = tribeMembers.filter(n =>
              n !== informer && n !== holder && getBond(informer, n) >= 2
            ).sort((a,b) => getBond(informer,b) - getBond(informer,a))[0];
            if (recipient) {
              addBond(informer, recipient, 0.5);
              const _infP = pronouns(informer);
              pre.push({ type: 'eavesdrop', players: [informer, recipient], text: _rp([
                `${informer} pulls ${recipient} aside. "${holder} has an idol." Two words that change everything. ${recipient} nods. The plan adjusts.`,
                `${informer} tells ${recipient} about ${holder}'s idol — quietly, away from camp. It's the kind of information that bonds people. And targets others.`,
                `${informer} shares what ${_infP.sub} know${_infP.sub==='they'?'':'s'} about ${holder}'s idol with ${recipient}. Trust has a price. This is how you pay it.`,
                `${informer} whispers to ${recipient}: "${holder} is holding something." ${recipient} doesn't need to ask what. The look on ${informer}'s face says it all.`,
              ]) });
            }
          }
        }
      }
    });
  }

  // ── MERGE ANNOUNCEMENT: inject guaranteed reaction events when tribes dissolve ──
  if (ep.isMerge && (phase === 'pre' || phase === 'both') && ep.campEvents?.merge) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const pre = ep.campEvents.merge.pre;
    const _n = gs.activePlayers.length;
    // Big announcement — always first
    pre.unshift({ type: 'mergeAnnounce', text: _rp([
      `It's official. The tribes are done. ${_n} players, one camp, one game from here. Everybody is acting like they're fine. Nobody is fine.`,
      `The merge is here. The flag drops, the buffs come off, and ${_n} people who've been trying to outlast each other suddenly have to share a fire. The game just started for real.`,
      `${_n} left. One tribe. The old lines don't disappear — they just go underground. Everyone is smiling and everyone is counting.`,
      `The moment the merge is announced, something shifts in the air. Pre-merge alliances are already obsolete. ${_n} players are doing the math on who they actually trust.`,
    ]) });
    // Scramble/recalibration — always second
    pre.splice(1, 0, { type: 'mergeScramble', text: _rp([
      `The first hours of the merge are a scramble. Everyone is pulling people aside, reconnecting with old allies, testing new ones. The game is moving fast.`,
      `Old tribal lines mean nothing and everything at the same time. Everyone is pretending to start fresh. Nobody actually is.`,
      `The conversations are nonstop. Everyone wants to know where everyone else stands. Nobody is giving a straight answer.`,
      `Cross-tribal relationships that were built over weeks are being stress-tested in a single afternoon. Some of them hold. Some of them don't.`,
    ]) });
    // Confessional-style individual reads — pick a random player
    const _pivot = gs.activePlayers[Math.floor(Math.random() * gs.activePlayers.length)];
    const _pP = pronouns(_pivot);
    pre.splice(2, 0, { type: 'mergeConfessional', players: [_pivot], text: _rp([
      `${_pivot} is watching. Watching how people group up, who walks with who, who gets quiet. ${_pP.Sub} ${_pP.sub === 'they' ? "have" : "has"} been waiting for this. Now it's time to play.`,
      `${_pivot} already has a number in ${_pP.posAdj} head. ${_pP.Sub} ${_pP.sub === 'they' ? "know" : "knows"} exactly who ${_pP.sub} need${_pP.sub === 'they' ? '' : 's'} to go next. The merge is just when the plan starts.`,
      `${_pivot} walked into merge camp and immediately started counting allies. ${_pP.Sub} ${_pP.sub === 'they' ? "aren't" : "isn't"} celebrating. ${_pP.Sub} ${_pP.sub === 'they' ? "are" : "is"} calculating.`,
      `The merge is a reset for most people. Not for ${_pivot}. ${_pP.Sub} ${_pP.sub === 'they' ? "have" : "has"} been preparing for this since day one.`,
    ]) });
    // ── Pre-merge challenge dominance — inject threat narrative at merge for standout performers ──
    const _chalDom = gs.activePlayers
      .map(n => ({ name: n, rec: gs.chalRecord?.[n] }))
      .filter(({ rec }) => rec && (rec.podiums >= 3 || rec.wins >= 1))
      .sort((a, b) => (b.rec.podiums + b.rec.wins * 2) - (a.rec.podiums + a.rec.wins * 2))
      .slice(0, 2); // at most 2 players flagged per merge episode
    _chalDom.forEach(({ name: threat, rec }) => {
      const _tp = pronouns(threat);
      const s3 = _tp.sub === 'they';
      // Notifier: most strategic player who isn't the threat
      const _notifier = gs.activePlayers.filter(p => p !== threat)
        .reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best,
          gs.activePlayers.filter(p => p !== threat)[0]);
      const _np = pronouns(_notifier);
      const _winsNote = rec.wins >= 1 ? ` and won ${rec.wins} individual challenge${rec.wins > 1 ? 's' : ''} before merge` : '';
      const _threatLine = _rp([
        `${threat} finished in the top of ${rec.podiums} pre-merge challenges${_winsNote}. At merge, that résumé doesn't earn respect — it earns a target.`,
        `Everyone arrived at merge camp knowing ${threat}'s name. Not because of strategy. Because ${_tp.sub} ${s3 ? 'were' : 'was'} winning challenges all pre-merge. That kind of record travels.`,
        `${threat} was the best challenge performer coming into this merge. ${rec.podiums} top finishes. The question isn't whether people are worried — it's who acts first.`,
        `Pre-merge, ${threat} was an asset. At merge, that asset becomes a liability for everyone who has to compete against ${_tp.obj}.`,
      ]);
      const _reactLine = _rp([
        `${_notifier} brought it up within the first hour. The name ${threat} came out of ${_np.posAdj} mouth like ${_np.sub} ${s3 ? 'had' : 'had'} been sitting on it for days.`,
        `${_notifier} didn't need long to do the math. ${threat} wins challenges. ${threat} has allies. ${threat} has to go early.`,
        `${_notifier} saw the same résumé everyone else saw. The difference is ${_np.sub} ${s3 ? 'are' : 'is'} already planning around it.`,
      ]);
      pre.push({ type: 'chalThreat',         text: _threatLine, players: [threat] });
      pre.push({ type: 'chalThreatReaction', text: _reactLine,  players: [_notifier, threat] });
    });

    // Boost merge-specific events in the generated list
    boost('tdStrategy', 40); boost('tdBond', 30); boost('doubt', 25);
    boost('leadershipClash', 20); boost('rumor', 20); boost('eavesdrop', 20);
  }

  // ── Idol confession/betrayal + amulet events: probabilistic chain fired after pre events are built ──
  if (phase === 'pre' || phase === 'both') {
    checkIdolConfessions(ep);
    checkTeamSwapConfessions(ep);
    checkSafetyNoPowerConfessions(ep);
    checkSoleVoteConfessions(ep);
    checkSocialIntel(ep);
    checkSecondLifeAmuletEvents(ep);
    checkLegacyCampEvents(ep);
    checkTacticalAdvantageSnoop(ep);
    checkHeroVillainEvents(ep);
    checkComfortBlindspot(ep);
    checkSocialPolitics(ep);
  }

  // ── Post-save aftermath (idol / SITD / KIP from previous episode) ──
  // Runs AFTER ep.campEvents is fully populated so pushes aren't overwritten.
  if (prevEp && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _prevSaves = [
      ...(prevEp.idolPlays || [])
        .filter(p => p.type === 'idol' || p.type === 'kip' || (!p.type && !p.stolenFrom && p.votesNegated !== undefined))  // only actual idol plays, not extra votes / vote steals
        .filter((p, i, arr) => arr.findIndex(x => x.player === p.player && (x.playedFor || null) === (p.playedFor || null)) === i)  // deduplicate same player
        .map(p => ({
          player: p.player, playedFor: p.playedFor || null, votesNegated: p.votesNegated || 0,
          type: p.type === 'kip' ? 'kip' : p.superIdol ? 'super-idol' : p.playedFor ? 'idol-for-ally' : 'idol',
          stolenFrom: p.stolenFrom || null, safe: true,
        })),
      // Include SITD regardless of safe/unsafe — both outcomes have drama
      ...(prevEp.shotInDark
        ? [{ player: prevEp.shotInDark.player, votesNegated: prevEp.shotInDark.votesNegated || 0, type: 'sitd', safe: prevEp.shotInDark.safe }]
        : []),
    ];
    _prevSaves.forEach(save => {
      // Camp is the tribe the player belonged to last episode (may be on exile/eliminated now)
      const campKey = gs.isMerged ? 'merge'
        : gs.tribes.find(t => t.members.includes(save.player))?.name
        || prevEp.tribalTribe || prevEp.loser?.name || null;
      if (!campKey || !ep.campEvents[campKey]) return;
      const pre = ep.campEvents[campKey].pre;
      const _p = pronouns(save.player);
      const vn = save.votesNegated;
      const voteWord = vn === 1 ? 'vote' : 'votes';

      if (save.type === 'sitd') {
        if (save.safe) {
          pre.push({ type: 'saveReaction', text: _rp([
            `The morning after is quiet — not the comfortable kind. ${save.player} rolled the Shot in the Dark and it landed safe. ${vn > 0 ? `${vn} ${voteWord} just gone.` : ''} Nobody has processed it yet.`,
            `${save.player} is still here. That's the fact everyone woke up to. The Shot in the Dark isn't supposed to work. It did. The people who voted are recalibrating.`,
            `Camp feels different this morning. ${save.player} survived on a 1-in-6 chance. ${_p.Sub} ${_p.sub==='they'?'know':'knows'} ${_p.sub} ${_p.sub==='they'?'are':'is'} still a target — and so does everyone else.`,
          ]) });
          pre.push({ type: 'saveScramble', text: _rp([
            `The plan from last night is dead. Whatever comes next has to account for the fact that ${save.player} is still in the game and now knows exactly who voted for ${_p.obj}.`,
            `Someone needs to rebuild the numbers. The vote failed, the target survived, and the game has a new variable: ${save.player} playing with nothing left to lose.`,
          ]) });
        } else {
          // SITD played but didn't save them — check if they actually went home or survived
          const _sitdWentHome = prevEp.eliminated === save.player || (Array.isArray(prevEp.eliminated) && prevEp.eliminated.includes(save.player));
          if (_sitdWentHome) {
            pre.push({ type: 'saveReaction', text: _rp([
              `${save.player} rolled the Shot in the Dark last night. It didn't land. ${_p.Sub} ${_p.sub==='they'?'are':'is'} gone — but the fact that ${_p.sub} tried it is all anyone is talking about this morning.`,
              `The Shot in the Dark failed. ${save.player} sacrificed their vote and still went home. The move didn't work, but it told everyone something about how ${_p.sub} ${_p.sub==='they'?'play':'plays'} this game.`,
              `${save.player} gambled last night. The dice came up wrong. The camp is quiet about it — not because they don't care, but because it could have been any of them reaching for that slip of paper.`,
          ]) });
          } else {
            // SITD failed but they survived anyway (someone else went home)
            pre.push({ type: 'saveReaction', text: _rp([
              `${save.player} rolled the Shot in the Dark last night and it didn't land. ${_p.Sub} survived anyway — but ${_p.sub} wasted ${_p.pos} vote for nothing. The tribe knows ${_p.sub} panicked.`,
              `The Shot in the Dark failed, but ${save.player} is still here. Someone else went home instead. The desperation move didn't matter — but the tribe saw ${_p.obj} reach for it.`,
              `${save.player} sacrificed ${_p.pos} vote on a 1-in-6 gamble. It missed. ${_p.Sub} ${_p.sub==='they'?'are':'is'} still in the game, but everyone knows ${_p.sub} felt cornered enough to try.`,
            ]) });
          }
        }
      } else if (save.type === 'kip') {
        const stolenLine = save.stolenFrom ? `${save.stolenFrom} woke up without the idol they had. ` : '';
        pre.push({ type: 'saveReaction', text: _rp([
          `${stolenLine}${save.player} has an idol that wasn't ${_p.posAdj} 24 hours ago. The camp is still absorbing what happened last night.`,
          `The Knowledge Is Power play worked. ${save.player} comes to camp this morning with leverage nobody saw coming. The people who thought they understood the game are starting over.`,
          `${save.player} made a move at tribal that changed the board entirely. ${stolenLine}This morning, the math is different.`,
        ]) });
        pre.push({ type: 'saveScramble', text: _rp([
          `${save.stolenFrom ? save.stolenFrom + ' needs a new plan' : 'Someone lost their insurance last night'}. The idol is gone, and the person who has it is a threat in a different way now.`,
          `Everyone knows what ${save.player} did. The question is what ${_p.sub} ${_p.sub==='they'?'do':'does'} next — and who ${_p.sub} ${_p.sub==='they'?'use':'uses'} it on.`,
        ]) });
      } else if (save.type === 'super-idol') {
        // Super Idol: played AFTER votes — the most dramatic play possible
        if (save.playedFor) {
          pre.push({ type: 'saveReaction', text: _rp([
            `Nobody can stop talking about it. The votes were read. ${save.playedFor} was done. Then ${save.player} stood up with the Super Idol. ${vn} ${voteWord} — erased. After the read. That's never happened before.`,
            `${save.player} waited until the host read every single vote. Then pulled out the Super Idol for ${save.playedFor}. The camp hasn't recovered. You don't see that kind of loyalty — or that kind of nerve.`,
          ]) });
          addBond(save.player, save.playedFor, 1.5); // lingering gratitude on top of the engine's +3
        } else {
          pre.push({ type: 'saveReaction', text: _rp([
            `The Super Idol play is all anyone is talking about this morning. ${save.player} sat through every vote being read — ${_p.posAdj} name, over and over — and then pulled it out. ${vn} ${voteWord} gone. After the read.`,
            `${save.player} let the votes happen. Watched ${_p.posAdj} own name pile up. Then played the Super Idol. The camp woke up to a different game. That wasn't just an advantage play — that was a statement.`,
            `Nobody sleeps well after a Super Idol play. ${save.player} is still here, the idol is gone, and everyone who voted for ${_p.obj} knows they were outplayed in a way they couldn't have predicted.`,
          ]) });
        }
        pre.push({ type: 'saveScramble', text: _rp([
          `The coalition that put ${vn} ${voteWord} on ${save.playedFor || save.player}? Still exists. Still wants them gone. But now they know what they're up against — someone who waits, watches, and strikes at the last possible moment.`,
          `The Super Idol is gone. That's the consolation. But the player who held it just proved they're willing to play the most dangerous game possible. That changes how everyone plans from here.`,
        ]) });
      } else if (save.type === 'idol-for-ally') {
        const _a = pronouns(save.playedFor);
        // Consolidated idol-for-ally event — reaction + bond + scramble in one
        const _allyReact = _rp([
          `${save.player} played their idol for ${save.playedFor} last night. ${save.playedFor} is still here because of it.`,
          `What ${save.player} did at tribal wasn't calculated. It was a choice — put ${save.playedFor} above ${_p.posAdj} own safety. ${vn > 0 ? `${vn} ${voteWord} wiped out.` : ''}`,
          `${save.player} burned an idol for ${save.playedFor}. It worked. That alliance just proved it means something real.`,
        ]);
        const _allyAfter = _rp([
          `${save.playedFor} knows what ${save.player} gave up. That debt runs deeper than strategy. But ${save.player} has no idol now — the math just changed for everyone.`,
          `${save.player} spent their protection. Whether it was the right move depends on how loyal ${save.playedFor} turns out to be from here.`,
          `The idol is gone. But a proven ally willing to sacrifice? That's a different kind of threat.`,
        ]);
        pre.push({ type: 'saveReaction', players: [save.player, save.playedFor], text: `${_allyReact} ${_allyAfter}` });
      } else {
        // Consolidated self-idol event — one event covering reaction + empowerment + scramble
        const _selfIdolReact = _rp([
          `${save.player} wakes up this morning having played an idol and survived. ${vn} ${voteWord} wiped out. The people who cast them are watching ${_p.obj} from across the fire.`,
          `The idol play is the first thing on everyone's mind when they wake up. ${save.player} is still here. The plan failed. The game goes on.`,
          `${save.player} pulled out an idol last night and it worked. This morning ${_p.sub} ${_p.sub==='they'?'move':'moves'} around camp like nothing happened. That kind of composure is its own kind of threat.`,
        ]);
        const _selfIdolAfter = _rp([
          `The idol is gone, but the threat hasn't changed. Someone is already figuring out how to finish what they started.`,
          `${vn} ${voteWord} went nowhere. That coalition still exists. It just needs a new shot. ${save.player} bought one episode — everybody knows it.`,
          `There's something different about ${save.player} this morning. ${_p.Sub} ${_p.sub==='they'?'survive':'survives'} with ${_p.posAdj} own hand. But ${_p.sub} ${_p.sub==='they'?'are':'is'} still the target.`,
        ]);
        pre.push({ type: 'saveReaction', text: `${_selfIdolReact} ${_selfIdolAfter}` });
      }
    });
  }

  // ── Open vote aftermath: next episode people are still processing public declarations ──
  if (prevEp?.openVote && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    // Find pairs where someone voted against a former ally (bond was positive pre-tribal)
    const _ovLog = prevEp.votingLog || [];
    const _ovBroken = _ovLog.filter(({ voter, voted }) =>
      voted !== prevEp.eliminated && gs.activePlayers.includes(voter) && gs.activePlayers.includes(voted) && getBond(voter, voted) < -0.5
    );
    // Inject 1-2 aftermath events per camp
    const _campKeys = gs.isMerged ? ['merge'] : gs.tribes.map(t => t.name);
    _campKeys.forEach(campKey => {
      if (!ep.campEvents[campKey]) return;
      const pre = ep.campEvents[campKey].pre;
      // General open vote aftermath
      pre.push({ type: 'saveReaction', text: _rp([
        `The open vote is all anyone is talking about. Every name that was called last night is still hanging in the air this morning. There's no way to pretend it didn't happen.`,
        `Last night's public declarations changed the camp. People were named out loud, and the ones who heard it woke up in a different position than they went to sleep in.`,
        `An open vote leaves marks. You can't take back a name you said out loud — and the people who heard it haven't forgotten.`,
      ]) });
      // Specific pair drama if applicable
      if (_ovBroken.length) {
        const _pair = _ovBroken[Math.floor(Math.random() * _ovBroken.length)];
        if (gs.activePlayers.includes(_pair.voter) && gs.activePlayers.includes(_pair.voted)) {
          pre.push({ type: 'dispute', players: [_pair.voter, _pair.voted], text: _rp([
            `${_pair.voter} called ${_pair.voted}'s name publicly last night. That conversation is not over. The awkwardness between them is visible enough that the whole camp feels it.`,
            `${_pair.voted} heard ${_pair.voter} say their name out loud. This morning ${_pair.voted} hasn't said a word to ${_pair.voter}. Some things don't wash off overnight.`,
            `The open vote exposed what ${_pair.voter} actually thinks of ${_pair.voted}. There's no backtracking. Whatever existed between them before last night is complicated now.`,
          ]) });
        }
      }
    });
  }

  // ── Post-tribal discovery aftermath: vote discovery + lost ally reactions ──
  // Reads gs.discoveredVotesLastEp set by applyPostTribalConsequences() last episode.
  if (gs.discoveredVotesLastEp?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _disc = [...gs.discoveredVotesLastEp];
    gs.discoveredVotesLastEp = []; // consume — cleared so it doesn't repeat next episode
    // Group lost-ally events by ally so one ally's reaction is ONE consolidated event
    const _lostAllyGroups = {};
    _disc.filter(e => e.type === 'lost-ally').forEach(evt => {
      const key = evt.ally + '|' + evt.elim;
      if (!_lostAllyGroups[key]) _lostAllyGroups[key] = { ally: evt.ally, elim: evt.elim, voters: [] };
      if (gs.activePlayers.includes(evt.voter)) _lostAllyGroups[key].voters.push(evt.voter);
    });
    Object.values(_lostAllyGroups).forEach(({ ally, elim: evElim, voters }) => {
      if (!gs.activePlayers.includes(ally) || !voters.length) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(ally))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _aP = pronouns(ally);
      const voterList = voters.length === 1 ? voters[0] : voters.slice(0, -1).join(', ') + ' and ' + voters[voters.length - 1];
      ep.campEvents[_campKey].pre.push({ type: 'doubt', players: [ally, ...voters], text: _rp([
        `${ally} hasn't forgotten who voted out ${evElim}. ${voterList} — ${_aP.sub} ${_aP.sub === 'they' ? "know" : "knows"} every name. The resentment is building.`,
        `Losing ${evElim} hit ${ally} hard. ${voterList} — ${ally} saw the votes. That's not something ${_aP.sub} ${_aP.sub === 'they' ? "are" : "is"} going to let go of easily.`,
        `${evElim} is gone, and ${ally} knows exactly who did it. ${voterList}. ${ally} is keeping ${_aP.posAdj} mouth shut for now — but ${_aP.sub} ${_aP.sub === 'they' ? "haven't" : "hasn't"} forgiven anything.`,
        `${ally} woke up still thinking about ${evElim}. The grief is real, but underneath it is something sharper — ${voterList} voted ${_aP.posAdj} ally out, and ${ally} isn't going to just let that go.`,
        `${ally} isn't scrambling. ${_aP.Sub} ${_aP.sub === 'they' ? "are" : "is"} sitting with it — ${voterList} put ${evElim} on the jury. That kind of anger doesn't need to be loud to be dangerous.`,
        `The vote is over but ${ally}'s not done with it. ${evElim} trusted this game and ${voterList} ended it. ${ally} files that away. It will come up again.`,
      ]) });
    });
    // Group vote-discovery events by target so one player's reaction is ONE consolidated event
    const _voteDiscGroups = {};
    _disc.filter(e => e.type === 'vote-discovery').forEach(evt => {
      if (!_voteDiscGroups[evt.target]) _voteDiscGroups[evt.target] = { target: evt.target, voters: [] };
      if (gs.activePlayers.includes(evt.voter)) _voteDiscGroups[evt.target].voters.push(evt.voter);
    });
    Object.values(_voteDiscGroups).forEach(({ target, voters }) => {
      if (!gs.activePlayers.includes(target) || !voters.length) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(target))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _tP = pronouns(target);
      const voterList = voters.length === 1 ? voters[0] : voters.slice(0, -1).join(', ') + ' and ' + voters[voters.length - 1];
      ep.campEvents[_campKey].pre.push({ type: 'doubt', players: [target, ...voters], text: _rp([
        `${target} found out that ${voterList} wrote ${_tP.posAdj} name last tribal. ${_tP.Sub} ${_tP.sub === 'they' ? "aren't" : "isn't"} confronting anyone — yet. But the trust is gone.`,
        `${target} knows. ${voterList} voted for ${_tP.obj}. Whether ${_tP.sub} worked it out or someone slipped, ${_tP.sub} ${_tP.sub === 'they' ? "know" : "knows"}. They don't.`,
        `The vote is over, but ${target} hasn't moved on. ${voterList} wrote ${_tP.posAdj} name. That's not something ${_tP.sub} ${_tP.sub === 'they' ? "forget" : "forgets"}.`,
        `Something shifted for ${target} overnight. ${_tP.Sub} worked out that ${voterList} wrote ${_tP.posAdj} name. The information landed quietly. But it landed.`,
        `${target} found out. Maybe someone told ${_tP.obj}. Maybe ${_tP.sub} worked it out alone. Either way, ${voterList} ${voters.length === 1 ? 'is' : 'are'} no longer safe in ${_tP.posAdj} eyes.`,
        `There are people at this camp ${target} trusts less this morning. ${voterList}. They wrote ${_tP.posAdj} name. That doesn't disappear.`,
      ]) });
    });
  }

  // ── KiP steal aftermath: victim reaction + tribe awareness ──
  if (gs.kipStealLastEp && (phase === 'pre' || phase === 'both')) {
    const _kip = gs.kipStealLastEp;
    gs.kipStealLastEp = null; // consume
    const _kipHolder = _kip.holder;
    const _kipVictim = _kip.victim;
    if (gs.activePlayers.includes(_kipVictim) || gs.activePlayers.includes(_kipHolder)) {
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(_kipHolder) || t.members.includes(_kipVictim))?.name;
      if (_campKey && ep.campEvents[_campKey]) {
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        const _vPr = pronouns(_kipVictim);
        const _hPr = pronouns(_kipHolder);
        const _vS = pStats(_kipVictim);
        const _kipTypeLabel = _kip.stolenType === 'extraVote' ? 'Extra Vote' : _kip.stolenType === 'voteSteal' ? 'Vote Steal' : 'idol';
        if (_kip.success === false) {
          // KiP FAILED — asked the wrong person
          if (gs.activePlayers.includes(_kipHolder)) {
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipHolder, _kipVictim], text: _rp([
              `${_kipHolder} used Knowledge is Power on ${_kipVictim} — and got nothing. The whole tribe saw it. The embarrassment hangs over camp like smoke.`,
              `"Do you have an idol?" ${_kipHolder} asked ${_kipVictim} in front of everyone. "${_kipVictim === _kipVictim ? 'No' : 'No'}." The advantage is gone. The information is not.`,
              `${_kipHolder} swung and missed. Knowledge is Power wasted on ${_kipVictim}, who had nothing. The tribe is quietly recalculating ${_hPr.posAdj} threat level — downward.`,
            ]), badgeText: 'KiP Failed', badgeClass: 'red' });
          }
          if (gs.activePlayers.includes(_kipVictim)) {
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipVictim, _kipHolder], text: _rp([
              `${_kipVictim} was targeted by Knowledge is Power — and had nothing to take. ${_vPr.Sub} ${_vPr.sub==='they'?'walk':'walks'} around camp a little taller today.`,
              `${_kipHolder} came for ${_kipVictim}'s bag and found it empty. ${_kipVictim} hasn't stopped smiling since.`,
            ]), badgeText: 'Survived KiP', badgeClass: 'green' });
          }
        } else {
          // KiP SUCCESS — stole an advantage
          if (gs.activePlayers.includes(_kipVictim)) {
            const _victimText = _vS.boldness >= 7
              ? _rp([
                `${_kipVictim} hasn't said a word to ${_kipHolder} since last tribal. The silence is louder than any confrontation. ${_vPr.Sub} ${_vPr.sub==='they'?'are':'is'} done talking. ${_vPr.Sub} ${_vPr.sub==='they'?'are':'is'} planning.`,
                `${_kipVictim} woke up furious. ${_kipHolder} took ${_vPr.posAdj} ${_kipTypeLabel} in front of everyone. That's not something ${_vPr.sub} ${_vPr.sub==='they'?'forget':'forgets'}. That's something ${_vPr.sub} ${_vPr.sub==='they'?'avenge':'avenges'}.`,
              ])
              : _vS.strategic >= 7
              ? _rp([
                `${_kipVictim} lost the ${_kipTypeLabel} — but not the information. ${_vPr.Sub} ${_vPr.sub==='they'?'know':'knows'} exactly who has it now. And ${_vPr.sub} ${_vPr.sub==='they'?'know':'knows'} what that person is afraid of.`,
                `${_kipVictim} replays the moment ${_kipHolder} stood up. The ${_kipTypeLabel} is gone. But the picture of who ${_kipHolder} really is? That's the clearest it's ever been.`,
              ])
              : _rp([
                `${_kipVictim} sits by the fire, staring at nothing. The ${_kipTypeLabel} was ${_vPr.posAdj} only protection. ${_kipHolder} took it. Just like that.`,
                `${_kipVictim} hasn't been the same since last tribal. ${_kipHolder} asked the question and ${_vPr.sub} had to hand it over. The game feels different now.`,
              ]);
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipVictim, _kipHolder], text: _victimText, badgeText: 'KiP Aftermath', badgeClass: 'bad' });
          }
          if (gs.activePlayers.includes(_kipHolder)) {
            const _tribeText = _kip.wasAlly
              ? _rp([
                `The tribe saw what ${_kipHolder} did to ${_kipVictim}. They were supposed to be working together. Nobody is saying it out loud. Everybody is thinking it.`,
                `${_kipHolder} stole from ${_vPr.posAdj} own ally. The camp feels different this morning. People are checking their bags.`,
              ])
              : _rp([
                `${_kipHolder} walks around camp with a secret everyone can feel. Something shifted last night. The ${_kipTypeLabel} changed hands and the whole game tilted.`,
                `Word spread fast. ${_kipHolder} used Knowledge is Power. The tribe is doing the math on what that means for every alliance in the game.`,
              ]);
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipHolder, _kipVictim], text: _tribeText, badgeText: 'Power Shift', badgeClass: 'gold' });
          }
        }
      }
    }
  }

  // ── Safety Without Power aftermath: holder walked out last tribal ──
  if (gs.safetyNoPowerPlayed && (phase === 'pre' || phase === 'both')) {
      const _snpData = gs.safetyNoPowerPlayed;
      const _snpPr = pronouns(_snpData.holder);
      const _snpTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_snpData.holder))?.name);
      if (_snpTribe && ep.campEvents?.[_snpTribe]) {
        const _snpBlock = ep.campEvents[_snpTribe];
        const _push = evt => (Array.isArray(_snpBlock) ? _snpBlock : (_snpBlock.pre || [])).push(evt);

        if (_snpData.surprise) {
          // Surprise exit — dramatic aftermath
          const _snpLines = [
            `Camp is tense this morning. ${_snpData.holder} walked out of tribal last night without a word. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} safe, but the trust ${_snpPr.sub} left behind isn't.`,
            `Nobody has spoken to ${_snpData.holder} since last night. ${_snpPr.Sub} stood up, walked out, and left everyone to fend for themselves. Some people call that survival. Others have a different word for it.`,
            `${_snpData.holder} sits alone by the fire. ${_snpPr.Sub} used the Safety Without Power. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} still here. But the looks from the others say everything words can't.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: _snpLines[_snpSeed % _snpLines.length] });
        } else {
          // Warned exit — quieter aftermath
          const _snpLines = [
            `${_snpData.holder} is back at camp after walking out of tribal. ${_snpData.warnedAlly} knew it was coming. The rest didn't. The air is different this morning.`,
            `${_snpData.holder} warned ${_snpData.warnedAlly} before leaving tribal. That bought some goodwill — but not with everyone. The tribe is split on whether it was smart or selfish.`,
            `${_snpData.holder} played the Safety Without Power. ${_snpData.warnedAlly} covered for ${_snpPr.obj} as best ${pronouns(_snpData.warnedAlly).sub} could. The question now is whether anyone else will.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerEscaped', players: [_snpData.holder, _snpData.warnedAlly],
            text: _snpLines[_snpSeed % _snpLines.length] });
        }

        // If an ally was eliminated because of the missing vote
        if (_snpData.allyCost) {
          const _costPr = pronouns(_snpData.allyCost);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: `${_snpData.allyCost} went home last night. ${_snpData.holder}'s vote could have changed that. ${_snpPr.Sub} know${_snpPr.sub === 'they' ? '' : 's'} it. Everyone knows it.` });
          addBond(_snpData.allyCost, _snpData.holder, -1.0); // extra sting
        }
      }
      delete gs.safetyNoPowerPlayed;
    }

  // ── Sole Vote aftermath: holder dictated the vote last tribal ──
  if (gs.soleVotePlayed && (phase === 'pre' || phase === 'both')) {
    const _svData = gs.soleVotePlayed;
    const _svPr = pronouns(_svData.holder);
    const _svTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_svData.holder))?.name);
    if (_svTribe && ep.campEvents?.[_svTribe]) {
      const _svBlock = ep.campEvents[_svTribe];
      const _push = evt => (Array.isArray(_svBlock) ? _svBlock : (_svBlock.pre || [])).push(evt);
      const _svSeed = [..._svData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);

      if (_svData.target && !_svData.survived) {
        // Target was eliminated — dictator fallout
        const _svLines = [
          `Nobody is talking to ${_svData.holder} this morning. ${_svPr.Sub} silenced every voice at tribal and sent ${_svData.target} home alone. That kind of power leaves a mark.`,
          `${_svData.holder} made the call. One vote. ${_svPr.Pos} vote. ${_svData.target} is gone because ${_svData.holder} said so. The tribe hasn't forgotten.`,
          `Camp is quiet. ${_svData.holder} played the Sole Vote and eliminated ${_svData.target} single-handedly. Some call it strategy. Others call it tyranny. Nobody calls it forgettable.`,
        ];
        _push({ type: 'soleVoteFallout', players: [_svData.holder],
          text: _svLines[_svSeed % _svLines.length] });
        // Extra bond damage from players bonded to the eliminated
        gs.activePlayers.filter(p => p !== _svData.holder && getBond(p, _svData.target) >= 2).forEach(p => {
          addBond(p, _svData.holder, -0.5);
        });
      } else if (_svData.survived) {
        // Target idol'd out — wasted power
        const _svLines = [
          `${_svData.holder} played the Sole Vote — and it didn't matter. The target had an idol. Every voice was silenced for nothing. The dictator's crown turned to dust.`,
          `The Sole Vote was supposed to be the ultimate power move. Instead, an idol made it the ultimate embarrassment. ${_svData.holder} has no advantage and no allies to show for it.`,
          `${_svData.holder} burned the biggest advantage in the game for nothing. The idol cancelled the only vote that counted. Now ${_svPr.sub} ${_svPr.sub === 'they' ? 'have' : 'has'} a target on ${_svPr.posAdj} back and nothing left to play.`,
        ];
        _push({ type: 'soleVoteWasted', players: [_svData.holder],
          text: _svLines[_svSeed % _svLines.length] });
        // General contempt — wasted a scary advantage
        gs.activePlayers.filter(p => p !== _svData.holder).forEach(p => {
          addBond(p, _svData.holder, -0.3);
        });
      }

      // Warned ally noticed — complicity suspicion
      if (_svData.warnedAlly && gs.activePlayers.includes(_svData.warnedAlly)) {
        const _svAllyPr = pronouns(_svData.warnedAlly);
        _push({ type: 'soleVoteAccomplice', players: [_svData.warnedAlly, _svData.holder],
          text: `People noticed that ${_svData.warnedAlly} didn't flinch when ${_svData.holder} played the Sole Vote. ${_svAllyPr.Sub} knew. The tribe is asking what else ${_svAllyPr.sub} knew.` });
        gs.activePlayers.filter(p => p !== _svData.holder && p !== _svData.warnedAlly).forEach(p => {
          addBond(p, _svData.warnedAlly, -0.3);
        });
      }
    }
    delete gs.soleVotePlayed;
  }

  // ── Miscommunication fallout: voter accidentally helped eliminate their own ally ──
  if (gs.miscommunicationFallout?.length && (phase === 'pre' || phase === 'both')) {
    const _mcFallouts = gs.miscommunicationFallout;
    gs.miscommunicationFallout = null;
    _mcFallouts.forEach(mc => {
      if (!gs.activePlayers.includes(mc.voter)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(mc.voter))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;
      const _mcPr = pronouns(mc.voter);
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      if (mc.wasAlly && mc.changedOutcome) {
        // Worst case: ally went home because of the miscommunication
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter} hasn't spoken since last night. ${_mcPr.Sub} voted ${mc.eliminated} by accident — meant to write ${mc.intended}. And ${mc.eliminated} went home because of it. Everyone at camp knows. Nobody's saying it out loud.`,
            `The miscommunication cost ${mc.eliminated} the game. ${mc.voter} knows it. The rest of ${mc.alliance} knows it. ${_mcPr.Sub} can't take it back, and ${_mcPr.sub} can't explain it away. That's the kind of mistake that defines the rest of your game.`,
            `${mc.voter} was supposed to vote ${mc.intended}. Instead ${_mcPr.sub} wrote ${mc.eliminated}'s name. ${mc.eliminated} is gone now — and ${mc.voter}'s alliance is looking at ${_mcPr.obj} differently this morning.`,
          ]), badgeText: 'COSTLY MISTAKE', badgeClass: 'red' });
      } else if (mc.wasAlly) {
        // Voted ally but didn't change the outcome — still embarrassing
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter} voted for ${mc.eliminated} last night — ${_mcPr.posAdj} own ally. It didn't change the result, but ${mc.alliance} noticed. Trust takes time to build. One wrong name can undo it.`,
            `The tribe figured out that ${mc.voter} wrote the wrong name. ${mc.eliminated} would have gone home anyway, but that's not the point. ${mc.alliance} is questioning ${_mcPr.posAdj} focus.`,
          ]), badgeText: 'MISFIRE', badgeClass: 'red' });
      } else if (mc.changedOutcome) {
        // Not an ally but the misfire changed who went home
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter}'s stray vote landed on ${mc.eliminated}. It wasn't supposed to. And it might have been the vote that sent ${mc.eliminated} home. The tribe is still processing what happened.`,
            `${mc.voter} wrote the wrong name — and it mattered. ${mc.eliminated} went home on a margin that thin. One misfire, one exit. That's the game.`,
          ]), badgeText: 'COSTLY MISTAKE', badgeClass: 'red' });
      }
    });
  }

  // ── Alliance dissolution camp events ──
  if (gs.allianceDissolutions?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _dissolutions = [...gs.allianceDissolutions];
    gs.allianceDissolutions = [];
    _dissolutions.forEach(({ name, reason, members, betrayals, avgBond, lastMember, betrayalCount }) => {
      const activeMembers = (members || []).filter(m => gs.activePlayers.includes(m));
      if (!activeMembers.length && !lastMember) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => activeMembers.some(m => t.members.includes(m)))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;

      let text;
      if (reason === 'last-member') {
        if (lastMember && gs.activePlayers.includes(lastMember)) {
          text = _rp([
            `${name} is over. ${lastMember} is the last one standing — but an alliance of one isn't an alliance. It's just a person with a memory.`,
            `Everyone else from ${name} is gone. ${lastMember} carries the name alone now. It doesn't mean what it used to.`,
          ]);
        } else return;
      } else if (reason === 'betrayal') {
        const _betrayers = (betrayals || []).map(b => b.player).filter(Boolean);
        text = _rp([
          `${name} didn't survive the vote. ${_betrayers.length ? _betrayers.join(' and ') + ' broke rank' : 'Too many fractures'}. The alliance is done.`,
          `One betrayal was enough to kill ${name}. The trust was never deep enough to absorb a hit like that.`,
          `${name} is dissolved. The bonds were fragile and the vote proved it. Nobody is pretending otherwise this morning.`,
        ]);
      } else if (reason === 'bonds-collapsed') {
        text = _rp([
          `${name} is finished. The relationships inside it eroded past the point of repair. Average trust: ${avgBond || '?'}/10. That's not an alliance — that's a name on a list.`,
          `Nobody in ${name} likes each other anymore. The alliance existed in name only — and now it doesn't even have that.`,
          `The bonds inside ${name} collapsed. ${activeMembers.join(' and ')} aren't pretending to work together anymore.`,
        ]);
      } else if (reason === 'betrayals-and-low-trust') {
        text = _rp([
          `${name} is done. ${betrayalCount || '2+'} betrayals and an average bond of ${avgBond || '?'}. There's nothing left to hold together.`,
          `Too many broken promises inside ${name}. The alliance dissolved — not with a fight, but with a silence that said everything.`,
          `${name} fell apart. The betrayals stacked up and the trust ran out. ${activeMembers.join(' and ')} are on their own now.`,
        ]);
      }
      if (text) {
        ep.campEvents[_campKey].pre.push({ type: 'allianceDissolved', players: activeMembers, text, badgeText: 'Alliance Dissolved', badgeClass: 'red' });
      }
    });
  }

  // ── Alliance expulsion camp events ──
  if (gs._pendingExpulsions?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _expulsions = [...gs._pendingExpulsions];
    gs._pendingExpulsions = [];
    _expulsions.forEach(({ player, alliance, reason, remainingMembers }) => {
      if (!gs.activePlayers.includes(player)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(player))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;
      const _pr = pronouns(player);
      const _remaining = (remainingMembers || []).filter(m => gs.activePlayers.includes(m));
      const _rNames = _remaining.length <= 2 ? _remaining.join(' and ') : `${_remaining.slice(0,-1).join(', ')} and ${_remaining.at(-1)}`;
      const text = reason === 'voted against an alliance member' ? _rp([
        `${alliance} had a conversation this morning. ${player} wasn't invited. By the time ${_pr.sub} ${_pr.sub==='they'?'realized':'realized'} what was happening, ${_pr.posAdj} name was already off the list. ${_rNames} ${_remaining.length === 1 ? 'made' : 'made'} the call together.`,
        `${player} voted against ${_pr.posAdj} own alliance. ${alliance} didn't forget. This morning, ${_rNames} pulled ${_pr.obj} aside and said what everyone was thinking: "You're out."`,
        `After what ${player} did at tribal, ${alliance} cut ${_pr.obj} loose. No drama, no discussion. ${_rNames} ${_remaining.length === 1 ? 'decided' : 'decided'} — and ${player} found out after the fact.`,
      ]) : _rp([
        `${player} broke rank one too many times. ${alliance} isn't carrying that anymore. ${_rNames} closed the door.`,
        `The trust inside ${alliance} was already thin. ${player} was the reason. This morning, the rest of the group made it official: ${_pr.sub} ${_pr.sub==='they'?'are':'is'} done.`,
        `${alliance} survived — but without ${player}. The repeated betrayals forced ${_rNames} to cut ${_pr.obj} loose.`,
      ]);
      ep.campEvents[_campKey].pre.push({
        type: 'allianceExpelled',
        players: [player, ..._remaining],
        text,
        badgeText: 'EXPELLED',
        badgeClass: 'red'
      });
    });
  }

  // ── Fan Vote consequences ──
  if (gs.fanVoteWinner && gs.fanVoteEp === ((gs.episode || 0) + 1) && (phase === 'pre' || phase === 'both')) {
    const _fvWinner = gs.fanVoteWinner;
    gs.fanVoteWinner = null; // consume
    const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(_fvWinner))?.name;
    if (_campKey && ep.campEvents?.[_campKey] && gs.activePlayers.includes(_fvWinner)) {
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      const _wPr = pronouns(_fvWinner);

      // 1. Winner confidence
      ep.campEvents[_campKey].pre.push({ type: 'fanVoteWinner', players: [_fvWinner], text: _rp([
        `${_fvWinner} walks different today. The fans chose ${_wPr.obj}. Whatever that means for the game, it means something for ${_wPr.posAdj} confidence.`,
        `The fan vote landed on ${_fvWinner}. ${_wPr.Sub} ${_wPr.sub==='they'?'try':'tries'} not to let it show — but the energy at camp has shifted. Everyone noticed.`,
      ]), badgeText: 'Fan Favorite', badgeClass: 'gold' });

      // 2. Jealousy from personality-driven rivals (NOT nice archetypes)
      const _jealousArchetypes = new Set(['schemer', 'mastermind', 'hothead', 'wildcard', 'villain', 'chaos-agent']);
      gs.activePlayers.filter(p => p !== _fvWinner).forEach(p => {
        const _pArch = players.find(pl => pl.name === p)?.archetype || '';
        const _pS = pStats(p);
        // Jealousy driven by personality: low social + scheming/hotheaded archetype
        const _jealousChance = (_jealousArchetypes.has(_pArch) ? 0.40 : 0) + (10 - _pS.social) * 0.03;
        if (Math.random() < _jealousChance && getBond(p, _fvWinner) < 3) {
          addBond(p, _fvWinner, -0.3);
          ep.campEvents[_campKey].pre.push({ type: 'fanVoteJealousy', players: [p, _fvWinner], text: _rp([
            `${p} watches ${_fvWinner} celebrate the fan vote and says nothing. The silence is louder than any reaction.`,
            `${p} to the confessional: "The fans love ${_fvWinner}. Good for ${_wPr.obj}. That just tells me ${_wPr.sub} ${_wPr.sub==='they'?'win':'wins'} at the end. And I can't let that happen."`,
            `${p} doesn't care about the fans. But ${pronouns(p).sub} care${pronouns(p).sub==='they'?'':'s'} about jury votes — and fan favorite is a FTC resume line. ${_fvWinner} just became more dangerous.`,
          ]), badgeText: 'Jealousy', badgeClass: 'red' });
        }
      });

      // 3. Alliance validation — winner's allies feel good
      gs.activePlayers.filter(p => p !== _fvWinner && getBond(p, _fvWinner) >= 2).forEach(p => {
        addBond(p, _fvWinner, 0.2);
      });
    }
  }

  // ── Legacy inheritance camp events ──
  if (gs.legacyInheritances?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _legInherit = [...gs.legacyInheritances];
    gs.legacyInheritances = [];
    _legInherit.forEach(({ from, to }) => {
      if (!gs.activePlayers.includes(to)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(to))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _toPr = pronouns(to);
      ep.campEvents[_campKey].pre.push({ type: 'legacyInheritance', players: [to], text: _rp([
        `${to} finds something unexpected in ${_toPr.posAdj} bag this morning. A note from ${from}: "You'll know when to use it." The Legacy Advantage has been passed down.`,
        `${from} willed ${_toPr.posAdj} Legacy Advantage to ${to}. Production slipped it into ${_toPr.posAdj} bag overnight. ${to} unfolds the note and goes very, very quiet.`,
        `The Legacy Advantage changes hands. ${from} chose ${to} with ${_toPr.posAdj} last words. ${to} now carries a secret and a responsibility.`,
      ]), badgeText: 'Legacy Inherited', badgeClass: 'gold' });
    });
  }

  // ── Amulet power upgrade camp events ──
  if (gs.amuletUpgrades?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _amuUpgrades = [...gs.amuletUpgrades];
    gs.amuletUpgrades = [];
    _amuUpgrades.forEach(({ eliminated, remainingHolders, newPower }) => {
      remainingHolders.forEach(holder => {
        if (!gs.activePlayers.includes(holder)) return;
        const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(holder))?.name;
        if (!_campKey || !ep.campEvents[_campKey]) return;
        const _hPr = pronouns(holder);
        const _powerLabel = newPower === 'idol' ? 'Hidden Immunity Idol' : newPower === 'voteSteal' ? 'Vote Steal' : 'Extra Vote';
        ep.campEvents[_campKey].pre.push({ type: 'amuletUpgrade', players: [holder], text: _rp([
          `${holder} feels the amulet shift. With ${eliminated} gone, the power grows. It's now a ${_powerLabel}.`,
          `One fewer holder. The amulet in ${holder}'s pocket just became more dangerous. ${_powerLabel} level unlocked.`,
          `${eliminated}'s elimination changed everything for ${holder}. The amulet's power has increased — ${_hPr.sub} now ${_hPr.sub==='they'?'hold':'holds'} a ${_powerLabel}.`,
        ]), badgeText: 'Amulet Upgraded', badgeClass: 'gold' });
      });
    });
  }

  // ── Amulet holder alliance-vs-betrayal dynamics ──
  if (gs.amuletHolders?.length >= 2 && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _activeAmuletHolders = gs.advantages.filter(a => a.type === 'amulet').map(a => a.holder).filter(h => gs.activePlayers.includes(h));
    if (_activeAmuletHolders.length >= 2) {
      const _amuletCount = _activeAmuletHolders.length;
      const _powerLabel = _amuletCount >= 3 ? 'Extra Vote' : _amuletCount === 2 ? 'Vote Steal' : 'Hidden Immunity Idol';
      const _nextPower = _amuletCount >= 3 ? 'Vote Steal' : _amuletCount === 2 ? 'Hidden Immunity Idol' : null;
      for (let i = 0; i < _activeAmuletHolders.length; i++) {
        for (let j = i + 1; j < _activeAmuletHolders.length; j++) {
          const a = _activeAmuletHolders[i], b = _activeAmuletHolders[j];
          const _aPr = pronouns(a), _bPr = pronouns(b);
          const sameTribe = gs.isMerged || gs.tribes.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe) continue;
          const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(a))?.name;
          if (!_campKey || !ep.campEvents?.[_campKey]) continue;
          const _pairHash = ([...a].reduce((s,c) => s + c.charCodeAt(0), 0) + [...b].reduce((s,c) => s + c.charCodeAt(0), 0) + ep.num) % 3;
          if (_pairHash !== 0) continue;
          const bond = getBond(a, b);
          const _aS = pStats(a), _bS = pStats(b);

          if (ep.isMerge) {
            // MERGE reunion — the reckoning
            ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
              `${a} and ${b} lock eyes across the merged camp. They both know what the other is carrying. The amulet is a ${_powerLabel} now — and one of them has to go for the other to get more.`,
              `The merge brings ${a} and ${b} face to face. The shared secret hangs between them. Do they honor it — or use it against each other?`,
              `${a} pulls ${b} aside. "You know what we have. You know what happens if one of us goes." The conversation is short. The implications are not.`,
            ]), badgeText: 'Amulet Holders Meet', badgeClass: 'gold' });
            // Bond shift at merge: strategic players start seeing each other as targets
            if (_aS.strategic >= 7 || _bS.strategic >= 7) addBond(a, b, -0.3);
          } else if (bond >= 2) {
            // ── ALLIANCE PATH: working together, but the temptation is always there ──
            const _betrayalTemptation = (_aS.strategic >= 7 ? 0.15 : 0) + (_aS.loyalty <= 4 ? 0.10 : 0) + (_nextPower === 'Hidden Immunity Idol' ? 0.15 : 0.05);
            if (Math.random() < _betrayalTemptation) {
              // One of them is starting to think about it...
              const _schemer = _aS.strategic >= _bS.strategic ? a : b;
              const _target = _schemer === a ? b : a;
              const _scPr = pronouns(_schemer);
              ep.campEvents[_campKey].pre.push({ type: 'amuletBetrayal', players: [_schemer, _target], text: _rp([
                `${_schemer} and ${_target} are still working together. But ${_schemer} has been doing the math. If ${_target} goes home, the amulet becomes a ${_nextPower || 'stronger weapon'}. The alliance is real. The temptation is realer.`,
                `"We're in this together." ${_schemer} says it to ${_target} at camp. In the confessional: "I keep thinking about what happens if ${_target} leaves. The amulet upgrades. I know I shouldn't be thinking about it. But I am."`,
                `${_schemer} catches ${_scPr.ref} calculating the amulet math again. ${_target} trusts ${_scPr.obj}. That trust is the only thing standing between the alliance and the upgrade.`,
              ]), badgeText: 'Temptation', badgeClass: 'gold' });
              addBond(_schemer, _target, -0.2); // subtle erosion from the scheming
            } else {
              ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
                `${a} and ${b} check in about the amulet. Right now it's a ${_powerLabel}. Together they're stronger — and right now, that matters more than the upgrade.`,
                `"We use it together or not at all." ${a} and ${b} shake on it. For now, the pact holds.`,
                `${a} and ${b} discuss when to play the amulet. The ${_powerLabel} requires both of them to agree. Tonight? Next tribal? The decision is shared — and that's both powerful and fragile.`,
              ]), badgeText: 'Amulet Alliance', badgeClass: 'green' });
            }
          } else if (bond <= -1) {
            // ── RIVALRY PATH: actively targeting each other for the upgrade ──
            ep.campEvents[_campKey].pre.push({ type: 'amuletRivalry', players: [a, b], text: _rp([
              `${a} and ${b} both carry an amulet. Both know the other needs to go. The tribe can feel it — every conversation between them is a negotiation wrapped in a threat.`,
              `"One of us is going home eventually." ${a} said it to the confessional about ${b}. "And when they do, my amulet becomes a ${_nextPower || 'weapon'}. I can live with that."`,
              `The amulet has turned ${a} and ${b} into something worse than enemies. They're enemies with incentive. Every tribal where both survive is a tribal where neither gets stronger.`,
              `${a} is building a coalition against ${b}. Not because of the game — because of the amulet. Eliminate ${b}, upgrade to ${_nextPower || 'something better'}. It's that simple.`,
            ]), badgeText: 'Amulet Rivalry', badgeClass: 'red' });
            // Rivalry deepens the targeting
            addBond(a, b, -0.3);
          } else {
            // ── NEUTRAL PATH: sizing up, neither committing ──
            ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
              `${a} and ${b} haven't talked about the amulet in days. The silence says more than any conversation could. Both are waiting to see who moves first.`,
              `${a} watches ${b} at the fire. Fellow amulet holder. The question isn't whether to work together or turn on each other. The question is when to decide.`,
              `Neither ${a} nor ${b} has committed to the amulet alliance. Neither has betrayed it. They exist in the space between — and the game won't let them stay there forever.`,
            ]), badgeText: 'Amulet Standoff', badgeClass: '' });
          }
        }
      }
    }
  }

  // ── POST-CHALLENGE phase: fill post events with outcome-aware boosts ──
  if (phase === 'post') {
    const postBoosts = { ...boosts };
    const pb = (id, amt) => { postBoosts[id] = (postBoosts[id] || 0) + amt; };

    if (gs.phase === 'pre-merge') {
      // Different boosts per tribe based on win/loss
      gs.tribes.forEach(tribe => {
        const present = getGroupPresent(tribe);
        const isLoser = ep.loser?.name === tribe.name;
        const isWinner = ep.winner?.name === tribe.name;
        const tribeBoosts = { ...boosts };
        const tb = (id, amt) => { tribeBoosts[id] = (tribeBoosts[id] || 0) + amt; };

        if (isLoser) {
          // Going to tribal — scramble, panic, scheming
          tb('rumor', 35); tb('dispute', 30); tb('tdStrategy', 30);
          tb('eavesdrop', 25); tb('doubt', 25); tb('confessional', 25);
          tb('fight', 20); tb('leadershipClash', 15);
          tb('weirdMoment', -10); tb('prank', -15); tb('flirtation', -10);
          // High-stat players stay visible even in a scramble — strategic/social players
          // still operate in panic mode; their archetype events shouldn't be buried
          const hasStrategist = present.some(n => pStats(n).strategic >= 8);
          const hasSocialPlayer = present.some(n => pStats(n).social >= 8);
          if (hasStrategist) { tb('mastermindOrchestrates', 20); tb('schemerManipulates', 15); }
          if (hasSocialPlayer) { tb('socialBoost', 15); tb('perceptiveReads', 12); }
        } else if (isWinner) {
          // Won immunity — relief, celebration, let guard down
          tb('tdBond', 30); tb('bond', 25); tb('flirtation', 20);
          tb('prank', 20); tb('weirdMoment', 20); tb('hardWork', 15);
          tb('confessional', 15); tb('showboat', 15);
          tb('fight', -15); tb('dispute', -15); tb('rumor', -10);
        } else {
          // Safe (3+ tribes) — watching from a distance, speculating
          tb('tdBond', 20); tb('confessional', 20); tb('tdStrategy', 15);
          tb('rumor', 15); tb('eavesdrop', 10);
        }
        const total = totalForGroup(present);
        // Loser tribe gets more post-challenge events — that's where the real action is
        const postCount = isLoser
          ? Math.floor(Math.random() * 4) + Math.max(6, Math.ceil(total * 0.8))
          : Math.floor(Math.random() * 3) + Math.max(5, Math.ceil(total * 0.7));
        if (!ep.campEvents[tribe.name]) ep.campEvents[tribe.name] = { pre: [], post: [] };
        const _existingPostEvts = ep.campEvents[tribe.name].post || [];
        ep.campEvents[tribe.name].post = [..._existingPostEvts, ...generateCampEventsForGroup(present, [], tribeBoosts, postCount)];
      });
      // ── Sit-out narrative events ──
      if (ep.chalSitOuts) {
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        gs.tribes.forEach(tribe => {
          const sos     = ep.chalSitOuts[tribe.name]     || [];
          const prevSos = ep.prevChalSitOuts?.[tribe.name] || [];
          if (!sos.length && !prevSos.length) return;
          const isLoser = ep.loser?.name === tribe.name;
          if (!ep.campEvents[tribe.name]) ep.campEvents[tribe.name] = { pre: [], post: [] };
          const post = ep.campEvents[tribe.name].post;
          // Events for current sit-outs
          sos.forEach(name => {
            const _p = pronouns(name);
            const totalSitOuts = gs.sitOutCount?.[name] || 1;
            if (isLoser) {
              post.push({ type: 'sitOutHeat', text: _rp([
                `${tribe.name} comes back without a win. Eyes move to ${name}. ${_p.Sub} ${_p.sub==='they'?'were':'was'} on the bench — make of that what you will.`,
                `${name} sat this one out. ${tribe.name} lost. Those two facts are going to follow ${_p.obj} into tribal council.`,
                `The loss stings harder with someone watching from the sideline. ${name} didn't compete today, and somebody is going to bring that up.`,
              ]) });
            }
            if (totalSitOuts >= 2) {
              post.push({ type: 'sitOutRecurring', text: _rp([
                `${name} is on the bench again. The tribe keeps moving, but the pattern is being noticed.`,
                `Another sit-out for ${name}. ${_p.Sub} ${_p.sub==='they'?'don\'t':'doesn\'t'} make an issue of it — which might be the issue.`,
                `${name} has sat out more than once now. Whether it's strategy or necessity, someone is going to use it.`,
              ]) });
              if (totalSitOuts >= 3) {
                post.push({ type: 'sitOutPolitics', text: _rp([
                  `The sit-out pattern around ${name} is becoming a talking point. It doesn't take much for "liability" to become a vote target.`,
                  `${name} sitting out again gives someone an easy angle: why keep a player who doesn't compete?`,
                ]) });
              }
            }
          });
          // Players who sat out last ep but competed this ep — forced back in or eager to prove themselves
          const returnedCompetitors = prevSos.filter(m => tribe.members.includes(m) && !sos.includes(m));
          returnedCompetitors.forEach(name => {
            if (Math.random() < 0.4) {
              const _p = pronouns(name);
              post.push({ type: 'sitOutReturn', text: _rp([
                `${name} is back in the lineup today after sitting out last time. ${_p.Sub} ${_p.sub==='they'?'throw':'throws'} everything into it. The bench wasn't ${_p.posAdj} preference.`,
                `${name} competed today — couldn't sit out again. ${_p.Sub} ${_p.sub==='they'?'make':'makes'} it clear ${_p.sub} ${_p.sub==='they'?'want':'wants'} to be out there.`,
              ]) });
            }
          });
        });
      }
    } else {
      // Post-merge: lighter outcome distinction — immunity winner is safe, everyone else is at risk
      const postBoostsMerge = { ...boosts };
      const pbm = (id, amt) => { postBoostsMerge[id] = (postBoostsMerge[id] || 0) + amt; };
      pbm('tdStrategy', 20); pbm('confessional', 20); pbm('doubt', 15);
      pbm('eavesdrop', 15); pbm('rumor', 15);
      const total = totalForGroup(gs.activePlayers);
      const postCount = Math.floor(Math.random() * 3) + Math.max(5, Math.ceil(total * 0.72));
      if (!ep.campEvents.merge) ep.campEvents.merge = { pre: [], post: [] };
      const _existingMergePost = ep.campEvents.merge.post || [];
      ep.campEvents.merge.post = [..._existingMergePost, ...generateCampEventsForGroup(gs.activePlayers.filter(p => p !== gs.exileDuelPlayer), [], postBoostsMerge, postCount)];
    }

    // ── Temporary bloc alignment events (non-named alliances forming for this vote) ──
    {
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      const _namedNames = new Set((gs.namedAlliances || []).filter(a => a.active).map(a => a.name));
      (ep.alliances || []).forEach(bloc => {
        if (bloc.type === 'solo' || _namedNames.has(bloc.label)) return;
        if (!bloc.members || bloc.members.length < 2) return;
        const campKey = gs.phase === 'pre-merge'
          ? (gs.tribes.find(t => t.members.some(m => bloc.members.includes(m)))?.name || null)
          : 'merge';
        if (!campKey || !ep.campEvents[campKey]) return;
        const lead = bloc.members[0];
        const rest = bloc.members.slice(1);
        const restStr = rest.length === 1 ? rest[0] : rest.slice(0, -1).join(', ') + ' and ' + rest[rest.length - 1];
        const _p = pronouns(lead);
        ep.campEvents[campKey].post.push({ type: 'tempBloc', members: bloc.members, text: _rp([
          `${lead} and ${restStr} find themselves on the same side going into tribal. Whether it holds past tonight is a different question.`,
          `Something unspoken settles between ${lead} and ${restStr}. It isn't an alliance — not yet, maybe never. But tonight they're pointed the same direction.`,
          `${lead} pulls ${restStr} into a brief conversation. No formal names, no handshakes. Just an understanding for now.`,
          `${restStr} and ${lead} arrive at the same conclusion from different angles. That kind of alignment is fragile — but it only needs to last one night.`,
        ]) });
      });
    }

    // ── Inject guaranteed events for specific twists (post-challenge timing) ──
    const hasLovedOnes = allTwists.some(tw => tw?.type === 'loved-ones');
    if (hasLovedOnes) {
      Object.keys(ep.campEvents).forEach(campName => {
        const groupMembers = gs.phase === 'pre-merge'
          ? (gs.tribes.find(t => t.name === campName)?.members || [])
          : gs.activePlayers;
        if (!groupMembers.length) return;
        const p = groupMembers[Math.floor(Math.random() * groupMembers.length)];
        const _loP = pronouns(p);
        const loLines = [
          `${p} sees ${_loP.posAdj} loved one and completely loses it. The composure ${_loP.sub} ${_loP.sub==='they'?'have':'has'} been holding for weeks breaks in seconds.`,
          `${p} grabs ${_loP.posAdj} family and doesn't let go for a long time. The tribe looks away. Some of them are crying too.`,
          `${p} holds it together during the visit. Barely. The dam breaks the moment they leave.`,
          `Seeing home walks up to ${p} in person. ${_loP.Sub} ${_loP.sub==='they'?'keep':'keeps'} smiling. The smile doesn't reach ${_loP.posAdj} eyes.`,
        ];
        ep.campEvents[campName].post.unshift({ type: 'lovedOnes', text: loLines[Math.floor(Math.random() * loLines.length)] });
      });
    }

    const hasTheFeast = allTwists.some(tw => tw?.type === 'the-feast' || tw?.type === 'merge-reward');
    if (hasTheFeast) {
      const camp = Object.keys(ep.campEvents)[0];
      if (camp) {
        const all = gs.activePlayers;
        if (all.length >= 2) {
          const a = all[Math.floor(Math.random() * all.length)];
          const b = all.filter(p => p !== a)[Math.floor(Math.random() * (all.length - 1))];
          const ev = { type: 'feast', text: `The feast brings everyone to the same table for the first time. ${a} and ${b} end up next to each other. That conversation will matter.` };
          ep.campEvents[camp].post.unshift(ev);
        }
      }
    }

    // Survival events — provider/slacker/food crisis
    generateSurvivalEvents(ep);
    // Paranoia spiral — fires before social bomb (bond hits stack)
    checkParanoiaSpiral(ep);
    // Information broker — double agent playing both alliances
    checkInformationBroker(ep);
    // Stolen credit — bold player takes credit for another's big move
    checkStolenCredit(ep);
    // Fake idol plant — strategic player crafts and plants a fake idol
    checkFakeIdolPlant(ep);
    // Fake idol tip-off confrontation (fires next episode after tip-off)
    generateFakeIdolTipOffEvents(ep);
    generateBlackVoteGuessEvents(ep);
    // Social bomb check — fires before alliance quitting (bond hits can trigger quitting)
    checkSocialBomb(ep);
    // Alliance quitting evaluated once after all events are done, then recruitment (scenarios A + B)
    checkAllianceQuitting(ep);
    checkAllianceRecruitment(ep);
    // Goat targeting: merge recognition + late-game FTC threat reassessment
    checkGoatTargeting(ep);
  }

  // ── 'both' phase: no pre/post distinction (no-tribal, finale) — just one block ──
  if (phase === 'both') {
    generateSurvivalEvents(ep);
    checkParanoiaSpiral(ep);
    checkInformationBroker(ep);
    checkStolenCredit(ep);
    checkFakeIdolPlant(ep);
    generateFakeIdolTipOffEvents(ep);
    generateBlackVoteGuessEvents(ep);
    // Social bomb + alliance quitting + recruitment after the single-phase generation
    checkSocialBomb(ep);
    checkAllianceQuitting(ep);
    checkAllianceRecruitment(ep);
    checkGoatTargeting(ep);
  }

  // ── Slow burn sparks: grow/decay spark intensity before showmance formation ──
  updateRomanticSparks(ep);
  // ── First move: fire when spark intensity crosses archetype threshold ──
  checkFirstMove(ep);
  // ── Showmance sabotage: villain/schemer engineers romantic crisis to destroy a couple ──
  checkShowmanceSabotage(ep);
  // ── Showmance formation: check all pairs after bonds are updated this episode ──
  checkShowmanceFormation(ep);
  // ── Showmance lifecycle: progress phases, generate phase-specific events ──
  updateShowmancePhases(ep);
  // ── Love triangle: detect 3-way romantic tension + progress phases ──
  checkLoveTriangleFormation(ep);
  updateLoveTrianglePhases(ep);
  // ── Secret affairs: progress exposure tiers ──
  updateAffairExposure(ep);
}

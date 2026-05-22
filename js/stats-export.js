// ══════════════════════════════════════════════════════════════════════
// stats-export.js — Per-player data extraction for end-of-season export
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from './core.js';
import { pStats } from './players.js';
import { bKey, getBond } from './bonds.js';

// ── Helpers ──────────────────────────────────────────────────────────

function _slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function _allPlayerNames() {
  return players.map(p => p.name);
}

// ── 1. Placements ────────────────────────────────────────────────────
// Walks episodeHistory to build elimination order, derives placement
// numbers and phase labels (Winner / Finalist / Juror / Pre-Juror / Pre-Merge).

function _extractPlayerPlacements() {
  const history = gs.episodeHistory || [];
  const allNames = _allPlayerNames();
  const jury = gs.jury || [];
  const finale = gs.finaleResult || {};
  const winner = finale.winner || null;
  const finalists = finale.finalists || [];
  const juryVotes = finale.votes || {}; // {name: voteCount}

  // Build elimination order (earliest eliminated first)
  const elimOrder = [];
  for (const ep of history) {
    // Sudden-death eliminations
    if (ep.suddenDeathEliminated && !elimOrder.includes(ep.suddenDeathEliminated)) {
      elimOrder.push(ep.suddenDeathEliminated);
    }
    // Triple-dog-dare / slasher eliminations
    if (ep.eliminated && !elimOrder.includes(ep.eliminated)) {
      elimOrder.push(ep.eliminated);
    }
    // First eliminated in double-elim
    if (ep.firstEliminated && !elimOrder.includes(ep.firstEliminated)) {
      elimOrder.push(ep.firstEliminated);
    }
    // Tied destinies collateral
    if (ep.tiedDestiniesCollateral && !elimOrder.includes(ep.tiedDestiniesCollateral)) {
      elimOrder.push(ep.tiedDestiniesCollateral);
    }
  }

  // Finalists sorted by jury votes (winner first, then by vote count desc)
  const sortedFinalists = [...finalists].sort((a, b) => {
    if (a === winner) return -1;
    if (b === winner) return 1;
    return (juryVotes[b] || 0) - (juryVotes[a] || 0);
  });

  // Determine merge episode (first episode where isMerge is true)
  let mergeEpNum = Infinity;
  for (const ep of history) {
    if (ep.isMerge) { mergeEpNum = ep.num; break; }
  }

  // Build placement map: 1 = winner, 2+ = finalists, then reverse elim order
  const placements = {};
  let place = 1;

  // Winner + finalists
  for (const name of sortedFinalists) {
    placements[name] = { placement: place, phase: place === 1 ? 'Winner' : 'Finalist' };
    place++;
  }

  // Eliminated players in reverse order (last eliminated = next best placement)
  for (let i = elimOrder.length - 1; i >= 0; i--) {
    const name = elimOrder[i];
    if (placements[name]) continue; // already placed as finalist

    // Determine phase
    const elimEp = history.find(ep =>
      ep.eliminated === name || ep.firstEliminated === name ||
      ep.suddenDeathEliminated === name || ep.tiedDestiniesCollateral === name
    );
    const elimEpNum = elimEp?.num || 0;
    let phase;
    if (jury.includes(name)) {
      phase = 'Juror';
    } else if (elimEpNum >= mergeEpNum) {
      phase = 'Pre-Juror';
    } else {
      phase = 'Pre-Merge';
    }

    placements[name] = { placement: place, phase };
    place++;
  }

  // Any remaining players not in elimOrder or finalists (edge case: still active)
  for (const name of allNames) {
    if (!placements[name]) {
      placements[name] = { placement: place, phase: 'Unknown' };
      place++;
    }
  }

  return { placements, elimOrder, sortedFinalists, winner, juryVotes };
}

// ── 2. Voting Data ───────────────────────────────────────────────────
// Per-player vote details: who voted for them each episode, who they voted for.

function _extractVotingData(name) {
  const history = gs.episodeHistory || [];
  const votesReceivedDetail = [];
  const votesCast = [];
  let totalVotesReceived = 0;

  for (const ep of history) {
    const log = ep.votingLog || [];
    if (!log.length) continue;

    // Votes received this episode
    const votersThisEp = log.filter(v => v.voted === name).map(v => v.voter);
    if (votersThisEp.length > 0) {
      votesReceivedDetail.push({ ep: ep.num, voters: votersThisEp, total: votersThisEp.length });
      totalVotesReceived += votersThisEp.length;
    }

    // Votes cast by this player
    const castEntry = log.find(v => v.voter === name);
    if (castEntry) {
      votesCast.push({ ep: ep.num, target: castEntry.voted, reason: castEntry.reason || null });
    }
  }

  return { votesReceivedDetail, votesCast, totalVotesReceived };
}

// ── 3. Challenge Data ────────────────────────────────────────────────
// Per-player challenge scores, immunity/reward wins, challenge record.

function _extractChallengeData(name) {
  const history = gs.episodeHistory || [];
  const challengeScores = [];
  let immunityWins = 0;
  let rewardWins = 0;

  for (const ep of history) {
    // Challenge member scores
    const score = ep.chalMemberScores?.[name];
    if (score !== undefined && score !== null) {
      const placement = (ep.chalPlacements || []).indexOf(name);
      challengeScores.push({
        ep: ep.num,
        score,
        placement: placement >= 0 ? placement + 1 : null,
        type: ep.challengeType || null,
        label: ep.challengeLabel || null
      });
    }

    // Immunity wins
    if (ep.immunityWinner === name) {
      immunityWins++;
    }

    // Reward wins (from rewardChalData)
    if (ep.rewardChalData?.winner === name) {
      rewardWins++;
    }
  }

  const chalRecord = gs.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0, appearances: 0 };

  return { challengeScores, immunityWins, rewardWins, chalRecord: { ...chalRecord } };
}

// ── 4. Bond Data ─────────────────────────────────────────────────────
// Final bonds with all other players + bond evolution over episodes.

function _extractBondData(name) {
  const allNames = _allPlayerNames();
  const history = gs.episodeHistory || [];

  // Final bonds
  const bondsFinal = {};
  for (const other of allNames) {
    if (other === name) continue;
    bondsFinal[other] = getBond(name, other);
  }

  // Bond evolution from gsSnapshots
  const bondsEvolution = {};
  for (const other of allNames) {
    if (other === name) continue;
    const key = bKey(name, other);
    const arc = [];
    for (const ep of history) {
      const snap = ep.gsSnapshot;
      if (!snap?.bonds) continue;
      const val = snap.bonds[key];
      if (val !== undefined) {
        arc.push({ ep: ep.num, bond: val });
      }
    }
    if (arc.length > 0) {
      bondsEvolution[other] = arc;
    }
  }

  return { bondsFinal, bondsEvolution };
}

// ── 5. Advantage Data ────────────────────────────────────────────────
// Advantage lifecycle: found, played, stolen, inherited. Idol plays. SITD usage.

function _extractAdvantageData(name) {
  const history = gs.episodeHistory || [];

  // Current/final advantages held
  const held = (gs.advantages || []).filter(a => a.holder === name).map(a => ({
    type: a.type,
    foundEp: a.foundEp ?? null,
    inheritedFrom: a.inheritedFrom || null,
    source: a.source || null
  }));

  // Idol plays across episodes
  const plays = [];
  for (const ep of history) {
    const epPlays = ep.idolPlays || [];
    for (const play of epPlays) {
      if (play.player === name) {
        plays.push({
          ep: ep.num,
          type: play.type || 'idol',
          playedFor: play.playedFor || name,
          votesNegated: play.votesNegated || 0,
          misplay: play.misplay || false,
          failed: play.failed || false,
          fake: play.fake || false
        });
      }
    }
  }

  // Idol finds across episodes
  const finds = [];
  for (const ep of history) {
    const epFinds = ep.idolFinds || [];
    for (const find of epFinds) {
      if (find.player === name || find.finder === name) {
        finds.push({
          ep: ep.num,
          type: find.type || 'idol',
          source: find.source || null
        });
      }
    }
  }

  // Shot in the dark usage
  const sitdSet = gs.shotInDarkUsed;
  let usedSITD = false;
  if (sitdSet instanceof Set) {
    usedSITD = sitdSet.has(name);
  } else if (Array.isArray(sitdSet)) {
    usedSITD = sitdSet.includes(name);
  }

  return { held, plays, finds, usedSITD };
}

// ── 6. Social Data ───────────────────────────────────────────────────
// Schemes launched/targeted, camp events involved in, showmance data,
// emotional arc, popularity arc.

function _extractSocialData(name) {
  const history = gs.episodeHistory || [];

  // Schemes launched and targeted
  const schemesLaunched = [];
  const schemesTargeted = [];
  const campEventsInvolved = [];

  for (const ep of history) {
    const campEvents = ep.campEvents;
    if (!campEvents) continue;

    // campEvents structure: { tribeKey: { pre: [...], post: [...] } }
    for (const tribeKey of Object.keys(campEvents)) {
      const phases = campEvents[tribeKey];
      if (!phases || typeof phases !== 'object') continue;

      for (const phaseKey of ['pre', 'post']) {
        const events = phases[phaseKey];
        if (!Array.isArray(events)) continue;

        for (const evt of events) {
          // Check if player is involved
          const involved = (evt.players || []).includes(name);
          if (!involved && evt.schemer !== name && evt.target !== name) continue;

          campEventsInvolved.push({
            ep: ep.num,
            tribeKey,
            phase: phaseKey,
            text: evt.badgeText || evt.text || '',
            badgeClass: evt.badgeClass || null,
            players: evt.players || []
          });

          // Scheme tracking
          if (evt.schemer === name) {
            schemesLaunched.push({
              ep: ep.num,
              schemeType: evt.schemeType || 'unknown',
              target: evt.target || null
            });
          }
          if (evt.target === name && evt.schemer) {
            schemesTargeted.push({
              ep: ep.num,
              schemeType: evt.schemeType || 'unknown',
              schemer: evt.schemer
            });
          }
        }
      }
    }
  }

  // Showmance data
  const showmanceData = (gs.showmances || [])
    .filter(sh => sh.players?.includes(name))
    .map(sh => ({
      partner: sh.players.find(p => p !== name),
      sparkEp: sh.sparkEp ?? null,
      phase: sh.phase || null,
      intensity: sh.intensity ?? null,
      broken: sh.broken || false,
      breakupEp: sh.breakupEp ?? null
    }));

  // Emotional arc from playerStates
  const emotionalArc = [];
  for (const ep of history) {
    const snap = ep.gsSnapshot;
    const state = snap?.playerStates?.[name];
    if (state?.emotional) {
      emotionalArc.push({ ep: ep.num, emotional: state.emotional });
    }
  }

  // Popularity arc
  let popularityArc = [];
  if (gs.popularityArcs?.[name]) {
    popularityArc = gs.popularityArcs[name].map(entry => ({
      ep: entry.ep, delta: entry.delta, score: entry.score
    }));
  } else {
    // Fallback: build from gsSnapshot.popularity
    for (const ep of history) {
      const snap = ep.gsSnapshot;
      const pop = snap?.popularity?.[name];
      if (pop !== undefined) {
        popularityArc.push({ ep: ep.num, score: pop, delta: null });
      }
    }
  }

  // Love triangles
  const loveTriangles = (gs.loveTriangles || [])
    .filter(lt => lt.players?.includes(name) || lt.center === name)
    .map(lt => ({ ...lt }));

  // Affairs
  const affairs = (gs.affairs || [])
    .filter(a => a.players?.includes(name))
    .map(a => ({ ...a }));

  return {
    schemesLaunched,
    schemesTargeted,
    campEventsInvolved,
    showmanceData,
    emotionalArc,
    popularityArc,
    loveTriangles,
    affairs
  };
}

// ── 7. Blindside Data ────────────────────────────────────────────────
// Counts blindsides received (eliminated when alliance members voted against)
// and orchestrated (voted to eliminate someone whose allies voted for them).

function _extractBlindsideData(name) {
  const history = gs.episodeHistory || [];
  const alliances = gs.namedAlliances || [];
  let blindsidesReceived = 0;
  let blindsidesOrchestrated = 0;

  for (const ep of history) {
    const log = ep.votingLog || [];
    if (!log.length) continue;

    // Blindside received: player was eliminated and at least one alliance
    // member voted against them
    if (ep.eliminated === name) {
      const votersAgainst = log.filter(v => v.voted === name).map(v => v.voter);
      const myAlliances = alliances.filter(a => a.members?.includes(name));
      const betrayedBy = votersAgainst.filter(voter =>
        myAlliances.some(a => a.members.includes(voter))
      );
      if (betrayedBy.length > 0) {
        blindsidesReceived++;
      }
    }

    // Blindside orchestrated: player voted for the eliminated person, and
    // the eliminated person had alliance members who voted against them
    if (ep.eliminated && ep.eliminated !== name) {
      const votedForElim = log.some(v => v.voter === name && v.voted === ep.eliminated);
      if (votedForElim) {
        const elimAlliances = alliances.filter(a => a.members?.includes(ep.eliminated));
        const allyVotersAgainst = log
          .filter(v => v.voted === ep.eliminated && v.voter !== name)
          .filter(v => elimAlliances.some(a => a.members.includes(v.voter)));
        if (allyVotersAgainst.length > 0) {
          blindsidesOrchestrated++;
        }
      }
    }
  }

  return { blindsidesReceived, blindsidesOrchestrated };
}

// ── 8. Main Combiner ─────────────────────────────────────────────────
// Combines all sub-extractors for every player into a single export object.

function _extractPlayerData() {
  const { placements, elimOrder, sortedFinalists, winner, juryVotes } = _extractPlayerPlacements();
  const allNames = _allPlayerNames();
  const alliances = gs.namedAlliances || [];
  const playerData = {};

  for (const name of allNames) {
    const p = players.find(pl => pl.name === name);
    const stats = pStats(name);
    const placementInfo = placements[name] || { placement: null, phase: 'Unknown' };
    const voting = _extractVotingData(name);
    const challenge = _extractChallengeData(name);
    const bonds = _extractBondData(name);
    const advantages = _extractAdvantageData(name);
    const social = _extractSocialData(name);
    const blindside = _extractBlindsideData(name);

    // Alliances this player belongs to
    const playerAlliances = alliances
      .filter(a => a.members?.includes(name))
      .map(a => ({
        name: a.name,
        members: [...(a.members || [])],
        formed: a.formed ?? null,
        active: a.active || false,
        betrayals: (a.betrayals || []).filter(b => b.betrayer === name || b.victim === name)
      }));

    // Rivalries: negative bonds <= -3
    const rivalries = [];
    for (const [other, bond] of Object.entries(bonds.bondsFinal)) {
      if (bond <= -3) {
        rivalries.push({ player: other, bond });
      }
    }

    // Survival score
    const survivalScore = gs.survival?.[name] ?? null;

    // Jury votes received (finalists only)
    const juryVotesReceived = juryVotes?.[name] ?? 0;

    // Idols found count
    const idolsFound = advantages.finds.filter(f => f.type === 'idol' || f.type === 'beware').length;

    // Mole status
    const isMole = (gs.moles || []).some(m => m.name === name || m.player === name);

    playerData[name] = {
      playerSlug: _slug(name),
      placement: placementInfo.placement,
      phase: placementInfo.phase,
      archetype: p?.archetype || null,
      stats: { ...stats },

      // Challenge
      challengeScores: challenge.challengeScores,
      immunityWins: challenge.immunityWins,
      rewardWins: challenge.rewardWins,
      chalRecord: challenge.chalRecord,

      // Voting
      totalVotesReceived: voting.totalVotesReceived,
      votesReceivedDetail: voting.votesReceivedDetail,
      votesCast: voting.votesCast,

      // Blindsides
      blindsidesReceived: blindside.blindsidesReceived,
      blindsidesOrchestrated: blindside.blindsidesOrchestrated,

      // Bonds
      bondsFinal: bonds.bondsFinal,
      bondsEvolution: bonds.bondsEvolution,

      // Advantages
      idolsFound,
      advantageLifecycle: {
        held: advantages.held,
        plays: advantages.plays,
        finds: advantages.finds,
        usedSITD: advantages.usedSITD
      },

      // Social
      showmanceData: social.showmanceData,
      emotionalArc: social.emotionalArc,
      popularityArc: social.popularityArc,
      campEventsInvolved: social.campEventsInvolved,
      schemesLaunched: social.schemesLaunched,
      schemesTargeted: social.schemesTargeted,
      loveTriangles: social.loveTriangles,
      affairs: social.affairs,

      // Alliances & rivalries
      alliances: playerAlliances,
      rivalries,

      // Misc
      survivalScore,
      juryVotes: juryVotesReceived,
      isMole
    };
  }

  return {
    playerData,
    placements,
    elimOrder,
    ftcVotes: juryVotes,
    winner,
    finalists: sortedFinalists
  };
}

// ══════════════════════════════════════════════════════════════════════
// Season-Level Aggregators (Task 2)
// ══════════════════════════════════════════════════════════════════════

// ── 9. Season Stats ─────────────────────────────────────────────────

function _extractSeasonStats() {
  const history = gs.episodeHistory || [];

  let totalTribalCouncils = 0;
  let totalVotesCast = 0;
  let totalBlowups = 0;
  let totalIdolsPlayed = 0;
  let totalBlindsides = 0;

  for (const ep of history) {
    // Count episodes with an elimination as tribal councils
    if (ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated) {
      totalTribalCouncils++;
    }

    // Sum all voting log entries
    const log = ep.votingLog || [];
    totalVotesCast += log.length;

    // Count blowups
    if (ep.tribalBlowup) {
      totalBlowups++;
    }

    // Count idol plays
    const plays = ep.idolPlays || [];
    totalIdolsPlayed += plays.length;

    // Count blindsides: elimination where alliance members voted against
    const eliminated = ep.eliminated;
    if (eliminated && log.length > 0) {
      const snap = ep.gsSnapshot || {};
      const snapAlliances = snap.namedAlliances || [];
      const votersAgainst = log.filter(v => v.voted === eliminated).map(v => v.voter);
      const elimAlliances = snapAlliances.filter(a => a.members?.includes(eliminated));
      const allyBetrayers = votersAgainst.filter(voter =>
        elimAlliances.some(a => a.members.includes(voter))
      );
      if (allyBetrayers.length > 0) {
        totalBlindsides++;
      }
    }
  }

  // Idols found (excluding inherited)
  const totalIdolsFound = (gs.advantages || [])
    .filter(a => !a.inheritedFrom)
    .length;

  const totalShowmances = (gs.showmances || []).length;
  const totalBreakups = (gs.showmances || []).filter(sh => sh.broken).length;

  return {
    totalTribalCouncils,
    totalVotesCast,
    totalBlowups,
    totalIdolsFound,
    totalIdolsPlayed,
    totalShowmances,
    totalBreakups,
    totalBlindsides
  };
}

// ── 10. Vote Matrix ─────────────────────────────────────────────────

function _extractVoteMatrix() {
  const history = gs.episodeHistory || [];
  const matrix = {};

  for (const ep of history) {
    const log = ep.votingLog || [];
    if (!log.length) continue;

    const votes = {};
    for (const v of log) {
      votes[v.voter] = v.voted;
    }

    matrix[ep.num] = {
      votes,
      eliminated: ep.eliminated || null
    };
  }

  return matrix;
}

// ── 11. Bond Heatmap ────────────────────────────────────────────────

function _extractBondHeatmap() {
  const allNames = _allPlayerNames();
  const heatmap = {};

  for (let i = 0; i < allNames.length; i++) {
    for (let j = i + 1; j < allNames.length; j++) {
      const a = allNames[i];
      const b = allNames[j];
      const val = getBond(a, b);
      if (val !== 0) {
        heatmap[bKey(a, b)] = val;
      }
    }
  }

  return heatmap;
}

// ── 12. Alliance Timeline ───────────────────────────────────────────

function _extractAllianceTimeline() {
  const timeline = [];

  // Active alliances
  const active = gs.namedAlliances || [];
  for (const a of active) {
    timeline.push({
      name: a.name,
      members: [...(a.members || [])],
      formedEp: a.formed ?? null,
      dissolvedEp: null,
      active: true,
      betrayals: a.betrayals || [],
      permanence: a.permanence ?? null
    });
  }

  // Dissolved alliances
  const dissolved = gs.allianceDissolutions || [];
  for (const d of dissolved) {
    timeline.push({
      name: d.name,
      members: [...(d.members || [])],
      formedEp: null,
      dissolvedEp: d.ep ?? null,
      active: false,
      betrayals: d.betrayals || [],
      reason: d.reason || null
    });
  }

  return timeline;
}

// ── 13. Challenge Breakdown ─────────────────────────────────────────

function _extractChallengeBreakdown() {
  const history = gs.episodeHistory || [];
  const breakdown = {};

  for (const ep of history) {
    const style = ep.chalStyle || ep.challengeCategory || null;
    if (!style) continue;

    if (!breakdown[style]) {
      breakdown[style] = { count: 0, winners: [] };
    }
    breakdown[style].count++;

    // Individual immunity winner
    if (ep.immunityWinner) {
      breakdown[style].winners.push(ep.immunityWinner);
    }
    // Pre-merge tribe winner
    if (ep.winner && typeof ep.winner === 'object' && ep.winner.tribeName) {
      breakdown[style].winners.push(ep.winner.tribeName);
    } else if (ep.winner && typeof ep.winner === 'string') {
      breakdown[style].winners.push(ep.winner);
    }
  }

  return breakdown;
}

// ── 14. Mole Activity ───────────────────────────────────────────────

function _extractMoleActivity() {
  const moles = gs.moles || [];
  if (!moles.length) return null;

  return moles.map(m => ({
    player: m.player || m.name,
    sabotageCount: m.sabotageCount || 0,
    sabotageLog: m.sabotageLog || [],
    exposed: m.exposed || false,
    exposedEp: m.exposedEp ?? null,
    active: m.active || false,
    layingLow: m.layingLow || false
  }));
}

// ── 15. Auto Awards ─────────────────────────────────────────────────

function _computeAutoAwards(playerData) {
  const awards = {};
  const names = Object.keys(playerData);
  const history = gs.episodeHistory || [];

  // Most challenge wins
  let maxWins = 0;
  let mostWinsPlayer = null;
  for (const name of names) {
    const wins = playerData[name].chalRecord?.wins || 0;
    if (wins > maxWins) {
      maxWins = wins;
      mostWinsPlayer = name;
    }
  }
  awards.mostChallengeWins = mostWinsPlayer
    ? { player: mostWinsPlayer, wins: maxWins }
    : null;

  // Fan favorite — highest popularity
  const pop = gs.popularity || {};
  let maxPop = -Infinity;
  let fanFav = null;
  for (const name of names) {
    const score = pop[name] || 0;
    if (score > maxPop) {
      maxPop = score;
      fanFav = name;
    }
  }
  awards.fanFavorite = fanFav
    ? { player: fanFav, score: maxPop }
    : null;

  // Best social game — highest average final bond
  let bestAvg = -Infinity;
  let bestSocial = null;
  for (const name of names) {
    const bonds = playerData[name].bondsFinal || {};
    const vals = Object.values(bonds);
    if (!vals.length) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestSocial = name;
    }
  }
  awards.bestSocialGame = bestSocial
    ? { player: bestSocial, avgBond: Math.round(bestAvg * 100) / 100 }
    : null;

  // Biggest blindside — elimination with most ally-voters
  let maxAllyVoters = 0;
  let biggestBlindside = null;
  for (const ep of history) {
    const eliminated = ep.eliminated;
    const log = ep.votingLog || [];
    if (!eliminated || !log.length) continue;

    const snap = ep.gsSnapshot || {};
    const snapAlliances = snap.namedAlliances || [];
    const votersAgainst = log.filter(v => v.voted === eliminated).map(v => v.voter);
    const elimAlliances = snapAlliances.filter(a => a.members?.includes(eliminated));
    const allyBetrayers = votersAgainst.filter(voter =>
      elimAlliances.some(a => a.members.includes(voter))
    );
    if (allyBetrayers.length > maxAllyVoters) {
      maxAllyVoters = allyBetrayers.length;
      biggestBlindside = {
        player: eliminated,
        ep: ep.num,
        allyVotersAgainst: allyBetrayers.length,
        betrayers: allyBetrayers
      };
    }
  }
  awards.biggestBlindside = biggestBlindside;

  // Best villain — villain/mastermind/schemer with most schemes + deepest run
  const villainArchetypes = ['villain', 'mastermind', 'schemer'];
  let bestVillainScore = -Infinity;
  let bestVillainPlayer = null;
  for (const name of names) {
    const pd = playerData[name];
    if (!villainArchetypes.includes(pd.archetype)) continue;
    // Score: schemes launched count + inverse placement (deeper run = higher)
    const schemeCount = pd.schemesLaunched?.length || 0;
    const placementBonus = names.length - (pd.placement || names.length);
    const score = schemeCount + placementBonus;
    if (score > bestVillainScore) {
      bestVillainScore = score;
      bestVillainPlayer = name;
    }
  }
  awards.bestVillain = bestVillainPlayer
    ? {
        player: bestVillainPlayer,
        schemes: playerData[bestVillainPlayer].schemesLaunched?.length || 0,
        placement: playerData[bestVillainPlayer].placement,
        description: '[AI_FILL]'
      }
    : null;

  // Best underdog — top half by placement with worst early challenge scores
  const totalPlayers = names.length;
  const topHalfCutoff = Math.ceil(totalPlayers / 2);
  const topHalfPlayers = names.filter(n => (playerData[n].placement || Infinity) <= topHalfCutoff);

  let worstEarlyAvg = Infinity;
  let bestUnderdogPlayer = null;
  for (const name of topHalfPlayers) {
    const scores = playerData[name].challengeScores || [];
    // Early = first 3 challenge appearances
    const earlyScores = scores.slice(0, 3).map(s => s.score);
    if (!earlyScores.length) continue;
    const avg = earlyScores.reduce((s, v) => s + v, 0) / earlyScores.length;
    if (avg < worstEarlyAvg) {
      worstEarlyAvg = avg;
      bestUnderdogPlayer = name;
    }
  }
  awards.bestUnderdog = bestUnderdogPlayer
    ? {
        player: bestUnderdogPlayer,
        placement: playerData[bestUnderdogPlayer].placement,
        earlyAvgScore: Math.round(worstEarlyAvg * 100) / 100,
        description: '[AI_FILL]'
      }
    : null;

  // Most dramatic — player with most camp events involved
  let maxEvents = 0;
  let mostDramaticPlayer = null;
  for (const name of names) {
    const count = playerData[name].campEventsInvolved?.length || 0;
    if (count > maxEvents) {
      maxEvents = count;
      mostDramaticPlayer = name;
    }
  }
  awards.mostDramatic = mostDramaticPlayer
    ? {
        player: mostDramaticPlayer,
        eventCount: maxEvents,
        description: '[AI_FILL]'
      }
    : null;

  return awards;
}

// ══════════════════════════════════════════════════════════════════════
// Public API — Export Functions (Task 3)
// ══════════════════════════════════════════════════════════════════════

// ── Download helper ─────────────────────────────────────────────────

function _downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 15. extractSeasonRawStats ───────────────────────────────────────

export function extractSeasonRawStats() {
  if (!gs || !gs.episodeHistory || gs.episodeHistory.length === 0) {
    return { error: 'No season data to export. Run a full season first.' };
  }
  if (!players || players.length === 0) {
    return { error: 'No players loaded.' };
  }
  const { playerData, placements, elimOrder, ftcVotes, winner, finalists } = _extractPlayerData();
  const seasonStats = _extractSeasonStats();
  const voteMatrix = _extractVoteMatrix();
  const bondHeatmap = _extractBondHeatmap();
  const allianceTimeline = _extractAllianceTimeline();
  const challengeTypeBreakdown = _extractChallengeBreakdown();
  const moleActivity = _extractMoleActivity();
  const autoAwards = _computeAutoAwards(playerData);

  // Build finalists array with jury vote counts
  const finalistData = (finalists || []).map(name => ({
    name,
    playerSlug: _slug(name),
    placement: placements[name]?.placement ?? null,
    juryVotes: ftcVotes?.[name] ?? 0
  }));

  // Build elimination order array
  const eliminationOrder = (elimOrder || []).map(e => ({
    name: e.name,
    ep: e.ep ?? null,
    voteCount: e.voteCount ?? 0,
    blindside: e.blindside || false
  }));

  const history = gs.episodeHistory || [];
  const castSize = _allPlayerNames().length;
  const episodeCount = history.length;
  const jurySize = history.filter(ep => ep.phase === 'Juror' || ep.isJuryPhase).length > 0
    ? (gs.jury || []).length
    : 0;

  // Clean showmance data
  const showmances = (gs.showmances || []).map(sh => ({
    pair: [sh.a, sh.b],
    formedEp: sh.formedEp ?? null,
    broken: sh.broken || false,
    brokenEp: sh.brokenEp ?? null,
    intensity: sh.intensity ?? 0,
    reason: sh.reason ?? null
  }));

  // Clean love triangle data
  const loveTriangles = (gs.loveTriangles || []).map(lt => ({
    players: lt.players || [lt.a, lt.b, lt.c].filter(Boolean),
    formedEp: lt.formedEp ?? null,
    resolved: lt.resolved || false
  }));

  return {
    seasonNumber: seasonConfig?.seasonNumber || 0,
    castSize,
    episodeCount,
    jurySize,
    winner,
    finalists: finalistData,
    eliminationOrder,
    players: playerData,
    seasonStats,
    voteMatrix,
    bondHeatmap,
    allianceTimeline,
    challengeTypeBreakdown,
    moleActivity,
    autoAwards,
    riData: {
      players: gs.riPlayers || [],
      duelHistory: gs.riDuelHistory || [],
      lifeEvents: gs.riLifeEvents || [],
      quits: gs.riQuits || []
    },
    showmances,
    loveTriangles
  };
}

// ── 16. extractSeasonTemplate ───────────────────────────────────────

export function extractSeasonTemplate() {
  const rawStats = extractSeasonRawStats();
  const finale = gs.finaleResult || {};

  // Build winner vote string (e.g., "5-3-0")
  const voteStr = finale.finalVote || (() => {
    if (!finale.votes) return '';
    const counts = Object.values(finale.votes).sort((a, b) => b - a);
    return counts.join('-');
  })();

  // Runner-up(s): non-winner finalists joined with ' & '
  const runnerUp = rawStats.finalists.filter(f => f.name !== rawStats.winner).map(f => f.name).join(' & ') || null;

  // Build placements array sorted by placement
  const allNames = Object.keys(rawStats.players);
  const sortedPlacements = allNames
    .map(name => {
      const pd = rawStats.players[name];
      return {
        placement: pd.placement,
        name,
        playerSlug: pd.playerSlug,
        phase: pd.phase,
        notes: '[AI_FILL]',
        strategicRank: '[AI_FILL]',
        story: '[AI_FILL]',
        gameplayStyle: '[AI_FILL]',
        keyMoments: '[AI_FILL]',
        challengeWins: pd.chalRecord?.wins || 0,
        immunityWins: pd.immunityWins,
        rewardWins: pd.rewardWins,
        idolsFound: pd.idolsFound,
        votesReceived: pd.totalVotesReceived,
        alliances: pd.alliances.map(a => a.name),
        rivalries: pd.rivalries.map(r => r.player)
      };
    })
    .sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));

  // Build finalists for template
  const finalistTemplate = rawStats.finalists.map(f => ({
    name: f.name,
    playerSlug: f.playerSlug,
    placement: f.placement,
    votes: f.juryVotes
  }));

  return {
    seasonNumber: rawStats.seasonNumber,
    title: '[AI_FILL]',
    subtitle: '[AI_FILL]',
    castSize: rawStats.castSize,
    episodeCount: rawStats.episodeCount,
    jurySize: rawStats.jurySize,
    winner: {
      name: rawStats.winner,
      playerSlug: _slug(rawStats.winner || ''),
      vote: voteStr,
      runnerUp,
      keyStats: '[AI_FILL]',
      strategy: '[AI_FILL]',
      legacy: '[AI_FILL]'
    },
    finalists: finalistTemplate,
    placements: sortedPlacements,
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]'
  };
}

// ── 17. Database Merge Functions ────────────────────────────────────
// Fetch existing databases and merge new season data into them.

function _mergeFranchiseDatabase(existing, rawStats, template) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  // Update franchise stats
  db.franchiseStats.totalSeasons = seasonNum;
  db.franchiseStats.totalEpisodes = (db.franchiseStats.totalEpisodes || 0) + rawStats.episodeCount;
  db.franchiseStats.totalAppearances = (db.franchiseStats.totalAppearances || 0) + rawStats.castSize;
  db.franchiseStats.lastUpdated = new Date().toISOString().split('T')[0];

  // Add champion entry (skip if season already exists)
  if (!db.champions) db.champions = [];
  if (!db.champions.some(c => c.season === seasonNum)) {
    const winnerData = rawStats.players[rawStats.winner] || {};
    db.champions.push({
      season: seasonNum,
      seasonTitle: template.title || `Season ${seasonNum}`,
      emoji: '',
      winner: rawStats.winner,
      playerSlug: _slug(rawStats.winner),
      finalVote: template.winner?.vote || '',
      runnerUp: template.winner?.runnerUp || '',
      keyStats: template.winner?.keyStats || '[AI_FILL]',
      strategy: template.winner?.strategy || '[AI_FILL]',
      legacy: template.winner?.legacy || '[AI_FILL]'
    });
  }

  // Update records
  if (!db.records) db.records = {};
  if (!db.records.challengeRecords) db.records.challengeRecords = {};
  if (!db.records.votingRecords) db.records.votingRecords = {};

  // Most challenge wins this season
  const chalWinners = Object.entries(rawStats.players)
    .map(([name, d]) => ({ name, wins: d.chalRecord?.wins || 0 }))
    .sort((a, b) => b.wins - a.wins);
  if (chalWinners[0]?.wins > 0) {
    const current = db.records.challengeRecords.mostChallengeWins;
    if (!current || chalWinners[0].wins > (current.wins || 0)) {
      db.records.challengeRecords.mostChallengeWins = {
        name: chalWinners[0].name,
        playerSlug: _slug(chalWinners[0].name),
        wins: chalWinners[0].wins,
        season: seasonNum
      };
    }
  }

  // Fan favorites
  if (!db.fanFavorites) db.fanFavorites = [];
  if (rawStats.autoAwards?.fanFavorite?.player) {
    db.fanFavorites.push({
      season: seasonNum,
      name: rawStats.autoAwards.fanFavorite.player,
      playerSlug: _slug(rawStats.autoAwards.fanFavorite.player)
    });
  }

  return db;
}

function _mergePlayersDatabase(existing, rawStats) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  if (!db.players) db.players = [];

  for (const [name, pd] of Object.entries(rawStats.players)) {
    const slug = _slug(name);
    let player = db.players.find(p => p.id === slug || p.name === name);

    if (!player) {
      // New player
      player = {
        id: slug,
        name,
        seasons: [],
        totalSeasons: 0,
        bestPlacement: Infinity,
        wins: 0,
        totalChallengeWins: 0,
        totalImmunityWins: 0,
        totalRewardWins: 0,
        totalVotesAgainst: 0,
        totalIdolsFound: 0,
        totalJuryVotes: 0,
        tier: '',
        badges: [],
        seasonDetails: []
      };
      db.players.push(player);
    }

    // Skip if season already recorded
    if (player.seasons?.includes(seasonNum)) continue;

    // Update career stats
    if (!player.seasons) player.seasons = [];
    player.seasons.push(seasonNum);
    player.totalSeasons = player.seasons.length;
    player.bestPlacement = Math.min(player.bestPlacement || Infinity, pd.placement || Infinity);
    if (pd.phase === 'Winner') player.wins = (player.wins || 0) + 1;
    player.totalChallengeWins = (player.totalChallengeWins || 0) + (pd.chalRecord?.wins || 0);
    player.totalImmunityWins = (player.totalImmunityWins || 0) + pd.immunityWins;
    player.totalRewardWins = (player.totalRewardWins || 0) + pd.rewardWins;
    player.totalVotesAgainst = (player.totalVotesAgainst || 0) + pd.totalVotesReceived;
    player.totalIdolsFound = (player.totalIdolsFound || 0) + pd.idolsFound;
    player.totalJuryVotes = (player.totalJuryVotes || 0) + (pd.juryVotes || 0);

    // Add season detail
    if (!player.seasonDetails) player.seasonDetails = [];
    player.seasonDetails.push({
      season: seasonNum,
      placement: pd.placement,
      status: pd.phase,
      challengeWins: pd.chalRecord?.wins || 0,
      immunityWins: pd.immunityWins,
      rewardWins: pd.rewardWins,
      votesReceived: pd.totalVotesReceived,
      idolsFound: pd.idolsFound,
      juryVotes: pd.juryVotes || 0,
      alliances: pd.alliances.map(a => a.name || a),
      rivalries: pd.rivalries.map(r => r.player || r),
      notes: [],
      keyMoments: []
    });

    // Update badges
    if (pd.phase === 'Winner' && !player.badges?.includes(`S${seasonNum} Winner`)) {
      player.badges = player.badges || [];
      player.badges.push(`S${seasonNum} Winner`);
    }
  }

  // Update franchise metadata
  db.franchise = db.franchise || {};
  db.franchise.totalSeasons = seasonNum;
  db.franchise.totalPlayers = db.players.length;

  return db;
}

function _mergeSeasonsDatabase(existing, rawStats, template) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  if (!db.seasons) db.seasons = [];

  // Skip if season already exists
  if (db.seasons.some(s => s.seasonNumber === seasonNum)) return db;

  db.seasons.push({
    seasonNumber: seasonNum,
    title: template.title || `Season ${seasonNum}`,
    subtitle: template.subtitle || '',
    castSize: rawStats.castSize,
    episodeCount: rawStats.episodeCount,
    winner: {
      name: rawStats.winner,
      playerSlug: _slug(rawStats.winner),
      vote: template.winner?.vote || '',
      runnerUp: template.winner?.runnerUp || ''
    },
    awards: {
      fanFavorite: rawStats.autoAwards?.fanFavorite?.player ? {
        name: rawStats.autoAwards.fanFavorite.player,
        playerSlug: _slug(rawStats.autoAwards.fanFavorite.player)
      } : null,
      bestStrategic: { name: '[AI_FILL]', playerSlug: '' },
      mostChallengeWins: rawStats.autoAwards?.mostChallengeWins?.player ? {
        name: rawStats.autoAwards.mostChallengeWins.player,
        playerSlug: _slug(rawStats.autoAwards.mostChallengeWins.player),
        detail: `${rawStats.autoAwards.mostChallengeWins.wins} wins`
      } : null
    },
    theme: '[AI_FILL]',
    status: 'Complete',
    emoji: ''
  });

  db.franchise = db.franchise || {};
  db.franchise.totalSeasons = seasonNum;

  return db;
}

// ── 18. downloadSeasonExport ────────────────────────────────────────

export async function downloadSeasonExport() {
  const seasonNum = seasonConfig?.seasonNumber || (gs.episodeHistory || []).length || 0;

  let rawStats;
  try {
    rawStats = extractSeasonRawStats();
    if (rawStats?.error) {
      alert(rawStats.error);
      return;
    }
  } catch (err) {
    alert('Failed to extract season stats: ' + (err.message || err));
    console.error('extractSeasonRawStats error:', err);
    return;
  }

  let template;
  try {
    template = extractSeasonTemplate();
  } catch (err) {
    alert('Failed to build season template: ' + (err.message || err));
    console.error('extractSeasonTemplate error:', err);
    return;
  }

  // Fetch existing databases and merge
  let franchiseDb, playersDb, seasonsDb;
  try {
    const [franchiseResp, playersResp, seasonsResp] = await Promise.all([
      fetch('franchise_database.json').catch(() => null),
      fetch('players_database.json').catch(() => null),
      fetch('seasons_database.json').catch(() => null),
    ]);

    const franchiseExisting = franchiseResp?.ok ? await franchiseResp.json() : { franchiseStats: {}, champions: [], records: {}, fanFavorites: [] };
    const playersExisting = playersResp?.ok ? await playersResp.json() : { franchise: {}, players: [] };
    const seasonsExisting = seasonsResp?.ok ? await seasonsResp.json() : { franchise: {}, seasons: [] };

    franchiseDb = _mergeFranchiseDatabase(franchiseExisting, rawStats, template);
    playersDb = _mergePlayersDatabase(playersExisting, rawStats);
    seasonsDb = _mergeSeasonsDatabase(seasonsExisting, rawStats, template);
    // Sync uniquePlayers from the merged players database
    if (franchiseDb && playersDb?.players) {
      franchiseDb.franchiseStats.uniquePlayers = playersDb.players.length;
    }
  } catch (err) {
    console.warn('Could not fetch/merge existing databases, downloading raw files only:', err);
    franchiseDb = null;
    playersDb = null;
    seasonsDb = null;
  }

  // Download all files with staggered delays so browser handles them
  let delay = 0;
  _downloadJSON(rawStats, `season${seasonNum}-raw-stats.json`);
  delay += 500;

  setTimeout(() => _downloadJSON(template, `season${seasonNum}-data-template.json`), delay);
  delay += 500;

  if (franchiseDb) {
    setTimeout(() => _downloadJSON(franchiseDb, 'franchise_database.json'), delay);
    delay += 500;
  }
  if (playersDb) {
    setTimeout(() => _downloadJSON(playersDb, 'players_database.json'), delay);
    delay += 500;
  }
  if (seasonsDb) {
    setTimeout(() => _downloadJSON(seasonsDb, 'seasons_database.json'), delay);
  }

  return { rawStats, template, franchiseDb, playersDb, seasonsDb };
}

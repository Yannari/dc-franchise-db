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

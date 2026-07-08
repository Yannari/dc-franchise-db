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

function _clean(val, fallback = '') {
  return (val && val !== '[AI_FILL]') ? val : fallback;
}

function _allPlayerNames() {
  return players.map(p => p.name);
}

function _getSeasonNumber() {
  if (seasonConfig?.seasonNumber) return seasonConfig.seasonNumber;
  const input = prompt('What season number is this? (e.g. 10)');
  const num = parseInt(input, 10);
  return (num && num >= 1) ? num : 0;
}

function _promptLoadJSON(label = 'Select a JSON file') {
  return new Promise((resolve, reject) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#1e1e2e;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:28px 32px;text-align:center;max-width:420px;color:#fff;font-family:system-ui,sans-serif;';
    box.innerHTML = `<p style="margin:0 0 18px;font-size:15px;">${label}</p>`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    box.appendChild(fileInput);

    const pickBtn = document.createElement('button');
    pickBtn.textContent = '📂 Choose File';
    pickBtn.style.cssText = 'padding:10px 24px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;margin-right:12px;';
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = 'padding:10px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;cursor:pointer;';

    box.appendChild(pickBtn);
    box.appendChild(skipBtn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);

    function cleanup() { wrap.remove(); }

    skipBtn.addEventListener('click', () => { cleanup(); reject(new Error('Cancelled')); });

    pickBtn.addEventListener('click', () => { fileInput.click(); });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        cleanup();
        try { resolve(JSON.parse(reader.result)); }
        catch (e) { cleanup(); reject(new Error('Invalid JSON: ' + e.message)); }
      };
      reader.onerror = () => { cleanup(); reject(reader.error); };
      reader.readAsText(file);
    });
  });
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
  const juryVotes = finale.votes || {};

  // Track permanent exits: { name → epNum } (last episode the player was in the game)
  // For RI seasons, a player voted out goes to RI and their permanent exit is
  // when they lose a duel, quit RI, or lose the reentry challenge — NOT when voted out.
  // Returnees who re-enter then get voted out again: their permanent exit is the later elimination.
  const permanentExit = {};
  const returnees = new Set();

  for (const ep of history) {
    // RI reentrants — mark as returned (their earlier exit doesn't count)
    if (ep.riReentrant) returnees.add(ep.riReentrant);

    // RI duel loser — permanently out
    if (ep.riDuel?.loser) {
      permanentExit[ep.riDuel.loser] = ep.num;
    }

    // RI quit — permanently out
    if (ep.riQuit?.name) {
      permanentExit[ep.riQuit.name] = ep.num;
    }

    // Edge / Rescue Island return challenge: the losers leave for good, but their PLACEMENT is
    // set by when they ORIGINALLY left the main game (their vote-out episode, already recorded
    // from ep.eliminated in an earlier iteration) — NOT this return episode, and NOT how they did
    // in the return challenge. Do NOT overwrite an existing exit: doing so collapses every Edge
    // dweller onto one episode and scrambles the whole board (ordering by rescueReturn.finalStandings
    // was exactly that bug). Only record the return episode as a last-resort fallback if a loser's
    // vote-out was somehow never captured. Reads both the flat and nested reentry-loser field shapes.
    const _reentryLosers = ep.riReentryLosers || ep.riReentry?.losers || ep.rescueReturn?.losers;
    if (_reentryLosers?.length) {
      for (const loser of _reentryLosers) {
        if (permanentExit[loser] == null) permanentExit[loser] = ep.num;
      }
    }

    // Regular eliminations — record as permanent exit
    // For RI seasons, players voted out go to RI (their exit will be overwritten
    // by the duel/quit/reentry-loss above). For returnees, a later elimination
    // overwrites the earlier one since we always update.
    // Twist boots that don't always flow through ep.eliminated — capture them so the
    // player is never dumped into the 'Unknown' bucket at the worst placement.
    const _juryBoot = (ep.twists || []).find(t => t.type === 'jury-elimination' && t.juryBooted)?.juryBooted;
    const elimNames = [
      ep.suddenDeathEliminated, ep.eliminated,
      ep.firstEliminated, ep.tiedDestiniesCollateral,
      ep.emissaryEliminated, ep.hpTiebreakerEliminated, _juryBoot,
      ...(ep.multiTribalElims || []), // double/multi-tribal boots (ep.eliminated only holds the last)
      ep.firemakingResult?.loser   // fire-making duel loser (else falls to 'Unknown' — the Jacques bug)
    ].filter(Boolean);

    for (const name of elimNames) {
      // If this player returned from RI, this is their real final exit
      // If they haven't returned yet and RI is active, their duel loss will overwrite this
      // If no RI, this is their permanent exit
      permanentExit[name] = ep.num;
    }

    // Koh-Lanta finale eliminates TWO players before FTC in a single episode:
    // 4th place in the orienteering race, then 3rd place at "the choice". Only the
    // choice cut lands in ep.eliminated above; the orienteering boot is recorded
    // only in ep.klOrienteering.eliminated. Record it here at a fractional exit
    // value just before the finale so reverse-elimination ordering assigns the
    // correct placements (orienteering boot = 4th, choice boot = 3rd). Without
    // this, the orienteering boot falls through to the 'Unknown' bucket and is
    // dumped at the worst placement number.
    if (ep.isFinale && ep.klOrienteering?.eliminated) {
      permanentExit[ep.klOrienteering.eliminated] = ep.num - 0.5;
    }

    // Ambassadors eliminate a player during the twist phase (before the challenge). Without this,
    // that boot was never recorded as an exit and got dumped at the worst placement with no episode
    // label. If a challenge also eliminated someone this episode (e.g. slasher night), the ambassador
    // boot left FIRST → slightly earlier fractional exit so it isn't tied with the main boot. If
    // ambassadors was the only elimination, this is simply their exit episode.
    const _ambBoot = ep.ambassadorData?.ambassadorEliminated;
    if (_ambBoot) {
      permanentExit[_ambBoot] = ep.num - (ep.eliminated && ep.eliminated !== _ambBoot ? 0.5 : 0);
    }

    // Tied Destinies twist: two players are linked, so when one is voted out the other goes with
    // them as collateral (ep.tiedDestinies.eliminatedPartner). The target lands in ep.eliminated,
    // but the partner was never recorded → dumped at 'Unknown'. Record the partner just below the
    // target (same episode, fractional) so it isn't tied with the main boot.
    const _tdPartner = ep.tiedDestinies?.eliminatedPartner;
    if (_tdPartner && _tdPartner !== ep.eliminated) {
      permanentExit[_tdPartner] = ep.num - 0.5;
    }
  }

  // Remove finalists from permanent exit (they made it to the end)
  for (const name of finalists) {
    delete permanentExit[name];
  }

  // NOTE: do NOT override permanentExit from gs.riArrivalEp. That field records a player's FIRST
  // Edge arrival and is not updated when a returnee is voted out again after the Edge has closed
  // (they go straight to jury) — so using it reverts returnees to their first boot. The per-episode
  // ep.eliminated chain above already yields each player's true LAST departure.

  // Build elimination order sorted by permanent exit episode (earliest exit first)
  const elimOrder = Object.entries(permanentExit)
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

  // Finalists sorted by jury votes (winner first, then by vote count desc)
  const sortedFinalists = [...finalists].sort((a, b) => {
    if (a === winner) return -1;
    if (b === winner) return 1;
    return (juryVotes[b] || 0) - (juryVotes[a] || 0);
  });

  // Determine merge episode
  let mergeEpNum = Infinity;
  for (const ep of history) {
    if (ep.isMerge) { mergeEpNum = ep.num; break; }
  }

  // Build placement map: 1 = winner, 2+ = finalists, then reverse permanent exit order
  const placements = {};
  let place = 1;

  for (const name of sortedFinalists) {
    placements[name] = { placement: place, phase: place === 1 ? 'Winner' : 'Finalist' };
    place++;
  }

  for (let i = elimOrder.length - 1; i >= 0; i--) {
    const name = elimOrder[i];
    if (placements[name]) continue;

    const exitEp = permanentExit[name] || 0;
    let phase;
    if (jury.includes(name)) {
      phase = 'Juror';
    } else if (exitEp >= mergeEpNum) {
      phase = 'Pre-Juror';
    } else {
      phase = 'Pre-Merge';
    }

    placements[name] = { placement: place, phase };
    place++;
  }

  for (const name of allNames) {
    if (!placements[name]) {
      placements[name] = { placement: place, phase: 'Unknown' };
      place++;
    }
  }

  return { placements, elimOrder, sortedFinalists, winner, juryVotes, permanentExit };
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

    // Immunity wins (exclude finale — that's a crown, not a shield)
    if (ep.immunityWinner === name && !ep.isFinale) {
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

    // Second Life Amulet activations aren't in idolPlays — they're recorded on
    // ep.fireMaking with fromAmulet=true (the amulet forces a duel instead of a
    // vote-out). Credit the play to whoever used it (an ally if played for the
    // eliminated player, otherwise the holder who triggered it themselves).
    if (ep.fireMaking?.fromAmulet) {
      const _amuletUser = ep.fireMaking.allyPlayer || ep.fireMaking.player;
      if (_amuletUser === name) {
        plays.push({
          ep: ep.num,
          type: 'secondLife',
          playedFor: ep.fireMaking.player || name,
          votesNegated: 0,
          misplay: false,
          failed: false,
          fake: false
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
  const { placements, elimOrder, sortedFinalists, winner, juryVotes, permanentExit } = _extractPlayerPlacements();
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

    // Tribe progression: walk episode history to build "Tribe1 → Tribe2 → Merged" string
    const tribeSeq = [];
    for (const ep of (gs.episodeHistory || [])) {
      if (ep.tribesAtStart) {
        const t = ep.tribesAtStart.find(tr => tr.members?.includes(name));
        if (t && t.name !== tribeSeq[tribeSeq.length - 1]) tribeSeq.push(t.name);
      }
      if (ep.isMerge && !tribeSeq.includes(gs.mergeName || 'Campers')) {
        tribeSeq.push(gs.mergeName || 'Campers');
      }
    }
    const tribe = tribeSeq.length ? tribeSeq.join(' → ') : '';

    // Social score (0-3): harsh — bonds + alliances (and duration) only
    // Most players get 0-1. Only 1-2 per season earn 3.
    const allianceCount = playerAlliances.length;
    const strongBonds = Object.values(bonds.bondsFinal).filter(b => b >= 7).length;
    const medBonds = Object.values(bonds.bondsFinal).filter(b => b >= 4 && b < 7).length;
    const hasShowmance = social.showmanceData?.length > 0;
    // Alliance duration: count alliances that lasted 5+ episodes as "long"
    const longAlliances = playerAlliances.filter(a => {
      if (!a.formed) return false;
      const endEp = placementInfo.phase === 'Winner' || placementInfo.phase === 'Finalist'
        ? (gs.episodeHistory || []).length : (permanentExit[name] || (gs.episodeHistory || []).length);
      return (endEp - a.formed) >= 5;
    }).length;

    let rawSocial = 0;
    rawSocial += Math.min(allianceCount, 3) * 0.35;
    rawSocial += Math.min(longAlliances, 2) * 0.4;
    rawSocial += Math.min(strongBonds, 3) * 0.35;
    rawSocial += Math.min(medBonds, 3) * 0.15;
    if (hasShowmance) rawSocial += 0.3;

    const socialScore = Math.min(3, Math.floor(rawSocial));

    // ── Advantage breakdown: played EFFECTIVELY vs WASTED vs HELD-unused ──────
    // Effective play = not fake/failed/misplayed, and (for idols) actually negated votes.
    // Wasted play = an advantage burned to no effect (misfire, negated 0 votes, fake, failed).
    // Held = advantages found but never played (dead weight if the player was eliminated).
    const _plays = advantages.plays || [];
    const _isEffectivePlay = pl => !pl.fake && !pl.failed && !pl.misplay
      && (pl.type === 'idol' ? (pl.votesNegated || 0) > 0 : true);
    const advPlayed = _plays.filter(_isEffectivePlay).length;
    const advWasted = _plays.length - advPlayed;
    const advHeld = (advantages.held || []).length;
    const _madeEnd = placementInfo.phase === 'Winner' || placementInfo.phase === 'Finalist';

    // ── Strategic score: a derived measure of strategic GAMEPLAY (independent of
    // placement). Rewards moves that actually happened; penalizes wasted resources. ──
    const _hist = gs.episodeHistory || [];
    let correctVotes = 0;
    for (const vc of voting.votesCast) {
      const _vep = _hist.find(h => h.num === vc.ep);
      const _boot = _vep && (_vep.eliminated || _vep.firstEliminated || _vep.suddenDeathEliminated);
      if (_boot && vc.target === _boot) correctVotes++;
    }
    let bigMoves = gs.playerStates?.[name]?.bigMoves || 0;
    if (!bigMoves) {
      for (let i = _hist.length - 1; i >= 0; i--) {
        const _bm = _hist[i].gsSnapshot?.playerStates?.[name]?.bigMoves;
        if (_bm != null) { bigMoves = _bm; break; }
      }
    }
    let _strat = 3.0
      + correctVotes * 0.5
      + blindside.blindsidesOrchestrated * 2.0
      + (social.schemesLaunched?.length || 0) * 1.0
      + advPlayed * 2.5
      - advWasted * 1.5
      + (advantages.finds?.length || 0) * 0.5
      + bigMoves * 1.0
      + Math.min(playerAlliances.length, 3) * 0.5
      + challenge.immunityWins * 0.3;
    if (!_madeEnd) _strat -= advHeld * 1.0; // never cashed in an advantage before going home
    const strategicScore = Math.max(0, Math.round(_strat * 2) / 2); // 0.5-step scale

    playerData[name] = {
      playerSlug: _slug(name),
      placement: placementInfo.placement,
      phase: placementInfo.phase,
      tribe,
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
      advPlayed,   // played effectively (+ points)
      advWasted,   // played to no effect / misfired (− points)
      advHeld,     // found but never used (dead weight if eliminated)
      correctVotes,
      strategicScore,
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
      isMole,
      socialScore
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
    seasonNumber: _getSeasonNumber(),
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
        advPlayed: pd.advPlayed ?? 0,   // effective plays (+ in ranking)
        advWasted: pd.advWasted ?? 0,   // wasted/misfired plays (− in ranking)
        advHeld: pd.advHeld ?? 0,       // found but never used
        votesReceived: pd.totalVotesReceived,
        alliances: pd.alliances.map(a => a.name),
        rivalries: pd.rivalries.map(r => r.player),
        socialScore: pd.socialScore ?? 0,
        strategicScore: pd.strategicScore ?? 0
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
    votingHistory: _extractVotingHistory(),
    finalTribalCouncil: _extractFinalTribalCouncil(),
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]',
    emoji: '[AI_FILL]'
  };
}

// Per-episode vote breakdown for the Vote History tab + Voting Analytics page.
// Shape matches what season_ref.html / voting-analytics.html consume.
function _extractVotingHistory() {
  const history = gs.episodeHistory || [];
  const out = [];
  for (const ep of history) {
    const log = ep.votingLog || [];
    if (!log.length) continue; // skip episodes with no tribal vote (rewards, finale race, etc.)
    const boot = ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated
      || ep.emissaryEliminated || ep.hpTiebreakerEliminated || ep.tiedDestiniesCollateral || null;
    out.push({
      episode: ep.num,
      eliminated: boot,
      eliminatedSlug: boot ? _slug(boot) : '',
      votes: log.map(v => ({
        voter: v.voter, voterSlug: _slug(v.voter),
        target: v.voted, targetSlug: _slug(v.voted)
      }))
    });
  }
  return out;
}

// Final tribal council jury vote. Empty for no-jury finales (fan vote, final
// challenge, Hawaiian Punch) — recorded with a note so pages don't show a gap.
function _extractFinalTribalCouncil() {
  const fin = gs.finaleResult || {};
  const reasoning = Array.isArray(fin.reasoning) ? fin.reasoning : [];
  if (reasoning.length) {
    return { votes: reasoning.map(r => ({
      juror: r.juror, jurorSlug: _slug(r.juror || ''),
      votedFor: r.votedFor, votedForSlug: _slug(r.votedFor || '')
    })) };
  }
  const noteMap = { hawaiianPunch: 'No jury — winner decided by the final volcano race and joust (Hawaiian Punch finale).',
    finalChallenge: 'No jury — winner decided by the final challenge.', fanVote: 'No jury — winner decided by fan vote.' };
  const noteKey = Object.keys(noteMap).find(k => fin[k]);
  return { votes: [], note: noteKey ? noteMap[noteKey] : undefined };
}

// ── 17. Database Merge Functions ────────────────────────────────────
// Fetch existing databases and merge new season data into them.

function _mergeFranchiseDatabase(existing, rawStats, template) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  // Update franchise stats (idempotent — subtract old values if re-exporting)
  const existingChamp = db.champions?.find(c => c.season === seasonNum);
  if (existingChamp) {
    const oldEpCount = db.seasons?.find(s => s.seasonNumber === seasonNum)?.episodeCount || 0;
    const oldCastSize = db.seasons?.find(s => s.seasonNumber === seasonNum)?.castSize || 0;
    db.franchiseStats.totalEpisodes = (db.franchiseStats.totalEpisodes || 0) - oldEpCount;
    db.franchiseStats.totalAppearances = (db.franchiseStats.totalAppearances || 0) - oldCastSize;
    db.champions = db.champions.filter(c => c.season !== seasonNum);
  }
  db.franchiseStats.totalSeasons = seasonNum;
  db.franchiseStats.totalEpisodes = (db.franchiseStats.totalEpisodes || 0) + rawStats.episodeCount;
  db.franchiseStats.totalAppearances = (db.franchiseStats.totalAppearances || 0) + rawStats.castSize;
  db.franchiseStats.lastUpdated = new Date().toISOString().split('T')[0];
  // uniquePlayers will be recomputed from players DB after merge

  // Champion entry
  if (!db.champions) db.champions = [];
  if (!db.champions.some(c => c.season === seasonNum)) {
    const winnerPd = rawStats.players[rawStats.winner] || {};
    db.champions.push({
      season: seasonNum,
      seasonTitle: _clean(template.title, `Season ${seasonNum}`),
      emoji: _clean(template.emoji),
      winner: rawStats.winner,
      playerSlug: _slug(rawStats.winner),
      finalVote: _clean(template.winner?.vote),
      runnerUp: _clean(template.winner?.runnerUp),
      keyStats: template.winner?.keyStats || '',
      strategy: template.winner?.strategy || '',
      legacy: template.winner?.legacy || '',
      votesAgainst: winnerPd.totalVotesReceived || 0
    });
  }

  // Records
  if (!db.records) db.records = {};
  if (!db.records.challengeRecords) db.records.challengeRecords = {};
  if (!db.records.votingRecords) db.records.votingRecords = {};

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

  // Fan favorites (overwrite on re-export) — prefer the editorial pick from the
  // season template, else the popularity leader from autoAwards (gs.popularity).
  if (!db.fanFavorites) db.fanFavorites = [];
  db.fanFavorites = db.fanFavorites.filter(f => f.season !== seasonNum);
  const _ffName = template?.awards?.fanFavorite?.name || rawStats.autoAwards?.fanFavorite?.player;
  if (_ffName) {
    db.fanFavorites.push({
      season: seasonNum,
      name: _ffName,
      playerSlug: _slug(_ffName)
    });
  }

  // Multi-season players — will be recomputed after players DB merge
  // (see _recomputeMultiSeasonPlayers)

  // Trends arrays (remove old entries for this season first so re-export overwrites)
  if (!db.trends) db.trends = {};
  const trendKeys = ['winningStrategies', 'castComposition', 'finaleVoteMargins', 'majorTwists'];
  for (const key of trendKeys) {
    if (!db.trends[key]) db.trends[key] = [];
    db.trends[key] = db.trends[key].filter(e => e.season !== seasonNum);
  }

  db.trends.winningStrategies.push({
    season: seasonNum,
    strategy: template.winner?.strategy || '',
    winner: rawStats.winner
  });

  db.trends.castComposition.push({
    season: seasonNum,
    composition: `${rawStats.castSize} players`
  });

  const voteMarginEntry = {
    season: seasonNum,
    vote: template.winner?.vote || '',
    winner: rawStats.winner
  };
  if (rawStats.finalists?.length) {
    voteMarginEntry.finalists = rawStats.finalists.map(f => f.name);
  }
  db.trends.finaleVoteMargins.push(voteMarginEntry);

  db.trends.majorTwists.push({
    season: seasonNum,
    twist: template.seasonNarrative || template.subtitle || ''
  });

  // Evolution timeline — write a seasonN text entry for franchise.html's timeline display
  if (!db.evolution) db.evolution = {};
  // Clean stale array keys that may have been written by older export code
  for (const key of trendKeys) delete db.evolution[key];

  const strategy = template.winner?.strategy || '';
  const vote = template.winner?.vote || 'no jury vote';
  const subtitle = template.subtitle || '';
  const runnerUp = rawStats.finalists?.find(f => f.name !== rawStats.winner)?.name || '';
  db.evolution[`season${seasonNum}`] =
    `${subtitle ? subtitle + '. ' : ''}${rawStats.winner} wins${vote ? ` (${vote})` : ''}${runnerUp ? ` over ${runnerUp}` : ''}. ${strategy}`;

  // Update evolution message with all winners
  const allSeasonKeys = Object.keys(db.evolution).filter(k => k.startsWith('season')).sort((a, b) => {
    return parseInt(a.replace('season', '')) - parseInt(b.replace('season', ''));
  });
  const winnerSummaries = db.trends.winningStrategies
    .slice().sort((a, b) => a.season - b.season)
    .map(ws => `${ws.winner} S${ws.season}`).join(', ');
  db.evolution.message = `The message across ${allSeasonKeys.length} seasons: Different winning strategies — ${winnerSummaries}. Adaptability, jury respect, and understanding when to strike remain essential.`;

  return db;
}

function _recomputeCareerLeaders(franchiseDb, playersDb) {
  const ps = playersDb.players || [];
  const top10 = (arr) => arr.slice(0, 10);
  const sorted = (key, desc = true) => [...ps]
    .filter(p => (p[key] || 0) > 0)
    .sort((a, b) => desc ? (b[key] || 0) - (a[key] || 0) : (a[key] || 0) - (b[key] || 0))
    .map(p => ({ name: p.name, playerSlug: p.id, total: p[key] || 0 }));

  if (!franchiseDb.careerLeaders) franchiseDb.careerLeaders = {};

  franchiseDb.careerLeaders.challengeDominance = {
    mostChallengeWins: top10(sorted('totalChallengeWins')),
    mostImmunityWins: top10(sorted('totalImmunityWins')),
    mostRewardWins: top10(sorted('totalRewardWins'))
  };

  franchiseDb.careerLeaders.socialGame = {
    lowestVotesAgainstCareer_min10Votes: top10(
      [...ps].filter(p => p.totalSeasons >= 1)
        .sort((a, b) => (a.totalVotesAgainst || 0) - (b.totalVotesAgainst || 0))
        .map(p => ({ name: p.name, playerSlug: p.id, votesAgainst: p.totalVotesAgainst || 0 }))
    ),
    mostJuryVotes: top10(sorted('totalJuryVotes'))
  };
}

function _recomputeMilestones(franchiseDb, playersDb, seasonsDb) {
  const ps = playersDb.players || [];
  const seasons = seasonsDb?.seasons || [];
  const milestones = [];

  // Most Challenge Wins (Career)
  const chalLeader = [...ps].sort((a, b) => (b.totalChallengeWins || 0) - (a.totalChallengeWins || 0))[0];
  if (chalLeader?.totalChallengeWins > 0) {
    milestones.push({
      category: 'Most Challenge Wins (Career)',
      holder: chalLeader.name,
      stat: `${chalLeader.totalChallengeWins} total`,
      season: (chalLeader.seasons || []).map(s => `S${s}`).join(', '),
      playerSlug: chalLeader.id
    });
  }

  // Most Challenge Wins (Single Season)
  let bestSingle = { name: '', wins: 0, season: 0, slug: '' };
  for (const p of ps) {
    for (const sd of (p.seasonDetails || [])) {
      if ((sd.challengeWins || 0) > bestSingle.wins) {
        bestSingle = { name: p.name, wins: sd.challengeWins, season: sd.season, slug: p.id };
      }
    }
  }
  if (bestSingle.wins > 0) {
    milestones.push({
      category: 'Most Challenge Wins (Single Season)',
      holder: bestSingle.name,
      stat: `${bestSingle.wins} total`,
      season: `S${bestSingle.season}`,
      playerSlug: bestSingle.slug
    });
  }

  // Fewest Votes to Win
  const winners = ps.filter(p => (p.wins || 0) > 0);
  let fewestVotesWinner = null;
  let fewestVotes = Infinity;
  for (const w of winners) {
    for (const sd of (w.seasonDetails || [])) {
      if (sd.status === 'Winner' && (sd.votesReceived || 0) < fewestVotes) {
        fewestVotes = sd.votesReceived || 0;
        fewestVotesWinner = { name: w.name, votes: fewestVotes, season: sd.season, slug: w.id };
      }
    }
  }
  if (fewestVotesWinner) {
    milestones.push({
      category: 'Fewest Votes to Win',
      holder: fewestVotesWinner.name,
      stat: `${fewestVotesWinner.votes} vote${fewestVotesWinner.votes !== 1 ? 's' : ''}`,
      season: `S${fewestVotesWinner.season}`,
      playerSlug: fewestVotesWinner.slug
    });
  }

  // Winner with 0 Votes Against
  for (const w of winners) {
    for (const sd of (w.seasonDetails || [])) {
      if (sd.status === 'Winner' && (sd.votesReceived || 0) === 0) {
        milestones.push({
          category: 'Winner with 0 Votes Against',
          holder: w.name,
          stat: '0 votes (entire season)',
          season: `S${sd.season}`,
          playerSlug: w.id
        });
      }
    }
  }

  // Most Votes Received (Career)
  const voteLeader = [...ps].sort((a, b) => (b.totalVotesAgainst || 0) - (a.totalVotesAgainst || 0))[0];
  if (voteLeader?.totalVotesAgainst > 0) {
    milestones.push({
      category: 'Most Votes Received',
      holder: voteLeader.name,
      stat: `${voteLeader.totalVotesAgainst} total`,
      season: (voteLeader.seasons || []).map(s => `S${s}`).join(', '),
      playerSlug: voteLeader.id
    });
  }

  // Most Idols Found (Career) — show ties
  const idolSorted = [...ps].sort((a, b) => (b.totalIdolsFound || 0) - (a.totalIdolsFound || 0));
  const topIdols = idolSorted[0]?.totalIdolsFound || 0;
  if (topIdols > 0) {
    const tied = idolSorted.filter(p => (p.totalIdolsFound || 0) === topIdols);
    milestones.push({
      category: 'Most Idols Found',
      holder: tied.map(p => p.name).join(', '),
      stat: `${topIdols} total${tied.length > 1 ? ' (tied)' : ''}`,
      season: tied.length === 1 ? (tied[0].seasons || []).map(s => `S${s}`).join(', ') : 'Multiple',
      playerSlug: tied[0].id
    });
  }

  // Most Finals Appearances
  const finalsCount = ps.map(p => {
    const finals = (p.seasonDetails || []).filter(sd => sd.placement && sd.placement <= 3).length;
    return { name: p.name, slug: p.id, count: finals, seasons: p.seasons || [] };
  }).sort((a, b) => b.count - a.count)[0];
  if (finalsCount?.count >= 2) {
    milestones.push({
      category: 'Most Finals Appearances',
      holder: finalsCount.name,
      stat: `${finalsCount.count} times`,
      season: finalsCount.seasons.map(s => `S${s}`).join(', '),
      playerSlug: finalsCount.slug
    });
  }

  // Closest Finale (smallest margin in jury vote)
  let closestFinale = null;
  let closestMargin = Infinity;
  for (const s of seasons) {
    const vote = s.winner?.vote;
    if (!vote) continue;
    const counts = vote.split('-').map(Number).filter(n => !isNaN(n));
    if (counts.length >= 2) {
      const margin = counts[0] - counts[1];
      if (margin < closestMargin) {
        closestMargin = margin;
        closestFinale = { season: s.seasonNumber, vote, winner: s.winner.name };
      }
    }
  }
  if (closestFinale && closestMargin <= 2) {
    milestones.push({
      category: 'Closest Finale',
      holder: `S${closestFinale.season}`,
      stat: closestFinale.vote,
      season: `${closestFinale.winner} win`
    });
  }

  // Largest Jury
  let largestJury = null;
  for (const s of seasons) {
    const size = s.jurySize || 0;
    if (!largestJury || size > largestJury.size) {
      largestJury = { season: s.seasonNumber, size };
    }
  }
  if (largestJury?.size > 0) {
    milestones.push({
      category: 'Largest Jury',
      holder: `S${largestJury.season}`,
      stat: `${largestJury.size} members`,
      season: ''
    });
  }

  franchiseDb.milestones = milestones;
}

function _mergePlayersDatabase(existing, rawStats, filledSeasonData) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  if (!db.players) db.players = [];

  // Build lookup from AI-filled placements
  const filledPlacements = {};
  if (filledSeasonData?.placements) {
    for (const p of filledSeasonData.placements) {
      if (p.name) filledPlacements[p.name] = p;
    }
  }

  for (const [name, pd] of Object.entries(rawStats.players)) {
    const slug = _slug(name);
    let player = db.players.find(p => p.id === slug || p.name === name);
    const filled = filledPlacements[name] || {};

    if (!player) {
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

    // Re-merge support: if this season was already recorded — whether as a
    // pre-season placeholder OR a previously-finalized result — strip its old
    // career contributions and season detail so the fresh data below replaces it.
    // (Previously an already-finalized season was skipped entirely with `continue`,
    // so re-exports/corrections never updated existing player records.)
    const existingDetail = player.seasonDetails?.find(sd => sd.season === seasonNum);

    if (existingDetail) {
      player.totalChallengeWins = (player.totalChallengeWins || 0) - (existingDetail.challengeWins || 0);
      player.totalImmunityWins = (player.totalImmunityWins || 0) - (existingDetail.immunityWins || 0);
      player.totalRewardWins = (player.totalRewardWins || 0) - (existingDetail.rewardWins || 0);
      player.totalVotesAgainst = (player.totalVotesAgainst || 0) - (existingDetail.votesReceived || 0);
      player.totalIdolsFound = (player.totalIdolsFound || 0) - (existingDetail.idolsFound || 0);
      player.totalJuryVotes = (player.totalJuryVotes || 0) - (existingDetail.juryVotes || 0);
      if (existingDetail.status === 'Winner') player.wins = Math.max(0, (player.wins || 0) - 1);
      player.seasonDetails = player.seasonDetails.filter(sd => sd.season !== seasonNum);
    }

    // Update career stats
    if (!player.seasons) player.seasons = [];
    if (!player.seasons.includes(seasonNum)) player.seasons.push(seasonNum);
    player.totalSeasons = player.seasons.length;
    player.bestPlacement = Math.min(player.bestPlacement || Infinity, pd.placement || Infinity);
    if (pd.phase === 'Winner') player.wins = (player.wins || 0) + 1;
    player.totalChallengeWins = (player.totalChallengeWins || 0) + (pd.chalRecord?.wins || 0);
    player.totalImmunityWins = (player.totalImmunityWins || 0) + pd.immunityWins;
    player.totalRewardWins = (player.totalRewardWins || 0) + pd.rewardWins;
    player.totalVotesAgainst = (player.totalVotesAgainst || 0) + pd.totalVotesReceived;
    player.totalIdolsFound = (player.totalIdolsFound || 0) + pd.idolsFound;
    player.totalJuryVotes = (player.totalJuryVotes || 0) + (pd.juryVotes || 0);

    // Add season detail with AI narratives
    if (!player.seasonDetails) player.seasonDetails = [];
    player.seasonDetails.push({
      season: seasonNum,
      placement: pd.placement,
      status: pd.phase,
      tribe: pd.tribe || '',
      challengeWins: pd.chalRecord?.wins || 0,
      immunityWins: pd.immunityWins,
      rewardWins: pd.rewardWins,
      votesReceived: pd.totalVotesReceived,
      idolsFound: pd.idolsFound,
      // advPlayed counts every advantage actually played (idols, extra votes, vote
      // steals/blocks, the Second Life Amulet, …); advHeld counts advantages still
      // in hand at exit. The player page's "Advantages" stat reads these.
      advPlayed: (pd.advantageLifecycle?.plays || []).filter(p => !p.fake && !p.failed).length,
      advHeld: (pd.advantageLifecycle?.held || []).length,
      strategicRank: _clean(filled.strategicRank, 0),
      juryVotes: pd.juryVotes || 0,
      finalVote: pd.phase === 'Winner' ? (_clean(filledSeasonData?.winner?.vote) || rawStats.finalists?.map(f => f.juryVotes ?? 0).sort((a,b) => b-a).join('-') || '') : '',
      advantages: (pd.advantageLifecycle?.held || []).map(a => a.type || a.name || a),
      notes: _clean(filled.notes) ? [filled.notes] : [],
      gameplayStyle: _clean(filled.gameplayStyle),
      keyMoments: (filled.keyMoments && filled.keyMoments !== '[AI_FILL]') ? filled.keyMoments : [],
      alliances: pd.alliances.map(a => a.name || a),
      rivalries: pd.rivalries.map(r => r.player || r)
    });

    // Append season story with separator (strip old version on re-export)
    if (_clean(filled.story)) {
      const header = `\n\nSEASON ${seasonNum} — ${filledSeasonData?.title || `Season ${seasonNum}`}\n────────\n`;
      if (player.story) {
        const seasonTag = `SEASON ${seasonNum} —`;
        const tagIdx = player.story.indexOf(seasonTag);
        if (tagIdx > 0) {
          const nextSeasonIdx = player.story.indexOf('\n\nSEASON ', tagIdx + seasonTag.length);
          player.story = player.story.substring(0, tagIdx - 2) + (nextSeasonIdx >= 0 ? player.story.substring(nextSeasonIdx) : '');
        }
      }
      player.story = player.story ? player.story + header + filled.story : filled.story;
    }

    // Recompute avg/best placement from all seasonDetails (authoritative — lets a
    // re-merge correct stale values; `bestPlacement` via incremental Math.min above
    // could never be raised when a placement was fixed downward then re-exported).
    const allPlacements = player.seasonDetails.map(sd => sd.placement).filter(p => p && p < 99);
    player.avgPlacement = allPlacements.length
      ? Math.round(allPlacements.reduce((s, v) => s + v, 0) / allPlacements.length * 100) / 100
      : null;
    player.bestPlacement = allPlacements.length ? Math.min(...allPlacements) : null;

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

  // Remove existing entry for this season (allows re-export to overwrite)
  db.seasons = db.seasons.filter(s => s.seasonNumber !== seasonNum);

  const aiAwards = template.awards || {};
  const bestStr = aiAwards.bestStrategic || aiAwards.masterStrategist?.gold;
  db.seasons.push({
    seasonNumber: seasonNum,
    title: _clean(template.title, `Season ${seasonNum}`),
    subtitle: _clean(template.subtitle),
    castSize: rawStats.castSize,
    episodeCount: rawStats.episodeCount,
    jurySize: rawStats.jurySize || 0,
    winner: {
      name: rawStats.winner,
      playerSlug: _slug(rawStats.winner),
      vote: _clean(template.winner?.vote),
      runnerUp: _clean(template.winner?.runnerUp),
      keyStats: _clean(template.winner?.keyStats),
      strategy: _clean(template.winner?.strategy),
      legacy: _clean(template.winner?.legacy)
    },
    awards: {
      fanFavorite: (template.awards?.fanFavorite?.name || rawStats.autoAwards?.fanFavorite?.player) ? {
        name: template.awards?.fanFavorite?.name || rawStats.autoAwards.fanFavorite.player,
        playerSlug: _slug(template.awards?.fanFavorite?.name || rawStats.autoAwards.fanFavorite.player)
      } : null,
      bestStrategic: bestStr?.name ? {
        name: bestStr.name,
        playerSlug: bestStr.playerSlug || _slug(bestStr.name)
      } : null,
      mostChallengeWins: rawStats.autoAwards?.mostChallengeWins?.player ? {
        name: rawStats.autoAwards.mostChallengeWins.player,
        playerSlug: _slug(rawStats.autoAwards.mostChallengeWins.player),
        detail: `${rawStats.autoAwards.mostChallengeWins.wins} wins`
      } : null
    },
    theme: _clean(template.seasonNarrative, _clean(template.subtitle)),
    status: 'Complete',
    castPhotoPath: `assets/cast/s${seasonNum}-cast.png`,
    emoji: _clean(template.emoji)
  });

  db.franchise = db.franchise || {};
  db.franchise.totalSeasons = seasonNum;

  return db;
}

// ── 18. downloadSeasonExport ────────────────────────────────────────

// ── 18. Export & Fill Narratives (combined) ─────────────────────────────
// Extracts stats → calls AI for narratives → merges databases with
// filled data → downloads everything at the end.

export async function exportAndFillNarratives(onStatus) {
  const _status = onStatus || (() => {});

  // Step 1: Extract raw stats + template
  _status('Extracting stats...');
  const seasonNum = _getSeasonNumber();

  let rawStats;
  try {
    rawStats = extractSeasonRawStats();
    if (rawStats?.error) { alert(rawStats.error); return; }
  } catch (err) {
    alert('Failed to extract season stats: ' + (err.message || err));
    return;
  }

  let template;
  try {
    template = extractSeasonTemplate();
  } catch (err) {
    alert('Failed to build season template: ' + (err.message || err));
    return;
  }

  // Step 2: Call AI worker for narratives
  _status('Calling AI Worker...');
  let workerUrl = localStorage.getItem('SEASON_BUILDER_WORKER_URL');
  if (!workerUrl) {
    workerUrl = prompt('Enter your Season Builder Worker URL (Cloudflare Worker):');
    if (!workerUrl || !workerUrl.trim()) return;
    workerUrl = workerUrl.trim();
    localStorage.setItem('SEASON_BUILDER_WORKER_URL', workerUrl);
  }

  const episodes = (gs.episodeHistory || []).map((ep, i) => ({
    episode: i + 1,
    summary: ep.summaryText || ''
  }));

  let finalSeasonData = template;

  if (episodes.some(e => e.summary)) {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'narrative-fill',
        template,
        episodes,
        season: template.seasonNumber,
        seasonTitle: template.title
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Worker failed (${response.status}): ${errText}`);
    }

    const aiResult = await response.json();

    finalSeasonData = JSON.parse(JSON.stringify(template));
    if (aiResult.title && aiResult.title !== '[AI_FILL]') finalSeasonData.title = aiResult.title;
    if (aiResult.subtitle && aiResult.subtitle !== '[AI_FILL]') finalSeasonData.subtitle = aiResult.subtitle;
    if (aiResult.seasonNarrative) finalSeasonData.seasonNarrative = aiResult.seasonNarrative;

    if (aiResult.winner) {
      if (aiResult.winner.keyStats) finalSeasonData.winner.keyStats = aiResult.winner.keyStats;
      if (aiResult.winner.strategy) finalSeasonData.winner.strategy = aiResult.winner.strategy;
      if (aiResult.winner.legacy) finalSeasonData.winner.legacy = aiResult.winner.legacy;
    }

    if (aiResult.placements && Array.isArray(aiResult.placements)) {
      for (const aiP of aiResult.placements) {
        const target = finalSeasonData.placements.find(p => p.name === aiP.name);
        if (!target) continue;
        if (aiP.notes) target.notes = aiP.notes;
        if (aiP.strategicRank != null) target.strategicRank = aiP.strategicRank;
        if (aiP.story) target.story = aiP.story;
        if (aiP.gameplayStyle) target.gameplayStyle = aiP.gameplayStyle;
        if (aiP.keyMoments) target.keyMoments = aiP.keyMoments;
      }
    }

    if (aiResult.awards && typeof aiResult.awards === 'object') {
      finalSeasonData.awards = aiResult.awards;
    }
    if (aiResult.emoji) finalSeasonData.emoji = aiResult.emoji;
  }

  // Guarantee a Fan Favorite award so the awards section is never blank. Prefer
  // an editorial pick already present in the awards; otherwise fall back to the
  // popularity leader from autoAwards (gs.popularity). Runs whether or not the
  // AI narrative fill ran (awards may still be the '[AI_FILL]' placeholder here).
  if (!finalSeasonData.awards || typeof finalSeasonData.awards !== 'object') finalSeasonData.awards = {};
  if (!finalSeasonData.awards.fanFavorite?.name && rawStats.autoAwards?.fanFavorite?.player) {
    const _ffName = rawStats.autoAwards.fanFavorite.player;
    finalSeasonData.awards.fanFavorite = {
      name: _ffName,
      playerSlug: _slug(_ffName),
      description: `${_ffName} was the season's most popular player with the fans.`
    };
  }

  // Step 3: Merge databases AFTER AI fill (so narratives are included)
  _status('Merging databases...');
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

    franchiseDb = _mergeFranchiseDatabase(franchiseExisting, rawStats, finalSeasonData);
    playersDb = _mergePlayersDatabase(playersExisting, rawStats, finalSeasonData);
    seasonsDb = _mergeSeasonsDatabase(seasonsExisting, rawStats, finalSeasonData);
    if (franchiseDb && playersDb?.players) {
      franchiseDb.franchiseStats.uniquePlayers = playersDb.players.length;
      _recomputeCareerLeaders(franchiseDb, playersDb);
      // Recompute multi-season players from players DB
      franchiseDb.multiSeasonPlayers = playersDb.players
        .filter(p => p.totalSeasons >= 2)
        .map(p => {
          const placements = (p.seasonDetails || []).map(sd => sd.placement).filter(pl => pl && pl < 99);
          const avg = placements.length ? placements.reduce((s, v) => s + v, 0) / placements.length : null;
          return {
            name: p.name,
            playerSlug: p.id,
            seasons: p.seasons,
            seasonsPlayed: p.totalSeasons,
            wins: p.wins || 0,
            avgPlacement: avg ? Math.round(avg * 100) / 100 : null,
            bestPlacement: p.bestPlacement || null
          };
        })
        .sort((a, b) => (a.avgPlacement || 999) - (b.avgPlacement || 999));
    }
    if (seasonsDb && playersDb?.players) {
      seasonsDb.franchise = seasonsDb.franchise || {};
      seasonsDb.franchise.totalPlayers = playersDb.players.length;
      seasonsDb.franchise.totalSeasons = Math.max(seasonsDb.franchise.totalSeasons || 0, rawStats.seasonNumber);
    }
    if (franchiseDb && playersDb?.players && seasonsDb) {
      _recomputeMilestones(franchiseDb, playersDb, seasonsDb);
    }
  } catch (err) {
    console.warn('Could not fetch/merge existing databases:', err);
    franchiseDb = null;
    playersDb = null;
    seasonsDb = null;
  }

  // Step 4: Download everything together
  _status('Downloading files...');
  let delay = 0;
  _downloadJSON(finalSeasonData, `season${seasonNum}-data.json`);
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
}

// ── 19. Rankings Narration (standalone) ──────────────────────────────
// Loads rankings_database.json, uses this season's rich data to generate
// narration for each player via the worker, then downloads the updated file.

export async function generateRankingsNarration(onStatus) {
  const _status = onStatus || (() => {});

  _status('Extracting season data...');
  // NOTE: must use extractSeasonRawStats() (has a `.players` map), NOT
  // _extractSeasonStats() (season-level totals only — no `.players`, which made
  // this always report "No season data" even with a full season loaded).
  let rawStats;
  try {
    rawStats = extractSeasonRawStats();
    if (rawStats?.error) { alert(rawStats.error); return; }
  } catch (err) {
    alert('Failed to extract season stats: ' + (err.message || err));
    return;
  }
  if (!rawStats.players || !Object.keys(rawStats.players).length) {
    alert('No season data — run a season first.');
    return;
  }

  const workerUrl = localStorage.getItem('SEASON_BUILDER_WORKER_URL') || '';
  if (!workerUrl) {
    alert('Set a worker URL first (used by Export & Fill Narratives).');
    return;
  }

  const seasonPlayers = Object.keys(rawStats.players);
  const _matchCount = db => (db?.rankings || []).filter(r =>
    seasonPlayers.some(n => n.toLowerCase() === r.name.toLowerCase())
  ).length;

  // Auto-load rankings_database.json from the project folder first. If it has no
  // players from THIS season (e.g. you ranked them in current-season.html but
  // haven't copied that file back into the project yet — the updated copy is in
  // your Downloads folder), fall back to a manual picker so you can grab it.
  let rankingsDb = null;
  try {
    const resp = await fetch('rankings_database.json').catch(() => null);
    if (resp?.ok) rankingsDb = await resp.json().catch(() => null);
  } catch { /* project file unavailable — fall through to picker */ }

  if (!rankingsDb?.rankings?.length || _matchCount(rankingsDb) === 0) {
    const _hadProjectFile = !!rankingsDb?.rankings?.length;
    try {
      rankingsDb = await _promptLoadJSON(_hadProjectFile
        ? 'Project rankings_database.json has no players from this season — pick the updated copy (e.g. from your Downloads folder)'
        : 'Load rankings_database.json for narration update');
    } catch { return; }
  }

  if (!rankingsDb?.rankings?.length) {
    alert('Invalid rankings database — no rankings array found.');
    return;
  }

  const toUpdate = rankingsDb.rankings.filter(r =>
    seasonPlayers.some(n => n.toLowerCase() === r.name.toLowerCase())
  );

  if (!toUpdate.length) {
    alert('No matching players found between this season and the rankings database.\n\nAdd this season’s players to the rankings first (current-season.html → Final Placements & Stats → Apply Updates), then run narration on THAT file.');
    return;
  }

  _status(`Generating narration for ${toUpdate.length} players...`);

  const template = extractSeasonTemplate();
  const playerContext = toUpdate.map(r => {
    const pd = rawStats.players[Object.keys(rawStats.players).find(n => n.toLowerCase() === r.name.toLowerCase())];
    const seasonEntry = template.placements?.find(p => p.name.toLowerCase() === r.name.toLowerCase());
    const parts = [];
    parts.push(`${r.name} — Rank #${r.rank}, Tier ${r.tier}, Score ${r.score}`);
    parts.push(`${r.seasonsPlayed || 1} season(s), ${r.wins || 0} win(s)`);
    if (r.placements?.length) parts.push(`Placements: ${r.placements.join(', ')}`);
    parts.push(`Challenge wins: ${r.challengeWins || 0}, Votes against: ${r.votesAgainst || 0}, Jury votes: ${r.juryVotes || 0}, Idols: ${r.idolsFound || 0}`);
    if (seasonEntry?.story && seasonEntry.story !== '[AI_FILL]') parts.push(`This season story: ${seasonEntry.story}`);
    if (seasonEntry?.keyMoments && Array.isArray(seasonEntry.keyMoments)) parts.push(`Key moments: ${seasonEntry.keyMoments.join(' | ')}`);
    if (seasonEntry?.gameplayStyle && seasonEntry.gameplayStyle !== '[AI_FILL]') parts.push(`Style: ${seasonEntry.gameplayStyle}`);
    if (pd) {
      if (pd.advantageLifecycle?.plays?.length) parts.push(`Advantages played: ${pd.advantageLifecycle.plays.filter(p => !p.fake && !p.failed).length}`);
      if (pd.showmanceData?.length) parts.push(`Showmances: ${pd.showmanceData.map(s => s.partner || s.with).join(', ')}`);
    }
    if (r.reasoning) parts.push(`Previous reasoning: "${r.reasoning}"`);
    return { ...r, _context: parts.join('. ') };
  });

  // Apply one worker response into the rankings DB. Returns the set of player
  // names (lowercased) that were actually narrated, so callers can detect — and
  // retry — players the model silently skipped (LLMs under-produce array items).
  const _applyResults = (results) => {
    const done = new Set();
    for (const result of (results || [])) {
      const entry = rankingsDb.rankings.find(r => r.name.toLowerCase() === result.name.toLowerCase());
      if (!entry) continue;
      if (result.title) entry.title = result.title;
      if (result.emoji) entry.emoji = result.emoji;
      if (result.reasoning) entry.reasoning = result.reasoning;
      if (result.strengths?.length) entry.strengths = result.strengths;
      if (result.weaknesses?.length) entry.weaknesses = result.weaknesses;
      done.add(result.name.toLowerCase());
    }
    return done;
  };

  const _callWorker = async (batch) => {
    const resp = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'rankings-narration',
        players: batch.map(p => ({
          name: p.name, rank: p.rank, tier: p.tier, score: p.score,
          seasonsPlayed: p.seasonsPlayed, wins: p.wins,
          placements: p.placements, challengeWins: p.challengeWins,
          votesAgainst: p.votesAgainst, juryVotes: p.juryVotes,
          idolsFound: p.idolsFound, reasoning: p._context
        }))
      })
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Worker responded ${resp.status}. ${errText.slice(0, 300)}`);
    }
    return (await resp.json())?.results || [];
  };

  const narrated = new Set();
  try {
    // Smaller batches narrate far more reliably — the model is much more likely
    // to return a complete array of 4 than of 10.
    const batchSize = 4;
    for (let i = 0; i < playerContext.length; i += batchSize) {
      const batch = playerContext.slice(i, i + batchSize);
      _status(`Narration ${i + 1}-${Math.min(i + batchSize, playerContext.length)} of ${playerContext.length}...`);
      const done = _applyResults(await _callWorker(batch));
      done.forEach(n => narrated.add(n));
    }

    // Retry anyone the model skipped (under-produced results). Two passes, one
    // player at a time so a single skipped name can't drag others down with it.
    for (let pass = 0; pass < 2; pass++) {
      const missing = playerContext.filter(p => !narrated.has(p.name.toLowerCase()));
      if (!missing.length) break;
      _status(`Retrying ${missing.length} skipped player(s)...`);
      for (const p of missing) {
        try {
          const done = _applyResults(await _callWorker([p]));
          done.forEach(n => narrated.add(n));
        } catch (e) { console.warn('Retry failed for', p.name, e); }
      }
    }

    if (rankingsDb.metadata) rankingsDb.metadata.lastUpdated = new Date().toISOString().split('T')[0];
  } catch (err) {
    console.warn('Rankings narration failed:', err);
    alert('Narration generation failed — ' + (err.message || err) + '\n(See console for details.)');
    return;
  }

  const narratedCount = narrated.size;
  if (!narratedCount) {
    alert(`Matched ${toUpdate.length} player(s), but the worker returned no narration for any of them. Check the worker URL and that it supports "rankings-narration" mode (see console).`);
    return;
  }

  const stillMissing = playerContext
    .filter(p => !narrated.has(p.name.toLowerCase()))
    .map(p => p.name);

  _status(`Downloading updated rankings (${narratedCount} narrated)...`);
  _downloadJSON(rankingsDb, 'rankings_database.json');
  alert(
    `✅ Generated narration for ${narratedCount} of ${toUpdate.length} matched player(s).` +
    (stillMissing.length ? `\n\n⚠️ The worker skipped ${stillMissing.length}: ${stillMissing.join(', ')}. Run again to fill them.` : '') +
    `\n\nUpdated rankings_database.json downloaded — replace your project copy with it.`
  );
}

// ── 20. PDF Exports ──────────────────────────────────────────────────

function _loadJsPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf);
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  });
}

export async function exportStatisticsPDF(onStatus) {
  const _status = onStatus || (() => {});
  _status('Loading PDF library...');
  const { jsPDF } = await _loadJsPDF();

  _status('Building statistics...');
  const history = gs.episodeHistory || [];
  const seasonNum = seasonConfig?.seasonNumber || _getSeasonNumber();
  const seasonTitle = seasonConfig?.title || `Total Drama Season ${seasonNum}`;
  const { playerData, placements, elimOrder, winner, finalists } = _extractPlayerData();
  const seasonStats = _extractSeasonStats();
  const allNames = _allPlayerNames();

  const sorted = Object.entries(playerData)
    .sort((a, b) => (a[1].placement || 99) - (b[1].placement || 99));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 12;
  let y = 0;

  function header() {
    doc.setFillColor(30, 30, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${seasonTitle.toUpperCase()} - SEASON ${seasonNum} STATISTICS`, W / 2, 11, { align: 'center' });
    y = 24;
    doc.setTextColor(30, 30, 46);
  }

  function sectionTitle(title) {
    if (y > 270) { doc.addPage(); header(); }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 60, 180);
    doc.text(title, M, y);
    y += 1;
    doc.setDrawColor(100, 60, 180);
    doc.line(M, y, W - M, y);
    y += 5;
    doc.setTextColor(30, 30, 46);
  }

  function textLine(text, size = 8, style = 'normal') {
    if (y > 282) { doc.addPage(); header(); }
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.text(text, M, y);
    y += size * 0.45 + 1;
  }

  function wrappedLine(text, size = 8, style = 'normal', indent = 0) {
    if (y > 282) { doc.addPage(); header(); }
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(text, W - 2 * M - indent);
    for (const line of lines) {
      if (y > 282) { doc.addPage(); header(); }
      doc.text(line, M + indent, y);
      y += size * 0.42 + 0.8;
    }
  }

  // Page 1
  header();

  // Season Metadata
  sectionTitle('Season Metadata');
  const winnerName = winner || (finalists?.[0]?.name) || '—';
  const finaleResult = gs.finaleResult || {};
  const finalVote = finaleResult.votes ? Object.values(finaleResult.votes).sort((a, b) => b - a).join('-') : '—';
  const fanFav = seasonConfig?.fanFavorite || '—';
  textLine(`Season Name: ${seasonTitle} (Season ${seasonNum})`, 8, 'normal');
  textLine(`Winner: ${winnerName}`, 8, 'normal');
  textLine(`Final Vote: ${finalVote}`, 8, 'normal');
  y += 2;

  // Placements Table
  sectionTitle('Placements');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Place', M, y); doc.text('Player', M + 14, y); doc.text('Phase', M + 52, y); doc.text('Notes', M + 76, y);
  y += 1;
  doc.line(M, y, W - M, y);
  y += 3;
  doc.setFont('helvetica', 'normal');

  for (const [name, pd] of sorted) {
    if (y > 278) { doc.addPage(); header(); }
    const place = pd.placement || '—';
    const phase = pd.phase || '—';
    const imm = pd.immunityWins || 0;
    const votes = pd.totalVotesReceived || 0;
    let notes = '';
    if (pd.phase === 'Winner') notes = `${finalVote} / ${imm} Ind. Immunities`;
    else if (pd.phase === 'Finalist') notes = `Finalist / ${votes} votes against`;
    else notes = `${votes} votes against${imm ? ` / ${imm} immunity` : ''}`;

    doc.setFontSize(7);
    doc.text(String(place), M, y);
    doc.setFont('helvetica', 'bold');
    doc.text(name, M + 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(phase, M + 52, y);
    const noteLines = doc.splitTextToSize(notes, W - M - 76);
    doc.text(noteLines[0] || '', M + 76, y);
    y += 4;
  }
  y += 2;

  // Challenge Performance
  sectionTitle('Challenge Performance & Voting');
  const immWinners = sorted.filter(([, pd]) => pd.immunityWins > 0)
    .sort((a, b) => b[1].immunityWins - a[1].immunityWins)
    .map(([n, pd]) => `${n} (${pd.immunityWins})`)
    .join(', ');
  if (immWinners) wrappedLine(`Immunity Wins: ${immWinners}`, 7);

  const rewWinners = sorted.filter(([, pd]) => pd.rewardWins > 0)
    .sort((a, b) => b[1].rewardWins - a[1].rewardWins)
    .map(([n, pd]) => `${n} (${pd.rewardWins})`)
    .join(', ');
  if (rewWinners) wrappedLine(`Reward Wins: ${rewWinners}`, 7);
  y += 1;

  // Votes received
  wrappedLine('Votes Received Against:', 7, 'bold');
  const votesSorted = sorted
    .filter(([, pd]) => pd.totalVotesReceived > 0)
    .sort((a, b) => b[1].totalVotesReceived - a[1].totalVotesReceived);
  const voteLine = votesSorted.map(([n, pd]) => `${n}: ${pd.totalVotesReceived}`).join('  |  ');
  wrappedLine(voteLine, 6.5);
  y += 2;

  // Advantages & Idols — found vs played-effectively vs wasted vs held-unused
  sectionTitle('Advantages & Awards');
  const idolHolders = sorted.filter(([, pd]) => pd.idolsFound > 0)
    .map(([n, pd]) => `${n} (${pd.idolsFound})`).join(', ');
  if (idolHolders) wrappedLine(`Idols/Advantages Found: ${idolHolders}`, 7);

  const advEffective = sorted.filter(([, pd]) => (pd.advPlayed || 0) > 0)
    .map(([n, pd]) => `${n} (${pd.advPlayed})`).join(', ');
  if (advEffective) wrappedLine(`Played Effectively: ${advEffective}`, 7);

  const advWastedList = sorted.filter(([, pd]) => (pd.advWasted || 0) > 0)
    .map(([n, pd]) => `${n} (${pd.advWasted})`).join(', ');
  if (advWastedList) wrappedLine(`Wasted / Misfired: ${advWastedList}`, 7);

  // Held & never used — only a real waste for players who were eliminated with it
  const advHeldList = sorted.filter(([, pd]) => (pd.advHeld || 0) > 0 && pd.phase !== 'Winner' && pd.phase !== 'Finalist')
    .map(([n, pd]) => `${n} (${pd.advHeld})`).join(', ');
  if (advHeldList) wrappedLine(`Held & Never Used (eliminated with it): ${advHeldList}`, 7);

  // Challenge stats
  const chalLeader = sorted
    .filter(([, pd]) => (pd.chalRecord?.wins || 0) > 0)
    .sort((a, b) => (b[1].chalRecord?.wins || 0) - (a[1].chalRecord?.wins || 0));
  if (chalLeader.length) {
    const best = chalLeader[0];
    wrappedLine(`Best Physical: ${best[0]} (${best[1].immunityWins || 0} Immunities / ${best[1].chalRecord?.wins || 0} Total Wins)`, 7);
  }
  y += 2;

  // Strategic Rankings (Full) — derived strategic-gameplay score, best to worst
  sectionTitle('Strategic Rankings');
  const stratSorted = [...sorted].sort((a, b) => (b[1].strategicScore || 0) - (a[1].strategicScore || 0));
  stratSorted.forEach(([n, pd], i) => {
    if (y > 278) { doc.addPage(); header(); }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(String(i + 1), M, y);
    doc.setFont('helvetica', 'bold');
    doc.text(n, M + 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text((pd.strategicScore ?? 0).toFixed(1), M + 60, y);
    y += 3.6;
  });
  y += 2;

  // Season overview stats
  sectionTitle('Season Overview');
  textLine(`Total Episodes: ${history.length}`, 7);
  textLine(`Total Tribal Councils: ${seasonStats.totalTribalCouncils}`, 7);
  textLine(`Total Votes Cast: ${seasonStats.totalVotesCast}`, 7);
  textLine(`Idols Found: ${seasonStats.totalIdolsFound} | Idols Played: ${seasonStats.totalIdolsPlayed}`, 7);
  textLine(`Blindsides: ${seasonStats.totalBlindsides}`, 7);
  if (seasonStats.totalShowmances) textLine(`Showmances: ${seasonStats.totalShowmances} (${seasonStats.totalBreakups} breakups)`, 7);

  // Key Narrative Moments (from episodeHistory highlights)
  if (y < 240) {
    y += 2;
    sectionTitle('Key Episodes');
    for (const ep of history) {
      if (y > 275) break;
      const elim = ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated || '—';
      const chalType = ep.challengeType || ep.challengeLabel || '';
      const line = `Ep ${ep.num}: ${chalType ? chalType + ' — ' : ''}Eliminated: ${elim}`;
      wrappedLine(line, 6.5, 'normal', 2);
    }
  }

  _status('Saving Statistics PDF...');
  doc.save(`Total_Drama_${seasonNum}_Statistics.pdf`);
}

export async function exportSummaryPDF(onStatus) {
  const _status = onStatus || (() => {});
  _status('Loading PDF library...');
  const { jsPDF } = await _loadJsPDF();

  _status('Building summary...');
  const history = gs.episodeHistory || [];
  const seasonNum = seasonConfig?.seasonNumber || _getSeasonNumber();
  const seasonTitle = seasonConfig?.title || `Total Drama Season ${seasonNum}`;

  if (!history.length) { alert('No episodes to export.'); return; }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  let y = 0;
  let pageNum = 0;

  function newPage(epLabel) {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    doc.setFillColor(30, 30, 46);
    doc.rect(0, 0, W, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${seasonTitle.toUpperCase()} — ${epLabel}`, W / 2, 10, { align: 'center' });
    y = 22;
    doc.setTextColor(30, 30, 46);
  }

  for (const ep of history) {
    const epLabel = `EPISODE ${ep.num}`;
    newPage(epLabel);

    const text = ep.summaryText || '(No summary text generated for this episode)';
    const lines = text.split('\n');

    doc.setFontSize(7.5);
    doc.setFont('courier', 'normal');

    for (const rawLine of lines) {
      const isHeader = rawLine.startsWith('===') || rawLine.startsWith('---') || rawLine.startsWith('~~~');
      const isSectionLabel = rawLine.match(/^[A-Z ]{4,}$/) || rawLine.startsWith('###');

      if (isHeader) {
        doc.setFont('courier', 'bold');
        doc.setTextColor(100, 60, 180);
      } else if (isSectionLabel) {
        doc.setFont('courier', 'bold');
        doc.setTextColor(60, 60, 80);
      } else {
        doc.setFont('courier', 'normal');
        doc.setTextColor(30, 30, 46);
      }

      const wrapped = doc.splitTextToSize(rawLine || ' ', W - 2 * M);
      for (const wl of wrapped) {
        if (y > 284) {
          doc.addPage();
          pageNum++;
          doc.setFillColor(245, 245, 250);
          doc.rect(0, 0, W, 10, 'F');
          doc.setTextColor(120, 120, 140);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.text(`${seasonTitle} — Episode ${ep.num} (cont.)`, W / 2, 7, { align: 'center' });
          y = 14;
          doc.setFontSize(7.5);
          doc.setTextColor(30, 30, 46);
          doc.setFont('courier', 'normal');
        }
        doc.text(wl, M, y);
        y += 3.2;
      }
    }
  }

  _status('Saving Summary PDF...');
  doc.save(`Summary_Episode_Total_Drama_${seasonNum}.pdf`);
}

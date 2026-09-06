// ══════════════════════════════════════════════════════════════════════
// stats-export.js — Per-player data extraction for end-of-season export
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig, TWIST_CATALOG } from './core.js';
import { summariseWeek } from './bb-run.js';
import { pStats } from './players.js';
import { bKey, getBond } from './bonds.js';
import { seasonRecord, recordLines, vetoSavedIn } from './analysis/game-record.js';
import { SHOWS, seasonId, formatPrefix, DEFAULT_FORMAT } from './shows.js';
import { villainBoard } from './villain-score.js';
import { seasonFormat } from './core.js';
import { refreshSocialFeed, socialPublishPayload } from './social/session.js';
import { nextWindowFor } from './franchise-calendar.js';
import { ratingsForSeason } from './ratings.js';

// ── Helpers ──────────────────────────────────────────────────────────

function _slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * The portrait this appearance used.
 *
 * A season document is read by the wiki and the player profile, neither of
 * which opens a simulator save — so the choice is denormalised onto every row
 * that names a person. Without it those pages can only guess from the slug,
 * which is how a career of five seasons showed the same face five times.
 */
function _portraitOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return { avatarId: p?.avatarId || null, avatarFile: p?.avatarFile || '' };
}

function _clean(val, fallback = '') {
  return (val && val !== '[AI_FILL]') ? val : fallback;
}

// ── Show tagging ─────────────────────────────────────────────────────
// Every season record and every season detail says which show it came from.
// The numeric `season` field stays exactly where it always was, alongside the
// new `format`/`seasonId`, so a page that has not been updated yet still finds
// the number it expects.

/**
 * Stamp `format` + `seasonId` onto a season detail.
 *
 * A `bb` stat block on a detail tagged `total-drama` is not an ambiguity to be
 * resolved downstream — it is a split-brain row. The D1 sync reads `det.bb` as
 * "this is Big Brother" whenever nothing contradicts it, so that detail writes
 * an appearance tagged Total Drama with rows in BOTH `td_appearances` and
 * `bb_appearances`: two homes, no owner, and career totals that double-count
 * forever after. There is no season for which the combination is meaningful, so
 * this throws rather than quietly picking a winner.
 */
/**
 * Does this season detail belong to the season being merged?
 *
 * Season numbers are NOT unique on their own any more — `seasons` is keyed
 * `(format, season_number)`, so Total Drama 1 and Big Brother 1 are two
 * different seasons that coexist. Every re-merge dedupe used to match on the
 * number alone, which was harmless only while Big Brother data did not exist:
 * the moment it does, re-exporting Total Drama 1 finds the player's BIG
 * BROTHER 1 detail, subtracts that show's numbers from the career totals, and
 * deletes the detail outright. The player quietly loses a season.
 *
 * Untagged details are legacy Total Drama rows written before the format tag,
 * so they answer to `total-drama` — same rule `_rebuildByShow` uses.
 */
function _isSameSeason(detail, seasonNum, format = DEFAULT_FORMAT) {
  if (!detail || detail.season !== seasonNum) return false;
  return (detail.format || DEFAULT_FORMAT) === format;
}

/**
 * What a season's winner badge is called.
 *
 * Total Drama keeps the bare `S4 Winner` its fifteen seasons of data already
 * carry. Every other show is prefixed, because the number alone stopped
 * identifying a season when the second show arrived — Big Brother 1's winner was
 * getting `S1 Winner`, the same badge as Total Drama 1's winner, on the same
 * career page.
 */
function _winnerBadge(seasonNum, format = DEFAULT_FORMAT) {
  return format === DEFAULT_FORMAT
    ? `S${seasonNum} Winner`
    : `${(formatPrefix(format) || format).toUpperCase()}${seasonNum} Winner`;
}

/**
 * Take one season back off a player's career, whatever show it was.
 *
 * Re-exporting a season has to be able to CORRECT it, and correcting means the
 * old numbers come off first. Two things used to survive that:
 *
 *   - the winner's badge, which was only ever added and never removed, so a
 *     player who lost a re-exported season kept wearing `S1 Winner`; and
 *   - anybody dropped from the cast, because the merge only ever visited players
 *     in the NEW season document. Re-export a season with a different cast and
 *     the people you removed keep the appearance forever — inflating their
 *     season count, their per-show totals and their fame.
 *
 * Returns true if anything was actually removed, so the caller knows to
 * recompute the derived figures.
 */
function _stripSeasonFromPlayer(player, seasonNum, format = DEFAULT_FORMAT) {
  const detail = (player.seasonDetails || []).find(sd => _isSameSeason(sd, seasonNum, format));
  if (!detail) return false;

  const bb = detail.bb || {};
  const less = (field, amount) => {
    player[field] = Math.max(0, (player[field] || 0) - (amount || 0));
  };
  // Shared across both shows.
  less('totalChallengeWins', detail.challengeWins);
  less('totalVotesAgainst', detail.votesReceived);
  less('totalJuryVotes', detail.juryVotes);
  // Total Drama shapes.
  less('totalImmunityWins', detail.immunityWins);
  less('totalRewardWins', detail.rewardWins);
  less('totalIdolsFound', detail.idolsFound);
  // Big Brother shapes.
  less('totalHohWins', bb.hohWins);
  less('totalVetoWins', bb.vetoWins);

  if (detail.status === 'Winner') {
    player.wins = Math.max(0, (player.wins || 0) - 1);
    const badge = _winnerBadge(seasonNum, format);
    player.badges = (player.badges || []).filter(b => b !== badge);
  }

  player.seasonDetails = player.seasonDetails.filter(sd => !_isSameSeason(sd, seasonNum, format));
  player.seasons = (player.seasons || []).filter(n =>
    n !== seasonNum || (player.seasonDetails || []).some(sd => sd.season === seasonNum));
  return true;
}

/**
 * Take a season off EVERY player, not just the ones in the new cast.
 *
 * Call before re-adding, so a re-export with a changed cast leaves nobody
 * holding an appearance in a season they are no longer in.
 */
function _stripSeasonFromAll(db, seasonNum, format = DEFAULT_FORMAT) {
  for (const player of db.players || []) {
    if (_stripSeasonFromPlayer(player, seasonNum, format)) {
      const places = (player.seasonDetails || []).map(sd => sd.placement).filter(p => p && p < 99);
      player.avgPlacement = places.length
        ? Math.round(places.reduce((s, v) => s + v, 0) / places.length * 100) / 100
        : null;
      player.bestPlacement = places.length ? Math.min(...places) : null;
      _rebuildByShow(player);
    }
  }
}

// Exported for the guard: both of these decide something a sampled assertion
// on a finished database cannot see. `_rebuildByShow` is where an appearance
// joins a career, and it is the exact line at which an untagged Traitors
// appearance would join a Total Drama one.
export function _tagSeasonDetail(detail, format = DEFAULT_FORMAT) {
  if (!detail) return detail;
  // A per-show stat block lives under that show's own prefix (`bb`, `tr`), so
  // a detail carrying somebody else's block is an appearance that cannot say
  // which show it is from. Asked of the registry rather than of Big Brother by
  // name: the hardcoded version let a `tr` block through onto a Total Drama
  // appearance, which is the same split brain one show further along.
  const mine = SHOWS[format]?.prefix;
  for (const [other, show] of Object.entries(SHOWS)) {
    if (other === format || show.prefix === mine) continue;
    if (detail[show.prefix]) {
      throw new Error(
        `Season detail for season ${detail.season} carries a ${show.name} stat block ` +
        `but would be tagged "${format}" — refusing to write a split-brain appearance.`);
    }
  }
  detail.format = format;
  detail.seasonId = seasonId(format, detail.season);
  return detail;
}

/**
 * Recompute a player's per-show career totals from their season details.
 *
 * The universal facts (totalSeasons, wins, bestPlacement, avgPlacement, tier)
 * stay top-level: they mean the same thing in every format, and six pages read
 * them there. Challenge wins, idols, HOHs and vetoes do not survive the trip
 * between shows, so those live under the show that produced them.
 *
 * Derived, never authored — recomputed wholesale on every merge, so a
 * correction to a season detail can never leave a stale career total behind.
 */
export function _rebuildByShow(player) {
  const byShow = {};
  for (const det of player.seasonDetails || []) {
    const format = det.format || DEFAULT_FORMAT;
    const bucket = (byShow[format] ||= { seasons: 0 });
    bucket.seasons++;
    // A show declares which fields it contributes; see SHOWS in js/shows.js.
    for (const [from, to] of (SHOWS[format]?.careerStats || [])) {
      // A dotted key reads a nested stat block — `bb.hohWins`, `tr.missionsWon`
      // — and it is walked generically rather than tested against one show's
      // prefix. It used to read `from.startsWith('bb.') ? … : det[from]`, so
      // every `tr.*` pair the registry declares looked up a literal key called
      // "tr.missionsWon", found nothing, and a whole show's career totals came
      // out as zero with nothing reporting it.
      const value = from.includes('.')
        ? from.split('.').reduce((o, k) => (o == null ? o : o[k]), det)
        : det[from];
      bucket[to] = (bucket[to] || 0) + (value || 0);
    }
  }
  player.byShow = byShow;
  // Counted here, from the details, because this is the one point in either
  // merge where they are final — and because the details are the only record
  // that can tell two shows apart. `player.seasons` is a flat list of NUMBERS
  // read by a dozen pages, so Total Drama 1 and Big Brother 1 collapse to a
  // single entry in it; counting that array would file a player who did both
  // as a one-season rookie. `seasons` keeps its shape for those readers.
  player.totalSeasons = (player.seasonDetails || []).length;
  // One face for the list pages, DERIVED and never authoritative: it is
  // recomputed from the newest appearance every time, and it never writes back
  // down onto a season row. A career-level portrait that overwrote the season
  // rows would erase the point of recording them.
  const newest = [...(player.seasonDetails || [])]
    .sort((a, b) => (b.season || 0) - (a.season || 0))
    .find(d => d && d.avatarFile);
  player.latestAvatarFile = newest?.avatarFile || '';
  return player;
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

// ── Strategic score (shared) ─────────────────────────────────────────
// The single source of truth for a player's strategic-gameplay score, used by BOTH the
// season export/PDF and the in-game Reunion "Best Strategic" award. A measure of strategic
// SKILL, deliberately independent of how long the player lasted or whether they won:
// anchored on strategic ability (the designed stat) plus what they actually DID.
// Returns { strategicScore, advPlayed, advWasted, advHeld, impactfulMoves }.
export function computeStrategicScore(name) {
  const stats = pStats(name);
  const blindside = _extractBlindsideData(name);
  const social = _extractSocialData(name);
  const advantages = _extractAdvantageData(name);

  // Advantage breakdown: played EFFECTIVELY vs WASTED vs HELD-unused.
  const plays = advantages.plays || [];
  const isEffective = pl => !pl.fake && !pl.failed && !pl.misplay
    && (pl.type === 'idol' ? (pl.votesNegated || 0) > 0 : true);
  const advPlayed = plays.filter(isEffective).length;
  const advWasted = plays.length - advPlayed;
  const advHeld = (advantages.held || []).length;

  // Made the end? (finalist/winner) — used for the held-advantage penalty.
  const _fin = gs.finaleResult || {};
  const madeEnd = _fin.winner === name || (_fin.finalists || []).includes(name)
    || (gs.activePlayers || []).includes(name);

  // Strategic-impact "big moves": re-derived from the voting log rather than the raw
  // gs.playerStates.bigMoves counter (which balloons with survival — clutch immunity,
  // survived a rock draw, challenge beast, etc.). Count only moves where the player
  // PERSONALLY drove an outcome: breaking alliance consensus (a flip) or cutting a close
  // ally / showmance. (Blindsides + effective plays are scored separately below.)
  let impactfulMoves = 0;
  for (const ep of (gs.episodeHistory || [])) {
    const log = ep.votingLog || [];
    if (!log.length) continue;
    const myVote = log.find(e => e.voter === name);
    if (!myVote) continue;
    const boot = ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated;
    let impactful = /\bbroke\b/.test(myVote.reason || '');
    if (boot && myVote.voted === boot) {
      const bondAtEp = ep.gsSnapshot?.bonds?.[bKey(name, boot)];
      const wasShowmance = (gs.showmances || []).some(sm => sm.players?.includes(name) && sm.players?.includes(boot));
      if ((bondAtEp != null && bondAtEp >= 5) || wasShowmance) impactful = true;
    }
    if (impactful) impactfulMoves++;
  }

  let score =
      (stats.strategic || 0) * 2.0
    + (stats.intuition || 0) * 0.5
    + (stats.boldness  || 0) * 0.5
    + impactfulMoves * 1.5
    + blindside.blindsidesOrchestrated * 1.5
    + (social.schemesLaunched?.length || 0) * 1.0
    + advPlayed * 2.0
    - advWasted * 1.5
    + (advantages.finds?.length || 0) * 1.0;
  if (!madeEnd) score -= advHeld * 1.5;
  const strategicScore = Math.max(0, Math.round(score * 2) / 2); // 0.5-step scale

  return { strategicScore, advPlayed, advWasted, advHeld, impactfulMoves };
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

    // ── Strategic score + advantage breakdown (shared formula, used by the Reunion award too) ──
    const { strategicScore, advPlayed, advWasted, advHeld } = computeStrategicScore(name);

    playerData[name] = {
      playerSlug: _slug(name),
      ..._portraitOf(name),
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
    ..._portraitOf(name),
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
        // The analysis. Present in the template so a season exported without a
        // worker still has the shape, and an unfilled field says [AI_FILL]
        // rather than being silently absent.
        gameArchetype: '[AI_FILL]',
        resume: '[AI_FILL]',
        demise: '[AI_FILL]',
        demiseKind: '[AI_FILL]',
        optimalLine: '[AI_FILL]',
        ceiling: '[AI_FILL]',
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

  const _doc = {
    seasonNumber: rawStats.seasonNumber,
    // Mirrors the `format` the Big Brother template carries, so every consumer
    // of a season document reads the show off the same field either way.
    format: DEFAULT_FORMAT,
    seasonId: seasonId(DEFAULT_FORMAT, rawStats.seasonNumber),
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
    showmances: _extractShowmances(),
    alliances: _extractAlliances(),
    finalTribalCouncil: _extractFinalTribalCouncil(),
    twists: _extractTwists(),
    ratings: _extractRatings(),
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]',
    emoji: '[AI_FILL]'
  };
  // A camp has no block and no veto; the deeds it records are ballots, and
  // the board reads them the same way. See _attachVillainBoard.
  return _attachVillainBoard(_doc);
}


/**
 * How the season went down with the country, for the published document.
 *
 * Computed HERE and stored, not recomputed by the site. A published season
 * document is a summary — no camp events, no flipped ballots, no popularity —
 * so the pages that render it could only ever produce a different, worse
 * number from the one the simulator produced. One season, two ratings, is the
 * two-clocks problem this project keeps having.
 *
 * The per-episode curve is stored as bare numbers so the seasons page can draw
 * a sparkline without shipping every signal of every week.
 */
function _extractRatings() {
  try {
    // Always derived from the episode history rather than read off
    // `gs.ratings`, so an exported season and a re-rated one cannot differ.
    const derived = ratingsForSeason(gs?.episodeHistory || [],
      // seasonFormat() with no argument does not inspect anything: it returns
      // DEFAULT_FORMAT. So every Big Brother season was rated on Total Drama's
      // overlay, which is a different curve.
      { format: seasonFormat(seasonConfig) || DEFAULT_FORMAT });
    if (!derived) return null;
    return {
      v: derived.v,
      score: derived.score,
      tier: derived.tier,
      demos: Object.fromEntries(Object.entries(derived.demos)
        .map(([k, v]) => [k, Math.round(v * 10) / 10])),
      curve: derived.weeks.map(w => w.overall),
    };
  } catch { return null; }
}
// ── relationships, for both shows ─────────────────────────────────────
//
// THESE EXISTED ONLY WHILE A SEASON WAS BEING PLAYED. `gs.showmances` and
// `gs.namedAlliances` are written every episode and were never exported, so a
// finished season's document mentioned showmances in its narrative prose —
// "broken showmances", "showmance fallout" — and never once said WHO. A
// character page cannot report who somebody was with from a sentence like that,
// and neither can anything else.
//
// Recorded as pairs and member lists, so the question "are they in a couple" has
// an answer that does not involve reading paragraphs.

/** Every couple the season produced, together or not by the end. */
function _extractShowmances() {
  return (gs.showmances || []).map(sh => ({
    players: (sh.players || []).slice(0, 2),
    playerSlugs: (sh.players || []).slice(0, 2).map(n => _slug(n)),
    // `phase` is where it got to: spark, showmance, or broken.
    phase: sh.broken ? 'broken' : (sh.phase || 'showmance'),
    startEpisode: sh.sparkEp ?? sh.firstMoveEp ?? null,
    endEpisode: sh.breakupEp ?? null,
    // Ended how, when it ended — a breakup at a vote is a different story from
    // one at camp, and the character page will want to say which.
    endedBy: sh.breakupType || null,
    origin: sh.origin || null,
    episodesActive: sh.episodesActive ?? null,
  })).filter(sh => sh.players.length === 2);
}

/** Named alliances, with who was in them and who broke them. */
function _extractAlliances() {
  return (gs.namedAlliances || []).map(a => ({
    name: a.name,
    members: [...(a.members || [])],
    memberSlugs: (a.members || []).map(n => _slug(n)),
    formedEpisode: a.formed ?? null,
    active: a.active !== false,
    betrayals: (a.betrayals || []).map(b => (typeof b === 'string' ? b : b?.by || null)).filter(Boolean),
  }));
}

/**
 * Rivalries.
 *
 * Big Brother's Rivals twist locks two people who cannot stand each other into
 * the house together, and that pairing is the most consequential relationship
 * in the season it appears in. It lived in `gs.bb.rivals` and went nowhere.
 */
function _extractRivalries() {
  const out = [];
  const seen = new Set();
  const push = (a, b, source, extra = {}) => {
    if (!a || !b || a === b) return;
    const key = [a, b].sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ players: [a, b], playerSlugs: [a, b].map(n => _slug(n)), source, ...extra });
  };

  // The Rivals twist, which assigns them.
  for (const p of gs.bb?.rivals?.pairs || []) {
    push(p.player || p.a, p.rival || p.b, 'rivals-twist',
      { startWeek: gs.bb?.rivals?.startWeek ?? null });
  }

  /* ── AND THE ONES THE HOUSE MADE ITSELF ─────────────────────────────
     This read the twist and nothing else, so a season that did not run Rivals
     exported ZERO rivalries — every organic feud a cast generated over three
     months, gone. Big Brother 1 published with an empty list after a season of
     people who could not be in a room together, and the villain board had no
     way to see a fight at all.

     Bad blood is already measured: the bond matrix runs -10 to +10 and the
     whole engine reads it to decide who targets whom. Deeply negative is a
     feud whatever produced it, and it is the same fact the pages want. */
  const cast = (players || []).map(p => p.name).filter(Boolean);
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      let bond = 0;
      try { bond = Number(getBond(cast[i], cast[j])) || 0; } catch { bond = 0; }
      if (bond <= -5) push(cast[i], cast[j], 'bad-blood', { bond });
    }
  }
  return out;
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
      format: DEFAULT_FORMAT,
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

  // Take this season off everybody first, so a re-export with a changed cast
  // does not leave the people who were removed still holding an appearance.
  _stripSeasonFromAll(db, seasonNum, DEFAULT_FORMAT);

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

    // AI-assigned player emoji flows into the database so devotees.html stays
    // current without hand-editing its emojiMap. Latest season's emoji wins.
    // The placeholder is explicitly excluded: a season exported without the fill
    // pass carries the literal '[AI_FILL]', and writing that through would draw
    // it as the player's icon on every card they appear on.
    if (filled.emoji && filled.emoji !== '[AI_FILL]') player.emoji = filled.emoji;

    // Re-merge support: if this season was already recorded — whether as a
    // pre-season placeholder OR a previously-finalized result — strip its old
    // career contributions and season detail so the fresh data below replaces it.
    // (Previously an already-finalized season was skipped entirely with `continue`,
    // so re-exports/corrections never updated existing player records.)
    // The strip now happens once for every player before this loop starts —
    // see _stripSeasonFromAll at the top of the merge. Doing it per-player here
    // could only ever reach the NEW cast, which is how a player dropped from a
    // re-exported season kept the appearance forever.
    _stripSeasonFromPlayer(player, seasonNum);

    // Update career stats
    if (!player.seasons) player.seasons = [];
    if (!player.seasons.includes(seasonNum)) player.seasons.push(seasonNum);
    // totalSeasons is set by _rebuildByShow, once the details are final.
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
    player.seasonDetails.push(_tagSeasonDetail({
      season: seasonNum,
      avatarId: pd.avatarId || null,
      avatarFile: pd.avatarFile || '',
      placement: pd.placement,
      status: pd.phase,
      tribe: pd.tribe || '',
      challengeWins: pd.chalRecord?.wins || 0,
      immunityWins: pd.immunityWins,
      rewardWins: pd.rewardWins,
      votesReceived: pd.totalVotesReceived,
      // What the audience made of them. Live-only until now, which left fame
      // and every audience-facing page with nothing to read.
      popularity: Number(gs.popularity?.[player.name]) || 0,
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
      rivalries: pd.rivalries.map(r => r.player || r),
      // Who they were with, and whether they left together. See
      // _showmanceEndedOf — the Total Drama export never wrote this, so the
      // life layer had no idea any season had ever contained a romance.
      showmance: _bbShowmanceOf(player.name),
      showmanceEnded: _showmanceEndedOf(player.name)
    }, DEFAULT_FORMAT));

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

    _rebuildByShow(player);

    // Update badges
    if (pd.phase === 'Winner' && !player.badges?.includes(_winnerBadge(seasonNum))) {
      player.badges = player.badges || [];
      player.badges.push(_winnerBadge(seasonNum));
    }
  }

  // Update franchise metadata
  db.franchise = db.franchise || {};
  db.franchise.totalSeasons = seasonNum;
  db.franchise.totalPlayers = db.players.length;

  return db;
}

/**
 * When this season aired — kept if it was already known, placed if it was not.
 *
 * BOTH MERGES REPLACE THE WHOLE ROW so that a re-export can correct anything,
 * which means a re-export of a dated season would strip its air window and
 * silently un-place it on the franchise calendar. Every "the first player to…",
 * every age-at-season and every off-season depends on that window, so it is
 * read off the old row before the filter removes it.
 *
 * A brand new season has never had one — the calendar has always been written
 * by hand — and an undated season cannot have an off-season, because "after"
 * needs a "when". So it is placed by continuing the show's own rhythm rather
 * than left blank for somebody to notice later.
 */
function _airWindowFor(db, format, seasonNum) {
  const rows = (db && db.seasons) || [];
  const prior = rows.find(s => s.seasonNumber === seasonNum && (s.format || DEFAULT_FORMAT) === format);
  // An explicit choice in the season setup beats everything — including the
  // window a previous export stamped, because changing the dropdown and
  // re-exporting IS how you move a season on the calendar.
  const chosen = String(seasonConfig?.airWindow || 'auto');
  if (chosen !== 'auto' && chosen.includes('|')) {
    const [y, slot] = chosen.split('|');
    if (Number(y) && slot) return { airYear: Number(y), airSlot: slot };
  }
  if (prior && prior.airYear && prior.airSlot) {
    return { airYear: prior.airYear, airSlot: prior.airSlot };
  }
  return nextWindowFor(rows.filter(s => s !== prior), format) || {};
}

function _mergeSeasonsDatabase(existing, rawStats, template) {
  const db = JSON.parse(JSON.stringify(existing));
  const seasonNum = rawStats.seasonNumber;

  if (!db.seasons) db.seasons = [];
  // Read BEFORE the filter below removes the row it comes from.
  const airWindow = _airWindowFor(db, DEFAULT_FORMAT, seasonNum);

  // Same reason, same timing: the row is REBUILT from the document below, so
  // anything the document does not carry is destroyed by a re-publish. That
  // is how a season's tier vanished from the seasons page the moment it was
  // published again — the badge simply stopped rendering, which looks exactly
  // like a season nobody had rated.
  const priorRatings = (db.seasons.find(x =>
    x.seasonNumber === seasonNum && (x.format || DEFAULT_FORMAT) === DEFAULT_FORMAT) || {}).ratings || null;

  // Remove existing entry for this season (allows re-export to overwrite).
  // Matched on format too: `seasons` is keyed (format, season_number), so a
  // number-only filter would take Big Brother 1 out with Total Drama 1 and
  // orphan every Big Brother season detail pointing at it — which the sync
  // then drops silently, counting them as `skipped` and returning ok:true.
  db.seasons = db.seasons.filter(s =>
    !(s.seasonNumber === seasonNum && (s.format || DEFAULT_FORMAT) === DEFAULT_FORMAT));

  const aiAwards = template.awards || {};
  const bestStr = aiAwards.bestStrategic || aiAwards.masterStrategist?.gold;
  db.seasons.push({
    // The document carries its own rating (stats-export writes it at export
    // time); an older document that does not keeps whatever the index already
    // had, so re-publishing never costs a season its tier.
    ratings: template?.ratings || rawStats?.ratings || priorRatings || undefined,
    seasonNumber: seasonNum,
    // This merge is the Total Drama path — the house has its own (see
    // mergeBigBrotherSeason). Tagged here so the season record and the season
    // details land in the same show; the sync keys details off (format, number)
    // and SILENTLY SKIPS any detail whose season record does not match.
    format: DEFAULT_FORMAT,
    seasonId: seasonId(DEFAULT_FORMAT, seasonNum),
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
    emoji: _clean(template.emoji),
    ...airWindow
  });

  db.franchise = db.franchise || {};
  // Math.max, not assignment: two shows share this counter, and Big Brother 2
  // must not be walked back to 1 because somebody re-exported Total Drama 1.
  db.franchise.totalSeasons = Math.max(db.franchise.totalSeasons || 0, seasonNum);

  return db;
}

/**
 * Fold a finished Big Brother season into seasons_database.json.
 *
 * The counterpart to mergeBigBrotherSeason, which records the PLAYERS. Without
 * this there was no code path that wrote a Big Brother season record at all,
 * and the consequence was not a visible failure: `/api/sync-seasons` validates
 * every season detail against the (format, season_number) pairs it finds here,
 * so Big Brother details with no matching season record are dropped with
 * `ok:true` and nothing moving but `counts.skipped`. A whole season's worth of
 * player history would go missing with a success response on top of it.
 *
 * The Total Drama merge could not be reused: it reads the raw sim stats object
 * (`rawStats.castSize`, `autoAwards`, and so on), which a headless Big Brother
 * house never produces. The season document already carries every field this
 * record needs, so this reads that instead.
 */
export function mergeBigBrotherSeasonsDatabase(existing, seasonDoc) {
  if (!seasonDoc || seasonDoc.format !== 'big-brother') {
    throw new Error('mergeBigBrotherSeasonsDatabase expects a big-brother season document');
  }
  const seasonNum = seasonDoc.seasonNumber;
  if (!seasonNum) throw new Error('Big Brother season document has no seasonNumber');

  const db = JSON.parse(JSON.stringify(existing || {}));
  if (!db.seasons) db.seasons = [];
  const airWindow = _airWindowFor(db, 'big-brother', seasonNum);
  // Read before the filter, for the same reason the air window is: the row is
  // rebuilt from the document, so a field the document does not carry does not
  // survive a re-publish.
  const priorRatings = (db.seasons.find(x =>
    x.seasonNumber === seasonNum && x.format === 'big-brother') || {}).ratings || null;

  // Format-matched, so re-exporting Big Brother 1 leaves Total Drama 1 alone.
  db.seasons = db.seasons.filter(s =>
    !(s.seasonNumber === seasonNum && s.format === 'big-brother'));

  const awards = seasonDoc.awards && typeof seasonDoc.awards === 'object' ? seasonDoc.awards : {};
  const named = a => (a?.name ? { name: a.name, playerSlug: a.playerSlug || _slug(a.name) } : null);
  // Most competition wins is derivable here and nowhere else — the Total Drama
  // path gets it from autoAwards, which the house does not build.
  const topComp = (seasonDoc.placements || [])
    .map(p => ({ name: p.name, wins: (p.bb?.hohWins || 0) + (p.bb?.vetoWins || 0) }))
    .filter(p => p.wins > 0)
    .sort((a, b) => b.wins - a.wins)[0] || null;

  db.seasons.push({
    ratings: seasonDoc?.ratings || priorRatings || undefined,
    seasonNumber: seasonNum,
    format: 'big-brother',
    seasonId: seasonId('big-brother', seasonNum),
    title: _clean(seasonDoc.title, `Big Brother ${seasonNum}`),
    subtitle: _clean(seasonDoc.subtitle),
    castSize: seasonDoc.castSize,
    // Big Brother counts weeks where Total Drama counts episodes. The field is
    // shared because every consumer reads it as "how long was this season".
    episodeCount: seasonDoc.episodeCount,
    jurySize: seasonDoc.jurySize || 0,
    winner: {
      name: seasonDoc.winner?.name || null,
      playerSlug: seasonDoc.winner?.playerSlug || _slug(seasonDoc.winner?.name || ''),
      vote: _clean(seasonDoc.winner?.vote),
      runnerUp: _clean(seasonDoc.winner?.runnerUp),
      keyStats: _clean(seasonDoc.winner?.keyStats),
      strategy: _clean(seasonDoc.winner?.strategy),
      legacy: _clean(seasonDoc.winner?.legacy),
    },
    awards: {
      fanFavorite: named(awards.fanFavorite),
      bestStrategic: named(awards.bestStrategic || awards.masterStrategist?.gold),
      mostChallengeWins: topComp
        ? { name: topComp.name, playerSlug: _slug(topComp.name), detail: `${topComp.wins} comp wins` }
        : null,
    },
    theme: _clean(seasonDoc.seasonNarrative, _clean(seasonDoc.subtitle)),
    status: 'Complete',
    castPhotoPath: `assets/cast/${seasonId('big-brother', seasonNum)}-cast.png`,
    emoji: _clean(seasonDoc.emoji),
    ...airWindow,
  });

  db.franchise = db.franchise || {};
  db.franchise.totalSeasons = Math.max(db.franchise.totalSeasons || 0, seasonNum);

  return db;
}

// ── 18. downloadSeasonExport ────────────────────────────────────────

// ── 18. Export & Fill Narratives (combined) ─────────────────────────────
// Extracts stats → calls AI for narratives → merges databases with
// filled data → downloads everything at the end.

/**
 * Ask the AI worker to fill a season template's narrative fields.
 *
 * Show-agnostic on purpose: it only ever touches fields both season documents
 * share (title, subtitle, narrative, winner blurbs, per-placement prose), so
 * the Big Brother export gets the same treatment without a second copy of this
 * drifting out of step with the Total Drama one.
 *
 * Returns the filled document, or the template untouched when there is nothing
 * for the worker to read.
 */
async function _fillNarratives(template, episodes, workerUrl, onStatus) {
  // Silence here reads exactly like success: the season comes back with every
  // narrative field still saying [AI_FILL] and nothing anywhere says the worker
  // was never called. Say so.
  if (!episodes.some(e => e.summary)) {
    const msg = 'No episode text to write from — narratives left unfilled.';
    console.warn(`${msg} (${episodes.length} episode(s), none with a summary)`);
    onStatus?.(msg);
    return template;
  }

  // ── THE RECORD, NOT JUST THE PROSE ──
  //
  // The writer used to get episode text and a line of totals, and was asked for
  // an analyst's read of a game it could only see narrated. It cannot be done:
  // whether a veto was won under threat or from safety, whether somebody's
  // safety was won or granted, whether they were in the room when the house
  // decided — none of that survives into prose, and all of it is the analysis.
  //
  // Computed here rather than asked for, so the numbers in the verdict are the
  // numbers in the game.
  let gameRecord = null;
  try {
    const weeks = (gs?.bb?.weeks || []).filter(Boolean);
    if (weeks.length) {
      gameRecord = recordLines(seasonRecord(weeks, {
        finalists: (template.placements || []).slice().sort((a, b) => a.placement - b.placement)
          .map(p => p.name),
        alliances: gs.namedAlliances || [],
        juryVotes: Object.fromEntries((template.placements || [])
          .map(p => [p.name, p.juryVotes || 0])),
      }));
    }
  } catch (err) {
    console.warn('[narrative-fill] game record unavailable, sending prose only:', err?.message || err);
  }

  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'narrative-fill',
      template,
      episodes,
      gameRecord,
      season: template.seasonNumber,
      seasonTitle: template.title,
      // The worker writes in the voice of the show it is given.
      format: template.format || DEFAULT_FORMAT,
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Worker failed (${response.status}): ${errText}`);
  }

  const aiResult = await response.json();
  const filled = JSON.parse(JSON.stringify(template));

  if (aiResult.title && aiResult.title !== '[AI_FILL]') filled.title = aiResult.title;
  if (aiResult.subtitle && aiResult.subtitle !== '[AI_FILL]') filled.subtitle = aiResult.subtitle;
  if (aiResult.seasonNarrative) filled.seasonNarrative = aiResult.seasonNarrative;

  if (aiResult.winner) {
    if (aiResult.winner.keyStats) filled.winner.keyStats = aiResult.winner.keyStats;
    if (aiResult.winner.strategy) filled.winner.strategy = aiResult.winner.strategy;
    if (aiResult.winner.legacy) filled.winner.legacy = aiResult.winner.legacy;
  }

  if (aiResult.placements && Array.isArray(aiResult.placements)) {
    for (const aiP of aiResult.placements) {
      const target = filled.placements.find(p => p.name === aiP.name);
      if (!target) continue;
      if (aiP.notes) target.notes = aiP.notes;
      if (aiP.strategicRank != null) target.strategicRank = aiP.strategicRank;
      if (aiP.story) target.story = aiP.story;
      if (aiP.gameplayStyle) target.gameplayStyle = aiP.gameplayStyle;
      if (aiP.keyMoments) target.keyMoments = aiP.keyMoments;
      if (aiP.emoji) target.emoji = aiP.emoji;
      // The analysis. Each one is a question the database can be asked later —
      // every comp beast who lost at final three, everybody whose ceiling was
      // "could have won" — which is why the two taxonomy fields are enums and
      // not prose.
      if (aiP.gameArchetype) target.gameArchetype = aiP.gameArchetype;
      if (aiP.resume) target.resume = aiP.resume;
      if (aiP.demise) target.demise = aiP.demise;
      if (aiP.demiseKind) target.demiseKind = aiP.demiseKind;
      if (aiP.optimalLine) target.optimalLine = aiP.optimalLine;
      if (aiP.ceiling) target.ceiling = aiP.ceiling;
    }
  }

  if (aiResult.awards && typeof aiResult.awards === 'object') filled.awards = aiResult.awards;
  if (aiResult.emoji) filled.emoji = aiResult.emoji;
  return filled;
}

/** The Season Builder worker URL, asked for once and remembered. */
function _resolveWorkerUrl() {
  let workerUrl = localStorage.getItem('SEASON_BUILDER_WORKER_URL');
  if (workerUrl) return workerUrl;
  workerUrl = prompt('Enter your Season Builder Worker URL (Cloudflare Worker):');
  if (!workerUrl || !workerUrl.trim()) return null;
  workerUrl = workerUrl.trim();
  localStorage.setItem('SEASON_BUILDER_WORKER_URL', workerUrl);
  return workerUrl;
}

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
  const workerUrl = _resolveWorkerUrl();
  if (!workerUrl) return;

  const episodes = (gs.episodeHistory || []).map((ep, i) => ({
    episode: i + 1,
    summary: ep.summaryText || ''
  }));

  const finalSeasonData = await _fillNarratives(template, episodes, workerUrl, _status);

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

  // Step 4a: hand the documents to the Worker, which commits them and refreshes
  // D1. This replaces the old routine of downloading four files and moving them
  // into the repo by hand. Falls back to downloads if there's no backend.
  const published = await _publishSeasonToSite({
    seasonNumber: seasonNum,
    format: DEFAULT_FORMAT,
    season: finalSeasonData,
    franchise: franchiseDb,
    players: playersDb,
    seasons: seasonsDb,
  }, _status);
  if (published) return published;

  // Step 4b: fallback — download everything together
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

/**
 * Export a finished Big Brother season: the house's counterpart to
 * exportAndFillNarratives.
 *
 * This is the piece that was missing rather than broken. The extractor and both
 * merges existed and were tested, but nothing in the application ever called
 * them — the only export button ran the Total Drama path, which reads chalRecord
 * and tribes off the raw sim stats and cannot describe a house at all. A
 * finished Big Brother season could not be exported by any route.
 *
 * The shape deliberately mirrors the Total Drama flow — extract, fill, merge,
 * publish, fall back to downloads — because the publish endpoint, the D1 sync
 * and the site all read one season-document format regardless of show.
 */
/**
 * Build the season document for the Big Brother season currently in memory.
 *
 * Split out from the export so the whole shape of a finished season can be
 * checked without a network, a worker or a DOM — the export around it is the
 * fetching and the file writing, and neither is testable.
 *
 * Throws with a message meant to be shown to whoever pressed the button.
 */
/**
 * Every alliance a houseguest was named in, across the season.
 *
 * READ FROM LIVE STATE, not from the weeks. A week carries `openingState` and
 * `closingState` while it is being played and both are deleted the moment it
 * finishes (bb-run.js) and stripped again on save (savestate.js) — they were
 * the largest thing in the file and nothing read them. Reading a week snapshot
 * here would have returned an empty list for every houseguest in every season,
 * silently, which reads as "played alone" rather than as a bug.
 *
 * `gs.namedAlliances` keeps dissolved alliances with a flag rather than
 * removing them, so it is the whole season and not just what survived to the
 * finale — which is the point: the group that ran the first month counts.
 */
function _bbAlliancesOf(name) {
  return (gs.namedAlliances || [])
    .filter(a => (a.members || []).includes(name) && a.name)
    .map(a => a.name);
}

/** Who they were against — the Rivals twist pairs, which is what a house records. */
function _bbRivalsOf(name) {
  const out = new Set();
  for (const r of _extractRivalries()) {
    if (r.players.includes(name)) {
      for (const other of r.players) if (other !== name) out.add(other);
    }
  }
  return [...out];
}

/**
 * The showmance, if there was one: the partner's name, or an empty string.
 *
 * Broken ones count. "Together until week six" is a fact about somebody's
 * season, and a page that only lists showmances that survived describes a
 * different house from the one that was played.
 */
function _bbShowmanceOf(name) {
  const sh = (gs.showmances || []).find(x => (x.players || []).includes(name));
  return sh ? ((sh.players || []).find(n => n !== name) || '') : '';
}

/**
 * And HOW it ended, which decides whether it leaves the show with them.
 *
 * `showmance` alone says two people were together at some point in a season and
 * nothing about whether they still are — so the life layer could not tell a
 * couple who walked out together from one that blew up in week six. It was
 * reading the field anyway, and getting `undefined` for every season ever
 * played, because until now only the Big Brother export wrote it at all: 0 of
 * 280 season details had one. Every relationship the off-season resolver has
 * ever proposed came from the close-friend fallback, and not once from an
 * actual romance the audience watched.
 *
 * 'intact' — still together when the season ended.
 * 'broken' — it ended on screen.
 */
function _showmanceEndedOf(name) {
  const sh = (gs.showmances || []).find(x => (x.players || []).includes(name));
  if (!sh) return '';
  // SEPARATED IS NOT A BREAK-UP, and this read it as one.
  //
  // romance.js sets `breakupType = 'separated'` when one of them is voted out
  // and the other stays, and says so in as many words: "not betrayal --
  // relationship intact, just physically apart". It keeps the bond high on
  // purpose, because it is grief rather than anger. `phase` still goes to
  // 'broken-up' only because the couple is no longer active IN THE HOUSE.
  //
  // Testing the phase alone therefore called every evicted-apart couple a
  // break-up, and the life layer excludes broken ones by design -- so two
  // people the audience watched stay together right to the finale walked out
  // of it as exes, and could never be paired in the off-season.
  if (sh.breakupType === 'separated') return 'intact';
  // The same distinction one line further out: a betrayal always tanks the
  // relationship, and whether it ENDS it depends on what it was. One that was
  // deep enough to survive being voted out is not a couple who broke up, and
  // the life layer must be able to pair them afterwards.
  if (sh.breakupType === 'betrayed-survived') return 'intact';
  return (sh.broken || sh.phase === 'broken-up' || sh.breakupEp) ? 'broken' : 'intact';
}

export function buildBigBrotherSeasonDocument(seasonNumber) {
  const weeks = gs.bb?.weeks || [];
  if (!weeks.length) throw new Error('No Big Brother weeks have been played yet.');

  // Placements come from the finale, which is the only thing that knows who
  // actually won — the week engine stops at a final three.
  const finale = gs.bb?.finale;
  if (!finale?.winner) {
    throw new Error('This season has not crowned a winner yet — play the finale before exporting.');
  }
  const finalists = [finale.winner, finale.runnerUp, finale.cut].filter(Boolean);
  const jury = finale.jury || [];

  const doc = extractBigBrotherSeasonTemplate(weeks, finalists, {
    seasonNumber,
    jurySize: jury.length,
  });

  // The extractor writes juryVotes: 0 for everybody, because the WEEK engine
  // holds no jury vote — which stopped being true when the finale landed. The
  // real tally goes in here; without it every Big Brother winner publishes with
  // a nothing-to-nothing win.
  const votes = finale.votes || {};
  for (const p of doc.placements) p.juryVotes = Number(votes[p.name]) || 0;
  if (doc.winner) {
    doc.winner.vote = finalists.map(n => `${n} ${Number(votes[n]) || 0}`).join(' — ');
  }
  return _attachVillainBoard(doc);
}

/**
 * Export whichever season is loaded, by its format.
 *
 * The export button used to call the Total Drama path directly, which is why a
 * Big Brother season could be played to a winner and then not be exportable:
 * the button worked, it just ran an exporter that reads tribes and challenge
 * records off a house that has neither. One entry point, one decision.
 */
// ── WRITING THE WIKI AS PART OF THE EXPORT ───────────────────────────
//
// Filling a season used to mean leaving the simulator for current-season.html,
// pressing two buttons, and merging two downloads by hand. The export already
// knows the season, the show and how to publish, and the fills need exactly
// that plus the transcripts — which are in IndexedDB, readable from any page.
//
// Off by default and remembered. An export is re-run for reasons that have
// nothing to do with prose (a missing field, a re-sync), and every fill is two
// paid calls that would also overwrite anything written by hand since.
const WIKI_FILL_FLAG = 'wiki_fill_on_export';

export function wikiFillOnExport() {
  try { return localStorage.getItem(WIKI_FILL_FLAG) === 'on'; } catch { return false; }
}

export function setWikiFillOnExport(on) {
  try {
    if (on) localStorage.setItem(WIKI_FILL_FLAG, 'on');
    else localStorage.removeItem(WIKI_FILL_FLAG);
  } catch { /* private browsing */ }
  return wikiFillOnExport();
}

/**
 * Run both fills after an export has published the season document.
 *
 * The season document has to be in the repo first: the fill posts only what it
 * produced and the worker merges it into the file that is there. So this runs
 * AFTER the export, and says so plainly when publishing is off rather than
 * spending two calls on an answer it cannot save.
 */
async function _fillWikiAfterExport(onStatus) {
  const _status = onStatus || (() => {});
  const { committingIsOff, runBothFills } = await import('./wiki-fill-run.js');
  if (committingIsOff()) {
    _status('Wiki fill skipped: publishing is off, so there is nothing to write into. '
      + 'Turn publishing on, or use the buttons on the Current Season page to get a file.');
    return null;
  }
  const season = _getSeasonNumber();
  const format = seasonFormat(seasonConfig) || DEFAULT_FORMAT;
  const out = await runBothFills({ season, format, onStatus: t => _status(`Wiki: ${t}`) });

  const bits = [];
  for (const r of [out.characters, out.gameHistory]) {
    if (!r) continue;
    if (!r.ok) { bits.push(`${r.reason}`); continue; }
    if (r.sent?.failed) { bits.push(`wrote ${r.filled} but could not commit (${r.sent.failed})`); continue; }
    bits.push(r.kind === 'characters'
      ? `${r.filled} of ${r.cast} in the cast`
      : `${r.filled} of ${r.rounds} rounds`);
  }
  _status(`Wiki fill: ${bits.join(' · ')}`);
  return out;
}

// ── THE OFF-SEASON, RESOLVED ON ARRIVAL ──────────────────────────────
//
// Finishing a season is what should fill the life inbox. It used to be opening
// life.html: the world only moved on if the author remembered to visit a page.
//
// On by default, unlike the wiki fill, because the two cost completely
// different things. A fill is two paid calls that overwrite prose somebody may
// have written by hand; this is local arithmetic that produces PROPOSALS, and a
// proposal changes nothing a reader sees until it is committed in the inbox.
// There is nothing to protect by making it opt-in, and plenty to lose — a
// forgotten off-season is a hole in every character's life.
const LIFE_HOOK_FLAG = 'life_hook_off_export';

export function lifeHookOnExport() {
  try { return localStorage.getItem(LIFE_HOOK_FLAG) !== 'off'; } catch { return true; }
}

export function setLifeHookOnExport(on) {
  try {
    if (on) localStorage.removeItem(LIFE_HOOK_FLAG);
    else localStorage.setItem(LIFE_HOOK_FLAG, 'off');
  } catch { /* private browsing */ }
  return lifeHookOnExport();
}

/**
 * Propose what happened to everybody after the season just exported.
 *
 * AFTER the publish, because it reads the published record: the resolver needs
 * the season to be on the calendar and the cast to be in players_database.json,
 * and both of those are what the export has just written. It says so plainly
 * when the season is not there — with publishing off, the export downloads
 * files and the site is unchanged, so there is nothing to resolve yet and
 * life.html will pick the gap up when there is.
 */
async function _resolveLifeAfterExport(onStatus, seasonNum, format) {
  const _status = onStatus || (() => {});
  const { resolveAfterSeason } = await import('./life-hook.js');
  const out = await resolveAfterSeason({ seasonNumber: seasonNum, format });
  if (!out.ok) { _status(`Life: skipped — ${out.reason}`); return out; }
  _status(out.added
    ? `Life: ${out.added} event${out.added === 1 ? '' : 's'} proposed after `
      + `${out.season.title || out.season.seasonId} — ${out.reason}. Review them on the Life page.`
    : `Life: ${out.reason}`);
  return out;
}

/**
 * Which builder exports a season of which show.
 *
 * NOT A SHOW LIST AND NOT A BRANCH. This used to be one equality test against
 * the Big Brother slug, picking that show's builder or the default show's,
 * which sent every OTHER show — a third one included — down Total Drama's
 * export unasked: no error, no empty result, just a Traitors season published
 * as a camp. A third branch would have been
 * the next show's identical bug, so a show REGISTERS its builder and anything
 * with no builder registered falls back to the default show, which is the
 * bare-integer rule stated once more.
 *
 * Populated by calls rather than written as a literal, so adding a show is one
 * registration next to that show's code and nothing here changes.
 */
const SEASON_EXPORTERS = new Map();

export function registerSeasonExporter(format, build) {
  if (!SHOWS[format]) {
    throw new Error(
      `cannot register a season exporter for unknown format "${format}" — `
      + `add it to SHOWS in js/shows.js first (known: ${Object.keys(SHOWS).join(', ')})`);
  }
  SEASON_EXPORTERS.set(format, build);
  return build;
}

/** The builder for a format, or the default show's. Exported for the guard. */
export function seasonExporterFor(format) {
  return SEASON_EXPORTERS.get(format) || exportAndFillNarratives;
}

/**
 * The Traitors, and a REFUSAL rather than a wrong export.
 *
 * There is no live run loop for this show yet — a season is played headless by
 * `playTraitorsSeason` and turned into a document by `buildTraitorsSeasonDocument`
 * in js/tr/export.js — so the simulator has nothing to export from. Before this
 * registration existed, asking for it exported a CAMP: the dispatch fell through
 * to the default show, ran the Total Drama pipeline over a castle, and published
 * it. Refusing by name is the same choice `POST /api/publish-season` makes about
 * an unregistered format, and for the same reason: being told nothing is
 * recoverable, being told the wrong show is not.
 */
export async function exportTraitorsSeason() {
  throw new Error(
    `${SHOWS.traitors.name} has no live export path yet — a season is played headless `
    + '(playTraitorsSeason) and turned into a document by buildTraitorsSeasonDocument() '
    + `in js/tr/export.js. Refusing rather than exporting it as ${SHOWS[DEFAULT_FORMAT].name}.`);
}

// Registered here rather than declared in the registry, so js/shows.js stays a
// leaf and a show's builder lives next to that show's code. Function
// declarations hoist, so the order of these lines does not matter.
registerSeasonExporter(DEFAULT_FORMAT, exportAndFillNarratives);
registerSeasonExporter('big-brother', exportAndFillBigBrotherSeason);
registerSeasonExporter('traitors', exportTraitorsSeason);

/**
 * Drag Race, and a REFUSAL rather than a wrong export.
 *
 * The season document for this show is a THIRD round shape — `episodes[]`, a
 * placement grid with no ballot anywhere — and nothing builds it yet (Plan 4).
 * Falling through to the default would run the Total Drama pipeline over a
 * runway and publish it: a season document in the wrong show's shape, with no
 * error and no empty result. Refusing by name is the same choice
 * POST /api/publish-season makes about an unregistered format, and for the same
 * reason — being told nothing is recoverable, being told the wrong show is not.
 */
export async function exportDragRaceSeason() {
  throw new Error(
    `${SHOWS['drag-race'].name} has no export path yet — a season is played by `
    + 'js/dr/season.js and the episodes[] document builder is not written. '
    + `Refusing rather than exporting it as ${SHOWS[DEFAULT_FORMAT].name}.`);
}
registerSeasonExporter('drag-race', exportDragRaceSeason);

export async function exportSeason(onStatus) {
  const out = await seasonExporterFor(seasonFormat(seasonConfig) || DEFAULT_FORMAT)(onStatus);
  // The prose comes after the record, because the fill patches the committed
  // document. A failure here never fails the export — the season is already
  // published and the fill can be run again from the Current Season page.
  if (wikiFillOnExport()) {
    try { await _fillWikiAfterExport(onStatus); }
    catch (e) { (onStatus || (() => {}))(`Wiki fill failed: ${e.message || e}`); }
    }
  // Last, and never able to fail the export: the season is already published,
  // and an off-season that did not resolve here resolves on the Life page.
  if (lifeHookOnExport()) {
    try {
      await _resolveLifeAfterExport(onStatus, _getSeasonNumber(),
        seasonFormat(seasonConfig) || DEFAULT_FORMAT);
    } catch (e) { (onStatus || (() => {}))(`Life resolver failed: ${e.message || e}`); }
  }
  return out;
}

export async function exportAndFillBigBrotherSeason(onStatus) {
  const _status = onStatus || (() => {});

  _status('Extracting the season...');
  const seasonNum = _getSeasonNumber();
  let template;
  try {
    template = buildBigBrotherSeasonDocument(seasonNum);
  } catch (err) {
    alert(err.message || String(err));
    return;
  }

  const workerUrl = _resolveWorkerUrl();
  if (!workerUrl) return;

  _status('Calling AI Worker...');
  let episodes = (gs.episodeHistory || []).map((ep, i) => ({
    episode: i + 1,
    summary: ep.summaryText || '',
  }));

  // The week engine is the season's real record; gs.episodeHistory is written by
  // the PLAYED path only. A house simulated straight through, or one restored
  // from a save that did not carry the transcripts, leaves the history empty or
  // textless — and the export would then hand the worker a stack of blank
  // summaries and get [AI_FILL] back with nothing to explain it. The weeks can
  // always be re-narrated from what they recorded.
  if (!episodes.some(e => e.summary) && (gs.bb?.weeks || []).length) {
    episodes = gs.bb.weeks.map((w, i) => {
      let summary = '';
      try { summary = summariseWeek(w) || ''; } catch { summary = ''; }
      return { episode: w?.num || i + 1, summary };
    });
    if (episodes.some(e => e.summary)) {
      _status('Rebuilding the season transcript from the weeks…');
    }
  }

  let finalSeasonData;
  try {
    finalSeasonData = await _fillNarratives(template, episodes, workerUrl, _status);
  } catch (err) {
    // A missing narrative is a worse export, not a lost season.
    console.warn('Narrative fill failed, publishing the raw season:', err);
    _status('AI fill failed — publishing without narratives.');
    finalSeasonData = template;
  }

  if (!finalSeasonData.awards || typeof finalSeasonData.awards !== 'object') finalSeasonData.awards = {};
  // Read again rather than closed over: the finale moved into
  // buildBigBrotherSeasonDocument and this was left pointing at nothing.
  const favourite = gs.bb?.finale?.favourite;
  if (!finalSeasonData.awards.fanFavorite?.name && favourite?.winner) {
    const fav = favourite.winner;
    finalSeasonData.awards.fanFavorite = {
      name: fav,
      playerSlug: _slug(fav),
      description: `${fav} was voted the house's favourite by the audience.`,
    };
  }

  _status('Merging databases...');
  let playersDb = null, seasonsDb = null;
  try {
    const [playersResp, seasonsResp] = await Promise.all([
      fetch('players_database.json').catch(() => null),
      fetch('seasons_database.json').catch(() => null),
    ]);
    const playersExisting = playersResp?.ok ? await playersResp.json() : { franchise: {}, players: [] };
    const seasonsExisting = seasonsResp?.ok ? await seasonsResp.json() : { franchise: {}, seasons: [] };

    playersDb = mergeBigBrotherSeason(playersExisting, finalSeasonData);
    seasonsDb = mergeBigBrotherSeasonsDatabase(seasonsExisting, finalSeasonData);
    if (seasonsDb && playersDb?.players) {
      seasonsDb.franchise = seasonsDb.franchise || {};
      seasonsDb.franchise.totalPlayers = playersDb.players.length;
    }
  } catch (err) {
    // Publishing a season document with no databases behind it would leave the
    // site describing a season none of its players know they played.
    alert('Could not merge the databases: ' + (err.message || err));
    return;
  }

  const published = await _publishSeasonToSite({
    seasonNumber: seasonNum,
    format: 'big-brother',
    season: finalSeasonData,
    players: playersDb,
    seasons: seasonsDb,
  }, _status);
  if (published) return published;

  _status('Downloading files...');
  const file = `${seasonId('big-brother', seasonNum)}-data.json`;
  _downloadJSON(finalSeasonData, file);
  if (playersDb) setTimeout(() => _downloadJSON(playersDb, 'players_database.json'), 500);
  if (seasonsDb) setTimeout(() => _downloadJSON(seasonsDb, 'seasons_database.json'), 1000);
}

// ── Big Brother season export ────────────────────────────────────────
// Turns the week objects produced by js/bb/week.js into the same season
// document shape the rest of the pipeline already understands, so publishing,
// the D1 sync and the site need no Big Brother special-casing beyond a format
// tag and a per-player `bb` block.
//
// The engine is deliberately headless and knows nothing about `ep` or about
// season documents; this is the adapter that lives on the integration side.

/**
 * Derive placements from an eviction order.
 * Evicted first = worst placement. Finalists take the top spots, and among them
 * the winner is decided by the jury, which the engine does not model yet — so
 * finalists are returned in the order given and the caller may reorder.
 */
function _bbPlacements(weeks, finalists) {
  // ── SOMEBODY WHO COMES BACK IS EVICTED TWICE ──
  //
  // This counted eviction EVENTS and numbered down from their total, so a
  // houseguest who returned consumed two places and occupied one: their first
  // exit was overwritten by their second, the abandoned number became a
  // permanent hole, and everybody evicted before them was pushed a place
  // further down.
  //
  // Measured on the first season with a return in it: fifteen evictions,
  // fourteen people, a cast of seventeen numbered one to EIGHTEEN with no
  // thirteenth place -- and the first boot listed as eighteenth in a
  // seventeen-player season.
  //
  // Only the LAST exit places you. Coming back and lasting six more weeks is
  // not a worse result than going out the first time.
  const order = [];
  weeks.map(w => w.evicted).filter(Boolean).forEach(name => {
    const at = order.indexOf(name);
    if (at >= 0) order.splice(at, 1);
    order.push(name);
  });
  // A finalist cannot also hold an eviction slot -- a returnee who made the
  // final three would otherwise be counted in both halves.
  const dense = order.filter(name => !finalists.includes(name));
  const total = dense.length + finalists.length;
  const placement = {};
  dense.forEach((name, i) => { placement[name] = total - i; });
  finalists.forEach((name, i) => { placement[name] = i + 1; });
  return placement;
}

/** Per-player Big Brother stats, accumulated across the season's weeks. */
function _bbStats(weeks) {
  const stat = {};
  const ensure = name => (stat[name] ||= {
    hohWins: 0, vetoWins: 0, timesNominated: 0, timesOnBlock: 0, timesSaved: 0, votesReceived: 0,
    // The arena, kept apart from the comps. See the résumé note below.
    blockBusterWins: 0, blockBusterPlayed: 0, blockBusterStreak: 0, blockBusterWeeks: [],
  });

  for (const week of weeks) {
    if (week.hoh) ensure(week.hoh).hohWins++;
    if (week.vetoWinner) ensure(week.vetoWinner).vetoWins++;

    // ── THE BLOCK BUSTER ────────────────────────────────────────────
    //
    // Tracked by the engine since it was built and exported by nothing, so a
    // houseguest who won their way off the block three weeks running had a
    // résumé reading "no competition wins, three trips to the block" — which
    // describes somebody lucky, and they were the opposite.
    //
    // Counted separately from HOH and veto rather than added to them: those
    // are won from safety or for safety, and this one is won with your name
    // already on the wall, minutes before the vote. `played` makes the wins
    // mean something, and the weeks make a streak possible.
    for (const name of week.blockBeforeSafety || []) ensure(name).blockBusterPlayed++;
    if (week.safetyWinner) {
      const r = ensure(week.safetyWinner);
      r.blockBusterWins++;
      r.blockBusterWeeks.push(week.num);
    }

    // Nominated counts every time a name went up, including as a replacement.
    const nominated = new Set([...(week.initialNominees || []), ...(week.finalNominees || [])]);
    nominated.forEach(name => ensure(name).timesNominated++);

    // On the block counts only reaching eviction night still nominated — the
    // distinction the veto exists to create. Somebody the arena took off the
    // block never reached eviction night on it, which is the point of the
    // twist and is why they are counted in blockBusterPlayed instead.
    (week.finalNominees || []).forEach(name => ensure(name).timesOnBlock++);

    // Who the VETO took off, not merely who left the block. A Coup replaces
    // both nominees and a detonated Diamond takes somebody down on its own
    // holder's authority, and counting those here credited the veto with saves
    // it never made — in a field that then feeds the season's analysis.
    vetoSavedIn(week).forEach(name => ensure(name).timesSaved++);

    Object.entries(week.votes || {}).forEach(([name, count]) => { ensure(name).votesReceived += count; });
  }

  // The consecutive run, which is the part a total cannot say. Three saves in
  // weeks 3, 4 and 5 is a houseguest the house could not remove; three in
  // weeks 2, 6 and 9 is a houseguest who kept ending up there. Same number.
  for (const r of Object.values(stat)) {
    let run = 0;
    for (let i = 0; i < r.blockBusterWeeks.length; i++) {
      run = (i && r.blockBusterWeeks[i] === r.blockBusterWeeks[i - 1] + 1) ? run + 1 : 1;
      if (run > r.blockBusterStreak) r.blockBusterStreak = run;
    }
  }
  return stat;
}

/**
 * Build a season document for a finished Big Brother season.
 *
 * @param {object[]} weeks      the week objects from simulateBBSeason()
 * @param {string[]} finalists  final placings, best first
 * @param {object}   meta       { seasonNumber, castSize, jurySize }
 */
/**
 * A houseguest's strategic-gameplay score, 0-10, from the house's own record.
 *
 * `computeStrategicScore()` above is Total Drama's and cannot be pointed at a
 * season of this: it reads `gs.episodeHistory` and `ep.votingLog`, which a
 * house does not keep, so every behavioural term in it comes back zero and
 * what is left is the stat line. A score that is only ability is exactly what
 * "Behavior > Stats" forbids, so this reads the ledger the house DOES keep --
 * who called a vote that landed, who read the room right, who spent a power.
 *
 * ON THE 0-10 SCALE, deliberately. The board multiplies this column by 0.12,
 * which was calibrated against the AI-filled `strategicRank` (S1 ran 2.0 to
 * 9.2) and caps the term at about one competition win. Total Drama's raw score
 * runs 15-30 and would land two to three times heavier than any veto.
 */
function _bbStrategic(weeks, finalists) {
  const fin = new Set(finalists || []);
  const rec = {};
  const ensure = n => (rec[n] ||= { plans: 0, correct: 0, votes: 0, active: 0 });

  // ── WHO WAS IN THE HOUSE, REBUILT ──
  //
  // A week does not carry its roster, and counting only the weeks somebody
  // cast a ballot gets this wrong twice over: a NOMINEE cannot vote, so the
  // people in the most danger looked the least active and their per-week rates
  // inflated to the cap; and anybody who never voted at all -- the first boot --
  // fell out of the record entirely and scored zero, which is the survival
  // clock walking back in through the door the rates were built to shut.
  //
  // So the roster is reconstructed: everyone the season ever mentions is in the
  // house until the week they leave.
  const cast = new Set();
  for (const w of weeks) {
    [w.hoh, w.vetoWinner, w.evicted, w.safetyWinner].forEach(n => n && cast.add(n));
    [...(w.initialNominees || []), ...(w.finalNominees || []),
     ...(w.blockBeforeSafety || [])].forEach(n => n && cast.add(n));
    (w.ballots || []).forEach(b => b?.voter && cast.add(b.voter));
  }
  const gone = new Set();
  for (const week of weeks) {
    const evicted = week.evicted;
    for (const name of cast) if (!gone.has(name)) ensure(name).active++;
    for (const plan of (week.voteOperation?.plans || [])) {
      if (plan?.organizer && evicted && plan.target === evicted) ensure(plan.organizer).plans++;
    }
    for (const b of (week.ballots || [])) {
      if (!b?.voter) continue;
      const r = ensure(b.voter);
      r.votes++;
      if (evicted && b.evict === evicted) r.correct++;
    }
    // A returnee is counted out only from the week they last leave, which the
    // placement deriver already treats as the exit that places them.
    if (evicted) gone.add(evicted);
  }

  // ── RATES, NOT TOTALS ──
  //
  // Every cumulative measure of strategy grows with weeks survived and so
  // restates the finish instead of describing the play. Measured on S1:
  // correct-vote COUNT tracks placement at -0.827, the same thing as a RATE at
  // -0.186. Jane voted six for six and went out fifth; Ireland went two for
  // five and won ten competitions. Only one of those numbers knows the
  // difference between them.
  // Rates are SHRUNK TOWARD THE CAST MEAN by a pseudo-count, because a rate
  // over a small denominator is mostly noise: one vote plan in two weeks reads
  // as a higher strike rate than three in twelve, and an eighth-place finisher
  // was hitting the ceiling of this scale while the final three sat near three.
  // Adding k imaginary average attempts to everybody's record costs a long
  // sample almost nothing and stops a short one swinging.
  const totV = Object.values(rec).reduce((a, r) => a + r.votes, 0);
  const totC = Object.values(rec).reduce((a, r) => a + r.correct, 0);
  const meanRate = totV ? totC / totV : 0.5;
  const totA = Object.values(rec).reduce((a, r) => a + r.active, 0);
  const totP = Object.values(rec).reduce((a, r) => a + r.plans, 0);
  const meanPlan = totA ? totP / totA : 0;
  const K_VOTE = 4, K_PLAN = 4;

  const out = {};
  for (const name of Object.keys(rec)) {
    const r = rec[name];
    // A SHORT SAMPLE SCORES THE CAST AVERAGE, NOT ZERO.
    //
    // This is the whole trick. An early boot casts one or two votes, and
    // scoring that as a rate of zero would make the term a survival clock
    // again by the back door -- the exact failure the rates are here to avoid.
    // Not enough evidence means no evidence, so they sit near the middle and
    // earn their way off it.
    const rate = (r.correct + K_VOTE * meanRate) / (r.votes + K_VOTE);
    const planRate = (r.plans + K_PLAN * meanPlan) / (r.active + K_PLAN);

    const mine = (gs.bb?.powers || []).filter(x => x?.holder === name);
    const played = mine.filter(x => x.used).length;
    const wasted = mine.filter(x => !x.used && x.disposed).length;
    const held   = mine.filter(x => !x.used && !x.disposed).length;
    // What they did with what they were given, not how much they were given.
    const conversion = mine.length ? (played - wasted - (fin.has(name) ? 0 : held)) / mine.length : 0;

    const st = (() => { try { return pStats(name) || {}; } catch { return {}; } })();
    const raw =
        rate      * 4.0            // read the room, per vote cast
      + planRate  * 8.0            // called a vote that landed, per week in the house
      + conversion * 2.0           // spent a power well, per power held
      + (st.strategic || 0) * 0.10; // a thumb on the scale, not the scale
    out[name] = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }
  return out;
}

export function extractBigBrotherSeasonTemplate(weeks, finalists, meta = {}) {
  if (!Array.isArray(weeks) || !weeks.length) throw new Error('No Big Brother weeks to export');
  /* ── A WEEK RECORD IS NOT ALWAYS A NIGHT ────────────────────────────
     A double eviction runs a second, compressed cycle with its own Head of
     Household, its own veto and its own vote — genuinely a second week record,
     which is why the engine makes one — but it is ONE EPISODE, because that is
     how it is watched. Exported with `w.num`, the two halves came out as weeks
     13 and 14, and every page since said the second evictee survived a week
     longer than they did.

     So the exported number counts NIGHTS. Both halves carry the same week, the
     second is flagged, and everything after it is numbered against reality
     instead of against the ledger's length. `segment`/`compressed` are the
     engine's own flags for the second half. */
  let _night = 0;
  const _nightOf = weeks.map(w => {
    const second = !!(w.compressed || Number(w.segment) === 2);
    if (!second) _night += 1;
    return { week: Math.max(1, _night), second };
  });
  const finalOrder = [...(finalists || [])];
  const placement = _bbPlacements(weeks, finalOrder);
  const stats = _bbStats(weeks);
  const strategic = _bbStrategic(weeks, finalists);
  const cast = Object.keys(placement);
  const winner = finalOrder[0] || null;
  const jurySize = meta.jurySize ?? 0;

  const placements = cast
    .map(name => {
      const bb = stats[name] || {};
      const place = placement[name];
      return {
        placement: place,
        name,
        playerSlug: _slug(name),
        // Shared across both shows, so every existing reader keeps working.
        status: place === 1 ? 'Winner' : place <= finalOrder.length ? 'Finalist'
              : place <= jurySize + finalOrder.length ? 'Jury' : 'Pre-Jury',
        votesReceived: bb.votesReceived || 0,
        // What the audience made of them. Live-only until now, which left fame
        // and every audience-facing page with nothing to read.
        popularity: Number(gs.popularity?.[name]) || 0,
        juryVotes: 0,                      // the engine does not model a jury vote yet
        // ── THE PLAYER'S ICON ──
        //
        // devotees.html reads `player.emoji` first, falls back to a hardcoded
        // map, and lands on a generic silhouette when neither has anything. The
        // map was written out by hand for the 152 Total Drama players and knows
        // nobody from the house, and this template never declared the field --
        // so the fill pass was never asked for one and the merge had nothing to
        // carry. Every houseguest in the franchise showed as 👤.
        //
        // Fourth time this shape has bitten: the arena wins, the powers, the
        // strategic score, now this. A field Total Drama emits, Big Brother does
        // not, and a page downstream quietly rendering a default.
        emoji: '[AI_FILL]',
        // ── THE STRATEGIC COLUMN, which this export carried nothing for ──
        //
        // The board has had a Strat column all along and no house season could
        // fill it: this template emitted neither `strategicScore` nor
        // `strategicRank`, so the field only ever appeared on a season that had
        // been through the AI writing pass, which grafts it on afterwards. A
        // raw export therefore scored every houseguest as strategically inert
        // and quietly cost each of them up to 1.2 points -- enough, on S1, to
        // hold the runner-up one tier below where he belonged.
        strategicScore: strategic[name] ?? 0,
        notes: '[AI_FILL]',
        story: '[AI_FILL]',
        gameplayStyle: '[AI_FILL]',
        keyMoments: '[AI_FILL]',
        // The analysis. Present in the template so a season exported without a
        // worker still has the shape, and an unfilled field says [AI_FILL]
        // rather than being silently absent.
        gameArchetype: '[AI_FILL]',
        resume: '[AI_FILL]',
        demise: '[AI_FILL]',
        demiseKind: '[AI_FILL]',
        optimalLine: '[AI_FILL]',
        ceiling: '[AI_FILL]',
        // ── WHO THEY PLAYED WITH ─────────────────────────────────
        //
        // Total Drama has carried these per player for years and Big Brother
        // never did, so a houseguest's article could name their whole
        // competition record and not one person they played it with — on the
        // show where that is the entire game.
        //
        // Read from the last week's snapshot rather than from live state: a
        // season exported after the finale still has to describe alliances
        // that dissolved in week four.
        alliances: _bbAlliancesOf(name),
        rivalries: _bbRivalsOf(name),
        showmance: _bbShowmanceOf(name),
        showmanceEnded: _showmanceEndedOf(name),
        // Big Brother only — nested so it cannot be mistaken for Total Drama stats.
        bb: {
          hohWins: bb.hohWins || 0,
          vetoWins: bb.vetoWins || 0,
          // The arena, which _bbStats has tracked all along and this template
          // dropped — so the season document handed to the story writer said a
          // houseguest who won their way off the block four times had won
          // nothing. mergeBigBrotherSeason already carried these; the two
          // exports disagreed about the same season.
          blockBusterWins: bb.blockBusterWins || 0,
          blockBusterPlayed: bb.blockBusterPlayed || 0,
          blockBusterStreak: bb.blockBusterStreak || 0,
          timesNominated: bb.timesNominated || 0,
          timesOnBlock: bb.timesOnBlock || 0,
          timesSaved: bb.timesSaved || 0,
          // ── THE POWERS, which nothing carried ──
          //
          // `gs.bb.powers` has known who held what and who spent it all
          // season, and no export wrote any of it down. The rankings board has
          // four columns for exactly this and every one of them filled with
          // zero on every Big Brother season.
          //
          // The four states are exhaustive: won = played + wasted + held.
          // WASTED is a power that lapsed — disposed of without ever being
          // played — which is the honest analogue of misfiring an idol. HELD
          // is ending the season still holding it.
          ...(() => {
            const mine = (gs.bb?.powers || []).filter(x => x?.holder === name);
            return {
              powersWon: mine.length,
              powersPlayed: mine.filter(x => x.used).length,
              powersWasted: mine.filter(x => !x.used && x.disposed).length,
              powersHeld: mine.filter(x => !x.used && !x.disposed).length,
            };
          })(),
        },
      };
    })
    .sort((a, b) => a.placement - b.placement);

  return {
    seasonNumber: meta.seasonNumber ?? 0,
    format: 'big-brother',
    seasonId: seasonId('big-brother', meta.seasonNumber ?? 0),
    title: '[AI_FILL]',
    subtitle: '[AI_FILL]',
    castSize: meta.castSize ?? cast.length,
    // Nights, plus the finale — which is an episode and was never a week.
    episodeCount: _night + (gs.bb?.finale?.finalHoh ? 1 : 0),
    jurySize,
    winner: {
      name: winner,
      playerSlug: _slug(winner || ''),
      vote: '',
      runnerUp: finalOrder.slice(1).join(' & ') || null,
      keyStats: '[AI_FILL]',
      strategy: '[AI_FILL]',
      legacy: '[AI_FILL]',
    },
    finalists: finalOrder.map(name => ({ name, playerSlug: _slug(name), placement: placement[name] })),
    placements,
    weeks: [...weeks.map((w, _i) => ({
      week: _nightOf[_i].week,
      // The second half of a double eviction: the same night, a second vote.
      ...(_nightOf[_i].second ? { secondEviction: true } : {}),
      hoh: w.hoh,
      initialNominees: w.initialNominees,
      vetoWinner: w.vetoWinner,
      finalNominees: w.finalNominees,
      votes: w.votes,
      voteChanges: w.voteChanges,
      tieBreak: w.tieBreak,
      evicted: w.evicted,
      // ── THE ARENA ────────────────────────────────────────────────
      //
      // Who was on the block when the Block Buster was played, and who won
      // their way out of it. Without these two, a week where somebody saved
      // themselves exports as a week where they were simply never nominated —
      // `finalNominees` has already had them removed — so the most-watched
      // competition of the night left no trace in the record at all.
      blockBeforeSafety: w.blockBeforeSafety || null,
      safetyWinner: w.safetyWinner || null,
      // ── THE BALLOTS ──────────────────────────────────────────────
      //
      // `votes` is a TALLY: how many each nominee received. Every real
      // Big Brother wiki carries the other thing — the grid of who each
      // houseguest voted for, week by week — and it could not be built
      // from a tally, so the season's most characteristic table was the
      // one piece of the record that never left the engine.
      //
      // `stated` is the public position and `changed` says the ballot
      // moved after the plans were laid, which together are how a
      // transcript can show somebody voting against what they said in the
      // room. Both are already on the ballot; neither was exported.
      ballots: (w.ballots || []).map(b => ({
        voter: b.voter,
        voterSlug: _slug(b.voter || ''),
        evict: b.evict,
        evictSlug: _slug(b.evict || ''),
        ...(b.stated && b.stated !== b.evict ? { stated: b.stated } : {}),
        ...(b.changed ? { changed: true } : {}),
      })),
      // The Head of Household breaks a tie, and does not otherwise vote —
      // which is a different cell on the grid from not voting at all.
      tieBreakVote: w.tieBreak ? { voter: w.tieBreak.voter, evict: w.tieBreak.evict,
        anonymous: !!w.tieBreak.anonymous } : null,
      // ── THE HAVE-NOTS ────────────────────────────────────────────
      //
      // Who slept in the have-not room and ate slop that week. The engine has
      // recorded it since have-nots existed (`week.haveNots`) and the export
      // dropped it, so the season's Have/Have-Not History — a table every real
      // Big Brother wiki carries — could not be drawn at all.
      //
      // Names only. WHY somebody was picked belongs to the week's own events,
      // where the reason is already narrated; a record needs to know who.
      haveNots: [...(w.haveNots || [])],
      // The public ballot, when there was one. A Sanctum week is the only
      // night the house saw every vote cast, and a tally cannot say that.
      publicVote: !!w.publicVote,
      // WHICH COMPETITION IT WAS.
      //
      // The engine has always known — `week.hohCompetition` carries the name,
      // the placements and every score — and the export dropped all of it,
      // keeping only who won. So the house could be asked "who won HOH in week
      // three" and never "who is the youngest player ever to win the Wall",
      // which is the question a comp with a name exists to be asked.
      //
      // Names only. The scores belong to the week's own record; what a record
      // needs is the identity of the event, and a placement list so second and
      // third are answerable too.
      hohComp: _compRef(w.hohCompetition),
      vetoComp: _compRef(w.vetoCompetition),
    })),
    /* ── AND THE FINALE, WHICH IS AN EPISODE ──────────────────────────
       Third place is cut and the jury votes, and neither was in `weeks` at
       all: the finale lived only in the winner block, so the week-by-week
       record of every house season stopped one night short of the thing the
       season is for. `gs.bb.finale` has held all of it since the finale was
       written — the final Head of Household, who they cut, the ballots — and
       nothing exported it.

       The Head of Household casts the only vote at final three, so the ballot
       below is the whole vote rather than a sample of one. */
    ...((() => {
      const f = gs.bb?.finale;
      if (!f?.finalHoh) return [];
      const tally = f.votes && typeof f.votes === 'object' && !Array.isArray(f.votes)
        ? Object.entries(f.votes).sort((a, b) => b[1] - a[1])
          .map(([n, c]) => `${n} ${c}`).join(' — ')
        : '';
      return [{
        week: _night + 1,
        finale: true,
        hoh: f.finalHoh,
        initialNominees: [],
        vetoWinner: null,
        finalNominees: [],
        votes: {},
        voteChanges: 0,
        tieBreak: null,
        evicted: f.cut || null,
        blockBeforeSafety: null,
        safetyWinner: null,
        ballots: f.cut ? [{ voter: f.finalHoh, voterSlug: _slug(f.finalHoh),
          evict: f.cut, evictSlug: _slug(f.cut) }] : [],
        tieBreakVote: null,
        haveNots: [],
        publicVote: false,
        hohComp: null,
        vetoComp: null,
        // How the season ended, in the record rather than only in prose.
        juryVote: tally,
        // One row per juror: the vote that decided it, by name. A tally says
        // 5-4; a cast wall says which four.
        juryBallots: (f.juryBallots || []).map(b => ({
          juror: b.juror, jurorSlug: _slug(b.juror), votedFor: b.votedFor })),
        finalTwo: [...(f.finalTwo || [])],
        jury: [...(f.jury || [])],
      }];
    })())],
    showmances: _extractShowmances(),
    alliances: _extractAlliances(),
    rivalries: _extractRivalries(),
    twists: _extractTwists(),
    ratings: _extractRatings(),
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]',
    emoji: '[AI_FILL]',
  };
}

/**
 * WHO THE VILLAIN ACTUALLY WAS, computed rather than asked for.
 *
 * The awards are written by a model reading a paragraph of summary per
 * episode, and the villain pick drifted to whoever those paragraphs talked
 * about most — which is the winner and whoever they were sleeping with. So the
 * ranking is worked out from the record here and stored on the document; the
 * model still writes the citation, and now has to write it about the right
 * person. See js/villain-score.js.
 *
 * `gs.edit.totals` rides along because it is the screenplay's half of the
 * answer: per-player screen time split by tone, classified off the same beats
 * the episodes are written from.
 */
function _attachVillainBoard(doc) {
  try {
    const { board, read, sources } = villainBoard(doc, { editTotals: gs?.edit?.totals || null });
    if (board.length) doc.villainBoard = { read, sources, board };
  } catch { /* an award is not worth failing an export over */ }
  return doc;
}

/**
 * The twists this season actually ran.
 *
 * Nothing in the export carried them, so every season page's Twists section
 * said "nothing in this season's record identifies a twist" about seasons that
 * ran a dozen. Two sources, and they answer different questions:
 *
 *   - `seasonConfig.twistSchedule` is the PLAN: which twist was booked on
 *     which episode, by id, so the catalog can supply its name and what it
 *     does. Only episodes the season actually reached are counted — a twist
 *     booked for episode 30 of a season that ended at 26 never happened.
 *   - `ep.twists` is what FIRED, including the ones nothing scheduled (a fan
 *     vote return, a jury elimination). Recorded by type; a type the catalog
 *     does not know is still reported, because it happened.
 *
 * Grouped by twist rather than by episode: a wiki's Twists section is a list
 * of the season's rules, with the rounds each one applied to.
 */
function _extractTwists() {
  const eps = (gs.episodeHistory || []).length;
  const seen = new Map();   // id -> { id, name, emoji, desc, category, episodes:[] }

  const add = (id, epNum, known) => {
    if (!id) return;
    if (!seen.has(id)) {
      const c = known || TWIST_CATALOG.find(t => t.id === id) || null;
      seen.set(id, {
        id,
        name: c?.name || String(id).replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase()),
        emoji: c?.emoji || '',
        desc: c?.desc || '',
        category: c?.category || '',
        // A twist the catalog does not know still gets listed, flagged so a
        // reader is not told the engine has a card it does not have.
        inCatalog: !!c,
        episodes: [],
      });
    }
    const row = seen.get(id);
    if (epNum && !row.episodes.includes(epNum)) row.episodes.push(epNum);
  };

  // ── A SEASON-LONG TWIST IS NOT ON THE SCHEDULE ─────────────────────
  //
  // Both sources below are per-EPISODE: the booking sheet, and what fired in a
  // given week. A twist whose contract says `layer: 'season'` is neither — the
  // Twin Twist is installed once at the door from `seasonConfig.bbTwins` and
  // then lives on `gs.bb.twins` — so it exported nowhere at all. Big Brother 1
  // was built around one and its published record does not mention it, which
  // is why one houseguest's grid had three blank weeks with no explanation
  // anywhere on the page for what they were.
  //
  // Dated by the week the second twin walked in, because that is the episode
  // the audience finds out. A pair that never made it stays on episode 1,
  // where they entered as one person.
  const twins = gs.bb?.twins;
  if (twins) {
    add('bb-twin-twist', Number(twins.enteredWeek) || 1);
    const row = seen.get('bb-twin-twist');
    if (row) {
      row.name = 'The Twin Twist';
      row.emoji = '👯';
      row.category = 'hidden-identity';
      row.inCatalog = true;
      // Who it was, which is the whole fact — and a detail no other twist row
      // needs, so it rides along rather than changing the shape of the rest.
      row.players = [twins.front, twins.other].filter(Boolean);
      row.desc = `One houseguest was secretly two people swapping places every week. `
        + `${twins.front || 'They'} and ${twins.other || 'their twin'} played as one`
        + (twins.enteredWeek
          ? `, and lasted long enough to both enter the game as individuals in week ${
            twins.enteredWeek}.`
          : ' and never made it in as two.');
    }
  }

  for (const t of (seasonConfig.twistSchedule || []).filter(Boolean)) {
    const epNum = Number(t.episode);
    if (!Number.isFinite(epNum) || epNum > eps) continue;   // booked but never reached
    add(t.type, epNum);
  }
  (gs.episodeHistory || []).forEach((ep, i) => {
    for (const fired of (ep?.twists || [])) add(fired?.type, i + 1);
  });

  return [...seen.values()]
    .map(t => ({ ...t, episodes: t.episodes.sort((a, b) => a - b) }))
    .sort((a, b) => (a.episodes[0] || 0) - (b.episodes[0] || 0));
}

/**
 * A competition, reduced to what a record needs: which one it was and who did
 * best at it. Null when a week had none — a double eviction, a pre-crowned HOH
 * or a season that predates this field.
 */
function _compRef(comp) {
  if (!comp || !comp.name) return null;
  return {
    id: comp.id || _slug(comp.name),
    name: comp.name,
    winner: comp.winner || null,
    placements: Array.isArray(comp.placements) ? comp.placements.slice(0, 5) : [],
  };
}

/**
 * Fold a finished Big Brother season into players_database.json.
 *
 * The Total Drama merge cannot be reused here: it reads chalRecord, idolsFound,
 * advantageLifecycle and tribe off the raw sim stats, none of which a Big
 * Brother house produces. Rather than write zeroes into those fields and have
 * them read as real career numbers later, this is a parallel path over the
 * season document.
 *
 * What crosses between the two shows, and what does not:
 *
 *   crosses  — seasons, placement, average and best placement, wins,
 *              votes against (an eviction vote is an eviction vote), and
 *              competition wins, since HOH and veto are competitions
 *   stays put — immunity wins, reward wins and idols found are Total Drama
 *              shapes; a veto is not an idol and pretending otherwise would
 *              quietly corrupt every Total Drama career total on the site
 *
 * HOH and veto also get their own career totals so a Big Brother résumé can be
 * read on its own terms.
 *
 * Both shows share one season-number space — that is what the `seasons` table
 * and the `bb_appearances` foreign key already assume.
 *
 * Re-running an export for a season already recorded replaces it: the previous
 * contributions are subtracted first, so corrections do not double-count.
 */
export function mergeBigBrotherSeason(existing, seasonDoc) {
  if (!seasonDoc || seasonDoc.format !== 'big-brother') {
    throw new Error('mergeBigBrotherSeason expects a big-brother season document');
  }
  const db = JSON.parse(JSON.stringify(existing || {}));
  const seasonNum = seasonDoc.seasonNumber;
  if (!seasonNum) throw new Error('Big Brother season document has no seasonNumber');
  if (!db.players) db.players = [];

  // Take this season off everybody first. Re-exporting only ever visited the
  // players in the NEW document, so anybody dropped from the cast kept the
  // appearance — and their season count, per-show totals and fame with it.
  _stripSeasonFromAll(db, seasonNum, 'big-brother');

  for (const entry of seasonDoc.placements || []) {
    const name = entry.name;
    if (!name) continue;
    const slug = entry.playerSlug || _slug(name);
    const bb = entry.bb || {};

    let player = db.players.find(p => p.id === slug || p.name === name);
    if (!player) {
      player = {
        id: slug, name, seasons: [], totalSeasons: 0, bestPlacement: null,
        wins: 0, totalChallengeWins: 0, totalImmunityWins: 0, totalRewardWins: 0,
        totalVotesAgainst: 0, totalIdolsFound: 0, totalJuryVotes: 0,
        totalHohWins: 0, totalVetoWins: 0, tier: '', badges: [], seasonDetails: []
      };
      db.players.push(player);
    }
    if (!player.seasonDetails) player.seasonDetails = [];
    if (!player.seasons) player.seasons = [];

    // The icon, carried the way the Total Drama merge carries it (latest season
    // wins). Without this a houseguest's emoji reaches the season document and
    // stops there, and devotees.html goes on drawing the generic silhouette.
    if (entry.emoji && entry.emoji !== '[AI_FILL]') player.emoji = entry.emoji;

    // Strip a previous recording of this same season before adding the new one.
    // Already stripped from everybody above; this only matters for a player who
    // somehow appears twice in one season document.
    _stripSeasonFromPlayer(player, seasonNum, 'big-brother');

    // challengeWins stays HOH + veto — the two the rest of the app and every
    // Total Drama season already mean by it. The arena is its own number, and
    // an ADDITIONAL one, so nothing that reads challengeWins today changes and
    // a résumé can still say "and won their way off the block four times".
    const compWins = (bb.hohWins || 0) + (bb.vetoWins || 0);
    const arenaWins = bb.blockBusterWins || 0;
    if (!player.seasons.includes(seasonNum)) player.seasons.push(seasonNum);
    // totalSeasons is set by _rebuildByShow, once the details are final.
    if (entry.status === 'Winner') player.wins = (player.wins || 0) + 1;
    player.totalVotesAgainst = (player.totalVotesAgainst || 0) + (entry.votesReceived || 0);
    player.totalJuryVotes = (player.totalJuryVotes || 0) + (entry.juryVotes || 0);
    player.totalChallengeWins = (player.totalChallengeWins || 0) + compWins;
    player.totalHohWins = (player.totalHohWins || 0) + (bb.hohWins || 0);
    player.totalVetoWins = (player.totalVetoWins || 0) + (bb.vetoWins || 0);
    player.totalBlockBusterWins = (player.totalBlockBusterWins || 0) + arenaWins;
    player.totalBlockBusterPlayed = (player.totalBlockBusterPlayed || 0) + (bb.blockBusterPlayed || 0);
    // A career best, not a sum: the longest run in any single season.
    player.bestBlockBusterStreak = Math.max(player.bestBlockBusterStreak || 0,
      bb.blockBusterStreak || 0);

    player.seasonDetails.push(_tagSeasonDetail({
      season: seasonNum,
      avatarId: entry.avatarId || null,
      avatarFile: entry.avatarFile || '',
      placement: entry.placement,
      status: entry.status,
      challengeWins: compWins,
      votesReceived: entry.votesReceived || 0,
      juryVotes: entry.juryVotes || 0,
      popularity: Number(entry.popularity) || 0,
      // Carried like Total Drama carries it, so a career reads the same either
      // side of the show boundary.
      strategicScore: Number(entry.strategicScore) || 0,
      bb: {
        hohWins: bb.hohWins || 0,
        vetoWins: bb.vetoWins || 0,
        blockBusterWins: arenaWins,
        blockBusterPlayed: bb.blockBusterPlayed || 0,
        blockBusterStreak: bb.blockBusterStreak || 0,
        blockBusterWeeks: [...(bb.blockBusterWeeks || [])],
        timesNominated: bb.timesNominated || 0,
        timesOnBlock: bb.timesOnBlock || 0,
        timesSaved: bb.timesSaved || 0,
      },
      notes: _clean(entry.notes) ? [entry.notes] : [],
      gameplayStyle: _clean(entry.gameplayStyle),
      keyMoments: Array.isArray(entry.keyMoments) ? entry.keyMoments
                : (_clean(entry.keyMoments) ? [entry.keyMoments] : []),
    }, 'big-brother'));

    // Recomputed across both shows on purpose — one career, several résumés.
    const places = player.seasonDetails.map(sd => sd.placement).filter(p => p && p < 99);
    player.avgPlacement = places.length
      ? Math.round(places.reduce((s, v) => s + v, 0) / places.length * 100) / 100
      : null;
    player.bestPlacement = places.length ? Math.min(...places) : null;

    _rebuildByShow(player);

    if (entry.status === 'Winner') {
      player.badges = player.badges || [];
      // BB1 Winner, not S1 Winner — the bare number is Total Drama's, and both
      // shows writing it put two different seasons' badges on one career page.
      const badge = _winnerBadge(seasonNum, 'big-brother');
      if (!player.badges.includes(badge)) player.badges.push(badge);
    }
  }

  db.franchise = db.franchise || {};
  // Math.max, not assignment: a Big Brother season must never walk the franchise
  // season count backwards.
  db.franchise.totalSeasons = Math.max(db.franchise.totalSeasons || 0, seasonNum);
  db.franchise.totalPlayers = db.players.length;
  return db;
}

// ── Live season snapshot ─────────────────────────────────────────────
// A season in progress isn't in players_database.json — that only ever holds
// finished seasons. This builds a lightweight "where everyone stands right now"
// snapshot that the site can overlay on top of the finished-season data.

/** Build a snapshot of the season currently loaded in the simulator. */
export function extractLiveSeasonSnapshot() {
  const history = gs.episodeHistory || [];
  if (!history.length) throw new Error('No episodes have been played yet');

  // Reuse the real placement walker: it already handles Rescue Island, twist
  // boots, returnees and every other way a player can leave.
  const { permanentExit } = _extractPlayerPlacements();

  const slugOf = new Map(
    ((typeof window !== 'undefined' && window.FRANCHISE_ROSTER) || [])
      .filter(p => p.name && p.slug)
      .map(p => [String(p.name).trim().toLowerCase(), p.slug]));

  const episode = history.length;
  const names = _allPlayerNames();
  const jury = new Set(gs.jury || []);

  // ── WHICH SHOW'S COMPETITIONS THESE ARE ──
  //
  // `_extractChallengeData` counts `ep.immunityWinner` and `ep.rewardChalData`,
  // which are Total Drama's words. A Big Brother week records its wins on
  // `gs.bb.stats` as hohWins / vetoWins / blockBusterWins, and the only one of
  // those that also lands on `ep.immunityWinner` is the crown — so a houseguest
  // with 3 HOHs, 4 vetoes and 3 Block Busters was published as having won
  // THREE competitions, and the two categories she won most were not counted at
  // all. This is the recurring bug in this project wearing its usual clothes:
  // one show's vocabulary printed over the other.
  const format = seasonFormat(typeof seasonConfig !== 'undefined' ? seasonConfig : null);
  const isBB = format === 'big-brother';
  const bbStats = (gs.bb && gs.bb.stats) || {};

  const players = names.map(name => {
    const exitEp = permanentExit[name];
    const isOut = exitEp !== undefined && exitEp !== null;
    const ch = _extractChallengeData(name);
    const votes = _extractVotingData(name);
    const bb = bbStats[name] || {};
    const base = {
      name,
      slug: slugOf.get(String(name).trim().toLowerCase()) || null,
      status: isOut ? (jury.has(name) ? 'jury' : 'out') : 'in',
      exitEpisode: isOut ? Math.floor(exitEp) : null,
      votesReceived: votes.totalVotesReceived || 0,
      // The portrait this season cast them with. players_database.json holds
      // FINISHED seasons, so for the one currently airing this snapshot is the
      // only place the choice can travel — and without it the site draws the
      // profile default over the season most likely to be using custom art.
      ..._portraitOf(name),
    };
    if (!isBB) {
      return {
        ...base,
        immunityWins: ch.immunityWins || 0,
        rewardWins: ch.rewardWins || 0,
        challengeWins: (ch.immunityWins || 0) + (ch.rewardWins || 0),
      };
    }
    // The parts, named for what they are. `challengeWins` keeps the meaning it
    // has everywhere else in this app — HOH + veto — because the finished
    // export decided that deliberately and says so, treating the arena as its
    // own additional number. Redefining it here would have made the same field
    // mean two things depending on whether a season had finished. The page adds
    // the three up for its headline instead, which is a display choice and not
    // a change to what the data means.
    const hoh = bb.hohWins || 0;
    const veto = bb.vetoWins || 0;
    const blockBuster = bb.blockBusterWins || 0;
    return {
      ...base,
      comps: { hoh, veto, blockBuster },
      challengeWins: hoh + veto,
      timesNominated: bb.timesNominated || 0,
      timesSaved: bb.timesSaved || 0,
      timesOnTheBlock: bb.timesOnTheBlock || 0,
    };
  });

  const stillIn = players.filter(p => p.status === 'in').length;
  return {
    seasonNumber: (typeof seasonConfig !== 'undefined' && seasonConfig?.seasonNumber) || _getSeasonNumber(),
    // ── WHICH SHOW IS AIRING ──
    //
    // This snapshot carried a season NUMBER and nothing else, and the Worker
    // falls back to Total Drama for a payload with no format. So syncing Big
    // Brother 1 filed it as Total Drama 1 — and the collision check compared it
    // against Total Drama's finished seasons, which is how a Big Brother sync
    // came back with "Total Drama 1 is already published as a finished season".
    format,
    title: (typeof seasonConfig !== 'undefined' && seasonConfig?.seasonTitle) || null,
    episode,
    totalPlayers: players.length,
    stillIn,
    players,
  };
}

/**
 * Push the current standings to the site. No commit and no rebuild — this
 * writes to D1 only, so the pages pick it up on their next load.
 */
export async function syncLiveEpisode(onStatus) {
  const _status = onStatus || (() => {});
  let base = '', token = '';
  try {
    base = (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, '');
    token = localStorage.getItem('studio_api_token') || '';
  } catch {}
  if (!base) throw new Error('No backend configured');

  // Catch the feed up before reading it. Pressing sync is the moment the site
  // learns about the season, and an episode played in a session where the
  // refresh failed — or before this feature existed — must not go out silent.
  refreshSocialFeed();

  const snap = extractLiveSeasonSnapshot();
  const social = socialPublishPayload();
  if (social) snap.social = social;
  // Says what it is actually sending. The standings are for this episode; the
  // feed is the whole season, and a status line that mentions only the episode
  // is why somebody has to ask whether their rebuild went out.
  const _postCount = social ? (social.posts || []).length : 0;
  _status(`Publishing episode ${snap.episode}${_postCount ? ` and ${_postCount} posts` : ''}…`);

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const post = body => fetch(base + '/api/live-season',
    { method: 'POST', headers, body: JSON.stringify(body) }).then(async res => ({
      ok: res.ok, json: await res.json().catch(() => null), status: res.status,
    }));

  let { ok, json: j, status } = await post(snap);

  /* The worker refuses to put a FINISHED season back on the site as airing —
     the two facts contradict each other and the page can only show one. That is
     right, and it happens for a real reason: replaying a season you mean to
     publish over. So the refusal is a question here rather than a dead end,
     because telling somebody to "sync again with force" from a status line they
     cannot act on is not an answer. */
  if (!ok && /already published as a finished season/i.test(j?.error || '')) {
    const again = confirm(`${j.error}

Put it back on the site as airing anyway?`);
    if (!again) {
      _status('Left alone — the finished season stays finished.');
      return { ok: true, skipped: true };
    }
    ({ ok, json: j, status } = await post({ ...snap, force: true }));
  }

  if (!ok || !j || !j.ok) throw new Error((j && j.error) || `HTTP ${status}`);

  // The feed is written after the standings and can fail on its own — say so
  // rather than reporting a clean sync that half happened.
  const said = j.socialError ? ` · the feed did not publish (${j.socialError})`
    : j.posts ? ` · ${j.posts} posts` : '';
  _status(`Episode ${snap.episode} is live — ${snap.stillIn} of ${snap.totalPlayers} still in.${said}`);
  return j;
}

/** Button handler for "Sync episode to site" (exposed on window via main.js). */
export async function syncEpisodeToSite() {
  const btn = document.getElementById('live-sync-btn');
  const note = document.getElementById('live-sync-note');
  const say = (msg, bad) => {
    if (note) { note.textContent = msg; note.style.color = bad ? '#e5484d' : ''; }
  };
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing…'; }
  try {
    await syncLiveEpisode(say);
  } catch (e) {
    say(`Sync failed: ${e.message}`, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔴 Sync episode to site'; }
  }
}

/** Take the airing season back off the site (e.g. you're restarting it). */
export async function clearLiveSeason() {
  const note = document.getElementById('live-sync-note');
  let base = '', token = '';
  try {
    base = (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, '');
    token = localStorage.getItem('studio_api_token') || '';
  } catch {}
  if (!base) return;
  if (!confirm('Remove the airing season from the site?\n\nThe site goes back to showing only finished seasons. Your simulator save is untouched.')) return;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(base + '/api/live-season/clear', { method: 'POST', headers, body: '{}' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'clear failed');
    if (note) note.textContent = 'Airing season removed from the site.';
  } catch (e) {
    if (note) { note.textContent = `Could not clear: ${e.message}`; note.style.color = '#e5484d'; }
  }
}

/**
 * POST the freshly built season documents to the Worker, which commits them to
 * the repo and then rebuilds the D1 tables. Returns a summary on success, or
 * null when there's no backend configured (caller then falls back to downloads).
 */
/**
 * Is publishing switched off?
 *
 * There was no way to dry-run an export: publishing was skipped only when the
 * request failed, so the one way to look at the files first was to delete the
 * API token and put it back afterwards — using a credential as a feature flag,
 * with a real chance of not putting it back.
 */
export function publishingIsOff() {
  try { return localStorage.getItem('studio_publish_mode') === 'download'; } catch { return false; }
}

/** Switch publishing on or off. `mode` is 'download' or 'publish'. */
export function setPublishMode(mode) {
  try {
    if (mode === 'download') localStorage.setItem('studio_publish_mode', 'download');
    else localStorage.removeItem('studio_publish_mode');
  } catch { /* private browsing */ }
  return !publishingIsOff();
}

async function _publishSeasonToSite(payload, onStatus) {
  const _status = onStatus || (() => {});
  if (publishingIsOff()) {
    _status('Download-only mode — nothing was committed.');
    return null;                 // null falls through to the download path
  }
  let base = '';
  let token = '';
  try {
    base = (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, '');
    token = localStorage.getItem('studio_api_token') || '';
  } catch { return null; }
  if (!base) return null;

  _status('Publishing to the site…');
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(base + '/api/publish-season', {
      method: 'POST', headers, body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || `HTTP ${r.status}`);

    const c = j.synced || {};
    const msg = j.warning
      ? `Committed ${j.wrote.length} file(s), but the sync failed — press "Sync season data" in the Studio.`
      : `Published: ${j.wrote.length} file(s) committed, database refreshed ` +
        `(${c.players} players, ${c.appearances} appearances, ${c.rankings || 0} rankings). Site rebuilds in ~1 min.`;
    _status(msg);
    return { published: true, wrote: j.wrote, synced: j.synced, warning: j.warning || null };
  } catch (e) {
    // Downloading is the safety net: never lose an export because the network did.
    _status(`Could not publish (${e.message}) — downloading the files instead.`);
    return null;
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

// Factual handoff for an AI writer. This deliberately includes the completed
// episode summaries plus the live game state; it is not an end-of-season report.
export function buildAIContextText() {
  const history = gs?.episodeHistory || [];
  if (!history.length) return '';
  const seasonNum = seasonConfig?.seasonNumber || 0;
  const title = seasonConfig?.title || seasonConfig?.name || `Total Drama Season ${seasonNum || '?'}`;
  const through = Math.max(...history.map(ep => Number(ep.num) || 0));
  const names = list => (list || []).map(p => typeof p === 'string' ? p : p?.name).filter(Boolean);
  const active = names(gs?.activePlayers);
  const eliminated = history.flatMap(ep => [ep.firstEliminated, ep.eliminated, ep.suddenDeathEliminated])
    .filter((name, i, all) => name && all.indexOf(name) === i);
  const out = [
    'AI WRITING CONTEXT', title,
    `Simulator record complete through Episode ${through}`,
    `Latest simulated episode package: Episode ${through}`, '',
    'HOW TO USE THIS DOCUMENT',
    'This is factual continuity from the simulator, not a prose style template.',
    'Use it to remember events, relationships, alliances, advantages, strategy, votes, eliminations, and unresolved developments.',
    'A forecast or proposed target is not guaranteed to become the final ballot. Characters know only what the record says they learned.',
    'The next episode package remains authoritative for its locked challenge, twist, advantage, vote, and elimination results.', '',
    `If writing Episode ${through}, use Episodes 1-${Math.max(through - 1, 0)} as prior continuity and the Episode ${through} section as the current locked package.`,
    `If Episode ${through} is already written, use the entire document as prior continuity and supply Episode ${through + 1}'s package separately.`, '',
    'CURRENT GAME STATE',
    `Phase: ${gs?.phase || 'in progress'}`,
    `Players remaining (${active.length}): ${active.join(', ') || 'Not recorded'}`,
    `Eliminated so far (${eliminated.length}): ${eliminated.join(', ') || 'None'}`,
  ];

  const tribes = (gs?.tribes || []).filter(t => t && (t.name || t.members?.length));
  if (tribes.length) {
    out.push('', 'CURRENT TRIBES / GROUPS');
    tribes.forEach(t => out.push(`${t.name || 'Unnamed group'}: ${names(t.members).join(', ') || 'No active members recorded'}`));
  }
  const alliances = (gs?.namedAlliances || []).filter(a => a && a.active !== false && (a.name || a.members?.length));
  if (alliances.length) {
    out.push('', 'CURRENT ALLIANCES / DEALS');
    alliances.forEach(a => out.push(`${a.name || 'Unnamed alliance'}: ${names(a.members).join(', ') || 'Members not recorded'}`));
  }
  const advantages = (gs?.advantages || []).filter(a => a?.holder && a.used !== true && a.played !== true);
  if (advantages.length) {
    out.push('', 'ADVANTAGES CURRENTLY IN PLAY');
    advantages.forEach(a => out.push(`${a.holder}: ${a.label || a.name || a.type || 'Advantage'}`));
  }

  out.push('', 'EPISODE-BY-EPISODE SIMULATOR RECORD');
  [...history].sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0)).forEach(ep => {
    out.push('', `===== EPISODE ${ep.num || '?'} =====`,
      (ep.summaryText || '').trim() || '(No simulator summary was saved for this episode.)');
  });
  return out.join('\n');
}

export async function exportAIContextPDF(onStatus) {
  const status = onStatus || (() => {});
  const context = buildAIContextText();
  if (!context) { alert('Simulate at least one episode before exporting AI context.'); return; }
  status('Loading PDF library...');
  const { jsPDF } = await _loadJsPDF();
  status('Building AI context...');

  const history = gs.episodeHistory || [];
  const title = seasonConfig?.title || seasonConfig?.name || 'Total Drama Season';
  const through = Math.max(...history.map(ep => Number(ep.num) || 0));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  let y = 22, page = 1;
  const safe = value => String(value ?? '').replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
  const header = continued => {
    doc.setFillColor(22, 27, 34); doc.rect(0, 0, W, 16, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    doc.text(safe(`${title} - AI WRITING CONTEXT${continued ? ' (CONT.)' : ''}`), W / 2, 10, { align: 'center' });
    doc.setTextColor(110, 118, 129); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`Page ${page}`, W - M, 291, { align: 'right' }); y = 22;
  };
  const nextPage = () => { doc.addPage(); page++; header(true); };
  header(false);

  for (const raw of context.split('\n')) {
    const line = safe(raw);
    const major = line === 'AI WRITING CONTEXT' || /^===== EPISODE /.test(line);
    const section = /^[A-Z][A-Z /-]{3,}$/.test(line) && !major;
    if (!line.trim()) { y += 2.2; continue; }
    if ((major && y > 245) || (section && y > 265)) nextPage();
    doc.setFont('helvetica', major || section ? 'bold' : 'normal');
    doc.setFontSize(major ? 11 : section ? 9 : 7.5);
    if (major) doc.setTextColor(124, 58, 237);
    else if (section) doc.setTextColor(55, 65, 81);
    else doc.setTextColor(31, 35, 48);
    const spacing = major ? 5.2 : section ? 4.6 : 3.5;
    for (const wrapped of doc.splitTextToSize(line, W - 2 * M)) {
      if (y > 283) nextPage();
      doc.text(wrapped, M, y); y += spacing;
    }
  }
  status('Saving AI context PDF...');
  doc.save(`${_slug(title) || 'season'}-ai-context-through-episode-${through}.pdf`);
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

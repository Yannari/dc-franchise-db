// Franchise meta — persistent cross-season history (ledger) + season-start
// meta profiles. IMPORT RULE: this module imports ONLY core.js; bonds.js and
// savestate.js import US, so importing them back would create a cycle.
import { gs, players, seasonConfig } from './core.js';

// Must match bKey() in bonds.js (can't import it — cycle via players.js).
export function metaBondKey(a, b) { return [a, b].sort().join('||'); }

export let franchiseLedger = { seasons: {} };
export function setFranchiseLedger(v) { franchiseLedger = v && v.seasons ? v : { seasons: {} }; }

export const META_WEIGHTS = {
  // Mechanic 1 — reputation threat
  repThreatFactor: 0.35,      // threatScore multiplier bump at repScore 1.0
  repDecayPerEpisode: 0.06,   // résumé fades as the season progresses
  repDecayFloor: 0.3,
  // Mechanic 2 — carried relationship bond seeds
  bondAllies: 3,
  bondBetrayedVictim: -5,     // victim's side toward their betrayer
  bondBetrayedBetrayer: -1.5, // betrayer's side (asymmetric)
  bondBlindsideVictim: -4,
  bondRivals: -3,
  bondShowmanceIntact: 4,
  bondShowmanceBroken: -3,
  bondOlderSeasonScale: 0.5,  // shared seasons before the most recent one
  bondClamp: 6,               // seeded starting bonds never exceed ±6
  // Mechanic 3 — learned behavior multipliers (max effect at flag = 1.0)
  idolParanoiaSearchBoost: 0.75,
  idolParanoiaSuspicion: 0.5,
  blindsideWarinessSense: 0.6,
  knownSchemerDetection: 0.4,
  // Mechanic 4 — narrative callbacks
  calloutTextChance: 0.5
};

// ── Season record derivation (runs once when a finale completes) ──────────
function _bootOf(ep) {
  return ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated
    || ep.emissaryEliminated || ep.hpTiebreakerEliminated || ep.tiedDestiniesCollateral || null;
}

export function deriveSeasonRecord() {
  // Prefer the season number stamped ON the save (self-identifying — set by
  // initGameState); fall back to current config for pre-stamp legacy saves.
  const seasonNum = gs?.seasonNumber || seasonConfig?.seasonNumber || 0;
  if (!seasonNum || !gs) return null;
  const hist = gs.episodeHistory || [];
  const fin = gs.finaleResult || {};
  const winner = fin.winner || null;
  const finalists = (fin.finalists || []).map(f => typeof f === 'string' ? f : f?.name).filter(Boolean);
  const names = (players || []).map(p => p.name);

  // Boot order → placements. Winner is 1; other finalists follow; boots fill
  // from last place upward; anyone unaccounted (quits, edge formats) slots
  // into the remaining gaps in roster order.
  const boots = [];
  for (const ep of hist) { const b = _bootOf(ep); if (b && !boots.includes(b)) boots.push(b); }
  const placement = {};
  let place = names.length;
  for (const b of boots) { if (!placement[b] && b !== winner && !finalists.includes(b)) placement[b] = place--; }
  if (winner) placement[winner] = 1;
  let fp = 2;
  for (const f of finalists) { if (f !== winner && !placement[f]) placement[f] = fp++; }
  for (const n of names) { if (!placement[n]) placement[n] = fp++; }

  const rec = { seasonName: seasonConfig?.name || `Season ${seasonNum}`, players: {} };
  for (const n of names) {
    const elimEp = hist.find(ep => _bootOf(ep) === n) || null;
    const ownBallot = elimEp?.votingLog?.find(v => v.voter === n) || null;
    const votersAgainst = (elimEp?.votingLog || []).filter(v => v.voted === n).map(v => v.voter);
    const flippers = (elimEp?.defections || []).map(d => d.player).filter(Boolean);
    const blindsided = !!elimEp && !!(elimEp.votingLog || []).length
      && (flippers.length >= 2 || (!!ownBallot && ownBallot.voted !== n && votersAgainst.length >= 3));
    // ep.idolPlays is a shared log for ALL advantage plays (kip/extraVote/voteSteal/
    // voteBlock/soleVote/teamSwap/fake-idol carry a `type`). Genuine idol plays are
    // pushed with NO type field (advantages.js), legacy idols with type:'legacy'.
    const idolsPlayed = hist.reduce((s, ep) => s + (ep.idolPlays || [])
      .filter(ip => ip.player === n && !ip.fake && !ip.failed && (!ip.type || ip.type === 'legacy')).length, 0);
    const idoledOut = !!elimEp && (elimEp.idolPlays || []).some(ip => ip.player !== n && (ip.votesNegated || 0) > 0);
    const betrayed = [];
    for (const ep of hist) {
      const b = _bootOf(ep); if (!b || b === n) continue;
      const flipped = (ep.defections || []).some(d => d.player === n);
      const votedForBoot = (ep.votingLog || []).some(v => v.voter === n && v.voted === b);
      if (flipped && votedForBoot && !betrayed.includes(b)) betrayed.push(b);
    }
    const allies = [];
    for (const al of (gs.namedAlliances || [])) {
      if (!(al.members || []).includes(n)) continue;
      for (const m of al.members) { if (m !== n && !allies.includes(m) && !betrayed.includes(m)) allies.push(m); }
    }
    const showmances = (gs.showmances || [])
      .filter(sh => sh.a === n || sh.b === n)
      .map(sh => ({ partner: sh.a === n ? sh.b : sh.a, ended: sh.broken ? 'breakup' : 'intact' }));
    const rivals = names.filter(o => o !== n && (gs.bonds?.[metaBondKey(n, o)] ?? 0) <= -4);
    rec.players[n] = {
      placement: placement[n], winner: n === winner, finalist: finalists.includes(n) || n === winner,
      episodesLasted: elimEp ? elimEp.num : hist.length,
      blindsided, blindsidedBy: blindsided ? (flippers.length ? flippers : votersAgainst.slice(0, 2)) : [],
      blindsidesAuthored: 0, // filled in the second pass below
      idolsFound: idolsPlayed + (gs.advantages || []).filter(a => a.holder === n && a.type === 'idol').length,
      idolsPlayed, idoledOut, betrayed,
      betrayedBy: [], // second pass
      allies, showmances, rivals,
      chalWins: hist.filter(ep => ep.immunityWinner === n).length,
      schemesCaught: gs.schemesCaught?.[n] || 0
    };
  }
  // Second pass: mirror betrayals + credit blindside authors.
  for (const n of names) {
    for (const victim of rec.players[n].betrayed) {
      if (rec.players[victim] && !rec.players[victim].betrayedBy.includes(n)) rec.players[victim].betrayedBy.push(n);
    }
  }
  for (const n of names) {
    const r = rec.players[n];
    if (r.blindsided) for (const author of r.blindsidedBy) {
      if (rec.players[author]) rec.players[author].blindsidesAuthored++;
    }
  }
  return rec;
}

// Idempotent: keyed by season number; live records always overwrite backfill.
export function recordSeasonToLedger(_ep, source = 'live') {
  if (seasonConfig?.franchiseMeta === false && source === 'live') return false;
  const rec = deriveSeasonRecord();
  if (!rec) return false;
  rec.source = source; // 'live' | 'manual' (Task 8b) — backfill entries carry per-player backfilled flags
  franchiseLedger.seasons[String(gs?.seasonNumber || seasonConfig.seasonNumber)] = rec;
  return true;
}

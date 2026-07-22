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

// ── Season-start meta build ───────────────────────────────────────────────
function _historyFor(name) {
  const out = []; // [{ seasonNum, rec }] sorted oldest → newest
  for (const [num, season] of Object.entries(franchiseLedger.seasons)) {
    if (season.players?.[name]) out.push({ seasonNum: Number(num), rec: season.players[name], seasonName: season.seasonName });
  }
  return out.sort((a, b) => a.seasonNum - b.seasonNum);
}

function _resumeLines(name, history) {
  const lines = [];
  for (const { seasonNum, rec } of history) {
    if (rec.winner) lines.push(`Won Season ${seasonNum}`);
    else if (rec.finalist) lines.push(`Finalist in Season ${seasonNum} (${_ordinal(rec.placement)})`);
    else if (rec.blindsided) lines.push(`Blindsided in Season ${seasonNum} (${_ordinal(rec.placement)})`);
    else lines.push(`Placed ${_ordinal(rec.placement)} in Season ${seasonNum}`);
    if (rec.blindsidesAuthored >= 2) lines.push(`Orchestrated ${rec.blindsidesAuthored} blindsides in Season ${seasonNum}`);
    if (rec.idolsPlayed >= 1) lines.push(`Played ${rec.idolsPlayed} idol${rec.idolsPlayed > 1 ? 's' : ''} in Season ${seasonNum}`);
    if (rec.chalWins >= 3) lines.push(`${rec.chalWins} immunity wins in Season ${seasonNum}`);
  }
  return lines;
}
function _ordinal(n) { const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); }

export function buildFranchiseMeta(cast, cfg) {
  if (cfg?.franchiseMeta === false) return null;
  const W = META_WEIGHTS;
  const profiles = {};
  for (const p of cast) {
    if (!p.isReturnee) continue;
    const history = _historyFor(p.name);
    if (!history.length) continue;
    let wins = 0, finals = 0, bsAuth = 0, chalW = 0, idolsP = 0, idoledOut = 0, blindsided = 0, betrayedCt = 0, caught = 0;
    for (const { rec } of history) {
      wins += rec.winner ? 1 : 0; finals += rec.finalist && !rec.winner ? 1 : 0;
      bsAuth += rec.blindsidesAuthored || 0; chalW += rec.chalWins || 0; idolsP += rec.idolsPlayed || 0;
      idoledOut += rec.idoledOut ? 1 : 0; blindsided += rec.blindsided ? 1 : 0;
      betrayedCt += (rec.betrayed || []).length; caught += rec.schemesCaught || 0;
    }
    profiles[p.name] = {
      seasonsPlayed: history.length,
      repScore: Math.min(1, (wins * 3 + finals * 1.5 + bsAuth * 0.6 + chalW * 0.25 + idolsP * 0.4) / 6),
      resume: _resumeLines(p.name, history),
      idolParanoia: Math.min(1, idoledOut * 0.6 + blindsided * 0.3),
      blindsideWariness: Math.min(1, blindsided * 0.5),
      knownSchemer: Math.min(1, betrayedCt * 0.35 + caught * 0.4 + bsAuth * 0.25)
    };
  }
  if (!Object.keys(profiles).length) return null;

  // Seeded pairs — only between two cast members who BOTH have profiles.
  // Most recent shared season at full weight; older ones scaled down.
  const seeded = {}; // key → { a, b, bondDelta, reason, kind }
  const inCast = new Set(Object.keys(profiles));
  const seasonNums = Object.keys(franchiseLedger.seasons).map(Number).sort((a, b) => b - a);
  seasonNums.forEach((num, idx) => {
    const scale = idx === 0 ? 1 : Math.pow(W.bondOlderSeasonScale, idx);
    const season = franchiseLedger.seasons[String(num)];
    const add = (a, b, delta, reason, kind, directional) => {
      if (!inCast.has(a) || !inCast.has(b) || a === b) return;
      // Directional kinds (betrayal/blindside) keep each side's feeling separate;
      // symmetric kinds collapse regardless of order.
      const key = (directional ? a + '>>' + b : metaBondKey(a, b)) + '::' + kind;
      if (seeded[key]) { seeded[key].bondDelta += delta * scale * 0.5; return; } // stacking, diminishing
      seeded[key] = { a, b, bondDelta: delta * scale, reason: `${reason} (Season ${num})`, kind };
    };
    for (const [name, rec] of Object.entries(season.players || {})) {
      for (const ally of rec.allies || []) add(name, ally, W.bondAllies, `Rode together to the end`, 'allies', false);
      for (const victim of rec.betrayed || []) {
        add(victim, name, W.bondBetrayedVictim, `${name} betrayed ${victim}`, 'betrayal', true);
        add(name, victim, W.bondBetrayedBetrayer, `${name} betrayed ${victim}`, 'betrayal', true);
      }
      if (rec.blindsided) for (const author of rec.blindsidedBy || []) {
        add(name, author, W.bondBlindsideVictim, `${author} blindsided ${name}`, 'blindside', true);
      }
      for (const rival of rec.rivals || []) add(name, rival, W.bondRivals, `Old rivalry`, 'rivals', false);
      for (const sh of rec.showmances || []) {
        if (sh.ended === 'intact') add(name, sh.partner, W.bondShowmanceIntact, `Showmance that lasted`, 'showmance-intact', false);
        else add(name, sh.partner, W.bondShowmanceBroken, `Showmance that ended badly`, 'showmance-broken', false);
      }
    }
  });
  // Betrayal/blindside adds are directional (a = the one whose feeling it is);
  // collapse duplicates and clamp. History biases — it does not predetermine.
  const seededPairs = Object.values(seeded).map(sp => ({
    ...sp, bondDelta: Math.max(-W.bondClamp, Math.min(W.bondClamp, sp.bondDelta))
  }));
  return { profiles, seededPairs };
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

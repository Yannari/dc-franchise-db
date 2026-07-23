// Franchise meta — persistent cross-season history (ledger) + season-start
// meta profiles. IMPORT RULE: this module imports ONLY core.js; bonds.js and
// savestate.js import US, so importing them back would create a cycle.
import { gs, players, seasonConfig } from './core.js';

// Must match bKey() in bonds.js (can't import it — cycle via players.js).
export function metaBondKey(a, b) { return [a, b].sort().join('||'); }

// ── Ledger schema v2 — multi-franchise ──────────────────────────────────
// { v:2, active:'main', franchises:{ main:{ name:'Main', seasons:{...} } } }
// v1 shape ({seasons}) is migrated on load. Everything stays plain-serializable.
function _emptyV2() { return { v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } }; }
export let franchiseLedger = _emptyV2();
export function setFranchiseLedger(v) {
  if (v && v.v === 2 && v.franchises && typeof v.franchises === 'object') { franchiseLedger = v; }
  else if (v && v.seasons && typeof v.seasons === 'object') { // v1 → v2 migration
    franchiseLedger = { v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: v.seasons } } };
  } else { franchiseLedger = _emptyV2(); }
  activeFranchise(); // normalise (guarantees an active franchise with a seasons map)
}

function _slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'franchise';
}
// The active franchise object, auto-creating `main` if the ledger is malformed/empty.
export function activeFranchise() {
  if (!franchiseLedger || typeof franchiseLedger !== 'object') franchiseLedger = _emptyV2();
  if (!franchiseLedger.franchises || typeof franchiseLedger.franchises !== 'object') franchiseLedger.franchises = {};
  if (!Object.keys(franchiseLedger.franchises).length) franchiseLedger.franchises.main = { name: 'Main', seasons: {} };
  if (!franchiseLedger.franchises[franchiseLedger.active]) {
    franchiseLedger.active = Object.keys(franchiseLedger.franchises)[0];
  }
  const af = franchiseLedger.franchises[franchiseLedger.active];
  if (!af.seasons || typeof af.seasons !== 'object') af.seasons = {};
  if (!af.name) af.name = 'Untitled';
  return af;
}
export function activeSeasons() { return activeFranchise().seasons; }
export function listFranchises() {
  activeFranchise();
  return Object.entries(franchiseLedger.franchises).map(([id, f]) => ({
    id, name: f.name || id, seasonCount: Object.keys(f.seasons || {}).length, active: id === franchiseLedger.active
  }));
}
export function createFranchise(name) {
  activeFranchise();
  const base = _slugify(name);
  let id = base, i = 2;
  while (franchiseLedger.franchises[id]) id = base + '-' + (i++);
  franchiseLedger.franchises[id] = { name: (name || '').trim() || 'Untitled', seasons: {} };
  return id;
}
export function renameFranchise(id, name) {
  activeFranchise();
  const f = franchiseLedger.franchises[id]; if (!f) return false;
  f.name = (name || '').trim() || f.name || 'Untitled'; return true;
}
export function deleteFranchise(id) {
  activeFranchise();
  const ids = Object.keys(franchiseLedger.franchises);
  if (ids.length <= 1 || !franchiseLedger.franchises[id]) return false; // cannot delete the last one
  delete franchiseLedger.franchises[id];
  if (franchiseLedger.active === id) franchiseLedger.active = Object.keys(franchiseLedger.franchises)[0];
  return true;
}
export function setActiveFranchise(id) {
  activeFranchise();
  if (!franchiseLedger.franchises[id]) return false;
  franchiseLedger.active = id; return true;
}
// Include toggle — excluded seasons still persist but feed nothing to meta.
export function setSeasonIncluded(seasonNum, bool) {
  const s = activeSeasons()[String(seasonNum)];
  if (s) { s.included = !!bool; return true; }
  return false;
}

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

// `state` (optional) = { gs, players, seasonNumber?, seasonName?, config? } lets
// this derive from a parsed savestate WITHOUT touching live gs/players/seasonConfig.
// When null, reads live module state exactly as before (zero behavior change).
export function deriveSeasonRecord(state = null) {
  const _gs = state?.gs || gs;
  const _players = state?.players || players;
  // Prefer the season number stamped ON the save (self-identifying — set by
  // initGameState); fall back to current config for pre-stamp legacy saves.
  const seasonNum = state?.seasonNumber || _gs?.seasonNumber
    || (state ? state?.config?.seasonNumber : seasonConfig?.seasonNumber) || 0;
  if (!seasonNum || !_gs) return null;
  const _seasonName = state?.seasonName || (state ? state?.config?.name : seasonConfig?.name) || `Season ${seasonNum}`;
  const hist = _gs.episodeHistory || [];
  const fin = _gs.finaleResult || {};
  const winner = fin.winner || null;
  const finalists = (fin.finalists || []).map(f => typeof f === 'string' ? f : f?.name).filter(Boolean);
  const names = (_players || []).map(p => p.name);

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

  const rec = { seasonName: _seasonName, players: {} };
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
    for (const al of (_gs.namedAlliances || [])) {
      if (!(al.members || []).includes(n)) continue;
      for (const m of al.members) { if (m !== n && !allies.includes(m) && !betrayed.includes(m)) allies.push(m); }
    }
    const showmances = (_gs.showmances || [])
      .filter(sh => sh.a === n || sh.b === n)
      .map(sh => ({ partner: sh.a === n ? sh.b : sh.a, ended: sh.broken ? 'breakup' : 'intact' }));
    const rivals = names.filter(o => o !== n && (_gs.bonds?.[metaBondKey(n, o)] ?? 0) <= -4);
    rec.players[n] = {
      placement: placement[n], winner: n === winner, finalist: finalists.includes(n) || n === winner,
      episodesLasted: elimEp ? elimEp.num : hist.length,
      blindsided, blindsidedBy: blindsided ? (flippers.length ? flippers : votersAgainst.slice(0, 2)) : [],
      blindsidesAuthored: 0, // filled in the second pass below
      idolsFound: idolsPlayed + (_gs.advantages || []).filter(a => a.holder === n && a.type === 'idol').length,
      idolsPlayed, idoledOut, betrayed,
      betrayedBy: [], // second pass
      allies, showmances, rivals,
      chalWins: hist.filter(ep => ep.immunityWinner === n).length,
      schemesCaught: _gs.schemesCaught?.[n] || 0
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
  for (const [num, season] of Object.entries(activeSeasons())) {
    if (season.included === false) continue; // excluded seasons feed nothing to meta
    if (season.players?.[name]) out.push({ seasonNum: Number(num), rec: season.players[name], seasonName: season.seasonName });
  }
  return out.sort((a, b) => a.seasonNum - b.seasonNum);
}

function _resumeLines(name, history) {
  const lines = [];
  for (const { seasonNum, rec } of history) {
    const place = rec.placement > 0 ? ` (${_ordinal(rec.placement)})` : '';
    if (rec.winner) lines.push(`Won Season ${seasonNum}`);
    else if (rec.finalist) lines.push(`Finalist in Season ${seasonNum}${place}`);
    else if (rec.blindsided) lines.push(`Blindsided in Season ${seasonNum}${place}`);
    else if (rec.placement > 0) lines.push(`Placed ${_ordinal(rec.placement)} in Season ${seasonNum}`);
    else lines.push(`Appeared in Season ${seasonNum}`);
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
  const _seasons = activeSeasons();
  const seasonNums = Object.keys(_seasons)
    .filter(num => _seasons[num].included !== false) // excluded seasons seed no bonds
    .map(Number).sort((a, b) => b - a);
  seasonNums.forEach((num, idx) => {
    const scale = idx === 0 ? 1 : Math.pow(W.bondOlderSeasonScale, idx);
    const season = _seasons[String(num)];
    const add = (a, b, delta, reason, kind, directional, extra) => {
      if (!inCast.has(a) || !inCast.has(b) || a === b) return;
      // Directional kinds (betrayal/blindside) keep each side's feeling separate;
      // symmetric kinds collapse regardless of order.
      const key = (directional ? a + '>>' + b : metaBondKey(a, b)) + '::' + kind;
      if (seeded[key]) { seeded[key].bondDelta += delta * scale * 0.5; return; } // stacking, diminishing
      seeded[key] = { a, b, bondDelta: delta * scale, reason: `${reason} (Season ${num})`, kind, ...(extra || {}) };
    };
    for (const [name, rec] of Object.entries(season.players || {})) {
      for (const ally of rec.allies || []) add(name, ally, W.bondAllies, `Rode together to the end`, 'allies', false);
      for (const victim of rec.betrayed || []) {
        // wronged flags perspective: victim-side entry (a = the wronged party) vs
        // betrayer-side entry (a = the betrayer). Consumers that want the grudge
        // "why" must require wronged:true so the betrayer never speaks as victim.
        add(victim, name, W.bondBetrayedVictim, `${name} betrayed ${victim}`, 'betrayal', true, { wronged: true });
        add(name, victim, W.bondBetrayedBetrayer, `${name} betrayed ${victim}`, 'betrayal', true, { wronged: false });
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
  // Dedupe: one incident must not seed BOTH a betrayal and a blindside grudge for the
  // same victim→author edge (that would stack heat and fire two OLD WOUNDS camp events).
  // The betrayal pair (directional key `victim>>author::betrayal`) wins; drop the blindside twin.
  for (const key of Object.keys(seeded)) {
    if (!key.endsWith('::blindside')) continue;
    const edge = key.slice(0, -'::blindside'.length);
    if (seeded[edge + '::betrayal']) delete seeded[key];
  }
  // Betrayal/blindside adds are directional (a = the one whose feeling it is);
  // collapse duplicates and clamp. History biases — it does not predetermine.
  const seededPairs = Object.values(seeded).map(sp => ({
    ...sp, bondDelta: Math.max(-W.bondClamp, Math.min(W.bondClamp, sp.bondDelta))
  }));
  return { profiles, seededPairs };
}

// ── Backfill from exported seasons_database.json ──────────────────────────
// Defensive mapping: the export DB carries placements/winners but not
// relationship facts — those stay empty for backfilled seasons (they
// contribute reputation, not carried relationships). Live-recorded seasons
// always win over backfill.
function _emptyRecord() {
  return { placement: 0, winner: false, finalist: false, episodesLasted: 0,
    blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
    idolsFound: 0, idolsPlayed: 0, idoledOut: false,
    betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [],
    chalWins: 0, schemesCaught: 0, backfilled: true };
}

export function backfillFromSeasonsDb(json) {
  const seasons = Array.isArray(json?.seasons) ? json.seasons : [];
  const _seasons = activeSeasons();
  let imported = 0;
  for (const s of seasons) {
    const num = s?.seasonNumber; if (!num) continue;
    const existing = _seasons[String(num)];
    // Live records always win over backfill — protection depends ONLY on the
    // backfilled flags. Excluding a season from meta must never make it overwritable.
    if (existing && !Object.values(existing.players || {}).every(p => p.backfilled)) continue;
    const winnerName = s.winner?.name || s.winner || null;
    const roster = Array.isArray(s.players) ? s.players : (Array.isArray(s.placements) ? s.placements : (Array.isArray(s.cast) ? s.cast : []));
    const rec = { seasonName: s.seasonName || s.name || `Season ${num}`, players: {} };
    for (const p of roster) {
      const name = p?.name || (typeof p === 'string' ? p : null); if (!name) continue;
      const r = _emptyRecord();
      r.placement = p.placement || p.finish || 0;
      r.winner = name === winnerName || r.placement === 1;
      r.finalist = r.winner || r.placement === 2 || r.placement === 3;
      r.chalWins = p.chalWins || p.immunityWins || 0;
      r.episodesLasted = p.episodesLasted || 0;
      rec.players[name] = r;
    }
    if (winnerName && !rec.players[winnerName]) { const r = _emptyRecord(); r.placement = 1; r.winner = true; r.finalist = true; rec.players[winnerName] = r; }
    if (!Object.keys(rec.players).length) continue;
    _seasons[String(num)] = rec;
    imported++;
  }
  return imported;
}

export function franchiseHistorySummary(name) {
  return _historyFor(name).map(({ seasonNum, seasonName, rec }) => ({
    seasonNum, seasonName,
    line: `${rec.winner ? '🏆 Won' : (rec.placement > 0 ? _ordinal(rec.placement) : 'Appeared')}${rec.blindsided ? ' · blindsided' : ''}${rec.idolsPlayed ? ` · ${rec.idolsPlayed} idol${rec.idolsPlayed > 1 ? 's' : ''}` : ''}${rec.chalWins ? ` · ${rec.chalWins}W` : ''}${rec.backfilled ? ' · (imported)' : ''}`
  }));
}

export function clearPlayerHistory(name) {
  for (const season of Object.values(activeSeasons())) delete season.players?.[name];
}

// Wipes the ACTIVE franchise's seasons only (other franchises untouched).
export function wipeLedger() { activeFranchise().seasons = {}; }

// Idempotent: keyed by season number; live records always overwrite backfill.
export function recordSeasonToLedger(_ep, source = 'live') {
  if (source === 'live' && (seasonConfig?.franchiseMeta === false || seasonConfig?.franchiseMetaAutoRecord === false)) return false;
  const rec = deriveSeasonRecord();
  if (!rec) return false;
  rec.source = source; // 'live' | 'manual' (Task 8b) — backfill entries carry per-player backfilled flags
  activeSeasons()[String(gs?.seasonNumber || seasonConfig.seasonNumber)] = rec;
  return true;
}

// Record a season derived from a PARSED savestate export (season-*-ep*.json shape:
// { name, config, players, gs }). Validates a finished finale and NEVER touches
// live gs/players. Writes into the ACTIVE franchise. Returns a result object.
export function recordSeasonFromSavestate(parsedJson, opts = {}) {
  if (!parsedJson || typeof parsedJson !== 'object') return { ok: false, error: 'Not a valid save file' };
  const sgs = parsedJson.gs;
  if (!sgs || typeof sgs !== 'object') return { ok: false, error: 'No game state in file' };
  if (sgs.phase !== 'complete') return { ok: false, error: `Season not finished (phase: ${sgs.phase || 'unknown'})` };
  const seasonNumber = sgs.seasonNumber || parsedJson.config?.seasonNumber || 0;
  if (!seasonNumber) return { ok: false, error: 'No season number in file' };
  // Overwrite protection: don't silently clobber a LIVE/MANUAL record. Re-dropping
  // an imported-save over its own kind is allowed freely; anything else needs
  // caller confirmation (opts.force). DOM confirm lives in franchise-ui.js, not here.
  const existing = activeSeasons()[String(seasonNumber)];
  if (existing && !opts.force && existing.source !== 'imported-save') {
    const exWinner = Object.entries(existing.players || {}).find(([, r]) => r.winner)?.[0] || null;
    return { ok: false, needsConfirm: true, seasonNum: seasonNumber,
      existingSource: existing.source || 'manual', winner: exWinner,
      playerCount: Object.keys(existing.players || {}).length };
  }
  const state = {
    gs: sgs,
    players: parsedJson.players || [],
    seasonNumber,
    seasonName: parsedJson.name || parsedJson.config?.name || `Season ${seasonNumber}`,
    config: parsedJson.config || null
  };
  const rec = deriveSeasonRecord(state);
  if (!rec) return { ok: false, error: 'Could not derive a record from this save' };
  rec.source = 'imported-save';
  activeSeasons()[String(seasonNumber)] = rec;
  const winner = Object.entries(rec.players).find(([, r]) => r.winner)?.[0] || null;
  return { ok: true, seasonNum: seasonNumber, playerCount: Object.keys(rec.players).length, winner };
}

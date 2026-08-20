// Franchise meta — persistent cross-season history (ledger) + season-start
// meta profiles. IMPORT RULE: this module imports ONLY core.js; bonds.js and
// savestate.js import US, so importing them back would create a cycle.
import { gs, players, seasonConfig } from './core.js';
import { lifeSeeds as _lifeSeeds } from './life-cast.js';

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
  if (franchiseLedger.franchises[id].locked) return false;              // a locked archive can't be deleted
  delete franchiseLedger.franchises[id];
  if (franchiseLedger.active === id) franchiseLedger.active = Object.keys(franchiseLedger.franchises)[0];
  return true;
}
export function setActiveFranchise(id) {
  activeFranchise();
  if (!franchiseLedger.franchises[id]) return false;
  franchiseLedger.active = id; return true;
}

// ── Canon lock ─────────────────────────────────────────────────────────
// A locked franchise is a sealed archive: no season can be recorded, imported,
// backfilled, or wiped, and the franchise itself cannot be deleted. Meta-only
// operations (include toggles, clearing a player's carried history) stay allowed
// because they re-weight, not rewrite. Importing a franchise EXPORT is always
// allowed — it creates a brand-new (unlocked) franchise and never mutates a
// locked one.
export function isFranchiseLocked(id) {
  activeFranchise();
  const f = franchiseLedger.franchises[id || franchiseLedger.active];
  return !!(f && f.locked);
}
export function setFranchiseLocked(id, bool) {
  activeFranchise();
  const f = franchiseLedger.franchises[id]; if (!f) return false;
  if (bool) f.locked = true; else delete f.locked;
  return true;
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

// Placement derivation ported from stats-export.js _extractPlayerPlacements()
// (the canonical, battle-tested logic — KEEP IN SYNC with stats-export.js:80).
// Duplicated here because franchise-meta may import only core.js, and
// stats-export sits behind modules that import US (cycle). Handles: RI/EoE duel
// losses, RI quits, reentry losers, multi-tribal boots, fire-making duels,
// jury-elimination twists, Koh-Lanta orienteering cuts, ambassador boots, and
// Tied Destinies collateral — all the exits the naive boot-order walk missed.
function _derivePlacements(_gs, names) {
  const history = _gs.episodeHistory || [];
  const fin = _gs.finaleResult || {};
  const winner = fin.winner || null;
  const finalists = (fin.finalists || []).map(f => typeof f === 'string' ? f : f?.name).filter(Boolean);
  const juryVotes = fin.votes || {};
  const permanentExit = {};
  for (const ep of history) {
    if (ep.riDuel?.loser) permanentExit[ep.riDuel.loser] = ep.num;
    if (ep.riQuit?.name) permanentExit[ep.riQuit.name] = ep.num;
    const _reentryLosers = ep.riReentryLosers || ep.riReentry?.losers || ep.rescueReturn?.losers;
    if (_reentryLosers?.length) for (const loser of _reentryLosers) {
      if (permanentExit[loser] == null) permanentExit[loser] = ep.num;
    }
    const _juryBoot = (ep.twists || []).find(t => t.type === 'jury-elimination' && t.juryBooted)?.juryBooted;
    const elimNames = [
      ep.suddenDeathEliminated, ep.eliminated, ep.firstEliminated, ep.tiedDestiniesCollateral,
      ep.emissaryEliminated, ep.hpTiebreakerEliminated, _juryBoot,
      ...(ep.multiTribalElims || []),
      ep.firemakingResult?.loser
    ].filter(Boolean);
    for (const name of elimNames) permanentExit[name] = ep.num;
    if (ep.isFinale && ep.klOrienteering?.eliminated) permanentExit[ep.klOrienteering.eliminated] = ep.num - 0.5;
    const _ambBoot = ep.ambassadorData?.ambassadorEliminated;
    if (_ambBoot) permanentExit[_ambBoot] = ep.num - (ep.eliminated && ep.eliminated !== _ambBoot ? 0.5 : 0);
    const _tdPartner = ep.tiedDestinies?.eliminatedPartner;
    if (_tdPartner && _tdPartner !== ep.eliminated) permanentExit[_tdPartner] = ep.num - 0.5;
  }
  for (const name of finalists) delete permanentExit[name];
  if (winner) delete permanentExit[winner];
  const elimOrder = Object.entries(permanentExit).sort((a, b) => a[1] - b[1]).map(([name]) => name);
  const sortedFinalists = [...new Set([winner, ...finalists].filter(Boolean))].sort((a, b) => {
    if (a === winner) return -1;
    if (b === winner) return 1;
    return (juryVotes[b] || 0) - (juryVotes[a] || 0);
  });
  const placement = {};
  let place = 1;
  for (const name of sortedFinalists) placement[name] = place++;
  for (let i = elimOrder.length - 1; i >= 0; i--) {
    const name = elimOrder[i];
    if (!placement[name]) placement[name] = place++;
  }
  for (const n of names) { if (!placement[n]) placement[n] = place++; }
  return { placement, permanentExit };
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

  const { placement, permanentExit } = _derivePlacements(_gs, names);

  const rec = { seasonName: _seasonName, players: {} };
  for (const n of names) {
    // Last (not first) elimination episode — RI/EoE returnees can be booted twice.
    const elimEp = [...hist].reverse().find(ep => _bootOf(ep) === n) || null;
    const ownBallot = elimEp?.votingLog?.find(v => v.voter === n) || null;
    const votersAgainst = (elimEp?.votingLog || []).filter(v => v.voted === n).map(v => v.voter);
    // BOTH SHOWS' SHAPES. `defections` is Total Drama's flip record; a Big
    // Brother week stamps flips on the ballot itself (votingLog[].changed).
    // Read from one and never the other and every BB season contributes zero
    // blindsides to the franchise ledger — measured across fourteen audited
    // seasons before anybody noticed, because the returnee grudges it feeds
    // only go missing, they never error.
    const flippers = [...new Set([
      ...(elimEp?.defections || []).map(d => d.player),
      ...(elimEp?.votingLog || []).filter(v => v.changed && v.voted === n).map(v => v.voter),
    ])].filter(Boolean);
    // The own-ballot clause is Total Drama's: a nominee votes at tribal. A BB
    // nominee never votes, so that path stays dead for the house on purpose —
    // its blindside is the flips.
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
      const flipped = (ep.defections || []).some(d => d.player === n)
        // The house's version of a defection: a ballot that moved, onto the boot.
        || (ep.votingLog || []).some(v => v.voter === n && v.voted === b && v.changed);
      const votedForBoot = (ep.votingLog || []).some(v => v.voter === n && v.voted === b);
      if (flipped && votedForBoot && !betrayed.includes(b)) betrayed.push(b);
    }
    const allies = [];
    for (const al of (_gs.namedAlliances || [])) {
      if (!(al.members || []).includes(n)) continue;
      for (const m of al.members) { if (m !== n && !allies.includes(m) && !betrayed.includes(m)) allies.push(m); }
    }
    // `players: [a, b]` is the shape every showmance has actually had; the
    // `sh.a` read matched nothing, ever, on either show — so the "showmance
    // that lasted" returnee bond has never once seeded from a ledger record.
    const showmances = (_gs.showmances || [])
      .filter(sh => (sh.players || [sh.a, sh.b]).includes(n))
      .map(sh => {
        const pair = sh.players || [sh.a, sh.b];
        return { partner: pair.find(x => x && x !== n) || null,
          ended: (sh.broken || sh.phase === 'broken-up') ? 'breakup' : 'intact' };
      })
      .filter(sh => sh.partner);
    const rivals = names.filter(o => o !== n && (_gs.bonds?.[metaBondKey(n, o)] ?? 0) <= -4);
    rec.players[n] = {
      placement: placement[n], winner: n === winner, finalist: finalists.includes(n) || n === winner,
      episodesLasted: Math.floor(permanentExit[n] ?? (elimEp ? elimEp.num : hist.length)),
      blindsided, blindsidedBy: blindsided ? (flippers.length ? flippers : votersAgainst.slice(0, 2)) : [],
      blindsidesAuthored: 0, // filled in the second pass below
      idolsFound: idolsPlayed + (_gs.advantages || []).filter(a => a.holder === n && a.type === 'idol').length,
      idolsPlayed, idoledOut, betrayed,
      betrayedBy: [], // second pass
      allies, showmances, rivals,
      chalWins: hist.filter(ep => ep.immunityWinner === n).length,
      schemesCaught: _gs.schemesCaught?.[n] || 0,
      // Character evidence — who they ARE and how the audience received them.
      // Both power the villain/hero analysis; older records lack them (null-safe).
      archetype: _players.find(p => p.name === n)?.archetype || null,
      popularity: Math.round((_gs.popularity?.[n] || 0) * 10) / 10
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
  // One line PER SEASON — the season's headline result with notable feats
  // folded in — so a multi-season vet's card references a little of every
  // campaign, not three facts about their best one. Strongest seasons lead
  // (a title never gets buried under an old 14th place), capped at 3 lines.
  const perSeason = history.map(({ seasonNum, rec }) => {
    let w, head;
    const place = rec.placement > 0 ? ` (${_ordinal(rec.placement)})` : '';
    if (rec.winner) { w = 100; head = `Won Season ${seasonNum}`; }
    else if (rec.finalist) { w = 80; head = `Finalist in Season ${seasonNum}${place}`; }
    else if (rec.blindsided) { w = 30; head = `Blindsided in Season ${seasonNum}${place}`; }
    else if (rec.placement > 0) { w = 10; head = `Placed ${_ordinal(rec.placement)} in Season ${seasonNum}`; }
    else { w = 5; head = `Appeared in Season ${seasonNum}`; }
    const feats = [];
    if (rec.blindsidesAuthored >= 2) { feats.push(`${rec.blindsidesAuthored} blindsides`); w += 6; }
    if (rec.idolsPlayed >= 1) { feats.push(`${rec.idolsPlayed} idol${rec.idolsPlayed > 1 ? 's' : ''}`); w += 5; }
    if (rec.chalWins >= 3) { feats.push(`${rec.chalWins} immunity wins`); w += 4; }
    return { w, s: seasonNum, t: head + (feats.length ? ` — ${feats.join(', ')}` : '') };
  });
  return perSeason.sort((a, b) => b.w - a.w || b.s - a.s).slice(0, 3).map(l => l.t);
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
  if (activeFranchise().locked) return 0; // sealed archive — no backfill
  const seasons = Array.isArray(json?.seasons) ? json.seasons : [];
  const _seasons = activeSeasons();
  let imported = 0;
  for (const s of seasons) {
    const num = s?.seasonNumber; if (!num) continue;
    const existing = _seasons[String(num)];
    // Live records always win over backfill — protection depends ONLY on the
    // backfilled flags. Excluding a season from meta must never make it overwritable.
    if (existing && !Object.values(existing.players || {}).every(p => p.backfilled)) continue;
    // Chronicle-enriched records outrank light backfills: never downgrade one.
    if (existing?.source === 'enriched') continue;
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

// ── Backfill from a single-season site data file (seasonN-data.json) ──────
// Shape: { seasonNumber, title, castSize, episodeCount, winner:{name,playerSlug},
// placements: [{placement, name, playerSlug, phase, notes}], ... }. Richer than
// the seasons-DB rows: `phase` marks true finalists (FTC third place included),
// notes carry immunity-win counts, and playerSlug enables portraits for players
// who are not in the current roster. Same protection rule as the DB backfill:
// live/manual records are never overwritten.
export function backfillFromSeasonData(json) {
  if (activeFranchise().locked) return { ok: false, error: 'Franchise is locked' };
  const num = json?.seasonNumber;
  if (!num || !Array.isArray(json?.placements)) return { ok: false, error: 'Not a season data file' };
  const _seasons = activeSeasons();
  const existing = _seasons[String(num)];
  if (existing && !Object.values(existing.players || {}).every(p => p.backfilled)) {
    return { ok: false, skipped: true, seasonNum: num, error: `S${num} skipped — kept existing live/manual record` };
  }
  if (existing?.source === 'enriched') {
    return { ok: false, skipped: true, seasonNum: num, error: `S${num} skipped — kept richer chronicle-enriched record` };
  }
  const winnerName = json.winner?.name || null;
  const rec = {
    seasonName: json.title || `Season ${num}`,
    castSize: json.castSize || json.placements.length,
    episodeCount: json.episodeCount || 0,
    players: {}
  };
  for (const p of json.placements) {
    if (!p?.name) continue;
    const r = _emptyRecord();
    r.placement = p.placement || 0;
    r.winner = p.phase === 'Winner' || p.placement === 1 || p.name === winnerName;
    r.finalist = r.winner || p.phase === 'Finalist';
    const imm = String(p.notes || '').match(/(\d+)\s+immunity wins?/i);
    r.chalWins = imm ? parseInt(imm[1], 10) : 0;
    if (p.playerSlug) r.slug = p.playerSlug;
    rec.players[p.name] = r;
  }
  if (!Object.keys(rec.players).length) return { ok: false, error: 'No players found in file' };
  _seasons[String(num)] = rec;
  return { ok: true, seasonNum: num, winner: winnerName, playerCount: Object.keys(rec.players).length };
}

// ── Backfill from a chronicle-enriched season file (dc-enriched-season) ───
// Produced by reading a season's episode-by-episode chronicle: carries the FULL
// record schema (blindsides, betrayals, allies, showmances, rivals, idols…),
// unlike the placements-only site/db backfills. Ranking: live/manual/imported-save
// records still win over this; this wins over (and re-imports over) light
// backfills and previous enriched imports.
const _ENRICHED_FIELDS = ['placement', 'winner', 'finalist', 'episodesLasted', 'blindsided',
  'blindsidedBy', 'blindsidesAuthored', 'idolsFound', 'idolsPlayed', 'idoledOut',
  'betrayed', 'betrayedBy', 'allies', 'showmances', 'rivals', 'chalWins',
  'schemesCaught', 'slug', 'votesAgainstTotal', 'archetype', 'popularity'];
export function backfillFromEnrichedSeason(json) {
  if (activeFranchise().locked) return { ok: false, error: 'Franchise is locked' };
  if (json?.type !== 'dc-enriched-season') return { ok: false, error: 'Not an enriched season file' };
  const num = json.seasonNumber;
  if (!num || !json.players || typeof json.players !== 'object') return { ok: false, error: 'Enriched file missing seasonNumber or players' };
  const _seasons = activeSeasons();
  const existing = _seasons[String(num)];
  if (existing && existing.source !== 'enriched'
      && !Object.values(existing.players || {}).every(p => p.backfilled)) {
    return { ok: false, skipped: true, seasonNum: num, error: `S${num} skipped — kept existing live/manual record` };
  }
  const rec = {
    seasonName: json.seasonName || `Season ${num}`,
    castSize: json.castSize || Object.keys(json.players).length,
    episodeCount: json.episodeCount || 0,
    source: 'enriched',
    players: {}
  };
  let winner = null;
  for (const [name, p] of Object.entries(json.players)) {
    if (!name || !p || typeof p !== 'object') continue;
    const r = _emptyRecord();
    for (const f of _ENRICHED_FIELDS) {
      if (p[f] !== undefined) r[f] = JSON.parse(JSON.stringify(p[f]));
    }
    r.backfilled = true; // live re-recordings may still overwrite; light backfills may not (source gate)
    if (r.winner) winner = name;
    rec.players[name] = r;
  }
  if (!Object.keys(rec.players).length) return { ok: false, error: 'No players found in enriched file' };
  _seasons[String(num)] = rec;
  return { ok: true, seasonNum: num, winner, playerCount: Object.keys(rec.players).length };
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

// ── Career aggregation (Legacy layer — pure reads over included seasons) ───
function _castSizeOf(seasonNum) {
  const s = activeSeasons()[String(seasonNum)];
  if (!s) return 0;
  return s.castSize || Object.keys(s.players || {}).length || 0;
}
// The "merge-ish" mark: made it past the halfway cut. When cast size is known we
// use castSize/2; otherwise fall back to placement ≤ 9 (top-9-ish is the merge in
// a typical field). Returns true when the player reached/beat that mark.
function _madeMergeMark(placement, castSize) {
  if (!placement || placement <= 0) return false;
  const half = castSize ? castSize / 2 : 9;
  return placement <= half;
}
function _rankCounts(map) {
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Full cross-season résumé for ONE player over the active franchise's included
// seasons. Pure ledger facts — no live sim state. Returns null if no history.
// Archetype resolution: live-recorded seasons store the archetype on the record;
// for older/imported records we fall back to the current cast, then to a
// roster resolver installed by the UI layer (franchise-meta cannot import
// cast-ui's FRANCHISE_ROSTER — that would be an import cycle).
let _archResolver = null;
export function setArchetypeResolver(fn) { _archResolver = typeof fn === 'function' ? fn : null; }
function _resolveArchetype(name) {
  const live = (players || []).find(p => p.name === name)?.archetype;
  if (live) return live;
  try { return _archResolver ? (_archResolver(name) || null) : null; } catch (e) { return null; }
}

export function careerFor(name) {
  const history = _historyFor(name); // [{ seasonNum, seasonName, rec }] oldest→newest, included only
  if (!history.length) return null;
  let slug = '';
  const seasons = history.map(({ seasonNum, seasonName, rec }) => {
    if (!slug && rec.slug) slug = rec.slug;
    return {
      seasonNum, seasonName: seasonName || `Season ${seasonNum}`,
      placement: rec.placement || 0, winner: !!rec.winner, finalist: !!rec.finalist,
      blindsided: !!rec.blindsided, chalWins: rec.chalWins || 0, idolsPlayed: rec.idolsPlayed || 0,
      blindsidesAuthored: rec.blindsidesAuthored || 0, backfilled: !!rec.backfilled,
      episodesLasted: rec.episodesLasted || 0
    };
  });
  if (!slug) slug = _slugify(name); // last resort so portraits still resolve
  const allies = {}, rivals = {}, betrayed = {}, betrayedBy = {}, showmances = [];
  const totals = {
    seasons: history.length, wins: 0, finals: 0, chalWins: 0, idolsPlayed: 0, idolsFound: 0,
    blindsidesAuthored: 0, timesBlindsided: 0, betrayalsCommitted: 0, timesBetrayed: 0,
    schemesCaught: 0, bestPlacement: 0, avgPlacement: 0,
    popularity: 0, popularityKnown: false
  };
  let placeSum = 0, placeN = 0, archetype = null;
  for (const { seasonNum, rec } of history) {
    if (rec.archetype) archetype = rec.archetype; // latest recorded season wins
    if (typeof rec.popularity === 'number') { totals.popularity += rec.popularity; totals.popularityKnown = true; }
    totals.wins += rec.winner ? 1 : 0;
    totals.finals += rec.finalist ? 1 : 0; // finalist appearances (a win is a finals appearance too)
    totals.chalWins += rec.chalWins || 0;
    totals.idolsPlayed += rec.idolsPlayed || 0;
    totals.idolsFound += rec.idolsFound || 0;
    totals.blindsidesAuthored += rec.blindsidesAuthored || 0;
    totals.timesBlindsided += rec.blindsided ? 1 : 0;
    totals.betrayalsCommitted += (rec.betrayed || []).length;
    totals.timesBetrayed += (rec.betrayedBy || []).length;
    totals.schemesCaught += rec.schemesCaught || 0;
    if (rec.placement > 0) {
      placeSum += rec.placement; placeN++;
      if (!totals.bestPlacement || rec.placement < totals.bestPlacement) totals.bestPlacement = rec.placement;
    }
    for (const a of rec.allies || []) allies[a] = (allies[a] || 0) + 1;
    for (const r of rec.rivals || []) rivals[r] = (rivals[r] || 0) + 1;
    for (const b of rec.betrayed || []) betrayed[b] = (betrayed[b] || 0) + 1;
    for (const b of rec.betrayedBy || []) betrayedBy[b] = (betrayedBy[b] || 0) + 1;
    for (const sh of rec.showmances || []) showmances.push({ partner: sh.partner, ended: sh.ended, seasonNum });
  }
  totals.avgPlacement = placeN ? +(placeSum / placeN).toFixed(1) : 0;

  const badges = [];
  if (totals.wins >= 1) badges.push(`CHAMPION ×${totals.wins}`);
  if (totals.finals >= 2) badges.push('FINALS FIXTURE');
  if (totals.blindsidesAuthored >= 3) badges.push('BLINDSIDE ARTIST');
  if (totals.idolsFound >= 2) badges.push('IDOL HUNTER');
  if (totals.chalWins >= 6) badges.push('CHALLENGE MACHINE');
  if (totals.seasons >= 3) badges.push('SURVIVOR');
  if (totals.betrayalsCommitted >= 3) badges.push('SNAKE');
  if (showmances.length >= 2) badges.push('HEARTBREAKER');
  if (totals.timesBlindsided >= 2 && totals.wins === 0) badges.push('CURSED');
  totals.popularity = Math.round(totals.popularity * 10) / 10;
  if (totals.popularityKnown && totals.popularity >= 6) badges.push('FAN FAVORITE');
  if (totals.popularityKnown && totals.popularity <= -5) badges.push('NOTORIOUS');

  return {
    name, slug, archetype: archetype || _resolveArchetype(name), seasons, totals,
    people: {
      allies: _rankCounts(allies), rivals: _rankCounts(rivals),
      betrayed: _rankCounts(betrayed), betrayedBy: _rankCounts(betrayedBy),
      showmances
    },
    badges
  };
}

// Record book across the active franchise's included seasons. Skips any record
// with no data so an empty franchise shows an empty book, not zeros.
export function franchiseRecords() {
  const careers = {};
  for (const [num, season] of Object.entries(activeSeasons())) {
    if (season.included === false) continue;
    for (const nm of Object.keys(season.players || {})) {
      if (!careers[nm]) careers[nm] = careerFor(nm);
    }
    void num;
  }
  const list = Object.values(careers).filter(Boolean);
  if (!list.length) return [];
  const out = [];
  const push = (title, holder, value, detail) => { if (holder) out.push({ title, holder, value, detail }); };
  const best = (metric, min = 0) => {
    let top = null;
    for (const c of list) { const v = metric(c); if (v > min && (!top || v > top.v)) top = { c, v }; }
    return top;
  };
  let t;
  t = best(c => c.totals.wins); push('Most titles', t?.c.name, t?.v, t ? `${t.v} title${t.v === 1 ? '' : 's'}` : '');
  t = best(c => c.totals.chalWins); push('Most career immunity wins', t?.c.name, t?.v, t ? `${t.v} immunity wins` : '');
  t = best(c => c.totals.blindsidesAuthored); push('Most blindsides authored', t?.c.name, t?.v, t ? `${t.v} blindsides` : '');
  t = best(c => c.totals.seasons, 1); push('Most seasons played', t?.c.name, t?.v, t ? `${t.v} seasons` : '');
  // Best average placement — only players with ≥2 scored seasons qualify; lower is better.
  let ap = null;
  for (const c of list) {
    const scored = c.seasons.filter(s => s.placement > 0).length;
    if (scored >= 2 && c.totals.avgPlacement > 0 && (!ap || c.totals.avgPlacement < ap.v)) ap = { c, v: c.totals.avgPlacement };
  }
  if (ap) out.push({ title: 'Best average placement', holder: ap.c.name, value: ap.v, detail: `avg ${ap.v} over ${ap.c.totals.seasons} seasons` });
  t = best(c => c.totals.idolsPlayed); push('Most idols played', t?.c.name, t?.v, t ? `${t.v} idols` : '');
  t = best(c => c.totals.timesBetrayed); push('Most times betrayed', t?.c.name, t?.v, t ? `${t.v} betrayals` : '');
  t = best(c => c.totals.schemesCaught); push('Most schemes caught', t?.c.name, t?.v, t ? `${t.v} caught` : '');
  // Fan-perception records — only when popularity data exists (live-recorded seasons)
  t = best(c => c.totals.popularityKnown ? c.totals.popularity : 0);
  push('Most beloved', t?.c.name, t?.v, t ? `+${t.v} career fan score` : '');
  t = best(c => c.totals.popularityKnown && c.totals.popularity < 0 ? -c.totals.popularity : 0);
  push('Most notorious', t?.c.name, t?.v, t ? `${-t.v} career fan score` : '');
  return out;
}

// All-Stars scouting pools drawn from the active franchise's included seasons.
// A name lands in exactly ONE pool (priority legends > fallenAngels >
// unfinishedBusiness > redemption). Each pool caps at 8, sorted by relevance.
export function returneePools() {
  const names = new Set();
  for (const season of Object.values(activeSeasons())) {
    if (season.included === false) continue;
    for (const nm of Object.keys(season.players || {})) names.add(nm);
  }
  const pools = { legends: [], unfinishedBusiness: [], fallenAngels: [], redemption: [] };
  const claimed = new Set();
  const scored = { legends: [], unfinishedBusiness: [], fallenAngels: [], redemption: [] };

  for (const name of names) {
    const c = careerFor(name); if (!c) continue;
    const slug = c.slug;
    const last = c.seasons[c.seasons.length - 1];

    // legends — winners + multi-finalists
    if (c.totals.wins >= 1 || c.totals.finals >= 2) {
      const why = c.totals.wins >= 1
        ? (c.totals.wins > 1 ? `${c.totals.wins}× champion` : 'Former champion')
        : `${c.totals.finals}× finalist`;
      scored.legends.push({ name, slug, why, rel: c.totals.wins * 100 + c.totals.finals });
      claimed.add(name); continue;
    }
    // fallenAngels — a win/finalist season followed by a LATER bottom-half season
    let fell = null;
    for (let i = 0; i < c.seasons.length - 1; i++) {
      if (!(c.seasons[i].winner || c.seasons[i].finalist)) continue;
      for (let j = i + 1; j < c.seasons.length; j++) {
        const later = c.seasons[j];
        const cs = _castSizeOf(later.seasonNum);
        const half = cs ? cs / 2 : 9;
        if (later.placement > 0 && later.placement > half) { fell = { peak: c.seasons[i], later }; break; }
      }
      if (fell) break;
    }
    if (fell) {
      scored.fallenAngels.push({ name, slug,
        why: `${fell.peak.winner ? 'Champion' : 'Finalist'} S${fell.peak.seasonNum}, then ${_ordinal(fell.later.placement)} in S${fell.later.seasonNum}`,
        rel: (fell.peak.winner ? 2 : 1) * 100 + fell.later.placement });
      claimed.add(name); continue;
    }
    // unfinishedBusiness — blindsided in their LAST season while making a real run
    if (last && last.blindsided && (last.blindsidesAuthored >= 1 || (last.placement > 0 && last.placement <= 6))) {
      scored.unfinishedBusiness.push({ name, slug,
        why: `Blindsided ${_ordinal(last.placement)} in S${last.seasonNum}${last.blindsidesAuthored >= 1 ? ` after ${last.blindsidesAuthored} of their own` : ''}`,
        rel: (last.blindsidesAuthored || 0) * 10 + (20 - Math.min(20, last.placement)) });
      claimed.add(name); continue;
    }
    // redemption — never passed the merge-ish mark across ≥1 season
    if (c.seasons.length && c.seasons.every(s => !_madeMergeMark(s.placement, _castSizeOf(s.seasonNum)))) {
      const worst = c.seasons.reduce((a, s) => s.placement > (a?.placement || 0) ? s : a, null);
      scored.redemption.push({ name, slug,
        why: `Never made the merge — best ${_ordinal(c.totals.bestPlacement || (worst ? worst.placement : 0))} in ${c.totals.seasons} run${c.totals.seasons === 1 ? '' : 's'}`,
        rel: c.totals.seasons * 10 + (worst ? worst.placement : 0) });
      claimed.add(name); continue;
    }
    void claimed;
  }

  // ── flavor pools — NON-exclusive (a legend can also be a challenge titan);
  // only the four core story pools above are one-per-name.
  Object.assign(scored, { villains: [], heroes: [], challengeTitans: [], showmanceStars: [], firstBootClub: [], marathoners: [] });
  Object.assign(pools, { villains: [], heroes: [], challengeTitans: [], showmanceStars: [], firstBootClub: [], marathoners: [] });
  // Villainy per this sim's own behavior rules: it's WHO you are (villain-class
  // archetypes are the ones allowed to scheme), what you did to people who
  // TRUSTED you (betrayals, caught schemes), and how the audience received it
  // (negative popularity). Blindsides alone are NOT villainy — a hero voting
  // out a big threat is just a big move, so they carry almost no weight here.
  const VILLAIN_ARCH = { villain: 4, schemer: 3, mastermind: 2.5, 'chaos-agent': 1.5 };
  const NICE_ARCH = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  for (const name of names) {
    const c = careerFor(name); if (!c) continue;
    const slug = c.slug;
    const arch = c.archetype;
    const t = c.totals;

    // — villains: archetype + trust crimes + fan hatred
    {
      const parts = [];
      let v = 0;
      if (VILLAIN_ARCH[arch]) { v += VILLAIN_ARCH[arch]; parts.push(arch); }
      if (t.betrayalsCommitted) { v += t.betrayalsCommitted * 1.5; parts.push(`${t.betrayalsCommitted} betrayal${t.betrayalsCommitted === 1 ? '' : 's'}`); }
      if (t.schemesCaught) { v += t.schemesCaught * 2; parts.push(`caught scheming ×${t.schemesCaught}`); }
      if (t.popularityKnown && t.popularity < 0) { v += Math.min(4, -t.popularity); parts.push('fan-hated'); }
      if (t.blindsidesAuthored >= 3) { v += 0.5; parts.push(`${t.blindsidesAuthored} blindsides`); } // flavor, near-zero weight
      // nice archetypes are structurally incapable of scheming in this sim —
      // they only qualify on overwhelming real deeds, never on blindsides
      const disqualified = NICE_ARCH.includes(arch) && t.betrayalsCommitted === 0 && t.schemesCaught === 0;
      if (!disqualified && v >= 4) scored.villains.push({ name, slug, rel: v, why: parts.join(' · ') });
    }

    // — heroes: loyalty you can verify (clean hands + real allies) + fan love
    {
      const parts = [];
      let h = 0;
      if (t.betrayalsCommitted === 0 && t.schemesCaught === 0) {
        h += 1.5;
        if (arch === 'hero') { h += 2.5; parts.push('hero'); }
        else if (NICE_ARCH.includes(arch)) { h += 1.5; parts.push(arch); }
        const allyCount = c.people.allies.reduce((s, a) => s + a.count, 0);
        if (allyCount >= 2) { h += Math.min(3, allyCount * 0.6); parts.push(`${allyCount} loyal alliances`); }
        if (t.timesBetrayed >= 1 && t.betrayalsCommitted === 0) { h += 1; parts.push('betrayed, never betrayed back'); }
        if (t.popularityKnown && t.popularity > 0) { h += Math.min(4, t.popularity); parts.push('fan-loved'); }
        if (h >= 4) scored.heroes.push({ name, slug, rel: h, why: parts.join(' · ') || 'clean hands, full seasons' });
      }
    }
    if ((c.totals.chalWins || 0) >= 4) scored.challengeTitans.push({ name, slug, rel: c.totals.chalWins,
      why: `${c.totals.chalWins} career immunity wins` });
    if ((c.people.showmances || []).length >= 1) {
      const sh = c.people.showmances[0];
      scored.showmanceStars.push({ name, slug, rel: c.people.showmances.length * 10,
        why: `Showmance with ${sh.partner} (S${sh.seasonNum}${sh.ended === 'intact' ? ', lasted' : ''})${c.people.showmances.length > 1 ? ` +${c.people.showmances.length - 1} more` : ''}` });
    }
    for (const s of c.seasons) {
      const cs = _castSizeOf(s.seasonNum);
      if (cs && s.placement === cs) {
        scored.firstBootClub.push({ name, slug, rel: 100 - s.seasonNum, why: `First out in S${s.seasonNum}` });
        break;
      }
    }
    const eps = c.seasons.reduce((t, s) => t + (s.episodesLasted || 0), 0);
    if (eps >= 20) scored.marathoners.push({ name, slug, rel: eps, why: `${eps} episodes survived across ${c.totals.seasons} seasons` });
  }

  for (const key of Object.keys(pools)) {
    pools[key] = scored[key].sort((a, b) => b.rel - a.rel || a.name.localeCompare(b.name))
      .slice(0, 8).map(({ name, slug, why }) => ({ name, slug, why }));
  }

  // ── unfinished feuds — PAIRS with real history, for rivalry-driven casting
  const feudMap = {};
  for (const [num, season] of Object.entries(activeSeasons())) {
    if (season.included === false) continue;
    for (const [nm, rec] of Object.entries(season.players || {})) {
      for (const victim of rec.betrayed || []) {
        const k = [nm, victim].sort().join('||');
        if (!feudMap[k] || feudMap[k].rel < 20) feudMap[k] = { a: nm, b: victim, rel: 20 + Number(num), why: `S${num}: ${nm} betrayed ${victim}` };
      }
      for (const rival of rec.rivals || []) {
        const k = [nm, rival].sort().join('||');
        if (!feudMap[k]) feudMap[k] = { a: nm, b: rival, rel: 10 + Number(num), why: `Bitter rivals in S${num}` };
      }
    }
  }
  pools.feuds = Object.values(feudMap)
    .filter(f => names.has(f.a) && names.has(f.b))
    .sort((x, y) => y.rel - x.rel)
    .slice(0, 6)
    .map(f => ({ a: f.a, b: f.b, slugA: careerFor(f.a)?.slug, slugB: careerFor(f.b)?.slug, why: f.why }));

  return pools;
}

// ══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS + SEASON OBJECTIVES (UX Plan Item 11 — DESCRIPTIVE ONLY)
// These functions are pure reads over live gs (via `state`) and the ledger.
// They NEVER mutate simulation state — the only writes are storing the computed
// results on the season record (rec.achievements / rec.objectives) at record
// time. Nothing here can influence contestant AI or sim outcomes.
// ══════════════════════════════════════════════════════════════════════════

// Human-readable label per achievement id (stable ids; labels are cosmetic).
export const ACHIEVEMENT_LABELS = {
  'perfect-game':       'Perfect Game',
  'idol-nullification': 'Idol Nullification',
  'rock-survivor':      'Rock Survivor',
  'zero-vote-finalist': 'Zero-Vote Finalist',
  'fallen-angel':       'Fallen Angel',
  'revenge-arc':        'Revenge Arc',
  'immunity-streak':    'Immunity Streak',
  'untouchable':        'Untouchable'
};
// Achievements that require live/state data (gs.episodeHistory / finaleResult).
// Backfill (record-only) cannot compute these, and must preserve any that were
// detected at live-record time.
const _LIVE_ONLY_ACH = new Set(['perfect-game', 'idol-nullification', 'rock-survivor', 'zero-vote-finalist']);

// The player's most recent INCLUDED season strictly before `seasonNum`.
function _priorSeasonRec(name, seasonNum) {
  const hist = _historyFor(name).filter(h => h.seasonNum < seasonNum);
  return hist.length ? hist[hist.length - 1] : null;
}
// Did `victim` betray or blindside `author` in an INCLUDED season before
// `seasonNum`? Returns { seasonNum, how } (most-recent prior wrong) or null.
function _priorWrong(victim, author, seasonNum) {
  const seasons = activeSeasons();
  const nums = Object.keys(seasons).map(Number).filter(n => n < seasonNum).sort((a, b) => b - a);
  for (const num of nums) {
    const s = seasons[String(num)];
    if (!s || s.included === false) continue;
    const vp = s.players?.[victim], ap = s.players?.[author];
    if ((vp?.betrayed || []).includes(author)) return { seasonNum: num, how: 'betrayed' };
    if ((ap?.blindsidedBy || []).includes(victim)) return { seasonNum: num, how: 'blindsided' };
  }
  return null;
}

// detectSeasonAchievements(seasonNum, state) → [{ id, label, player, seasonNum, detail }]
// `state` = { gs, players } (live finale context) enables the vote-level, live-only
// detectors; record-only detection covers the rest. Idempotent; never mutates state.
export function detectSeasonAchievements(seasonNum, state = null) {
  seasonNum = Number(seasonNum);
  const rec = activeSeasons()[String(seasonNum)] || null;
  const _gs = state?.gs || null;
  const _players = state?.players || null;
  const out = [];
  const seen = new Set();
  const add = (id, player, detail) => {
    if (!player) return;
    const k = id + '|' + player;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ id, label: ACHIEVEMENT_LABELS[id] || id, player, seasonNum, detail: detail || '' });
  };

  // ── Live / state-only detectors (need gs.episodeHistory + finaleResult) ──
  if (_gs) {
    const hist = _gs.episodeHistory || [];
    const fin = _gs.finaleResult || {};
    const winner = fin.winner || null;
    const finalists = (fin.finalists || []).map(f => typeof f === 'string' ? f : f?.name).filter(Boolean);

    // perfect-game — winner with ZERO votes against them all season + ≥3 individual immunities
    if (winner) {
      let votesAgainst = 0, immWins = 0, anyVoteData = false;
      for (const ep of hist) {
        if (ep.immunityWinner === winner) immWins++;
        for (const v of (ep.votingLog || [])) { anyVoteData = true; if (v.voted === winner) votesAgainst++; }
      }
      if (anyVoteData && votesAgainst === 0 && immWins >= 3) {
        add('perfect-game', winner, `Won without a single vote ever cast against them — and ${immWins} individual immunities`);
      }
    }

    // idol-nullification — played a real idol that negated ≥3 votes and sent someone ELSE home
    for (const ep of hist) {
      const elim = _bootOf(ep);
      if (!elim) continue;
      for (const ip of (ep.idolPlays || [])) {
        const genuine = !ip.fake && !ip.failed && (!ip.type || ip.type === 'legacy');
        if (genuine && (ip.votesNegated || 0) >= 3 && ip.player && ip.player !== elim) {
          add('idol-nullification', ip.player, `Played an idol that voided ${ip.votesNegated} votes and sent ${elim} home (episode ${ep.num})`);
        }
      }
    }

    // rock-survivor — walked out of a rock draw / won a forced tiebreaker.
    // The sim's rockDraw() builds its pool EXCLUDING the tied players in the COMMON
    // branch (the tied are declared safe), so there the drawn/eliminated player is
    // NOT one of the tied and the true at-risk pool is never persisted. Only in a
    // FULL DEADLOCK do the tied players themselves draw rocks — and there the
    // eliminated IS one of the tied. Gate on that (isFullDeadlock is set on the live
    // ep but not persisted, so `tiedPlayers.includes(eliminated)` is the reliable
    // signal). Outside a full deadlock, per "do NOT invent", we credit no one.
    for (const ep of hist) {
      const elim = _bootOf(ep);
      if (ep.isRockDraw) {
        const tied = ep.tiedPlayers || [];
        const fullDeadlock = ep.isFullDeadlock === true || (!!elim && tied.includes(elim));
        if (fullDeadlock) {
          for (const p of tied) {
            if (p && p !== elim && p !== 'THE GAME') add('rock-survivor', p, `Survived a full-deadlock rock draw in episode ${ep.num}`);
          }
        }
      } else if (ep.tiebreakerResult) {
        const { participants, loser, challengeLabel } = ep.tiebreakerResult;
        for (const p of (participants || [])) if (p && p !== loser) {
          add('rock-survivor', p, `Won the ${challengeLabel || 'tiebreaker'} to break a deadlock (episode ${ep.num})`);
        }
      }
    }

    // zero-vote-finalist — reached FTC, got 0 jury votes (goated to the end)
    const jv = fin.votes;
    if (jv && typeof jv === 'object') {
      const totalJury = Object.values(jv).reduce((s, n) => s + (Number(n) || 0), 0);
      if (totalJury > 0) {
        for (const f of finalists) {
          if (f === winner) continue;
          if ((Number(jv[f]) || 0) === 0) add('zero-vote-finalist', f, 'Reached the Final Tribal Council and received zero jury votes');
        }
      }
    }
  }

  // ── Record + franchise-history detectors ──
  if (rec && rec.players) {
    const castSize = _castSizeOf(seasonNum) || Object.keys(rec.players).length;
    const half = castSize ? castSize / 2 : 9;

    for (const [name, r] of Object.entries(rec.players)) {
      // immunity-streak — ≥4 individual immunity wins in one season
      if ((r.chalWins || 0) >= 4) add('immunity-streak', name, `${r.chalWins} individual immunity wins in a single season`);

      // fallen-angel — winner/finalist in their prior season, bottom-half this season
      if (r.placement && r.placement > half) {
        const prior = _priorSeasonRec(name, seasonNum);
        if (prior && (prior.rec.winner || prior.rec.finalist)) {
          add('fallen-angel', name, `${prior.rec.winner ? 'Champion' : 'Finalist'} in Season ${prior.seasonNum}, fell to ${_ordinal(r.placement)} this season`);
        }
      }
    }

    // revenge-arc — took out someone who had betrayed/blindsided them in a PRIOR season
    for (const [name, r] of Object.entries(rec.players)) {
      const victimsThis = new Set([...(r.betrayed || [])]);
      for (const [b, br] of Object.entries(rec.players)) {
        if (b !== name && (br.blindsidedBy || []).includes(name)) victimsThis.add(b);
      }
      for (const victim of victimsThis) {
        const wrong = _priorWrong(victim, name, seasonNum);
        if (wrong) add('revenge-arc', name, `Took out ${victim}, who had ${wrong.how} them back in Season ${wrong.seasonNum}`);
      }
    }

    // untouchable — champion never blindsided across a 3+ season career (attach at latest season)
    for (const name of Object.keys(rec.players)) {
      const hist = _historyFor(name);
      if (hist.length < 3) continue;
      if (hist[hist.length - 1].seasonNum !== seasonNum) continue; // only the completing season
      const everWon = hist.some(h => h.rec.winner);
      const everBlindsided = hist.some(h => h.rec.blindsided);
      if (everWon && !everBlindsided) add('untouchable', name, `A champion who was never once blindsided across ${hist.length} seasons`);
    }
  }

  return out;
}

// Retract now-false "untouchable" medals. Untouchable claims a champion was NEVER
// blindsided across their career, so a single new blindside (recorded this season)
// invalidates the medal EVERYWHERE it was previously attached. Called from the live
// record paths after a season is written: sweep every season record in the active
// franchise and drop any untouchable entry for a player who was blindsided this
// season. Plain-data edits on rec.achievements (persisted with the record write).
function _retractStaleUntouchable(seasonNum) {
  const rec = activeSeasons()[String(seasonNum)];
  if (!rec || !rec.players) return;
  const blindSet = new Set(Object.entries(rec.players).filter(([, r]) => r.blindsided).map(([n]) => n));
  if (!blindSet.size) return;
  for (const s of Object.values(activeSeasons())) {
    if (!Array.isArray(s.achievements) || !s.achievements.length) continue;
    s.achievements = s.achievements.filter(a => !(a.id === 'untouchable' && blindSet.has(a.player)));
  }
}

// Walk the active franchise's seasons and compute RECORD-detectable achievements,
// persisting them on each rec. Preserves any live-only achievements already stored.
// Idempotent. Skips a locked (sealed-canon) franchise. Returns seasons touched.
export function backfillAchievements() {
  if (activeFranchise().locked) return 0;
  const seasons = activeSeasons();
  let touched = 0;
  for (const num of Object.keys(seasons)) {
    const rec = seasons[num];
    if (!rec || !rec.players) continue;
    const recordAch = detectSeasonAchievements(Number(num), null); // no gs → record-only
    const liveKept = (rec.achievements || []).filter(a => _LIVE_ONLY_ACH.has(a.id));
    const merged = [], seen = new Set();
    for (const a of [...liveKept, ...recordAch]) {
      const k = a.id + '|' + a.player;
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(a);
    }
    rec.achievements = merged;
    touched++;
  }
  return touched;
}

// ── Season objectives (optional, picked in Quick Setup) ───────────────────
export const SEASON_OBJECTIVES = [
  { id: 'protect-favorite',   label: 'Protect a Favorite', needsTarget: true,  blurb: 'Your pick reaches the merge — or further.' },
  { id: 'returnee-wins',      label: 'Returnee Wins',      needsTarget: false, blurb: 'A returning player takes the crown.' },
  { id: 'chaos-season',       label: 'Chaos Season',       needsTarget: false, blurb: '4+ blindsides and 2+ idol plays.' },
  { id: 'strong-final-three', label: 'Strong Final Three', needsTarget: false, blurb: 'Every finalist earned it — a blindside or an immunity run.' },
  { id: 'underdog-story',     label: 'Underdog Story',     needsTarget: false, blurb: 'A low-threat player reaches the Final Tribal.' }
];

function _isReturnee(name, seasonNum, playerList) {
  const live = (playerList || []).find(p => p.name === name);
  if (live && typeof live.isReturnee === 'boolean') return live.isReturnee;
  return _historyFor(name).some(h => h.seasonNum < seasonNum); // record fallback: appeared earlier
}

// evaluateObjectives(config, seasonNum, state) → [{ id, label, target?, met, detail }]
// Reads config.seasonObjectives (array of { id, target? }); pure over the record + state.
export function evaluateObjectives(config, seasonNum, state = null) {
  seasonNum = Number(seasonNum);
  const chosen = Array.isArray(config?.seasonObjectives) ? config.seasonObjectives : [];
  if (!chosen.length) return [];
  const rec = activeSeasons()[String(seasonNum)] || null;
  const _players = state?.players || null;
  const players = rec?.players || {};
  const castSize = _castSizeOf(seasonNum) || Object.keys(players).length;
  const half = castSize ? castSize / 2 : 9;
  const defFor = id => SEASON_OBJECTIVES.find(o => o.id === id);
  const out = [];

  for (const obj of chosen) {
    const def = defFor(obj.id); if (!def) continue;
    let met = false, detail = '';
    switch (obj.id) {
      case 'protect-favorite': {
        const t = obj.target;
        const r = t ? players[t] : null;
        if (!t) { detail = 'No favorite selected.'; break; }
        if (!r) { detail = `${t} was not in this season.`; break; }
        const reachedMerge = r.placement && r.placement <= half;
        met = !!reachedMerge;
        detail = r.winner ? `${t} won the whole thing.`
          : r.finalist ? `${t} reached the finale.`
          : reachedMerge ? `${t} made the merge (${_ordinal(r.placement)}).`
          : `${t} went out pre-merge (${_ordinal(r.placement)}).`;
        break;
      }
      case 'returnee-wins': {
        const winner = Object.entries(players).find(([, r]) => r.winner)?.[0] || null;
        if (!winner) { detail = 'No winner recorded.'; break; }
        met = _isReturnee(winner, seasonNum, _players);
        detail = met ? `${winner} returned and won.` : `${winner} won, but was not a returnee.`;
        break;
      }
      case 'chaos-season': {
        const need = Number(obj.target) || 4;
        let blindsides = 0, idols = 0;
        for (const r of Object.values(players)) { if (r.blindsided) blindsides++; idols += (r.idolsPlayed || 0); }
        met = blindsides >= need && idols >= 2;
        detail = `${blindsides} blindside${blindsides === 1 ? '' : 's'} and ${idols} idol play${idols === 1 ? '' : 's'} (need ${need}+ and 2+).`;
        break;
      }
      case 'strong-final-three': {
        const f3 = Object.entries(players).filter(([, r]) => r.placement && r.placement <= 3);
        if (f3.length < 3) { detail = 'No Final 3 recorded.'; break; }
        met = f3.every(([, r]) => (r.blindsidesAuthored || 0) >= 1 || (r.chalWins || 0) >= 2);
        detail = met ? 'Every finalist earned their seat.' : 'A finalist coasted in without a big move or an immunity run.';
        break;
      }
      case 'underdog-story': {
        const fin = Object.entries(players).filter(([, r]) => r.finalist || (r.placement && r.placement <= 3)).map(([n]) => n);
        const underdog = fin.find(n => (players[n].chalWins || 0) === 0 && (players[n].blindsidesAuthored || 0) === 0);
        met = !!underdog;
        detail = met
          ? `${underdog} reached the Final Tribal with no immunity wins and no blindsides — pure survival.`
          : 'Every finalist had an immunity win or a blindside to their name.';
        break;
      }
    }
    out.push({ id: obj.id, label: def.label, ...(obj.target ? { target: obj.target } : {}), met, detail });
  }
  return out;
}

// Read accessors (the Retrospective / other surfaces can adopt these later).
export function getSeasonAchievements(seasonNum) { return activeSeasons()[String(seasonNum)]?.achievements || []; }
export function getSeasonObjectives(seasonNum) { return activeSeasons()[String(seasonNum)]?.objectives || []; }

// ── Self-healing meta retrofit ────────────────────────────────────────────
// A season initialized before the ledger finished its async IndexedDB load —
// or before the user imported history — carries gs.franchiseMeta = null even
// though its returnees have recorded history. Called at the start of episode 1
// (nothing simulated yet, so bond seeding is still legitimate). No-op in every
// other situation.
export function retrofitFranchiseMeta() {
  if (!gs || gs.franchiseMeta || (gs.episodeHistory || []).length) return false;
  let meta = null;
  try { meta = buildFranchiseMeta(players, seasonConfig); } catch (e) { return false; }
  if (!meta) return false;
  if (!gs.bonds) gs.bonds = {};
  for (const sp of meta.seededPairs) {
    const k = metaBondKey(sp.a, sp.b);
    const cur = gs.bonds[k] || 0;
    // Same asymmetric clamp as initGameState: never pull a pre-existing
    // out-of-range bond inward, only cap the seed's contribution.
    const hi = Math.max(META_WEIGHTS.bondClamp, cur), lo = Math.min(-META_WEIGHTS.bondClamp, cur);
    gs.bonds[k] = Math.max(lo, Math.min(hi, cur + sp.bondDelta));
  }
  gs.franchiseMeta = meta;
  // The same for the life log, under the same "nothing simulated yet" guard —
  // a season started before any of this existed can still be given what its
  // cast walked in with.
  try {
    const life = _lifeSeeds(players, window.__lifeLog || [], window.__lifeSeasons || []);
    for (const sp of life.pairs) {
      const k = metaBondKey(sp.a, sp.b);
      const cur = gs.bonds[k] || 0;
      const hi = Math.max(META_WEIGHTS.bondClamp, cur), lo = Math.min(-META_WEIGHTS.bondClamp, cur);
      gs.bonds[k] = Math.max(lo, Math.min(hi, cur + sp.bondDelta));
    }
    for (const solo of life.soloPartners) {
      const p = players.find(x => x.name === solo.name);
      if (p) p.partnerAtHome = { slug: solo.whom, name: solo.whomName, stage: solo.stage };
    }
  } catch (e) { console.warn('Life carryover skipped.', e); }
  return true;
}

// ── Franchise export / import (whole-franchise backup files) ──────────────
export function exportActiveFranchise() {
  const f = activeFranchise();
  return { type: 'dc-franchise-export', v: 2, name: f.name || 'Untitled',
    exportedSeasons: Object.keys(f.seasons || {}).length,
    seasons: JSON.parse(JSON.stringify(f.seasons || {})) };
}

// Imports a franchise export as a NEW franchise (never merges into an existing
// one — no overwrite risk) and makes it active. Name is uniquified on collision.
export function importFranchiseExport(json) {
  if (json?.type !== 'dc-franchise-export' || !json.seasons || typeof json.seasons !== 'object') {
    return { ok: false, error: 'Not a franchise export file' };
  }
  const id = createFranchise(json.name || 'Imported');
  franchiseLedger.franchises[id].seasons = JSON.parse(JSON.stringify(json.seasons));
  franchiseLedger.active = id;
  return { ok: true, id, name: franchiseLedger.franchises[id].name,
    seasonCount: Object.keys(json.seasons).length };
}

// Wipes the ACTIVE franchise's seasons only (other franchises untouched).
export function wipeLedger() {
  const af = activeFranchise();
  if (af.locked) return false; // sealed archive — nothing wiped
  af.seasons = {};
  return true;
}

// Idempotent: keyed by season number; live records always overwrite backfill.
// The deriver's version. Bumped when deriveSeasonRecord learns to read
// something it used to miss — v2 is the Big Brother shapes (ballot flips,
// blindsides, and the players:[a,b] showmance form) — so records made by an
// older deriver can be found and re-made from their own save.
export const LEDGER_DERIVER_V = 2;

/**
 * Re-derive a stale ledger record from the save that is IN MEMORY.
 *
 * The ledger cannot heal itself at boot: a record's raw material (ballots,
 * episode history) lives in the season save, not in the ledger. So this runs
 * whenever a save is loaded — if it is a finished season whose ledger record
 * predates the current deriver, the record is made again from the same state
 * it was always made from. Loading bb-1 once is what gives its returnees
 * their betrayals, blindsides and showmances back.
 */
export function healLedgerRecord() {
  try {
    // "A season is in memory" is the history, not the init flag — a save
    // applied by the loader has one; a bare page does not.
    if (!gs || !(gs.episodeHistory || []).length) return false;
    const complete = gs.phase === 'complete' || !!gs.finaleResult?.winner;
    if (!complete) return false;
    const num = Number(gs.seasonNumber || seasonConfig.seasonNumber);
    if (!num) return false;
    const existing = activeSeasons()[String(num)];
    // Only live records: a backfill was never derived from a save and has
    // nothing to be re-derived from.
    if (!existing || existing.source !== 'live') return false;
    if ((existing.deriverV || 1) >= LEDGER_DERIVER_V) return false;
    if (activeFranchise().locked) return false;
    const ok = recordSeasonToLedger(null, 'live');
    if (ok) console.log(`Ledger record for season ${num} re-derived (deriver v${LEDGER_DERIVER_V}).`);
    return ok;
  } catch { return false; }
}

export function recordSeasonToLedger(_ep, source = 'live') {
  const af = activeFranchise();
  if (af.locked) {
    // Locked franchises reject BOTH the finale auto-record (live) and manual
    // records. Log from here so the rejection is visible even though finale.js's
    // own "season number not set" warning (which we do not edit) may also fire.
    console.warn(`Franchise "${af.name || 'Untitled'}" is locked — season not recorded.`);
    return false;
  }
  if (source === 'live' && (seasonConfig?.franchiseMeta === false || seasonConfig?.franchiseMetaAutoRecord === false)) return false;
  const rec = deriveSeasonRecord();
  if (!rec) return false;
  rec.source = source;
  rec.deriverV = LEDGER_DERIVER_V; // 'live' | 'manual' (Task 8b) — backfill entries carry per-player backfilled flags
  const _num = Number(gs?.seasonNumber || seasonConfig.seasonNumber);
  activeSeasons()[String(_num)] = rec;
  // Descriptive-only: detect achievements + evaluate objectives from live gs.
  // Stored on the record; never influences the sim (already complete).
  try {
    rec.achievements = detectSeasonAchievements(_num, { gs, players });
    rec.objectives = evaluateObjectives(seasonConfig, _num, { gs, players });
    _retractStaleUntouchable(_num); // drop now-false untouchable medals on prior seasons
  } catch (e) { console.warn('Achievement/objective detection failed:', e); }
  return true;
}

// Record a season derived from a PARSED savestate export (season-*-ep*.json shape:
// { name, config, players, gs }). Validates a finished finale and NEVER touches
// live gs/players. Writes into the ACTIVE franchise. Returns a result object.
export function recordSeasonFromSavestate(parsedJson, opts = {}) {
  if (!parsedJson || typeof parsedJson !== 'object') return { ok: false, error: 'Not a valid save file' };
  if (activeFranchise().locked) return { ok: false, error: 'Franchise is locked' };
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
  try {
    rec.achievements = detectSeasonAchievements(Number(seasonNumber), state);
    rec.objectives = evaluateObjectives(state.config || {}, Number(seasonNumber), state);
    _retractStaleUntouchable(Number(seasonNumber)); // drop now-false untouchable medals on prior seasons
  } catch (e) { void e; }
  const winner = Object.entries(rec.players).find(([, r]) => r.winner)?.[0] || null;
  return { ok: true, seasonNum: seasonNumber, playerCount: Object.keys(rec.players).length, winner };
}

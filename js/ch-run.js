// ══════════════════════════════════════════════════════════════════════
// ch-run.js — the run loop's Challenge branch, and the runnable flag
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/ci-run.js. The engine plays the WHOLE season in one call
// (js/ch/season.js) and the director airs it (js/ch/story/director.js: the
// stories run across episodes, so an episode cannot be written alone). The
// rows are queued on `gs._chQueue`; each press of "Simulate Episode N" shifts
// one onto `gs.episodeHistory`.
//
// The seed and the cast ORDER live on `gs.ch`, so a queue lost to a reload
// rebuilds the SAME season and drops the rows that already aired.
//
// THE FRANCHISE (manual §8.3). The engine plays in its own `gs`, so this file
// reads the history in (`carriedFor`), builds the season's ledger record while
// the inner `gs` is live, writes it when the last episode airs
// (`recordBuiltSeason`), and copies bonds, perceived bonds, popularity and the
// relationship dimensions back to the outer `gs`.
//
// IMPORTING THIS MODULE IS THE WIRING: it sets `window._chRunnable`, which
// `formatIsRunnable()` reads.
import { gs, setGs, players, seasonConfig, seasonFormat } from './core.js';
import { CHALLENGE_FORMAT, SHOWS } from './shows.js';
import { playChallengeSeason } from './ch/season.js';
import { airSeason } from './ch/story/director.js';
import { buildSchedule } from './ch/schedule.js';
import { DEFAULT_OPTIONS } from './ch/format.js';
import { airedOf } from './ch/transcript.js';
import { chLedgerRecord } from './ch/ledger-record.js';
import { carriedFor } from './franchise-carry.js';
import { recordBuiltSeason, activeSeasons, seasonKeyParts, hasFranchiseHistory, careerOf, careerFor } from './franchise-meta.js';

export const isChallengeSeason = () => seasonFormat(seasonConfig) === CHALLENGE_FORMAT;

let _lastRefusal = null;
const _refuse = why => { _lastRefusal = why; return false; };
/** Why the last attempt to play or re-run did not happen, in words for a toast. */
export function lastChallengeRefusal() { return _lastRefusal; }

function _seed() {
  gs.ch ||= {};
  if (!gs.ch.seed) gs.ch.seed = (Number(seasonConfig.seasonNumber) || 0) * 1000 + Math.floor(Math.random() * 1000) + 1;
  return gs.ch.seed;
}

const _cast = () => {
  const saved = Array.isArray(gs?.ch?.castOrder) && gs.ch.castOrder.length ? gs.ch.castOrder : null;
  return saved || (players || []).filter(p => p?.name).map(p => p.name);
};
const _player = n => (players || []).find(p => p?.name === n) || null;

/** Each player's setup, from the usual cast form (`chBilling`, `chDivision` on
 *  the player, like the castle's backgroundType); `seasonConfig.chSetup` is the
 *  same thing for a cast built in code, and the form wins. */
export function challengeSetup() {
  const out = {};
  for (const [n, v] of Object.entries(seasonConfig.chSetup || {})) out[n] = { ...v };
  for (const p of players || []) {
    if (!p?.name) continue;
    const s = (out[p.name] ||= {});
    if (p.chBilling === 'vet' || p.chBilling === 'rookie') s.rookie = p.chBilling === 'rookie';
    if (p.chDivision === 'm' || p.chDivision === 'f') s.division = p.chDivision;
  }
  return out;
}

export function challengeOptions(config = seasonConfig) {
  return {
    gendered: config?.chGenderBlind !== true,
    finalists: [6, 8, 10].includes(Number(config?.chFinalists)) ? Number(config.chFinalists) : DEFAULT_OPTIONS.finalists,
    partyNights: config?.chPartyNights !== false,
    // Its own switch: the season-wide Romance select is Total Drama's.
    romance: config?.chRomance !== false,
    partnerWeeks: config?.chPartnerWeeks !== false,
  };
}

/** The show a player came from: the one the ledger has them on most often
 *  (The Challenge itself only if they have played nothing else). Null when
 *  the ledger does not know them. */
export function originOf(name) {
  const count = {};
  for (const [key, season] of Object.entries(activeSeasons() || {})) {
    if (season?.included === false || !season?.players?.[name]) continue;
    const f = seasonKeyParts(key, season).format;
    count[f] = (count[f] || 0) + 1;
  }
  const order = Object.keys(SHOWS);
  const best = Object.entries(count).sort((a, b) => (b[1] - a[1]) || (order.indexOf(a[0]) - order.indexOf(b[0])))
    .map(([f]) => f);
  return best.find(f => f !== CHALLENGE_FORMAT) || best[0] || null;
}

/** Who each cast member is walking in as: gender, division, rookie, origin. */
export function challengeBackground(cast = _cast(), setup = challengeSetup()) {
  const out = {};
  for (const n of cast) {
    const p = _player(n) || {};
    const s = setup[n] || {};
    let known = false;
    try { known = hasFranchiseHistory(n); } catch { known = false; }
    out[n] = {
      gender: p.gender || 'm',
      // Billed a rookie when the ledger has never seen them, unless the author said otherwise.
      rookie: typeof s.rookie === 'boolean' ? s.rookie : !known,
      origin: (() => { try { return originOf(n); } catch { return null; } })(),
    };
  }
  return out;
}

/** How a cast card bills a player: 'Vet' or 'Rookie' (null off a Challenge season). */
export function challengeBilling(p) {
  if (!p?.name || !isChallengeSeason()) return null;
  if (p.chBilling === 'vet') return 'Vet';
  if (p.chBilling === 'rookie') return 'Rookie';
  let known = false;
  try { known = hasFranchiseHistory(p.name); } catch { known = false; }
  return known ? 'Vet' : 'Rookie';
}

/** A non-binary player's division: the author's pick, else none (the engine balances). */
export function challengeDivisions(cast = _cast(), setup = challengeSetup(), genderOf = n => _player(n)?.gender) {
  const out = {};
  for (const n of cast) {
    const g = genderOf(n);
    if (g === 'm' || g === 'f') out[n] = g;
    else if (setup[n]?.division === 'm' || setup[n]?.division === 'f') out[n] = setup[n].division;
  }
  return out;
}

/** The first reason this cast cannot start a season, or null. */
export function challengeCastProblem(cast = _cast(), setup = challengeSetup(), config = seasonConfig, genderOf = n => _player(n)?.gender) {
  const opts = challengeOptions(config);
  if (cast.length < opts.finalists + 2) return `a season needs more players than finalists: ${cast.length} players, ${opts.finalists} into the final`;
  if (opts.gendered) {
    const div = challengeDivisions(cast, setup, genderOf);
    const m = cast.filter(n => div[n] === 'm').length, f = cast.filter(n => div[n] === 'f').length;
    const open = cast.length - m - f;
    if (Math.min(m, f) + open < 3) return "a gendered season needs at least three players in each division (or make it gender-blind)";
  }
  return null;
}

/** The episodes this cast and these options make (the Season Timeline reads this). */
export function challengeSeasonShape(cast = _cast(), config = seasonConfig) {
  const opts = { ...DEFAULT_OPTIONS, ...challengeOptions(config) };
  try { return buildSchedule({ total: cast.length, finalists: opts.finalists, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered }); }
  catch { return []; }
}

const VERB = { arena: 'eliminated', quit: 'quit', medical: 'left on a medical', disqualified: 'disqualified', instant: 'eliminated' };

// Who they are, for the premiere's introductions (js/vp-ch-ep: a package per player as they come off the
// plane): their show, vet or rookie, the authored facts, and for a veteran the career the franchise
// ledger holds. Recorded when the season is built, so a rewatch shows the career as it stood then.
function introOf(n, state, cast) {
  const p = _player(n) || {};
  // the first sentence that says something about them (not the date they were born), at most two
  const first = t => {
    const all = String(t || '').match(/[^.!?]+[.!?]+/g) || [];
    const good = all.map(x => x.trim()).filter(x => x.length > 30 && !/\bborn (on|in)\b|\bwas born\b/i.test(x));
    const pick = good[0] || all[0]?.trim() || '';
    return pick ? (pick.length > 260 ? pick.slice(0, 257).replace(/\s+\S*$/, '') + '...' : pick) : null;
  };
  const tagOf = v => { const m = String(v || '').match(/^[^.!?]{3,60}[.!?]/); return m ? m[0].replace(/[.!?]$/, '') : null; };
  let career = [], badges = [], rival = null;
  try {
    career = careerOf(n).slice(-5).map(c => ({ where: c.where, format: c.format || 'total-drama', place: c.rec?.placement || 0, total: c.total || null,
      winner: !!c.rec?.winner, finalist: !!c.rec?.finalist, wins: c.rec?.chalWins || c.rec?.dailyWins || 0 }));
    const cf = careerFor(n);
    badges = (cf?.badges || []).slice(0, 3);
    rival = Object.entries(cf?.rivals || {}).filter(([r]) => r !== n && cast.includes(r)).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
  } catch { /* no ledger yet */ }
  return { origin: state.origin?.[n] || null, rookie: !!state.rookie?.[n], age: p.age || null, hometown: p.hometown || null,
    occupation: p.occupation && p.occupation !== 'None' ? p.occupation : null, story: first(p.backstory || p.descriptor), tag: tagOf(p.voice), career, badges, rival };
}

// The daily as it was played, for the stepped viewer: the units in finishing order (best first).
function dailyOf(d) {
  if (!d) return null;
  const sc = d.scores || {};
  const unit = u => u.reduce((a, n) => a + (sc[n] || 0), 0) / Math.max(1, u.length);
  const order = [...(d.units || [])].sort((a, b) => unit(b) - unit(a)).map(u => [...u]);
  return { id: d.id, name: d.name, mode: d.mode, order, winners: [...(d.winners || [])], last: [...(d.last || [])],
    throws: (d.throws || []).map(t => t.name || t), caught: (d.caught || []).map(c => ({ thrower: c.thrower, by: c.by })),
    moments: (d.moments || []).map(m => ({ kind: m.kind, who: m.who })), injuries: [...(d.injuries || [])] };
}
// An Arena game (or a final's instant elimination) as it was played.
const duelOf = d => ({ game: d.game, name: d.gameName || d.game, kind: d.kind || null, a: d.a, b: d.b, winner: d.winner, loser: d.loser,
  upset: !!d.upset, comeback: !!d.comeback, volunteer: !!d.volunteer, beats: (d.beats || []).map(b => ({ ...b, score: b.score ? { ...b.score } : undefined })) });
// The final as it was run: checkpoints, the instant eliminations, the overnight.
function finalOf(f) {
  if (!f) return {};
  return { finalists: [...(f.finalists || [])], checkpoints: (f.checkpoints || []).map(c => ({ id: c.id, scores: { ...c.scores } })),
    instant: (f.instant || []).map(duelOf), overnight: (f.overnight || []).map(o => ({ ...o })),
    sabotage: (f.sabotage || []).map(x => ({ ...x })), help: (f.help || []).map(x => ({ ...x })), totals: { ...(f.totals || {}) } };
}

/** The run tab's rows, one per episode and one for the final, from a played and aired season. */
export function challengeRows(result) {
  const { state } = result;
  const cast = state.cast;
  const goneEp = Object.fromEntries(state.gone.map(g => [g.name, g.ep]));
  const peopleAfter = ep => cast.filter(n => !(goneEp[n] <= ep));
  const exitsAt = ep => state.gone.filter(g => g.ep === ep).map(g => ({ name: g.name, verb: VERB[g.how] || 'eliminated', channel: g.how, by: g.by || null }));
  // Who was in the house when episode `ep` began.
  const castAt = ep => cast.filter(n => !(goneEp[n] < ep));
  const rows = [];
  for (const e of result.episodes) {
    const ballots = (e.votes || []).flatMap(v => v.ballots || []);
    const tally = {};
    for (const b of ballots) tally[b.target] = (tally[b.target] || 0) + 1;
    const exits = exitsAt(e.ep);
    rows.push({
      format: CHALLENGE_FORMAT, num: e.ep, day: e.aired?.[0]?.day ?? null,
      exits, eliminated: exits.find(x => x.channel === 'arena')?.name || exits[0]?.name || null,
      votes: tally, votingLog: ballots.map(b => ({ voter: b.voter, voted: b.target })),
      immunityWinner: (e.daily?.winners || [])[0] || null,
      ch: {
        division: e.division || null, people: peopleAfter(e.ep),
        dailyWinners: [...(e.daily?.winners || [])], votedIn: [...(e.votedIn || [])],
        callouts: (e.callouts || []).map(c => ({ by: c.by, opponent: c.opponent, reason: c.reason })),
        arena: (e.arena || []).map(d => ({ winner: d.winner, loser: d.loser, game: d.gameName || d.game || null })),
        aired: airedOf(e),
        // What the stepped viewer stages (js/vp-ch-ep): the house at the start, the daily as it was
        // played, every ballot with what the voter wanted, was asked and told, and each Arena game.
        house: castAt(e.ep),
        daily: dailyOf(e.daily),
        votes: (e.votes || []).map(v => ({ votedIn: v.votedIn, tally: { ...(v.tally || {}) }, tied: !!v.tied, tiebreak: v.tiebreak || null,
          ballots: (v.ballots || []).map(b => ({ voter: b.voter, target: b.target, wanted: b.wanted || null, asked: b.asked || null, told: b.told || null, why: b.why || null, flip: !!b.flip })) })),
        duels: (e.arena || []).map(duelOf),
        meetings: (e.delib?.meetings || []).map(m => ({ name: m.name || null, organiser: m.organiser, target: m.target, responses: { ...(m.responses || {}) } })),
        // who they are, for the arrival's name plates: their show and whether they're a rookie
        ...(e.ep === 1 ? { castInfo: Object.fromEntries(cast.map(n => [n, introOf(n, state, cast)])) } : {}),
      },
    });
  }
  const f = state.finalEp;
  if (f) {
    rows.push({
      format: CHALLENGE_FORMAT, num: f.ep, day: f.aired?.[0]?.day ?? null, exits: exitsAt(f.ep), eliminated: null,
      votes: {}, votingLog: [], winner: (result.champions || [])[0] || null,
      ch: { final: { champions: [...(result.champions || [])], placements: { ...(state.final?.placements || {}) },
          ...finalOf(result.final) },
        people: [...(result.champions || [])], house: castAt(f.ep), aired: airedOf(f) },
    });
  }
  return rows;
}

function _inputs() { return { setup: challengeSetup(), options: challengeOptions() }; }
const _sig = inputs => JSON.stringify(inputs);
const _fingerprint = r => JSON.stringify([r?.num, (r?.exits || []).map(x => x.name), r?.ch?.votedIn || []]);
function _firstChanged(aired, rows) {
  for (let i = 0; i < aired.length; i++) if (_fingerprint(aired[i]) !== _fingerprint(rows[i])) return aired[i].num;
  return null;
}

function _build(inputs, rerolls) {
  _lastRefusal = null;
  const cast = _cast();
  const problem = challengeCastProblem(cast, inputs.setup);
  if (problem) { _refuse(problem); return null; }
  const people = (players || []).filter(p => p && cast.includes(p.name));
  // The franchise as it stood when this season was first built: a re-run
  // reuses it, so a season never reads its own record (written when its last
  // episode airs) and an aired episode comes back the same.
  const startOf = gs?.ch?.startOf;
  const carried = startOf?.carried || carriedFor(people, seasonConfig || {});
  const background = startOf?.background || challengeBackground(cast, inputs.setup);
  const divisions = challengeDivisions(cast, inputs.setup);
  const seed = _seed();
  const outer = gs;
  let result, inner, record = null;
  try {
    result = playChallengeSeason({ cast, background, divisions, carried, seed, options: { ...inputs.options, rerolls } });
    airSeason(result.state);
    inner = gs;
    try {
      record = chLedgerRecord(result.state, result, { seasonName: seasonConfig?.name || null,
        archetypeOf: n => _player(n)?.archetype || null, popularity: inner.popularity || {} });
    } catch (e) { console.warn('Challenge ledger record failed:', e); record = null; }
  } finally { setGs(outer); }
  return { cast, seed, rows: challengeRows(result), inner, champions: [...(result.champions || [])], record,
    startOf: { carried, background } };
}

function _commit(built, inputs, rerolls, airedCount) {
  gs.ch = { seed: built.seed, castOrder: [...built.cast], champions: built.champions, rerolls: { ...rerolls },
    built: _sig(inputs), record: built.record || null, startOf: built.startOf || null };
  gs._chQueue = built.rows.slice(airedCount);
  gs.relationshipDimensions = built.inner.relationshipDimensions || {};
  gs.bonds = built.inner.bonds || {};
  gs.perceivedBonds = built.inner.perceivedBonds || {};
  gs.popularity = built.inner.popularity || {};
}

let _lastNotice = null;
/** A change the run could not apply to what already aired, in words, or null. */
export function challengePendingChange() { return _lastNotice; }

function _refreshQueue() {
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === CHALLENGE_FORMAT);
  const inputs = _inputs();
  const rerolls = { ...(gs.ch?.rerolls || {}) };
  if (Array.isArray(gs._chQueue) && (gs.ch?.built === _sig(inputs) || gs.ch?.deferred === _sig(inputs))) return true;
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(aired, built.rows);
  if (changed == null) { _lastNotice = null; _commit(built, inputs, rerolls, aired.length); return true; }
  _lastNotice = `That change affects episode ${changed}, which has already aired. Re-run episode ${changed} to play it with the change.`;
  if (!Array.isArray(gs._chQueue)) {
    const asBuilt = gs.ch?.built ? JSON.parse(gs.ch.built) : inputs;
    const again = _build(asBuilt, rerolls);
    if (!again) return false;
    _commit(again, asBuilt, rerolls, aired.length);
  }
  gs.ch.deferred = _sig(inputs);
  return true;
}

/** Air the next episode, or null when the season is over (or cannot start). */
export function simulateChallengeEpisode() {
  if (!gs) return null;
  if (!_refreshQueue()) return null;
  const row = gs._chQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.ch?.people || [])];
  gs.episode = row.num;
  gs.phase = gs._chQueue.length ? 'challenge' : 'complete';
  if (!gs._chQueue.length) {
    gs.chChampions = [...(gs.ch?.champions || [])];
    // The season is over: what it leaves the franchise goes on the ledger,
    // where the next season of any show reads it (franchise-meta.js).
    try {
      const num = Number(gs.seasonNumber || seasonConfig?.seasonNumber);
      if (gs.ch?.record && num && recordBuiltSeason(gs.ch.record, num)) {
        if (typeof window !== 'undefined') window.persistFranchiseLedger?.();
      }
    } catch (e) { console.warn('Franchise ledger record failed:', e); }
  }
  // What the run tab shows when this episode is reviewed later: who was in
  // after it, not who is in now.
  row.gsSnapshot = typeof window !== 'undefined' && window.snapshotGameState
    ? window.snapshotGameState()
    : { initialized: true, activePlayers: [...gs.activePlayers], episode: gs.episode, phase: gs.phase };
  return row;
}

/** The Season Timeline's tiles: one per episode, with how many are still in. */
export function challengeEpisodeMap() {
  const rows = new Map([...(gs?.episodeHistory || []).filter(r => r?.format === CHALLENGE_FORMAT), ...(gs?._chQueue || [])]
    .map(r => [r.num, r]));
  let n = _cast().length;
  return challengeSeasonShape().map(d => {
    const row = rows.get(d.ep);
    if (row?.ch?.people) n = row.ch.people.length;
    else if (!d.final) n = Math.max(0, n - (d.plannedElims || 1));
    return { ep: d.ep, active: n, phase: d.final ? 'finale' : 'main', engineType: null, tribes: 1 };
  });
}

export function challengeEpisodesLeft() { return Array.isArray(gs?._chQueue) ? gs._chQueue.length : null; }

/** A season with a seed can re-run any episode: the dice are per episode. */
export function challengeCanRerun() { return !!gs?.ch?.seed; }

/** Re-deal episode N: its own dice turn once more; every earlier episode
 *  stays exactly as it aired; later ones are cleared, to be simulated again. */
export function rerunChallengeEpisode(epNum) {
  _lastRefusal = null;
  if (!gs?.ch?.seed) return _refuse('this season has no stored seed, so the episodes that already aired could not be reproduced');
  const N = Math.max(1, Number(epNum) || 1);
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === CHALLENGE_FORMAT);
  const prefix = aired.filter(r => r.num < N);
  const inputs = _inputs();
  const rerolls = { ...(gs.ch.rerolls || {}), [N]: ((gs.ch.rerolls || {})[N] || 0) + 1 };
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(prefix, built.rows);
  if (changed != null) return _refuse(`a change to the setup affects episode ${changed}, which comes before episode ${N}. Re-run episode ${changed} instead`);
  if (!built.rows.some(r => r.num === N)) return _refuse(`the season has no episode ${N}`);
  gs.episodeHistory = [...(gs.episodeHistory || []).filter(r => !(r && r.format === CHALLENGE_FORMAT && r.num >= N))];
  _commit(built, inputs, rerolls, prefix.length);
  _lastNotice = null;
  delete gs.chChampions;
  gs.phase = 'challenge';
  const last = prefix[prefix.length - 1];
  gs.activePlayers = last ? [...(last.ch?.people || [])] : [];
  gs.episode = last ? last.num : 0;
  return true;
}

/** How the episode was decided, for the hub's corner: who went into the Arena. */
export function challengeVoteShape(row) {
  if (row?.ch?.final) return `Champions: ${(row.ch.final.champions || []).join(' & ')}`;
  const duels = row?.ch?.arena || [];
  if (!duels.length) return 'No elimination';
  return duels.map(d => `${d.winner} beat ${d.loser}${d.game ? ` (${d.game})` : ''}`).join(' · ');
}

if (typeof window !== 'undefined') window._chRunnable = true;

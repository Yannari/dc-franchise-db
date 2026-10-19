// ══════════════════════════════════════════════════════════════════════
// rr-run.js — the run loop's Ridonculous Race branch, and the runnable flag
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/ch-run.js. The engine plays the WHOLE race in one call
// (js/rr/season.js) and the director airs it (js/rr/episode.js: the stories and
// the line ledger run across legs, so a leg cannot be written alone). The rows
// are queued on `gs._rrQueue`; each press of "Simulate Episode N" shifts one
// onto `gs.episodeHistory`.
//
// The seed and the teams live on `gs.rr`, so a queue lost to a reload rebuilds
// the SAME race and drops the rows that already aired.
//
// THE TEAMS come off the cast cards, the way The Challenge's pairs do: two cards
// whose Partner fields (`rrPartner`) name each other are a team, and the team's
// relationship (`rrRel`), identity (`rrIdentity`) and typed team name
// (`rrTeamName`) may sit on either card. `seasonConfig.rrTeams` is the same thing
// for a cast built in code.
//
// THE FRANCHISE (manual §8.3). The engine plays in its own `gs`, so this file
// reads the history in (`carriedFor`), builds the season's ledger record while
// the inner `gs` is live, writes it when the last leg airs (`recordBuiltSeason`),
// and copies bonds, perceived bonds, popularity and the relationship dimensions
// back to the outer `gs`.
//
// IMPORTING THIS MODULE IS THE WIRING: it sets `window._rrRunnable`, which
// `formatIsRunnable()` reads.
import { gs, setGs, players, seasonConfig, seasonFormat } from './core.js';
import { RACE_FORMAT } from './shows.js';
import { playRaceSeason } from './rr/season.js';
import { airSeason } from './rr/episode.js';
import { buildSchedule } from './rr/schedule.js';
import { DEFAULT_OPTIONS } from './rr/format.js';
import { REL } from './rr/state.js';
import { IDENTITIES } from './rr/identities.js';
import { TASK_TYPES } from './rr/types.js';
import { PLACES } from './rr/places.js';
import { rrLedgerRecord } from './rr/ledger-record.js';
import { carriedFor } from './franchise-carry.js';
import { recordBuiltSeason, hasFranchiseHistory } from './franchise-meta.js';

export const isRaceSeason = () => seasonFormat(seasonConfig) === RACE_FORMAT;

// the real show ran 18 teams, the Amazing Race 11 or 12 (spec §2)
export const MIN_TEAMS = 6, MAX_TEAMS = 18;

let _lastRefusal = null;
const _refuse = why => { _lastRefusal = why; return false; };
/** Why the last attempt to play did not happen, in words for a toast. */
export function lastRaceRefusal() { return _lastRefusal; }

function _seed() {
  gs.rr ||= {};
  if (!gs.rr.seed) gs.rr.seed = (Number(seasonConfig.seasonNumber) || 0) * 1000 + Math.floor(Math.random() * 1000) + 1;
  return gs.rr.seed;
}
const _player = n => (players || []).find(p => p?.name === n) || null;
const _list = () => (players || []).filter(p => p?.name);

/** The relationships a team can have, for the cast card's picker: id and label. */
export const RACE_RELATIONSHIPS = Object.keys(REL).map(id => ({ id, label: {
  'parent-child': 'Parent and child', siblings: 'Siblings', cousins: 'Cousins', 'grandparent-grandchild': 'Grandparent and grandchild',
  married: 'Married', dating: 'Dating', 'newly-dating': 'Newly dating', 'on-off': 'On and off', exes: 'Exes',
  'once-engaged': 'Once engaged', bffs: 'Best friends', coworkers: 'Coworkers', roommates: 'Roommates', rivals: 'Rivals',
  enemies: 'Enemies', 'reality-vets': 'Reality-show vets' }[id] || id }));
/** The identities a team can race as, for the cast card's picker. */
export const RACE_IDENTITIES = Object.entries(IDENTITIES).map(([id, x]) => ({ id, label: x.name }));

/** The partners set on the cast cards: only two cards that name each other count. A card has one Partner field
 *  (`chPartner`, which the Casting Room's Pairs view writes for The Challenge's pairs and for a race's teams);
 *  `rrPartner` is the same thing for a cast built in code. */
const partnerOf = p => p.rrPartner || p.chPartner || null;
export function racePartnerPins(list = _list()) {
  const named = Object.fromEntries(list.filter(p => partnerOf(p)).map(p => [p.name, partnerOf(p)]));
  const out = {};
  for (const [a, b] of Object.entries(named)) if (named[b] === a && a !== b) out[a] = b;
  return out;
}

/**
 * The season's teams, in cast order: { id, name, a, b, rel, identity, custom }. A team's fields come from either of
 * its cards (the first card in cast order wins a disagreement). A team with no relationship set races as two reality-
 * show vets when both have played before, else as best friends; with no identity it is named after the two of them.
 */
export function raceTeams(list = _list(), config = seasonConfig) {
  if (Array.isArray(config?.rrTeams) && config.rrTeams.length) {
    return config.rrTeams.map((t, i) => _team(i, t.a, t.b, t));
  }
  const pins = racePartnerPins(list);
  const seen = new Set(), out = [];
  for (const p of list) {
    const o = pins[p.name];
    if (!o || seen.has(p.name)) continue;
    seen.add(p.name); seen.add(o);
    const q = _player(o) || {};
    const pick = k => p[k] || q[k] || null;
    out.push(_team(out.length, p.name, o, { rel: pick('rrRel'), identity: pick('rrIdentity'), name: pick('rrTeamName'),
      customName: pick('rrCustomName'), customLike: [pick('rrCustomLike'), pick('rrCustomLike2'), pick('rrCustomLike3')],
      customGood: [pick('rrCustomGood1'), pick('rrCustomGood2')], customBad: [pick('rrCustomBad1'), pick('rrCustomBad2')] }));
  }
  return out;
}
function _team(i, a, b, { rel = null, identity = null, name = null, customName = null, customLike = [], customGood = [], customBad = [] } = {}) {
  let vets = false;
  try { vets = hasFranchiseHistory(a) && hasFranchiseHistory(b); } catch { vets = false; }
  const r = REL[rel] ? rel : vets ? 'reality-vets' : 'bffs';
  const typed = String(name || '').trim();
  // a custom identity: a name of the user's own that plays like a built-in one (identities.js identityOf reads
  // custom.strength for its strengths and voice)
  const own = identity === 'custom' && String(customName || '').trim();
  if (own) {
    const uniq = list => [...new Set([].concat(list || []).filter(Boolean))];
    const mix = uniq(customLike).filter(x => IDENTITIES[x]).slice(0, 3);
    const good = uniq(customGood).filter(x => TASK_TYPES[x]).slice(0, 2);
    const bad = uniq(customBad).filter(x => TASK_TYPES[x] && !good.includes(x)).slice(0, 2);
    return { id: 't' + (i + 1), a, b, rel: r, identity: null, name: typed || own,
      custom: { name: own, mix, voice: mix[0] || null, good, bad, strength: mix[0] || null } };
  }
  const id = IDENTITIES[identity] ? identity : null;
  return { id: 't' + (i + 1), a, b, rel: r, identity: id,
    // a typed name over an identity's is the team's own (the engine's identityName reads custom.name)
    name: typed || (id ? IDENTITIES[id].name : `${a} & ${b}`),
    custom: typed && (!id || typed !== IDENTITIES[id].name) ? { name: typed } : null };
}

/** The first reason this cast cannot start a race, or null. */
export function raceCastProblem(list = _list(), config = seasonConfig) {
  const teams = raceTeams(list, config);
  const inTeam = new Set(teams.flatMap(t => [t.a, t.b]));
  const off = config?.rrTeams?.length ? [] : list.filter(p => !inTeam.has(p.name)).map(p => p.name);
  if (off.length) return `${off.slice(0, 3).join(', ')}${off.length > 3 ? ` and ${off.length - 3} more` : ''} ${off.length === 1 ? 'needs' : 'need'} a partner (two cast cards whose Partner fields name each other)`;
  if (teams.length < MIN_TEAMS) return `a race needs at least six teams: ${teams.length} now`;
  if (teams.length > MAX_TEAMS) return `a race has at most eighteen teams: ${teams.length} now`;
  const ids = teams.map(t => t.identity).filter(Boolean);
  const twice = ids.find((x, i) => ids.indexOf(x) !== i);
  if (twice) return `two teams can't both be ${IDENTITIES[twice].name}`;
  for (const t of teams) {
    if (REL[t.rel]?.family && (_player(t.a)?.rrRomance || _player(t.b)?.rrRomance)) return `${t.a} and ${t.b} are family: no romance between them`;
  }
  return null;
}

function _options(config = seasonConfig) {
  return { ...DEFAULT_OPTIONS,
    // a Surprise twists switch, as on The Circle: off means only what's booked happens (spec §2)
    surprises: config?.rrSurprises !== false,
    nonElimShare: Number.isFinite(Number(config?.rrNonElimShare)) && config?.rrNonElimShare !== '' && config?.rrNonElimShare != null
      ? Math.min(0.6, Math.max(0, Number(config.rrNonElimShare))) : DEFAULT_OPTIONS.nonElimShare };
}

/** The legs this cast makes (the Season Timeline reads this): { n, kind } per leg, the finale last. */
export function raceSeasonShape(list = _list(), config = seasonConfig) {
  return raceShapeFor(raceTeams(list, config).length, config);
}
/** The legs a race of `n` teams makes, for a screen that only knows the cast size (Quick Setup's blueprint). */
export function raceShapeFor(n, config = seasonConfig) {
  if (!(n >= 3)) return [];
  try { return buildSchedule({ teams: n, options: _options(config), seed: gs?.rr?.seed || 1 }).map(l => ({ n: l.n, kind: l.kind })); }
  catch { return []; }
}

const VERB = { last: 'eliminated', 'on-location': 'eliminated on the road', medevac: 'left on a medevac', quit: 'quit',
  boomerang: 'eliminated', mid: 'cut at the midpoint' };
const segOf = s => ({ kind: s.kind, ending: s.ending ?? null, stretch: s.stretch ?? null, t: s.t ?? 0, teams: [...(s.teams || [])],
  lines: (s.lines || []).map(l => ({ ...l })), lineId: s.lineId || null });

/** The run tab's rows, one per leg, from a played and aired race. */
export function raceRows(result, eps) {
  const { state } = result;
  const team = id => state.teams[id];
  const label = id => (team(id) ? team(id).name : id);
  const out = new Set();
  const rows = [];
  for (const [i, leg] of result.legs.entries()) {
    const ep = eps[i] || { segments: [] };
    for (const id of leg.eliminated || []) out.add(id);
    const exits = (leg.eliminated || []).flatMap(id => [team(id)?.a, team(id)?.b].filter(Boolean)
      .map(name => ({ name, verb: VERB[leg.how?.[id]] || 'eliminated', channel: leg.how?.[id] || 'last', team: label(id) })));
    const final = leg.kind === 'final';
    const winner = final ? result.winner : null;
    rows.push({
      format: RACE_FORMAT, num: leg.n, exits, eliminated: exits[0]?.name || null,
      votes: {}, votingLog: [],
      ...(final && winner ? { winner: `${team(winner).a} & ${team(winner).b}` } : {}),
      rr: {
        leg: leg.n, place: leg.place, placeName: leg.placeName || PLACES[leg.place]?.name || null, kind: leg.kind,
        twist: leg.twist || null,
        order: (leg.order || []).map((id, k) => ({ team: id, name: label(id), a: team(id)?.a, b: team(id)?.b, place: k + 1 })),
        eliminated: [...(leg.eliminated || [])], how: { ...(leg.how || {}) },
        // the racers still in after this leg
        people: state.order.filter(id => !out.has(id)).flatMap(id => [team(id).a, team(id).b]),
        aired: { previously: ep.previously ? { lines: ep.previously.lines.map(l => ({ ...l })) } : null,
          segments: (ep.segments || []).map(segOf) },
        ...(final ? { final: { winner, winners: winner ? [team(winner).a, team(winner).b] : [], order: [...(result.final?.order || leg.order || [])] } } : {}),
      },
    });
  }
  return rows;
}

function _inputs() { return { teams: raceTeams(), options: _options() }; }
const _sig = inputs => JSON.stringify(inputs);
const _fingerprint = r => JSON.stringify([r?.num, (r?.rr?.order || []).map(o => o.team), r?.rr?.eliminated || []]);
function _firstChanged(aired, rows) {
  for (let i = 0; i < aired.length; i++) if (_fingerprint(aired[i]) !== _fingerprint(rows[i])) return aired[i].num;
  return null;
}

function _build(inputs, rerolls = {}) {
  _lastRefusal = null;
  const problem = raceCastProblem();
  if (problem) { _refuse(problem); return null; }
  const cast = inputs.teams.flatMap(t => [t.a, t.b]);
  const people = _list().filter(p => cast.includes(p.name));
  // the franchise as it stood when this race was first built: a rebuild reuses it, so a season never reads its own
  // record (written when its last leg airs)
  const carried = gs?.rr?.startOf?.carried || carriedFor(people, seasonConfig || {});
  const seed = _seed();
  const outer = gs;
  let result, eps, inner, record = null;
  try {
    result = playRaceSeason({ teams: inputs.teams, options: { ...inputs.options, rerolls }, seed, carried });
    eps = airSeason(result);
    inner = gs;
    try {
      record = rrLedgerRecord(result.state, result, { seasonName: seasonConfig?.name || null,
        archetypeOf: n => _player(n)?.archetype || null, popularity: inner.popularity || {} });
    } catch (e) { console.warn('Ridonculous Race ledger record failed:', e); record = null; }
  } finally { setGs(outer); }
  return { seed, rows: raceRows(result, eps), inner, teams: inputs.teams, winner: result.winner, record, startOf: { carried } };
}

function _commit(built, inputs, airedCount, rerolls = {}) {
  gs.rr = { seed: built.seed, teams: built.teams.map(t => ({ ...t })), winner: built.winner || null, rerolls: { ...rerolls },
    built: _sig(inputs), record: built.record || null, startOf: built.startOf || null };
  gs._rrQueue = built.rows.slice(airedCount);
  gs.relationshipDimensions = built.inner.relationshipDimensions || {};
  gs.bonds = built.inner.bonds || {};
  gs.perceivedBonds = built.inner.perceivedBonds || {};
  gs.popularity = built.inner.popularity || {};
}

let _lastNotice = null;
/** A change the run could not apply to what already aired, in words, or null. */
export function racePendingChange() { return _lastNotice; }

function _refreshQueue() {
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === RACE_FORMAT);
  const inputs = _inputs();
  const rerolls = { ...(gs.rr?.rerolls || {}) };
  if (Array.isArray(gs._rrQueue) && (gs.rr?.built === _sig(inputs) || gs.rr?.deferred === _sig(inputs))) return true;
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(aired, built.rows);
  if (changed == null) { _lastNotice = null; _commit(built, inputs, aired.length, rerolls); return true; }
  // a change that would rewrite a leg already aired waits; the race keeps the setup it was built with
  _lastNotice = `That change affects leg ${changed}, which has already aired. Re-run leg ${changed} to race it with the change.`;
  if (!Array.isArray(gs._rrQueue)) {
    const asBuilt = gs.rr?.built ? JSON.parse(gs.rr.built) : inputs;
    const again = _build(asBuilt, rerolls);
    if (!again) return false;
    _commit(again, asBuilt, aired.length, rerolls);
  }
  gs.rr.deferred = _sig(inputs);
  return true;
}

/** Air the next leg, or null when the race is over (or cannot start). */
export function simulateRaceEpisode() {
  if (!gs) return null;
  if (!_refreshQueue()) return null;
  const row = gs._rrQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.rr?.people || [])];
  gs.episode = row.num;
  gs.phase = gs._rrQueue.length ? 'race' : 'complete';
  if (!gs._rrQueue.length) {
    gs.rrWinners = [...(row.rr?.final?.winners || [])];
    // the race is over: what it leaves the franchise goes on the ledger, where the next season of any show reads it
    try {
      const num = Number(gs.seasonNumber || seasonConfig?.seasonNumber);
      if (gs.rr?.record && num && recordBuiltSeason(gs.rr.record, num)) {
        if (typeof window !== 'undefined') window.persistFranchiseLedger?.();
      }
    } catch (e) { console.warn('Franchise ledger record failed:', e); }
  }
  // what the run tab shows when this leg is reviewed later: who was in after it, not who is in now
  row.gsSnapshot = typeof window !== 'undefined' && window.snapshotGameState
    ? window.snapshotGameState()
    : { initialized: true, activePlayers: [...gs.activePlayers], episode: gs.episode, phase: gs.phase };
  return row;
}

export function raceEpisodesLeft() { return Array.isArray(gs?._rrQueue) ? gs._rrQueue.length : null; }

/** The Season Timeline's tiles: one per leg, with how many racers are still in. */
export function raceEpisodeMap() {
  const aired = new Map((gs?.episodeHistory || []).filter(r => r?.format === RACE_FORMAT).map(r => [r.num, r]));
  let n = raceTeams().length * 2;
  return raceSeasonShape().map(d => {
    const row = aired.get(d.n);
    if (row?.rr?.people) n = row.rr.people.length;
    else if (d.kind === 'elim') n = Math.max(0, n - 2);
    return { ep: d.n, active: n, phase: d.kind === 'final' ? 'finale' : 'main', engineType: null, tribes: 1,
      double: false, nonElim: d.kind === 'non' };
  });
}

// The race the run tab built, played again in this page for the stepped viewer (js/vp-rr-ep/vp.js): the same teams,
// seed, options and franchise history give the same race, so every screen is the leg that aired. Kept in memory,
// never in gs (an engine state is megabytes); rebuilt when the race is rebuilt.
let _played = null;
export function racePlayed() {
  const r = gs?.rr;
  if (!r?.teams?.length || !r.seed) return null;
  const sig = `${r.seed}|${r.built || ''}|${JSON.stringify(r.rerolls || {})}`;
  if (_played?.sig === sig) return _played;
  let options = {};
  try { options = r.built ? JSON.parse(r.built).options || {} : {}; } catch { options = {}; }
  const outer = gs;
  try {
    const res = playRaceSeason({ teams: r.teams.map(t => ({ ...t })), seed: r.seed, options: { ...options, rerolls: { ...(r.rerolls || {}) } }, carried: r.startOf?.carried || null });
    _played = { sig, res, eps: airSeason(res) };
  } finally { setGs(outer); }
  return _played;
}

/** A race with a seed can re-run any leg: every leg draws from its own stream. */
export function raceCanRerun() { return !!gs?.rr?.seed; }

/** Re-run leg N: its dice turn once more (and it takes any setup change); every earlier leg stays exactly as it
 *  aired; the later ones are cleared, to be simulated again. */
export function rerunRaceEpisode(epNum) {
  _lastRefusal = null;
  if (!gs?.rr?.seed) return _refuse('this season has no stored seed, so the legs that already aired could not be reproduced');
  const N = Math.max(1, Number(epNum) || 1);
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === RACE_FORMAT);
  const prefix = aired.filter(r => r.num < N);
  const inputs = _inputs();
  const rerolls = { ...(gs.rr.rerolls || {}), [N]: ((gs.rr.rerolls || {})[N] || 0) + 1 };
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(prefix, built.rows);
  if (changed != null) return _refuse(`a change to the setup affects leg ${changed}, which comes before leg ${N}. Re-run leg ${changed} instead`);
  if (!built.rows.some(r => r.num === N)) return _refuse(`the race has no leg ${N}`);
  gs.episodeHistory = [...(gs.episodeHistory || []).filter(r => !(r && r.format === RACE_FORMAT && r.num >= N))];
  _commit(built, inputs, prefix.length, rerolls);
  _lastNotice = null;
  delete gs.rrWinners;
  gs.phase = 'race';
  const last = prefix[prefix.length - 1];
  gs.activePlayers = last ? [...(last.rr?.people || [])] : [];
  gs.episode = last ? last.num : 0;
  return true;
}

/** How the leg went, for the hub's corner: who won it, who came last, and where. */
export function raceVoteShape(row) {
  const r = row?.rr;
  if (!r) return '';
  const first = r.order?.[0]?.name;
  if (r.final) return `${row.winner || first} won The Ridonculous Race${r.placeName ? ` in ${r.placeName}` : ''}`;
  const last = r.order?.at(-1)?.name;
  const where = r.placeName ? ` · ${r.placeName}` : '';
  if (r.kind === 'non') return `${first} came first · ${last} came last, but it was a non-elimination leg${where}`;
  const out = r.eliminated?.length ? row.exits.find(x => x.channel !== 'last')?.verb : null;
  return `${first} came first · ${last} ${out && out !== 'eliminated' ? out : 'came last and went home'}${where}`;
}

/** The Pairs view's pickers (cast-room.js): the relationships and identities a team can have. */
export function raceTeamOptions() { return { rels: RACE_RELATIONSHIPS, ids: RACE_IDENTITIES, types: RACE_TASK_TYPES }; }
/** What a team can be good or bad at, in words (a custom identity's strengths and weaknesses). */
export const RACE_TASK_TYPES = Object.keys(TASK_TYPES).map(id => ({ id, label: { water: 'Water', heights: 'Heights', strength: 'Strength',
  stomach: 'Eating anything', nerve: 'Nerve', brains: 'Brains', search: 'Finding things', perform: 'Performing', people: 'People',
  travel: 'Getting around', hands: 'Hands-on', patience: 'Patience' }[id] || id }));

/** The team fields the Pairs view sets, on both of the team's cards (so the team reads the same either way round). */
const TEAM_FIELDS = new Set(['rrRel', 'rrIdentity', 'rrCustomName', 'rrCustomLike', 'rrCustomLike2', 'rrCustomLike3',
  'rrCustomGood1', 'rrCustomGood2', 'rrCustomBad1', 'rrCustomBad2', 'rrTeamName']);
export function raceSetTeam(a, b, field, value) {
  if (!TEAM_FIELDS.has(field)) return false;
  const v = typeof value === 'string' ? value.trim() : value;
  for (const n of [a, b]) {
    const p = _player(n);
    if (!p) continue;
    if (v === '' || v == null) delete p[field]; else p[field] = v;
  }
  return true;
}

if (typeof window !== 'undefined') window._rrRunnable = true;


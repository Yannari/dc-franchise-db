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
import { gs, setGs, players, seasonConfig, seasonFormat, TWIST_CATALOG } from './core.js';
import { CHALLENGE_FORMAT, SHOWS } from './shows.js';
import { dealUnseen, noteShown, rerollKey } from './seen-episodes.js';
import { playChallengeSeason, liveTwists, pairsFinal } from './ch/season.js';
import { airSeason } from './ch/story/director.js';
import { buildSchedule } from './ch/schedule.js';
import { DEFAULT_OPTIONS } from './ch/format.js';
import { DAILIES } from './ch/dailies.js';
import { airedOf } from './ch/transcript.js';
import { chLedgerRecord } from './ch/ledger-record.js';
import { carriedFor } from './franchise-carry.js';
import { INTRO } from './ch/script/lines/intro.js';
import { voicedLine } from './ch/script/write.js';
import { stableRng } from './script/rng.js';
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
  // the cards booked on the Season Timeline (core.js, THE CHALLENGE'S TWISTS): one episode each. The season's
  // rules (the Tribunal, skulls or rings, Redemption House) are the setup panel's switches below.
  const episodeTwists = {};
  for (const b of config?.twistSchedule || []) {
    const card = TWIST_CATALOG.find(t => t.id === (b?.type || b?.id) && t.format === CHALLENGE_FORMAT);
    const ep = Number(b?.episode);
    if (card?.chTwist && ep >= 1 && !episodeTwists[ep]) episodeTwists[ep] = card.chTwist;
  }
  // the daily pinned on each episode's tile (run-ui.js _chDailyPicker)
  const dailyPins = {};
  for (const p of config?.chDailySchedule || []) {
    const ep = Number(p?.episode);
    if (ep >= 1 && DAILIES.some(d => d.id === p.dailyId)) dailyPins[ep] = p.dailyId;
  }
  return {
    dailyPins,
    gendered: config?.chGenderBlind !== true,
    finalists: [6, 8, 10].includes(Number(config?.chFinalists)) ? Number(config.chFinalists) : DEFAULT_OPTIONS.finalists,
    partyNights: config?.chPartyNights !== false,
    // Its own switch: the season-wide Romance select is Total Drama's.
    romance: config?.chRomance !== false,
    partnerWeeks: config?.chPartnerWeeks !== false,
    // the season's rules: the open house vote, or the Tribunal (format.js)
    format: config?.chFormat === 'tribunal' && config?.chMode !== 'teams' ? 'tribunal' : 'vote-callout',   // a Teams season votes by team
    // the twists (stakes.js, redemption.js): a skull or ring to run the final, Redemption House
    finalPass: ['skull', 'ring'].includes(config?.chPass) ? config.chPass : null,
    redemption: config?.chRedemption === true,
    redemptionFrom: 1,
    episodeTwists,
    // a Pairs season (js/ch/pairs.js): how the pairs are made, their shape, how many run the final, and the pairs
    // set by hand on the cast cards (two cards that name each other)
    pairs: config?.chMode === 'pairs' ? {
      pairing: ['rivals', 'ties', 'fresh-meat', 'pick', 'custom'].includes(config.chPairing) ? config.chPairing : 'rivals',
      shape: config.chPairShape === 'same' && config.chGenderBlind !== true ? 'same' : 'mixed',
      finalPairs: [2, 3, 4].includes(Number(config.chFinalPairs)) ? Number(config.chFinalPairs) : null,
      pins: partnerPins(),
    } : null,
    // a Teams season (js/ch/teams.js): how the teams are made, how many, and how they end
    teams: config?.chMode === 'teams' ? {
      teaming: ['shows', 'champions', 'vets', 'draft', 'custom'].includes(config.chTeaming) ? config.chTeaming : 'shows',
      count: config.chTeamCount === 'small' ? 'small' : 2,
      end: config.chTeamEnd === 'team-final' ? 'team-final' : 'breakup',
      // custom: the teams built in the Casting Room's Teams view (each player's team is their card's tribe field)
      ...(config.chTeaming === 'custom' ? { custom: customTeams(config) } : {}),
    } : null,
  };
}

/**
 * A custom Teams season's teams, as built in the Casting Room's Teams view (cast-room.js): each player's team is their
 * card's tribe field, the order and names are the Season Setup's tribes, then any other name a card carries.
 */
export function customTeams(config = seasonConfig, list = players || []) {
  const names = [...new Set([...(config?.tribes || []).map(t => t.name), ...(list || []).map(p => p?.tribe).filter(Boolean)])];
  return names.map(name => ({ name, members: (list || []).filter(p => p?.name && p.tribe === name).map(p => p.name) }));
}

/** The partners set on the cast cards (`chPartner`): only two cards that name each other count. */
export function partnerPins(list = players || []) {
  const named = Object.fromEntries((list || []).filter(p => p?.name && p.chPartner).map(p => [p.name, p.chPartner]));
  const out = {};
  for (const [a, b] of Object.entries(named)) if (named[b] === a && a !== b) out[a] = b;
  return out;
}

/** The setup panel: the pair controls only in a Pairs season, and the solo-only ones hidden in one. */
export function chModeUI() {
  if (typeof document === 'undefined') return;
  const g = id => document.getElementById(id);
  const pairs = g('cfg-ch-mode')?.value === 'pairs';
  const teams = g('cfg-ch-mode')?.value === 'teams';
  const show = (id, on) => { const el = g(id); if (el) el.style.display = on ? '' : 'none'; };
  show('grp-ch-pairs', pairs);
  show('grp-ch-teams', teams);
  show('grp-ch-pair-shape', pairs && !g('cfg-ch-gender-blind')?.checked);
  show('grp-ch-finalists', !pairs);
  // a Teams season plays its dailies as teams and has no Redemption House (season.js)
  show('grp-ch-partner-weeks', !pairs && !teams);
  show('grp-ch-redemption', !pairs && !teams);
  // ...and votes as a team, never the house or the Tribunal (teams.js teamVoteNight)
  show('grp-ch-format', !teams);
}

/** The cast card's Partner list: everybody else in the cast. */
export function chPartnerNames(self = null) {
  if (typeof document === 'undefined') return;
  const dl = document.getElementById('ch-partner-names');
  if (!dl) return;
  dl.innerHTML = (players || []).filter(p => p?.name && p.name !== self).map(p => `<option value="${String(p.name).replace(/"/g, '&quot;')}"></option>`).join('');
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
      // a past winner of any show on the ledger (a Teams season's Champions, js/ch/teams.js)
      champion: known && (() => { try { return !!careerFor(n)?.seasons?.some(x => x.winner); } catch { return false; } })(),
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
  if (opts.pairs) return pairsCastProblem(cast, setup, opts, genderOf);
  if (opts.teams?.teaming === 'custom') {
    const teams = (opts.teams.custom || []).map(t => ({ ...t, members: t.members.filter(n => cast.includes(n)) })).filter(t => t.members.length);
    if (teams.length < 2 || teams.some(t => t.members.length < 2)) return 'custom teams need at least two teams of two or more (Cast › Casting Room › Teams)';
    const placed = new Set(teams.flatMap(t => t.members));
    const off = cast.filter(n => !placed.has(n));
    if (off.length) return `${off.length === 1 ? `${off[0]} is` : `${off.slice(0, 3).join(', ')}${off.length > 3 ? ` and ${off.length - 3} more` : ''} are`} on no team (Cast › Casting Room › Teams)`;
  }
  if (cast.length < opts.finalists + 2) return `a season needs more players than finalists: ${cast.length} players, ${opts.finalists} into the final`;
  if (opts.gendered) {
    const div = challengeDivisions(cast, setup, genderOf);
    const m = cast.filter(n => div[n] === 'm').length, f = cast.filter(n => div[n] === 'f').length;
    const open = cast.length - m - f;
    if (Math.min(m, f) + open < 3) return "a gendered season needs at least three players in each division (or make it gender-blind)";
  }
  return null;
}

// A Pairs season's cast: an even number, the shape's split (as many men as women for a man and a woman; an even
// number of each for men's and women's pairs), and for Fresh Meat a rookie for every vet, across the divisions.
function pairsCastProblem(cast, setup, opts, genderOf) {
  const final = pairsFinal({ ...DEFAULT_OPTIONS, ...opts });
  if (cast.length % 2) return `a Pairs season needs an even number of players: ${cast.length} now`;
  if (cast.length / 2 < final + 2) return `a Pairs season needs more pairs than the final: ${cast.length / 2} pairs, ${final} into the final`;
  const div = challengeDivisions(cast, setup, genderOf);
  const m = cast.filter(n => div[n] === 'm').length, f = cast.filter(n => div[n] === 'f').length, open = cast.length - m - f;
  if (opts.gendered && opts.pairs.shape === 'mixed' && Math.abs(m - f) > open) return `pairs of a man and a woman need as many men as women: ${m} men, ${f} women`;
  if (opts.gendered && opts.pairs.shape === 'same' && (m % 2 || f % 2) && !open) return `men's and women's pairs need an even number of each: ${m} men, ${f} women`;
  if (opts.pairs.pairing === 'custom') {
    // every player in a pair set by hand (the Casting Room's Pairs view writes the cards' partners), and in the shape
    const pins = opts.pairs.pins || {};
    const off = cast.filter(n => !pins[n] || !cast.includes(pins[n]));
    if (off.length) return `custom pairs: ${off.slice(0, 3).join(', ')}${off.length > 3 ? ` and ${off.length - 3} more` : ''} still need a partner (Cast › Casting Room › Pairs)`;
    if (opts.gendered) for (const n of cast) {
      const o = pins[n];
      if (n > o || !div[n] || !div[o]) continue;
      if (opts.pairs.shape === 'mixed' && div[n] === div[o]) return `${n} and ${o} are a pair, but this season's pairs are a man and a woman`;
      if (opts.pairs.shape === 'same' && div[n] !== div[o]) return `${n} and ${o} are a pair, but this season's pairs are men's and women's pairs`;
    }
  }
  if (opts.pairs.pairing === 'fresh-meat') {
    const bg = challengeBackground(cast, setup);
    const rookies = cast.filter(n => bg[n]?.rookie).length;
    if (rookies !== cast.length - rookies) return `Fresh Meat pairs every vet with a rookie: ${cast.length - rookies} vets, ${rookies} rookies (set "Billed as" on the Cast cards)`;
    if (opts.gendered && opts.pairs.shape === 'mixed') {
      const vm = cast.filter(n => div[n] === 'm' && !bg[n]?.rookie).length, rf = cast.filter(n => div[n] === 'f' && bg[n]?.rookie).length;
      if (vm !== rf) return `Fresh Meat pairs a vet with a rookie of the other gender: ${vm} vet men for ${rf} rookie women`;
    }
  }
  return null;
}

/** The episodes this cast and these options make (the Season Timeline reads this). */
export function challengeSeasonShape(cast = _cast(), config = seasonConfig) {
  const opts = { ...DEFAULT_OPTIONS, ...challengeOptions(config) };
  const final = pairsFinal(opts);
  try {
    if (final) return buildSchedule({ pairs: true, total: Math.floor(cast.length / 2), finalists: final, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered, twists: liveTwists(opts) });
    return buildSchedule({ total: cast.length, finalists: opts.finalists, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered, twists: liveTwists(opts) });
  }
  catch { return []; }
}

const VERB = { arena: 'eliminated', quit: 'quit', medical: 'left on a medical', disqualified: 'disqualified', instant: 'eliminated', purge: 'purged',
  // a Pairs season: went home because their partner did (exits.js)
  'partner-left': 'went home with their partner' };

// Who they are, for the premiere's introductions (js/vp-ch-ep: a package per player as they come off the
// plane): their show, vet or rookie, the authored facts, and for a veteran the career the franchise
// ledger holds. Recorded when the season is built, so a rewatch shows the career as it stood then.
const atHomeFact = at => (!at ? null : at.stage === 'married' ? `Married to ${at.name}` : at.stage === 'engaged' ? `Engaged to ${at.name}`
  : at.stage === 'living-together' ? `Lives with ${at.name}` : `Dating ${at.name}`);
function introOf(n, state, cast) {
  const p = _player(n) || {};
  // the first sentence that says something about them (not the date they were born), at most two
  const first = t => {
    const all = String(t || '').match(/[^.!?]+[.!?]+/g) || [];
    const good = all.map(x => x.trim()).filter(x => x.length > 30 && !/\bborn (on|in)\b|\bwas born\b/i.test(x));
    const pick = good[0] || all[0]?.trim() || '';
    return pick ? (pick.length > 260 ? pick.slice(0, 257).replace(/\s+\S*$/, '') + '...' : pick) : null;
  };
  // a tagline from their authored character, never demographics ("23, Latino, straight")
  const tagOf = v => { const m = String(v || '').match(/^[^.!?]{3,60}[.!?]/); const t = m ? m[0].replace(/[.!?]$/, '') : null; return t && !/\d|\b(straight|gay|bi|latino|latina|black|white|asian)\b/i.test(t) ? t : null; };
  let career = [], badges = [], rival = null;
  try {
    career = careerOf(n).slice(-5).map(c => ({ where: c.where, format: c.format || 'total-drama', place: c.rec?.placement || 0, total: c.total || null,
      winner: !!c.rec?.winner, finalist: !!c.rec?.finalist, wins: c.rec?.chalWins || c.rec?.dailyWins || 0 }));
    const cf = careerFor(n);
    badges = (cf?.badges || []).slice(0, 3);
    rival = Object.entries(cf?.rivals || {}).filter(([r]) => r !== n && cast.includes(r)).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
  } catch { /* no ledger yet */ }
  const info = { origin: state.origin?.[n] || null, rookie: !!state.rookie?.[n], age: p.age || null, hometown: p.hometown || null,
    occupation: p.occupation && p.occupation !== 'None' ? p.occupation : null, story: first(p.backstory || p.descriptor), tag: tagOf(p.voice), career, badges, rival,
    // a partner at home (life events), on the card: the house was told on day one, and so is the viewer
    atHome: atHomeFact(state.atHome?.[n]) };
  info.lines = introLines(n, info, state);
  return info;
}

// What they say to the camera as they arrive (ch/script/lines/intro.js): who they are and their show,
// what happened there, a word about home, and a rival in the house. In their own voice.
const _ord = k => { const s = ['th', 'st', 'nd', 'rd'], v = k % 100; return k + (s[(v - 20) % 10] || s[v] || s[0]); };
function introLines(n, info, state) {
  const ledger = (state._introLedger ||= { vday: {}, vby: {} });
  const rng = stableRng(state.seed || 1, 'intro', n);
  const show = SHOWS[info.origin]?.name || null;
  const best = [...info.career].sort((x, y) => (y.winner - x.winner) || (y.finalist - x.finalist) || ((x.place || 99) - (y.place || 99)))[0] || null;
  const last = info.career[info.career.length - 1] || null;
  let key, slots = { show, rival: info.rival, job: info.occupation ? info.occupation.toLowerCase() : null, home: info.hometown };
  if (best?.winner) { key = 'champ'; slots.where = best.where; }
  else if (best?.finalist) { key = 'finalist'; slots.where = best.where; }
  else if (last?.place) { key = last.total && last.place > last.total * .66 ? 'early' : 'placed'; slots.where = last.where; slots.place = _ord(last.place); }
  else if (info.origin === CHALLENGE_FORMAT) key = info.rookie ? 'rookie' : 'vetHome';
  else if (!info.rookie && show) key = 'vet';
  else if (show) key = 'rookieShow';
  else key = 'rookie';
  // nobody says the same introduction twice: each line is said once across the cast
  const used = (state._introUsed ||= new Set());
  const say = k => {
    const list = [...(INTRO[k] || [])];
    const start = Math.floor(rng() * Math.max(1, list.length));
    for (let i = 0; i < list.length; i++) {
      const turn = list[(start + i) % list.length];
      const text = voicedLine(turn, n, { rng, ledger, day: 0 }).text;
      if (/\{(\w+)\}/.test(text.replace(/\{(\w+)\}/g, (m, s) => (slots[s] ? '' : m)))) continue;
      const out = text.replace(/\{(\w+)\}/g, (m, s) => slots[s] ?? m);
      if (used.has(text)) continue;   // the line itself, before the names go in
      used.add(text);
      return out;
    }
    return null;
  };
  const out = [say(key) || say('any')];
  if (info.rookie && slots.job) out.push(say('job'));
  else if (info.rookie && slots.home) out.push(say('home'));
  if (info.rival) out.push(say('rival'));
  return out.filter(Boolean);
}

// The daily as it was played, for the stepped viewer: the units in finishing order (best first).
function dailyOf(d) {
  if (!d) return null;
  const sc = d.scores || {};
  const unit = u => u.reduce((a, n) => a + (sc[n] || 0), 0) / Math.max(1, u.length);
  // a team daily played alone is decided on average place (dailies.js tally): its order is the tally's
  const order = d.tally ? d.tally.map(t => [...t.members]) : [...(d.units || [])].sort((a, b) => unit(b) - unit(a)).map(u => [...u]);
  return { id: d.id, name: d.name, mode: d.mode, order,
    tally: d.tally ? d.tally.map(t => ({ members: [...t.members], avg: t.avg, best: t.best, heats: [...(t.heats || [])] })) : null, winners: [...(d.winners || [])], last: [...(d.last || [])],
    throws: (d.throws || []).map(t => t.name || t), caught: (d.caught || []).map(c => ({ thrower: c.thrower, by: c.by })),
    moments: (d.moments || []).map(m => ({ kind: m.kind, who: m.who })), injuries: [...(d.injuries || [])],
    scores: Object.fromEntries(Object.entries(sc).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    // a played daily's moments, in order (ch/daily/): the viewer shows each one
    beats: d.beats ? d.beats.map(b => ({ ...b, who: [...b.who], data: JSON.parse(JSON.stringify(b.data || {})) })) : null };
}
// An Arena game (or a final's instant elimination) as it was played.
// A Pairs season's duel is two on two: both pairs, who won and lost each beat for their side (pairs.js playPairDuel).
const duelOf = d => ({ game: d.game, name: d.gameName || d.game, kind: d.kind || null, a: d.a, b: d.b, winner: d.winner, loser: d.loser,
  upset: !!d.upset, comeback: !!d.comeback, volunteer: !!d.volunteer, beats: (d.beats || []).map(b => ({ ...b, score: b.score ? { ...b.score } : undefined })),
  ...(d.pairs ? { pairs: true, pairA: [...d.pairA], pairB: [...d.pairB], winners: [...d.winners], losers: [...d.losers], swap: d.swap ? { ...d.swap } : null } : {}) });
// The final as it was run: checkpoints, the instant eliminations, the overnight.
function finalOf(f) {
  if (!f) return {};
  // every checkpoint as it was run, beat by beat, with its order, points and standings (the viewer plays them)
  const copy = o => JSON.parse(JSON.stringify(o ?? null));
  return { finalists: [...(f.finalists || [])], checkpoints: (f.checkpoints || []).map(c => copy(c)),
    instant: (f.instant || []).map(duelOf), overnight: (f.overnight || []).map(o => ({ ...o })),
    sabotage: (f.sabotage || []).map(x => ({ ...x })), help: (f.help || []).map(x => ({ ...x })), totals: { ...(f.totals || {}) },
    podium: copy(f.podium || {}), lastWords: [...(f.lastWords || [])],
    // a Pairs season: the pairs in finishing order, their averages, and what each chooser did with the money
    ...(f.pairPodium ? { pairPodium: copy(f.pairPodium), pairTotals: { ...(f.pairTotals || {}) }, choices: copy(f.choices || []) } : {}) };
}

/** The run tab's rows, one per episode and one for the final, from a played and aired season. */
export function challengeRows(result) {
  const { state } = result;
  const cast = state.cast;
  const goneEp = Object.fromEntries(state.gone.map(g => [g.name, g.ep]));
  // a player who came back in a return (ep-twists.js): out from the episode they lost until the one they won
  const away = state.returnedFrom || [];
  const awayAfter = (n, ep) => away.some(r => r.name === n && r.ep <= ep && ep < r.back);
  const moneyAt = ep => (state.moneyLog || []).filter(m => m.ep === ep).map(m => ({ ...m }));
  const peopleAfter = ep => cast.filter(n => !(goneEp[n] <= ep) && !awayAfter(n, ep) && !(state.arrivedAt?.[n] > ep));
  const exitsAt = ep => [...state.gone, ...away].filter(g => g.ep === ep).map(g => ({ name: g.name, verb: VERB[g.how] || 'eliminated', channel: g.how, by: g.by || null }));
  // Who was in the house when episode `ep` began (a returning player counts on the night they come back).
  const castAt = ep => cast.filter(n => !(goneEp[n] < ep) && !away.some(r => r.name === n && r.ep < ep && ep < r.back) && !(state.arrivedAt?.[n] > ep));
  // a ballot's plan, by name: 'alliance:3' is the group called The Riptide (Intel's Votes)
  const alName = id => state.alliances.find(a => String(a.id) === String(id))?.name || null;
  const viaName = v => (!v ? null : /^(alliance|recruited):/.test(v) ? `${v.split(':')[0]}:${alName(v.split(':')[1]) || ''}` : v);
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
        // tonight's one-episode twist (ep-twists.js)
        twist: e.twist || null, purged: e.purged || null, returnArena: e.returnArena ? { ...e.returnArena } : null,
        callouts: (e.callouts || []).map(c => ({ by: c.by, opponent: c.opponent, reason: c.reason, promise: c.promise || null, promisedAt: c.promisedAt || null, ranked: c.ranked || null,
          ...(c.pair ? { pair: true, decider: c.decider, about: c.about, agreed: !!c.agreed, overruled: c.overruled || null } : {}) })),
        arena: (e.arena || []).map(d => ({ winner: d.winner, loser: d.loser, game: d.gameName || d.game || null,
          ...(d.pairs ? { winners: [...d.winners], losers: [...d.losers] } : {}) })),
        // a Pairs season: the pairs as the week began and as it ended (a swap changes them), from Intel's snapshots
        // (the premiere makes its pairs after the week began: its start is its end)
        pairs: (e.intel?.start?.pairs || e.intel?.end?.pairs) ? { start: (e.intel.start?.pairs || e.intel.end.pairs).map(p => [p.a, p.b]), end: (e.intel.end?.pairs || []).map(p => [p.a, p.b]), swap: e.swap || null } : null,
        // a Teams season: the teams as the week began and ended (the premiere's are its own list), who switched or
        // folded, and the week the teams broke up (teams.js)
        teams: (e.intel?.start?.teams || e.teams || e.intel?.end?.teams) ? {
          start: (e.intel?.start?.teams || e.teams || e.intel.end.teams).map(t => ({ name: t.name, captain: t.captain || null, members: [...t.members] })),
          end: (e.intel?.end?.teams || []).map(t => ({ name: t.name, captain: t.captain || null, members: [...t.members] })),
          switches: (e.switches || []).map(x => ({ ...x })), folds: (e.folds || []).map(x => ({ ...x })) } : null,
        teamsBroken: !!e.teamsBroken,
        // the bank's movements this episode, and why (stakes.js credit): the Intel's Money tab
        money: moneyAt(e.ep),
        aired: airedOf(e),
        // What the stepped viewer stages (js/vp-ch-ep): the house at the start, the daily as it was
        // played, every ballot with what the voter wanted, was asked and told, and each Arena game.
        house: castAt(e.ep),
        daily: dailyOf(e.daily),
        votes: (e.votes || []).map(v => ({ votedIn: v.votedIn, tally: { ...(v.tally || {}) }, tied: !!v.tied, tiebreak: v.tiebreak || null,
          ...(v.team ? { team: v.team, ...(v.winners ? { winners: true } : {}) } : {}),
          ballots: (v.ballots || []).map(b => ({ voter: b.voter, target: b.target, wanted: b.wanted || null, asked: b.asked || null, told: b.told || null, why: b.why || null, flip: !!b.flip,
            ...(b.pair ? { pair: [...b.pair], named: b.named || b.target } : {}),
            // what drove a vote that was the voter's own (vote.js reasonOf), whose plan it was, and how they stood (Intel's Votes)
            reason: b.reason || null, via: viaName(b.via), bond: b.bond ?? null })) })),
        duels: (e.arena || []).map(duelOf),
        // TJ's power rankings this episode, the whole house (stakes.js): the viewer's side panel
        rankings: (e.rankings || []).map(r => ({ n: r.n, rank: r.rank, was: r.was ?? null })),
        ties: e.ties || {},
        intel: e.intel || null,
        meetings: (e.delib?.meetings || []).map(m => ({ name: m.name || null, organiser: m.organiser, target: m.target, responses: { ...(m.responses || {}) } })),
        tribunal: (() => { const t = (e.votes || []).find(v => v.tribunal)?.tribunal; return t ? { tribunal: [...t.tribunal], nominees: [...t.nominees], picks: { ...t.picks }, chosen: t.chosen, split: !!t.split, lead: t.lead, pitches: t.pitches.map(p => ({ ...p })) } : null; })(),
        // the room worked before the vote (vote.js campaign), the recruiting, and a volunteer
        campaigns: (e.delib?.campaigns || []).map(c => ({ ...c })),
        pitches: (e.delib?.pitches || []).map(p => ({ by: p.by, to: p.to, target: p.target, answer: p.answer })),
        volunteer: e.delib?.volunteer || null,
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
      ch: { ties: result.episodes[result.episodes.length - 1]?.ties || {}, final: { champions: [...(result.champions || [])], placements: { ...(state.final?.placements || {}) },
          ...finalOf(result.final),
          // a team final (final.js finishTeams): the teams in order, the first all champions
          ...(state.final?.teamPodium ? { teamPodium: state.final.teamPodium.map((t, i) => ({ name: t.name, members: [...t.members], place: i + 1, avg: t.avg ?? null })) } : {}) },
        people: [...(result.champions || [])], house: castAt(f.ep), aired: airedOf(f), money: moneyAt(f.ep) },
    });
  }
  return rows;
}

// The conversations the last HEARD_SEASONS Challenge seasons of this franchise aired: id -> how many of them aired
// it. Read once, when a season is first built, and kept on gs.ch.startOf, so a rebuild never reads a later season.
const HEARD_SEASONS = 2;
export function heardBefore(seasons = activeSeasons(), num = Number(gs?.seasonNumber || seasonConfig?.seasonNumber) || Infinity) {
  const earlier = Object.entries(seasons || {})
    .map(([k, rec]) => ({ rec, ...seasonKeyParts(k, rec) }))
    .filter(s => s.format === CHALLENGE_FORMAT && s.num < num && Array.isArray(s.rec?.lines))
    .sort((x, y) => y.num - x.num).slice(0, HEARD_SEASONS);
  const heard = {};
  for (const s of earlier) for (const id of s.rec.lines) heard[id] = (heard[id] || 0) + 1;
  return Object.keys(heard).length ? heard : null;
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
  // A season built before this was kept has no heard list, and rebuilds without one.
  const heard = startOf ? (startOf.heard || null) : heardBefore();
  const background = startOf?.background || challengeBackground(cast, inputs.setup);
  const divisions = challengeDivisions(cast, inputs.setup);
  const seed = _seed();
  const outer = gs;
  let result, inner, record = null;
  try {
    result = playChallengeSeason({ cast, background, divisions, carried, seed, heard, options: { ...inputs.options, rerolls } });
    airSeason(result.state);
    inner = gs;
    try {
      record = chLedgerRecord(result.state, result, { seasonName: seasonConfig?.name || null,
        archetypeOf: n => _player(n)?.archetype || null, popularity: inner.popularity || {} });
    } catch (e) { console.warn('Challenge ledger record failed:', e); record = null; }
  } finally { setGs(outer); }
  return { cast, seed, rows: challengeRows(result), inner, champions: [...(result.champions || [])], record,
    startOf: { carried, background, heard } };
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
  // An episode this browser already aired (a save loaded from before it) is dealt again (seen-episodes.js).
  const key = n => rerollKey(gs.ch.seed, n, gs.ch.rerolls);
  dealUnseen(CHALLENGE_FORMAT, { next: () => gs._chQueue?.[0]?.num ?? null, keyOf: key, redeal: rerunChallengeEpisode });
  const row = gs._chQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  noteShown(CHALLENGE_FORMAT, key(row.num));
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

/** Every daily, for the Season Timeline's picker: id, name, and the shapes it plays in (solo, pairs, teams). */
export function challengeDailyList() { return DAILIES.map(d => ({ id: d.id, name: d.name, modes: [...d.modes] })); }
/** The daily each built episode drew, by episode number (aired or still queued). */
export function challengeDrawnDailies() {
  const out = new Map();
  for (const r of [...(gs?.episodeHistory || []).filter(x => x?.format === CHALLENGE_FORMAT), ...(gs?._chQueue || [])]) if (r?.ch?.daily?.name) out.set(r.num, r.ch.daily.name);
  return out;
}

/** The Season Timeline's tiles: one per episode, with how many are still in. */
export function challengeEpisodeMap() {
  // The episodes still to air come from the built queue only while it was built with the settings on screen: a
  // twist just booked (a double: 19 left, then 17) has not been played into it yet, so the plan counts those
  // (the user, 2026-10-16: "the double elimination twist doesn't update the season timeline")
  let fresh = false;
  try { fresh = !!gs?.ch?.built && gs.ch.built === _sig(_inputs()); } catch { fresh = false; }
  const rows = new Map([...(gs?.episodeHistory || []).filter(r => r?.format === CHALLENGE_FORMAT), ...(fresh ? (gs?._chQueue || []) : [])]
    .map(r => [r.num, r]));
  let n = _cast().length;
  // A Teams season's break-up, the Challenge's merge (the user, 2026-10-18: "we should have the merge badge in the
  // season timeline"): an aired episode says so itself; one still to come breaks where season.js will, on the first
  // morning the house is down to the finalists and four more. A team-final season never breaks up.
  const opts = challengeOptions();
  const breaks = !!opts.teams && opts.teams.end !== 'team-final';
  let broken = [...rows.values()].some(r => r?.ch?.teamsBroken);
  return challengeSeasonShape().map(d => {
    const row = rows.get(d.ep);
    const startN = n;
    if (row?.ch?.people) n = row.ch.people.length;
    else if (!d.final) n = Math.max(0, n - (d.plannedElims || 1));
    // a double: the season's own (two late ones on a full cast), a booked one, or one a quit made necessary
    const double = !d.final && (row ? (row.ch?.votes?.length || 0) > 1 || (row.ch?.arena?.length || 0) > 1 : (d.plannedElims || 1) > 1);
    let teamsBreak = false;
    if (breaks && row) teamsBreak = !!row.ch?.teamsBroken;
    else if (breaks && !broken && !d.final && startN <= (opts.finalists || DEFAULT_OPTIONS.finalists) + 4) { teamsBreak = true; broken = true; }
    return { ep: d.ep, active: n, phase: d.final ? 'finale' : 'main', engineType: null, tribes: 1, double, teamsBreak };
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
  if (row?.ch?.final) {
    const kept = (row.ch.final.choices || []).filter(c => c.keep && c.place === 1);
    const team = row.ch.final.teamPodium?.[0]?.name;
    return `Champions: ${team ? `${team} (` : ''}${(row.ch.final.champions || []).join(' & ')}${team ? ')' : ''}${kept.length ? ` · ${kept.map(c => `${c.chooser} kept the money`).join(', ')}` : ''}`;
  }
  const duels = row?.ch?.arena || [];
  if (!duels.length) return 'No elimination';
  // a Teams season: the team that voted, and a switch
  const voted = (row.ch.votes || []).find(v => v.team)?.team;
  const moves = (row.ch.teams?.switches || []).map(x => `${x.name} switched to ${x.to}`);
  const lead = voted ? `${voted} voted · ` : '';
  const tail = moves.length ? ` · ${moves.join(' · ')}` : '';
  return lead + duels.map(d => (d.winners ? `${d.winners.join(' & ')} beat ${d.losers.join(' & ')}` : `${d.winner} beat ${d.loser}`) + (d.game ? ` (${d.game})` : '')).join(' · ') + tail;
}

if (typeof window !== 'undefined') window._chRunnable = true;

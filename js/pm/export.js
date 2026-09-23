// ══════════════════════════════════════════════════════════════════════
// pm/export.js — a finished villa season, in the shape the site reads
// ══════════════════════════════════════════════════════════════════════
//
// Plan 6. The played rows in, the season document out: the season page, the
// articles, the rankings board, the social feed and the publish step all read
// it. PURE — no DOM, no fetch — so a test builds one from a headless season.
//
// ── THE PER-ROUND SHAPE, AND WHY IT IS NOT A NEW ONE ──────────────────
//
// The registry says this show's rounds are `ballots` (js/shows.js), and
// docs/ADDING-A-SHOW.md §5 asks for one of the two shapes the site already
// reads. So an episode is ONE `votingHistory[]` row, the way The Traitors
// exports two votes a night: every ballot carries the `channel` the engine
// wrote on it — `villa` (the islanders dumping, saving or naming a couple),
// `exes` (the dumped islanders' vote), `recoupling` and `casa` (a pick, and
// who each islander came back from Casa Amor with, stick or twist — a choice
// FOR somebody, never a vote against). The public's vote is not a
// ballot anybody cast by name, so it travels as `shares`.
//
// ── TWO DOORS, FROM THE REGISTRY ──────────────────────────────────────
//
// An islander is dumped or walks, and `exitVerbs('perfect-match')` names both.
// Every exit keeps the verb the engine wrote on it; `eliminated` is the first
// DUMPED name, because every reader of that field means "who the night
// removed" and a walk is not that.
//
// ── A COUPLE WINS ─────────────────────────────────────────────────────
//
// Both winners hold `placement: 1`, and each finalist couple shares its place,
// as the real show's own lists do. `winner` is null and `winners[]` carries
// both — the shape the readers were fixed to expect for The Traitors' shared
// pots, so a single-name block does not quietly crown half a couple.
import { SHOWS, seasonId, exitVerbs, PERFECT_MATCH_FORMAT } from '../shows.js';
import { TWIST_CATALOG } from '../core.js';
import { momentTitle } from './transcript.js';
import { CHALLENGE_NAMES } from './schedule.js';

export const PERFECT_MATCH = PERFECT_MATCH_FORMAT;
const slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const sameCouple = (c, name) => Array.isArray(c) && c.includes(name);

/** `data/seasons/pm-1-data.json` — from the registry's prefix, never a literal. */
export const seasonFilePath = n => `data/seasons/${seasonId(PERFECT_MATCH, n)}-data.json`;

// ── the rounds ─────────────────────────────────────────────────────────
function ballot(b) {
  const target = b.target || (Array.isArray(b.couple) ? b.couple.join(' & ') : null);
  return {
    voter: b.voter, voterSlug: slug(b.voter),
    target, targetSlug: target ? slug(target) : '',
    ...(Array.isArray(b.couple) ? { couple: [...b.couple] } : {}),
    ...(b.save ? { save: true } : {}),
    ...(b.choice ? { choice: b.choice } : {}),
    channel: b.channel || 'villa',
  };
}

export function pmVotingHistory(rows = []) {
  const [dumped] = exitVerbs(PERFECT_MATCH);
  return rows.map(row => {
    const exits = (row.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb || dumped,
      channel: x.channel || null, ...(x.cause ? { cause: x.cause } : {}) }));
    const first = exits.find(x => x.verb === dumped) || null;
    const events = row.pm?.events || [];
    return {
      episode: row.num,
      moment: row.moment,
      title: momentTitle(row),
      days: row.days || null,
      eliminated: first?.name || null,
      eliminatedSlug: first ? first.slug : '',
      exits,
      votes: (row.votes || []).map(ballot),
      dumpFormat: row.pm?.dumpFormat || null,
      // The public's vote: shares, and the couples it left at the bottom.
      shares: (row.pm?.shares || []).map(s => ({ couple: [...s.couple], share: Math.round(s.share * 1000) / 1000 })),
      bottom: (row.pm?.bottom || []).map(c => (Array.isArray(c) ? [...c] : c)),
      couples: (row.pm?.couples || []).map(c => [...c]),
      arrivals: [...new Set(events.filter(e => /entrance/.test(e.kind) || e.kind === 'step-forward').map(e => e.players[0]))],
      challenge: row.pm?.challenge ? { id: row.pm.challenge, name: CHALLENGE_NAMES[row.pm.challenge] || row.pm.challenge } : null,
      steals: events.filter(e => e.kind === 'steal' || (e.kind === 'recouple-pick' && e.extra?.stole))
        .map(e => ({ by: e.players[0], took: e.players[1], from: e.kind === 'steal' ? e.players[2] : e.extra.stole })),
    };
  });
}

// ── placements ─────────────────────────────────────────────────────────
function finalOf(rows) {
  const final = [...rows].reverse().find(r => r.moment === 'final' && (r.pm?.shares || []).length);
  return final ? [...final.pm.shares].sort((a, b) => b.share - a.share) : [];
}

export function pmPlacements(rows = []) {
  const history = pmVotingHistory(rows);
  const final = finalOf(rows);
  const out = [];
  const statusAt = i => (i === 0 ? 'Winner' : i === 1 ? 'Runner-up' : 'Finalist');
  final.forEach((s, i) => { for (const n of s.couple) out.push({ name: n, placement: i + 1, status: statusAt(i), exit: null, exitEpisode: null }); });
  const placed = new Set(out.map(p => p.name));
  // Everybody else, by the LAST time they left (a returning islander left twice).
  const lastExit = new Map();
  history.forEach(h => h.exits.forEach(x => lastExit.set(x.name, { ...x, episode: h.episode })));
  const byEp = [...lastExit.values()].filter(x => !placed.has(x.name)).sort((a, b) => b.episode - a.episode);
  let place = final.length + 1, lastEp = null, run = 0;
  for (const x of byEp) {
    // Those who left on the same night share the place.
    if (lastEp !== null && x.episode !== lastEp) { place += run; run = 0; }
    lastEp = x.episode; run++;
    out.push({ name: x.name, placement: place, status: x.verb.charAt(0).toUpperCase() + x.verb.slice(1),
      exit: x.verb, exitEpisode: x.episode });
  }
  // Ballots against them (the villa's and the exes'), never a pick.
  const PICKS = new Set(['recoupling', 'casa']);
  for (const p of out) {
    p.playerSlug = slug(p.name);
    p.votesReceived = history.reduce((n, h) => n + h.votes.filter(v => !PICKS.has(v.channel) && !v.save
      && (v.target === p.name || (v.couple || []).includes(p.name))).length, 0);
  }
  return out.sort((a, b) => a.placement - b.placement);
}

// ── an islander's season, in the registry's career stats ───────────────
export function pmCareerStats(rows = [], name) {
  const partners = new Set();
  let timesStolen = 0, publicVotesSurvived = 0, lastPartner = null;
  for (const row of rows) {
    const c = (row.pm?.couples || []).find(x => sameCouple(x, name));
    if (c) { const p = c.find(n => n !== name); partners.add(p); lastPartner = p; }
    for (const e of row.pm?.events || []) {
      if (e.kind === 'steal' && e.players[2] === name) timesStolen++;
      if (e.kind === 'recouple-pick' && e.extra?.stole === name) timesStolen++;
    }
    // A public vote they were in the villa for, and were not dumped from.
    const inVilla = (row.pm?.villa || []).includes(name) || (row.exits || []).some(x => x.name === name);
    if (row.moment === 'public-vote' && row.pm?.shares && inVilla && !(row.exits || []).some(x => x.name === name)) publicVotesSurvived++;
  }
  const last = rows[rows.length - 1]?.pm || {};
  return {
    couplings: partners.size, timesStolen, publicVotesSurvived,
    finalApproval: Math.round((last.approval?.[name] ?? 0) * 10) / 10,
    label: last.labels?.[name] || null,
    lastPartner,
  };
}

// ── the twists that PLAYED, as the catalogue names them ────────────────
export function pmTwistsPlayed(rows = []) {
  const mine = TWIST_CATALOG.filter(t => t.format === PERFECT_MATCH);
  const out = [];
  const add = (ep, t) => { if (t) out.push({ episode: ep, type: t.id, name: t.name }); };
  for (const r of rows) {
    const pm = r.pm || {};
    if (pm.dumpFormat) add(r.num, mine.find(t => t.pmFormat === pm.dumpFormat));
    if (pm.firstFormat) add(r.num, mine.find(t => t.pmApply?.firstFormat === pm.firstFormat));
    if (pm.arrivalRule) add(r.num, mine.find(t => t.pmApply?.arrivalRule === pm.arrivalRule));
    if (pm.oneOff) add(r.num, mine.find(t => t.pmApply?.oneOff === pm.oneOff));
    if (pm.immune) add(r.num, mine.find(t => t.pmApply?.immunity));
    if (pm.challenge) add(r.num, mine.find(t => t.pmApply?.challenge === pm.challenge));
  }
  return out;
}

/** The season document. */
export function buildPerfectMatchSeasonDocument(rows = [], { seasonNumber = 1 } = {}) {
  const history = pmVotingHistory(rows);
  const final = finalOf(rows);
  const placements = pmPlacements(rows).map(p => {
    const stats = pmCareerStats(rows, p.name);
    // THE PAIR, where it outlived the villa: a finalist couple, or a couple
    // who left together (js/life-hook.js reads `showmance` off the appearance).
    const finalCouple = final.find(s => s.couple.includes(p.name))?.couple;
    const leftWith = !finalCouple && stats.lastPartner && history.some(h => h.exits.some(x => x.name === p.name)
      && h.exits.some(x => x.name === stats.lastPartner)) ? stats.lastPartner : null;
    const partner = finalCouple ? finalCouple.find(n => n !== p.name) : leftWith;
    return { ...p, ...(partner ? { showmance: partner, showmanceEnded: 'intact' } : {}),
      pm: { couplings: stats.couplings, timesStolen: stats.timesStolen, publicVotesSurvived: stats.publicVotesSurvived,
        finalApproval: stats.finalApproval, label: stats.label } };
  });
  const last = rows[rows.length - 1]?.pm || {};
  const winners = (final[0]?.couple || []).map(n => ({ name: n, playerSlug: slug(n), share: Math.round(final[0].share * 1000) / 1000 }));
  // The public's favourite islander at the end: the show's audience award.
  const fav = Object.entries(last.approval || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const envelope = [...rows].reverse().find(r => r.pm?.envelope)?.pm.envelope || null;
  return {
    seasonNumber: Number(seasonNumber),
    format: PERFECT_MATCH,
    seasonId: seasonId(PERFECT_MATCH, seasonNumber),
    title: `${SHOWS[PERFECT_MATCH].name} ${Number(seasonNumber)}`,
    castSize: placements.length,
    episodeCount: rows.length,
    winners,
    winner: null,
    winningCouple: final[0] ? [...final[0].couple] : [],
    finalVote: final.map((s, i) => ({ couple: [...s.couple], share: Math.round(s.share * 1000) / 1000, placement: i + 1 })),
    envelope: envelope ? { holder: envelope.holder, choice: envelope.choice } : null,
    fanFavourite: fav ? { name: fav, playerSlug: slug(fav) } : null,
    placements: placements.map(p => (fav && p.name === fav ? { ...p, fanFavourite: true } : p)),
    votingHistory: history,
    twists: pmTwistsPlayed(rows),
    emoji: SHOWS[PERFECT_MATCH].emoji,
    exitVerbs: exitVerbs(PERFECT_MATCH),
  };
}

/** The numbers the rankings board prices, for one islander in one season. */
export function pmBoardStats(doc, name) {
  const p = (doc.placements || []).find(x => x.name === name) || {};
  return { couplings: p.pm?.couplings || 0, timesStolen: p.pm?.timesStolen || 0,
    publicVotesSurvived: p.pm?.publicVotesSurvived || 0, finalist: (doc.finalVote || []).some(f => f.couple.includes(name)) };
}

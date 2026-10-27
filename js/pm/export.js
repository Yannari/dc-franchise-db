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
import { followers } from './ledger.js';
import { publishedRatings } from '../ratings.js';
import { feedScenes } from './feed-scenes.js';

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
      days: row.calendar || row.days || null,
      eliminated: first?.name || null,
      eliminatedSlug: first ? first.slug : '',
      exits,
      votes: (row.votes || []).map(ballot),
      dumpFormat: row.pm?.dumpFormat || null,
      // The public's vote: shares, and the couples it left at the bottom.
      shares: (row.pm?.shares || []).map(s => ({ couple: [...s.couple], share: Math.round(s.share * 1000) / 1000 })),
      bottom: (row.pm?.bottom || []).map(c => (Array.isArray(c) ? [...c] : c)),
      couples: (row.pm?.couples || []).map(c => [...c]),
      // Who walked in as a new arrival: a bombshell, or Casa Amor. Not night
      // one's line-up, and not a returning islander (that is `returned`).
      arrivals: [...new Set(events.filter(e => e.kind === 'entrance' || e.kind === 'group-entrance').flatMap(e => e.players))],
      returned: row.pm?.returned || null,
      challenge: row.pm?.challenge ? { id: row.pm.challenge, name: CHALLENGE_NAMES[row.pm.challenge] || row.pm.challenge } : null,
      steals: events.filter(e => e.kind === 'steal' || (e.kind === 'recouple-pick' && e.extra?.stole))
        .map(e => ({ by: e.players[0], took: e.players[1], from: e.kind === 'steal' ? e.players[2] : e.extra.stole, ...(e.extra?.reclaim ? { reclaim: true } : {}) })),
      // The villa's drama the audience talks about online — rows, tellings,
      // first kisses, Movie Night — kept small (js/pm/feed-scenes.js), so the
      // published feed reads the same night the played one does.
      scenes: feedScenes(events),
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
      if (e.kind === 'recouple-pick' && e.extra?.stole === name && !e.extra?.reclaim) timesStolen++;
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

// ── THE VILLA'S STORY, FOR THE WIKI WRITER ─────────────────────────────
//
// The wiki fill (js/wiki-fill-run.js) writes every islander's article and the
// season's episode-by-episode history from the record plus the episode
// scripts. A ballot list says nothing about who was with whom, and the scripts
// say it in passing and from a point of view — so a writer handed only those
// gets the order wrong ("together since episode 1" for a couple who met in 13).
// These are the engine's own facts, in sentences: every couple with the
// episodes it stood and how it ended, every steal, take-back and refusal,
// Casa Amor, the break-ups and the reunions, the feuds, the public votes.

const SPLIT_SAID = {
  'moved-on': r => (r.about ? `${r.by} left ${r.left} for ${r.about}` : `${r.by} moved on from ${r.left}`),
  cheated: r => `${r.by} ended it with ${r.left}${r.about ? ` after ${r.left} was caught with ${r.about}` : ' over cheating'}`,
  played: r => `${r.by} ended it with ${r.left}, feeling played`,
  triangle: r => `${r.by} ended it with ${r.left} over a love triangle${r.about ? ` with ${r.about}` : ''}`,
  cooling: r => `${r.by} called it off with ${r.left} as the feelings cooled`,
  clash: r => `${r.by} ended it with ${r.left} after they kept clashing`,
};
const splitSaid = r => (SPLIT_SAID[r.cause] || (x => `${x.by} split from ${x.left}`))(r);
const pairKey = (a, b) => [a, b].sort().join('+');

/**
 * Each islander's season in sentences, and each night's facts.
 * Returns { timeline: {name: [line]}, couples: {name: [stint]}, enemies: {name: [name]}, facts: [[line] per row] }.
 */
export function pmStories(rows = []) {
  const timeline = {}, couples = {}, feud = {};
  const say = (n, ep, line) => { const t = (timeline[n] ||= []); const last = t[t.length - 1]; if (last?.ep === ep) last.bits.push(line); else t.push({ ep, bits: [line] }); };
  const open = new Map();               // pairKey -> stint
  const together = new Set();           // every pair ever coupled
  const facts = [];
  const final = finalOf(rows);
  const [dumped] = exitVerbs(PERFECT_MATCH);
  rows.forEach((row, i) => {
    const ep = row.num, pm = row.pm || {}, events = pm.events || [], f = [];
    const exits = row.exits || [];
    // Who walked in.
    if (i === 0) for (const n of pm.villa || []) say(n, ep, 'arrived on night one');
    for (const e of events) {
      if (i > 0 && (e.kind === 'entrance' || e.kind === 'group-entrance')) for (const n of e.players) { say(n, ep, pm.momentFrom === 'casa' || row.moment === 'casa-amor' ? 'arrived at Casa Amor' : 'arrived as a new islander'); }
      if (e.kind === 'return-entrance') for (const n of e.players) { say(n, ep, 'came back into the villa'); f.push(`${n} came back into the villa`); }
    }
    // The picks, in order.
    for (const e of events) {
      const [a, b, c] = e.players;
      if (e.kind === 'recouple-pick') {
        if (e.extra?.reclaim) { say(a, ep, `took ${b} back from ${c} at the recoupling`); say(b, ep, `was taken back by ${a}`); say(c, ep, `picked ${b}, who was ${a}'s partner, and lost ${b} straight back to ${a}`); f.push(`${a}, ${b}'s partner, took ${b} straight back from ${c}`); }
        else if (e.extra?.stole) { say(a, ep, `stole ${b} from ${c} at the recoupling`); say(c, ep, `had ${b} stolen by ${a} at the recoupling`); f.push(`${a} stole ${b} from ${c}`); }
        else {
          const kept = (pm.couplesBefore || []).some(cp => cp.includes(a) && cp.includes(b));
          say(a, ep, kept ? `picked ${b} again at the recoupling` : `picked ${b} at the recoupling`); say(b, ep, kept ? `was picked again by ${a}` : `was picked by ${a}`); f.push(kept ? `${a} picked ${b} again` : `${a} picked ${b}`);
        }
      }
      if (e.kind === 'recouple-refused') { say(b, ep, `said no to ${a} at the recoupling, waiting for ${c}`); say(a, ep, `picked ${b}, who said no`); f.push(`${a} picked ${b}, and ${b} said no, waiting for ${c}`); }
      if (e.kind === 'steal') { say(a, ep, `stole ${b} from ${c}`); say(c, ep, `had ${b} stolen by ${a}`); f.push(`${a} stole ${b} from ${c}`); }
      if (e.kind === 'recouple-single') { say(a, ep, 'was left single at the recoupling'); f.push(`${a} was left single`); }
      if (e.kind === 'casa-return') {
        const ch = e.extra?.choice;
        if (ch === 'twist' && b) { say(a, ep, `came back from Casa Amor with ${b}`); f.push(`${a} came back from Casa Amor with ${b}`); }
        else if (ch === 'stick') { say(a, ep, 'stuck at Casa Amor'); f.push(`${a} stuck`); }
      }
      if (e.kind === 'rekindle') { say(a, ep, `got back together with ${b}`); say(b, ep, `got back together with ${a}`); f.push(`${a} and ${b} got back together`); }
      if (e.extra?.splitRec && e.extra.splitRec.ep === ep) {
        const r = e.extra.splitRec, s = splitSaid(r);
        say(r.by, ep, s); say(r.left, ep, s); f.push(s);
      }
      if (/^enemy-(clash|snipe|bitch|freeze)$/.test(e.kind) && a && b) { (feud[a] ||= {})[b] = (feud[a][b] || 0) + 1; (feud[b] ||= {})[a] = (feud[b][a] || 0) + 1; }
      if (e.kind === 'enemy-clash' && a && b) { say(a, ep, `had a row with ${b}`); say(b, ep, `had a row with ${a}`); }
    }
    // The couples as the night left them: who started, who ended, and how.
    // (The final and the reunion carry no villa couples: nothing ends there.)
    const closing = row.moment !== 'final' && row.moment !== 'reunion';
    const now = new Map((pm.couples || []).map(c => [pairKey(c[0], c[1]), c]));
    for (const [k, st] of open) {
      if (now.has(k) || !closing) continue;
      const gone = exits.find(x => st.pair.includes(x.name));
      const split = events.find(e => e.extra?.splitRec && pairKey(e.extra.splitRec.by, e.extra.splitRec.left) === k);
      // …or whatever moved one of them tonight: a steal, Casa, a pick at the fire pit.
      const inPair = n => st.pair.includes(n);
      const moved = events.find(e => (e.kind === 'steal' && inPair(e.players[1]) && !inPair(e.players[0]))
        || (e.kind === 'casa-return' && e.extra?.choice === 'twist' && inPair(e.players[0]))
        || (e.kind === 'recouple-pick' && inPair(e.players[0]) !== inPair(e.players[1])));
      const movedSaid = !moved ? null
        : moved.kind === 'steal' ? `${moved.players[1]} was stolen by ${moved.players[0]}`
        : moved.kind === 'casa-return' ? `${moved.players[0]} came back from Casa Amor with ${moved.players[1]}`
        : inPair(moved.players[0]) ? `${moved.players[0]} picked ${moved.players[1]} at the recoupling`
        : `${moved.players[1]} was picked by ${moved.players[0]} at the recoupling`;
      st.how = gone ? `${gone.name} ${gone.verb === 'walked' ? 'walked' : `was ${gone.verb || dumped}`}` : split ? splitSaid(split.extra.splitRec) : movedSaid || 'recoupled apart';
      st.to = ep;
      open.delete(k);
    }
    for (const [k, c] of now) {
      if (open.has(k) || !closing) continue;
      const st = { pair: [...c], from: ep, to: null, how: null, again: together.has(k) };
      open.set(k, st); together.add(k);
      for (const n of c) {
        (couples[n] ||= []).push(st);
        const o = c.find(x => x !== n);
        say(n, ep, st.again ? `coupled up with ${o} again` : `coupled up with ${o}`);
      }
    }
    // The public.
    if (row.moment === 'public-vote' && (pm.bottom || []).length) {
      const bottom = pm.bottom.map(c => (Array.isArray(c) ? c.join(' & ') : c));
      f.push(`the public's least favourite: ${bottom.join(', ')}`);
      for (const c of pm.bottom) for (const n of (Array.isArray(c) ? c : [c])) say(n, ep, 'in the bottom of the public vote');
    }
    for (const x of exits) { say(x.name, ep, `${String(x.verb || dumped).toUpperCase()}`); }
    if ((pm.couples || []).length && row.moment !== 'final') f.push(`couples at the end of the night: ${pm.couples.map(c => c.join(' & ')).join(', ')}`);
    facts.push(f);
  });
  // The final: placed and shared.
  final.forEach((s, i) => { for (const n of s.couple) say(n, rows[rows.length - 1]?.num, i === 0 ? `WON with ${s.couple.find(x => x !== n)} (${Math.round(s.share * 100)}% of the public vote)` : `finished ${i + 1}${i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} with ${s.couple.find(x => x !== n)}`); });
  const out = { timeline: {}, couples: {}, enemies: {}, facts };
  for (const [n, t] of Object.entries(timeline)) out.timeline[n] = t.map(x => `ep${x.ep}: ${x.bits.join('; ')}`);
  for (const [n, list] of Object.entries(couples)) {
    out.couples[n] = list.map(st => ({ with: st.pair.find(x => x !== n), from: st.from, to: st.to,
      how: st.how || (final.some(s => pairKey(...s.couple) === pairKey(...st.pair)) ? 'together at the final' : 'together at the end'), ...(st.again ? { again: true } : {}) }));
  }
  for (const [n, m] of Object.entries(feud)) out.enemies[n] = Object.entries(m).filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([x]) => x);
  return out;
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
  const story = pmStories(rows);
  const history = pmVotingHistory(rows).map((h, i) => ({ ...h, facts: story.facts[i] || [] }));
  const final = finalOf(rows);
  const lastPm = rows[rows.length - 1]?.pm || {};
  const placements = pmPlacements(rows).map(p => {
    const career = pmCareerStats(rows, p.name);
    // THE PAIR, where it outlived the villa: a finalist couple, or a couple
    // who left together (js/life-hook.js reads `showmance` off the appearance).
    const finalCouple = final.find(s => s.couple.includes(p.name))?.couple;
    const leftWith = !finalCouple && career.lastPartner && history.some(h => h.exits.some(x => x.name === p.name)
      && h.exits.some(x => x.name === career.lastPartner)) ? career.lastPartner : null;
    const partner = finalCouple ? finalCouple.find(n => n !== p.name) : leftWith;
    return { ...p, ...(partner ? { showmance: partner, showmanceEnded: 'intact' } : {}),
      pm: { couplings: career.couplings, timesStolen: career.timesStolen, publicVotesSurvived: career.publicVotesSurvived,
        finalApproval: career.finalApproval, label: career.label,
        // The following the villa built them on air: fame scaled by how the
        // public took them, as the season ended (js/pm/ledger.js). Dramagram
        // adds it on top of the debut (js/dramagram.js FOLLOWERS.onAir).
        followers: followers({ approval: lastPm.approval || {}, fame: lastPm.fame || {} }, p.name),
        couples: story.couples[p.name] || [], enemies: story.enemies[p.name] || [] },
      // Their season, episode by episode, for the wiki writer (pmStories above).
      timeline: story.timeline[p.name] || [] };
  });
  const last = lastPm;
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
    // How the season went down with the country. Stored, as Total Drama's is,
    // because the published document has none of the villa the reader needs,
    // and Dramagram scales every islander's followers by it.
    ratings: publishedRatings(rows, { format: PERFECT_MATCH }),
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

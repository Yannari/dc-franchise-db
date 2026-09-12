// ══════════════════════════════════════════════════════════════════════
// wiki-fill-run.js — running a wiki fill, from either page
// ══════════════════════════════════════════════════════════════════════
//
// The two fills were written as page code: read the season document, read the
// transcripts, check the worker, post, merge, save. All of it inside two
// onclick handlers on current-season.html, which is why filling a season meant
// leaving the simulator, and why tying it to Export Season would have meant a
// second copy of the same hundred lines.
//
// The orchestration lives here instead. Both callers keep only what is
// genuinely theirs: their status line, and what they do when committing is off.
//
//   js/wiki-fill.js      cuts the episodes up (threads, digests, the ledger)
//   THIS FILE            runs it: transcripts -> writer -> repo
//   current-season.html  two buttons, with a download fallback
//   Export Season        the same two, behind a checkbox

import { listEpisodes } from './episode-store.js';
import { gameHistoryPayload, roundLedger, sliceCastThreads } from './wiki-fill.js';
import { SHOWS, formatPrefix, showWords, DEFAULT_FORMAT } from './shows.js';

/** The season document's filename, by the site's one naming rule. */
export function seasonFile(season, format = DEFAULT_FORMAT) {
  const n = Number(season) || 1;
  if (!format || format === DEFAULT_FORMAT) return `season${n}-data.json`;
  const pre = SHOWS[format] ? formatPrefix(format) : format;
  return `${pre}-${n}-data.json`;
}

/** The season worker — the one with the writer on it. */
export function writerUrl() {
  let raw = '';
  try { raw = localStorage.getItem('SEASON_BUILDER_WORKER_URL') || ''; } catch { /* private */ }
  let u = (raw || 'https://dc-analytic-seasons.yannari19.workers.dev').trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}

/** The studio worker — the one that can commit. */
export function studioUrl() {
  let raw = '';
  try { raw = localStorage.getItem('studio_api_base') || ''; } catch { /* private */ }
  let u = (raw || 'https://dc-studio.yannari19.workers.dev').trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}

/** Somebody deliberately turned committing off; do not go behind their back. */
export function committingIsOff() {
  try { return localStorage.getItem('studio_publish_mode') === 'download'; } catch { return false; }
}

/**
 * Is this the right worker?
 *
 * Asked for a mode it does not have, the season worker's sibling does not
 * error — it falls through to its analytics prompt and answers 200 with an
 * analytics object. A misconfigured URL would look like a successful fill that
 * simply wrote nobody in, after paying for it. One empty POST first: the right
 * worker complains about the missing field.
 */
async function workerHasMode(base, mode, expects) {
  try {
    const r = await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const j = await r.json().catch(() => ({}));
    return new RegExp(expects, 'i').test(String(j.error || ''));
  } catch { return false; }
}

/** Commit a fill's output; the worker merges it into the repo document. */
async function commit(patch, { season, format }) {
  if (committingIsOff()) return { skipped: 'download-only mode' };
  let token = '';
  try { token = localStorage.getItem('studio_api_token') || ''; } catch { /* private */ }
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(studioUrl() + '/api/season-fill', {
      method: 'POST', headers,
      body: JSON.stringify({ seasonNumber: season, format, ...patch }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || `HTTP ${r.status}`);
    return j;
  } catch (e) { return { failed: String(e.message || e) }; }
}

/** The season document, as the site has it. */
async function loadDoc(season, format, root = '') {
  const file = seasonFile(season, format);
  const url = `${root ? root.replace(/\/+$/, '') + '/' : ''}data/seasons/${file}`;
  const doc = await fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
  return { file, doc };
}

/**
 * One player's season, round by round, from the simulator's own record.
 *
 * The screenplay says what somebody said; `keyMoments` is prose a model wrote
 * about them afterwards. This is neither — it is what the engine recorded: the
 * night they won something, the night they took votes, the night they went.
 * Handed all three, the writer can say "survived a 5-3 vote in week four" and
 * be right about it, and a claim that contradicts this line is checkable.
 *
 * Only rounds where something happened to this person, so a quiet middle does
 * not fill the request with "nothing".
 */
export function timelineFor(doc, name) {
  const out = [];

  for (const w of (doc.weeks || [])) {
    const noms = w.blockBeforeSafety || w.initialNominees || [];
    // In the order the week happened, so the line reads as a night rather than
    // as a set of flags: nominated THEN won the veto is somebody saving
    // themselves, and the reverse order says nothing.
    const beats = [];
    if (w.hoh === name) beats.push('won HOH');
    if (noms.includes(name)) beats.push('nominated');
    if (w.vetoWinner === name) beats.push('won the veto');
    if (w.safetyWinner === name) beats.push('won the Block Buster and came off the block');
    if ((w.haveNots || []).includes(name)) beats.push('have-not');
    const ballot = (w.ballots || []).find(b => b.voter === name);
    if (ballot?.evict) beats.push(`voted to evict ${ballot.evict}`);
    const against = Number((w.votes || {})[name]) || 0;
    if (against) beats.push(`took ${against} vote${against === 1 ? '' : 's'}`);
    if (w.evicted === name) {
      const tally = Object.values(w.votes || {}).sort((a, b) => b - a);
      // "5-0" is a different night from "5-4", so an unopposed vote still
      // states its margin rather than dropping it.
      beats.push(`EVICTED${tally.length ? ` ${tally[0]}-${tally[1] || 0}` : ''}`);
    }
    if (beats.length) out.push(`wk${w.week}: ${beats.join(', ')}`);
  }

  for (const r of (doc.votingHistory || [])) {
    const ballots = Array.isArray(r.votes) ? r.votes : [];
    const beats = [];
    if (r.winner === name) beats.push('won the challenge');
    if (r.immunityWinner === name) beats.push('had immunity');
    const mine = ballots.find(v => v.voter === name);
    if (mine?.target) beats.push(`voted ${mine.target}`);
    const against = ballots.filter(v => v.target === name).length;
    if (against) beats.push(`took ${against} vote${against === 1 ? '' : 's'}`);
    if (r.eliminated === name) {
      const counts = {};
      for (const v of ballots) counts[v.target] = (counts[v.target] || 0) + 1;
      const tally = Object.values(counts).sort((a, b) => b - a);
      beats.push(`VOTED OUT${tally.length ? ` ${tally[0]}-${tally[1] || 0}` : ''}`);
    }
    if (beats.length) out.push(`ep${r.episode}: ${beats.join(', ')}`);
  }

  /* ── AND A SHOW WITH NEITHER OF THOSE STILL HAS ITS EPISODES ──
     The two loops above read `doc.weeks` (the house) and `doc.votingHistory`
     (the camp). A drag season has neither — it keeps its record on `dr` and
     its round-by-round in `gameHistory` — so every queen's timeline came out
     EMPTY, and the character fill had nothing to write from but a placement.
     The writer said so, accurately: "With no dialogue recorded in her thread,
     her season was documented primarily through its outcome."

     `gameHistory` is the season written a round at a time, by the round fill,
     and it names who won, who was high, who lip synced and who went home. It
     is the same record the other two loops build, already in sentences.

     ONLY WHEN THE OTHERS FOUND NOTHING. On a camp or a house this would repeat
     the ballots above in prose, and a timeline that says everything twice is
     worse than one that says it once. */
  if (!out.length) {
    for (const r of (doc.gameHistory || [])) {
      const prose = String(r?.prose || '');
      if (!prose || !prose.includes(name)) continue;
      /* HER SENTENCES, NOT THE WHOLE EPISODE. A round's prose is about
         everybody in it, and fourteen queens each carrying all sixteen rounds
         is the same season sent fourteen times. */
      const mine = prose.split(/(?<=\.)\s+/).filter(x => x.includes(name));
      if (mine.length) out.push(`ep${r.n}: ${mine.join(' ')}`);
    }
  }

  // A long season would otherwise spend most of the request on one person's
  // ballots. The ends carry the arc: how they started, and how it finished.
  if (out.length > 14) return [...out.slice(0, 7), '…', ...out.slice(-7)];
  return out;
}

/**
 * THE RECORD, ATTACHED TO EACH THREAD.
 *
 * Split out of runCharacterFill so it can be tested without a worker, a fetch
 * or a season on disk: what a co-winner's paragraph is told about their own
 * season is exactly the kind of thing that is wrong for a year in a function
 * nothing can call.
 */
export function attachRecords(doc, threads, format) {
  // ── THE RECORD GOES WITH THE THREAD ────────────────────────────────
  //
  // The lead paragraph is about what somebody DID; a screenplay only shows what
  // they said while doing it. Handed scenes alone, a writer has to infer the
  // counts, which is how an article ends up crediting four competition wins to
  // somebody who won one.
  //
  // What goes in is everything the season already knows and nothing it does
  // not. The reference paragraph this is written against reads:
  //
  //   "…winning six competitions and forming a dominant alliance with Kasey
  //    Tate, Leo Li, and Lydia Prescott, his showmance. Despite being
  //    consistently perceived as a major threat, he strategically navigated the
  //    game, even enduring a fake eviction before making a triumphant return."
  //
  // Two of those clauses need things the counts cannot give: the alliance's
  // MEMBERS, and the season's turning points. Both exist in the export — the
  // membership is derivable by cross-referencing who else names the alliance,
  // and the turning points are `keyMoments`, eight per player, sitting unread.
  /* ── WHAT THIS SHOW COUNTS, ASKED OF THE REGISTRY ──────────────────
     This was `const house = format === 'big-brother'` and a two-way branch:
     the house's competitions, or Total Drama's. Which makes every other show
     Total Drama — and Total Drama's fields do not exist on a drag placement,
     where the numbers live on `row.dr` as maxi wins, lip syncs and bottoms.

     So the writer was handed "placed 1; winner" for a queen who won five maxi
     challenges, and said so: "The available record preserved no named
     alliances, competition counts, or final vote total for her run." Every
     word of that was true about the request. Fourteen articles came out
     documented "primarily through its outcome".

     `articleStats.comps` is the list each show already declares for exactly
     this — its competition columns, in its own words, with the path to read
     each one. A fifth show needs no edit here, which is the whole point of the
     registry and the reason CLAUDE.md opens with this bug class. */
  const statPaths = SHOWS[format]?.articleStats?.comps || [];
  const readPath = (obj, path) => String(path).split('.')
    .reduce((o, k) => (o == null ? o : o[k]), obj);

  // Who else named this alliance. The export stores alliances per player as
  // names, so the roster is the set of players who list the same one — which is
  // the only place membership exists at all.
  const membersOf = name => (doc.placements || [])
    .filter(p => (p.alliances || []).includes(name))
    .map(p => p.name);

  // A showmance, wherever this show happens to record it.
  const showmanceOf = row => row.showmance
    || ((doc.showmances || []).find(sh => (sh.players || []).includes(row.name)) || {})
      .players?.find(n => n !== row.name)
    || '';

  for (const t of threads) {
    const row = doc.placements.find(p => p.name === t.name);
    if (!row) continue;
    const bits = [`placed ${row.placement}`];
    if (row.status) bits.push(String(row.status).toLowerCase());
    // Only what actually happened: a zero is not a fact worth a clause, and a
    // list of them is how a paragraph ends up about what somebody did not do.
    for (const [path, label] of statPaths) {
      const n = Number(readPath(row, path)) || 0;
      if (n) bits.push(`${n} ${String(label).toLowerCase()}`);
    }
    if (row.votesReceived) bits.push(`${row.votesReceived} votes against`);
    if (row.juryVotes) bits.push(`${row.juryVotes} jury votes`);

    // Alliances BY MEMBER, so the paragraph can name the people rather than
    // only the label.
    for (const a of (row.alliances || [])) {
      const mates = membersOf(a).filter(n => n !== row.name);
      bits.push(mates.length ? `in ${a} with ${mates.join(', ')}` : `in ${a}`);
    }
    const partner = showmanceOf(row);
    if (partner) bits.push(`showmance with ${partner}`);
    if (row.rivalries?.length) bits.push(`rivals: ${row.rivalries.slice(0, 4).join(', ')}`);
    if (row.gameplayStyle) bits.push(`style: ${row.gameplayStyle}`);
    // THE TALLY BELONGS TO THE PERSON THE WINNER BLOCK NAMES.
    //
    // `winner{}` is singular and `placement === 1` is not: season 8 ended with
    // Alejandro and Cameron both on 1, and this handed Cameron's paragraph
    // Alejandro's final vote and Alejandro's runner-up to write about. A
    // co-winner's win is real; the other one's tally is not a fact about them.
    const mine = doc.winner && (doc.winner.playerSlug === row.playerSlug
      || doc.winner.name === row.name) ? doc.winner : null;
    if (row.placement === 1 && mine?.vote) bits.push(`won the final vote ${mine.vote}`);
    if (row.placement === 1 && mine?.runnerUp) bits.push(`beat ${mine.runnerUp}`);
    t.record = bits.join('; ');

    // The turning points, listed separately because they are events rather
    // than counts — this is where "endured a fake eviction before making a
    // triumphant return" comes from, and without them the paragraph can only
    // describe a scoreboard.
    //
    // These are AI-written prose from the narrative fill, which is why the
    // timeline below sits beside them: the timeline is the SIMULATOR'S OWN
    // record of the same season, round by round, and where the two disagree the
    // timeline is the one that happened.
    if (row.keyMoments?.length) t.moments = row.keyMoments.slice(0, 8);
    t.timeline = timelineFor(doc, t.name);
  }

  return threads;
}

/**
 * THE CHARACTER FILL — personality, quotes and trivia for the whole cast.
 *
 * One request for everybody rather than one each: a model that can see the
 * whole cast writes them apart, and asked about eighteen people separately it
 * has no way to know it has already called four of them the quiet strategist.
 */
export async function runCharacterFill({ season, format, root = '', onStatus = () => {} } = {}) {
  const { file, doc } = await loadDoc(season, format, root);
  if (!doc || !Array.isArray(doc.placements)) {
    return { ok: false, reason: `no season document at data/seasons/${file} — export the season first` };
  }
  const cast = doc.placements.map(p => p.name).filter(Boolean);
  if (!cast.length) {
    return { ok: false, reason: `${file} has no cast on it — re-export the season` };
  }

  onStatus('Reading episode transcripts…');
  /* ── A TRANSCRIPT IS ENRICHMENT, NOT A PREREQUISITE ──
     This refused outright on a season with no saved transcripts, and the round
     fill beside it does not: `runGameHistoryFill` writes from the season
     DOCUMENT and treats episodes as extra. So a season whose episodes were
     never put through the AI episode writer got all of its rounds written and
     not one player, and `runBothFills` runs this one first — so the failure
     scrolled past and the commit that followed said "(0 players, 16 rounds)".
     Reported on the first drag season, where the whole cast had no narrative
     at all while the round-by-round read fine.
     There is plenty to write from without a transcript. `sliceCastThreads`
     returns a thread per queen either way, and `attachRecords` fills the
     record, the key moments and the timeline entirely off `doc` — a placement,
     a status, a run of wins and bottoms, and what happened week by week. That
     is a thinner paragraph than one with confessionals in it and it is a
     paragraph, which is what the page is missing. */
  const episodes = await listEpisodes(season, format);

  const base = writerUrl();
  onStatus('Checking the worker…');
  if (!await workerHasMode(base, 'wiki-fill', 'threads')) {
    return { ok: false, reason: `${base} does not have the wiki-fill mode `
      + '(usually the episode worker rather than the season one, or the season worker '
      + 'has not been deployed since the mode was added)' };
  }

  const threads = sliceCastThreads(episodes, cast);

  attachRecords(doc, threads, format);

  const spoken = threads.filter(t => t.totals.confessionals + t.totals.lines > 0).length;
  // And say which of the two this is, so "nobody speaks" reads as a fact about
  // the season rather than as something that went wrong.
  onStatus(episodes.length
    ? `${episodes.length} episodes · ${cast.length} in the cast · ${spoken} speak on camera. Asking the writer…`
    : `No transcripts saved · writing ${cast.length} from the season record alone. Asking the writer…`);

  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    // The show's own vocabulary travels with the request, so the writer does
    // not have to guess from the format and a third show needs no worker edit.
    body: JSON.stringify({ mode: 'wiki-fill', threads, season,
      seasonTitle: doc.title || '', format, words: showWords(format) }),
  });
  if (!res.ok) return { ok: false, reason: `worker ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const json = await res.json();
  const players = json.players || json.result?.players || [];
  if (!players.length) return { ok: false, reason: 'the worker returned no players' };

  // The document is patched here too, so a caller that cannot commit still has
  // something to download rather than a paid-for answer with nowhere to go.
  let filled = 0;
  for (const p of players) {
    const row = doc.placements.find(x => x.name === p.name);
    if (!row) continue;
    if (p.lead) row.lead = p.lead;
    if (p.personality) row.personality = p.personality;
    if (p.quotes?.length) row.quotes = p.quotes;
    if (p.trivia?.length) row.trivia = p.trivia;
    filled++;
  }

  onStatus(`Wrote ${filled} of ${cast.length}. Saving…`);
  const sent = await commit({ players }, { season, format });
  return { ok: true, kind: 'characters', file, doc, filled, cast: cast.length, sent };
}

/**
 * THE GAME HISTORY FILL — one paragraph per round.
 *
 * Each round goes as its FACTS from the record plus a digest of that round's
 * screenplay. The facts win every disagreement; the episode is only allowed to
 * say how it happened.
 */
export async function runGameHistoryFill({ season, format, root = '', onStatus = () => {} } = {}) {
  const { file, doc } = await loadDoc(season, format, root);
  if (!doc) return { ok: false, reason: `no season document at data/seasons/${file} — export the season first` };

  const ledger = roundLedger(doc);
  if (!ledger.length) {
    return { ok: false, reason: `${file} carries no round-by-round record, so there are no rounds `
      + 'to write about — re-export the season' };
  }

  onStatus('Reading episode transcripts…');
  const episodes = await listEpisodes(season, format);

  // One request holds the whole season, so each round's share of it shrinks as
  // the season gets longer rather than the last week being dropped for being last.
  const capPerRound = Math.max(1500, Math.min(6000, Math.floor(150000 / ledger.length)));
  const rounds = gameHistoryPayload(doc, episodes, { capPerRound });
  const written = rounds.filter(r => r.episode).length;

  const base = writerUrl();
  onStatus('Checking the worker…');
  if (!await workerHasMode(base, 'game-history-fill', 'rounds')) {
    return { ok: false, reason: `${base} does not have the game-history-fill mode `
      + '(the season worker may not have been deployed since the mode was added)' };
  }

  onStatus(`${ledger.length} rounds · ${written} with an episode written. Asking the writer…`);
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'game-history-fill', rounds, season,
      seasonTitle: doc.title || '', format, words: showWords(format) }),
  });
  if (!res.ok) return { ok: false, reason: `worker ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const json = await res.json();
  const back = json.rounds || json.result?.rounds || [];
  if (!back.length) return { ok: false, reason: 'the worker returned no rounds' };

  doc.gameHistory = ledger.map(r => {
    const w = back.find(x => Number(x.n) === r.n);
    return { n: r.n, word: r.word, title: w?.title || '', prose: w?.prose || '' };
  });
  const filled = doc.gameHistory.filter(r => r.prose).length;

  onStatus(`Wrote ${filled} of ${ledger.length}. Saving…`);
  const sent = await commit({ gameHistory: doc.gameHistory }, { season, format });
  return { ok: true, kind: 'gameHistory', file, doc, filled, rounds: ledger.length, sent };
}

/**
 * Both fills, in the order Export Season wants them.
 *
 * Sequential rather than parallel, and not because of the worker: each fill
 * commits, and two commits to one file at the same moment is one of them
 * losing. The server-side merge makes the order irrelevant to the RESULT — it
 * just has to be an order.
 */
export async function runBothFills({ season, format, root = '', onStatus = () => {} } = {}) {
  const characters = await runCharacterFill({ season, format, root, onStatus });
  const gameHistory = await runGameHistoryFill({ season, format, root, onStatus });
  return { characters, gameHistory };
}

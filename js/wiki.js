// A character's page, in the shape a fandom wiki uses.
//
// Everything here already existed and was shown nowhere. The player page was a
// stat sheet: bars, chips, placements. Meanwhile players_database carries a
// per-season narrative for 150 of 152 people, every season detail carries
// keyMoments and notes, voice-profiles.json describes how each of them talks,
// and js/records.js knows what they hold. None of it appeared on their page.
//
// So this assembles a DOSSIER — who they are, what they did in each show, who
// they were close to, what records they hold, what people remember — and the
// page renders it. The assembly is here rather than in the page because the
// per-character social profiles will want the same thing, and two versions of
// "who is this person" would disagree within a season.
//
// WHAT IT WILL NOT DO IS FILL GAPS WITH PROSE. A section with no data is
// omitted, not padded: 16 of 152 players have recorded bonds, and no published
// season carries showmances yet because the export only started recording them.
// A relationships section that invented something for everybody would be the
// most-read part of the page and the least true.
//
// Pure: documents in, a dossier out. No fetch, no DOM.
import { approvedFor, lineFor as lifeLine } from './life-events.js';
import { airLabel } from './franchise-calendar.js';

import { parseBio } from './bio.js';

const DEFAULT_FORMAT = 'total-drama';
const SHOW_NAMES = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' };
const showName = f => SHOW_NAMES[f] || f;
const fmtOf = d => d?.format || DEFAULT_FORMAT;

/**
 * A player slug, the way every other file in this project makes one.
 *
 * Exported because the article links names, and a link needs an id: the season
 * documents carry `playerSlug`/`evictSlug` on most rows and nothing on the
 * rest, so the fallback has to agree with the one the export used.
 */
export const _slug = n => String(n || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');


/**
 * The story, split back into the seasons it was written about.
 *
 * `player.story` is one long string with "SEASON 4 — Title" headers in it, and
 * the headers repeat — the generator emitted each one twice. Rendered raw it is
 * a wall with duplicated titles; split, it becomes a section per season that can
 * sit beside that season's placement.
 */
/** Age from an ISO birthdate, or null. Never stored — see the note in bio. */
export function _ageFrom(birthdate) {
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return null;
  const b = new Date(`${birthdate}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

export function splitStory(story) {
  const text = String(story || '').trim();
  if (!text) return [];
  const parts = [];
  const re = /^SEASON\s+(\d+)\s*[—–-]\s*(.+)$/gim;
  const heads = [...text.matchAll(re)];
  if (!heads.length) return [{ season: null, title: null, text }];

  for (const [i, m] of heads.entries()) {
    const start = m.index + m[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    // Strip the rule the generator draws under a heading. Left in, a chapter
    // opens with "—————— Bowie starts fast", which reads as a typo.
    const body = text.slice(start, end)
      // Box-drawing characters too: the rule is ─, not an em-dash.
      .replace(/^[\s─-╿—–\-_=·•]+/, '')
      .trim();
    if (!body) continue;                     // a repeated header with no prose
    const season = Number(m[1]);
    const last = parts[parts.length - 1];
    // The duplicate header case: same season, and the previous entry already
    // holds this prose.
    if (last && last.season === season && last.text === body) continue;
    parts.push({ season, title: m[2].trim(), text: body });
  }
  return parts;
}

/** Their personality, without the bio sentence the Studio prepends to it. */
export function personalityOf(name, voices = {}, rosterRow = null) {
  // The long form when there is one. `voice` and `personality` are the same
  // truth at two lengths — voice is the short imperative that ships inside
  // every episode prompt, personality is the paragraph a reader gets — and the
  // page should show the one written for a reader. Falling back to the voice
  // means a character nobody has written a personality for still says
  // something, rather than the section vanishing.
  const authored = rosterRow && typeof rosterRow.personality === 'string'
    ? rosterRow.personality.trim() : '';
  if (authored) return authored;
  const raw = voices[name];
  if (!raw) return '';
  return parseBio(raw).prose;
}

/**
 * Who they were close to, and who they were not.
 *
 * Bonds come from `unbreakableBonds` on each season detail — the only
 * relationship the published databases have ever carried. Showmances, alliances
 * and rivalries come from the SEASON DOCUMENTS, which only started recording
 * them; a season published before that contributes nothing rather than an empty
 * couple.
 */
export function relationshipsOf(player, { seasonDocs = [] } = {}) {
  const name = player.name;
  const bonds = new Map();
  for (const d of player.seasonDetails || []) {
    for (const other of d.unbreakableBonds || []) {
      const e = bonds.get(other) || { name: other, seasons: [] };
      e.seasons.push({ season: d.season, format: fmtOf(d), seasonId: d.seasonId });
      bonds.set(other, e);
    }
  }

  const showmances = [];
  const alliances = [];
  const rivalries = [];
  for (const doc of seasonDocs) {
    if (!doc) continue;
    const label = { season: doc.seasonNumber, format: doc.format || DEFAULT_FORMAT, seasonId: doc.seasonId };
    for (const sh of doc.showmances || []) {
      if (!(sh.players || []).includes(name)) continue;
      showmances.push({ ...sh, ...label, partner: sh.players.find(n => n !== name) || null });
    }
    for (const a of doc.alliances || []) {
      if (!(a.members || []).includes(name)) continue;
      alliances.push({ ...a, ...label });
    }
    for (const r of doc.rivalries || []) {
      if (!(r.players || []).includes(name)) continue;
      rivalries.push({ ...r, ...label, rival: r.players.find(n => n !== name) || null });
    }
  }

  return {
    bonds: [...bonds.values()].sort((a, b) => b.seasons.length - a.seasons.length),
    showmances,
    alliances,
    rivalries,
    // What the page needs to decide whether to draw the section at all.
    any: bonds.size > 0 || showmances.length > 0 || alliances.length > 0 || rivalries.length > 0,
  };
}

/** Are they with somebody as of the last season they played? */
export function coupleStatus(relationships) {
  const live = (relationships.showmances || []).filter(sh => sh.phase !== 'broken');
  if (live.length) {
    const latest = live.reduce((a, b) => ((b.season || 0) > (a.season || 0) ? b : a));
    return { together: true, partner: latest.partner, since: latest.season };
  }
  const broken = (relationships.showmances || []).filter(sh => sh.phase === 'broken');
  if (broken.length) {
    const latest = broken.reduce((a, b) => ((b.season || 0) > (a.season || 0) ? b : a));
    return { together: false, partner: latest.partner, endedBy: latest.endedBy, season: latest.season };
  }
  return null;
}

/** Every record this player is the holder of, from the shared engine. */
export function recordsHeldBy(playerId, milestonesByShow = {}) {
  const held = [];
  for (const [format, rows] of Object.entries(milestonesByShow)) {
    for (const m of rows || []) {
      if (m.playerSlug === playerId) held.push({ ...m, show: showName(format) });
    }
  }
  return held;
}

/**
 * Fill each season's LOYALTIES from the relationship engine.
 *
 * The reference pages list Alliances and Loyalties as separate rows, and the
 * distinction is worth keeping: an alliance is a deal with a name, a loyalty is
 * a person who stayed. Bonds already know which seasons they were formed in, so
 * this is a join rather than new data.
 */
function _withLoyalties(career, relationships) {
  const bonds = (relationships?.bonds || []);
  for (const show of career) {
    for (const s of show.seasons) {
      s.loyalties = bonds
        .filter(b => (b.seasons || []).some(x =>
          Number(x.season) === Number(s.season) && (x.format || 'total-drama') === show.format))
        .map(b => b.name);
    }
  }
  return career;
}

/** A non-empty array, or nothing — so a filled field is not replaced by []. */
function _arr(v) { return Array.isArray(v) && v.length ? v : null; }

/**
 * One player's round-by-round history, from the season document.
 *
 * BOTH SHOWS, from their own record. `weekRows` was read off the players
 * database and nothing has ever written it there, so the grid — the most
 * characteristic table on a character page — drew for nobody. Total Drama had
 * no `weeks` to build one from either, so a camp article was missing the
 * section entirely rather than showing what a camp does have: who they wrote
 * down, who wrote them down, and the round it caught up with them.
 *
 * One vocabulary for both, because one renderer draws both. `hoh`, `veto`,
 * `onBlock`, `evicted`, `votesAgainst`, `haveNot` are the house's words; a camp
 * simply leaves the ones it has no concept of unset.
 */
function _weekRowsFromDoc(found, name) {
  if (!found) return null;
  const doc = found.doc;

  // ── the house ──
  const weeks = Array.isArray(doc.weeks) ? doc.weeks : [];
  if (weeks.length) {
    const rows = [];
    /* ── EVICTED IS NOT ALWAYS THE END ──────────────────────────────
       This broke out of the loop at the first eviction, which is right for
       almost everybody and wrong for the one player a season builds a twist
       around: a Battle Back winner's grid ended at the week they lost, so the
       eight weeks they came back and played — including a Head of Household —
       were not in their article at all. The grid runs to the LAST time the
       record says they left. */
    const exits = weeks.filter(w => w.evicted === name).map(w => Number(w.week));
    const finalExit = exits.length ? exits[exits.length - 1] : null;
    /* The stretch between an exit and the week they turn up again: out of the
       house, waiting on the door. Blank in the grid reads as a quiet week. */
    /* ── A HOUSE HAS NOBODY QUIETLY SITTING OUT A WEEK. Every houseguest
       votes, holds the crown, sits on the block or leaves, so a week where
       somebody appears NOWHERE in the record is a week they were not in the
       house as themselves. Before their first appearance that means they had
       not arrived yet — the second half of a twin, a late addition — and
       drawing it blank says "a quiet week" about somebody who was not there.

       House only. A camp votes one tribe at a time, so a blank round there is
       normal and means nothing of the kind. */
    const appearsIn = w => w.hoh === name || w.vetoWinner === name || w.safetyWinner === name
      || w.evicted === name || (w.ballots || []).some(b => b.voter === name)
      || (w.votes || {})[name] != null
      || (w.initialNominees || []).includes(name)
      || (w.blockBeforeSafety || []).includes(name)
      || (w.finalNominees || []).includes(name);
    // A week with no ceremony has nobody in its record at all, so it can never
    // be the week somebody first appears — read as one, it told every
    // houseguest in the season that they arrived late.
    const firstSeen = weeks.find(w => !w.cancelledEviction && appearsIn(w))?.week ?? null;
    let gone = false;
    for (const w of weeks) {
      if (gone) break;
      // ── THE BLOCK, IN THE ORDER THE WEEK ACTUALLY HAPPENS ──────────
      //
      // Three fields, three different moments, and this used to read only one
      // of them: `blockBeforeSafety || initialNominees`, which is the block
      // AFTER the veto ceremony. So a houseguest who was nominated on Sunday
      // and took himself down with the veto on Saturday was, on his own page,
      // never nominated at all — the grid showed a bare "Veto" and the run
      // strip showed nothing. The only rescue that left a mark was the Block
      // Buster, because that one is recorded on its own two fields.
      //
      //   initialNominees   — the nomination ceremony
      //   blockBeforeSafety — after the veto and any replacement, going into
      //                       the arena (absent when no arena was played)
      //   finalNominees     — who is sitting there when the house votes
      //
      // THE FINAL BLOCK IS THE HEADLINE. Being nominated and getting off it is
      // a different week from being nominated and staying there, so the row
      // says which rescue it was rather than flattening both into "Nominated".
      const opened = w.initialNominees || w.blockBeforeSafety || [];
      const postVeto = w.blockBeforeSafety || w.finalNominees || [];
      const finalNoms = w.finalNominees || [];
      const wasOpened = opened.includes(name);
      const wasPostVeto = postVeto.includes(name);
      const onBlock = finalNoms.includes(name);
      const vetoWon = w.vetoWinner === name;
      const arenaWon = w.safetyWinner === name;
      const ballot = (w.ballots || []).find(b => b.voter === name);
      const out = w.evicted === name;
      rows.push({
        week: Number(w.week),
        hoh: w.hoh === name,
        veto: vetoWon,
        // Won it while sitting on the block and used it on themselves: the
        // single most-remembered thing a nominee can do, and the one the grid
        // could not say.
        vetoOnSelf: vetoWon && wasOpened && !wasPostVeto,
        // Taken off by somebody else's veto.
        savedByVeto: wasOpened && !wasPostVeto && !vetoWon,
        // Put up after the veto came down on somebody else.
        replacement: !wasOpened && wasPostVeto,
        // Played the arena and won their way off the block, which outranks
        // having been nominated — being nominated is how you get into it.
        arenaPlayed: wasPostVeto && !!w.safetyWinner,
        arenaWon,
        onBlock,
        // Nominated AT ANY POINT in the week, whether or not they were still
        // there at the vote.
        nominated: wasOpened || wasPostVeto,
        // Slop and the have-not room. Exported since today; a season published
        // before that simply has none, which reads as "never a have-not" and is
        // why the section is dropped when no week records anybody.
        haveNot: (w.haveNots || []).includes(name),
        away: exits.length > 1 && Number(w.week) > exits[0] && !appearsIn(w),
        // Not in the house YET: the other half of a twin, or anybody the
        // season walked in after it started.
        notYet: !w.cancelledEviction && firstSeen != null && Number(w.week) < Number(firstSeen),
        // A week with no ceremony at all. The house is the same size on
        // Thursday as it was on Sunday, and every cell in it is blank for a
        // reason rather than for want of a record.
        noEviction: !!w.cancelledEviction,
        votesAgainst: Number((w.votes || {})[name]) || 0,
        votedFor: ballot?.evict || '',
        // The slug the avatar is drawn from, straight off the ballot when the
        // export wrote one — a name has to be guessed at, a slug does not.
        votedForSlug: ballot?.evictSlug || _slug(ballot?.evict),
        // Who ran the week, and who left it. Both are the week's facts rather
        // than this player's, and both are what a reader wants a face for.
        hohName: w.hoh || '',
        evictedName: w.evicted || '',
        evicted: out,
      });
      if (out && Number(w.week) === finalExit) gone = true;
    }
    return rows.length ? rows : null;
  }

  // ── the camp ──
  const rounds = Array.isArray(doc.votingHistory) ? doc.votingHistory : [];
  if (!rounds.length) return null;

  const rows = [];
  let gone = false;
  for (const r of rounds) {
    if (gone) break;
    const ballots = Array.isArray(r.votes) ? r.votes : [];
    const mine = ballots.find(v => v.voter === name);
    const against = ballots.filter(v => v.target === name).length;
    const out = r.eliminated === name;
    rows.push({
      week: Number(r.episode),
      evicted: out,
      votesAgainst: against,
      votedFor: mine?.target || '',
      votedForSlug: mine?.targetSlug || _slug(mine?.target),
      evictedName: r.eliminated || '',
    });
    if (out) gone = true;
  }
  return rows.length ? rows : null;
}

/**
 * Their career, one entry per show.
 *
 * Deliberately grouped rather than listed flat: two Total Drama seasons and one
 * Big Brother season is two careers, and a single chronological list says the
 * opposite.
 */
export function careerOf(player, { seasonTitles = new Map(), seasonDocs = [], seasonAir = new Map() } = {}) {
  const byShow = new Map();
  const story = splitStory(player.story);

  // ── THE SEASON DOCUMENT OUTRANKS THE PLAYERS DATABASE ──────────────
  //
  // Two records describe the same season. `players_database.json` is
  // DERIVED — rebuilt by an export — and holds the numbers. The season
  // document in data/seasons is where a season's prose is written, and the
  // wiki fill writes into it directly.
  //
  // The article read only the derived copy, so a filled season showed the
  // voice profile and no quotes: the fill had landed somewhere nothing on
  // this page was looking. Prose now comes from the season document when it
  // is loaded, and the derived copy remains the fallback for a season whose
  // document is not to hand.
  const docRow = new Map();
  for (const doc of seasonDocs) {
    if (!doc || !Array.isArray(doc.placements)) continue;
    const row = doc.placements.find(p =>
      p.name === player.name || (p.playerSlug && p.playerSlug === player.id));
    if (!row) continue;
    const n = Number(doc.seasonNumber ?? doc.season);
    if (Number.isFinite(n)) docRow.set(`${doc.format || ''}:${n}`, { row, doc });
  }
  /** The season document's row for one appearance, whichever way it is keyed. */
  const rowFor = d => docRow.get(`${fmtOf(d)}:${Number(d.season)}`)
    || docRow.get(`:${Number(d.season)}`)
    || null;

  for (const d of player.seasonDetails || []) {
    const f = fmtOf(d);
    if (!byShow.has(f)) byShow.set(f, { format: f, show: showName(f), seasons: [] });
    // The story is split by season NUMBER, which is unambiguous inside one show.
    const chapter = story.find(x => x.season === Number(d.season));
    byShow.get(f).seasons.push({
      season: d.season,
      seasonId: d.seasonId,
      title: seasonTitles.get(d.seasonId) || seasonTitles.get(d.season) || chapter?.title || null,
      // WHEN it aired. Looked up the same way the title is, because it lives
      // beside it on the season record and a season detail has never carried
      // either. Absent for a season nobody has placed on the calendar yet, and
      // every reader below says nothing rather than guessing.
      air: seasonAir.get(d.seasonId) || seasonAir.get(d.season) || null,
      placement: d.placement,
      status: d.status,
      tribe: d.tribe,
      keyMoments: d.keyMoments || [],
      notes: d.notes || [],
      // The season document's own narrative first, then the chapter split out
      // of players_database. Same precedence as the prose above and for the
      // same reason: the season document is where a season is written, and the
      // derived copy is a rebuild of it that can lag a fill by an export.
      story: rowFor(d)?.row.story || chapter?.text || '',
      // ── THE RECORD, CARRIED THROUGH ────────────────────────────────
      //
      // seasonDetails has held the competition numbers all along and this
      // dropped every one of them, so the article could describe a season and
      // never say what anybody DID in it. A fandom character page is half
      // prose and half table, and only the prose half existed.
      record: {
        challengeWins: d.challengeWins || 0,
        votesReceived: d.votesReceived || 0,
        juryVotes: d.juryVotes || 0,
        ...(d.bb ? { bb: { ...d.bb } } : {}),
      },
      // The per-week row, when the season document was reachable. Absent is a
      // normal state — a season nobody has published yet still gets an
      // article, it simply has no grid in it.
      weekRows: _weekRowsFromDoc(rowFor(d), player.name)
        || (Array.isArray(d.weekRows) ? d.weekRows : null),
      // ── WHO ELSE WAS THERE ─────────────────────────────────────────
      //
      // Every name this season's prose can mention, with the slug their page
      // lives at. A fandom article links a castmate the first time it says
      // their name and the article had no way to: it knew four bonds and a
      // rival and nothing about the other sixteen people in the room.
      cast: ((rowFor(d)?.doc?.placements) || []).map(p => ({
        name: p.name, slug: p.playerSlug || _slug(p.name),
      })).filter(p => p.name && p.name !== player.name),
      // ── HOW THE SEASON ENDED ─────────────────────────────────────
      //
      // The lead's second paragraph closes the way the reference pages do —
      // "in a close final vote, he emerged victorious with a 4 to 3 decision"
      // — which needs the tally and the person they beat. Both are on the
      // season document's winner block and neither was carried through.
      finalVote: rowFor(d)?.doc?.winner?.vote || '',
      runnerUp: rowFor(d)?.doc?.winner?.runnerUp || '',
      showmance: rowFor(d)?.row?.showmance || d.showmance || '',
      // WHO THEY PLAYED WITH, which the infobox lists per season and the
      // measured lead names. The season document is preferred for the same
      // reason as the prose: it is the season's own record.
      alliances: _arr(rowFor(d)?.row.alliances) || _arr(d.alliances) || [],
      rivalries: _arr(rowFor(d)?.row.rivalries) || _arr(d.rivalries) || [],
      // Loyalties are the bonds that held, named on the reference pages as a
      // separate row from alliances — an alliance is a deal, a loyalty is a
      // person. Filled from the relationship engine, which reads the same
      // season documents.
      loyalties: [],
      // Written from the episodes rather than from the voice profile. Absent
      // until a season has been through the wiki fill.
      // The article's opening paragraph, written from the episodes and the
      // record together. Absent until the fill has run, and the measured
      // version in wiki-view stands in until it does.
      lead: rowFor(d)?.row.lead || d.lead || '',
      personality: rowFor(d)?.row.personality || d.personality || '',
      quotes: _arr(rowFor(d)?.row.quotes) || _arr(d.quotes) || [],
      trivia: _arr(rowFor(d)?.row.trivia) || _arr(d.trivia) || [],
    });
  }

  for (const entry of byShow.values()) {
    entry.seasons.sort((a, b) => a.season - b.season);
    entry.count = entry.seasons.length;
    entry.wins = entry.seasons.filter(s => Number(s.placement) === 1).length;
    entry.best = Math.min(...entry.seasons.map(s => Number(s.placement) || 99));
    // Career totals for the infobox, summed from the same rows the table draws
    // so the two can never disagree.
    const sum = pick => entry.seasons.reduce((n, s) => n + (pick(s.record || {}) || 0), 0);
    entry.totals = {
      challengeWins: sum(r => r.challengeWins),
      hohWins: sum(r => r.bb?.hohWins),
      vetoWins: sum(r => r.bb?.vetoWins),
      blockBusterWins: sum(r => r.bb?.blockBusterWins),
      timesNominated: sum(r => r.bb?.timesNominated),
      juryVotes: sum(r => r.juryVotes),
      // A best, not a sum — a run does not carry across seasons.
      bestBlockBusterStreak: entry.seasons.reduce(
        (n, s) => Math.max(n, s.record?.bb?.blockBusterStreak || 0), 0),
    };
  }
  return [...byShow.values()].sort((a, b) => b.count - a.count);
}

/**
 * The dossier, reduced to FACTS for a writer.
 *
 * The character page's prose should be WRITTEN rather than assembled — a bio is
 * not a personality profile plus a list of placements, and the difference shows
 * immediately. But a model must be handed facts rather than left to remember:
 * it gets what happened and writes about it, and anything it states that is not
 * in here is an invention. Same contract the social feed's featured posts use.
 *
 * Deliberately flat and small. A prompt carrying the whole database costs money
 * and buys confusion.
 */
export function dossierFacts(dossier) {
  if (!dossier) return null;
  return {
    name: dossier.name,
    bio: dossier.bio,
    personality: dossier.personality,
    shows: dossier.career.map(c => ({
      show: c.show,
      wins: c.wins,
      best: c.best,
      seasons: c.seasons.map(s => ({
        season: s.season, title: s.title, placement: s.placement,
        status: s.status, moments: s.keyMoments,
      })),
    })),
    closestTo: dossier.relationships.bonds.map(b => b.name),
    couple: dossier.couple,
    alliances: dossier.relationships.alliances.map(a => a.name),
    rivalries: dossier.relationships.rivalries.map(r => r.rival),
    records: dossier.records.map(r => `${r.category}: ${r.stat}`),
  };
}

/**
 * A fingerprint of everything a written bio depends on.
 *
 * THE POINT IS NOT TO REWRITE. A character's page is read far more often than
 * their career changes, and paying a model on every view would be absurd. Store
 * the prose against this hash and regenerate only when it moves — which happens
 * when a season is published, a record changes hands or a showmance is
 * recorded. Everything else leaves it alone.
 */
export function dossierHash(dossier) {
  const facts = dossierFacts(dossier);
  if (!facts) return '';
  const text = JSON.stringify(facts);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * The whole dossier.
 *
 * `seasonDocs` is optional — pass the published season documents and the
 * relationships section gains showmances, alliances and rivalries. Without them
 * it still has bonds, which is what every season published so far carries.
 */
export function buildDossier(player, {
  voices = {}, roster = [], seasonDocs = [], seasonTitles = new Map(),
  seasonAir = new Map(), milestonesByShow = {}, triviaByShow = {},
  // The log, a slug -> display name map so a two-person event can name the
  // other half, and the calendar ranking that orders them.
  lifeEvents = [], lifeNames = {}, seasonRank = null,
} = {}) {
  if (!player) return null;
  const rosterRow = (roster.players || roster || []).find(r => r.slug === player.id) || {};
  const _lifeGenders = new Map((roster.players || roster || [])
    .filter(r => r && r.slug).map(r => [r.slug, r.gender]));
  const parsed = parseBio(voices[player.name] || '');

  // ── the authored bio, which this used to ignore ──
  //
  // occupation, hometown, birthdate and backstory were added to the roster and
  // wired into the profile infobox, and this function was not told — so the
  // WIKI tab, the one place meant to read like an encyclopedia entry, showed
  // none of what had just been written for it.
  //
  // Age is derived from the birthdate when there is one and only falls back to
  // the stored number otherwise: a stored age is wrong from the next birthday
  // until somebody re-publishes.
  const bio = {
    age: _ageFrom(rosterRow.birthdate) ?? rosterRow.age ?? parsed.age ?? null,
    birthdate: rosterRow.birthdate || '',
    ethnicity: rosterRow.ethnicity || parsed.ethnicity || '',
    nationality: rosterRow.nationality || parsed.nationality || '',
    hometown: rosterRow.hometown || '',
    occupation: rosterRow.occupation || '',
    sexuality: rosterRow.sexuality || parsed.sexuality || '',
    gender: rosterRow.gender || '',
    archetype: rosterRow.archetype || '',
    descriptor: rosterRow.descriptor || '',
  };
  const backstory = rosterRow.backstory || '';
  // The casting interview, passed through as the stored string. Parsing it is
  // js/casting-interview.js's job and the view's business, not this one's.
  const castingInterview = rosterRow.castingInterview || '';
  const relationships = relationshipsOf(player, { seasonDocs });

  return {
    id: player.id,
    name: player.name,
    bio,
    // Stated only when something is actually known, so the page can skip the
    // line rather than printing an empty one.
    bioLine: [
      bio.age ? `${bio.age}` : '',
      [bio.ethnicity, bio.nationality].filter(Boolean).join(' '),
      bio.sexuality && bio.sexuality !== 'straight' ? bio.sexuality : '',
      // The two the encyclopedia entries lead with, and the two this line was
      // missing entirely.
      bio.occupation,
      bio.hometown,
      bio.archetype,
    ].filter(Boolean).join(' · '),
    backstory,
    castingInterview,
    personality: personalityOf(player.name, voices, rosterRow),
    career: _withLoyalties(careerOf(player, { seasonTitles, seasonDocs, seasonAir }), relationships),
    relationships,
    couple: coupleStatus(relationships),
    // What happened to them between seasons. APPROVED ONLY — a proposal is a
    // suggestion, and a suggestion must not change what a page says about
    // somebody. Ordered by the franchise calendar, because `seq` is per-player
    // and a two-person event carries the numbering of whoever's row it is.
    life: approvedFor(player.id, lifeEvents, { seasonRank }).map(e => ({
      ...e,
      // The roster is already here for the personality; it is also the only
      // place a gender lives, and without it every one-person sentence in the
      // log came out in singular they on the page of somebody whose gender the
      // franchise has always known.
      line: lifeLine(e, lifeNames, player.id, _lifeGenders),
      // Dated here, where the season records already are, so the view does not
      // need its own copy of the calendar to print a label.
      when: airLabel(seasonAir.get(e.afterSeason) || {}),
    })),
    // ── WHAT THE ARTICLE CAN LINK ──────────────────────────────────
    //
    // A wiki links. Every season it names, every houseguest it names — that is
    // most of what makes one read like an encyclopedia rather than a report,
    // and the prose on this page was flat text with the links only ever in the
    // tables. These two are the lookup the view linkifies against.
    //
    // The roster is the widest name list there is (152 people, slug and all),
    // and the per-season cast above covers anybody the roster has not caught
    // up with yet.
    people: (roster.players || roster || [])
      .filter(r => r && r.name && r.slug)
      .map(r => ({ name: r.name, slug: r.slug })),
    // title -> the season page it links to. `seasonTitles` is keyed by both
    // seasonId and season number with the same title behind each; the string
    // key is the one season_ref.html wants.
    seasonLinks: [...seasonTitles.entries()]
      .filter(([k, v]) => typeof k === 'string' && v)
      .map(([id, title]) => ({ id, title })),
    records: recordsHeldBy(player.id, milestonesByShow),
    // Computed trivia, keyed by show — the article is scoped to one show and
    // picks. Derived in js/player-trivia.js from every career in that format,
    // which is why it arrives pre-computed rather than being worked out here:
    // one player's fact is a statement about everybody else's record.
    computedTrivia: Object.fromEntries(
      Object.entries(triviaByShow).map(([f, byPlayer]) => [f, byPlayer[player.id] || []])),
    moments: (player.seasonDetails || []).flatMap(d =>
      (d.keyMoments || []).map(text => ({
        text, season: d.season, format: fmtOf(d), seasonId: d.seasonId,
      }))),
  };
}

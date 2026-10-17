// ══════════════════════════════════════════════════════════════════════
// ch/export.js — a finished Challenge season, in the shape the site reads
// ══════════════════════════════════════════════════════════════════════
//
// Sub-project 6. The aired rows and the season's ledger record in, the season document out: the season page,
// the wiki, the rankings board, players_database (careers, and through it the life layer) and the publish step
// all read it. PURE: no DOM, no fetch, so a test builds one from a headless season.
//
// What docs/ADDING-A-SHOW.md asks of every show, and where it is here:
//   §5   seasonNumber / format / seasonId, placements[] (name, playerSlug, placement, status), winner, twists[],
//        and a per-round array in a shape the site already reads: votingHistory[], one row per episode. The
//        house vote is ballots said out loud ({ voter, target, channel: 'house' }); the Arena's loser is
//        `eliminated`; every other door (a quit, a medical, a disqualification, the Purge) is on `exits[]` with
//        the verb the run gave it, so no exit is printed in another's words.
//   §8.4 placements come FROM THE LEDGER RECORD (ch/ledger-record.js), name for name and place for place: the
//        canon loader (legacy-canon.js) compares the two and rebuilds a record that differs from the document,
//        which would throw away the allies, rivals, showmances and betrayals only the record holds.
//   §8.4 more than one champion: every champion is placement 1 and `winners[]` carries them all.
//   careerStats: `ch.dailyWins`, `ch.arenaWins`, `ch.timesVotedIn` on every placement row (registry), read by
//        the record book, the rankings board (rankings-update.js) and the published ledger's `stats`.
//   The life layer (life-hook.js / life-resolver.js) reads an appearance's `showmance` and `showmanceEnded`
//        ('intact' | 'broken'), its `alliances` and `rivalries`, and `showmanceStrength` (0..1).
import { SHOWS, seasonId, exitVerbs, CHALLENGE_FORMAT } from '../shows.js';
import { TWIST_CATALOG } from '../core.js';

export const CHALLENGE = CHALLENGE_FORMAT;
const slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** `data/seasons/ch-1-data.json`, from the registry's prefix. */
export const seasonFilePath = n => `data/seasons/${seasonId(CHALLENGE, n)}-data.json`;

// The run's exit channels (ch-run.js VERB), as a placement status.
const STATUS = { arena: 'Eliminated', instant: 'Eliminated', quit: 'Quit', medical: 'Medical', disqualified: 'Disqualified', purge: 'Purged' };

// ── the rounds ─────────────────────────────────────────────────────────
export function chVotingHistory(rows = []) {
  return rows.filter(r => !r.ch?.final).map(r => {
    const ch = r.ch || {};
    const exits = (r.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb, channel: x.channel || null, ...(x.by ? { by: x.by } : {}) }));
    const arena = exits.find(x => x.channel === 'arena' || x.channel === 'instant') || null;
    return {
      episode: r.num,
      division: ch.division || null,
      // the Arena's loser: every reader of `eliminated` means the elimination
      eliminated: arena?.name || null,
      eliminatedSlug: arena ? arena.slug : '',
      exits,
      // the house vote, said out loud; ballots on more than one vote in a night (a double) keep their order
      votes: (ch.votes || []).flatMap((v, i) => (v.ballots || []).map(b => ({ voter: b.voter, voterSlug: slug(b.voter),
        target: b.target, targetSlug: slug(b.target), channel: 'house', ...(ch.votes.length > 1 ? { vote: i + 1 } : {}) }))),
      votedIn: [...(ch.votedIn || [])],
      tally: Object.assign({}, ...(ch.votes || []).map(v => v.tally || {})),
      tiebreak: (ch.votes || []).map(v => v.tiebreak).find(Boolean) || null,
      daily: ch.daily ? { id: ch.daily.id || null, name: ch.daily.name || null, mode: ch.daily.mode || null } : null,
      dailyWinners: [...(ch.dailyWinners || [])],
      callouts: (ch.callouts || []).map(c => ({ by: c.by, opponent: c.opponent, reason: c.reason || null })),
      arena: (ch.arena || []).map(d => ({ winner: d.winner, loser: d.loser, game: d.game || null })),
      twist: ch.twist || null,
      ...(ch.purged ? { purged: ch.purged } : {}),
      ...(ch.returnArena ? { returnArena: { ...ch.returnArena } } : {}),
      ...(ch.tribunal ? { tribunal: { tribunal: [...ch.tribunal.tribunal], nominees: [...ch.tribunal.nominees], chosen: ch.tribunal.chosen } } : {}),
    };
  });
}

/** The final: who ran it, the totals, the champions, and anybody who left during it. */
export function chFinal(rows = []) {
  const f = rows.find(r => r.ch?.final)?.ch?.final;
  if (!f) return null;
  const row = rows.find(r => r.ch?.final);
  return {
    episode: row.num,
    finalists: [...(f.finalists || [])],
    champions: [...(f.champions || [])],
    placements: { ...(f.placements || {}) },
    totals: { ...(f.totals || {}) },
    checkpoints: (f.checkpoints || []).length,
    exits: (row.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb, channel: x.channel || null })),
  };
}

// ── the twists that PLAYED, as the catalogue names them ────────────────
export function chTwistsPlayed(rows = [], options = {}) {
  const mine = TWIST_CATALOG.filter(t => t.format === CHALLENGE);
  const out = [];
  for (const r of rows) {
    const t = r.ch?.twist && mine.find(x => x.chTwist === r.ch.twist);
    if (t) out.push({ episode: r.num, type: t.id, name: t.name });
  }
  // the season's switches (the setup panel), as season-long twists
  if (options.finalPass === 'skull') out.push({ episode: null, type: 'ch-red-skull', name: 'The Red Skull' });
  if (options.finalPass === 'ring') out.push({ episode: null, type: 'ch-final-ring', name: 'The Final Ring' });
  if (options.redemption) out.push({ episode: null, type: 'ch-redemption', name: 'Redemption House' });
  if (options.partnerWeeks) out.push({ episode: null, type: 'ch-partners', name: 'Partner Weeks' });
  return out;
}

// ── a player's appearance ──────────────────────────────────────────────
// The showmance an appearance names (one field): the one still together at the end, else the last one.
function mainShowmance(list = []) {
  const intact = list.filter(s => s.ended !== 'breakup');
  const pick = (intact.length ? intact : list).slice().sort((a, b) => (b.since || 0) - (a.since || 0))[0];
  return pick || null;
}

/** placements[], from the ledger record (§8.4: the canon loader compares them place for place). */
export function chPlacements(rows = [], record = null) {
  const history = chVotingHistory(rows);
  const final = chFinal(rows);
  const recPlayers = record?.players || {};
  const names = Object.keys(recPlayers).length ? Object.keys(recPlayers)
    : [...new Set([...history.flatMap(h => h.exits.map(x => x.name)), ...(final?.finalists || [])])];
  // every exit, the last one counting (a player who came back left twice)
  const lastExit = new Map();
  for (const h of history) for (const x of h.exits) lastExit.set(x.name, { ...x, episode: h.episode });
  for (const x of final?.exits || []) lastExit.set(x.name, { ...x, episode: final.episode });
  const champs = new Set(final?.champions || []);
  const out = names.map(n => {
    const r = recPlayers[n] || {};
    const x = lastExit.get(n);
    const champion = champs.has(n) || !!r.winner;
    const finalist = champion || (final?.finalists || []).includes(n) || !!r.finalist;
    // a finalist who quit or was pulled during the final left by that door
    const status = champion ? 'Winner' : (x && x.episode === final?.episode) ? STATUS[x.channel] || cap(x.verb)
      : finalist ? 'Finalist' : x ? STATUS[x.channel] || cap(x.verb) : 'Eliminated';
    const votesReceived = history.reduce((t, h) => t + h.votes.filter(v => v.target === n).length, 0);
    const shows = r.showmances || [];
    const main = mainShowmance(shows);
    return {
      name: n, playerSlug: r.slug || slug(n),
      placement: r.placement || 0,
      status,
      ...(champion ? { champion: true } : {}),
      exit: champion || (finalist && !(x && x.episode === final?.episode)) ? null : x?.verb || null,
      exitEpisode: champion || (finalist && !(x && x.episode === final?.episode)) ? null : x?.episode ?? null,
      division: r.ch?.division || null,
      rookie: !!r.ch?.rookie,
      archetype: r.archetype || null,
      challengeWins: r.ch?.dailyWins || 0,
      votesReceived,
      // the registry's careerStats paths (js/shows.js), and the rest of the show's numbers
      ch: { dailyWins: r.ch?.dailyWins || 0, arenaWins: r.ch?.arenaWins || 0, arenaLosses: r.ch?.arenaLosses || 0,
        timesVotedIn: r.ch?.timesVotedIn || 0, calledOut: r.ch?.calledOut || 0, volunteered: r.ch?.volunteered || 0 },
      // who they were to the others: the ledger's own judgement, for careers and the life layer
      alliances: [...(r.allies || [])],
      unbreakableBonds: [...(r.closest || [])],
      rivalries: [...(r.rivals || [])],
      betrayed: [...(r.betrayed || [])],
      betrayedBy: [...(r.betrayedBy || [])],
      ...(main ? { showmance: main.partner, showmanceEnded: main.ended === 'breakup' ? 'broken' : 'intact',
        ...(main.strength != null ? { showmanceStrength: main.strength } : {}),
        ...(main.overlapping ? { showmanceOverlapping: true } : {}) } : {}),
      ...(shows.length ? { showmances: shows.map(s => ({ partner: s.partner, ended: s.ended === 'breakup' ? 'broken' : 'intact',
        since: s.since || 0, ...(s.endedEp ? { endedEp: s.endedEp } : {}), ...(s.strength != null ? { strength: s.strength } : {}),
        ...(s.overlapping ? { overlapping: true } : {}) })) } : {}),
      popularity: Math.round((Number(r.popularity) || 0) * 10) / 10,
    };
  });
  return out.sort((a, b) => (a.placement || 99) - (b.placement || 99) || a.name.localeCompare(b.name));
}

/** The season document. `options` are the season's switches (ch-run.js inputs.options). */
export function buildChallengeSeasonDocument(rows = [], record = null, { seasonNumber = 1, options = {}, title = null } = {}) {
  const regular = rows.filter(r => !r.ch?.final);
  const final = chFinal(rows);
  const placements = chPlacements(rows, record);
  const champions = placements.filter(p => p.status === 'Winner');
  const byDiv = d => placements.filter(p => p.division === d && p.status !== 'Winner').sort((a, b) => (a.placement || 99) - (b.placement || 99))[0];
  const winners = champions.map(c => ({ name: c.name, playerSlug: c.playerSlug, division: c.division,
    runnerUp: byDiv(c.division)?.name || null }));
  return {
    seasonNumber: Number(seasonNumber),
    format: CHALLENGE,
    seasonId: seasonId(CHALLENGE, seasonNumber),
    title: title || record?.seasonName || `${SHOWS[CHALLENGE].name} ${Number(seasonNumber)}`,
    castSize: placements.length,
    episodeCount: regular.length + (final ? 1 : 0),
    // one champion a division: winners[] carries each; the one-winner block only when there is one
    winners,
    winner: winners.length === 1 ? { name: winners[0].name, playerSlug: winners[0].playerSlug, vote: null, runnerUp: winners[0].runnerUp } : null,
    divisions: !!options.gendered || new Set(placements.map(p => p.division).filter(Boolean)).size > 1,
    final,
    placements,
    votingHistory: chVotingHistory(rows),
    twists: chTwistsPlayed(rows, options),
    settings: { gendered: !!options.gendered || new Set(placements.map(p => p.division).filter(Boolean)).size > 1, finalPass: options.finalPass || null, redemption: !!options.redemption,
      partnerWeeks: options.partnerWeeks !== false, romance: options.romance !== false },
    emoji: SHOWS[CHALLENGE].emoji,
    exitVerbs: exitVerbs(CHALLENGE),
  };
}

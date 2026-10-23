// ══════════════════════════════════════════════════════════════════════
// rr/export.js — a finished Ridonculous Race season, in the shape the site reads
// ══════════════════════════════════════════════════════════════════════
//
// The aired rows (rr-run.js raceRows) and the season's ledger record (rr/ledger-record.js) in, the season document
// out: the season page, the wiki, the rankings board, players_database (careers, and through it the life layer) and
// the publish step read it. PURE: no DOM, no fetch, so a test builds one from a headless season. Written 2026-10-19:
// until then the race had no exporter, and publishing a race season fell back to Total Drama's.
//
// What docs/ADDING-A-SHOW.md asks of every show, and where it is here:
//   §5   seasonNumber / format / seasonId, placements[] (name, playerSlug, placement, status), winners, and a
//        per-round array the site reads: votingHistory[], one row per leg. THERE IS NO VOTE: `votes` is always
//        empty; the leg's check-in order is `order`; the team that went home is on `exits[]` (both of them) with
//        the verb the run gave it, and `eliminated` names its first racer for the readers that want one name.
//   §8.4 placements come FROM THE LEDGER RECORD, name for name and place for place: both partners of a team share
//        its place. The winners are a team: `winners[]` carries both; the one-winner block stays empty.
//   careerStats: `rr.legWins`, `rr.lasts` on every placement row (js/shows.js), read by the record book and the
//        rankings board.
//   The life layer (life-hook.js / life-resolver.js) reads an appearance's `showmance` and `showmanceEnded`, and
//        here `showmanceStage` too: a couple team leaves dating, engaged (a yes on the mat) or married.
//   What a wiki, trivia and awards are made from (2026-10-23, rr/leg-record.js): every leg's `order` carries each
//        team's check-in time, clock, gap to the winner and penalty with its reasons; each leg has its `challenges`
//        (every run: the side, who did it, the tries, the minutes), `reward`, `passes`, `boomerangVote`, `sabotage`,
//        `fears` and `hurt`; every placement's `rr` has the place on each leg and the season's numbers.
import { SHOWS, seasonId, exitVerbs, RACE_FORMAT } from '../shows.js';

export const RACE = RACE_FORMAT;
const slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** `data/seasons/rr-1-data.json`, from the registry's prefix. */
export const seasonFilePath = n => `data/seasons/${seasonId(RACE, n)}-data.json`;

// The run's exit channels (rr-run.js VERB), as a placement status.
const STATUS = { last: 'Eliminated', 'on-location': 'Eliminated', midpoint: 'Eliminated', quit: 'Quit', medevac: 'Medical',
  disqualified: 'Disqualified' };

// ── the legs ───────────────────────────────────────────────────────────
// a leg's order, each team with its check-in from the leg's record (a row built before 2026-10-23 has none)
const orderOf = rr => (rr.order || []).map(o => {
  const d = rr.detail?.teams?.find(x => x.team === o.name);
  return { team: o.name, members: [o.a, o.b].filter(Boolean), place: o.place,
    ...(d ? { time: d.time, clock: d.clock, day: d.day, gap: d.gap, arrived: d.arrived, penalty: d.penalty,
      ...(d.penaltyReasons ? { penaltyReasons: d.penaltyReasons } : {}), ...(d.departsNextLeg != null ? { departsNextLeg: d.departsNextLeg } : {}) } : {}) };
});
// the rest of the leg's record
const detailOf = rr => {
  const d = rr.detail;
  if (!d) return {};
  return { clockStart: d.clockStart, route: d.route, challenges: d.challenges, reward: d.reward, passes: d.passes,
    boomerangVote: d.boomerangVote, sabotage: d.sabotage, fears: d.fears, hurt: d.hurt, nonElim: d.nonElim, saved: d.saved,
    onLocation: d.onLocation, money: d.money };
};

export function rrVotingHistory(rows = []) {
  return rows.filter(r => r.rr && r.rr.kind !== 'final').map(r => {
    const rr = r.rr;
    const exits = (r.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb, channel: x.channel || null,
      ...(x.team ? { team: x.team } : {}) }));
    return {
      episode: r.num,
      leg: rr.leg,
      place: rr.placeName || rr.place || null,
      kind: rr.kind,
      nonElimination: rr.kind === 'non',
      // nobody votes on this show
      votes: [],
      eliminated: exits[0]?.name || null,
      eliminatedSlug: exits[0]?.slug || '',
      exits,
      order: orderOf(rr),
      legWinners: rr.order?.[0] ? [rr.order[0].a, rr.order[0].b].filter(Boolean) : [],
      twist: rr.twist || null,
      ...detailOf(rr),
    };
  });
}

/** The final leg: the finishing order, the winners and the team cut at the halfway mat. */
export function rrFinal(rows = []) {
  const row = rows.find(r => r.rr?.kind === 'final');
  if (!row) return null;
  const rr = row.rr;
  return {
    episode: row.num,
    place: rr.placeName || rr.place || null,
    winners: [...(rr.final?.winners || [])],
    order: orderOf(rr),
    exits: (row.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb, channel: x.channel || null })),
    ...detailOf(rr),
  };
}

// The couple an appearance names: the partner when the two of them are a couple (they leave at a stage), else the
// showmance still together at the end, else the last one.
function mainShowmance(list = []) {
  const team = list.find(s => s.team);
  if (team) return team;
  const intact = list.filter(s => s.ended !== 'breakup');
  return (intact.length ? intact : list).slice().sort((a, b) => (b.since || 0) - (a.since || 0))[0] || null;
}

// A racer's season, from the legs' records: the place on every leg they ran, and the numbers awards are made from.
function racerLegs(n, legs) {
  const legPlaces = [];
  const out = { challenges: 0, solo: 0, fails: 0, switches: 0, quits: 0, fearsFaced: 0, fearsBeaten: 0, hurt: 0,
    expressUsed: 0, savesUsed: 0, boomerangsThrown: 0, boomerangedBy: 0, sabotaged: 0, sabotagedBy: 0, penaltyLegs: 0 };
  let team = null;
  for (const h of legs) {
    const o = (h.order || []).find(x => x.members.includes(n));
    if (!o) continue;
    team = o.team;
    legPlaces.push({ leg: h.leg ?? h.n ?? legPlaces.length + 1, place: o.place });
    if (o.penalty) out.penaltyLegs++;
    for (const c of h.challenges || []) for (const r of c.runs) {
      if (r.team !== team) continue;
      out.challenges++;
      if (r.by.length === 1 && r.by[0] === n) out.solo++;
      out.fails += r.fails || 0;
      if (r.switched) out.switches++;
      if (r.quit) out.quits++;
    }
    for (const f of h.fears || []) if (f.racer === n) { out.fearsFaced++; if (['overcomes', 'talked-down', 'panic-break', 'relents'].includes(f.ending)) out.fearsBeaten++; }
    for (const x of h.hurt || []) if (x.racer === n) out.hurt++;
    for (const p of h.passes || []) {
      if (p.team === team && p.pass === 'express') out.expressUsed++;
      if (p.team === team && p.pass === 'save') out.savesUsed++;
      if (p.team === team && p.pass === 'boomerang' && !p.wasted) out.boomerangsThrown++;
      if (p.on === team && p.pass === 'boomerang') out.boomerangedBy++;
    }
    if (h.boomerangVote?.target === team) out.boomerangedBy++;
    for (const s of h.sabotage || []) { if (s.by === team) out.sabotaged++; if (s.on === team) out.sabotagedBy++; }
  }
  const places = legPlaces.map(x => x.place);
  return { legPlaces, ...(places.length ? { bestPlace: Math.min(...places), worstPlace: Math.max(...places),
    averagePlace: Math.round(places.reduce((a, b) => a + b, 0) / places.length * 10) / 10 } : {}), ...out };
}

/** placements[], from the ledger record (§8.4). */
export function rrPlacements(rows = [], record = null) {
  const history = rrVotingHistory(rows);
  const final = rrFinal(rows);
  const legs = [...history, ...(final ? [{ ...final, leg: rows.find(r => r.rr?.kind === 'final')?.rr?.leg }] : [])];
  const recPlayers = record?.players || {};
  const lastExit = new Map();
  for (const h of history) for (const x of h.exits) lastExit.set(x.name, { ...x, episode: h.episode });
  for (const x of final?.exits || []) lastExit.set(x.name, { ...x, episode: final.episode });
  const winners = new Set(final?.winners || []);
  const out = Object.entries(recPlayers).map(([n, r]) => {
    const x = lastExit.get(n);
    const winner = winners.has(n) || !!r.winner;
    const finalist = winner || !!r.finalist;
    const status = winner ? 'Winner' : (x && x.episode === final?.episode) ? (STATUS[x.channel] || cap(x.verb))
      : finalist ? 'Finalist' : x ? (STATUS[x.channel] || cap(x.verb)) : 'Eliminated';
    const shows = r.showmances || [];
    const main = mainShowmance(shows);
    const rr = r.rr || {};
    return {
      name: n, playerSlug: r.slug || slug(n),
      placement: r.placement || 0,
      status,
      ...(winner ? { champion: true } : {}),
      exit: winner || (finalist && !(x && x.episode === final?.episode)) ? null : x?.verb || null,
      exitEpisode: winner || (finalist && !(x && x.episode === final?.episode)) ? null : x?.episode ?? null,
      partner: rr.partner || null,
      team: rr.team || null,
      relationship: rr.rel || null,
      identity: rr.identity || null,
      archetype: r.archetype || null,
      challengeWins: rr.legWins || 0,
      votesReceived: 0,
      // the registry's careerStats paths (js/shows.js), and the rest of the race's numbers
      rr: { legWins: rr.legWins || 0, lasts: rr.lasts || 0, penalties: rr.penalties || 0, begged: rr.begged || 0,
        sabotage: rr.sabotage || 0, helped: rr.helped || 0, ...racerLegs(n, legs) },
      alliances: [...(r.allies || [])],
      rivalries: [...(r.rivals || [])],
      betrayed: [...(r.betrayed || [])],
      betrayedBy: [...(r.betrayedBy || [])],
      ...(main ? { showmance: main.partner, showmanceEnded: main.ended === 'breakup' ? 'broken' : 'intact',
        ...(main.strength != null ? { showmanceStrength: main.strength } : {}),
        ...(main.stage ? { showmanceStage: main.stage } : {}) } : {}),
      ...(shows.length ? { showmances: shows.map(s => ({ partner: s.partner, ended: s.ended === 'breakup' ? 'broken' : 'intact',
        since: s.since || 0, ...(s.endedEp ? { endedEp: s.endedEp } : {}), ...(s.strength != null ? { strength: s.strength } : {}),
        ...(s.stage ? { stage: s.stage } : {}), ...(s.team ? { team: true } : {}) })) } : {}),
      popularity: Math.round((Number(r.popularity) || 0) * 10) / 10,
    };
  });
  return out.sort((a, b) => (a.placement || 99) - (b.placement || 99) || a.name.localeCompare(b.name));
}

// The teams as they finished, best first: both partners share a place.
function teamsOf(placements) {
  const seen = new Set(), out = [];
  for (const p of placements) {
    if (!p.partner || seen.has(p.name)) continue;
    seen.add(p.name); seen.add(p.partner);
    out.push({ team: p.team, members: [p.name, p.partner], placement: p.placement, status: p.status,
      relationship: p.relationship, identity: p.identity });
  }
  return out.sort((a, b) => (a.placement || 99) - (b.placement || 99));
}

/** The season document. */
export function buildRaceSeasonDocument(rows = [], record = null, { seasonNumber = 1, title = null } = {}) {
  const legs = rows.filter(r => r.rr);
  const final = rrFinal(legs);
  const placements = rrPlacements(legs, record);
  const winnersRows = placements.filter(p => p.status === 'Winner');
  const winners = winnersRows.map(w => ({ name: w.name, playerSlug: w.playerSlug, team: w.team }));
  return {
    seasonNumber: Number(seasonNumber),
    format: RACE,
    seasonId: seasonId(RACE, seasonNumber),
    title: title || record?.seasonName || `${SHOWS[RACE].name} ${Number(seasonNumber)}`,
    castSize: placements.length,
    episodeCount: legs.length,
    // the winners are a team: both on winners[]; the one-winner block stays empty
    winners,
    winner: null,
    winningTeam: winnersRows[0]?.team || null,
    final,
    placements,
    teams: teamsOf(placements),
    votingHistory: rrVotingHistory(legs),
    twists: [],
    settings: {},
    emoji: SHOWS[RACE].emoji,
    exitVerbs: exitVerbs(RACE),
  };
}

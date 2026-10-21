// ══════════════════════════════════════════════════════════════════════
// ci/export.js — a finished Circle season, in the shape the site reads
// ══════════════════════════════════════════════════════════════════════
//
// The aired rows and the season's ledger record in, the season document out:
// the season page, the wiki, the rankings board, players_database (careers,
// and through it the life layer) and the publish step all read it. PURE: no
// DOM, no fetch, so a test builds one from a headless season. The Challenge's
// exporter (js/ch/export.js) is the pattern.
//
// What docs/ADDING-A-SHOW.md asks of every show, and where it is here:
//   §5   seasonNumber / format / seasonId, placements[] (name, playerSlug,
//        placement, status), winner, twists[], and a per-round array in a
//        shape the site already reads: votingHistory[], one row per episode.
//        Nobody votes anybody out in the Circle, so `votes` is always empty:
//        a rating is a ranking, and a reader that counts ballots against
//        somebody must never count a 6th place as one. The night's rating is
//        on `ratings`, beside it. Every block is on `exits[]` with the
//        registry's verb ('blocked') and how it was decided (`channel`).
//   §8.4 placements come FROM THE LEDGER RECORD (ci/ledger-record.js), name
//        for name and place for place, as a standard ranking of people: two
//        people sharing a profile share its place (and both win, if it won).
//   careerStats: `ci.influencerTimes`, `ci.firstPlaces`, `ci.blocksMade`,
//        `ci.catfishSeasons` on every placement row (registry).
//   The life layer reads `showmance`, `showmanceEnded`, `alliances`,
//        `rivalries`, `betrayed` and `betrayedBy` off each appearance.
//
// It is about PEOPLE. A profile is the room's name for one or two of them,
// and a catfish's profile is somebody they are not: every count below is
// credited to the people behind the profile the room saw.
import { SHOWS, seasonId, exitVerbs, CIRCLE_FORMAT } from '../shows.js';
import { TWIST_CATALOG } from '../core.js';
import { sentencesOf } from '../vp-ci/twist-alert.js';

export const CIRCLE = CIRCLE_FORMAT;
const slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** `data/seasons/ci-1-data.json`, from the registry's prefix. */
export const seasonFilePath = n => `data/seasons/${seasonId(CIRCLE, n)}-data.json`;

// The people behind a profile on the day of a row (a swap or a second chance
// changes who is behind one, so the row's own map is the one to ask).
const peopleAt = (row, h) => [...(row?.ci?.profiles?.[h]?.people || [])];
const shownAt = (row, h) => row?.ci?.profiles?.[h]?.name || null;
// The rating a row holds, if it held one (a ratings night, or the final ratings).
const ratingOf = row => (row?.ci?.rating && Array.isArray(row.ci.rating.results) ? row.ci.rating : null);

// ── the rounds ─────────────────────────────────────────────────────────
export function ciVotingHistory(rows = []) {
  return rows.map(r => {
    const exits = (r.exits || []).map(x => ({ name: x.name, slug: slug(x.name), verb: x.verb || 'blocked',
      channel: x.channel || 'blocking', profile: x.profile || null, by: [...(x.by || [])], ...(x.secret ? { secret: true } : {}) }));
    const rating = ratingOf(r);
    return {
      episode: r.num,
      // the first person blocked: every reader of `eliminated` means the one who left
      eliminated: exits[0]?.name || null,
      eliminatedSlug: exits[0]?.slug || '',
      exits,
      votes: [],
      night: r.ci?.night?.format || null,
      ...(rating ? { ratings: {
        final: !!rating.final,
        hidden: !!rating.hidden,
        results: rating.results.map(x => ({ profile: shownAt(r, x.profile), people: peopleAt(r, x.profile), place: x.place, avg: x.avg })),
        influencers: (rating.influencers || []).map(h => shownAt(r, h)).filter(Boolean),
      } } : {}),
    };
  });
}

// ── the twists that PLAYED, as the catalogue names them ────────────────
// Each kind of catalogue entry is found by what it leaves on the rows: a
// blocking format on the episode whose ratings it decided, an identity twist,
// arrival or power by the scene it aired.
//
// A night's format: the row that holds the night is the episode the
// Influencers were named in, and its blocking airs at the start of the NEXT
// one (season.js `tonight`), whose Hangout says which format really ran. That
// Hangout is the truth when there is one: a booked format that could not run
// fell back, and the Hangout ran as what it fell back to. Credited once, to
// the night, never again to the episode the blocking aired in.
//
// Snoop and Choose is how every newcomer comes in unless something else was
// booked: the default door, not a twist, so it is not listed.
const ENTRY_SCENE = { egg: 'egg', date: 'date', invites: 'invites', race: 'race', party: 'newparty',
  lurk: 'lurk', chosen: 'chosen', pair: 'pair-arrival' };
// Only the powers that leave a scene of their own; immunity and an unexposed
// burner are invisible on the rows, so they are not claimed.
const POWER_SCENE = { hacker: 'hack', joker: 'joker-pick', burner: 'burner-exposed' };

export function ciTwistsPlayed(rows = []) {
  const mine = TWIST_CATALOG.filter(t => t.format === CIRCLE);
  const out = [];
  // One entry per twist, with every episode it ran in and how it works in the room's words (the wiki printed
  // "No description is recorded for this twist", once per episode).
  const add = (episode, t) => {
    if (!t) return;
    const o = out.find(x => x.type === t.id);
    if (!o) out.push({ episode, episodes: [episode], type: t.id, name: t.name, desc: sentencesOf(t.desc).join(' ') });
    else if (!o.episodes.includes(episode)) o.episodes.push(episode);
  };
  for (const [i, r] of rows.entries()) {
    const kinds = new Set((r.ci?.aired || []).map(s => s.kind));
    if (r.ci?.night) {
      const hangout = (rows[i + 1]?.ci?.aired || []).find(s => s.kind === 'hangout' && s.d?.format);
      const ran = hangout ? hangout.d.format : r.ci.night.fellBack ? null : r.ci.night.format;
      if (ran && ran !== 'standard') add(r.num, mine.find(t => t.ciFormat === ran));
    }
    for (const t of mine) {
      if (t.ciTwist && kinds.has(t.ciTwist)) add(r.num, t);
      if (t.ciEvent && kinds.has(t.ciEvent)) add(r.num, t);
      if (t.ciEntry && kinds.has(ENTRY_SCENE[t.ciEntry])) add(r.num, t);
      if (t.ciPower && kinds.has(POWER_SCENE[t.ciPower])) add(r.num, t);
    }
  }
  return out;
}

// ── what each person did, across the season ────────────────────────────
/** Per person: Influencer nights, first places in a rating, blocks made, profiles worn. */
export function ciCounts(rows = []) {
  const c = {};
  const of = n => (c[n] ||= { influencerTimes: 0, firstPlaces: 0, blocksMade: 0, catfish: false, places: [],
    profile: null, mode: null, personaId: null, sharedWith: [] });
  for (const r of rows) {
    for (const [h, p] of Object.entries(r.ci?.profiles || {})) {
      for (const n of p.people || []) {
        const x = of(n);
        // The profile they ended on is the one the room knew them by last.
        x.profile = p.name || x.profile; x.mode = p.mode || x.mode; x.personaId = p.personaId ?? x.personaId;
        if (p.mode === 'catfish') x.catfish = true;
        for (const o of p.people) if (o !== n && !x.sharedWith.includes(o)) x.sharedWith.push(o);
      }
    }
    const rating = ratingOf(r);
    if (rating) {
      for (const h of rating.influencers || []) for (const n of peopleAt(r, h)) of(n).influencerTimes++;
      for (const res of rating.results) for (const n of peopleAt(r, res.profile)) {
        if (res.place === 1) of(n).firstPlaces++;
        if (!rating.final) of(n).places.push(res.place);
      }
    }
    // A block is made by the profiles named on it, once per profile blocked.
    const byName = new Map(Object.entries(r.ci?.profiles || {}).map(([h, p]) => [p.name, h]));
    const seen = new Set();
    for (const x of r.exits || []) {
      const key = x.profile || x.name;
      if (seen.has(key)) continue;
      seen.add(key);
      for (const shown of x.by || []) for (const n of peopleAt(r, byName.get(shown))) of(n).blocksMade++;
    }
  }
  return c;
}

// The showmance an appearance names (one field): the one still together at the end, else the first.
function mainShowmance(list = []) {
  return list.find(s => s.ended !== 'breakup') || list[0] || null;
}

/** placements[], from the ledger record (§8.4: the canon loader compares them place for place). */
// The author's photos for a player, as published (`ci.photos`): their own slots, and the catfish profile the
// room saw. Ids only (`photo:<id>`, kept in R2 under gallery/circle-photos), so any browser can find them: the
// Dramagram button reads them here rather than from the simulator's config in one browser.
const onlyPhotos = o => Object.fromEntries(Object.entries(o || {}).filter(([, f]) => String(f || '').startsWith('photo:')));
function photosOfPlayer(name, c, photos) {
  if (!photos) return null;
  const own = onlyPhotos(photos.ciPhotos?.[name]);
  const persona = c.catfish && c.personaId ? (photos.pool || []).find(p => p?.id === c.personaId) : null;
  const theirs = persona && !persona.fromRoster ? onlyPhotos({ profile: persona.face, ...(persona.photos || {}) }) : {};
  return Object.keys(own).length || Object.keys(theirs).length ? { own, persona: theirs } : null;
}

export function ciPlacements(rows = [], record = null, photos = null) {
  const recPlayers = record?.players || {};
  const history = ciVotingHistory(rows);
  const lastExit = new Map();
  for (const h of history) for (const x of h.exits) lastExit.set(x.name, { ...x, episode: h.episode });
  const counts = ciCounts(rows);
  const fan = record?.fanFavorite || null;
  // Two people on one profile: a romance with it is its face's (the name and pictures it was had with). A record
  // built before that rule gave it to both (the site had Luis as Lila's showmance; it was Mateo), so it is put
  // right here too, from the rows: the partner becomes the face, and the other one of the two has none.
  const faceOf = new Map();
  for (const r of rows) for (const p of Object.values(r.ci?.profiles || {})) {
    if ((p.people || []).length < 2) continue;
    const face = p.people.find(x => x.split(' ')[0] === p.name) || p.people[0];
    for (const x of p.people) faceOf.set(x, face);
  }
  const romances = (n, list = []) => {
    if (faceOf.has(n) && faceOf.get(n) !== n) return [];
    const out = [];
    for (const s of list) { const partner = faceOf.get(s.partner) || s.partner; if (!out.some(o => o.partner === partner)) out.push({ ...s, partner }); }
    return out;
  };
  const out = Object.entries(recPlayers).map(([n, r0]) => {
    const r = { ...r0, showmances: romances(n, r0.showmances) };
    const c = counts[n] || { influencerTimes: 0, firstPlaces: 0, blocksMade: 0, catfish: false, places: [], sharedWith: [] };
    const x = lastExit.get(n);
    const winner = !!r.winner;
    const finalist = winner || !!r.finalist;
    const status = winner ? 'Winner' : finalist ? 'Finalist' : 'Blocked';
    const shows = r.showmances || [];
    const main = mainShowmance(shows);
    const avg = c.places.length ? Math.round((c.places.reduce((t, v) => t + v, 0) / c.places.length) * 100) / 100 : null;
    return {
      name: n, playerSlug: slug(n),
      placement: r.placement || 0,
      status,
      exit: finalist ? null : x?.verb || 'blocked',
      exitEpisode: finalist ? null : x?.episode ?? r.episodesLasted ?? null,
      // how they were blocked (the registry's verb is always 'blocked'; this is who decided)
      ...(finalist || !x ? {} : { blockedBy: x.channel, ...(x.by.length ? { blockedByProfiles: [...x.by] } : {}) }),
      archetype: r.archetype || null,
      challengeWins: 0,
      // nobody is voted against on the Circle: a low rating is not a vote
      votesReceived: 0,
      ...(fan && fan === n ? { fanFavourite: true } : {}),
      // the registry's careerStats paths (js/shows.js), and the rest of the show's numbers
      ci: {
        influencerTimes: c.influencerTimes, firstPlaces: c.firstPlaces, blocksMade: c.blocksMade,
        catfishSeasons: c.catfish ? 1 : 0,
        profile: c.profile || null, mode: c.mode || null,
        ...(r.playedAs ? { playedAs: r.playedAs } : {}),
        ...(c.sharedWith.length ? { sharedWith: [...c.sharedWith] } : {}),
        avgRating: avg,
        ...(() => { const ph = photosOfPlayer(n, c, photos); return ph ? { photos: ph } : {}; })(),
      },
      // who they were to the others: the ledger's own judgement, for careers and the life layer
      alliances: [...(r.allies || [])],
      unbreakableBonds: [],
      rivalries: [...(r.rivals || [])],
      betrayed: [...(r.betrayed || [])],
      betrayedBy: [...(r.betrayedBy || [])],
      ...(main ? { showmance: main.partner, showmanceEnded: main.ended === 'breakup' ? 'broken' : 'intact' } : {}),
      ...(shows.length > 1 ? { showmances: shows.map(s => ({ partner: s.partner, ended: s.ended === 'breakup' ? 'broken' : 'intact' })) } : {}),
      popularity: Math.round((Number(r.popularity) || 0) * 10) / 10,
    };
  });
  return out.sort((a, b) => (a.placement || 99) - (b.placement || 99) || a.name.localeCompare(b.name));
}

/** The season document. */
export function buildCircleSeasonDocument(rows = [], record = null, { seasonNumber = 1, title = null, photos = null } = {}) {
  const placements = ciPlacements(rows, record, photos);
  const champions = placements.filter(p => p.status === 'Winner');
  const runnerUp = placements.find(p => p.status !== 'Winner')?.name || null;
  const winners = champions.map(c => ({ name: c.name, playerSlug: c.playerSlug, runnerUp }));
  const finalRating = rows.map(ratingOf).filter(r => r && r.final).at(-1);
  const finalRow = rows.find(r => ratingOf(r) === finalRating);
  const fan = record?.fanFavorite || null;
  const recName = record?.seasonName && record.seasonName !== SHOWS[CIRCLE].name ? record.seasonName : null;
  return {
    seasonNumber: Number(seasonNumber),
    format: CIRCLE,
    seasonId: seasonId(CIRCLE, seasonNumber),
    title: title || recName || `${SHOWS[CIRCLE].name} ${Number(seasonNumber)}`,
    castSize: placements.length,
    episodeCount: rows.length,
    // A shared profile wins as two people: winners[] carries both, the one-winner block only when there is one.
    winners,
    winner: winners.length === 1 ? { name: winners[0].name, playerSlug: winners[0].playerSlug, vote: null, runnerUp } : null,
    // The final ratings, as the room ranked each other: the board the season ended on.
    finalRatings: finalRating ? finalRating.results.map(x => ({ profile: shownAt(finalRow, x.profile),
      people: peopleAt(finalRow, x.profile), place: x.place, avg: x.avg })) : [],
    fanFavourite: fan ? { name: fan, playerSlug: slug(fan) } : null,
    // Who played as somebody else: the season's catfish, by the profile the room saw.
    catfish: placements.filter(p => p.ci.catfishSeasons).map(p => ({ name: p.name, profile: p.ci.profile,
      ...(p.ci.playedAs ? { playedAs: p.ci.playedAs } : {}), placement: p.placement })),
    placements,
    votingHistory: ciVotingHistory(rows),
    twists: ciTwistsPlayed(rows),
    emoji: SHOWS[CIRCLE].emoji,
    exitVerbs: exitVerbs(CIRCLE),
  };
}

// Kristal-talKs — the exit-interview podcast.
//
// Design: docs/superpowers/specs/2026-08-21-kristal-talks-v2-design.md
//
// Kristal hosted Disventure Camp season two and All Stars, and now she has a
// microphone and no production office to answer to. Two kinds of episode:
//
//   THE DEBRIEF — in the off-season right after a finale, the season's
//   emblematic players sit down and answer for it: what they did right, what
//   they did wrong, and the parts the edit only hinted at.
//
//   THE CATCH-UP — in any off-season, whoever's life just did something worth
//   an hour of audio: the engagement, the cancellation, the comeback.
//
// ── DERIVED, SEEDED, NO INBOX ──
//
// Episodes are computed from the published record and the APPROVED life log,
// pinned to (off-season, slot) exactly like Dramagram's moments: they exist the
// moment a season does, replay identically forever, and are stored nowhere.
// The podcast never invents a fact — it narrates ones the record already
// holds — so there is nothing to approve.
//
// ── NOT EVERYONE GETS INVITED ──
//
// An invitation is earned by having a story. Guests are chosen by a derived
// story score (placement, drama, rivalries, a showmance that ended badly), and
// a quiet mid-placement floater may go a whole career without an episode.
// That is the design working, not a hole in it.
//
// ── THE NUMBERS ARE ROSTER-FREE ──
//
// Voice styles (js/kristal-voice.js) come from archetype and stats and shape
// PROSE ONLY. Listeners, tiers, durations and follower deltas are computed
// from careers + seasons + life log alone, so the follower model — which runs
// without the roster in hand — can never disagree with this page about a
// number. tests/kristal.test.js holds that door shut.

import { airKey, airLabel, byAirDate } from './franchise-calendar.js';
import { significanceOf, lineFor } from './life-events.js';
import { fameOf } from './life-resolver.js';
import { showWords, engineOf } from './shows.js';
import { styleOf, voiceOf, composeEpisode, podcastAftermath, parseMoment } from './kristal-voice.js';
import { composeExit, pronounsFor, exitEpisodeKey } from './kristal-exit.js';

export const KRISTAL = { slug: 'kristal', name: 'Kristal' };

/** How loudly an episode landed. The thresholds are listeners, in thousands. */
export const RECEPTION = [
  { tier: 'quiet', label: 'A QUIET ONE', min: 0 },
  { tier: 'solid', label: 'A GOOD LISTEN', min: 55 },
  // Rare on purpose: measured at the first tuning, 36 of 60 episodes cleared
  // the old bar, and a virality more than half the catalog reaches is a font
  // size, not an event.
  { tier: 'viral', label: 'EVERYONE HEARD IT', min: 150 },
];

/** What an appearance does to the guest's following, by how the episode went. */
export const PODCAST_FOLLOWERS = { quiet: 1200, solid: 4500, viral: 14000 };
/** And what a viral episode costs whoever it was ABOUT. Proportional, like
 *  every loss in the follower model. */
export const MENTIONED_HIT = -0.015;

/** An in-season exit interview is worth less than a debrief — every boot gets
 *  one, so leaving early must not buy a following by itself — and it can
 *  cost: a guest the fans turned on loses followers for it. */
export const EXIT_FOLLOWERS = { quiet: 500, solid: 1800, viral: 6000 };
export const EXIT_RECEPTION = { warm: 1, mixed: 0.35, cold: -0.6 };
export function exitFollowerDelta(ep) {
  return Math.round((EXIT_FOLLOWERS[ep.tier] || 0) * (EXIT_RECEPTION[ep.reception] ?? 0.35));
}

const chance = key => {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};
const pickFrom = (list, key) => list && list.length
  ? list[Math.floor(chance(key) * list.length)] : null;

/** 1st, 2nd, 3rd — a placement reads wrong as a bare number in a sentence. */
const nth = n => {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  const s = ['th', 'st', 'nd', 'rd'][(v % 100 - v % 10 !== 10) && v % 10 < 4 ? v % 10 : 0];
  return `${v}${s || 'th'}`;
};

/**
 * The season's story, per player — who has something to answer for.
 *
 * Everything here is a field the export already writes. Popularity is the
 * edit; both extremes of it are good bookings, because the season's most
 * hated has as much to answer for as its most loved.
 */
function storyScore(detail, season, slug) {
  let s = 0;
  if (detail.placement === 1) s += 10;
  if (detail.placement === 2) s += 5;
  s += Math.min(4, (detail.rivalries || []).length * 1.5);
  if (detail.showmance) s += 2;
  if (detail.showmanceEnded === 'broken') s += 3;      // the messy exit interview
  s += Math.min(3, (detail.votesReceived || 0) * 0.25);
  if (season?.awards?.fanFavorite?.playerSlug === slug) s += 3;
  if (typeof detail.popularity === 'number') {
    // Distance from the middle of the cast, either direction.
    s += Math.min(4, Math.abs(detail.popularity - 50) / 20);
  }
  s += Math.min(2, (detail.keyMoments || []).length * 0.5);
  return s;
}

/** Topics Kristal will actually push on, derived from the record. */
function topicsFor(detail, season, slug) {
  const t = [];
  if (detail.placement === 1) t.push({ id: 'the-win', about: null });
  else if (detail.placement === 2) t.push({ id: 'the-loss', about: null });
  else if (detail.placement) t.push({ id: 'the-boot', about: null });
  const rival = (detail.rivalries || [])[0] || null;
  if (rival) t.push({ id: 'the-rivalry', about: rival });
  if (detail.showmance) {
    t.push({ id: detail.showmanceEnded === 'broken' ? 'the-breakup' : 'the-showmance',
      about: detail.showmance });
  }
  if ((detail.votesReceived || 0) >= 4) t.push({ id: 'the-target', about: null });
  t.push({ id: 'behind-the-scenes', about: null });
  return t;
}

/** Everything a bank's fact slots can reach, all off the published record. */
function factsFor(detail, season, names, careers) {
  const nameOf = x => names[x] || careers.find(c => c.id === x)?.name || x;
  return {
    season: season?.title || season?.seasonId,
    placement: detail.placement ? nth(detail.placement) : undefined,
    votes: (detail.votesReceived || 0) > 0 ? String(detail.votesReceived) : undefined,
    rival: (detail.rivalries || [])[0] || undefined,
    rivalName: (detail.rivalries || [])[0] || undefined,
    partner: detail.showmance || undefined,
    alliance: (detail.alliances || [])[0] || undefined,
    jury: (detail.juryVotes || 0) > 0 ? String(detail.juryVotes) : undefined,
    winner: season?.winner?.playerSlug ? nameOf(season.winner.playerSlug) : undefined,
  };
}

/** Names out of a record list, whatever shape it holds them in. */
const namesIn = list => (list || [])
  .map(v => typeof v === 'string' ? v : v?.name || v?.label || v?.partner || null)
  .filter(Boolean);
const uniq = xs => [...new Set(xs)];

const REL_STATUS = {
  dating: 'you and {x} were seeing each other', 'went-public': 'you and {x} went public',
  'moved-in': 'you and {x} moved in together', engaged: 'you and {x} got engaged',
  wedding: 'you and {x} got married', 'broke-up': 'you and {x} broke up',
  'quietly-ended': 'you and {x} quietly stopped seeing each other', separated: 'you and {x} separated',
  divorced: 'you and {x} divorced',
};
const REL_OVER = new Set(['broke-up', 'quietly-ended', 'separated', 'divorced']);

/**
 * A season's name as somebody says it out loud. "Biggest liar of Total Drama
 * Coaches VS New Blood: The Season of Broken Majorities?" is a title card, not
 * a question: the part a host would say is "Coaches VS New Blood".
 */
export function spokenTitle(title) {
  let t = String(title || '').trim();
  if (t.includes(':')) {
    const [a, b] = t.split(':').map(x => x.trim());
    t = /^total drama$/i.test(a) && b ? b : a;
  }
  return t.replace(/^Total Drama\s+(?=\D)/, '');
}

/**
 * Everything Kristal can ask about, off the published record and the approved
 * life log: the people in this guest's season and where they stand with each
 * of them. Names, not slugs — the record names people by name, and so does a
 * podcast.
 *
 * `cast` is [{ c: career, d: that season's detail }] for the whole season.
 * `lifeUpTo` is the approved log up to and including this gap.
 */
function storyFor({ slug, detail, season, cast, nameOf, slugOf, lifeUpTo }) {
  const guest = nameOf(slug);
  const castNames = cast.map(x => x.c.name).filter(n => n && n !== guest);
  const inCast = n => castNames.includes(n);
  const moments = uniq([...(detail.keyMoments || []), ...(detail.notes || [])].map(String))
    .map(m => parseMoment(m, castNames)).filter(Boolean);
  const allies = uniq([...namesIn(detail.unbreakableBonds), ...namesIn(detail.alliances)]).filter(inCast);
  const rivals = namesIn(detail.rivalries).filter(inCast);
  const rivalOf = cast.filter(x => x.c.id !== slug && namesIn(x.d.rivalries).includes(guest))
    .map(x => x.c.name).filter(n => !rivals.includes(n));
  const betrayed = namesIn(detail.betrayed).filter(inCast);
  const betrayedBy = namesIn(detail.betrayedBy).filter(inCast);
  // The record line that shows each blindside, so Kristal reads out the right one.
  const why = {};
  const note = (list, name, m) => { if (!list.includes(name)) list.push(name); if (!why[name]) why[name] = m; };
  for (const m of moments) {
    if (m.cls === 'by' && m.x) note(betrayedBy, m.x, m);
    if (m.cls === 'betrayal' && m.x) note(betrayed, m.x, m);
  }
  // A castmate's own record that names this guest — their side of it.
  const aboutYou = [];
  for (const x of cast) {
    if (x.c.id === slug) continue;
    const others = [...castNames.filter(n => n !== x.c.name), guest];
    for (const raw of x.d.keyMoments || []) {
      const m = parseMoment(raw, others);
      if (!m || !m.names.includes(guest)) continue;
      aboutYou.push({ ...m, by: x.c.name });
      // Which way it went. In Aubrey's record, "Spencer broke their final-three
      // pact" has Spencer doing it and "Flipped onto Spencer" has Aubrey doing
      // it; in Natalia's, "Blindsided by Sami, Spencer, Bowie and Julia" has
      // every name after the "by" doing it to Natalia.
      // A "by" sentence where this guest is only a bystander ("Evicted over
      // Jules after Jane flipped") is about somebody else.
      if (m.cls === 'by' && m.doers.includes(guest)) note(betrayed, x.c.name, { ...m, by: x.c.name });
      if (m.cls === 'betrayal') note(m.lead === guest ? betrayed : betrayedBy, x.c.name, { ...m, by: x.c.name });
    }
  }
  // The showmance, and where it stands now: the life log is later than the
  // season, so a couple the season left broken who got back together is together.
  const partner = detail.showmance || (detail.showmances || [])[0]?.partner || null;
  let partnerOver = detail.showmanceEnded === 'broken';
  let partnerStatus = null;
  const pslug = slugOf(partner);
  if (pslug) {
    const rel = lifeUpTo.filter(e => REL_STATUS[e.kind]
      && ((e.player === slug && e.whom === pslug) || (e.player === pslug && e.whom === slug))).pop();
    if (rel) {
      partnerOver = REL_OVER.has(rel.kind);
      partnerStatus = REL_STATUS[rel.kind].replace('{x}', partner);
    }
  }
  const second = cast.filter(x => x.d.placement === 2).map(x => x.c.name)[0] || null;
  const winnerName = season?.winner?.playerSlug ? nameOf(season.winner.playerSlug) : season?.winner?.name || null;
  // The number with somebody behind it, loudest first.
  const stats = [];
  const n = v => Number(v) || 0;
  // The ENGINE decides which stat block a detail carries (All Stars: `dr`).
  const fmt = engineOf(season?.format);
  if ((fmt === 'total-drama' || fmt === 'big-brother') && n(detail.votesReceived) >= 3) stats.push({ type: 'votes', n: n(detail.votesReceived) });
  if (n(detail.bb?.timesNominated) >= 2) stats.push({ type: 'noms', n: n(detail.bb.timesNominated) });
  if (n(detail.dr?.bottoms) >= 2) stats.push({ type: 'bottoms', n: n(detail.dr.bottoms) });
  if (n(detail.ci?.blocksMade) >= 1) stats.push({ type: 'blocks', n: n(detail.ci.blocksMade) });
  const wins = fmt === 'big-brother' ? n(detail.bb?.hohWins) + n(detail.bb?.vetoWins)
    : fmt === 'drag-race' ? n(detail.dr?.wins) : n(detail.challengeWins);
  if (wins >= 2) stats.push({ type: 'wins', n: wins });
  if (n(detail.idolsFound) >= 1) stats.push({ type: 'idols', n: n(detail.idolsFound) });
  return {
    guest, season: spokenTitle(season?.title) || season?.seasonId, format: fmt,
    placement: detail.placement || null, place: detail.placement ? nth(detail.placement) : null,
    won: detail.placement === 1, winner: winnerName, runnerUp: second,
    // A finalist was not voted out: the end was the final vote, and that is a different question.
    finalist: detail.placement !== 1 && (detail.placement === 2 || /final/i.test(String(detail.status || ''))),
    castNames, allies, rivals, rivalOf, betrayed, betrayedBy, why, moments, aboutYou,
    partner: partner && inCast(partner) ? partner : null, partnerOver, partnerStatus, stats, life: [],
  };
}

/** What a debrief guest told Kristal during the season about who would win. */
function withPrediction(story, live, slug) {
  const said = live.find(e => e.guest === slug && e.record?.prediction && e.record.kind !== 'finalist');
  if (said && story.winner) {
    story.prediction = { said: said.record.prediction, week: said.record.week,
      right: said.record.prediction === story.winner };
  }
  return story;
}

const TITLES = {
  exit: [
    '{guest}, fresh out',
    '{When}: {guest}',
    'The {guest} exit interview',
    '{guest} on getting out',
    '{guest} names {hook}',
    '{guest}, {when}',
    'Out: {guest}',
  ],
  debrief: [
    '{guest} answers for {season}',
    '{guest}: the whole story',
    'What {guest} won’t say anywhere else',
    '{guest}, unedited',
    '{guest} on {hook}',
    '{guest} names names',
    '{guest} and the {hook} question',
    'So, {hook}. With {guest}',
  ],
  life: [
    'Catching up with {guest}',
    '{guest}: life after the cameras',
    'Where {guest} has been',
    '{guest} tells it',
  ],
};

/**
 * Every episode the podcast has ever put out, oldest gap first.
 *
 * `careers` from records.js careersIn(pdb, 'all'); `seasons` the calendar
 * rows; `lifeEvents` the whole log (approved rows are read); `profiles`
 * slug -> { archetype, stats } off the roster (prose only); `names`
 * slug -> display name. `archetypes` (slug -> archetype) is the v1 shape and
 * still accepted.
 */
export function podcastFor({ careers = [], seasons = [], lifeEvents = [],
  archetypes = {}, profiles = {}, names = {},
  // display name -> roster slug, for a guest with no career yet (a season still
  // on the air): without it the guest was their bare name, so the portrait
  // asked for assets/avatars/Skye.png and the roster profile was never found.
  slugByName = {},
  // gapId -> remix count. PROSE ONLY: a salt re-rolls every word of a
  // period's episodes and touches nothing the follower model reads — the
  // bookings, listeners and tiers are identical under any salt, by test.
  proseSalts = {} } = {}) {
  const aired = seasons.filter(s => airKey(s) != null).slice().sort(byAirDate);
  if (!aired.length) return [];
  const bySlug = new Map(careers.map(c => [c.id, c]));
  const nameOf = s => names[s] || bySlug.get(s)?.name || s;
  // Season details name people by NAME (rivalries, showmance) while the life
  // log uses slugs. `mentioned` has to come out as a slug either way, or the
  // follower model cannot find who a viral episode landed on.
  const slugOf = x => !x ? null : bySlug.has(x) ? x
    : (careers.find(c => c.name === x)?.id || null);
  const profileOf = slug => profiles[slug]
    || (archetypes[slug] ? { archetype: archetypes[slug] } : {});
  const approved = (lifeEvents || []).filter(e => e && e.status === 'approved');

  const episodes = [];
  const visits = new Map();          // slug -> how many times they have sat down
  let epNum = 0;

  const finish = ep => {
    const k = ep.listeners / 1000;
    const r = [...RECEPTION].reverse().find(x => k >= x.min) || RECEPTION[0];
    ep.tier = r.tier;
    ep.tierLabel = r.label;
    // Length is a number too, so it is derived from roster-free inputs only.
    ep.minutes = Math.min(88, 34 + Math.round(ep.listeners / 4000)
      + Math.round(chance(ep.id + '|len') * 12));
    if (ep.mentioned) ep.mentionedName = nameOf(ep.mentioned);
    const salt = proseSalts[ep.afterSeason] || '';
    // ── the transcript ──
    //
    // Continuity: if the person this episode's mess is about already sat in
    // the chair THIS GAP, Kristal opens with their clip. Booking order is the
    // broadcast order, so the quote always exists before it is played.
    const prior = ep.mentioned
      ? episodes.find(p => p.afterSeason === ep.afterSeason && p.guest === ep.mentioned) || null
      : null;
    const visit = (visits.get(ep.guest) || 0) + 1;
    visits.set(ep.guest, visit);
    // Anybody who sat down earlier this gap and said this guest's name gets played to them.
    const earlier = episodes.filter(p => p.afterSeason === ep.afterSeason);
    const t = composeEpisode(ep, {
      words: showWords(ep.season?.format), prior, earlier, visit, salt,
    });
    // The title names the episode's loudest person when it has one.
    const titles = (TITLES[ep.kind] || []).filter(x => t.hook || !x.includes('{hook}'));
    ep.title = (pickFrom(titles, ep.id + (salt ? '~' + salt : '') + '|title') || '')
      .replace('{guest}', ep.guestName)
      .replace('{hook}', t.hook || '')
      .replace('{season}', ep.season?.title || ep.afterSeason);
    ep.coldOpen = t.coldOpen;
    ep.exchanges = t.exchanges;
    ep.rapid = t.rapid;
    ep.aftermath = podcastAftermath(ep);
    ep.visit = visit;
    episodes.push(ep);
  };

  const rankOf = new Map(aired.map((s, i) => [s.seasonId, i]));
  const castOf = sid => careers
    .map(c => ({ c, d: (c.details || []).find(x => x.seasonId === sid) }))
    .filter(x => x.d);
  // The life log as it stood at the end of a gap, oldest first.
  const lifeUpTo = sid => approved
    .filter(e => (rankOf.get(e.afterSeason) ?? Infinity) <= rankOf.get(sid))
    .sort((a, b) => rankOf.get(a.afterSeason) - rankOf.get(b.afterSeason) || (a.seq || 0) - (b.seq || 0));

  // ── during the season: every boot's exit interview, in the order they left ──
  //
  // Decided by the simulator (js/exit-interview/core.js) and published on the
  // season row; only the words are written here. Numbers come from the record
  // and the career, never the words, like every other episode on this feed.
  const exitEpisodes = season => {
    const sid = season.seasonId;
    const out = [];
    const used = new Set();
    const words = showWords(season.format);
    for (const rec of (season.exitInterviews || []).slice().sort((a, b) => (a.week || 0) - (b.week || 0))) {
      if (!rec?.guest) continue;
      const slug = slugOf(rec.guest) || slugByName[rec.guest]
        || String(rec.guest).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const prof = profileOf(slug);
      const career = bySlug.get(slug);
      const fame = career ? fameOf(career) : 0.2;
      const listeners = Math.round((10 + (Number(rec.heat) || 0) * 5) * (0.5 + fame)
        * (0.8 + chance(`${sid}|${rec.id}|luck`) * 0.5)) * 1000;
      const loud = (rec.named || []).filter(n => n.still && (n.stance === 'drag' || n.stance === 'blame'))
        .sort((a, b) => b.heat - a.heat)[0];
      const ep = {
        id: exitEpisodeKey(sid, rec), num: ++epNum, kind: 'exit',
        afterSeason: sid, period: `${sid}:live`, when: airLabel(season), season,
        guest: slug, guestName: rec.guest, archetype: prof.archetype || '', style: styleOf(prof),
        record: rec, reception: rec.reception || 'mixed', listeners,
        pronouns: pronounsFor(prof.gender),
        mentioned: loud ? slugOf(loud.who) : null,
      };
      const k = ep.listeners / 1000;
      const tier = [...RECEPTION].reverse().find(x => k >= x.min) || RECEPTION[0];
      ep.tier = tier.tier;
      ep.tierLabel = tier.label;
      ep.minutes = Math.min(70, 22 + Math.round(ep.listeners / 3000) + Math.round(chance(ep.id + '|len') * 10));
      if (ep.mentioned) ep.mentionedName = nameOf(ep.mentioned);
      const salt = proseSalts[`${sid}:live`] || '';
      const t = composeExit(ep, { words, earlier: out, salt, used });
      const titles = TITLES.exit.filter(x => t.hook || !x.includes('{hook}'));
      ep.title = (pickFrom(titles, ep.id + (salt ? '~' + salt : '') + '|title') || '')
        .replace('{guest}', ep.guestName).replace('{hook}', t.hook || '')
        .replace('{When}', `${words.round || 'Week'} ${rec.week || ''}`)
        .replace('{when}', `${String(words.round || 'week').toLowerCase()} ${rec.week || ''}`);
      Object.assign(ep, { coldOpen: t.coldOpen, exchanges: t.exchanges, rapid: t.rapid, outro: t.outro });
      ep.aftermath = podcastAftermath(ep);
      ep.followers = exitFollowerDelta(ep);
      const visit = (visits.get(slug) || 0) + 1;
      visits.set(slug, visit);
      ep.visit = visit;
      out.push(ep);
    }
    return out;
  };

  for (const season of aired) {
    const sid = season.seasonId;
    const live = exitEpisodes(season);
    episodes.push(...live);

    // ── the debrief: this season's own cast, right after its finale ──
    const cast = castOf(sid);
    const ranked = cast
      .map(x => ({ ...x, score: storyScore(x.d, season, x.c.id) }))
      .sort((a, b) => b.score - a.score || String(a.c.name).localeCompare(b.c.name));
    // The winner always sits down; then the loudest stories. Chairs scale
    // with the cast — an eighteen-person season has more to answer for than a
    // ten — capped at four so an invitation stays something to earn. With up
    // to three catch-ups below, a loud gap tops out at seven episodes.
    const chairs = Math.max(2, Math.min(4, Math.ceil(cast.length / 5)));
    const booked = [];
    const winner = ranked.find(x => x.d.placement === 1);
    if (winner) booked.push(winner);
    for (const x of ranked) {
      if (booked.length >= chairs) break;
      if (!booked.includes(x)) booked.push(x);
    }
    for (const guest of booked) {
      const slug = guest.c.id;
      const prof = profileOf(slug);
      const fame = fameOf(guest.c);
      const topics = topicsFor(guest.d, season, slug);
      const listeners = Math.round(
        (24 + guest.score * 7.5) * (0.5 + fame)
        * (0.8 + chance(`${sid}|${slug}|luck`) * 0.5)) * 1000;
      finish({
        id: `kt-${sid}-${slug}`, num: ++epNum, kind: 'debrief',
        afterSeason: sid, when: airLabel(season), season,
        guest: slug, guestName: nameOf(slug),
        archetype: prof.archetype || '', style: styleOf(prof), voice: voiceOf(prof),
        facts: factsFor(guest.d, season, names, careers),
        story: withPrediction(storyFor({ slug, detail: guest.d, season, cast, nameOf, slugOf, lifeUpTo: lifeUpTo(sid) }), live, slug),
        topics, listeners,
        // Who a viral episode lands on: the messiest topic's other party.
        mentioned: slugOf((topics.find(t => t.id === 'the-breakup')
          || topics.find(t => t.id === 'the-rivalry'))?.about) || null,
      });
    }

    // ── the catch-up: whoever's life just did something worth an hour ──
    //
    // Majors only, and the debrief season's own cast is skipped — they are
    // already booked, and two episodes with one guest in one gap reads as a
    // scheduling bug rather than a booking.
    const inGap = approved.filter(e => e.afterSeason === sid
      && significanceOf(e.kind) === 'major');
    const guests = [...new Set(inGap.map(e => e.player))]
      .filter(p => bySlug.has(p) && !booked.some(b => b.c.id === p))
      .sort((a, b) => fameOf(bySlug.get(b)) - fameOf(bySlug.get(a)))
      .slice(0, 3);
    for (const slug of guests) {
      const c = bySlug.get(slug);
      const prof = profileOf(slug);
      const events = inGap.filter(e => e.player === slug);
      const fame = fameOf(c);
      const listeners = Math.round(
        (28 + events.length * 10) * (0.5 + fame)
        * (0.8 + chance(`${sid}|${slug}|life-luck`) * 0.5)) * 1000;
      // A catch-up still reaches into the guest's PLAYED record: the year is
      // the headline, the career is the follow-up material.
      const lastDetail = (c.details || [])[c.details.length - 1] || {};
      const lastSeason = seasons.find(x => x.seasonId === lastDetail.seasonId) || season;
      const story = storyFor({ slug, detail: lastDetail, season: lastSeason,
        cast: castOf(lastDetail.seasonId), nameOf, slugOf, lifeUpTo: lifeUpTo(sid) });
      // The year itself: the majors first, then whatever else they posted about.
      const sig = { major: 0, notable: 1, minor: 2 };
      story.life = approved.filter(e => e.afterSeason === sid && (e.player === slug || e.whom === slug)
        && significanceOf(e.kind) !== 'minor')
        .sort((a, b) => sig[significanceOf(a.kind)] - sig[significanceOf(b.kind)] || (a.seq || 0) - (b.seq || 0))
        .slice(0, 2)
        .map(e => {
          const other = e.player === slug ? e.whom : e.player;
          return { kind: e.kind, whomName: other ? nameOf(other) : null, line: lineFor(e, names, slug) };
        });
      finish({
        id: `kt-${sid}-life-${slug}`, num: ++epNum, kind: 'life',
        afterSeason: sid, when: airLabel(season), season,
        guest: slug, guestName: nameOf(slug),
        archetype: prof.archetype || '', style: styleOf(prof), voice: voiceOf(prof),
        facts: {
          ...factsFor(lastDetail,
            seasons.find(x => x.seasonId === lastDetail.seasonId) || season, names, careers),
          season: season?.title || sid,
        },
        topics: [{ id: 'the-life', about: null,
          line: lineFor(events[0], names, slug) }, { id: 'behind-the-scenes', about: null }],
        story, listeners, mentioned: slugOf(events[0]?.whom) || null,
      });
    }
  }
  return episodes;
}

/** Everything one character has to do with the podcast, for a profile. */
export function podcastOf(slug, all) {
  return {
    appearances: all.filter(e => e.guest === slug),
    mentions: all.filter(e => e.mentioned === slug && e.tier === 'viral'),
  };
}

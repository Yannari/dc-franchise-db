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
import { showWords } from './shows.js';
import { styleOf, composeEpisode } from './kristal-voice.js';

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

const TITLES = {
  debrief: [
    '{guest} answers for {season}',
    '{guest}: the whole story',
    'What {guest} won’t say anywhere else',
    '{guest}, unedited',
  ],
  life: [
    'Catching up with {guest}',
    '{guest}: life after the cameras',
    'Where {guest} has been',
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
  archetypes = {}, profiles = {}, names = {} } = {}) {
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
    ep.title = (pickFrom(TITLES[ep.kind], ep.id + '|title') || '')
      .replace('{guest}', ep.guestName)
      .replace('{season}', ep.season?.title || ep.afterSeason);
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
    const t = composeEpisode(ep, {
      words: showWords(ep.season?.format), prior, visit,
    });
    ep.coldOpen = t.coldOpen;
    ep.exchanges = t.exchanges;
    ep.rapid = t.rapid;
    ep.visit = visit;
    episodes.push(ep);
  };

  for (const season of aired) {
    const sid = season.seasonId;

    // ── the debrief: this season's own cast, right after its finale ──
    const cast = careers
      .map(c => ({ c, d: (c.details || []).find(x => x.seasonId === sid) }))
      .filter(x => x.d);
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
        archetype: prof.archetype || '', style: styleOf(prof),
        facts: factsFor(guest.d, season, names, careers),
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
      finish({
        id: `kt-${sid}-life-${slug}`, num: ++epNum, kind: 'life',
        afterSeason: sid, when: airLabel(season), season,
        guest: slug, guestName: nameOf(slug),
        archetype: prof.archetype || '', style: styleOf(prof),
        facts: {
          ...factsFor(lastDetail,
            seasons.find(x => x.seasonId === lastDetail.seasonId) || season, names, careers),
          season: season?.title || sid,
        },
        topics: [{ id: 'the-life', about: null,
          line: lineFor(events[0], names, slug) }, { id: 'behind-the-scenes', about: null }],
        listeners, mentioned: slugOf(events[0]?.whom) || null,
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

// Kristal-talKs — the exit-interview podcast.
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

import { airKey, airLabel, byAirDate } from './franchise-calendar.js';
import { significanceOf, approvedFor, lineFor } from './life-events.js';
import { fameOf } from './life-resolver.js';
import { toneFor } from './dramagram-voice.js';
import { showWords } from './shows.js';

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

// Deterministic pick — the same episode reads the same way forever.
function pickFrom(list, key) {
  if (!list || !list.length) return null;
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return list[(h >>> 0) % list.length];
}
const chance = key => {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

/**
 * How much a guest gives Kristal to work with.
 *
 * Villains spill — that is the whole reason exit podcasts book them. Heroes
 * are gracious and tamer. CANDOR SHAPES THE PROSE ONLY, never the listener
 * count: the follower model computes episodes without the roster in hand, and
 * a number that changed depending on which page asked is the two-clocks bug
 * this project keeps a document about. The register is flavour; the count is
 * arithmetic over data every caller has.
 */
const CANDOR = {
  villain: 1.35, schemer: 1.3, mastermind: 1.25, 'chaos-agent': 1.3,
  hothead: 1.2, wildcard: 1.15, showmancer: 1.1, 'social-butterfly': 1.05,
  'perceptive-player': 1.0, 'challenge-beast': 0.95, underdog: 0.95,
  hero: 0.9, 'loyal-soldier': 0.85, floater: 0.8, goat: 0.8,
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

/**
 * Every episode the podcast has ever put out, oldest gap first.
 *
 * `careers` from records.js careersIn(pdb, 'all'); `seasons` the calendar
 * rows; `lifeEvents` the whole log (approved rows are read); `archetypes`
 * slug -> archetype off the roster; `names` slug -> display name.
 */
export function podcastFor({ careers = [], seasons = [], lifeEvents = [],
  archetypes = {}, names = {} } = {}) {
  const aired = seasons.filter(s => airKey(s) != null).slice().sort(byAirDate);
  if (!aired.length) return [];
  const bySlug = new Map(careers.map(c => [c.id, c]));
  const nameOf = s => names[s] || bySlug.get(s)?.name || s;
  // Season details name people by NAME (rivalries, showmance) while the life
  // log uses slugs. `mentioned` has to come out as a slug either way, or the
  // follower model cannot find who a viral episode landed on.
  const slugOf = x => bySlug.has(x) ? x
    : (careers.find(c => c.name === x)?.id || null);
  const seasonRank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const approved = (lifeEvents || []).filter(e => e && e.status === 'approved');

  const episodes = [];
  let epNum = 0;

  for (const season of aired) {
    const sid = season.seasonId;

    // ── the debrief: this season's own cast, right after its finale ──
    const cast = careers
      .map(c => ({ c, d: (c.details || []).find(x => x.seasonId === sid) }))
      .filter(x => x.d);
    const ranked = cast
      .map(x => ({ ...x, score: storyScore(x.d, season, x.c.id) }))
      .sort((a, b) => b.score - a.score || String(a.c.name).localeCompare(b.c.name));
    // The winner always sits down; then the loudest stories. Three chairs on a
    // full season, two on a small one.
    const chairs = cast.length >= 12 ? 3 : 2;
    const booked = [];
    const winner = ranked.find(x => x.d.placement === 1);
    if (winner) booked.push(winner);
    for (const x of ranked) {
      if (booked.length >= chairs) break;
      if (!booked.includes(x)) booked.push(x);
    }
    for (const guest of booked) {
      const slug = guest.c.id;
      const arch = archetypes[slug] || '';
      const fame = fameOf(guest.c);
      const topics = topicsFor(guest.d, season, slug);
      const listeners = Math.round(
        (24 + guest.score * 7.5) * (0.5 + fame)
        * (0.8 + chance(`${sid}|${slug}|luck`) * 0.5)) * 1000;
      episodes.push(_finish({
        id: `kt-${sid}-${slug}`, num: ++epNum, kind: 'debrief',
        afterSeason: sid, when: airLabel(season), season,
        guest: slug, guestName: nameOf(slug), archetype: arch,
        topics, listeners,
        // Who a viral episode lands on: the messiest topic's other party.
        mentioned: slugOf((topics.find(t => t.id === 'the-breakup')
          || topics.find(t => t.id === 'the-rivalry'))?.about) || null,
      }, nameOf));
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
      .slice(0, 2);
    for (const slug of guests) {
      const c = bySlug.get(slug);
      const arch = archetypes[slug] || '';
      const events = inGap.filter(e => e.player === slug);
      const fame = fameOf(c);
      const listeners = Math.round(
        (28 + events.length * 10) * (0.5 + fame)
        * (0.8 + chance(`${sid}|${slug}|life-luck`) * 0.5)) * 1000;
      episodes.push(_finish({
        id: `kt-${sid}-life-${slug}`, num: ++epNum, kind: 'life',
        afterSeason: sid, when: airLabel(season), season,
        guest: slug, guestName: nameOf(slug), archetype: arch,
        topics: [{ id: 'the-life', about: null,
          line: lineFor(events[0], names, slug) }, { id: 'behind-the-scenes', about: null }],
        listeners, mentioned: slugOf(events[0]?.whom) || null,
      }, nameOf));
    }
  }
  return episodes;
}

function _finish(ep, nameOf) {
  const k = ep.listeners / 1000;
  const r = [...RECEPTION].reverse().find(x => k >= x.min) || RECEPTION[0];
  ep.tier = r.tier;
  ep.tierLabel = r.label;
  if (ep.mentioned) ep.mentionedName = nameOf(ep.mentioned);
  ep.title = _title(ep);
  ep.exchanges = _exchanges(ep);
  return ep;
}

// ── the voice ──────────────────────────────────────────────────────────
//
// Kristal is sassy, quick, and gets the answer she wants — the questions do
// the cornering, and the guest's archetype register decides how they take it.
// Three registers: a SPILLER leans in, a GRACIOUS guest deflects beautifully,
// and PLAIN just answers.

const REGISTER = arch => (CANDOR[arch] ?? 1) >= 1.15 ? 'spiller'
  : (CANDOR[arch] ?? 1) <= 0.9 ? 'gracious' : 'plain';

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

const QUESTIONS = {
  'the-win': [
    'Everyone says the winner played the perfect game. I watched the tapes, babe — perfect is not the word I’d use. Walk me through it.',
    'You won. Congratulations. Now tell me the part of the resume you don’t put on the resume.',
  ],
  'the-loss': [
    'Second place. I need you to say, out loud, the exact moment you lost it — because I know the moment, and I want to see if you do.',
    'The jury picked somebody else. Years from now, what’s the vote you’d take back?',
  ],
  // {player}/{players}/{exit} are filled from the season's own show registry —
  // an episode about a camp says "voted out" and one about a house says
  // "evicted", and a third show is one entry in js/shows.js away from being
  // interviewed correctly. The vocabulary rule does not stop applying just
  // because the person saying the words is a podcast host.
  'the-boot': [
    'Let’s talk about the night you got {exit}, because the edit was VERY kind to some of the {players} in that room.',
    'You didn’t lose that game, somebody took it from you. Name them.',
  ],
  'the-rivalry': [
    'You and {about}. I’m not moving on until we’ve done this properly.',
    'Every season has a feud the cameras undersold. Yours was {about}. Correct the record.',
  ],
  'the-showmance': [
    'You found a whole relationship on a game show. Defend yourself.',
    'The audience shipped it. The house weaponised it. Which one of them was right about you and {about}?',
  ],
  'the-breakup': [
    'You and {about} left that season together and did not stay that way. I have theories. Go.',
    'I’m going to say a name — {about} — and you’re going to tell me the truth this time.',
  ],
  'the-target': [
    'The other {players} wrote your name down A LOT. At what point did you notice, and why didn’t it work?',
  ],
  'the-life': [
    'Something happened this year, and my listeners have been feral about it. Tell them yourself.',
    'You’ve had a YEAR. Start wherever it hurts.',
  ],
  'behind-the-scenes': [
    'Give me the thing production cut. You know exactly which one I mean.',
    'Last one. Tell me something that never made air, and make it good.',
  ],
};

const ANSWERS = {
  spiller: [
    'Oh, we’re doing this? Fine. Nobody in that cast was innocent, and I kept receipts.',
    'I said what I said then and I’ll say worse now — I was the only one playing honestly about being dishonest.',
    'You want names? I’ll give you names. The edit protected exactly the wrong people.',
    'Everyone’s so brave once they’re out the door. Say it to my face like I said it to theirs.',
  ],
  gracious: [
    'Ha — you’re not getting me that easily. What I’ll say is: it was harder than it looked, and I’d do most of it again.',
    'I love them, honestly. Even the ones who wrote my name down. It’s a game, and they played it.',
    'There’s a version of that story that makes good radio and a version that’s true, and I’m going to disappoint you with the true one.',
  ],
  plain: [
    'Honestly? It’s simpler than everyone thinks. I did the maths, the maths said do it, I did it.',
    'People remember it messier than it was. It was one decision, made fast, and I stand by it.',
    'I’ve heard every theory. The real answer is boring, which is why nobody believes it.',
  ],
};

// The catch-up needs its own answers: read at a screenshot, a guest asked
// about her YEAR was replying "say it to my face like I said it to theirs" —
// a debrief spill over a life question. Same three registers, different room.
const LIFE_ANSWERS = {
  spiller: [
    'You want the version I didn’t post? Fine. It was worse and better than the internet decided, in that order.',
    'Everyone had opinions about my year. None of them were in the room for any of it, and I’m done being polite about that.',
    'I’ll tell you what actually happened, but you’re bleeping half of it.',
  ],
  gracious: [
    'It’s been a lot, honestly. Some of it wonderful, some of it I’m still carrying. I’m okay — genuinely, not press-release okay.',
    'The people who mattered showed up. That’s the whole story, and it’s a better one than the drama.',
    'I read everything people wrote about it. Then I put the phone down and lived my actual life, and I recommend it.',
  ],
  plain: [
    'It happened, it’s handled, and I’m sleeping fine. Next question.',
    'Life’s quieter than the show. That took some getting used to, and then it took some being grateful for.',
    'People think it changed me. It didn’t. It changed my mornings.',
  ],
};

function _title(ep) {
  const t = pickFrom(TITLES[ep.kind], ep.id + '|title') || '';
  return t.replace('{guest}', ep.guestName)
    .replace('{season}', ep.season?.title || ep.afterSeason);
}

function _exchanges(ep) {
  const reg = REGISTER(ep.archetype);
  // The season being discussed decides the vocabulary, episode by episode —
  // Kristal interviews the whole franchise, and she says "voted out" to a
  // contestant and "evicted" to a houseguest in consecutive episodes.
  const w = showWords(ep.season?.format);
  return ep.topics.slice(0, 3).map((t, i) => ({
    q: (t.id === 'the-life'
      ? pickFrom(QUESTIONS['the-life'], `${ep.id}|q|${i}`)
      : pickFrom(QUESTIONS[t.id] || QUESTIONS['behind-the-scenes'], `${ep.id}|q|${i}`) || '')
      .replace(/\{about\}/g, t.about ? (ep.mentionedName || t.about) : '')
      .replace(/\{player\}/g, w.player).replace(/\{players\}/g, w.players)
      .replace(/\{exit\}/g, w.exit),
    a: pickFrom(t.id === 'the-life' ? LIFE_ANSWERS[reg] : ANSWERS[reg], `${ep.id}|a|${i}`) || '',
    topic: t.id,
  }));
}

/** Everything one character has to do with the podcast, for a profile. */
export function podcastOf(slug, all) {
  return {
    appearances: all.filter(e => e.guest === slug),
    mentions: all.filter(e => e.mentioned === slug && e.tier === 'viral'),
  };
}

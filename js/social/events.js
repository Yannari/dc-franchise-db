// What happened, in the only vocabulary the feed understands.
//
// The voice library composes a post from an EVENT. Until now those events were
// hand-written fixtures — `{ kind:'blindside', subject:'heather' }` — invented to
// exercise the sampler. This is the part that reads a real episode and produces
// them, which is what turns the library from a demo into a feature.
//
// IT INVENTS NOTHING. Every kind below is drawn from data the simulator already
// writes:
//
//   Big Brother weeks   hoh, initialNominees, vetoWinner, finalNominees,
//                       votes, voteChanges, evicted
//   Total Drama episodes immunityWinner, eliminated, showmanceBreakup, campEvents
//   both                 campEvents, classified by js/tone.js
//
// The camp-event mapping deliberately reuses `classifyEventTone` rather than
// growing a second taxonomy. That classifier already sorts every aired event into
// heroic / villainous / comic / strategic / emotional, and its own comment says
// "one taxonomy, two consumers". This is the third, and it is still one taxonomy.
import { EVENT_KINDS } from './topics.js';
import { classifyEventTone } from '../tone.js';
import { withReceipts } from './receipts.js';

/** A nominal episode runtime, in ms. Posts are stamped across it. */
export const EPISODE_MS = 42 * 60 * 1000;

/**
 * Where in the episode each kind of moment lands, as a fraction of runtime.
 *
 * Not decoration: project 3 replays the feed in timestamp order, so a blindside
 * reaction arriving before the vote would read as a leak. Competitions happen
 * early, the vote lands at the end, and the aftermath follows it.
 */
const WHEN = {
  'episode-aired': 0.02,
  'comp-win': 0.25,
  'nomination': 0.4,
  'veto-used': 0.55,
  'argument': 0.45,
  'kindness': 0.35,
  'ganging-up': 0.5,
  'romantic-spark': 0.3,
  'showmance-formed': 0.32,
  'showmance-broken': 0.6,
  'alliance-formed': 0.38,
  'betrayal': 0.75,
  'twist': 0.15,
  'domination': 0.7,
  'eviction': 0.88,
  'blindside': 0.9,
  'finale': 0.95,
};

/** A tone from the edit layer, and the social event it reads as. */
const TONE_TO_KIND = {
  heroic: 'kindness',
  villainous: 'ganging-up',
  emotional: 'romantic-spark',
  strategic: 'alliance-formed',
  comic: null,          // funny is not an event the audience argues about
  neutral: null,
};

const slug = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * One canonical event, stamped where it belongs in the episode.
 *
 * Exported because the archive reader needs to build events the played path
 * never produces — a finished season's document records a vote tally rather than
 * a week object, and the events it implies still have to land at the right time.
 * Sharing this keeps ONE definition of when a blindside happens relative to the
 * vote; two would drift and the feed would replay out of order.
 */
export function socialEvent(kind, meta) {
  return event(kind, meta);
}

function event(kind, { subject, actor, season, episode, format, jitter = 0 }) {
  return {
    kind,
    subject: subject ? slug(subject) : null,
    actor: actor ? slug(actor) : null,
    season, episode, format,
    at: Math.round(EPISODE_MS * ((WHEN[kind] ?? 0.5) + jitter)),
  };
}

/**
 * Everybody the house turned on at once.
 *
 * A vote is a blindside when the person going home did not see it: the engine
 * records that as `voteChanges`, people who said one name and wrote another.
 * Without that field it is an ordinary eviction, and calling every eviction a
 * blindside would make the feed's loudest reaction its most common one.
 */
function isBlindside(week) {
  const changes = week?.voteChanges;
  // A COUNT is the shape the published seasons actually carry — `voteChanges: 4`.
  // This function originally handled only arrays and objects, so it returned
  // false for every real week ever played and the feed's loudest reaction could
  // never fire. The unit test passed because it invented `[{voter:'Scott'}]`,
  // which is precisely the failure the tests around it warn about: a reader
  // tested against a fabricated shape works perfectly and reads nothing.
  if (typeof changes === 'number') return changes > 0;
  if (Array.isArray(changes)) return changes.length > 0;
  if (changes && typeof changes === 'object') return Object.keys(changes).length > 0;
  return false;
}

/** Big Brother: a week's competitions, nominations and vote. */
function bbEvents(week, meta) {
  const out = [];
  if (week.hoh) out.push(event('comp-win', { ...meta, subject: week.hoh }));

  for (const [i, name] of (week.initialNominees || []).entries()) {
    // The first kind to carry its own history. A nomination with only two
    // names on it produces a post about A nomination; the receipts are what
    // make it about THIS one — the deal they shook on, the vote that saved
    // them, the week one of them already did this.
    out.push(withReceipts(
      event('nomination', { ...meta, subject: name, actor: week.hoh, jitter: i * 0.01 }),
      { upTo: meta.episode }));
  }

  if (week.vetoWinner) {
    out.push(event('comp-win', { ...meta, subject: week.vetoWinner, jitter: 0.02 }));
    // The veto only counts as USED when the final block differs from the first.
    const before = (week.initialNominees || []).map(slug).sort().join(',');
    const after = (week.finalNominees || []).map(slug).sort().join(',');
    if (before && after && before !== after) {
      out.push(event('veto-used', { ...meta, subject: week.vetoWinner }));
    }
  }

  if (week.evicted) {
    out.push(event('eviction', { ...meta, subject: week.evicted }));
    if (isBlindside(week)) {
      out.push(event('blindside', { ...meta, subject: week.evicted, actor: week.hoh }));
    }
  }
  return out;
}

/**
 * The last night, with names on it.
 *
 * `extractEvents` used to emit a bare `finale` for a record flagged as one —
 * no subject, because a weekly episode record does not name a winner. The
 * archive reader patched a winner onto it from the published document, which
 * meant a FINISHED season had a finale the audience could talk about and a
 * season you were actually playing did not.
 *
 * Everything here is on the record `simulateBBFinale` writes. The order is the
 * order the night runs in — the last competition, the cut at three, then the
 * vote — because the feed replays in timestamp order and a reaction to the
 * winner arriving before the jury has voted reads as a leak.
 */
function bbFinaleEvents(ep, meta) {
  const out = [];
  if (ep.finalHoh) {
    out.push(event('comp-win', { ...meta, subject: ep.finalHoh, jitter: -0.05 }));
  }
  // The cruellest seat in the show, and it happens well before the vote.
  const cut = ep.cut || ep.eliminated;
  if (cut) out.push(event('eviction', { ...meta, subject: cut, actor: ep.finalHoh, jitter: -0.35 }));

  if (ep.winner) {
    out.push(event('finale', { ...meta, subject: ep.winner, actor: ep.runnerUp || null }));
    // A sweep is a different conversation from a one-vote win, and the room
    // has a word for it.
    const votes = ep.juryVotes || {};
    const forWinner = Number(votes[ep.winner]) || 0;
    const total = Object.values(votes).reduce((s, v) => s + (Number(v) || 0), 0);
    if (total >= 5 && forWinner >= total - 1) {
      out.push(event('domination', { ...meta, subject: ep.winner, jitter: 0.18 }));
    }
  }
  // The one prize the house has no vote in. Recorded as the whole result —
  // winner, tally, prize and the reason — not as a name, so reading the field
  // directly stamped a post about somebody called "[object Object]".
  const fav = ep.favourite?.winner || (typeof ep.favourite === 'string' ? ep.favourite : null);
  if (fav && fav !== ep.winner) {
    out.push(event('kindness', { ...meta, subject: fav, jitter: 0.55 }));
  }
  return out;
}

/** Total Drama: the challenge winner, the boot, and a broken showmance. */
function tdEvents(ep, meta) {
  const out = [];
  if (ep.immunityWinner) out.push(event('comp-win', { ...meta, subject: ep.immunityWinner }));

  const gone = ep.eliminated || ep.boot || null;
  if (gone) out.push(event('eviction', { ...meta, subject: gone }));

  const split = ep.showmanceBreakup || ep.showmanceSeparation;
  if (split) {
    const pair = Array.isArray(split) ? split : [split.a, split.b].filter(Boolean);
    if (pair.length) {
      out.push(event('showmance-broken', { ...meta, subject: pair[0], actor: pair[1] || null }));
    }
  }
  return out;
}

/**
 * Camp events, read through the edit layer's tone classifier.
 *
 * `ep.campEvents` is keyed by camp, each holding `pre` and `post` arrays, and
 * every entry carries `players[]` plus the `badgeText`/`badgeClass` the
 * classifier reads. Tones the audience does not argue about produce nothing —
 * a comic beat is not a social event, and manufacturing one for every prank
 * would drown the feed in noise it has no opinion about.
 */
function campEvents(ep, meta) {
  const out = [];
  const camps = ep.campEvents;
  if (!camps || typeof camps !== 'object') return out;

  let n = 0;
  for (const camp of Object.values(camps)) {
    for (const phase of ['pre', 'post']) {
      for (const ev of (camp?.[phase] || [])) {
        const kind = TONE_TO_KIND[classifyEventTone(ev)];
        if (!kind) continue;
        const players = ev.players || [];
        if (!players.length) continue;
        out.push(event(kind, {
          ...meta,
          subject: players[0],
          actor: players[1] || null,
          jitter: (n++ % 12) * 0.008,
        }));
      }
    }
  }
  return out;
}

/**
 * Everything the audience could react to in one episode.
 *
 * Always emits `episode-aired`, so an episode where nothing else parsed still
 * produces a feed rather than silence — an empty feed reads as a broken feature,
 * and the topics that trigger on `episode-aired` (thirst, edit critique,
 * favourite declarations) are exactly the ones that do not need a big moment.
 */
export function extractEvents(ep, { format, season, episode } = {}) {
  if (!ep) return [];
  const meta = {
    format: format || ep.format || 'total-drama',
    season: season ?? ep.season ?? 0,
    episode: episode ?? ep.num ?? ep.week ?? 0,
  };

  const out = [event('episode-aired', meta)];
  const isFinale = !!(ep.isFinale || ep.finale);
  // A Big Brother finale is not a week — no Head of Household, no nominees, no
  // eviction vote — so running the weekly reader over it produces nothing and
  // then a nameless `finale`. It has its own shape and its own reader.
  if (isFinale && meta.format === 'big-brother') out.push(...bbFinaleEvents(ep, meta));
  else out.push(...(meta.format === 'big-brother' ? bbEvents(ep, meta) : tdEvents(ep, meta)));
  out.push(...campEvents(ep, meta));

  // Total Drama's finale still gets the bare marker; its winner is read off the
  // published document by the archive path.
  if (isFinale && !out.some(e => e.kind === 'finale')) out.push(event('finale', meta));

  // A kind the topics do not know is a post nothing can be written for.
  const known = out.filter(e => EVENT_KINDS.includes(e.kind));
  return known.sort((a, b) => a.at - b.at);
}

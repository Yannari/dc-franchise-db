// Who gets the microphone.
//
// ChatAlumni is a hosted room: former players talk, members comment. Which
// former players is not a list somebody maintains — it is DERIVED, every read,
// from the same records the rest of the site runs on. Fame decays and locks, a
// player's fifth season changes their standing, and a season finishing turns a
// contestant into an alumnus. A hand-kept celebrity list is wrong the first time
// any of that happens and nobody notices, because a stale list still renders.
//
// The rules, in order of how often they bite:
//
//   1. A COMPLETED APPEARANCE. players_database.json holds finished seasons
//      only, so being in it IS the completed appearance. A contestant in the
//      airing season is not in it yet, which is the mechanism — not a special
//      case — behind "no Big Brother alumni until a Big Brother season ends".
//   2. NOT PLAYING RIGHT NOW. Someone in the house cannot post from outside it.
//   3. A VOICE. A host with no voice profile has nothing to say in character.
//   4. SHOW-SPECIFIC LABELS need an appearance IN THAT SHOW. Cross-format hosts
//      stay eligible; they are labelled as visitors rather than pretending to a
//      history they do not have.
//
// Pure: takes the databases, returns records. No fetch, no DOM.
import { computeFame } from '../fame.js';

const slug = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Every show a player has actually finished a season of. */
function showsPlayed(player) {
  const out = new Set();
  for (const d of player.seasonDetails || []) out.add(d.format || 'total-drama');
  return [...out];
}

/**
 * What this alumnus is worth listening to about.
 *
 * Read off their record rather than assigned: somebody with four competition
 * wins talks about competitions, a juror talks about jury management. The
 * expertise is then matched against what happened tonight, which is how a
 * finale panel differs from a challenge-night panel.
 */
function expertiseOf(player) {
  const d = player.seasonDetails || [];
  const sum = k => d.reduce((n, x) => n + (Number(x[k]) || 0), 0);
  const out = [];

  if (sum('challengeWins') + sum('immunityWins') >= 3) out.push('competitions');
  if (d.some(x => Number(x.juryVotes) > 0)) out.push('jury management');
  if (d.some(x => /juror/i.test(x.status || ''))) out.push('the jury');
  if (d.some(x => Number(x.placement) === 1)) out.push('winning');
  if (d.some(x => (x.unbreakableBonds || []).length >= 2)) out.push('alliances');
  if (d.length >= 3) out.push('returning');
  if (sum('idolsFound') >= 1) out.push('advantages');
  if (sum('votesReceived') >= 8) out.push('surviving votes');
  return out.length ? out : ['the social game'];
}

/** The nearest star band, in words. Fame is a number; a room needs a label. */
export function fameTerm(stars) {
  return stars >= 5 ? 'Icon'
    : stars >= 4 ? 'Celebrity'
    : stars >= 3 ? 'Star'
    : stars >= 2 ? 'Known'
    : stars >= 1 ? 'Remembered'
    : 'Alumnus';
}

/**
 * Everybody eligible to host, ranked by standing.
 *
 * `airingCast` is the current season's players — by name or slug, either works,
 * because the two databases disagree about which they store and a mismatch here
 * silently puts a competing player on the panel.
 */
export function eligibleHosts({
  players, seasons, rankings, voices = {}, format = 'total-drama', airingCast = [],
} = {}) {
  const roster = players?.players || [];
  const fame = computeFame({ players, seasons, rankings, franchise: seasons?.franchise });
  const playing = new Set((airingCast || []).flatMap(n => [slug(n), String(n || '').trim()]));

  return roster
    .filter(p => !playing.has(p.id) && !playing.has(p.name))
    .filter(p => (p.seasonDetails || []).length > 0)
    .filter(p => voices[p.name])
    .map(p => {
      const f = fame.get(p.id) || { stars: 0, score: 0 };
      const shows = showsPlayed(p);
      const best = Math.min(...(p.seasonDetails || []).map(d => Number(d.placement) || 99));
      return {
        slug: p.id,
        name: p.name,
        stars: f.stars,
        fameScore: f.score,
        fameTerm: fameTerm(f.stars),
        shows,
        seasonsPlayed: (p.seasonDetails || []).length,
        bestPlacement: Number.isFinite(best) ? best : null,
        wins: (p.seasonDetails || []).filter(d => Number(d.placement) === 1).length,
        expertise: expertiseOf(p),
        voice: voices[p.name] || null,
        // Cross-format hosts are eligible and SAID to be visiting, rather than
        // being dressed up as alumni of a show they have never played.
        native: shows.includes(format),
        lastSeason: (p.seasonDetails || []).reduce(
          (n, d) => Math.max(n, Number(d.season) || 0), 0),
      };
    })
    .sort((a, b) => b.fameScore - a.fameScore || a.name.localeCompare(b.name));
}

/**
 * The hosts attached to this season — the 8-14 the room feels like it belongs to.
 *
 * Same-show authority is a bonus rather than a gate, so an icon from the other
 * format can still cover a premiere; without that, a new show opens to an empty
 * green room on the one night it most needs voices.
 */
export function seasonPanel(hosts, { format = 'total-drama', size = 12 } = {}) {
  const scored = hosts.map(h => ({
    ...h,
    influence: h.fameScore
      + (h.native ? 25 : 0)
      + Math.min(15, h.lastSeason)          // recent players are fresher in mind
      + h.wins * 8,
  })).sort((a, b) => b.influence - a.influence || a.name.localeCompare(b.name));
  return scored.slice(0, size);
}

/** Which expertise a night calls for. A finale wants finalists, not comp beasts. */
const KIND_EXPERTISE = {
  finale: ['winning', 'the jury', 'jury management'],
  eviction: ['surviving votes', 'the social game'],
  blindside: ['alliances', 'surviving votes'],
  betrayal: ['alliances', 'the social game'],
  'comp-win': ['competitions'],
  nomination: ['surviving votes', 'the social game'],
  'veto-used': ['advantages', 'competitions'],
  'alliance-formed': ['alliances'],
  'showmance-formed': ['the social game'],
  'showmance-broken': ['the social game'],
  twist: ['returning', 'advantages'],
};

/**
 * The 4-7 who actually speak tonight.
 *
 * Chosen from the season's panel by what happened and who it happened to: a
 * host who played WITH one of tonight's subjects has something specific to say,
 * and that beats raw fame. The cap is the point — fifty people talking at once
 * is noise, and the room is meant to read like people who know each other.
 */
export function episodeSpeakers(panel, events, {
  players = null, max = 7, min = 4,
} = {}) {
  const kinds = new Set((events || []).map(e => e.kind));
  const subjects = new Set((events || []).map(e => e.subject).filter(Boolean));

  // Who shared a season with tonight's subjects — a real connection, from the
  // record, not a generated one.
  const castmates = new Map();
  for (const p of players?.players || []) {
    if (!subjects.has(p.id)) continue;
    for (const d of p.seasonDetails || []) {
      for (const bond of d.unbreakableBonds || []) {
        castmates.set(slug(bond), (castmates.get(slug(bond)) || 0) + 1);
      }
    }
  }

  const wanted = new Set([...kinds].flatMap(k => KIND_EXPERTISE[k] || []));
  const scored = panel.map(h => {
    const expertise = h.expertise.filter(e => wanted.has(e)).length;
    return {
      ...h,
      relevance: (h.influence ?? h.fameScore)
        + expertise * 30
        + (castmates.get(h.slug) || 0) * 40,
    };
  }).sort((a, b) => b.relevance - a.relevance || a.name.localeCompare(b.name));

  return scored.slice(0, Math.max(min, Math.min(max, scored.length)));
}

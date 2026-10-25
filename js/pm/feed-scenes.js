// pm/feed-scenes.js — the villa scenes the audience talks about online
//
// The social feed (js/social/packs/perfect-match.js) reads a night of the villa
// from one of two places: the played row (`pm.events`, every scene) or the
// published round (js/pm/export.js `pmVotingHistory`, which keeps none of the
// scripts). Both go through `feedScenes` here, so the night a viewer reads on
// the site is the same night the simulator played. A leaf module: nothing
// heavier than this list reaches the social page.
//
// Each aired scene of a listed kind becomes { kind, feed, players, fame, ...facts }:
// `feed` is the pack's event kind, `fame` how loudly it aired (the sum of the
// `pop` fame it gave), and the facts are the few `extra` fields a post may say.

/** Engine kind → the feed's kind. */
export const FEED_SCENES = {
  // rows, whatever started them
  argument: 'row', 'rival-row': 'row', 'casa-row': 'row', 'photo-row': 'row', 'lie-row': 'row',
  'feud-confront': 'row', 'grass-confront': 'row', 'visit-confront': 'row', 'betray-confront': 'row',
  'snogger-row': 'row', 'couple-goals-row': 'row',
  'jealous-confront': 'jealous',
  blowup: 'blowup',
  gossip: 'gossip',
  'told-confront': 'had-it-out',
  'stirrer-confront': 'row',
  kiss: 'first-kiss',
  'movie-clip': 'movie-night',
  'love-said': 'love-said',
  breakdown: 'tears',
  reunite: 'back-together',
  'exclusive-ask': 'made-official', 'official-ask': 'made-official',
  // the storylines (js/pm/threads.js), the most of an episode since 2026-10-25:
  // somebody grafting on somebody coupled, a head turned, a graft shut down,
  // the cracks in a couple, and one that ends
  pull: 'grafting', 'graft-turn': 'head-turned', 'graft-shut': 'shut-down',
  'where-head': 'cracks', 'tower-q': 'cracks', 'doubt-end': 'called-off',
};

const FACTS = ['firstKiss', 'verdict', 'split', 'of', 'yes', 'title', 'audience', 'cause', 'close'];

const fameOf = e => Object.values(e.pop || e.extra?.pop || {})
  .reduce((s, p) => s + (Number(p?.fame) || 0), 0);

/** One aired scene, as the feed keeps it. Null for a scene the feed ignores. */
export function feedScene(e) {
  let feed = FEED_SCENES[e?.kind];
  if (!feed || !e.aired) return null;
  const x = e.extra || {};
  if (feed === 'first-kiss' && !x.firstKiss) return null;
  // Only a story's pull is a graft (an everyday chat is not news), only an
  // answer that hurt is a crack, only a doubt that ended the couple ends one.
  if (e.kind === 'pull' && x.thread?.type !== 'graft') return null;
  if (e.kind === 'where-head' && !['honest', 'deflect'].includes(x.of)) return null;
  if (e.kind === 'tower-q' && x.of !== 'other-honest') return null;
  if (e.kind === 'doubt-end' && x.of !== 'friends') return null;
  if (feed === 'made-official' && x.yes === false) return null;
  // A telling that ended the couple is a different night from one they survived.
  if (feed === 'had-it-out' && x.split) feed = 'called-off';
  const out = { kind: e.kind, feed, players: [...(e.players || [])], fame: Math.round(fameOf(e) * 10) / 10 };
  for (const k of FACTS) if (x[k] != null && typeof x[k] !== 'object') out[k] = x[k];
  if (Array.isArray(x.audience)) out.audience = [...x.audience];
  return out;
}

/** Every scene of a night the feed may talk about, in airing order. */
export function feedScenes(events = []) {
  return events.map(feedScene).filter(Boolean);
}

// ══════════════════════════════════════════════════════════════════════
// bb/story/places.js — where a private conversation goes, in the house and on the island
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's rule (td/story/places.js), on Big Brother's house: a conversation that needs a
// kind of place is staged at one of the painted spots of that kind (the user's Reality Resort
// plates, tools/bb-resort), and two conversations never share a spot in the same stretch. The
// user, 2026-10-13: "fully use this island", and then "the spots are underutilized". The island's
// hidden places (the pier, the ponds, the lagoon, the volcano) are where a deal goes to be
// unheard; the shoreline and the dock are where a couple goes; the bathroom is where somebody
// goes to fall apart.
//
// A spot is a plate id. `room` is the engine room it plays as (the stage set comes from it:
// ROOM_SET in vp-bb-ep/steps.js), `label` what the slate says.

import { gs } from '../../core.js';

export const SPOTS = {
  'storage': { room: 'storage-room', label: 'Storage Room' },
  'storage-2': { room: 'storage-room', label: 'Storage Room' },
  'bathroom': { room: 'bathroom', label: 'Bathroom' },
  'havenot': { room: 'have-not-room', label: 'Have-Not Room' },
  'hoh-suite': { room: 'hoh-room', label: 'HOH Room' },
  'pier-east': { room: 'backyard', label: 'The Pier', island: true },
  'pond-north': { room: 'backyard', label: 'North Pond', island: true },
  'pond-east': { room: 'backyard', label: 'East Pond', island: true },
  'lagoon': { room: 'backyard', label: 'The Lagoon', island: true },
  'volcano-lookout': { room: 'backyard', label: 'The Volcano', island: true },
  'beach-shoreline': { room: 'backyard', label: 'The Beach', island: true },
  'beach-loungers': { room: 'backyard', label: 'The Beach', island: true },
  'dock': { room: 'backyard', label: 'West Dock', island: true },
  'pool-edge': { room: 'backyard', label: 'Backyard' },
  'balcony': { room: 'backyard', label: 'Backyard' },
};

// The kinds. A deal wants nobody near; a couple wants somewhere nice and nobody near; somebody
// upset wants a door that shuts, or the sea.
const KINDS = {
  secret: ['storage', 'storage-2', 'pier-east', 'pond-north', 'pond-east', 'lagoon', 'volcano-lookout', 'bathroom'],
  couple: ['beach-shoreline', 'beach-loungers', 'dock', 'pool-edge', 'balcony', 'lagoon', 'havenot'],
  alone: ['bathroom', 'beach-shoreline', 'balcony', 'pond-north', 'havenot'],
  hoh: ['hoh-suite'],
};

// A scene whose own words put it on furniture or in a room stays indoors: the island has no bed.
const INDOOR = /\b(bed|beds|bunk|duvet|pillow|sofa|couch|kitchen|counter|fridge|stove|oven|shower|mirror|sink|table|door|shelves|hoh room|storage room|bathroom|bedroom|living room)\b/i;

// spots taken this stretch, per week (a Map, never saved: the director runs a week in one go)
const taken = new Map();
const takenFor = ctx => {
  const k = `${ctx?.week?.num || 0}|${ctx?.stretch ?? 0}`;
  if (!taken.has(k)) { if (taken.size > 64) taken.clear(); taken.set(k, new Set()); }
  return taken.get(k);
};

const PRIVATE_SHARE = 5;   // in ten: not every private talk goes somewhere special

/**
 * The spot for a conversation that wants privacy: { spot, room, label } or null (it stays where
 * the house is). `kind` is the scene's type/step text, `text` its own words.
 */
export function spotFor(kind, cast, ctx, salt, text = '') {
  const k = String(kind || '');
  const n = (cast || []).length;
  if (!n || n > 4) return null;
  // a rally is a speech to whoever is in the room, not a secret (the read of 2026-10-14: "Who here
  // feels safe?" asked of the reeds at the north pond)
  if (/rally/.test(k)) return null;
  const h = [...String(salt)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  if (h % 10 >= PRIVATE_SHARE) return null;
  const withHoh = ctx?.hoh && cast.includes(ctx.hoh);
  let list = null;
  if (/deal|pact|plan|bloc|target\.(pitch|lobby|count)|power-hoh|campaign|hohweek/.test(k) && withHoh) list = KINDS.hoh;
  else if (/^(alliance|scheme)|bloc-|plan-|scheme-|deals-|target\.(gossip|pitch|lobby|count)|recruit|poach|nexthoh|veto\.hope|prejury|jury\.manage|endgame|trust|style\.(strategist|manipulator)/.test(k)) list = KINDS.secret;
  else if (/homesick|breakdown|cry|apology|cold|bond\.vent/.test(k) && n <= 2) list = KINDS.alone;
  else if (/showmance|couple|secret|latenight/.test(k) && n <= 2) list = KINDS.couple;
  if (!list) return null;
  const indoor = INDOOR.test(String(text));
  const avoid = takenFor(ctx);
  const room = ctx?.avoidRoom;
  const fit = list.filter(s => !avoid.has(s) && (!indoor || !SPOTS[s].island) && SPOTS[s].room !== room);
  if (!fit.length) return null;
  const spot = fit[(h >> 4) % fit.length];
  avoid.add(spot);
  return { spot, ...SPOTS[spot] };
}

// How a scene opens at a spot it was moved to, when its own lines do not set the scene ({a}, {b}: the
// first two people in it). A walk to the volcano is a decision, and the opening says so.
const OPENS = {
  'storage': ['The storage room. {a} pulls the door to behind {b}.', 'Storage room, between the cereal and the paper towels. Nobody else is in here, which is the point.',
    'The storage room. {a} holds up a tin of beans as an alibi.', 'Storage room. {b} sits on a crate of water bottles; {a} leans on the shelf.'],
  'storage-2': ['The storage room. {a} checks the hallway once before the door closes.', 'Storage room. {a} and {b} pretend to look for something on the shelves.',
    'The storage room, by the drinks fridge, its hum covering most of it.', 'Storage room. {a} is restacking the cereal, which nobody asked {a} to do.'],
  'bathroom': ['The bathroom. {a} runs a tap, for the noise.', 'Bathroom. The door locks, which is the only door in the house that does.',
    'The bathroom. {a} and {b} talk to each other in the mirror instead of face to face.', 'Bathroom. {b} sits on the bench; {a} stands by the sinks.'],
  'havenot': ['The have-not room, empty for once.', 'Have-not room. Nobody sleeps in here by choice, so nobody comes in.'],
  'pier-east': ['The far end of the pier, as far from the house as the island allows.', 'Out on the pier, legs over the edge, the boat bumping the posts.', '{a} and {b} walk the whole length of the pier before anybody says a word.',
    'The pier. {a} keeps one eye on the path back to the resort.', 'The end of the pier. Out here the microphones mostly get the wind.'],
  'pond-north': ['North Pond. Nobody comes up here unless they mean to.', 'The north pond, among the reeds. Even the cameras have to work for it.', '{a} leads {b} up the overgrown path to the north pond.',
    'North Pond. {a} sits on the fallen log; {b} stays standing.', 'Up at the north pond, the lily pads and the two of them.'],
  'pond-east': ['East Pond, under the rope swing.', 'The east pond. {a} skims a stone while {b} watches the path.', 'The little dock on the east pond. Quiet, except for the frogs.',
    'East Pond. {b} is dangling a foot off the dock; {a} sits down beside it.', 'The east pond, out of sight of every window in the resort.'],
  'lagoon': ['The lagoon, by the waterfall. The water covers anything said under it.', 'Down at the lagoon, the falls loud enough to talk over.', '{a} and {b} climb down to the lagoon, where the noise of the falls does the hiding.',
    'The lagoon. {a} sits on the warm rocks at the edge; {b} paddles.', 'The far side of the lagoon, behind the spray.'],
  'volcano-lookout': ['The volcano lookout. The whole island is down there, and nobody from it is up here.', 'It is a long climb to the lookout. {a} has decided this is worth it.', 'Up at the lookout, the resort a little toy in the trees below.',
    'The lookout bench. {a} and {b} are both out of breath, which buys a minute of silence.', 'The top of the volcano path, where nobody wanders past by accident.'],
  'beach-shoreline': ['The shoreline, where the waves are loud enough to keep a secret.', 'Down on the beach, walking the waterline.'],
  'beach-loungers': ['Two loungers on the beach, side by side, angled away from the house.', 'The beach loungers, under the striped umbrella.'],
  'dock': ['The west dock, with the sun going down behind it.', 'Out on the west dock, feet in the water.'],
  'pool-edge': ['The edge of the pool, feet in the water, voices low.'],
  'balcony': ['The balcony rail, looking out at the sea.'],
};
export function openingAt(spot, who, salt) {
  const list = OPENS[spot];
  if (!list?.length) return null;
  const h = [...String(salt)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  // the least-heard opening of this spot this season (the read of 2026-10-13: the same pond, six times)
  const heard = gs ? ((gs.bb ||= {}).spotOpens ||= {}) : {};
  const pickd = list.map((t, i) => [t, i]).sort((x, y) => (heard[x[0]] || 0) - (heard[y[0]] || 0) || ((h + x[1]) % list.length) - ((h + y[1]) % list.length))[0][0];
  heard[pickd] = (heard[pickd] || 0) + 1;
  return pickd.replace(/\{a\}/g, who[0] || 'Somebody').replace(/\{b\}/g, who[1] || who[0] || 'somebody');
}

/** Whether a spot is out on the island (no house around it: no background from the kitchen). */
export const onIsland = spot => !!SPOTS[spot]?.island;

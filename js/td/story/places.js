// ══════════════════════════════════════════════════════════════════════
// td/story/places.js — where a kind of conversation happens, at any venue
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "a secret conversation would use more secret places, a common
// conversation a common place, a bathroom conversation is in the washroom... generic
// enough that every venue uses this system".
//
// A story pool entry says what KIND of place it needs (`place: 'secret'`); each venue
// lists its painted places of that kind (assets/sets/td/<venue>/<spot>-day.webp), and
// the scene is staged there. The words follow the place: a beat says {here} ("the
// dock", "the galley"), never a hard-coded spot, so the stage and the lines agree.
//
//   secret   somewhere two or three people can talk without being overheard
//   aside    a little away from everyone, but not hidden
//   public   where the whole camp hangs around
//   sleep    where they sleep (the morning, late at night)
//   eat      where they eat
//   wash     where they wash up (the washroom, the water source)
//   water    a shore, a lake, a dock: fishing, skipping stones, feet in the water
//   work     where chores happen
//   fire     the evening fire, where people gather
//
// A kind a venue does not have (no shore on the jet) makes the entry unfit there.

export const PLACES = {
  'hosted-camp': {
    secret: ['forest-trail', 'boathouse', 'caves', 'waterfall'], aside: ['dock', 'cabins', 'lake', 'river'], public: ['communal-grounds', 'mess-hall'],
    sleep: ['cabin-inside'], eat: ['mess-hall'], wash: ['washroom'], water: ['dock', 'lake', 'beach'], work: ['communal-grounds', 'cabins'], fire: ['campfire'],
  },
  'survival-island': {
    secret: ['jungle-trail', 'ruins', 'cave'], aside: ['shoreline', 'fishing-area', 'water-source'], public: ['campfire', 'beach'],
    sleep: ['shelter'], eat: ['campfire'], wash: ['water-source'], water: ['shoreline', 'fishing-area', 'beach'], work: ['campfire', 'shelter'], fire: ['campfire'],
  },
  carnival: {
    secret: ['forest-edge', 'corn-maze'], aside: ['rocky-beach', 'lake-shore'], public: ['campsite', 'carnival-entrance'],
    sleep: ['shelter'], eat: ['campsite'], wash: ['lake-shore'], water: ['lake-shore', 'rocky-beach'], work: ['campsite'], fire: ['campsite'],
  },
  'film-lot': {
    secret: ['prop-storage', 'soundstage-corridor', 'western-set'], aside: ['city-set', 'trailers'], public: ['studio-backlot', 'craft-services'],
    sleep: ['trailer-inside'], eat: ['craft-services'], wash: ['trailer-inside'], water: [], work: ['studio-backlot'], fire: [],
  },
  'world-tour': {
    secret: ['cargo-hold'], aside: ['galley', 'aisle'], public: ['economy'],
    sleep: ['economy'], eat: ['galley'], wash: ['aisle'], water: [], work: ['galley'], fire: [],
  },
};

// How a line says the place out loud ({here}).
export const SAID = {
  'forest-trail': 'the trail', boathouse: 'the boathouse', caves: 'the caves', waterfall: 'the waterfall', dock: 'the dock', cabins: 'the cabin porch',
  lake: 'the lake', river: 'the river', 'communal-grounds': 'the middle of camp', 'mess-hall': 'the mess hall', 'cabin-inside': 'the cabin', washroom: 'the washrooms',
  beach: 'the beach', campfire: 'the fire pit', kitchen: 'the kitchen', cliff: 'the cliff',
  'jungle-trail': 'the jungle path', ruins: 'the ruins', cave: 'the cave', shoreline: 'the shoreline', 'fishing-area': 'the fishing rocks', 'water-source': 'the waterfall pool', shelter: 'the shelter',
  'forest-edge': 'the edge of the woods', 'corn-maze': 'the corn maze', 'rocky-beach': 'the rocky beach', 'lake-shore': 'the lake shore', campsite: 'the campsite', 'carnival-entrance': 'the carnival gate',
  'prop-storage': 'prop storage', 'soundstage-corridor': 'the soundstage hallway', 'western-set': 'the western set', 'city-set': 'the city set', trailers: 'outside the trailers', 'trailer-inside': 'the trailer',
  'studio-backlot': 'the backlot', 'craft-services': 'craft services',
  'cargo-hold': 'the cargo hold', galley: 'the galley', aisle: 'the aisle', economy: 'economy',
};

// ...and with its preposition ({here}: "on the dock", "in the galley", "at the fire pit")
const IN = new Set(['cabin-inside', 'washroom', 'mess-hall', 'caves', 'boathouse', 'shelter', 'cave', 'corn-maze', 'trailer-inside', 'galley', 'aisle', 'economy',
  'cargo-hold', 'kitchen', 'prop-storage', 'soundstage-corridor', 'ruins', 'craft-services', 'communal-grounds']);
const ON = new Set(['dock', 'beach', 'forest-trail', 'cabins', 'shoreline', 'jungle-path', 'jungle-trail', 'fishing-area', 'rocky-beach', 'lake-shore', 'studio-backlot',
  'western-set', 'city-set', 'cliff']);
const prep = id => (IN.has(id) ? 'in' : ON.has(id) ? 'on' : 'at');

// a team's chores and meetings happen at its own camp (the user, 2026-10-10: "why would the team meeting be at
// the beach and not camp"): no venue's `work` is a beach or a shore
const NEAR = { work: ['public', 'aside'], public: ['aside', 'work'], aside: ['secret', 'water', 'public'], secret: ['aside'], water: ['aside', 'public'], fire: ['public', 'aside'], sleep: ['aside', 'public'], wash: ['aside', 'sleep'], eat: ['public'] };

const LABEL = id => (SAID[id] || id.replace(/-/g, ' ')).replace(/^the /, '').replace(/\b\w/g, c => c.toUpperCase());

/** Whether a venue has a place of this kind. */
export const hasPlace = (venue, kind) => !kind || kind === 'confessional' || !!(PLACES[venue] || PLACES['hosted-camp'])[kind]?.length;

/**
 * A place of `kind` at `venue`, chosen by the scene's own roll: { id, label, said }.
 * 'confessional' is the confession cam. Null when the venue has none of that kind.
 */
export function placeOf(venue, kind, roll = 0, avoid = null) {
  if (kind === 'confessional') return { id: 'confessional', label: 'Confessional', said: 'the confessional', here: 'in the confessional' };
  const list = (PLACES[venue] || PLACES['hosted-camp'])[kind] || [];
  if (!list.length) return null;
  // two conversations do not share a spot in the same stretch of the day (the user, 2026-10-07):
  // the first free one from the roll on, else the roll's own
  const start = Math.floor(roll * list.length) % list.length;
  const order = list.map((_, i) => list[(start + i) % list.length]);
  let id = order.find(x => !avoid?.has(x));
  // every place of this kind is taken in this stretch of the day: a related kind, so two talks
  // never share a spot (chores move to another public spot, a private word to another quiet one)
  if (!id && avoid) for (const k of NEAR[kind] || []) { const alt = ((PLACES[venue] || PLACES['hosted-camp'])[k] || []).find(x => !avoid.has(x)); if (alt) { id = alt; break; } }
  id ||= order[0];
  const said = SAID[id] || id.replace(/-/g, ' ');
  return { id, label: LABEL(id), said, here: id === 'trailers' ? said : `${prep(id)} ${said}` };
}

/** The words for a spot the engine chose (a long scene staged where the event happened). */
export function placeById(id) {
  if (!id) return null;
  if (id === 'confessional') return placeOf(null, 'confessional');
  const said = SAID[id] || id.replace(/-/g, ' ');
  return { id, label: LABEL(id), said, here: id === 'trailers' ? said : `${prep(id)} ${said}` };
}

/** The kind of place a spot is at a venue (its first listing), or null. */
export function kindOf(venue, id) {
  const table = PLACES[venue] || PLACES['hosted-camp'];
  return Object.keys(table).find(k => table[k].includes(id)) || null;
}

// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/locals.js — the race's locals, one avatar each (the user's, 2026-10-20)
// ══════════════════════════════════════════════════════════════════════
//
// The people the teams meet: a speaker the writer calls "The driver", "The ticket agent", "The judge", "The vendor" or
// "A local", and each place's own local at its challenge (the fisherman at the welcome rite, the chef at the stew).
// They were a grey silhouette; the user made their avatars (Downloads/RidonculousRace-frames/edit/locals, copied to
// assets/avatars/rr-locals/<id>.webp).
//
// localFor(speaker, place, stretch): who a speaking local is, here: the place's own local at its challenge when the
// speaker is the one running it (the judge, the vendor, "a local"), else the role's own face.
// placeLocal(place, stretch): the place's own local at that challenge, or null.

export const LOCALS = {
  driver: 'The driver', 'ticket-agent': 'The ticket agent', judge: 'The judge', vendor: 'The vendor',
  'local-woman': 'A local', 'local-man': 'A local',
  'surfer-boy': 'The surfer boy', 'carnival-dancer': 'The carnival dancer', 'gym-coach': 'The gym coach',
  'prison-guard': 'The prison guard', farmer: 'The farmer', 'parka-local': 'The igloo builder', 'tea-picker': 'The tea picker',
  'tower-warden': 'The tower warden', fisherman: 'The fisherman', 'spice-merchant': 'The spice merchant', 'stew-chef': 'The chef',
  'caricature-artist': 'The artist', 'skydive-instructor': 'The instructor', 'street-cook': 'The cook',
  'savanna-ranger': 'The ranger', 'pirate-captain': 'The captain', 'telephone-local': 'The local', 'dance-elder': 'The elder',
  'chuckwagon-cook': 'The cook', cowboy: 'The cowboy', 'dragon-ranger': 'The ranger', magician: 'The magician',
  'pepper-vendor': 'The vendor', 'catfish-fisherman': 'The fisherman', 'mine-guide': 'The guide', conductor: 'The conductor',
  'tango-instructor': 'The instructor', gaucho: 'The rancher', 'game-show-host': 'The host', butcher: 'The butcher',
  'slap-dance-judge': 'The judge', 'jungle-guide': 'The guide', 'museum-guard': 'The guard', 'games-official': 'The official',
  'base-agent': 'The agent', 'longship-captain': 'The captain', minister: 'The minister', monk: 'The monk',
  'delicacies-cook': 'The cook', 'savanna-elder': 'The elder', 'egg-judge': 'The judge', 'fire-dancer': 'The dancer',
  'cliff-guide': 'The guide',
};

// place -> challenge -> its local
export const PLACE_LOCALS = {
  'coast-palace': { 'sand-palace': 'surfer-boy' },
  'carnival-rainforest': { costume: 'carnival-dancer' },
  'haunted-castle': { gym: 'gym-coach' },
  'swamp-prison': { 'prison-cell': 'prison-guard' },
  'outback-farm': { bunnies: 'farmer' },
  'ice-floe': { igloo: 'parka-local' },
  'tea-hills': { 'tea-basket': 'tea-picker', 'toy-train': 'conductor' },
  'twin-tower-bridge': { kidnapper: 'tower-warden', 'crown-jewel': 'tower-warden' },
  'fishing-cove': { 'welcome-rite': 'fisherman' },
  'red-sand-desert': { spices: 'spice-merchant', stew: 'stew-chef' },
  'iron-tower-city': { caricature: 'caricature-artist' },
  'great-wall-hills': { skydive: 'skydive-instructor', skewers: 'street-cook' },
  'savanna-falls': { rhino: 'savanna-ranger' },
  'treasure-isles': { 'pirate-map': 'pirate-captain', doubloons: 'pirate-captain' },
  'geyser-island': { telephone: 'telephone-local' },
  'fjord-peaks': { 'jump-dance': 'dance-elder' },
  'prairie-ranch': { beans: 'chuckwagon-cook', bull: 'cowboy' },
  'dragon-isle': { venom: 'dragon-ranger' },
  'neon-desert': { 'buggy-magic': 'magician' },
  'pyramid-coast': { 'pepper-cliff': 'pepper-vendor' },
  'stilt-river': { catfish: 'catfish-fisherman' },
  'frozen-mine': { borehole: 'mine-guide', 'ice-yacht': 'mine-guide' },
  'pampas-ranch': { tango: 'tango-instructor', emu: 'gaucho' },
  'game-show-city': { pinball: 'game-show-host' },
  'snow-peaks': { sausage: 'butcher', 'slap-dance': 'slap-dance-judge' },
  'jungle-ruins': { 'jungle-trail': 'jungle-guide', 'golden-idol': 'jungle-guide' },
  'glass-pyramid-city': { 'broken-statue': 'museum-guard' },
  'marble-temple-hill': { hurdles: 'games-official', 'high-jump': 'games-official', 'ancient-games': 'games-official' },
  'secret-base-desert': { 'sneak-in': 'base-agent', artifact: 'base-agent' },
  'fjord-sea': { longship: 'longship-captain', 'meatball-cannon': 'longship-captain' },
  'great-falls': { 'wedding-slots': 'minister' },
  'bamboo-wall-hills': { 'wall-race': 'monk', delicacies: 'delicacies-cook' },
  'grass-savanna': { plums: 'savanna-elder' },
  'stone-head-island': { eggs: 'egg-judge' },
  'lei-island': { 'fire-walk': 'fire-dancer' },
  'cliff-pool-isle': { 'falls-dive': 'cliff-guide' },
};

// The full-body cut-outs of people, per place: their avatar stands there instead (the user, 2026-10-20: "the cutout
// use is still the fullbody"; the race is avatars, people never full-body sprites)
export const PERSON_PROPS = {
  'coast-palace': { surfer: 'surfer-boy' }, 'carnival-rainforest': { dancer: 'carnival-dancer' },
  'haunted-castle': { coach: 'gym-coach' }, 'swamp-prison': { guard: 'prison-guard' }, 'outback-farm': { farmer: 'farmer' },
  'ice-floe': { local: 'parka-local' }, 'tea-hills': { picker: 'tea-picker' }, 'twin-tower-bridge': { warden: 'tower-warden' },
  'fishing-cove': { fisherman: 'fisherman' }, 'red-sand-desert': { merchant: 'spice-merchant', chef: 'stew-chef' },
  'great-wall-hills': { vendor: 'street-cook' }, 'pampas-ranch': { instructor: 'tango-instructor' }, 'fjord-peaks': { judges: 'dance-elder' },
};
export const personOf = (place, key) => (key && PERSON_PROPS[place]?.[String(key).split('@')[0]]) || null;

export const localUrl = id => `assets/avatars/rr-locals/${id}.webp`;
export const placeLocal = (place, stretch) => PLACE_LOCALS[place]?.[stretch] || null;

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// the role a speaker's name says (the writer's words: roles.js LOCAL)
const ROLE = { 'the driver': 'driver', 'the ticket agent': 'ticket-agent', 'the judge': 'judge', 'the vendor': 'vendor' };

/** The local a speaker is: { id, name, url } (null for the crowd). `speaker` is the line's name; `seed` keeps "a local" the same face all scene. */
export function localFor(speaker, place = null, stretch = null, seed = '') {
  const key = String(speaker || '').toLowerCase();
  if (key === 'the crowd') return null;          // a crowd has no one face
  const own = placeLocal(place, stretch);
  // the one running a challenge is that challenge's own local (the judge at the eggs is the egg judge)
  if (own && (key === 'the judge' || key === 'the vendor' || key === 'a local' || key === 'the local' || key === LOCALS[own].toLowerCase())) return { id: own, name: LOCALS[own], url: localUrl(own) };
  const id = ROLE[key] || (hash(`${seed}|${key}`) % 2 ? 'local-woman' : 'local-man');
  return { id, name: LOCALS[id], url: localUrl(id) };
}

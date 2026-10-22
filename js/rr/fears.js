// What a scary challenge makes a racer DO, and the stage where they do it (the user, 2026-10-22, at the pepper cart on
// Pyramid Coast: "why are they talking about falling and rope when they are at the pepper vendor?"). A fear moment
// plays at that stage, not on arrival, and its lines are the ones for that act: a racer who freezes on a cliff ledge
// over the sea is not clipped to a rope, and one who won't go into a dark tunnel is not looking down.
//
//   jump      off something high, on purpose (a cliff, a platform, a plane door)
//   drop      lowered or carried down from a height by a line (a zipline, a winch, a window platform)
//   climb     up something high, hand over hand or step by step
//   rail      round the outside of something high, clipped onto a rail
//   rope      across a drop on a rope or a wire
//   cross     across something that can tip or give way (stepping stones, floes, a log)
//   ride      in or on something that goes where it likes (a raft over a fall, a bull, a sled)
//   swim      into the water, under it
//   creature  close to an animal that can bite, sting, kick or charge
//   dark      into the dark, a tunnel, a tomb, past searchlights
//   fire      over fire
//   crowd     in front of people who are watching (a routine, a runway, a race on the old track)
//   eat       something that should not be eaten
//   any       nothing one word says: only lines that name no act
//
// Keyed `place/stretch`, or `place/stretch:side` at an Either/Or.
export const FEARS = {
  'home-city/tower:skydeck': { at: 'rail', does: 'rail' },
  'home-city/zipline': { at: 'clip-in', does: 'drop' },
  'fire-mountain-isle/lava-falls:lava': { at: 'stepping-stones', does: 'cross' },
  'fire-mountain-isle/lava-falls:falls': { at: 'behind-the-falls', does: 'cross' },
  'fire-mountain-isle/lagoon': { at: 'lagoon-wade', does: 'swim' },
  'skyline-finale/buoys': { at: 'buoy-hunt', does: 'swim' },
  'iron-tower-city/catacombs': { at: 'manhole', does: 'dark' },
  'great-wall-hills/skydive': { at: 'the-door', does: 'jump' },
  'rock-north/ice-river': { at: 'floe-hop', does: 'cross' },
  'savanna-falls/falls-selfie': { at: 'the-edge', does: 'ride' },
  'savanna-falls/rhino': { at: 'creep-up', does: 'creature' },
  'treasure-isles/doubloons': { at: 'going-under', does: 'swim' },
  'tomb-sands/pyramid:over': { at: 'the-steps', does: 'climb' },
  'tomb-sands/pyramid:under': { at: 'three-doors', does: 'dark' },
  'tomb-sands/reed-boat': { at: 'cast-off', does: 'ride' },
  'torch-statue-harbour/statue-climb': { at: 'rope-ride', does: 'drop' },
  'torch-statue-harbour/sewer': { at: 'into-drain', does: 'dark' },
  'torch-statue-harbour/big-apple': { at: 'wade-in', does: 'swim' },
  'red-outback/emu-catch': { at: 'emu-chase', does: 'creature' },
  'red-outback/sheep-bungee': { at: 'the-platform', does: 'jump' },
  'coast-palace/shark': { at: 'in-the-water', does: 'creature' },
  'carnival-rainforest/ants': { at: 'hand-in', does: 'creature' },
  'carnival-rainforest/gorge': { at: 'the-swing', does: 'jump' },
  'haunted-castle/gym': { at: 'the-split', does: 'crowd' },
  'lei-island/ring-dive': { at: 'dive-down', does: 'swim' },
  'lei-island/fire-walk': { at: 'the-coals', does: 'fire' },
  'glass-tower-gulf/squeegee-serve:squeegee': { at: 'the-drop', does: 'drop' },
  'glass-tower-gulf/squeegee-serve:serve': { at: 'the-serve', does: 'any' },
  'swamp-prison/swamp-raft': { at: 'launch', does: 'ride' },
  'fjord-peaks/jump-dance:jump': { at: 'the-leap', does: 'jump' },
  'prairie-ranch/bull': { at: 'saddle-up', does: 'ride' },
  'dragon-isle/venom': { at: 'distraction', does: 'creature' },
  'neon-desert/buggy-magic:magic': { at: 'into-cage', does: 'creature' },
  'pyramid-coast/pepper-cliff': { at: 'the-ledge', does: 'jump' },
  'stilt-river/catfish': { at: 'wade-in', does: 'swim' },
  'stilt-river/tunnels': { at: 'in-the-dark', does: 'dark' },
  'frozen-mine/ice-yacht': { at: 'push-off', does: 'ride' },
  'frozen-mine/borehole': { at: 'going-down', does: 'drop' },
  'pampas-ranch/emu': { at: 'ride-out', does: 'ride' },
  'game-show-city/pinball': { at: 'the-launch', does: 'ride' },
  'ice-river/ice-floes': { at: 'first-floe', does: 'cross' },
  'snow-peaks/sausage': { at: 'sausage-ride', does: 'ride' },
  'snow-peaks/slap-dance': { at: 'first-verse', does: 'crowd' },
  'jungle-ruins/jungle-trail': { at: 'piranha-log', does: 'cross' },
  'glass-pyramid-city/runway': { at: 'the-walk', does: 'crowd' },
  'cliff-pool-isle/falls-dive': { at: 'the-edge', does: 'jump' },
  'cliff-pool-isle/bobsled': { at: 'push-off', does: 'ride' },
  'marble-temple-hill/hurdles': { at: 'on-the-line', does: 'crowd' },
  'marble-temple-hill/high-jump': { at: 'run-up', does: 'crowd' },
  'marble-temple-hill/ancient-games:chariot': { at: 'reins', does: 'ride' },
  'marble-temple-hill/ancient-games:wrestle': { at: 'the-circle', does: 'crowd' },
  'secret-base-desert/sneak-in': { at: 'searchlights', does: 'dark' },
  'great-falls/tightrope': { at: 'first-steps', does: 'rope' },
  'bamboo-wall-hills/delicacies': { at: 'the-eggs', does: 'eat' },
  'grass-savanna/plums': { at: 'footballs', does: 'any' },
  'grass-savanna/safari': { at: 'tall-grass', does: 'creature' },
  'stone-head-island/condor-nest': { at: 'up-the-spire', does: 'climb' },
};

// The fear at a team's challenge: { at, does }, or null (not a scary challenge, or an Either/Or side not yet chosen)
export function fearAt(placeId, stretch, side = null) {
  if (!placeId || !stretch?.id) return null;
  return FEARS[`${placeId}/${stretch.id}${side ? `:${side}` : ''}`] || (stretch.sides ? null : FEARS[`${placeId}/${stretch.id}`]) || null;
}

// When a planned run reaches that stage (the end of the stage before it), or null
export function fearTime(stages, at, from) {
  const i = (stages || []).findIndex(x => x.id === at);
  if (i < 0) return null;
  return i === 0 ? from : stages[i - 1].t;
}

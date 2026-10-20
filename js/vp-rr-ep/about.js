// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/about.js — each place, presented by Don over its own wide shots
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-20: "we need presentation of the actual place with a description and image by don". Before a leg
// opens, Don says what the place is: one line a shot, over the place's wide shots (the user's plates), the way the
// show cuts to the location before the first team arrives. No real place names (the world is its own).
//
// aboutOf(place): [{ plate, text }] (the plate as plates.js knows it, else a plate nobody stands on).
import { PLACE_PLATES } from './plates.js';

export const ABOUT = {
  'home-city': [
    ['present-9434583', "Home City! A skyline on a lake, one very tall tower, and the starting line of the race."],
    ['arrive-9434588', "Teams come in at the old central station, take a good look around, and say goodbye to normal life."],
    ['travel-9435210', "And past the tower, a little island airport, where the rest of the world is waiting."]],
  'red-sand-desert': [
    ['present-9435500', "The Red Sand Desert. Dunes as far as you can see, and the sun doing its absolute best."],
    ['present-9435572', "Somewhere out here, a spice market, a stew, and a lot of camels with opinions."]],
  'iron-tower-city': [
    ['present-9435854', "Iron Tower City, the most romantic city in the world. Unless you're racing through it. Then it's just stairs."],
    ['present-9436193', "Museums, painters on every corner, and under the streets, miles of tunnels full of very old cheese."]],
  'great-wall-hills': [
    ['present-9440465', "Great Wall Hills: green mountains, and a wall that goes on for thousands of kilometres."],
    ['present-9440276', "Plus a giant stadium, which teams will reach from above. Quickly. Very quickly."]],
  'rock-north': [
    ['present-9440796', "Rock North! Snow, cabins, saunas, and a town that's very, very serious about loud guitars."],
    ['present-9440799', "The river here is half frozen. The other half is worse."]],
  'savanna-falls': [
    ['present-9441413', "Savanna Falls. One of the biggest waterfalls on the planet, and it does not care how you feel about heights."],
    ['present-9441461', "Around it, the open savanna: acacia trees, long grass, and a rhino who has had enough of tourists."]],
  'treasure-isles': [
    ['present-9449351', "The Treasure Isles! White sand, warm water, and a pirate museum that takes itself extremely seriously."],
    ['present-9450014', "Under the islands, there are caves. In the caves, there is gold. Allegedly."]],
  'skyline-finale': [
    ['present-9450080', "The Skyline. The biggest city of them all, and the last stop of the race."],
    ['present-9450040', "Bright lights, very tall buildings, and somewhere in the middle, a park with a stage and a million dollars."]],
  'tomb-sands': [
    ['present-22410404', "Tomb Sands. A pyramid older than anything you own, standing in the sand like it owns the place. It does."],
    ['arrive-22410042', "Inside it, tunnels, traps and the odd mummy. Outside it, a river with crocodiles. Pick your favourite."]],
  'torch-statue-harbour': [
    ['present-22412488', "Torch Statue Harbour! The giant lady with the torch has been waving at boats for more than a hundred years."],
    ['present-22412602', "Bridges, ferries, a park full of trees, and under the streets, sewers I would not recommend."]],
  'red-outback': [
    ['present-22419827', "The Red Outback: a giant red rock in the middle of nothing, and a lot of nothing around it."],
    ['arrive-22419610', "Out here the emus are fast, the sheep are fluffy, and the cliffs are a long way down."]],
  'fire-mountain-isle': [
    ['present-22425124', "Fire Mountain Isle! A tropical island with a beach, a lagoon, and a live volcano. Two out of three are relaxing."],
    ['present-22425170', "The lava is real. The waterfall is real. The teams' fear? Extremely real."]],
  'coast-palace': [
    ['present-9436727', "Coast Palace. A tiny kingdom on the sea, with a royal palace, a casino and more yachts than people."],
    ['present-9436927', "And a beach, where the sand is soft, the surfers are strict, and the sharks are welcome."]],
  'geyser-island': [
    ['present-9437594', "Geyser Island: mountains, lava fields, and holes in the ground that shoot boiling water at the sky."],
    ['arrive-9437005', "The locals here eat things I can't say on television, and they say words I can't spell."]],
  'carnival-rainforest': [
    ['present-9438215', "The Carnival Rainforest! Green hills, a jungle with ants the size of my thumb, and a party that never stops."],
    ['present-9437791', "There's a gorge here with a vine across it. Somebody always falls in. I'm counting on it."]],
  'haunted-castle': [
    ['present-9438456', "The Haunted Castle. A full moon, a crumbling castle, and a legend about a count who never sleeps."],
    ['present-9438433', "The roads are dark, the coffins are real, and nobody here goes out after sunset. Except you."]],
  'lei-island': [
    ['present-9439460', "Lei Island! Sunsets, palm trees, and the friendliest welcome in the Pacific."],
    ['present-9439148', "Under the pier there's a wedding ring somebody lost. Up the beach, there's a path of red-hot coals."]],
  'glass-tower-gulf': [
    ['present-9439561', "Glass Tower Gulf. The tallest, shiniest, sail-shaped hotel in the world, in the middle of the desert sea."],
    ['present-9439891', "Every window up there needs cleaning. That's where you come in."]],
  'swamp-prison': [
    ['present-9442102', "Swamp Prison: an old jail on the edge of the bayou, closed for years. Mostly."],
    ['present-9442105', "Teams start inside a cell, and the only way out of the swamp is a raft they build themselves."]],
  'outback-farm': [
    ['present-9442701', "Outback Farm. Wheat fields, red dirt, and a farmer with a very serious rabbit problem."],
    ['present-9442822', "The valley out here is so big you could fly over it. Which, coincidentally, you will."]],
  'fjord-peaks': [
    ['travel-9443418', "Fjord Peaks! Steam trains, snowy mountains, and an island culture that's very, very proud of its war dance."],
    ['arrive-9443367', "There's a bridge over a gorge, a river at the bottom of it, and a fish down there with your name on it."]],
  'prairie-ranch': [
    ['present-9443998', "Prairie Ranch: big mountains, big skies, and cowboys who will make you eat your beans."],
    ['present-9444391', "The mechanical bull here has never lost. It's very proud of that."]],
  'ice-floe': [
    ['present-9444530', "Ice Floe. The top of the world, where the snow never melts and the sea is full of ice."],
    ['present-9445072', "Out on the water, the narwhals are watching. On the ice, a village of igloos is waiting."]],
  'dragon-isle': [
    ['travel-9445205', "Dragon Isle! A green island where the biggest lizards in the world sleep in the shade."],
    ['task-9445378', "They're called dragons. They drool. You'll be collecting it. You're welcome."]],
  'neon-desert': [
    ['present-9446140', "The Neon Desert: dunes by day, the brightest strip of lights on the planet by night."],
    ['present-9445818', "Out here there's a buggy course in the sand, and back in town a magician with a lion."]],
  'pyramid-coast': [
    ['present-9446346', "Pyramid Coast. Warm sea, steep cliffs, jungle, and the hottest peppers on the coast."],
    ['present-9446663', "The burros here are slow, the cliffs are high, and the water is a very long way down."]],
  'stilt-river': [
    ['present-9447233', "Stilt River: a whole village on stilts above a muddy river, and the catfish in it are huge."],
    ['present-9447259', "Up in the hills, tunnels in the jungle. Bring a torch. And a friend."]],
  'frozen-mine': [
    ['present-9447601', "The Frozen Mine. A frozen lake, an old mine under it, and yachts that race on the ice."],
    ['arrive-9447661', "It's dark down the mine shaft, it's cold up on the lake, and the sauna is the nicest thing here."]],
  'tea-hills': [
    ['present-9448187', "The Tea Hills: green terraces as far as the eye can see, every one of them covered in tea."],
    ['task-9448429', "And through the hills runs a little toy train that's been puffing up these slopes for a hundred years."]],
  'pampas-ranch': [
    ['present-9449000', "Pampas Ranch! Huge grasslands under huge mountains, and riders with three-ball ropes."],
    ['arrive-9448812', "In the city there's a dance academy, and the teachers there do not accept anything less than passion."]],
  'game-show-city': [
    ['task-22411100', "Game Show City, where every street is a set, and every set is louder than the last."],
    ['arrive-22411016', "The giant pinball table here has eaten better players than you. Literally. Well, nearly."]],
  'ice-river': [
    ['present-22411652', "Ice River! A frozen peak, a snow plain full of little red flags, and a river of floating ice."],
    ['present-22411651', "Follow the flags across the snow, and they lead you to the Chill Zone, right on the edge of an ice cliff."]],
  'snow-peaks': [
    ['present-22413727', "Snow Peaks: mountains, rainbows, cable cars, and a village that loves a sausage."],
    ['present-22413612', "And slap dancing. Don't ask. Actually, do ask. It's wonderful."]],
  'jungle-ruins': [
    ['present-22414265', "The Jungle Ruins. An ancient city in the clouds, and a jungle all the way up to it."],
    ['present-22414264', "Somewhere in those ruins, a golden idol. Somewhere in that jungle, something hungry."]],
  'glass-pyramid-city': [
    ['present-22414919', "Glass Pyramid City: a tower of lights, a museum with a glass pyramid, and the most famous art in the world."],
    ['chill-22415411', "Tonight the museum is closed. To everyone except you. Please don't break anything. Again."]],
  'fishing-cove': [
    ['present-22415793', "Fishing Cove. Grey rocks, cold sea, and fishermen who have seen everything twice."],
    ['chill-22416099', "To be welcome here you drink what they drink, say what they say, and kiss what they kiss. It's a fish."]],
  'cliff-pool-isle': [
    ['present-22416412', "Cliff Pool Isle! Waterfalls into turquoise pools, and cliffs high enough to make you think twice."],
    ['arrive-22416267', "A white beach, a lot of sun, and one very old bobsled track that should probably be closed."]],
  'twin-tower-bridge': [
    ['present-22417609', "Twin Tower Bridge. Fog, double-decker buses, and a fortress that has kept the crown jewels for centuries."],
    ['present-22417669', "Tonight somebody has stolen them. In a mask. And it's your job to find out who."]],
  'marble-temple-hill': [
    ['present-22418524', "Marble Temple Hill, where the first games were held thousands of years ago."],
    ['Ancient temple with empty stone steps', "Hurdles, high jumps, chariots and wrestling. The ancient way. Togas optional. Mostly."]],
  'secret-base-desert': [
    ['present-22418960', "The Secret Base Desert. Officially, there is nothing out here. Officially."],
    ['present-22418966', "Unofficially: a fence, some guards, and something that fell from the sky a long time ago."]],
  'fjord-sea': [
    ['arrive-22420234', "Fjord Sea! Cold water, snowy mountains, and longships that sailed here a thousand years ago."],
    ['task-22420282', "Today, teams build their own longship. Then they sail it. In that order, hopefully."]],
  'great-falls': [
    ['present-22421498', "Great Falls. Millions of litres of water a second, and on the edge of it, a town full of wedding chapels."],
    ['present-22421490', "There's a swan boat ride at the bottom, a slot machine for a wedding, and a tightrope across the top."]],
  'bamboo-wall-hills': [
    ['present-22422729', "Bamboo Wall Hills: bamboo forests, an ancient wall, and monks who have been ringing the same gong for centuries."],
    ['present-22422490', "Beyond the wall, purple mountains in the mist. And a bowl of food that will test your stomach."]],
  'grass-savanna': [
    ['present-22423390', "The Grass Savanna. Golden grass, flat-topped trees, and a lot of animals that are faster than you."],
    ['present-22423205', "The villagers here grow plums, smash gourds, and run a safari you will never forget."]],
  'stone-head-island': [
    ['present-22423539', "Stone Head Island, way out in the ocean, where giant stone heads have watched the sea for a thousand years."],
    ['present-22424060', "There are painted eggs here, and a condor who wants them back."]],
  'badlands': [
    ['arrive-22424402', "The Badlands: rock towers, dry riverbeds, and dinosaur bones under every step."],
    ['Moonlit Wreckage with Rising Smoke-3', "And out past the oil rigs, the wreck of a jet that landed a little harder than it meant to."]],
};

const slugOf = f => String(f).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The plates a place is presented on, with Don's line for each. */
export function aboutOf(place) {
  const pl = PLACE_PLATES[place];
  if (!pl) return [];
  const known = new Map();
  const add = p => { if (p?.f && !known.has(p.f)) known.set(p.f, p); };
  add(pl.opener); (pl.arrive || []).forEach(add); (pl.views || []).forEach(add);
  for (const s of Object.values(pl.st)) { (s.talk || []).forEach(add); add(s.act); (s.wide || []).forEach(add); }
  return (ABOUT[place] || [[pl.title, `${place}`]]).map(([f, text]) => ({
    plate: { g: 90, x: [12, 88], ...(known.get(f) || { f }), people: false, slug: slugOf(f) }, text }));
}

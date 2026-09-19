// ════════════════════════════════════════════════════════════════
//  STAGE CHALLENGES — which set a Total Drama challenge is played on
// ════════════════════════════════════════════════════════════════
// An episode names its challenge with "[Challenge: Hell's Kitchen]". The stage
// looks the name up here and draws that challenge's KIT — one of a dozen
// challenge sets (js/stage-sets-kits.js) that the 84 twist challenges share by
// what they physically look like: a kitchen, a night forest, a big top.
// A challenge the table does not know (an ordinary "tug of war") falls back to
// keywords in its name, then to the show's generic challenge set.
//
// Built by hand from TWIST_CATALOG (js/core.js): id → [display name, kit].
// A new twist challenge wants one line here.
export const CHALLENGE_KITS = {
  // obstacle courses, boot camps, races across open ground
  'basic-straining':      ["Basic Straining", 'course'],
  'sports-marathon':      ["Sports Marathon", 'course'],
  'x-treme-torture':      ["X-Treme Torture", 'course'],
  'off-the-chain':        ["That's Off the Chain!", 'course'],
  'great-fake-out':       ["The Great Fake-Out", 'course'],
  'planes-trains':        ["Planes, Trains & Hot Air Mobiles", 'course'],
  'bridal-brawls':        ["Bridal Brawls", 'course'],
  'tri-armed-triathlon':  ["Trial by Tri-Armed Triathlon", 'course'],
  'full-metal-drama':     ["Full Metal Drama", 'course'],
  'awake-a-thon':         ["Awake-A-Thon", 'course'],
  'sudden-death':         ["Sudden Death", 'course'],
  'greeces-pieces':       ["Greece's Pieces", 'desert'],
  // water: lakes, docks, cliffs, boats
  'cliff-dive':           ["Cliff Dive", 'water'],
  'rock-the-dock':        ["Rock the Dock", 'water'],
  'up-the-creek':         ["Up the Creek", 'water'],
  'tropical-takedown':    ["Tropical Takedown", 'water'],
  'backstabbers-ahoy':    ["Backstabbers Ahoy!", 'water'],
  'treasure-island':      ["The Treasure Island of Dr. McLean", 'water'],
  'beach-blanket-bogus':  ["Beach Blanket Bogus", 'water'],
  'masters-of-disasters': ["Masters of Disasters", 'water'],
  'poles-apart':          ["Poles Apart", 'water'],
  // the woods at night: hunts, survival, things with claws
  'slasher-night':        ["Slasher Night", 'nightwoods'],
  'paintball-hunt':       ["Paintball Deer Hunter", 'nightwoods'],
  'sucky-outdoors':       ["The Sucky Outdoors", 'nightwoods'],
  'killer-clown':         ["Night of the Killer Clown", 'nightwoods'],
  'are-we-there-yeti':    ["Are We There Yeti?", 'nightwoods'],
  'finders-creepers':     ["Finders Creepers", 'nightwoods'],
  'hide-and-be-sneaky':   ["Hide and Be Sneaky", 'nightwoods'],
  'wawanakwa-gone-wild':  ["Wawanakwa Gone Wild!", 'nightwoods'],
  'lucky-hunt':           ["Lucky Hunt", 'nightwoods'],
  'camp-castaways':       ["Camp Castaways", 'nightwoods'],
  'amazon-race':          ["The Am-AH-Zon Race", 'nightwoods'],
  'princess-pride':       ["The Princess Pride", 'nightwoods'],
  // a stage: talent, game shows, runways, performances
  'talent-show':          ["Talent Show", 'stage'],
  'rock-n-rule':          ["Rock n' Rule", 'stage'],
  'crazy-fun-time':       ["Super Happy Crazy Fun Time", 'stage'],
  'truth-or-shark':       ["Truth or Shark", 'stage'],
  'project-runaway':      ["Project Runaway", 'stage'],
  'triple-dog-dare':      ["Triple Dog Dare", 'stage'],
  'phobia-factor':        ["Phobia Factor", 'stage'],
  'trust-challenge':      ["Who Can You Trust?", 'stage'],
  'hung-out-to-dry':      ["Hung Out to Dry", 'stage'],
  'broadway-baby':        ["Broadway Baby", 'stage'],
  'super-hero-ld':        ["Super Hero-ld", 'studio'],
  // a court, a ring, a dojo
  'dodgebrawl':           ["Dodgebrawl", 'arena'],
  'crouching-courtney':   ["Way of the Warrior", 'arena'],
  'slap-slap-revolution': ["Slap Slap Revolution", 'arena'],
  'million-bucks-bc':     ["One Million Bucks, B.C.", 'desert'],
  // a kitchen, and the things that come out of it
  'hells-kitchen':        ["Hell's Kitchen", 'kitchen'],
  'brunch-of-disgustingness': ["Brunch of Disgustingness", 'kitchen'],
  'chefshank':            ["The Chefshank Redemption", 'kitchen'],
  // indoors and wrong: haunted houses, museums, dungeons, labs, trains
  'haunted-house':        ["Haunted House", 'spooky'],
  'night-at-museum':      ["Night at the Museum", 'spooky'],
  'midnight-manhunt':     ["Midnight Manhunt", 'spooky'],
  'one-flu':              ["One Flu Over the Cuckoos", 'spooky'],
  'say-uncle':            ["Say Uncle", 'spooky'],
  'hangar-black':         ["Operation: Hangar Black", 'spooky'],
  'operation-classified': ["Operation: Classified", 'spooky'],
  'get-a-clue':           ["Get a Clue", 'spooky'],
  'truth-or-dare-train':  ["Truth or Dare Train", 'spooky'],
  'mine-over-matter':     ["Mine Over Matter", 'spooky'],
  // sand, ruins, digs
  'walk-like-an-egyptian': ["Walk Like an Egyptian", 'desert'],
  'picnic-hanging-dork':  ["Picnic at Hanging Dork", 'desert'],
  'african-lying-safari': ["African Lying Safari", 'desert'],
  'drumheller':           ["Awwwwww, Drumheller", 'desert'],
  'rapa-phooey':          ["Rapa Phooey!", 'desert'],
  // ice and snow
  'frozen-crossing':      ["Frozen Crossing", 'snow'],
  'ice-ice-baby':         ["Ice Ice Baby", 'snow'],
  'viking-sour':          ["Viking Sour", 'snow'],
  // the carnival: big top, rides, neon
  'tusks-and-ladders':    ["Tusks and Ladders", 'bigtop'],
  'merry-go-round-up':    ["Merry-Go-Round-Up", 'bigtop'],
  'wheel-of-misfortune':  ["Wheel of Misfortune", 'bigtop'],
  'say-cheese':           ["Say Cheese", 'bigtop'],
  'bumper-car-bash':      ["Bumper Car Bash", 'bigtop'],
  'top-dog':              ["Top Dog", 'bigtop'],
  'demons-plainer':       ["Demon's Plainer", 'bigtop'],
  // mazes and puzzles
  'a-maze-ing-grip':      ["A-Maze-ing Grip", 'maze'],
  'maze-of-the-fallen':   ["Maze of the Fallen", 'maze'],
  // a film set: sci-fi, westerns, heists, space
  'monster-cash':         ["Monster Cash", 'studio'],
  'alien-egg':            ["Alien Resurr-eggtion", 'studio'],
  'crazytown':            ["3:10 to Crazytown", 'studio'],
  'houston':              ["Houston, We Have a Problem", 'studio'],
  'oceans-heist':         ["Ocean's Eight—or Nine", 'studio'],
  'bigger-badder-brutaler': ["Bigger! Badder! Brutal-er!", 'course'],
};

// An ordinary challenge ("[Challenge: Tug of War]") is placed by what it is called.
// Places first (a "snowball fight" happens in the snow), activities after.
export const KIT_WORDS = [
  ['snow',       /snow|\bice\b|arctic|frozen|\bski|yeti|viking|mountain/i],
  ['desert',     /desert|pyramid|egypt|safari|\bdig\b|dino|ruin|olympic|caveman/i],
  ['water',      /water|swim|dive|lake|dock|canoe|raft|boat|surf|beach|\bsea\b|river|sink/i],
  ['kitchen',    /kitchen|cook|chef|\beat|food|brunch|dinner|feast|bake/i],
  ['spooky',     /haunt|ghost|museum|dungeon|\blab\b|hospital|\bspy|mystery|train|\bmine\b|cave/i],
  ['bigtop',     /circus|carnival|big top|ferris|carousel|clown|\bride\b|bumper/i],
  ['studio',     /film|movie|studio|western|space|alien|heist|superhero/i],
  ['maze',       /maze|puzzle|labyrinth|riddle|clue/i],
  ['nightwoods', /night|hunt|forest|woods|slasher|monster|camp.?out|survival|scaven/i],
  ['stage',      /talent|show|stage|sing|dance|perform|runway|fashion|game show|trivia|quiz|dare/i],
  ['arena',      /dodge|ball|court|fight|wrestl|\bbox|sumo|joust|brawl|karate|kung fu/i],
  ['course',     /course|obstacle|race|relay|boot camp|marathon|triathlon|climb|tug|endurance/i],
];

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const BY_NAME = Object.fromEntries(Object.entries(CHALLENGE_KITS).flatMap(([id, [name, kit]]) =>
  [[norm(name), { id, name, kit }], [norm(id), { id, name, kit }]]));

/** "[Challenge: Hell's Kitchen]" → { id, name, kit }. Unknown names keep their own name and get a kit by keyword, else null kit. */
export function resolveChallenge(label){
  const raw = String(label || '').replace(/\s+[—–-]\s+.*$/, '').trim();   // "Hell's Kitchen — immunity" → "Hell's Kitchen"
  const hit = BY_NAME[norm(raw)] || Object.values(BY_NAME).find(c => norm(raw).includes(norm(c.name)) && norm(c.name).length > 5);
  if (hit) return hit;
  const kw = KIT_WORDS.find(([, re]) => re.test(label));
  return { id: null, name: raw, kit: kw ? kw[0] : null };
}

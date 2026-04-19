// js/chal/slasher-night.js
import { gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
import { romanticCompat } from '../players.js';
import { wRandom } from '../alliances.js';

// ═══════════════════════════════════════════════════════════════════
// SLASHER NIGHT — Event Pool & Scoring Constants
// ═══════════════════════════════════════════════════════════════════

const SLASHER_ROUND_SURVIVAL_BONUS = 2;
const SLASHER_DIMINISHING_RETURNS = { 1: 0, 2: -1, 3: -2 };
const SLASHER_OVERCONFIDENCE_CHANCE = 0.20;
const SLASHER_GROUP_CATCH_MOD = { solo: 2, pair: 0, group: -1 };

const _VILLAIN_ARCHETYPES = new Set(['villain', 'mastermind', 'schemer']);
const _NICE_ARCHETYPES = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

function _canSabotage(name) {
  const arch = players.find(p => p.name === name)?.archetype || '';
  if (_VILLAIN_ARCHETYPES.has(arch)) return true;
  if (_NICE_ARCHETYPES.has(arch)) return false;
  // Neutral: needs strategic >= 6 AND loyalty <= 4
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// Environmental effects that mechanically alter gameplay each round
const SLASHER_ENVIRONMENTS = [
  { id: 'rain', text: 'The rain starts. Visibility drops to nothing.', catchMod: -1, hidingBonus: 0, soloMod: 0 },
  { id: 'lights-die', text: 'The camp lights flicker and die. Pure dark from here.', catchMod: 0, hidingBonus: 1, soloMod: 0 },
  { id: 'generator-out', text: 'The generator cuts out. The hum that everyone ignored is suddenly the loudest absence in the world.', catchMod: 0, hidingBonus: 0, soloMod: 2 },
  { id: 'fog', text: 'A wall of fog rolls in from the lake. Nobody can see more than ten feet.', catchMod: -1, hidingBonus: 1, soloMod: 0 },
  { id: 'moonlight', text: 'The clouds break. Moonlight floods the camp. Nowhere to hide.', catchMod: 1, hidingBonus: -1, soloMod: 0 },
  { id: 'wind', text: 'The wind shifts and carries a sound that shouldn\'t be there.', catchMod: 0, hidingBonus: 0, soloMod: 0 },
  { id: 'silence', text: 'The remaining players can hear each other\'s breathing. The slasher can too.', catchMod: 0, hidingBonus: 0, soloMod: 1 },
  { id: 'chainsaw', text: 'The slasher\'s chainsaw revs in the distance. Closer than last time.', catchMod: 0, hidingBonus: 0, soloMod: 0 },
];

const SLASHER_HORROR_BEATS = {
  rain: [
    "The rain hammers the roof. Something moves between the cabins.",
    "Water pools at the doorstep. The footprints aren't from anyone still inside.",
    "Lightning turns the camp white for half a second. Something was standing in the treeline.",
    "The downpour drowns out everything. A perfect cover for the wrong kind of movement.",
    "Rainwater drips through the ceiling. Each drop sounds like a countdown.",
    "The storm drain gurgles. Like something is trying to breathe."
  ],
  'lights-die': [
    "The last light dies. Darkness. Complete.",
    "Someone fumbles for a lighter. The spark shows nothing. Then everything.",
    "Shadows used to be just shadows. Not anymore.",
    "A flashlight beam sweeps the hall. For a second, two reflections stare back.",
    "The dark is patient. It has all night.",
    "Eyes adjust. Shapes emerge. Not all of them are furniture."
  ],
  'generator-out': [
    "The hum that was always there is gone. The silence it left behind is worse.",
    "Without the generator, the camp sounds different. You can hear everything. Everything can hear you.",
    "Someone whispers: 'Did the generator just—' They don't finish the sentence.",
    "The emergency lights flicker once and quit. Backup power was never part of the plan.",
    "In the sudden quiet, someone's heartbeat is audible from across the room.",
    "The generator room door hangs open. The fuel line has been cut."
  ],
  fog: [
    "A shadow moves through the fog. Too tall. Too slow.",
    "The fog swallows the path. There is no path.",
    "Visibility drops to arm's length. Everything beyond that is theory.",
    "The fog makes sounds travel wrong. Footsteps seem to come from everywhere.",
    "Something brushes past in the mist. Gone before anyone can turn.",
    "The fog thins for a moment. What's revealed is worse than what was hidden."
  ],
  moonlight: [
    "The moon breaks through. Every shadow has a sharp edge now.",
    "Moonlight floods the clearing. Nowhere to hide. Nowhere at all.",
    "The silver light turns the camp into a stage. Someone is watching the performance.",
    "Moonlight catches something metallic in the bushes. It moves.",
    "Under the full moon, even breathing feels exposed.",
    "The moon is bright enough to read by. Bright enough to be seen by."
  ],
  wind: [
    "The wind carries a sound that shouldn't exist this far from anywhere.",
    "A gust slams a cabin door. The silence after is absolute.",
    "The wind changes direction. Something in the air smells wrong.",
    "Tree branches scrape the roof like fingernails on a coffin lid.",
    "The wind dies. In the stillness, a single footstep. Then nothing.",
    "A low moan through the trees. Just the wind. Probably just the wind."
  ],
  silence: [
    "A board creaks. Everyone freezes.",
    "Someone's breathing. It isn't anyone in the room.",
    "The silence is so thick it has texture. Something moves through it.",
    "Nobody speaks. Nobody breathes. The quiet stretches until it breaks.",
    "A drip. A creak. A breath that isn't yours. That's the whole soundtrack now.",
    "In the silence, someone swallows. It echoes."
  ],
  chainsaw: [
    "The chainsaw revs somewhere in the dark. Closer than before.",
    "Metal teeth on wood. The sound stops. The sound was closer than the wood.",
    "The chainsaw idles. A patient predator. It has all the time in the world.",
    "The buzz rises and falls like breathing. Mechanical breathing.",
    "A tree falls somewhere. The chainsaw didn't need it. That was a message.",
    "The chainsaw goes quiet. That's worse. That means it's close enough to whisper."
  ],
  forest: [
    "Branches snap in the treeline. Too heavy for an animal.",
    "The path forks. Both directions look wrong.",
    "Something howls in the distance. Then something closer answers.",
    "The forest floor crunches underfoot. Impossible to move silently.",
    "A clearing opens up ahead. The moonlight makes it feel like a trap.",
    "The trees grow closer together here. Like they're trying to keep something in."
  ],
  shower: [
    "Water drips from the showerhead. Nobody turned it on.",
    "The curtain moves. Just the draft. Probably.",
    "Steam fogs the mirror. A shape takes form in the condensation.",
    "The drain gurgles. Water swirls pink. Old rust. Has to be old rust.",
    "A towel drops from its hook. The bathroom has been empty for hours.",
    "Hot water runs in the next stall. The faucet is turned all the way."
  ],
  cabin: [
    "The cabin door swings open on its own. The hinges don't make a sound.",
    "Under the bed, something breathes.",
    "A drawer slides open in the next room. Slowly. Deliberately.",
    "The cabin window fogs from the outside. Something warm is pressed against the glass.",
    "Floorboards creak in a rhythm. Footsteps. Moving toward the closet.",
    "The cabin smells different now. Like copper and something sweet."
  ],
  cantina: [
    "A plate shatters in the kitchen. The kitchen is supposed to be empty.",
    "The walk-in freezer door clicks shut. Someone is inside.",
    "A knife is missing from the magnetic strip. It was there five minutes ago.",
    "The serving window is open. On the counter: a handprint in flour.",
    "Something drips from the ceiling fan. It's not water.",
    "The cantina radio crackles to life. Static. Then a voice: 'Found you.'"
  ],
  dock: [
    "The dock boards groan. Weight shifting. Coming closer.",
    "Something surfaces in the lake. Just a log. Probably.",
    "A rope tightens on the dock cleat. The boats are supposed to be secured.",
    "The water laps at the pilings in an uneven rhythm. Something is displacing it.",
    "A canoe drifts into view. Empty. Its paddle is broken in half.",
    "The dock light flickers. In the strobe, a silhouette at the end of the pier."
  ],
  generic: [
    "A door creaks open down the hall. Nobody went that way.",
    "Footsteps. Then nothing. Then footsteps again, closer.",
    "The shadows shift. Something is in the room.",
    "A hand covers someone's mouth from behind. 'Shh. Don't move.'",
    "Something scrapes along the wall outside. Slow. Deliberate. Testing.",
    "A walkie-talkie crackles: static, then a scream, then static again.",
    "The floor plan doesn't add up. There's a room that shouldn't be there.",
    "Someone wrote HELP on the mirror. The letters are still wet."
  ]
};

const SLASHER_EVENTS = {
  positive: [
    {
      id: 'stand-and-fight', points: 4, type: 'positive',
      statCheck: s => s.physical >= 7 || s.boldness >= 7,
      bondEffect: { target: 'witnesses', delta: 0.3 },
      textVariants: [
        `{name} grabs a canoe paddle and swings at the slasher. Direct hit. The slasher staggers.`,
        `{name} picks up a rock the size of {pr.pos} head. The slasher reconsiders.`,
        `{name} squares up. No weapon, just fists. The slasher takes a step back.`,
        `{name} rips a branch off a tree and holds it like a bat. 'Come on then.'`
      ],
      povVariants: [
        "Your hand closes around the paddle. You swing before you think. Contact. The slasher staggers.",
        "Something in you snaps. You pick up the rock. You're not running anymore."
      ]
    },
    {
      id: 'set-a-trap', points: 3, type: 'positive',
      statCheck: s => s.strategic >= 6 || s.mental >= 7,
      bondEffect: null,
      textVariants: [
        `{name} rigs a tripwire using fishing line across the path. The slasher goes down hard.`,
        `{name} leaves a trail leading to a pit. It works.`,
        `{name} sets up chairs in a maze pattern near the shelter. The slasher gets tangled.`,
        `{name} pours cooking oil across the mess hall floor. The slasher slides into the wall.`
      ],
      povVariants: [
        "You string the fishing line across the path. Your hands are shaking but the knot holds. Footsteps approaching.",
        "The oil goes down. You back away. The slasher steps in. Perfect."
      ]
    },
    {
      id: 'find-hiding-spot', points: 2, type: 'positive',
      statCheck: s => s.intuition >= 6,
      bondEffect: null,
      flags: { isHiding: true },
      textVariants: [
        `{name} slides under the cabin and doesn't breathe for two minutes.`,
        `{name} finds a hollow tree trunk. The slasher walks right past.`,
        `{name} slips behind the waterfall. Invisible.`,
        `{name} climbs inside the supply crate. Darkness. Silence. Safety.`
      ],
      povVariants: [
        "You press yourself flat under the cabin. The wood is cold. Footsteps pass three inches above your head.",
        "You fit inside the crate. Darkness. Your own breathing is the loudest thing in the world."
      ]
    },
    {
      id: 'warn-ally', points: 2, type: 'positive',
      statCheck: s => s.loyalty >= 6,
      requiresAlly: true, requiresBond: 2,
      bondEffect: { target: 'ally', delta: 1.0 },
      textVariants: [
        `{name} spots the slasher heading toward {ally}. One whistle — their signal. {ally} vanishes.`,
        `{name} grabs {ally}'s arm and pulls {pr.obj} into the bush. Just in time.`,
        `{name} throws a pebble at {ally}'s foot. {ally} looks up, sees the shadow, and moves.`
      ],
      povVariants: [
        "You see the shadow moving toward them. One whistle. Your signal. They vanish.",
        "You grab their arm and pull. No time to explain. Just move."
      ]
    },
    {
      id: 'protect-someone', points: 3, type: 'positive',
      statCheck: s => s.loyalty >= 7,
      requiresAlly: true,
      bondEffect: { target: 'ally', delta: 1.5 },
      textVariants: [
        `{name} stands between {ally} and the slasher. {pr.Sub} {pr.sub==='they'?'are':'is'} not moving.`,
        `{name} shoves {ally} behind {pr.obj}. 'Run. I got this.'`,
        `{name} throws {pr.ref} in the slasher's path so {ally} can escape.`
      ],
      povVariants: [
        "You step forward. Between them and the dark. Whatever comes, it comes through you first.",
        "You shove them behind you. 'Run.' You don't look back to see if they do."
      ]
    },
    {
      id: 'stay-calm', points: 1, type: 'positive',
      statCheck: s => s.temperament >= 7,
      bondEffect: null,
      textVariants: [
        `{name} breathes. Counts to ten. Moves quietly. The panic doesn't touch {pr.obj}.`,
        `Everyone around {name} is losing it. {pr.Sub} {pr.sub==='they'?'are':'is'} steady. Focused. Still here.`,
        `{name} finds a corner, closes {pr.pos} eyes, and waits. When {pr.sub} open{pr.sub==='they'?'':'s'} them, the slasher has moved on.`
      ],
      povVariants: [
        "Breathe. Count to ten. The panic is there but you don't let it win. Not tonight.",
        "Everyone around you is falling apart. You're not. You move when it's time to move."
      ]
    },
    {
      id: 'rally-the-group', points: 2, type: 'positive',
      statCheck: s => s.social >= 7,
      requiresGroup: true,
      bondEffect: { target: 'witnesses', delta: 0.5 },
      flags: { groupBonus: 1 },
      textVariants: [
        `{name} takes charge. 'Everyone — behind the mess hall. Now. Stay together.' They listen.`,
        `{name} grabs {ally}'s shoulder. 'We're not dying tonight. Follow me.' The group falls in line.`,
        `{name} organizes the group into a formation. It shouldn't work. It does.`
      ],
      povVariants: [
        "'Everyone — behind the mess hall. Now.' They listen. You don't know why. You sounded sure.",
        "'We're not dying tonight. Follow me.' They follow. You better be right."
      ]
    },
    {
      id: 'barricade', points: 2, type: 'positive',
      statCheck: s => s.physical >= 6 && s.mental >= 5,
      bondEffect: null,
      flags: { isBarricaded: true },
      textVariants: [
        `{name} shoves a table against the door and stacks everything heavy on top. It holds.`,
        `{name} blocks the cabin entrance with supply crates. The slasher pushes. Doesn't get through.`,
        `{name} rips the cabin door off its hinges and wedges it against the window. Improvised. Effective.`
      ],
      povVariants: [
        "The table goes against the door. Then the crates. Then everything else. It holds. You hope.",
        "You wedge the door shut and press your back against it. The pushing starts. It stops. For now."
      ]
    },
    {
      id: 'distraction', points: 3, type: 'positive',
      statCheck: s => s.strategic >= 7 && s.boldness >= 5,
      bondEffect: null,
      textVariants: [
        `{name} throws a torch down the far trail. The slasher follows it. Bought everyone a round.`,
        `{name} tips over a barrel and lets it roll downhill. The noise draws the slasher away.`,
        `{name} triggers a tripwire on the far side of camp. The slasher's head snaps toward it. Time to move.`
      ],
      povVariants: [
        "You throw the torch. It arcs through the dark. The slasher's head turns. Go. GO.",
        "The barrel rolls downhill and crashes. Every eye follows it. Including the mask. Now's your chance."
      ]
    },
    {
      id: 'weapon-grab', points: 2, type: 'positive',
      statCheck: s => s.physical >= 6 && s.boldness >= 6,
      bondEffect: null,
      textVariants: [
        `{name} finds a machete near the fire pit. {pr.Sub} feel{pr.sub==='they'?'':'s'} a lot braver now.`,
        `{name} grabs a metal pipe from the tool shed. Not ideal, but better than nothing.`,
        `{name} picks up a cast-iron pan. It's heavy. It'll do.`
      ],
      povVariants: [
        "Your hand finds the machete in the dark. Cold metal. You feel braver already. Maybe that's stupid.",
        "The pipe is heavy. Not ideal. But your hands have something to hold now and that changes everything."
      ]
    },
    {
      id: 'rooftop-escape', points: 2, type: 'positive',
      statCheck: s => s.physical >= 7 && s.endurance >= 6,
      bondEffect: null,
      textVariants: [
        `{name} scrambles onto the cabin roof. The slasher circles below but can't follow.`,
        `{name} pulls {pr.ref} up the side of the mess hall. From the roof, {pr.sub} can see everything.`,
        `{name} leaps from the porch railing to the overhang and hauls {pr.ref} up. Out of reach.`
      ],
      povVariants: [
        "You haul yourself up. Splinters in your palms. From the roof you can see everything. Including the thing that's hunting you.",
        "Your feet leave the ground. The railing, the overhang, the roof. Out of reach. Your arms are screaming."
      ]
    },
    {
      id: 'read-the-pattern', points: 3, type: 'positive',
      statCheck: s => s.intuition >= 7 && s.strategic >= 6,
      bondEffect: null,
      textVariants: [
        `{name} maps the slasher's patrol in {pr.pos} head. Left, right, left, pause. {pr.Sub} move{pr.sub==='they'?'':'s'} during the pause.`,
        `{name} realizes the slasher always checks the cabins first. {pr.Sub} head{pr.sub==='they'?'':'s'} for the beach.`,
        `{name} watches the flashlight pattern. Every twelve seconds it sweeps left. That's the window.`
      ],
      povVariants: [
        "Left, right, left, pause. You map it in your head. You move during the pause. It works.",
        "The flashlight sweeps left every twelve seconds. You count. Eleven. Twelve. You run."
      ]
    },
    {
      id: 'accidental-hero', points: 4, type: 'positive',
      statCheck: s => s.physical <= 5 && Math.random() < 0.10,
      bondEffect: { target: 'witnesses', delta: 0.5 },
      textVariants: [
        `{name} trips and falls into the slasher, knocking them both down. Everyone escapes. {name} has no idea what just happened.`,
        `{name} stumbles backward into a shelf. The shelf falls on the slasher. Pure accident. {name} is a hero and has no idea why.`,
        `{name} throws a coconut in panic. It hits the slasher square in the mask. The slasher drops. Nobody is more surprised than {name}.`
      ],
      povVariants: [
        "You trip. You actually trip and fall into the slasher. You're both on the ground. Everyone runs. You have no idea what just happened.",
        "Something falls. On the slasher. Because you bumped it. You're a hero and you have absolutely no idea why."
      ]
    },
    {
      id: 'comfort-offering', points: 2, type: 'positive',
      statCheck: s => s.social >= 6,
      requiresAlly: true, requiresBond: 2,
      requiresVictimCheck: s => s.temperament <= 4,
      bondEffect: { target: 'ally', delta: 1.0 },
      flags: { preventsPanic: true },
      textVariants: [
        `{ally} finds {name} curled up behind the cabin, shaking. {ally} sits next to {pr.obj}. 'Hey. We're getting out of this.' {name} nods. They move together.`,
        `{ally} puts a hand on {name}'s shoulder. 'Breathe. I'm right here.' {name} stops shaking. They both make it through this round.`,
        `{name} is hyperventilating behind the mess hall. {ally} crouches down. Doesn't say anything. Just stays. That's enough.`
      ],
      povVariants: [
        "Someone is shaking next to you. You sit down. 'Hey. We're getting out of this.' You don't know if that's true.",
        "You put your hand on their shoulder. You don't say anything. You just stay."
      ]
    },
    {
      id: 'the-decoy', points: 5, type: 'positive',
      statCheck: s => s.strategic >= 7 && s.loyalty >= 6,
      requiresAlly: true,
      bondEffect: { target: 'ally', delta: 1.5 },
      flags: { decoyCatchBoost: 3 },
      textVariants: [
        `{name} runs out into the open, waving and yelling. The slasher turns. The group behind the cabin escapes. {name} barely makes it back.`,
        `{name} throws a lit torch down the trail and sprints the other way. The slasher follows the light. The alliance owes {name} their game tonight.`,
        `{name} starts banging pots together near the kitchen. Every head turns — including the slasher's. The group behind {name} disappears into the dark.`
      ],
      povVariants: [
        "You run into the open. Waving. Yelling. The slasher turns toward you. Behind you, everyone escapes. Now you need to escape too.",
        "The torch goes down the trail. You sprint the other way. Your heart is trying to leave your chest."
      ]
    },
    {
      id: 'the-fake-out', points: 3, type: 'positive',
      statCheck: s => s.strategic >= 7 && s.boldness >= 6,
      bondEffect: null,
      flags: { immuneFromCatch: true, witnessPanic: -2 },
      textVariants: [
        `{name} plays dead. Face down in the dirt. The slasher walks past. When the footsteps fade, {name} gets up and runs.`,
        `{name} goes completely limp behind a bush. The slasher looks right at {pr.obj}. Keeps walking. {name} doesn't exhale for another thirty seconds.`,
        `{name} collapses dramatically in the open. The slasher prods {pr.obj} with a boot. {name} doesn't flinch. The slasher moves on. Performance of a lifetime.`
      ],
      povVariants: [
        "Face down. Don't breathe. Don't move. The footsteps stop next to you. A boot nudges your ribs. You don't flinch. The footsteps resume.",
        "You go limp. Completely limp. The slasher looks right at you. Keeps walking. You don't exhale for thirty seconds."
      ]
    },
    {
      id: 'confession-under-pressure', points: 1, type: 'positive',
      statCheck: s => true,
      requiresAlly: true, requiresBond: 3,
      requiresSurvivedRounds: 2,
      bondEffect: { target: 'ally', delta: 2.0 },
      textVariants: [
        `Hiding in the dark, {name} tells {ally} something real. Not strategy — something personal. The kind of thing you only say when you think you might not make it.`,
        `{name} and {ally} are pressed against the same wall, breathing hard. {name} says 'If we don't make it — I want you to know I had your back the whole time.' The silence after is different.`,
        `The fear strips everything else away. {name} tells {ally} the truth about how {pr.sub} feel{pr.sub==='they'?'':'s'} about this game, about the alliances, about what matters. {ally} listens.`
      ],
      povVariants: [
        "The words come out before you can stop them. Real words. Not strategy. Something you only say when you think you might not make it.",
        "Your back is against the wall. Theirs too. You tell them the truth. The fear strips everything else away."
      ]
    },
    {
      id: 'the-snack-break', points: 1, type: 'positive',
      statCheck: s => s.endurance >= 7 && s.boldness <= 4,
      bondEffect: null,
      textVariants: [
        `{name} is in the kitchen making a sandwich. The slasher walks past the window. {name} doesn't notice. Somehow this works.`,
        `While everyone else is running for their lives, {name} finds leftover rice in the pot and eats it. Standing in the kitchen. In the dark. Completely fine.`,
        `{name} opens the fridge. The light illuminates the whole kitchen. The slasher is outside. {name} grabs a mango and closes it. Oblivious and alive.`
      ],
      povVariants: [
        "You're making a sandwich. The slasher walks past the window. You don't notice. You have a sandwich.",
        "The fridge light illuminates everything. You grab the mango. Close the door. Oblivious and alive."
      ]
    },
    {
      id: 'heroic-stand', points: 3, type: 'positive',
      statCheck: s => s.loyalty >= 7 && s.physical >= 6,
      requiresAlly: true,
      bondEffect: { target: 'ally', delta: 1.0 },
      textVariants: [
        `{name} puts {pr.ref} between {ally} and the darkness. Whatever comes, it goes through {name} first.`,
        `{name} doesn't run. {pr.Sub} plant{pr.sub==='they'?'':'s'} {pr.pos} feet and stare{pr.sub==='they'?'':'s'} into the dark. {ally} escapes behind {pr.obj}.`,
        `{name} grabs a stick and faces the sound. 'Go,' {pr.sub} tell{pr.sub==='they'?'':'s'} {ally}. {ally} goes.`
      ],
      povVariants: [
        "You don't run. Your feet plant. Your eyes find the dark. Whatever comes, it goes through you.",
        "You grab the stick. 'Go,' you tell them. They go. Now it's just you and the dark."
      ]
    }
  ],

  negative: [
    {
      id: 'scream-panic', points: -3, type: 'negative',
      statCheck: s => s.temperament <= 4,
      bondEffect: null,
      flags: { justScreamed: true },
      textVariants: [
        `{name} sees a shadow and screams. The entire camp knows where {pr.sub} {pr.sub==='they'?'are':'is'} now.`,
        `{name} hears a branch snap and lets out a sound that echoes off the mountains.`,
        `{name} tries to hold it in. {pr.Sub} can't. The scream comes out strangled and worse.`
      ],
      povVariants: [
        "You see it. The shadow. The scream comes out before you can stop it. Everyone knows where you are now.",
        "A branch snaps. You scream. The echo comes back to you from the mountains. So does the slasher."
      ]
    },
    {
      id: 'run-blindly', points: -2, type: 'negative',
      statCheck: s => s.boldness <= 4,
      requiresSolo: true,
      bondEffect: null,
      textVariants: [
        `{name} bolts into the jungle with no plan. Branches whip {pr.pos} face. {pr.Sub} {pr.sub==='they'?'have':'has'} no idea where {pr.sub} {pr.sub==='they'?'are':'is'}.`,
        `{name} runs. No direction, no destination. Just away. It costs {pr.obj} position.`,
        `{name} sprints into the dark and trips over a root. Gets up. Runs again. Wrong direction.`
      ],
      povVariants: [
        "You bolt. No plan. Branches whip your face. You have no idea where you are.",
        "You run. Wrong direction. You know it's wrong. You can't stop."
      ]
    },
    {
      id: 'freeze-up', points: -2, type: 'negative',
      statCheck: s => s.boldness <= 3,
      bondEffect: null,
      textVariants: [
        `{name} freezes. Legs won't move. The slasher is getting closer and {pr.sub} can't do anything.`,
        `{name} sees the mask and every muscle locks. By the time {pr.sub} can move again, the advantage is gone.`,
        `{name}'s brain says run. {pr.Sub} {pr.sub==='they'?'don\'t':'doesn\'t'}. The fear wins.`
      ],
      povVariants: [
        "Your legs won't move. The mask is getting closer. Your brain says run. You don't.",
        "Every muscle locks. By the time you can move again, the advantage is gone."
      ]
    },
    {
      id: 'abandon-ally', points: -4, type: 'negative',
      statCheck: s => s.loyalty <= 4,
      requiresAlly: true, requiresSabotage: true,
      bondEffect: { target: 'ally', delta: -2.0 },
      textVariants: [
        `{name} hears {ally} yell for help. {pr.Sub} calculate{pr.sub==='they'?'':'s'} the odds and keeps running.`,
        `{name} sees {ally} cornered and decides that's not {pr.pos} problem.`,
        `{name} whispers 'sorry' and disappears into the dark. {ally} heard it.`
      ],
      povVariants: [
        "You hear them yell for help. You calculate the odds. You keep running.",
        "You see them cornered. That's not your problem. You keep moving."
      ]
    },
    {
      id: 'push-toward-slasher', points: -5, type: 'negative',
      statCheck: s => s.loyalty <= 3 && s.strategic >= 6,
      requiresEnemy: true, requiresBond: -1, requiresSabotage: true,
      bondEffect: { target: 'victim', delta: -3.0 },
      flags: { victimCaught: true },
      textVariants: [
        `{name} shoves {victim} into the slasher's path and disappears.`,
        `{name} redirects the slasher by pointing at {victim}'s hiding spot.`,
        `{name} trips {victim} and uses the head start to escape.`
      ],
      povVariants: [
        "You shove them. Hard. Into the slasher's path. You disappear into the dark.",
        "You point at their hiding spot. The slasher turns. You're already gone."
      ]
    },
    {
      id: 'trip-and-fall', points: -1, type: 'negative',
      statCheck: s => s.physical <= 4,
      bondEffect: null,
      textVariants: [
        `{name} trips over a root and goes face-first into the dirt. The slasher's footsteps pause.`,
        `{name} catches {pr.pos} foot on a vine and stumbles hard. Lost ground.`,
        `{name} slips on wet rock and goes down. Gets up slower than {pr.sub} should.`
      ],
      povVariants: [
        "Your foot catches the root. You go down face-first. Lost ground.",
        "You slip. Wet rock. Your knee hits hard. You get up slower than you should."
      ]
    },
    {
      id: 'go-off-alone', points: -2, type: 'negative',
      statCheck: s => s.social <= 3,
      requiresSolo: true,
      bondEffect: null,
      textVariants: [
        `{name} ditches the group and heads into the jungle alone. Nobody follows.`,
        `{name} decides {pr.sub} {pr.sub==='they'?'are':'is'} better off alone. {pr.Sub} {pr.sub==='they'?'aren\'t':'isn\'t'}.`,
        `{name} slips away without telling anyone. Solo in the dark.`
      ],
      povVariants: [
        "You leave the group. Nobody follows. The dark closes around you.",
        "You slip away without telling anyone. Solo in the dark. This was a mistake."
      ]
    },
    {
      id: 'argue-at-worst-time', points: -3, type: 'negative',
      statCheck: s => s.temperament <= 3,
      requiresAlly: true,
      bondEffect: { target: 'ally', delta: -1.0 },
      flags: { justArgued: true },
      textVariants: [
        `{name} and {ally} disagree on which way to go. The whispered argument gets louder. The slasher doesn't need a map.`,
        `{name} snaps at {ally} in the dark. 'This is YOUR fault.' The timing could not be worse.`,
        `{name} and {ally} are fighting over who made a noise. Meanwhile, the actual threat is ten feet away.`
      ],
      povVariants: [
        "'This is YOUR fault.' The words come out louder than you meant. The slasher doesn't need a map now.",
        "You're arguing. You can't stop. The timing could not be worse."
      ]
    },
    {
      id: 'check-the-noise', points: -2, type: 'negative',
      statCheck: s => s.intuition <= 4 && s.boldness >= 5,
      bondEffect: null,
      textVariants: [
        `{name} hears something and goes to investigate. That's never the right call.`,
        `{name} peeks around the corner. The slasher peeks back.`,
        `{name} follows the sound. It leads exactly where {pr.sub} shouldn't be.`
      ],
      povVariants: [
        "You hear something. You go look. That's never the right call. You go anyway.",
        "You peek around the corner. Something peeks back."
      ]
    },
    {
      id: 'false-sense-of-safety', points: -3, type: 'negative',
      statCheck: s => s.boldness >= 6,
      requiresHighScore: true,
      bondEffect: null,
      textVariants: [
        `{name} gets cocky. 'I think we lost them.' {pr.Sub} didn't.`,
        `{name} relaxes too early. Drops {pr.pos} guard. The slasher was waiting for exactly that.`,
        `{name} starts walking instead of running. Confidence is not the same as safety.`
      ],
      povVariants: [
        "'I think we lost them.' You didn't.",
        "You relax. Drop your guard. One second too long. The slasher was waiting for exactly that."
      ]
    },
    {
      id: 'showmance-distraction', points: -3, type: 'negative',
      statCheck: s => s.strategic <= 5,
      requiresShowmance: true,
      bondEffect: null,
      textVariants: [
        `{name} and {ally} are too focused on each other to notice the slasher. Classic.`,
        `{name} stops running to check on {ally}. Sweet. Also stupid.`,
        `{name} and {ally} are holding hands while hiding. It slows them both down.`
      ],
      povVariants: [
        "You're too focused on them to notice. The footsteps behind you. Classic.",
        "You stop running to check on them. Sweet. Also stupid."
      ]
    },
    {
      id: 'open-a-door', points: -2, type: 'negative',
      statCheck: s => s.intuition <= 5,
      bondEffect: null,
      textVariants: [
        `{name} opens a door that should stay closed. The creak echoes.`,
        `{name} pushes open the supply shed. Something inside moves. {pr.Sub} slam{pr.sub==='they'?'':'s'} it shut.`,
        `{name} checks the bathroom. The mirror shows something behind {pr.obj}. Too late.`
      ],
      povVariants: [
        "You open the door. The creak echoes. Something inside moves.",
        "The bathroom mirror shows something behind you. Too late."
      ]
    },
    {
      id: 'flashlight-dies', points: -1, type: 'negative',
      statCheck: () => Math.random() < 0.15,
      bondEffect: null,
      textVariants: [
        `{name}'s flashlight flickers and dies. Darkness. Complete.`,
        `The batteries in {name}'s torch give out. {pr.Sub} {pr.sub==='they'?'are':'is'} blind now.`,
        `{name}'s light source dies at the worst possible moment. The dark swallows everything.`
      ],
      povVariants: [
        "Your flashlight flickers. Dies. Darkness. Complete.",
        "The batteries give out. You're blind now. The dark swallows everything."
      ]
    },
    {
      id: 'scared-by-teammate', points: -3, type: 'negative',
      statCheck: s => s.temperament <= 5,
      requiresAlly: true,
      bondEffect: { target: 'ally', delta: -0.5 },
      flags: { justScreamed: true },
      textVariants: [
        `{name} rounds a corner and sees {ally} in the dark. {pr.Sub} scream{pr.sub==='they'?'':'s'} before {pr.sub} even realize{pr.sub==='they'?'':'s'} who it is. Half the camp heard that.`,
        `{ally} steps out of a cabin doorway. {name} swings at {pr.obj} before recognizing the face. Both of them are shaking.`,
        `{ally} is wearing a towel over {pr.pos} head. {name} sees the silhouette and bolts. By the time {name} stops running, {pr.sub} {pr.sub==='they'?'are':'is'} three hundred feet from camp.`,
        `{name} walks into the bathroom and sees {ally}'s shadow in the mirror. The scream is loud enough to echo. {ally} just stands there, confused.`,
        `{name} and {ally} walk toward each other in the dark. Neither sees the other. They collide. Both scream. The slasher now knows exactly where they are.`
      ],
      povVariants: [
        "You round the corner. A face in the dark. You scream before you see who it is.",
        "Someone grabs your shoulder. You swing. It's your ally. Half the camp heard that."
      ]
    },
    {
      id: 'scare-teammate-on-purpose', points: -1, type: 'negative',
      statCheck: s => s.boldness >= 7,
      requiresVictimNearby: true, requiresSabotage: true,
      bondEffect: { target: 'victim', delta: -1.0 },
      flags: { justScreamed: true, victimPoints: -3 },
      textVariants: [
        `{name} hides behind a tree and jumps out at {victim}. {victim} screams so loud the birds take off. {name} is doubled over laughing. The slasher is now heading their way.`,
        `{name} sneaks up behind {victim} and grabs {pr.pos} shoulders. {victim} nearly passes out. {name} thinks it's the funniest thing that's happened all night.`,
        `{name} puts on a mask they found in the supply shed and walks toward {victim}. {victim} doesn't recognize {name} for a full five seconds. Those five seconds cost both of them.`,
        `{name} whispers {victim}'s name from behind a bush in a low voice. {victim} freezes, then runs. {name} can't stop laughing. The slasher can't stop listening.`
      ],
      povVariants: [
        "You hide behind the tree. They walk past. You grab their shoulders. The scream is amazing.",
        "You put on the mask. You walk toward them. Five seconds of pure terror. Worth it. Maybe."
      ]
    },
    {
      id: 'betrayal-discovery', points: -2, type: 'negative',
      statCheck: s => true,
      requiresAlly: true, requiresBond: 2,
      requiresBetrayedLastEp: true,
      bondEffect: { target: 'ally', delta: -1.5 },
      textVariants: [
        `While hiding in the supply shed, {name} finds a note {ally} wrote. It has {name}'s name on it. The trust dies right there in the dark.`,
        `{name} overhears {ally} whispering to someone else: 'We get rid of {name} next.' Hiding two feet away. Hearing every word.`,
        `In the panic, {ally}'s bag spills open. {name} sees the vote parchment. {pr.Sub} read{pr.sub==='they'?'':'s'} {pr.pos} own name. The look {name} gives {ally} says everything.`
      ],
      povVariants: [
        "The note has your name on it. Their handwriting. The trust dies right there in the dark.",
        "You overhear it. Your name. Their voice. 'We get rid of them next.' Two feet away."
      ]
    },
    {
      id: 'rivalry-flares', points: -3, type: 'negative',
      statCheck: s => true,
      requiresEnemy: true, requiresBond: -3,
      bondEffect: { target: 'enemy', delta: -1.0 },
      flags: { justArgued: true, bothAffected: true, catchBoost: 2 },
      textVariants: [
        `{name} and {enemy} end up in the same hiding spot. Neither will leave. The whispered argument escalates. The slasher doesn't even need to look.`,
        `{name} sees {enemy} hiding behind the same rock. 'Are you serious.' The mutual disgust is louder than either of them intended.`,
        `{name} and {enemy} are forced to share a cabin. They'd rather face the slasher. Almost do.`
      ],
      povVariants: [
        "Same hiding spot. Neither of you will leave. The whispered argument escalates. The slasher can hear both of you.",
        "You see their face. 'Are you serious.' The disgust is louder than you meant."
      ]
    },
    {
      id: 'someone-falls-asleep', points: -4, type: 'negative',
      statCheck: s => s.endurance <= 4,
      requiresLateRound: 4,
      bondEffect: null,
      flags: { autoCatchIfRolled: true },
      textVariants: [
        `{name} hasn't slept in two days. {pr.Sub} sit{pr.sub==='they'?'':'s'} down behind the cabin for 'just a second.' The next thing {pr.sub} know{pr.sub==='they'?'':'s'}, the slasher is standing over {pr.obj}.`,
        `The adrenaline crash hits {name} like a wall. Eyes close. Just for a moment. When they open, the mask is three feet away.`,
        `{name} leans against a tree and the exhaustion wins. {pr.Sub} wake{pr.sub==='they'?'':'s'} up to a hand on {pr.pos} shoulder. It's not a friend.`
      ],
      povVariants: [
        "You sit down for 'just a second.' Your eyes close. When they open, the mask is three feet away.",
        "The adrenaline crash hits like a wall. Everything goes dark. Then — a hand on your shoulder. Not a friend's."
      ]
    },
    {
      id: 'alliance-fracture', points: -2, type: 'negative',
      statCheck: s => true,
      requiresAllyWithLowLoyalty: 4, requiresSabotage: true,
      requiresNamedAlliance: true,
      bondEffect: { target: 'ally', delta: -2.5 },
      textVariants: [
        `{name} calls out for {ally}. {ally} is right there. {ally} does nothing. The alliance dies in that silence.`,
        `{name} reaches for {ally}'s hand. {ally} pulls away. Turns. Runs. {name} stands there for a second too long.`,
        `The slasher is closing in. {name} looks at {ally} — 'Help me.' {ally} looks back. Then {ally} looks away. That's the answer.`
      ],
      povVariants: [
        "You call out. They're right there. They do nothing. The alliance dies in that silence.",
        "You reach for their hand. They pull away. Turn. Run. That's the answer."
      ]
    },
    {
      id: 'horror-movie-cliche', points: -2, type: 'negative',
      statCheck: () => Math.random() < 0.12,
      bondEffect: null,
      textVariants: [
        `{name} says 'I think we're safe now.' Nobody should ever say that.`,
        `{name} says 'I'll be right back.' {pr.Sub} won't.`,
        `{name} asks 'Did you hear that?' — the last useful question anyone asks tonight.`,
        `{name} suggests they split up. That is never the answer.`,
        `{name} opens the basement door. There's no reason to open the basement door.`
      ],
      povVariants: [
        "'I think we're safe now.' You actually said that. Nobody should ever say that.",
        "'I'll be right back.' You won't."
      ]
    },
    {
      id: 'stalked', points: -1, type: 'negative',
      statCheck: s => s.intuition <= 5,
      bondEffect: null,
      flags: { stalked: true },
      textVariants: [
        `{name} feels it before seeing it. Footsteps matching {pr.pos}. The slasher has picked a target.`,
        `Every time {name} looks back, the shadow is still there. Following. Patient.`,
        `{name} hears breathing behind {pr.obj}. Not close enough to catch. Close enough to follow.`
      ],
      povVariants: [
        "You feel it before you see it. Footsteps matching yours. The slasher has picked a target. You.",
        "Every time you look back, the shadow is still there. Following. Patient. Matching your pace."
      ]
    }
  ]
};

const SLASHER_CAUGHT_SCENES = [
  {
    id: 'grabbed-from-behind',
    statCheck: s => s.intuition <= 5,
    text: `A hand on the shoulder. By the time {name} turns around, it's over.`
  },
  {
    id: 'cornered',
    statCheck: () => true,
    text: `{name} hits a wall. The slasher blocks the only exit.`
  },
  {
    id: 'outsmarted',
    statCheck: s => s.mental <= 5,
    text: `The slasher herded {name} exactly where it wanted.`
  },
  {
    id: 'betrayed-by-noise',
    requiresFlag: 'justScreamed',
    statCheck: () => true,
    text: `{name}'s own voice gave {pr.obj} away.`
  },
  {
    id: 'partner-caught-first',
    requiresFlag: 'partnerCaught',
    statCheck: () => true,
    text: `{name} watches {ally} go down. The hesitation costs everything.`
  },
  {
    id: 'jumped-from-above',
    statCheck: () => Math.random() < 0.15,
    text: `The slasher drops from the roof. {name} never looked up.`
  },
  {
    id: 'lured-by-fake-sound',
    statCheck: s => s.intuition <= 4,
    text: `A voice calls {name}'s name. It's not who {pr.sub} think{pr.sub==='they'?'':'s'}.`
  },
  {
    id: 'exhaustion',
    statCheck: s => s.endurance <= 4,
    requiresLateRound: 3,
    text: `{name} can't run anymore. The slasher didn't hurry.`
  },
  {
    id: 'overconfidence',
    requiresFlag: 'highScore',
    statCheck: () => true,
    text: `{name} thought {pr.sub} had it figured out. The slasher doesn't follow rules.`
  },
  {
    id: 'found-hiding',
    requiresFlag: 'isHiding',
    statCheck: () => true,
    text: `The slasher checks under the cabin. {name} is there. Eyes meet.`
  },
  {
    id: 'the-slow-walk',
    statCheck: s => s.boldness <= 4,
    text: `The slasher doesn't even run. It walks. {name} knows and can't do anything.`
  },
  {
    id: 'classic-catch',
    statCheck: () => true,
    text: `The slasher finds {name}. No tricks, no drama. Just caught.`
  }
];

const SLASHER_ATMOSPHERE = [
  `A scream cuts through the night. Then silence. Someone is gone.`,
  `The rain starts. Visibility drops to nothing.`,
  `The slasher's chainsaw revs in the distance. Closer than last time.`,
  `The camp lights flicker and die. Pure dark from here.`,
  `Something drags across the ground near the mess hall.`,
  `The remaining players can hear each other's breathing. The slasher can too.`,
  `A cabin door slams shut on its own.`,
  `The fire pit goes cold. The only light left is the moon.`,
  `Footsteps on gravel. Then they stop. Then they start again. Closer.`,
  `The generator cuts out. The hum that everyone ignored is suddenly the loudest absence in the world.`,
  `A branch cracks somewhere in the tree line. Nobody moves.`,
  `The wind shifts and carries a sound that shouldn't be there.`
];

const SLASHER_FINAL_WIN = [
  {
    id: 'fights-the-slasher',
    statCheck: s => s.physical >= 8 || s.boldness >= 7,
    priority: s => s.physical * 0.6 + s.boldness * 0.4,
    bondEffect: { target: 'tribe', delta: 0.3 },
    textVariants: [
      `{name} doesn't run. {pr.Sub} turn{pr.sub==='they'?'':'s'} and fight{pr.sub==='they'?'':'s'}. One swing. The slasher goes down. Raw strength. It's over.`,
      `{name} grabs the slasher by the mask and rips it off. The slasher stumbles back. {name} doesn't stop. The tribe watches from the treeline.`,
      `{name} charges. No weapon, no plan, just fury. The slasher takes a hit and retreats into the dark. {name} stands alone. Standing.`
    ]
  },
  {
    id: 'outsmarts',
    statCheck: s => s.strategic >= 7 || s.mental >= 8,
    priority: s => s.strategic * 0.5 + s.mental * 0.5,
    bondEffect: null,
    textVariants: [
      `{name} lures the slasher into a trap — a rigged net drops from the trees. Calculated. Cold. Effective.`,
      `{name} leads the slasher down a dead-end trail with a pit at the end. The slasher falls. {name} watches. Strategic respect from everyone who saw it.`,
      `{name} sets up a decoy and waits. The slasher takes the bait. By the time it realizes, {name} is already gone. Outplayed.`
    ]
  },
  {
    id: 'outlasts',
    statCheck: s => s.endurance >= 8,
    priority: s => s.endurance,
    bondEffect: null,
    textVariants: [
      `{name} runs. And runs. And runs. The slasher slows. {name} doesn't. Pure stamina. The slasher gives up first.`,
      `{name} has been moving all night. {pr.Sub} {pr.sub==='they'?'don\'t':'doesn\'t'} stop now. The slasher falls behind. Endurance wins.`,
      `Hours pass. The slasher is winded. {name} is still going. Lungs burning, legs screaming, but still moving. That's enough.`
    ]
  },
  {
    id: 'uses-shield',
    statCheck: s => s.loyalty <= 4 && s.strategic >= 6,
    requiresLowBondWithOpponent: true,
    priority: s => (10 - s.loyalty) * 0.5 + s.strategic * 0.5,
    bondEffect: { target: 'opponent', delta: -3.0 },
    textVariants: [
      `{name} shoves {loser} toward the slasher and disappears into the dark. Wins — but the tribe saw it. They all saw it.`,
      `{name} pushes {loser} into the slasher's path. Uses the head start to escape. Cold. Calculated. Unforgettable.`,
      `{name} redirects the slasher at {loser}. It works. {name} survives. The cost is everything else.`
    ]
  },
  {
    id: 'terror-escape',
    statCheck: s => s.physical <= 5 && s.strategic <= 5,
    priority: () => Math.random() * 4,
    bondEffect: null,
    textVariants: [
      `{name} just runs screaming into the jungle. No plan. No direction. Somehow — somehow — {pr.sub} make{pr.sub==='they'?'':'s'} it. Nobody understands how. Including {name}.`,
      `{name} panics, trips, rolls downhill, crashes through a bush, and lands in a creek. The slasher loses the trail. Dumb luck is still luck.`,
      `{name} hides in a garbage bin. The slasher walks past. {name} stays in there for another twenty minutes. Wins by default. A legend for all the wrong reasons.`
    ]
  },
  {
    id: 'talks-down',
    statCheck: s => s.social >= 8,
    priority: s => s.social,
    bondEffect: { target: 'tribe', delta: 0.5 },
    textVariants: [
      `{name} starts talking. To the slasher. About life, about fear, about why this doesn't have to end this way. The slasher stops. Nobody can believe it. Neither can {name}.`,
      `{name} holds up {pr.pos} hands. 'Wait. Just — wait.' The slasher pauses. {name} keeps talking. Calm. Steady. The slasher backs off. The tribe is stunned.`,
      `{name} sits down. In the open. Looks at the slasher and says, 'I'm done running.' The slasher stands there. Then turns. Then leaves. Nobody will ever explain this.`
    ]
  }
];

const SLASHER_FINAL_LOSE = [
  {
    id: 'pushed-as-shield',
    statCheck: () => true,
    requiresWinMethod: 'uses-shield',
    textVariants: [
      `{name} feels the shove before {pr.sub} understand{pr.sub==='they'?'':'s'} it. {winner} pushes {pr.obj} into the slasher's path. Used as bait. The tribe remembers.`,
      `{name} reaches for {winner}'s hand. {winner} pushes it away — and pushes {name} forward. The slasher takes what's offered.`,
      `{name} didn't see it coming. One second {winner} was beside {pr.obj}. The next, {name} was alone with the slasher. The betrayal registers last.`
    ]
  },
  {
    id: 'freezes',
    statCheck: s => s.boldness <= 4,
    textVariants: [
      `{name} freezes. {pr.Sub} can see {winner} escaping. {pr.Sub} can't follow. The fear wins.`,
      `{name}'s legs lock. The slasher closes the gap. {winner} disappears into the dark. {name} can't.`,
      `{name} stops. Not by choice. The body just won't move. The last thing {pr.sub} see{pr.sub==='they'?'':'s'} is {winner} getting away.`
    ]
  },
  {
    id: 'trips',
    statCheck: s => s.physical <= 4,
    textVariants: [
      `{name} trips. Classic. The slasher doesn't even slow down. {winner} gets away clean.`,
      `{name} catches a root and goes down hard. By the time {pr.sub} get{pr.sub==='they'?'':'s'} up, {winner} is gone and the slasher is here.`,
      `{name} stumbles on the trail. {winner} keeps running. {name} doesn't get back up in time.`
    ]
  },
  {
    id: 'wrong-direction',
    statCheck: s => s.intuition <= 4,
    textVariants: [
      `{name} runs left. The exit was right. {winner} knew. {name} didn't.`,
      `{name} heads for the cabin. The slasher came from the cabin. Wrong call.`,
      `{name} and {winner} split up. {name} picks the wrong path. The slasher was waiting at the end of it.`
    ]
  },
  {
    id: 'heroic-sacrifice',
    statCheck: s => s.loyalty >= 8,
    requiresHighBondWithWinner: 4,
    bondEffect: { target: 'winner', delta: 3.0, tribeBonus: 0.5 },
    textVariants: [
      `{name} sees the slasher closing on {winner}. {pr.Sub} step{pr.sub==='they'?'':'s'} in front. 'Go. Now.' {winner} goes. {name} doesn't. Legendary.`,
      `{name} grabs the slasher's attention. Waves. Shouts. Draws the pursuit away from {winner}. It costs {name} everything. {pr.Sub} know{pr.sub==='they'?'':'s'} it will.`,
      `{name} doesn't hesitate. {pr.Sub} put{pr.sub==='they'?'':'s'} {pr.ref} between {winner} and the slasher. The tribe will talk about this for seasons.`
    ]
  },
  {
    id: 'outsmarted-by-slasher',
    statCheck: s => s.mental <= 4,
    textVariants: [
      `{name} thought {pr.sub} had a plan. The slasher had a better one.`,
      `{name} zigged. The slasher anticipated it. {winner} zagged. The slasher didn't.`,
      `{name} was focused on the wrong thing. The slasher was focused on {name}.`
    ]
  }
];

function _slasherResolveText(template, ctx) {
  if (!template) return '';
  let t = template;
  if (ctx.name)    t = t.replace(/\{name\}/g,    ctx.name);
  if (ctx.ally)    t = t.replace(/\{ally\}/g,    ctx.ally);
  if (ctx.enemy)   t = t.replace(/\{enemy\}/g,   ctx.enemy);
  if (ctx.victim)  t = t.replace(/\{victim\}/g,  ctx.victim);
  if (ctx.winner)  t = t.replace(/\{winner\}/g,  ctx.winner);
  if (ctx.loser)   t = t.replace(/\{loser\}/g,   ctx.loser);
  if (ctx.scarer)  t = t.replace(/\{scarer\}/g,  ctx.scarer);
  // Pronoun resolution — use the main actor's pronouns
  const prName = ctx.name || ctx.scarer || ctx.winner || ctx.loser;
  if (prName) {
    const pr = pronouns(prName);
    t = t.replace(/\{pr\.sub\}/g,    pr.sub);
    t = t.replace(/\{pr\.obj\}/g,    pr.obj);
    t = t.replace(/\{pr\.pos\}/g,    pr.pos);
    t = t.replace(/\{pr\.posAdj\}/g, pr.posAdj);
    t = t.replace(/\{pr\.ref\}/g,    pr.ref);
    t = t.replace(/\{pr\.Sub\}/g,    pr.Sub);
    t = t.replace(/\{pr\.Obj\}/g,    pr.Obj);
    t = t.replace(/\{pr\.PosAdj\}/g, pr.PosAdj);
    // Handle inline ternary patterns like {pr.sub==='they'?'are':'is'}
    // Use greedy match with lookahead for the closing '} to handle apostrophes inside words (don't, isn't, etc.)
    t = t.replace(/\{pr\.sub==='they'\?'(.*?)':'(.*?)'\}/g,
      (_, ifThey, ifOther) => pr.sub === 'they' ? ifThey : ifOther);
  }
  return t;
}

function _slasherPickEvents(player, survivors, context) {
  const stats = pStats(player);
  const { roundNum, pairings, scores, eventHistory, caughtThisRound } = context;
  const nearby = (pairings[player] || []).filter(a => survivors.includes(a) && !caughtThisRound.has(a));
  const isAlone = nearby.length === 0;
  const groupSize = nearby.length + 1; // including self
  const emotional = getPlayerState(player).emotional;

  // Find an ally (highest bond among nearby)
  let bestAlly = null, bestAllyBond = -Infinity;
  for (const n of nearby) {
    const b = getBond(player, n);
    if (b > bestAllyBond) { bestAllyBond = b; bestAlly = n; }
  }
  // Find an enemy (lowest bond among nearby survivors)
  let bestEnemy = null, bestEnemyBond = Infinity;
  for (const n of survivors) {
    if (n === player) continue;
    const b = getBond(player, n);
    if (b < bestEnemyBond) { bestEnemyBond = b; bestEnemy = n; }
  }
  // Find a victim (nearby player with lowest bond to this player)
  let victimName = null, victimBond = Infinity;
  for (const n of nearby) {
    const b = getBond(player, n);
    if (b < victimBond) { victimBond = b; victimName = n; }
  }
  if (!victimName && nearby.length) victimName = nearby[0];

  // Showmance partner
  const showmancePartner = getShowmancePartner(player);

  // Player's past event IDs for diminishing returns
  const pastIds = (eventHistory[player] || []);
  const idCounts = {};
  pastIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });

  // Is player the highest scorer?
  const isHighScorer = Object.entries(scores).filter(([n]) => survivors.includes(n))
    .every(([n, s]) => n === player || s <= scores[player]);

  // Check if ally was betrayed last ep (voted against player)
  const lastEpHistory = gs.episodeHistory.length ? gs.episodeHistory[gs.episodeHistory.length - 1] : null;
  const wasBetrayed = bestAlly && lastEpHistory?.votingLog?.some(v => v.voter === bestAlly && v.voted === player);

  // Check named alliances
  const playerAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(player));

  // Build eligible events
  const eligible = [];

  const checkEvent = (evt) => {
    // Stat check
    if (!evt.statCheck(stats)) return null;

    // Archetype gating: sabotage events require villain/schemer or neutral with strategic>=6+loyalty<=4
    if (evt.requiresSabotage && !_canSabotage(player)) return null;

    // Social requirements
    if (evt.requiresAlly && !bestAlly) return null;
    if (evt.requiresAlly && evt.requiresBond !== undefined && bestAllyBond < evt.requiresBond) return null;
    if (evt.requiresEnemy && (!bestEnemy || bestEnemyBond >= (evt.requiresBond || 0))) return null;
    if (evt.requiresSolo && !isAlone) return null;
    if (evt.requiresGroup && groupSize < 3) return null;
    if (evt.requiresShowmance && !(showmancePartner && survivors.includes(showmancePartner) && nearby.includes(showmancePartner))) return null;
    if (evt.requiresHighScore && !isHighScorer) return null;
    if (evt.requiresLateRound && roundNum < evt.requiresLateRound) return null;
    if (evt.requiresSurvivedRounds && roundNum < evt.requiresSurvivedRounds) return null;
    if (evt.requiresBetrayedLastEp && !wasBetrayed) return null;
    if (evt.requiresVictimNearby && nearby.length < 1) return null;
    if (evt.requiresVictimCheck && bestAlly && !evt.requiresVictimCheck(pStats(bestAlly))) return null;
    if (evt.requiresAllyWithLowLoyalty) {
      const lowLoyaltyAlly = nearby.find(n => pStats(n).loyalty <= evt.requiresAllyWithLowLoyalty);
      if (!lowLoyaltyAlly) return null;
    }
    if (evt.requiresNamedAlliance && !playerAlliances.length) return null;

    // Diminishing returns
    const useCount = idCounts[evt.id] || 0;
    let pointsAdj = evt.points;
    if (useCount >= 1) {
      const dr = SLASHER_DIMINISHING_RETURNS[Math.min(useCount, 3)] || -2;
      pointsAdj = evt.points > 0 ? Math.max(1, evt.points + dr) : evt.points;
    }

    // Pick text variant
    const textTemplate = evt.textVariants[Math.floor(Math.random() * evt.textVariants.length)];

    // Determine ally for this event (for alliance-fracture, use the low-loyalty ally)
    let evtAlly = bestAlly;
    if (evt.requiresAllyWithLowLoyalty) {
      evtAlly = nearby.find(n => pStats(n).loyalty <= evt.requiresAllyWithLowLoyalty) || bestAlly;
    }

    // Resolve text
    const text = _slasherResolveText(textTemplate, {
      name: player,
      ally: evtAlly || bestAlly,
      enemy: bestEnemy,
      victim: victimName || bestEnemy,
      scarer: player,
      winner: null, loser: null
    });

    // Bond changes
    const bondChanges = [];
    if (evt.bondEffect) {
      const be = evt.bondEffect;
      if (be.target === 'ally' && evtAlly) {
        bondChanges.push({ a: player, b: evtAlly, delta: be.delta });
      } else if (be.target === 'enemy' && bestEnemy) {
        bondChanges.push({ a: player, b: bestEnemy, delta: be.delta });
      } else if (be.target === 'victim' && victimName) {
        bondChanges.push({ a: player, b: victimName, delta: be.delta });
      } else if (be.target === 'witnesses') {
        nearby.forEach(n => bondChanges.push({ a: player, b: n, delta: be.delta }));
      }
    }

    // Weight for selection: base from points + randomness + archetype alignment
    const baseWeight = Math.abs(pointsAdj) + 1;
    const emotionalMod = (emotional === 'paranoid' || emotional === 'desperate') && evt.type === 'negative' ? 1.3 : 1;
    const dimMod = useCount >= 1 ? 0.4 : 1; // strongly deprioritize repeats
    const weight = Math.max(0.1, baseWeight * emotionalMod * dimMod + Math.random() * 2);

    return { event: evt, points: pointsAdj, text, bondChanges, flags: evt.flags || {},
             ally: evtAlly, enemy: bestEnemy, victim: victimName, weight };
  };

  // Check all positive and negative events
  SLASHER_EVENTS.positive.forEach(evt => {
    const result = checkEvent(evt);
    if (result) eligible.push(result);
  });
  SLASHER_EVENTS.negative.forEach(evt => {
    const result = checkEvent(evt);
    if (result) eligible.push(result);
  });

  // Fallback: if nothing eligible, give a generic survival moment
  if (!eligible.length) {
    eligible.push({
      event: { id: 'generic-survive', type: 'positive', points: 0 },
      points: 0, text: `${player} keeps moving through the dark. Still here.`,
      bondChanges: [], flags: {}, weight: 1
    });
  }

  // Pick 1 guaranteed event (weighted)
  const picked = [];
  const pick1 = wRandom(eligible, e => e.weight);
  if (pick1) {
    picked.push(pick1);
    // Remove from pool to avoid picking same event twice
    const remaining = eligible.filter(e => e.event.id !== pick1.event.id);
    // 40% chance of a 2nd event
    if (remaining.length && Math.random() < 0.40) {
      const pick2 = wRandom(remaining, e => e.weight);
      if (pick2) picked.push(pick2);
    }
  }

  return picked;
}

function _slasherCatchTargeting(survivors, roundNum, context) {
  const { flags, scores, pairings, totalRounds, env } = context;

  // Never catch below 2 — those go to final showdown
  if (survivors.length <= 2) return [];

  // Number to catch: 1 if <=4 survivors; else 1-2 weighted
  let numCatch = 1;
  if (survivors.length > 4) {
    const earlyRound = roundNum <= Math.ceil(totalRounds / 2);
    numCatch = Math.random() < (earlyRound ? 0.60 : 0.30) ? 2 : 1;
  }
  // Don't catch so many we skip the final showdown
  numCatch = Math.min(numCatch, survivors.length - 2);
  if (numCatch <= 0) return [];

  // Calculate catch weights
  const weights = survivors.map(name => {
    const s = pStats(name);
    const pFlags = flags[name] || {};
    const isAlone = !(pairings[name]?.some(a => survivors.includes(a)));
    const groupMod = isAlone ? SLASHER_GROUP_CATCH_MOD.solo :
      (pairings[name]?.filter(a => survivors.includes(a)).length >= 2 ? SLASHER_GROUP_CATCH_MOD.group : SLASHER_GROUP_CATCH_MOD.pair);

    let w = (10 - s.boldness) * 0.3
          + (10 - s.intuition) * 0.2
          + (10 - s.physical) * 0.1
          + groupMod
          + (pFlags.justScreamed ? 1.5 : 0)
          + (pFlags.justArgued ? 1.0 : 0)
          + (pFlags.catchBoost || 0)
          + (pFlags.decoyCatchBoost || 0)
          - (pFlags.isHiding ? 3 : 0)
          - (pFlags.isBarricaded ? 2 : 0);

    // Environment modifiers
    if (env) {
      w += (env.catchMod || 0);
      if (pFlags.isHiding) w -= (env.hidingBonus || 0);
      if (isAlone) w += (env.soloMod || 0);
    }

    // Immune from catch this round (fake-out)
    if (pFlags.immuneFromCatch) w = 0;
    // Auto-catch if fell asleep
    if (pFlags.autoCatchIfRolled) w += 10;

    return { name, weight: Math.max(0.1, w) };
  });

  const caught = [];
  for (let i = 0; i < numCatch; i++) {
    const pool = weights.filter(w => !caught.includes(w.name) && w.weight > 0);
    if (!pool.length) break;
    const pick = wRandom(pool, w => w.weight);
    if (pick) caught.push(pick.name);
  }

  return caught;
}

function _slasherFinalShowdown(p1, p2, scores) {
  const s1 = pStats(p1), s2 = pStats(p2);
  const bondChanges = [];

  // Weighted roll to determine winner: composite stat + score advantage + randomness
  const composite = s => s.physical * 0.2 + s.endurance * 0.15 + s.mental * 0.1
    + s.strategic * 0.15 + s.boldness * 0.15 + s.intuition * 0.1 + s.social * 0.05 + s.temperament * 0.1;
  const w1 = composite(s1) + (scores[p1] || 0) * 0.1 + Math.random() * 3;
  const w2 = composite(s2) + (scores[p2] || 0) * 0.1 + Math.random() * 3;

  const winner = w1 >= w2 ? p1 : p2;
  const loser  = winner === p1 ? p2 : p1;
  const winStats = pStats(winner), loseStats = pStats(loser);
  const bond = getBond(winner, loser);

  // Pick win method: find qualifying methods, pick highest priority
  const eligibleWin = SLASHER_FINAL_WIN.filter(m => {
    if (!m.statCheck(winStats)) return false;
    if (m.requiresLowBondWithOpponent && bond > 0) return false;
    return true;
  });

  let winMethod;
  if (eligibleWin.length) {
    // Sort by priority (highest first), pick from top 2 with some randomness
    eligibleWin.sort((a, b) => (b.priority(winStats) + Math.random()) - (a.priority(winStats) + Math.random()));
    winMethod = eligibleWin[0];
  } else {
    // Fallback: terror escape
    winMethod = SLASHER_FINAL_WIN.find(m => m.id === 'terror-escape') || SLASHER_FINAL_WIN[0];
  }

  // Pick lose method based on win method
  let loseMethod;
  if (winMethod.id === 'uses-shield') {
    loseMethod = SLASHER_FINAL_LOSE.find(m => m.id === 'pushed-as-shield');
  } else {
    // Heroic sacrifice: only if loser has loyalty >= 8 and bond >= 4 with winner
    const canSacrifice = loseStats.loyalty >= 8 && bond >= 4;
    const eligibleLose = SLASHER_FINAL_LOSE.filter(m => {
      if (m.requiresWinMethod) return false; // skip 'pushed-as-shield'
      if (m.id === 'heroic-sacrifice' && !canSacrifice) return false;
      if (m.requiresHighBondWithWinner && bond < m.requiresHighBondWithWinner) return false;
      return m.statCheck(loseStats);
    });
    if (eligibleLose.length) {
      // Prefer heroic sacrifice if eligible (dramatic)
      loseMethod = eligibleLose.find(m => m.id === 'heroic-sacrifice') || eligibleLose[Math.floor(Math.random() * eligibleLose.length)];
    } else {
      // Fallback: outsmarted
      loseMethod = SLASHER_FINAL_LOSE.find(m => m.id === 'outsmarted-by-slasher') || SLASHER_FINAL_LOSE[0];
    }
  }

  // Resolve text
  const winTextTemplate = winMethod.textVariants[Math.floor(Math.random() * winMethod.textVariants.length)];
  const loseTextTemplate = loseMethod.textVariants[Math.floor(Math.random() * loseMethod.textVariants.length)];

  const winText = _slasherResolveText(winTextTemplate, { name: winner, loser, winner, ally: null, enemy: loser });
  const loseText = _slasherResolveText(loseTextTemplate, { name: loser, winner, loser, ally: null, enemy: winner });

  // Apply bond effects
  if (winMethod.bondEffect) {
    const be = winMethod.bondEffect;
    if (be.target === 'opponent') {
      bondChanges.push({ a: winner, b: loser, delta: be.delta });
    } else if (be.target === 'tribe') {
      gs.activePlayers.filter(p => p !== winner).forEach(p => {
        bondChanges.push({ a: winner, b: p, delta: be.delta });
      });
    }
  }
  if (loseMethod.bondEffect) {
    const be = loseMethod.bondEffect;
    if (be.target === 'winner') {
      bondChanges.push({ a: loser, b: winner, delta: be.delta });
      if (be.tribeBonus) {
        gs.activePlayers.filter(p => p !== loser && p !== winner).forEach(p => {
          bondChanges.push({ a: loser, b: p, delta: be.tribeBonus });
        });
      }
    }
  }

  return {
    winner, loser,
    winMethod: winMethod.id, winText,
    loseMethod: loseMethod.id, loseText,
    shieldPush: winMethod.id === 'uses-shield',
    heroicSacrifice: loseMethod.id === 'heroic-sacrifice',
    bondChanges
  };
}

// ═══════════════════════════════════════════════════════════════════
// FILM TITLE GENERATOR & CHRIS COMMENTARY
// ═══════════════════════════════════════════════════════════════════

const _FILM_ADJECTIVES = ['Silent', 'Crimson', 'Last', 'Endless', 'Bleeding', 'Forgotten', 'Final'];
const _FILM_NOUNS = ['Night', 'Scream', 'Shadow', 'Campfire', 'Darkness', 'Silence', 'Hour'];
const _FILM_LOCATIONS = ['Camp Wawanakwa', 'Skull Island', "Dead Man's Cove", 'The Dock', 'Cabin 13'];

function _generateFilmTitle() {
  const adj = _FILM_ADJECTIVES[Math.floor(Math.random() * _FILM_ADJECTIVES.length)];
  const noun = _FILM_NOUNS[Math.floor(Math.random() * _FILM_NOUNS.length)];
  const loc = _FILM_LOCATIONS[Math.floor(Math.random() * _FILM_LOCATIONS.length)];
  return Math.random() < 0.5
    ? `${adj} ${noun} at ${loc}`
    : `The ${adj} ${noun}`;
}

const _CHRIS_ROUND_LINES = {
  firstRound: [`"Opening scene. Establish the setting. Let the audience get comfortable. ...That's long enough."`],
  firstCatch: [`"FIRST BLOOD! And we're only in Act One. This is going to be GREAT television."`],
  highTension: [
    `"The pacing is perfect. The audience can feel it. Something bad is about to happen."`,
    `"I love this part. The quiet before the kill."`,
    `"You can feel the camera tightening, can't you?"`
  ],
  envShift: [
    `"Love what the atmosphere is doing for the shot. Very Carpenter."`,
    `"The production value on this is insane. I didn't even have to ask for it."`
  ],
  final3: [`"Act Three. This is where careers are made, people."`, `"Three left. Two too many."`],
  finalShowdown: [`"Two left. One walks away. The other... doesn't. Roll camera."`, `"This is the money shot. Nobody blink."`],
  doubleCatch: [`"A DOUBLE FEATURE! I didn't even plan that. Actually I might have."`, `"Two for one! The audience is going to LOSE it."`],
  generic: [
    `"Keep rolling. Keep rolling."`,
    `"Nobody cut. Nobody CUT."`,
    `"This is why I do what I do."`,
    `"Cinema."`,
    `"Beautiful. Terrifying. Same thing."`
  ]
};

function _pickChrisLine(pool) {
  const lines = _CHRIS_ROUND_LINES[pool] || _CHRIS_ROUND_LINES.generic;
  return lines[Math.floor(Math.random() * lines.length)];
}

export function simulateSlasherNight(ep) {
  const activePlayers = [...gs.activePlayers];
  // Max rounds: enough to catch everyone down to 2 (each round catches 1-2)
  const totalRounds = activePlayers.length * 2; // generous cap — loop breaks at 2 survivors
  const scores = {};
  const eventHistory = {}; // { [name]: [eventId, eventId, ...] }
  activePlayers.forEach(n => { scores[n] = 0; eventHistory[n] = []; });

  // ── FILM METADATA ──
  const filmTitle = _generateFilmTitle();
  const chrisOpener = `"Ladies and gentlemen... CHRIS McLEAN PRESENTS... ${filmTitle}. Viewer discretion is advised. Actually, no. Watch every second."`;
  const povOrder = [];
  const povUsed = new Set();

  // ── INITIAL PAIRINGS ──
  // Based on bonds: bond >= 3 → paired, showmances always paired
  const pairings = {}; // { [name]: [nearby allies] }
  activePlayers.forEach(n => { pairings[n] = []; });

  // Showmance pairs always together
  (gs.showmances || []).forEach(sh => {
    if (sh.phase === 'broken-up') return;
    const [a, b] = sh.players;
    if (activePlayers.includes(a) && activePlayers.includes(b)) {
      if (!pairings[a].includes(b)) pairings[a].push(b);
      if (!pairings[b].includes(a)) pairings[b].push(a);
    }
  });

  // Bond-based pairing: sort all pairs by bond descending, greedily pair
  const bondPairs = [];
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const b = getBond(activePlayers[i], activePlayers[j]);
      if (b >= 3) bondPairs.push({ a: activePlayers[i], b: activePlayers[j], bond: b });
    }
  }
  bondPairs.sort((x, y) => y.bond - x.bond);
  bondPairs.forEach(({ a, b }) => {
    if (!pairings[a].includes(b)) pairings[a].push(b);
    if (!pairings[b].includes(a)) pairings[b].push(a);
  });

  // ── ROUND LOOP ──
  let survivors = [...activePlayers];
  const caughtOrder = []; // [{ name, round, finalScore }]
  const rounds = [];

  for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
    // Check if we're at final 2
    if (survivors.length <= 2) break;

    const roundEvents = [];
    const roundFlags = {}; // per-player flags this round: { [name]: { justScreamed, isHiding, ... } }
    survivors.forEach(n => { roundFlags[n] = {}; });
    const caughtThisRound = new Set();

    // ── Environment selection (mechanical effects per round) ──
    const env = SLASHER_ENVIRONMENTS[Math.floor(Math.random() * SLASHER_ENVIRONMENTS.length)];

    // Survival bonus deferred to after catch targeting (only survivors who aren't caught get it)

    // ── Alliance coordination bonus ──
    // Named alliances with 3+ active survivors get bonus
    (gs.namedAlliances || []).forEach(alliance => {
      if (!alliance.active) return;
      const allianceAlive = alliance.members.filter(m => survivors.includes(m));
      if (allianceAlive.length >= 3) {
        // Find the "hub" — highest stat in the relevant category
        const leader = allianceAlive.reduce((best, n) => {
          const s = pStats(n);
          const score = Math.max(s.strategic, s.social, s.physical);
          return score > (best.score || 0) ? { name: n, score } : best;
        }, { score: 0 }).name;
        if (leader) {
          const leaderStats = pStats(leader);
          if (leaderStats.strategic >= 7) {
            // Strategic hub: group hides and sets traps
            allianceAlive.forEach(n => { scores[n] += 2; });
            scores[leader] += 1; // extra for leader
          } else if (leaderStats.social >= 7) {
            // Social hub: prevents panic
            allianceAlive.forEach(n => { roundFlags[n].panicImmune = true; });
          } else if (Math.random() < leaderStats.physical * 0.10) {
            // Physical hub: stands guard — proportional
            allianceAlive.forEach(n => { roundFlags[n].catchBoost = (roundFlags[n].catchBoost || 0) - 1; });
          }
        }
      }
    });

    // ── Hero/Villain Slasher Night bonuses ──
    survivors.forEach(p => {
      const _pArch = players.find(pl => pl.name === p)?.archetype || '';
      if (_pArch === 'villain') {
        // Villains THRIVE in Slasher Night — intimidation is their element
        scores[p] += 2; // baseline score boost
        roundFlags[p].panicImmune = true; // villains don't panic
      }
      if (_pArch === 'hero') {
        // Heroes protect others at personal cost — lower score but bond gains
        const _nearbyAllies = (pairings[p] || []).filter(a => survivors.includes(a));
        if (_nearbyAllies.length) {
          _nearbyAllies.forEach(ally => {
            scores[ally] += 1; // hero shields allies
            addBond(ally, p, 0.3); // ally appreciates the protection
          });
          scores[p] -= 1; // hero takes the risk
        }
      }
    });

    // ── Pick events per surviving player ──
    // Carry stalked flag from previous round: +3 catch weight unless cleared by positive event
    const _prevRound = rounds[rounds.length - 1];
    if (_prevRound) {
      survivors.forEach(n => {
        const prevFlags = _prevRound.events.filter(e => e.player === n && e.type !== 'caught');
        const wasStalked = prevFlags.some(e => e.eventId === 'stalked');
        if (wasStalked) {
          roundFlags[n].stalkedCarryOver = true;
          roundFlags[n].catchBoost = (roundFlags[n].catchBoost || 0) + 3;
        }
      });
    }

    for (const player of survivors) {
      const events = _slasherPickEvents(player, survivors, {
        roundNum, pairings, scores, eventHistory, caughtThisRound
      });

      events.forEach(ev => {
        scores[player] += ev.points;
        eventHistory[player].push(ev.event.id);

        // If stalked carry-over and got a positive event, clear the catch boost
        if (roundFlags[player].stalkedCarryOver && ev.event.type === 'positive') {
          roundFlags[player].catchBoost = Math.max(0, (roundFlags[player].catchBoost || 0) - 3);
          roundFlags[player].stalkedCarryOver = false;
        }

        // Merge flags into round flags
        if (ev.flags) {
          Object.entries(ev.flags).forEach(([k, v]) => {
            if (k === 'groupBonus' && v) {
              // Rally bonus: +1 to all nearby
              (pairings[player] || []).filter(a => survivors.includes(a)).forEach(a => {
                scores[a] += v;
              });
            } else if (k === 'victimCaught' && v && ev.victim) {
              // Push toward slasher: victim auto-caught
              if (survivors.includes(ev.victim) && !caughtThisRound.has(ev.victim)) {
                caughtThisRound.add(ev.victim);
                caughtOrder.push({ name: ev.victim, round: roundNum, finalScore: scores[ev.victim] });
              }
            } else if (k === 'victimPoints' && ev.victim) {
              // Scare teammate: victim gets penalty
              scores[ev.victim] = (scores[ev.victim] || 0) + v;
            } else if (k === 'witnessPanic' && v) {
              // Fake-out: witnesses may panic
              (pairings[player] || []).filter(a => survivors.includes(a)).forEach(a => {
                if (pStats(a).temperament <= 5 && Math.random() < 0.5) {
                  scores[a] += v;
                }
              });
            } else if (k === 'bothAffected' && v && ev.enemy && survivors.includes(ev.enemy)) {
              // Rivalry: both get penalty + catch boost
              scores[ev.enemy] += ev.points;
              roundFlags[ev.enemy] = roundFlags[ev.enemy] || {};
              roundFlags[ev.enemy].justArgued = true;
              roundFlags[ev.enemy].catchBoost = (roundFlags[ev.enemy].catchBoost || 0) + (ev.flags.catchBoost || 0);
            } else {
              roundFlags[player][k] = v;
            }
          });
        }

        // Apply bond changes
        ev.bondChanges.forEach(bc => addBond(bc.a, bc.b, bc.delta));

        // ── Popularity tracking ──
        const _heroicEvents = new Set(['stand-and-fight', 'protect-someone', 'the-decoy', 'heroic-stand', 'accidental-hero', 'partner-rescue-attempt']);
        const _cowardEvents = new Set(['abandon-ally', 'push-toward-slasher']);
        if (_heroicEvents.has(ev.event.id)) _popDelta(player, 1);
        if (_cowardEvents.has(ev.event.id)) _popDelta(player, -1);

        // ── Heat tracking for sabotage events ──
        if ((ev.event.id === 'push-toward-slasher' || ev.event.id === 'abandon-ally') && ev.victim) {
          if (!gs._slasherHeat) gs._slasherHeat = {};
          gs._slasherHeat[ev.victim] = { target: player, amount: 1.5, expiresEp: (gs.episode || 1) + 2 };
        }
        if (ev.event.id === 'scare-teammate-on-purpose' && ev.victim) {
          if (!gs._slasherHeat) gs._slasherHeat = {};
          gs._slasherHeat[ev.victim] = { target: player, amount: 1.0, expiresEp: (gs.episode || 1) + 2 };
        }
        if (ev.event.id === 'alliance-fracture' && ev.ally) {
          if (!gs._slasherHeat) gs._slasherHeat = {};
          gs._slasherHeat[ev.ally] = { target: player, amount: 2.0, expiresEp: (gs.episode || 1) + 2 };
        }

        // ── Romance sparks during intense moments ──
        if ((ev.event.id === 'confession-under-pressure' || ev.event.id === 'protect-someone' || ev.event.id === 'warn-ally') && ev.ally) {
          if (romanticCompat(player, ev.ally)) {
            _challengeRomanceSpark(player, ev.ally, ep, null, null, scores, 'slasher hunt');
          }
        }

        roundEvents.push({
          player, eventId: ev.event.id, points: ev.points, text: ev.text,
          type: ev.event.type, bondChanges: ev.bondChanges.map(bc => ({...bc})),
          ally: ev.ally || null, enemy: ev.enemy || null, victim: ev.victim || null
        });
      });
    }

    // ── Overconfidence penalty ──
    // Highest scorer this round with boldness >= 6 → 20% chance of penalty
    const roundScoreGains = {};
    roundEvents.forEach(re => {
      roundScoreGains[re.player] = (roundScoreGains[re.player] || 0) + re.points;
    });
    const topScorer = survivors.reduce((best, n) => {
      const gain = roundScoreGains[n] || 0;
      return gain > (best.gain || -Infinity) ? { name: n, gain } : best;
    }, { gain: -Infinity });
    if (topScorer.name && Math.random() < pStats(topScorer.name).boldness * 0.02) { // proportional: stat 4=8%, stat 7=14%, stat 10=20%
      scores[topScorer.name] -= 3;
      roundFlags[topScorer.name].highScore = true;
      roundEvents.push({
        player: topScorer.name, eventId: 'overconfidence-penalty', points: -3,
        text: `${topScorer.name} gets cocky. Drops ${pronouns(topScorer.name).posAdj} guard for one second too long. The slasher was watching.`,
        type: 'negative', bondChanges: [], ally: null, enemy: null, victim: null
      });
    }

    // ── Catch targeting ──
    const caughtNames = _slasherCatchTargeting(
      survivors.filter(n => !caughtThisRound.has(n)),
      roundNum,
      { flags: roundFlags, scores, pairings, totalRounds, env }
    );

    // Process caught players
    caughtNames.forEach(name => {
      if (caughtThisRound.has(name)) return; // already caught by push event
      caughtThisRound.add(name);
      caughtOrder.push({ name, round: roundNum, finalScore: scores[name] });

      // Pick caught scene
      const s = pStats(name);
      const pf = roundFlags[name] || {};
      const eligibleScenes = SLASHER_CAUGHT_SCENES.filter(sc => {
        if (sc.requiresFlag && !pf[sc.requiresFlag]) return false;
        if (sc.requiresLateRound && roundNum < sc.requiresLateRound) return false;
        return sc.statCheck(s);
      });
      const scene = eligibleScenes.length
        ? eligibleScenes[Math.floor(Math.random() * eligibleScenes.length)]
        : SLASHER_CAUGHT_SCENES.find(sc => sc.id === 'classic-catch') || SLASHER_CAUGHT_SCENES[0];

      // Find ally for caught scene text
      const catchAlly = (pairings[name] || []).find(a => survivors.includes(a) && !caughtThisRound.has(a));
      const sceneText = _slasherResolveText(scene.text, { name, ally: catchAlly });

      roundEvents.push({
        player: name, eventId: 'caught-' + scene.id, points: 0,
        text: sceneText, type: 'caught', bondChanges: [], ally: catchAlly, enemy: null, victim: null
      });

      // When partner gets caught: check loyalty response of nearby allies
      (pairings[name] || []).filter(a => survivors.includes(a) && !caughtThisRound.has(a)).forEach(ally => {
        const allyStats = pStats(ally);
        const allyBond = getBond(ally, name);
        // Proportional rescue: loyalty determines chance and quality of help
        const _rescueChance = allyStats.loyalty * 0.10; // loyalty 3=30%, loyalty 7=70%, loyalty 10=100%
        if (Math.random() < _rescueChance) {
          const _rescueQuality = allyStats.loyalty * 0.3; // loyalty 3=0.9, loyalty 7=2.1, loyalty 10=3.0
          scores[ally] += Math.round(_rescueQuality);
          addBond(ally, name, allyStats.loyalty * 0.15);
          roundFlags[ally].decoyCatchBoost = (roundFlags[ally].decoyCatchBoost || 0) + Math.round(allyStats.loyalty * 0.2);
          roundEvents.push({
            player: ally, eventId: 'partner-rescue-attempt', points: Math.round(_rescueQuality),
            text: `${ally} sees ${name} go down and charges in. ${pronouns(ally).Sub} ${pronouns(ally).sub === 'they' ? 'aren\'t' : 'isn\'t'} leaving anyone behind.`,
            type: 'positive', bondChanges: [{ a: ally, b: name, delta: allyStats.loyalty * 0.15 }], ally: name, enemy: null, victim: null
          });
        } else {
          // Didn't help — bond penalty scales inversely with loyalty (disloyal = bigger betrayal)
          addBond(ally, name, -(1.0 - allyStats.loyalty * 0.08));
          roundFlags[ally].partnerCaught = true;
        }
      });
    });

    // Deferred survival bonus: only players who survive this round (not caught) get +2
    survivors.filter(n => !caughtThisRound.has(n)).forEach(n => {
      scores[n] += SLASHER_ROUND_SURVIVAL_BONUS;
    });

    // Save who was alive at start of round (before catching) for VP display
    const _remainingBeforeCatch = [...survivors];
    // Remove caught from survivors
    survivors = survivors.filter(n => !caughtThisRound.has(n));

    // Environment text (replaces old flavor-only atmosphere)
    const atmosphere = env.text;

    // ── POV Selection ──
    const povScores = survivors.map(n => {
      const evtPoints = roundEvents.filter(e => e.player === n).reduce((s, e) => s + Math.abs(e.points), 0);
      const wasCaught = caughtThisRound.has(n);
      const hadBigPositive = roundEvents.filter(e => e.player === n && e.points >= 3).length;
      const hadNeg = roundEvents.some(e => e.player === n && e.points < 0);
      return {
        name: n,
        score: evtPoints * 2 + (wasCaught ? 10 : 0) + (hadBigPositive ? 3 : 0) + (hadNeg ? 2 : 0) + (Math.random() * 2 - 1)
      };
    });
    // No repeat POV until all used
    const povCandidates = povScores.filter(p => !povUsed.has(p.name));
    const povPool = povCandidates.length ? povCandidates : povScores;
    povPool.sort((a, b) => b.score - a.score);
    const povPlayer = povPool[0]?.name || survivors[0];
    povUsed.add(povPlayer);
    povOrder.push(povPlayer);

    // ── POV Text for POV player events ──
    const povEvents = roundEvents.filter(e => e.player === povPlayer).map(e => {
      // Find the event definition to get povVariants
      const evtDef = [...SLASHER_EVENTS.positive, ...SLASHER_EVENTS.negative].find(ev => ev.id === e.eventId);
      const povText = evtDef?.povVariants?.length
        ? evtDef.povVariants[Math.floor(Math.random() * evtDef.povVariants.length)]
        : null;
      return { ...e, povText };
    });

    // ── Tension Score ──
    const tensionScore = Math.min(10,
      roundNum * 1.2
      + caughtThisRound.size * 2
      + (env.id === 'silence' ? 1 : 0)
      + (survivors.length <= 3 ? 2 : 0)
      + (survivors.length <= 2 ? 3 : 0)
    );

    // ── Slasher Proximity ──
    const slasherProximity = {};
    survivors.forEach(n => {
      if (caughtThisRound.has(n)) slasherProximity[n] = 'here';
      else if (roundFlags[n]?.stalkedCarryOver || roundFlags[n]?.catchBoost >= 3) slasherProximity[n] = 'closing';
      else if (roundEvents.some(e => e.player === n && e.points < 0)) slasherProximity[n] = 'near';
      else slasherProximity[n] = 'far';
    });

    // ── Chris Commentary ──
    let chrisLine;
    if (roundNum === 1) chrisLine = _pickChrisLine('firstRound');
    else if (caughtThisRound.size > 0 && !rounds.some(r => r.caught?.length)) chrisLine = _pickChrisLine('firstCatch');
    else if (caughtThisRound.size >= 2) chrisLine = _pickChrisLine('doubleCatch');
    else if (survivors.length <= 3 && survivors.length > 2) chrisLine = _pickChrisLine('final3');
    else if (survivors.length <= 2) chrisLine = _pickChrisLine('finalShowdown');
    else if (tensionScore >= 7) chrisLine = _pickChrisLine('highTension');
    else chrisLine = _pickChrisLine('generic');

    // ── Horror Beats (atmospheric interstitials for VP) ──
    const _envBeats = SLASHER_HORROR_BEATS[env.id] || [];
    const _genBeats = SLASHER_HORROR_BEATS.generic || [];
    const _beatPool = [..._envBeats, ..._genBeats];
    const _roundBeats = [];
    if (_beatPool.length) {
      const numBeats = 1 + (Math.random() < 0.5 ? 1 : 0); // 1-2 beats
      const _used = new Set();
      for (let _bi = 0; _bi < numBeats && _bi < _beatPool.length; _bi++) {
        let pick;
        let attempts = 0;
        do { pick = _beatPool[Math.floor(Math.random() * _beatPool.length)]; attempts++; }
        while (_used.has(pick) && attempts < 20);
        if (!_used.has(pick)) { _roundBeats.push(pick); _used.add(pick); }
      }
    }

    rounds.push({
      num: roundNum,
      events: roundEvents,
      caught: [...caughtThisRound].map(n => ({
        name: n,
        score: scores[n],
        scene: roundEvents.find(e => e.player === n && e.type === 'caught')?.text || '',
        jumpscareLevel: 0  // placeholder — assigned after all rounds
      })),
      atmosphere,
      remaining: _remainingBeforeCatch,
      survivorCount: survivors.length,
      // Overdrive fields
      povPlayer,
      povEvents,
      tensionScore,
      slasherProximity,
      chrisLine,
      environmentId: env.id,
      horrorBeats: _roundBeats
    });

    // Update pairings: remove caught players
    survivors.forEach(n => {
      pairings[n] = (pairings[n] || []).filter(a => survivors.includes(a));
    });
  }

  // ── ACT BREAKS ──
  const actBreaks = [0, rounds.length - 1]; // default
  const firstCatchRound = rounds.findIndex(r => r.caught?.length > 0);
  if (firstCatchRound >= 0) actBreaks[0] = firstCatchRound;
  const final3Round = rounds.findIndex(r => r.survivorCount <= 3);
  if (final3Round >= 0) actBreaks[1] = final3Round;
  // Ensure act breaks are ordered and valid
  if (actBreaks[1] <= actBreaks[0]) actBreaks[1] = Math.min(actBreaks[0] + 1, rounds.length - 1);

  // ── JUMPSCARE ASSIGNMENT ──
  const jumpscareRounds = [];
  // First catch: level 2
  if (firstCatchRound >= 0 && rounds[firstCatchRound]?.caught?.length) {
    rounds[firstCatchRound].caught[0].jumpscareLevel = 2;
    jumpscareRounds.push(firstCatchRound);
  }
  // One random mid-game catch: level 1
  const midCatchRounds = rounds
    .map((r, i) => ({ idx: i, caught: r.caught }))
    .filter(r => r.caught?.length && r.idx !== firstCatchRound && r.idx < rounds.length - 1);
  if (midCatchRounds.length) {
    const midPick = midCatchRounds[Math.floor(Math.random() * midCatchRounds.length)];
    midPick.caught[0].jumpscareLevel = 1;
    jumpscareRounds.push(midPick.idx);
  }

  // ── FINAL SHOWDOWN ──
  let finalShowdown = null;
  if (survivors.length === 2) {
    finalShowdown = _slasherFinalShowdown(survivors[0], survivors[1], scores);

    // Final showdown loser gets level 2 jumpscare
    if (finalShowdown.loser) {
      finalShowdown.jumpscareLevel = 2;
    }

    // Apply bond changes from showdown
    finalShowdown.bondChanges.forEach(bc => addBond(bc.a, bc.b, bc.delta));

    // Showdown popularity: heroic wins get +1, shield-push gets -1
    if (finalShowdown.winMethod === 'fights-the-slasher' || finalShowdown.winMethod === 'talks-down') {
      _popDelta(finalShowdown.winner, 1);
    } else if (finalShowdown.winMethod === 'uses-shield') {
      _popDelta(finalShowdown.winner, -1);
    }

    // Award survival bonus to showdown participants
    scores[finalShowdown.winner] += SLASHER_ROUND_SURVIVAL_BONUS;
    scores[finalShowdown.loser] += SLASHER_ROUND_SURVIVAL_BONUS;

    // Loser is caught last
    caughtOrder.push({ name: finalShowdown.loser, round: totalRounds, finalScore: scores[finalShowdown.loser] });
  } else if (survivors.length === 1) {
    // Edge case: only 1 survivor left (all others caught in rounds)
    finalShowdown = {
      winner: survivors[0], loser: null,
      winMethod: 'last-standing', winText: `${survivors[0]} is the last one standing. No showdown needed.`,
      loseMethod: null, loseText: null, bondChanges: []
    };
  }

  // ── DETERMINE RESULTS ──
  const immunityWinner = finalShowdown?.winner || survivors[0];

  // Lowest total score = eliminated (excluding immunity winner)
  // Tiebreaker: caught earliest → most negative events → random
  const scorable = activePlayers.filter(n => n !== immunityWinner);
  scorable.sort((a, b) => {
    const diff = scores[a] - scores[b];
    if (diff !== 0) return diff; // lowest score first
    // Tie: caught earlier = eliminated (handled fear worse)
    const caughtA = caughtOrder.find(c => c.name === a)?.round ?? Infinity;
    const caughtB = caughtOrder.find(c => c.name === b)?.round ?? Infinity;
    if (caughtA !== caughtB) return caughtA - caughtB; // earlier caught = worse
    // Still tied: more negative events = worse
    const negA = rounds.flatMap(r => r.events).filter(e => e.player === a && e.points < 0).length;
    const negB = rounds.flatMap(r => r.events).filter(e => e.player === b && e.points < 0).length;
    if (negA !== negB) return negB - negA; // more negatives = worse
    // Final tiebreak: random
    return Math.random() - 0.5;
  });
  const eliminated = scorable[0];

  // Build leaderboard
  const leaderboard = activePlayers.map(n => ({
    name: n, score: scores[n],
    caughtRound: caughtOrder.find(c => c.name === n)?.round || null,
    isWinner: n === immunityWinner,
    isEliminated: n === eliminated
  })).sort((a, b) => b.score - a.score);

  // ── Surviving together bond bonus: +0.5 for all who survived to round 2+ ──
  const survivedMultipleRounds = activePlayers.filter(n => {
    const c = caughtOrder.find(co => co.name === n);
    return !c || c.round >= 2;
  });
  for (let i = 0; i < survivedMultipleRounds.length; i++) {
    for (let j = i + 1; j < survivedMultipleRounds.length; j++) {
      addBond(survivedMultipleRounds[i], survivedMultipleRounds[j], 0.5);
    }
  }

  // ── SET RESULTS ON EP ──
  ep.slasherNight = {
    rounds,
    scores,
    caughtOrder,
    pairings,
    finalShowdown,
    immunityWinner,
    eliminated,
    leaderboard,
    // Overdrive fields
    filmTitle,
    actBreaks,
    jumpscareRounds,
    povOrder,
    chrisOpener,
    chrisCloser: `"And... CUT. That's a wrap on ${filmTitle}. ${immunityWinner} — you earned that final ${pronouns(immunityWinner).sub === 'they' ? 'survivor' : (pronouns(immunityWinner).sub === 'she' ? 'girl' : 'guy')} moment. ${eliminated} — you were my favorite kill. See you at the premiere."`
  };

  // Popularity: last survivor gets hero edit, weakest link gets soft target edit
  if (!gs.popularity) gs.popularity = {};
  if (immunityWinner) gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 2;
  if (eliminated) gs.popularity[eliminated] = (gs.popularity[eliminated] || 0) - 1;

  // Showmance moments during the hunt
  _checkShowmanceChalMoment(ep, 'slasherNight', ['hunt', 'showdown'], scores, 'survival', activePlayers);

  updateChalRecord(ep);
}

export function _textSlasherNight(ep, ln, sec) {
  // Slasher pre-tribal kill
  const _slasherTw = (ep.twists||[]).find(t => t.type === 'slasher-night');
  if (_slasherTw?.slasher && _slasherTw?.slasherVictim) {
    sec('SLASHER NIGHT');
    ln(`${_slasherTw.slasher} was secretly chosen as the Slasher.`);
    ln(`At camp, ${_slasherTw.slasher} eliminated ${_slasherTw.slasherVictim} before tribal. The tribe woke to find them gone.`);
    ln(`Tribal council still runs — a second player will be voted out.`);
  }

  // Full slasher night episode
  if (!ep.isSlasherNight || !ep.slasherNight) return;
  const sn = ep.slasherNight;
  sec('SLASHER NIGHT');
  if (sn.filmTitle) ln(`"${sn.filmTitle}"`);
  if (sn.chrisOpener) ln(`Chris: "${sn.chrisOpener}"`);
  ln('');
  ln(`Players: ${(sn.rounds?.[0]?.remaining || []).join(', ')}`);
  if (sn.finalShowdown) {
    if (sn.finalShowdown.winMethod === 'last-standing') ln(`IMMUNITY WINNER: ${sn.immunityWinner} — last one standing.`);
    else ln(`IMMUNITY WINNER: ${sn.immunityWinner} — won the final showdown (${sn.finalShowdown.winMethod}).`);
  } else ln(`IMMUNITY WINNER: ${sn.immunityWinner}`);
  ln('');
  (sn.rounds || []).forEach(r => {
    const actLabel = sn.actBreaks ? (r.num <= sn.actBreaks[0] + 1 ? 'I' : r.num <= sn.actBreaks[1] ? 'II' : 'III') : '';
    ln(`Round ${r.num}${actLabel ? ` (Act ${actLabel})` : ''} — ${r.survivorCount + (r.caught?.length || 0)} remaining:`);
    if (r.atmosphere) ln(`  [${r.atmosphere}]`);
    if (r.povPlayer) ln(`  📹 POV: ${r.povPlayer}`);
    const topPositive = r.events.filter(e => e.type === 'positive' && e.points > 0)
      .sort((a, b) => b.points - a.points)[0];
    if (topPositive) ln(`  ★ ${topPositive.text}`);
    if (r.povEvents?.length) {
      const povMoment = r.povEvents.find(pe => pe.povText);
      if (povMoment) ln(`  📹 "${povMoment.povText}"`);
    }
    if (r.caught?.length) r.caught.forEach(c => ln(`  Caught: ${c.name} (score: ${c.score})`));
    else ln('  No one caught.');
    if (r.chrisLine) ln(`  Chris: "${r.chrisLine}"`);
  });
  ln('');
  if (sn.finalShowdown?.loser) {
    ln(`FINAL SHOWDOWN: ${sn.finalShowdown.winner} vs ${sn.finalShowdown.loser}`);
    if (sn.finalShowdown.winText) ln(`  ${sn.finalShowdown.winText}`);
    if (sn.finalShowdown.loseText) ln(`  ${sn.finalShowdown.loseText}`);
  }
  if (sn.chrisCloser) ln(`Chris: "${sn.chrisCloser}"`);
  ln('');
  ln(`ELIMINATED: ${sn.eliminated} (score: ${sn.scores[sn.eliminated]})`);
  ln('');
  ln('WHY THEY DIDN\'T SURVIVE:');
  const elimEvents = (sn.rounds || []).flatMap(r => r.events.filter(e => e.player === sn.eliminated));
  const negativeEvents = elimEvents.filter(e => e.points < 0 || e.type === 'caught' || e.type === 'negative');
  if (negativeEvents.length) negativeEvents.forEach(e => ln(`  - ${e.text || e.eventId} (${e.points >= 0 ? '+' : ''}${e.points} pts)`));
  else ln('  - No standout negative events — simply accumulated the lowest score.');
  ln(`  Final score: ${sn.scores[sn.eliminated]}`);
}

// ═══════════════════════════════════════════════════════════════════
// VHS TAPE SHELL — Wraps VP content in degrading VHS playback
// ═══════════════════════════════════════════════════════════════════

let _slasherAudioCtx = null;
let _slasherAudioNodes = {};

export function _slasherAudioInit() {
  if (_slasherAudioCtx) return;
  try {
    _slasherAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = _slasherAudioCtx.createGain();
    master.gain.value = 0;
    master.connect(_slasherAudioCtx.destination);

    // Ambient drone: two detuned sine oscillators
    const osc1 = _slasherAudioCtx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 55;
    const osc2 = _slasherAudioCtx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 57;
    const droneGain = _slasherAudioCtx.createGain();
    droneGain.gain.value = 0.03;
    osc1.connect(droneGain); osc2.connect(droneGain);
    droneGain.connect(master);
    osc1.start(); osc2.start();

    // Brown noise for underlying texture
    const noiseLen = _slasherAudioCtx.sampleRate * 2;
    const noiseBuf = _slasherAudioCtx.createBuffer(1, noiseLen, _slasherAudioCtx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < noiseLen; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      noiseData[i] = lastOut * 3.5;
    }
    const noiseNode = _slasherAudioCtx.createBufferSource();
    noiseNode.buffer = noiseBuf; noiseNode.loop = true;
    const noiseLPF = _slasherAudioCtx.createBiquadFilter();
    noiseLPF.type = 'lowpass'; noiseLPF.frequency.value = 200;
    const noiseGain = _slasherAudioCtx.createGain();
    noiseGain.gain.value = 0.02;
    noiseNode.connect(noiseLPF); noiseLPF.connect(noiseGain); noiseGain.connect(master);
    noiseNode.start();

    // Heartbeat oscillator (Act III only, started on demand)
    const hbOsc = _slasherAudioCtx.createOscillator();
    hbOsc.type = 'sine'; hbOsc.frequency.value = 40;
    const hbGain = _slasherAudioCtx.createGain();
    hbGain.gain.value = 0;
    hbOsc.connect(hbGain); hbGain.connect(master);
    hbOsc.start();

    _slasherAudioNodes = { master, droneGain, noiseGain, hbGain, osc1, osc2, noiseNode, hbOsc };
  } catch (e) { /* Web Audio not available */ }
}

export function _slasherAudioDestroy() {
  if (!_slasherAudioCtx) return;
  try {
    _slasherAudioNodes.osc1?.stop();
    _slasherAudioNodes.osc2?.stop();
    _slasherAudioNodes.noiseNode?.stop();
    _slasherAudioNodes.hbOsc?.stop();
    _slasherAudioCtx.close();
  } catch (e) { /* ignore */ }
  _slasherAudioCtx = null;
  _slasherAudioNodes = {};
}

export function _slasherAudioSetAct(actNum, tension) {
  if (!_slasherAudioCtx || !_slasherAudioNodes.master) return;
  const isMuted = _tvState.slasherAudioMuted === true;
  const t = _slasherAudioCtx.currentTime;
  const baseGain = isMuted ? 0 : 1;
  _slasherAudioNodes.master.gain.linearRampToValueAtTime(baseGain, t + 0.3);
  // Drone gain scales with act
  const droneLevel = actNum === 1 ? 0.03 : actNum === 2 ? 0.06 : 0.10;
  _slasherAudioNodes.droneGain.gain.linearRampToValueAtTime(droneLevel, t + 1);
  // Heartbeat in Act III
  const hbLevel = actNum >= 3 ? Math.min(0.15, tension * 0.015) : 0;
  _slasherAudioNodes.hbGain.gain.linearRampToValueAtTime(hbLevel, t + 0.5);
}

export function _slasherAudioFireStinger(level) {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const gain = level === 2 ? 0.7 : 0.4;
  const dur = level === 2 ? 0.5 : 0.3;
  // Dissonant chord
  [200, 283, 337].forEach(freq => {
    const osc = _slasherAudioCtx.createOscillator();
    osc.type = 'square'; osc.frequency.value = freq;
    const g = _slasherAudioCtx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(_slasherAudioCtx.destination);
    osc.start(t); osc.stop(t + dur);
  });
  if (level === 2) {
    // Sub thud
    const sub = _slasherAudioCtx.createOscillator();
    sub.type = 'sine'; sub.frequency.value = 30;
    const sg = _slasherAudioCtx.createGain();
    sg.gain.setValueAtTime(0.5, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    sub.connect(sg); sg.connect(_slasherAudioCtx.destination);
    sub.start(t); sub.stop(t + 0.4);
  }
}

export function _slasherAudioFireChainsaw() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const osc = _slasherAudioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.linearRampToValueAtTime(400, t + 0.5);
  osc.frequency.linearRampToValueAtTime(200, t + 1.5);
  const bpf = _slasherAudioCtx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 300; bpf.Q.value = 5;
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  osc.connect(bpf); bpf.connect(g); g.connect(_slasherAudioCtx.destination);
  osc.start(t); osc.stop(t + 1.5);
}

export function _slasherAudioFireStatic() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const len = _slasherAudioCtx.sampleRate * 0.2;
  const buf = _slasherAudioCtx.createBuffer(1, len, _slasherAudioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = _slasherAudioCtx.createBufferSource();
  src.buffer = buf;
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  src.connect(g); g.connect(_slasherAudioCtx.destination);
  src.start(t);
}

export function _slasherAudioFireRewind() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const len = _slasherAudioCtx.sampleRate * 0.5;
  const buf = _slasherAudioCtx.createBuffer(1, len, _slasherAudioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = _slasherAudioCtx.createBufferSource();
  src.buffer = buf;
  const bpf = _slasherAudioCtx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(4000, t);
  bpf.frequency.exponentialRampToValueAtTime(200, t + 0.5);
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  src.connect(bpf); bpf.connect(g); g.connect(_slasherAudioCtx.destination);
  src.start(t);
}

// Scream SFX — sharp rising shriek on catch reveals
export function _slasherAudioFireScream() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  // High-pitched shriek: fast rising square wave with distortion
  const osc = _slasherAudioCtx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(1800, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.6);
  const dist = _slasherAudioCtx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = (Math.PI + 10) * x / (Math.PI + 10 * Math.abs(x)); }
  dist.curve = curve;
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  osc.connect(dist); dist.connect(g); g.connect(_slasherAudioCtx.destination);
  osc.start(t); osc.stop(t + 0.7);
}

// Creak SFX — low tonal groan for horror beats
export function _slasherAudioFireCreak() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const osc = _slasherAudioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(60 + Math.random() * 40, t);
  osc.frequency.linearRampToValueAtTime(30 + Math.random() * 20, t + 0.8);
  const bpf = _slasherAudioCtx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 120; bpf.Q.value = 8;
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.2, t + 0.1);
  g.gain.linearRampToValueAtTime(0.15, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  osc.connect(bpf); bpf.connect(g); g.connect(_slasherAudioCtx.destination);
  osc.start(t); osc.stop(t + 0.9);
}

// Heartbeat spike — quick thump-thump for negative events
export function _slasherAudioFireHeartbeat() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  [0, 0.25].forEach(offset => {
    const osc = _slasherAudioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, t + offset);
    osc.frequency.exponentialRampToValueAtTime(30, t + offset + 0.15);
    const g = _slasherAudioCtx.createGain();
    g.gain.setValueAtTime(0.4, t + offset);
    g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18);
    osc.connect(g); g.connect(_slasherAudioCtx.destination);
    osc.start(t + offset); osc.stop(t + offset + 0.2);
  });
}

// Tension sting — brief dissonant hit for positive events (suspense)
export function _slasherAudioFireTension() {
  if (!_slasherAudioCtx || _tvState.slasherAudioMuted === true) return;
  const t = _slasherAudioCtx.currentTime;
  const osc = _slasherAudioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150 + Math.random() * 50, t);
  osc.frequency.linearRampToValueAtTime(100, t + 0.4);
  const g = _slasherAudioCtx.createGain();
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(g); g.connect(_slasherAudioCtx.destination);
  osc.start(t); osc.stop(t + 0.4);
}

// Jumpscare visual system
export function _fireJumpscare(level, containerId) {
  if (level === 0) return;
  const container = document.getElementById(containerId);
  if (!container) return;

  if (level === 2) {
    // Full jumpscare: blackout → red flash → fade
    const overlay = document.createElement('div');
    overlay.className = 'vhs-jumpscare-overlay';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);

    setTimeout(() => {
      const face = document.createElement('div');
      face.className = 'vhs-jumpscare-face';
      overlay.appendChild(face);
      overlay.style.background = 'radial-gradient(circle, #1a0000, #000)';
    }, 200);
    setTimeout(() => {
      overlay.style.background = '#000';
      overlay.innerHTML = '';
    }, 500);
    setTimeout(() => overlay.remove(), 800);
  } else {
    // Level 1: brief red border flash on the card itself (no overlay)
    container.style.boxShadow = '0 0 20px rgba(218,54,51,0.8), inset 0 0 10px rgba(218,54,51,0.3)';
    container.style.transition = 'box-shadow 0.3s';
    setTimeout(() => { container.style.boxShadow = ''; }, 600);
  }
}

// VHS Shell wrapper
function _slasherVHSShell(innerHtml, act, tensionScore, epNum) {
  const tc = `${String(Math.floor(tensionScore * 6)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
  const counter = String(Math.floor(Math.random() * 9000) + 1000);
  return `<div class="vhs-shell" data-act="${act}">
    <div class="vhs-tracking"></div>
    <div class="vhs-grain"></div>
    <div class="vhs-timecode"><span class="rec-dot"></span>REC ${tc}</div>
    <div class="vhs-tape-counter">▶ PLAY ${counter}</div>
    <button class="vhs-mute-btn" onclick="_slasherToggleMute(this)" title="Toggle audio">🔊</button>
    <div class="vhs-content">
      ${innerHtml}
    </div>
  </div>`;
}

export function _slasherToggleMute(btn) {
  const wasMuted = _tvState.slasherAudioMuted === true;
  _tvState.slasherAudioMuted = !wasMuted;
  btn.textContent = wasMuted ? '🔊' : '🔇';
  if (!wasMuted) {
    // Muting
    if (_slasherAudioNodes.master) {
      _slasherAudioNodes.master.gain.linearRampToValueAtTime(0, (_slasherAudioCtx?.currentTime || 0) + 0.3);
    }
  } else {
    // Unmuting — init if needed
    _slasherAudioInit();
    if (_slasherAudioNodes.master) {
      _slasherAudioNodes.master.gain.linearRampToValueAtTime(1, (_slasherAudioCtx?.currentTime || 0) + 0.3);
    }
  }
}

// Portrait helper with proximity/POV/signal-lost classes
function _slasherPortrait(name, sn, roundIdx, options = {}) {
  const { isPov, isCaught, proximity } = options;
  let classes = '';
  if (isCaught) classes += ' vhs-signal-lost';
  else if (proximity === 'closing') classes += ' vhs-proximity-closing';
  else if (proximity === 'near') classes += ' vhs-proximity-near';

  let povHtml = '';
  if (isPov) {
    classes += ' vhs-pov-frame';
    povHtml = '<span class="vhs-pov-rec"><span class="rec-dot" style="width:5px;height:5px;display:inline-block;border-radius:50%;background:#da3633;margin-right:2px;vertical-align:middle"></span>REC</span>';
  }

  return `<span class="${classes.trim()}" style="display:inline-block;position:relative">${rpPortrait(name, 'sm')}${povHtml}</span>`;
}

function _generateCinematicText(evt, povPlayer) {
  if (!povPlayer || !evt) return evt?.text || '';
  const pr = pronouns(povPlayer);
  const name = povPlayer;
  const eid = evt.eventId || '';
  
  const cinematicMap = {
    'find-hiding-spot': [
      `${name} drops low behind the boathouse wall. Presses flat. Doesn't breathe.`,
      `${name} slides under the cabin porch. The gap is barely wide enough. Footsteps pass three inches above.`,
      `${name}'s hand finds a gap in the floorboards. ${pr.Sub} squeezes through. The dark swallows ${pr.obj} whole.`
    ],
    'caught': [
      `${name} turns the corner. The slasher is already there. It's over before ${pr.sub} can scream.`,
      `A hand clamps down on ${name}'s shoulder. ${pr.Sub} doesn't even get to run.`,
      `The camera finds ${name} backed against the wall. Nowhere left to go.`
    ],
    'protect-someone': [
      `${name} steps between the slasher and the others. 'Run. I've got this.'`,
      `${name} grabs a chair and holds it like a shield. ${pr.Sub} isn't going anywhere.`,
      `${name} shoves the others behind ${pr.obj} and faces the dark alone.`
    ],
    'abandon-ally': [
      `${name} bolts. Doesn't look back. The screaming behind ${pr.obj} fades to nothing.`,
      `${name}'s eyes go wide. ${pr.Sub} mouths 'sorry' and disappears into the dark.`,
      `Self-preservation wins. ${name} runs and doesn't stop until the screaming stops.`
    ],
    'push-someone': [
      `${name} shoves someone toward the sound. A distraction. A sacrifice.`,
      `${name}'s hand shoots out. Someone stumbles forward into the path. ${name} doesn't watch what happens next.`
    ],
    'panic-scream': [
      `${name} screams. The sound rips through the camp like a siren.`,
      `${name}'s nerve breaks. The scream gives away everything — position, direction, fear.`,
      `A shriek from ${name}. Raw. Primal. Every head turns.`
    ],
    'stand-and-fight': [
      `${name}'s hand closes around something heavy. ${pr.Sub} swings before thinking. Contact. The slasher staggers.`,
      `Something in ${name} snaps. No more running. ${pr.Sub} picks up the rock and waits.`,
      `${name} squares up. No weapon, just fists and fury. The slasher actually hesitates.`
    ],
    'set-a-trap': [
      `${name} rigs the tripwire in the dark. Hands shaking. The knot holds. Footsteps approaching.`,
      `${name} pours the cooking oil. Backs away. Waits. The crash is immensely satisfying.`,
      `${name}'s trap clicks into place. A thin smile. 'Your turn to be scared.'`
    ],
    'find-weapon': [
      `${name}'s hand finds the machete. Cold metal. A weapon. Everything changes.`,
      `${name} pulls the fire axe from the wall mount. The weight feels like power.`,
      `${name} wraps ${pr.pos} fist around a pipe wrench. Now it's a fair fight.`
    ],
    'noise-distraction': [
      `${name} hurls a rock through the far window. Glass explodes. The slasher's head snaps toward the sound.`,
      `${name} kicks the trash cans over. The clatter echoes through camp. 'Over here, ugly.'`,
      `${name} throws the torch into the dark. The slasher's head snaps toward the light.`
    ],
    'run-for-it': [
      `${name} breaks into a sprint. Branches whip ${pr.pos} face. Doesn't matter. Just run.`,
      `${name} launches from cover. Full speed. The treeline is thirty yards away. Maybe.`,
      `${name} runs. Not gracefully. Not strategically. Just pure animal flight.`
    ],
    'confession': [
      `${name} grabs someone's hand in the dark. 'If we don't make it—' ${pr.Sub} doesn't finish.`,
      `${name}'s voice cracks: 'I need you to know something.' The timing is terrible. The honesty isn't.`,
      `Pressed together in the crawlspace, ${name} whispers something meant for only one person.`
    ],
    'barricade': [
      `${name} drags the dresser against the door. Then the table. Then everything else.`,
      `${name} hammers boards across the window. Each nail buys seconds. Maybe.`,
      `${name} jams the chair under the doorknob. Old trick. ${pr.Sub}'s betting ${pr.pos} life on it.`
    ],
    'distraction': [
      `${name} steps into the open. Arms wide. 'HEY! OVER HERE!' The others scatter.`,
      `${name} runs the opposite direction, making as much noise as possible. The slasher follows.`,
      `${name} draws the danger toward ${pr.obj}self. Brave. Possibly stupid. Definitely both.`
    ],
    'warn-others': [
      `${name} sprints between cabins, banging on doors: 'MOVE! It's coming!'`,
      `${name} screams a warning into the dark. Some hear it. Some don't.`,
      `${name} finds the others and ${pr.pos} face says everything before ${pr.sub} can speak.`
    ],
    'rally': [
      `${name} pulls them together. 'We're not dying out here. Not tonight.'`,
      `${name}'s voice cuts through the panic: 'Together. We move together.'`,
      `${name} grabs shoulders, makes eye contact. 'Focus. We're getting out of this.'`
    ],
    'calm-others': [
      `${name} keeps ${pr.pos} voice low and steady. 'Breathe. We've got time. We've got each other.'`,
      `${name} puts a hand on someone's arm. No words needed. The trembling stops.`,
      `${name} is the reason nobody screams. The calm in ${pr.obj} is contagious.`
    ],
    'rooftop-escape': [
      `${name} pulls ${pr.obj}self onto the roof. Shingles crack. The whole camp spreads below.`,
      `${name} reaches the rooftop. Up here, the moonlight is merciless. But so is the vantage point.`
    ],
    'sabotage': [
      `${name} loosens the bolt on the barricade. Quietly. Nobody notices. That's the point.`,
      `${name} 'accidentally' kicks the lantern over. In the chaos, ${pr.sub} slips away smiling.`,
      `${name} cuts the rope. The escape route collapses. ${pr.Sub} was never on their side.`
    ],
    'scheme': [
      `${name} leans in close: 'I know a way out. But not for everyone.'`,
      `${name}'s eyes calculate. Every person is a variable. Every exit, a negotiation.`,
      `${name} whispers to the right person at the wrong time. The alliance fractures.`
    ]
  };
  
  const variants = cinematicMap[eid];
  if (!variants || !variants.length) return evt.text || '';
  return variants[Math.floor(Math.random() * variants.length)];
}

// ═══════════════════════════════════════════════════════════════════
// VP SCREENS — VHS Three-Act Film
// ═══════════════════════════════════════════════════════════════════

// Determine which players are caught by a given round
function _caughtByRound(sn, upToRoundIdx) {
  const caught = new Set();
  for (let i = 0; i <= upToRoundIdx && i < sn.rounds.length; i++) {
    (sn.rounds[i].caught || []).forEach(c => caught.add(c.name));
  }
  return caught;
}

export function rpBuildSlasherTitleCard(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const allPlayers = sn.rounds?.[0]?.remaining || sn.leaderboard?.map(e => e.name) || [];
  const title = sn.filmTitle || 'Slasher Night';
  const opener = sn.chrisOpener || '';

  const inner = `<div class="rp-page" style="background:#0a0a0a;padding:40px 20px">
    <div style="text-align:center;margin:20px 0 30px">
      <div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:4px;text-transform:uppercase;margin-bottom:20px">CHRIS McLEAN PRESENTS</div>
      <div style="font-family:var(--font-display);font-size:36px;color:#da3633;letter-spacing:2px;text-shadow:0 0 30px rgba(218,54,51,0.5);line-height:1.2;margin-bottom:12px">${title}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:rgba(218,54,51,0.6);letter-spacing:3px;text-transform:uppercase">VIEWER DISCRETION IS ADVISED</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:24px 0;filter:sepia(0.3) saturate(0.7) brightness(0.85)">
      ${allPlayers.map((n, i) => `<span style="transform:rotate(${(i % 2 ? 2 : -2) + Math.random() * 2}deg)">${rpPortrait(n)}</span>`).join('')}
    </div>
    ${opener ? `<div class="vhs-chris-line">${opener}</div>` : ''}
    <div style="text-align:center;margin-top:24px">
      <div style="font-family:var(--font-mono);font-size:18px;color:rgba(255,255,255,0.4);letter-spacing:2px">▶ PLAY</div>
    </div>
  </div>`;

  return _slasherVHSShell(inner, 'title', 0, ep.num);
}

// ── Helper: Build flat scene items array from rounds ──
function _buildSceneItems(actRounds, sn, startRoundOffset) {
  const items = [];
  actRounds.forEach((round, ri) => {
    // Round header
    items.push({
      type: 'round-header',
      text: `Round ${round.num} — ${(round.remaining?.length || 0)} remain`,
      atmosphere: round.atmosphere || ''
    });

    const events = round.events || [];
    let evtsSinceLastBeat = 0;
    const beats = [...(round.horrorBeats || [])];
    let beatIdx = 0;

    events.forEach((evt, ei) => {
      // Interleave horror beats every 2-3 events
      evtsSinceLastBeat++;
      const beatThreshold = 2 + (Math.random() < 0.4 ? 1 : 0);
      if (evtsSinceLastBeat >= beatThreshold && beatIdx < beats.length) {
        items.push({ type: 'horror-beat', text: beats[beatIdx] });
        beatIdx++;
        evtsSinceLastBeat = 0;
      }

      // Find matching caught entry for jumpscare level
      const caughtEntry = (round.caught || []).find(c => c.name === evt.player);
      const isPov = round.povPlayer === evt.player;
      const prox = round.slasherProximity?.[evt.player] || 'far';

      // Use cinematic text for POV player
      let displayText = evt.text;
      if (isPov) {
        displayText = _generateCinematicText(evt, round.povPlayer);
      }

      items.push({
        type: 'event',
        player: evt.player,
        text: displayText,
        points: evt.points || 0,
        eventType: evt.type || 'positive',
        eventId: evt.eventId || '',
        isCaught: evt.type === 'caught',
        jumpscareLevel: (evt.type === 'caught' && caughtEntry) ? (caughtEntry.jumpscareLevel || 0) : 0,
        proximity: prox,
        isPov,
        roundIdx: startRoundOffset + ri,
        sn
      });
    });

    // Inject remaining beats after events
    while (beatIdx < beats.length) {
      items.push({ type: 'horror-beat', text: beats[beatIdx] });
      beatIdx++;
    }

    // Chris line
    if (round.chrisLine) {
      items.push({ type: 'chris', text: round.chrisLine });
    }
  });
  return items;
}

// ── Helper: Render scene items to HTML ──
function _renderSceneItems(items, stateKey, sn) {
  let html = `<div data-total-items="${items.length}">`;
  items.forEach((item, i) => {
    const hidden = i > 0 ? ' style="display:none"' : '';
    const id = `sl-item-${stateKey}-${i}`;

    if (item.type === 'round-header') {
      html += `<div id="${id}" class="slasher-round-header" style="color:#da3633${i > 0 ? ';display:none' : ''}" data-evttype="round-header">
        ${item.text}
        ${item.atmosphere ? `<div class="vhs-osd">${item.atmosphere}</div>` : ''}
      </div>`;
    } else if (item.type === 'horror-beat') {
      html += `<div id="${id}" class="slasher-beat-card"${hidden} data-evttype="horror-beat">${item.text}</div>`;
    } else if (item.type === 'chris') {
      html += `<div id="${id}" class="vhs-chris-line"${hidden} data-evttype="chris">${item.text}</div>`;
    } else if (item.type === 'event') {
      const pts = item.points;
      const ptColor = pts >= 0 ? '#3fb950' : '#f85149';
      const catchClass = item.isCaught ? ' slasher-catch-card' : '';
      const jsAttr = item.jumpscareLevel > 0 ? ` data-jumpscare="${item.jumpscareLevel}"` : '';

      html += `<div id="${id}" class="slasher-event-card${catchClass}"${hidden} data-evttype="${item.isCaught ? 'caught' : 'event'}" data-points="${pts}"${jsAttr}>
        ${_slasherPortrait(item.player, item.sn, item.roundIdx, { isPov: item.isPov, isCaught: item.isCaught, proximity: item.proximity })}
        <div class="slasher-event-text" ${item.isPov ? 'style="color:#e6edf3;font-style:italic"' : ''}>${item.text}</div>
        ${!item.isCaught
          ? `<span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;background:${pts >= 0 ? 'rgba(63,185,80,0.12)' : 'rgba(218,54,51,0.12)'};color:${ptColor};white-space:nowrap">${pts >= 0 ? '+' : ''}${pts}</span>`
          : '<span class="slasher-score-neg" style="font-size:10px;font-family:var(--font-mono);letter-spacing:2px">⛌ CAUGHT</span>'}
      </div>`;
    }
  });
  html += `</div>`;

  // Next button
  html += `<button id="sl-next-${stateKey}" class="slasher-next-btn" onclick="slasherRevealNext('${stateKey}')">▶ WHAT HAPPENS NEXT...</button>`;

  return html;
}

export function rpBuildSlasherActI(ep) {
  const sn = ep.slasherNight;
  if (!sn || !sn.rounds?.length) return '';
  const stateKey = String(ep.num) + '_slasher_act1';
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };

  const endIdx = sn.actBreaks ? sn.actBreaks[0] : Math.min(2, sn.rounds.length - 1);
  const actRounds = sn.rounds.slice(0, endIdx + 1);
  const items = _buildSceneItems(actRounds, sn, 0);

  let inner = `<div class="rp-page" style="background:#0a0a0a;padding:20px">
    <div class="vhs-act-card"><h2>ACT I</h2><p>First Blood</p></div>
    ${_renderSceneItems(items, stateKey, sn)}
  </div>`;

  return _slasherVHSShell(inner, 1, actRounds[actRounds.length - 1]?.tensionScore || 2, ep.num);
}

export function rpBuildSlasherActII(ep) {
  const sn = ep.slasherNight;
  if (!sn || !sn.rounds?.length) return '';
  const stateKey = String(ep.num) + '_slasher_act2';
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };

  const startIdx = sn.actBreaks ? sn.actBreaks[0] + 1 : 3;
  const endIdx = sn.actBreaks ? sn.actBreaks[1] - 1 : sn.rounds.length - 2;
  if (startIdx > endIdx || startIdx >= sn.rounds.length) return '';
  const actRounds = sn.rounds.slice(startIdx, endIdx + 1);
  const caughtSoFar = _caughtByRound(sn, startIdx - 1);
  const totalPlayers = sn.rounds[0]?.remaining?.length || sn.leaderboard?.length || 0;

  const items = _buildSceneItems(actRounds, sn, startIdx);

  // Track caught for body count sidebar
  actRounds.forEach(r => (r.caught || []).forEach(c => caughtSoFar.add(c.name)));

  let inner = `<div class="rp-page" style="background:#0a0a0a;padding:20px">
    <div class="vhs-act-card"><h2>ACT II</h2><p>The Long Night</p></div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:300px">
      ${_renderSceneItems(items, stateKey, sn)}
    </div>
    <div style="width:140px;flex-shrink:0">
      <div class="vhs-body-count">
        <div style="font-weight:800;margin-bottom:6px">BODY COUNT: ${caughtSoFar.size}/${totalPlayers}</div>
        ${[...caughtSoFar].map(name => `<div class="vhs-body-count-entry"><span class="vhs-body-count-x">✕</span>${rpPortrait(name, 'xs')}<span style="font-size:9px;color:#484f58">${name.split(' ')[0]}</span></div>`).join('')}
      </div>
    </div>
    </div>
  </div>`;

  return _slasherVHSShell(inner, 2, actRounds[actRounds.length - 1]?.tensionScore || 5, ep.num);
}

export function rpBuildSlasherActIII(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const stateKey = String(ep.num) + '_slasher_act3';
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };

  const startIdx = sn.actBreaks ? sn.actBreaks[1] : Math.max(0, sn.rounds.length - 1);
  const actRounds = sn.rounds.slice(startIdx);
  const fs = sn.finalShowdown;
  const winner = sn.immunityWinner;

  const subtitle = winner ? `${winner} STANDS ALONE` : 'THE FINAL HUNT';
  const items = _buildSceneItems(actRounds, sn, startIdx);

  // Add final showdown and winner reveal as extra items
  const extraItems = [];
  if (fs && fs.loser) {
    extraItems.push({
      type: 'showdown',
      winner: fs.winner,
      loser: fs.loser,
      winText: fs.winText || '',
      loseText: fs.loseText || ''
    });
  }
  if (winner) {
    extraItems.push({
      type: 'winner-reveal',
      winner,
      pr: pronouns(winner)
    });
  }

  let inner = `<div class="rp-page" style="background:#0a0a0a;padding:20px">
    <div class="vhs-act-card"><h2>ACT III</h2><p>${subtitle}</p></div>`;

  // Render main scene items
  const allItems = [...items];
  const mainCount = allItems.length;

  inner += `<div data-total-items="${mainCount + extraItems.length}">`;

  // Main gameplay items
  allItems.forEach((item, i) => {
    const hidden = i > 0 ? ' style="display:none"' : '';
    const id = `sl-item-${stateKey}-${i}`;

    if (item.type === 'round-header') {
      inner += `<div id="${id}" class="slasher-round-header" style="color:#da3633${i > 0 ? ';display:none' : ''}" data-evttype="round-header">
        ${item.text}
        ${item.atmosphere ? `<div class="vhs-osd">${item.atmosphere}</div>` : ''}
      </div>`;
    } else if (item.type === 'horror-beat') {
      inner += `<div id="${id}" class="slasher-beat-card"${hidden} data-evttype="horror-beat">${item.text}</div>`;
    } else if (item.type === 'chris') {
      inner += `<div id="${id}" class="vhs-chris-line"${hidden} data-evttype="chris">${item.text}</div>`;
    } else if (item.type === 'event') {
      const pts = item.points;
      const ptColor = pts >= 0 ? '#3fb950' : '#f85149';
      const catchClass = item.isCaught ? ' slasher-catch-card' : '';
      const jsAttr = item.jumpscareLevel > 0 ? ` data-jumpscare="${item.jumpscareLevel}"` : '';

      inner += `<div id="${id}" class="slasher-event-card${catchClass}"${hidden} data-evttype="${item.isCaught ? 'caught' : 'event'}"${jsAttr}>
        ${_slasherPortrait(item.player, item.sn, item.roundIdx, { isPov: item.isPov, isCaught: item.isCaught, proximity: item.proximity })}
        <div class="slasher-event-text" ${item.isPov ? 'style="color:#e6edf3;font-style:italic"' : ''}>${item.text}</div>
        ${!item.isCaught
          ? `<span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;background:${pts >= 0 ? 'rgba(63,185,80,0.12)' : 'rgba(218,54,51,0.12)'};color:${ptColor};white-space:nowrap">${pts >= 0 ? '+' : ''}${pts}</span>`
          : '<span class="slasher-score-neg" style="font-size:10px;font-family:var(--font-mono);letter-spacing:2px">⛌ CAUGHT</span>'}
      </div>`;
    }
  });

  // Showdown item
  let extraIdx = mainCount;
  if (fs && fs.loser) {
    inner += `<div id="sl-item-${stateKey}-${extraIdx}" style="display:none;text-align:center;padding:30px 0;border-top:1px solid rgba(218,54,51,0.2)" data-evttype="event">
      <div style="font-family:var(--font-mono);font-size:10px;color:rgba(218,54,51,0.6);letter-spacing:3px;margin-bottom:16px">FINAL SHOWDOWN</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px">
        ${rpPortrait(fs.winner)}
        <div class="slasher-showdown-vs">VS</div>
        ${rpPortrait(fs.loser)}
      </div>
      <div style="margin-top:16px">
        <div class="slasher-event-text" style="color:#3fb950;margin-bottom:6px">${fs.winText || ''}</div>
        <div class="slasher-event-text" style="color:#f85149">${fs.loseText || ''}</div>
      </div>
    </div>`;
    extraIdx++;
  }

  // Winner reveal item
  if (winner) {
    const pr = pronouns(winner);
    inner += `<div id="sl-item-${stateKey}-${extraIdx}" style="display:none;text-align:center;padding:20px 0;border-top:1px solid rgba(63,185,80,0.2)" data-evttype="event">
      <div style="font-family:var(--font-mono);font-size:10px;color:#3fb950;letter-spacing:3px;margin-bottom:12px">IMMUNITY WINNER</div>
      <div style="display:inline-block;border:3px solid rgba(240,192,64,0.6);border-radius:50%;padding:4px">${rpPortrait(winner)}</div>
      <div style="font-size:16px;font-weight:700;color:#e6edf3;margin-top:8px">${winner}</div>
      <div style="font-size:11px;color:#8b949e">Survived the night. The final ${pr.sub === 'they' ? 'survivor' : (pr.sub === 'she' ? 'girl' : 'guy')}.</div>
    </div>`;
    extraIdx++;
  }

  inner += `</div>`; // close items container

  // Next button
  inner += `<button id="sl-next-${stateKey}" class="slasher-next-btn" onclick="slasherRevealNext('${stateKey}')">▶ KEEP WATCHING...</button>`;

  inner += `</div>`;
  return _slasherVHSShell(inner, 3, 9, ep.num);
}

export function rpBuildSlasherCredits(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const winner = sn.immunityWinner;
  const eliminated = sn.eliminated;
  const title = sn.filmTitle || 'Slasher Night';
  const closer = sn.chrisCloser || '';
  const pr = winner ? pronouns(winner) : { sub: 'they' };
  const finalRole = pr.sub === 'they' ? 'THE FINAL SURVIVOR' : (pr.sub === 'she' ? 'THE FINAL GIRL' : 'THE FINAL GUY');

  let inner = `<div class="rp-page" style="background:#0a0a0a;padding:30px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:var(--font-display);font-size:28px;color:#e6edf3;letter-spacing:2px;margin-bottom:4px">CUT.</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:#484f58;letter-spacing:3px;margin-top:12px">DIRECTED BY CHRIS McLEAN</div>
    </div>

    <div class="vhs-credits" style="margin:24px 0">`;

  // Winner starring
  if (winner) {
    inner += `<div class="vhs-credits-starring">STARRING</div>
      <div style="display:inline-block;border:3px solid rgba(240,192,64,0.5);border-radius:50%;padding:4px;margin:8px 0">${rpPortrait(winner)}</div>
      <div class="vhs-credits-name">${winner}</div>
      <div class="vhs-credits-role">as ${finalRole}</div>
      <div style="font-size:11px;color:#8b949e;margin-top:4px">Score: ${sn.scores[winner] || 0} pts</div>`;
  }

  // Eliminated
  if (eliminated) {
    inner += `<div class="vhs-credits-starring" style="margin-top:20px">ALSO STARRING</div>
      <div class="vhs-signal-lost" style="display:inline-block;margin:8px 0">${rpPortrait(eliminated)}</div>
      <div class="vhs-credits-name">${eliminated}</div>
      <div class="vhs-credits-role" style="color:#da3633">Didn't make the sequel</div>`;

    // Why they lost
    const elimEvents = (sn.rounds || []).flatMap(r => r.events.filter(e => e.player === eliminated));
    const negEvents = elimEvents.filter(e => e.points < 0 || e.type === 'caught');
    if (negEvents.length) {
      inner += `<div style="margin:8px auto;max-width:400px;text-align:left">`;
      negEvents.slice(0, 3).forEach(e => {
        inner += `<div style="font-size:11px;color:#8b949e;padding:2px 0">• ${e.text || e.eventId} <span style="color:#f85149">(${e.points >= 0 ? '+' : ''}${e.points})</span></div>`;
      });
      inner += `</div>`;
    }
    inner += `<div style="font-size:11px;color:#484f58;margin-top:4px">Final score: ${sn.scores[eliminated] || 0} pts</div>`;
  }

  // Full cast as rolling credits
  inner += `<div style="margin-top:24px;border-top:1px solid #21262d;padding-top:16px">
    <div class="vhs-credits-starring">FULL CAST</div>`;
  (sn.leaderboard || []).forEach(entry => {
    const caughtText = entry.caughtRound ? `Caught Rd ${entry.caughtRound}` : 'Survived';
    const icon = entry.isWinner ? '👑' : entry.isEliminated ? '💀' : '';
    inner += `<div class="vhs-credits-row">
      <span>${icon} ${entry.name}</span>
      <span class="vhs-credits-dots"></span>
      <span>${entry.score} pts — ${caughtText}</span>
    </div>`;
  });
  inner += `</div>`;

  // Chris closer + THE END
  if (closer) inner += `<div class="vhs-chris-line" style="margin-top:20px">${closer}</div>`;
  inner += `<div style="text-align:center;margin-top:30px">
    <div style="font-family:var(--font-display);font-size:24px;color:#484f58;letter-spacing:4px">THE END</div>
    <div style="font-size:11px;color:#21262d;margin-top:8px;font-style:italic">...or is it?</div>
  </div>`;

  // Rewind button
  inner += `<div style="text-align:center;margin-top:16px">
    <button class="vp-reveal-btn" onclick="vpSetScreen(vpScreens.findIndex(s=>s.id==='slasher-title'));_slasherAudioFireRewind()" style="font-family:var(--font-mono);font-size:10px;color:#484f58;background:none;border:1px solid #21262d;padding:4px 12px;border-radius:4px;cursor:pointer">◀◀ REWIND</button>
  </div>`;

  inner += `</div></div>`;
  return _slasherVHSShell(inner, 'credits', 0, ep.num);
}

// ── Per-event reveal function ──
export function slasherRevealNext(stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const next = _tvState[stateKey].revealed + 1;
  const el = document.getElementById(`sl-item-${stateKey}-${next}`);
  if (!el) {
    // All revealed — update button
    const btn = document.getElementById(`sl-next-${stateKey}`);
    if (btn) { btn.textContent = '✓ ALL REVEALED'; btn.disabled = true; btn.style.opacity = '0.4'; }
    return;
  }
  // Auto-init audio on first reveal click (needs user gesture)
  if (!_slasherAudioCtx && _tvState.slasherAudioMuted !== true) _slasherAudioInit();

  el.style.display = '';
  el.scrollIntoView({ block: 'nearest' });
  _tvState[stateKey].revealed = next;

  // Check if this is a catch with jumpscare
  const jsLevel = parseInt(el.dataset.jumpscare || '0');
  if (jsLevel > 0) {
    _fireJumpscare(jsLevel, el.id);
    _slasherAudioFireScream();
    if (jsLevel >= 2) _slasherAudioFireStinger(2);
  }

  // Fire audio based on event type
  const evtType = el.dataset.evttype || '';
  if (evtType === 'caught' && jsLevel === 0) {
    _slasherAudioFireStatic();
    _slasherAudioFireHeartbeat();
  } else if (evtType === 'horror-beat') {
    if (Math.random() < 0.5) _slasherAudioFireCreak();
    else _slasherAudioFireChainsaw();
  } else if (evtType === 'event') {
    const pts = parseInt(el.dataset.points || '0');
    if (pts < 0) _slasherAudioFireHeartbeat();
    else if (pts > 0 && Math.random() < 0.3) _slasherAudioFireTension();
  }

  // Check if next item exists — if not, update button
  const nextNext = document.getElementById(`sl-item-${stateKey}-${next + 1}`);
  if (!nextNext) {
    const btn = document.getElementById(`sl-next-${stateKey}`);
    if (btn) btn.textContent = '→ CONTINUE';
  }
}

// Keep old scene-level reveal functions for backward compat
export function slasherRevealNextScene(stateKey, totalScenes, prefix) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const next = _tvState[stateKey].revealed + 1;
  if (next >= totalScenes) return;
  const el = document.getElementById(`${prefix}${stateKey}-${next}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    _slasherAudioFireRewind();
  }
  _tvState[stateKey].revealed = next;
}

export function slasherRevealAllScenes(stateKey, totalScenes, prefix) {
  for (let i = 0; i < totalScenes; i++) {
    const el = document.getElementById(`${prefix}${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  if (_tvState[stateKey]) _tvState[stateKey].revealed = totalScenes - 1;
}

// Legacy backward-compat alias (old saves without actBreaks)
export function rpBuildSlasherAnnouncement(ep) { return rpBuildSlasherTitleCard(ep); }

export function rpBuildSlasherRounds(ep) {
  const sn = ep.slasherNight;
  if (!sn || !sn.rounds?.length) return '';
  const stateKey = String(ep.num) + '_slasher';
  // Initialize reveal state — round 0 (first round) is already visible
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const totalRounds = sn.rounds.length;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">The Hunt</div>
    <div id="sl-rounds-${stateKey}" style="margin-top:16px">`;

  sn.rounds.forEach((round, ri) => {
    const isHidden = ri > 0 ? 'style="display:none"' : '';
    html += `<div class="sl-round-block" id="sl-round-${stateKey}-${ri}" ${isHidden}>
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#da3633;text-transform:uppercase;margin:20px 0 12px;border-top:1px solid #21262d;padding-top:16px">
        Round ${round.num} &mdash; ${round.remaining?.length || round.survivorCount || '?'} players remain
      </div>`;

    // Events as cards
    if (round.events?.length) {
      round.events.forEach(evt => {
        const pts = evt.points || 0;
        const ptColor = pts >= 0 ? '#3fb950' : '#f85149';
        const ptBg = pts >= 0 ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)';
        const ptSign = pts >= 0 ? '+' : '';
        html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px">
          ${rpPortrait(evt.player, 'sm')}
          <div style="flex:1;font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
          <span style="font-size:13px;font-weight:700;padding:3px 10px;border-radius:12px;background:${ptBg};color:${ptColor};white-space:nowrap">${ptSign}${pts}</span>
        </div>`;
      });
    }

    // Caught players
    if (round.caught?.length) {
      round.caught.forEach(c => {
        html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px;border-color:rgba(218,54,51,0.4);background:rgba(218,54,51,0.06)">
          ${rpPortrait(c.name, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${c.sceneText || c.name + ' was caught.'}</div>
          </div>
          <span class="rp-brant-badge red">CAUGHT</span>
        </div>`;
      });
    }

    // Atmosphere
    if (round.atmosphere) {
      html += `<div style="font-size:12px;color:#484f58;font-style:italic;text-align:center;margin:12px 0 8px;line-height:1.6">${round.atmosphere}</div>`;
    }

    // Running scores at bottom of each round
    // Reconstruct cumulatively: each player's score is their caught-round score (frozen)
    // or a running total of events + survival bonus up to this round
    const scoresUpToRound = {};
    const _allNames = sn.rounds[0]?.remaining || sn.leaderboard?.map(e => e.name) || [];
    _allNames.forEach(n => { scoresUpToRound[n] = 0; });
    const _caughtAt = {}; // { name: round } — when each player was caught
    for (let r = 0; r <= ri; r++) {
      const rd = sn.rounds[r];
      // Mark caught players this round
      const _caughtThisRound = new Set((rd.caught || []).map(c => c.name));
      // Survival bonus only for players who SURVIVE this round (not caught)
      (rd.remaining || []).forEach(n => {
        if (_caughtAt[n] != null) return; // caught in previous round
        if (_caughtThisRound.has(n)) return; // caught THIS round — no survival bonus
        scoresUpToRound[n] = (scoresUpToRound[n] || 0) + SLASHER_ROUND_SURVIVAL_BONUS;
      });
      // Event points for players alive this round (including those about to be caught — events happened)
      (rd.events || []).forEach(evt => {
        if (_caughtAt[evt.player] != null) return; // caught in previous round
        scoresUpToRound[evt.player] = (scoresUpToRound[evt.player] || 0) + (evt.points || 0);
      });
      _caughtThisRound.forEach(n => { if (_caughtAt[n] == null) _caughtAt[n] = r; });
    }
    const scoreSorted = Object.entries(scoresUpToRound).sort(([,a],[,b]) => b - a);
    if (scoreSorted.length) {
      html += `<div style="margin-top:14px;padding:10px;border-radius:8px;background:rgba(139,148,158,0.06);border:1px solid #21262d">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:8px">RUNNING SCORES</div>`;
      scoreSorted.forEach(([name, score]) => {
        const isCaught = sn.caughtOrder?.includes(name) && sn.rounds.slice(0, ri + 1).some(r => (r.caught || []).some(c => c.name === name));
        const color = isCaught ? '#484f58' : (score >= 0 ? '#3fb950' : '#f85149');
        html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;${isCaught ? 'opacity:0.5;' : ''}">
          <span style="font-size:11px;color:#8b949e;width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
          <span style="font-size:12px;font-weight:700;color:${color}">${score >= 0 ? '+' : ''}${score}</span>
          ${isCaught ? '<span style="font-size:9px;color:#da3633;font-weight:700;letter-spacing:1px">CAUGHT</span>' : ''}
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`; // end sl-round-block
  });

  html += `</div>`; // end sl-rounds container

  // Reveal controls
  html += `<div style="text-align:center;margin-top:20px">
    <button class="tv-reveal-btn" id="sl-btn-${stateKey}" onclick="slasherRevealNextRound('${stateKey}', ${totalRounds})"${totalRounds <= 1 ? ' style="display:none"' : ''}>Reveal Round (2/${totalRounds})</button>
    <div>
      <button onclick="slasherRevealAllRounds('${stateKey}', ${totalRounds})" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to all rounds &rsaquo;</button>
    </div>
  </div>`;

  html += `</div>`; // end rp-page
  return html;
}

export function slasherRevealNextRound(stateKey, totalRounds) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const state = _tvState[stateKey];
  const nextIdx = state.revealed + 1;
  if (nextIdx >= totalRounds) return;
  const el = document.getElementById('sl-round-' + stateKey + '-' + nextIdx);
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  state.revealed = nextIdx;
  const btn = document.getElementById('sl-btn-' + stateKey);
  if (nextIdx >= totalRounds - 1) {
    if (btn) btn.style.display = 'none';
  } else {
    if (btn) btn.textContent = 'Reveal Round (' + (nextIdx + 2) + '/' + totalRounds + ')';
  }
}

export function slasherRevealAllRounds(stateKey, totalRounds) {
  for (let i = 0; i < totalRounds; i++) {
    const el = document.getElementById('sl-round-' + stateKey + '-' + i);
    if (el) el.style.display = 'block';
  }
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  _tvState[stateKey].revealed = totalRounds - 1;
  const btn = document.getElementById('sl-btn-' + stateKey);
  if (btn) btn.style.display = 'none';
}

export function rpBuildSlasherShowdown(ep) {
  const sn = ep.slasherNight;
  const sd = sn?.finalShowdown;
  if (!sd) return '';
  const winner = sd.winner;
  const loser = sd.loser;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Final Showdown</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:30px 0">
      <div style="text-align:center">
        ${rpPortrait(winner, 'xl')}
      </div>
      <div style="font-family:var(--font-display);font-size:36px;color:#da3633;text-shadow:0 0 12px rgba(218,54,51,0.4)">VS</div>
      <div style="text-align:center">
        ${rpPortrait(loser, 'xl')}
      </div>
    </div>`;

  // Winner method
  html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.3);background:rgba(63,185,80,0.05);margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:12px">
      ${rpPortrait(winner, 'sm')}
      <div style="flex:1">
        <div style="font-size:13px;color:#e6edf3;font-weight:700;margin-bottom:4px">${winner}</div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${sd.winText || sd.winMethod || 'Outlasted the competition.'}</div>
      </div>
      <span class="rp-brant-badge green">IMMUNITY</span>
    </div>
  </div>`;

  // Loser method
  html += `<div class="vp-card" style="border-color:rgba(218,54,51,0.3);background:rgba(218,54,51,0.05);margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:12px">
      ${rpPortrait(loser, 'sm')}
      <div style="flex:1">
        <div style="font-size:13px;color:#e6edf3;font-weight:700;margin-bottom:4px">${loser}</div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${sd.loseText || sd.loseMethod || 'Was caught by the slasher.'}</div>
      </div>
      <span class="rp-brant-badge red">CAUGHT</span>
    </div>
  </div>`;

  // Shield push — bond damage
  if (sd.shieldPush) {
    html += `<div class="vp-card" style="border-color:rgba(218,54,51,0.5);background:rgba(218,54,51,0.08);margin-bottom:12px">
      <div style="font-size:12px;color:#f85149;line-height:1.6;text-align:center;font-weight:700">
        Shield Push &mdash; ${winner} shoved ${loser} toward the slasher to escape. Bond damaged.
      </div>
    </div>`;
  }

  // Heroic sacrifice
  if (sd.heroicSacrifice) {
    html += `<div class="vp-card" style="border-color:rgba(227,179,65,0.5);background:rgba(227,179,65,0.08);margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px">
        ${rpPortrait(loser, 'sm')}
        <div style="text-align:center">
          <span class="rp-brant-badge gold">LEGENDARY EXIT</span>
          <div style="font-size:12px;color:#e3b341;margin-top:6px;line-height:1.6">${loser} sacrificed themselves so ${winner} could escape. Bond boosted.</div>
        </div>
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildSlasherImmunity(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const winner = sn.immunityWinner;
  if (!winner) return '';

  // Gather best moments (positive events for the winner)
  const bestMoments = [];
  (sn.rounds || []).forEach(round => {
    (round.events || []).forEach(evt => {
      if (evt.player === winner && (evt.points || 0) > 0) {
        bestMoments.push(evt);
      }
    });
  });
  bestMoments.sort((a, b) => (b.points || 0) - (a.points || 0));
  const topMoments = bestMoments.slice(0, 3);

  const sd = sn.finalShowdown;
  const winDesc = sd?.winText || sd?.winMethod || 'Outlasted everyone in the darkness.';

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title">Immunity Winner</div>
    <div style="text-align:center;margin:24px 0">
      ${rpPortrait(winner, 'xl', '<span class="rp-brant-badge gold" style="font-size:10px">IMMUNITY</span>')}
    </div>
    <div style="text-align:center;font-size:16px;color:#e6edf3;font-weight:700;margin-bottom:8px">${winner}</div>
    <div style="text-align:center;font-size:11px;color:#8b949e;margin-bottom:20px">${vpArchLabel(winner)}</div>
    <div class="vp-card" style="text-align:center;max-width:420px;margin:0 auto 20px">
      <div style="font-size:13px;color:#cdd9e5;line-height:1.7">${winDesc}</div>
    </div>`;

  if (topMoments.length) {
    html += `<div style="max-width:420px;margin:0 auto">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:10px;text-align:center">BEST MOMENTS</div>`;
    topMoments.forEach(m => {
      html += `<div class="vp-card" style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:6px">
        <div style="flex:1;font-size:12px;color:#cdd9e5;line-height:1.5">${m.text}</div>
        <span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(63,185,80,0.15);color:#3fb950">+${m.points}</span>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildSlasherElimination(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const elim = sn.eliminated;
  if (!elim) return '';

  const quote = vpGenerateQuote(elim, ep, 'eliminated');
  const finalScore = sn.scores?.[elim] ?? 0;

  // Find negative events for this player
  const negEvents = [];
  (sn.rounds || []).forEach(round => {
    (round.events || []).forEach(evt => {
      if (evt.player === elim && (evt.points || 0) < 0) {
        negEvents.push(evt);
      }
    });
  });

  // Find next-lowest score
  const lb = sn.leaderboard || [];
  const elimIdx = lb.findIndex(e => e.name === elim);
  const nextLowest = elimIdx > 0 ? lb[elimIdx - 1] : null;

  // When was this player caught?
  let caughtRound = null;
  (sn.rounds || []).forEach(round => {
    if ((round.caught || []).some(c => c.name === elim)) caughtRound = round.num;
  });

  // Placement
  const placement = ep.gsSnapshot?.activePlayers
    ? (ep.gsSnapshot.activePlayers.length + (gs.jury?.includes(elim) ? 0 : 1))
    : '?';

  let html = `<div class="rp-page tod-deepnight" style="--page-accent:#da3633">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Eliminated</div>
    <div class="rp-elim" style="margin:20px 0">
      <div class="rp-elim-eyebrow">Slasher Night &mdash; ${ordinal(placement)} place</div>
      ${rpPortrait(elim, 'xl elim')}
      <div class="rp-elim-name">${elim}</div>
      <div class="rp-elim-arch">${vpArchLabel(elim)}</div>
      <div class="rp-elim-quote">"${quote}"</div>
      <div class="rp-elim-place">Eliminated &mdash; Episode ${ep.num}</div>
    </div>`;

  // WHY THEY DIDN'T SURVIVE section
  html += `<div style="margin-top:28px;border-top:1px solid #21262d;padding-top:20px">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">=== WHY THEY DIDN'T SURVIVE ===</div>`;

  const whyBullets = [];
  if (negEvents.length) {
    negEvents.forEach(evt => {
      whyBullets.push(evt.text + ' <span style="color:#f85149;font-weight:700">(' + evt.points + ')</span>');
    });
  } else {
    whyBullets.push('Failed to score enough points to stay ahead.');
  }
  if (caughtRound) {
    whyBullets.push('Caught by the slasher in round ' + caughtRound + '.');
  }
  if (nextLowest) {
    const _nlScore = sn.scores?.[nextLowest.name] ?? nextLowest.score ?? 0;
    const diff = _nlScore - finalScore;
    whyBullets.push('Final score: <span style="color:#f85149;font-weight:700">' + finalScore + '</span> vs next-lowest ' + nextLowest.name + ' at <span style="color:#8b949e">' + _nlScore + '</span>' + (diff > 0 ? ' (' + diff + ' points short)' : '') + '.');
  } else {
    whyBullets.push('Final score: <span style="color:#f85149;font-weight:700">' + finalScore + '</span> &mdash; dead last.');
  }

  html += `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:14px">
    ${rpPortrait(elim, 'elim')}
    <div style="flex:1">
      ${whyBullets.map(b => '<div style="font-size:12px;color:#cdd9e5;line-height:1.7;margin-bottom:5px;display:flex;gap:8px;align-items:flex-start"><span style="color:#484f58;flex-shrink:0;margin-top:1px">&#x2014;</span><span>' + b + '</span></div>').join('')}
    </div>
  </div>`;

  html += `</div>`; // end why section

  // Torch snuff
  html += `<div id="torch-snuff-sl-${ep.num}" style="text-align:center;margin-top:24px">
    <div class="torch-snuffed">${rpPortrait(elim, 'xl')}</div>
    <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The night has spoken.</div>
  </div>`;

  html += `</div>`; // end rp-page

  // Fire torch snuff on screen enter
  setTimeout(() => {
    const snuffEl = document.querySelector('#torch-snuff-sl-' + ep.num + ' .torch-snuffed');
    if (snuffEl && typeof torchSnuffFx === 'function') torchSnuffFx(snuffEl);
  }, 600);

  return html;
}

export function rpBuildSlasherLeaderboard(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const lb = sn.leaderboard || [];
  if (!lb.length) return '';

  // Use sn.scores as source of truth for display (leaderboard entry.score may be stale)
  const _slScores = sn.scores || {};
  const maxScore = Math.max(...lb.map(e => Math.abs(_slScores[e.name] ?? e.score ?? 0)), 1);
  const containerId = 'sl-leaderboard-' + ep.num;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Slasher Night Leaderboard</div>
    <div id="${containerId}" style="margin-top:20px;max-width:520px;margin-left:auto;margin-right:auto">`;

  lb.forEach((entry, idx) => {
    const score = (sn.scores && sn.scores[entry.name] != null) ? sn.scores[entry.name] : (entry.score || 0);
    const isElim = entry.name === sn.eliminated;
    const isWinner = entry.name === sn.immunityWinner;
    const barPct = Math.max(5, Math.round((Math.abs(score) / maxScore) * 100));
    const barColor = score >= 0 ? '#3fb950' : '#f85149';
    const barBg = score >= 0 ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)';

    // Status label
    let statusLabel = '';
    if (isWinner) {
      statusLabel = '<span class="rp-brant-badge gold" style="font-size:9px;padding:2px 6px">Last Standing</span>';
    } else if (isElim) {
      statusLabel = '<span class="rp-brant-badge red" style="font-size:9px;padding:2px 6px">ELIMINATED</span>';
    } else {
      // Find caught round
      let cr = null;
      (sn.rounds || []).forEach(r => { if ((r.caught || []).some(c => c.name === entry.name)) cr = r.num; });
      if (cr) statusLabel = '<span style="font-size:10px;color:#da3633">Caught R' + cr + '</span>';
    }

    const rowBg = isElim ? 'rgba(218,54,51,0.08)' : (isWinner ? 'rgba(227,179,65,0.06)' : 'rgba(139,148,158,0.04)');
    const rowBorder = isElim ? 'rgba(218,54,51,0.3)' : (isWinner ? 'rgba(227,179,65,0.2)' : '#21262d');
    const scoreSign = score >= 0 ? '+' : '-';

    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;border-radius:8px;background:${rowBg};border:1px solid ${rowBorder}">
      <span style="font-size:12px;color:#484f58;font-weight:700;width:22px;text-align:right">${idx + 1}.</span>
      ${rpPortrait(entry.name, 'sm')}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:13px;color:#e6edf3;font-weight:700">${entry.name}</span>
          ${statusLabel}
        </div>
        <div style="position:relative;height:14px;background:${barBg};border-radius:7px;overflow:hidden">
          <div class="sl-score-bar" style="position:absolute;left:0;top:0;height:100%;width:0;background:${barColor};border-radius:7px;transition:width 0.8s ease ${idx * 0.15}s" data-target-width="${barPct}%"></div>
        </div>
      </div>
      <span style="font-size:14px;font-weight:800;color:${barColor};min-width:36px;text-align:right">${score >= 0 ? '+' : ''}${score}</span>
    </div>`;
  });

  html += `</div>
  </div>`;

  // Animation triggered by renderVPScreen when this screen becomes active

  return html;
}


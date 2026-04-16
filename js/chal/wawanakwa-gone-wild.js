// js/chal/wawanakwa-gone-wild.js — Wawanakwa Gone Wild! animal hunt challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── ANIMAL POOL ──
const ANIMALS = {
  easy: [
    {
      id: 'chipmunk', name: 'Chipmunk', tier: 'easy',
      statWeights: { physical: 0.04, intuition: 0.03, boldness: 0.02 },
      mishapWeight: 0.35,
      draw: {
        happy: [
          (n, pr) => `${n} pulls the slip. Chipmunk. ${pr.Sub} ${pr.sub==='they'?'grin':'grins'}. "I got this."`,
          (n, pr) => `"Chipmunk?" ${n} looks relieved. "How hard can it be?"`,
        ],
        nervous: [
          (n, pr) => `${n} reads the slip. Chipmunk. Small, fast, probably angry. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} uncertain.`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} corners the chipmunk against a tree stump and scoops it into the sack. It bites ${pr.posAdj} thumb on the way in. Worth it.`,
        (n, pr) => `The chipmunk freezes. ${n} doesn't. One dive, one grab, one furious ball of fur in a bag.`,
        (n, pr) => `${n} lures it with a trail of crumbs, waits, and — got it. The chipmunk screams the whole way to camp.`,
      ],
      attemptFail: [
        (n, pr) => `${n} lunges. The chipmunk sidesteps like a matador. ${pr.Sub} ${pr.sub==='they'?'eat':'eats'} dirt.`,
        (n, pr) => `The chipmunk runs up ${pr.posAdj} arm, across ${pr.posAdj} face, and back down the tree. ${n} has nothing.`,
        (n, pr) => `${n} grabs air. The chipmunk chitters from a branch, almost laughing.`,
      ],
      mishap: [
        (n, pr) => `${n} climbs the tree to reach the chipmunk. The branch snaps. ${pr.Sub} ${pr.sub==='they'?'fall':'falls'} ten feet and lands flat on ${pr.posAdj} back.`,
        (n, pr) => `The chipmunk bites ${pr.posAdj} nose. ${n} screams, stumbles backward into a bush, and startles a skunk.`,
      ],
    },
    {
      id: 'frog', name: 'Frog', tier: 'easy',
      statWeights: { intuition: 0.04, mental: 0.03, endurance: 0.02 },
      mishapWeight: 0.30,
      draw: {
        happy: [
          (n, pr) => `${n} draws Frog. ${pr.Sub} ${pr.sub==='they'?'shrug':'shrugs'}. "A frog. Fine."`,
        ],
        nervous: [
          (n, pr) => `"Frog." ${n} stares at the slip. "They're... slimy, right?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} waits by the pond. The frog hops onto a lily pad. One scoop with the bucket — done.`,
        (n, pr) => `Patience pays off. ${n} traps the frog under ${pr.posAdj} hat and slides it into the bucket.`,
      ],
      attemptFail: [
        (n, pr) => `The frog leaps. ${n} lunges. ${pr.Sub} ${pr.sub==='they'?'land':'lands'} face-first in the mud. The frog is three lily pads away.`,
        (n, pr) => `${n} grabs the frog. It squirts out of ${pr.posAdj} hands like soap. Gone.`,
      ],
      mishap: [
        (n, pr) => `${n} chases the frog into a puddle. The puddle is waist-deep. ${pr.Sub} ${pr.sub==='they'?'are':'is'} stuck.`,
        (n, pr) => `${n} slips on the muddy bank and slides into the pond. The frog watches from dry land.`,
      ],
    },
    {
      id: 'rabbit', name: 'Rabbit', tier: 'easy',
      statWeights: { physical: 0.03, intuition: 0.04, mental: 0.02 },
      mishapWeight: 0.25,
      draw: {
        happy: [
          (n, pr) => `${n} draws Rabbit. "Bunnies are cute! This'll be fun!"`,
        ],
        nervous: [
          (n, pr) => `${n} reads: Rabbit. "Those things are fast, right?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} sets a snare with some lettuce. The rabbit hops right in. Easy.`,
        (n, pr) => `${n} herds the rabbit toward a dead end and scoops it up. It kicks but doesn't escape.`,
      ],
      attemptFail: [
        (n, pr) => `The rabbit zigzags. ${n} can't keep up. It disappears into a burrow.`,
        (n, pr) => `${n} reaches into the hole and gets nothing but dirt under ${pr.posAdj} nails.`,
      ],
      mishap: [
        (n, pr) => `${n} reaches into the burrow. Something bites — but it's not the rabbit. ${pr.Sub} ${pr.sub==='they'?'pull':'pulls'} out ${pr.posAdj} hand with a very angry gopher attached.`,
      ],
    },
  ],
  medium: [
    {
      id: 'duck', name: 'Duck', tier: 'medium',
      statWeights: { mental: 0.04, intuition: 0.03, strategic: 0.02 },
      mishapWeight: 0.40,
      draw: {
        happy: [
          (n, pr) => `${n} draws Duck. "A duck? I can outsmart a duck."`,
        ],
        nervous: [
          (n, pr) => `"Duck." ${n} reads it twice. "Last time I checked, ducks waddled. This one sprints."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} lays out a trail of bait. The duck waddles in. ${pr.Sub} ${pr.sub==='they'?'slam':'slams'} the cage door. Finally.`,
        (n, pr) => `The duck gets distracted by its own reflection. ${n} doesn't waste the opening.`,
      ],
      attemptFail: [
        (n, pr) => `The duck sees ${n}, sticks out its tongue, and sprints away like a roadrunner. ${pr.Sub} ${pr.sub==='they'?'stand':'stands'} there in disbelief.`,
        (n, pr) => `${n} dives. The duck dodges. ${n} gets a face full of feathers and nothing else.`,
      ],
      mishap: [
        (n, pr) => `The duck leads ${n} on a three-mile chase around the entire island. ${pr.Sub} ${pr.sub==='they'?'come':'comes'} back soaked, muddy, and duckless.`,
        (n, pr) => `${n} corners the duck near the dock. The duck quacks once and flies away. ${n} didn't know it could fly.`,
      ],
    },
    {
      id: 'raccoon', name: 'Raccoon', tier: 'medium',
      statWeights: { boldness: 0.04, physical: 0.03, endurance: 0.02 },
      mishapWeight: 0.50,
      draw: {
        happy: [
          (n, pr) => `${n} draws Raccoon. ${pr.Sub} ${pr.sub==='they'?'crack':'cracks'} ${pr.posAdj} knuckles. "Bring it."`,
        ],
        nervous: [
          (n, pr) => `"Raccoon?" ${n} goes pale. "Those things have thumbs."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} finds the raccoon rummaging through trash. One net toss — clean capture.`,
        (n, pr) => `${n} bribes the raccoon with garbage. While it eats, ${pr.sub} ${pr.sub==='they'?'bag':'bags'} it. Feral but effective.`,
      ],
      attemptFail: [
        (n, pr) => `The raccoon hisses. ${n} backs up. The raccoon advances. ${n} backs up faster.`,
        (n, pr) => `${n} grabs the raccoon. It grabs back. Both let go. Stalemate.`,
      ],
      mishap: [
        (n, pr) => `A second raccoon appears. Then a third. Then seven more. They stack on top of each other like a furry transformer. ${n} runs.`,
        (n, pr) => `The raccoon climbs onto ${pr.posAdj} head and refuses to leave. ${n} can't get it off. The raccoon is winning.`,
        (n, pr) => `${n} tries to grab the raccoon. The raccoon grabs ${pr.posAdj} gear instead and bolts into the woods.`,
      ],
    },
    {
      id: 'goose', name: 'Goose', tier: 'medium',
      statWeights: { boldness: 0.04, physical: 0.02, endurance: 0.03 },
      mishapWeight: 0.45,
      draw: {
        happy: [
          (n, pr) => `${n} draws Goose. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around nervously. "How bad can a goose be?"`,
        ],
        nervous: [
          (n, pr) => `"Goose." ${n}'s face drops. Everyone who grew up near a pond knows what that means.`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} gets behind the goose and herds it into the cage with a blanket. The goose honks in fury the entire way.`,
        (n, pr) => `${n} feeds the goose bread until it's docile enough to grab. ${pr.Sub} ${pr.sub==='they'?'move':'moves'} fast.`,
      ],
      attemptFail: [
        (n, pr) => `The goose charges. ${n} retreats. It's not even close — the goose is in control.`,
        (n, pr) => `${n} reaches for the goose. The goose reaches for ${pr.posAdj} hand. ${n} has no goose and a new bruise.`,
      ],
      mishap: [
        (n, pr) => `The goose chases ${n} across camp. ${pr.Sub} ${pr.sub==='they'?'are':'is'} screaming. Everyone is watching. Nobody helps.`,
        (n, pr) => `${n} tries to grab the goose from behind. It spins and bites ${pr.posAdj} ear. The honking echoes across the lake.`,
      ],
    },
  ],
  hard: [
    {
      id: 'beaver', name: 'Beaver', tier: 'hard',
      statWeights: { endurance: 0.04, physical: 0.04, boldness: 0.02 },
      mishapWeight: 0.45,
      draw: {
        happy: [
          (n, pr) => `${n} draws Beaver. "I'll just go to the dam, right?" ${pr.Sub} ${pr.sub==='they'?'have':'has'} no idea.`,
        ],
        nervous: [
          (n, pr) => `"Beaver." ${n} reads it again. "Those things chew through trees."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} swims under the dam and finds the beaver. One burlap sack later, it's done. Muddy, but done.`,
        (n, pr) => `${n} lures the beaver out with a branch and wrestles it into the bag. It slaps ${pr.obj} with its tail twice. Still counts.`,
      ],
      attemptFail: [
        (n, pr) => `${n} dives under the dam. A beaver family slaps ${pr.obj} with their tails and sends ${pr.obj} tumbling out.`,
        (n, pr) => `The beaver ignores all bait. It's busy building. ${n} has never felt more disrespected by a rodent.`,
      ],
      mishap: [
        (n, pr) => `${n} enters the beaver lodge. The beavers are sitting at a dinner table. They hit ${pr.obj} with their tails until ${pr.sub} ${pr.sub==='they'?'leave':'leaves'}.`,
        (n, pr) => `${n} brings back the entire beaver dam. It weighs 200 pounds. ${pr.Sub} ${pr.sub==='they'?'are':'is'} exhausted and soaking wet.`,
      ],
    },
    {
      id: 'deer', name: 'Deer', tier: 'hard',
      statWeights: { intuition: 0.04, endurance: 0.03, mental: 0.03 },
      mishapWeight: 0.35,
      draw: {
        happy: [
          (n, pr) => `${n} draws Deer. ${pr.Sub} ${pr.sub==='they'?'grin':'grins'}. "Hunting season."`,
        ],
        nervous: [
          (n, pr) => `"Deer." ${n} turns the slip over. "How do you even catch a deer without a truck?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} tracks the deer for an hour, finds it at a clearing, and approaches slow enough to loop the rope around its neck.`,
        (n, pr) => `${n} uses the antler decoy to get close. The deer investigates. One net throw — clean.`,
      ],
      attemptFail: [
        (n, pr) => `${n} steps on a branch. The deer vanishes into the trees in half a second. Gone.`,
        (n, pr) => `${n} gets close — close enough to see the deer's eyes — and it bolts. The forest swallows it whole.`,
      ],
      mishap: [
        (n, pr) => `${n} gets tangled in ${pr.posAdj} own rope while chasing the deer. The deer watches ${pr.obj} struggle from a safe distance.`,
        (n, pr) => `${n} follows deer tracks for 45 minutes. The tracks loop back to where ${pr.sub} started. The deer is smarter than ${pr.obj}.`,
      ],
    },
    {
      id: 'snake', name: 'Snake', tier: 'hard',
      statWeights: { boldness: 0.05, intuition: 0.03, mental: 0.02 },
      mishapWeight: 0.40,
      draw: {
        happy: [
          (n, pr) => `${n} draws Snake. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} flinch. "I'm not scared of snakes."`,
        ],
        nervous: [
          (n, pr) => `"SNAKE?!" ${n}'s voice cracks. The slip shakes in ${pr.posAdj} hand.`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} pins the snake with a forked stick and slides it into the bag in one motion. Textbook.`,
        (n, pr) => `${n} grabs it behind the head. The snake writhes. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} let go.`,
      ],
      attemptFail: [
        (n, pr) => `The snake slithers under a rock. ${n} reaches in. The snake hisses. ${n} does not reach in again.`,
        (n, pr) => `${n} gets close. The snake coils. Neither moves. ${n} blinks first.`,
      ],
      mishap: [
        (n, pr) => `${n} grabs what ${pr.sub} ${pr.sub==='they'?'think':'thinks'} is the snake. It's a stick. The real snake is on ${pr.posAdj} boot.`,
        (n, pr) => `The snake wraps around ${pr.posAdj} arm. ${n} freezes. Everyone watching freezes. The snake eventually gets bored and leaves.`,
      ],
    },
  ],
  extreme: [
    {
      id: 'bear', name: 'Bear', tier: 'extreme',
      statWeights: { boldness: 0.05, physical: 0.03, strategic: 0.03 },
      mishapWeight: 0.60,
      draw: {
        happy: [
          (n, pr) => `${n} draws Bear. The lodge goes silent. ${pr.Sub} ${pr.sub==='they'?'stare':'stares'} at the slip. "...You're joking."`,
        ],
        nervous: [
          (n, pr) => `"BEAR?!" ${n} holds the slip up like it personally offended ${pr.obj}. "I'm supposed to catch a BEAR?!"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} lures the bear with garbage, leads it all the way to camp, and traps it in the cage. ${pr.Sub} ${pr.sub==='they'?'are':'is'} shaking the entire time.`,
        (n, pr) => `Against all odds, ${n} herds the bear into the cage using nothing but nerve and a trail of fish. ${pr.Sub} ${pr.sub==='they'?'collapse':'collapses'} afterward.`,
      ],
      attemptFail: [
        (n, pr) => `The bear roars. ${n} runs. There is no strategy here. Just survival.`,
        (n, pr) => `${n} approaches the den. The roar from inside sends ${pr.obj} sprinting back to camp.`,
        (n, pr) => `${n} tries to bait the bear. The bear eats the bait and ignores ${pr.obj} entirely.`,
      ],
      mishap: [
        (n, pr) => `${n} enters the bear's den. The bear is home. ${n} sets a new camp speed record getting back.`,
        (n, pr) => `The bear chases ${n} up a tree. ${pr.Sub} ${pr.sub==='they'?'are':'is'} stuck there for twenty minutes before it loses interest.`,
        (n, pr) => `${n} tries the garbage trick. The bear eats the garbage, then looks at ${n}. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} wait to find out what happens next.`,
      ],
    },
    {
      id: 'moose', name: 'Moose', tier: 'extreme',
      statWeights: { endurance: 0.04, boldness: 0.04, physical: 0.03 },
      mishapWeight: 0.55,
      draw: {
        happy: [
          (n, pr) => `${n} draws Moose. "How big can it be?" Famous last words.`,
        ],
        nervous: [
          (n, pr) => `"Moose." ${n} looks around for the hidden camera. "That's a joke, right?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} finds the moose at the lake. After an hour of slow coaxing, it follows ${pr.obj} back to camp like a confused dog.`,
        (n, pr) => `${n} ropes the moose. The moose drags ${pr.obj} halfway across camp before finally going into the pen.`,
      ],
      attemptFail: [
        (n, pr) => `The moose looks at ${n}. ${n} looks at the moose. The moose charges. ${n} dodges. Barely.`,
        (n, pr) => `${n} gets the rope around the moose's neck. The moose walks the other direction. ${n} is dragged through mud.`,
      ],
      mishap: [
        (n, pr) => `The moose sits down. ${n} pushes. The moose does not move. ${n} pushes harder. The moose still does not move.`,
        (n, pr) => `${n} gets too close. The moose kicks. ${pr.Sub} ${pr.sub==='they'?'fly':'flies'} ten feet and lands in a bush.`,
      ],
    },
  ],
};

// ── GEAR POOL ──
const GEAR_POOL = [
  { id:'net',        name:'fishing net',          tier:'useful',  captureBonus: 0.08, special: null },
  { id:'rope',       name:'rope with a hook',     tier:'useful',  captureBonus: 0.06, special: null },
  { id:'bait',       name:'animal bait',          tier:'useful',  captureBonus: 0.10, special: null },
  { id:'sack',       name:'burlap sack',          tier:'useful',  captureBonus: 0.05, special: null },
  { id:'crate',      name:'wooden crate',         tier:'useful',  captureBonus: 0.07, special: null },
  { id:'cage',       name:'small cage trap',       tier:'useful',  captureBonus: 0.09, special: null },
  { id:'camouflage', name:'camo tarp',            tier:'useful',  captureBonus: 0.06, special: null },
  { id:'antlers',    name:'deer antlers',          tier:'useful',  captureBonus: 0.04, special: 'deer-disguise' },
  { id:'tranq-gun',  name:'tranquilizer gun',      tier:'chaotic', captureBonus: 0.12, special: 'tranq-chaos' },
  { id:'smoke-bomb', name:'smoke bomb',            tier:'chaotic', captureBonus: 0.03, special: 'smoke-escape' },
  { id:'chainsaw',   name:'chainsaw',              tier:'chaotic', captureBonus: -0.05, special: 'intimidation' },
  { id:'megaphone',  name:'megaphone',             tier:'chaotic', captureBonus: -0.08, special: 'scare-animal' },
  { id:'rubber-chicken', name:'rubber chicken',     tier:'junk', captureBonus: -0.05, special: null },
  { id:'paper-towels',   name:'roll of paper towels', tier:'junk', captureBonus: -0.03, special: null },
  { id:'life-preserver',  name:'lifeguard float',    tier:'junk', captureBonus: -0.04, special: null },
  { id:'broken-oar',     name:'broken oar',          tier:'junk', captureBonus: -0.02, special: null },
  { id:'shark-jaw',      name:'shark jawbone',        tier:'junk', captureBonus: -0.06, special: null },
];

// ── HUNT EVENT POOL ──
const HUNT_EVENTS = [
  { id:'help-ally',       weight: 0.7, niceOnly: true },
  { id:'sabotage-rival',  weight: 0.6, villainsOnly: true },
  { id:'alliance-offer',  weight: 0.5, villainsOnly: true },
  { id:'steal-gear',      weight: 0.4, villainsOnly: true },
  { id:'showmance-moment', weight: 0.5 },
  { id:'animal-encounter', weight: 0.8 },
  { id:'taunt',           weight: 0.4, villainsOnly: true },
  { id:'encourage',       weight: 0.5, niceOnly: true },
  { id:'rivalry-clash',   weight: 0.4 },
  { id:'discovery',       weight: 0.3 },
];

// ── HUNT EVENT TEXT POOLS ──
const WW_HELP_TEXTS = [
  (helper, target, hPr, tPr) => `${helper} sees ${target} struggling and walks over. "Here, try this." ${hPr.Sub} ${hPr.sub==='they'?'hand':'hands'} over ${hPr.posAdj} gear.`,
  (helper, target, hPr, tPr) => `${helper} spots ${target}'s animal and herds it toward ${tPr.obj}. "You owe me one."`,
  (helper, target, hPr, tPr) => `Without being asked, ${helper} helps ${target} set up a trap. ${tPr.Sub} ${tPr.sub==='they'?'are':'is'} surprised — and grateful.`,
];

const WW_SABOTAGE_TEXTS = {
  success: [
    (sab, target, sPr, tPr) => `${sab} releases ${target}'s animal from the trap when ${tPr.sub} ${tPr.sub==='they'?'aren\'t':'isn\'t'} looking. Back to square one.`,
    (sab, target, sPr, tPr) => `${sab} scatters ${target}'s bait across the woods. Hours of work, wasted.`,
  ],
  caught: [
    (sab, target, sPr, tPr) => `${sab} tries to sabotage ${target}'s trap — but ${target} catches ${sPr.obj} in the act. "What are you DOING?!"`,
    (sab, target, sPr, tPr) => `${sab} gets caught messing with ${target}'s gear. The look on ${target}'s face says everything.`,
  ],
};

const WW_ALLIANCE_TEXTS = {
  offer: [
    (offerer, target, oPr, tPr) => `${offerer} approaches ${target}. "Listen. You need help with that animal. I need someone watching my back at tribal. Deal?"`,
    (offerer, target, oPr, tPr) => `${offerer} corners ${target} behind the boathouse. "Alliance. You and me, final two. I help you catch that thing. What do you say?"`,
  ],
  accept: [
    (offerer, target, oPr, tPr) => `${target} considers it. Looks at ${tPr.posAdj} impossible animal. Looks at ${offerer}. "...Fine. But if you screw me, I'll know."`,
  ],
  reject: [
    (offerer, target, oPr, tPr) => `${target} stares at ${offerer}. "No. I'd rather clean the bathrooms." ${offerer} doesn't take it well.`,
  ],
  backfire: [
    (offerer, target, oPr, tPr) => `${offerer} "helps" ${target} — by using ${tPr.obj} as bait. ${target} realizes too late: ${offerer} was never on ${tPr.posAdj} side.`,
  ],
};

const WW_TRANQ_TEXTS = {
  missTarget: [
    (shooter, sPr) => `${shooter} fires the tranq gun at ${sPr.posAdj} animal. Misses by a mile. The dart embeds itself in a tree.`,
    (shooter, sPr) => `${shooter} aims, fires, and hits a squirrel that wasn't even part of the challenge. It drops like a rock.`,
  ],
  hitContestant: [
    (shooter, victim, sPr, vPr) => `${shooter} pulls the trigger. The dart sails past the deer and buries itself in ${victim}'s backside. ${victim} looks down. Looks up. Collapses.`,
    (shooter, victim, sPr, vPr) => `"Was that a deer?" ${shooter} squints. It was not a deer. It was ${victim}. ${vPr.Sub} ${vPr.sub==='they'?'go':'goes'} down hard.`,
  ],
  hitChef: [
    (shooter, sPr) => `${shooter} fires three darts at the first moving object in the bush. It's Chef. He drops like a sack of potatoes. ${shooter} does not apologize.`,
    (shooter, sPr) => `The dart hits Chef in the neck. He stands still for a moment, looks at ${shooter} with pure fury, then crumples to the ground.`,
  ],
  hitWildlife: [
    (shooter, sPr) => `${shooter} fires at a rustling bush. A unicorn steps out, wobbles, and collapses. Everyone stares. Nobody mentions it again.`,
    (shooter, sPr) => `${shooter} sees movement in the sky and fires. A yellow plane swerves and crash-lands in the lake. Chris is going to be furious.`,
  ],
};

const WW_ENCOURAGE_TEXTS = [
  (helper, target, hPr, tPr) => `"You got this!" ${helper} yells from across the clearing. ${target} doesn't believe it, but ${tPr.sub} ${tPr.sub==='they'?'try':'tries'} harder anyway.`,
  (helper, target, hPr, tPr) => `${helper} pats ${target} on the shoulder. "Don't give up. That animal is dumber than you think."`,
];

const WW_TAUNT_TEXTS = [
  (taunter, target, tPr, tgtPr) => `${taunter} walks past ${target} holding ${tPr.posAdj} captured animal. "Oh, you're STILL looking? That's embarrassing."`,
  (taunter, target, tPr, tgtPr) => `${taunter} watches ${target} fail another attempt. "You're really bad at this." ${target}'s jaw tightens.`,
];

// ── CHRIS COMMENTARY ──
const CHRIS_HUNT_QUIPS = {
  announcement: [
    `"Today's challenge: catch an animal and bring it back alive. First one back wins a feast. Last one back cleans the bathrooms. Game on!" — Chris McLean`,
    `"Welcome to Wawanakwa's finest outdoor activity: animal wrangling! First one back gets immunity AND a feast of all your favorites. Dead last? You're scrubbing toilets." — Chris McLean`,
  ],
  gearScramble: [
    `"You have sixty seconds in the boathouse. Grab whatever you want!" — Chris McLean`,
    `"Sixty seconds, people! Whatever you can carry!" — Chris McLean`,
  ],
  tranqReaction: [
    `"Did... did someone just shoot Chef?! HAHA! This is GREAT television!" — Chris McLean`,
    `"That was NOT in the liability waiver!" — Chris McLean`,
  ],
  feastReveal: [
    `"Winner winner! A feast of all your favorites, served right here!" — Chris McLean`,
    `"Congratulations! Enjoy every bite — the losers are watching!" — Chris McLean`,
  ],
  bathroomPunish: [
    `"Last place! Communal bathroom duty. Owen had the paste for breakfast, so... good luck!" — Chris McLean`,
    `"Somebody's gotta clean those bathrooms. And that somebody is you." — Chris McLean`,
  ],
};

// ── HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function neutralWouldScheme(name) { const s = pStats(name); return s.strategic >= 6 && s.loyalty <= 4; }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) { r -= (item.weight || 1); if (r <= 0) return item; }
  return arr[arr.length - 1];
}

function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── CAPTURE CHANCE FORMULA ──
function calcCaptureChance(name, animal, huntState) {
  const s = pStats(name);
  const tierBase = { easy: 0.35, medium: 0.20, hard: 0.10, extreme: 0.05 };
  let chance = tierBase[animal.tier];

  Object.entries(animal.statWeights).forEach(([stat, weight]) => {
    chance += (s[stat] || 5) * weight;
  });

  const ps = huntState.players[name];
  if (ps.gear) chance += ps.gear.captureBonus;
  if (ps.helpedBy) chance += 0.12;
  if (ps.sabotagedBy) chance -= 0.12;
  if (ps.tranqDarted) chance -= 0.25;
  if (ps.attemptsMade > 0) chance += 0.04 * ps.attemptsMade;
  if (ps.allianceHelp) chance += 0.10;
  chance += (Math.random() * 0.12) - 0.06;

  return Math.max(0.05, Math.min(0.90, chance));
}

// ── MISHAP CHANCE FORMULA ──
function calcMishapChance(name, animal) {
  const s = pStats(name);
  let chance = animal.mishapWeight;
  chance += s.boldness * 0.02 - s.intuition * 0.02;
  chance += (Math.random() * 0.10) - 0.05;
  return Math.max(0.10, Math.min(0.70, chance));
}

// ── GEAR SCRAMBLE SCORE ──
function calcGearScore(name) {
  const s = pStats(name);
  return s.physical * 0.25 + s.mental * 0.25 + s.intuition * 0.20 + s.boldness * 0.15 + s.strategic * 0.15 + (Math.random() * 3) - 1.5;
}

// ── DIFFICULTY ASSIGNMENT ──
function assignAnimalDifficulties(playerCount) {
  const easyCount  = Math.max(2, Math.floor(playerCount * 0.25));
  const medCount   = Math.max(2, Math.floor(playerCount * 0.30));
  const hardCount  = Math.max(1, Math.floor(playerCount * 0.25));
  const extrCount  = Math.max(1, playerCount - easyCount - medCount - hardCount);

  const bucket = [];
  for (let i = 0; i < easyCount; i++)  bucket.push('easy');
  for (let i = 0; i < medCount; i++)   bucket.push('medium');
  for (let i = 0; i < hardCount; i++)  bucket.push('hard');
  for (let i = 0; i < extrCount; i++)  bucket.push('extreme');

  for (let i = bucket.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
  }
  return bucket.slice(0, playerCount);
}

// ══════════════════════════════════════════════════════════════
// HUNT EVENT HELPERS
// ══════════════════════════════════════════════════════════════

function _executeHuntEvent(template, activePlayers, huntState, ep, round) {
  const uncaptured = activePlayers.filter(p => !huntState.players[p].captured);
  const captured = activePlayers.filter(p => huntState.players[p].captured);

  if (template.id === 'help-ally') {
    const helpers = [...captured, ...uncaptured].filter(p => isNiceArch(p));
    if (!helpers.length) return null;
    const helper = _rp(helpers);
    const targets = uncaptured.filter(p => p !== helper && getBond(helper, p) > 0);
    if (!targets.length) return null;
    const target = targets.sort((a, b) => getBond(helper, b) - getBond(helper, a))[0];
    huntState.players[target].helpedBy = helper;
    addBond(helper, target, 2);
    const text = _rp(WW_HELP_TEXTS)(helper, target, pronouns(helper), pronouns(target));
    return { type: 'huntEvent', subtype: 'help', players: [helper, target], text, badgeText: 'HELPED', badgeClass: 'green' };

  } else if (template.id === 'sabotage-rival') {
    const saboteurs = uncaptured.filter(p => isVillainArch(p) || neutralWouldScheme(p));
    if (!saboteurs.length) return null;
    const sab = _rp(saboteurs);
    const targets = uncaptured.filter(p => p !== sab);
    if (!targets.length) return null;
    const target = targets.sort((a, b) => getBond(sab, a) - getBond(sab, b))[0];
    const detectChance = pStats(target).intuition * 0.08 + Math.random() * 0.3;
    const caught = detectChance > 0.6;
    if (caught) {
      addBond(sab, target, -3);
      popDelta(sab, -1);
      const text = _rp(WW_SABOTAGE_TEXTS.caught)(sab, target, pronouns(sab), pronouns(target));
      return { type: 'huntEvent', subtype: 'sabotage-caught', players: [sab, target], text, badgeText: 'CAUGHT', badgeClass: 'red' };
    } else {
      huntState.players[target].sabotagedBy = sab;
      addBond(sab, target, -2);
      const text = _rp(WW_SABOTAGE_TEXTS.success)(sab, target, pronouns(sab), pronouns(target));
      return { type: 'huntEvent', subtype: 'sabotage', players: [sab, target], text, badgeText: 'SABOTAGED', badgeClass: 'red' };
    }

  } else if (template.id === 'alliance-offer') {
    const offerers = uncaptured.filter(p => isVillainArch(p) || neutralWouldScheme(p));
    if (!offerers.length) return null;
    const offerer = _rp(offerers);
    const targets = uncaptured.filter(p => p !== offerer);
    if (!targets.length) return null;
    const tierRank = { extreme: 4, hard: 3, medium: 2, easy: 1 };
    const target = targets.sort((a, b) => (tierRank[huntState.players[b].animal.tier] || 0) - (tierRank[huntState.players[a].animal.tier] || 0))[0];
    const oPr = pronouns(offerer);
    const tPr = pronouns(target);

    const desperationBonus = tierRank[huntState.players[target].animal.tier] * 0.10;
    const trustPenalty = getBond(offerer, target) < -2 ? -0.30 : 0;
    const acceptChance = 0.35 + desperationBonus + trustPenalty + pStats(target).strategic * 0.02;

    if (Math.random() < acceptChance) {
      if (isVillainArch(offerer) && Math.random() < 0.30) {
        huntState.players[target].personalScore -= 3;
        addBond(target, offerer, -4);
        popDelta(offerer, -2);
        const text = _rp(WW_ALLIANCE_TEXTS.backfire)(offerer, target, oPr, tPr);
        return { type: 'huntEvent', subtype: 'alliance-backfire', players: [offerer, target], text, badgeText: 'BETRAYED', badgeClass: 'red' };
      }
      huntState.players[target].allianceHelp = true;
      addBond(offerer, target, 3);
      gs._wildHuntHeat = gs._wildHuntHeat || [];
      gs._wildHuntHeat.push({ a: offerer, b: target, type: 'alliance', expiresEp: (gs.episode || 1) + 2 });
      const offerText = _rp(WW_ALLIANCE_TEXTS.offer)(offerer, target, oPr, tPr);
      const acceptText = _rp(WW_ALLIANCE_TEXTS.accept)(offerer, target, oPr, tPr);
      return { type: 'huntEvent', subtype: 'alliance-accepted', players: [offerer, target], text: `${offerText} ${acceptText}`, badgeText: 'ALLIANCE', badgeClass: 'yellow' };
    } else {
      addBond(offerer, target, -1);
      const offerText = _rp(WW_ALLIANCE_TEXTS.offer)(offerer, target, oPr, tPr);
      const rejectText = _rp(WW_ALLIANCE_TEXTS.reject)(offerer, target, oPr, tPr);
      return { type: 'huntEvent', subtype: 'alliance-rejected', players: [offerer, target], text: `${offerText} ${rejectText}`, badgeText: 'REJECTED', badgeClass: 'grey' };
    }

  } else if (template.id === 'taunt') {
    const taunters = captured.filter(p => isVillainArch(p) || neutralWouldScheme(p));
    if (!taunters.length || !uncaptured.length) return null;
    const taunter = _rp(taunters);
    const target = uncaptured.sort((a, b) => getBond(taunter, a) - getBond(taunter, b))[0];
    addBond(taunter, target, -1);
    popDelta(taunter, -1);
    const text = _rp(WW_TAUNT_TEXTS)(taunter, target, pronouns(taunter), pronouns(target));
    return { type: 'huntEvent', subtype: 'taunt', players: [taunter, target], text, badgeText: 'TAUNT', badgeClass: 'red' };

  } else if (template.id === 'encourage') {
    const encouragers = [...captured, ...uncaptured].filter(p => isNiceArch(p));
    if (!encouragers.length || !uncaptured.length) return null;
    const helper = _rp(encouragers);
    const target = uncaptured.filter(p => p !== helper).sort((a, b) => getBond(helper, b) - getBond(helper, a))[0];
    if (!target) return null;
    addBond(helper, target, 1);
    huntState.players[target].personalScore += 1;
    const text = _rp(WW_ENCOURAGE_TEXTS)(helper, target, pronouns(helper), pronouns(target));
    return { type: 'huntEvent', subtype: 'encourage', players: [helper, target], text, badgeText: 'ENCOURAGED', badgeClass: 'green' };

  } else if (template.id === 'showmance-moment') {
    const showmance = (gs.showmances || []).find(sh => sh.phase !== 'broken-up' && sh.players.some(p => activePlayers.includes(p)));
    if (!showmance) return null;
    const pair = showmance.players.filter(p => activePlayers.includes(p));
    if (pair.length < 2) return null;
    const [a, b] = pair;
    addBond(a, b, 1);
    const aPr = pronouns(a);
    const text = `${a} and ${b} share a look across the hunting grounds. ${aPr.Sub} ${aPr.sub==='they'?'smile':'smiles'}. Even in the chaos, they find each other.`;
    return { type: 'huntEvent', subtype: 'showmance', players: [a, b], text, badgeText: 'MOMENT', badgeClass: 'pink' };

  } else if (template.id === 'rivalry-clash') {
    if (uncaptured.length < 2) return null;
    let worstPair = null, worstBond = 99;
    for (let i = 0; i < uncaptured.length; i++) {
      for (let j = i + 1; j < uncaptured.length; j++) {
        const b = getBond(uncaptured[i], uncaptured[j]);
        if (b < worstBond) { worstBond = b; worstPair = [uncaptured[i], uncaptured[j]]; }
      }
    }
    if (!worstPair || worstBond > -2) return null;
    const [a, b] = worstPair;
    addBond(a, b, -1);
    const text = `${a} and ${b} cross paths in the woods. The tension is immediate. Words are exchanged. Neither backs down.`;
    return { type: 'huntEvent', subtype: 'rivalry', players: [a, b], text, badgeText: 'CLASH', badgeClass: 'red' };

  } else if (template.id === 'discovery') {
    const finder = _rp(uncaptured);
    if (!finder) return null;
    const fPr = pronouns(finder);
    huntState.players[finder].personalScore += 1.5;
    const text = `${finder} stumbles across a shortcut through the brush. ${fPr.Sub} ${fPr.sub==='they'?'gain':'gains'} ground on ${fPr.posAdj} animal.`;
    return { type: 'huntEvent', subtype: 'discovery', players: [finder], text, badgeText: 'DISCOVERY', badgeClass: 'blue' };

  } else if (template.id === 'steal-gear') {
    const thieves = uncaptured.filter(p => isVillainArch(p) || neutralWouldScheme(p));
    if (!thieves.length) return null;
    const thief = _rp(thieves);
    const targets = uncaptured.filter(p => p !== thief && huntState.players[p].gear?.tier === 'useful');
    if (!targets.length) return null;
    const target = _rp(targets);
    const tPr = pronouns(thief);
    const stolen = huntState.players[target].gear;
    huntState.players[target].gear = huntState.players[thief].gear;
    huntState.players[thief].gear = stolen;
    addBond(thief, target, -2);
    popDelta(thief, -1);
    const text = `${thief} swipes ${target}'s ${stolen.name} when ${pronouns(target).sub} ${pronouns(target).sub==='they'?'aren\'t':'isn\'t'} looking. ${tPr.Sub} ${tPr.sub==='they'?'leave':'leaves'} ${tPr.posAdj} ${huntState.players[target].gear.name} in its place.`;
    return { type: 'huntEvent', subtype: 'steal-gear', players: [thief, target], text, badgeText: 'STOLEN', badgeClass: 'red' };

  } else if (template.id === 'animal-encounter') {
    const victim = _rp(uncaptured);
    if (!victim) return null;
    const vPr = pronouns(victim);
    const animal = huntState.players[victim].animal;
    huntState.players[victim].personalScore -= 0.5;
    const text = `${victim} runs into a ${animal.tier === 'extreme' ? 'terrifyingly large' : 'surprisingly aggressive'} ${animal.name.toLowerCase()} that isn't even ${vPr.posAdj} target. ${vPr.Sub} ${vPr.sub==='they'?'lose':'loses'} precious time.`;
    return { type: 'huntEvent', subtype: 'animal-encounter', players: [victim], text, badgeText: 'ENCOUNTER', badgeClass: 'yellow' };
  }

  return null;
}

// ── TRANQUILIZER CHAOS ──
function _fireTranqChaos(shooter, activePlayers, huntState, ep) {
  const sPr = pronouns(shooter);
  const s = pStats(shooter);
  const uncaptured = activePlayers.filter(p => !huntState.players[p].captured && p !== shooter);

  const aimScore = s.intuition * 0.3 + s.mental * 0.2 + (Math.random() * 3) - 1.5;
  let outcome;

  if (aimScore >= 7) {
    outcome = 'missTarget';
  } else if (aimScore >= 4 && uncaptured.length) {
    outcome = 'hitContestant';
  } else if (Math.random() < 0.30) {
    outcome = 'hitChef';
  } else {
    outcome = 'hitWildlife';
  }

  if (outcome === 'hitContestant' && uncaptured.length) {
    const victim = _rp(uncaptured);
    huntState.players[victim].tranqDarted = true;
    huntState.players[victim].personalScore -= 5;
    addBond(shooter, victim, -3);
    popDelta(shooter, -2);
    popDelta(victim, 1);
    const text = _rp(WW_TRANQ_TEXTS.hitContestant)(shooter, victim, sPr, pronouns(victim));
    gs._wildHuntHeat = gs._wildHuntHeat || [];
    gs._wildHuntHeat.push({ target: victim, shooter, amount: 3, expiresEp: (gs.episode || 1) + 2 });
    return { type: 'tranqChaos', subtype: 'hitContestant', players: [shooter, victim], text, badgeText: "TRANQ'D", badgeClass: 'red' };

  } else if (outcome === 'hitChef') {
    popDelta(shooter, -1);
    const text = _rp(WW_TRANQ_TEXTS.hitChef)(shooter, sPr);
    return { type: 'tranqChaos', subtype: 'hitChef', players: [shooter], text, badgeText: 'SHOT CHEF', badgeClass: 'red' };

  } else if (outcome === 'hitWildlife') {
    popDelta(shooter, 1);
    const text = _rp(WW_TRANQ_TEXTS.hitWildlife)(shooter, sPr);
    return { type: 'tranqChaos', subtype: 'hitWildlife', players: [shooter], text, badgeText: 'WILD SHOT', badgeClass: 'yellow' };

  } else {
    const text = _rp(WW_TRANQ_TEXTS.missTarget)(shooter, sPr);
    return { type: 'tranqChaos', subtype: 'miss', players: [shooter], text, badgeText: 'MISS', badgeClass: 'grey' };
  }
}

// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateWawanakwaGoneWild(ep) {
  const activePlayers = [...gs.activePlayers];
  const n = activePlayers.length;
  const timeline = [];
  const badges = {};

  // ══ PHASE 1A: ANIMAL DRAW ══
  const difficulties = assignAnimalDifficulties(n);
  const animalAssignments = {};
  const usedAnimals = new Set();

  activePlayers.forEach((name, i) => {
    const tier = difficulties[i];
    const pool = ANIMALS[tier].filter(a => !usedAnimals.has(a.id));
    const animal = pool.length ? _rp(pool) : _rp(ANIMALS[tier]);
    usedAnimals.add(animal.id);
    animalAssignments[name] = animal;

    const s = pStats(name);
    const pr = pronouns(name);
    const mood = s.boldness >= 6 ? 'happy' : 'nervous';
    const drawText = _rp(animal.draw[mood] || animal.draw.happy)(name, pr);
    timeline.push({ type: 'animalDraw', player: name, animal: animal.name, tier: animal.tier, text: drawText });
  });

  // ══ PHASE 1B: GEAR SCRAMBLE ══
  const gearAssignments = {};

  const gearScores = {};
  activePlayers.forEach(name => { gearScores[name] = calcGearScore(name); });
  const pickOrder = [...activePlayers].sort((a, b) => gearScores[b] - gearScores[a]);

  const gearPool = [...GEAR_POOL];
  pickOrder.forEach(name => {
    const score = gearScores[name];
    const pr = pronouns(name);
    let picked;

    if (score >= 7) {
      const useful = gearPool.filter(g => g.tier === 'useful');
      picked = useful.length ? _rp(useful) : _rp(gearPool);
    } else if (score >= 4.5) {
      const eligible = gearPool.filter(g => g.tier !== 'junk');
      picked = eligible.length ? _rp(eligible) : _rp(gearPool);
    } else {
      const junk = gearPool.filter(g => g.tier === 'junk' || g.tier === 'chaotic');
      picked = junk.length ? _rp(junk) : _rp(gearPool);
    }

    const idx = gearPool.findIndex(g => g.id === picked.id);
    if (idx !== -1) gearPool.splice(idx, 1);

    gearAssignments[name] = picked;
    const gearText = picked.tier === 'useful'
      ? `${name} grabs the ${picked.name}. Smart choice.`
      : picked.tier === 'chaotic'
        ? `${name} picks up the ${picked.name}. This could go very well or very badly.`
        : `${name} ends up with the ${picked.name}. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} at it, then at everyone else's gear. This is not ideal.`;

    timeline.push({ type: 'gearGrab', player: name, gear: picked.name, gearTier: picked.tier, text: gearText });
  });

  timeline.push({ type: 'chrisQuip', text: _rp(CHRIS_HUNT_QUIPS.announcement) });

  // ══ PHASE 2: HUNT ROUNDS ══
  const huntState = {
    players: {},
    captureOrder: [],
    roundResults: [],
  };

  activePlayers.forEach(name => {
    huntState.players[name] = {
      animal: animalAssignments[name],
      gear: gearAssignments[name],
      captured: false,
      captureRound: null,
      attemptsMade: 0,
      helpedBy: null,
      sabotagedBy: null,
      tranqDarted: false,
      allianceHelp: false,
      mishaps: [],
      personalScore: 0,
    };
  });

  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const uncaptured = activePlayers.filter(p => !huntState.players[p].captured);
    if (uncaptured.length === 0) break;

    // --- Fire 1-3 hunt events per round ---
    const eventCount = 1 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
    for (let e = 0; e < eventCount; e++) {
      const eligible = HUNT_EVENTS.filter(ev => {
        if (ev.villainsOnly && !activePlayers.some(p => !huntState.players[p].captured && (isVillainArch(p) || neutralWouldScheme(p)))) return false;
        if (ev.niceOnly && !activePlayers.some(p => !huntState.players[p].captured && isNiceArch(p))) return false;
        if (ev.id === 'showmance-moment' && !(gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.some(p => activePlayers.includes(p)))) return false;
        return true;
      });
      if (!eligible.length) continue;
      const template = wPick(eligible);

      const evt = _executeHuntEvent(template, activePlayers, huntState, ep, round);
      if (evt) {
        timeline.push(evt);
      }
    }

    // --- Tranquilizer chaos ---
    if (round <= 2) {
      const tranqHolder = uncaptured.find(p => huntState.players[p].gear?.special === 'tranq-chaos');
      if (tranqHolder && !huntState._tranqFired && Math.random() < 0.60) {
        const tranqEvt = _fireTranqChaos(tranqHolder, activePlayers, huntState, ep);
        if (tranqEvt) {
          timeline.push(tranqEvt);
          huntState._tranqFired = true;
        }
      }
    }

    // --- Each uncaptured player makes one attempt ---
    uncaptured.forEach(name => {
      const ps = huntState.players[name];
      const animal = ps.animal;
      const pr = pronouns(name);

      const chance = calcCaptureChance(name, animal, huntState);
      const roll = Math.random();
      ps.attemptsMade++;
      ps.personalScore += chance * 10;

      if (roll < chance) {
        ps.captured = true;
        ps.captureRound = round;
        huntState.captureOrder.push(name);
        const successText = _rp(animal.attemptSuccess)(name, pr);
        timeline.push({ type: 'huntAttempt', player: name, round, success: true, animal: animal.name, text: successText });

        if (animal.tier === 'extreme') popDelta(name, 2);
        else if (animal.tier === 'hard') popDelta(name, 1);
        else if (huntState.captureOrder.length === 1) popDelta(name, 1);

        if (huntState.captureOrder.length === 1) badges[name] = 'wildHuntFirst';
      } else {
        const mishapChance = calcMishapChance(name, animal);
        if (Math.random() < mishapChance && animal.mishap?.length) {
          const mishapText = _rp(animal.mishap)(name, pr);
          ps.mishaps.push(mishapText);
          ps.personalScore -= 2;
          timeline.push({ type: 'huntMishap', player: name, round, animal: animal.name, text: mishapText });
          if (animal.tier === 'extreme' || animal.tier === 'hard') popDelta(name, -1);
        } else {
          const failText = _rp(animal.attemptFail)(name, pr);
          timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: failText });
        }
      }
    });
  }

  // Last chance: anyone still uncaptured gets one final attempt with -0.05 penalty
  const stillUncaptured = activePlayers.filter(p => !huntState.players[p].captured);
  stillUncaptured.forEach(name => {
    const ps = huntState.players[name];
    const animal = ps.animal;
    const pr = pronouns(name);
    const chance = calcCaptureChance(name, animal, huntState) - 0.05;
    ps.attemptsMade++;

    if (Math.random() < Math.max(0.03, chance)) {
      ps.captured = true;
      ps.captureRound = MAX_ROUNDS;
      huntState.captureOrder.push(name);
      timeline.push({ type: 'huntAttempt', player: name, round: MAX_ROUNDS, success: true, animal: animal.name, text: `${name} makes one desperate last attempt — and somehow pulls it off. ${pr.Sub} ${pr.sub==='they'?'drag':'drags'} the ${animal.name.toLowerCase()} back to camp, barely.` });
    } else {
      timeline.push({ type: 'huntFail', player: name, round: MAX_ROUNDS, animal: animal.name, text: `${name} never caught the ${animal.name.toLowerCase()}. ${pr.Sub} ${pr.sub==='they'?'walk':'walks'} back to camp empty-handed.` });
    }
  });

  // ══ RESOLUTION ══
  const immunityWinner = huntState.captureOrder[0] || null;
  const finishOrder = [...huntState.captureOrder];

  const finalUncaptured = activePlayers.filter(p => !huntState.players[p].captured);
  finalUncaptured.sort((a, b) => huntState.players[a].personalScore - huntState.players[b].personalScore);
  finishOrder.push(...finalUncaptured);

  const punishmentTarget = finishOrder[finishOrder.length - 1];

  if (immunityWinner) {
    timeline.push({ type: 'feastReveal', player: immunityWinner, text: _rp(CHRIS_HUNT_QUIPS.feastReveal) });
    popDelta(immunityWinner, 2);
  }

  if (punishmentTarget) {
    timeline.push({ type: 'punishmentReveal', player: punishmentTarget, text: _rp(CHRIS_HUNT_QUIPS.bathroomPunish) });
    popDelta(punishmentTarget, -2);
    badges[punishmentTarget] = 'wildHuntBathroom';
  }

  // ══ SET CHALLENGE OUTCOME ══
  ep.immunityWinner = immunityWinner;
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Wawanakwa Gone Wild!';
  ep.tribalPlayers = gs.activePlayers.filter(p => p !== immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);

  ep.chalMemberScores = {};
  activePlayers.forEach(name => {
    ep.chalMemberScores[name] = huntState.players[name].personalScore;
  });
  updateChalRecord(ep);

  ep.challengePlacements = finishOrder.map((name, i) => ({ name, place: i + 1, score: huntState.players[name].personalScore }));

  // ══ CONSEQUENCES ══
  huntState.captureOrder.forEach(name => {
    const ps = huntState.players[name];
    if (ps.helpedBy && romanticCompat(name, ps.helpedBy)) {
      _challengeRomanceSpark(name, ps.helpedBy, ep, 'challenge');
    }
  });

  _checkShowmanceChalMoment(ep, activePlayers);

  // ══ STORE DATA ══
  ep.isWawanakwaGoneWild = true;
  ep.wawanakwaGoneWild = {
    timeline,
    animalAssignments: Object.fromEntries(Object.entries(animalAssignments).map(([k, v]) => [k, { id: v.id, name: v.name, tier: v.tier }])),
    gearAssignments: Object.fromEntries(Object.entries(gearAssignments).map(([k, v]) => [k, { id: v.id, name: v.name, tier: v.tier }])),
    finishOrder,
    immunityWinner,
    punishmentTarget,
    huntResults: Object.fromEntries(Object.entries(huntState.players).map(([name, ps]) => [name, {
      animal: ps.animal.name, animalTier: ps.animal.tier, gear: ps.gear.name, gearTier: ps.gear.tier,
      captured: ps.captured, captureRound: ps.captureRound, attemptsMade: ps.attemptsMade,
      personalScore: ps.personalScore, helpedBy: ps.helpedBy, sabotagedBy: ps.sabotagedBy,
      tranqDarted: ps.tranqDarted, mishapCount: ps.mishaps.length,
    }])),
    badges,
  };

  // Camp event for punishment target
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (punishmentTarget) {
    const ptPr = pronouns(punishmentTarget);
    ep.campEvents[campKey].post.push({
      type: 'ww-bathroom-punishment',
      text: `${punishmentTarget} is sentenced to clean the communal bathrooms. ${ptPr.Sub} ${ptPr.sub==='they'?'open':'opens'} the door, ${ptPr.sub==='they'?'gag':'gags'}, and ${ptPr.sub==='they'?'consider':'considers'} quitting.`,
      players: [punishmentTarget],
      badgeText: 'BATHROOM DUTY',
      badgeClass: 'red',
    });
  }
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN
// ══════════════════════════════════════════════════════════════
export function rpBuildWawanakwaGoneWild(ep) {
  const ww = ep.wawanakwaGoneWild;
  if (!ww?.timeline?.length) return '';

  const stateKey = `ww_reveal_${ep.num}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];

  const GOLD = '#d4a017';
  const GREEN = '#3fb950';
  const RED = '#f85149';
  const GREY = '#6e7681';

  let html = `<div class="ww-wrap" style="position:relative;background:linear-gradient(180deg,#1a2416 0%,#0f1a0b 100%);padding:18px 12px;min-height:400px">`;
  html += `<div style="text-align:center;font-family:var(--font-display);font-size:22px;font-weight:700;color:${GOLD};letter-spacing:2px;margin-bottom:4px">🏕️ WAWANAKWA GONE WILD!</div>`;
  html += `<div style="text-align:center;font-size:11px;color:${GREY};letter-spacing:0.3px;margin-bottom:12px">Catch your animal. First back wins a feast. Last back cleans the bathrooms.</div>`;

  // Per-player status board
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;margin-bottom:14px">`;
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const tierColor = { easy: GREEN, medium: '#f0883e', hard: RED, extreme: '#bc4dff' }[r.animalTier] || GREY;
    const statusIcon = r.captured ? '✅' : '❌';
    const tierEmoji = { easy: '🐿️', medium: '🦆', hard: '🦌', extreme: '🐻' }[r.animalTier] || '🐾';
    html += `<div style="padding:8px;border-radius:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);font-size:10px">`;
    html += `<div style="font-weight:700;color:#e6edf3;margin-bottom:2px">${name}</div>`;
    html += `<div style="color:${tierColor}">${tierEmoji} ${r.animal} (${r.animalTier})</div>`;
    html += `<div style="color:${GREY}">🎒 ${r.gear}</div>`;
    html += `<div>${statusIcon} ${r.captured ? `R${r.captureRound + 1}` : 'FAILED'} · ${r.attemptsMade} tries</div>`;
    html += `</div>`;
  });
  html += `</div>`;

  // Timeline click-to-reveal
  const timeline = ww.timeline;
  for (let i = 0; i < timeline.length; i++) {
    const evt = timeline[i];
    const revealed = i <= state.idx;
    const isCurrent = i === state.idx + 1;

    if (!revealed && !isCurrent) continue;

    if (isCurrent) {
      html += `<div onclick="window._tvState['${stateKey}'].idx=${i};document.querySelector('[data-vpscreen]')?.dispatchEvent(new Event('rebuild'))" style="cursor:pointer;padding:10px 14px;margin-bottom:5px;border-radius:8px;border:1px dashed rgba(212,160,23,0.3);background:rgba(212,160,23,0.05);text-align:center;font-size:11px;color:${GOLD}">▶ Click to reveal next</div>`;
      break;
    }

    html += _renderWWCard(evt, GOLD, GREEN, RED, GREY);
  }

  // End results (only after full reveal)
  if (state.idx >= timeline.length - 1) {
    html += `<div style="margin-top:16px;padding:14px;border-radius:10px;border:2px solid ${GOLD};background:rgba(212,160,23,0.08)">`;
    html += `<div style="font-size:18px;font-weight:700;color:${GOLD};margin-bottom:6px">🏆 ${ww.immunityWinner || 'No winner'}</div>`;
    html += `<div style="font-size:12px;color:#e6edf3">Immunity + feast of all their favorites!</div>`;
    html += `</div>`;
    if (ww.punishmentTarget) {
      html += `<div style="margin-top:8px;padding:12px;border-radius:10px;border:2px solid ${RED};background:rgba(248,81,73,0.06)">`;
      html += `<div style="font-size:14px;font-weight:700;color:${RED}">🚽 ${ww.punishmentTarget}</div>`;
      html += `<div style="font-size:11px;color:${GREY}">Bathroom cleaning duty.</div>`;
      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}

function _renderWWCard(evt, GOLD, GREEN, RED, GREY) {
  const typeColors = {
    animalDraw: GOLD, gearGrab: '#8b949e', chrisQuip: '#f0883e',
    huntAttempt: evt.success ? GREEN : RED, huntMishap: RED, huntFail: RED,
    huntEvent: { help: GREEN, 'sabotage-caught': RED, sabotage: RED, 'alliance-accepted': GOLD, 'alliance-rejected': GREY, 'alliance-backfire': RED, taunt: RED, encourage: GREEN, showmance: '#ff69b4', rivalry: RED, discovery: '#58a6ff', 'steal-gear': RED, 'animal-encounter': '#f0883e' }[evt.subtype] || GREY,
    tranqChaos: RED, feastReveal: GOLD, punishmentReveal: RED,
  };
  const color = typeColors[evt.type] || GREY;
  const emoji = { animalDraw: '🎲', gearGrab: '🎒', chrisQuip: '📢', huntAttempt: evt.success ? '✅' : '❌', huntMishap: '💥', huntFail: '💀', huntEvent: '⚡', tranqChaos: '💉', feastReveal: '🍗', punishmentReveal: '🚽' }[evt.type] || '📋';

  let html = `<div style="padding:10px 14px;margin-bottom:5px;border-radius:8px;border:1px solid ${color}22;background:${color}08;border-left:3px solid ${color}">`;
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:${color};margin-bottom:3px">${emoji} ${(evt.type || '').toUpperCase().replace(/-/g, ' ')}${evt.badgeText ? ` · ${evt.badgeText}` : ''}</div>`;
  html += `<div style="font-size:12px;color:#e6edf3;line-height:1.5">${evt.text}</div>`;
  if (evt.player) html += `<div style="font-size:9px;color:${GREY};margin-top:3px">${evt.player}${evt.animal ? ` · ${evt.animal}` : ''}</div>`;
  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textWawanakwaGoneWild(ep, ln, sec) {
  if (!ep.wawanakwaGoneWild?.timeline?.length) return;
  const ww = ep.wawanakwaGoneWild;
  sec('WAWANAKWA GONE WILD!');
  ln('Post-merge animal hunt. First capture wins immunity + feast. Last place cleans the bathrooms.');
  ln('');

  ln('ANIMAL ASSIGNMENTS:');
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const status = r.captured ? `CAUGHT (R${r.captureRound + 1})` : 'FAILED';
    const mods = [r.helpedBy ? `helped:${r.helpedBy}` : '', r.sabotagedBy ? `sab:${r.sabotagedBy}` : '', r.tranqDarted ? "TRANQ'D" : ''].filter(Boolean).join(' ');
    ln(`  ${name}: ${r.animal} (${r.animalTier}) · Gear: ${r.gear} · ${status} · ${r.attemptsMade} attempts · Score: ${(r.personalScore || 0).toFixed(1)}${mods ? ' · ' + mods : ''}`);
  });
  ln('');

  ln('TIMELINE:');
  ww.timeline.forEach(evt => {
    if (evt.type === 'animalDraw') ln(`  [DRAW] ${evt.player}: ${evt.animal} (${evt.tier})`);
    else if (evt.type === 'gearGrab') ln(`  [GEAR] ${evt.player}: ${evt.gear} (${evt.gearTier})`);
    else if (evt.type === 'chrisQuip') ln(`  [CHRIS] ${evt.text}`);
    else if (evt.type === 'huntAttempt') ln(`  [${evt.success ? 'CAPTURE' : 'FAIL'}] R${evt.round + 1} ${evt.player}: ${evt.text}`);
    else if (evt.type === 'huntMishap') ln(`  [MISHAP] R${evt.round + 1} ${evt.player}: ${evt.text}`);
    else if (evt.type === 'huntFail') ln(`  [NO CATCH] ${evt.player}: ${evt.text}`);
    else if (evt.type === 'huntEvent') ln(`  [${(evt.subtype || 'EVENT').toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'tranqChaos') ln(`  [TRANQ: ${(evt.subtype || '').toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'feastReveal') ln(`  [FEAST] ${evt.player}: ${evt.text}`);
    else if (evt.type === 'punishmentReveal') ln(`  [PUNISHMENT] ${evt.player}: ${evt.text}`);
    else ln(`  [${evt.type}] ${evt.text || ''}`);
  });
  ln('');

  ln(`IMMUNITY: ${ww.immunityWinner || 'None'}`);
  ln(`PUNISHMENT: ${ww.punishmentTarget || 'None'}`);
  ln(`FINISH ORDER: ${ww.finishOrder?.join(', ') || '?'}`);
}

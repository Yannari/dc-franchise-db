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
    {
      id: 'squirrel', name: 'Squirrel', tier: 'easy',
      statWeights: { physical: 0.04, intuition: 0.03, boldness: 0.02 },
      mishapWeight: 0.30,
      draw: {
        happy: [
          (n, pr) => `${n} draws Squirrel. "A squirrel? Okay. I can do a squirrel."`,
          (n, pr) => `${n} grins at the slip. "It's basically a cat toy. How hard can it be?"`,
        ],
        nervous: [
          (n, pr) => `"Squirrel." ${n} sighs. "Those things are basically chipmunks on espresso."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} scatters a handful of nuts, waits perfectly still, and drops a bucket over the squirrel before it knows what happened.`,
        (n, pr) => `${n} corners the squirrel against a tree and scoops it up in one quick motion. It screams the whole way back.`,
      ],
      attemptFail: [
        (n, pr) => `The squirrel bolts straight up the tree. ${n} stares up at it. There is nothing to do but walk away.`,
        (n, pr) => `${n} has it — for about half a second. Then it slips through ${pr.posAdj} fingers and is twenty feet up a pine tree.`,
      ],
      mishap: [
        (n, pr) => `${n} shakes a bag of nuts at the squirrel. It grabs the whole bag and disappears into a hole. ${n} has no squirrel and no bait.`,
        (n, pr) => `${n} climbs the tree. The squirrel moves to a different tree. ${n} climbs that tree. The squirrel moves again. This continues.`,
      ],
    },
    {
      id: 'seagull', name: 'Seagull', tier: 'easy',
      statWeights: { intuition: 0.04, mental: 0.03, physical: 0.02 },
      mishapWeight: 0.35,
      draw: {
        happy: [
          (n, pr) => `${n} draws Seagull. "Oh come on, there are like a hundred of those at the dock. This is a freebie."`,
        ],
        nervous: [
          (n, pr) => `"Seagull." ${n} frowns. "Those things are bold. Have you seen how they look at you?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} tosses chips near the dock and waits for the gulls to land. When one gets close, ${pr.sub} ${pr.sub==='they'?'pounce':'pounces'} and bags it.`,
        (n, pr) => `${n} lures the seagull with a piece of food and nets it against a dock post. It shrieks all the way to camp.`,
      ],
      attemptFail: [
        (n, pr) => `${n} grabs for the seagull. It dodges, snatches the food right out of ${pr.posAdj} hand, and flies off.`,
        (n, pr) => `The seagull walks directly toward ${n} until ${pr.sub} ${pr.sub==='they'?'step':'steps'} back. It repeats this for five minutes. ${n} is being herded. By a bird.`,
      ],
      mishap: [
        (n, pr) => `${n} holds out bait and the seagull lands on ${pr.posAdj} head instead of ${pr.posAdj} hand. It stays there. The rest of the flock arrives.`,
        (n, pr) => `The seagull steals ${pr.posAdj} gear pouch and drops it into the lake. ${n} watches it sink.`,
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
    {
      id: 'skunk', name: 'Skunk', tier: 'medium',
      statWeights: { mental: 0.04, intuition: 0.04, boldness: 0.02 },
      mishapWeight: 0.55,
      draw: {
        happy: [
          (n, pr) => `${n} draws Skunk. "Okay, easy. Just... don't startle it."`,
        ],
        nervous: [
          (n, pr) => `"Skunk." ${n} stares at the slip. "If I come back smelling like that, I'm voting myself off."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} approaches the skunk from downwind, moves at a glacial pace, and guides it into a box without making a sound. A masterpiece of patience.`,
        (n, pr) => `${n} uses a trail of food and extreme stillness. The skunk walks right into the sack. Not a drop of spray. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} like ${pr.sub} ${pr.sub==='they'?'defused':'defused'} a bomb.`,
      ],
      attemptFail: [
        (n, pr) => `${n} gets within reach and accidentally sneezes. The skunk raises its tail. ${n} runs before it fires — but barely.`,
        (n, pr) => `${n} steps on a twig. The skunk spins. ${n} freezes. After a very long ten seconds, it walks away. No capture, but no spray either.`,
      ],
      mishap: [
        (n, pr) => `${n} moves too fast. Direct hit. ${pr.Sub} ${pr.sub==='they'?'are':'is'} drenched. No one will come near ${pr.obj} for the rest of the day.`,
        (n, pr) => `${n} tries to grab the skunk from behind. It was waiting for this. Camp can smell the aftermath from the other side of the island.`,
        (n, pr) => `${n} nets the skunk. The skunk sprays through the net. ${n} has the skunk AND the smell. Chris refuses to let ${pr.obj} near the cage.`,
      ],
    },
    {
      id: 'porcupine', name: 'Porcupine', tier: 'medium',
      statWeights: { mental: 0.05, intuition: 0.03, boldness: 0.02 },
      mishapWeight: 0.50,
      draw: {
        happy: [
          (n, pr) => `${n} draws Porcupine. "Okay, I know this one — just don't touch the spines."`,
        ],
        nervous: [
          (n, pr) => `"Porcupine." ${n} squints at the paper. "So basically a walking cactus with attitude."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} uses ${pr.posAdj} jacket as a thick glove, scoops the porcupine from beneath, and drops it in the bag without touching a single quill.`,
        (n, pr) => `${n} maneuvers the porcupine into a corner using a stick and guides it — not grabs it — into the cage. Smart and uninjured.`,
      ],
      attemptFail: [
        (n, pr) => `${n} goes to grab it. The porcupine rattles its quills. ${n} backs off. They stare at each other. Neither wins.`,
        (n, pr) => `The porcupine curls into a ball. ${n} tries to roll it toward the cage. It doesn't roll. It just sits there, pointy.`,
      ],
      mishap: [
        (n, pr) => `${n} grabs the porcupine without thinking. ${pr.Sub} ${pr.sub==='they'?'immediately':'immediately'} regrets it. ${pr.Sub} ${pr.sub==='they'?'spend':'spends'} the next twenty minutes pulling quills out of ${pr.posAdj} hand.`,
        (n, pr) => `${n} trips while carrying the porcupine. ${pr.Sub} ${pr.sub==='they'?'reach':'reaches'} out to break ${pr.posAdj} fall and grabs the porcupine instead. There are quills in places quills should never be.`,
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
    {
      id: 'wild-turkey', name: 'Wild Turkey', tier: 'hard',
      statWeights: { physical: 0.04, endurance: 0.03, boldness: 0.03 },
      mishapWeight: 0.45,
      draw: {
        happy: [
          (n, pr) => `${n} draws Wild Turkey. "Okay. It's basically a chicken. A big angry chicken, but still."`,
        ],
        nervous: [
          (n, pr) => `"Wild Turkey." ${n} frowns. "Those things have spurs. And a temper."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} herds the turkey away from its flock using a long stick, corners it against a log, and drops the net. Got it.`,
        (n, pr) => `${n} spots the turkey gobbling alone by the treeline and moves with it for ten minutes before getting the bag over it. Patience.`,
      ],
      attemptFail: [
        (n, pr) => `The turkey puffs up to twice its size and charges. ${n} stumbles backward. When ${pr.sub} ${pr.sub==='they'?'get':'gets'} up, the turkey is gone.`,
        (n, pr) => `${n} gets the net over the turkey. The turkey runs through it. It was not a good net.`,
      ],
      mishap: [
        (n, pr) => `${n} spooked the turkey into the flock. All twelve turkeys charge at once. ${n} sprints for the nearest tree and doesn't come down for a while.`,
        (n, pr) => `The turkey scratches ${pr.obj} with its spurs and takes off. ${pr.Sub} ${pr.sub==='they'?'are':'is'} bleeding slightly and turkeyless.`,
        (n, pr) => `${n} grabs the turkey. The turkey takes off, wings beating, and briefly becomes airborne with ${n} still holding on before both crash into a bush.`,
      ],
    },
    {
      id: 'owl', name: 'Owl', tier: 'hard',
      statWeights: { intuition: 0.05, mental: 0.04, strategic: 0.02 },
      mishapWeight: 0.40,
      draw: {
        happy: [
          (n, pr) => `${n} draws Owl. "Owls are wise. I'm wise. We'll understand each other."`,
        ],
        nervous: [
          (n, pr) => `"Owl." ${n} squints at the slip. "Do those things... sleep during the day? Where even are they?"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} tracks down a hollow log and waits. An hour later the owl emerges at dusk and ${pr.sub} ${pr.sub==='they'?'have':'has'} it.`,
        (n, pr) => `${n} finds the owl roosting in a pine and uses a long-handled net to capture it before it can take flight. Clean.`,
      ],
      attemptFail: [
        (n, pr) => `The owl watches ${n} approach from sixty feet away, then silently lifts off before ${pr.sub} ${pr.sub==='they'?'get':'gets'} within thirty. Invisible and gone.`,
        (n, pr) => `${n} finds the perch. The owl isn't on it anymore. It moved. ${pr.Sub} ${pr.sub==='they'?'have':'has'} no idea when.`,
      ],
      mishap: [
        (n, pr) => `${n} reaches toward the owl. It rotates its head 180 degrees and stares directly into ${pr.posAdj} soul. ${n} drops the net and backs away slowly.`,
        (n, pr) => `${n} nets the owl. The owl grabs ${pr.posAdj} wrist with its talons. Both are now stuck. The owl is angrier about it.`,
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
    {
      id: 'wolf', name: 'Wolf', tier: 'extreme',
      statWeights: { boldness: 0.05, strategic: 0.04, physical: 0.03 },
      mishapWeight: 0.65,
      draw: {
        happy: [
          (n, pr) => `${n} draws Wolf. ${pr.Sub} ${pr.sub==='they'?'go':'goes'} very still. "...Okay. Fine."`,
        ],
        nervous: [
          (n, pr) => `"WOLF?!" ${n} looks at Chris. Chris shrugs. ${n} looks back at the slip. "There are wolves on this island?!"`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} spends an hour sitting motionless by the treeline, letting the wolf approach on its own terms. When it's close enough, ${pr.sub} ${pr.sub==='they'?'drop':'drops'} the net in one motion.`,
        (n, pr) => `${n} tracks the lone wolf away from its pack and herds it toward a deadfall. The wolf is not happy about it, but it's contained.`,
      ],
      attemptFail: [
        (n, pr) => `The wolf sniffs the air, locks eyes with ${n}, and melts silently back into the trees. ${n} didn't even see it go.`,
        (n, pr) => `${n} approaches. The wolf shows its teeth. ${n} backs up slowly. The wolf does not follow. This time.`,
      ],
      mishap: [
        (n, pr) => `${n} didn't realize the wolf had a pack. Five more emerge from the trees. ${n} runs. They don't chase, but they don't have to.`,
        (n, pr) => `The wolf howls once. ${n} freezes. Far away, something howls back. ${n} decides this isn't worth it and retreats at speed.`,
        (n, pr) => `${n} gets the net over the wolf. The wolf bites through the net in about four seconds flat. Then it looks at ${n}. ${n} runs.`,
      ],
    },
    {
      id: 'alligator', name: 'Alligator', tier: 'extreme',
      statWeights: { boldness: 0.05, physical: 0.04, endurance: 0.03 },
      mishapWeight: 0.70,
      draw: {
        happy: [
          (n, pr) => `${n} draws Alligator. The room goes completely silent. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around. "Is everyone else as scared as I am right now?"`,
        ],
        nervous: [
          (n, pr) => `"ALLIGATOR." ${n} holds up the slip. "I am not doing this." Chris stares. ${n} sighs. "...I'm doing this."`,
        ],
      },
      attemptSuccess: [
        (n, pr) => `${n} finds the alligator sunning on the bank, gets low, and creeps up from behind. One rope around the snout — it's over. ${pr.Sub} ${pr.sub==='they'?'are':'is'} shaking, but it's over.`,
        (n, pr) => `${n} wades in from the far side and herds the gator toward the bank where the cage is waiting. A plan that required enormous nerve and even more luck.`,
      ],
      attemptFail: [
        (n, pr) => `The alligator opens its mouth. ${n} has seen enough nature documentaries to know what that means. ${pr.Sub} ${pr.sub==='they'?'back':'backs'} away slowly.`,
        (n, pr) => `${n} gets close. The alligator lunges twelve inches. ${n} doesn't stop running for about fifty meters.`,
      ],
      mishap: [
        (n, pr) => `${n} trips on the muddy bank and slides within three feet of the alligator. The alligator opens its mouth. ${n} does not have a plan.`,
        (n, pr) => `${n} gets the rope around the snout. The alligator rolls. ${n} goes into the water. The rope is gone. The alligator is free. ${n} swims for ${pr.posAdj} life.`,
        (n, pr) => `${n} approaches from the water side. There's a second alligator underneath ${pr.obj}. ${n} discovers this when it surfaces.`,
      ],
    },
  ],
};

// ── RANGER FACTS (ticker content) ──
const RANGER_FACTS = [
  '🐻 BEARS CAN RUN 35 MPH — DO NOT RUN IN A STRAIGHT LINE',
  '🦌 DEER HAVE 310° VISION — APPROACH FROM DOWNWIND',
  '🦝 RACCOONS CAN OPEN LOCKS — CONSIDER DUCT TAPE',
  '🐿️ CHIPMUNKS CAN STORE 165 ACORNS IN ONE TRIP — BRIBERY IS VIABLE',
  '🐸 FROGS BREATHE THROUGH THEIR SKIN — DO NOT APPLY SUNSCREEN FIRST',
  '🦫 BEAVER TEETH NEVER STOP GROWING — DO NOT LET THEM CHEW YOU',
  '🐍 SNAKES SENSE HEAT — APPROACH AT NIGHT OR BE VERY COOL',
  '🐰 RABBITS CAN LEAP 9 FEET — WIDEN YOUR STANCE',
  '🦆 DUCKS HAVE THREE EYELIDS — THE THIRD ONE SEES YOU',
  '🦢 GEESE HAVE NO NATURAL PREDATORS ON THIS ISLAND — ACT ACCORDINGLY',
  '🦌 MOOSE CAN OUTSWIM MOST BOATS — DO NOT GET IN A BOAT',
  '💉 TRANQUILIZER DARTS TAKE 4–10 SECONDS — AIM AHEAD',
  '📡 SIGNAL: WAWANAKWA FIELD CAM BROADCASTING LIVE',
  '⚠️ DISCLAIMER: PRODUCTION NOT RESPONSIBLE FOR BEAR-RELATED INJURIES',
  '🏕️ WAWANAKWA ISLAND — ESTABLISHED 2007 — POPULATION: DWINDLING',
  '🎯 CATCHING YOUR ANIMAL DOES NOT GUARANTEE SURVIVAL AT TRIBAL',
  '🚽 COMMUNAL BATHROOMS LAST CLEANED: UNKNOWN',
  '📋 SCORING: EARLIER IS BETTER. LAST PLACE IS WORSE.',
  '🦝 FUN FACT: RACCOONS FORM STRATEGIC ALLIANCES',
  '🐻 BEARS EAT 20,000 CALORIES/DAY — YOU HAVE NONE',
];

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
  const TIER_ORDER = ['easy', 'medium', 'hard', 'extreme'];

  activePlayers.forEach((name, i) => {
    const tier = difficulties[i];
    // Try assigned tier first, then adjacent tiers — never allow duplicates
    let animal = null;
    const searchOrder = [tier, ...TIER_ORDER.filter(t => t !== tier)];
    for (const t of searchOrder) {
      const pool = ANIMALS[t].filter(a => !usedAnimals.has(a.id));
      if (pool.length) { animal = _rp(pool); break; }
    }
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
// VP STYLES
// ══════════════════════════════════════════════════════════════
const WW_STYLES = `
  /* ═══ WAWANAKWA GONE WILD — WILDLIFE FIELD CAM THEME ═══
     Identity: Ranger station field camera. Khaki/bark brown palette.
     Binocular vignette, "FIELD CAM" recording indicator, paw-print
     texture, specimen-label cards, earthy worn-paper backgrounds.
     Distinct from: night-vision (green CRT), motocross (orange fire),
     pirate (parchment/gold), dungeon (stone), cafeteria (tile).
  */

  /* ── Page & Chrome: worn field notebook on bark ── */
  .ww-page { background:#1c1710; color:#d4c8a8;
    font-family:'Georgia','Times New Roman',serif; position:relative; overflow:hidden;
    padding:24px 16px; min-height:400px; }
  .ww-page::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%),
      repeating-linear-gradient(90deg, rgba(139,119,80,0.03) 0px, rgba(139,119,80,0.03) 1px, transparent 1px, transparent 6px);
    opacity:0.7; }
  .ww-page::after { content:'🐾'; position:absolute; top:12px; right:14px; font-size:40px; opacity:0.06;
    z-index:0; pointer-events:none; transform:rotate(-20deg); }

  /* ── Field Cam Header ── */
  .ww-header { position:relative; z-index:2; margin-bottom:8px; padding:12px 0 10px;
    border-bottom:2px solid rgba(139,119,80,0.3); }
  .ww-cam-bar { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .ww-rec { display:inline-block; width:8px; height:8px; border-radius:50%; background:#c33;
    animation: ww-rec-blink 1.5s infinite; }
  @keyframes ww-rec-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
  .ww-cam-label { font-family:'Courier New',monospace; font-size:10px; font-weight:700;
    letter-spacing:2px; color:#c33; text-transform:uppercase; }
  .ww-cam-loc { font-family:'Courier New',monospace; font-size:9px; color:#8b7750; letter-spacing:1px; margin-left:auto; }
  .ww-title { font-family:var(--font-display,'Impact',sans-serif); font-size:22px; font-weight:800;
    letter-spacing:3px; text-transform:uppercase; color:#c8a84e;
    text-shadow:0 1px 3px rgba(0,0,0,0.6); }
  .ww-subtitle { font-size:11px; color:#8b7750; letter-spacing:0.3px; margin-top:4px; font-style:italic; }

  /* ── Status Tracker (sticky ranger clipboard) ── */
  .ww-tracker { position:sticky; top:0; z-index:10; display:flex; justify-content:center; gap:16px;
    background:rgba(28,23,16,0.95); backdrop-filter:blur(6px); padding:8px 12px; margin:0 -16px 16px;
    border-bottom:2px solid rgba(139,119,80,0.25); font-family:'Courier New',monospace;
    font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .ww-tracker-item { display:flex; align-items:center; gap:4px; }
  .ww-tracker-item--hunting { color:#c8a84e; }
  .ww-tracker-item--captured { color:#6a9f3a; }
  .ww-tracker-item--failed { color:#c33; }
  .ww-count { display:inline-block; min-width:16px; text-align:center; }
  @keyframes ww-count-flash { 0%{color:#fff;transform:scale(1.4)} 100%{color:inherit;transform:scale(1)} }
  .ww-count-flash { animation: ww-count-flash 0.4s ease-out; }

  /* ── Cards: specimen report / field note style ── */
  .ww-card { position:relative; z-index:2; padding:10px 14px; margin-bottom:6px;
    border-radius:4px; border:1px solid rgba(139,119,80,0.2); border-left:3px solid var(--ww-accent,#8b7750);
    background:rgba(40,34,24,0.6); animation: ww-slide-in 0.35s ease-out both; }
  @keyframes ww-slide-in { 0%{opacity:0;transform:translateX(-12px)} 100%{opacity:1;transform:translateX(0)} }
  .ww-card-label { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    letter-spacing:1px; color:var(--ww-accent,#8b7750); margin-bottom:4px; text-transform:uppercase; }
  .ww-card-body { font-size:12px; color:#d4c8a8; line-height:1.55; }
  .ww-card-footer { font-family:'Courier New',monospace; font-size:9px; color:#8b7750; margin-top:4px; }

  /* Card variants */
  .ww-card--mishap { animation: ww-slide-in 0.35s ease-out both, ww-shake 0.4s 0.35s both; }
  @keyframes ww-shake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-3px)} 30%,60%,90%{transform:translateX(3px)} }
  .ww-card--tranq { border-color:rgba(204,51,51,0.5); background:rgba(204,51,51,0.08); }
  .ww-card--feast { border-color:rgba(200,168,78,0.5); background:rgba(200,168,78,0.08); }
  .ww-card--punish { border-color:rgba(204,51,51,0.5); background:rgba(204,51,51,0.08); }
  @keyframes ww-pulse-gold { 0%,100%{box-shadow:0 0 4px rgba(200,168,78,0.1)} 50%{box-shadow:0 0 18px rgba(200,168,78,0.4)} }
  @keyframes ww-pulse-red { 0%,100%{box-shadow:0 0 4px rgba(204,51,51,0.1)} 50%{box-shadow:0 0 18px rgba(204,51,51,0.4)} }

  /* ── Section Markers: field notebook divider ── */
  .ww-section { font-family:'Courier New',monospace; font-size:11px; font-weight:800; letter-spacing:3px;
    color:#c8a84e; text-transform:uppercase; margin:20px 0 10px;
    border-top:2px dashed rgba(139,119,80,0.25); padding-top:14px; position:relative; z-index:2; }

  /* ── Slot-machine Reel (animal draw) ── */
  .ww-reel { position:relative; width:160px; height:26px; overflow:hidden; display:inline-block; vertical-align:middle;
    background:rgba(0,0,0,0.5); border:1px solid rgba(200,168,78,0.4); border-radius:4px; margin:0 8px; }
  .ww-reel-window { position:absolute; top:0; left:0; right:0; bottom:0; z-index:2; pointer-events:none;
    background:linear-gradient(to bottom, rgba(28,23,16,0.8) 0%, transparent 25%, transparent 75%, rgba(28,23,16,0.8) 100%); }
  .ww-reel-strip { position:absolute; left:0; right:0; top:0; display:flex; flex-direction:column;
    animation: ww-slot-spin 1.4s cubic-bezier(0.2,0.9,0.3,1) both; }
  .ww-reel-strip > div { height:26px; line-height:26px; text-align:center; font-size:11px;
    color:#d4c8a8; font-weight:600; white-space:nowrap; }
  @keyframes ww-slot-spin {
    0%   { transform:translateY(var(--reel-start,0px)); filter:blur(2px); }
    70%  { filter:blur(1px); }
    100% { transform:translateY(var(--reel-final,0px)); filter:blur(0); }
  }

  /* ── Stamp: ranger field mark ── */
  .ww-stamp { display:inline-block; padding:3px 10px; border:3px solid currentColor; border-radius:3px;
    font-family:'Courier New',monospace; font-size:12px; font-weight:900; letter-spacing:2px;
    text-transform:uppercase; transform:rotate(-6deg) scale(1); transform-origin:center;
    animation: ww-stamp-slam 0.5s ease-out both; }
  @keyframes ww-stamp-slam {
    0%   { transform:rotate(-6deg) scale(3.5); opacity:0; }
    55%  { transform:rotate(-6deg) scale(0.9); opacity:1; }
    75%  { transform:rotate(-6deg) scale(1.05); }
    100% { transform:rotate(-6deg) scale(1); opacity:1; }
  }

  /* ── Tier Badges: specimen danger level ── */
  .ww-tier { display:inline-block; padding:1px 6px; border-radius:3px; font-family:'Courier New',monospace;
    font-size:9px; font-weight:700; letter-spacing:0.5px; }
  .ww-tier--easy { background:rgba(106,159,58,0.2); color:#6a9f3a; }
  .ww-tier--medium { background:rgba(200,168,78,0.2); color:#c8a84e; }
  .ww-tier--hard { background:rgba(204,51,51,0.2); color:#c33; }
  .ww-tier--extreme { background:rgba(160,50,50,0.25); color:#e04040; border:1px solid rgba(204,51,51,0.3); }

  /* ── Gear Card: boathouse crate ── */
  .ww-gear-card { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:4px;
    background:rgba(80,60,30,0.2); border:1px solid rgba(139,119,80,0.3); animation: ww-gear-tumble 0.7s ease-out both; }
  @keyframes ww-gear-tumble { 0%{opacity:0;transform:rotate(-90deg) translateY(-20px)} 60%{transform:rotate(5deg) translateY(2px)} 100%{opacity:1;transform:rotate(0) translateY(0)} }
  .ww-gear-card--armed { border-color:rgba(204,51,51,0.4); background:rgba(204,51,51,0.1); }

  /* ── Player Tiles: ranger ID cards ── */
  .ww-player-tile { padding:8px 10px; border-radius:4px; background:rgba(40,34,24,0.5);
    border:1px solid rgba(139,119,80,0.15); border-left:3px solid var(--tile-tier-color,#8b7750);
    font-size:10px; transition:transform 0.15s; }
  .ww-player-tile:hover { transform:translateY(-2px); border-color:rgba(139,119,80,0.35); }
  .ww-progress-bar { height:4px; border-radius:2px; background:rgba(139,119,80,0.15); overflow:hidden; margin-top:4px; }
  .ww-progress-fill { height:100%; border-radius:2px; animation: ww-fill-bar 0.8s ease-out both; }
  @keyframes ww-fill-bar { 0%{width:0%} 100%{width:var(--target-width,0%)} }

  /* ── Tranq Dart Animation ── */
  .ww-dart { display:inline-block; animation: ww-dart-fly 0.3s ease-out both; }
  @keyframes ww-dart-fly { 0%{opacity:0;transform:translateX(-40px) rotate(-15deg)} 100%{opacity:1;transform:translateX(0) rotate(0)} }

  /* ── Crosshair (hunt phases) ── */
  .ww-crosshair { display:inline-block; animation: ww-crosshair-spin 8s linear infinite; font-size:14px; }
  @keyframes ww-crosshair-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* ── Feast Reveal: parting leaves ── */
  .ww-curtain-wrap { position:relative; padding:24px 0; min-height:160px; overflow:hidden; border-radius:6px; margin:8px 0;
    background:rgba(40,34,24,0.4); }
  .ww-curtain-wrap::before, .ww-curtain-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:50%; z-index:5;
    background:repeating-linear-gradient(45deg, #2a2218 0px, #2a2218 8px, #332a1e 8px, #332a1e 16px); }
  .ww-curtain-wrap::before { left:0;  animation: ww-curtain-left  1s ease-in-out forwards; }
  .ww-curtain-wrap::after  { right:0; animation: ww-curtain-right 1s ease-in-out forwards; }
  @keyframes ww-curtain-left  { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
  @keyframes ww-curtain-right { 0%{transform:translateX(0)} 100%{transform:translateX(100%)} }

  .ww-spotlight { position:relative; z-index:6; text-align:center; padding-top:8px;
    background:radial-gradient(ellipse at 50% 40%, rgba(200,168,78,0.2) 0%, transparent 70%); }
  .ww-trophy-wrap { animation: ww-trophy-bounce 0.8s ease-out 1s both; display:inline-block; }
  @keyframes ww-trophy-bounce { 0%{opacity:0;transform:translateY(30px) scale(0.8)} 50%{transform:translateY(-6px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }

  /* ── Camera Shake ── */
  .ww-camera-shake { animation: ww-camera-shake 0.4s; }
  @keyframes ww-camera-shake {
    0%,100% { transform:translate(0,0); }
    15%  { transform:translate(-3px, 2px); }
    30%  { transform:translate(3px,-2px); }
    45%  { transform:translate(-2px,-3px); }
    60%  { transform:translate(2px, 3px); }
    75%  { transform:translate(-3px, 1px); }
    90%  { transform:translate(3px,-1px); }
  }

  /* ── Reveal Controls: ranger station buttons ── */
  .ww-btn-reveal { background:rgba(106,159,58,0.1); border:1px solid rgba(106,159,58,0.3); color:#6a9f3a;
    padding:8px 20px; border-radius:4px; cursor:pointer; font-family:'Courier New',monospace;
    font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:12px auto; display:block;
    animation: ww-btn-pulse 2s infinite; }
  .ww-btn-reveal:hover { background:rgba(106,159,58,0.2); }
  @keyframes ww-btn-pulse { 0%,100%{box-shadow:0 0 5px rgba(106,159,58,0.1)} 50%{box-shadow:0 0 15px rgba(106,159,58,0.3)} }
  .ww-btn-reveal-all { display:block; text-align:center; font-size:10px; color:#8b7750; cursor:pointer;
    text-decoration:underline; margin-top:4px; font-family:'Courier New',monospace; }
  .ww-btn-reveal-all:hover { color:#b89f6e; }

  /* ── Results Table: field report ── */
  .ww-results-table { width:100%; border-collapse:collapse; font-size:11px; margin-top:12px; }
  .ww-results-table th { text-align:left; color:#c8a84e; font-family:'Courier New',monospace;
    font-size:9px; font-weight:700; letter-spacing:1px;
    text-transform:uppercase; padding:4px 8px; border-bottom:2px solid rgba(139,119,80,0.25); }
  .ww-results-table td { padding:6px 8px; color:#d4c8a8; border-bottom:1px solid rgba(139,119,80,0.1); }
  .ww-results-table tr.ww-row-winner { background:rgba(200,168,78,0.08); }
  .ww-results-table tr.ww-row-loser { background:rgba(204,51,51,0.06); }

  /* ══ WOW-PASS ADDITIONS ══ */

  /* Ticker marquee */
  .ww-ticker { position:relative; overflow:hidden; height:22px; margin:0 -16px 10px;
    background:linear-gradient(to right, rgba(200,168,78,0.12), rgba(200,168,78,0.04), rgba(200,168,78,0.12));
    border-top:1px solid rgba(200,168,78,0.25); border-bottom:1px solid rgba(200,168,78,0.25); z-index:2; }
  .ww-ticker-inner { position:absolute; white-space:nowrap; top:0; left:0; height:22px; line-height:22px;
    font-family:'Courier New',monospace; font-size:10px; color:#c8a84e; letter-spacing:1px;
    animation: ww-ticker-scroll 34s linear infinite; }
  @keyframes ww-ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  /* Walkie signal gauge */
  .ww-signal { position:relative; width:58px; height:34px; overflow:hidden; display:inline-block;
    vertical-align:middle; flex-shrink:0; }
  .ww-signal-arc { position:absolute; inset:0 0 -28px 0;
    background: conic-gradient(from 270deg, #6a9f3a 0deg, #c8a84e 60deg, #c33 120deg, transparent 120deg);
    border-radius:50%; opacity:0.35; }
  .ww-signal-needle { position:absolute; bottom:0; left:50%; width:2px; height:26px;
    background:#c33; transform-origin:bottom center; transform:rotate(-60deg); }
  .ww-signal-needle.ww-signal-rev { animation: ww-signal-pulse 0.9s cubic-bezier(0.2,0.8,0.3,1) both; }
  @keyframes ww-signal-pulse {
    0%   { transform: rotate(-60deg); }
    35%  { transform: rotate(55deg); }
    100% { transform: rotate(-60deg); }
  }
  .ww-signal-label { position:absolute; bottom:-3px; left:0; right:0; text-align:center;
    font-family:'Courier New',monospace; font-size:7px; letter-spacing:1px; color:#8b7750; }

  /* Dart projectile trail */
  .ww-dart-canvas { position:absolute; inset:0; pointer-events:none; z-index:4; width:100%; height:100%; }
  .ww-evidence-line--tranq { stroke:#c33; stroke-width:2; stroke-dasharray:5 3; fill:none;
    stroke-dashoffset:200; animation: ww-dart-draw 0.5s ease-out forwards; }
  @keyframes ww-dart-draw { to { stroke-dashoffset:0; } }
  .ww-dart-impact { position:absolute; font-size:20px; z-index:5; pointer-events:none;
    animation: ww-dart-impact 0.5s ease-out 0.5s both; transform:translate(-50%,-50%); }
  @keyframes ww-dart-impact {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.3); }
    50%  { opacity:1; transform:translate(-50%,-50%) scale(1.4); }
    100% { opacity:0.7; transform:translate(-50%,-50%) scale(1); }
  }

  /* Mishap spectacle */
  .ww-mishap-stage { position:relative; }
  .ww-mishap-particle { position:absolute; top:50%; left:50%; font-size:14px; pointer-events:none;
    opacity:0; z-index:3;
    animation: ww-mishap-burst 0.9s ease-out both;
    animation-delay: var(--mdelay, 0ms); }
  @keyframes ww-mishap-burst {
    0%   { opacity:0; transform:translate(0,0) rotate(0) scale(0.3); }
    30%  { opacity:1; transform:translate(calc(var(--mx,0) * 0.4), calc(var(--my,0) * 0.4)) rotate(calc(var(--mrot,0) * 0.4)) scale(1.2); }
    100% { opacity:0; transform:translate(var(--mx,0), calc(var(--my,0) + 20px)) rotate(var(--mrot,0)) scale(0.7); }
  }

  /* Round-separator tannoy */
  .ww-tannoy { position:relative; margin:20px 0 12px; padding:14px 16px; border-radius:6px;
    background:linear-gradient(135deg, rgba(200,168,78,0.10), rgba(80,60,30,0.15));
    border:1px solid rgba(200,168,78,0.3); border-left:4px solid #c8a84e;
    animation: ww-tannoy-slide 0.5s ease-out both; z-index:2; }
  @keyframes ww-tannoy-slide {
    0%   { opacity:0; transform:translateX(-16px); }
    100% { opacity:1; transform:translateX(0); }
  }
  .ww-tannoy-badge { display:inline-block; font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    letter-spacing:2px; color:#c8a84e; padding:2px 8px; border:1px solid rgba(200,168,78,0.4);
    border-radius:3px; background:rgba(200,168,78,0.08); text-transform:uppercase; }
  .ww-tannoy-title { font-family:'Impact',sans-serif; font-size:20px; font-weight:800;
    letter-spacing:3px; color:#d4c8a8; margin-top:6px; text-transform:uppercase;
    animation: ww-tannoy-title-in 0.4s ease-out 0.15s both; }
  @keyframes ww-tannoy-title-in { 0%{opacity:0;letter-spacing:0} 100%{opacity:1;letter-spacing:3px} }
  .ww-tannoy-census { font-family:'Courier New',monospace; font-size:10px; color:#8b7750; letter-spacing:1.5px;
    margin-top:4px; animation: ww-tannoy-census-in 0.4s ease-out 0.5s both; }
  @keyframes ww-tannoy-census-in { 0%{opacity:0} 100%{opacity:1} }

  /* Animal-tier backdrops */
  .ww-tier-bg { position:relative; border-radius:6px; padding:0; margin-bottom:6px; overflow:hidden; }
  .ww-tier-bg::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:0.2; }
  .ww-tier-bg > * { position:relative; z-index:2; }
  .ww-tier-bg--easy::before {
    background:
      radial-gradient(ellipse 40px 22px at 15% 30%, rgba(106,159,58,0.5) 0%, transparent 70%),
      radial-gradient(ellipse 50px 20px at 70% 60%, rgba(106,159,58,0.4) 0%, transparent 70%),
      radial-gradient(ellipse 30px 18px at 40% 85%, rgba(106,159,58,0.4) 0%, transparent 70%);
    animation: ww-rustle 4.5s ease-in-out infinite; }
  @keyframes ww-rustle { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
  .ww-tier-bg--medium::before {
    background:
      radial-gradient(circle at 20% 30%, rgba(200,168,78,0.35) 0%, transparent 18%),
      radial-gradient(circle at 65% 70%, rgba(200,168,78,0.3) 0%, transparent 18%),
      radial-gradient(circle at 85% 20%, rgba(200,168,78,0.3) 0%, transparent 18%),
      radial-gradient(circle at 45% 55%, rgba(200,168,78,0.25) 0%, transparent 18%);
    animation: ww-dapple 2.8s ease-in-out infinite; }
  @keyframes ww-dapple { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
  .ww-tier-bg--hard::before {
    background:repeating-linear-gradient(135deg,
      rgba(204,51,51,0.12) 0px, rgba(204,51,51,0.12) 8px,
      transparent 8px, transparent 16px);
    animation: ww-heat-ripple 2s ease-in-out infinite; }
  @keyframes ww-heat-ripple { 0%,100%{transform:skewX(0deg)} 50%{transform:skewX(-1deg)} }
  .ww-tier-bg--extreme::before {
    background:
      repeating-conic-gradient(from 0deg at 50% 50%,
        rgba(160,50,50,0.25) 0deg 2deg,
        transparent 2deg 8deg),
      linear-gradient(135deg, rgba(50,20,30,0.4), rgba(20,10,15,0.5));
    animation: ww-electric-crackle 0.6s steps(4, end) infinite; }
  @keyframes ww-electric-crackle { 0%{opacity:0.35} 25%{opacity:0.7} 50%{opacity:0.2} 75%{opacity:0.6} 100%{opacity:0.35} }

  /* Feast food spread */
  .ww-food-spread { position:relative; height:140px; margin-top:-12px; pointer-events:none; }
  .ww-food-item { position:absolute; top:0; left:50%; font-size:30px; z-index:5;
    animation: ww-food-float 0.8s cubic-bezier(0.2,0.8,0.3,1) both;
    animation-delay: var(--float-delay, 0ms); }
  @keyframes ww-food-float {
    0%   { opacity:0; transform:translate(-50%, 0) scale(0.3); }
    70%  { opacity:1; transform:translate(calc(-50% + var(--x, 0)), calc(var(--y, 0) - 6px)) scale(1.15); }
    100% { opacity:1; transform:translate(calc(-50% + var(--x, 0)), var(--y, 0)) scale(1); }
  }

  /* Honor Roll podium */
  .ww-podium { display:flex; align-items:flex-end; justify-content:center; gap:10px;
    margin:18px 0 8px; min-height:220px; z-index:2; position:relative; }
  .ww-podium-plinth { flex:0 0 auto; width:100px; display:flex; flex-direction:column; align-items:center;
    animation: ww-trophy-bounce 0.7s ease-out both; }
  .ww-podium-plinth[data-rank="1"] { order:2; }
  .ww-podium-plinth[data-rank="2"] { order:1; animation-delay:0.2s; }
  .ww-podium-plinth[data-rank="3"] { order:3; animation-delay:0.4s; }
  .ww-podium-portrait { margin-bottom:4px; }
  .ww-podium-name { font-family:'Courier New',monospace; font-size:11px; font-weight:700;
    color:#d4c8a8; letter-spacing:0.5px; text-align:center; margin-bottom:2px; }
  .ww-podium-stat { font-family:'Courier New',monospace; font-size:9px; color:#8b7750; margin-bottom:6px; text-align:center; }
  .ww-podium-block { width:100%; border-top:3px solid; display:flex; align-items:center;
    justify-content:center; font-size:24px; font-weight:900;
    background:
      repeating-linear-gradient(90deg, rgba(80,55,30,0.3) 0 3px, rgba(60,40,20,0.3) 3px 6px),
      linear-gradient(to top, rgba(139,90,43,0.8), rgba(100,65,30,0.5));
    border-color:#8b5a2b; }
  .ww-podium-plinth[data-rank="1"] .ww-podium-block { height:130px; border-color:#c8a84e; }
  .ww-podium-plinth[data-rank="2"] .ww-podium-block { height:95px; border-color:#c0c0c0; }
  .ww-podium-plinth[data-rank="3"] .ww-podium-block { height:70px; border-color:#cd7f32; }

  /* Evidence board (alliance + tranq summaries) */
  .ww-evidence-board { position:relative; padding:20px 12px; border-radius:6px; margin-top:10px;
    background:
      radial-gradient(circle at 20% 30%, rgba(160,100,50,0.22) 0%, transparent 2%),
      radial-gradient(circle at 70% 65%, rgba(160,100,50,0.18) 0%, transparent 2%),
      radial-gradient(circle at 45% 80%, rgba(160,100,50,0.15) 0%, transparent 2%),
      radial-gradient(circle at 85% 25%, rgba(160,100,50,0.18) 0%, transparent 2%),
      linear-gradient(135deg, rgba(120,80,40,0.35), rgba(80,50,25,0.45));
    border:2px solid rgba(160,100,50,0.45); min-height:130px; }
  .ww-evidence-pin { position:relative; padding-top:8px; }
  .ww-evidence-pin::before {
    content:''; position:absolute; top:-2px; left:50%; transform:translateX(-50%);
    width:10px; height:10px; border-radius:50%;
    background: radial-gradient(circle at 35% 35%, #c8a84e 0%, #8b5a2b 70%);
    box-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index:4; }
  .ww-evidence-svg { position:absolute; inset:0; pointer-events:none; z-index:2; }
  .ww-evidence-line--help { stroke:#6a9f3a; stroke-width:2; stroke-dasharray:6 4; fill:none;
    stroke-dashoffset:200; animation: ww-evidence-draw 1.2s ease-out forwards; }
  .ww-evidence-line--reject { stroke:#8b7750; stroke-width:2; stroke-dasharray:3 5; fill:none;
    stroke-dashoffset:200; animation: ww-evidence-draw 1.2s ease-out forwards; }
  .ww-evidence-line--backfire { stroke:#c33; stroke-width:2; stroke-dasharray:8 2; fill:none;
    stroke-dashoffset:200; animation: ww-evidence-draw 1.2s ease-out forwards; }
  @keyframes ww-evidence-draw { to { stroke-dashoffset:0; } }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .ww-card, .ww-card--mishap, .ww-reel-strip, .ww-stamp, .ww-gear-card,
    .ww-dart, .ww-crosshair, .ww-curtain-wrap::before, .ww-curtain-wrap::after,
    .ww-trophy-wrap, .ww-progress-fill, .ww-camera-shake, .ww-btn-reveal,
    .ww-count-flash, .ww-rec,
    .ww-ticker-inner, .ww-signal-needle, .ww-signal-needle.ww-signal-rev,
    .ww-mishap-particle, .ww-tannoy, .ww-tannoy-title, .ww-tannoy-census,
    .ww-tier-bg--easy::before, .ww-tier-bg--medium::before,
    .ww-tier-bg--hard::before, .ww-tier-bg--extreme::before,
    .ww-food-item, .ww-podium-plinth,
    .ww-evidence-line--help, .ww-evidence-line--reject, .ww-evidence-line--backfire,
    .ww-evidence-line--tranq, .ww-dart-impact { animation:none !important; }
    .ww-reel-strip { transform:translateY(var(--reel-final,0px)) !important; filter:none !important; }
    .ww-food-item { opacity:1 !important; transform:translate(calc(-50% + var(--x,0)), var(--y,0)) !important; }
    .ww-evidence-line--help, .ww-evidence-line--reject, .ww-evidence-line--backfire,
    .ww-evidence-line--tranq { stroke-dashoffset:0 !important; }
  }
`;

// ══════════════════════════════════════════════════════════════
// REVEAL ENGINE
// ══════════════════════════════════════════════════════════════
function _wwReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`ww-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Camera shake: scoped to el only (NOT .ww-page — transform breaks sticky tracker)
    if (el.dataset.cameraShake === '1') {
      el.classList.add('ww-camera-shake');
      setTimeout(() => el.classList.remove('ww-camera-shake'), 400);
    }

    // Walkie signal needle pulse on every reveal
    const needle = document.getElementById(`ww-signal-needle-${stateKey}`);
    if (needle) {
      needle.classList.remove('ww-signal-rev');
      void needle.offsetWidth;
      needle.classList.add('ww-signal-rev');
    }

    // Dart trail: draw SVG line + impact emoji between shooter and victim portraits
    const tranqPair = el.dataset.tranqPair;
    if (tranqPair) {
      const [shooterId, victimId] = tranqPair.split('|');
      const shooterEl = el.querySelector(`[data-player-id="${CSS.escape(shooterId)}"]`);
      const victimEl  = el.querySelector(`[data-player-id="${CSS.escape(victimId)}"]`);
      if (shooterEl && victimEl) {
        const elRect = el.getBoundingClientRect();
        const sRect  = shooterEl.getBoundingClientRect();
        const vRect  = victimEl.getBoundingClientRect();
        const x1 = sRect.left - elRect.left + sRect.width  / 2;
        const y1 = sRect.top  - elRect.top  + sRect.height / 2;
        const x2 = vRect.left - elRect.left + vRect.width  / 2;
        const y2 = vRect.top  - elRect.top  + vRect.height / 2;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.className = 'ww-dart-canvas';
        svg.setAttribute('viewBox', `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'ww-evidence-line--tranq');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        svg.appendChild(line);
        el.style.position = 'relative';
        el.appendChild(svg);
        const impact = document.createElement('div');
        impact.className = 'ww-dart-impact';
        impact.textContent = '💉';
        impact.style.left = `${x2}px`;
        impact.style.top  = `${y2}px`;
        el.appendChild(impact);
      }
    }

    // Update status tracker counters
    ['hunting', 'captured', 'failed'].forEach(key => {
      const delta = parseInt(el.dataset[key + 'Delta'] || '0', 10);
      if (delta) {
        const span = document.getElementById(`ww-count-${stateKey}-${key}`);
        if (span) {
          span.textContent = parseInt(span.textContent || '0', 10) + delta;
          span.classList.remove('ww-count-flash');
          void span.offsetWidth;
          span.classList.add('ww-count-flash');
          setTimeout(() => span.classList.remove('ww-count-flash'), 400);
        }
      }
    });
  }

  // Update button
  const btn = document.getElementById(`ww-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`ww-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
      const ep = gs.episodeHistory.find(e => e.num === parseInt(stateKey.replace('ww_reveal_', ''), 10));
      if (ep) { buildVPScreens(ep); renderVPScreen(); }
    } else {
      btn.textContent = `▶ NEXT EVENT (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _wwRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`ww-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  // Snap counters to final values
  const ctrl = document.getElementById(`ww-controls-${stateKey}`);
  if (ctrl) {
    ['hunting', 'captured', 'failed'].forEach(key => {
      const span = document.getElementById(`ww-count-${stateKey}-${key}`);
      const final = ctrl.dataset[`final${key.charAt(0).toUpperCase() + key.slice(1)}`];
      if (span && final != null) span.textContent = final;
    });
    ctrl.style.display = 'none';
  }
  // Rebuild to show final results
  const ep = gs.episodeHistory.find(e => e.num === parseInt(stateKey.replace('ww_reveal_', ''), 10));
  if (ep) { buildVPScreens(ep); renderVPScreen(); }
}

// Draw SVG evidence lines between pinned cards on evidence boards (called via inline <script>)
function _wwDrawEvidenceLines(boardId) {
  const board = document.getElementById(boardId);
  if (!board) return;
  let svg = board.querySelector('.ww-evidence-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'ww-evidence-svg';
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    board.appendChild(svg);
  }
  svg.innerHTML = '';
  const boardRect = board.getBoundingClientRect();
  const pins = board.querySelectorAll('[data-line-to]');
  pins.forEach(pin => {
    const toId = pin.dataset.lineTo;
    const lineClass = pin.dataset.lineClass || 'ww-evidence-line--help';
    const toEl = document.getElementById(toId);
    if (!toEl) return;
    const pRect = pin.getBoundingClientRect();
    const tRect = toEl.getBoundingClientRect();
    const x1 = pRect.left - boardRect.left + pRect.width  / 2;
    const y1 = pRect.top  - boardRect.top  + pRect.height / 2;
    const x2 = tRect.left - boardRect.left + tRect.width  / 2;
    const y2 = tRect.top  - boardRect.top  + tRect.height / 2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', lineClass);
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    svg.appendChild(line);
  });
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN
// ══════════════════════════════════════════════════════════════
export function rpBuildWawanakwaGoneWild(ep) {
  const ww = ep.wawanakwaGoneWild;
  if (!ww?.timeline?.length) return '';

  const stateKey = `ww_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const ALL_ANIMAL_NAMES = ['Chipmunk','Frog','Rabbit','Duck','Raccoon','Goose','Beaver','Deer','Snake','Bear','Moose'];

  // Ticker: shuffle facts, double for seamless loop
  const shuffledFacts = [...RANGER_FACTS].sort(() => Math.random() - 0.5);
  const tickerContent = shuffledFacts.join('  ·  ');
  const tickerDoubled = `${tickerContent}  ·  ${tickerContent}`;

  // ── Pre-compute steps from timeline ──
  const steps = [];
  const huntingStart = Object.keys(ww.huntResults || {}).length;
  let lastRound = -1;

  for (const evt of ww.timeline) {
    let huntingDelta = 0, capturedDelta = 0, failedDelta = 0, cameraShake = false;

    // Insert round separator tannoy with live census
    if (evt.round !== undefined && evt.round !== lastRound && (evt.type === 'huntAttempt' || evt.type === 'huntMishap' || evt.type === 'huntFail')) {
      const label = evt.round <= 3 ? `ROUND ${evt.round + 1}` : 'FINAL ROUND — LAST CHANCE';
      // Count captures/still hunting up to this point
      let capturedSoFar = 0;
      for (const s of steps) { capturedSoFar += s.capturedDelta || 0; }
      const huntingSoFar = huntingStart - capturedSoFar;
      const censusStr = `${capturedSoFar} CAPTURED · ${Math.max(0, huntingSoFar)} STILL HUNTING`;
      const tannoyHtml = `<div class="ww-tannoy"><div class="ww-tannoy-badge">🎯 HUNT IN PROGRESS</div><div class="ww-tannoy-title">${label}</div><div class="ww-tannoy-census">STATUS: ${censusStr}</div></div>`;
      steps.push({ html: tannoyHtml, huntingDelta: 0, capturedDelta: 0, failedDelta: 0, cameraShake: false, tranqPair: null });
      lastRound = evt.round;
    }

    if (evt.type === 'huntAttempt' && evt.success) { capturedDelta = 1; huntingDelta = -1; }
    if (evt.type === 'huntFail') { failedDelta = 1; huntingDelta = -1; }
    if (evt.type === 'tranqChaos' && evt.subtype === 'hitContestant') { cameraShake = true; }
    if (evt.type === 'huntMishap') { cameraShake = true; }

    let tranqPair = null;
    if (evt.type === 'tranqChaos' && evt.subtype === 'hitContestant' && (evt.players || []).length >= 2) {
      tranqPair = `${evt.players[0]}|${evt.players[1]}`;
    }

    steps.push({ html: _renderWWStep(evt, ww, ALL_ANIMAL_NAMES), huntingDelta, capturedDelta, failedDelta, cameraShake, tranqPair });
  }

  const totalSteps = steps.length;
  const finalCaptured = Object.values(ww.huntResults || {}).filter(r => r.captured).length;
  const finalFailed = Object.values(ww.huntResults || {}).filter(r => !r.captured).length;

  // ── Build HTML ──
  let html = `<style>${WW_STYLES}</style>`;
  html += `<div class="ww-page rp-page">`;

  // Header with field cam indicator
  html += `<div class="ww-header">`;
  html += `<div class="ww-cam-bar"><span class="ww-rec"></span><span class="ww-cam-label">FIELD CAM</span><span class="ww-cam-loc">LOCATION: WAWANAKWA ISLAND</span></div>`;
  html += `<div class="ww-title">🏕️ WAWANAKWA GONE WILD!</div>`;
  html += `<div class="ww-subtitle">Catch your animal. First back wins a feast. Last back cleans the bathrooms.</div></div>`;

  // Ticker marquee
  html += `<div class="ww-ticker"><div class="ww-ticker-inner">${tickerDoubled}</div></div>`;

  // Status tracker (with walkie signal gauge)
  html += `<div class="ww-tracker" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">`;
  html += `<div class="ww-tracker-item ww-tracker-item--hunting">🎯 HUNTING: <span class="ww-count" id="ww-count-${stateKey}-hunting">${huntingStart}</span></div>`;
  html += `<div class="ww-tracker-item ww-tracker-item--captured">✅ CAPTURED: <span class="ww-count" id="ww-count-${stateKey}-captured">0</span></div>`;
  html += `<div class="ww-tracker-item ww-tracker-item--failed">❌ FAILED: <span class="ww-count" id="ww-count-${stateKey}-failed">0</span></div>`;
  html += `<div class="ww-signal" title="Signal strength"><div class="ww-signal-arc"></div><div class="ww-signal-needle" id="ww-signal-needle-${stateKey}"></div><div class="ww-signal-label">SIGNAL</div></div>`;
  html += `</div>`;

  // Collapsible scoreboard
  html += `<details style="margin-bottom:14px;position:relative;z-index:2"><summary style="cursor:pointer;font-family:'Courier New',monospace;font-size:11px;color:#8b7750;letter-spacing:0.5px">📋 Hunt Scoreboard (spoilers)</summary>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-top:8px">`;
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const tierColor = { easy:'#6a9f3a', medium:'#c8a84e', hard:'#c33', extreme:'#a05050' }[r.animalTier] || '#8b7750';
    const tierEmoji = { easy:'🐿️', medium:'🦆', hard:'🦌', extreme:'🐻' }[r.animalTier] || '🐾';
    const statusIcon = r.captured ? '✅' : '❌';
    const maxAttempts = 5;
    const fillPct = Math.min(100, Math.round((r.attemptsMade / maxAttempts) * 100));
    const fillColor = r.captured ? '#6a9f3a' : '#c33';
    html += `<div class="ww-player-tile" style="--tile-tier-color:${tierColor}">`;
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">${rpPortrait(name, 'xs')}<span style="font-weight:700;color:#d4c8a8">${name}</span></div>`;
    html += `<div style="color:${tierColor}">${tierEmoji} ${r.animal} <span class="ww-tier ww-tier--${r.animalTier}">${r.animalTier.toUpperCase()}</span></div>`;
    html += `<div style="color:#8b7750">🎒 ${r.gear}</div>`;
    html += `<div>${statusIcon} ${r.captured ? `R${r.captureRound + 1}` : 'FAILED'} · ${r.attemptsMade} tries</div>`;
    html += `<div class="ww-progress-bar"><div class="ww-progress-fill" style="--target-width:${fillPct}%;background:${fillColor}"></div></div>`;
    html += `</div>`;
  });
  html += `</div></details>`;

  // ── Render all steps (hidden, pre-reveal up to state.idx) ──
  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i];
    const visible = i <= state.idx;
    html += `<div id="ww-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}"`;
    if (step.huntingDelta) html += ` data-hunting-delta="${step.huntingDelta}"`;
    if (step.capturedDelta) html += ` data-captured-delta="${step.capturedDelta}"`;
    if (step.failedDelta) html += ` data-failed-delta="${step.failedDelta}"`;
    if (step.cameraShake) html += ` data-camera-shake="1"`;
    if (step.tranqPair) html += ` data-tranq-pair="${step.tranqPair.replace(/"/g,'&quot;')}"`;
    html += `>${step.html}</div>`;
  }

  // ── Controls ──
  const allRevealed = state.idx >= totalSteps - 1;
  html += `<div id="ww-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin:12px 0;position:relative;z-index:2'}" data-final-hunting="0" data-final-captured="${finalCaptured}" data-final-failed="${finalFailed}">`;
  html += `<button class="ww-btn-reveal" id="ww-btn-${stateKey}" onclick="window._wwReveal('${stateKey}',${totalSteps})">▶ NEXT EVENT (${state.idx + 2}/${totalSteps})</button>`;
  html += `<a class="ww-btn-reveal-all" onclick="window._wwRevealAll('${stateKey}',${totalSteps})">reveal all</a>`;
  html += `</div>`;

  // Expose reveal functions on window
  window._wwReveal = _wwReveal;
  window._wwRevealAll = _wwRevealAll;
  window._wwDrawEvidenceLines = _wwDrawEvidenceLines;

  // ── Final results (only after full reveal) ──
  if (allRevealed) {
    html += _renderWWResults(ww);
  }

  // ── Fix tracker counters for pre-revealed state ──
  if (state.idx >= 0) {
    let h = huntingStart, c = 0, f = 0;
    for (let i = 0; i <= state.idx && i < totalSteps; i++) {
      h += steps[i].huntingDelta;
      c += steps[i].capturedDelta;
      f += steps[i].failedDelta;
    }
    html += `<script>(function(){var h=document.getElementById('ww-count-${stateKey}-hunting');var c=document.getElementById('ww-count-${stateKey}-captured');var f=document.getElementById('ww-count-${stateKey}-failed');if(h)h.textContent='${h}';if(c)c.textContent='${c}';if(f)f.textContent='${f}';})()</script>`;
  }

  html += `</div>`;
  return html;
}

// ── PER-EVENT CARD RENDERER ──
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES) {
  const GOLD = '#c8a84e', GREEN = '#6a9f3a', RED = '#c33', GREY = '#8b7750', ORANGE = '#c8a84e', PINK = '#d4789a', BLUE = '#7a9ec2', PURPLE = '#a05050';

  function wrapTier(tier, inner) {
    if (!tier) return inner;
    return `<div class="ww-tier-bg ww-tier-bg--${tier}">${inner}</div>`;
  }

  // ── ANIMAL DRAW: slot reel ──
  if (evt.type === 'animalDraw') {
    const tierColors = { easy: GREEN, medium: ORANGE, hard: RED, extreme: PURPLE };
    const tierStamps = { easy: 'EASY PICKINGS', medium: 'FAIR GAME', hard: 'GOOD LUCK', extreme: "YOU'RE DOOMED" };
    const color = tierColors[evt.tier] || GREY;
    const reelNames = [];
    for (let r = 0; r < 4; r++) ALL_ANIMAL_NAMES.forEach(a => reelNames.push(a));
    reelNames.push(evt.animal);
    const stripHeight = 26;
    const reelFinal = -((reelNames.length - 1) * stripHeight);

    let h = `<div class="ww-card" style="--ww-accent:${color}">`;
    h += `<div class="ww-card-label">🎲 ANIMAL DRAW</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    h += `${rpPortrait(evt.player, 'sm')}`;
    h += `<span style="font-weight:700;color:#d4c8a8;font-size:13px">${evt.player}</span>`;
    h += `<div class="ww-reel" style="--reel-start:0px;--reel-final:${reelFinal}px"><div class="ww-reel-window"></div><div class="ww-reel-strip">`;
    reelNames.forEach(a => { h += `<div>${a}</div>`; });
    h += `</div></div>`;
    h += `<span class="ww-tier ww-tier--${evt.tier}">${evt.tier.toUpperCase()}</span>`;
    h += `</div>`;
    h += `<div class="ww-card-body" style="margin-top:6px">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${color}">${tierStamps[evt.tier] || evt.tier.toUpperCase()}</span></div>`;
    h += `</div>`;
    return wrapTier(evt.tier, h);
  }
  if (evt.type === 'gearGrab') {
    const isArmed = (evt.gear || '').toLowerCase().includes('tranq');
    const cardClass = isArmed ? 'ww-gear-card ww-gear-card--armed' : 'ww-gear-card';
    let h = `<div class="ww-card" style="--ww-accent:${isArmed ? RED : '#8b5a2b'}">`;
    h += `<div class="ww-card-label">🎒 GEAR GRAB</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    h += `${rpPortrait(evt.player, 'sm')}`;
    h += `<span style="font-weight:700;color:#d4c8a8">${evt.player}</span>`;
    h += `<span class="${cardClass}">${isArmed ? '💉 ' : ''}${evt.gear} <span style="color:#8b7750;font-size:9px">(${evt.gearTier})</span></span>`;
    h += `</div>`;
    h += `<div class="ww-card-body" style="margin-top:4px">${evt.text}</div>`;
    if (isArmed) h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${RED}">ARMED AND DANGEROUS</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── CHRIS QUIP ──
  if (evt.type === 'chrisQuip') {
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">📢 CHRIS MCLEAN</div>`;
    h += `<div class="ww-card-body" style="font-style:italic">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT ATTEMPT (success) ──
  if (evt.type === 'huntAttempt' && evt.success) {
    let h = `<div class="ww-card" style="--ww-accent:${GREEN}">`;
    h += `<div class="ww-card-label">✅ CAPTURE — ${(evt.animal || '').toUpperCase()}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${GREEN}">CAUGHT!</span></div>`;
    h += `<div class="ww-card-footer">Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return wrapTier(ww.huntResults?.[evt.player]?.animalTier, h);
  }

  // ── HUNT ATTEMPT (fail) ──
  if (evt.type === 'huntAttempt' && !evt.success) {
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">❌ FAILED ATTEMPT — ${(evt.animal || '').toUpperCase()}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div class="ww-card-footer">Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return wrapTier(ww.huntResults?.[evt.player]?.animalTier, h);
  }

  // ── HUNT MISHAP ──
  if (evt.type === 'huntMishap') {
    const mishapTier = (ww.huntResults?.[evt.player]?.animalTier) || 'medium';
    const mishapStamps = { easy: 'THWACK!', medium: 'OWWW!', hard: 'SPLAT!', extreme: 'CATASTROPHIC FAILURE' };
    const stamp = mishapStamps[mishapTier] || 'OWWW!';
    const particles = ['💥','⭐','🌀','💫','✨','❗'];
    const particleCount = 6;
    let particleHtml = '';
    for (let pi = 0; pi < particleCount; pi++) {
      const angle = (pi / particleCount) * 360;
      const dist = 28 + Math.floor(Math.random() * 20);
      const mx = `${Math.round(Math.cos((angle * Math.PI) / 180) * dist)}px`;
      const my = `${Math.round(Math.sin((angle * Math.PI) / 180) * dist)}px`;
      const rot = `${Math.floor(Math.random() * 360)}deg`;
      const delay = `${pi * 60}ms`;
      const em = particles[pi % particles.length];
      particleHtml += `<span class="ww-mishap-particle" style="--mx:${mx};--my:${my};--mrot:${rot};--mdelay:${delay}">${em}</span>`;
    }
    let h = `<div class="ww-card ww-card--mishap ww-mishap-stage" style="--ww-accent:${RED}">`;
    h += `<div class="ww-card-label">💥 MISHAP — ${(evt.animal || '').toUpperCase()}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;position:relative">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span>${particleHtml}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${RED}">${stamp}</span></div>`;
    h += `<div class="ww-card-footer">Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return wrapTier(mishapTier, h);
  }

  // ── HUNT FAIL (never caught) ──
  if (evt.type === 'huntFail') {
    let h = `<div class="ww-card" style="--ww-accent:${RED}">`;
    h += `<div class="ww-card-label">💀 NO CATCH — ${(evt.animal || '').toUpperCase()}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${RED}">FAILED</span></div>`;
    h += `</div>`;
    return wrapTier(ww.huntResults?.[evt.player]?.animalTier, h);
  }

  // ── TRANQ CHAOS ──
  if (evt.type === 'tranqChaos') {
    const [shooter, victim] = evt.players || [];
    const shooterPortrait = shooter ? `<span data-player-id="${shooter.replace(/"/g,'&quot;')}">${rpPortrait(shooter, 'sm')}</span>` : '';
    const victimPortrait  = victim  ? `<span data-player-id="${victim.replace(/"/g,'&quot;')}">${rpPortrait(victim, 'sm')}</span>` : '';
    let h = `<div class="ww-card ww-card--tranq" style="--ww-accent:${RED};position:relative">`;
    h += `<div class="ww-card-label"><span class="ww-dart">💉</span> TRANQUILIZER CHAOS${evt.badgeText ? ' · ' + evt.badgeText : ''}</div>`;
    h += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">`;
    if (shooter) { h += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${shooterPortrait}<span style="font-family:'Courier New',monospace;font-size:9px;color:#8b7750">SHOOTER</span></div>`; }
    if (victim)  { h += `<div style="font-size:18px;padding:0 6px;color:#c33">→</div>`;
                   h += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${victimPortrait}<span style="font-family:'Courier New',monospace;font-size:9px;color:#c33">TARGET</span></div>`; }
    h += `</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    if (evt.subtype === 'hitContestant' && victim) {
      h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${RED}">💉 TRANQ'D — ${victim.toUpperCase()}</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  // ── FEAST REVEAL (leaf curtain) ──
  if (evt.type === 'feastReveal') {
    const winner = evt.player || ww.immunityWinner || '???';
    let h = `<div class="ww-curtain-wrap">`;
    h += `<div class="ww-spotlight">`;
    h += `<div class="ww-trophy-wrap">`;
    h += rpPortrait(winner, 'xl');
    h += `<div style="font-family:var(--font-display,'Impact',sans-serif);font-size:22px;font-weight:800;color:${GOLD};letter-spacing:2px;margin-top:8px">${winner}</div>`;
    h += `<div style="font-size:12px;color:#d4c8a8;margin-top:4px">IMMUNITY + FEAST OF ALL THEIR FAVORITES</div>`;
    h += `</div>`;
    h += `<div style="margin-top:10px"><span class="ww-stamp" style="color:${GOLD}">🏆 FEAST WINNER</span></div>`;
    h += `</div></div>`;
    return h;
  }

  // ── PUNISHMENT REVEAL ──
  if (evt.type === 'punishmentReveal') {
    const loser = evt.player || ww.punishmentTarget || '???';
    let h = `<div class="ww-card ww-card--punish" style="--ww-accent:${RED};animation:ww-scan-in 0.35s ease-out both,ww-pulse-red 0.6s 0.35s 2">`;
    h += `<div class="ww-card-label">🚽 BATHROOM DUTY</div>`;
    h += `<div style="display:flex;align-items:center;gap:10px;margin:4px 0">${rpPortrait(loser, 'sm')}<span style="font-family:var(--font-display,'Impact',sans-serif);font-size:18px;font-weight:700;color:${RED}">${loser}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${RED}">BATHROOM DUTY</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT EVENTS (subtypes) ──
  if (evt.type === 'huntEvent') {
    const subtypeConfig = {
      'help':              { color: GREEN, emoji: '🤝', label: 'HELPING HAND' },
      'sabotage':          { color: RED,   emoji: '🔪', label: 'SABOTAGE' },
      'sabotage-caught':   { color: RED,   emoji: '🔪', label: 'SABOTAGE CAUGHT' },
      'alliance-accepted': { color: GOLD,  emoji: '🤝', label: 'ALLIANCE FORMED' },
      'alliance-rejected': { color: GREY,  emoji: '🚫', label: 'ALLIANCE REJECTED' },
      'alliance-backfire': { color: RED,   emoji: '🗡️', label: 'ALLIANCE BETRAYAL' },
      'taunt':             { color: RED,   emoji: '😏', label: 'TAUNT' },
      'encourage':         { color: GREEN, emoji: '💪', label: 'ENCOURAGEMENT' },
      'showmance':         { color: PINK,  emoji: '💕', label: 'SHOWMANCE MOMENT' },
      'rivalry':           { color: RED,   emoji: '⚡', label: 'RIVALRY CLASH' },
      'discovery':         { color: BLUE,  emoji: '🔎', label: 'DISCOVERY' },
      'steal-gear':        { color: RED,   emoji: '🖐️', label: 'GEAR STOLEN' },
      'animal-encounter':  { color: ORANGE,emoji: '🐾', label: 'ANIMAL ENCOUNTER' },
    };
    const cfg = subtypeConfig[evt.subtype] || { color: GREY, emoji: '⚡', label: (evt.subtype || 'EVENT').toUpperCase() };
    const evtPortraits = (evt.players || []).slice(0, 3).map(p => rpPortrait(p, 'sm')).join('');
    let h = `<div class="ww-card" style="--ww-accent:${cfg.color}">`;
    h += `<div class="ww-card-label">${cfg.emoji} ${cfg.label}${evt.badgeText ? ' · ' + evt.badgeText : ''}</div>`;
    if (evtPortraits) h += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">${evtPortraits}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // ── FALLBACK ──
  let h = `<div class="ww-card" style="--ww-accent:${GREY}">`;
  h += `<div class="ww-card-label">📋 ${(evt.type || 'EVENT').toUpperCase()}</div>`;
  h += `<div class="ww-card-body">${evt.text || ''}</div>`;
  h += `</div>`;
  return h;
}

// ── FINAL RESULTS (shown after full reveal) ──
function _renderWWResults(ww) {
  const GOLD = '#c8a84e', GREEN = '#6a9f3a', RED = '#c33', GREY = '#8b7750';
  let html = `<div style="position:relative;z-index:2;margin-top:16px">`;

  html += `<div class="ww-section">📊 FINAL STANDINGS</div>`;
  html += `<table class="ww-results-table"><thead><tr>`;
  html += `<th>#</th><th>Player</th><th>Animal</th><th>Gear</th><th>Result</th><th>Tries</th><th>Score</th>`;
  html += `</tr></thead><tbody>`;
  (ww.finishOrder || []).forEach((name, i) => {
    const r = (ww.huntResults || {})[name];
    if (!r) return;
    const isWinner = i === 0;
    const isLoser = i === (ww.finishOrder.length - 1);
    const rowClass = isWinner ? 'ww-row-winner' : isLoser ? 'ww-row-loser' : '';
    const resultText = r.captured ? `<span style="color:${GREEN}">CAUGHT R${r.captureRound + 1}</span>` : `<span style="color:${RED}">FAILED</span>`;
    const mods = [];
    if (r.helpedBy) mods.push(`helped by ${r.helpedBy}`);
    if (r.sabotagedBy) mods.push(`sabotaged by ${r.sabotagedBy}`);
    if (r.tranqDarted) mods.push("tranq'd");

    html += `<tr class="${rowClass}">`;
    html += `<td style="color:${isWinner ? GOLD : isLoser ? RED : '#d4c8a8'};font-weight:700">#${i + 1}</td>`;
    html += `<td><div style="display:flex;align-items:center;gap:4px">${rpPortrait(name, 'xs')}<span style="font-weight:700">${name}${isWinner ? ' 🏆' : isLoser ? ' 🚽' : ''}</span></div></td>`;
    html += `<td>${r.animal} <span class="ww-tier ww-tier--${r.animalTier}">${r.animalTier.toUpperCase()}</span></td>`;
    html += `<td style="color:${GREY}">${r.gear}</td>`;
    html += `<td>${resultText}</td>`;
    html += `<td>${r.attemptsMade}</td>`;
    html += `<td>${(r.personalScore || 0).toFixed(1)}${mods.length ? `<div style="font-size:8px;color:${GREY}">${mods.join(' · ')}</div>` : ''}</td>`;
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  // Alliance summary
  const allianceEvents = (ww.timeline || []).filter(e => e.type === 'huntEvent' && (e.subtype === 'alliance-accepted' || e.subtype === 'alliance-rejected' || e.subtype === 'alliance-backfire'));
  if (allianceEvents.length) {
    html += `<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.15)">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${GOLD};margin-bottom:6px">🤝 ALLIANCE ACTIVITY</div>`;
    allianceEvents.forEach(ae => {
      const icon = ae.subtype === 'alliance-accepted' ? '✅' : ae.subtype === 'alliance-backfire' ? '🗡️' : '🚫';
      html += `<div style="font-size:11px;color:#d4c8a8;margin-bottom:3px">${icon} ${ae.players?.join(' & ') || '???'} — ${ae.subtype.replace(/-/g, ' ').toUpperCase()}</div>`;
    });
    html += `</div>`;
  }

  // Tranq incident report
  const tranqEvents = (ww.timeline || []).filter(e => e.type === 'tranqChaos');
  if (tranqEvents.length) {
    html += `<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.15)">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${RED};margin-bottom:6px">💉 TRANQUILIZER INCIDENT REPORT</div>`;
    tranqEvents.forEach(te => {
      html += `<div style="font-size:11px;color:#d4c8a8;margin-bottom:3px"><span class="ww-dart">💉</span> ${te.players?.join(' → ') || '???'} — ${(te.subtype || 'unknown').replace(/-/g, ' ').toUpperCase()}</div>`;
    });
    html += `</div>`;
  }

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

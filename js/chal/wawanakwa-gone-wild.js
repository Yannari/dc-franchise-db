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
      approachDifficulty: 9,
      engagementDifficulty: 11,
      reactionChance: 0.50,
      approach: [
        (n, pr) => `${n} spots the chipmunk darting between tree roots. ${pr.Sub} ${pr.sub==='they'?'crouch':'crouches'} and moves in slow.`,
        (n, pr) => `${n} follows a trail of bitten acorn caps to a hollow log. Something chitters inside.`,
        (n, pr) => `${n} freezes when ${pr.posAdj} foot snaps a twig. The chipmunk's tail flicks up twenty feet ahead.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} lunges low with the sack. Pins the chipmunk against a root. One flailing handful — secured.`,
        (n, pr) => `${n} drops the hat trap right as the chipmunk crosses. ${pr.Sub} ${pr.sub==='they'?'scoop':'scoops'} it into the bag, bites and all.`,
      ],
      engagementFail: [
        (n, pr) => `${n} swings the sack too wide. The chipmunk is under ${pr.posAdj} arm and gone.`,
        (n, pr) => `${n} commits to the grab. Grabs air. The chipmunk is already on the next branch.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The chipmunk dives into a crack between two boulders. ${n} can hear it laughing.`,
          (n, pr) => `The chipmunk runs up a tree, screams once, and is gone.`,
        ],
        freeze: [
          (n, pr) => `The chipmunk locks up mid-step, eyes huge. ${n} has a split-second window.`,
          (n, pr) => `The chipmunk plays dead. Very unconvincingly. But it's not moving.`,
        ],
      },
    },
    {
      id: 'frog',name: 'Frog', tier: 'easy',
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
      approachDifficulty: 10,
      engagementDifficulty: 12,
      reactionChance: 0.45,
      approach: [
        (n, pr) => `${n} finds the frog perched on a lily pad at the edge of the pond. ${pr.Sub} ${pr.sub==='they'?'crouch':'crouches'} and eases forward through the reeds.`,
        (n, pr) => `${n} follows a trail of splashes to a muddy bank. The frog is right there, fat and slow.`,
        (n, pr) => `${n} spots the frog two feet away, completely still. ${pr.Sub} ${pr.sub==='they'?'hold':'holds'} ${pr.posAdj} breath and inches the bucket forward.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} scoops the bucket under the frog in one clean motion. It squirms but it's in.`,
        (n, pr) => `${n} drops the hat over the frog before it can jump. ${pr.Sub} ${pr.sub==='they'?'slide':'slides'} the bucket under to complete the trap.`,
        (n, pr) => `${n} uses both hands, sweeping from behind. The frog lands in the bucket mid-jump. Lucky, but it counts.`,
      ],
      engagementFail: [
        (n, pr) => `${n} swings the bucket too slow. The frog is already gone, three lily pads away.`,
        (n, pr) => `${n} lunges. The frog's legs are stronger than expected. It clears ${pr.posAdj} hands by two feet.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The frog leaps so hard it disappears into the water with a crack. ${n} is just staring at ripples.`,
          (n, pr) => `The frog zigzags three times, then dives under the mud. ${n} has no idea where it went.`,
        ],
        freeze: [
          (n, pr) => `The frog locks up completely. ${n} has maybe five seconds before it decides to move.`,
          (n, pr) => `The frog plays dead. Perfectly still, legs splayed. ${n} isn't sure if this is a trap.`,
        ],
      },
    },
    {
      id: 'rabbit',name: 'Rabbit', tier: 'easy',
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
      approachDifficulty: 10,
      engagementDifficulty: 11,
      reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} spots the rabbit nibbling grass near the treeline. ${pr.Sub} ${pr.sub==='they'?'move':'moves'} upwind, staying low.`,
        (n, pr) => `${n} finds the burrow entrance and sets up nearby. The rabbit comes out within minutes, nose twitching.`,
        (n, pr) => `${n} traces the rabbit's route along the field edge. It's a creature of habit. ${pr.Sub} ${pr.sub==='they'?'wait':'waits'} at the spot.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} pounces while the rabbit is mid-sniff. Both hands, quick and firm. It kicks, but it's in the bag.`,
        (n, pr) => `${n} steers the rabbit into the corner of the snare with a gentle approach. It hops right in.`,
      ],
      engagementFail: [
        (n, pr) => `${n} dives for the rabbit. It zigzags twice and is back in the burrow before ${pr.sub} ${pr.sub==='they'?'land':'lands'}.`,
        (n, pr) => `${n} misses the timing. The rabbit bolts straight into the grass and is gone before ${pr.sub} ${pr.sub==='they'?'stand':'stands'} up.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The rabbit bolts in a zigzag pattern so fast that ${n} can't track it. Gone.`,
          (n, pr) => `The rabbit drops down the burrow. ${n} hears it thumping below. It's not coming back out.`,
        ],
        freeze: [
          (n, pr) => `The rabbit holds absolutely still, nose going. It hasn't decided to run yet.`,
          (n, pr) => `The rabbit flattens into the grass. ${n} almost loses it, then spots the ears.`,
        ],
      },
    },
    {
      id: 'squirrel',name: 'Squirrel', tier: 'easy',
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
      approachDifficulty: 9, engagementDifficulty: 11, reactionChance: 0.45,
      approach: [
        (n, pr) => `${n} scatters a handful of nuts near the base of a tree and backs off to wait. The squirrel is watching from above.`,
        (n, pr) => `${n} moves through the undergrowth at crouch height. The squirrel hasn't noticed yet.`,
        (n, pr) => `${n} follows the squirrel's cache trail. It keeps stopping to bury things. One of those stops will be the window.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} waits for the squirrel to commit to the bait and drops the bucket over it in one clean motion.`,
        (n, pr) => `${n} corners the squirrel against the tree base and scoops it into the bag before it can get traction.`,
      ],
      engagementFail: [
        (n, pr) => `${n} moves a half-second too slow. The squirrel is up the tree before the bag is even open.`,
        (n, pr) => `${n} goes for it. The squirrel reads it coming and bolts sideways into the brush.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The squirrel is up the nearest tree trunk in less than a second. Not coming back down.`,
          (n, pr) => `The squirrel launches off a root, ricochets off a tree, and is gone. No idea where.`,
        ],
        freeze: [
          (n, pr) => `The squirrel freezes on the branch, tail flicking. It's deciding.`,
          (n, pr) => `The squirrel presses flat against the ground and holds completely still. If ${n} didn't see it already, ${pr.sub} ${pr.sub==='they'?'never':'never'} would.`,
        ],
      },
    },
    {
      id: 'seagull',name: 'Seagull', tier: 'easy',
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
      approachDifficulty: 9, engagementDifficulty: 12, reactionChance: 0.45,
      approach: [
        (n, pr) => `${n} scatters chips near the dock edge and waits. There are six seagulls within thirty feet.`,
        (n, pr) => `${n} edges toward the flock from the blind side of the boathouse, food in hand.`,
        (n, pr) => `${n} lies flat on the dock and inches forward. The seagull is directly ahead, head down, eating something gross.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} tosses food to the left, and when the gull turns, bags it from the right. Clean.`,
        (n, pr) => `${n} nets it against the dock post before it can get airborne. It shrieks the whole way to camp.`,
      ],
      engagementFail: [
        (n, pr) => `${n} grabs for it. The seagull hops back and stares ${pr.obj} down like ${n} is the intruder here.`,
        (n, pr) => `${n} throws the net. The seagull steps to the side and lets it land on the dock. Then it steals the bait.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The seagull opens its wings and lifts off. Three others go with it. The dock is empty.`,
          (n, pr) => `The seagull skips backward twice, catches the wind, and is gone over the water.`,
        ],
        freeze: [
          (n, pr) => `The seagull stands its ground and stares at ${n}. It has done nothing wrong and it would like ${n} to know that.`,
          (n, pr) => `The seagull doesn't move. It just watches. It seems completely unbothered.`,
        ],
      },
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
      approachDifficulty: 11,
      engagementDifficulty: 13,
      reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} scatters a trail of bread crumbs and circles around to the duck from the other side.`,
        (n, pr) => `${n} wades into the shallows, moving slow. The duck watches ${pr.obj} from ten feet away, unimpressed.`,
        (n, pr) => `${n} crawls through the reeds for twenty minutes to get within range of the duck's usual feeding spot.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} times the net toss perfectly — as the duck dips its head to eat. Clean catch.`,
        (n, pr) => `${n} corners the duck against the dock post and drops the cage. The duck quacks like it's been personally offended.`,
      ],
      engagementFail: [
        (n, pr) => `${n} throws the net. The duck walks under it and keeps going. Ducks are faster walking than they look.`,
        (n, pr) => `${n} gets close enough to touch it. Then the duck sticks out its tongue and sprints. There is nothing to do.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The duck turns and power-walks away faster than ${n} thought possible for a bird that size.`,
          (n, pr) => `The duck takes off across the pond and lands fifty yards away. ${n} stares at the rings on the water.`,
        ],
        freeze: [
          (n, pr) => `The duck stops. Tilts its head at ${n}. Doesn't move. This might actually be ${pr.posAdj} chance.`,
          (n, pr) => `The duck preens, ignoring ${n} entirely. It's not fleeing — it just doesn't care.`,
        ],
        call: [
          (n, pr) => `The duck quacks four times. Six more ducks arrive from across the water. ${n} is now outnumbered.`,
          (n, pr) => `The duck calls for backup. Three drakes paddle over. ${n} quietly backs away from the situation.`,
        ],
        feint: [
          (n, pr) => `The duck waddles toward ${n}, then abruptly turns and waddles away. ${n} is completely confused.`,
          (n, pr) => `The duck charges ${n} with wings spread — then veers off at the last second. ${n} stumbled anyway.`,
        ],
      },
    },
    {
      id: 'raccoon',name: 'Raccoon', tier: 'medium',
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
      approachDifficulty: 12,
      engagementDifficulty: 13,
      reactionChance: 0.60,
      approach: [
        (n, pr) => `${n} follows the sound of rummaging to a trash pile near the treeline. The raccoon has its head buried in a bag.`,
        (n, pr) => `${n} tracks the raccoon to a hollow log by the pawprints in the mud. It's in there. ${pr.Sub} ${pr.sub==='they'?'wait':'waits'}.`,
        (n, pr) => `${n} sets out bait fifty feet from camp and backs off. The raccoon takes twenty minutes to show up, but it does.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} drops the net while the raccoon is distracted eating. It fights the netting for a solid thirty seconds before giving up.`,
        (n, pr) => `${n} corners it against the log and gets the bag over it from behind. It immediately starts trying to pick the knot.`,
      ],
      engagementFail: [
        (n, pr) => `The raccoon sidesteps the net, grabs the bait anyway, and walks off. ${n} watches it go.`,
        (n, pr) => `${n} grabs the raccoon. It twists in a way no mammal should be able to and escapes in under a second.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The raccoon bolts for the nearest tree and is fifteen feet up before ${n} can blink.`,
          (n, pr) => `The raccoon makes a sound like a tiny scream and sprints into the undergrowth.`,
        ],
        freeze: [
          (n, pr) => `The raccoon freezes with food in both tiny hands, staring at ${n}. It has not decided what to do.`,
          (n, pr) => `The raccoon stops. Looks at ${n}. Tilts its head. It's sizing ${pr.obj} up.`,
        ],
        call: [
          (n, pr) => `The raccoon's chittering brings three more out of the dark. They form a loose circle around ${n}.`,
          (n, pr) => `The raccoon calls and another appears from behind ${n}. The situation is no longer in ${pr.posAdj} favor.`,
        ],
        feint: [
          (n, pr) => `The raccoon bolts left, stops, bolts right. ${n} can't get a bead on it.`,
          (n, pr) => `The raccoon charges ${n}'s feet, veers off, and uses the confusion to escape.`,
        ],
      },
    },
    {
      id: 'goose',name: 'Goose', tier: 'medium',
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
      approachDifficulty: 11,
      engagementDifficulty: 14,
      reactionChance: 0.65,
      approach: [
        (n, pr) => `${n} approaches from the far side of the pond, bread in hand, trying to look non-threatening.`,
        (n, pr) => `${n} finds the goose alone by the dock, separated from the flock. This might be the best opening ${pr.sub} ${pr.sub==='they'?'get':'gets'}.`,
        (n, pr) => `${n} circles the goose slowly, watching for the moment it dips its head to drink.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} gets the blanket over the goose from behind before it can turn. It honks through the entire trip back to camp.`,
        (n, pr) => `${n} feeds it enough bread to make it sluggish, then moves fast. The goose is contained, furious, and full.`,
      ],
      engagementFail: [
        (n, pr) => `${n} reaches for the goose. The goose attacks. ${n} is the one running now.`,
        (n, pr) => `${n} tries to herd it. The goose herds ${pr.obj} instead. ${n} ends up in the reeds with no goose.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The goose spreads its wings and runs, hissing, then takes off low over the water.`,
          (n, pr) => `The goose retreats honking. It does not go far. It will be back.`,
        ],
        freeze: [
          (n, pr) => `The goose plants itself and stares at ${n} with one eye. It's deciding whether ${pr.sub} ${pr.sub==='they'?'are':'is'} worth fighting.`,
          (n, pr) => `The goose stops walking and holds its ground. It has decided. ${n} is the one who needs to make the next move.`,
        ],
        call: [
          (n, pr) => `The goose unleashes a honk that carries across the whole island. The rest of the flock arrives in force.`,
          (n, pr) => `The goose calls for the flock. Seven geese land in the water behind ${n}. ${pr.Sub} ${pr.sub==='they'?'are':'is'} surrounded on three sides.`,
        ],
        feint: [
          (n, pr) => `The goose lunges with wings spread, stops dead, and watches ${n} stumble backward.`,
          (n, pr) => `The goose fake-charges twice in a row. ${n} can't tell which lunge is going to be real.`,
        ],
      },
    },
    {
      id: 'skunk',name: 'Skunk', tier: 'medium',
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
      approachDifficulty: 12, engagementDifficulty: 13, reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} finds the skunk foraging under a log. ${pr.Sub} ${pr.sub==='they'?'approach':'approaches'} from downwind, every footfall deliberate.`,
        (n, pr) => `${n} follows the skunk's trail from the campsite edge into the brush. Slow. Quiet. Downwind.`,
        (n, pr) => `${n} spots the skunk in a sunny clearing and goes perfectly still. It hasn't smelled ${pr.obj} yet.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} guides the skunk into the box with a line of food, moving at glacier speed. Not a single tail-raise. A masterpiece.`,
        (n, pr) => `${n} drops the bag over the skunk from directly above, slow enough that it barely registers as a threat. Clean capture.`,
      ],
      engagementFail: [
        (n, pr) => `${n} reaches. The skunk's tail goes up. ${n} stops. They hold this standoff for thirty seconds before ${n} backs off.`,
        (n, pr) => `${n} breathes too loud. The skunk turns. ${pr.Sub} ${pr.sub==='they'?'back':'backs'} away before the tail can rise.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The skunk waddles off at an unhurried pace. It has nowhere to be, but it's done with this.`,
          (n, pr) => `The skunk disappears into the underbrush. It left before ${n} even made a move.`,
        ],
        freeze: [
          (n, pr) => `The skunk stops and looks directly at ${n}. Tail at half-mast. Neither of them moves.`,
          (n, pr) => `The skunk holds perfectly still. This is the warning before the warning.`,
        ],
        call: [
          (n, pr) => `The skunk stamps its front feet twice — a warning signal that gets a response from somewhere in the undergrowth.`,
          (n, pr) => `A second skunk emerges from the brush behind ${n}. The situation has escalated.`,
        ],
        feint: [
          (n, pr) => `The skunk raises its tail — full up — then lowers it. False alarm. ${n}'s heart disagrees.`,
          (n, pr) => `The skunk half-turns, tail rising, then cuts away in a different direction. ${n} has no idea which way it's going.`,
        ],
      },
    },
    {
      id: 'porcupine',name: 'Porcupine', tier: 'medium',
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
      approachDifficulty: 11, engagementDifficulty: 14, reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} finds the porcupine under a deadfall, gnawing bark. It knows ${pr.sub}'s ${pr.sub==='they'?'there':'there'} but hasn't committed to anything.`,
        (n, pr) => `${n} tracks the porcupine by its quill-scrape marks on tree trunks. It's moving slow. ${pr.Sub} ${pr.sub==='they'?'close':'closes'} in.`,
        (n, pr) => `${n} spots the porcupine waddling along the path. It's not fast. But those quills are.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} uses ${pr.posAdj} jacket as a mitt, scoops from underneath, and has it in the bag without touching a single quill.`,
        (n, pr) => `${n} maneuvers it into a corner with a stick, then tips it — not grabs it — into the cage. Smart play.`,
      ],
      engagementFail: [
        (n, pr) => `${n} goes to grab it and the porcupine rattles its quills. ${n} stops. They stare at each other for too long.`,
        (n, pr) => `${n} tries to tip the porcupine into the bag. It rolls into a ball. It won't roll and it won't open. Stalemate.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The porcupine climbs the nearest tree. Slowly. But it gets there.`,
          (n, pr) => `The porcupine waddling away is somehow faster than it looks. It's gone before ${n} realizes it moved.`,
        ],
        freeze: [
          (n, pr) => `The porcupine curls into a full ball. Every quill is out. ${n} cannot figure out which end is which.`,
          (n, pr) => `The porcupine stops moving and fluffs up to twice its size. It's not running. It doesn't need to.`,
        ],
        call: [
          (n, pr) => `The porcupine makes a sound like a very angry baby. Something in the brush responds.`,
          (n, pr) => `The porcupine vocalizes — a low grinding chatter. A second one emerges from a hollow log nearby.`,
        ],
        feint: [
          (n, pr) => `The porcupine backs toward ${n}, quills raised, then pivots. ${n} jumped backward for nothing.`,
          (n, pr) => `The porcupine makes a sudden half-charge. ${n} flinches. The porcupine didn't actually go anywhere.`,
        ],
      },
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
      approachDifficulty: 12,
      engagementDifficulty: 13,
      reactionChance: 0.50,
      approach: [
        (n, pr) => `${n} wades out to the dam at dawn, when beavers are most active. The lodge is right there in the water.`,
        (n, pr) => `${n} spots the beaver hauling a branch toward the dam. ${pr.Sub} ${pr.sub==='they'?'follow':'follows'} at a distance, looking for an opening.`,
        (n, pr) => `${n} finds a flat bank where the beaver comes ashore to drag timber. ${pr.Sub} ${pr.sub==='they'?'set':'sets'} up and wait.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} scoops the beaver out of the shallows with the bag while it's distracted building. It tail-slaps ${pr.obj} twice. Still a catch.`,
        (n, pr) => `${n} corners the beaver at the dam entrance and gets the net over it before it can dive. Wet but successful.`,
      ],
      engagementFail: [
        (n, pr) => `${n} reaches for the beaver. It whips its tail against the water like a gunshot and slips under.`,
        (n, pr) => `${n} dives under the dam and grabs nothing. The beaver was already gone.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The beaver slaps its tail on the water — a sound like a gunshot — and dives. It doesn't come back up.`,
          (n, pr) => `The beaver drops its branch and disappears underwater before ${n} can close the gap.`,
        ],
        feint: [
          (n, pr) => `The beaver darts toward the water, stops, turns back toward ${n}. Mixed signals.`,
          (n, pr) => `The beaver fakes a dive, waits for ${n} to commit, then bolts the other direction along the bank.`,
        ],
        counter: [
          (n, pr) => `The beaver spins and charges. ${n} did not expect that. A beaver charging is a different experience than a beaver chewing.`,
          (n, pr) => `The beaver lunges and slaps ${n} across the shin with its tail. It's not funny, but everyone watching thinks it is.`,
        ],
        escape: [
          (n, pr) => `The beaver slips into the dam's underwater entrance. ${n} is not following it in there.`,
          (n, pr) => `The beaver dives to the center of the pond where the water is deep and just sits on the bottom. ${n} has no play here.`,
        ],
      },
    },
    {
      id: 'deer',name: 'Deer', tier: 'hard',
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
      approachDifficulty: 13,
      engagementDifficulty: 15,
      reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} moves through the trees in a slow arc, staying downwind. The deer is grazing in a clearing fifty yards out.`,
        (n, pr) => `${n} finds a game trail and positions ${pr.obj} at a narrow bend. This is where the deer will pass.`,
        (n, pr) => `${n} spots the deer at a stream crossing. ${pr.Sub} ${pr.sub==='they'?'inch':'inches'} forward through the brush one careful step at a time.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} times the approach perfectly — the deer has its head down. ${pr.Sub} ${pr.sub==='they'?'loop':'loops'} the rope around its neck before it can react.`,
        (n, pr) => `${n} throws the net from ten feet. The deer bolts into it and the mesh catches around its legs.`,
        (n, pr) => `${n} and the deer make eye contact. For one frozen second, neither moves. Then ${pr.sub} ${pr.sub==='they'?'dive':'dives'} and somehow ${pr.sub} ${pr.sub==='they'?'get':'gets'} hold.`,
      ],
      engagementFail: [
        (n, pr) => `${n} steps on a branch. The deer's head snaps up. By the time ${pr.sub} ${pr.sub==='they'?'throw':'throws'} the net, it's already running.`,
        (n, pr) => `${n} throws too wide. The deer leaps over the net and is gone in four strides.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The deer bounds into the trees and is gone before ${n} can take a step. Deer are faster than they look.`,
          (n, pr) => `The deer flags its tail white and launches into the forest. The crashing fades quickly.`,
        ],
        feint: [
          (n, pr) => `The deer snorts and stomps once — then holds its ground. ${n} isn't sure if it's going to run or charge.`,
          (n, pr) => `The deer fakes a bolt to the left, then cuts right and clears ${n}'s reach with a single leap.`,
        ],
        counter: [
          (n, pr) => `The deer lowers its head and steps forward. ${n} is not the predator in this scenario anymore.`,
          (n, pr) => `The deer charges instead of fleeing. ${n} dives sideways into the brush and comes up empty-handed.`,
        ],
        escape: [
          (n, pr) => `The deer disappears into the dense brush where ${n} can't follow with the net. It's gone deep.`,
          (n, pr) => `The deer makes it to the cliff edge and picks its way down the rocks. ${n} is not going down there.`,
        ],
      },
    },
    {
      id: 'snake',name: 'Snake', tier: 'hard',
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
      approachDifficulty: 14,
      engagementDifficulty: 14,
      reactionChance: 0.60,
      approach: [
        (n, pr) => `${n} finds the snake basking on a flat rock. ${pr.Sub} ${pr.sub==='they'?'approach':'approaches'} from the far side, forked stick in hand.`,
        (n, pr) => `${n} follows the S-shaped track in the mud to a fallen log. The snake is coiled at the far end.`,
        (n, pr) => `${n} waits by the sunny clearing where snakes warm up. Patience. Eventually one shows.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} pins the snake behind the head with the stick and has it in the bag before it can coil.`,
        (n, pr) => `${n} drops the bag over the snake from above and twists the opening shut. Fast and clean.`,
      ],
      engagementFail: [
        (n, pr) => `${n} goes for the pin and misses. The snake whips around and ${n} drops the stick backing up.`,
        (n, pr) => `${n} has the bag ready but hesitates. The snake does not hesitate. It's under the log and gone.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The snake pours itself under the nearest rock in about two seconds flat. It's gone.`,
          (n, pr) => `The snake stretches out full length and moves with alarming speed into the underbrush.`,
        ],
        feint: [
          (n, pr) => `The snake rears back in strike position — then holds it. ${n} doesn't move. Neither does the snake.`,
          (n, pr) => `The snake makes a short mock strike, pulling back at the last inch. ${n}'s heart is doing something alarming.`,
        ],
        counter: [
          (n, pr) => `The snake strikes for real. ${n} jerks back and the fangs catch only air — barely.`,
          (n, pr) => `The snake launches from coil to full extension in one motion. ${n} stumbles backward off the rock.`,
        ],
        escape: [
          (n, pr) => `The snake pours itself through a crack in the rock wall that ${n} didn't even see. It's gone.`,
          (n, pr) => `The snake slides into the water and vanishes. ${n} stares at the surface. No ripples.`,
        ],
      },
    },
    {
      id: 'wild-turkey',name: 'Wild Turkey', tier: 'hard',
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
      approachDifficulty: 13, engagementDifficulty: 14, reactionChance: 0.60,
      approach: [
        (n, pr) => `${n} spots a lone tom near the treeline, puffed up and gobbling. ${pr.Sub} ${pr.sub==='they'?'circle':'circles'} wide to stay out of its sightline.`,
        (n, pr) => `${n} moves along the brush edge at low angle. The turkey is focused on something else. Not for long.`,
        (n, pr) => `${n} watches the flock from the tree line and picks the one that's drifted furthest from the group.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} gets the net down over the turkey before it can get its wings open. It gobbles the whole way to camp.`,
        (n, pr) => `${n} herds the turkey against a log using a long stick, then sacks it. The turkey registers its objection very loudly.`,
      ],
      engagementFail: [
        (n, pr) => `${n} makes a move and the turkey erupts — wings open, spurs out. ${n} retreats.`,
        (n, pr) => `${n} throws the net. The turkey runs through it like tissue paper and takes off into the trees.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The turkey breaks into a sprint along the treeline, then lifts off and clears the brush by ten feet.`,
          (n, pr) => `The turkey bolts into the flock. Now there are twelve turkeys and ${n} has no idea which one is ${pr.posAdj} target.`,
        ],
        feint: [
          (n, pr) => `The turkey lowers its head, fans its tail, and circles ${n}. Bluffing — probably. ${n} doesn't want to test it.`,
          (n, pr) => `The turkey rushes forward three steps and stops. It's been watching ${n} the whole time.`,
        ],
        counter: [
          (n, pr) => `The turkey charges and connects with its spurs before ${n} can get clear. That's going to leave a mark.`,
          (n, pr) => `The turkey attacks. Beak, spurs, wings, all at once. ${n} covers ${pr.posAdj} face and backs away fast.`,
        ],
        escape: [
          (n, pr) => `The turkey takes off from a standing start and clears the canopy. Didn't know it was that fast.`,
          (n, pr) => `The turkey disappears into the flock and the flock disperses into the woods. Gone.`,
        ],
      },
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
      approachDifficulty: 14, engagementDifficulty: 15, reactionChance: 0.55,
      approach: [
        (n, pr) => `${n} finds a hollow tree with claw marks and feathers at the base. Waits.`,
        (n, pr) => `${n} works through the pine grove at dusk, checking every high branch. The owl knows ${pr.sub}'s ${pr.sub==='they'?'there':'there'} already.`,
        (n, pr) => `${n} backtracks the owl's hunting path by the pellets on the ground. If it hunts here, it'll come back.`,
      ],
      engagementSuccess: [
        (n, pr) => `The owl emerges at dusk. ${n} is already in position. The long-handled net comes down in one clean arc.`,
        (n, pr) => `${n} drapes the net over the roost from above — slow, no sudden movement. The owl bates once and is contained.`,
      ],
      engagementFail: [
        (n, pr) => `${n} commits to the throw. The owl lifts off in complete silence and is gone before the net lands.`,
        (n, pr) => `${n} reaches toward the roost. The owl rotates its head and fixes ${n} with a stare that communicates complete contempt. Then it leaves.`,
      ],
      behaviors: {
        flee: [
          (n, pr) => `The owl opens its wings and rises without a sound. One second it's there. Then it isn't.`,
          (n, pr) => `The owl drops off the branch and glides into the darkness between the trees. No trace.`,
        ],
        feint: [
          (n, pr) => `The owl shifts its weight like it's about to flee, then stays. Waiting to see what ${n} does next.`,
          (n, pr) => `The owl hops two branches higher and stares down. Not fleeing. Positioning.`,
        ],
        counter: [
          (n, pr) => `The owl divebombs ${n} from behind — silent, fast, talons out. ${n} doesn't hear it coming until it's already happened.`,
          (n, pr) => `The owl swoops low and drags its talons across ${pr.posAdj} shoulder. Warning shot. For now.`,
        ],
        escape: [
          (n, pr) => `The owl disappears into the high canopy. ${n} can't follow it up there.`,
          (n, pr) => `The owl glides silently between two trees and is gone. ${n} can't even tell which direction it went.`,
        ],
      },
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
      approachDifficulty: 15,
      engagementDifficulty: 17,
      reactionChance: 0.70,
      approach: [
        (n, pr) => `${n} finds claw marks on a pine. Fresh. ${pr.Sub} ${pr.sub==='they'?'swallow':'swallows'} and keeps going.`,
        (n, pr) => `${n} tracks the bear by broken branches and the smell of fish. Every noise is too loud.`,
        (n, pr) => `${n} sees the bear before the bear sees ${pr.obj}. Three hundred pounds, downwind, distracted. ${pr.Sub} ${pr.sub==='they'?'close':'closes'} the gap.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} snaps the tranq-sack net over the bear's head just as it turns. For a horrible second nothing happens. Then it drops.`,
        (n, pr) => `${n} lands the net clean. The bear thrashes once, twice, and sits down like it's had enough.`,
      ],
      engagementFail: [
        (n, pr) => `${n} throws the net early. The bear bats it aside like a cobweb and keeps coming.`,
        (n, pr) => `${n} hesitates for half a second. The bear does not hesitate at all.`,
      ],
      behaviors: {
        feint: [
          (n, pr) => `The bear charges, stops hard at ten feet, and woofs. ${n} freezes. The bear trots off at an angle, amused.`,
          (n, pr) => `The bear fakes a lunge. ${n} falls backward into a bush. The bear is gone by the time ${pr.sub} ${pr.sub==='they'?'stand':'stands'} up.`,
        ],
        counter: [
          (n, pr) => `The bear closes the gap before ${n} can react and swats ${pr.obj} clean off ${pr.posAdj} feet. ${pr.Sub} ${pr.sub==='they'?'land':'lands'} twenty feet away, breathless.`,
          (n, pr) => `The bear charges. ${n} gets ONE arm up before it hits. ${pr.Sub} ${pr.sub==='they'?'take':'takes'} the full weight and go down hard.`,
        ],
        escape: [
          (n, pr) => `The bear melts into the tree line and is gone. ${n} hears crashing for another minute, then nothing. It could be anywhere.`,
          (n, pr) => `The bear lopes off toward the cliffs. ${n} is going to have to follow it into worse terrain.`,
        ],
        stalk: [
          (n, pr) => `The bear circles behind ${n}. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} hear it until it's ten feet away. The hunt just inverted.`,
          (n, pr) => `${n} realizes ${pr.sub} ${pr.sub==='they'?'are':'is'} the one being followed. The bear has been patient.`,
        ],
        summon: [
          (n, pr) => `The bear roars. Somewhere across the island, another bear answers. This just became everyone's problem.`,
          (n, pr) => `The bear huffs twice. A minute later, two cubs appear on the ridgeline. Mama bear just brought friends.`,
        ],
      },
    },
    {
      id: 'moose',name: 'Moose', tier: 'extreme',
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
      approachDifficulty: 14,
      engagementDifficulty: 18,
      reactionChance: 0.70,
      approach: [
        (n, pr) => `${n} finds the moose at the lake edge, standing chest-deep in the water. It is enormous. ${pr.Sub} ${pr.sub==='they'?'inch':'inches'} closer.`,
        (n, pr) => `${n} follows the trail of splintered saplings and torn bark. Whatever made this was not small.`,
        (n, pr) => `${n} spots the moose in the open meadow and has to decide: approach now or wait. ${pr.Sub} ${pr.sub==='they'?'approach':'approaches'} now.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} gets the rope around the moose's neck on the second try. It drags ${pr.obj} thirty yards before deciding to stop.`,
        (n, pr) => `${n} somehow coaxes the moose toward camp by staying just ahead of it with food. It takes forty minutes. Nobody believed it was possible.`,
      ],
      engagementFail: [
        (n, pr) => `The moose lowers its rack and takes one step forward. ${n} wisely reconsiders.`,
        (n, pr) => `${n} throws the rope. The moose swings its head. The rope bounces off one antler and lands in the mud.`,
      ],
      behaviors: {
        feint: [
          (n, pr) => `The moose snaps its head toward ${n} and pops its ears forward. Then it goes back to eating. ${n} is still breathing hard.`,
          (n, pr) => `The moose takes three rapid steps toward ${n}, stops. ${n} was absolutely certain that was a charge.`,
        ],
        counter: [
          (n, pr) => `The moose charges for real. ${n} gets out of the way with about a foot to spare.`,
          (n, pr) => `The moose turns and kicks with both rear legs. ${n} rolls into the ditch to avoid it. The impact with the ground is impressive.`,
        ],
        escape: [
          (n, pr) => `The moose splashes back into the lake and wades to the far shore. ${n} is not swimming that.`,
          (n, pr) => `The moose crashes into the tree line. The noise of it moving through the forest disappears within thirty seconds.`,
        ],
        stalk: [
          (n, pr) => `${n} turns around to reset — and the moose is right behind ${pr.obj}. It has been following ${pr.obj} for at least five minutes.`,
          (n, pr) => `${n} hears breathing from behind. The moose has looped around and is now between ${pr.obj} and camp.`,
        ],
        summon: [
          (n, pr) => `The moose bellows. Deep and loud. Somewhere in the trees, something bellows back.`,
          (n, pr) => `The moose lets out a long call that echoes across the whole island. ${n} decides this is no longer ${pr.posAdj} problem alone.`,
        ],
      },
    },
    {
      id: 'wolf',name: 'Wolf', tier: 'extreme',
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
      approachDifficulty: 15, engagementDifficulty: 17, reactionChance: 0.70,
      approach: [
        (n, pr) => `${n} finds a fresh kill site — half-eaten, still warm. The wolf is close. ${n} slows way down.`,
        (n, pr) => `${n} sits motionless in the undergrowth for forty minutes. The wolf has been watching since minute two.`,
        (n, pr) => `${n} follows the wolf's track loop and finds where it circles back. Sets up at the return point and waits.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} spends an hour sitting motionless, letting the wolf approach on its own terms. When it's close enough, the net drops in one motion. Done.`,
        (n, pr) => `${n} tracks the lone wolf away from the pack, cuts off its escape route, and gets the net down before it can bolt. Barely.`,
      ],
      engagementFail: [
        (n, pr) => `The wolf reads ${n}'s timing and moves a split second before the net lands.`,
        (n, pr) => `${n} commits. The wolf sidesteps it so smoothly it's almost insulting and disappears into the trees.`,
      ],
      behaviors: {
        feint: [
          (n, pr) => `The wolf charges, stops dead at eight feet, and holds. Neither ${n} nor the wolf moves for a long moment.`,
          (n, pr) => `The wolf ducks sideways and cuts back the other direction. ${n} chased nothing.`,
        ],
        counter: [
          (n, pr) => `The wolf darts forward and bites the bag out of ${n}'s hands, then drops it and trots away.`,
          (n, pr) => `The wolf knocks ${n} sideways with a shoulder hit. Not aggressive — just a message. ${n} gets the message.`,
        ],
        escape: [
          (n, pr) => `The wolf howls once and disappears into the trees. Something answers from far away.`,
          (n, pr) => `The wolf circles back toward the pack territory where ${n} won't follow. Clean exit.`,
        ],
        stalk: [
          (n, pr) => `${n} realizes the wolf has been circling ${pr.obj} for the last ten minutes. The wolf is hunting ${n} now.`,
          (n, pr) => `The wolf drops into a low trot, circling, closing the distance without looking like it's closing. ${n} backs toward the treeline.`,
        ],
        summon: [
          (n, pr) => `The wolf lifts its head and howls. Three seconds later, two more wolves emerge from the treeline.`,
          (n, pr) => `A second wolf appears from the brush to ${n}'s left. The pack is not far behind.`,
        ],
      },
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
      approachDifficulty: 15, engagementDifficulty: 18, reactionChance: 0.70,
      approach: [
        (n, pr) => `${n} finds the alligator sunning on the bank. Eyes closed. Doesn't mean it's not aware.`,
        (n, pr) => `${n} wades in knee-deep from the far end of the bank, moving in fractions of an inch at a time.`,
        (n, pr) => `${n} tracks the gator's basking pattern over an hour and picks the exact spot it'll return to. Now it's just timing.`,
      ],
      engagementSuccess: [
        (n, pr) => `${n} gets low, creeps up from behind, and loops the rope around the snout before it registers the threat. ${pr.Sub} ${pr.sub==='they'?'are':'is'} shaking, but the rope holds.`,
        (n, pr) => `${n} herds the gator toward the bank cage by wading in from the far side. The alligator disagrees, but eventually moves. Barely.`,
      ],
      engagementFail: [
        (n, pr) => `The alligator opens its mouth wide and holds it. ${n} stops moving. They stay like that for a very long time. ${n} backs off first.`,
        (n, pr) => `${n} commits to the rope throw. The alligator lunges forward two feet. ${n} is already gone.`,
      ],
      behaviors: {
        feint: [
          (n, pr) => `The alligator opens its jaws and holds them there. Not charging. Just showing ${n} exactly what's waiting.`,
          (n, pr) => `The alligator slides into the water silently. ${n} can't see it anymore. That's worse.`,
        ],
        counter: [
          (n, pr) => `The alligator spins and snaps. ${n} jumps back just far enough. The jaw closes on air — this time.`,
          (n, pr) => `The alligator tail-whips and catches ${n}'s legs. ${pr.Sub} ${pr.sub==='they'?'go':'goes'} down hard on the muddy bank.`,
        ],
        escape: [
          (n, pr) => `The alligator slides into the water and is gone. Completely invisible from the surface.`,
          (n, pr) => `The alligator submerges. The water goes still. ${n} is alone on the bank with no idea where it went.`,
        ],
        stalk: [
          (n, pr) => `${n} realizes the alligator is no longer where it was. Then ${pr.sub} ${pr.sub==='they'?'spot':'spots'} it — closer, and in the water.`,
          (n, pr) => `The alligator has been following ${n} along the bank. Submerged. Patient. ${n} only notices because the ripples are on the wrong side.`,
        ],
        summon: [
          (n, pr) => `The alligator makes a low rumbling sound that ${n} feels more than hears. A second head rises from the water.`,
          (n, pr) => `Something disturbs the water forty feet behind ${n}. Then closer. Then closer again.`,
        ],
      },
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

// ── Identity Pass: module-scope constants ──

const WW_ANIMAL_EMOJI = {
  Chipmunk:'🐿️', Frog:'🐸', Rabbit:'🐇', Squirrel:'🐿️', Seagull:'🐦',
  Duck:'🦆', Raccoon:'🦝', Goose:'🦢', Skunk:'🦨', Porcupine:'🦔',
  Beaver:'🦫', Deer:'🦌', Snake:'🐍', 'Wild Turkey':'🦃', Owl:'🦉',
  Bear:'🐻', Moose:'🫎', Wolf:'🐺', Alligator:'🐊',
};

function _wwGearEmoji(gearName) {
  const n = String(gearName || '').toLowerCase();
  if (n.includes('tranq'))  return '💉';
  if (n.includes('chainsaw')) return '🪚';
  if (n.includes('net'))    return '🕸️';
  if (n.includes('rope'))   return '🪢';
  if (n.includes('sack') || n.includes('bag')) return '💼';
  if (n.includes('hook'))   return '🎣';
  if (n.includes('smoke'))  return '💣';
  if (n.includes('float'))  return '🛟';
  if (n.includes('paper towel')) return '🧻';
  if (n.includes('flashlight') || n.includes('torch')) return '🔦';
  if (n.includes('binocular')) return '🔭';
  if (n.includes('compass')) return '🧭';
  if (n.includes('knife'))  return '🔪';
  if (n.includes('whistle')) return '🎺';
  if (n.includes('hat') || n.includes('helmet')) return '🧢';
  if (n.includes('fish'))   return '🎣';
  if (n.includes('bait'))   return '🪱';
  return '🎒';
}

const WW_TIER_LOCATIONS = {
  easy:    ['CAMP PERIMETER', 'WEST CLEARING', 'STREAM BANK'],
  medium:  ['NORTH TRAIL', 'DENSE WOODS', 'LAKE SHORE'],
  hard:    ['CANOPY RIDGE', 'SOUTH SWAMP', 'DEEP BRUSH'],
  extreme: ['BEAR COUNTRY', 'CLIFF BASE', 'LOST VALLEY'],
};

const WW_TANNOY_BADGE = [
  '📢 HUNT IN PROGRESS',
  '📢 HOUR TWO',
  '📢 DUSK APPROACHES',
  '📢 LAST LIGHT',
];
function _wwTannoyBadge(round) {
  return WW_TANNOY_BADGE[Math.min(Math.max(0, round), WW_TANNOY_BADGE.length - 1)];
}

const WW_APPROACH_ABORT_FALLBACK = [
  (n, animalName) => `${n} follows the trail for ten minutes, then realizes it's the wrong set of prints.`,
  (n, animalName) => `${n} spots the ${animalName.toLowerCase()}, takes one step forward, and loses it in the undergrowth.`,
  (n, animalName) => `${n} hears the ${animalName.toLowerCase()} but can't find it. Could be anywhere.`,
  (n, animalName) => `${n} circles the same stand of pines three times. The ${animalName.toLowerCase()} is long gone.`,
  (n, animalName) => `${n} doubles back after a crash in the brush. False alarm. Trail cold.`,
  (n, animalName) => `${n} loses the trail at a stream crossing. The ${animalName.toLowerCase()} had better footing.`,
  (n, animalName) => `${n} approaches what turns out to be a hollow log. The ${animalName.toLowerCase()} watched from somewhere else.`,
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
// CALIBRATION: state-penalty coefficients tuned against 100-season baseline.
// Do not modify without re-running the balance test (see docs/superpowers/plans/2026-04-16-wawanakwa-gone-wild-hunt-encounters.md Task 11).
function calcCaptureChance(name, animal, huntState, round = 0) {
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

  // Spec 1: hunter state modifiers
  if (ps.stamina < 20) chance -= 0.10;
  else if (ps.stamina < 40) chance -= 0.05;
  if (ps.morale >= 75) chance += 0.05;
  else if (ps.morale < 20) chance -= 0.05;
  if (ps.supplies === 0) chance -= 0.08;

  // Consumed-once per-attempt modifiers from animal reactions
  chance -= (ps._nextAttemptMalus || 0);
  chance -= (ps._escapedMalus || 0);
  ps._nextAttemptMalus = 0;
  ps._escapedMalus = 0;

  // Zone-wide threat from 'summon' (expires by round)
  if (huntState._summonMalus && round <= huntState._summonMalus.expiresRound) {
    chance -= huntState._summonMalus.amount;
  }

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
// HUNT ENCOUNTER HELPERS (Spec 1)
// ══════════════════════════════════════════════════════════════

function _rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function _staminaPenalty(stamina) {
  if (stamina >= 50) return 0;
  if (stamina >= 20) return 3;
  return 6;
}

function _moralePenalty(morale) {
  if (morale >= 40) return 0;
  if (morale >= 20) return 2;
  return 4;
}

function _applyStateChanges(ps, name, round, timeline, delta) {
  const thresholds = [];
  if (delta.stamina) {
    const before = ps.stamina;
    ps.stamina = Math.max(0, Math.min(100, before + delta.stamina));
    if (before >= 40 && ps.stamina < 40) thresholds.push({ stat: 'stamina', from: before, to: ps.stamina, flavor: 'exhausted', text: `${name} slows to a walk, chest heaving.` });
    if (before > 0 && ps.stamina === 0) thresholds.push({ stat: 'stamina', from: before, to: 0, flavor: 'broken', text: `${name} collapses. Done for the day.` });
  }
  if (delta.morale) {
    const before = ps.morale;
    ps.morale = Math.max(0, Math.min(100, before + delta.morale));
    if (before < 75 && ps.morale >= 75) thresholds.push({ stat: 'morale', from: before, to: ps.morale, flavor: 'rallied', text: `${name} locks in. This one's going to work.` });
    if (before >= 20 && ps.morale < 20) thresholds.push({ stat: 'morale', from: before, to: ps.morale, flavor: 'broken', text: `${name} looks wrecked. Whatever confidence ${name} had this morning — gone.` });
  }
  if (delta.supplies) {
    const before = ps.supplies;
    ps.supplies = Math.max(0, Math.min(3, before + delta.supplies));
    if (before > 0 && ps.supplies === 0) thresholds.push({ stat: 'supplies', from: before, to: 0, flavor: 'tapped', text: `${name} checks their pockets. Nothing left. Barehanded from here.` });
  }
  thresholds.forEach(t => {
    timeline.push({ type: 'stateChange', player: name, round, ...t });
  });
}

const _TIER_BEHAVIOR_POOL = {
  easy:    ['flee', 'freeze'],
  medium:  ['flee', 'freeze', 'call', 'feint'],
  hard:    ['flee', 'feint', 'counter', 'escape'],
  extreme: ['feint', 'counter', 'escape', 'stalk', 'summon'],
};

function _pickBehavior(animal) {
  const pool = _TIER_BEHAVIOR_POOL[animal.tier] || [];
  const available = pool.filter(b => animal.behaviors?.[b]?.length);
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function _behaviorText(animal, behavior, name, pr) {
  const lines = animal.behaviors?.[behavior] || [];
  if (!lines.length) return `${name}'s ${animal.name.toLowerCase()} reacts.`;
  return _rp(lines)(name, pr);
}

function _buildAnimalReaction(animal, behavior, name, round, huntState, pr) {
  const evt = {
    type: 'animalReaction',
    player: name,
    round,
    animal: animal.name,
    animalTier: animal.tier,
    behavior,
    text: _behaviorText(animal, behavior, name, pr),
  };
  if (behavior === 'counter') evt.staminaLoss = 15;
  if (behavior === 'freeze') evt.bonusBeat = true;
  if (behavior === 'call') {
    const others = Object.keys(huntState.players).filter(p => p !== name && !huntState.players[p].captured);
    if (others.length) {
      evt.affectedPlayer = others[Math.floor(Math.random() * others.length)];
    }
  }
  return evt;
}

function _buildHuntBeat(name, round, animal, beat, outcome, text, extra = {}) {
  return {
    type: 'huntBeat',
    player: name,
    round,
    animal: animal.name,
    animalTier: animal.tier,
    beat,
    outcome,
    text,
    ...extra,
  };
}

// ══════════════════════════════════════════════════════════════
// HUNT ENCOUNTER (core per-attempt loop)
// ══════════════════════════════════════════════════════════════
function _runHuntEncounter(name, round, huntState, ep, timeline, badges) {
  const ps = huntState.players[name];
  const animal = ps.animal;
  const s = pStats(name);
  const pr = pronouns(name);

  ps.attemptsMade++;

  // ── FIELD-CAM: per-round location + stamped-beat helper ──
  if (huntState._timeMin === undefined) huntState._timeMin = 0;
  const _FCL = {
    easy:    ['CAMP PERIMETER','SOUTH TRAIL','CLEARING','DOCK AREA'],
    medium:  ['NORTH WOODS','LAKE SHORE','DENSE UNDERGROWTH','HOLLOW LOG'],
    hard:    ['RAVINE','RIDGELINE','EAST TREELINE','ROCKY OUTCROP'],
    extreme: ['DEEP FOREST','CLIFF BASE','MARSHLAND','DANGER ZONE'],
  };
  const _fcLoc = (_FCL[animal.tier] || ['WOODS'])[Math.floor(Math.random() * 4)];
  function _stamped(beat, outcome, text, extra) {
    huntState._timeMin += _rand(4, 11);
    const hh = String(9 + Math.floor(huntState._timeMin / 60)).padStart(2,'0');
    const mm = String(huntState._timeMin % 60).padStart(2,'0');
    const e = _buildHuntBeat(name, round, animal, beat, outcome, text, extra);
    e._ts = `${hh}:${mm}`; e._loc = _fcLoc;
    return e;
  }

  if (ps.stamina === 0) {
    timeline.push(_stamped('approach', 'abort',
      `${name} can barely stand. The hunt continues without ${pr.obj}.`));
    timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: `${name} is too exhausted to attempt.` });
    return;
  }

  // ── BEAT 1: APPROACH ──
  if (ps._feintedLastRound) {
    ps._feintedLastRound = false;
    timeline.push(_stamped('approach', 'pass',
      `${name} is still shaking off the last feint. ${pr.Sub} ${pr.sub==='they'?'push':'pushes'} forward anyway.`));
  } else {
    const approachRoll = s.intuition + s.mental + _rand(-3, 3);
    const approachDiff = (animal.approachDifficulty || 10) + _staminaPenalty(ps.stamina);
    if (approachRoll < approachDiff) {
      timeline.push(_stamped('approach', 'abort',
        _rp(animal.approach || WW_APPROACH_ABORT_FALLBACK)(name, pr)));
      if (Math.random() < 0.50) {
        const behavior = animal.behaviors?.flee?.length ? 'flee' : _pickBehavior(animal);
        if (behavior) timeline.push(_buildAnimalReaction(animal, behavior, name, round, huntState, pr));
      }
      _applyStateChanges(ps, name, round, timeline, { stamina: -5, morale: -5 });
      timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: `${name} lost the trail before getting close.`, _shadow: true });
      return;
    }
    const _approachPassFallback = [
      () => `${name} closes in.`,
      () => `${name} gets within range. The ${animal.name.toLowerCase()} hasn't spotted ${pr.obj} yet.`,
      () => `${name} narrows the gap, moving on instinct. This is going to work.`,
    ];
    timeline.push(_stamped('approach', 'pass',
      _rp(animal.approach || _approachPassFallback)(name, pr)));
  }

  // ── BEAT 2: ENGAGEMENT ──
  const engagementRoll = s.physical + s.boldness + Math.floor((ps.gear?.captureBonus || 0) * 10) + _rand(-3, 3);
  let engagementDiff = (animal.engagementDifficulty || 12) + _moralePenalty(ps.morale);
  if (ps.supplies === 0) engagementDiff += 3;
  _applyStateChanges(ps, name, round, timeline, { stamina: -10, supplies: ps.supplies > 0 ? -1 : 0 });

  let bonusBeat = false;
  if (engagementRoll < engagementDiff) {
    timeline.push(_stamped('engagement', 'fail',
      _rp(animal.engagementFail || [() => `${name} misses the window.`])(name, pr)));

    if (Math.random() < (animal.reactionChance || 0.5)) {
      const behavior = _pickBehavior(animal);
      if (behavior) {
        const reactionEvt = _buildAnimalReaction(animal, behavior, name, round, huntState, pr);
        timeline.push(reactionEvt);
        if (behavior === 'freeze') { bonusBeat = true; _applyStateChanges(ps, name, round, timeline, { stamina: +10 }); }
        if (behavior === 'counter') _applyStateChanges(ps, name, round, timeline, { stamina: -15 });
        if (behavior === 'call' && reactionEvt.affectedPlayer) {
          huntState.players[reactionEvt.affectedPlayer]._nextAttemptMalus = 0.05;
        }
        if (behavior === 'escape') ps._escapedMalus = 0.05;
        if (behavior === 'feint') ps._feintedLastRound = true;
        if (behavior === 'summon') huntState._summonMalus = { expiresRound: round + 1, amount: 0.03 };
      }
    }

    if (!bonusBeat) {
      _applyStateChanges(ps, name, round, timeline, { morale: -15 });
      timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: `${name} couldn't close the deal.`, _shadow: true });
      return;
    }
  } else {
    timeline.push(_stamped('engagement', 'pass',
      _rp(animal.engagementSuccess || [() => `${name} gets within striking distance.`])(name, pr)));
  }

  // ── STALK PRE-RESOLUTION (extreme only) ──
  if (animal.tier === 'extreme' && Math.random() < 0.25 && animal.behaviors?.stalk?.length) {
    const stalkEvt = _buildAnimalReaction(animal, 'stalk', name, round, huntState, pr);
    timeline.push(stalkEvt);
    if (Math.random() < 0.40) {
      _applyStateChanges(ps, name, round, timeline, { stamina: -25, morale: -20 });
      timeline.push(_stamped('resolution', 'fail',
        `${name} freezes. The ${animal.name.toLowerCase()} circles once and vanishes. ${name} has nothing.`));
      timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: `${name} couldn't finish the hunt.`, _shadow: true });
      return;
    }
  }

  // ── BEAT 3: RESOLUTION ──
  let chance = calcCaptureChance(name, animal, huntState, round);
  if (bonusBeat) chance += 0.05;
  ps.personalScore += chance * 10;

  const roll = Math.random();
  if (roll < chance) {
    ps.captured = true;
    ps.captureRound = round;
    huntState.captureOrder.push(name);
    const successText = _rp(animal.attemptSuccess)(name, pr);
    timeline.push(_stamped('resolution', 'pass', successText, { captured: true }));
    timeline.push({ type: 'huntAttempt', player: name, round, success: true, animal: animal.name, text: successText, _shadow: true });
    _applyStateChanges(ps, name, round, timeline, { morale: +15 });
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
      timeline.push(_stamped('resolution', 'fail', mishapText, { mishap: true }));
      timeline.push({ type: 'huntMishap', player: name, round, animal: animal.name, text: mishapText, _shadow: true });
      _applyStateChanges(ps, name, round, timeline, { stamina: -20, morale: -20 });
      if (animal.tier === 'extreme' || animal.tier === 'hard') popDelta(name, -1);
    } else {
      const failText = _rp(animal.attemptFail)(name, pr);
      timeline.push(_stamped('resolution', 'fail', failText));
      timeline.push({ type: 'huntAttempt', player: name, round, success: false, animal: animal.name, text: failText, _shadow: true });
      _applyStateChanges(ps, name, round, timeline, { morale: -15 });
    }
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
      // Hunt-encounter state (Spec 1)
      stamina: 100,
      morale: 50,
      supplies: 3,
      _nextAttemptMalus: 0,
      _feintedLastRound: false,
      _escapedMalus: 0,
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

    // --- Each uncaptured player makes one attempt (multi-beat encounter) ---
    uncaptured.forEach(name => {
      _runHuntEncounter(name, round, huntState, ep, timeline, badges);
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

  // Honor Roll podium — top 3 finishers
  if (huntState.captureOrder.length >= 2) {
    const top3 = finishOrder.slice(0, Math.min(3, finishOrder.length));
    timeline.push({ type: 'honorPodium', players: top3 });
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
      finalStamina: ps.stamina, finalMorale: ps.morale, finalSupplies: ps.supplies,
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
  /* Identity pass: timestamp + location inline with card label */
  .ww-timestamp { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    color:#c33; letter-spacing:1px; margin-right:4px; }
  .ww-location { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    color:#8b7750; letter-spacing:1.5px; margin-right:4px; }
  .ww-label-divider { color:rgba(139,119,80,0.3); margin:0 3px; }
  .ww-label-kind { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    letter-spacing:1px; color:var(--ww-accent, #8b7750); }
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
  .ww-tier-bg::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:0.4; }
  .ww-tier-bg > * { position:relative; z-index:2; }
  .ww-tier-bg--easy::before {
    background:
      radial-gradient(ellipse 40px 22px at 15% 30%, rgba(106,159,58,0.6) 0%, transparent 70%),
      radial-gradient(ellipse 50px 20px at 70% 60%, rgba(106,159,58,0.5) 0%, transparent 70%),
      radial-gradient(ellipse 30px 18px at 40% 85%, rgba(106,159,58,0.5) 0%, transparent 70%);
    animation: ww-rustle 4.5s ease-in-out infinite; }
  @keyframes ww-rustle { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
  .ww-tier-bg--medium::before {
    background:
      radial-gradient(circle at 20% 30%, rgba(200,168,78,0.5) 0%, transparent 18%),
      radial-gradient(circle at 65% 70%, rgba(200,168,78,0.45) 0%, transparent 18%),
      radial-gradient(circle at 85% 20%, rgba(200,168,78,0.45) 0%, transparent 18%),
      radial-gradient(circle at 45% 55%, rgba(200,168,78,0.4) 0%, transparent 18%);
    animation: ww-dapple 2.8s ease-in-out infinite; }
  @keyframes ww-dapple { 0%,100%{opacity:0.25} 50%{opacity:0.55} }
  .ww-tier-bg--hard::before {
    background:repeating-linear-gradient(135deg,
      rgba(204,51,51,0.22) 0px, rgba(204,51,51,0.22) 8px,
      transparent 8px, transparent 16px);
    animation: ww-heat-ripple 2s ease-in-out infinite; }
  @keyframes ww-heat-ripple { 0%,100%{transform:skewX(0deg)} 50%{transform:skewX(-1deg)} }
  .ww-tier-bg--extreme::before {
    background:
      repeating-linear-gradient(0deg,
        rgba(204,51,51,0.22) 0px, rgba(204,51,51,0.22) 1px,
        transparent 1px, transparent 4px),
      radial-gradient(ellipse at 50% 50%, rgba(160,20,20,0.15) 0%, transparent 70%),
      linear-gradient(135deg, rgba(40,10,15,0.3), rgba(20,5,10,0.4));
    animation: ww-tv-flicker 0.9s steps(4, end) infinite; }
  @keyframes ww-tv-flicker {
    0%   { opacity:0.35; }
    20%  { opacity:0.8; }
    40%  { opacity:0.3; }
    60%  { opacity:0.65; }
    80%  { opacity:0.4; }
    100% { opacity:0.35; }
  }

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

  // Identity pass: annotation pre-pass (timestamp + location per event)
  const _annHunterLocs = {};
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const pool = WW_TIER_LOCATIONS[r?.animalTier] || WW_TIER_LOCATIONS.medium;
    _annHunterLocs[name] = pool[Math.floor(Math.random() * pool.length)];
  });
  let _annClockMin = 7 * 60; // 07:00
  const _annFmtTime = (mins) => {
    const m = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  const _annLocFor = (evt) => {
    if (evt.type === 'animalDraw') return 'DOCK';
    if (evt.type === 'gearGrab') return 'BOATHOUSE';
    if (evt.type === 'chrisQuip') return 'RANGER STATION';
    if (evt.type === 'feastReveal' || evt.type === 'honorPodium') return 'CAMP MESS';
    if (evt.type === 'punishmentReveal') return 'LATRINE';
    if (evt.type === 'tranqChaos') return 'INCIDENT ZONE';
    if (evt.player && _annHunterLocs[evt.player]) return _annHunterLocs[evt.player];
    return 'WAWANAKWA ISLAND';
  };
  const _annAdvances = (evt) =>
    !(evt.type === 'stateChange' || evt.type === 'animalReaction' || evt.type === 'chrisQuip');
  const annotations = ww.timeline.map(evt => {
    if (_annAdvances(evt)) _annClockMin += 3 + Math.floor(Math.random() * 10);
    return { time: _annFmtTime(_annClockMin), location: _annLocFor(evt) };
  });

  let timelineIdx = 0;

  for (const evt of ww.timeline) {
    // Skip legacy shadow events — they duplicate huntBeat data and render nothing
    const ann = annotations[timelineIdx++];
    if (evt._shadow) continue;

    let huntingDelta = 0, capturedDelta = 0, failedDelta = 0, cameraShake = false;

    // Insert round separator tannoy with live census
    if (evt.round !== undefined && evt.round !== lastRound && (evt.type === 'huntAttempt' || evt.type === 'huntMishap' || evt.type === 'huntFail' || evt.type === 'huntBeat')) {
      const label = evt.round <= 3 ? `ROUND ${evt.round + 1}` : 'FINAL ROUND — LAST CHANCE';
      // Count captures/still hunting up to this point
      let capturedSoFar = 0;
      for (const s of steps) { capturedSoFar += s.capturedDelta || 0; }
      const huntingSoFar = huntingStart - capturedSoFar;
      const censusStr = `${capturedSoFar} CAPTURED · ${Math.max(0, huntingSoFar)} STILL HUNTING`;
      const tannoyHtml = `<div class="ww-tannoy"><div class="ww-tannoy-badge">${_wwTannoyBadge(evt.round)}</div><div class="ww-tannoy-title">${label}</div><div class="ww-tannoy-census">STATUS: ${censusStr}</div></div>`;
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

    steps.push({ html: _renderWWStep(evt, ww, ALL_ANIMAL_NAMES, ann), huntingDelta, capturedDelta, failedDelta, cameraShake, tranqPair });
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
    // State bars (Spec 1)
    const stam = typeof r.finalStamina === 'number' ? r.finalStamina : 100;
    const mor = typeof r.finalMorale === 'number' ? r.finalMorale : 50;
    const sup = typeof r.finalSupplies === 'number' ? r.finalSupplies : 3;
    const stamColor = stam >= 50 ? '#6a9f3a' : stam >= 20 ? '#c8a84e' : '#c33';
    const morColor = mor >= 60 ? '#6a9f3a' : mor >= 30 ? '#c8a84e' : '#c33';
    const supColor = sup >= 2 ? '#6a9f3a' : sup === 1 ? '#c8a84e' : '#c33';
    html += `<div style="display:grid;grid-template-columns:auto 1fr auto;gap:3px 6px;align-items:center;font-size:8px;color:#8b7750;margin-top:3px;font-family:'Courier New',monospace">`;
    html += `<span>💪</span><div class="ww-progress-bar" style="height:3px;margin:0"><div class="ww-progress-fill" style="--target-width:${stam}%;background:${stamColor}"></div></div><span style="color:${stamColor};min-width:22px;text-align:right">${stam}</span>`;
    html += `<span>🔥</span><div class="ww-progress-bar" style="height:3px;margin:0"><div class="ww-progress-fill" style="--target-width:${mor}%;background:${morColor}"></div></div><span style="color:${morColor};min-width:22px;text-align:right">${mor}</span>`;
    html += `<span>🎒</span><div class="ww-progress-bar" style="height:3px;margin:0"><div class="ww-progress-fill" style="--target-width:${sup * 33.33}%;background:${supColor}"></div></div><span style="color:${supColor};min-width:22px;text-align:right">${sup}/3</span>`;
    html += `</div>`;
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
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES, annotation = null) {
  const GOLD = '#c8a84e', GREEN = '#6a9f3a', RED = '#c33', GREY = '#8b7750', ORANGE = '#c8a84e', PINK = '#d4789a', BLUE = '#7a9ec2', PURPLE = '#a05050';

  // Identity pass: standardized label prefix (timestamp + location + kind)
  function _wwLabel(ann, kindHtml) {
    if (!ann) return kindHtml;
    return `<span class="ww-timestamp">${ann.time}</span>` +
           `<span class="ww-location">${ann.location}</span>` +
           `<span class="ww-label-divider">·</span>` +
           `<span class="ww-label-kind">${kindHtml}</span>`;
  }

  function wrapTier(tier, inner) {
    if (!tier) return inner;
    return `<div class="ww-tier-bg ww-tier-bg--${tier}">${inner}</div>`;
  }

  // ── HUNT BEAT (Spec 1 multi-beat encounter) ──
  if (evt.type === 'huntBeat') {
    const beatConfig = {
      approach:   { color: BLUE,   emoji: '👣', label: 'APPROACH' },
      engagement: { color: ORANGE, emoji: '⚔️', label: 'ENGAGEMENT' },
      resolution: { color: evt.outcome === 'pass' ? GREEN : RED, emoji: evt.outcome === 'pass' ? '✅' : '❌', label: 'RESOLUTION' },
    };
    const cfg = beatConfig[evt.beat] || { color: GREY, emoji: '·', label: (evt.beat || '').toUpperCase() };
    const outcomeBadge = evt.outcome === 'abort' ? ' · ABORT' : evt.outcome === 'fail' ? ' · FAIL' : '';
    const animalEmoji = WW_ANIMAL_EMOJI[evt.animal] || '🐾';
    let h = `<div class="ww-card" style="--ww-accent:${cfg.color};padding:8px 12px;margin-bottom:3px">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, `${cfg.emoji} ${cfg.label}${outcomeBadge} · ${animalEmoji} ${(evt.animal || '').toUpperCase()}`)}</div>`;
    h += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px">`;
    if (evt.player) h += rpPortrait(evt.player, 'xs');
    h += `<div class="ww-card-body">${evt.text || ''}</div>`;
    h += `</div>`;
    if (evt.captured) h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${GREEN}">CAPTURED!</span></div>`;
    if (evt.mishap) h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${RED}">MISHAP</span></div>`;
    const _footerEmoji = WW_ANIMAL_EMOJI[evt.animal] || '';
    if (evt.animal) h += `<div class="ww-card-footer">${_footerEmoji} ${evt.animal}</div>`;
    h += `</div>`;
    return h;
  }

  // ── ANIMAL REACTION ──
  if (evt.type === 'animalReaction') {
    const behaviorConfig = {
      flee:    { color: GREY,   emoji: '💨', label: 'FLEES' },
      freeze:  { color: BLUE,   emoji: '🧊', label: 'FREEZES' },
      call:    { color: ORANGE, emoji: '📢', label: 'CALLS FOR BACKUP' },
      feint:   { color: PURPLE, emoji: '🎭', label: 'FEINTS' },
      counter: { color: RED,    emoji: '💥', label: 'COUNTER-ATTACK' },
      escape:  { color: ORANGE, emoji: '🏃', label: 'ESCAPES TO HARDER TERRAIN' },
      stalk:   { color: RED,    emoji: '👁️', label: 'STALKS THE HUNTER' },
      summon:  { color: PURPLE, emoji: '🐾', label: 'SUMMONS PACK' },
    };
    const cfg = behaviorConfig[evt.behavior] || { color: GREY, emoji: '·', label: (evt.behavior || '').toUpperCase() };
    let h = `<div class="ww-card" style="--ww-accent:${cfg.color};padding:8px 12px;margin-bottom:3px;margin-left:16px">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, `${cfg.emoji} ${(evt.animal || '').toUpperCase()} ${cfg.label}`)}</div>`;
    h += `<div class="ww-card-body">${evt.text || ''}</div>`;
    if (evt.affectedPlayer) h += `<div class="ww-card-footer">Also affects: ${evt.affectedPlayer}</div>`;
    h += `</div>`;
    return h;
  }

  // ── STATE CHANGE (threshold callout) ──
  if (evt.type === 'stateChange') {
    const flavorColor = { exhausted: ORANGE, broken: RED, rallied: GREEN, restocked: GREEN, tapped: GREY }[evt.flavor] || GREY;
    const statEmoji = { stamina: '💪', morale: '🔥', supplies: '🎒' }[evt.stat] || '·';
    let h = `<div style="display:flex;align-items:center;gap:6px;padding:4px 12px;margin:2px 0 4px 32px">`;
    h += `<span style="color:${flavorColor}">${statEmoji}</span><span class="ww-card-body" style="color:${flavorColor}">${evt.text || ''}</span>`;
    h += `</div>`;
    return h;
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
    h += `<div class="ww-card-label">${_wwLabel(annotation, '🎲 ANIMAL DRAW')}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    h += `${rpPortrait(evt.player, 'sm')}`;
    h += `<span style="font-weight:700;color:#d4c8a8;font-size:13px">${evt.player}</span>`;
    h += `<div class="ww-reel" style="--reel-start:0px;--reel-final:${reelFinal}px"><div class="ww-reel-window"></div><div class="ww-reel-strip">`;
    reelNames.forEach(a => { h += `<div>${WW_ANIMAL_EMOJI[a] || '🐾'} ${a}</div>`; });
    h += `</div></div>`;
    h += `<span class="ww-tier ww-tier--${evt.tier}">${evt.tier.toUpperCase()}</span>`;
    h += `</div>`;
    const animalEm = WW_ANIMAL_EMOJI[evt.animal] || '';
    h += `<div class="ww-card-body" style="margin-top:6px">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${color}">${animalEm} ${tierStamps[evt.tier] || evt.tier.toUpperCase()}: ${evt.animal.toUpperCase()}</span></div>`;
    h += `</div>`;
    return wrapTier(evt.tier, h);
  }
  if (evt.type === 'gearGrab') {
    const isArmed = (evt.gear || '').toLowerCase().includes('tranq');
    const gearEmoji = _wwGearEmoji(evt.gear);
    const cardClass = isArmed ? 'ww-gear-card ww-gear-card--armed' : 'ww-gear-card';
    let h = `<div class="ww-card" style="--ww-accent:${isArmed ? RED : '#8b5a2b'}">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, '🎒 GEAR GRAB')}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    h += `${rpPortrait(evt.player, 'sm')}`;
    h += `<span style="font-weight:700;color:#d4c8a8">${evt.player}</span>`;
    h += `<span class="${cardClass}">${gearEmoji}${gearEmoji ? ' ' : ''}${evt.gear} <span style="color:#8b7750;font-size:9px">(${evt.gearTier})</span></span>`;
    h += `</div>`;
    h += `<div class="ww-card-body" style="margin-top:4px">${evt.text}</div>`;
    if (isArmed) h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${RED}">ARMED AND DANGEROUS</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── CHRIS QUIP ──
  if (evt.type === 'chrisQuip') {
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, '📢 CHRIS MCLEAN')}</div>`;
    h += `<div class="ww-card-body" style="font-style:italic">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT ATTEMPT (success) ──
  if (evt.type === 'huntAttempt' && evt.success) {
    if (evt._shadow) return '';
    let h = `<div class="ww-card" style="--ww-accent:${GREEN}">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, `✅ CAPTURE — ${(evt.animal || '').toUpperCase()}`)}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${GREEN}">CAUGHT!</span></div>`;
    h += `<div class="ww-card-footer">Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return wrapTier(ww.huntResults?.[evt.player]?.animalTier, h);
  }

  // ── HUNT ATTEMPT (fail) ──
  if (evt.type === 'huntAttempt' && !evt.success) {
    if (evt._shadow) return '';
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, `❌ FAILED ATTEMPT — ${(evt.animal || '').toUpperCase()}`)}</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${rpPortrait(evt.player, 'sm')}<span style="font-weight:700;color:#d4c8a8">${evt.player}</span></div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div class="ww-card-footer">Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return wrapTier(ww.huntResults?.[evt.player]?.animalTier, h);
  }

  // ── HUNT MISHAP ──
  if (evt.type === 'huntMishap') {
    if (evt._shadow) return '';
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
    h += `<div class="ww-card-label">${_wwLabel(annotation, `💥 MISHAP — ${(evt.animal || '').toUpperCase()}`)}</div>`;
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
    h += `<div class="ww-card-label">${_wwLabel(annotation, `💀 NO CATCH — ${(evt.animal || '').toUpperCase()}`)}</div>`;
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
    h += `<div class="ww-card-label">${_wwLabel(annotation, `<span class="ww-dart">💉</span> TRANQUILIZER CHAOS${evt.badgeText ? ' · ' + evt.badgeText : ''}`)}</div>`;
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

  // ── FEAST REVEAL (food spread) ──
  if (evt.type === 'feastReveal') {
    const winner = evt.player || ww.immunityWinner || '???';
    const FOODS = ['🍗','🍔','🍕','🥩','🍰','🥧','🍦','🍩','🌮','🥞','🍝','🍣'];
    const foodItems = [...FOODS].sort(() => Math.random() - 0.5).slice(0, 8);
    const positions = [
      {x:'-105px',y:'30px'},{x:'-75px',y:'55px'},{x:'-40px',y:'75px'},{x:'-10px',y:'80px'},
      {x:'20px',y:'80px'},{x:'50px',y:'75px'},{x:'85px',y:'55px'},{x:'115px',y:'30px'},
    ];
    let foodHtml = `<div class="ww-food-spread">`;
    foodItems.forEach((food, fi) => {
      const pos = positions[fi] || { x: `${(fi - 4) * 28}px`, y: '50px' };
      foodHtml += `<span class="ww-food-item" style="--x:${pos.x};--y:${pos.y};--float-delay:${fi * 90}ms">${food}</span>`;
    });
    foodHtml += `</div>`;

    let h = `<div class="ww-curtain-wrap">`;
    h += `<div class="ww-spotlight">`;
    h += `<div class="ww-trophy-wrap">`;
    h += rpPortrait(winner, 'xl');
    h += `<div style="font-family:var(--font-display,'Impact',sans-serif);font-size:22px;font-weight:800;color:${GOLD};letter-spacing:2px;margin-top:8px">${winner}</div>`;
    h += `<div style="font-size:12px;color:#d4c8a8;margin-top:4px">IMMUNITY + FEAST OF ALL THEIR FAVORITES</div>`;
    h += `</div>`;
    h += foodHtml;
    h += `<div style="margin-top:10px"><span class="ww-stamp" style="color:${GOLD}">🏆 FEAST WINNER</span></div>`;
    h += `</div></div>`;
    return h;
  }

  // ── HONOR ROLL PODIUM ──
  if (evt.type === 'honorPodium') {
    const podiumPlayers = evt.players || [];
    const rankColors = ['#d4a017','#c0c0c0','#cd7f32'];
    const rankLabels = ['1ST','2ND','3RD'];
    const rankHeights = ['90px','74px','60px'];
    let h = `<div class="ww-podium">`;
    // Reorder: 2nd, 1st, 3rd for classic podium display
    const displayOrder = [
      podiumPlayers[1] ? 1 : null,
      podiumPlayers[0] ? 0 : null,
      podiumPlayers[2] ? 2 : null,
    ].filter(i => i !== null && podiumPlayers[i]);
    displayOrder.forEach(rankIdx => {
      const name = podiumPlayers[rankIdx];
      const col = rankColors[rankIdx] || GREY;
      const r = ww.huntResults?.[name];
      const statLine = r ? `${r.animal} · ${r.attemptsMade} tries` : '';
      h += `<div class="ww-podium-plinth" data-rank="${rankIdx + 1}" style="--podium-color:${col};--podium-height:${rankHeights[rankIdx]}">`;
      h += `<div class="ww-podium-portrait">${rpPortrait(name, 'sm')}</div>`;
      h += `<div class="ww-podium-name">${name}</div>`;
      if (statLine) h += `<div class="ww-podium-stat">${statLine}</div>`;
      h += `<div class="ww-podium-block"><span class="ww-podium-rank">${rankLabels[rankIdx]}</span></div>`;
      h += `</div>`;
    });
    h += `</div>`;
    return h;
  }

  // ── PUNISHMENT REVEAL ──
  if (evt.type === 'punishmentReveal') {
    const loser = evt.player || ww.punishmentTarget || '???';
    let h = `<div class="ww-card ww-card--punish" style="--ww-accent:${RED};animation:ww-scan-in 0.35s ease-out both,ww-pulse-red 0.6s 0.35s 2">`;
    h += `<div class="ww-card-label">${_wwLabel(annotation, '🚽 BATHROOM DUTY')}</div>`;
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
    h += `<div class="ww-card-label">${_wwLabel(annotation, `${cfg.emoji} ${cfg.label}${evt.badgeText ? ' · ' + evt.badgeText : ''}`)}</div>`;
    if (evtPortraits) h += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">${evtPortraits}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // ── FALLBACK ──
  let h = `<div class="ww-card" style="--ww-accent:${GREY}">`;
  h += `<div class="ww-card-label">${_wwLabel(annotation, `📋 ${(evt.type || 'EVENT').toUpperCase()}`)}</div>`;
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

  // Alliance evidence board
  const allianceEvents = (ww.timeline || []).filter(e => e.type === 'huntEvent' && (e.subtype === 'alliance-accepted' || e.subtype === 'alliance-rejected' || e.subtype === 'alliance-backfire'));
  if (allianceEvents.length) {
    const boardId = `ww-evidence-alliance-${ww.immunityWinner || 'ep'}`;
    html += `<div class="ww-evidence-board" id="${boardId}" style="margin-top:12px">`;
    html += `<div class="ww-evidence-board-title">🤝 ALLIANCE FILE</div>`;
    html += `<div class="ww-evidence-pins">`;
    allianceEvents.forEach((ae, i) => {
      const pinA = ae.players?.[0];
      const pinB = ae.players?.[1];
      const subtypeColor = ae.subtype === 'alliance-accepted' ? GOLD : ae.subtype === 'alliance-backfire' ? RED : GREY;
      const subtypeIcon = ae.subtype === 'alliance-accepted' ? '✅' : ae.subtype === 'alliance-backfire' ? '🗡️' : '🚫';
      const pinIdA = `ww-pin-al-${boardId}-${i}-a`;
      const pinIdB = `ww-pin-al-${boardId}-${i}-b`;
      html += `<div class="ww-evidence-pin" id="${pinIdA}" data-line-to="${pinIdB}" data-line-class="ww-evidence-line--${ae.subtype === 'alliance-accepted' ? 'help' : 'rival'}" style="--pin-color:${subtypeColor}">`;
      html += `<div class="ww-evidence-pin-portrait">${pinA ? rpPortrait(pinA, 'xs') : ''}</div>`;
      html += `<div class="ww-evidence-pin-name">${pinA || '???'}</div>`;
      html += `<div class="ww-evidence-pin-badge">${subtypeIcon}</div>`;
      html += `</div>`;
      if (pinB) {
        html += `<div class="ww-evidence-pin" id="${pinIdB}" style="--pin-color:${subtypeColor}">`;
        html += `<div class="ww-evidence-pin-portrait">${rpPortrait(pinB, 'xs')}</div>`;
        html += `<div class="ww-evidence-pin-name">${pinB}</div>`;
        html += `<div class="ww-evidence-pin-badge">${ae.subtype.replace(/-/g,' ').toUpperCase()}</div>`;
        html += `</div>`;
      }
    });
    html += `</div>`;
    html += `<script>setTimeout(function(){window._wwDrawEvidenceLines && window._wwDrawEvidenceLines('${boardId}')},50)<\/script>`;
    html += `</div>`;
  }

  // Tranq evidence board
  const tranqEvents = (ww.timeline || []).filter(e => e.type === 'tranqChaos');
  if (tranqEvents.length) {
    const boardId = `ww-evidence-tranq-${ww.immunityWinner || 'ep'}`;
    html += `<div class="ww-evidence-board" id="${boardId}" style="margin-top:12px;border-color:rgba(248,81,73,0.25)">`;
    html += `<div class="ww-evidence-board-title" style="color:${RED}">💉 INCIDENT REPORT — TRANQUILIZER GUN</div>`;
    html += `<div class="ww-evidence-pins">`;
    tranqEvents.forEach((te, i) => {
      const shooter = te.players?.[0];
      const victim = te.players?.[1];
      const pinIdS = `ww-pin-tq-${boardId}-${i}-s`;
      const pinIdV = `ww-pin-tq-${boardId}-${i}-v`;
      html += `<div class="ww-evidence-pin" id="${pinIdS}" data-line-to="${pinIdV}" data-line-class="ww-evidence-line--tranq" style="--pin-color:${RED}">`;
      html += `<div class="ww-evidence-pin-portrait">${shooter ? rpPortrait(shooter, 'xs') : '🔫'}</div>`;
      html += `<div class="ww-evidence-pin-name">${shooter || 'Unknown'}</div>`;
      html += `<div class="ww-evidence-pin-badge">SHOOTER</div>`;
      html += `</div>`;
      if (victim) {
        html += `<div class="ww-evidence-pin" id="${pinIdV}" style="--pin-color:${RED}">`;
        html += `<div class="ww-evidence-pin-portrait">${rpPortrait(victim, 'xs')}</div>`;
        html += `<div class="ww-evidence-pin-name">${victim}</div>`;
        html += `<div class="ww-evidence-pin-badge">VICTIM</div>`;
        html += `</div>`;
      } else {
        html += `<div class="ww-evidence-pin" id="${pinIdV}" style="--pin-color:${GREY}">`;
        html += `<div class="ww-evidence-pin-portrait">🎯</div>`;
        html += `<div class="ww-evidence-pin-name">${(te.subtype || 'miss').replace(/-/g,' ').toUpperCase()}</div>`;
        html += `<div class="ww-evidence-pin-badge">TARGET</div>`;
        html += `</div>`;
      }
    });
    html += `</div>`;
    html += `<script>setTimeout(function(){window._wwDrawEvidenceLines && window._wwDrawEvidenceLines('${boardId}')},50)<\/script>`;
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

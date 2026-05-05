// js/chal/rock-the-dock.js — Rock the Dock: pre-merge tribe challenge (ocean swim + dock relay)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function host() { return seasonConfig?.hostName || 'Chris'; }
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
const NICE = new Set(['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat']);
const VILLAIN = new Set(['villain','mastermind','schemer']);
function _isVillain(n) { return VILLAIN.has(arch(n)); }
function _isNice(n) { return NICE.has(arch(n)); }
function _canScheme(n) { if (_isVillain(n)) return true; if (_isNice(n)) return false; const s = pStats(n); return s.strategic >= 6 && s.loyalty <= 4; }

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

const STRONG_SWIM = [
  (n, pr) => `${n} cuts through the water like ${pr.sub} was born in it. Smooth, powerful strokes.`,
  (n, pr) => `${n} surges ahead with a textbook front crawl. ${pr.Sub} barely looks winded.`,
  (n, pr) => `The ocean parts for ${n}. ${pr.Sub} kicks hard and pulls away from the pack.`,
  (n, pr) => `${n} finds ${pr.posAdj} rhythm early and never loses it. Strong, even strokes all the way.`,
  (n, pr) => `${n} tucks ${pr.posAdj} head and sprints through the surf. Raw power on display.`,
  (n, pr) => `Water flies as ${n} churns toward the dock. ${pr.Sub} makes it look effortless.`,
];

const STRUGGLE_SWIM = [
  (n, pr) => `${n} flails in the choppy water. Every stroke looks like a fight for survival.`,
  (n, pr) => `${n} swallows a mouthful of saltwater and sputters. ${pr.Sub} is falling behind.`,
  (n, pr) => `The current drags ${n} sideways. ${pr.Sub} kicks hard but barely moves forward.`,
  (n, pr) => `${n} thrashes against the waves, arms windmilling. This isn't swimming — this is drowning slowly.`,
  (n, pr) => `${n} gasps and chokes on a wave. ${pr.posAdj} teammates watch nervously from ahead.`,
  (n, pr) => `Every wave pushes ${n} back two strokes. ${pr.Sub} is losing ground fast.`,
];

const RESCUE_TEXT = [
  (r, f, rPr) => `${r} loops back without hesitation and grabs ${f} by the arm. "Kick! I've got you!" ${r} hauls ${f} forward.`,
  (r, f, rPr) => `${r} sees ${f} going under and swims back hard. ${rPr.Sub} hooks an arm around ${f} and drags ${f} toward the dock.`,
  (r, f, rPr) => `"Stay with me!" ${r} shouts, pulling ${f} above the waterline. ${rPr.posAdj} muscles scream but ${rPr.sub} doesn't let go.`,
  (r, f, rPr) => `${r} flips onto ${rPr.posAdj} back and tows ${f} the last fifty meters. Pure strength, zero hesitation.`,
  (r, f, rPr) => `${f} starts sinking. ${r} is there in three strokes, arm under ${f}'s chin, kicking for both of them.`,
];

const FORMATION_ADVOCATE = [
  (n, pr, form) => `${n} pounds the sand. "We go ${form}. Everyone stays tight, everyone finishes. Trust me."`,
  (n, pr, form) => `"${form}!" ${n} draws it in the sand with ${pr.posAdj} finger. "This is how we win the swim."`,
  (n, pr, form) => `${n} looks at ${pr.posAdj} tribe. "I've thought about this. ${form} gives us the best shot."`,
  (n, pr, form) => `"Listen up," ${n} says. "${form}. It's the only formation that makes sense for our team."`,
  (n, pr, form) => `${n} steps forward with a plan. "${form}. Stick to it and we'll be first to the dock."`,
  (n, pr, form) => `${n} gestures at the ocean. "${form} — that's our edge. Who's in?"`,
];

const CHUG_FAST = [
  (n, pr) => `${n} tips the jug back and drains it in three massive gulps. ${pr.Sub} slams it down and wipes ${pr.posAdj} mouth.`,
  (n, pr) => `${n} doesn't even flinch. The entire jug disappears in seconds. ${pr.Sub} belches triumphantly.`,
  (n, pr) => `The jug empties like someone pulled the plug. ${n} grins through the foam. Done.`,
  (n, pr) => `${n} chugs with the intensity of someone who's been training for this exact moment.`,
  (n, pr) => `"DONE!" ${n} yells, slamming the empty jug on the dock. Not a drop left.`,
  (n, pr) => `${n} tilts ${pr.posAdj} head back and the liquid vanishes. ${pr.Sub} crushes it.`,
];

const CHUG_FAIL = [
  (n, pr) => `${n} takes one sip and gags. The mystery liquid fights back. Hard.`,
  (n, pr) => `${n} tries to power through but ${pr.posAdj} throat refuses. The jug is still half full.`,
  (n, pr) => `The smell alone makes ${n} retch. ${pr.Sub} manages a few sips before pushing the jug away.`,
  (n, pr) => `${n} goes green after the first gulp. ${pr.posAdj} eyes water. This is not going well.`,
  (n, pr) => `"What IS this?!" ${n} sputters, liquid dribbling down ${pr.posAdj} chin. Not even close to finished.`,
  (n, pr) => `${n} holds ${pr.posAdj} nose and drinks. Then stops. Then drinks again. Then gives up.`,
];

const DECIPHER_PASS = [
  (n, pr) => `${n} listens carefully, tilts ${pr.posAdj} head, then nods. "Got it. I know what to do."`,
  (n, pr) => `It takes ${n} three tries, but ${pr.sub} cracks the code. The instructions are clear now.`,
  (n, pr) => `${n} squints at the old fisherman. "Wait... you're saying to go LEFT at the buoy?" Nailed it.`,
  (n, pr) => `${n} catches every word through the thick accent. ${pr.Sub} translates for the team without missing a beat.`,
  (n, pr) => `The fisherman rambles. ${n} somehow follows every word. "I understood that. Completely."`,
  (n, pr) => `${n} deciphers the garbled instructions with surprising ease. ${pr.posAdj} tribe stares in disbelief.`,
];

const DECIPHER_FAIL = [
  (n, pr) => `${n} stares blankly at the fisherman. "I... what? Can you repeat that? Slower?"`,
  (n, pr) => `The fisherman speaks. ${n} blinks. The fisherman speaks again. ${n} blinks harder. Nothing.`,
  (n, pr) => `"Was that even a language?" ${n} whispers to ${pr.posAdj} teammates. Completely lost.`,
  (n, pr) => `${n} nods confidently despite understanding zero percent of what was said.`,
  (n, pr) => `${n}'s face goes through seven stages of confusion. ${pr.Sub} didn't catch a single word.`,
  (n, pr) => `The fisherman finishes. ${n} pauses. "So... do we go left or right?" Wrong question entirely.`,
];

const STUNT_PASS = [
  (n, pr) => `${n} scales the rope like a spider. Fast, controlled, no wasted motion.`,
  (n, pr) => `${n} hauls the barrel up the ramp with brute force. It thuds into place perfectly.`,
  (n, pr) => `The obstacle doesn't stand a chance. ${n} powers through it with raw athleticism.`,
  (n, pr) => `${n} swings across the gap and sticks the landing. ${pr.Sub} pumps ${pr.posAdj} fist.`,
  (n, pr) => `${n} charges the obstacle and clears it on the first attempt. Impressive.`,
  (n, pr) => `${n} grabs the rope, plants ${pr.posAdj} feet, and climbs. No hesitation, no slip.`,
];

const STUNT_FAIL = [
  (n, pr) => `${n} grabs the rope and immediately slides back down. ${pr.posAdj} hands can't hold.`,
  (n, pr) => `The barrel rolls off the ramp and nearly crushes ${n}. ${pr.Sub} has to start over.`,
  (n, pr) => `${n} slips on the wet dock planks and crashes into the obstacle. Not even close.`,
  (n, pr) => `${n} reaches for the top of the rope and misses by a foot. Down ${pr.sub} goes.`,
  (n, pr) => `The obstacle wins this round. ${n} falls on ${pr.posAdj} back and stares at the sky.`,
  (n, pr) => `${n} launches at the rope climb with maximum effort and minimum result.`,
];

const FISH_KISS_PASS = [
  (n, pr) => `${n} closes ${pr.posAdj} eyes, leans in, and plants one right on the cod. The crowd goes wild.`,
  (n, pr) => `${n} grabs the fish, whispers "I'm sorry," and kisses it. Done. Moving on. Never speaking of this again.`,
  (n, pr) => `${n} pecks the fish and holds it up like a trophy. "THAT'S how you do it!"`,
  (n, pr) => `Without breaking eye contact with ${pr.posAdj} tribe, ${n} kisses the cod. Stone cold.`,
  (n, pr) => `${n} gives the fish a full smooch. ${pr.Sub} pulls back and nods. "Not bad, actually."`,
  (n, pr) => `${n} takes a deep breath, aims for the fish's face, and commits. It's over in a second.`,
];

const FISH_KISS_REFUSE = [
  (n, pr) => `${n} holds the fish at arm's length. "No. Absolutely not. I'd rather lose."`,
  (n, pr) => `${n} looks at the cod. The cod looks at ${n}. ${n} puts it down. "I can't."`,
  (n, pr) => `"You want me to KISS that?!" ${n} drops the fish like it burned ${pr.obj}. "This is inhumane."`,
  (n, pr) => `${n} dry-heaves at the smell alone. The fish stays unkissed. ${pr.posAdj} tribe groans.`,
  (n, pr) => `${n} brings the fish close, gags, and shoves it away. "I physically cannot do this."`,
  (n, pr) => `${n} stares at the fish for ten agonizing seconds before stepping back. "Pass. Hard pass."`,
];

const FISH_KISS_CROWD = {
  pass: {
    villain: [
      (w, k) => `${w} cackles. "The look on your FACE! Priceless. Do it again."`,
      (w, k) => `"That fish has better taste than you do," ${w} sneers at ${k}.`,
    ],
    hero: [
      (w, k) => `"You're a champion!" ${w} cheers, clapping ${k} on the back.`,
      (w, k) => `${w} gives ${k} a standing ovation. "That took GUTS."`,
    ],
    hothead: [
      (w, k) => `${w} gags sympathetically. "I just threw up in my mouth watching that."`,
      (w, k) => `"DISGUSTING!" ${w} yells, laughing despite looking green.`,
    ],
    'social-butterfly': [
      (w, k) => `${w} screams with delight. "OH MY GOD! ${k}! You LEGEND!"`,
      (w, k) => `${w} pulls out an imaginary camera. "This is going in the highlight reel!"`,
    ],
    default: [
      (w, k) => `${w} watches in stunned silence, then slowly nods. "Respect."`,
      (w, k) => `${w} turns away. "I can't look. Tell me when it's over."`,
    ],
  },
  fail: {
    villain: [
      (w, k) => `${w} howls with laughter. "You can't even KISS A FISH? Pathetic."`,
      (w, k) => `"Wow. Couldn't even commit to a dead fish," ${w} sneers. "Noted."`,
    ],
    hero: [
      (w, k) => `${w} sighs. "Come on, ${k}. We needed that. You gotta push through."`,
      (w, k) => `"It's just a fish," ${w} says, trying to be encouraging but clearly frustrated.`,
    ],
    hothead: [
      (w, k) => `"ARE YOU KIDDING ME?!" ${w} screams. "Just KISS the stupid fish!"`,
      (w, k) => `${w} throws ${pronouns(w).posAdj} hands up. "Unbelievable. We're gonna lose because of a FISH."`,
    ],
    'social-butterfly': [
      (w, k) => `${w} covers ${pronouns(w).posAdj} mouth. "Oh no... ${k}... you had to..."`,
      (w, k) => `"It's okay!" ${w} says, but the disappointment is written all over ${pronouns(w).posAdj} face.`,
    ],
    default: [
      (w, k) => `${w} stares at ${k} in disbelief. The fish stares too.`,
      (w, k) => `${w} shakes ${pronouns(w).posAdj} head slowly. "That was our shot."`,
    ],
  },
};

const CAPTAIN_GRAB = {
  hothead: [
    (n, pr) => `${n} snatches the captain's flag before anyone else can react. "I'm in charge. Deal with it."`,
    (n, pr) => `"NOBODY leads this team better than me!" ${n} declares, grabbing the captain's band.`,
  ],
  'chaos-agent': [
    (n, pr) => `${n} grabs the captain role with a manic grin. "This is going to be FUN."`,
    (n, pr) => `"Captain ${n} has a nice ring to it," ${n} says, swiping the band. The tribe looks nervous.`,
  ],
  mastermind: [
    (n, pr) => `${n} calmly takes the captain position. "I've already assigned everyone in my head."`,
    (n, pr) => `"Let me captain," ${n} says smoothly. "I know exactly where everyone should go."`,
  ],
  schemer: [
    (n, pr) => `${n} volunteers with a helpful smile. "I'll make sure everyone gets the PERFECT assignment."`,
    (n, pr) => `"Trust me with this," ${n} says, already mentally assigning rivals to the hardest legs.`,
  ],
  hero: [
    (n, pr) => `Nobody volunteers. ${n} steps up. "I'll do it. Someone has to lead."`,
    (n, pr) => `${n} takes the captain band with a steady hand. "I won't let you down."`,
  ],
  'loyal-soldier': [
    (n, pr) => `${n} looks around. Nobody's stepping up. "Fine. I'll captain. But we do this TOGETHER."`,
    (n, pr) => `"I'll take captain," ${n} says quietly. "I know what everyone's good at."`,
  ],
  'social-butterfly': [
    (n, pr) => `"Captain? ME? Okay, I accept!" ${n} campaigns ${pr.posAdj} way into the role in record time.`,
    (n, pr) => `${n} polls the tribe. "Who thinks I should captain? Show of hands?" ${pr.Sub} already has the band on.`,
  ],
  goat: [
    (n, pr) => `Nobody wants to captain. The tribe pushes ${n} forward. "${pr.Sub}... sure. Why not."`,
    (n, pr) => `${n} gets volunteered. "Wait, I didn't say—" Too late. ${pr.Sub} is captain now.`,
  ],
  floater: [
    (n, pr) => `${n} drifts into the captain role. Nobody notices until it's done.`,
    (n, pr) => `"I guess... I can captain?" ${n} picks up the band. No objections. No enthusiasm either.`,
  ],
  default: [
    (n, pr) => `${n} takes the captain role. ${pr.Sub} sizes up ${pr.posAdj} teammates with a calculating look.`,
    (n, pr) => `The tribe needs a captain. ${n} raises ${pr.posAdj} hand. "I'll handle it."`,
    (n, pr) => `${n} steps forward to captain. "I've got a plan for assignments."`,
  ],
};

const VOMIT_CHAIN = [
  (trigger, victims) => `${trigger} loses it. The sound triggers ${victims.join(' and ')}, who follow suit. Chain reaction.`,
  (trigger, victims) => `${trigger} hurls over the dock railing. ${victims.join(' and ')} can't unsee it. Down they go too.`,
  (trigger, victims) => `The sound of ${trigger} retching sets off ${victims.join(' and ')}. It's a symphony of disaster.`,
  (trigger, victims) => `${trigger} paints the dock. ${victims.join(' and ')} join in. The cleanup crew is going to need a raise.`,
  (trigger, victims) => `One person loses it and the dominos fall. ${trigger} starts it, ${victims.join(' and ')} finish it.`,
];

const HOST_SWIM = [
  () => `${host()} shouts from the dock through a megaphone. "Swim FASTER, people! The crabs are getting impatient!"`,
  () => `"That's what I call motivation — swim or become fish food!" ${host()} adjusts ${host() === 'Chris' ? 'his' : 'the'} sunglasses.`,
  () => `${host()} watches through binoculars. "I can see struggling from here. Beautiful television."`,
  () => `"Fun fact: these waters are home to three kinds of jellyfish. ALL of them sting." ${host()} grins.`,
  () => `"We tested this challenge with interns first. Only MOST of them made it back." ${host()} sips lemonade.`,
  () => `${host()} leans over the dock railing. "If you can hear me — you're not swimming fast enough!"`,
  () => `"The ocean doesn't care about your alliance. SWIM." ${host()} seems to be enjoying this.`,
];

const HOST_RELAY = [
  () => `${host()} paces the dock. "The relay is HEATING UP! Well, except for the fish. The fish is very cold."`,
  () => `"Reminder: the fish MUST be kissed. On the lips. I don't make the rules. Actually, I DO make the rules." ${host()} smirks.`,
  () => `${host()} holds up a stopwatch. "Time is ticking! And so is that fish smell! It only gets worse!"`,
  () => `"I've seen better relay performances from actual seagulls," ${host()} comments helpfully.`,
  () => `${host()} munches popcorn. "This is the part where alliances get tested. My favorite part."`,
  () => `"That chug jug contains a traditional fisherman's remedy. What does it remedy? Who cares!" ${host()} shrugs.`,
  () => `${host()} checks the wind. "Perfect conditions for humiliation. Carry on."`,
];

const CLAM_PUNISHMENT = [
  (tribe) => `${tribe} huddles around a bucket of clams. The stench is remarkable. Everyone has to shuck.`,
  (tribe) => `"Congratulations on last place! Here are your clams." ${host()} drops a bucket at ${tribe}'s feet.`,
  (tribe) => `${tribe} spends the evening shucking clams in silence. The shame hangs heavier than the smell.`,
  (tribe) => `Clam duty. ${tribe} lines up with shucking knives and broken spirits. Nobody makes eye contact.`,
  (tribe) => `${host()} presents ${tribe} with their punishment: fifty clams, one butter knife, zero dignity.`,
];

const DOCK_AMBIENT = [
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">The dock creaks under wet footsteps. Salt spray hangs in the air.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">A seagull lands on the dock railing and watches the chaos unfold.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">Waves slap against the pilings. The wind picks up.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">The smell of brine and old rope. Somewhere, a lobster trap clatters.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">Barnacles crack under someone's heel. The dock has seen better days.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">A fishing net drags in the current below. The tide is turning.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">Fog rolls in thicker. The lighthouse beam sweeps across the water.</em>`,
  () => `<em style="font-size:11px;color:var(--rtd-muted);display:block;text-align:center;padding:4px 0;">The dock groans under the weight of competition. Old wood, new grudges.</em>`,
];

const BETWEEN_PHASES = [
  (a, b) => `${a} catches ${b} on the dock. "Nice swim out there." They share a tired laugh.`,
  (a, b) => `${a} and ${b} wring out their clothes on the dock. "At least we didn't drown," ${b} says.`,
  (a, b) => `${a} stretches on the dock planks. ${b} sits nearby. "Ready for round two?" "Never."`,
  (a, b) => `${a} helps ${b} onto the dock. Their eyes meet. Something shifts. Then the moment passes.`,
  (a, b) => `${a} and ${b} sit at the edge of the dock, feet dangling over the water. Catching their breath.`,
  (a, b) => `"We need a captain for the relay," ${a} says to ${b}. "Don't look at me," ${b} replies.`,
  (a, b) => `${a} notices ${b} shivering. ${a} tosses ${b} a towel without a word. Small gesture. Big moment.`,
];

const ENCOURAGE_TEXT = [
  (a, b) => `"You GOT this!" ${a} screams at ${b} from the dock. The encouragement carries across the water.`,
  (a, b) => `${a} cups ${pronouns(a).posAdj} hands. "COME ON, ${b}! PUSH!" ${b} digs deeper.`,
  (a, b) => `${a} starts a chant: "${b}! ${b}! ${b}!" The tribe picks it up.`,
  (a, b) => `"Almost there!" ${a} waves ${b} forward. "Don't stop now!"`,
  (a, b) => `${a} leans over the dock and extends a hand. "I believe in you. SWIM."`,
  (a, b) => `"Stay focused!" ${a} yells. ${b} hears it. Something about that voice makes ${pronouns(b).obj} push harder.`,
];

const SPLASH_WAR = [
  (a, b) => `${a} kicks a wave of water at ${b} mid-swim. Dirty move. ${b} sputters and loses a stroke.`,
  (a, b) => `${a} "accidentally" splashes ${b} right in the face. The timing is suspicious.`,
  (a, b) => `${a} veers into ${b}'s lane and sends a wall of water into ${b}'s face. "Oops."`,
  (a, b) => `${a} and ${b} lock eyes in the water. Splash war. Both lose time. Neither cares.`,
  (a, b) => `${a} slaps the water hard in ${b}'s direction. ${b} gets a mouthful of ocean.`,
];

const CAPTAIN_BLAME = [
  (cap, perf) => `"What was THAT?!" ${cap} snaps at ${perf}. "I put you on this leg because I thought you could HANDLE it."`,
  (cap, perf) => `${cap} throws ${pronouns(cap).posAdj} hands up. "Seriously, ${perf}? THAT'S your best effort?"`,
  (cap, perf) => `${cap} pulls ${perf} aside. "You just cost us time we can't get back. That's on YOU."`,
  (cap, perf) => `"I KNEW I shouldn't have put you there," ${cap} mutters, loud enough for everyone to hear.`,
  (cap, perf) => `${cap} stares at ${perf}. The disappointment is louder than any words.`,
];

const CAPTAIN_PRIDE = [
  (cap, perf) => `${cap} runs to ${perf} and lifts ${pronouns(perf).obj} up. "THAT'S what I'm talking about!"`,
  (cap, perf) => `"I knew you were the right pick!" ${cap} slaps ${perf} on the back. "CRUSHED it."`,
  (cap, perf) => `${cap} beams. "See? I told everyone you'd nail this leg. Never doubted you."`,
  (cap, perf) => `"My call, my pick, my LEGEND." ${cap} points at ${perf} with both hands.`,
  (cap, perf) => `${cap} exhales with relief. "${perf}, you just saved this relay. I owe you one."`,
];

const SABOTAGE_TEXT = [
  (sab, target) => `${sab} "accidentally" bumps ${target}'s equipment off the dock right before ${target}'s leg starts. Oops.`,
  (sab, target) => `${sab} whispers false instructions to ${target}. "You want to go LEFT. Definitely left." It's right.`,
  (sab, target) => `${sab} loosens the rope on ${target}'s station when nobody's looking. Subtle. Effective.`,
  (sab, target) => `${sab} distracts ${target} with a fake argument right before ${target}'s turn. The timing "just happens" to cost precious seconds.`,
  (sab, target) => `${sab} puts something slippery on the dock planks right where ${target} needs to stand. Plausible deniability.`,
];

const SHOWOFF_TEXT = [
  (n, pr) => `${n} does a butterfly stroke past the competition just to flex. Completely unnecessary. Completely effective.`,
  (n, pr) => `${n} flips onto ${pr.posAdj} back and waves at the crowd mid-swim. Show-off supreme.`,
  (n, pr) => `${n} pauses to do a flip in the water. ${pr.Sub} is MILES ahead and ${pr.sub} knows it.`,
  (n, pr) => `${n} treads water, poses for an imaginary camera, then resumes swimming. Legend behavior.`,
  (n, pr) => `"WATCH THIS!" ${n} yells before diving under and resurfacing ten meters ahead. Showboating at its finest.`,
];

const COLD_OPEN = [
  () => `A battered boat chugs through grey morning fog. The contestants are blindfolded. Salt spray stings exposed skin. The engine cuts. Blindfolds come off. There's nothing but open ocean and, a quarter mile away, a crumbling dock attached to something that might generously be called a fishing village.`,
  () => `Dawn hasn't fully broken. The air smells like brine and rotting kelp. A fishing trawler drops anchor in water so cold it makes your teeth hurt. On the distant shore, a weathered dock extends from a cluster of sea-beaten shacks. "Welcome to your next challenge," the loudspeaker crackles.`,
  () => `The water is the color of steel. Waves slap against the hull of the transport boat. Contestants grip the railing, squinting at the shoreline. A dock juts from the rocky coast like a crooked finger. Beyond it, smoke rises from unseen chimneys. Nobody looks excited.`,
  () => `Fog rolls across the water as contestants are ferried to the drop point. The coast is all jagged cliff and grey stone, broken only by a dilapidated fishing dock. Seagulls wheel overhead. The boat rocks hard enough to send one contestant sprawling. Game faces go on.`,
  () => `The trawler's horn blasts twice. Through the mist, a coastal village materializes — weathered planks, tattered nets draped over posts, lobster crates stacked three high. The dock is the only way in. The ocean is the only way to get there.`,
];

const HOST_TITLE_QUIP = [
  () => `Today's challenge has two phases. First, you swim. Then, you suffer. Good luck.`,
  () => `Drop 'em in the ocean, race 'em to the dock, make 'em kiss a fish. Peak television.`,
  () => `I hope everyone had a light breakfast. The chug leg does NOT agree with a full stomach.`,
  () => `The ocean doesn't negotiate. The dock doesn't forgive. And the fish? The fish is waiting.`,
  () => `Fun fact — the last group who tried this challenge is STILL talking about the fish kiss.`,
  () => `Two phases. Four relay legs. One cold, dead cod. Let's make some memories.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateRockTheDock(ep) {
  const tribes = gs.tribes.filter(t => t.members.length > 0);
  if (tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  const result = {
    tribes: [],
    winningTribe: null,
    losingTribe: null,
    tribeRanking: [],
    clamPunishment: null,
    topScorer: null,
  };

  // ═══════════════════════════════════════════════════
  // PHASE 1: OCEAN SWIM
  // ═══════════════════════════════════════════════════

  const FORMATIONS = [
    { type: 'V-Formation', check: (avgPhys) => avgPhys > 5 ? 0.1 : -0.05 },
    { type: 'Buddy System', check: () => 0 }, // handled per-player
    { type: 'Every Player for Themselves', check: () => 0 }, // handled per-player
  ];

  tribes.forEach(tribe => {
    const members = [...tribe.members];
    const campKey = tribe.name;
    const tc = tribeColor(tribe.name);

    // ── Formation Debate ──
    const avgPhys = members.reduce((s, n) => s + pStats(n).physical, 0) / members.length;
    const physicals = members.map(n => ({ name: n, phys: pStats(n).physical })).sort((a, b) => a.phys - b.phys);
    const weakest = physicals[0]?.name;
    const strongest = physicals[physicals.length - 1]?.name;
    const top2Phys = physicals.slice(-2).map(p => p.name);
    const bottom2Phys = physicals.slice(0, 2).map(p => p.name);

    // One champion per formation
    const champions = [];
    const availableAdvocates = [...members].sort(() => Math.random() - 0.5);
    for (let fi = 0; fi < 3 && fi < availableAdvocates.length; fi++) {
      champions.push({ name: availableAdvocates[fi], formation: FORMATIONS[fi] });
    }

    // Persuasion roll picks winner
    let bestChampion = null;
    let bestScore = -Infinity;
    const advocateDetails = [];
    champions.forEach(ch => {
      const s = pStats(ch.name);
      const pr = pronouns(ch.name);
      const persScore = s.social * 0.05 + noise(2.5);
      advocateDetails.push({ name: ch.name, formation: ch.formation.type, score: persScore });
      if (persScore > bestScore) {
        bestScore = persScore;
        bestChampion = ch;
      }
    });

    const chosenFormation = bestChampion ? bestChampion.formation : FORMATIONS[0];
    const chosenType = chosenFormation.type;
    const champion = bestChampion ? bestChampion.name : members[0];
    const chPr = pronouns(champion);
    const advocateText = pick(FORMATION_ADVOCATE)(champion, chPr, chosenType);

    // Bond consequences: winner +0.3 with supporters, losers -0.2 if bond < 0
    champions.forEach(ch => {
      if (ch.name === champion) return;
      if (getBond(ch.name, champion) < 0) addBond(ch.name, champion, -0.2);
    });
    members.forEach(n => {
      if (n !== champion) addBond(champion, n, 0.3);
    });

    // ── Swim Rolls ──
    const swimResults = [];
    let tribeStruggles = 0;
    let tribeRescues = 0;
    let fastestSwimmer = null;
    let fastestScore = -Infinity;
    let lostAtSea = null;

    // First pass: compute swim scores
    const swimData = members.map(n => {
      const s = pStats(n);
      let formationMod = 0;
      if (chosenType === 'V-Formation') {
        formationMod = avgPhys > 5 ? 0.3 : -0.15;
      } else if (chosenType === 'Buddy System') {
        if (n === weakest) formationMod = 0.4;
        else if (n === strongest) formationMod = -0.15;
      } else if (chosenType === 'Every Player for Themselves') {
        if (top2Phys.includes(n)) formationMod = 0.25;
        else if (bottom2Phys.includes(n)) formationMod = -0.25;
      }
      const swimScore = s.physical * 0.06 + s.intuition * 0.04 + formationMod + noise(2.5);
      return { name: n, score: swimScore };
    });

    // Lost at sea: rare (~8%) for the weakest swimmer if score < -0.3
    // Only possible if tribe has 5+ members (need 4 for relay legs)
    const sortedByScore = [...swimData].sort((a, b) => a.score - b.score);
    const worstSwimmer = sortedByScore[0];
    if (members.length > 4 && worstSwimmer && worstSwimmer.score < -0.3 && Math.random() < 0.08) {
      lostAtSea = worstSwimmer.name;
    }

    // Second pass: build results with events
    swimData.forEach(({ name: n, score: swimScore }) => {
      const s = pStats(n);
      const pr = pronouns(n);
      const swimEvents = [];

      // Lost at sea — can't participate in relay
      if (n === lostAtSea) {
        swimResults.push({
          name: n, score: swimScore, passed: false, rescued: false, rescuer: null,
          lost: true, events: [],
          text: `${n} gets caught in a riptide and pulled far from shore. ${pr.Sub} fights the current but drifts further and further from the dock. By the time ${pr.sub} finds ${pr.posAdj} bearings, the relay has already started without ${pr.obj}.`,
        });
        ep.chalMemberScores[n] -= 4;
        popDelta(n, -3);
        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-lost',
          text: `${n} got lost at sea during Rock the Dock and couldn't participate in the relay — the tribe blames ${pr.obj}`,
          players: [n],
          badgeText: 'LOST AT SEA', badgeClass: 'badge-negative',
        });
        // Heat for this episode
        if (!gs._rockTheDockHeat) gs._rockTheDockHeat = {};
        gs._rockTheDockHeat[n] = { amount: 3, expiresEp: gs.episodeHistory.length + 2 };
        tribeStruggles += 2;
        return;
      }

      // Panic: only fires if the player WOULD struggle (low score). Panic forces failure.
      let panicked = false;
      if (swimScore < 0.4 && s.boldness < 4 && Math.random() < 0.4) {
        panicked = true;
        swimEvents.push({
          type: 'panic', label: `${n} — Panic`, badge: 'PANIC',
          text: `${n} freezes in the water. ${pr.posAdj} arms lock up. The panic costs precious time.`,
          players: [n],
        });
        popDelta(n, -1);
      }

      // Panic overrides a pass — panicking = you struggle
      const passed = panicked ? false : swimScore > 0.25;

      // Post-swim events (only for non-panicking players)
      if (!panicked && Math.random() < 0.35) {
        if (_isNice(n) && members.some(m => m !== n && getBond(n, m) > 1)) {
          const target = members.filter(m => m !== n && getBond(n, m) > 1).sort(() => Math.random() - 0.5)[0];
          if (target) {
            swimEvents.push({
              type: 'encourage', label: `${n} encourages ${target}`, badge: 'ENCOURAGE',
              text: pick(ENCOURAGE_TEXT)(n, target),
              players: [n, target],
            });
            addBond(n, target, 0.3);
            popDelta(n, 1);
          }
        } else if (arch(n) === 'challenge-beast' && s.physical >= 6) {
          swimEvents.push({
            type: 'showoff', label: `${n} — Show Off`, badge: 'SHOW OFF',
            text: pick(SHOWOFF_TEXT)(n, pr),
            players: [n],
          });
          popDelta(n, 1);
        }
      }

      // Cross-tribe splash war (only strong swimmers)
      if (passed && s.boldness > 6 && Math.random() < 0.2) {
        const otherTribes = tribes.filter(t => t.name !== campKey);
        if (otherTribes.length > 0) {
          const rivalTribe = pick(otherTribes);
          const rival = pick(rivalTribe.members);
          swimEvents.push({
            type: 'splash', label: `${n} vs ${rival} — Splash War`, badge: 'SPLASH WAR',
            text: pick(SPLASH_WAR)(n, rival),
            players: [n, rival],
          });
          addBond(n, rival, -0.3);
          popDelta(n, -1);
          popDelta(rival, -1);
        }
      }

      let text;
      if (passed) {
        text = pick(STRONG_SWIM)(n, pr);
        ep.chalMemberScores[n] += 2;
        popDelta(n, 1);
        if (swimScore > fastestScore) {
          fastestScore = swimScore;
          fastestSwimmer = n;
        }
      } else {
        text = pick(STRUGGLE_SWIM)(n, pr);
        ep.chalMemberScores[n] -= 1;
        popDelta(n, -1);
        tribeStruggles++;
      }

      swimResults.push({
        name: n, score: swimScore, passed, rescued: false, rescuer: null,
        lost: false, events: swimEvents, text, panicked,
      });
    });

    // Rescue: any struggling player below 0.1 can be rescued by a teammate who PASSED their own swim
    const passedSwimmers = swimResults.filter(sr => sr.passed);
    const struggling = swimResults.filter(sr => !sr.passed && !sr.lost && sr.score < 0.1);
    struggling.sort((a, b) => a.score - b.score);
    // Rescue the worst struggler (if any), rescuer must have passed
    if (struggling.length > 0 && passedSwimmers.length > 0) {
      const victim = struggling[0];
      const rescuer = passedSwimmers
        .map(sr => sr.name)
        .sort((a, b) => pStats(b).physical - pStats(a).physical)[0];
      if (rescuer) {
        const rPr = pronouns(rescuer);
        victim.rescued = true;
        victim.rescuer = rescuer;
        ep.chalMemberScores[victim.name] -= 2;
        ep.chalMemberScores[rescuer] += 2;
        addBond(rescuer, victim.name, 0.5);
        popDelta(rescuer, 1);
        tribeRescues++;

        victim.text = pick(RESCUE_TEXT)(rescuer, victim.name, rPr);

        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-rescue',
          text: `${rescuer} saved ${victim.name} from drowning during the ocean swim`,
          players: [rescuer, victim.name],
          badgeText: 'HERO RESCUE', badgeClass: 'badge-positive',
        });
      }
    }

    // Fastest swimmer camp event
    if (fastestSwimmer) {
      ep.campEvents[campKey].post.push({
        type: 'rock-the-dock-fast-swim',
        text: `${fastestSwimmer} was the fastest swimmer for ${tribe.name} during Rock the Dock`,
        players: [fastestSwimmer],
        badgeText: 'FASTEST SWIMMER', badgeClass: 'badge-positive',
      });
    }

    // Arrival order: sort by score descending (highest = first to shore)
    const arrivalOrder = [...swimResults].filter(sr => !sr.lost).sort((a, b) => b.score - a.score).map(sr => sr.name);
    if (lostAtSea) arrivalOrder.push(lostAtSea);

    const swimTime = tribeStruggles + 2 * tribeRescues + (lostAtSea ? 3 : 0);

    // ── Between-Phase Social Events (with consequences) ──
    const betweenPhaseEvents = [];
    const numBetween = 2 + Math.floor(Math.random() * 2);
    const usedPairs = new Set();
    for (let bi = 0; bi < numBetween; bi++) {
      const a = pick(members);
      let b = pick(members.filter(m => m !== a));
      if (!b) break;
      const pairKey = [a, b].sort().join('|');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      // Showmance moment ~20%
      const showmance = (gs.showmances || []).find(sh =>
        !sh.broken && ((sh.a === a && sh.b === b) || (sh.a === b && sh.b === a))
      );
      if (showmance && Math.random() < 0.2 && seasonConfig?.romance) {
        betweenPhaseEvents.push({
          type: 'showmance', label: `${a} & ${b} — Moment`, badge: 'MOMENT',
          text: `${a} and ${b} share a quiet moment on the dock. The competition fades away for a second.`,
          players: [a, b],
        });
        addBond(a, b, 0.5);
      } else if (_isVillain(a) && getBond(a, b) < -1 && Math.random() < 0.4) {
        // Strategic scheming — villain plots against rival
        betweenPhaseEvents.push({
          type: 'scheme', label: `${a} schemes against ${b}`, badge: 'SCHEME',
          text: `${a} watches ${b} catching ${pronouns(b).posAdj} breath. "${b} looked weak in the water," ${a} mutters to a nearby tribemate. "Remember that at tribal."`,
          players: [a, b],
        });
        addBond(a, b, -0.5);
        popDelta(b, -1);
        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-scheme', text: `${a} was seen plotting against ${b} on the dock after the swim`,
          players: [a, b], badgeText: 'DOCK SCHEME', badgeClass: 'badge-negative',
        });
      } else if (getBond(a, b) > 2 && Math.random() < 0.3) {
        // Alliance bonding — deep bond strengthens
        betweenPhaseEvents.push({
          type: 'alliance', label: `${a} & ${b} — Alliance Talk`, badge: 'ALLIANCE',
          text: `${a} pulls ${b} aside on the dock. "We need to stick together after this. No matter what happens in the relay." ${b} nods.`,
          players: [a, b],
        });
        addBond(a, b, 0.8);
        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-alliance', text: `${a} and ${b} deepened their alliance bond on the dock during Rock the Dock`,
          players: [a, b], badgeText: 'ALLIANCE BOND', badgeClass: 'badge-positive',
        });
      } else {
        // Regular dock chat — still has bond consequences
        betweenPhaseEvents.push({
          type: 'social', label: `${a} & ${b}`, badge: 'DOCK CHAT',
          text: pick(BETWEEN_PHASES)(a, b),
          players: [a, b],
        });
        addBond(a, b, 0.4);
      }
    }

    // Cross-tribe dock confrontations
    const otherTribes = tribes.filter(t2 => t2.name !== campKey);
    if (otherTribes.length > 0 && Math.random() < 0.5) {
      const rivalTribe = pick(otherTribes);
      const a = pick(members);
      const b = pick(rivalTribe.members);
      if (getBond(a, b) < 0) {
        betweenPhaseEvents.push({
          type: 'rivalry', label: `${a} vs ${b}`, badge: 'TRASH TALK',
          text: pick([
            `${a} catches ${b}'s eye across the dock. "Your swim was pathetic. Hope you're ready to lose the relay too."`,
            `"Nice doggy paddle out there," ${a} sneers at ${b}. ${b} clenches ${pronouns(b).posAdj} jaw.`,
            `${a} and ${b} bump shoulders on the dock. Neither apologizes. The tension is electric.`,
            `"See you at tribal," ${a} mouths at ${b}. ${b} flips ${pronouns(b).posAdj} hair and walks away.`,
          ]),
          players: [a, b],
        });
        addBond(a, b, -0.4);
        popDelta(a, -1);
      } else if (getBond(a, b) > 2) {
        betweenPhaseEvents.push({
          type: 'cross-respect', label: `${a} & ${b}`, badge: 'RESPECT',
          text: pick([
            `${a} nods at ${b} across the dock. "Good swim." ${b} nods back. Mutual respect, different tribes.`,
            `${a} tosses a towel to ${b}. Cross-tribe kindness. People notice.`,
            `"You're tough," ${a} tells ${b} quietly. "Wish you were on my tribe." ${b} smiles.`,
            `${a} and ${b} share a water bottle on the dock. Their tribes watch with suspicion.`,
          ]),
          players: [a, b],
        });
        addBond(a, b, 0.3);
      }
    }

    // ═══════════════════════════════════════════════════
    // PHASE 2: DOCK RELAY
    // ═══════════════════════════════════════════════════

    // ── Captain Election ──
    const archType = arch(members[0]);
    const captainCandidates = members.map(n => {
      const s = pStats(n);
      const a = arch(n);
      let bias = 0;
      if (a === 'hothead' || a === 'chaos-agent') bias = 2;
      else if (a === 'mastermind' || a === 'schemer') bias = 1.5;
      else if (a === 'social-butterfly') bias = 1;
      else if (a === 'hero' || a === 'loyal-soldier') bias = 0.5;
      else if (a === 'goat' || a === 'floater') bias = -1;
      const persScore = s.social * 0.05 + s.strategic * 0.04 + bias + noise(2.5);
      return { name: n, score: persScore };
    }).sort((a, b) => b.score - a.score);

    const captainName = captainCandidates[0].name;
    const captainArch = arch(captainName);
    const cPr = pronouns(captainName);

    // Captain grab text
    const captainPool = CAPTAIN_GRAB[captainArch] || CAPTAIN_GRAB.default;
    const electionText = pick(captainPool)(captainName, cPr);

    // Bond friction for runner-up who wanted it
    if (captainCandidates.length > 1) {
      const runnerUp = captainCandidates[1];
      const ruArch = arch(runnerUp.name);
      if (ruArch === 'hothead' || ruArch === 'mastermind' || ruArch === 'schemer') {
        addBond(runnerUp.name, captainName, -0.3);
      }
    }

    // ── Captain Quality ──
    let captainQuality;
    if (['hero', 'mastermind', 'perceptive-player'].includes(captainArch)) captainQuality = 'good';
    else if (['social-butterfly', 'loyal-soldier', 'challenge-beast'].includes(captainArch)) captainQuality = 'okay';
    else captainQuality = 'bad';

    const goodMatchRate = captainQuality === 'good' ? 0.8 : captainQuality === 'okay' ? 0.6 : 0.4;

    // ── Relay Leg Assignments ──
    // Exclude lost-at-sea player from relay
    const relayMembers = lostAtSea ? members.filter(n => n !== lostAtSea) : members;

    const LEGS = ['chug', 'decipher', 'stunt', 'fish'];
    const legStatMap = {
      chug: (s) => s.physical + s.endurance,
      decipher: (s) => s.mental + s.intuition,
      stunt: (s) => s.physical + s.boldness,
      fish: (s) => s.social + s.boldness,
    };

    const memberBestLeg = {};
    relayMembers.forEach(n => {
      const s = pStats(n);
      let bestLeg = 'chug';
      let bestVal = -Infinity;
      LEGS.forEach(leg => {
        const val = legStatMap[leg](s);
        if (val > bestVal) { bestVal = val; bestLeg = leg; }
      });
      memberBestLeg[n] = bestLeg;
    });

    const assignments = {};
    const assignedMembers = new Set();
    const shuffledLegs = [...LEGS].sort(() => Math.random() - 0.5);

    // Scheming captain: assign rival to hardest leg
    let schemingVictim = null;
    if (_canScheme(captainName)) {
      const rivals = relayMembers.filter(n => n !== captainName && getBond(captainName, n) < 0);
      if (rivals.length > 0) {
        schemingVictim = pick(rivals);
      }
    }

    shuffledLegs.forEach(leg => {
      // Find best candidate for this leg who isn't assigned yet
      const candidates = relayMembers.filter(n => !assignedMembers.has(n));
      if (candidates.length === 0) return;

      let chosen;
      if (schemingVictim && !assignedMembers.has(schemingVictim) && leg === 'stunt') {
        // Sabotage: assign rival to stunt (hardest)
        chosen = schemingVictim;
        addBond(captainName, schemingVictim, -0.5);
        popDelta(captainName, -1);
        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-captain-sabotage',
          text: `${captainName} deliberately assigned ${schemingVictim} to the hardest relay leg`,
          players: [captainName, schemingVictim],
          badgeText: 'SABOTAGE ASSIGNMENT', badgeClass: 'badge-negative',
        });
      } else if (Math.random() < goodMatchRate) {
        // Good assignment: pick member whose best leg matches this one
        const ideal = candidates.find(n => memberBestLeg[n] === leg);
        chosen = ideal || candidates[0];
      } else {
        // Bad assignment: random
        chosen = pick(candidates);
      }

      assignments[leg] = chosen;
      assignedMembers.add(chosen);
    });

    // Fill any remaining legs with unassigned members
    LEGS.forEach(leg => {
      if (!assignments[leg]) {
        const remaining = relayMembers.filter(n => !assignedMembers.has(n));
        if (remaining.length > 0) {
          assignments[leg] = remaining[0];
          assignedMembers.add(remaining[0]);
        }
      }
    });

    // Double duty: if tribe is short-handed, assign unfilled legs to best-fit members
    const doubleDutyPlayers = new Set();
    LEGS.forEach(leg => {
      if (!assignments[leg] && relayMembers.length > 0) {
        const bestFit = relayMembers.slice().sort((a, b) => legStatMap[leg](pStats(b)) - legStatMap[leg](pStats(a)))[0];
        assignments[leg] = bestFit;
        doubleDutyPlayers.add(bestFit);
      }
    });

    if (doubleDutyPlayers.size > 0) {
      doubleDutyPlayers.forEach(n => {
        const ddLegs = LEGS.filter(l => assignments[l] === n);
        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-double-duty',
          text: `${n} had to pull double duty on the relay (${ddLegs.join(' + ')}) because ${tribe.name} was short-handed`,
          players: [n],
          badgeText: 'DOUBLE DUTY', badgeClass: 'badge-neutral',
        });
      });
    }

    // ── 4 Relay Legs ──
    const legResults = [];
    let relayTime = 0;

    // Comeback modifier: tribes that struggled in the swim get a small relay bonus
    const comebackMod = tribeStruggles >= 3 ? 0.15 : tribeStruggles >= 2 ? 0.08 : 0;

    LEGS.forEach(leg => {
      const player = assignments[leg];
      if (!player) return;
      const s = pStats(player);
      const pr = pronouns(player);
      const misAssigned = memberBestLeg[player] !== leg;
      const misPenalty = misAssigned ? -0.1 : 0;

      let roll, threshold, text, passed, fast, refused = false;
      const legEvents = [];
      const crowdReactions = [];

      switch (leg) {
        case 'chug':
          roll = s.physical * 0.05 + s.endurance * 0.05 + misPenalty + comebackMod + noise(2.5);
          threshold = 0.25;
          passed = roll > threshold;
          fast = roll > threshold + 0.15;
          text = passed ? pick(CHUG_FAST)(player, pr) : pick(CHUG_FAIL)(player, pr);

          // Vomit chain on failed chug ~30%
          if (!passed && Math.random() < 0.3) {
            const nearby = members.filter(n => n !== player).slice(0, 1 + Math.floor(Math.random() * 2));
            if (nearby.length > 0) {
              legEvents.push({
                type: 'vomit', label: `Vomit Chain!`, badge: 'CHAIN REACTION',
                text: pick(VOMIT_CHAIN)(player, nearby),
                players: [player, ...nearby],
              });
              nearby.forEach(n => { ep.chalMemberScores[n] -= 1; });

              ep.campEvents[campKey].post.push({
                type: 'rock-the-dock-vomit',
                text: `A vomit chain erupted during the relay chug, triggered by ${player}`,
                players: [player, ...nearby],
                badgeText: 'VOMIT CHAIN', badgeClass: 'badge-negative',
              });
            }
          }
          break;

        case 'decipher':
          roll = s.mental * 0.06 + s.intuition * 0.05 + misPenalty + comebackMod + noise(2.5);
          threshold = 0.3;
          passed = roll > threshold;
          fast = roll > threshold + 0.15;
          text = passed ? pick(DECIPHER_PASS)(player, pr) : pick(DECIPHER_FAIL)(player, pr);
          break;

        case 'stunt':
          roll = s.physical * 0.06 + s.boldness * 0.04 + misPenalty + comebackMod + noise(2.5);
          threshold = 0.25;
          passed = roll > threshold;
          fast = roll > threshold + 0.15;
          text = passed ? pick(STUNT_PASS)(player, pr) : pick(STUNT_FAIL)(player, pr);
          break;

        case 'fish':
          // Fish kiss refusal check
          if (s.boldness < 4 && Math.random() < 0.25) {
            refused = true;
            passed = false;
            fast = false;
            text = pick(FISH_KISS_REFUSE)(player, pr);
            ep.chalMemberScores[player] -= 2;
            popDelta(player, -2);

            ep.campEvents[campKey].post.push({
              type: 'rock-the-dock-fish-refuse',
              text: `${player} refused to kiss the fish during Rock the Dock`,
              players: [player],
              badgeText: 'FISH REFUSAL', badgeClass: 'badge-negative',
            });
          } else {
            roll = s.social * 0.05 + s.boldness * 0.06 + misPenalty + comebackMod + noise(2.5);
            threshold = 0.25;
            passed = roll > threshold;
            fast = roll > threshold + 0.15;
            text = passed ? pick(FISH_KISS_PASS)(player, pr) : pick(FISH_KISS_REFUSE)(player, pr);
          }

          // Crowd reactions (2-3 teammates react)
          const reactors = members.filter(n => n !== player).sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
          const outcomeKey = passed ? 'pass' : 'fail';
          reactors.forEach(r => {
            const rArch = arch(r);
            const branch = FISH_KISS_CROWD[outcomeKey];
            let pool = branch.default;
            if (VILLAIN.has(rArch)) pool = branch.villain;
            else if (rArch === 'hero') pool = branch.hero;
            else if (rArch === 'hothead') pool = branch.hothead;
            else if (rArch === 'social-butterfly') pool = branch['social-butterfly'];

            const reactionText = pick(pool)(r, player);
            crowdReactions.push({ reactor: r, text: reactionText, archetype: rArch });

            // Bond/pop consequences differ by outcome
            if (passed) {
              if (VILLAIN.has(rArch)) addBond(r, player, -0.2);
              else if (rArch === 'hero') addBond(r, player, 0.2);
              else if (rArch === 'hothead') popDelta(r, -1);
              else if (rArch === 'social-butterfly') popDelta(player, 1);
            } else {
              if (VILLAIN.has(rArch)) { addBond(r, player, -0.3); popDelta(player, -1); }
              else if (rArch === 'hero') addBond(r, player, -0.1);
              else if (rArch === 'hothead') { addBond(r, player, -0.4); popDelta(player, -1); }
              else if (rArch === 'social-butterfly') addBond(r, player, 0.1);
            }
          });
          break;
      }

      // Per-leg scoring
      if (refused) {
        // Already penalized above
      } else if (fast) {
        ep.chalMemberScores[player] += 3;
        popDelta(player, 1);

        ep.campEvents[campKey].post.push({
          type: 'rock-the-dock-fast-leg',
          text: `${player} crushed the ${leg} leg during Rock the Dock relay`,
          players: [player],
          badgeText: `FAST ${leg.toUpperCase()}`, badgeClass: 'badge-positive',
        });
      } else if (passed) {
        ep.chalMemberScores[player] += 1;
      } else {
        ep.chalMemberScores[player] -= 2;
        popDelta(player, -1);
      }

      // Per-leg social events (1-2 per leg, ~50% each)
      for (let si = 0; si < 2; si++) {
        if (Math.random() > 0.5) continue;

        const eventRoll = Math.random();

        if (eventRoll < 0.15 && (arch(captainName) === 'hothead' || arch(captainName) === 'chaos-agent')) {
          // Teammate heckle from captain
          legEvents.push({
            type: 'heckle', label: `${captainName} heckles`, badge: 'HECKLE',
            text: `"Are you even TRYING?!" ${captainName} screams at ${player} from the sideline.`,
            players: [captainName, player],
          });
          addBond(captainName, player, -0.3);
          popDelta(captainName, -1);
        } else if (eventRoll < 0.3 && _isNice(captainName) && getBond(captainName, player) > 0) {
          // Teammate cheer
          legEvents.push({
            type: 'cheer', label: `${captainName} cheers`, badge: 'CHEER',
            text: pick(ENCOURAGE_TEXT)(captainName, player),
            players: [captainName, player],
          });
          addBond(captainName, player, 0.3);
        } else if (eventRoll < 0.45 && !passed && captainName !== player) {
          // Captain blame
          legEvents.push({
            type: 'blame', label: `Captain blames ${player}`, badge: 'BLAME',
            text: pick(CAPTAIN_BLAME)(captainName, player),
            players: [captainName, player],
          });
          addBond(captainName, player, -0.5);
          popDelta(player, -1);
        } else if (eventRoll < 0.6 && fast && captainName !== player) {
          // Captain pride
          legEvents.push({
            type: 'pride', label: `Captain proud of ${player}`, badge: 'PRIDE',
            text: pick(CAPTAIN_PRIDE)(captainName, player),
            players: [captainName, player],
          });
          addBond(captainName, player, 0.3);
          popDelta(captainName, 1);
        } else if (eventRoll < 0.7 && _canScheme(player) && members.some(m => m !== player && getBond(player, m) < 0)) {
          // Sabotage
          const target = members.filter(m => m !== player && getBond(player, m) < 0)[0];
          if (target) {
            legEvents.push({
              type: 'sabotage', label: `${player} sabotages ${target}`, badge: 'SABOTAGE',
              text: pick(SABOTAGE_TEXT)(player, target),
              players: [player, target],
            });
            addBond(player, target, -0.5);
            popDelta(player, -1);
          }
        } else if (eventRoll < 0.85) {
          // Cross-tribe taunt
          const otherTribes = tribes.filter(t => t.name !== campKey);
          if (otherTribes.length > 0) {
            const rivalTribe = pick(otherTribes);
            const rival = pick(rivalTribe.members);
            if (getBond(player, rival) < 0) {
              legEvents.push({
                type: 'taunt', label: `${player} taunts ${rival}`, badge: 'TAUNT',
                text: `${player} locks eyes with ${rival} across the dock. "You're going home tonight."`,
                players: [player, rival],
              });
              addBond(player, rival, -0.3);
              popDelta(player, -1);
            }
          }
        }

        // Showmance moment (~20%)
        const showmance = (gs.showmances || []).find(sh =>
          !sh.broken && ((sh.a === player && members.includes(sh.b)) || (sh.b === player && members.includes(sh.a)))
        );
        if (showmance && Math.random() < 0.2 && seasonConfig?.romance) {
          const partner = showmance.a === player ? showmance.b : showmance.a;
          legEvents.push({
            type: 'showmance', label: `${player} & ${partner}`, badge: 'MOMENT',
            text: `${partner} watches ${player} from the sideline. Their eyes meet. ${player} pushes harder.`,
            players: [player, partner],
          });
          addBond(player, partner, 0.5);
        }
      }

      relayTime += passed ? (fast ? 0 : 1) : 2;

      legResults.push({
        leg, player, score: roll || 0, passed, fast, refused,
        events: legEvents, text, crowdReactions, misAssigned,
      });
    });

    // Bad captain assignment camp event
    const misAssignCount = legResults.filter(lr => lr.misAssigned).length;
    if (misAssignCount >= 2) {
      ep.campEvents[campKey].post.push({
        type: 'rock-the-dock-bad-captain',
        text: `${captainName}'s relay assignments were questionable — ${misAssignCount} players on wrong legs`,
        players: [captainName],
        badgeText: 'BAD CAPTAIN', badgeClass: 'badge-negative',
      });
    }

    const totalTime = swimTime + relayTime;

    result.tribes.push({
      tribeName: tribe.name,
      tribeMembers: members,
      tribeColor: tc,
      formation: { type: chosenType, champion, advocateText, details: advocateDetails },
      swimResults,
      swimTime,
      swimRank: 0,
      arrivalOrder,
      lostAtSea,
      captain: { name: captainName, archetype: captainArch, electionText, quality: captainQuality },
      assignments,
      legResults,
      relayTime,
      totalTime,
      betweenPhaseEvents,
    });
  });

  // ── Rank tribes ──
  result.tribes.sort((a, b) => a.totalTime - b.totalTime);
  result.tribes.forEach((t, i) => { t.swimRank = i + 1; });
  result.tribeRanking = result.tribes.map(t => t.tribeName);
  result.winningTribe = result.tribeRanking[0];
  result.losingTribe = result.tribeRanking[result.tribeRanking.length - 1];

  // Fastest swim tribe bonus
  const fastestSwimTribe = result.tribes.slice().sort((a, b) => a.swimTime - b.swimTime)[0];
  if (fastestSwimTribe) {
    fastestSwimTribe.tribeMembers.forEach(n => { ep.chalMemberScores[n] += 3; });
  }

  // ── Clam Punishment (Last-Place Swim Tribe) ──
  const swimRanked = result.tribes.slice().sort((a, b) => a.swimTime - b.swimTime);
  const lastSwimTribe = swimRanked[swimRanked.length - 1]?.tribeName;
  const loserTribeData = result.tribes.find(t => t.tribeName === lastSwimTribe);
  if (loserTribeData) {
    const clamText = pick(CLAM_PUNISHMENT)(lastSwimTribe);
    let blameEvent = null;
    let revengeEvent = null;

    loserTribeData.tribeMembers.forEach(n => popDelta(n, -1));

    // ~40% internal blame
    if (Math.random() < 0.4) {
      const lowestScorer = loserTribeData.tribeMembers.slice().sort((a, b) =>
        (ep.chalMemberScores[a] || 0) - (ep.chalMemberScores[b] || 0)
      )[0];
      const blamer = loserTribeData.tribeMembers.find(n =>
        n !== lowestScorer && (arch(n) === 'hothead' || _isVillain(n))
      );
      if (blamer && lowestScorer) {
        addBond(blamer, lowestScorer, -0.5);
        blameEvent = {
          blamer, target: lowestScorer,
          text: `${blamer} rounds on ${lowestScorer}. "This is YOUR fault. You cost us the challenge."`,
        };
        ep.campEvents[loserTribeData.tribeName].post.push({
          type: 'rock-the-dock-blame',
          text: `${blamer} blamed ${lowestScorer} for the last-place swim finish`,
          players: [blamer, lowestScorer],
          badgeText: 'BLAME', badgeClass: 'badge-negative',
        });
      }
    }

    // ~30% sabotage revenge
    if (Math.random() < 0.3) {
      const schemer = loserTribeData.tribeMembers.find(n => _canScheme(n));
      if (schemer) {
        const winnerTribeData = result.tribes.find(t => t.tribeName === result.winningTribe);
        if (winnerTribeData) {
          const rival = pick(winnerTribeData.tribeMembers);
          addBond(schemer, rival, -0.3);
          revengeEvent = {
            schemer, target: rival, winningTribe: result.winningTribe,
            text: `${schemer} tampered with ${result.winningTribe}'s dinner as payback for the loss.`,
          };
        }
      }
    }

    result.clamPunishment = { tribe: lastSwimTribe, text: clamText, blameEvent, revengeEvent };
  }

  // ═══════════════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════════════

  const winnerTribe = gs.tribes.find(t => t.name === result.winningTribe);
  const loserTribe = gs.tribes.find(t => t.name === result.losingTribe);

  ep.rockTheDock = result;
  ep.isRockTheDock = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Rock the Dock';
  ep.challengeCategory = 'physical';
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];
  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = result.tribeRanking.length > 2
    ? result.tribeRanking.slice(1, -1).map(tn => gs.tribes.find(t => t.name === tn)).filter(Boolean)
    : [];

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([,a], [,b]) => b - a).map(([n]) => n);

  // Top scorer gets score boost for challenge records (no individual immunity in pre-merge)
  const topScorer = allActive.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([,s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }
  result.topScorer = topScorer;

  // Romance hooks
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'coastal relay');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'dock relay', _romActive);

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════
// VP: STATE MANAGEMENT
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`rtd-step-${suffix}-${i}`);
    if (el) el.classList.add('rtd-visible');
  }
  const counter = document.getElementById(`rtd-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`rtd-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.rtd-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

// ══════════════════════════════════════════════════════════════
// VP: CSS
// ══════════════════════════════════════════════════════════════

const RTD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;700;900&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600;700&display=swap');

:root{
  --rtd-ocean:#3d6a84;--rtd-ocean-deep:#253e50;--rtd-ocean-mid:#4d7a94;
  --rtd-sky-top:#536d7e;--rtd-sky-mid:#7a95a6;--rtd-sky-low:#9aadba;--rtd-sky-haze:#b5c0c6;
  --rtd-cliff:#5a5a58;--rtd-cliff-dark:#3a3a38;
  --rtd-sand:#b5a882;--rtd-sand-dark:#8a7e62;
  --rtd-wood:#5a4a3a;--rtd-wood-mid:#6e5c48;--rtd-wood-dark:#3e3028;
  --rtd-shack-red:#7a3030;
  --rtd-rope:#a08050;--rtd-rope-dark:#6a5430;--rtd-rope-light:#b89860;
  --rtd-beacon:#d04030;--rtd-lighthouse:#c8c0b0;
  --rtd-white:#e0dace;--rtd-cream:rgba(224,218,206,.88);--rtd-muted:rgba(224,218,206,.4);
  --rtd-success:#5a9a5e;--rtd-danger:#b04040;--rtd-warning:#c49430;
  --rtd-card-bg:rgba(46,38,32,.88);--rtd-card-border:rgba(160,128,80,.08);
  --rtd-coffee:#1a1a1a;
}

/* ── ATMOSPHERE ── */
.rtd-wrap{position:relative;overflow:hidden;min-height:100vh;}
.rtd-atmo{position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;pointer-events:none;overflow:hidden;}
.rtd-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--rtd-sky-top) 0%,var(--rtd-sky-mid) 30%,var(--rtd-sky-low) 55%,var(--rtd-sky-haze) 75%);}
.rtd-grain{position:absolute;inset:0;opacity:.03;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='.75' type='fractalNoise'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");}

.rtd-fog{position:absolute;width:200%;height:15%;opacity:.06;background:linear-gradient(90deg,transparent,rgba(224,218,206,.3),transparent);animation:rtd-fog-drift 40s linear infinite;}
.rtd-fog-1{top:20%;animation-delay:-10s;}
.rtd-fog-2{top:35%;animation-duration:55s;animation-delay:-25s;opacity:.04;}
@keyframes rtd-fog-drift{0%{transform:translateX(-50%);}100%{transform:translateX(0);}}

.rtd-clouds{position:absolute;top:0;left:0;right:0;height:40%;}
.rtd-cloud{position:absolute;border-radius:50%;background:rgba(224,218,206,.08);filter:blur(30px);animation:rtd-cloud-drift 90s linear infinite;}
.rtd-cloud-a{width:200px;height:60px;top:8%;left:-10%;animation-duration:80s;}
.rtd-cloud-b{width:150px;height:45px;top:15%;left:30%;animation-duration:100s;animation-delay:-30s;opacity:.06;}
.rtd-cloud-c{width:180px;height:55px;top:5%;left:60%;animation-duration:120s;animation-delay:-60s;opacity:.1;}
@keyframes rtd-cloud-drift{0%{transform:translateX(-100px);}100%{transform:translateX(calc(100vw + 200px));}}

.rtd-cliffs{position:absolute;bottom:35%;left:0;right:0;height:25%;}
.rtd-cliff-back{position:absolute;bottom:0;left:0;right:0;height:100%;background:var(--rtd-cliff);opacity:.25;clip-path:polygon(0 70%,5% 50%,12% 55%,18% 35%,25% 45%,32% 30%,40% 40%,48% 25%,55% 35%,62% 20%,70% 30%,78% 25%,85% 40%,92% 30%,100% 45%,100% 100%,0 100%);}
.rtd-cliff-front{position:absolute;bottom:0;left:0;right:0;height:80%;background:var(--rtd-cliff-dark);opacity:.35;clip-path:polygon(0 80%,8% 60%,15% 65%,22% 50%,30% 55%,38% 40%,45% 50%,52% 35%,60% 45%,68% 30%,75% 40%,82% 35%,90% 50%,95% 45%,100% 55%,100% 100%,0 100%);}

.rtd-lh{position:absolute;bottom:32%;right:12%;width:30px;height:100px;}
.rtd-lh-base{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:24px;height:70px;background:var(--rtd-lighthouse);opacity:.4;clip-path:polygon(20% 0,80% 0,90% 100%,10% 100%);}
.rtd-lh-top{position:absolute;bottom:65px;left:50%;transform:translateX(-50%);width:16px;height:14px;background:var(--rtd-lighthouse);opacity:.5;border-radius:2px 2px 0 0;}
.rtd-lh-lamp{position:absolute;bottom:74px;left:50%;transform:translateX(-50%);width:6px;height:6px;border-radius:50%;background:var(--rtd-beacon);box-shadow:0 0 8px 4px rgba(208,64,48,.3);animation:rtd-lamp-pulse 3s ease-in-out infinite;}
.rtd-lh-sweep{position:absolute;bottom:75px;left:50%;width:200px;height:2px;transform-origin:left center;background:linear-gradient(90deg,rgba(208,64,48,.2),transparent);animation:rtd-lamp-sweep 6s linear infinite;opacity:.25;}
@keyframes rtd-lamp-pulse{0%,100%{opacity:.3;box-shadow:0 0 8px 4px rgba(208,64,48,.2);}50%{opacity:1;box-shadow:0 0 16px 8px rgba(208,64,48,.5);}}
@keyframes rtd-lamp-sweep{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}

.rtd-ocean-layer{position:absolute;bottom:18%;left:0;right:0;height:20%;background:linear-gradient(180deg,var(--rtd-ocean-deep),var(--rtd-ocean),var(--rtd-ocean-mid));}
.rtd-waves{position:absolute;bottom:18%;left:0;right:0;height:8%;}
.rtd-wv{position:absolute;bottom:0;left:0;right:0;height:100%;opacity:.15;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20 V40 H0Z' fill='%234d7a94'/%3E%3C/svg%3E") repeat-x;background-size:600px 100%;animation:rtd-wave-roll 8s linear infinite;}
.rtd-wv-1{animation-duration:7s;}
.rtd-wv-2{animation-duration:11s;animation-delay:-3s;opacity:.1;bottom:2%;}
.rtd-wv-3{animation-duration:14s;animation-delay:-7s;opacity:.08;bottom:4%;}
@keyframes rtd-wave-roll{0%{background-position-x:0;}100%{background-position-x:600px;}}

.rtd-shore{position:absolute;bottom:17%;left:0;right:0;height:2%;background:rgba(224,218,206,.08);animation:rtd-shore-pulse 4s ease-in-out infinite;}
@keyframes rtd-shore-pulse{0%,100%{opacity:.05;}50%{opacity:.12;}}

.rtd-wash{position:absolute;bottom:22%;left:0;right:0;height:4%;z-index:8;background:linear-gradient(0deg,rgba(77,122,148,.15),transparent);animation:rtd-wash-lap 5s ease-in-out infinite;pointer-events:none;}
.rtd-wash-2{animation-delay:2.5s;opacity:.5;}
@keyframes rtd-wash-lap{0%,100%{transform:translateY(100%);opacity:0;}25%{transform:translateY(0);opacity:.5;}50%{transform:translateY(-15%);opacity:.35;}75%{transform:translateY(30%);opacity:.15;}}

.rtd-ground{position:absolute;bottom:0;left:0;right:0;height:18%;background:linear-gradient(180deg,var(--rtd-sand-dark),var(--rtd-wood-dark));
  background-image:repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(160,128,80,.04) 60px,rgba(160,128,80,.04) 62px);}

.rtd-shack-sil{position:absolute;bottom:14%;left:8%;width:40px;height:35px;opacity:.2;}
.rtd-shack-roof-s{position:absolute;top:0;left:-5px;width:50px;height:12px;background:var(--rtd-shack-red);clip-path:polygon(50% 0,100% 100%,0 100%);}
.rtd-shack-body-s{position:absolute;bottom:0;left:2px;width:36px;height:20px;background:var(--rtd-wood-mid);}

.rtd-boat-sil{position:absolute;opacity:.15;animation:rtd-boat-bob 4s ease-in-out infinite;}
.rtd-boat-1{bottom:26%;left:75%;width:35px;height:20px;}
.rtd-boat-2{bottom:28%;left:88%;width:28px;height:16px;animation-delay:-2s;animation-duration:5s;}
.rtd-boat-hull-s{position:absolute;bottom:0;left:0;width:100%;height:40%;background:var(--rtd-wood-dark);border-radius:0 0 40% 40%;}
.rtd-boat-cabin-s{position:absolute;bottom:35%;left:25%;width:40%;height:35%;background:var(--rtd-wood-mid);}
.rtd-boat-mast-s{position:absolute;bottom:30%;left:50%;width:2px;height:70%;background:var(--rtd-rope-dark);}
@keyframes rtd-boat-bob{0%,100%{transform:translateY(0) rotate(0deg);}25%{transform:translateY(-3px) rotate(1deg);}75%{transform:translateY(2px) rotate(-1deg);}}

.rtd-gull{position:absolute;width:16px;height:3px;opacity:.2;animation:rtd-gull-fly 20s linear infinite;}
.rtd-g1{top:12%;left:-5%;animation-duration:18s;}
.rtd-g2{top:8%;left:20%;animation-duration:25s;animation-delay:-8s;}
.rtd-g3{top:16%;left:50%;animation-duration:22s;animation-delay:-14s;}
.rtd-gull::before,.rtd-gull::after{content:'';position:absolute;top:0;width:50%;height:100%;background:var(--rtd-cliff-dark);}
.rtd-gull::before{left:0;transform-origin:right center;animation:rtd-gull-flap 0.6s ease-in-out infinite alternate;border-radius:50% 0 0 0;}
.rtd-gull::after{right:0;transform-origin:left center;animation:rtd-gull-flap 0.6s ease-in-out infinite alternate-reverse;border-radius:0 50% 0 0;}
@keyframes rtd-gull-fly{0%{transform:translateX(0);}100%{transform:translateX(calc(100vw + 50px));}}
@keyframes rtd-gull-flap{0%{transform:rotate(-20deg);}100%{transform:rotate(20deg);}}

.rtd-mist{position:absolute;width:80px;height:4px;border-radius:50%;background:rgba(224,218,206,.08);animation:rtd-mist-drift 12s ease-in-out infinite;}
.rtd-m1{bottom:24%;left:20%;animation-delay:-3s;}
.rtd-m2{bottom:22%;left:55%;animation-duration:15s;animation-delay:-7s;}
.rtd-m3{bottom:25%;left:80%;animation-duration:10s;}
@keyframes rtd-mist-drift{0%,100%{opacity:.04;transform:translateX(0);}50%{opacity:.1;transform:translateX(20px);}}

.rtd-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(30,25,20,.5) 100%);}

/* ── SHELL LAYOUT ── */
.rtd-shell{position:relative;z-index:10;max-width:1100px;margin:0 auto;display:flex;gap:18px;padding:20px;font-family:'Source Sans 3',sans-serif;color:var(--rtd-white);min-height:100vh;box-sizing:border-box;}
.rtd-main{flex:1;min-width:0;}
.rtd-shell.rtd-tc-fullwidth{display:block;}
.rtd-shell.rtd-tc-fullwidth .rtd-main{max-width:900px;margin:0 auto;}

/* ── PHASE HEADERS ── */
.rtd-phase-hdr{text-align:center;margin:20px 0 30px;padding:24px 0;}
.rtd-phase-tag{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:6px;text-transform:uppercase;color:var(--rtd-rope-light);margin-bottom:8px;}
.rtd-phase-title{font-family:'Bitter',serif;font-size:36px;font-weight:900;color:var(--rtd-white);line-height:1.1;margin-bottom:8px;}
.rtd-phase-sub{font-size:14px;color:var(--rtd-muted);max-width:500px;margin:0 auto;line-height:1.5;}

/* ── RELAY PROGRESS TRACKER ── */
.rtd-relay-tracker{display:flex;gap:0;margin:20px 0;background:var(--rtd-wood-dark);border-radius:5px;overflow:hidden;border:1px solid rgba(160,128,80,.15);position:relative;}
.rtd-leg{flex:1;padding:12px 10px;text-align:center;position:relative;transition:all .3s;}
.rtd-leg::after{content:'';position:absolute;right:0;top:15%;height:70%;width:2px;background:var(--rtd-rope-dark);}
.rtd-leg:last-child::after{display:none;}
.rtd-leg-label{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--rtd-muted);}
.rtd-leg-name{font-family:'Bitter',serif;font-size:13px;font-weight:700;margin-top:3px;color:var(--rtd-white);}
.rtd-leg.done{opacity:.55;background:rgba(90,154,94,.08);}
.rtd-leg.done .rtd-leg-label{color:var(--rtd-success);}
.rtd-leg.active{background:rgba(196,148,48,.08);animation:rtd-leg-pulse 2s ease-in-out infinite;}
.rtd-leg.active .rtd-leg-label{color:var(--rtd-warning);}
.rtd-leg.locked{opacity:.2;}
@keyframes rtd-leg-pulse{0%,100%{box-shadow:inset 0 0 0 0 rgba(196,148,48,0);}50%{box-shadow:inset 0 0 20px 0 rgba(196,148,48,.08);}}

/* ── CSS-ONLY ICONS ── */
.rtd-icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:1.5px solid var(--rtd-rope-dark);border-radius:3px;flex-shrink:0;position:relative;overflow:hidden;}
.rtd-fw{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative;}
.rtd-ci{width:100%;height:100%;position:relative;}

.rtd-icon-swim{background:var(--rtd-ocean);}
.rtd-icon-swim .rtd-ci::before{content:'';position:absolute;top:35%;left:15%;right:15%;height:2px;border-radius:1px;background:var(--rtd-white);box-shadow:0 -4px 0 var(--rtd-white),0 4px 0 var(--rtd-white);}
.rtd-icon-swim .rtd-ci::after{content:'';position:absolute;top:20%;left:38%;width:24%;height:24%;border-radius:50%;border:2px solid var(--rtd-white);background:transparent;}

.rtd-icon-chug{background:var(--rtd-sand-dark);}
.rtd-icon-chug .rtd-ci::before{content:'';position:absolute;left:30%;bottom:15%;width:35%;height:55%;border:2px solid var(--rtd-white);border-radius:0 0 3px 3px;transform:rotate(-20deg);background:rgba(255,255,255,.15);}
.rtd-icon-chug .rtd-ci::after{content:'';position:absolute;left:28%;top:18%;width:39%;height:3px;background:var(--rtd-white);border-radius:1px;transform:rotate(-20deg);}

.rtd-icon-decipher{background:var(--rtd-success);}
.rtd-icon-decipher .rtd-ci::before{content:'?';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Bitter',serif;font-weight:900;font-size:14px;color:var(--rtd-white);line-height:1;}
.rtd-icon-decipher .rtd-ci::after{content:'';position:absolute;bottom:10%;right:12%;width:22%;height:22%;border:2px solid var(--rtd-white);border-top:none;border-left:none;border-radius:0 0 40% 0;background:transparent;}

.rtd-icon-stunt{background:var(--rtd-wood-mid);}
.rtd-icon-stunt .rtd-ci::before{content:'';position:absolute;top:55%;left:15%;right:15%;height:3px;background:var(--rtd-rope-light);border-radius:1px;}
.rtd-icon-stunt .rtd-ci::after{content:'';position:absolute;left:36%;bottom:40%;width:5px;height:5px;border-radius:50%;background:var(--rtd-rope-light);box-shadow:0 -6px 0 0 var(--rtd-rope-light),2px -10px 0 0 var(--rtd-rope-light),-2px -3px 0 0 var(--rtd-rope-light);}

.rtd-icon-fish{background:var(--rtd-ocean);}
.rtd-icon-fish .rtd-ci::before{content:'';position:absolute;left:15%;top:28%;width:45%;height:40%;background:var(--rtd-white);border-radius:50% 30% 30% 50%;}
.rtd-icon-fish .rtd-ci::after{content:'';position:absolute;right:18%;top:30%;width:0;height:0;border-left:5px solid var(--rtd-white);border-top:4px solid transparent;border-bottom:4px solid transparent;}

.rtd-icon-anchor{background:var(--rtd-ocean-deep);}
.rtd-icon-anchor .rtd-ci::before{content:'';position:absolute;left:7px;top:2px;width:2px;height:10px;background:var(--rtd-white);}
.rtd-icon-anchor .rtd-ci::after{content:'';position:absolute;left:4px;bottom:3px;width:8px;height:6px;border:2px solid var(--rtd-white);border-top:none;border-radius:0 0 50% 50%;background:transparent;}

.rtd-icon-trophy{background:var(--rtd-wood-dark);}
.rtd-icon-trophy .rtd-ci::before{content:'';position:absolute;left:4px;top:3px;width:8px;height:6px;border:2px solid var(--rtd-warning);border-top:none;border-radius:0 0 4px 4px;background:transparent;}
.rtd-icon-trophy .rtd-ci::after{content:'';position:absolute;left:6px;bottom:3px;width:4px;height:3px;background:var(--rtd-warning);border-radius:0 0 1px 1px;}

.rtd-icon-danger{background:var(--rtd-danger);}
.rtd-icon-danger .rtd-ci::before{content:'';position:absolute;left:5px;top:3px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid var(--rtd-white);}
.rtd-icon-danger .rtd-ci::after{content:'';position:absolute;left:8px;top:7px;width:1px;height:3px;background:var(--rtd-danger);}

.rtd-icon-social{background:rgba(224,218,206,.15);}
.rtd-icon-social .rtd-ci::before,.rtd-icon-social .rtd-ci::after{content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:var(--rtd-white);}
.rtd-icon-social .rtd-ci::before{left:4px;top:5px;}
.rtd-icon-social .rtd-ci::after{right:4px;top:7px;}

.rtd-icon-rescue{background:var(--rtd-danger);}
.rtd-icon-rescue .rtd-ci::before{content:'';position:absolute;left:6px;top:3px;width:4px;height:10px;background:var(--rtd-white);border-radius:1px;}
.rtd-icon-rescue .rtd-ci::after{content:'';position:absolute;left:3px;top:5px;width:10px;height:4px;background:var(--rtd-white);border-radius:1px;}

.rtd-icon-net{background:var(--rtd-wood-mid);}
.rtd-icon-net .rtd-ci{background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(224,218,206,.4) 3px,rgba(224,218,206,.4) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(224,218,206,.4) 3px,rgba(224,218,206,.4) 4px);}

/* ── CARD AVATARS ── */
.rtd-card-av{width:28px;height:28px;border-radius:4px;object-fit:contain;border:1.5px solid var(--rtd-rope-dark);flex-shrink:0;margin-right:6px;}

/* ── CARDS ── */
.rtd-card{background:var(--rtd-card-bg);border:1px solid var(--rtd-card-border);border-radius:5px;padding:14px 18px;position:relative;overflow:hidden;}
.rtd-card::before{content:'';position:absolute;inset:0;opacity:.03;background:repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(160,128,80,.08) 20px,rgba(160,128,80,.08) 22px);pointer-events:none;}

.rtd-card-swim{border-left:2px solid var(--rtd-ocean-mid);}
.rtd-card-success{border-left:2px solid var(--rtd-success);}
.rtd-card-fail{border-left:2px solid var(--rtd-danger);}
.rtd-card-social{border-left:2px dashed var(--rtd-muted);background:rgba(46,38,32,.65);}
.rtd-card-captain{border-left:2px solid var(--rtd-warning);background:linear-gradient(135deg,rgba(46,38,32,.92),rgba(60,50,35,.88));}
.rtd-card-chug{border-left:2px solid var(--rtd-sand-dark);}
.rtd-card-decipher{border-left:2px solid var(--rtd-success);}
.rtd-card-stunt{border-left:2px solid var(--rtd-rope);}
.rtd-card-fish{border-left:2px solid var(--rtd-ocean);background:linear-gradient(135deg,rgba(46,38,32,.88),rgba(37,62,80,.6));}
.rtd-card-rescue{border-left:2px solid var(--rtd-danger);background:linear-gradient(135deg,rgba(46,38,32,.88),rgba(176,64,64,.15));}
.rtd-card-vomit{border-left:2px solid #8a8a40;background:linear-gradient(135deg,rgba(46,38,32,.88),rgba(100,100,40,.1));}
.rtd-card-tribe{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:4px;font-family:'Bitter',serif;font-size:13px;font-weight:700;}

.rtd-hdr{display:flex;align-items:center;gap:9px;margin-bottom:8px;}
.rtd-label{font-family:'Bitter',serif;font-size:12.5px;font-weight:700;color:var(--rtd-white);}
.rtd-txt{font-size:13px;line-height:1.7;color:var(--rtd-cream);}

.rtd-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;vertical-align:middle;margin-left:auto;}
.rtd-badge-pass{background:rgba(90,154,94,.2);color:var(--rtd-success);}
.rtd-badge-fail{background:rgba(176,64,64,.2);color:var(--rtd-danger);}
.rtd-badge-captain{background:rgba(196,148,48,.2);color:var(--rtd-warning);}
.rtd-badge-rescue{background:rgba(176,64,64,.3);color:#e06060;}
.rtd-badge-social{background:rgba(224,218,206,.08);color:var(--rtd-muted);}

/* ── SCORE BARS ── */
.rtd-score-bar{display:flex;align-items:center;gap:8px;margin-top:6px;}
.rtd-score-track{flex:1;height:4px;background:rgba(224,218,206,.1);border-radius:2px;overflow:hidden;}
.rtd-score-fill{height:100%;border-radius:2px;transition:width .3s;}
.rtd-score-fill-g{background:var(--rtd-success);}
.rtd-score-fill-d{background:var(--rtd-danger);}
.rtd-score-val{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;min-width:24px;text-align:right;}

/* ── CHATTER ── */
.rtd-chatter{border-left:3px solid var(--rtd-rope-dark);background:rgba(30,25,20,.6);padding:10px 14px;margin:6px 0;font-style:italic;font-size:12.5px;color:var(--rtd-muted);line-height:1.6;border-radius:0 4px 4px 0;}
.rtd-chatter-host{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--rtd-rope-light);font-style:normal;}

/* ── SIDEBAR ── */
.rtd-sidebar{width:255px;position:sticky;top:20px;align-self:flex-start;flex-shrink:0;}
.rtd-sb{background:rgba(30,25,20,.92);border:1px solid rgba(160,128,80,.08);border-radius:6px;padding:16px;max-height:calc(100vh - 100px);overflow-y:auto;}
.rtd-sb-hdr{display:flex;align-items:center;gap:8px;font-family:'Bitter',serif;font-size:14px;font-weight:900;color:var(--rtd-white);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(160,128,80,.1);}
.rtd-sb-section{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--rtd-rope-light);margin:12px 0 6px;display:flex;align-items:center;gap:6px;}
.rtd-sb-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;}
.rtd-sb-tribe{display:inline-block;width:7px;height:7px;border-radius:1px;flex-shrink:0;}
.rtd-sb-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rtd-sb-val{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;}
.rtd-sb-divider{height:1px;background:rgba(160,128,80,.08);margin:10px 0;}
.rtd-sb-progress{display:flex;gap:2px;margin:4px 0;}
.rtd-sb-bar{flex:1;height:3px;border-radius:1px;background:rgba(224,218,206,.08);}
.rtd-sb-bar-done{background:var(--rtd-success);}
.rtd-sb-bar-active{background:var(--rtd-warning);animation:rtd-sb-pulse 1.5s ease-in-out infinite;}
@keyframes rtd-sb-pulse{0%,100%{opacity:.5;}50%{opacity:1;}}

.rtd-sb-pill{display:inline-block;padding:1px 6px;border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;letter-spacing:.5px;margin:1px 2px;}
.rtd-sb-captain-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:3px;background:rgba(196,148,48,.1);border:1px solid rgba(196,148,48,.2);font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--rtd-warning);margin:4px 0;}
.rtd-sb-assign{display:inline-block;padding:1px 5px;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.5px;margin:1px;}
.rtd-sb-assign-chug{background:rgba(138,126,98,.2);color:var(--rtd-sand);}
.rtd-sb-assign-decipher{background:rgba(90,154,94,.15);color:var(--rtd-success);}
.rtd-sb-assign-stunt{background:rgba(160,128,80,.15);color:var(--rtd-rope-light);}
.rtd-sb-assign-fish{background:rgba(77,122,148,.15);color:var(--rtd-ocean-mid);}
.rtd-sb-event{font-size:11px;color:var(--rtd-muted);padding:2px 0;line-height:1.4;}
.rtd-sb-body{font-size:12px;}

/* ── CONTROLS ── */
.rtd-controls{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 20px;background:linear-gradient(0deg,rgba(30,25,20,.95),rgba(30,25,20,.7));backdrop-filter:blur(8px);}
.rtd-btn{font-family:'Bitter',serif;font-size:13px;font-weight:700;color:var(--rtd-rope-light);background:rgba(160,128,80,.1);border:1px solid rgba(160,128,80,.15);border-radius:4px;padding:8px 20px;cursor:pointer;transition:all .2s;}
.rtd-btn:hover{background:rgba(160,128,80,.2);}
.rtd-counter{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--rtd-muted);}

/* ── STEP REVEAL ── */
.rtd-step{display:none;}
.rtd-visible{display:block;}

/* ── SWIM MAP ── */
.rtd-swim-map{position:sticky;top:0;z-index:20;height:130px;background:linear-gradient(180deg,var(--rtd-ocean-deep),var(--rtd-ocean));border-radius:6px;border:1px solid rgba(160,128,80,.1);margin-bottom:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.3);}
.rtd-dock-target{position:absolute;right:8%;top:15%;bottom:15%;width:30px;background:repeating-linear-gradient(0deg,var(--rtd-wood-mid),var(--rtd-wood-mid) 8px,var(--rtd-wood-dark) 8px,var(--rtd-wood-dark) 10px);border-radius:3px;border:1px solid rgba(160,128,80,.2);opacity:.7;}
.rtd-dock-target::after{content:'DOCK';position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;letter-spacing:2px;color:var(--rtd-rope-light);white-space:nowrap;}
.rtd-swim-marker{position:absolute;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;color:#fff;border:2px solid;transition:left .5s ease-out;z-index:5;box-shadow:0 2px 8px rgba(0,0,0,.3);animation:rtd-marker-bob 2s ease-in-out infinite;}
@keyframes rtd-marker-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
.rtd-wv-map{position:absolute;bottom:0;left:0;right:0;height:20%;opacity:.1;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20 V40 H0Z' fill='%234d7a94'/%3E%3C/svg%3E") repeat-x;background-size:300px 100%;animation:rtd-wave-roll 6s linear infinite;}

/* ── REACTIVE ANIMATIONS ── */
.rtd-overtake{animation:rtd-overtake-burst .6s ease-out;}
@keyframes rtd-overtake-burst{0%{box-shadow:0 0 0 0 rgba(196,148,48,.6);transform:scale(1);}50%{box-shadow:0 0 20px 8px rgba(196,148,48,.3);transform:scale(1.3);}100%{box-shadow:0 2px 8px rgba(0,0,0,.3);transform:scale(1);}}
.rtd-overtake-text{position:absolute;font-family:'Bitter',serif;font-size:11px;font-weight:700;color:var(--rtd-warning);animation:rtd-overtake-float 1.2s ease-out forwards;pointer-events:none;}
@keyframes rtd-overtake-float{0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-30px);}}
.rtd-splash-ring{position:absolute;border-radius:50%;border:2px solid rgba(77,122,148,.4);animation:rtd-splash-expand .8s ease-out forwards;}
@keyframes rtd-splash-expand{0%{width:10px;height:10px;opacity:1;}100%{width:60px;height:60px;opacity:0;margin:-25px;}}

.rtd-impact{animation:rtd-impact-slam .4s ease-out;}
@keyframes rtd-impact-slam{0%{transform:translateX(-10px) scale(1.02);opacity:.8;}60%{transform:translateX(3px) scale(1);}100%{transform:translateX(0) scale(1);opacity:1;}}
.rtd-impact-dim{position:fixed;inset:0;background:rgba(176,64,64,.08);z-index:200;animation:rtd-dim-flash .3s ease-out forwards;pointer-events:none;}
@keyframes rtd-dim-flash{0%{opacity:1;}100%{opacity:0;}}
.rtd-shake .rtd-main{animation:rtd-screen-shake .4s ease-out;}
@keyframes rtd-screen-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-4px);}40%{transform:translateX(4px);}60%{transform:translateX(-2px);}80%{transform:translateX(2px);}}

.rtd-ripple{position:absolute;border-radius:50%;border:1px solid rgba(77,122,148,.3);animation:rtd-ripple-expand 1s ease-out forwards;pointer-events:none;}
@keyframes rtd-ripple-expand{0%{width:5px;height:5px;opacity:.6;}100%{width:40px;height:40px;opacity:0;margin:-17px;}}

.rtd-phase-transition{position:fixed;inset:0;z-index:300;background:rgba(30,25,20,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:rtd-phase-trans 2s ease-in-out forwards;pointer-events:none;}
.rtd-phase-transition .rtd-pt-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--rtd-rope-light);margin-bottom:8px;}
.rtd-phase-transition .rtd-pt-title{font-family:'Bitter',serif;font-size:32px;font-weight:900;color:var(--rtd-white);}
@keyframes rtd-phase-trans{0%{opacity:0;}15%{opacity:1;}85%{opacity:1;}100%{opacity:0;display:none;}}

.rtd-leg.active .rtd-icon{animation:rtd-breathe 2s ease-in-out infinite;}
@keyframes rtd-breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
.rtd-sb-active{background:rgba(196,148,48,.08);border-radius:3px;padding:2px 4px;}

.rtd-fish-spectacle{animation:rtd-fish-zoom .5s ease-out;}
@keyframes rtd-fish-zoom{0%{transform:scale(.9);opacity:.7;}100%{transform:scale(1);opacity:1;}}
.rtd-fish-success{box-shadow:0 0 20px rgba(90,154,94,.3);}
.rtd-fish-recoil{animation:rtd-fish-shake .4s ease-out;}
@keyframes rtd-fish-shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}
.rtd-fish-lunge{animation:rtd-lunge .3s ease-out;}
@keyframes rtd-lunge{0%{transform:translateX(0);}50%{transform:translateX(8px);}100%{transform:translateX(0);}}

/* ── TITLE CARD ── */
.rtd-title-card{text-align:center;padding:20px 16px 14px;position:relative;}
.rtd-tc-ep{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:var(--rtd-muted);margin-bottom:4px;}
.rtd-tc-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:6px;text-transform:uppercase;color:var(--rtd-rope-light);margin-bottom:8px;}
.rtd-tc-title{font-family:'Bitter',serif;font-size:42px;font-weight:900;color:var(--rtd-white);line-height:1.05;margin-bottom:4px;text-shadow:0 2px 20px rgba(0,0,0,.5),0 0 60px rgba(61,106,132,.2);letter-spacing:-1px;}
.rtd-tc-subtitle{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--rtd-ocean-mid);margin-bottom:14px;}
.rtd-tc-divider{width:50px;height:2px;background:linear-gradient(90deg,transparent,var(--rtd-rope),transparent);margin:0 auto 14px;border-radius:1px;}
.rtd-tc-cold{font-size:12px;font-style:italic;color:var(--rtd-cream);max-width:600px;margin:0 auto 16px;line-height:1.6;background:rgba(30,25,20,.5);padding:10px 14px;border-left:3px solid var(--rtd-ocean-mid);border-radius:0 6px 6px 0;text-align:left;}

/* ── PHASE ICONS ROW ── */
.rtd-tc-phases-row{display:flex;align-items:center;justify-content:center;gap:0;margin:12px auto 16px;max-width:560px;}
.rtd-tc-phase-icon{display:flex;flex-direction:column;align-items:center;gap:4px;}
.rtd-tc-phase-ring{width:44px;height:44px;border-radius:50%;border:2px solid var(--rtd-rope-dark);display:flex;align-items:center;justify-content:center;background:rgba(30,25,20,.7);transition:all .3s;}
.rtd-tc-phase-ring .rtd-icon{width:22px;height:22px;border:none;border-radius:50%;}
.rtd-tc-phase-ring .rtd-ci{width:100%;height:100%;}
.rtd-tc-phase-lbl{font-family:'IBM Plex Mono',monospace;font-size:7px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--rtd-rope-light);}
.rtd-tc-phase-arrow{width:32px;height:2px;background:linear-gradient(90deg,var(--rtd-rope-dark),var(--rtd-rope-light),var(--rtd-rope-dark));margin:0 3px;position:relative;top:-8px;}
.rtd-tc-phase-arrow::after{content:'';position:absolute;right:-2px;top:-3px;width:0;height:0;border-left:5px solid var(--rtd-rope-light);border-top:4px solid transparent;border-bottom:4px solid transparent;}

/* ── PHASE DESCRIPTIONS ── */
.rtd-tc-phase-descs{max-width:600px;margin:0 auto 14px;text-align:left;}
.rtd-tc-phase-desc{display:flex;align-items:flex-start;gap:10px;padding:7px 12px;margin:4px 0;background:rgba(30,25,20,.45);border-radius:5px;border-left:2px solid var(--rtd-rope-dark);}
.rtd-tc-phase-num{font-family:'Bitter',serif;font-size:16px;font-weight:900;color:var(--rtd-rope-light);min-width:20px;text-align:center;line-height:1;}
.rtd-tc-phase-name{font-family:'Bitter',serif;font-size:12px;font-weight:700;color:var(--rtd-white);margin-bottom:1px;}
.rtd-tc-phase-text{font-size:11px;color:var(--rtd-muted);line-height:1.4;}

/* ── FISHNET ── */
.rtd-fishnet{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:0;padding:10px;position:relative;margin:12px auto;max-width:600px;
  background:repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(160,128,80,.06) 18px,rgba(160,128,80,.06) 19px),
             repeating-linear-gradient(-45deg,transparent,transparent 18px,rgba(160,128,80,.06) 18px,rgba(160,128,80,.06) 19px);
  border:2px solid rgba(160,128,80,.1);border-radius:6px;overflow:hidden;}
.rtd-fishnet::before{content:'CAUGHT IN THE NET';position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-family:'IBM Plex Mono',monospace;font-size:7px;font-weight:700;letter-spacing:3px;color:var(--rtd-rope-light);background:rgba(30,25,20,.9);padding:2px 10px;border-radius:0 0 4px 4px;z-index:2;}
.rtd-net-player{padding:6px 4px;text-align:center;font-size:10px;color:var(--rtd-cream);position:relative;border:1px dashed rgba(160,128,80,.06);animation:rtd-net-sway 3s ease-in-out infinite;transform-origin:top center;}
.rtd-net-player:nth-child(odd){animation-delay:-1.5s;}
.rtd-net-player:nth-child(3n){animation-delay:-0.7s;}
@keyframes rtd-net-sway{0%,100%{transform:rotate(0deg) translateY(0);}25%{transform:rotate(0.5deg) translateY(1px);}75%{transform:rotate(-0.5deg) translateY(-1px);}}
.rtd-net-player strong{display:block;font-family:'Bitter',serif;font-size:10px;margin-top:2px;line-height:1.2;}
.rtd-net-dot{display:inline-block;width:6px;height:6px;border-radius:50%;}
.rtd-net-av{width:28px;height:28px;border-radius:3px;object-fit:contain;border:1.5px solid;opacity:.85;display:block;margin:0 auto 1px;}
.rtd-net-knot{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--rtd-rope);opacity:.3;}
.rtd-net-knot-tl{top:-1px;left:-1px;}
.rtd-net-knot-tr{top:-1px;right:-1px;}
.rtd-net-knot-bl{bottom:-1px;left:-1px;}
.rtd-net-knot-br{bottom:-1px;right:-1px;}

/* ── TRIBES + HOST ── */
.rtd-tc-tribes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:14px auto 12px;}
.rtd-tc-tribe-block{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 12px;background:rgba(30,25,20,.5);border-radius:6px;border:1px solid rgba(160,128,80,.08);}
.rtd-tc-tribe-name{font-family:'Bitter',serif;font-size:11px;font-weight:700;letter-spacing:1px;}
.rtd-tc-tribe-avs{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;}
.rtd-tc-tribe-avs img{width:22px;height:22px;border-radius:3px;object-fit:contain;border:1.5px solid;}
.rtd-tc-host{display:flex;align-items:center;gap:10px;max-width:560px;margin:12px auto;padding:10px 14px;background:rgba(30,25,20,.55);border-left:3px solid var(--rtd-warning);border-radius:0 6px 6px 0;text-align:left;}
.rtd-tc-host-av{width:34px;height:34px;border-radius:50%;object-fit:contain;border:2px solid var(--rtd-warning);flex-shrink:0;}
.rtd-tc-host-quote{font-size:12px;color:var(--rtd-cream);font-style:italic;line-height:1.4;}
.rtd-tc-start{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:3px;color:var(--rtd-rope);margin-top:14px;animation:rtd-start-pulse 2s ease-in-out infinite;}
@keyframes rtd-start-pulse{0%,100%{opacity:.4;}50%{opacity:1;}}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .rtd-shell{flex-direction:column;}
  .rtd-sidebar{width:100%;position:static;order:-1;}
  .rtd-sb{max-height:200px;}
  .rtd-phase-title{font-size:28px;}
  .rtd-tc-title{font-size:36px;}
  .rtd-tc-phases-row{flex-wrap:wrap;gap:8px;}
  .rtd-tc-phase-arrow{display:none;}
  .rtd-tc-phase-descs{padding:0 10px;}
}
@media(max-width:480px){
  .rtd-shell{padding:10px;}
  .rtd-card{padding:10px 12px;}
  .rtd-phase-title{font-size:22px;}
  .rtd-tc-title{font-size:28px;}
  .rtd-fishnet{grid-template-columns:repeat(auto-fill,minmax(80px,1fr));}
  .rtd-tc-phase-ring{width:40px;height:40px;}
  .rtd-tc-host{flex-direction:column;text-align:center;}
}
@media(prefers-reduced-motion:reduce){
  .rtd-fog,.rtd-cloud,.rtd-gull,.rtd-mist,.rtd-boat-sil,.rtd-wv,.rtd-shore,.rtd-wash,.rtd-lh-lamp,.rtd-lh-sweep,.rtd-overtake,.rtd-impact,.rtd-ripple,.rtd-phase-transition,.rtd-fish-spectacle,.rtd-fish-recoil,.rtd-fish-lunge,.rtd-sb-bar-active,.rtd-leg.active,.rtd-net-player,.rtd-tc-start,.rtd-swim-marker{animation:none!important;}
  .rtd-step{}
}
`;

// ══════════════════════════════════════════════════════════════
// VP: ICON + CARD HELPERS
// ══════════════════════════════════════════════════════════════

function _icon(type) {
  return `<div class="rtd-icon rtd-icon-${type}"><div class="rtd-fw"><div class="rtd-ci"></div></div></div>`;
}

function _av(name) {
  const s = slug(name);
  return `<img class="rtd-card-av" src="assets/avatars/${s}.png" alt="${name}" onerror="this.style.display='none'">`;
}

function _badge(type, text) {
  return `<span class="rtd-badge rtd-badge-${type}">${text}</span>`;
}

function _card(variant, icon, label, badgeHtml, content, extraClass = '', playerName = '') {
  const avHtml = playerName ? _av(playerName) : '';
  return `<div class="rtd-card rtd-card-${variant} ${extraClass}">
    <div class="rtd-hdr">${avHtml}${_icon(icon)}<span class="rtd-label">${label}</span>${badgeHtml}</div>
    <div class="rtd-txt">${content}</div>
  </div>`;
}

function _chatter(text, isHost = false) {
  if (isHost) return `<div class="rtd-chatter"><span class="rtd-chatter-host">${host().toUpperCase()}:</span> ${text}</div>`;
  return `<div class="rtd-chatter">${text}</div>`;
}

function _tribeCardHtml(tribeName, tc, text) {
  const c = tc || '#666';
  return `<div class="rtd-card-tribe" style="background:${c}11;border:1px solid ${c}22;color:${c};">
    <span class="rtd-sb-tribe" style="background:${c};"></span> ${text}
  </div>`;
}

function _scoreBar(name, delta, type) {
  const pct = Math.min(100, Math.abs(delta) * 20);
  const cls = type === 'g' ? 'rtd-score-fill-g' : 'rtd-score-fill-d';
  const sign = delta >= 0 ? '+' : '';
  return `<div class="rtd-score-bar">
    <span class="rtd-sb-name" style="font-size:11px;color:var(--rtd-muted);">${name}</span>
    <div class="rtd-score-track"><div class="rtd-score-fill ${cls}" style="width:${pct}%;"></div></div>
    <span class="rtd-score-val" style="color:${type === 'g' ? 'var(--rtd-success)' : 'var(--rtd-danger)'};">${sign}${delta}</span>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: ATMOSPHERE + SHELL
// ══════════════════════════════════════════════════════════════

function _buildAtmosphere() {
  return `<div class="rtd-atmo">
    <div class="rtd-sky"></div>
    <div class="rtd-grain"></div>
    <div class="rtd-fog rtd-fog-1"></div>
    <div class="rtd-fog rtd-fog-2"></div>
    <div class="rtd-clouds"><div class="rtd-cloud rtd-cloud-a"></div><div class="rtd-cloud rtd-cloud-b"></div><div class="rtd-cloud rtd-cloud-c"></div></div>
    <div class="rtd-cliffs"><div class="rtd-cliff-back"></div><div class="rtd-cliff-front"></div></div>
    <div class="rtd-lh"><div class="rtd-lh-sweep"></div><div class="rtd-lh-lamp"></div><div class="rtd-lh-top"></div><div class="rtd-lh-base"></div></div>
    <div class="rtd-ocean-layer"></div>
    <div class="rtd-waves"><div class="rtd-wv rtd-wv-1"></div><div class="rtd-wv rtd-wv-2"></div><div class="rtd-wv rtd-wv-3"></div></div>
    <div class="rtd-shore"></div>
    <div class="rtd-wash"></div><div class="rtd-wash rtd-wash-2"></div>
    <div class="rtd-ground"></div>
    <div class="rtd-shack-sil"><div class="rtd-shack-roof-s"></div><div class="rtd-shack-body-s"></div></div>
    <div class="rtd-boat-sil rtd-boat-1"><div class="rtd-boat-cabin-s"></div><div class="rtd-boat-hull-s"></div><div class="rtd-boat-mast-s"></div></div>
    <div class="rtd-boat-sil rtd-boat-2"><div class="rtd-boat-cabin-s"></div><div class="rtd-boat-hull-s"></div><div class="rtd-boat-mast-s"></div></div>
    <div class="rtd-gull rtd-g1"></div><div class="rtd-gull rtd-g2"></div><div class="rtd-gull rtd-g3"></div>
    <div class="rtd-mist rtd-m1"></div><div class="rtd-mist rtd-m2"></div><div class="rtd-mist rtd-m3"></div>
    <div class="rtd-vignette"></div>
  </div>`;
}

function _shell(content, ep, sidebarPhase = 'title', noSidebar = false) {
  const data = ep.rockTheDock;
  if (!data) return '';

  const atmo = _buildAtmosphere();
  const sidebar = noSidebar ? '' : `<div class="rtd-sidebar" role="complementary" aria-label="Challenge status">
    <div class="rtd-sb" id="rtd-sidebar-inner" aria-live="polite">${_buildSidebarContent(ep, sidebarPhase)}</div>
  </div>`;

  return `<div class="rtd-wrap"><style>${RTD_CSS}</style>
${atmo}
<div class="rtd-shell${noSidebar ? ' rtd-tc-fullwidth' : ''}" data-phase="${sidebarPhase}">
<div class="rtd-main">${content}</div>
${sidebar}
</div><div style="height:80px;"></div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: SIDEBAR
// ══════════════════════════════════════════════════════════════

function _buildSidebarContent(ep, phase) {
  const data = ep.rockTheDock;
  if (!data) return '';

  let html = `<div class="rtd-sb-hdr">${_icon('anchor')} DOCK STATUS</div><div class="rtd-sb-body">`;

  if (phase === 'title') {
    html += `<div class="rtd-sb-section">TRIBES</div>`;
    data.tribes.forEach(t => {
      html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
        <span class="rtd-sb-name"><strong>${t.tribeName}</strong></span>
        <span class="rtd-sb-val" style="color:var(--rtd-muted);">${t.tribeMembers.length} players</span></div>`;
    });
  }

  if (phase === 'swim') {
    const st = _tvState['rtd-swim'];
    const revealIdx = st ? st.idx : -1;
    const meta = (typeof window !== 'undefined' && window._rtdSwimStepMeta) ? window._rtdSwimStepMeta : [];

    // Accumulate revealed swim data
    const tribeFormRevealed = {};
    const tribeSwimPassed = {};
    const tribeSwimFailed = {};
    const tribeRescues = {};
    const tribeEvents = {};

    data.tribes.forEach(t => {
      tribeFormRevealed[t.tribeName] = false;
      tribeSwimPassed[t.tribeName] = 0;
      tribeSwimFailed[t.tribeName] = 0;
      tribeRescues[t.tribeName] = 0;
      tribeEvents[t.tribeName] = [];
    });

    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (!m.tribe) continue;
      if (m.type === 'formation') tribeFormRevealed[m.tribe] = true;
      if (m.type === 'swim' && m.passed) tribeSwimPassed[m.tribe]++;
      if (m.type === 'swim' && !m.passed) tribeSwimFailed[m.tribe]++;
      if (m.type === 'swim' && m.rescued) tribeRescues[m.tribe]++;
      if (m.type === 'event') tribeEvents[m.tribe].push(m.eventType);
    }

    html += `<div class="rtd-sb-section">${_icon('swim')} FORMATIONS</div>`;
    data.tribes.forEach(t => {
      if (tribeFormRevealed[t.tribeName]) {
        html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
          <span class="rtd-sb-name">${t.tribeName}</span>
          <span class="rtd-sb-pill" style="background:rgba(160,128,80,.15);color:var(--rtd-rope-light);">${t.formation.type}</span></div>`;
      } else {
        html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
          <span class="rtd-sb-name">${t.tribeName}</span>
          <span class="rtd-sb-val" style="color:var(--rtd-muted);">---</span></div>`;
      }
    });

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('swim')} SWIM RESULTS</div>`;
    data.tribes.forEach(t => {
      const passed = tribeSwimPassed[t.tribeName];
      const failed = tribeSwimFailed[t.tribeName];
      const total = passed + failed;
      const rescues = tribeRescues[t.tribeName];
      html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
        <span class="rtd-sb-name">${t.tribeName}</span>`;
      if (total > 0) {
        html += `<span class="rtd-sb-val" style="color:var(--rtd-success);">${passed}</span>
          <span style="color:var(--rtd-muted);font-size:10px;margin:0 2px;">/</span>
          <span class="rtd-sb-val" style="color:var(--rtd-danger);">${failed}</span>`;
        if (rescues > 0) html += `<span class="rtd-sb-pill" style="background:rgba(176,64,64,.2);color:var(--rtd-danger);">${rescues} RESCUE</span>`;
      } else {
        html += `<span class="rtd-sb-val" style="color:var(--rtd-muted);">---</span>`;
      }
      html += `</div>`;
    });

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('social')} KEY EVENTS</div>`;
    const allEvts = [];
    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      if (meta[i].type === 'event') allEvts.push(meta[i]);
    }
    if (allEvts.length === 0) {
      html += `<div class="rtd-sb-event" style="color:var(--rtd-muted);font-style:italic;">Waiting for events...</div>`;
    } else {
      allEvts.slice(-5).forEach(e => {
        const evtLabel = e.eventType === 'encourage' ? 'ENCOURAGE' : e.eventType === 'splash' ? 'SPLASH' : e.eventType === 'showoff' ? 'SHOW OFF' : e.eventType === 'panic' ? 'PANIC' : e.eventType?.toUpperCase() || 'EVENT';
        const evtColor = (e.eventType === 'encourage' || e.eventType === 'showoff') ? 'var(--rtd-success)' : 'var(--rtd-danger)';
        html += `<div class="rtd-sb-event"><span class="rtd-sb-pill" style="background:${evtColor}22;color:${evtColor};">${evtLabel}</span></div>`;
      });
    }
  }

  if (phase === 'relay') {
    const st = _tvState['rtd-relay'];
    const revealIdx = st ? st.idx : -1;
    const meta = (typeof window !== 'undefined' && window._rtdRelayStepMeta) ? window._rtdRelayStepMeta : [];

    // Accumulate relay data from stepMeta
    const tribeCaptains = {};
    const tribeAssignments = {};
    const tribeLegsDone = {};
    const tribeLegResults = {};
    const relayEvents = [];

    data.tribes.forEach(t => {
      tribeCaptains[t.tribeName] = null;
      tribeAssignments[t.tribeName] = null;
      tribeLegsDone[t.tribeName] = new Set();
      tribeLegResults[t.tribeName] = {};
    });

    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (!m.tribe) continue;
      if (m.type === 'captain') tribeCaptains[m.tribe] = m.captain;
      if (m.type === 'assignment') tribeAssignments[m.tribe] = m.assignments;
      if (m.type === 'leg') {
        tribeLegsDone[m.tribe].add(m.leg);
        tribeLegResults[m.tribe][m.leg] = { player: m.player, passed: m.passed, fast: m.fast };
      }
      if (m.type === 'event') relayEvents.push(m);
    }

    html += `<div class="rtd-sb-section">${_icon('anchor')} CAPTAINS</div>`;
    data.tribes.forEach(t => {
      const cap = tribeCaptains[t.tribeName];
      if (cap) {
        html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
          <span class="rtd-sb-name">${t.tribeName}</span>
          <span class="rtd-sb-captain-badge">${cap}</span></div>`;
      } else {
        html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
          <span class="rtd-sb-name">${t.tribeName}</span>
          <span class="rtd-sb-val" style="color:var(--rtd-muted);">---</span></div>`;
      }
    });

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('trophy')} RELAY PROGRESS</div>`;
    const LEGS_ORDER = ['chug', 'decipher', 'stunt', 'fish'];
    data.tribes.forEach(t => {
      html += `<div style="margin:6px 0;"><div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
        <span class="rtd-sb-name"><strong>${t.tribeName}</strong></span></div>`;
      html += `<div class="rtd-sb-progress">`;
      LEGS_ORDER.forEach(leg => {
        const done = tribeLegsDone[t.tribeName].has(leg);
        html += `<div class="rtd-sb-bar ${done ? 'rtd-sb-bar-done' : ''}" title="${leg}"></div>`;
      });
      html += `</div>`;

      // Show assignments if revealed
      const assigns = tribeAssignments[t.tribeName];
      if (assigns) {
        html += `<div style="margin-top:4px;">`;
        LEGS_ORDER.forEach(leg => {
          if (assigns[leg]) {
            const result = tribeLegResults[t.tribeName][leg];
            let statusIcon = '';
            if (result) {
              statusIcon = result.passed
                ? (result.fast ? ' <span style="color:var(--rtd-success);">&#10003;&#10003;</span>' : ' <span style="color:var(--rtd-success);">&#10003;</span>')
                : ' <span style="color:var(--rtd-danger);">&#10007;</span>';
            }
            html += `<span class="rtd-sb-assign rtd-sb-assign-${leg}">${leg.toUpperCase()}</span>
              <span style="font-size:10px;color:var(--rtd-cream);">${assigns[leg]}${statusIcon}</span> `;
          }
        });
        html += `</div>`;
      }
      html += `</div>`;
    });

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('social')} KEY EVENTS</div>`;
    if (relayEvents.length === 0) {
      html += `<div class="rtd-sb-event" style="color:var(--rtd-muted);font-style:italic;">Waiting for events...</div>`;
    } else {
      relayEvents.slice(-6).forEach(e => {
        const label = e.eventType?.toUpperCase() || 'EVENT';
        const isGood = ['cheer', 'pride', 'showmance'].includes(e.eventType);
        const col = isGood ? 'var(--rtd-success)' : 'var(--rtd-danger)';
        html += `<div class="rtd-sb-event"><span class="rtd-sb-pill" style="background:${col}22;color:${col};">${label}</span></div>`;
      });
    }
  }

  if (phase === 'results') {
    html += `<div class="rtd-sb-section">${_icon('trophy')} FINAL STANDINGS</div>`;
    data.tribes.forEach((t, i) => {
      const medal = i === 0 ? '1ST' : i === data.tribes.length - 1 ? 'LAST' : `${i + 1}${i === 1 ? 'ND' : 'RD'}`;
      const medalColor = i === 0 ? 'var(--rtd-warning)' : i === data.tribes.length - 1 ? 'var(--rtd-danger)' : 'var(--rtd-muted)';
      html += `<div class="rtd-sb-row"><span class="rtd-sb-tribe" style="background:${t.tribeColor};"></span>
        <span class="rtd-sb-name"><strong>${t.tribeName}</strong></span>
        <span class="rtd-sb-pill" style="background:${medalColor}22;color:${medalColor};">${medal}</span>
        <span class="rtd-sb-val">${t.totalTime.toFixed(0)}s</span></div>`;
    });

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('trophy')} IMMUNITY</div>`;
    if (data.winningTribe) {
      const safeTribes = data.tribeRanking.slice(0, -1);
      html += `<div class="rtd-sb-row"><span class="rtd-sb-captain-badge" style="background:rgba(196,148,48,.15);">${safeTribes.join(', ')}</span></div>`;
    }

    html += `<div class="rtd-sb-divider"></div>`;
    html += `<div class="rtd-sb-section">${_icon('danger')} CLAM DUTY</div>`;
    if (data.clamPunishment) {
      html += `<div class="rtd-sb-event" style="color:var(--rtd-danger);">${data.clamPunishment.tribe}</div>`;
    }
  }

  html += '</div>';
  return html;
}

function _rtdUpdateSidebar(screenKey) {
  try {
    const sideEl = document.getElementById('rtd-sidebar-inner');
    if (!sideEl) return;
    const epRecord = gs.episodeHistory?.[window.vpEpNum - 1];
    if (!epRecord?.rockTheDock) return;
    let phase = 'title';
    if (screenKey?.includes('swim')) phase = 'swim';
    else if (screenKey?.includes('relay')) phase = 'relay';
    else if (screenKey?.includes('results')) phase = 'results';
    sideEl.innerHTML = _buildSidebarContent(epRecord, phase);
  } catch (e) { /* sidebar update failed — non-fatal */ }
}

function _updateRelayTracker(screenKey) {
  try {
    if (!screenKey?.includes('relay')) return;
    const meta = (typeof window !== 'undefined' && window._rtdRelayStepMeta) ? window._rtdRelayStepMeta : [];
    const st = _tvState[screenKey];
    if (!st) return;

    const LEGS_ORDER = ['chug', 'decipher', 'stunt', 'fish'];
    const revealedLegs = new Set();
    let currentLeg = null;

    for (let i = 0; i <= st.idx && i < meta.length; i++) {
      if (meta[i].type === 'leg') {
        revealedLegs.add(meta[i].leg);
        currentLeg = meta[i].leg;
      }
      if (meta[i].type === 'leg-header') currentLeg = meta[i].leg;
    }

    LEGS_ORDER.forEach(leg => {
      const el = document.getElementById(`rtd-leg-${leg}`);
      if (!el) return;
      el.classList.remove('locked', 'active', 'done');
      if (revealedLegs.has(leg) && leg !== currentLeg) {
        el.classList.add('done');
      } else if (leg === currentLeg) {
        el.classList.add('active');
      } else {
        el.classList.add('locked');
      }
    });
  } catch (e) {}
}

function _rtdUpdateMap(screenKey) {
  try {
    if (!screenKey?.includes('swim')) return;
    const st = _tvState[screenKey];
    if (!st) return;
    const meta = (typeof window !== 'undefined' && window._rtdSwimStepMeta) ? window._rtdSwimStepMeta : [];
    const epRecord = gs.episodeHistory?.[window.vpEpNum - 1];
    if (!epRecord?.rockTheDock) return;
    const data = epRecord.rockTheDock;

    // Count revealed swim results per tribe
    const tribeRevealed = {};
    const tribeTotal = {};
    data.tribes.forEach(t => {
      tribeRevealed[t.tribeName] = 0;
      tribeTotal[t.tribeName] = t.swimResults.length;
    });

    for (let i = 0; i <= st.idx && i < meta.length; i++) {
      if (meta[i].tribe && meta[i].type === 'swim') {
        tribeRevealed[meta[i].tribe]++;
      }
    }

    data.tribes.forEach((t, ti) => {
      const marker = document.getElementById(`rtd-marker-${ti}`);
      if (!marker) return;
      const total = tribeTotal[t.tribeName] || 1;
      const revealed = tribeRevealed[t.tribeName] || 0;
      const pct = 15 + (revealed / total) * 70;
      marker.style.left = `${pct}%`;
    });
  } catch (e) { /* map update failed — non-fatal */ }
}

// ══════════════════════════════════════════════════════════════
// VP: TITLE CARD — COLD OPEN
// ══════════════════════════════════════════════════════════════

export function rpBuildRTDTitleCard(ep) {
  const data = ep.rockTheDock;
  if (!data) return '';

  const epNum = window.vpEpNum || gs.episodeHistory?.length || 1;
  const hostSlug = seasonConfig?.hostSlug || 'chris';

  // Fishnet players — sorted by tribe, swaying
  let netPlayers = '';
  data.tribes.forEach(t => {
    t.tribeMembers.forEach(name => {
      const sl = slug(name);
      netPlayers += `<div class="rtd-net-player">
        <div class="rtd-net-knot rtd-net-knot-tl"></div><div class="rtd-net-knot rtd-net-knot-tr"></div>
        <div class="rtd-net-knot rtd-net-knot-bl"></div><div class="rtd-net-knot rtd-net-knot-br"></div>
        <img class="rtd-net-av" src="assets/avatars/${sl}.png" alt="${name}" style="border-color:${t.tribeColor}80;" onerror="this.style.display='none'">
        <span class="rtd-net-dot" style="background:${t.tribeColor};"></span>
        <strong>${name}</strong>
      </div>`;
    });
  });

  // Tribe blocks with avatars
  const tribeBlocks = data.tribes.map(t => {
    const avs = t.tribeMembers.map(n =>
      `<img src="assets/avatars/${slug(n)}.png" alt="${n}" style="border-color:${t.tribeColor}80;" onerror="this.style.display='none'">`
    ).join('');
    return `<div class="rtd-tc-tribe-block" style="border-color:${t.tribeColor}20;">
      <div class="rtd-tc-tribe-name" style="color:${t.tribeColor};">${t.tribeName.toUpperCase()}</div>
      <div class="rtd-tc-tribe-avs">${avs}</div>
    </div>`;
  }).join('');

  const content = `<div class="rtd-title-card">
    <div class="rtd-tc-ep">EPISODE ${epNum} &mdash; TRIBE CHALLENGE</div>
    <div class="rtd-tc-sub">WORLD TOUR</div>
    <div class="rtd-tc-title">Rock the Dock</div>
    <div class="rtd-tc-subtitle">SWIM THE OCEAN &bull; RACE THE RELAY &bull; KISS THE COD</div>
    <div class="rtd-tc-divider"></div>

    <div class="rtd-tc-cold">${pick(COLD_OPEN)()}</div>

    <div class="rtd-tc-phases-row">
      <div class="rtd-tc-phase-icon">
        <div class="rtd-tc-phase-ring">${_icon('swim')}</div>
        <div class="rtd-tc-phase-lbl">SWIM</div>
      </div>
      <div class="rtd-tc-phase-arrow"></div>
      <div class="rtd-tc-phase-icon">
        <div class="rtd-tc-phase-ring">${_icon('chug')}</div>
        <div class="rtd-tc-phase-lbl">CHUG</div>
      </div>
      <div class="rtd-tc-phase-arrow"></div>
      <div class="rtd-tc-phase-icon">
        <div class="rtd-tc-phase-ring">${_icon('decipher')}</div>
        <div class="rtd-tc-phase-lbl">DECIPHER</div>
      </div>
      <div class="rtd-tc-phase-arrow"></div>
      <div class="rtd-tc-phase-icon">
        <div class="rtd-tc-phase-ring">${_icon('stunt')}</div>
        <div class="rtd-tc-phase-lbl">STUNT</div>
      </div>
      <div class="rtd-tc-phase-arrow"></div>
      <div class="rtd-tc-phase-icon">
        <div class="rtd-tc-phase-ring">${_icon('fish')}</div>
        <div class="rtd-tc-phase-lbl">FISH KISS</div>
      </div>
    </div>

    <div class="rtd-tc-phase-descs">
      <div class="rtd-tc-phase-desc">
        <div class="rtd-tc-phase-num">1</div>
        <div>
          <div class="rtd-tc-phase-name">OCEAN SWIM</div>
          <div class="rtd-tc-phase-text">Dropped in open water, tribes swim to the dock. Vote on a swim formation, then pray your weakest link can float. Fastest tribe gets a time bonus.</div>
        </div>
      </div>
      <div class="rtd-tc-phase-desc">
        <div class="rtd-tc-phase-num">2</div>
        <div>
          <div class="rtd-tc-phase-name">DOCK RELAY</div>
          <div class="rtd-tc-phase-text">Elect a captain who assigns members to four relay legs: chug the fisherman's remedy, decipher a thick-accent local, survive the dock obstacle, and kiss a cod like you mean it.</div>
        </div>
      </div>
    </div>

    <div class="rtd-fishnet">${netPlayers}</div>

    <div class="rtd-tc-tribes">${tribeBlocks}</div>

    <div class="rtd-tc-host">
      <img src="assets/avatars/${hostSlug}.png" class="rtd-tc-host-av" onerror="this.style.display='none'">
      <div class="rtd-tc-host-quote">"${pick(HOST_TITLE_QUIP)()}" &mdash; ${host()}</div>
    </div>

    <div class="rtd-tc-start">&#9654; PRESS REVEAL TO BEGIN &#9664;</div>
  </div>`;

  return _shell(content, ep, 'title', true);
}

// ══════════════════════════════════════════════════════════════
// VP: OCEAN SWIM SCREEN
// ══════════════════════════════════════════════════════════════

export function rpBuildRTDSwim(ep) {
  const data = ep.rockTheDock;
  if (!data) return '';

  const screenKey = 'rtd-swim';
  const suffix = 'swim';
  const steps = [];
  const stepMeta = [];

  // Build steps from simulation data
  data.tribes.forEach(t => {
    // Tribe header
    steps.push(_tribeCardHtml(t.tribeName, t.tribeColor, `${t.tribeName.toUpperCase()} — Formation Vote`));
    stepMeta.push({ tribe: t.tribeName, type: 'tribe-header' });

    // Formation debate
    steps.push(_card('captain', 'anchor', 'Formation Debate', _badge('captain', t.formation.type.toUpperCase()),
      `<strong>${t.formation.champion}</strong> advocates: ${t.formation.advocateText}`, '', t.formation.champion));
    stepMeta.push({ tribe: t.tribeName, type: 'formation' });

    // Individual swim rolls
    t.swimResults.forEach(sr => {
      const impactCls = sr.rescued ? ' rtd-impact' : '';
      if (sr.lost) {
        steps.push(_card('fail', 'danger', `${sr.name} — LOST AT SEA`, _badge('fail', 'LOST'),
          sr.text + _scoreBar(sr.name, -4, 'd'), ' rtd-impact', sr.name));
      } else if (sr.rescued) {
        steps.push(_card('rescue', 'rescue', `${sr.name} — Rescued!`, _badge('rescue', 'RESCUE'),
          sr.text + _scoreBar(sr.name, -2, 'd') + _scoreBar(sr.rescuer, 2, 'g'), impactCls, sr.name));
      } else if (sr.passed) {
        steps.push(_card('success', 'swim', `${sr.name} — Strong Swim`, _badge('pass', '+2'),
          sr.text + _scoreBar(sr.name, 2, 'g'), '', sr.name));
      } else {
        steps.push(_card('fail', 'danger', `${sr.name} — Struggle`, _badge('fail', '-1'),
          sr.text + _scoreBar(sr.name, -1, 'd'), '', sr.name));
      }
      stepMeta.push({ tribe: t.tribeName, type: 'swim', player: sr.name, passed: sr.passed, rescued: sr.rescued, lost: sr.lost });

      // Swim events for this player
      sr.events.forEach(evt => {
        const evtPlayer = evt.players?.[0] || sr.name;
        steps.push(_card('social', 'social', evt.label, _badge('social', evt.badge), evt.text, '', evtPlayer));
        stepMeta.push({ tribe: t.tribeName, type: 'event', eventType: evt.type });
      });

      // Ambient dock flavor ~30%
      if (Math.random() < 0.3) {
        steps.push(pick(DOCK_AMBIENT)());
        stepMeta.push({ tribe: null, type: 'ambient' });
      }
    });

    // Host commentary after tribe finishes
    steps.push(_chatter(pick(HOST_SWIM)(), true));
    stepMeta.push({ tribe: null, type: 'chatter' });
  });

  // "Last to shore" dramatic card
  const allSwimmers = data.tribes.flatMap(t => t.swimResults.filter(sr => !sr.lost));
  const sortedSwimmers = allSwimmers.sort((a, b) => a.score - b.score);
  const lastSwimmer = sortedSwimmers[0]; // lowest score = last to shore
  if (lastSwimmer) {
    const lsPr = pronouns(lastSwimmer.name);
    steps.push(_card('fail', 'swim', `${lastSwimmer.name} — Last to Shore`, _badge('fail', 'LAST'),
      pick([
        `${lastSwimmer.name} finally drags ${lsPr.ref} onto the dock, gasping. Every other swimmer is already there. The tribe watches in silence.`,
        `The dock falls quiet as ${lastSwimmer.name} pulls ${lsPr.ref} out of the water. Dead last. ${lsPr.Sub} avoids eye contact with everyone.`,
        `${lastSwimmer.name} collapses on the dock planks. ${lsPr.Sub} was the last swimmer to shore. The shame is palpable.`,
        `A wet, exhausted ${lastSwimmer.name} crawls onto the dock. Everyone else finished minutes ago. ${host()} doesn't even comment. ${lsPr.Sub} knows.`,
      ]), '', lastSwimmer.name));
    stepMeta.push({ tribe: null, type: 'last-to-shore', player: lastSwimmer.name });
  }

  // Arrival order summary
  data.tribes.forEach(t => {
    if (!t.arrivalOrder || t.arrivalOrder.length === 0) return;
    const orderHtml = t.arrivalOrder.map((n, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      const lostTag = n === t.lostAtSea ? ' <span style="color:var(--rtd-danger);font-size:10px;">(LOST — returned late)</span>' : '';
      return `<div style="padding:2px 0;font-size:12px;">${medal} <strong>${n}</strong>${lostTag}</div>`;
    }).join('');
    steps.push(_card('captain', 'anchor', `${t.tribeName} — Shore Arrival`, _badge('captain', 'ORDER'),
      `<div style="font-size:11px;color:var(--rtd-muted);margin-bottom:4px;">First to shore → Last</div>${orderHtml}`));
    stepMeta.push({ tribe: t.tribeName, type: 'arrival-order' });
  });

  // Clam punishment (last-place swim tribe)
  if (data.clamPunishment) {
    steps.push(_card('fail', 'danger', `${data.clamPunishment.tribe} — Clam Punishment`, _badge('fail', 'LAST PLACE'),
      data.clamPunishment.text));
    stepMeta.push({ tribe: data.clamPunishment.tribe, type: 'clam' });

    if (data.clamPunishment.blameEvent) {
      const blamePlayer = data.clamPunishment.blameEvent.blamer || '';
      steps.push(_card('social', 'social', 'Blame', _badge('social', 'BLAME'),
        data.clamPunishment.blameEvent.text, ' rtd-impact', blamePlayer));
      stepMeta.push({ tribe: data.clamPunishment.tribe, type: 'event', eventType: 'blame' });
    }
    if (data.clamPunishment.revengeEvent) {
      const revPlayer = data.clamPunishment.revengeEvent.revenger || '';
      steps.push(_card('social', 'social', 'Revenge', _badge('social', 'REVENGE'),
        data.clamPunishment.revengeEvent.text, '', revPlayer));
      stepMeta.push({ tribe: data.clamPunishment.tribe, type: 'event', eventType: 'revenge' });
    }
  }

  // Between-phase events
  data.tribes.forEach(t => {
    t.betweenPhaseEvents.forEach(evt => {
      const evtPlayer = evt.players?.[0] || '';
      steps.push(_card('social', 'social', evt.label, _badge('social', evt.badge), evt.text, '', evtPlayer));
      stepMeta.push({ tribe: t.tribeName, type: 'between' });
    });
  });

  const st = _ensureState(screenKey, steps.length);
  if (typeof window !== 'undefined') window._rtdSwimStepMeta = stepMeta;

  // Build swim map
  const swimMap = `<div class="rtd-swim-map" id="rtd-swim-map">
    <div class="rtd-dock-target"></div>
    ${data.tribes.map((t, i) => `<div class="rtd-swim-marker" id="rtd-marker-${i}" style="left:15%;top:${25 + i * 20}%;background:${t.tribeColor};border-color:${t.tribeColor}80;">${t.tribeName.substring(0, 2).toUpperCase()}</div>`).join('')}
    <div class="rtd-wv-map"></div>
  </div>`;

  const stepsHtml = steps.map((s, i) =>
    `<div id="rtd-step-${suffix}-${i}" class="rtd-step${st.idx >= i ? ' rtd-visible' : ''}">${s}</div>`
  ).join('');

  const controls = `<div id="rtd-controls-${suffix}" class="rtd-controls">
    <button type="button" class="rtd-btn" aria-label="Reveal next" onclick="rockTheDockRevealNext('${screenKey}',${steps.length})">NEXT &#9654;</button>
    <span id="rtd-counter-${suffix}" class="rtd-counter" role="status" aria-live="polite">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
    <button type="button" class="rtd-btn" aria-label="Reveal all" onclick="rockTheDockRevealAll('${screenKey}',${steps.length})">REVEAL ALL</button>
  </div>`;

  const content = `
    <div class="rtd-phase-hdr"><div class="rtd-phase-tag">PHASE 1</div>
    <div class="rtd-phase-title">Ocean Swim</div>
    <div class="rtd-phase-sub">Tribes swim from the drop point to the dock. Pick a formation and pray your weakest link can float.</div></div>
    ${swimMap}
    ${stepsHtml}
    ${controls}`;

  return _shell(content, ep, 'swim');
}

// ══════════════════════════════════════════════════════════════
// VP: DOCK RELAY SCREEN
// ══════════════════════════════════════════════════════════════

export function rpBuildRTDRelay(ep) {
  const data = ep.rockTheDock;
  if (!data) return '';

  const screenKey = 'rtd-relay';
  const suffix = 'relay';
  const steps = [];
  const stepMeta = [];

  // Phase transition cinematic
  steps.push(`<div class="rtd-phase-transition"><div class="rtd-pt-tag">ARRIVING AT</div><div class="rtd-pt-title">The Dock</div></div>`);
  stepMeta.push({ tribe: null, type: 'transition' });

  // Relay progress tracker placeholder
  const LEGS_ORDER = ['chug', 'decipher', 'stunt', 'fish'];
  const LEG_LABELS = { chug: 'CHUG', decipher: 'DECIPHER', stunt: 'STUNT', fish: 'FISH KISS' };
  const LEG_ICONS = { chug: 'chug', decipher: 'decipher', stunt: 'stunt', fish: 'fish' };

  const trackerHtml = `<div class="rtd-relay-tracker">
    ${LEGS_ORDER.map((leg, i) => `<div class="rtd-leg locked" id="rtd-leg-${leg}">
      <div class="rtd-leg-label">${_icon(LEG_ICONS[leg])} LEG ${i + 1}</div>
      <div class="rtd-leg-name">${LEG_LABELS[leg]}</div>
    </div>`).join('')}
  </div>`;

  steps.push(trackerHtml);
  stepMeta.push({ tribe: null, type: 'tracker' });

  // Captain elections
  data.tribes.forEach(t => {
    steps.push(_tribeCardHtml(t.tribeName, t.tribeColor, `${t.tribeName.toUpperCase()} — Captain Election`));
    stepMeta.push({ tribe: t.tribeName, type: 'tribe-header' });

    steps.push(_card('captain', 'anchor', `Captain: ${t.captain.name}`, _badge('captain', t.captain.quality.toUpperCase()),
      `${t.captain.electionText}<br><span style="font-size:11px;color:var(--rtd-muted);">Assignment quality: ${t.captain.quality} (${t.captain.archetype})</span>`, '', t.captain.name));
    stepMeta.push({ tribe: t.tribeName, type: 'captain', captain: t.captain.name });
  });

  // Assignments reveal
  data.tribes.forEach(t => {
    const assignCounts = {};
    LEGS_ORDER.forEach(leg => { const p = t.assignments[leg]; if (p) assignCounts[p] = (assignCounts[p] || 0) + 1; });
    const assignText = LEGS_ORDER.map(leg => {
      const player = t.assignments[leg];
      if (!player) return '';
      const lr = t.legResults.find(l => l.leg === leg);
      const misLabel = lr?.misAssigned ? ' <span style="color:var(--rtd-danger);font-size:10px;">(MIS-ASSIGNED)</span>' : '';
      const dutyLabel = assignCounts[player] > 1 ? ' <span style="color:var(--rtd-warning,orange);font-size:10px;">(DOUBLE DUTY)</span>' : '';
      return `<span class="rtd-sb-assign rtd-sb-assign-${leg}">${LEG_LABELS[leg]}</span> ${player}${misLabel}${dutyLabel}`;
    }).join(' &nbsp; ');

    steps.push(_card('captain', 'anchor', `${t.tribeName} Assignments`, _badge('captain', 'LINEUP'), assignText, '', t.captain.name));
    stepMeta.push({ tribe: t.tribeName, type: 'assignment', assignments: t.assignments });

    if (t.lostAtSea) {
      steps.push(_card('fail', 'danger', `${t.lostAtSea} — Sidelined`, _badge('fail', 'LOST AT SEA'),
        `${t.lostAtSea} is still recovering from getting lost at sea. ${pronouns(t.lostAtSea).Sub} watches the relay from shore, unable to participate.`, ' rtd-impact', t.lostAtSea));
      stepMeta.push({ tribe: t.tribeName, type: 'lost-sidelined', player: t.lostAtSea });
    }

    // Player reaction to bad assignment
    const misAssigned = t.legResults.filter(lr => lr.misAssigned);
    if (misAssigned.length > 0) {
      const victim = pick(misAssigned);
      const vPr = pronouns(victim.player);
      const legLabel = LEG_LABELS[victim.leg];
      const reactions = [
        `${victim.player} stares at ${t.captain.name}. "You want ME on ${legLabel}? Are you serious right now?"`,
        `"${legLabel}?!" ${victim.player} sputters. "${t.captain.name}, that's literally my WORST event."`,
        `${victim.player} looks at the ${legLabel.toLowerCase()} station and back at ${t.captain.name}. "You're setting me up to fail."`,
        `"Cool. ${legLabel}. Great." ${victim.player}'s voice drips with sarcasm. ${vPr.Sub} is NOT happy.`,
      ];
      steps.push(_card('social', 'social', `${victim.player} reacts`, _badge('social', 'REACTION'),
        pick(reactions), '', victim.player));
      stepMeta.push({ tribe: t.tribeName, type: 'event', eventType: 'reaction' });
    }
  });

  // Host commentary before legs
  steps.push(_chatter(pick(HOST_RELAY)(), true));
  stepMeta.push({ tribe: null, type: 'chatter' });

  // 4 Relay Legs
  LEGS_ORDER.forEach((leg, legIdx) => {
    // Leg header
    steps.push(`<div style="text-align:center;margin:16px 0 8px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:3px;color:var(--rtd-rope-light);">LEG ${legIdx + 1}</div>
      <div style="font-family:'Bitter',serif;font-size:22px;font-weight:700;color:var(--rtd-white);">${LEG_LABELS[leg]}</div>
    </div>`);
    stepMeta.push({ tribe: null, type: 'leg-header', leg });

    // Per-tribe performance
    data.tribes.forEach(t => {
      const lr = t.legResults.find(l => l.leg === leg);
      if (!lr) return;

      let variant, icon, labelText, badgeText, badgeType;
      if (lr.refused) {
        variant = 'fail';
        icon = 'fish';
        labelText = `${lr.player} — REFUSED!`;
        badgeText = 'REFUSED';
        badgeType = 'fail';
      } else if (lr.fast) {
        variant = leg === 'fish' ? 'fish' : leg;
        icon = LEG_ICONS[leg];
        labelText = `${lr.player} — BLAZING!`;
        badgeText = '+3';
        badgeType = 'pass';
      } else if (lr.passed) {
        variant = leg === 'fish' ? 'fish' : leg;
        icon = LEG_ICONS[leg];
        labelText = `${lr.player} — Complete`;
        badgeText = '+1';
        badgeType = 'pass';
      } else {
        variant = 'fail';
        icon = 'danger';
        labelText = `${lr.player} — Failed`;
        badgeText = '-2';
        badgeType = 'fail';
      }

      const fishClass = leg === 'fish' ? (lr.passed ? ' rtd-fish-spectacle rtd-fish-success' : ' rtd-fish-spectacle rtd-fish-recoil') : '';
      const impactClass = (lr.refused || (!lr.passed && leg === 'chug')) ? ' rtd-impact' : '';

      let content = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span class="rtd-sb-tribe" style="background:${t.tribeColor};width:10px;height:10px;"></span>
        <strong>${t.tribeName}</strong>
      </div>${lr.text}`;

      if (lr.misAssigned) {
        content += `<div style="margin-top:6px;font-size:11px;color:var(--rtd-danger);">Mis-assigned! Wrong leg for ${lr.player}'s strengths.</div>`;
      }

      content += _scoreBar(lr.player, lr.fast ? 3 : lr.passed ? 1 : (lr.refused ? -2 : -2), lr.passed ? 'g' : 'd');

      steps.push(_card(variant, icon, labelText, _badge(badgeType, badgeText), content, fishClass + impactClass, lr.player));
      stepMeta.push({ tribe: t.tribeName, type: 'leg', leg, player: lr.player, passed: lr.passed, fast: lr.fast });

      // Events for this leg
      lr.events.forEach(evt => {
        const evtImpact = (evt.type === 'vomit' || evt.type === 'sabotage') ? ' rtd-impact' : '';
        const evtVariant = evt.type === 'vomit' ? 'vomit' : 'social';
        const evtIcon = evt.type === 'vomit' ? 'danger' : 'social';
        const evtPlayer = evt.players?.[0] || lr.player;
        steps.push(_card(evtVariant, evtIcon, evt.label, _badge('social', evt.badge), evt.text, evtImpact, evtPlayer));
        stepMeta.push({ tribe: t.tribeName, type: 'event', eventType: evt.type });
      });

      // Ambient dock flavor ~25%
      if (Math.random() < 0.25) {
        steps.push(pick(DOCK_AMBIENT)());
        stepMeta.push({ tribe: null, type: 'ambient' });
      }

      // Crowd reactions (fish kiss only)
      if (leg === 'fish' && lr.crowdReactions.length > 0) {
        const crowdHtml = lr.crowdReactions.map(cr =>
          `<div style="padding:4px 0;font-size:12px;">${cr.text}</div>`
        ).join('');
        steps.push(_card('social', 'social', 'Crowd Reactions', _badge('social', 'REACTIONS'),
          crowdHtml, ' rtd-fish-lunge'));
        stepMeta.push({ tribe: t.tribeName, type: 'crowd' });
      }
    });

    // Relay time comparison after each leg
    const timeCompare = data.tribes.map(t => {
      const doneLegResults = t.legResults.filter(lr => LEGS_ORDER.indexOf(lr.leg) <= legIdx);
      const time = doneLegResults.reduce((sum, lr) => sum + (lr.passed ? (lr.fast ? 0 : 1) : 2), 0);
      return { tribe: t.tribeName, color: t.tribeColor, time };
    });
    const maxTime = Math.max(1, ...timeCompare.map(tc => tc.time));
    const compareHtml = `<div style="margin:12px 0 8px;padding:10px 14px;background:rgba(30,25,20,.5);border-radius:5px;border:1px solid rgba(160,128,80,.08);">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--rtd-rope-light);margin-bottom:6px;">RELAY STANDINGS — LEG ${legIdx + 1}</div>
      ${timeCompare.sort((a,b) => a.time - b.time).map(tc => `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
        <span style="width:8px;height:8px;border-radius:1px;background:${tc.color};flex-shrink:0;"></span>
        <span style="font-size:11px;min-width:60px;">${tc.tribe}</span>
        <div style="flex:1;height:6px;background:rgba(224,218,206,.08);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${(tc.time / maxTime) * 100}%;background:${tc.color};border-radius:3px;transition:width .3s;"></div>
        </div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--rtd-muted);min-width:20px;text-align:right;">${tc.time}s</span>
      </div>`).join('')}
    </div>`;
    steps.push(compareHtml);
    stepMeta.push({ tribe: null, type: 'time-compare', legIdx });

    // Host chatter between legs
    if (legIdx < 3) {
      steps.push(_chatter(pick(HOST_RELAY)(), true));
      stepMeta.push({ tribe: null, type: 'chatter' });
    }
  });

  // Captain blame/pride final reactions
  data.tribes.forEach(t => {
    const failedLegs = t.legResults.filter(lr => !lr.passed);
    const blazingLegs = t.legResults.filter(lr => lr.fast);

    if (failedLegs.length > 0 && t.captain.name) {
      const worstPerf = failedLegs[0].player;
      if (worstPerf !== t.captain.name) {
        steps.push(_card('social', 'social', `${t.captain.name} reacts`, _badge('social', 'POST-RELAY'),
          pick(CAPTAIN_BLAME)(t.captain.name, worstPerf), '', t.captain.name));
        stepMeta.push({ tribe: t.tribeName, type: 'event', eventType: 'blame' });
      }
    }

    if (blazingLegs.length > 0 && t.captain.name) {
      const bestPerf = blazingLegs[0].player;
      if (bestPerf !== t.captain.name) {
        steps.push(_card('social', 'social', `${t.captain.name} reacts`, _badge('social', 'POST-RELAY'),
          pick(CAPTAIN_PRIDE)(t.captain.name, bestPerf), '', t.captain.name));
        stepMeta.push({ tribe: t.tribeName, type: 'event', eventType: 'pride' });
      }
    }
  });

  const st = _ensureState(screenKey, steps.length);
  if (typeof window !== 'undefined') window._rtdRelayStepMeta = stepMeta;

  const stepsHtml = steps.map((s, i) =>
    `<div id="rtd-step-${suffix}-${i}" class="rtd-step${st.idx >= i ? ' rtd-visible' : ''}">${s}</div>`
  ).join('');

  const controls = `<div id="rtd-controls-${suffix}" class="rtd-controls">
    <button type="button" class="rtd-btn" aria-label="Reveal next" onclick="rockTheDockRevealNext('${screenKey}',${steps.length})">NEXT &#9654;</button>
    <span id="rtd-counter-${suffix}" class="rtd-counter" role="status" aria-live="polite">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
    <button type="button" class="rtd-btn" aria-label="Reveal all" onclick="rockTheDockRevealAll('${screenKey}',${steps.length})">REVEAL ALL</button>
  </div>`;

  const content = `
    <div class="rtd-phase-hdr"><div class="rtd-phase-tag">PHASE 2</div>
    <div class="rtd-phase-title">Dock Relay</div>
    <div class="rtd-phase-sub">One captain. Four legs. Chug the mystery jug, decipher the fisherman, survive the obstacle, and kiss the cod. Go.</div></div>
    ${stepsHtml}
    ${controls}`;

  return _shell(content, ep, 'relay');
}

// ══════════════════════════════════════════════════════════════
// VP: RESULTS SCREEN
// ══════════════════════════════════════════════════════════════

export function rpBuildRTDResults(ep) {
  const data = ep.rockTheDock;
  if (!data) return '';

  const screenKey = 'rtd-results';
  const suffix = 'results';
  const steps = [];
  const stepMeta = [];

  // Per-tribe breakdown
  data.tribes.forEach((t, i) => {
    const isWinner = t.tribeName === data.winningTribe;
    const isLoser = t.tribeName === data.losingTribe;
    const medalLabel = isWinner ? '1ST PLACE' : isLoser ? 'LAST PLACE' : `${i + 1}${i === 1 ? 'ND' : 'RD'} PLACE`;
    const medalColor = isWinner ? 'var(--rtd-warning)' : isLoser ? 'var(--rtd-danger)' : 'var(--rtd-muted)';
    const borderColor = isWinner ? 'var(--rtd-warning)' : isLoser ? 'var(--rtd-danger)' : 'var(--rtd-rope)';

    const passedSwims = t.swimResults.filter(sr => sr.passed).length;
    const failedSwims = t.swimResults.filter(sr => !sr.passed).length;
    const passedLegs = t.legResults.filter(lr => lr.passed).length;
    const failedLegs = t.legResults.filter(lr => !lr.passed).length;
    const blazingLegs = t.legResults.filter(lr => lr.fast).length;

    let breakdown = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span class="rtd-sb-tribe" style="background:${t.tribeColor};width:12px;height:12px;"></span>
      <strong style="font-family:'Bitter',serif;font-size:18px;">${t.tribeName}</strong>
      <span class="rtd-sb-pill" style="background:${medalColor}22;color:${medalColor};font-size:10px;">${medalLabel}</span>
    </div>`;

    breakdown += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div style="background:rgba(224,218,206,.04);padding:8px 10px;border-radius:4px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--rtd-rope-light);margin-bottom:4px;">SWIM PHASE</div>
        <div style="font-size:13px;"><span style="color:var(--rtd-success);">${passedSwims} passed</span> / <span style="color:var(--rtd-danger);">${failedSwims} struggled</span></div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--rtd-muted);margin-top:2px;">Time: ${t.swimTime}s</div>
        <div style="font-size:11px;color:var(--rtd-muted);">Formation: ${t.formation.type}</div>
      </div>
      <div style="background:rgba(224,218,206,.04);padding:8px 10px;border-radius:4px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--rtd-rope-light);margin-bottom:4px;">RELAY PHASE</div>
        <div style="font-size:13px;"><span style="color:var(--rtd-success);">${passedLegs} passed</span> / <span style="color:var(--rtd-danger);">${failedLegs} failed</span></div>
        ${blazingLegs > 0 ? `<div style="font-size:11px;color:var(--rtd-warning);">${blazingLegs} blazing performance${blazingLegs > 1 ? 's' : ''}</div>` : ''}
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--rtd-muted);margin-top:2px;">Time: ${t.relayTime}s</div>
        <div style="font-size:11px;color:var(--rtd-muted);">Captain: ${t.captain.name} (${t.captain.quality})</div>
      </div>
    </div>`;

    breakdown += `<div style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:${medalColor};margin-top:8px;">TOTAL: ${t.totalTime.toFixed(0)}s</div>`;

    steps.push(`<div class="rtd-card" style="border-left:3px solid ${borderColor};">${breakdown}</div>`);
    stepMeta.push({ tribe: t.tribeName, type: 'result' });
  });

  // Final standings
  const standingsText = data.tribes.map((t, i) => {
    const medal = i === 0 ? '\u{1F947}' : i === data.tribes.length - 1 ? '❌' : '—';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
      <span style="font-size:16px;width:24px;text-align:center;">${medal}</span>
      <span class="rtd-sb-tribe" style="background:${t.tribeColor};width:10px;height:10px;"></span>
      <strong>${t.tribeName}</strong>
      <span style="margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rtd-muted);">${t.totalTime.toFixed(0)}s</span>
    </div>`;
  }).join('');

  steps.push(_card('captain', 'trophy', 'Final Standings', _badge('captain', 'RESULTS'), standingsText));
  stepMeta.push({ tribe: null, type: 'standings' });

  // Tribal immunity
  if (data.winningTribe) {
    const winnerTribeData = data.tribes.find(t => t.tribeName === data.winningTribe);
    const safeTribes = data.tribeRanking.slice(0, -1);
    steps.push(_card('success', 'trophy', `${safeTribes.join(' & ')} — SAFE`, _badge('pass', 'IMMUNITY'),
      `<strong>${safeTribes.join('</strong> and <strong>')}</strong> win${safeTribes.length === 1 ? 's' : ''} tribal immunity! <strong>${data.losingTribe}</strong> will face tribal council tonight.`));
    stepMeta.push({ tribe: data.winningTribe, type: 'immunity' });
  }

  // Clam punishment summary
  if (data.clamPunishment) {
    steps.push(_card('fail', 'danger', `Clam Duty: ${data.clamPunishment.tribe}`, _badge('fail', 'PUNISHMENT'),
      data.clamPunishment.text));
    stepMeta.push({ tribe: data.clamPunishment.tribe, type: 'clam' });
  }

  // Post-challenge confessionals
  const confessionals = [];
  // Best performer overall
  const topPerf = data.tribes.flatMap(t => t.tribeMembers).sort((a, b) =>
    (ep.chalMemberScores?.[b] || 0) - (ep.chalMemberScores?.[a] || 0)
  )[0];
  if (topPerf) {
    const tPr = pronouns(topPerf);
    confessionals.push({ name: topPerf, text: pick([
      `"I came into this challenge knowing I had to prove myself. And I did." ${topPerf} allows ${tPr.ref} a rare smile.`,
      `${topPerf} wrings out ${tPr.posAdj} hair. "That was everything I had. Every single drop."`,
      `"People underestimate me. They won't after today." ${topPerf} stares into the camera.`,
    ])});
  }
  // Worst performer
  const worstPerf = data.tribes.flatMap(t => t.tribeMembers).sort((a, b) =>
    (ep.chalMemberScores?.[a] || 0) - (ep.chalMemberScores?.[b] || 0)
  )[0];
  if (worstPerf && worstPerf !== topPerf) {
    const wPr = pronouns(worstPerf);
    confessionals.push({ name: worstPerf, text: pick([
      `${worstPerf} sits alone. "I know what they're all thinking. And they're right. I was terrible."`,
      `"I let my team down." ${worstPerf} picks at ${wPr.posAdj} nails. "There's no spinning this."`,
      `${worstPerf} stares at the ocean. "If I go home tonight... I earned it."`,
    ])});
  }
  // Captain of losing tribe
  const losingCaptain = data.tribes.find(t => t.tribeName === data.losingTribe)?.captain?.name;
  if (losingCaptain && losingCaptain !== topPerf && losingCaptain !== worstPerf) {
    const cPr = pronouns(losingCaptain);
    confessionals.push({ name: losingCaptain, text: pick([
      `"My assignments... I thought I had it right." ${losingCaptain} shakes ${cPr.posAdj} head. "I was wrong."`,
      `${losingCaptain} paces. "Everyone's gonna blame me. Captain goes down with the ship, right?"`,
      `"I take full responsibility." ${losingCaptain} pauses. "But I also know who REALLY cost us the challenge."`,
    ])});
  }

  confessionals.forEach(conf => {
    steps.push(`<div style="background:rgba(30,25,20,.7);border:1px solid rgba(160,128,80,.08);border-radius:5px;padding:14px 18px;position:relative;border-left:3px solid var(--rtd-rope-dark);">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:3px;color:var(--rtd-rope-light);margin-bottom:6px;">CONFESSIONAL</div>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <img src="assets/avatars/${slug(conf.name)}.png" alt="${conf.name}" style="width:32px;height:32px;border-radius:4px;border:1.5px solid var(--rtd-rope-dark);object-fit:contain;" onerror="this.style.display='none'">
        <div style="font-size:13px;line-height:1.6;color:var(--rtd-cream);font-style:italic;">${conf.text}</div>
      </div>
    </div>`);
    stepMeta.push({ tribe: null, type: 'confessional', player: conf.name });
  });

  // Host closing
  steps.push(_chatter(`"And THAT'S Rock the Dock! ${data.losingTribe}, I'll see you at tribal council tonight."`, true));
  stepMeta.push({ tribe: null, type: 'chatter' });

  const st = _ensureState(screenKey, steps.length);

  const stepsHtml = steps.map((s, i) =>
    `<div id="rtd-step-${suffix}-${i}" class="rtd-step${st.idx >= i ? ' rtd-visible' : ''}">${s}</div>`
  ).join('');

  const controls = `<div id="rtd-controls-${suffix}" class="rtd-controls">
    <button type="button" class="rtd-btn" aria-label="Reveal next" onclick="rockTheDockRevealNext('${screenKey}',${steps.length})">NEXT &#9654;</button>
    <span id="rtd-counter-${suffix}" class="rtd-counter" role="status" aria-live="polite">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
    <button type="button" class="rtd-btn" aria-label="Reveal all" onclick="rockTheDockRevealAll('${screenKey}',${steps.length})">REVEAL ALL</button>
  </div>`;

  const content = `
    <div class="rtd-phase-hdr"><div class="rtd-phase-tag">FINAL</div>
    <div class="rtd-phase-title">Results</div>
    <div class="rtd-phase-sub">The dock has spoken. Here are the final tribe standings.</div></div>
    ${stepsHtml}
    ${controls}`;

  return _shell(content, ep, 'results');
}

// ══════════════════════════════════════════════════════════════
// VP: REVEAL HANDLERS
// ══════════════════════════════════════════════════════════════

function _smoothScroll(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

export function rockTheDockRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('rtd-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    _smoothScroll(document.getElementById(`rtd-step-${suffix}-${st.idx}`));
  } catch (e) { console.warn('RTD reveal error:', e); }
  try { _rtdUpdateSidebar(screenKey); } catch (e) {}
  try { _rtdUpdateMap(screenKey); } catch (e) {}
  try { _updateRelayTracker(screenKey); } catch (e) {}
}

export function rockTheDockRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('rtd-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    _smoothScroll(document.getElementById(`rtd-step-${suffix}-${st.total - 1}`));
  } catch (e) { console.warn('RTD revealAll error:', e); }
  try { _rtdUpdateSidebar(screenKey); } catch (e) {}
  try { _rtdUpdateMap(screenKey); } catch (e) {}
  try { _updateRelayTracker(screenKey); } catch (e) {}
}

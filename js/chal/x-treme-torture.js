// js/chal/x-treme-torture.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, romanticCompat, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';

// ══════════════════════════════════════════════════════════════════════
// X-TREME TORTURE TEXT POOLS (composable segments)
// ══════════════════════════════════════════════════════════════════════

const XT_SKY_PLANE = {
  high: [
    (n,pr) => `${n} is already at the open hatch, peering out. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} delighted. Unsettlingly delighted.`,
    (n,pr) => `${n} is practically bouncing. "This is INCREDIBLE!" ${pr.Sub} ${pr.sub==='they'?'have':'has'} to be restrained from jumping early.`,
    (n,pr) => `${n} does a practice jump crouch mid-aisle. Nobody asked. ${pr.Sub} ${pr.sub==='they'?'do':'does'} it again.`,
    (n,pr) => `The wind is howling through the hatch. ${n} leans into it, hair whipping, arms spread. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} like ${pr.sub} ${pr.sub==='they'?'belong':'belongs'} up here.`,
    (n,pr) => `"Let's GO already!" ${n} shouts over the engine noise. The instructor checks the gear one more time. ${n} checks it too — faster.`,
  ],
  mid: [
    (n,pr) => `${n} takes a seat near the hatch and peers out. Nervous. But curious. ${pr.Sub} ${pr.sub==='they'?'can':'can'} do this.`,
    (n,pr) => `${n} is breathing through ${pr.posAdj} nose. Controlled. Focused. ${pr.Sub} keeps telling ${pr.ref} it's just a step.`,
    (n,pr) => `${n} watches the others prep and does the same. No wasted energy. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} what ${pr.sub} signed up for.`,
    (n,pr) => `${n} tightens ${pr.posAdj} harness one extra notch, then stares at the floor of the plane. Working something out internally. ${pr.Sub} ${pr.sub==='they'?'get':'gets'} there.`,
    (n,pr) => `${n} murmurs something under ${pr.posAdj} breath — a pep talk, maybe a prayer — then squares ${pr.posAdj} shoulders and moves toward the hatch.`,
  ],
  low: [
    (n,pr) => `${n} is plastered against the back wall of the plane. Not happening. Except it is.`,
    (n,pr) => `${n} grips the seat so hard ${pr.posAdj} knuckles are white. ${pr.Sub} ${pr.sub==='they'?'haven\'t':'hasn\'t'} looked out the window once.`,
    (n,pr) => `${n} is praying. Or bargaining. Hard to tell. Either way, ${pr.sub} ${pr.sub==='they'?'look':'looks'} terrible.`,
    (n,pr) => `${n}'s eyes are closed. ${pr.Sub} ${pr.sub==='they'?'haven\'t':'hasn\'t'} moved since takeoff. The instructor taps ${pr.posAdj} shoulder. ${n} flinches like ${pr.sub} ${pr.sub==='they'?'forgot':'forgot'} where ${pr.sub} ${pr.sub==='they'?'were':'was'}.`,
    (n,pr) => `Every turbulence bump earns a strangled noise from ${n}. ${pr.Sub} ${pr.sub==='they'?'are':'is'} technically conscious and technically cooperative. That's about all that can be said.`,
  ],
};

const XT_SKY_JUMP = {
  willing: [
    (n,pr) => `${n} steps to the edge and goes. Clean exit. No hesitation.`,
    (n,pr) => `${n} doesn't even pause. One step, then freefall. ${pr.Sub} ${pr.sub==='they'?'whoop':'whoops'} on the way down.`,
    (n,pr) => `${n} gives a thumbs-up to the camera and launches. Showboat. It works.`,
    (n,pr) => `Without a word, ${n} walks to the hatch and steps off. No ceremony. Just gone. The wind takes ${pr.obj}.`,
    (n,pr) => `${n} grins at the instructor. "Race you." Then ${pr.sub} ${pr.sub==='they'?'dive':'dives'} headfirst out of the plane.`,
  ],
  hesitant: [
    (n,pr) => `${n} gets to the edge. Steps back. Steps forward. Steps back. Then — goes.`,
    (n,pr) => `${n} stands at the hatch for a long, silent moment. Then something clicks. ${pr.Sub} ${pr.sub==='they'?'jump':'jumps'}.`,
    (n,pr) => `${n} squeezes ${pr.posAdj} eyes shut, counts to three out loud, and falls forward. It counts.`,
    (n,pr) => `${n} talks ${pr.ref} through it in real time. "Okay. Okay. OKAY." Then ${pr.sub} ${pr.sub==='they'?'tip':'tips'} forward. Gone.`,
    (n,pr) => `${n} stares down for a full ten seconds, jaw locked. Then ${pr.posAdj} head drops, ${pr.posAdj} legs bend — and ${pr.sub} ${pr.sub==='they'?'fall':'falls'}.`,
  ],
  pushed: [
    (n,pr,pusher) => `${n} is frozen at the edge. ${pusher} puts a hand on ${pr.posAdj} shoulder — and nudges. ${n} is airborne.`,
    (n,pr,pusher) => `${pusher} loses patience. One firm push. ${n} screams all the way down, but ${pr.sub} ${pr.sub==='they'?'go':'goes'}.`,
    (n,pr,pusher) => `"On three," says ${pusher}. ${n} nods. ${pusher} doesn't count. ${n} is already gone.`,
  ],
  refused: [
    (n,pr) => `${n} shakes ${pr.posAdj} head. Sits down. Crosses ${pr.posAdj} arms. The instructor gives up.`,
    (n,pr) => `${n} looks out the hatch once, looks back at the crew, and says "Absolutely not." The plane circles back.`,
    (n,pr) => `${n} refuses. Politely but firmly. ${pr.Sub} ${pr.sub==='they'?'wave':'waves'} as the others jump.`,
  ],
};

const XT_SKY_CHECK = {
  exit: {
    pass: [
      (n,pr) => `Clean exit. ${n} steps off the edge and drops.`,
      (n,pr) => `${n} launches cleanly — no hesitation at the door.`,
      (n,pr) => `Good exit. ${n} clears the plane and enters freefall in control.`,
      (n,pr) => `${n} pushes off the ramp with both feet. Clean separation. Airborne.`,
      (n,pr) => `One breath. Then ${n} is gone. Smooth exit — body straight, arms tucked.`,
    ],
    fail: [
      (n,pr) => `${n} clips the door frame on the way out. Bad angle from the start.`,
      (n,pr) => `Ugly exit. ${n} tumbles sideways off the ramp — already spinning.`,
      (n,pr) => `${n} catches a boot on the threshold and somersaults out. Not ideal.`,
      (n,pr) => `${n} freezes at the door, gets nudged by the wind, and falls out more than jumps.`,
      (n,pr) => `${n}'s shoulder hits the edge of the hatch. The spin starts immediately.`,
    ]
  },
  freefall: {
    pass: [
      (n,pr) => `${n} stabilizes mid-air. Arms out, body flat — textbook freefall form.`,
      (n,pr) => `Freefall body control is solid. ${n} finds ${pr.posAdj} center and holds it.`,
      (n,pr) => `${n} spreads out and stops spinning. Stable. The ground is getting closer.`,
      (n,pr) => `${n} arches ${pr.posAdj} back and the tumbling stops. Belly-to-earth. Controlled.`,
      (n,pr) => `Wind roars but ${n} holds position. Limbs out, chin up. Riding the air.`,
    ],
    fail: [
      (n,pr) => `${n} is tumbling. Can't stabilize — arms flailing, wind tearing at ${pr.obj}.`,
      (n,pr) => `Freefall goes wrong fast. ${n} is spinning and can't stop. The ground is a blur.`,
      (n,pr) => `${n} curls up instinctively — the worst thing to do. Now ${pr.sub}'s a spinning ball.`,
      (n,pr) => `The wind has ${n}. ${pr.Sub} ${pr.sub==='they'?'try':'tries'} to spread out but the rotation is too fast.`,
      (n,pr) => `${n} is face-up, face-down, face-up again. No control. Pure chaos at 120 mph.`,
    ]
  },
  deploy: {
    pass: [
      (n,pr) => `Chute deploys clean. The canopy blooms above ${n} and the world slows down.`,
      (n,pr) => `${n} pulls the cord. The parachute opens perfectly — one smooth snap.`,
      (n,pr) => `Textbook deploy. ${n} feels the jerk, looks up — full canopy. Relief.`,
      (n,pr) => `The ripcord finds ${n}'s hand on the first grab. The chute billows open. Controlled descent.`,
      (n,pr) => `${n} deploys at the perfect altitude. The canopy catches air and ${pr.sub} ${pr.sub==='they'?'float':'floats'}.`,
    ],
    fail: [
      (n,pr) => `${n} grabs for the cord — misses — grabs again. The chute half-opens, tangles.`,
      (n,pr) => `Late pull. The chute rips open violently, jerking ${n} like a ragdoll.`,
      (n,pr) => `Something's wrong with the lines. ${n} kicks and yanks until the chute catches. Barely.`,
      (n,pr) => `${n} pulls the cord and nothing happens. Pulls harder. The chute sputters open — twisted.`,
      (n,pr) => `The canopy opens lopsided. ${n} is descending way too fast on one side.`,
    ]
  },
  steer: {
    pass: [
      (n,pr) => `${n} pulls the toggles and steers toward the target. Clean approach angle.`,
      (n,pr) => `Steering on point. ${n} tracks toward the sofa bed, making small corrections.`,
      (n,pr) => `${n} reads the wind and adjusts. The landing zone is dead ahead.`,
      (n,pr) => `Left toggle, right toggle — ${n} threads through the crosswind and lines up the target.`,
      (n,pr) => `${n} makes it look easy. Gentle S-turns, losing altitude on purpose. The circle grows bigger.`,
    ],
    fail: [
      (n,pr) => `${n} pulls the wrong toggle. Drifting off course — the target is getting farther away.`,
      (n,pr) => `Wind catches the chute and drags ${n} sideways. ${pr.Sub} can't correct in time.`,
      (n,pr) => `${n} overcorrects. Then overcorrects the correction. Now ${pr.sub}'s heading for the trees.`,
      (n,pr) => `${n} can see the sofa bed below but the wind is pushing ${pr.obj} past it. No toggle response.`,
      (n,pr) => `Steering fails. ${n} is committed to the wrong approach and there's no time to fix it.`,
    ]
  },
  flare: {
    pass: [
      (n,pr) => `Perfect flare. ${n} pulls both toggles at the right height. Soft touchdown.`,
      (n,pr) => `${n} times the flare perfectly — feet down, knees bent, absorbs the impact.`,
      (n,pr) => `Last second: flare. ${n} bleeds speed and touches down smooth.`,
      (n,pr) => `${n} sinks both toggles at ten feet. The chute stalls gently. Feather landing.`,
      (n,pr) => `Flare on point. ${n} goes from full speed to standing in two seconds flat.`,
    ],
    fail: [
      (n,pr) => `${n} flares too late. Hits the ground at full speed. Legs buckle.`,
      (n,pr) => `No flare. ${n} comes in hot and just... impacts. The ground wins.`,
      (n,pr) => `${n} flares too early, stalls, and drops the last ten feet like a stone.`,
      (n,pr) => `${n} forgets to flare entirely. Feet hit first, then knees, then face.`,
      (n,pr) => `The timing is off. ${n} yanks the toggles but it's already too late — full-speed arrival.`,
    ]
  }
};

const XT_SKY_FALL = {
  perfect: [
    (n,pr) => `${n} pulls the chute at exactly the right moment. Textbook deployment. The canopy blooms clean.`,
    (n,pr) => `The chute opens with a satisfying crack. ${n} checks ${pr.posAdj} altitude, adjusts course. Completely in control.`,
    (n,pr) => `Perfect pull. The canopy snaps open above ${n} and ${pr.sub} ${pr.sub==='they'?'drift':'drifts'} down like ${pr.sub} ${pr.sub==='they'?'own':'owns'} the sky.`,
    (n,pr) => `${n} deploys with precision — not too early, not too late. The chute billows clean. ${pr.Sub} ${pr.sub==='they'?'steer':'steers'} immediately.`,
    (n,pr) => `Flawless execution. ${n} pulls the ripcord and the chute unfurls without a hiccup. ${pr.Sub} ${pr.sub==='they'?'float':'floats'} down calm as anything.`,
  ],
  late: [
    (n,pr) => `${n} pulls late. The canopy rips open with a violent jerk. ${pr.Sub} ${pr.sub==='they'?'yelp':'yelps'}. But it opens.`,
    (n,pr) => `${n} waits a beat too long. The ground looks very real. The chute catches. Just.`,
  ],
  tangled: [
    (n,pr) => `${n}'s chute deploys — then tangles. ${pr.Sub} ${pr.sub==='they'?'spin':'spins'} like a top for fifteen horrifying seconds before it sorts itself.`,
    (n,pr) => `Lines crossed. Chute half-open. ${n} kicks and yanks and swears until it shakes loose. Not graceful. Effective.`,
  ],
  forgot: [
    (n,pr) => `${n} forgets to pull. The instructor on the ground is losing ${pr.posAdj} mind. ${n} remembers. Eventually.`,
    (n,pr) => `Three seconds of pure silence from ${n}'s radio. Then: "Oh — RIGHT!" The chute fires.`,
  ],
};

const XT_SKY_GROUND = {
  perfect: [
    (n,pr) => `The ground crew is in position. ${n} has a clear target. Everything lined up.`,
    (n,pr) => `Flawless. The crew locks the sofa bed dead center and holds it there. ${n} has an unmissable target.`,
    (n,pr) => `Someone took charge down there and it worked. The crew moves as a unit, calling out adjustments until the circle is perfect.`,
    (n,pr) => `From up there, the crew looks like a machine. ${n} steers straight at them without hesitation.`,
    (n,pr) => `The anchor holds the circle rigid, the coordinator keeps everyone in line. ${n} drifts in with a clear bullseye below.`,
  ],
  decent: [
    (n,pr) => `Ground crew is close enough. A little scattered, but ${n} makes it work.`,
    (n,pr) => `Not a perfect setup, but the crew adjusts. ${n} has a workable landing zone.`,
    (n,pr) => `Off by a foot, but close enough. ${n} adjusts in the last ten seconds and threads it.`,
    (n,pr) => `Two members pull in different directions for a moment before someone overrules them. The circle ends up a little crooked, but usable.`,
    (n,pr) => `Someone almost trips carrying the sofa bed into position. They recover. ${n} pretends not to have seen it.`,
  ],
  chaos: [
    (n,pr,sleeper) => sleeper
      ? `The ground crew is all over the place. ${sleeper} is literally asleep in the target circle. ${n} is coming in hot.`
      : `The ground crew is all over the place. Someone's in the wrong spot. Someone else is checking their phone. ${n} is coming in hot.`,
    (n,pr,sleeper) => sleeper
      ? `Ground crew chaos. ${sleeper} has wandered off. The target circle is basically decorative at this point.`
      : `Ground crew chaos. People facing the wrong way. The target circle is basically decorative at this point.`,
    (n,pr,sleeper) => sleeper
      ? `Two crew members argue about which direction ${sleeper} is supposed to face. ${n} is already in freefall. Nobody agrees.`
      : `Two crew members argue about which direction to carry the sofa bed. ${n} is already in freefall. Nobody agrees.`,
    (n,pr,sleeper) => `The sofa bed wheel locks up mid-carry. The crew abandons it and just stands in a vague cluster. ${n} is going to have to improvise.`,
    (n,pr,sleeper) => sleeper
      ? `Half the ground crew drifts over to watch ${sleeper} instead of doing their job. The landing circle is basically a suggestion.`
      : `Half the ground crew starts watching ${n}'s descent instead of staying in position. Nobody notices they're not holding the circle anymore.`,
  ],
};

const XT_SKY_LANDING = {
  perfect: [
    (n,pr) => `${n} lands in the circle with both feet. Sticks it. The ground crew actually cheers.`,
    (n,pr) => `Textbook landing. ${n} touches down soft and centered. ${pr.Sub} ${pr.sub==='they'?'make':'makes'} it look easy.`,
    (n,pr) => `Bullseye. ${n} drifts straight into the center of the circle and touches down like it's nothing. The crew goes wild.`,
    (n,pr) => `${n} hits the target clean — two feet, standing, barely a stumble. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around like ${pr.sub} ${pr.sub==='they'?'want':'wants'} to do it again.`,
    (n,pr) => `Dead center. ${n} touches down and stays up — barely a bend in ${pr.posAdj} knees. Surgical.`,
  ],
  good: [
    (n,pr) => `Not perfect, but solid. ${n} touches down a few feet off-center and stumbles, but stays upright. Respectable.`,
    (n,pr) => `${n} comes in a little hot. The landing isn't pretty — knees buckle, hands hit dirt — but ${pr.sub}'s in the zone. It counts.`,
    (n,pr) => `${n} clips the edge of the sofa bed and tumbles, but rolls to ${pr.posAdj} feet. Not elegant. Not a disaster either.`,
    (n,pr) => `Decent landing. ${n} overshoots by a few feet and has to scramble back to the circle. Close enough.`,
    (n,pr) => `${n} lands standing but immediately staggers sideways. Catches ${pr.ref}. "That was on purpose." It wasn't.`,
  ],
  rough: [
    (n,pr) => `${n} comes in sideways and rolls hard. ${pr.Sub} ${pr.sub==='they'?'bounce':'bounces'} once, twice, stops just inside the circle. Counts.`,
    (n,pr) => `Rough approach. ${n} hits the ground running and keeps going for about forty feet. Still on target.`,
    (n,pr) => `${n} belly-flops into the landing zone. Sand in every crevice. But technically in bounds.`,
    (n,pr) => `The sofa bed is close. ${n} is not. ${pr.Sub} hits dirt three feet short and skids the rest of the way. Ugly but valid.`,
    (n,pr) => `${n} lands hard enough to leave an impression in the ground. Literally. ${pr.Sub}'s shaped hole in the sand. But in the circle.`,
  ],
  crash: [
    (n,pr) => `${n} crashes into the circle like a lawn dart. Mud everywhere. ${pr.Sub} ${pr.sub==='they'?'give':'gives'} a thumbs up from the ground.`,
    (n,pr) => `${n} lands face-first just inside the boundary. ${pr.Sub} ${pr.sub==='they'?'lie':'lies'} there for a moment. Then: "I'm okay!"`,
  ],
  injury: [
    (n,pr) => `${n} lands wrong — ankle twists on impact. ${pr.Sub} ${pr.sub==='they'?'go':'goes'} down immediately. Medic rushes over.`,
    (n,pr) => `Hard landing. ${n} hits the edge of the circle and buckles. ${pr.Sub} ${pr.sub==='they'?'are':'is'} helped up slowly. Points deducted. Pain acquired.`,
  ],
};

// ── MOOSE RIDING ─────────────────────────────────────────────────────

const XT_MOOSE_APPROACH = {
  high: [
    (n,pr,mooseType) => `${n} sees the ${mooseType} and ${pr.posAdj} face splits into a grin. ${pr.Sub} ${pr.sub==='they'?'crack':'cracks'} ${pr.posAdj} knuckles. Let's go.`,
    (n,pr,mooseType) => `The ${mooseType} stares ${n} down. ${n} stares back. This is already personal.`,
  ],
  mid: [
    (n,pr,mooseType) => `${n} approaches the ${mooseType} carefully. Measured steps. ${pr.Sub} ${pr.sub==='they'?'have':'has'} clearly thought about this.`,
    (n,pr,mooseType) => `${n} looks the ${mooseType} over. Checks the hooves. Checks the antlers. Nods slowly. Okay then.`,
  ],
  low: [
    (n,pr,mooseType) => `${n} takes one look at the ${mooseType} and ${pr.posAdj} whole body language changes. ${pr.Sub} ${pr.sub==='they'?'want':'wants'} no part of this.`,
    (n,pr,mooseType) => `${n} stops three feet from the ${mooseType} and just stares. The ${mooseType} snorts. ${n} flinches.`,
  ],
};

const XT_MOOSE_MOUNT = {
  success: [
    (n,pr) => `${n} grabs the antlers and swings up in one motion. The moose barely reacts. Seated.`,
    (n,pr) => `First try. ${n} hauls ${pr.ref} up and settles in. The moose flicks an ear. Not impressed, but tolerating it.`,
  ],
  fail: [
    (n,pr) => `${n} gets one leg over — then slides right off the other side. Lands in the dirt. The moose looks down at ${pr.obj}.`,
    (n,pr) => `Three attempts. The moose sidesteps every single time. ${n} is getting winded before the riding even starts.`,
  ],
};

const XT_MOOSE_BUCK = {
  hold: [
    (n,pr,round) => round === 1
      ? `The moose BUCKS. Hard. ${n} grips the antlers and squeezes — holds on! Round one to ${n}.`
      : round === 2
      ? `Second buck. Harder this time. ${n} leans into it, weight low — stays seated!`
      : `The moose is furious now. Violent lurch. ${n} somehow absorbs it. Unbelievable.`,
    (n,pr,round) => round === 1
      ? `First buck and ${n} barely moves. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} almost comfortable up there.`
      : round === 2
      ? `The moose rears. ${n} pulls forward on the antlers, compensates perfectly. Still on.`
      : `Round ${round}. The moose has tried everything. ${n} is still there. This is getting embarrassing — for the moose.`,
    (n,pr,round) => round === 1
      ? `The moose bucks left. ${n} goes right — and somehow that cancels out. Still mounted.`
      : round === 2
      ? `Massive buck. ${n} slips to one side — catches ${pr.ref}. Barely. Still on!`
      : `The moose throws a full-body shimmy. ${n} has no explanation for how ${pr.sub} ${pr.sub==='they'?'survive':'survives'} it.`,
    (n,pr,round) => round === 1
      ? `The moose launches into a full rear. ${n} drops ${pr.posAdj} weight and clamps down — rides it through. Still on.`
      : round === 2
      ? `${n} is white-knuckling the antlers by round two, but ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} let go.`
      : `Round ${round} and ${n} is still there, jaw set, refusing to be thrown. The moose seems confused.`,
    (n,pr,round) => round === 1
      ? `${n} absorbs round one like it's a speed bump. Eyes forward, grip steady. This isn't over.`
      : round === 2
      ? `The moose goes sideways, ${n} goes with it — and recovers. Body memory. Still seated.`
      : `Round ${round}. The crowd has gone quiet. ${n} is still on. Nobody knows how.`,
  ],
  thrown: [
    (n,pr,round) => round === 1
      ? `First buck. Gone. ${n} is airborne immediately, lands in a heap. That was quick.`
      : round === 2
      ? `${n} made it to round two, which is something. The moose bucks again — and ${n} goes flying.`
      : `${n} hung on this long, which is impressive. The moose finally finds the angle and ${n} launches.`,
    (n,pr,round) => round === 1
      ? `The moose barely shrugs and ${n} is off. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} genuinely surprised.`
      : round === 2
      ? `Round two. The moose means business. ${n} doesn't stand a chance. Off.`
      : `Round ${round} ends the same as all the others eventually do. ${n} hits the dirt.`,
    (n,pr,round) => round === 1
      ? `Zero seconds. ${n} is ejected before the buzzer. A new record, probably.`
      : round === 2
      ? `The moose waits until ${n} relaxes slightly. Then bucks. Timing is everything.`
      : `The moose won. Eventually. ${n} put up a real fight. Round ${round} was just too much.`,
    (n,pr,round) => round === 1
      ? `The moose doesn't warm up. First move, full force. ${n} doesn't even get to react before ${pr.sub} ${pr.sub==='they'?'are':'is'} airborne.`
      : round === 2
      ? `${n} held on for round one by instinct. Round two, the moose corrects for that. Off they go.`
      : `Round ${round}. The moose found the angle — that particular shimmy ${n} couldn't counter. ${pr.Sub} ${pr.sub==='they'?'sail':'sails'}.`,
    (n,pr,round) => round === 1
      ? `${n} is off before ${pr.posAdj} whole weight even settles. The moose is not interested in passengers.`
      : round === 2
      ? `Made it past the first buck, but the second one is always meaner. ${n} learns this firsthand.`
      : `The moose has been escalating this whole time. Round ${round}, ${n} finally runs out of answers.`,
  ],
};

const XT_MOOSE_DISMOUNT_LOCATION = [
  (n) => `a pile of socks`,
  (n) => `the lake`,
  (n) => `a large bush`,
  (n) => `craft services`,
  (n) => `the cameraman`,
  (n) => `Chef's lunch`,
  (n) => `the confessional outhouse`,
];

const XT_MOOSE_DISMOUNT = {
  graceful: [
    (n,pr) => `${n} slides off the moose cleanly and lands on both feet. Actually applause-worthy.`,
    (n,pr) => `Controlled dismount. ${n} steps off like ${pr.sub} ${pr.sub==='they'?'do':'does'} this every day. The moose is indifferent.`,
    (n,pr) => `${n} times the last buck and uses the momentum to land clean. Style points.`,
  ],
  thrown: [
    (n,pr,location) => `${n} goes SAILING and lands directly in ${location}. The moose trots away satisfied.`,
    (n,pr,location) => `The moose wins. ${n} ends up in ${location}. Nobody saw that coming. Especially not ${n}.`,
    (n,pr,location) => `One final buck. ${n} achieves impressive hangtime and touches down in ${location}.`,
  ],
};

// ── MUD SKIING ───────────────────────────────────────────────────────

const XT_SKI_START = {
  clean: [
    (skier,driver,spr) => `${driver} guns the jet ski and ${skier} rises up clean. ${skier} finds ${spr.posAdj} stance immediately. Clean start.`,
    (skier,driver,spr) => `Smooth acceleration. ${skier} gets up first try, skis tracking through the mud. ${driver} keeps it straight.`,
  ],
  jolt: [
    (skier,driver,spr) => `${driver} hits the throttle too hard. ${skier} is YANKED off ${spr.posAdj} feet and dragged face-first before recovering.`,
    (skier,driver,spr) => `Bad start. ${driver} lurches forward and ${skier} gets pulled sideways, fighting the rope to stay upright.`,
  ],
  joltResisted: [
    (skier,driver,spr) => `${driver} guns it wrong but ${skier} anticipates the jolt and leans into it. ${spr.Sub} ${spr.sub==='they'?'absorb':'absorbs'} the shock. Still up.`,
    (skier,driver,spr) => `Rough takeoff from ${driver}, but ${skier} ${spr.sub==='they'?'are':'is'} ready for it. ${spr.Sub} ${spr.sub==='they'?'ride':'rides'} it out and finds ${spr.posAdj} footing.`,
  ],
};

const XT_SKI_FLAG = {
  collect: [
    (skier,flagNum,spr,driver) => `Flag ${flagNum}. ${skier} angles hard and snatches it clean. One-handed.`,
    (skier,flagNum,spr,driver) => `${skier} times it perfectly — grabs flag ${flagNum} without breaking stride.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum} to ${skier}. Clean grab. ${driver} held the line.`,
    (skier,flagNum,spr,driver) => `${skier} reaches early, tracks the arc, and rips flag ${flagNum} at full speed.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum}. ${skier} barely has to adjust — perfect positioning from ${driver}.`,
    (skier,flagNum,spr,driver) => `${skier} leans way out for flag ${flagNum} — the kind of reach that should fail. It doesn't.`,
    (skier,flagNum,spr,driver) => `Mud flying. ${skier} punches through the spray and comes out holding flag ${flagNum}.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum} is at a weird angle. ${skier} adjusts mid-slide and plucks it clean.`,
    (skier,flagNum,spr,driver) => flagNum >= 4 ? `Flag ${flagNum}. ${skier} is in a groove now. Making it look routine.` : `${skier} gets flag ${flagNum} with a smooth backhand swipe. Style points.`,
    (skier,flagNum,spr,driver) => flagNum >= 4 ? `Flags piling up. ${skier} grabs number ${flagNum} almost lazily. ${spr.Sub}'s dialed in.` : `Flag ${flagNum} down. ${skier} flicks mud off ${spr.posAdj} hand and refocuses.`,
  ],
  miss: [
    (skier,flagNum,spr,driver) => `${skier} reaches for flag ${flagNum} — fingertips brush it but can't grip. Gone.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum} stays up. ${skier} was close but the angle was wrong.`,
    (skier,flagNum,spr,driver) => `${skier} lunges for flag ${flagNum} and nearly falls off the skis. Misses by inches.`,
    (skier,flagNum,spr,driver) => `The mud kicks up right as ${skier} goes for flag ${flagNum}. Can't see it. Can't grab it.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum}. ${skier} commits to the wrong side. By the time ${spr.sub} ${spr.sub==='they'?'correct':'corrects'}, it's too late.`,
  ],
  swerved: [
    (skier,flagNum,spr,driver) => `${skier} lines up for flag ${flagNum} — then ${driver} swerves. ${skier} goes wide. Flag untouched.`,
    (skier,flagNum,spr,driver) => `${driver} pulls right at flag ${flagNum}. ${skier} loses the line completely.`,
    (skier,flagNum,spr,driver) => `Just as ${skier} reaches for flag ${flagNum}, the jet ski jerks left. ${driver} claims it was the mud.`,
    (skier,flagNum,spr,driver) => `Flag ${flagNum} was right there. Then ${driver} "adjusts the course" and ${skier}'s angle is ruined.`,
    (skier,flagNum,spr,driver) => `${driver} accelerates through flag ${flagNum}'s zone. ${skier} barely has time to reach. Miss.`,
  ],
};

const XT_SKI_SABOTAGE = {
  attempt: [
    (driver,skier,dpr,spr) => `${driver} watches ${skier} set up for a flag and yanks the wheel. Deliberate. ${skier} has to know that was on purpose.`,
    (driver,skier,dpr,spr) => `${driver} starts drifting the jet ski off course. Plausible deniability — except ${dpr.sub} ${dpr.sub==='they'?'glance':'glances'} back with a smirk.`,
  ],
  backfire: [
    (driver,skier,dpr,spr) => `${driver} swerves to ruin ${skier}'s flag grab — but oversteers and nearly dumps them both. ${skier} grabs the flag anyway.`,
    (driver,skier,dpr,spr) => `Sabotage attempt from ${driver} goes wrong. The sudden jerk throws ${dpr.posAdj} own balance and ${skier} stays on, reaching the flag unimpeded.`,
  ],
  success: [
    (driver,skier,dpr,spr) => `${driver} kills the line at the worst possible moment. ${skier} is left grasping at nothing. Flag stays up.`,
    (driver,skier,dpr,spr) => `${driver}'s drift is textbook — pulls ${skier} wide of the flag with nowhere to adjust. Clean sabotage.`,
  ],
};

const XT_SKI_FINISH = {
  clean: [
    (skier,driver,spr) => `${skier} rides it out to the finish line. ${driver} cuts the engine and ${spr.sub} ${spr.sub==='they'?'glide':'glides'} in. Clean run.`,
    (skier,driver,spr) => `Full course completed. ${skier} drops the rope at the finish and ${spr.sub} ${spr.sub==='they'?'coast':'coasts'} to a stop. Well done.`,
  ],
  driverRefused: [
    (skier,driver,spr) => `${driver} kills the engine mid-course. Just stops. ${skier} sinks into the mud, flags still uncollected.`,
    (skier,driver,spr) => `${driver} refuses to complete the run. ${skier} is left standing in the mud looking furious.`,
  ],
  momentumSuccess: [
    (skier,driver,spr) => `${driver} opens the throttle wide at the finish. ${skier} is pulled fast — but uses the speed to grab one last flag. Momentum play pays off.`,
    (skier,driver,spr) => `Full throttle finish from ${driver}. ${skier} is barely hanging on but snatches the final flag before the line.`,
  ],
  momentumFail: [
    (skier,driver,spr) => `${driver} floors it at the end. ${skier} gets dragged through the last gate sideways and loses ${spr.posAdj} grip. Finish achieved, flag lost.`,
    (skier,driver,spr) => `Excessive speed from ${driver} sends ${skier} fishtailing into the finish. ${spr.Sub} ${spr.sub==='they'?'cross':'crosses'} the line but ${spr.sub} ${spr.sub==='they'?'miss':'misses'} the last grab.`,
  ],
};

// ── SELECTION ────────────────────────────────────────────────────────

const XT_SELECTION = {
  volunteer: [
    (n,pr,event) => `${n} steps forward before anyone else can. "I'll do ${event}." No hesitation.`,
    (n,pr,event) => `${n} raises ${pr.posAdj} hand. "${event}? Yeah, that's me." Grins at the camera.`,
    (n,pr,event) => `${n} is already walking toward the sign-up table before the event is even finished being explained. "${event}. Obvious choice." ${pr.Sub} doesn't turn around.`,
    (n,pr,event) => `"Who wants ${event}?" Silence. Then ${n}, already lacing up: "Done. Move on."`,
    (n,pr,event) => `${n} physically nudges someone out of the way to get to the sign-up for ${event}. Politely. Sort of.`,
  ],
  assigned: [
    (n,pr,event) => `${n} gets assigned to ${event}. ${pr.Sub} ${pr.sub==='they'?'take':'takes'} a breath and nods. Okay. Fine.`,
    (n,pr,event) => `Nobody volunteers for ${event}. Eyes drift to ${n}. ${pr.Sub} ${pr.sub==='they'?'shrug':'shrugs'}. "Sure, whatever."`,
    (n,pr,event) => `The tribe goes quiet. Someone says ${n}'s name first. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around, finds no objections, and agrees. "${event}. Alright."`,
    (n,pr,event) => `${n} gets the nod from the group. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} look thrilled, but ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} argue either. "Fine. ${event}. Let's just do it."`,
    (n,pr,event) => `A quiet consensus lands on ${n} for ${event}. ${pr.Sub} ${pr.sub==='they'?'accept':'accepts'} it with a single nod and zero further commentary.`,
  ],
  forced: [
    (n,pr,event) => `${n} is volunteered — by everyone else — for ${event}. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} thrilled. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} look thrilled.`,
    (n,pr,event) => `"${n}'s doing ${event}." Three people said it simultaneously. ${n} opens ${pr.posAdj} mouth. Closes it. Fine.`,
  ],
  refused: [
    (n,pr,event,refuser) => `${n} won't do ${event}. Period. ${refuser ? refuser + ' will have to find someone else.' : 'The team scrambles to find a replacement.'}`,
    (n,pr,event,refuser) => `${event}? ${n} shakes ${pr.posAdj} head. Hard no. ${refuser ? refuser + ' stares, then moves on.' : 'Moving on.'}`,
  ],
};

import { _challengeRomanceSpark } from '../romance.js';

export function simulateXtremeTorture(ep) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const epNum = (gs.episode || 0) + 1;

  if (!ep.campEvents) ep.campEvents = {};
  gs.tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};

  const tribes = gs.tribes;
  const EVENT_NAMES = ['Sofa Bed Skydiving', 'Rodeo Moose Riding', 'Mud Skiing'];

  // ── WEIGHTED RANDOM PICKER ──
  // Picks one item from `pool` using the parallel `weights` array.
  function weightedPick(pool, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // ── PLAYER SELECTION ──
  // For each tribe: assign one player to sky, moose, and ski events.
  // Uses weighted random selection based on stats + archetype bonuses.
  // Checks for refusals and replaces with a backup if needed.
  const selections = {};   // { tribeName: { sky, moose, ski } }
  const refusals = [];     // [{ name, tribe, event, replacement, text }]
  const selectionText = {}; // { tribeName: { sky, moose, ski } }

  tribes.forEach(tribe => {
    // Lingering injuries don't prevent selection — they apply stat penalties during the event
    const available = tribe.members.filter(m => gs.activePlayers.includes(m));

    const used = new Set();
    const isShortHanded = available.length < 3; // track for text generation

    function pickForEvent(eventKey, weightFn) {
      // STRICT: only pick from players not already assigned to an event
      const unused = available.filter(m => !used.has(m));
      // Only allow repeats if literally nobody is unused
      const pool = unused.length > 0 ? unused : [...available];
      if (!pool.length) return tribe.members[0]; // absolute fallback

      const weights = pool.map(name => {
        const s = pStats(name);
        const arch = players.find(p => p.name === name)?.archetype || '';
        let w = weightFn(s);
        if (arch === 'hero' || arch === 'physical') w += 0.15;
        if (eventKey !== 'ski' && (arch === 'villain' || arch === 'schemer')) w -= 0.10;
        return Math.max(0.01, w);
      });

      const pick = weightedPick(pool, weights);
      used.add(pick); // immediately mark as used
      return pick;
    }

    // Sky: boldness-heavy
    let skyPick = pickForEvent('sky', s => s.boldness * 0.08 + s.physical * 0.03);
    let skyRefused = false;
    const skyRefuseChance = Math.max(0, 0.08 + (5 - pStats(skyPick).boldness) * 0.03 + (5 - pStats(skyPick).loyalty) * 0.02);
    if (Math.random() < skyRefuseChance) {
      const remaining = available.filter(m => m !== skyPick);
      if (remaining.length) {
        const refuser = skyPick;
        const refuserPr = pronouns(refuser);
        const refusalTxt = _rp(XT_SELECTION.refused)(refuser, refuserPr, EVENT_NAMES[0], null);
        skyPick = _rp(remaining);
        skyRefused = true;
        refusals.push({ name: refuser, tribe: tribe.name, event: 'sky', replacement: skyPick, text: refusalTxt });
        tribe.members.filter(m => gs.activePlayers.includes(m) && m !== refuser).forEach(tm => addBond(tm, refuser, -0.3));
        if (seasonConfig.popularityEnabled !== false) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[refuser] = (gs.popularity[refuser] || 0) - 2; // coward edit
        }
      }
    }

    // Moose: endurance-heavy
    let moosePick = pickForEvent('moose', s => s.endurance * 0.08 + s.physical * 0.04);
    let mooseRefused = false;
    const mooseRefuseChance = Math.max(0, 0.08 + (5 - pStats(moosePick).boldness) * 0.03 + (5 - pStats(moosePick).loyalty) * 0.02);
    if (Math.random() < mooseRefuseChance) {
      const remaining = available.filter(m => m !== moosePick && !used.has(m));
      if (remaining.length) {
        const refuser = moosePick;
        const refuserPr = pronouns(refuser);
        const refusalTxt = _rp(XT_SELECTION.refused)(refuser, refuserPr, EVENT_NAMES[1], null);
        moosePick = _rp(remaining);
        mooseRefused = true;
        refusals.push({ name: refuser, tribe: tribe.name, event: 'moose', replacement: moosePick, text: refusalTxt });
        tribe.members.filter(m => gs.activePlayers.includes(m) && m !== refuser).forEach(tm => addBond(tm, refuser, -0.3));
        if (seasonConfig.popularityEnabled !== false) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[refuser] = (gs.popularity[refuser] || 0) - 2; // coward edit
        }
      }
    }

    // Ski: balanced (physical/mental/strategic)
    let skiPick = pickForEvent('ski', s => s.physical * 0.05 + s.mental * 0.04 + s.strategic * 0.03);
    let skiRefused = false;
    const skiRefuseChance = Math.max(0, 0.08 + (5 - pStats(skiPick).boldness) * 0.03 + (5 - pStats(skiPick).loyalty) * 0.02);
    if (Math.random() < skiRefuseChance) {
      const remaining = available.filter(m => m !== skiPick && !used.has(m));
      if (remaining.length) {
        const refuser = skiPick;
        const refuserPr = pronouns(refuser);
        const refusalTxt = _rp(XT_SELECTION.refused)(refuser, refuserPr, EVENT_NAMES[2], null);
        skiPick = _rp(remaining);
        skiRefused = true;
        refusals.push({ name: refuser, tribe: tribe.name, event: 'ski', replacement: skiPick, text: refusalTxt });
        tribe.members.filter(m => gs.activePlayers.includes(m) && m !== refuser).forEach(tm => addBond(tm, refuser, -0.3));
        if (seasonConfig.popularityEnabled !== false) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[refuser] = (gs.popularity[refuser] || 0) - 2; // coward edit
        }
      }
    }

    selections[tribe.name] = { sky: skyPick, moose: moosePick, ski: skiPick };

    // ── Generate selection text ──
    // Track how many events each player is doing
    const eventCount = {};
    [skyPick, moosePick, skiPick].forEach(n => { eventCount[n] = (eventCount[n] || 0) + 1; });

    const _selText = (name, eventLabel, refused, eventIdx) => {
      const pr = pronouns(name);
      const s = pStats(name);
      const count = eventCount[name] || 1;
      // If doing multiple events, acknowledge it
      if (count >= 3 && eventIdx === 0) {
        return `${name} looks around. ${pr.Sub}'s doing all three events. There's no one else. "Guess it's just me then."`;
      } else if (count >= 2 && eventIdx > 0 && isShortHanded) {
        const again = _rp([
          `${name} again. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} have a choice — the tribe is too small. "Back to work."`,
          `"Me again?" ${name} looks at ${pr.posAdj} depleted tribe. No one else can do it. ${pr.Sub} straps in.`,
          `${name} is pulling double duty. Short-handed tribe, no volunteers. ${pr.Sub} just nods and steps up.`,
        ]);
        return again;
      } else if (refused) {
        return _rp(XT_SELECTION.forced)(name, pr, eventLabel);
      } else if (s.boldness >= 7) {
        return _rp(XT_SELECTION.volunteer)(name, pr, eventLabel);
      } else {
        return _rp(XT_SELECTION.assigned)(name, pr, eventLabel);
      }
    };

    selectionText[tribe.name] = {
      sky:   _selText(skyPick,   EVENT_NAMES[0], skyRefused, 0),
      moose: _selText(moosePick, EVENT_NAMES[1], mooseRefused, 1),
      ski:   _selText(skiPick,   EVENT_NAMES[2], skiRefused, 2),
    };
  });

  // ── DATA STRUCTURE ──
  const xt = {
    selections,
    refusals,
    selectionText,
    skydiving: [],
    mooseRiding: [],
    mudSkiing: [],
    sidelineEvents: [],
    tribeScores: {},
    campEvents: {},
    winner: null,
    loser: null,
    mvp: null,
  };
  tribes.forEach(t => { xt.tribeScores[t.name] = { sky: 0, moose: 0, ski: 0, total: 0 }; });

  // ── EVENT 1: SOFA BED SKYDIVING ──────────────────────────────────────
  tribes.forEach(tribe => {
    const jumperName = selections[tribe.name]?.sky;
    if (!jumperName) {
      xt.skydiving.push({ tribe: tribe.name, jumper: null, score: 0, injured: false });
      xt.tribeScores[tribe.name].sky = 0;
      return;
    }

    const s = pStats(jumperName);
    const pr = pronouns(jumperName);
    const groundCrew = tribe.members.filter(m => gs.activePlayers.includes(m) && m !== jumperName);

    // 2a. Plane mood
    const planeTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
    const planeText = _rp(XT_SKY_PLANE[planeTier])(jumperName, pr);

    // 2b. Jump decision
    const jumpWillingly = s.boldness * 0.08 + s.physical * 0.02 + 0.15;
    const jumpRoll = Math.random();
    let jumpDecision, jumpText, pusher = null;
    if (jumpRoll < jumpWillingly) {
      jumpDecision = 'willing';
      jumpText = _rp(XT_SKY_JUMP.willing)(jumperName, pr);
    } else if (jumpRoll < jumpWillingly + 0.25) {
      jumpDecision = 'hesitant';
      jumpText = _rp(XT_SKY_JUMP.hesitant)(jumperName, pr);
    } else if (jumpRoll < jumpWillingly + 0.50) {
      jumpDecision = 'pushed';
      // Only the host (Chris/Chef) is in the plane with the jumper — ground crew is on the ground
      pusher = Math.random() < 0.5 ? host : 'Chef';
      jumpText = _rp(XT_SKY_JUMP.pushed)(jumperName, pr, pusher);
    } else {
      jumpDecision = 'refused';
      jumpText = _rp(XT_SKY_JUMP.refused)(jumperName, pr);
    }

    // 2c. Five skydiving checkpoints — each pass = +2 pts (max 10), matching moose/skiing
    // 1. Exit (boldness + physical)  2. Freefall (physical + mental)  3. Deploy (physical + mental, jump penalty)
    // 4. Steer (mental + physical)   5. Flare/Landing (mental + endurance)
    let skyChecks = 0;
    let fallTier = 'refused';
    const skyCheckResults = []; // track pass/fail for text
    if (jumpDecision !== 'refused') {
      const jumpPenalty = jumpDecision === 'pushed' ? -0.15 : jumpDecision === 'hesitant' ? -0.06 : 0;

      // Check 1: Clean exit from the plane
      const exitChance = s.boldness * 0.06 + s.physical * 0.04 + 0.15 + jumpPenalty;
      const exitPass = Math.random() < exitChance;
      if (exitPass) skyChecks++;
      skyCheckResults.push({ phase: 'exit', pass: exitPass, text: _rp(XT_SKY_CHECK.exit[exitPass ? 'pass' : 'fail'])(jumperName, pr) });

      // Check 2: Freefall body control
      const freefallChance = s.physical * 0.05 + s.mental * 0.04 + 0.18 + (exitPass ? 0.05 : -0.08);
      const freefallPass = Math.random() < freefallChance;
      if (freefallPass) skyChecks++;
      skyCheckResults.push({ phase: 'freefall', pass: freefallPass, text: _rp(XT_SKY_CHECK.freefall[freefallPass ? 'pass' : 'fail'])(jumperName, pr) });

      // Check 3: Chute deployment
      const deployChance = s.physical * 0.06 + s.mental * 0.05 + 0.12 + (freefallPass ? 0.05 : -0.10) + jumpPenalty;
      const deployPass = Math.random() < deployChance;
      if (deployPass) skyChecks++;
      skyCheckResults.push({ phase: 'deploy', pass: deployPass, text: _rp(XT_SKY_CHECK.deploy[deployPass ? 'pass' : 'fail'])(jumperName, pr) });

      // Check 4: Steering to target
      const steerChance = s.mental * 0.06 + s.physical * 0.03 + 0.18 + (deployPass ? 0.05 : -0.12);
      const steerPass = Math.random() < steerChance;
      if (steerPass) skyChecks++;
      skyCheckResults.push({ phase: 'steer', pass: steerPass, text: _rp(XT_SKY_CHECK.steer[steerPass ? 'pass' : 'fail'])(jumperName, pr) });

      // Check 5: Flare timing for landing
      const flareChance = s.mental * 0.05 + s.endurance * 0.04 + 0.18 + (steerPass ? 0.05 : -0.08);
      const flarePass = Math.random() < flareChance;
      if (flarePass) skyChecks++;
      skyCheckResults.push({ phase: 'flare', pass: flarePass, text: _rp(XT_SKY_CHECK.flare[flarePass ? 'pass' : 'fail'])(jumperName, pr) });

      // Determine fall tier from deploy check for text selection
      if (deployPass && steerPass) fallTier = 'perfect';
      else if (deployPass) fallTier = 'late';
      else if (skyChecks >= 2) fallTier = 'tangled';
      else fallTier = 'forgot';
    }
    const fallQuality = jumpDecision === 'refused' ? 0 : skyChecks / 5; // 0-1 normalized

    // 2d. Team positioning (skip if refused or no ground crew)
    let posQuality = 0;
    let groundText = '';
    let sleeperName = null;
    if (jumpDecision !== 'refused' && groundCrew.length > 0) {
      const gcStats = groundCrew.map(m => pStats(m));
      const avgPhysical = gcStats.reduce((sum, gs2) => sum + gs2.physical, 0) / gcStats.length;
      const avgSocial   = gcStats.reduce((sum, gs2) => sum + gs2.social,   0) / gcStats.length;
      const avgMental   = gcStats.reduce((sum, gs2) => sum + gs2.mental,   0) / gcStats.length;
      // posScore is 0-10 scale, normalize to 0-1 for probability
      const posRaw = avgPhysical * 0.4 + avgSocial * 0.3 + avgMental * 0.3;
      const posScore = posRaw / 10; // 0-1 range now

      // Sleeper check: ground crew member with endurance <= 3, 15% chance
      const sleeperCandidates = groundCrew.filter(m => pStats(m).endurance <= 3);
      sleeperName = (sleeperCandidates.length > 0 && Math.random() < 0.15)
        ? sleeperCandidates[Math.floor(Math.random() * sleeperCandidates.length)]
        : null;
      // Sleeper forces chaos
      if (sleeperName) {
        posQuality = 0.2;
        groundText = _rp(XT_SKY_GROUND.chaos)(jumperName, pr, sleeperName);
      } else {
        const posRoll = Math.random();
        if (posRoll < posScore * 0.6) {
          posQuality = 1.0;
          groundText = _rp(XT_SKY_GROUND.perfect)(jumperName, pr);
        } else if (posRoll < posScore * 0.85) {
          posQuality = 0.6;
          groundText = _rp(XT_SKY_GROUND.decent)(jumperName, pr);
        } else {
          posQuality = 0.2;
          groundText = _rp(XT_SKY_GROUND.chaos)(jumperName, pr, null);
        }
      }
    }

    // 2e. Ground crew individual contribution scores
    const crewContributions = [];
    if (jumpDecision !== 'refused' && groundCrew.length > 0) {
      groundCrew.forEach(crewName => {
        const cs = pStats(crewName);
        const contrib = cs.physical * 0.05 + cs.social * 0.04 + cs.mental * 0.02 + 0.05 + (Math.random() * 0.23 - 0.08);
        const clampedContrib = Math.max(0, Math.min(1, contrib));
        const role = cs.physical >= 7 ? 'anchor' : cs.social >= 7 ? 'coordinator' : cs.mental >= 7 ? 'spotter' : 'carrier';
        crewContributions.push({ name: crewName, contribution: clampedContrib, role });
      });
    }
    const crewScore = crewContributions.length > 0
      ? Math.round(Math.min(5, crewContributions.reduce((s, c) => s + c.contribution, 0) / crewContributions.length * 5) * 10) / 10
      : 0;

    // 2f. Landing + scoring
    let score = 0;
    let fallText = '';
    let landingText = '';
    let injured = false;
    if (jumpDecision === 'refused') {
      score = 0;
      landingText = '';
    } else {
      // Chaos factor: wind gust, sofa bed malfunction, bird strike, etc.
      // 20% chance of a chaos event that drops quality
      const chaosRoll = Math.random();
      let chaosPenalty = 0;
      let chaosText = '';
      if (chaosRoll < 0.08) {
        // Major chaos — wind gust knocks chute off course
        chaosPenalty = 0.4;
        chaosText = `A sudden wind gust catches ${jumperName}'s chute and drags ${pr.obj} off course. `;
      } else if (chaosRoll < 0.20) {
        // Minor chaos — sofa bed shifts, bird flies past, rope snags
        chaosPenalty = 0.2;
        const minorEvents = [
          `The sofa bed shifts at the last second. `,
          `A seagull clips ${jumperName}'s chute lines. `,
          `The landing zone is muddier than it looked from above. `,
          `${jumperName}'s boot catches on the chute harness during descent. `,
        ];
        chaosText = _rp(minorEvents);
      }
      // Score = checkpoints passed × 2 (max 10)
      // Chaos only penalizes if you were doing well (4+ checks) — no double punishment
      const chaosLoss = skyChecks >= 4 ? (chaosPenalty > 0.3 ? 2 : chaosPenalty > 0 ? 1 : 0) : 0;
      score = Math.max(0, skyChecks * 2 - chaosLoss);

      // Select fall text based on actual score
      fallText = '';
      if (score >= 8) {
        fallText = _rp(XT_SKY_FALL.perfect)(jumperName, pr);
      } else if (score >= 6) {
        fallText = _rp(XT_SKY_FALL.late)(jumperName, pr);
      } else if (score >= 3) {
        fallText = _rp(XT_SKY_FALL.tangled)(jumperName, pr);
      } else {
        fallText = _rp(XT_SKY_FALL.forgot)(jumperName, pr);
      }

      if (score >= 8 && chaosPenalty === 0) {
        landingText = chaosText + _rp(XT_SKY_LANDING.perfect)(jumperName, pr);
      } else if (score >= 6) {
        landingText = chaosText + _rp(XT_SKY_LANDING.good)(jumperName, pr);
      } else if (score >= 4) {
        landingText = chaosText + _rp(XT_SKY_LANDING.rough)(jumperName, pr);
      } else {
        landingText = chaosText + _rp(XT_SKY_LANDING.crash)(jumperName, pr);
        // Injury check
        const injChance = 0.15 + (10 - s.physical) * 0.04;
        if (Math.random() < injChance) {
          injured = true;
          if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
          gs.lingeringInjuries[jumperName] = {
            ep: epNum,
            duration: 2 + Math.floor(Math.random() * 2),
            penalty: 1.5 + Math.random(),
            type: 'skydiving-crash'
          };
          landingText += ' ' + _rp(XT_SKY_LANDING.injury)(jumperName, pr);
        }
      }
    }

    xt.tribeScores[tribe.name].sky = score + crewScore;
    if (seasonConfig.popularityEnabled !== false) {
      if (!gs.popularity) gs.popularity = {};
      if (score >= 8) gs.popularity[jumperName] = (gs.popularity[jumperName] || 0) + 2; // great jump
      if (injured) gs.popularity[jumperName] = (gs.popularity[jumperName] || 0) + 2; // injury sympathy
    }
    xt.skydiving.push({
      tribe: tribe.name,
      jumper: jumperName,
      jumpDecision,
      skyChecks,
      skyCheckResults,
      fallQuality,
      posQuality,
      score,
      crewScore,
      crewContributions,
      injured,
      groundCrew,
      text: {
        plane: planeText,
        jump: jumpText,
        fall: fallText,
        ground: groundText,
        landing: landingText,
      }
    });
  });

  // ── SIDELINE SOCIAL 1 (between Skydiving and Moose Riding) ──────────
  // Social events that fire while tribes regroup after the skydiving event.
  // Consequences: bond shifts, heat, romance sparks.
  const sideline1 = [];

  // Popularity helper — guards enabled check and initializes gs.popularity
  const _popAdd = (name, delta) => {
    if (seasonConfig.popularityEnabled === false) return;
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[name] = (gs.popularity[name] || 0) + delta;
  };

  // Helper: avg of all 9 stats
  function _overallAvg(name) {
    const s = pStats(name);
    return (s.physical + s.endurance + s.mental + s.social + s.strategic + s.loyalty + s.boldness + s.intuition + s.temperament) / 9;
  }

  // Track how many events we've fired per tribe to cap at 2-3 per sideline
  const _sl1Count = {};
  tribes.forEach(t => { _sl1Count[t.name] = 0; });

  xt.skydiving.forEach(sky => {
    if (!sky.jumper) return;
    const jumper = sky.jumper;
    const tribe = tribes.find(t => t.name === sky.tribe);
    if (!tribe) return;
    const teammates = tribe.members.filter(m => gs.activePlayers.includes(m) && m !== jumper);
    const jumperPr = pronouns(jumper);

    // ── 1. Injury consequences ────────────────────────────────────────
    if (sky.injured) {
      // 1a. Sympathy — teammate with loyalty >= 6
      const sympathizers = teammates.filter(m => pStats(m).loyalty >= 6);
      if (sympathizers.length > 0 && _sl1Count[sky.tribe] < 3) {
        const sym = _rp(sympathizers);
        const symPr = pronouns(sym);
        addBond(sym, jumper, 0.4);
        sideline1.push({
          type: 'injurySympathy',
          players: [sym, jumper],
          tribe: sky.tribe,
          text: `${sym} doesn't hesitate. ${symPr.Sub} pushes through the crowd of crew members and crouches next to ${jumper}. "You okay? That was insane — but you did it." ${symPr.Sub} stays there until the medics wave ${symPr.obj} off.`,
          badgeText: 'SUPPORT',
          badgeClass: 'gold',
          bondChanges: [{ a: sym, b: jumper, delta: 0.4 }],
        });
        _popAdd(sym, 1); // sympathizer
        _sl1Count[sky.tribe]++;

        // Romance spark from danger bonding
        if (seasonConfig.romance !== 'disabled' && romanticCompat(sym, jumper)) {
          _challengeRomanceSpark(sym, jumper, ep, 'xt-sideline1', {}, {}, 'danger-bonding-injury');
        }
      }

      // 1b. Blame — teammate with loyalty <= 4 OR strategic >= 7 (not already a sympathizer)
      const sympathizerNames = sympathizers.map(m => m);
      const blamers = teammates.filter(m =>
        !sympathizerNames.includes(m) && (pStats(m).loyalty <= 4 || pStats(m).strategic >= 7)
      );
      if (blamers.length > 0 && _sl1Count[sky.tribe] < 3) {
        const blamer = _rp(blamers);
        const blamerPr = pronouns(blamer);
        addBond(blamer, jumper, -0.4);
        sideline1.push({
          type: 'injuryBlame',
          players: [blamer, jumper],
          tribe: sky.tribe,
          text: `${blamer} watches the medics work on ${jumper} and steps back from the group. "That was reckless. Now we might be down a player for the next event." ${blamerPr.Sub} doesn't even lower ${blamerPr.posAdj} voice.`,
          badgeText: 'BLAME',
          badgeClass: 'red',
          bondChanges: [{ a: blamer, b: jumper, delta: -0.4 }],
        });
        _popAdd(blamer, -1); // blamer
        _sl1Count[sky.tribe]++;
      }
    }

    // ── 2. Underdog moment ────────────────────────────────────────────
    // Fires if jumper is low-stat but scored high
    if (_overallAvg(jumper) <= 5 && sky.score >= 7 && _sl1Count[sky.tribe] < 3) {
      teammates.forEach(m => addBond(m, jumper, 0.5));
      sideline1.push({
        type: 'underdogMoment',
        players: [jumper, ...teammates],
        tribe: sky.tribe,
        text: `Nobody had ${jumper} pegged as the one to watch. Then ${jumperPr.sub} posted a ${sky.score}. The whole tribe goes quiet for a second — then loud all at once. ${jumperPr.Sub} earned something today that a score can't fully explain.`,
        badgeText: 'UNDERDOG',
        badgeClass: 'gold',
        bondChanges: teammates.map(m => ({ a: m, b: jumper, delta: 0.5 })),
      });
      _popAdd(jumper, 3); // underdog moment
      _sl1Count[sky.tribe]++;
    }

    // ── 3. Existing showmance moments ─────────────────────────────────
    if (gs.showmances?.length && _sl1Count[sky.tribe] < 3) {
      const relevantShowmances = gs.showmances.filter(sh =>
        sh.players && sh.players.includes(jumper) && gs.activePlayers.includes(sh.players[0]) && gs.activePlayers.includes(sh.players[1])
      );
      relevantShowmances.forEach(sh => {
        if (_sl1Count[sky.tribe] >= 3) return;
        const partner = sh.players.find(p => p !== jumper);
        if (!partner) return;
        const partnerPr = pronouns(partner);

        if (sky.injured) {
          sh.intensity = (sh.intensity || 0) + 0.8;
          addBond(partner, jumper, 0.5);
          const worriedTexts1 = [
            `${partner} goes pale when ${jumper} goes down. ${partnerPr.Sub} doesn't pretend ${partnerPr.sub} isn't scared — ${partnerPr.sub} just goes straight to ${jumperPr.posAdj} side and grabs ${jumperPr.posAdj} hand. Nobody says anything. Nobody needs to.`,
            `${partner} pushes past two producers to get closer. "Let me through — that's — just let me through." ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'don\'t' : 'doesn\'t'} finish the sentence.`,
            `${partner} freezes for exactly one second. Then ${partnerPr.sub} ${partnerPr.sub === 'they' ? 'move' : 'moves'}. Fast. ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'don\'t' : 'doesn\'t'} look back.`,
            `${partner} is already shaking ${partnerPr.posAdj} head. "No no no no no." ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'cover' : 'covers'} ${partnerPr.posAdj} mouth but it doesn't help. Everyone saw that.`,
            `${partner} doesn't say anything. Just stands very still and watches the medics. ${partnerPr.posAdj} jaw is tight. ${partnerPr.posAdj} hands are not.`,
          ];
          sideline1.push({
            type: 'showmanceWorried',
            players: [partner, jumper],
            tribe: sky.tribe,
            text: _rp(worriedTexts1),
            badgeText: 'WORRIED',
            badgeClass: 'pink',
            bondChanges: [{ a: partner, b: jumper, delta: 0.5 }],
          });
          _popAdd(partner, 1); // showmance worry
          _popAdd(jumper, 1);
          _sl1Count[sky.tribe]++;
        } else if (sky.score >= 8) {
          sh.intensity = (sh.intensity || 0) + 0.3;
          const proudTexts = [
            `${partner} can't stop grinning. "${jumper} just — did you SEE that?" ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'clap' : 'claps'} the loudest.`,
            `${partner} exhales like ${partnerPr.sub} ${partnerPr.sub === 'they' ? 'were' : 'was'} holding ${partnerPr.posAdj} breath the whole time. "That's my —" ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'stop' : 'stops'} ${partnerPr.ref}. But everyone heard it.`,
            `${partner} is trying to play it cool. Failing completely. The smile gives everything away.`,
            `${partner} turns to the nearest camera. "That right there? That's what I'm talking about." ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'point' : 'points'} at ${jumper} like ${partnerPr.sub}'s presenting evidence.`,
            `${partner} catches ${jumper}'s eye across the field. No words. Just a nod and a look that says everything.`,
          ];
          sideline1.push({
            type: 'showmanceProud',
            players: [partner, jumper],
            tribe: sky.tribe,
            text: _rp(proudTexts),
            badgeText: 'PROUD',
            badgeClass: 'pink',
            bondChanges: [],
          });
          _popAdd(partner, 1); // showmance proud
          _popAdd(jumper, 1);
          _sl1Count[sky.tribe]++;
        }
      });
    }
  });

  // ── 4. Cross-tribe taunt (compare all tribe sky scores) ──────────────
  // Only fires if there's a meaningful gap in scores between tribes
  if (xt.skydiving.length >= 2) {
    const scored = xt.skydiving.filter(sky => sky.score != null && sky.jumper);
    if (scored.length >= 2) {
      const bestResult  = scored.reduce((a, b) => b.score > a.score ? b : a);
      const worstResult = scored.reduce((a, b) => b.score < a.score ? b : a);
      const scoreDiff   = bestResult.score - worstResult.score;

      if (scoreDiff >= 4 && bestResult.tribe !== worstResult.tribe) {
        const winTribe = tribes.find(t => t.name === bestResult.tribe);
        if (winTribe) {
          const boldMembers = winTribe.members.filter(m =>
            gs.activePlayers.includes(m) && pStats(m).boldness >= 6
          );
          const taunter = boldMembers.length > 0 ? _rp(boldMembers) : _rp(winTribe.members.filter(m => gs.activePlayers.includes(m)));
          if (taunter) {
            const taunterPr = pronouns(taunter);
            const losingMembers = tribes
              .filter(t => t.name !== bestResult.tribe)
              .flatMap(t => t.members.filter(m => gs.activePlayers.includes(m)));
            losingMembers.forEach(m => addBond(taunter, m, -0.3));
            winTribe.members.filter(m => gs.activePlayers.includes(m) && m !== taunter).forEach(m => addBond(taunter, m, 0.2));

            sideline1.push({
              type: 'crossTribeTaunt',
              players: [taunter, ...losingMembers.slice(0, 3)],
              tribe: bestResult.tribe,
              text: `${taunter} can't help ${taunterPr.ref}. ${taunterPr.Sub} strolls past the other tribe's section and says, loud enough for everyone to hear: "Better luck on the moose." ${taunterPr.Sub} walks off grinning. The other tribe is not grinning.`,
              badgeText: 'TAUNT',
              badgeClass: 'red-orange',
              bondChanges: [
                ...losingMembers.map(m => ({ a: taunter, b: m, delta: -0.3 })),
                ...winTribe.members.filter(m => gs.activePlayers.includes(m) && m !== taunter).map(m => ({ a: taunter, b: m, delta: 0.2 })),
              ],
            });
            _popAdd(taunter, -1); // cross-tribe taunt
          }
        }
      }
    }
  }

  // ── 5. Confessional Reactions — each jumper reacts to their own score ──
  xt.skydiving.forEach(sky => {
    if (!sky.jumper) return;
    const _name = sky.jumper;
    const _pr = pronouns(_name);
    let confText;

    // Context-reactive branches — check most specific conditions first
    if (sky.injured) {
      confText = _rp([
        `"${_name}: I can't feel my legs. Is that normal? Someone tell me that's normal."`,
        `"${_name}: I hit the ground and everything just... stopped working correctly. The medic keeps saying I'm fine. I do not feel fine."`,
        `"${_name}: That landing is going to hurt for a week. Worth it? Ask me when I can walk again."`,
        `"${_name}: At least I made it down. That's the bar now. Just — made it down."`,
      ]);
    } else if (sky.jumpDecision === 'pushed' && sky.score >= 7) {
      confText = _rp([
        `"${_name}: I got shoved out of a plane and still stuck the landing. What does that tell you?"`,
        `"${_name}: They pushed me. I hadn't decided yet. And then I just — nailed it. You're welcome, I guess."`,
        `"${_name}: Did not consent to that departure. Will absolutely brag about that score anyway."`,
        `"${_name}: Pushed out of a plane, landed clean. If that doesn't prove something about me, I don't know what does."`,
      ]);
    } else if (sky.jumpDecision === 'pushed' && sky.score <= 4) {
      confText = _rp([
        `"${_name}: They pushed me. I wasn't ready. Of course I crashed."`,
        `"${_name}: I didn't jump. I got launched. There's a difference. And that's why the score looks the way it does."`,
        `"${_name}: Would've been fine if they'd just let me go on my own terms. That's on them."`,
        `"${_name}: Being pushed doesn't exactly put you in the best headspace for a precision landing. Just so everyone knows."`,
      ]);
    } else if (sky.fallQuality <= 0.3) {
      confText = _rp([
        `"${_name}: My chute didn't even open right and I still made it. Adrenaline is a thing."`,
        `"${_name}: I looked up and the canopy was half-twisted. I kicked at it for what felt like forever. Still here though."`,
        `"${_name}: I don't recommend the tangled-chute experience. But I also survived it, so — noted."`,
        `"${_name}: The fall was a disaster. The landing was barely okay. I'm counting the whole thing as a win."`,
      ]);
    } else if (sky.posQuality >= 0.8) {
      confText = _rp([
        `"${_name}: My team had that landing zone LOCKED. I just had to aim."`,
        `"${_name}: The crew did everything right. I just had to not blow it. And I didn't. So — teamwork."`,
        `"${_name}: Honestly the crew deserves half the credit. Maybe more. They were incredible down there."`,
        `"${_name}: When your ground crew is that good, the jump almost feels easy. Almost."`,
      ]);
    } else if (sky.posQuality <= 0.3) {
      confText = _rp([
        `"${_name}: The crew was running around like headless chickens. I was completely on my own up there."`,
        `"${_name}: I looked down and people were facing the wrong direction. Amazing. Really. Top stuff."`,
        `"${_name}: My landing target was basically decorative. I improvised. You saw how that went."`,
        `"${_name}: We need to have a long talk about ground crew positioning. A very long talk."`,
      ]);
    } else if (sky.score >= 8) {
      confText = _rp([
        `"${_name}: I can't believe I did that. My hands are still shaking but in a good way."`,
        `"${_name}: That was the most terrifying thing I've ever done and I want to do it again immediately."`,
        `"${_name}: I stuck the landing. I STUCK IT. I'm going to be insufferable about this for weeks."`,
        `"${_name}: When I touched down, the whole thing just clicked. Like — that's what I'm here for."`,
      ]);
    } else if (sky.score >= 4) {
      confText = _rp([
        `"${_name}: It wasn't perfect but I'm alive. That counts, right?"`,
        `"${_name}: Could've been better. Could've been much worse. I'll take the middle ground and move on."`,
        `"${_name}: Didn't nail it, didn't crater it. Somewhere in the very broad category of 'fine.'"`,
        `"${_name}: I'll be honest — I had no idea what I was doing up there. Still ended up okay."`,
      ]);
    } else {
      confText = _rp([
        `"${_name}: I don't want to talk about it. Just... don't."`,
        `"${_name}: That was bad. I know it was bad. You don't need to tell me it was bad."`,
        `"${_name}: There's a version of this where I landed clean. This was not that version."`,
        `"${_name}: I would like to formally request we never speak of this again."`,
      ]);
    }

    sideline1.push({
      type: 'confessional',
      players: [_name],
      tribe: sky.tribe,
      text: confText,
      badgeText: 'CONFESSIONAL',
      badgeClass: 'blue',
      phase: 'sideline1',
      bondChanges: [],
    });
  });

  // ── 6. Spectator Reaction — non-competitor reacts to best or worst jump ──
  {
    const allSpectators = tribes.flatMap(t =>
      t.members.filter(m =>
        gs.activePlayers.includes(m) &&
        !Object.values(selections[t.name] || {}).includes(m)
      )
    );
    if (allSpectators.length && xt.skydiving.some(sky => sky.jumper)) {
      const spectator = _rp(allSpectators);
      const spr = pronouns(spectator);
      const validSky = xt.skydiving.filter(sky => sky.jumper);
      const bestSky = validSky.reduce((a, b) => a.score > b.score ? a : b);
      const worstSky = validSky.reduce((a, b) => a.score < b.score ? a : b);
      const reactTo = Math.random() < 0.5 ? bestSky : worstSky;
      const reactText = reactTo.score >= 7
        ? `${spectator} watches ${reactTo.jumper} land and ${spr.posAdj} jaw drops. "That was actually incredible."`
        : `${spectator} covers ${spr.posAdj} eyes as ${reactTo.jumper} crashes. "I am NOT doing that."`;
      sideline1.push({
        type: 'spectatorReaction',
        players: [spectator, reactTo.jumper],
        tribe: allSpectators.find(m => tribes.find(t => t.members.includes(m) && t.name === reactTo.tribe)) ? reactTo.tribe : tribes[0].name,
        text: reactText,
        badgeText: 'REACTION',
        badgeClass: 'gold',
        phase: 'sideline1',
        bondChanges: [],
      });
    }
  }

  // ── 7. Strategic Plotting — losing tribe players plot targeting ────────
  {
    const skyRankedSl1 = xt.skydiving
      .filter(s => s.jumper)
      .map(s => ({ tribe: s.tribe, score: (s.score || 0) + (s.crewScore || 0) }))
      .sort((a, b) => a.score - b.score);
    const worstTribeSl1 = skyRankedSl1[0] ? tribes.find(t => t.name === skyRankedSl1[0].tribe) : null;
    if (worstTribeSl1) {
      const strategists = worstTribeSl1.members.filter(m => gs.activePlayers.includes(m) && pStats(m).strategic >= 6);
      if (strategists.length >= 2) {
        const [s1, s2] = strategists.slice(0, 2);
        addBond(s1, s2, 0.2);
        sideline1.push({
          type: 'strategicPlot',
          players: [s1, s2],
          tribe: worstTribeSl1.name,
          text: `${s1} pulls ${s2} aside. "If we go to tribal, we know who's going home, right?" A look passes between them. They both know.`,
          badgeText: 'SCHEMING',
          badgeClass: 'blue',
          phase: 'sideline1',
          bondChanges: [{ a: s1, b: s2, delta: 0.2 }],
        });
      }
    }
  }

  // ── 8. Crowd Energy — winning tribe celebrates ─────────────────────────
  {
    const skyRankedSl1High = xt.skydiving
      .filter(s => s.jumper)
      .map(s => ({ tribe: s.tribe, score: (s.score || 0) + (s.crewScore || 0) }))
      .sort((a, b) => b.score - a.score);
    const bestTribeSl1 = skyRankedSl1High[0] ? tribes.find(t => t.name === skyRankedSl1High[0].tribe) : null;
    if (bestTribeSl1) {
      const cheerers = bestTribeSl1.members.filter(m => gs.activePlayers.includes(m)).slice(0, 3);
      if (cheerers.length >= 2) {
        sideline1.push({
          type: 'crowdEnergy',
          players: cheerers,
          tribe: bestTribeSl1.name,
          text: `${bestTribeSl1.name} erupts. High-fives, chest bumps, screaming. They're in the lead and they know it.`,
          badgeText: 'CROWD',
          badgeClass: 'gold',
          phase: 'sideline1',
          bondChanges: [],
        });
      }
    }
  }

  xt.sidelineEvents.push(...sideline1.map(e => ({ ...e, phase: 'sideline1' })));

  // EVENT 2: RODEO MOOSE RIDING
  const MOOSE_TYPES = ['aggressive', 'lazy', 'chaotic', 'terrified'];

  tribes.forEach(tribe => {
    let riderName = selections[tribe.name]?.moose;

    // Injury replacement: if rider was injured in Event 1, find a substitute
    if (riderName && gs.lingeringInjuries[riderName]) {
      const skyAssigned = selections[tribe.name]?.sky;
      const skiAssigned = selections[tribe.name]?.ski;
      const replacement = tribe.members.find(m =>
        gs.activePlayers.includes(m) &&
        m !== skyAssigned &&
        m !== skiAssigned &&
        !gs.lingeringInjuries[m] &&
        m !== riderName
      );
      if (replacement) {
        selections[tribe.name].moose = replacement;
        riderName = replacement;
      }
    }

    if (!riderName) {
      xt.mooseRiding.push({ tribe: tribe.name, rider: null, score: 0, injured: false });
      xt.tribeScores[tribe.name].moose = 0;
      return;
    }

    const s = pStats(riderName);
    const pr = pronouns(riderName);
    const mooseType = MOOSE_TYPES[Math.floor(Math.random() * MOOSE_TYPES.length)];

    // Context injection from Event 1
    const skyResult = xt.skydiving.find(r => r.tribe === tribe.name);
    let ctxPrefix = '';
    if (skyResult) {
      // Check if this tribe actually had the best sky score
      const bestSky = Math.max(...xt.skydiving.map(s => (s.score || 0) + (s.crewScore || 0)));
      const thisSky = (skyResult.score || 0) + (skyResult.crewScore || 0);
      if (thisSky >= bestSky && skyResult.score >= 8) {
        ctxPrefix = 'Riding the high from the skydiving round, ';
      } else if (skyResult.injured) {
        ctxPrefix = "With their skydiver in a body cast, the pressure's on. ";
      } else if (thisSky <= Math.min(...xt.skydiving.map(s => (s.score || 0) + (s.crewScore || 0)))) {
        ctxPrefix = 'After a rough skydiving round, ';
      } else if (skyResult.score <= 3) {
        ctxPrefix = 'Still rattled from the skydiving disaster, ';
      }
    }

    // 4a. Approach
    const boldTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
    const approachText = ctxPrefix + _rp(XT_MOOSE_APPROACH[boldTier])(riderName, pr, mooseType);

    // 4b. Mount
    const mountChance = s.physical * 0.07 + s.boldness * 0.03 + 0.30;
    const mounted = Math.random() < mountChance;
    const mountText = mounted
      ? _rp(XT_MOOSE_MOUNT.success)(riderName, pr)
      : _rp(XT_MOOSE_MOUNT.fail)(riderName, pr);

    // 4c. Ride
    const roundTexts = [];
    let roundsSurvived = 0;
    let thrownRound = 0;

    if (mounted) {
      for (let round = 1; round <= 5; round++) {
        let mooseMod = 0;
        if (mooseType === 'aggressive') mooseMod = -0.10;
        else if (mooseType === 'lazy') mooseMod = 0.05;
        else if (mooseType === 'chaotic') mooseMod = (Math.random() - 0.5) * 0.16;
        else if (mooseType === 'terrified' && round === 1) mooseMod = -0.15;

        // 10% chance per round of moose doing something wild
        const mooseChaos = Math.random() < 0.10 ? -0.12 : 0;
        const stayChance = s.endurance * 0.07 + s.physical * 0.03 + 0.15 - (round * 0.08) + mooseMod + mooseChaos;

        if (Math.random() < stayChance) {
          roundsSurvived = round;
          roundTexts.push(_rp(XT_MOOSE_BUCK.hold)(riderName, pr, round));
        } else {
          thrownRound = round;
          roundTexts.push(_rp(XT_MOOSE_BUCK.thrown)(riderName, pr, round));
          break;
        }
      }
    }

    // 4d. Dismount
    let dismountType, dismountLocation = null, dismountText;
    if (!mounted) {
      dismountType = 'failedMount';
      dismountText = null;
    } else if (roundsSurvived >= 5) {
      dismountType = 'graceful';
      dismountText = _rp(XT_MOOSE_DISMOUNT.graceful)(riderName, pr);
    } else {
      dismountType = 'thrown';
      const locationFn = XT_MOOSE_DISMOUNT_LOCATION[Math.floor(Math.random() * XT_MOOSE_DISMOUNT_LOCATION.length)];
      dismountLocation = locationFn(riderName);
      dismountText = _rp(XT_MOOSE_DISMOUNT.thrown)(riderName, pr, dismountLocation);
    }

    // Score
    const score = Math.min(10, roundsSurvived * 2 + (roundsSurvived >= 5 ? 1 : 0));

    // Injury check — only if thrown
    let injured = false;
    if (dismountType === 'thrown') {
      const injChance = thrownRound <= 2
        ? 0.12 + (10 - s.endurance) * 0.03
        : 0.06 + (10 - s.endurance) * 0.02;
      if (Math.random() < injChance) {
        injured = true;
        gs.lingeringInjuries[riderName] = {
          ep: epNum,
          duration: 2 + Math.floor(Math.random() * 2),
          penalty: 1.0 + Math.random() * 0.8,
          type: 'moose-thrown',
        };
      }
    }

    xt.tribeScores[tribe.name].moose = score;
    if (seasonConfig.popularityEnabled !== false) {
      if (!gs.popularity) gs.popularity = {};
      if (score >= 8) gs.popularity[riderName] = (gs.popularity[riderName] || 0) + 2; // great ride
      if (roundsSurvived >= 5) gs.popularity[riderName] = (gs.popularity[riderName] || 0) + 1; // held all 5
      if (injured) gs.popularity[riderName] = (gs.popularity[riderName] || 0) + 2; // injury sympathy
      if (dismountType === 'thrown' && dismountLocation) gs.popularity[riderName] = (gs.popularity[riderName] || 0) + 1; // comedy
    }
    xt.mooseRiding.push({
      tribe: tribe.name,
      rider: riderName,
      moosePersonality: mooseType,
      mounted,
      roundsSurvived,
      dismountType,
      dismountLocation,
      score,
      injured,
      text: {
        approach: approachText,
        mount: mountText,
        rounds: roundTexts,
        dismount: dismountText,
      },
    });
  });

  // ── SIDELINE SOCIAL 2 (between Moose Riding and Mud Skiing) ──────────
  // Social events that fire while tribes regroup after the moose event.
  // Consequences: comedy bonds, trauma comfort, pressure talks, desperation pacts, showmance rallies/arguments.
  const sideline2 = [];

  // Track per-tribe event count (cap at 2-3)
  const _sl2Count = {};
  tribes.forEach(t => { _sl2Count[t.name] = 0; });

  // ── Per-tribe moose result events ─────────────────────────────────────
  xt.mooseRiding.forEach(moose => {
    if (!moose.rider) return;
    const rider = moose.rider;
    const tribe = tribes.find(t => t.name === moose.tribe);
    if (!tribe) return;
    const teammates = tribe.members.filter(m => gs.activePlayers.includes(m) && m !== rider);
    const riderPr = pronouns(rider);

    // ── 1. Comedy Bond — thrown rider + social teammates ─────────────────
    if (moose.dismountType === 'thrown' && moose.dismountLocation && _sl2Count[moose.tribe] < 3) {
      const socialTeammates = teammates.filter(m => pStats(m).social >= 6);
      if (socialTeammates.length > 0) {
        // Pick up to 2 laughers
        const shuffled = [...socialTeammates].sort(() => Math.random() - 0.5);
        const laughers = shuffled.slice(0, Math.min(2, shuffled.length));
        laughers.forEach(l => addBond(l, rider, 0.4));
        const laugher1 = laughers[0];
        const laugher1Pr = pronouns(laugher1);
        const locationText = moose.dismountLocation;
        sideline2.push({
          type: 'comedyBond',
          players: [rider, ...laughers],
          tribe: moose.tribe,
          text: `When ${rider} lands in ${locationText}, the whole tribe loses it. ${laugher1} is doubled over, tears streaming. "${riderPr.Sub} was FLYING," ${laugher1} manages between gasps. ${rider} picks ${riderPr.ref} up and starts laughing too. Hard to stay tense after that.`,
          badgeText: 'COMEDY',
          badgeClass: 'gold',
          bondChanges: laughers.map(l => ({ a: l, b: rider, delta: 0.4 })),
        });
        _popAdd(rider, 1); // comedy moment
        _sl2Count[moose.tribe]++;
      }
    }

    // ── 2. Moose Trauma Comfort — terrified rider + loyal teammate ────────
    if (pStats(rider).boldness <= 3 && _sl2Count[moose.tribe] < 3) {
      const loyalTeammates = teammates.filter(m => pStats(m).loyalty >= 6);
      if (loyalTeammates.length > 0) {
        const comforter = loyalTeammates[Math.floor(Math.random() * loyalTeammates.length)];
        const comforterPr = pronouns(comforter);
        addBond(comforter, rider, 0.5);
        const sparkFired = seasonConfig.romance !== 'disabled' && romanticCompat(comforter, rider);
        if (sparkFired) {
          _challengeRomanceSpark(comforter, rider, ep, 'xt-sideline2', {}, {}, 'protective-comfort');
        }
        sideline2.push({
          type: 'mooseTraumaComfort',
          players: [comforter, rider],
          tribe: moose.tribe,
          text: `${rider} is still shaking a little when ${comforter} finds ${riderPr.obj}. ${comforterPr.Sub} doesn't make a big deal of it — just sits down next to ${riderPr.obj} and says, "You did good. It was awful, and you did it anyway." ${rider} doesn't say much. ${riderPr.Sub} doesn't have to.`,
          badgeText: 'COMFORT',
          badgeClass: 'pink',
          bondChanges: [{ a: comforter, b: rider, delta: 0.5 }],
        });
        _sl2Count[moose.tribe]++;
      }
    }

    // ── 3. Injury events — same pattern as sideline 1 ────────────────────
    if (moose.injured && _sl2Count[moose.tribe] < 3) {
      // 3a. Sympathy
      const sympathizers = teammates.filter(m => pStats(m).loyalty >= 6);
      if (sympathizers.length > 0) {
        const sym = sympathizers[Math.floor(Math.random() * sympathizers.length)];
        const symPr = pronouns(sym);
        addBond(sym, rider, 0.4);
        sideline2.push({
          type: 'mooseInjurySympathy',
          players: [sym, rider],
          tribe: moose.tribe,
          text: `The medics are already moving when ${sym} gets there first. ${symPr.Sub} kneels down, checks on ${rider}, keeps ${symPr.posAdj} voice steady even though ${symPr.sub} can see ${symPr.sub} is worried. "We've got you," ${symPr.sub} says. "Don't move yet."`,
          badgeText: 'SUPPORT',
          badgeClass: 'gold',
          bondChanges: [{ a: sym, b: rider, delta: 0.4 }],
        });
        _popAdd(sym, 1); // sympathizer
        _sl2Count[moose.tribe]++;
        if (seasonConfig.romance !== 'disabled' && romanticCompat(sym, rider)) {
          _challengeRomanceSpark(sym, rider, ep, 'xt-sideline2', {}, {}, 'danger-bonding-injury');
        }
      }

      // 3b. Blame
      if (_sl2Count[moose.tribe] < 3) {
        const blamers = teammates.filter(m => pStats(m).loyalty <= 4 || pStats(m).strategic >= 7);
        if (blamers.length > 0) {
          const blamer = blamers[Math.floor(Math.random() * blamers.length)];
          const blamerPr = pronouns(blamer);
          addBond(blamer, rider, -0.4);
          sideline2.push({
            type: 'mooseInjuryBlame',
            players: [blamer, rider],
            tribe: moose.tribe,
            text: `${blamer} pulls back from the group around ${rider}, arms crossed. "That's going to affect our score." ${blamerPr.Sub} says it to no one in particular, which somehow makes it worse. The others hear it. They just don't say anything back.`,
            badgeText: 'BLAME',
            badgeClass: 'red',
            bondChanges: [{ a: blamer, b: rider, delta: -0.4 }],
          });
          _popAdd(blamer, -1); // blamer
          _sl2Count[moose.tribe]++;
        }
      }
    }

    // ── 4. Showmance moments ──────────────────────────────────────────────
    if (gs.showmances?.length && _sl2Count[moose.tribe] < 3) {
      const relevantShowmances = gs.showmances.filter(sh =>
        sh.players && sh.players.includes(rider) &&
        gs.activePlayers.includes(sh.players[0]) && gs.activePlayers.includes(sh.players[1])
      );
      relevantShowmances.forEach(sh => {
        if (_sl2Count[moose.tribe] >= 3) return;
        const partner = sh.players.find(p => p !== rider);
        if (!partner) return;
        const partnerPr = pronouns(partner);
        if (moose.injured) {
          sh.intensity = (sh.intensity || 0) + 0.8;
          addBond(partner, rider, 0.5);
          const worriedTexts2 = [
            `${partner} is at ${riderPr.posAdj} side before anyone else reacts. ${partnerPr.Sub} doesn't care who sees it — ${partnerPr.sub} grabs ${riderPr.posAdj} hand and doesn't let go until the medics tell ${partnerPr.obj} to step back. ${partnerPr.Sub} steps back exactly one inch.`,
            `${partner} pushes through the crowd without a word. ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'drop' : 'drops'} to ${partnerPr.posAdj} knees next to ${rider} and just — stays there. The medics work around ${partnerPr.obj}.`,
            `${partner} freezes for exactly one second. Then ${partnerPr.sub} ${partnerPr.sub === 'they' ? 'move' : 'moves'}. Fast. ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'don\'t' : 'doesn\'t'} look back.`,
            `${partner} is already shaking ${partnerPr.posAdj} head. "No no no no no." ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'cover' : 'covers'} ${partnerPr.posAdj} mouth but it doesn't help. Everyone saw that.`,
            `${partner} doesn't say anything. Just stands very still and watches the medics work. ${partnerPr.posAdj} jaw is tight. ${partnerPr.posAdj} hands are not.`,
          ];
          sideline2.push({
            type: 'showmanceWorried',
            players: [partner, rider],
            tribe: moose.tribe,
            text: _rp(worriedTexts2),
            badgeText: 'WORRIED',
            badgeClass: 'pink',
            bondChanges: [{ a: partner, b: rider, delta: 0.5 }],
          });
          _popAdd(partner, 1); // showmance worry
          _popAdd(rider, 1);
          _sl2Count[moose.tribe]++;
        } else if (moose.score >= 6) {
          sh.intensity = (sh.intensity || 0) + 0.3;
          const proudTexts2 = [
            `${partner} is clapping the loudest, and ${partnerPr.sub} knows it. ${riderPr.Sub} catches ${partnerPr.posAdj} eye across the arena and for a second everything else goes quiet. Just for a second.`,
            `${partner} exhales like ${partnerPr.sub} ${partnerPr.sub === 'they' ? 'were' : 'was'} holding ${partnerPr.posAdj} breath the whole time. "That's my —" ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'stop' : 'stops'} ${partnerPr.ref}. But everyone heard it.`,
            `${partner} is trying to play it cool. Failing completely. The smile gives everything away.`,
            `${partner} turns to the nearest camera. "That right there? That's what I'm talking about." ${partnerPr.Sub} ${partnerPr.sub === 'they' ? 'point' : 'points'} at ${rider} like ${partnerPr.sub}'s presenting evidence.`,
            `${partner} catches ${rider}'s eye from the sideline. No words. Just a nod and a look that says everything.`,
          ];
          sideline2.push({
            type: 'showmanceProud',
            players: [partner, rider],
            tribe: moose.tribe,
            text: _rp(proudTexts2),
            badgeText: 'PROUD',
            badgeClass: 'pink',
            bondChanges: [],
          });
          _popAdd(partner, 1); // showmance proud
          _popAdd(rider, 1);
          _sl2Count[moose.tribe]++;
        }
      });
    }
  });

  // ── Accumulated pressure events (across all tribes) ───────────────────

  // Compute combined sky + moose scores per tribe for comparison
  const _combinedScores = {};
  tribes.forEach(t => {
    _combinedScores[t.name] = (xt.tribeScores[t.name]?.sky || 0) + (xt.tribeScores[t.name]?.moose || 0);
  });

  // Find tribe with lowest combined score (the one in trouble)
  const _sortedByScore = tribes.slice().sort((a, b) => _combinedScores[a.name] - _combinedScores[b.name]);
  const _lowestTribe = _sortedByScore[0];

  // Also find which tribe had lowest moose score specifically
  const _mooseScores = {};
  xt.mooseRiding.forEach(m => { if (m.rider) _mooseScores[m.tribe] = m.score || 0; });
  const _lowestMooseTribeName = Object.entries(_mooseScores).sort(([,a],[,b]) => a - b)[0]?.[0];

  // ── 5. Pressure Talk — strategist confronts skier on lowest-scoring tribe ──
  if (_lowestTribe) {
    const tName = _lowestTribe.name;
    const members = _lowestTribe.members.filter(m => gs.activePlayers.includes(m));
    const strategist = members.find(m => pStats(m).strategic >= 7);
    const skier = selections[tName]?.ski;
    if (strategist && skier && strategist !== skier) {
      addBond(skier, strategist, -0.3);
      selections[tName].skiPressured = true;
      const stratPr = pronouns(strategist);
      const skierPr = pronouns(skier);
      sideline2.push({
        type: 'pressureTalk',
        players: [strategist, skier],
        tribe: tName,
        text: `${strategist} pulls ${skier} aside before anyone else can get to ${skierPr.obj}. ${stratPr.Sub} doesn't raise ${stratPr.posAdj} voice. ${stratPr.Sub} doesn't need to. "We're in last. You know that, right? This ski run — that's it. That's everything we have left." ${skier} holds ${skierPr.posAdj} gaze. Neither of them blinks. The conversation ends when ${stratPr.sub} walks away.`,
        badgeText: 'PRESSURE',
        badgeClass: 'red-orange',
        bondChanges: [{ a: skier, b: strategist, delta: -0.3 }],
      });
    }
  }

  // ── 6. Desperation Pact — tribe that lost BOTH events rallies two non-allied players ──
  // A tribe "lost both" if it has the lowest sky score AND lowest moose score
  const _skyScores = {};
  xt.skydiving.forEach(s => { if (s.jumper) _skyScores[s.tribe] = s.score || 0; });
  const _lowestSkyTribeName = Object.entries(_skyScores).sort(([,a],[,b]) => a - b)[0]?.[0];

  if (_lowestSkyTribeName && _lowestMooseTribeName && _lowestSkyTribeName === _lowestMooseTribeName) {
    const pactTribe = tribes.find(t => t.name === _lowestSkyTribeName);
    if (pactTribe) {
      const pactMembers = pactTribe.members.filter(m => gs.activePlayers.includes(m));
      // Find 2 non-allied players on that tribe
      const pactCandidates = pactMembers.filter((m, _, arr) => {
        return !arr.some(other => other !== m && (gs.namedAlliances || []).some(al =>
          al.active && al.members.includes(m) && al.members.includes(other)
        ));
      });
      if (pactCandidates.length >= 2) {
        const shuffledPact = [...pactCandidates].sort(() => Math.random() - 0.5);
        const [pA, pB] = shuffledPact;
        addBond(pA, pB, 0.3);
        const paPr = pronouns(pA);
        const pBPr = pronouns(pB);
        sideline2.push({
          type: 'desperationPact',
          players: [pA, pB],
          tribe: pactTribe.name,
          text: `Two events. Two last places. ${pA} and ${pB} end up at the edge of the course, not really talking at first — just watching the other tribes celebrate. Then ${pA} says, "It doesn't end here." ${paPr.Sub} looks at ${pB}. ${pBPr.Sub} looks back. Something solidifies between them that didn't exist twenty minutes ago.`,
          badgeText: 'PACT',
          badgeClass: 'blue',
          bondChanges: [{ a: pA, b: pB, delta: 0.3 }],
        });
      }
    }
  }

  // ── 7. Showmance Rally — partner cheers on upcoming ski competitor ────
  if (gs.showmances?.length) {
    gs.showmances.forEach(sh => {
      if (!sh.players || sh.players.length < 2) return;
      if (!gs.activePlayers.includes(sh.players[0]) || !gs.activePlayers.includes(sh.players[1])) return;
      const [sA, sB] = sh.players;
      tribes.forEach(tribe => {
        const skiName = selections[tribe.name]?.ski;
        if (!skiName) return;
        // One partner is the ski competitor
        const competitor = sA === skiName ? sA : sB === skiName ? sB : null;
        if (!competitor) return;
        const supporter = competitor === sA ? sB : sA;
        // Both must be on the same tribe
        if (!tribe.members.includes(competitor) || !tribe.members.includes(supporter)) return;
        sh.intensity = (sh.intensity || 0) + 0.4;
        selections[tribe.name].skiMotivated = true;
        const supporterPr = pronouns(supporter);
        const competitorPr = pronouns(competitor);
        sideline2.push({
          type: 'showmanceRally',
          players: [supporter, competitor],
          tribe: tribe.name,
          text: `${supporter} finds ${competitor} before the ski run starts. ${supporterPr.Sub} doesn't make a speech — ${supporterPr.sub} just holds ${competitorPr.posAdj} face for a moment and says, "I've got you when you get back. Go win it." ${competitor} exhales. Something in ${competitorPr.posAdj} shoulders drops. ${competitorPr.Sub} looks ready.`,
          badgeText: 'RALLY',
          badgeClass: 'pink',
          bondChanges: [],
        });
      });
    });
  }

  // ── 8. Showmance Argument — poor moose score + strategic partner ──────
  if (gs.showmances?.length) {
    gs.showmances.forEach(sh => {
      if (!sh.players || sh.players.length < 2) return;
      if (!gs.activePlayers.includes(sh.players[0]) || !gs.activePlayers.includes(sh.players[1])) return;
      const [sA, sB] = sh.players;
      xt.mooseRiding.forEach(moose => {
        if (!moose.rider) return;
        if (moose.score > 3) return;
        // One partner just rode the moose poorly
        const badRider = sA === moose.rider ? sA : sB === moose.rider ? sB : null;
        if (!badRider) return;
        const criticalPartner = badRider === sA ? sB : sA;
        if (pStats(criticalPartner).strategic < 6) return;
        // Don't double-fire a RALLY and ARGUMENT for the same showmance in same sideline
        if (selections[moose.tribe]?.skiMotivated && criticalPartner === selections[moose.tribe]?.ski) return;
        sh.intensity = Math.max(0, (sh.intensity || 0) - 0.6);
        const criticalPr = pronouns(criticalPartner);
        const badRiderPr = pronouns(badRider);
        sideline2.push({
          type: 'showmanceArgument',
          players: [criticalPartner, badRider],
          tribe: moose.tribe,
          text: `${criticalPartner} doesn't blow up. That would almost be better. Instead ${criticalPr.sub} goes quiet in that particular way — the one that means ${criticalPr.sub} is doing the math. "A ${moose.score}," ${criticalPr.sub} says eventually. Just that. ${badRider} bristles. "I know what I got." The silence after that is the loudest thing in the staging area.`,
          badgeText: 'ARGUMENT',
          badgeClass: 'pink',
          bondChanges: [],
        });
      });
    });
  }

  // ── 9. Confessional Reactions — each moose rider reacts to their score ──
  xt.mooseRiding.forEach(moose => {
    if (!moose.rider) return;
    const _mName = moose.rider;
    const _mPr = pronouns(_mName);
    let confText;

    // Context-reactive — most specific first
    if (moose.injured) {
      confText = _rp([
        `"${_mName}: I got thrown by a moose and now I'm wondering what's still attached. Great day."`,
        `"${_mName}: The moose won. Let's be honest. The moose absolutely won. And I paid for it."`,
        `"${_mName}: Something in my shoulder is making a sound it wasn't making before. I'm choosing not to investigate."`,
        `"${_mName}: Medic keeps asking where it hurts. Everywhere. It hurts everywhere."`,
      ]);
    } else if (moose.moosePersonality === 'aggressive' && moose.score <= 4) {
      confText = _rp([
        `"${_mName}: That moose was INSANE. It came out of the gate like it had a grudge against me specifically."`,
        `"${_mName}: I've never been that angry at an animal before. I am now."`,
        `"${_mName}: They called it 'aggressive.' That was an understatement. That thing was unhinged."`,
        `"${_mName}: I lasted two rounds against a moose that clearly wanted to commit a crime. I'm fine with that."`,
      ]);
    } else if (moose.moosePersonality === 'lazy' && moose.score <= 4) {
      confText = _rp([
        `"${_mName}: The moose barely moved and I STILL fell off. I'm not going to think about what that means."`,
        `"${_mName}: It was barely even trying. That somehow makes it worse."`,
        `"${_mName}: A lazy moose took me out. A LAZY one. Let's just move on."`,
        `"${_mName}: The moose looked bored. Bored! And it still got rid of me. What does that say about me."`,
      ]);
    } else if (moose.roundsSurvived >= 5) {
      confText = _rp([
        `"${_mName}: Five rounds! FIVE! I rode that moose until IT gave up. Me!"`,
        `"${_mName}: I have no idea where that came from. My thighs are destroyed but I went five rounds."`,
        `"${_mName}: Every single round I thought — okay, this is the one that gets me. It never was."`,
        `"${_mName}: The moose tried everything. Bucks, rears, the full-body thing. Couldn't shake me."`,
      ]);
    } else if (moose.dismountType === 'thrown' && moose.dismountLocation) {
      confText = _rp([
        `"${_mName}: I landed in ${moose.dismountLocation}. I can still smell it."`,
        `"${_mName}: The actual landing spot — ${moose.dismountLocation} — was not in any way what I expected."`,
        `"${_mName}: Flew off a moose, ended up in ${moose.dismountLocation}. This is what I signed up for apparently."`,
        `"${_mName}: ${moose.dismountLocation}. I ended up in ${moose.dismountLocation}. This show is something else."`,
      ]);
    } else if (moose.score >= 8) {
      confText = _rp([
        `"${_mName}: I have no idea how I stayed on that thing. My legs are jelly. But we got the points."`,
        `"${_mName}: That moose and I reached an understanding somewhere around round three. I'm choosing to believe that."`,
        `"${_mName}: Rode a moose today. Stayed on. Scored big. I need to lie down and also I feel amazing."`,
        `"${_mName}: Every time it bucked I just thought — not yet. Not yet. Not yet. And eventually — done."`,
      ]);
    } else if (moose.score >= 4) {
      confText = _rp([
        `"${_mName}: Somewhere between 'fine' and 'disaster.' I'll take it."`,
        `"${_mName}: Not my best showing. Not my worst. The moose was... a presence."`,
        `"${_mName}: I stayed on longer than I thought I would and shorter than I needed to. That's the summary."`,
        `"${_mName}: The moose and I had a complicated relationship for about thirty seconds."`,
      ]);
    } else {
      confText = _rp([
        `"${_mName}: That moose had a personal problem with me specifically. I'm convinced."`,
        `"${_mName}: I lasted two seconds. Maybe three. The moose barely noticed I was there."`,
        `"${_mName}: Zero preparation could have helped me with that. Zero."`,
        `"${_mName}: I saw the moose. The moose saw me. We both knew how this was going to go."`,
      ]);
    }

    sideline2.push({
      type: 'confessional',
      players: [_mName],
      tribe: moose.tribe,
      text: confText,
      badgeText: 'CONFESSIONAL',
      badgeClass: 'blue',
      phase: 'sideline2',
      bondChanges: [],
    });
  });

  // ── 10. Spectator Reaction — non-competitor reacts to funniest dismount ──
  {
    const allSpectatorsSl2 = tribes.flatMap(t =>
      t.members.filter(m =>
        gs.activePlayers.includes(m) &&
        !Object.values(selections[t.name] || {}).includes(m)
      )
    );
    const thrownRiders = xt.mooseRiding.filter(m => m.rider && m.dismountType === 'thrown' && m.dismountLocation);
    if (allSpectatorsSl2.length && thrownRiders.length) {
      const spectatorSl2 = _rp(allSpectatorsSl2);
      const sprSl2 = pronouns(spectatorSl2);
      const funniest = _rp(thrownRiders);
      const funnierPr = pronouns(funniest.rider);
      sideline2.push({
        type: 'spectatorReaction',
        players: [spectatorSl2, funniest.rider],
        tribe: funniest.tribe,
        text: `${spectatorSl2} is still replaying it. "Did you SEE where ${funniest.rider} landed?" ${sprSl2.Sub} can barely get the words out. "I've never seen anyone go that far sideways in my life."`,
        badgeText: 'REACTION',
        badgeClass: 'gold',
        phase: 'sideline2',
        bondChanges: [],
      });
    }
  }

  // ── 11. Strategic Plotting — tribe falling behind after 2 events ──────
  {
    const trailingSl2 = tribes.slice().sort((a, b) =>
      (_combinedScores[a.name] || 0) - (_combinedScores[b.name] || 0)
    )[0];
    if (trailingSl2) {
      const strategistsSl2 = trailingSl2.members.filter(m => gs.activePlayers.includes(m) && pStats(m).strategic >= 6);
      if (strategistsSl2.length >= 2) {
        const [sq1, sq2] = strategistsSl2.slice(0, 2);
        addBond(sq1, sq2, 0.2);
        sideline2.push({
          type: 'strategicPlot',
          players: [sq1, sq2],
          tribe: trailingSl2.name,
          text: `${sq1} and ${sq2} hang back while the others talk about the ski assignments. "We're down two events," ${sq1} says, just quiet enough. "Whoever we send up for skiing — they carry all of it." A beat. "And if it still doesn't work..." ${sq2} doesn't need to finish the sentence.`,
          badgeText: 'SCHEMING',
          badgeClass: 'blue',
          phase: 'sideline2',
          bondChanges: [{ a: sq1, b: sq2, delta: 0.2 }],
        });
      }
    }
  }

  // ── 12. Crowd Energy — tribe leading after 2 events celebrates ────────
  {
    const leadingTribeSl2 = tribes.slice().sort((a, b) =>
      (_combinedScores[b.name] || 0) - (_combinedScores[a.name] || 0)
    )[0];
    if (leadingTribeSl2) {
      const cheerersSl2 = leadingTribeSl2.members.filter(m => gs.activePlayers.includes(m)).slice(0, 3);
      if (cheerersSl2.length >= 2) {
        sideline2.push({
          type: 'crowdEnergy',
          players: cheerersSl2,
          tribe: leadingTribeSl2.name,
          text: `${leadingTribeSl2.name} is riding a wave. After two events, they're in front, and the energy shows — loud, loose, confident. The kind of vibe that makes the other tribe nervous.`,
          badgeText: 'CROWD',
          badgeClass: 'gold',
          phase: 'sideline2',
          bondChanges: [],
        });
      }
    }
  }

  xt.sidelineEvents.push(...sideline2.map(e => ({ ...e, phase: 'sideline2' })));

  // EVENT 3: MUD SKIING ───────────────────────────────────────────────────

  // ── Phase 6: Driver Assignment ──
  // With 2 tribes: A drives B, B drives A.
  // With 3 tribes: A drives B, B drives C, C drives A.
  const tribeNames = tribes.map(t => t.name);
  const driverAssignments = {}; // { tribeName: { skier, driver, driverTribe, driverTribeName, saboIntent } }

  tribes.forEach((tribe, idx) => {
    const skier = selections[tribe.name]?.ski;
    if (!skier) {
      driverAssignments[tribe.name] = null;
      return;
    }

    // Opposing tribe is the one at index (idx + 1) % length
    const opposingIdx = (idx + 1) % tribes.length;
    const opposingTribe = tribes[opposingIdx];

    // Pick a driver from the opposing tribe — most strategic non-ski player available
    const opposingMembers = opposingTribe.members.filter(m =>
      gs.activePlayers.includes(m) &&
      m !== selections[opposingTribe.name]?.sky &&
      m !== selections[opposingTribe.name]?.moose &&
      m !== selections[opposingTribe.name]?.ski
    );
    // If no non-event member available, fall back to any active member
    const driverPool = opposingMembers.length > 0
      ? opposingMembers
      : opposingTribe.members.filter(m => gs.activePlayers.includes(m));

    if (!driverPool.length) {
      driverAssignments[tribe.name] = null;
      return;
    }

    // Pick most strategic driver
    const driver = driverPool.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];

    const driverStats = pStats(driver);
    const driverArch = players.find(p => p.name === driver)?.archetype || '';
    const isVillain = driverArch === 'villain' || driverArch === 'mastermind';
    const isCompetitive = driverArch === 'hero' || driverArch === 'physical' || driverArch === 'hothead';
    const driverBond = getPerceivedBond(driver, skier);
    // Desperation: driver's tribe is losing — more motivation to sabotage
    const driverTribeScore = (xt.tribeScores[opposingTribe.name]?.sky || 0) + (xt.tribeScores[opposingTribe.name]?.moose || 0);
    const bestScore = Math.max(...tribes.map(t => (xt.tribeScores[t.name]?.sky || 0) + (xt.tribeScores[t.name]?.moose || 0)));
    const isDesperateDriver = driverTribeScore < bestScore - 3; // trailing by 3+ points
    const rawSaboIntent =
      driverStats.strategic * 0.05 +
      (10 - driverStats.loyalty) * 0.03 +
      driverStats.boldness * 0.02 +
      (driverBond < -2 ? 0.15 : driverBond < 0 ? 0.05 : -driverBond * 0.02) +
      (isVillain ? 0.15 : 0) +
      (isCompetitive && isDesperateDriver ? 0.12 : 0) +
      (isDesperateDriver ? 0.08 : 0);
    const saboIntent = Math.max(0, Math.min(1, rawSaboIntent));

    // Confessional text — inline, unique moments
    const driverPr = pronouns(driver);
    const skierPr = pronouns(skier);
    // driverArch already declared above in sabotage formula
    // Driver confessional — varies by sabotage intent + archetype
    let driverConfText;
    if (saboIntent > 0.5) {
      driverConfText = _rp([
        `${driver} [confessional]: "They handed me the wheel and told me to drive straight. I plan to drive straight — into their score."`,
        `${driver} [confessional]: "I'm not here to help ${skier}. If I can mess with their run, I'm doing it. That's the game."`,
        `${driver} [confessional]: "Everyone acts like the driver is just a chauffeur. No. The driver is the person who decides if you eat dirt."`,
        `${driver} [confessional]: "I don't owe ${skier} anything. I owe MY tribe a win. And if ${skier} has to crash for that — oh well."`,
        `${driver} [confessional]: "The moment they said I'd be driving ${skier}? I started planning. Sorry. Not sorry."`,
      ]);
    } else if (saboIntent > 0.25) {
      driverConfText = _rp([
        `${driver} [confessional]: "I'll play it straight. Mostly. But if an opportunity opens up — I'm taking it."`,
        `${driver} [confessional]: "I'm not going out of my way to crash ${skier}. But I'm also not going out of my way to help."`,
        `${driver} [confessional]: "Clean driving. Professional. Unless ${skier} does something that annoys me. Then all bets are off."`,
        `${driver} [confessional]: "I keep it fair. I keep it smooth. Unless we're losing — then I keep it interesting."`,
        `${driver} [confessional]: "Honestly? I'll probably drive straight. Probably. No promises about the turns though."`,
      ]);
    } else {
      driverConfText = _rp([
        `${driver} [confessional]: "I drive, ${skier} skis. No drama. I'm not risking our tribe's reputation for a cheap move."`,
        `${driver} [confessional]: "I'm not a saboteur. I'll give ${skier} a fair ride and let the skiing do the talking."`,
        `${driver} [confessional]: "Straight line, steady speed. ${skier} gets a clean run. What ${driverPr.sub} ${driverPr.sub === 'they' ? 'do' : 'does'} with it is on ${driverPr.obj}."`,
        `${driver} [confessional]: "I've got no beef with ${skier}. Clean driving. Let the best tribe win."`,
        `${driver} [confessional]: "My job is to drive. Not to crash. Not to swerve. Just drive. ${skier} can handle the rest."`,
      ]);
    }

    // Skier confessional — varies by perceived sabotage risk + bond with driver
    const skierBond = getBond(skier, driver);
    let skierConfText;
    if (saboIntent > 0.5) {
      skierConfText = _rp([
        `${skier} [confessional]: "I saw the way ${driver} looked at me. I already know something's coming. I just have to survive it."`,
        `${skier} [confessional]: "${driver} is driving me. That's... not ideal. I'm gripping the rope extra tight."`,
        `${skier} [confessional]: "I trust ${driver} about as far as I can throw this jet ski. So — zero trust. Eyes open."`,
        `${skier} [confessional]: "Everyone keeps saying 'good luck' and I can tell they mean it. That's how worried they are about ${driver} driving."`,
        `${skier} [confessional]: "If ${driver} crashes me, I'm coming back for round two. In the game. And in life."`,
      ]);
    } else if (skierBond >= 3) {
      skierConfText = _rp([
        `${skier} [confessional]: "${driver}'s driving me. Honestly? I trust ${driverPr.obj}. We're good."`,
        `${skier} [confessional]: "I'm weirdly calm about this. ${driver}'s solid. I just need to focus on the flags."`,
        `${skier} [confessional]: "Of all the drivers I could've gotten — ${driver}'s not bad. We've got a thing. An understanding."`,
      ]);
    } else {
      skierConfText = _rp([
        `${skier} [confessional]: "The driver controls the speed, the line, everything. I just have to react. And hope."`,
        `${skier} [confessional]: "${driver}'s driving. I don't know what to expect. Just grab the flags and stay upright."`,
        `${skier} [confessional]: "Five flags, one course, and someone else at the wheel. All I can control is my grip."`,
        `${skier} [confessional]: "I've been practicing my balance all morning. The mud is gonna be brutal regardless of who's driving."`,
        `${skier} [confessional]: "Whatever happens out there — at least I know I gave it everything. The driver part is just luck."`,
      ]);
    }

    driverAssignments[tribe.name] = {
      skier,
      driver,
      driverTribe: opposingTribe,
      driverTribeName: opposingTribe.name,
      saboIntent,
      driverConfText,
      skierConfText,
    };
  });

  // ── Phase 7: Mud Skiing Simulation ──
  tribes.forEach(tribe => {
    const assignment = driverAssignments[tribe.name];
    const skier = selections[tribe.name]?.ski;
    const skiPressured = !!selections[tribe.name]?.skiPressured;
    const skiMotivated = !!selections[tribe.name]?.skiMotivated;

    if (!skier || !assignment) {
      xt.mudSkiing.push({ tribe: tribe.name, skier: skier || null, score: 0, text: {} });
      xt.tribeScores[tribe.name].ski = 0;
      return;
    }

    const { driver, driverTribeName, saboIntent, driverConfText, skierConfText } = assignment;
    const skierStats = pStats(skier);
    const driverStats = pStats(driver);
    const skierPr = pronouns(skier);
    const driverPr = pronouns(driver);

    // ── 7a. Start — jolt sabotage check ──
    let dragged = false;
    let joltedOff = false;
    let startText = '';
    if (saboIntent > 0.3) {
      const joltChance = saboIntent * 0.6;
      if (Math.random() < joltChance) {
        // Jolt attempted
        const skierResistance = skierStats.physical * 0.06 + skierStats.endurance * 0.04;
        if (Math.random() < skierResistance) {
          // Resisted
          startText = _rp(XT_SKI_START.joltResisted)(skier, driver, skierPr);
        } else {
          // Not resisted — dragged
          dragged = true;
          joltedOff = true;
          startText = _rp(XT_SKI_START.jolt)(skier, driver, skierPr);
        }
      } else {
        startText = _rp(XT_SKI_START.clean)(skier, driver, skierPr);
      }
    } else {
      startText = _rp(XT_SKI_START.clean)(skier, driver, skierPr);
    }

    // ── 7b. Flag collection — 5 flags ──
    let flagsCollected = 0;
    const flagTexts = [];
    const driverSwerving = saboIntent > 0.2;
    for (let flagNum = 1; flagNum <= 5; flagNum++) {
      let collectChance = skierStats.physical * 0.05 + skierStats.mental * 0.03 + 0.20;
      if (driverSwerving) collectChance -= 0.12;
      if (dragged)        collectChance -= 0.08;
      if (skiMotivated)   collectChance += 0.08;
      if (skiPressured)   collectChance -= 0.05;
      collectChance = Math.max(0.05, Math.min(0.95, collectChance));

      const flagRoll = Math.random();
      if (flagRoll < collectChance) {
        flagsCollected++;
        flagTexts.push(_rp(XT_SKI_FLAG.collect)(skier, flagNum, skierPr, driver));
      } else if (driverSwerving && Math.random() < 0.6) {
        flagTexts.push(_rp(XT_SKI_FLAG.swerved)(skier, flagNum, skierPr, driver));
      } else {
        flagTexts.push(_rp(XT_SKI_FLAG.miss)(skier, flagNum, skierPr, driver));
      }
    }

    // ── 7c. Mid-course sabotage ──
    let sabotageAttempt = false;
    let sabotageBackfire = false;
    let sabotageCrash = false;
    let sabotageText = '';
    if (saboIntent > 0.4) {
      const crashAttemptChance = saboIntent * 0.5;
      if (Math.random() < crashAttemptChance) {
        sabotageAttempt = true;
        sabotageText = _rp(XT_SKI_SABOTAGE.attempt)(driver, skier, driverPr, skierPr);
        const backfireChance = 0.20 + (10 - driverStats.physical) * 0.03;
        if (Math.random() < backfireChance) {
          sabotageBackfire = true;
          sabotageText += ' ' + _rp(XT_SKI_SABOTAGE.backfire)(driver, skier, driverPr, skierPr);
          addBond(driver, skier, -0.3);
        } else {
          sabotageCrash = true;
          sabotageText += ' ' + _rp(XT_SKI_SABOTAGE.success)(driver, skier, driverPr, skierPr);
          addBond(driver, skier, -0.5);
        }
      }
    }

    // ── 7d. Finish ──
    let driverRefusedFinish = false;
    let skierHadMomentum = false;
    let cleanFinish = false;
    let finishText = '';
    if (!sabotageCrash) {
      const driverRefuseChance = (10 - driverStats.loyalty) * 0.03 + saboIntent * 0.2;
      if (Math.random() < driverRefuseChance) {
        driverRefusedFinish = true;
        const momentumChance = skierStats.physical * 0.08 + 0.15;
        if (Math.random() < momentumChance) {
          skierHadMomentum = true;
          finishText = _rp(XT_SKI_FINISH.momentumSuccess)(skier, driver, skierPr);
        } else {
          finishText = _rp(XT_SKI_FINISH.momentumFail)(skier, driver, skierPr);
        }
      } else {
        cleanFinish = true;
        finishText = _rp(XT_SKI_FINISH.clean)(skier, driver, skierPr);
      }
    }

    // ── 7e. Injury check ──
    let skierInjured = false;
    let driverInjured = false;
    if (sabotageCrash || joltedOff) {
      if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
      // Skier injury
      const skierInjChance = 0.10 + (10 - skierStats.physical) * 0.03;
      if (Math.random() < skierInjChance) {
        skierInjured = true;
        gs.lingeringInjuries[skier] = {
          ep: epNum,
          duration: 1 + Math.floor(Math.random() * 2),
          penalty: 0.4 + Math.random() * 0.6,
          type: 'mud-ski-crash'
        };
      }
      // Driver injury on backfire
      if (sabotageBackfire) {
        const driverInjChance = 0.15 + (10 - driverStats.physical) * 0.04;
        if (Math.random() < driverInjChance) {
          driverInjured = true;
          gs.lingeringInjuries[driver] = {
            ep: epNum,
            duration: 1 + Math.floor(Math.random() * 2),
            penalty: 0.4 + Math.random() * 0.6,
            type: 'mud-ski-backfire'
          };
        }
      }
    }

    // ── Scoring ──
    let score = flagsCollected * 2;
    if (cleanFinish) score += 1;
    if (sabotageBackfire) score += 2;
    if (driverRefusedFinish && !skierHadMomentum) score -= 2;
    score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

    // ── Driver post-race reaction ──
    let driverReactionText;
    if (sabotageBackfire) {
      driverReactionText = _rp([
        `${driver} [post-race]: "I tried to play it smart. It came back on me. That's the game."`,
        `${driver} [post-race]: "I went for the crash and crashed myself. Yeah. I know how that looks."`,
        `${driver} [post-race]: "Karma. That's all I'm gonna say. Karma."`,
        `${driver} [post-race]: "Note to self: if you're gonna sabotage someone, make sure you can drive first."`,
      ]);
    } else if (sabotageCrash) {
      driverReactionText = _rp([
        `${driver} [post-race]: "I did what I had to do. ${skier} would've done the same."`,
        `${driver} [post-race]: "Was it clean? No. Did it work? Yes. I can live with that."`,
        `${driver} [post-race]: "Sometimes you drive straight. Sometimes you don't. Today I didn't."`,
        `${driver} [post-race]: "That wasn't personal. That was strategic. There's a difference. Supposedly."`,
      ]);
    } else if (driverRefusedFinish && !skierHadMomentum) {
      driverReactionText = _rp([
        `${driver} [post-race]: "I just couldn't hand them the win. Call it petty. I call it competitive."`,
        `${driver} [post-race]: "I stopped the ski. I know. My tribe's gonna hear about this for a while."`,
        `${driver} [post-race]: "In the moment it made sense. Now? Now I'm not so sure."`,
      ]);
    } else if (flagsCollected >= 4) {
      driverReactionText = _rp([
        `${driver} [post-race]: "Clean run. ${skier}'s good. I hate to say it, but — ${pronouns(skier).sub}'s good."`,
        `${driver} [post-race]: "I gave ${skier} a fair ride. ${pronouns(skier).Sub} earned that score. Respect."`,
        `${driver} [post-race]: "Straight line, steady speed. ${skier} did the rest. Nothing else to say."`,
        `${driver} [post-race]: "I could've swerved. I thought about it. But then I just — drove. Maybe next time."`,
      ]);
    } else if (flagsCollected <= 2) {
      driverReactionText = _rp([
        `${driver} [post-race]: "I drove straight. ${skier} just couldn't grab the flags. That's on ${pronouns(skier).obj}."`,
        `${driver} [post-race]: "Honestly? I feel a little bad. The course was brutal and ${skier} just couldn't get there."`,
        `${driver} [post-race]: "Low score. Wasn't my fault. I kept it clean. The flags were there — ${skier} missed them."`,
      ]);
    } else {
      driverReactionText = _rp([
        `${driver} [post-race]: "Mixed bag. Some flags, some misses. It is what it is."`,
        `${driver} [post-race]: "Not the cleanest run. Not the worst either. We'll see where the scores land."`,
        `${driver} [post-race]: "Could've been better. Could've been a lot worse. I'll take it."`,
        `${driver} [post-race]: "Three flags out of five? That's a conversation for the team later."`,
      ]);
    }

    xt.tribeScores[tribe.name].ski = score;
    if (seasonConfig.popularityEnabled !== false) {
      if (!gs.popularity) gs.popularity = {};
      if (flagsCollected >= 4) gs.popularity[skier] = (gs.popularity[skier] || 0) + 2; // great run
      if (flagsCollected === 5) gs.popularity[skier] = (gs.popularity[skier] || 0) + 1; // perfect run bonus
      if (sabotageBackfire) {
        gs.popularity[driver] = (gs.popularity[driver] || 0) - 2; // embarrassing backfire
        gs.popularity[skier] = (gs.popularity[skier] || 0) + 1; // sympathy
      }
      if (sabotageCrash) {
        gs.popularity[driver] = (gs.popularity[driver] || 0) - 3; // villain edit
        gs.popularity[skier] = (gs.popularity[skier] || 0) + 2; // victim sympathy
      }
      if (skierInjured) gs.popularity[skier] = (gs.popularity[skier] || 0) + 2; // injury sympathy
    }
    xt.mudSkiing.push({
      tribe: tribe.name,
      skier,
      driver,
      driverTribe: driverTribeName,
      saboIntent,
      joltedOff,
      dragged,
      flagsCollected,
      sabotageAttempt,
      sabotageBackfire,
      driverRefusedFinish,
      skierMomentum: skierHadMomentum,
      score,
      skierInjured,
      driverInjured,
      text: {
        setup: driverConfText + ' ' + skierConfText,
        driverConfessional: driverConfText,
        skierConfessional: skierConfText,
        driverReaction: driverReactionText,
        start: startText,
        flags: flagTexts,
        sabotage: sabotageText,
        finish: finishText,
      }
    });
  });

  // ── Compute total tribe scores ──
  tribes.forEach(t => {
    const ts = xt.tribeScores[t.name];
    ts.total = (ts.sky || 0) + (ts.moose || 0) + (ts.ski || 0);
  });

  // ── Determine winner and loser ──
  const _scoredTribes = tribes.filter(t => xt.tribeScores[t.name]?.total != null);
  if (_scoredTribes.length >= 2) {
    const _byTotal = _scoredTribes.slice().sort((a, b) => xt.tribeScores[b.name].total - xt.tribeScores[a.name].total);
    xt.winner = _byTotal[0].name;
    xt.loser = _byTotal[_byTotal.length - 1].name;
  }

  // ── Determine MVP (highest single-event score among event participants) ──
  const _mvpCandidates = [];
  xt.skydiving.forEach(s => { if (s.jumper) _mvpCandidates.push({ name: s.jumper, score: s.score || 0 }); });
  xt.mooseRiding.forEach(m => { if (m.rider) _mvpCandidates.push({ name: m.rider, score: m.score || 0 }); });
  xt.mudSkiing.forEach(k => { if (k.skier) _mvpCandidates.push({ name: k.skier, score: k.score || 0 }); });
  if (_mvpCandidates.length) {
    xt.mvp = _mvpCandidates.slice().sort((a, b) => b.score - a.score)[0].name;
  }

  // ── Task 9: Results finalization, heat, chalMemberScores, camp events ──

  // 1. Set ep fields required for post-challenge flow
  ep.winner = gs.tribes.find(t => t.name === xt.winner) || xt.winner;
  ep.loser  = gs.tribes.find(t => t.name === xt.loser) || xt.loser;
  ep.challengeType = 'tribe';
  const _xtLosingTribe = tribes.find(t => t.name === xt.loser);
  if (_xtLosingTribe) ep.tribalPlayers = _xtLosingTribe.members.filter(m => gs.activePlayers.includes(m));

  // 2. Heat system
  if (!gs._xtremeTortureHeat) gs._xtremeTortureHeat = {};

  // Collect all individual event scores keyed by player
  const _xtEventScores = {};
  xt.skydiving.forEach(s => { if (s.jumper) _xtEventScores[s.jumper] = s.score || 0; });
  xt.mooseRiding.forEach(m => { if (m.rider) _xtEventScores[m.rider] = m.score || 0; });
  xt.mudSkiing.forEach(k => { if (k.skier) _xtEventScores[k.skier] = k.score || 0; });

  // Worst performer on losing tribe
  if (_xtLosingTribe) {
    const _xtLoserParticipants = _xtLosingTribe.members.filter(m =>
      gs.activePlayers.includes(m) && _xtEventScores[m] != null
    );
    if (_xtLoserParticipants.length) {
      const _xtWorst = _xtLoserParticipants.slice().sort((a, b) => (_xtEventScores[a] || 0) - (_xtEventScores[b] || 0))[0];
      const _xtRefusedWorst = refusals.some(r => r.name === _xtWorst && r.tribe === _xtLosingTribe.name);
      let _xtWorstHeat = 1.0;
      if (_xtRefusedWorst) _xtWorstHeat += 0.3;
      gs._xtremeTortureHeat[_xtWorst] = { amount: _xtWorstHeat, expiresEp: epNum + 2 };
    }
  }

  // Any refuser on any tribe gets heat
  refusals.forEach(r => {
    const existing = gs._xtremeTortureHeat[r.name];
    const base = 0.8;
    if (!existing || existing.amount < base) {
      gs._xtremeTortureHeat[r.name] = { amount: base, expiresEp: epNum + 2 };
    }
  });

  // 3. chalMemberScores
  ep.chalMemberScores = {};
  // Initialize all active players to 0
  tribes.forEach(t => {
    t.members.filter(m => gs.activePlayers.includes(m)).forEach(m => {
      ep.chalMemberScores[m] = 0;
    });
  });
  // Apply scores — ADDITIVE across all roles (crew + event + driver stack)
  // A player who was crew (1.5) then moose rider (6) gets 7.5 total
  xt.skydiving.forEach(s => {
    if (s.jumper) ep.chalMemberScores[s.jumper] = Math.round(((ep.chalMemberScores[s.jumper] || 0) + (s.score || 0)) * 10) / 10;
    // Crew members scored proportional to their effort, sharing the crew score
    const contribs = s.crewContributions || [];
    const totalContrib = contribs.reduce((sum, c) => sum + c.contribution, 0) || 1;
    contribs.forEach(c => {
      const share = (c.contribution / totalContrib) * (s.crewScore || 0);
      ep.chalMemberScores[c.name] = Math.round(((ep.chalMemberScores[c.name] || 0) + share) * 10) / 10;
    });
  });
  xt.mooseRiding.forEach(m => {
    if (m.rider) ep.chalMemberScores[m.rider] = Math.round(((ep.chalMemberScores[m.rider] || 0) + (m.score || 0)) * 10) / 10;
  });
  xt.mudSkiing.forEach(k => {
    if (k.skier) ep.chalMemberScores[k.skier] = Math.round(((ep.chalMemberScores[k.skier] || 0) + (k.score || 0)) * 10) / 10;
    // Drivers: clean = skier's score * 0.7, sabotage backfire = 1, sabotage success = 3
    if (k.driver) {
      let driverScore;
      if (k.sabotageBackfire) driverScore = 1;
      else if (k.sabotageAttempt) driverScore = 3;
      else driverScore = Math.round((k.score || 0) * 0.7 * 10) / 10;
      ep.chalMemberScores[k.driver] = Math.round(((ep.chalMemberScores[k.driver] || 0) + driverScore) * 10) / 10;
    }
  });

  updateChalRecord(ep);

  // 4. Camp events (3-4 per tribe, positive + negative pools)
  tribes.forEach(tribe => {
    if (!ep.campEvents[tribe.name]) ep.campEvents[tribe.name] = { pre: [], post: [] };
    if (!ep.campEvents[tribe.name].post) ep.campEvents[tribe.name].post = [];

    const isLoser = tribe.name === xt.loser;
    const tribeMembers = tribe.members.filter(m => gs.activePlayers.includes(m));
    const postEvents = [];

    // ── Positive pool ──────────────────────────────────────────────────

    // Underdog Hero: low-stat player (avg <= 5) scored >= 7 in any event
    const _xtUnderdogCandidates = tribeMembers.filter(m => {
      const s = pStats(m);
      const avg = (s.physical + s.endurance + s.mental + s.social + s.strategic + s.loyalty + s.boldness + s.intuition + s.temperament) / 9;
      const score = _xtEventScores[m];
      return avg <= 5 && score != null && score >= 7;
    });
    if (_xtUnderdogCandidates.length > 0) {
      const hero = _xtUnderdogCandidates[0];
      const heroPr = pronouns(hero);
      const heroScore = _xtEventScores[hero];
      tribeMembers.filter(m => m !== hero).forEach(m => addBond(m, hero, 0.3));
      postEvents.push({
        type: 'xtUnderdogHero',
        players: [hero, ...tribeMembers.filter(m => m !== hero)],
        text: `Nobody had ${hero} down as a difference-maker. Then ${heroPr.sub} posted a ${heroScore}. The tribe goes quiet for a beat — then explodes. ${heroPr.Sub} earned something today that a stat sheet can't explain.`,
        badgeText: 'UNDERDOG HERO',
        badgeClass: 'gold',
        bondChanges: tribeMembers.filter(m => m !== hero).map(m => ({ a: m, b: hero, delta: 0.3 })),
      });
    }

    // Team Player: ground crew sofa positioning was excellent (skydiving posQuality >= 0.8 for this tribe)
    const _xtSkyResult = xt.skydiving.find(s => s.tribe === tribe.name);
    if (_xtSkyResult && _xtSkyResult.posQuality >= 0.8 && _xtSkyResult.groundCrew?.length > 0) {
      const gcMembers = _xtSkyResult.groundCrew.filter(m => gs.activePlayers.includes(m));
      if (gcMembers.length > 0) {
        gcMembers.forEach(m => addBond(m, _xtSkyResult.jumper, 0.3));
        postEvents.push({
          type: 'xtTeamPlayer',
          players: [_xtSkyResult.jumper, ...gcMembers],
          text: `The ground crew nailed the sofa positioning — ${_xtSkyResult.jumper} had a clean target to land on. It wasn't luck. ${gcMembers.join(' and ')} called every adjustment right. The tribe recognizes it.`,
          badgeText: 'TEAM EFFORT',
          badgeClass: 'gold',
          bondChanges: gcMembers.map(m => ({ a: m, b: _xtSkyResult.jumper, delta: 0.3 })),
        });
      }
    }

    // Injury Support: someone from sidelineEvents helped an injured teammate
    const _xtInjurySupport = xt.sidelineEvents.filter(e =>
      (e.type === 'injurySympathy' || e.type === 'mooseInjurySympathy') &&
      tribeMembers.includes(e.players?.[0]) && tribeMembers.includes(e.players?.[1])
    );
    if (_xtInjurySupport.length > 0 && postEvents.length < 2) {
      const supEvent = _xtInjurySupport[0];
      const [helper, injured] = supEvent.players;
      postEvents.push({
        type: 'xtInjurySupport',
        players: [helper, injured],
        text: `Back at camp, ${helper} checks in on ${injured} again. The challenge is over but ${pronouns(helper).sub} hasn't stopped watching out for ${pronouns(injured).obj}. The tribe notices the kind of loyalty that doesn't shut off when the cameras aren't rolling.`,
        badgeText: 'INJURY SUPPORT',
        badgeClass: 'gold',
        bondChanges: [{ a: helper, b: injured, delta: 0.3 }],
      });
      addBond(helper, injured, 0.3);
    }

    // Comedy Relief: moose rider thrown into a funny location
    const _xtMooseResult = xt.mooseRiding.find(m => m.tribe === tribe.name);
    if (_xtMooseResult && _xtMooseResult.dismountType === 'thrown' && _xtMooseResult.dismountLocation) {
      const rider = _xtMooseResult.rider;
      const riderPr = pronouns(rider);
      const socialTeammates = tribeMembers.filter(m => m !== rider && pStats(m).social >= 6);
      if (socialTeammates.length > 0 && postEvents.length < 2) {
        const laugher = socialTeammates[0];
        addBond(laugher, rider, 0.3);
        postEvents.push({
          type: 'xtComedyRelief',
          players: [rider, laugher],
          text: `${rider} still can't fully explain how ${riderPr.sub} ended up in the ${_xtMooseResult.dismountLocation}. ${laugher} won't let ${riderPr.obj} forget it either. The retelling at camp has the whole tribe in stitches — including ${rider}, eventually.`,
          badgeText: 'COMEDY RELIEF',
          badgeClass: 'gold',
          bondChanges: [{ a: laugher, b: rider, delta: 0.3 }],
        });
      }
    }

    // ── Negative pool ──────────────────────────────────────────────────

    // Refusal Resentment: someone refused to compete
    const _xtTribeRefusals = refusals.filter(r => r.tribe === tribe.name);
    if (_xtTribeRefusals.length > 0) {
      const refuser = _xtTribeRefusals[0].name;
      const refuserPr = pronouns(refuser);
      const resenters = tribeMembers.filter(m => m !== refuser);
      resenters.forEach(m => addBond(m, refuser, -0.3));
      postEvents.push({
        type: 'xtRefusalResentment',
        players: [refuser, ...resenters.slice(0, 3)],
        text: `The refusal is still a sore point back at camp. ${refuser} had a reason — but nobody wants to hear it right now. The tribe makes room for ${refuserPr.obj} around the fire but the silence speaks louder than anything they could say.`,
        badgeText: 'REFUSAL',
        badgeClass: 'red',
        bondChanges: resenters.map(m => ({ a: m, b: refuser, delta: -0.3 })),
      });
    }

    // Sabotage Confrontation: mud skiing had blatant sabotage (saboIntent > 0.4) targeting this tribe
    const _xtSkiResult = xt.mudSkiing.find(k => k.tribe === tribe.name);
    if (_xtSkiResult && _xtSkiResult.saboIntent > 0.4 && _xtSkiResult.sabotageAttempt) {
      const skier = _xtSkiResult.skier;
      const driver = _xtSkiResult.driver;
      const skierPr = pronouns(skier);
      addBond(skier, driver, -0.3);
      postEvents.push({
        type: 'xtSabotageConfrontation',
        players: [skier, ...tribeMembers.filter(m => m !== skier).slice(0, 2)],
        text: `${skier} is still fuming about the ski run. ${skierPr.Sub} knows what ${driver} did — or tried to. "That wasn't a mistake," ${skierPr.sub} tells the tribe. "That was on purpose." The mood around camp sours fast.`,
        badgeText: 'SABOTAGE',
        badgeClass: 'red-orange',
        bondChanges: [{ a: skier, b: driver, delta: -0.3 }],
      });
    }

    // Blame Game: losing tribe, worst performer gets targeted
    if (isLoser && _xtLosingTribe) {
      const _xtLoserParticipantsBlame = tribeMembers.filter(m => _xtEventScores[m] != null);
      if (_xtLoserParticipantsBlame.length >= 2) {
        const _xtBlameTarget = _xtLoserParticipantsBlame.slice().sort((a, b) => (_xtEventScores[a] || 0) - (_xtEventScores[b] || 0))[0];
        const _xtBlameTargetPr = pronouns(_xtBlameTarget);
        const blamers = tribeMembers.filter(m => m !== _xtBlameTarget && pStats(m).strategic >= 6);
        if (blamers.length > 0) {
          blamers.forEach(m => addBond(m, _xtBlameTarget, -0.3));
          postEvents.push({
            type: 'xtBlameGame',
            players: [_xtBlameTarget, ...blamers.slice(0, 2)],
            text: `The tribe's headed to tribal and someone has to be the reason. ${_xtBlameTarget}'s score hangs in the air like a question nobody wants to ask out loud — but ${blamers[0]} is already doing the math. ${_xtBlameTargetPr.Sub} ${_xtBlameTargetPr.sub === 'they' ? 'know' : 'knows'} it too.`,
            badgeText: 'ON THE BLOCK',
            badgeClass: 'red',
            bondChanges: blamers.map(m => ({ a: m, b: _xtBlameTarget, delta: -0.3 })),
          });
        }
      }
    }

    // Injury Liability: if injured player + strategist on losing tribe
    if (isLoser) {
      const _xtInjuredOnLoser = tribeMembers.find(m => gs.lingeringInjuries?.[m]?.ep === epNum);
      const _xtStrategist = tribeMembers.find(m => pStats(m).strategic >= 7 && m !== _xtInjuredOnLoser);
      if (_xtInjuredOnLoser && _xtStrategist) {
        const injuredPr = pronouns(_xtInjuredOnLoser);
        addBond(_xtStrategist, _xtInjuredOnLoser, -0.3);
        postEvents.push({
          type: 'xtInjuryLiability',
          players: [_xtInjuredOnLoser, _xtStrategist],
          text: `${_xtInjuredOnLoser} is nursing ${injuredPr.posAdj} injury and it's becoming a liability conversation. ${_xtStrategist} hasn't said anything yet — but ${pronouns(_xtStrategist).sub}'s watching. A tribe going to tribal with an injured player is a tribe doing arithmetic.`,
          badgeText: 'LIABILITY',
          badgeClass: 'red',
          bondChanges: [{ a: _xtStrategist, b: _xtInjuredOnLoser, delta: -0.3 }],
        });
      }
    }

    // Limit to 4 events total (2 positive, 2 negative balance)
    ep.campEvents[tribe.name].post.push(...postEvents.slice(0, 4));
  });

  // 5. MVP bond boost
  if (xt.mvp) {
    const _xtMvpTribe = tribes.find(t => t.members.includes(xt.mvp));
    if (_xtMvpTribe) {
      _xtMvpTribe.members.filter(m => gs.activePlayers.includes(m) && m !== xt.mvp).forEach(m => addBond(m, xt.mvp, 0.4));
    }
    if (seasonConfig.popularityEnabled !== false) {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[xt.mvp] = (gs.popularity[xt.mvp] || 0) + 3; // challenge MVP
    }
  }

  ep.xtremeTorture = xt;
  ep.challengeType = 'tribe';
}

export function _textXtremeTorture(ep, ln, sec) {
  if (!ep.isXtremeTorture || !ep.xtremeTorture) return;
  const xt = ep.xtremeTorture;

  sec('X-TREME TORTURE');

  // Selection
  ln('PLAYER ASSIGNMENTS:');
  Object.entries(xt.selections).forEach(([tribe, sel]) => {
    ln(`  ${tribe}: Skydiving=${sel.sky || '?'}, Moose=${sel.moose || '?'}, Mud Skiing=${sel.ski || '?'}`);
  });
  if (xt.refusals.length) {
    ln('REFUSALS:');
    xt.refusals.forEach(r => ln(`  ${r.name} (${r.tribe}) refused ${r.event}`));
  }

  // Event 1: Skydiving
  ln('');
  ln('EVENT 1 — SOFA BED SKYDIVING:');
  xt.skydiving.forEach(s => {
    if (!s.jumper) { ln(`  ${s.tribe}: No jumper (0 pts)`); return; }
    ln(`  ${s.tribe} — ${s.jumper}: ${s.jumpDecision}${s.injured ? ' [INJURED]' : ''} → ${s.score} pts`);
    if (s.text.jump) ln(`    ${s.text.jump}`);
    if (s.text.landing) ln(`    ${s.text.landing}`);
  });

  // Sideline 1
  const s1 = xt.sidelineEvents.filter(e => e.phase === 'sideline1');
  if (s1.length) {
    ln('');
    ln('SIDELINE:');
    s1.forEach(e => ln(`  [${e.badgeText}] ${e.text}`));
  }

  // Event 2: Moose Riding
  ln('');
  ln('EVENT 2 — RODEO MOOSE RIDING:');
  xt.mooseRiding.forEach(s => {
    if (!s.rider) { ln(`  ${s.tribe}: No rider (0 pts)`); return; }
    ln(`  ${s.tribe} — ${s.rider}: ${s.moosePersonality} moose, ${s.mounted ? s.roundsSurvived + ' rounds' : 'failed mount'}${s.injured ? ' [INJURED]' : ''} → ${s.score} pts`);
    if (s.text.dismount) ln(`    ${s.text.dismount}`);
  });

  // Sideline 2
  const s2 = xt.sidelineEvents.filter(e => e.phase === 'sideline2');
  if (s2.length) {
    ln('');
    ln('SIDELINE:');
    s2.forEach(e => ln(`  [${e.badgeText}] ${e.text}`));
  }

  // Event 3: Mud Skiing
  ln('');
  ln('EVENT 3 — MUD SKIING:');
  xt.mudSkiing.forEach(s => {
    if (!s.skier) { ln(`  ${s.tribe}: No skier (0 pts)`); return; }
    ln(`  ${s.tribe} — ${s.skier} (driven by ${s.driver}, ${s.driverTribe}): ${s.flagsCollected}/5 flags${s.dragged ? ' [DRAGGED]' : ''}${s.sabotageBackfire ? ' [BACKFIRE]' : ''}${s.skierInjured ? ' [INJURED]' : ''} → ${s.score} pts`);
  });

  // Results
  ln('');
  ln('RESULTS:');
  const sorted = Object.entries(xt.tribeScores).sort((a, b) => b[1].total - a[1].total);
  sorted.forEach(([tribe, scores], i) => {
    const tag = tribe === xt.winner ? ' ★ IMMUNITY' : tribe === xt.loser ? ' → TRIBAL' : '';
    ln(`  ${i + 1}. ${tribe}: Sky=${scores.sky} + Moose=${scores.moose} + Ski=${scores.ski} = ${scores.total}${tag}`);
  });
  if (xt.mvp) ln(`  MVP: ${xt.mvp}`);
}

export function rpBuildXtremeTorture(ep) {
  const xt = ep.xtremeTorture;
  if (!xt) return null;

  const stateKey = `xt_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // ── Build flat steps array (50+ clicks) ──
  const steps = [];

  // Selection screen
  steps.push({ type: 'selection' });

  // EVENT 1: SKYDIVING — header + per-tribe (2 steps each: jumper, then crew+landing)
  steps.push({ type: 'event-header', event: 'sky', label: 'SOFA BED SKYDIVING', color: '#38bdf8' });
  (xt.skydiving || []).forEach(s => {
    steps.push({ type: 'sky', data: s });
    steps.push({ type: 'sky-crew', data: s });
  });

  // Sideline 1 — each event is its own step
  const sl1Events = (xt.sidelineEvents || []).filter(e => e.phase === 'sideline1');
  sl1Events.forEach(ev => steps.push({ type: 'sideline-single', event: ev }));

  // EVENT 2: MOOSE RIDING — header + per-tribe (2 steps each: approach+mount, then ride+dismount)
  steps.push({ type: 'event-header', event: 'moose', label: 'RODEO MOOSE RIDING', color: '#d97706' });
  (xt.mooseRiding || []).forEach(s => {
    steps.push({ type: 'moose', data: s });
    steps.push({ type: 'moose-ride', data: s });
  });

  // Sideline 2 — each event is its own step
  const sl2Events = (xt.sidelineEvents || []).filter(e => e.phase === 'sideline2');
  sl2Events.forEach(ev => steps.push({ type: 'sideline-single', event: ev }));

  // EVENT 3: MUD SKIING — header + confessionals + per-matchup (4 steps each)
  steps.push({ type: 'event-header', event: 'ski', label: 'MUD SKIING', color: '#ef4444' });
  if ((xt.mudSkiing || []).length) {
    steps.push({ type: 'ski-confessionals', data: xt.mudSkiing });
  }
  (xt.mudSkiing || []).forEach(s => {
    steps.push({ type: 'ski-start', data: s });
    steps.push({ type: 'ski-flags-early', data: s });
    steps.push({ type: 'ski-flags-late', data: s });
    steps.push({ type: 'ski-finish', data: s });
  });

  // Results
  steps.push({ type: 'results' });

  const totalSteps = steps.length;
  const allRevealed = state.idx >= totalSteps - 1;

  const _xtReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // ── Compute revealed scores for scoreboard ──
  // sky score revealed on sky-crew step; moose on moose-ride; ski on ski-finish
  const tribeList = Object.keys(xt.tribeScores || {});
  const revealedScores = {};
  tribeList.forEach(t => { revealedScores[t] = { sky: 0, moose: 0, ski: 0, total: 0 }; });
  steps.forEach((s, si) => {
    if (si > state.idx) return;
    if (s.type === 'sky-crew' && s.data) revealedScores[s.data.tribe] && (revealedScores[s.data.tribe].sky = (s.data.score || 0) + (s.data.crewScore || 0));
    if (s.type === 'moose-ride' && s.data) revealedScores[s.data.tribe] && (revealedScores[s.data.tribe].moose = s.data.score || 0);
    if (s.type === 'ski-finish' && s.data) revealedScores[s.data.tribe] && (revealedScores[s.data.tribe].ski = s.data.score || 0);
  });
  tribeList.forEach(t => {
    revealedScores[t].total = revealedScores[t].sky + revealedScores[t].moose + revealedScores[t].ski;
  });

  // ── Badge color map ──
  const _badgeColor = {
    gold: '#e3b341', blue: '#58a6ff', pink: '#db61a2',
    red: '#f85149', 'red-orange': '#f0883e', green: '#3fb950', purple: '#d2a8ff'
  };

  // ── Shared flag-track renderer ──
  function _renderFlagTrack(collected, revealUpTo) {
    // revealUpTo: how many flags to show as decided (0-5), rest shown as pending dots
    let out = `<div class="xt-flag-track">`;
    for (let fi = 0; fi < 5; fi++) {
      if (fi < revealUpTo) {
        const cls = fi < collected ? 'collected' : 'missed';
        out += `<div class="xt-flag-slot ${cls}" style="animation-delay:${fi * 0.06}s">${fi < collected ? '✓' : '✗'}</div>`;
      } else {
        out += `<div class="xt-flag-slot" style="opacity:0.18;background:rgba(255,255,255,0.04)">·</div>`;
      }
    }
    out += `</div>`;
    return out;
  }

  // ── Shared sideline event renderer ──
  function _renderSidelineEvent(ev) {
    const bColor = _badgeColor[ev.badgeClass] || '#8b949e';
    return `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;margin-bottom:6px;border-radius:6px;background:rgba(0,0,0,0.22);border:1px solid ${bColor}20">
      <div style="display:flex;flex-wrap:wrap;gap:4px;min-width:48px">
        ${(ev.players || []).map(n => `<div>${rpPortrait(n, 'pb-xs')}</div>`).join('')}
      </div>
      <div style="flex:1;padding-top:2px">
        ${ev.badgeText ? `<span style="font-size:7px;font-weight:800;letter-spacing:1px;color:${bColor};background:${bColor}18;padding:2px 5px;border-radius:3px;margin-bottom:5px;display:inline-block">${ev.badgeText}</span>` : ''}
        <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${ev.text || ''}</div>
      </div>
    </div>`;
  }

  // ── Build HTML ──
  let html = `<div class="rp-page xt-wrap">
    <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#484f58;margin-bottom:10px">EPISODE ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:#ef4444;text-shadow:0 0 24px rgba(239,68,68,0.2);margin-bottom:4px">X-TREME TORTURE</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:14px">Three events. Three victims. One tribe wins immunity.</div>`;

  // ── Sticky scoreboard ──
  html += `<div class="xt-scoreboard">`;
  tribeList.forEach((tribe, ti) => {
    const tc = tribeColor(tribe);
    const score = revealedScores[tribe];
    const isChamp = allRevealed && tribe === xt.winner;
    html += `<div class="xt-score-tribe"${isChamp ? ` style="text-shadow:0 0 12px ${tc}"` : ''}>
      <div class="xt-score-num" style="color:${tc}">${Math.round(score.total * 10) / 10}</div>
      <div style="font-size:9px;font-weight:700;color:${tc};letter-spacing:0.5px">${tribe}</div>
    </div>`;
    if (ti < tribeList.length - 1) html += `<div style="color:#30363d;padding:0 10px;font-size:14px;align-self:center">|</div>`;
  });
  html += `</div>`;

  // ── Render steps ──
  steps.forEach((step, si) => {
    const isVisible = si <= state.idx;

    // ── SELECTION ──
    if (step.type === 'selection') {
      if (!isVisible) return;
      const sel = xt.selections || {};
      const selText = xt.selectionText || {};
      const refusals = xt.refusals || [];
      html += `<div class="xt-confessional" style="border-left-color:#8b949e;margin-bottom:12px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#6e7681;margin-bottom:10px">TRIBE ASSIGNMENTS</div>`;
      tribeList.forEach(tribe => {
        const tc = tribeColor(tribe);
        const tsel = sel[tribe] || {};
        const ttxt = selText[tribe] || {};
        html += `<div style="margin-bottom:10px;padding:10px;background:rgba(0,0,0,0.25);border-radius:6px;border:1px solid ${tc}18">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:${tc};margin-bottom:8px">${tribe}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">`;
        const roleLabels = { sky: '\u2708 SKYDIVER', moose: '\ud83e\udd8c MOOSE RIDER', ski: '\ud83c\udfbf SKIER' };
        ['sky', 'moose', 'ski'].forEach(role => {
          const pName = tsel[role];
          if (!pName) return;
          const refusal = refusals.find(r => r.name === pName && r.event === role);
          // For ski role, find the driver assignment
          let driverInfo = '';
          if (role === 'ski') {
            const skiMatch = xt.mudSkiing?.find(m => m.tribe === tribe);
            if (skiMatch?.driver) {
              const dTC = skiMatch.driverTribe ? tribeColor(skiMatch.driverTribe) : '#6e7681';
              driverInfo = `<div style="margin-top:6px;padding:5px 8px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.1);border-radius:4px;display:flex;align-items:center;gap:6px">
                ${rpPortrait(skiMatch.driver, 'pb-xs')}
                <div>
                  <div style="font-size:7px;font-weight:800;letter-spacing:1px;color:#ef4444">DRIVEN BY</div>
                  <div style="font-size:10px;font-weight:600;color:${dTC}">${skiMatch.driver} <span style="color:#484f58">(${skiMatch.driverTribe})</span></div>
                </div>
              </div>`;
            }
          }
          html += `<div style="flex:1;min-width:100px;max-width:180px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              ${rpPortrait(pName, 'pb-sm')}
              <div>
                <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:${refusal ? '#f85149' : tc};margin-bottom:2px">${roleLabels[role]}${refusal ? ' \u2014 REFUSED' : ''}</div>
                <div style="font-size:11px;font-weight:600;color:#c9d1d9">${pName}</div>
              </div>
            </div>
            ${ttxt[role] ? `<div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic">${ttxt[role]}</div>` : ''}
            ${refusal ? `<div style="font-size:10px;color:#f85149;margin-top:4px;padding:4px 6px;background:rgba(248,81,73,0.08);border-radius:4px">${refusal.text || 'Refused to participate.'}</div>` : ''}
            ${driverInfo}
          </div>`;
        });
        html += `</div></div>`;
      });
      html += `</div>`;

    // ── EVENT HEADER ──
    } else if (step.type === 'event-header') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin:4px 0;border:1px solid rgba(239,68,68,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">···</div>`;
        return;
      }
      const subtitles = {
        sky: 'Jump from 10,000 feet strapped to a sofa. Stick the landing.',
        moose: 'Stay on an untamed Canadian moose for as many rounds as possible.',
        ski: 'One skier. One driver. Five flags. One sabotage opportunity.'
      };
      html += `<div class="xt-event-banner" style="color:${step.color};border-bottom:2px solid ${step.color}30;margin-bottom:6px">
        ${step.label}
        <div style="font-size:10px;font-weight:400;letter-spacing:0.5px;color:#6e7681;margin-top:4px;font-family:var(--font-body)">${subtitles[step.event] || ''}</div>
      </div>`;

    // ── SKYDIVING — jumper spotlight (plane + jump + fall, no landing) ──
    } else if (step.type === 'sky') {
      if (!isVisible) return;
      const d = step.data;
      const tc = tribeColor(d.tribe);
      const t = d.text || {};
      html += `<div class="xt-confessional" style="border-left-color:#38bdf8">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="text-align:center">
            ${rpPortrait(d.jumper, 'lg')}
            <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:${tc};margin-top:4px">${d.tribe}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:#38bdf8;margin-bottom:2px">${d.jumper}</div>
            <div style="font-size:9px;color:#6e7681;letter-spacing:1px">SOFA BED SKYDIVER</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
              <div style="font-size:9px;color:#484f58">Score pending landing...</div>
            </div>
          </div>
        </div>`;
      if (t.plane) html += `<div style="font-size:12px;color:#8b949e;line-height:1.5;margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.04)">${t.plane}</div>`;
      if (t.jump) html += `<div style="font-size:12px;color:#c9d1d9;line-height:1.5;margin-bottom:5px">${t.jump}</div>`;
      if (t.fall) html += `<div style="font-size:12px;color:#c9d1d9;line-height:1.5;margin-bottom:5px">${t.fall}</div>`;
      // Checkpoint-by-checkpoint breakdown with text
      if (d.skyCheckResults?.length) {
        const checkLabels = { exit: 'EXIT', freefall: 'FREEFALL', deploy: 'DEPLOY', steer: 'STEER', flare: 'FLARE' };
        html += `<div style="margin:8px 0">`;
        d.skyCheckResults.forEach(c => {
          const passed = c.pass;
          const color = passed ? '#3fb950' : '#f85149';
          const icon = passed ? '\u2713' : '\u2717';
          html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;padding:4px 6px;border-radius:4px;background:${color}06;border-left:2px solid ${color}30">
            <div style="width:22px;height:22px;border-radius:3px;border:1.5px solid ${color};background:${color}15;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${color};flex-shrink:0;margin-top:1px">${icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:7px;font-weight:800;letter-spacing:1px;color:${color};margin-bottom:1px">${checkLabels[c.phase] || c.phase}</div>
              <div style="font-size:11px;color:#8b949e;line-height:1.4">${c.text || ''}</div>
            </div>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;

    // ── SKYDIVING — ground crew + landing + crew score ──
    } else if (step.type === 'sky-crew') {
      if (!isVisible) return;
      const d = step.data;
      const tc = tribeColor(d.tribe);
      const t = d.text || {};
      const crewContribs = d.crewContributions || [];
      const crewScore = d.crewScore || 0;
      const roleLabelMap = { anchor: 'ANCHOR', coordinator: 'COORDINATOR', spotter: 'SPOTTER', carrier: 'CARRIER' };
      const roleColorMap = { anchor: '#38bdf8', coordinator: '#3fb950', spotter: '#d2a8ff', carrier: '#e3b341' };
      html += `<div class="xt-confessional" style="border-left-color:#38bdf8">`;
      // Jumper score (before crew)
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(56,189,248,0.08)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#38bdf8">JUMP SCORE</div>
        <div style="font-family:var(--font-mono);font-size:16px;font-weight:800;color:#38bdf8">${Math.round((d.score || 0) * 10) / 10} <span style="font-size:9px;color:#6e7681;font-weight:400">/ 10</span></div>
      </div>`;
      // Ground crew header
      if (crewContribs.length) {
        html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#38bdf8;margin-bottom:8px">GROUND CREW</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">`;
        crewContribs.forEach(c => {
          const roleColor = roleColorMap[c.role] || '#8b949e';
          const roleLabel = roleLabelMap[c.role] || c.role.toUpperCase();
          const barPct = Math.round(c.contribution * 100);
          html += `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;min-width:56px;max-width:80px">
            ${rpPortrait(c.name, 'pb-sm')}
            <div style="font-size:7px;font-weight:800;letter-spacing:0.8px;color:${roleColor};background:${roleColor}18;padding:1px 4px;border-radius:2px;text-align:center">${roleLabel}</div>
            <div style="width:100%;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${barPct}%;background:${roleColor};border-radius:2px"></div>
            </div>
            <div style="font-size:8px;color:#8b949e;font-family:var(--font-mono)">${Math.round(c.contribution * 5 * 10) / 10}</div>
          </div>`;
        });
        html += `</div>`;
        if (t.ground) html += `<div style="font-size:12px;color:#8b949e;line-height:1.5;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(56,189,248,0.08)">${t.ground}</div>`;
        html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#38bdf8">CREW SCORE</div>
          <div style="font-family:var(--font-mono);font-size:16px;font-weight:800;color:#38bdf8">${Math.round(crewScore * 10) / 10} <span style="font-size:9px;color:#6e7681;font-weight:400">/ 5</span></div>
        </div>`;
      }
      // Landing — moved here from sky step
      if (t.landing) {
        if (d.injured) {
          html += `<div class="xt-injury-overlay"><div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149;margin-bottom:4px">⚠ INJURY ON LANDING</div><div style="font-size:12px;color:#e6edf3;line-height:1.5">${t.landing}</div></div>`;
        } else {
          html += `<div style="font-size:12px;color:#e6edf3;line-height:1.5;margin-bottom:6px">${t.landing}</div>`;
        }
      }
      // Final jumper score with crew — show breakdown
      const jumpScore = Math.round((d.score || 0) * 10) / 10;
      const jumpTotal = Math.round((jumpScore + crewScore) * 10) / 10;
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#6e7681">COMBINED</div>
        <div style="font-size:9px;color:#484f58;font-family:var(--font-mono)">${jumpScore} + ${crewScore} =</div>
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:#38bdf8">${jumpTotal}</div>
        <div style="font-size:9px;color:#6e7681">pts</div>
        ${d.injured ? `<span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.12);padding:2px 6px;border-radius:3px">INJURED</span>` : ''}
      </div>`;
      html += `</div>`;

    // ── MOOSE RIDING — approach + mount ──
    } else if (step.type === 'moose') {
      if (!isVisible) return;
      const d = step.data;
      const tc = tribeColor(d.tribe);
      const t = d.text || {};
      html += `<div class="xt-confessional" style="border-left-color:#d97706">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="text-align:center">
            ${rpPortrait(d.rider, 'lg')}
            <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:${tc};margin-top:4px">${d.tribe}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:#d97706;margin-bottom:2px">${d.rider}</div>
            <div style="font-size:9px;color:#6e7681;letter-spacing:1px">MOOSE RIDER</div>
            <div style="font-size:9px;color:#8b949e;margin-top:3px">Moose: <span style="color:#d97706;font-weight:600">${d.moosePersonality || 'Unknown'}</span></div>
          </div>
        </div>`;
      if (t.approach) html += `<div style="font-size:12px;color:#8b949e;line-height:1.5;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.04)">${t.approach}</div>`;
      if (t.mount) html += `<div style="font-size:12px;color:#c9d1d9;line-height:1.5">${t.mount}</div>`;
      html += `</div>`;

    // ── MOOSE RIDING — round-by-round + dismount + score ──
    } else if (step.type === 'moose-ride') {
      if (!isVisible) return;
      const d = step.data;
      const tc = tribeColor(d.tribe);
      const t = d.text || {};
      const rounds = t.rounds || [];
      html += `<div class="xt-confessional" style="border-left-color:#d97706">`;
      if (rounds.length) {
        html += `<div style="margin:0 0 8px">`;
        rounds.forEach((rTxt, ri) => {
          html += `<div style="display:flex;gap:8px;margin-bottom:5px;align-items:flex-start">
            <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:#d97706;min-width:46px;padding-top:2px">ROUND ${ri + 1}</div>
            <div style="font-size:12px;color:#c9d1d9;line-height:1.5;flex:1">${rTxt}</div>
          </div>`;
        });
        html += `</div>`;
      } else if (!d.mounted) {
        html += `<div style="font-size:12px;color:#6e7681;line-height:1.5;margin-bottom:8px;font-style:italic">Failed to mount — no ride recorded.</div>`;
      }
      if (t.dismount) {
        const locLabel = d.dismountLocation ? ` — landed <em>${d.dismountLocation}</em>` : '';
        if (d.injured) {
          html += `<div class="xt-injury-overlay"><div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149;margin-bottom:4px">⚠ DISMOUNT${locLabel}</div><div style="font-size:12px;color:#e6edf3;line-height:1.5">${t.dismount}</div></div>`;
        } else {
          html += `<div style="margin-bottom:8px;padding:6px 8px;background:rgba(217,119,6,0.05);border-radius:4px;border-left:2px solid #d97706">
            <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#d97706;margin-bottom:3px">DISMOUNT${locLabel}</div>
            <div style="font-size:12px;color:#e6edf3;line-height:1.5">${t.dismount}</div>
          </div>`;
        }
      }
      html += `<div style="display:flex;align-items:center;gap:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:#d97706">${Math.round((d.score || 0) * 10) / 10}</div>
        <div style="font-size:9px;color:#6e7681">pts</div>
        <div style="font-size:9px;color:#8b949e">${d.roundsSurvived || 0} round${d.roundsSurvived !== 1 ? 's' : ''} survived</div>
        ${d.injured ? `<span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.12);padding:2px 6px;border-radius:3px">INJURED</span>` : ''}
      </div>`;
      html += `</div>`;

    // ── SIDELINE — single event (replaces bundled sideline) ──
    } else if (step.type === 'sideline-single') {
      if (!isVisible) return;
      html += `<div style="margin:4px 0">${_renderSidelineEvent(step.event)}</div>`;

    // ── MUD SKIING — confessionals for all matchups before races begin ──
    } else if (step.type === 'ski-confessionals') {
      if (!isVisible) return;
      html += `<div class="xt-confessional" style="border-left-color:#ef4444;margin-bottom:6px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#ef4444;margin-bottom:10px">PRE-RACE CONFESSIONALS</div>`;
      (step.data || []).forEach(d => {
        if (!d.skier || !d.driver) return;
        const skierTC = tribeColor(d.tribe);
        const driverTC = d.driverTribe ? tribeColor(d.driverTribe) : '#6e7681';
        const t = d.text || {};
        html += `<div style="margin-bottom:10px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid rgba(239,68,68,0.08)">
          <div style="display:flex;gap:14px;align-items:center;margin-bottom:8px">
            <div style="text-align:center">
              ${rpPortrait(d.skier, 'pb-sm')}
              <div style="font-size:7px;font-weight:700;letter-spacing:0.5px;color:${skierTC};margin-top:2px">SKIER</div>
            </div>
            <div style="font-family:var(--font-display);font-size:14px;color:#484f58">VS</div>
            <div style="text-align:center">
              ${rpPortrait(d.driver, 'pb-sm')}
              <div style="font-size:7px;font-weight:700;letter-spacing:0.5px;color:${driverTC};margin-top:2px">DRIVER</div>
            </div>
            <div style="flex:1;padding-left:4px">
              <div style="font-size:11px;font-weight:600;color:#e6edf3">${d.skier} <span style="color:#6e7681">skis for</span> <span style="color:${skierTC}">${d.tribe}</span></div>
              <div style="font-size:10px;color:#6e7681;margin-top:2px">${d.driver} <span style="color:#484f58">driving</span> <span style="color:${driverTC}">(${d.driverTribe || '?'})</span></div>
            </div>
          </div>
          ${t.driverConfessional ? `<div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic;margin-bottom:4px">${t.driverConfessional}</div>` : ''}
          ${t.skierConfessional ? `<div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic">${t.skierConfessional}</div>` : ''}
        </div>`;
      });
      html += `</div>`;

    // ── MUD SKIING — start (dual portrait + launch) ──
    } else if (step.type === 'ski-start') {
      if (!isVisible) return;
      const d = step.data;
      const skierTC = tribeColor(d.tribe);
      const driverTC = d.driverTribe ? tribeColor(d.driverTribe) : '#6e7681';
      const t = d.text || {};
      html += `<div class="xt-confessional" style="border-left-color:#ef4444">
        <div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:10px 0 14px;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:10px">
          <div style="text-align:center">
            ${rpPortrait(d.skier, 'lg')}
            <div style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:${skierTC};margin-top:4px">${d.tribe}</div>
            <div style="font-size:8px;color:#6e7681;letter-spacing:0.5px">SKIER</div>
            <div style="font-size:11px;font-weight:600;color:#e6edf3;margin-top:2px">${d.skier}</div>
          </div>
          <div style="font-family:var(--font-display);font-size:20px;color:#484f58;padding:0 4px">VS</div>
          <div style="text-align:center">
            ${rpPortrait(d.driver, 'lg')}
            <div style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:${driverTC};margin-top:4px">${d.driverTribe || '?'}</div>
            <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:${driverTC};background:${driverTC}18;padding:1px 5px;border-radius:3px;margin-top:2px">DRIVER</div>
            <div style="font-size:11px;font-weight:600;color:#e6edf3;margin-top:2px">${d.driver}</div>
          </div>
        </div>
        ${d.joltedOff ? `<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149;margin-bottom:4px">⚠ START DISRUPTED</div>` : ''}
        ${t.start ? `<div style="font-size:12px;color:#c9d1d9;line-height:1.5">${t.start}</div>` : ''}
      </div>`;

    // ── MUD SKIING — flags 1-2 ──
    } else if (step.type === 'ski-flags-early') {
      if (!isVisible) return;
      const d = step.data;
      const t = d.text || {};
      const flags = t.flags || [];
      const collected = d.flagsCollected || 0;
      html += `<div class="xt-confessional" style="border-left-color:#ef4444">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#ef4444;margin-bottom:8px">FLAGS 1–2 · ${d.skier}</div>
        ${_renderFlagTrack(collected, 2)}
        <div style="margin-top:8px">`;
      [0, 1].forEach(fi => {
        if (!flags[fi]) return;
        const flagColor = fi < collected ? '#3fb950' : '#f85149';
        html += `<div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start">
          <div style="font-size:8px;font-weight:800;letter-spacing:0.5px;color:${flagColor};min-width:34px;padding-top:2px">FLAG ${fi + 1}</div>
          <div style="font-size:11px;color:#c9d1d9;line-height:1.5;flex:1">${flags[fi]}</div>
        </div>`;
      });
      html += `</div></div>`;

    // ── MUD SKIING — flags 3-5 + sabotage ──
    } else if (step.type === 'ski-flags-late') {
      if (!isVisible) return;
      const d = step.data;
      const t = d.text || {};
      const flags = t.flags || [];
      const collected = d.flagsCollected || 0;
      html += `<div class="xt-confessional" style="border-left-color:#ef4444">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#ef4444;margin-bottom:8px">FLAGS 3–5 · ${d.skier}</div>
        ${_renderFlagTrack(collected, 5)}
        <div style="margin-top:8px">`;
      [2, 3, 4].forEach(fi => {
        if (!flags[fi]) return;
        const flagColor = fi < collected ? '#3fb950' : '#f85149';
        html += `<div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start">
          <div style="font-size:8px;font-weight:800;letter-spacing:0.5px;color:${flagColor};min-width:34px;padding-top:2px">FLAG ${fi + 1}</div>
          <div style="font-size:11px;color:#c9d1d9;line-height:1.5;flex:1">${flags[fi]}</div>
        </div>`;
      });
      html += `</div>`;
      if (d.sabotageAttempt && t.sabotage) {
        const saboBackfire = d.sabotageBackfire;
        html += `<div class="xt-confessional${saboBackfire ? ' xt-sabo-backfire' : ''}" style="border-left-color:${saboBackfire ? '#f85149' : '#d97706'};margin:8px 0 0;padding:8px 10px;background:${saboBackfire ? 'rgba(248,81,73,0.06)' : 'rgba(217,119,6,0.06)'}">
          <div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:${saboBackfire ? '#f85149' : '#d97706'};margin-bottom:4px">${saboBackfire ? '⚠ SABOTAGE BACKFIRED' : '💥 SABOTAGE ATTEMPT'}</div>
          <div style="font-size:12px;color:#e6edf3;line-height:1.5">${t.sabotage}</div>
        </div>`;
      }
      html += `</div>`;

    // ── MUD SKIING — finish + driver reaction + score ──
    } else if (step.type === 'ski-finish') {
      if (!isVisible) return;
      const d = step.data;
      const skierTC = tribeColor(d.tribe);
      const driverTC = d.driverTribe ? tribeColor(d.driverTribe) : '#6e7681';
      const t = d.text || {};
      const collected = d.flagsCollected || 0;
      html += `<div class="xt-confessional" style="border-left-color:#ef4444">`;
      if (t.finish) {
        const hasInjury = d.skierInjured || d.driverInjured;
        if (hasInjury) {
          html += `<div class="xt-injury-overlay"><div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149;margin-bottom:4px">⚠ FINISH — INJURY</div><div style="font-size:12px;color:#e6edf3;line-height:1.5">${t.finish}</div></div>`;
        } else {
          html += `<div style="font-size:12px;color:#e6edf3;line-height:1.5;margin-bottom:8px">${t.finish}</div>`;
        }
      }
      if (t.driverReaction) {
        html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid ${driverTC}18">
          ${rpPortrait(d.driver, 'pb-xs')}
          <div style="flex:1">
            <div style="font-size:7px;font-weight:800;letter-spacing:1px;color:${driverTC};background:${driverTC}18;padding:1px 5px;border-radius:2px;display:inline-block;margin-bottom:4px">DRIVER POST-RACE</div>
            <div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic">${t.driverReaction}</div>
          </div>
        </div>`;
      }
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#6e7681">FLAGS</div>
        <div style="font-size:14px;font-weight:800;color:#e6edf3;font-family:var(--font-mono)">${collected} / 5</div>
        <div style="width:1px;height:16px;background:rgba(255,255,255,0.08);margin:0 4px"></div>
        <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:#6e7681">SCORE</div>
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:#ef4444">${Math.round((d.score || 0) * 10) / 10}</div>
        <div style="font-size:9px;color:#6e7681">pts</div>
        ${d.skierInjured || d.driverInjured ? `<span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.12);padding:2px 6px;border-radius:3px">INJURY</span>` : ''}
      </div>`;
      html += `</div>`;

    // ── RESULTS ──
    } else if (step.type === 'results') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin:4px 0;border:1px solid rgba(63,185,80,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">···</div>`;
        return;
      }
      const sortedTribes = [...tribeList].sort((a, b) =>
        (xt.tribeScores[b]?.total || 0) - (xt.tribeScores[a]?.total || 0)
      );
      html += `<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:#e6edf3;margin-bottom:14px">FINAL RESULTS</div>`;
      sortedTribes.forEach((tribe, i) => {
        const tc = tribeColor(tribe);
        const isWinner = tribe === xt.winner;
        const scores = xt.tribeScores[tribe] || {};
        const skyPts = Math.round((scores.sky || 0) * 10) / 10;
        const moosePts = Math.round((scores.moose || 0) * 10) / 10;
        const skiPts = Math.round((scores.ski || 0) * 10) / 10;
        const totalPts = Math.round((scores.total || 0) * 10) / 10;
        const maxTotal = xt.tribeScores[sortedTribes[0]]?.total || 1;
        const pct = Math.min(100, (scores.total || 0) / maxTotal * 100);
        html += `<div class="xt-result-card" style="border:1px solid ${isWinner ? 'rgba(63,185,80,0.25)' : 'rgba(255,255,255,0.04)'};background:${isWinner ? 'rgba(63,185,80,0.05)' : 'rgba(0,0,0,0.2)'};animation-delay:${i * 0.1}s">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-size:20px;font-weight:800;color:${isWinner ? '#3fb950' : '#30363d'};font-family:var(--font-mono);min-width:24px">${i + 1}</span>
            <span style="font-size:16px;font-weight:700;color:${tc}">${tribe}</span>
            <div style="flex:1">
              <div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${isWinner ? '#3fb950' : tc};border-radius:3px;transition:width 0.6s ease"></div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:9px;color:#484f58;margin-bottom:2px">
                Sky: ${skyPts} · Moose: ${moosePts} · Ski: ${skiPts}
              </div>
              <div style="font-size:18px;font-weight:800;color:${isWinner ? '#3fb950' : '#6e7681'};font-family:var(--font-mono)">${totalPts}</div>
            </div>
            ${isWinner ? '<span style="font-size:9px;font-weight:800;letter-spacing:1px;color:#0d1117;background:#3fb950;padding:3px 8px;border-radius:4px;white-space:nowrap">IMMUNITY</span>' : ''}
          </div>
        </div>`;
      });

      // Championship block with MVP
      const wTC = tribeColor(xt.winner);
      html += `<div class="xt-championship" style="border:2px solid ${wTC};background:${wTC}08;margin-top:10px">
        <div style="font-family:var(--font-display);font-size:26px;letter-spacing:3px;color:${wTC};margin-bottom:6px;text-shadow:0 0 20px ${wTC}44">${xt.winner} WINS</div>
        <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:#3fb950;margin-bottom:8px">IMMUNITY</div>
        <div style="font-size:11px;color:#6e7681;margin-bottom:${xt.mvp ? '16px' : '0'}">${xt.loser} goes to tribal council.</div>
        ${xt.mvp ? `<div style="display:inline-block">
          ${rpPortrait(xt.mvp, 'lg')}
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;margin-top:6px">MVP — ${xt.mvp}</div>
        </div>` : ''}
      </div>`;
      html += `</div>`;
    }
  });

  // ── Sticky nav ──
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;background:linear-gradient(transparent,rgba(6,14,30,0.95) 25%);z-index:5">
      <button class="rp-btn" onclick="${_xtReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalSteps})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_xtReveal(totalSteps - 1)}">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}


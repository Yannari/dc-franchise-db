// js/chal/bigger-badder-brutaler.js — Bigger! Badder! Brutal-er! (ROTI pre-merge tribe race)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _pickUsed = {};
function _pickUnique(arr, tag) {
  if (!arr?.length) return null;
  if (!_pickUsed[tag]) _pickUsed[tag] = new Set();
  let avail = arr.filter(x => !_pickUsed[tag].has(x));
  if (!avail.length) { _pickUsed[tag].clear(); avail = arr; }
  const choice = avail[Math.floor(Math.random() * avail.length)];
  _pickUsed[tag].add(choice);
  return choice;
}
function _resetPickCache() { for (const k in _pickUsed) delete _pickUsed[k]; }
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function canScheme(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(name) {
  return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog'].includes(arch(name));
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function methodLabelFor(m) { return m === 'trampoline' ? 'TRAMPOLINE' : m === 'sawclimb' ? 'SAW & CLIMB' : 'HUMAN STACK'; }

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── HOST LINES ──
const HOST_TEXT = {
  intro: [
    h => `${h} taps the totem pole hanging from the tree. "See this? Family heirloom. Family was bad at woodworking. Cut it down before it goes BOOM. Loser tribe gets blamed for the fire."`,
    h => `"Welcome to BIGGER! BADDER! BRUTAL-ER!" ${h} grins. "There's an axe stuck in your totem. Get the axe. Cut the rope. Don't get blown up. Simple."`,
    h => `${h} gestures vaguely at the forest. "Tree. Totem. Bomb. Race. Cabin. In that order. Try not to die. Or do — the ratings spike either way."`,
    h => `"Three tribes. Three totems. One bomb on each, set to seven minutes." ${h} shrugs. "I didn't write the rules. Actually, I did. Have fun."`,
  ],
  phase1: [
    h => `${h} watches the tribes argue. "PICK A METHOD, people! The bomb doesn't care about your feelings!"`,
    h => `"Method debate, ladies and gentlemen!" ${h} narrates. "Will it be the trampoline? The greased tree? The death-defying human pyramid? Place your bets."`,
    h => `${h} eats popcorn. "I love this part. Watching tribes pick the wrong tool for their stats. It's like an experiment, but with bombs."`,
  ],
  phase2: [
    h => `"Six minutes!" ${h} bellows. "Get that axe in your hands or your totem becomes confetti!"`,
    h => `${h} taps his watch. "Tick tock, campers. The bomb is on a schedule. The schedule does not negotiate."`,
    h => `"Wildlife is active today!" ${h} announces cheerfully. "I rented the island to a nature reserve while you were gone. Nature is unrented."`,
  ],
  phase3: [
    h => `"Phase three!" ${h} shouts from a megaphone halfway down the slope. "Ride that totem like it owes you money!"`,
    h => `${h} stands at the finish line. "Whoever loses, I'm gonna laugh. Whoever wins, I'm gonna laugh harder. Ride!"`,
    h => `"Last leg! The waterfall! The slope! And — fun surprise — the cabin pick!" ${h} winks. "First tribe across picks where they sleep tonight."`,
  ],
  finale: [
    h => `${h} surveys the wreckage. "And THAT is why we don't pick the luxury cabin."`,
    h => `"A new cabin will arrive shortly via helicopter," ${h} announces. "It will not be luxury. It will not be nice. It will be a cabin. Probably."`,
    h => `${h} nudges a charred plank with his boot. "We'll bill the network for the damages. As usual."`,
  ],
};

// ── METHOD CHAMPION ADVOCACY ──
const METHOD_ADVOCATE = {
  trampoline: [
    (n, pr) => `${n} grabs the trampoline. "We BOUNCE. We SOAR. We LAND ON THAT AXE. Anyone who disagrees is a coward."`,
    (n, pr) => `"Look at this thing!" ${n} drags the trampoline forward. "Free elevation! Free RAGE! ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} how to use this!"`,
    (n, pr) => `${n} kicks the trampoline. It bounces. ${pr.Sub} grins. "Oh yeah. That axe is MINE."`,
    (n, pr) => `"Trampoline. Done. End of debate." ${n} climbs on and bounces once. "See? Easy."`,
    (n, pr) => `${n} points at the totem. Then the trampoline. Then back. "Connect the dots, people. We jump. We win."`,
  ],
  sawclimb: [
    (n, pr) => `${n} grips the hacksaw. "Climbing. Period. Trampolines bounce people INTO STUFF. Climbing is consistent. Climbing is honest."`,
    (n, pr) => `"I climbed every tree on my farm growing up." ${n} hefts the saw. "I'll be up there in two minutes. The bark won't even know what hit it."`,
    (n, pr) => `${n} circles the tree, eyeing it. "Greased? Yeah, I see the grease. Don't care. I'll claw up if I have to."`,
    (n, pr) => `"You want the slow, steady, GUARANTEED way?" ${n} holds up the saw. "It's me. I'm the slow steady guaranteed way."`,
    (n, pr) => `${n} ties off ${pr.posAdj} sleeves. "Climbing. I've been waiting all morning. Let's go."`,
  ],
  stack: [
    (n, pr) => `${n} sketches in the dirt with a stick. "Three of us at the base. Two in the middle. Lightest on top with the saw. It's MATH. Math doesn't lose."`,
    (n, pr) => `"Trampolines are for clowns," ${n} says, calmly. "Climbing is for show-offs. We STACK. It's the optimal solution."`,
    (n, pr) => `${n} measures the height of the totem with ${pr.posAdj} fingers. "Six and a half feet. With a stack of three plus a jumper, we have reach AND stability. Trust me."`,
    (n, pr) => `"I ran the numbers." ${n} taps ${pr.posAdj} forehead. "Stack wins. Every time. Even with our weakest at the top."`,
    (n, pr) => `${n} draws a triangle in the dirt. "Pyramid. Strongest at the base. Lightest at the apex. We did this in physics class."`,
  ],
};

// ── METHOD INTERJECTIONS (other archetypes chime in) ──
const METHOD_INTERJECT = {
  hothead: [
    (n, pr, target) => `"Bouncing? CLIMBING? Just shut up and DO IT," ${n} snaps. "We've been arguing for ninety seconds. Pick something."`,
    (n, pr, target) => `${n} kicks a rock. "I don't CARE which one. We're losing time. Whoever shouts loudest gets it."`,
    (n, pr, target) => `"Are we doing this or are we DEBATING this?" ${n} is red in the face. "${target}, just pick!"`,
  ],
  hero: [
    (n, pr, target) => `"Whatever's safest." ${n} crosses ${pr.posAdj} arms. "I don't want anybody breaking a leg before episode two."`,
    (n, pr, target) => `${n} steps in. "Listen — let's go with whichever method has the lowest injury rate. We're a TEAM."`,
    (n, pr, target) => `"I'll do whichever one needs me most," ${n} says firmly. "But let's pick one that doesn't get someone hurt."`,
  ],
  villain: [
    (n, pr, target) => `${n} smiles thinly. "I think ${target}'s plan sounds... fine. Let's see how it plays out. I'll watch."`,
    (n, pr, target) => `"Sure, ${target}. Your plan." ${n} tilts ${pr.posAdj} head. "I'm sure that won't end badly. For someone."`,
    (n, pr, target) => `${n} folds ${pr.posAdj} arms. "I'll go along with whatever. I'll remember who picked, though."`,
  ],
  schemer: [
    (n, pr, target) => `"Counterpoint," ${n} cuts in. "What if the OTHER tribes pick the same method we do? We need the unexpected play."`,
    (n, pr, target) => `${n} tilts ${pr.posAdj} head. "${target} might be right. Or might be playing us. Hard to tell."`,
    (n, pr, target) => `"Whatever ${target} wants is fine," ${n} murmurs. "I'm cataloging this for later, just so we're clear."`,
  ],
  socialButterfly: [
    (n, pr, target) => `${n} jumps in. "Okay! Okay! Both have merit! Let's all take a breath and just pick the one that gets us there fastest!"`,
    (n, pr, target) => `"Guys, GUYS." ${n} holds up ${pr.posAdj} hands. "We can do this. We can ALL agree. Right? RIGHT?"`,
    (n, pr, target) => `${n} smiles brightly. "I think ${target}'s onto something. Let's give it a shot — together!"`,
  ],
  loyal: [
    (n, pr, target) => `"I'm with ${target}," ${n} says simply. "Whatever ${pr.sub} ${pr.sub === 'they' ? 'pick' : 'picks'}, I'm in."`,
    (n, pr, target) => `${n} nods at ${target}. "${target}'s usually right about this stuff. Let's go."`,
  ],
  challenge: [
    (n, pr, target) => `${n} flexes. "I can do any of them. Just point me at the totem."`,
    (n, pr, target) => `"Whatever, I'll carry the team." ${n} cracks ${pr.posAdj} knuckles. "Pick something. Anything."`,
  ],
  underdog: [
    (n, pr, target) => `${n} raises a tentative hand. "Um — what if we tried the easy one first? Just in case?"`,
    (n, pr, target) => `"I'll do whatever," ${n} says quietly. "I just want to help."`,
  ],
};

// ── METHOD DECISION OUTCOMES ──
const METHOD_DECISION = {
  win: [
    (winner, method, pr) => `The tribe locks in. ${winner} clenches a fist. "${method.toUpperCase()}. Let's go."`,
    (winner, method, pr) => `${winner} won the room. The tribe nods. ${method} it is.`,
    (winner, method, pr) => `${winner}'s plan carries. The dissenters grumble but fall in line. ${method} is the play.`,
    (winner, method, pr) => `"Settled." ${winner} claps once. "${method}. Move."`,
  ],
  badFit: [
    (winner, method) => `Dissenters mutter. The math doesn't quite favor this tribe — but ${winner} won the argument, and ${method} is the play.`,
    (winner, method) => `One or two players exchange looks. This isn't really their best fit. But ${winner} pushed for ${method} and ${winner} got it.`,
    (winner, method) => `The tribe goes with ${method}. Some of them don't love it. ${winner} promises it'll work.`,
  ],
  goodFit: [
    (winner, method) => `${winner} read the room right. ${method} plays directly to this tribe's strengths. They're moving with confidence.`,
    (winner, method) => `Smart pick. ${method} fits this roster. ${winner} grins — knows ${pronouns(winner).sub} called it.`,
    (winner, method) => `Tribe stats lean exactly into ${method}. ${winner} was right. They move out fast.`,
  ],
};

// ── TRAMPOLINE BEAT TEXT ──
// ── INTER-TRIBE METHOD CONFLICT (when multiple tribes claim the same method) ──
const INTER_TRIBE_CONFLICT = {
  trampoline: [
    (a, aT, b, bT) => `${a} from ${aT} sprints for the trampoline. ${b} from ${bT} is already there. "We picked first!" "WE picked first!" Both grab the frame. Tug-of-war.`,
    (a, aT, b, bT) => `${a} (${aT}) and ${b} (${bT}) are both standing on the trampoline yelling at each other. Production has to physically separate them. The trampoline becomes contested ground.`,
    (a, aT, b, bT) => `"This is OUR trampoline." ${a} is staring ${b} down across the springs. ${b} doesn't blink. Two tribes, one trampoline, zero sense of humor.`,
    (a, aT, b, bT) => `Cross-tribe screaming. ${a} insists ${aT} called it. ${b} insists ${bT} called it. The bomb timer doesn't care.`,
  ],
  sawclimb: [
    (a, aT, b, bT) => `${a} grips the hacksaw. ${b} grips the OTHER end. Both refuse to let go. "Climb your own tree." "It's MY tree." Inter-tribe relations: poor.`,
    (a, aT, b, bT) => `${aT} and ${bT} both want the saw method. ${a} and ${b} have a real intense conversation involving a lot of finger-pointing. Nobody's climbing yet.`,
    (a, aT, b, bT) => `${a} from ${aT} blocks the tree base. ${b} from ${bT} is trying to start climbing. ${a}: "Find your own tree." ${b}: "It's the SAME tree, Chris only set up one."`,
    (a, aT, b, bT) => `Both tribes converge on the hacksaw. ${a} and ${b} stake claim simultaneously. Negotiation breaks down within 4 seconds.`,
  ],
  stack: [
    (a, aT, b, bT) => `${a} (${aT}) is sketching a stack plan. ${b} (${bT}) is sketching the EXACT SAME PLAN three feet away. They lock eyes. "Stop copying me." "I'm not copying YOU."`,
    (a, aT, b, bT) => `${aT} forms up to stack. ${bT} also forms up to stack. The space gets crowded. ${a} and ${b} argue over which tribe stacks where.`,
    (a, aT, b, bT) => `${a} from ${aT} and ${b} from ${bT} both decide their tribe is going for the stack. They square up. "${aT}'s got the heavier base." "${bT}'s got the smarter brains." Heated.`,
    (a, aT, b, bT) => `Two tribes, both convinced the stack is the play. ${a} and ${b} get in each other's faces. Champion vs champion. The bomb timer keeps ticking.`,
  ],
};

const INTER_TRIBE_RESOLUTION = {
  win: [
    (winner, winT, loser, losT, method) => `${winner} stares ${loser} down. ${loser} blinks first. ${winT} keeps the ${method}. ${losT} retreats to regroup. ${loser} mutters something dark.`,
    (winner, winT, loser, losT, method) => `${winner} is louder. ${winner} is bolder. ${winner} wins. ${winT} claims the ${method}. ${loser} is genuinely furious — this is not over.`,
    (winner, winT, loser, losT, method) => `Production calls it. ${winT} got there first, technically. ${winner} grins. ${loser} does not. The cross-tribe rivalry just got real.`,
    (winner, winT, loser, losT, method) => `${winner} pulls rank. ${loser} loses ground. ${winT} keeps the ${method}, but ${loser} is going to remember this back at camp.`,
  ],
  reluctantSwitch: [
    (loser, losT, oldMethod, newMethod) => `${losT} reluctantly switches to ${newMethod}. ${loser} is muttering. "${oldMethod} was OUR play. We had it figured out." Now they're improvising.`,
    (loser, losT, oldMethod, newMethod) => `${losT} regroups. ${loser} sketches a new plan: ${newMethod}. Not their first choice. Not their second choice either, probably. But the bomb is ticking.`,
    (loser, losT, oldMethod, newMethod) => `Plan B for ${losT}: ${newMethod}. ${loser} doesn't love it. The tribe doesn't love it. They commit anyway because there's no other option.`,
    (loser, losT, oldMethod, newMethod) => `${loser} snaps. "Fine. ${newMethod}. Let's just GO." ${losT} pivots. Less time, less prep, less confidence. Welcome to the fallback.`,
  ],
};

const TRAMPOLINE_TEXT = {
  glory: [
    (n, pr) => `${n} bounces twice, then EXPLODES off the trampoline. ${pr.Sub} grabs the axe handle on the way up, twists in the air, and lands like a cat. The tribe loses its mind.`,
    (n, pr) => `One bounce. Two bounces. ${n} launches like a missile, snags the axe mid-arc, and somehow lands ON ${pr.posAdj} feet. "DID THAT JUST HAPPEN?!"`,
    (n, pr) => `${n} springs up with perfect form, ${pr.posAdj} hand closing around the axe haft like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} done it a thousand times. Crowd-pleaser.`,
    (n, pr) => `The trampoline launches ${n} into the air. ${pr.Sub} catches the axe one-handed and pulls. It comes loose. ${pr.Sub} lands hard but standing. Hero shot.`,
  ],
  partial: [
    (n, pr) => `${n} jumps, slaps the axe handle, doesn't quite get a grip. The axe wobbles in the totem. ${pr.Sub} crashes back to the trampoline. "Almost!"`,
    (n, pr) => `${n} bounces high, fingers brush the axe — and miss. ${pr.Sub} comes down rolling. Gives ${pr.posAdj} hand a shake. "I had it. I HAD it."`,
    (n, pr) => `Close. ${n} got air, got contact, got nothing in ${pr.posAdj} hand. The axe stays put. The trampoline mocks ${pr.obj}.`,
    (n, pr) => `${n} jumps with everything ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'}. ${pr.posAdj} fingertips touch the axe. Not enough. Land. Reset. Try again.`,
  ],
  slam: [
    (n, pr) => `${n} jumps too hard. Way too hard. ${pr.Sub} shoots PAST the axe and SLAMS into the totem. Bounces back. Lands on the trampoline upside down. The tribe winces.`,
    (n, pr) => `${n} miscalculates. The trampoline catapults ${pr.obj} sideways into the tree trunk. *THUNK*. ${pr.Sub} slides down. "I'm okay. I'm... okay."`,
    (n, pr) => `${n} pushes off too late. Comes up at a weird angle. Slams between the totem and the trampoline like a pinball. The crowd gasps. ${pr.Sub} gives a thumbs up. From the ground.`,
    (n, pr) => `${n} bounces, miscalculates, kicks the trampoline frame and lands FLAT on ${pr.posAdj} back. "OW." Long pause. "OW."`,
  ],
  chicken: [
    (n, pr) => `${n} steps onto the trampoline. Bounces. Bounces. Bounces. Doesn't actually JUMP. The tribe stares. "I'm warming up!" ${pr.Sub} insists.`,
    (n, pr) => `${n} climbs onto the trampoline, looks UP at the axe, looks down, climbs off. "Yeah, no. Someone else."`,
    (n, pr) => `${n} freezes mid-bounce. Doesn't go for the axe. Just bounces in place. The tribe yells. ${pr.Sub} bounces lower. Eventually stops.`,
  ],
};

// ── SAW-CLIMB BEAT TEXT ──
const SAWCLIMB_TEXT = {
  glory: [
    (n, pr) => `${n} grips the greased trunk and starts climbing like ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} part squirrel. Bark, knee, branch, REACH. ${pr.Sub} ${pr.sub === 'they' ? 'reach' : 'reaches'} the axe and rips it free.`,
    (n, pr) => `${n} doesn't bother with grace. Just MUSCLES up the tree, hand over hand, gets to the axe, rips it out. Slides down. "Done."`,
    (n, pr) => `${n} climbs steady, finds a branch, swings to the totem, and pries the axe loose with the saw as a lever. Engineering moment.`,
    (n, pr) => `Five seconds of climbing. Three seconds of axe-pulling. ${n} drops back down with the axe in hand. "What's next?"`,
  ],
  progress: [
    (n, pr) => `${n} climbs four feet. Slides down two. Climbs four more. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} making progress, but slowly. The tree is winning.`,
    (n, pr) => `${n} reaches the lower branch and pauses to catch ${pr.posAdj} breath. The axe is still ten feet up. ${pr.Sub} grits ${pr.posAdj} teeth.`,
    (n, pr) => `${n} climbs methodically, but the grease is making every grip a fight. Working on it.`,
    (n, pr) => `Slow but steady. ${n} is one-third of the way up. The tribe shouts encouragement. ${pr.Sub} doesn't have breath to shout back.`,
  ],
  fall: [
    (n, pr) => `${n} loses ${pr.posAdj} grip and SLIDES the entire trunk down. Bark burns. Pride scratched. ${pr.Sub} hits the ground in a cloud of leaves.`,
    (n, pr) => `${n} reaches the halfway mark and the grease wins. ${pr.Sub} drops six feet onto ${pr.posAdj} backside. "I HAD IT."`,
    (n, pr) => `${n}'s knee slips. Hand slips. Other hand slips. ${pr.Sub} slides down the tree like a fireman pole. Lands ungracefully. Stands up. Tries again.`,
    (n, pr) => `${n} loses contact at the worst possible moment and FALLS. Teammate dives to catch ${pr.obj}. They both go down in a heap.`,
  ],
  rescue: [
    (hero, faller, hpr, fpr) => `${faller} loses ${fpr.posAdj} grip and falls. ${hero} dives forward and catches ${fpr.obj} at the last second. Both end up tangled in the grass. ${faller} owes ${hero} dinner.`,
    (hero, faller, hpr, fpr) => `${hero} sees ${faller} slipping and PUSHES the trampoline under ${fpr.obj}. Soft landing. Crisis averted.`,
    (hero, faller, hpr, fpr) => `${faller} drops. ${hero} braces ${hpr.ref} and absorbs the impact. ${hpr.Sub} ${hpr.sub === 'they' ? 'grunt' : 'grunts'}. "Got you." The tribe applauds.`,
  ],
};

// ── HUMAN STACK BEAT TEXT ──
const STACK_TEXT = {
  engineer: [
    (n, pr) => `${n} sketches the stack in the dirt. "Strongest at the bottom. Mediums in the middle. Lightest at the apex. Pass me the saw." Tribe positions in like a drill team.`,
    (n, pr) => `${n} measures heights, arm spans, and weight distribution by eye. "${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} where everyone goes. Trust the engineer." Stack assembles.`,
    (n, pr) => `${n} doesn't even speak. Just points at people, points at positions. The tribe obeys. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} clearly the brain.`,
    (n, pr) => `${n} sketches three layouts in five seconds, picks one, says "this." The tribe forms up. Engineering, applied.`,
  ],
  base: [
    (n, pr) => `${n} drops into a low squat at the base of the stack. "Climb on. I won't move." ${pr.Sub} ${pr.sub === 'they' ? 'do not' : 'does not'} move. The stack rises.`,
    (n, pr) => `${n} braces against the tree, arms locked. "GO." Teammates climb onto ${pr.posAdj} shoulders. ${n}'s knees do not buckle.`,
    (n, pr) => `${n} forms half the foundation. Steady as concrete. Doesn't blink as the stack grows.`,
  ],
  middle: [
    (n, pr) => `${n} climbs onto the base layer and shouts down. "BRACE!" ${pr.Sub} balances perfectly. The next teammate climbs onto ${pr.obj}.`,
    (n, pr) => `${n} steps up to the middle tier. Wobbles. Stabilizes. Holds. The pyramid grows.`,
    (n, pr) => `${n} grips ${pr.posAdj} teammates' shoulders, finds ${pr.posAdj} balance, and locks in. The tower is rising.`,
  ],
  apex: [
    (n, pr) => `${n} scrambles up the stack, light as ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'}. Reaches the top. Grabs the axe. The whole tribe holds its breath.`,
    (n, pr) => `${n} reaches the apex and grips the totem for stability. The saw goes to work. *RASP RASP RASP.* The rope frays.`,
    (n, pr) => `${n} balances on the topmost shoulders, leans toward the axe, and pulls it free with a triumphant grunt. The stack quivers but holds.`,
  ],
  collapse: [
    (n, pr) => `The stack wobbles. Wobbles harder. COLLAPSES. ${n} comes down on top of two teammates. They all groan. "Reset!"`,
    (n, pr) => `${n} loses balance at the apex. The whole tower comes down like dominoes. Lots of arms and legs in a pile. Slowly, they untangle.`,
    (n, pr) => `Someone in the middle layer sneezes. Catastrophic. ${n} falls into the dirt. The tribe regroups, embarrassed.`,
    (n, pr) => `The base tier shifts. The middle tier panics. ${n} surfs the collapse to the ground. Nobody's hurt. Nobody's proud.`,
  ],
};

// ── SUPPORT ROLE TEXT (non-featured players) ──
const SUPPORT_TEXT = {
  holder: {
    good: [
      (n, pr) => `${n} grips the trampoline edge and PULLS. Taut as a drum. Every jump gets more altitude because ${pr.sub} won't let go.`,
      (n, pr) => `${n} braces the trampoline with ${pr.posAdj} body weight. Rock solid. The jumper goes higher because of it.`,
      (n, pr) => `${n} locks ${pr.posAdj} arms and keeps the surface tight. When the jumper lands, the bounce is perfect. That's ${n}'s work.`,
      (n, pr) => `${n} holds ${pr.posAdj} section of the trampoline like ${pr.posAdj} life depends on it. Consistent tension. The tribe's unsung hero.`,
    ],
    bad: [
      (n, pr) => `${n} loses ${pr.posAdj} grip on the trampoline edge. The surface goes slack on one side. The jumper's trajectory shifts. "HOLD IT!"`,
      (n, pr) => `${n}'s arms are shaking. The trampoline sags where ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} holding. Jumps are losing height.`,
      (n, pr) => `${n} steps wrong and the trampoline lurches sideways. The jumper comes down at an angle. Time lost.`,
      (n, pr) => `${n} can't keep the tension. Arms burning. The trampoline wobbles every bounce. It's costing the tribe.`,
    ],
  },
  spotter: {
    good: [
      (n, pr) => `${n} positions ${pr.ref} at the base of the tree, arms out. "I've got you if you slip." The climber pushes harder knowing the safety net is real.`,
      (n, pr) => `${n} spots from below, calling out handholds and branch positions. "LEFT! Higher! THERE!" Useful eyes on the ground.`,
      (n, pr) => `${n} steadies the base of the tree while the climber struggles above. Every shake dampened. Silent contribution.`,
      (n, pr) => `${n} passes up the saw hand-to-hand when the climber reaches the rope. Smooth relay. No time wasted.`,
    ],
    bad: [
      (n, pr) => `${n} is supposed to spot but keeps flinching away from the tree. "I don't want to get landed on!" Not helpful.`,
      (n, pr) => `${n} calls out bad directions. "Go right!" There's nothing right. The climber wastes energy on a dead-end branch.`,
      (n, pr) => `${n} accidentally kicks loose bark at the climber. Apologies mid-attempt. The climber's rhythm breaks.`,
      (n, pr) => `${n} tries to steady the tree but pushes too hard. The trunk sways. The climber above swears loudly.`,
    ],
  },
  brace: {
    good: [
      (n, pr) => `${n} drops to a knee and braces the base tier from the side. Extra stability. The tower doesn't wobble on ${pr.posAdj} watch.`,
      (n, pr) => `${n} wraps ${pr.posAdj} arms around the base layer's legs. Locked. The stack is anchored because ${n} won't budge.`,
      (n, pr) => `${n} acts as a counterweight, leaning into the stack when it tilts. Catches the wobble before it becomes a collapse.`,
      (n, pr) => `${n} spots the stack from outside, hands ready. When the middle tier shifts, ${pr.sub} pushes it back. Save.`,
    ],
    bad: [
      (n, pr) => `${n} bumps the base tier trying to help. The entire stack shudders. "DON'T TOUCH!" shouts the engineer.`,
      (n, pr) => `${n} tries to brace but ${pr.posAdj} footing is wrong. ${pr.Sub} slides and knocks into the bottom row. Everyone tenses.`,
      (n, pr) => `${n} panics when the stack wobbles and grabs the wrong person. Pulls instead of pushes. The wobble gets worse.`,
      (n, pr) => `${n} is supposed to brace but keeps stepping back in fear. "If that falls on me—" The tribe yells at ${pr.obj} to get in position.`,
    ],
  },
  carrier: {
    good: [
      (n, pr) => `${n} shoulders ${pr.posAdj} section of the totem and PUSHES. Legs churning. The tribe gains ground because of ${pr.posAdj} effort.`,
      (n, pr) => `${n} finds the rhythm — step, breathe, push. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} carrying more than ${pr.posAdj} share and doesn't complain.`,
      (n, pr) => `${n} switches to the heavy end when a teammate struggles. Absorbs the weight shift. Keeps the totem moving.`,
      (n, pr) => `${n} locks ${pr.posAdj} hands under the totem and lifts. Pure effort. The tribe picks up speed.`,
      (n, pr) => `${n} digs ${pr.posAdj} heels in and drives forward. The totem surges. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} the engine right now.`,
      (n, pr) => `${n} barks encouragement while shouldering the load. "WE'RE CLOSE!" The tribe responds. Tempo increases.`,
      (n, pr) => `${n} adjusts ${pr.posAdj} grip, redistributes weight, and the whole tribe moves smoother. Smart carrying.`,
      (n, pr) => `${n} is running on adrenaline. ${pr.Sub} hoists ${pr.posAdj} section higher and the totem practically glides.`,
    ],
    bad: [
      (n, pr) => `${n}'s legs buckle. ${pr.Sub} drops ${pr.posAdj} end of the totem for a second. Scrambles to pick it back up. Time lost.`,
      (n, pr) => `${n} trips on a root and the totem nose-dives. The tribe staggers. Two seconds to recover.`,
      (n, pr) => `${n} can't keep pace. The tribe slows to match ${pr.posAdj} speed. ${pr.Sub} is breathing hard. "Keep going, keep going..."`,
      (n, pr) => `${n} loses ${pr.posAdj} grip on the wet wood. The totem slips sideways. Chaos for a moment before the tribe corrects.`,
      (n, pr) => `${n}'s arms give out. The totem dips hard on ${pr.posAdj} side. Two teammates scramble to compensate.`,
      (n, pr) => `${n} stumbles on uneven ground. The whole tribe lurches. "WATCH YOUR FEET!" someone yells.`,
      (n, pr) => `${n} is fading fast. ${pr.posAdj} section of the totem keeps sagging. The tribe is dragging ${pr.obj} as much as the pole.`,
      (n, pr) => `${n} shifts ${pr.posAdj} grip wrong and the totem rotates. Everyone has to stop and readjust. Precious seconds gone.`,
    ],
  },
};

// ── WILDLIFE ENCOUNTERS ──
const WILDLIFE_TEXT = {
  squirrel: [
    (t, victim, vpr) => `A squirrel SPRINTS across ${t}'s rope and starts gnawing. The tribe yells. ${victim} swats at it. The squirrel drops a nut on ${vpr.posAdj} head and flees.`,
    (t, victim, vpr) => `Squirrel attack. The little bastard runs along the rope, NIBBLES, and the rope frays. ${victim} grabs a stick to chase it. The damage is done.`,
    (t, victim, vpr) => `${victim} is mid-attempt when a squirrel leaps onto ${vpr.posAdj} shoulder. ${vpr.Sub} ${vpr.sub === 'they' ? 'shriek' : 'shrieks'}. The squirrel takes a bite and sprints off with a piece of ${vpr.posAdj} sleeve.`,
  ],
  raccoon: [
    (t, victim, vpr) => `A raccoon ambles into camp like ${pronouns(victim).sub} ${pronouns(victim).sub === 'they' ? 'own' : 'owns'} the place. Picks up ${t}'s axe. Walks away with it. The tribe stares in disbelief.`,
    (t, victim, vpr) => `Raccoon. Bandit mask. Steals the saw right out of ${victim}'s hand. ${victim} chases it for forty feet before giving up.`,
    (t, victim, vpr) => `${t} watches a raccoon climb the trampoline, sit on it, and refuse to move. ${victim} tries to shoo it. The raccoon hisses. Stalemate.`,
  ],
  beaver: [
    (t, victim, vpr) => `A beaver waddles up to ${t}'s tree and starts gnawing. Helpfully? Maliciously? The tribe can't tell. The trunk is getting thinner either way.`,
    (t, victim, vpr) => `${victim} watches in horror as a beaver attacks the totem support. Random sabotage. Or random help. Coin flip.`,
    (t, victim, vpr) => `Beaver. Big one. Sits at the base of ${t}'s tree and gnaws. The tribe debates whether to stop it or thank it.`,
  ],
  bear: [
    (t, victim, vpr) => `A BEAR ambles out of the brush. Not a small bear. ${t} freezes. ${victim} backs up so slowly ${pronouns(victim).sub} ${pronouns(victim).sub === 'they' ? 'are' : 'is'} barely moving. The bear sniffs the trampoline and walks off, bored.`,
    (t, victim, vpr) => `Bear. ${victim} sees it first. "${vpr.posAdj.toUpperCase()} EYES." The tribe drops to a crouch. The bear regards them, decides they're not food, ambles into the woods. Took two minutes off the clock.`,
    (t, victim, vpr) => `Bear emerges. Big claws. Bigger yawn. ${victim} slowly hides behind ${vpr.posAdj} teammate. Everyone freezes. The bear scratches an itch and leaves. Scariest two minutes of ${t}'s lives.`,
  ],
  skunk: [
    (t, victim, vpr) => `Skunk. ${t} smells it before they see it. ${victim} steps wrong and the skunk SPRAYS. The whole tribe gags. Progress halts while everyone re-evaluates ${pronouns(victim).posAdj} life choices.`,
    (t, victim, vpr) => `${victim} reaches for the saw and notices a skunk three feet away with its tail RAISED. ${vpr.Sub} freezes. The skunk waits. Tense seconds pass.`,
    (t, victim, vpr) => `Skunk waddles right into ${t}'s working area. Tail twitches. ${victim} backs up VERY slowly. The skunk leaves of its own accord. Crisis 95% averted.`,
  ],
  hawk: [
    (t, victim, vpr) => `A hawk dive-bombs ${t}'s setup. ${victim} ducks. Talons SHRED ${vpr.posAdj} sleeve. The hawk wheels for another pass. The tribe scatters.`,
    (t, victim, vpr) => `Hawk. Big one. Comes out of the sun and SWOOPS at the trampoline. ${victim} swings at it with whatever's in ${vpr.posAdj} hand. The hawk veers off with a shriek.`,
    (t, victim, vpr) => `A hawk circles ${t} like ${pronouns(victim).sub} ${pronouns(victim).sub === 'they' ? 'are' : 'is'} prey. ${victim} grabs a tree branch as a weapon. The hawk reconsiders.`,
  ],
  defended: [
    (hero, t, hpr) => `${hero} doesn't hesitate — grabs a stick and CHARGES the animal. It scampers off. The tribe cheers. ${hero} tries to look casual.`,
    (hero, t, hpr) => `${hero} sees the threat and physically interposes ${hpr.ref} between the animal and ${hpr.posAdj} tribemates. The animal blinks first.`,
    (hero, t, hpr) => `${hero} bellows and waves ${hpr.posAdj} arms. The animal isn't impressed for a moment. Then it is. It leaves. ${hero} exhales.`,
  ],
};

// ── BOMB TIMER TEXT ──
const BOMB_TEXT = {
  tick: [
    t => `The bomb beeps faster. ${t}'s rope is two-thirds cut. They need to hustle.`,
    t => `Sparks pop from the bomb's casing. ${t} works faster. The axe rises and falls.`,
    t => `The timer reads 2:14. ${t} hears it. ${t} does not look at it. ${t} cannot afford to look at it.`,
    t => `The bomb's LED is now red. Solid red. ${t} cuts and cuts and cuts.`,
  ],
  closeCall: [
    t => `${t}'s totem hits the ground with FOUR SECONDS on the timer. The tribe collapses in relief and exhaustion. The bomb hits the ground. Doesn't go off. Yet.`,
    t => `${t} cuts the last fiber with the timer at 0:08. The totem falls. The bomb sputters... and stops. The tribe screams.`,
    t => `${t} drops the totem with two seconds to spare. Two. The bomb beeps twice and dies. Standing ovation from the cameras.`,
  ],
  detonate: [
    (t, victim, vpr) => `BOOM. ${t}'s totem EXPLODES. Splinters everywhere. ${victim} catches the worst of it — face blackened, eyebrows GONE — but ${vpr.sub} stand${vpr.sub === 'they' ? '' : 's'} up and gives a thumbs up. "STILL HERE." The crowd loses its mind.`,
    (t, victim, vpr) => `The bomb goes off. ${t}'s totem is now confetti. ${victim} walks out of the smoke with ${vpr.posAdj} hair on fire and a defiant grin. "DID WE WIN?" ${vpr.Sub} ${vpr.sub === 'they' ? 'have' : 'has'} not won. But the tribe loves ${vpr.obj}.`,
    (t, victim, vpr) => `KA-BOOM. The totem becomes mulch. ${victim} is the closest. ${vpr.Sub} ${vpr.sub === 'they' ? 'sit' : 'sits'} up in the smoke, charcoal-faced, and says, "Did anyone get that on camera?"`,
    (t, victim, vpr) => `Detonation. ${t}'s rope fails to be cut in time and the bomb does its job. ${victim} survives. Soot-covered. Hair singed. Smiling. The tribe pulls ${vpr.obj} out of the crater.`,
  ],
};

const BOMB_THRESHOLD = 14;

// ── RACE BEAT TEXT ──
const RACE_TEXT = {
  waterfall: {
    smooth: [
      (t, n, pr) => `${t}'s totem sails over the waterfall edge. ${n} grips the front and lets out a war cry. The drop is exhilarating. They land in the river going FAST.`,
      (t, n, pr) => `${n} leans forward at the falls and rides the totem like a surfboard. ${pr.posAdj} tribe matches ${pr.posAdj} weight shift. They thread the drop perfectly.`,
      (t, n, pr) => `Clean drop for ${t}. ${n} keeps the line straight. The water catches them, the current grabs them, they're moving.`,
    ],
    rough: [
      (t, n, pr) => `${t}'s totem hits the falls sideways. ${n} loses ${pr.posAdj} grip and goes flying. Lands in the water. Gets pulled along by ${pr.posAdj} ankle. Embarrassing but functional.`,
      (t, n, pr) => `${n} miscalculates the drop. The totem nose-dives. The tribe gets airborne for a worrying second. Lands hard. Keeps going.`,
      (t, n, pr) => `Half of ${t} flips off the totem at the falls. They flounder back on. The totem doesn't wait. Time bleeds.`,
    ],
    splinter: [
      (t, n, pr) => `${t}'s bomb-damaged totem hits the falls and CRACKS. A piece breaks off. ${n} watches it float away. They keep riding what's left.`,
      (t, n, pr) => `${t}'s totem isn't holding up. Splinters fly. ${n} grips harder. The tribe debates whether to abandon ship.`,
    ],
  },
  slope: {
    smooth: [
      (t, n, pr) => `${t} hits the slope and the totem surges. ${n} adjusts ${pr.posAdj} weight to keep it straight. Everyone leans into the curve.`,
      (t, n, pr) => `${n} keeps the totem on the line. ${pr.posAdj} tribe is pure muscle and balance. They GAIN ground.`,
      (t, n, pr) => `${t} carves down the slope. ${n} whoops. The totem responds. Beautiful run.`,
    ],
    rough: [
      (t, n, pr) => `${t}'s totem catches a rut. ${n} nearly flies off. ${pr.Sub} ${pr.sub === 'they' ? 'grab' : 'grabs'} a teammate's leg and stays on. Barely.`,
      (t, n, pr) => `Bad line. ${t} skids sideways. ${n} fights to straighten it. They lose two seconds.`,
      (t, n, pr) => `${t} hits a tree root. The totem launches. ${n} airborne. Lands. Keeps going somehow.`,
    ],
  },
  finalStretch: {
    smooth: [
      (t, n, pr) => `${t} tears through the final stretch. ${n} leans into it like a luger. The camp comes into view.`,
      (t, n, pr) => `Final hundred meters. ${n} screams in triumph. The tribe holds on. The totem is FAST.`,
    ],
    rough: [
      (t, n, pr) => `${t} is moments from the finish but the totem won't track straight. ${n} corrects. Corrects again. They make it but it's ugly.`,
      (t, n, pr) => `${t} crashes through the final stretch sideways. ${n} grips with both hands. Camp gets closer.`,
    ],
  },
  cling: {
    hold: [
      (n, pr) => `${n} clings to the totem with white-knuckle grip. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not letting go. Not for the team. For ${pr.ref}.`,
      (n, pr) => `${n} adjusts ${pr.posAdj} weight at the right moment. Saves ${pr.ref} from a fall.`,
    ],
    fall: [
      (n, pr) => `${n} loses ${pr.posAdj} grip and FLIES off the totem. Lands in the dirt. Watches the totem disappear without ${pr.obj}.`,
      (n, pr) => `${n} bounces off the totem at a curve. ${pr.Sub} ${pr.sub === 'they' ? 'tumble' : 'tumbles'} for thirty feet. Walks the rest of the way to camp.`,
    ],
    save: [
      (hero, faller, hpr, fpr) => `${faller} starts to slide. ${hero} grabs ${fpr.posAdj} arm just in time. Pulls ${fpr.obj} back. They both grin.`,
      (hero, faller, hpr, fpr) => `${hero} sees ${faller} slipping and braces a leg as a barrier. ${faller} catches ${fpr.ref} on it. Survives.`,
    ],
    shove: [
      (villain, target, vpr, tpr) => `${villain} sees ${target} losing balance and... helps the process. A nudge. ${target} flies off the totem. The tribe doesn't see it. ${vpr.Sub} ${vpr.sub === 'they' ? 'do not' : 'does not'} acknowledge it.`,
      (villain, target, vpr, tpr) => `${villain} plants ${vpr.posAdj} hand on ${target}'s back at exactly the wrong moment. ${target} goes down. ${vpr.Sub} ${vpr.sub === 'they' ? 'shrug' : 'shrugs'}. "Slippery."`,
    ],
    shoveCaught: [
      (villain, target, witness, vpr, tpr) => `${witness} sees the shove. Sees ${villain}'s face. Sees the smile. The tribe is going to hear about this back at camp.`,
      (villain, target, witness, vpr, tpr) => `${witness} caught it. ${villain} pretends ${pronouns(villain).sub} ${pronouns(villain).sub === 'they' ? 'did not' : 'did not'}. ${witness} did not buy that for a second.`,
    ],
  },
};

// ── CABIN PICK + SMASH ──
const CABIN_TEXT = {
  pick: [
    (winnerTribe, picker, pr) => `${winnerTribe} crosses first! ${picker} steps forward. "We pick the LUXURY cabin. Obviously." The tribe cheers. The losers glower.`,
    (winnerTribe, picker, pr) => `${picker} surveys the two cabins like a king choosing a throne. "Luxury. Done." The tribe celebrates.`,
    (winnerTribe, picker, pr) => `"You think we're going to sleep in the regular one?" ${picker} laughs. "${winnerTribe} takes the LUXURY cabin." Air horn from somewhere.`,
    (winnerTribe, picker, pr) => `${picker} doesn't even hesitate. "Luxury. We earned it." ${winnerTribe} starts moving in.`,
  ],
  smash: [
    (loserTribe, riderName, riderPr) => `${loserTribe}'s totem comes down the slope at MAXIMUM VELOCITY. ${riderName} screams. The totem CRASHES through the luxury cabin. SPLINTERS EVERYWHERE. The cabin is now art.`,
    (loserTribe, riderName, riderPr) => `${loserTribe}'s totem doesn't stop at the finish line. It just KEEPS GOING. Through the door. Through the wall. The luxury cabin is a memory now.`,
    (loserTribe, riderName, riderPr) => `${loserTribe}'s totem hits the camp at full speed and demolishes the luxury cabin. ${riderName} climbs out of the wreckage. "Did we lose?" ${riderPr.Sub} ${riderPr.sub === 'they' ? 'have' : 'has'} lost. Spectacularly.`,
    (loserTribe, riderName, riderPr) => `The losers' totem becomes a battering ram. The luxury cabin becomes a building permit issue. Chris cackles like a maniac.`,
  ],
  helicopter: [
    h => `A helicopter thunders overhead. A standard cabin dangles from a cable. Drops it precisely on the smoking crater. ${h} salutes the pilot.`,
    h => `Chopper rolls in. New cabin: regulation. Plain. Drops it where the luxury one used to be. ${h} grins. "Welcome to the budget!"`,
    h => `The replacement cabin descends. Slowly. Deliberately. Lands with a thud. ${h} writes something on a clipboard. "We're billing this to legal."`,
  ],
  reactionWinners: [
    (n, pr) => `${n} stares at the wreckage. "Did... did we win? Or did we lose? What is happening?"`,
    (n, pr) => `${n} is laughing too hard to speak. "It's GONE. The whole cabin is GONE. WE WON. WE WON SO HARD."`,
    (n, pr) => `${n} surveys the rubble where ${pr.posAdj} luxury accommodations used to be. "On the upside, no neighbors."`,
  ],
  reactionLosers: [
    (n, pr) => `${n} climbs out of the totem wreckage and looks at the destroyed cabin. "I... we... I'm sorry?" ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} actually proud.`,
    (n, pr) => `${n} dusts ${pr.ref} off and grins. "WORTH IT. They won the race but we won the day."`,
  ],
  reactionMiddle: [
    (n, pr) => `${n} watches both the celebration AND the destruction. "We didn't win. We didn't lose. We're just... here." ${pr.Sub} shrugs.`,
    (n, pr) => `${n} looks at the winners, then the losers. "Second place. The reward is: nothing happens to us." ${pr.Sub} seems fine with this.`,
    (n, pr) => `"We're safe," ${n} says quietly to ${pr.posAdj} tribe. "That's all that matters tonight." ${pr.Sub} watches the chaos unfold without joining it.`,
    (n, pr) => `${n} collapses on the ground between the celebration and the wreckage. "Nobody's talking about us. Good. Let's keep it that way."`,
  ],
};

// ── METHOD WAR (post-loss blame) ──
const METHOD_WAR_TEXT = [
  (champion, rival, method, altMethod, cpr) => `${rival} doesn't even hide it. "I TOLD you we should have done ${altMethod}. We picked ${method} and we LOST. This is on ${champion}." The tribe murmurs agreement.`,
  (champion, rival, method, altMethod, cpr) => `Back at camp, ${rival} corners the tribe. "${champion}'s plan failed. We're at tribal because of ${method}. We should have done ${altMethod}." Heads nod.`,
  (champion, rival, method, altMethod, cpr) => `"${champion}, I love you, but ${method}? Really?" ${rival} shakes ${pronouns(rival).posAdj} head. "${altMethod} was right there. I said so. So did half of us."`,
  (champion, rival, method, altMethod, cpr) => `${rival} stands up at camp. "We need to talk about who pushed us into ${method}. ${champion}. That's who. And now we're voting someone out."`,
  (champion, rival, method, altMethod, cpr) => `The tribe discusses without ${champion} present. "${champion} bullied us into ${method}. ${altMethod} was the right call. I'm not voting with ${champion} tonight." Heat is real.`,
];

// ── SOCIAL EVENTS — EP 1 (FIRST IMPRESSIONS) ──
const SOCIAL_EP1 = {
  spark: [
    (a, b, apr, bpr) => `${a} catches ${b}'s eye across the chaos. A smile. ${b} smiles back. Something just clicked between them. Worth remembering.`,
    (a, b, apr, bpr) => `In the middle of the bomb-timer panic, ${a} reaches out and steadies ${b}. Their hands linger half a second too long. The crowd misses it. They don't.`,
    (a, b, apr, bpr) => `${a} laughs at something ${b} said and ${bpr.posAdj} eyes light up. First-day chemistry. Unpredictable.`,
  ],
  instantBond: [
    (a, b, apr, bpr) => `${a} and ${b} share a look during the chaos. Both grin. Mid-disaster, an alliance is born without a word being said.`,
    (a, b, apr, bpr) => `${a} hands ${b} the saw without being asked. ${b} nods. Trust in two seconds.`,
    (a, b, apr, bpr) => `${a} cracks a joke. ${b} is the only one who laughs. They both notice. They both file it away.`,
  ],
  instantFriction: [
    (a, b, apr, bpr) => `${a} bumps ${b} mid-attempt. Maybe accidentally. ${b} doesn't think so. First-day grudge born.`,
    (a, b, apr, bpr) => `${a} and ${b} both reach for the saw at the same time. Brief tug-of-war. ${a} wins. ${b} did not enjoy that.`,
    (a, b, apr, bpr) => `${a} tells ${b} how to do something. ${b} did not ask. The look ${b} gives ${a} could curdle milk.`,
  ],
  archetypeClash: [
    (a, b, apr, bpr) => `${a} (the hero) and ${b} (the villain) lock eyes. They know what the other is. The next dozen episodes are going to be a war.`,
    (a, b, apr, bpr) => `${a} catches ${b} watching the chaos with too much enjoyment. "${a}'s gonna be a problem," ${b} thinks. The feeling is mutual.`,
  ],
  earlyAlliance: [
    (a, b, apr, bpr) => `${a} pulls ${b} aside between attempts. "We make it past tonight, we should stick together. Yeah?" ${b} nods slowly. "Yeah."`,
    (a, b, apr, bpr) => `${a} and ${b} agree, in maybe ten words, to look out for each other. First alliance of the season. Don't tell anybody.`,
  ],
};

// ── SOCIAL EVENTS — LATER EPISODES ──
const SOCIAL_LATER = {
  voteWhisper: [
    (a, b, target, apr) => `${a} drops back to ${b} during the chaos. "${target}. Tonight. Right?" ${b} nods. The pact is sealed in dust and adrenaline.`,
    (a, b, target, apr) => `Mid-disaster, ${a} and ${b} have the conversation. "${target}." Two-word agreement. Done.`,
  ],
  alliance: [
    (a, b, apr) => `${a} and ${b} fall into step during the climb. "Final two if we make it?" ${b} doesn't even hesitate. "Yeah."`,
    (a, b, apr) => `${a} hands ${b} the saw mid-attempt. ${b} hands it back. Without speaking, they confirm: still us against them.`,
  ],
  rivalry: [
    (a, b, apr) => `${a} and ${b} clash again. ${a} mutters something. ${b} hears it. Old wounds, freshly bleeding.`,
    (a, b, apr) => `${a} sabotages ${b}'s grip — subtly, but visibly. The tribe pretends not to notice. The rivalry just deepened.`,
  ],
  showmance: [
    (a, b, apr, bpr) => `${a} catches ${b} during a slip. Their faces inches apart. The challenge fades for half a second. The tribe coughs to break the spell.`,
    (a, b, apr, bpr) => `${a} and ${b} share a private laugh during the totem ride. The tribe sees it. The cameras LOVE it.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════

export function simulateBiggerBadderBrutaler(ep) {
  _resetPickCache();
  const tribes = gs.tribes;
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribes.forEach(t => t.members.forEach(m => { ep.chalMemberScores[m] = 0; }));

  const isEp1 = (gs.episode || 1) === 1;

  const result = {
    tribes: {},
    phase1: { debates: [], interTribeConflicts: [] },
    phase2: { beats: [], wildlife: [], bombResults: [] },
    phase3: { raceBeats: [], cabinPick: null, cabinSmash: null, helicopter: null, socialEvents: [] },
    socialEvents: [],
    tribeFinishOrder: [],
    hostLines: {
      intro: pick(HOST_TEXT.intro)(host()),
      phase1: pick(HOST_TEXT.phase1)(host()),
      phase2: pick(HOST_TEXT.phase2)(host()),
      phase3: pick(HOST_TEXT.phase3)(host()),
      finale: pick(HOST_TEXT.finale)(host()),
    },
    isEp1,
  };

  tribes.forEach(t => { result.tribes[t.name] = { name: t.name, members: [...t.members], method: null, fitMod: 0, totemCondition: 100, p1Score: 0, p2Score: 0, p3Score: 0, finalScore: 0, bombDetonated: false, bombVictim: null }; });

  // ══════════════════════════════════════════════════════════
  // PHASE 1 — METHOD PICK (Contested Debate)
  // ══════════════════════════════════════════════════════════
  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];

    // Each method gets a champion
    const trampChampion = [...members].sort((a, b) => (pStats(b).boldness + pStats(b).physical) - (pStats(a).boldness + pStats(a).physical))[0];
    const sawChampion = [...members].filter(m => m !== trampChampion).sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance))[0] || trampChampion;
    const stackChampion = [...members].filter(m => m !== trampChampion && m !== sawChampion).sort((a, b) => (pStats(b).mental + pStats(b).strategic) - (pStats(a).mental + pStats(a).strategic))[0] || trampChampion;

    const championList = [
      { name: trampChampion, method: 'trampoline', stat: pStats(trampChampion).boldness + pStats(trampChampion).physical },
      { name: sawChampion, method: 'sawclimb', stat: pStats(sawChampion).physical + pStats(sawChampion).endurance },
      { name: stackChampion, method: 'stack', stat: pStats(stackChampion).mental + pStats(stackChampion).strategic },
    ];

    // Each champion advocates
    const advocacy = championList.map(c => {
      const cpr = pronouns(c.name);
      return {
        champion: c.name,
        method: c.method,
        text: _pickUnique(METHOD_ADVOCATE[c.method], `advocate-${c.method}-${c.name}`)(c.name, cpr),
      };
    });

    // Cross-faction interjections (1-2 per tribe)
    const interjections = [];
    const usedInterjectors = new Set([trampChampion, sawChampion, stackChampion]);
    const interjectorPool = members.filter(m => !usedInterjectors.has(m));
    const numInterject = interjectorPool.length >= 2 ? 2 : interjectorPool.length;

    for (let i = 0; i < numInterject; i++) {
      if (!interjectorPool.length) break;
      const idx = Math.floor(Math.random() * interjectorPool.length);
      const interjector = interjectorPool.splice(idx, 1)[0];
      const ipr = pronouns(interjector);
      const a = arch(interjector);
      let pool = METHOD_INTERJECT.socialButterfly;
      if (a === 'hothead') pool = METHOD_INTERJECT.hothead;
      else if (a === 'hero') pool = METHOD_INTERJECT.hero;
      else if (['villain', 'mastermind'].includes(a)) pool = METHOD_INTERJECT.villain;
      else if (a === 'schemer') pool = METHOD_INTERJECT.schemer;
      else if (a === 'social-butterfly') pool = METHOD_INTERJECT.socialButterfly;
      else if (['loyal-soldier', 'underdog'].includes(a)) pool = a === 'underdog' ? METHOD_INTERJECT.underdog : METHOD_INTERJECT.loyal;
      else if (a === 'challenge-beast') pool = METHOD_INTERJECT.challenge;

      const target = pick(championList).name;
      interjections.push({
        speaker: interjector,
        archetype: a,
        target,
        text: pick(pool)(interjector, ipr, target),
      });
    }

    // Persuasion roll — each champion's case is judged
    const championRolls = championList.map(c => {
      const cs = pStats(c.name);
      const supportBonus = members.filter(m => m !== c.name).reduce((acc, m) => acc + Math.max(0, getBond(c.name, m)) * 0.15, 0);
      const roll = cs.social * 0.4 + cs.strategic * 0.3 + c.stat * 0.05 + supportBonus + noise(2.5);
      return { ...c, roll };
    }).sort((a, b) => b.roll - a.roll);

    const winner = championRolls[0];
    const losers = championRolls.slice(1);

    // Compute fit for the chosen method
    const tribeStats = members.reduce((acc, m) => {
      const s = pStats(m);
      acc.physical += s.physical; acc.boldness += s.boldness;
      acc.endurance += s.endurance; acc.mental += s.mental;
      acc.strategic += s.strategic; acc.social += s.social;
      return acc;
    }, { physical: 0, boldness: 0, endurance: 0, mental: 0, strategic: 0, social: 0 });
    const memberCount = members.length || 1;
    Object.keys(tribeStats).forEach(k => tribeStats[k] /= memberCount);

    let fitScore = 0;
    if (winner.method === 'trampoline') fitScore = tribeStats.boldness + tribeStats.physical;
    else if (winner.method === 'sawclimb') fitScore = tribeStats.physical + tribeStats.endurance;
    else if (winner.method === 'stack') fitScore = tribeStats.mental + tribeStats.strategic;

    // Fit modifier: above 12 (good for that pair) = +1.5, below 8 = -1.5, between = lerp
    let fitMod = 0;
    if (fitScore >= 12) fitMod = 1.5;
    else if (fitScore <= 8) fitMod = -1.5;
    else fitMod = ((fitScore - 10) / 2) * 1.5;

    const winnerPr = pronouns(winner.name);
    const methodLabel = winner.method === 'trampoline' ? 'TRAMPOLINE' : winner.method === 'sawclimb' ? 'SAW & CLIMB' : 'HUMAN STACK';
    const decisionText = pick(METHOD_DECISION.win)(winner.name, methodLabel, winnerPr);
    const fitText = fitMod >= 0.5 ? pick(METHOD_DECISION.goodFit)(winner.name, methodLabel) : (fitMod <= -0.5 ? pick(METHOD_DECISION.badFit)(winner.name, methodLabel) : null);

    // Per-player score outcomes
    ep.chalMemberScores[winner.name] = (ep.chalMemberScores[winner.name] || 0) + 2;
    popDelta(winner.name, 1);
    losers.forEach(l => {
      ep.chalMemberScores[l.name] = (ep.chalMemberScores[l.name] || 0) - 0.5;
    });

    // ── BOND CONSEQUENCES (intra-tribe) ──
    // Pre-existing supporters lean further into winner
    members.filter(m => m !== winner.name && getBond(m, winner.name) > 0).forEach(m => addBond(m, winner.name, 0.2));
    // Champion-to-rival friction: losing champions don't love the winning champion right now
    losers.forEach(l => addBond(winner.name, l.name, -0.3));
    // Interjectors who supported the winning method gain bond with the winner; those who supported a losing method lose bond
    interjections.forEach(it => {
      if (!it.target) return;
      // it.target is the name of a champion the interjector backed
      if (it.target === winner.name) {
        addBond(it.speaker, winner.name, 0.3);
      } else {
        // backed a losing champion — small friction with the winner
        addBond(it.speaker, winner.name, -0.2);
      }
    });

    result.phase1.debates.push({
      tribe: tName,
      champions: championList,
      championRolls,  // preserved for inter-tribe conflict re-pick
      tribeStats,     // preserved for fit recomputation
      advocacy,
      interjections,
      winner: winner.name,
      method: winner.method,
      methodLabel,
      losers: losers.map(l => ({ name: l.name, method: l.method })),
      decisionText,
      fitText,
      fitMod,
    });

    result.tribes[tName].method = winner.method;
    result.tribes[tName].methodLabel = methodLabel;
    result.tribes[tName].champion = winner.name;
    result.tribes[tName].rivalChampions = losers.map(l => ({ name: l.name, method: l.method }));
    result.tribes[tName].fitMod = fitMod;
    result.tribes[tName].p1Score = 2; // small tribe-level credit for finishing the debate
  });

  // ══════════════════════════════════════════════════════════
  // PHASE 1B — INTER-TRIBE METHOD CONFLICT RESOLUTION
  // ══════════════════════════════════════════════════════════
  // No two tribes can use the same method. Cross-tribe persuasion battles
  // resolve collisions; the loser falls back to their next-preferred method.
  const _getPreferences = (tName) => {
    const debate = result.phase1.debates.find(d => d.tribe === tName);
    return debate ? debate.championRolls : [];
  };
  const _recomputeFitFor = (tName, newMethod) => {
    const debate = result.phase1.debates.find(d => d.tribe === tName);
    const ts = debate?.tribeStats;
    if (!ts) return 0;
    let fitScore = 0;
    if (newMethod === 'trampoline') fitScore = ts.boldness + ts.physical;
    else if (newMethod === 'sawclimb') fitScore = ts.physical + ts.endurance;
    else if (newMethod === 'stack') fitScore = ts.mental + ts.strategic;
    if (fitScore >= 12) return 1.5;
    if (fitScore <= 8) return -1.5;
    return ((fitScore - 10) / 2) * 1.5;
  };

  let _conflictSafety = 0;
  while (_conflictSafety++ < 6) {
    // Build current claims
    const claims = {};
    tribes.forEach(t => {
      const m = result.tribes[t.name].method;
      (claims[m] = claims[m] || []).push(t.name);
    });
    const contestedMethod = Object.keys(claims).find(m => claims[m].length > 1);
    if (!contestedMethod) break;
    const claimantTribes = claims[contestedMethod];

    // Cross-tribe persuasion battle — boldness + social + physical assertion + tribe support
    const battleRolls = claimantTribes.map(tName => {
      const champion = result.tribes[tName].champion;
      const cs = pStats(champion);
      const tribe = tribes.find(t => t.name === tName);
      const supportBonus = tribe.members
        .filter(m => m !== champion)
        .reduce((acc, m) => acc + Math.max(0, getBond(champion, m)) * 0.1, 0);
      const roll = cs.boldness * 0.4 + cs.social * 0.3 + cs.physical * 0.2 + supportBonus + noise(2.5);
      return { tribe: tName, champion, roll };
    }).sort((a, b) => b.roll - a.roll);

    const winnerClaim = battleRolls[0];
    const loserClaims = battleRolls.slice(1);
    const methodLabel = methodLabelFor(contestedMethod);

    // Cross-tribe rivalry: winner champion <-> losing rival champions get bond hits
    loserClaims.forEach(lc => addBond(winnerClaim.champion, lc.champion, -0.5));
    popDelta(winnerClaim.champion, 1);

    // Determine which methods are now "claimed" (winner keeps it; non-conflicting tribes keep theirs)
    const claimedMethods = new Set([contestedMethod]);
    tribes.forEach(t => {
      if (!claimantTribes.includes(t.name)) claimedMethods.add(result.tribes[t.name].method);
    });

    // Loser tribes pivot to next preference not yet claimed
    const losersUpdated = loserClaims.map(lc => {
      const prefs = _getPreferences(lc.tribe);
      const fallback = prefs.find(p => !claimedMethods.has(p.method)) || prefs[1] || prefs[0];
      const newMethodLabel = methodLabelFor(fallback.method);

      // Update tribe state
      result.tribes[lc.tribe].method = fallback.method;
      result.tribes[lc.tribe].methodLabel = newMethodLabel;
      result.tribes[lc.tribe].champion = fallback.name;
      result.tribes[lc.tribe].fitMod = _recomputeFitFor(lc.tribe, fallback.method);
      claimedMethods.add(fallback.method);

      // Camp event: the rivalry is documented
      ep.campEvents[lc.tribe].post.push({
        type: 'brutalerMethodLost',
        players: [lc.champion, winnerClaim.champion],
        text: `${lc.tribe} lost the ${methodLabel.toLowerCase()} to ${winnerClaim.tribe} in a cross-tribe shouting match. ${lc.champion} blames ${winnerClaim.champion} personally. They had to pivot to ${newMethodLabel.toLowerCase()}.`,
        consequences: `Bond -0.5 with ${winnerClaim.champion}. Method downgraded to ${newMethodLabel.toLowerCase()}.`,
        badgeText: 'METHOD STOLEN', badgeClass: 'badge-warning',
      });

      return {
        tribe: lc.tribe,
        champion: lc.champion,
        fallbackSpeaker: fallback.name,
        isFallback: true,
        oldMethod: contestedMethod,
        oldMethodLabel: methodLabel,
        newMethod: fallback.method,
        newMethodLabel,
        switchText: pick(INTER_TRIBE_RESOLUTION.reluctantSwitch)(fallback.name, lc.tribe, methodLabel, newMethodLabel),
      };
    });

    // Camp event for the winner — they took it and it cost them goodwill
    ep.campEvents[winnerClaim.tribe].post.push({
      type: 'brutalerMethodWon',
      players: [winnerClaim.champion, ...loserClaims.map(lc => lc.champion)],
      text: `${winnerClaim.tribe} won the cross-tribe ${methodLabel.toLowerCase()} dispute. ${winnerClaim.champion} bullied ${loserClaims.map(lc => lc.champion).join(' and ')} off the method.`,
      consequences: `+1 popularity for ${winnerClaim.champion}. Cross-tribe bond -0.5 with rivals.`,
      badgeText: 'METHOD CLAIMED', badgeClass: 'badge-info',
    });

    result.phase1.interTribeConflicts.push({
      method: contestedMethod,
      methodLabel,
      claimantTribes: [...claimantTribes],
      winnerClaim,
      loserClaims,
      losersUpdated,
      advocacyText: pick(INTER_TRIBE_CONFLICT[contestedMethod])(winnerClaim.champion, winnerClaim.tribe, loserClaims[0].champion, loserClaims[0].tribe),
      resolutionText: pick(INTER_TRIBE_RESOLUTION.win)(winnerClaim.champion, winnerClaim.tribe, loserClaims[0].champion, loserClaims[0].tribe, methodLabel),
    });
  }

  // ══════════════════════════════════════════════════════════
  // PHASE 2 — AXE RETRIEVAL & TOTEM CUT
  // ══════════════════════════════════════════════════════════
  // Each tribe runs method-specific beats. Bomb timer ticks across beats.
  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];
    const tData = result.tribes[tName];
    const method = tData.method;
    const fitMod = tData.fitMod;
    const beats = [];
    let timeSpent = 0;
    let cutProgress = 0; // need to reach ~10 to fully cut

    // 3-4 method beats per tribe
    const numBeats = Math.random() < 0.5 ? 4 : 3;

    if (method === 'trampoline') {
      // Trampoline: 3-4 jumpers attempt the axe, rest hold the trampoline
      const jumpers = [...members].sort((a, b) => (pStats(b).boldness + pStats(b).physical) - (pStats(a).boldness + pStats(a).physical)).slice(0, numBeats);
      const holders = members.filter(m => !jumpers.includes(m));
      jumpers.forEach((name, i) => {
        const s = pStats(name);
        const pr = pronouns(name);
        const roll = s.boldness * 0.5 + s.physical * 0.4 + fitMod + noise(2.5);
        let outcome, text, scoreDelta = 0, progress = 0, time = 1.5;
        if (roll >= 8) {
          outcome = 'glory'; text = _pickUnique(TRAMPOLINE_TEXT.glory, `tramp-glory-${name}`)(name, pr);
          progress = 4 + Math.random() * 2; scoreDelta = 3;
          popDelta(name, 1);
          time = 1.0;
        } else if (roll >= 5) {
          outcome = 'partial'; text = _pickUnique(TRAMPOLINE_TEXT.partial, `tramp-partial-${name}`)(name, pr);
          progress = 1.5; scoreDelta = 0.5;
          time = 1.5;
        } else if (s.boldness <= 3 && Math.random() < 0.4) {
          outcome = 'chicken'; text = _pickUnique(TRAMPOLINE_TEXT.chicken, `tramp-chicken-${name}`)(name, pr);
          progress = 0; scoreDelta = -1;
          popDelta(name, -1); time = 2;
          ep.campEvents[tName].post.push({
            type: 'brutalerCoward',
            players: [name],
            text: `${name} chickened on the trampoline during Bigger! Badder! Brutal-er! The tribe noticed.`,
            consequences: '-1 popularity. -1 score.',
            badgeText: 'COWARD CALL-OUT', badgeClass: 'badge-warning',
          });
        } else {
          outcome = 'slam'; text = _pickUnique(TRAMPOLINE_TEXT.slam, `tramp-slam-${name}`)(name, pr);
          progress = 0.5; scoreDelta = -1;
          time = 2.5;
        }
        cutProgress += progress;
        timeSpent += time;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + scoreDelta;
        beats.push({ tribe: tName, method, kind: 'trampoline', name, outcome, text, beatIdx: i });
      });
      // Holders — every non-jumper holds the trampoline taut
      holders.forEach((name, i) => {
        const s = pStats(name);
        const pr = pronouns(name);
        const roll = (s.physical * 0.4 + s.endurance * 0.4 + s.loyalty * 0.2) + noise(2.5);
        let outcome, text, scoreDelta = 0, progress = 0, time = 0;
        if (roll >= 5.5) {
          outcome = 'good'; text = _pickUnique(SUPPORT_TEXT.holder.good, `hold-good-${name}`)(name, pr);
          scoreDelta = 1.5; progress = 0.5;
        } else {
          outcome = 'bad'; text = _pickUnique(SUPPORT_TEXT.holder.bad, `hold-bad-${name}`)(name, pr);
          scoreDelta = -0.5; progress = -0.3; time = 0.5;
        }
        cutProgress += progress;
        timeSpent += time;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + scoreDelta;
        beats.push({ tribe: tName, method, kind: 'holder', name, outcome, text, beatIdx: jumpers.length + i });
      });
    } else if (method === 'sawclimb') {
      // Saw-climb: 3-4 climbers cycle, rest spot from below
      const climbers = [...members].sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance)).slice(0, numBeats);
      const spotters = members.filter(m => !climbers.includes(m));
      climbers.forEach((name, i) => {
        const s = pStats(name);
        const pr = pronouns(name);
        const roll = s.physical * 0.45 + s.endurance * 0.45 + fitMod + noise(2.5);
        let outcome, text, scoreDelta = 0, progress = 0, time = 1.5;
        if (roll >= 8) {
          outcome = 'glory'; text = _pickUnique(SAWCLIMB_TEXT.glory, `saw-glory-${name}`)(name, pr);
          progress = 4 + Math.random() * 2; scoreDelta = 3;
          popDelta(name, 1); time = 1.0;
        } else if (roll >= 5) {
          outcome = 'progress'; text = _pickUnique(SAWCLIMB_TEXT.progress, `saw-prog-${name}`)(name, pr);
          progress = 2; scoreDelta = 1;
          time = 1.5;
        } else {
          outcome = 'fall'; text = _pickUnique(SAWCLIMB_TEXT.fall, `saw-fall-${name}`)(name, pr);
          progress = 0.5; scoreDelta = -1;
          time = 2.5;
          // Hero rescue chance
          const heroes = members.filter(m => m !== name && isNice(m));
          if (heroes.length && Math.random() < 0.45) {
            const hero = pick(heroes);
            const hpr = pronouns(hero);
            const rescueText = pick(SAWCLIMB_TEXT.rescue)(hero, name, hpr, pr);
            beats.push({ tribe: tName, method, kind: 'rescue', heroName: hero, fallerName: name, text: rescueText, beatIdx: i + 0.5 });
            addBond(name, hero, 0.5);
            ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 2;
            popDelta(hero, 2);
            ep.campEvents[tName].post.push({
              type: 'brutalerHero',
              players: [hero, name],
              text: `${hero} caught ${name} when ${pr.sub} fell off the totem tree during Bigger! Badder! Brutal-er!`,
              consequences: 'Bond +0.5. +2 popularity.',
              badgeText: 'WILD HERO', badgeClass: 'badge-success',
            });
          }
        }
        cutProgress += progress;
        timeSpent += time;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + scoreDelta;
        beats.push({ tribe: tName, method, kind: 'sawclimb', name, outcome, text, beatIdx: i });
      });
      // Spotters — every non-climber helps from below
      spotters.forEach((name, i) => {
        const s = pStats(name);
        const pr = pronouns(name);
        const roll = (s.mental * 0.3 + s.endurance * 0.3 + s.physical * 0.2 + s.loyalty * 0.2) + noise(2.5);
        let outcome, text, scoreDelta = 0, progress = 0, time = 0;
        if (roll >= 5.5) {
          outcome = 'good'; text = _pickUnique(SUPPORT_TEXT.spotter.good, `spot-good-${name}`)(name, pr);
          scoreDelta = 1.5; progress = 0.5;
        } else {
          outcome = 'bad'; text = _pickUnique(SUPPORT_TEXT.spotter.bad, `spot-bad-${name}`)(name, pr);
          scoreDelta = -0.5; progress = -0.3; time = 0.5;
        }
        cutProgress += progress;
        timeSpent += time;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + scoreDelta;
        beats.push({ tribe: tName, method, kind: 'spotter', name, outcome, text, beatIdx: climbers.length + i });
      });
    } else { // stack
      // Stack: engineer → base → middle → apex, rest brace from outside
      const engineer = [...members].sort((a, b) => (pStats(b).mental + pStats(b).strategic) - (pStats(a).mental + pStats(a).strategic))[0];
      const base = [...members].filter(m => m !== engineer).sort((a, b) => pStats(b).physical - pStats(a).physical)[0] || engineer;
      const middle = [...members].filter(m => m !== engineer && m !== base).sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance))[0] || base;
      const apex = [...members].filter(m => ![engineer, base, middle].includes(m)).sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0] || middle;
      const bracers = members.filter(m => ![engineer, base, middle, apex].includes(m));

      const ePr = pronouns(engineer);
      beats.push({ tribe: tName, method, kind: 'engineer', name: engineer, text: _pickUnique(STACK_TEXT.engineer, `stack-eng-${engineer}`)(engineer, ePr), beatIdx: 0 });
      ep.chalMemberScores[engineer] = (ep.chalMemberScores[engineer] || 0) + 2;
      timeSpent += 1.5;

      const bPr = pronouns(base);
      beats.push({ tribe: tName, method, kind: 'base', name: base, text: _pickUnique(STACK_TEXT.base, `stack-base-${base}`)(base, bPr), beatIdx: 1 });
      ep.chalMemberScores[base] = (ep.chalMemberScores[base] || 0) + 1.5;
      timeSpent += 1.0;

      const mPr = pronouns(middle);
      beats.push({ tribe: tName, method, kind: 'middle', name: middle, text: _pickUnique(STACK_TEXT.middle, `stack-mid-${middle}`)(middle, mPr), beatIdx: 2 });
      ep.chalMemberScores[middle] = (ep.chalMemberScores[middle] || 0) + 1.5;
      timeSpent += 1.0;

      // Bracers — everyone else stabilizes the stack from outside
      bracers.forEach((name, i) => {
        const s = pStats(name);
        const pr = pronouns(name);
        const roll = (s.physical * 0.4 + s.endurance * 0.3 + s.mental * 0.3) + noise(2.5);
        let outcome, text, scoreDelta = 0, time = 0;
        if (roll >= 5.5) {
          outcome = 'good'; text = _pickUnique(SUPPORT_TEXT.brace.good, `brace-good-${name}`)(name, pr);
          scoreDelta = 1.5;
        } else {
          outcome = 'bad'; text = _pickUnique(SUPPORT_TEXT.brace.bad, `brace-bad-${name}`)(name, pr);
          scoreDelta = -0.5; time = 0.5;
        }
        timeSpent += time;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + scoreDelta;
        beats.push({ tribe: tName, method, kind: 'brace', name, outcome, text, beatIdx: 2.5 + i * 0.1 });
      });

      // Stack stability roll: bracers help — each good bracer adds +0.3
      const braceBonus = bracers.reduce((sum, n) => {
        const r = (pStats(n).physical * 0.4 + pStats(n).endurance * 0.3 + pStats(n).mental * 0.3) + noise(2.5);
        return sum + (r >= 5.5 ? 0.3 : -0.2);
      }, 0);
      const stackStability = (pStats(base).physical + pStats(middle).physical + pStats(engineer).mental) * 0.3 + fitMod + braceBonus + noise(2.5);
      const aPr = pronouns(apex);
      if (stackStability >= 7) {
        beats.push({ tribe: tName, method, kind: 'apex', name: apex, text: _pickUnique(STACK_TEXT.apex, `stack-apex-${apex}`)(apex, aPr), beatIdx: 3 });
        ep.chalMemberScores[apex] = (ep.chalMemberScores[apex] || 0) + 3;
        popDelta(apex, 1);
        cutProgress += 7;
        timeSpent += 1.5;
      } else {
        beats.push({ tribe: tName, method, kind: 'collapse', name: apex, text: _pickUnique(STACK_TEXT.collapse, `stack-col-${apex}`)(apex, aPr), beatIdx: 3 });
        ep.chalMemberScores[apex] = (ep.chalMemberScores[apex] || 0) - 1;
        cutProgress += 2;
        timeSpent += 3.0;
        // Re-attempt: another stack roll if there's time
        if (cutProgress < 5) {
          const reroll = stackStability + 1 + noise(2);
          if (reroll >= 6) {
            beats.push({ tribe: tName, method, kind: 'apex', name: apex, text: `Second attempt. ${apex} steadies, the stack holds, the saw works. The rope frays.`, beatIdx: 3.5 });
            cutProgress += 5;
            timeSpent += 2.0;
            ep.chalMemberScores[apex] = (ep.chalMemberScores[apex] || 0) + 2;
          } else {
            beats.push({ tribe: tName, method, kind: 'collapse', name: apex, text: `Second collapse. The tribe is losing time and faith.`, beatIdx: 3.5 });
            timeSpent += 2.5;
          }
        }
      }
    }

    // ── Wildlife encounters (1-2 per tribe during cutting) ──
    const wildlifeTypes = ['squirrel', 'raccoon', 'beaver', 'bear', 'skunk', 'hawk'];
    const numWildlife = Math.random() < 0.4 ? 2 : 1;
    const usedWild = new Set();
    for (let w = 0; w < numWildlife; w++) {
      const avail = wildlifeTypes.filter(t => !usedWild.has(t));
      if (!avail.length) break;
      const wType = pick(avail);
      usedWild.add(wType);
      const victim = pick(members);
      const vpr = pronouns(victim);
      const wText = pick(WILDLIFE_TEXT[wType])(tName, victim, vpr);
      const heroes = members.filter(m => m !== victim && isNice(m));
      let defended = false, hero = null, defendText = null;
      if (heroes.length && Math.random() < 0.4) {
        hero = pick(heroes);
        const hpr = pronouns(hero);
        defended = true;
        defendText = pick(WILDLIFE_TEXT.defended)(hero, tName, hpr);
        ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 2;
        popDelta(hero, 1);
        addBond(victim, hero, 0.4);
      }
      result.phase2.wildlife.push({
        tribe: tName, type: wType, victim, hero, defended, attackText: wText, defendText,
      });
      // Penalty if undefended: time + cutProgress hit
      if (!defended) {
        timeSpent += 1.5;
        cutProgress -= 1.5;
        ep.chalMemberScores[victim] = (ep.chalMemberScores[victim] || 0) - 0.5;
      } else {
        timeSpent += 0.5;
      }
    }

    // ── Bomb result ──
    cutProgress = Math.max(0, cutProgress);
    const tribeData = result.tribes[tName];
    if (timeSpent > BOMB_THRESHOLD || cutProgress < 4) {
      // BOOM
      const closestVictim = [...members].sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
      const cvPr = pronouns(closestVictim);
      tribeData.bombDetonated = true;
      tribeData.bombVictim = closestVictim;
      tribeData.totemCondition -= 35;
      const detonateText = pick(BOMB_TEXT.detonate)(tName, closestVictim, cvPr);
      result.phase2.bombResults.push({ tribe: tName, detonated: true, victim: closestVictim, text: detonateText, timeSpent, cutProgress });
      popDelta(closestVictim, 2);
      ep.campEvents[tName].post.push({
        type: 'brutalerBlownUp',
        players: [closestVictim],
        text: `${closestVictim} took the blast when ${tName}'s bomb detonated during Bigger! Badder! Brutal-er! Singed but standing.`,
        consequences: '+2 popularity. Tribe totem heavily damaged for the race.',
        badgeText: 'BLOWN UP', badgeClass: 'badge-danger',
      });
      ep.chalMemberScores[closestVictim] = (ep.chalMemberScores[closestVictim] || 0) + 1;
    } else {
      // Close call (under threshold by less than 3) gets a dramatic close-call card
      if (timeSpent > BOMB_THRESHOLD - 3) {
        result.phase2.bombResults.push({ tribe: tName, detonated: false, closeCall: true, text: pick(BOMB_TEXT.closeCall)(tName), timeSpent, cutProgress });
      } else {
        result.phase2.bombResults.push({ tribe: tName, detonated: false, closeCall: false, text: pick(BOMB_TEXT.tick)(tName), timeSpent, cutProgress });
      }
    }

    tribeData.timeSpent = timeSpent;
    tribeData.cutProgress = cutProgress;
    tribeData.p2Score = (cutProgress * 1.5) + (tribeData.bombDetonated ? -8 : 4);
    result.phase2.beats.push(...beats);
  });

  result.phase2.cutOrder = Object.values(result.tribes)
    .sort((a, b) => {
      if (a.bombDetonated !== b.bombDetonated) return a.bombDetonated ? 1 : -1;
      return a.timeSpent - b.timeSpent;
    })
    .map(t => t.name);

  // ══════════════════════════════════════════════════════════
  // PHASE 3 — TOTEM RACE & CABIN SMASH
  // ══════════════════════════════════════════════════════════
  // Time-based: each tribe's arrival = cutTime (from phase 2) + raceTime (from obstacles).
  // Fastest cutter gets a head start — first to arrive wins immunity.
  const raceBeatLabels = [
    { key: 'waterfall', label: 'WATERFALL DROP' },
    { key: 'slope', label: 'SLOPE DESCENT' },
    { key: 'finalStretch', label: 'FINAL STRETCH' },
  ];

  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];
    const tData = result.tribes[tName];
    const damaged = tData.bombDetonated;
    let raceTime = 0;

    // Anchor (best physical+endurance) leads the front of the totem
    const anchor = [...members].sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance))[0];
    const carriers = members.filter(m => m !== anchor);

    raceBeatLabels.forEach((rb, beatIdx) => {
      const aPr = pronouns(anchor);
      const baseRoll = (pStats(anchor).physical + pStats(anchor).endurance + pStats(anchor).boldness) / 3 + (damaged ? -1.5 : 0) + noise(2.5);
      let outcome, text, scoreDelta = 0, beatTime = 0;
      const pool = RACE_TEXT[rb.key];
      if (baseRoll >= 6.5) {
        outcome = 'smooth'; text = _pickUnique(pool.smooth, `race-smooth-${rb.key}-${anchor}`)(tName, anchor, aPr);
        scoreDelta = 3; beatTime = 1.5 + Math.random() * 0.5;
      } else {
        outcome = 'rough'; text = _pickUnique(pool.rough, `race-rough-${rb.key}-${anchor}`)(tName, anchor, aPr);
        scoreDelta = -1; beatTime = 3.0 + Math.random() * 1.0;
      }
      raceTime += beatTime;
      tData.p3Score += scoreDelta;
      ep.chalMemberScores[anchor] = (ep.chalMemberScores[anchor] || 0) + scoreDelta;

      // Damaged totem can splinter mid-ride at the waterfall
      if (rb.key === 'waterfall' && damaged && Math.random() < 0.6) {
        const splinterText = pick(pool.splinter)(tName, anchor, aPr);
        result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: 'splinter', name: anchor, text: splinterText });
        tData.p3Score -= 2;
        raceTime += 2.0;
      }

      result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: outcome, name: anchor, text });

      // Carrier beats — every non-anchor carries their section of the totem per segment
      carriers.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const carryRoll = (s.physical * 0.35 + s.endurance * 0.35 + s.boldness * 0.15 + s.loyalty * 0.15) + (damaged ? -0.8 : 0) + noise(2.5);
        let carryOutcome, carryText, carryScore = 0, carryTime = 0;
        if (carryRoll >= 5.5) {
          carryOutcome = 'good'; carryText = _pickUnique(SUPPORT_TEXT.carrier.good, `carry-good-${rb.key}-${name}`)(name, pr);
          carryScore = 1; carryTime = -0.15;
        } else {
          carryOutcome = 'bad'; carryText = _pickUnique(SUPPORT_TEXT.carrier.bad, `carry-bad-${rb.key}-${name}`)(name, pr);
          carryScore = -0.5; carryTime = 0.5;
        }
        raceTime += carryTime;
        tData.p3Score += carryScore;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + carryScore;
        result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: 'carrier-' + carryOutcome, name, text: carryText });

        // Carrier-specific drama events (replace old random cling system)
        if (carryOutcome === 'bad' && Math.random() < 0.4) {
          // Hero save chance
          const saveCandidates = members.filter(m => m !== name && isNice(m));
          if (saveCandidates.length && Math.random() < 0.5) {
            const hero = pick(saveCandidates);
            const hpr = pronouns(hero);
            const saveText = pick(RACE_TEXT.cling.save)(hero, name, hpr, pr);
            result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: 'cling-save', heroName: hero, fallerName: name, text: saveText });
            ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 1;
            popDelta(hero, 1);
            addBond(name, hero, 0.4);
            raceTime -= 0.3;
            return;
          }
          // Villain shove possibility
          const villains = members.filter(m => m !== name && canScheme(m));
          if (villains.length && Math.random() < 0.2) {
            const villain = pick(villains);
            const vpr = pronouns(villain);
            const shoveText = pick(RACE_TEXT.cling.shove)(villain, name, vpr, pr);
            const witnesses = members.filter(m => m !== villain && m !== name);
            const caught = witnesses.some(w => pStats(w).intuition * 0.5 + noise(1.5) >= 4);
            if (caught) {
              const witness = witnesses.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
              const caughtText = pick(RACE_TEXT.cling.shoveCaught)(villain, name, witness, vpr, pr);
              result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: 'cling-shove-caught', villain, target: name, witness, text: shoveText + ' ' + caughtText });
              popDelta(villain, -3);
              addBond(witness, villain, -0.5);
              ep.campEvents[tName].post.push({
                type: 'brutalerVillainShove',
                players: [villain, name, witness],
                text: `${witness} caught ${villain} shoving ${name} off the totem during the Bigger! Badder! Brutal-er! race.`,
                consequences: 'Bond -0.5. -3 popularity. Trust shattered.',
                badgeText: 'TOTEM SHOVE', badgeClass: 'badge-danger',
              });
              raceTime += 0.5;
            } else {
              result.phase3.raceBeats.push({ tribe: tName, beatKey: rb.key, beatLabel: rb.label, kind: 'cling-shove', villain, target: name, text: shoveText });
              popDelta(villain, -1);
              raceTime += 0.3;
            }
          }
        }
      });
    });

    tData.raceTime = raceTime;
    tData.arrivalTime = tData.timeSpent + raceTime;
    tData.finalScore = tData.p1Score + tData.p2Score + tData.p3Score;
  });

  // ══════════════════════════════════════════════════════════
  // FINISH ORDER + CABIN SMASH
  // ══════════════════════════════════════════════════════════
  // First to arrive wins — arrival = cutTime + raceTime
  const finishRanking = tribes.map(t => ({ name: t.name, arrival: result.tribes[t.name].arrivalTime })).sort((a, b) => a.arrival - b.arrival);
  result.tribeFinishOrder = finishRanking.map(r => r.name);

  const winnerTribeName = finishRanking[0].name;
  const winnerTribe = tribes.find(t => t.name === winnerTribeName);
  const loserTribeName = finishRanking[finishRanking.length - 1].name;
  const loserTribe = tribes.find(t => t.name === loserTribeName);

  // Cabin pick — loudest member of winner tribe
  const picker = [...winnerTribe.members].sort((a, b) => (pStats(b).boldness + pStats(b).social) - (pStats(a).boldness + pStats(a).social))[0];
  const pickerPr = pronouns(picker);
  result.phase3.cabinPick = {
    tribe: winnerTribeName,
    picker,
    text: pick(CABIN_TEXT.pick)(winnerTribeName, picker, pickerPr),
  };
  ep.chalMemberScores[picker] = (ep.chalMemberScores[picker] || 0) + 1;
  popDelta(picker, 1);

  // Cabin smash — loser tribe's anchor crashes into the cabin
  const crasher = [...loserTribe.members].sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance))[0];
  const crasherPr = pronouns(crasher);
  result.phase3.cabinSmash = {
    tribe: loserTribeName,
    crasher,
    text: pick(CABIN_TEXT.smash)(loserTribeName, crasher, crasherPr),
  };
  popDelta(crasher, 1);
  ep.campEvents[loserTribeName].post.push({
    type: 'brutalerCabinCrash',
    players: [crasher],
    text: `${crasher} rode the totem straight through the winners' cabin during Bigger! Badder! Brutal-er!`,
    consequences: '+1 popularity. The cabin is gone. Helicopter incoming.',
    badgeText: 'CABIN CRASHER', badgeClass: 'badge-info',
  });

  // Helicopter
  result.phase3.helicopter = { text: pick(CABIN_TEXT.helicopter)(host()) };

  // Reactions: winner + middle + loser
  const winReactor = pick(winnerTribe.members.filter(m => m !== picker)) || picker;
  const winReactorPr = pronouns(winReactor);
  const loseReactor = pick(loserTribe.members.filter(m => m !== crasher)) || crasher;
  const loseReactorPr = pronouns(loseReactor);
  result.phase3.reactions = [
    { name: winReactor, tribe: winnerTribeName, side: 'winner', text: pick(CABIN_TEXT.reactionWinners)(winReactor, winReactorPr) },
  ];
  // Middle tribes (everyone between 1st and last)
  finishRanking.slice(1, -1).forEach(rank => {
    const midTribe = tribes.find(t => t.name === rank.name);
    if (midTribe) {
      const midReactor = pick(midTribe.members);
      const midPr = pronouns(midReactor);
      result.phase3.reactions.push({ name: midReactor, tribe: rank.name, side: 'middle', text: pick(CABIN_TEXT.reactionMiddle)(midReactor, midPr) });
    }
  });
  result.phase3.reactions.push(
    { name: loseReactor, tribe: loserTribeName, side: 'loser', text: pick(CABIN_TEXT.reactionLosers)(loseReactor, loseReactorPr) },
  );

  // ══════════════════════════════════════════════════════════
  // METHOD WAR (post-loss blame for bad fit picks)
  // ══════════════════════════════════════════════════════════
  finishRanking.slice(1).forEach(rank => {
    const tName = rank.name;
    const tData = result.tribes[tName];
    if (tData.fitMod < -0.5) {
      // Bad pick + loss — METHOD WAR fires
      const champion = tData.champion;
      const rivalChamps = tData.rivalChampions || [];
      if (!rivalChamps.length) return;
      const rivalPick = rivalChamps[0]; // most-vocal alternative
      const altMethodLabel = rivalPick.method === 'trampoline' ? 'TRAMPOLINE' : rivalPick.method === 'sawclimb' ? 'SAW & CLIMB' : 'HUMAN STACK';
      const cpr = pronouns(champion);
      const text = pick(METHOD_WAR_TEXT)(champion, rivalPick.name, tData.methodLabel, altMethodLabel, cpr);

      gs._brutalerHeat = { target: champion, amount: 2.0, expiresEp: (gs.episode || 1) + 2 };
      const tribe = tribes.find(t => t.name === tName);
      tribe.members.filter(m => m !== champion).forEach(m => addBond(m, champion, -0.5));
      popDelta(champion, -2);

      ep.campEvents[tName].post.push({
        type: 'brutalerMethodWar',
        players: [champion, rivalPick.name],
        text: `Back at camp, the tribe blames ${champion} for pushing ${tData.methodLabel.toLowerCase()} when ${altMethodLabel.toLowerCase()} fit better. ${rivalPick.name} is vindicated. Heat is on ${champion}.`,
        consequences: 'Heat +2.0 (2 episodes). Bond -0.5 from tribe. -2 popularity.',
        badgeText: 'METHOD WAR', badgeClass: 'badge-danger',
      });
      result.tribes[tName].methodWar = { champion, rival: rivalPick.name, altMethod: altMethodLabel, text };
    }
  });

  // ══════════════════════════════════════════════════════════
  // IN-CHALLENGE SOCIAL EVENTS (ep1 = first impressions, otherwise standard)
  // ══════════════════════════════════════════════════════════
  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];
    if (members.length < 2) return;

    if (isEp1) {
      // First-impression sparks, bonds, friction, archetype clash, early alliance
      const pairs = [];
      for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) pairs.push([members[i], members[j]]);
      const shuffled = [...pairs].sort(() => Math.random() - 0.5);

      // Spark — requires romantic compatibility + max 2 active showmance cap
      const _bbbActiveShows = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
      const sparkPair = _bbbActiveShows.length < 2 ? shuffled.find(([a, b]) => romanticCompat(a, b) && !_bbbActiveShows.some(sh => sh.players.includes(a) || sh.players.includes(b))) : null;
      if (sparkPair && Math.random() < 0.45) {
        const [a, b] = sparkPair;
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'spark', tribe: tName, players: [a, b], text: pick(SOCIAL_EP1.spark)(a, b, apr, bpr) });
        addBond(a, b, 1.5);
        if (!gs.romanticSparks) gs.romanticSparks = [];
        if (!gs.romanticSparks.some(sp => sp.players.includes(a) && sp.players.includes(b))) {
          gs.romanticSparks.push({ players: [a, b], sparkEp: gs.episode || 1, intensity: 1, source: 'bigger-badder-brutaler' });
        }
        ep.campEvents[tName].post.push({
          type: 'brutalerSpark',
          players: [a, b],
          text: `${a} and ${b} shared a moment during the totem race. A spark — quiet but unmistakable.`,
          consequences: `Romantic spark created. Bond +1.5 between ${a} and ${b}.`,
          badgeText: 'SPARK', badgeClass: 'badge-romance',
        });
      }
      // Instant bond
      const bondPair = shuffled.find(([a, b]) => !sparkPair || (a !== sparkPair[0] && b !== sparkPair[1]));
      if (bondPair && Math.random() < 0.7) {
        const [a, b] = bondPair;
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'instantBond', tribe: tName, players: [a, b], text: pick(SOCIAL_EP1.instantBond)(a, b, apr, bpr) });
        addBond(a, b, 0.8);
        ep.campEvents[tName].post.push({
          type: 'brutalerInstantBond',
          players: [a, b],
          text: `${a} and ${b} clicked during the challenge. An early bond is forming.`,
          consequences: `Bond +0.8 between ${a} and ${b}.`,
          badgeText: 'BONDED', badgeClass: 'badge-info',
        });
      }
      // Instant friction
      const frictionIdx = shuffled.findIndex(([a, b]) =>
        (!sparkPair || (a !== sparkPair[0] && b !== sparkPair[1])) &&
        (!bondPair || (a !== bondPair[0] && b !== bondPair[1]))
      );
      if (frictionIdx >= 0 && Math.random() < 0.5) {
        const [a, b] = shuffled[frictionIdx];
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'instantFriction', tribe: tName, players: [a, b], text: pick(SOCIAL_EP1.instantFriction)(a, b, apr, bpr) });
        addBond(a, b, -0.6);
        ep.campEvents[tName].post.push({
          type: 'brutalerFriction',
          players: [a, b],
          text: `${a} and ${b} butted heads during the challenge. Tension is already building.`,
          consequences: `Bond -0.6 between ${a} and ${b}.`,
          badgeText: 'FRICTION', badgeClass: 'badge-warning',
        });
      }
      // Archetype clash
      const heroes = members.filter(m => arch(m) === 'hero');
      const villains = members.filter(m => ['villain', 'mastermind'].includes(arch(m)));
      if (heroes.length && villains.length && Math.random() < 0.6) {
        const a = pick(heroes);
        const b = pick(villains);
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'archetypeClash', tribe: tName, players: [a, b], text: pick(SOCIAL_EP1.archetypeClash)(a, b, apr, bpr) });
        addBond(a, b, -0.8);
        ep.campEvents[tName].post.push({
          type: 'brutalerArchetypeClash',
          players: [a, b],
          text: `${a} and ${b} clashed hard during the challenge — hero vs villain energy from minute one.`,
          consequences: `Bond -0.8 between ${a} and ${b}. Rivalry seeded.`,
          badgeText: 'CLASH', badgeClass: 'badge-danger',
        });
      }
      // Early alliance
      const strategists = members.filter(m => pStats(m).strategic >= 5).sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      if (strategists.length >= 2 && Math.random() < 0.5) {
        const a = strategists[0];
        const b = strategists[1];
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'earlyAlliance', tribe: tName, players: [a, b], text: pick(SOCIAL_EP1.earlyAlliance)(a, b, apr, bpr) });
        addBond(a, b, 1.0);
        ep.campEvents[tName].post.push({
          type: 'brutalerEarlyAlliance',
          players: [a, b],
          text: `${a} and ${b} formed an early working relationship during the challenge. They're already thinking ahead.`,
          consequences: `Bond +1.0 between ${a} and ${b}. Strategic alignment forming.`,
          badgeText: 'PACT', badgeClass: 'badge-info',
        });
      }
    } else {
      // Later episodes: standard social events
      const strategists = members.filter(m => pStats(m).strategic >= 5).sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      if (strategists.length >= 2 && Math.random() < 0.55) {
        const a = strategists[0];
        const b = strategists[1];
        const apr = pronouns(a);
        const targetPool = members.filter(m => m !== a && m !== b).map(m => ({ name: m, score: getBond(a, m) + getBond(b, m) })).sort((x, y) => x.score - y.score);
        if (targetPool.length) {
          const target = targetPool[0].name;
          result.phase3.socialEvents.push({ kind: 'voteWhisper', tribe: tName, players: [a, b], target, text: pick(SOCIAL_LATER.voteWhisper)(a, b, target, apr) });
          gs._brutalerHeat = { target, amount: 1.5, expiresEp: (gs.episode || 1) + 2 };
          ep.campEvents[tName].post.push({
            type: 'brutalerVoteWhisper',
            players: [a, b, target],
            text: `${a} and ${b} agreed during the chaos to target ${target} at the next vote.`,
            consequences: `Heat +1.5 on ${target} (2 eps). Bond +0.4 between ${a} and ${b}.`,
            badgeText: 'TOTEM PACT', badgeClass: 'badge-warning',
          });
          addBond(a, b, 0.4);
        }
      }
      // Alliance moment
      if (members.length >= 2 && Math.random() < 0.4) {
        const sh = [...members].sort(() => Math.random() - 0.5);
        const a = sh[0];
        const b = sh[1];
        const apr = pronouns(a);
        result.phase3.socialEvents.push({ kind: 'alliance', tribe: tName, players: [a, b], text: pick(SOCIAL_LATER.alliance)(a, b, apr) });
        addBond(a, b, 0.6);
        ep.campEvents[tName].post.push({
          type: 'brutalerAllianceMoment',
          players: [a, b],
          text: `${a} and ${b} solidified their working relationship during the totem race.`,
          consequences: `Bond +0.6 between ${a} and ${b}.`,
          badgeText: 'ALLIANCE', badgeClass: 'badge-info',
        });
      }
      // Rivalry
      let worstPair = null, worstBond = 99;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const bd = getBond(members[i], members[j]);
          if (bd < worstBond) { worstBond = bd; worstPair = [members[i], members[j]]; }
        }
      }
      if (worstPair && worstBond <= 0 && Math.random() < 0.45) {
        const [a, b] = worstPair;
        const apr = pronouns(a);
        result.phase3.socialEvents.push({ kind: 'rivalry', tribe: tName, players: [a, b], text: pick(SOCIAL_LATER.rivalry)(a, b, apr) });
        addBond(a, b, -0.5);
        popDelta(a, -1);
        popDelta(b, -1);
        ep.campEvents[tName].post.push({
          type: 'brutalerRivalry',
          players: [a, b],
          text: `${a} and ${b} went at each other during the race. The rivalry is escalating.`,
          consequences: `Bond -0.5 between ${a} and ${b}. Both lose 1 popularity.`,
          badgeText: 'RIVALRY', badgeClass: 'badge-danger',
        });
      }
      // Showmance moment
      const tribeShowmances = (gs.showmances || []).filter(sh =>
        sh.phase !== 'broken-up' &&
        sh.players.length === 2 &&
        members.includes(sh.players[0]) &&
        members.includes(sh.players[1])
      );
      if (tribeShowmances.length && Math.random() < 0.6) {
        const sh = pick(tribeShowmances);
        const [a, b] = sh.players;
        const apr = pronouns(a);
        const bpr = pronouns(b);
        result.phase3.socialEvents.push({ kind: 'showmanceMoment', tribe: tName, players: [a, b], text: pick(SOCIAL_LATER.showmance)(a, b, apr, bpr) });
        addBond(a, b, 0.5);
        ep.campEvents[tName].post.push({
          type: 'brutalerShowmanceMoment',
          players: [a, b],
          text: `${a} and ${b} shared a moment during the race. Their showmance deepened.`,
          consequences: `Bond +0.5 between ${a} and ${b}. Showmance visibility increases.`,
          badgeText: 'SHOWMANCE', badgeClass: 'badge-romance',
        });
      }
    }
  });

  // ══════════════════════════════════════════════════════════
  // FINALIZE
  // ══════════════════════════════════════════════════════════
  const _romActive = [];
  tribes.forEach(t => t.members.forEach(m => _romActive.push(m)));
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'totem race chaos');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'bigger-badder-brutaler', _romActive);

  ep.brutaler = result;
  ep.challengeData = result;
  ep.isBiggerBadderBrutaler = true;
  ep.challengeType = 'bigger-badder-brutaler';
  ep.challengeLabel = 'Bigger! Badder! Brutal-er!';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = winnerTribeName;
  ep.tribalPlayers = loserTribe.members;

  // Tribe-level placements: winner has the highest, loser the lowest
  const winnerMembers = winnerTribe.members;
  const loserMembers = loserTribe.members;
  // Boost top winner to ensure they're #1 in chalMemberScores
  const winnerTop = winnerMembers.sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0))[0];
  const allActive = tribes.flatMap(t => t.members);
  const maxOther = Math.max(0, ...allActive.filter(n => n !== winnerTop).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[winnerTop] = Math.max(ep.chalMemberScores[winnerTop] || 0, maxOther) + allActive.length + 5;

  ep.chalPlacements = [...allActive].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// VP SCREENS — TOTAL DRAMA WASTELAND
// Borderlands cel-shaded × Total Drama camp energy
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1 };
  if (_tvState[key].idx >= total) _tvState[key].idx = total - 1;
  return _tvState[key];
}

function portrait(name, size = 28) {
  const sl = slug(name);
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

function _playerChips(names, tribeName) {
  if (!names?.length) return '';
  const tc = tribeName ? tribeColor(tribeName) : '#8bc34a';
  return `<div class="bb-chips">${names.map(n =>
    `<span class="bb-chip" style="--chip-c:${tc}">
      <span class="bb-chip-avi">${portrait(n, 22)}</span>
      <span class="bb-chip-name">${n}</span>
    </span>`
  ).join('')}</div>`;
}

function _tribeBadge(tribeName) {
  if (!tribeName) return '';
  const tc = tribeColor(tribeName);
  return `<span class="bb-tribe-badge" style="--tb-c:${tc}">${tribeName.toUpperCase()}</span>`;
}

// ── ICON SYSTEM — thick ink-outline cel-shaded icons ──
function _icon(type) {
  const map = {
    axe:'bb-i-axe', bomb:'bb-i-bomb', totem:'bb-i-totem', trampoline:'bb-i-tramp', tramp:'bb-i-tramp',
    saw:'bb-i-saw', stack:'bb-i-stack', bear:'bb-i-bear', squirrel:'bb-i-squirrel', raccoon:'bb-i-raccoon',
    beaver:'bb-i-beaver', skunk:'bb-i-skunk', hawk:'bb-i-hawk', cabin:'bb-i-cabin', waterfall:'bb-i-waterfall',
    helicopter:'bb-i-heli', explosion:'bb-i-explosion', fire:'bb-i-explosion', skull:'bb-i-skull',
    heart:'bb-i-heart', star:'bb-i-star', fist:'bb-i-fist', megaphone:'bb-i-mega', target:'bb-i-target',
    bolt:'bb-i-bolt', ribbon:'bb-i-ribbon', compass:'bb-i-compass', shield:'bb-i-shield',
    bond:'bb-i-bond', rivalry:'bb-i-rivalry', spark:'bb-i-spark', warning:'bb-i-warning',
    biohazard:'bb-i-biohazard', slime:'bb-i-slime', radiation:'bb-i-biohazard',
    wildlife:'bb-i-warning', geiger:'bb-i-target', gasmask:'bb-i-shield',
    barrel:'bb-i-bomb', oscilloscope:'bb-i-target', chevron:'bb-i-warning',
  };
  const cls = map[type] || 'bb-i-target';
  return `<span class="bb-i ${cls}"></span>`;
}

// ── CHATTER — Total Drama production notes ──
const CHATTER = {
  phase0: [
    `${_icon('megaphone')} PRODUCER: "Roll cameras — this is going to be beautiful."`,
    `${_icon('star')} INTERN NOTE: Three totems, three bombs, zero insurance.`,
    `${_icon('ribbon')} CRAFT SERVICES: "Popcorn ready. Place your bets, people."`,
    `${_icon('target')} CAMERA DEPT: "We have visual on all three trees."`,
  ],
  phase1: [
    `${_icon('megaphone')} DIRECTOR: "Get a close-up on the arguing — ratings gold."`,
    `${_icon('star')} INTERN: "Should someone stop them?" PRODUCER: "Absolutely not."`,
    `${_icon('fist')} MEDICAL ON STANDBY — no injuries yet. Key word: yet.`,
    `${_icon('ribbon')} CRAFT SERVICES: "The popcorn is going FAST."`,
    `${_icon('target')} CAMERA 2: "I've never seen this much pointing in my life."`,
  ],
  phase2: [
    `${_icon('warning')} MEDIC ON STANDBY — fourth time this episode.`,
    `${_icon('megaphone')} PRODUCER: "Wildlife advisory — this. is. fine."`,
    `${_icon('bomb')} BOMB SQUAD RADIO: "NOT our jurisdiction."`,
    `${_icon('skull')} INSURANCE ADJUSTER has left the chat.`,
    `${_icon('star')} INTERN: "Is that a bear or just Kevin from props?"`,
  ],
  phase3: [
    `${_icon('megaphone')} DIRECTOR: "CAMERA 3 — get the carnage!"`,
    `${_icon('star')} HELICOPTER BUDGET: somehow approved.`,
    `${_icon('warning')} INSURANCE COMPANY — line 2. Again.`,
    `${_icon('ribbon')} NETWORK EXEC: "This is the best episode yet."`,
    `${_icon('fist')} STUNT COORDINATOR: "I didn't sign off on this."`,
  ],
};

// ── CSS ──
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Nunito:wght@400;700;900&family=Share+Tech+Mono&display=swap');

  .bb-shell {
    --bb-bg:#1a1510; --bb-card-bg:#241e16; --bb-ink:#1a1a1a; --bb-paper:#f0e0c8;
    --bb-toxic:#8bc34a; --bb-orange:#ff9800; --bb-red:#e53935; --bb-blue:#42a5f5;
    --bb-gold:#ffc107; --bb-purple:#9c27b0; --bb-amber:#f59e0b; --bb-text:#f0e8d8; --bb-muted:#9e9080;
    --bb-bone:#faf3e8; --bb-rust:#c45e2c; --bb-teal:#26a69a;
    position:relative; max-width:1100px; margin:0 auto; font-family:'Nunito',sans-serif;
    font-size:0.95rem; line-height:1.55; color:var(--bb-text); border-radius:8px; overflow:hidden;
    border:4px solid var(--bb-ink); box-shadow:6px 6px 0 var(--bb-ink), 0 0 40px rgba(139,195,74,0.15);
  }
  .bb-shell *, .bb-shell *::before, .bb-shell *::after { box-sizing:border-box; }

  /* Crosshatch texture + phase-specific tint */
  .bb-shell::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0; opacity:0.6;
    background:
      repeating-linear-gradient(45deg, transparent 0, transparent 12px, rgba(255,255,255,0.015) 12px, rgba(255,255,255,0.015) 13px),
      repeating-linear-gradient(-45deg, transparent 0, transparent 12px, rgba(255,255,255,0.015) 12px, rgba(255,255,255,0.015) 13px);
  }
  /* Floating particles (CSS-only) */
  .bb-shell::after { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(1.5px 1.5px at 15% 25%, rgba(139,195,74,0.3) 50%, transparent 50%),
      radial-gradient(1px 1px at 45% 65%, rgba(255,152,0,0.2) 50%, transparent 50%),
      radial-gradient(2px 2px at 75% 15%, rgba(139,195,74,0.2) 50%, transparent 50%),
      radial-gradient(1px 1px at 85% 75%, rgba(255,193,7,0.15) 50%, transparent 50%),
      radial-gradient(1.5px 1.5px at 25% 85%, rgba(139,195,74,0.2) 50%, transparent 50%),
      radial-gradient(1px 1px at 55% 35%, rgba(255,152,0,0.15) 50%, transparent 50%);
    animation:bb-drift 25s linear infinite;
  }
  @keyframes bb-drift { from{transform:translate(0,0)} to{transform:translate(-15px,10px)} }
  .bb-shell > * { position:relative; z-index:1; }

  /* Phase-specific backgrounds */
  .bb-phase-0 { background:linear-gradient(180deg, #1a1510 0%, #0f0d0a 100%); }
  .bb-phase-1 { background:linear-gradient(180deg, #1a1510 0%, #1f1508 60%, #241a0a 100%); }
  .bb-phase-2 { background:linear-gradient(180deg, #1a1510 0%, #1f100f 60%, #241210 100%); }
  .bb-phase-3 { background:linear-gradient(180deg, #1a1510 0%, #101518 60%, #0e181c 100%); }
  .bb-phase-4 { background:linear-gradient(180deg, #1a1510 0%, #1f1a08 60%, #241f0a 100%); }

  /* ── TWO-COLUMN LAYOUT ── */
  .bb-layout { display:flex; min-height:400px; }
  .bb-main { flex:1; min-width:0; padding-bottom:60px; }
  .bb-sidebar { width:250px; flex-shrink:0; background:rgba(0,0,0,0.4); border-left:3px solid var(--bb-ink);
    position:sticky; top:0; max-height:100vh; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--bb-toxic) transparent; }
  @media(max-width:768px) { .bb-layout { flex-direction:column; } .bb-sidebar { width:100%; max-height:none; position:relative; border-left:none; border-top:3px solid var(--bb-ink); } }

  /* ── SIDEBAR ── */
  .bb-sb-header { padding:12px 14px 8px; border-bottom:3px solid var(--bb-ink); background:rgba(139,195,74,0.08); }
  .bb-sb-title { font-family:'Permanent Marker',cursive; font-size:1.1rem; color:var(--bb-toxic); letter-spacing:1px;
    display:flex; align-items:center; gap:6px; text-shadow:2px 2px 0 rgba(0,0,0,0.5); }
  .bb-sb-phase { font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--bb-muted); letter-spacing:2px; margin-top:2px; }
  .bb-sb-bomb { margin:8px 0 0; display:flex; align-items:center; gap:6px; }
  .bb-sb-bomb-label { font-family:'Share Tech Mono',monospace; font-size:0.6rem; color:var(--bb-red); letter-spacing:1px; }
  .bb-sb-bomb-time { font-family:'Share Tech Mono',monospace; font-size:0.85rem; font-weight:700; color:var(--bb-red); text-shadow:0 0 8px rgba(229,57,53,0.5); }

  .bb-sb-tribe { padding:0; border-bottom:2px solid rgba(26,26,26,0.6); }
  .bb-sb-tribe:last-child { border-bottom:none; }
  .bb-sb-tribe-header { padding:8px 12px 4px; display:flex; align-items:center; gap:8px;
    border-left:4px solid var(--tb-c, var(--bb-toxic)); background:rgba(0,0,0,0.3); }
  .bb-sb-tribe-dot { width:10px; height:10px; border-radius:50%; border:2px solid var(--bb-ink);
    box-shadow:0 0 6px var(--tb-c, var(--bb-toxic)); flex-shrink:0; }
  .bb-sb-tribe-name { font-family:'Permanent Marker',cursive; font-size:0.85rem; letter-spacing:1px;
    text-shadow:1px 1px 0 rgba(0,0,0,0.6); }

  .bb-sb-stat { display:flex; align-items:center; gap:6px; padding:3px 12px 3px 20px;
    font-family:'Share Tech Mono',monospace; font-size:0.68rem; color:var(--bb-muted); letter-spacing:1px; }
  .bb-sb-stat .bb-i { width:14px; height:14px; }
  .bb-sb-bar { flex:1; height:6px; background:rgba(0,0,0,0.5); border-radius:3px; overflow:hidden;
    border:1px solid rgba(255,255,255,0.1); max-width:80px; }
  .bb-sb-bar-fill { height:100%; border-radius:2px; transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);
    background:linear-gradient(90deg, var(--bb-toxic), var(--bb-gold)); box-shadow:0 0 4px var(--bb-toxic); }
  .bb-sb-bar-fill.danger { background:linear-gradient(90deg, var(--bb-red), var(--bb-orange)); box-shadow:0 0 4px var(--bb-red); }
  .bb-sb-bar-val { font-size:0.62rem; color:var(--bb-text); min-width:28px; text-align:right; }

  .bb-sb-player { display:flex; align-items:center; gap:6px; padding:3px 10px 3px 16px; transition:background 0.2s; }
  .bb-sb-player:hover { background:rgba(139,195,74,0.08); }
  .bb-sb-avatar { width:26px; height:26px; border-radius:50%; border:2px solid var(--bb-ink); overflow:hidden;
    box-shadow:1px 1px 0 var(--bb-ink); flex-shrink:0; background:rgba(0,0,0,0.3); }
  .bb-sb-avatar img { width:100%; height:100%; border-radius:50%; object-fit:contain; }
  .bb-sb-player-name { font-size:0.78rem; color:var(--bb-text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bb-sb-badge { font-size:0.7rem; color:var(--bb-gold); text-shadow:0 0 4px var(--bb-gold); animation:bb-pulse 2s ease infinite; }
  .bb-sb-badge.elim { color:var(--bb-red); text-shadow:0 0 4px var(--bb-red); }
  .bb-sb-score { font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--bb-gold); min-width:20px; text-align:right; }
  .bb-sb-role { font-family:'Share Tech Mono',monospace; font-size:0.55rem; color:var(--bb-muted); letter-spacing:0.5px;
    background:rgba(255,255,255,0.04); padding:1px 4px; border-radius:2px; border:1px solid rgba(255,255,255,0.06); }

  .bb-sb-footer { padding:8px 12px; border-top:2px solid rgba(26,26,26,0.6); background:rgba(0,0,0,0.3); }
  .bb-sb-footer-stat { font-family:'Share Tech Mono',monospace; font-size:0.6rem; color:var(--bb-muted); letter-spacing:1px; margin:2px 0;
    display:flex; align-items:center; gap:6px; }
  .bb-sb-footer-stat .val { color:var(--bb-toxic); }

  /* ── PHASE HEADER ── */
  .bb-phase-header { padding:18px 20px 14px; position:relative; overflow:hidden;
    border-bottom:3px solid var(--bb-ink); background:rgba(0,0,0,0.3); }
  .bb-phase-header::before { content:''; position:absolute; right:-20px; top:-10px; width:120px; height:120px;
    background:radial-gradient(circle, rgba(139,195,74,0.15) 0%, transparent 70%); pointer-events:none;
    animation:bb-pulse 4s ease infinite; }
  .bb-phase-tag { font-family:'Share Tech Mono',monospace; font-size:0.65rem; letter-spacing:4px; color:var(--bb-toxic);
    text-transform:uppercase; text-shadow:0 0 8px rgba(139,195,74,0.4); }
  .bb-phase-title { font-family:'Permanent Marker',cursive; font-size:2rem; letter-spacing:2px; color:var(--bb-text);
    text-shadow:3px 3px 0 var(--bb-ink), 0 0 20px rgba(139,195,74,0.2); margin:4px 0 0;
    animation:bb-title-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes bb-title-in { from{transform:translateX(-20px) rotate(-2deg);opacity:0} to{transform:none;opacity:1} }
  .bb-phase-meta { font-family:'Share Tech Mono',monospace; font-size:0.68rem; color:var(--bb-orange); letter-spacing:1px; margin-top:4px; }

  /* Ink drip under header */
  .bb-ink-drip { height:12px; position:relative; overflow:visible; }
  .bb-ink-drip::before { content:''; position:absolute; left:0; right:0; top:0; height:4px; background:var(--bb-ink); }
  .bb-ink-drip::after { content:''; position:absolute; top:0; height:12px;
    background:
      radial-gradient(ellipse 6px 10px at 8% 0, var(--bb-ink) 60%, transparent 61%),
      radial-gradient(ellipse 4px 8px at 22% 0, var(--bb-ink) 60%, transparent 61%),
      radial-gradient(ellipse 7px 11px at 41% 0, var(--bb-ink) 60%, transparent 61%),
      radial-gradient(ellipse 3px 6px at 58% 0, var(--bb-ink) 60%, transparent 61%),
      radial-gradient(ellipse 5px 9px at 73% 0, var(--bb-ink) 60%, transparent 61%),
      radial-gradient(ellipse 8px 12px at 89% 0, var(--bb-ink) 60%, transparent 61%);
    left:0; right:0; pointer-events:none; animation:bb-drip-bob 3s ease-in-out infinite alternate; }
  @keyframes bb-drip-bob { from{transform:translateY(0)} to{transform:translateY(1.5px)} }

  /* ── CARDS ── */
  .bb-step { display:none; }
  .bb-step.bb-visible { display:block; animation:bb-card-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes bb-card-in { from{opacity:0;transform:translateY(16px) rotate(var(--card-rot,0.3deg))} to{opacity:1;transform:translateY(0) rotate(var(--card-rot,0deg))} }

  .bb-card { position:relative; margin:12px 16px 16px; background:var(--bb-card-bg);
    border:3px solid var(--bb-ink); border-radius:6px; overflow:visible;
    box-shadow:4px 4px 0 rgba(26,26,26,0.7), 0 0 12px rgba(0,0,0,0.3);
    transition:transform 0.2s, box-shadow 0.2s; }
  .bb-card:hover { transform:translateY(-1px); box-shadow:5px 5px 0 rgba(26,26,26,0.7), 0 0 16px rgba(0,0,0,0.4); }

  /* Card accent stripe (left border) */
  .bb-card::before { content:''; position:absolute; left:-3px; top:6px; bottom:6px; width:5px;
    background:var(--card-accent, var(--bb-toxic)); border-radius:0 3px 3px 0;
    box-shadow:0 0 8px var(--card-accent, var(--bb-toxic)); }
  .bb-card-inner { padding:14px 16px 12px; }

  /* Card header row */
  .bb-card-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
  .bb-card-label { font-family:'Permanent Marker',cursive; font-size:0.85rem; letter-spacing:1px;
    color:var(--card-accent, var(--bb-toxic)); text-shadow:1px 1px 0 rgba(0,0,0,0.5); }
  .bb-card-time { font-family:'Share Tech Mono',monospace; font-size:0.6rem; color:var(--bb-muted); margin-left:auto; }

  /* Card body text */
  .bb-card-text { font-size:0.95rem; line-height:1.6; color:var(--bb-text); }
  .bb-card-text em { color:var(--bb-orange); font-style:normal; font-weight:700; }

  /* Card footer */
  .bb-card-foot { margin-top:8px; padding-top:6px; border-top:2px dashed rgba(255,255,255,0.1);
    font-family:'Share Tech Mono',monospace; font-size:0.6rem; color:var(--bb-muted); letter-spacing:1px; text-transform:uppercase; }
  .bb-card-foot .val { color:var(--bb-gold); font-weight:700; }

  /* ── CARD VARIANTS ── */
  /* Danger */
  .bb-card.bb-danger { --card-accent:var(--bb-red); border-color:var(--bb-red);
    box-shadow:4px 4px 0 rgba(229,57,53,0.4), 0 0 20px rgba(229,57,53,0.15); animation:bb-card-shake 0.5s ease; }
  @keyframes bb-card-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(1px)} }
  .bb-card.bb-danger:hover { transform:translateY(-1px); }

  /* Success */
  .bb-card.bb-success { --card-accent:var(--bb-toxic); border-color:var(--bb-toxic);
    box-shadow:4px 4px 0 rgba(139,195,74,0.3), 0 0 16px rgba(139,195,74,0.1); }

  /* Social / Amber */
  .bb-card.bb-social { --card-accent:var(--bb-blue); border-style:dashed; border-color:var(--bb-blue);
    background:linear-gradient(135deg, var(--bb-card-bg) 0%, rgba(66,165,245,0.06) 100%);
    box-shadow:4px 4px 0 rgba(66,165,245,0.2); }
  .bb-card.bb-amber { --card-accent:var(--bb-orange); border-color:var(--bb-orange);
    box-shadow:4px 4px 0 rgba(255,152,0,0.3), 0 0 14px rgba(255,152,0,0.1); }

  /* Wildlife */
  .bb-card.bb-wildlife { --card-accent:var(--bb-rust); border-color:var(--bb-rust);
    background:linear-gradient(135deg, var(--bb-card-bg) 0%, rgba(196,94,44,0.08) 100%);
    box-shadow:4px 4px 0 rgba(196,94,44,0.3); }

  /* Gold / legendary */
  .bb-card.bb-gold { --card-accent:var(--bb-gold); border-color:var(--bb-gold);
    background:linear-gradient(135deg, var(--bb-card-bg) 0%, rgba(255,193,7,0.06) 100%);
    box-shadow:4px 4px 0 rgba(255,193,7,0.3), 0 0 20px rgba(255,193,7,0.1);
    animation:bb-shimmer 3s ease infinite; }
  @keyframes bb-shimmer { 0%,100%{box-shadow:4px 4px 0 rgba(255,193,7,0.3), 0 0 20px rgba(255,193,7,0.1)} 50%{box-shadow:4px 4px 0 rgba(255,193,7,0.5), 0 0 30px rgba(255,193,7,0.2)} }

  /* Bomb / HERO moment */
  .bb-card.bb-bomb { --card-accent:var(--bb-red); border:4px solid var(--bb-red); border-radius:8px;
    background:radial-gradient(ellipse at 50% 0%, rgba(229,57,53,0.2) 0%, var(--bb-card-bg) 70%);
    box-shadow:6px 6px 0 rgba(229,57,53,0.5), 0 0 40px rgba(229,57,53,0.2), inset 0 0 30px rgba(229,57,53,0.08);
    animation:bb-bomb-throb 1.5s ease infinite; }
  @keyframes bb-bomb-throb { 0%,100%{box-shadow:6px 6px 0 rgba(229,57,53,0.5), 0 0 40px rgba(229,57,53,0.2)} 50%{box-shadow:8px 8px 0 rgba(229,57,53,0.7), 0 0 60px rgba(229,57,53,0.35)} }

  /* ── HERO MOMENTS ── */
  .bb-hero-stamp { text-align:center; padding:24px 16px 18px; position:relative; overflow:hidden; }
  .bb-hero-stamp::before { content:''; position:absolute; inset:-20px; background:radial-gradient(circle at 50% 50%, rgba(229,57,53,0.15), transparent 70%);
    animation:bb-pulse 2s ease infinite; }
  .bb-hero-text { position:relative; font-family:'Permanent Marker',cursive; font-size:3rem; letter-spacing:4px;
    color:var(--bb-red); transform:rotate(-3deg);
    text-shadow:4px 4px 0 var(--bb-ink), -1px -1px 0 var(--bb-ink), 0 0 30px rgba(229,57,53,0.5);
    animation:bb-stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes bb-stamp { from{transform:scale(2.5) rotate(-8deg);opacity:0} to{transform:scale(1) rotate(-3deg);opacity:1} }
  .bb-hero-sub { position:relative; font-family:'Share Tech Mono',monospace; font-size:0.72rem; letter-spacing:3px;
    color:var(--bb-orange); margin-top:6px; }

  /* Demolition variant */
  .bb-hero-stamp.demo .bb-hero-text { color:var(--bb-gold);
    text-shadow:4px 4px 0 var(--bb-ink), -1px -1px 0 var(--bb-ink), 0 0 30px rgba(255,193,7,0.5); }
  .bb-hero-stamp.demo::before { background:radial-gradient(circle at 50% 50%, rgba(255,193,7,0.12), transparent 70%); }

  /* ── VS CARD ── */
  .bb-vs { display:flex; align-items:stretch; position:relative; min-height:100px; }
  .bb-vs::before { content:''; position:absolute; left:50%; top:0; bottom:0; width:4px; transform:translateX(-50%) skewX(-8deg);
    background:repeating-linear-gradient(180deg, var(--bb-gold) 0, var(--bb-gold) 8px, transparent 8px, transparent 16px);
    box-shadow:0 0 12px rgba(255,193,7,0.4); z-index:2; }
  .bb-vs-side { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 10px; position:relative; z-index:1; }
  .bb-vs-side:first-child { background:linear-gradient(135deg, rgba(0,0,0,0.3), transparent); }
  .bb-vs-side:last-child { background:linear-gradient(-135deg, rgba(0,0,0,0.3), transparent); }
  .bb-vs-portrait { width:60px; height:60px; border-radius:50%; border:3px solid var(--bb-ink); padding:2px;
    background:rgba(0,0,0,0.5); box-shadow:3px 3px 0 var(--bb-ink), 0 0 12px currentColor;
    animation:bb-vs-slam 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
  .bb-vs-side:first-child .bb-vs-portrait { animation-delay:0s; }
  .bb-vs-side:last-child .bb-vs-portrait { animation-delay:0.15s; }
  @keyframes bb-vs-slam { from{transform:scale(0.3) translateX(var(--vs-dir,30px));opacity:0} to{transform:scale(1) translateX(0);opacity:1} }
  .bb-vs-side:first-child { --vs-dir:30px; }
  .bb-vs-side:last-child { --vs-dir:-30px; }
  .bb-vs-portrait img { width:100%; height:100%; border-radius:50%; object-fit:contain; }
  .bb-vs-name { font-family:'Permanent Marker',cursive; font-size:0.9rem; letter-spacing:1px; text-shadow:1px 1px 0 rgba(0,0,0,0.5); }
  .bb-vs-tribe { font-family:'Share Tech Mono',monospace; font-size:0.58rem; letter-spacing:2px; color:var(--bb-muted); }
  .bb-vs-mid { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:3;
    display:flex; flex-direction:column; align-items:center; gap:2px; }
  .bb-vs-mid-text { font-family:'Permanent Marker',cursive; font-size:1.6rem; color:var(--bb-gold);
    text-shadow:3px 3px 0 var(--bb-ink), 0 0 16px rgba(255,193,7,0.5);
    animation:bb-vs-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both; }
  @keyframes bb-vs-pop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

  /* ── PLAYER CHIPS ── */
  .bb-chips { display:flex; flex-wrap:wrap; gap:5px; margin:6px 0; }
  .bb-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 3px;
    background:rgba(0,0,0,0.4); border:2px solid var(--bb-ink); border-radius:16px;
    box-shadow:2px 2px 0 rgba(26,26,26,0.5); transition:transform 0.15s; }
  .bb-chip:hover { transform:scale(1.05); }
  .bb-chip-avi { width:22px; height:22px; border-radius:50%; overflow:hidden; border:2px solid var(--chip-c, var(--bb-toxic));
    box-shadow:0 0 6px var(--chip-c, var(--bb-toxic)); flex-shrink:0; }
  .bb-chip-avi img { width:100%; height:100%; border-radius:50%; object-fit:contain; }
  .bb-chip-name { font-size:0.78rem; font-weight:700; color:var(--bb-text); }

  .bb-tribe-badge { display:inline-block; padding:2px 8px; font-family:'Share Tech Mono',monospace;
    font-size:0.58rem; letter-spacing:2px; color:var(--tb-c, var(--bb-toxic)); border:2px solid var(--bb-ink);
    border-radius:3px; background:rgba(0,0,0,0.4); box-shadow:1px 1px 0 var(--bb-ink);
    text-shadow:0 0 6px var(--tb-c, var(--bb-toxic)); }

  /* ── HOST QUOTE ── */
  .bb-host { margin:14px 16px; padding:14px 16px; position:relative; background:rgba(139,195,74,0.06);
    border:3px solid var(--bb-ink); border-radius:8px; border-left:6px solid var(--bb-gold);
    box-shadow:4px 4px 0 rgba(26,26,26,0.6); font-style:italic; color:var(--bb-text); font-size:0.95rem; }
  .bb-host::before { content:''; position:absolute; left:-18px; top:12px; width:0; height:0;
    border:8px solid transparent; border-right-color:var(--bb-gold); filter:drop-shadow(-2px 0 0 var(--bb-ink)); }
  .bb-host::after { content:''; position:absolute; left:10px; top:-8px; width:22px; height:22px;
    background:var(--bb-gold); border:3px solid var(--bb-ink); border-radius:50%;
    box-shadow:2px 2px 0 var(--bb-ink), 0 0 8px rgba(255,193,7,0.3); }

  /* ── CHATTER / ATMOSPHERIC ── */
  .bb-chatter { margin:8px 16px; padding:8px 12px; font-family:'Share Tech Mono',monospace; font-size:0.72rem;
    color:var(--bb-muted); background:rgba(0,0,0,0.3); border:2px dashed rgba(255,255,255,0.08);
    border-radius:4px; letter-spacing:0.5px; display:flex; align-items:center; gap:6px; }
  .bb-chatter .bb-i { width:14px; height:14px; opacity:0.7; }

  /* ── SCOREBOARD (in-flow, not sidebar) ── */
  .bb-board { margin:12px 16px; padding:12px 14px; background:rgba(0,0,0,0.3);
    border:3px solid var(--bb-ink); border-radius:6px; box-shadow:3px 3px 0 rgba(26,26,26,0.5); }
  .bb-board-title { font-family:'Permanent Marker',cursive; font-size:0.85rem; color:var(--bb-toxic);
    margin-bottom:8px; display:flex; align-items:center; gap:6px;
    text-shadow:1px 1px 0 rgba(0,0,0,0.5); }
  .bb-board-row { display:flex; align-items:center; gap:8px; padding:5px 0;
    border-bottom:2px solid rgba(255,255,255,0.04); }
  .bb-board-row:last-child { border-bottom:none; }
  .bb-board-name { flex:1; font-size:0.85rem; font-weight:700; }
  .bb-board-stat { font-family:'Share Tech Mono',monospace; font-size:0.72rem; color:var(--bb-gold); }
  .bb-board-bar { width:80px; height:7px; background:rgba(0,0,0,0.5); border-radius:4px; overflow:hidden;
    border:1px solid rgba(255,255,255,0.08); }
  .bb-board-bar-fill { height:100%; border-radius:3px; transition:width 0.5s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:0 0 4px currentColor; }

  /* ── BOMB STAT BARS (Phase 2 result cards) ── */
  .bb-bomb-stats { display:flex; flex-direction:column; gap:6px; margin:10px 0 6px; padding:8px 10px;
    background:rgba(0,0,0,0.35); border-radius:4px; border:2px solid rgba(255,255,255,0.06); }
  .bb-bomb-stat-row { display:flex; align-items:center; gap:8px; }
  .bb-bomb-stat-label { font-family:'Permanent Marker',cursive; font-size:0.7rem; color:var(--bb-text);
    width:58px; flex-shrink:0; display:flex; align-items:center; gap:4px; letter-spacing:0.5px; }
  .bb-bomb-stat-bar { flex:1; height:8px; background:rgba(0,0,0,0.5); border-radius:4px; overflow:hidden;
    border:1px solid rgba(255,255,255,0.08); }
  .bb-bomb-stat-fill { height:100%; border-radius:3px; transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:0 0 6px currentColor; }
  .bb-bomb-stat-val { font-family:'Share Tech Mono',monospace; font-size:0.68rem; color:var(--bb-text);
    white-space:nowrap; min-width:90px; text-align:right; }

  /* ── RESOLUTION CARD (Phase 2 standings) ── */
  .bb-card.bb-resolution { --card-accent:var(--bb-gold); border:3px solid var(--bb-gold);
    background:linear-gradient(135deg, rgba(255,193,7,0.08), rgba(0,0,0,0.3)); }
  .bb-resolution-ranks { display:flex; flex-direction:column; gap:0; margin:6px 0; }
  .bb-res-row { display:flex; align-items:center; gap:8px; padding:8px 10px;
    border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.82rem; }
  .bb-res-row:last-child { border-bottom:none; }
  .bb-res-row.bb-res-boom { background:rgba(229,57,53,0.1); }
  .bb-res-row.bb-res-close { background:rgba(245,158,11,0.08); }
  .bb-res-row.bb-res-clean { background:rgba(139,195,74,0.06); }
  .bb-res-pos { font-family:'Permanent Marker',cursive; font-size:0.85rem; color:var(--bb-gold);
    width:32px; text-align:center; text-shadow:0 0 8px rgba(255,193,7,0.3); }
  .bb-res-dot { width:10px; height:10px; border-radius:50%; border:2px solid var(--bb-ink); flex-shrink:0; }
  .bb-res-name { font-weight:700; flex:1; min-width:0; }
  .bb-res-method { font-family:'Share Tech Mono',monospace; font-size:0.68rem; color:rgba(255,255,255,0.5);
    text-transform:uppercase; letter-spacing:0.5px; }
  .bb-res-status { font-family:'Share Tech Mono',monospace; font-size:0.68rem; display:flex;
    align-items:center; gap:3px; }
  .bb-res-boom .bb-res-status { color:var(--bb-red); }
  .bb-res-close .bb-res-status { color:var(--bb-amber,#f59e0b); }
  .bb-res-clean .bb-res-status { color:var(--bb-toxic); }
  .bb-res-time { font-family:'Share Tech Mono',monospace; font-size:0.72rem; color:var(--bb-text); }
  .bb-res-totem { font-family:'Share Tech Mono',monospace; font-size:0.68rem; display:flex;
    align-items:center; gap:3px; }

  /* ── CONTESTANT ROSTER GRID ── */
  .bb-roster-wrap { display:flex; flex-direction:column; gap:14px; padding:8px 0 4px; }
  .bb-roster-tribe { }
  .bb-roster-tribe-label { font-family:'Permanent Marker',cursive; font-size:0.85rem; letter-spacing:1px;
    display:flex; align-items:center; gap:6px; padding-bottom:6px; margin-bottom:8px;
    text-shadow:1px 1px 0 rgba(0,0,0,0.5); }
  .bb-roster-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .bb-roster-player { display:flex; flex-direction:column; align-items:center; width:52px; }
  .bb-roster-avi { width:40px; height:40px; border-radius:50%; border:3px solid; overflow:hidden;
    background:rgba(0,0,0,0.4); }
  .bb-roster-avi img { width:100%; height:100%; border-radius:50%; object-fit:contain; }
  .bb-roster-name { font-size:0.62rem; color:var(--bb-text); text-align:center; margin-top:3px;
    font-family:'Share Tech Mono',monospace; letter-spacing:0.5px; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; max-width:54px; }

  /* ── CHALLENGE RULES STEPS ── */
  .bb-rules-steps { display:flex; flex-direction:column; gap:12px; padding:4px 0; }
  .bb-rules-step { display:flex; gap:12px; align-items:flex-start; }
  .bb-rules-num { width:30px; height:30px; border-radius:50%; border:3px solid var(--bb-gold);
    background:rgba(255,193,7,0.1); color:var(--bb-gold); font-family:'Permanent Marker',cursive;
    font-size:1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    text-shadow:0 0 8px rgba(255,193,7,0.3); box-shadow:0 0 8px rgba(255,193,7,0.15); }
  .bb-rules-body { flex:1; min-width:0; }
  .bb-rules-label { font-family:'Permanent Marker',cursive; font-size:0.8rem; color:var(--bb-toxic);
    letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-bottom:3px;
    text-shadow:1px 1px 0 rgba(0,0,0,0.5); }
  .bb-rules-desc { font-size:0.85rem; line-height:1.5; color:var(--bb-text); }

  /* ── REVEAL BAR ── */
  .bb-reveal-bar { position:sticky; bottom:0; z-index:10; padding:10px 16px;
    background:linear-gradient(0deg, rgba(26,21,16,0.98), rgba(26,21,16,0.9));
    border-top:3px solid var(--bb-ink); display:flex; gap:12px; align-items:center; justify-content:center;
    box-shadow:0 -6px 20px rgba(0,0,0,0.5); }
  .bb-btn { font-family:'Permanent Marker',cursive; font-size:0.85rem; letter-spacing:1px; cursor:pointer;
    padding:8px 18px; border:3px solid var(--bb-ink); border-radius:4px; color:var(--bb-text);
    background:var(--bb-toxic); box-shadow:3px 3px 0 var(--bb-ink);
    transition:all 0.15s; text-transform:uppercase; }
  .bb-btn:hover { transform:translate(-1px,-1px); box-shadow:4px 4px 0 var(--bb-ink); background:#9ccc65; }
  .bb-btn:active { transform:translate(2px,2px); box-shadow:1px 1px 0 var(--bb-ink); }
  .bb-btn-danger { background:var(--bb-red); }
  .bb-btn-danger:hover { background:#ef5350; }
  .bb-counter { font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:var(--bb-gold);
    letter-spacing:1px; text-shadow:0 0 6px rgba(255,193,7,0.4); }

  /* ── ICONS — thick ink-outlined, cel-shaded ── */
  .bb-i { display:inline-block; width:22px; height:22px; vertical-align:middle; position:relative; flex-shrink:0; }

  /* AXE — chopping axe */
  .bb-i-axe::before { content:''; position:absolute; left:5px; top:2px; width:3px; height:16px; background:var(--bb-paper);
    border:2px solid var(--bb-ink); border-radius:1px; }
  .bb-i-axe::after { content:''; position:absolute; left:1px; top:1px; width:12px; height:8px;
    background:var(--bb-muted); border:2px solid var(--bb-ink); border-radius:2px 8px 8px 0; }

  /* BOMB — round with fuse */
  .bb-i-bomb::before { content:''; position:absolute; left:3px; top:6px; width:14px; height:14px;
    background:#333; border:2px solid var(--bb-ink); border-radius:50%;
    box-shadow:inset 0 -3px 0 rgba(255,255,255,0.1); }
  .bb-i-bomb::after { content:''; position:absolute; right:2px; top:1px; width:5px; height:6px;
    background:var(--bb-orange); clip-path:polygon(20% 100%,50% 0,80% 100%);
    filter:drop-shadow(0 0 4px var(--bb-orange)); animation:bb-flicker 0.3s ease infinite alternate; }
  @keyframes bb-flicker { from{opacity:0.7;transform:scaleY(0.9)} to{opacity:1;transform:scaleY(1.1)} }

  /* TOTEM — carved pillar */
  .bb-i-totem::before { content:''; position:absolute; left:7px; top:1px; width:8px; height:18px;
    background:linear-gradient(180deg, var(--bb-rust) 0%, #8d6e40 100%); border:2px solid var(--bb-ink); border-radius:2px; }
  .bb-i-totem::after { content:''; position:absolute; left:9px; top:4px; width:4px; height:3px;
    background:var(--bb-ink); border-radius:50%; box-shadow:0 5px 0 var(--bb-ink), 0 10px 0 var(--bb-ink); }

  /* TRAMPOLINE */
  .bb-i-tramp::before { content:''; position:absolute; left:2px; right:2px; bottom:3px; height:6px;
    border:2px solid var(--bb-ink); border-radius:0 0 50% 50%; background:var(--bb-blue); }
  .bb-i-tramp::after { content:''; position:absolute; left:1px; right:1px; bottom:8px; height:3px;
    background:var(--bb-ink); border-radius:1px; }

  /* SAW — circular */
  .bb-i-saw::before { content:''; position:absolute; inset:3px; border:2px solid var(--bb-ink);
    border-radius:50%; background:var(--bb-muted); animation:bb-spin 2.5s linear infinite; }
  .bb-i-saw::after { content:''; position:absolute; left:50%; top:3px; width:2px; height:8px;
    background:var(--bb-ink); transform:translateX(-50%); }
  @keyframes bb-spin { to{transform:rotate(360deg)} }

  /* STACK — human pyramid */
  .bb-i-stack::before { content:''; position:absolute; inset:2px;
    background:var(--bb-toxic); clip-path:polygon(50% 5%, 15% 90%, 85% 90%);
    border:2px solid var(--bb-ink); }
  .bb-i-stack::after { content:''; position:absolute; left:8px; top:3px; width:6px; height:5px;
    background:var(--bb-paper); border:2px solid var(--bb-ink); border-radius:50%; }

  /* BEAR */
  .bb-i-bear::before { content:''; position:absolute; left:3px; top:6px; width:15px; height:12px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:50% 50% 40% 40%; }
  .bb-i-bear::after { content:''; position:absolute; left:3px; top:3px; width:5px; height:5px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:50%;
    box-shadow:10px 0 0 var(--bb-rust), 10px 0 0 0 2px var(--bb-ink); }

  /* SQUIRREL */
  .bb-i-squirrel::before { content:''; position:absolute; left:4px; top:7px; width:10px; height:9px;
    background:var(--bb-orange); border:2px solid var(--bb-ink); border-radius:60% 40% 30% 50%; }
  .bb-i-squirrel::after { content:''; position:absolute; right:1px; top:2px; width:7px; height:14px;
    background:var(--bb-orange); border:2px solid var(--bb-ink); border-radius:50%; transform:rotate(20deg); }

  /* RACCOON */
  .bb-i-raccoon::before { content:''; position:absolute; left:3px; top:6px; width:15px; height:11px;
    background:var(--bb-muted); border:2px solid var(--bb-ink); border-radius:50%; }
  .bb-i-raccoon::after { content:''; position:absolute; left:6px; top:9px; width:3px; height:3px;
    background:var(--bb-ink); border-radius:50%; box-shadow:6px 0 0 var(--bb-ink); }

  /* BEAVER */
  .bb-i-beaver::before { content:''; position:absolute; left:3px; top:7px; width:12px; height:10px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:50%; }
  .bb-i-beaver::after { content:''; position:absolute; right:0; bottom:3px; width:8px; height:4px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:0 40% 40% 0; }

  /* SKUNK */
  .bb-i-skunk::before { content:''; position:absolute; left:3px; top:6px; width:14px; height:11px;
    background:#333; border:2px solid var(--bb-ink); border-radius:50%; }
  .bb-i-skunk::after { content:''; position:absolute; left:8px; top:6px; width:3px; height:12px;
    background:var(--bb-paper); border-radius:1px; }

  /* HAWK */
  .bb-i-hawk::before { content:''; position:absolute; left:1px; right:1px; top:8px; height:3px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:50%;
    transform:rotate(-12deg); }
  .bb-i-hawk::after { content:''; position:absolute; left:1px; right:1px; top:12px; height:3px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); border-radius:50%;
    transform:rotate(12deg); }

  /* CABIN */
  .bb-i-cabin::before { content:''; position:absolute; left:3px; bottom:2px; width:14px; height:9px;
    background:var(--bb-rust); border:2px solid var(--bb-ink); }
  .bb-i-cabin::after { content:''; position:absolute; left:2px; top:4px; width:0; height:0;
    border-left:9px solid transparent; border-right:9px solid transparent;
    border-bottom:8px solid var(--bb-gold); filter:drop-shadow(0 -1px 0 var(--bb-ink)); }

  /* WATERFALL */
  .bb-i-waterfall::before { content:''; position:absolute; left:5px; right:5px; top:1px; bottom:1px;
    background:linear-gradient(180deg, var(--bb-blue), var(--bb-teal)); border:2px solid var(--bb-ink);
    border-radius:2px; animation:bb-water-flow 1.2s linear infinite; }
  @keyframes bb-water-flow { from{background-position:0 0} to{background-position:0 20px} }

  /* HELICOPTER */
  .bb-i-heli::before { content:''; position:absolute; left:4px; top:10px; width:14px; height:6px;
    background:var(--bb-teal); border:2px solid var(--bb-ink); border-radius:30%; }
  .bb-i-heli::after { content:''; position:absolute; left:2px; right:2px; top:5px; height:3px;
    background:var(--bb-ink); animation:bb-rotor 0.3s linear infinite; }
  @keyframes bb-rotor { from{transform:scaleX(1)} to{transform:scaleX(-1)} }

  /* EXPLOSION */
  .bb-i-explosion::before { content:''; position:absolute; inset:1px;
    background:radial-gradient(circle, var(--bb-gold) 20%, var(--bb-orange) 50%, var(--bb-red) 80%, transparent 100%);
    clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
    animation:bb-explode-pulse 0.6s ease infinite; filter:drop-shadow(0 0 4px var(--bb-orange)); }
  @keyframes bb-explode-pulse { 0%,100%{transform:scale(0.9)} 50%{transform:scale(1.15)} }

  /* SKULL */
  .bb-i-skull::before { content:''; position:absolute; left:4px; top:2px; width:13px; height:12px;
    background:var(--bb-paper); border:2px solid var(--bb-ink); border-radius:50% 50% 30% 30%; }
  .bb-i-skull::after { content:''; position:absolute; left:7px; top:7px; width:3px; height:3px;
    background:var(--bb-ink); border-radius:50%; box-shadow:5px 0 0 var(--bb-ink); }

  /* HEART */
  .bb-i-heart { animation:bb-heartbeat 1s ease infinite; }
  .bb-i-heart::before, .bb-i-heart::after { content:''; position:absolute; width:8px; height:12px;
    background:var(--bb-red); border:2px solid var(--bb-ink); border-radius:50% 50% 0 0; }
  .bb-i-heart::before { left:2px; top:5px; transform:rotate(-45deg); transform-origin:bottom right; }
  .bb-i-heart::after { right:2px; top:5px; transform:rotate(45deg); transform-origin:bottom left; }
  @keyframes bb-heartbeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.15)} 30%{transform:scale(1)} }

  /* STAR */
  .bb-i-star::before { content:''; position:absolute; inset:2px;
    background:var(--bb-gold); border:2px solid var(--bb-ink);
    clip-path:polygon(50% 0,63% 35%,100% 35%,70% 57%,82% 100%,50% 72%,18% 100%,30% 57%,0% 35%,37% 35%);
    animation:bb-pulse 2s ease infinite; }
  @keyframes bb-pulse { 0%,100%{filter:drop-shadow(0 0 2px currentColor)} 50%{filter:drop-shadow(0 0 6px currentColor)} }

  /* FIST */
  .bb-i-fist::before { content:''; position:absolute; left:4px; top:4px; width:12px; height:13px;
    background:var(--bb-paper); border:2px solid var(--bb-ink); border-radius:4px 4px 2px 2px; }
  .bb-i-fist::after { content:''; position:absolute; left:5px; top:7px; width:10px; height:2px;
    background:var(--bb-ink); box-shadow:0 3px 0 var(--bb-ink); }

  /* MEGAPHONE */
  .bb-i-mega::before { content:''; position:absolute; left:2px; top:6px; width:6px; height:8px;
    background:var(--bb-gold); border:2px solid var(--bb-ink); border-radius:2px; }
  .bb-i-mega::after { content:''; position:absolute; left:8px; top:3px; width:0; height:0;
    border-top:7px solid transparent; border-bottom:7px solid transparent;
    border-left:10px solid var(--bb-gold); filter:drop-shadow(1px 0 0 var(--bb-ink)); }

  /* TARGET / CROSSHAIR */
  .bb-i-target::before { content:''; position:absolute; inset:3px; border:2px solid var(--bb-toxic);
    border-radius:50%; }
  .bb-i-target::after { content:''; position:absolute; left:50%; top:50%; width:4px; height:4px;
    background:var(--bb-red); border:1px solid var(--bb-ink); border-radius:50%; transform:translate(-50%,-50%); }

  /* BOLT / LIGHTNING */
  .bb-i-bolt::before { content:''; position:absolute; inset:2px;
    background:var(--bb-gold); clip-path:polygon(55% 0,80% 40%,60% 40%,85% 100%,30% 50%,50% 50%,25% 15%);
    filter:drop-shadow(0 0 4px var(--bb-gold)); animation:bb-bolt-flash 1.5s ease infinite; }
  @keyframes bb-bolt-flash { 0%,100%{opacity:1} 40%{opacity:0.5} 45%{opacity:1} 90%{opacity:0.7} }

  /* RIBBON / ACHIEVEMENT */
  .bb-i-ribbon::before { content:''; position:absolute; left:5px; top:2px; width:10px; height:10px;
    background:var(--bb-gold); border:2px solid var(--bb-ink); border-radius:50%; }
  .bb-i-ribbon::after { content:''; position:absolute; left:7px; top:12px; width:0; height:0;
    border-left:4px solid transparent; border-right:4px solid transparent;
    border-top:6px solid var(--bb-red); }

  /* COMPASS */
  .bb-i-compass::before { content:''; position:absolute; inset:2px; border:2px solid var(--bb-ink);
    border-radius:50%; background:var(--bb-paper); }
  .bb-i-compass::after { content:''; position:absolute; left:50%; top:4px; width:2px; height:7px;
    background:var(--bb-red); transform:translateX(-50%) rotate(25deg); transform-origin:50% 100%;
    box-shadow:0 0 0 1px var(--bb-ink); animation:bb-compass-wobble 3s ease-in-out infinite; }
  @keyframes bb-compass-wobble { 0%,100%{transform:translateX(-50%) rotate(25deg)} 50%{transform:translateX(-50%) rotate(-15deg)} }

  /* SHIELD */
  .bb-i-shield::before { content:''; position:absolute; left:3px; top:2px; width:14px; height:16px;
    background:var(--bb-blue); border:2px solid var(--bb-ink);
    clip-path:polygon(50% 100%,0% 30%,0% 0%,100% 0%,100% 30%); }

  /* BOND */
  .bb-i-bond::before, .bb-i-bond::after { content:''; position:absolute; width:10px; height:10px;
    border:2px solid var(--bb-toxic); border-radius:50%; top:6px; }
  .bb-i-bond::before { left:1px; background:rgba(139,195,74,0.15); }
  .bb-i-bond::after { right:1px; background:rgba(139,195,74,0.15); }

  /* RIVALRY */
  .bb-i-rivalry::before, .bb-i-rivalry::after { content:''; position:absolute; width:16px; height:3px;
    background:var(--bb-red); top:50%; left:50%; border:1px solid var(--bb-ink); }
  .bb-i-rivalry::before { transform:translate(-50%,-50%) rotate(45deg); }
  .bb-i-rivalry::after { transform:translate(-50%,-50%) rotate(-45deg); }

  /* SPARK */
  .bb-i-spark::before { content:''; position:absolute; inset:5px; background:var(--bb-teal);
    border-radius:50%; border:2px solid var(--bb-ink); animation:bb-spark-pop 1s ease infinite;
    box-shadow:0 0 8px var(--bb-teal); }
  @keyframes bb-spark-pop { 0%,100%{transform:scale(0.8);opacity:0.6} 50%{transform:scale(1.2);opacity:1} }

  /* WARNING */
  .bb-i-warning::before { content:''; position:absolute; inset:2px;
    background:var(--bb-gold); clip-path:polygon(50% 5%,95% 90%,5% 90%);
    border:2px solid var(--bb-ink); animation:bb-warn-flash 1s ease infinite; }
  .bb-i-warning::after { content:'!'; position:absolute; inset:0; display:flex; align-items:center;
    justify-content:center; color:var(--bb-ink); font-weight:900; font-size:12px; padding-top:4px; }
  @keyframes bb-warn-flash { 0%,100%{filter:none} 50%{filter:drop-shadow(0 0 6px var(--bb-gold))} }

  /* BIOHAZARD */
  .bb-i-biohazard { animation:bb-bio-spin 6s linear infinite; }
  .bb-i-biohazard::before, .bb-i-biohazard::after { content:''; position:absolute; left:50%; top:50%;
    width:7px; height:7px; background:var(--bb-toxic); border:2px solid var(--bb-ink); border-radius:50%; }
  .bb-i-biohazard::before { transform:translate(-50%,-50%) translateY(-7px); }
  .bb-i-biohazard::after { transform:translate(-50%,-50%) translate(6px,3px);
    box-shadow:-12px 0 0 var(--bb-toxic), -13px 0 0 1px var(--bb-ink); }
  @keyframes bb-bio-spin { to{transform:rotate(360deg)} }

  /* SLIME */
  .bb-i-slime::before { content:''; position:absolute; left:50%; top:2px; transform:translateX(-50%);
    width:8px; height:14px; background:var(--bb-toxic); border:2px solid var(--bb-ink);
    border-radius:50% 50% 50% 50% / 30% 30% 70% 70%;
    animation:bb-slime-drip 1.5s ease infinite; }
  @keyframes bb-slime-drip { 0%,100%{transform:translateX(-50%) scaleY(1)} 50%{transform:translateX(-50%) scaleY(1.15)} }

  /* ── REDUCED MOTION ── */
  @media(prefers-reduced-motion:reduce) {
    .bb-shell::after, .bb-i-biohazard, .bb-i-saw::before, .bb-i-heli::after, .bb-i-bomb::after,
    .bb-i-heart, .bb-i-star::before, .bb-i-bolt::before, .bb-i-spark::before, .bb-i-warning::before,
    .bb-i-explosion::before, .bb-i-compass::after, .bb-i-slime::before, .bb-i-waterfall::before,
    .bb-card.bb-bomb, .bb-hero-text, .bb-vs-portrait, .bb-vs-mid-text, .bb-phase-header::before,
    .bb-phase-title, .bb-card.bb-gold, .bb-ink-drip::after, .bb-sb-badge { animation:none !important; }
    .bb-step.bb-visible { animation:none !important; }
  }
  </style>`;
}

// ── SIDEBAR BUILDER ──
function _buildSidebar(ep, screenKey, phase, totalSteps) {
  const data = ep.brutaler;
  if (!data) return '<div class="bb-sidebar"></div>';
  const tribeNames = Object.keys(data.tribes);
  const st = _tvState[screenKey] || { idx: -1 };
  const allRevealed = totalSteps == null || st.idx >= totalSteps - 1;

  // Build a set of tribes/players whose cards have been revealed on THIS screen
  const revealedTribes = new Set();
  const revealedPlayers = new Set();
  if (screenKey && totalSteps != null) {
    const stepsData = window._brutalerSteps?.[screenKey] || [];
    for (let i = 0; i <= Math.min(st.idx, stepsData.length - 1); i++) {
      const s = stepsData[i];
      if (s?.tribe) revealedTribes.add(s.tribe);
      if (s?.player) revealedPlayers.add(s.player);
      if (s?.players) s.players.forEach(p => revealedPlayers.add(p));
    }
  }

  let html = '<div class="bb-sidebar">';

  // Header
  html += '<div class="bb-sb-header">';
  html += `<div class="bb-sb-title">${_icon('megaphone')} ROSTER</div>`;
  const phaseLabels = ['BRIEF','DEBATE','CUT','RACE','FINAL'];
  html += `<div class="bb-sb-phase">PHASE ${phase} · ${phaseLabels[phase] || ''}</div>`;

  // Bomb timer (phase 2+)
  if (phase >= 2) {
    const anyDet = allRevealed && tribeNames.some(n => data.tribes[n].bombDetonated);
    const timerStr = !allRevealed ? '02:14' : (phase >= 3 ? (anyDet ? '00:00' : '00:08') : (anyDet ? '00:00' : '00:08'));
    const bombLabel = !allRevealed ? 'ARMED' : (anyDet ? 'DETONATED' : 'DISARMED');
    html += `<div class="bb-sb-bomb">`;
    html += `${_icon('bomb')}`;
    html += `<span class="bb-sb-bomb-label">${bombLabel}</span>`;
    html += `<span class="bb-sb-bomb-time">T-${timerStr}</span>`;
    html += `</div>`;
  }
  html += '</div>';

  // Per-tribe sections
  tribeNames.forEach(name => {
    const t = data.tribes[name];
    const tc = tribeColor(name);
    const members = t.members || [];
    const tribeRevealed = revealedTribes.has(name);

    html += `<div class="bb-sb-tribe">`;
    html += `<div class="bb-sb-tribe-header" style="--tb-c:${tc}">`;
    html += `<span class="bb-sb-tribe-dot" style="background:${tc};box-shadow:0 0 6px ${tc}"></span>`;
    html += `<span class="bb-sb-tribe-name" style="color:${tc}">${name.toUpperCase()}</span>`;
    html += `</div>`;

    // Method (show from phase 2+ only — phase 1 is the debate, showing method spoils the reveal)
    if (t.method && phase >= 2) {
      const mIcon = t.method === 'trampoline' ? 'trampoline' : t.method === 'sawclimb' ? 'saw' : 'stack';
      html += `<div class="bb-sb-stat">${_icon(mIcon)} <span style="color:var(--bb-text)">${t.methodLabel || '—'}</span></div>`;
    }

    // Totem condition (phase 2+ — only update once tribe's bomb result is revealed)
    if (phase >= 2) {
      const showFinalCond = phase >= 3 || (phase === 2 && allRevealed);
      const cond = showFinalCond ? Math.round(t.totemCondition != null ? t.totemCondition : 100) : 100;
      const cls = cond < 70 ? 'danger' : '';
      html += `<div class="bb-sb-stat">${_icon('totem')} TOTEM`;
      html += `<div class="bb-sb-bar"><div class="bb-sb-bar-fill ${cls}" style="width:${cond}%"></div></div>`;
      html += `<span class="bb-sb-bar-val">${cond}%</span></div>`;
    }

    // Head start from cut time (phase 3+ — shown as the gap behind 1st cutter)
    if (phase >= 3 && data.phase2?.cutOrder) {
      const cutLeader = data.phase2.cutOrder[0];
      const fastestTime = data.tribes[cutLeader]?.timeSpent || 0;
      const gap = t.timeSpent - fastestTime;
      if (name === cutLeader) {
        html += `<div class="bb-sb-stat">${_icon('bomb')} <span style="color:var(--bb-toxic)">HEAD START: LEADER</span></div>`;
      } else {
        html += `<div class="bb-sb-stat">${_icon('bomb')} <span style="color:var(--bb-amber,#f59e0b)">HEAD START: −${gap.toFixed(1)}s</span></div>`;
      }
    }

    // Finish position (only after all race cards revealed, or on results phase)
    if (phase >= 3 && data.tribeFinishOrder && (phase >= 4 || allRevealed)) {
      const pos = data.tribeFinishOrder.indexOf(name) + 1;
      if (pos > 0) {
        const posLabel = pos === 1 ? '1ST' : pos === 2 ? '2ND' : pos === 3 ? '3RD' : `${pos}TH`;
        const arrival = t.arrivalTime ? `${t.arrivalTime.toFixed(1)}s` : '';
        html += `<div class="bb-sb-stat">${_icon('ribbon')} <span style="color:${pos === 1 ? 'var(--bb-gold)' : 'var(--bb-text)'}">ARRIVED: ${posLabel}${arrival ? ` · ${arrival}` : ''}</span></div>`;
      }
    }

    // Player roster with role tags instead of scores
    const tribeBeats = (data.phase2?.beats || []).filter(b => b.tribe === name);
    const raceBeats3 = (data.phase3?.raceBeats || []).filter(b => b.tribe === name);
    members.forEach(pName => {
      const isChampion = t.champion === pName;
      const playerRevealed = revealedPlayers.has(pName);
      html += `<div class="bb-sb-player">`;
      html += `<div class="bb-sb-avatar" style="border-color:${tc}">${portrait(pName, 22)}</div>`;
      html += `<span class="bb-sb-player-name">${pName}</span>`;
      if (isChampion && phase >= 2) html += `<span class="bb-sb-badge" title="Champion">★</span>`;

      // Role tag — derived from what this player did in the simulation
      if (phase >= 2 && (allRevealed || playerRevealed)) {
        let role = '';
        const pBeat = tribeBeats.find(b => b.name === pName);
        if (pBeat) {
          if (pBeat.kind === 'trampoline') role = pBeat.outcome === 'glory' ? 'JUMPER ✓' : pBeat.outcome === 'chicken' ? 'CHICKEN' : pBeat.outcome === 'slam' ? 'JUMPER ✗' : 'JUMPER';
          else if (pBeat.kind === 'sawclimb') role = pBeat.outcome === 'glory' ? 'CLIMBER ✓' : pBeat.outcome === 'fall' ? 'CLIMBER ✗' : 'CLIMBER';
          else if (pBeat.kind === 'engineer') role = 'ENGINEER';
          else if (pBeat.kind === 'base') role = 'BASE';
          else if (pBeat.kind === 'middle') role = 'MIDDLE';
          else if (pBeat.kind === 'apex' || pBeat.kind === 'collapse') role = pBeat.kind === 'apex' ? 'APEX ✓' : 'APEX ✗';
          else if (pBeat.kind === 'rescue') role = 'RESCUE';
          else if (pBeat.kind === 'holder') role = pBeat.outcome === 'good' ? 'HOLDER ✓' : 'HOLDER ✗';
          else if (pBeat.kind === 'spotter') role = pBeat.outcome === 'good' ? 'SPOTTER ✓' : 'SPOTTER ✗';
          else if (pBeat.kind === 'brace') role = pBeat.outcome === 'good' ? 'BRACE ✓' : 'BRACE ✗';
        }
        const isVictim = t.bombVictim === pName;
        if (isVictim) role = 'BLAST ZONE';
        if (phase >= 3) {
          const anchor3 = raceBeats3.find(b => b.name === pName && ['smooth', 'rough'].includes(b.kind));
          if (anchor3) role = 'ANCHOR';
          const carrier3 = raceBeats3.filter(b => b.name === pName && b.kind?.startsWith('carrier-'));
          if (carrier3.length) {
            const goodCount = carrier3.filter(b => b.kind === 'carrier-good').length;
            role = goodCount >= 2 ? 'CARRIER ✓' : goodCount === 0 ? 'CARRIER ✗' : 'CARRIER';
          }
          const heroSave3 = raceBeats3.find(b => b.heroName === pName);
          if (heroSave3) role = 'HERO SAVE';
          const wasSaved3 = raceBeats3.find(b => b.fallerName === pName || b.target === pName);
          if (wasSaved3 && !heroSave3) role = 'SAVED';
          const shove3 = raceBeats3.find(b => b.villain === pName);
          if (shove3) role = 'SHOVED';
        }
        if (role) html += `<span class="bb-sb-role">${role}</span>`;
      }

      html += `</div>`;
    });

    html += '</div>';
  });

  // Footer
  html += '<div class="bb-sb-footer">';
  const wildlife = phase >= 2 ? 'HOSTILE' : 'CLEAR';
  html += `<div class="bb-sb-footer-stat">${_icon('warning')} WILDLIFE <span class="val">${wildlife}</span></div>`;
  if (data.tribeFinishOrder && phase >= 4) {
    html += `<div class="bb-sb-footer-stat">${_icon('star')} FIRST TO ARRIVE <span class="val">${data.tribeFinishOrder[0]?.toUpperCase() || '—'}</span></div>`;
  }
  html += '</div>';

  html += '</div>';
  return html;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, phaseIdx, phaseTag, phaseTitle, phaseMeta, screenKey, totalSteps) {
  const data = ep.brutaler;
  if (typeof window !== 'undefined') {
    window._brutalerEp = ep;
    window._brutalerData = data;
  }
  return `${_css()}
  <div class="bb-shell bb-phase-${phaseIdx}" data-phase="${phaseIdx}" data-screen-key="${screenKey || ''}">
    <div class="bb-phase-header">
      <div class="bb-phase-tag">${phaseTag}</div>
      <h2 class="bb-phase-title">${phaseTitle}</h2>
      <div class="bb-phase-meta">${phaseMeta}</div>
    </div>
    <div class="bb-ink-drip"></div>
    <div class="bb-layout">
      <div class="bb-main">
        ${content}
      </div>
      ${_buildSidebar(ep, screenKey, phaseIdx, totalSteps)}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildBigBaddTitleCard(ep) {
  const data = ep.brutaler;
  if (!data) return '';

  // Visual tribe roster — avatars grouped by tribe
  const tribeRoster = Object.keys(data.tribes).map(name => {
    const tc = tribeColor(name);
    const t = data.tribes[name];
    const members = t.members || [];
    const avatarGrid = members.map(m =>
      `<div class="bb-roster-player">
        <div class="bb-roster-avi" style="border-color:${tc};box-shadow:0 0 6px ${tc}">${portrait(m, 36)}</div>
        <div class="bb-roster-name">${m}</div>
      </div>`
    ).join('');
    return `<div class="bb-roster-tribe">
      <div class="bb-roster-tribe-label" style="color:${tc};border-bottom:2px solid ${tc}">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${tc};border:2px solid var(--bb-ink);box-shadow:0 0 6px ${tc}"></span>
        ${name.toUpperCase()} <span style="color:var(--bb-muted);font-size:0.7rem">(${members.length})</span>
      </div>
      <div class="bb-roster-grid">${avatarGrid}</div>
    </div>`;
  }).join('');

  const totalPlayers = Object.values(data.tribes).reduce((acc, t) => acc + (t.members?.length || 0), 0);

  const content = `
    <div class="bb-host">${data.hostLines.intro}</div>
    <div class="bb-chatter">${pick(CHATTER.phase0)}</div>

    <div class="bb-card">
      <div class="bb-card-inner">
        <div class="bb-card-head">${_icon('target')} <span class="bb-card-label">CONTESTANTS</span>
          <span style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--bb-muted);margin-left:auto">${totalPlayers} PLAYERS</span>
        </div>
        <div class="bb-roster-wrap">${tribeRoster}</div>
      </div>
    </div>

    <div class="bb-card bb-gold">
      <div class="bb-card-inner">
        <div class="bb-card-head">${_icon('totem')} <span class="bb-card-label" style="color:var(--bb-gold)">CHALLENGE RULES</span></div>
        <div class="bb-rules-steps">
          <div class="bb-rules-step">
            <div class="bb-rules-num">1</div>
            <div class="bb-rules-body">
              <div class="bb-rules-label">${_icon('megaphone')} METHOD DEBATE</div>
              <div class="bb-rules-desc">Each tribe picks HOW to get the axe out of the tree — <em>trampoline</em>, <em>saw & climb</em>, or <em>human stack</em>. Only one tribe can claim each method.</div>
            </div>
          </div>
          <div class="bb-rules-step">
            <div class="bb-rules-num">2</div>
            <div class="bb-rules-body">
              <div class="bb-rules-label">${_icon('bomb')} CUT THE TOTEM</div>
              <div class="bb-rules-desc">Use your method to reach the axe and cut your totem pole free from the tree. A <span style="color:var(--bb-red);font-weight:700">bomb on a 7-minute timer</span> is strapped to each totem. Cut it loose before it blows.</div>
            </div>
          </div>
          <div class="bb-rules-step">
            <div class="bb-rules-num">3</div>
            <div class="bb-rules-body">
              <div class="bb-rules-label">${_icon('waterfall')} RACE TO CAMP</div>
              <div class="bb-rules-desc">Ride the totem down the waterfall and slope to camp. Hold on or get thrown off. First tribe to camp <span style="color:var(--bb-gold);font-weight:700">picks the luxury cabin</span>. Last tribe in <span style="color:var(--bb-red);font-weight:700">crashes through and destroys it</span>.</div>
            </div>
          </div>
        </div>
        <div class="bb-card-foot">${_icon('star')} FIELD STATUS · STAGED ${_icon('warning')} WILDLIFE: NORMAL ${_icon('shield')} INSURANCE: <span class="val">PENDING</span></div>
      </div>
    </div>
  `;

  if (typeof window !== 'undefined') {
    if (!window._brutalerScreenBuilders) window._brutalerScreenBuilders = {};
    window._brutalerScreenBuilders['bb-title'] = rpBuildBigBaddTitleCard;
  }
  return _shell(content, ep, 0, 'PHASE 00 · BRIEF', 'BIGGER! BADDER! BRUTAL-ER!', `${_icon('bomb')} TOTEM · RACE · CABIN`, 'bb-title');
}

// ══════════════════════════════════════════════════════════════
// PHASE 1 — METHOD DEBATE
// ══════════════════════════════════════════════════════════════
export function rpBuildBigBaddPhase1(ep) {
  const data = ep.brutaler;
  if (!data?.phase1) return '';
  const debates = data.phase1.debates || [];

  const steps = [];
  debates.forEach(d => {
    steps.push({ kind: 'tribeHeader', tribe: d.tribe, debate: d });
    d.advocacy.forEach(a => steps.push({ kind: 'advocacy', tribe: d.tribe, data: a }));
    d.interjections.forEach(i => steps.push({ kind: 'interject', tribe: d.tribe, data: i }));
    steps.push({ kind: 'decision', tribe: d.tribe, debate: d });
  });
  const conflicts = data.phase1.interTribeConflicts || [];
  conflicts.forEach(c => {
    steps.push({ kind: 'conflictHeader', conflict: c });
    steps.push({ kind: 'conflictResolution', conflict: c });
    c.losersUpdated.forEach(lu => steps.push({ kind: 'reluctantSwitch', data: lu, conflict: c }));
  });
  const fallbackTribes = new Set();
  conflicts.forEach(c => c.losersUpdated.forEach(lu => fallbackTribes.add(lu.tribe)));
  debates.forEach(d => {
    const t = data.tribes[d.tribe];
    const isFallback = fallbackTribes.has(d.tribe);
    let fitText;
    if (isFallback) {
      fitText = t.fitMod >= 0.5
        ? pick([
            (champ, method) => `Tribe stats lean exactly into ${method}. Lucky break — the fallback fits better than the original plan.`,
            (champ, method) => `Silver lining: ${method} actually suits this roster. The forced pivot might have been a gift.`,
            (champ, method) => `${method} wasn't the plan, but it fits. The tribe moves out with more confidence than they expected.`,
          ])(t.champion, t.methodLabel)
        : (t.fitMod <= -0.5
          ? pick([
              (champ, method) => `Forced into ${method} and it shows. The tribe's stats don't favor this approach. They'll have to outwork the gap.`,
              (champ, method) => `${method} was nobody's first choice — and the tribe's skillset proves it. Uphill from here.`,
              (champ, method) => `The fallback hurts. ${method} doesn't play to this roster's strengths. They know it.`,
            ])(t.champion, t.methodLabel)
          : null);
    } else {
      fitText = t.fitMod >= 0.5 ? pick(METHOD_DECISION.goodFit)(t.champion, t.methodLabel) : (t.fitMod <= -0.5 ? pick(METHOD_DECISION.badFit)(t.champion, t.methodLabel) : null);
    }
    const finalEntry = { tribe: d.tribe, method: t.method, methodLabel: t.methodLabel, fitMod: t.fitMod, fitText };
    if (finalEntry.fitText) steps.push({ kind: 'finalFit', tribe: d.tribe, data: finalEntry });
  });

  const total = steps.length;
  const st = _ensureState('bb-phase1', total);

  let cards = `<div class="bb-host">${data.hostLines.phase1}</div>`;

  steps.forEach((step, i) => {
    const vis = st.idx >= i ? 'bb-visible' : '';
    const tc = tribeColor(step.tribe);
    let card = '';

    if (step.kind === 'tribeHeader') {
      card = `<div class="bb-card" style="--card-accent:${tc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('target')} <span class="bb-card-label" style="color:${tc}">DEBATE · ${step.tribe.toUpperCase()}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          <div class="bb-card-text">Three champions. Three methods. The tribe must agree before the bomb does.</div>
        </div>
      </div>`;
    } else if (step.kind === 'advocacy') {
      const a = step.data;
      const mIcon = a.method === 'trampoline' ? 'trampoline' : a.method === 'sawclimb' ? 'saw' : 'stack';
      const mLabel = methodLabelFor(a.method);
      card = `<div class="bb-card" style="--card-accent:${tc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(mIcon)} <span class="bb-card-label">CHAMPION · ${mLabel}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${_playerChips([a.champion], step.tribe)}
          <div class="bb-card-text">${a.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'interject') {
      const it = step.data;
      card = `<div class="bb-card bb-amber">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('fist')} <span class="bb-card-label">INTERJECT · ${(it.archetype || '').toUpperCase()}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${_playerChips([it.speaker], step.tribe)}
          <div class="bb-card-text">${it.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'decision') {
      const d = step.debate;
      card = `<div class="bb-card bb-success" style="--card-accent:${tc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('star')} <span class="bb-card-label">PICK · ${d.methodLabel}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${_playerChips([d.winner], step.tribe)}
          <div class="bb-card-text">${d.decisionText}</div>
          <div class="bb-card-foot">${_icon('warning')} CHECKING FOR CROSS-TRIBE CONFLICT</div>
        </div>
      </div>`;
    } else if (step.kind === 'conflictHeader') {
      const c = step.conflict;
      const winnerName = c.winnerClaim.champion;
      const winnerTribe = c.winnerClaim.tribe;
      const winnerTC = tribeColor(winnerTribe);
      const loserName = c.loserClaims[0].champion;
      const loserTribe = c.loserClaims[0].tribe;
      const loserTC = tribeColor(loserTribe);
      card = `<div class="bb-card bb-danger">
        <div class="bb-vs">
          <div class="bb-vs-side" style="color:${winnerTC}">
            <div class="bb-vs-portrait" style="border-color:${winnerTC};box-shadow:3px 3px 0 var(--bb-ink), 0 0 12px ${winnerTC}">${portrait(winnerName, 52)}</div>
            <div class="bb-vs-name" style="color:${winnerTC}">${winnerName}</div>
            <div class="bb-vs-tribe">${winnerTribe.toUpperCase()}</div>
          </div>
          <div class="bb-vs-mid">
            ${_icon('bolt')}
            <div class="bb-vs-mid-text">VS</div>
          </div>
          <div class="bb-vs-side" style="color:${loserTC}">
            <div class="bb-vs-portrait" style="border-color:${loserTC};box-shadow:3px 3px 0 var(--bb-ink), 0 0 12px ${loserTC}">${portrait(loserName, 52)}</div>
            <div class="bb-vs-name" style="color:${loserTC}">${loserName}</div>
            <div class="bb-vs-tribe">${loserTribe.toUpperCase()}</div>
          </div>
        </div>
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('rivalry')} <span class="bb-card-label">CROSS-TRIBE DISPUTE · ${c.methodLabel}</span>
          </div>
          <div class="bb-card-text">${c.advocacyText}</div>
          <div class="bb-card-foot">${c.claimantTribes.join(' vs ')} · ALL CLAIMING THE SAME METHOD${c.loserClaims.length > 1 ? ' · 3-WAY ESCALATION' : ''}</div>
        </div>
      </div>`;
    } else if (step.kind === 'conflictResolution') {
      const c = step.conflict;
      const winnerTc = tribeColor(c.winnerClaim.tribe);
      card = `<div class="bb-card bb-success" style="--card-accent:${winnerTc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('star')} <span class="bb-card-label">DISPUTE WON · ${c.winnerClaim.tribe.toUpperCase()} KEEPS ${c.methodLabel}</span>
            ${_tribeBadge(c.winnerClaim.tribe)}
          </div>
          ${_playerChips([c.winnerClaim.champion, ...c.loserClaims.map(lc => lc.champion)], c.winnerClaim.tribe)}
          <div class="bb-card-text">${c.resolutionText}</div>
          <div class="bb-card-foot">${_icon('rivalry')} BOND <span class="val">-0.5</span> ${_icon('star')} POPULARITY <span class="val">+1</span></div>
        </div>
      </div>`;
    } else if (step.kind === 'reluctantSwitch') {
      const lu = step.data;
      const tc2 = tribeColor(lu.tribe);
      const speaker = lu.fallbackSpeaker || lu.champion;
      card = `<div class="bb-card bb-amber" style="--card-accent:${tc2}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('compass')} <span class="bb-card-label">FALLBACK · ${lu.tribe.toUpperCase()}</span>
            ${_tribeBadge(lu.tribe)}
          </div>
          ${_playerChips([speaker], lu.tribe)}
          <div class="bb-card-text">${lu.switchText}</div>
          <div class="bb-card-foot">${_icon('warning')} ${lu.oldMethodLabel} → <span class="val">${lu.newMethodLabel}</span></div>
        </div>
      </div>`;
    } else if (step.kind === 'finalFit') {
      const d = step.data;
      const danger = d.fitMod < -0.5;
      const tc3 = tribeColor(step.tribe);
      card = `<div class="bb-card ${danger ? 'bb-danger' : 'bb-success'}" style="--card-accent:${tc3}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('compass')} <span class="bb-card-label">FINAL FIT · ${d.methodLabel}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          <div class="bb-card-text">${d.fitText}</div>
          <div class="bb-card-foot">${_icon('target')} FIT MOD <span class="val">${d.fitMod >= 0 ? '+' : ''}${d.fitMod.toFixed(1)}</span></div>
        </div>
      </div>`;
    }

    cards += `<div class="bb-step ${vis}" style="--card-rot:${((i % 5) - 2) * 0.15}deg">${card}</div>`;
    if (i > 0 && i % 5 === 4 && i < total - 1) {
      cards += `<div class="bb-step ${vis}"><div class="bb-chatter">${pick(CHATTER.phase1)}</div></div>`;
    }
  });

  cards += `<div class="bb-reveal-bar">
    <button class="bb-btn" onclick="brutalerRevealNext('bb-phase1',${total})">NEXT ▶</button>
    <span class="bb-counter" id="bb-counter-bb-phase1">${st.idx + 1}/${total}</span>
    <button class="bb-btn bb-btn-danger" onclick="brutalerRevealAll('bb-phase1',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (typeof window !== 'undefined') {
    if (!window._brutalerScreenBuilders) window._brutalerScreenBuilders = {};
    window._brutalerScreenBuilders['bb-phase1'] = rpBuildBigBaddPhase1;
    if (!window._brutalerSteps) window._brutalerSteps = {};
    window._brutalerSteps['bb-phase1'] = steps.map(s => ({
      tribe: s.tribe || s.conflict?.winnerClaim?.tribe,
      player: s.data?.champion || s.data?.speaker || s.data?.fallbackSpeaker || s.conflict?.winnerClaim?.champion,
      players: s.conflict ? [s.conflict.winnerClaim.champion, ...s.conflict.loserClaims.map(lc => lc.champion)] : undefined,
    }));
  }
  return _shell(cards, ep, 1, 'PHASE 01 · DEBATE', 'METHOD PICK', `${debates.length} TRIBES · ${_icon('bomb')} BOMB STANDBY`, 'bb-phase1', total);
}

// ══════════════════════════════════════════════════════════════
// PHASE 2 — AXE RETRIEVAL & BOMB
// ══════════════════════════════════════════════════════════════
export function rpBuildBigBaddPhase2(ep) {
  const data = ep.brutaler;
  if (!data?.phase2) return '';
  const beats = data.phase2.beats || [];
  const wildlife = data.phase2.wildlife || [];
  const bombResults = data.phase2.bombResults || [];

  const tribeNames = Object.keys(data.tribes);
  const cutOrder = data.phase2.cutOrder || tribeNames;
  const steps = [];
  tribeNames.forEach(tName => {
    const t = data.tribes[tName];
    steps.push({ kind: 'tribeHeader', tribe: tName, method: t.methodLabel });
    beats.filter(b => b.tribe === tName).forEach(b => steps.push({ kind: 'beat', tribe: tName, data: b }));
    wildlife.filter(w => w.tribe === tName).forEach(w => steps.push({ kind: 'wildlife', tribe: tName, data: w }));
    const br = bombResults.find(b => b.tribe === tName);
    if (br) steps.push({ kind: 'bombResult', tribe: tName, data: br });
  });
  steps.push({ kind: 'resolution', tribe: null, data: null });

  const total = steps.length;
  const st = _ensureState('bb-phase2', total);

  let cards = `<div class="bb-host">${data.hostLines.phase2}</div>`;

  // Totem condition board (live-updating)
  const visibleBombResults = bombResults.filter((_, idx) => {
    const stepIdx = steps.findIndex(s => s.kind === 'bombResult' && s.data === bombResults[idx]);
    return stepIdx <= st.idx;
  });

  cards += `<div class="bb-board">
    <div class="bb-board-title">${_icon('totem')} TOTEM CONDITION</div>
    ${tribeNames.map(name => {
      const t = data.tribes[name];
      const tc = tribeColor(name);
      const cond = visibleBombResults.find(b => b.tribe === name) ? Math.round(t.totemCondition) : 100;
      const barColor = cond < 70 ? 'var(--bb-red)' : 'var(--bb-toxic)';
      return `<div class="bb-board-row">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${tc};border:2px solid var(--bb-ink)"></span>
        <span class="bb-board-name" style="color:${tc}">${name}</span>
        <div class="bb-board-bar"><div class="bb-board-bar-fill" style="width:${cond}%;background:${barColor};color:${barColor}"></div></div>
        <span class="bb-board-stat">${cond}%</span>
      </div>`;
    }).join('')}
  </div>`;

  steps.forEach((step, i) => {
    const vis = st.idx >= i ? 'bb-visible' : '';
    const tc = tribeColor(step.tribe);
    let card = '';

    if (step.kind === 'tribeHeader') {
      card = `<div class="bb-card" style="--card-accent:${tc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('axe')} <span class="bb-card-label" style="color:${tc}">${step.tribe.toUpperCase()} · ${step.method}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          <div class="bb-card-text">Method engaged. The bomb timer is live. Move.</div>
        </div>
      </div>`;
    } else if (step.kind === 'beat') {
      const b = step.data;
      let icon = 'target';
      let label = 'BEAT';
      let cls = '';
      if (b.kind === 'trampoline') {
        icon = 'trampoline';
        label = b.outcome === 'glory' ? 'TRAMPOLINE · GLORY' : b.outcome === 'partial' ? 'TRAMPOLINE · PARTIAL' : b.outcome === 'slam' ? 'TRAMPOLINE · SLAM' : 'TRAMPOLINE · CHICKEN';
        cls = b.outcome === 'slam' || b.outcome === 'chicken' ? 'bb-danger' : (b.outcome === 'glory' ? 'bb-success' : '');
      } else if (b.kind === 'sawclimb') {
        icon = 'saw';
        label = b.outcome === 'glory' ? 'SAW · GLORY' : b.outcome === 'progress' ? 'SAW · PROGRESS' : 'SAW · FALL';
        cls = b.outcome === 'fall' ? 'bb-danger' : (b.outcome === 'glory' ? 'bb-success' : '');
      } else if (b.kind === 'rescue') { icon = 'bond'; label = 'RESCUE'; cls = 'bb-success'; }
      else if (b.kind === 'engineer') { icon = 'compass'; label = 'STACK · ENGINEER'; }
      else if (b.kind === 'base') { icon = 'stack'; label = 'STACK · BASE'; }
      else if (b.kind === 'middle') { icon = 'stack'; label = 'STACK · MIDDLE'; }
      else if (b.kind === 'apex') { icon = 'stack'; label = 'STACK · APEX'; cls = 'bb-success'; }
      else if (b.kind === 'collapse') { icon = 'warning'; label = 'STACK · COLLAPSE'; cls = 'bb-danger'; }
      else if (b.kind === 'holder') { icon = 'shield'; label = b.outcome === 'good' ? 'HOLDER · STEADY' : 'HOLDER · SLIP'; cls = b.outcome === 'good' ? 'bb-success' : 'bb-danger'; }
      else if (b.kind === 'spotter') { icon = 'target'; label = b.outcome === 'good' ? 'SPOTTER · ASSIST' : 'SPOTTER · MISS'; cls = b.outcome === 'good' ? 'bb-success' : 'bb-danger'; }
      else if (b.kind === 'brace') { icon = 'shield'; label = b.outcome === 'good' ? 'BRACE · HELD' : 'BRACE · FUMBLE'; cls = b.outcome === 'good' ? 'bb-success' : 'bb-danger'; }

      const featured = b.kind === 'rescue' ? [b.heroName, b.fallerName] : (b.name ? [b.name] : []);
      card = `<div class="bb-card ${cls}" style="${cls ? '' : `--card-accent:${tc}`}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(icon)} <span class="bb-card-label">${label}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${featured.length ? _playerChips(featured, step.tribe) : ''}
          <div class="bb-card-text">${b.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'wildlife') {
      const w = step.data;
      const animalLabel = w.type.toUpperCase();
      const featured = w.defended ? [w.victim, w.hero] : [w.victim];
      const fullText = w.defended && w.defendText ? `${w.attackText} ${w.defendText}` : w.attackText;
      card = `<div class="bb-card ${w.defended ? 'bb-wildlife' : 'bb-danger'}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(w.type)} <span class="bb-card-label">${_icon('warning')} FAUNA · ${animalLabel}${w.defended ? ' · DEFENDED' : ''}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${_playerChips(featured, step.tribe)}
          <div class="bb-card-text">${fullText}</div>
        </div>
      </div>`;
    } else if (step.kind === 'bombResult') {
      const br = step.data;
      const tribePos = cutOrder.indexOf(step.tribe) + 1;
      const posLabel = tribePos === 1 ? '1ST TO CUT' : tribePos === 2 ? '2ND TO CUT' : tribePos === 3 ? '3RD TO CUT' : `${tribePos}TH TO CUT`;
      const cutPct = Math.min(100, Math.round((br.cutProgress / 10) * 100));
      const timePct = Math.min(100, Math.round((br.timeSpent / BOMB_THRESHOLD) * 100));
      const timeLabel = br.timeSpent.toFixed(1);
      const tc = tribeColor(step.tribe);
      if (br.detonated) {
        card = `<div class="bb-card bb-bomb">
          <div class="bb-hero-stamp">
            <div class="bb-hero-text">MELTDOWN!</div>
            <div class="bb-hero-sub">${_icon('warning')} RADIATION BREACH · ${step.tribe.toUpperCase()} ${_icon('warning')}</div>
          </div>
          <div class="bb-card-inner">
            <div class="bb-card-head">
              ${_icon('explosion')} <span class="bb-card-label">DETONATION · ${posLabel}</span>
              ${_tribeBadge(step.tribe)}
            </div>
            ${_playerChips([br.victim], step.tribe)}
            <div class="bb-card-text">${br.text}</div>
            <div class="bb-bomb-stats">
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('bomb')} TIME</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:100%;background:var(--bb-red)"></div></div>
                <span class="bb-bomb-stat-val" style="color:var(--bb-red)">${timeLabel}s / ${BOMB_THRESHOLD}s · EXCEEDED</span>
              </div>
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('axe')} CUT</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:${cutPct}%;background:var(--bb-red)"></div></div>
                <span class="bb-bomb-stat-val" style="color:var(--bb-red)">${cutPct}% · INCOMPLETE</span>
              </div>
            </div>
            <div class="bb-card-foot">${_icon('skull')} TOTEM <span class="val">↓ 35%</span> ${_icon('heart')} CASUALTY: <span class="val">1</span> (NON-FATAL) ${_icon('star')} POP <span class="val">+2</span></div>
          </div>
        </div>`;
      } else if (br.closeCall) {
        card = `<div class="bb-card bb-amber">
          <div class="bb-card-inner">
            <div class="bb-card-head">
              ${_icon('bomb')} <span class="bb-card-label">CLOSE CALL · ${posLabel}</span>
              ${_tribeBadge(step.tribe)}
            </div>
            <div class="bb-card-text">${br.text}</div>
            <div class="bb-bomb-stats">
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('bomb')} TIME</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:${timePct}%;background:var(--bb-amber,#f59e0b)"></div></div>
                <span class="bb-bomb-stat-val" style="color:var(--bb-amber,#f59e0b)">${timeLabel}s / ${BOMB_THRESHOLD}s · BARELY</span>
              </div>
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('axe')} CUT</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:${cutPct}%;background:var(--bb-amber,#f59e0b)"></div></div>
                <span class="bb-bomb-stat-val">${cutPct}%</span>
              </div>
            </div>
            <div class="bb-card-foot">${_icon('shield')} BOMB DEFEATED · TOTEM INTACT · ${_icon('warning')} SECONDS TO SPARE</div>
          </div>
        </div>`;
      } else {
        card = `<div class="bb-card bb-success">
          <div class="bb-card-inner">
            <div class="bb-card-head">
              ${_icon('bomb')} <span class="bb-card-label">DISARMED · ${posLabel}</span>
              ${_tribeBadge(step.tribe)}
            </div>
            <div class="bb-card-text">${br.text}</div>
            <div class="bb-bomb-stats">
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('bomb')} TIME</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:${timePct}%;background:var(--bb-toxic)"></div></div>
                <span class="bb-bomb-stat-val">${timeLabel}s / ${BOMB_THRESHOLD}s</span>
              </div>
              <div class="bb-bomb-stat-row">
                <span class="bb-bomb-stat-label">${_icon('axe')} CUT</span>
                <div class="bb-bomb-stat-bar"><div class="bb-bomb-stat-fill" style="width:${cutPct}%;background:var(--bb-toxic)"></div></div>
                <span class="bb-bomb-stat-val">${cutPct}%</span>
              </div>
            </div>
            <div class="bb-card-foot">${_icon('shield')} BOMB DISARMED · TOTEM ${Math.round(data.tribes[step.tribe].totemCondition)}% CONDITION</div>
          </div>
        </div>`;
      }
    } else if (step.kind === 'resolution') {
      card = `<div class="bb-card bb-resolution">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('ribbon')} <span class="bb-card-label">PHASE 2 · CUT ORDER</span>
          </div>
          <div class="bb-resolution-ranks">
            ${cutOrder.map((name, idx) => {
              const t = data.tribes[name];
              const tc2 = tribeColor(name);
              const posLbl = idx === 0 ? '1ST' : idx === 1 ? '2ND' : idx === 2 ? '3RD' : `${idx+1}TH`;
              const statusIcon = t.bombDetonated ? _icon('explosion') : (t.timeSpent > BOMB_THRESHOLD - 3 ? _icon('warning') : _icon('shield'));
              const statusLabel = t.bombDetonated ? 'DETONATED' : (t.timeSpent > BOMB_THRESHOLD - 3 ? 'CLOSE CALL' : 'CLEAN CUT');
              const statusCls = t.bombDetonated ? 'bb-res-boom' : (t.timeSpent > BOMB_THRESHOLD - 3 ? 'bb-res-close' : 'bb-res-clean');
              return `<div class="bb-res-row ${statusCls}">
                <span class="bb-res-pos">${posLbl}</span>
                <span class="bb-res-dot" style="background:${tc2}"></span>
                <span class="bb-res-name" style="color:${tc2}">${name}</span>
                <span class="bb-res-method">${t.methodLabel || t.method}</span>
                <span class="bb-res-status">${statusIcon} ${statusLabel}</span>
                <span class="bb-res-time">${t.timeSpent.toFixed(1)}s</span>
                <span class="bb-res-totem">${_icon('totem')} ${Math.round(t.totemCondition)}%</span>
              </div>`;
            }).join('')}
          </div>
          <div class="bb-card-foot">${_icon('target')} TOTEMS SECURED · PROCEEDING TO RACE</div>
        </div>
      </div>`;
    }

    cards += `<div class="bb-step ${vis}" style="--card-rot:${((i % 7) - 3) * 0.12}deg">${card}</div>`;
    if (i > 0 && i % 5 === 4 && i < total - 1) {
      cards += `<div class="bb-step ${vis}"><div class="bb-chatter">${pick(CHATTER.phase2)}</div></div>`;
    }
  });

  cards += `<div class="bb-reveal-bar">
    <button class="bb-btn" onclick="brutalerRevealNext('bb-phase2',${total})">NEXT ▶</button>
    <span class="bb-counter" id="bb-counter-bb-phase2">${st.idx + 1}/${total}</span>
    <button class="bb-btn bb-btn-danger" onclick="brutalerRevealAll('bb-phase2',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (typeof window !== 'undefined') {
    if (!window._brutalerScreenBuilders) window._brutalerScreenBuilders = {};
    window._brutalerScreenBuilders['bb-phase2'] = rpBuildBigBaddPhase2;
    if (!window._brutalerSteps) window._brutalerSteps = {};
    window._brutalerSteps['bb-phase2'] = steps.map(s => ({
      tribe: s.tribe,
      player: s.data?.name || s.data?.victim || s.data?.heroName,
      players: s.data?.heroName && s.data?.fallerName ? [s.data.heroName, s.data.fallerName] : (s.data?.victim && s.data?.hero ? [s.data.victim, s.data.hero] : undefined),
    }));
  }
  return _shell(cards, ep, 2, 'PHASE 02 · CUT', 'AXE OR DETONATION', `${_icon('bomb')} ARMED · ${_icon('warning')} WILDLIFE ACTIVE`, 'bb-phase2', total);
}

// ══════════════════════════════════════════════════════════════
// PHASE 3 — RACE & CABIN SMASH
// ══════════════════════════════════════════════════════════════
export function rpBuildBigBaddPhase3(ep) {
  const data = ep.brutaler;
  if (!data?.phase3) return '';
  const raceBeats = data.phase3.raceBeats || [];
  const socialEvents = data.phase3.socialEvents || [];
  const cabinPick = data.phase3.cabinPick;
  const cabinSmash = data.phase3.cabinSmash;
  const helicopter = data.phase3.helicopter;
  const reactions = data.phase3.reactions || [];

  const tribeNames = Object.keys(data.tribes);
  const steps = [];
  const segmentKeys = ['waterfall', 'slope', 'finalStretch'];
  const socialPool = [...socialEvents];

  segmentKeys.forEach((key, segIdx) => {
    // Per tribe: anchor beat + consolidated crew card (group all carriers into one card)
    tribeNames.forEach(tName => {
      const segBeats = raceBeats.filter(b => b.beatKey === key && b.tribe === tName);
      // Anchor beat (smooth/rough) + splinter
      segBeats.filter(b => ['smooth', 'rough', 'splinter'].includes(b.kind)).forEach(b => steps.push({ kind: 'race', data: b }));
      // Drama beats (saves, shoves)
      segBeats.filter(b => b.kind?.startsWith('cling-')).forEach(b => steps.push({ kind: 'race', data: b }));
      // Consolidated crew card — merge all carrier-good/carrier-bad into one card
      const carrierBeats = segBeats.filter(b => b.kind?.startsWith('carrier-'));
      if (carrierBeats.length) {
        const strong = carrierBeats.filter(b => b.kind === 'carrier-good').map(b => b.name);
        const struggled = carrierBeats.filter(b => b.kind === 'carrier-bad').map(b => b.name);
        steps.push({ kind: 'crewReport', tribe: tName, data: { strong, struggled, segment: key } });
      }
    });
    // Interleave social events after each segment (distribute evenly)
    const socialPerSeg = Math.ceil(socialPool.length / (segmentKeys.length - segIdx));
    const segSocials = socialPool.splice(0, socialPerSeg);
    segSocials.forEach(se => steps.push({ kind: 'social', data: se }));
  });

  if (cabinPick) steps.push({ kind: 'cabinPick', data: cabinPick });
  if (cabinSmash) steps.push({ kind: 'cabinSmash', data: cabinSmash });
  reactions.forEach(r => steps.push({ kind: 'reaction', data: r }));
  if (helicopter) steps.push({ kind: 'helicopter', data: helicopter });

  const total = steps.length;
  const st = _ensureState('bb-phase3', total);

  let cards = `<div class="bb-host">${data.hostLines.phase3}</div>`;

  // Finish-order board — arrival time = cutTime + raceTime
  const finishOrder = data.tribeFinishOrder || Object.keys(data.tribes);
  cards += `<div class="bb-board">
    <div class="bb-board-title">${_icon('ribbon')} ARRIVAL ORDER</div>
    ${finishOrder.map((name, idx) => {
      const tc = tribeColor(name);
      const t = data.tribes[name];
      const reveal = st.idx >= total - 3;
      const posLabel = idx === 0 ? '1ST' : idx === 1 ? '2ND' : idx === 2 ? '3RD' : `${idx+1}TH`;
      const arrivalStr = reveal && t.arrivalTime ? `${t.arrivalTime.toFixed(1)}s` : '—';
      return `<div class="bb-board-row">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${tc};border:2px solid var(--bb-ink)"></span>
        <span class="bb-board-name" style="color:${tc}">${name}</span>
        <span class="bb-board-stat" style="color:${reveal && idx === 0 ? 'var(--bb-gold)' : ''}">${reveal ? posLabel : '?'} · ${arrivalStr}</span>
      </div>`;
    }).join('')}
  </div>`;

  steps.forEach((step, i) => {
    const vis = st.idx >= i ? 'bb-visible' : '';
    let card = '';

    if (step.kind === 'race') {
      const b = step.data;
      const tc = tribeColor(b.tribe);
      let icon = 'waterfall';
      if (b.beatKey === 'slope') icon = 'totem';
      else if (b.beatKey === 'finalStretch') icon = 'target';

      let label = b.beatLabel || 'RACE';
      let cls = '';
      if (b.kind === 'smooth') cls = 'bb-success';
      else if (b.kind === 'rough' || b.kind === 'splinter') cls = 'bb-danger';
      else if (b.kind === 'cling-hold' || b.kind === 'cling-save') cls = 'bb-success';
      else if (b.kind.startsWith('cling-fall') || b.kind.startsWith('cling-shove')) cls = 'bb-danger';
      if (b.kind === 'cling-save') label = 'CLING · SAVE';
      else if (b.kind === 'cling-fall') label = 'CLING · FALL';
      else if (b.kind === 'cling-hold') label = 'CLING · HOLD';
      else if (b.kind === 'cling-shove-caught') label = 'CLING · SHOVE CAUGHT';
      else if (b.kind === 'cling-shove') label = 'CLING · SUSPICIOUS FALL';
      else if (b.kind === 'splinter') label = (b.beatLabel || 'RACE') + ' · SPLINTER';

      const featured = b.heroName ? [b.heroName, b.fallerName] : (b.villain ? [b.villain, b.target] : (b.name ? [b.name] : []));
      card = `<div class="bb-card ${cls}" style="${cls ? '' : `--card-accent:${tc}`}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(icon)} <span class="bb-card-label">${label}</span>
            ${_tribeBadge(b.tribe)}
          </div>
          ${featured.length ? _playerChips(featured, b.tribe) : ''}
          <div class="bb-card-text">${b.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'crewReport') {
      const cr = step.data;
      const tc = tribeColor(step.tribe);
      const allGood = cr.struggled.length === 0;
      const allBad = cr.strong.length === 0;
      const cls2 = allGood ? 'bb-success' : allBad ? 'bb-danger' : '';
      const segLabel = cr.segment === 'waterfall' ? 'WATERFALL' : cr.segment === 'slope' ? 'SLOPE' : 'FINAL STRETCH';
      const strongChips = cr.strong.length ? `<div style="margin:4px 0"><span style="color:var(--bb-toxic);font-family:'Share Tech Mono',monospace;font-size:0.65rem">STRONG:</span> ${_playerChips(cr.strong, step.tribe)}</div>` : '';
      const struggleChips = cr.struggled.length ? `<div style="margin:4px 0"><span style="color:var(--bb-red);font-family:'Share Tech Mono',monospace;font-size:0.65rem">STRUGGLED:</span> ${_playerChips(cr.struggled, step.tribe)}</div>` : '';
      const summary = allGood ? 'The whole crew locked in. Nobody dropped, nobody lagged. Machine.' : allBad ? 'Nobody could hold their section. The totem was dragging the tribe, not the other way around.' : `${cr.strong.length} carried hard. ${cr.struggled.length} cost the tribe time.`;
      card = `<div class="bb-card ${cls2}" style="${cls2 ? '' : `--card-accent:${tc}`}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('stack')} <span class="bb-card-label">CREW · ${segLabel}</span>
            ${_tribeBadge(step.tribe)}
          </div>
          ${strongChips}${struggleChips}
          <div class="bb-card-text">${summary}</div>
        </div>
      </div>`;
    } else if (step.kind === 'social') {
      const se = step.data;
      let icon = 'bond';
      if (se.kind === 'spark' || se.kind === 'showmance' || se.kind === 'showmanceMoment' || se.kind === 'showmanceFriction') icon = 'heart';
      else if (se.kind === 'instantFriction' || se.kind === 'rivalry' || se.kind === 'archetypeClash' || se.kind === 'rivalryFlare') icon = 'rivalry';
      else if (se.kind === 'voteWhisper') icon = 'compass';
      else if (se.kind === 'intelTrade') icon = 'target';
      else if (se.kind === 'secretPact') icon = 'shield';
      const label = se.kind.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
      card = `<div class="bb-card bb-social">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(icon)} <span class="bb-card-label">${label}</span>
            ${se.tribe ? _tribeBadge(se.tribe) : ''}
          </div>
          ${_playerChips(se.players, se.tribe)}
          <div class="bb-card-text">${se.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'cabinPick') {
      const cp = step.data;
      card = `<div class="bb-card bb-gold">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('cabin')} <span class="bb-card-label">CABIN PICK · WINNERS</span>
            ${_tribeBadge(cp.tribe)}
          </div>
          ${_playerChips([cp.picker], cp.tribe)}
          <div class="bb-card-text">${cp.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'cabinSmash') {
      const cs = step.data;
      card = `<div class="bb-card bb-bomb">
        <div class="bb-hero-stamp demo">
          <div class="bb-hero-text">DEMOLITION!</div>
          <div class="bb-hero-sub">${_icon('explosion')} CABIN STRUCTURAL FAILURE · ${cs.tribe.toUpperCase()} ${_icon('explosion')}</div>
        </div>
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('cabin')} <span class="bb-card-label">IMPACT ASSESSMENT</span>
            ${_tribeBadge(cs.tribe)}
          </div>
          ${_playerChips([cs.crasher], cs.tribe)}
          <div class="bb-card-text">${cs.text}</div>
          <div class="bb-card-foot">${_icon('skull')} INTEGRITY <span class="val">0%</span> ${_icon('star')} CHRIS LAUGH <span class="val">MAX</span> ${_icon('megaphone')} INSURANCE <span class="val">PENDING</span></div>
        </div>
      </div>`;
    } else if (step.kind === 'reaction') {
      const r = step.data;
      const rCls = r.side === 'winner' ? 'bb-success' : r.side === 'loser' ? 'bb-amber' : '';
      const rIcon = r.side === 'winner' ? 'star' : r.side === 'loser' ? 'spark' : 'compass';
      card = `<div class="bb-card ${rCls}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon(rIcon)} <span class="bb-card-label">REACTION · ${r.side.toUpperCase()}</span>
            ${_tribeBadge(r.tribe)}
          </div>
          ${_playerChips([r.name], r.tribe)}
          <div class="bb-card-text">${r.text}</div>
        </div>
      </div>`;
    } else if (step.kind === 'helicopter') {
      card = `<div class="bb-card bb-gold">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('helicopter')} <span class="bb-card-label">REPLACEMENT INBOUND</span>
          </div>
          <div class="bb-card-text">${step.data.text}</div>
          <div class="bb-card-foot">${_icon('target')} CABIN DROP · COORDS LOCKED · LANDING IN 3...2...1...</div>
        </div>
      </div>`;
    }

    cards += `<div class="bb-step ${vis}" style="--card-rot:${((i % 5) - 2) * 0.18}deg">${card}</div>`;
    if (i > 0 && i % 5 === 4 && i < total - 1) {
      cards += `<div class="bb-step ${vis}"><div class="bb-chatter">${pick(CHATTER.phase3)}</div></div>`;
    }
  });

  cards += `<div class="bb-reveal-bar">
    <button class="bb-btn" onclick="brutalerRevealNext('bb-phase3',${total})">NEXT ▶</button>
    <span class="bb-counter" id="bb-counter-bb-phase3">${st.idx + 1}/${total}</span>
    <button class="bb-btn bb-btn-danger" onclick="brutalerRevealAll('bb-phase3',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (typeof window !== 'undefined') {
    if (!window._brutalerScreenBuilders) window._brutalerScreenBuilders = {};
    window._brutalerScreenBuilders['bb-phase3'] = rpBuildBigBaddPhase3;
    if (!window._brutalerSteps) window._brutalerSteps = {};
    window._brutalerSteps['bb-phase3'] = steps.map(s => {
      const d = s.data || {};
      if (s.kind === 'crewReport') {
        return { tribe: s.tribe, players: [...(d.strong || []), ...(d.struggled || [])] };
      }
      return {
        tribe: s.tribe || d.tribe,
        player: d.name || d.leader || d.heroName || d.villain || d.picker || d.crasher || d.speaker,
        players: d.players || (d.heroName && d.fallerName ? [d.heroName, d.fallerName] : undefined),
      };
    });
  }
  return _shell(cards, ep, 3, 'PHASE 03 · RACE & SMASH', 'WATERFALL · SLOPE · CABIN', `${_icon('waterfall')} RIDE · ${_icon('explosion')} CRASH · ${_icon('star')} LAUGH`, 'bb-phase3', total);
}

// ══════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildBigBaddResults(ep) {
  const data = ep.brutaler;
  if (!data) return '';
  const finishOrder = data.tribeFinishOrder || [];

  const allArrivals = finishOrder.map(n => data.tribes[n].arrivalTime || data.tribes[n].finalScore || 1);
  const minArrival = Math.min(...allArrivals);
  const maxArrival = Math.max(...allArrivals);
  const board = finishOrder.map((name, i) => {
    const t = data.tribes[name];
    const tc = tribeColor(name);
    const posLabel = i === 0 ? '1ST' : i === 1 ? '2ND' : i === 2 ? '3RD' : `${i+1}TH`;
    const barColor = i === 0 ? 'var(--bb-gold)' : (i === finishOrder.length - 1 ? 'var(--bb-red)' : 'var(--bb-toxic)');
    const arrival = t.arrivalTime || t.finalScore || 0;
    const pct = maxArrival > minArrival ? Math.round(100 - ((arrival - minArrival) / (maxArrival - minArrival)) * 60) : 100;
    const timeStr = t.arrivalTime ? `${t.arrivalTime.toFixed(1)}s` : `${(t.finalScore || 0).toFixed(1)} pts`;
    const gapStr = i > 0 && t.arrivalTime && data.tribes[finishOrder[0]]?.arrivalTime
      ? ` (+${(t.arrivalTime - data.tribes[finishOrder[0]].arrivalTime).toFixed(1)}s)`
      : '';
    return `<div class="bb-board-row">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${tc};border:2px solid var(--bb-ink);box-shadow:0 0 6px ${tc}"></span>
      <span class="bb-board-name" style="color:${tc};font-weight:700">${name}</span>
      <div class="bb-board-bar"><div class="bb-board-bar-fill" style="width:${pct}%;background:${barColor};color:${barColor}"></div></div>
      <span class="bb-board-stat">${posLabel} · ${timeStr}${gapStr} · ${t.bombDetonated ? 'DAMAGED' : 'INTACT'}</span>
    </div>`;
  }).join('');

  const methodWars = Object.values(data.tribes).filter(t => t.methodWar);
  const warSection = methodWars.length ? `
    <div class="bb-card bb-danger">
      <div class="bb-card-inner">
        <div class="bb-card-head">
          ${_icon('rivalry')} <span class="bb-card-label">METHOD WAR · BLAME ASSIGNED</span>
        </div>
        ${methodWars.map(t => `<div style="margin:6px 0">
          ${_playerChips([t.methodWar.champion, t.methodWar.rival], t.name)}
          <div class="bb-card-text">${t.methodWar.text}</div>
        </div>`).join('')}
        <div class="bb-card-foot">${_icon('warning')} HEAT APPLIED · <span class="val">TWO EPISODES</span></div>
      </div>
    </div>` : '';

  const winnerTribe = finishOrder[0] || '';
  const winnerTc = tribeColor(winnerTribe);

  const content = `
    <div class="bb-host">${data.hostLines.finale}</div>
    <div class="bb-board">
      <div class="bb-board-title">${_icon('star')} ARRIVAL ORDER</div>
      ${board}
    </div>
    <div class="bb-card bb-gold">
      <div class="bb-card-inner">
        <div class="bb-card-head">
          ${_icon('ribbon')} <span class="bb-card-label" style="color:${winnerTc}">IMMUNITY · ${winnerTribe.toUpperCase()}</span>
        </div>
        <div class="bb-card-text">First tribe to arrive at camp. Cabin chosen. Cabin destroyed. That's a win.</div>
      </div>
    </div>
    ${finishOrder.slice(1, -1).map(name => {
      const tc = tribeColor(name);
      const t = data.tribes[name];
      const pos = finishOrder.indexOf(name);
      const posLabel = pos === 1 ? '2ND' : pos === 2 ? '3RD' : `${pos+1}TH`;
      const gapStr = t.arrivalTime && data.tribes[finishOrder[0]]?.arrivalTime
        ? `+${(t.arrivalTime - data.tribes[finishOrder[0]].arrivalTime).toFixed(1)}s behind the winners.` : '';
      return `<div class="bb-card" style="--card-accent:${tc}">
        <div class="bb-card-inner">
          <div class="bb-card-head">
            ${_icon('shield')} <span class="bb-card-label" style="color:${tc}">SAFE · ${name.toUpperCase()} · ${posLabel}</span>
          </div>
          <div class="bb-card-text">Not first. Not last. ${gapStr} No tribal council tonight — but no reward either. Just survival.</div>
        </div>
      </div>`;
    }).join('')}
    ${warSection}
    <div class="bb-card">
      <div class="bb-card-inner">
        <div class="bb-card-head">
          ${_icon('megaphone')} <span class="bb-card-label">SIGNAL OUT</span>
        </div>
        <div class="bb-card-text">Tribes return to camp. Helicopter dust settling. Bomb crews on cleanup. Ratings spike confirmed.</div>
      </div>
    </div>
  `;

  if (typeof window !== 'undefined') {
    if (!window._brutalerScreenBuilders) window._brutalerScreenBuilders = {};
    window._brutalerScreenBuilders['bb-results'] = rpBuildBigBaddResults;
  }
  return _shell(content, ep, 4, 'PHASE 04 · RESULTS', 'FINAL STANDINGS', `${_icon('star')} CHALLENGE COMPLETE · ${methodWars.length} BLAMED`, 'bb-results');
}

// ══════════════════════════════════════════════════════════════
// REVEAL HANDLERS
// ══════════════════════════════════════════════════════════════
function _rebuildBrutalerScreen(screenKey) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(`[data-screen-key="${screenKey}"]`);
  if (!el) return;
  let scrollParent = el.closest('.rp-main');
  if (!scrollParent) {
    let p = el.parentElement;
    while (p) {
      const s = getComputedStyle(p);
      if (s.overflowY === 'auto' || s.overflowY === 'scroll') { scrollParent = p; break; }
      p = p.parentElement;
    }
  }
  const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
  const builder = window._brutalerScreenBuilders?.[screenKey];
  const ep = window._brutalerEp;
  if (!builder || !ep) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = builder(ep);
  const inner = tmp.querySelector(`[data-screen-key="${screenKey}"]`);
  if (inner) {
    el.outerHTML = inner.outerHTML;
  }
  if (scrollParent) scrollParent.scrollTop = scrollTop;
}

function _scrollToRevealed(screenKey) {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const container = document.querySelector(`[data-screen-key="${screenKey}"]`);
    if (!container) return;
    const visible = container.querySelectorAll('.bb-step.bb-visible');
    const target = visible[visible.length - 1];
    if (!target) return;
    let scrollParent = target.closest('.rp-main');
    if (!scrollParent) {
      let p = target.parentElement;
      while (p) {
        const s = getComputedStyle(p);
        if (s.overflowY === 'auto' || s.overflowY === 'scroll') { scrollParent = p; break; }
        p = p.parentElement;
      }
    }
    if (!scrollParent) scrollParent = document.documentElement;
    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - parentRect.top + scrollParent.scrollTop - parentRect.height * 0.3;
    scrollParent.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  });
}

export function brutalerRevealNext(screenKey, total) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  if (_tvState[screenKey].idx < total - 1) {
    _tvState[screenKey].idx++;
    _rebuildBrutalerScreen(screenKey);
    _scrollToRevealed(screenKey);
  }
}

export function brutalerRevealAll(screenKey, total) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  _tvState[screenKey].idx = total - 1;
  _rebuildBrutalerScreen(screenKey);
}

if (typeof window !== 'undefined') {
  window.brutalerRevealNext = brutalerRevealNext;
  window.brutalerRevealAll = brutalerRevealAll;
}

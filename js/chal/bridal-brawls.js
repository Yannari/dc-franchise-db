// js/chal/bridal-brawls.js — Bridal Brawls: post-merge pair challenge (blindfold + tightrope + customs trivia)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:cover;flex-shrink:0;background:#c8b888" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
const OBSTACLE_COUNT = 6;
const TIGHTROPE_SEGMENTS = 5;
const TRIVIA_QUESTIONS = 5;
const FALL_BASE_PENALTY = 8.0;
const MAX_FALLS_PER_SEGMENT = 2;
const PHASE1_BASE_TIME = 12.0;
const SHARK_DENSITIES = [1, 2, 3, 5, 7];
const FALL_PENALTY_MULTS = [1.0, 1.5, 2.0, 3.0, 4.0];
const DIFFICULTY_THRESHOLDS = { easy: 0.25, medium: 0.40, hard: 0.48, brutal: 0.55 };
const CUSTOMS_PASS_THRESHOLD = 3;

const OBSTACLES = [
  { name: 'Mud Pit Crossing', primary: 'physical', pw: 0.06, secondary: 'endurance', sw: 0.04 },
  { name: 'Swinging Log Dodge', primary: 'physical', pw: 0.07, secondary: 'intuition', sw: 0.04 },
  { name: 'Slippery Ramp', primary: 'endurance', pw: 0.06, secondary: 'physical', sw: 0.04 },
  { name: 'Hanging Curtains Maze', primary: 'intuition', pw: 0.06, secondary: 'mental', sw: 0.04 },
  { name: 'Collapsing Bridge', primary: 'boldness', pw: 0.06, secondary: 'physical', sw: 0.04 },
  { name: 'Dress Grab', primary: 'mental', pw: 0.05, secondary: 'intuition', sw: 0.05 },
];

const SEGMENTS = [
  { name: 'Misty Start', dist: 20, sharkDensity: 1, fallMult: 1.0 },
  { name: 'Gusty Middle', dist: 20, sharkDensity: 2, fallMult: 1.5 },
  { name: 'Spray Zone', dist: 20, sharkDensity: 3, fallMult: 2.0 },
  { name: 'Shark Alley', dist: 20, sharkDensity: 5, fallMult: 3.0 },
  { name: 'Thunder Step', dist: 20, sharkDensity: 7, fallMult: 4.0 },
];

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// Phase 1 — Obstacle outcomes
const OBS_SUCCESS = [
  (g, b, obs) => `${g} guides ${b} perfectly. "${b}, three steps right and duck!" ${b} clears the ${obs} without a scratch.`,
  (g, b, obs) => `${b} trusts ${g}'s voice and moves through the ${obs} like it's nothing. Textbook teamwork.`,
  (g, b, obs) => `"Left! Left! NOW!" ${g} barks. ${b} follows the instructions and sails through the ${obs}.`,
  (g, b, obs) => `${b} hesitates at the ${obs}, but ${g}'s calm directions keep ${pronouns(b).obj} on track. Clean pass.`,
  (g, b, obs) => `${g} reads the ${obs} perfectly, guiding ${b} through every gap and hazard without missing a beat.`,
  (g, b, obs) => `${b} moves like ${pronouns(b).sub} can see through the blindfold. ${g}'s instructions are that good.`,
];
const OBS_SPECTACULAR = [
  (g, b, obs) => `${b} FLIES through the ${obs}! ${g}'s guidance is pinpoint — the crowd goes wild!`,
  (g, b, obs) => `Absolutely FLAWLESS from ${g} and ${b} on the ${obs}! That's the fastest anyone's ever done it!`,
  (g, b, obs) => `${b} trust-falls into the ${obs} and ${g} calls every single move perfectly. Standing ovation from the sidelines.`,
  (g, b, obs) => `"INCREDIBLE!" ${host()} shouts as ${b} blazes through the ${obs} like ${pronouns(b).sub} was born for this.`,
  (g, b, obs) => `${g} and ${b} are in perfect sync. The ${obs} didn't stand a chance. That's how you run a course.`,
  (g, b, obs) => `${b} trusts ${g} completely and it pays off. The ${obs} is crushed in record time.`,
];
const OBS_FAIL = [
  (g, b, obs) => `${b} stumbles at the ${obs}. ${g} shouts corrections but it's too late — ${b} walks straight into the wall.`,
  (g, b, obs) => `"No, your OTHER left!" ${g} yells, but ${b} has already faceplanted into the ${obs}.`,
  (g, b, obs) => `${b} misreads ${g}'s directions and gets tangled in the ${obs}. Time is ticking.`,
  (g, b, obs) => `The ${obs} defeats ${b}. ${g} watches helplessly as ${pronouns(b).posAdj} partner flails.`,
  (g, b, obs) => `${g}'s directions come a beat too late. ${b} trips at the ${obs} and loses precious seconds.`,
  (g, b, obs) => `${b} reaches out blindly and grabs the wrong thing at the ${obs}. ${g} buries ${pronouns(g).posAdj} face in ${pronouns(g).posAdj} hands.`,
];
const OBS_CRITICAL = [
  (g, b, obs) => `${b} walks DIRECTLY into the worst part of the ${obs}. Face-first. ${g} just stares in horror.`,
  (g, b, obs) => `DISASTER at the ${obs}! ${b} goes left when ${g} says right and ends up in a heap. The crowd winces.`,
  (g, b, obs) => `${b} panics at the ${obs} and starts running — blindfolded — in completely the wrong direction. ${g} can't stop it.`,
  (g, b, obs) => `The ${obs} absolutely DESTROYS ${b}. ${g}'s shouted warnings are drowned out by the impact.`,
  (g, b, obs) => `${b} somehow manages to hit every single obstacle in the ${obs}. It's almost impressive how wrong this went.`,
  (g, b, obs) => `${g} freezes up at the worst possible moment. ${b} never stood a chance at the ${obs}.`,
];

// Trust events
const TRUST_MISDIRECT = [
  (g, b) => `${g} sees an opportunity. "Go straight," ${pronouns(g).sub} says — knowing there's a wall dead ahead. ${b} smashes into it.`,
  (g, b) => `${g} deliberately sends ${b} the long way around. "Just following the course..." ${pronouns(g).Sub} smirks.`,
  (g, b) => `"Jump now!" ${g} calls. There's nothing to jump over. ${b} looks ridiculous mid-air.`,
  (g, b) => `${g} gives ${b} directions that are technically correct but impossibly hard to follow. Plausible deniability.`,
  (g, b) => `${g} waits three extra seconds before giving the warning. Just long enough for ${b} to get hit.`,
  (g, b) => `"Duck!" ${g} says — but the obstacle is at knee height. ${b} crouches right into it.`,
];
const TRUST_PANIC = [
  (g, b) => `${b} rips off the blindfold for a second. "I can't do this!" ${g} has to calm ${pronouns(b).obj} down.`,
  (g, b) => `${b} freezes completely. ${g}'s voice can't reach ${pronouns(b).obj}. Precious seconds tick away.`,
  (g, b) => `${b} starts hyperventilating. "I don't trust you! I don't trust ANYONE!"`,
  (g, b) => `${b} grabs at the air wildly. "Where am I? WHERE AM I?!" The panic is real.`,
  (g, b) => `${b}'s hands are shaking. ${g} can see the fear from across the course. This is bad.`,
  (g, b) => `"I want to quit." ${b} stands perfectly still. ${g} has to talk ${pronouns(b).obj} back into moving.`,
];
const TRUST_REFUSE = [
  (g, b) => `${b} ignores ${g}'s directions entirely. "I know what I'm doing." ${pronouns(b).Sub} doesn't.`,
  (g, b) => `"Your directions are terrible." ${b} goes ${pronouns(b).posAdj} own way. ${g} throws up ${pronouns(g).posAdj} hands.`,
  (g, b) => `${b} has decided ${g} is sabotaging ${pronouns(b).obj}. ${pronouns(b).Sub} navigates by touch alone.`,
  (g, b) => `${g} shouts left. ${b} goes right. On purpose. The power struggle is real.`,
  (g, b) => `"I've been burned before. I'll find my own way." ${b} tunes ${g} out completely.`,
  (g, b) => `${b} moves with confidence — ignoring every word from ${g}. Either ${pronouns(b).sub}'ll ace it or crash hard.`,
];
const TRUST_FALL = [
  (g, b) => `${b} stumbles, and instead of bracing, leans back — trusting ${g} to catch the moment. "I got you." ${g} does.`,
  (g, b) => `${g}'s voice softens. "You're doing amazing. Three more steps. I promise." ${b} believes ${pronouns(g).obj}.`,
  (g, b) => `${b} reaches out blindly. ${g} takes ${pronouns(b).posAdj} hand and guides ${pronouns(b).obj} through. No words needed.`,
  (g, b) => `The connection between ${g} and ${b} is palpable. Every instruction lands. Every step is certain.`,
  (g, b) => `"I trust you completely." ${b} says it out loud. ${g} swallows hard and makes sure to earn it.`,
  (g, b) => `${b} closes ${pronouns(b).posAdj} eyes — even behind the blindfold — and surrenders to ${g}'s voice.`,
];
const TRUST_ENCOURAGE = [
  (g, b) => `"Hey. Look — well, don't look, but LISTEN. You're killing it." ${g}'s encouragement lifts ${b}'s spirits.`,
  (g, b) => `${g} claps. "That's my partner! Keep going! You're the best blindfolded person I've ever seen!"`,
  (g, b) => `"I believe in you, ${b}. Every step. I'm right here." ${g}'s voice is steady as a rock.`,
  (g, b) => `${g} starts narrating like a sports commentator. "${b} approaches the obstacle with INCREDIBLE form..." It works. ${b} laughs and relaxes.`,
  (g, b) => `"Forget the challenge. Just listen to my voice." ${g} guides ${b} with the patience of a saint.`,
  (g, b) => `${g} notices ${b} tensing up and switches to a softer tone. "Easy now. Gentle steps. You've got this."`,
];

// Rivalry fuel events (low-bond pairs channeling spite into performance)
const TRUST_SPITE_OBSTACLE = [
  (g, b) => `${g} barks orders like a drill sergeant. ${b} hates every word — but follows them PERFECTLY out of pure spite.`,
  (g, b) => `"I'm NOT losing because of YOU." ${b} grits ${pronouns(b).posAdj} teeth and powers through the obstacle on anger alone.`,
  (g, b) => `${g} and ${b} can't stand each other. But neither will give the other the satisfaction of failing. They crush it.`,
  (g, b) => `"Do NOT mess this up." ${g}'s tone is ice. ${b} responds with flawless execution. Hatred is a powerful motivator.`,
  (g, b) => `They don't communicate — they compete. ${g} gives sharp, efficient commands. ${b} follows them like a machine. It works.`,
  (g, b) => `${b} imagines the obstacle is ${g}'s face. The visualization helps. Spectacular performance born from mutual loathing.`,
];
const TRUST_SPITE_TIGHTROPE = [
  (g, b) => `${g} grips ${b} like a vice. Not out of love — out of refusal to fail. "I'm not falling because of you."`,
  (g, b) => `They hate each other. But ${g} will carry ${b} across a tightrope over sharks before admitting defeat. Pride is undefeated.`,
  (g, b) => `${b} digs fingernails into ${g}'s shoulder. ${g} doesn't flinch. The pain fuels focus. Enemies make great partners sometimes.`,
  (g, b) => `"If I fall, I'm taking you with me." "Then DON'T fall." The spite-pact holds. They cross clean.`,
  (g, b) => `${g} and ${b} move in hostile sync — no warmth, no trust, just stubborn refusal to lose. It's almost beautiful.`,
  (g, b) => `Every step is a battle of wills. ${g} won't stumble because ${b} would never let ${pronouns(g).obj} forget it.`,
];
const TRIVIA_RIVALRY_CORRECT = [
  (answerer, partner) => `${answerer} knows ${partner}'s answer — from WATCHING ${pronouns(partner).obj}, not from friendship. Enemies study each other.`,
  (answerer, partner) => `"I know everything about ${partner}. How else would I know what to avoid?" ${answerer} gets it right through pure surveillance.`,
  (answerer, partner) => `${answerer} answers instantly. ${partner} looks disturbed. "How do you know that about me?" "I pay attention to my enemies."`,
  (answerer, partner) => `Rivalry breeds observation. ${answerer} has catalogued ${partner}'s habits, preferences, and weaknesses. The correct answer is just a side effect.`,
];

// Sabotage events
const SABOTAGE_SUCCESS = [
  (sab, victim) => `${sab} shouts fake directions at ${victim} from the sidelines. ${victim} turns the wrong way!`,
  (sab, victim) => `${sab} casually extends a foot into ${victim}'s path. Down ${pronouns(victim).sub} goes.`,
  (sab, victim) => `${sab} blocks the guide's line of sight for a crucial second. ${victim}'s partner can't call the warning in time.`,
  (sab, victim) => `${sab} tosses a loose prop onto ${victim}'s path. The stumble costs valuable seconds.`,
  (sab, victim) => `"HEY ${victim.toUpperCase()}, GO LEFT!" ${sab} screams — from the opposite direction. Confusion reigns.`,
  (sab, victim) => `${sab} mimics ${victim}'s guide's voice. The wrong directions are followed perfectly.`,
];
const SABOTAGE_DETECTED = [
  (sab, guide) => `${guide} spots ${sab} trying to interfere. "Hey! I SAW that!" The confrontation is immediate.`,
  (sab, guide) => `${sab} reaches for the obstacle, but ${guide} catches the movement. "BACK OFF, ${sab}!"`,
  (sab, guide) => `${guide} notices ${sab}'s little trick before it works. "Everyone saw what you just did."`,
  (sab, guide) => `"Nice try, ${sab}." ${guide} blocks the sabotage attempt. ${sab} plays innocent — badly.`,
  (sab, guide) => `${sab} tries to trip the blindfolded player but ${guide} intercepts. The glare could melt steel.`,
  (sab, guide) => `${guide}'s intuition fires. ${pronouns(guide).Sub} spins around and catches ${sab} mid-act. Busted.`,
];

// Phase 2 — Tightrope
const TIGHTROPE_CLEAN = [
  (g, b, seg) => `${g} carries ${b} across ${seg} with perfect balance. The rope barely sways.`,
  (g, b, seg) => `Steady steps from ${g} through ${seg}. ${b} holds on tight. The wind doesn't touch them.`,
  (g, b, seg) => `${g} moves like a tightrope veteran through ${seg}. ${b} barely feels the height.`,
  (g, b, seg) => `Graceful. Controlled. ${g} makes ${seg} look like a sidewalk. ${b} is completely safe.`,
  (g, b, seg) => `${g} plants each foot deliberately. ${b} trusts the rhythm. They glide through ${seg}.`,
  (g, b, seg) => `The mist swirls around them but ${g} doesn't waver. ${seg} is conquered with pure focus.`,
];
const TIGHTROPE_WOBBLE = [
  (g, b, seg) => `${g} wobbles at ${seg}! ${b} gasps. But ${g} corrects — barely — and keeps going.`,
  (g, b, seg) => `A gust of wind catches them at ${seg}. ${g} sways. ${b} grips tighter. They hold.`,
  (g, b, seg) => `${g}'s foot slips at ${seg} and ${b} screams. They don't fall, but the scare is real.`,
  (g, b, seg) => `The rope bucks under their weight at ${seg}. ${g} drops to one knee, steadies, and rises again.`,
  (g, b, seg) => `${b} shifts at the worst moment on ${seg}. ${g} counterbalances like a gymnast. Close call.`,
  (g, b, seg) => `${seg} tests them. ${g} fights for balance while ${b} holds perfectly still. They survive it.`,
];
const TIGHTROPE_NEAR_FALL = [
  (g, b, seg) => `${g} NEARLY goes over at ${seg}! One foot dangles over the waterfall. ${b} screams.`,
  (g, b, seg) => `The wind at ${seg} is BRUTAL. ${g} tips 45 degrees with ${b} on ${pronouns(g).posAdj} back. Everyone holds their breath.`,
  (g, b, seg) => `${g} catches the rope with one hand at ${seg}. ${b} is hanging on by sheer will. The sharks circle below.`,
  (g, b, seg) => `"DON'T LET GO!" ${b} shouts as ${g} teeters at ${seg}. The waterfall roars beneath them.`,
  (g, b, seg) => `${seg} nearly claims them. ${g} makes a desperate grab for the support wire. They dangle for an eternity.`,
  (g, b, seg) => `A rogue gust at ${seg} sends them sideways. ${g} hooks a leg around the rope. The crowd gasps.`,
];
const TIGHTROPE_FALL = [
  (g, b, seg) => `They're GONE! ${g} and ${b} plunge off the rope at ${seg}! The waterfall swallows them both!`,
  (g, b, seg) => `${g} loses it at ${seg}. ${b} feels the drop before the splash. Into the water they go!`,
  (g, b, seg) => `The rope snaps from under ${g}'s feet at ${seg}. ${b} screams all the way down. SPLASH!`,
  (g, b, seg) => `${g} tries to save it at ${seg} but there's nothing left. They fall. The sharks notice.`,
  (g, b, seg) => `${seg} wins. ${g} and ${b} tumble through the mist and hit the water hard.`,
  (g, b, seg) => `The wind at ${seg} finally gets them. ${g} tips backward and ${b} can't hold on. They plummet.`,
];

// Shark encounters
const SHARK_DODGE_SUCCESS = [
  (n) => `${n} spots the shark fin cutting toward them and swims FAST. The shark veers off at the last second.`,
  (n) => `The shark lunges! ${n} kicks hard and barely escapes the jaws. Heart pounding.`,
  (n) => `${n} dives under the surface and the shark glides right over. Instinct over panic.`,
  (n) => `A shark charges at ${n}. ${pronouns(n).Sub} splashes wildly — and it works. The shark backs off.`,
  (n) => `${n} sees the dorsal fin and freezes. The shark circles once... then disappears. Lucky.`,
  (n) => `The shark nudges ${n}'s leg. ${pronouns(n).Sub} doesn't flinch. The shark loses interest. Ice cold.`,
];
const SHARK_DODGE_FAIL = [
  (n) => `The shark CATCHES ${n}! Teeth clamp on ${pronouns(n).posAdj} leg! The lifeguards rush in as ${n} scrambles for the ladder.`,
  (n) => `${n} tries to outswim the shark. ${pronouns(n).Sub} can't. The shark drags ${pronouns(n).obj} underwater for three terrifying seconds.`,
  (n) => `"SHARK! SHARK!" ${n} barely gets the words out before it hits. The impact is brutal.`,
  (n) => `The shark circles once, twice — then strikes. ${n} goes under. The penalties pile up.`,
  (n) => `${n} freezes in the water. Worst possible response. The shark doesn't miss.`,
  (n) => `Multiple sharks converge on ${n}. It's chaos. ${pronouns(n).Sub} finally reaches the ladder, battered.`,
];

// Showmance moments on tightrope
const SHOWMANCE_MOMENTS = [
  (g, b) => `"Hold me tighter," ${b} whispers to ${g} on the rope. ${g} does. The challenge fades. The moment doesn't.`,
  (g, b) => `${g} almost falls — and ${b} catches ${pronouns(g).obj}. Their faces are inches apart. Neither moves for a beat too long.`,
  (g, b) => `"I'm scared," ${b} admits. ${g} presses ${pronouns(g).posAdj} forehead to ${b}'s. "I won't let you fall."`,
  (g, b) => `The wind whips around them but ${g} and ${b} only see each other. The height is forgotten. The sharks are forgotten. It's just them.`,
  (g, b) => `${b} grips ${g}'s shoulder and ${g} turns to look at ${pronouns(b).obj}. Something unspoken passes between them.`,
  (g, b) => `"If we die here, at least we're together." ${b} says it as a joke. ${g}'s expression says it isn't one.`,
];

// Phase 3 — Trivia
const TRIVIA_CORRECT = [
  (answerer, partner) => `${answerer} nails it! "I know my partner." The customs officer stamps APPROVED.`,
  (answerer, partner) => `Without hesitation, ${answerer} answers correctly. The stamp comes down: APPROVED!`,
  (answerer, partner) => `${answerer} thinks for exactly one second, then gets it right. ${partner} looks impressed.`,
  (answerer, partner) => `"Easy." ${answerer} answers before the officer finishes asking. APPROVED.`,
  (answerer, partner) => `${answerer} closes ${pronouns(answerer).posAdj} eyes and answers from memory. Correct. ${partner} beams.`,
  (answerer, partner) => `The answer tumbles out of ${answerer}'s mouth. Perfect. The customs gate opens a little wider.`,
];
const TRIVIA_WRONG = [
  (answerer, partner) => `${answerer} guesses wrong. The customs officer shakes ${pronouns(answerer).posAdj} head slowly. DENIED.`,
  (answerer, partner) => `"Really? THAT'S your answer?" The customs officer stamps DENIED with prejudice.`,
  (answerer, partner) => `${answerer} looks at ${partner} with an apologetic grimace. Wrong answer. DENIED.`,
  (answerer, partner) => `${partner}'s face falls as ${answerer} gets it completely wrong. "You don't know me at ALL."`,
  (answerer, partner) => `${answerer} hesitates. Guesses. Gets it wrong. The DENIED stamp echoes through the customs hall.`,
  (answerer, partner) => `The confidence in ${answerer}'s voice makes the wrong answer even worse. DENIED.`,
];
const TRIVIA_SPECTACULAR_WRONG = [
  (answerer, partner) => `${answerer}'s answer is so wrong that ${partner} stares in disbelief. "THAT'S what you think?!" DENIED — with a red ink circle.`,
  (answerer, partner) => `The customs officer actually laughs. ${answerer}'s answer isn't even in the same universe as correct. DENIED.`,
  (answerer, partner) => `${partner} takes a visible step away from ${answerer} after hearing that answer. "We need to talk." DENIED.`,
  (answerer, partner) => `${answerer} answers with total confidence. The answer is not just wrong — it's the opposite of correct. The officer stamps DENIED twice.`,
  (answerer, partner) => `"I... wow." Even the customs officer feels bad stamping DENIED on that disaster.`,
  (answerer, partner) => `${answerer} says something so wrong about ${partner} that ${partner} gasps. "HOW long have we been on this show together?!" DENIED.`,
];

const TRIVIA_QUESTION_PROMPTS = [
  (answerer, partner) => `The customs officer fixes ${answerer} with a stare. "Tell me something about ${partner}. And it better be right."`,
  (answerer, partner) => `"Question for ${answerer}." The officer flips a card. "How well do you REALLY know ${partner}?"`,
  (answerer, partner) => `${answerer} steps to the desk. The officer doesn't look up. "About ${partner} — answer carefully."`,
  (answerer, partner) => `"${answerer}. You're up." The officer's pen hovers. One question. One chance. It's about ${partner}.`,
  (answerer, partner) => `The customs light turns red. ${answerer}'s turn. The question is about ${partner}. ${pronouns(answerer).Sub} swallows hard.`,
  (answerer, partner) => `"Next." The officer gestures at ${answerer}. ${partner} holds ${pronouns(partner).posAdj} breath. This one's about ${pronouns(partner).obj}.`,
  (answerer, partner) => `The officer slides a card across the desk to ${answerer}. It's about ${partner}. The clock starts.`,
  (answerer, partner) => `${answerer} approaches. ${partner} mouths "you got this" from behind. The officer doesn't care. "About your partner—"`,
];

// Social events between phases
const PARTNER_BLAME = [
  (a, b) => `${a} corners ${b}. "You cost us that phase. YOU." The argument is vicious and public.`,
  (a, b) => `${a} hasn't said a word to ${b} since the obstacle course. The silence is louder than shouting.`,
  (a, b) => `"If you'd actually LISTENED to me—" ${a} starts. ${b} fires back. Everyone watches.`,
  (a, b) => `${a} tells anyone who'll listen that ${b} threw the challenge. ${b} hears every word.`,
  (a, b) => `"Next time pair me with literally ANYONE else." ${a} doesn't even look at ${b}.`,
  (a, b) => `${a} replays every mistake ${b} made. Out loud. In front of everyone. ${b} burns with embarrassment.`,
];
const PARTNER_RESPECT = [
  (a, b) => `${a} fist-bumps ${b}. "We make a good team." It's genuine.`,
  (a, b) => `"I couldn't have done that without you." ${a} means it. ${b} nods. Something has shifted between them.`,
  (a, b) => `${a} and ${b} share a look after the phase. No words needed. Mutual respect, earned the hard way.`,
  (a, b) => `"You surprised me out there," ${a} tells ${b}. "In a good way." The bond just got stronger.`,
  (a, b) => `${a} puts a hand on ${b}'s shoulder. "Real talk — that was impressive." ${b} stands a little taller.`,
  (a, b) => `After what they just went through, ${a} and ${b} are closer than they were an hour ago. The challenge did that.`,
];
const SHARK_BONDING = [
  (a, b) => `${a} and ${b} drag themselves out of the water, shaking. They look at each other and burst out laughing. Shared trauma.`,
  (a, b) => `"Did you see that shark's FACE?" ${a} can barely breathe from laughing. ${b} is right there with ${pronouns(a).obj}.`,
  (a, b) => `${a} and ${b} sit on the bank, dripping wet, adrenaline crashing. "We survived that." "Yeah. We did."`,
  (a, b) => `The shark encounter bonds ${a} and ${b} in a way no alliance meeting ever could. Survival does that.`,
  (a, b) => `${a} and ${b} fist-bump, still dripping wet. "I never want to see another shark." "Same." The bond is real.`,
  (a, b) => `"If we can survive THAT together..." ${a} trails off. ${b} finishes: "...we can survive tribal."`,
];

// Phase transition flavor
const PHASE_TRANSITION = [
  `The obstacle course is behind them. The tightrope is ahead. The stakes just got higher.`,
  `Mud-caked and bruised, the pairs line up at the base of the waterfall. Phase Two awaits.`,
  `${host()} gestures toward the tightrope stretching across the waterfall. "Hope you're not afraid of heights."`,
  `The blindfolds come off. The pairs get their first real look at the tightrope. Several people go pale.`,
  `"You thought the obstacle course was bad?" ${host()} grins. "Wait till you see what's swimming below."`,
  `Phase One is done. Phase Two is where champions are made — or where they take a very long fall.`,
  `The customs gate looms ahead. Five questions. One chance. The border doesn't forgive wrong answers.`,
  `Battered and soaked, the pairs approach the customs desk. How well do they REALLY know each other?`,
];

// Chatter / flavor text
const CHATTER = [
  `The waterfall's roar drowns out everything but the screaming.`,
  `Somewhere below, a shark surfaces. Then another. Then five more.`,
  `The customs officer hasn't smiled once. Not once.`,
  `Vegas odds on this challenge: zero point zero.`,
  `The blindfold is supposed to build trust. It's building something else entirely.`,
  `A wedding without cake, without music, without love. Just mud and sharks and trivia.`,
  `The couples that survive this will either be bonded for life or filing for divorce.`,
  `${host()} adjusts ${pronouns(host()).posAdj} sunglasses. This is ${pronouns(host()).posAdj} favorite kind of chaos.`,
  `The tightrope sways in the wind. Nobody asked for this. Everybody signed up for it.`,
  `Somewhere in the production notes, this was labeled 'romantic comedy.'`,
];

// Slot machine reactions
const SLOT_HOST_REACTIONS = [
  (g, b) => `"${g} and ${b}! Oh, this is going to be DELICIOUS."`,
  (g, b) => `"Ohhh no. ${g} and ${b}? I did NOT see that coming."`,
  (g, b) => `"${g}... meet your ball and chain: ${b}!"`,
  (g, b) => `"The machine has paired ${g} with ${b}. I love this machine."`,
  (g, b) => `"${g} and ${b}! Someone check if either of them is about to pass out."`,
  (g, b) => `"Well, well, well. ${g} gets ${b}. The drama writes itself."`,
];
const SLOT_GUIDE_REACTIONS_GOOD = [
  (g, b) => `"${b}! We got this!" ${g} pumps a fist.`,
  (g, b) => `${g} nods slowly. "Could be worse. Could be way worse."`,
  (g, b) => `"Alright, ${b}. Let's make this work," ${g} says, cracking ${pronouns(g).posAdj} knuckles.`,
  (g, b) => `${g} gives ${b} a confident thumbs-up. "You're in good hands."`,
];
const SLOT_BLIND_REACTIONS_GOOD = [
  (g, b) => `${b} exhales with relief. "Thank god. I can work with ${g}."`,
  (g, b) => `"Not bad, not bad," ${b} murmurs, sizing up ${pronouns(b).posAdj} new partner.`,
  (g, b) => `${b} allows a small smile. "At least it's someone I can trust."`,
  (g, b) => `"${g}? Yeah, I'll take that," ${b} says, arms crossed.`,
];
const SLOT_GUIDE_REACTIONS_BAD = [
  (g, b) => `${g}'s face drops. "${b}?! You have GOT to be kidding me."`,
  (g, b) => `${g} stares at the machine like it personally betrayed ${pronouns(g).obj}.`,
  (g, b) => `"Of all the people..." ${g} pinches the bridge of ${pronouns(g).posAdj} nose.`,
  (g, b) => `${g} turns to the camera. "I want a refund."`,
  (g, b) => `"No. Nope. No way." ${g} looks at ${host()} pleadingly. ${host()} just grins.`,
];
const SLOT_BLIND_REACTIONS_BAD = [
  (g, b) => `${b} buries ${pronouns(b).posAdj} face in ${pronouns(b).posAdj} hands. "Anyone but ${g}..."`,
  (g, b) => `"This is rigged," ${b} mutters. "This is absolutely rigged."`,
  (g, b) => `${b} stares daggers at the slot machine. Then at ${g}. Then back at the machine.`,
  (g, b) => `"I'd rather do this blindfolded AND alone," ${b} says flatly.`,
  (g, b) => `${b} doesn't say a word. The silence says everything.`,
];
const SLOT_GUIDE_REACTIONS_COMPAT = [
  (g, b) => `${g} tries to play it cool. ${pronouns(g).Sub} is NOT playing it cool.`,
  (g, b) => `"Oh, this is going to be... interesting," ${g} says with a shy grin.`,
  (g, b) => `${g} clears ${pronouns(g).posAdj} throat awkwardly. "${b}. Hi. Yeah. Cool. Great."`,
  (g, b) => `${g}'s ears turn red. The other contestants start whistling.`,
];
const SLOT_BLIND_REACTIONS_COMPAT = [
  (g, b) => `${b} bites ${pronouns(b).posAdj} lip to suppress a smile. "This is fine."`,
  (g, b) => `${b} blushes. "I mean, I'm not mad about it."`,
  (g, b) => `The chemistry is already radiating off ${b}. Everyone can feel it.`,
  (g, b) => `"Don't look at me like that," ${b} says to ${g}. ${pronouns(b).Sub} is smiling.`,
];
const SLOT_SUSPENSE = [
  `The lever goes down. The reels blur into a golden streak...`,
  `CLUNK. The lever drops. The machine roars to life, lights flashing...`,
  `A pull of the lever. The reels spin so fast they're just streaks of light...`,
  `The machine groans. The bulbs flash red, gold, pink. The reels are alive...`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateBridalBrawls(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    pairs: [],
    phase1: { obstacles: [] },
    phase2: { segments: [] },
    phase3: { questions: [] },
    pairScores: [],
    immunityWinners: [],
    socialEvents: [],
    crasher: null,
  };

  // ── PHASE 0: SLOT MACHINE PAIRING ──
  const pairs = _buildPairs(active);
  result.pairs = pairs;
  if (active.length % 2 === 1) {
    result.crasher = pairs[pairs.length - 1].crasher || null;
  }

  // ── PHASE 1: BLINDFOLDED OBSTACLE COURSE ──
  pairs.forEach((pair, pi) => {
    let totalTime = 0;
    let passedAll = true;
    let spectacularCount = 0;
    const pairObs = [];

    for (let oi = 0; oi < OBSTACLE_COUNT; oi++) {
      const obs = OBSTACLES[oi];
      const gStats = pStats(pair.guide);
      const bStats = pStats(pair.blind);

      let guideQuality = gStats.social * 0.06 + gStats.strategic * 0.04 + noise(2.0);
      let blindScore = bStats[obs.primary] * obs.pw + bStats[obs.secondary] * obs.sw + noise(2.5);
      const pairBond = getBond(pair.guide, pair.blind);
      const trustBonus = clamp(pairBond * 0.15, -0.6, 1.5);

      // Rivalry fuel: low-bond pairs channel spite into competitive focus
      const spiteBonus = pairBond < -1 ? clamp(-pairBond * 0.08, 0, 0.5) : 0;

      // Trust event check
      let trustEvent = null;
      let trustEventChance = 0.50;
      if (pairBond < -2) trustEventChance += 0.20;
      if (VILLAIN_ARCHS.has(arch(pair.guide))) trustEventChance += 0.15;

      if (Math.random() < trustEventChance) {
        trustEvent = _resolveTrustEvent(pair.guide, pair.blind, oi, guideQuality, blindScore, pi);
        if (trustEvent) {
          if (trustEvent.type === 'misdirect') { blindScore -= 0.3; guideQuality -= 0.2; }
          else if (trustEvent.type === 'panic') { blindScore -= 0.2; }
          else if (trustEvent.type === 'refuse') { guideQuality = 0; blindScore += noise(1.5); }
          else if (trustEvent.type === 'trust-fall') { guideQuality += 0.15; }
          else if (trustEvent.type === 'encourage') { blindScore += 0.2; }
          else if (trustEvent.type === 'spite') { guideQuality += 0.25; blindScore += 0.3; }
        }
      }

      let obstacleScore = (guideQuality * 0.4 + blindScore * 0.6) + trustBonus + spiteBonus;
      let outcome, time;

      if (obstacleScore > 0.7) {
        outcome = 'spectacular';
        time = PHASE1_BASE_TIME * (1.0 - obstacleScore * 0.3);
        spectacularCount++;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 4;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 4;
        popDelta(pair.blind, 1);
        addBond(pair.guide, pair.blind, 0.3);
      } else if (obstacleScore > 0.3) {
        outcome = 'success';
        time = PHASE1_BASE_TIME * (1.0 - obstacleScore * 0.3);
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 3;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 3;
        addBond(pair.guide, pair.blind, 0.1);
      } else if (obstacleScore > 0.0) {
        outcome = 'fail';
        time = PHASE1_BASE_TIME * (1.0 + Math.abs(obstacleScore) * 0.5);
        passedAll = false;
        addBond(pair.guide, pair.blind, -0.2);
      } else if (obstacleScore > -0.5) {
        outcome = 'fail';
        time = PHASE1_BASE_TIME * (1.0 + Math.abs(obstacleScore) * 0.5);
        passedAll = false;
        addBond(pair.guide, pair.blind, -0.3);
        popDelta(pair.guide, -1);
      } else {
        outcome = 'critical-fail';
        time = PHASE1_BASE_TIME * 2.0;
        passedAll = false;
        popDelta(pair.blind, -1);
        popDelta(pair.guide, -1);
        addBond(pair.guide, pair.blind, -0.5);
        ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Disaster!', badgeClass: 'badge-danger', text: `${pair.guide} led blindfolded ${pair.blind} into a spectacular wipeout at the ${obs.name}.` });
      }

      // Sabotage from other pairs
      let sabotageEvent = null;
      if (Math.random() < 0.30) {
        sabotageEvent = _resolveSabotage(pair, pairs, pi, ep, campKey);
        if (sabotageEvent) {
          if (sabotageEvent.success) {
            time += 3.0;
            ep.chalMemberScores[sabotageEvent.saboteur] = (ep.chalMemberScores[sabotageEvent.saboteur] || 0) + 2;
            addBond(sabotageEvent.saboteur, pair.guide, -0.8);
            addBond(sabotageEvent.saboteur, pair.blind, -0.8);
            popDelta(sabotageEvent.saboteur, -1);
            ep.campEvents[campKey].post.push({ players: [sabotageEvent.saboteur, pair.guide, pair.blind], badgeText: 'Sabotage!', badgeClass: 'badge-danger', text: sabotageEvent.text });
          } else {
            ep.chalMemberScores[sabotageEvent.saboteur] = (ep.chalMemberScores[sabotageEvent.saboteur] || 0) - 2;
          }
        }
      }

      totalTime += time;

      // Apply trust event consequences
      if (trustEvent) {
        if (trustEvent.type === 'misdirect') {
          addBond(pair.guide, pair.blind, -1.0);
          popDelta(pair.guide, -1);
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Misdirection!', badgeClass: 'badge-danger', text: trustEvent.text });
        } else if (trustEvent.type === 'panic') {
          addBond(pair.guide, pair.blind, -0.3);
          popDelta(pair.blind, -1);
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Panic!', badgeClass: 'badge-warning', text: trustEvent.text });
        } else if (trustEvent.type === 'refuse') {
          if (outcome === 'success' || outcome === 'spectacular') {
            addBond(pair.guide, pair.blind, 0.3);
            popDelta(pair.blind, 1);
          } else {
            addBond(pair.guide, pair.blind, -0.5);
            popDelta(pair.blind, -1);
          }
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Refused!', badgeClass: 'badge-warning', text: trustEvent.text });
        } else if (trustEvent.type === 'trust-fall') {
          addBond(pair.guide, pair.blind, 0.5);
          popDelta(pair.guide, 1);
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Trust!', badgeClass: 'badge-success', text: trustEvent.text });
        } else if (trustEvent.type === 'encourage') {
          addBond(pair.guide, pair.blind, 0.3);
          popDelta(pair.guide, 1);
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Encouragement!', badgeClass: 'badge-success', text: trustEvent.text });
        } else if (trustEvent.type === 'spite') {
          popDelta(pair.guide, 1);
          popDelta(pair.blind, 1);
          ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 2;
          ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 2;
          ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Spite Fuel!', badgeClass: 'badge-info', text: trustEvent.text });
        }
      }

      pairObs.push({
        pairIdx: pi, obstacleNum: oi, obstacleName: obs.name,
        score: obstacleScore, outcome, time: Math.round(time * 10) / 10,
        trustEvent: trustEvent ? { type: trustEvent.type, text: trustEvent.text } : null,
        sabotageEvent: sabotageEvent ? { saboteur: sabotageEvent.saboteur, success: sabotageEvent.success, text: sabotageEvent.text } : null,
      });
    }

    // Phase 1 bonus scoring
    if (passedAll) {
      ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 3;
      ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 5;
    }

    pair.phase1Time = totalTime;
    pair.phase1Score = (72.0 - totalTime) * 1.0;
    pair.phase1Passed = passedAll;
    pair.phase1Obs = pairObs;
    result.phase1.obstacles.push(...pairObs);
  });

  // ── SOCIAL EVENTS BETWEEN PHASE 1 → 2 ──
  _generateSocialEvents12(pairs, result, ep, campKey);

  // ── PHASE 2: TIGHTROPE CARRY ──
  pairs.forEach((pair, pi) => {
    let totalTime = 0;
    let sharkEncounters = 0;
    let cleanCrosses = 0;
    let falls = 0;
    const pairSegs = [];

    for (let si = 0; si < TIGHTROPE_SEGMENTS; si++) {
      const seg = SEGMENTS[si];
      const gStats = pStats(pair.guide);
      const bStats = pStats(pair.blind);

      const carrierLoad = gStats.physical * 0.07 + gStats.endurance * 0.05 + noise(2.5);
      const partnerHelp = bStats.endurance * 0.03 + bStats.physical * 0.02 + noise(1.0);
      const windPenalty = si * 0.08 + noise(0.5);
      const ropeBond = getBond(pair.guide, pair.blind);
      const trustSteady = clamp(ropeBond * 0.08, -0.3, 0.6);
      const ropeSpite = ropeBond < -1 ? clamp(-ropeBond * 0.06, 0, 0.35) : 0;
      let balanceScore = carrierLoad + partnerHelp - windPenalty + trustSteady + ropeSpite;

      // Showmance moment check — only for pairs actually in a romance (showmance or spark)
      let showmanceMoment = null;
      const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players?.includes(pair.guide) && sh.players?.includes(pair.blind));
      const hasSpark = (gs.romanticSparks || []).some(sp => sp.players.includes(pair.guide) && sp.players.includes(pair.blind));
      if ((isShowmance || hasSpark) && Math.random() < 0.40) {
        const smText = pick(SHOWMANCE_MOMENTS)(pair.guide, pair.blind);
        showmanceMoment = { text: smText };
        addBond(pair.guide, pair.blind, 0.5);
        popDelta(pair.guide, 1);
        popDelta(pair.blind, 1);
        balanceScore += 0.3;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 1;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 1;
        ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Showmance!', badgeClass: 'badge-success', text: smText });
      }

      // Rivalry spite moment — enemies refusing to lose together
      let spiteMoment = null;
      if (!showmanceMoment && ropeBond < -2 && Math.random() < 0.30) {
        const spText = pick(TRUST_SPITE_TIGHTROPE)(pair.guide, pair.blind);
        spiteMoment = { text: spText };
        balanceScore += 0.25;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 2;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 2;
        popDelta(pair.guide, 1);
        popDelta(pair.blind, 1);
        ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Spite Fuel!', badgeClass: 'badge-info', text: spText });
      }

      let outcome, segTime = 0;
      let sharkEncounter = null;
      let fallCount = 0;

      if (balanceScore > 0.6) {
        outcome = 'clean';
        segTime = -2.0;
        cleanCrosses++;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 3;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 3;
        addBond(pair.guide, pair.blind, 0.2);
        popDelta(pair.guide, 1);
      } else if (balanceScore > 0.2) {
        outcome = 'wobble';
        segTime = 0;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 1;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 1;
      } else if (balanceScore > -0.2) {
        outcome = 'near-fall';
        segTime = 3.0;
        addBond(pair.guide, pair.blind, -0.1);
      } else {
        outcome = 'fall';
        falls++;
        ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) - 2;
        ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) - 2;
        addBond(pair.guide, pair.blind, -0.4);
        popDelta(pair.guide, -1);

        // Shark encounter
        const faller = Math.random() < 0.5 ? pair.guide : pair.blind;
        const fStats = pStats(faller);
        const sharkDodge = fStats.physical * 0.06 + fStats.boldness * 0.05 + noise(2.5);
        const sharkThreshold = 0.2 + si * 0.12;
        let sharkPenalty;
        if (sharkDodge > sharkThreshold) {
          sharkPenalty = seg.fallMult * 2.0;
          sharkEncounter = { dodged: true, faller, text: pick(SHARK_DODGE_SUCCESS)(faller) };
          ep.chalMemberScores[faller] = (ep.chalMemberScores[faller] || 0) + 2;
          popDelta(faller, 1);
          addBond(pair.guide, pair.blind, 0.3);
        } else {
          sharkPenalty = seg.fallMult * 5.0;
          sharkEncounter = { dodged: false, faller, text: pick(SHARK_DODGE_FAIL)(faller) };
          popDelta(faller, -1);
          ep.campEvents[campKey].post.push({ players: [faller], badgeText: 'Shark!', badgeClass: 'badge-danger', text: sharkEncounter.text });
        }
        sharkEncounters++;
        segTime = FALL_BASE_PENALTY + sharkPenalty;
      }

      totalTime += segTime;

      pairSegs.push({
        pairIdx: pi, segNum: si, segName: seg.name,
        balanceScore, outcome,
        sharkEncounter: sharkEncounter ? { dodged: sharkEncounter.dodged, faller: sharkEncounter.faller, text: sharkEncounter.text } : null,
        showmanceMoment: showmanceMoment ? { text: showmanceMoment.text } : null,
        spiteMoment: spiteMoment ? { text: spiteMoment.text } : null,
      });
    }

    // Clean cross bonus
    if (cleanCrosses === TIGHTROPE_SEGMENTS) {
      popDelta(pair.guide, 2);
      popDelta(pair.blind, 1);
      addBond(pair.guide, pair.blind, 0.5);
      ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Flawless!', badgeClass: 'badge-success', text: `${pair.guide} carried ${pair.blind} across every segment without a single wobble. The crowd is stunned.` });
    }

    pair.phase2Time = totalTime;
    pair.phase2Score = (50.0 - totalTime) * 1.5;
    pair.phase2Falls = falls;
    pair.phase2Sharks = sharkEncounters;
    pair.phase2Segs = pairSegs;
    result.phase2.segments.push(...pairSegs);
  });

  // ── SOCIAL EVENTS BETWEEN PHASE 2 → 3 ──
  _generateSocialEvents23(pairs, result, ep, campKey);

  // ── PHASE 3: CUSTOMS TRIVIA ──
  pairs.forEach((pair, pi) => {
    const bondLevel = getBond(pair.guide, pair.blind);
    let difficultyKey, threshold;
    if (bondLevel >= 4) { difficultyKey = 'easy'; threshold = DIFFICULTY_THRESHOLDS.easy; }
    else if (bondLevel >= 0) { difficultyKey = 'medium'; threshold = DIFFICULTY_THRESHOLDS.medium; }
    else if (bondLevel >= -3) { difficultyKey = 'hard'; threshold = DIFFICULTY_THRESHOLDS.hard; }
    else { difficultyKey = 'brutal'; threshold = DIFFICULTY_THRESHOLDS.brutal; }

    let correctCount = 0;
    let wrongCount = 0;
    let totalTime = 0;
    const pairQs = [];

    for (let qi = 0; qi < TRIVIA_QUESTIONS; qi++) {
      const answerer = Math.random() < 0.5 ? pair.guide : pair.blind;
      const partner = answerer === pair.guide ? pair.blind : pair.guide;
      const aStats = pStats(answerer);

      const answerScore = aStats.mental * 0.07 + aStats.intuition * 0.04 + noise(2.5);
      // Enemies observe each other — rivalry knowledge partially offsets low bond
      const rivalryKnowledge = bondLevel < -1 ? clamp(-bondLevel * 0.05, 0, 0.3) : 0;
      const knowledgeBonus = clamp(getBond(answerer, partner) * 0.10, -0.4, 0.8) + rivalryKnowledge;
      const finalScore = answerScore + knowledgeBonus;
      const correct = finalScore > threshold;

      let qTime;
      if (correct) {
        qTime = -3.0;
        correctCount++;
        ep.chalMemberScores[answerer] = (ep.chalMemberScores[answerer] || 0) + 3;
        ep.chalMemberScores[partner] = (ep.chalMemberScores[partner] || 0) + 2;
        addBond(answerer, partner, 0.2);
        popDelta(answerer, 1);
      } else if (finalScore < threshold - 0.5) {
        qTime = 8.0;
        wrongCount++;
        ep.chalMemberScores[answerer] = (ep.chalMemberScores[answerer] || 0) - 1;
        popDelta(answerer, -1);
        addBond(answerer, partner, -0.5);
        ep.campEvents[campKey].post.push({ players: [answerer, partner], badgeText: 'Wrong!', badgeClass: 'badge-danger', text: `${answerer} got a question about ${partner} spectacularly wrong at customs. ${partner} is not impressed.` });
      } else {
        qTime = 5.0;
        wrongCount++;
        ep.chalMemberScores[answerer] = (ep.chalMemberScores[answerer] || 0) - 1;
        addBond(answerer, partner, -0.2);
      }
      totalTime += qTime;

      const isRivalryCorrect = correct && bondLevel < -1;
      pairQs.push({
        pairIdx: pi, questionNum: qi, answerer, partner, difficulty: difficultyKey,
        score: finalScore, correct, spectacularWrong: !correct && finalScore < threshold - 0.5,
        rivalryCorrect: isRivalryCorrect,
      });
    }

    // All correct bonus
    if (correctCount === TRIVIA_QUESTIONS) {
      popDelta(pair.guide, 1);
      popDelta(pair.blind, 1);
      addBond(pair.guide, pair.blind, 0.5);
      ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Perfect Score!', badgeClass: 'badge-success', text: `${pair.guide} and ${pair.blind} aced every customs question. They know each other better than anyone expected.` });
    }

    pair.phase3Score = (correctCount * 6.0) - (wrongCount * 3.0);
    pair.phase3Correct = correctCount;
    pair.phase3Qs = pairQs;
    result.phase3.questions.push(...pairQs);
  });

  // ── FINAL SCORING ──
  pairs.forEach((pair, pi) => {
    let totalScore = (pair.phase1Score || 0) + (pair.phase2Score || 0) + (pair.phase3Score || 0);
    if (pair.crasher) totalScore -= 5.0;
    pair.totalScore = totalScore;
    result.pairScores.push({
      guide: pair.guide, blind: pair.blind, crasher: pair.crasher || null,
      phase1Score: Math.round((pair.phase1Score || 0) * 10) / 10,
      phase2Score: Math.round((pair.phase2Score || 0) * 10) / 10,
      phase3Score: Math.round((pair.phase3Score || 0) * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
    });
  });

  // Sort pairs by total score
  result.pairScores.sort((a, b) => b.totalScore - a.totalScore);
  const winPair = result.pairScores[0];
  result.immunityWinners = [winPair.guide, winPair.blind];

  // ── PAIR PLACEMENT → INDIVIDUAL SCORE BONUS ──
  // Both partners share equal credit — they win or lose as a team.
  const numPairs = result.pairScores.length;
  result.pairScores.forEach((ps, rank) => {
    const placementBonus = Math.max(0, (numPairs - rank) * 4);
    const phaseBonus = Math.max(0, ps.totalScore * 0.15);
    const share = Math.round((placementBonus + phaseBonus) * 10) / 10;
    ep.chalMemberScores[ps.guide] = (ep.chalMemberScores[ps.guide] || 0) + share;
    ep.chalMemberScores[ps.blind] = (ep.chalMemberScores[ps.blind] || 0) + share;
  });

  // Crasher popularity penalty
  if (result.crasher) popDelta(result.crasher, -1);

  // Immunity: both winners get immunity
  ep.immunityWinner = winPair.guide;
  ep.immunityWinners = [winPair.guide, winPair.blind];
  if (!ep.extraImmune) ep.extraImmune = [];
  ep.extraImmune.push(winPair.guide, winPair.blind);

  // Massive chalMemberScores bonus for immunity winners
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== winPair.guide && n !== winPair.blind).map(([, s]) => s));
  ep.chalMemberScores[winPair.guide] = Math.max(ep.chalMemberScores[winPair.guide] || 0, maxOther) + active.length + 5;
  ep.chalMemberScores[winPair.blind] = Math.max(ep.chalMemberScores[winPair.blind] || 0, maxOther) + active.length + 5;

  // ── WEDDING ROMANCE ENGINE ──
  // This is THE romance challenge — boosted spark rates, jealousy, breakups, forced proximity
  _weddingRomanceEvents(pairs, result, ep, campKey, active);

  // Camp event for wedding crasher
  if (result.crasher) {
    ep.campEvents[campKey].post.push({
      players: [result.crasher], badgeText: 'Wedding Crasher', badgeClass: 'badge-info',
      text: `${result.crasher} was the odd one out — the awkward third wheel in someone else's partnership.`,
    });
  }

  // Finalize
  ep.challengeData = result;
  ep.isBridalBrawls = true;
  ep.challengeType = 'bridal-brawls';
  ep.challengeLabel = 'Bridal Brawls';
  ep.challengeCategory = 'social';
  ep.challengeDesc = 'Casino slot machine pairs players for a blindfolded obstacle course, tightrope over a shark waterfall, and customs trivia gate.';
  ep.tribalPlayers = active;
  ep.chalPlacements = result.pairScores.flatMap(ps => [ps.guide, ps.blind]);
  updateChalRecord(ep);
  return ep;
}

// ── PAIRING ALGORITHM ──
function _buildPairs(active) {
  const pool = [...active];
  const allPairs = [];

  // Score every possible pair
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      const bondVal = getBond(a, b);
      const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players?.includes(a) && sh.players?.includes(b));
      const isRival = bondVal < -3;
      const dramaScore = Math.abs(bondVal) * 1.5 + (isShowmance ? -3 : 0) + (isRival ? 4 : 0);
      const romanticScore = romanticCompat(a, b) ? 2.0 : 0;
      const pairWeight = dramaScore * 0.25 + romanticScore * 0.15 + Math.random() * 0.60;
      allPairs.push({ a, b, pairWeight, compat: romanticCompat(a, b), drama: dramaScore });
    }
  }

  allPairs.sort((a, b) => b.pairWeight - a.pairWeight);

  const used = new Set();
  const pairs = [];

  for (const p of allPairs) {
    if (used.has(p.a) || used.has(p.b)) continue;
    used.add(p.a);
    used.add(p.b);

    // Role assignment
    const gScoreA = _guideScore(p.a);
    const gScoreB = _guideScore(p.b);
    const guide = gScoreA >= gScoreB ? p.a : p.b;
    const blind = guide === p.a ? p.b : p.a;

    pairs.push({
      guide, blind, crasher: null,
      pairWeight: p.pairWeight, compat: p.compat,
      trustLevel: getBond(guide, blind),
    });

    if (pairs.length >= Math.floor(active.length / 2)) break;
  }

  // Odd player joins weakest pair as crasher
  if (active.length % 2 === 1) {
    const remaining = active.find(n => !used.has(n));
    if (remaining) {
      const weakest = pairs.reduce((min, p) => p.pairWeight < min.pairWeight ? p : min, pairs[0]);
      weakest.crasher = remaining;
    }
  }

  return pairs;
}

function _guideScore(name) {
  const a = arch(name);
  const s = pStats(name);
  let score = 0;
  if (['mastermind', 'schemer', 'villain', 'challenge-beast'].includes(a)) score += 3;
  else if (['hero', 'perceptive-player'].includes(a)) score += 2;
  else if (['hothead', 'chaos-agent', 'wildcard'].includes(a)) score += 1;
  else if (['goat', 'floater', 'underdog', 'showmancer'].includes(a)) score -= 1;
  score += (s.social * 0.3 + s.strategic * 0.2) + noise(1.5);
  return score;
}

// ── TRUST EVENTS ──
function _resolveTrustEvent(guide, blind, obsIdx, guideQuality, blindScore, pairIdx) {
  const gArch = arch(guide);
  const bArch = arch(blind);
  const bStats = pStats(blind);
  const bond = getBond(guide, blind);

  // Spite fuel: rival pairs channeling hatred into performance (checked BEFORE negative events)
  const gStats2 = pStats(guide);
  if (bond < -1 && Math.random() < 0.40) {
    const competitiveScore = (gStats2.strategic * 0.05 + bStats.boldness * 0.05 + gStats2.endurance * 0.03);
    if (competitiveScore > 0.35 + noise(0.5)) {
      return { type: 'spite', text: pick(TRUST_SPITE_OBSTACLE)(guide, blind) };
    }
  }
  // Misdirect: villain guide + bond < 0
  if (VILLAIN_ARCHS.has(gArch) && bond < 0 && Math.random() < 0.5) {
    return { type: 'misdirect', text: pick(TRUST_MISDIRECT)(guide, blind) };
  }
  // Panic: low boldness blind + obstacle context
  if (bStats.boldness * 0.1 < 0.5 && Math.random() < 0.4) {
    return { type: 'panic', text: pick(TRUST_PANIC)(guide, blind) };
  }
  // Refuse: high strategic blind OR bond < -3
  if ((bStats.strategic * 0.1 > 0.7 || bond < -3) && Math.random() < 0.35) {
    return { type: 'refuse', text: pick(TRUST_REFUSE)(guide, blind) };
  }
  // Trust fall: bond > 3 + success likely
  if (bond > 3 && Math.random() < 0.5) {
    return { type: 'trust-fall', text: pick(TRUST_FALL)(guide, blind) };
  }
  // Encourage: hero/loyal-soldier guide
  if (['hero', 'loyal-soldier'].includes(gArch) && Math.random() < 0.6) {
    return { type: 'encourage', text: pick(TRUST_ENCOURAGE)(guide, blind) };
  }
  return null;
}

// ── SABOTAGE ──
function _resolveSabotage(targetPair, allPairs, targetIdx, ep, campKey) {
  // Find eligible saboteurs from other pairs
  const candidates = [];
  allPairs.forEach((p, i) => {
    if (i === targetIdx) return;
    [p.guide, p.blind].forEach(n => {
      const a = arch(n);
      const s = pStats(n);
      if (VILLAIN_ARCHS.has(a)) candidates.push(n);
      else if (!NICE_ARCHS.has(a) && s.strategic * 0.1 >= 0.6 && s.loyalty * 0.1 <= 0.4) candidates.push(n);
    });
  });
  if (candidates.length === 0) return null;

  const saboteur = pick(candidates);
  const sStats = pStats(saboteur);
  const sabotageScore = sStats.strategic * 0.07 + sStats.social * 0.04 + noise(2.5);
  const gStats = pStats(targetPair.guide);
  const detectScore = gStats.intuition * 0.06 + gStats.mental * 0.04 + noise(2.5);

  if (sabotageScore > detectScore) {
    return { saboteur, success: true, text: pick(SABOTAGE_SUCCESS)(saboteur, targetPair.blind) };
  } else {
    popDelta(saboteur, -2);
    addBond(saboteur, targetPair.guide, -0.5);
    addBond(saboteur, targetPair.blind, -0.5);
    ep.campEvents[campKey].post.push({
      players: [saboteur, targetPair.guide, targetPair.blind],
      badgeText: 'Sabotage!', badgeClass: 'badge-danger',
      text: pick(SABOTAGE_DETECTED)(saboteur, targetPair.guide),
    });
    return { saboteur, success: false, text: pick(SABOTAGE_DETECTED)(saboteur, targetPair.guide) };
  }
}

// ── SOCIAL EVENTS BETWEEN PHASES ──
function _generateSocialEvents12(pairs, result, ep, campKey) {
  pairs.forEach(pair => {
    // Partner blame (failed obstacles, low bond)
    if (!pair.phase1Passed && getBond(pair.guide, pair.blind) < 2 && Math.random() < 0.6) {
      const blamer = Math.random() < 0.5 ? pair.guide : pair.blind;
      const blamed = blamer === pair.guide ? pair.blind : pair.guide;
      addBond(blamer, blamed, -0.8);
      const text = pick(PARTNER_BLAME)(blamer, blamed);
      ep.campEvents[campKey].post.push({ players: [blamer, blamed], badgeText: 'Argument!', badgeClass: 'badge-warning', text });
      result.socialEvents.push({ type: 'blame', players: [blamer, blamed], text, bondDelta: -0.8 });
    }
    // Partner respect (passed all obstacles)
    if (pair.phase1Passed && Math.random() < 0.7) {
      addBond(pair.guide, pair.blind, 0.5);
      popDelta(pair.guide, 1);
      popDelta(pair.blind, 1);
      const text = pick(PARTNER_RESPECT)(pair.guide, pair.blind);
      ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Teamwork!', badgeClass: 'badge-success', text });
      result.socialEvents.push({ type: 'respect', players: [pair.guide, pair.blind], text, bondDelta: 0.5 });
    }
  });

  // Rival pair trash talk
  if (pairs.length >= 2 && Math.random() < 0.5) {
    const p1 = pairs[0], p2 = pairs[1];
    const talker = Math.random() < 0.5 ? p1.guide : p2.guide;
    const target = talker === p1.guide ? p2.guide : p1.guide;
    const tStats = pStats(talker);
    const targetStats = pStats(target);
    const socialCheck = tStats.social * 0.1 + noise(1.0);
    const resist = targetStats.social * 0.1 + noise(1.0);
    if (socialCheck > resist) {
      popDelta(talker, 1);
      addBond(talker, target, -0.5);
    } else {
      popDelta(talker, -1);
      popDelta(target, 1);
      addBond(talker, target, -0.3);
    }
    const text = `${talker} trash talks ${target} between phases. ${socialCheck > resist ? `${target} has no comeback.` : `${target} fires back harder.`}`;
    ep.campEvents[campKey].post.push({ players: [talker, target], badgeText: 'Trash Talk!', badgeClass: 'badge-warning', text });
    result.socialEvents.push({ type: 'trash-talk', players: [talker, target], text, bondDelta: -0.5 });
  }
}

function _generateSocialEvents23(pairs, result, ep, campKey) {
  pairs.forEach(pair => {
    // Dramatic rescue gratitude (fell + survived)
    if (pair.phase2Falls > 0 && Math.random() < 0.6) {
      addBond(pair.guide, pair.blind, 1.0);
      const text = `${pair.guide} pulled ${pair.blind} back onto the rope after a terrifying fall. That kind of save changes things.`;
      ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Rescue!', badgeClass: 'badge-success', text });
      popDelta(pair.guide, 2);
      result.socialEvents.push({ type: 'rescue', players: [pair.guide, pair.blind], text, bondDelta: 1.0 });
    }
    // Shark survivor bonding
    if (pair.phase2Sharks > 0 && Math.random() < 0.5) {
      addBond(pair.guide, pair.blind, 0.5);
      popDelta(pair.guide, 1);
      popDelta(pair.blind, 1);
      const text = pick(SHARK_BONDING)(pair.guide, pair.blind);
      ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Shark Survivors', badgeClass: 'badge-info', text });
      result.socialEvents.push({ type: 'shark-bonding', players: [pair.guide, pair.blind], text, bondDelta: 0.5 });
    }
  });

  // Alliance whisper between pairs
  if (pairs.length >= 2 && Math.random() < 0.4) {
    const p1 = pick(pairs), p2 = pick(pairs.filter(p => p !== p1));
    const whisperer = pStats(p1.guide).strategic * 0.1 > 0.6 ? p1.guide : p1.blind;
    const target = Math.random() < 0.5 ? p2.guide : p2.blind;
    addBond(whisperer, target, 0.5);
    const text = `${whisperer} pulls ${target} aside between phases. "After this is over... we should talk." Alliance wheels are turning.`;
    result.socialEvents.push({ type: 'alliance-whisper', players: [whisperer, target], text, bondDelta: 0.5 });
    ep.campEvents[campKey].post.push({ players: [whisperer, target], badgeText: 'Alliance Whisper', badgeClass: 'badge-info', text });
  }
}

// ── WEDDING ROMANCE ENGINE ──
function _weddingRomanceEvents(pairs, result, ep, campKey, active) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances) gs.showmances = [];
  if (!gs.romanticSparks) gs.romanticSparks = [];
  if (!result.romanceEvents) result.romanceEvents = [];

  const popD = (n, d) => { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };

  // ── 1. FORCED PAIRING SPARKS — much higher rate than normal challenges ──
  // Being paired in a wedding challenge is inherently romantic — lower thresholds
  pairs.forEach(pair => {
    if (!romanticCompat(pair.guide, pair.blind)) return;
    const bond = getBond(pair.guide, pair.blind);
    const aArch = players.find(p => p.name === pair.guide)?.archetype || '';
    const bArch = players.find(p => p.name === pair.blind)?.archetype || '';
    const isShowmancer = aArch === 'showmancer' || bArch === 'showmancer';
    // Wedding context: much lower bond threshold for sparks
    const threshold = isShowmancer ? 1.5 : 2.5;
    if (bond < threshold) return;
    // Already sparked or showmanced with THIS partner?
    if (gs.romanticSparks.some(sp => sp.players.includes(pair.guide) && sp.players.includes(pair.blind))) return;
    if (gs.showmances.some(sh => sh.players.includes(pair.guide) && sh.players.includes(pair.blind))) return;
    // Either player already in an active showmance with someone else? No new sparks — that's affair territory
    const guideInShowmance = gs.showmances.some(sh => sh.phase !== 'broken-up' && sh.players?.includes(pair.guide) && sh.players.every(p => gs.activePlayers.includes(p)));
    const blindInShowmance = gs.showmances.some(sh => sh.phase !== 'broken-up' && sh.players?.includes(pair.blind) && sh.players.every(p => gs.activePlayers.includes(p)));
    if (guideInShowmance || blindInShowmance) return;
    // Either player already has a spark with someone else? One spark at a time
    const guideHasSpark = gs.romanticSparks.some(sp => sp.players.includes(pair.guide));
    const blindHasSpark = gs.romanticSparks.some(sp => sp.players.includes(pair.blind));
    if (guideHasSpark || blindHasSpark) return;
    // Active showmance cap
    const activeShows = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
    if (activeShows.length >= 2) return;
    // Higher spark chance in wedding context (3x normal)
    const sparkChance = (bond - threshold) * 0.15 + (isShowmancer ? 0.25 : 0.10);
    if (Math.random() >= sparkChance) return;

    const epNum = (gs.episode || 0) + 1;
    gs.romanticSparks.push({ players: [pair.guide, pair.blind], sparkEp: epNum, context: 'wedding challenge pairing', intensity: 0.5, fake: false, saboteur: null });
    addBond(pair.guide, pair.blind, 0.8);
    popD(pair.guide, 2); popD(pair.blind, 2);
    ep.chalMemberScores[pair.guide] = (ep.chalMemberScores[pair.guide] || 0) + 1;
    ep.chalMemberScores[pair.blind] = (ep.chalMemberScores[pair.blind] || 0) + 1;
    const sparkTexts = [
      `The slot machine paired ${pair.guide} and ${pair.blind} together — and something about the wedding theme made it real. The blindfold, the trust, the carrying... by the end, neither is acting.`,
      `${pair.guide} and ${pair.blind} started this challenge as partners. By the tightrope, ${pair.guide} is holding on a little too tight, and ${pair.blind} isn't pulling away.`,
      `"It's just a challenge," ${pair.guide} keeps saying. Nobody believes ${pronouns(pair.guide).obj}. Especially not ${pair.blind}.`,
      `The wedding theme was supposed to be a joke. But ${pair.guide} catching ${pair.blind}'s hand on the tightrope — that wasn't comedy. The tribe sees it.`,
    ];
    const text = pick(sparkTexts);
    ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Romance Spark!', badgeClass: 'badge-success', text });
    result.romanceEvents.push({ type: 'spark', players: [pair.guide, pair.blind], text });
  });

  // ── 2. JEALOUSY — showmance partner paired with someone else ──
  const _jealousyFired = new Set();
  (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players?.every(p => active.includes(p))).forEach(sh => {
    const [a, b] = sh.players;
    // Find which showmance member is in a pair with someone who ISN'T their partner
    for (const pair of pairs) {
      let jealous = null, paired = null, rival = null;
      if (pair.guide === a && pair.blind !== b) { jealous = b; paired = a; rival = pair.blind; }
      else if (pair.blind === a && pair.guide !== b) { jealous = b; paired = a; rival = pair.guide; }
      else if (pair.guide === b && pair.blind !== a) { jealous = a; paired = b; rival = pair.blind; }
      else if (pair.blind === b && pair.guide !== a) { jealous = a; paired = b; rival = pair.guide; }
      if (!jealous) continue;
      if (_jealousyFired.has(jealous)) continue;
      if (Math.random() > 0.65) continue;
      _jealousyFired.add(jealous);

      addBond(jealous, rival, -0.8);
      addBond(jealous, paired, -0.3);
      popD(jealous, -1);
      const jealousyTexts = [
        `${jealous} watches ${paired} and ${rival} get paired together. The wedding dress, the blindfold, the carrying — ${pronouns(jealous).sub} can't look away. And can't hide how much it hurts.`,
        `"That should be me." ${jealous} mutters it under ${pronouns(jealous).posAdj} breath as ${paired} catches ${rival} on the tightrope. The cameras catch everything.`,
        `${jealous} is supposed to be focused on ${pronouns(jealous).posAdj} own partner. But ${pronouns(jealous).posAdj} eyes keep drifting to ${paired} and ${rival}. The whole tribe notices.`,
        `The slot machine didn't pair ${jealous} with ${paired}. In a WEDDING challenge. ${jealous} is spiraling and everyone can see it.`,
      ];
      const text = pick(jealousyTexts);
      ep.campEvents[campKey].post.push({ players: [jealous, paired, rival], badgeText: 'Jealousy!', badgeClass: 'badge-warning', text });
      result.romanceEvents.push({ type: 'jealousy', players: [jealous, paired, rival], text });
      break; // one jealousy event per showmance
    }
  });

  // ── 3. SHOWMANCE BOOST — existing showmance paired together ──
  pairs.forEach(pair => {
    const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players?.includes(pair.guide) && sh.players?.includes(pair.blind));
    if (!isShowmance) return;
    addBond(pair.guide, pair.blind, 1.0);
    popD(pair.guide, 2); popD(pair.blind, 2);
    const boostTexts = [
      `The machine paired ${pair.guide} and ${pair.blind} — an actual couple in a wedding challenge. The universe has a sense of humor. They're glowing.`,
      `${pair.guide} and ${pair.blind} didn't need the slot machine to tell them. But the wedding theme? The blindfold trust? The tightrope carry? This is their episode.`,
      `Everyone groans when the machine pairs ${pair.guide} and ${pair.blind}. "Of COURSE." The showmance couple in a wedding challenge. They're already insufferable.`,
    ];
    const text = pick(boostTexts);
    ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Power Couple!', badgeClass: 'badge-success', text });
    result.romanceEvents.push({ type: 'showmance-boost', players: [pair.guide, pair.blind], text });

    // Showmance intensity boost
    const sh = gs.showmances.find(s => s.players?.includes(pair.guide) && s.players?.includes(pair.blind) && s.phase !== 'broken-up');
    if (sh && sh.intensity !== undefined) sh.intensity = Math.min((sh.intensity || 0) + 0.3, 1.0);
  });

  // ── 4. BREAKUP PRESSURE — low bond showmance pair, challenge stress breaks them ──
  pairs.forEach(pair => {
    const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players?.includes(pair.guide) && s.players?.includes(pair.blind));
    if (!sh) return;
    const bond = getBond(pair.guide, pair.blind);
    if (bond > 1) return; // only if relationship is already strained
    if (Math.random() > 0.50) return;
    // Challenge stress triggers breakup
    sh.phase = 'broken-up';
    sh.breakupEp = (gs.episode || 0) + 1;
    sh.breakupType = 'challenge-stress';
    addBond(pair.guide, pair.blind, -2.0);
    popD(pair.guide, -2); popD(pair.blind, -2);
    const breakTexts = [
      `The wedding challenge broke them. ${pair.guide} and ${pair.blind} couldn't make it through one obstacle without fighting. By the customs gate, they're not even speaking. The showmance is over.`,
      `"If this is what being married to you would be like, I'd rather be voted out." ${pair.guide} says it loud enough for the cameras. ${pair.blind} doesn't respond. It's done.`,
      `The blindfold was supposed to test trust. ${pair.guide} and ${pair.blind} failed. The tightrope was supposed to test partnership. They fell. By the end, the only thing left to break was the relationship.`,
    ];
    const text = pick(breakTexts);
    ep.campEvents[campKey].post.push({ players: [pair.guide, pair.blind], badgeText: 'Breakup!', badgeClass: 'badge-danger', text });
    result.romanceEvents.push({ type: 'breakup', players: [pair.guide, pair.blind], text });
  });

  // ── 5. SPARK BETWEEN NON-PAIRED PLAYERS — watching from the sidelines ──
  // Spectators watching the challenge can spark too (lower rate)
  const _romActive = active.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++) {
    for (let j = i + 1; j < _romActive.length; j++) {
      const a = _romActive[i], b = _romActive[j];
      // Skip if they're in the same pair (handled above with boosted rates)
      const samePair = pairs.some(p => (p.guide === a && p.blind === b) || (p.guide === b && p.blind === a));
      if (samePair) continue;
      _challengeRomanceSpark(a, b, ep, null, null, ep.chalMemberScores || {}, 'wedding challenge spectating');
    }
  }

  // ── 6. SHOWMANCE CHALLENGE MOMENTS — protective/jealousy/PDA ──
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'danger', _romActive);
}

// ══════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`bb-step-${suffix}-${i}`);
    if (el) {
      el.classList.add('bb-visible');
      _triggerReelSpin(el);
    }
  }
  const counter = document.getElementById(`bb-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`bb-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.bb-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function bbRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('bb-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) { /* stale DOM */ }
  try {
    const el = document.getElementById(`bb-step-${suffix}-${st.idx}`);
    if (el) {
      _triggerReelSpin(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (e) { /* scroll fail */ }
  try { _bbUpdateSidebar(screenKey); } catch (e) { /* sidebar fail */ }
}

function _triggerReelSpin(stepEl) {
  const strips = stepEl.querySelectorAll('.bb-reel-strip[data-spin]');
  strips.forEach(strip => {
    const cls = strip.getAttribute('data-spin');
    if (cls && !strip.classList.contains(cls)) {
      strip.classList.remove('spin-r1', 'spin-r2', 'spin-r3');
      void strip.offsetWidth;
      strip.classList.add(cls);
    }
  });
}

export function bbRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('bb-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) { /* stale DOM */ }
  try {
    for (let i = 0; i <= st.idx; i++) {
      const el = document.getElementById(`bb-step-${suffix}-${i}`);
      if (el) _triggerReelSpin(el);
    }
  } catch (e) { /* reel trigger fail */ }
  try { _bbUpdateSidebar(screenKey); } catch (e) { /* sidebar fail */ }
}

function _bbUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('bb-sidebar-inner');
  if (!sideEl) return;
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  if (!epRecord || !epRecord.challengeData) return;
  const phase = screenKey.replace('bb-', '').replace(/\d+$/, '').replace(/-$/, '') || 'title';
  sideEl.innerHTML = _buildSidebarContent(epRecord, phase);
}

// ── CSS ICON HELPER ──
function _icon(type) {
  const map = {
    eye: `<div class="bb-i-eye"></div>`,
    blind: `<div class="bb-i-blind"></div>`,
    ring: `<div class="bb-i-ring"></div>`,
    shark: `<div class="bb-i-shark"></div>`,
    rope: `<div class="bb-i-rope"></div>`,
    stamp: `<div class="bb-i-stamp"></div>`,
    falls: `<div class="bb-i-falls"></div>`,
    heart: `<div class="bb-i-heart"></div>`,
    crown: `<div class="bb-i-crown"></div>`,
    spade: `<div class="bb-i-spade"></div>`,
  };
  return map[type] || '';
}

// ── SIDEBAR ──
function _buildSidebar(ep, phase) {
  return `<div class="bb-sidebar"><div id="bb-sidebar-inner">${_buildSidebarContent(ep, phase)}</div></div>`;
}

function _buildSidebarContent(ep, phase) {
  const data = ep.challengeData;
  if (!data) return '';

  const phaseLabels = {
    title: 'BRIDAL BRAWLS', slot: 'SLOT MACHINE', obstacle: 'BLINDFOLD RUN',
    phase1results: 'PHASE 1 RESULTS', tightrope: 'THE BIG DROP',
    phase2results: 'PHASE 2 RESULTS', customs: 'CUSTOMS GATE', results: 'FINAL RESULTS',
  };

  const phaseOrder = ['title', 'slot', 'obstacle', 'phase1results', 'tightrope', 'phase2results', 'customs', 'results'];
  const currentIdx = phaseOrder.indexOf(phase);

  let sb = `<div class="bb-sb-title">${phaseLabels[phase] || 'BRIDAL BRAWLS'}</div>`;

  // Journey map
  const phases = [
    { key: 'slot', label: 'Slot Machine', icon: _icon('spade') },
    { key: 'obstacle', label: 'Blindfold Run', icon: _icon('blind') },
    { key: 'tightrope', label: 'The Big Drop', icon: _icon('falls') },
    { key: 'customs', label: 'Customs Gate', icon: _icon('stamp') },
  ];

  sb += `<div class="bb-sb-journey">`;
  phases.forEach((p) => {
    const pIdx = phaseOrder.indexOf(p.key);
    const cls = pIdx < currentIdx ? 'done' : pIdx === currentIdx ? 'active' : '';
    sb += `<div class="bb-sb-journey-step">
      <div class="bb-sb-journey-dot ${cls}">${p.icon}</div>
      <div class="bb-sb-journey-info ${cls}">${p.label}</div>
    </div>`;
  });
  sb += `</div>`;

  // ── LIVE OBSTACLE SCORES (progressive from stepMeta) ──
  if (phase === 'obstacle' && window._bbObstacleStepMeta) {
    const meta = window._bbObstacleStepMeta;
    const revealIdx = _tvState['bb-obstacle']?.idx ?? -1;
    const pairScores = {};
    const pairObsCounts = {};
    const pairLastOutcome = {};
    let currentObstacle = '';
    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (!m) continue;
      if (m.type === 'divider') { currentObstacle = m.obstacle; continue; }
      if (m.type === 'obstacle') {
        const key = m.guide;
        if (!pairScores[key]) { pairScores[key] = { guide: m.guide, blind: m.blind, score: 0, time: 0, cleared: 0, failed: 0, obsCount: 0 }; }
        pairScores[key].score += m.score;
        pairScores[key].time += m.time;
        pairScores[key].obsCount++;
        if (m.outcome === 'spectacular' || m.outcome === 'success') pairScores[key].cleared++;
        else pairScores[key].failed++;
        pairLastOutcome[key] = m.outcome;
      }
    }

    const sorted = Object.values(pairScores).sort((a, b) => b.score - a.score);
    if (sorted.length > 0) {
      sb += `<div class="bb-sb-title" style="margin-top:8px;">OBSTACLE COURSE — LIVE</div>`;
      const maxScore = Math.max(...sorted.map(p => Math.abs(p.score)), 1);
      sorted.forEach((ps, ri) => {
        const lastCls = pairLastOutcome[ps.guide] === 'spectacular' ? 'color:#5ab870' : pairLastOutcome[ps.guide] === 'success' ? 'color:var(--bb-champagne)' : 'color:var(--bb-stamp)';
        const lastLabel = pairLastOutcome[ps.guide] === 'spectacular' ? 'SPECTACULAR' : pairLastOutcome[ps.guide] === 'success' ? 'CLEARED' : pairLastOutcome[ps.guide] === 'critical-fail' ? 'DISASTER' : 'FAILED';
        sb += `<div class="bb-sb-pair">
          <div class="bb-sb-pair-header">
            <div class="bb-sb-pair-avatars">
              <div class="bb-sb-av">${portrait(ps.guide, 22)}</div>
              <div class="bb-sb-av">${portrait(ps.blind, 22)}</div>
            </div>
            <div class="bb-sb-pair-names">${ps.guide} & ${ps.blind}</div>
            <div class="bb-sb-pair-rank">#${ri + 1}</div>
          </div>
          <div class="bb-sb-label">${ps.obsCount}/${OBSTACLE_COUNT} obstacles · ${ps.cleared} cleared · ${ps.failed} failed</div>
          <div class="bb-sb-bar"><div class="bb-sb-fill blush" style="width:${Math.max(5, ((ps.score + 5) / (maxScore + 5)) * 100)}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;">
            <span class="bb-sb-label">Score: ${ps.score.toFixed(1)}</span>
            <span class="bb-sb-label">Time: ${ps.time.toFixed(1)}s</span>
          </div>
          <div class="bb-sb-label" style="${lastCls};margin-top:2px;">Last: ${lastLabel}</div>
        </div>`;
      });
    }
  }

  // ── LIVE TIGHTROPE SCORES (progressive from stepMeta) ──
  if (phase === 'tightrope' && window._bbTightropeStepMeta) {
    const meta = window._bbTightropeStepMeta;
    const revealIdx = _tvState['bb-tightrope']?.idx ?? -1;
    const pairStats = {};
    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (!m) continue;
      if (m.type === 'segment') {
        const key = m.guide;
        if (!pairStats[key]) { pairStats[key] = { guide: m.guide, blind: m.blind, clean: 0, wobble: 0, nearFall: 0, fall: 0, sharks: 0, sharkDodged: 0, totalBalance: 0, segs: 0, lastOutcome: '' }; }
        const ps = pairStats[key];
        ps.segs++;
        ps.totalBalance += m.balance;
        ps.lastOutcome = m.outcome;
        if (m.outcome === 'clean') ps.clean++;
        else if (m.outcome === 'wobble') ps.wobble++;
        else if (m.outcome === 'near-fall') ps.nearFall++;
        else if (m.outcome === 'fall') ps.fall++;
        if (m.shark) { ps.sharks++; if (m.sharkDodged) ps.sharkDodged++; }
      } else if (m.type === 'event' && m.eventType === 'shark') {
        // shark card — already counted via segment meta
      }
    }

    const sorted = Object.values(pairStats).sort((a, b) => (b.totalBalance / (b.segs || 1)) - (a.totalBalance / (a.segs || 1)));
    if (sorted.length > 0) {
      sb += `<div class="bb-sb-title" style="margin-top:8px;">TIGHTROPE — LIVE</div>`;
      sorted.forEach((ps, ri) => {
        const avgBal = ps.segs > 0 ? (ps.totalBalance / ps.segs) : 0;
        const lastCls = ps.lastOutcome === 'clean' ? 'color:#5ab870' : ps.lastOutcome === 'wobble' ? 'color:var(--bb-champagne)' : ps.lastOutcome === 'near-fall' ? 'color:var(--bb-hotpink)' : 'color:var(--bb-stamp)';
        const lastLabel = ps.lastOutcome === 'clean' ? 'CLEAN' : ps.lastOutcome === 'wobble' ? 'WOBBLE' : ps.lastOutcome === 'near-fall' ? 'NEAR FALL' : 'FALL';
        sb += `<div class="bb-sb-pair">
          <div class="bb-sb-pair-header">
            <div class="bb-sb-pair-avatars">
              <div class="bb-sb-av">${portrait(ps.guide, 22)}</div>
              <div class="bb-sb-av">${portrait(ps.blind, 22)}</div>
            </div>
            <div class="bb-sb-pair-names">${ps.guide} & ${ps.blind}</div>
            <div class="bb-sb-pair-rank">#${ri + 1}</div>
          </div>
          <div class="bb-sb-label">${ps.segs} segs · ${ps.clean} clean · ${ps.wobble} wobble · ${ps.nearFall} near-fall · ${ps.fall} fall</div>
          <div class="bb-sb-bar"><div class="bb-sb-fill blue" style="width:${Math.max(5, ((avgBal + 3) / 6) * 100)}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;">
            <span class="bb-sb-label">Avg Balance: ${avgBal.toFixed(2)}</span>
            <span class="bb-sb-label">${ps.sharks > 0 ? `Sharks: ${ps.sharks} (dodged ${ps.sharkDodged})` : 'No sharks'}</span>
          </div>
          <div class="bb-sb-label" style="${lastCls};margin-top:2px;">Last: ${lastLabel}</div>
        </div>`;
      });
    }
  }

  // ── LIVE CUSTOMS SCORES (progressive from stepMeta) ──
  if (phase === 'customs' && window._bbCustomsStepMeta) {
    const meta = window._bbCustomsStepMeta;
    const revealIdx = _tvState['bb-customs']?.idx ?? -1;
    const pairStats = {};
    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (!m) continue;
      if (m.type === 'answer') {
        const key = m.guide;
        if (!pairStats[key]) { pairStats[key] = { guide: m.guide, blind: m.blind, correct: 0, wrong: 0, total: 0, results: [] }; }
        pairStats[key].total++;
        pairStats[key].results[m.qNum] = m.correct;
        if (m.correct) pairStats[key].correct++;
        else pairStats[key].wrong++;
      } else if (m.type === 'verdict') {
        const key = m.guide;
        if (!pairStats[key]) { pairStats[key] = { guide: m.guide, blind: m.blind, correct: m.correct, wrong: TRIVIA_QUESTIONS - m.correct, total: TRIVIA_QUESTIONS, results: [] }; }
        pairStats[key].verdict = m.passed ? 'APPROVED' : 'DENIED';
      }
    }

    const sorted = Object.values(pairStats).sort((a, b) => b.correct - a.correct || a.wrong - b.wrong);
    if (sorted.length > 0) {
      sb += `<div class="bb-sb-title" style="margin-top:8px;">CUSTOMS GATE — LIVE</div>`;
      sorted.forEach((ps, ri) => {
        const pct = ps.total > 0 ? (ps.correct / ps.total) * 100 : 0;
        const needToPass = Math.max(0, CUSTOMS_PASS_THRESHOLD - ps.correct);
        const remaining = TRIVIA_QUESTIONS - ps.total;
        const canPass = ps.correct + remaining >= CUSTOMS_PASS_THRESHOLD;
        const statusCls = ps.verdict === 'APPROVED' ? 'color:#5ab870' : ps.verdict === 'DENIED' ? 'color:var(--bb-stamp)' : canPass ? 'color:var(--bb-champagne)' : 'color:var(--bb-stamp)';
        const statusLabel = ps.verdict ? ps.verdict : remaining > 0 ? (canPass ? `Need ${needToPass} more` : 'ELIMINATED') : (ps.correct >= CUSTOMS_PASS_THRESHOLD ? 'PENDING...' : 'PENDING...');

        // Tally dots (in question order)
        let tally = '<div style="display:flex;gap:3px;margin:3px 0;">';
        for (let i = 0; i < TRIVIA_QUESTIONS; i++) {
          if (ps.results[i] !== undefined) {
            const isCorrect = ps.results[i];
            tally += `<div style="width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;${isCorrect ? 'background:rgba(58,136,80,.3);color:#5ab870;border:1px solid rgba(58,136,80,.4);' : 'background:rgba(192,32,32,.2);color:var(--bb-stamp);border:1px solid rgba(192,32,32,.3);'}">${isCorrect ? '✓' : '✗'}</div>`;
          } else {
            tally += `<div style="width:14px;height:14px;border-radius:50%;background:rgba(216,200,160,.1);border:1px solid rgba(216,200,160,.15);"></div>`;
          }
        }
        tally += '</div>';

        sb += `<div class="bb-sb-pair${ps.verdict === 'APPROVED' ? ' leading' : ''}">
          <div class="bb-sb-pair-header">
            <div class="bb-sb-pair-avatars">
              <div class="bb-sb-av">${portrait(ps.guide, 22)}</div>
              <div class="bb-sb-av">${portrait(ps.blind, 22)}</div>
            </div>
            <div class="bb-sb-pair-names">${ps.guide} & ${ps.blind}</div>
            <div class="bb-sb-pair-rank">#${ri + 1}</div>
          </div>
          ${tally}
          <div class="bb-sb-label">${ps.correct}/${ps.total} correct${ps.total < TRIVIA_QUESTIONS ? ` · ${remaining} remaining` : ''}</div>
          <div class="bb-sb-bar"><div class="bb-sb-fill ${pct >= 60 ? 'green' : 'blush'}" style="width:${Math.max(5, pct)}%"></div></div>
          <div class="bb-sb-label" style="${statusCls};margin-top:2px;font-weight:700;">${statusLabel}</div>
        </div>`;
      });
    }
  }

  // ── PAIR RANKINGS (for non-obstacle/tightrope/customs phases) ──
  if (phase !== 'obstacle' && phase !== 'tightrope' && phase !== 'customs' && data.pairs && data.pairs.length > 0) {
    const sortedPairs = [...data.pairScores].sort((a, b) => b.totalScore - a.totalScore);
    const isEarly = ['title', 'slot'].includes(phase);

    sb += `<div class="bb-sb-title" style="margin-top:8px;">PAIR RANKINGS</div>`;
    sortedPairs.forEach((ps, ri) => {
      const isWinner = data.immunityWinners.includes(ps.guide);
      const trustLevel = getBond(ps.guide, ps.blind);
      const trustCls = trustLevel > 3 ? 'high' : trustLevel > 0 ? 'mid' : trustLevel > -3 ? 'low' : 'cracked';

      sb += `<div class="bb-sb-pair${isWinner && phase === 'results' ? ' leading' : ''}">
        <div class="bb-sb-pair-header">
          <div class="bb-sb-pair-avatars">
            <div class="bb-sb-av">${portrait(ps.guide, 22)}</div>
            <div class="bb-sb-av">${portrait(ps.blind, 22)}</div>
          </div>
          <div class="bb-sb-pair-names">${ps.guide} & ${ps.blind}</div>
          <div class="bb-sb-pair-rank">#${ri + 1}</div>
        </div>`;

      sb += `<div class="bb-sb-trust">
        <div class="bb-sb-trust-rings ${trustCls}">
          <div class="bb-sb-ring${trustCls === 'cracked' ? ' cracked' : trustCls === 'high' ? ' glow' : ''}"></div>
          <div class="bb-sb-ring${trustCls === 'cracked' ? ' cracked' : trustCls === 'high' ? ' glow' : ''}"></div>
        </div>
        <span class="bb-sb-trust-label">${trustCls.toUpperCase()}</span>
      </div>`;

      if (!isEarly) {
        const maxScore = Math.max(...sortedPairs.map(p => Math.abs(p.totalScore)), 1);
        if (currentIdx >= phaseOrder.indexOf('phase1results')) {
          sb += `<div class="bb-sb-label">Phase 1</div><div class="bb-sb-bar"><div class="bb-sb-fill blush" style="width:${Math.max(0, (ps.phase1Score / maxScore) * 100)}%"></div></div>`;
        }
        if (currentIdx >= phaseOrder.indexOf('phase2results')) {
          sb += `<div class="bb-sb-label">Phase 2</div><div class="bb-sb-bar"><div class="bb-sb-fill blue" style="width:${Math.max(0, (ps.phase2Score / maxScore) * 100)}%"></div></div>`;
        }
        if (currentIdx >= phaseOrder.indexOf('customs') || phase === 'results') {
          sb += `<div class="bb-sb-label">Phase 3</div><div class="bb-sb-bar"><div class="bb-sb-fill green" style="width:${Math.max(0, (ps.phase3Score / maxScore) * 100)}%"></div></div>`;
        }
        sb += `<div class="bb-sb-label">Total: ${ps.totalScore.toFixed(1)}</div>`;
      }

      sb += `</div>`;
    });
  }

  // Shark counter (phase 2+)
  if (currentIdx >= phaseOrder.indexOf('tightrope')) {
    const totalSharks = data.phase2?.segments?.filter(s => s.sharkEncounter).length || 0;
    sb += `<div class="bb-sb-title" style="margin-top:8px;">SHARK ENCOUNTERS</div>`;
    sb += `<div class="bb-sb-sharks">`;
    for (let i = 0; i < Math.max(totalSharks, 5); i++) {
      sb += `<div class="bb-sb-shark-fin ${i < totalSharks ? 'hit' : 'empty'}"></div>`;
    }
    sb += `</div>`;
  }

  // Drama feed
  if (data.socialEvents && data.socialEvents.length > 0 && currentIdx >= phaseOrder.indexOf('phase1results')) {
    sb += `<div class="bb-sb-drama"><div class="bb-sb-title">DRAMA FEED</div>`;
    data.socialEvents.forEach(evt => {
      const dotColor = evt.type === 'blame' ? 'var(--bb-stamp)' : evt.type === 'respect' ? 'var(--bb-gold)' : evt.type === 'rescue' ? '#3a8850' : 'var(--bb-hotpink)';
      sb += `<div class="bb-sb-drama-item"><div class="bb-sb-drama-dot" style="background:${dotColor}"></div><span>${evt.players.join(' & ')}: ${evt.type}</span></div>`;
    });
    sb += `</div>`;
  }

  return sb;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, phaseCls = '', sidebarPhase = 'title') {
  const sidebar = _buildSidebar(ep, sidebarPhase);

  // Generate hearts particles (15 like mockup)
  let hearts = '';
  for (let i = 0; i < 15; i++) {
    const sz = 10 + Math.floor(Math.random() * 14);
    const left = Math.floor(Math.random() * 100);
    const dur = 10 + Math.floor(Math.random() * 20);
    const delay = Math.floor(Math.random() * 15);
    hearts += `<div class="bb-heart-p" style="left:${left}%;--sz:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
  }

  // Suit particles (12 like mockup)
  let suits = '';
  const suitTypes = ['bb-suit-spade', 'bb-suit-diamond', 'bb-suit-club'];
  for (let i = 0; i < 12; i++) {
    const cls = suitTypes[Math.floor(Math.random() * 3)];
    const left = Math.floor(Math.random() * 100);
    const dur = 15 + Math.floor(Math.random() * 25);
    const delay = Math.floor(Math.random() * 20);
    suits += `<div class="bb-suit-p" style="left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s;"><div class="${cls}"></div></div>`;
  }

  // Bubbles (20 like mockup)
  let bubbles = '';
  for (let i = 0; i < 20; i++) {
    const sz = 3 + Math.floor(Math.random() * 8);
    const left = Math.floor(Math.random() * 100);
    const dur = 8 + Math.floor(Math.random() * 15);
    const delay = Math.floor(Math.random() * 12);
    bubbles += `<div class="bb-bubble" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
  }

  // Dust motes for phase 1 (30 like mockup)
  let dust = '';
  if (phaseCls.includes('phase1')) {
    for (let i = 0; i < 30; i++) {
      const left = Math.floor(Math.random() * 100);
      const top = Math.floor(Math.random() * 100);
      const dur = 6 + Math.floor(Math.random() * 12);
      const dx = -100 + Math.floor(Math.random() * 200);
      const dy = -(100 + Math.floor(Math.random() * 300));
      const w = 1 + Math.floor(Math.random() * 3);
      dust += `<div class="bb-dust" style="left:${left}%;top:${top}%;animation-duration:${dur}s;animation-delay:${(Math.random() * 8).toFixed(1)}s;--dx:${dx}px;--dy:${dy}px;width:${w}px;height:${w}px;"></div>`;
    }
  }

  // Rain drops for phase 2 (30 like mockup)
  let rain = '';
  if (phaseCls.includes('phase2')) {
    for (let i = 0; i < 30; i++) {
      const left = Math.floor(Math.random() * 100);
      const h = 20 + Math.floor(Math.random() * 40);
      const dur = 1 + Math.random() * 2;
      const delay = Math.random() * 3;
      rain += `<div class="bb-raindrop" style="left:${left}%;height:${h}px;animation-duration:${dur}s;animation-delay:${delay.toFixed(1)}s;"></div>`;
    }
  }

  return `
<div class="bb-shell ${phaseCls}" data-phase="${sidebarPhase}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;600;700&family=Permanent+Marker&family=Press+Start+2P&display=swap');

.bb-shell{--bb-casino:#110818;--bb-casino2:#1a0c28;--bb-velvet:#2a1040;--bb-felt:#1a3828;--bb-felt-lt:#2a5040;--bb-felt-dk:#0e2418;--bb-gold:#d4a830;--bb-gold-lt:#f0cc50;--bb-gold-dk:#a07818;--bb-champagne:#e8d8b0;--bb-cream:#f0e8d8;--bb-blush:#e8a0a8;--bb-hotpink:#e83070;--bb-rose:#c84868;--bb-white:#f0eee8;--bb-lace:#e8e0d4;--bb-mist:#8ab8d0;--bb-spray:#a8d0e0;--bb-water:#2848a0;--bb-deep:#0c1828;--bb-falls:#183860;--bb-shark:#4a6878;--bb-stamp:#c02020;--bb-manila:#d8c8a0;--bb-fluor:#e8e8d8;--bb-ink:#1a1a18;--bb-trust-high:#d4a830;--bb-trust-mid:#a08848;--bb-trust-low:#6a4a3a;--bb-trust-crack:#c04040;--bb-chrome:#c0c0c8;--bb-chrome-dk:#888890;--bb-chrome-lt:#e0e0e8;--bb-neon-pink:#ff2080;--bb-neon-gold:#ffd700;--bb-reel-bg:#0a0a12;max-width:1100px;margin:0 auto;font-family:'Cormorant Garamond',Georgia,serif;color:var(--bb-cream);position:relative;display:grid;grid-template-columns:1fr 260px;gap:16px;}
.bb-shell *{box-sizing:border-box;}

/* Broadcast chrome */
.bb-broadcast{display:flex;align-items:center;padding:4px 12px;background:linear-gradient(90deg,#0a0a12,#1a0c28,#0a0a12);border-bottom:1px solid rgba(212,168,48,.2);border-radius:6px 6px 0 0;font-family:'Outfit',sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;gap:8px;grid-column:1/3;}
.bb-live-dot{width:7px;height:7px;border-radius:50%;background:#e02020;animation:bb-blink 1.2s ease-in-out infinite;box-shadow:0 0 4px #e02020;}
@keyframes bb-blink{0%,100%{opacity:1}50%{opacity:.3}}
.bb-live-label{color:#e02020;font-weight:700;letter-spacing:2px;}
.bb-channel{color:var(--bb-gold);letter-spacing:2px;}
.bb-ticker-wrap{flex:1;overflow:hidden;height:14px;position:relative;}
.bb-ticker{white-space:nowrap;color:var(--bb-champagne);opacity:.5;animation:bb-ticker-scroll 40s linear infinite;position:absolute;}
@keyframes bb-ticker-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-200%)}}

/* Step visibility */
.bb-step{opacity:0;max-height:0;overflow:hidden;transition:none;}
.bb-step.bb-visible{opacity:1;max-height:4000px;overflow:visible;}
.bb-step:not(.bb-visible) .bb-stamp-overlay,.bb-step:not(.bb-visible) .bb-splat,.bb-step:not(.bb-visible) .bb-drip,.bb-step:not(.bb-visible) .bb-verdict-shark-drop{animation-play-state:paused!important;}
.bb-step.bb-visible .bb-stamp-overlay,.bb-step.bb-visible .bb-splat,.bb-step.bb-visible .bb-drip,.bb-step.bb-visible .bb-verdict-shark-drop{animation-play-state:running;}

/* Phase backgrounds */
.bb-phase1-bg{position:relative;}
.bb-phase1-bg::before{content:'';position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 30%,rgba(232,160,168,.03),transparent 60%);}
.bb-phase2-bg{position:relative;}
.bb-phase2-bg::before{content:'';position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 80%,rgba(40,72,160,.04),transparent 60%);}
.bb-phase3-bg{position:relative;}
.bb-phase3-bg::before{content:'';position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;background:linear-gradient(180deg,rgba(232,232,216,.02),transparent 30%);}

/* Particles */
.bb-hearts{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.bb-heart-p{position:absolute;opacity:0;animation:bb-float-heart linear infinite;}
.bb-heart-p::before{content:'';display:block;width:var(--sz,14px);height:var(--sz,14px);background:var(--bb-hotpink);clip-path:path('M8 13 Q0 7 0 4 Q0 0 4 0 Q6 0 8 3 Q10 0 12 0 Q16 0 16 4 Q16 7 8 13');transform:scale(calc(var(--sz,14) / 16));}
@keyframes bb-float-heart{0%{transform:translateY(110vh) rotate(0deg) scale(.5);opacity:0}10%{opacity:.15}50%{opacity:.08}90%{opacity:.05}100%{transform:translateY(-10vh) rotate(360deg) scale(1.2);opacity:0}}
.bb-suits{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.bb-suit-p{position:absolute;opacity:0;animation:bb-suit-drift linear infinite;}
@keyframes bb-suit-drift{0%{transform:translateY(105vh) rotate(0deg);opacity:0}8%{opacity:.08}50%{opacity:.04}100%{transform:translateY(-5vh) rotate(720deg);opacity:0}}
.bb-suit-spade{width:12px;height:14px;position:relative;}
.bb-suit-spade::before{content:'';position:absolute;top:0;left:0;width:12px;height:12px;background:var(--bb-cream);clip-path:polygon(50% 0%,100% 40%,80% 100%,50% 75%,20% 100%,0% 40%);}
.bb-suit-spade::after{content:'';position:absolute;bottom:0;left:4px;width:4px;height:5px;background:var(--bb-cream);}
.bb-suit-diamond{width:10px;height:14px;background:var(--bb-hotpink);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);}
.bb-suit-club{width:12px;height:14px;position:relative;}
.bb-suit-club::before{content:'';position:absolute;top:0;left:1px;width:10px;height:10px;background:var(--bb-cream);border-radius:50%;box-shadow:-3px 3px 0 var(--bb-cream),3px 3px 0 var(--bb-cream);}
.bb-suit-club::after{content:'';position:absolute;bottom:0;left:4px;width:4px;height:5px;background:var(--bb-cream);}
.bb-bubbles{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.bb-bubble{position:absolute;border-radius:50%;border:1px solid rgba(240,204,80,.12);animation:bb-bubble-rise linear infinite;}
@keyframes bb-bubble-rise{0%{transform:translateY(100vh) scale(.3);opacity:0}10%{opacity:.2}60%{opacity:.1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
.bb-dust-motes{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.bb-dust{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(232,208,160,.25);animation:bb-dust-float linear infinite;}
@keyframes bb-dust-float{0%{transform:translate(0,0) scale(.5);opacity:0}20%{opacity:.3}50%{opacity:.15}100%{transform:translate(var(--dx),var(--dy)) scale(1.2);opacity:0}}
.bb-rain-drops{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.bb-raindrop{position:absolute;width:1px;background:linear-gradient(180deg,transparent,rgba(138,184,208,.25),transparent);animation:bb-rain-fall linear infinite;}
@keyframes bb-rain-fall{0%{transform:translateY(-20px);opacity:0}10%{opacity:.4}90%{opacity:.2}100%{transform:translateY(110vh);opacity:0}}

/* ── COLD OPEN ── */
.bb-cold-open{position:relative;min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:32px 0;grid-column:1/3;}
.bb-casino-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(42,16,64,.4),transparent 70%),linear-gradient(180deg,var(--bb-casino) 0%,var(--bb-casino2) 30%,var(--bb-velvet) 60%,var(--bb-casino) 100%);}
.bb-waterfall-bg{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden;opacity:.15;}
.bb-spotlights{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;}
.bb-spot{position:absolute;top:-20%;width:200px;height:120vh;background:linear-gradient(180deg,rgba(232,160,168,.08),transparent 80%);transform-origin:top center;animation:bb-spot-sweep 8s ease-in-out infinite alternate;}
.bb-spot:nth-child(1){left:15%;animation-delay:0s;transform:rotate(-15deg);}
.bb-spot:nth-child(2){left:45%;animation-delay:2s;transform:rotate(5deg);background:linear-gradient(180deg,rgba(212,168,48,.06),transparent 80%);}
.bb-spot:nth-child(3){left:75%;animation-delay:4s;transform:rotate(10deg);}
@keyframes bb-spot-sweep{0%{transform:rotate(-15deg)}100%{transform:rotate(15deg)}}
.bb-title-wrap{position:relative;z-index:10;text-align:center;padding:0 20px;}
.bb-title-series{font-family:'Outfit',sans-serif;font-size:clamp(9px,1.2vw,12px);color:var(--bb-blush);letter-spacing:5px;text-transform:uppercase;}
.bb-title-main{font-family:'Playfair Display',serif;font-weight:900;font-style:italic;font-size:clamp(40px,7vw,80px);color:var(--bb-gold);letter-spacing:clamp(2px,.4vw,6px);line-height:.95;text-shadow:0 4px 20px rgba(0,0,0,.7),0 0 40px rgba(212,168,48,.15);}
.bb-title-tagline{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(13px,2vw,19px);color:var(--bb-champagne);letter-spacing:2px;margin-top:6px;}
.bb-rings-deco{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0;}
.bb-ring-line{width:clamp(40px,8vw,100px);height:1px;background:linear-gradient(90deg,transparent,var(--bb-gold),transparent);}
.bb-rings-svg{animation:bb-ring-pulse 3s ease-in-out infinite;}
@keyframes bb-ring-pulse{0%,100%{filter:drop-shadow(0 0 4px rgba(212,168,48,.3))}50%{filter:drop-shadow(0 0 12px rgba(212,168,48,.6))}}
.bb-phase-pills{display:flex;gap:0;justify-content:center;margin-top:16px;}
.bb-pill{padding:6px 14px;font-family:'Outfit',sans-serif;font-size:clamp(7px,.9vw,9px);letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(212,168,48,.15);color:var(--bb-champagne);background:rgba(17,8,24,.6);}.bb-pill:first-child{border-radius:4px 0 0 4px;}.bb-pill:last-child{border-radius:0 4px 4px 0;}.bb-pill.active{background:rgba(212,168,48,.12);border-color:var(--bb-gold);color:var(--bb-gold);}
.bb-pill-num{font-family:'Playfair Display',serif;font-weight:700;margin-right:4px;font-size:11px;color:var(--bb-gold);}
/* Passport toss pile — passports fly in 1 by 1, land scattered at random angles */
.bb-passport-pile{position:relative;width:clamp(450px,85vw,850px);height:clamp(320px,45vw,520px);margin:24px auto;z-index:10;display:flex;align-items:center;justify-content:center;}
.bb-toss-passport{position:absolute;left:50%;top:50%;opacity:0;animation:bb-passport-toss var(--toss-dur,.9s) cubic-bezier(.2,.9,.3,1.1) var(--toss-delay,0s) forwards;transform-origin:center center;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5));}
@keyframes bb-passport-toss{0%{opacity:0;transform:translate(var(--toss-from-x,0),var(--toss-from-y,-300px)) rotate(var(--toss-from-r,0deg)) scale(.4)}40%{opacity:1;}70%{transform:translate(var(--toss-to-x,0),var(--toss-to-y,0)) rotate(calc(var(--toss-to-r,0deg) + 5deg)) scale(1.05)}85%{transform:translate(var(--toss-to-x,0),var(--toss-to-y,0)) rotate(calc(var(--toss-to-r,0deg) - 2deg)) scale(.98)}100%{opacity:1;transform:translate(var(--toss-to-x,0),var(--toss-to-y,0)) rotate(var(--toss-to-r,0deg)) scale(1)}}
.bb-toss-passport.landed{animation:bb-passport-idle 4s ease-in-out var(--idle-delay,0s) infinite alternate;}
@keyframes bb-passport-idle{0%{transform:translate(var(--toss-to-x,0),var(--toss-to-y,0)) rotate(var(--toss-to-r,0deg)) scale(1)}100%{transform:translate(var(--toss-to-x,0),calc(var(--toss-to-y,0) - 2px)) rotate(calc(var(--toss-to-r,0deg) + 1deg)) scale(1.01)}}
/* Host announce with typewriter */
.bb-host-announce{position:relative;z-index:10;margin:16px 0;padding:12px 24px;background:linear-gradient(135deg,rgba(42,16,64,.6),rgba(17,8,24,.8));border:2px solid var(--bb-gold);border-radius:8px;box-shadow:0 0 20px rgba(212,168,48,.1);overflow:hidden;}
.bb-host-announce::before{content:'';position:absolute;inset:-2px;border-radius:10px;background:linear-gradient(45deg,var(--bb-gold),var(--bb-hotpink),var(--bb-gold));z-index:-1;opacity:.3;}
.bb-host-label{font-family:'Outfit',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--bb-hotpink);margin-bottom:3px;}
.bb-host-text{font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(14px,2.5vw,22px);color:var(--bb-gold);}
/* Scroll prompt */
.bb-scroll{text-align:center;margin-top:20px;font-family:'Outfit',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--bb-champagne);opacity:.4;animation:bb-bounce 2s ease-in-out infinite;position:relative;z-index:10;}
@keyframes bb-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}

/* ── CARDS ── */
.bb-card{position:relative;padding:14px 16px;margin:10px 0;border-radius:8px;border:1px solid rgba(212,168,48,.08);overflow:hidden;animation:bb-card-in .6s cubic-bezier(.16,1,.3,1) both;}
@keyframes bb-card-in{from{opacity:0;transform:translateY(20px) rotate(-1deg);filter:blur(2px)}to{opacity:1;transform:none;filter:none}}
.bb-card.phase1{background:linear-gradient(135deg,rgba(232,160,168,.05),rgba(42,16,64,.3));border-left:3px solid var(--bb-blush);}
.bb-card.phase2{background:linear-gradient(135deg,rgba(40,72,160,.05),rgba(12,24,40,.4));border-left:3px solid var(--bb-mist);}
.bb-card.phase3{background:linear-gradient(135deg,rgba(216,200,160,.06),rgba(26,26,24,.4));border-left:3px solid var(--bb-manila);}
.bb-card.trust{border-left-color:var(--bb-gold);background:linear-gradient(135deg,rgba(212,168,48,.06),rgba(42,16,64,.2));}
.bb-card.sabotage{border-left-color:var(--bb-stamp);background:linear-gradient(135deg,rgba(192,32,32,.06),rgba(42,16,64,.2));animation:bb-card-in .6s cubic-bezier(.16,1,.3,1) both,bb-shake .4s ease-out .6s;}
@keyframes bb-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
.bb-card.social{border-left:3px dashed var(--bb-blush);background:linear-gradient(135deg,rgba(232,48,112,.04),rgba(42,16,64,.15));}
.bb-card.fall{border-left-color:var(--bb-water);background:linear-gradient(135deg,rgba(40,72,160,.08),rgba(12,24,40,.4));animation:bb-card-in .6s cubic-bezier(.16,1,.3,1) both,bb-fall-shake .6s ease-out .6s;}
@keyframes bb-fall-shake{0%{transform:translateY(0)}20%{transform:translateY(6px)}40%{transform:translateY(-4px)}60%{transform:translateY(3px)}80%{transform:translateY(-1px)}100%{transform:translateY(0)}}
.bb-card.stamp-pass{border:2px solid #3a8850;background:linear-gradient(135deg,rgba(58,136,80,.08),rgba(26,26,24,.3));animation:bb-card-in .6s cubic-bezier(.16,1,.3,1) both,bb-paper-shuffle .4s ease-out;}
.bb-card.stamp-fail{border:2px solid var(--bb-stamp);background:linear-gradient(135deg,rgba(192,32,32,.08),rgba(26,26,24,.3));animation:bb-card-in .6s cubic-bezier(.16,1,.3,1) both,bb-paper-shuffle .4s ease-out;}
@keyframes bb-paper-shuffle{0%{transform:translateX(20px) rotate(2deg);opacity:.5}50%{transform:translateX(-3px) rotate(-0.5deg);opacity:.9}100%{transform:translateX(0) rotate(0);opacity:1}}
.bb-card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.bb-card-av{width:30px;height:30px;border-radius:50%;border:2px solid var(--bb-gold-dk);background:var(--bb-velvet);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.bb-card-av img{width:100%;height:100%;object-fit:cover;}
.bb-card-av.blind{position:relative;overflow:visible;}
.bb-card-av.blind::after{content:'';position:absolute;top:35%;left:-3px;right:-3px;height:8px;background:var(--bb-ink);border-radius:2px;opacity:.7;z-index:2;}
.bb-card-who{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;color:var(--bb-cream);}
.bb-card-tag{font-family:'Outfit',sans-serif;font-size:10px;padding:3px 10px;border-radius:10px;letter-spacing:1px;text-transform:uppercase;font-weight:600;margin-left:auto;white-space:nowrap;}
.bb-tag-obstacle{background:rgba(232,160,168,.1);color:var(--bb-blush);border:1px solid rgba(232,160,168,.2);}
.bb-tag-trust{background:rgba(212,168,48,.1);color:var(--bb-gold);border:1px solid rgba(212,168,48,.2);}
.bb-tag-sabotage{background:rgba(192,32,32,.1);color:var(--bb-stamp);border:1px solid rgba(192,32,32,.2);}
.bb-tag-social{background:rgba(232,48,112,.08);color:var(--bb-hotpink);border:1px solid rgba(232,48,112,.2);}
.bb-tag-fall{background:rgba(40,72,160,.1);color:var(--bb-mist);border:1px solid rgba(40,72,160,.25);}
.bb-tag-shark{background:rgba(74,104,120,.1);color:var(--bb-shark);border:1px solid rgba(74,104,120,.25);}
.bb-tag-balance{background:rgba(138,184,208,.08);color:var(--bb-spray);border:1px solid rgba(138,184,208,.2);}
.bb-tag-trivia{background:rgba(216,200,160,.1);color:var(--bb-manila);border:1px solid rgba(216,200,160,.2);}
.bb-tag-approved{background:rgba(58,136,80,.1);color:#5ab870;border:1px solid rgba(58,136,80,.25);}
.bb-tag-denied{background:rgba(192,32,32,.1);color:var(--bb-stamp);border:1px solid rgba(192,32,32,.25);}
.bb-card-txt{font-size:15px;line-height:1.6;color:rgba(240,232,216,.8);}
.bb-card-score{font-family:'Outfit',sans-serif;font-size:11px;margin-top:6px;opacity:.4;letter-spacing:.5px;}

/* ── CSS ICONS ── */
.bb-i-eye{width:18px;height:12px;position:relative;flex-shrink:0;}.bb-i-eye::before{content:'';position:absolute;top:0;left:0;width:18px;height:12px;border:2px solid var(--bb-champagne);border-radius:50%;}.bb-i-eye::after{content:'';position:absolute;top:3px;left:6px;width:6px;height:6px;background:var(--bb-champagne);border-radius:50%;}
.bb-i-blind{width:20px;height:14px;position:relative;flex-shrink:0;}.bb-i-blind::before{content:'';position:absolute;top:2px;left:0;width:20px;height:10px;border-radius:50%;border:2px solid var(--bb-blush);border-bottom:none;}.bb-i-blind::after{content:'';position:absolute;top:5px;left:2px;right:2px;height:4px;background:var(--bb-ink);border-radius:2px;}
.bb-i-ring{width:16px;height:16px;border-radius:50%;border:2px solid var(--bb-gold);position:relative;flex-shrink:0;box-shadow:0 0 4px rgba(212,168,48,.3);}.bb-i-ring::after{content:'';position:absolute;top:3px;left:3px;width:4px;height:4px;background:var(--bb-gold-lt);border-radius:50%;}
.bb-i-shark{width:18px;height:14px;position:relative;flex-shrink:0;}.bb-i-shark::before{content:'';position:absolute;bottom:0;left:0;right:0;height:6px;background:var(--bb-water);border-radius:0 0 4px 4px;}.bb-i-shark::after{content:'';position:absolute;bottom:4px;left:6px;width:0;height:0;border-style:solid;border-width:0 4px 10px 4px;border-color:transparent transparent var(--bb-shark) transparent;}
.bb-i-rope{width:24px;height:4px;position:relative;flex-shrink:0;background:repeating-linear-gradient(90deg,var(--bb-champagne) 0px,var(--bb-champagne) 3px,transparent 3px,transparent 5px);}
.bb-i-stamp{width:20px;height:16px;position:relative;flex-shrink:0;}.bb-i-stamp::before{content:'';position:absolute;top:0;left:2px;width:16px;height:12px;border:2px solid var(--bb-stamp);border-radius:2px;}.bb-i-stamp::after{content:'';position:absolute;bottom:0;left:6px;width:8px;height:6px;background:var(--bb-stamp);border-radius:0 0 2px 2px;}
.bb-i-falls{width:20px;height:18px;position:relative;flex-shrink:0;}.bb-i-falls::before{content:'';position:absolute;top:0;left:2px;right:2px;height:4px;background:var(--bb-mist);border-radius:2px 2px 0 0;}.bb-i-falls::after{content:'';position:absolute;top:4px;left:4px;width:3px;height:14px;background:linear-gradient(180deg,var(--bb-mist),var(--bb-water));border-radius:0 0 2px 2px;box-shadow:6px 0 0 var(--bb-mist),3px 2px 0 rgba(138,184,208,.3);}
.bb-i-heart{width:16px;height:14px;position:relative;flex-shrink:0;}.bb-i-heart::before{content:'';position:absolute;top:0;left:0;width:16px;height:14px;background:var(--bb-hotpink);clip-path:path('M8 13 Q0 7 0 4 Q0 0 4 0 Q6 0 8 3 Q10 0 12 0 Q16 0 16 4 Q16 7 8 13');filter:drop-shadow(0 0 3px rgba(232,48,112,.4));}
.bb-i-crown{width:24px;height:18px;position:relative;flex-shrink:0;}.bb-i-crown::before{content:'';position:absolute;bottom:0;left:2px;right:2px;height:8px;background:var(--bb-gold);border-radius:0 0 2px 2px;}.bb-i-crown::after{content:'';position:absolute;top:0;left:0;width:24px;height:14px;background:var(--bb-gold);clip-path:polygon(0% 100%,0% 40%,20% 70%,35% 20%,50% 60%,65% 20%,80% 70%,100% 40%,100% 100%);}
.bb-i-spade{width:14px;height:16px;position:relative;flex-shrink:0;}.bb-i-spade::before{content:'';position:absolute;top:0;left:0;width:14px;height:14px;background:var(--bb-cream);clip-path:polygon(50% 0%,100% 45%,80% 100%,50% 78%,20% 100%,0% 45%);}
.bb-i-spade::after{content:'';position:absolute;bottom:0;left:5px;width:4px;height:5px;background:var(--bb-cream);}

/* ── DIVIDER ── */
.bb-divider{position:relative;padding:40px 0;text-align:center;overflow:hidden;}
.bb-divider-line{position:absolute;top:50%;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,var(--bb-gold),transparent);}
.bb-divider-text{position:relative;z-index:1;background:var(--bb-casino);display:inline-block;padding:0 24px;}
.bb-divider-num{font-family:'Playfair Display',serif;font-weight:900;font-size:32px;color:var(--bb-gold);opacity:.25;}
.bb-divider-name{font-family:'Outfit',sans-serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:var(--bb-gold);margin-top:2px;}

/* ── PHASE HEADER ── */
.bb-phase-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:10px 14px;background:linear-gradient(90deg,rgba(212,168,48,.06),transparent);border-left:3px solid var(--bb-gold);border-radius:0 8px 8px 0;}
.bb-phase-num{font-family:'Playfair Display',serif;font-weight:900;font-size:28px;color:var(--bb-gold);opacity:.2;}
.bb-phase-name{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--bb-gold);}
.bb-phase-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--bb-champagne);}

/* ── SLOT MACHINE (Full casino cabinet) ── */
.bb-slot-machine{position:relative;margin:16px 0;background:linear-gradient(180deg,var(--bb-felt-dk),var(--bb-felt),var(--bb-felt-dk));border-radius:20px;box-shadow:0 12px 60px rgba(0,0,0,.7),inset 0 2px 0 rgba(255,255,255,.05);padding:0;overflow:visible;}
.bb-cabinet{position:relative;border:4px solid var(--bb-chrome-dk);border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#2a2a34,#1a1a24 30%,var(--bb-felt-dk) 40%,var(--bb-felt) 50%,var(--bb-felt-dk) 90%,#1a1a24);box-shadow:inset 0 0 40px rgba(0,0,0,.5);}
.bb-cabinet::before{content:'';position:absolute;inset:0;border-radius:16px;border:2px solid rgba(192,192,200,.1);pointer-events:none;z-index:5;}
/* Chasing marquee lights */
.bb-marquee-lights{position:absolute;inset:-6px;border-radius:24px;pointer-events:none;z-index:6;}
.bb-bulb{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--bb-neon-gold);box-shadow:0 0 6px var(--bb-neon-gold),0 0 12px rgba(255,215,0,.3);animation:bb-chase-bulb 2s linear infinite;opacity:.3;}
@keyframes bb-chase-bulb{0%{opacity:.3;background:var(--bb-neon-gold);box-shadow:0 0 4px var(--bb-neon-gold)}20%{opacity:1;background:#fff;box-shadow:0 0 8px var(--bb-neon-gold),0 0 16px rgba(255,215,0,.5)}40%{opacity:.3;background:var(--bb-neon-pink);box-shadow:0 0 4px var(--bb-neon-pink)}60%{opacity:.8;background:#fff;box-shadow:0 0 8px var(--bb-neon-pink),0 0 16px rgba(255,32,128,.4)}80%{opacity:.3}100%{opacity:.3}}
/* JACKPOT sign */
.bb-jackpot-sign{text-align:center;padding:20px 0 8px;position:relative;z-index:4;}
.bb-jackpot-text{font-family:'Press Start 2P',monospace;font-size:clamp(20px,4vw,36px);color:var(--bb-neon-gold);letter-spacing:8px;text-shadow:0 0 10px var(--bb-neon-gold),0 0 30px rgba(255,215,0,.3),0 0 60px rgba(255,215,0,.1);animation:bb-jackpot-idle 3s ease-in-out infinite;margin:0;}
@keyframes bb-jackpot-idle{0%,100%{text-shadow:0 0 10px var(--bb-neon-gold),0 0 30px rgba(255,215,0,.3)}50%{text-shadow:0 0 20px var(--bb-neon-gold),0 0 50px rgba(255,215,0,.5),0 0 80px rgba(255,32,128,.2)}}
.bb-jackpot-sub{font-family:'Outfit',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--bb-champagne);opacity:.5;margin-top:4px;}
/* Slot display window */
.bb-slot-display{margin:8px 24px 24px;padding:24px;background:linear-gradient(135deg,rgba(26,56,40,.8),rgba(14,36,24,.9));border:3px solid var(--bb-chrome-dk);border-radius:12px;box-shadow:inset 0 4px 20px rgba(0,0,0,.6),0 2px 0 rgba(192,192,200,.1);}
/* Reel row */
.bb-reel-row{display:flex;align-items:center;justify-content:center;gap:4px;margin:16px 0;position:relative;}
.bb-reel-set{display:flex;align-items:center;gap:8px;justify-content:center;}
/* Individual reel window — taller for the spinning strip */
.bb-reel{width:80px;height:60px;overflow:hidden;position:relative;background:var(--bb-reel-bg);border:2px solid var(--bb-chrome-dk);border-radius:6px;box-shadow:inset 0 2px 8px rgba(0,0,0,.8),0 1px 0 rgba(192,192,200,.15);}
.bb-reel::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5),transparent 25%,transparent 75%,rgba(0,0,0,.5));z-index:2;pointer-events:none;}
.bb-reel::after{content:'';position:absolute;left:0;right:0;top:calc(50% - 1px);height:2px;background:rgba(255,215,0,.2);z-index:3;pointer-events:none;box-shadow:0 0 6px rgba(255,215,0,.15);}
/* Reel strip — contains many symbols, only one visible through window */
.bb-reel-strip{display:flex;flex-direction:column;align-items:center;position:relative;width:100%;transition:none;}
.bb-reel-sym{width:100%;height:60px;display:flex;align-items:center;justify-content:center;font-family:'Press Start 2P',monospace;font-size:16px;color:var(--bb-neon-gold);text-shadow:0 0 8px rgba(255,215,0,.4);flex-shrink:0;}
.bb-reel-sym.compat{font-size:24px;text-shadow:0 0 12px rgba(232,48,112,.4);}
.bb-reel-sym.final{color:#fff;text-shadow:0 0 12px var(--bb-neon-gold),0 0 24px rgba(255,215,0,.3);}
/* Spinning animation — strip scrolls through all symbols then lands */
.bb-reel-strip.spin-r1{animation:bb-spin-r1 1.8s cubic-bezier(.2,.6,.3,1) forwards;}
.bb-reel-strip.spin-r2{animation:bb-spin-r2 2.2s cubic-bezier(.2,.6,.3,1) forwards;}
.bb-reel-strip.spin-r3{animation:bb-spin-r3 2.8s cubic-bezier(.15,.5,.3,1) forwards;}
/* Each reel scrolls a different number of symbols (8 fake + 1 real = 9 total, strip height = 9*60 = 540px, land at bottom = -480px) */
@keyframes bb-spin-r1{
  0%{transform:translateY(0)}
  10%{transform:translateY(30px)}
  85%{transform:translateY(-490px)}
  93%{transform:translateY(-475px)}
  100%{transform:translateY(-480px)}
}
@keyframes bb-spin-r2{
  0%{transform:translateY(0)}
  8%{transform:translateY(30px)}
  82%{transform:translateY(-490px)}
  92%{transform:translateY(-475px)}
  100%{transform:translateY(-480px)}
}
@keyframes bb-spin-r3{
  0%{transform:translateY(0)}
  6%{transform:translateY(30px)}
  78%{transform:translateY(-490px)}
  90%{transform:translateY(-475px)}
  97%{transform:translateY(-482px)}
  100%{transform:translateY(-480px)}
}
/* Glow pulse on final symbol after landing */
.bb-reel-strip.landed .bb-reel-sym.final{animation:bb-sym-land .4s ease-out forwards;}
@keyframes bb-sym-land{0%{transform:scale(1.3);text-shadow:0 0 30px var(--bb-neon-gold)}50%{transform:scale(.95)}100%{transform:scale(1);text-shadow:0 0 12px var(--bb-neon-gold)}}
/* Spin-in for pair info reveal */
.bb-pair-info-reveal{animation:bb-pair-slide-in .6s cubic-bezier(.16,1,.3,1) forwards;opacity:0;}
@keyframes bb-pair-slide-in{0%{opacity:0;transform:translateY(30px) scale(.9)}100%{opacity:1;transform:none}}
/* Lever per-pull animation classes */
.bb-lever-pulling .bb-lever-svg{animation:bb-lever-pull 1.5s cubic-bezier(.4,0,.2,1) both;}
/* Screen shake on jackpot */
.bb-machine-shake{animation:bb-machine-shake .5s ease-out;}
@keyframes bb-machine-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-4px) rotate(-.5deg)}30%{transform:translateX(4px) rotate(.5deg)}45%{transform:translateX(-3px)}60%{transform:translateX(2px)}80%{transform:translateX(-1px)}}
/* Host reaction card */
.bb-reaction{padding:12px 16px;margin:8px 0;border-radius:8px;border-left:3px solid var(--bb-gold);background:linear-gradient(135deg,rgba(212,168,48,.06),rgba(42,16,64,.2));animation:bb-card-in .5s cubic-bezier(.16,1,.3,1) both;}
.bb-reaction .bb-reaction-who{font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--bb-hotpink);margin-bottom:3px;}
.bb-reaction .bb-reaction-txt{font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:var(--bb-champagne);line-height:1.5;}
/* Pair info slide */
.bb-pair-info{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-top:8px;background:rgba(0,0,0,.3);border-radius:6px;border:1px solid rgba(212,168,48,.15);flex-wrap:wrap;gap:8px;}
.bb-pair-player{display:flex;flex-direction:column;align-items:center;gap:4px;}
.bb-pair-player.right{flex-direction:column;}
.bb-pair-label{font-family:'Outfit',sans-serif;font-size:11px;}
.bb-pair-name{font-weight:600;letter-spacing:1px;color:var(--bb-cream);}
.bb-pair-role{font-size:8px;color:var(--bb-champagne);text-transform:uppercase;letter-spacing:1px;}
.bb-pair-compat-badge{display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 12px;}
.bb-pair-compat-text{font-family:'Press Start 2P',monospace;font-size:6px;letter-spacing:1px;text-transform:uppercase;}
.bb-compat-high{color:var(--bb-hotpink);}
.bb-compat-mid{color:var(--bb-gold);}
.bb-compat-low{color:var(--bb-shark);}
.bb-compat-chaos{color:var(--bb-stamp);}
/* Trust rings (inline) */
.bb-trust-rings{position:relative;width:32px;height:20px;margin:4px auto 0;}
.bb-trust-ring{position:absolute;width:16px;height:16px;border-radius:50%;border:2px solid var(--bb-gold);top:2px;transition:all .5s;}
.bb-trust-ring.left{left:0;}.bb-trust-ring.right{left:12px;}
.bb-trust-rings.high .bb-trust-ring{border-color:var(--bb-trust-high);box-shadow:0 0 6px rgba(212,168,48,.4);}
.bb-trust-rings.mid .bb-trust-ring{border-color:var(--bb-trust-mid);}
.bb-trust-rings.low .bb-trust-ring{border-color:var(--bb-trust-low);}
.bb-trust-rings.cracked .bb-trust-ring{border-color:var(--bb-trust-crack);border-style:dashed;}
/* Gold coin burst */
.bb-coin-burst{position:absolute;bottom:20px;left:50%;z-index:10;pointer-events:none;}
.bb-coin{position:absolute;width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg,#ffd700,#daa520,#ffd700);border:1px solid #b8860b;box-shadow:inset 0 1px 2px rgba(255,255,255,.4),0 2px 4px rgba(0,0,0,.3);opacity:0;animation:bb-coin-fly 1.5s cubic-bezier(.15,.8,.3,1) forwards;}
.bb-coin::after{content:'';position:absolute;top:3px;left:4px;width:4px;height:6px;border:1px solid #b8860b;border-radius:50%;opacity:.6;}
@keyframes bb-coin-fly{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(.5)}30%{opacity:1;transform:translate(var(--cx),var(--cy)) rotate(180deg) scale(1)}70%{opacity:.8;transform:translate(calc(var(--cx)*1.2),calc(var(--cy) + 40px)) rotate(360deg) scale(.9)}100%{opacity:0;transform:translate(calc(var(--cx)*1.3),120px) rotate(540deg) scale(.4)}}
/* Jackpot flash */
.bb-jackpot-flash{position:absolute;inset:0;pointer-events:none;z-index:8;background:radial-gradient(circle at 50% 50%,rgba(255,215,0,.15),transparent 70%);opacity:0;animation:bb-jp-flash .4s ease-out forwards;}
@keyframes bb-jp-flash{0%{opacity:1;transform:scale(.8)}50%{opacity:.6}100%{opacity:0;transform:scale(1.5)}}
/* Lever */
.bb-lever-area{position:absolute;right:-40px;top:50%;transform:translateY(-50%);z-index:10;width:50px;height:200px;}
.bb-lever-svg{animation:bb-lever-pull 1.5s cubic-bezier(.4,0,.2,1) .2s both;}
@keyframes bb-lever-pull{0%{transform:rotate(0)}25%{transform:rotate(35deg)}50%{transform:rotate(35deg)}75%{transform:rotate(-5deg)}100%{transform:rotate(0)}}

/* ── OBSTACLE TRACK ── */
/* ── ROLE ASSIGNMENT GRID ── */
.bb-role-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px;margin:14px 0;}
.bb-role-card{background:linear-gradient(135deg,rgba(42,16,64,.3),rgba(17,8,24,.5));border:1px solid rgba(212,168,48,.12);border-radius:8px;padding:10px 12px;overflow:hidden;}
.bb-role-pair-header{font-family:'Outfit',sans-serif;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--bb-gold);display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(212,168,48,.08);}
.bb-role-players{display:flex;align-items:center;gap:6px;}
.bb-role-player{display:flex;align-items:center;gap:6px;flex:1;}
.bb-role-player img{border-radius:4px;border:2px solid rgba(212,168,48,.2);}
.bb-role-info{display:flex;flex-direction:column;gap:2px;}
.bb-role-name{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:var(--bb-cream);letter-spacing:.5px;}
.bb-role-tag{font-family:'Outfit',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;}
.bb-role-tag.guide{color:var(--bb-gold);background:rgba(212,168,48,.08);border:1px solid rgba(212,168,48,.15);}
.bb-role-tag.blind{color:var(--bb-blush);background:rgba(232,160,168,.08);border:1px solid rgba(232,160,168,.15);}
.bb-role-arrow{font-size:16px;color:var(--bb-gold);opacity:.3;flex-shrink:0;}

.bb-obstacle-track{display:flex;align-items:center;gap:0;margin:12px 0;padding:10px 14px;background:rgba(0,0,0,.2);border-radius:8px;overflow-x:auto;}
.bb-obs-node{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:70px;}
.bb-obs-dot{width:24px;height:24px;border-radius:50%;border:2px solid rgba(212,168,48,.15);display:flex;align-items:center;justify-content:center;font-size:10px;background:rgba(42,16,64,.4);transition:all .5s;}
.bb-obs-dot.passed{border-color:var(--bb-gold);background:rgba(212,168,48,.15);box-shadow:0 0 6px rgba(212,168,48,.2);}
.bb-obs-dot.failed{border-color:var(--bb-stamp);background:rgba(192,32,32,.1);}
.bb-obs-dot.current{border-color:var(--bb-blush);animation:bb-obs-pulse 1.5s ease-in-out infinite;box-shadow:0 0 12px rgba(232,160,168,.3);}
@keyframes bb-obs-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.bb-obs-label{font-family:'Outfit',sans-serif;font-size:6px;letter-spacing:1px;text-transform:uppercase;color:var(--bb-champagne);text-align:center;}
.bb-obs-line{width:24px;height:2px;background:rgba(212,168,48,.1);flex-shrink:0;}
.bb-obs-line.done{background:var(--bb-gold-dk);}
.bb-obs-check{width:10px;height:7px;border-left:2px solid var(--bb-gold);border-bottom:2px solid var(--bb-gold);transform:rotate(-45deg);margin-bottom:2px;}

/* ── TIGHTROPE VISUALIZATION ── */
.bb-tightrope-vis{position:relative;margin:16px 0;padding:20px 16px;background:linear-gradient(180deg,rgba(24,56,96,.15),rgba(12,24,40,.4));border-radius:8px;border:1px solid rgba(138,184,208,.1);overflow:hidden;min-height:240px;}
/* Waterfall streams on sides */
.bb-side-falls{position:absolute;top:0;bottom:0;width:40px;pointer-events:none;overflow:hidden;z-index:1;}
.bb-side-falls.left{left:0;}.bb-side-falls.right{right:0;}
.bb-fall-stream{position:absolute;width:3px;background:linear-gradient(180deg,rgba(138,184,208,.2),rgba(40,72,160,.3),rgba(138,184,208,.15));animation:bb-stream-flow linear infinite;border-radius:2px;}
@keyframes bb-stream-flow{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
/* Mist */
.bb-mist-layer{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(0deg,rgba(138,184,208,.08),transparent);pointer-events:none;z-index:1;}
.bb-mist-particles{position:absolute;bottom:0;left:0;right:0;height:100%;pointer-events:none;overflow:hidden;z-index:2;}
.bb-mist-dot{position:absolute;width:var(--msz,3px);height:var(--msz,3px);border-radius:50%;background:rgba(200,220,240,.25);animation:bb-mist-rise linear infinite;opacity:0;}
@keyframes bb-mist-rise{0%{transform:translateY(0) translateX(0);opacity:0}15%{opacity:.3}50%{opacity:.15;transform:translateY(-50%) translateX(var(--mdx,5px))}100%{transform:translateY(-100%) translateX(calc(var(--mdx,5px) * 2));opacity:0}}
/* Water below */
.bb-water-layer{position:absolute;bottom:0;left:0;right:0;height:40%;background:linear-gradient(0deg,var(--bb-deep),rgba(40,72,160,.3));border-top:1px solid rgba(138,184,208,.1);z-index:2;}
/* Shark fins */
.bb-shark-fins{position:absolute;bottom:15%;left:0;right:0;height:50px;z-index:3;}
.bb-shark-fin-svg{position:absolute;opacity:.5;}
.bb-shark-fin-svg.swim{animation:bb-shark-swim 6s ease-in-out infinite;}
.bb-shark-fin-svg.bob{animation:bb-shark-bob 3s ease-in-out infinite;}
@keyframes bb-shark-swim{0%{transform:translateX(-20px) translateY(0)}50%{transform:translateX(20px) translateY(-5px)}100%{transform:translateX(-20px) translateY(0)}}
@keyframes bb-shark-bob{0%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}60%{transform:translateY(-3px)}}
/* Full shark body */
.bb-shark-body{position:absolute;bottom:0;opacity:0;z-index:4;animation:bb-shark-surface 12s ease-in-out infinite;}
@keyframes bb-shark-surface{0%,70%,100%{opacity:0;transform:translateY(20px)}75%{opacity:.35;transform:translateY(0)}85%{opacity:.3;transform:translateY(-5px)}90%{opacity:0;transform:translateY(15px)}}
/* Pair markers on rope */
.bb-rope-marker{position:absolute;top:-24px;display:flex;flex-direction:column;align-items:center;gap:2px;transition:left 1s cubic-bezier(.16,1,.3,1);z-index:5;}
.bb-rope-marker-dot{width:20px;height:20px;border-radius:50%;border:2px solid var(--bb-gold);background:var(--bb-velvet);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:7px;font-weight:700;color:var(--bb-gold);}
.bb-rope-marker-label{font-family:'Outfit',sans-serif;font-size:7px;color:var(--bb-champagne);white-space:nowrap;}
/* Segment labels below rope */
.bb-seg-labels{display:flex;justify-content:space-between;padding:0 4px;margin-top:4px;position:relative;z-index:3;}
.bb-seg-label{font-family:'Outfit',sans-serif;font-size:7px;letter-spacing:1px;text-transform:uppercase;color:var(--bb-mist);opacity:.4;text-align:center;flex:1;}
.bb-seg-label.danger{color:var(--bb-stamp);opacity:.6;}
/* Wind lines */
.bb-wind-lines{position:absolute;top:20%;left:0;right:0;height:40%;pointer-events:none;z-index:2;overflow:hidden;}
.bb-wind{position:absolute;height:1px;background:linear-gradient(90deg,transparent,rgba(200,220,240,.1),transparent);animation:bb-wind-blow linear infinite;}
@keyframes bb-wind-blow{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}

/* ── CUSTOMS / PASSPORT ── */
.bb-passport-desk{position:relative;margin:12px 0;padding:16px;background:linear-gradient(180deg,rgba(216,200,160,.04),rgba(26,26,24,.2));border-radius:8px;border:1px solid rgba(216,200,160,.08);overflow:hidden;}
.bb-desk-svg{position:absolute;right:16px;top:50%;transform:translateY(-50%);opacity:.08;z-index:0;}
/* Stamp animation */
.bb-stamp-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-12deg) scale(0);font-family:'Permanent Marker',cursive;font-size:24px;letter-spacing:3px;padding:3px 14px;border:3px solid;border-radius:4px;pointer-events:none;z-index:5;animation:bb-stamp-slam .4s cubic-bezier(.17,.67,.29,1.4) .3s forwards;}
@keyframes bb-stamp-slam{0%{transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0}60%{transform:translate(-50%,-50%) rotate(-12deg) scale(.9);opacity:1}100%{transform:translate(-50%,-50%) rotate(-12deg) scale(1);opacity:.8}}
.bb-stamp-pass{color:#3a8850;border-color:#3a8850;text-shadow:0 0 8px rgba(58,136,80,.3);}
.bb-stamp-deny{color:var(--bb-stamp);border-color:var(--bb-stamp);text-shadow:0 0 8px rgba(192,32,32,.3);}
/* Ink splatter */
.bb-ink-splatter{position:absolute;top:50%;left:50%;pointer-events:none;z-index:4;}
.bb-splat{position:absolute;border-radius:50%;opacity:0;animation:bb-splat-burst .6s ease-out .4s forwards;}
@keyframes bb-splat-burst{0%{opacity:0;transform:translate(0,0) scale(0)}50%{opacity:.5;transform:translate(var(--sx),var(--sy)) scale(1)}100%{opacity:.2;transform:translate(var(--sx),var(--sy)) scale(.8)}}
/* Ink drip */
.bb-ink-drip{position:absolute;pointer-events:none;z-index:6;}
.bb-drip{position:absolute;width:2px;background:linear-gradient(180deg,var(--bb-stamp),rgba(192,32,32,.3));border-radius:0 0 50% 50%;opacity:0;animation:bb-drip-fall 2s ease-in .8s forwards;}
@keyframes bb-drip-fall{0%{height:0;opacity:.6}60%{height:var(--dh,20px);opacity:.5}100%{height:calc(var(--dh,20px) + 8px);opacity:.2}}

/* ── VERDICT CARDS ── */
.bb-verdict-approved{background:linear-gradient(135deg,rgba(58,136,80,.08),rgba(26,26,24,.35));border-left:4px solid #3a8850;}
.bb-verdict-denied{background:linear-gradient(135deg,rgba(192,32,32,.08),rgba(26,26,24,.35));border-left:4px solid var(--bb-stamp);}
.bb-stamp-verdict{font-size:32px!important;padding:6px 20px!important;border-width:4px!important;animation-delay:.5s!important;}
.bb-verdict-tally{display:flex;gap:6px;justify-content:center;padding:8px 0 4px;margin:0 auto;}
.bb-verdict-q{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Permanent Marker',cursive;font-size:14px;font-weight:700;}
.bb-verdict-q.correct{background:rgba(58,136,80,.25);color:#5ab870;border:2px solid rgba(58,136,80,.4);}
.bb-verdict-q.wrong{background:rgba(192,32,32,.2);color:var(--bb-stamp);border:2px solid rgba(192,32,32,.3);}
.bb-verdict-shark-drop{display:flex;justify-content:center;margin-top:8px;animation:bb-shark-rise 1.5s ease-out .8s both;}
.bb-verdict-shark-svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));}
@keyframes bb-shark-rise{0%{opacity:0;transform:translateY(10px)}100%{opacity:.6;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.bb-verdict-shark-drop{animation:none;opacity:.6;}.bb-stamp-verdict{animation:none;opacity:.8;transform:translate(-50%,-50%) rotate(-12deg) scale(1);}}

/* ── PASSPORT CARDS (matches Soluna Island reference) ── */
.bb-passport{display:inline-block;width:210px;padding:0;background:linear-gradient(145deg,#d4c898,#c0b080);border:3px solid #6a6a4a;border-radius:4px;position:relative;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.15);color:var(--bb-ink);font-family:'Outfit',sans-serif;}
.bb-passport-inner{display:flex;gap:10px;padding:10px 12px 6px;}
.bb-passport-av{width:64px;height:72px;border:2px solid #6a6a4a;border-radius:2px;overflow:hidden;flex-shrink:0;background:#c8b888;display:flex;align-items:center;justify-content:center;}
.bb-passport-av img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:0!important;background:#c8b888;}
.bb-passport-info{display:flex;flex-direction:column;justify-content:center;min-width:0;}
.bb-passport-name{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2a2a18;line-height:1.2;}
.bb-passport-arch{font-size:10px;color:#5a5030;text-transform:capitalize;letter-spacing:.3px;line-height:1.3;margin-top:2px;}
.bb-passport-badge{font-family:'Permanent Marker',cursive;font-size:10px;color:var(--bb-stamp);letter-spacing:.5px;margin-top:4px;opacity:.7;}
.bb-passport-stamp{position:absolute;top:8px;right:8px;font-family:'Permanent Marker',cursive;font-size:18px;color:var(--bb-stamp);transform:rotate(18deg);opacity:.12;letter-spacing:2px;line-height:1;}
.bb-passport-lines{padding:0 12px 8px;}
.bb-passport-line{height:1px;background:rgba(26,26,24,.12);margin:4px 0;}
/* Mini passport for card headers */
.bb-mini-passport{display:inline-flex;align-items:center;gap:5px;padding:3px 6px 3px 3px;background:#c8b888;border:2px solid #6a6a4a;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,.3);flex-shrink:0;}
.bb-mini-passport-av{width:24px;height:28px;border:1.5px solid #6a6a4a;border-radius:1px;overflow:hidden;flex-shrink:0;background:#e8e0c8;}
.bb-mini-passport-av img{width:100%;height:100%;object-fit:cover;}
.bb-mini-passport-name{font-family:'Outfit',sans-serif;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#2a2a18;line-height:1.15;}
.bb-mini-passport-arch{font-size:6px;color:#5a5030;text-transform:capitalize;letter-spacing:.3px;}

/* ── RESULTS ── */
.bb-results{padding:24px;margin:20px 0;border-radius:12px;text-align:center;background:linear-gradient(135deg,rgba(42,16,64,.4),rgba(212,168,48,.05));border:2px solid var(--bb-gold);box-shadow:0 0 40px rgba(212,168,48,.1);animation:bb-results-glow 2s ease-in-out infinite alternate;position:relative;overflow:hidden;}
@keyframes bb-results-glow{0%{box-shadow:0 0 20px rgba(212,168,48,.1)}100%{box-shadow:0 0 60px rgba(212,168,48,.2)}}
.bb-results-crown-icon{margin-bottom:8px;position:relative;z-index:2;}
.bb-results-title{font-family:'Playfair Display',serif;font-weight:900;font-size:24px;color:var(--bb-gold);letter-spacing:2px;position:relative;z-index:2;}
.bb-results-pair{display:flex;align-items:center;justify-content:center;gap:16px;margin:14px 0;position:relative;z-index:2;}
/* Halo ring */
.bb-results-halo{position:relative;display:inline-block;animation:bb-winner-pulse 1.5s ease-in-out infinite;}
.bb-results-halo::before{content:'';position:absolute;inset:-10px;border:2px solid transparent;border-top-color:var(--bb-gold);border-right-color:var(--bb-gold-lt);border-radius:6px;animation:bb-halo-spin 2s linear infinite;filter:drop-shadow(0 0 6px rgba(212,168,48,.5));}
.bb-results-halo::after{content:'';position:absolute;inset:-14px;border:1px solid transparent;border-bottom-color:rgba(212,168,48,.3);border-left-color:rgba(212,168,48,.2);border-radius:8px;animation:bb-halo-spin 3s linear infinite reverse;}
@keyframes bb-halo-spin{to{transform:rotate(360deg)}}
.bb-results-halo .bb-passport{box-shadow:0 0 20px rgba(212,168,48,.3),0 6px 24px rgba(0,0,0,.5);border-color:var(--bb-gold);}
@keyframes bb-winner-pulse{0%,100%{filter:drop-shadow(0 0 10px rgba(212,168,48,.2))}50%{filter:drop-shadow(0 0 25px rgba(212,168,48,.5))}}
.bb-results-rings-icon{position:relative;z-index:2;}
.bb-results-score{font-family:'Outfit',sans-serif;font-size:14px;color:var(--bb-champagne);margin-top:8px;letter-spacing:1px;position:relative;z-index:2;}
.bb-results-immune{font-family:'Outfit',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--bb-gold);padding:6px 20px;border:1px solid var(--bb-gold);border-radius:20px;margin-top:12px;display:inline-block;background:rgba(212,168,48,.06);position:relative;z-index:2;}
/* Confetti */
.bb-confetti-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;}
.bb-confetti{position:absolute;top:-10px;width:var(--cw,6px);height:var(--ch,10px);background:var(--cc,var(--bb-gold));opacity:0;animation:bb-confetti-fall linear infinite;transform:rotate(var(--cr,0deg));}
@keyframes bb-confetti-fall{0%{transform:translateY(0) rotate(var(--cr,0deg));opacity:0}5%{opacity:.8}50%{opacity:.6;transform:translateY(50%) rotate(calc(var(--cr,0deg) + 180deg)) translateX(var(--csx,10px))}100%{transform:translateY(120%) rotate(calc(var(--cr,0deg) + 360deg)) translateX(calc(var(--csx,10px) * -1));opacity:0}}
/* Firework bursts */
.bb-fireworks{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;}
.bb-firework{position:absolute;width:4px;height:4px;border-radius:50%;opacity:0;}
.bb-firework.ring{border:1px solid var(--fw-color,var(--bb-gold));background:transparent;width:8px;height:8px;animation:bb-fw-ring 2s ease-out infinite;}
@keyframes bb-fw-ring{0%{opacity:0;transform:scale(0)}20%{opacity:.7}100%{opacity:0;transform:scale(8)}}
.bb-firework.trail{background:var(--fw-color,var(--bb-gold));animation:bb-fw-trail 2s ease-out infinite;}
@keyframes bb-fw-trail{0%{opacity:0;transform:translate(0,0) scale(1)}15%{opacity:.8}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}
/* Standings grid */
.bb-standings-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;}
.bb-standing-card{text-align:center;padding:16px;background:rgba(42,16,64,.3);border-radius:8px;border:1px solid rgba(212,168,48,.08);}
.bb-standing-card.last{border-color:rgba(192,32,32,.1);}
.bb-standing-place{font-family:'Outfit',sans-serif;font-size:9px;color:var(--bb-champagne);letter-spacing:2px;text-transform:uppercase;}
.bb-standing-card.last .bb-standing-place{color:var(--bb-stamp);}
.bb-standing-avatars{display:flex;justify-content:center;gap:4px;margin:8px 0;}
.bb-standing-names{font-family:'Outfit',sans-serif;font-size:11px;}
.bb-standing-score{font-family:'Outfit',sans-serif;font-size:9px;color:var(--bb-champagne);}
.bb-standing-card.last .bb-standing-score{color:var(--bb-stamp);}

/* ── PAIR RESULTS TABLE ── */
.bb-pair-results{width:100%;border-collapse:collapse;font-family:'Outfit',sans-serif;font-size:10px;margin:10px 0;}
.bb-pair-results th{text-align:left;padding:4px 8px;color:var(--bb-gold);letter-spacing:1px;text-transform:uppercase;font-size:8px;border-bottom:1px solid rgba(212,168,48,.15);}
.bb-pair-results td{padding:4px 8px;border-bottom:1px solid rgba(212,168,48,.05);}
.bb-pair-results tr:first-child td{color:var(--bb-gold);}

/* ── CHATTER ── */
.bb-chatter{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:12px;color:var(--bb-champagne);opacity:.35;padding:4px 14px;text-align:center;letter-spacing:.5px;}

/* ── SIDEBAR ── */
.bb-sidebar{position:sticky;top:46px;height:calc(100vh - 46px);overflow-y:auto;padding:14px 10px;background:linear-gradient(180deg,rgba(17,8,24,.95),rgba(26,12,40,.95));border-left:2px solid rgba(212,168,48,.1);scrollbar-width:thin;scrollbar-color:rgba(212,168,48,.15) transparent;font-size:12px;}
.bb-sb-title{font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--bb-gold);padding-bottom:5px;border-bottom:1px solid rgba(212,168,48,.15);margin-bottom:8px;}
.bb-sb-pair{padding:8px;margin-bottom:6px;border-radius:6px;background:rgba(42,16,64,.3);border:1px solid rgba(212,168,48,.08);}
.bb-sb-pair.leading{border-color:var(--bb-gold);box-shadow:0 0 10px rgba(212,168,48,.1);}
.bb-sb-pair-header{display:flex;align-items:center;gap:5px;margin-bottom:4px;}
.bb-sb-pair-avatars{display:flex;}
.bb-sb-av{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--bb-gold-dk);overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:8px;font-weight:700;color:var(--bb-gold);background:var(--bb-velvet);}.bb-sb-av:nth-child(2){margin-left:-5px;}
.bb-sb-av img{width:100%;height:100%;object-fit:cover;}
.bb-sb-pair-names{font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;letter-spacing:.5px;flex:1;}
.bb-sb-pair-rank{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:var(--bb-gold);opacity:.3;}
.bb-sb-trust{display:flex;align-items:center;gap:5px;margin:3px 0;}
.bb-sb-trust-label{font-family:'Outfit',sans-serif;font-size:9px;color:var(--bb-champagne);letter-spacing:1px;}
.bb-sb-trust-rings{display:flex;}
.bb-sb-ring{width:11px;height:11px;border-radius:50%;border:1.5px solid var(--bb-gold);}.bb-sb-ring:nth-child(2){margin-left:-4px;}
.bb-sb-ring.cracked{border-color:var(--bb-trust-crack);border-style:dashed;}
.bb-sb-ring.glow{border-color:var(--bb-gold-lt);box-shadow:0 0 4px rgba(212,168,48,.4);}
.bb-sb-bar{height:5px;background:rgba(255,255,255,.04);border-radius:3px;margin:2px 0;overflow:hidden;}
.bb-sb-fill{height:100%;border-radius:3px;transition:width .8s ease-out;}
.bb-sb-fill.gold{background:linear-gradient(90deg,var(--bb-gold-dk),var(--bb-gold));}
.bb-sb-fill.blush{background:linear-gradient(90deg,var(--bb-rose),var(--bb-blush));}
.bb-sb-fill.blue{background:linear-gradient(90deg,var(--bb-falls),var(--bb-mist));}
.bb-sb-fill.green{background:linear-gradient(90deg,#2a6840,#3a8850);}
.bb-sb-label{font-family:'Outfit',sans-serif;font-size:9px;color:var(--bb-champagne);letter-spacing:.5px;}
.bb-sb-journey{margin:8px 0;padding:6px;background:rgba(0,0,0,.2);border-radius:6px;border:1px solid rgba(212,168,48,.06);}
.bb-sb-journey-step{display:flex;align-items:center;gap:6px;padding:3px 0;position:relative;}
.bb-sb-journey-step::before{content:'';position:absolute;left:8px;top:20px;width:1px;height:calc(100% - 4px);background:rgba(212,168,48,.1);}
.bb-sb-journey-step:last-child::before{display:none;}
.bb-sb-journey-dot{width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(212,168,48,.2);background:rgba(42,16,64,.5);display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1;}
.bb-sb-journey-dot.active{border-color:var(--bb-gold);background:rgba(212,168,48,.15);box-shadow:0 0 6px rgba(212,168,48,.2);}
.bb-sb-journey-dot.done{border-color:var(--bb-gold);background:var(--bb-gold-dk);}
.bb-sb-journey-info{font-family:'Outfit',sans-serif;font-size:10px;letter-spacing:.5px;}
.bb-sb-journey-info.active{color:var(--bb-gold);}
.bb-sb-journey-info.done{color:var(--bb-champagne);opacity:.5;text-decoration:line-through;}
.bb-sb-sharks{display:flex;gap:3px;margin:4px 0;flex-wrap:wrap;}
.bb-sb-shark-fin{position:relative;width:12px;height:10px;}
.bb-sb-shark-fin::before{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:var(--bb-water);border-radius:0 0 3px 3px;}
.bb-sb-shark-fin::after{content:'';position:absolute;bottom:3px;left:3px;width:0;height:0;border-style:solid;border-width:0 3px 7px 3px;border-color:transparent transparent var(--bb-shark) transparent;}
.bb-sb-shark-fin.hit{opacity:1;}.bb-sb-shark-fin.empty{opacity:.2;}
.bb-sb-drama{margin-top:6px;border-top:1px solid rgba(212,168,48,.1);padding-top:6px;}
.bb-sb-drama-item{font-family:'Outfit',sans-serif;font-size:7px;color:var(--bb-champagne);padding:1px 0;display:flex;gap:3px;align-items:flex-start;}
.bb-sb-drama-dot{width:4px;height:4px;border-radius:50%;margin-top:2px;flex-shrink:0;}

/* Controls */
.bb-controls{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:12px;padding:8px 20px;background:linear-gradient(0deg,rgba(17,8,24,.98),rgba(17,8,24,.8));border-top:1px solid rgba(212,168,48,.15);backdrop-filter:blur(8px);}
.bb-btn{font-family:'Outfit',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:7px 20px;border-radius:20px;border:1px solid var(--bb-gold-dk);background:rgba(212,168,48,.08);color:var(--bb-gold);cursor:pointer;transition:all .3s;}
.bb-btn:hover{background:rgba(212,168,48,.15);border-color:var(--bb-gold);box-shadow:0 0 12px rgba(212,168,48,.2);}
.bb-counter{font-family:'Outfit',sans-serif;font-size:9px;color:var(--bb-champagne);letter-spacing:1px;}

@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
@media(max-width:900px){.bb-shell{grid-template-columns:1fr;}.bb-sidebar{position:static;height:auto;}.bb-cold-open{grid-column:1;}}
</style>

<!-- Particles -->
<div class="bb-hearts">${hearts}</div>
<div class="bb-suits">${suits}</div>
<div class="bb-bubbles">${bubbles}</div>
${dust ? `<div class="bb-dust-motes">${dust}</div>` : ''}
${rain ? `<div class="bb-rain-drops">${rain}</div>` : ''}

<!-- Broadcast chrome -->
<div class="bb-broadcast">
  <div class="bb-live-dot"></div>
  <span class="bb-live-label">LIVE</span>
  <span class="bb-channel">DC WORLD TOUR</span>
  <div class="bb-ticker-wrap">
    <span class="bb-ticker">BRIDAL BRAWLS -- POST-MERGE IMMUNITY CHALLENGE -- PAIRS MATCHED BY THE WEDDING MACHINE -- BLINDFOLD / TIGHTROPE / CUSTOMS -- WHO GETS IMMUNITY?</span>
  </div>
</div>

<!-- Main content -->
<div class="bb-main" style="padding-bottom:60px;">${content}</div>

<!-- Sidebar -->
${sidebar}

</div>`;
}

// ── PASSPORT CARD (Soluna Island style) ──
function _passportCard(name, rotation = 0) {
  const a = arch(name);
  return `<div class="bb-passport" style="transform:rotate(${rotation}deg);">
    <div class="bb-passport-stamp">DC</div>
    <div class="bb-passport-inner">
      <div class="bb-passport-av">${portrait(name, 50)}</div>
      <div class="bb-passport-info">
        <div class="bb-passport-name">${name}</div>
        <div class="bb-passport-arch">${a || 'Contestant'}</div>
        <div class="bb-passport-badge">DRAMA CRUISE</div>
      </div>
    </div>
    <div class="bb-passport-lines"><div class="bb-passport-line"></div><div class="bb-passport-line"></div><div class="bb-passport-line"></div></div>
  </div>`;
}

// ── MINI PASSPORT (for card headers — replaces circular avatars) ──
function _miniPassport(name) {
  const a = arch(name);
  return `<div class="bb-mini-passport">
    <div class="bb-mini-passport-av">${portrait(name, 28)}</div>
    <div><div class="bb-mini-passport-name">${name}</div><div class="bb-mini-passport-arch">${a || ''}</div></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildBRBTitleCard(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-title';
  const st = _ensureState(stKey, 1);
  if (typeof window !== 'undefined') window._bbPhaseData = { phase: 'title' };

  const active = data.pairs.flatMap(p => [p.guide, p.blind, p.crasher].filter(Boolean));

  // Passport toss pile — passports fly in 1 by 1, scatter at random angles like Soluna Island
  // Positions are offsets from center (left:50%;top:50% + translate)
  const count = active.length;
  const tossPositions = active.map((n, i) => {
    // Scatter in a rough circular/organic pile from center
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const radius = 50 + Math.random() * 140;
    const toX = Math.cos(angle) * radius - 105; // offset by half passport width (210/2)
    const toY = Math.sin(angle) * radius * 0.55 - 55; // flatten vertically, offset by half height
    const rot = -30 + Math.floor(Math.random() * 60);
    const fromX = -300 + Math.floor(Math.random() * 600);
    const fromR = -180 + Math.floor(Math.random() * 360);
    const delay = 0.2 + i * 0.35;
    return { name: n, toX: Math.round(toX), toY: Math.round(toY), rot, fromX, fromR, delay };
  });
  const passportPile = tossPositions.map(p =>
    `<div class="bb-toss-passport" style="--toss-from-x:${p.fromX}px;--toss-from-y:-400px;--toss-from-r:${p.fromR}deg;--toss-to-x:${p.toX}px;--toss-to-y:${p.toY}px;--toss-to-r:${p.rot}deg;--toss-delay:${p.delay.toFixed(1)}s;--toss-dur:.9s;--idle-delay:${(p.delay + 1).toFixed(1)}s;">${_passportCard(p.name, 0)}</div>`
  ).join('');

  // Waterfall SVG background
  const waterfallSvg = `<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 600">
    <polygon points="0,300 60,180 120,250 180,150 240,220 300,170 360,240 400,200 400,600 0,600" fill="#1a0c28" opacity=".4"/>
    <polygon points="0,350 80,250 140,300 200,200 260,280 320,230 400,270 400,600 0,600" fill="#110818" opacity=".3"/>
    <rect x="140" y="200" width="8" height="400" fill="url(#bb-wf-grad)" opacity=".4"><animate attributeName="y" values="200;195;200" dur="2s" repeatCount="indefinite"/></rect>
    <rect x="155" y="210" width="5" height="390" fill="url(#bb-wf-grad)" opacity=".3"><animate attributeName="y" values="210;205;210" dur="2.5s" repeatCount="indefinite"/></rect>
    <rect x="230" y="170" width="6" height="430" fill="url(#bb-wf-grad)" opacity=".35"><animate attributeName="y" values="170;165;170" dur="1.8s" repeatCount="indefinite"/></rect>
    <rect x="245" y="180" width="4" height="420" fill="url(#bb-wf-grad)" opacity=".25"><animate attributeName="y" values="180;175;180" dur="2.2s" repeatCount="indefinite"/></rect>
    <ellipse cx="160" cy="590" rx="60" ry="20" fill="rgba(168,208,224,.15)"><animate attributeName="rx" values="60;80;60" dur="4s" repeatCount="indefinite"/></ellipse>
    <ellipse cx="240" cy="585" rx="50" ry="15" fill="rgba(168,208,224,.1)"><animate attributeName="rx" values="50;70;50" dur="5s" repeatCount="indefinite"/></ellipse>
    <defs><linearGradient id="bb-wf-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(138,184,208,.6)"/><stop offset="50%" stop-color="rgba(40,72,160,.4)"/><stop offset="100%" stop-color="rgba(138,184,208,.2)"/></linearGradient></defs>
  </svg>`;

  return _shell(`
    <div class="bb-cold-open">
      <div class="bb-casino-bg"></div>
      <div class="bb-waterfall-bg">${waterfallSvg}</div>
      <div class="bb-spotlights"><div class="bb-spot"></div><div class="bb-spot"></div><div class="bb-spot"></div></div>

      <div class="bb-title-wrap">
        <div class="bb-title-series">Drama Cruise: World Tour</div>
        <div class="bb-title-main">Bridal Brawls</div>
        <div class="bb-title-tagline">"Do you take this partner... to have and to hold... through mud, rope, and sharks?"</div>

        <div class="bb-rings-deco">
          <div class="bb-ring-line"></div>
          <svg class="bb-rings-svg" width="48" height="28" viewBox="0 0 48 28"><circle cx="16" cy="14" r="10" fill="none" stroke="#d4a830" stroke-width="2" opacity=".7"/><circle cx="32" cy="14" r="10" fill="none" stroke="#e83070" stroke-width="2" opacity=".7"/><circle cx="16" cy="14" r="10" fill="none" stroke="#d4a830" stroke-width="2" stroke-dasharray="2 4" opacity=".3"/></svg>
          <div class="bb-ring-line"></div>
        </div>

        <div class="bb-phase-pills">
          <div class="bb-pill active"><span class="bb-pill-num">I</span> Slot Machine</div>
          <div class="bb-pill"><span class="bb-pill-num">II</span> Blindfold Run</div>
          <div class="bb-pill"><span class="bb-pill-num">III</span> The Big Drop</div>
          <div class="bb-pill"><span class="bb-pill-num">IV</span> Customs</div>
        </div>

        <div class="bb-passport-pile">${passportPile}</div>

        <div class="bb-host-announce" style="margin-top:20px;">
          <div class="bb-host-label">${host()} speaks</div>
          <div class="bb-host-text">"Welcome to the wedding of the century — where the only vows are survival!"</div>
        </div>
      </div>

      <div class="bb-scroll">Scroll to begin</div>
    </div>
  `, ep, '', 'title');
}

export function rpBuildBRBSlotMachine(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-slot';
  const steps = [];

  // Generate marquee bulbs (60 around the perimeter) — shared across all machine instances
  let bulbs = '';
  for (let i = 0; i < 60; i++) {
    const pct = i / 60;
    let x, y;
    if (pct < 0.3) { x = `${(pct / 0.3) * 100}%`; y = '-3px'; }
    else if (pct < 0.5) { x = 'calc(100% - 1px)'; y = `${((pct - 0.3) / 0.2) * 100}%`; }
    else if (pct < 0.8) { x = `${(1 - (pct - 0.5) / 0.3) * 100}%`; y = 'calc(100% - 1px)'; }
    else { x = '-3px'; y = `${(1 - (pct - 0.8) / 0.2) * 100}%`; }
    bulbs += `<div class="bb-bulb" style="left:${x};top:${y};animation-delay:${(i * 0.08).toFixed(2)}s;"></div>`;
  }

  // Lever SVG
  const leverSvg = `<svg class="bb-lever-svg" width="50" height="200" viewBox="0 0 50 200">
    <rect x="18" y="0" width="14" height="20" rx="3" fill="#888890"/>
    <rect x="20" y="2" width="10" height="16" rx="2" fill="#666"/>
    <rect x="22" y="20" width="6" height="140" rx="3" fill="url(#bb-lever-chrome)"/>
    <rect x="24" y="20" width="2" height="140" fill="rgba(255,255,255,.1)"/>
    <circle cx="25" cy="170" r="14" fill="url(#bb-lever-ball)"/>
    <circle cx="22" cy="166" r="4" fill="rgba(255,255,255,.15)"/>
    <defs>
      <linearGradient id="bb-lever-chrome" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#888890"/><stop offset="50%" stop-color="#c0c0c8"/><stop offset="100%" stop-color="#888890"/>
      </linearGradient>
      <radialGradient id="bb-lever-ball" cx="40%" cy="35%">
        <stop offset="0%" stop-color="#ff4060"/><stop offset="80%" stop-color="#c02040"/><stop offset="100%" stop-color="#801030"/>
      </radialGradient>
    </defs>
  </svg>`;

  // ── Step 1: Host intro with machine reveal ──
  steps.push(`<div class="bb-slot-machine bb-machine-shake">
    <div class="bb-cabinet">
      <div class="bb-marquee-lights">${bulbs}</div>
      <div class="bb-jackpot-sign">
        <div class="bb-jackpot-text">JACKPOT</div>
        <div class="bb-jackpot-sub">The Wedding Machine</div>
      </div>
      <div class="bb-lever-area bb-lever-pulling">${leverSvg}</div>
      <div class="bb-slot-display" style="min-height:80px;display:flex;align-items:center;justify-content:center;">
        <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--bb-neon-gold);text-align:center;letter-spacing:2px;animation:bb-jackpot-idle 2s ease-in-out infinite;">AWAITING FIRST PULL...</div>
      </div>
    </div>
  </div>
  <div class="bb-reaction">
    <div class="bb-reaction-who">${host()} speaks</div>
    <div class="bb-reaction-txt">"Step right up to the Wedding Jackpot Machine! One pull of the lever decides your partner for the ENTIRE challenge. No trades, no refunds, no prenups."</div>
  </div>`);

  // ── Steps 2+: One pair per reveal click ──
  data.pairs.forEach((pair, pi) => {
    const bond = getBond(pair.guide, pair.blind);
    const compatLabel = pair.compat ? 'HIGH COMPAT' : bond < -2 ? 'RIVALS' : bond > 0 ? 'TENSION' : 'AWKWARD';
    const compatCls = pair.compat ? 'bb-compat-high' : bond < -2 ? 'bb-compat-chaos' : bond > 0 ? 'bb-compat-mid' : 'bb-compat-low';
    const trustCls = bond > 3 ? 'high' : bond > 0 ? 'mid' : bond > -3 ? 'low' : 'cracked';
    const compatIcon = pair.compat ? `<span style="color:var(--bb-hotpink)">&#9829;</span>` : bond < -2 ? `<span style="color:var(--bb-stamp)">&#9760;</span>` : bond > 0 ? `<span style="color:var(--bb-gold)">&#9733;</span>` : `<span style="color:var(--bb-shark)">&#9888;</span>`;

    const guideIni = pair.guide.substring(0, 2).toUpperCase();
    const blindIni = pair.blind.substring(0, 2).toUpperCase();

    // Build spinning reel strips — 8 fake symbols + 1 real at bottom
    const FAKE_SYMS = ['7', '♠', '♦', '♣', '★', '♥', '?', '!', '♛', '♞', '⚡', '$'];
    function _reelStrip(finalSym, reelClass, isMidReel) {
      let strip = `<div class="bb-reel-strip" data-spin="${reelClass}">`;
      for (let si = 0; si < 8; si++) {
        const sym = FAKE_SYMS[Math.floor(Math.random() * FAKE_SYMS.length)];
        strip += `<div class="bb-reel-sym">${sym}</div>`;
      }
      strip += `<div class="bb-reel-sym final${isMidReel ? ' compat' : ''}">${finalSym}</div>`;
      strip += `</div>`;
      return strip;
    }

    const reel1 = _reelStrip(guideIni, 'spin-r1', false);
    const reel2 = _reelStrip(compatIcon, 'spin-r2', true);
    const reel3 = _reelStrip(blindIni, 'spin-r3', false);

    // Coin burst (more coins for compat pairs)
    let coins = '';
    const coinCount = pair.compat ? 14 : 8;
    for (let ci = 0; ci < coinCount; ci++) {
      const cx = -80 + Math.floor(Math.random() * 160);
      const cy = -100 - Math.floor(Math.random() * 80);
      const w = 8 + Math.floor(Math.random() * 8);
      coins += `<div class="bb-coin" style="--cx:${cx}px;--cy:${cy}px;animation-delay:${(0.8 + Math.random() * 0.4).toFixed(2)}s;width:${w}px;height:${w}px;"></div>`;
    }

    // Pick suspense text
    const suspenseText = pick(SLOT_SUSPENSE);

    // Pick reaction texts — separate reactions per player
    const hostReaction = pick(SLOT_HOST_REACTIONS)(pair.guide, pair.blind);
    const guidePool = pair.compat ? SLOT_GUIDE_REACTIONS_COMPAT : bond > 0 ? SLOT_GUIDE_REACTIONS_GOOD : SLOT_GUIDE_REACTIONS_BAD;
    const blindPool = pair.compat ? SLOT_BLIND_REACTIONS_COMPAT : bond > 0 ? SLOT_BLIND_REACTIONS_GOOD : SLOT_BLIND_REACTIONS_BAD;
    const guideReaction = pick(guidePool)(pair.guide, pair.blind);
    const blindReaction = pick(blindPool)(pair.guide, pair.blind);

    // Step A: Divider + suspense + spinning reels
    steps.push(`
      <div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">${pi + 1}</div><div class="bb-divider-name">PAIR ${pi + 1}</div></div></div>
      <div class="bb-chatter">${suspenseText}</div>
      <div class="bb-slot-machine bb-machine-shake">
        <div class="bb-cabinet">
          <div class="bb-marquee-lights">${bulbs}</div>
          <div class="bb-jackpot-sign">
            <div class="bb-jackpot-text" style="animation:bb-jackpot-idle 1s ease-in-out infinite;">JACKPOT</div>
            <div class="bb-jackpot-sub">Pull #${pi + 1}</div>
          </div>
          <div class="bb-lever-area bb-lever-pulling">${leverSvg}</div>
          <div class="bb-slot-display">
            <div class="bb-reel-row">
              <div class="bb-reel-set">
                <div class="bb-reel">${reel1}</div>
                <div class="bb-reel">${reel2}</div>
                <div class="bb-reel">${reel3}</div>
              </div>
            </div>
            <div class="bb-jackpot-flash"></div>
          </div>
          <div class="bb-coin-burst">${coins}</div>
        </div>
      </div>
    `);

    // Step B: Pair reveal with passports
    steps.push(`
      <div class="bb-pair-info bb-pair-info-reveal">
        <div class="bb-pair-player">
          ${_passportCard(pair.guide, -3)}
          <div class="bb-pair-label"><div class="bb-pair-role" style="margin-top:4px;">GUIDE</div></div>
        </div>
        <div class="bb-pair-compat-badge">
          <div style="font-size:24px;">${compatIcon}</div>
          <div class="bb-pair-compat-text ${compatCls}">${compatLabel}</div>
          <div class="bb-trust-rings ${trustCls}"><div class="bb-trust-ring left"></div><div class="bb-trust-ring right"></div></div>
        </div>
        <div class="bb-pair-player right">
          ${_passportCard(pair.blind, 3)}
          <div class="bb-pair-label"><div class="bb-pair-role" style="margin-top:4px;">BLINDFOLDED</div></div>
        </div>
      </div>
      ${pair.crasher ? `<div style="text-align:center;font-family:'Outfit',sans-serif;font-size:10px;color:var(--bb-stamp);letter-spacing:1px;margin-top:6px;">WEDDING CRASHER: ${pair.crasher} (third wheel penalty)</div>` : ''}
    `);

    // Step C: Host + player reactions
    steps.push(`
      <div class="bb-reaction">
        <div class="bb-reaction-who">${host()}</div>
        <div class="bb-reaction-txt">${hostReaction}</div>
      </div>
      <div class="bb-reaction" style="border-left-color:var(--bb-blush);">
        <div class="bb-reaction-who" style="color:var(--bb-cream);display:flex;align-items:center;gap:6px;">${portrait(pair.guide, 22)} ${pair.guide}</div>
        <div class="bb-reaction-txt">${guideReaction}</div>
      </div>
      <div class="bb-reaction" style="border-left-color:var(--bb-mist);">
        <div class="bb-reaction-who" style="color:var(--bb-cream);display:flex;align-items:center;gap:6px;">${portrait(pair.blind, 22)} ${pair.blind}</div>
        <div class="bb-reaction-txt">${blindReaction}</div>
      </div>
    `);
  });

  // ── Romance event cards ──
  if (data.romanceEvents && data.romanceEvents.length > 0) {
    data.romanceEvents.forEach(evt => {
      const romTagMap = {
        'spark': { cls: 'trust', tag: 'bb-tag-trust', label: 'ROMANCE SPARK' },
        'jealousy': { cls: 'sabotage', tag: 'bb-tag-sabotage', label: 'JEALOUSY' },
        'showmance-boost': { cls: 'trust', tag: 'bb-tag-trust', label: 'POWER COUPLE' },
        'breakup': { cls: 'sabotage', tag: 'bb-tag-denied', label: 'BREAKUP' },
      };
      const info = romTagMap[evt.type] || { cls: 'social', tag: 'bb-tag-social', label: evt.type.toUpperCase() };
      steps.push(`<div class="bb-card ${info.cls}">
        <div class="bb-card-hdr">${evt.players.map(p => portrait(p, 22)).join('')}<span class="bb-card-who">${evt.players.join(' & ')}</span><span class="bb-card-tag ${info.tag}">${info.label}</span></div>
        <div class="bb-card-txt">${evt.text}</div>
      </div>`);
    });
  }

  // ── Final step: all pairs set, transition ──
  steps.push(`<div class="bb-reaction">
    <div class="bb-reaction-who">${host()}</div>
    <div class="bb-reaction-txt">"The machine has spoken! ${data.pairs.length} pairs, locked in. Time to test those partnerships. Phase One: the Blindfolded Obstacle Course!"</div>
  </div>
  <div class="bb-chatter">${pick(CHATTER)}</div>`);

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase1-bg', 'slot');
}

export function rpBuildBRBObstacleCourse(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-obstacle';
  const steps = [];
  const stepMeta = [];

  // ── Step 1: Phase header + role assignment ──
  let roleCards = `<div class="bb-phase-header">
    <div class="bb-phase-num">I</div>
    <div><div class="bb-phase-name">Dress Hunt — Blindfolded Obstacle Course</div>
    <div class="bb-phase-desc">Guides shout directions. Blindfolded partners navigate 6 obstacles to grab a wedding dress.</div></div>
  </div>
  <div class="bb-reaction" style="margin-top:8px;">
    <div class="bb-reaction-who">${host()}</div>
    <div class="bb-reaction-txt">"Guides — you can see EVERYTHING. Brides — you can see NOTHING. Your partner's voice is your only lifeline. First obstacle in 3... 2... 1..."</div>
  </div>
  <div class="bb-role-grid">`;
  data.pairs.forEach(pair => {
    roleCards += `<div class="bb-role-card">
      <div class="bb-role-pair-header">${_icon('ring')} PAIR</div>
      <div class="bb-role-players">
        <div class="bb-role-player">
          ${portrait(pair.guide, 36)}
          <div class="bb-role-info">
            <div class="bb-role-name">${pair.guide}</div>
            <div class="bb-role-tag guide">${_icon('eye')} GUIDE</div>
          </div>
        </div>
        <div class="bb-role-arrow">→</div>
        <div class="bb-role-player">
          ${portrait(pair.blind, 36)}
          <div class="bb-role-info">
            <div class="bb-role-name">${pair.blind}</div>
            <div class="bb-role-tag blind">${_icon('blind')} BLINDFOLDED</div>
          </div>
        </div>
      </div>
    </div>`;
  });
  roleCards += `</div>`;
  steps.push(roleCards);
  stepMeta.push(null);

  // ── Steps 2+: Individual cards per pair per obstacle ──
  for (let oi = 0; oi < OBSTACLE_COUNT; oi++) {
    const obs = OBSTACLES[oi];

    // Track visualization
    let track = '<div class="bb-obstacle-track">';
    for (let ti = 0; ti < OBSTACLE_COUNT; ti++) {
      if (ti > 0) track += `<div class="bb-obs-line${ti <= oi ? ' done' : ''}"></div>`;
      const dotCls = ti < oi ? 'passed' : ti === oi ? 'current' : '';
      const dotContent = ti < oi ? '<div class="bb-obs-check"></div>' : ti === oi ? _icon('blind') : ti === OBSTACLE_COUNT - 1 ? _icon('ring') : `${ti + 1}`;
      track += `<div class="bb-obs-node"><div class="bb-obs-dot ${dotCls}">${dotContent}</div><div class="bb-obs-label">${OBSTACLES[ti].name}</div></div>`;
    }
    track += '</div>';

    // Obstacle divider + track as its own step
    steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">${oi + 1}</div><div class="bb-divider-name">${obs.name}</div></div></div>${track}`);
    stepMeta.push({ type: 'divider', obstacle: oi });

    // Each pair gets its own step(s) for this obstacle
    data.pairs.forEach((pair, pi) => {
      const obsData = data.phase1.obstacles.find(o => o.pairIdx === pi && o.obstacleNum === oi);
      if (!obsData) return;

      const tagCls = obsData.outcome === 'spectacular' ? 'bb-tag-approved' : obsData.outcome === 'success' ? 'bb-tag-obstacle' : obsData.outcome === 'critical-fail' ? 'bb-tag-denied' : 'bb-tag-denied';
      const tagText = obsData.outcome === 'spectacular' ? 'SPECTACULAR' : obsData.outcome === 'success' ? 'CLEARED' : obsData.outcome === 'critical-fail' ? 'DISASTER' : 'FAILED';

      const textPool = obsData.outcome === 'spectacular' ? OBS_SPECTACULAR : obsData.outcome === 'success' ? OBS_SUCCESS : obsData.outcome === 'critical-fail' ? OBS_CRITICAL : OBS_FAIL;
      const narration = pick(textPool)(pair.guide, pair.blind, obs.name);

      const cardCls = obsData.outcome === 'spectacular' || obsData.outcome === 'success' ? 'phase1' : 'sabotage';

      steps.push(`<div class="bb-card ${cardCls}">
        <div class="bb-card-hdr">
          ${portrait(pair.guide, 22)}${portrait(pair.blind, 22)}
          <span class="bb-card-who">${pair.guide} & ${pair.blind}</span>
          <span class="bb-card-tag ${tagCls}">${tagText}</span>
        </div>
        <div class="bb-card-txt">${narration}</div>
        <div class="bb-card-score">Time: ${obsData.time.toFixed(1)}s | Score: ${obsData.score.toFixed(2)}</div>
      </div>`);
      stepMeta.push({ type: 'obstacle', pairIdx: pi, guide: pair.guide, blind: pair.blind, score: obsData.score, time: obsData.time, outcome: obsData.outcome, obstacleNum: oi, obstacleName: obs.name });

      // Trust event card
      if (obsData.trustEvent) {
        const tType = obsData.trustEvent.type;
        // Spite cards only show when the spite actually worked (success/spectacular)
        const spiteButFailed = tType === 'spite' && (obsData.outcome === 'fail' || obsData.outcome === 'critical-fail');
        if (!spiteButFailed) {
          const tCls = tType === 'trust-fall' || tType === 'encourage' ? 'trust' : tType === 'misdirect' ? 'sabotage' : tType === 'spite' ? 'phase2' : 'social';
          const tTag = tType === 'trust-fall' ? 'bb-tag-trust' : tType === 'encourage' ? 'bb-tag-trust' : tType === 'misdirect' ? 'bb-tag-sabotage' : tType === 'spite' ? 'bb-tag-obstacle' : 'bb-tag-social';
          const tLabel = tType === 'spite' ? 'SPITE FUEL' : tType.toUpperCase().replace('-', ' ');
          steps.push(`<div class="bb-card ${tCls}">
            <div class="bb-card-hdr">${portrait(pair.guide, 22)}${portrait(pair.blind, 22)}<span class="bb-card-who">${pair.guide} → ${pair.blind}</span><span class="bb-card-tag ${tTag}">${tLabel}</span></div>
            <div class="bb-card-txt">${obsData.trustEvent.text}</div>
          </div>`);
          stepMeta.push({ type: 'event', eventType: tType, guide: pair.guide, blind: pair.blind });
        }
      }

      // Sabotage event card
      if (obsData.sabotageEvent) {
        const sCls = obsData.sabotageEvent.success ? 'sabotage' : 'trust';
        const sTag = obsData.sabotageEvent.success ? 'bb-tag-sabotage' : 'bb-tag-trust';
        const sLabel = obsData.sabotageEvent.success ? 'SABOTAGE' : 'CAUGHT';
        steps.push(`<div class="bb-card ${sCls}">
          <div class="bb-card-hdr">${portrait(obsData.sabotageEvent.saboteur, 22)}<span class="bb-card-who">${obsData.sabotageEvent.saboteur}</span><span class="bb-card-tag ${sTag}">${sLabel}</span></div>
          <div class="bb-card-txt">${obsData.sabotageEvent.text}</div>
        </div>`);
        stepMeta.push({ type: 'event', eventType: 'sabotage', guide: pair.guide, blind: pair.blind });
      }
    });

    // Chatter between obstacles
    if (oi < OBSTACLE_COUNT - 1 && Math.random() < 0.5) {
      steps.push(`<div class="bb-chatter">${pick(CHATTER)}</div>`);
      stepMeta.push(null);
    }
  }

  window._bbObstacleStepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase1-bg', 'obstacle');
}

export function rpBuildBRBPhase1Results(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-phase1results';
  const steps = [];

  steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">II</div><div class="bb-divider-name">Phase 1 Results</div></div></div>
  <div class="bb-phase-header">
    <div class="bb-phase-num">II</div>
    <div><div class="bb-phase-name">Obstacle Course Results</div>
    <div class="bb-phase-desc">How each pair fared through the blindfold gauntlet.</div></div>
  </div>`);

  // Pair rankings by phase 1 score
  const sorted = [...data.pairs].sort((a, b) => (b.phase1Score || 0) - (a.phase1Score || 0));
  let tableRows = sorted.map((p, i) => {
    const time = p.phase1Time ? p.phase1Time.toFixed(1) : '?';
    const score = p.phase1Score ? p.phase1Score.toFixed(1) : '?';
    return `<tr><td>#${i + 1}</td><td><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">${_miniPassport(p.guide)} ${_miniPassport(p.blind)}</div></td><td>${time}s</td><td>${score}</td></tr>`;
  }).join('');

  steps.push(`<table class="bb-pair-results"><thead><tr><th>Rank</th><th>Pair</th><th>Time</th><th>Score</th></tr></thead><tbody>${tableRows}</tbody></table>`);

  // Social events between phases
  const socialEvts = data.socialEvents.filter(e => ['blame', 'respect', 'trash-talk'].includes(e.type));
  socialEvts.forEach(evt => {
    const cls = evt.type === 'blame' ? 'sabotage' : evt.type === 'respect' ? 'trust' : 'social';
    const tag = evt.type === 'blame' ? 'bb-tag-sabotage' : evt.type === 'respect' ? 'bb-tag-trust' : 'bb-tag-social';
    steps.push(`<div class="bb-card ${cls}">
      <div class="bb-card-hdr">${evt.players.map(p => portrait(p, 22)).join('')}<span class="bb-card-who">${evt.players.join(' & ')}</span><span class="bb-card-tag ${tag}">${evt.type.toUpperCase()}</span></div>
      <div class="bb-card-txt">${evt.text}</div>
    </div>`);
  });

  // Transition chatter
  steps.push(`<div class="bb-chatter">${pick(PHASE_TRANSITION)}</div>`);

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase1-bg', 'phase1results');
}

export function rpBuildBRBTightrope(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-tightrope';
  const steps = [];

  // Phase header with description
  steps.push(`<div class="bb-phase-header">
    <div class="bb-phase-num">III</div>
    <div><div class="bb-phase-name">The Big Drop</div>
    <div class="bb-phase-desc">Carry your partner across. Don't look down.</div></div>
  </div>
  <div class="bb-chatter">${pick(PHASE_TRANSITION)}</div>`);

  // Build tightrope visualization with waterfall streams, sharks, rope, markers
  const _buildTightropeVis = () => {
    // Waterfall side streams (5 per side)
    let leftStreams = '', rightStreams = '';
    for (let i = 0; i < 5; i++) {
      const h = 60 + Math.floor(Math.random() * 80);
      const left = 5 + Math.floor(Math.random() * 25);
      const dur = (1.5 + Math.random() * 2).toFixed(1);
      const delay = (Math.random() * 3).toFixed(1);
      const op = (0.1 + Math.random() * 0.2).toFixed(2);
      leftStreams += `<div class="bb-fall-stream" style="left:${left}px;height:${h}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op};"></div>`;
      rightStreams += `<div class="bb-fall-stream" style="left:${left}px;height:${h}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op};"></div>`;
    }

    // Mist particles (25)
    let mist = '';
    for (let i = 0; i < 25; i++) {
      const sz = 2 + Math.floor(Math.random() * 4);
      const dx = -15 + Math.floor(Math.random() * 30);
      const left = Math.floor(Math.random() * 100);
      const bottom = Math.floor(Math.random() * 20);
      const dur = (4 + Math.random() * 6).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);
      mist += `<div class="bb-mist-dot" style="left:${left}%;bottom:${bottom}%;--msz:${sz}px;--mdx:${dx}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
    }

    // Wind lines (6)
    let windLines = '';
    for (let i = 0; i < 6; i++) {
      const width = 60 + Math.floor(Math.random() * 120);
      const top = Math.floor(Math.random() * 100);
      const dur = (2 + Math.random() * 3).toFixed(1);
      const delay = (Math.random() * 4).toFixed(1);
      windLines += `<div class="bb-wind" style="top:${top}%;width:${width}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
    }

    // Pair markers on rope
    const pairColors = ['var(--bb-gold)', 'var(--bb-blush)', 'var(--bb-shark)', 'var(--bb-stamp)'];
    let markers = '';
    data.pairs.forEach((pair, pi) => {
      const ini = pair.guide.substring(0, 1) + '+' + pair.blind.substring(0, 1);
      const pct = 10 + pi * 22;
      markers += `<div class="bb-rope-marker" style="left:${pct}%;top:2px;">
        <div class="bb-rope-marker-dot" style="border-color:${pairColors[pi] || 'var(--bb-gold)'}">${ini}</div>
        <div class="bb-rope-marker-label">${pair.guide} & ${pair.blind}</div>
      </div>`;
    });

    // Segment labels
    let segLabels = '';
    SEGMENTS.forEach((seg, si) => {
      segLabels += `<div class="bb-seg-label${si >= 3 ? ' danger' : ''}">${seg.name}</div>`;
    });

    return `<div class="bb-tightrope-vis">
      <div class="bb-side-falls left">${leftStreams}</div>
      <div class="bb-side-falls right">${rightStreams}</div>
      <div class="bb-wind-lines">${windLines}</div>
      <div class="bb-mist-layer"></div>
      <div class="bb-mist-particles">${mist}</div>
      <div class="bb-water-layer">
        <div class="bb-shark-fins">
          <svg class="bb-shark-fin-svg swim" style="left:15%;animation-delay:0s" width="20" height="16" viewBox="0 0 20 16"><path d="M10 0 L14 12 L6 12 Z" fill="#4a6878" opacity=".6"/><rect x="0" y="12" width="20" height="4" fill="#2848a0" rx="2"/></svg>
          <svg class="bb-shark-fin-svg bob" style="left:45%;animation-delay:1s" width="20" height="16" viewBox="0 0 20 16"><path d="M10 0 L14 12 L6 12 Z" fill="#4a6878" opacity=".6"/><rect x="0" y="12" width="20" height="4" fill="#2848a0" rx="2"/></svg>
          <svg class="bb-shark-fin-svg swim" style="left:70%;animation-delay:3s" width="20" height="16" viewBox="0 0 20 16"><path d="M10 0 L14 12 L6 12 Z" fill="#4a6878" opacity=".6"/><rect x="0" y="12" width="20" height="4" fill="#2848a0" rx="2"/></svg>
          <svg class="bb-shark-body" style="left:30%;animation-delay:4s" width="80" height="24" viewBox="0 0 80 24"><path d="M0 18 Q10 8 20 12 L35 6 L40 0 L45 6 L60 10 Q70 14 80 18 Z" fill="#4a6878" opacity=".5"/><circle cx="18" cy="14" r="2" fill="#1a1a18" opacity=".6"/><rect x="0" y="18" width="80" height="6" fill="#2848a0" rx="2"/></svg>
        </div>
      </div>
      <svg class="bb-rope-svg" viewBox="0 0 800 60" preserveAspectRatio="none" style="position:relative;z-index:3;">
        <path d="M0 30 Q100 25 200 32 Q300 38 400 28 Q500 22 600 35 Q700 40 800 30" fill="none" stroke="#e8d8b0" stroke-width="3" stroke-dasharray="8 4" opacity=".6">
          <animate attributeName="d" dur="3s" repeatCount="indefinite" values="M0 30 Q100 20 200 36 Q300 42 400 24 Q500 18 600 38 Q700 44 800 28;M0 34 Q100 40 200 24 Q300 18 400 38 Q500 42 600 24 Q700 20 800 34;M0 30 Q100 20 200 36 Q300 42 400 24 Q500 18 600 38 Q700 44 800 28"/>
        </path>
        <line x1="160" y1="15" x2="160" y2="50" stroke="rgba(138,184,208,.15)" stroke-width="1" stroke-dasharray="2 3"/>
        <line x1="320" y1="15" x2="320" y2="50" stroke="rgba(138,184,208,.15)" stroke-width="1" stroke-dasharray="2 3"/>
        <line x1="480" y1="15" x2="480" y2="50" stroke="rgba(138,184,208,.2)" stroke-width="1" stroke-dasharray="2 3"/>
        <line x1="640" y1="15" x2="640" y2="50" stroke="rgba(192,32,32,.2)" stroke-width="1" stroke-dasharray="2 3"/>
      </svg>
      ${markers}
      <div class="bb-seg-labels">${segLabels}</div>
    </div>`;
  };

  // Add tightrope vis as first real step
  steps.push(_buildTightropeVis());
  const stepMeta = [];
  stepMeta.push(null); // vis step

  for (let si = 0; si < TIGHTROPE_SEGMENTS; si++) {
    const seg = SEGMENTS[si];
    const isDanger = si >= 3;
    steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">${si + 1}</div><div class="bb-divider-name">${seg.name}${isDanger ? ' (DANGER)' : ''}</div></div></div>`);
    stepMeta.push(null); // divider

    data.pairs.forEach((pair, pi) => {
      const segData = data.phase2.segments.find(s => s.pairIdx === pi && s.segNum === si);
      if (!segData) return;

      const outTextPool = segData.outcome === 'clean' ? TIGHTROPE_CLEAN : segData.outcome === 'wobble' ? TIGHTROPE_WOBBLE : segData.outcome === 'near-fall' ? TIGHTROPE_NEAR_FALL : TIGHTROPE_FALL;
      const narration = pick(outTextPool)(pair.guide, pair.blind, seg.name);
      const tagCls = segData.outcome === 'clean' ? 'bb-tag-approved' : segData.outcome === 'wobble' ? 'bb-tag-obstacle' : segData.outcome === 'near-fall' ? 'bb-tag-fall' : 'bb-tag-denied';
      const tagText = segData.outcome.toUpperCase().replace('-', ' ');
      const cardCls = segData.outcome === 'fall' ? 'fall' : 'phase2';

      steps.push(`<div class="bb-card ${cardCls}">
        <div class="bb-card-hdr">
          ${portrait(pair.guide, 22)}${portrait(pair.blind, 22)}
          <span class="bb-card-who">${pair.guide} carries ${pair.blind}</span>
          <span class="bb-card-tag ${tagCls}">${tagText}</span>
        </div>
        <div class="bb-card-txt">${narration}</div>
        <div class="bb-card-score">Balance: ${segData.balanceScore.toFixed(2)} | Shark density: ${seg.sharkDensity}</div>
      </div>`);
      stepMeta.push({ type: 'segment', guide: pair.guide, blind: pair.blind, outcome: segData.outcome, balance: segData.balanceScore, segNum: si, shark: !!segData.sharkEncounter, sharkDodged: segData.sharkEncounter?.dodged || false });

      // Shark encounter card
      if (segData.sharkEncounter) {
        const shCls = segData.sharkEncounter.dodged ? 'phase2' : 'sabotage';
        const shTag = segData.sharkEncounter.dodged ? 'bb-tag-approved' : 'bb-tag-shark';
        const shLabel = segData.sharkEncounter.dodged ? 'ESCAPED' : 'SHARK ATTACK';
        steps.push(`<div class="bb-card ${shCls}">
          <div class="bb-card-hdr">${portrait(segData.sharkEncounter.faller, 22)}<span class="bb-card-who">${segData.sharkEncounter.faller}</span><span class="bb-card-tag ${shTag}">${shLabel}</span></div>
          <div class="bb-card-txt">${segData.sharkEncounter.text}</div>
        </div>`);
        stepMeta.push({ type: 'event', eventType: 'shark' });
      }

      // Showmance moment card
      if (segData.showmanceMoment) {
        steps.push(`<div class="bb-card social">
          <div class="bb-card-hdr">${portrait(pair.guide, 22)}${portrait(pair.blind, 22)}<span class="bb-card-who">${pair.guide} & ${pair.blind}</span><span class="bb-card-tag bb-tag-social">SHOWMANCE</span></div>
          <div class="bb-card-txt">${segData.showmanceMoment.text}</div>
        </div>`);
        stepMeta.push({ type: 'event', eventType: 'showmance' });
      }

      if (segData.spiteMoment && segData.outcome !== 'fall' && segData.outcome !== 'near-fall') {
        steps.push(`<div class="bb-card social" style="border-left-color:var(--bb-stamp);">
          <div class="bb-card-hdr">${portrait(pair.guide, 22)}${portrait(pair.blind, 22)}<span class="bb-card-who">${pair.guide} & ${pair.blind}</span><span class="bb-card-tag bb-tag-obstacle">SPITE FUEL</span></div>
          <div class="bb-card-txt">${segData.spiteMoment.text}</div>
        </div>`);
        stepMeta.push({ type: 'event', eventType: 'spite' });
      }
    });

    if (si < TIGHTROPE_SEGMENTS - 1 && Math.random() < 0.4) {
      steps.push(`<div class="bb-chatter">${pick(CHATTER)}</div>`);
      stepMeta.push(null);
    }
  }

  window._bbTightropeStepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase2-bg', 'tightrope');
}

export function rpBuildBRBPhase2Results(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-phase2results';
  const steps = [];

  steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">III</div><div class="bb-divider-name">Phase 2 Results</div></div></div>
  <div class="bb-phase-header">
    <div class="bb-phase-num">III</div>
    <div><div class="bb-phase-name">Tightrope Results</div>
    <div class="bb-phase-desc">Who kept their balance over the abyss.</div></div>
  </div>`);

  const sorted = [...data.pairs].sort((a, b) => ((b.phase1Score || 0) + (b.phase2Score || 0)) - ((a.phase1Score || 0) + (a.phase2Score || 0)));
  let tableRows = sorted.map((p, i) => {
    const p1 = p.phase1Score ? p.phase1Score.toFixed(1) : '?';
    const p2 = p.phase2Score ? p.phase2Score.toFixed(1) : '?';
    const total = ((p.phase1Score || 0) + (p.phase2Score || 0)).toFixed(1);
    return `<tr><td>#${i + 1}</td><td><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">${_miniPassport(p.guide)} ${_miniPassport(p.blind)}</div></td><td>${p1}</td><td>${p2}</td><td>${total}</td></tr>`;
  }).join('');

  steps.push(`<table class="bb-pair-results"><thead><tr><th>Rank</th><th>Pair</th><th>P1</th><th>P2</th><th>Total</th></tr></thead><tbody>${tableRows}</tbody></table>`);

  // Social events between phase 2 → 3
  const socialEvts = data.socialEvents.filter(e => ['rescue', 'shark-bonding', 'alliance-whisper'].includes(e.type));
  socialEvts.forEach(evt => {
    const cls = evt.type === 'rescue' ? 'trust' : evt.type === 'shark-bonding' ? 'social' : 'phase2';
    const tag = evt.type === 'rescue' ? 'bb-tag-trust' : evt.type === 'shark-bonding' ? 'bb-tag-social' : 'bb-tag-obstacle';
    steps.push(`<div class="bb-card ${cls}">
      <div class="bb-card-hdr">${evt.players.map(p => portrait(p, 22)).join('')}<span class="bb-card-who">${evt.players.join(' & ')}</span><span class="bb-card-tag ${tag}">${evt.type.toUpperCase().replace('-', ' ')}</span></div>
      <div class="bb-card-txt">${evt.text}</div>
    </div>`);
  });

  steps.push(`<div class="bb-chatter">${pick(PHASE_TRANSITION)}</div>`);

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase2-bg', 'phase2results');
}

export function rpBuildBRBCustomsTrivia(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-customs';
  const steps = [];
  const stepMeta = [];
  const PASS_THRESHOLD = CUSTOMS_PASS_THRESHOLD;

  // Phase header
  steps.push(`<div class="bb-phase-header">
    <div class="bb-phase-num">IV</div>
    <div><div class="bb-phase-name">The Border</div>
    <div class="bb-phase-desc">Answer correctly about your partner. Or be denied entry.</div></div>
  </div>`);
  stepMeta.push(null);

  // Passport desk
  const passportDeskSvg = `<svg class="bb-desk-svg" width="200" height="120" viewBox="0 0 200 120">
    <rect x="10" y="50" width="180" height="60" rx="4" fill="#6a5a3a" opacity=".3"/>
    <rect x="10" y="50" width="180" height="4" rx="2" fill="#a08848" opacity=".2"/>
    <rect x="30" y="65" width="40" height="30" rx="3" fill="#2a2020" opacity=".4"/>
    <rect x="35" y="70" width="30" height="20" rx="2" fill="#c02020" opacity=".2"/>
    <rect x="120" y="60" width="50" height="35" rx="2" fill="#183860" opacity=".3"/>
    <rect x="125" y="65" width="40" height="10" rx="1" fill="#d4a830" opacity=".15"/>
    <line x1="90" y1="95" x2="110" y2="60" stroke="#1a1a18" stroke-width="2" opacity=".2"/>
  </svg>`;
  steps.push(`<div class="bb-passport-desk">
    ${passportDeskSvg}
    <div class="bb-chatter">"Welcome to customs. Passports and knowledge of your spouse, please." -- ${host()}</div>
  </div>`);
  stepMeta.push(null);

  // ── QUESTIONS: question card → answer card ──
  for (let qi = 0; qi < TRIVIA_QUESTIONS; qi++) {
    steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">Q${qi + 1}</div><div class="bb-divider-name">QUESTION ${qi + 1}</div></div></div>`);
    stepMeta.push(null);

    data.pairs.forEach((pair, pi) => {
      const qData = data.phase3.questions.find(q => q.pairIdx === pi && q.questionNum === qi);
      if (!qData) return;

      // Step A: QUESTION card (suspense — who's answering, about whom)
      const questionText = pick(TRIVIA_QUESTION_PROMPTS)(qData.answerer, qData.partner);
      steps.push(`<div class="bb-card phase3" style="position:relative;">
        <div class="bb-card-hdr">
          ${portrait(qData.answerer, 22)}${portrait(qData.partner, 22)}
          <span class="bb-card-who">${qData.answerer} → ${qData.partner}</span>
          <span class="bb-card-tag bb-tag-trivia">Q${qi + 1}</span>
        </div>
        <div class="bb-card-txt">${questionText}</div>
        <div class="bb-card-score">Difficulty: ${qData.difficulty}</div>
      </div>`);
      stepMeta.push({ type: 'question', pairIdx: pi, guide: pair.guide, blind: pair.blind, answerer: qData.answerer, partner: qData.partner, qNum: qi });

      // Step B: ANSWER card (result + stamp animation)
      const cardCls = qData.correct ? 'stamp-pass' : 'stamp-fail';
      const tagCls = qData.correct ? 'bb-tag-approved' : 'bb-tag-denied';
      const tagText = qData.correct ? 'CORRECT' : 'WRONG';
      const textPool = qData.correct ? (qData.rivalryCorrect && Math.random() < 0.6 ? TRIVIA_RIVALRY_CORRECT : TRIVIA_CORRECT) : qData.spectacularWrong ? TRIVIA_SPECTACULAR_WRONG : TRIVIA_WRONG;
      const narration = pick(textPool)(qData.answerer, qData.partner);
      const stampText = qData.correct ? 'APPROVED' : 'DENIED';
      const stampCls = qData.correct ? 'bb-stamp-pass' : 'bb-stamp-deny';

      const splatColor = qData.correct ? '#3a8850' : 'var(--bb-stamp)';
      let splatters = '<div class="bb-ink-splatter">';
      [{ w:4,h:4,sx:-20,sy:-12,delay:'' },{ w:3,h:3,sx:15,sy:-8,delay:'animation-delay:.45s' },{ w:5,h:5,sx:-12,sy:10,delay:'animation-delay:.5s' },{ w:2,h:2,sx:18,sy:14,delay:'animation-delay:.48s' },{ w:3,h:3,sx:8,sy:-18,delay:'animation-delay:.42s' }].forEach(s => {
        splatters += `<div class="bb-splat" style="width:${s.w}px;height:${s.h}px;background:${splatColor};--sx:${s.sx}px;--sy:${s.sy}px;${s.delay}"></div>`;
      });
      splatters += '</div>';

      let inkDrip = '';
      if (!qData.correct) {
        inkDrip = `<div class="bb-ink-drip" style="top:60%;left:${48 + Math.floor(Math.random() * 10)}%;">
          <div class="bb-drip" style="--dh:${18 + Math.floor(Math.random() * 8)}px;left:0"></div>
          <div class="bb-drip" style="--dh:${12 + Math.floor(Math.random() * 8)}px;left:6px;animation-delay:1.2s"></div>
        </div>`;
      }

      steps.push(`<div class="bb-card ${cardCls}" style="position:relative;">
        <div class="bb-card-hdr">
          ${portrait(qData.answerer, 22)}${portrait(qData.partner, 22)}
          <span class="bb-card-who">${qData.answerer} answers for ${qData.partner}</span>
          <span class="bb-card-tag ${tagCls}">${tagText}</span>
        </div>
        <div class="bb-card-txt">${narration}</div>
        <div class="bb-stamp-overlay ${stampCls}">${stampText}</div>
        ${splatters}
        ${inkDrip}
        <div class="bb-card-score">Score: ${qData.score.toFixed(2)}</div>
      </div>`);
      stepMeta.push({ type: 'answer', pairIdx: pi, guide: pair.guide, blind: pair.blind, answerer: qData.answerer, correct: qData.correct, qNum: qi });
    });

    // Chatter between questions
    if (qi < TRIVIA_QUESTIONS - 1 && Math.random() < 0.5) {
      steps.push(`<div class="bb-chatter">${pick(CHATTER)}</div>`);
      stepMeta.push(null);
    }
  }

  // ── FINAL VERDICT PER PAIR ──
  steps.push(`<div class="bb-divider"><div class="bb-divider-line"></div><div class="bb-divider-text"><div class="bb-divider-num">★</div><div class="bb-divider-name">FINAL VERDICT</div></div></div>`);
  stepMeta.push(null);

  const VERDICT_APPROVED = [
    (g, b, n) => `${n}/${TRIVIA_QUESTIONS} correct. The customs officer nods slowly. "${g}, ${b}... you may pass." The gate swings open.`,
    (g, b, n) => `With ${n} right answers, the border opens. ${g} and ${b} stumble through, barely believing they made it.`,
    (g, b, n) => `"${n} out of ${TRIVIA_QUESTIONS}. Acceptable." The officer stamps their passports. ${g} grabs ${b}'s hand and they sprint through.`,
    (g, b, n) => `The customs officer reviews the tally: ${n}/${TRIVIA_QUESTIONS}. A reluctant smile. APPROVED. ${g} and ${b} are through.`,
  ];
  const VERDICT_DENIED = [
    (g, b, n) => `Only ${n}/${TRIVIA_QUESTIONS} correct. The customs officer slams the gate shut. "${g}, ${b}... you are DENIED." The floor drops out.`,
    (g, b, n) => `${n} right answers. Not enough. The officer stamps DENIED so hard the desk cracks. ${g} and ${b} plummet toward the sharks.`,
    (g, b, n) => `"${n} out of ${TRIVIA_QUESTIONS}? Pathetic." The trapdoor opens. ${g} and ${b} drop screaming toward the water below.`,
    (g, b, n) => `The customs officer doesn't even look up. ${n}/${TRIVIA_QUESTIONS}. DENIED. ${g} barely has time to grab ${b} before they're falling.`,
  ];
  const VERDICT_PERFECT = [
    (g, b) => `PERFECT SCORE. The customs officer stands and salutes. ${g} and ${b} are waved through with full honors. The other pairs watch in awe.`,
    (g, b) => `${TRIVIA_QUESTIONS}/${TRIVIA_QUESTIONS}. Flawless. The gate doesn't just open — it swings wide with a golden light. ${g} and ${b} walk through like royalty.`,
    (g, b) => `Every. Single. Answer. Correct. The customs officer actually smiles. First time all season. ${g} and ${b} earned this.`,
    (g, b) => `"I've never seen a perfect score." The officer stamps both passports with shaking hands. ${g} and ${b} are legends.`,
  ];
  const VERDICT_ZERO = [
    (g, b) => `Zero. ZERO correct. The customs officer can't even speak. ${g} and ${b} don't know a single thing about each other. The trapdoor opens with a vengeance.`,
    (g, b) => `0/${TRIVIA_QUESTIONS}. The customs officer stamps DENIED five times just to make a point. ${g} and ${b} deserve those sharks.`,
    (g, b) => `Not one. Not a single correct answer. The customs officer personally pushes ${g} and ${b} through the trapdoor. The sharks are waiting.`,
    (g, b) => `"This is the worst performance in customs history." ${g} and ${b} hear the trapdoor click before the officer even finishes stamping DENIED.`,
  ];

  data.pairs.forEach((pair, pi) => {
    const pairQs = data.phase3.questions.filter(q => q.pairIdx === pi);
    const correct = pairQs.filter(q => q.correct).length;
    const passed = correct >= PASS_THRESHOLD;

    let verdictText;
    if (correct === TRIVIA_QUESTIONS) verdictText = pick(VERDICT_PERFECT)(pair.guide, pair.blind);
    else if (correct === 0) verdictText = pick(VERDICT_ZERO)(pair.guide, pair.blind);
    else if (passed) verdictText = pick(VERDICT_APPROVED)(pair.guide, pair.blind, correct);
    else verdictText = pick(VERDICT_DENIED)(pair.guide, pair.blind, correct);

    const vstampText = passed ? 'APPROVED' : 'DENIED';
    const vstampCls = passed ? 'bb-stamp-pass' : 'bb-stamp-deny';
    const verdictCls = passed ? 'stamp-pass bb-verdict-approved' : 'stamp-fail bb-verdict-denied';
    const vtagCls = passed ? 'bb-tag-approved' : 'bb-tag-denied';

    const vsplatColor = passed ? '#3a8850' : 'var(--bb-stamp)';
    let vsplatters = '<div class="bb-ink-splatter">';
    [{ w:6,h:6,sx:-25,sy:-15,delay:'' },{ w:4,h:4,sx:20,sy:-10,delay:'animation-delay:.45s' },{ w:7,h:7,sx:-15,sy:14,delay:'animation-delay:.5s' },{ w:3,h:3,sx:22,sy:18,delay:'animation-delay:.48s' },{ w:5,h:5,sx:10,sy:-22,delay:'animation-delay:.42s' },{ w:4,h:4,sx:-8,sy:20,delay:'animation-delay:.55s' }].forEach(s => {
      vsplatters += `<div class="bb-splat" style="width:${s.w}px;height:${s.h}px;background:${vsplatColor};--sx:${s.sx}px;--sy:${s.sy}px;${s.delay}"></div>`;
    });
    vsplatters += '</div>';

    let inkDrips = '';
    if (!passed) {
      inkDrips = `<div class="bb-ink-drip" style="top:55%;left:${35 + Math.floor(Math.random() * 15)}%;">
        <div class="bb-drip" style="--dh:${22 + Math.floor(Math.random() * 12)}px;left:0"></div>
        <div class="bb-drip" style="--dh:${16 + Math.floor(Math.random() * 10)}px;left:6px;animation-delay:1.2s"></div>
        <div class="bb-drip" style="--dh:${12 + Math.floor(Math.random() * 8)}px;left:14px;animation-delay:1.5s"></div>
      </div>`;
    }

    const scoreBar = `<div class="bb-verdict-tally">${Array.from({length: TRIVIA_QUESTIONS}, (_, i) => {
      const q = pairQs.find(q => q.questionNum === i);
      return `<div class="bb-verdict-q ${q?.correct ? 'correct' : 'wrong'}">${q?.correct ? '✓' : '✗'}</div>`;
    }).join('')}</div>`;

    // Passport card with both players
    const passportPair = `<div style="display:flex;gap:8px;justify-content:center;margin:8px 0;">
      <div class="bb-passport" style="transform:rotate(-2deg);width:180px;">
        <div class="bb-passport-stamp">${vstampText}</div>
        <div class="bb-passport-inner">
          <div class="bb-passport-av">${portrait(pair.guide, 50)}</div>
          <div class="bb-passport-info"><div class="bb-passport-name">${pair.guide}</div><div class="bb-passport-badge">GROOM</div></div>
        </div>
        <div class="bb-passport-lines"><div class="bb-passport-line"></div><div class="bb-passport-line"></div></div>
      </div>
      <div class="bb-passport" style="transform:rotate(2deg);width:180px;">
        <div class="bb-passport-stamp">${vstampText}</div>
        <div class="bb-passport-inner">
          <div class="bb-passport-av">${portrait(pair.blind, 50)}</div>
          <div class="bb-passport-info"><div class="bb-passport-name">${pair.blind}</div><div class="bb-passport-badge">BRIDE</div></div>
        </div>
        <div class="bb-passport-lines"><div class="bb-passport-line"></div><div class="bb-passport-line"></div></div>
      </div>
    </div>`;

    steps.push(`<div class="bb-card ${verdictCls}" style="position:relative;overflow:hidden;padding-bottom:16px;">
      <div class="bb-card-hdr">
        ${portrait(pair.guide, 28)}${portrait(pair.blind, 28)}
        <span class="bb-card-who">${pair.guide} & ${pair.blind}</span>
        <span class="bb-card-tag ${vtagCls}">${vstampText}</span>
      </div>
      ${scoreBar}
      ${passportPair}
      <div class="bb-card-txt" style="font-size:13px;">${verdictText}</div>
      <div class="bb-stamp-overlay bb-stamp-verdict ${vstampCls}" style="font-size:36px;animation-delay:.5s;">${vstampText}</div>
      ${vsplatters}
      ${inkDrips}
      ${!passed ? `<div class="bb-verdict-shark-drop">
        <svg width="60" height="36" viewBox="0 0 60 36" class="bb-verdict-shark-svg"><path d="M5 24 Q15 10 30 18 Q45 10 55 24 L58 30 Q30 34 2 30 Z" fill="#4a6a8a" opacity=".6"/><path d="M27 0 L30 18 L33 0 Z" fill="#6a8aaa" opacity=".5"/><circle cx="22" cy="20" r="1.5" fill="#1a1a18" opacity=".4"/></svg>
        <div style="font-family:'Permanent Marker',cursive;font-size:11px;color:var(--bb-stamp);opacity:.7;margin-top:4px;letter-spacing:1px;">TO THE SHARKS</div>
      </div>` : ''}
    </div>`);
    stepMeta.push({ type: 'verdict', pairIdx: pi, guide: pair.guide, blind: pair.blind, correct, passed });
  });

  steps.push(`<div class="bb-chatter">${pick([
    `The customs gate is closed. No more appeals.`,
    `Passports stamped. Fates sealed. The border doesn't negotiate.`,
    `Some walked through. Some fell through. That's customs.`,
    `The officer closes the booth. Another day at the border.`,
  ])}</div>`);
  stepMeta.push(null);

  window._bbCustomsStepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, 'bb-phase3-bg', 'customs');
}

export function rpBuildBRBFinalResults(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const stKey = 'bb-results';
  const steps = [];

  // Build full results ranking
  const sorted = [...data.pairScores];
  const winner = sorted[0];

  steps.push(`<div class="bb-phase-header"><span class="bb-phase-num">${_icon('crown')}</span><span class="bb-phase-name">Final Results</span></div>`);

  // Full ranking table
  let tableRows = sorted.map((ps, i) => {
    const isWinner = i === 0;
    const style = isWinner ? 'color:var(--bb-gold);font-weight:700;' : '';
    return `<tr style="${style}"><td>#${i + 1}</td><td><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">${_miniPassport(ps.guide)} ${_miniPassport(ps.blind)}${ps.crasher ? ` <span style="font-size:8px;color:var(--bb-stamp);">(+${ps.crasher})</span>` : ''}</div></td><td>${ps.phase1Score}</td><td>${ps.phase2Score}</td><td>${ps.phase3Score}</td><td>${ps.totalScore}</td></tr>`;
  }).join('');

  steps.push(`<table class="bb-pair-results"><thead><tr><th>#</th><th>Pair</th><th>P1</th><th>P2</th><th>P3</th><th>Total</th></tr></thead><tbody>${tableRows}</tbody></table>`);

  // ── Confetti (40 pieces, matching mockup) ──
  let confetti = '';
  const confettiColors = ['var(--bb-gold)', 'var(--bb-hotpink)', 'var(--bb-mist)', 'var(--bb-blush)', '#3a8850', 'var(--bb-champagne)'];
  for (let i = 0; i < 40; i++) {
    const left = Math.floor(Math.random() * 100);
    const w = 4 + Math.floor(Math.random() * 6);
    const h = 6 + Math.floor(Math.random() * 8);
    const dur = 3 + Math.random() * 4;
    const delay = Math.random() * 3;
    const rot = Math.floor(Math.random() * 360);
    const sx = -20 + Math.floor(Math.random() * 40);
    const cc = pick(confettiColors);
    confetti += `<div class="bb-confetti" style="left:${left}%;--cw:${w}px;--ch:${h}px;--cc:${cc};--cr:${rot}deg;--csx:${sx}px;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s;"></div>`;
  }

  // ── Fireworks (3 locations, each with ring + 8 trail particles) ──
  let fireworks = '';
  const fwPositions = [
    { left: '15%', top: '20%', color: 'var(--bb-gold)', delay: '0s' },
    { left: '50%', top: '10%', color: 'var(--bb-hotpink)', delay: '0.8s' },
    { left: '80%', top: '25%', color: 'var(--bb-mist)', delay: '1.5s' },
  ];
  fwPositions.forEach(fw => {
    // Ring burst
    fireworks += `<div class="bb-firework ring" style="left:${fw.left};top:${fw.top};--fw-color:${fw.color};animation-delay:${fw.delay};"></div>`;
    // 8 trail particles radiating outward
    for (let t = 0; t < 8; t++) {
      const angle = (t / 8) * Math.PI * 2;
      const dist = 30 + Math.floor(Math.random() * 20);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      fireworks += `<div class="bb-firework trail" style="left:${fw.left};top:${fw.top};--fw-color:${fw.color};--tx:${tx.toFixed(0)}px;--ty:${ty.toFixed(0)}px;animation-delay:${fw.delay};"></div>`;
    }
  });

  // ── Crown SVG (matching mockup) ──
  const crownSvg = `<div class="bb-results-crown-icon">
    <svg width="48" height="36" viewBox="0 0 48 36">
      <path d="M4 28 L4 14 L12 22 L18 6 L24 18 L30 6 L36 22 L44 14 L44 28 Z"
        fill="var(--bb-gold)" stroke="var(--bb-gold-dk)" stroke-width="1.5"/>
      <circle cx="18" cy="8" r="3" fill="var(--bb-gold-lt)"/>
      <circle cx="30" cy="8" r="3" fill="var(--bb-gold-lt)"/>
      <circle cx="24" cy="18" r="2.5" fill="var(--bb-hotpink)" opacity=".7"/>
      <rect x="4" y="28" width="40" height="4" rx="1" fill="var(--bb-gold-dk)"/>
      <animate attributeName="opacity" values="1;.8;1" dur="2s" repeatCount="indefinite"/>
    </svg>
  </div>`;

  // ── Animated interlocking rings SVG (matching mockup) ──
  const ringsSvg = `<div class="bb-results-rings-icon">
    <svg width="40" height="24" viewBox="0 0 40 24">
      <circle cx="14" cy="12" r="9" fill="none" stroke="var(--bb-gold)" stroke-width="2.5">
        <animate attributeName="r" values="9;10;9" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="26" cy="12" r="9" fill="none" stroke="var(--bb-hotpink)" stroke-width="2.5">
        <animate attributeName="r" values="9;10;9" dur="2s" repeatCount="indefinite"/>
      </circle>
      <path d="M14 3 L16 6 L14 9 L12 6 Z" fill="var(--bb-gold-lt)" opacity=".6">
        <animate attributeName="opacity" values=".6;1;.6" dur="1.5s" repeatCount="indefinite"/>
      </path>
    </svg>
  </div>`;

  // Winner announcement with halos, fireworks, confetti
  steps.push(`<div class="bb-results">
    <div class="bb-confetti-layer">${confetti}</div>
    <div class="bb-fireworks">${fireworks}</div>
    ${crownSvg}
    <div class="bb-results-title">IMMUNITY WINNERS</div>
    <div class="bb-results-pair">
      <div class="bb-results-halo">
        ${_passportCard(winner.guide, -5)}
      </div>
      ${ringsSvg}
      <div class="bb-results-halo">
        ${_passportCard(winner.blind, 5)}
      </div>
    </div>
    <div class="bb-results-score">Combined Score: ${winner.totalScore} &middot; Phase 1: ${winner.phase1Score} &middot; Phase 2: ${winner.phase2Score} &middot; Phase 3: ${winner.phase3Score}</div>
    <div class="bb-results-immune">BOTH IMMUNE</div>
  </div>`);

  // ── Standings grid (2nd, 3rd, last place cards) ──
  const others = sorted.slice(1);
  let standingsHtml = '<div class="bb-standings-grid">';
  others.forEach((ps, i) => {
    const place = i + 2;
    const isLast = i === others.length - 1;
    const placeLabel = isLast ? 'Last Place' : `${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place`;
    const avBorder = isLast ? 'border-color:var(--bb-stamp);' : '';

    standingsHtml += `<div class="bb-standing-card${isLast ? ' last' : ''}">
      <div class="bb-standing-place">${placeLabel}</div>
      <div class="bb-standing-avatars" style="flex-direction:column;gap:4px;">
        ${_miniPassport(ps.guide)}
        ${_miniPassport(ps.blind)}
      </div>
      <div class="bb-standing-score">Score: ${ps.totalScore}</div>
    </div>`;
  });
  standingsHtml += '</div>';

  steps.push(standingsHtml);

  // Host closing
  steps.push(`<div class="bb-host-announce">
    <div class="bb-host-label">${host()} speaks</div>
    <div class="bb-host-text">"${winner.guide} and ${winner.blind}, you may now kiss the immunity idol. The rest of you... tribal council awaits."</div>
  </div>`);

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('bb-', '');
  const stepsHtml = steps.map((s, i) => `<div id="bb-step-${suffix}-${i}" class="bb-step${st.idx >= i ? ' bb-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    ${stepsHtml}
    <div id="bb-controls-${suffix}" class="bb-controls">
      <button class="bb-btn" onclick="bbRevealNext('${stKey}',${steps.length})">REVEAL NEXT</button>
      <span id="bb-counter-${suffix}" class="bb-counter">${st.idx >= 0 ? Math.min(st.idx + 1, steps.length) : 0} / ${steps.length}</span>
      <button class="bb-btn" onclick="bbRevealAll('${stKey}',${steps.length})">REVEAL ALL</button>
    </div>
  `, ep, '', 'results');
}

// js/chal/aftermayhem.js — Aftermayhem: board game gauntlet for eliminated players to return
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * 2 * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

function canTrashTalk(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// CHALLENGE TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════
const CHALLENGE_TYPES = [
  { id: 'obstacle', name: 'Obstacle Remix', primary: 'physical', secondary: 'endurance' },
  { id: 'trivia',   name: 'Season Trivia',  primary: 'mental',   secondary: 'intuition' },
  { id: 'feast',    name: "Chef's Revenge",  primary: 'boldness', secondary: 'endurance' },
  { id: 'laser',    name: 'Laser Callback',  primary: 'physical', secondary: 'intuition' },
  { id: 'crowd',    name: 'Crowd Convince',  primary: 'social',   secondary: 'strategic' },
  { id: 'puzzle',   name: 'Puzzle Bomb',     primary: 'mental',   secondary: 'strategic' },
  { id: 'memory',   name: 'Memory Maze',     primary: 'intuition',secondary: 'mental' },
  { id: 'roast',    name: 'Improv Roast',    primary: 'social',   secondary: 'boldness' },
  { id: 'creature', name: 'Creature Brawl',  primary: 'physical', secondary: 'boldness' },
  { id: 'trap',     name: 'Trap Sprint',     primary: 'endurance',secondary: 'intuition' },
];

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── Lottery reactions ──
const LOTTERY_WIN = {
  villain:    [(n,pr) => `${n} cracks open the can and a golden Chris head stares back. ${pr.Sub} smirks. "Obviously."`, (n,pr) => `Gold glints in ${n}'s can. ${pr.Sub} holds it up for everyone to see. "Miss me?"`, (n,pr) => `${n} finds the golden head and laughs. "The universe knows talent when it sees it."`, (n,pr) => `${n} pulls out the golden Chris and kisses it. "Revenge is a dish best served on a game board."`],
  mastermind: [(n,pr) => `${n} opens the can with surgical calm. Gold. ${pr.Sub} calculated the odds and they paid off.`, (n,pr) => `A golden Chris head. ${n} nods once. This was always the plan.`, (n,pr) => `${n} turns the golden head over in ${pr.posAdj} hands. "Interesting. Very interesting."`, (n,pr) => `${n} finds gold and ${pr.posAdj} expression doesn't change. ${pr.Sub} expected this.`],
  schemer:    [(n,pr) => `${n} shakes the can and gold tumbles out. ${pr.Sub} was already planning ${pr.posAdj} comeback.`, (n,pr) => `Golden Chris in hand, ${n} whispers, "They have no idea what's coming."`, (n,pr) => `${n} finds the golden head and tucks it away. Eyes already scanning the competition.`, (n,pr) => `${n} opens the can with trembling hands. Gold. ${pr.Sub} bites ${pr.posAdj} lip to contain the grin.`],
  hero:       [(n,pr) => `${n} opens the can and gasps. A golden Chris head! "I... I'm getting another chance!"`, (n,pr) => `Gold! ${n}'s eyes go wide. ${pr.Sub} clutches the head to ${pr.posAdj} chest. "Thank you."`, (n,pr) => `${n} finds gold and immediately looks to ${pr.posAdj} friends in the crowd. They're cheering.`, (n,pr) => `The golden Chris head gleams in ${n}'s hands. ${pr.Sub} takes a deep breath. "I won't waste this."`],
  underdog:   [(n,pr) => `${n} stares at the golden Chris head. Blinks. Stares again. "Wait... me?!"`, (n,pr) => `Nobody — NOBODY — expected ${n} to find gold. Least of all ${n}. "Is this real?!"`, (n,pr) => `${n}'s hands are shaking. The golden head almost slips. "I never win anything!"`, (n,pr) => `The peanut gallery erupts when ${n} reveals the golden head. The ultimate underdog story begins.`],
  goat:       [(n,pr) => `${n} fumbles the can open. Something gold falls out. ${pr.Sub} picks it up. "Huh. I won?"`, (n,pr) => `${n} almost throws the golden head away thinking it's trash. "Wait — THAT'S the prize?!"`, (n,pr) => `${n} opens the can upside down. The golden head bounces off ${pr.posAdj} foot. "Ow! ...Oh! I won!"`, (n,pr) => `${n} needs help opening the can. When gold tumbles out, ${pr.sub} laughs in disbelief.`],
  default:    [(n,pr) => `${n} cracks the can open. Gold! ${pr.Sub} pumps ${pr.posAdj} fist. "Let's go!"`, (n,pr) => `A golden Chris head tumbles from ${n}'s can. ${pr.Sub} grins. Time for a comeback.`, (n,pr) => `${n} finds gold and the crowd roars. ${pr.Sub} holds it high. "I'm back in this!"`, (n,pr) => `Gold in hand, ${n} stands up. ${pr.Sub} scans the other winners. The race is on.`],
};

const LOTTERY_LOSE = [
  (n,pr) => `${n} opens the can. Empty. ${pr.Sub} tosses it aside without a word.`,
  (n,pr) => `Nothing but air in ${n}'s can. ${pr.Sub} sighs and sinks back into ${pr.posAdj} seat.`,
  (n,pr) => `${n} shakes the can. Rattles. Empty. ${pr.PosAdj} face falls.`,
  (n,pr) => `No gold for ${n}. ${pr.Sub} tries to look unbothered. Fails.`,
  (n,pr) => `${n} opens the can and turns it upside down. Nothing. "Figures."`,
  (n,pr) => `Empty can. ${n} crushes it in ${pr.posAdj} hand. The metal crumples like ${pr.posAdj} hopes.`,
];

// ── Challenge narration ──
const CHALLENGE_PASS = {
  obstacle: [(n,pr) => `${n} launches over the hurdles and slides under the barriers. Clean run.`, (n,pr) => `${n} attacks the obstacle course with everything ${pr.sub} has. Fast, clean, relentless.`, (n,pr) => `${n} clears every obstacle without breaking stride. The crowd is impressed.`, (n,pr) => `${n} navigates the course like ${pr.sub} designed it. Every jump, every dodge — perfect.`],
  trivia:   [(n,pr) => `${n} rattles off answers like a season encyclopedia. Boot order, challenge wins, tribe swaps — all correct.`, (n,pr) => `"Who was voted out third?" ${n} doesn't even hesitate. "Easy."`, (n,pr) => `${n} nails every question. ${pr.Sub}'s been paying attention from the peanut gallery.`, (n,pr) => `The trivia buzzer barely rings before ${n} has the answer. Flawless recall.`],
  feast:    [(n,pr) => `${n} stares down the mystery slop and swallows it whole. Chef nods approvingly.`, (n,pr) => `${n} doesn't even flinch at the dish. Down the hatch. "Is that all you got, Chef?"`, (n,pr) => `${n} powers through the feast challenge. Not pretty, but effective.`, (n,pr) => `${n} holds ${pr.posAdj} nose and chugs. The crowd gasps. ${pr.Sub} keeps it down.`],
  laser:    [(n,pr) => `${n} weaves through the laser grid like a shadow. Not a single beam touched.`, (n,pr) => `${n} drops low, slides sideways, and slips through the tightest gap in the grid. Clean.`, (n,pr) => `The lasers can't touch ${n}. ${pr.Sub} moves through the course with cat-like precision.`, (n,pr) => `${n} reads the laser pattern and times ${pr.posAdj} dash perfectly. Through and through.`],
  crowd:    [(n,pr) => `${n} makes ${pr.posAdj} case with passion. The judge is visibly moved.`, (n,pr) => `"I deserve this because—" ${n} pauses, then delivers a speech that silences the room.`, (n,pr) => `${n} looks the judge in the eye. Every word lands. Convincing.`, (n,pr) => `${n}'s plea is raw, honest, and effective. Even the peanut gallery is nodding.`],
  puzzle:   [(n,pr) => `${n} stares at the pieces, then ${pr.posAdj} hands start moving. Click, click, click. Solved.`, (n,pr) => `${n} works the puzzle with focused intensity. The last piece slides in with seconds to spare.`, (n,pr) => `The puzzle falls into place under ${n}'s fingers. ${pr.Sub} steps back. Done.`, (n,pr) => `${n} cracks the pattern and assembles the puzzle in record time. Impressive.`],
  memory:   [(n,pr) => `${n} navigates the memory maze without a wrong turn. Every season detail locked in.`, (n,pr) => `"Left, right, left, straight." ${n} recites the path from memory. Perfect run.`, (n,pr) => `${n} traces the maze route with ${pr.posAdj} finger, then runs it flawlessly.`, (n,pr) => `The memory maze can't stump ${n}. ${pr.Sub} knows this season inside and out.`],
  roast:    [(n,pr) => `${n} delivers a roast so savage the host can't keep a straight face.`, (n,pr) => `${n} steps to the mic. Three jokes. Three kills. The peanut gallery is howling.`, (n,pr) => `"And another thing—" ${n} hits the punchline and the entire room erupts.`, (n,pr) => `${n}'s roast is sharp, personal, and perfectly timed. Standing ovation from the gallery.`],
  creature: [(n,pr) => `${n} dodges the animatronic's first swipe and counters with a solid hit. Down it goes.`, (n,pr) => `${n} squares up against the creature and doesn't back down. Hits land. The bot sputters.`, (n,pr) => `The creature lunges. ${n} sidesteps and shoves it into the wall. Victory.`, (n,pr) => `${n} wrestles the animatronic to a standstill. Sparks fly. ${n} wins.`],
  trap:     [(n,pr) => `${n} sees the trapdoors opening and adjusts mid-stride. Not a single fall.`, (n,pr) => `${n} sprints through the trap course with ${pr.posAdj} eyes on the ground. Every step calculated.`, (n,pr) => `The floor drops away but ${n} keeps running. Pure instinct and endurance.`, (n,pr) => `${n} reads the trap pattern and blitzes through. The course can't keep up.`],
};

const CHALLENGE_STRUGGLE = {
  obstacle: [(n,pr) => `${n} clips the first hurdle and stumbles. The rest of the course is a scramble.`, (n,pr) => `${n} tries to vault the wall and faceplants. The crowd winces.`, (n,pr) => `${n} gets tangled in the rope section. Precious seconds lost.`, (n,pr) => `The obstacle course eats ${n} alive. Every section is a struggle.`],
  trivia:   [(n,pr) => `${n} blanks on the first question. And the second. "I was eliminated early, okay?!"`, (n,pr) => `"Who formed the first alliance?" ${n} guesses wrong. Badly wrong.`, (n,pr) => `${n} mixes up the boot order and the alliance names. It's painful to watch.`, (n,pr) => `${n} stares at the question card. Nothing. The buzzer sounds.`],
  feast:    [(n,pr) => `${n} takes one look at Chef's creation and gags. Getting it down is going to be a war.`, (n,pr) => `${n} chews slowly. Very slowly. The taste is winning this fight.`, (n,pr) => `${n} manages half the dish before ${pr.posAdj} stomach rebels.`, (n,pr) => `The slop hits ${n}'s tongue and ${pr.sub} visibly recoils. "WHAT is in this?!"`],
  laser:    [(n,pr) => `${n} clips a laser on the very first row. The alarm blares.`, (n,pr) => `${n} tries to limbo under a beam and triggers two more. The grid is unforgiving.`, (n,pr) => `${n} misjudges the gap and gets tagged by three lasers. Not ${pr.posAdj} best moment.`, (n,pr) => `The lasers catch ${n} from every angle. ${pr.Sub} can't find a clean path.`],
  crowd:    [(n,pr) => `${n} stumbles over ${pr.posAdj} words. The judge isn't buying it.`, (n,pr) => `"I deserve to come back because..." ${n} trails off. The silence is deafening.`, (n,pr) => `${n}'s pitch falls flat. The judge folds ${pronouns(n).posAdj} arms. Not convinced.`, (n,pr) => `${n} tries charm. Then logic. Then begging. None of it works.`],
  puzzle:   [(n,pr) => `${n} jams pieces together that clearly don't fit. The clock is ticking.`, (n,pr) => `${n} stares at the puzzle. Picks up a piece. Puts it down. Picks up the same piece.`, (n,pr) => `The puzzle defeats ${n}. Half the pieces are still scattered when time runs out.`, (n,pr) => `${n} works frantically but the pieces won't cooperate. Time runs out.`],
  memory:   [(n,pr) => `${n} takes a wrong turn in the memory maze. Then another. Then another.`, (n,pr) => `"Was it Katie or Sadie first? Wait — was DJ even on that tribe?" ${n} is lost.`, (n,pr) => `The maze swallows ${n}. ${pr.Sub} wanders in circles, second-guessing every choice.`, (n,pr) => `${n}'s memory fails at the worst possible time. Dead end after dead end.`],
  roast:    [(n,pr) => `${n}'s joke lands with a thud. The peanut gallery cringes.`, (n,pr) => `${n} tries to roast the host and the host roasts ${pr.obj} back harder. Ouch.`, (n,pr) => `"So the host walks into a..." ${n} forgets the punchline. Dead silence.`, (n,pr) => `${n}'s roast is more self-inflicted wound than comedy. The gallery pities ${pr.obj}.`],
  creature: [(n,pr) => `The animatronic slams ${n} into the mat. ${pr.Sub} doesn't get up quickly.`, (n,pr) => `${n} swings wild and misses. The creature doesn't. Direct hit.`, (n,pr) => `${n} tries to dodge but the creature is faster. Impact. Pain.`, (n,pr) => `The creature catches ${n} off guard. ${pr.Sub} goes down hard.`],
  trap:     [(n,pr) => `${n} drops through the first trapdoor. Then the second. It's a long fall.`, (n,pr) => `The floor vanishes under ${n}'s feet. ${pr.Sub} catches the edge, barely.`, (n,pr) => `${n} runs straight into a trap panel. Down ${pr.sub} goes.`, (n,pr) => `${n} can't read the trap pattern. Every third step is a drop.`],
};

const CHALLENGE_DOMINATION = [
  (n,pr) => `${n} doesn't just pass — ${pr.sub} DOMINATES. Best performance of the round!`,
  (n,pr) => `That's a DOMINATION from ${n}! Nobody else came close this round.`,
  (n,pr) => `${n} crushes it! The top score this turn. The peanut gallery is on their feet!`,
  (n,pr) => `Unbelievable performance from ${n}! That's the highest score this round by a mile!`,
];

// ── Social event text ──
const TRASH_TALK = [
  (a,b) => `${a} leans over to ${b}. "Enjoy the board while you can. You're not finishing this race."`,
  (a,b) => `${a} catches ${b}'s eye and draws a finger across ${pronouns(a).posAdj} throat. The message is clear.`,
  (a,b) => `"You don't belong here," ${a} hisses at ${b}. "The game chewed you up once. It'll do it again."`,
  (a,b) => `${a} bumps ${b}'s shoulder walking past. "Watch your step out there. Accidents happen."`,
  (a,b) => `${a} makes sure ${b} hears: "Even if you win, nobody in the game wants you back."`,
];

const ENCOURAGEMENT = [
  (a,b) => `${a} puts a hand on ${b}'s shoulder. "Hey. You can do this. I believe in you."`,
  (a,b) => `"Don't give up!" ${a} calls out to ${b}. "You're tougher than you think!"`,
  (a,b) => `${a} catches ${b} looking defeated and walks over. "We didn't come this far to quit."`,
  (a,b) => `${a} shares a water bottle with ${b}. "Rest up. The next round is yours."`,
  (a,b) => `"Remember why you're here," ${a} tells ${b}. "You earned your spot. Now fight for it."`,
];

const PEANUT_GALLERY = [
  (spec,leader) => `${spec} yells from the gallery: "Come on, ${leader}! You're SO close!"`,
  (spec,leader) => `${spec} is pacing in the peanut gallery. "I can't watch this... okay, I'm watching."`,
  (spec,leader) => `${spec} cups ${pronouns(spec).posAdj} hands: "THIS IS SO INTENSE!"`,
  (spec,leader) => `${spec} leans forward in the gallery. "If ${leader} wins this, I swear..."`,
  (spec,leader) => `${spec} is stress-eating popcorn in the gallery. Eyes glued to the board.`,
  (spec,leader) => `${spec} starts a slow clap from the gallery. It catches on.`,
];

const SHOWMANCE_MOMENT = [
  (a,b) => `${a} and ${b} lock eyes across the board. A brief smile. Then back to the race.`,
  (a,b) => `${a} passes ${b}'s square and they share a quick touch. The gallery awws.`,
  (a,b) => `"Win this for us," ${a} whispers to ${b}. The intimacy is palpable.`,
  (a,b) => `${a} and ${b} are neck and neck. They share a look that says everything.`,
];

// ── KO reactions ──
const KO_REACTION = {
  villain:    [(n,pr) => `${n}'s energy hits zero. ${pr.Sub} slams the board. "This isn't OVER."`, (n,pr) => `${n} collapses. ${pr.Sub} stares at the other racers with pure venom.`, (n,pr) => `Zero energy. ${n} stands slowly, straightens ${pr.posAdj} jacket, and walks off. Seething.`, (n,pr) => `${n}'s token goes dark. ${pr.Sub} whispers a threat nobody quite catches.`],
  hero:       [(n,pr) => `${n}'s energy gives out. ${pr.Sub} kneels on the board. "I tried..."`, (n,pr) => `Zero. ${n} takes a shaky breath. "I gave it everything."`, (n,pr) => `${n}'s energy flatlines. The gallery goes quiet. ${pr.Sub} deserved better.`, (n,pr) => `${n} collapses. ${pr.Sub} reaches toward the trophy case, then ${pr.posAdj} hand drops.`],
  underdog:   [(n,pr) => `${n} sputters out. "I... almost..." The gallery gives ${pr.obj} a standing ovation anyway.`, (n,pr) => `Zero energy. ${n} laughs through tears. "At least I made it on the board, right?"`, (n,pr) => `${n}'s comeback ends here. ${pr.Sub} waves to the gallery. "Thanks for believing in me."`, (n,pr) => `${n} runs out of steam. The underdog story ends one chapter too early.`],
  goat:       [(n,pr) => `${n} doesn't even realize ${pr.sub}'s eliminated at first. "Wait, why is my token grey?"`, (n,pr) => `Zero energy. ${n} shrugs. "Honestly? Lasted longer than I expected."`, (n,pr) => `${n}'s energy bottoms out. ${pr.Sub} trips over ${pr.posAdj} own token leaving the board.`, (n,pr) => `"Am I out? Already?" ${n} looks at the board. "Oh. Yeah. That tracks."`],
  default:    [(n,pr) => `${n}'s energy hits zero. ${pr.Sub}'s out. The token goes dark.`, (n,pr) => `Zero energy. ${n} stands down from the board. Race over.`, (n,pr) => `${n} runs out of gas. The board claims another competitor.`, (n,pr) => `${n}'s token goes grey. Eliminated from the Aftermayhem.`],
};

// ── Winner celebration ──
const WINNER_TEXT = {
  villain:    [(n,pr) => `${n} reaches the Trophy Case and rips it open. "I'm BACK. And everyone should be scared."`, (n,pr) => `${n} crosses the finish. ${pr.Sub} doesn't celebrate — ${pr.sub} plots.`, (n,pr) => `The Trophy Case opens for ${n}. ${pr.Sub} grabs the return pass and holds it like a weapon.`, (n,pr) => `${n} arrives at the Trophy Case. ${pr.Sub} turns to face the camera. "Told you I'd be back."`],
  hero:       [(n,pr) => `${n} touches the Trophy Case and falls to ${pr.posAdj} knees. "I did it..." Tears.`, (n,pr) => `${n} reaches the finish! ${pr.Sub} looks back at the board. Every square was worth it.`, (n,pr) => `The Trophy Case opens. ${n} pulls out the return pass with trembling hands. "Thank you."`, (n,pr) => `${n} crosses the line and the gallery erupts. The hero returns!`],
  underdog:   [(n,pr) => `${n} — the UNDERDOG — reaches the Trophy Case! Nobody saw this coming!`, (n,pr) => `${n} stumbles across the finish line. "I made it?! I MADE IT!"`, (n,pr) => `The biggest upset in Aftermayhem history! ${n} reaches the Trophy Case!`, (n,pr) => `${n} collapses at the Trophy Case. "${pr.Sub === 'They' ? 'They did' : pr.Sub + ' did'} it. The underdog actually did it."`],
  goat:       [(n,pr) => `Against ALL odds, ${n} reaches the Trophy Case. Even ${pr.sub} looks shocked.`, (n,pr) => `${n} falls into the Trophy Case. Literally. But ${pr.sub} made it. That counts.`, (n,pr) => `The biggest surprise of the season — ${n} wins the Aftermayhem!`, (n,pr) => `${n} reaches the Trophy Case and checks if this is real. It is. Somehow.`],
  default:    [(n,pr) => `${n} reaches the Trophy Case! The race is over! ${pr.Sub}'s coming back!`, (n,pr) => `${n} crosses the finish line and grabs the return pass. "I earned this."`, (n,pr) => `The Trophy Case opens for ${n}! The Aftermayhem has a winner!`, (n,pr) => `${n} stands at the Trophy Case. The board is behind ${pr.obj}. The game is ahead.`],
};

const LAST_STANDING_TEXT = [
  (n,pr) => `${n} is the last one standing! All other competitors have been KO'd. ${pr.Sub} wins by survival!`,
  (n,pr) => `Everyone else is down. ${n} stands alone on the board. Victory by endurance!`,
  (n,pr) => `The board has claimed everyone but ${n}. Last player standing takes the prize!`,
  (n,pr) => `One by one they fell. ${n} is the only one left. That's a win!`,
];

// ── Season callback text ──
const CALLBACK_TEXT = {
  obstacle: (epNum) => `Ep${epNum} Relay`,
  trivia:   () => `Season Quiz`,
  feast:    (epNum) => epNum ? `Ep${epNum} Feast` : `Chef's Slop`,
  laser:    (epNum) => `Ep${epNum} Laser`,
  crowd:    (active) => `${active} Judges`,
  puzzle:   (epNum) => `Ep${epNum} Puzzle`,
  memory:   () => `Boot Order`,
  roast:    (active) => active ? `Roast: ${active}` : `Host Roast`,
  creature: () => `Robo Bear`,
  trap:     (epNum) => epNum ? `Ep${epNum} Sprint` : `Trap Sprint`,
};

// ── Round flavor text ──
const ROUND_FLAVOR = [
  () => `The dice are rolling. The stakes are real.`,
  () => `Tensions rise. Energy bars shrink. The board doesn't care.`,
  () => `The race heats up. Every square counts.`,
  () => `Halfway there — or halfway to elimination. Depends on your energy.`,
  () => `The gallery holds its breath. Someone's about to go down.`,
  () => `The board gets meaner. The dice get crueler. Welcome to Aftermayhem.`,
  () => `Front-runners emerge. Stragglers sweat. The Trophy Case beckons.`,
  () => `The finish line is in sight — for some. For others, so is zero energy.`,
  () => `The board is getting impatient. Energy drains intensify.`,
  () => `Endgame. Every roll could be the last. Or the winning one.`,
];

// ── Host commentary ──
const HOST_CHATTER = [
  () => `"Roll those dice, people! The Trophy Case won't walk to you!"`,
  () => `"Another one bites the dust! ...Er, the board."`,
  () => `"I LOVE this challenge. The drama! The pain! The ratings!"`,
  () => `"Roll high or roll home! Every square is a new nightmare!"`,
  () => `"The peanut gallery is going WILD! Can you blame them?"`,
  () => `"Booby traps, brutal challenges, and broken dreams. That's Aftermayhem!"`,
  () => `"Keep rolling! Keep fighting! Keep my ratings up!"`,
  () => `"The energy bars don't lie, people!"`,
];

// ── Trap narration ──
const TRAP_TEXT = [
  (n,pr) => `The square cracks open under ${n}'s feet! A geyser of green slime erupts, drenching ${pr.obj} head to toe!`,
  (n,pr) => `TRAP! ${n} steps on a hidden pressure plate. The floor drops — ${pr.sub} tumbles into a pit of foam peanuts!`,
  (n,pr) => `${n} lands on the square and — BOOM! Paint cannons fire from every direction. Direct hit!`,
  (n,pr) => `The square flashes red under ${n}! An alarm blares. A mechanical boxing glove springs from the board!`,
  (n,pr) => `${n}'s square opens into a slime chute! ${pr.Sub} slides down into a pool of mystery goo!`,
];

const TRAP_SURVIVE = [
  (n,pr) => `${n} takes the hit and stands back up. Bruised but not broken. Energy drops but ${pr.sub} lives.`,
  (n,pr) => `The trap hurts, but ${n} grits ${pr.posAdj} teeth. Still in this. Barely.`,
  (n,pr) => `${n} crawls out of the trap dripping with slime. "I'm FINE." ${pr.Sub} is not fine.`,
  (n,pr) => `${n} survives the booby trap. The crowd cheers. ${pr.PosAdj} energy bar disagrees.`,
];

// ── Dice roll narration ──
const DICE_ROLL = {
  1: [(n,pr) => `${n} rolls a 1. One square forward. The crowd groans.`, (n,pr) => `A measly 1 for ${n}. "${pr.Sub === 'They' ? 'They\'re' : pr.Sub + '\'s'} crawling out there."`, (n,pr) => `${n} rolls... 1. "That's barely movement!" the host laughs.`, (n,pr) => `The die tumbles to 1. ${n} inches forward. "Come ON."`, (n,pr) => `One step. That's all ${n} gets. The Trophy Case feels miles away.`],
  2: [(n,pr) => `${n} rolls a 2. Solid. Not great, not terrible. Two squares ahead.`, (n,pr) => `A 2 for ${n}. Steady progress. ${pr.Sub} advances two squares.`, (n,pr) => `${n}'s die lands on 2. "I'll take it." Two squares forward.`, (n,pr) => `Two squares for ${n}. The middle road. The safe road.`, (n,pr) => `${n} rolls 2. Two hops down the board. Keep moving.`],
  3: [(n,pr) => `${n} rolls a 3. Three squares forward. Decent movement.`, (n,pr) => `A 3 for ${n}. ${pr.Sub} hops three squares ahead.`, (n,pr) => `${n}'s die shows 3. "Not bad." Three squares forward.`, (n,pr) => `Three squares for ${n}. Right in the middle. Could be worse.`],
  4: [(n,pr) => `${n} rolls a 4! Four squares forward! Solid progress!`, (n,pr) => `A 4 for ${n}! ${pr.Sub} leaps four squares ahead. The crowd nods appreciatively.`, (n,pr) => `${n}'s die lands on 4. "Now we're moving!" Four squares forward.`, (n,pr) => `Four squares for ${n}. Above average. The Trophy Case feels closer.`],
  5: [(n,pr) => `${n} rolls a 5! Five squares forward! Big movement!`, (n,pr) => `FIVE! ${n} surges five squares ahead. The gallery cheers!`, (n,pr) => `${n}'s die shows 5. "YES!" Five squares forward. Momentum is building!`, (n,pr) => `Five squares for ${n}! ${pr.Sub}'s flying across the board!`],
  6: [(n,pr) => `${n} rolls a 6! MAXIMUM ROLL! Six squares forward plus a +5 energy boost!`, (n,pr) => `SIX! ${n} pumps ${pr.posAdj} fist. Best possible roll! Six squares AND bonus energy!`, (n,pr) => `${n}'s die lands on 6! The golden roll! Six squares forward! The crowd erupts!`, (n,pr) => `Max roll for ${n}! Six squares ahead and a surge of energy. THIS is momentum!`, (n,pr) => `The die shows 6! ${n} grins. "That's what I'm talking about!" Six squares. +5 energy.`],
};

// ── Video screen cameo narration ──
const CAMEO_CHEER = [
  (active, racer) => `The studio screen lights up — ${active} appears live from the game! "You got this, ${racer}! Win it!" The crowd roars.`,
  (active, racer) => `VIDEO LINK: ${active}'s face fills the screen. "Go ${racer}! I'm rooting for you!" A burst of energy surges through ${racer}.`,
  (active, racer) => `The monitors flash: INCOMING CALL. ${active} appears, cheering ${racer} on. "Bring it HOME!"`,
  (active, racer) => `${active} video-calls into the studio. "Come on, ${racer}! We need you back in this game!" The gallery goes wild.`,
];
const CAMEO_HECKLE = [
  (active, racer) => `The screen flickers on — ${active}! "Stay eliminated, ${racer}. Nobody wants you back." The crowd oohs.`,
  (active, racer) => `VIDEO LINK from ${active}. "${racer}? Seriously? The game is BETTER without you." Savage.`,
  (active, racer) => `${active} appears on screen just to trash-talk. "Don't bother coming back, ${racer}. You'll just get voted out again."`,
  (active, racer) => `The monitors light up with ${active}'s face. "I eliminated you once. I'll do it again." ${racer} flinches.`,
];
const CAMEO_NEUTRAL = [
  (active, racer) => `The studio screen activates — ${active} waves from the game camp. "Good luck out there." Polite but distant.`,
  (active, racer) => `VIDEO LINK: ${active} watches ${racer}'s challenge from camp. No cheers, no jeers. Just watching.`,
  (active, racer) => `${active} appears briefly on screen. A nod toward ${racer}. Nothing more.`,
];
const CAMEO_ROAST_WIN = [
  (active, racer) => `${active} roasts ${racer} on screen — but ${racer} fires RIGHT back! "At least I had the guts to try twice!" The gallery EXPLODES.`,
  (active, racer) => `${active} tries to humiliate ${racer} via video link. ${racer} grabs the mic: "Funny coming from someone who's scared to show up in person." DEVASTATION.`,
  (active, racer) => `The screen shows ${active} talking smack. ${racer} claps back so hard the gallery gives a standing ovation.`,
  (active, racer) => `${active} roasts from the safety of a screen. ${racer} doesn't blink: "Talk to me when you've survived the board." MIC DROP.`,
];
const CAMEO_ROAST_FAIL = [
  (active, racer) => `${active} roasts ${racer} on screen and it LANDS. ${racer} has nothing. The gallery cringes.`,
  (active, racer) => `VIDEO ROAST from ${active}. ${racer} tries to respond but stumbles over ${pronouns(racer).posAdj} words. Brutal.`,
  (active, racer) => `${active} destroys ${racer} via video link. "${racer} was eliminated for a reason." No comeback. Just silence.`,
  (active, racer) => `The screen lights up with ${active}'s smirking face. The roast is surgical. ${racer} deflates.`,
];

// ── Trap backtrack narration ──
const TRAP_BACKTRACK = [
  (n,pr,sq) => `The explosion LAUNCHES ${n} backward! ${pr.Sub} slides back ${sq} square${sq > 1 ? 's' : ''}!`,
  (n,pr,sq) => `The trap floor tilts and ${n} tumbles backward! Knocked back ${sq} square${sq > 1 ? 's' : ''}!`,
  (n,pr,sq) => `WIPEOUT! ${n} is blasted back ${sq} square${sq > 1 ? 's' : ''} by the trap!`,
  (n,pr,sq) => `The trap sends ${n} flying! ${pr.Sub} lands ${sq} square${sq > 1 ? 's' : ''} behind where ${pr.sub} started!`,
  (n,pr,sq) => `${n} gets catapulted BACKWARD! Minus ${sq} square${sq > 1 ? 's' : ''}! The gallery gasps!`,
];

// ── Host curveball narration ──
const HOST_CURVEBALL = {
  'board-shuffle': [(sq1,sq2) => `"Getting too comfortable? I don't THINK so!" The host hits a switch — Squares ${sq1} and ${sq2} swap challenges! The board shifts under everyone's feet!`, (sq1,sq2) => `"Time to shuffle things up!" The host cackles as Squares ${sq1} and ${sq2} exchange places. Plans? Ruined.`],
  'energy-tax': [() => `"You're all looking a little too healthy." The host slams a big red button. ENERGY TAX! Everyone loses 10 HP!`, () => `"This is MY show and I say... DRAIN THEM!" A jolt runs through the board. -10 energy to ALL racers!`],
  'second-wind': [(n) => `The crowd starts chanting: "${n}! ${n}! ${n}!" The underdog surges with energy! +20 HP!`, (n) => `"The fans have spoken!" The host tosses an energy drink to ${n}. "Don't say I never did anything for you." +20 HP!`],
  'trap-reveal': [(sq) => `"I'm feeling generous..." The host reveals a trap on Square ${sq}! "...or maybe I just want to watch you sweat around it."`, (sq) => `TRAP ALERT! The host exposes the booby trap on Square ${sq}. "Now you KNOW it's there. That makes it worse, right?"`],
};

// ── Collision narration ──
const COLLISION_RIVALRY = [
  (a,b) => `${a} and ${b} land on the SAME SQUARE! They get in each other's face. Shoving. The host has to separate them. Both lose energy from the brawl!`,
  (a,b) => `COLLISION! ${a} catches up to ${b} and neither will back down. A full-on board fight erupts!`,
  (a,b) => `${a} steps onto ${b}'s square. Eyes lock. Fists clench. This rivalry just went physical!`,
  (a,b) => `Same square, same grudge. ${a} and ${b} crash into each other. The gallery is on its feet!`,
];
const COLLISION_ALLIANCE = [
  (a,b) => `${a} lands right next to ${b}! They share a quick strategy huddle. Alliance energy flowing!`,
  (a,b) => `${a} and ${b} end up on the same square. Fist bump. "We got this." Both feel recharged.`,
  (a,b) => `SAME SQUARE! ${a} and ${b} use the moment to regroup. The bond between them is visible.`,
  (a,b) => `${a} catches up to ${b}. A knowing nod. They share supplies and both get an energy boost.`,
];
const COLLISION_BUMP = [
  (a,b) => `${a} lands on ${b}'s square and shoulders past! "Move it!" ${a} steals some of ${b}'s energy!`,
  (a,b) => `SAME SQUARE! ${a} bumps ${b} aside and grabs ${b}'s energy pack. "Thanks for the boost!"`,
  (a,b) => `${a} arrives on ${b}'s square. In the chaos, ${a} snags some of ${b}'s reserves. Sneaky!`,
  (a,b) => `${a} and ${b} collide! ${a} comes out on top, siphoning energy in the scuffle.`,
];


// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

const BOARD_SQUARES = 24;
const BOARD_FINISH = BOARD_SQUARES + 1; // square 25 = trophy case

export function simulateAftermayhem(ep) {
  // Eligibility
  const eligible = (gs.eliminated || []).filter(n => !(gs.riPlayers || []).includes(n));
  if (eligible.length < 6 || gs._aftermayhemUsed) return null;

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};

  // ── Phase 0: Golden Can Lottery ──
  const totalElim = eligible.length;
  const weighted = eligible.map((name, idx) => {
    const pop = (gs.popularity?.[name] || 0);
    const elimIdx = gs.eliminated.indexOf(name);
    const recency = totalElim > 1 ? elimIdx / (totalElim - 1) : 0.5;
    const w = pop * 0.4 + recency * 0.3 + Math.random() * 0.3;
    return { name, weight: w, popularity: pop, recency, selected: false };
  });
  weighted.sort((a, b) => b.weight - a.weight);
  const winners = weighted.slice(0, 6);
  winners.forEach(w => { w.selected = true; });
  const losers = weighted.slice(6);

  const winnerNames = winners.map(w => w.name);
  winnerNames.forEach(n => popDelta(n, 1)); // Lottery selection popularity

  // Lottery reactions
  const loserReactions = [];
  // Feature top 3 losers by popularity
  const featuredLosers = losers.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 3);
  featuredLosers.forEach(l => {
    const pr = pronouns(l.name);
    loserReactions.push({ name: l.name, text: pick(LOTTERY_LOSE)(l.name, pr), archetype: arch(l.name) });
  });
  if (losers.length > 3) {
    loserReactions.push({ name: '_group', text: `The rest of the eliminated players open empty cans. Disappointment ripples through the gallery.`, archetype: 'group' });
  }

  const winnerReactions = winnerNames.map(n => {
    const pr = pronouns(n);
    const a = arch(n);
    const pool = LOTTERY_WIN[a] || LOTTERY_WIN.default;
    return { name: n, text: pick(pool)(n, pr), archetype: a };
  });

  const lottery = {
    pool: weighted,
    winners: winnerNames,
    winnerReactions,
    loserReactions,
  };

  // ── Board Generation ──
  const board = [];
  const typePool = [...CHALLENGE_TYPES];

  // Find season callbacks
  const epHistory = gs.episodeHistory || [];
  const callbackMap = {};
  const physicalEps = [], mentalEps = [], cookingEps = [], stealthEps = [], enduranceEps = [];
  epHistory.forEach((eh, i) => {
    const ct = eh.challengeType || '';
    if (['cliff-dive', 'dodgebrawl', 'basic-straining', 'frozen-crossing', 'full-metal-drama', 'x-treme-torture'].includes(ct)) physicalEps.push(i + 1);
    if (['one-flu', 'get-a-clue', 'operation-classified'].includes(ct)) mentalEps.push(i + 1);
    if (['hells-kitchen', 'brunch'].includes(ct)) cookingEps.push(i + 1);
    if (['hide-and-be-sneaky', 'paintball-hunt', 'operation-classified'].includes(ct)) stealthEps.push(i + 1);
    if (['awake-a-thon', 'sucky-outdoors', 'say-uncle'].includes(ct)) enduranceEps.push(i + 1);
  });

  for (let sq = 1; sq <= BOARD_SQUARES; sq++) {
    // No adjacent same type
    const prevType = sq > 1 ? board[sq - 2]?.type : null;
    const available = typePool.filter(t => t.id !== prevType);
    const chosen = pick(available);

    let callbackLabel = '';
    let callbackEp = null;
    let cameoPlayer = null;

    // Generate season callback label
    if (chosen.id === 'obstacle' && physicalEps.length) { callbackEp = pick(physicalEps); callbackLabel = CALLBACK_TEXT.obstacle(callbackEp); }
    else if (chosen.id === 'trivia') { callbackLabel = CALLBACK_TEXT.trivia(); }
    else if (chosen.id === 'feast') { callbackEp = cookingEps.length ? pick(cookingEps) : null; callbackLabel = CALLBACK_TEXT.feast(callbackEp); }
    else if (chosen.id === 'laser' && stealthEps.length) { callbackEp = pick(stealthEps); callbackLabel = CALLBACK_TEXT.laser(callbackEp); }
    else if (chosen.id === 'puzzle' && mentalEps.length) { callbackEp = pick(mentalEps); callbackLabel = CALLBACK_TEXT.puzzle(callbackEp); }
    else if (chosen.id === 'memory') { callbackLabel = CALLBACK_TEXT.memory(); }
    else if (chosen.id === 'trap' && enduranceEps.length) { callbackEp = pick(enduranceEps); callbackLabel = CALLBACK_TEXT.trap(callbackEp); }
    else if (chosen.id === 'creature') { callbackLabel = CALLBACK_TEXT.creature(); }
    else if (chosen.id === 'crowd' || chosen.id === 'roast') {
      // Active player cameo
      const activePool = gs.activePlayers || [];
      if (activePool.length > 0) {
        // Weight by bond strength with competitors
        const bondWeighted = activePool.map(ap => {
          const totalBond = winnerNames.reduce((sum, wn) => sum + Math.abs(getBond(wn, ap)), 0);
          return { name: ap, weight: totalBond + Math.random() * 2 };
        });
        bondWeighted.sort((a, b) => b.weight - a.weight);
        cameoPlayer = bondWeighted[0]?.name || null;
        callbackLabel = chosen.id === 'crowd' ? CALLBACK_TEXT.crowd(cameoPlayer || '???') : CALLBACK_TEXT.roast(cameoPlayer);
      } else {
        callbackLabel = chosen.id === 'crowd' ? 'Crowd Plead' : CALLBACK_TEXT.roast(null);
      }
    } else {
      callbackLabel = chosen.name;
    }

    board.push({
      sq,
      type: chosen.id,
      typeName: chosen.name,
      primary: chosen.primary,
      secondary: chosen.secondary,
      callback: callbackLabel,
      callbackEp,
      cameo: cameoPlayer,
    });
  }

  // Booby traps (5-7 random for the bigger board, avoid first square)
  const trapCandidates = board.filter((_, i) => i > 0).map((_, i) => i + 1);
  const shuffledTrapC = trapCandidates.sort(() => Math.random() - 0.5);
  const trapCount = 5 + Math.floor(Math.random() * 3);
  const trapIndices = shuffledTrapC.slice(0, trapCount).map(i => board[i].sq);
  const trapsSet = new Set(trapIndices);

  // ── Race Simulation ──
  const racers = winnerNames.map(n => ({
    name: n,
    position: 0,
    energy: 100,
    alive: true,
    koRound: null,
    scores: 0,
  }));
  racers.forEach(r => { ep.chalMemberScores[r.name] = 0; });

  // Random turn order
  const turnOrder = [...racers].sort(() => Math.random() - 0.5);

  const rounds = [];
  let turnCount = 0;
  let gameOver = false;
  let raceWinner = null;
  let winCondition = 'finish';
  const revealedTraps = new Set();
  const cameos = {};

  for (let roundNum = 1; roundNum <= 20 && !gameOver; roundNum++) {
    const roundData = { roundNum, turns: [], socialEvents: [], eliminations: [] };
    const escalation = roundNum >= 5 ? 1.0 + (roundNum - 4) * 0.4 : 1.0;
    const collisionUsed = new Set();

    for (const racer of turnOrder) {
      if (!racer.alive || gameOver) continue;

      // ── Dice Roll ──
      const diceRoll = 1 + Math.floor(Math.random() * 6);
      const oldPos = racer.position;
      racer.position = Math.min(racer.position + diceRoll, BOARD_FINISH);

      // Energy bonus for rolling 6
      if (diceRoll === 6) {
        racer.energy = clamp(racer.energy + 5, 0, 100);
      }

      const pr = pronouns(racer.name);
      const rollText = pick(DICE_ROLL[diceRoll])(racer.name, pr);

      // Find the board square data (0-indexed: position 1 = board[0])
      const sqData = racer.position >= 1 && racer.position <= BOARD_SQUARES ? board[racer.position - 1] : null;
      const isTrap = trapsSet.has(racer.position);
      let trapDamage = 0;
      let trapText = '';
      let trapSurviveText = '';
      let koBeforeChallenge = false;

      // ── Booby Trap ──
      const preBacktrackPos = racer.position;
      let trapBacktrack = 0;
      let trapBacktrackText = '';
      if (isTrap && racer.position < BOARD_FINISH) {
        trapDamage = 30;
        revealedTraps.add(racer.position);
        const trapDrainMult = escalation;
        const actualTrapDmg = Math.round(trapDamage * trapDrainMult);
        racer.energy = clamp(racer.energy - actualTrapDmg, 0, 100);
        trapText = pick(TRAP_TEXT)(racer.name, pr);

        if (racer.energy <= 0) {
          koBeforeChallenge = true;
          racer.alive = false;
          racer.koRound = roundNum;
          ep.chalMemberScores[racer.name] = (ep.chalMemberScores[racer.name] || 0) + 1;
          popDelta(racer.name, -1);
        } else {
          trapSurviveText = pick(TRAP_SURVIVE)(racer.name, pr);
          ep.chalMemberScores[racer.name] = (ep.chalMemberScores[racer.name] || 0) + 3;
          popDelta(racer.name, 1);
          // Trap backtrack — 50% chance to get knocked back 1-2 squares
          trapBacktrack = Math.random() < 0.5 ? (1 + Math.floor(Math.random() * 2)) : 0;
          if (trapBacktrack > 0) {
            racer.position = Math.max(1, racer.position - trapBacktrack);
            trapBacktrackText = pick(TRAP_BACKTRACK)(racer.name, pr, trapBacktrack);
          }
        }
      }

      // ── Win Check (reached finish) ──
      if (racer.position >= BOARD_FINISH && racer.alive) {
        raceWinner = racer.name;
        winCondition = 'finish';
        gameOver = true;
        ep.chalMemberScores[racer.name] = (ep.chalMemberScores[racer.name] || 0) + 15;
        popDelta(racer.name, 3);

        roundData.turns.push({
          player: racer.name, diceRoll, oldPos, newPos: racer.position,
          challengeType: null, score: null, energyDelta: 0, energyAfter: racer.energy,
          isTrap, trapDamage, trapText, trapSurviveText,
          trapBacktrack, trapBacktrackText,
          rollText, challengeText: null, dominationText: null,
          isWinner: true, koBeforeChallenge,
        });
        break;
      }

      // ── Same-Square Collision ──
      if (racer.alive && !koBeforeChallenge && racer.position < BOARD_FINISH && racer.energy > 0 && !collisionUsed.has(racer.name)) {
        const collision = racers.filter(r => r.alive && r.energy > 0 && r.name !== racer.name && r.position === racer.position && !collisionUsed.has(r.name));
        if (collision.length > 0) {
          const target = collision[0];
          const bond = getBond(racer.name, target.name);
          let collisionEvent = null;
          if (bond <= -2 && canTrashTalk(racer.name)) {
            const trashSuccess = (pStats(racer.name).social || 5) + noise(2.5) > (pStats(target.name).mental || 5) + noise(2.5);
            if (trashSuccess) {
              racer.energy = clamp(racer.energy + 5, 0, 100);
              target.energy = clamp(target.energy - 12, 0, 100);
            } else {
              racer.energy = clamp(racer.energy - 12, 0, 100);
              target.energy = clamp(target.energy + 5, 0, 100);
            }
            addBond(racer.name, target.name, -1);
            collisionEvent = { type: 'collision-rivalry', players: [racer.name, target.name], text: pick(COLLISION_RIVALRY)(racer.name, target.name), bondDelta: -1, energyDelta: trashSuccess ? -12 : 12, trashSuccess };
          } else if (bond >= 3) {
            racer.energy = clamp(racer.energy + 8, 0, 100);
            target.energy = clamp(target.energy + 8, 0, 100);
            addBond(racer.name, target.name, 0.5);
            collisionEvent = { type: 'collision-alliance', players: [racer.name, target.name], text: pick(COLLISION_ALLIANCE)(racer.name, target.name), bondDelta: 0.5, energyDelta: 8 };
          } else {
            const stolen = 8 + Math.floor(Math.random() * 5);
            racer.energy = clamp(racer.energy + stolen, 0, 100);
            target.energy = clamp(target.energy - stolen, 0, 100);
            addBond(racer.name, target.name, -0.5);
            collisionEvent = { type: 'collision-bump', players: [racer.name, target.name], text: pick(COLLISION_BUMP)(racer.name, target.name), bondDelta: -0.5, energyDelta: stolen };
          }
          if (collisionEvent) {
            roundData.socialEvents.push(collisionEvent);
            collisionUsed.add(racer.name);
            collisionUsed.add(target.name);
          }
        }
      }

      // ── Face Challenge ──
      let challengeScore = null;
      let challengeEnergyDelta = 0;
      let challengeText = '';
      let dominationText = '';
      let cameoData = null;

      if (sqData && racer.alive && !koBeforeChallenge) {
        const stats = pStats(racer.name);
        const primaryVal = stats[sqData.primary] || 5;
        const secondaryVal = stats[sqData.secondary] || 5;
        challengeScore = primaryVal * 0.6 + secondaryVal * 0.3 + noise(2.5);

        // Cameo video link (crowd/roast squares)
        if (sqData.cameo && racer.alive && !koBeforeChallenge) {
          const bond = getBond(racer.name, sqData.cameo);
          let cameoType, cameoEnergyDelta = 0, cameoText = '';

          if (sqData.type === 'roast') {
            const activeSocial = pStats(sqData.cameo).social || 5;
            const racerSocial = stats.social || 5;
            const roastScore = racerSocial - (activeSocial * 0.6 + noise(2.5));
            if (roastScore >= 0) {
              cameoType = 'roast-win';
              cameoEnergyDelta = 10;
              cameoText = pick(CAMEO_ROAST_WIN)(sqData.cameo, racer.name);
              addBond(racer.name, sqData.cameo, -0.5);
              popDelta(racer.name, 2);
            } else {
              cameoType = 'roast-fail';
              cameoEnergyDelta = -12;
              cameoText = pick(CAMEO_ROAST_FAIL)(sqData.cameo, racer.name);
              addBond(racer.name, sqData.cameo, -1);
              popDelta(racer.name, -1);
            }
          } else {
            // Crowd square — bond determines effect
            if (bond >= 2) {
              cameoType = 'cheer';
              cameoEnergyDelta = 10;
              cameoText = pick(CAMEO_CHEER)(sqData.cameo, racer.name);
              addBond(racer.name, sqData.cameo, 1);
              popDelta(racer.name, 1);
            } else if (bond <= -2) {
              cameoType = 'heckle';
              cameoEnergyDelta = -10;
              cameoText = pick(CAMEO_HECKLE)(sqData.cameo, racer.name);
              addBond(racer.name, sqData.cameo, -0.5);
              popDelta(racer.name, -1);
            } else {
              cameoType = 'neutral';
              cameoEnergyDelta = 0;
              cameoText = pick(CAMEO_NEUTRAL)(sqData.cameo, racer.name);
            }
          }

          racer.energy = clamp(racer.energy + cameoEnergyDelta, 0, 100);
          cameoData = { activePlayer: sqData.cameo, bond, type: cameoType, energyDelta: cameoEnergyDelta, text: cameoText };
          if (!cameos[racer.position]) cameos[racer.position] = sqData.cameo;
        }

        const threshold = 6.5;
        challengeEnergyDelta = Math.round((challengeScore - threshold) * 4.0 * escalation);
        racer.energy = clamp(racer.energy + challengeEnergyDelta, 0, 100);

        const isPass = challengeScore >= threshold;
        const chalTextPool = isPass ? (CHALLENGE_PASS[sqData.type] || CHALLENGE_PASS.obstacle) : (CHALLENGE_STRUGGLE[sqData.type] || CHALLENGE_STRUGGLE.obstacle);
        challengeText = pick(chalTextPool)(racer.name, pr);

        ep.chalMemberScores[racer.name] = (ep.chalMemberScores[racer.name] || 0) + 3;

        // Elimination check
        if (racer.energy <= 0) {
          racer.alive = false;
          racer.koRound = roundNum;
          popDelta(racer.name, -1);
        }
      }

      roundData.turns.push({
        player: racer.name, diceRoll, oldPos, newPos: preBacktrackPos, finalPos: racer.position,
        challengeType: sqData?.type || null,
        challengeTypeName: sqData?.typeName || null,
        callback: sqData?.callback || null,
        callbackEp: sqData?.callbackEp || null,
        score: challengeScore, energyDelta: challengeEnergyDelta,
        energyAfter: racer.energy,
        isTrap, trapDamage, actualTrapDmg: isTrap ? Math.round(30 * escalation) : 0, trapText, trapSurviveText,
        trapBacktrack, trapBacktrackText,
        rollText, challengeText, dominationText: '',
        isWinner: false, koBeforeChallenge,
        cameo: cameoData,
      });

      if (!racer.alive) {
        const a = arch(racer.name);
        const koPool = KO_REACTION[a] || KO_REACTION.default;
        roundData.eliminations.push({ name: racer.name, square: racer.position, energy: 0, text: pick(koPool)(racer.name, pr), round: roundNum });
      }

      turnCount++;

      // ── Social Event (every 3 turns) ──
      if (turnCount % 3 === 0 && !gameOver) {
        const aliveRacers = racers.filter(r => r.alive);
        if (aliveRacers.length >= 2) {
          const eventRoll = Math.random();
          let socialEvent = null;

          // Check for showmance moment first
          const showmancePartners = [];
          if (gs.showmances) {
            for (const sh of gs.showmances) {
              if (sh.broken) continue;
              const aInRace = aliveRacers.find(r => r.name === sh.players[0]);
              const bActive = (gs.activePlayers || []).includes(sh.players[1]);
              const bInRace = aliveRacers.find(r => r.name === sh.players[1]);
              const aActive = (gs.activePlayers || []).includes(sh.players[0]);
              if (aInRace && bActive) showmancePartners.push([sh.players[0], sh.players[1]]);
              if (bInRace && aActive) showmancePartners.push([sh.players[1], sh.players[0]]);
              if (aInRace && bInRace) showmancePartners.push([sh.players[0], sh.players[1]]);
            }
          }

          if (showmancePartners.length > 0 && eventRoll < 0.20) {
            const pair = pick(showmancePartners);
            addBond(pair[0], pair[1], 1);
            const r0 = racers.find(r => r.name === pair[0]);
            const r1 = racers.find(r => r.name === pair[1]);
            if (r0 && r0.alive) r0.energy = clamp(r0.energy + 5, 0, 100);
            if (r1 && r1.alive) r1.energy = clamp(r1.energy + 5, 0, 100);
            socialEvent = { type: 'showmance', players: pair, text: pick(SHOWMANCE_MOMENT)(pair[0], pair[1]), bondDelta: 1, energyDelta: 5 };
          } else if (eventRoll < 0.50) {
            // Trash talk (30%)
            const aggressors = aliveRacers.filter(r => canTrashTalk(r.name));
            if (aggressors.length > 0) {
              const aggressor = pick(aggressors);
              const targets = aliveRacers.filter(r => r.name !== aggressor.name);
              const target = pick(targets);
              addBond(aggressor.name, target.name, -1);
              target.energy = clamp(target.energy - 5, 0, 100);
              ep.chalMemberScores[aggressor.name] = (ep.chalMemberScores[aggressor.name] || 0) - 1;
              popDelta(target.name, -1);
              socialEvent = { type: 'trash-talk', players: [aggressor.name, target.name], text: pick(TRASH_TALK)(aggressor.name, target.name), bondDelta: -1, energyDelta: -5 };
              if (target.energy <= 0) {
                target.alive = false;
                target.koRound = roundNum;
                const tPr = pronouns(target.name);
                const tA = arch(target.name);
                const koPool = KO_REACTION[tA] || KO_REACTION.default;
                roundData.eliminations.push({ name: target.name, square: target.position, energy: 0, text: pick(koPool)(target.name, tPr), round: roundNum });
              }
            }
          } else if (eventRoll < 0.75) {
            // Encouragement (25%)
            const encouragers = aliveRacers.filter(r => NICE_ARCHS.has(arch(r.name)));
            const lowestEnergy = [...aliveRacers].sort((a, b) => a.energy - b.energy)[0];
            if (encouragers.length > 0 && lowestEnergy) {
              const encourager = pick(encouragers.filter(r => r.name !== lowestEnergy.name));
              if (encourager) {
                addBond(encourager.name, lowestEnergy.name, 1);
                lowestEnergy.energy = clamp(lowestEnergy.energy + 5, 0, 100);
                ep.chalMemberScores[encourager.name] = (ep.chalMemberScores[encourager.name] || 0) + 2;
                popDelta(encourager.name, 1);
                socialEvent = { type: 'encouragement', players: [encourager.name, lowestEnergy.name], text: pick(ENCOURAGEMENT)(encourager.name, lowestEnergy.name), bondDelta: 1, energyDelta: 5 };
              }
            }
          } else {
            // Peanut gallery (25%)
            const spectators = (gs.eliminated || []).filter(n => !winnerNames.includes(n));
            if (spectators.length > 0) {
              const spec = pick(spectators);
              const leader = [...aliveRacers].sort((a, b) => b.position - a.position)[0];
              socialEvent = { type: 'peanut-gallery', players: [spec, leader?.name || '???'], text: pick(PEANUT_GALLERY)(spec, leader?.name || 'someone'), bondDelta: 0, energyDelta: 0 };
            }
          }

          if (socialEvent) roundData.socialEvents.push(socialEvent);
        }
      }
    }

    // ── Domination check (best score this round among alive) ──
    const roundTurns = roundData.turns.filter(t => t.score !== null && !t.isWinner);
    if (roundTurns.length > 0) {
      const bestScore = Math.max(...roundTurns.map(t => t.score));
      const dominator = roundTurns.find(t => t.score === bestScore);
      if (dominator && bestScore > 5.5) {
        const pr = pronouns(dominator.player);
        dominator.dominationText = pick(CHALLENGE_DOMINATION)(dominator.player, pr);
        ep.chalMemberScores[dominator.player] = (ep.chalMemberScores[dominator.player] || 0) + 5;
        popDelta(dominator.player, 1);
        // Domination energy bonus
        const dRacer = racers.find(r => r.name === dominator.player);
        if (dRacer && dRacer.alive) {
          dRacer.energy = clamp(dRacer.energy + 15, 0, 100);
          dominator.energyAfter = dRacer.energy;
        }
      }
    }

    // ── Host Curveball (15% chance after round 2) ──
    if (roundNum >= 3 && Math.random() < 0.15 && !gameOver) {
      const curveballs = ['board-shuffle','energy-tax','second-wind','trap-reveal'];
      const cbType = pick(curveballs);
      let cbData = { type: cbType, text: '' };
      if (cbType === 'board-shuffle') {
        const swappable = board.filter((_, i) => i > 0 && i < board.length - 1 && !trapsSet.has(board[i].sq));
        if (swappable.length >= 2) {
          const [a, b] = swappable.sort(() => Math.random() - 0.5).slice(0, 2);
          const aIdx = board.indexOf(a), bIdx = board.indexOf(b);
          [board[aIdx], board[bIdx]] = [board[bIdx], board[aIdx]];
          const tmpType = a.type; a.type = b.type; b.type = tmpType;
          ['typeName','primary','secondary','callback','callbackEp','cameo'].forEach(k => { const t = a[k]; a[k] = b[k]; b[k] = t; });
          cbData.text = pick(HOST_CURVEBALL['board-shuffle'])(a.sq, b.sq);
          cbData.squares = [a.sq, b.sq];
        }
      } else if (cbType === 'energy-tax') {
        racers.filter(r => r.alive).forEach(r => { r.energy = clamp(r.energy - 10, 0, 100); if (r.energy <= 0) { r.alive = false; r.koRound = roundNum; } });
        cbData.text = pick(HOST_CURVEBALL['energy-tax'])();
      } else if (cbType === 'second-wind') {
        const last = [...racers].filter(r => r.alive).sort((a, b) => a.position - b.position || a.energy - b.energy)[0];
        if (last) { last.energy = clamp(last.energy + 20, 0, 100); cbData.text = pick(HOST_CURVEBALL['second-wind'])(last.name); cbData.target = last.name; }
      } else if (cbType === 'trap-reveal') {
        const unrev = [...trapsSet].filter(sq => !revealedTraps.has(sq));
        if (unrev.length > 0) { const sq = pick(unrev); revealedTraps.add(sq); cbData.text = pick(HOST_CURVEBALL['trap-reveal'])(sq); cbData.square = sq; }
      }
      if (cbData.text) roundData.hostEvents = [cbData];
    }

    // Per-round survival bonus
    racers.filter(r => r.alive).forEach(r => {
      ep.chalMemberScores[r.name] = (ep.chalMemberScores[r.name] || 0) + 2;
    });

    // ── Fatigue Drain ──
    racers.filter(r => r.alive).forEach(r => {
      r.energy = clamp(r.energy - (roundNum >= 5 ? 8 : 5), 0, 100);
      if (r.energy <= 0) {
        r.alive = false;
        r.koRound = roundNum;
        popDelta(r.name, -1);
        const fPr = pronouns(r.name);
        const fA = arch(r.name);
        const koPool = KO_REACTION[fA] || KO_REACTION.default;
        roundData.eliminations.push({ name: r.name, square: r.position, energy: 0, text: pick(koPool)(r.name, fPr), round: roundNum });
      }
    });

    rounds.push(roundData);

    // ── Last standing check ──
    const stillAlive = racers.filter(r => r.alive);
    if (stillAlive.length === 1 && !raceWinner) {
      raceWinner = stillAlive[0].name;
      winCondition = 'last-standing';
      gameOver = true;
      ep.chalMemberScores[raceWinner] = (ep.chalMemberScores[raceWinner] || 0) + 10;
      popDelta(raceWinner, 2);
    } else if (stillAlive.length === 0 && !raceWinner) {
      // Failsafe — last eliminated, highest position
      const lastElim = [...racers].sort((a, b) => (b.koRound || 0) - (a.koRound || 0) || b.position - a.position)[0];
      raceWinner = lastElim.name;
      winCondition = 'failsafe';
      gameOver = true;
      ep.chalMemberScores[raceWinner] = (ep.chalMemberScores[raceWinner] || 0) + 10;
      popDelta(raceWinner, 2);
    }
  }

  // ── Return Pipeline ──
  let returnedTo = 'merge';
  if (raceWinner) {
    // Remove from eliminated
    const elimIdx = gs.eliminated.indexOf(raceWinner);
    if (elimIdx >= 0) gs.eliminated.splice(elimIdx, 1);

    // Remove from jury if present
    if (gs.jury) {
      const juryIdx = gs.jury.indexOf(raceWinner);
      if (juryIdx >= 0) gs.jury.splice(juryIdx, 1);
    }

    // Add to active players
    if (!gs.activePlayers.includes(raceWinner)) {
      gs.activePlayers.push(raceWinner);
    }

    // Join smallest tribe (pre-merge) or merge pool
    if (gs.isMerged) {
      returnedTo = gs.mergeName || 'merge';
    } else if (gs.tribes && gs.tribes.length > 0) {
      const smallest = [...gs.tribes].sort((a, b) => a.members.length - b.members.length)[0];
      if (smallest && !smallest.members.includes(raceWinner)) {
        smallest.members.push(raceWinner);
      }
      returnedTo = smallest?.tribeName || 'merge';
    }

    // Bond softening
    const allActive = gs.activePlayers || [];
    allActive.forEach(other => {
      if (other === raceWinner) return;
      const bond = getBond(raceWinner, other);
      if (bond < -1) addBond(raceWinner, other, -bond - 1); // soften to -1
      if (bond >= 4) addBond(raceWinner, other, 1.0);
      if (bond <= -3) addBond(raceWinner, other, -0.5);
    });

    // Camp event
    const pr = pronouns(raceWinner);
    const a = arch(raceWinner);
    const winTextPool = WINNER_TEXT[a] || WINNER_TEXT.default;
    ep.campEvents[campKey].post.push({
      type: 'aftermayhem-return',
      text: `${raceWinner} has returned to the game via the Aftermayhem! ${pick(winTextPool)(raceWinner, pr)}`,
      players: [raceWinner],
      badgeText: 'Aftermayhem Return',
      badgeClass: 'badge-advantage',
    });

    popDelta(raceWinner, 3);
    gs._aftermayhemUsed = true;
  }

  // Build peanut gallery list (eliminated non-racers)
  const peanutGallery = (gs.eliminated || []).filter(n => !winnerNames.includes(n));

  // ── Store results ──
  const result = {
    lottery,
    board: { squares: board, traps: trapIndices, cameos },
    rounds,
    winner: raceWinner,
    winCondition,
    returnedTo,
    racers: racers.map(r => ({ name: r.name, finalPosition: r.position, finalEnergy: r.energy, alive: r.alive, koRound: r.koRound, scores: ep.chalMemberScores[r.name] || 0 })),
    peanutGallery,
    revealedTraps: [...revealedTraps],
  };

  if (!ep.aftermath) ep.aftermath = {};
  ep.aftermath.aftermayhem = result;
  ep.isAftermayhem = true;

  return result;
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
    const el = document.getElementById(`am-step-${suffix}-${i}`);
    if (el) el.classList.add('am-visible');
  }
  const counter = document.getElementById(`am-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`am-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.am-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('am-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._amEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.aftermath?.aftermayhem) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

function _updateBoardMap(screenKey) {
  if (!screenKey?.includes('board')) return;
  const st = _tvState[screenKey];
  if (!st) return;
  const ep = window._amEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  const am = ep?.aftermath?.aftermayhem;
  if (!am) return;

  const snapshots = window._amBoardSnapshots;
  if (!snapshots) return;
  const snapIdx = Math.min(Math.max(st.idx, 0), snapshots.length - 1);
  const snap = snapshots[snapIdx];
  if (!snap) return;

  const board = document.getElementById('am-game-board');
  if (!board) return;
  const boardRect = board.getBoundingClientRect();

  // Group racers by current square for stagger
  const squareOccupants = {};
  am.racers.forEach((r, pi) => {
    const pos = snap.positions[r.name] ?? 0;
    if (!squareOccupants[pos]) squareOccupants[pos] = [];
    squareOccupants[pos].push({ name: r.name, idx: pi });
  });

  // Position tokens over their squares
  am.racers.forEach((r, pi) => {
    const tok = document.getElementById(`am-token-${slug(r.name)}`);
    if (!tok) return;
    const pos = snap.positions[r.name] ?? 0;
    const prevPos = parseInt(tok.getAttribute('data-pos') || '0');
    const isKo = snap.ko.has(r.name);
    const sqEl = document.querySelector(`.am-sq[data-sq="${pos}"]`);
    if (!sqEl) return;

    const sqRect = sqEl.getBoundingClientRect();
    const occupants = squareOccupants[pos] || [];
    const myIdx = occupants.findIndex(o => o.name === r.name);
    const staggerX = occupants.length > 1 ? (myIdx - (occupants.length - 1) / 2) * 14 : 0;
    const staggerY = occupants.length > 1 ? myIdx * 6 : 0;

    const leftPx = sqRect.left - boardRect.left + sqRect.width / 2 - 15 + staggerX;
    const topPx = sqRect.top - boardRect.top - 12 - staggerY;

    tok.style.left = `${leftPx}px`;
    tok.style.top = `${topPx}px`;
    tok.setAttribute('data-pos', pos);

    if (isKo) {
      tok.classList.add('eliminated');
    } else {
      tok.classList.remove('eliminated');
    }

    // Hop animation when position changes
    if (pos !== prevPos) {
      tok.classList.remove('moving');
      void tok.offsetWidth;
      tok.classList.add('moving');
    }
  });

  // Update trap reveals
  const revTraps = snap.revealedTraps || new Set();
  revTraps.forEach(sq => {
    const sqEl = document.querySelector(`.am-sq[data-sq="${sq}"]`);
    if (sqEl) {
      sqEl.classList.remove('normal');
      sqEl.classList.add('trap-revealed');
      const icon = sqEl.querySelector('.am-sq-icon');
      if (icon) icon.innerHTML = `<div class="am-icon am-icon-skull"></div>`;
      const lbl = sqEl.querySelector('.am-sq-label');
      if (lbl) lbl.textContent = 'TRAP!';
    }
  });

  // Update dice display with tumble animation
  const diceResult = document.getElementById('am-dice-result');
  const diceFace = document.querySelector('.am-dice-face');
  if (snap.lastDice && diceResult) {
    diceResult.textContent = `${snap.lastPlayer || ''} ROLLED ${snap.lastDice}`;
    diceResult.classList.add('show');
    _setPips(snap.lastDice);
    if (diceFace) {
      diceFace.classList.remove('am-dice-tumble');
      void diceFace.offsetWidth;
      diceFace.classList.add('am-dice-tumble');
    }
  } else if (diceResult) {
    diceResult.textContent = '';
    diceResult.classList.remove('show');
  }

  // Highlight active square
  document.querySelectorAll('.am-sq.active').forEach(s => s.classList.remove('active'));
  if (snap.activeSquare !== undefined && snap.activeSquare !== null) {
    const aSq = document.querySelector(`.am-sq[data-sq="${snap.activeSquare}"]`);
    if (aSq) aSq.classList.add('active');
  }
}

function _setPips(val) {
  const pips = document.getElementById('am-dice-pips');
  if (!pips) return;
  const patterns = {
    1: [0,0,0, 0,1,0, 0,0,0],
    2: [1,0,0, 0,0,0, 0,0,1],
    3: [1,0,0, 0,1,0, 0,0,1],
    4: [1,0,1, 0,0,0, 1,0,1],
    5: [1,0,1, 0,1,0, 1,0,1],
    6: [1,0,1, 1,0,1, 1,0,1],
  };
  const pat = patterns[val] || patterns[1];
  const dots = pips.querySelectorAll('.am-pip');
  dots.forEach((d, i) => { d.classList.toggle('on', !!pat[i]); });
}

export function aftermayhemRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('am-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`am-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('AM reveal error:', e); }
  try { _updateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  try { _updateBoardMap(screenKey); } catch (e) { /* map update optional */ }
}

export function aftermayhemRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('am-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('AM revealAll error:', e); }
  try { _updateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  try { _updateBoardMap(screenKey); } catch (e) { /* map update optional */ }
}

// ── CSS ICONS ──
function _icon(type) {
  return `<div class="am-icon am-icon-${type}"></div>`;
}

// ── AVATAR HELPER ──
function _av(name, size = 32) {
  const s = slug(name);
  return `<img src="assets/avatars/${s}.png" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="${name}"><div style="display:none;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,.15);align-items:center;justify-content:center;font-family:Bungee,sans-serif;font-size:${Math.round(size*0.4)}px;color:#fff">${name[0]}</div>`;
}

// ── Energy class ──
function _energyClass(e) {
  if (e > 60) return 'high';
  if (e > 25) return 'mid';
  return 'low';
}

// ── Player colors for tokens ──
const TOKEN_COLORS = ['var(--am-cyan)', 'var(--am-pink)', 'var(--am-green)', 'var(--am-orange)', 'var(--am-violet)', '#f59e0b'];

// ══════════════════════════════════════════════════════════════
// CSS STYLES
// ══════════════════════════════════════════════════════════════
function _amCSS() {
  return `<style>
@import url('https://fonts.googleapis.com/css2?family=Bungee&family=Bungee+Shade&family=Press+Start+2P&family=Fredoka:wght@400;600;700&family=Bangers&display=swap');
:root{--am-deep:#100418;--am-deep2:#2a0a3a;--am-purple:#3a1258;--am-magenta:#5a0a4a;--am-gold:#ffd13c;--am-gold-dk:#c9a020;--am-orange:#ff6b35;--am-cyan:#00d4ff;--am-red:#ff3c3c;--am-green:#00c864;--am-pink:#ff3c8a;--am-neon:#39ff14;--am-violet:#b44dff;--am-cream:#f0e8d8;--am-grey:#888;--am-hot:#ff2d7b;}
.am-hidden{display:none !important;}.am-visible{display:block !important;}

/* Atmosphere */
.am-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:0;pointer-events:none;overflow:hidden;}
.am-confetti{position:absolute;width:8px;border-radius:1px;opacity:0;}
.am-confetti.fall{animation:am-cfall linear infinite;}
@keyframes am-cfall{0%{opacity:.6;transform:translateY(-30px) rotate(0deg) scaleX(1);}25%{transform:translateY(25vh) rotate(270deg) scaleX(.5);}50%{transform:translateY(50vh) rotate(540deg) scaleX(1);}75%{transform:translateY(75vh) rotate(810deg) scaleX(.5);}100%{opacity:0;transform:translateY(110vh) rotate(1080deg) scaleX(1);}}
.am-spot{position:absolute;width:200px;height:700px;background:linear-gradient(180deg,rgba(255,209,60,.06) 0%,transparent 100%);transform-origin:top center;border-radius:0 0 50% 50%;}
.am-spot.s1{left:5%;top:-30px;animation:am-sweep 7s ease-in-out infinite;}
.am-spot.s2{right:8%;top:-30px;animation:am-sweep 7s ease-in-out infinite 2.5s;}
.am-spot.s3{left:40%;top:-30px;animation:am-sweep 5s ease-in-out infinite 4s;}
.am-spot.s4{left:65%;top:-30px;animation:am-sweep 9s ease-in-out infinite 1s;}
@keyframes am-sweep{0%{transform:rotate(-20deg);opacity:.5}50%{transform:rotate(20deg);opacity:1}100%{transform:rotate(-20deg);opacity:.5}}
.am-float-die{position:absolute;opacity:.03;font-size:28px;animation:am-diefloat linear infinite;}
@keyframes am-diefloat{0%{transform:translateY(110vh) rotate(0deg);}100%{transform:translateY(-10vh) rotate(720deg);}}
.am-floor{position:fixed;bottom:0;left:0;right:0;height:300px;background:radial-gradient(ellipse at 50% 100%,rgba(255,60,138,.08) 0%,rgba(255,209,60,.04) 40%,transparent 70%);pointer-events:none;z-index:0;}
.am-panel-l,.am-panel-r{position:fixed;top:0;bottom:0;width:80px;z-index:0;pointer-events:none;}
.am-panel-l{left:0;background:linear-gradient(90deg,rgba(90,10,74,.3),transparent);}
.am-panel-r{right:0;background:linear-gradient(270deg,rgba(90,10,74,.3),transparent);}

/* Broadcast chrome */
.am-broadcast{position:sticky;top:46px;left:0;right:0;z-index:100;height:36px;background:linear-gradient(90deg,rgba(16,4,24,.97),rgba(58,18,88,.97),rgba(90,10,74,.97));border-bottom:2px solid var(--am-gold);display:flex;align-items:center;padding:0 16px;font-size:11px;}
.am-live{display:flex;align-items:center;gap:6px;color:var(--am-pink);text-transform:uppercase;letter-spacing:2px;font-size:9px;font-weight:700;font-family:'Press Start 2P',monospace;}
.am-live-dot{width:8px;height:8px;background:var(--am-pink);border-radius:50%;animation:am-blink 1s infinite;}
@keyframes am-blink{0%,100%{opacity:1}50%{opacity:.2}}
.am-ticker{flex:1;overflow:hidden;margin:0 16px;height:18px;position:relative;}
.am-ticker-inner{position:absolute;white-space:nowrap;animation:am-scroll 25s linear infinite;font-size:10px;color:var(--am-gold);letter-spacing:1px;font-family:'Fredoka',sans-serif;}
@keyframes am-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.am-channel{font-family:'Bungee',sans-serif;color:var(--am-pink);font-size:11px;letter-spacing:2px;}

/* Shell */
.am-shell{max-width:1100px;margin:8px auto 120px;display:grid;grid-template-columns:1fr 260px;grid-template-rows:auto auto 1fr;gap:0;position:relative;z-index:2;border:2px solid rgba(255,209,60,.15);border-radius:8px;overflow:visible;background:linear-gradient(180deg,rgba(42,10,58,.95),rgba(58,18,88,.85),rgba(42,10,58,.95));box-shadow:0 0 80px rgba(255,60,138,.06),0 0 120px rgba(0,0,0,.5);}
.am-main{padding:0;overflow:visible;position:relative;}

/* Banner */
.am-banner{text-align:center;padding:32px 16px 20px;position:relative;overflow:hidden;grid-column:1;}
.am-banner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,209,60,.1) 0%,transparent 60%);}
.am-banner-sub{font-family:'Fredoka',sans-serif;font-size:11px;color:rgba(255,60,138,.7);letter-spacing:4px;text-transform:uppercase;position:relative;z-index:1;}
.am-banner-main{font-family:'Bungee Shade',sans-serif;font-size:42px;color:var(--am-gold);text-shadow:0 0 30px rgba(255,209,60,.4),0 4px 0 var(--am-gold-dk),0 0 80px rgba(255,209,60,.15);margin:6px 0;position:relative;z-index:1;letter-spacing:3px;animation:am-title-glow 3s ease-in-out infinite alternate;}
@keyframes am-title-glow{0%{text-shadow:0 0 30px rgba(255,209,60,.4),0 4px 0 var(--am-gold-dk);}100%{text-shadow:0 0 50px rgba(255,209,60,.6),0 4px 0 var(--am-gold-dk),0 0 100px rgba(255,209,60,.2);}}
.am-banner-phase{font-family:'Bangers',sans-serif;font-size:18px;color:var(--am-pink);letter-spacing:3px;text-transform:uppercase;position:relative;z-index:1;}

/* Ticker bar */
.am-ticker-bar{background:linear-gradient(90deg,var(--am-gold),var(--am-pink),var(--am-gold));padding:4px 0;overflow:hidden;grid-column:1;}
.am-ticker-bar-inner{display:flex;gap:60px;animation:am-scroll 30s linear infinite;white-space:nowrap;font-family:'Bangers',sans-serif;font-size:12px;color:var(--am-deep);padding:0 8px;letter-spacing:1px;}

/* Board map */
.am-board{position:sticky;top:84px;z-index:20;min-height:180px;background:linear-gradient(180deg,#2a0e40 0%,#3a1258 40%,#2a0e40 100%);border-bottom:3px solid var(--am-pink);padding:14px 16px 16px;margin:0;overflow:visible;}
.am-board::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0px,transparent 58px,rgba(255,209,60,.02) 58px,rgba(255,209,60,.02) 60px),repeating-linear-gradient(0deg,transparent 0px,transparent 58px,rgba(255,60,138,.02) 58px,rgba(255,60,138,.02) 60px);pointer-events:none;}
.am-board-label{font-family:'Press Start 2P',monospace;font-size:7px;color:var(--am-gold);letter-spacing:3px;opacity:.5;margin-bottom:8px;}
.am-track{display:flex;flex-wrap:wrap;gap:5px;position:relative;padding:4px 0;}
.am-sq{width:54px;height:62px;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;transition:all .3s;flex-shrink:0;}
.am-sq.normal{background:rgba(255,209,60,.06);border:1.5px solid rgba(255,209,60,.15);}
.am-sq.trap-revealed{background:rgba(255,60,60,.12);border:1.5px solid rgba(255,60,60,.4);animation:am-trap-pulse 1.5s ease-in-out infinite;}
@keyframes am-trap-pulse{0%,100%{box-shadow:0 0 8px rgba(255,60,60,.2)}50%{box-shadow:0 0 20px rgba(255,60,60,.5)}}
.am-sq.finish{background:linear-gradient(135deg,rgba(255,209,60,.15),rgba(255,60,138,.1));border:2px solid var(--am-gold);box-shadow:0 0 20px rgba(255,209,60,.2);animation:am-finish-glow 2s ease-in-out infinite;}
@keyframes am-finish-glow{0%,100%{box-shadow:0 0 10px rgba(255,209,60,.15)}50%{box-shadow:0 0 30px rgba(255,209,60,.4)}}
.am-sq.start{background:rgba(255,255,255,.03);border:1.5px dashed rgba(255,255,255,.12);}
.am-sq-num{font-family:'Press Start 2P',monospace;font-size:6px;color:rgba(255,255,255,.35);}
.am-sq-icon{margin-top:3px;}
.am-sq-label{font-family:'Press Start 2P',monospace;font-size:5px;color:rgba(255,255,255,.2);margin-top:2px;max-width:50px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.am-sq.active{transform:scale(1.12);border-color:#fff;box-shadow:0 0 15px rgba(255,255,255,.25);z-index:3;}

/* Tokens */
.am-token{width:30px;height:30px;border-radius:50%;border:2.5px solid #fff;position:absolute;bottom:-8px;overflow:hidden;z-index:4;box-shadow:0 2px 10px rgba(0,0,0,.7);transition:left .8s cubic-bezier(.4,0,.2,1),bottom .8s cubic-bezier(.4,0,.2,1),transform .3s;}
.am-token img{width:100%;height:100%;object-fit:cover;}
.am-token.moving{animation:am-token-hop .6s ease-out;}
@keyframes am-token-hop{0%{transform:translateY(0)}30%{transform:translateY(-18px)}60%{transform:translateY(-4px)}100%{transform:translateY(0)}}
.am-token.eliminated{opacity:.25;filter:grayscale(1) brightness(.5);transform:scale(.6);border-color:var(--am-grey);}
.am-token.eliminated::after{content:'\\2715';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:var(--am-red);text-shadow:0 0 6px rgba(0,0,0,.9);}
.am-token .initials{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Bungee',sans-serif;font-size:10px;color:#fff;background:rgba(255,255,255,.15);}

/* Dice */
.am-dice-zone{position:absolute;top:8px;right:16px;display:flex;flex-direction:column;align-items:center;gap:4px;z-index:10;}
.am-dice-label{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--am-pink);letter-spacing:2px;}
.am-dice-box{width:64px;height:64px;perspective:400px;}
.am-dice-face{width:64px;height:64px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.5),inset 0 -4px 0 rgba(0,0,0,.1),0 0 30px rgba(255,209,60,.15);position:relative;transition:transform .1s;}
.am-dice-pips{display:grid;grid-template-columns:repeat(3,14px);grid-template-rows:repeat(3,14px);gap:3px;padding:4px;}
.am-pip{width:14px;height:14px;border-radius:50%;background:transparent;}
.am-pip.on{background:var(--am-deep);box-shadow:inset 0 2px 3px rgba(0,0,0,.3);}
.am-dice-result{font-family:'Bungee',sans-serif;font-size:11px;color:var(--am-gold);letter-spacing:1px;margin-top:2px;opacity:0;transition:opacity .3s;}
.am-dice-result.show{opacity:1;}
.am-dice-tumble{animation:am-dice-roll .6s cubic-bezier(.2,0,.4,1);}
@keyframes am-dice-roll{0%{transform:rotateX(0) rotateZ(0) scale(1);}25%{transform:rotateX(180deg) rotateZ(90deg) scale(.85);}50%{transform:rotateX(360deg) rotateZ(180deg) scale(.9);}75%{transform:rotateX(540deg) rotateZ(270deg) scale(.95);}100%{transform:rotateX(720deg) rotateZ(360deg) scale(1);}}

/* Icons */
.am-icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;position:relative;}
.am-icon-obstacle::before{content:'';width:14px;height:2px;background:var(--am-orange);position:absolute;top:8px;}
.am-icon-obstacle::after{content:'';width:2px;height:12px;background:var(--am-orange);position:absolute;left:3px;top:4px;box-shadow:8px 0 0 var(--am-orange);}
.am-icon-trivia::before{content:'?';font-family:'Bungee',sans-serif;font-size:16px;color:var(--am-cyan);}
.am-icon-feast::before{content:'';width:3px;height:14px;background:var(--am-green);border-radius:1px;position:absolute;}
.am-icon-feast::after{content:'';width:10px;height:6px;border:2px solid var(--am-green);border-top:none;border-radius:0 0 5px 5px;position:absolute;top:2px;}
.am-icon-laser::before{content:'';width:14px;height:14px;border:2px solid var(--am-cyan);border-radius:50%;position:absolute;}
.am-icon-laser::after{content:'+';font-size:10px;color:var(--am-cyan);font-weight:900;}
.am-icon-crowd::before{content:'';width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:10px solid var(--am-violet);position:absolute;left:6px;}
.am-icon-crowd::after{content:'';width:6px;height:8px;background:var(--am-violet);border-radius:2px 0 0 2px;position:absolute;left:0;top:6px;}
.am-icon-puzzle::before{content:'';width:12px;height:12px;background:var(--am-gold);border-radius:2px;position:absolute;}
.am-icon-puzzle::after{content:'';width:6px;height:6px;background:var(--am-gold);border-radius:50%;position:absolute;top:-2px;left:3px;}
.am-icon-memory::before{content:'';width:14px;height:12px;background:var(--am-pink);border-radius:50% 50% 0 0;position:absolute;top:2px;}
.am-icon-memory::after{content:'';width:1px;height:10px;background:var(--am-deep);position:absolute;top:3px;}
.am-icon-roast::before{content:'';width:8px;height:12px;background:var(--am-orange);border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;position:absolute;top:2px;}
.am-icon-roast::after{content:'';width:4px;height:7px;background:var(--am-gold);border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;position:absolute;top:5px;}
.am-icon-creature::before{content:'';width:3px;height:14px;background:var(--am-red);border-radius:1px;transform:rotate(-15deg);position:absolute;box-shadow:5px 0 0 var(--am-red),10px 0 0 var(--am-red);}
.am-icon-trap::before{content:'';width:12px;height:3px;background:var(--am-neon);position:absolute;bottom:3px;border-radius:1px;}
.am-icon-trap::after{content:'';width:8px;height:8px;border:2px solid var(--am-neon);border-top:none;border-right:none;border-radius:0 0 0 4px;position:absolute;top:3px;left:4px;}
.am-icon-trophy::before{content:'';width:12px;height:10px;background:var(--am-gold);border-radius:0 0 4px 4px;position:absolute;top:4px;}
.am-icon-trophy::after{content:'';width:18px;height:8px;border:2px solid var(--am-gold);border-bottom:none;border-radius:4px 4px 0 0;position:absolute;top:0;}
.am-icon-skull::before{content:'';width:14px;height:12px;background:var(--am-red);border-radius:50% 50% 20% 20%;position:absolute;top:1px;}
.am-icon-skull::after{content:'';width:10px;height:4px;background:var(--am-deep2);border-radius:0 0 2px 2px;position:absolute;top:9px;left:3px;box-shadow:inset 3px 0 0 var(--am-red);}
.am-icon-start::before{content:'';width:2px;height:14px;background:rgba(255,255,255,.4);position:absolute;left:6px;top:2px;}
.am-icon-start::after{content:'';width:10px;height:7px;background:rgba(255,255,255,.12);position:absolute;left:8px;top:2px;clip-path:polygon(0 0,100% 50%,0 100%);}

/* Energy bar */
.am-energy-fill.high{background:linear-gradient(90deg,var(--am-green),#4ade80);}
.am-energy-fill.mid{background:linear-gradient(90deg,#f59e0b,var(--am-gold));}
.am-energy-fill.low{background:linear-gradient(90deg,var(--am-red),var(--am-orange));animation:am-energy-danger 1s ease-in-out infinite;}
@keyframes am-energy-danger{0%,100%{opacity:1}50%{opacity:.4}}

/* Cards */
.am-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,209,60,.08);border-radius:8px;padding:14px 16px;margin:10px 16px;position:relative;overflow:hidden;font-family:'Fredoka',sans-serif;color:var(--am-cream);}
.am-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(255,209,60,.15) 50%,transparent 90%);}
.am-card.roll{border-left:4px solid var(--am-gold);}
.am-card.challenge{border-left:4px solid var(--am-cyan);}
.am-card.trap{border-left:4px solid var(--am-red);background:rgba(255,60,60,.04);}
.am-card.social{border-left:4px solid var(--am-violet);}
.am-card.ko{border-left:4px solid var(--am-red);background:linear-gradient(90deg,rgba(255,60,60,.06),transparent);animation:am-ko-shake .5s ease-in-out;}
@keyframes am-ko-shake{0%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}100%{transform:translateX(0)}}
.am-card.winner-card{border:2px solid var(--am-gold);background:rgba(255,209,60,.05);box-shadow:0 0 30px rgba(255,209,60,.08);}
.am-card.cameo{border-left:4px solid var(--am-neon);background:rgba(57,255,20,.02);}
.am-card-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.am-card-avatar{width:32px;height:32px;border-radius:50%;border:2px solid;overflow:hidden;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,.4);}
.am-card-avatar img{width:100%;height:100%;object-fit:cover;}
.am-card-who{font-family:'Bungee',sans-serif;font-size:13px;color:var(--am-cream);}
.am-card-tag{font-family:'Press Start 2P',monospace;font-size:7px;padding:3px 8px;border-radius:3px;margin-left:auto;letter-spacing:1px;}
.tag-roll{background:rgba(255,209,60,.15);color:var(--am-gold);}
.tag-challenge{background:rgba(0,212,255,.1);color:var(--am-cyan);}
.tag-trap{background:rgba(255,60,60,.2);color:var(--am-red);animation:am-trap-flash .6s ease-in-out 3;}
@keyframes am-trap-flash{0%,100%{opacity:1}50%{opacity:.3}}
.tag-ko{background:rgba(255,60,60,.25);color:var(--am-red);}
.tag-social{background:rgba(180,77,255,.1);color:var(--am-violet);}
.tag-win{background:rgba(255,209,60,.25);color:var(--am-gold);}
.tag-cameo{background:rgba(57,255,20,.1);color:var(--am-neon);}
.tag-dom{background:rgba(255,209,60,.2);color:var(--am-gold);}
.am-card-body{font-family:'Fredoka',sans-serif;font-size:13px;color:#bbb;line-height:1.6;}
.am-card-foot{font-family:'Press Start 2P',monospace;font-size:7px;color:#666;margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.am-energy-pill{display:inline-flex;align-items:center;gap:3px;font-family:'Press Start 2P',monospace;font-size:8px;padding:2px 6px;border-radius:3px;}
.am-energy-pill.drain{background:rgba(255,60,60,.15);color:var(--am-red);}
.am-energy-pill.gain{background:rgba(0,200,100,.1);color:var(--am-green);}
.am-callback{display:inline-flex;align-items:center;gap:4px;font-family:'Press Start 2P',monospace;font-size:6px;color:rgba(0,212,255,.5);background:rgba(0,212,255,.04);padding:2px 6px;border-radius:2px;margin-bottom:6px;}
.am-card-energy{display:flex;align-items:center;gap:6px;margin-top:6px;}
.am-card-energy-bar{flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;}
.am-card-energy-fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1);}
.am-card-energy-label{font-family:'Press Start 2P',monospace;font-size:7px;color:#888;white-space:nowrap;}

/* Winner card */
.am-winner{text-align:center;padding:36px 20px;margin:16px;border:2px solid var(--am-gold);background:linear-gradient(180deg,rgba(255,209,60,.06),rgba(255,60,138,.04));position:relative;border-radius:12px;overflow:hidden;}
.am-winner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(255,209,60,.1) 0%,transparent 70%);}
.am-winner-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.am-winner-confetti span{position:absolute;width:6px;height:10px;opacity:0;border-radius:1px;}
.am-winner-confetti span.go{animation:am-wconf 3.5s ease-out forwards;}
@keyframes am-wconf{0%{opacity:1;transform:translateY(-20px) rotate(0deg)}100%{opacity:0;transform:translateY(350px) rotate(1200deg)}}
.am-winner-avatar{width:72px;height:72px;border-radius:50%;border:3px solid var(--am-gold);margin:0 auto 10px;overflow:hidden;box-shadow:0 0 25px rgba(255,209,60,.3);position:relative;z-index:1;}
.am-winner-avatar img{width:100%;height:100%;object-fit:cover;}
.am-winner-label{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--am-pink);letter-spacing:4px;text-transform:uppercase;position:relative;z-index:1;}
.am-winner-name{font-family:'Bungee Shade',sans-serif;font-size:36px;color:var(--am-gold);text-shadow:0 0 30px rgba(255,209,60,.5);margin:8px 0;position:relative;z-index:1;}
.am-winner-sub{font-family:'Fredoka',sans-serif;font-size:15px;color:#aaa;font-style:italic;position:relative;z-index:1;}
.am-winner-beats{margin-top:14px;font-family:'Press Start 2P',monospace;font-size:8px;color:#888;position:relative;z-index:1;}

/* Round banner */
.am-round{text-align:center;padding:18px;margin:8px 16px;position:relative;overflow:hidden;border-radius:6px;background:rgba(255,209,60,.02);border:1px solid rgba(255,209,60,.06);}
.am-round::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,60,138,.03),transparent);}
.am-round-num{font-family:'Bungee Shade',sans-serif;font-size:26px;color:var(--am-gold);text-shadow:0 0 20px rgba(255,209,60,.2);position:relative;z-index:1;}
.am-round-sub{font-family:'Fredoka',sans-serif;font-size:12px;color:#999;margin-top:4px;position:relative;z-index:1;}

/* Sidebar */
.am-sidebar{grid-column:2;grid-row:1/-1;border-left:2px solid rgba(255,60,138,.15);background:linear-gradient(180deg,rgba(42,10,58,.95),rgba(90,10,74,.6),rgba(42,10,58,.95));padding:14px;font-size:12px;position:sticky;top:46px;height:calc(100vh - 46px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,209,60,.15) transparent;overscroll-behavior:contain;}
.am-sb-title{font-family:'Bungee',sans-serif;font-size:9px;color:var(--am-pink);letter-spacing:2px;text-transform:uppercase;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(255,60,138,.15);}
.am-sb-title:first-child{margin-top:0;}
.am-sb-player{display:flex;align-items:center;gap:8px;padding:6px 8px;margin:5px 0;background:rgba(255,255,255,.02);border:1px solid rgba(255,209,60,.05);border-radius:5px;transition:all .3s;}
.am-sb-player.ko{opacity:.3;filter:grayscale(.8);}
.am-sb-player.winner{border-color:var(--am-gold);background:rgba(255,209,60,.06);box-shadow:0 0 12px rgba(255,209,60,.1);}
.am-sb-avatar{width:26px;height:26px;border-radius:50%;border:2px solid;overflow:hidden;flex-shrink:0;}
.am-sb-avatar img{width:100%;height:100%;object-fit:cover;}
.am-sb-info{flex:1;min-width:0;}
.am-sb-name{font-family:'Fredoka',sans-serif;font-size:11px;color:var(--am-cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.am-sb-pos{font-family:'Press Start 2P',monospace;font-size:6px;color:#777;margin-top:1px;}
.am-sb-energy{height:5px;background:rgba(255,255,255,.05);border-radius:3px;margin-top:3px;overflow:hidden;}
.am-sb-energy-fill{height:100%;border-radius:3px;}
.am-sb-status{font-family:'Press Start 2P',monospace;font-size:7px;padding:2px 5px;border-radius:2px;flex-shrink:0;}
.am-sb-status.racing{background:rgba(0,200,100,.1);color:var(--am-green);}
.am-sb-status.ko{background:rgba(255,60,60,.12);color:var(--am-red);}
.am-sb-status.win{background:rgba(255,209,60,.2);color:var(--am-gold);}

/* Peanut gallery */
.am-peanut{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;}
.am-peanut-face{width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);overflow:hidden;position:relative;box-shadow:0 1px 4px rgba(0,0,0,.3);}
.am-peanut-face img{width:100%;height:100%;object-fit:cover;}

/* Controls */
.am-controls{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:linear-gradient(0deg,var(--am-deep),rgba(42,10,58,.96));border-top:2px solid var(--am-pink);padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:16px;}
.am-btn{font-family:'Bungee',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 24px;border:1.5px solid var(--am-gold);background:transparent;color:var(--am-gold);cursor:pointer;border-radius:4px;transition:all .2s;}
.am-btn:hover{background:var(--am-gold);color:var(--am-deep);}
.am-btn:active{transform:scale(.95);}
.am-counter{font-family:'Press Start 2P',monospace;font-size:10px;color:#888;}

/* Lottery card */
.am-lottery-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,209,60,.1);border-radius:8px;padding:12px 16px;margin:8px 16px;display:flex;align-items:center;gap:12px;}
.am-lottery-card.golden{border-color:var(--am-gold);background:rgba(255,209,60,.05);box-shadow:0 0 15px rgba(255,209,60,.1);}
.am-lottery-card.empty{border-color:rgba(255,255,255,.05);opacity:.6;}
.am-lottery-avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid;flex-shrink:0;}
.am-lottery-avatar img{width:100%;height:100%;object-fit:cover;}
.am-lottery-text{flex:1;font-family:'Fredoka',sans-serif;font-size:13px;color:#bbb;line-height:1.5;}
.am-lottery-badge{font-family:'Press Start 2P',monospace;font-size:7px;padding:3px 8px;border-radius:3px;letter-spacing:1px;flex-shrink:0;}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){.am-spot,.am-confetti,.am-ticker-inner,.am-ticker-bar-inner,.am-sq.finish,.am-energy-fill.low,.am-float-die,.am-winner-confetti span,.am-card.ko,.am-token.moving{animation:none !important;}}
</style>`;
}

// ── Atmosphere HTML ──
function _amAtmosphere() {
  const confettiColors = ['var(--am-gold)', 'var(--am-pink)', 'var(--am-cyan)', 'var(--am-violet)', 'var(--am-neon)', 'var(--am-orange)', 'var(--am-hot)'];
  let confetti = '';
  for (let i = 0; i < 12; i++) {
    const left = 4 + (i * 8.3) % 96;
    const h = 5 + (i % 4) * 2;
    const dur = 3 + (i * 0.7) % 3;
    const delay = (i * 0.4) % 4;
    confetti += `<div class="am-confetti fall" style="left:${left}%;height:${h}px;background:${confettiColors[i % confettiColors.length]};animation-duration:${dur}s;animation-delay:${delay}s;"></div>\n`;
  }
  let dice = '';
  const dicePositions = [8, 30, 55, 75, 92];
  const diceSizes = [32, 24, 36, 20, 28];
  const diceDurations = [18, 22, 16, 20, 24];
  const diceDelays = [0, 5, 8, 3, 10];
  for (let i = 0; i < 5; i++) {
    dice += `<div class="am-float-die" style="left:${dicePositions[i]}%;font-size:${diceSizes[i]}px;animation-duration:${diceDurations[i]}s;animation-delay:${diceDelays[i]}s;">&#x1f3b2;</div>\n`;
  }
  return `<div class="am-atmo">
  <div class="am-spot s1"></div><div class="am-spot s2"></div><div class="am-spot s3"></div><div class="am-spot s4"></div>
  ${confetti}${dice}
</div>
<div class="am-floor"></div>
<div class="am-panel-l"></div><div class="am-panel-r"></div>`;
}

// ── Broadcast chrome ──
function _amBroadcast(tickerItems) {
  const items = tickerItems.map(t => `<span>${t}</span>`).join('');
  return `<div class="am-broadcast">
  <div class="am-live"><div class="am-live-dot"></div>AFTERMATH LIVE</div>
  <div class="am-ticker"><div class="am-ticker-inner">${items}</div></div>
  <div class="am-channel">CH.AM</div>
</div>`;
}

// ── Shell wrapper ──
function _shell(content, ep, phaseCls, sidebarHtml) {
  const am = ep?.aftermath?.aftermayhem;
  const tickerItems = [];
  if (am) {
    if (am.winner) tickerItems.push(`&#x2B25; ${am.winner.toUpperCase()} WINS THE AFTERMAYHEM!`);
    const leader = am.racers?.filter(r => r.alive)?.sort((a, b) => b.finalPosition - a.finalPosition)?.[0];
    if (leader) tickerItems.push(`&#x2B25; ${leader.name.toUpperCase()} LEADS AT SQ ${leader.finalPosition}`);
    const low = am.racers?.filter(r => r.alive)?.sort((a, b) => a.finalEnergy - b.finalEnergy)?.[0];
    if (low && low.finalEnergy <= 30) tickerItems.push(`&#x2B25; ${low.name.toUpperCase()} DOWN TO ${low.finalEnergy} ENERGY`);
    am.revealedTraps?.forEach(sq => tickerItems.push(`&#x2B25; TRAP ON SQUARE ${sq}!`));
    tickerItems.push(`&#x2B25; DICE RANGE 1-6`);
    tickerItems.push(`&#x2B25; FIRST TO THE TROPHY CASE RETURNS!`);
  } else {
    tickerItems.push(`&#x2B25; DICE RANGE: 1-6`, `&#x2B25; FIRST TO THE TROPHY CASE RETURNS!`, `&#x2B25; BOOBY TRAPS DRAIN 30 ENERGY`);
  }

  const sidebar = sidebarHtml || `<div class="am-sidebar"><div id="am-sidebar-inner">${_buildSidebarContent(ep, phaseCls)}</div></div>`;

  return `${_amCSS()}
${_amAtmosphere()}
${_amBroadcast(tickerItems)}
<div class="am-shell" data-phase="${phaseCls}">
  <div class="am-banner">
    <div class="am-banner-sub">Aftermath Presents</div>
    <div class="am-banner-main">AFTERMAYHEM</div>
    <div class="am-banner-phase">${phaseCls === 'am-lottery' ? 'Golden Can Lottery' : phaseCls === 'am-finish' ? 'Trophy Case' : 'Race to the Trophy Case'}</div>
  </div>
  <div class="am-ticker-bar"><div class="am-ticker-bar-inner">${tickerItems.map(t => `<span>${t}</span>`).join('')}</div></div>
  <div class="am-main">
    ${content}
  </div>
  ${sidebar}
</div>
<div style="height:80px;"></div>`;
}

// ── Sidebar content ──
function _buildSidebarContent(ep, screenKey) {
  const am = ep?.aftermath?.aftermayhem;
  if (!am) return '<div style="color:#555;font-size:10px;">No data</div>';

  const st = _tvState[screenKey];
  const revealIdx = st?.idx ?? -1;

  // Build snapshots-based state if available
  const snapshots = window._amBoardSnapshots;
  let playerStates = {};

  if (snapshots && screenKey?.includes('board')) {
    const snapIdx = Math.min(Math.max(revealIdx, 0), snapshots.length - 1);
    const snap = snapshots[snapIdx];
    if (snap) {
      am.racers.forEach(r => {
        playerStates[r.name] = {
          position: snap.positions[r.name] ?? 0,
          energy: snap.energies[r.name] ?? 100,
          alive: !snap.ko.has(r.name),
          isWinner: snap.winner === r.name,
          koRound: snap.koRounds[r.name] || null,
        };
      });
    }
  }

  // Fallback to final state
  if (Object.keys(playerStates).length === 0) {
    am.racers.forEach(r => {
      playerStates[r.name] = {
        position: screenKey?.includes('lottery') ? 0 : r.finalPosition,
        energy: screenKey?.includes('lottery') ? 100 : r.finalEnergy,
        alive: r.alive,
        isWinner: r.name === am.winner,
        koRound: r.koRound,
      };
    });
  }

  let html = '<div class="am-sb-title">ENERGY TRACKER</div>';

  // Sort: winner first, then by position desc, then ko'd
  const sorted = [...am.racers].sort((a, b) => {
    const sa = playerStates[a.name] || {};
    const sb = playerStates[b.name] || {};
    if (sa.isWinner && !sb.isWinner) return -1;
    if (!sa.isWinner && sb.isWinner) return 1;
    if (sa.alive && !sb.alive) return -1;
    if (!sa.alive && sb.alive) return 1;
    return (sb.position || 0) - (sa.position || 0);
  });

  sorted.forEach((r, i) => {
    const ps = playerStates[r.name] || {};
    const isKo = !ps.alive;
    const isWin = ps.isWinner;
    const energy = ps.energy ?? 100;
    const pos = ps.position ?? 0;
    const eCls = _energyClass(energy);
    const cls = isWin ? 'winner' : isKo ? 'ko' : '';
    const statusHtml = isWin ? '<span class="am-sb-status win">&#9733; WIN</span>' : isKo ? '<span class="am-sb-status ko">K.O.</span>' : '<span class="am-sb-status racing">RACING</span>';
    const posText = isWin ? `Sq ${pos} &#8212; FINISH` : isKo ? `Sq ${pos} &#8212; KO'd R${ps.koRound || '?'}` : `Sq ${pos}`;
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];

    html += `<div class="am-sb-player ${cls}">
      <div class="am-sb-avatar" style="border-color:${color};"><img src="assets/avatars/${slug(r.name)}.png" onerror="this.style.display='none'" alt="${r.name}"></div>
      <div class="am-sb-info">
        <div class="am-sb-name">${r.name}</div>
        <div class="am-sb-pos">${posText}</div>
        <div class="am-sb-energy"><div class="am-sb-energy-fill am-energy-fill ${isKo ? '' : eCls}" style="width:${isKo ? 0 : energy}%;${isKo ? 'background:var(--am-red);' : ''}"></div></div>
      </div>
      ${statusHtml}
    </div>`;
  });

  // Peanut gallery
  const gallery = am.peanutGallery || [];
  if (gallery.length > 0) {
    html += '<div class="am-sb-title">PEANUT GALLERY</div><div class="am-peanut">';
    gallery.slice(0, 8).forEach(n => {
      html += `<div class="am-peanut-face"><img src="assets/avatars/${slug(n)}.png" onerror="this.style.display='none'" alt="${n}"></div>`;
    });
    html += '</div>';
  }

  // Round log
  if (am.rounds && screenKey?.includes('board')) {
    html += '<div class="am-sb-title">ROUND LOG</div>';
    html += '<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;line-height:2.2;">';
    am.rounds.forEach((rd, ri) => {
      // Gate by reveal
      const roundStartStep = window._amRoundStartSteps?.[ri];
      if (roundStartStep !== undefined && revealIdx < roundStartStep) {
        html += `<div style="color:#444;">R${rd.roundNum}: ...</div>`;
      } else {
        const kos = rd.eliminations.map(e => e.name).join(', ');
        const color = kos ? 'var(--am-red)' : 'var(--am-green)';
        const text = kos ? `${kos} KO'd` : `${rd.turns.filter(t => !t.isWinner).length} turns`;
        const check = rd.turns.some(t => t.isWinner) ? ' &#9733;' : ' &#10003;';
        html += `<div style="color:${color};">R${rd.roundNum}: ${text}${check}</div>`;
      }
    });
    html += '</div>';
  }

  // Season callbacks
  if (am.board?.squares) {
    html += '<div class="am-sb-title">SEASON CALLBACKS</div>';
    html += '<div style="font-family:\'Press Start 2P\',monospace;font-size:6px;color:#555;line-height:2.5;">';
    am.board.squares.forEach(sq => {
      if (sq.callback) {
        const isCameo = sq.cameo;
        html += `<div${isCameo ? ' style="color:var(--am-neon);"' : ''}>Sq${sq.sq}: ${sq.callback}</div>`;
      }
    });
    html += '</div>';
  }

  return html;
}


// ══════════════════════════════════════════════════════════════
// VP SCREEN: LOTTERY
// ══════════════════════════════════════════════════════════════

export function rpBuildAftermayhemLottery(ep) {
  const am = ep?.aftermath?.aftermayhem;
  if (!am?.lottery) return '';

  const screenKey = 'am-lottery';
  const suffix = 'lottery';
  const lottery = am.lottery;

  // Steps: intro + each winner + loser reactions
  const totalSteps = 1 + lottery.winners.length + lottery.loserReactions.length;
  _ensureState(screenKey, totalSteps);

  window._amEpRecord = ep;

  let cardsHtml = '';
  let stepIdx = 0;

  // Step 0: Host intro
  const h = host();
  const hostSlug = seasonConfig?.hostSlug || 'chris';
  cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
    <div class="am-card roll" style="border-left:4px solid var(--am-gold);">
      <div class="am-card-head">
        <div class="am-card-avatar" style="border-color:var(--am-gold);"><img src="assets/avatars/${hostSlug}.png" onerror="this.style.display='none'" alt="${h}"></div>
        <span class="am-card-who" style="color:var(--am-gold);">${h.toUpperCase()}</span>
        <span class="am-card-tag tag-roll">GOLDEN CAN LOTTERY</span>
      </div>
      <div class="am-card-body">
        "Alright losers — I mean, <strong>eliminated players</strong>. Each of you has a peanut can in front of you. <strong>Six</strong> of those cans contain a Golden Chris Head. Find one? You're in the Aftermayhem — a board game race for the chance to return to the competition. Don't find one? Back to the peanut gallery where you belong."
      </div>
    </div>
  </div>`;
  stepIdx++;

  // Winner reveals
  lottery.winnerReactions.forEach((wr) => {
    const color = TOKEN_COLORS[stepIdx % TOKEN_COLORS.length];
    cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
      <div class="am-lottery-card golden">
        <div class="am-lottery-avatar" style="border-color:${color};"><img src="assets/avatars/${slug(wr.name)}.png" onerror="this.style.display='none'" alt="${wr.name}"></div>
        <div class="am-lottery-text"><strong>${wr.name}</strong> opens the can... <strong style="color:var(--am-gold);">GOLDEN CHRIS!</strong><br>${wr.text}</div>
        <div class="am-lottery-badge" style="background:rgba(255,209,60,.2);color:var(--am-gold);">&#9733; IN</div>
      </div>
    </div>`;
    stepIdx++;
  });

  // Loser reactions
  lottery.loserReactions.forEach((lr) => {
    const isGroup = lr.name === '_group';
    cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
      <div class="am-lottery-card empty">
        ${isGroup ? '' : `<div class="am-lottery-avatar" style="border-color:var(--am-grey);"><img src="assets/avatars/${slug(lr.name)}.png" onerror="this.style.display='none'" alt="${lr.name}"></div>`}
        <div class="am-lottery-text">${isGroup ? lr.text : `<strong>${lr.name}</strong>: ${lr.text}`}</div>
        <div class="am-lottery-badge" style="background:rgba(255,255,255,.05);color:var(--am-grey);">OUT</div>
      </div>
    </div>`;
    stepIdx++;
  });

  // Controls
  cardsHtml += `<div id="am-controls-${suffix}" class="am-controls" style="position:fixed;bottom:0;">
    <button class="am-btn" onclick="aftermayhemRevealNext('${screenKey}',${totalSteps})">&#x25C0; REVEAL NEXT</button>
    <span class="am-counter" id="am-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="am-btn" onclick="aftermayhemRevealAll('${screenKey}',${totalSteps})">REVEAL ALL &#x25B6;&#x25B6;</button>
  </div>`;

  return _shell(cardsHtml, ep, 'am-lottery');
}


// ══════════════════════════════════════════════════════════════
// VP SCREEN: BOARD GAME
// ══════════════════════════════════════════════════════════════

export function rpBuildAftermayhemBoard(ep) {
  const am = ep?.aftermath?.aftermayhem;
  if (!am?.rounds) return '';

  const screenKey = 'am-board';
  const suffix = 'board';

  window._amEpRecord = ep;

  // Build the board map HTML
  const boardSquares = am.board.squares;
  const trapsSet = new Set(am.board.traps);

  let boardTrackHtml = `<div class="am-sq start" data-sq="0"><div class="am-sq-num">START</div><div class="am-sq-icon">${_icon('start')}</div></div>`;
  boardSquares.forEach(sq => {
    const isTrap = trapsSet.has(sq.sq);
    // Start as normal — traps reveal dynamically
    boardTrackHtml += `<div class="am-sq normal" data-sq="${sq.sq}"><div class="am-sq-num">${sq.sq}</div><div class="am-sq-icon">${_icon(sq.type)}</div><div class="am-sq-label">${sq.callback || sq.typeName}</div></div>`;
  });
  boardTrackHtml += `<div class="am-sq finish" data-sq="${BOARD_FINISH}"><div class="am-sq-num">&#9733;</div><div class="am-sq-icon">${_icon('trophy')}</div><div class="am-sq-label">TROPHY</div></div>`;

  // Tokens — initially stacked at START square with stagger
  let tokensHtml = '';
  const numRacers = am.racers.length;
  am.racers.forEach((r, i) => {
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
    const s = slug(r.name);
    const staggerX = numRacers > 1 ? (i - (numRacers - 1) / 2) * 14 : 0;
    const staggerY = i * 6;
    tokensHtml += `<div id="am-token-${s}" class="am-token" style="border-color:${color};left:${15 + staggerX}px;top:${-12 - staggerY}px;" data-pos="0">
      <img src="assets/avatars/${s}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="${r.name}">
      <div class="initials" style="display:none;background:${color};">${r.name[0]}</div>
    </div>`;
  });

  const boardMapHtml = `<div class="am-board" id="am-game-board">
    <div class="am-board-label">GAME BOARD &#8212; ROLL 1-6</div>
    <div class="am-dice-zone">
      <div class="am-dice-label">DICE</div>
      <div class="am-dice-box">
        <div class="am-dice-face">
          <div class="am-dice-pips" id="am-dice-pips">
            <div class="am-pip"></div><div class="am-pip"></div><div class="am-pip"></div>
            <div class="am-pip"></div><div class="am-pip on"></div><div class="am-pip"></div>
            <div class="am-pip"></div><div class="am-pip"></div><div class="am-pip"></div>
          </div>
        </div>
      </div>
      <div class="am-dice-result" id="am-dice-result"></div>
    </div>
    <div class="am-track" id="am-board-track">
      ${boardTrackHtml}
    </div>
    ${tokensHtml}
  </div>`;

  // Build all cards from rounds
  let cardsHtml = boardMapHtml;
  let stepIdx = 0;
  const snapshots = []; // For board map live updates
  const roundStartSteps = [];

  // Initial snapshot
  const positions = {};
  const energies = {};
  const ko = new Set();
  const koRounds = {};
  const revTraps = new Set();
  am.racers.forEach(r => { positions[r.name] = 0; energies[r.name] = 100; });
  snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: 0, winner: null });

  am.rounds.forEach((rd, ri) => {
    roundStartSteps.push(stepIdx);

    // Round banner
    const flavorText = ROUND_FLAVOR[Math.min(ri, ROUND_FLAVOR.length - 1)]();
    cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
      <div class="am-round">
        <div class="am-round-num">ROUND ${rd.roundNum}</div>
        <div class="am-round-sub">${flavorText}</div>
      </div>
    </div>`;
    snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: null });
    stepIdx++;

    // Host chatter between rounds
    if (ri > 0 && ri < am.rounds.length) {
      const chatter = pick(HOST_CHATTER)();
      const hostSlug = seasonConfig?.hostSlug || 'chris';
      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div style="text-align:center;padding:6px 16px;font-family:'Fredoka',sans-serif;font-size:11px;color:rgba(255,209,60,.4);font-style:italic;display:flex;align-items:center;gap:8px;justify-content:center;">
          <img src="assets/avatars/${hostSlug}.png" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,209,60,.2);object-fit:cover;" onerror="this.style.display='none'">
          <span>${chatter}</span>
        </div>
      </div>`;
      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: null });
      stepIdx++;
    }

    // Turns
    rd.turns.forEach((turn) => {
      const pr = pronouns(turn.player);
      const color = TOKEN_COLORS[am.racers.findIndex(r => r.name === turn.player) % TOKEN_COLORS.length];

      // Update tracking
      positions[turn.player] = turn.newPos;

      // Roll card
      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div class="am-card roll">
          <div class="am-card-head">
            <div class="am-card-avatar" style="border-color:${color};"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
            <span class="am-card-who">${turn.player}</span>
            <span class="am-card-tag tag-roll">ROLLED ${turn.diceRoll}</span>
          </div>
          <div class="am-card-body">${turn.rollText}</div>
          <div class="am-card-foot"><span>&#x2192; Advances from Sq ${turn.oldPos} to Sq ${turn.newPos}</span>${turn.diceRoll === 6 ? '<span class="am-energy-pill gain">+5 ENERGY</span>' : ''}</div>
        </div>
      </div>`;

      if (turn.diceRoll === 6) energies[turn.player] = clamp((energies[turn.player] || 100) + 5, 0, 100);
      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: turn.diceRoll, lastPlayer: turn.player, activeSquare: turn.newPos, winner: null });
      stepIdx++;

      // Trap card
      if (turn.isTrap && turn.trapText) {
        revTraps.add(turn.newPos);
        const trapActual = turn.actualTrapDmg || 30;
        const trapEnergy = turn.koBeforeChallenge ? 0 : (energies[turn.player] || 100) - trapActual;
        energies[turn.player] = clamp(trapEnergy, 0, 100);

        cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
          <div class="am-card trap">
            <div class="am-card-head">
              <div class="am-card-avatar" style="border-color:${color};"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
              <span class="am-card-who">${turn.player}</span>
              <span class="am-card-tag tag-trap">BOOBY TRAP!</span>
            </div>
            <div class="am-card-body">${turn.trapText}</div>
            <div class="am-card-foot">
              <span>TRAP DAMAGE</span>
              <span class="am-energy-pill drain">&#x2212;${turn.actualTrapDmg || 30} ENERGY</span>
            </div>
            ${!turn.koBeforeChallenge ? `<div class="am-card-body" style="margin-top:6px;font-style:italic;color:#999;">${turn.trapSurviveText}</div>` : ''}
            <div class="am-card-energy">
              <span class="am-card-energy-label"${energies[turn.player] <= 0 ? ' style="color:var(--am-red);"' : ''}>${turn.player.toUpperCase()} ${Math.max(0, energies[turn.player])} HP${energies[turn.player] <= 0 ? ' &#8212; ELIMINATED' : ''}</span>
              <div class="am-card-energy-bar"><div class="am-card-energy-fill am-energy-fill ${energies[turn.player] <= 0 ? '' : _energyClass(energies[turn.player])}" style="width:${Math.max(0, energies[turn.player])}%;${energies[turn.player] <= 0 ? 'background:var(--am-red);' : ''}"></div></div>
            </div>
          </div>
        </div>`;

        if (turn.koBeforeChallenge) {
          ko.add(turn.player);
          koRounds[turn.player] = rd.roundNum;
          energies[turn.player] = 0;
        }

        snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: turn.diceRoll, lastPlayer: turn.player, activeSquare: turn.newPos, winner: null });
        stepIdx++;

        // Trap backtrack card
        if (turn.trapBacktrack > 0) {
          positions[turn.player] = Math.max(1, positions[turn.player] - turn.trapBacktrack);
          cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
            <div class="am-card trap" style="border-left-color:var(--am-red);">
              <div class="am-card-head">
                <div class="am-card-avatar" style="border-color:var(--am-red);"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
                <span class="am-card-who" style="color:var(--am-red);">${turn.player}</span>
                <span class="am-card-tag tag-trap">KNOCKED BACK!</span>
              </div>
              <div class="am-card-body" style="color:var(--am-red);font-weight:600;">${turn.trapBacktrackText}</div>
              <div class="am-card-foot"><span>&#x2190; Back to Sq ${positions[turn.player]}</span></div>
            </div>
          </div>`;
          snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: turn.player, activeSquare: positions[turn.player], winner: null });
          stepIdx++;
        }
      }

      // KO card (from trap)
      if (turn.koBeforeChallenge) {
        const koElim = rd.eliminations.find(e => e.name === turn.player);
        if (koElim) {
          cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
            <div class="am-card ko">
              <div class="am-card-head">
                <div class="am-card-avatar" style="border-color:var(--am-grey);filter:grayscale(1);"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
                <span class="am-card-who" style="color:var(--am-red);">${turn.player} &#8212; KNOCKED OUT!</span>
                <span class="am-card-tag tag-ko">K.O.</span>
              </div>
              <div class="am-card-body" style="color:var(--am-red);font-weight:600;">${koElim.text}</div>
              <div class="am-card-energy">
                <span class="am-card-energy-label" style="color:var(--am-red);">${turn.player.toUpperCase()} 0 HP &#8212; ELIMINATED</span>
                <div class="am-card-energy-bar"><div class="am-card-energy-fill" style="width:0%;background:var(--am-red);"></div></div>
              </div>
            </div>
          </div>`;
          snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: turn.player, activeSquare: turn.newPos, winner: null });
          stepIdx++;
        }
        // Skip to next turn — no challenge
      }

      // Cameo video link card
      if (turn.cameo && !turn.koBeforeChallenge) {
        const cType = turn.cameo.type || 'neutral';
        const cText = turn.cameo.text || '';
        const cDelta = turn.cameo.energyDelta || 0;
        const tagColors = {
          'cheer': 'background:rgba(16,185,129,.15);color:var(--am-green);border-color:var(--am-green);',
          'heckle': 'background:rgba(255,60,60,.15);color:var(--am-red);border-color:var(--am-red);',
          'roast-win': 'background:rgba(255,209,60,.15);color:var(--am-gold);border-color:var(--am-gold);',
          'roast-fail': 'background:rgba(255,60,60,.15);color:var(--am-red);border-color:var(--am-red);',
          'neutral': 'background:rgba(255,255,255,.08);color:#aaa;border-color:#555;',
        };
        const tagLabels = { 'cheer': 'VIDEO CHEER', 'heckle': 'VIDEO HECKLE', 'roast-win': 'ROAST CLAP-BACK', 'roast-fail': 'ROASTED', 'neutral': 'VIDEO LINK' };

        if (cDelta !== 0) energies[turn.player] = clamp((energies[turn.player] || 100) + cDelta, 0, 100);

        cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
          <div class="am-card cameo">
            <div class="am-card-head">
              <div class="am-card-avatar" style="border-color:var(--am-neon);"><img src="assets/avatars/${slug(turn.cameo.activePlayer)}.png" onerror="this.style.display='none'" alt="${turn.cameo.activePlayer}"></div>
              <span class="am-card-who">${turn.cameo.activePlayer} via Video</span>
              <span class="am-card-tag" style="${tagColors[cType] || tagColors.neutral}">${tagLabels[cType] || 'VIDEO LINK'}</span>
            </div>
            <div class="am-card-body">${cText}</div>
            ${cDelta !== 0 ? `<div class="am-card-foot"><span>${turn.player}</span><span class="am-energy-pill ${cDelta > 0 ? 'gain' : 'drain'}">${cDelta > 0 ? '+' : ''}${cDelta} ENERGY</span></div>` : ''}
          </div>
        </div>`;
        snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: turn.newPos, winner: null });
        stepIdx++;
      }

      // Challenge card
      if (turn.challengeType && !turn.koBeforeChallenge && !turn.isWinner) {
        energies[turn.player] = turn.energyAfter;

        const isDom = turn.dominationText && turn.dominationText.length > 0;
        const callbackHtml = turn.callback ? `<div class="am-callback">${_icon(turn.challengeType)} CALLBACK: ${turn.callback}</div>` : '';

        cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
          <div class="am-card challenge">
            <div class="am-card-head">
              <div class="am-card-avatar" style="border-color:${color};"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
              <div style="flex:1;">
                <span class="am-card-who">${turn.player}</span>
                ${callbackHtml}
              </div>
              <span class="am-card-tag tag-challenge">${(turn.challengeTypeName || turn.challengeType).toUpperCase()}</span>
            </div>
            <div class="am-card-body">${turn.challengeText}${isDom ? `<div style="margin-top:6px;color:var(--am-gold);font-weight:700;">${turn.dominationText}</div>` : ''}</div>
            <div class="am-card-foot">
              <span>Score: ${turn.score?.toFixed(1) || '?'}${isDom ? ' &#9733; DOMINATION' : ''}</span>
              <span class="am-energy-pill ${turn.energyDelta >= 0 ? 'gain' : 'drain'}">${turn.energyDelta >= 0 ? '+' : ''}${turn.energyDelta} ENERGY</span>
            </div>
            <div class="am-card-energy">
              <span class="am-card-energy-label"${turn.energyAfter <= 0 ? ' style="color:var(--am-red);"' : ''}>${turn.player.toUpperCase()} ${Math.max(0, turn.energyAfter)} HP${turn.energyAfter <= 0 ? ' &#8212; ELIMINATED' : ''}</span>
              <div class="am-card-energy-bar"><div class="am-card-energy-fill am-energy-fill ${turn.energyAfter <= 0 ? '' : _energyClass(turn.energyAfter)}" style="width:${Math.max(0, turn.energyAfter)}%;${turn.energyAfter <= 0 ? 'background:var(--am-red);' : ''}"></div></div>
            </div>
          </div>
        </div>`;

        // KO after challenge
        if (turn.energyAfter <= 0) {
          ko.add(turn.player);
          koRounds[turn.player] = rd.roundNum;
          energies[turn.player] = 0;
        }

        snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: turn.player, activeSquare: turn.newPos, winner: null });
        stepIdx++;

        // KO card after challenge
        if (turn.energyAfter <= 0) {
          const koElim = rd.eliminations.find(e => e.name === turn.player);
          if (koElim) {
            cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
              <div class="am-card ko">
                <div class="am-card-head">
                  <div class="am-card-avatar" style="border-color:var(--am-grey);filter:grayscale(1);"><img src="assets/avatars/${slug(turn.player)}.png" onerror="this.style.display='none'" alt="${turn.player}"></div>
                  <span class="am-card-who" style="color:var(--am-red);">${turn.player} &#8212; KNOCKED OUT!</span>
                  <span class="am-card-tag tag-ko">K.O.</span>
                </div>
                <div class="am-card-body" style="color:var(--am-red);font-weight:600;">${koElim.text}</div>
                <div class="am-card-energy">
                  <span class="am-card-energy-label" style="color:var(--am-red);">${turn.player.toUpperCase()} 0 HP &#8212; ELIMINATED</span>
                  <div class="am-card-energy-bar"><div class="am-card-energy-fill" style="width:0%;background:var(--am-red);"></div></div>
                </div>
              </div>
            </div>`;
            snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: turn.player, activeSquare: turn.newPos, winner: null });
            stepIdx++;
          }
        }
      }

      // Winner card (reached finish)
      if (turn.isWinner) {
        positions[turn.player] = BOARD_FINISH;
        cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
          <div class="am-round" style="margin-top:16px;">
            <div class="am-round-num">FINISH!</div>
            <div class="am-round-sub">A player has reached the Trophy Case!</div>
          </div>
        </div>`;
        snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: turn.diceRoll, lastPlayer: turn.player, activeSquare: BOARD_FINISH, winner: turn.player });
        stepIdx++;
      }
    });

    // Social events for this round
    rd.socialEvents.forEach(se => {
      const sePlayer = se.players[0];
      const seTarget = se.players[1];
      let cardClass = 'social';
      let tagClass = 'tag-social';
      let tagLabel = se.type.toUpperCase().replace('-', ' ');
      let avatarPlayer = sePlayer;
      let avatarColor = 'var(--am-violet)';

      if (se.type === 'trash-talk') {
        const pi = am.racers.findIndex(r => r.name === sePlayer);
        avatarColor = pi >= 0 ? TOKEN_COLORS[pi % TOKEN_COLORS.length] : 'var(--am-red)';
        const targetRacer = am.racers.find(r => r.name === seTarget);
        if (targetRacer) energies[seTarget] = clamp((energies[seTarget] || 100) + (se.energyDelta || -5), 0, 100);
      } else if (se.type === 'encouragement') {
        const pi = am.racers.findIndex(r => r.name === sePlayer);
        avatarColor = pi >= 0 ? TOKEN_COLORS[pi % TOKEN_COLORS.length] : 'var(--am-green)';
        const targetRacer = am.racers.find(r => r.name === seTarget);
        if (targetRacer) energies[seTarget] = clamp((energies[seTarget] || 100) + (se.energyDelta || 5), 0, 100);
      } else if (se.type === 'showmance') {
        avatarColor = 'var(--am-pink)';
        tagLabel = 'SHOWMANCE';
        am.racers.forEach(r => {
          if (se.players.includes(r.name)) energies[r.name] = clamp((energies[r.name] || 100) + 5, 0, 100);
        });
      } else if (se.type === 'peanut-gallery') {
        tagLabel = 'PEANUT GALLERY';
        avatarColor = 'rgba(255,255,255,.3)';
      } else if (se.type === 'collision-rivalry') {
        avatarColor = 'var(--am-red)';
        tagLabel = se.trashSuccess ? 'TRASH TALK' : 'TRASH TALK';
        const absE = Math.abs(se.energyDelta);
        if (se.trashSuccess) {
          energies[sePlayer] = clamp((energies[sePlayer] || 100) + 5, 0, 100);
          energies[seTarget] = clamp((energies[seTarget] || 100) - absE, 0, 100);
        } else {
          energies[sePlayer] = clamp((energies[sePlayer] || 100) - absE, 0, 100);
          energies[seTarget] = clamp((energies[seTarget] || 100) + 5, 0, 100);
        }
      } else if (se.type === 'collision-alliance') {
        avatarColor = 'var(--am-green)';
        tagLabel = 'ALLIANCE BOOST';
        am.racers.forEach(r => { if (se.players.includes(r.name)) energies[r.name] = clamp((energies[r.name] || 100) + se.energyDelta, 0, 100); });
      } else if (se.type === 'collision-bump') {
        avatarColor = 'var(--am-neon)';
        tagLabel = 'BOARD BUMP';
        energies[sePlayer] = clamp((energies[sePlayer] || 100) + se.energyDelta, 0, 100);
        energies[seTarget] = clamp((energies[seTarget] || 100) - se.energyDelta, 0, 100);
      }

      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div class="am-card social">
          <div class="am-card-head">
            <div class="am-card-avatar" style="border-color:${avatarColor};"><img src="assets/avatars/${slug(avatarPlayer)}.png" onerror="this.style.display='none'" alt="${avatarPlayer}"></div>
            <span class="am-card-who">${avatarPlayer}</span>
            <span class="am-card-tag tag-social">${tagLabel}</span>
          </div>
          <div class="am-card-body">${se.text}</div>
          ${se.bondDelta !== 0 || se.energyDelta !== 0 ? `<div class="am-card-foot"><span>${sePlayer} &#x2192; ${seTarget}${se.bondDelta !== 0 ? `: Bond ${se.bondDelta > 0 ? '+' : ''}${se.bondDelta}` : ''}</span>${se.energyDelta !== 0 ? `<span class="am-energy-pill ${se.energyDelta > 0 ? 'gain' : 'drain'}">${se.energyDelta > 0 ? '+' : ''}${se.energyDelta} ENERGY</span>` : ''}</div>` : ''}
        </div>
      </div>`;
      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: am.winner });
      stepIdx++;
    });

    // Host curveball cards
    (rd.hostEvents || []).forEach(he => {
      let cardStyle = '';
      if (he.type === 'energy-tax') cardStyle = 'border-left-color:var(--am-red);';
      else if (he.type === 'second-wind') cardStyle = 'border-left-color:var(--am-green);';
      else if (he.type === 'board-shuffle') cardStyle = 'border-left-color:var(--am-neon);';
      else if (he.type === 'trap-reveal') cardStyle = 'border-left-color:var(--am-gold);';

      const hostSlug2 = seasonConfig?.hostSlug || 'chris';
      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div class="am-card" style="border-left:4px solid var(--am-gold);background:rgba(255,209,60,.03);${cardStyle}">
          <div class="am-card-head">
            <div class="am-card-avatar" style="border-color:var(--am-gold);"><img src="assets/avatars/${hostSlug2}.png" onerror="this.style.display='none'" alt="Host"></div>
            <span class="am-card-who" style="color:var(--am-gold);">HOST CURVEBALL</span>
            <span class="am-card-tag" style="background:rgba(255,209,60,.15);color:var(--am-gold);border-color:var(--am-gold);">${he.type.replace(/-/g,' ').toUpperCase()}</span>
          </div>
          <div class="am-card-body">${he.text}</div>
        </div>
      </div>`;

      if (he.type === 'energy-tax') {
        am.racers.forEach(r => { if (!ko.has(r.name)) energies[r.name] = clamp((energies[r.name] || 100) - 10, 0, 100); });
      } else if (he.type === 'second-wind' && he.target) {
        energies[he.target] = clamp((energies[he.target] || 100) + 20, 0, 100);
      } else if (he.type === 'trap-reveal' && he.square) {
        revTraps.add(he.square);
      }

      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: null });
      stepIdx++;
    });

    // Fatigue drain card
    if (ri >= 1) {
      const fatigueDmg = ri >= 4 ? 8 : 5;
      const aliveNames = am.racers.filter(r => !ko.has(r.name)).map(r => r.name);
      aliveNames.forEach(n => { energies[n] = clamp((energies[n] || 100) - fatigueDmg, 0, 100); });

      const fatigueKOs = aliveNames.filter(n => energies[n] <= 0);
      fatigueKOs.forEach(n => { ko.add(n); koRounds[n] = rd.roundNum; });

      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div class="am-card" style="border-left:3px solid rgba(255,60,138,.3);background:rgba(255,60,138,.03);">
          <div class="am-card-head">
            <span class="am-card-who" style="color:var(--am-pink);font-size:11px;">FATIGUE DRAIN</span>
            <span class="am-card-tag" style="background:rgba(255,60,138,.1);color:var(--am-pink);border-color:rgba(255,60,138,.3);">-${fatigueDmg} HP ALL</span>
          </div>
          <div class="am-card-body" style="font-size:11px;color:#888;">The board takes its toll. All racers lose ${fatigueDmg} HP from exhaustion.${fatigueKOs.length > 0 ? ` <span style="color:var(--am-red);font-weight:700;">${fatigueKOs.join(', ')} ${fatigueKOs.length === 1 ? 'collapses' : 'collapse'} from fatigue!</span>` : ''}</div>
        </div>
      </div>`;
      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: null });
      stepIdx++;
    }

    // Last standing check — show winner card
    const aliveAfterRound = am.racers.filter(r => !ko.has(r.name));
    if (aliveAfterRound.length === 1 && am.winCondition === 'last-standing' && ri === am.rounds.length - 1) {
      const lsWinner = aliveAfterRound[0].name;
      const lsPr = pronouns(lsWinner);
      cardsHtml += `<div id="am-step-${suffix}-${stepIdx}" class="am-hidden">
        <div class="am-round" style="margin-top:16px;">
          <div class="am-round-num">LAST STANDING!</div>
          <div class="am-round-sub">${pick(LAST_STANDING_TEXT)(lsWinner, lsPr)}</div>
        </div>
      </div>`;
      snapshots.push({ positions: {...positions}, energies: {...energies}, ko: new Set(ko), koRounds: {...koRounds}, revealedTraps: new Set(revTraps), lastDice: null, lastPlayer: null, activeSquare: null, winner: lsWinner });
      stepIdx++;
    }
  });

  const totalSteps = stepIdx;
  _ensureState(screenKey, totalSteps);

  // Store snapshots and round start steps for live updates
  window._amBoardSnapshots = snapshots;
  window._amRoundStartSteps = roundStartSteps;

  // Controls
  cardsHtml += `<div id="am-controls-${suffix}" class="am-controls" style="position:fixed;bottom:0;">
    <button class="am-btn" onclick="aftermayhemRevealNext('${screenKey}',${totalSteps})">&#x25C0; REVEAL NEXT</button>
    <span class="am-counter" id="am-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="am-btn" onclick="aftermayhemRevealAll('${screenKey}',${totalSteps})">REVEAL ALL &#x25B6;&#x25B6;</button>
  </div>`;

  return _shell(cardsHtml, ep, 'am-board');
}


// ══════════════════════════════════════════════════════════════
// VP SCREEN: FINISH
// ══════════════════════════════════════════════════════════════

export function rpBuildAftermayhemFinish(ep) {
  const am = ep?.aftermath?.aftermayhem;
  if (!am?.winner) return '';

  const screenKey = 'am-finish';
  const suffix = 'finish';

  window._amEpRecord = ep;

  const winner = am.winner;
  const pr = pronouns(winner);
  const a = arch(winner);
  const winPool = WINNER_TEXT[a] || WINNER_TEXT.default;
  const winText = pick(winPool)(winner, pr);
  const wRacer = am.racers.find(r => r.name === winner);
  const finalEnergy = wRacer?.finalEnergy ?? 0;
  const totalKO = am.racers.filter(r => !r.alive && r.name !== winner).length;
  const totalRounds = am.rounds.length;
  const wColor = TOKEN_COLORS[am.racers.findIndex(r => r.name === winner) % TOKEN_COLORS.length];

  const conditionText = am.winCondition === 'finish' ? `Sq ${BOARD_FINISH} reached` : am.winCondition === 'last-standing' ? 'Last player standing' : 'Failsafe winner';

  // Confetti spans
  const confettiColors = ['var(--am-gold)', 'var(--am-pink)', 'var(--am-cyan)', 'var(--am-violet)', 'var(--am-neon)', 'var(--am-orange)'];
  let confettiHtml = '';
  for (let i = 0; i < 12; i++) {
    const left = 5 + (i * 8.3) % 90;
    confettiHtml += `<span class="go" style="left:${left}%;top:0;background:${confettiColors[i % confettiColors.length]};animation-delay:${(i * 0.1).toFixed(2)}s;"></span>`;
  }

  // Step 0: Trophy case arrival
  // Step 1: Winner card
  // Step 2: Return announcement
  // Step 3: Final standings
  const totalSteps = 4;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';

  // Step 0: Arrival
  cardsHtml += `<div id="am-step-${suffix}-0" class="am-hidden">
    <div class="am-round" style="margin-top:16px;">
      <div class="am-round-num">TROPHY CASE</div>
      <div class="am-round-sub">The Aftermayhem has a winner!</div>
    </div>
  </div>`;

  // Step 1: Winner celebration
  cardsHtml += `<div id="am-step-${suffix}-1" class="am-hidden">
    <div class="am-winner">
      <div class="am-winner-confetti">${confettiHtml}</div>
      <div class="am-winner-avatar" style="border-color:${wColor};">
        <img src="assets/avatars/${slug(winner)}.png" onerror="this.style.display='none'" alt="${winner}">
      </div>
      <div class="am-winner-label">TROPHY CASE REACHED</div>
      <div class="am-winner-name">${winner.toUpperCase()}</div>
      <div class="am-winner-sub">${winText}</div>
      <div class="am-winner-beats">Round ${totalRounds} &#x2022; ${conditionText} &#x2022; ${finalEnergy} HP remaining &#x2022; ${totalKO} KO'd</div>
    </div>
  </div>`;

  // Step 2: Return announcement
  cardsHtml += `<div id="am-step-${suffix}-2" class="am-hidden">
    <div class="am-card winner-card">
      <div class="am-card-head">
        <div class="am-card-avatar" style="border-color:${wColor};"><img src="assets/avatars/${slug(winner)}.png" onerror="this.style.display='none'" alt="${winner}"></div>
        <span class="am-card-who" style="color:var(--am-gold);">${winner.toUpperCase()} RETURNS!</span>
        <span class="am-card-tag tag-win">&#9733; RETURN</span>
      </div>
      <div class="am-card-body">
        <strong style="color:var(--am-gold);">${winner}</strong> has earned a second chance! ${pr.Sub} will rejoin the competition${am.returnedTo !== 'merge' ? `, joining the <strong>${am.returnedTo}</strong> tribe` : ` in the merged tribe`}.
        <div style="margin-top:8px;font-style:italic;color:#999;">Bonds with active players have been adjusted. Old enemies are softened. Old allies are strengthened. A fresh start — but the game remembers.</div>
      </div>
    </div>
  </div>`;

  // Step 3: Final standings
  const sorted = [...am.racers].sort((a, b) => {
    if (a.name === winner) return -1;
    if (b.name === winner) return 1;
    if (a.alive && !b.alive) return -1;
    if (!a.alive && b.alive) return 1;
    return b.finalPosition - a.finalPosition || (b.koRound || 0) - (a.koRound || 0);
  });

  let standingsHtml = `<div style="font-family:'Bungee',sans-serif;font-size:12px;color:var(--am-gold);text-align:center;margin:16px 0 8px;letter-spacing:2px;">FINAL STANDINGS</div>`;
  sorted.forEach((r, i) => {
    const isW = r.name === winner;
    const rColor = TOKEN_COLORS[am.racers.findIndex(x => x.name === r.name) % TOKEN_COLORS.length];
    const eCls = _energyClass(r.finalEnergy);
    standingsHtml += `<div style="display:flex;align-items:center;gap:10px;padding:8px 16px;margin:4px 16px;background:${isW ? 'rgba(255,209,60,.06)' : 'rgba(255,255,255,.02)'};border:1px solid ${isW ? 'var(--am-gold)' : 'rgba(255,255,255,.05)'};border-radius:6px;">
      <span style="font-family:'Press Start 2P',monospace;font-size:10px;color:${isW ? 'var(--am-gold)' : '#666'};width:24px;text-align:center;">${isW ? '&#9733;' : '#' + (i + 1)}</span>
      <div style="width:28px;height:28px;border-radius:50%;overflow:hidden;border:2px solid ${rColor};flex-shrink:0;"><img src="assets/avatars/${slug(r.name)}.png" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" alt="${r.name}"></div>
      <div style="flex:1;">
        <div style="font-family:'Fredoka',sans-serif;font-size:12px;color:var(--am-cream);">${r.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:#777;">Sq ${r.finalPosition} &#x2022; ${r.alive ? `${r.finalEnergy} HP` : `KO'd R${r.koRound}`} &#x2022; ${r.scores || 0} pts</div>
      </div>
      <div style="width:60px;height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden;">
        <div class="am-energy-fill ${r.alive ? eCls : ''}" style="height:100%;width:${r.alive ? r.finalEnergy : 0}%;border-radius:3px;${!r.alive ? 'background:var(--am-red);' : ''}"></div>
      </div>
    </div>`;
  });

  cardsHtml += `<div id="am-step-${suffix}-3" class="am-hidden">${standingsHtml}</div>`;

  // Controls
  cardsHtml += `<div id="am-controls-${suffix}" class="am-controls" style="position:fixed;bottom:0;">
    <button class="am-btn" onclick="aftermayhemRevealNext('${screenKey}',${totalSteps})">&#x25C0; REVEAL NEXT</button>
    <span class="am-counter" id="am-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="am-btn" onclick="aftermayhemRevealAll('${screenKey}',${totalSteps})">REVEAL ALL &#x25B6;&#x25B6;</button>
  </div>`;

  return _shell(cardsHtml, ep, 'am-finish');
}

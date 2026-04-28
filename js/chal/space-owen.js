// js/chal/space-owen.js — 2008: A Space Owen (post-merge space station challenge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 0.3) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = slug(name);
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

function canScheme(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  // neutral archetypes
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// COMPONENTS + ITEMS
// ══════════════════════════════════════════════════════════════
const REQUIRED_COMPONENTS = ['wiring', 'fuel-cell', 'key-card', 'tools'];
const BONUS_ITEMS = ['duct-tape', 'manual'];

const COMPONENT_LABELS = {
  'wiring': '🔌 Wiring', 'fuel-cell': '🔋 Fuel Cell',
  'key-card': '🪪 Key Card', 'tools': '🔧 Tools',
  'duct-tape': '🩹 Duct Tape', 'manual': '📖 Manual',
  'fake-component': '❌ Fake Component',
};

// ══════════════════════════════════════════════════════════════
// SPRINT OBSTACLES
// ══════════════════════════════════════════════════════════════
const OBSTACLES = [
  { id: 'airlock', name: 'Airlock Door', icon: '🚪', stats: ['mental', 'strategic'] },
  { id: 'debris', name: 'Debris Field', icon: '🪨', stats: ['physical', 'endurance'] },
  { id: 'gravity', name: 'Gravity Shift Room', icon: '🌀', stats: ['boldness', 'physical'] },
  { id: 'laser', name: 'Laser Grid', icon: '🔴', stats: ['intuition', 'mental'] },
  { id: 'flood', name: 'Flooded Corridor', icon: '🌊', stats: ['endurance', 'physical'] },
  { id: 'blast-door', name: 'Blast Door Override', icon: '💥', stats: ['strategic', 'mental'] },
];
const EXIT_HATCH = { id: 'exit-hatch', name: 'Exit Hatch', icon: '🏁', stats: ['physical', 'boldness'] };

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── ZONE 1: ZERO-G ADAPTATION ──
export const ZERO_G_TEXT = {
  good: [
    (n, pr) => `${n} took to zero-G like a natural, somersaulting through the station with ${pr.posAdj} arms spread. "THIS IS AMAZING!"`,
    (n, pr) => `${n} pushed off the wall and glided perfectly down the corridor. ${pr.Sub} made it look easy.`,
    (n, pr) => `${n} adapted almost instantly, using handrails to slingshot ${pr.ref} through the station. Impressive form.`,
    (n, pr) => `${n} was BORN for zero gravity. ${pr.Sub} bounced off walls like a pinball, grinning the whole time.`,
    (n, pr) => `"This is just like swimming!" ${n} said, cutting through the air with surprising grace.`,
  ],
  bad: [
    (n, pr) => `${n} flailed helplessly, spinning in circles. "SOMEONE GRAB ME!" Nobody grabbed ${pr.obj}.`,
    (n, pr) => `${n} launched ${pr.ref} too hard off a wall and smashed face-first into the ceiling. "Ow."`,
    (n, pr) => `${n} couldn't figure out which way was up. To be fair, there ISN'T one, but still.`,
    (n, pr) => `${n} tried walking normally. In zero-G. ${pr.Sub} just... ran in place. Like a hamster.`,
    (n, pr) => `${n} grabbed a pipe for stability and it broke off. Now ${pr.sub} was spinning AND holding a pipe.`,
  ],
  comedy: [
    (n, pr) => `${n}'s hair went full Medusa in zero-G. ${pr.Sub} spent the first minute trying to see past it.`,
    (n, pr) => `${n} sneezed and rocketed backward into a supply rack. ${host()}: "Physics!"`,
    (n, pr) => `${n} opened a bag of chips. They exploded everywhere. Floating chips. Everywhere. For the rest of the challenge.`,
    (n, pr) => `${n} accidentally kicked ${pr.ref} into a slow, dignified spin. ${pr.Sub} drifted past the camera three times.`,
    (n, pr) => `"I think I'm gonna—" ${n} hiccupped and bounced off the floor. Then the ceiling. Then the floor again.`,
  ],
};

// ── ZONE 1: SEARCH ATTEMPTS ──
export const SEARCH_TEXT = {
  found: [
    (n, pr, comp) => `${n} pried open a panel and found ${COMPONENT_LABELS[comp]}! "Yes! That's one down."`,
    (n, pr, comp) => `${n} rifled through a floating toolbox and pulled out ${COMPONENT_LABELS[comp]}. "Come to ${pr.posAdj}."`,
    (n, pr, comp) => `${n} spotted ${COMPONENT_LABELS[comp]} wedged behind a console. Quick snag!`,
    (n, pr, comp) => `${n} floated up to a ceiling vent and reached in — ${COMPONENT_LABELS[comp]}! "Who hides stuff up HERE?"`,
    (n, pr, comp) => `${n} found ${COMPONENT_LABELS[comp]} stuck to a magnetized wall. "I'll take that, thanks."`,
  ],
  missed: [
    (n, pr) => `${n} opened a locker — empty except for a freeze-dried sandwich. Not helpful.`,
    (n, pr) => `${n} searched a console drawer. Nothing but sticky notes and a dead battery. "Seriously?"`,
    (n, pr) => `${n} pulled out a panel and found... wires leading nowhere. "This station is a DEATH TRAP."`,
    (n, pr) => `${n} checked under a desk. Found dust. Space dust. But still just dust.`,
    (n, pr) => `${n} opened an overhead bin. A rubber duck floated out. ${pr.Sub} stared at it. It stared back.`,
  ],
  bonus: [
    (n, pr, item) => `${n} discovered ${COMPONENT_LABELS[item]} tucked behind a fire extinguisher! "Backup plan activated."`,
    (n, pr, item) => `${n} found ${COMPONENT_LABELS[item]} floating in a corridor! "Jackpot!"`,
    (n, pr, item) => `${n} grabbed ${COMPONENT_LABELS[item]} from a supply crate — ${pr.sub} grinned. "Insurance policy."`,
    (n, pr, item) => `${n} snagged ${COMPONENT_LABELS[item]} from behind a loose tile. "You never know what you'll need."`,
  ],
};

// ── ZONE 1: SOCIAL EVENTS ──
export const ZONE1_SOCIAL = {
  collision: [
    (a, b) => `${a} and ${b} collided mid-corridor. They bounced off each other in slow motion. It was weirdly graceful.`,
    (a, b) => `${b} drifted around a corner right into ${a}. BONK. "Watch where you're floating!" "Watch where YOU'RE floating!"`,
    (a, b) => `${a} grabbed a handhold just as ${b} slammed into ${pronouns(a).obj}. They spun together like a bizarre zero-G waltz.`,
    (a, b) => `${a} and ${b} reached for the same handhold. Their hands touched. Awkward pause. They shoved off in opposite directions.`,
  ],
  help: [
    (a, b) => `${a} boosted ${b} up to a high shelf. "I owe you one." "Just find your stuff."`,
    (a, b) => `${a} caught ${b}'s drifting component and tossed it back. "Teamwork!" "...For now."`,
    (a, b) => `${b} was stuck spinning. ${a} grabbed ${pronouns(b).posAdj} ankle and steadied ${pronouns(b).obj}. "Thanks. Don't tell anyone."`,
    (a, b) => `${a} showed ${b} the slingshot technique. ${b} actually listened. Minor miracle.`,
  ],
  steal: [
    (a, b, comp) => `${a} swiped ${COMPONENT_LABELS[comp]} while ${b} wasn't looking. "Finders keepers, losers... float."`,
    (a, b, comp) => `${a} plucked ${COMPONENT_LABELS[comp]} right out of ${b}'s pocket. ${b} didn't even notice — yet.`,
    (a, b, comp) => `${a} "accidentally" bumped into ${b}, palming ${COMPONENT_LABELS[comp]} in the process. Smooth.`,
    (a, b, comp) => `${a} waited until ${b} sneezed, then snagged ${COMPONENT_LABELS[comp]} from ${pronouns(b).posAdj} belt. Low.`,
  ],
  taunt: [
    (a, b) => `${a} waved ${pronouns(a).posAdj} components at ${b}. "Looking for these? Oh wait, you don't HAVE any."`,
    (a, b) => `${a} floated past ${b} upside down, grinning. "Having trouble? That's SO sad." It was not sad. It was calculated.`,
    (a, b) => `${a}: "Hey ${b}, maybe try looking in SPACE. Oh wait — you're already in space and STILL can't find anything."`,
    (a, b) => `${a} watched ${b} struggle and laughed. Actually laughed. ${host()} winced from mission control.`,
  ],
  showmance: [
    (a, b) => `${a} and ${b} floated past each other. Their fingers brushed. In zero gravity. It was basically a movie.`,
    (a, b) => `${a} and ${b} found themselves drifting together. "We should probably be searching." "Probably." Neither moved.`,
    (a, b) => `${b} was spinning out of control. ${a} caught ${pronouns(b).obj}. They held on a little too long. The cameras caught EVERYTHING.`,
    (a, b) => `${a} found a component and immediately floated it over to ${b}. "I want YOU to have it." ${host()}: "Wow. In SPACE."`,
  ],
};

// ── ZONE 2: RED ALERT ──
export const RED_ALERT_TEXT = {
  alarm: [
    () => `🚨 BZZZZT! Red lights flooded the station. ${host()}: "RED ALERT! Your escape pods need to be OPERATIONAL in five rounds or you're STAYING UP HERE!"`,
    () => `🚨 The station shuddered. Alarms blared. ${host()}'s voice crackled over the intercom: "FIX YOUR PODS OR FLOAT FOREVER!"`,
    () => `🚨 WHAM! Something hit the station hull. ${host()}: "Was that a meteor? Doesn't matter! FIX YOUR PODS! NOW!"`,
    () => `🚨 Every light went red simultaneously. ${host()}: "Attention, space campers: the station is falling apart. Your pods are your only way home. MOVE."`,
  ],
  repair: {
    success: [
      (n, pr, comp) => `${n} slotted ${COMPONENT_LABELS[comp]} into place. Click! One more system online.`,
      (n, pr, comp) => `${n} connected ${COMPONENT_LABELS[comp]} and the pod hummed to life. "That's what I'm talking about!"`,
      (n, pr, comp) => `${n} wrestled with ${COMPONENT_LABELS[comp]} for a moment, then it locked in. ${pr.Sub} pumped ${pr.posAdj} fist.`,
      (n, pr, comp) => `${n} carefully installed ${COMPONENT_LABELS[comp]}. The console blinked green. "We're cooking now."`,
    ],
    struggle: [
      (n, pr) => `${n} tried brute-forcing a connection. It sparked. "Ow! But... did it work?" It half-worked.`,
      (n, pr) => `${n} banged on the console. The display flickered. "That's... progress? I'm calling it progress."`,
      (n, pr) => `${n} stared at the mess of wires. "Which one is the— BZZT!" Wrong one. Keep trying.`,
      (n, pr) => `${n} used ${pr.posAdj} sleeve as insulation and jammed two wires together. Sparks flew. A tiny light turned green.`,
    ],
    improvise: [
      (n, pr) => `${n} rerouted power through a secondary line. It wasn't pretty, but the gauge ticked up. "Engineering 101."`,
      (n, pr) => `${n} found a workaround using the station's backup systems. Clever, if desperate.`,
      (n, pr) => `${n} stripped a wire with ${pr.posAdj} teeth and spliced it. "Don't tell Mission Control."`,
      (n, pr) => `${n} held a connection in place with duct tape and prayer. The gauge moved. "SCIENCE!"`,
    ],
    ductTape: [
      (n, pr) => `${n} slapped duct tape over a leaking seal. Instant +10% integrity! "Duct tape fixes EVERYTHING."`,
      (n, pr) => `${n} used ${pr.posAdj} duct tape to patch three separate joints. The pod wheezed approvingly.`,
      (n, pr) => `${n} wrapped duct tape around a cracked fuel line. It held. Duct tape: humanity's greatest invention.`,
      (n, pr) => `${n} jammed duct tape into a gap between panels. Not elegant. But effective.`,
    ],
    manual: [
      (n, pr) => `${n} flipped through the manual. "Page 47... 'Emergency bypass protocol.' Oh, that's handy."`,
      (n, pr) => `${n} found the answer in the manual and skipped an entire repair step. "Read the manual, people!"`,
      (n, pr) => `${n} consulted the manual. "Step 1: Don't panic.' Thanks for nothing. Step 2 was actually useful though.`,
      (n, pr) => `${n} used the manual to skip straight to the workaround. "Books save lives."`,
    ],
  },
  roundEscalation: [
    () => `The station groaned. Lights flickered. Nobody panicked. Yet.`,
    () => `A distant BANG echoed through the hull. The station tilted slightly. "THAT'S NOT GOOD," someone yelled.`,
    () => `Sparks showered from a ceiling panel. The temperature was rising. Sweat floated in droplets.`,
    () => `The station shuddered violently. Loose equipment drifted past. This was getting serious.`,
    () => `FINAL ROUND. The hull screamed. Escape pods hissed. It was now or never.`,
  ],
};

// ── ZONE 2: SOCIAL EVENTS ──
export const ZONE2_SOCIAL = {
  giveComponent: [
    (a, b, comp) => `${a} tossed ${COMPONENT_LABELS[comp]} to ${b}. "Take it. I've got spares." That's a LIE, but a generous one.`,
    (a, b, comp) => `${a} floated ${COMPONENT_LABELS[comp]} over to ${b}. "You need this more than I do." ${b}: "I won't forget this."`,
    (a, b, comp) => `${a} shoved ${COMPONENT_LABELS[comp]} into ${b}'s hands. "Don't make it weird. Just fix your pod."`,
    (a, b, comp) => `${a} sacrificed ${COMPONENT_LABELS[comp]} for ${b}. "We get out together or not at all."`,
  ],
  refuseHelp: [
    (a, b) => `${b} begged ${a} for a spare part. ${a}: "Sorry. Survival of the fittest." ${b}'s face fell.`,
    (a, b) => `${a} watched ${b} struggle and turned away. "Not my problem." Cold. But strategic.`,
    (a, b) => `${b}: "PLEASE, I just need one component!" ${a}: "Should've searched harder." Brutal.`,
    (a, b) => `${a} clutched ${pronouns(a).posAdj} components protectively as ${b} approached. "Don't even THINK about it."`,
  ],
  panic: [
    (a, b) => `${a} and ${b} locked eyes. "We're gonna die in space." "...No we're not. Probably."`,
    (a, b) => `${a} started hyperventilating. ${b} grabbed ${pronouns(a).posAdj} shoulders. "Breathe. BREATHE." It barely helped.`,
    (a, b) => `"If I die up here, tell my mom—" ${a} started. ${b}: "You're NOT dying. Fix your pod."`,
    (a, b) => `${a} looked out the window at Earth, very far away. ${b} looked too. They worked faster after that.`,
  ],
  blame: [
    (a, b) => `"If I get stranded, it's YOUR fault!" ${a} pointed at ${b}. "You stole my components!" "I did NOT!"`,
    (a, b) => `${a} whipped around. "Where's my fuel cell?! ${b}, DID YOU—" ${b} held up empty hands. Suspicion lingered.`,
    (a, b) => `${a}: "Someone sabotaged my pod. And I KNOW it was you, ${b}." Was it? Maybe. But the accusation landed hard.`,
    (a, b) => `${a} glared at ${b} across the repair bay. "You'll pay for this." The space between them felt colder than the void outside.`,
  ],
  showmanceSacrifice: [
    (a, b) => `${a} ripped a component from ${pronouns(a).posAdj} own pod and jammed it into ${b}'s. "I'm not leaving without you."`,
    (a, b) => `${a}: "Take my fuel cell." ${b}: "But then YOUR pod—" ${a}: "I'll figure it out. Go."`,
    (a, b) => `${a} gutted ${pronouns(a).posAdj} own repair work to save ${b}'s pod. Love makes you do stupid things. Beautiful, stupid things.`,
    (a, b) => `${a} chose ${b} over self-preservation. ${host()}: "That is either the most romantic or the dumbest thing I've ever seen."`,
  ],
  villainHoard: [
    (n, pr) => `${n} had three spare components and was hoarding them like a dragon. ${pr.Sub} watched others beg. ${pr.Sub} enjoyed it.`,
    (n, pr) => `${n} stacked components in ${pr.posAdj} pod and guarded them. "Insurance. It's called STRATEGY."`,
    (n, pr) => `${n} found a spare part and hid it in ${pr.posAdj} boot. Nobody saw. That's the point.`,
    (n, pr) => `${n} had everything ${pr.sub} needed and more. ${pr.Sub} sat in ${pr.posAdj} pod, feet up, watching chaos unfold. "Comfy."`,
  ],
};

// ── ZONE 2: ELIMINATION ──
export const ELIMINATION_TEXT = [
  (n, pr) => `${n}'s pod sputtered and died. ${pr.Sub} pressed every button. Nothing. ${host()}: "Sorry, ${n}. You're... staying in space."`,
  (n, pr) => `${n} slammed ${pr.posAdj} fist on the console. RED. All red. "No no no NO—" The hatch sealed. Without ${pr.obj} inside.`,
  (n, pr) => `${n}'s pod let out a sad wheeze and went dark. ${pr.Sub} floated there, watching others launch. "...Cool."`,
  (n, pr) => `The countdown hit zero. ${n}'s pod: dead. ${n}: dead inside. ${host()}: "You had five rounds, buddy."`,
  (n, pr) => `${n} watched ${pr.posAdj} repair gauge freeze at 80%. So close. But space doesn't grade on a curve.`,
  (n, pr) => `${n}'s pod sparked, coughed, and gave up. Just like ${n}'s hopes. "This is FINE." It was not fine.`,
];

// ── ZONE 2: LAUNCH ──
export const LAUNCH_TEXT = [
  (n, pr) => `${n}'s pod roared to life! WHOOOOSH! ${pr.Sub} shot out of the station like a bottle rocket. "YEEEAAAH!"`,
  (n, pr) => `Green across the board. ${n} hit the launch button. The g-force pinned ${pr.obj} back. ${pr.Sub} was GRINNING.`,
  (n, pr) => `${n}'s pod hummed, then SCREAMED to life. "Launch in 3... 2... 1..." BOOM. Gone. Through the bay doors and into the void.`,
  (n, pr) => `${n} barely made it — the gauge hit 100% at the last second. The pod launched with a shudder. "CLOSE ENOUGH!"`,
  (n, pr) => `${n}'s pod ignited. The vibration shook ${pr.posAdj} teeth. Then silence. Then Earth, getting closer. Fast.`,
];

// ── ZONE 3: RE-ENTRY STAGES ──
export const REENTRY_TEXT = {
  stages: [
    { name: 'Upper Atmosphere', icon: '☁️' },
    { name: 'Heating Up', icon: '🌡️' },
    { name: 'Plasma Zone', icon: '🔥' },
    { name: 'Max-Q', icon: '💀' },
    { name: 'Final Descent', icon: '🪂' },
  ],
  holding: [
    (n, pr, stage) => `${n} gritted ${pr.posAdj} teeth through ${stage}. Shaking, but holding.`,
    (n, pr, stage) => `${n}: "Is it supposed to shake this much?!" Yes. Yes it is. ${pr.Sub} held on.`,
    (n, pr, stage) => `${n} braced against ${pr.posAdj} harness. The pod screamed. ${pr.Sub} didn't. Barely.`,
    (n, pr, stage) => `${n} closed ${pr.posAdj} eyes and focused. The rumbling faded to background noise. Mind over matter.`,
    (n, pr, stage) => `${n} hummed a song to stay calm. It worked. Sort of. The humming was very off-key.`,
  ],
  struggling: [
    (n, pr, stage) => `${n}'s knuckles went white on the armrest. ${pr.Sub} was NOT okay. But ${pr.sub} was still here.`,
    (n, pr, stage) => `${n} let out a string of words the censors had to bleep. ${pr.Sub} was barely holding together.`,
    (n, pr, stage) => `${n}'s face was green. Then white. Then green again. ${pr.Sub} was cycling through the rainbow.`,
    (n, pr, stage) => `${n} screamed. Not a horror movie scream — a genuine "my organs are rearranging" scream. Still in the game. Barely.`,
    (n, pr, stage) => `"I can't— I can't—" ${n} gasped. But then ${pr.sub} did. Somehow. Barely.`,
  ],
  vomiting: [
    (n, pr) => `${n} couldn't hold it. In zero-G-ish conditions, the result was... catastrophic. "EJECT! EJECT!" ${host()} hit the emergency chute button.`,
    (n, pr) => `${n}'s stomach said NO. Loudly. Visually. The automatic systems popped ${pr.posAdj} parachute early. Challenge over.`,
    (n, pr) => `${n} managed "I'm fi—" before the projectile vomiting started. ${host()}: "...And THAT'S why we have barf bags."`,
    (n, pr) => `${n} erupted like Vesuvius. In a tiny metal tube. The cameras fogged up. Automatic ejection activated.`,
    (n, pr) => `${n}: "This is NOTHING, I'm totally—" *hurk*. Parachute deployed. Challenge done. Dignity: also done.`,
  ],
  intercomTrashTalk: [
    (a, b) => `${a} on the intercom: "How you holding up, ${b}?" ${b}: "SHUT. UP." ${a} laughed through the shaking.`,
    (a, b) => `${a}: "Hey ${b}, you look a little GREEN on the camera." ${b}: "I WILL END YOU WHEN WE LAND."`,
    (a, b) => `${a} broadcast ${pronouns(a).posAdj} screaming over the open channel. ${b}: "Was that a human or a cat?"`,
    (a, b) => `${a}: "Bet you wish you'd stayed on the station, ${b}." ${b}: "BET YOU WISH I'D STAYED ON THE STATION."`,
  ],
  showmanceEncourage: [
    (a, b) => `${a} keyed the intercom: "You've got this, ${b}. I believe in you." ${b}'s heart rate actually dropped. Science.`,
    (a, b) => `${a}: "We land together, okay? Together." ${b}, through tears: "Together." ${host()}: "I'm not crying, YOU'RE crying."`,
    (a, b) => `${a} could hear ${b} struggling on the radio. "Look at Earth. We're almost HOME. Stay with me."`,
    (a, b) => `${a}: "When we land, I'm taking you for the BIGGEST pizza." ${b}, barely conscious: "...pepperoni?"`,
  ],
  moleSuspicion: [
    (n, suspect) => `${n} glanced at the readouts. How was ${suspect} SO calm? "Either ${pronouns(suspect).sub}'s built different or something's rigged."`,
    (n, suspect) => `${n}: "Anyone else notice ${suspect}'s pod barely shook? That's not NORMAL."`,
    (n, suspect) => `${n} stared at ${suspect}'s vitals on the monitor. Heart rate: normal. In RE-ENTRY?! "...Suspicious."`,
    (n, suspect) => `"How is ${suspect} not even sweating?!" ${n} shouted. Everyone was too busy screaming to investigate.`,
  ],
};

// ── SPRINT OBSTACLES ──
export const SPRINT_TEXT = {
  pass: {
    'airlock': [
      (n, pr) => `${n} cracked the airlock code in seconds. The door hissed open. "Child's play."`,
      (n, pr) => `${n} punched in the override sequence. CLUNK. The airlock swung open. "Next!"`,
      (n, pr) => `${n} studied the panel, spotted the pattern, and the airlock surrendered. "Brains beat locks."`,
      (n, pr) => `${n} rerouted the airlock's power grid. The door groaned open. "That's how it's done."`,
    ],
    'debris': [
      (n, pr) => `${n} smashed through the debris field, shoving wreckage aside with raw force. "MOVE!"`,
      (n, pr) => `${n} squeezed through gaps in the debris, finding paths nobody else could see.`,
      (n, pr) => `${n} powered through, taking a few scrapes but never slowing down. Unstoppable.`,
      (n, pr) => `${n} climbed over twisted metal like it was a jungle gym. "Is this supposed to be HARD?"`,
    ],
    'gravity': [
      (n, pr) => `${n} rolled with the gravity shift, using momentum to cross the room. "Wheee!" — wait, that was intentional?`,
      (n, pr) => `${n} jumped just as gravity flipped. ${pr.Sub} soared across the room and stuck the landing. "Nailed it."`,
      (n, pr) => `${n} adapted to the shifting gravity instantly. While others stumbled, ${pr.sub} sprinted across the ceiling.`,
      (n, pr) => `${n} belly-slid across the floor right as gravity reversed, launching ${pr.ref} perfectly. "CALCULATED!"`,
    ],
    'laser': [
      (n, pr) => `${n} read the laser pattern in two seconds and slipped through like a cat. "You call this security?"`,
      (n, pr) => `${n} timed the gaps perfectly, weaving through the grid without a single beam touch.`,
      (n, pr) => `${n} spotted a maintenance gap in the laser array. ${pr.Sub} walked right through it. "Always check the edges."`,
      (n, pr) => `${n} rolled, ducked, and contorted through the lasers. It looked like breakdancing. It worked.`,
    ],
    'flood': [
      (n, pr) => `${n} dove into the flooded corridor and powered through. Water resistance? What water resistance?`,
      (n, pr) => `${n} swam the corridor like an Olympic qualifier. "Did anyone TIME that? Because it was FAST."`,
      (n, pr) => `${n} held ${pr.posAdj} breath and pushed through. The cold was brutal but ${pr.sub} made it look warm.`,
      (n, pr) => `${n} found a pocket of air near the ceiling and used it to rest before pushing through. Smart.`,
    ],
    'blast-door': [
      (n, pr) => `${n} rewired the blast door's control panel in under a minute. "Red to blue, blue to green, green to—" CLICK.`,
      (n, pr) => `${n} found the emergency override behind a panel. The blast door groaned open. "Always read the schematics."`,
      (n, pr) => `${n} traced the power line to its source and hit the master switch. The blast door lifted.`,
      (n, pr) => `${n} jury-rigged the blast door with nothing but a hairpin and spite. It opened. Barely, but it opened.`,
    ],
    'exit-hatch': [
      (n, pr) => `${n} SLAMMED the exit hatch open and burst into daylight. "FREEDOM! SWEET, SWEET GROUND!"`,
      (n, pr) => `${n} cranked the exit hatch with everything ${pr.sub} had. It popped! Sunlight flooded in. "I'M OUT!"`,
      (n, pr) => `${n} shoulder-charged the exit hatch. It flew open. ${pr.Sub} tumbled onto solid ground, gasping. "NEVER. AGAIN."`,
      (n, pr) => `${n} threw the hatch open and crawled out into daylight. ${pr.Sub} kissed the ground. Actually kissed it. "I love you, dirt."`,
    ],
  },
  fail: {
    'airlock': [
      (n, pr) => `${n} punched in a code. WRONG. Another code. WRONG. "WHY ARE THERE SO MANY NUMBERS?!"`,
      (n, pr) => `${n} tried the override. Denied. Tried again. Denied. "Let me IN!" The door did not care.`,
      (n, pr) => `${n} stared at the keypad like it was written in alien. Which, to be fair, it might be.`,
      (n, pr) => `${n} guessed 0000. Then 1234. Then kicked the door. None of these were correct.`,
    ],
    'debris': [
      (n, pr) => `${n} tried to push through debris but a beam shifted, blocking ${pr.posAdj} path. "Oh come ON!"`,
      (n, pr) => `${n} got wedged between two panels. "I'm not stuck! I'm... resting. Strategically."`,
      (n, pr) => `${n} misjudged a gap and got ${pr.posAdj} suit caught on jagged metal. "SOMEONE HELP— never mind, I've got it. I DON'T got it."`,
      (n, pr) => `${n} shoved a panel. It didn't move. ${pr.Sub} shoved harder. It moved — onto ${pr.posAdj} foot. "AAGH!"`,
    ],
    'gravity': [
      (n, pr) => `Gravity shifted and ${n} went FLYING into a wall. "OOF!" Then the ceiling. "OOF AGAIN!"`,
      (n, pr) => `${n} was mid-step when gravity reversed. ${pr.Sub} face-planted on the ceiling. "This is STUPID."`,
      (n, pr) => `${n} stumbled as the room flipped, sliding helplessly across the floor. "PHYSICS IS A SCAM!"`,
      (n, pr) => `${n} tried to jump across but gravity shifted mid-air. ${pr.Sub} landed on ${pr.posAdj} back. "Ow."`,
    ],
    'laser': [
      (n, pr) => `ZAP! ${n} clipped a laser beam. Alarms blared. The grid reset. "Oh, THAT one was on."`,
      (n, pr) => `${n} tried to roll under a laser and triggered four more. "I saw this in a movie! The movie LIED."`,
      (n, pr) => `${n} timed the jump wrong and got lit up like a Christmas tree. "I'm fine! I'm fine! ...I'm tingling."`,
      (n, pr) => `${n} froze in the grid, lasers on all sides. "Don't. Move." ${pr.Sub} moved. ZAP.`,
    ],
    'flood': [
      (n, pr) => `${n} dipped a toe in the flooded corridor. "That is FREEZING." ${pr.Sub} turned around. Then turned back. Then froze.`,
      (n, pr) => `${n} tried to swim through but the current was too strong. ${pr.Sub} got pushed back to start. "Oh, COME ON."`,
      (n, pr) => `${n} dove in, swallowed water, and came up sputtering. "Why does space have WATER LEVELS?!"`,
      (n, pr) => `${n} made it halfway and panicked. The current dragged ${pr.obj} back. "I HATE this station!"`,
    ],
    'blast-door': [
      (n, pr) => `${n} pulled a wire. The door locked HARDER. "That was supposed to open it!" It was not.`,
      (n, pr) => `${n} tried the override panel. ERROR. ERROR. ERROR. "STOP SAYING ERROR!"`,
      (n, pr) => `${n} rewired the panel and the lights went out. All of them. "...Oops."`,
      (n, pr) => `${n} punched the blast door in frustration. The door was made of reinforced steel. ${n}'s fist was not.`,
    ],
    'exit-hatch': [
      (n, pr) => `${n} pulled the hatch. Sealed. Pushed. Sealed. "OPEN! OPEN YOU STUPID—" Still sealed.`,
      (n, pr) => `${n} grabbed the hatch handle and pulled. ${pr.posAdj} feet slid on the wet floor. No leverage.`,
      (n, pr) => `${n} could SEE daylight through the hatch window. So close. But the lock mechanism defeated ${pr.obj}. For now.`,
      (n, pr) => `${n} tried shoulder-charging the hatch. The hatch didn't budge. ${n}'s shoulder filed a complaint.`,
    ],
  },
  rivalShove: [
    (a, b) => `${a} hip-checked ${b} into a wall while passing. "OOPS! Tight corridors!" It was a wide corridor.`,
    (a, b) => `${a} "tripped" and shoved ${b} sideways. "My bad!" It was very much on purpose.`,
    (a, b) => `${a} blocked ${b}'s path for a critical second. By the time ${b} got past, ${a} was ahead.`,
    (a, b) => `${a} grabbed ${b}'s collar and yanked ${pronouns(b).obj} backward. "After you. Oh wait — after ME."`,
  ],
  encouragement: [
    (a, b) => `${a}: "Come on, ${b}! You're almost there!" ${b} found a second wind. Sometimes that's all it takes.`,
    (a, b) => `${a} waited at the next obstacle for ${b}. "We finish this TOGETHER." They moved as a unit.`,
    (a, b) => `"${b}, PUSH!" ${a} shouted. ${b} pushed. It worked. The power of yelling.`,
    (a, b) => `${a} clapped as ${b} cleared an obstacle. "THAT'S what I'm talking about!" ${b} grinned through exhaustion.`,
  ],
  underdogRally: [
    (n, pr) => `${n} was dead last. Everyone knew it. Then something clicked. ${pr.Sub} TORE through the next obstacle like it insulted ${pr.posAdj} family.`,
    (n, pr) => `${n} had given up. Then ${pr.sub} looked at the leaderboard and saw ${pr.posAdj} name at the bottom. Oh no. Oh no no no. ${pr.Sub} MOVED.`,
    (n, pr) => `${n}, the eternal underdog, found ${pr.posAdj} moment. A burst of speed. A perfect dodge. A FIRE in ${pr.posAdj} eyes.`,
    (n, pr) => `"I am NOT going out like this!" ${n} screamed. And then ${pr.sub} didn't. Pure spite propelled ${pr.obj} forward.`,
  ],
  frustrationMeltdown: [
    (n, pr) => `${n} slammed ${pr.posAdj} fists against a wall. "This is RIGGED! IT'S RIGGED!" It was not rigged. ${pr.Sub} was just bad at it.`,
    (n, pr) => `${n} sat down in the middle of the corridor and screamed. Then got up and tried again. Character development? No, just rage.`,
    (n, pr) => `${n} kicked a console. It beeped. ${pr.Sub} kicked it again. It stopped beeping. Problem... solved?`,
    (n, pr) => `${n}'s eye twitched. ${pr.Sub} took a deep breath. Then ${pr.sub} started running and didn't stop screaming until ${pr.sub} hit the next obstacle.`,
  ],
};

// ── HOST COMMENTARY ──
export const HOST_TEXT = {
  zone1Intro: [
    () => `${host()} grinned from the mission control screen. "Welcome to the INTERNATIONAL SPACE STATION, campers! Well, our budget version. Same idea. More duct tape."`,
    () => `${host()}: "You're in SPACE! Well, a studio lot dressed like space. The zero-G is real though. Mostly. Don't ask how."`,
    () => `${host()}: "Today's challenge: survive a collapsing space station, build an escape pod, and re-enter Earth's atmosphere. Easy Sunday."`,
    () => `${host()}: "Astronauts train for YEARS. You have about twenty minutes. Good luck up there!"`,
  ],
  zone2Intro: [
    () => `${host()}: "RED ALERT! The station's coming apart! You have FIVE ROUNDS to fix your pods. Anyone who can't launch... well, space is forever."`,
    () => `${host()}: "Tick tock, space cadets! Those pods won't fix themselves. Unless you found the manual. DID you find the manual?"`,
    () => `${host()}: "The station's breaking up faster than your alliances! FIX THOSE PODS!"`,
    () => `${host()}: "Five rounds. Four components. One chance. Do the math — oh wait, you can't, because the STATION IS FALLING APART."`,
  ],
  zone3Intro: [
    () => `${host()}: "Pods are away! Now comes the fun part — re-entry! If the heat doesn't get you, the G-forces will. If THOSE don't get you... well, you're tougher than you look."`,
    () => `${host()}: "Re-entry temperature: 3000 degrees. Pod integrity: questionable. Your chances: even MORE questionable. ENJOY!"`,
    () => `${host()}: "You're about to punch through the atmosphere at terminal velocity. Try not to puke! ...Actually, the ratings would LOVE it if you puke."`,
    () => `${host()}: "Buckle up, buttercups! Re-entry is five stages of escalating misery. Last one conscious wins!"`,
  ],
  sprintIntro: [
    () => `${host()}: "You made it to Earth Station! But the exit isn't going to find itself. Five obstacles between you and FREEDOM. First one out wins immunity!"`,
    () => `${host()}: "Welcome back to gravity! Now RUN! The exit hatch is through five obstacles and whoever gets there first wins it ALL!"`,
    () => `${host()}: "You survived space. You survived re-entry. Now survive... a HALLWAY. A very complicated, very dangerous hallway."`,
    () => `${host()}: "Final stretch! Five obstacles, five chances to fail. But the exit hatch is RIGHT THERE. Who wants immunity?"`,
  ],
};

// ── MOLE SABOTAGE TEXT ──
export const MOLE_TEXT = {
  stealComponent: [
    (spy, target, comp) => `${spy} bumped into ${target} and palmed ${COMPONENT_LABELS[comp]}. Mole work at its finest.`,
    (spy, target, comp) => `${spy} "helped" ${target} organize components — and one fewer came back. ${COMPONENT_LABELS[comp]}: gone.`,
    (spy, target, comp) => `${spy} distracted ${target} with small talk while a component disappeared. Sleight of hand. Sleight of mole.`,
    (spy, target, comp) => `During a corridor collision, ${spy} relieved ${target} of ${COMPONENT_LABELS[comp]}. "Oh no, did you drop something?"`,
  ],
  plantFake: [
    (spy, target) => `${spy} slipped a fake component into ${target}'s collection. It looked real. It was NOT real. It would fail at the worst possible moment.`,
    (spy, target) => `${spy} swapped ${target}'s wiring for rewired junk. Identical on the outside. Catastrophic on the inside.`,
    (spy, target) => `${spy} handed ${target} a "spare part." "Found this floating around!" It was sabotage disguised as kindness.`,
    (spy, target) => `${spy} planted a dud component near ${target}'s search area. ${target} found it. "Lucky break!" Not lucky. Not a break.`,
  ],
  bumpCancel: [
    (spy, target) => `${spy} crashed into ${target} mid-search, scattering supplies everywhere. "Sorry! Zero-G, am I right?" The search was wasted.`,
    (spy, target) => `${spy} grabbed the same handhold as ${target} and "accidentally" yanked ${pronouns(target).obj} away. A whole search attempt — gone.`,
    (spy, target) => `${spy} triggered a compartment door right as ${target} was reaching in. SLAM. "Whoa! That thing has a hair trigger!"`,
    (spy, target) => `${spy} kicked off a wall and "tumbled" into ${target}'s work area. Everything scattered. "My bad! So sorry!"`,
  ],
  swapComponent: [
    (spy, target) => `${spy} swapped ${target}'s real component for a fake during the chaos. ${target} wouldn't know until round 5. Too late.`,
    (spy, target) => `${spy} reached into ${target}'s pod while "checking on a friend." One real component out, one fake in.`,
    (spy, target) => `${spy} used the alarms as cover to sabotage ${target}'s pod. Quick swap. Undetectable. For now.`,
    (spy, target) => `${spy}: "Hey, ${target}, your panel's loose." While ${target} checked, ${spy} made the swap. Textbook mole.`,
  ],
  loosenBolts: [
    (spy, target) => `${spy} loosened a critical bolt on ${target}'s pod during a "check-up." The pod would leak. Slowly. Fatally.`,
    (spy, target) => `${spy} twisted a fuel line on ${target}'s pod just enough. Not enough to see. Enough to fail.`,
    (spy, target) => `${spy} "bumped" ${target}'s pod hard enough to shift a seal. 10% integrity — gone. Oops.`,
    (spy, target) => `${spy} pretended to help ${target}'s repair and "accidentally" cross-wired two systems. -10%. "Hmm, that's weird."`,
  ],
  secondaryExplosion: [
    (spy) => `${spy} "noticed" a sparking panel and "tried to fix it." BOOM! Small explosion. Everyone's progress took a hit.`,
    (spy) => `A mysterious power surge hit the station. ${spy} looked as surprised as everyone else. ${spy} was NOT surprised.`,
    (spy) => `${spy} triggered a secondary alarm by "tripping" over a cable. Lockdown! Everyone lost precious seconds.`,
    (spy) => `${spy} opened the wrong panel — on PURPOSE — and caused a minor decompression event. "IT WASN'T ME!" It was ${pronouns(spy).obj}.`,
  ],
  reentryFreePass: [
    (spy, pr) => `${spy}'s pod seemed oddly stable through the turbulence. Rigged shock absorbers. Mole perks.`,
    (spy, pr) => `While everyone screamed, ${spy}'s pod barely shuddered. ${pr.Sub} still faked a scream for appearances.`,
    (spy, pr) => `${spy} breezed through the worst of re-entry. A hidden gyroscope in ${pr.posAdj} pod kept things smooth. Suspiciously smooth.`,
    (spy, pr) => `${spy}'s vitals were unusually calm. Almost as if ${pr.posAdj} pod had been... upgraded. Hmm.`,
  ],
};


// ══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════

export function simulateSpaceOwen(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // ── DETECT MOLE ──
  let mole = null;
  if (gs.mole && active.includes(gs.mole)) {
    mole = gs.mole;
  }

  // ── INIT PLAYER STATES ──
  const pStates = {};
  active.forEach(name => {
    pStates[name] = {
      name,
      state: 'floating',
      zeroGScore: 0,
      components: [],
      searchAttempts: 0,
      podRepairProgress: 0,
      reEntryEndurance: 0,
      vomited: false,
      sprintObstacle: 0,
      sprintRetries: 0,
      eliminatedAt: null,
      socialEvents: [],
      moleActions: [],
      suspicionGained: 0,
    };
  });

  const result = {
    zone1: { adaptation: [], searches: [], socialEvents: [], moleActions: [] },
    zone2: { alarm: '', rounds: [], eliminations: [], launches: [], socialEvents: [], moleActions: [] },
    zone3: { stages: [], eliminations: [], socialEvents: [], moleActions: [] },
    sprint: { obstacles: [], rounds: [], socialEvents: [], winner: null },
    immunityWinner: null,
    playerStates: pStates,
    eliminationOrder: [],
    mole,
    hostLines: {},
  };

  // ── HOST INTRO ──
  result.hostLines.zone1 = pick(HOST_TEXT.zone1Intro)();

  // ══════════════════════════════════════════════════════════════
  // ZONE 1: ZERO-G ADAPTATION + CLUE HUNT
  // ══════════════════════════════════════════════════════════════

  // Adaptation scores
  active.forEach(name => {
    const s = pStats(name);
    const raw = s.physical * 0.3 + s.endurance * 0.3 + s.boldness * 0.2 + s.mental * 0.2 + noise(2);
    const score = Math.max(0, Math.min(10, raw));
    pStates[name].zeroGScore = score;
    pStates[name].state = 'searching';

    // Determine search attempts
    if (score >= 8) pStates[name].searchAttempts = 5;
    else if (score >= 5) pStates[name].searchAttempts = 4;
    else if (score >= 3) pStates[name].searchAttempts = 3;
    else pStates[name].searchAttempts = 2;

    // Score points
    const adaptPoints = score >= 8 ? 3 : score >= 5 ? 2 : 1;
    ep.chalMemberScores[name] += adaptPoints;

    // Narration
    const pr = pronouns(name);
    let textPool;
    if (score >= 7) textPool = ZERO_G_TEXT.good;
    else if (score >= 4) textPool = Math.random() < 0.5 ? ZERO_G_TEXT.comedy : ZERO_G_TEXT.bad;
    else textPool = ZERO_G_TEXT.bad;

    result.zone1.adaptation.push({
      name, score, attempts: pStates[name].searchAttempts,
      adaptPoints, text: pick(textPool)(name, pr),
    });

    // Popularity for comedy/great moments
    if (score >= 9) popDelta(name, 1);
  });

  // ── SEARCH PHASE ──
  const componentPool = [...REQUIRED_COMPONENTS];
  active.forEach(name => {
    const s = pStats(name);
    const pr = pronouns(name);
    const ps = pStates[name];
    const searches = [];

    for (let i = 0; i < ps.searchAttempts; i++) {
      // Check if mole cancels this attempt
      if (mole && mole !== name && Math.random() < 0.15) {
        const bumpText = pick(MOLE_TEXT.bumpCancel)(mole, name);
        result.zone1.moleActions.push({ type: 'bump', spy: mole, target: name, text: bumpText });
        pStates[mole].moleActions.push({ zone: 1, type: 'bump', target: name });
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.2;
        searches.push({ type: 'bumped', text: bumpText });
        continue;
      }

      const findChance = (s.mental * 0.5 + s.intuition * 0.5 + noise(2)) / 10;
      const needed = REQUIRED_COMPONENTS.filter(c => !ps.components.includes(c));

      if (needed.length > 0 && Math.random() < Math.min(0.85, findChance + 0.3)) {
        const comp = pick(needed);
        ps.components.push(comp);
        ep.chalMemberScores[name] += 2;
        searches.push({ type: 'found', component: comp, text: pick(SEARCH_TEXT.found)(name, pr, comp) });
      } else if (ps.components.length >= 3 && Math.random() < 0.25) {
        // Bonus item chance once they have most components
        const bonus = pick(BONUS_ITEMS);
        if (!ps.components.includes(bonus)) {
          ps.components.push(bonus);
          ep.chalMemberScores[name] += 1;
          searches.push({ type: 'bonus', item: bonus, text: pick(SEARCH_TEXT.bonus)(name, pr, bonus) });
        } else {
          searches.push({ type: 'missed', text: pick(SEARCH_TEXT.missed)(name, pr) });
        }
      } else if (needed.length === 0 && Math.random() < 0.4) {
        // Already have all required, try for bonus
        const bonus = pick(BONUS_ITEMS);
        if (!ps.components.includes(bonus)) {
          ps.components.push(bonus);
          ep.chalMemberScores[name] += 1;
          searches.push({ type: 'bonus', item: bonus, text: pick(SEARCH_TEXT.bonus)(name, pr, bonus) });
        } else {
          searches.push({ type: 'missed', text: pick(SEARCH_TEXT.missed)(name, pr) });
        }
      } else {
        searches.push({ type: 'missed', text: pick(SEARCH_TEXT.missed)(name, pr) });
      }
    }

    result.zone1.searches.push({ name, searches, finalComponents: [...ps.components] });
  });

  // ── MOLE: steal / plant fake ──
  if (mole) {
    const targets = active.filter(n => n !== mole && pStates[n].components.length > 0);
    // Steal a component from one target
    if (targets.length > 0 && Math.random() < 0.5) {
      const target = pick(targets);
      const stealable = pStates[target].components.filter(c => REQUIRED_COMPONENTS.includes(c));
      if (stealable.length > 0) {
        const stolen = pick(stealable);
        pStates[target].components = pStates[target].components.filter(c => c !== stolen);
        if (!pStates[mole].components.includes(stolen)) pStates[mole].components.push(stolen);
        const text = pick(MOLE_TEXT.stealComponent)(mole, target, stolen);
        result.zone1.moleActions.push({ type: 'steal', spy: mole, target, component: stolen, text });
        pStates[mole].moleActions.push({ zone: 1, type: 'steal', target });
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
      }
    }
    // Plant fake component on a target
    const fakeTargets = active.filter(n => n !== mole && pStates[n].components.length < 4);
    if (fakeTargets.length > 0 && Math.random() < 0.4) {
      const target = pick(fakeTargets);
      pStates[target].components.push('fake-component');
      const text = pick(MOLE_TEXT.plantFake)(mole, target);
      result.zone1.moleActions.push({ type: 'fake', spy: mole, target, text });
      pStates[mole].moleActions.push({ zone: 1, type: 'fake', target });
      if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.4;
    }
  }

  // ── ZONE 1 SOCIAL EVENTS ──
  _generateZone1Social(active, pStates, result, ep, campKey);

  // ══════════════════════════════════════════════════════════════
  // ZONE 2: RED ALERT CRISIS
  // ══════════════════════════════════════════════════════════════

  result.hostLines.zone2 = pick(HOST_TEXT.zone2Intro)();
  result.zone2.alarm = pick(RED_ALERT_TEXT.alarm)();

  const REPAIR_ROUNDS = 5;
  const survivors = [...active]; // will be whittled down

  for (let round = 0; round < REPAIR_ROUNDS; round++) {
    const roundData = { round: round + 1, repairs: [], escalation: RED_ALERT_TEXT.roundEscalation[round] ? RED_ALERT_TEXT.roundEscalation[round]() : '' };

    active.forEach(name => {
      const ps = pStates[name];
      if (ps.eliminatedAt) return; // already out

      const s = pStats(name);
      const pr = pronouns(name);
      const realComponents = ps.components.filter(c => REQUIRED_COMPONENTS.includes(c));
      const hasFake = ps.components.includes('fake-component');
      const hasDuctTape = ps.components.includes('duct-tape');
      const hasManual = ps.components.includes('manual');

      // Each real component = +20%
      let baseProgress = realComponents.length * 20;
      // Fake component: -20% at reveal (round 3+)
      if (hasFake && round >= 2 && ps.podRepairProgress < 100) {
        baseProgress -= 20;
        ps.components = ps.components.filter(c => c !== 'fake-component');
      }
      // Manual: skip one missing component (+20%)
      if (hasManual && realComponents.length < 4) {
        baseProgress += 20;
      }
      // Duct tape: +10%
      if (hasDuctTape) {
        baseProgress += 10;
      }

      // Improvisation from stats fills remaining gap over 5 rounds
      const gap = 100 - baseProgress;
      if (gap > 0) {
        const improveRate = (s.mental * 0.4 + s.strategic * 0.3 + s.physical * 0.15 + noise(1)) / 10;
        const roundGain = (gap / REPAIR_ROUNDS) * (1 + improveRate);
        ps.podRepairProgress = Math.min(100, baseProgress + roundGain * (round + 1));
      } else {
        ps.podRepairProgress = Math.min(100, baseProgress);
      }

      // Generate narration
      let repairText;
      if (round === 0 && realComponents.length > 0) {
        const installComp = realComponents[Math.min(round, realComponents.length - 1)];
        repairText = pick(RED_ALERT_TEXT.repair.success)(name, pr, installComp);
      } else if (hasDuctTape && round === 1) {
        repairText = pick(RED_ALERT_TEXT.repair.ductTape)(name, pr);
      } else if (hasManual && round === 2) {
        repairText = pick(RED_ALERT_TEXT.repair.manual)(name, pr);
      } else if (ps.podRepairProgress < 60) {
        repairText = pick(RED_ALERT_TEXT.repair.struggle)(name, pr);
      } else {
        repairText = pick(RED_ALERT_TEXT.repair.improvise)(name, pr);
      }

      roundData.repairs.push({
        name, progress: Math.round(ps.podRepairProgress),
        text: repairText,
      });
    });

    // ── MOLE ZONE 2 SABOTAGE ──
    if (mole && !pStates[mole].eliminatedAt) {
      const moleTargets = active.filter(n => n !== mole && !pStates[n].eliminatedAt);
      if (round < 3 && Math.random() < 0.4 && moleTargets.length > 0) {
        const moleAction = Math.random();
        if (moleAction < 0.35) {
          // Swap real for fake
          const target = pick(moleTargets);
          pStates[target].podRepairProgress = Math.max(0, pStates[target].podRepairProgress - 20);
          const text = pick(MOLE_TEXT.swapComponent)(mole, target);
          result.zone2.moleActions.push({ type: 'swap', spy: mole, target, round: round + 1, text });
          pStates[mole].moleActions.push({ zone: 2, type: 'swap', target });
          if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
        } else if (moleAction < 0.65) {
          // Loosen bolts
          const target = pick(moleTargets);
          pStates[target].podRepairProgress = Math.max(0, pStates[target].podRepairProgress - 10);
          const text = pick(MOLE_TEXT.loosenBolts)(mole, target);
          result.zone2.moleActions.push({ type: 'loosen', spy: mole, target, round: round + 1, text });
          pStates[mole].moleActions.push({ zone: 2, type: 'loosen', target });
          if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.2;
        } else {
          // Secondary explosion
          moleTargets.forEach(t => {
            pStates[t].podRepairProgress = Math.max(0, pStates[t].podRepairProgress - 5);
          });
          const text = pick(MOLE_TEXT.secondaryExplosion)(mole);
          result.zone2.moleActions.push({ type: 'explosion', spy: mole, round: round + 1, text });
          pStates[mole].moleActions.push({ zone: 2, type: 'explosion' });
          if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.5;
        }
      }
    }

    // ── ZONE 2 SOCIAL (1 event per round) ──
    if (round < REPAIR_ROUNDS - 1) {
      _generateZone2Social(active, pStates, result, ep, campKey, round);
    }

    result.zone2.rounds.push(roundData);
  }

  // ── ZONE 2: ELIMINATION ──
  const zone2Eliminated = [];
  active.forEach(name => {
    const ps = pStates[name];
    if (ps.podRepairProgress < 100) {
      ps.eliminatedAt = 'zone2';
      ps.state = 'eliminated';
      const pr = pronouns(name);
      const text = pick(ELIMINATION_TEXT)(name, pr);
      zone2Eliminated.push({ name, progress: Math.round(ps.podRepairProgress), text });
      result.eliminationOrder.push(name);
      popDelta(name, -1);
    }
  });
  result.zone2.eliminations = zone2Eliminated;

  // Ensure we don't eliminate too many (~2-3 target)
  // If more than 3 eliminated, save the closest ones
  if (zone2Eliminated.length > 3) {
    zone2Eliminated.sort((a, b) => b.progress - a.progress);
    const saved = zone2Eliminated.splice(0, zone2Eliminated.length - 3);
    saved.forEach(({ name }) => {
      pStates[name].eliminatedAt = null;
      pStates[name].state = 'launched';
      pStates[name].podRepairProgress = 100;
      result.eliminationOrder = result.eliminationOrder.filter(n => n !== name);
    });
    result.zone2.eliminations = zone2Eliminated;
  }
  // If fewer than 2 eliminated, force the weakest
  const stillAlive = active.filter(n => !pStates[n].eliminatedAt);
  if (zone2Eliminated.length < 2 && stillAlive.length > 5) {
    const sortedByProgress = stillAlive
      .map(n => ({ name: n, progress: pStates[n].podRepairProgress }))
      .sort((a, b) => a.progress - b.progress);
    const toElim = sortedByProgress.slice(0, 2 - zone2Eliminated.length);
    toElim.forEach(({ name }) => {
      pStates[name].eliminatedAt = 'zone2';
      pStates[name].state = 'eliminated';
      pStates[name].podRepairProgress = Math.min(95, pStates[name].podRepairProgress); // clamp below 100
      const pr = pronouns(name);
      const text = pick(ELIMINATION_TEXT)(name, pr);
      result.zone2.eliminations.push({ name, progress: Math.round(pStates[name].podRepairProgress), text });
      result.eliminationOrder.push(name);
      popDelta(name, -1);
    });
  }

  // ── ZONE 2: LAUNCH ──
  const launchers = active.filter(n => !pStates[n].eliminatedAt);
  launchers.forEach(name => {
    pStates[name].state = 'launched';
    const pr = pronouns(name);
    ep.chalMemberScores[name] += 3;
    // Bonus for rounds to spare (progress was high early)
    const roundsToSpare = Math.floor((pStates[name].podRepairProgress - 80) / 5);
    if (roundsToSpare > 0) ep.chalMemberScores[name] += Math.min(roundsToSpare, 3);
    result.zone2.launches.push({ name, text: pick(LAUNCH_TEXT)(name, pr) });
  });

  // Blame events from eliminated to those who refused help
  zone2Eliminated.forEach(({ name }) => {
    const blameTarget = active.find(n => n !== name && !pStates[n].eliminatedAt && getBond(name, n) < 0);
    if (blameTarget) {
      const text = pick(ZONE2_SOCIAL.blame)(name, blameTarget);
      result.zone2.socialEvents.push({ type: 'blame', a: name, b: blameTarget, text });
      addBond(name, blameTarget, -2);
      ep.campEvents[campKey].post.push({
        text: `${name} blamed ${blameTarget} for being stranded in space.`,
        players: [name, blameTarget],
        badgeText: 'STRANDED BLAME', badgeClass: 'red',
      });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // ZONE 3: RE-ENTRY SHAKEDOWN
  // ══════════════════════════════════════════════════════════════

  result.hostLines.zone3 = pick(HOST_TEXT.zone3Intro)();
  const reentryPlayers = active.filter(n => !pStates[n].eliminatedAt);

  const REENTRY_STAGES = [
    { name: 'Upper Atmosphere', stats: ['endurance'], threshold: 3, weight: [1] },
    { name: 'Heating Up', stats: ['endurance', 'mental'], threshold: 4, weight: [0.6, 0.4] },
    { name: 'Plasma Zone', stats: ['endurance', 'mental'], threshold: 5, weight: [0.5, 0.5] },
    { name: 'Max-Q', stats: ['endurance', 'boldness'], threshold: 6, weight: [0.6, 0.4] },
    { name: 'Final Descent', stats: ['endurance', 'physical'], threshold: 6.5, weight: [0.5, 0.5] },
  ];

  let moleUsedFreePass = false;

  REENTRY_STAGES.forEach((stage, idx) => {
    const stageData = {
      name: stage.name,
      icon: REENTRY_TEXT.stages[idx].icon,
      results: [],
      socialEvents: [],
    };

    reentryPlayers.forEach(name => {
      const ps = pStates[name];
      if (ps.vomited) return; // already out

      const s = pStats(name);
      const pr = pronouns(name);

      // Weighted stat check
      let score = 0;
      stage.stats.forEach((stat, i) => {
        score += s[stat] * stage.weight[i];
      });
      score += noise(1.5);

      // Mole free pass
      if (mole === name && !moleUsedFreePass && score < stage.threshold) {
        moleUsedFreePass = true;
        score = stage.threshold + 0.5; // barely pass
        const mpr = pronouns(mole);
        const text = pick(MOLE_TEXT.reentryFreePass)(mole, mpr);
        result.zone3.moleActions.push({ type: 'freePass', spy: mole, stage: idx, text });
        pStates[mole].moleActions.push({ zone: 3, type: 'freePass', stage: stage.name });
      }

      const passed = score >= stage.threshold;

      if (!passed) {
        // Vomit = eliminated
        ps.vomited = true;
        ps.eliminatedAt = 'reentry';
        ps.state = 'eliminated';
        const text = pick(REENTRY_TEXT.vomiting)(name, pr);
        stageData.results.push({ name, status: 'vomited', text });
        result.zone3.eliminations.push({ name, stage: stage.name, stageIdx: idx, text });
        result.eliminationOrder.push(name);
        popDelta(name, -1);
      } else {
        ps.reEntryEndurance = idx + 1;
        ep.chalMemberScores[name] += 2;
        const textPool = score >= stage.threshold + 2 ? REENTRY_TEXT.holding : REENTRY_TEXT.struggling;
        const text = pick(textPool)(name, pr, stage.name);
        stageData.results.push({ name, status: score >= stage.threshold + 2 ? 'holding' : 'struggling', text });
      }
    });

    // Re-entry social events (1 per stage)
    const aliveInReentry = reentryPlayers.filter(n => !pStates[n].vomited);
    if (aliveInReentry.length >= 2) {
      const a = pick(aliveInReentry);
      const bPool = aliveInReentry.filter(n => n !== a);
      const b = pick(bPool);

      // Check for showmance encouragement
      const isShowmance = gs.showmances?.some(sm =>
        (sm.a === a && sm.b === b) || (sm.a === b && sm.b === a)
      );
      if (isShowmance && Math.random() < 0.6) {
        const text = pick(REENTRY_TEXT.showmanceEncourage)(a, b);
        stageData.socialEvents.push({ type: 'showmance', a, b, text });
        addBond(a, b, 1);
      } else if (getBond(a, b) < -2) {
        const text = pick(REENTRY_TEXT.intercomTrashTalk)(a, b);
        stageData.socialEvents.push({ type: 'trashTalk', a, b, text });
      } else {
        const text = pick(REENTRY_TEXT.intercomTrashTalk)(a, b);
        stageData.socialEvents.push({ type: 'banter', a, b, text });
      }

      // Mole suspicion event
      if (mole && moleUsedFreePass && Math.random() < 0.4) {
        const suspicious = aliveInReentry.filter(n => n !== mole);
        if (suspicious.length > 0) {
          const observer = pick(suspicious);
          const text = pick(REENTRY_TEXT.moleSuspicion)(observer, mole);
          stageData.socialEvents.push({ type: 'moleSuspicion', observer, suspect: mole, text });
          if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
        }
      }
    }

    result.zone3.stages.push(stageData);
  });

  // Cap re-entry eliminations at 2
  const reentryElims = result.zone3.eliminations;
  if (reentryElims.length > 2) {
    // Restore the extras (keep only the first 2 vomiters)
    const toRestore = reentryElims.splice(2);
    toRestore.forEach(({ name }) => {
      pStates[name].vomited = false;
      pStates[name].eliminatedAt = null;
      pStates[name].state = 'launched';
      pStates[name].reEntryEndurance = 5;
      ep.chalMemberScores[name] += 2; // give back the last stage points
      result.eliminationOrder = result.eliminationOrder.filter(n => n !== name);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ZONE 3a: EARTH STATION SPRINT
  // ══════════════════════════════════════════════════════════════

  result.hostLines.sprint = pick(HOST_TEXT.sprintIntro)();

  const sprinters = active.filter(n => !pStates[n].eliminatedAt);
  sprinters.forEach(n => { pStates[n].state = 'sprinting'; });

  // Pick 4 random obstacles + exit hatch
  const shuffledObs = [...OBSTACLES].sort(() => Math.random() - 0.5);
  const sprintObstacles = [...shuffledObs.slice(0, 4), EXIT_HATCH];
  result.sprint.obstacles = sprintObstacles.map(o => ({ id: o.id, name: o.name, icon: o.icon }));

  let winner = null;
  const MAX_SPRINT_ROUNDS = 12; // safety cap

  for (let round = 0; round < MAX_SPRINT_ROUNDS && !winner; round++) {
    const roundData = { round: round + 1, attempts: [], socialEvents: [] };

    sprinters.forEach(name => {
      const ps = pStates[name];
      if (ps.state === 'finished') return;

      const obstacle = sprintObstacles[ps.sprintObstacle];
      const s = pStats(name);
      const pr = pronouns(name);

      // Stat check for this obstacle
      let score = 0;
      obstacle.stats.forEach(stat => {
        score += s[stat] * 0.5;
      });
      score += noise(1.5);
      const threshold = 3.5 + ps.sprintObstacle * 0.3; // slightly harder each obstacle

      const passed = score >= threshold;

      if (passed) {
        const text = pick(SPRINT_TEXT.pass[obstacle.id])(name, pr);
        roundData.attempts.push({ name, obstacle: obstacle.id, passed: true, text });
        ps.sprintObstacle++;
        ep.chalMemberScores[name] += 2;

        // Check for win
        if (ps.sprintObstacle >= sprintObstacles.length) {
          ps.state = 'finished';
          if (!winner) {
            winner = name;
            ep.chalMemberScores[name] += 5; // exit hatch bonus
            popDelta(name, 3);
          }
        }
      } else {
        ps.sprintRetries++;
        const text = pick(SPRINT_TEXT.fail[obstacle.id])(name, pr);
        roundData.attempts.push({ name, obstacle: obstacle.id, passed: false, text });
      }
    });

    // ── SPRINT SOCIAL EVENTS (1 per round) ──
    if (sprinters.length >= 2 && Math.random() < 0.7) {
      const event = _generateSprintSocial(sprinters, pStates, result, ep, campKey);
      if (event) roundData.socialEvents.push(event);
    }

    result.sprint.rounds.push(roundData);
  }

  // If no one cleared exit hatch in time, pick whoever is furthest
  if (!winner) {
    const sorted = sprinters
      .map(n => ({ name: n, obstacle: pStates[n].sprintObstacle, retries: pStates[n].sprintRetries }))
      .sort((a, b) => b.obstacle - a.obstacle || a.retries - b.retries);
    winner = sorted[0].name;
    ep.chalMemberScores[winner] += 5;
    popDelta(winner, 3);
  }

  result.sprint.winner = winner;
  result.immunityWinner = winner;

  // ── CAMP EVENT: Winner ──
  ep.campEvents[campKey].post.push({
    text: `${winner} won the 2008: A Space Owen challenge and earned immunity!`,
    players: [winner],
    badgeText: 'SPACE SURVIVOR', badgeClass: 'green',
  });

  // ══════════════════════════════════════════════════════════════
  // ROMANCE HOOKS
  // ══════════════════════════════════════════════════════════════
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'zero-gravity space station');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'space-owen', _romActive);

  // ══════════════════════════════════════════════════════════════
  // FINALIZE
  // ══════════════════════════════════════════════════════════════
  ep.spaceOwen = result;
  ep.isSpaceOwen = true;
  ep.challengeType = 'space-owen';
  ep.challengeLabel = '2008: A Space Owen';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;

  // chalPlacements: winner first, then sprinters by progress, then re-entry elims, then zone2 elims
  const placements = [winner];
  const otherSprinters = sprinters
    .filter(n => n !== winner)
    .sort((a, b) => (pStates[b].sprintObstacle - pStates[a].sprintObstacle) || (pStates[a].sprintRetries - pStates[b].sprintRetries));
  placements.push(...otherSprinters);
  placements.push(...[...result.eliminationOrder].reverse());
  ep.chalPlacements = placements;

  // Immunity winner MUST be #1 in chalMemberScores
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([, s]) => s));
  ep.chalMemberScores[result.immunityWinner] = Math.max(ep.chalMemberScores[result.immunityWinner] || 0, maxOther) + active.length + 5;

  ep.tribalPlayers = active;
  updateChalRecord(ep);

  return ep;
}


// ══════════════════════════════════════════════════════════════
// SOCIAL EVENT GENERATORS
// ══════════════════════════════════════════════════════════════

function _generateZone1Social(active, pStates, result, ep, campKey) {
  const events = [];

  // 2-4 social events in zone 1
  const eventCount = 2 + Math.floor(Math.random() * 3);
  const used = new Set();

  for (let i = 0; i < eventCount; i++) {
    const available = active.filter(n => !used.has(n));
    if (available.length < 2) break;

    const a = pick(available);
    used.add(a);
    const bPool = active.filter(n => n !== a);
    const b = pick(bPool);

    const bond = getBond(a, b);
    const aArch = arch(a);
    const bArch = arch(b);

    // Determine event type based on relationship
    const isShowmance = gs.showmances?.some(sm =>
      (sm.a === a && sm.b === b) || (sm.a === b && sm.b === a)
    );

    let event;
    if (isShowmance && Math.random() < 0.5) {
      const text = pick(ZONE1_SOCIAL.showmance)(a, b);
      event = { type: 'showmance', a, b, text };
      addBond(a, b, 1);
    } else if (canScheme(a) && bond < -1 && Math.random() < 0.4) {
      // Steal component
      const stealable = pStates[b].components.filter(c => REQUIRED_COMPONENTS.includes(c));
      if (stealable.length > 0) {
        const comp = pick(stealable);
        pStates[b].components = pStates[b].components.filter(c => c !== comp);
        if (!pStates[a].components.includes(comp)) pStates[a].components.push(comp);
        const text = pick(ZONE1_SOCIAL.steal)(a, b, comp);
        event = { type: 'steal', a, b, component: comp, text };
        addBond(a, b, -2);
        popDelta(a, -1);
        ep.campEvents[campKey].post.push({
          text: `${a} stole a component from ${b} during the space challenge.`,
          players: [a, b],
          badgeText: 'SPACE THEFT', badgeClass: 'red',
        });
      }
    } else if (canScheme(a) && Math.random() < 0.3) {
      const text = pick(ZONE1_SOCIAL.taunt)(a, b);
      event = { type: 'taunt', a, b, text };
      addBond(a, b, -1);
    } else if (bond > 2 && Math.random() < 0.5) {
      const text = pick(ZONE1_SOCIAL.help)(a, b);
      event = { type: 'help', a, b, text };
      addBond(a, b, 1);
      popDelta(a, 1);
    } else {
      const text = pick(ZONE1_SOCIAL.collision)(a, b);
      event = { type: 'collision', a, b, text };
    }

    if (event) events.push(event);
  }

  result.zone1.socialEvents = events;
}

function _generateZone2Social(active, pStates, result, ep, campKey, round) {
  const alive = active.filter(n => !pStates[n].eliminatedAt);
  if (alive.length < 2) return;

  const a = pick(alive);
  const bPool = alive.filter(n => n !== a);
  const b = pick(bPool);
  const bond = getBond(a, b);
  const aArch = arch(a);

  const isShowmance = gs.showmances?.some(sm =>
    (sm.a === a && sm.b === b) || (sm.a === b && sm.b === a)
  );

  let event;

  if (isShowmance && Math.random() < 0.4) {
    // Showmance sacrifice: give component
    const aSpares = pStates[a].components.filter(c => REQUIRED_COMPONENTS.includes(c));
    if (aSpares.length > pStates[b].components.filter(c => REQUIRED_COMPONENTS.includes(c)).length && aSpares.length > 0) {
      const comp = aSpares[aSpares.length - 1];
      pStates[a].components = pStates[a].components.filter(c => c !== comp);
      pStates[b].components.push(comp);
      const text = pick(ZONE2_SOCIAL.showmanceSacrifice)(a, b);
      event = { type: 'showmanceSacrifice', a, b, component: comp, text };
      addBond(a, b, 2);
      popDelta(a, 2);
      ep.campEvents[campKey].post.push({
        text: `${a} sacrificed a pod component to save ${b}'s escape pod.`,
        players: [a, b],
        badgeText: 'SPACE SACRIFICE', badgeClass: 'green',
      });
    } else {
      const text = pick(ZONE2_SOCIAL.panic)(a, b);
      event = { type: 'panic', a, b, text };
    }
  } else if (bond > 3 && Math.random() < 0.4) {
    // Give spare component
    const aSpares = pStates[a].components.filter(c => REQUIRED_COMPONENTS.includes(c));
    const bNeeds = REQUIRED_COMPONENTS.filter(c => !pStates[b].components.includes(c));
    const giveComp = aSpares.find(c => bNeeds.includes(c));
    if (giveComp) {
      pStates[a].components = pStates[a].components.filter(c => c !== giveComp);
      pStates[b].components.push(giveComp);
      const text = pick(ZONE2_SOCIAL.giveComponent)(a, b, giveComp);
      event = { type: 'give', a, b, component: giveComp, text };
      addBond(a, b, 2);
      popDelta(a, 1);
    } else {
      const text = pick(ZONE2_SOCIAL.panic)(a, b);
      event = { type: 'panic', a, b, text };
    }
  } else if (bond < -2) {
    const text = pick(ZONE2_SOCIAL.refuseHelp)(a, b);
    event = { type: 'refuse', a, b, text };
    addBond(a, b, -1);
  } else if (['villain', 'mastermind', 'schemer'].includes(aArch)) {
    const pr = pronouns(a);
    const text = pick(ZONE2_SOCIAL.villainHoard)(a, pr);
    event = { type: 'hoard', a, text };
    popDelta(a, -1);
  } else {
    const text = pick(ZONE2_SOCIAL.panic)(a, b);
    event = { type: 'panic', a, b, text };
    addBond(a, b, 1);
  }

  if (event) result.zone2.socialEvents.push(event);
}

function _generateSprintSocial(sprinters, pStates, result, ep, campKey) {
  const active = sprinters.filter(n => pStates[n].state === 'sprinting');
  if (active.length < 2) return null;

  const a = pick(active);
  const bPool = active.filter(n => n !== a);
  const b = pick(bPool);
  const bond = getBond(a, b);

  const isShowmance = gs.showmances?.some(sm =>
    (sm.a === a && sm.b === b) || (sm.a === b && sm.b === a)
  );

  // Rival shove (villain/schemer with low bond)
  if (canScheme(a) && bond < 0 && Math.random() < 0.3) {
    // Shove delays b by 1 round (set back obstacle progress slightly)
    pStates[b].sprintRetries++;
    const text = pick(SPRINT_TEXT.rivalShove)(a, b);
    addBond(a, b, -1);
    popDelta(a, -1);
    ep.campEvents[campKey].post.push({
      text: `${a} shoved ${b} during the space station sprint.`,
      players: [a, b],
      badgeText: 'DIRTY PLAY', badgeClass: 'red',
    });
    return { type: 'shove', a, b, text };
  }

  // Showmance encouragement
  if (isShowmance) {
    const text = pick(SPRINT_TEXT.encouragement)(a, b);
    addBond(a, b, 1);
    return { type: 'encouragement', a, b, text };
  }

  // Underdog rally
  const underdogArch = arch(a);
  if (underdogArch === 'underdog' && pStates[a].sprintObstacle <= 1 && Math.random() < 0.5) {
    const pr = pronouns(a);
    const text = pick(SPRINT_TEXT.underdogRally)(a, pr);
    pStates[a].sprintObstacle = Math.min(pStates[a].sprintObstacle + 1, 4);
    ep.chalMemberScores[a] += 2;
    popDelta(a, 1);
    return { type: 'rally', a, text };
  }

  // Frustration meltdown (low progress)
  if (pStates[a].sprintRetries >= 3 && Math.random() < 0.4) {
    const pr = pronouns(a);
    const text = pick(SPRINT_TEXT.frustrationMeltdown)(a, pr);
    return { type: 'meltdown', a, text };
  }

  // Default: encouragement between friends
  if (bond > 1) {
    const text = pick(SPRINT_TEXT.encouragement)(a, b);
    addBond(a, b, 1);
    return { type: 'encouragement', a, b, text };
  }

  return null;
}


// ══════════════════════════════════════════════════════════════
// VP (VISUAL PLAYBACK) SYSTEM
// ══════════════════════════════════════════════════════════════

// ── REVEAL STATE ──
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

export function spaceOwenRevealNext(screenKey, total) {
  const st = _ensureState(screenKey, total);
  if (st.idx < st.total - 1) { st.idx++; }
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
}
export function spaceOwenRevealAll(screenKey, total) {
  const st = _ensureState(screenKey, total);
  st.idx = st.total - 1;
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
}
window.soRevealNext = spaceOwenRevealNext;
window.soRevealAll = spaceOwenRevealAll;

function _rebuildCurrentScreen(screenKey) {
  const el = document.querySelector(`[data-screen-key="${screenKey}"]`);
  if (!el) return;
  const scrollTop = el.scrollTop;
  const builder = window._soScreenBuilders?.[screenKey];
  if (builder) {
    const ep = window._soEp;
    if (ep) {
      const tmp = document.createElement('div');
      tmp.innerHTML = builder(ep);
      const inner = tmp.querySelector(`[data-screen-key="${screenKey}"]`);
      if (inner) {
        el.innerHTML = inner.innerHTML;
      }
    }
  }
  el.scrollTop = scrollTop;
}

function _rebuildSidebar() {
  const sidebarEl = document.getElementById('so-sidebar');
  if (!sidebarEl) return;
  const shell = sidebarEl.closest('.so-shell');
  const phase = shell?.dataset?.phase || '';
  const data = window._soData;
  if (!data) return;
  sidebarEl.innerHTML = _buildSidebarContent(data, phase);
}

// ── CSS ──
function _css() {
  return `<style>
/* ═══ SPACE OWEN VP ═══ */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap');

.so-shell{position:relative;display:flex;gap:0;min-height:520px;font-family:'Exo 2','Segoe UI',sans-serif;color:#e0e8f0;background:#0a0e1a;border-radius:12px;overflow:hidden}
.so-shell *{box-sizing:border-box}
.so-main{flex:1;padding:18px 20px 18px 20px;overflow-y:auto;position:relative;z-index:1}
.so-sidebar{width:240px;min-width:240px;background:rgba(0,229,255,0.04);border-left:2px solid rgba(0,229,255,0.15);padding:12px 10px;overflow-y:auto;font-size:0.82rem;position:relative;z-index:1}

/* Nebula starfield background */
.so-shell::before{content:'';position:absolute;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 600px 400px at 20% 30%, rgba(107,47,160,0.35), transparent),
    radial-gradient(ellipse 500px 350px at 80% 70%, rgba(26,79,122,0.4), transparent),
    radial-gradient(ellipse 300px 300px at 60% 20%, rgba(196,75,170,0.2), transparent),
    radial-gradient(circle 2px at 15% 25%, #fff, transparent),
    radial-gradient(circle 1px at 35% 55%, rgba(0,200,224,0.8), transparent),
    radial-gradient(circle 1.5px at 55% 15%, #fff, transparent),
    radial-gradient(circle 1px at 75% 45%, rgba(0,200,224,0.6), transparent),
    radial-gradient(circle 2px at 90% 80%, #fff, transparent),
    radial-gradient(circle 1px at 10% 85%, rgba(0,200,224,0.7), transparent),
    radial-gradient(circle 1.5px at 45% 90%, #fff, transparent),
    radial-gradient(circle 1px at 65% 65%, rgba(0,229,255,0.5), transparent),
    radial-gradient(circle 1px at 25% 70%, #fff, transparent),
    #0a0e1a;
  animation:so-nebulaDrift 40s ease-in-out infinite alternate}
@keyframes so-nebulaDrift{0%{background-position:0 0}100%{background-position:30px -20px}}

/* CRT scan lines */
.so-shell::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,0.02) 2px,rgba(0,229,255,0.02) 4px);
  animation:so-scanScroll 8s linear infinite}
@keyframes so-scanScroll{0%{background-position:0 0}100%{background-position:0 100px}}

/* Zone-specific backgrounds */
.so-shell.so-zerog::before{background:
  radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0,229,255,0.15), transparent),
  radial-gradient(ellipse 400px 300px at 70% 60%, rgba(107,47,160,0.2), transparent),
  radial-gradient(circle 2px at 15% 25%, #fff, transparent),
  radial-gradient(circle 1px at 55% 15%, #fff, transparent),
  radial-gradient(circle 1.5px at 85% 40%, rgba(0,200,224,0.8), transparent),
  radial-gradient(circle 1px at 40% 80%, #fff, transparent),
  #0a0e1a}

.so-shell.so-redalert{border-color:#ff1744}
.so-shell.so-redalert::before{background:
  radial-gradient(ellipse 600px 400px at 50% 50%, rgba(255,23,68,0.2), transparent),
  radial-gradient(ellipse 300px 200px at 20% 80%, rgba(255,23,68,0.15), transparent),
  radial-gradient(circle 2px at 15% 25%, rgba(255,100,100,0.8), transparent),
  radial-gradient(circle 1px at 55% 15%, rgba(255,80,80,0.6), transparent),
  #0a0e1a;
  animation:so-redPulse 2s ease-in-out infinite}
@keyframes so-redPulse{0%,100%{opacity:1}50%{opacity:0.7}}

.so-shell.so-reentry::before{background:
  linear-gradient(135deg, rgba(255,145,0,0.15) 0%, transparent 40%),
  linear-gradient(225deg, rgba(255,255,255,0.05) 0%, transparent 30%),
  radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255,145,0,0.2), transparent),
  #0a0e1a;
  animation:so-heatGlow 3s ease-in-out infinite}
@keyframes so-heatGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}

.so-shell.so-station::before{background:
  linear-gradient(90deg, rgba(0,230,118,0.05) 0%, transparent 30%),
  linear-gradient(270deg, rgba(0,229,255,0.05) 0%, transparent 30%),
  repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(138,155,174,0.08) 80px, rgba(138,155,174,0.08) 82px),
  #0a0e1a}

.so-shell.so-winner::before{background:
  radial-gradient(ellipse 500px 400px at 50% 40%, rgba(255,215,0,0.2), transparent),
  radial-gradient(ellipse 300px 200px at 30% 70%, rgba(0,229,255,0.15), transparent),
  #0a0e1a}

/* Headers */
.so-h1{font-family:'Share Tech Mono','Courier New',monospace;font-size:1.5rem;text-align:center;letter-spacing:3px;text-transform:uppercase;
  color:#00e5ff;text-shadow:0 0 20px rgba(0,229,255,0.6),0 0 40px rgba(0,229,255,0.3);margin:0 0 12px 0;
  animation:so-glitch 4s ease-in-out infinite}
@keyframes so-glitch{0%,92%,100%{transform:translateX(0);clip-path:none}93%{transform:translateX(-3px);clip-path:inset(20% 0 60% 0)}95%{transform:translateX(2px);clip-path:inset(50% 0 20% 0)}97%{transform:translateX(0);clip-path:none}}

.so-h2{font-family:'Share Tech Mono','Courier New',monospace;font-size:1.1rem;letter-spacing:2px;color:#ff9100;margin:14px 0 8px 0;text-transform:uppercase;
  text-shadow:0 0 10px rgba(255,145,0,0.4)}
.so-h3{font-family:'Share Tech Mono','Courier New',monospace;font-size:0.95rem;color:#00e5ff;margin:10px 0 6px 0;letter-spacing:1px}

/* Astronaut helmet player card */
.so-helmet{display:inline-flex;align-items:center;gap:8px;background:rgba(0,229,255,0.06);border:3px solid #6b7a8a;border-radius:24px;padding:3px 14px 3px 3px;margin:3px;position:relative;overflow:hidden;transition:border-color 0.3s}
.so-helmet.so-active{border-color:#00e5ff}
.so-helmet.so-launched{border-color:#00e676}
.so-helmet.so-struggling{border-color:#ff9100}
.so-helmet.so-danger{border-color:#ff1744}
.so-helmet.so-eliminated{border-color:#3a3f4d;opacity:0.6}
.so-helmet.so-vomit{border-color:#7CC142}
.so-helmet-visor{width:38px;height:38px;border-radius:50%;overflow:hidden;position:relative;flex-shrink:0;border:2px solid #6b7a8a}
.so-helmet-visor img{width:100%;height:100%;object-fit:contain;display:block}
.so-helmet-visor::after{content:'';position:absolute;inset:0;border-radius:50%;
  background:linear-gradient(135deg, rgba(0,200,224,0.25) 0%, transparent 50%),
  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,224,0.06) 2px, rgba(0,200,224,0.06) 4px);
  pointer-events:none}
.so-helmet-visor::before{content:'';position:absolute;top:2px;left:4px;width:12px;height:6px;background:linear-gradient(135deg,rgba(255,255,255,0.4),transparent);border-radius:50%;pointer-events:none;transform:rotate(-20deg)}
.so-helmet.so-eliminated .so-helmet-visor::after{background:linear-gradient(135deg, rgba(60,60,60,0.5) 0%, transparent 50%),linear-gradient(45deg, transparent 45%, rgba(80,80,80,0.5) 46%, rgba(80,80,80,0.5) 54%, transparent 55%)}
.so-helmet.so-vomit .so-helmet-visor::after{background:radial-gradient(ellipse at 50% 30%, rgba(124,193,66,0.5) 0%, rgba(90,158,47,0.3) 40%, transparent 70%)}
.so-helmet-name{font-size:0.82rem;font-weight:600;color:#e0e8f0;white-space:nowrap}
.so-helmet-tag{font-size:0.65rem;font-family:'Share Tech Mono',monospace;padding:1px 5px;border-radius:8px;margin-left:4px}

/* Cards */
.so-card{background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.15);border-radius:8px;padding:10px 14px;margin:6px 0;color:#e0e8f0;font-size:0.88rem;line-height:1.5;position:relative}
.so-card.so-social{border:1px dashed rgba(255,145,0,0.4);background:rgba(255,145,0,0.05)}
.so-card.so-mole{border:1px dashed rgba(255,23,68,0.4);background:rgba(255,23,68,0.05)}
.so-card.so-elim{border:1px solid rgba(255,23,68,0.3);background:rgba(255,23,68,0.08)}
.so-card.so-launch{border:1px solid rgba(0,230,118,0.3);background:rgba(0,230,118,0.08)}
.so-card.so-winner-card{border:2px solid rgba(255,215,0,0.5);background:rgba(255,215,0,0.08)}
.so-card-icon{display:inline-block;margin-right:6px;font-size:1.1rem;vertical-align:middle}

/* Progress bar */
.so-bar-wrap{height:8px;background:rgba(0,229,255,0.1);border-radius:4px;overflow:hidden;margin:4px 0}
.so-bar{height:100%;border-radius:4px;transition:width 0.4s ease}
.so-bar.so-cyan{background:linear-gradient(90deg,#00e5ff,#00b8d4)}
.so-bar.so-green{background:linear-gradient(90deg,#00e676,#00c853)}
.so-bar.so-orange{background:linear-gradient(90deg,#ff9100,#ff6d00)}
.so-bar.so-red{background:linear-gradient(90deg,#ff1744,#d50000)}
.so-bar.so-slime{background:linear-gradient(90deg,#7CC142,#5A9E2F)}

/* Reveal controls */
.so-reveal-bar{display:flex;gap:8px;align-items:center;justify-content:center;margin:10px 0;flex-wrap:wrap}
.so-btn{font-family:'Share Tech Mono',monospace;font-size:0.78rem;padding:5px 14px;border:1px solid rgba(0,229,255,0.3);border-radius:4px;background:rgba(0,229,255,0.1);color:#00e5ff;cursor:pointer;letter-spacing:1px;transition:all 0.2s}
.so-btn:hover{background:rgba(0,229,255,0.2);border-color:#00e5ff}
.so-btn.so-btn-orange{border-color:rgba(255,145,0,0.3);background:rgba(255,145,0,0.1);color:#ff9100}
.so-btn.so-btn-orange:hover{background:rgba(255,145,0,0.2);border-color:#ff9100}

/* Step visibility */
.so-step{opacity:0;max-height:0;overflow:hidden;transition:opacity 0.4s,max-height 0.5s}
.so-step.so-visible{opacity:1;max-height:4000px}

/* Host line */
.so-host{font-style:italic;color:#ff9100;margin:8px 0;padding:8px 12px;border-left:3px solid rgba(255,145,0,0.4);background:rgba(255,145,0,0.04);font-size:0.88rem;border-radius:0 6px 6px 0}

/* Sidebar sections */
.so-sb-title{font-family:'Share Tech Mono',monospace;font-size:0.75rem;letter-spacing:2px;color:#00e5ff;text-transform:uppercase;margin:0 0 6px 0;padding-bottom:4px;border-bottom:1px solid rgba(0,229,255,0.2)}
.so-sb-section{margin:10px 0}
.so-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.78rem}
.so-sb-row img{width:22px;height:22px;border-radius:50%;object-fit:contain;flex-shrink:0;border:1.5px solid #6b7a8a}
.so-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e0e8f0}
.so-sb-tag{font-family:'Share Tech Mono',monospace;font-size:0.6rem;padding:1px 4px;border-radius:3px;white-space:nowrap}
.so-sb-tag.so-cyan{background:rgba(0,229,255,0.15);color:#00e5ff}
.so-sb-tag.so-green{background:rgba(0,230,118,0.15);color:#00e676}
.so-sb-tag.so-orange{background:rgba(255,145,0,0.15);color:#ff9100}
.so-sb-tag.so-red{background:rgba(255,23,68,0.15);color:#ff1744}
.so-sb-tag.so-grey{background:rgba(200,200,200,0.1);color:#888}
.so-sb-tag.so-slime{background:rgba(124,193,66,0.15);color:#7CC142}
.so-sb-tag.so-gold{background:rgba(255,215,0,0.15);color:#ffd700}

/* Countdown */
.so-countdown{font-family:'Share Tech Mono',monospace;font-size:2rem;color:#ff1744;text-align:center;text-shadow:0 0 20px rgba(255,23,68,0.6);letter-spacing:4px;margin:6px 0}
.so-countdown.so-final{animation:so-countFlash 0.5s ease-in-out infinite}
@keyframes so-countFlash{0%,100%{opacity:1}50%{opacity:0.4}}

/* Oxygen gauge in sidebar */
.so-gauge{height:100px;width:20px;background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.2);border-radius:10px;overflow:hidden;position:relative;margin:4px auto}
.so-gauge-fill{position:absolute;bottom:0;left:0;right:0;border-radius:0 0 10px 10px;transition:height 0.5s}

/* Stage indicator */
.so-stage-dots{display:flex;gap:4px;justify-content:center;margin:6px 0}
.so-stage-dot{width:10px;height:10px;border-radius:50%;border:1px solid rgba(0,229,255,0.3);background:transparent;transition:all 0.3s}
.so-stage-dot.so-done{background:#00e676;border-color:#00e676}
.so-stage-dot.so-current{background:#ff9100;border-color:#ff9100;box-shadow:0 0 8px rgba(255,145,0,0.5)}
.so-stage-dot.so-future{background:transparent}

/* Fire streaks for re-entry */
.so-fire-streaks{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.so-fire-streak{position:absolute;width:2px;height:60px;background:linear-gradient(180deg,rgba(255,145,0,0.8),rgba(255,255,255,0.6),transparent);transform:rotate(135deg);animation:so-fireMove 1.5s linear infinite;opacity:0.6}
@keyframes so-fireMove{0%{transform:rotate(135deg) translateY(-100px)}100%{transform:rotate(135deg) translateY(600px)}}

/* Corridor map for sprint */
.so-corridor{display:flex;align-items:center;gap:2px;margin:6px 0;padding:4px;background:rgba(138,155,174,0.08);border-radius:4px}
.so-corridor-seg{flex:1;height:18px;border-radius:2px;position:relative;background:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.1);font-size:0.55rem;display:flex;align-items:center;justify-content:center;color:rgba(0,229,255,0.5);font-family:'Share Tech Mono',monospace;overflow:hidden}
.so-corridor-seg.so-cleared{background:rgba(0,230,118,0.1);border-color:rgba(0,230,118,0.3)}
.so-corridor-dot{position:absolute;width:8px;height:8px;border-radius:50%;border:1px solid #fff;top:50%;transform:translateY(-50%)}

/* Floating animation for zero-G cards */
.so-float{animation:so-bobFloat 3s ease-in-out infinite}
@keyframes so-bobFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(0.5deg)}}

/* Screen shake for red alert */
.so-shake{animation:so-screenShake 0.3s ease-in-out}
@keyframes so-screenShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}

/* Pod launch */
.so-pod-launch{animation:so-launchUp 0.8s ease-in forwards}
@keyframes so-launchUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-40px);opacity:0.3}}

/* Hatch burst */
.so-hatch-burst{animation:so-burstOut 1s ease-out forwards}
@keyframes so-burstOut{0%{transform:scale(0.8);opacity:0}30%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}

/* Leaderboard */
.so-lb-row{display:flex;align-items:center;gap:6px;padding:4px 8px;margin:2px 0;border-radius:4px;font-size:0.85rem}
.so-lb-row.so-first{background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3)}
.so-lb-rank{font-family:'Share Tech Mono',monospace;width:24px;text-align:center;color:#ff9100}
.so-lb-name{flex:1;color:#e0e8f0}
.so-lb-score{font-family:'Share Tech Mono',monospace;color:#00e5ff;font-size:0.8rem}
.so-lb-tag{font-size:0.6rem;padding:1px 5px;border-radius:6px}

/* Escalation text */
.so-escalation{text-align:center;font-style:italic;color:#ff9100;margin:8px 0;font-size:0.85rem;opacity:0.9}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .so-shell::before,.so-shell::after{animation:none!important}
  .so-h1,.so-float,.so-countdown.so-final,.so-pod-launch,.so-hatch-burst,.so-shake,.so-fire-streak{animation:none!important;transform:none!important}
  .so-step{transition:none!important}
  .so-bar{transition:none!important}
}
</style>`;
}

// ── PLAYER HELMET BUILDER ──
function _helmet(name, statusCls = '', tag = '') {
  const sl = slug(name);
  return `<span class="so-helmet ${statusCls}">
    <span class="so-helmet-visor"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.style.display='none'"></span>
    <span class="so-helmet-name">${name}</span>${tag ? `<span class="so-helmet-tag ${tag.cls || ''}">${tag.text}</span>` : ''}
  </span>`;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, phaseCls = '') {
  window._soData = ep.spaceOwen;
  window._soEp = ep;
  return `${_css()}<div class="so-shell ${phaseCls}" data-phase="${phaseCls}">
    <div class="so-main">${content}</div>
    <div class="so-sidebar" id="so-sidebar">${_buildSidebarContent(ep.spaceOwen, phaseCls)}</div>
  </div>`;
}

// ── SIDEBAR CONTENT (gated by _tvState) ──
function _buildSidebarContent(data, phase) {
  if (!data) return '<div class="so-sb-title">NO DATA</div>';
  const ps = data.playerStates;
  const names = Object.keys(ps);

  if (phase === 'so-zerog') return _sidebarZeroG(data, ps, names);
  if (phase === 'so-redalert') return _sidebarRedAlert(data, ps, names);
  if (phase === 'so-reentry') return _sidebarReEntry(data, ps, names);
  if (phase === 'so-station') return _sidebarSprint(data, ps, names);
  if (phase === 'so-winner') return _sidebarWinner(data, ps, names);
  // Title card — mission roster
  return _sidebarRoster(data, ps, names);
}

function _sidebarRoster(data, ps, names) {
  let h = '<div class="so-sb-title">MISSION ROSTER</div>';
  names.forEach(n => {
    const sl = slug(n);
    h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span><span class="so-sb-tag so-cyan">CREW</span></div>`;
  });
  h += `<div class="so-sb-section"><div class="so-sb-title">MISSION BRIEF</div><div style="font-size:0.72rem;color:#8a9bae;line-height:1.4">4 Zones. Survive each to advance. Last one standing wins immunity.</div></div>`;
  return h;
}

function _sidebarZeroG(data, ps, names) {
  const st = _tvState['so-zerog'];
  const revIdx = st ? st.idx : -1;
  let h = '<div class="so-sb-title">CREW STATUS</div>';
  // Show adaptation info gated by reveal
  const adaptData = data.zone1.adaptation || [];
  names.forEach((n, i) => {
    const sl = slug(n);
    const revealed = i <= revIdx;
    const ad = adaptData.find(a => a.name === n);
    if (revealed && ad) {
      const pct = Math.round(ad.score * 10);
      const barCls = ad.score >= 7 ? 'so-cyan' : ad.score >= 4 ? 'so-orange' : 'so-red';
      h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span><span class="so-sb-tag ${ad.score >= 7 ? 'so-cyan' : ad.score >= 4 ? 'so-orange' : 'so-red'}">${ad.attempts} SRCH</span></div>`;
      h += `<div class="so-bar-wrap" style="margin-left:27px"><div class="so-bar ${barCls}" style="width:${pct}%"></div></div>`;
      // Components found
      const searchData = data.zone1.searches?.find(s => s.name === n);
      if (searchData) {
        const comps = searchData.finalComponents || [];
        if (comps.length > 0) {
          h += `<div style="margin-left:27px;font-size:0.65rem;color:#8a9bae">${comps.map(c => COMPONENT_LABELS[c] || c).join(' ')}</div>`;
        }
      }
    } else {
      h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span><span class="so-sb-tag so-grey">???</span></div>`;
    }
  });
  return h;
}

function _sidebarRedAlert(data, ps, names) {
  const st = _tvState['so-redalert'];
  const revIdx = st ? st.idx : -1;
  const totalRounds = data.zone2.rounds?.length || 5;
  const roundsRevealed = revIdx + 1;

  let h = '<div class="so-sb-title">EMERGENCY</div>';

  // Countdown
  const remaining = Math.max(0, totalRounds - roundsRevealed);
  h += `<div class="so-countdown ${remaining <= 1 ? 'so-final' : ''}">${remaining > 0 ? `T-${remaining}` : 'T-0'}</div>`;

  // Ship integrity (fake gauge)
  const integrity = Math.max(10, 100 - roundsRevealed * 18);
  h += `<div style="text-align:center;margin:4px 0"><span style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:${integrity < 40 ? '#ff1744' : '#ff9100'}">HULL ${integrity}%</span></div>`;
  h += `<div class="so-bar-wrap"><div class="so-bar ${integrity < 40 ? 'so-red' : 'so-orange'}" style="width:${integrity}%"></div></div>`;

  h += '<div class="so-sb-section"><div class="so-sb-title">POD STATUS</div>';

  // Show repair progress gated by round
  names.forEach(n => {
    const sl = slug(n);
    const elimData = data.zone2.eliminations?.find(e => e.name === n);
    const launchData = data.zone2.launches?.find(l => l.name === n);
    let progress = 0;
    let status = 'REPAIRING';
    let statusCls = 'so-cyan';

    // Gather progress from revealed rounds
    if (roundsRevealed > 0) {
      const lastRevealed = data.zone2.rounds[Math.min(roundsRevealed - 1, totalRounds - 1)];
      const repair = lastRevealed?.repairs?.find(r => r.name === n);
      if (repair) progress = repair.progress;
    }

    // Only show launch/elim status after all rounds revealed
    if (revIdx >= totalRounds - 1) {
      if (elimData) { status = 'STRANDED'; statusCls = 'so-red'; }
      else if (launchData) { status = 'LAUNCHED'; statusCls = 'so-green'; progress = 100; }
    }

    const barCls = progress >= 100 ? 'so-green' : progress >= 60 ? 'so-cyan' : progress >= 30 ? 'so-orange' : 'so-red';
    h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span><span class="so-sb-tag ${statusCls}">${status}</span></div>`;
    h += `<div class="so-bar-wrap" style="margin-left:27px"><div class="so-bar ${barCls}" style="width:${progress}%"></div></div>`;
  });
  h += '</div>';
  return h;
}

function _sidebarReEntry(data, ps, names) {
  const st = _tvState['so-reentry'];
  const revIdx = st ? st.idx : -1;
  const stages = data.zone3.stages || [];
  const totalStages = stages.length;
  const stagesRevealed = revIdx + 1;

  let h = '<div class="so-sb-title">RE-ENTRY TELEMETRY</div>';

  // Stage indicator dots
  h += '<div class="so-stage-dots">';
  for (let i = 0; i < totalStages; i++) {
    const cls = i < stagesRevealed ? 'so-done' : (i === stagesRevealed ? 'so-current' : 'so-future');
    h += `<div class="so-stage-dot ${cls}" title="${REENTRY_TEXT.stages[i]?.name || ''}"></div>`;
  }
  h += '</div>';

  // G-force meter (fake)
  const gForce = Math.min(9, 1 + stagesRevealed * 1.6).toFixed(1);
  h += `<div style="text-align:center;margin:6px 0"><span style="font-family:'Share Tech Mono',monospace;font-size:0.9rem;color:${parseFloat(gForce) > 5 ? '#ff1744' : '#ff9100'}">${gForce}G</span></div>`;

  h += '<div class="so-sb-section"><div class="so-sb-title">CREW</div>';

  // Only show players who launched (not zone2-eliminated)
  const launched = names.filter(n => !data.zone2.eliminations?.some(e => e.name === n));
  launched.forEach(n => {
    const sl = slug(n);
    let status = 'IN POD';
    let statusCls = 'so-cyan';

    // Check vomit status up to revealed stage
    const elimEntry = data.zone3.eliminations?.find(e => e.name === n);
    if (elimEntry && stagesRevealed > elimEntry.stageIdx) {
      status = 'BURNOUT'; statusCls = 'so-slime';
    } else if (stagesRevealed > 0) {
      // Check last revealed stage result
      const lastStage = stages[Math.min(stagesRevealed - 1, stages.length - 1)];
      const res = lastStage?.results?.find(r => r.name === n);
      if (res?.status === 'struggling') { status = 'STRUGGLING'; statusCls = 'so-orange'; }
      else if (res?.status === 'holding') { status = 'HOLDING'; statusCls = 'so-green'; }
    }

    // Endurance bar
    const endurance = Math.min(100, stagesRevealed > 0 && statusCls !== 'so-slime' ? (stagesRevealed / totalStages) * 100 : 0);
    h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span><span class="so-sb-tag ${statusCls}">${status}</span></div>`;
    if (statusCls !== 'so-slime') {
      h += `<div class="so-bar-wrap" style="margin-left:27px"><div class="so-bar so-orange" style="width:${endurance}%"></div></div>`;
    }
  });
  h += '</div>';

  // Burnout section
  const burnouts = data.zone3.eliminations?.filter(e => stagesRevealed > e.stageIdx) || [];
  if (burnouts.length > 0) {
    h += '<div class="so-sb-section"><div class="so-sb-title">BURNOUT</div>';
    burnouts.forEach(e => {
      const sl = slug(e.name);
      h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${e.name}" onerror="this.style.display='none'"><span class="so-sb-name" style="color:#7CC142">${e.name}</span><span class="so-sb-tag so-slime">${e.stage}</span></div>`;
    });
    h += '</div>';
  }
  return h;
}

function _sidebarSprint(data, ps, names) {
  const st = _tvState['so-sprint'];
  const revIdx = st ? st.idx : -1;
  const rounds = data.sprint.rounds || [];
  const roundsRevealed = revIdx + 1;
  const obstacles = data.sprint.obstacles || [];

  let h = '<div class="so-sb-title">STATION ESCAPE</div>';

  // Corridor map
  h += '<div class="so-corridor">';
  obstacles.forEach((ob, i) => {
    h += `<div class="so-corridor-seg" title="${ob.name}">${ob.icon}</div>`;
  });
  h += '</div>';

  h += '<div class="so-sb-section"><div class="so-sb-title">RACE STATUS</div>';

  // Only show sprinters (not eliminated)
  const sprinters = names.filter(n => ps[n] && !ps[n].eliminatedAt);
  sprinters.forEach(n => {
    const sl = slug(n);
    // Calculate obstacle position from revealed rounds
    let obstaclePos = 0;
    for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
      const attempts = rounds[r].attempts?.filter(a => a.name === n && a.passed) || [];
      obstaclePos += attempts.length;
    }
    obstaclePos = Math.min(obstaclePos, obstacles.length);

    const isWinner = roundsRevealed >= rounds.length && data.sprint.winner === n;
    const tag = isWinner ? '<span class="so-sb-tag so-gold">WINNER</span>' : `<span class="so-sb-tag so-cyan">${obstaclePos}/${obstacles.length}</span>`;
    h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span>${tag}</div>`;
    h += `<div class="so-bar-wrap" style="margin-left:27px"><div class="so-bar so-cyan" style="width:${(obstaclePos / obstacles.length) * 100}%"></div></div>`;
  });
  h += '</div>';
  return h;
}

function _sidebarWinner(data, ps, names) {
  let h = '<div class="so-sb-title">FINAL STANDINGS</div>';
  const rankings = data.eliminationOrder ? [...data.eliminationOrder].reverse() : [];
  // Winner first, then sprinters by obstacle, then elims reversed
  const winner = data.immunityWinner;
  const ordered = [winner, ...names.filter(n => n !== winner && !rankings.includes(n)), ...rankings];
  ordered.forEach((n, i) => {
    const sl = slug(n);
    let tag = '';
    if (n === winner) tag = '<span class="so-sb-tag so-gold">IMMUNE</span>';
    else if (ps[n]?.eliminatedAt === 'zone2') tag = '<span class="so-sb-tag so-red">STRANDED</span>';
    else if (ps[n]?.eliminatedAt === 'reentry') tag = '<span class="so-sb-tag so-slime">BURNOUT</span>';
    else tag = `<span class="so-sb-tag so-cyan">#${i + 1}</span>`;
    h += `<div class="so-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="so-sb-name">${n}</span>${tag}</div>`;
  });
  return h;
}


// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenTitleCard(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const names = Object.keys(data.playerStates);
  let helmets = names.map(n => `<div class="so-float" style="animation-delay:${(Math.random() * 2).toFixed(1)}s">${_helmet(n, 'so-active')}</div>`).join('');

  const content = `
    <div class="so-h1" style="font-size:2rem;margin:20px 0 6px">2008: A SPACE OWEN</div>
    <div style="text-align:center;font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:#8a9bae;letter-spacing:4px;margin-bottom:16px">POST-MERGE IMMUNITY CHALLENGE</div>
    <div class="so-host">${data.hostLines?.zone1 || ''}</div>
    <div style="text-align:center;margin:16px 0">
      <div style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#00e5ff;letter-spacing:2px;margin-bottom:8px">CREW MANIFEST</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px">${helmets}</div>
    </div>
    <div style="margin-top:16px;text-align:center">
      <div class="so-card" style="display:inline-block;max-width:420px;text-align:left">
        <div class="so-h3">MISSION PARAMETERS</div>
        <div style="font-size:0.82rem;line-height:1.6;color:#8a9bae">
          <b style="color:#00e5ff">ZONE 1</b> — Zero-G Adaptation + Component Search<br>
          <b style="color:#ff1744">ZONE 2</b> — Red Alert: Escape Pod Repair (5 rounds)<br>
          <b style="color:#ff9100">ZONE 3</b> — Re-Entry Shakedown (5 stages)<br>
          <b style="color:#00e676">ZONE 4</b> — Earth Station Sprint (5 obstacles)<br>
          <span style="color:#ffd700">First to exit the station wins immunity.</span>
        </div>
      </div>
    </div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders['so-title'] = rpBuildSpaceOwenTitleCard;
  return _shell(content, ep, '');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 2: ZERO-G (Zone 1)
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenZeroG(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const adaptations = data.zone1.adaptation || [];
  const searches = data.zone1.searches || [];
  const socialEvents = data.zone1.socialEvents || [];
  const moleActions = data.zone1.moleActions || [];
  const totalSteps = adaptations.length;
  const stKey = 'so-zerog';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';
  adaptations.forEach((ad, i) => {
    const vis = i <= st.idx ? 'so-visible' : '';
    const searchData = searches.find(s => s.name === ad.name);
    const playerSearches = searchData?.searches || [];
    const components = searchData?.finalComponents || [];
    const scorePct = Math.round(ad.score * 10);
    const barCls = ad.score >= 7 ? 'so-cyan' : ad.score >= 4 ? 'so-orange' : 'so-red';

    let searchHtml = playerSearches.map(s => {
      if (s.type === 'found') return `<div class="so-card" style="margin:3px 0;padding:6px 10px;font-size:0.82rem"><span class="so-card-icon">🔍</span>${s.text}</div>`;
      if (s.type === 'bonus') return `<div class="so-card" style="margin:3px 0;padding:6px 10px;font-size:0.82rem;border-color:rgba(255,215,0,0.3)"><span class="so-card-icon">✨</span>${s.text}</div>`;
      if (s.type === 'bumped') return `<div class="so-card so-mole" style="margin:3px 0;padding:6px 10px;font-size:0.82rem"><span class="so-card-icon">💥</span>${s.text}</div>`;
      return `<div class="so-card" style="margin:3px 0;padding:6px 10px;font-size:0.82rem;opacity:0.7"><span class="so-card-icon">❌</span>${s.text}</div>`;
    }).join('');

    // Component inventory
    let compHtml = '';
    if (components.length > 0) {
      compHtml = `<div style="margin:4px 0 0;font-size:0.78rem;color:#8a9bae">Inventory: ${components.map(c => COMPONENT_LABELS[c] || c).join(', ')}</div>`;
    }

    steps += `<div class="so-step ${vis}" data-step="${i}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${_helmet(ad.name, barCls === 'so-cyan' ? 'so-active' : barCls === 'so-orange' ? 'so-struggling' : 'so-danger')}
        <div style="flex:1">
          <div style="font-size:0.75rem;color:#8a9bae;font-family:'Share Tech Mono',monospace">ZERO-G SCORE: ${ad.score.toFixed(1)}/10 — ${ad.attempts} SEARCHES</div>
          <div class="so-bar-wrap"><div class="so-bar ${barCls}" style="width:${scorePct}%"></div></div>
        </div>
      </div>
      <div class="so-card"><span class="so-card-icon">🚀</span>${ad.text}</div>
      ${searchHtml}${compHtml}
    </div>`;

    // Insert social event after every 2-3 players
    if ((i + 1) % 3 === 0 || i === adaptations.length - 1) {
      const socIdx = Math.floor(i / 3);
      if (socialEvents[socIdx]) {
        const se = socialEvents[socIdx];
        const seVis = i <= st.idx ? 'so-visible' : '';
        const icon = se.type === 'showmance' ? '💕' : se.type === 'steal' ? '🗡' : se.type === 'taunt' ? '😈' : se.type === 'help' ? '🤝' : '💫';
        steps += `<div class="so-step ${seVis}" data-step="${i}"><div class="so-card so-social"><span class="so-card-icon">${icon}</span>${se.text}</div></div>`;
      }
    }
  });

  // Mole actions at the end (shown when all revealed)
  if (moleActions.length > 0) {
    const moleVis = st.idx >= totalSteps - 1 ? 'so-visible' : '';
    let moleHtml = moleActions.map(ma => `<div class="so-card so-mole"><span class="so-card-icon">🕵️</span>${ma.text}</div>`).join('');
    steps += `<div class="so-step ${moleVis}" data-step="${totalSteps - 1}">${moleHtml}</div>`;
  }

  const content = `
    <div class="so-h1">ZONE 1: ZERO GRAVITY</div>
    <div class="so-host">${data.hostLines?.zone1 || ''}</div>
    <div class="so-reveal-bar">
      <button class="so-btn" onclick="soRevealNext('${stKey}',${totalSteps})">NEXT CREW MEMBER ▶</button>
      <button class="so-btn so-btn-orange" onclick="soRevealAll('${stKey}',${totalSteps})">REVEAL ALL ⏩</button>
      <span style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#8a9bae">${Math.min(st.idx + 1, totalSteps)}/${totalSteps}</span>
    </div>
    <div data-screen-key="${stKey}">${steps}</div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders[stKey] = rpBuildSpaceOwenZeroG;
  return _shell(content, ep, 'so-zerog');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 3: RED ALERT (Zone 2)
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenRedAlert(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.zone2.rounds || [];
  const elims = data.zone2.eliminations || [];
  const launches = data.zone2.launches || [];
  const socialEvents = data.zone2.socialEvents || [];
  const moleActions = data.zone2.moleActions || [];
  const totalSteps = rounds.length;
  const stKey = 'so-redalert';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  // Alarm intro (always visible)
  steps += `<div class="so-card" style="border-color:rgba(255,23,68,0.4);background:rgba(255,23,68,0.08);text-align:center;font-size:0.95rem">${data.zone2.alarm}</div>`;

  rounds.forEach((round, i) => {
    const vis = i <= st.idx ? 'so-visible' : '';
    const remaining = totalSteps - i - 1;
    const isLast = i === totalSteps - 1;

    let repairCards = (round.repairs || []).map(r => {
      const pctColor = r.progress >= 100 ? '#00e676' : r.progress >= 60 ? '#00e5ff' : r.progress >= 30 ? '#ff9100' : '#ff1744';
      const barCls = r.progress >= 100 ? 'so-green' : r.progress >= 60 ? 'so-cyan' : r.progress >= 30 ? 'so-orange' : 'so-red';
      return `<div class="so-card" style="padding:8px 12px">
        <div style="display:flex;align-items:center;gap:8px">
          ${_helmet(r.name, r.progress >= 100 ? 'so-launched' : r.progress >= 60 ? 'so-active' : 'so-struggling')}
          <div style="flex:1">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:${pctColor}">${r.progress}%</div>
            <div class="so-bar-wrap"><div class="so-bar ${barCls}" style="width:${r.progress}%"></div></div>
          </div>
        </div>
        <div style="margin-top:4px;font-size:0.84rem">${r.text}</div>
      </div>`;
    }).join('');

    // Mole actions for this round
    const roundMole = moleActions.filter(ma => ma.round === round.round);
    let moleHtml = roundMole.map(ma => `<div class="so-card so-mole"><span class="so-card-icon">🕵️</span>${ma.text}</div>`).join('');

    // Social events (1 per round)
    const socEvent = socialEvents[i];
    let socHtml = '';
    if (socEvent) {
      const icon = socEvent.type === 'showmanceSacrifice' ? '💕' : socEvent.type === 'give' ? '🤝' : socEvent.type === 'refuse' ? '🚫' : socEvent.type === 'hoard' ? '😈' : socEvent.type === 'blame' ? '😡' : '😰';
      socHtml = `<div class="so-card so-social"><span class="so-card-icon">${icon}</span>${socEvent.text}</div>`;
    }

    steps += `<div class="so-step ${vis}" data-step="${i}">
      <div class="so-h2">ROUND ${round.round} <span style="font-size:0.7rem;color:#ff1744">T-${remaining}</span></div>
      ${round.escalation ? `<div class="so-escalation">${round.escalation}</div>` : ''}
      ${repairCards}${moleHtml}${socHtml}
    </div>`;
  });

  // Launch + elimination results (shown after all rounds)
  const finalVis = st.idx >= totalSteps - 1 ? 'so-visible' : '';
  let launchCards = launches.map(l => `<div class="so-card so-launch"><span class="so-card-icon">🚀</span>${l.text}</div>`).join('');
  let elimCards = elims.map(e => `<div class="so-card so-elim"><span class="so-card-icon">💀</span>${e.text}</div>`).join('');

  if (launches.length > 0 || elims.length > 0) {
    steps += `<div class="so-step ${finalVis}" data-step="${totalSteps - 1}">
      <div class="so-h2" style="color:#00e676">PODS AWAY</div>
      ${launchCards}
      ${elims.length > 0 ? `<div class="so-h2" style="color:#ff1744">LEFT BEHIND</div>${elimCards}` : ''}
    </div>`;
  }

  const content = `
    <div class="so-h1" style="color:#ff1744;text-shadow:0 0 20px rgba(255,23,68,0.6),0 0 40px rgba(255,23,68,0.3)">ZONE 2: RED ALERT</div>
    <div class="so-host">${data.hostLines?.zone2 || ''}</div>
    <div class="so-reveal-bar">
      <button class="so-btn" style="border-color:rgba(255,23,68,0.3);background:rgba(255,23,68,0.1);color:#ff1744" onclick="soRevealNext('${stKey}',${totalSteps})">NEXT ROUND ▶</button>
      <button class="so-btn so-btn-orange" onclick="soRevealAll('${stKey}',${totalSteps})">REVEAL ALL ⏩</button>
      <span style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#8a9bae">${Math.min(st.idx + 1, totalSteps)}/${totalSteps}</span>
    </div>
    <div data-screen-key="${stKey}">${steps}</div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders[stKey] = rpBuildSpaceOwenRedAlert;
  return _shell(content, ep, 'so-redalert');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 4: RE-ENTRY (Zone 3)
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenReEntry(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const stages = data.zone3.stages || [];
  const totalSteps = stages.length;
  const stKey = 'so-reentry';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  stages.forEach((stage, i) => {
    const vis = i <= st.idx ? 'so-visible' : '';
    const intensity = Math.min(5, i + 1);

    // Fire streaks increase per stage
    let fireHtml = '';
    if (i >= 2) {
      const streakCount = (i - 1) * 3;
      let streaks = '';
      for (let s = 0; s < streakCount; s++) {
        const left = Math.random() * 100;
        const delay = (Math.random() * 2).toFixed(1);
        const dur = (1 + Math.random()).toFixed(1);
        streaks += `<div class="so-fire-streak" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
      }
      fireHtml = `<div class="so-fire-streaks">${streaks}</div>`;
    }

    // Player results
    let resultCards = (stage.results || []).map(r => {
      const icon = r.status === 'vomited' ? '🤮' : r.status === 'holding' ? '✊' : '😰';
      const cardCls = r.status === 'vomited' ? 'so-elim' : '';
      const helmetCls = r.status === 'vomited' ? 'so-vomit' : r.status === 'holding' ? 'so-active' : 'so-struggling';
      return `<div class="so-card ${cardCls}">
        <div style="display:flex;align-items:center;gap:8px">${_helmet(r.name, helmetCls)}<span class="so-card-icon">${icon}</span></div>
        <div style="margin-top:4px;font-size:0.84rem">${r.text}</div>
      </div>`;
    }).join('');

    // Social events for this stage
    let socHtml = (stage.socialEvents || []).map(se => {
      const icon = se.type === 'showmance' ? '💕' : se.type === 'trashTalk' ? '📡' : se.type === 'moleSuspicion' ? '🕵️' : '📡';
      return `<div class="so-card so-social"><span class="so-card-icon">${icon}</span>${se.text}</div>`;
    }).join('');

    // Mole actions for this stage
    const moleSt = (data.zone3.moleActions || []).filter(ma => ma.stage === i);
    let moleHtml = moleSt.map(ma => `<div class="so-card so-mole"><span class="so-card-icon">🕵️</span>${ma.text}</div>`).join('');

    steps += `<div class="so-step ${vis}" data-step="${i}" style="position:relative">
      ${fireHtml}
      <div class="so-h2" style="position:relative;z-index:1">${stage.icon} ${stage.name} <span style="font-size:0.7rem;color:#8a9bae">STAGE ${i + 1}/${totalSteps}</span></div>
      <div style="position:relative;z-index:1">${resultCards}${socHtml}${moleHtml}</div>
    </div>`;
  });

  const content = `
    <div class="so-h1" style="color:#ff9100;text-shadow:0 0 20px rgba(255,145,0,0.6),0 0 40px rgba(255,145,0,0.3)">ZONE 3: RE-ENTRY</div>
    <div class="so-host">${data.hostLines?.zone3 || ''}</div>
    <div class="so-reveal-bar">
      <button class="so-btn so-btn-orange" onclick="soRevealNext('${stKey}',${totalSteps})">NEXT STAGE ▶</button>
      <button class="so-btn" onclick="soRevealAll('${stKey}',${totalSteps})">REVEAL ALL ⏩</button>
      <span style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#8a9bae">${Math.min(st.idx + 1, totalSteps)}/${totalSteps}</span>
    </div>
    <div data-screen-key="${stKey}">${steps}</div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders[stKey] = rpBuildSpaceOwenReEntry;
  return _shell(content, ep, 'so-reentry');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 5: SPRINT (Zone 3a)
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenSprint(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.sprint.rounds || [];
  const obstacles = data.sprint.obstacles || [];
  const totalSteps = rounds.length;
  const stKey = 'so-sprint';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  // Obstacle legend
  steps += `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0">${obstacles.map((ob, i) => `<span style="font-size:0.75rem;font-family:'Share Tech Mono',monospace;color:#8a9bae;padding:2px 8px;border:1px solid rgba(0,229,255,0.15);border-radius:4px">${ob.icon} ${ob.name}</span>`).join('')}</div>`;

  rounds.forEach((round, i) => {
    const vis = i <= st.idx ? 'so-visible' : '';
    const attempts = round.attempts || [];
    const socEvents = round.socialEvents || [];

    let attemptCards = attempts.map(a => {
      const obs = obstacles.find(o => o.id === a.obstacle);
      const icon = a.passed ? '✅' : '❌';
      const cls = a.passed ? '' : 'opacity:0.8';
      return `<div class="so-card" style="${cls};padding:8px 12px">
        <div style="display:flex;align-items:center;gap:6px">
          ${_helmet(a.name, a.passed ? 'so-active' : 'so-struggling')}
          <span style="font-size:0.9rem">${obs?.icon || ''}</span>
          <span class="so-card-icon">${icon}</span>
        </div>
        <div style="margin-top:3px;font-size:0.84rem">${a.text}</div>
      </div>`;
    }).join('');

    let socHtml = socEvents.map(se => {
      const icon = se.type === 'shove' ? '😈' : se.type === 'encouragement' ? '🤝' : se.type === 'rally' ? '🔥' : se.type === 'meltdown' ? '💢' : '💬';
      return `<div class="so-card so-social"><span class="so-card-icon">${icon}</span>${se.text}</div>`;
    }).join('');

    steps += `<div class="so-step ${vis}" data-step="${i}">
      <div class="so-h2">SPRINT ROUND ${round.round}</div>
      ${attemptCards}${socHtml}
    </div>`;
  });

  const content = `
    <div class="so-h1" style="color:#00e676;text-shadow:0 0 20px rgba(0,230,118,0.6)">ZONE 4: STATION ESCAPE</div>
    <div class="so-host">${data.hostLines?.sprint || ''}</div>
    <div class="so-reveal-bar">
      <button class="so-btn" style="border-color:rgba(0,230,118,0.3);background:rgba(0,230,118,0.1);color:#00e676" onclick="soRevealNext('${stKey}',${totalSteps})">NEXT ROUND ▶</button>
      <button class="so-btn so-btn-orange" onclick="soRevealAll('${stKey}',${totalSteps})">REVEAL ALL ⏩</button>
      <span style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#8a9bae">${Math.min(st.idx + 1, totalSteps)}/${totalSteps}</span>
    </div>
    <div data-screen-key="${stKey}">${steps}</div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders[stKey] = rpBuildSpaceOwenSprint;
  return _shell(content, ep, 'so-station');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 6: WINNER
// ══════════════════════════════════════════════════════════════

export function rpBuildSpaceOwenWinner(ep) {
  const data = ep.spaceOwen;
  if (!data) return '<div>No challenge data</div>';

  const winner = data.immunityWinner;
  const ps = data.playerStates;
  const names = Object.keys(ps);

  // Build leaderboard from chalMemberScores
  const scores = ep.chalMemberScores || {};
  const sorted = names.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

  let leaderboard = sorted.map((n, i) => {
    const isWinner = n === winner;
    const elimAt = ps[n]?.eliminatedAt;
    let tagHtml = '';
    if (isWinner) tagHtml = '<span class="so-lb-tag" style="background:rgba(255,215,0,0.15);color:#ffd700">IMMUNE</span>';
    else if (elimAt === 'zone2') tagHtml = '<span class="so-lb-tag" style="background:rgba(255,23,68,0.15);color:#ff1744">STRANDED</span>';
    else if (elimAt === 'reentry') tagHtml = '<span class="so-lb-tag" style="background:rgba(124,193,66,0.15);color:#7CC142">BURNOUT</span>';

    return `<div class="so-lb-row ${isWinner ? 'so-first' : ''}" style="${isWinner ? '' : 'background:rgba(0,229,255,0.03)'}">
      <span class="so-lb-rank">#${i + 1}</span>
      ${_helmet(n, isWinner ? 'so-launched' : elimAt ? 'so-eliminated' : 'so-active')}
      <span class="so-lb-name">${n}</span>
      <span class="so-lb-score">${scores[n] || 0} pts</span>
      ${tagHtml}
    </div>`;
  }).join('');

  // Winner highlight
  const winnerVisor = slug(winner);

  const content = `
    <div class="so-hatch-burst" style="text-align:center;margin:12px 0">
      <div style="font-family:'Share Tech Mono',monospace;font-size:0.8rem;color:#8a9bae;letter-spacing:3px;margin-bottom:6px">EXIT HATCH BREACHED</div>
      <div class="so-h1" style="font-size:1.8rem;color:#ffd700;text-shadow:0 0 30px rgba(255,215,0,0.6),0 0 60px rgba(255,215,0,0.3)">IMMUNITY WINNER</div>
      <div style="margin:14px auto;width:90px;height:90px;border-radius:50%;border:4px solid #ffd700;overflow:hidden;position:relative;box-shadow:0 0 30px rgba(255,215,0,0.4)">
        <img src="assets/avatars/${winnerVisor}.png" alt="${winner}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(255,215,0,0.2),transparent 50%),repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,215,0,0.05) 2px,rgba(255,215,0,0.05) 4px);pointer-events:none"></div>
      </div>
      <div style="font-family:'Exo 2',sans-serif;font-size:1.3rem;font-weight:700;color:#ffd700;margin:6px 0">${winner}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#8a9bae;letter-spacing:2px">FIRST TO EXIT THE STATION</div>
    </div>
    <div class="so-h2" style="text-align:center">FINAL LEADERBOARD</div>
    <div style="max-width:500px;margin:0 auto">${leaderboard}</div>`;

  if (!window._soScreenBuilders) window._soScreenBuilders = {};
  window._soScreenBuilders['so-winner'] = rpBuildSpaceOwenWinner;
  return _shell(content, ep, 'so-winner');
}

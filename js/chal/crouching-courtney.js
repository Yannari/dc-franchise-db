// js/chal/crouching-courtney.js — Way of the Warrior kung fu challenge (post-merge)
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

// ══════════════════════════════════════════════════════════════
// TRAINING TEXT
// ══════════════════════════════════════════════════════════════
const TRAINING_BEATS = [
  { id: 'wax', name: 'Wax On, Wax Off', icon: '🧽', stats: ['endurance', 'mental'],
    desc: 'Discipline through repetition. Wax the cars. Wax them ALL.' },
  { id: 'pushup', name: 'Push-Up Gauntlet', icon: '💪', stats: ['physical', 'endurance'],
    desc: 'Push-ups. With weight. With a moose. With whatever your trainer decides.' },
  { id: 'punch', name: 'Punching Bag', icon: '🥊', stats: ['physical', 'boldness'],
    desc: 'Hit the bag. Hit it HARDER. Channel your inner warrior.' },
];

const TRAINING_TEXT = {
  good: [
    (fighter, trainer) => `${trainer} pushes ${fighter} hard. ${fighter} responds. Every rep cleaner than the last. This pair is clicking.`,
    (fighter, trainer) => `${fighter} grits ${pronouns(fighter).posAdj} teeth and powers through. ${trainer} nods approvingly. "Again." ${fighter} does it again. Better this time.`,
    (fighter, trainer) => `The training is brutal, but ${fighter} is rising to it. ${trainer}'s methods are unorthodox, but the results speak for themselves.`,
    (fighter, trainer) => `${trainer}: "One more." ${fighter}: "You said that three 'one mores' ago." ${trainer}: "One. More." ${fighter} does it. Perfectly.`,
  ],
  bad: [
    (fighter, trainer) => `${fighter} collapses mid-rep. ${trainer} sighs. "Get up." ${fighter} doesn't get up. This isn't working.`,
    (fighter, trainer) => `${trainer}'s instructions make no sense. ${fighter} does the opposite of what's asked. Both are frustrated. Zero synergy.`,
    (fighter, trainer) => `${fighter} can't keep up with ${trainer}'s pace. The gap between expectation and ability is widening. ${trainer}: "This is going to be a long day."`,
    (fighter, trainer) => `${trainer} demonstrates the form. ${fighter} copies it. Badly. ${trainer} demonstrates again. ${fighter} copies it worse. ${host()} takes notes.`,
  ],
  abuse: [
    (fighter, trainer) => `${trainer} makes ${fighter} wax EVERY car in the parking lot. All 47 of them. ${host()}: "Can you do mine too?" ${trainer}: "Obviously."`,
    (fighter, trainer) => `${trainer} puts bees in ${fighter}'s lunch. "Float like a butterfly, sting like a bee." ${fighter} gets stung 14 times. Lesson learned... maybe.`,
    (fighter, trainer) => `${trainer} drops a rock on ${fighter}'s back during push-ups. Then stands on the rock. "Pain is just weakness leaving the body." ${fighter}: "WHAT'S ENTERING THE BODY IS PAIN."`,
    (fighter, trainer) => `${trainer} replaces ${fighter}'s water with hot sauce. "Builds character." It does not build character. It builds rage.`,
  ],
  showmance: [
    (fighter, trainer) => `${trainer} is supposed to be training ${fighter}. Instead, they're staring into each other's eyes during stretches. ${host()}: "This is a DOJO, not a DATE."`,
    (fighter, trainer) => `${fighter} falls during a drill. ${trainer} catches ${pronouns(fighter).obj}. They hold the pose for three seconds too long. The other pairs notice.`,
    (fighter, trainer) => `${trainer} massages ${fighter}'s shoulders "for recovery purposes." The recovery is taking suspiciously long. Chef rolls his eyes so hard they almost detach.`,
  ],
  encourage: [
    (fighter, trainer) => `${trainer} kneels beside ${fighter}. "You've got this. I've seen what you can do. Now show everyone else." ${fighter} gets up. Tries again. Nails it.`,
    (fighter, trainer) => `${trainer}: "Remember why you're here. Remember who you're fighting for." ${fighter}'s eyes sharpen. The next rep is perfect. And the next. And the next.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// ROBOT FIGHT TEXT
// ══════════════════════════════════════════════════════════════
const FIGHT_MOVES = [
  { id: 'punch', name: 'Power Punch', icon: '👊', dmg: 20 },
  { id: 'kick', name: 'Spinning Kick', icon: '🦵', dmg: 20 },
  { id: 'uppercut', name: 'Uppercut', icon: '⬆️', dmg: 25 },
  { id: 'grab', name: 'Grapple Throw', icon: '🤼', dmg: 15 },
  { id: 'combo', name: 'Combo Strike', icon: '💥', dmg: 30 },
];

const FIGHT_TEXT = {
  attack: {
    punch: [
      (a, b) => `${a}'s robot drives a steel fist into ${b}'s chassis! CRUNCH! Sparks explode from the impact point. ${b}'s robot stumbles backward.`,
      (a, b) => `${a} jams both joysticks forward — the robot's right hook connects CLEAN with ${b}'s faceplate. The arena shakes.`,
      (a, b) => `A thunderous punch from ${a}'s robot catches ${b} square in the torso. Metal DENTS. The crowd roars.`,
    ],
    kick: [
      (a, b) => `${a}'s robot whips around with a spinning back kick! ${b}'s robot FLIES sideways, crashes into the ropes. Devastating.`,
      (a, b) => `The robot's leg arcs through the air like a wrecking ball — BOOM! ${b} takes the full force of ${a}'s spinning kick. Steel bends.`,
      (a, b) => `A brutal side kick from ${a}'s robot catches ${b} in the chest plate. The IMPACT echoes through the arena. ${b} stumbles back three steps.`,
      (a, b) => `${a}'s robot plants one foot and SWEEPS the other. ${b}'s legs are taken out — the robot hits the mat HARD. The crowd erupts.`,
    ],
    uppercut: [
      (a, b) => `${a} goes LOW then HIGH — the robot's fist rockets upward and catches ${b} under the jaw! ${b}'s robot leaves the GROUND for a full second.`,
      (a, b) => `UPPERCUT! ${a}'s robot crouches and LAUNCHES upward. ${b}'s head snaps back. The crowd is on their feet.`,
      (a, b) => `${a}'s robot drops into a crouch — then EXPLODES upward. The uppercut catches ${b} clean. Metal CRUNCHES. ${b}'s robot wobbles on one leg.`,
    ],
    grab: [
      (a, b) => `${a}'s robot GRABS ${b}'s robot by the arm, spins, and HURLS it across the arena! ${b} slides twenty feet, sparks trailing.`,
      (a, b) => `${a} locks ${b}'s robot in a grapple — then SLAMS it into the floor. The mat cracks. ${b}'s trainer winces.`,
    ],
    combo: [
      (a, b) => `${a} goes BERSERK! Left-right-left-UPPERCUT! A four-hit combo that sends ${b}'s robot reeling! Sparks, smoke, CHAOS!`,
      (a, b) => `${a}'s robot unleashes a brutal combo — punch, kick, grab, SLAM! ${b} can't keep up. The hits keep coming. The arena shakes with every impact.`,
    ],
  },
  counter: [
    (a, b, move) => `${b} READS the ${move.name}! ${pronouns(b).Sub} blocks, deflects, and retaliates with a counter-strike that sends ${a} stumbling!`,
    (a, b, move) => `${a} telegraphs the ${move.name}. ${b}'s trainer spots it: "DODGE LEFT!" The robot sidesteps and punishes with a clean jab.`,
    (a, b, move) => `${b}'s robot catches ${a}'s ${move.name.toLowerCase()} mid-swing. For one terrifying second, they're locked together — then ${b} SHOVES ${a} away and counters.`,
    (a, b, move) => `"COUNTER!" ${b}'s trainer screams. The robot parries ${a}'s attack and delivers a devastating riposte. The momentum SHIFTS.`,
  ],
  roundhouse: [
    (a, b) => `${a} goes for the ROUNDHOUSE KICK! The entire robot SPINS — 360 degrees of metal fury — CONTACT! ${b}'s robot is sent FLYING across the arena!`,
    (a, b) => `ROUNDHOUSE! ${a}'s robot pirouettes like a 500-pound ballerina of destruction. The kick connects with a sound that makes ${host()} cover his ears. ${b} is DOWN.`,
  ],
  roundhouseMiss: [
    (a) => `${a} attempts a roundhouse kick — the robot overrotates, momentum carries it INTO THE WALL! Chunks of arena crumble. ${a}'s trainer: "THAT WAS NOT THE PLAN!"`,
    (a) => `The roundhouse MISSES! ${a}'s robot spins helplessly, arms flailing, and collapses in a heap. The crowd goes "OHHH." That's gonna cost.`,
  ],
  trainerMoment: [
    (trainer, fighter, good) => good
      ? `${trainer} leans into the joysticks: "NOW! HIT ${pronouns(fighter).obj.toUpperCase()} NOW!" The timing is PERFECT. The trainer's read wins the exchange.`
      : `${trainer} fumbles the controls. "Left! No, RIGHT! No—" The robot walks into a punch. The trainer-fighter connection is crumbling.`,
  ],
  joystickBreak: [
    (trainer) => `CRACK! ${trainer}'s joystick SNAPS clean in half! "${host()}: "Oh, that's not good." The robot goes LIMP. Then ${trainer}'s fighter grabs the manual controls. "I'll do it MYSELF." Pure instinct from here.`,
    (trainer) => `${trainer} SLAMS the joystick in frustration — and it SHATTERS. Sparks. Smoke. The connection is GONE. The fighter is flying blind, operating on rage and muscle memory alone.`,
  ],
  knockout: [
    (winner, loser) => `THE FINAL BLOW! ${winner}'s robot delivers a devastating haymaker that sends ${loser}'s robot CRASHING to the mat! Sparks shower like fireworks. The arena echoes. IT. IS. OVER.`,
    (winner, loser) => `${winner}'s robot rears back and LAUNCHES forward with everything it has. ${loser}'s robot crumples like tinfoil, arms going limp, knees buckling, toppling backward in glorious slow motion. VICTORY.`,
    (winner, loser) => `One last combo. One last roar. ${winner}'s robot DISMANTLES ${loser}'s defenses and the final hit echoes through the arena. ${loser}'s robot hits the mat. The bell rings. ${winner} WINS.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// MOUNTAIN CLIMB TEXT
// ══════════════════════════════════════════════════════════════
const CLIMB_STAGES = [
  { id: 'base', name: 'Base Camp → Treeline', icon: '🌲', stats: ['physical', 'endurance'], waterLoss: 0.15 },
  { id: 'tree', name: 'Treeline → Ridge', icon: '⛰️', stats: ['mental', 'intuition'], waterLoss: 0.2 },
  { id: 'ridge', name: 'Ridge → Summit', icon: '🏔️', stats: ['boldness', 'physical'], waterLoss: 0.25 },
  { id: 'summit', name: 'Summit: Sasquatchanakwa', icon: '🦍', stats: ['physical', 'boldness'], waterLoss: 0 },
  { id: 'descent', name: 'Descent: Bonsai Run', icon: '🏃', stats: ['physical', 'strategic'], waterLoss: 0 },
];

const CLIMB_TEXT = {
  good: [
    (n, stage) => `${n} climbs steadily through the ${stage.name.split('→')[0]?.trim() || 'mountain'}. Water barely sloshes. Strong footing. Controlled breathing. The warrior's path rewards patience.`,
    (n, stage) => `${n} finds ${pronouns(n).posAdj} rhythm. Each step deliberate. Each handhold secure. The water cup stays level — barely a ripple. This is how a master climbs.`,
    (n, stage) => `${n} moves like ${pronouns(n).sub}'s done this before. Quick, efficient, zero wasted movement. The water doesn't even know it's on a mountain.`,
    (n, stage) => `The path is treacherous but ${n} reads it like a book. Left foot here, right hand there, cup balanced perfectly. ${pronouns(n).Sub} makes it look easy. It is NOT easy.`,
  ],
  bad: [
    (n, stage) => `${n} stumbles hard. Water splashes over the rim — a good amount gone. "NO!" ${pronouns(n).Sub} steadies ${pronouns(n).ref} but the damage is done.`,
    (n, stage) => `The terrain shifts under ${n}'s feet. ${pronouns(n).Sub} grabs a root but the cup tilts. Water pours down ${pronouns(n).posAdj} arm. Gone. Can't get it back.`,
    (n, stage) => `A loose rock gives way under ${n}. ${pronouns(n).Sub} catches ${pronouns(n).ref} but the water cup doesn't — it slams against a boulder and a quarter of the water is history.`,
    (n, stage) => `${n} misjudges a ledge and slips. The cup jerks sideways. Water arcs through the air in slow motion. ${pronouns(n).Sub} can only watch. "Come ON!"`,
  ],
  teamUp: [
    (a, b) => `${a} looks at ${b}. "Together?" ${b} hesitates. Then nods. "Together." They share the load. The climb gets easier. But the reward will be split.`,
    (a, b) => `${a} and ${b} lock arms to steady each other through the difficult section. Two climbers, one purpose. The question is: how long does the trust last?`,
  ],
  betrayal: [
    (betrayer, victim) => `${betrayer} reaches over and KNOCKS ${victim}'s water cup. Water explodes everywhere. ${victim}: "WHAT ARE YOU—" ${betrayer} is already sprinting ahead. The alliance is DEAD.`,
    (betrayer, victim) => `Without warning, ${betrayer} shoves ${victim} sideways. ${victim}'s water goes flying off the cliff. "Sorry. Nothing personal." It was VERY personal.`,
  ],
  sasquatch: [
    (n) => `Sasquatchanakwa emerges from behind the bonsai tree. Eight feet tall. Furious. ${n} sets down the water cup and raises ${pronouns(n).posAdj} fists. This is it.`,
    (n) => `The guardian of the summit blocks the path. Sasquatchanakwa roars, shaking snow from the peak. ${n} doesn't flinch. "I didn't climb all the way up here to lose to a MONKEY."`,
  ],
  sasquatchWin: [
    (n) => `${n} dodges Sasquatchanakwa's swing, rolls under the beast's arm, and GRABS the bonsai tree! The guardian roars in defeat. ${n} clutches the bonsai and starts running downhill. THE DESCENT BEGINS.`,
    (n) => `A flying kick connects with Sasquatchanakwa's chin! The beast stumbles. ${n} snatches the bonsai before the guardian can recover. "IT'S MINE!" Now ${pronouns(n).sub} just has to get it DOWN.`,
    (n) => `${n} fakes left, dives right, and rips the bonsai from its pedestal! Sasquatchanakwa ROARS but it's too late — ${n} is already sliding downhill, bonsai tucked under ${pronouns(n).posAdj} arm like a football.`,
  ],
  sasquatchLose: [
    (n) => `Sasquatchanakwa SWATS ${n} like a fly. ${pronouns(n).Sub} tumbles backward, rolling down the slope. The bonsai stays at the summit.`,
    (n) => `${n} charges. Sasquatchanakwa doesn't even move. One palm strike and ${n} is airborne, landing in a snowdrift twenty feet below. The bonsai is still up there.`,
    (n) => `${n} goes for the bonsai — and Sasquatchanakwa ROARS so loudly that ${n} freezes. A massive paw sweep sends ${pronouns(n).obj} tumbling. Not today.`,
  ],
  steal: [
    (thief, holder) => `${thief} AMBUSHES ${holder} on the descent! A flying tackle, a scramble, and ${thief} rips the bonsai from ${holder}'s hands! "MINE NOW!" ${holder}: "GET BACK HERE!"`,
    (thief, holder) => `${thief} appears from behind a rock and CLOTHESLINES ${holder}! The bonsai goes flying — ${thief} catches it midair and sprints. The hunter becomes the hunted!`,
    (thief, holder) => `${thief} slides down a side path and cuts off ${holder}. A grapple. A shove. The bonsai changes hands. ${holder} screams. ${thief} runs. The mountain echoes with chaos.`,
  ],
  stealFail: [
    (thief, holder) => `${thief} lunges for the bonsai — and ${holder} DODGES. "${pronouns(holder).Sub} saw you coming a mile away." ${thief} eats dirt. The bonsai holder keeps running.`,
    (thief, holder) => `${thief} tries to intercept ${holder} but slips on loose gravel. ${holder} hops over ${pronouns(thief).obj} without breaking stride. "Nice try!"`,
  ],
  descentSafe: [
    (n) => `${n} races downhill with the bonsai, dodging rocks and leaping over streams. Nobody catches ${pronouns(n).obj}. The finish line is in sight.`,
    (n) => `${n} sprints down the mountain like ${pronouns(n).posAdj} life depends on it. Every step is a gamble on loose terrain. But ${pronouns(n).sub} makes it.`,
  ],
};

const KITCHEN_TEXT = [
  (players) => `Meanwhile, ${players.join(' and ')} are stuck in the kitchen cooking "warrior's meal" — kung fu noodle soup with the seven most dangerous fishes known to man. It's not going well.`,
  (players) => `${players[0]} tries to chop the pufferfish. The pufferfish inflates. ${players[0]} screams. ${players.length > 1 ? `${players[1]} is not helping.` : 'Nobody is helping.'}`,
  (players) => `The jellyfish tentacle grabs ${players[0]}. ${players.length > 1 ? `${players[1]} considers helping. Considers.` : `${host()} takes a photo.`} "THIS IS NOT IN MY CONTRACT!"`,
];

const SPY_TEXT = {
  skip: [
    (spy) => `${spy} is suspiciously absent from training. "I went skateboarding." Nobody believes ${pronouns(spy).obj}. Nobody cares enough to investigate.`,
    (spy) => `Where's ${spy}? "Food court," ${pronouns(spy).sub} mumbles. ${pronouns(spy).Sub} returns later with mustard on ${pronouns(spy).posAdj} shirt as proof. It might be genuine.`,
  ],
  sabotage: [
    (spy, target) => `${spy} sidles up to ${target}. "Hey, watch out for their killer roundhouse kick." The intel is fake. The concern is fake. Everything about this interaction is fake.`,
    (spy, target) => `${spy} "accidentally" loosens a bolt on ${target}'s robot suit. "Oops. Was that important?" It was very important.`,
    (spy, target) => `${spy} whispers to ${target}: "Your partner is planning to sabotage you." It's a lie. But now ${target} is looking at ${pronouns(target).posAdj} partner differently.`,
  ],
  sabotageFail: [
    (spy, target) => `${spy} tries to mess with ${target}'s equipment, but ${target} catches ${pronouns(spy).obj} in the act. "What are you DOING?" ${spy}: "...Helping?"`,
    (spy, target) => `${spy}'s sabotage attempt backfires — ${pronouns(spy).sub} trips over ${pronouns(spy).posAdj} own geisha costume and falls face-first into the equipment rack. ${target} stares.`,
  ],
  climbDisrupt: [
    (spy, target) => `${spy} throws a rock near ${target}'s path. ${target} flinches, water sloshes. "Who threw that?!" ${spy} whistles innocently from behind a tree.`,
    (spy, target) => `${spy} tells ${target}: "Your partner is way ahead. You'll never catch up alone." It's a lie designed to break the team. Will it work?`,
  ],
};

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateCrouchingCourtney(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    phase1: { pairs: [], training: [], spy: null, spySabotages: [], events: [] },
    phase2: { bracket: [], fights: [], events: [] },
    phase3: { climbers: [], stages: [], winner: null, teams: [], betrayals: [], events: [] },
    kitchen: { players: [], events: [] },
    immunityWinner: null,
  };

  // ══════════════════════════════════════════════════════════════
  // SPY DETECTION — use active mole if exists
  // ══════════════════════════════════════════════════════════════
  let spy = null;
  if (gs.mole && active.includes(gs.mole)) {
    spy = gs.mole;
  }
  result.phase1.spy = spy;

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: TRAINING MONTAGE
  // ══════════════════════════════════════════════════════════════
  const trainees = active.filter(n => n !== spy);

  // Draft pick — highest strategic+mental picks first
  const draftOrder = [...trainees].sort((a, b) => {
    const aS = pStats(a), bS = pStats(b);
    return (bS.strategic + bS.mental) - (aS.strategic + aS.mental) + noise(2);
  });

  // Form pairs — first half are trainers, they pick fighters
  const numPairs = Math.floor(trainees.length / 2);
  const trainers = draftOrder.slice(0, numPairs);
  const available = draftOrder.slice(numPairs);
  const pairs = [];

  for (const trainer of trainers) {
    // Trainer picks fighter — prefer allies/friends, avoid enemies
    const ranked = available.map(f => ({
      name: f,
      score: getBond(trainer, f) * 0.5 + pStats(f).physical * 0.3 + noise(2),
    })).sort((a, b) => b.score - a.score);
    const fighter = ranked[0].name;
    available.splice(available.indexOf(fighter), 1);
    const bond = getBond(trainer, fighter);
    const tPr = pronouns(trainer);
    const fPr = pronouns(fighter);
    // Archetype-driven pick narration
    const tArch = arch(trainer);
    const fArch = arch(fighter);
    let pickText;
    if (bond > 3) {
      // Allies — varies by trainer archetype
      const allyTexts = {
        mastermind: [`${trainer} nods at ${fighter}. No words needed. They've been running this game together for weeks. The alliance picks itself.`],
        villain: [`${trainer} grins and points at ${fighter}. "You and me. We destroy everyone else." ${fighter} grins back. This was always the plan.`],
        hero: [`${trainer}: "I want the person I trust most in that robot." ${tPr.Sub} looks at ${fighter}. "That's you." ${fighter} stands taller.`],
        'loyal-soldier': [`${trainer} picks ${fighter} without hesitation. Loyalty runs deep between them. "I've got your back in there." ${fighter}: "I know you do."`],
        'social-butterfly': [`${trainer} beams. "${fighter}! We're gonna be an AMAZING team!" ${fighter} can't help but smile. The enthusiasm is infectious.`],
        showmancer: [`${trainer}'s eyes find ${fighter} across the room. The pick is a formality — they were always going to be together. ${host()} gags.`],
        schemer: [`${trainer} makes the strategic call. "${fighter}. You're strong where I'm weak." Cold, calculated, correct.`],
      };
      pickText = pick(allyTexts[tArch] || [`${trainer} and ${fighter} pair up naturally. The bond is obvious. The other castmates watch warily — that's a dangerous duo.`]);
    } else if (bond < -2) {
      // Enemies
      const enemyTexts = [
        `${trainer} picks... ${fighter}?! The room goes silent. ${fighter}: "You're joking." ${trainer}: "I want someone who fights ANGRY. And you look FURIOUS." ${fighter}: "You have no idea."`,
        `Everyone expects ${trainer} to avoid ${fighter}. Instead: "I pick ${fighter}." Gasps. "Keep your enemies closer," ${trainer} mutters. ${fighter} cracks ${fPr.posAdj} knuckles.`,
        `${trainer} points at ${fighter} with a smile that isn't friendly. "You. You're going to fight for me." ${fighter}: "I'm going to fight DESPITE you." ${trainer}: "Same difference."`,
      ];
      pickText = pick(enemyTexts);
    } else {
      // Neutral — personality-driven
      const neutralTexts = {
        'challenge-beast': [`${trainer} studies the remaining fighters and picks the strongest: ${fighter}. "Raw power. I can work with that." Pure strategy. Zero sentiment.`],
        hothead: [`${trainer}: "${fighter}. Let's GO." No analysis. No deliberation. Just impatience. ${fighter}: "...Okay then."`],
        floater: [`${trainer} waits until everyone else has been considered, then quietly picks ${fighter}. "You're good. We'll be fine." Neither seems thrilled. Neither seems worried.`],
        underdog: [`${trainer} surprises everyone by picking ${fighter}. "I know what it's like to be underestimated. Let's prove them wrong." ${fighter} nods slowly.`],
        wildcard: [`${trainer} closes ${tPr.posAdj} eyes, spins around, and points. It lands on ${fighter}. "DESTINY!" ${fighter}: "That's... not how this works." ${trainer}: "It is NOW."`],
        'chaos-agent': [`${trainer} grabs ${fighter} by the arm before anyone else can react. "You're mine." ${fighter}: "Do I get a choice?" ${trainer}: "No."`],
        goat: [`${trainer} looks confused by the whole process and eventually mumbles "${fighter}, I guess?" ${fighter}: "Inspiring leadership." ${trainer}: "Thanks! Wait, was that sarcasm?"`],
        'perceptive-player': [`${trainer} has been watching everyone all morning. "I pick ${fighter}." When asked why: "I noticed things. ${fighter} is better than ${fPr.sub} thinks." Cryptic but convincing.`],
      };
      pickText = pick(neutralTexts[tArch] || [
        `${trainer} considers the remaining fighters. "${fighter}." ${fighter} steps forward. They size each other up — not friends, not enemies. Just two players with a job to do.`,
        `${trainer} makes ${tPr.posAdj} pick: ${fighter}. "You look like you can handle pain." ${fighter}: "Was that a compliment?" ${trainer}: "It was a warning."`,
      ]);
    }
    pairs.push({ trainer, fighter, pickText });
  }

  // Odd player out joins as solo (trains alone)
  const soloPlayer = available.length ? available[0] : null;

  result.phase1.pairs = pairs;

  // Spy sabotage during training
  if (spy) {
    const spyPr = pronouns(spy);
    result.phase1.spySabotages.push({ type: 'skip', text: pick(SPY_TEXT.skip)(spy) });

    // Spy attempts 1-2 sabotages
    const sabotageTargets = pairs.slice(0, 2).map(p => pick([p.trainer, p.fighter]));
    for (const target of sabotageTargets) {
      const s = pStats(spy);
      const t = pStats(target);
      const success = s.strategic * 0.4 + noise(2) > t.intuition * 0.3 + noise(1);
      if (success) {
        result.phase1.spySabotages.push({ type: 'sabotage', target, success: true, text: pick(SPY_TEXT.sabotage)(spy, target) });
        popDelta(target, -1);
      } else {
        result.phase1.spySabotages.push({ type: 'sabotage', target, success: false, text: pick(SPY_TEXT.sabotageFail)(spy, target) });
        // Spy exposed slightly
        if (gs.moleSuspicion) gs.moleSuspicion[spy] = (gs.moleSuspicion[spy] || 0) + 0.5;
      }
    }
  }

  // Training beats
  for (const beat of TRAINING_BEATS) {
    const beatResults = [];
    for (const pair of pairs) {
      const fs = pStats(pair.fighter);
      const ts = pStats(pair.trainer);
      const bond = getBond(pair.trainer, pair.fighter);
      const isShowmance = gs.showmances?.some(sm =>
        (sm.a === pair.trainer && sm.b === pair.fighter) || (sm.a === pair.fighter && sm.b === pair.trainer));

      // Fighter performance
      const fighterScore = fs[beat.stats[0]] * 0.4 + fs[beat.stats[1]] * 0.3 + noise(2);
      // Trainer effectiveness — bond matters
      const trainerScore = ts.strategic * 0.3 + ts.mental * 0.2 + (bond > 0 ? bond * 0.2 : bond * 0.1) + noise(1);
      // Sabotage penalty
      const sabotaged = result.phase1.spySabotages.some(s => s.success && (s.target === pair.fighter || s.target === pair.trainer));
      const sabPenalty = sabotaged ? -1.5 : 0;

      const total = Math.max(0, fighterScore + trainerScore + sabPenalty);

      // Training style choice: harsh (high risk/reward) vs supportive (safe)
      const trainerArch = arch(pair.trainer);
      const trainerTemp = ts.temperament;
      const goesHarsh = ['villain', 'mastermind', 'schemer', 'hothead'].includes(trainerArch) ||
        trainerTemp <= 4 || bond < -1 || (ts.boldness >= 7 && Math.random() < 0.4);

      let text, style, finalScore;
      if (isShowmance && Math.random() < 0.35) {
        style = 'showmance';
        finalScore = Math.max(0, total * 0.7); // distracted = lower output
        text = pick(TRAINING_TEXT.showmance)(pair.fighter, pair.trainer);
        addBond(pair.fighter, pair.trainer, 1);
      } else if (goesHarsh) {
        // Harsh training: higher ceiling but can fail spectacularly
        const harshRoll = ts.strategic * 0.3 + ts.boldness * 0.2 + noise(3);
        if (harshRoll > 4) {
          style = 'harsh-success';
          finalScore = Math.max(0, total * 1.4); // big payoff
          const beatTexts = {
            wax: [
              (f, t) => `${t} makes ${f} wax EVERY vehicle on the lot. All 47 of them. By the end, ${f}'s arms are screaming — but ${pronouns(f).posAdj} form is flawless.`,
              (f, t) => `${t} dumps cold water on ${f} mid-rep. "FASTER!" ${f} grits ${pronouns(f).posAdj} teeth and doubles the pace. The fury becomes fuel.`,
            ],
            pushup: [
              (f, t) => `${t} drops a MOOSE on ${f}'s back during push-ups. ${f} somehow keeps going. The moose looks impressed. ${t}: "Now THAT'S a warrior."`,
              (f, t) => `${t} stands ON TOP of ${f} while ${pronouns(f).sub} does push-ups. Then puts a rock on ${pronouns(t).posAdj} own head. "If I can balance, you can push." Brutal. Effective.`,
            ],
            punch: [
              (f, t) => `${t} tapes a photo of ${f}'s worst enemy to the punching bag. ${f} sees it. Something snaps. The bag EXPLODES. ${t}: "Now you're ready."`,
              (f, t) => `${t} puts BEES in ${f}'s lunch as motivation. "Float like a butterfly, sting like a bee." ${f} gets stung 14 times. But ${pronouns(f).posAdj} next punch goes THROUGH the bag.`,
            ],
          };
          text = pick(beatTexts[beat.id] || TRAINING_TEXT.abuse)(pair.fighter, pair.trainer);
          addBond(pair.fighter, pair.trainer, -1);
        } else {
          style = 'harsh-fail';
          finalScore = Math.max(0, total * 0.5); // backfired
          const failTexts = [
            (f, t) => `${t}'s harsh methods backfire completely. ${f} snaps: "ENOUGH!" and storms off the mat. ${t}: "Come back here!" ${f}: "MAKE ME." Training session: ruined.`,
            (f, t) => `${t} pushes too far. ${f} collapses, exhausted and angry. "You're supposed to be TRAINING me, not trying to KILL me." ${t} has no response. The damage is done.`,
            (f, t) => `${t} screams at ${f} to keep going. ${f} tries. And tries. And drops. "I can't." ${t}: "Then you're WEAK." ${f}'s eyes go cold. The motivation died. So did the bond.`,
            (f, t) => `${t}'s idea of "motivation" involves hot sauce, fire ants, and a whistle. ${f} lasts thirty seconds before rebellion. Zero progress. Maximum resentment.`,
          ];
          text = pick(failTexts)(pair.fighter, pair.trainer);
          addBond(pair.fighter, pair.trainer, -2);
          popDelta(pair.trainer, -1);
        }
      } else {
        // Supportive training: consistent, safe
        style = 'supportive';
        finalScore = Math.max(0, total);
        const supportTexts = {
          wax: [
            (f, t) => `${t} demonstrates the wax technique slowly. ${f} copies it. Better each time. "Good. Again." Quiet discipline. Steady progress.`,
            (f, t) => `${t} works alongside ${f}, waxing the cars together. "Match my rhythm." They fall into sync. Not flashy, but solid.`,
          ],
          pushup: [
            (f, t) => `${t} counts reps while ${f} pushes through. "Ten more. You've got this." ${f} isn't sure ${pronouns(f).sub} has this. ${pronouns(f).Sub} does it anyway.`,
            (f, t) => `${t} adjusts ${f}'s form mid-rep. "Wider stance. Engage the core." The next push-up is twice as effective.`,
          ],
          punch: [
            (f, t) => `${t} holds the bag steady while ${f} works combos. Left-right-left. "Harder on the right." The punches sharpen. The technique clicks.`,
            (f, t) => `${t}: "Don't punch AT the bag. Punch THROUGH it." ${f} adjusts. The next hit sends the bag swinging. ${t} nods. Progress.`,
          ],
        };
        text = pick(supportTexts[beat.id] || TRAINING_TEXT.good)(pair.fighter, pair.trainer);
        if (bond > 2) addBond(pair.fighter, pair.trainer, 1);
      }

      finalScore = Math.round(finalScore * 10) / 10;
      beatResults.push({ fighter: pair.fighter, trainer: pair.trainer, beat: beat.id, score: finalScore, text, style });
      // Training does NOT add to chalMemberScores — it only feeds fighterPower for the robot fight
    }

    // Solo player trains alone
    if (soloPlayer) {
      const ss = pStats(soloPlayer);
      const soloScore = ss[beat.stats[0]] * 0.3 + ss[beat.stats[1]] * 0.2 + noise(2);
      beatResults.push({ fighter: soloPlayer, trainer: null, beat: beat.id, score: Math.round(soloScore * 10) / 10,
        text: `${soloPlayer} trains alone. No trainer. No partner. Just ${pronouns(soloPlayer).obj} and the punching bag. ${pronouns(soloPlayer).Sub} hits it harder than anyone expected.` });
      // Training does NOT add to chalMemberScores — only feeds fighterPower
    }

    result.phase1.training.push(beatResults);

    // ── Per-beat social events ──
    if (!result.phase1.beatEvents) result.phase1.beatEvents = [];
    const beatSocial = [];

    // Each beat ALWAYS generates at least 1 social event
    const scores = beatResults.map(r => ({ name: r.fighter, trainer: r.trainer, score: r.score, style: r.style })).sort((a, b) => b.score - a.score);

    if (beat.id === 'wax') {
      // Showmance check
      for (const pair of pairs) {
        const isShowmance = gs.showmances?.some(sm => (sm.a === pair.trainer && sm.b === pair.fighter) || (sm.a === pair.fighter && sm.b === pair.trainer));
        if (isShowmance) {
          beatSocial.push({ type: 'showmance', players: [pair.trainer, pair.fighter],
            text: pick([
              `${pair.trainer} and ${pair.fighter} linger after waxing. The eye contact is... intense. ${host()} throws a sponge at them. "FOCUS!"`,
              `${pair.fighter} catches ${pair.trainer} watching ${pronouns(pair.fighter).obj} work. "Like what you see?" ${pair.trainer} turns red. The other pairs snicker.`,
            ])
          });
          addBond(pair.trainer, pair.fighter, 1);
          break;
        }
      }
      // Guaranteed: trainer comparison
      if (scores.length >= 2) {
        const top = scores[0], bot = scores[scores.length - 1];
        beatSocial.push({ type: 'rivalry', players: [top.trainer || top.name, bot.trainer || bot.name],
          text: `${top.trainer || top.name} glances at ${bot.trainer || bot.name}'s station. ${top.name}'s cars gleam. ${bot.name}'s... don't. The difference is already showing.`
        });
      }
    } else if (beat.id === 'pushup') {
      // Guaranteed: rivalry between best and worst trainers
      if (scores.length >= 2 && scores[0].trainer && scores[scores.length - 1].trainer) {
        beatSocial.push({ type: 'rivalry', players: [scores[0].trainer, scores[scores.length - 1].trainer],
          text: `${scores[0].trainer} smirks at ${scores[scores.length - 1].trainer} across the dojo. "${scores[0].name} crushed it. How's ${scores[scores.length - 1].name} doing?" The taunt lands.`
        });
        addBond(scores[0].trainer, scores[scores.length - 1].trainer, -1);
      }
      // Guaranteed: exhaustion bonding between two fighters
      if (scores.length >= 2) {
        const a = scores[Math.floor(scores.length / 2)].name;
        const b = scores[Math.floor(scores.length / 2) - 1]?.name || scores[0].name;
        if (a !== b) {
          beatSocial.push({ type: 'bond', players: [a, b],
            text: pick([
              `${a} and ${b} collapse side by side after push-ups. Gasping. Groaning. "That was... brutal." "Yeah." A nod of mutual suffering.`,
              `${a} helps ${b} up after the last rep. "You good?" "No. But thanks for asking." Shared agony creates unexpected bonds.`,
            ])
          });
          addBond(a, b, 1);
        }
      }
    } else if (beat.id === 'punch') {
      // Guaranteed: best performer gets recognition
      if (scores.length) {
        const best = scores[0];
        beatSocial.push({ type: 'respect', players: [best.name, best.trainer || best.name],
          text: pick([
            `The other pairs stop to watch ${best.name}. The power is undeniable. ${best.trainer ? `${best.trainer} stands behind ${pronouns(best.name).obj}, arms crossed, quietly proud. "That's MY fighter."` : `${best.name} doesn't need a trainer to be dangerous.`} The dojo takes notice.`,
            `${best.name} hits the bag so hard it swings into the ceiling. The room falls silent. Then ${host()}: "...Okay, ${best.name} is scary." Everyone agrees.`,
          ])
        });
        popDelta(best.name, 1);
      }
      // Harsh fail drama
      const harshFails = scores.filter(r => r.style === 'harsh-fail');
      if (harshFails.length) {
        const fail = harshFails[0];
        beatSocial.push({ type: 'blame', players: [fail.name, fail.trainer || fail.name],
          text: `${fail.name} sits in the corner nursing ${pronouns(fail.name).posAdj} bruises. ${fail.trainer ? `${fail.trainer}'s harsh methods left marks — physical AND emotional.` : 'The solo training took its toll.'} The anger is simmering.`
        });
      }
      // Fighter-to-fighter bond
      if (scores.length >= 2) {
        const [a, b] = [scores[0].name, scores[scores.length - 1].name];
        beatSocial.push({ type: 'bond', players: [a, b],
          text: `${a} and ${b} spar lightly after the session. "You hit hard." "So do you." A warrior's respect forming between rivals.`
        });
        addBond(a, b, 1);
      }
    }

    result.phase1.beatEvents.push(beatSocial);
  }

  // Training camp events
  for (const pair of pairs) {
    ep.campEvents[campKey].post.push({
      text: `${pair.trainer} trained ${pair.fighter} for the kung fu robot fight!`,
      players: [pair.trainer, pair.fighter], badgeText: 'TRAINING', badgeClass: 'amber', tag: 'crouching-courtney',
    });
  }

  // Social events are now generated per-beat inside the training loop (stored in result.phase1.beatEvents)

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: ROBOT FIGHT
  // ══════════════════════════════════════════════════════════════
  // Calculate fighter power from training
  const fighterPower = {};
  for (const pair of pairs) {
    const trainingTotal = result.phase1.training.reduce((sum, beat) => {
      const r = beat.find(b => b.fighter === pair.fighter);
      return sum + (r ? r.score : 0);
    }, 0);
    fighterPower[pair.fighter] = trainingTotal;
  }
  if (soloPlayer) {
    fighterPower[soloPlayer] = result.phase1.training.reduce((sum, beat) => {
      const r = beat.find(b => b.fighter === soloPlayer);
      return sum + (r ? r.score : 0);
    }, 0);
  }

  // Build bracket — all fighters compete in round-robin
  const fighters = pairs.map(p => p.fighter);
  if (soloPlayer) fighters.push(soloPlayer);

  const bracket = [...fighters].sort(() => Math.random() - 0.5);
  result.phase2.bracket = bracket;

  // Generate all matchups — round-robin for 3 fighters, bracket for 4+
  const matchups = [];
  if (bracket.length <= 3) {
    // Round-robin: everyone fights everyone
    for (let i = 0; i < bracket.length; i++) {
      for (let j = i + 1; j < bracket.length; j++) {
        matchups.push([bracket[i], bracket[j]]);
      }
    }
  } else {
    // Bracket: pair sequentially
    for (let i = 0; i < bracket.length - 1; i += 2) {
      matchups.push([bracket[i], bracket[i + 1]]);
    }
  }

  const fightResults = [];
  const fightWins = {};
  bracket.forEach(n => { fightWins[n] = 0; });
  for (const [aName, bName] of matchups) {
    const aS = pStats(aName), bS = pStats(bName);
    const aTrainer = pairs.find(p => p.fighter === aName)?.trainer;
    const bTrainer = pairs.find(p => p.fighter === bName)?.trainer;

    const exchanges = [];
    let aHP = 100, bHP = 100;
    let aJoystickBroken = false, bJoystickBroken = false;

    for (let ex = 0; ex < 3; ex++) {
      // Fighter power
      let aPow = aS.physical * 0.3 + aS.boldness * 0.2 + (fighterPower[aName] || 0) * 0.2 + noise(2);
      let bPow = bS.physical * 0.3 + bS.boldness * 0.2 + (fighterPower[bName] || 0) * 0.2 + noise(2);

      // Trainer control
      let aTrainerText = '', bTrainerText = '';
      if (aTrainer && !aJoystickBroken) {
        const tS = pStats(aTrainer);
        const trainerBonus = tS.strategic * 0.2 + tS.mental * 0.15 + getBond(aTrainer, aName) * 0.05;
        aPow += trainerBonus;
        if (Math.random() < 0.3) aTrainerText = pick(FIGHT_TEXT.trainerMoment)(aTrainer, aName, trainerBonus > 1);
      }
      if (bTrainer && !bJoystickBroken) {
        const tS = pStats(bTrainer);
        const trainerBonus = tS.strategic * 0.2 + tS.mental * 0.15 + getBond(bTrainer, bName) * 0.05;
        bPow += trainerBonus;
        if (Math.random() < 0.3) bTrainerText = pick(FIGHT_TEXT.trainerMoment)(bTrainer, bName, trainerBonus > 1);
      }

      // Pick a move for the attacker
      const move = pick(FIGHT_MOVES);
      const aRoundhouse = aS.boldness >= 7 && Math.random() < 0.25;
      const bRoundhouse = bS.boldness >= 7 && Math.random() < 0.25;

      let text, exWinner, moveUsed = move, dmgDealt = 0;
      if (aRoundhouse) {
        moveUsed = { id: 'roundhouse', name: 'Roundhouse Kick', icon: '🌀', dmg: 30 };
        if (aPow + noise(2) > bPow) {
          text = pick(FIGHT_TEXT.roundhouse)(aName, bName);
          bHP -= 30; dmgDealt = 30;
          exWinner = aName;
        } else {
          text = pick(FIGHT_TEXT.roundhouseMiss)(aName);
          aHP -= 15; dmgDealt = -15;
          exWinner = bName;
        }
      } else if (bRoundhouse) {
        moveUsed = { id: 'roundhouse', name: 'Roundhouse Kick', icon: '🌀', dmg: 30 };
        if (bPow + noise(2) > aPow) {
          text = pick(FIGHT_TEXT.roundhouse)(bName, aName);
          aHP -= 30; dmgDealt = 30;
          exWinner = bName;
        } else {
          text = pick(FIGHT_TEXT.roundhouseMiss)(bName);
          bHP -= 15; dmgDealt = -15;
          exWinner = aName;
        }
      } else if (aPow > bPow + 1) {
        const moveTexts = FIGHT_TEXT.attack[move.id] || FIGHT_TEXT.attack.punch;
        text = pick(moveTexts)(aName, bName);
        bHP -= move.dmg; dmgDealt = move.dmg;
        exWinner = aName;
      } else if (bPow > aPow + 1) {
        const moveTexts = FIGHT_TEXT.attack[move.id] || FIGHT_TEXT.attack.punch;
        text = pick(moveTexts)(bName, aName);
        aHP -= move.dmg; dmgDealt = move.dmg;
        exWinner = bName;
      } else {
        text = pick(FIGHT_TEXT.counter)(aName, bName, move);
        const dmg = 10;
        if (aPow > bPow) { bHP -= dmg; exWinner = aName; dmgDealt = dmg; }
        else { aHP -= dmg; exWinner = bName; dmgDealt = dmg; }
      }

      // Add trainer moment text
      const trainerText = exWinner === aName ? aTrainerText : bTrainerText;
      if (trainerText) text += ' ' + trainerText;

      // Joystick break check
      if (aTrainer && !aJoystickBroken && Math.random() < 0.1) {
        aJoystickBroken = true;
        text += ' ' + pick(FIGHT_TEXT.joystickBreak)(aTrainer);
      }
      if (bTrainer && !bJoystickBroken && Math.random() < 0.1) {
        bJoystickBroken = true;
        text += ' ' + pick(FIGHT_TEXT.joystickBreak)(bTrainer);
      }

      exchanges.push({ exchange: ex + 1, winner: exWinner, text, aHP, bHP, move: moveUsed, dmg: dmgDealt, attacker: exWinner });
    }

    const winner = aHP >= bHP ? aName : bName;
    const loser = winner === aName ? bName : aName;
    const koText = pick(FIGHT_TEXT.knockout)(winner, loser);

    // Per-fight social events — GUARANTEED at least 1
    const fightSocial = [];
    const winTrainerName = winner === aName ? aTrainer : bTrainer;
    const loseTrainerName = winner === aName ? bTrainer : aTrainer;

    // Guaranteed: trainer reaction to the win
    if (winTrainerName) {
      fightSocial.push({ type: 'bond', players: [winTrainerName, winner],
        text: pick([
          `${winTrainerName} pumps ${pronouns(winTrainerName).posAdj} fist. "THAT'S my fighter! That's what we trained for!" The pride is genuine.`,
          `${winTrainerName} grabs ${winner} in a bear hug. "You were INCREDIBLE out there." The training paid off.`,
          `${winTrainerName} is beaming. "I KNEW the training would pay off. ${winner} was unstoppable." The fighter-trainer bond is cemented.`,
        ])
      });
      addBond(winTrainerName, winner, 1);
    }
    // Close fight respect (guaranteed if close)
    if (Math.abs(aHP - bHP) < 25) {
      fightSocial.push({ type: 'respect', players: [winner, loser],
        text: pick([
          `${winner} extends a hand to ${loser}. "Good fight." ${loser} takes it. The grip is firm. Respect between warriors.`,
          `${winner} and ${loser} bump fists after the match. No words needed. They both know it could have gone either way.`,
        ])
      });
      addBond(winner, loser, 1);
    }
    // Showmance comfort for loser
    const showmancePair = gs.showmances?.find(sm =>
      (sm.a === loser && active.includes(sm.b)) || (sm.b === loser && active.includes(sm.a)));
    if (showmancePair) {
      const comforter = showmancePair.a === loser ? showmancePair.b : showmancePair.a;
      if (active.includes(comforter)) {
        fightSocial.push({ type: 'showmance', players: [comforter, loser],
          text: `${comforter} finds ${loser} backstage after the loss. "Hey. You were brave out there." ${loser}: "I LOST." ${comforter}: "You fought. That's what matters." A quiet moment.` });
        addBond(comforter, loser, 1);
      }
    }
    // Losing trainer frustration (if no showmance comfort)
    if (!showmancePair && loseTrainerName && getBond(loser, loseTrainerName) < 3) {
      fightSocial.push({ type: 'blame', players: [loser, loseTrainerName],
        text: pick([
          `${loser} glares at ${loseTrainerName}. "Great coaching." The sarcasm could cut steel. ${loseTrainerName} says nothing. What can you say?`,
          `${loseTrainerName} tries to console ${loser}. "We'll do better next—" ${loser}: "There IS no next. I just got destroyed." The silence is heavy.`,
        ])
      });
      addBond(loser, loseTrainerName, -1);
    }

    fightResults.push({
      fighters: [aName, bName], trainers: [aTrainer, bTrainer],
      exchanges, winner, loser, koText,
      aHP: Math.max(0, aHP), bHP: Math.max(0, bHP),
      socialEvents: fightSocial,
    });
    fightWins[winner] = (fightWins[winner] || 0) + 1;

    ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + 5;
    ep.chalMemberScores[loser] = (ep.chalMemberScores[loser] || 0) + 1;
    addBond(winner, loser, -1);
    popDelta(winner, 1);

    ep.campEvents[campKey].post.push({
      text: `${winner} defeated ${loser} in the robot kung fu fight!`,
      players: [winner, loser], badgeText: 'FIGHT', badgeClass: 'red', tag: 'crouching-courtney',
    });
  }

  result.phase2.fights = fightResults;

  // Rank fighters by wins
  const fightRanked = [...bracket].sort((a, b) => (fightWins[b] || 0) - (fightWins[a] || 0));

  // ── BETWEEN-PHASE SOCIAL EVENTS: Fight → Climb ──
  // Trainer blame — fighter lost all fights, blames trainer
  for (const fight of fightResults) {
    const loserTrainer = pairs.find(p => p.fighter === fight.loser)?.trainer;
    if (loserTrainer && fightWins[fight.loser] === 0 && getBond(fight.loser, loserTrainer) < 3) {
      result.phase2.events.push({ type: 'blame', players: [fight.loser, loserTrainer],
        text: pick([
          `${fight.loser} rounds on ${loserTrainer} backstage. "Your training was USELESS! I got destroyed out there!" ${loserTrainer}: "Don't blame me for your lack of—" ${fight.loser}: "LACK OF WHAT?!" The tension is volcanic.`,
          `${fight.loser} won't even look at ${loserTrainer}. "We're done. Whatever this partnership was, it's OVER." ${loserTrainer} reaches out. ${fight.loser} walks away. The bond is broken.`,
        ])
      });
      addBond(fight.loser, loserTrainer, -2);
      ep.campEvents[campKey].post.push({ text: `${fight.loser} blamed ${loserTrainer} for the fight loss!`, players: [fight.loser, loserTrainer], badgeText: 'BLAME', badgeClass: 'red', tag: 'crouching-courtney' });
      break;
    }
  }
  // Respect between opponents
  for (const fight of fightResults) {
    if (Math.abs(fight.aHP - fight.bHP) < 20 && Math.random() < 0.4) {
      result.phase2.events.push({ type: 'respect', players: [fight.fighters[0], fight.fighters[1]],
        text: `${fight.winner} extends a hand to ${fight.loser}. "Good fight." ${fight.loser} takes it. The grip is firm. A rivalry born from respect. The mountain awaits them both.`
      });
      addBond(fight.winner, fight.loser, 1);
      break;
    }
  }
  // Pre-climb paranoia
  if (active.length >= 4 && Math.random() < 0.5) {
    const paranoid = pick(active);
    const suspect = pick(active.filter(n => n !== paranoid));
    result.phase2.events.push({ type: 'paranoia', players: [paranoid, suspect],
      text: `${paranoid} pulls someone aside before the climb. "Watch ${suspect} on the mountain. I don't trust ${pronouns(suspect).obj}. Not after what I saw during the fights." Seeds of doubt. Planted and growing.`
    });
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: MOUNTAIN CLIMB — EVERYONE climbs, fight winners get advantage
  // ══════════════════════════════════════════════════════════════
  const climbers = [...active];
  result.phase3.climbers = climbers;

  // Fight champion (most wins) + their trainer get advantage — lighter water cup
  const fightChampion = fightRanked.length ? fightRanked[0] : climbers[0];
  const championTrainer = pairs.find(p => p.fighter === fightChampion)?.trainer;
  result.phase2.champion = fightChampion;
  result.phase2.championTrainer = championTrainer;
  const advantagePlayers = [fightChampion];
  if (championTrainer) advantagePlayers.push(championTrainer);
  ep.campEvents[campKey].post.push({
    text: `${fightChampion}${championTrainer ? ` and trainer ${championTrainer}` : ''} dominated the robot fights and earn a head start on the mountain!`,
    players: advantagePlayers, badgeText: 'CHAMPION', badgeClass: 'gold', tag: 'crouching-courtney',
  });

  const waterLevels = {};
  climbers.forEach(n => { waterLevels[n] = 100; });
  if (fightChampion) waterLevels[fightChampion] = 110;
  if (championTrainer) waterLevels[championTrainer] = 110;

  // Teams tracking
  const teams = {};
  climbers.forEach(n => { teams[n] = null; }); // null = solo

  // ── ASCENT (Stages 0-2): climb up carrying water ──
  for (let si = 0; si < 3; si++) {
    const stage = CLIMB_STAGES[si];
    const stageResults = [];

    // Cooperation check at stage 1
    if (si === 1 && climbers.filter(n => waterLevels[n] > 0).length >= 2) {
      const eligible = climbers.filter(n => waterLevels[n] > 0 && !teams[n]);
      for (let i = 0; i < eligible.length - 1; i += 2) {
        const a = eligible[i], b = eligible[i + 1];
        const bond = getBond(a, b);
        const teamChance = pStats(a).loyalty * 0.1 + pStats(b).loyalty * 0.1 + (bond > 0 ? bond * 0.1 : 0) + noise(1);
        if (teamChance > 0.5) {
          teams[a] = b; teams[b] = a;
          result.phase3.teams.push({ a, b, text: pick(CLIMB_TEXT.teamUp)(a, b) });
          addBond(a, b, 2);
          ep.campEvents[campKey].post.push({ text: `${a} and ${b} teamed up on the mountain!`, players: [a, b], badgeText: 'TEAM UP', badgeClass: 'blue', tag: 'crouching-courtney' });
        }
      }
    }

    // Betrayal check at stage 2
    if (si === 2) {
      for (const name of climbers) {
        const partner = teams[name];
        if (!partner || waterLevels[name] <= 0) continue;
        const s = pStats(name); const a = arch(name);
        const betrayChance = s.strategic * 0.05 + s.boldness * 0.05 + (10 - s.loyalty) * 0.05 +
          (['villain', 'schemer', 'mastermind'].includes(a) ? 0.15 : 0) + noise(0.3);
        if (betrayChance > 0.5) {
          waterLevels[partner] = Math.max(0, waterLevels[partner] - 35);
          teams[name] = null; teams[partner] = null;
          addBond(name, partner, -4); popDelta(name, -2);
          result.phase3.betrayals.push({ betrayer: name, victim: partner, text: pick(CLIMB_TEXT.betrayal)(name, partner) });
          ep.campEvents[campKey].post.push({ text: `${name} betrayed ${partner} on the mountain!`, players: [name, partner], badgeText: 'BETRAYAL', badgeClass: 'red', tag: 'crouching-courtney' });
          break;
        }
      }
    }

    // Spy disruption
    if (spy && si > 0) {
      const spyTarget = pick(climbers.filter(n => n !== spy && waterLevels[n] > 0));
      if (spyTarget && pStats(spy).strategic * 0.3 + noise(2) > pStats(spyTarget).intuition * 0.3 + noise(1)) {
        result.phase1.spySabotages.push({ type: 'climb', target: spyTarget, success: true, text: pick(SPY_TEXT.climbDisrupt)(spy, spyTarget) });
        waterLevels[spyTarget] = Math.max(0, waterLevels[spyTarget] - 8);
      }
    }

    // Climb each player
    for (const name of climbers) {
      if (waterLevels[name] <= 0) { stageResults.push({ name, eliminated: true, text: `${name}'s water cup is empty. The climb is over for ${pronouns(name).obj}.`, water: 0 }); continue; }
      const s = pStats(name);
      const climbScore = s[stage.stats[0]] * 0.3 + s[stage.stats[1]] * 0.3 + noise(2);
      const isTeamed = teams[name] != null;
      const teamBonus = isTeamed ? 1.5 : 0;
      const waterLost = Math.max(0, (10 - climbScore - teamBonus) * stage.waterLoss * 25);
      waterLevels[name] = Math.max(0, waterLevels[name] - waterLost);
      if (waterLevels[name] <= 0) {
        // Water ran out during this stage — eliminated with the bad climb text
        const failText = pick(CLIMB_TEXT.bad)(name, stage) + ` The last drop spills. ${name}'s cup is empty. The climb is over.`;
        stageResults.push({ name, eliminated: true, text: failText, water: 0 });
      } else {
        const text = climbScore > 5 ? pick(CLIMB_TEXT.good)(name, stage) : pick(CLIMB_TEXT.bad)(name, stage);
        stageResults.push({ name, water: Math.round(waterLevels[name]), text, isTeamed });
      }
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + climbScore * 0.3;
    }
    result.phase3.stages.push(stageResults);
  }

  // ── SUMMIT (Stage 3): Sasquatchanakwa fight — ONLY ONE player grabs the bonsai ──
  const summitStage = CLIMB_STAGES[3];
  const summitResults = [];
  // Sort climbers by water level — highest water gets first attempt
  const summitOrder = climbers.filter(n => waterLevels[n] > 0 || !result.phase3.stages.some(stg => stg.some(r => r.name === n && r.eliminated)))
    .sort((a, b) => waterLevels[b] - waterLevels[a]);
  let bonsaiHolder = null;
  for (const name of summitOrder) {
    const s = pStats(name);
    const waterBonus = waterLevels[name] > 50 ? 1.5 : waterLevels[name] > 20 ? 0 : -2;
    const power = s[summitStage.stats[0]] * 0.4 + s[summitStage.stats[1]] * 0.3 + waterBonus + noise(2);
    const threshold = 4.5 + noise(1);
    let text = pick(CLIMB_TEXT.sasquatch)(name);
    if (power > threshold) {
      if (!bonsaiHolder) {
        // First to beat Sasquatchanakwa — GRABS the bonsai
        text += ' ' + pick(CLIMB_TEXT.sasquatchWin)(name);
        bonsaiHolder = name;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 8;
      } else {
        // Beat the guardian but bonsai already taken — can chase on descent
        text += ` ${name} fights past Sasquatchanakwa — but the bonsai is already gone! ${bonsaiHolder} has it. Time to chase.`;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
      }
      summitResults.push({ name, success: true, text, water: waterLevels[name] });
    } else {
      text += ' ' + pick(CLIMB_TEXT.sasquatchLose)(name);
      summitResults.push({ name, success: false, text, water: waterLevels[name] });
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
    }
  }
  // If nobody beat Sasquatchanakwa, the player with highest water gets a second chance
  if (!bonsaiHolder && summitOrder.length) {
    bonsaiHolder = summitOrder[0];
    summitResults.push({ name: bonsaiHolder, success: true, water: waterLevels[bonsaiHolder],
      text: `${bonsaiHolder} gets back up. One more try. One final effort. ${pronouns(bonsaiHolder).Sub} barely dodges the guardian and GRABS the bonsai! Desperation wins!` });
  }
  result.phase3.stages.push(summitResults);
  result.phase3.bonsaiHolder = bonsaiHolder;

  // ── DESCENT (Stage 4): Bonsai Run — others try to steal ──
  const descentResults = [];
  if (bonsaiHolder) {
    // Only players who ALSO beat Sasquatchanakwa can chase the bonsai holder
    const summitPassers = summitResults.filter(r => r.success).map(r => r.name);
    const chasers = summitPassers.filter(n => n !== bonsaiHolder);
    let currentHolder = bonsaiHolder;
    // Each chaser gets one steal attempt
    for (const chaser of chasers) {
      const cS = pStats(chaser); const hS = pStats(currentHolder);
      // Steal = ambush aggression vs holder's awareness. Higher noise = more upsets possible.
      const stealPower = cS.physical * 0.25 + cS.boldness * 0.25 + cS.strategic * 0.15 + noise(3);
      const holdPower = hS.intuition * 0.25 + hS.physical * 0.2 + hS.endurance * 0.15 + noise(3);
      if (stealPower > holdPower) {
        const text = pick(CLIMB_TEXT.steal)(chaser, currentHolder);
        descentResults.push({ name: chaser, type: 'steal', success: true, from: currentHolder, text });
        addBond(chaser, currentHolder, -3);
        popDelta(chaser, -1);
        ep.campEvents[campKey].post.push({ text: `${chaser} stole the bonsai from ${currentHolder} on the descent!`, players: [chaser, currentHolder], badgeText: 'STOLEN!', badgeClass: 'red', tag: 'crouching-courtney' });
        currentHolder = chaser;
      } else {
        const text = pick(CLIMB_TEXT.stealFail)(chaser, currentHolder);
        descentResults.push({ name: chaser, type: 'steal', success: false, from: currentHolder, text });
      }
    }
    // Final descent — holder reaches the bottom
    descentResults.push({ name: currentHolder, type: 'finish', text: pick(CLIMB_TEXT.descentSafe)(currentHolder) });
    result.phase3.finalHolder = currentHolder;
    result.phase3.winner = currentHolder;
    result.immunityWinner = currentHolder;
    // Bonsai retrieval bonus — ensures immunity winner ranks #1 in chalMemberScores
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== currentHolder).map(([, s]) => s));
    if ((ep.chalMemberScores[currentHolder] || 0) <= maxOther) {
      ep.chalMemberScores[currentHolder] = maxOther + 1;
    }
  } else {
    result.phase3.winner = climbers[0];
    result.immunityWinner = climbers[0];
  }
  result.phase3.stages.push(descentResults);

  popDelta(result.immunityWinner, 3);
  ep.campEvents[campKey].post.push({
    text: `${result.immunityWinner} retrieved the bonsai tree and won immunity in the kung fu challenge!`,
    players: [result.immunityWinner], badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'crouching-courtney',
  });

  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, null, null, ep.chalMemberScores || {}, 'kung fu dojo');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'training', _romActive);

  // ── FINALIZE ──
  ep.crouchingCourtney = result;
  ep.isCrouchingCourtney = true;
  ep.challengeType = 'crouching-courtney';
  ep.challengeLabel = 'Way of the Warrior';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;

  const sorted = [...active].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
  ep.chalPlacements = sorted;
  ep.tribalPlayers = active;
  updateChalRecord(ep);

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'crouching-courtney', label: 'Way of the Warrior', winner: result.immunityWinner };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG (custom — VP builders will override via _textTwistChallenge)
// ══════════════════════════════════════════════════════════════
export function _textCrouchingCourtney(ep, ln, sec) {
  const cc = ep.crouchingCourtney;
  if (!cc) return;
  sec('WAY OF THE WARRIOR');

  if (cc.phase1.spy) ln(`  SPY: ${cc.phase1.spy} (mole)`);
  ln('-- PHASE 1: TRAINING --');
  for (const pair of cc.phase1.pairs) {
    ln(`  Pair: ${pair.trainer} (trainer) + ${pair.fighter} (fighter)`);
  }
  for (const sab of cc.phase1.spySabotages) {
    ln(`  [SPY] ${sab.text}`);
  }
  for (let i = 0; i < cc.phase1.training.length; i++) {
    ln(`  ${TRAINING_BEATS[i].name}:`);
    for (const r of cc.phase1.training[i]) {
      ln(`    ${r.fighter}${r.trainer ? ` (${r.trainer})` : ' (solo)'}: ${r.score} — ${r.text}`);
    }
  }

  ln('-- PHASE 2: ROBOT FIGHT --');
  for (const fight of cc.phase2.fights) {
    ln(`  ${fight.fighters[0]} vs ${fight.fighters[1]}:`);
    for (const ex of fight.exchanges) {
      ln(`    Ex${ex.exchange}: ${ex.winner} wins — ${ex.text}`);
    }
    ln(`    WINNER: ${fight.winner} | ${fight.koText}`);
  }

  ln('-- PHASE 3: MOUNTAIN CLIMB --');
  ln(`  Climbers: ${cc.phase3.climbers.join(', ')}`);
  for (const team of cc.phase3.teams) {
    ln(`  TEAM: ${team.a} + ${team.b}`);
  }
  for (const bet of cc.phase3.betrayals) {
    ln(`  BETRAYAL: ${bet.betrayer} → ${bet.victim} — ${bet.text}`);
  }
  for (let i = 0; i < cc.phase3.stages.length; i++) {
    ln(`  ${CLIMB_STAGES[i].name}:`);
    for (const r of cc.phase3.stages[i]) {
      ln(`    ${r.name}: ${r.eliminated ? 'ELIMINATED' : r.success != null ? (r.success ? 'WINS BONSAI' : 'DEFEATED') : `water ${r.water}%`}`);
      ln(`      ${r.text}`);
    }
  }
  ln(`  IMMUNITY: ${cc.immunityWinner}`);

  if (cc.kitchen.events.length) {
    ln('-- KITCHEN DUTY --');
    for (const evt of cc.kitchen.events) {
      ln(`  ${evt.text}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// VP — CSS (OVERDRIVE: Rising Sun + Ink Wash)
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Noto+Serif+SC:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');

  .kf-shell{
    --sun-red:#c0392b;--sun-crimson:#8b0000;--jade:#27ae60;--gold:#d4a017;
    --ink:#1a1210;--parchment:#f5e6c8;--cherry:#f8a5c2;--bamboo:#6b8e23;
    --brush-black:#1a1a1a;--rice-paper:#faf3e0;
    font-family:'Cinzel',serif;color:var(--parchment);
    background:var(--ink);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:500px;
    overflow:clip;border:3px solid var(--sun-crimson);
    box-shadow:0 0 40px rgba(139,0,0,0.4),inset 0 0 60px rgba(0,0,0,0.6);
  }
  .kf-shell *{box-sizing:border-box}

  /* ═══ RISING SUN RAYS — radiating from center ═══ */
  .kf-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
    background:
      conic-gradient(from 0deg at 50% 85%,
        rgba(192,57,43,0.08) 0deg,transparent 12deg,
        rgba(192,57,43,0.06) 24deg,transparent 36deg,
        rgba(192,57,43,0.08) 48deg,transparent 60deg,
        rgba(192,57,43,0.06) 72deg,transparent 84deg,
        rgba(192,57,43,0.08) 96deg,transparent 108deg,
        rgba(192,57,43,0.06) 120deg,transparent 132deg,
        rgba(192,57,43,0.08) 144deg,transparent 156deg,
        rgba(192,57,43,0.06) 168deg,transparent 180deg,
        rgba(192,57,43,0.08) 192deg,transparent 204deg,
        rgba(192,57,43,0.06) 216deg,transparent 228deg,
        rgba(192,57,43,0.08) 240deg,transparent 252deg,
        rgba(192,57,43,0.06) 264deg,transparent 276deg,
        rgba(192,57,43,0.08) 288deg,transparent 300deg,
        rgba(192,57,43,0.06) 312deg,transparent 324deg,
        rgba(192,57,43,0.08) 336deg,transparent 348deg
      )}

  /* ═══ PHASE-SPECIFIC ENVIRONMENTS ═══ */

  /* DOJO — warm wood floor, paper sliding doors */
  .kf-phase-dojo{background:linear-gradient(180deg,#1a1210 0%,#2a1c14 40%,#3d2b1a 70%,#1a1210 100%)}
  .kf-phase-dojo .kf-main{
    background:
      /* Wood grain floor texture */
      repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(139,90,43,0.04) 38px,rgba(139,90,43,0.04) 40px),
      /* Warm interior glow */
      radial-gradient(ellipse at 50% 90%,rgba(180,120,60,0.08) 0%,transparent 50%)}

  /* ARENA — metallic, cold, spotlights */
  .kf-phase-arena{background:linear-gradient(180deg,#0a0808 0%,#1a1215 40%,#2a1520 60%,#0a0808 100%)}
  .kf-phase-arena .kf-main{
    background:
      /* Spotlight cones */
      conic-gradient(from 200deg at 25% 10%,transparent 0deg,rgba(192,57,43,0.06) 10deg,transparent 20deg),
      conic-gradient(from 340deg at 75% 10%,transparent 0deg,rgba(212,160,23,0.05) 10deg,transparent 20deg),
      /* Arena floor glow */
      radial-gradient(ellipse at 50% 70%,rgba(192,57,43,0.06) 0%,transparent 50%)}

  /* MOUNTAIN — outdoor, misty, green to snow */
  .kf-phase-mountain{background:linear-gradient(180deg,#1a2030 0%,#1a2818 30%,#1a3018 50%,#2a3a28 70%,#dde8f0 95%,#f0f4f8 100%)}
  .kf-phase-mountain .kf-main{
    background:
      /* Mist bands */
      radial-gradient(ellipse at 30% 60%,rgba(200,220,240,0.06) 0%,transparent 30%),
      radial-gradient(ellipse at 70% 40%,rgba(200,220,240,0.04) 0%,transparent 25%),
      /* Snow at summit */
      linear-gradient(180deg,transparent 85%,rgba(255,255,255,0.03) 100%)}

  /* ═══ CHERRY BLOSSOM PETALS ═══ */
  .kf-blossom{position:absolute;pointer-events:none;z-index:0;opacity:0.25;
    animation:kf-fall var(--fall-dur,6s) linear infinite}
  @keyframes kf-fall{
    0%{transform:translateY(-20px) rotate(0deg) translateX(0)}
    25%{transform:translateY(125px) rotate(90deg) translateX(15px)}
    50%{transform:translateY(250px) rotate(180deg) translateX(-10px)}
    75%{transform:translateY(375px) rotate(270deg) translateX(20px)}
    100%{transform:translateY(500px) rotate(360deg) translateX(0)}
  }

  /* ═══ TWO-COLUMN LAYOUT ═══ */
  .kf-layout{display:flex;gap:0;position:relative;z-index:1;min-height:480px}
  .kf-main{flex:1;padding:16px 20px;min-width:0}
  .kf-honor-col{width:220px;flex-shrink:0;position:sticky;top:0;align-self:flex-start;
    max-height:100vh;overflow-y:auto;overflow-x:hidden;
    scrollbar-width:thin;scrollbar-color:var(--sun-crimson) transparent}

  /* ═══ HONOR BOARD — Temple announcement board ═══ */
  .kf-honor{
    background:var(--rice-paper);
    border-left:none;padding:0;min-height:480px;position:relative;
    box-shadow:-4px 0 12px rgba(0,0,0,0.4)}

  /* Red wooden frame */
  .kf-honor::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;
    border:8px solid var(--sun-crimson);border-top:12px solid var(--sun-crimson);
    box-shadow:inset 0 0 8px rgba(139,0,0,0.3),inset 2px 2px 0 rgba(255,255,255,0.05);
    background:
      linear-gradient(90deg,rgba(139,0,0,0.4) 0px,transparent 3px,transparent calc(100% - 3px),rgba(139,0,0,0.4) 100%),
      linear-gradient(180deg,rgba(139,0,0,0.4) 0px,transparent 3px,transparent calc(100% - 3px),rgba(139,0,0,0.4) 100%)}

  /* Tiled roof top */
  .kf-honor::after{content:'';position:absolute;top:-6px;left:-6px;right:-6px;height:14px;z-index:3;pointer-events:none;
    background:linear-gradient(180deg,#2a1a1a 0%,#3d2020 40%,var(--sun-crimson) 50%,#3d2020 60%,#2a1a1a 100%);
    border-radius:2px 2px 0 0;
    box-shadow:0 -2px 6px rgba(0,0,0,0.4),0 2px 4px rgba(0,0,0,0.3)}

  /* Lantern glow on sides */
  .kf-honor-lantern{position:absolute;width:14px;height:18px;z-index:4;
    background:radial-gradient(circle,rgba(255,200,100,0.9),rgba(255,160,50,0.4),transparent);
    border:1px solid rgba(139,0,0,0.5);border-radius:2px;
    box-shadow:0 0 12px rgba(255,180,60,0.4),0 0 24px rgba(255,160,50,0.15);
    animation:kf-lantern-flicker 2s ease-in-out infinite alternate}
  @keyframes kf-lantern-flicker{0%{opacity:0.7;box-shadow:0 0 10px rgba(255,180,60,0.3)}
    100%{opacity:1;box-shadow:0 0 16px rgba(255,180,60,0.5)}}

  .kf-honor-inner{position:relative;z-index:1;padding:16px 10px 10px;
    background:var(--rice-paper);
    background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")}

  .kf-honor-title{font-family:'Cinzel',serif;font-weight:700;font-size:12px;color:var(--sun-crimson);
    letter-spacing:3px;text-align:center;margin-bottom:4px;
    text-shadow:0 1px 0 rgba(0,0,0,0.1)}
  .kf-honor-list{display:flex;flex-direction:column;gap:5px}
  .kf-honor-player{display:flex;align-items:center;gap:5px;padding:4px 6px;
    background:rgba(139,0,0,0.04);border-radius:2px;border:1px solid rgba(139,0,0,0.1);
    transition:all 0.3s}
  .kf-honor-player:first-child{border-color:var(--gold);background:rgba(212,160,23,0.08);
    box-shadow:0 0 6px rgba(212,160,23,0.1)}
  .kf-honor-rank{font-family:'Cinzel',serif;font-size:12px;color:var(--sun-crimson);width:14px;text-align:center;font-weight:700}
  .kf-honor-player:first-child .kf-honor-rank{color:var(--gold)}
  .kf-honor-img{width:24px;height:24px;border-radius:50%;object-fit:contain;
    border:2px solid var(--sun-crimson);box-shadow:0 1px 3px rgba(0,0,0,0.2)}
  .kf-honor-info{flex:1;min-width:0}
  .kf-honor-name{font-family:'Cinzel',serif;font-size:9px;color:var(--brush-black);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .kf-honor-bar{height:4px;background:rgba(0,0,0,0.06);border-radius:2px;margin-top:2px}
  .kf-honor-fill{height:100%;border-radius:2px}
  .kf-honor-fill-g{background:linear-gradient(90deg,#16a34a,var(--jade))}
  .kf-honor-fill-y{background:linear-gradient(90deg,#b8860b,var(--gold))}
  .kf-honor-fill-r{background:linear-gradient(90deg,var(--sun-crimson),var(--sun-red))}
  .kf-honor-score{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sun-crimson);width:28px;text-align:right;font-weight:700}

  /* ═══ TYPOGRAPHY — Ink brush calligraphy feel ═══ */
  .kf-title{font-family:'Cinzel',serif;font-weight:900;font-size:32px;text-align:center;
    color:var(--gold);text-shadow:0 0 30px rgba(212,160,23,0.3),0 2px 0 rgba(0,0,0,0.3);
    letter-spacing:4px}
  .kf-subtitle{font-family:'Cinzel',serif;font-size:11px;text-align:center;color:var(--cherry);
    letter-spacing:4px;text-transform:uppercase}
  .kf-phase-title{font-family:'Cinzel',serif;font-weight:700;font-size:22px;color:var(--sun-red);
    text-align:center;letter-spacing:3px;margin:12px 0 4px;position:relative;
    text-shadow:0 0 15px rgba(192,57,43,0.2)}
  .kf-phase-title::after{content:'';display:block;width:60px;height:2px;margin:6px auto 0;
    background:linear-gradient(90deg,transparent,var(--sun-red),transparent)}
  .kf-phase-badge{display:inline-block;font-family:'Cinzel',serif;font-size:9px;
    padding:2px 10px;border:1px solid var(--gold);color:var(--gold);
    letter-spacing:2px;text-transform:uppercase;margin:0 auto 8px;border-radius:2px}

  /* Ink brush narration — scroll style */
  .kf-narration{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--brush-black);
    line-height:1.7;margin:8px 0;padding:12px 16px;
    background:var(--rice-paper);border-left:4px solid var(--sun-red);border-radius:0 2px 2px 0;
    position:relative;box-shadow:1px 2px 6px rgba(0,0,0,0.15);
    background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")}

  /* ═══ PLAYER CARDS — Shikishi board style ═══ */
  .kf-player-card{display:flex;gap:10px;align-items:center;padding:12px 14px;margin:8px 0;
    background:var(--rice-paper);border-radius:2px;color:var(--brush-black);
    border:2px solid var(--gold);position:relative;overflow:hidden;transition:all 0.2s;
    box-shadow:2px 3px 8px rgba(0,0,0,0.25),inset 0 0 30px rgba(0,0,0,0.03);
    background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")}
  .kf-player-card:hover{box-shadow:2px 4px 12px rgba(0,0,0,0.3);transform:translateY(-1px)}
  /* Red accent strip on left — like a seal mark */
  .kf-player-card::before{content:'';position:absolute;top:6px;left:6px;width:3px;height:calc(100% - 12px);
    background:var(--sun-crimson);border-radius:1px}
  .kf-player-name{font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:var(--brush-black)}
  .kf-player-detail{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(26,26,26,0.8);line-height:1.5}
  .kf-player-score{font-family:'Cinzel',serif;font-weight:700;font-size:18px;color:var(--sun-crimson);
    text-shadow:0 1px 0 rgba(0,0,0,0.1)}

  /* Hanko stamp avatar frame */
  .kf-hanko{width:40px;height:40px;border-radius:50%;border:2px solid var(--sun-red);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    box-shadow:0 0 6px rgba(192,57,43,0.3);position:relative}
  .kf-hanko img{width:34px;height:34px;border-radius:50%;object-fit:contain}
  .kf-hanko::after{content:'';position:absolute;inset:-2px;border-radius:50%;
    border:1px solid rgba(212,160,23,0.2)}

  /* ═══ FIGHT ARENA — Circular ring ═══ */
  .kf-arena{background:radial-gradient(circle at 50% 50%,rgba(139,0,0,0.15) 0%,rgba(26,18,16,0.8) 70%);
    border:2px solid var(--sun-crimson);border-radius:8px;padding:16px;margin:10px 0;
    position:relative;overflow:hidden}
  .kf-arena::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:200px;height:200px;border-radius:50%;border:2px dashed rgba(192,57,43,0.15);pointer-events:none}
  .kf-vs{display:flex;gap:12px;align-items:center;justify-content:center;margin:12px 0;position:relative;z-index:1}
  .kf-vs-side{text-align:center;flex:1}
  .kf-vs-text{font-family:'Cinzel',serif;font-weight:900;font-size:28px;color:var(--gold);
    flex:0 0 60px;text-shadow:0 0 15px rgba(212,160,23,0.4),0 2px 0 rgba(0,0,0,0.3);
    animation:kf-vs-pulse 1.5s ease-in-out infinite alternate}

  /* HP bars — arc-style */
  .kf-hp-bar{height:8px;background:rgba(255,255,255,0.08);border-radius:4px;margin:4px 0;overflow:hidden;
    border:1px solid rgba(255,255,255,0.05)}
  .kf-hp-fill{height:100%;border-radius:3px;transition:width 0.4s ease}
  .kf-hp-green{background:linear-gradient(90deg,#16a34a,#22c55e);box-shadow:0 0 4px rgba(34,197,94,0.3)}
  .kf-hp-yellow{background:linear-gradient(90deg,#b8860b,var(--gold));box-shadow:0 0 4px rgba(212,160,23,0.3)}
  .kf-hp-red{background:linear-gradient(90deg,var(--sun-crimson),var(--sun-red));box-shadow:0 0 4px rgba(192,57,43,0.3)}

  /* Fight exchange — ink splash on impact */
  .kf-exchange{position:relative;margin:4px 0}
  .kf-exchange-win .kf-player-card{border-color:var(--jade)}
  .kf-exchange-lose .kf-player-card{border-color:var(--sun-red)}
  .kf-ink-splash{position:absolute;top:50%;right:10px;transform:translateY(-50%);
    font-size:28px;opacity:0;pointer-events:none;animation:kf-ink-hit 0.5s ease-out forwards}
  .kf-exchange-win .kf-ink-splash{opacity:0.2}

  /* Momentum bar — shows fight flow */
  .kf-momentum{height:8px;border-radius:4px;margin:6px 0;overflow:hidden;position:relative;
    background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05)}
  .kf-momentum-fill{position:absolute;top:0;height:100%;transition:width 0.4s ease,left 0.4s ease}
  .kf-momentum-a{left:0;background:linear-gradient(90deg,var(--jade),rgba(39,174,96,0.5));border-radius:4px 0 0 4px}
  .kf-momentum-b{right:0;background:linear-gradient(270deg,var(--sun-red),rgba(192,57,43,0.5));border-radius:0 4px 4px 0}

  /* KO card */
  .kf-ko{text-align:center;padding:16px;margin:8px 0;position:relative;
    background:var(--rice-paper);border:3px solid var(--gold);border-radius:4px;
    box-shadow:0 0 20px rgba(212,160,23,0.15),2px 4px 10px rgba(0,0,0,0.3);
    animation:kf-ko-slam 0.5s cubic-bezier(0.16,1,0.3,1)}
  @keyframes kf-ko-slam{0%{transform:scale(1.5);opacity:0}50%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}

  /* ═══ BETRAYAL EFFECTS ═══ */
  .kf-betrayal{animation:kf-betrayal-shake 0.4s ease-out;
    border-color:var(--sun-red) !important;box-shadow:0 0 20px rgba(192,57,43,0.3) !important}
  .kf-betrayal::after{content:'⚔️';position:absolute;top:8px;right:8px;font-size:20px;
    animation:kf-ink-hit 0.6s ease-out}
  @keyframes kf-betrayal-shake{
    0%,100%{transform:translateX(0)}10%{transform:translateX(-4px) rotate(-1deg)}
    20%{transform:translateX(4px) rotate(1deg)}30%{transform:translateX(-3px)}
    40%{transform:translateX(3px)}50%{transform:translateX(-1px)}
  }

  /* ═══ WATER CUP VISUAL ═══ */
  .kf-water-cup{width:28px;height:36px;border:2px solid rgba(100,100,100,0.4);
    border-top:none;border-radius:0 0 6px 6px;position:relative;overflow:hidden;
    flex-shrink:0;background:rgba(0,0,0,0.1)}
  .kf-water-cup-fill{position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(180deg,rgba(96,165,250,0.7),rgba(37,99,235,0.8));
    transition:height 0.4s ease;border-radius:0 0 4px 4px}
  .kf-water-cup-fill.kf-water-danger{
    background:linear-gradient(180deg,rgba(239,68,68,0.7),rgba(220,38,38,0.8))}
  .kf-water-cup::before{content:'';position:absolute;top:-4px;left:-4px;right:-4px;height:4px;
    background:rgba(100,100,100,0.5);border-radius:2px}

  /* ═══ TRAINING BEAT ICONS ═══ */
  .kf-beat-header{display:flex;align-items:center;gap:10px;margin:10px 0 6px;padding:8px 12px;
    background:linear-gradient(90deg,rgba(139,0,0,0.08),transparent);
    border-left:3px solid var(--sun-crimson);border-radius:0 4px 4px 0}
  .kf-beat-icon{font-size:28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2))}
  .kf-beat-name{font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:var(--sun-red);letter-spacing:1px}
  .kf-beat-desc{font-size:10px;color:rgba(245,230,200,0.4);font-family:'JetBrains Mono',monospace}

  /* ═══ MOUNTAIN ELEVATION ═══ */
  .kf-elevation{display:flex;flex-direction:column-reverse;gap:0;position:relative}
  .kf-elevation::before{content:'';position:absolute;left:20px;top:0;bottom:0;width:2px;
    background:linear-gradient(180deg,var(--sun-crimson),var(--jade),var(--bamboo));opacity:0.2}
  .kf-stage{position:relative;margin-left:30px}
  .kf-stage-marker{position:absolute;left:-38px;top:12px;width:18px;height:18px;
    border-radius:50%;border:2px solid var(--jade);background:var(--ink);
    display:flex;align-items:center;justify-content:center;font-size:10px;z-index:2}
  .kf-stage-summit .kf-stage-marker{border-color:var(--sun-red);background:var(--sun-crimson)}

  /* ═══ MOUNTAIN CLIMB — Vertical scroll painting ═══ */
  .kf-mountain{position:relative;padding:8px;margin:8px 0}
  .kf-stage{padding:12px 16px;margin:8px 0;border-radius:4px;position:relative;
    border:1px solid rgba(39,174,96,0.15);
    background:linear-gradient(135deg,rgba(107,142,35,0.06),rgba(39,174,96,0.04))}
  .kf-stage::before{content:'';position:absolute;left:0;top:0;width:2px;height:100%;
    background:linear-gradient(180deg,var(--bamboo),var(--jade))}
  .kf-stage-summit{border-color:rgba(192,57,43,0.25);
    background:linear-gradient(135deg,rgba(192,57,43,0.08),rgba(139,0,0,0.05))}
  .kf-stage-summit::before{background:linear-gradient(180deg,var(--sun-red),var(--sun-crimson))}

  /* Water cup bars */
  .kf-water-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;margin:3px 0;overflow:hidden}
  .kf-water-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#2563eb,#60a5fa);
    transition:width 0.4s ease;box-shadow:0 0 4px rgba(59,130,246,0.3)}
  .kf-water-low{background:linear-gradient(90deg,var(--sun-crimson),#ef4444);
    box-shadow:0 0 4px rgba(239,68,68,0.3)}

  /* Team/Betrayal badges */
  .kf-team-badge{display:inline-block;font-size:9px;padding:1px 6px;border-radius:2px;
    font-family:'Cinzel',serif;letter-spacing:1px}
  .kf-team-badge-ally{background:rgba(39,174,96,0.15);color:var(--jade);border:1px solid rgba(39,174,96,0.3)}
  .kf-team-badge-betray{background:rgba(192,57,43,0.15);color:var(--sun-red);border:1px solid rgba(192,57,43,0.3);
    animation:kf-betray-pulse 1s ease-in-out infinite alternate}
  @keyframes kf-betray-pulse{0%{box-shadow:none}100%{box-shadow:0 0 8px rgba(192,57,43,0.3)}}

  /* ═══ CONTROLS — Red lacquer buttons ═══ */
  .kf-controls{text-align:center;margin:12px 0;padding:8px 0}
  .kf-btn{font-family:'Cinzel',serif;font-weight:700;background:var(--sun-crimson);color:var(--gold);
    border:2px solid var(--gold);padding:8px 28px;cursor:pointer;font-size:14px;
    letter-spacing:3px;border-radius:3px;margin:0 4px;transition:all 0.2s;
    text-shadow:0 1px 0 rgba(0,0,0,0.3);box-shadow:0 2px 8px rgba(139,0,0,0.3)}
  .kf-btn:hover{background:var(--gold);color:var(--ink);transform:translateY(-2px);
    box-shadow:0 4px 12px rgba(212,160,23,0.3)}

  /* ═══ CINEMATIC REVEALS ═══ */
  .kf-step-hidden{opacity:0;transform:translateY(14px);max-height:0;overflow:hidden;margin:0;padding:0}
  .kf-step-revealing{animation:kf-card-enter 0.5s cubic-bezier(0.16,1,0.3,1) forwards;max-height:2000px}
  .kf-step-visible{opacity:1;transform:none;max-height:none}
  @keyframes kf-card-enter{
    0%{opacity:0;transform:translateY(16px) scale(0.97);filter:blur(2px)}
    60%{opacity:1;filter:blur(0)}
    100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
  }

  /* ═══ FIGHT IMPACT EFFECTS ═══ */
  .kf-impact{animation:kf-impact-slam 0.4s cubic-bezier(0.16,1,0.3,1)}
  @keyframes kf-impact-slam{
    0%{transform:scale(1.08);box-shadow:0 0 30px rgba(192,57,43,0.4)}
    50%{transform:scale(0.98)}
    100%{transform:scale(1);box-shadow:none}
  }
  .kf-move-burst{display:inline-block;animation:kf-move-burst 0.5s ease-out}
  @keyframes kf-move-burst{
    0%{transform:scale(2) rotate(-10deg);opacity:0}
    40%{transform:scale(1.1) rotate(3deg);opacity:1}
    100%{transform:scale(1) rotate(0);opacity:1}
  }
  .kf-dmg-flash{animation:kf-dmg-flash 0.3s ease-out}
  @keyframes kf-dmg-flash{
    0%{background:rgba(192,57,43,0.3)}
    100%{background:transparent}
  }

  /* KO slam effect */
  .kf-ko{animation:kf-ko-slam 0.6s cubic-bezier(0.16,1,0.3,1)}
  @keyframes kf-ko-slam{
    0%{transform:scale(2.5) rotate(-5deg);opacity:0;filter:blur(4px)}
    40%{transform:scale(0.9) rotate(1deg);opacity:1;filter:blur(0)}
    60%{transform:scale(1.02)}
    100%{transform:scale(1) rotate(0)}
  }

  /* Sasquatchanakwa boss entrance */
  .kf-boss-entrance{animation:kf-boss-enter 0.7s ease-out}
  @keyframes kf-boss-enter{
    0%{transform:translateY(-20px) scale(1.2);opacity:0;filter:brightness(2)}
    50%{transform:translateY(2px) scale(1);filter:brightness(1.3)}
    100%{opacity:1;transform:translateY(0);filter:brightness(1)}
  }

  /* Bonsai grab glow */
  .kf-bonsai-grab{animation:kf-bonsai-pulse 1.5s ease-in-out infinite alternate}
  @keyframes kf-bonsai-pulse{
    0%{text-shadow:0 0 8px rgba(39,174,96,0.3);transform:scale(1)}
    100%{text-shadow:0 0 20px rgba(39,174,96,0.6);transform:scale(1.1)}
  }

  /* Steal flash */
  .kf-steal-flash{animation:kf-steal-flash 0.4s ease-out}
  @keyframes kf-steal-flash{
    0%{box-shadow:0 0 40px rgba(192,57,43,0.6);transform:scale(1.05)}
    100%{box-shadow:none;transform:scale(1)}
  }

  /* Phase transition banner */
  .kf-phase-transition{text-align:center;padding:20px;margin:12px 0;position:relative;
    background:linear-gradient(90deg,transparent,rgba(212,160,23,0.08),transparent);
    border-top:2px solid var(--gold);border-bottom:2px solid var(--gold);
    animation:kf-phase-wipe 0.6s ease-out}
  @keyframes kf-phase-wipe{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}

  /* ═══ ANIMATIONS ═══ */
  @keyframes kf-vs-pulse{0%{transform:scale(1);text-shadow:0 0 15px rgba(212,160,23,0.4)}
    100%{transform:scale(1.08);text-shadow:0 0 25px rgba(212,160,23,0.6)}}
  @keyframes kf-ink-hit{0%{opacity:0;transform:scale(0.5)}50%{opacity:0.3}100%{opacity:0;transform:scale(2)}}
  @keyframes kf-screen-shake{
    0%,100%{transform:translateX(0)}10%{transform:translateX(-3px) translateY(1px)}
    20%{transform:translateX(3px) translateY(-1px)}30%{transform:translateX(-2px)}
    40%{transform:translateX(2px)}50%{transform:translateX(-1px)}
  }

  @media(prefers-reduced-motion:reduce){
    .kf-shell,.kf-shell *{animation:none!important;transition:none!important}
    .kf-step-hidden{opacity:1;transform:none;max-height:none}
  }

  /* ═══ COVER ═══ */
  .kf-cover{text-align:center;padding:40px 20px;position:relative;z-index:1}
  .kf-cover::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:200px;height:200px;border-radius:50%;
    background:radial-gradient(circle,rgba(192,57,43,0.15) 0%,transparent 70%);pointer-events:none}
  .kf-cover-roster{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px}

  /* ═══ SOCIAL EVENT CARD — shikishi style with distinct border ═══ */
  .kf-social{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;margin:8px 0;
    background:var(--rice-paper);border:2px dashed rgba(192,57,43,0.3);border-radius:3px;
    position:relative;box-shadow:1px 2px 6px rgba(0,0,0,0.15);
    background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")}
  .kf-social .kf-player-detail{color:rgba(26,26,26,0.8)}
  .kf-social-icons{display:flex;flex-shrink:0}
  .kf-social-icons .kf-hanko{width:32px;height:32px;margin-left:-6px}
  .kf-social-icons .kf-hanko:first-child{margin-left:0}
  .kf-social-icons .kf-hanko img{width:26px;height:26px}
  .kf-social-type{position:absolute;top:-8px;right:8px;font-size:16px;
    background:var(--rice-paper);padding:0 6px;border-radius:4px;
    box-shadow:0 1px 3px rgba(0,0,0,0.1)}
  .kf-social-showmance{border-color:var(--cherry)}
  .kf-social-rivalry{border-color:var(--sun-red)}
  .kf-social-bond{border-color:var(--jade)}
  .kf-social-respect{border-color:var(--gold)}
  .kf-social-blame{border-color:var(--sun-red)}
  .kf-social-paranoia{border-color:rgba(100,100,100,0.4)}

  /* Torii gate decoration for headers */
  .kf-torii{text-align:center;margin:8px 0;opacity:0.15;font-size:24px;letter-spacing:8px}
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL + HONOR BOARD
// ══════════════════════════════════════════════════════════════
function _buildHonor(ep, phase) {
  const cc = ep.crouchingCourtney;
  if (!cc) return '';
  const active = cc.phase1.pairs.flatMap(p => [p.trainer, p.fighter]);
  if (cc.phase1.spy) active.push(cc.phase1.spy);
  const unique = [...new Set(active)];

  let rows = '', subtitle = '', valueLabel = '';

  if (phase === 1) {
    // Training — show pairs with trainer → fighter
    subtitle = 'TRAINING PAIRS';
    rows = cc.phase1.pairs.map((p, idx) => {
      const lastBeat = cc.phase1.training[cc.phase1.training.length - 1];
      const fScore = lastBeat?.find(b => b.fighter === p.fighter)?.score || 0;
      return `<div class="kf-honor-player">
        <div class="kf-honor-rank">${idx + 1}</div>
        <img class="kf-honor-img" src="assets/avatars/${slug(p.trainer)}.png" alt="${p.trainer}" onerror="this.style.display='none'">
        <div class="kf-honor-info">
          <div class="kf-honor-name">${p.trainer} → ${p.fighter}</div>
          <div class="kf-honor-bar"><div class="kf-honor-fill kf-honor-fill-g" style="width:${Math.min(100, fScore * 8)}%"></div></div>
        </div>
      </div>`;
    }).join('');
    if (cc.phase1.spy) {
      rows += `<div class="kf-honor-player" style="border-color:var(--gold)">
        <div class="kf-honor-rank" style="color:var(--gold)">🕵️</div>
        <img class="kf-honor-img" src="assets/avatars/${slug(cc.phase1.spy)}.png" alt="${cc.phase1.spy}" onerror="this.style.display='none'">
        <div class="kf-honor-info"><div class="kf-honor-name">${cc.phase1.spy} (spy)</div></div>
      </div>`;
    }
  } else if (phase === 2) {
    // Robot Fight — show fighter wins, only from revealed fights
    subtitle = 'FIGHT RECORD';
    const revIdx = window._tvState?.['kf-fight']?.idx ?? -1;
    // Each fight = 1 VS card + 3 exchanges + 1 KO = 5 steps
    const stepsPerFight = 5;
    const fightsRevealed = Math.max(0, Math.floor((revIdx + 1) / stepsPerFight));
    const wins = {};
    const fighters = cc.phase2.bracket || [];
    fighters.forEach(n => { wins[n] = 0; });
    for (let i = 0; i < Math.min(fightsRevealed, cc.phase2.fights.length); i++) {
      wins[cc.phase2.fights[i].winner] = (wins[cc.phase2.fights[i].winner] || 0) + 1;
    }
    const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
    const maxWins = Math.max(1, sorted[0]?.[1] || 1);
    rows = sorted.map(([name, w], idx) => {
      const trainer = cc.phase1.pairs.find(p => p.fighter === name)?.trainer;
      const pct = Math.max(10, (w / maxWins) * 100);
      const color = pct > 60 ? 'g' : pct > 30 ? 'y' : 'r';
      return `<div class="kf-honor-player">
        <div class="kf-honor-rank">${idx + 1}</div>
        <img class="kf-honor-img" src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
        <div class="kf-honor-info">
          <div class="kf-honor-name">${name}${trainer ? ` (${trainer})` : ''}</div>
          <div class="kf-honor-bar"><div class="kf-honor-fill kf-honor-fill-${color}" style="width:${pct}%"></div></div>
        </div>
        <div class="kf-honor-score">${w}W</div>
      </div>`;
    }).join('');
    // Add trainers who didn't fight
    const trainerOnly = cc.phase1.pairs.map(p => p.trainer).filter(t => !fighters.includes(t));
    for (const t of trainerOnly) {
      rows += `<div class="kf-honor-player" style="opacity:0.6">
        <div class="kf-honor-rank">—</div>
        <img class="kf-honor-img" src="assets/avatars/${slug(t)}.png" alt="${t}" onerror="this.style.display='none'">
        <div class="kf-honor-info"><div class="kf-honor-name">${t} (trainer)</div></div>
      </div>`;
    }
  } else {
    // Mountain Climb — show water levels from revealed stages only
    subtitle = 'WATER REMAINING';
    const climbRevIdx = window._tvState?.['kf-climb']?.idx ?? -1;
    // Steps: 0=climbers, then teams, then stages. Approximate: stages start after climbers+teams
    const teamSteps = cc.phase3.teams?.length || 0;
    const stageStartStep = 1 + teamSteps;
    const stagesRevealed = Math.max(0, climbRevIdx - stageStartStep + 1);
    const waterData = {};
    unique.forEach(n => { waterData[n] = 100; });
    // Apply champion advantage
    if (cc.phase2.champion) waterData[cc.phase2.champion] = 110;
    if (cc.phase2.championTrainer) waterData[cc.phase2.championTrainer] = 110;
    for (let i = 0; i < Math.min(stagesRevealed, cc.phase3.stages.length); i++) {
      for (const r of cc.phase3.stages[i]) {
        if (r.water != null) waterData[r.name] = r.water;
        if (r.eliminated) waterData[r.name] = 0;
      }
    }
    const sorted = Object.entries(waterData).sort((a, b) => b[1] - a[1]);
    rows = sorted.map(([name, water], idx) => {
      const pct = Math.max(0, water);
      const color = pct > 60 ? 'g' : pct > 30 ? 'y' : 'r';
      return `<div class="kf-honor-player">
        <div class="kf-honor-rank">${idx + 1}</div>
        <img class="kf-honor-img" src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
        <div class="kf-honor-info">
          <div class="kf-honor-name">${name}</div>
          <div class="kf-honor-bar"><div class="kf-honor-fill kf-honor-fill-${color}" style="width:${pct}%"></div></div>
        </div>
        <div class="kf-honor-score" style="color:${pct > 40 ? '#60a5fa' : 'var(--sun-red)'}">${pct}%</div>
      </div>`;
    }).join('');
  }

  const phaseLabels = { 1: 'TRAINING', 2: 'ROBOT FIGHT', 3: 'MOUNTAIN CLIMB' };
  return `<div class="kf-honor-col" data-phase="${phase}"><div class="kf-honor">
    <div class="kf-honor-lantern" style="top:20px;left:-7px"></div>
    <div class="kf-honor-lantern" style="top:20px;right:-7px"></div>
    <div class="kf-honor-inner">
      <div class="kf-honor-title">⛩️ HONOR BOARD</div>
      <div style="font-family:'Cinzel',serif;font-size:8px;color:var(--sun-crimson);text-align:center;margin-bottom:6px;letter-spacing:2px;opacity:0.7">${subtitle || phaseLabels[phase] || ''}</div>
      <div style="margin:0 auto 6px;width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--sun-crimson),transparent)"></div>
      <div class="kf-honor-list">${rows}</div>
    </div>
  </div></div>`;
}

function _buildSocialCard(evt) {
  const icons = { showmance: '💕', bond: '✨', rivalry: '⚔️', respect: '🤝', blame: '😤', paranoia: '👁️' };
  const icon = icons[evt.type] || '💬';
  const cls = `kf-social-${evt.type}`;
  const playerIcons = (evt.players || []).map(n =>
    `<div class="kf-hanko"><img src="assets/avatars/${slug(n)}.png" alt="${n}" onerror="this.style.display='none'"></div>`
  ).join('');
  return `<div class="kf-social ${cls}">
    <div class="kf-social-type">${icon}</div>
    <div class="kf-social-icons">${playerIcons}</div>
    <div style="flex:1">
      <div class="kf-player-detail">${evt.text}</div>
    </div>
  </div>`;
}

function _buildBlossoms() {
  const petals = [];
  const symbols = ['🌸', '🌸', '🌸', '✿', '❀', '🍃'];
  for (let i = 0; i < 12; i++) {
    const left = (5 + Math.random() * 90).toFixed(0);
    const dur = (5 + Math.random() * 8).toFixed(1);
    const delay = (Math.random() * -10).toFixed(1);
    const size = (10 + Math.random() * 8).toFixed(0);
    const symbol = symbols[i % symbols.length];
    petals.push(`<div class="kf-blossom" style="left:${left}%;--fall-dur:${dur}s;animation-delay:${delay}s;font-size:${size}px">${symbol}</div>`);
  }
  return petals.join('');
}

function _kfShell(content, ep, phase = 0, phaseCls = '') {
  if (phase > 0) {
    window._kfHonorEp = ep;
    window._kfHonorPhase = phase;
  }
  const honor = phase > 0 ? _buildHonor(ep, phase) : '';
  const blossoms = _buildBlossoms();
  const cls = phaseCls ? ` ${phaseCls}` : '';
  if (honor) {
    return css() + `<div class="kf-shell${cls}">${blossoms}<div class="kf-layout"><div class="kf-main">${content}</div>${honor}</div></div>`;
  }
  return css() + `<div class="kf-shell${cls}">${blossoms}<div class="kf-main" style="max-height:none">${content}</div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildCrouchingCourtneyTitleCard(ep) {
  const cc = ep.crouchingCourtney;
  if (!cc) return '';

  const allPlayers = cc.phase1.pairs.flatMap(p => [p.trainer, p.fighter]);
  if (cc.phase1.spy) allPlayers.push(cc.phase1.spy);

  const roster = allPlayers.map(name =>
    `<div class="kf-hanko" style="margin:4px">
      <img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
    </div>`
  ).join('');

  return _kfShell(`
    <div class="kf-cover">
      <div class="kf-subtitle">TOTAL DRAMA ACTION PRESENTS</div>
      <div class="kf-torii">⛩️</div>
      <div class="kf-title">WAY OF THE<br>WARRIOR</div>
      <div class="kf-subtitle" style="color:var(--jade);margin-top:8px">A ${host().toUpperCase()} PRODUCTION</div>
      <div style="margin:16px auto;width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),var(--sun-red),transparent)"></div>
      <div style="font-size:11px;color:rgba(245,230,200,0.4);letter-spacing:4px;font-family:'Cinzel',serif">
        TRAINING &middot; ROBOT FIGHT &middot; MOUNTAIN CLIMB
      </div>
      <div style="margin-top:10px;font-family:'Cinzel',serif;font-size:14px;color:rgba(245,230,200,0.6);font-style:italic">
        "Be one with the pain."
      </div>
      <div class="kf-cover-roster" style="margin-top:20px">${roster}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 1: TRAINING
// ══════════════════════════════════════════════════════════════
export function rpBuildCrouchingCourtneyTraining(ep) {
  const cc = ep.crouchingCourtney;
  if (!cc) return '';
  const stateKey = 'kf-training';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Chris introduction
  steps.push(`<div class="kf-narration" style="border-color:var(--gold)">
    ${host()} descends from above in a lotus position, wearing a silk robe. "Today's genre: KUNG FU BIOPIC." He lands, strikes a pose, and nearly falls over.
    "Every kung fu movie needs a fighter and a trainer. So pair up — one of you fights in the robot suit, the other controls the joysticks. Choose wisely."
  </div>`);

  // Each pair pick as its own step with narration
  for (const p of cc.phase1.pairs) {
    steps.push(`<div class="kf-player-card" style="flex-wrap:wrap">
      <div class="kf-hanko"><img src="assets/avatars/${slug(p.trainer)}.png" alt="${p.trainer}" onerror="this.style.display='none'"></div>
      <div style="font-size:18px;color:var(--gold)">→</div>
      <div class="kf-hanko"><img src="assets/avatars/${slug(p.fighter)}.png" alt="${p.fighter}" onerror="this.style.display='none'"></div>
      <div style="flex:1;min-width:200px">
        <div class="kf-player-name">🎓 ${p.trainer} → 🥊 ${p.fighter}</div>
        <div class="kf-player-detail" style="margin-top:4px">${p.pickText || 'Trainer → Fighter'}</div>
      </div>
    </div>`);
  }

  // Spy reveal
  if (cc.phase1.spy) {
    steps.push(`<div class="kf-player-card" style="border-color:rgba(212,160,23,0.3);background:rgba(212,160,23,0.04)">
      <div class="kf-hanko" style="border-color:var(--gold)"><img src="assets/avatars/${slug(cc.phase1.spy)}.png" alt="${cc.phase1.spy}" onerror="this.style.display='none'"></div>
      <div style="flex:1">
        <div class="kf-player-name" style="color:var(--gold)">🕵️ ${cc.phase1.spy}</div>
        <div class="kf-player-detail" style="color:rgba(212,160,23,0.6)">Absent from training... suspiciously</div>
      </div>
    </div>`);
  }

  // Spy sabotages
  for (const sab of cc.phase1.spySabotages) {
    const color = sab.success ? 'var(--temple-red)' : 'var(--jade)';
    steps.push(`<div class="kf-narration" style="border-color:${color}">
      <span style="font-size:14px;margin-right:4px">${sab.success ? '🕵️' : '❌'}</span> ${sab.text}
    </div>`);
  }

  // Training beats
  for (let i = 0; i < cc.phase1.training.length; i++) {
    const beat = TRAINING_BEATS[i];
    const beatHtml = cc.phase1.training[i].map(r => {
      const styleBadge = r.style === 'harsh-success' ? '<span style="font-size:8px;padding:1px 5px;border:1px solid var(--sun-red);color:var(--sun-red);border-radius:2px;font-family:Cinzel,serif;letter-spacing:1px">HARSH ✓</span>'
        : r.style === 'harsh-fail' ? '<span style="font-size:8px;padding:1px 5px;border:1px solid #888;color:#888;border-radius:2px;font-family:Cinzel,serif;letter-spacing:1px">HARSH ✗</span>'
        : r.style === 'showmance' ? '<span style="font-size:8px;padding:1px 5px;border:1px solid var(--cherry);color:var(--cherry);border-radius:2px;font-family:Cinzel,serif;letter-spacing:1px">💕</span>'
        : '<span style="font-size:8px;padding:1px 5px;border:1px solid var(--jade);color:var(--jade);border-radius:2px;font-family:Cinzel,serif;letter-spacing:1px">SAFE</span>';
      const borderColor = r.style === 'harsh-success' ? 'var(--sun-red)' : r.style === 'harsh-fail' ? '#888' : r.style === 'showmance' ? 'var(--cherry)' : 'var(--gold)';
      return `<div class="kf-player-card" style="border-color:${borderColor}">
        <div class="kf-hanko"><img src="assets/avatars/${slug(r.fighter)}.png" alt="${r.fighter}" onerror="this.style.display='none'"></div>
        <div style="flex:1">
          <div class="kf-player-name">${r.fighter} ${styleBadge} ${r.trainer ? `<span style="font-size:9px;color:rgba(26,26,26,0.4)">by ${r.trainer}</span>` : ''}</div>
          <div class="kf-player-detail">${r.text}</div>
        </div>
        <div class="kf-player-score">${r.score}</div>
      </div>`;
    }).join('');
    steps.push(`<div>
      <div class="kf-beat-header">
        <div class="kf-beat-icon">${beat.icon}</div>
        <div>
          <div class="kf-beat-name">${beat.name}</div>
          <div class="kf-beat-desc">${beat.desc}</div>
        </div>
      </div>
      ${beatHtml}
    </div>`);

    // Social events after this beat
    const beatSocial = cc.phase1.beatEvents?.[i] || [];
    if (beatSocial.length) {
      steps.push(`<div>${beatSocial.map(evt => _buildSocialCard(evt)).join('')}</div>`);
    }
  }

  // Per-beat social events are rendered BETWEEN the beat cards above
  // (they were already interleaved in the steps array via beatEvents)

  const totalSteps = steps.length;
  let html = `<div class="kf-phase-title">🥋 Phase 1: Training Montage</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="kf-step-training-${i}" class="${i > revIdx ? 'kf-step-hidden' : 'kf-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="kf-controls-training" class="kf-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="kf-btn" onclick="crouchingCourtneyRevealNext('kf-training',${totalSteps})">🥋 Train</button>
    <button class="kf-btn" onclick="crouchingCourtneyRevealAll('kf-training',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="kf-done-training" class="kf-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Cinzel',serif;font-size:16px;color:var(--gold);letter-spacing:3px">TRAINING COMPLETE</div>
  </div>`;

  return _kfShell(html, ep, 1, 'kf-phase-dojo');
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 2: ROBOT FIGHT
// ══════════════════════════════════════════════════════════════
export function rpBuildCrouchingCourtneyFight(ep) {
  const cc = ep.crouchingCourtney;
  if (!cc) return '';
  if (!cc.phase2?.fights?.length) return '<div class="kf-shell kf-phase-arena"><div class="kf-main"><div class="kf-phase-title">🤖 Phase 2: Robot Fight</div><div class="kf-narration">No fights to display.</div></div></div>';
  const stateKey = 'kf-fight';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  for (let fi = 0; fi < cc.phase2.fights.length; fi++) {
    const fight = cc.phase2.fights[fi];

    // Fight header + VS card
    steps.push(`<div>
      <div class="kf-beat-header" style="border-color:var(--sun-crimson)">
        <div class="kf-beat-icon">⚔️</div>
        <div>
          <div class="kf-beat-name">FIGHT ${fi + 1} of ${cc.phase2.fights.length}</div>
          <div class="kf-beat-desc">${fight.fighters[0]} vs ${fight.fighters[1]}</div>
        </div>
      </div>
      <div class="kf-arena">
        <div class="kf-vs">
          <div class="kf-vs-side">
            <div class="kf-hanko" style="width:50px;height:50px;margin:0 auto">
              <img src="assets/avatars/${slug(fight.fighters[0])}.png" alt="${fight.fighters[0]}" style="width:42px;height:42px" onerror="this.style.display='none'">
            </div>
            <div style="font-family:'Cinzel',serif;font-weight:700;font-size:13px;color:var(--parchment);margin-top:6px">${fight.fighters[0]}</div>
            <div style="font-size:9px;color:rgba(245,230,200,0.5)">${fight.trainers[0] ? `🎓 ${fight.trainers[0]}` : '⚡ Solo'}</div>
          </div>
          <div class="kf-vs-text">VS</div>
          <div class="kf-vs-side">
            <div class="kf-hanko" style="width:50px;height:50px;margin:0 auto">
              <img src="assets/avatars/${slug(fight.fighters[1])}.png" alt="${fight.fighters[1]}" style="width:42px;height:42px" onerror="this.style.display='none'">
            </div>
            <div style="font-family:'Cinzel',serif;font-weight:700;font-size:13px;color:var(--parchment);margin-top:6px">${fight.fighters[1]}</div>
            <div style="font-size:9px;color:rgba(245,230,200,0.5)">${fight.trainers[1] ? `🎓 ${fight.trainers[1]}` : '⚡ Solo'}</div>
          </div>
        </div>
      </div>
    </div>`);

    // Exchanges — fighting game style
    for (const ex of fight.exchanges) {
      const aHPPct = Math.max(0, ex.aHP);
      const bHPPct = Math.max(0, ex.bHP);
      const aColor = aHPPct > 60 ? 'green' : aHPPct > 30 ? 'yellow' : 'red';
      const bColor = bHPPct > 60 ? 'green' : bHPPct > 30 ? 'yellow' : 'red';
      const isAWin = ex.winner === fight.fighters[0];
      const winnerName = ex.winner;
      const loserName = ex.winner === fight.fighters[0] ? fight.fighters[1] : fight.fighters[0];
      const moveIcon = ex.move?.icon || '👊';
      const moveName = ex.move?.name || 'Attack';

      steps.push(`<div class="kf-arena" style="padding:10px 14px">
        <!-- HP bars at top like a fighting game -->
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
              <img src="assets/avatars/${slug(fight.fighters[0])}.png" style="width:20px;height:20px;border-radius:50%;object-fit:contain" onerror="this.style.display='none'">
              <span style="font-family:'Cinzel',serif;font-size:10px;color:var(--parchment)">${fight.fighters[0]}</span>
            </div>
            <div class="kf-hp-bar" style="height:10px"><div class="kf-hp-fill kf-hp-${aColor}" style="width:${aHPPct}%"></div></div>
          </div>
          <div style="font-family:'Cinzel',serif;font-size:12px;color:var(--gold);flex-shrink:0">RD ${ex.exchange}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;justify-content:flex-end">
              <span style="font-family:'Cinzel',serif;font-size:10px;color:var(--parchment)">${fight.fighters[1]}</span>
              <img src="assets/avatars/${slug(fight.fighters[1])}.png" style="width:20px;height:20px;border-radius:50%;object-fit:contain" onerror="this.style.display='none'">
            </div>
            <div class="kf-hp-bar" style="height:10px"><div class="kf-hp-fill kf-hp-${bColor}" style="width:${bHPPct}%;margin-left:auto"></div></div>
          </div>
        </div>
        <!-- Move badge with burst animation -->
        <div style="text-align:center;margin:6px 0">
          <span class="kf-move-burst" style="font-size:28px;display:inline-block">${moveIcon}</span>
          <div style="margin-top:2px">
            <span style="font-family:'Cinzel',serif;font-size:12px;color:var(--gold);letter-spacing:3px;font-weight:700">${moveName.toUpperCase()}</span>
            ${ex.dmg > 0 ? `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--sun-red);margin-left:6px;font-weight:700">-${ex.dmg}HP</span>` : ''}
          </div>
        </div>
        <!-- Narration -->
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--parchment);line-height:1.6;padding:6px 0">${ex.text}</div>
        <!-- Winner indicator -->
        <div style="text-align:center;margin-top:4px">
          <span style="font-family:'Cinzel',serif;font-size:10px;color:${isAWin ? 'var(--jade)' : 'var(--sun-red)'};letter-spacing:2px;border:1px solid;padding:1px 8px;border-radius:2px">${winnerName} wins exchange</span>
        </div>
      </div>`);
    }

    // KO — show fighter AND trainer as winning pair
    const winTrainer = fight.trainers[fight.winner === fight.fighters[0] ? 0 : 1];
    steps.push(`<div class="kf-ko">
      <div style="display:flex;gap:8px;justify-content:center;align-items:center">
        <div class="kf-hanko" style="width:56px;height:56px;border-color:var(--gold)">
          <img src="assets/avatars/${slug(fight.winner)}.png" alt="${fight.winner}" style="width:48px;height:48px;border-radius:50%;object-fit:contain" onerror="this.style.display='none'">
        </div>
        ${winTrainer ? `<div style="font-size:16px;color:var(--gold)">+</div>
        <div class="kf-hanko" style="width:40px;height:40px;border-color:var(--gold)">
          <img src="assets/avatars/${slug(winTrainer)}.png" alt="${winTrainer}" style="width:34px;height:34px;border-radius:50%;object-fit:contain" onerror="this.style.display='none'">
        </div>` : ''}
      </div>
      <div style="font-family:'Cinzel',serif;font-weight:900;font-size:20px;color:var(--gold);margin-top:6px;letter-spacing:3px;text-shadow:0 0 12px rgba(212,160,23,0.4)">${fight.winner}${winTrainer ? ` & ${winTrainer}` : ''} WIN!</div>
      <div class="kf-player-detail" style="margin-top:4px">${fight.koText}</div>
    </div>`);

    // Per-fight social events
    if (fight.socialEvents?.length) {
      steps.push(`<div>${fight.socialEvents.map(evt => _buildSocialCard(evt)).join('')}</div>`);
    }
  }

  // Fight summary — champion announcement
  const wins = {};
  cc.phase2.bracket?.forEach(n => { wins[n] = 0; });
  cc.phase2.fights.forEach(f => { wins[f.winner] = (wins[f.winner] || 0) + 1; });
  const ranked = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  const champion = cc.phase2.champion || ranked[0]?.[0];

  let summaryHtml = ranked.map(([name, w], idx) => {
    const trainer = cc.phase1.pairs.find(p => p.fighter === name)?.trainer;
    return `<div class="kf-player-card" style="${name === champion ? 'border-color:var(--gold)' : ''}">
      <div class="kf-hanko" style="${name === champion ? 'border-color:var(--gold)' : ''}"><img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'"></div>
      <div style="flex:1">
        <div class="kf-player-name">${name} ${name === champion ? '👑' : ''}</div>
        <div class="kf-player-detail">${w} win${w !== 1 ? 's' : ''}${trainer ? ` — trained by ${trainer}` : ''}</div>
      </div>
      <div class="kf-player-score" style="color:${name === champion ? 'var(--gold)' : 'var(--sun-red)'}">${w}W</div>
    </div>`;
  }).join('');

  steps.push(`<div>
    <div class="kf-beat-header" style="border-color:var(--gold)">
      <div class="kf-beat-icon">🏆</div>
      <div>
        <div class="kf-beat-name" style="color:var(--gold)">FIGHT RESULTS</div>
        <div class="kf-beat-desc">${champion} earns a head start on the mountain climb!</div>
      </div>
    </div>
    ${summaryHtml}
    <div class="kf-narration" style="border-color:var(--gold)">
      ${host()}: "${champion}${cc.phase2.championTrainer ? ` and ${pronouns(champion).posAdj} trainer ${cc.phase2.championTrainer}` : ''} dominated the arena! As a reward, they BOTH get lighter water cups for the mountain climb. Everyone else carries the full weight."
    </div>
  </div>`);

  // Post-fight social events
  if (cc.phase2.events?.length) {
    steps.push(`<div>${cc.phase2.events.map(evt => _buildSocialCard(evt)).join('')}</div>`);
  }

  const totalSteps = steps.length;
  let html = `<div class="kf-phase-title">🤖 Phase 2: Robot Fight</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="kf-step-fight-${i}" class="${i > revIdx ? 'kf-step-hidden' : 'kf-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="kf-controls-fight" class="kf-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="kf-btn" onclick="crouchingCourtneyRevealNext('kf-fight',${totalSteps})">⚔️ Fight</button>
    <button class="kf-btn" onclick="crouchingCourtneyRevealAll('kf-fight',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="kf-done-fight" class="kf-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Cinzel',serif;font-size:16px;color:var(--gold);letter-spacing:3px">ONWARD TO THE MOUNTAIN</div>
  </div>`;

  return _kfShell(html, ep, 2, 'kf-phase-arena');
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 3: MOUNTAIN CLIMB
// ══════════════════════════════════════════════════════════════
export function rpBuildCrouchingCourtneyClimb(ep) {
  const cc = ep.crouchingCourtney;
  if (!cc) return '';
  const stateKey = 'kf-climb';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Climber lineup
  const climberRoster = cc.phase3.climbers.map(n =>
    `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin:4px">
      <div class="kf-hanko"><img src="assets/avatars/${slug(n)}.png" alt="${n}" onerror="this.style.display='none'"></div>
      <div style="font-size:9px;color:var(--parchment)">${n.split(' ').pop()}</div>
    </div>`
  ).join('');
  steps.push(`<div style="text-align:center">
    <div style="font-family:'Cinzel',serif;font-size:13px;color:var(--jade);letter-spacing:2px;margin-bottom:8px">⛰️ THE CLIMBERS</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${climberRoster}</div>
  </div>`);

  // Teams
  for (const team of cc.phase3.teams) {
    steps.push(`<div class="kf-narration" style="border-color:var(--jade)">
      <span style="font-size:14px;margin-right:4px">🤝</span> ${team.text}
    </div>`);
  }

  // Stages — ascent, summit, descent
  for (let i = 0; i < cc.phase3.stages.length; i++) {
    const stage = CLIMB_STAGES[i] || { name: 'Descent', icon: '🏃' };
    const isSummit = i === 3;
    const isDescent = i === 4;
    const stageResults = cc.phase3.stages[i];

    let stageHtml;

    if (isDescent) {
      // Descent — steal attempts + final holder
      stageHtml = stageResults.map(r => {
        if (r.type === 'steal' && r.success) {
          return `<div class="kf-player-card kf-betrayal kf-steal-flash" style="border-color:var(--sun-red)">
            <div class="kf-hanko" style="border-color:var(--sun-red)"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
            <div style="flex:1">
              <div class="kf-player-name">${r.name} <span class="kf-team-badge kf-team-badge-betray">STOLEN!</span></div>
              <div class="kf-player-detail">${r.text}</div>
            </div>
            <div style="font-size:24px">🌳</div>
          </div>`;
        } else if (r.type === 'steal' && !r.success) {
          return `<div class="kf-player-card" style="opacity:0.7;border-color:rgba(100,100,100,0.3)">
            <div class="kf-hanko"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
            <div style="flex:1">
              <div class="kf-player-name">${r.name}</div>
              <div class="kf-player-detail">${r.text}</div>
            </div>
            <div style="font-size:18px;opacity:0.3">❌</div>
          </div>`;
        } else if (r.type === 'finish') {
          return `<div class="kf-player-card" style="border-color:var(--gold);background:rgba(212,160,23,0.06)">
            <div class="kf-hanko" style="border-color:var(--gold)"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
            <div style="flex:1">
              <div class="kf-player-name" style="color:var(--gold)">${r.name} 🌳</div>
              <div class="kf-player-detail">${r.text}</div>
            </div>
            <div style="font-size:28px">🏆</div>
          </div>`;
        }
        return '';
      }).join('');
    } else if (isSummit) {
      // Summit — Sasquatchanakwa boss fight with dramatic styling
      stageHtml = stageResults.map(r => {
        const isWin = r.success;
        const isBonsaiGrab = isWin && r.name === cc.phase3.bonsaiHolder;
        const isChaser = isWin && r.name !== cc.phase3.bonsaiHolder;
        const cardCls = isBonsaiGrab ? 'kf-boss-entrance' : '';
        return `<div class="kf-player-card ${cardCls}" style="border-color:${isWin ? 'var(--jade)' : 'var(--sun-red)'}${isBonsaiGrab ? ';box-shadow:0 0 20px rgba(39,174,96,0.2)' : ''}">
          <div class="kf-hanko" style="border-color:${isWin ? 'var(--jade)' : 'var(--sun-red)'}"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
          <div style="flex:1">
            <div class="kf-player-name">${r.name} ${isBonsaiGrab ? '<span class="kf-bonsai-grab" style="font-size:18px">🌳</span>' : isChaser ? '🏃' : ''}</div>
            <div class="kf-player-detail">${r.text}</div>
          </div>
          <div style="font-size:28px">${isBonsaiGrab ? '🌳' : isChaser ? '🏃' : '💀'}</div>
        </div>`;
      }).join('');
    } else {
      // Ascent stages — water cups
      stageHtml = stageResults.map(r => {
        if (r.eliminated) {
          return `<div class="kf-player-card" style="opacity:0.4;border-color:var(--sun-red)">
            <div class="kf-hanko" style="opacity:0.5"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
            <div style="flex:1"><div class="kf-player-name" style="text-decoration:line-through">${r.name}</div><div class="kf-player-detail">${r.text}</div></div>
            <div class="kf-water-cup"><div class="kf-water-cup-fill kf-water-danger" style="height:0%"></div></div>
          </div>`;
        }
        const waterPct = Math.max(0, r.water || 0);
        const isDanger = waterPct <= 40;
        return `<div class="kf-player-card">
          <div class="kf-hanko"><img src="assets/avatars/${slug(r.name)}.png" alt="${r.name}" onerror="this.style.display='none'"></div>
          <div style="flex:1">
            <div class="kf-player-name">${r.name} ${r.isTeamed ? '<span class="kf-team-badge kf-team-badge-ally">🤝 TEAM</span>' : ''}</div>
            <div class="kf-player-detail">${r.text}</div>
          </div>
          <div class="kf-water-cup"><div class="kf-water-cup-fill ${isDanger ? 'kf-water-danger' : ''}" style="height:${Math.min(100, waterPct)}%"></div></div>
        </div>`;
      }).join('');

      // Betrayals at stage 2
      if (i === 2 && cc.phase3.betrayals.length) {
        const stageBetrayal = cc.phase3.betrayals[0];
        stageHtml = `<div class="kf-player-card kf-betrayal" style="border-color:var(--sun-red)">
          <div class="kf-hanko" style="border-color:var(--sun-red)"><img src="assets/avatars/${slug(stageBetrayal.betrayer)}.png" alt="${stageBetrayal.betrayer}" onerror="this.style.display='none'"></div>
          <div style="flex:1">
            <div class="kf-player-name">${stageBetrayal.betrayer} <span class="kf-team-badge kf-team-badge-betray">BETRAYAL</span></div>
            <div class="kf-player-detail">${stageBetrayal.text}</div>
          </div>
        </div>` + stageHtml;
      }
    }

    const stageColor = isDescent ? 'var(--gold)' : isSummit ? 'var(--sun-red)' : 'var(--jade)';
    steps.push(`<div class="kf-stage ${isSummit ? 'kf-stage-summit' : ''} ${isDescent ? 'kf-stage-summit' : ''}">
      <div class="kf-stage-marker" style="${isSummit || isDescent ? 'border-color:var(--sun-red)' : ''}">${stage.icon}</div>
      <div class="kf-beat-header" style="border-color:${stageColor}">
        <div class="kf-beat-name" style="color:${stageColor}">${stage.name}</div>
      </div>
      ${stageHtml}
    </div>`);
  }

  // Winner
  if (cc.immunityWinner) {
    steps.push(`<div style="text-align:center;padding:20px;position:relative;
      background:radial-gradient(circle at 50% 50%,rgba(212,160,23,0.1) 0%,transparent 60%);
      border:2px solid var(--gold);border-radius:4px">
      <div class="kf-torii" style="opacity:0.1;font-size:32px">⛩️</div>
      <div class="kf-hanko" style="width:64px;height:64px;margin:0 auto;border-color:var(--gold)">
        <img src="assets/avatars/${slug(cc.immunityWinner)}.png" alt="${cc.immunityWinner}" style="width:56px;height:56px;border-radius:50%;object-fit:contain" onerror="this.style.display='none'">
      </div>
      <div class="kf-title" style="font-size:24px;margin-top:10px">IMMUNITY</div>
      <div style="font-family:'Cinzel',serif;font-size:18px;color:var(--gold);margin-top:4px;letter-spacing:2px">${cc.immunityWinner}</div>
      <div style="margin:8px auto;width:40%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)"></div>
      <div class="kf-player-detail" style="margin-top:4px;color:rgba(245,230,200,0.6)">${cc.phase3.finalHolder && cc.phase3.finalHolder !== cc.phase3.bonsaiHolder ? 'Stole the bonsai and outran everyone down the mountain!' : 'Grabbed the bonsai and brought it home!'} 🌳 The true warrior.</div>
    </div>`);
  }


  const totalSteps = steps.length;
  let html = `<div class="kf-phase-title">⛰️ Phase 3: Mountain Climb</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="kf-step-climb-${i}" class="${i > revIdx ? 'kf-step-hidden' : 'kf-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="kf-controls-climb" class="kf-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="kf-btn" onclick="crouchingCourtneyRevealNext('kf-climb',${totalSteps})">⛰️ Climb</button>
    <button class="kf-btn" onclick="crouchingCourtneyRevealAll('kf-climb',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="kf-done-climb" class="kf-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Cinzel',serif;font-size:16px;color:var(--jade);letter-spacing:3px">CHALLENGE COMPLETE</div>
  </div>`;

  return _kfShell(html, ep, 3, 'kf-phase-mountain');
}

// ══════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
export function crouchingCourtneyRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('kf-', '');
  const el = document.getElementById(`kf-step-${suffix}-${state.idx}`);
  if (el) {
    el.classList.remove('kf-step-hidden');
    el.classList.add('kf-step-revealing');
    el.style.display = '';
    // Impact effects on specific card types
    if (el.querySelector('.kf-betrayal') || el.querySelector('.kf-steal-flash')) {
      const shell = el.closest('.kf-shell');
      if (shell) { shell.style.animation = 'kf-screen-shake 0.4s ease-out'; setTimeout(() => shell.style.animation = '', 500); }
    }
    // Fight exchange impact
    if (el.querySelector('.kf-arena')) {
      el.querySelector('.kf-arena')?.classList.add('kf-impact');
      setTimeout(() => el.querySelector('.kf-arena')?.classList.remove('kf-impact'), 500);
    }
    // KO slam
    if (el.querySelector('.kf-ko')) {
      const shell = el.closest('.kf-shell');
      if (shell) { shell.style.animation = 'kf-screen-shake 0.3s ease-out'; setTimeout(() => shell.style.animation = '', 400); }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.classList.remove('kf-step-revealing'); el.classList.add('kf-step-visible'); }, 550);
  }
  // Live sidebar update
  _kfUpdateHonor(state.idx);
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`kf-controls-${suffix}`);
    const done = document.getElementById(`kf-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) { done.style.display = ''; done.classList.add('kf-step-revealing'); setTimeout(() => done.classList.remove('kf-step-revealing'), 550); }
  }
}

function _kfUpdateHonor(revIdx) {
  const honorCol = document.querySelector('.kf-honor-col');
  if (!honorCol || !window._kfHonorEp) return;
  const ep = window._kfHonorEp;
  // Read phase from the honor board's data attribute, not the global
  const honorInner = honorCol.querySelector('.kf-honor-inner');
  const phase = parseInt(honorCol.dataset.phase) || window._kfHonorPhase || 1;
  const newHtml = _buildHonor(ep, phase);
  const inner = newHtml.replace(/^<div class="kf-honor-col">/, '').replace(/<\/div>$/, '');
  honorCol.innerHTML = inner;
  // Re-set the data attribute
  const newCol = document.querySelector('.kf-honor-col');
  if (newCol) newCol.dataset.phase = phase;
}

export function crouchingCourtneyRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('kf-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`kf-step-${suffix}-${i}`);
    if (el) { el.classList.remove('kf-step-hidden'); el.classList.add('kf-step-visible'); el.style.display = ''; }
  }
  state.idx = totalSteps - 1;
  _kfUpdateHonor(state.idx);
  const controls = document.getElementById(`kf-controls-${suffix}`);
  const done = document.getElementById(`kf-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
}

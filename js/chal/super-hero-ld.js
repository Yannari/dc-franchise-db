// js/chal/super-hero-ld.js — Super Hero-ld superhero challenge (post-merge)
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
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

// ══════════════════════════════════════════════════════════════
// HERO GENERATION
// ══════════════════════════════════════════════════════════════
const POWER_TYPES = {
  fire:    { icon: '🔥', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', beats: 'earth', losesTo: 'water',
    names: ['Inferno', 'Blaze Master', 'Pyro Punk', 'Flame Fist', 'Burninator', 'The Human Torch 2.0'],
    powers: ['fire blasts', 'heat vision', 'spontaneous combustion', 'flame shield'] },
  water:   { icon: '🌊', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', beats: 'fire', losesTo: 'earth',
    names: ['Tidal Force', 'Aqua Strike', 'Tsunami Kid', 'Deep Current', 'Riptide', 'Splash Down'],
    powers: ['tidal wave', 'hydro cannon', 'water shield', 'pressure blast'] },
  earth:   { icon: '🪨', color: '#a16207', glow: 'rgba(161,98,7,0.3)', beats: 'tech', losesTo: 'fire',
    names: ['Rock Solid', 'Quake Maker', 'Iron Core', 'Bedrock', 'Seismic Slam', 'The Boulder'],
    powers: ['earthquake stomp', 'stone armor', 'ground pound', 'rock wall'] },
  psychic: { icon: '🧠', color: '#a855f7', glow: 'rgba(168,85,247,0.3)', beats: 'shadow', losesTo: 'tech',
    names: ['Mind Melter', 'Professor Brainwave', 'Psy-Clone', 'Neuro Knight', 'Cerebro Kid', 'The Thought Thief'],
    powers: ['telekinesis', 'mind reading', 'psychic blast', 'brain freeze ray'] },
  tech:    { icon: '⚙️', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', beats: 'psychic', losesTo: 'earth',
    names: ['Gadget Guy', 'Tech-Tonic', 'Widget Woman', 'Circuit Breaker', 'Hack Attack', 'The Inventor'],
    powers: ['utility belt', 'gadget arm', 'drone swarm', 'EMP pulse'] },
  shadow:  { icon: '🌑', color: '#6b21a8', glow: 'rgba(107,33,168,0.3)', beats: 'water', losesTo: 'psychic',
    names: ['Night Stalker', 'Phantom', 'Dark Veil', 'Shade Walker', 'Void Strike', 'The Eclipse'],
    powers: ['shadow step', 'darkness cloak', 'void blast', 'fear aura'] },
};

const ORIGIN_STORIES = {
  villain: [n => `${n} was bitten by a radioactive ego. The power went straight to ${pronouns(n).posAdj} head.`],
  mastermind: [n => `${n} built the suit in a cave. With a box of scraps. And an evil plan.`],
  schemer: [n => `${n}'s power awakened during a particularly devious scheme. Convenient.`],
  hero: [n => `${n} gained powers after saving a bus full of orphans. Obviously.`],
  'loyal-soldier': [n => `${n} volunteered for the super-soldier program. First in line.`],
  'social-butterfly': [n => `${n}'s power manifested at a party. The BEST party.`],
  'challenge-beast': [n => `${n} was already superhuman. The costume is just for show.`],
  hothead: [n => `${n}'s powers activate when angry. Which is always.`],
  wildcard: [n => `${n} got powers from a vending machine. Nobody knows how.`],
  'chaos-agent': [n => `${n}'s powers are unpredictable. Even to ${pronouns(n).obj}.`],
  floater: [n => `${n} may or may not have powers. Nobody's checked.`],
  underdog: [n => `${n} was told ${pronouns(n).sub} would never be a hero. Watch this.`],
  goat: [n => `${n} found the costume in a dumpster. It still smells.`],
  'perceptive-player': [n => `${n} sees everything. EVERYTHING. It's unsettling.`],
  showmancer: [n => `${n}'s powers only work when someone cute is watching.`],
};

const CATCHPHRASES = [
  'It\'s hero time!', 'You won\'t like me when I\'m SUPER.', 'Justice never sleeps!',
  'Fear my SPANDEX!', 'With great power comes great... me.', 'I didn\'t choose the cape life.',
  'KAPOW! ...Did that work?', 'Evil doesn\'t stand a chance. Probably.',
  'My lawyer says I\'m legally a hero.', 'Is this thing on?',
];

const POWER_DEMO_TEXT = {
  fire: [
    (p, pr) => `${p} shot "fire" from ${pr.posAdj} hands. It was a lighter taped to ${pr.posAdj} glove. Still impressive.`,
    (p, pr) => `${p}'s "heat vision" was just squinting really hard. The sun did the rest.`,
  ],
  water: [
    (p, pr) => `${p} blasted a "tidal wave" from a hidden garden hose. Chef got soaked. "THAT WAS MY GOOD APRON!"`,
    (p, pr) => `${p} summoned "the ocean's fury." It was a water balloon. But the form was impeccable.`,
  ],
  earth: [
    (p, pr) => `${p} stomped the ground for an "earthquake." The stage wobbled. It was already broken.`,
    (p, pr) => `${p} picked up a boulder. It was styrofoam. But ${pr.Sub} lifted it with CONVICTION.`,
  ],
  psychic: [
    (p, pr) => `${p} "read" ${host()}'s mind. "You're thinking about... hair gel." ${host()}: "...Lucky guess."`,
    (p, pr) => `${p} stared at a prop boulder, pretending to move it with ${pr.posAdj} mind. It didn't move. "It's shy."`,
  ],
  tech: [
    (p, pr) => `${p} pulled out a grappling hook. It worked! Then the rope snapped. "Prototype."`,
    (p, pr) => `${p} activated ${pr.posAdj} "drone swarm." One RC helicopter flew into a tree.`,
  ],
  shadow: [
    (p, pr) => `${p} vanished behind a smoke bomb. Reappeared coughing. "That was... intentional."`,
    (p, pr) => `${p} demonstrated "shadow step" by turning off the lights and moving three feet. Terrifying.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// VILLAIN SABOTAGE
// ══════════════════════════════════════════════════════════════
const SABOTAGE_TEXT = {
  costume: [
    (p, pr) => `Dander Boy scratched ${p}'s costume to shreds! ${p}: "That CAT is EVIL!"`,
    (p, pr) => `Pythonicus swapped ${p}'s fabric for toilet paper. "That's not spandex..."`,
    (p, pr) => `Pythonicus electrified ${p}'s sewing machine! ZAP! The costume has burn marks now.`,
    (p, pr) => `Dander Boy sat on ${p}'s cape and refused to move. ${p} lost precious time.`,
  ],
  costumeDodge: [
    (p, pr) => `Pythonicus lunged at ${p}'s costume but ${p} saw it coming and blocked. "NOT TODAY!"`,
    (p, pr) => `Dander Boy tried to scratch ${p}'s outfit but ${p} sprayed water. Cat defeated.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// COSTUME CONTEST NARRATION
// ══════════════════════════════════════════════════════════════
const ENTRANCE_TEXT = [
  (h, p) => `${h} grabbed the mic. "NEXT UP..." The lights dimmed. A spotlight hit the stage. "...${p}!"`,
  (h, p) => `"Ladies and gentlemen..." ${h} gestured dramatically. "Presenting... ${p}!"`,
  (h, p) => `${h}: "Alright, let's see what ${p} has cooked up." The curtain pulled back.`,
  (h, p) => `A drumroll echoed across the set. ${h}: "Give it up for... ${p}!" Smoke machines activated.`,
  (h, p) => `${h} checked his clipboard. "Next contestant: ${p}." He looked up. His eyebrows went up too.`,
];

const COSTUME_DESC_TEXT = {
  fire: [
    (p, hero, pr) => `${p} burst through the curtain in a flame-patterned bodysuit. Orange, red, yellow — the whole inferno.`,
    (p, hero, pr) => `${p} appeared in a red-hot costume with flame decals and heat-shimmer fabric. ${pr.Sub} snapped ${pr.posAdj} fingers. "Flame on." Nothing happened. "...Flame on?"`,
  ],
  water: [
    (p, hero, pr) => `${p} glided out in a shimmering blue-and-teal suit that caught the light like ocean waves. Water droplets on the shoulders. Majestic.`,
    (p, hero, pr) => `${p} surfaced from backstage in a deep blue bodysuit with wave patterns. A trident prop completed the look. "Fear the tide."`,
  ],
  earth: [
    (p, hero, pr) => `${p} lumbered out in a brown-and-gold armored suit. Heavy. Thick. ${pr.Sub} looked like a walking fortress.`,
    (p, hero, pr) => `${p} clanked onto the stage in homemade rock-plating. "Hit me." ${pr.Sub} meant it.`,
  ],
  psychic: [
    (p, hero, pr) => `${p} floated out in a purple hooded cloak with glowing eye symbols sewn into the fabric. Mysterious.`,
    (p, hero, pr) => `${p} emerged in a sleek violet bodysuit with a crystal headband. ${pr.Sub} pressed two fingers to ${pr.posAdj} temple. "I know what you're thinking."`,
  ],
  tech: [
    (p, hero, pr) => `${p} walked out loaded with gadgets — utility belt, wrist launcher, what appeared to be a working grappling hook.`,
    (p, hero, pr) => `${p} stepped out in a techy cyan-and-silver suit covered in pockets, pouches, and blinking LEDs.`,
  ],
  shadow: [
    (p, hero, pr) => `${p} materialized from actual darkness. Nobody saw ${pr.obj} arrive. The shadows just... parted.`,
    (p, hero, pr) => `${p} crept out in a pitch-black suit with purple trim. A hood obscured ${pr.posAdj} face. "You can't fight what you can't see."`,
  ],
};

const CROWD_REACT_TEXT = {
  great: [
    (p) => `The crowd erupted. Jaws dropped. Someone whispered, "OK, ${p} actually looks like a real superhero."`,
    (p) => `Gasps. Actual gasps. ${p}'s costume was THAT good. Even Chef stopped sabotaging to stare.`,
  ],
  good: [
    (p) => `Solid applause. A few nods. ${p} looked the part.`,
    (p) => `The crowd clapped. Not a standing ovation, but genuine approval.`,
  ],
  mid: [
    (p) => `Polite clapping. A few confused looks. "Is that... supposed to be...?" It was.`,
    (p) => `Mixed reactions. Some applause, some side-eye. ${p} chose to focus on the applause.`,
  ],
  bad: [
    (p) => `Silence. Then someone coughed. ${p} tried to pose harder. It didn't help.`,
    (p) => `A single cricket chirped. ${p}'s costume was... a choice. A bold, bad choice.`,
  ],
};

const CHRIS_JUDGE_TEXT = {
  great: [
    (h, p, hero, score) => `${h} whistled. "${hero.heroName}? ${hero.power}? ${score}/10. I'm IMPRESSED."`,
    (h, p, hero, score) => `"Now THAT'S a superhero!" ${h} gave ${hero.heroName} a ${score}/10. "${p} gets it."`,
  ],
  good: [
    (h, p, hero, score) => `${h} nodded. "${hero.heroName}. Solid. ${score}/10."`,
    (h, p, hero, score) => `"Not bad, ${p}. ${hero.power} is creative." ${h} scribbled ${score}/10.`,
  ],
  mid: [
    (h, p, hero, score) => `${h} squinted. "${hero.heroName}? Really? ${score}/10."`,
    (h, p, hero, score) => `"It's... fine." ${h} shrugged. ${score}/10 for ${hero.heroName}.`,
  ],
  bad: [
    (h, p, hero, score) => `${h} covered his eyes. "${hero.heroName}? That's not a hero, that's a HR violation. ${score}/10."`,
    (h, p, hero, score) => `"What IS that?" ${h} stared at ${p}'s costume. ${score}/10. Generous.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// HERO GENERATION
// ══════════════════════════════════════════════════════════════
const ARCHETYPE_PRIORITY_TYPE = {
  villain: 'shadow', mastermind: 'psychic',
  hothead: 'fire', 'challenge-beast': 'fire',
  hero: 'water', 'loyal-soldier': 'earth', underdog: 'earth', goat: 'earth',
  floater: 'water', 'social-butterfly': 'water', showmancer: 'water',
  'perceptive-player': 'psychic',
  'chaos-agent': 'fire', wildcard: 'shadow',
};

function _getStatScore(name, type) {
  const s = pStats(name);
  const pairs = { fire: s.boldness + s.physical, water: s.endurance + s.intuition, earth: s.physical + s.endurance,
    psychic: s.mental + s.intuition, tech: s.strategic + s.mental, shadow: s.boldness + s.strategic };
  return (pairs[type] || 0) + noise(1);
}

function generateHeroes(activePlayers) {
  const baseCap = Math.max(2, Math.ceil(activePlayers.length / 6));
  const typeCounts = { fire: 0, water: 0, earth: 0, psychic: 0, tech: 0, shadow: 0 };
  const typeCap = { fire: baseCap, water: baseCap, earth: baseCap, psychic: baseCap, tech: baseCap, shadow: baseCap + 1 };
  const usedNames = {};
  Object.keys(POWER_TYPES).forEach(t => { usedNames[t] = new Set(); });
  const assigned = {};

  // Phase 1: Priority assignments — archetypes get first dibs on their natural type
  // Strong-fit archetypes draft first (hothead→fire is stronger than hero→fire)
  const PRIORITY_WEIGHT = { hothead: 5, villain: 4, mastermind: 4, 'perceptive-player': 4, schemer: 3,
    'loyal-soldier': 3, floater: 3, 'chaos-agent': 3, wildcard: 3, 'challenge-beast': 2, hero: 2,
    underdog: 2, goat: 2, 'social-butterfly': 2, showmancer: 2 };
  const _getPriority = (name) => {
    const a = arch(name);
    if (a === 'schemer' && pStats(name).mental >= 8) return 'tech';
    return ARCHETYPE_PRIORITY_TYPE[a] || null;
  };
  const priorityPlayers = activePlayers
    .filter(name => _getPriority(name))
    .map(name => ({ name, priorityType: _getPriority(name),
      score: _getStatScore(name, ARCHETYPE_PRIORITY_TYPE[arch(name)]) + (PRIORITY_WEIGHT[arch(name)] || 0) }))
    .sort((a, b) => b.score - a.score);

  for (const { name, priorityType } of priorityPlayers) {
    if (assigned[name]) continue;
    if (typeCounts[priorityType] < (typeCap[priorityType] || baseCap)) {
      typeCounts[priorityType]++;
      assigned[name] = priorityType;
    }
  }

  // Phase 2: Remaining players draft by stat preference
  const remaining = activePlayers.filter(name => !assigned[name]);
  const allTypes = Object.keys(POWER_TYPES);
  for (const name of remaining) {
    const ranked = allTypes
      .map(t => [t, _getStatScore(name, t)])
      .sort((a, b) => b[1] - a[1]);
    let powerType = ranked[0][0];
    for (const [t] of ranked) {
      if (typeCounts[t] < (typeCap[t] || baseCap)) { powerType = t; break; }
    }
    typeCounts[powerType]++;
    assigned[name] = powerType;
  }

  // Phase 3: Build hero objects
  const heroes = {};
  for (const name of activePlayers) {
    const powerType = assigned[name];
    const pt = POWER_TYPES[powerType];
    let heroName = pick(pt.names.filter(n => !usedNames[powerType].has(n)));
    if (!heroName) heroName = pick(pt.names);
    usedNames[powerType].add(heroName);
    const power = pick(pt.powers);
    const a = arch(name);
    const origin = (ORIGIN_STORIES[a] || ORIGIN_STORIES.floater)[0](name);
    const catchphrase = pick(CATCHPHRASES);
    heroes[name] = { name, heroName, powerType, power, origin, catchphrase, icon: pt.icon, color: pt.color, glow: pt.glow };
  }
  return heroes;
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — FIGHT ENGINE
// ══════════════════════════════════════════════════════════════
const FIGHT_TEXT = {
  opening: {
    fire:    [(a, b) => `${a} hurled a searing fireball as an opener, forcing ${b} to dodge sideways!`,
             (a, b) => `${a} ignited ${pronouns(a).posAdj} fists and lunged — the air crackled with heat!`,
             (a, b) => `${a} snapped ${pronouns(a).posAdj} fingers. A ring of fire erupted between ${pronouns(a).obj} and ${b}. "Let's dance."`,
             (a, b) => `Heat poured off ${a} in waves. ${b} felt it before seeing the attack — a blazing uppercut aimed at ${pronouns(b).posAdj} jaw!`],
    water:   [(a, b) => `${a} sent a pressurized water jet screaming toward ${b}'s position!`,
             (a, b) => `${a} summoned a wave of swirling water, crashing it across the zone!`,
             (a, b) => `${a} drew moisture from the air itself — ice crystals formed on ${pronouns(a).posAdj} fingertips before launching a frozen spike!`,
             (a, b) => `Water spiraled around ${a}'s arms like twin serpents. ${b} barely had time to react before the hydro whip cracked!`],
    earth:   [(a, b) => `${a} slammed the ground — a shockwave rippled outward, cracking the pavement!`,
             (a, b) => `${a} ripped a chunk of concrete from the street and flung it like a frisbee!`,
             (a, b) => `The ground buckled under ${a}'s feet. Stone armor crawled up ${pronouns(a).posAdj} arms as ${pronouns(a).sub} charged!`,
             (a, b) => `${a} stomped once. The earth answered — a stone pillar shot up directly under ${b}'s feet!`],
    psychic: [(a, b) => `${a} locked eyes with ${b} — a visible shimmer of psychic energy arced between them!`,
             (a, b) => `${a} pressed two fingers to ${pronouns(a).posAdj} temple. ${b} felt an invisible pressure building!`,
             (a, b) => `${a} didn't move. Didn't need to. ${b}'s own fist froze mid-swing — telekinetic hold. "Going somewhere?"`,
             (a, b) => `${a}'s eyes glowed violet. Objects around them lifted off the ground — debris, trash, a mailbox — all aimed at ${b}.`],
    tech:    [(a, b) => `${a} deployed a targeting drone — a red laser dot danced across ${b}'s chest!`,
             (a, b) => `${a}'s wrist launcher clicked. A net-grenade spiraled toward ${b}!`,
             (a, b) => `${a}'s visor lit up with tactical data. Weak points highlighted. "Engaging." A micro-missile launched!`,
             (a, b) => `${a} tossed a handful of tiny spheres. They hovered, beeped, then fired stun charges at ${b} from six angles!`],
    shadow:  [(a, b) => `${a} dissolved into darkness and reappeared behind ${b} — "Boo."`,
             (a, b) => `${a} cast a wall of shadow, blinding ${b} momentarily!`,
             (a, b) => `${a} sank into ${pronouns(a).posAdj} own shadow and slithered across the ground. ${b} spun around — "Where did—" TOO LATE.`,
             (a, b) => `Darkness pooled around ${a}'s feet and spread outward. The lights flickered. ${b} could feel ${pronouns(a).obj} nearby but couldn't see a thing.`],
  },
  clash: {
    advantage: [
      (a, b, aType, bType) => `${a}'s ${POWER_TYPES[aType].icon} ${aType} power overwhelmed ${b}'s ${POWER_TYPES[bType].icon} ${bType} — a direct counter! The energy crackled and ${b} was sent skidding backward.`,
      (a, b, aType, bType) => `Type advantage! ${a}'s ${aType} tore through ${b}'s ${bType} defense like paper. ${b} slammed into a wall, dazed.`,
      (a, b, aType, bType) => `${b} tried to block but ${aType} DESTROYS ${bType}! ${a}'s attack bypassed every defense. ${b} reeled!`,
      (a, b, aType, bType) => `"You brought ${bType} against MY ${aType}?" ${a} almost laughed. The counter-element hit ${b} like a freight train.`,
    ],
    disadvantage: [
      (a, b, aType, bType) => `${a}'s ${aType} attack fizzled against ${b}'s ${bType} resistance! ${b} smirked. "Wrong element."`,
      (a, b, aType, bType) => `Bad matchup — ${a}'s ${aType} couldn't penetrate ${b}'s natural ${bType} shield. ${a} stumbled back, off-balance.`,
      (a, b, aType, bType) => `${a} fired everything — but ${bType} absorbed it all. ${b} didn't even flinch. "Is that it?"`,
      (a, b, aType, bType) => `${aType} against ${bType}? ${a} realized the mistake too late. ${b}'s counter-energy pushed ${pronouns(a).obj} back hard.`,
    ],
    neutral: [
      (a, b) => `Powers clashed in a blinding flash — neither hero gained ground! The shockwave rattled nearby windows.`,
      (a, b) => `An even exchange! Both heroes fired simultaneously. Smoke billowed. When it cleared, both were still standing.`,
      (a, b) => `Their powers collided mid-air. Equal force. Equal will. The ground cracked between them but neither moved.`,
      (a, b) => `No type advantage either way. This would come down to raw skill. Both heroes knew it.`,
    ],
  },
  endurance: [
    (a, b) => `The fight dragged on. Sweat poured. Breathing got heavier. Who could outlast whom?`,
    (a, b) => `Both heroes dug deep. Every muscle screamed. This was a war of attrition now.`,
    (a, b) => `Neither would go down. Blow after blow, block after block. The crowd held its breath.`,
    (a, b) => `Exhaustion crept in. Every power move cost more energy. This fight would be won by willpower alone.`,
  ],
  clutch: [
    (winner, loser) => `CLUTCH MOMENT! ${winner} found a second wind — eyes blazing, cape billowing — and unleashed everything!`,
    (winner, loser) => `When it looked like it was over, ${winner} SURGED. "Not. Today." A devastating combo connected!`,
    (winner, loser) => `${loser} had ${winner} cornered. Beaten. Done. But ${winner}'s eyes FLARED — a hidden reserve of power ERUPTED!`,
    (winner, loser) => `The crowd gasped. ${winner} was on one knee, about to fall. Then ${pronouns(winner).sub} looked up. Smiled. And EXPLODED forward!`,
  ],
  desperation: [
    (winner, loser) => `Desperation! ${winner} threw a wild haymaker. It shouldn't have worked. It did.`,
    (winner, loser) => `Last chance — ${winner} gambled on a risky power move. It paid off spectacularly!`,
    (winner, loser) => `Both running on fumes. ${winner} swung blind — and connected with everything ${pronouns(winner).sub} had left!`,
    (winner, loser) => `${winner} screamed and threw one final attack. Pure instinct. Pure survival. It landed.`,
  ],
  ko: [
    (winner, loser) => `${loser} crumpled. Stars everywhere. ${winner} stood over ${pronouns(loser).obj}, cape fluttering. "Stay down."`,
    (winner, loser) => `${loser} hit the ground HARD. ${winner} dusted off ${pronouns(winner).posAdj} gloves. "Next?"`,
    (winner, loser) => `DOWN! ${loser} was OUT. ${winner} struck a victory pose as the dust settled.`,
    (winner, loser) => `${loser} flew backward, crashing through a wall. ${winner} didn't even look back. Walk-away explosion energy.`,
    (winner, loser) => `${loser}'s knees buckled. The light in ${pronouns(loser).posAdj} eyes dimmed. ${winner} caught ${pronouns(loser).obj} before ${pronouns(loser).sub} hit the ground. "Good fight." Then let go.`,
  ],
  narrow: [
    (winner, loser) => `Both heroes collapsed. ${winner} managed to rise first — barely. ${loser} gave a grudging nod from the ground.`,
    (winner, loser) => `A razor-thin victory. ${winner} won, but was limping. ${loser} nearly had it.`,
    (winner, loser) => `${winner} stood on shaking legs. ${loser} reached up from the ground — "One more second and I had you." ${winner}: "But you didn't."`,
    (winner, loser) => `The closest fight of the day. ${winner} and ${loser} gave each other everything. In the end, one ounce of will separated them.`,
  ],
};

function _resolveFight(nameA, nameB, heroes, context) {
  const sA = pStats(nameA), sB = pStats(nameB);
  const hA = heroes[nameA], hB = heroes[nameB];
  const ptA = POWER_TYPES[hA.powerType], ptB = POWER_TYPES[hB.powerType];
  const injA = context?.injuries?.[nameA] || 0;
  const injB = context?.injuries?.[nameB] || 0;

  let momentum = 0;
  let boostUsed = null;
  const boosts = context?.momentumBoosts || {};
  if (boosts[nameA]) { momentum += boosts[nameA]; boostUsed = nameA; delete boosts[nameA]; }
  if (boosts[nameB]) { momentum -= boosts[nameB]; boostUsed = boostUsed || nameB; delete boosts[nameB]; }
  const exchanges = [];

  // Exchange 1: Opening Move (strategic + intuition)
  const e1a = (sA.strategic + injA) * 0.5 + sA.intuition * 0.3 + noise(3);
  const e1b = (sB.strategic + injB) * 0.5 + sB.intuition * 0.3 + noise(3);
  const e1winner = e1a >= e1b ? nameA : nameB;
  const e1shift = Math.abs(e1a - e1b) > 2 ? 2 : 1;
  momentum += (e1winner === nameA ? e1shift : -e1shift);
  const openTexts = FIGHT_TEXT.opening[e1winner === nameA ? hA.powerType : hB.powerType];
  exchanges.push({ name: 'Opening Move', stat: 'strategic + intuition', winner: e1winner, shift: e1shift,
    text: pick(openTexts)(e1winner, e1winner === nameA ? nameB : nameA) });

  // Exchange 2: Power Clash (type matchup + boldness)
  let typeBonus = 0;
  let clashText;
  if (ptA.beats === hB.powerType) {
    typeBonus = sA.boldness * 0.25;
    clashText = pick(FIGHT_TEXT.clash.advantage)(nameA, nameB, hA.powerType, hB.powerType);
  } else if (ptA.losesTo === hB.powerType) {
    typeBonus = -(sB.boldness * 0.15);
    clashText = pick(FIGHT_TEXT.clash.disadvantage)(nameA, nameB, hA.powerType, hB.powerType);
  } else {
    clashText = pick(FIGHT_TEXT.clash.neutral)(nameA, nameB);
  }
  const e2a = (sA.boldness + injA) * 0.5 + typeBonus + noise(2);
  const e2b = (sB.boldness + injB) * 0.5 + noise(2);
  const e2winner = e2a >= e2b ? nameA : nameB;
  const e2shift = Math.abs(e2a - e2b) > 2.5 ? 3 : Math.abs(e2a - e2b) > 1 ? 2 : 1;
  momentum += (e2winner === nameA ? e2shift : -e2shift);
  exchanges.push({ name: 'Power Clash', stat: 'type + boldness', winner: e2winner, shift: e2shift, text: clashText });

  // Exchange 3: Endurance Grind
  const e3a = (sA.endurance + injA) * 0.5 + sA.physical * 0.3 + noise(2);
  const e3b = (sB.endurance + injB) * 0.5 + sB.physical * 0.3 + noise(2);
  const e3winner = e3a >= e3b ? nameA : nameB;
  const e3shift = Math.abs(e3a - e3b) > 2 ? 2 : 1;
  momentum += (e3winner === nameA ? e3shift : -e3shift);
  exchanges.push({ name: 'Endurance Grind', stat: 'endurance + physical', winner: e3winner, shift: e3shift,
    text: pick(FIGHT_TEXT.endurance)(nameA, nameB) });

  // Exchange 4: Clutch Moment — only if close
  if (Math.abs(momentum) <= 2) {
    const e4a = (sA.mental + injA) * 0.4 + sA.boldness * 0.3 + noise(3);
    const e4b = (sB.mental + injB) * 0.4 + sB.boldness * 0.3 + noise(3);
    const e4winner = e4a >= e4b ? nameA : nameB;
    const e4shift = 2 + Math.floor(Math.random() * 3); // 2-4
    momentum += (e4winner === nameA ? e4shift : -e4shift);
    exchanges.push({ name: 'Clutch Moment', stat: 'mental + boldness', winner: e4winner, shift: e4shift,
      text: pick(FIGHT_TEXT.clutch)(e4winner, e4winner === nameA ? nameB : nameA) });
  }

  // Exchange 5: Desperation — only if still close
  if (Math.abs(momentum) <= 1) {
    const stats = ['physical', 'mental', 'social', 'strategic', 'boldness', 'endurance', 'intuition'];
    const randStat = pick(stats);
    const e5a = sA[randStat] * 0.5 + noise(5);
    const e5b = sB[randStat] * 0.5 + noise(5);
    const e5winner = e5a >= e5b ? nameA : nameB;
    const e5shift = 2;
    momentum += (e5winner === nameA ? e5shift : -e5shift);
    exchanges.push({ name: 'Desperation', stat: randStat, winner: e5winner, shift: e5shift,
      text: pick(FIGHT_TEXT.desperation)(e5winner, e5winner === nameA ? nameB : nameA) });
  }

  const winner = momentum >= 0 ? nameA : nameB;
  const loser = winner === nameA ? nameB : nameA;
  const narrow = Math.abs(momentum) <= 3;
  const koText = narrow ? pick(FIGHT_TEXT.narrow)(winner, loser) : pick(FIGHT_TEXT.ko)(winner, loser);
  exchanges.push({ name: 'Result', stat: '', winner, shift: 0, text: koText });

  return { winner, loser, momentum: Math.abs(momentum), exchanges, narrow, boostUsed };
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — ZONE ASSIGNMENT
// ══════════════════════════════════════════════════════════════
const ZONES = ['rooftop', 'alley', 'plaza', 'warehouse', 'bridge', 'sewers'];
const ZONE_LABELS = { rooftop: '🏗️ Rooftop', alley: '🌃 Alley', plaza: '🏛️ Plaza', warehouse: '🏭 Warehouse', bridge: '🌉 Bridge', sewers: '🕳️ Sewers' };

function _assignZones(alive, heroes, zonePicker) {
  const zones = {};
  for (const z of ZONES) zones[z] = [];

  // 3rd place costume prize: picks zone first (near allies, away from enemies)
  if (zonePicker && alive.includes(zonePicker)) {
    let bestZone = null, bestScore = -Infinity;
    for (const z of ZONES) {
      let score = 0;
      for (const other of alive) {
        if (other === zonePicker) continue;
        score += getBond(zonePicker, other) * 0.5;
      }
      score += noise(1);
      if (score > bestScore) { bestScore = score; bestZone = z; }
    }
    zones[bestZone || ZONES[0]].push(zonePicker);
    zones._zonePick = { player: zonePicker, zone: bestZone || ZONES[0] };
  }

  // High intuition players pick strategically
  const sorted = [...alive].filter(n => n !== zonePicker).sort((a, b) => (pStats(b).intuition - pStats(a).intuition + noise(2)));
  for (const name of sorted) {
    const s = pStats(name);
    if (s.intuition * 0.1 + noise(0.3) > 0.3) {
      // Strategic pick: near allies, away from enemies
      let bestZone = null, bestScore = -Infinity;
      for (const z of ZONES) {
        if (zones[z].length >= 3) continue;
        let score = 0;
        for (const other of zones[z]) {
          const bond = getBond(name, other);
          score += bond * 0.5;
        }
        score += noise(2);
        if (score > bestScore) { bestScore = score; bestZone = z; }
      }
      zones[bestZone || pick(ZONES.filter(z => zones[z].length < 3))].push(name);
    } else {
      // Random
      const available = ZONES.filter(z => zones[z].length < 3);
      zones[pick(available)].push(name);
    }
  }
  return zones;
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — BETWEEN-ROUND EVENTS
// ══════════════════════════════════════════════════════════════
const EVENT_POOL = [
  {
    id: 'alliancePact', weight: 3,
    check(alive) {
      for (const a of alive) for (const b of alive) if (a !== b && getBond(a, b) >= 3) return true;
      return false;
    },
    apply(alive, heroes, allKOs) {
      const pairs = [];
      for (const a of alive) for (const b of alive) if (a < b && getBond(a, b) >= 3) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, 0.5);
      const prA = pronouns(a);
      return { type: 'alliancePact', players: [a, b],
        text: `${a} and ${b} locked eyes across the battlefield. A silent nod. They clasped hands. "Together until the boss." An alliance forged in fire.`,
        badgeText: 'HERO PACT', badgeClass: 'green', effect: { alliancePact: [a, b] } };
    },
  },
  {
    id: 'rivalryHunt', weight: 3,
    check(alive) {
      for (const a of alive) for (const b of alive) if (a !== b && getBond(a, b) <= -3) return true;
      return false;
    },
    apply(alive, heroes, allKOs) {
      const pairs = [];
      for (const a of alive) for (const b of alive) if (a < b && getBond(a, b) <= -3) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.5);
      return { type: 'rivalryHunt', players: [a, b],
        text: `${a} stalked through the rubble, scanning for ${b}. "I know you're out there." ${b} gripped ${pronouns(b).posAdj} fists in the shadows. This was personal.`,
        badgeText: 'RIVALRY HUNT', badgeClass: 'red', effect: { huntBonus: a, target: b } };
    },
  },
  {
    id: 'betrayal', weight: 2,
    check(alive) {
      return alive.some(n => {
        const a = arch(n);
        return ['villain', 'mastermind', 'schemer'].includes(a) && pStats(n).strategic * 0.1 + noise(0.2) > 0.4;
      });
    },
    apply(alive, heroes, allKOs) {
      const schemers = alive.filter(n => ['villain', 'mastermind', 'schemer'].includes(arch(n)));
      if (!schemers.length) return null;
      const betrayer = pick(schemers);
      const allies = alive.filter(n => n !== betrayer && getBond(betrayer, n) >= 2);
      if (!allies.length) return null;
      const victim = pick(allies);
      addBond(betrayer, victim, -2);
      popDelta(betrayer, -1);
      const pr = pronouns(betrayer);
      return { type: 'betrayal', players: [betrayer, victim],
        text: `${betrayer} looked at ${victim}. They had an alliance. HAD. ${pr.Sub} smiled coldly. "Sorry. Only one hero can win." ${victim}'s face fell. Pure betrayal.`,
        badgeText: 'BETRAYAL!', badgeClass: 'red', effect: { betrayal: { by: betrayer, victim } } };
    },
  },
  {
    id: 'showmanceShield', weight: 4,
    check(alive) {
      return gs.showmances?.some(s => alive.includes(s.a) && alive.includes(s.b));
    },
    apply(alive, heroes) {
      const sm = gs.showmances.find(s => alive.includes(s.a) && alive.includes(s.b));
      if (!sm) return null;
      addBond(sm.a, sm.b, 0.5);
      return { type: 'showmanceShield', players: [sm.a, sm.b],
        text: `${sm.a} found ${sm.b} in the rubble. "Are you okay?" "I am now." They fought back-to-back, covering each other. The power of love — or at least spandex attraction.`,
        badgeText: 'POWER COUPLE', badgeClass: 'green', effect: { shieldPair: [sm.a, sm.b] } };
    },
  },
  {
    id: 'heroRally', weight: 2,
    check(alive) {
      return alive.some(n => ['hero', 'loyal-soldier'].includes(arch(n)) &&
        alive.filter(m => m !== n && getBond(n, m) >= 1).length >= 2);
    },
    apply(alive, heroes) {
      const ralliers = alive.filter(n => ['hero', 'loyal-soldier'].includes(arch(n)));
      if (!ralliers.length) return null;
      const leader = pick(ralliers);
      const allies = alive.filter(n => n !== leader && getBond(leader, n) >= 1).slice(0, 3);
      if (allies.length < 2) return null;
      allies.forEach(a => addBond(leader, a, 0.3));
      popDelta(leader, 1);
      return { type: 'heroRally', players: [leader, ...allies],
        text: `${leader} stood on a broken pillar. "HEROES! We don't go down like this! We stand TOGETHER!" ${allies.join(' and ')} felt inspired. Something shifted. They were ready.`,
        badgeText: 'HERO RALLY', badgeClass: 'green', effect: { rallyBonus: allies, leader } };
    },
  },
  {
    id: 'villainMonologue', weight: 2,
    check(alive, allKOs) {
      return alive.some(n => ['villain', 'mastermind', 'schemer'].includes(arch(n)) &&
        Object.values(allKOs).some(ko => ko.by === n));
    },
    apply(alive, heroes, allKOs) {
      const villains = alive.filter(n => ['villain', 'mastermind', 'schemer'].includes(arch(n)) &&
        Object.values(allKOs).some(ko => ko.by === n));
      if (!villains.length) return null;
      const v = pick(villains);
      const victim = Object.entries(allKOs).find(([_, ko]) => ko.by === v)?.[0] || 'someone';
      popDelta(v, -1);
      return { type: 'villainMonologue', players: [v],
        text: `${v} stood over the battlefield. "You all saw what I did to ${victim}. That was a WARNING." The remaining heroes exchanged nervous glances. ${v}'s ${heroes[v]?.icon || ''} power pulsed menacingly.`,
        badgeText: 'VILLAIN SPEECH', badgeClass: 'red', effect: { intimidate: v } };
    },
  },
  {
    id: 'confessional', weight: 5,
    check() { return true; },
    apply(alive, heroes) {
      const p = pick(alive);
      const h = heroes[p];
      const pr = pronouns(p);
      const texts = [
        `${p}: "I look ridiculous in spandex. But somehow... I feel POWERFUL."`,
        `${p}: "If my parents saw me in this costume, they'd disown me. Worth it."`,
        `${p}: "${host()} thinks these powers are fake? Mine are VERY real. ...Probably."`,
        `${p}: "The cape keeps getting stuck in things. How does Batman DO this?"`,
        `${p}: "I don't care about the immunity. I care about the RESPECT. ...OK, I also care about the immunity."`,
        `${p}: "My strategy? Hit them with my ${h?.power || 'powers'} and hope for the best. It's worked so far."`,
      ];
      return { type: 'confessional', players: [p], text: pick(texts), badgeText: 'CONFESSIONAL', badgeClass: 'amber', effect: {} };
    },
  },
  {
    id: 'injuryCheck', weight: 3,
    check(alive, allKOs, injuries) {
      return alive.some(n => (injuries?.[n] || 0) < 0);
    },
    apply(alive, heroes, allKOs, injuries) {
      const injured = alive.filter(n => (injuries?.[n] || 0) < 0);
      if (!injured.length) return null;
      const p = pick(injured);
      const pr = pronouns(p);
      const recovers = pStats(p).endurance * 0.1 + noise(0.3) > 0.4;
      if (recovers && injuries) injuries[p] = Math.min(0, (injuries[p] || 0) + 1);
      return { type: 'injuryCheck', players: [p],
        text: recovers
          ? `${p} flexed ${pr.posAdj} injured arm experimentally. A wince... then a grin. "I can still fight." The adrenaline was kicking in.`
          : `${p} clutched ${pr.posAdj} side. That last fight took a toll. ${pr.Sub} was hurting — but too stubborn to show it.`,
        badgeText: recovers ? 'RECOVERY' : 'STILL HURT', badgeClass: recovers ? 'green' : 'red', effect: { recovered: recovers ? p : null } };
    },
  },
  {
    id: 'intelDiscovery', weight: 2,
    check(alive) {
      return alive.some(n => pStats(n).intuition * 0.1 + noise(0.2) > 0.5);
    },
    apply(alive, heroes) {
      const scouts = alive.filter(n => pStats(n).intuition >= 5);
      if (!scouts.length) return null;
      const scout = pick(scouts);
      const targets = alive.filter(n => n !== scout);
      if (!targets.length) return null;
      const target = pick(targets);
      return { type: 'intelDiscovery', players: [scout, target],
        text: `${scout} noticed something. ${target}'s ${heroes[target]?.powerType || 'power'} left a weakness when they attacked — a half-second opening on the left side. ${scout} filed that away. Knowledge is power.`,
        badgeText: 'INTEL', badgeClass: 'amber', effect: { intelBonus: scout, against: target } };
    },
  },
  {
    id: 'desperatePlea', weight: 1,
    check(alive) {
      return alive.some(n => alive.filter(m => m !== n && getBond(n, m) >= 1).length === 0);
    },
    apply(alive, heroes) {
      const loners = alive.filter(n => alive.filter(m => m !== n && getBond(n, m) >= 1).length === 0);
      if (!loners.length) return null;
      const loner = pick(loners);
      const target = pick(alive.filter(n => n !== loner));
      if (!target) return null;
      const socialCheck = pStats(loner).social * 0.1 + noise(0.3);
      const accepted = socialCheck > 0.4;
      if (accepted) addBond(loner, target, 1);
      return { type: 'desperatePlea', players: [loner, target],
        text: accepted
          ? `${loner} approached ${target} with open hands. "I know we haven't talked much. But neither of us survives alone." ${target} hesitated... then nodded. "Fine. But don't slow me down."`
          : `${loner} tried to recruit ${target}. "We should team up." ${target} looked ${pronouns(loner).obj} up and down. "No offense, but I've got better options." Brutal.`,
        badgeText: accepted ? 'PLEA ACCEPTED' : 'PLEA REJECTED', badgeClass: accepted ? 'green' : 'red', effect: {} };
    },
  },
];

function _generateBetweenEvents(alive, heroes, allKOs, injuries, count) {
  const events = [];
  const used = new Set();
  const eligible = EVENT_POOL.filter(e => e.check(alive, allKOs, injuries));
  const weighted = [];
  for (const e of eligible) for (let i = 0; i < e.weight; i++) weighted.push(e);
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  for (const ev of shuffled) {
    if (events.length >= count) break;
    if (used.has(ev.id)) continue;
    const result = ev.apply(alive, heroes, allKOs, injuries);
    if (result) {
      events.push(result);
      used.add(ev.id);
    }
  }
  return events;
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — ROUND SIMULATION
// ══════════════════════════════════════════════════════════════
function _shouldFight(nameA, nameB) {
  const bond = getBond(nameA, nameB);
  if (bond >= 2) return false;  // allies
  if (bond <= -2) return true;  // enemies
  const aArch = arch(nameA);
  const bArch = arch(nameB);
  // Villain archetypes fight
  if (['villain', 'mastermind', 'schemer'].includes(aArch)) return true;
  // Heroes challenge strongest
  if (['hero', 'challenge-beast'].includes(aArch)) return true;
  // Floaters flee
  if (['floater', 'goat'].includes(aArch)) return false;
  // Neutral: strategic check
  const s = pStats(nameA);
  return s.strategic * 0.1 + noise(0.3) > 0.4;
}

function _simulateRound(roundId, label, alive, heroes, allKOs, injuries, alliances, zoneList, ep, campKey, forcedEncounters, shields, momentumBoosts) {
  const zones = {};
  if (zoneList) {
    // Use provided zones
    for (const z of zoneList) zones[z] = [];
    const sorted = [...alive].sort(() => Math.random() - 0.5);
    for (const name of sorted) {
      // Spread across available zones
      const available = zoneList.filter(z => zones[z].length < Math.ceil(alive.length / zoneList.length) + 1);
      zones[pick(available)].push(name);
    }
  }

  const fights = [];
  const events = [];
  const roundKOs = [];
  const foughtThisRound = new Set();

  // Generate encounters
  for (const [zone, occupants] of Object.entries(zones)) {
    if (occupants.length < 2) continue;
    // Check all pairs
    for (let i = 0; i < occupants.length; i++) {
      for (let j = i + 1; j < occupants.length; j++) {
        const a = occupants[i], b = occupants[j];
        if (foughtThisRound.has(a) || foughtThisRound.has(b)) continue;
        if (!alive.includes(a) || !alive.includes(b)) continue;
        const forced = forcedEncounters?.some(f => (f[0] === a && f[1] === b) || (f[0] === b && f[1] === a));
        if (forced || _shouldFight(a, b) || _shouldFight(b, a)) {
          const fatigueA = injuries[a] || 0, fatigueB = injuries[b] || 0;
          const fight = _resolveFight(a, b, heroes, { injuries, momentumBoosts });
          fight.zone = zone;
          fight.round = roundId;
          fight.fatigueW = fight.winner === a ? fatigueA : fatigueB;
          fight.fatigueL = fight.loser === a ? fatigueA : fatigueB;
          fights.push(fight);
          foughtThisRound.add(a);
          foughtThisRound.add(b);

          // Apply fight results — fatigue hits BOTH fighters
          if (!injuries[fight.winner]) injuries[fight.winner] = 0;
          if (!injuries[fight.loser]) injuries[fight.loser] = 0;
          injuries[fight.winner] -= 1; // fatigue from fighting
          injuries[fight.loser] -= 1.5; // loser takes more fatigue
          if (fight.narrow) injuries[fight.winner] -= 0.5; // narrow win = extra wear
          // KO the loser — unless they have a shield (1st place costume prize)
          if (shields?.has(fight.loser)) {
            shields.delete(fight.loser);
            fight.shieldUsed = true;
            fight.shieldText = `${fight.loser} hit the ground hard — BUT WAIT! The costume contest shield ACTIVATED! ${fight.loser} staggered back to ${pronouns(fight.loser).posAdj} feet! "You think ONE hit is enough?!" The crowd went WILD!`;
            injuries[fight.loser] = (injuries[fight.loser] || 0) - 3; // shield revive + heavy fatigue
          } else {
            allKOs[fight.loser] = { round: roundId, by: fight.winner, momentum: fight.momentum };
            roundKOs.push(fight.loser);
            const idx = alive.indexOf(fight.loser);
            if (idx >= 0) alive.splice(idx, 1);
          }

          // Bond/popularity impacts
          addBond(fight.winner, fight.loser, -0.5);
          popDelta(fight.winner, 1);
          if (fight.narrow) popDelta(fight.winner, 1); // Extra for close win

          // Camp event
          ep.campEvents[campKey].post.push({
            text: `${fight.winner} defeated ${fight.loser} in the ${ZONE_LABELS[zone] || zone} during the Battle Royale!`,
            players: [fight.winner, fight.loser],
            badgeText: 'KO!', badgeClass: 'red', tag: 'battle-royale',
          });
          // Between-fight micro-events: what are other players doing right now?
          const bystanders = alive.filter(n => n !== fight.winner && n !== fight.loser && !foughtThisRound.has(n));
          if (bystanders.length > 0) {
            const microEvents = _generateMicroEvents(bystanders, alive, heroes, allKOs, injuries, alliances, fight, zone);
            events.push(...microEvents);
          }
        } else {
          // Allied encounter — flavor text
          events.push({ type: 'allyEncounter', players: [a, b],
            text: `${a} and ${b} crossed paths in the ${ZONE_LABELS[zone] || zone}. A nod. An understanding. They moved on — no fight today.`,
            badgeText: 'TRUCE', badgeClass: 'green' });
        }
      }
    }
  }

  return { id: roundId, label, zones, fights, events, knockedOut: roundKOs };
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — BETWEEN-FIGHT MICRO-EVENTS
// ══════════════════════════════════════════════════════════════
const MICRO_EVENTS = [
  { id: 'stalking', weight: 3,
    check: (bystanders, alive) => bystanders.some(n => alive.some(t => t !== n && getBond(n, t) <= -2)),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const hunter = bystanders.find(n => alive.some(t => t !== n && getBond(n, t) <= -2));
      const prey = alive.find(t => t !== hunter && getBond(hunter, t) <= -2);
      if (!hunter || !prey) return null;
      const h = heroes[hunter];
      const texts = [
        `${hunter} watched ${lastFight.winner}'s fight from the shadows. "Good... let them tire each other out." ${pronouns(hunter).Sub} slipped deeper into the city, hunting for ${prey}.`,
        `${hunter} tracked ${prey}'s movements from a rooftop. Every step catalogued. Every weakness noted. The ${h.heroName} was patient.`,
        `"Where are you..." ${hunter} muttered, scanning the alleyways. ${pronouns(hunter).Sub} could feel ${prey} nearby. The rivalry was magnetic.`,
      ];
      return { type: 'stalking', players: [hunter, prey], text: pick(texts), badgeText: 'HUNTING', badgeClass: 'red' };
    }
  },
  { id: 'strategize', weight: 4,
    check: (bystanders) => bystanders.some(n => pStats(n).strategic >= 5),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const thinker = bystanders.find(n => pStats(n).strategic >= 5) || pick(bystanders);
      const a = arch(thinker);
      const h = heroes[thinker];
      const isVillain = ['villain', 'mastermind', 'schemer'].includes(a);
      const texts = isVillain ? [
        `${thinker} smirked watching the aftermath of ${lastFight.winner}'s fight. "${lastFight.winner} is strong... but now ${pronouns(lastFight.winner).sub}'s tired. Perfect."`,
        `${thinker} retreated to the shadows. Let the heroes beat each other up. The ${h.heroName} only needed to survive — then strike at the right moment.`,
        `"Interesting..." ${thinker} studied ${lastFight.winner}'s technique from a distance. Every strength has a weakness. ${pronouns(thinker).Sub} just needed to find it.`,
      ] : [
        `${thinker} assessed the situation. ${Object.keys(allKOs).length} down, ${alive.length} still standing. "${pronouns(thinker).Sub} needed a plan — raw power wouldn't be enough."`,
        `${thinker} paused to catch ${pronouns(thinker).posAdj} breath. ${lastFight.winner} looked dangerous. "I need to find allies before ${pronouns(lastFight.winner).sub} finds me."`,
        `The ${h.heroName} crouched behind cover, thinking. Who was left? Who could ${pronouns(thinker).sub} trust? Who was coming for ${pronouns(thinker).obj}?`,
      ];
      return { type: 'strategize', players: [thinker], text: pick(texts), badgeText: 'STRATEGIZING', badgeClass: 'amber' };
    }
  },
  { id: 'allyUp', weight: 3,
    check: (bystanders, alive) => bystanders.length >= 2 && bystanders.some((a, i) => bystanders.some((b, j) => j > i && getBond(a, b) >= 2)),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      let pair;
      for (const a of bystanders) for (const b of bystanders) {
        if (a !== b && getBond(a, b) >= 2 && !pair) pair = [a, b];
      }
      if (!pair) return null;
      const texts = [
        `${pair[0]} found ${pair[1]} hiding in a side street. "Together?" "Together." The two heroes bumped fists and moved as a unit.`,
        `"Did you see that fight?" ${pair[0]} whispered to ${pair[1]}. "We can't take ${lastFight.winner} alone. But together..."`,
        `${pair[0]} and ${pair[1]} regrouped behind a collapsed wall. "Here's the plan..." They weren't just allies — they were a team.`,
      ];
      addBond(pair[0], pair[1], 0.2);
      return { type: 'allyUp', players: pair, text: pick(texts), badgeText: 'TEAMING UP', badgeClass: 'green' };
    }
  },
  { id: 'flee', weight: 2,
    check: (bystanders) => bystanders.some(n => pStats(n).boldness <= 4),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const coward = bystanders.find(n => pStats(n).boldness <= 4) || pick(bystanders);
      const h = heroes[coward];
      const texts = [
        `${coward} heard the sounds of ${lastFight.winner}'s victory and RAN. No shame. Pure survival instinct. The ${h.heroName} could fight another day.`,
        `${coward} saw what happened to ${lastFight.loser} and decided NOW was a great time to relocate. Far away. Very far away.`,
        `"Nope. Nope nope nope." ${coward} backed away from the fight zone. ${pronouns(coward).Sub} wasn't ready for that. Not yet.`,
      ];
      return { type: 'flee', players: [coward], text: pick(texts), badgeText: 'RETREATING', badgeClass: 'amber' };
    }
  },
  { id: 'showmanceMoment', weight: 2,
    check: (bystanders, alive) => gs.showmances?.some(s => bystanders.includes(s.a) && alive.includes(s.b) || bystanders.includes(s.b) && alive.includes(s.a)),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const sm = gs.showmances?.find(s => (bystanders.includes(s.a) && alive.includes(s.b)) || (bystanders.includes(s.b) && alive.includes(s.a)));
      if (!sm) return null;
      const texts = [
        `${sm.a} caught ${sm.b}'s eye across the battlefield. No words needed. A look that said "I've got your back." Then they both looked away — focus.`,
        `${sm.a} glanced at ${sm.b}, checking for injuries. "You okay?" "I'm fine. Win this." The concern was obvious. So was the distraction.`,
        `For a moment, the battle didn't matter. ${sm.a} and ${sm.b} were just two people who didn't want the other to get hurt. Then reality snapped back.`,
      ];
      addBond(sm.a, sm.b, 0.1);
      return { type: 'showmance', players: [sm.a, sm.b], text: pick(texts), badgeText: 'HEART EYES', badgeClass: 'green' };
    }
  },
  { id: 'taunt', weight: 2,
    check: (bystanders) => bystanders.some(n => ['villain', 'mastermind', 'hothead', 'chaos-agent'].includes(arch(n))),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const taunter = bystanders.find(n => ['villain', 'mastermind', 'hothead', 'chaos-agent'].includes(arch(n)));
      if (!taunter) return null;
      const target = lastFight.winner;
      const h = heroes[taunter];
      const texts = [
        `"Hey ${target}!" ${taunter} called from a rooftop. "You think you're tough? I'm the ${h.heroName}. Come find me — if you dare."`,
        `${taunter} laughed at ${lastFight.loser}'s defeat. "Pathetic. I expected more from ${pronouns(lastFight.loser).obj}." The taunt echoed across the city.`,
        `${taunter} stepped into view, arms crossed. "Who's next? The ${h.heroName} doesn't hide." Pure provocation.`,
      ];
      addBond(taunter, target, -0.3);
      return { type: 'taunt', players: [taunter, target], text: pick(texts), badgeText: 'TAUNT', badgeClass: 'red' };
    }
  },
  { id: 'confessional', weight: 3,
    check: () => true,
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const p = pick(bystanders);
      const h = heroes[p];
      const pr = pronouns(p);
      const a = arch(p);
      const isInjured = (injuries[p] || 0) < 0;
      const texts = [
        `${p} (confessional): "I'm watching everyone fight and I'm thinking... I just need to outlast them. Let them punch each other. I'll be the last one standing."`,
        `${p} (confessional): "${isInjured ? `I'm hurt. Bad. But I can't show it. The moment they smell weakness, I'm done.` : `So far so good. But the real fights haven't started yet. I need to stay sharp.`}"`,
        `${p} (confessional): "The ${h.heroName} isn't done yet. Not by a long shot. ${lastFight.winner} better watch ${pronouns(lastFight.winner).posAdj} back."`,
        `${p} (confessional): "${alive.length} of us left. Every fight narrows it down. I just need to pick the right moment."`,
      ];
      return { type: 'confessional', players: [p], text: pick(texts), badgeText: 'CONFESSIONAL', badgeClass: 'amber' };
    }
  },
  { id: 'scoutIntel', weight: 2,
    check: (bystanders) => bystanders.some(n => pStats(n).intuition >= 6),
    gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight) {
      const scout = bystanders.find(n => pStats(n).intuition >= 6);
      if (!scout) return null;
      const target = alive.find(n => n !== scout && n !== lastFight.winner);
      if (!target) return null;
      const h = heroes[target];
      const texts = [
        `${scout} observed ${target}'s movements from a distance. "${h.powerType} type... that means ${pronouns(target).sub}'s weak against ${POWER_TYPES[POWER_TYPES[h.powerType].losesTo]?.icon || '?'}. Good to know."`,
        `${scout} noticed ${target} favoring ${pronouns(target).posAdj} left side. An old injury? Or a tell? Either way — exploitable.`,
        `From a hidden vantage point, ${scout} mapped out ${target}'s patrol route. "I know exactly where you'll be in three minutes."`,
      ];
      return { type: 'intel', players: [scout, target], text: pick(texts), badgeText: 'SCOUTING', badgeClass: 'amber' };
    }
  },
];

function _generateMicroEvents(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight, zone) {
  const results = [];
  const count = 1 + Math.floor(Math.random() * 2); // 1-2 events between fights
  const eligible = MICRO_EVENTS.filter(e => e.check(bystanders, alive));
  const shuffled = [...eligible].sort((a, b) => (b.weight + noise(2)) - (a.weight + noise(2)));
  const usedTypes = new Set();
  for (const ev of shuffled) {
    if (results.length >= count) break;
    if (usedTypes.has(ev.id)) continue;
    const result = ev.gen(bystanders, alive, heroes, allKOs, injuries, alliances, lastFight);
    if (result) { results.push(result); usedTypes.add(ev.id); }
  }
  return results;
}

// ══════════════════════════════════════════════════════════════
// BATTLE ROYALE — BOSS FIGHT
// ══════════════════════════════════════════════════════════════
const BOSS_ATTACK_TEXT = {
  fire: {
    armor: (p) => `${p} launched a searing fireball at the mech's chest plate! The metal glowed red-hot and WARPED!`,
    weapons: (p) => `${p} sent a flame stream at the weapon turrets! One melted clean off — the others sparked wildly!`,
    core: (p) => `${p} superheated the air around the exposed core! Heat shimmer distorted everything — the mech's circuits started frying!`,
  },
  water: {
    armor: (p) => `${p} blasted a high-pressure water jet at the armor seams! Rivets popped and panels loosened!`,
    weapons: (p) => `${p} flooded the weapon systems with a tidal surge! Sparks flew as electronics short-circuited!`,
    core: (p) => `${p} channeled a concentrated water drill straight into the core housing! Steam erupted everywhere!`,
  },
  earth: {
    armor: (p) => `${p} ripped a chunk of concrete from the ground and HURLED it at the mech! The armor buckled on impact!`,
    weapons: (p) => `${p} stomped the ground — a stone pillar erupted under the weapon array, snapping it clean off!`,
    core: (p) => `${p} drove both fists into the ground and sent a seismic shockwave rippling up through the mech's legs into the core!`,
  },
  psychic: {
    armor: (p) => `${p} focused a telekinetic blast at the armor joints! Bolts unscrewed themselves and plates peeled away!`,
    weapons: (p) => `${p} psychically jammed the targeting systems! The weapons fired wild, hitting nothing but sky!`,
    core: (p) => `${p} locked onto the core with a psychic grip and SQUEEZED! The energy field flickered and pulsed!`,
  },
  tech: {
    armor: (p) => `${p} deployed a cutting laser from ${pronouns(p).posAdj} gauntlet — slicing through armor plating like butter!`,
    weapons: (p) => `${p} hacked into the weapons mainframe! "Override accepted." The turrets powered down one by one!`,
    core: (p) => `${p} fired an EMP charge directly at the core! The mech stuttered, its systems cascading failures!`,
  },
  shadow: {
    armor: (p) => `${p} phased THROUGH the armor — appearing inside the mech! Ripped out hydraulic lines from within!`,
    weapons: (p) => `${p} wrapped the weapon systems in a void field! The lasers fired into darkness — absorbed completely!`,
    core: (p) => `${p} cloaked in shadow, slipped past every defense, and planted a dark energy charge on the core itself!`,
  },
};
const BOSS_TEXT = {
  taunt: [
    `Chef's voice boomed from the speakers: "YOU THINK YOU CAN BEAT MEGA PYTHONICUS?! I'VE BEEN UPGRADING!"`,
    `MEGA PYTHONICUS roared — a metallic screech that shook windows three blocks away. Chef cackled inside.`,
    `"Come on, little heroes!" Chef taunted from the cockpit. "Pythonicus is HUNGRY!"`,
  ],
  counterAttack: [
    (target) => `MEGA PYTHONICUS swung its massive tail at ${target}! DIRECT HIT! ${target} was sent flying into a wall!`,
    (target) => `MEGA PYTHONICUS fired a laser blast at ${target}! ${target} barely dodged — the ground behind ${pronouns(target).obj} EXPLODED!`,
    (target) => `MEGA PYTHONICUS stomped the ground — a shockwave knocked ${target} off ${pronouns(target).posAdj} feet! "Stay DOWN!" Chef screamed.`,
    (target) => `MEGA PYTHONICUS launched a volley of missiles at ${target}! Explosions everywhere! ${target} emerged from the smoke, battered but standing.`,
    (target) => `The mech's claw GRABBED ${target} and SLAMMED ${pronouns(target).obj} into the ground! Chef cackled. "TOO EASY!"`,
  ],
  counterDodge: [
    (target) => `MEGA PYTHONICUS lunged at ${target} — but ${target} saw it coming and ROLLED clear! "Gonna have to try harder than THAT!"`,
    (target) => `The mech swung at ${target}, but ${pronouns(target).sub} ducked under the massive arm! Counter-attack incoming!`,
    (target) => `MEGA PYTHONICUS fired at ${target} — MISS! ${target} was already moving. "Too slow, Chef!"`,
  ],
  counterKO: [
    (target) => `MEGA PYTHONICUS caught ${target} with a devastating backhand! ${target} crashed through a building and didn't get up. DOWN AND OUT!`,
    (target) => `The mech's tail sweep connected HARD. ${target} skidded across the ground, unconscious. One less hero standing.`,
  ],
  shield: [
    (protector, protected_) => `${protector} SHOVED ${protected_} out of the way of a massive tail strike! "I've got you!" The ground where ${protected_} stood? Crater.`,
    (protector, protected_) => `${protector} threw up a power shield just in time — MEGA PYTHONICUS's blast deflected harmlessly. ${protected_} looked stunned. "You saved me."`,
  ],
  holdBack: [
    (p) => `${p} hung back, conserving energy. Calculating. Watching the others wear down the mech. Smart — or cowardly?`,
    (p) => `${p} threw a half-hearted attack. Barely scratched the paint. Was ${pronouns(p).sub} saving strength... or waiting for the kill-steal?`,
  ],
  finalBlow: {
    fire: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} channeled EVERYTHING into one massive fireball — it engulfed the core, melting it from the inside! BOOM! The mech EXPLODED in flames! ${p} walked out of the inferno, untouched!`,
    water: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} summoned a massive tidal wave that crashed INTO the exposed core! Steam and sparks erupted! The mech short-circuited and COLLAPSED! ${p} stood in the rising mist, victorious!`,
    earth: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} ripped a massive boulder from the ground and HURLED it straight through the core! The impact shattered the mech from inside out! ${p} stood on the rubble, fists raised!`,
    psychic: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} focused every ounce of mental energy into a telekinetic CRUSH on the core! Metal crumpled like paper! The mech convulsed and CRASHED! ${p} opened ${pronouns(p).posAdj} eyes. It was over.`,
    tech: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} deployed the final override — a cascading virus that tore through every system! The mech froze, sparked, and DETONATED! ${p} walked away from the explosion, not looking back.`,
    shadow: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. ${p} phased into the core itself — a void bomb planted from WITHIN! The mech imploded in a sphere of darkness! When the shadows cleared, only ${p} remained. Standing. Smiling.`,
    _generic: (p) => `${p} saw the opening. MEGA PYTHONICUS staggered. The core pulsed, exposed. ${p} LAUNCHED — every ounce of remaining power focused into one devastating strike. BOOM! The mech EXPLODED! MEGA PYTHONICUS fell!`,
  },
};

function _simulateBossFight(survivors, heroes, result, ep, injuries) {
  const bossHP = survivors.length * 25;
  let hp = bossHP;
  const damageDealt = {};
  survivors.forEach(n => { damageDealt[n] = 0; });
  const beats = [];
  const events = [];

  // Phase bonuses: fire/earth for armor, tech/water for weapons, psychic/shadow for core
  const phaseBonus = [
    { name: 'Armor Phase', types: ['fire', 'earth'], texts: BOSS_TEXT.phase1 },
    { name: 'Weapons Phase', types: ['tech', 'water'], texts: BOSS_TEXT.phase2 },
    { name: 'Core Phase', types: ['psychic', 'shadow'], texts: BOSS_TEXT.phase3 },
  ];

  const totalBeats = 4 + Math.floor(Math.random() * 3); // 4-6
  let bossPhase = 0;

  for (let beat = 0; beat < totalBeats && hp > 0; beat++) {
    // Determine phase from HP
    if (hp < bossHP * 0.33) bossPhase = 2;
    else if (hp < bossHP * 0.66) bossPhase = 1;
    const phase = phaseBonus[bossPhase];
    const beatData = { phase: phase.name, players: {}, taunt: null };

    // Boss taunt every other beat
    if (beat % 2 === 1) {
      beatData.taunt = pick(BOSS_TEXT.taunt);
    }

    // Each survivor contributes
    for (const name of survivors) {
      const s = pStats(name);
      const h = heroes[name];
      const a = arch(name);
      const inj = injuries[name] || 0;
      const isVillain = ['villain', 'mastermind', 'schemer'].includes(a);
      const isHero = ['hero', 'loyal-soldier', 'underdog'].includes(a);

      // Base damage from stats
      let damage = (s.physical + s.boldness + inj) * 0.5 + noise(3);
      // Type bonus
      if (phase.types.includes(h.powerType)) damage *= 1.4;
      // Behavior modifier
      let holdingBack = false;
      if (isVillain && hp > bossHP * 0.2) {
        // Villains hold back to snipe final blow
        const holdCheck = s.strategic * 0.1 + noise(0.3);
        if (holdCheck > 0.4) {
          damage *= 0.4;
          holdingBack = true;
        }
      }
      if (isHero) {
        // Heroes go all-in
        damage *= 1.1 + s.loyalty * 0.02;
      }

      damage = Math.max(1, Math.round(damage));
      damageDealt[name] += damage;
      hp -= damage;

      const phaseKey = bossPhase === 0 ? 'armor' : bossPhase === 1 ? 'weapons' : 'core';
      const typeText = BOSS_ATTACK_TEXT[h.powerType]?.[phaseKey];
      const text = holdingBack
        ? pick(BOSS_TEXT.holdBack)(name)
        : typeText ? typeText(name) : pick(phase.texts)(name);
      beatData.players[name] = { damage, text, holdingBack, typeBonus: phase.types.includes(h.powerType) };
    }

    // ── BOSS COUNTER-ATTACK — hits 1-2 targets, leans toward weak/passive but can hit anyone ──
    if (survivors.length > 1 && hp > 0) {
      const attackCount = survivors.length >= 3 ? 2 : 1;
      // Weighted targeting: low damage dealt = higher weight, high fatigue = higher weight
      const maxDmg = Math.max(1, ...survivors.map(n => damageDealt[n]));
      const _pickTarget = (exclude) => {
        const pool = survivors.filter(n => !exclude.includes(n));
        if (!pool.length) return null;
        const weights = pool.map(n => {
          let w = 1;
          w += (1 - damageDealt[n] / maxDmg) * 3; // low damage = +3 weight
          w += Math.abs(Math.min(0, injuries[n] || 0)) * 0.5; // fatigued = more weight
          w += noise(1.5); // randomness so anyone can get hit
          return Math.max(0.5, w);
        });
        const totalW = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalW;
        for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
        return pool[pool.length - 1];
      };
      const targets = [_pickTarget([])];
      if (attackCount >= 2 && survivors.length >= 2) {
        const second = _pickTarget(targets);
        if (second) targets.push(second);
      }

      beatData.bossCounters = [];
      for (const target of targets) {
        if (!survivors.includes(target)) continue;
        // Dodge is HARD — only ~25% chance, fatigue makes it worse
        const dodgeCheck = 0.25 + (pStats(target).intuition * 0.012 + pStats(target).physical * 0.01 + pStats(target).boldness * 0.008) + (injuries[target] || 0) * 0.03 + noise(0.15);
        if (dodgeCheck > 0.35) {
          beatData.bossCounters.push({ target, dodged: true, text: pick(BOSS_TEXT.counterDodge)(target) });
        } else {
          const bossDmg = 2 + Math.floor(Math.random() * 3); // 2-4 fatigue damage per hit
          injuries[target] = (injuries[target] || 0) - bossDmg;
          // KO check: fatigue vs toughness. >= threshold = KO. Keep at least 1 for final blow.
          const toughness = (pStats(target).endurance + pStats(target).physical) * 0.6;
          if (Math.abs(injuries[target] || 0) >= toughness && survivors.length > 1) {
            survivors.splice(survivors.indexOf(target), 1);
            beatData.bossCounters.push({ target, dodged: false, ko: true, text: pick(BOSS_TEXT.counterKO)(target) });
            events.push({ type: 'bossKO', players: [target],
              text: `MEGA PYTHONICUS took out ${target}! ${survivors.length} heroes remain!`,
              badgeText: 'BOSS KO!', badgeClass: 'red' });
            popDelta(target, -1);
          } else {
            beatData.bossCounters.push({ target, dodged: false, ko: false, text: pick(BOSS_TEXT.counterAttack)(target) });
          }
        }
      }
    }

    // Showmance shield moment
    if (beat >= 1 && gs.showmances) {
      const smPair = gs.showmances.find(s => survivors.includes(s.a) && survivors.includes(s.b));
      if (smPair && Math.random() < 0.4) {
        const protector = pStats(smPair.a).boldness >= pStats(smPair.b).boldness ? smPair.a : smPair.b;
        const protected_ = protector === smPair.a ? smPair.b : smPair.a;
        events.push({ type: 'bossShield', players: [protector, protected_],
          text: pick(BOSS_TEXT.shield)(protector, protected_),
          badgeText: 'HEROIC SHIELD', badgeClass: 'green' });
        addBond(protector, protected_, 0.5);
        popDelta(protector, 1);
      }
    }

    // Snapshot survivor HP for VP health bars
    beatData.survivorHP = {};
    for (const name of survivors) {
      const toughness = (pStats(name).endurance + pStats(name).physical) * 0.6;
      const fatigue = Math.abs(injuries[name] || 0);
      beatData.survivorHP[name] = { hp: Math.max(0, Math.round((1 - fatigue / Math.max(1, toughness)) * 100)), toughness: Math.round(toughness) };
    }
    beats.push(beatData);
  }

  // Final blow — weighted contest between all survivors
  let finalBlowPlayer;
  const contenders = [...survivors];
  // Each survivor gets a final blow score:
  // - Damage dealt matters most (heroes who went all-in have advantage)
  // - Villains get a strategic bonus (snipe attempt) but it's not guaranteed
  // - Fatigue penalizes (tired players struggle to land the finish)
  const finalScores = contenders.map(name => {
    const s = pStats(name);
    const a = arch(name);
    const isVillain = ['villain', 'mastermind', 'schemer'].includes(a);
    let score = damageDealt[name] * 0.4; // damage is the biggest factor
    score += (s.boldness + s.physical) * 0.3; // physical ability to land the hit
    if (isVillain) score += s.strategic * 0.25 + s.intuition * 0.15; // snipe bonus — meaningful but not dominant
    score += (injuries[name] || 0) * 0.5; // fatigue penalty (injuries are negative)
    score += noise(5); // significant randomness — anyone can clutch it
    return { name, score };
  }).sort((a, b) => b.score - a.score);
  finalBlowPlayer = finalScores[0].name;

  return {
    beats, damageDealt, finalBlowPlayer, events,
    bossHP, finalHP: Math.min(0, hp),
    finalBlowText: (BOSS_TEXT.finalBlow[heroes[finalBlowPlayer]?.powerType] || BOSS_TEXT.finalBlow._generic)(finalBlowPlayer),
  };
}

// ══════════════════════════════════════════════════════════════
// SIMULATION — MAIN
// ══════════════════════════════════════════════════════════════
export function simulateSuperHerold(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    heroes: {},
    costumeContest: { events: [], winner: null },
    battleRoyale: {
      prizes: { first: null, second: null, third: null },
      rounds: [],
      betweenEvents: [],
      bossFight: null,
      immunityWinner: null,
      allKOs: {},
    },
  };

  // Generate hero identities (batch assignment with type cap for diversity)
  result.heroes = generateHeroes(active);

  // ── PHASE 1: COSTUME CONTEST ──
  _simulateCostumeContest(active, result, ep, campKey);

  // ── PHASE 2: BATTLE ROYALE ──
  _simulateBattleRoyale(active, result, ep, campKey);

  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, 'superHerold', _romActive, ep.chalMemberScores || {}, 'superhero battle royale');
    }
  }
  _checkShowmanceChalMoment(ep, 'superHerold', _romActive, ep.chalMemberScores || {}, 'battle', _romActive);

  // ── FINALIZE ──
  ep.superHerold = result;
  ep.isSuperHerold = true;
  ep.challengeType = 'super-hero-ld';
  ep.challengeLabel = 'Super Hero-ld';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.battleRoyale.immunityWinner;
  // chalPlacements: survivors sorted by boss damage (desc), then KO'd in reverse order
  const br = result.battleRoyale;
  const survivors = br.bossFight ? Object.keys(br.bossFight.damageDealt).sort((a, b) => br.bossFight.damageDealt[b] - br.bossFight.damageDealt[a]) : [];
  const koOrder = Object.entries(br.allKOs).sort((a, b) => b[1].round - a[1].round || b[1].momentum - a[1].momentum).map(([n]) => n);
  ep.chalPlacements = [...survivors, ...koOrder];
  // Scores — survivors get bonus, final blow gets massive bonus
  const finalBlower = result.battleRoyale.immunityWinner;
  for (const name of active) {
    const idx = ep.chalPlacements.indexOf(name);
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.max(1, active.length - idx);
  }
  // Survivors who made it to the boss fight get a big bonus
  for (const name of survivors) {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(active.length * 0.6);
  }
  // Final blow player gets extra on top to guarantee #1
  if (finalBlower) {
    ep.chalMemberScores[finalBlower] = (ep.chalMemberScores[finalBlower] || 0) + active.length + 5;
  }
  ep.tribalPlayers = active;

  // Challenge record — track the win
  updateChalRecord(ep);

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'super-hero-ld', label: 'Super Hero-ld',
    winner: result.battleRoyale.immunityWinner,
  };

  return ep;
}

function _simulateCostumeContest(active, result, ep, campKey) {
  const cc = result.costumeContest;
  const scores = {};

  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const hero = result.heroes[name];

    cc.events.push({ type: 'entrance', player: name, icon: '🎤',
      text: pick(ENTRANCE_TEXT)(host(), name) });

    const descTexts = COSTUME_DESC_TEXT[hero.powerType];
    if (descTexts) {
      cc.events.push({ type: 'costume-desc', player: name, icon: '👗',
        text: pick(descTexts)(name, hero, pr) });
    }

    // Villain sabotage (~30%)
    let sabotaged = false;
    if (Math.random() < 0.3) {
      const dodgeCheck = s.intuition * 0.03 + s.boldness * 0.02 + noise(0.3);
      if (dodgeCheck > 0.25) {
        cc.events.push({ type: 'sabotage-dodge', player: name, icon: '🛡️',
          text: pick(SABOTAGE_TEXT.costumeDodge)(name, pr) });
      } else {
        sabotaged = true;
        cc.events.push({ type: 'sabotage-hit', player: name, icon: '😾',
          text: pick(SABOTAGE_TEXT.costume)(name, pr) });
      }
    }

    const demoTexts = POWER_DEMO_TEXT[hero.powerType];
    if (demoTexts) {
      cc.events.push({ type: 'demo', player: name, icon: hero.icon,
        text: pick(demoTexts)(name, pr) });
    }

    const score = s.social * 0.03 + s.mental * 0.02 + s.boldness * 0.02 + (sabotaged ? -0.08 : 0) + noise(0.35);
    const chrisScore = Math.min(10, Math.max(1, Math.round(score * 12 + 3)));
    const judgeLevel = chrisScore >= 8 ? 'great' : chrisScore >= 6 ? 'good' : chrisScore >= 4 ? 'mid' : 'bad';
    cc.events.push({ type: 'crowd', player: name, icon: '👥',
      text: pick(CROWD_REACT_TEXT[judgeLevel])(name) });

    hero.chrisScore = chrisScore;
    scores[name] = chrisScore;
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + chrisScore;
    cc.events.push({ type: 'judge', player: name, icon: '⭐', score: chrisScore,
      text: pick(CHRIS_JUDGE_TEXT[judgeLevel])(host(), name, hero, chrisScore) });
  }

  // Determine top 3 prizes
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  result.battleRoyale.prizes.first = sorted[0]?.[0] || null;
  result.battleRoyale.prizes.second = sorted[1]?.[0] || null;
  result.battleRoyale.prizes.third = sorted[2]?.[0] || null;
  cc.winner = sorted[0]?.[0] || null;

  cc.events.push({ type: 'winner', player: cc.winner, icon: '🏆',
    text: `${host()} awarded the top 3 costumes! 1st: ${sorted[0]?.[0]} (${sorted[0]?.[1]}/10), 2nd: ${sorted[1]?.[0]} (${sorted[1]?.[1]}/10), 3rd: ${sorted[2]?.[0]} (${sorted[2]?.[1]}/10)!` });
}

function _simulateBattleRoyale(active, result, ep, campKey) {
  const br = result.battleRoyale;
  const alive = [...active];
  const injuries = {};
  const alliances = [];
  const shields = new Set();
  const momentumBoosts = {};
  if (br.prizes.first) shields.add(br.prizes.first);
  if (br.prizes.second) momentumBoosts[br.prizes.second] = 1;
  br._shields = shields;
  br._momentumBoosts = momentumBoosts;

  // ── ROUND 1: THE CITY AWAKENS ──
  const zones1 = _assignZones(alive, result.heroes, br.prizes.third);
  const round1 = _simulateRound(1, 'The City Awakens', alive, result.heroes, br.allKOs, injuries, alliances,
    Object.keys(zones1), ep, campKey, null, shields, momentumBoosts);
  // Reassign the actual zone data
  round1.zones = zones1;
  if (zones1._zonePick) br.zonePick = zones1._zonePick;
  // Re-run the fights using the real zone assignments
  // (the _simulateRound already mutated alive and allKOs)
  br.rounds.push(round1);

  // ── BETWEEN ROUND 1→2 EVENTS (3-5) ──
  const events1 = _generateBetweenEvents(alive, result.heroes, br.allKOs, injuries, 3 + Math.floor(Math.random() * 3));
  br.betweenEvents.push({ after: 1, events: events1 });
  // Apply event effects
  for (const ev of events1) {
    ep.campEvents[campKey].post.push({ ...ev, tag: 'battle-royale' });
    if (ev.effect?.alliancePact) alliances.push(ev.effect.alliancePact);
  }

  // ── ROUND 2: THE ARENA SHRINKS ──
  const shrunkZones = ZONES.slice(0, Math.max(2, Math.ceil(alive.length / 2)));
  // Force encounters between players who haven't fought
  const forcedEncounters = [];
  const fought = new Set();
  for (const r of br.rounds) for (const f of r.fights) { fought.add(`${f.winner}|${f.loser}`); fought.add(`${f.loser}|${f.winner}`); }
  for (const a of alive) {
    for (const b of alive) {
      if (a >= b) continue;
      if (!fought.has(`${a}|${b}`) && getBond(a, b) <= 0) {
        forcedEncounters.push([a, b]);
      }
    }
  }

  const round2 = _simulateRound(2, 'The Arena Shrinks', alive, result.heroes, br.allKOs, injuries, alliances,
    shrunkZones, ep, campKey, forcedEncounters.slice(0, 3), shields, momentumBoosts);
  br.rounds.push(round2);

  // ── BETWEEN ROUND 2→BOSS EVENTS (2-3) ──
  const events2 = _generateBetweenEvents(alive, result.heroes, br.allKOs, injuries, 2 + Math.floor(Math.random() * 2));
  br.betweenEvents.push({ after: 2, events: events2 });
  for (const ev of events2) {
    ep.campEvents[campKey].post.push({ ...ev, tag: 'battle-royale' });
  }

  // Keep running extra rounds until target survivors remain (2-4, varies per season)
  const _survRoll = Math.random();
  const targetSurvivors = _survRoll < 0.15 ? 2 : _survRoll < 0.55 ? 3 : 4; // 15% top2, 40% top3, 45% top4
  let extraRound = 3;
  const extraLabels = ['Last Stand', 'Final Clash', 'No Escape', 'Endgame', 'Sudden Death', 'Overtime', 'Elimination'];
  while (alive.length > targetSurvivors && extraRound <= 10) {
    // Force ALL remaining players into paired fights — no hiding
    const extraForced = [];
    const shuffled = [...alive].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      extraForced.push([shuffled[i], shuffled[i + 1]]);
    }
    // Between-round micro-events
    const betweenEvs = _generateBetweenEvents(alive, result.heroes, br.allKOs, injuries, 2 + Math.floor(Math.random() * 2));
    br.betweenEvents.push({ after: extraRound - 1, events: betweenEvs });
    for (const ev of betweenEvs) ep.campEvents[campKey].post.push({ ...ev, tag: 'battle-royale' });

    const extraR = _simulateRound(extraRound, extraLabels[extraRound - 3] || 'Sudden Death', alive, result.heroes, br.allKOs, injuries, alliances,
      ['plaza'], ep, campKey, extraForced, shields, momentumBoosts);
    br.rounds.push(extraR);
    extraRound++;
  }

  // Ensure at least 2 survivors for boss fight
  if (alive.length < 2 && active.length >= 2) {
    const lastKO = Object.entries(br.allKOs).sort((a, b) => b[1].round - a[1].round)[0];
    if (lastKO) {
      alive.push(lastKO[0]);
      delete br.allKOs[lastKO[0]];
    }
  }

  // ── BOSS FIGHT: MEGA PYTHONICUS ──
  const bossFight = _simulateBossFight(alive, result.heroes, result, ep, injuries);
  br.bossFight = bossFight;
  br.immunityWinner = bossFight.finalBlowPlayer;

  // Popularity for boss winner
  popDelta(bossFight.finalBlowPlayer, 3);

  ep.campEvents[campKey].post.push({
    text: `${bossFight.finalBlowPlayer} dealt the final blow to MEGA PYTHONICUS and won individual immunity!`,
    players: [bossFight.finalBlowPlayer],
    badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'battle-royale',
  });
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textSuperHerold(ep, ln, sec) {
  const sh = ep.superHerold;
  if (!sh) return;
  sec('SUPER HERO-LD');
  ln(`${host()} announces a superhero challenge. Everyone gets spandex.`);
  ln('── COSTUME CONTEST ──');
  for (const [name, hero] of Object.entries(sh.heroes)) {
    ln(`  ${name} → ${hero.heroName} (${hero.power}) — ${hero.chrisScore}/10`);
  }
  ln(`  Winner: ${sh.costumeContest.winner}`);
  const br = sh.battleRoyale;
  if (br) {
    ln(`  Prizes: 1st ${br.prizes.first}, 2nd ${br.prizes.second}, 3rd ${br.prizes.third}`);
    ln('── BATTLE ROYALE ──');
    for (const round of br.rounds) {
      ln(`  ROUND ${round.id}: ${round.label}`);
      for (const f of round.fights) {
        ln(`    ${f.winner} defeated ${f.loser} in ${ZONE_LABELS[f.zone] || f.zone} (momentum: ${f.momentum}${f.narrow ? ', NARROW' : ''})`);
      }
      if (round.knockedOut.length) ln(`    KO'd: ${round.knockedOut.join(', ')}`);
    }
    for (const be of br.betweenEvents) {
      for (const ev of be.events) ln(`  ${ev.badgeText}: ${ev.text}`);
    }
    if (br.bossFight) {
      ln('── BOSS FIGHT: MEGA PYTHONICUS ──');
      for (const [name, dmg] of Object.entries(br.bossFight.damageDealt).sort((a, b) => b[1] - a[1])) {
        ln(`    ${name}: ${dmg} damage`);
      }
      ln(`  FINAL BLOW: ${br.bossFight.finalBlowPlayer}`);
    }
    ln(`  IMMUNITY: ${br.immunityWinner}`);
  }
}

// ══════════════════════════════════════════════════════════════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  .sh-shell{
    --comic-red:#dc2626;--comic-blue:#2563eb;--comic-yellow:#eab308;
    --comic-black:#111;--comic-white:#fef9ef;--comic-green:#16a34a;
    --comic-pink:#ec4899;--comic-purple:#9333ea;--comic-orange:#f97316;
    font-family:'Comic Neue',cursive,sans-serif;font-weight:700;color:var(--comic-black);
    background:#1a1a3a;
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:6px solid var(--comic-black);box-shadow:8px 8px 0 rgba(0,0,0,0.35);
  }

  /* Bold conic sunburst behind everything */
  .sh-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      repeating-conic-gradient(from 0deg at 50% 40%,
        rgba(59,130,246,0.1) 0deg 4deg,transparent 4deg 8deg),
      radial-gradient(ellipse at 50% 40%,rgba(59,130,246,0.18) 0%,transparent 55%)}
  /* HEAVY halftone dot overlay */
  .sh-shell::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
    background-image:radial-gradient(circle,rgba(180,180,255,0.08) 3px,transparent 3px);
    background-size:10px 10px}

  /* ═══ LAYOUT ═══ */
  .sh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
  .sh-feed{flex:1;padding:16px 20px;min-width:0}
  .sh-sidebar{width:250px;flex-shrink:0;padding:14px;
    background:linear-gradient(180deg,#fffbe6,#fff3cc);
    border-left:5px solid var(--comic-black);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto;
    position:relative}
  .sh-sidebar::after{content:'';position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(circle,rgba(0,0,0,0.05) 2px,transparent 2px);
    background-size:8px 8px}

  /* ═══ HUD ═══ */
  .sh-hud{display:flex;justify-content:center;gap:0;padding:12px 0;position:relative;z-index:5;
    border-bottom:5px solid var(--comic-black);overflow:hidden;
    background:var(--comic-red)}
  .sh-hud::before{content:'';position:absolute;inset:0;pointer-events:none;
    background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(0,0,0,0.08) 0deg 5deg,transparent 5deg 10deg)}
  .sh-hud::after{content:'';position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(circle,rgba(0,0,0,0.07) 2px,transparent 2px);background-size:8px 8px}
  .sh-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:3px solid rgba(0,0,0,0.15);position:relative;z-index:2}
  .sh-hud-cell:last-child{border-right:none}
  .sh-hud-val{font-family:'Bangers',cursive;font-size:26px;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,0.3)}
  .sh-hud-lbl{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;font-family:'Share Tech Mono',monospace}

  /* ═══ COMIC PANEL ═══ */
  .sh-panel{border:5px solid var(--comic-black);border-radius:3px;margin:12px 0;padding:16px;position:relative;
    box-shadow:6px 6px 0 rgba(0,0,0,0.2);overflow:hidden;
    --burst-color:rgba(37,99,235,0.12);--panel-bg:#93c5fd;--panel-bg2:#bfdbfe;
    background:linear-gradient(180deg,var(--panel-bg),var(--panel-bg2))}
  .sh-panel::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:repeating-conic-gradient(from 0deg at 50% 50%,var(--burst-color) 0deg 4deg,transparent 4deg 8deg)}
  .sh-panel::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background-image:radial-gradient(circle,rgba(0,0,0,0.055) 2.5px,transparent 2.5px);background-size:8px 8px}
  .sh-panel>*{position:relative;z-index:1}
  .sh-panel-impact{animation:sh-slam 0.5s cubic-bezier(0.22,1,0.36,1)}
  @keyframes sh-slam{0%{transform:scale(1.4) rotate(-3deg);opacity:0}40%{transform:scale(1.03) rotate(1deg);opacity:1}70%{transform:scale(0.98) rotate(-0.5deg)}100%{transform:scale(1) rotate(0)}}

  /* Panel color rotation */
  .sh-feed>div:nth-child(5n+1) .sh-panel{--burst-color:rgba(37,99,235,0.12);--panel-bg:#93c5fd;--panel-bg2:#bfdbfe}
  .sh-feed>div:nth-child(5n+2) .sh-panel{--burst-color:rgba(220,38,38,0.12);--panel-bg:#fca5a5;--panel-bg2:#fecaca}
  .sh-feed>div:nth-child(5n+3) .sh-panel{--burst-color:rgba(234,179,8,0.12);--panel-bg:#fde047;--panel-bg2:#fef08a}
  .sh-feed>div:nth-child(5n+4) .sh-panel{--burst-color:rgba(22,163,74,0.12);--panel-bg:#86efac;--panel-bg2:#bbf7d0}
  .sh-feed>div:nth-child(5n+5) .sh-panel{--burst-color:rgba(147,51,234,0.12);--panel-bg:#d8b4fe;--panel-bg2:#e9d5ff}

  /* ═══ SPEECH BUBBLE ═══ */
  .sh-bubble{position:relative;background:#fff;border:3px solid var(--comic-black);border-radius:18px;padding:10px 16px;
    margin:8px 0;font-family:'Bangers',cursive;font-size:16px;letter-spacing:1px;line-height:1.4;z-index:2}
  .sh-bubble::after{content:'';position:absolute;bottom:-12px;left:24px;width:0;height:0;
    border-left:10px solid transparent;border-right:10px solid transparent;border-top:12px solid var(--comic-black)}

  /* ═══ CAPTION BOX ═══ */
  .sh-caption{background:var(--comic-yellow);border:3px solid var(--comic-black);padding:8px 14px;
    font-family:'Bangers',cursive;font-size:15px;letter-spacing:2px;display:inline-block;
    box-shadow:3px 3px 0 rgba(0,0,0,0.15);position:relative;z-index:2}

  /* ═══ ACTION WORDS ═══ */
  .sh-pow{font-family:'Bangers',cursive;letter-spacing:4px;text-transform:uppercase;
    display:inline-block;padding:6px 16px;transform:rotate(-4deg);position:relative;
    text-shadow:3px 3px 0 rgba(0,0,0,0.2);animation:sh-kapow 0.5s cubic-bezier(0.22,1,0.36,1)}
  .sh-pow-lg{font-size:42px}
  .sh-pow-md{font-size:28px}
  .sh-pow-sm{font-size:18px}
  /* Starburst behind action word */
  .sh-pow::before{content:'';position:absolute;inset:-20px;z-index:-1;
    background:radial-gradient(circle,currentColor 0%,transparent 70%);opacity:0.08;border-radius:50%}
  @keyframes sh-kapow{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.4) rotate(5deg)}100%{transform:scale(1) rotate(-4deg)}}

  /* ═══ HERO CARD ═══ */
  .sh-hero-card{display:flex;gap:0;border:5px solid var(--comic-black);border-radius:4px;overflow:hidden;
    background:#fff;margin:10px 0;box-shadow:5px 5px 0 rgba(0,0,0,0.18);position:relative}
  .sh-hero-card::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:5;
    background-image:radial-gradient(circle,rgba(0,0,0,0.04) 1.5px,transparent 1.5px);background-size:6px 6px}

  .sh-hero-photo{width:130px;flex-shrink:0;position:relative;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;min-height:140px}
  .sh-hero-photo::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:3;
    background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,0.08) 0deg 6deg,transparent 6deg 12deg)}
  .sh-hero-photo img{width:100%;height:auto;object-fit:contain;position:relative;z-index:2}
  /* Power glow */
  .sh-hero-glow{position:absolute;inset:0;z-index:1}
  /* Cape silhouette */
  .sh-hero-cape{position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:1;width:90%;height:60%;
    clip-path:polygon(15% 30%,50% 0%,85% 30%,100% 100%,0% 100%);opacity:0.15}
  /* Mask overlay on eyes */
  .sh-hero-mask{position:absolute;top:15%;left:50%;transform:translateX(-50%);z-index:3;
    width:50px;height:18px;border-radius:50%;border:3px solid currentColor;background:currentColor;opacity:0.25}

  .sh-hero-data{flex:1;padding:12px 16px;display:flex;flex-direction:column;gap:2px;position:relative;z-index:2}
  .sh-hero-name{font-family:'Bangers',cursive;font-size:26px;letter-spacing:3px;line-height:1;
    text-shadow:2px 2px 0 rgba(0,0,0,0.08)}
  .sh-hero-real{font-size:12px;font-weight:700;color:rgba(0,0,0,0.7);font-family:'Share Tech Mono',monospace;letter-spacing:1px;margin-top:2px}
  .sh-hero-power{font-family:'Bangers',cursive;font-size:16px;color:#111;margin-top:4px;letter-spacing:1px}
  .sh-hero-origin{font-size:13px;font-weight:700;color:#222;font-style:italic;margin-top:4px;line-height:1.4}
  .sh-hero-score{font-family:'Bangers',cursive;font-size:22px;margin-top:6px}

  /* ═══ SPEED LINES ═══ */
  .sh-speed-lines{position:relative;overflow:hidden}
  .sh-speed-lines::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      repeating-linear-gradient(180deg,transparent 0px,transparent 20px,rgba(0,0,0,0.015) 20px,rgba(0,0,0,0.015) 21px),
      repeating-linear-gradient(90deg,transparent 0px,transparent 25px,rgba(0,0,0,0.01) 25px,rgba(0,0,0,0.01) 26px);
    animation:sh-speed 1.5s linear infinite}
  @keyframes sh-speed{0%{background-position:0 0,0 0}100%{background-position:-21px 0,0 -26px}}

  /* ═══ SIDEBAR ═══ */
  .sh-side-sec{font-family:'Bangers',cursive;font-size:16px;letter-spacing:3px;
    color:var(--comic-black);padding:8px 0 6px;border-bottom:3px solid var(--comic-black);margin-top:10px}
  .sh-side-sec:first-child{margin-top:0}
  .sh-side-hero{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px dashed rgba(0,0,0,0.08)}
  .sh-side-hero img{border:2px solid var(--comic-black);border-radius:3px}

  /* ═══ CONTROLS ═══ */
  .sh-controls{display:flex;gap:10px;justify-content:center;padding:18px 0;position:relative;z-index:5}
  .sh-btn-next{padding:14px 32px;font-family:'Bangers',cursive;font-size:22px;letter-spacing:4px;
    background:var(--comic-red);color:#fff;border:5px solid var(--comic-black);
    border-radius:4px;cursor:pointer;text-transform:uppercase;transition:all 0.15s;
    box-shadow:5px 5px 0 rgba(0,0,0,0.25);text-shadow:2px 2px 0 rgba(0,0,0,0.3);position:relative;overflow:hidden}
  .sh-btn-next::before{content:'';position:absolute;inset:0;pointer-events:none;
    background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(0,0,0,0.06) 0deg 6deg,transparent 6deg 12deg)}
  .sh-btn-next:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 rgba(0,0,0,0.3)}
  .sh-btn-all{padding:10px 18px;font-size:13px;background:#fff;color:rgba(0,0,0,0.5);
    border:3px solid var(--comic-black);border-radius:4px;cursor:pointer;font-family:'Bangers',cursive;letter-spacing:2px}

  /* ═══ EVENT ROWS ═══ */
  .sh-ev-good{border-left:6px solid var(--comic-green);padding:8px 12px;margin:6px 0;border-radius:0 4px 4px 0;
    background:#d4f5de;position:relative;z-index:2}
  .sh-ev-bad{border-left:6px solid var(--comic-red);padding:8px 12px;margin:6px 0;border-radius:0 4px 4px 0;
    background:#fdd;position:relative;z-index:2}
  .sh-ev-neutral{border-left:6px solid var(--comic-yellow);padding:8px 12px;margin:6px 0;border-radius:0 4px 4px 0;
    background:#fff5cc;position:relative;z-index:2}

  /* ═══ COVER PAGE ═══ */
  .sh-cover{position:relative;text-align:center;padding:50px 20px 40px;overflow:hidden;
    background:linear-gradient(180deg,#dc2626 0%,#b91c1c 40%,#991b1b 100%)}
  .sh-cover::before{content:'';position:absolute;inset:0;pointer-events:none;
    background:
      repeating-conic-gradient(from 0deg at 50% 55%,
        rgba(234,179,8,0.12) 0deg 5deg,transparent 5deg 10deg),
      radial-gradient(ellipse at 50% 55%,rgba(234,179,8,0.25) 0%,transparent 50%)}
  .sh-cover::after{content:'';position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(circle,rgba(0,0,0,0.1) 3px,transparent 3px);background-size:10px 10px}
  .sh-cover-title{font-family:'Bangers',cursive;font-size:68px;color:var(--comic-yellow);letter-spacing:8px;line-height:0.9;
    text-shadow:4px 4px 0 var(--comic-black),8px 8px 0 rgba(0,0,0,0.2);position:relative;z-index:2;
    -webkit-text-stroke:2px var(--comic-black)}
  .sh-cover-sub{font-family:'Bangers',cursive;font-size:20px;letter-spacing:5px;color:rgba(255,255,255,0.7);margin-top:8px;
    position:relative;z-index:2;text-shadow:2px 2px 0 rgba(0,0,0,0.3)}
  .sh-cover-roster{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:24px;position:relative;z-index:2}
  .sh-cover-badge{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px;
    border:4px solid var(--comic-black);border-radius:4px;background:#fff;box-shadow:4px 4px 0 rgba(0,0,0,0.25);
    width:72px;transition:transform 0.15s}
  .sh-cover-badge:hover{transform:rotate(-3deg) scale(1.08)}
  .sh-cover-badge img{border-radius:3px;border:2px solid currentColor}
  .sh-cover-badge-name{font-family:'Bangers',cursive;font-size:9px;letter-spacing:1px;line-height:1;text-align:center;
    max-width:65px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  /* ═══ LIGHTNING BOLT decoration ═══ */
  .sh-bolt{position:absolute;pointer-events:none;z-index:3;
    width:35px;height:55px;background:var(--comic-yellow);
    clip-path:polygon(45% 0%,75% 35%,100% 35%,35% 100%,50% 55%,0% 60%,40% 30%);
    filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.3))}
  .sh-bolt-sm{width:22px;height:35px}
  /* ═══ STAR decoration ═══ */
  .sh-star{position:absolute;pointer-events:none;z-index:3;font-size:20px;color:var(--comic-yellow);
    text-shadow:1px 1px 0 rgba(0,0,0,0.3)}
  .sh-star-white{color:#fff}
  .sh-star-sm{font-size:13px}
  .sh-star-lg{font-size:28px}
  /* ═══ PUFF CLOUD ═══ */
  .sh-puff{position:absolute;pointer-events:none;z-index:3;width:55px;height:35px;background:#fff;border-radius:50%;
    box-shadow:14px 4px 0 #fff,-14px 4px 0 #fff,0 -9px 0 #fff;border:3px solid var(--comic-black);opacity:0.85}
  .sh-puff-sm{width:35px;height:22px;box-shadow:9px 3px 0 #fff,-9px 3px 0 #fff,0 -6px 0 #fff}
  /* ═══ ANGLED DIVIDER ═══ */
  .sh-divider{position:relative;height:18px;margin:0 -20px;overflow:hidden}
  .sh-divider::before{content:'';position:absolute;inset:-4px 0;background:var(--comic-black);transform:skewY(-2deg)}
  .sh-divider::after{content:'';position:absolute;inset:-2px 2px;background:#fff;transform:skewY(-2deg)}

  /* ═══ IMMUNITY SPLASH ═══ */
  .sh-immunity{text-align:center;padding:40px 20px;position:relative;overflow:hidden;
    background:linear-gradient(180deg,#eab308,#ca8a04);
    border:5px solid var(--comic-black);border-radius:4px}
  .sh-immunity::before{content:'';position:absolute;inset:0;pointer-events:none;
    background:
      repeating-conic-gradient(from 0deg at 50% 50%,rgba(0,0,0,0.06) 0deg 5deg,transparent 5deg 10deg),
      radial-gradient(circle,rgba(255,255,255,0.3) 0%,transparent 50%);
    animation:sh-glow-pulse 2s ease-in-out infinite}
  .sh-immunity::after{content:'';position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(circle,rgba(0,0,0,0.07) 3px,transparent 3px);background-size:10px 10px}
  @keyframes sh-glow-pulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}

  /* ═══ MOMENTUM BAR ═══ */
  .sh-momentum{height:14px;border-radius:7px;border:3px solid var(--comic-black);overflow:hidden;background:#ddd;margin:6px 0;position:relative}
  .sh-momentum-fill{height:100%;transition:width 0.3s;border-radius:4px}
  .sh-momentum-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-family:'Bangers',cursive;font-size:10px;letter-spacing:2px;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,0.4)}

  /* ═══ BOSS HP BAR ═══ */
  .sh-boss-hp{height:22px;border-radius:4px;border:4px solid var(--comic-black);overflow:hidden;background:#333;margin:8px 0;position:relative}
  .sh-boss-hp-fill{height:100%;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width 0.3s;border-radius:2px}
  .sh-boss-hp-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-family:'Bangers',cursive;font-size:13px;letter-spacing:3px;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,0.5)}

  @media(prefers-reduced-motion:reduce){
    .sh-panel-impact,.sh-pow,.sh-speed-lines::before,.sh-immunity::before{animation:none!important}
  }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Share+Tech+Mono&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">`;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL + SCREENS
// ══════════════════════════════════════════════════════════════
function _shShell(content, ep) {
  return `${css()}<div class="sh-shell">${content}</div>`;
}

// ── Sidebar builder ──
function _buildStatusSidebar(sh, allKOs, alive, heroes) {
  let sidebar = '';
  // Power type legend
  sidebar += `<div class="sh-side-sec">POWERS</div>`;
  for (const [type, pt] of Object.entries(POWER_TYPES)) {
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px">
      <span>${pt.icon}</span><span style="color:${pt.color};font-family:'Bangers',cursive;font-size:11px;letter-spacing:1px">${type.toUpperCase()}</span>
      <span style="font-size:8px;color:rgba(0,0,0,0.4)">beats ${POWER_TYPES[pt.beats]?.icon || ''}</span>
    </div>`;
  }

  // Alive heroes
  sidebar += `<div class="sh-side-sec">ALIVE</div>`;
  for (const name of alive) {
    const h = heroes[name];
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px">
      ${portrait(name, 18)}<span style="color:${h?.color || '#333'};font-family:'Bangers',cursive;font-size:11px">${h?.heroName || name}</span>
    </div>`;
  }

  // KO'd heroes
  if (Object.keys(allKOs).length) {
    sidebar += `<div class="sh-side-sec" style="color:var(--comic-red)">KO'D</div>`;
    const koSorted = Object.entries(allKOs).sort((a, b) => a[1].round - b[1].round);
    for (const [name, ko] of koSorted) {
      const h = heroes[name];
      sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px;opacity:0.5">
        <span style="filter:grayscale(1)">${portrait(name, 18)}</span>
        <span style="color:#999;font-family:'Bangers',cursive;font-size:10px;text-decoration:line-through">${h?.heroName || name}</span>
        <span style="font-size:8px;color:rgba(0,0,0,0.3)">R${ko.round}</span>
      </div>`;
    }
  }

  return sidebar;
}

export function rpBuildSuperHeroldTitleCard(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';

  const badges = Object.entries(sh.heroes).map(([name, hero]) => {
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    return `<div class="sh-cover-badge" style="border-color:${hero.color};color:${hero.color}">
      <img src="assets/avatars/${slug}.png" alt="${name}" style="width:44px;height:44px;object-fit:contain" onerror="this.style.display='none'">
      <div class="sh-cover-badge-name">${hero.heroName.split(' ').pop()}</div>
    </div>`;
  }).join('');

  return _shShell(`
    <div class="sh-cover">
      <div class="sh-bolt" style="top:12px;right:18px;transform:rotate(15deg)"></div>
      <div class="sh-bolt sh-bolt-sm" style="top:45px;left:12px;transform:rotate(-20deg)"></div>
      <div class="sh-bolt sh-bolt-sm" style="bottom:25px;right:55px;transform:rotate(5deg)"></div>
      <div class="sh-star sh-star-white sh-star-lg" style="top:18px;left:35px">★</div>
      <div class="sh-star" style="top:55px;right:75px">★</div>
      <div class="sh-star sh-star-white sh-star-sm" style="bottom:35px;left:75px">★</div>
      <div class="sh-star sh-star-sm" style="top:75px;left:180px">★</div>
      <div class="sh-star sh-star-white" style="bottom:55px;right:140px">★</div>
      <div class="sh-star sh-star-sm" style="top:30px;right:180px">★</div>
      <div class="sh-star sh-star-white sh-star-sm" style="bottom:70px;left:160px">★</div>
      <div class="sh-puff sh-puff-sm" style="bottom:8px;left:8px"></div>
      <div class="sh-puff sh-puff-sm" style="top:3px;right:35px"></div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.5);margin-bottom:8px;position:relative;z-index:2">TOTAL DRAMA PRESENTS</div>
      <div class="sh-cover-title">SUPER<br>HERO-LD</div>
      <div class="sh-cover-sub">A ${host().toUpperCase()} PRODUCTION</div>
      <div class="sh-caption" style="margin-top:20px;position:relative;z-index:2">COSTUME CONTEST · BATTLE ROYALE · MEGA PYTHONICUS</div>
      <div style="margin-top:16px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.85);font-style:italic;position:relative;z-index:2">"Every hero needs a costume. Every villain needs a giant robot snake."</div>
      <div style="margin-top:10px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);position:relative;z-index:2;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.5">🐍 <b>Pythonicus</b> — ${host()}'s villainous pet snake, now in MECH form<br>🐱 <b>Dander Boy</b> — the evil cat who shreds costumes</div>
      <div class="sh-cover-roster">${badges}</div>
    </div>
  `, ep);
}

export function rpBuildSuperHeroldCostume(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const cc = sh.costumeContest;
  const stateKey = 'sh-costume';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  const playerOrder = Object.keys(sh.heroes);
  for (const name of playerOrder) {
    const hero = sh.heroes[name];
    const playerEvents = cc.events.filter(e => e.player === name);
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');

    let html = `<div class="sh-panel sh-panel-impact" style="--burst-color:${hero.color}30;--panel-bg:${hero.color}50;--panel-bg2:${hero.color}30">`;

    const entranceEv = playerEvents.find(e => e.type === 'entrance');
    if (entranceEv) {
      html += `<div class="sh-caption" style="display:block;margin-bottom:10px">${entranceEv.text}</div>`;
    }

    html += `<div class="sh-hero-card" style="border:none;box-shadow:none;margin:0">
      <div class="sh-hero-photo" style="background:linear-gradient(180deg,${hero.color}40,${hero.color}15)">
        <div class="sh-hero-glow" style="background:radial-gradient(circle at 50% 30%,${hero.glow},transparent 60%)"></div>
        <div class="sh-hero-cape" style="background:${hero.color}"></div>
        <div class="sh-hero-mask" style="color:${hero.color}"></div>
        <img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${name}">
      </div>
      <div class="sh-hero-data">
        <div class="sh-hero-name" style="color:${hero.color}">${hero.icon} ${hero.heroName}</div>
        <div class="sh-hero-real">${name}</div>
        <div class="sh-hero-power">${hero.icon} POWER: ${hero.power}</div>
        <div class="sh-hero-origin">${hero.origin}</div>
      </div>
    </div>`;

    const costumeEv = playerEvents.find(e => e.type === 'costume-desc');
    if (costumeEv) {
      html += `<div style="font-size:15px;font-weight:700;color:#111;padding:8px 12px;line-height:1.5;border-left:5px solid ${hero.color};background:rgba(255,255,255,0.85);border-radius:0 4px 4px 0;margin:6px 0;position:relative;z-index:2">${costumeEv.text}</div>`;
    }

    html += `<div class="sh-bubble" style="font-size:15px;border-color:${hero.color};color:var(--comic-black)">"${hero.catchphrase}"</div>`;

    for (const ev of playerEvents) {
      if (['entrance', 'costume-desc'].includes(ev.type)) continue;
      if (ev.type === 'judge') {
        const stars = '⭐'.repeat(Math.min(5, Math.ceil(ev.score / 2)));
        const scoreColor = ev.score >= 8 ? 'var(--comic-green)' : ev.score >= 6 ? 'var(--comic-yellow)' : ev.score <= 3 ? 'var(--comic-red)' : 'var(--comic-black)';
        html += `<div style="margin-top:8px;padding:10px;background:${ev.score >= 7 ? '#d4f5de' : ev.score <= 3 ? '#fdd' : '#fff5cc'};border-radius:4px;position:relative;z-index:2;border:2px solid rgba(0,0,0,0.1)">
          <div class="sh-hero-score" style="color:${scoreColor}">${stars} ${ev.score}/10</div>
          <div class="sh-caption" style="font-size:13px;display:block;margin-top:4px">${ev.text}</div>
        </div>`;
      } else if (ev.type === 'demo') {
        html += `<div class="sh-ev-neutral" style="margin-top:6px">
          <span class="sh-pow sh-pow-sm" style="color:${hero.color}">${hero.icon} POWER DEMO!</span>
          <div style="font-size:15px;font-weight:700;color:#111;margin-top:4px">${ev.text}</div>
        </div>`;
      } else if (ev.type === 'crowd') {
        html += `<div style="font-size:14px;font-weight:700;color:#111;font-style:italic;padding:6px 10px;background:rgba(255,255,255,0.85);border-radius:4px;margin:4px 0;position:relative;z-index:2">${ev.text}</div>`;
      } else if (ev.type === 'sabotage-hit') {
        html += `<div class="sh-ev-bad"><span class="sh-pow sh-pow-sm" style="color:var(--comic-red)">ZAP!</span> <span style="font-size:15px;font-weight:700;color:#111">${ev.text}</span></div>`;
      } else if (ev.type === 'sabotage-dodge') {
        html += `<div class="sh-ev-good"><span style="font-size:14px;font-weight:600">${ev.icon} ${ev.text}</span></div>`;
      }
    }
    html += `</div>`;
    steps.push({ html });
  }

  // Winner
  const winner = cc.winner;
  const winHero = sh.heroes[winner];
  steps.push({ html: `<div class="sh-panel sh-panel-impact" style="text-align:center;--panel-bg:#fef9c3;--panel-bg2:#fef08a;--burst-color:rgba(234,179,8,0.12);border-width:6px">
    <div class="sh-bolt sh-bolt-sm" style="top:5px;right:12px;transform:rotate(10deg)"></div>
    <div class="sh-star sh-star-lg" style="top:8px;left:15px">★</div>
    <div class="sh-star sh-star-sm" style="bottom:10px;right:25px">★</div>
    <div class="sh-pow sh-pow-lg" style="color:var(--comic-red)">WINNER!</div>
    <div style="margin:10px 0">${portrait(winner, 60)}</div>
    <div style="font-family:'Bangers',cursive;font-size:30px;color:${winHero?.color || '#333'};letter-spacing:3px;text-shadow:2px 2px 0 rgba(0,0,0,0.1)">${winHero?.heroName || winner}</div>
    <div class="sh-caption" style="margin-top:8px;display:block">BEST COSTUME!</div>
  </div>` });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-costume-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-costume" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('sh-costume',${totalSteps})">REVEAL!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('sh-costume',${totalSteps})">Reveal All</button>
  </div>
  <div id="sh-done-costume" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    <div class="sh-caption">COSTUME CONTEST COMPLETE</div>
  </div>`;

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">🦸</div><div class="sh-hud-lbl">COSTUME</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${Object.keys(sh.heroes).length}</div><div class="sh-hud-lbl">HEROES</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">I</div><div class="sh-hud-lbl">PHASE</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar" id="sh-sidebar-costume">
        <div class="sh-side-sec">HEROES</div>
        ${Object.entries(sh.heroes).map(([n, h]) => `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
          ${portrait(n, 20)}<span style="color:${h.color};font-family:'Bangers',cursive">${h.heroName}</span>
        </div>`).join('')}
      </div>
    </div>
  `, ep);
}

export function rpBuildSuperHeroldPrizes(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const br = sh.battleRoyale;
  const prizes = br.prizes;

  const medals = [
    { label: '1ST PLACE', name: prizes.first, medal: '🥇', color: '#eab308', prize: '🛡️ SHIELD', prizeDesc: 'Survives first KO — gets back up!' },
    { label: '2ND PLACE', name: prizes.second, medal: '🥈', color: '#94a3b8', prize: '⚡ MOMENTUM', prizeDesc: 'Starts first fight already winning' },
    { label: '3RD PLACE', name: prizes.third, medal: '🥉', color: '#b45309', prize: '🗺️ ZONE PICK', prizeDesc: `Picks starting zone${br.zonePick ? ': ' + (ZONE_LABELS[br.zonePick.zone] || br.zonePick.zone) : ''}` },
  ];

  let content = `<div class="sh-panel" style="text-align:center;--panel-bg:#fef9c3;--panel-bg2:#fef08a">
    <div class="sh-pow sh-pow-md" style="color:var(--comic-red)">COSTUME PRIZES!</div>
    <div style="display:flex;gap:16px;justify-content:center;margin-top:16px;flex-wrap:wrap">`;

  for (const m of medals) {
    if (!m.name) continue;
    const hero = sh.heroes[m.name];
    content += `<div style="text-align:center;padding:12px;border:4px solid var(--comic-black);border-radius:4px;background:#fff;box-shadow:4px 4px 0 rgba(0,0,0,0.15)">
      <div style="font-size:32px">${m.medal}</div>
      ${portrait(m.name, 50)}
      <div style="font-family:'Bangers',cursive;font-size:18px;color:${hero?.color || '#333'};margin-top:4px">${hero?.heroName || m.name}</div>
      <div style="font-size:11px;font-weight:700;color:#555">${m.name}</div>
      <div style="font-family:'Bangers',cursive;font-size:14px;color:${m.color};letter-spacing:2px;margin-top:4px">${m.label}</div>
      <div style="font-size:12px;font-weight:700;color:#777">${hero?.chrisScore || '?'}/10</div>
      <div style="margin-top:8px;padding:6px 8px;background:${m.color}22;border:2px solid ${m.color};border-radius:4px">
        <div style="font-family:'Bangers',cursive;font-size:14px;color:${m.color}">${m.prize}</div>
        <div style="font-size:11px;font-weight:700;color:#444;margin-top:2px">${m.prizeDesc}</div>
      </div>
    </div>`;
  }

  content += `</div>
    <div class="sh-caption" style="margin-top:16px;display:block">${host()}: "Now that you're all dressed up... TIME TO FIGHT!"</div>
  </div>`;

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">🏆</div><div class="sh-hud-lbl">PRIZES</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${content}</div>
      <div class="sh-sidebar">
        <div class="sh-side-sec">HEROES</div>
        ${Object.entries(sh.heroes).map(([n, h]) => `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
          ${portrait(n, 20)}<span style="color:${h.color};font-family:'Bangers',cursive">${h.heroName}</span>
        </div>`).join('')}
      </div>
    </div>
  `, ep);
}

// ── FIGHT SPOTLIGHT PANEL ──
function _buildFightPanel(fight, heroes) {
  const hW = heroes[fight.winner], hL = heroes[fight.loser];
  const maxMom = Math.max(1, fight.exchanges.length * 3);
  let html = `<div class="sh-panel sh-panel-impact sh-speed-lines" style="--panel-bg:${hW?.color || '#93c5fd'}30;--panel-bg2:${hL?.color || '#bfdbfe'}30">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px">
        ${portrait(fight.winner, 32)}
        <div>
          <div style="font-family:'Bangers',cursive;font-size:16px;color:${hW?.color || '#333'}">${hW?.icon || ''} ${hW?.heroName || fight.winner}</div>
          <div style="font-size:10px;font-weight:700;color:#555">${fight.winner}</div>
        </div>
      </div>
      <div class="sh-pow sh-pow-sm" style="color:var(--comic-red)">VS</div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="text-align:right">
          <div style="font-family:'Bangers',cursive;font-size:16px;color:${hL?.color || '#333'}">${hL?.heroName || fight.loser} ${hL?.icon || ''}</div>
          <div style="font-size:10px;font-weight:700;color:#555">${fight.loser}</div>
        </div>
        ${portrait(fight.loser, 32)}
      </div>
    </div>`;

  // Zone label + fatigue indicators
  if (fight.zone) {
    html += `<div class="sh-caption" style="font-size:11px;margin-bottom:8px">${ZONE_LABELS[fight.zone] || fight.zone}</div>`;
  }
  const fatW = fight.fatigueW || 0, fatL = fight.fatigueL || 0;
  if (fatW < -1 || fatL < -1) {
    html += `<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#777;margin-bottom:4px">
      <span>${fatW < -1 ? '⚠️ ' + fight.winner + ' is fatigued' : ''}</span>
      <span>${fatL < -1 ? '⚠️ ' + fight.loser + ' is fatigued' : ''}</span>
    </div>`;
  }

  // Exchange beats
  for (const ex of fight.exchanges) {
    if (ex.name === 'Result') {
      const isNarrow = fight.narrow;
      html += `<div class="${isNarrow ? 'sh-ev-neutral' : 'sh-ev-bad'}" style="margin-top:6px">
        <span class="sh-pow sh-pow-sm" style="color:${isNarrow ? 'var(--comic-yellow)' : 'var(--comic-red)'}">${isNarrow ? 'NARROW!' : 'KO!'}</span>
        <div style="font-size:14px;font-weight:700;color:#111;margin-top:4px">${ex.text}</div>
      </div>`;
    } else {
      const winColor = ex.winner === fight.winner ? hW?.color : hL?.color;
      html += `<div style="padding:6px 8px;margin:4px 0;border-left:4px solid ${winColor || '#999'};background:rgba(255,255,255,0.7);border-radius:0 4px 4px 0;position:relative;z-index:2">
        <div style="font-family:'Bangers',cursive;font-size:12px;color:${winColor || '#333'};letter-spacing:2px">${ex.name} <span style="font-size:10px;color:#777">(${ex.stat})</span></div>
        <div style="font-size:13px;font-weight:700;color:#111;margin-top:2px">${ex.text}</div>
      </div>`;
    }
  }

  // Shield activation — 1st place costume prize
  if (fight.shieldUsed) {
    html += `<div class="sh-ev-good" style="margin-top:8px;border:3px solid var(--comic-yellow);background:#fff5cc">
      <span class="sh-pow sh-pow-sm" style="color:var(--comic-yellow)">🛡️ SHIELD ACTIVATED!</span>
      <div style="font-size:15px;font-weight:700;color:#111;margin-top:4px">${fight.shieldText}</div>
    </div>`;
  }

  // Momentum boost indicator — 2nd place costume prize
  if (fight.boostUsed) {
    html += `<div class="sh-ev-good" style="margin-top:4px;border:2px solid #3b82f6;background:#dbeafe">
      <span style="font-family:'Bangers',cursive;font-size:13px;color:#2563eb">⚡ MOMENTUM BOOST — ${fight.boostUsed} started this fight with a costume contest advantage!</span>
    </div>`;
  }

  // Momentum bar
  const momPct = Math.min(100, (fight.momentum / maxMom) * 100);
  const momColor = fight.winner === fight.exchanges[0]?.winner ? hW?.color : hL?.color;
  html += `<div class="sh-momentum">
    <div class="sh-momentum-fill" style="width:${momPct}%;background:${momColor || 'var(--comic-red)'}"></div>
    <div class="sh-momentum-label">MOMENTUM: ${fight.momentum}</div>
  </div>`;

  html += `</div>`;
  return html;
}

// ── EVENT PANEL ──
function _buildEventPanel(ev) {
  const badgeColor = ev.badgeClass === 'red' ? 'var(--comic-red)' : ev.badgeClass === 'green' ? 'var(--comic-green)' : 'var(--comic-yellow)';
  return `<div class="sh-panel">
    <div class="sh-caption" style="background:${badgeColor};color:#fff;border-color:${badgeColor}">${ev.badgeText}</div>
    <div style="display:flex;align-items:flex-start;gap:8px;margin-top:8px">
      <div style="display:flex;gap:3px">${(ev.players || []).map(n => portrait(n, 28)).join('')}</div>
      <div class="sh-bubble" style="flex:1;font-size:14px">${ev.text}</div>
    </div>
  </div>`;
}

function _buildRoundVP(ep, roundIdx, stateKey) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const br = sh.battleRoyale;
  const round = br.rounds[roundIdx];
  if (!round) return '';

  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Round title
  steps.push({ html: `<div class="sh-panel" style="text-align:center;--panel-bg:#1e1b4b;--panel-bg2:#312e81">
    <div class="sh-pow sh-pow-lg" style="color:var(--comic-yellow)">ROUND ${round.id}</div>
    <div class="sh-caption" style="margin-top:8px;background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2)">${round.label.toUpperCase()}</div>
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);margin-top:8px">${round.fights.length} fights — ${round.knockedOut.length} eliminated</div>
  </div>` });

  // Interleave fights and events
  let eventIdx = 0;
  for (const fight of round.fights) {
    // Fight spotlight
    steps.push({ html: _buildFightPanel(fight, sh.heroes) });
    // Intersperse ally encounters
    while (eventIdx < round.events.length && eventIdx < round.fights.indexOf(fight) + 2) {
      steps.push({ html: _buildEventPanel(round.events[eventIdx]) });
      eventIdx++;
    }
  }
  // Remaining events
  while (eventIdx < round.events.length) {
    steps.push({ html: _buildEventPanel(round.events[eventIdx]) });
    eventIdx++;
  }

  // Between-round events
  const betweenBlock = br.betweenEvents.find(b => b.after === round.id);
  if (betweenBlock?.events?.length) {
    steps.push({ html: `<div class="sh-divider"></div><div class="sh-panel" style="text-align:center">
      <div class="sh-pow sh-pow-sm" style="color:var(--comic-blue)">MEANWHILE...</div>
    </div>` });
    for (const ev of betweenBlock.events) {
      steps.push({ html: _buildEventPanel(ev) });
    }
  }

  const totalSteps = steps.length;
  const suffix = stateKey.replace('sh-', '');
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-${suffix}-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-${suffix}" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('${stateKey}',${totalSteps})">KAPOW!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('${stateKey}',${totalSteps})">Reveal All</button>
  </div>
  <div id="sh-done-${suffix}" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    <div class="sh-caption">ROUND ${round.id} COMPLETE</div>
  </div>`;

  // Build alive/ko sidebar based on state BEFORE this round (no spoilers)
  // Sidebar updates live as fights are revealed via superHeroldRevealNext
  const koBefore = {};
  const aliveBefore = Object.keys(sh.heroes).filter(n => {
    const ko = br.allKOs[n];
    if (ko && ko.round < round.id) { koBefore[n] = ko; return false; }
    return true;
  });

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">⚔️</div><div class="sh-hud-lbl">BATTLE</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${aliveBefore.length}</div><div class="sh-hud-lbl">ALIVE</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${round.id}</div><div class="sh-hud-lbl">ROUND</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar" id="sh-sidebar-${suffix}">${_buildStatusSidebar(sh, koBefore, aliveBefore, sh.heroes)}</div>
    </div>
  `, ep);
}

export function rpBuildSuperHeroldRound1(ep) {
  return _buildRoundVP(ep, 0, 'sh-round1');
}

export function rpBuildSuperHeroldRound2(ep) {
  return _buildRoundVP(ep, 1, 'sh-round2');
}

export function rpBuildSuperHeroldRound(ep, roundIdx) {
  return _buildRoundVP(ep, roundIdx, `sh-round${roundIdx + 1}`);
}

export function rpBuildSuperHeroldBoss(ep) {
  const sh = ep.superHerold;
  if (!sh || !sh.battleRoyale?.bossFight) return '';
  const br = sh.battleRoyale;
  const boss = br.bossFight;
  const stateKey = 'sh-boss';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  const survivors = Object.keys(boss.damageDealt);

  // Boss intro
  steps.push({ html: `<div class="sh-panel sh-panel-impact" style="text-align:center;--panel-bg:#1a0a2e;--panel-bg2:#2d1b4e;--burst-color:rgba(168,85,247,0.15)">
    <div class="sh-bolt" style="top:8px;right:15px;transform:rotate(12deg)"></div>
    <div class="sh-bolt sh-bolt-sm" style="bottom:12px;left:10px;transform:rotate(-18deg)"></div>
    <div class="sh-pow sh-pow-lg" style="color:var(--comic-red)">BOSS FIGHT!</div>
    <div style="font-family:'Bangers',cursive;font-size:28px;color:var(--comic-purple);letter-spacing:4px;margin-top:8px;text-shadow:2px 2px 0 rgba(0,0,0,0.3)">🐍 MEGA PYTHONICUS 🐍</div>
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);margin-top:4px">Piloted by Chef Hatchet — ${boss.bossHP} HP</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
      ${survivors.map(n => `<div style="text-align:center">${portrait(n, 36)}<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.7)">${sh.heroes[n]?.heroName || n}</div></div>`).join('')}
    </div>
    <div class="sh-boss-hp">
      <div class="sh-boss-hp-fill" style="width:100%"></div>
      <div class="sh-boss-hp-label">HP: ${boss.bossHP}/${boss.bossHP}</div>
    </div>
  </div>` });

  // Beat-by-beat
  let runningHP = boss.bossHP;
  for (let i = 0; i < boss.beats.length; i++) {
    const beat = boss.beats[i];
    let html = `<div class="sh-panel sh-speed-lines" style="--panel-bg:#2a1a3a;--panel-bg2:#1a0a2e;--burst-color:rgba(239,68,68,0.1)">
      <div class="sh-caption" style="background:var(--comic-purple);color:#fff;border-color:var(--comic-purple);display:block;margin-bottom:8px">${beat.phase}</div>`;

    if (beat.taunt) {
      html += `<div class="sh-bubble" style="background:#2a1a3a;color:#fff;border-color:var(--comic-purple);font-size:14px">${beat.taunt}</div>`;
    }

    // Each player's contribution
    let beatDamage = 0;
    for (const [name, data] of Object.entries(beat.players)) {
      const h = sh.heroes[name];
      beatDamage += data.damage;
      const dmgColor = data.holdingBack ? 'var(--comic-yellow)' : data.typeBonus ? 'var(--comic-green)' : '#fff';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px;margin:4px 0;border-left:4px solid ${h?.color || '#666'};background:rgba(255,255,255,0.05);border-radius:0 4px 4px 0">
        ${portrait(name, 24)}
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;color:${h?.color || '#aaa'}">${h?.heroName || name}${data.typeBonus ? ' <span style="color:var(--comic-green);font-size:10px">TYPE BONUS!</span>' : ''}${data.holdingBack ? ' <span style="color:var(--comic-yellow);font-size:10px">HOLDING BACK...</span>' : ''}</div>
          <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);margin-top:2px">${data.text}</div>
        </div>
        <div style="font-family:'Bangers',cursive;font-size:16px;color:${dmgColor}">${data.damage} DMG</div>
      </div>`;
    }

    runningHP = Math.max(0, runningHP - beatDamage);
    const hpPct = Math.max(0, (runningHP / boss.bossHP) * 100);
    html += `<div class="sh-boss-hp" style="margin-top:8px">
      <div class="sh-boss-hp-fill" style="width:${hpPct}%"></div>
      <div class="sh-boss-hp-label">HP: ${runningHP}/${boss.bossHP}</div>
    </div>`;

    // Survivor health bars
    if (beat.survivorHP) {
      html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">`;
      for (const [name, hpData] of Object.entries(beat.survivorHP)) {
        const h = sh.heroes[name];
        const hpPctS = Math.max(0, Math.min(100, hpData.hp));
        const hpColor = hpPctS > 60 ? 'var(--comic-green)' : hpPctS > 30 ? 'var(--comic-yellow)' : 'var(--comic-red)';
        html += `<div style="flex:1;min-width:80px;background:rgba(0,0,0,0.15);border-radius:4px;padding:3px 6px">
          <div style="font-size:9px;font-weight:700;color:${h?.color || '#aaa'};white-space:nowrap">${h?.heroName?.split(' ').pop() || name}</div>
          <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;margin-top:2px">
            <div style="height:100%;width:${hpPctS}%;background:${hpColor};border-radius:3px;transition:width 0.3s"></div>
          </div>
          <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,0.5);text-align:right">${hpPctS}%</div>
        </div>`;
      }
      html += `</div>`;
    }

    // Boss counter-attacks (1-2 per beat)
    if (beat.bossCounters?.length) {
      for (const bc of beat.bossCounters) {
        if (bc.ko) {
          html += `<div class="sh-ev-bad" style="margin-top:8px;border:3px solid var(--comic-red);background:#fdd">
            <span class="sh-pow sh-pow-sm" style="color:var(--comic-red)">💀 BOSS KO!</span>
            <div style="font-size:14px;font-weight:700;color:#111;margin-top:4px">${bc.text}</div>
          </div>`;
        } else if (bc.dodged) {
          html += `<div class="sh-ev-good" style="margin-top:8px">
            <span class="sh-pow sh-pow-sm" style="color:var(--comic-green)">DODGE!</span>
            <div style="font-size:13px;font-weight:700;color:#111;margin-top:4px">${bc.text}</div>
          </div>`;
        } else {
          html += `<div class="sh-ev-bad" style="margin-top:8px">
            <span class="sh-pow sh-pow-sm" style="color:var(--comic-red)">DIRECT HIT!</span>
            <div style="font-size:13px;font-weight:700;color:#111;margin-top:4px">${bc.text}</div>
          </div>`;
        }
      }
    }

    html += `</div>`;
    steps.push({ html });
  }

  // Boss shield/showmance events
  for (const ev of boss.events) {
    steps.push({ html: _buildEventPanel(ev) });
  }

  // FINAL BLOW
  const fbPlayer = boss.finalBlowPlayer;
  const fbHero = sh.heroes[fbPlayer];
  const fbSlug = players.find(p => p.name === fbPlayer)?.slug || fbPlayer.toLowerCase().replace(/\s+/g, '-');
  steps.push({ html: `<div class="sh-panel sh-panel-impact" style="text-align:center;--panel-bg:#1a0a2e;--panel-bg2:#0a0518;--burst-color:rgba(239,68,68,0.2)">
    <div class="sh-pow sh-pow-lg" style="color:var(--comic-red)">FINAL BLOW!</div>
    <div style="font-size:15px;font-weight:700;color:rgba(255,255,255,0.9);margin:12px 0;line-height:1.6;max-width:500px;margin-left:auto;margin-right:auto">${boss.finalBlowText}</div>
  </div>` });

  // Immunity splash
  steps.push({ html: `<div class="sh-immunity sh-panel-impact">
    <div class="sh-bolt" style="top:8px;right:15px;transform:rotate(12deg)"></div>
    <div class="sh-bolt sh-bolt-sm" style="bottom:15px;left:10px;transform:rotate(-18deg)"></div>
    <div class="sh-star sh-star-white sh-star-lg" style="top:12px;left:20px">★</div>
    <div class="sh-star" style="bottom:20px;right:30px">★</div>
    <div class="sh-star sh-star-white sh-star-sm" style="top:40px;right:60px">★</div>
    <div class="sh-pow sh-pow-lg" style="color:var(--comic-red);position:relative;z-index:2">IMMUNITY!</div>
    <div style="margin:16px 0;position:relative;z-index:2">
      <div style="display:inline-block;border:6px solid ${fbHero?.color || 'var(--comic-yellow)'};border-radius:6px;overflow:hidden;box-shadow:0 0 30px ${fbHero?.glow || 'rgba(234,179,8,0.3)'}">
        <img src="assets/avatars/${fbSlug}.png" alt="${fbPlayer}" style="width:90px;height:90px;object-fit:contain;display:block" onerror="this.style.display='none'">
      </div>
    </div>
    <div style="font-family:'Bangers',cursive;font-size:36px;color:${fbHero?.color || '#333'};letter-spacing:4px;position:relative;z-index:2;
      text-shadow:3px 3px 0 rgba(0,0,0,0.15)">${fbHero?.heroName || fbPlayer}</div>
    <div style="font-family:'Bangers',cursive;font-size:16px;color:rgba(0,0,0,0.4);margin-top:4px;position:relative;z-index:2">${fbPlayer}</div>
    <div class="sh-caption" style="margin-top:12px;position:relative;z-index:2">THE HERO PREVAILS!</div>
  </div>` });

  // Damage leaderboard
  const dmgSorted = Object.entries(boss.damageDealt).sort((a, b) => b[1] - a[1]);
  let dmgBoard = `<div class="sh-panel" style="--panel-bg:#fef9c3;--panel-bg2:#fef08a">
    <div class="sh-caption" style="display:block;margin-bottom:8px">DAMAGE DEALT</div>`;
  for (let i = 0; i < dmgSorted.length; i++) {
    const [name, dmg] = dmgSorted[i];
    const h = sh.heroes[name];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    const pct = Math.round((dmg / boss.bossHP) * 100);
    dmgBoard += `<div style="display:flex;align-items:center;gap:6px;padding:4px;border-bottom:1px dashed rgba(0,0,0,0.08)">
      <span style="width:18px;font-size:14px">${medal}</span>
      ${portrait(name, 22)}
      <span style="flex:1;font-family:'Bangers',cursive;font-size:14px;color:${h?.color || '#333'}">${h?.heroName || name}</span>
      <span style="font-family:'Share Tech Mono',monospace;font-weight:700;font-size:13px">${dmg} DMG (${pct}%)</span>
    </div>`;
  }
  dmgBoard += `</div>`;
  steps.push({ html: dmgBoard });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-boss-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-boss" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('sh-boss',${totalSteps})">SMASH!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('sh-boss',${totalSteps})">Reveal All</button>
  </div>
  <div id="sh-done-boss" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    <div class="sh-caption">MEGA PYTHONICUS DEFEATED!</div>
  </div>`;

  // Sidebar: survivors + damage
  let sidebar = `<div class="sh-side-sec">SURVIVORS</div>`;
  for (const name of survivors) {
    const h = sh.heroes[name];
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px">
      ${portrait(name, 18)}<span style="color:${h?.color || '#333'};font-family:'Bangers',cursive;font-size:11px">${h?.heroName || name}</span>
    </div>`;
  }
  sidebar += `<div class="sh-side-sec">POWER TYPES</div>`;
  for (const [type, pt] of Object.entries(POWER_TYPES)) {
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px">
      <span>${pt.icon}</span><span style="color:${pt.color};font-family:'Bangers',cursive;font-size:10px">${type.toUpperCase()}</span>
    </div>`;
  }

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">🐍</div><div class="sh-hud-lbl">BOSS</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${survivors.length}</div><div class="sh-hud-lbl">SURVIVORS</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">III</div><div class="sh-hud-lbl">PHASE</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar" id="sh-sidebar-boss">${sidebar}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
function _shUpdateSidebar(screenKey, revIdx) {
  if (!screenKey.startsWith('sh-round')) return;
  const suffix = screenKey.replace('sh-', '');
  const sideEl = document.getElementById(`sh-sidebar-${suffix}`);
  if (!sideEl) return;
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const sh = latestEp?.superHerold;
  if (!sh) return;
  const br = sh.battleRoyale;
  const roundNum = parseInt(screenKey.replace('sh-round', ''));
  const roundIdx = roundNum - 1;
  const round = br.rounds[roundIdx];
  if (!round) return;

  // Build the step order (same as VP build) to know which fights are revealed
  const stepOrder = [];
  const allItems = [...round.fights.map(f => ({ type: 'fight', data: f })), ...round.events.map(e => ({ type: 'event', data: e }))];
  for (const item of allItems) stepOrder.push(item);

  // Count how many fights have been revealed up to revIdx
  const revealedKOs = new Set();
  const revealedShields = new Set();
  for (let i = 0; i <= revIdx && i < stepOrder.length; i++) {
    const item = stepOrder[i];
    if (item.type === 'fight') {
      if (item.data.shieldUsed) {
        revealedShields.add(item.data.loser);
      } else {
        revealedKOs.add(item.data.loser);
      }
    }
  }

  // KOs from previous rounds + revealed KOs from this round
  const koVisible = {};
  const aliveVisible = Object.keys(sh.heroes).filter(n => {
    const ko = br.allKOs[n];
    if (ko && ko.round < round.id) { koVisible[n] = ko; return false; }
    if (revealedKOs.has(n)) { koVisible[n] = ko; return false; }
    return true;
  });
  sideEl.innerHTML = _buildStatusSidebar(sh, koVisible, aliveVisible, sh.heroes);
}

export function superHeroldRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('sh-', '');
  const el = document.getElementById(`sh-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`sh-controls-${suffix}`);
    const done = document.getElementById(`sh-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _shUpdateSidebar(screenKey, state.idx);
}

export function superHeroldRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('sh-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`sh-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`sh-controls-${suffix}`);
  const done = document.getElementById(`sh-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _shUpdateSidebar(screenKey, state.idx);
}

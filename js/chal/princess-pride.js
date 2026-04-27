// js/chal/princess-pride.js — The Princess Pride fairy tale challenge (post-merge)
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
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

// ══════════════════════════════════════════════════════════════
// CLASS DEFINITIONS
// ══════════════════════════════════════════════════════════════
const CLASSES = {
  knight:    { icon: '⚔️', color: '#dc2626', label: 'Knight',    stats: ['physical', 'boldness'] },
  ranger:    { icon: '🏹', color: '#16a34a', label: 'Ranger',    stats: ['intuition', 'physical'] },
  mage:      { icon: '🧙', color: '#7c3aed', label: 'Mage',      stats: ['mental', 'strategic'] },
  rogue:     { icon: '🗡️', color: '#475569', label: 'Rogue',     stats: ['strategic', 'boldness'] },
  bard:      { icon: '🎵', color: '#ec4899', label: 'Bard',      stats: ['social', 'mental'] },
  barbarian: { icon: '🪓', color: '#b45309', label: 'Barbarian', stats: ['physical', 'endurance'] },
};
const ROYAL = { icon: '👑', color: '#eab308', label: 'Princess/Prince', stats: ['social', 'mental'] };

const CLASS_KEYS = Object.keys(CLASSES);

// ── ARCHETYPE PRIORITY ──
const ARCHETYPE_PRIORITY_CLASS = {
  villain: 'rogue', mastermind: 'rogue',
  schemer: null, // special: rogue if strategic >= 7, else mage
  hero: 'knight', 'loyal-soldier': 'knight',
  underdog: 'bard', floater: 'bard',
  hothead: 'barbarian', 'challenge-beast': 'barbarian', 'chaos-agent': 'barbarian',
  'social-butterfly': 'bard', showmancer: 'bard',
  'perceptive-player': 'mage',
  wildcard: null, // random
  goat: 'barbarian',
};

function _getClassScore(name, cls) {
  const s = pStats(name);
  const pair = CLASSES[cls].stats;
  return s[pair[0]] * 0.5 + s[pair[1]] * 0.5 + noise(1);
}

// ══════════════════════════════════════════════════════════════
// PRINCESS/PRINCE SELECTION
// ══════════════════════════════════════════════════════════════
function _selectRoyal(active) {
  let royalName = null;
  // Showmance rigging: if active showmance, pick the half with higher social
  if (gs.showmances?.length) {
    for (const sm of gs.showmances) {
      if (active.includes(sm.a) && active.includes(sm.b)) {
        royalName = pStats(sm.a).social >= pStats(sm.b).social ? sm.a : sm.b;
        break;
      }
    }
  }
  if (!royalName) {
    // Fitting score
    const scores = active.map(name => {
      const s = pStats(name);
      return { name, score: s.social * 0.3 + s.boldness * 0.2 + noise(5) };
    }).sort((a, b) => b.score - a.score);
    royalName = scores[0].name;
  }
  // Determine title
  const pr = pronouns(royalName);
  let royalTitle;
  if (pr.sub === 'she') royalTitle = 'Princess';
  else if (pr.sub === 'he') royalTitle = 'Prince';
  else royalTitle = Math.random() < 0.5 ? 'Princess' : 'Prince';

  return { royalName, royalTitle };
}

// ══════════════════════════════════════════════════════════════
// CLASS ASSIGNMENT
// ══════════════════════════════════════════════════════════════
function _assignClasses(knights) {
  const classCounts = {};
  CLASS_KEYS.forEach(c => { classCounts[c] = 0; });
  const cap = Math.max(2, Math.ceil(knights.length / CLASS_KEYS.length));
  const assigned = {};

  // Phase 1: Priority assignments
  const _getPriority = (name) => {
    const a = arch(name);
    if (a === 'schemer') return pStats(name).strategic >= 7 ? 'rogue' : 'mage';
    if (a === 'wildcard') return null;
    return ARCHETYPE_PRIORITY_CLASS[a] || null;
  };

  // Sort by strength of archetype match
  const priorityPlayers = knights
    .filter(n => _getPriority(n))
    .map(n => ({ name: n, cls: _getPriority(n), score: _getClassScore(n, _getPriority(n)) + 3 }))
    .sort((a, b) => b.score - a.score);

  // Ensure every class represented at least once before duplicates
  const firstPass = new Set();
  for (const { name, cls } of priorityPlayers) {
    if (assigned[name]) continue;
    if (firstPass.has(cls)) continue; // skip duplicates in first pass
    if (classCounts[cls] < cap) {
      classCounts[cls]++;
      assigned[name] = cls;
      firstPass.add(cls);
    }
  }
  // Second pass: priority overflow players go to unfilled classes first, then allow duplicates
  for (const { name, cls } of priorityPlayers) {
    if (assigned[name]) continue;
    const unfilled = CLASS_KEYS.filter(c => classCounts[c] === 0);
    if (unfilled.length) {
      const best = unfilled.map(c => [c, _getClassScore(name, c)]).sort((a, b) => b[1] - a[1])[0][0];
      classCounts[best]++;
      assigned[name] = best;
    } else if (classCounts[cls] < cap) {
      classCounts[cls]++;
      assigned[name] = cls;
    }
  }

  // Phase 2: Remaining by stat fit
  const remaining = knights.filter(n => !assigned[n]);
  for (const name of remaining) {
    // Prefer unfilled classes
    const unfilled = CLASS_KEYS.filter(c => classCounts[c] === 0);
    if (unfilled.length) {
      const best = unfilled.map(c => [c, _getClassScore(name, c)]).sort((a, b) => b[1] - a[1])[0][0];
      classCounts[best]++;
      assigned[name] = best;
    } else {
      const ranked = CLASS_KEYS.map(c => [c, _getClassScore(name, c)]).sort((a, b) => b[1] - a[1]);
      for (const [c] of ranked) {
        if (classCounts[c] < cap) { classCounts[c]++; assigned[name] = c; break; }
      }
      if (!assigned[name]) { assigned[name] = ranked[0][0]; classCounts[ranked[0][0]]++; }
    }
  }

  return assigned;
}

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT BANKS
// ══════════════════════════════════════════════════════════════

const CEREMONY_TEXT = {
  slipper: [
    (h, name, title) => `${h} held up a gleaming glass slipper. "One of you is destined for the throne." The slipper glowed, pulsed, and flew through the air — landing at ${name}'s feet. "${title} ${name}," ${h} announced. "Your reign begins now."`,
    (h, name, title) => `A crystal slipper descended from the sky on a velvet cushion. ${h} caught it with a flourish. "The kingdom has chosen." He knelt before ${name}. "All hail ${title} ${name}."`,
    (h, name, title) => `${h} produced the glass slipper from behind his back. "Every fairy tale needs royalty." He walked down the line, studying each player. The slipper shimmered when he reached ${name}. "Looks like we have our ${title}."`,
    (h, name, title) => `The glass slipper sat on a velvet pedestal, glowing faintly. ${h} circled the group. "One of you will rule. The rest will serve." The slipper shattered into a thousand sparks — and reformed in ${name}'s hands. "${title} ${name}. The kingdom recognizes its own."`,
    (h, name, title) => `${h} snapped his fingers. A throne rose from the ground, vines and gold intertwining. "Somebody needs to sit in that." Every head turned to ${name}. The slipper materialized at their feet. ${h} grinned. "Congratulations, ${title} ${name}. Or should I say... condolences."`,
  ],
  reaction: {
    happy: [
      (name, pr, title) => `${name} smiled and accepted the crown. "I've been waiting my whole life for this moment." ${pr.Sub} wasn't kidding.`,
      (name, pr, title) => `${name} placed the crown on ${pr.posAdj} head with practiced ease. "Born for this."`,
      (name, pr, title) => `${name} curtsied — or bowed, depending on who you asked — with theatrical grace. "The crown suits me. I always knew it would." ${pr.Sub} waved to an imaginary crowd. The crowd wasn't imaginary for long.`,
      (name, pr, title) => `Tears welled in ${name}'s eyes. Actual tears. "I used to pretend I was royalty when I was a kid." ${pr.Sub} touched the crown gently. "Guess pretending paid off." The other players couldn't help but smile.`,
    ],
    villain: [
      (name, pr, title) => `${name} took the crown and smirked. "Finally, the power I deserve." The other players exchanged worried glances.`,
      (name, pr, title) => `${name} snatched the crown. "Every kingdom needs a ruler who isn't afraid to get their hands dirty." ${pr.Sub} was already scheming.`,
      (name, pr, title) => `${name} examined the crown, turning it slowly. "Power isn't given. It's recognized." ${pr.Sub} placed it on ${pr.posAdj} head like ${pr.sub} was crowning ${pr.ref}. "Kneel." Nobody laughed. Nobody was sure ${pr.sub} was joking.`,
      (name, pr, title) => `The crown settled on ${name}'s head and the temperature seemed to drop. "A throne is just a chair until someone worthy sits in it." ${pr.Sub} surveyed the other players like pieces on a chessboard. "Let's see who's expendable."`,
    ],
    reluctant: [
      (name, pr, title) => `${name} blinked. "Wait, me? I'm the ${title.toLowerCase()}?" ${pr.Sub} looked down at the slipper. "I... guess I am."`,
      (name, pr, title) => `${name} accepted the crown hesitantly. "I'm not sure I'm cut out for this." The crown fit perfectly. Destiny doesn't ask.`,
      (name, pr, title) => `${name} fumbled the slipper, nearly dropping it. "I think there's been a mistake." The slipper pulsed brighter. "Okay, apparently not." ${pr.Sub} put the crown on sideways. Someone straightened it for ${pr.obj}. Fairy tales don't care if you're ready.`,
      (name, pr, title) => `"Seriously?" ${name} looked around for someone to hand the crown to. Nobody reached for it. "I don't even like being in charge of what we eat for dinner." ${pr.Sub} put it on anyway. It fit like it had been waiting.`,
    ],
  },
};

const CLASS_ASSIGN_TEXT = {
  knight: [
    (name, pr) => `${name} drew a broadsword from a stone pedestal. It rang like a bell. "By my honor." ${pr.Sub} was a Knight now.`,
    (name, pr) => `A suit of gleaming red armor materialized around ${name}. ${pr.Sub} tested the sword. Balanced. Deadly. ${pr.Sub} looked like ${pr.sub} was born for battle.`,
    (name, pr) => `${name} knelt before the enchanted anvil. A blade of crimson steel rose from the iron, hilt-first, glowing with an inner fire. ${pr.Sub} gripped it and stood. The Knight's oath was sealed without a word — the sword had already spoken.`,
    (name, pr) => `A shield bearing an unknown crest slammed into the earth at ${name}'s feet. ${pr.Sub} picked it up, and the crest shifted — forming ${pr.posAdj} own face. "The kingdom arms its defenders." The Knight was ready before the quest even began.`,
  ],
  ranger: [
    (name, pr) => `${name} found a longbow hanging from an oak branch. The forest seemed to whisper ${pr.posAdj} name. Ranger.`,
    (name, pr) => `A green cloak settled on ${name}'s shoulders like a second skin. ${pr.Sub} nocked an arrow instinctively. The Ranger walks alone.`,
    (name, pr) => `A hawk descended from the clouds and perched on ${name}'s outstretched arm. It carried a quiver of silver arrows. ${pr.Sub} slung them over ${pr.posAdj} shoulder without breaking eye contact with the bird. "Lead the way." The Ranger had found ${pr.posAdj} guide.`,
    (name, pr) => `${name}'s boots left no prints in the enchanted soil. A longbow materialized in ${pr.posAdj} grip, already strung, already aimed. The forest recognized one of its own. "I don't need a path," ${pr.sub} murmured. "I AM the path."`,
  ],
  mage: [
    (name, pr) => `${name} opened an ancient spellbook. The pages glowed violet. Knowledge poured in like a flood. "I can SEE the patterns now."`,
    (name, pr) => `A crystal staff flew into ${name}'s hand. Purple sparks danced at the tip. "The arcane chooses the worthy." The Mage had arrived.`,
    (name, pr) => `Runes etched themselves into ${name}'s forearms, spiraling from wrist to elbow. ${pr.Sub} flexed ${pr.posAdj} fingers and the air crackled. "Every problem has a formula. Every enchantment has a flaw." The Mage doesn't guess — ${pr.sub} calculates.`,
    (name, pr) => `${name} touched the ancient tome and the world went silent. For three heartbeats, ${pr.sub} saw EVERYTHING — every enchantment, every curse, every hidden thread of magic in the kingdom. Then sound rushed back. ${pr.Sub} smiled. "I know things now."`,
  ],
  rogue: [
    (name, pr) => `${name} vanished into shadow and reappeared behind ${host()}. "Didn't see me, did you?" The Rogue grins. The Rogue always grins.`,
    (name, pr) => `A set of lockpicks and a dark cloak appeared at ${name}'s feet. ${pr.Sub} picked them up without a sound. Some are born to the shadows.`,
    (name, pr) => `${name} was already wearing the dark cloak before anyone noticed it appear. Two daggers glinted at ${pr.posAdj} hips. "I don't fight fair," ${pr.sub} whispered to no one in particular. "I fight smart." The shadows wrapped around ${pr.obj} like an old friend.`,
    (name, pr) => `One moment ${name} was standing with the group. The next, ${pr.sub} was gone — and three players found their pockets lighter. ${pr.Sub} reappeared on a tree branch overhead, tossing a stolen coin. "Just practicing." The Rogue was already in character.`,
  ],
  bard: [
    (name, pr) => `${name} strummed a lute that appeared from nowhere. The melody was haunting. Beautiful. "Every quest needs a song." The Bard had found ${pr.posAdj} instrument.`,
    (name, pr) => `Music swelled around ${name}. A golden lute materialized. "Whoever controls the story controls the kingdom." The Bard speaks truth.`,
    (name, pr) => `${name}'s voice echoed across the clearing — a single, perfect note. The enchanted forest fell silent to listen. A silver lyre appeared in ${pr.posAdj} hands. "I don't fight monsters," ${pr.sub} said. "I make them weep." The Bard's power is not in the blade but in the ballad.`,
    (name, pr) => `A quill and scroll materialized beside a gleaming lute. ${name} picked up both. "The Bard doesn't just survive the story," ${pr.sub} announced with a dramatic flourish. "The Bard WRITES it." ${pr.Sub} strummed a chord. The forest applauded. Literally — the trees clapped their branches.`,
  ],
  barbarian: [
    (name, pr) => `${name} hefted a battle axe bigger than ${pr.posAdj} torso. No finesse. No technique. Just raw, terrifying power. The Barbarian needs nothing else.`,
    (name, pr) => `The ground cracked where ${name} planted ${pr.posAdj} feet. Warpaint appeared across ${pr.posAdj} face. The Barbarian was ready for war.`,
    (name, pr) => `${name} tore a tree from the earth with bare hands. Roots and all. "This is my weapon now." The other players took a collective step back. The Barbarian doesn't choose weapons — ${pr.sub} makes them from whatever's nearby.`,
    (name, pr) => `A massive war axe embedded itself in the ground. Everyone stared at it. ${name} yanked it free one-handed and roared — a sound that scattered birds for a mile. Warpaint blazed across ${pr.posAdj} skin like liquid fire. "FINALLY." The Barbarian had been waiting for permission to break things.`,
  ],
};

// ── PHASE BEAT TEXT (per class approach) ──
const BEAT_TEXT = {
  // Phase 1: Enchanted Forest
  'forest-navigate': {
    ranger: [
      (n, pr) => `${n} read the forest like an open book. The shifting paths couldn't fool the Ranger — ${pr.sub} spotted the true trail through the illusions, marking trees as ${pr.sub} went. The enchantment parted before ${pr.obj} like a curtain.`,
      (n, pr) => `The forest twisted and writhed, but ${n}'s Ranger instincts cut through the chaos. ${pr.Sub} tracked animal prints, noted moss patterns, and led the way without hesitation. "Nature doesn't lie."`,
      (n, pr) => `${n} crouched low and pressed ${pr.posAdj} palm to the forest floor. The earth hummed with a secret frequency only Rangers could hear. "This way. The roots know the true path." ${pr.Sub} moved through the illusions like they were morning fog — present but powerless.`,
      (n, pr) => `Every false turn whispered temptation, but ${n} followed the birds instead. "Watch where the animals go," ${pr.sub} muttered. "They can't be enchanted." The Ranger's trust in nature was absolute, and nature rewarded it with the straightest path through the labyrinth.`,
    ],
    knight: [
      (n, pr) => `${n} marched straight through the enchanted forest with sword raised. The illusions flickered and parted — not from skill, but from sheer determination. "I walk forward. That's my strategy."`,
      (n, pr) => `The Knight pressed on, hacking through phantom vines. ${n}'s armor rattled with every step. Subtle? No. Effective? Somehow, yes.`,
      (n, pr) => `${n} refused to slow down. The enchanted forest conjured shifting shadows and whispered doubts, but the Knight's answer to confusion was the same as ${pr.posAdj} answer to everything: march forward and swing. The trees learned to get out of the way.`,
      (n, pr) => `"A Knight does not wander," ${n} declared, carving a notch into every tree ${pr.sub} passed. The forest rearranged itself three times. ${pr.Sub} carved three more notches. The enchantment gave up first.`,
    ],
    mage: [
      (n, pr) => `${n} waved ${pr.posAdj} staff and the illusions dissolved into sparkling dust. "Parlor tricks." The Mage saw the true forest — and every trap laid within it.`,
      (n, pr) => `The Mage's eyes glowed as ${n} deciphered the enchantment's logic. "The path loops every seven steps unless you step left at the third stone." Nobody questioned the math.`,
      (n, pr) => `${n} closed ${pr.posAdj} eyes and let the arcane signatures guide ${pr.obj}. Each illusion had a different magical fingerprint — amateur work, really. "Whoever enchanted this forest was a C-minus student at best." The Mage's contempt was its own kind of compass.`,
      (n, pr) => `Purple runes orbited ${n}'s staff as ${pr.sub} mapped the enchantment's lattice structure in real time. "The illusions repeat on a thirteen-second cycle. Walk when I say walk. Stop when I say stop." The Mage turned chaos into a timetable.`,
    ],
    rogue: [
      (n, pr) => `${n} hugged the shadows, avoiding every trap and illusion by simply not being where they expected. The Rogue doesn't follow paths — ${pr.sub} makes ${pr.posAdj} own.`,
      (n, pr) => `While others stumbled through the front entrance, ${n} found a side trail hidden behind a waterfall. "Shortcuts aren't cheating. They're intelligence."`,
      (n, pr) => `${n} vanished into the undergrowth and reappeared fifty yards ahead, leaning against a tree. "You all took the scenic route, I see." The Rogue had found three hidden passages, stolen a fairy's lantern for light, and still had time to look smug about it.`,
      (n, pr) => `The enchanted forest tried to trap ${n} in a loop. The Rogue noticed after the second lap, pickpocketed a glowing stone from a tree sprite, and used it as a compass. "Everything enchanted has a weakness. Usually it's in its pockets."`,
    ],
    bard: [
      (n, pr) => `${n} hummed a melody and the forest calmed. Trees straightened, illusions faded, and even the enchanted creatures stopped to listen. "Music soothes the savage enchantment."`,
      (n, pr) => `The Bard sang to the forest, and the forest sang back. ${n} followed the harmony through the maze, ${pr.posAdj} voice the only compass ${pr.sub} needed.`,
      (n, pr) => `${n} composed a walking song, each verse a landmark. "Past the twisted oak, beneath the silver stream..." The melody became a map. Other players hummed along, following the tune without realizing they were being led. The Bard's greatest trick — making everyone think they found the path themselves.`,
      (n, pr) => `The enchanted trees swayed in rhythm as ${n} played. "Even cursed forests have ears," the Bard murmured. ${pr.Sub} matched ${pr.posAdj} tempo to the forest's breathing and the illusions dissolved like morning dew. Music and magic are cousins, after all.`,
    ],
    barbarian: [
      (n, pr) => `${n} didn't navigate the enchanted forest. ${n} DESTROYED it. Phantom trees? Smashed. Illusory walls? Punched. "I can't be lost if nothing is standing."`,
      (n, pr) => `The Barbarian charged through the forest roaring. The enchantment tried to redirect ${n}, but ${pr.sub} ran through every illusion like it wasn't there. Because to ${pr.obj}, it wasn't.`,
      (n, pr) => `The forest conjured a wall of thorns. ${n} ran through it. The forest conjured a bottomless pit. ${n} jumped over it while screaming. The forest conjured a terrifying specter. ${n} headbutted it. The enchantment was running out of ideas.`,
      (n, pr) => `${n} navigated by destruction. Every tree ${pr.sub} knocked down was a breadcrumb. Every boulder ${pr.sub} punted was a milestone. "I don't need a map. I need a CLEAR PATH." The Barbarian made one — the hard way, the only way ${pr.sub} knew.`,
    ],
  },
  'forest-riddle': {
    mage: [
      (n, pr) => `The Riddle Gate hummed with arcane energy. ${n} studied the inscription, cross-referenced two ancient languages, and spoke the answer before anyone else finished reading. The gate swung open. "Elementary."`,
      (n, pr) => `${n} pressed ${pr.posAdj} palm against the Riddle Gate and felt the answer through the stonework. "The question is the answer." The gate shattered. The Mage doesn't ask — ${pr.sub} knows.`,
      (n, pr) => `${n} laughed at the riddle. Actually laughed. "This is a trick question wrapped in a paradox. The answer is 'silence.'" The gate groaned open. The other players hadn't even finished reading line one. The Mage was already walking through.`,
    ],
    knight: [
      (n, pr) => `${n} stared at the riddle. Stared harder. Then drew ${pr.posAdj} sword and smashed the gate's hinges off. "There. Solved." The gate fell open. Not elegant, but effective.`,
      (n, pr) => `"I don't do riddles," ${n} announced. The Knight drove ${pr.posAdj} sword into the gate's lock mechanism and twisted. The enchanted door swung open with a groan of surrender. "Honor doesn't require literacy."`,
      (n, pr) => `${n} studied the inscription with the intensity of someone who'd rather be fighting. After thirty seconds of squinting, ${pr.sub} rammed ${pr.posAdj} shoulder into the gate. It buckled. "That IS my answer." The enchanted stone crumbled around the Knight's brute sincerity.`,
      (n, pr) => `The riddle glowed with ancient power. ${n} glowed with impatience. ${pr.Sub} wedged ${pr.posAdj} blade into the seam and levered the entire gate off its enchanted hinges. "A Knight's answer is always steel." The gate crashed to the ground, riddle unread, quest unimpeded.`,
    ],
    rogue: [
      (n, pr) => `While everyone puzzled over the riddle, ${n} noticed a loose stone beside the gate. A side passage. "Why solve a puzzle when you can go around it?"`,
      (n, pr) => `${n} studied the riddle for exactly three seconds, then studied the FRAME for ten. A hidden latch. A false panel. "The riddle's a distraction," the Rogue whispered, slipping through. "The real answer is always 'look somewhere else.'"`,
      (n, pr) => `${n} pressed ${pr.posAdj} ear to the gate and listened. A mechanism. A click pattern. The Rogue's fingers danced across the stonework, finding pressure plates hidden in the mortar. The gate slid open silently. "Riddles are for scholars. Locks are for Rogues."`,
      (n, pr) => `The others stared at the riddle. ${n} stared at the hinges. Three lockpicks and twelve seconds later, the gate swung open from behind. "The answer was 'rusty hardware,'" the Rogue announced, already walking through. "You're welcome to keep reading if you want."`,
    ],
    bard: [
      (n, pr) => `${n} didn't solve the riddle — ${pr.sub} charmed the gate. A serenade, a few flattering words about its excellent craftsmanship, and the enchanted door blushed open. "Everything responds to kindness."`,
      (n, pr) => `${n} read the riddle aloud in a dramatic voice, turning each line into a verse. The gate was so entertained by the performance that it opened voluntarily. "See? Even doors appreciate good theater."`,
      (n, pr) => `${n} sat cross-legged before the Riddle Gate and began telling it a story. A story about a lonely gate that never got visitors, only riddle-solvers who never stayed to chat. The gate wept enchanted tears and swung wide. "All it wanted was company," the Bard explained. "Most enchantments do."`,
      (n, pr) => `"The answer is a song," ${n} declared confidently. It was not, in fact, a song. But the Bard sang one anyway — a ballad so stirring that the gate's enchantment forgot what question it had asked. By the final note, the way was open and the gate was humming along.`,
    ],
    barbarian: [
      (n, pr) => `${n} headbutted the Riddle Gate. It cracked. ${pr.Sub} headbutted it again. It crumbled. "What riddle?" The Barbarian's solution to everything.`,
      (n, pr) => `The Riddle Gate asked its question. ${n} picked up a boulder and answered with physics. The gate exploded into enchanted rubble. "I solved it," the Barbarian announced. "The answer was 'force.'"`,
      (n, pr) => `${n} stared at the glowing inscription. The inscription stared back. After five painful seconds, the Barbarian grabbed the gate by its top edge and ripped it from the earth like a weed. "I don't negotiate with doors." The riddle's magic fizzled out mid-sentence.`,
      (n, pr) => `The Riddle Gate began to speak. ${n} punched it before it finished the first word. Stone shrapnel flew. The enchantment sputtered. "Was that a question?" the Barbarian asked the rubble. "Because my answer is always the same." ${pr.Sub} cracked ${pr.posAdj} knuckles. Destiny doesn't require a vocabulary.`,
    ],
    ranger: [
      (n, pr) => `${n} found vines growing through a crack above the gate and scaled the wall entirely. "Don't need to solve it if you go over it."`,
      (n, pr) => `${n} noticed a fox slipping through a gap beneath the Riddle Gate. Where animals go, Rangers follow. ${pr.Sub} squeezed through the same gap, emerging on the other side covered in dirt but ahead of everyone. "The forest always has a back door."`,
      (n, pr) => `${n} studied the gate's foundation where roots had been slowly working into the stone for centuries. A firm kick to the weakened base and the entire left side gave way. "Nature already solved this riddle," the Ranger murmured. "You just have to know where to look."`,
      (n, pr) => `A bird landed on the Riddle Gate's keystone and began pecking. ${n} watched with interest. Where the bird pecked, cracks formed — the enchantment was weakest there. The Ranger drove an arrow into the spot. The gate split cleanly in two. "The forest tells you everything if you pay attention."`,
    ],
  },
  'forest-ambush': {
    knight: [
      (n, pr) => `Enchanted wolves burst from the undergrowth! ${n} drew ${pr.posAdj} sword in one fluid motion and stood firm. Slash. Parry. Counter. The Knight's training took over. "Come and get it!"`,
      (n, pr) => `The creature ambush caught everyone off guard — except ${n}. The Knight had been waiting for this. Sword singing, armor ringing, ${pr.sub} carved through the enchanted beasts with disciplined fury.`,
      (n, pr) => `${n} planted ${pr.posAdj} feet and raised ${pr.posAdj} shield. The enchanted wolves crashed against the Knight like waves against a cliff — and like waves, they broke. "This is what I trained for. This is what I LIVE for." Steel met fang. Steel won.`,
      (n, pr) => `The pack circled, snarling. ${n} didn't flinch. The Knight rotated slowly, sword extended, creating a perimeter of death. "One at a time or all at once. I don't care." They came all at once. ${pr.Sub} still didn't flinch.`,
    ],
    _default: [
      (n, pr, cls) => `${n} fought back against the enchanted creatures with everything ${pr.sub} had, ${pr.posAdj} ${CLASSES[cls]?.label || 'class'} training pushed to its limits.`,
      (n, pr, cls) => `The ambush was brutal. ${n} scrambled, dodged, and fought — relying on ${pr.posAdj} ${cls === 'barbarian' ? 'raw strength' : cls === 'rogue' ? 'agility' : cls === 'mage' ? 'arcane shields' : cls === 'ranger' ? 'quick reflexes' : cls === 'bard' ? 'desperate melody' : 'skills'} to survive.`,
      (n, pr, cls) => `Enchanted creatures erupted from every direction! ${n} staggered back, then found ${pr.posAdj} footing. The ${CLASSES[cls]?.label || 'adventurer'}'s instincts blazed to life — ${cls === 'barbarian' ? 'a war cry that made the beasts hesitate' : cls === 'rogue' ? 'a smoke bomb and three quick slashes from the shadows' : cls === 'mage' ? 'a shimmering ward that deflected claws and fangs' : cls === 'ranger' ? 'a volley of arrows that pinned the lead wolf mid-leap' : cls === 'bard' ? 'a shrieking chord that stunned the pack for precious seconds' : 'raw determination'}.`,
      (n, pr, cls) => `The forest ambush tested ${n} to the breaking point. Claws raked, fangs snapped, and the enchanted beasts seemed to multiply with every one defeated. But the ${CLASSES[cls]?.label || 'adventurer'} held the line — battered, bloodied, but unbowed. The kingdom watched through the enchanted mirror, and the kingdom held its breath.`,
    ],
  },
  // Phase 2: Troll Bridge
  'bridge-negotiate': {
    bard: [
      (n, pr) => `Chef the Troll blocked the bridge, arms folded. "NOBODY CROSSES!" ${n} stepped forward, lute in hand, and played a lullaby so beautiful that Chef's eyes welled with tears. "That... that was the song my mama used to sing." He stepped aside, sniffling.`,
      (n, pr) => `${n} bowed before Chef the Troll. "Great guardian of the bridge, surely one of your immense wisdom and culinary genius wouldn't deny humble travelers?" Chef blinked. "...Culinary genius?" He stood a little taller. "Go ahead."`,
      (n, pr) => `${n} pulled out ${pr.posAdj} lute and improvised "The Ballad of Chef the Magnificent." By the second verse, Chef was wiping tears. By the third, he was singing along. By the chorus, he had forgotten he was guarding anything. The Bard's weapon is flattery, and it never misses.`,
      (n, pr) => `"Before we cross," ${n} said, "would you tell us your story? Every great guardian has one." Chef's lip trembled. Nobody had ever ASKED. Twenty minutes later, the Troll was sobbing into the Bard's shoulder, and everyone had crossed the bridge twice.`,
    ],
    knight: [
      (n, pr) => `${n} challenged Chef the Troll to an honor duel. "If I win, we pass!" Chef cracked his knuckles. "Nobody beats Chef!" The Knight's blade met the Troll's ladle. CLANG.`,
      (n, pr) => `${n} drew ${pr.posAdj} sword and pointed it at Chef. "In the name of the quest, I demand passage." Chef laughed. The Knight didn't. Something about ${n}'s expression made the Troll reconsider. "...Fine. But only because I respect honor. Not because I'm scared." He was scared.`,
      (n, pr) => `${n} knelt before the Troll and placed ${pr.posAdj} sword on the ground. "I come not as a threat, but as a questing Knight seeking honorable passage." Chef was so confused by the display of chivalry that he forgot to block the bridge. "That was... weirdly respectful. Go ahead, weirdo."`,
      (n, pr) => `"I have slain enchanted wolves and solved ancient riddles," ${n} declared, ${pr.posAdj} armor gleaming in the bridge's torchlight. "Do you truly wish to test me, troll?" Chef sized up the Knight. The sword. The scars. The absolute lack of bluffing. "Chef is... letting you pass. Out of GENEROSITY."`,
    ],
    rogue: [
      (n, pr) => `${n} distracted Chef with a fake gold coin. "Look, a tip!" While the Troll scrambled, the Rogue slipped past. "Works every time."`,
      (n, pr) => `${n} told Chef there was a health inspector coming from the other direction. The Troll panicked, abandoned the bridge, and started scrubbing the riverbank. The Rogue was across before Chef realized trolls don't have health codes.`,
      (n, pr) => `${n} leaned against the bridge railing with studied nonchalance. "I hear the Troll on the NORTH bridge gives free passage AND a mint." Chef's eyes bulged. "WHAT?! Chef is MORE generous than that!" He flung the gate open. "Go! Tell everyone CHEF is the generous one!" The Rogue winked at nobody in particular.`,
      (n, pr) => `${n} pointed behind Chef. "Is that a Michelin reviewer?" The Troll spun around. By the time he turned back, the Rogue was halfway across, having also relieved Chef of his bridge keys. "You'll want these back eventually," ${n} called from the other side, dangling them. "Come and get them."`,
    ],
    barbarian: [
      (n, pr) => `${n} shoulder-checked Chef the Troll clean off the bridge. SPLASH. "Was that a troll? I thought it was a speed bump."`,
      (n, pr) => `Chef demanded a toll. ${n} picked up the Troll, set him gently to one side, and walked across. "I paid in 'not throwing you into the river.' You're welcome." The Barbarian's negotiation style is simple but effective.`,
      (n, pr) => `Chef planted himself in ${n}'s path. The Barbarian didn't slow down. ${pr.Sub} grabbed the Troll by both arms and spun him like a discus, launching Chef into the river with a magnificent splash. "Negotiation complete." ${pr.Sub} dusted off ${pr.posAdj} hands and crossed.`,
      (n, pr) => `"TOLL!" Chef roared. ${n} roared louder. Much louder. The sound wave knocked the Troll's hat off and rattled the bridge planks. Chef backed up three steps. Then five. Then off the bridge entirely. "The Barbarian's toll," ${n} said, cracking ${pr.posAdj} neck, "is that you get to keep your teeth."`,
    ],
    mage: [
      (n, pr) => `${n} cast an illusion of a five-star restaurant across the river. Chef abandoned the bridge instantly. "FINALLY! A kitchen worthy of CHEF!" The Mage watched him go. "Too easy."`,
      (n, pr) => `${n} transmuted a rock into a golden truffle and offered it to Chef. The Troll bit into it, eyes wide. "This... this is the finest truffle Chef has ever tasted!" He stepped aside, cradling the truffle like a newborn. The spell would wear off in an hour. The Mage would be long gone.`,
      (n, pr) => `${n} waved ${pr.posAdj} staff and Chef's reflection in the river transformed into a dashing Troll prince. Chef was mesmerized. "Is that... is that CHEF?" While the Troll admired his enchanted reflection, the Mage strolled across the bridge. "Vanity is the simplest spell to exploit."`,
      (n, pr) => `${n} conjured the aroma of a freshly baked soufflé — Chef's one weakness. The Troll's nose twitched. His eyes glazed. He wandered off the bridge following the scent like a cartoon character floating on a cloud. "Olfactory manipulation," the Mage noted. "Chapter three of the beginner's spellbook."`,
    ],
    ranger: [
      (n, pr) => `${n} found a rope bridge hidden upstream. Why negotiate with the troll when you can bypass the troll entirely? The Ranger always has a second path.`,
      (n, pr) => `${n} whistled, and a hawk swooped down, carrying a fish. Chef's eyes went wide. "Is that... fresh salmon?" The Ranger tossed it to the Troll and walked past while Chef was distracted. "Nature provides — and nature distracts."`,
      (n, pr) => `${n} crouched by the riverbank and cupped ${pr.posAdj} hands to the water. A family of otters surfaced, chittering. They led the Ranger to a series of stepping stones hidden just below the waterline. ${n} crossed the river twenty yards downstream, bypassing the bridge and the Troll entirely. "Why use the front door when nature builds a dozen back doors?"`,
      (n, pr) => `${n} tossed a handful of berries into the underbrush behind Chef. A bear emerged, sniffing. The Troll shrieked, abandoned the bridge, and scrambled up a tree. The Ranger walked across, pausing to scratch the bear behind its ears. "Good girl." The Ranger speaks every language except 'troll,' and that's never been a problem.`,
    ],
  },
  'bridge-blindfold': {
    rogue: [
      (n, pr) => `Blindfolded on a swaying bridge with a troll throwing apples? ${n} peeked. Obviously. The Rogue's blindfold had a convenient gap. Every apple dodged, every step sure. "I don't cheat. I adapt."`,
      (n, pr) => `${n} "accidentally" loosened ${pr.posAdj} blindfold three steps in. Could see everything. Every incoming apple, every loose plank. "What? It slipped." The Rogue doesn't play fair. The Rogue plays smart.`,
      (n, pr) => `${n} had already memorized the bridge layout before the blindfold went on. Photographic memory? Maybe. Rogue paranoia about always needing an escape route? Definitely. Every step was deliberate, every dodge premeditated. "I prepared for this."`,
    ],
    _default: [
      (n, pr, cls) => `Blindfolded on the bridge, ${n} relied on ${cls === 'ranger' ? 'trained ears catching every creak' : cls === 'barbarian' ? 'brute stubbornness, tanking every apple hit' : cls === 'knight' ? 'steady footwork and armor blocking the impacts' : cls === 'mage' ? 'mental mapping of the bridge layout' : cls === 'bard' ? 'listening to the rhythm of the trolls throws' : 'instinct'} to cross.`,
      (n, pr, cls) => `The blindfold turned the bridge into a nightmare of wind and uncertainty. ${n} stretched out ${pr.posAdj} arms for balance, each step a prayer. ${cls === 'ranger' ? 'The wood told stories through vibration — ${pr.sub} listened to every one' : cls === 'barbarian' ? 'An apple hit ${pr.obj} square in the face. ${pr.Sub} barely noticed' : cls === 'knight' ? '${pr.Sub} marched with military precision, counting paces' : cls === 'mage' ? '${pr.Sub} projected a mental echo to sense the edges' : cls === 'bard' ? '${pr.Sub} sang to keep panic at bay, using the echo to navigate' : '${pr.Sub} shuffled forward on faith alone'}.`,
      (n, pr, cls) => `${n} crossed the bridge blindfolded, arms stretched wide, heart pounding. The wind howled. Apples whizzed past. The ${CLASSES[cls]?.label || 'adventurer'} stumbled once, caught the railing, and pressed on. "I can't see the other side, but I know it's there." Sometimes, that's enough.`,
    ],
  },
  'bridge-endure': {
    barbarian: [
      (n, pr) => `Chef the Troll raged. Boulders flew. The bridge shook. ${n} planted ${pr.posAdj} feet, flexed, and ROARED back. The Barbarian does not break. The Barbarian does not bend. The bridge might collapse, but ${n} would be the last one standing on the rubble.`,
      (n, pr) => `The Troll's wrath was legendary. Most would run. ${n} walked INTO it. Every hit absorbed. Every blow endured. "Is that all you've got?" The Barbarian grinned through the pain.`,
      (n, pr) => `Boulders rained down like hail. ${n} caught one. Actually CAUGHT it. Then threw it back. Chef the Troll ducked behind his own bridge. "WHAT ARE YOU?!" The Barbarian cracked ${pr.posAdj} neck. "Your worst nightmare with an axe."`,
      (n, pr) => `The bridge was crumbling. Everyone else retreated. ${n} advanced. The Troll threw everything — boulders, barrels, what appeared to be a small piano. The Barbarian took every hit and kept walking. "Pain is temporary. GLORY is forever."`,
    ],
    _default: [
      (n, pr, cls) => `The Troll's fury tested every fiber of ${n}'s resolve. ${pr.Sub} held on, ${cls === 'knight' ? 'shield raised against the onslaught' : cls === 'rogue' ? 'weaving between the worst of it' : cls === 'mage' ? 'maintaining a wavering shield spell' : cls === 'ranger' ? 'using the railing for cover' : cls === 'bard' ? 'singing through gritted teeth' : 'enduring through willpower alone'}.`,
      (n, pr, cls) => `Chef's rage shook the bridge to its foundations. Planks splintered. Ropes frayed. ${n} dug in and refused to yield, drawing on every reserve of ${cls === 'knight' ? 'honor and iron will' : cls === 'rogue' ? 'survival instinct honed in darker places than this' : cls === 'mage' ? 'arcane endurance, the staff glowing brighter with each impact' : cls === 'ranger' ? 'wild resilience forged in storm and snowfall' : cls === 'bard' ? 'the power of a song that refused to end' : 'stubborn, beautiful defiance'}.`,
      (n, pr, cls) => `The bridge was a warzone. The Troll was relentless. ${n} was battered, bruised, barely standing — but standing. The kingdom watched through the enchanted mirror and saw something that fairy tales are made of: a ${CLASSES[cls]?.label || 'hero'} who would not fall.`,
    ],
  },
  // Phase 3: Dragon's Lair
  'dragon-sneak': {
    rogue: [
      (n, pr) => `${n} moved through the Dragon's lair like smoke — silent, formless, invisible. The treasure-piled cavern couldn't betray a footstep that never happened. The Rogue was born for this moment.`,
      (n, pr) => `Every shadow was a highway for ${n}. The Dragon's eyes scanned the cavern but the Rogue was already past, silent as death, grinning in the dark. "This is what I do."`,
      (n, pr) => `${n} mapped every gold coin, every sleeping twitch, every breath cycle. The Dragon exhaled — four seconds of cover. The Rogue moved. The Dragon inhaled — ${n} froze behind a gem-crusted pillar. Exhaled again. Moved again. A dance with death, and the Rogue led.`,
      (n, pr) => `The treasure-piled cavern was a minefield of noise — one shifted coin and the Dragon wakes. ${n} didn't shift a single one. The Rogue's feet found the silent paths between gold like ${pr.sub} had walked them a thousand times. "Greed leaves patterns. I read patterns."`,
    ],
    knight: [
      (n, pr) => `${n}'s armor clanked with every step. CLANK. CLANK. CLANK. The Dragon's ear twitched. The Knight froze. "...Please don't wake up." CLANK. The Dragon's eye opened.`,
      (n, pr) => `${n} tried to remove ${pr.posAdj} armor for stealth. Gauntlet hit the floor. CLANG. Breastplate followed. CRASH. The Dragon's tail twitched. "I am... not built for this," the Knight whispered, tiptoeing in chainmail. The chainmail jingled with every step.`,
      (n, pr) => `${n} held ${pr.posAdj} scabbard to stop it rattling and crept forward with excruciating care. Ten steps. Twenty. Almost past the tail. Then ${pr.posAdj} shield caught a stalactite with a CLANG that echoed for eternity. The Dragon's nostril flared. "I hate stealth missions," the Knight muttered through gritted teeth.`,
      (n, pr) => `Every fiber of ${n}'s being screamed to draw steel and fight. But the quest demanded silence. The Knight inched past the Dragon's snout, breath held, muscles locked. ${pr.Sub} could feel the beast's heat on ${pr.posAdj} face. "Honor is being brave enough to be quiet." It was the hardest battle ${pr.sub} had ever fought.`,
    ],
    barbarian: [
      (n, pr) => `${n} tried to sneak. The Barbarian's version of sneaking involved slightly quieter footsteps and breathing that was merely loud instead of thunderous. The Dragon stirred.`,
      (n, pr) => `"I'll be quiet," ${n} promised. ${pr.Sub} made it three steps before accidentally kicking a pile of gold coins that cascaded like an avalanche. The Dragon's eye opened. ${n} waved. "...Hey." The Barbarian has many talents. Stealth is not among them.`,
      (n, pr) => `${n} tiptoed with all the delicacy of a landslide wearing boots. Each footfall sent tremors through the treasure piles. The Dragon's claw twitched. ${n} froze mid-stride, one foot raised, holding the pose like a terrified statue. "I am being VERY sneaky right now," ${pr.sub} whispered at full volume.`,
      (n, pr) => `Stealth required patience. ${n} had none. The Barbarian's attempt at crawling produced more noise than most people's sprinting. Coins scattered. Jewels clinked. The Dragon's tail swept lazily closer. "Why does being quiet have to be so LOUD?" ${pr.sub} hissed, accidentally elbowing a golden chalice off a pile.`,
    ],
    _default: [
      (n, pr, cls) => `${n} crept through the Dragon's lair, ${cls === 'mage' ? 'muffling sound with a dampening spell' : cls === 'ranger' ? 'stepping only on the soft sand between treasure piles' : cls === 'bard' ? 'humming a sleep charm under breath' : 'moving as carefully as possible'}.`,
      (n, pr, cls) => `The Dragon's breath rumbled like distant thunder — asleep, but barely. ${n} inched forward through mountains of gold, every nerve screaming. The ${CLASSES[cls]?.label || 'adventurer'} was a single misstep from waking a monster, and the entire kingdom held its breath alongside ${pr.obj}.`,
      (n, pr, cls) => `${n} pressed against the cavern wall, edging past the Dragon's snout. ${pr.Sub} could feel the beast's hot breath on ${pr.posAdj} face. One twitch. One sound. One heartbeat too loud — and the quest would end in fire.`,
    ],
  },
  'dragon-fight': {
    barbarian: [
      (n, pr) => `The Dragon ROARED. Fire filled the cavern. ${n} ROARED BACK. The Barbarian charged straight at the beast, axe high, fear absent. "I'VE BEEN WAITING FOR THIS!" The collision shook the mountain.`,
      (n, pr) => `${n} caught the Dragon's claw mid-swing. Muscles screaming. Ground cracking. The Barbarian held. "You're big. I'm ANGRY. Let's see which matters more."`,
      (n, pr) => `Fire erupted from the Dragon's maw. ${n} ran THROUGH it. Singed, smoking, grinning. The Barbarian tackled the Dragon's foreleg and PULLED. The beast stumbled. "You breathe fire. I AM fire." The cavern shook with the impact of their clash.`,
      (n, pr) => `The Dragon was ancient. Powerful. Terrifying. ${n} was furious. In the calculus of battle, fury trumped all three. The Barbarian's axe bit into scale after scale, each strike accompanied by a war cry that echoed through the mountain.`,
    ],
    _default: [
      (n, pr, cls) => `The Dragon attacked with fury! ${n} ${cls === 'knight' ? 'met the beast head-on, sword flashing against scale and claw' : cls === 'rogue' ? 'dodged and slashed at vulnerable joints' : cls === 'mage' ? 'hurled arcane bolts at the creature\'s eyes' : cls === 'ranger' ? 'peppered the beast with arrows from a distance' : cls === 'bard' ? 'wove a dissonant chord that made the Dragon flinch' : 'fought with everything left'}.`,
      (n, pr, cls) => `The cavern erupted into chaos — fire, claw, and fury. ${n} fought the Dragon with ${cls === 'knight' ? 'disciplined swordwork that turned every swipe into a counter-attack' : cls === 'rogue' ? 'shadow-step dodges and precise dagger strikes to soft tissue' : cls === 'mage' ? 'layered arcane shields and retaliatory bolts of violet lightning' : cls === 'ranger' ? 'a rain of arrows aimed at the gaps between scales' : cls === 'bard' ? 'a war song that disoriented the beast, each note a weapon' : 'everything left in the tank'}. The kingdom would sing of this moment.`,
      (n, pr, cls) => `Dragonfire scorched the walls as ${n} dove for cover. The heat was unbearable. The fear was worse. But the ${CLASSES[cls]?.label || 'adventurer'} pushed through both, rising from the ashes of a near-miss to strike back. "You don't scare me." That was a lie. But it was a brave one.`,
    ],
  },
  'dragon-weakness': {
    mage: [
      (n, pr) => `${n}'s eyes locked onto a hairline crack in the Dragon's chest scale — the one weakness. "THERE!" ${pr.Sub} channeled every ounce of arcane energy into a single focused strike. The Dragon SCREAMED. The Mage found what no one else could see.`,
      (n, pr) => `The Mage saw the pattern. The Dragon always protected its left side. Overcompensation. Which meant the RIGHT side was the weakness. ${n} pointed. "Strike there." The Dragon fell.`,
      (n, pr) => `${n} had been studying the Dragon's magic aura since the sneak phase. Every scale had a resonance — except one. A dead spot beneath the jaw. "Magic can't protect what magic doesn't touch." The Mage's strike hit the one place the Dragon was mortal.`,
      (n, pr) => `While everyone attacked in desperation, ${n} OBSERVED. The Dragon flinched when fire reflected off gold. Photosensitive. The Mage angled ${pr.posAdj} staff to catch the flame's light and bounced a blinding beam into the beast's eyes. "Knowledge is the sharpest blade in any lair."`,
    ],
    _default: [
      (n, pr, cls) => `${n} searched desperately for the Dragon's weakness, ${cls === 'knight' ? 'testing every joint with sword strikes' : cls === 'rogue' ? 'analyzing the beast\'s movement for blind spots' : cls === 'ranger' ? 'reading the creature\'s body language' : cls === 'barbarian' ? 'hitting everything until something worked' : cls === 'bard' ? 'noting which notes made the Dragon flinch' : 'relying on intuition'}.`,
      (n, pr, cls) => `The Dragon seemed invincible — scales harder than steel, breath hotter than a forge. But ${n} noticed something. A hesitation. A flinch. The ${CLASSES[cls]?.label || 'adventurer'} had found the weakness the kingdom's fate depended on, and ${pr.sub} shouted the discovery to anyone close enough to hear.`,
      (n, pr, cls) => `Finding a Dragon's weakness is the stuff of legends. ${n} earned ${pr.posAdj} legend the hard way — through trial, error, and one observation that changed everything. The tide of battle turned on a single word from the ${CLASSES[cls]?.label || 'adventurer'}.`,
    ],
  },
  // Phase 4: Tower Rescue
  'tower-climb': {
    ranger: [
      (n, pr) => `${n} scaled the tower like a spider. Hand over hand, finding holds in the ancient stonework that nobody else could see. The wind howled. The height was dizzying. The Ranger didn't look down. The Ranger never looks down.`,
      (n, pr) => `The tower wall was sheer and the wind was cruel, but ${n} climbed as naturally as breathing. Fingers found impossible grips. Feet found invisible ledges. "The mountain taught me this."`,
      (n, pr) => `${n}'s fingers found the ancient stonework's secrets — a crack here, a jutting brick there. The wind tried to tear ${pr.obj} loose, but the Ranger clung to the tower like ivy. "Height is just distance with a view." ${pr.Sub} was halfway up before anyone else found a handhold.`,
      (n, pr) => `A hawk circled the tower above as ${n} climbed. The Ranger matched its spiral, finding the path of least resistance up the ancient wall. Every window ledge was a rest point. Every gargoyle was a handhold. "The tower is just a very tall cliff. And I've climbed worse."`,
    ],
    _default: [
      (n, pr, cls) => `${n} began the tower climb, ${cls === 'knight' ? 'armor weighing heavy but determination heavier' : cls === 'barbarian' ? 'punching handholds into the stone itself' : cls === 'rogue' ? 'finding every crack and crevice with practiced fingers' : cls === 'mage' ? 'levitating stone platforms as stepping stones' : cls === 'bard' ? 'singing to steady nerves against the vertigo' : 'climbing with everything left'}.`,
      (n, pr, cls) => `The tower stretched into storm clouds above. ${n} looked up, swallowed hard, and started climbing. Every foot gained was a victory against gravity. The ${CLASSES[cls]?.label || 'adventurer'} was battered from three phases of hell — but the tower didn't care about fatigue. It only cared about who could reach the top.`,
      (n, pr, cls) => `Wind howled around the tower's ancient stones as ${n} climbed higher than any sane person would go. ${pr.Sub} could see the entire kingdom below — the enchanted forest, the troll bridge, the smoking dragon's lair. Everything ${pr.sub} had survived. "I didn't come this far to fall now."`,
    ],
  },
  'tower-defenses': {
    knight: [
      (n, pr) => `Guards blocked the tower stairway. ${n} didn't slow down. Sword met spear met shield met fury. The Knight carved through the defenses like they were made of parchment. "I didn't come this far to be stopped by GUARDS."`,
      (n, pr) => `The enchanted gate slammed shut. The Knight slammed harder. ${n}'s blade cleaved through lock, chain, and bar in three precise strikes. "OPEN."`,
      (n, pr) => `A wall of enchanted shields materialized on the stairway. ${n} hit them at full sprint. The shields cracked. The Knight hit them again. They shattered. "Defenses are suggestions to a Knight. Suggestions I DECLINE."`,
      (n, pr) => `Tower sentinels crossed their spears in ${n}'s path. The Knight didn't break stride. ${pr.Sub} deflected both spears with a single sweeping parry and charged through the gap. "Honor does not wait in line." The sentinels were still processing what happened when ${n} was three flights up.`,
    ],
    _default: [
      (n, pr, cls) => `Tower defenses activated! ${n} ${cls === 'barbarian' ? 'smashed through the barricade like it personally offended ' + pr.obj : cls === 'rogue' ? 'slipped through a gap that shouldn\'t have been wide enough' : cls === 'mage' ? 'dispelled the enchanted barriers with a wave' : cls === 'ranger' ? 'shot the lock mechanism from across the room' : cls === 'bard' ? 'convinced the enchanted door it wanted to be open' : 'pushed through with sheer effort'}.`,
      (n, pr, cls) => `The tower's enchanted defenses sprang to life — walls shifting, floors tilting, doors sealing. ${n} met each obstacle with the ${CLASSES[cls]?.label || 'adventurer'}'s trademark resourcefulness. Destiny does not wait for locked doors, and neither did ${pr.sub}.`,
      (n, pr, cls) => `Every defense the tower threw at ${n} was met and overcome. The ${CLASSES[cls]?.label || 'adventurer'} was running on fumes and fury — the perfect fuel for the final stretch. The tower seemed to sense it. Its defenses grew more desperate. So did ${n}.`,
    ],
  },
  'tower-push': {
    bard: [
      (n, pr) => `${n}'s voice echoed through the tower like thunder wrapped in velvet. "WE DID NOT COME THIS FAR TO FALL!" The remaining knights felt strength surge through exhausted limbs. The Bard's rally cry could move mountains — and it moved them one final push toward the top.`,
      (n, pr) => `The final stretch. Everyone was broken. Exhausted. Done. Then ${n} began to sing. Not a battle cry — a lullaby of hope. Of stories unfinished. "This is not where your tale ends." Legs moved. Hearts beat. The Bard's power isn't magic. It's belief.`,
      (n, pr) => `${n} reached for the lute one last time. ${pr.Sub} was exhausted — everyone was. But the Bard played a melody that pulled tears from stone walls and courage from empty reserves. "One more verse. One more flight. ONE MORE STEP." The tower trembled. Music is the strongest magic of all.`,
      (n, pr) => `"LISTEN!" ${n}'s voice cut through the chaos like a golden blade. "This is the part of the story where the heroes almost give up. This is the part where it looks hopeless." A beat. Then the melody changed — bright, fierce, defiant. "But we don't live in THAT story." The Bard turned despair into a battle hymn.`,
    ],
    _default: [
      (n, pr, cls) => `The final push to the top! ${n} summoned every last reserve of ${cls === 'knight' ? 'courage and steel' : cls === 'barbarian' ? 'furious, primal energy' : cls === 'rogue' ? 'cunning and desperation' : cls === 'mage' ? 'arcane willpower' : cls === 'ranger' ? 'endurance and grit' : 'determination'}.`,
      (n, pr, cls) => `${n} was running on nothing but willpower and the memory of why ${pr.sub} started this quest. The final staircase spiraled into blinding light. The ${CLASSES[cls]?.label || 'adventurer'} climbed. Not because ${pr.sub} could. Because ${pr.sub} MUST. Every fairy tale has a final chapter, and ${n} refused to be a footnote.`,
      (n, pr, cls) => `The tower's peak was in sight. One last push. ${n}'s legs burned. ${pr.Sub} could barely see through exhaustion. But the ${CLASSES[cls]?.label || 'adventurer'} took one more step. Then another. Then another. And that is the difference between heroes and everyone else — heroes take one more step.`,
    ],
  },
};

// ── ELIMINATION TEXT ──
const ELIMINATION_TEXT = {
  'forest-ambush': [
    (n, pr) => `Enchanted vines erupted from the earth and coiled around ${n}! ${pr.Sub} struggled, slashed, but the forest had chosen its victim. ${n} was dragged into the undergrowth. Cursed. Eliminated.`,
    (n, pr) => `The enchanted wolves circled ${n}. Too many. Too fast. A howl, a flash of fangs, and the ${CLASSES[n._ppClass]?.label || 'adventurer'} was swept away in a tide of phantom fur. The forest claims another.`,
    (n, pr) => `A spectral stag appeared before ${n}, antlers lowered. The enchanted beast charged, and the impact sent the ${CLASSES[n._ppClass]?.label || 'adventurer'} crashing through the phantom undergrowth. When the mist cleared, ${n} was gone. The forest takes what the forest wants.`,
    (n, pr) => `The ground opened beneath ${n}'s feet — a fairy ring trap, ancient and merciless. ${pr.Sub} reached for a branch, a vine, anything. But the enchantment pulled ${pr.obj} down. The last thing the others saw was ${n}'s hand disappearing into the earth. The forest had claimed its sacrifice.`,
  ],
  'bridge-endure': [
    (n, pr) => `The Troll's final blow sent ${n} sailing off the bridge! ${pr.Sub} caught the railing, hung for one heartbeat... and fell. SPLASH. The river carried ${pr.obj} away. The bridge shows no mercy.`,
    (n, pr) => `${n} couldn't hold on. The Troll's wrath was too much. ${pr.Sub} was knocked clean off the bridge, tumbling into the dark waters below. Gone. The quest continues without ${pr.obj}.`,
    (n, pr) => `A boulder struck the bridge right where ${n} was standing. The planks splintered. For one terrible moment, ${pr.sub} balanced on the edge — then gravity made its choice. ${n} plummeted into the churning river below. The Troll laughed. The fairy tale grew darker.`,
    (n, pr) => `${n}'s grip slipped. ${pr.Sub} clawed at the ropes, the planks, the air itself. "NO!" But the bridge had no mercy. The fall seemed to last forever. The SPLASH was the sound of a quest ending. Chef the Troll dusted off his hands. "NEXT."`,
  ],
  'dragon-weakness': [
    (n, pr) => `The Dragon's tail swept ${n} off the ledge! ${pr.Sub} hit the cavern wall and crumpled. Burned, battered, and beaten. The Dragon claims its toll.`,
    (n, pr) => `Dragonfire engulfed ${n}'s position! When the smoke cleared, the ${CLASSES[n._ppClass]?.label || 'adventurer'} was down, singed but alive. ${pr.Sub} wouldn't continue. The lair is sealed.`,
    (n, pr) => `The Dragon's wing swept through the cavern like a battering ram. ${n} was caught mid-stride, launched across the lair into a pile of treasure. Gold coins rained down. When the dust settled, ${pr.sub} was buried. Alive, but cursed. The Dragon's toll is paid in fallen adventurers.`,
    (n, pr) => `${n} got too close. The Dragon's jaws snapped shut inches from ${pr.posAdj} face — the shockwave alone sent ${pr.obj} tumbling. ${pr.Sub} rolled, tried to rise, but the beast's roar pinned ${pr.obj} to the stone. "I'm... I'm done." The admission cost more than the injuries. The quest moves on. Not everyone makes it to the final chapter.`,
  ],
  'tower-push': [
    (n, pr) => `The tower staircase crumbled beneath ${n}'s feet! ${pr.Sub} scrambled for purchase, but the stones fell away like sand. The ${CLASSES[n._ppClass]?.label || 'adventurer'} slid back down into darkness, the tower's final cruel joke. So close to the top. So far from victory.`,
    (n, pr) => `${n}'s legs finally gave out on the last flight of stairs. ${pr.Sub} sank to the stone, unable to take one more step. "I can't." The words echoed through the tower like a funeral bell. The quest demanded everything, and ${n} had given it — but everything wasn't quite enough.`,
    (n, pr) => `An enchanted wind howled through the tower's peak and ripped ${n} from the stairway. ${pr.Sub} caught a windowsill, hung for a breathless moment, then lost ${pr.posAdj} grip. The fall was cushioned by magic — the tower doesn't kill, it CURSES. ${n} landed in a golden cage below. Eliminated by the tower's final enchantment.`,
  ],
};

// ── BETWEEN-BEAT SOCIAL EVENTS ──
const SOCIAL_EVENTS = [
  {
    id: 'allianceOath', weight: 3,
    check(alive) { return alive.some((a, i) => alive.some((b, j) => j > i && getBond(a, b) >= 2)); },
    apply(alive, classMap) {
      const pairs = [];
      for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
        if (getBond(alive[i], alive[j]) >= 2) pairs.push([alive[i], alive[j]]);
      }
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, 0.5);
      const clsA = CLASSES[classMap[a]], clsB = CLASSES[classMap[b]];
      const oathTexts = [
        `${a} and ${b} crossed ${clsA?.label === 'Knight' ? 'swords' : clsA?.label === 'Mage' ? 'staffs' : 'weapons'} beneath the ancient oak. "Until the tower falls." An oath sworn in fairy tale fashion — unbreakable until someone breaks it.`,
        `${a} extended ${pronouns(a).posAdj} hand. ${b} took it. No words needed — in the fairy tale realm, a handshake between warriors is worth more than any written contract. The campfire flickered. The pact was sealed.`,
        `"I watch your back, you watch mine," ${a} said. ${b} nodded. They pressed their ${clsA?.label === 'Knight' ? 'blades together' : clsA?.label === 'Mage' ? 'staffs together, sparks flying' : 'weapons together'} — a fairy tale oath, older than any kingdom. The enchanted forest seemed to glow brighter around them.`,
        `${b} saved ${a} a seat by the campfire and handed over half a ration. In the fairy tale world, breaking bread means swearing loyalty. "Alliance?" ${a} asked. "Alliance," ${b} confirmed. Simple. Powerful. Dangerous for everyone else.`,
      ];
      return { type: 'allianceOath', players: [a, b],
        text: pick(oathTexts),
        badgeText: 'QUEST OATH', badgeClass: 'green' };
    },
  },
  {
    id: 'rivalryDeclare', weight: 3,
    check(alive) { return alive.some((a, i) => alive.some((b, j) => j > i && getBond(a, b) <= -2)); },
    apply(alive, classMap) {
      const pairs = [];
      for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
        if (getBond(alive[i], alive[j]) <= -2) pairs.push([alive[i], alive[j]]);
      }
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.5);
      const rivalTexts = [
        `${a} locked eyes with ${b} across the campfire. "When this quest is over, you and I are going to have words." ${b}'s hand moved to ${pronouns(b).posAdj} weapon. "I look forward to it." The flames danced between them.`,
        `${a} found ${b}'s dagger embedded in ${pronouns(a).posAdj} bedroll — a warning, not an attack. ${a} pulled it free and hurled it back. It stuck in the tree an inch from ${b}'s ear. "Next time, aim for my face. At least then I'd respect you." The fairy tale had found its feud.`,
        `"You're going to be the reason someone loses this quest," ${a} said, loud enough for everyone to hear. ${b} stood slowly. "The only thing I'm going to lose is my patience with YOU." The campfire crackled in the silence that followed. Even the enchanted forest held its breath.`,
        `${a} deliberately took the seat ${b} had claimed. ${b} stood over ${pronouns(a).obj}, shadow falling like a blade. "Move." "Make me." Neither blinked. In fairy tales, rivalries burn hotter than dragonfire — and last twice as long.`,
      ];
      return { type: 'rivalryDeclare', players: [a, b],
        text: pick(rivalTexts),
        badgeText: 'RIVALRY', badgeClass: 'red' };
    },
  },
  {
    id: 'showmanceMoment', weight: 4,
    check(alive) { return gs.showmances?.some(s => alive.includes(s.a) && alive.includes(s.b)); },
    apply(alive, classMap) {
      const sm = gs.showmances?.find(s => alive.includes(s.a) && alive.includes(s.b));
      if (!sm) return null;
      addBond(sm.a, sm.b, 0.5);
      const smTexts = [
        `${sm.a} found ${sm.b} by the enchanted stream. "Are you hurt?" "Better now." They sat beneath the willows, the quest forgotten for one quiet moment. In every fairy tale, there's a love story hiding in the margins.`,
        `${sm.a} caught ${sm.b}'s hand as they crossed the enchanted bridge. Neither let go on the other side. The quest pressed on around them, but for a heartbeat the kingdom was just the two of them and the starlight filtering through the canopy.`,
        `${sm.b} was bandaging a wound when ${sm.a} knelt beside ${pronouns(sm.b).obj}. "Let me." Their fingers brushed. The enchanted forest sparkled a little brighter. "Be careful out there," ${sm.a} whispered. "I need you to make it to the end." The fairy tale love story wrote itself.`,
        `${sm.a} and ${sm.b} sat back-to-back against the ancient oak, catching their breath between phases. No words. Just the rhythm of two hearts beating in sync. The enchanted mirror in the tower showed the moment to the watching kingdom. Even the host got a little misty-eyed.`,
      ];
      return { type: 'showmanceMoment', players: [sm.a, sm.b],
        text: pick(smTexts),
        badgeText: 'FAIRY TALE LOVE', badgeClass: 'green' };
    },
  },
  {
    id: 'rogueScheme', weight: 2,
    check(alive, classMap) { return alive.some(n => classMap[n] === 'rogue' && ['villain', 'mastermind', 'schemer'].includes(arch(n))); },
    apply(alive, classMap) {
      const rogues = alive.filter(n => classMap[n] === 'rogue' && ['villain', 'mastermind', 'schemer'].includes(arch(n)));
      if (!rogues.length) return null;
      const rogue = pick(rogues);
      const target = pick(alive.filter(n => n !== rogue));
      if (!target) return null;
      addBond(rogue, target, -1);
      popDelta(rogue, -1);
      // Sabotage effect stored on the event — applied to fatigue in the simulation loop
      const _sabEffect = { sabotageTarget: target, sabotagePenalty: -2 };
      const schemeTexts = [
        `${rogue} whispered to the shadows. A plan formed. ${target}'s equipment was sabotaged — a frayed strap here, a dulled blade there. The Rogue's smile in the firelight was cold as winter. "In fairy tales, the clever ones survive."`,
        `While ${target} slept, ${rogue} swapped ${pronouns(target).posAdj} healing potion with colored water. "Survival of the fittest," the Rogue murmured. "And I'm the fittest because I cheat." The sabotage would reveal itself at the worst possible moment — that was the art of it.`,
        `${rogue} planted a false trail marker pointing ${target} toward the dragon's territory. "Oops." The Rogue examined ${pronouns(rogue).posAdj} fingernails with theatrical innocence. "Must have been the wind." Every fairy tale needs a trickster. ${rogue} was born for the part.`,
        `${rogue} loosened the straps on ${target}'s armor while pretending to help adjust it. "There, much better." It would fall apart mid-combat. The Rogue's cruelty was quiet, precise, and utterly deniable. "Accidents happen in enchanted kingdoms."`,
      ];
      return { type: 'rogueScheme', players: [rogue, target],
        text: pick(schemeTexts),
        badgeText: 'SABOTAGE', badgeClass: 'red', effect: _sabEffect };
    },
  },
  {
    id: 'princessFavor', weight: 3,
    check() { return true; },
    apply(alive, classMap, royalName, royalTitle) {
      if (!royalName || alive.length < 1) return null;
      const target = pick(alive);
      addBond(royalName, target, 0.5);
      const pr = pronouns(royalName);
      const favorTexts = [
        `${royalTitle} ${royalName} dropped a silk ribbon from the royal balcony. It fluttered down to ${target}, who caught it instinctively. ${royalName}: "A token of favor. Don't read too much into it." Everyone read too much into it.`,
        `${royalTitle} ${royalName} sent a golden apple down from the tower. It rolled to a stop at ${target}'s feet. "For the bravest knight on the field." ${target} picked it up. The others seethed with jealousy. Royal favor is a weapon sharper than any sword.`,
        `A scroll descended from the tower window, sealed with the royal crest. ${target} unrolled it: "You have the crown's confidence. Do not waste it." Signed with ${royalTitle} ${royalName}'s flourish. ${target} tucked it into ${pronouns(target).posAdj} armor. Favor received. Stakes raised.`,
        `${royalTitle} ${royalName} clapped three times from the balcony — the fairy tale signal for "that one impressed me." Every knight looked up. The royal gaze was fixed on ${target}. "Continue to fight like that," ${royalName} called down, "and you might actually survive this."`,
      ];
      return { type: 'princessFavor', players: [royalName, target],
        text: pick(favorTexts),
        badgeText: `${royalTitle.toUpperCase()} FAVOR`, badgeClass: 'amber' };
    },
  },
  {
    id: 'confessional', weight: 5,
    check() { return true; },
    apply(alive, classMap) {
      const p = pick(alive);
      const cls = classMap[p];
      const texts = [
        `${p}: "I'm wearing a costume, fighting a dragon, and my alliance partner just swore a blood oath on a magic sword. This is the weirdest Tuesday of my life."`,
        `${p}: "When ${host()} said 'fairy tale challenge,' I thought arts and crafts. Not ACTUAL COMBAT with enchanted creatures."`,
        `${p}: "The ${CLASSES[cls]?.label || 'class'} outfit actually looks good on me. Don't tell anyone I said that."`,
        `${p}: "I've seen every Disney movie. I know how this ends. The person who looks like the hero gets betrayed. I'm watching EVERYONE."`,
        `${p}: "In every fairy tale, someone gets cursed. I'm determined that someone won't be me."`,
        `${p}: "The dragon was scary. The troll was annoying. But the REAL monster is whoever decided to put me in tights."`,
        `${p}: "I keep forgetting this is a game show. The sword feels real. The dragon LOOKED real. My fear? DEFINITELY real."`,
        `${p}: "I made a quest oath with someone I've been trying to vote out for three weeks. Fairy tale logic is wild."`,
        `${p}: "If I win this challenge, I'm keeping the ${CLASSES[cls]?.label || 'class'} costume. Don't judge me."`,
        `${p}: "The ${CLASSES[cls]?.label || 'class'} role is actually perfect for me. I've been training for this my whole life — I just didn't know it was called '${CLASSES[cls]?.label || 'adventuring'}.'"`,
      ];
      return { type: 'confessional', players: [p], text: pick(texts), badgeText: 'CONFESSIONAL', badgeClass: 'amber' };
    },
  },
  {
    id: 'heroSpeech', weight: 2,
    check(alive) { return alive.some(n => ['hero', 'loyal-soldier'].includes(arch(n))); },
    apply(alive, classMap) {
      const heroes = alive.filter(n => ['hero', 'loyal-soldier'].includes(arch(n)));
      if (!heroes.length) return null;
      const p = pick(heroes);
      const allies = alive.filter(n => n !== p && getBond(p, n) >= 1).slice(0, 3);
      allies.forEach(a => addBond(p, a, 0.3));
      popDelta(p, 1);
      const heroTexts = [
        `${p} stood on a fallen log, moonlight catching ${pronouns(p).posAdj} armor. "We started this quest as strangers. We end it as something more. Whatever waits in that tower, we face it TOGETHER." ${allies.length ? `${allies.join(' and ')} raised their weapons in salute.` : 'The silence that followed was reverent.'}`,
        `${p} planted ${pronouns(p).posAdj} weapon in the earth and addressed the group. "I know we're tired. I know we're scared. But the kingdom is WATCHING." ${allies.length ? `${allies.join(', ')} stood taller.` : 'Spines straightened around the campfire.'} "We show them what heroes look like. Not in the good moments — in the HARD ones." The enchanted forest rustled its approval.`,
        `${p} shared ${pronouns(p).posAdj} last ration with the group without being asked. "A quest isn't won by one sword. It's won by many hearts beating as one." ${allies.length ? `${allies.join(' and ')} nodded, renewed.` : 'The exhaustion in the camp lifted, replaced by something warmer.'} Simple words. But in a fairy tale, simple words can move mountains.`,
        `"Look at what we've survived," ${p} said quietly, gesturing behind them — the dark forest, the broken bridge, the smoking lair. "We've already done the impossible three times. What's one more?" ${allies.length ? `${allies.join(' and ')} gripped their weapons tighter, courage renewed.` : 'The group rallied around the words like a fire in the dark.'}`,
      ];
      return { type: 'heroSpeech', players: [p, ...allies],
        text: pick(heroTexts),
        badgeText: 'RALLYING CRY', badgeClass: 'green' };
    },
  },
  {
    id: 'villainScheme', weight: 2,
    check(alive) { return alive.some(n => ['villain', 'mastermind'].includes(arch(n))); },
    apply(alive, classMap) {
      const villains = alive.filter(n => ['villain', 'mastermind'].includes(arch(n)));
      if (!villains.length) return null;
      const v = pick(villains);
      popDelta(v, -1);
      const villainTexts = [
        `${v} sat apart from the group, tracing patterns in the dirt by firelight. ${pronouns(v).Sub} was calculating. Always calculating. "They think this quest is about courage. It's about knowing when to let someone else take the hit." A slow smile. Fairy tales have villains for a reason.`,
        `${v} stared into the enchanted flames, and the flames stared back. "Heroes are predictable. They protect. They sacrifice. They're EASY to manipulate." ${pronouns(v).Sub} watched the others sleep. "By tomorrow, half of them will be gone. And they'll thank me for it."`,
        `${v} found a quiet corner of the camp and began sharpening ${pronouns(v).posAdj} blade — slowly, deliberately, making sure everyone could hear. "The fairy tale doesn't end the way they think it does," ${pronouns(v).sub} whispered. "The villain writes the last chapter."`,
        `The campfire cast long shadows, and ${v} sat in the longest one. ${pronouns(v).Sub} had memorized everyone's weaknesses. Their fears. Their bonds. "In fairy tales, the one who knows the most wins. Not the bravest. Not the strongest. The one who knows." ${pronouns(v).Sub} knew plenty.`,
      ];
      return { type: 'villainScheme', players: [v],
        text: pick(villainTexts),
        badgeText: 'DARK PLANS', badgeClass: 'red' };
    },
  },
  {
    id: 'princessCommentary', weight: 4,
    check() { return true; },
    apply(alive, classMap, royalName, royalTitle) {
      if (!royalName) return null;
      const a = arch(royalName);
      const pr = pronouns(royalName);
      let text;
      if (['villain', 'mastermind', 'schemer'].includes(a)) {
        const villainRoyalTexts = [
          `${royalTitle} ${royalName} watched from the tower with narrowed eyes. "They're all so desperate to prove themselves. It's... useful." ${pr.Sub} mentally ranked each knight's weaknesses. The throne room is the best vantage point for scheming.`,
          `${royalTitle} ${royalName} smiled from the tower as another knight fell. "One fewer competitor." ${pr.Sub} adjusted the crown. "They think I'm up here waiting to be rescued. I'm up here choosing who to destroy." The enchanted mirror reflected a face that had never needed saving.`,
          `"The sword goes to the weakest link," ${royalTitle} ${royalName} murmured, studying the quest below. "Not the strongest. The weakest. Because the weakest is the most GRATEFUL." ${pr.Sub} was playing chess while everyone else played fairy tales.`,
        ];
        text = pick(villainRoyalTexts);
      } else if (gs.showmances?.some(s => (s.a === royalName || s.b === royalName))) {
        const sm = gs.showmances.find(s => (s.a === royalName || s.b === royalName));
        const partner = sm.a === royalName ? sm.b : sm.a;
        const smRoyalTexts = [
          `${royalTitle} ${royalName} leaned against the tower window. ${pr.Sub} was watching the quest, yes. But ${pr.posAdj} eyes kept drifting to ${partner}. "Be careful down there." Whispered. Nobody heard. That was the point.`,
          `${royalTitle} ${royalName} pressed ${pr.posAdj} hand against the enchanted mirror, watching ${partner} fight. "Come back to me." The tower felt colder when ${partner} was in danger. The crown felt meaningless without someone to share it with.`,
          `Every time ${partner} stumbled, ${royalTitle} ${royalName} gripped the balcony railing until ${pr.posAdj} knuckles turned white. "The sword. I should have given ${pronouns(partner).obj} the sword." Regret and love twisted together in the tower's cold air. Fairy tale royalty was never meant to be this lonely.`,
        ];
        text = pick(smRoyalTexts);
      } else {
        const texts = [
          `${royalTitle} ${royalName} paced the tower, watching the battles below through an enchanted mirror. "This is harder than fighting. Watching and choosing." The crown felt heavier with every decision.`,
          `${royalTitle} ${royalName} gripped the balcony railing. "${pr.Sub === 'She' ? 'She' : 'He'} survived. Good." A pause. "I need them strong for what comes next." The ${royalTitle.toLowerCase()} was already planning the endgame.`,
          `${royalTitle} ${royalName} watched a knight fall and winced. "I didn't ask for this crown," ${pr.sub} whispered to the empty tower. "But I won't waste it." ${pr.Sub} turned back to the mirror. The quest demanded a ruler who could make hard choices. The crown demanded everything else.`,
          `${royalTitle} ${royalName} traced the edge of the enchanted mirror with ${pr.posAdj} fingertip. Every battle. Every fall. Every act of courage — ${pr.sub} saw it all. "Being royalty isn't about sitting on a throne. It's about knowing who deserves to stand beside you." The tower was a prison and a vantage point, both at once.`,
        ];
        text = pick(texts);
      }
      return { type: 'princessCommentary', players: [royalName], text, badgeText: `${royalTitle.toUpperCase()} WATCHES`, badgeClass: 'amber' };
    },
  },
];

function _generateSocialEvents(alive, classMap, count, royalName, royalTitle) {
  const events = [];
  const used = new Set();
  const eligible = SOCIAL_EVENTS.filter(e => e.check(alive, classMap));
  const weighted = [];
  for (const e of eligible) for (let i = 0; i < e.weight; i++) weighted.push(e);
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  for (const ev of shuffled) {
    if (events.length >= count) break;
    if (used.has(ev.id) && ev.id !== 'confessional') continue;
    const result = ev.apply(alive, classMap, royalName, royalTitle);
    if (result) { events.push(result); used.add(ev.id); }
  }
  return events;
}

// ══════════════════════════════════════════════════════════════
// DUEL TEXT
// ══════════════════════════════════════════════════════════════
const DUEL_TEXT = {
  shock: {
    royalWins: [
      (r, k, rt) => `${rt} ${r} descended from the tower — not with gratitude, but with a SWORD. ${k} froze. "What... what are you doing?" ${r} smiled. "Did you think this was a rescue? This is a DUEL." The first strike came before ${k} could even raise ${pronouns(k).posAdj} weapon.`,
      (r, k, rt) => `${k} reached the tower summit, victorious, exhausted. ${rt} ${r} stood waiting. "My hero." Then ${r} drew a blade. "Now prove you deserve the crown." The betrayal hit harder than the sword.`,
      (r, k, rt) => `${rt} ${r} was already armed when ${k} crested the final stair. "Surprise." The blade sang through the air. ${k} barely blocked it — stumbling backward, eyes wide. "The fairy tale lied," ${r} said. "Nobody was ever trapped up here. I was WAITING."`,
      (r, k, rt) => `The tower doors burst open. ${k} charged in ready to rescue royalty. Instead, ${rt} ${r} was seated on the throne, sword across ${pronouns(r).posAdj} lap, smiling. "You made it. I'm impressed." ${r} stood. "Now let's see if you're worthy." The first strike came from above.`,
    ],
    knightWins: [
      (r, k, rt) => `${rt} ${r} struck first — a slashing blow that should have ended it. But ${k} had survived four phases of hell. ${pronouns(k).Sub} CAUGHT the blade. "You'll have to do better than that, Your Highness."`,
      (r, k, rt) => `The betrayal stung, but ${k} had been preparing for this. Every fairy tale has a twist. The Knight parried the ${rt.toLowerCase()}'s opening strike and countered with controlled fury.`,
      (r, k, rt) => `${rt} ${r} swung for the head. ${k} ducked. Instinct. Survival. Four phases of combat had turned ${pronouns(k).obj} into something the ${rt.toLowerCase()} hadn't anticipated. "I've been stabbed, burned, and thrown off a bridge TODAY. You think a sword scares me?"`,
      (r, k, rt) => `The shock lasted exactly one second. Then ${k}'s training took over. Parry. Sidestep. Counter. The knight's blade was at ${r}'s throat before the ${rt.toLowerCase()} finished ${pronouns(r).posAdj} opening speech. "Save the monologue, Your Highness. I didn't climb this tower to LOSE."`,
    ],
  },
  clash: {
    royalWins: [
      (r, k, rt) => `${rt} ${r} hadn't fought in four grueling phases. ${r} was FRESH. ${k} was battered, bruised, running on fumes. The ${rt.toLowerCase()} exploited every wound, every limp, every moment of hesitation. "I watched every fight. I know every weakness." Intel is the deadliest weapon.`,
      (r, k, rt) => `Steel met steel in the tower's highest chamber. ${k}'s arms shook with exhaustion. ${r}'s were steady. "You fought bravely down there," ${r} admitted. "But bravery doesn't beat strategy."`,
      (r, k, rt) => `${r} circled ${k} like a predator, jabbing at the exact wounds the quest had inflicted. "I memorized every hit you took," the ${rt.toLowerCase()} said. "The mirror showed me everything." Knowledge, wielded like a blade, cut deeper than steel.`,
      (r, k, rt) => `The clash was brutal and one-sided. ${r} had been studying ${k}'s fighting style through the enchanted mirror for four phases. Every feint was anticipated. Every strike was countered. "You're predictable," ${r} said, almost sadly. "Heroes always are."`,
    ],
    knightWins: [
      (r, k, rt) => `${k} was exhausted. Beaten. Running on nothing but willpower. But willpower is what Knights are MADE of. ${pronouns(k).Sub} pushed through the fatigue and drove ${r} back step by step. "You watched from above. I LIVED it. There's a difference."`,
      (r, k, rt) => `${r} knew every weakness — but ${k} had been forged by those weaknesses. Every wound was a lesson. The Knight's endurance trumped the ${rt.toLowerCase()}'s intelligence.`,
      (r, k, rt) => `${r} pressed the advantage, targeting exhaustion and injury. But ${k} had something the ${rt.toLowerCase()} didn't — four phases of battle-hardened reflexes. The body was broken. The spirit was forged in fire. ${k} parried a strike that should have ended it and PUSHED BACK.`,
      (r, k, rt) => `"I know your weaknesses," ${r} taunted. ${k} grinned through split lips. "Then you know I don't HAVE any." The Knight absorbed the punishment and kept advancing. ${r}'s strategy was perfect. But ${k}'s heart was bigger than any strategy.`,
    ],
  },
  finish: {
    royalWins: [
      (r, k, rt) => `In the end, the crown won. ${rt} ${r} feinted left, struck right, and sent ${k}'s weapon clattering across the stone floor. ${r} pressed ${pronouns(r).posAdj} blade to ${k}'s throat. "Checkmate." The kingdom was never in danger. The ${rt.toLowerCase()} was the danger all along.`,
      (r, k, rt) => `${r} ended it with elegance — a perfect disarm, a sweeping flourish, and a blade at ${k}'s neck. ${k} sank to one knee. Not in defeat, but in respect. "Well played, Your Highness." The ${rt.toLowerCase()} removed the sword. "You fought well, Knight. Better than I expected."`,
      (r, k, rt) => `${r} spun, ducked under ${k}'s desperate final swing, and brought ${pronouns(r).posAdj} blade up to rest against the Knight's chest. "Yield." ${k} dropped ${pronouns(k).posAdj} weapon. "The crown wins." And so it did.`,
      (r, k, rt) => `The final exchange was three moves. ${r} read each one in ${k}'s exhausted stance before it happened. Parry. Redirect. Disarm. ${k}'s blade hit the stone floor and the echo rang through the tower like a bell. "The kingdom is mine," ${r} said softly. "It always was."`,
    ],
    knightWins: [
      (r, k, rt) => `${k} SURGED. One final, desperate, magnificent strike. ${r}'s blade went flying. The Knight stood over the ${rt.toLowerCase()}, sword raised, breathing hard. "I earned this." ${r} looked up from the floor. For the first time, genuine surprise. Then a smile. "Yes. You did."`,
      (r, k, rt) => `The fairy tale ending — but not the one anyone expected. ${k} caught ${r}'s blade between two hands, twisted, and disarmed royalty itself. The crown rolled across the floor. ${k} picked it up. "I'll be taking this."`,
      (r, k, rt) => `${k} had nothing left. No energy. No strategy. Just one final truth: ${pronouns(k).sub} had not survived hell to lose in the throne room. The Knight's last strike was wild, ugly, desperate — and it connected. ${r}'s blade clattered away. "The quest is OVER."`,
      (r, k, rt) => `${r} lunged for the kill — and ${k} sidestepped. The ${rt.toLowerCase()} stumbled past, overextended. The Knight's blade came to rest at the back of ${r}'s neck. "Checkmate," ${k} whispered, borrowing the ${rt.toLowerCase()}'s own word. "But I earned mine."`,
    ],
  },
  showmanceHesitation: [
    (a, b) => `Their eyes met. For one heartbeat, neither could swing. The memory of every quiet moment, every stolen glance, every whispered word at camp — it all surged up. ${a}'s blade trembled. ${b}'s grip loosened. Love makes terrible warriors.`,
    (a, b) => `"I can't..." ${a} whispered. ${b}'s weapon dipped. They stood there, in the wreckage of the fairy tale, unable to fight the person they'd been protecting. Then both attacked at once — because the game demands it. Even love has limits.`,
    (a, b) => `The swords crossed — and stopped. ${a} and ${b} stood inches apart, blades locked, breath mingling. "Not like this," ${b} murmured. "It has to be like this," ${a} replied. But neither moved. The fairy tale's cruelest twist: making lovers into enemies.`,
    (a, b) => `${a} swung — and pulled the strike at the last moment. ${b} flinched. "You missed on purpose." "I didn't miss. I couldn't." Every whispered promise, every stolen moment by the enchanted stream — all of it stood between their blades like a ghost.`,
  ],
  showmanceSurge: [
    (winner) => `But something broke through the hesitation — not anger, not strategy, but RESOLVE. ${winner} whispered, "Forgive me." And struck with everything. The boldest move in the fairy tale.`,
    (winner) => `The hesitation shattered like glass. ${winner} surged forward — eyes wet, jaw set. "This isn't about us. This is about the GAME." The strike landed true. Love didn't disappear. It just stepped aside for destiny.`,
    (winner) => `${winner} closed ${pronouns(winner).posAdj} eyes. Took one breath. Then opened them — and the softness was gone, replaced by steel. "I'm sorry." The final blow was swift, precise, and absolutely devastating. The fairy tale love story would have to wait.`,
    (winner) => `A single tear fell. Then ${winner} moved — not with anger, but with the quiet certainty of someone choosing the quest over everything else. The blade found its mark. "I'll spend the rest of the game making this up to you," ${winner} whispered. "But right now, I need to WIN."`,
  ],
};

// ══════════════════════════════════════════════════════════════
// ADVANTAGE TEXT
// ══════════════════════════════════════════════════════════════
const ADVANTAGE_TEXT = {
  sword: [
    (royal, recipient, rt) => `${rt} ${royal} raised the Enchanted Sword — it gleamed with golden light. "This blade carries my blessing. Use it wisely." ${royal} descended from the tower and placed it in ${recipient}'s hands. The crowd gasped. Power shifted. ${recipient} felt the magic pulse through the steel. "I won't let you down."`,
    (royal, recipient, rt) => `The Enchanted Sword chose its wielder — or rather, ${rt} ${royal} chose FOR it. "${recipient}." The name echoed across the battlefield. ${recipient} accepted the blade. It felt lighter than air and sharper than truth. "For the quest."`,
    (royal, recipient, rt) => `A golden scabbard materialized at the tower window. ${rt} ${royal} drew the Enchanted Sword from it — the blade hummed with ancient power — and cast it downward like a javelin of light. It embedded itself at ${recipient}'s feet, quivering with destiny. "The sword has found its champion," ${royal} called. ${recipient} pulled it free. The enchantment sang.`,
    (royal, recipient, rt) => `${rt} ${royal} pressed ${pronouns(royal).posAdj} lips to the Enchanted Sword's blade — a royal blessing, older than any kingdom. Then ${royal} tossed it from the balcony. ${recipient} caught it one-handed. The steel blazed gold at the touch. "Wield it well," ${royal} commanded. "That blade carries the weight of every fairy tale that came before."`,
  ],
  armor: [
    (royal, recipient, rt) => `${rt} ${royal} bestowed the Golden Armor upon ${recipient}. Plates of enchanted gold materialized, wrapping around the knight like a second skin. "This armor has protected royalty for a thousand years." ${recipient} stood taller. Stronger. Ready for the final battle.`,
    (royal, recipient, rt) => `Golden light poured from ${rt} ${royal}'s hands as the Golden Armor took shape around ${recipient}. Every plate was perfect. Every joint, divine. "You've earned this." ${recipient}: "I'll wear it with honor."`,
    (royal, recipient, rt) => `The Golden Armor descended from the tower in a cascade of enchanted light, assembling itself plate by plate around ${recipient}'s body. Chest. Arms. Shoulders. Every piece fit as though it had been forged for ${pronouns(recipient).obj} alone. ${rt} ${royal} watched from above. "The kingdom protects its champions. Now go be worthy of the protection."`,
    (royal, recipient, rt) => `${rt} ${royal} raised both hands and spoke a word that echoed through the fairy tale realm. Golden metal flowed from the tower walls like liquid sunlight, wrapping around ${recipient} in a brilliant cocoon. When it hardened, the armor was magnificent — ancient runes pulsing along every seam. ${recipient} flexed and the enchanted plates moved like a second skin. "I feel... invincible." ${royal} smiled. "Close enough."`,
  ],
  save: [
    (royal, saved, rt) => `"WAIT!" ${rt} ${royal}'s voice rang from the tower. "I invoke my Royal Save!" Golden light descended, wrapping around ${saved}'s fallen form. The curse shattered. ${saved} rose — battered but alive. "Your ${rt.toLowerCase()} commands you RISE." And rise ${saved} did.`,
    (royal, saved, rt) => `${rt} ${royal} threw the crystal pendant from the tower. It shattered on impact, releasing a wave of golden magic. ${saved}'s eyes snapped open. The wounds closed. "You're not done yet," ${royal} called down. "The fairy tale isn't over until I SAY it's over."`,
    (royal, saved, rt) => `A golden thread of light shot from the tower window and struck ${saved}'s chest like a thunderbolt of mercy. The curse recoiled. The wounds sealed. ${saved} gasped and staggered to ${pronouns(saved).posAdj} feet, restored by royal decree. ${rt} ${royal} gripped the balcony railing, breathless. "I chose you for a reason. Don't make me regret it."`,
    (royal, saved, rt) => `${rt} ${royal} whispered a name into the enchanted mirror — ${saved}'s name. The mirror cracked, and from the fracture poured a river of golden light that cascaded down the tower and pooled around ${saved}'s fallen body. The curse dissolved. ${saved} opened ${pronouns(saved).posAdj} eyes. "The crown demands your service a while longer," ${royal}'s voice echoed. The fairy tale was not done with ${saved} yet.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════
function _scoreBeat(name, cls, beatKey, swordHolder, armorHolder, fatigue) {
  const s = pStats(name);
  const beatStats = {
    'forest-navigate': ['intuition', 'mental'],
    'forest-riddle': ['mental', 'strategic'],
    'forest-ambush': ['physical', 'boldness'],
    'bridge-negotiate': ['social', 'mental'],
    'bridge-blindfold': ['strategic', 'intuition'],
    'bridge-endure': ['endurance', 'physical'],
    'dragon-sneak': ['strategic', 'intuition'],
    'dragon-fight': ['physical', 'boldness'],
    'dragon-weakness': ['mental', 'strategic'],
    'tower-climb': ['physical', 'intuition'],
    'tower-defenses': ['physical', 'boldness'],
    'tower-push': ['social', 'boldness'],
  };
  const shineClass = {
    'forest-navigate': 'ranger', 'forest-riddle': 'mage', 'forest-ambush': 'knight',
    'bridge-negotiate': 'bard', 'bridge-blindfold': 'rogue', 'bridge-endure': 'barbarian',
    'dragon-sneak': 'rogue', 'dragon-fight': 'barbarian', 'dragon-weakness': 'mage',
    'tower-climb': 'ranger', 'tower-defenses': 'knight', 'tower-push': 'bard',
  };
  const [s1, s2] = beatStats[beatKey] || ['physical', 'mental'];
  let score = s[s1] * 0.5 + s[s2] * 0.4 + noise(2);
  // Class advantage
  if (cls === shineClass[beatKey]) score += 2.5;
  // Sword bonus in dragon-fight
  if (swordHolder === name && beatKey === 'dragon-fight') score += 2;
  // Armor bonus in tower phases
  if (armorHolder === name && (beatKey === 'tower-defenses' || beatKey === 'tower-push')) score += 1.5;
  // Fatigue
  score += (fatigue[name] || 0);
  return score;
}

const STRUGGLE_TEXT = {
  knight: [
    (n, pr, beat) => `${n}'s armor weighed ${pr.obj} down. The Knight stumbled, sword dragging. "Come ON." ${pr.Sub} was falling behind and ${pr.sub} knew it.`,
    (n, pr, beat) => `${n} charged in headfirst — and paid for it. The Knight's brute approach backfired spectacularly. "That... wasn't supposed to happen."`,
    (n, pr, beat) => `${n} swung wide, hit nothing, and tripped over ${pr.posAdj} own cape. The Knight scrambled to recover, face burning with embarrassment.`,
  ],
  ranger: [
    (n, pr, beat) => `${n}'s instincts failed ${pr.obj}. The Ranger second-guessed every turn, every sign. The forest wasn't talking — or ${pr.sub} wasn't listening.`,
    (n, pr, beat) => `${n} tracked the wrong prints. The Ranger ended up in a dead end, brambles closing in. "This never happens to me." It was happening.`,
  ],
  mage: [
    (n, pr, beat) => `${n}'s spell fizzled. The Mage tried again — another fizzle. "The enchantment is... resistant." It wasn't. ${pr.Sub} was just off today.`,
    (n, pr, beat) => `${n} calculated the arcane formula, applied it confidently, and got it completely wrong. The Mage's face went red. "That was a... deliberate test."`,
  ],
  rogue: [
    (n, pr, beat) => `${n} tried to sneak past — and stepped on a twig. A very loud twig. The Rogue froze. Everyone stared. "...I meant to do that."`,
    (n, pr, beat) => `${n}'s lockpick snapped in the mechanism. Then the backup. Then the backup's backup. "I'm having an OFF DAY, okay?!"`,
  ],
  bard: [
    (n, pr, beat) => `${n} strummed a chord and... nothing. The lute was out of tune. The Bard's voice cracked on the high note. The enchantment was unimpressed.`,
    (n, pr, beat) => `${n} launched into an inspiring ballad. The audience was unmoved. A cricket chirped. "Tough crowd," the Bard muttered, retreating.`,
  ],
  barbarian: [
    (n, pr, beat) => `${n} roared and charged — right into a wall. The Barbarian peeled ${pr.ref} off the stone, seeing stars. "Wall. Didn't see that."`,
    (n, pr, beat) => `${n} swung the battle axe with everything ${pr.sub} had. It embedded in a tree and wouldn't come out. The Barbarian pulled, twisted, and eventually abandoned it. "I'll get a new one."`,
  ],
};

const SMART_CLASS_TEXT = {
  knight: {
    'forest-riddle': [
      (n, pr) => `${n} studied the riddle with surprising patience. The Knight read it twice, thought carefully, and spoke the answer. The gate opened. "What? Knights can READ."`,
      (n, pr) => `${n} knelt before the Riddle Gate and thought — actually thought. The answer came not from instinct but from ${pr.posAdj} mind. "Strategy isn't just for battle," the Knight murmured as the gate swung wide.`,
      (n, pr) => `${n} surprised everyone. The Knight traced the ancient letters with an armored finger, lips moving, then smiled. "My mother taught me this language." The gate recognized the answer and opened with respect.`,
    ],
    'dragon-weakness': [
      (n, pr) => `${n} circled the dragon, studying its movements with a tactician's eye. "There — the scale pattern breaks at the neck." The Knight found the weakness through combat analysis, not magic.`,
      (n, pr) => `"Every opponent has a tell," ${n} said, watching the dragon carefully. The Knight spotted the hesitation in its left wing — an old injury. "Strike there." Brains behind the brawn.`,
    ],
  },
};

function _getBeatText(name, cls, beatKey, score, maxScore) {
  const pr = pronouns(name);
  const s = pStats(name);
  const beatTexts = BEAT_TEXT[beatKey];
  if (!beatTexts) return `${name} pushed through the challenge.`;

  // Score determines text tier: top 30% = heroic, middle 30% = adequate, bottom 40% = struggle/fail
  const ratio = maxScore > 0 ? score / maxScore : 0.5;
  if (ratio < 0.35 && STRUGGLE_TEXT[cls]?.length) {
    return pick(STRUGGLE_TEXT[cls])(name, pr, beatKey);
  }
  if (ratio < 0.6) {
    // Middle tier — adequate but not impressive
    const adequateTexts = [
      `${name} managed to get through, but it wasn't pretty. The ${CLASSES[cls]?.label || 'adventurer'} scraped by on determination more than skill.`,
      `${name} pushed through with effort. Not the worst performance, not the best. The quest continued.`,
      `It wasn't ${name}'s finest moment, but ${pr.sub} survived it. Sometimes that's enough.`,
      `${name} gritted ${pr.posAdj} teeth and powered through. No style points, but the job got done. Barely.`,
    ];
    return pick(adequateTexts);
  }

  // Smart variant: if player has high mental/strategic but is in a "dumb" class, use smart text
  if (SMART_CLASS_TEXT[cls]?.[beatKey]?.length && (s.mental >= 6 || s.strategic >= 6)) {
    return pick(SMART_CLASS_TEXT[cls][beatKey])(name, pr);
  }

  const classTexts = beatTexts[cls];
  if (classTexts?.length) return pick(classTexts)(name, pr);
  const defaults = beatTexts._default;
  if (defaults?.length) return pick(defaults)(name, pr, cls);
  return `${name} gave it everything as the ${CLASSES[cls]?.label || 'adventurer'}.`;
}

function _getElimText(name, beatKey) {
  const pr = pronouns(name);
  const pool = ELIMINATION_TEXT[beatKey];
  if (pool?.length) return pick(pool)(name, pr);
  return `${name} was eliminated from the quest. The fairy tale continues without ${pr.obj}.`;
}

// Class combos — complementary pairs that get a teamwork bonus when both alive
const CLASS_COMBOS = [
  { pair: ['knight', 'mage'], bonus: 1.5, texts: [
    (a, b) => `${a} held the line while ${b} prepared the spell behind ${pronouns(a).obj}. Tank and caster — the oldest combo in the book, and still the best.`,
    (a, b) => `"Cover me!" ${b} shouted. ${a} raised ${pronouns(a).posAdj} shield without hesitation. The Knight protected. The Mage delivered. Together, unstoppable.`,
  ]},
  { pair: ['bard', 'barbarian'], bonus: 1.5, texts: [
    (a, b) => `${a}'s war song fueled ${b}'s rage. The Bard's melody turned the Barbarian into a force of nature — every note was another swing of the axe.`,
    (a, b) => `${a} played faster. ${b} hit harder. The Bard and the Barbarian fed off each other's energy until the ground shook with their combined fury.`,
  ]},
  { pair: ['ranger', 'rogue'], bonus: 1.2, texts: [
    (a, b) => `${a} spotted the path. ${b} cleared the traps along it. Ranger and Rogue — the forest's deadliest partnership.`,
    (a, b) => `${a} tracked from above while ${b} infiltrated below. Between the Ranger's eyes and the Rogue's hands, nothing stayed hidden for long.`,
  ]},
  { pair: ['knight', 'bard'], bonus: 1.0, texts: [
    (a, b) => `${a} fought with renewed vigor as ${b}'s melody swelled behind ${pronouns(a).obj}. "That song..." the Knight breathed. "It makes me feel invincible." The Bard smiled. "That's the idea."`,
  ]},
  { pair: ['mage', 'ranger'], bonus: 1.0, texts: [
    (a, b) => `${b}'s nature instincts and ${a}'s arcane knowledge combined — the Ranger felt the forest's pulse while the Mage read its magical signature. Together they saw the full picture.`,
  ]},
];

// Fatigue carry-over narration — prefixed to the main text when a player is worn down
const FATIGUE_PREFIX = [
  (n, pr) => `Still aching from the last trial, `,
  (n, pr) => `Bruised and battered but refusing to quit, `,
  (n, pr) => `${n} winced with every step — the previous round had taken its toll. But `,
  (n, pr) => `Every muscle screamed for rest. ${n} ignored them all. `,
  (n, pr) => `The wounds from before hadn't healed. ${n} pushed through anyway — `,
  (n, pr) => `Limping slightly, jaw set, ${n} forced ${pr.ref} forward. `,
];

function _simulatePhase(phaseId, phaseLabel, beats, alive, classMap, result, ep, campKey, fatigue) {
  const phase = { id: phaseId, label: phaseLabel, beats: [], eliminated: [], events: [] };
  let prevBeatPerf = {}; // track previous beat performance per player

  for (const beat of beats) {
    const scores = {};
    const texts = {};

    // Class combo bonus — check for complementary pairs
    const combosThisBeat = [];
    for (const combo of CLASS_COMBOS) {
      const playersA = alive.filter(n => classMap[n] === combo.pair[0]);
      const playersB = alive.filter(n => classMap[n] === combo.pair[1]);
      if (playersA.length && playersB.length) {
        const a = pick(playersA), b = pick(playersB);
        combosThisBeat.push({ a, b, bonus: combo.bonus, text: pick(combo.texts)(a, b) });
      }
    }

    for (const name of alive) {
      let score = _scoreBeat(name, classMap[name], beat.key, result.swordHolder, result.armorHolder, fatigue);
      // Apply class combo bonus
      const myCombo = combosThisBeat.find(c => c.a === name || c.b === name);
      if (myCombo) score += myCombo.bonus;
      scores[name] = score;
      fatigue[name] = (fatigue[name] || 0) - 0.3;
    }
    const maxBeatScore = Math.max(1, ...Object.values(scores));
    for (const name of alive) {
      let baseText = _getBeatText(name, classMap[name], beat.key, scores[name], maxBeatScore);
      // Fatigue carry-over: if player did poorly last beat AND has significant fatigue, prefix with fatigue text
      const wasBadLastBeat = prevBeatPerf[name] === 'rough' || prevBeatPerf[name] === 'meh';
      const isFatigued = (fatigue[name] || 0) < -1.5;
      if (wasBadLastBeat && isFatigued && phase.beats.length > 0) {
        const prefix = pick(FATIGUE_PREFIX)(name, pronouns(name));
        baseText = prefix + baseText.charAt(0).toLowerCase() + baseText.slice(1);
      }
      texts[name] = baseText;
      // Track performance for next beat
      const ratio = maxBeatScore > 0 ? scores[name] / maxBeatScore : 0.5;
      prevBeatPerf[name] = ratio < 0.35 ? 'rough' : ratio < 0.6 ? 'meh' : 'good';
    }
    // Rank
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const beatResult = { key: beat.key, label: beat.label, ranked: ranked.map(([n, s]) => ({ name: n, score: s, text: texts[n], cls: classMap[n] })), eliminated: [], combos: combosThisBeat };

    // Accumulate chalMemberScores
    ranked.forEach(([n, s], idx) => {
      ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + Math.max(1, alive.length - idx);
    });

    // Eliminate bottom 1-2 on elimination beats — uses CUMULATIVE scores, not just this beat
    if (beat.eliminates) {
      const cumRanked = [...alive].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
      const elimCount = alive.length <= 4 ? 1 : (alive.length <= 6 ? (Math.random() < 0.5 ? 1 : 2) : 2);
      for (let i = 0; i < elimCount && alive.length > 2; i++) {
        const victim = cumRanked[cumRanked.length - 1 - i];
        if (!victim) break;
        // Eliminate first, THEN check if royal saves (revive the fallen)
        beatResult.eliminated.push({ name: victim, text: _getElimText(victim, beat.key) });
        phase.eliminated.push(victim);
        const idx2 = alive.indexOf(victim);
        if (idx2 >= 0) alive.splice(idx2, 1);
        popDelta(victim, -1);
        ep.campEvents[campKey].post.push({
          text: `${victim} was eliminated from the fairy tale quest during ${beat.label}!`,
          players: [victim],
          badgeText: 'CURSED!', badgeClass: 'red', tag: 'princess-pride',
        });
        // Royal save — fires for close allies, showmance, OR strategic value
        const royalBond = getBond(result.royalName, victim);
        const isShowmancePair = gs.showmances?.some(s => (s.a === result.royalName && s.b === victim) || (s.b === result.royalName && s.a === victim));
        const royalStrategic = pStats(result.royalName).strategic;
        const strategicSave = royalStrategic * 0.08 + royalBond * 0.1 + noise(0.2) > 0.3;
        const saveWorthy = isShowmancePair || royalBond >= 2 || strategicSave;
        if (result.royalSaveAvailable && !result.royalSaveUsed && saveWorthy) {
          result.royalSaveUsed = true;
          result.royalSavedPlayer = victim;
          result.royalSaveBeat = beat.key;
          const saveText = pick(ADVANTAGE_TEXT.save)(result.royalName, victim, result.royalTitle);
          beatResult.save = { player: victim, text: saveText };
          alive.push(victim);
          const elimIdx = phase.eliminated.indexOf(victim);
          if (elimIdx >= 0) phase.eliminated.splice(elimIdx, 1);
          popDelta(result.royalName, 1);
          popDelta(victim, 2);
          addBond(result.royalName, victim, 2);
          ep.campEvents[campKey].post.push({
            text: `${result.royalTitle} ${result.royalName} used the Royal Save on ${victim}!`,
            players: [result.royalName, victim],
            badgeText: 'ROYAL SAVE!', badgeClass: 'green', tag: 'princess-pride',
          });
        }
      }
    }
    // Between-beat social events (1-2 per gap)
    const betweenCount = 1 + Math.floor(Math.random() * 2);
    const beatEvents = _generateSocialEvents(alive, classMap, betweenCount, result.royalName, result.royalTitle);
    beatResult.events = beatEvents;
    for (const ev of beatEvents) {
      ep.campEvents[campKey].post.push({ ...ev, tag: 'princess-pride' });
      // Apply gameplay effects from events
      if (ev.effect?.sabotageTarget && alive.includes(ev.effect.sabotageTarget)) {
        fatigue[ev.effect.sabotageTarget] = (fatigue[ev.effect.sabotageTarget] || 0) + (ev.effect.sabotagePenalty || -2);
      }
    }
    beatResult.scoreSnapshot = { ...ep.chalMemberScores };
    phase.beats.push(beatResult);
  }
  phase.events = [];
  return phase;
}

function _simulateDuel(royalName, knightName, result, ep, campKey, fatigue) {
  const rs = pStats(royalName);
  const ks = pStats(knightName);
  const rPr = pronouns(royalName);
  const kPr = pronouns(knightName);
  const rt = result.royalTitle;

  let royalMomentum = 0;
  const exchanges = [];

  // ── HAPPY ENDING CHECK: showmance or very high bond = they refuse to fight ──
  const duelBond = getBond(royalName, knightName);
  const isShowmance = gs.showmances?.some(s =>
    (s.a === royalName && s.b === knightName) || (s.a === knightName && s.b === royalName));
  const happyEnding = isShowmance || (duelBond >= 6 && Math.random() < 0.7);

  if (happyEnding) {
    const happyTexts = [
      { royal: `${rt} ${royalName} drew the sword... and lowered it. "I can't." ${knightName} stared. "What?" "I said I CAN'T. Not against you." The sword clattered to the stone floor. The tower fell silent.`,
        knight: `${knightName} looked at the blade, then at ${royalName}. Then ${pronouns(knightName).sub} dropped ${pronouns(knightName).posAdj} weapon too. "If you're not fighting, neither am I." They stood there, disarmed, in the highest room of the tallest tower. Two people who chose each other over victory.`,
        chris: `${host()} burst through the door. "WHAT ARE YOU DOING?! You're supposed to FIGHT! This is a DUEL! D-U-E-L!" ${royalName} and ${knightName} looked at each other, then back at ${host()}. "No." ${host()} sputtered. "You can't just — that's not how — the RATINGS—" He paced furiously. "FINE. You BOTH get immunity. Are you HAPPY?! Because I'm NOT. This was supposed to be DRAMATIC. This is a FAIRY TALE, not a LOVE STORY!" He paused. "...Okay, it's a little bit of a love story."`,
      },
      { royal: `${rt} ${royalName} raised the blade and ${knightName} braced for impact. The swing came — and stopped an inch from ${knightName}'s throat. "I watched you fight through everything down there," ${royalName} whispered. "I'm not going to be the thing that beats you."`,
        knight: `${knightName}'s eyes widened. Then softened. "You know... I didn't climb this tower for immunity." ${pronouns(knightName).Sub} reached out and gently pushed ${royalName}'s blade aside. "I climbed it for you." The fairy tale had found its ending.`,
        chris: `"Oh COME ON!" ${host()} threw his clipboard. "This is a COMPETITION, not a Disney movie!" He stormed around the room. "Rules say you fight! My contract says—" ${royalName}: "Give us both immunity or we walk." ${host()} stared. "${knightName}: "Together." ${host()} looked at the camera. Looked at the ratings. Looked at the two people who had just ruined his dramatic finale and turned it into something BETTER. "...Fine. DOUBLE immunity. But I'm billing you both for the swords."`,
      },
    ];
    const ht = pick(happyTexts);
    exchanges.push({ name: 'The Moment', winner: royalName, shift: 0, text: ht.royal });
    exchanges.push({ name: 'The Choice', winner: knightName, shift: 0, text: ht.knight });
    exchanges.push({ name: 'The Ending', winner: 'both', shift: 0, text: ht.chris });

    addBond(royalName, knightName, 3);
    popDelta(royalName, 3);
    popDelta(knightName, 3);

    return {
      winner: 'both', royalName, knightName, exchanges, narrow: false,
      happyEnding: true,
      immunityBoth: true,
    };
  }

  // ── NORMAL DUEL ──
  // Battle-hardened bonus: surviving 4 phases gives the knight combat instincts the royal doesn't have
  const battleHardened = 3;
  // Fatigue is halved for the duel — adrenaline kicks in at the final moment
  const duelFatigue = (fatigue[knightName] || 0) * 0.5;
  // Golden Armor bonus — buffed to be meaningful
  const armorBonus = result.armorHolder === knightName ? 4 : 0;

  // Beat 1: The Shock — Knight: boldness + physical. Royal: social + strategic
  const kBeat1 = ks.boldness * 0.5 + ks.physical * 0.4 + duelFatigue + battleHardened + noise(3);
  const rBeat1 = rs.social * 0.5 + rs.strategic * 0.4 + noise(3);
  const beat1Winner = rBeat1 >= kBeat1 ? royalName : knightName;
  const beat1Shift = Math.abs(rBeat1 - kBeat1) > 2 ? 3 : Math.abs(rBeat1 - kBeat1) > 1 ? 2 : 1;
  royalMomentum += (beat1Winner === royalName ? beat1Shift : -beat1Shift);
  const beat1Texts = beat1Winner === royalName ? DUEL_TEXT.shock.royalWins : DUEL_TEXT.shock.knightWins;
  exchanges.push({ name: 'The Shock', winner: beat1Winner, shift: beat1Shift,
    text: pick(beat1Texts)(royalName, knightName, rt) });

  // Showmance hesitation
  let showmanceText = '';
  if (isShowmance) {
    showmanceText = pick(DUEL_TEXT.showmanceHesitation)(royalName, knightName);
    // Both get penalty then winner gets surge
    royalMomentum *= 0.7;
  }

  // Beat 2: The Clash — Knight: physical + endurance + armor. Royal: mental + intuition (intel bonus reduced)
  const kBeat2 = ks.physical * 0.5 + ks.endurance * 0.4 + duelFatigue + battleHardened + armorBonus * 0.5 + noise(3);
  const intelBonus = rs.intuition * 0.15; // watched fights, but watching isn't the same as doing
  const rBeat2 = rs.mental * 0.5 + rs.intuition * 0.4 + intelBonus + noise(3);
  const kBeat2Final = kBeat2;
  const beat2Winner = rBeat2 >= kBeat2Final ? royalName : knightName;
  const beat2Shift = Math.abs(rBeat2 - kBeat2Final) > 2 ? 3 : Math.abs(rBeat2 - kBeat2Final) > 1 ? 2 : 1;
  royalMomentum += (beat2Winner === royalName ? beat2Shift : -beat2Shift);
  const beat2Texts = beat2Winner === royalName ? DUEL_TEXT.clash.royalWins : DUEL_TEXT.clash.knightWins;
  exchanges.push({ name: 'The Clash', winner: beat2Winner, shift: beat2Shift,
    text: pick(beat2Texts)(royalName, knightName, rt) });

  // Beat 3: The Finish — Knight: strategic + boldness + armor. Royal: boldness + social
  const kBeat3 = ks.strategic * 0.5 + ks.boldness * 0.4 + duelFatigue + battleHardened + armorBonus * 0.5 + noise(4);
  const rBeat3 = rs.boldness * 0.5 + rs.social * 0.4 + noise(4);
  // Showmance surge for the winner
  if (isShowmance) {
    const surgeTarget = royalMomentum >= 0 ? royalName : knightName;
    if (surgeTarget === royalName) royalMomentum += 1.5;
    else royalMomentum -= 1.5;
  }
  const beat3Winner = (rBeat3 + (royalMomentum > 0 ? 1 : 0)) >= (kBeat3 + (royalMomentum < 0 ? 1 : 0)) ? royalName : knightName;
  const beat3Shift = Math.abs(rBeat3 - kBeat3) > 2 ? 3 : 2;
  royalMomentum += (beat3Winner === royalName ? beat3Shift : -beat3Shift);
  const winner = royalMomentum >= 0 ? royalName : knightName;
  const loser = winner === royalName ? knightName : royalName;
  const beat3Texts = winner === royalName ? DUEL_TEXT.finish.royalWins : DUEL_TEXT.finish.knightWins;
  let finishText = pick(beat3Texts)(royalName, knightName, rt);
  if (isShowmance) finishText = pick(DUEL_TEXT.showmanceSurge)(winner) + ' ' + finishText;
  exchanges.push({ name: 'The Finish', winner: beat3Winner, shift: beat3Shift, text: finishText });

  return { winner, loser, exchanges, royalMomentum: Math.abs(royalMomentum),
    isShowmance, showmanceText, narrow: Math.abs(royalMomentum) <= 3 };
}

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulatePrincessPride(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    royalName: null, royalTitle: null,
    classMap: {},
    phases: [],
    swordHolder: null, armorHolder: null,
    royalSaveAvailable: true, royalSaveUsed: false, royalSavedPlayer: null, royalSaveBeat: null,
    swordGiven: { recipient: null, text: '' },
    armorGiven: { recipient: null, text: '' },
    duel: null,
    immunityWinner: null,
    eliminationOrder: [],
  };

  // ── GLASS SLIPPER CEREMONY ──
  const { royalName, royalTitle } = _selectRoyal(active);
  result.royalName = royalName;
  result.royalTitle = royalTitle;

  // Ceremony narration
  result.ceremonyText = pick(CEREMONY_TEXT.slipper)(host(), royalName, royalTitle);
  const rArch = arch(royalName);
  const rPr = pronouns(royalName);
  if (['villain', 'mastermind', 'schemer'].includes(rArch)) {
    result.reactionText = pick(CEREMONY_TEXT.reaction.villain)(royalName, rPr, royalTitle);
  } else if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer'].includes(rArch)) {
    result.reactionText = pick(CEREMONY_TEXT.reaction.happy)(royalName, rPr, royalTitle);
  } else {
    result.reactionText = pick(CEREMONY_TEXT.reaction.reluctant)(royalName, rPr, royalTitle);
  }

  // ── CLASS ASSIGNMENT ──
  const knights = active.filter(n => n !== royalName);
  const classMap = _assignClasses(knights);
  result.classMap = classMap;

  // Generate assignment text
  result.classAssignments = [];
  for (const name of knights) {
    const cls = classMap[name];
    const pr = pronouns(name);
    const text = pick(CLASS_ASSIGN_TEXT[cls] || CLASS_ASSIGN_TEXT.knight)(name, pr);
    result.classAssignments.push({ name, cls, text });
  }

  popDelta(royalName, 2);
  ep.campEvents[campKey].post.push({
    text: `${royalTitle} ${royalName} was crowned in the Glass Slipper Ceremony!`,
    players: [royalName], badgeText: 'CROWNED!', badgeClass: 'green', tag: 'princess-pride',
  });

  // ── PHASES ──
  const alive = [...knights];
  const fatigue = {};

  // Phase 1: Enchanted Forest
  const phase1 = _simulatePhase('forest', 'Enchanted Forest', [
    { key: 'forest-navigate', label: 'Navigate the Path', eliminates: false },
    { key: 'forest-riddle', label: 'Riddle Gate', eliminates: false },
    { key: 'forest-ambush', label: 'Creature Ambush', eliminates: true },
  ], alive, classMap, result, ep, campKey, fatigue);
  result.phases.push(phase1);
  result.eliminationOrder.push(...phase1.eliminated);

  // Phase 2: Troll Bridge
  const phase2 = _simulatePhase('bridge', 'Troll Bridge', [
    { key: 'bridge-negotiate', label: 'Negotiate with the Troll', eliminates: false },
    { key: 'bridge-blindfold', label: 'Cross Blindfolded', eliminates: false },
    { key: 'bridge-endure', label: 'Endure the Wrath', eliminates: true },
  ], alive, classMap, result, ep, campKey, fatigue);
  result.phases.push(phase2);
  result.eliminationOrder.push(...phase2.eliminated);

  // After Phase 2: Give Enchanted Sword
  if (alive.length >= 1) {
    // Royal picks ally or strongest
    const bondScores = alive.map(n => ({ name: n, score: getBond(royalName, n) * 0.6 + pStats(n).physical * 0.3 + noise(1) }));
    bondScores.sort((a, b) => b.score - a.score);
    const swordRecipient = bondScores[0].name;
    result.swordHolder = swordRecipient;
    result.swordGiven = { recipient: swordRecipient, text: pick(ADVANTAGE_TEXT.sword)(royalName, swordRecipient, royalTitle) };
    addBond(royalName, swordRecipient, 1);
    ep.campEvents[campKey].post.push({
      text: `${royalTitle} ${royalName} bestowed the Enchanted Sword upon ${swordRecipient}!`,
      players: [royalName, swordRecipient],
      badgeText: 'ENCHANTED SWORD', badgeClass: 'amber', tag: 'princess-pride',
    });
  }

  // Phase 3: Dragon's Lair
  const phase3 = _simulatePhase('dragon', "Dragon's Lair", [
    { key: 'dragon-sneak', label: 'Sneak Past the Dragon', eliminates: false },
    { key: 'dragon-fight', label: 'Fight the Dragon', eliminates: false },
    { key: 'dragon-weakness', label: 'Exploit the Weakness', eliminates: true },
  ], alive, classMap, result, ep, campKey, fatigue);
  result.phases.push(phase3);
  result.eliminationOrder.push(...phase3.eliminated);

  // Phase 4: Tower Rescue
  const phase4 = _simulatePhase('tower', 'Tower Rescue', [
    { key: 'tower-climb', label: 'Scale the Wall', eliminates: false },
    { key: 'tower-defenses', label: 'Break Through Defenses', eliminates: false },
    { key: 'tower-push', label: 'The Final Push', eliminates: true },
  ], alive, classMap, result, ep, campKey, fatigue);
  result.phases.push(phase4);
  result.eliminationOrder.push(...phase4.eliminated);

  // After Phase 4: Give Golden Armor to the top ALIVE knight
  if (alive.length >= 1) {
    // Top scorer who is still alive AND not the sword holder
    const towerPush = phase4.beats.find(b => b.key === 'tower-push');
    const towerRanked = towerPush?.ranked || [];
    const topKnight = towerRanked.find(r => alive.includes(r.name) && r.name !== result.swordHolder)?.name
      || towerRanked.find(r => alive.includes(r.name))?.name || alive[0];
    result.armorHolder = topKnight;
    result.armorGiven = { recipient: topKnight, text: pick(ADVANTAGE_TEXT.armor)(royalName, topKnight, royalTitle) };
    addBond(royalName, topKnight, 1);
    ep.campEvents[campKey].post.push({
      text: `${royalTitle} ${royalName} bestowed the Golden Armor upon ${topKnight}!`,
      players: [royalName, topKnight],
      badgeText: 'GOLDEN ARMOR', badgeClass: 'amber', tag: 'princess-pride',
    });
  }

  // Ensure at least 1 knight for the duel
  if (alive.length < 1 && knights.length >= 1) {
    const lastElim = result.eliminationOrder[result.eliminationOrder.length - 1];
    if (lastElim) { alive.push(lastElim); result.eliminationOrder.pop(); }
  }

  // ── FINAL DUEL: THE BETRAYAL ──
  // Top cumulative performer reaches the top — others fall short
  const sortedAlive = [...alive].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
  const duelistKnight = sortedAlive[0] || alive[0] || knights[0];
  // Everyone else collapses on the stairs
  const towerFallouts = sortedAlive.slice(1);
  result.towerFallouts = towerFallouts.map(name => {
    const pr = pronouns(name);
    const cls = CLASSES[classMap[name]];
    const texts = [
      `${name} reached for the final ledge — and ${pr.posAdj} grip failed. The ${cls?.label || 'adventurer'} slid back down the tower stairs, exhaustion finally winning. So close. Not close enough.`,
      `${name}'s legs gave out three steps from the summit. ${pr.Sub} collapsed against the cold stone, gasping. The quest was over. ${pr.Sub} could hear the duel beginning above. Without ${pr.obj}.`,
      `The tower rejected ${name}. An enchanted wind pushed ${pr.obj} back, step by step, as if the fairy tale itself had decided ${pr.sub} wasn't the hero of this story. "No... I was so CLOSE!" But close doesn't count in fairy tales.`,
      `${name} looked up at the final staircase and knew. ${pr.Sub} didn't have enough left. The ${cls?.label || 'adventurer'} sat down on the cold stone and listened to the sounds of battle above. "Next time," ${pr.sub} whispered. There might not be a next time.`,
    ];
    return { name, text: pick(texts), cls: classMap[name] };
  });
  // Remove fallouts from alive
  for (const fo of towerFallouts) {
    const idx = alive.indexOf(fo);
    if (idx >= 0) alive.splice(idx, 1);
    result.eliminationOrder.push(fo);
  }
  const duel = _simulateDuel(royalName, duelistKnight, result, ep, campKey, fatigue);
  result.duel = duel;

  if (duel.happyEnding) {
    result.immunityWinner = royalName; // primary immunity
    result.secondImmune = duelistKnight; // both get immunity
    ep.extraImmune = [...(ep.extraImmune || []), duelistKnight];
    ep.campEvents[campKey].post.push({
      text: `${royalName} and ${duelistKnight} refused to fight! ${host()} reluctantly gave them BOTH immunity!`,
      players: [royalName, duelistKnight],
      badgeText: 'HAPPY ENDING!', badgeClass: 'green', tag: 'princess-pride',
    });
  } else {
    result.immunityWinner = duel.winner;
    popDelta(duel.winner, 3);
    popDelta(duel.loser, 1);
    addBond(royalName, duelistKnight, duel.narrow ? -1 : -2);
    ep.campEvents[campKey].post.push({
      text: `${duel.winner} won the final duel and claimed immunity in The Princess Pride!`,
      players: [duel.winner],
      badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'princess-pride',
    });
  }

  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, null, null, ep.chalMemberScores || {}, 'fairy tale quest');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'quest', _romActive);

  // ── FINALIZE ──
  ep.princessPride = result;
  ep.isPrincessPride = true;
  ep.challengeType = 'princess-pride';
  ep.challengeLabel = 'The Princess Pride';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;

  // chalPlacements: duel winner, duel loser, alive (by final push score desc), eliminated in reverse
  const placements = [duel.winner];
  if (duel.loser !== duel.winner) placements.push(duel.loser);
  const restAlive = alive.filter(n => n !== duel.winner && n !== duelistKnight);
  placements.push(...restAlive);
  placements.push(...[...result.eliminationOrder].reverse());
  ep.chalPlacements = placements;

  // Scores — duel winner gets massive bonus
  for (const name of active) {
    const idx = placements.indexOf(name);
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.max(1, active.length - (idx >= 0 ? idx : active.length));
  }
  if (duel.winner) {
    // Immunity winner MUST be #1 — add enough to guarantee it
    const maxOtherScore = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== duel.winner).map(([, s]) => s));
    ep.chalMemberScores[duel.winner] = Math.max((ep.chalMemberScores[duel.winner] || 0), maxOtherScore) + active.length + 5;
  }
  // Royal gets points for advantage quality
  if (royalName) {
    const swordGood = result.swordHolder === duelistKnight ? 3 : 1;
    const armorGood = result.armorHolder === duelistKnight ? 3 : 1;
    ep.chalMemberScores[royalName] = (ep.chalMemberScores[royalName] || 0) + swordGood + armorGood;
  }

  ep.tribalPlayers = active;
  updateChalRecord(ep);

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'princess-pride', label: 'The Princess Pride',
    winner: result.immunityWinner,
  };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textPrincessPride(ep, ln, sec) {
  const pp = ep.princessPride;
  if (!pp) return;
  sec('THE PRINCESS PRIDE');
  ln(`${host()} announces a fairy tale quest challenge. Glass slippers appear.`);
  ln(`${pp.royalTitle} ${pp.royalName} is crowned!`);
  ln('-- CLASS ASSIGNMENTS --');
  for (const ca of pp.classAssignments) {
    ln(`  ${ca.name} -> ${CLASSES[ca.cls]?.icon || ''} ${CLASSES[ca.cls]?.label || ca.cls}`);
  }
  for (const phase of pp.phases) {
    ln(`-- ${phase.label.toUpperCase()} --`);
    for (const beat of phase.beats) {
      ln(`  ${beat.label}:`);
      for (const r of beat.ranked.slice(0, 3)) {
        ln(`    ${r.name} (${CLASSES[r.cls]?.label || r.cls}): ${r.score.toFixed(1)}`);
      }
      if (beat.eliminated.length) ln(`    Eliminated: ${beat.eliminated.map(e => e.name).join(', ')}`);
      if (beat.save) ln(`    SAVED: ${beat.save.player} by royal decree!`);
    }
  }
  if (pp.swordGiven.recipient) ln(`  Enchanted Sword -> ${pp.swordGiven.recipient}`);
  if (pp.armorGiven.recipient) ln(`  Golden Armor -> ${pp.armorGiven.recipient}`);
  if (pp.duel) {
    ln('-- FINAL DUEL --');
    for (const ex of pp.duel.exchanges) {
      ln(`  ${ex.name}: ${ex.winner} wins (shift ${ex.shift})`);
    }
    ln(`  WINNER: ${pp.duel.winner}${pp.duel.narrow ? ' (NARROW!)' : ''}`);
  }
  ln(`  IMMUNITY: ${pp.immunityWinner}`);
}

// ══════════════════════════════════════════════════════════════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Dancing+Script:wght@400;700&family=Lora:wght@400;600;700&display=swap');

  .pp-shell{
    --royal-purple:#7c3aed;--royal-gold:#eab308;--fairy-pink:#ec4899;
    --forest-green:#16a34a;--sky-blue:#3b82f6;--cream:#fef3c7;
    --parchment:#fdf6e3;--dark-text:#3d2b1f;
    font-family:'Lora',serif;font-weight:400;color:var(--dark-text);
    background:linear-gradient(180deg,#1e1b4b,#312e81,#1e1b4b);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:3px solid var(--royal-gold);
    box-shadow:0 0 20px rgba(234,179,8,0.3),inset 0 0 40px rgba(0,0,0,0.2);
  }

  /* Castle silhouette */
  .pp-shell::before{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;pointer-events:none;z-index:0;
    background:
      linear-gradient(transparent 0%,rgba(30,27,75,0.95) 100%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'%3E%3Cpath d='M0,80 L0,40 L20,40 L20,20 L30,20 L30,10 L35,10 L35,20 L45,20 L45,40 L60,40 L60,30 L80,30 L80,40 L100,40 L100,20 L110,20 L110,10 L115,10 L115,20 L125,20 L125,40 L160,40 L160,50 L200,50 L200,30 L210,30 L210,15 L215,15 L215,30 L225,30 L225,50 L260,50 L260,40 L280,40 L280,35 L290,35 L290,40 L320,40 L320,25 L330,25 L330,15 L335,15 L335,25 L345,25 L345,40 L380,40 L380,50 L400,50 L400,80Z' fill='rgba(30,27,75,0.4)'/%3E%3C/svg%3E") center bottom/400px 80px repeat-x}

  /* ═══ PHASE-SPECIFIC BACKGROUNDS ═══ */

  /* ── 1. CEREMONY: Royal coronation hall, deep indigo sky with golden stars ── */
  .pp-shell.pp-theme-ceremony{background:linear-gradient(180deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)}
  .pp-shell.pp-theme-ceremony::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(1.5px 1.5px at 10% 12%,rgba(234,179,8,0.7),transparent),
      radial-gradient(2px 2px at 25% 5%,rgba(234,179,8,0.5),transparent),
      radial-gradient(1px 1px at 40% 18%,rgba(234,179,8,0.6),transparent),
      radial-gradient(2px 2px at 55% 8%,rgba(234,179,8,0.8),transparent),
      radial-gradient(1.5px 1.5px at 70% 15%,rgba(234,179,8,0.55),transparent),
      radial-gradient(1px 1px at 85% 10%,rgba(234,179,8,0.65),transparent),
      radial-gradient(2px 2px at 15% 28%,rgba(234,179,8,0.4),transparent),
      radial-gradient(1.5px 1.5px at 50% 25%,rgba(234,179,8,0.6),transparent),
      radial-gradient(1px 1px at 65% 30%,rgba(234,179,8,0.45),transparent),
      radial-gradient(2px 2px at 80% 22%,rgba(234,179,8,0.5),transparent),
      radial-gradient(1px 1px at 33% 35%,rgba(234,179,8,0.55),transparent),
      radial-gradient(1.5px 1.5px at 92% 18%,rgba(234,179,8,0.6),transparent)}

  /* ── 2. ENCHANTED FOREST: Lush magical forest, dappled light, vines, fireflies ── */
  .pp-shell.pp-theme-forest{background:linear-gradient(180deg,#052e16 0%,#166534 40%,#14532d 70%,#052e16 100%);
    box-shadow:0 0 20px rgba(22,163,74,0.3),inset 0 0 60px rgba(0,40,0,0.4)}
  .pp-shell.pp-theme-forest::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(circle at 12% 15%,rgba(134,239,172,0.3) 0%,transparent 22%),
      radial-gradient(circle at 38% 8%,rgba(74,222,128,0.25) 0%,transparent 18%),
      radial-gradient(circle at 62% 22%,rgba(187,247,208,0.2) 0%,transparent 20%),
      radial-gradient(circle at 82% 12%,rgba(134,239,172,0.22) 0%,transparent 16%),
      radial-gradient(circle at 25% 45%,rgba(34,197,94,0.15) 0%,transparent 25%),
      radial-gradient(circle at 55% 38%,rgba(134,239,172,0.18) 0%,transparent 20%),
      radial-gradient(circle at 75% 55%,rgba(74,222,128,0.14) 0%,transparent 22%),
      radial-gradient(circle at 45% 65%,rgba(187,247,208,0.16) 0%,transparent 18%),
      radial-gradient(circle at 18% 72%,rgba(134,239,172,0.2) 0%,transparent 15%),
      radial-gradient(circle at 88% 68%,rgba(34,197,94,0.12) 0%,transparent 20%),
      /* pink flower spots at ground level */
      radial-gradient(circle at 15% 92%,rgba(236,72,153,0.2) 0%,transparent 6%),
      radial-gradient(circle at 35% 95%,rgba(236,72,153,0.15) 0%,transparent 5%),
      radial-gradient(circle at 65% 90%,rgba(251,191,36,0.15) 0%,transparent 5%),
      radial-gradient(circle at 85% 93%,rgba(236,72,153,0.18) 0%,transparent 6%)}

  /* vine borders */
  .pp-shell.pp-theme-forest .pp-layout::before{content:'';position:absolute;top:0;left:0;width:50px;height:100%;pointer-events:none;z-index:6;
    background:
      repeating-linear-gradient(170deg,transparent 0px,transparent 14px,rgba(22,101,52,0.6) 14px,rgba(22,101,52,0.6) 17px,transparent 17px,transparent 35px),
      repeating-linear-gradient(195deg,transparent 0px,transparent 20px,rgba(20,83,45,0.4) 20px,rgba(20,83,45,0.4) 23px,transparent 23px,transparent 45px),
      linear-gradient(90deg,rgba(5,46,22,0.6),transparent)}
  .pp-shell.pp-theme-forest .pp-layout::after{content:'';position:absolute;top:0;right:0;width:50px;height:100%;pointer-events:none;z-index:6;
    background:
      repeating-linear-gradient(190deg,transparent 0px,transparent 16px,rgba(22,101,52,0.55) 16px,rgba(22,101,52,0.55) 19px,transparent 19px,transparent 38px),
      repeating-linear-gradient(175deg,transparent 0px,transparent 22px,rgba(20,83,45,0.35) 22px,rgba(20,83,45,0.35) 25px,transparent 25px,transparent 50px),
      linear-gradient(270deg,rgba(5,46,22,0.6),transparent)}

  /* firefly lantern override */
  .pp-shell.pp-theme-forest .pp-lantern{background:rgba(134,239,172,0.9);width:6px;height:6px;border-radius:50%;
    box-shadow:0 0 10px rgba(134,239,172,0.8),0 0 25px rgba(74,222,128,0.5),0 0 40px rgba(34,197,94,0.2);
    animation:pp-firefly var(--pp-ff-dur,4s) ease-in-out infinite}
  .pp-shell.pp-theme-forest .pp-lantern:nth-child(odd){--pp-ff-dur:3.2s}
  .pp-shell.pp-theme-forest .pp-lantern:nth-child(3n){--pp-ff-dur:5.5s}
  .pp-shell.pp-theme-forest .pp-lantern:nth-child(4n+1){--pp-ff-dur:4.8s}

  /* tree canopy silhouette below HUD */
  .pp-shell.pp-theme-forest .pp-hud::after{content:'';position:absolute;top:100%;left:0;right:0;height:40px;pointer-events:none;z-index:3;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40'%3E%3Cpath d='M0,0 C20,15 30,25 50,10 C65,0 80,20 100,15 C115,10 130,30 150,8 C165,0 185,25 200,12 C220,0 235,20 250,15 C270,8 285,28 310,10 C330,0 345,18 360,12 C375,5 390,20 400,8 L400,0Z' fill='rgba(5,46,22,0.65)'/%3E%3Cpath d='M0,0 C30,20 60,5 90,18 C120,30 150,5 180,15 C210,25 240,8 270,20 C300,30 330,10 360,22 C380,30 400,15 400,0Z' fill='rgba(20,83,45,0.45)'/%3E%3C/svg%3E") center top/400px 40px repeat-x}

  /* ground mushrooms + flowers */
  .pp-shell.pp-theme-forest::before{
    height:140px !important;
    background:
      linear-gradient(transparent 0%,rgba(5,46,22,0.9) 60%,rgba(2,30,12,1) 100%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'%3E%3Ccircle cx='40' cy='55' r='12' fill='rgba(168,85,247,0.35)'/%3E%3Ccircle cx='33' cy='50' r='14' fill='rgba(168,85,247,0.25)'/%3E%3Crect x='38' y='57' width='5' height='18' rx='2' fill='rgba(200,200,200,0.15)'/%3E%3Ccircle cx='350' cy='58' r='10' fill='rgba(236,72,153,0.3)'/%3E%3Ccircle cx='345' cy='54' r='12' fill='rgba(236,72,153,0.2)'/%3E%3Crect x='349' y='60' width='4' height='15' rx='2' fill='rgba(200,200,200,0.12)'/%3E%3Ccircle cx='180' cy='62' r='8' fill='rgba(249,115,22,0.25)'/%3E%3Ccircle cx='176' cy='58' r='10' fill='rgba(249,115,22,0.18)'/%3E%3Crect x='179' y='63' width='3' height='12' rx='1' fill='rgba(200,200,200,0.1)'/%3E%3Ccircle cx='100' cy='68' r='5' fill='rgba(236,72,153,0.25)'/%3E%3Ccircle cx='280' cy='65' r='6' fill='rgba(134,239,172,0.2)'/%3E%3Ccircle cx='220' cy='60' r='4' fill='rgba(251,191,36,0.2)'/%3E%3Ccircle cx='310' cy='70' r='4' fill='rgba(168,85,247,0.2)'/%3E%3Ccircle cx='70' cy='72' r='3' fill='rgba(251,191,36,0.18)'/%3E%3C/svg%3E") center bottom/400px 80px repeat-x !important}

  /* ── 3. TROLL BRIDGE: Dark stone bridge over misty chasm, torchlight flicker ── */
  .pp-shell.pp-theme-bridge{background:linear-gradient(180deg,#1c1917 0%,#292524 30%,#44403c 60%,#292524 80%,#1c1917 100%);
    box-shadow:0 0 20px rgba(180,83,9,0.3),inset 0 0 50px rgba(0,0,0,0.5)}
  .pp-shell.pp-theme-bridge::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      /* torch glow left */
      radial-gradient(ellipse at 3% 40%,rgba(245,158,11,0.18) 0%,transparent 25%),
      /* torch glow right */
      radial-gradient(ellipse at 97% 40%,rgba(245,158,11,0.18) 0%,transparent 25%),
      /* mist bands */
      radial-gradient(ellipse at 50% 85%,rgba(200,200,200,0.06) 0%,transparent 40%),
      radial-gradient(ellipse at 30% 92%,rgba(180,180,180,0.04) 0%,transparent 35%),
      radial-gradient(ellipse at 70% 88%,rgba(160,160,160,0.05) 0%,transparent 30%),
      /* stone block lines */
      repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(120,113,108,0.06) 28px,rgba(120,113,108,0.06) 30px);
    animation:pp-mist-drift 12s ease-in-out infinite}
  /* stone bridge railing silhouette at bottom */
  .pp-shell.pp-theme-bridge::before{content:'';position:absolute;bottom:0;left:0;right:0;height:100px;pointer-events:none;z-index:0;
    background:
      linear-gradient(transparent 0%,rgba(28,25,23,0.95) 100%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60'%3E%3Cpath d='M0,60 L0,35 L10,35 L10,20 L15,15 L20,20 L20,35 L60,35 L60,20 L65,15 L70,20 L70,35 L110,35 L110,20 L115,15 L120,20 L120,35 L160,35 L160,20 L165,15 L170,20 L170,35 L210,35 L210,20 L215,15 L220,20 L220,35 L260,35 L260,20 L265,15 L270,20 L270,35 L310,35 L310,20 L315,15 L320,20 L320,35 L360,35 L360,20 L365,15 L370,20 L370,35 L400,35 L400,60Z' fill='rgba(68,64,60,0.35)'/%3E%3Crect x='0' y='32' width='400' height='6' rx='1' fill='rgba(87,83,78,0.25)'/%3E%3C/svg%3E") center bottom/400px 60px repeat-x}
  /* torch-flame lanterns */
  .pp-shell.pp-theme-bridge .pp-lantern{background:rgba(245,158,11,0.8);width:5px;height:7px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
    box-shadow:0 0 10px rgba(245,158,11,0.6),0 0 20px rgba(234,88,12,0.3);
    animation:pp-torch-flicker 0.8s ease-in-out infinite}
  .pp-shell.pp-theme-bridge .pp-lantern:nth-child(2){animation-delay:-0.15s}
  .pp-shell.pp-theme-bridge .pp-lantern:nth-child(3){animation-delay:-0.4s}
  .pp-shell.pp-theme-bridge .pp-lantern:nth-child(4){animation-delay:-0.6s}

  /* ── 4. DRAGON'S LAIR: Dark cave, fire glow, embers, lava cracks ── */
  .pp-shell.pp-theme-dragon{background:linear-gradient(180deg,#1a0000 0%,#450a0a 30%,#7f1d1d 60%,#450a0a 80%,#1a0000 100%);
    box-shadow:0 0 30px rgba(220,38,38,0.4),inset 0 0 60px rgba(0,0,0,0.5)}
  .pp-shell.pp-theme-dragon::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      /* pulsing fire glow at bottom center */
      radial-gradient(ellipse at 50% 95%,rgba(239,68,68,0.2) 0%,rgba(249,115,22,0.1) 20%,transparent 50%),
      radial-gradient(ellipse at 35% 90%,rgba(220,38,38,0.1) 0%,transparent 30%),
      radial-gradient(ellipse at 65% 88%,rgba(249,115,22,0.08) 0%,transparent 25%),
      /* fire reflection at bottom */
      linear-gradient(0deg,rgba(239,68,68,0.08) 0%,transparent 15%);
    animation:pp-fire-pulse 3s ease-in-out infinite}
  /* cave stalactites at top */
  .pp-shell.pp-theme-dragon .pp-hud::after{content:'';position:absolute;top:100%;left:0;right:0;height:35px;pointer-events:none;z-index:3;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 35'%3E%3Cpath d='M0,0 L15,0 L18,18 L20,0 L55,0 L58,25 L61,0 L80,0 L84,15 L87,0 L120,0 L124,30 L127,0 L155,0 L158,12 L160,0 L195,0 L199,22 L202,0 L230,0 L233,17 L236,0 L270,0 L274,28 L277,0 L305,0 L308,14 L310,0 L340,0 L344,20 L347,0 L375,0 L378,16 L381,0 L400,0Z' fill='rgba(26,0,0,0.7)'/%3E%3C/svg%3E") center top/400px 35px repeat-x}
  /* lava cracks at bottom */
  .pp-shell.pp-theme-dragon::before{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;pointer-events:none;z-index:0;
    background:
      linear-gradient(transparent 0%,rgba(26,0,0,0.95) 100%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40'%3E%3Cpath d='M30,38 L35,28 L50,32 L55,20 L65,30 L80,35' stroke='rgba(249,115,22,0.3)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M150,36 L160,22 L170,30 L180,18 L195,28 L200,35' stroke='rgba(239,68,68,0.25)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M280,37 L290,25 L300,32 L310,20 L325,30 L335,36' stroke='rgba(249,115,22,0.28)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M55,25 L58,15' stroke='rgba(251,191,36,0.2)' stroke-width='1' fill='none'/%3E%3Cpath d='M175,22 L178,12' stroke='rgba(251,191,36,0.18)' stroke-width='1' fill='none'/%3E%3Cpath d='M305,24 L308,14' stroke='rgba(251,191,36,0.2)' stroke-width='1' fill='none'/%3E%3C/svg%3E") center bottom/400px 40px repeat-x !important}
  /* ember lantern override */
  .pp-shell.pp-theme-dragon .pp-lantern{background:rgba(249,115,22,0.8);width:3px;height:3px;
    box-shadow:0 0 4px rgba(239,68,68,0.6),0 0 8px rgba(249,115,22,0.3);
    animation:pp-ember var(--pp-em-dur,3s) ease-out infinite}
  .pp-shell.pp-theme-dragon .pp-lantern:nth-child(2){--pp-em-dur:2.4s;background:rgba(239,68,68,0.7)}
  .pp-shell.pp-theme-dragon .pp-lantern:nth-child(3){--pp-em-dur:3.8s}

  /* ── 5. TOWER RESCUE: Stone tower interior with stained glass light beams ── */
  .pp-shell.pp-theme-tower{
    background:linear-gradient(0deg,#312e81 0%,#4c1d95 40%,#2e1065 70%,#1e1b4b 100%);
    box-shadow:0 0 20px rgba(124,58,237,0.3),inset 0 0 50px rgba(0,0,0,0.3)}
  .pp-shell.pp-theme-tower::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      /* stained glass light beams — gold, rose, blue, green */
      linear-gradient(35deg,transparent 30%,rgba(234,179,8,0.05) 40%,rgba(234,179,8,0.06) 45%,transparent 55%),
      linear-gradient(55deg,transparent 20%,rgba(236,72,153,0.04) 30%,rgba(236,72,153,0.05) 38%,transparent 48%),
      linear-gradient(25deg,transparent 50%,rgba(96,165,250,0.04) 58%,rgba(96,165,250,0.05) 65%,transparent 75%),
      linear-gradient(45deg,transparent 60%,rgba(74,222,128,0.04) 68%,rgba(74,222,128,0.05) 73%,transparent 83%),
      /* stone wall texture */
      repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(139,92,246,0.04) 28px,rgba(139,92,246,0.04) 30px);
    animation:pp-stained-glass 6s ease-in-out infinite}
  /* climbing vine on left */
  .pp-shell.pp-theme-tower .pp-layout::before{content:'';position:absolute;top:0;left:0;width:24px;height:100%;pointer-events:none;z-index:0;
    background:
      repeating-linear-gradient(175deg,transparent 0px,transparent 15px,rgba(22,163,74,0.2) 15px,rgba(22,163,74,0.2) 17px,transparent 17px,transparent 35px),
      repeating-linear-gradient(185deg,transparent 0px,transparent 22px,rgba(34,197,94,0.15) 22px,rgba(34,197,94,0.15) 24px,transparent 24px,transparent 50px),
      linear-gradient(90deg,rgba(22,163,74,0.1),transparent)}
  /* slow upward-drifting golden lanterns */
  .pp-shell.pp-theme-tower .pp-lantern{
    background:radial-gradient(circle,rgba(234,179,8,0.9),rgba(234,179,8,0.3),transparent);
    box-shadow:0 0 10px rgba(234,179,8,0.5),0 0 20px rgba(234,179,8,0.2);
    animation:pp-float 7s ease-in-out infinite}
  .pp-shell.pp-theme-tower .pp-lantern:nth-child(2){animation-duration:8.5s}
  .pp-shell.pp-theme-tower .pp-lantern:nth-child(3){animation-duration:6.5s}
  .pp-shell.pp-theme-tower .pp-lantern:nth-child(4){animation-duration:9s}

  /* ── 6. THE BETRAYAL DUEL: Grand throne room, golden opulence ── */
  .pp-shell.pp-theme-duel{background:linear-gradient(180deg,#451a03 0%,#78350f 35%,#422006 65%,#451a03 100%);
    box-shadow:0 0 25px rgba(234,179,8,0.4),inset 0 0 50px rgba(0,0,0,0.3)}
  .pp-shell.pp-theme-duel::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      /* central golden spotlight */
      radial-gradient(ellipse at 50% 45%,rgba(234,179,8,0.12) 0%,rgba(234,179,8,0.04) 30%,transparent 60%),
      /* floor golden reflection */
      linear-gradient(0deg,rgba(234,179,8,0.06) 0%,transparent 20%),
      /* royal banner lines at edges */
      linear-gradient(90deg,rgba(234,179,8,0.05) 0%,transparent 3%,transparent 97%,rgba(234,179,8,0.05) 100%)}
  /* crossed swords decoration at top center */
  .pp-shell.pp-theme-duel .pp-hud::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);width:120px;height:40px;pointer-events:none;z-index:3;opacity:0.15;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Cline x1='20' y1='35' x2='100' y2='5' stroke='%23eab308' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='100' y1='35' x2='20' y2='5' stroke='%23eab308' stroke-width='2.5' stroke-linecap='round'/%3E%3Ccircle cx='60' cy='20' r='4' fill='none' stroke='%23eab308' stroke-width='1.5'/%3E%3Crect x='16' y='32' width='8' height='3' rx='1' fill='%23eab308'/%3E%3Crect x='96' y='32' width='8' height='3' rx='1' fill='%23eab308'/%3E%3Crect x='16' y='2' width='8' height='3' rx='1' fill='%23eab308'/%3E%3Crect x='96' y='2' width='8' height='3' rx='1' fill='%23eab308'/%3E%3C/svg%3E") center/contain no-repeat}
  /* throne room pillars on left and right */
  .pp-shell.pp-theme-duel .pp-layout::before{content:'';position:absolute;top:0;left:0;width:20px;height:100%;pointer-events:none;z-index:0;
    background:linear-gradient(90deg,rgba(69,26,3,0.6) 0%,rgba(69,26,3,0.3) 60%,transparent 100%)}
  .pp-shell.pp-theme-duel .pp-layout::after{content:'';position:absolute;top:0;right:0;width:20px;height:100%;pointer-events:none;z-index:0;
    background:linear-gradient(270deg,rgba(69,26,3,0.6) 0%,rgba(69,26,3,0.3) 60%,transparent 100%)}
  /* golden majestic lanterns */
  .pp-shell.pp-theme-duel .pp-lantern{
    background:radial-gradient(circle,rgba(234,179,8,0.95),rgba(234,179,8,0.4),transparent);
    width:7px;height:7px;
    box-shadow:0 0 12px rgba(234,179,8,0.6),0 0 24px rgba(234,179,8,0.2);
    animation:pp-float 6s ease-in-out infinite}
  .pp-shell.pp-theme-duel .pp-lantern:nth-child(2){animation-duration:7.5s}
  .pp-shell.pp-theme-duel .pp-lantern:nth-child(3){animation-duration:5.5s}

  /* Floating lanterns */
  .pp-lantern{position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:1;
    background:radial-gradient(circle,rgba(234,179,8,0.9),rgba(234,179,8,0.3),transparent);
    box-shadow:0 0 8px rgba(234,179,8,0.6);animation:pp-float 4s ease-in-out infinite}
  .pp-lantern:nth-child(2){animation-delay:-1s;animation-duration:5s}
  .pp-lantern:nth-child(3){animation-delay:-2s;animation-duration:3.5s}
  .pp-lantern:nth-child(4){animation-delay:-0.5s;animation-duration:4.5s}
  .pp-lantern:nth-child(5){animation-delay:-3s;animation-duration:3s}
  .pp-lantern:nth-child(6){animation-delay:-1.5s;animation-duration:5.5s}
  .pp-lantern:nth-child(7){animation-delay:-2.5s;animation-duration:4s}
  .pp-lantern:nth-child(8){animation-delay:-0.8s;animation-duration:3.8s}
  @keyframes pp-float{0%,100%{transform:translateY(0) scale(1);opacity:0.7}50%{transform:translateY(-15px) scale(1.2);opacity:1}}

  @keyframes pp-firefly{
    0%{opacity:0.2;transform:translateY(0) translateX(0)}
    25%{opacity:0.8;transform:translateY(-8px) translateX(4px)}
    50%{opacity:1;transform:translateY(-15px) translateX(-3px)}
    75%{opacity:0.6;transform:translateY(-8px) translateX(5px)}
    100%{opacity:0.2;transform:translateY(0) translateX(0)}}

  @keyframes pp-ember{
    0%{opacity:0.8;transform:translateY(0) translateX(0) scale(1)}
    50%{opacity:0.6;transform:translateY(-80px) translateX(15px) scale(0.7)}
    100%{opacity:0;transform:translateY(-160px) translateX(-10px) scale(0.3)}}

  @keyframes pp-torch-flicker{
    0%,100%{opacity:0.7;transform:scale(1)}
    10%{opacity:1;transform:scale(1.1)}
    20%{opacity:0.6;transform:scale(0.95)}
    30%{opacity:0.9;transform:scale(1.05)}
    50%{opacity:0.5;transform:scale(0.9)}
    70%{opacity:1;transform:scale(1.1)}
    90%{opacity:0.8;transform:scale(1)}}

  @keyframes pp-mist-drift{
    0%{transform:translateX(-5%)}
    50%{transform:translateX(5%)}
    100%{transform:translateX(-5%)}}

  @keyframes pp-fire-pulse{
    0%,100%{opacity:0.6;transform:scale(1)}
    50%{opacity:1;transform:scale(1.15)}}

  @keyframes pp-stained-glass{
    0%,100%{opacity:0.03}
    50%{opacity:0.07}}

  @media(prefers-reduced-motion:reduce){
    .pp-lantern,.pp-shell::after,.pp-shell.pp-theme-bridge::after,
    .pp-shell.pp-theme-dragon::after,.pp-shell.pp-theme-tower::after{animation:none !important}
    .pp-shell.pp-theme-forest .pp-lantern{animation:none !important}
    .pp-shell.pp-theme-bridge .pp-lantern{animation:none !important}
    .pp-shell.pp-theme-dragon .pp-lantern{animation:none !important}
  }

  /* ═══ LAYOUT ═══ */
  .pp-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
  .pp-feed{flex:1;padding:18px 22px;min-width:0}
  .pp-sidebar{width:240px;flex-shrink:0;padding:14px;
    background:linear-gradient(180deg,var(--parchment),#f5e6c8);
    border-left:2px solid var(--royal-gold);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

  /* ═══ HUD ═══ */
  .pp-hud{display:flex;justify-content:center;gap:0;padding:12px 0;position:relative;z-index:5;
    border-bottom:2px solid var(--royal-gold);overflow:hidden;
    background:linear-gradient(180deg,rgba(124,58,237,0.9),rgba(124,58,237,0.7))}
  .pp-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:1px solid rgba(234,179,8,0.3);position:relative;z-index:2}
  .pp-hud-cell:last-child{border-right:none}
  .pp-hud-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--royal-gold);text-shadow:0 2px 4px rgba(0,0,0,0.3)}
  .pp-hud-lbl{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.6);text-transform:uppercase;font-family:'Lora',serif}

  /* ═══ PARCHMENT PANEL ═══ */
  .pp-panel{
    border:2px solid var(--royal-gold);border-radius:6px;margin:14px 0;padding:18px;position:relative;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden;
    background:linear-gradient(180deg,var(--parchment),#fef9ef);
  }
  .pp-panel::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    border:1px solid rgba(234,179,8,0.2);border-radius:4px;margin:4px}
  .pp-panel>*{position:relative;z-index:1}

  /* Panel color variants */
  .pp-panel-forest{background:linear-gradient(180deg,#dcfce7,#f0fdf4);border-color:#16a34a}
  .pp-panel-bridge{background:linear-gradient(180deg,#fef3c7,#fffbeb);border-color:#b45309}
  .pp-panel-dragon{background:linear-gradient(180deg,#fee2e2,#fef2f2);border-color:#dc2626}
  .pp-panel-tower{background:linear-gradient(180deg,#ddd6fe,#ede9fe);border-color:#7c3aed}
  .pp-panel-duel{background:linear-gradient(180deg,#fef3c7,#fde68a);border-color:#eab308;
    box-shadow:0 0 20px rgba(234,179,8,0.3)}
  .pp-panel-royal{background:linear-gradient(180deg,#fef3c7,var(--parchment));
    border-color:var(--royal-gold);box-shadow:0 0 15px rgba(234,179,8,0.3)}
  .pp-panel-elim{background:linear-gradient(180deg,#1a0a1a,#2d1f2d,#1a0a1a);border-color:#4a1d6a;
    color:#ddd;position:relative;overflow:hidden;animation:pp-curse-darken 1s ease-out}
  .pp-panel-elim>*{position:relative;z-index:1}
  .pp-panel-elim::before{content:'';position:absolute;bottom:0;left:0;right:0;height:100%;pointer-events:none;z-index:0;
    animation:pp-vine-creep 1.5s ease-out forwards}
  @keyframes pp-vine-creep{0%{clip-path:inset(100% 0 0 0)}100%{clip-path:inset(0 0 0 0)}}
  @keyframes pp-curse-darken{0%{opacity:0;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}

  /* Forest curse — vines */
  .pp-panel-forest .pp-panel-elim::before,.pp-panel-elim.pp-elim-forest::before{background:
    repeating-linear-gradient(170deg,transparent 0px,transparent 12px,rgba(22,101,52,0.3) 12px,rgba(22,101,52,0.3) 15px,transparent 15px,transparent 30px),
    repeating-linear-gradient(195deg,transparent 0px,transparent 18px,rgba(20,83,45,0.25) 18px,rgba(20,83,45,0.25) 21px,transparent 21px,transparent 40px)}
  /* Bridge curse — mist swallow */
  .pp-panel-elim.pp-elim-bridge::before{background:
    linear-gradient(0deg,rgba(120,120,120,0.4) 0%,transparent 60%),
    radial-gradient(ellipse at 50% 100%,rgba(200,200,200,0.3) 0%,transparent 50%)}
  /* Dragon curse — fire consume */
  .pp-panel-elim.pp-elim-dragon{border-color:#7f1d1d}
  .pp-panel-elim.pp-elim-dragon::before{background:
    linear-gradient(0deg,rgba(239,68,68,0.3) 0%,rgba(249,115,22,0.2) 30%,transparent 60%),
    radial-gradient(ellipse at 30% 90%,rgba(234,179,8,0.2) 0%,transparent 30%),
    radial-gradient(ellipse at 70% 85%,rgba(239,68,68,0.15) 0%,transparent 25%)}
  /* Tower curse — crumbling stones */
  .pp-panel-elim.pp-elim-tower{border-color:#4c1d95}
  .pp-panel-elim.pp-elim-tower::before{background:
    repeating-linear-gradient(180deg,transparent 0px,transparent 8px,rgba(124,58,237,0.15) 8px,rgba(124,58,237,0.15) 10px,transparent 10px,transparent 20px),
    linear-gradient(0deg,rgba(30,10,65,0.5) 0%,transparent 50%)}
  .pp-panel-save{background:linear-gradient(180deg,#fef3c7,#fff);border-color:var(--royal-gold);
    box-shadow:0 0 25px rgba(234,179,8,0.5);animation:pp-save-glow 1.5s ease-in-out infinite alternate}
  @keyframes pp-save-glow{0%{box-shadow:0 0 15px rgba(234,179,8,0.3)}100%{box-shadow:0 0 30px rgba(234,179,8,0.6)}}

  /* ═══ TYPOGRAPHY ═══ */
  .pp-title{font-family:'Cinzel',serif;font-weight:700;font-size:36px;color:var(--royal-gold);
    text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.4);line-height:1.2;letter-spacing:2px}
  .pp-subtitle{font-family:'Cinzel',serif;font-weight:400;font-size:14px;color:rgba(255,255,255,0.7);
    text-align:center;letter-spacing:4px;text-transform:uppercase}
  .pp-narration{font-family:'Lora',serif;font-size:15px;font-weight:600;line-height:1.7;color:#1a1a1a;
    padding:6px 0}
  .pp-royal-quote{font-family:'Dancing Script',cursive;font-size:18px;font-weight:700;
    color:#4a1d96;font-style:italic;padding:8px 14px;
    border-left:3px solid var(--royal-gold);margin:8px 0;
    background:rgba(255,255,255,0.5);border-radius:0 6px 6px 0}
  .pp-phase-title{font-family:'Cinzel',serif;font-weight:700;font-size:22px;
    color:var(--royal-gold);text-shadow:0 1px 4px rgba(0,0,0,0.3);
    margin:8px 0 4px;text-align:center}
  .pp-beat-title{font-family:'Cinzel',serif;font-weight:700;font-size:16px;
    color:var(--dark-text);border-bottom:1px solid rgba(234,179,8,0.3);
    padding-bottom:4px;margin-bottom:8px}
  .pp-caption{font-family:'Lora',serif;font-size:13px;color:#666;font-style:italic;
    text-align:center;margin:4px 0}

  /* ═══ CLASS BADGE ═══ */
  .pp-class-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;
    border-radius:12px;font-size:11px;font-weight:700;font-family:'Cinzel',serif;
    letter-spacing:1px;text-transform:uppercase}

  /* ═══ HERO CARD ═══ */
  .pp-hero-card{display:flex;align-items:center;gap:12px;padding:10px;
    background:rgba(255,255,255,0.7);border-radius:6px;margin:6px 0;
    border:1px solid rgba(234,179,8,0.2)}
  .pp-hero-photo{width:52px;height:52px;border-radius:50%;overflow:hidden;flex-shrink:0;
    border:2px solid var(--royal-gold);background:var(--cream)}
  .pp-hero-photo img{width:100%;height:100%;object-fit:contain}
  .pp-hero-name{font-family:'Cinzel',serif;font-weight:700;font-size:14px}
  .pp-hero-class{font-size:12px;color:#666}

  /* ═══ RANKING TABLE ═══ */
  .pp-rank{display:flex;align-items:center;gap:8px;padding:6px 10px;
    border-radius:4px;margin:3px 0;font-size:13px}
  .pp-rank:nth-child(1){background:rgba(234,179,8,0.15)}
  .pp-rank:nth-child(2){background:rgba(192,192,192,0.15)}
  .pp-rank:nth-child(3){background:rgba(205,127,50,0.15)}
  .pp-rank-pos{font-family:'Cinzel',serif;font-weight:700;font-size:16px;width:24px;text-align:center;color:var(--royal-gold)}
  .pp-rank-name{font-weight:700;flex:1}
  .pp-rank-score{font-size:11px;color:#888;font-family:'Lora',serif}

  /* ═══ DUEL ═══ */
  .pp-duel-split{display:flex;gap:0;margin:12px 0}
  .pp-duel-side{flex:1;padding:14px;position:relative}
  .pp-duel-side:first-child{border-right:2px solid var(--royal-gold)}
  .pp-duel-vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'Cinzel',serif;font-weight:700;font-size:28px;color:var(--royal-gold);
    text-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:10;
    background:var(--parchment);width:48px;height:48px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    border:2px solid var(--royal-gold)}
  .pp-duel-exchange{padding:10px;margin:8px 0;border-radius:6px;
    background:rgba(255,255,255,0.8);border:1px solid rgba(234,179,8,0.2)}
  .pp-duel-winner{font-family:'Cinzel',serif;font-weight:700;color:var(--forest-green);font-size:12px}
  .pp-duel-shift{font-size:10px;color:#888;font-family:'Lora',serif}

  /* ═══ CONTROLS ═══ */
  .pp-controls{display:flex;gap:8px;justify-content:center;padding:12px;position:relative;z-index:10}
  .pp-btn{font-family:'Cinzel',serif;font-weight:700;font-size:13px;padding:8px 20px;
    border:2px solid var(--royal-gold);border-radius:4px;cursor:pointer;
    background:linear-gradient(180deg,var(--parchment),#f5e6c8);color:var(--dark-text);
    transition:all 0.2s}
  .pp-btn:hover{background:linear-gradient(180deg,#fef3c7,#fde68a);box-shadow:0 0 10px rgba(234,179,8,0.4)}
  .pp-btn-royal{background:linear-gradient(180deg,#7c3aed,#6d28d9);color:#fff;border-color:#7c3aed}
  .pp-btn-royal:hover{background:linear-gradient(180deg,#8b5cf6,#7c3aed)}
  .pp-done{text-align:center;padding:12px;font-family:'Cinzel',serif;font-weight:700;
    color:var(--royal-gold);font-size:15px;display:none}

  /* ═══ COVER ═══ */
  .pp-cover{text-align:center;padding:50px 24px 40px;position:relative;z-index:5;
    background:linear-gradient(180deg,rgba(124,58,237,0.3),transparent,rgba(124,58,237,0.2))}
  .pp-cover-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px}
  .pp-cover-badge{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px;
    border:2px solid;border-radius:8px;background:rgba(0,0,0,0.3);min-width:60px}
  .pp-cover-badge-name{font-family:'Cinzel',serif;font-size:9px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1px}

  /* ═══ SIDEBAR ═══ */
  .pp-side-sec{font-family:'Cinzel',serif;font-weight:700;font-size:11px;letter-spacing:2px;
    text-transform:uppercase;color:var(--royal-purple);padding:6px 0 3px;
    border-bottom:1px solid rgba(124,58,237,0.2);margin-top:8px}
  .pp-side-player{display:flex;align-items:center;gap:4px;padding:3px 0;font-size:11px}
  .pp-side-player img{width:22px;height:22px;border-radius:3px;object-fit:contain}
  .pp-side-elim{opacity:0.45;text-decoration:line-through}
  .pp-side-class{font-size:9px;color:#888}

  /* ═══ IMMUNITY SPLASH ═══ */
  .pp-immunity{text-align:center;padding:30px 20px;
    background:linear-gradient(180deg,rgba(234,179,8,0.2),rgba(234,179,8,0.05));
    border:2px solid var(--royal-gold);border-radius:8px;margin:16px 0;
    box-shadow:0 0 30px rgba(234,179,8,0.3)}
  .pp-immunity-name{font-family:'Cinzel',serif;font-weight:700;font-size:28px;
    color:var(--royal-gold);text-shadow:0 2px 8px rgba(0,0,0,0.3)}
  .pp-immunity-label{font-family:'Lora',serif;font-size:12px;letter-spacing:4px;
    text-transform:uppercase;color:rgba(234,179,8,0.7);margin-top:4px}

  /* ═══ EVENT ═══ */
  .pp-event{padding:10px 12px;margin:6px 0;border-radius:6px;font-size:14px;line-height:1.6;
    background:rgba(255,255,255,0.6);border-left:3px solid var(--royal-purple)}
  .pp-event-badge{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;
    font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:'Cinzel',serif;margin-right:6px}
  .pp-event-green{border-left-color:var(--forest-green)}
  .pp-event-green .pp-event-badge{background:rgba(22,163,74,0.15);color:#16a34a}
  .pp-event-red{border-left-color:#dc2626}
  .pp-event-red .pp-event-badge{background:rgba(220,38,38,0.15);color:#dc2626}
  .pp-event-amber{border-left-color:var(--royal-gold)}
  .pp-event-amber .pp-event-badge{background:rgba(234,179,8,0.15);color:#b45309}

  /* ═══════════════════════════════════════════════════════ */
  /* ═══ VISUAL OVERDRIVE — FAIRY TALE ENHANCEMENTS ═══    */
  /* ═══════════════════════════════════════════════════════ */

  /* ── 1. STORYBOOK NARRATOR SCROLL ── */
  .pp-scroll{position:relative;
    background:linear-gradient(180deg,#f5e1b0 0%,var(--parchment) 8%,var(--parchment) 92%,#f5e1b0 100%);
    box-shadow:
      inset 0 12px 18px -8px rgba(160,120,60,0.35),
      inset 0 -12px 18px -8px rgba(160,120,60,0.35),
      0 4px 12px rgba(0,0,0,0.15);
    border:2px solid #c9a84c;border-radius:8px;overflow:hidden}
  .pp-scroll::before,.pp-scroll::after{content:'';position:absolute;left:0;right:0;height:18px;pointer-events:none;z-index:2}
  .pp-scroll::before{top:0;background:linear-gradient(180deg,rgba(180,140,70,0.25),transparent);border-radius:8px 8px 0 0}
  .pp-scroll::after{bottom:0;background:linear-gradient(0deg,rgba(180,140,70,0.25),transparent);border-radius:0 0 8px 8px}
  .pp-scroll .pp-beat-title{font-family:'Dancing Script',cursive;font-style:italic;font-size:19px;font-weight:700;
    color:#5c3a12;text-align:center;border-bottom:1px dashed rgba(180,140,70,0.4)}
  .pp-scroll .pp-caption{font-family:'Dancing Script',cursive;font-size:15px;color:#7a5a2c}
  .pp-scroll-reveal{max-height:0;opacity:0;overflow:hidden;
    transition:max-height 0.8s ease-out,opacity 0.6s ease-out 0.15s}
  .pp-scroll-reveal.pp-revealed,.pp-scroll-reveal[style*="display: "],.pp-scroll-reveal:not([style*="display:none"]){max-height:600px;opacity:1}

  /* ── 2. CLASS-COLORED PORTRAIT GLOW ── */
  .pp-glow-knight .pp-hero-photo,
  .pp-glow-knight>img:first-child{box-shadow:0 0 10px rgba(220,38,38,0.5),0 0 20px rgba(220,38,38,0.25);
    animation:pp-glow-pulse-knight 2s ease-in-out infinite;will-change:box-shadow}
  .pp-glow-mage .pp-hero-photo,
  .pp-glow-mage>img:first-child{box-shadow:0 0 10px rgba(124,58,237,0.5),0 0 20px rgba(124,58,237,0.25);
    animation:pp-glow-pulse-mage 2s ease-in-out infinite;will-change:box-shadow}
  .pp-glow-rogue .pp-hero-photo,
  .pp-glow-rogue>img:first-child{box-shadow:0 0 10px rgba(71,85,105,0.5),0 0 20px rgba(71,85,105,0.25);
    animation:pp-glow-pulse-rogue 2s ease-in-out infinite;will-change:box-shadow}
  .pp-glow-bard .pp-hero-photo,
  .pp-glow-bard>img:first-child{box-shadow:0 0 10px rgba(236,72,153,0.5),0 0 20px rgba(236,72,153,0.25);
    animation:pp-glow-pulse-bard 2s ease-in-out infinite;will-change:box-shadow}
  .pp-glow-barbarian .pp-hero-photo,
  .pp-glow-barbarian>img:first-child{box-shadow:0 0 10px rgba(180,83,9,0.5),0 0 20px rgba(180,83,9,0.25);
    animation:pp-glow-pulse-barbarian 2s ease-in-out infinite;will-change:box-shadow}
  .pp-glow-ranger .pp-hero-photo,
  .pp-glow-ranger>img:first-child{box-shadow:0 0 10px rgba(22,163,74,0.5),0 0 20px rgba(22,163,74,0.25);
    animation:pp-glow-pulse-ranger 2s ease-in-out infinite;will-change:box-shadow}

  @keyframes pp-glow-pulse-knight{0%,100%{box-shadow:0 0 10px rgba(220,38,38,0.5),0 0 20px rgba(220,38,38,0.25)}50%{box-shadow:0 0 18px rgba(220,38,38,0.7),0 0 35px rgba(220,38,38,0.35)}}
  @keyframes pp-glow-pulse-mage{0%,100%{box-shadow:0 0 10px rgba(124,58,237,0.5),0 0 20px rgba(124,58,237,0.25)}50%{box-shadow:0 0 18px rgba(124,58,237,0.7),0 0 35px rgba(124,58,237,0.35)}}
  @keyframes pp-glow-pulse-rogue{0%,100%{box-shadow:0 0 10px rgba(71,85,105,0.5),0 0 20px rgba(71,85,105,0.25)}50%{box-shadow:0 0 18px rgba(71,85,105,0.7),0 0 35px rgba(71,85,105,0.35)}}
  @keyframes pp-glow-pulse-bard{0%,100%{box-shadow:0 0 10px rgba(236,72,153,0.5),0 0 20px rgba(236,72,153,0.25)}50%{box-shadow:0 0 18px rgba(236,72,153,0.7),0 0 35px rgba(236,72,153,0.35)}}
  @keyframes pp-glow-pulse-barbarian{0%,100%{box-shadow:0 0 10px rgba(180,83,9,0.5),0 0 20px rgba(180,83,9,0.25)}50%{box-shadow:0 0 18px rgba(180,83,9,0.7),0 0 35px rgba(180,83,9,0.35)}}
  @keyframes pp-glow-pulse-ranger{0%,100%{box-shadow:0 0 10px rgba(22,163,74,0.5),0 0 20px rgba(22,163,74,0.25)}50%{box-shadow:0 0 18px rgba(22,163,74,0.7),0 0 35px rgba(22,163,74,0.35)}}

  /* ── 3. ANIMATED PERFORMANCE BADGES ── */
  .pp-perf-nailed{animation:pp-sparkle-burst 1.2s ease-out;will-change:transform,box-shadow}
  .pp-perf-rough{animation:pp-crack-shake 0.5s ease-in-out}
  .pp-perf-solid{animation:pp-gentle-glow 2s ease-in-out infinite;will-change:box-shadow}
  .pp-perf-meh{opacity:0.6}

  @keyframes pp-sparkle-burst{
    0%{transform:scale(1);box-shadow:none}
    30%{transform:scale(1.25);box-shadow:0 0 12px rgba(234,179,8,0.6),0 0 24px rgba(234,179,8,0.3)}
    60%{transform:scale(1.05);box-shadow:0 0 6px rgba(234,179,8,0.3)}
    100%{transform:scale(1);box-shadow:none}}
  @keyframes pp-crack-shake{
    0%,100%{transform:translateX(0)}
    10%{transform:translateX(-3px)}
    20%{transform:translateX(4px)}
    30%{transform:translateX(-4px)}
    40%{transform:translateX(3px)}
    50%{transform:translateX(-2px)}
    60%{transform:translateX(2px)}
    70%{transform:translateX(-1px)}
    80%{transform:translateX(1px)}}
  @keyframes pp-gentle-glow{
    0%,100%{box-shadow:0 0 4px rgba(34,197,94,0.2)}
    50%{box-shadow:0 0 10px rgba(34,197,94,0.5)}}

  /* ── 4. ENCHANTED ITEM CARDS ── */
  .pp-enchanted-item{position:relative;overflow:hidden;
    border:2px solid transparent;border-radius:8px;
    background-clip:padding-box}
  .pp-enchanted-item::before{content:'';position:absolute;inset:-2px;z-index:0;border-radius:10px;
    background:linear-gradient(90deg,#eab308,#fbbf24,#f59e0b,#eab308,#fbbf24);
    background-size:300% 100%;animation:pp-shimmer-border 3s linear infinite}
  .pp-enchanted-item::after{content:'';position:absolute;inset:2px;z-index:0;border-radius:6px;
    background:linear-gradient(180deg,var(--parchment),#fef9ef)}
  .pp-enchanted-item>*{position:relative;z-index:1}
  .pp-enchanted-item .pp-phase-title{text-shadow:0 0 12px rgba(234,179,8,0.5),0 2px 4px rgba(0,0,0,0.3)}

  @keyframes pp-shimmer-border{0%{background-position:0% 50%}100%{background-position:300% 50%}}

  /* Enchanted sword glow on emoji */
  .pp-sword-glow{text-shadow:0 0 8px rgba(234,179,8,0.6),0 0 16px rgba(234,179,8,0.3);
    animation:pp-sword-pulse 2s ease-in-out infinite;display:inline-block}
  @keyframes pp-sword-pulse{0%,100%{text-shadow:0 0 8px rgba(234,179,8,0.6),0 0 16px rgba(234,179,8,0.3);transform:scale(1)}
    50%{text-shadow:0 0 14px rgba(234,179,8,0.8),0 0 28px rgba(234,179,8,0.5);transform:scale(1.1)}}

  /* Golden armor cascading particles */
  .pp-armor-particles{position:relative}
  .pp-armor-particles::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    box-shadow:
      inset 12px 8px 0 -6px rgba(234,179,8,0.08),
      inset -15px 12px 0 -6px rgba(251,191,36,0.06),
      inset 8px -10px 0 -5px rgba(245,158,11,0.05),
      inset -10px -14px 0 -6px rgba(234,179,8,0.07),
      inset 20px 20px 0 -8px rgba(251,191,36,0.04),
      inset -20px 25px 0 -8px rgba(245,158,11,0.04);
    animation:pp-armor-cascade 3s ease-in-out infinite}
  @keyframes pp-armor-cascade{0%,100%{opacity:0.5}50%{opacity:0.8}}

  /* ── 5. DUEL VS SCREEN ENHANCEMENT ── */
  .pp-duel-tension{position:relative;overflow:hidden}
  .pp-duel-tension::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.08;
    background:repeating-linear-gradient(45deg,transparent,transparent 8px,var(--royal-gold) 8px,var(--royal-gold) 10px);
    background-size:200% 200%;animation:pp-speed-lines 1s linear infinite}
  .pp-duel-tension .pp-duel-vs{animation:pp-vs-pulse 1.5s ease-in-out infinite;
    text-shadow:0 0 12px rgba(220,38,38,0.6);color:#dc2626;
    background:linear-gradient(180deg,#fff5f5,#fef3c7);will-change:transform}
  .pp-duel-tension .pp-duel-vs::before{content:'';position:absolute;inset:-8px;z-index:-1;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Cline x1='5' y1='55' x2='55' y2='5' stroke='%23eab308' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='55' y1='55' x2='5' y2='5' stroke='%23eab308' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center/contain no-repeat;opacity:0.3}

  @keyframes pp-speed-lines{0%{background-position:0% 0%}100%{background-position:28px 28px}}
  @keyframes pp-vs-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);text-shadow:0 0 12px rgba(220,38,38,0.6)}
    50%{transform:translate(-50%,-50%) scale(1.15);text-shadow:0 0 24px rgba(220,38,38,0.9),0 0 40px rgba(220,38,38,0.4)}}

  /* ── 6. HAPPY ENDING ENHANCEMENT ── */
  .pp-happy-ending{position:relative;overflow:hidden;
    background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(234,179,8,0.1),rgba(236,72,153,0.15));
    background-size:200% 200%;animation:pp-warm-shift 4s ease-in-out infinite}
  .pp-happy-ending::before{content:'❤️';position:absolute;font-size:18px;opacity:0;
    top:80%;left:20%;z-index:0;animation:pp-heart-float 3s ease-out infinite}
  .pp-happy-ending::after{content:'❤️';position:absolute;font-size:14px;opacity:0;
    top:75%;left:65%;z-index:0;animation:pp-heart-float 3.5s ease-out 0.8s infinite}
  .pp-happy-ending .pp-immunity-name::before{content:'❤️ ';font-size:14px}
  .pp-happy-ending .pp-immunity-name::after{content:' ❤️';font-size:14px}
  /* Extra hearts via box-shadow particles */
  .pp-happy-ending>*{position:relative;z-index:1}

  @keyframes pp-warm-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes pp-heart-float{
    0%{opacity:0;transform:translateY(0) scale(0.5)}
    20%{opacity:0.7;transform:translateY(-20px) scale(1)}
    80%{opacity:0.4;transform:translateY(-80px) scale(0.8)}
    100%{opacity:0;transform:translateY(-120px) scale(0.5)}}

  /* ── 7. TITLE ANIMATION ── */
  .pp-title-animated{animation:pp-title-reveal 2s ease-out forwards;will-change:clip-path}
  @keyframes pp-title-reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}

  /* ── 8. DRAGON FIRE ENHANCEMENT ── */
  .pp-shell.pp-theme-dragon .pp-dragon-fire{position:absolute;bottom:0;left:0;right:0;height:200px;pointer-events:none;z-index:1;overflow:hidden}
  .pp-dragon-fire-col{position:absolute;bottom:0;width:120px;height:180px;pointer-events:none;
    background:
      radial-gradient(ellipse at 50% 100%,rgba(255,200,0,0.4) 0%,rgba(255,100,0,0.2) 30%,transparent 60%),
      radial-gradient(ellipse at 50% 85%,rgba(255,150,0,0.3) 0%,rgba(255,50,0,0.15) 25%,transparent 55%);
    animation:pp-dragon-fire-move var(--pp-fire-dur,2.5s) ease-in-out infinite;will-change:transform,opacity}
  .pp-dragon-fire-col:nth-child(1){left:15%;--pp-fire-dur:2.2s;animation-delay:-0.3s}
  .pp-dragon-fire-col:nth-child(2){left:42%;--pp-fire-dur:2.8s;height:200px;width:140px}
  .pp-dragon-fire-col:nth-child(3){left:70%;--pp-fire-dur:2.5s;animation-delay:-1s}

  @keyframes pp-dragon-fire-move{
    0%,100%{transform:scaleY(1) scaleX(1);opacity:0.7}
    25%{transform:scaleY(1.15) scaleX(0.95);opacity:0.9}
    50%{transform:scaleY(0.9) scaleX(1.05);opacity:0.6}
    75%{transform:scaleY(1.1) scaleX(0.98);opacity:0.85}}

  /* Enhanced embers for dragon theme */
  .pp-shell.pp-theme-dragon .pp-lantern{width:4px;height:4px;
    box-shadow:0 0 6px rgba(249,115,22,0.8),0 0 12px rgba(239,68,68,0.5),0 0 20px rgba(234,179,8,0.2);
    animation:pp-ember-enhanced var(--pp-em-dur,3s) ease-out infinite}
  .pp-shell.pp-theme-dragon .pp-lantern:nth-child(2){--pp-em-dur:2.2s;background:rgba(255,200,0,0.9)}
  .pp-shell.pp-theme-dragon .pp-lantern:nth-child(3){--pp-em-dur:3.5s;background:rgba(255,100,0,0.8)}

  @keyframes pp-ember-enhanced{
    0%{opacity:1;transform:translateY(0) translateX(0) scale(1);filter:blur(0)}
    30%{opacity:0.9;transform:translateY(-40px) translateX(8px) scale(0.9);filter:blur(0.5px)}
    60%{opacity:0.5;transform:translateY(-100px) translateX(-5px) scale(0.6);filter:blur(1px)}
    100%{opacity:0;transform:translateY(-180px) translateX(10px) scale(0.2);filter:blur(1.5px)}}

  /* Bottom fire glow pulse for dragon */
  .pp-shell.pp-theme-dragon .pp-dragon-glow{position:absolute;bottom:0;left:0;right:0;height:80px;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse at 50% 100%,rgba(239,68,68,0.25) 0%,rgba(249,115,22,0.15) 40%,transparent 70%);
    animation:pp-dragon-glow-pulse 2s ease-in-out infinite}
  @keyframes pp-dragon-glow-pulse{0%,100%{opacity:0.6}50%{opacity:1}}

  /* ═══ REDUCED MOTION ═══ */
  @media(prefers-reduced-motion:reduce){
    .pp-glow-knight .pp-hero-photo,.pp-glow-knight>img:first-child,
    .pp-glow-mage .pp-hero-photo,.pp-glow-mage>img:first-child,
    .pp-glow-rogue .pp-hero-photo,.pp-glow-rogue>img:first-child,
    .pp-glow-bard .pp-hero-photo,.pp-glow-bard>img:first-child,
    .pp-glow-barbarian .pp-hero-photo,.pp-glow-barbarian>img:first-child,
    .pp-glow-ranger .pp-hero-photo,.pp-glow-ranger>img:first-child{animation:none !important}
    .pp-perf-nailed,.pp-perf-rough,.pp-perf-solid{animation:none !important}
    .pp-enchanted-item::before{animation:none !important}
    .pp-sword-glow{animation:none !important}
    .pp-armor-particles::before{animation:none !important}
    .pp-duel-tension::before{animation:none !important}
    .pp-duel-tension .pp-duel-vs{animation:none !important}
    .pp-happy-ending{animation:none !important}
    .pp-happy-ending::before,.pp-happy-ending::after{animation:none !important}
    .pp-title-animated{animation:none !important;clip-path:none !important}
    .pp-dragon-fire-col{animation:none !important;opacity:0.5 !important}
    .pp-shell.pp-theme-dragon .pp-dragon-glow{animation:none !important}
    .pp-shell.pp-theme-dragon .pp-lantern{animation:none !important}
    .pp-scroll-reveal{transition:none !important;max-height:none !important;opacity:1 !important}
  }
  </style>`;
}

function _ppShell(content, ep, theme) {
  theme = theme || '';
  const lanternCount = theme === 'dragon' ? 3 : theme === 'bridge' ? 4 : 8;
  const lanterns = Array.from({ length: lanternCount }, (_, i) => {
    const left = 5 + Math.random() * 90;
    const top = 5 + Math.random() * 85;
    return `<div class="pp-lantern" style="left:${left}%;top:${top}%"></div>`;
  }).join('');
  const dragonFire = theme === 'dragon' ? `<div class="pp-dragon-fire"><div class="pp-dragon-fire-col"></div><div class="pp-dragon-fire-col"></div><div class="pp-dragon-fire-col"></div></div><div class="pp-dragon-glow"></div>` : '';
  return `${css()}<div class="pp-shell ${theme ? 'pp-theme-' + theme : 'pp-theme-ceremony'}">${lanterns}${dragonFire}${content}</div>`;
}

function _getPrevPhaseScores(pp, phaseIdx) {
  if (phaseIdx <= 0) return {};
  const prevPhase = pp.phases[phaseIdx - 1];
  if (!prevPhase?.beats?.length) return {};
  const lastBeat = prevPhase.beats[prevPhase.beats.length - 1];
  return lastBeat?.scoreSnapshot || {};
}

function _buildSidebar(pp, revealedElims, scores, currentPhaseIdx) {
  const visibleElims = revealedElims || [];
  const scoreData = scores || {};
  const maxScore = Math.max(1, ...Object.values(scoreData));
  let sb = '';
  sb += `<div class="pp-side-sec">ROYALTY</div>`;
  sb += `<div class="pp-side-player">
    ${portrait(pp.royalName, 22)}
    <span style="font-weight:700;color:var(--royal-gold)">${ROYAL.icon} ${pp.royalTitle} ${pp.royalName}</span>
  </div>`;

  sb += `<div class="pp-side-sec">QUEST PROGRESS</div>`;
  const sorted = [...pp.classAssignments].sort((a, b) => (scoreData[b.name] || 0) - (scoreData[a.name] || 0));
  for (const ca of sorted) {
    const cls = CLASSES[ca.cls];
    const isElim = visibleElims.includes(ca.name);
    const score = scoreData[ca.name] || 0;
    const pct = Math.round((score / maxScore) * 100);
    const barColor = isElim ? '#666' : (cls?.color || '#7c3aed');
    sb += `<div class="pp-side-player ${isElim ? 'pp-side-elim' : ''}" style="flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:4px;width:100%">
        ${portrait(ca.name, 18)}
        <span style="flex:1;font-size:10px">${ca.name}</span>
        <span style="font-size:9px;color:${cls?.color || '#888'}">${cls?.icon || ''}</span>
        <span style="font-family:'Cinzel',serif;font-size:10px;font-weight:700;color:${barColor}">${score > 0 ? score.toFixed(0) : '-'}</span>
      </div>
      ${score > 0 ? `<div style="width:100%;height:4px;background:rgba(0,0,0,0.1);border-radius:2px;margin-top:2px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.3s"></div>
      </div>` : ''}
    </div>`;
  }

  // Advantages — only show after they've been awarded (sword after phase 2, armor after phase 4)
  const showSword = currentPhaseIdx >= 2 && pp.swordGiven?.recipient;
  const showArmor = currentPhaseIdx >= 3 && pp.armorGiven?.recipient;
  const showSave = pp.royalSaveUsed && pp.royalSaveBeat;
  if (showSword || showArmor || showSave || currentPhaseIdx >= 1) {
    sb += `<div class="pp-side-sec">ADVANTAGES</div>`;
    if (showSword) sb += `<div style="font-size:11px;padding:2px 0">⚔️ Enchanted Sword: <b>${pp.swordGiven.recipient}</b></div>`;
    else if (currentPhaseIdx < 2) sb += `<div style="font-size:11px;padding:2px 0;color:#888">⚔️ Enchanted Sword: <i>After Troll Bridge</i></div>`;
    if (showArmor) sb += `<div style="font-size:11px;padding:2px 0">🛡️ Golden Armor: <b>${pp.armorGiven.recipient}</b></div>`;
    else if (currentPhaseIdx < 4) sb += `<div style="font-size:11px;padding:2px 0;color:#888">🛡️ Golden Armor: <i>After Tower</i></div>`;
    if (showSave) sb += `<div style="font-size:11px;padding:2px 0">👑 Royal Save: <b>${pp.royalSavedPlayer}</b></div>`;
    else if (!pp.royalSaveUsed) sb += `<div style="font-size:11px;padding:2px 0;color:var(--royal-gold)">👑 Royal Save: Available</div>`;
  }

  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP — SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildPrincessPrideTitleCard(ep) {
  const pp = ep.princessPride;
  if (!pp) return '';

  // Show ALL players equally on the cover — no spoilers about who becomes princess
  const allCover = [pp.royalName, ...pp.classAssignments.map(ca => ca.name)];
  const badges = allCover.map(name => {
    return `<div class="pp-cover-badge" style="border-color:var(--royal-purple)">
      <img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display='none'">
      <div class="pp-cover-badge-name">${name.split(' ').pop()}</div>
    </div>`;
  }).join('');

  return _ppShell(`
    <div class="pp-cover">
      <div class="pp-subtitle">TOTAL DRAMA PRESENTS</div>
      <div class="pp-title pp-title-animated" style="margin:12px 0">THE<br>PRINCESS PRIDE</div>
      <div class="pp-subtitle">A ${host().toUpperCase()} PRODUCTION</div>
      <div class="pp-caption" style="margin-top:16px;color:rgba(255,255,255,0.7);font-size:14px">
        GLASS SLIPPER &middot; ENCHANTED FOREST &middot; TROLL BRIDGE &middot; DRAGON'S LAIR &middot; TOWER RESCUE
      </div>
      <div style="margin-top:12px;font-family:'Dancing Script',cursive;font-size:18px;color:rgba(255,255,255,0.85)">
        "Every fairy tale has a twist. This one has a sword fight."
      </div>
      <div class="pp-cover-roster" style="margin-top:16px">${badges}</div>
    </div>
  `, ep);
}

export function rpBuildPrincessPrideCeremony(ep) {
  const pp = ep.princessPride;
  if (!pp) return '';
  const stateKey = 'pp-ceremony';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Step 0: Glass Slipper ceremony
  steps.push(`<div class="pp-panel pp-panel-royal">
    <div class="pp-phase-title">${ROYAL.icon} The Glass Slipper Ceremony</div>
    <div class="pp-narration">${pp.ceremonyText}</div>
    <div class="pp-hero-card" style="border:2px solid var(--royal-gold);background:rgba(234,179,8,0.1)">
      <div class="pp-hero-photo" style="border-color:var(--royal-gold)">
        <img src="assets/avatars/${slug(pp.royalName)}.png" onerror="this.style.display='none'" alt="${pp.royalName}">
      </div>
      <div>
        <div class="pp-hero-name" style="color:var(--royal-gold)">${ROYAL.icon} ${pp.royalTitle} ${pp.royalName}</div>
        <div class="pp-hero-class">The throne awaits.</div>
      </div>
    </div>
    <div class="pp-royal-quote">${pp.reactionText}</div>
  </div>`);

  // Steps 1+: Class assignments
  for (const ca of pp.classAssignments) {
    const cls = CLASSES[ca.cls];
    steps.push(`<div class="pp-panel">
      <div class="pp-hero-card">
        <div class="pp-hero-photo" style="border-color:${cls?.color || '#888'}">
          <img src="assets/avatars/${slug(ca.name)}.png" onerror="this.style.display='none'" alt="${ca.name}">
        </div>
        <div>
          <div class="pp-hero-name" style="color:${cls?.color || '#333'}">${ca.name}</div>
          <div class="pp-hero-class"><span class="pp-class-badge" style="background:${cls?.color || '#888'}22;color:${cls?.color || '#333'};border:1px solid ${cls?.color || '#888'}44">${cls?.icon || ''} ${cls?.label || ''}</span></div>
        </div>
      </div>
      <div class="pp-narration">${ca.text}</div>
    </div>`);
  }

  const total = steps.length;
  const stepsHtml = steps.map((html, i) =>
    `<div id="pp-step-ceremony-${i}" style="${i > revIdx ? 'display:none' : ''}">${html}</div>`
  ).join('');

  return _ppShell(`
    <div class="pp-hud">
      <div class="pp-hud-cell"><div class="pp-hud-val">${ROYAL.icon}</div><div class="pp-hud-lbl">CEREMONY</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${pp.classAssignments.length}</div><div class="pp-hud-lbl">KNIGHTS</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${CLASS_KEYS.length}</div><div class="pp-hud-lbl">CLASSES</div></div>
    </div>
    <div class="pp-layout">
      <div class="pp-feed">${stepsHtml}
        <div class="pp-controls" id="pp-controls-ceremony">
          <button class="pp-btn" onclick="princessPrideRevealNext('pp-ceremony',${total})">Next ></button>
          <button class="pp-btn pp-btn-royal" onclick="princessPrideRevealAll('pp-ceremony',${total})">Reveal All</button>
        </div>
        <div class="pp-done" id="pp-done-ceremony">The quest begins...</div>
      </div>
      <div class="pp-sidebar">${_buildSidebar(pp, [], {}, -1)}</div>
    </div>
  `, ep);
}

function _buildPhaseScreen(ep, phaseIdx, panelClass) {
  const pp = ep.princessPride;
  if (!pp) return '';
  const phase = pp.phases[phaseIdx];
  if (!phase) return '';
  const stateKey = `pp-${phase.id}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Phase intro
  steps.push(`<div class="pp-panel ${panelClass}">
    <div class="pp-phase-title">${phase.label}</div>
    <div class="pp-caption">And so the knights entered ${phase.id === 'forest' ? 'the enchanted forest, where nothing was as it seemed...' : phase.id === 'bridge' ? 'the shadow of the great Troll Bridge, where Chef waited, arms folded and furious...' : phase.id === 'dragon' ? "the Dragon's lair, where fire and shadow ruled..." : 'the base of the Tower, where destiny waited at the summit...'}</div>
  </div>`);

  for (const beat of phase.beats) {
    // Beat title card
    steps.push(`<div class="pp-panel ${panelClass} pp-scroll">
      <div class="pp-beat-title">${beat.label}</div>
      <div class="pp-caption" style="font-style:italic;margin-top:4px">${
        beat.label.includes('Navigate') ? 'The path shifts. The forest whispers. Only the perceptive will find the way...' :
        beat.label.includes('Riddle') ? 'An ancient gate blocks the path. Its riddle glows with arcane light...' :
        beat.label.includes('Ambush') ? 'The undergrowth erupts! Enchanted creatures attack from every direction!' :
        beat.label.includes('Negotiate') ? 'Chef the Troll blocks the bridge. "NOBODY CROSSES!" Time to talk... or fight.' :
        beat.label.includes('Blindfold') ? 'Blindfolds on. The bridge sways. Chef throws apples. Good luck.' :
        beat.label.includes('Endure') ? 'The Troll goes full rage mode. Survive or be thrown into the chasm!' :
        beat.label.includes('Sneak') ? 'A dragon sleeps in the lair. Every footstep could be the last...' :
        beat.label.includes('Fight') ? 'The dragon awakens! ROAR! Fire fills the cavern!' :
        beat.label.includes('Weakness') ? 'Brute force alone won\'t work. The dragon has a weakness — find it!' :
        beat.label.includes('Scale') ? 'The tower stretches into the clouds. Climb. Don\'t look down.' :
        beat.label.includes('Break') || beat.label.includes('Defense') ? 'Guards, gates, and enchanted locks. Break through to reach the top!' :
        beat.label.includes('Push') || beat.label.includes('Rally') ? 'The final stretch. Exhaustion. Willpower. Who wants it more?' :
        'The quest continues...'
      }</div>
    </div>`);

    // Each player's narration — one at a time, like a story unfolding
    const maxBeatScore = Math.max(1, ...beat.ranked.map(r => r.score));
    for (const r of beat.ranked) {
      const cls = CLASSES[r.cls];
      const ratio = r.score / maxBeatScore;
      const pos = beat.ranked.indexOf(r);
      const isFirst = pos === 0;
      // Performance badge
      let perfBadge, perfColor, borderColor, perfClass;
      if (isFirst) { perfBadge = '⭐ NAILED IT'; perfColor = '#16a34a'; borderColor = 'var(--forest-green)'; perfClass = 'pp-perf-nailed'; }
      else if (ratio >= 0.75) { perfBadge = '✓ SOLID'; perfColor = '#22c55e'; borderColor = '#22c55e'; perfClass = 'pp-perf-solid'; }
      else if (ratio >= 0.6) { perfBadge = '~ OK'; perfColor = '#a3a3a3'; borderColor = '#a3a3a3'; perfClass = 'pp-perf-meh'; }
      else if (ratio >= 0.35) { perfBadge = '⚠ MEH'; perfColor = '#f59e0b'; borderColor = '#f59e0b'; perfClass = 'pp-perf-meh'; }
      else { perfBadge = '✗ ROUGH'; perfColor = '#ef4444'; borderColor = '#ef4444'; perfClass = 'pp-perf-rough'; }

      const glowClass = r.cls ? `pp-glow-${r.cls}` : '';
      steps.push(`<div class="pp-panel ${panelClass} ${glowClass}" style="padding:14px 18px;border-left:4px solid ${borderColor}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${portrait(r.name, 36)}
          <div style="flex:1">
            <div style="font-family:'Cinzel',serif;font-weight:700;font-size:15px;color:${cls?.color || '#333'}">${r.name}</div>
            <span class="pp-class-badge" style="background:${cls?.color || '#888'}22;color:${cls?.color || '#333'};border:1px solid ${cls?.color || '#888'}44">${cls?.icon || ''} ${cls?.label || ''}</span>
          </div>
          <span class="${perfClass}" style="font-family:'Cinzel',serif;font-size:10px;font-weight:700;color:${perfColor};padding:3px 8px;border:1px solid ${perfColor}44;border-radius:4px;background:${perfColor}11;letter-spacing:1px">${perfBadge}</span>
        </div>
        <div class="pp-narration">${r.text}</div>
      </div>`);
    }

    // Class combo moments
    if (beat.combos?.length) {
      for (const combo of beat.combos) {
        const clsA = CLASSES[pp.classMap?.[combo.a]];
        const clsB = CLASSES[pp.classMap?.[combo.b]];
        steps.push(`<div class="pp-event pp-event-green">
          <span class="pp-event-badge" style="background:rgba(234,179,8,0.15);color:#b45309">TEAMWORK</span>
          <div style="display:flex;gap:4px;margin:4px 0">${portrait(combo.a, 24)}${portrait(combo.b, 24)}
            <span style="font-size:10px;color:#888">${clsA?.icon || ''} ${clsA?.label || ''} + ${clsB?.icon || ''} ${clsB?.label || ''}</span>
          </div>
          ${combo.text}
        </div>`);
      }
    }

    // Eliminations — location-specific curse animation
    const elimPhase = phase.id === 'forest' ? 'forest' : phase.id === 'bridge' ? 'bridge' : phase.id === 'dragon' ? 'dragon' : 'tower';
    for (const elim of beat.eliminated) {
      steps.push(`<div class="pp-panel pp-panel-elim pp-elim-${elimPhase}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(elim.name, 32)}
          <span style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:${elimPhase === 'dragon' ? '#ff4444' : elimPhase === 'bridge' ? '#aaa' : elimPhase === 'tower' ? '#a78bfa' : '#ff6b6b'}">CURSED!</span>
          <span style="font-weight:700;color:#ddd">${elim.name}</span>
        </div>
        <div class="pp-narration" style="color:#ccc">${elim.text}</div>
      </div>`);
    }

    // Royal save
    if (beat.save) {
      steps.push(`<div class="pp-panel pp-panel-save">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(beat.save.player, 32)}
          <span style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:var(--royal-gold)">ROYAL SAVE!</span>
          <span style="font-weight:700">${beat.save.player}</span>
        </div>
        <div class="pp-narration">${beat.save.text}</div>
      </div>`);
    }

    // Between-beat social events — interleaved with the quest
    if (beat.events?.length) {
      for (const ev of beat.events) {
        const evClass = ev.badgeClass === 'green' ? 'pp-event-green' : ev.badgeClass === 'red' ? 'pp-event-red' : 'pp-event-amber';
        steps.push(`<div class="pp-event ${evClass}">
          <span class="pp-event-badge">${ev.badgeText || ev.type}</span>
          ${ev.text}
        </div>`);
      }
    }
  }

  // Advantage given after phase 2 (sword) or phase 4 (armor)
  if (phaseIdx === 1 && pp.swordGiven.recipient) {
    steps.push(`<div class="pp-panel pp-panel-royal pp-enchanted-item">
      <div class="pp-phase-title"><span class="pp-sword-glow">⚔️</span> The Enchanted Sword</div>
      <div class="pp-narration">${pp.swordGiven.text}</div>
    </div>`);
  }
  if (phaseIdx === 3 && pp.armorGiven.recipient) {
    steps.push(`<div class="pp-panel pp-panel-royal pp-enchanted-item pp-armor-particles">
      <div class="pp-phase-title">🛡️ The Golden Armor</div>
      <div class="pp-narration">${pp.armorGiven.text}</div>
    </div>`);
    // Show who fell short on the tower stairs
    if (pp.towerFallouts?.length) {
      for (const fo of pp.towerFallouts) {
        const foCls = CLASSES[fo.cls];
        steps.push(`<div class="pp-panel pp-panel-elim pp-elim-tower">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            ${portrait(fo.name, 32)}
            <span style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:#a78bfa">FELL SHORT</span>
            <span style="font-weight:700;color:#ddd">${fo.name}</span>
            <span class="pp-class-badge" style="background:${foCls?.color || '#888'}22;color:${foCls?.color || '#ccc'};border:1px solid ${foCls?.color || '#888'}44;font-size:9px">${foCls?.icon || ''} ${foCls?.label || ''}</span>
          </div>
          <div class="pp-narration" style="color:#ccc">${fo.text}</div>
        </div>`);
      }
      const duelistName = pp.duel?.winner === pp.royalName ? pp.duel?.loser : pp.duel?.winner;
      if (duelistName) {
        steps.push(`<div class="pp-panel pp-panel-duel" style="text-align:center">
          <div class="pp-phase-title">🏰 The Summit</div>
          <div class="pp-narration" style="font-size:16px">Only one knight had the strength to reach the top. <b>${duelistName}</b> stood alone before the tower door, chest heaving, blade ready.</div>
        </div>`);
      }
    }
  }

  const total = steps.length;
  const suffix = phase.id;
  const stepsHtml = steps.map((html, i) =>
    `<div id="pp-step-${suffix}-${i}" style="${i > revIdx ? 'display:none' : ''}">${html}</div>`
  ).join('');

  const aliveCount = pp.classAssignments.length - pp.eliminationOrder.slice(0, pp.phases.slice(0, phaseIdx + 1).flatMap(p => p.eliminated).length).length;
  const phaseThemes = ['forest', 'bridge', 'dragon', 'tower'];
  const theme = phaseThemes[phaseIdx] || 'ceremony';

  return _ppShell(`
    <div class="pp-hud">
      <div class="pp-hud-cell"><div class="pp-hud-val">${phase.label.split(' ').map(w => w[0]).join('')}</div><div class="pp-hud-lbl">PHASE ${phaseIdx + 1}</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${aliveCount}</div><div class="pp-hud-lbl">ALIVE</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${phase.eliminated.length}</div><div class="pp-hud-lbl">CURSED</div></div>
    </div>
    <div class="pp-layout">
      <div class="pp-feed">${stepsHtml}
        <div class="pp-controls" id="pp-controls-${suffix}">
          <button class="pp-btn" onclick="princessPrideRevealNext('pp-${suffix}',${total})">Next ></button>
          <button class="pp-btn pp-btn-royal" onclick="princessPrideRevealAll('pp-${suffix}',${total})">Reveal All</button>
        </div>
        <div class="pp-done" id="pp-done-${suffix}">The quest continues...</div>
      </div>
      <div class="pp-sidebar" id="pp-sidebar-${suffix}">${_buildSidebar(pp, pp.phases.slice(0, phaseIdx).flatMap(p => p.eliminated), _getPrevPhaseScores(pp, phaseIdx), phaseIdx)}</div>
    </div>
  `, ep, theme);
}

export function rpBuildPrincessPrideForest(ep) { return _buildPhaseScreen(ep, 0, 'pp-panel-forest'); }
export function rpBuildPrincessPrideBridge(ep) { return _buildPhaseScreen(ep, 1, 'pp-panel-bridge'); }
export function rpBuildPrincessPrideDragon(ep) { return _buildPhaseScreen(ep, 2, 'pp-panel-dragon'); }
export function rpBuildPrincessPrideTower(ep) { return _buildPhaseScreen(ep, 3, 'pp-panel-tower'); }

export function rpBuildPrincessPrideDuel(ep) {
  const pp = ep.princessPride;
  if (!pp?.duel) return '';
  const stateKey = 'pp-duel';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;
  const duel = pp.duel;

  const steps = [];


  const duelistKnight = duel.winner === pp.royalName ? duel.loser : duel.winner;

  // Chris intervention
  const chrisTexts = [
    `${host()} appeared on the tower balcony, grinning. "Oh, you thought rescuing the ${pp.royalTitle.toLowerCase()} was the END? That's adorable." He tossed a second sword into the room. "Here's the REAL challenge: ${pp.royalTitle} ${pp.royalName} vs. the knight who made it to the top. Winner gets immunity. Loser gets... well, a great story for the confessional."`,
    `"Hold on, hold on, HOLD ON!" ${host()} slid down a rope from the rafters. "Before any rescuing happens — plot twist!" He snapped his fingers. A second sword materialized in ${pp.royalTitle} ${pp.royalName}'s hands. "The ${pp.royalTitle.toLowerCase()} doesn't NEED saving. The ${pp.royalTitle.toLowerCase()} needs a SPARRING PARTNER. Last one standing wins immunity!"`,
    `${host()}'s voice echoed through the tower chamber. "Did you really think the fairy tale ended with a rescue? This is TOTAL DRAMA. The fairy tale ends with a SWORD FIGHT." ${pp.royalTitle} ${pp.royalName} drew a blade that had been hidden behind the throne. "Surprise."`,
  ];
  steps.push(`<div class="pp-panel pp-panel-royal">
    <div class="pp-narration" style="font-size:15px">${pick(chrisTexts)}</div>
  </div>`);

  // The betrayal moment — Princess/Prince reveals their true nature
  const betrayalTexts = [
    `${duelistKnight} stared at ${pp.royalName}. "Wait... you're fighting ME?" ${pp.royalTitle} ${pp.royalName} tested the blade's weight, smiling. "I've been watching every fight. Every stumble. Every weakness. I know exactly how to beat you." ${duelistKnight} gripped ${pronouns(duelistKnight).posAdj} sword tighter. "Then let's see if watching is the same as doing."`,
    `The room fell silent. ${duelistKnight} had survived the forest, the troll, the dragon, and the tower — all to rescue ${pp.royalTitle} ${pp.royalName}. And now ${pp.royalName} was pointing a sword at ${pronouns(duelistKnight).obj}. "Nothing personal," ${pp.royalName} said. It was very personal. "Immunity is immunity."`,
    `${pp.royalTitle} ${pp.royalName} descended from the throne, blade in hand. "You fought through an entire kingdom to reach me. I respect that." A pause. "But respect doesn't mean I'm giving you immunity." ${duelistKnight} watched ${pp.royalName}'s stance — practiced, confident, FRESH. This was going to hurt.`,
  ];
  steps.push(`<div class="pp-panel pp-panel-duel">
    <div class="pp-narration" style="font-size:15px">${pick(betrayalTexts)}</div>
  </div>`);

  // Duel VS card
  steps.push(`<div class="pp-panel pp-panel-duel pp-duel-tension">
    <div class="pp-phase-title">⚔️ The Betrayal Duel</div>
    <div class="pp-duel-split">
      <div class="pp-duel-side" style="text-align:center">
        ${portrait(pp.royalName, 56)}
        <div class="pp-hero-name" style="color:var(--royal-gold);margin-top:6px">${ROYAL.icon} ${pp.royalTitle} ${pp.royalName}</div>
        <div style="font-size:11px;color:#888">Fresh. Informed. Dangerous.</div>
      </div>
      <div class="pp-duel-vs">VS</div>
      <div class="pp-duel-side" style="text-align:center">
        ${portrait(duel.loser === pp.royalName ? duel.winner : (duel.winner === pp.royalName ? duel.loser : duel.winner), 56)}
        <div class="pp-hero-name" style="color:#dc2626;margin-top:6px">⚔️ ${duel.loser === pp.royalName ? duel.winner : (duel.winner === pp.royalName ? duel.loser : duel.winner)}</div>
        <div style="font-size:11px;color:#888">Exhausted. Battered. Determined.</div>
      </div>
    </div>
  </div>`);

  // Showmance hesitation if applicable
  if (duel.isShowmance && duel.showmanceText) {
    steps.push(`<div class="pp-panel pp-panel-royal">
      <div class="pp-royal-quote">${duel.showmanceText}</div>
    </div>`);
  }

  // Exchange beats
  for (const ex of duel.exchanges) {
    const isRoyalWin = ex.winner === pp.royalName;
    steps.push(`<div class="pp-duel-exchange" style="border-left:3px solid ${isRoyalWin ? 'var(--royal-gold)' : '#dc2626'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span class="pp-beat-title" style="border:none;padding:0;margin:0">${ex.name}</span>
        <span class="pp-duel-winner">${ex.winner} wins</span>
        <span class="pp-duel-shift">+${ex.shift} momentum</span>
      </div>
      <div class="pp-narration">${ex.text}</div>
    </div>`);
  }

  // Result + immunity
  if (duel.happyEnding) {
    steps.push(`<div class="pp-immunity pp-happy-ending" style="border-color:var(--fairy-pink);box-shadow:0 0 30px rgba(236,72,153,0.3)">
      <div style="display:flex;gap:16px;justify-content:center;align-items:center">
        ${portrait(pp.royalName, 56)}
        <div style="font-size:32px">❤️</div>
        ${portrait(duel.knightName, 56)}
      </div>
      <div class="pp-immunity-name" style="color:var(--fairy-pink)">HAPPY ENDING!</div>
      <div class="pp-immunity-label">Both Win Immunity</div>
      <div class="pp-caption" style="margin-top:8px;color:var(--dark-text)">
        ${pp.royalTitle} ${pp.royalName} and ${duel.knightName} chose love over victory. ${host()} was furious. The audience was in tears. And somehow, against all the rules of competition, they both walked away safe.
      </div>
    </div>`);
  } else {
    steps.push(`<div class="pp-immunity">
      ${portrait(duel.winner, 64)}
      <div class="pp-immunity-name">${duel.winner}</div>
      <div class="pp-immunity-label">Wins Immunity${duel.narrow ? ' (by a hair!)' : ''}</div>
      <div class="pp-caption" style="margin-top:8px;color:var(--dark-text)">
        ${duel.winner === pp.royalName
          ? `${pp.royalTitle} ${pp.royalName} proved that the crown carries its own kind of strength. The fairy tale ends with royalty on top.`
          : `The knight toppled the ${pp.royalTitle.toLowerCase()}. In this fairy tale, courage conquers privilege.`}
      </div>
    </div>`);
  }
  steps.push(`<div class="pp-panel" style="text-align:center">
    <div class="pp-caption" style="color:var(--dark-text)">The fairy tale has ended. ${duel.happyEnding ? 'And they lived happily ever after... at least until Tribal Council.' : 'But the game continues.'}</div>
  </div>`);

  const total = steps.length;
  const stepsHtml = steps.map((html, i) =>
    `<div id="pp-step-duel-${i}" style="${i > revIdx ? 'display:none' : ''}">${html}</div>`
  ).join('');

  return _ppShell(`
    <div class="pp-hud">
      <div class="pp-hud-cell"><div class="pp-hud-val">⚔️</div><div class="pp-hud-lbl">DUEL</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${pp.royalTitle}</div><div class="pp-hud-lbl">VS KNIGHT</div></div>
      <div class="pp-hud-cell"><div class="pp-hud-val">${duel.exchanges.length}</div><div class="pp-hud-lbl">EXCHANGES</div></div>
    </div>
    <div class="pp-layout">
      <div class="pp-feed">${stepsHtml}
        <div class="pp-controls" id="pp-controls-duel">
          <button class="pp-btn" onclick="princessPrideRevealNext('pp-duel',${total})">Next ></button>
          <button class="pp-btn pp-btn-royal" onclick="princessPrideRevealAll('pp-duel',${total})">Reveal All</button>
        </div>
        <div class="pp-done" id="pp-done-duel">The fairy tale has ended.</div>
      </div>
      <div class="pp-sidebar">${_buildSidebar(pp, pp.eliminationOrder, _getPrevPhaseScores(pp, pp.phases.length), 99)}</div>
    </div>
  `, ep, 'duel');
}

// ══════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
export function princessPrideRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('pp-', '');
  const el = document.getElementById(`pp-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`pp-controls-${suffix}`);
    const done = document.getElementById(`pp-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
}

export function princessPrideRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('pp-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`pp-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`pp-controls-${suffix}`);
  const done = document.getElementById(`pp-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
}

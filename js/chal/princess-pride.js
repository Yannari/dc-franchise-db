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
  hero: 'knight', 'loyal-soldier': 'knight', underdog: 'knight',
  hothead: 'barbarian', 'challenge-beast': 'barbarian', 'chaos-agent': 'barbarian',
  'social-butterfly': 'bard', showmancer: 'bard', floater: 'bard',
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
      return { name, score: s.social * 0.4 + s.boldness * 0.3 + noise(2) };
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
  // Second pass: allow duplicates
  for (const { name, cls } of priorityPlayers) {
    if (assigned[name]) continue;
    if (classCounts[cls] < cap) {
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
  ],
  reaction: {
    happy: [
      (name, pr, title) => `${name} smiled and accepted the crown. "I've been waiting my whole life for this moment." ${pr.Sub} wasn't kidding.`,
      (name, pr, title) => `${name} placed the crown on ${pr.posAdj} head with practiced ease. "Born for this."`,
    ],
    villain: [
      (name, pr, title) => `${name} took the crown and smirked. "Finally, the power I deserve." The other players exchanged worried glances.`,
      (name, pr, title) => `${name} snatched the crown. "Every kingdom needs a ruler who isn't afraid to get their hands dirty." ${pr.Sub} was already scheming.`,
    ],
    reluctant: [
      (name, pr, title) => `${name} blinked. "Wait, me? I'm the ${title.toLowerCase()}?" ${pr.Sub} looked down at the slipper. "I... guess I am."`,
      (name, pr, title) => `${name} accepted the crown hesitantly. "I'm not sure I'm cut out for this." The crown fit perfectly. Destiny doesn't ask.`,
    ],
  },
};

const CLASS_ASSIGN_TEXT = {
  knight: [
    (name, pr) => `${name} drew a broadsword from a stone pedestal. It rang like a bell. "By my honor." ${pr.Sub} was a Knight now.`,
    (name, pr) => `A suit of gleaming red armor materialized around ${name}. ${pr.Sub} tested the sword. Balanced. Deadly. "${pr.Sub === 'She' || pr.Sub === 'she' ? 'she' : 'he'} looked like ${pr.sub} was born for battle."`,
  ],
  ranger: [
    (name, pr) => `${name} found a longbow hanging from an oak branch. The forest seemed to whisper ${pr.posAdj} name. Ranger.`,
    (name, pr) => `A green cloak settled on ${name}'s shoulders like a second skin. ${pr.Sub} nocked an arrow instinctively. The Ranger walks alone.`,
  ],
  mage: [
    (name, pr) => `${name} opened an ancient spellbook. The pages glowed violet. Knowledge poured in like a flood. "I can SEE the patterns now."`,
    (name, pr) => `A crystal staff flew into ${name}'s hand. Purple sparks danced at the tip. "The arcane chooses the worthy." The Mage had arrived.`,
  ],
  rogue: [
    (name, pr) => `${name} vanished into shadow and reappeared behind ${host()}. "Didn't see me, did you?" The Rogue grins. The Rogue always grins.`,
    (name, pr) => `A set of lockpicks and a dark cloak appeared at ${name}'s feet. ${pr.Sub} picked them up without a sound. Some are born to the shadows.`,
  ],
  bard: [
    (name, pr) => `${name} strummed a lute that appeared from nowhere. The melody was haunting. Beautiful. "Every quest needs a song." The Bard had found ${pr.posAdj} instrument.`,
    (name, pr) => `Music swelled around ${name}. A golden lute materialized. "${pr.Sub === 'She' || pr.Sub === 'she' ? 'She' : 'He'} who controls the story controls the kingdom." The Bard speaks truth.`,
  ],
  barbarian: [
    (name, pr) => `${name} hefted a battle axe bigger than ${pr.posAdj} torso. No finesse. No technique. Just raw, terrifying power. The Barbarian needs nothing else.`,
    (name, pr) => `The ground cracked where ${name} planted ${pr.posAdj} feet. Warpaint appeared across ${pr.posAdj} face. The Barbarian was ready for war.`,
  ],
};

// ── PHASE BEAT TEXT (per class approach) ──
const BEAT_TEXT = {
  // Phase 1: Enchanted Forest
  'forest-navigate': {
    ranger: [
      (n, pr) => `${n} read the forest like an open book. The shifting paths couldn't fool the Ranger — ${pr.sub} spotted the true trail through the illusions, marking trees as ${pr.sub} went. The enchantment parted before ${pr.obj} like a curtain.`,
      (n, pr) => `The forest twisted and writhed, but ${n}'s Ranger instincts cut through the chaos. ${pr.Sub} tracked animal prints, noted moss patterns, and led the way without hesitation. "Nature doesn't lie."`,
    ],
    knight: [
      (n, pr) => `${n} marched straight through the enchanted forest with sword raised. The illusions flickered and parted — not from skill, but from sheer determination. "I walk forward. That's my strategy."`,
      (n, pr) => `The Knight pressed on, hacking through phantom vines. ${n}'s armor rattled with every step. Subtle? No. Effective? Somehow, yes.`,
    ],
    mage: [
      (n, pr) => `${n} waved ${pr.posAdj} staff and the illusions dissolved into sparkling dust. "Parlor tricks." The Mage saw the true forest — and every trap laid within it.`,
      (n, pr) => `The Mage's eyes glowed as ${n} deciphered the enchantment's logic. "The path loops every seven steps unless you step left at the third stone." Nobody questioned the math.`,
    ],
    rogue: [
      (n, pr) => `${n} hugged the shadows, avoiding every trap and illusion by simply not being where they expected. The Rogue doesn't follow paths — ${pr.sub} makes ${pr.posAdj} own.`,
      (n, pr) => `While others stumbled through the front entrance, ${n} found a side trail hidden behind a waterfall. "Shortcuts aren't cheating. They're intelligence."`,
    ],
    bard: [
      (n, pr) => `${n} hummed a melody and the forest calmed. Trees straightened, illusions faded, and even the enchanted creatures stopped to listen. "Music soothes the savage enchantment."`,
      (n, pr) => `The Bard sang to the forest, and the forest sang back. ${n} followed the harmony through the maze, ${pr.posAdj} voice the only compass ${pr.sub} needed.`,
    ],
    barbarian: [
      (n, pr) => `${n} didn't navigate the enchanted forest. ${n} DESTROYED it. Phantom trees? Smashed. Illusory walls? Punched. "I can't be lost if nothing is standing."`,
      (n, pr) => `The Barbarian charged through the forest roaring. The enchantment tried to redirect ${n}, but ${pr.sub} ran through every illusion like it wasn't there. Because to ${pr.obj}, it wasn't.`,
    ],
  },
  'forest-riddle': {
    mage: [
      (n, pr) => `The Riddle Gate hummed with arcane energy. ${n} studied the inscription, cross-referenced two ancient languages, and spoke the answer before anyone else finished reading. The gate swung open. "Elementary."`,
      (n, pr) => `${n} pressed ${pr.posAdj} palm against the Riddle Gate and felt the answer through the stonework. "The question is the answer." The gate shattered. The Mage doesn't ask — ${pr.sub} knows.`,
    ],
    knight: [
      (n, pr) => `${n} stared at the riddle. Stared harder. Then drew ${pr.posAdj} sword and smashed the gate's hinges off. "There. Solved." The gate fell open. Not elegant, but effective.`,
    ],
    rogue: [
      (n, pr) => `While everyone puzzled over the riddle, ${n} noticed a loose stone beside the gate. A side passage. "Why solve a puzzle when you can go around it?"`,
    ],
    bard: [
      (n, pr) => `${n} didn't solve the riddle — ${pr.sub} charmed the gate. A serenade, a few flattering words about its excellent craftsmanship, and the enchanted door blushed open. "Everything responds to kindness."`,
    ],
    barbarian: [
      (n, pr) => `${n} headbutted the Riddle Gate. It cracked. ${pr.Sub} headbutted it again. It crumbled. "What riddle?" The Barbarian's solution to everything.`,
    ],
    ranger: [
      (n, pr) => `${n} found vines growing through a crack above the gate and scaled the wall entirely. "Don't need to solve it if you go over it."`,
    ],
  },
  'forest-ambush': {
    knight: [
      (n, pr) => `Enchanted wolves burst from the undergrowth! ${n} drew ${pr.posAdj} sword in one fluid motion and stood firm. Slash. Parry. Counter. The Knight's training took over. "Come and get it!"`,
      (n, pr) => `The creature ambush caught everyone off guard — except ${n}. The Knight had been waiting for this. Sword singing, armor ringing, ${pr.sub} carved through the enchanted beasts with disciplined fury.`,
    ],
    _default: [
      (n, pr, cls) => `${n} fought back against the enchanted creatures with everything ${pr.sub} had, ${pr.posAdj} ${CLASSES[cls]?.label || 'class'} training pushed to its limits.`,
      (n, pr, cls) => `The ambush was brutal. ${n} scrambled, dodged, and fought — relying on ${pr.posAdj} ${cls === 'barbarian' ? 'raw strength' : cls === 'rogue' ? 'agility' : cls === 'mage' ? 'arcane shields' : cls === 'ranger' ? 'quick reflexes' : cls === 'bard' ? 'desperate melody' : 'skills'} to survive.`,
    ],
  },
  // Phase 2: Troll Bridge
  'bridge-negotiate': {
    bard: [
      (n, pr) => `Chef the Troll blocked the bridge, arms folded. "NOBODY CROSSES!" ${n} stepped forward, lute in hand, and played a lullaby so beautiful that Chef's eyes welled with tears. "That... that was the song my mama used to sing." He stepped aside, sniffling.`,
      (n, pr) => `${n} bowed before Chef the Troll. "Great guardian of the bridge, surely one of your immense wisdom and culinary genius wouldn't deny humble travelers?" Chef blinked. "...Culinary genius?" He stood a little taller. "Go ahead."`,
    ],
    knight: [
      (n, pr) => `${n} challenged Chef the Troll to an honor duel. "If I win, we pass!" Chef cracked ${pronouns(n).posAdj === 'his' ? 'his' : 'his'} knuckles. "Nobody beats Chef!" The Knight's blade met the Troll's ladle. CLANG.`,
    ],
    rogue: [
      (n, pr) => `${n} distracted Chef with a fake gold coin. "Look, a tip!" While the Troll scrambled, the Rogue slipped past. "Works every time."`,
    ],
    barbarian: [
      (n, pr) => `${n} shoulder-checked Chef the Troll clean off the bridge. SPLASH. "Was that a troll? I thought it was a speed bump."`,
    ],
    mage: [
      (n, pr) => `${n} cast an illusion of a five-star restaurant across the river. Chef abandoned the bridge instantly. "FINALLY! A kitchen worthy of CHEF!" The Mage watched him go. "Too easy."`,
    ],
    ranger: [
      (n, pr) => `${n} found a rope bridge hidden upstream. Why negotiate with the troll when you can bypass the troll entirely? The Ranger always has a second path.`,
    ],
  },
  'bridge-blindfold': {
    rogue: [
      (n, pr) => `Blindfolded on a swaying bridge with a troll throwing apples? ${n} peeked. Obviously. The Rogue's blindfold had a convenient gap. Every apple dodged, every step sure. "I don't cheat. I adapt."`,
      (n, pr) => `${n} "accidentally" loosened ${pr.posAdj} blindfold three steps in. Could see everything. Every incoming apple, every loose plank. "What? It slipped." The Rogue doesn't play fair. The Rogue plays smart.`,
    ],
    _default: [
      (n, pr, cls) => `Blindfolded on the bridge, ${n} relied on ${cls === 'ranger' ? 'trained ears catching every creak' : cls === 'barbarian' ? 'brute stubbornness, tanking every apple hit' : cls === 'knight' ? 'steady footwork and armor blocking the impacts' : cls === 'mage' ? 'mental mapping of the bridge layout' : cls === 'bard' ? 'listening to the rhythm of the trolls throws' : 'instinct'} to cross.`,
    ],
  },
  'bridge-endure': {
    barbarian: [
      (n, pr) => `Chef the Troll raged. Boulders flew. The bridge shook. ${n} planted ${pr.posAdj} feet, flexed, and ROARED back. The Barbarian does not break. The Barbarian does not bend. The bridge might collapse, but ${n} would be the last one standing on the rubble.`,
      (n, pr) => `The Troll's wrath was legendary. Most would run. ${n} walked INTO it. Every hit absorbed. Every blow endured. "Is that all you've got?" The Barbarian grinned through the pain.`,
    ],
    _default: [
      (n, pr, cls) => `The Troll's fury tested every fiber of ${n}'s resolve. ${pr.Sub} held on, ${cls === 'knight' ? 'shield raised against the onslaught' : cls === 'rogue' ? 'weaving between the worst of it' : cls === 'mage' ? 'maintaining a wavering shield spell' : cls === 'ranger' ? 'using the railing for cover' : cls === 'bard' ? 'singing through gritted teeth' : 'enduring through willpower alone'}.`,
    ],
  },
  // Phase 3: Dragon's Lair
  'dragon-sneak': {
    rogue: [
      (n, pr) => `${n} moved through the Dragon's lair like smoke — silent, formless, invisible. The treasure-piled cavern couldn't betray a footstep that never happened. The Rogue was born for this moment.`,
      (n, pr) => `Every shadow was a highway for ${n}. The Dragon's eyes scanned the cavern but the Rogue was already past, silent as death, grinning in the dark. "This is what I do."`,
    ],
    knight: [
      (n, pr) => `${n}'s armor clanked with every step. CLANK. CLANK. CLANK. The Dragon's ear twitched. The Knight froze. "...Please don't wake up." CLANK. The Dragon's eye opened.`,
    ],
    barbarian: [
      (n, pr) => `${n} tried to sneak. The Barbarian's version of sneaking involved slightly quieter footsteps and breathing that was merely loud instead of thunderous. The Dragon stirred.`,
    ],
    _default: [
      (n, pr, cls) => `${n} crept through the Dragon's lair, ${cls === 'mage' ? 'muffling sound with a dampening spell' : cls === 'ranger' ? 'stepping only on the soft sand between treasure piles' : cls === 'bard' ? 'humming a sleep charm under breath' : 'moving as carefully as possible'}.`,
    ],
  },
  'dragon-fight': {
    barbarian: [
      (n, pr) => `The Dragon ROARED. Fire filled the cavern. ${n} ROARED BACK. The Barbarian charged straight at the beast, axe high, fear absent. "I'VE BEEN WAITING FOR THIS!" The collision shook the mountain.`,
      (n, pr) => `${n} caught the Dragon's claw mid-swing. Muscles screaming. Ground cracking. The Barbarian held. "You're big. I'm ANGRY. Let's see which matters more."`,
    ],
    _default: [
      (n, pr, cls) => `The Dragon attacked with fury! ${n} ${cls === 'knight' ? 'met the beast head-on, sword flashing against scale and claw' : cls === 'rogue' ? 'dodged and slashed at vulnerable joints' : cls === 'mage' ? 'hurled arcane bolts at the creature\'s eyes' : cls === 'ranger' ? 'peppered the beast with arrows from a distance' : cls === 'bard' ? 'wove a dissonant chord that made the Dragon flinch' : 'fought with everything left'}.`,
    ],
  },
  'dragon-weakness': {
    mage: [
      (n, pr) => `${n}'s eyes locked onto a hairline crack in the Dragon's chest scale — the one weakness. "THERE!" ${pr.Sub} channeled every ounce of arcane energy into a single focused strike. The Dragon SCREAMED. The Mage found what no one else could see.`,
      (n, pr) => `The Mage saw the pattern. The Dragon always protected its left side. Overcompensation. Which meant the RIGHT side was the weakness. ${n} pointed. "Strike there." The Dragon fell.`,
    ],
    _default: [
      (n, pr, cls) => `${n} searched desperately for the Dragon's weakness, ${cls === 'knight' ? 'testing every joint with sword strikes' : cls === 'rogue' ? 'analyzing the beast\'s movement for blind spots' : cls === 'ranger' ? 'reading the creature\'s body language' : cls === 'barbarian' ? 'hitting everything until something worked' : cls === 'bard' ? 'noting which notes made the Dragon flinch' : 'relying on intuition'}.`,
    ],
  },
  // Phase 4: Tower Rescue
  'tower-climb': {
    ranger: [
      (n, pr) => `${n} scaled the tower like a spider. Hand over hand, finding holds in the ancient stonework that nobody else could see. The wind howled. The height was dizzying. The Ranger didn't look down. The Ranger never looks down.`,
      (n, pr) => `The tower wall was sheer and the wind was cruel, but ${n} climbed as naturally as breathing. Fingers found impossible grips. Feet found invisible ledges. "The mountain taught me this."`,
    ],
    _default: [
      (n, pr, cls) => `${n} began the tower climb, ${cls === 'knight' ? 'armor weighing heavy but determination heavier' : cls === 'barbarian' ? 'punching handholds into the stone itself' : cls === 'rogue' ? 'finding every crack and crevice with practiced fingers' : cls === 'mage' ? 'levitating stone platforms as stepping stones' : cls === 'bard' ? 'singing to steady nerves against the vertigo' : 'climbing with everything left'}.`,
    ],
  },
  'tower-defenses': {
    knight: [
      (n, pr) => `Guards blocked the tower stairway. ${n} didn't slow down. Sword met spear met shield met fury. The Knight carved through the defenses like they were made of parchment. "I didn't come this far to be stopped by GUARDS."`,
      (n, pr) => `The enchanted gate slammed shut. The Knight slammed harder. ${n}'s blade cleaved through lock, chain, and bar in three precise strikes. "OPEN."`,
    ],
    _default: [
      (n, pr, cls) => `Tower defenses activated! ${n} ${cls === 'barbarian' ? 'smashed through the barricade like it personally offended ${pr.obj}' : cls === 'rogue' ? 'slipped through a gap that shouldn\'t have been wide enough' : cls === 'mage' ? 'dispelled the enchanted barriers with a wave' : cls === 'ranger' ? 'shot the lock mechanism from across the room' : cls === 'bard' ? 'convinced the enchanted door it wanted to be open' : 'pushed through with sheer effort'}.`,
    ],
  },
  'tower-push': {
    bard: [
      (n, pr) => `${n}'s voice echoed through the tower like thunder wrapped in velvet. "WE DID NOT COME THIS FAR TO FALL!" The remaining knights felt strength surge through exhausted limbs. The Bard's rally cry could move mountains — and it moved them one final push toward the top.`,
      (n, pr) => `The final stretch. Everyone was broken. Exhausted. Done. Then ${n} began to sing. Not a battle cry — a lullaby of hope. Of stories unfinished. "This is not where your tale ends." Legs moved. Hearts beat. The Bard's power isn't magic. It's belief.`,
    ],
    _default: [
      (n, pr, cls) => `The final push to the top! ${n} summoned every last reserve of ${cls === 'knight' ? 'courage and steel' : cls === 'barbarian' ? 'furious, primal energy' : cls === 'rogue' ? 'cunning and desperation' : cls === 'mage' ? 'arcane willpower' : cls === 'ranger' ? 'endurance and grit' : 'determination'}.`,
    ],
  },
};

// ── ELIMINATION TEXT ──
const ELIMINATION_TEXT = {
  'forest-ambush': [
    (n, pr) => `Enchanted vines erupted from the earth and coiled around ${n}! ${pr.Sub} struggled, slashed, but the forest had chosen its victim. ${n} was dragged into the undergrowth. Cursed. Eliminated.`,
    (n, pr) => `The enchanted wolves circled ${n}. Too many. Too fast. A howl, a flash of fangs, and the ${CLASSES[n._ppClass]?.label || 'adventurer'} was swept away in a tide of phantom fur. The forest claims another.`,
  ],
  'bridge-endure': [
    (n, pr) => `The Troll's final blow sent ${n} sailing off the bridge! ${pr.Sub} caught the railing, hung for one heartbeat... and fell. SPLASH. The river carried ${pr.obj} away. The bridge shows no mercy.`,
    (n, pr) => `${n} couldn't hold on. The Troll's wrath was too much. ${pr.Sub} was knocked clean off the bridge, tumbling into the dark waters below. Gone. The quest continues without ${pr.obj}.`,
  ],
  'dragon-weakness': [
    (n, pr) => `The Dragon's tail swept ${n} off the ledge! ${pr.Sub} hit the cavern wall and crumpled. Burned, battered, and beaten. The Dragon claims its toll.`,
    (n, pr) => `Dragonfire engulfed ${n}'s position! When the smoke cleared, the ${CLASSES[n._ppClass]?.label || 'adventurer'} was down, singed but alive. ${pr.Sub} wouldn't continue. The lair is sealed.`,
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
      return { type: 'allianceOath', players: [a, b],
        text: `${a} and ${b} crossed ${clsA?.label === 'Knight' ? 'swords' : clsA?.label === 'Mage' ? 'staffs' : 'weapons'} beneath the ancient oak. "Until the tower falls." An oath sworn in fairy tale fashion — unbreakable until someone breaks it.`,
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
      return { type: 'rivalryDeclare', players: [a, b],
        text: `${a} locked eyes with ${b} across the campfire. "When this quest is over, you and I are going to have words." ${b}'s hand moved to ${pronouns(b).posAdj} weapon. "I look forward to it." The flames danced between them.`,
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
      return { type: 'showmanceMoment', players: [sm.a, sm.b],
        text: `${sm.a} found ${sm.b} by the enchanted stream. "Are you hurt?" "Better now." They sat beneath the willows, the quest forgotten for one quiet moment. In every fairy tale, there's a love story hiding in the margins.`,
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
      return { type: 'rogueScheme', players: [rogue, target],
        text: `${rogue} whispered to the shadows. A plan formed. ${target}'s equipment was sabotaged — a frayed strap here, a dulled blade there. The Rogue's smile in the firelight was cold as winter. "In fairy tales, the clever ones survive."`,
        badgeText: 'SABOTAGE', badgeClass: 'red' };
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
      return { type: 'princessFavor', players: [royalName, target],
        text: `${royalTitle} ${royalName} dropped a silk ribbon from the royal balcony. It fluttered down to ${target}, who caught it instinctively. ${royalName}: "A token of favor. Don't read too much into it." Everyone read too much into it.`,
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
      return { type: 'heroSpeech', players: [p, ...allies],
        text: `${p} stood on a fallen log, moonlight catching ${pronouns(p).posAdj} armor. "We started this quest as strangers. We end it as something more. Whatever waits in that tower, we face it TOGETHER." ${allies.length ? `${allies.join(' and ')} raised their weapons in salute.` : 'The silence that followed was reverent.'}`,
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
      return { type: 'villainScheme', players: [v],
        text: `${v} sat apart from the group, tracing patterns in the dirt by firelight. ${pronouns(v).Sub} was calculating. Always calculating. "They think this quest is about courage. It's about knowing when to let someone else take the hit." A slow smile. Fairy tales have villains for a reason.`,
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
        text = `${royalTitle} ${royalName} watched from the tower with narrowed eyes. "They're all so desperate to prove themselves. It's... useful." ${pr.Sub} mentally ranked each knight's weaknesses. The throne room is the best vantage point for scheming.`;
      } else if (gs.showmances?.some(s => (s.a === royalName || s.b === royalName))) {
        const sm = gs.showmances.find(s => (s.a === royalName || s.b === royalName));
        const partner = sm.a === royalName ? sm.b : sm.a;
        text = `${royalTitle} ${royalName} leaned against the tower window. ${pr.Sub} was watching the quest, yes. But ${pr.posAdj} eyes kept drifting to ${partner}. "Be careful down there." Whispered. Nobody heard. That was the point.`;
      } else {
        const texts = [
          `${royalTitle} ${royalName} paced the tower, watching the battles below through an enchanted mirror. "This is harder than fighting. Watching and choosing." The crown felt heavier with every decision.`,
          `${royalTitle} ${royalName} gripped the balcony railing. "${pr.Sub === 'She' ? 'She' : 'He'} survived. Good." A pause. "I need them strong for what comes next." The ${royalTitle.toLowerCase()} was already planning the endgame.`,
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
    ],
    knightWins: [
      (r, k, rt) => `${rt} ${r} struck first — a slashing blow that should have ended it. But ${k} had survived four phases of hell. ${pronouns(k).Sub} CAUGHT the blade. "You'll have to do better than that, Your Highness."`,
      (r, k, rt) => `The betrayal stung, but ${k} had been preparing for this. Every fairy tale has a twist. The Knight parried the ${rt.toLowerCase()}'s opening strike and countered with controlled fury.`,
    ],
  },
  clash: {
    royalWins: [
      (r, k, rt) => `${rt} ${r} hadn't fought in four grueling phases. ${r} was FRESH. ${k} was battered, bruised, running on fumes. The ${rt.toLowerCase()} exploited every wound, every limp, every moment of hesitation. "I watched every fight. I know every weakness." Intel is the deadliest weapon.`,
      (r, k, rt) => `Steel met steel in the tower's highest chamber. ${k}'s arms shook with exhaustion. ${r}'s were steady. "You fought bravely down there," ${r} admitted. "But bravery doesn't beat strategy."`,
    ],
    knightWins: [
      (r, k, rt) => `${k} was exhausted. Beaten. Running on nothing but willpower. But willpower is what Knights are MADE of. ${pronouns(k).Sub} pushed through the fatigue and drove ${r} back step by step. "You watched from above. I LIVED it. There's a difference."`,
      (r, k, rt) => `${r} knew every weakness — but ${k} had been forged by those weaknesses. Every wound was a lesson. The Knight's endurance trumped the ${rt.toLowerCase()}'s intelligence.`,
    ],
  },
  finish: {
    royalWins: [
      (r, k, rt) => `In the end, the crown won. ${rt} ${r} feinted left, struck right, and sent ${k}'s weapon clattering across the stone floor. ${r} pressed ${pronouns(r).posAdj} blade to ${k}'s throat. "Checkmate." The kingdom was never in danger. The ${rt.toLowerCase()} was the danger all along.`,
      (r, k, rt) => `${r} ended it with elegance — a perfect disarm, a sweeping flourish, and a blade at ${k}'s neck. ${k} sank to one knee. Not in defeat, but in respect. "Well played, Your Highness." The ${rt.toLowerCase()} removed the sword. "You fought well, Knight. Better than I expected."`,
    ],
    knightWins: [
      (r, k, rt) => `${k} SURGED. One final, desperate, magnificent strike. ${r}'s blade went flying. The Knight stood over the ${rt.toLowerCase()}, sword raised, breathing hard. "I earned this." ${r} looked up from the floor. For the first time, genuine surprise. Then a smile. "Yes. You did."`,
      (r, k, rt) => `The fairy tale ending — but not the one anyone expected. ${k} caught ${r}'s blade between two hands, twisted, and disarmed royalty itself. The crown rolled across the floor. ${k} picked it up. "I'll be taking this."`,
    ],
  },
  showmanceHesitation: [
    (a, b) => `Their eyes met. For one heartbeat, neither could swing. The memory of every quiet moment, every stolen glance, every whispered word at camp — it all surged up. ${a}'s blade trembled. ${b}'s grip loosened. Love makes terrible warriors.`,
    (a, b) => `"I can't..." ${a} whispered. ${b}'s weapon dipped. They stood there, in the wreckage of the fairy tale, unable to fight the person they'd been protecting. Then both attacked at once — because the game demands it. Even love has limits.`,
  ],
  showmanceSurge: [
    (winner) => `But something broke through the hesitation — not anger, not strategy, but RESOLVE. ${winner} whispered, "Forgive me." And struck with everything. The boldest move in the fairy tale.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// ADVANTAGE TEXT
// ══════════════════════════════════════════════════════════════
const ADVANTAGE_TEXT = {
  sword: [
    (royal, recipient, rt) => `${rt} ${royal} raised the Enchanted Sword — it gleamed with golden light. "This blade carries my blessing. Use it wisely." ${royal} descended from the tower and placed it in ${recipient}'s hands. The crowd gasped. Power shifted. ${recipient} felt the magic pulse through the steel. "I won't let you down."`,
    (royal, recipient, rt) => `The Enchanted Sword chose its wielder — or rather, ${rt} ${royal} chose FOR it. "${recipient}." The name echoed across the battlefield. ${recipient} accepted the blade. It felt lighter than air and sharper than truth. "For the quest."`,
  ],
  armor: [
    (royal, recipient, rt) => `${rt} ${royal} bestowed the Golden Armor upon ${recipient}. Plates of enchanted gold materialized, wrapping around the knight like a second skin. "This armor has protected royalty for a thousand years." ${recipient} stood taller. Stronger. Ready for the final battle.`,
    (royal, recipient, rt) => `Golden light poured from ${rt} ${royal}'s hands as the Golden Armor took shape around ${recipient}. Every plate was perfect. Every joint, divine. "You've earned this." ${recipient}: "I'll wear it with honor."`,
  ],
  save: [
    (royal, saved, rt) => `"WAIT!" ${rt} ${royal}'s voice rang from the tower. "I invoke my Royal Save!" Golden light descended, wrapping around ${saved}'s fallen form. The curse shattered. ${saved} rose — battered but alive. "Your ${rt.toLowerCase()} commands you RISE." And rise ${saved} did.`,
    (royal, saved, rt) => `${rt} ${royal} threw the crystal pendant from the tower. It shattered on impact, releasing a wave of golden magic. ${saved}'s eyes snapped open. The wounds closed. "You're not done yet," ${royal} called down. "The fairy tale isn't over until I SAY it's over."`,
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

function _getBeatText(name, cls, beatKey) {
  const pr = pronouns(name);
  const beatTexts = BEAT_TEXT[beatKey];
  if (!beatTexts) return `${name} pushed through the challenge.`;
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

function _simulatePhase(phaseId, phaseLabel, beats, alive, classMap, result, ep, campKey, fatigue) {
  const phase = { id: phaseId, label: phaseLabel, beats: [], eliminated: [], events: [] };
  for (const beat of beats) {
    const scores = {};
    const texts = {};
    for (const name of alive) {
      scores[name] = _scoreBeat(name, classMap[name], beat.key, result.swordHolder, result.armorHolder, fatigue);
      texts[name] = _getBeatText(name, classMap[name], beat.key);
      // Fatigue from each beat
      fatigue[name] = (fatigue[name] || 0) - 0.3;
    }
    // Rank
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const beatResult = { key: beat.key, label: beat.label, ranked: ranked.map(([n, s]) => ({ name: n, score: s, text: texts[n], cls: classMap[n] })), eliminated: [] };

    // Accumulate chalMemberScores
    ranked.forEach(([n, s], idx) => {
      ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + Math.max(1, alive.length - idx);
    });

    // Eliminate bottom 1-2 on elimination beats
    if (beat.eliminates) {
      const elimCount = alive.length <= 4 ? 1 : (alive.length <= 6 ? (Math.random() < 0.5 ? 1 : 2) : 2);
      for (let i = 0; i < elimCount && alive.length > 2; i++) {
        const victim = ranked[ranked.length - 1 - i]?.[0];
        if (!victim) break;
        // Check if royal saves
        if (result.royalSaveAvailable && !result.royalSaveUsed && Math.random() < 0.35) {
          result.royalSaveUsed = true;
          result.royalSavedPlayer = victim;
          result.royalSaveBeat = beat.key;
          const saveText = pick(ADVANTAGE_TEXT.save)(result.royalName, victim, result.royalTitle);
          beatResult.save = { player: victim, text: saveText };
          popDelta(result.royalName, 1);
          popDelta(victim, 1);
          addBond(result.royalName, victim, 2);
          ep.campEvents[campKey].post.push({
            text: `${result.royalTitle} ${result.royalName} used the Royal Save on ${victim}!`,
            players: [result.royalName, victim],
            badgeText: 'ROYAL SAVE!', badgeClass: 'green', tag: 'princess-pride',
          });
          continue;
        }
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
      }
    }
    phase.beats.push(beatResult);
  }
  // Between-phase social events
  const socialCount = 1 + Math.floor(Math.random() * 2);
  const events = _generateSocialEvents(alive, classMap, socialCount, result.royalName, result.royalTitle);
  phase.events = events;
  for (const ev of events) {
    ep.campEvents[campKey].post.push({ ...ev, tag: 'princess-pride' });
  }
  return phase;
}

function _simulateDuel(royalName, knightName, result, ep, campKey, fatigue) {
  const rs = pStats(royalName);
  const ks = pStats(knightName);
  const rPr = pronouns(royalName);
  const kPr = pronouns(knightName);
  const rt = result.royalTitle;
  const isShowmance = gs.showmances?.some(s =>
    (s.a === royalName && s.b === knightName) || (s.a === knightName && s.b === royalName));

  let royalMomentum = 0;
  const exchanges = [];

  // Beat 1: The Shock — Knight: boldness + physical. Royal: social + strategic
  const kBeat1 = ks.boldness * 0.5 + ks.physical * 0.4 + (fatigue[knightName] || 0) + noise(2);
  const rBeat1 = rs.social * 0.5 + rs.strategic * 0.4 + noise(2);
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

  // Beat 2: The Clash — Knight: physical + endurance. Royal: mental + intuition (intel bonus)
  const kBeat2 = ks.physical * 0.5 + ks.endurance * 0.4 + (fatigue[knightName] || 0) + noise(2);
  const intelBonus = rs.intuition * 0.3; // watched every fight
  const rBeat2 = rs.mental * 0.5 + rs.intuition * 0.4 + intelBonus + noise(2);
  // Golden Armor bonus for knight
  const armorBonus = result.armorHolder === knightName ? 2 : 0;
  const kBeat2Final = kBeat2 + armorBonus;
  const beat2Winner = rBeat2 >= kBeat2Final ? royalName : knightName;
  const beat2Shift = Math.abs(rBeat2 - kBeat2Final) > 2 ? 3 : Math.abs(rBeat2 - kBeat2Final) > 1 ? 2 : 1;
  royalMomentum += (beat2Winner === royalName ? beat2Shift : -beat2Shift);
  const beat2Texts = beat2Winner === royalName ? DUEL_TEXT.clash.royalWins : DUEL_TEXT.clash.knightWins;
  exchanges.push({ name: 'The Clash', winner: beat2Winner, shift: beat2Shift,
    text: pick(beat2Texts)(royalName, knightName, rt) });

  // Beat 3: The Finish — Knight: strategic + boldness. Royal: boldness + social
  const kBeat3 = ks.strategic * 0.5 + ks.boldness * 0.4 + (fatigue[knightName] || 0) + armorBonus * 0.5 + noise(3);
  const rBeat3 = rs.boldness * 0.5 + rs.social * 0.4 + noise(3);
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

  // After Phase 4: Give Golden Armor to the top knight
  if (alive.length >= 1) {
    // Top scorer from tower push
    const towerPush = phase4.beats.find(b => b.key === 'tower-push');
    const topKnight = towerPush?.ranked[0]?.name || alive[0];
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
  const duelistKnight = alive[0] || knights[0];
  const duel = _simulateDuel(royalName, duelistKnight, result, ep, campKey, fatigue);
  result.duel = duel;
  result.immunityWinner = duel.winner;

  popDelta(duel.winner, 3);
  popDelta(duel.loser, 1);
  addBond(royalName, duelistKnight, duel.narrow ? -1 : -2);

  ep.campEvents[campKey].post.push({
    text: `${duel.winner} won the final duel and claimed immunity in The Princess Pride!`,
    players: [duel.winner],
    badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'princess-pride',
  });

  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, 'princessPride', _romActive, ep.chalMemberScores || {}, 'fairy tale quest');
    }
  }
  _checkShowmanceChalMoment(ep, 'princessPride', _romActive, ep.chalMemberScores || {}, 'quest', _romActive);

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
    ep.chalMemberScores[duel.winner] = (ep.chalMemberScores[duel.winner] || 0) + active.length + 5;
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
  .pp-panel-royal{background:linear-gradient(180deg,rgba(234,179,8,0.15),rgba(234,179,8,0.05));
    border-color:var(--royal-gold);box-shadow:0 0 15px rgba(234,179,8,0.2)}
  .pp-panel-elim{background:linear-gradient(180deg,#1f1f1f,#2d2d2d);border-color:#666;
    color:#ddd}
  .pp-panel-save{background:linear-gradient(180deg,#fef3c7,#fff);border-color:var(--royal-gold);
    box-shadow:0 0 25px rgba(234,179,8,0.5);animation:pp-save-glow 1.5s ease-in-out infinite alternate}
  @keyframes pp-save-glow{0%{box-shadow:0 0 15px rgba(234,179,8,0.3)}100%{box-shadow:0 0 30px rgba(234,179,8,0.6)}}

  /* ═══ TYPOGRAPHY ═══ */
  .pp-title{font-family:'Cinzel',serif;font-weight:700;font-size:36px;color:var(--royal-gold);
    text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.4);line-height:1.2;letter-spacing:2px}
  .pp-subtitle{font-family:'Cinzel',serif;font-weight:400;font-size:14px;color:rgba(255,255,255,0.7);
    text-align:center;letter-spacing:4px;text-transform:uppercase}
  .pp-narration{font-family:'Lora',serif;font-size:15px;line-height:1.7;color:var(--dark-text);
    padding:6px 0}
  .pp-royal-quote{font-family:'Dancing Script',cursive;font-size:18px;font-weight:700;
    color:var(--royal-purple);font-style:italic;padding:8px 14px;
    border-left:3px solid var(--royal-gold);margin:8px 0}
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
  </style>`;
}

function _ppShell(content, ep) {
  const lanterns = Array.from({ length: 8 }, (_, i) => {
    const left = 5 + Math.random() * 90;
    const top = 5 + Math.random() * 85;
    return `<div class="pp-lantern" style="left:${left}%;top:${top}%"></div>`;
  }).join('');
  return `${css()}<div class="pp-shell">${lanterns}${content}</div>`;
}

function _buildSidebar(pp, phaseFilter) {
  let sb = '';
  sb += `<div class="pp-side-sec">ROYALTY</div>`;
  sb += `<div class="pp-side-player">
    ${portrait(pp.royalName, 22)}
    <span style="font-weight:700;color:var(--royal-gold)">${ROYAL.icon} ${pp.royalTitle} ${pp.royalName}</span>
  </div>`;

  sb += `<div class="pp-side-sec">QUEST KNIGHTS</div>`;
  for (const ca of pp.classAssignments) {
    const cls = CLASSES[ca.cls];
    const isElim = pp.eliminationOrder.includes(ca.name);
    sb += `<div class="pp-side-player ${isElim ? 'pp-side-elim' : ''}">
      ${portrait(ca.name, 22)}
      <span>${ca.name}</span>
      <span class="pp-side-class">${cls?.icon || ''} ${cls?.label || ''}</span>
    </div>`;
  }

  if (pp.swordHolder) {
    sb += `<div class="pp-side-sec">ADVANTAGES</div>`;
    sb += `<div style="font-size:11px;padding:2px 0">⚔️ Enchanted Sword: <b>${pp.swordHolder}</b></div>`;
    if (pp.armorHolder) sb += `<div style="font-size:11px;padding:2px 0">🛡️ Golden Armor: <b>${pp.armorHolder}</b></div>`;
    if (pp.royalSaveUsed) sb += `<div style="font-size:11px;padding:2px 0">👑 Royal Save: <b>${pp.royalSavedPlayer}</b></div>`;
    else sb += `<div style="font-size:11px;padding:2px 0;color:var(--royal-gold)">👑 Royal Save: Available</div>`;
  }

  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP — SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildPrincessPrideTitleCard(ep) {
  const pp = ep.princessPride;
  if (!pp) return '';

  const badges = pp.classAssignments.map(ca => {
    const cls = CLASSES[ca.cls];
    return `<div class="pp-cover-badge" style="border-color:${cls?.color || '#888'}">
      <img src="assets/avatars/${slug(ca.name)}.png" alt="${ca.name}" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display='none'">
      <div class="pp-cover-badge-name">${ca.name.split(' ').pop()}</div>
    </div>`;
  }).join('');

  const royalBadge = `<div class="pp-cover-badge" style="border-color:${ROYAL.color}">
    <img src="assets/avatars/${slug(pp.royalName)}.png" alt="${pp.royalName}" style="width:44px;height:44px;object-fit:contain" onerror="this.style.display='none'">
    <div class="pp-cover-badge-name">${ROYAL.icon} ${pp.royalTitle}</div>
  </div>`;

  return _ppShell(`
    <div class="pp-cover">
      <div class="pp-subtitle">TOTAL DRAMA PRESENTS</div>
      <div class="pp-title" style="margin:12px 0">THE<br>PRINCESS PRIDE</div>
      <div class="pp-subtitle">A ${host().toUpperCase()} PRODUCTION</div>
      <div class="pp-caption" style="margin-top:16px;color:rgba(255,255,255,0.7);font-size:14px">
        GLASS SLIPPER &middot; ENCHANTED FOREST &middot; TROLL BRIDGE &middot; DRAGON'S LAIR &middot; TOWER RESCUE
      </div>
      <div style="margin-top:12px;font-family:'Dancing Script',cursive;font-size:18px;color:rgba(255,255,255,0.85)">
        "Every fairy tale has a twist. This one has a sword fight."
      </div>
      <div style="margin-top:16px">${royalBadge}</div>
      <div class="pp-cover-roster">${badges}</div>
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
          <div class="pp-hero-name" style="color:${cls?.color || '#333'}">${cls?.icon || ''} ${ca.name}</div>
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
      <div class="pp-sidebar">${_buildSidebar(pp)}</div>
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
    // Beat header
    steps.push(`<div class="pp-panel ${panelClass}">
      <div class="pp-beat-title">${beat.label}</div>
      ${beat.ranked.slice(0, Math.min(6, beat.ranked.length)).map((r, i) => {
        const cls = CLASSES[r.cls];
        return `<div class="pp-rank">
          <div class="pp-rank-pos">${i + 1}</div>
          ${portrait(r.name, 28)}
          <div class="pp-rank-name">${r.name} <span class="pp-class-badge" style="background:${cls?.color || '#888'}22;color:${cls?.color || '#333'};border:1px solid ${cls?.color || '#888'}44;font-size:9px">${cls?.icon || ''} ${cls?.label || ''}</span></div>
          <div class="pp-rank-score">${r.score.toFixed(1)}</div>
        </div>`;
      }).join('')}
    </div>`);

    // Narration for top players
    const topNarrations = beat.ranked.slice(0, 3);
    for (const r of topNarrations) {
      steps.push(`<div class="pp-panel ${panelClass}" style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(r.name, 32)}
          <span class="pp-class-badge" style="background:${CLASSES[r.cls]?.color || '#888'}22;color:${CLASSES[r.cls]?.color || '#333'};border:1px solid ${CLASSES[r.cls]?.color || '#888'}44">${CLASSES[r.cls]?.icon || ''} ${CLASSES[r.cls]?.label || ''}</span>
          <span style="font-family:'Cinzel',serif;font-weight:700;font-size:13px">${r.name}</span>
        </div>
        <div class="pp-narration">${r.text}</div>
      </div>`);
    }

    // Eliminations
    for (const elim of beat.eliminated) {
      steps.push(`<div class="pp-panel pp-panel-elim">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(elim.name, 32)}
          <span style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:#ff6b6b">ELIMINATED</span>
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
  }

  // Social events
  for (const ev of phase.events) {
    const evClass = ev.badgeClass === 'green' ? 'pp-event-green' : ev.badgeClass === 'red' ? 'pp-event-red' : 'pp-event-amber';
    steps.push(`<div class="pp-event ${evClass}">
      <span class="pp-event-badge">${ev.badgeText || ev.type}</span>
      ${ev.text}
    </div>`);
  }

  // Advantage given after phase 2 (sword) or phase 4 (armor)
  if (phaseIdx === 1 && pp.swordGiven.recipient) {
    steps.push(`<div class="pp-panel pp-panel-royal">
      <div class="pp-phase-title">⚔️ The Enchanted Sword</div>
      <div class="pp-narration">${pp.swordGiven.text}</div>
    </div>`);
  }
  if (phaseIdx === 3 && pp.armorGiven.recipient) {
    steps.push(`<div class="pp-panel pp-panel-royal">
      <div class="pp-phase-title">🛡️ The Golden Armor</div>
      <div class="pp-narration">${pp.armorGiven.text}</div>
    </div>`);
  }

  const total = steps.length;
  const suffix = phase.id;
  const stepsHtml = steps.map((html, i) =>
    `<div id="pp-step-${suffix}-${i}" style="${i > revIdx ? 'display:none' : ''}">${html}</div>`
  ).join('');

  const aliveCount = pp.classAssignments.length - pp.eliminationOrder.slice(0, pp.phases.slice(0, phaseIdx + 1).flatMap(p => p.eliminated).length).length;

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
      <div class="pp-sidebar" id="pp-sidebar-${suffix}">${_buildSidebar(pp)}</div>
    </div>
  `, ep);
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

  // Duel intro — the betrayal reveal
  steps.push(`<div class="pp-panel pp-panel-duel">
    <div class="pp-phase-title">⚔️ The Betrayal Duel</div>
    <div class="pp-narration" style="text-align:center;font-size:16px">
      The top knight reaches the tower summit. ${pp.royalTitle} ${pp.royalName} waits.
      But this is no rescue. This is a <b>duel for immunity</b>.
    </div>
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
      <div class="pp-sidebar">${_buildSidebar(pp)}</div>
    </div>
  `, ep);
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

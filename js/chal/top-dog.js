// js/chal/top-dog.js — Top Dog animal buddy challenge (post-merge)
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
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (nice.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// ANIMAL POOL
// ══════════════════════════════════════════════════════════════
export const ANIMALS = [
  { id: 'hamster', name: 'Hamster', danger: 1, temperament: 'skittish', stats: ['social', 'mental'], icon: '🐹' },
  { id: 'parrot', name: 'Parrot', danger: 1, temperament: 'cunning', stats: ['mental', 'intuition'], icon: '🦜' },
  { id: 'raccoon', name: 'Raccoon', danger: 2, temperament: 'clever', stats: ['strategic', 'intuition'], icon: '🦝' },
  { id: 'chameleon', name: 'Chameleon', danger: 2, temperament: 'lazy', stats: ['endurance', 'mental'], icon: '🦎' },
  { id: 'monkey', name: 'Monkey', danger: 3, temperament: 'playful', stats: ['boldness', 'social'], icon: '🐒' },
  { id: 'goat', name: 'Goat', danger: 3, temperament: 'stubborn', stats: ['physical', 'endurance'], icon: '🐐' },
  { id: 'wolf', name: 'Wolf', danger: 3, temperament: 'loyal', stats: ['loyalty', 'boldness'], icon: '🐺' },
  { id: 'eagle', name: 'Eagle', danger: 4, temperament: 'proud', stats: ['strategic', 'boldness'], icon: '🦅' },
  { id: 'alligator', name: 'Alligator', danger: 4, temperament: 'aggressive', stats: ['physical', 'boldness'], icon: '🐊' },
  { id: 'bear', name: 'Bear', danger: 4, temperament: 'lazy', stats: ['endurance', 'physical'], icon: '🐻' },
  { id: 'shark', name: 'Shark', danger: 5, temperament: 'aggressive', stats: ['boldness', 'physical'], icon: '🦈' },
  { id: 'moose', name: 'Moose', danger: 5, temperament: 'stubborn', stats: ['physical', 'endurance'], icon: '🫎' },
];

// ══════════════════════════════════════════════════════════════
// COMPATIBILITY
// ══════════════════════════════════════════════════════════════
function _calcCompatibility(name, animal) {
  const s = pStats(name);
  const base = (s[animal.stats[0]] + s[animal.stats[1]]) * 0.5;
  let bonus = 0;
  const a = arch(name);

  // archetype bonuses
  if (['villain', 'mastermind', 'schemer'].includes(a) && ['aggressive', 'cunning'].includes(animal.temperament)) bonus += 2;
  if (a === 'hero' && ['loyal', 'playful'].includes(animal.temperament)) bonus += 2;
  if (a === 'social-butterfly') bonus += 1;
  if (a === 'goat' && animal.danger >= 4) bonus -= 2;
  if (a === 'challenge-beast' && animal.stats.includes('physical')) bonus += 1;
  if (a === 'loyal-soldier' && animal.temperament === 'loyal') bonus += 1.5;
  if (a === 'chaos-agent' && animal.temperament === 'playful') bonus += 1;
  if (a === 'wildcard') bonus += noise(2); // extra variance
  if (a === 'underdog' && animal.danger <= 2) bonus += 1;
  if (a === 'showmancer' && ['skittish', 'playful'].includes(animal.temperament)) bonus += 1;

  return Math.max(0, Math.min(10, base + bonus + noise(3)));
}

// ══════════════════════════════════════════════════════════════
// ANIMAL ASSIGNMENT
// ══════════════════════════════════════════════════════════════
function _assignAnimals(active) {
  // Shuffle animal pool, pick enough for players
  const pool = [...ANIMALS].sort(() => Math.random() - 0.5);
  const available = pool.slice(0, Math.max(active.length, pool.length));
  const assignments = [];

  // Priority draft — higher social+boldness picks first (crowd appeal)
  const draftOrder = [...active].sort((a, b) => {
    const aS = pStats(a), bS = pStats(b);
    return (bS.social + bS.boldness) - (aS.social + aS.boldness) + noise(3);
  });

  const taken = new Set();
  for (const name of draftOrder) {
    // Player picks animal with best compatibility from remaining
    const choices = available.filter(a => !taken.has(a.id));
    if (choices.length === 0) break;
    const scored = choices.map(animal => ({
      animal,
      compat: _calcCompatibility(name, animal),
    })).sort((a, b) => b.compat - a.compat);

    // Top pick with some randomness — sometimes pick 2nd best
    const idx = Math.random() < 0.75 ? 0 : Math.min(1, scored.length - 1);
    const chosen = scored[idx];
    taken.add(chosen.animal.id);

    assignments.push({
      player: name,
      animal: chosen.animal,
      compatibility: chosen.compat,
      reactionText: _assignReaction(name, chosen.animal, chosen.compat),
    });
  }

  return assignments;
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — ASSIGNMENT REACTIONS
// ══════════════════════════════════════════════════════════════
export const ASSIGN_REACTION = {
  highCompat: {
    skittish: [
      (p, a, pr) => `${p} kneels down gently and extends a hand. The ${a.name} sniffs cautiously... then nuzzles ${pr.posAdj} palm. ${p}: "Oh. Oh, we're gonna be FRIENDS."`,
      (p, a, pr) => `The ${a.name} trembles for a moment, then scrambles up ${p}'s arm and nestles in ${pr.posAdj} hood. ${host()}: "That was... adorable." ${p}: "I've been chosen."`,
      (p, a, pr) => `${p} whispers softly to the ${a.name}. It calms immediately. ${pr.Sub} has a gift. The other players stare, impressed.`,
      (p, a, pr) => `The ${a.name} takes one look at ${p} and relaxes completely. Instant trust. ${p}: "Animals know good people." ${host()}: "Debatable."`,
    ],
    cunning: [
      (p, a, pr) => `${p} locks eyes with the ${a.name}. It tilts its head. ${p} tilts ${pr.posAdj} head. They're already scheming together. ${host()}: "I don't like this."`,
      (p, a, pr) => `The ${a.name} cocks its head sideways and squawks something. ${p} nods like ${pr.sub} understood it. Maybe ${pr.sub} did. These two are dangerous.`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} takes it, then steals another from ${p}'s pocket. ${p} laughs. "I respect the hustle."`,
      (p, a, pr) => `The ${a.name} immediately starts mimicking ${p}'s gestures. Two tricksters in perfect sync. Everyone else is worried.`,
    ],
    clever: [
      (p, a, pr) => `${p} sets up a simple puzzle. The ${a.name} solves it in three seconds. ${p}: "Oh, you're SMART smart." The ${a.name} washes its hands smugly.`,
      (p, a, pr) => `The ${a.name} looks at ${p}, then at the treat, then at the locked box. It picks the lock. ${p}: "I LOVE this animal." ${host()}: "That was... concerning."`,
      (p, a, pr) => `${p} and the ${a.name} size each other up. Mutual recognition. Two strategists who see the board the same way. This team is going far.`,
      (p, a, pr) => `The ${a.name} unzips ${p}'s backpack, rummages through it, and brings back exactly the treat ${p} was looking for. ${p}: "You're hired."`,
    ],
    lazy: [
      (p, a, pr) => `${p} sits down next to the ${a.name}. It doesn't move. ${p} doesn't move. They vibe in silence for thirty seconds. ${host()}: "Is... is that bonding?" It is.`,
      (p, a, pr) => `The ${a.name} yawns. ${p} yawns. They're already synchronized. Low-energy powerhouse. Chef: "They're perfect for each other."`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} doesn't bother getting up — just opens its mouth expectantly. ${p} hand-delivers it. "We have an understanding."`,
      (p, a, pr) => `${p} scratches the ${a.name}'s chin. It melts into a puddle of contentment. ${p}: "Same, buddy. Same."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} LAUNCHES itself at ${p}. ${p} catches it — barely. It immediately starts grooming ${pr.posAdj} hair. ${p}: "Okay! Okay, we're doing this!"`,
      (p, a, pr) => `${p} tosses a ball. The ${a.name} catches it, throws it back. ${p} catches it. They've invented a game in three seconds flat. ${host()}: "This is sickeningly cute."`,
      (p, a, pr) => `The ${a.name} steals ${p}'s hat and runs a lap. ${p} chases it, laughing. The other castmates can't help but smile. These two are a match.`,
      (p, a, pr) => `${p} makes a face. The ${a.name} makes a face back. ${p} dances. It dances. They're in their own world. ${host()} is forgotten.`,
    ],
    stubborn: [
      (p, a, pr) => `${p} tries to lead the ${a.name}. It doesn't move. ${p} pulls harder. Nothing. Then ${p} stops pulling and starts asking nicely. The ${a.name} follows. ${p}: "Noted."`,
      (p, a, pr) => `The ${a.name} butts ${p}'s leg — hard. ${p} butts it back — gently. Mutual respect established through headbutt protocol. ${host()}: "That's one way to bond."`,
      (p, a, pr) => `${p} and the ${a.name} have a staring contest. ${p} blinks first. The ${a.name} snorts victoriously. ${p}: "Fine. You're the boss."`,
      (p, a, pr) => `The ${a.name} plants its feet and refuses to acknowledge ${p}. ${p} sits down and waits. After five minutes, it walks over on its own terms. Stubborn respects patient.`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} walks straight to ${p} and sits at ${pr.posAdj} feet. No hesitation. Chosen. ${p}: "...Did it just pick ME?" ${host()}: "Looks like it."`,
      (p, a, pr) => `${p} kneels. The ${a.name} puts its head in ${pr.posAdj} hands. The bond is instant. ${p}'s eyes go soft. "I won't let you down."`,
      (p, a, pr) => `The ${a.name} follows ${p} around the clearing, staying exactly two steps behind. Loyal from moment one. The other animals aren't this trusting.`,
      (p, a, pr) => `${p} extends a hand. The ${a.name} licks it, then presses its forehead against ${pr.posAdj} palm. Silent oath. ${host()}: "I'm not crying, YOU'RE crying." Chef: "I'm crying."`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} spreads its wings / strikes a pose. ${p} strikes a matching pose. Two alphas acknowledging each other. ${host()}: "The ego in this clearing is SUFFOCATING."`,
      (p, a, pr) => `${p} doesn't approach the ${a.name}. ${pr.Sub} waits. The ${a.name} circles once, twice, then lands beside ${pr.obj}. Royalty recognizes royalty.`,
      (p, a, pr) => `The ${a.name} looks down at ${p} imperiously. ${p} looks up with equal confidence. "We're going to win this." The ${a.name} preens. Agreement.`,
      (p, a, pr) => `${p} bows slightly. The ${a.name}'s eyes sharpen — respect is the correct currency. It steps forward. Partnership accepted.`,
    ],
    aggressive: [
      (p, a, pr) => `The ${a.name} SNARLS at everyone — except ${p}. ${p} walks right up to it. "Easy. I'm on your side." It stops snarling. ${host()}: "How are you NOT dead?!"`,
      (p, a, pr) => `${p} feeds the ${a.name} raw meat. It devours it and looks at ${p} with what might be gratitude. Or hunger. Hard to tell. But they've bonded.`,
      (p, a, pr) => `The ${a.name} lunges. ${p} doesn't flinch. They lock eyes. The ${a.name} backs off. First time it's backed down all day. ${p}: "We understand each other."`,
      (p, a, pr) => `${p} scratches the ${a.name} behind the ears. It rumbles dangerously — then leans into it. A killer with a soft spot. ${p} found it.`,
    ],
  },
  lowCompat: {
    skittish: [
      (p, a, pr) => `${p} reaches for the ${a.name}. It BOLTS. Up a tree. Into a bush. Under a rock. ${p}: "Come back!" It does not come back. ${host()}: "That's going well."`,
      (p, a, pr) => `The ${a.name} takes one look at ${p} and hides in a bucket. ${p} tips the bucket. It hides in a SMALLER bucket. ${host()}: "There's a metaphor here."`,
      (p, a, pr) => `Every time ${p} moves, the ${a.name} flinches. ${p} breathes too loud. It flinches again. This is going to be a LONG challenge.`,
      (p, a, pr) => `${p}: "Come here, little buddy." The ${a.name} screams. Just... screams. ${p}: "I haven't even touched you." More screaming. ${host()} winces.`,
    ],
    cunning: [
      (p, a, pr) => `The ${a.name} steals ${p}'s shoes. Both of them. While ${p} is looking right at it. ${p}: "How?! I was WATCHING!" ${host()}: "It's smarter than you."`,
      (p, a, pr) => `${p} tries to bribe the ${a.name} with treats. It takes the treats AND the bag. And ${p}'s hat. And walks away. ${p} has been robbed.`,
      (p, a, pr) => `The ${a.name} mimics ${p}'s voice mockingly. The other castmates laugh. ${p} does NOT laugh. This animal is ${pr.posAdj} nemesis now.`,
      (p, a, pr) => `${p} sets up a training obstacle. The ${a.name} dismantles it for parts. Uses the parts to build a nest. Falls asleep in the nest. ${p}: "I can't even be mad."`,
    ],
    clever: [
      (p, a, pr) => `The ${a.name} solves the puzzle box before ${p} even explains the rules. Then looks at ${p} with palpable disappointment. ${host()}: "Your animal thinks you're dumb."`,
      (p, a, pr) => `${p} gives a command. The ${a.name} does the opposite. Perfectly. It understood — it just disagrees. ${p}: "You're doing this on PURPOSE."`,
      (p, a, pr) => `The ${a.name} opens the treat jar, eats half, closes it, and pushes it back. It maintains eye contact with ${p} the entire time. Power move.`,
      (p, a, pr) => `${p} tries hand signals. The ${a.name} watches patiently, then walks the OTHER direction. ${p}: "That was clearly 'come here!'" It was. The ${a.name} knows.`,
    ],
    lazy: [
      (p, a, pr) => `${p}: "Okay, let's train!" The ${a.name} is asleep. ${p} pokes it. Still asleep. ${p} claps. Dead asleep. ${p}: "It's literally UNCONSCIOUS." ${host()}: "Same energy."`,
      (p, a, pr) => `The ${a.name} refuses to stand up. ${p} tries treats, threats, music. Nothing. It opens one eye, judges ${p}, and closes it again. Devastating.`,
      (p, a, pr) => `${p} carries the ${a.name} to the training area. It goes limp. Complete dead weight. ${p}: "Work with me here!" It yawns. It will not work with ${p}.`,
      (p, a, pr) => `The ${a.name} lies across the training obstacle and falls asleep ON it. ${p} can't even use the equipment now. ${host()}: "That's a strategy."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} thinks everything is a game. EVERYTHING. ${p} gives a command — it does a backflip instead. ${p}: "That's impressive but NOT what I asked."`,
      (p, a, pr) => `${p} tries to be serious. The ${a.name} pulls ${pr.posAdj} shoelaces. ${p} tries again. It pulls the OTHER shoelace. ${p}: "STOP HAVING FUN."`,
      (p, a, pr) => `The ${a.name} plays keep-away with the training baton. ${p} chases it for three full minutes. The other castmates are in tears laughing. ${p} is NOT amused.`,
      (p, a, pr) => `${p} demonstrates a trick. The ${a.name} demonstrates a DIFFERENT trick. Its trick is better. ${p} is being upstaged by an animal. ${host()}: "Whose challenge is this?"`,
    ],
    stubborn: [
      (p, a, pr) => `The ${a.name} will not move. Not for treats. Not for praise. Not for threats. ${p} pushes it. It pushes BACK. ${p} falls over. ${host()}: "The ${a.name} wins round one."`,
      (p, a, pr) => `${p}: "SIT." It stands. "STAND." It sits. "COME." It leaves. This animal is fluent in spite. ${p}: "I'm being trolled by a ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} headbutts ${p}'s knee. ${p}: "OW." It headbutts the other knee. ${p}: "WHY." It looks satisfied. Dominance established. Not in ${p}'s favor.`,
      (p, a, pr) => `${p} tries a different approach. Calm. Gentle. Patient. The ${a.name} eats ${pr.posAdj} training notes. Chews slowly. Maintains eye contact. ${p}: "Message received."`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} looks at ${p}. Looks at the next person. Looks back at ${p}. Walks to the next person. ${p}: "Did I just get REJECTED by a ${a.name.toLowerCase()}?"`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} sniffs it suspiciously. Sniffs ${p}. Does not approve. Sits with its back to ${p}. ${host()}: "That's harsh."`,
      (p, a, pr) => `The ${a.name} follows someone ELSE around instead of ${p}. ${p} tugs the leash gently. It sighs. It comes. It radiates disappointment. ${p}: "You wound me."`,
      (p, a, pr) => `${p} tries to pet the ${a.name}. It tolerates it the way one tolerates a dentist visit. Eyes elsewhere. Counting the seconds. ${p}: "I feel so loved."`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} looks at ${p} and is visibly unimpressed. It turns away. ${p}: "What did I DO?" Nothing. That's the problem. Royalty expects tribute.`,
      (p, a, pr) => `${p} approaches the ${a.name} too casually. It recoils. A peasant dared to approach without bowing. ${p} is confused. The ${a.name} is offended. ${host()}: "You blew it."`,
      (p, a, pr) => `The ${a.name} accepts ${p}'s offering — then drops it on the ground. Not good enough. ${p} tries again. Dropped again. ${p}: "What DO you want?!" It wants BETTER.`,
      (p, a, pr) => `${p} makes a sudden move. The ${a.name} spreads its wings/raises up to full height. ${p} backs away. "Okay. Okay. YOU'RE in charge. Got it."`,
    ],
    aggressive: [
      (p, a, pr) => `The ${a.name} HISSES at ${p}. ${p} jumps back. ${host()}: "Maybe don't make eye contact." ${p} looks away. It hisses again. ${p}: "WHAT DID I DO?!"`,
      (p, a, pr) => `${p} approaches carefully. The ${a.name} snaps. ${p}'s sleeve is torn. ${p}: "That was my FAVORITE shirt!" It lunges again. ${p} runs. ${host()}: "This is GREAT TV."`,
      (p, a, pr) => `The ${a.name} growls every time ${p} breathes. ${p} holds ${pr.posAdj} breath. Still growls. ${p}: "You just hate me." It does. It really, really does.`,
      (p, a, pr) => `${p} tries the "alpha stance." The ${a.name} responds with actual aggression. ${p} abandons the alpha stance. ${p}: "I am NOT the alpha. Message received."`,
    ],
  },
};

function _assignReaction(name, animal, compat) {
  const pr = pronouns(name);
  const pool = compat >= 5.5
    ? (ASSIGN_REACTION.highCompat[animal.temperament] || ASSIGN_REACTION.highCompat.playful)
    : (ASSIGN_REACTION.lowCompat[animal.temperament] || ASSIGN_REACTION.lowCompat.stubborn);
  return pick(pool)(name, animal, pr);
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — TRAINING
// ══════════════════════════════════════════════════════════════
export const TRAINING_TEXT = {
  success: {
    skittish: [
      (p, a, pr) => `${p} coaxes the ${a.name} through the trick with infinite patience. It works! The ${a.name} peeks out from behind ${pr.posAdj} leg, proud of itself.`,
      (p, a, pr) => `Gentle whispers from ${p}. The ${a.name}'s ears perk up. It does the trick — shaking slightly, but perfectly. ${p}: "That's my brave baby."`,
      (p, a, pr) => `${p} builds a tiny obstacle course out of treats. The ${a.name} follows the trail nervously and completes the trick. Progress!`,
      (p, a, pr) => `The ${a.name} finally trusts ${p} enough to perform without flinching. It's a small miracle. ${p} tears up a little. "I'm not crying."`,
    ],
    cunning: [
      (p, a, pr) => `${p} and the ${a.name} work out a system of blinks and nods. The trick goes flawlessly. These two share a brain cell. A devious brain cell.`,
      (p, a, pr) => `The ${a.name} invents a shortcut for the trick that ${p} didn't teach. It works BETTER than the original plan. ${p}: "I'm learning from YOU at this point."`,
      (p, a, pr) => `${p} signals. The ${a.name} executes. Crisp. Clean. Like they've rehearsed for years, not minutes. ${host()}: "That's unsettlingly smooth."`,
      (p, a, pr) => `The ${a.name} watches ${p}'s demonstration once. Repeats it perfectly. ${p}: "Did you just... learn that in one try?" It did. Show-off.`,
    ],
    clever: [
      (p, a, pr) => `${p} shows the trick once. The ${a.name} does it twice — forward AND backward. ${host()}: "Your animal is smarter than you." ${p}: "I know. I KNOW."`,
      (p, a, pr) => `The ${a.name} figures out the trick by watching OTHER animals fail first. Pure analytical genius. ${p} just points and it performs.`,
      (p, a, pr) => `${p}: "Okay, so you go left, then—" The ${a.name} is already done. ${p}: "How did you... I didn't even finish the sentence."`,
      (p, a, pr) => `Patient repetition pays off. The ${a.name} nails the trick, then adds a flourish ${p} never taught. Overachiever.`,
    ],
    lazy: [
      (p, a, pr) => `${p} waits. And waits. The ${a.name} finally decides it's worth the effort. Does the trick in the most energy-efficient way possible. Still counts!`,
      (p, a, pr) => `The ${a.name} performs the trick lying down. ${host()}: "Is that... allowed?" ${p}: "It got the result!" Technically correct. The best kind of correct.`,
      (p, a, pr) => `${p} uses the one motivator that works: a nap afterwards. The ${a.name} does the trick at speed, then immediately falls asleep. Contract fulfilled.`,
      (p, a, pr) => `After much persuasion, the ${a.name} does one perfect rep. ONE. Then looks at ${p} like "we're done, right?" ${p}: "...Sure. We're done."`,
    ],
    playful: [
      (p, a, pr) => `${p} turns the trick into a game. The ${a.name} LOVES games. It does the trick five times in a row, each time more dramatic than the last.`,
      (p, a, pr) => `The ${a.name} nails the trick then does a victory dance. ${p} joins in. Training has devolved into a dance party. But the trick was learned, so... success?`,
      (p, a, pr) => `${p} and the ${a.name} high-five. Actually HIGH-FIVE. ${host()}: "Did that ${a.name.toLowerCase()} just..." It did. It absolutely did.`,
      (p, a, pr) => `The ${a.name} does the trick mid-backflip. Show-off. ${p} applauds wildly. "DO IT AGAIN!" It does. With a spin this time.`,
    ],
    stubborn: [
      (p, a, pr) => `${p} finally finds the right tone of voice. Firm but respectful. The ${a.name} considers the command... and obeys. ${p}: "THANK you."`,
      (p, a, pr) => `Breakthrough! The ${a.name} and ${p} reach an agreement. The trick is performed on the ${a.name}'s terms, but it's performed. Stubbornness channeled into discipline.`,
      (p, a, pr) => `${p} earns it the hard way. Twenty failed attempts. But attempt twenty-one is PERFECT. The ${a.name} snorts, almost impressed. Almost.`,
      (p, a, pr) => `${p} stops giving orders and starts making requests. The ${a.name} respects the shift. Does the trick. Once. On its own timeline. That's the deal.`,
    ],
    loyal: [
      (p, a, pr) => `${p} asks once. The ${a.name} does it. No hesitation. No argument. Loyalty is a stat and this animal has it maxed. ${p}: "Good ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} watches ${p}'s face for the slightest cue. A nod. The trick is done before ${p} finishes the command. Wordless trust.`,
      (p, a, pr) => `${p} and the ${a.name} are in sync. Command, execute, treat. Repeat. It's beautiful in its simplicity. ${host()}: "They make it look easy."`,
      (p, a, pr) => `The ${a.name} nails the trick AND guards ${p}'s bag while doing it. Multi-tasking loyalty. ${p}: "You're the best partner I've ever had."`,
    ],
    proud: [
      (p, a, pr) => `${p} presents the trick as a challenge worthy of the ${a.name}'s dignity. It accepts. Executes with FLAIR. Because of course it does. Royalty doesn't do things halfway.`,
      (p, a, pr) => `The ${a.name} performs the trick like it invented the trick. Head high. Movements precise. ${p} is just the handler. The ${a.name} is the STAR.`,
      (p, a, pr) => `${p} frames every command as a suggestion. The ${a.name} graciously accepts. The trick is performed magnificently. On the ${a.name}'s own timeline.`,
      (p, a, pr) => `Applause. The ${a.name} needs applause. ${p} claps. The ${a.name} does the trick and poses afterward. ${host()}: "That ${a.name.toLowerCase()} wants an agent."`,
    ],
    aggressive: [
      (p, a, pr) => `${p} channels the ${a.name}'s aggression into the trick. SLAM. CRASH. The trick is done. Destructively. But done. ${host()}: "That's... one way to do it."`,
      (p, a, pr) => `The ${a.name} does the trick while growling. The entire time. Every second. But it DOES the trick. Fear is a motivator for everyone watching.`,
      (p, a, pr) => `${p} earns the ${a.name}'s respect through sheer stubbornness. The trick is performed with raw power. Not elegant. Terrifying. But effective.`,
      (p, a, pr) => `Meat-based bribery. The ${a.name} does the trick, gets a chunk of raw steak, does it again. ${p} is running out of steak. But the training is working.`,
    ],
  },
  failure: {
    skittish: [
      (p, a, pr) => `${p} claps to get the ${a.name}'s attention. It PANICS. Runs. Hides. Training set back by ten minutes. ${p}: "I clapped. I JUST clapped."`,
      (p, a, pr) => `A leaf falls. The ${a.name} flees. ${p} chases it for two minutes. Returns winded. The ${a.name} is back where it started. No progress.`,
      (p, a, pr) => `${p} moves too fast. The ${a.name}'s eyes go wide. It's frozen. Not fear — just absolute refusal to process this situation. ${p}: "I'm standing STILL now."`,
      (p, a, pr) => `The ${a.name} hides inside ${p}'s bag. ${p} can't train an animal that is INSIDE a bag. ${host()}: "Maybe try a different approach?" ${p}: "YOU try it."`,
    ],
    cunning: [
      (p, a, pr) => `${p} gives a command. The ${a.name} pretends to obey, then does something completely different. ${p} doesn't realize for thirty seconds. ${host()}: "You've been played."`,
      (p, a, pr) => `The ${a.name} distracts ${p} with cuteness, then steals ${pr.posAdj} training treats. All of them. ${p}: "WHERE DID THEY GO—" The ${a.name} burps.`,
      (p, a, pr) => `${p} sets up the trick. The ${a.name} dismantles it and builds something else. ${p}: "That's NOT what we're doing." The ${a.name} disagrees.`,
      (p, a, pr) => `${p} demonstrates. The ${a.name} watches carefully. Then teaches ITSELF a different trick. An objectively cooler trick. ${p}: "You're the worst."`,
    ],
    aggressive: [
      (p, a, pr) => `${p} extends a hand. The ${a.name} snaps at it. ${p} recoils. "OKAY. No touching. Got it." The ${a.name} snarls in agreement.`,
      (p, a, pr) => `The ${a.name} charges the training equipment and destroys it. ${p}: "That was the OBSTACLE. You were supposed to GO AROUND IT."`,
      (p, a, pr) => `${p} tries authority. The ${a.name} responds with teeth. ${p} tries gentleness. The ${a.name} responds with MORE teeth. ${p}: "Do you have... any other settings?"`,
      (p, a, pr) => `Training attempt #4. The ${a.name} knocks ${p} down. Again. ${p} from the ground: "I think we need couples therapy."`,
    ],
    lazy: [
      (p, a, pr) => `${p} prods the ${a.name}. It's asleep. Still asleep. ${p} plays music. Asleep. ${p} yells. One eye opens. Closes. ${p}: "I've lost to unconsciousness."`,
      (p, a, pr) => `The ${a.name} starts the trick. Gets halfway through. Decides it's too much effort. Lies down mid-trick. ${p}: "You were SO CLOSE."`,
      (p, a, pr) => `${p} tries to motivate the ${a.name} with treats. It eats the treat without moving. ${p} tries more treats. Same result. ${p} is being extorted.`,
      (p, a, pr) => `The ${a.name} rolls over — ${p} thinks it's doing the trick — but no, it's just finding a comfier sleeping position. ${p}: "I hate this."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} thinks the trick is a game of tag. Runs AWAY from ${p}. ${p} chases. The other players watch this circus unfold. ${host()}: "Entertainment gold."`,
      (p, a, pr) => `${p} gives a command. The ${a.name} does a somersault instead. Wrong trick, right enthusiasm. ${p}: "That's amazing but WRONG."`,
      (p, a, pr) => `The ${a.name} is having too much fun to focus. It bounces between stations, plays with other animals, steals a shoe. ${p}: "This isn't recess!"`,
      (p, a, pr) => `${p}: "Focus." The ${a.name} does a spin. "FOCUS." Another spin. "Please?" Three spins and a screech of joy. Focus is not available today.`,
    ],
    stubborn: [
      (p, a, pr) => `${p}: "Jump." The ${a.name}: *does not jump*. ${p}: "JUMP." *does not jump harder*. How can something not-jump HARDER? This animal found a way.`,
      (p, a, pr) => `The ${a.name} plants its feet. ${p} pushes. It doesn't budge. ${p} bribes. Nothing. ${p} threatens. It yawns. This animal has achieved enlightened defiance.`,
      (p, a, pr) => `${p} demonstrates the trick five times. The ${a.name} watches all five. Understands all five. Performs zero. ${p}: "You KNOW how. You just WON'T." Correct.`,
      (p, a, pr) => `The ${a.name} does the OPPOSITE of every command. Sit → stand. Come → go. Stay → leave. ${p}: "Is this a bit? Are you doing a BIT?"`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} looks at the trick. Looks at ${p}. The expression says "beneath me." It turns away. The trick remains undone. ${p}: "It's not BENEATH you, it's FOR you."`,
      (p, a, pr) => `${p} asks nicely. The ${a.name} doesn't acknowledge ${p}'s existence. ${p} asks again. A regal head-turn away. ${p}: "I'm being GHOSTED by a ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} does the trick — but only the parts it considers elegant. The rest? Below its station. ${p}: "You can't just skip the hard parts!"`,
      (p, a, pr) => `${p}'s approach is too casual. The ${a.name} is OFFENDED. It refuses to work until properly addressed. ${p} doesn't know the proper protocol. Impasse.`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} wants to please ${p}. It REALLY does. But it doesn't understand the command. It does something else — eagerly, loyally, WRONG.`,
      (p, a, pr) => `The ${a.name} follows ${p} instead of doing the trick. ${p} goes to the course. It follows. ${p} points at the course. It sits at ${pr.posAdj} feet. ${p}: "You're supposed to DO it, not WATCH me."`,
      (p, a, pr) => `Miscommunication. The ${a.name} does the trick from LAST round, not this one. It looks at ${p} hopefully. Wrong trick, but full heart. ${p}: "That's... close?"`,
      (p, a, pr) => `The ${a.name} keeps bringing ${p} sticks instead of performing. ${p}: "I appreciate the gifts but PLEASE do the trick." It brings another stick.`,
    ],
    clever: [
      (p, a, pr) => `The ${a.name} understands the trick. Does the math. Determines it's not worth the caloric expenditure. Sits down. ${p}: "I saw you CALCULATE that refusal."`,
      (p, a, pr) => `${p} gives the signal. The ${a.name} gives it back. The EXACT same signal. Mockingly. ${p}: "Are you making fun of me?" It is.`,
      (p, a, pr) => `The ${a.name} modifies the trick to be easier. ${p} doesn't notice until ${host()} points it out. "That ${a.name.toLowerCase()} cut two corners." ${p}: "...Clever girl."`,
      (p, a, pr) => `${p} tries to outsmart the ${a.name}. The ${a.name} outsmart-outsmarks ${p}. ${host()}: "You just got out-strategized by something with a brain the size of a walnut."`,
    ],
  },
  criticalFailure: [
    (p, a, pr) => `The ${a.name} breaks free and runs into the forest. ${p} chases. ${host()}: "Should we... help?" Chef: "No. This is hilarious." ${p} returns ten minutes later. Scratched. Muddy. Animal-less. The ${a.name} is already back at camp, eating Chef's lunch.`,
    (p, a, pr) => `The ${a.name} climbs onto the judge's table and refuses to come down. It eats Chef's sandwich. Chef: "THAT WAS MY SANDWICH!" ${host()}: "The ${a.name.toLowerCase()} has better taste than its trainer."`,
    (p, a, pr) => `Total meltdown. The ${a.name} panics and drags ${p} across the clearing by the leash. Three chairs broken. One table flipped. Chef's hat lost forever. ${host()}: "TEN out of ten for chaos."`,
    (p, a, pr) => `The ${a.name} does the trick — on the WRONG person. ${p} watches as ${pr.posAdj} animal performs perfectly for someone else. ${host()}: "That's actually... really good. For THEM." ${p}: "I'm going to cry."`,
    (p, a, pr) => `The ${a.name} and another animal start fighting. ${p} gets caught in the middle. Fur and feathers everywhere. ${host()}: "This is nature, folks. Beautiful, violent nature."`,
    (p, a, pr) => `The ${a.name} eats the entire bag of treats. ALL of them. Then looks at ${p} for more. ${p}: "Those were for the WHOLE CHALLENGE." The ${a.name} burps. No regrets.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — JUDGING
// ══════════════════════════════════════════════════════════════
export const JUDGING_TEXT = {
  performance: {
    standingOvation: [
      (p, a, pr) => `${p} and the ${a.name} are FLAWLESS. The trick lands perfectly. The ${a.name} poses. ${p} poses. The clearing erupts. ${host()} is on ${pronouns(host()).posAdj || 'his'} feet.`,
      (p, a, pr) => `Showstopper. The ${a.name} does things no animal should be able to do. ${p} commands with total confidence. The other teams look terrified.`,
      (p, a, pr) => `${p} and the ${a.name} perform in perfect sync — a routine that looks rehearsed for weeks, not hours. ${host()}: "That's the best thing I've ever seen on this show."`,
      (p, a, pr) => `The crowd goes WILD. Well, the other castmates go wild. The ${a.name} takes a bow. ${p} takes a bow. They bow TOGETHER. ${host()}: "I'm... actually moved."`,
    ],
    impressed: [
      (p, a, pr) => `Solid performance from ${p} and the ${a.name}. Not perfect — the dismount was shaky — but the chemistry carries it. ${host()} nods approvingly.`,
      (p, a, pr) => `${p} and the ${a.name} pull off the routine with minor wobbles. The ${a.name} improvises around ${p}'s mistakes, which is honestly more impressive.`,
      (p, a, pr) => `Clean work from team ${p}. The ${a.name} hits its marks, ${p} stays in control. Won't win any awards, but won't be going home because of it either.`,
      (p, a, pr) => `${p} recovers from a near-mishap with charm. The ${a.name} cooperates beautifully. ${host()}: "Good save. That could have been a disaster."`,
    ],
    meh: [
      (p, a, pr) => `${p} and the ${a.name} get through it. Barely. The ${a.name} does about half of what ${p} asks and freelances the rest. ${host()}: "That was... present."`,
      (p, a, pr) => `Middling performance. ${p} tries hard. The ${a.name} tries less hard. Together they produce something technically qualifying as a routine.`,
      (p, a, pr) => `Not bad, not good. The ${a.name} hits some marks, misses others. ${p}'s showmanship fills the gaps. ${host()}: "It's fine. It's... fine."`,
      (p, a, pr) => `${p} performs with conviction. The ${a.name} performs with apathy. The average is mediocrity. Chef shrugs. ${host()} makes a note.`,
    ],
    disaster: [
      (p, a, pr) => `${p} commands. The ${a.name} does something else entirely. The routine falls apart in real time. ${host()} winces. Chef looks away. The other teams smell blood.`,
      (p, a, pr) => `The ${a.name} stages a one-animal rebellion during the performance. ${p} tries to improvise. It's not going well. ${host()}: "This is... educational."`,
      (p, a, pr) => `${p}'s routine goes off the rails when the ${a.name} decides to take a nap mid-performance. ${p} tries to pretend it's part of the act. Nobody is fooled.`,
      (p, a, pr) => `Nothing works. The ${a.name} ignores every cue. ${p} tap-dances to fill time. It doesn't help. ${host()}: "Well... you tried. That counts for... something?"`,
    ],
    catastrophe: [
      (p, a, pr) => `The ${a.name} attacks the props, escapes the ring, steals Chef's hat, and returns wearing it. ${p} stands in the wreckage. ${host()}: "THAT was entertainment." ${p}: "My dignity is dead."`,
      (p, a, pr) => `It's a trainwreck. Beautiful, horrible, unforgettable. The ${a.name} runs amok. ${p} gives up and just narrates the chaos. "And there goes my animal. Into the woods. Goodbye."`,
      (p, a, pr) => `${p}'s performance is interrupted by the ${a.name} doing something unspeakable to ${host()}'s chair. ${host()}: "MY CHAIR!" ${p}: "I'm so sorry." The ${a.name} is not sorry.`,
      (p, a, pr) => `Total catastrophe. The ${a.name} flings things. ${p} dodges things. The audience scrambles. ${host()} hides behind Chef. Chef hides behind nobody. "I SHOULD HAVE STAYED IN THE KITCHEN!"`,
    ],
  },
  chrisComment: {
    standingOvation: [
      (p, a) => `${host()}: "9! Maybe even... NINE. Yeah, I'm going NINE. That ${a.name.toLowerCase()} is a STAR."`,
      (p, a) => `${host()}: "I'm giving this a 10. Don't tell the others. Actually, DO tell them. I want them scared."`,
      (p, a) => `${host()}: "NINE. That was absolutely incredible. I've never seen an animal do that. I've never seen a HUMAN do that."`,
      (p, a) => `${host()}: "Perfect 10. Yes, I said it. No, I won't take it back. FIGHT ME about it."`,
    ],
    impressed: [
      (p, a) => `${host()}: "Solid 7. Maybe 8 if I'm feeling generous. And I AM feeling generous, so... 8! Wait, no. 7."`,
      (p, a) => `${host()}: "That was GOOD. Not great. But good. I'll say... 8. The ${a.name.toLowerCase()} earned it."`,
      (p, a) => `${host()}: "7. Clean performance. I've seen better, but I've definitely seen worse. Looking at you, Chef."`,
      (p, a) => `${host()}: "I'll give you an 8. The ${a.name.toLowerCase()} carried you, but I won't tell anyone. ...I'll tell everyone."`,
    ],
    meh: [
      (p, a) => `${host()}: "5. Right down the middle. Like this performance. Which was... in the middle."`,
      (p, a) => `${host()}: "I'm gonna say... 6. It existed. It happened. I saw it. I'll forget it by dinner."`,
      (p, a) => `${host()}: "5. You tried. The ${a.name.toLowerCase()} tried less. Average it out: a 5. Math checks out."`,
      (p, a) => `${host()}: "Ehhh... 6? I've seen worse. Today. From other teams. But also this was not great."`,
    ],
    disaster: [
      (p, a) => `${host()}: "3. And that's being KIND. The ${a.name.toLowerCase()} looked bored. I was bored. Chef fell asleep."`,
      (p, a) => `${host()}: "A generous 4. The effort was there. The results were... not there. At all."`,
      (p, a) => `${host()}: "I'll say 3. Because I can't legally go lower. Can I? ...My lawyers are saying no."`,
      (p, a) => `${host()}: "4. And I'm being nice because I know the ${a.name.toLowerCase()} is watching. It looks angry."`,
    ],
    catastrophe: [
      (p, a) => `${host()}: "1. ONE. That was the worst thing I've ever seen. And I've seen EVERY season of this show."`,
      (p, a) => `${host()}: "2. And that's only because the ${a.name.toLowerCase()} stealing Chef's hat made me laugh. That's worth one bonus point."`,
      (p, a) => `${host()}: "1. Zero isn't a number I'm allowed to give. But I WANT to. So badly."`,
      (p, a) => `${host()}: "...2. I need to lie down. That physically hurt me to watch."`,
    ],
  },
  chefComment: {
    standingOvation: [
      (p, a) => `Chef: "Mon dieu. That was... beautiful. I give it a 9. Maybe even a 10. The ${a.name.toLowerCase()} has more talent than EVERY castmate combined."`,
      (p, a) => `Chef: "MAGNIFICO! 10! That ${a.name.toLowerCase()} is the best performer I've ever seen. Better than the humans. MUCH better than the humans."`,
      (p, a) => `Chef: "I... I have something in my eye. 9. That was genuinely moving. DON'T TELL ANYONE I SAID THAT."`,
      (p, a) => `Chef: "10. The ${a.name.toLowerCase()} deserves a MICHELIN STAR. Can animals get Michelin stars? I'm MAKING it happen."`,
    ],
    impressed: [
      (p, a) => `Chef: "7. Good technique. The ${a.name.toLowerCase()} has promise. You... less promise. But together? 7."`,
      (p, a) => `Chef: "I give 8. The ${a.name.toLowerCase()} remind me of my old cat, Monsieur Whiskers. He too was talented. Unlike his owner."`,
      (p, a) => `Chef: "Hmm. 7. Not bad. Not amazing. Like my Tuesday special. Reliable. Nobody complains. Nobody cheers."`,
      (p, a) => `Chef: "8! The ${a.name.toLowerCase()} has charisma. You riding the coattails, but... 8."`,
    ],
    meh: [
      (p, a) => `Chef: "5. That is what I give to lukewarm soup. It exists. It is soup. That is all."`,
      (p, a) => `Chef: "6. The ${a.name.toLowerCase()} tried harder than you. That's... not a compliment to either of you."`,
      (p, a) => `Chef: "5. I've seen better from PIGEONS. And I do NOT like pigeons. But they perform BETTER."`,
      (p, a) => `Chef: "Ehhhh... 6. My grandmother could do better and she is NINETY-THREE and does not have an animal."`,
    ],
    disaster: [
      (p, a) => `Chef: "3. That was PAINFUL. My eyes hurt. My SOUL hurts. The ${a.name.toLowerCase()} should fire you as a trainer."`,
      (p, a) => `Chef: "4. And I'm being GENEROUS because the ${a.name.toLowerCase()} is cute. YOU are not cute enough to save this."`,
      (p, a) => `Chef: "3. I have tasted expired milk with more charm than that performance. At least the milk was SURPRISING."`,
      (p, a) => `Chef: "4. That was worse than my ex-wife's cooking. And she once served me a shoe. A SHOE."`,
    ],
    catastrophe: [
      (p, a) => `Chef: "1. UN. UNO. ONE. I want to give ZERO. I want to give NEGATIVE numbers. That was CRIMINAL."`,
      (p, a) => `Chef: "2. Only because the ${a.name.toLowerCase()} destroyed my nemesis's chair. VENGEANCE tastes like a 2."`,
      (p, a) => `Chef: "1. I am OFFENDED. That was an INSULT to animals, to training, to PERFORMANCE, and to ME PERSONALLY."`,
      (p, a) => `Chef: "...1. I need to go lie down in the kitchen. The kitchen understands me. Unlike THIS PERFORMANCE."`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — FOREST RACE
// ══════════════════════════════════════════════════════════════
const FOREST_LENGTH = 14;

export const FOREST_TEXT = {
  movement: {
    fast: [
      (p, a, pr) => `${p} and the ${a.name} tear through the undergrowth. Branches snap, leaves fly. They're MOVING.`,
      (p, a, pr) => `The ${a.name} finds a rhythm and ${p} matches it. Stride for stride. They devour ground like it's personal.`,
      (p, a, pr) => `${p} hits ${pr.posAdj} stride. The ${a.name} keeps pace effortlessly. Trees blur past. They're making serious time.`,
      (p, a, pr) => `Explosive burst from ${p} and the ${a.name}. They blast through a clearing and gain serious ground. Nobody's catching them.`,
    ],
    medium: [
      (p, a, pr) => `${p} and the ${a.name} maintain a steady pace. Not blazing, not crawling. Smart racing.`,
      (p, a, pr) => `Consistent movement from team ${p}. The ${a.name} navigates while ${p} pushes forward. Good teamwork.`,
      (p, a, pr) => `${p} jogs through the forest with the ${a.name} trotting alongside. Measured pace. Saving energy for when it counts.`,
      (p, a, pr) => `The ${a.name} leads ${p} along a decent trail. Not the fastest route, but no wrong turns. Progress is progress.`,
    ],
    slow: [
      (p, a, pr) => `${p} and the ${a.name} struggle through dense brush. Every step is a battle. The forest is winning.`,
      (p, a, pr) => `The ${a.name} is not built for speed. Neither is ${p} today. They trudge forward with grim determination and minimal velocity.`,
      (p, a, pr) => `${p} stumbles. The ${a.name} waits. ${p} gets up. They move again. Slowly. Very, very slowly.`,
      (p, a, pr) => `Thick mud. The ${a.name} sinks. ${p} pulls. They extract themselves. Resume at approximately negative speed. ${host()}: "That's going... backwards? No. Forward. Barely."`,
    ],
  },
  navigation: {
    success: [
      (p, a, pr) => `Fork in the trail. The ${a.name} sniffs left, sniffs right, and heads left decisively. Five minutes later, a shortcut opens up. ${p}: "Trust the nose."`,
      (p, a, pr) => `${p} spots trail markers that others missed. ${pr.Sub} takes a narrow path through the trees — it cuts two segments off the route. Smart eyes.`,
      (p, a, pr) => `The ${a.name}'s instincts kick in. It veers off the main trail into what looks like nothing — but opens into a clear ridge path. ${p}: "How did you KNOW?"`,
      (p, a, pr) => `${p} reads the terrain like a map. Downhill means water means clearing means SPEED. ${pr.Sub} picks the right path without hesitation.`,
    ],
    failure: [
      (p, a, pr) => `${p} goes left. Should have gone right. The ${a.name} TRIED to tell ${pr.obj}. ${p}: "You could have been more clear!" It was very clear. ${p} didn't listen.`,
      (p, a, pr) => `Dead end. ${p} and the ${a.name} backtrack, losing precious time. The forest all looks the same. ${p}: "I swear we've passed that tree before."`,
      (p, a, pr) => `The ${a.name} leads ${p} into a ravine. Getting out takes longer than getting in. ${p}: "Navigation was YOUR job." The ${a.name} shrugs. Animals can't shrug. And yet.`,
      (p, a, pr) => `Wrong turn. Then another wrong turn. ${p} is now further from the exit than ten minutes ago. ${host()}'s drone footage catches ${pr.obj} walking in a circle. Twice.`,
      (p, a, pr) => `${p} follows what ${pr.sub} thinks is a game trail. It's a deer path to nowhere. The ${a.name} sits down in protest. ${p}: "Fine. YOUR way." The ${a.name} goes the exact opposite direction. Smart.`,
    ],
  },
  obstacle: {
    success: [
      (p, a, pr) => `Fallen tree blocks the path. ${p} vaults it. The ${a.name} goes under it. Both clear. No time lost. ${host()}: "Teamwork!"`,
      (p, a, pr) => `River crossing. ${p} finds stepping stones. The ${a.name} swims. They reconvene on the other side, barely slowed down.`,
      (p, a, pr) => `Steep embankment. ${p} climbs while the ${a.name} finds an alternate route around. They meet at the top. Smart division of labor.`,
      (p, a, pr) => `Mudslide blocks the trail. ${p} and the ${a.name} power through, emerging covered in mud but on the right side. ${p}: "That was GROSS but effective."`,
    ],
    failure: [
      (p, a, pr) => `River crossing goes wrong. ${p} slips on a rock and gets soaked. The ${a.name} watches from the dry bank, judging. ${p}: "A little HELP?!" It offers no help.`,
      (p, a, pr) => `Cliff face. ${p} tries to climb. Gets halfway up. Looks down. Gets back down. The ${a.name} was already going around. ${p} follows, having wasted a full minute.`,
      (p, a, pr) => `Fallen tree. ${p} tries to go over. Gets stuck. The ${a.name} goes under. ${p}: "I'm STUCK." The ${a.name} comes back. Stares. Leaves. ${p} eventually gets unstuck. Alone.`,
      (p, a, pr) => `Mudslide. ${p} sinks to ${pr.posAdj} knees. The ${a.name} sinks to... well, its entire body. ${p} pulls the ${a.name} out. Pulls ${pr.ref} out. Lost serious time.`,
    ],
  },
  trap: {
    success: [
      (p, a, pr) => `Net trap! The ${a.name} spots it first and freezes. ${p} follows its gaze — tripwire, three inches off the ground. They step over it carefully. Crisis averted.`,
      (p, a, pr) => `Pit trap covered by leaves. ${p}'s instincts scream "wrong" and ${pr.sub} stops just in time. The ${a.name} sniffs the edge. Yep. Would've been bad.`,
      (p, a, pr) => `${p} notices the trail looks TOO easy. ${pr.Sub} tests the ground ahead with a stick. Snare trigger. "Nice try, ${host()}." ${host()} via loudspeaker: "It was worth a shot."`,
      (p, a, pr) => `The ${a.name} refuses to go forward. ${p} trusts it. Goes around. Finds the buried net launcher. ${p}: "You saved us." Treat awarded. Treat deserved.`,
    ],
    failure: [
      (p, a, pr) => `NET! ${p} and the ${a.name} are caught mid-stride. Tangled. Helpless. It takes two full minutes to untangle. ${host()}: "Those traps are EXPENSIVE, by the way."`,
      (p, a, pr) => `${p} steps on a trigger plate. WHOOSH. Launched into a bush by a spring trap. The ${a.name} watches, untrapped, unimpressed. ${host()}: "GOTCHA!"`,
      (p, a, pr) => `Pit trap. ${p} falls in. It's only three feet deep but the indignity is ENORMOUS. The ${a.name} peers down from above. ${p}: "Don't just STARE."`,
      (p, a, pr) => `Snare grabs ${p}'s ankle. ${pr.Sub} hangs upside down from a tree for forty-five seconds while the ${a.name} presumably contemplates helping. It does not help. ${p}: "SOME partner."`,
    ],
  },
  animalMoment: {
    hamster: [
      (p, a, pr) => `The Hamster finds a tiny hole in a log and zips through — a shortcut ${p} could NEVER fit through. ${p} meets it on the other side. ${p}: "Did you just... teleport?"`,
      (p, a, pr) => `The Hamster stuffs its cheeks with berries mid-race. ${p}: "This is NOT the time for snacking." The Hamster disagrees. The Hamster is always snacking.`,
    ],
    parrot: [
      (p, a, pr) => `The Parrot flies ahead and comes back screeching directions. Left! Left! LEFT! ${p} goes left. It works. ${p}: "You're literally a GPS."`,
      (p, a, pr) => `The Parrot mimics ${host()}'s voice: "The exit is THIS way!" ${p} follows. It's the wrong way. ${p}: "Did you just lie? In someone ELSE'S voice?!"`,
    ],
    raccoon: [
      (p, a, pr) => `The Raccoon picks a lock on a gate that was blocking a shortcut. ${p}: "Where did you learn that?!" The Raccoon's past is a mystery. A criminal mystery.`,
      (p, a, pr) => `The Raccoon steals another player's trail markers and rearranges them. Chaos for everyone else. ${p}: "I didn't ask you to do that." ${p} doesn't ask it to stop, either.`,
    ],
    chameleon: [
      (p, a, pr) => `The Chameleon vanishes against a tree trunk. ${p}: "Where did you— wait." It reappears on ${pr.posAdj} shoulder. It was there the whole time. ${p}: "Please stop doing that."`,
      (p, a, pr) => `The Chameleon goes perfectly still on a rock, turning invisible to a passing predator. ${p} takes notes. "I need to learn that."`,
    ],
    monkey: [
      (p, a, pr) => `The Monkey swings through the canopy and drops a vine down for ${p} to climb. Teamwork! ${p} scales the ridge in seconds. ${p}: "I feel like Tarzan!"`,
      (p, a, pr) => `The Monkey finds berries, shares them with ${p}, then pelts a rival team with the remaining ones. ${p}: "I appreciate the help and the sabotage equally."`,
    ],
    goat: [
      (p, a, pr) => `The Goat eats a bush that was blocking the trail. Just... eats it. The entire bush. ${p}: "You just ATE the obstacle." The Goat chews. Problem solved.`,
      (p, a, pr) => `Mountain terrain? The Goat doesn't even slow down. It drags ${p} up the incline like a furry four-legged ATV. ${p}: "LESS SPEED MORE CONTROL." The Goat does not do control.`,
    ],
    wolf: [
      (p, a, pr) => `The Wolf howls. In the distance, something howls back. The Wolf changes course. ${p} follows. The new route is clear. ${p}: "Did you just... call in directions?"`,
      (p, a, pr) => `The Wolf guards ${p}'s back when another team gets too close. Teeth bared. Message received. Nobody approaches. ${p}: "That's my bodyguard."`,
    ],
    eagle: [
      (p, a, pr) => `The Eagle soars above the canopy and circles back. ${p} watches its flight path — it's marking the best route from above. ${p}: "Aerial reconnaissance. I love it."`,
      (p, a, pr) => `The Eagle spots the exit from high altitude and SCREAMS, diving back toward ${p} excitedly. ${p}: "I'll take that as 'this way.'" It was definitely 'this way.'`,
    ],
    alligator: [
      (p, a, pr) => `River crossing. Every other team has to swim or find stones. ${p} rides the Alligator across. ${host()}: "IS THAT ALLOWED?!" Nobody said it wasn't!`,
      (p, a, pr) => `The Alligator takes point through swampy terrain. Other animals won't go near the water. This one OWNS the water. ${p} stays dry. Others don't.`,
    ],
    bear: [
      (p, a, pr) => `The Bear smells honey. Detour. ${p} tries to stop it. Cannot stop a bear that wants honey. They lose two minutes but the Bear is very, very happy now.`,
      (p, a, pr) => `Fallen log blocking the trail. The Bear pushes it aside with one paw. ${p}: "That log was HUGE." The Bear is unimpressed. It was a small log, by bear standards.`,
    ],
    shark: [
      (p, a, pr) => `The Shark is in a water-filled cart. ${p} pushes the cart. Through the forest. It's ridiculous. But the Shark keeps biting at obstacles, clearing brush. Somehow it works.`,
      (p, a, pr) => `They reach a river. The Shark is ECSTATIC. ${p} holds onto a fin and they blast downstream, covering three segments in one move. ${host()}: "THAT should be illegal!"`,
    ],
    moose: [
      (p, a, pr) => `${p} RIDES the Moose. Just straight up rides it through the forest. Branches snap. Small trees bend. ${host()}: "I didn't authorize that but I'm KEEPING it."`,
      (p, a, pr) => `The Moose gets angry at a tree in its path. Charges it. The tree loses. Path cleared. ${p}: "Remind me never to make you mad."`,
    ],
  },
  playerInteraction: {
    help: [
      (p1, p2, pr1, pr2) => `${p1} and ${p2} reach the same obstacle. ${p1} helps ${p2} over. ${p2}: "Thanks." ${p1}: "Don't thank me yet — I'm still going to beat you."`,
      (p1, p2, pr1, pr2) => `${p2} is stuck. ${p1} backtracks to help. They lose time but gain respect. ${p2}: "I owe you one." ${p1}: "I know. I'm keeping score."`,
      (p1, p2, pr1, pr2) => `${p1} shares ${pr1.posAdj} water with ${p2}. Both animals drink too. Brief truce in the race. ${p1}: "Good luck out there." ${p2}: "Same."`,
      (p1, p2, pr1, pr2) => `${p1} spots ${p2} about to walk into a trap and shouts a warning. ${p2} stops just in time. Heroic. ${p1}: "Now we're even."`,
    ],
    race: [
      (p1, p2, pr1, pr2) => `${p1} and ${p2} spot each other through the trees. Eyes lock. Both SPRINT. The animals struggle to keep up with their humans. ${host()}: "NOW it's a race!"`,
      (p1, p2, pr1, pr2) => `Side by side! ${p1} and ${p2} run neck and neck through a clearing. Their animals are in a parallel footrace. The forest shakes with the effort.`,
      (p1, p2, pr1, pr2) => `${p1} sees ${p2} ahead and finds another gear. ${p2} hears the footsteps and finds ANOTHER gear. They push each other past limits neither knew they had.`,
      (p1, p2, pr1, pr2) => `The animals start racing each other before the humans do. Then the humans join in. It's a four-way sprint through dense forest. Branches fly.`,
    ],
    sabotage: [
      (p1, p2, pr1, pr2) => `${p1} "accidentally" knocks a branch into ${p2}'s path. ${p2} trips. ${p1}: "Oops. Didn't see you there." ${pr1.Sub} very much saw.`,
      (p1, p2, pr1, pr2) => `${p1} tells ${p2} the shortcut is left. It's right. ${p2} figures it out two minutes later. ${p1} is long gone. ${p2}: "I am going to DESTROY ${pr1.obj} at tribal."`,
      (p1, p2, pr1, pr2) => `${p1} swipes ${p2}'s trail markers when ${pr2.sub} isn't looking. ${p2} wanders in circles for a full minute. ${p1}: "It's a race. Not a friendship camp."`,
      (p1, p2, pr1, pr2) => `${p1}'s animal distracts ${p2}'s animal while ${p1} runs ahead. ${p2}: "Hey! That's— okay that's actually clever."`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — MOLE SABOTAGE
// ══════════════════════════════════════════════════════════════
export const MOLE_TEXT = {
  training: [
    (mole, target, a, pr) => `${mole} sneaks over to ${target}'s station and agitates ${pr.posAdj} ${a.name} with a loud noise. The ${a.name} panics. Training derailed.`,
    (mole, target, a, pr) => `${mole} swaps ${target}'s good treats for stale ones. The ${a.name} spits them out in disgust. ${target}: "These are the GOOD treats!" They are not.`,
    (mole, target, a, pr) => `${mole} "accidentally" opens ${target}'s ${a.name}'s cage. It bolts. ${target} chases it for three minutes. ${mole} watches innocently. Too innocently.`,
    (mole, target, a, pr) => `While ${target} isn't looking, ${mole} teaches the ${a.name} the WRONG trick. ${target} doesn't realize until the performance. ${mole} suppresses a grin.`,
  ],
  forest: {
    gps: [
      (mole) => `The mole checks ${pronouns(mole).posAdj} hidden GPS device. Arrow pointing northwest. While everyone else navigates by instinct, ${mole} navigates by satellite. Cheating has never been this efficient.`,
      (mole) => `${mole} glances at the GPS tracker taped inside ${pronouns(mole).posAdj} sleeve. Three segments ahead, the exit glows on screen. ${mole} adjusts course. Nobody notices.`,
      (mole) => `The GPS beeps. ${mole} covers it quickly — nobody heard. But now ${pronouns(mole).sub} knows exactly where to go. The mole advantage is MASSIVE.`,
      (mole) => `${mole} pretends to sniff the air for directions. Actually reading a GPS hidden in ${pronouns(mole).posAdj} pocket. "I think... this way." It IS this way. Because technology.`,
    ],
    trap: [
      (mole, target) => `${mole} rigs a vine snare on the trail behind ${pronouns(mole).obj}. When ${target} comes through — SNAP. Caught. ${target}: "WHO set this?!" The forest doesn't answer. ${mole} is long gone.`,
      (mole, target) => `${mole} loosens a log bridge just enough. ${target} steps on it — CRACK. Into the creek below. ${mole} watches from the treeline. "Oh no. How terrible."`,
      (mole, target) => `${mole} marks a false shortcut with convincing trail markers. ${target} follows them straight into a dead end. ${mole} takes the REAL shortcut.`,
      (mole, target) => `${mole} collapses a bush across the trail, forcing ${target} to go the long way around. ${mole}: "Must have been the wind." There is no wind.`,
    ],
    fakeMarker: [
      (mole, target) => `${mole} carves a fake direction arrow into a tree. ${target} follows it and loses two segments. ${mole}: "What? I didn't see any arrow." Because ${pronouns(mole).sub} MADE the arrow.`,
      (mole, target) => `${mole} moves a legitimate trail marker to point the wrong way. ${target} trusts it. Shouldn't have. Three minutes wasted. ${mole} suppresses a smile.`,
      (mole, target) => `${mole} plants ${target}'s bandana near a wrong turn, making it look like ${target} already went that way and doubled back. ${target} follows the "trail." Into nowhere.`,
      (mole, target) => `${mole} whistles from the wrong direction. ${target} follows the sound, thinking it's a trail marker. It's not. ${mole} is already three segments ahead.`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — SOCIAL EVENTS
// ══════════════════════════════════════════════════════════════
export const SOCIAL_TEXT = {
  animalBond: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} and ${p2}'s ${a2.name} nuzzle each other between rounds. Their owners exchange a look. ${p1}: "I think our animals are... friends?" ${p2}: "Apparently better friends than us."`,
    (p1, p2, a1, a2) => `The ${a1.name} and ${a2.name} play together during the break. ${p1} and ${p2} watch, then start chatting. The animals brought them together. ${p2}: "Your ${a1.name.toLowerCase()} is pretty cool."`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} shares its treats with ${p2}'s ${a2.name}. ${p1}: "I didn't teach it that." ${p2}: "It's got better manners than most people here."`,
    (p1, p2, a1, a2) => `The ${a1.name} grooms the ${a2.name}. ${p1} and ${p2} sit together watching. Something about seeing their animals get along makes the humans trust each other more.`,
  ],
  animalRivalry: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} HISSES at ${p2}'s ${a2.name}. The ${a2.name} growls back. ${p1}: "Easy..." ${p2}: "Control YOUR animal." ${p1}: "Control YOURS." Tension rises.`,
    (p1, p2, a1, a2) => `The ${a1.name} steals the ${a2.name}'s food. The ${a2.name} retaliates by knocking over the ${a1.name}'s water. Animal cold war. ${p1} and ${p2} glare at each other.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} and ${p2}'s ${a2.name} have a standoff. Neither blinks. ${p1}: "This is getting weird." ${p2}: "YOUR animal started it." ${p1}: "Did NOT."`,
    (p1, p2, a1, a2) => `The ${a1.name} bumps the ${a2.name} aggressively. The ${a2.name} bumps back harder. ${p1} and ${p2} have to physically separate them. ${host()}: "The animals are more dramatic than the CAST."`,
  ],
  showmance: [
    (p1, p2, a1, a2) => `${p1} and ${p2} train side by side. Their hands brush reaching for the same treat bag. Both freeze. ${p1}: "You go." ${p2}: "No, you." The animals exchange a look that says "humans."`,
    (p1, p2, a1, a2) => `${p2}'s ${a2.name} escapes and runs to ${p1}. ${p2} comes to collect it. ${p1} and ${p2} end up standing very close. "Your ${a2.name.toLowerCase()} has good taste," ${p1} says. ${p2} blushes.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} keeps walking over to ${p2}. ${p1} follows to retrieve it. This happens four times. ${p1}: "I swear it's the ANIMAL, not me." ${host()}: "Sure it is."`,
    (p1, p2, a1, a2) => `${p1} helps ${p2} bandage a scratch from ${pr.posAdj || 'their'} ${a2.name}. They sit close. Too close. ${host()}: "This is a CHALLENGE, not a DATE." They don't hear ${host()}.`,
  ],
  respect: [
    (p1, p2, a1, a2) => `${p2} watches ${p1} handle the ${a1.name} with real skill. ${p2}: "You're actually really good at this." ${p1}: "Thanks. Your ${a2.name.toLowerCase()} is impressive too." Mutual nod.`,
    (p1, p2, a1, a2) => `${p1} and ${p2} compare training notes. Genuinely helpful advice exchanged. No tricks, no sabotage. Just two competitors respecting each other's work.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} pulls off something incredible. ${p2} claps. Actually claps. ${p1} tips an imaginary hat. Sportsmanship lives.`,
    (p1, p2, a1, a2) => `After the round, ${p2} approaches ${p1}: "That was brilliant. The way you handled that obstacle? I'm taking notes." ${p1}: "Steal my techniques. I'll still beat you."`,
  ],
  paranoia: [
    (p1, p2, a1, a2) => `${p1} sees ${p2} whispering to ${pr.posAdj || 'their'} ${a2.name}. ${p1}: "What are you telling it?!" ${p2}: "It's a ${a2.name.toLowerCase()}. I'm telling it to SIT." ${p1} doesn't believe that.`,
    (p1, p2, a1, a2) => `${p1} catches ${p2} studying ${pr.posAdj || 'their'} training technique. ${p1}: "Taking notes? Or looking for weaknesses?" ${p2}: "...Both." At least ${pr.sub || 'they'}'s honest.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2}'s ${a2.name} is spying on ${pr.posAdj || 'their'} training. It's not. It's looking at a butterfly. But paranoia doesn't check facts.`,
    (p1, p2, a1, a2) => `${p1}: "Why does your ${a2.name.toLowerCase()} keep looking at me?" ${p2}: "Because you're LOUD." ${p1}: "Is it memorizing my routine?!" ${p2}: "It's a ${a2.name.toLowerCase()}."`,
  ],
  blame: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} acted up after ${p2} walked too close. ${p1}: "You SPOOKED it!" ${p2}: "I was WALKING." ${p1}: "Walk ELSEWHERE." Heated.`,
    (p1, p2, a1, a2) => `${p1} blames ${p2} for distracting ${pr.posAdj || 'their'} ${a1.name}. ${p2}: "I didn't DO anything!" ${p1}: "Your ${a2.name.toLowerCase()} was making noise!" ${p2}: "Animals MAKE NOISE."`,
    (p1, p2, a1, a2) => `${p1}: "If you hadn't been showing off, my ${a1.name.toLowerCase()} wouldn't have gotten distracted." ${p2}: "Or maybe train your animal better?" SHOTS FIRED.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2} sabotaged ${pr.posAdj || 'their'} training area. ${p2} didn't — but ${p1} is looking for someone to blame and ${p2} is closest. Bond damage.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — HOST COMMENTARY
// ══════════════════════════════════════════════════════════════
export const HOST_TEXT = {
  opening: [
    () => `${host()}: "Welcome to today's challenge! Each of you will be paired with a wild animal companion. You'll train it, perform with it, and then race through the forest together. The first team to exit the forest wins immunity. Oh, and Chef will be judging. So... good luck with THAT."`,
    () => `${host()}: "Alright, castmates! I hope you're all animal lovers. Because today, you're getting a PARTNER. A furry — or scaly, or feathery — partner. Train it. Perform with it. Race with it. Don't get eaten by it. Simple!"`,
    () => `${host()}: "Today's challenge is called TOP DOG. You'll each receive an animal buddy. Phase one: train it and perform. Phase two: race through the forest with it. First to the exit wins immunity. Any questions? Great, I don't care. Let's GO!"`,
    () => `${host()}: "Animals! Adventure! Absolutely terrible decisions! Welcome to TOP DOG, people. Grab your partner, try not to die, and remember — the animal is ALWAYS right."`,
  ],
  trainingStart: [
    () => `${host()}: "Alright! Training time! You have four rounds to turn these wild animals into performing partners. Chef and I will judge your routines afterward. Make it GOOD."`,
    () => `${host()}: "Time to train! Remember — these animals don't know you, don't trust you, and in some cases, actively want to eat you. Good luck!"`,
    () => `${host()}: "Training begins NOW! Four rounds, people. That's all you get. Make every second count. Or don't. Either way, it's great TV."`,
    () => `${host()}: "Let the training montage... BEGIN! And yes, we WILL be playing inspiring music. Whether you deserve it or not."`,
  ],
  judgingStart: [
    () => `${host()}: "Training's OVER! Time for the performance. Step up, show us what your animal can do, and try not to embarrass yourself. Chef's scoring, and he's in a BAD mood today."`,
    () => `${host()}: "Performances! One at a time! Chris scores, Chef scores. Total out of 20. Top scorer gets a head start in the race. Bottom scorer gets... nothing. As usual."`,
    () => `${host()}: "Judgment time! Who trained well? Who's going to crash and burn? Let's find out! Bring your animals to the stage!"`,
    () => `${host()}: "Time for the SHOW! Chris and Chef will judge each performance on a scale of 1 to 10. Twenty is PERFECT. One is 'why did I agree to host this show.'"`,
  ],
  forestStart: [
    () => `${host()}: "Welcome to Phase Two: the FOREST RACE! Fourteen segments of dense forest between you and the exit. First team out wins IMMUNITY. Head starts based on your performance scores!"`,
    () => `${host()}: "Into the FOREST, people! It's dark, it's dangerous, and I've hidden some surprises in there. Traps? Maybe. Shortcuts? Perhaps. Bears? ...Already have some of those."`,
    () => `${host()}: "Race time! Your animals know the forest better than you. Trust them. Or don't. Either way — first to segment fourteen wins. GO!"`,
    () => `${host()}: "The forest awaits! Fourteen segments of pure chaos. Your performance score determines your head start. Everyone else? Start from zero. And try to keep up!"`,
  ],
  forestFinish: [
    (winner) => `${host()}: "${winner} EXITS THE FOREST FIRST! ${winner} wins IMMUNITY!" The other teams emerge one by one, exhausted, scratched, muddy. ${winner} stands at the finish, grinning.`,
    (winner) => `${host()}: "And ${winner} BURSTS through the treeline! IMMUNITY IS WON! The rest of you... better start thinking about tribal council."`,
    (winner) => `${host()}: "IT'S OVER! ${winner} and ${pronouns(winner).posAdj} animal cross the finish line! IMMUNITY! The forest has spoken, and it chose ${winner}!"`,
    (winner) => `${host()}: "${winner} clears the final segment! DONE! IMMUNITY! Everyone else is scrambling but it's TOO LATE! Top Dog has been crowned!"`,
  ],
};


// ══════════════════════════════════════════════════════════════
// PHASE 1: TRAINING + JUDGING
// ══════════════════════════════════════════════════════════════
function _simulateTraining(assignments, ep, result) {
  const campKey = gs.mergeName || 'merge';
  const TRAINING_ROUNDS = 4;

  for (const assign of assignments) {
    assign.trainingResults = [];
    assign.successCount = 0;
    assign.totalRounds = TRAINING_ROUNDS;
  }

  // Mole detection
  let mole = null;
  if (gs.mole && assignments.some(a => a.player === gs.mole)) {
    mole = gs.mole;
  }
  result.phase1.mole = mole;

  for (let round = 0; round < TRAINING_ROUNDS; round++) {
    const roundData = { round: round + 1, results: [], socialEvents: [], moleAction: null };

    // Each player trains
    for (const assign of assignments) {
      const { player, animal, compatibility } = assign;
      const s = pStats(player);
      const relevantStat = (s[animal.stats[0]] + s[animal.stats[1]]) * 0.5;
      const trainRoll = compatibility * 0.4 + relevantStat * 0.3 + noise(2.5);

      // Success threshold proportional to difficulty
      const threshold = 3.5 + animal.danger * 0.3;
      const pr = pronouns(player);

      if (trainRoll < threshold - 3) {
        // Critical failure
        const text = pick(TRAINING_TEXT.criticalFailure)(player, animal, pr);
        assign.compatibility = Math.max(0, assign.compatibility - 0.8);
        roundData.results.push({ player, animal: animal.id, outcome: 'critical_failure', roll: trainRoll, text });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) - 1;
        popDelta(player, -1);
      } else if (trainRoll < threshold) {
        // Failure
        const pool = TRAINING_TEXT.failure[animal.temperament] || TRAINING_TEXT.failure.stubborn;
        const text = pick(pool)(player, animal, pr);
        assign.compatibility = Math.max(0, assign.compatibility - 0.3);
        roundData.results.push({ player, animal: animal.id, outcome: 'failure', roll: trainRoll, text });
      } else {
        // Success
        const pool = TRAINING_TEXT.success[animal.temperament] || TRAINING_TEXT.success.playful;
        const text = pick(pool)(player, animal, pr);
        assign.compatibility = Math.min(10, assign.compatibility + 0.5);
        assign.successCount++;
        roundData.results.push({ player, animal: animal.id, outcome: 'success', roll: trainRoll, text });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 1;
      }
    }

    // Mole sabotage: 1-2 actions during training
    if (mole && round < 2) {
      const targets = assignments.filter(a => a.player !== mole);
      if (targets.length > 0) {
        const target = pick(targets);
        const pr = pronouns(target.player);
        const text = pick(MOLE_TEXT.training)(mole, target.player, target.animal, pr);
        target.compatibility = Math.max(0, target.compatibility - 0.5);
        roundData.moleAction = { mole, target: target.player, text };
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.2;
        ep.campEvents[campKey].post.push({
          text: `${mole} sabotaged ${target.player}'s animal training during Top Dog.`,
          players: [mole, target.player],
          badgeText: 'Mole Sabotage',
          badgeClass: 'badge-danger',
        });
      }
    }

    // Social events: 1-2 guaranteed between each training round
    const socialCount = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let s = 0; s < socialCount; s++) {
      const evt = _generateTrainingSocialEvent(assignments, ep, campKey);
      if (evt) roundData.socialEvents.push(evt);
    }

    result.phase1.trainingRounds.push(roundData);
  }
}

function _generateTrainingSocialEvent(assignments, ep, campKey) {
  if (assignments.length < 2) return null;
  const shuffled = [...assignments].sort(() => Math.random() - 0.5);
  const a1 = shuffled[0], a2 = shuffled[1];
  const bond = getBond(a1.player, a2.player);
  const pr1 = pronouns(a1.player), pr2 = pronouns(a2.player);

  // Pick event type based on bond + archetypes
  let type, textPool;
  if (bond > 3 && Math.random() < 0.4) {
    // Check showmance
    const showmance = gs.showmances?.find(sm =>
      (sm.a === a1.player && sm.b === a2.player) || (sm.a === a2.player && sm.b === a1.player));
    if (showmance) {
      type = 'showmance';
      textPool = SOCIAL_TEXT.showmance;
    } else {
      type = 'animalBond';
      textPool = SOCIAL_TEXT.animalBond;
    }
  } else if (bond < -2) {
    type = Math.random() < 0.5 ? 'animalRivalry' : 'blame';
    textPool = type === 'animalRivalry' ? SOCIAL_TEXT.animalRivalry : SOCIAL_TEXT.blame;
  } else if (Math.random() < 0.3) {
    type = 'respect';
    textPool = SOCIAL_TEXT.respect;
  } else if (Math.random() < 0.3) {
    type = 'paranoia';
    textPool = SOCIAL_TEXT.paranoia;
  } else {
    type = 'animalBond';
    textPool = SOCIAL_TEXT.animalBond;
  }

  const text = pick(textPool)(a1.player, a2.player, a1.animal, a2.animal);

  // Gameplay consequences
  let bondDelta = 0, popA = 0, popB = 0;
  switch (type) {
    case 'animalBond':
      bondDelta = 0.5 + Math.random() * 0.5;
      break;
    case 'animalRivalry':
      bondDelta = -(0.5 + Math.random() * 0.5);
      popA = -0.5; popB = -0.5;
      break;
    case 'showmance':
      bondDelta = 1;
      popA = 1; popB = 1;
      break;
    case 'respect':
      bondDelta = 0.5;
      popA = 0.5; popB = 0.5;
      break;
    case 'paranoia':
      bondDelta = -0.3;
      break;
    case 'blame':
      bondDelta = -1;
      popA = -0.5;
      break;
  }

  addBond(a1.player, a2.player, bondDelta);
  if (popA) popDelta(a1.player, popA);
  if (popB) popDelta(a2.player, popB);

  // Camp event
  ep.campEvents[campKey].post.push({
    text: `${type === 'showmance' ? 'Showmance moment' : type === 'animalRivalry' ? 'Animal rivalry' : type === 'blame' ? 'Blame game' : type === 'paranoia' ? 'Paranoia' : type === 'respect' ? 'Respect shown' : 'Animal bonding'} between ${a1.player} and ${a2.player} during Top Dog training.`,
    players: [a1.player, a2.player],
    badgeText: type === 'showmance' ? 'Showmance' : type === 'animalRivalry' ? 'Rivalry' : type === 'blame' ? 'Blame' : type === 'paranoia' ? 'Paranoia' : type === 'respect' ? 'Respect' : 'Bond',
    badgeClass: ['animalBond', 'showmance', 'respect'].includes(type) ? 'badge-success' : 'badge-warning',
  });

  return { type, players: [a1.player, a2.player], animals: [a1.animal, a2.animal], text, bondDelta };
}

function _simulateJudging(assignments, result) {
  const performances = [];

  for (const assign of assignments) {
    const { player, animal, compatibility, successCount, totalRounds } = assign;
    const s = pStats(player);
    const pr = pronouns(player);
    const trainingRate = successCount / totalRounds;
    const perfRoll = (s.social * 0.4 + s.boldness * 0.3 + noise(2.5)) / 10;
    const animalMood = compatibility / 10;
    const rawScore = trainingRate * 0.4 + perfRoll * 0.3 + animalMood * 0.3;

    const chrisScore = Math.round(Math.max(1, Math.min(10, rawScore * 10 + noise(1.5))));
    const chefScore = Math.round(Math.max(1, Math.min(10, rawScore * 10 + noise(1.5))));
    const total = chrisScore + chefScore;

    // Tier
    const avg = total / 2;
    let tier;
    if (avg >= 9) tier = 'standingOvation';
    else if (avg >= 7) tier = 'impressed';
    else if (avg >= 5) tier = 'meh';
    else if (avg >= 3) tier = 'disaster';
    else tier = 'catastrophe';

    const perfText = pick(JUDGING_TEXT.performance[tier])(player, animal, pr);
    const chrisText = pick(JUDGING_TEXT.chrisComment[tier])(player, animal);
    const chefText = pick(JUDGING_TEXT.chefComment[tier])(player, animal);

    performances.push({
      player, animal: animal.id, animalObj: animal,
      chrisScore, chefScore, total, tier,
      perfText, chrisText, chefText,
      trainingRate, compatibility,
    });

    // Popularity based on performance
    if (tier === 'standingOvation') popDelta(player, 2);
    else if (tier === 'impressed') popDelta(player, 1);
    else if (tier === 'disaster') popDelta(player, -1);
    else if (tier === 'catastrophe') popDelta(player, -2);
  }

  // Sort by total score descending
  performances.sort((a, b) => b.total - a.total);
  result.phase1.performances = performances;

  return performances;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: FOREST RACE
// ══════════════════════════════════════════════════════════════
function _simulateForestRace(assignments, performances, ep, result) {
  const campKey = gs.mergeName || 'merge';

  // Head start based on Phase 1 rank
  const positions = {};
  const assignMap = {};
  for (const assign of assignments) {
    assignMap[assign.player] = assign;
  }

  // Winner starts at 3, second at 2, third at 1, rest at 0
  for (let i = 0; i < performances.length; i++) {
    const name = performances[i].player;
    if (i === 0) positions[name] = 3;
    else if (i === 1) positions[name] = 2;
    else if (i === 2) positions[name] = 1;
    else positions[name] = 0;
  }

  const activePlayers = performances.map(p => p.player);
  const eliminated = new Set(); // players who've finished
  let winner = null;
  const rounds = [];

  // Mole setup
  let mole = result.phase1.mole;
  let moleSabotagesLeft = mole ? 2 : 0;

  // Race loop
  for (let roundNum = 0; roundNum < 25 && !winner; roundNum++) {
    const roundData = { round: roundNum + 1, movements: [], encounters: [], socialEvents: [], moleActions: [] };
    const stillRacing = activePlayers.filter(n => !eliminated.has(n));
    if (stillRacing.length === 0) break;

    // Mole GPS bonus
    if (mole && !eliminated.has(mole)) {
      positions[mole] = (positions[mole] || 0) + 3;
      const text = pick(MOLE_TEXT.forest.gps)(mole);
      roundData.moleActions.push({ type: 'gps', mole, text });
      if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
    }

    // Mole trap/fake marker
    if (mole && moleSabotagesLeft > 0 && Math.random() < 0.6 && !eliminated.has(mole)) {
      const targets = stillRacing.filter(n => n !== mole);
      if (targets.length > 0) {
        const target = pick(targets);
        const sabType = Math.random() < 0.5 ? 'trap' : 'fakeMarker';
        const text = pick(MOLE_TEXT.forest[sabType])(mole, target);
        const penalty = sabType === 'trap' ? -2 : -2;
        positions[target] = Math.max(0, (positions[target] || 0) + penalty);
        roundData.moleActions.push({ type: sabType, mole, target, text, penalty });
        moleSabotagesLeft--;
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
        ep.campEvents[campKey].post.push({
          text: `${mole} sabotaged ${target} during the Top Dog forest race.`,
          players: [mole, target],
          badgeText: 'Mole Sabotage',
          badgeClass: 'badge-danger',
        });
      }
    }

    // Each player moves
    for (const name of stillRacing) {
      if (name === mole) continue; // mole already moved via GPS
      const assign = assignMap[name];
      if (!assign) continue;
      const s = pStats(name);
      const pr = pronouns(name);
      const moveRoll = s.physical * 0.3 + s.endurance * 0.2 + (assign.compatibility * 0.2) + noise(2.5);
      // Scale to segments (0.5 to 2.5 typically)
      let segments = Math.max(0.3, moveRoll / 4);

      // Encounter (1-2 per round)
      const encounterCount = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let e = 0; e < encounterCount; e++) {
        const encounter = _generateEncounter(name, assign, segments, pr);
        segments += encounter.segDelta;
        roundData.encounters.push(encounter);

        // Score adjustments
        if (encounter.segDelta > 0) {
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
        } else if (encounter.segDelta < -1) {
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 1;
        }
      }

      segments = Math.max(0, segments);
      positions[name] = (positions[name] || 0) + segments;

      // Movement text
      let moveType;
      if (segments >= 2) moveType = 'fast';
      else if (segments >= 1) moveType = 'medium';
      else moveType = 'slow';
      const moveText = pick(FOREST_TEXT.movement[moveType])(name, assign.animal, pr);
      roundData.movements.push({ player: name, segments, position: positions[name], moveType, text: moveText });

      // Phase 2 scores
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;

      // Check finish
      if (positions[name] >= FOREST_LENGTH) {
        if (!winner) {
          winner = name;
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
        }
        eliminated.add(name);
      }
    }

    // Also move the mole normally (already got GPS bonus above)
    if (mole && !eliminated.has(mole) && stillRacing.includes(mole)) {
      const moleAssign = assignMap[mole];
      if (moleAssign) {
        const s = pStats(mole);
        const pr = pronouns(mole);
        const moveRoll = s.physical * 0.3 + s.endurance * 0.2 + (moleAssign.compatibility * 0.2) + noise(2.5);
        let segments = Math.max(0.3, moveRoll / 4);
        // GPS already added 3 segments, this is normal movement on top
        // Actually no — the GPS +3 was already applied above. Normal movement here.
        // Wait, we already added GPS bonus to positions. So this is just normal running.
        positions[mole] = (positions[mole] || 0) + segments;
        const moveType = segments >= 2 ? 'fast' : segments >= 1 ? 'medium' : 'slow';
        const moveText = pick(FOREST_TEXT.movement[moveType])(mole, moleAssign.animal, pr);
        roundData.movements.push({ player: mole, segments, position: positions[mole], moveType, text: moveText });
        ep.chalMemberScores[mole] = (ep.chalMemberScores[mole] || 0) + 2;
        if (positions[mole] >= FOREST_LENGTH) {
          if (!winner) {
            winner = mole;
            ep.chalMemberScores[mole] = (ep.chalMemberScores[mole] || 0) + 5;
          }
          eliminated.add(mole);
        }
      }
    }

    // Social events between players in same/adjacent segments
    const socialCount = Math.random() < 0.5 ? 1 : 0;
    for (let s = 0; s < socialCount; s++) {
      const pairs = _findNearbyPairs(stillRacing.filter(n => !eliminated.has(n)), positions);
      if (pairs.length > 0) {
        const [p1, p2] = pick(pairs);
        const evt = _generateForestSocialEvent(p1, p2, assignMap, ep, campKey);
        if (evt) roundData.socialEvents.push(evt);
      }
    }

    // Player interaction encounters for nearby players
    const nearPairs = _findNearbyPairs(stillRacing.filter(n => !eliminated.has(n)), positions);
    if (nearPairs.length > 0 && Math.random() < 0.4) {
      const [p1, p2] = pick(nearPairs);
      const evt = _generatePlayerInteraction(p1, p2, assignMap, ep, campKey);
      if (evt) roundData.encounters.push(evt);
    }

    rounds.push(roundData);
  }

  // If no winner after max rounds, closest to finish wins
  if (!winner) {
    const remaining = activePlayers.filter(n => !eliminated.has(n));
    if (remaining.length > 0) {
      remaining.sort((a, b) => (positions[b] || 0) - (positions[a] || 0));
      winner = remaining[0];
      ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + 5;
    }
  }

  // Build finish order
  const finishOrder = [...activePlayers].sort((a, b) => (positions[b] || 0) - (positions[a] || 0));

  result.phase2.rounds = rounds;
  result.phase2.positions = { ...positions };
  result.phase2.winner = winner;
  result.phase2.finishOrder = finishOrder;
  result.phase2.finishText = winner ? pick(HOST_TEXT.forestFinish)(winner) : '';

  return winner;
}

function _generateEncounter(name, assign, currentSegments, pr) {
  const s = pStats(name);
  const animal = assign.animal;
  const encounterType = pick(['navigation', 'obstacle', 'trap', 'animalMoment']);

  if (encounterType === 'animalMoment') {
    const pool = FOREST_TEXT.animalMoment[animal.id];
    if (pool && pool.length > 0) {
      const text = pick(pool)(name, animal, pr);
      // Animal moments are mostly positive for high-compat teams
      const delta = assign.compatibility > 5 ? (Math.random() < 0.6 ? 1 : 0) : (Math.random() < 0.3 ? 1 : -0.5);
      return { type: 'animalMoment', player: name, animal: animal.id, text, segDelta: delta };
    }
  }

  if (encounterType === 'navigation') {
    const navRoll = s.mental * 0.4 + s.intuition * 0.3 + noise(2.5);
    const threshold = 4 + animal.danger * 0.2;
    if (navRoll >= threshold) {
      const text = pick(FOREST_TEXT.navigation.success)(name, animal, pr);
      return { type: 'navigation', player: name, outcome: 'success', text, segDelta: 2 };
    } else {
      const lostSegments = -(1 + Math.floor(Math.random() * 3));
      const text = pick(FOREST_TEXT.navigation.failure)(name, animal, pr);
      return { type: 'navigation', player: name, outcome: 'failure', text, segDelta: lostSegments };
    }
  }

  if (encounterType === 'obstacle') {
    const obsRoll = s.physical * 0.4 + s.endurance * 0.2 + noise(2.5);
    const threshold = 4;
    if (obsRoll >= threshold) {
      const text = pick(FOREST_TEXT.obstacle.success)(name, animal, pr);
      return { type: 'obstacle', player: name, outcome: 'success', text, segDelta: 0 };
    } else {
      const text = pick(FOREST_TEXT.obstacle.failure)(name, animal, pr);
      return { type: 'obstacle', player: name, outcome: 'failure', text, segDelta: -1 };
    }
  }

  // Trap
  const trapRoll = s.intuition * 0.4 + s.boldness * 0.2 + noise(2.5);
  const threshold = 4.5;
  if (trapRoll >= threshold) {
    const text = pick(FOREST_TEXT.trap.success)(name, animal, pr);
    return { type: 'trap', player: name, outcome: 'success', text, segDelta: 0 };
  } else {
    const text = pick(FOREST_TEXT.trap.failure)(name, animal, pr);
    return { type: 'trap', player: name, outcome: 'failure', text, segDelta: -2 };
  }
}

function _findNearbyPairs(players, positions) {
  const pairs = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const dist = Math.abs((positions[players[i]] || 0) - (positions[players[j]] || 0));
      if (dist <= 2) pairs.push([players[i], players[j]]);
    }
  }
  return pairs;
}

function _generateForestSocialEvent(p1, p2, assignMap, ep, campKey) {
  const bond = getBond(p1, p2);
  const a1 = assignMap[p1], a2 = assignMap[p2];
  if (!a1 || !a2) return null;

  let type;
  if (bond > 3) type = Math.random() < 0.4 ? 'respect' : 'animalBond';
  else if (bond < -2) type = Math.random() < 0.5 ? 'animalRivalry' : 'blame';
  else type = pick(['respect', 'paranoia', 'animalBond']);

  const text = pick(SOCIAL_TEXT[type])(p1, p2, a1.animal, a2.animal);

  let bondDelta = 0;
  switch (type) {
    case 'animalBond': case 'respect': bondDelta = 0.5; break;
    case 'animalRivalry': case 'blame': bondDelta = -0.5; break;
    case 'paranoia': bondDelta = -0.3; break;
  }

  addBond(p1, p2, bondDelta);

  ep.campEvents[campKey].post.push({
    text: `${type === 'animalRivalry' ? 'Animal rivalry' : type === 'blame' ? 'Blame game' : type === 'respect' ? 'Mutual respect' : type === 'paranoia' ? 'Paranoid moment' : 'Animal bonding'} between ${p1} and ${p2} during the Top Dog forest race.`,
    players: [p1, p2],
    badgeText: type === 'respect' ? 'Respect' : type === 'animalBond' ? 'Bond' : type === 'animalRivalry' ? 'Rivalry' : type === 'blame' ? 'Blame' : 'Paranoia',
    badgeClass: ['animalBond', 'respect'].includes(type) ? 'badge-success' : 'badge-warning',
  });

  return { type, players: [p1, p2], text, bondDelta };
}

function _generatePlayerInteraction(p1, p2, assignMap, ep, campKey) {
  const bond = getBond(p1, p2);
  const a1 = assignMap[p1], a2 = assignMap[p2];
  if (!a1 || !a2) return null;
  const pr1 = pronouns(p1), pr2 = pronouns(p2);

  let interType;
  if (bond > 2) interType = Math.random() < 0.6 ? 'help' : 'race';
  else if (bond < -2 && canScheme(p1)) interType = 'sabotage';
  else interType = 'race';

  const text = pick(FOREST_TEXT.playerInteraction[interType])(p1, p2, pr1, pr2);

  let segDelta1 = 0, segDelta2 = 0, bondDelta = 0;
  switch (interType) {
    case 'help':
      segDelta2 = 1; // helped player gains
      segDelta1 = -0.5; // helper loses a bit
      bondDelta = 1;
      popDelta(p1, 1); // heroic
      break;
    case 'race':
      // Both push harder — small bonus for both
      segDelta1 = 0.5;
      segDelta2 = 0.5;
      break;
    case 'sabotage':
      segDelta2 = -1.5; // sabotaged player loses ground
      bondDelta = -1.5;
      popDelta(p1, -1); // villainous
      popDelta(p2, 0.5); // sympathy
      ep.campEvents[campKey].post.push({
        text: `${p1} sabotaged ${p2} during the Top Dog forest race.`,
        players: [p1, p2],
        badgeText: 'Sabotage',
        badgeClass: 'badge-danger',
      });
      break;
  }

  if (bondDelta) addBond(p1, p2, bondDelta);

  return {
    type: 'playerInteraction', subType: interType,
    players: [p1, p2],
    text,
    segDelta: { [p1]: segDelta1, [p2]: segDelta2 },
  };
}


// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateTopDog(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    phase1: { assignments: [], trainingRounds: [], performances: [], mole: null },
    phase2: { rounds: [], positions: {}, winner: null, finishOrder: [], finishText: '' },
    immunityWinner: null,
    hostOpening: pick(HOST_TEXT.opening)(),
    hostTrainingStart: pick(HOST_TEXT.trainingStart)(),
    hostJudgingStart: pick(HOST_TEXT.judgingStart)(),
    hostForestStart: pick(HOST_TEXT.forestStart)(),
  };

  // ── Animal Assignment ──
  const assignments = _assignAnimals(active);
  result.phase1.assignments = assignments;

  // Add Phase 1 judging scores to chalMemberScores
  // (training scores are added in _simulateTraining)

  // ── Phase 1: Training ──
  _simulateTraining(assignments, ep, result);

  // ── Phase 1: Judging ──
  const performances = _simulateJudging(assignments, result);

  // Add judging totals to chalMemberScores
  for (const perf of performances) {
    ep.chalMemberScores[perf.player] = (ep.chalMemberScores[perf.player] || 0) + perf.total;
  }

  // ── Phase 2: Forest Race ──
  const winner = _simulateForestRace(assignments, performances, ep, result);
  result.immunityWinner = winner;

  // ── Romance Hooks ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'animal buddy challenge');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'top-dog', _romActive);

  // ── Finalize ──
  ep.topDog = result;
  ep.isTopDog = true;
  ep.challengeType = 'top-dog';
  ep.challengeLabel = 'Top Dog';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;
  ep.chalPlacements = result.phase2.finishOrder;

  // Ensure immunity winner is #1 in chalMemberScores
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([, s]) => s));
  ep.chalMemberScores[result.immunityWinner] = Math.max(ep.chalMemberScores[result.immunityWinner] || 0, maxOther) + active.length + 5;

  ep.tribalPlayers = active;
  updateChalRecord(ep);

  return ep;
}

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


// ══════════════════════════════════════════════════════════════
// VP (VISUAL PLAYBACK) SYSTEM
// ══════════════════════════════════════════════════════════════

// ── REVEAL STATE ──
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

export function topDogRevealNext(screenKey, total) {
  const st = _ensureState(screenKey, total);
  if (st.idx < st.total - 1) { st.idx++; }
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
  _updateCounter(screenKey);
  _scrollToRevealedStep(screenKey, st.idx);
}
export function topDogRevealAll(screenKey, total) {
  const st = _ensureState(screenKey, total);
  st.idx = st.total - 1;
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
  _updateCounter(screenKey);
}
window.tdRevealNext = topDogRevealNext;
window.tdRevealAll = topDogRevealAll;

function _scrollToRevealedStep(screenKey, idx) {
  requestAnimationFrame(() => {
    const container = document.querySelector(`[data-screen-key="${screenKey}"]`);
    if (!container) return;
    const allSteps = container.querySelectorAll('.td-step.td-visible');
    const target = allSteps[allSteps.length - 1];
    if (!target) return;
    let scrollParent = target.closest('.rp-main');
    if (!scrollParent) {
      let el = target.parentElement;
      while (el) {
        const style = getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') { scrollParent = el; break; }
        el = el.parentElement;
      }
    }
    if (!scrollParent) scrollParent = document.documentElement;
    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - parentRect.top + scrollParent.scrollTop - parentRect.height * 0.3;
    scrollParent.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  });
}

function _updateCounter(screenKey) {
  const st = _tvState[screenKey];
  if (!st) return;
  const el = document.getElementById(`td-counter-${screenKey}`);
  if (el) el.textContent = `${Math.max(0, st.idx + 1)}/${st.total}`;
}

function _rebuildCurrentScreen(screenKey) {
  const el = document.querySelector(`[data-screen-key="${screenKey}"]`);
  if (!el) return;
  const scrollTop = el.scrollTop;
  const builder = window._tdScreenBuilders?.[screenKey];
  if (builder) {
    const ep = window._tdEp;
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
  const sidebarEl = document.getElementById('td-sidebar');
  if (!sidebarEl) return;
  const shell = sidebarEl.closest('.td-shell');
  const phase = shell?.dataset?.phase || '';
  const data = window._tdData;
  if (!data) return;
  sidebarEl.innerHTML = _buildSidebarContent(data, phase, window._tdEp);
}

// ══════════════════════════════════════════════════════════════
// CUSTOM ANIMATED CSS ICONS (Layer 1)
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    paw: 'td-icon-paw', movement: 'td-icon-paw',
    spotlight: 'td-icon-spotlight', performance: 'td-icon-spotlight', judging: 'td-icon-spotlight',
    trap: 'td-icon-trap',
    compass: 'td-icon-compass', navigation: 'td-icon-compass',
    tree: 'td-icon-tree', obstacle: 'td-icon-tree',
    star: 'td-icon-star', success: 'td-icon-star', standingOvation: 'td-icon-star',
    skull: 'td-icon-skull', critical_failure: 'td-icon-skull', catastrophe: 'td-icon-skull',
    heart: 'td-icon-heart', showmance: 'td-icon-heart', animalBond: 'td-icon-heart',
    whip: 'td-icon-whip', training: 'td-icon-whip',
    lantern: 'td-icon-lantern', forest: 'td-icon-lantern',
    claw: 'td-icon-claw', animalRivalry: 'td-icon-claw',
    ribbon: 'td-icon-ribbon', immunity: 'td-icon-ribbon',
    eye: 'td-icon-eye', mole: 'td-icon-eye',
    mask: 'td-icon-mask', sabotage: 'td-icon-mask',
    shield: 'td-icon-shield', help: 'td-icon-shield', respect: 'td-icon-shield',
    failure: 'td-icon-skull',
    impressed: 'td-icon-star',
    meh: 'td-icon-spotlight',
    disaster: 'td-icon-skull',
    blame: 'td-icon-claw',
    paranoia: 'td-icon-eye',
    race: 'td-icon-paw',
  };
  const cls = map[type] || 'td-icon-paw';
  return `<span class="td-icon ${cls}"></span>`;
}

// ══════════════════════════════════════════════════════════════
// COMM CHATTER (Layer 3)
// ══════════════════════════════════════════════════════════════
const COMM_CHATTER = {
  'td-circus': [
    "RINGMASTER: 'All acts, prepare for the grand performance!'",
    "STAGE CREW: 'Spotlights 1 through 6, standing by.'",
    "BACKSTAGE: 'Animal wranglers, confirm all partners are in position.'",
    "RINGMASTER: 'The crowd is ELECTRIC tonight, folks!'",
    "JUDGE'S BOX: 'Scoring paddles ready. Chef has his reading glasses on.'",
    "STAGE CREW: 'Curtain mechanism tested. We are GO for the show.'",
    "RINGMASTER: 'Remember — the animals are the STARS. You're the supporting act.'",
    "BACKSTAGE: 'Treat inventory: adequate. Bandages: hopefully adequate.'",
    "JUDGE'S BOX: 'Chef is already disappointed. Standard operating procedure.'",
    "STAGE CREW: 'Music cued. Confetti loaded. Dignity... optional.'",
  ],
  'td-forest': [
    "BASE CAMP: 'Trail markers confirmed at sectors 3, 7, and 11.'",
    "RANGER: 'Copy. Visibility dropping. Fog rolling in from the north.'",
    "BASE CAMP: 'Multiple contestants entering the tree line. Tracking active.'",
    "RANGER: 'Wildlife activity detected in sector 5. Advise caution.'",
    "BASE CAMP: 'Trail conditions: muddy after sector 6. Expect slowdowns.'",
    "RANGER: 'Moonlight holding. Should break through the canopy at sector 10.'",
    "BASE CAMP: 'Exit point confirmed at sector 14. Finish line crew standing by.'",
    "RANGER: 'Lost visual on contestant — fog is thick. Switching to thermal.'",
    "BASE CAMP: 'One team approaching the halfway mark. Others are scattered.'",
    "RANGER: 'Trap at sector 9 has been triggered. Reset in progress.'",
  ],
};

function _pickChatter(zone, count = 1) {
  const pool = COMM_CHATTER[zone];
  if (!pool || pool.length === 0) return [];
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

function _commDiv(text) {
  return `<div class="td-comm">${text}</div>`;
}

// ══════════════════════════════════════════════════════════════
// HUD / TELEMETRY (Layers 2 & 7)
// ══════════════════════════════════════════════════════════════
const HUD_DATA = {
  '': { act: '', label: 'TOP DOG', sub: 'IMMUNITY CHALLENGE' },
  'td-circus-assign': { act: 'PROLOGUE', label: 'ANIMAL DRAFT', sub: 'COMPATIBILITY ASSESSMENT' },
  'td-circus-training': { act: 'ACT I', label: 'TRAINING MONTAGE', sub: 'FOUR ROUNDS' },
  'td-circus-judging': { act: 'ACT II', label: 'GRAND PERFORMANCE', sub: 'CHRIS + CHEF SCORING' },
  'td-forest': { act: '', label: 'THE GREAT FOREST RACE', sub: '14 SEGMENTS TO EXIT' },
  'td-winner': { act: 'FINALE', label: 'TOP DOG CROWNED', sub: 'IMMUNITY EARNED' },
};

const TELEMETRY_DATA = {
  'td-circus-assign': 'ANIMALS AVAILABLE: 12 ◆ DRAFT ORDER: BY SOCIAL+BOLDNESS ◆ COMPATIBILITY: CALCULATING ◆ VENUE: CIRCUS RING',
  'td-circus-training': 'ACTS REMAINING: 4 ◆ ANIMALS TRAINED: IN PROGRESS ◆ CROWD ENERGY: HIGH ◆ JUDGE MOOD: FAVORABLE',
  'td-circus-judging': 'PERFORMANCES: IN PROGRESS ◆ JUDGE PANEL: CHRIS + CHEF ◆ SCORE RANGE: 2-20 ◆ CROWD: SEATED',
  'td-forest': 'DISTANCE TO EXIT: 14km ◆ TERRAIN: DENSE FOREST ◆ VISIBILITY: LOW ◆ WILDLIFE: ACTIVE ◆ TRAPS: ARMED',
  'td-winner': 'STATUS: CHALLENGE COMPLETE ◆ IMMUNITY: AWARDED ◆ TRIBAL COUNCIL: PENDING',
};

// ══════════════════════════════════════════════════════════════
// CSS (Layer 1-10 all integrated)
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
/* ═══ TOP DOG VP ═══ */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:wght@400;600;700&display=swap');

.td-shell{position:relative;display:flex;gap:0;min-height:520px;max-width:1100px;margin:0 auto;font-family:'Lora','Georgia',serif;color:#faf0d4;background:#1a0a0a;border-radius:12px;overflow:clip;border:2px solid rgba(212,160,23,0.3);box-shadow:0 0 40px rgba(139,26,26,0.3),inset 0 0 60px rgba(0,0,0,0.6)}
.td-shell *{box-sizing:border-box}
.td-main{flex:1;padding:18px 20px 60px 20px;overflow-y:auto;position:relative;z-index:1}
.td-sidebar{width:240px;min-width:240px;background:rgba(212,160,23,0.04);border-left:2px solid rgba(212,160,23,0.15);padding:12px 10px;overflow-y:auto;font-size:0.82rem;position:relative;z-index:1}

/* Phase 1: Circus Ring background */
.td-shell::before{content:'';position:absolute;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 500px 400px at 50% 40%, rgba(139,26,26,0.4), transparent),
    radial-gradient(ellipse 300px 200px at 20% 60%, rgba(139,26,26,0.2), transparent),
    radial-gradient(ellipse 200px 200px at 80% 30%, rgba(184,134,11,0.15), transparent),
    radial-gradient(circle 2px at 15% 25%, rgba(250,240,212,0.4), transparent),
    radial-gradient(circle 1px at 55% 15%, rgba(212,160,23,0.3), transparent),
    radial-gradient(circle 1.5px at 75% 65%, rgba(250,240,212,0.3), transparent),
    radial-gradient(circle 1px at 35% 85%, rgba(212,160,23,0.2), transparent),
    #1a0a0a}

/* Spotlight sweep */
.td-shell::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 120px 300px at 50% 20%, rgba(255,248,220,0.06), transparent);
  animation:td-spotlightSweep 8s ease-in-out infinite alternate}
@keyframes td-spotlightSweep{0%{background-position:20% 0}100%{background-position:80% 0}}

/* Phase 2: Dark Forest */
.td-shell.td-forest::before{background:
  radial-gradient(ellipse 500px 400px at 50% 20%, rgba(192,216,224,0.08), transparent),
  radial-gradient(ellipse 300px 300px at 30% 70%, rgba(26,58,26,0.5), transparent),
  radial-gradient(ellipse 200px 200px at 70% 40%, rgba(232,160,32,0.05), transparent),
  radial-gradient(circle 1px at 20% 30%, rgba(232,160,32,0.4), transparent),
  radial-gradient(circle 1px at 60% 20%, rgba(232,160,32,0.3), transparent),
  radial-gradient(circle 0.5px at 40% 80%, rgba(232,160,32,0.5), transparent),
  radial-gradient(circle 1px at 80% 60%, rgba(232,160,32,0.3), transparent),
  radial-gradient(circle 0.5px at 10% 90%, rgba(232,160,32,0.4), transparent),
  radial-gradient(circle 1px at 90% 85%, rgba(232,160,32,0.2), transparent),
  #0a1a0a}
.td-shell.td-forest::after{background:none;animation:none}
.td-shell.td-forest{border-color:rgba(26,58,26,0.5);color:#c0d8e0}

/* Firefly particles (forest only) */
.td-firefly{position:absolute;width:3px;height:3px;background:rgba(232,160,32,0.7);border-radius:50%;z-index:0;pointer-events:none;animation:td-fireflyFloat 6s ease-in-out infinite}
@keyframes td-fireflyFloat{0%{transform:translate(0,0);opacity:0.3}25%{opacity:0.8}50%{transform:translate(15px,-20px);opacity:0.5}75%{opacity:0.9}100%{transform:translate(-10px,10px);opacity:0.3}}

/* Winner phase */
.td-shell.td-winner::before{background:
  radial-gradient(ellipse 500px 400px at 50% 40%, rgba(212,160,23,0.3), transparent),
  radial-gradient(ellipse 300px 200px at 30% 70%, rgba(139,26,26,0.15), transparent),
  #1a0a0a}

/* Headers */
.td-h1{font-family:'Playfair Display','Georgia',serif;font-size:1.5rem;text-align:center;letter-spacing:4px;text-transform:uppercase;
  color:#d4a017;text-shadow:0 0 20px rgba(212,160,23,0.5),0 2px 4px rgba(0,0,0,0.5);margin:0 0 12px 0;font-weight:900}
.td-h2{font-family:'Playfair Display','Georgia',serif;font-size:1.1rem;letter-spacing:2px;color:#d4a017;margin:14px 0 8px 0;text-transform:uppercase;font-weight:700}
.td-h3{font-family:'Playfair Display','Georgia',serif;font-size:0.95rem;color:#faf0d4;margin:10px 0 6px 0;letter-spacing:1px}

/* Player card — circus poster style */
.td-poster{display:inline-flex;align-items:center;gap:8px;background:rgba(250,240,212,0.06);border:2px solid rgba(212,160,23,0.3);border-radius:6px;padding:3px 14px 3px 3px;margin:3px;position:relative;overflow:hidden;transition:border-color 0.3s}
.td-poster.td-high{border-color:#d4a017}
.td-poster.td-mid{border-color:#b8860b}
.td-poster.td-low{border-color:#8b1a1a}
.td-poster.td-winner-p{border-color:#ffd700;box-shadow:0 0 12px rgba(255,215,0,0.3)}
.td-poster-frame{width:38px;height:38px;border-radius:4px;overflow:hidden;flex-shrink:0;border:2px solid rgba(212,160,23,0.4);position:relative}
.td-poster-frame img{width:100%;height:100%;object-fit:contain;display:block}
.td-poster-name{font-size:0.82rem;font-weight:600;color:#faf0d4;white-space:nowrap;font-family:'Lora',serif}
.td-poster-tag{font-size:0.65rem;font-family:'Playfair Display',serif;padding:1px 5px;border-radius:4px;margin-left:4px;letter-spacing:1px}

/* Cards */
.td-card{background:rgba(250,240,212,0.05);border:1px solid rgba(212,160,23,0.2);border-radius:6px;padding:10px 14px;margin:6px 0;color:#faf0d4;font-size:0.88rem;line-height:1.5;position:relative}
.td-card.td-social{border:1px dashed rgba(232,160,32,0.4);background:rgba(232,160,32,0.05)}
.td-card.td-mole-card{border:1px dashed rgba(139,26,26,0.5);background:rgba(139,26,26,0.08)}
.td-card.td-success-card{border:1px solid rgba(212,160,23,0.4);background:rgba(212,160,23,0.06)}
.td-card.td-fail-card{border:1px solid rgba(139,26,26,0.3);background:rgba(139,26,26,0.06)}
.td-card.td-winner-card{border:2px solid rgba(255,215,0,0.5);background:rgba(255,215,0,0.08)}
.td-card.td-forest-card{background:rgba(26,58,26,0.15);border-color:rgba(192,216,224,0.15)}

/* ═══ ANIMATED ICONS (CSS-only, no emoji) ═══ */
.td-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:8px;vertical-align:middle;flex-shrink:0;position:relative}

/* Paw — bouncing for movement/animal */
.td-icon-paw::before{content:'';width:12px;height:10px;background:#d4a017;border-radius:50% 50% 30% 30%;animation:td-pawBounce 1.2s ease infinite}
.td-icon-paw::after{content:'';position:absolute;top:0;width:14px;height:5px;
  background:radial-gradient(circle 2.5px at 20% 50%,#d4a017,transparent 60%),
  radial-gradient(circle 2.5px at 50% 30%,#d4a017,transparent 60%),
  radial-gradient(circle 2.5px at 80% 50%,#d4a017,transparent 60%)}
@keyframes td-pawBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

/* Spotlight — pulsing circle for performance */
.td-icon-spotlight::before{content:'';width:14px;height:14px;border:2px solid #d4a017;border-radius:50%;animation:td-spotPulse 1.5s ease infinite}
.td-icon-spotlight::after{content:'';position:absolute;width:6px;height:6px;background:#faf0d4;border-radius:50%;opacity:0.6}
@keyframes td-spotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.5}}

/* Trap — snapping jaw */
.td-icon-trap::before,.td-icon-trap::after{content:'';position:absolute;width:14px;height:4px;background:#8b1a1a;border-radius:2px}
.td-icon-trap::before{top:4px;animation:td-jawTop 1s ease infinite}
.td-icon-trap::after{bottom:4px;animation:td-jawBot 1s ease infinite}
@keyframes td-jawTop{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
@keyframes td-jawBot{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

/* Compass — spinning needle */
.td-icon-compass::before{content:'';width:14px;height:14px;border:2px solid rgba(192,216,224,0.5);border-radius:50%}
.td-icon-compass::after{content:'';position:absolute;width:2px;height:10px;background:linear-gradient(to top,#8b1a1a 50%,#c0d8e0 50%);border-radius:1px;animation:td-compassSpin 3s linear infinite}
@keyframes td-compassSpin{to{transform:rotate(360deg)}}

/* Tree — swaying */
.td-icon-tree::before{content:'';width:3px;height:10px;background:#3a2a1a;position:absolute;bottom:2px}
.td-icon-tree::after{content:'';width:12px;height:10px;background:#1a3a1a;clip-path:polygon(50% 0%,100% 100%,0% 100%);position:absolute;top:0;animation:td-treeSway 2s ease-in-out infinite alternate}
@keyframes td-treeSway{0%{transform:rotate(-3deg)}100%{transform:rotate(3deg)}}

/* Star — rotating */
.td-icon-star::before{content:'';width:14px;height:14px;background:#d4a017;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:td-starSpin 2s linear infinite}
@keyframes td-starSpin{to{transform:rotate(360deg)}}

/* Skull — pulsing */
.td-icon-skull::before{content:'';width:14px;height:14px;border:2px solid #8b1a1a;border-radius:50% 50% 40% 40%;animation:td-skullGlow 1.5s ease infinite}
.td-icon-skull::after{content:'';position:absolute;width:8px;height:3px;border-top:2px solid #8b1a1a;bottom:3px}
@keyframes td-skullGlow{0%,100%{box-shadow:0 0 4px rgba(139,26,26,0.3)}50%{box-shadow:0 0 12px rgba(139,26,26,0.8)}}

/* Heart — beating */
.td-icon-heart::before{content:'';width:14px;height:13px;background:#ec4899;clip-path:polygon(50% 100%,0% 35%,0% 15%,25% 0%,50% 15%,75% 0%,100% 15%,100% 35%);animation:td-heartbeat 1s ease infinite}
@keyframes td-heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}

/* Whip — cracking */
.td-icon-whip::before{content:'';width:3px;height:14px;background:linear-gradient(to top,#3a2a1a,#b8860b);border-radius:1px;animation:td-whipCrack 1s ease infinite}
@keyframes td-whipCrack{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}}

/* Lantern — glowing */
.td-icon-lantern::before{content:'';width:10px;height:12px;border:2px solid #e8a020;border-radius:3px 3px 5px 5px;background:rgba(232,160,32,0.2);animation:td-lanternGlow 2s ease infinite}
.td-icon-lantern::after{content:'';position:absolute;width:4px;height:3px;background:#e8a020;top:3px;border-radius:50%;animation:td-lanternFlicker 0.5s ease infinite alternate}
@keyframes td-lanternGlow{0%,100%{box-shadow:0 0 4px rgba(232,160,32,0.3)}50%{box-shadow:0 0 12px rgba(232,160,32,0.7)}}
@keyframes td-lanternFlicker{0%{opacity:0.6;transform:scaleY(1)}100%{opacity:1;transform:scaleY(1.2)}}

/* Claw — slashing */
.td-icon-claw::before,.td-icon-claw::after{content:'';position:absolute;width:2px;height:12px;background:#8b1a1a;border-radius:1px;animation:td-clawSlash 0.8s ease infinite}
.td-icon-claw::before{transform:rotate(-15deg);left:5px}
.td-icon-claw::after{transform:rotate(15deg);right:5px}
@keyframes td-clawSlash{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(-30deg) translateX(-1px)}}

/* Ribbon — flowing */
.td-icon-ribbon::before{content:'';width:14px;height:8px;background:linear-gradient(90deg,#d4a017,#ffd700);border-radius:0 4px 4px 0;animation:td-ribbonFlow 1.5s ease infinite alternate}
@keyframes td-ribbonFlow{0%{transform:scaleX(1) skewY(0deg)}100%{transform:scaleX(1.1) skewY(3deg)}}

/* Eye — blinking */
.td-icon-eye::before{content:'';width:16px;height:10px;border:2px solid #8b1a1a;border-radius:50%;animation:td-blink 3s ease infinite}
.td-icon-eye::after{content:'';position:absolute;width:6px;height:6px;background:#8b1a1a;border-radius:50%;animation:td-blink 3s ease infinite}
@keyframes td-blink{0%,42%,46%,100%{transform:scaleY(1)}44%{transform:scaleY(0.1)}}

/* Mask — for villain */
.td-icon-mask::before{content:'';width:14px;height:10px;border:2px solid #8b1a1a;border-radius:50% 50% 30% 30%;background:rgba(139,26,26,0.2)}
.td-icon-mask::after{content:'';position:absolute;width:10px;height:3px;border-bottom:2px solid #8b1a1a;border-radius:0 0 50% 50%;bottom:2px}

/* Shield — for help/ally */
.td-icon-shield::before{content:'';width:12px;height:14px;background:rgba(212,160,23,0.3);border:2px solid #d4a017;border-radius:3px 3px 50% 50%;clip-path:polygon(0% 0%,100% 0%,100% 65%,50% 100%,0% 65%)}

@media(prefers-reduced-motion:reduce){
  .td-icon-paw::before,.td-icon-spotlight::before,.td-icon-trap::before,.td-icon-trap::after,
  .td-icon-compass::after,.td-icon-tree::after,.td-icon-star::before,.td-icon-skull::before,
  .td-icon-heart::before,.td-icon-whip::before,.td-icon-lantern::before,.td-icon-lantern::after,
  .td-icon-claw::before,.td-icon-claw::after,.td-icon-ribbon::before,
  .td-icon-eye::before,.td-icon-eye::after{animation:none!important}
}

/* Progress bar */
.td-bar-wrap{height:8px;background:rgba(212,160,23,0.1);border-radius:4px;overflow:hidden;margin:4px 0}
.td-bar{height:100%;border-radius:4px;transition:width 0.4s ease}
.td-bar.td-gold{background:linear-gradient(90deg,#d4a017,#ffd700)}
.td-bar.td-green{background:linear-gradient(90deg,#2d8a4e,#4caf50)}
.td-bar.td-crimson{background:linear-gradient(90deg,#8b1a1a,#c62828)}
.td-bar.td-amber{background:linear-gradient(90deg,#e8a020,#f9a825)}

/* Reveal controls (Layer 8) */
.td-reveal-bar{display:flex;gap:8px;align-items:center;justify-content:center;padding:12px 20px;flex-wrap:wrap;position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:100;background:rgba(26,10,10,0.92);backdrop-filter:blur(8px);border-top:1px solid rgba(212,160,23,0.3);border-radius:12px 12px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,0.5);max-width:860px;width:100%}
.td-btn{font-family:'Playfair Display',serif;font-size:0.78rem;padding:5px 14px;border:1px solid rgba(212,160,23,0.3);border-radius:4px;background:rgba(212,160,23,0.1);color:#d4a017;cursor:pointer;letter-spacing:1px;transition:all 0.2s;text-transform:uppercase}
.td-btn:hover{background:rgba(212,160,23,0.2);border-color:#d4a017}
.td-btn.td-btn-crimson{border-color:rgba(139,26,26,0.4);background:rgba(139,26,26,0.15);color:#ff6b6b}
.td-btn.td-btn-crimson:hover{background:rgba(139,26,26,0.25);border-color:#8b1a1a}

/* Step visibility */
.td-step{opacity:0;max-height:0;overflow:hidden;transition:opacity 0.4s,max-height 0.5s}
.td-step.td-visible{opacity:1;max-height:4000px}

/* Host line */
.td-host{font-style:italic;color:#d4a017;margin:8px 0;padding:8px 12px;border-left:3px solid rgba(212,160,23,0.4);background:rgba(212,160,23,0.04);font-size:0.88rem;border-radius:0 6px 6px 0}

/* Sidebar */
.td-sb-title{font-family:'Playfair Display',serif;font-size:0.75rem;letter-spacing:2px;color:#d4a017;text-transform:uppercase;margin:0 0 6px 0;padding-bottom:4px;border-bottom:1px solid rgba(212,160,23,0.2);font-weight:700}
.td-sb-section{margin:10px 0}
.td-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.78rem}
.td-sb-row img{width:22px;height:22px;border-radius:4px;object-fit:contain;flex-shrink:0;border:1.5px solid rgba(212,160,23,0.3)}
.td-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#faf0d4}
.td-sb-tag{font-family:'Playfair Display',serif;font-size:0.6rem;padding:1px 4px;border-radius:3px;white-space:nowrap;letter-spacing:0.5px}
.td-sb-tag.td-gold{background:rgba(212,160,23,0.15);color:#d4a017}
.td-sb-tag.td-green{background:rgba(45,138,78,0.15);color:#4caf50}
.td-sb-tag.td-crimson{background:rgba(139,26,26,0.15);color:#ff6b6b}
.td-sb-tag.td-amber{background:rgba(232,160,32,0.15);color:#e8a020}
.td-sb-tag.td-grey{background:rgba(200,200,200,0.1);color:#888}
.td-sb-tag.td-brass{background:rgba(184,134,11,0.15);color:#b8860b}
.td-sb-tag.td-crown{background:rgba(255,215,0,0.2);color:#ffd700}

/* ═══ OVERDRIVE: Ringmaster HUD (Layer 2) ═══ */
.td-hud{font-family:'Playfair Display',serif;font-size:0.65rem;color:#8a7a4a;background:rgba(26,10,10,0.7);border-bottom:1px solid rgba(212,160,23,0.3);padding:4px 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;z-index:2;position:relative;letter-spacing:1px}
.td-hud-act{white-space:nowrap;font-weight:700;color:#b8860b}
.td-hud-label{flex:1;text-align:center;white-space:nowrap;letter-spacing:2px;color:#d4a017}
.td-hud-sub{white-space:nowrap;color:#8a7a4a}
.td-hud-dots{display:flex;gap:2px;align-items:center;flex-wrap:wrap}
.td-hud-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.td-hud-dot.td-compat-high{background:#d4a017}
.td-hud-dot.td-compat-mid{background:#b8860b}
.td-hud-dot.td-compat-low{background:#8b1a1a}

/* ═══ OVERDRIVE: Comm Chatter (Layer 3) ═══ */
.td-comm{font-style:italic;font-size:0.72rem;color:#8a7a4a;border-left:2px solid rgba(212,160,23,0.3);padding:4px 10px;margin:6px 0 6px 12px;line-height:1.4;font-family:'Playfair Display',serif}

/* ═══ OVERDRIVE: Zone Transition (Layer 4) ═══ */
.td-transition{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:none}
.td-transition.td-trans-curtain-rise{background:linear-gradient(180deg,rgba(139,26,26,0.8),rgba(26,10,10,0.9));animation:td-curtainRise 2s ease-out forwards}
@keyframes td-curtainRise{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-100%);visibility:hidden}}
.td-transition.td-trans-forest-enter{background:rgba(10,26,10,0.95);animation:td-forestFadeIn 2.5s ease-out forwards}
.td-trans-forest-text{font-family:'Playfair Display',serif;font-size:1.5rem;color:#c0d8e0;letter-spacing:4px;text-shadow:0 0 20px rgba(192,216,224,0.4)}
@keyframes td-forestFadeIn{0%{opacity:1}70%{opacity:0.6}100%{opacity:0;visibility:hidden}}
.td-transition.td-trans-winner-burst{background:radial-gradient(circle,rgba(255,215,0,0.6),transparent 70%);animation:td-winnerBurst 2s ease-out forwards}
@keyframes td-winnerBurst{0%{opacity:1;transform:scale(0.5)}40%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(2);visibility:hidden}}

/* ═══ OVERDRIVE: Viewport Window (Layer 5) ═══ */
.td-viewport{width:80px;height:60px;margin:0 auto 8px;border-radius:6px;border:2px solid rgba(212,160,23,0.25);overflow:hidden;position:relative;background:#1a0a0a}
.td-viewport-circus{position:absolute;inset:0;
  background:
    radial-gradient(ellipse 30px 50px at 50% 60%, rgba(139,26,26,0.4), transparent),
    radial-gradient(circle 3px at 50% 20%, rgba(255,248,220,0.5), transparent),
    #1a0a0a}
.td-viewport-circus::after{content:'';position:absolute;width:20px;height:50px;top:5px;
  background:radial-gradient(ellipse 10px 25px at 50% 50%, rgba(255,248,220,0.15), transparent);
  animation:td-vpSpotlight 4s ease-in-out infinite alternate}
@keyframes td-vpSpotlight{0%{left:10px}100%{left:50px}}
.td-viewport-forest{position:absolute;inset:0;
  background:
    radial-gradient(ellipse 40px 20px at 50% 15%, rgba(192,216,224,0.2), transparent),
    linear-gradient(180deg,#0a1a0a,#1a3a1a);
  overflow:hidden}
.td-viewport-forest::after{content:'';position:absolute;inset:0;
  background:
    radial-gradient(circle 1px at 20% 40%, rgba(232,160,32,0.6), transparent),
    radial-gradient(circle 1px at 60% 30%, rgba(232,160,32,0.4), transparent),
    radial-gradient(circle 1px at 40% 70%, rgba(232,160,32,0.5), transparent),
    radial-gradient(circle 1px at 80% 50%, rgba(232,160,32,0.3), transparent);
  animation:td-vpFireflies 3s ease-in-out infinite alternate}
@keyframes td-vpFireflies{0%{opacity:0.3;transform:translateY(0)}100%{opacity:0.8;transform:translateY(-3px)}}

/* ═══ OVERDRIVE: Card Physics (Layer 6) ═══ */
/* Phase 1: spotlight wobble */
.td-shell:not(.td-forest):not(.td-winner) .td-card{animation:td-cardSpotlight 3s ease-in-out infinite}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(2n){animation-delay:0.4s;animation-duration:3.3s}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(3n){animation-delay:0.8s;animation-duration:2.8s}
@keyframes td-cardSpotlight{0%,100%{transform:scale(1)}50%{transform:scale(1.005)}}

/* Scorecard flip for judging */
.td-scoreflip{animation:td-flipIn 0.6s ease-out forwards}
@keyframes td-flipIn{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0deg);opacity:1}}

/* Phase 2: forest sway */
.td-shell.td-forest .td-card{animation:td-cardSway 3s ease-in-out infinite}
.td-shell.td-forest .td-card:nth-child(2n){animation-delay:0.3s;animation-duration:3.4s}
.td-shell.td-forest .td-card:nth-child(3n){animation-delay:0.7s;animation-duration:2.7s}
@keyframes td-cardSway{0%,100%{transform:translateX(0) rotate(0deg)}50%{transform:translateX(2px) rotate(0.3deg)}}

.td-step .td-card{animation-play-state:paused}
.td-step.td-visible .td-card{animation-play-state:running}

/* ═══ OVERDRIVE: Telemetry Ticker (Layer 7) ═══ */
.td-ticker{font-family:'Playfair Display',serif;font-size:0.6rem;color:#6a5a3a;background:rgba(26,10,10,0.6);border-top:1px solid rgba(212,160,23,0.3);padding:2px 0;overflow:hidden;white-space:nowrap;position:relative;z-index:2;height:16px;letter-spacing:1px}
.td-ticker-text{display:inline-block;animation:td-tickerScroll 25s linear infinite;padding-left:100%}
@keyframes td-tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}

/* Leaderboard */
.td-lb-row{display:flex;align-items:center;gap:6px;padding:4px 8px;margin:2px 0;border-radius:4px;font-size:0.85rem}
.td-lb-row.td-first{background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3)}
.td-lb-rank{font-family:'Playfair Display',serif;width:24px;text-align:center;color:#d4a017;font-weight:700}
.td-lb-name{flex:1;color:#faf0d4}
.td-lb-score{font-family:'Playfair Display',serif;color:#d4a017;font-size:0.8rem}

/* Trail map (sidebar) */
.td-trail{display:flex;flex-direction:column;gap:1px;margin:6px 0}
.td-trail-seg{height:14px;display:flex;align-items:center;gap:3px;padding:0 4px;border-radius:2px;font-size:0.55rem;font-family:'Playfair Display',serif;color:#6a5a3a;background:rgba(26,58,26,0.15);border:1px solid rgba(26,58,26,0.2);position:relative}
.td-trail-seg.td-reached{background:rgba(45,138,78,0.1);border-color:rgba(45,138,78,0.3)}
.td-trail-seg.td-finish{background:rgba(255,215,0,0.1);border-color:rgba(255,215,0,0.3)}
.td-trail-dot{width:6px;height:6px;border-radius:50%;border:1px solid #faf0d4;position:absolute;right:4px}

/* Compat bar in sidebar */
.td-compat-bar{height:6px;border-radius:3px;background:rgba(212,160,23,0.1);overflow:hidden;margin:2px 0 0 27px}
.td-compat-fill{height:100%;border-radius:3px}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .td-shell::before,.td-shell::after{animation:none!important}
  .td-h1,.td-firefly,.td-transition{animation:none!important;transform:none!important}
  .td-transition{opacity:0!important;visibility:hidden!important}
  .td-transition::before,.td-transition::after{animation:none!important}
  .td-step{transition:none!important}
  .td-bar{transition:none!important}
  .td-viewport-circus::after,.td-viewport-forest::after{animation:none!important}
  .td-ticker-text{animation:none!important;padding-left:0}
  .td-card{animation:none!important;filter:none!important;opacity:1!important;transform:none!important}
  .td-scoreflip{animation:none!important;transform:none!important;opacity:1!important}
  .td-spotlightSweep{animation:none!important}
}
</style>`;
}

// ══════════════════════════════════════════════════════════════
// PLAYER POSTER BUILDER
// ══════════════════════════════════════════════════════════════
function _poster(name, statusCls = '', tag = '') {
  const sl = slug(name);
  return `<span class="td-poster ${statusCls}">
    <span class="td-poster-frame"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.style.display='none'"></span>
    <span class="td-poster-name">${name}</span>${tag ? `<span class="td-poster-tag ${tag.cls || ''}">${tag.text}</span>` : ''}
  </span>`;
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _buildHUD(phaseCls, ep) {
  if (!phaseCls) return '';
  const hud = HUD_DATA[phaseCls] || HUD_DATA[''];

  // Compat dots from assignments
  let dotsHtml = '';
  const data = ep.topDog;
  if (data?.phase1?.assignments) {
    data.phase1.assignments.forEach(a => {
      const cls = a.compatibility >= 6.5 ? 'td-compat-high' : a.compatibility >= 4 ? 'td-compat-mid' : 'td-compat-low';
      dotsHtml += `<span class="td-hud-dot ${cls}" title="${a.player}: ${a.compatibility.toFixed(1)}"></span>`;
    });
  }

  return `<div class="td-hud">
    <span class="td-hud-act">${hud.act}</span>
    <span class="td-hud-label">${hud.label}</span>
    <span class="td-hud-sub">${hud.sub}</span>
    <span class="td-hud-dots">${dotsHtml}</span>
  </div>`;
}

function _buildTransition(phaseCls) {
  if (phaseCls === 'td-circus-assign' || phaseCls === 'td-circus-training' || phaseCls === 'td-circus-judging') {
    return `<div class="td-transition td-trans-curtain-rise"></div>`;
  }
  if (phaseCls === 'td-forest') {
    return `<div class="td-transition td-trans-forest-enter"><span class="td-trans-forest-text">INTO THE FOREST</span></div>`;
  }
  if (phaseCls === 'td-winner') {
    return `<div class="td-transition td-trans-winner-burst"></div>`;
  }
  return '';
}

function _buildTicker(phaseCls) {
  const text = TELEMETRY_DATA[phaseCls];
  if (!text) return '';
  return `<div class="td-ticker"><span class="td-ticker-text">${text}  ◆  ${text}</span></div>`;
}

function _buildFireflies() {
  let html = '';
  for (let i = 0; i < 12; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 6).toFixed(1);
    const dur = (4 + Math.random() * 4).toFixed(1);
    html += `<div class="td-firefly" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  return html;
}

function _shell(content, ep, phaseCls = '') {
  window._tdData = ep.topDog;
  window._tdEp = ep;
  const isForest = phaseCls === 'td-forest';
  const shellCls = isForest ? 'td-forest' : phaseCls === 'td-winner' ? 'td-winner' : '';
  return `${_css()}<div class="td-shell ${shellCls}" data-phase="${phaseCls}">
    ${_buildTransition(phaseCls)}
    ${isForest ? _buildFireflies() : ''}
    <div class="td-main">${_buildHUD(phaseCls, ep)}${content}${_buildTicker(phaseCls)}</div>
    <div class="td-sidebar" id="td-sidebar">${_buildSidebarContent(ep.topDog, phaseCls, ep)}</div>
  </div>`;
}


// ══════════════════════════════════════════════════════════════
// SIDEBAR CONTENT (Layer 9 — Interactive, gated by _tvState)
// ══════════════════════════════════════════════════════════════
function _buildViewport(phaseCls) {
  const isForest = phaseCls === 'td-forest';
  return `<div class="td-viewport">
    ${isForest ? '<div class="td-viewport-forest"></div>' : '<div class="td-viewport-circus"></div>'}
  </div>`;
}

function _buildSidebarContent(data, phase, ep) {
  if (!data) return '<div class="td-sb-title">NO DATA</div>';

  if (phase === 'td-circus-assign') return _buildViewport(phase) + _sidebarAssignment(data);
  if (phase === 'td-circus-training') return _buildViewport(phase) + _sidebarTraining(data);
  if (phase === 'td-circus-judging') return _buildViewport(phase) + _sidebarJudging(data);
  if (phase === 'td-forest') return _buildViewport(phase) + _sidebarForest(data);
  if (phase === 'td-winner') return _buildViewport(phase) + _sidebarWinner(data, ep);
  // Title card
  return _sidebarRoster(data);
}

function _sidebarRoster(data) {
  let h = '<div class="td-sb-title">CAST ROSTER</div>';
  const assignments = data.phase1?.assignments || [];
  assignments.forEach(a => {
    const sl = slug(a.player);
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-gold">CAST</span></div>`;
  });
  h += `<div class="td-sb-section"><div class="td-sb-title">CHALLENGE BRIEF</div><div style="font-size:0.72rem;color:#b8860b;line-height:1.4">Phase 1: Train your animal + perform for judges. Phase 2: Race through the forest. First to the exit wins immunity.</div></div>`;
  return h;
}

function _sidebarAssignment(data) {
  const st = _tvState['td-assign'];
  const revIdx = st ? st.idx : -1;
  const assignments = data.phase1?.assignments || [];

  let h = '<div class="td-sb-title">ANIMAL DRAFT</div>';
  assignments.forEach((a, i) => {
    const sl = slug(a.player);
    const revealed = i <= revIdx;
    if (revealed) {
      const pct = Math.round(a.compatibility * 10);
      const barCls = a.compatibility >= 6.5 ? 'td-gold' : a.compatibility >= 4 ? 'td-amber' : 'td-crimson';
      const animal = a.animal;
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-gold">${animal.name}</span></div>`;
      h += `<div class="td-compat-bar"><div class="td-compat-fill ${barCls}" style="width:${pct}%"></div></div>`;
    } else {
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-grey">???</span></div>`;
    }
  });
  return h;
}

function _sidebarTraining(data) {
  const st = _tvState['td-training'];
  const revIdx = st ? st.idx : -1;
  const assignments = data.phase1?.assignments || [];
  const rounds = data.phase1?.trainingRounds || [];
  const roundsRevealed = revIdx + 1;

  let h = `<div class="td-sb-title">TRAINER'S SCOREBOARD</div>`;
  h += `<div style="text-align:center;font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a;margin:4px 0">ROUND ${Math.min(roundsRevealed, rounds.length)} / ${rounds.length}</div>`;

  assignments.forEach(a => {
    const sl = slug(a.player);
    // Count successes up to revealed rounds
    let successes = 0;
    for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
      const res = rounds[r].results?.find(rr => rr.player === a.player);
      if (res?.outcome === 'success') successes++;
    }
    const total = Math.min(roundsRevealed, rounds.length);
    const pct = total > 0 ? Math.round((successes / total) * 100) : 0;
    const barCls = pct >= 75 ? 'td-gold' : pct >= 50 ? 'td-amber' : 'td-crimson';

    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag ${pct >= 75 ? 'td-gold' : pct >= 50 ? 'td-amber' : 'td-crimson'}">${successes}/${total}</span></div>`;
    h += `<div class="td-compat-bar"><div class="td-compat-fill ${barCls}" style="width:${pct}%"></div></div>`;
  });
  return h;
}

function _sidebarJudging(data) {
  const st = _tvState['td-judging'];
  const revIdx = st ? st.idx : -1;
  const perfs = data.phase1?.performances || [];

  let h = '<div class="td-sb-title">JUDGE SCORES</div>';
  // Build leaderboard gated by reveal
  const revealed = perfs.filter((_, i) => i <= revIdx);
  const sorted = [...revealed].sort((a, b) => b.total - a.total);
  sorted.forEach((p, i) => {
    const sl = slug(p.player);
    const animal = p.animalObj || {};
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${p.player}" onerror="this.style.display='none'"><span class="td-sb-name">${p.player}</span><span class="td-sb-tag td-gold">${p.total}/20</span></div>`;
  });
  // Unrevealed
  perfs.forEach((p, i) => {
    if (i > revIdx) {
      const sl = slug(p.player);
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${p.player}" onerror="this.style.display='none'"><span class="td-sb-name">${p.player}</span><span class="td-sb-tag td-grey">???</span></div>`;
    }
  });
  return h;
}

function _sidebarForest(data) {
  const st = _tvState['td-forest-race'];
  const revIdx = st ? st.idx : -1;
  const rounds = data.phase2?.rounds || [];
  const roundsRevealed = revIdx + 1;
  const positions = data.phase2?.positions || {};
  const assignments = data.phase1?.assignments || [];

  let h = '<div class="td-sb-title">TRAIL MAP</div>';

  // Trail segments
  h += '<div class="td-trail">';
  for (let seg = FOREST_LENGTH; seg >= 0; seg--) {
    const isFinish = seg === FOREST_LENGTH;
    let segCls = isFinish ? 'td-finish' : '';

    // Player dots at this segment (based on revealed positions)
    let dots = '';
    if (roundsRevealed > 0) {
      assignments.forEach(a => {
        // Calculate position from revealed rounds
        let pos = 0;
        const performances = data.phase1?.performances || [];
        const perfIdx = performances.findIndex(p => p.player === a.player);
        if (perfIdx === 0) pos = 3;
        else if (perfIdx === 1) pos = 2;
        else if (perfIdx === 2) pos = 1;

        for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
          const mov = rounds[r].movements?.find(m => m.player === a.player);
          if (mov) pos = mov.position;
        }

        const playerSeg = Math.min(FOREST_LENGTH, Math.floor(pos));
        if (playerSeg === seg) {
          const sl = slug(a.player);
          const color = a.compatibility >= 6.5 ? '#d4a017' : a.compatibility >= 4 ? '#b8860b' : '#8b1a1a';
          dots += `<span class="td-trail-dot" style="background:${color}" title="${a.player}"></span>`;
          segCls += ' td-reached';
        }
      });
    }

    h += `<div class="td-trail-seg ${segCls}">${isFinish ? 'EXIT' : seg}${dots}</div>`;
  }
  h += '</div>';

  return h;
}

function _sidebarWinner(data, ep) {
  let h = '<div class="td-sb-title">FINAL RANKINGS</div>';
  const finishOrder = data.phase2?.finishOrder || [];
  const winner = data.immunityWinner;
  const scores = ep?.chalMemberScores || {};

  finishOrder.forEach((n, i) => {
    const sl = slug(n);
    const isWinner = n === winner;
    let tag = '';
    if (isWinner) tag = '<span class="td-sb-tag td-crown">IMMUNE</span>';
    else tag = `<span class="td-sb-tag td-gold">#${i + 1}</span>`;
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="td-sb-name">${n}</span>${tag}</div>`;
  });

  return h;
}


// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogTitleCard(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const assignments = data.phase1?.assignments || [];

  // Animal silhouettes ring
  const animalRing = assignments.map((a, i) => {
    const angle = (i / assignments.length) * 360;
    const radius = 80;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius;
    return `<span style="position:absolute;left:calc(50% + ${x}px - 10px);top:calc(50% + ${y}px - 10px);font-size:1.2rem;opacity:0.4">${a.animal.icon}</span>`;
  }).join('');

  let posters = assignments.map(a => `<div style="display:inline-block;margin:2px">${_poster(a.player, 'td-high')}</div>`).join('');

  const content = `
    <div class="td-h1" style="font-size:2.2rem;margin:20px 0 6px">TOP DOG</div>
    <div style="text-align:center;font-family:'Playfair Display',serif;font-size:0.8rem;color:#b8860b;letter-spacing:4px;margin-bottom:16px;text-transform:uppercase">Immunity Challenge</div>
    <div class="td-host">${data.hostOpening || ''}</div>
    <div style="text-align:center;margin:16px 0;position:relative;height:200px">
      <div style="position:relative;width:200px;height:200px;margin:0 auto">${animalRing}</div>
    </div>
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#d4a017;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase">Cast</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px">${posters}</div>
    </div>
    <div style="margin-top:16px;text-align:center">
      <div class="td-card" style="display:inline-block;max-width:420px;text-align:left">
        <div class="td-h3">Challenge Rules</div>
        <div style="font-size:0.82rem;line-height:1.6;color:#b8860b">
          <b style="color:#d4a017">Phase 1</b> — Animal Draft + Training + Judged Performance<br>
          <b style="color:#8b1a1a">Phase 2</b> — Forest Race (14 segments to the exit)<br>
          <span style="color:#ffd700">Top performance score = head start in the race. First to exit wins immunity.</span>
        </div>
      </div>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders['td-title'] = rpBuildTopDogTitleCard;
  return _shell(content, ep, '');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 2: ANIMAL ASSIGNMENT
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogAssignment(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const assignments = data.phase1?.assignments || [];
  const totalSteps = assignments.length;
  const stKey = 'td-assign';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';
  assignments.forEach((a, i) => {
    const vis = i <= st.idx ? 'td-visible' : '';
    const pct = Math.round(a.compatibility * 10);
    const barCls = a.compatibility >= 6.5 ? 'td-gold' : a.compatibility >= 4 ? 'td-amber' : 'td-crimson';
    const posterCls = a.compatibility >= 6.5 ? 'td-high' : a.compatibility >= 4 ? 'td-mid' : 'td-low';

    // Archetype bonus/penalty description
    const playerArch = arch(a.player);
    let bonusText = '';
    if (a.compatibility >= 7) bonusText = `<span style="color:#d4a017;font-size:0.75rem"> — Natural affinity!</span>`;
    else if (a.compatibility <= 3) bonusText = `<span style="color:#8b1a1a;font-size:0.75rem"> — This could be trouble...</span>`;

    steps += `<div class="td-step ${vis}" data-step="${i}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        ${_poster(a.player, posterCls, { text: a.animal.name, cls: 'td-gold' })}
        <div style="flex:1">
          <div style="font-size:0.78rem;color:#b8860b;font-family:'Playfair Display',serif">
            ${a.animal.icon} ${a.animal.name} — Danger: ${'★'.repeat(a.animal.danger)}${'☆'.repeat(5 - a.animal.danger)} — ${a.animal.temperament}${bonusText}
          </div>
          <div style="font-size:0.7rem;color:#8a7a4a;font-family:'Playfair Display',serif;letter-spacing:1px">COMPATIBILITY: ${a.compatibility.toFixed(1)}/10</div>
          <div class="td-bar-wrap"><div class="td-bar ${barCls}" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="td-card">${_icon(a.compatibility >= 5.5 ? 'heart' : 'claw')}${a.reactionText}</div>
    </div>`;

    // Comm chatter between reveals
    if (i > 0 && i % 3 === 0) {
      const chatter = _pickChatter('td-circus', 1);
      if (chatter.length) steps += `<div class="td-step ${vis}" data-step="${i}">${_commDiv(chatter[0])}</div>`;
    }
  });

  const content = `
    <div class="td-h1">Animal Draft</div>
    <div style="text-align:center;font-family:'Playfair Display',serif;font-size:0.75rem;color:#8a7a4a;letter-spacing:2px;margin-bottom:10px">PRIORITY PICK — HIGHEST SOCIAL+BOLDNESS DRAFTS FIRST</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div class="td-reveal-bar">
      <button class="td-btn" onclick="tdRevealNext('${stKey}',${totalSteps})">Next Draft Pick &#9654;</button>
      <button class="td-btn td-btn-crimson" onclick="tdRevealAll('${stKey}',${totalSteps})">Reveal All &#9193;</button>
      <span id="td-counter-${stKey}" style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogAssignment;
  return _shell(content, ep, 'td-circus-assign');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 3: TRAINING MONTAGE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogTraining(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.phase1?.trainingRounds || [];
  const assignments = data.phase1?.assignments || [];
  const totalSteps = rounds.length;
  const stKey = 'td-training';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  rounds.forEach((round, i) => {
    const vis = i <= st.idx ? 'td-visible' : '';

    // Training results for each player
    let resultCards = (round.results || []).map(r => {
      const assign = assignments.find(a => a.player === r.player);
      const animal = assign?.animal || { name: '?', icon: '?' };
      const cardCls = r.outcome === 'success' ? 'td-success-card' : r.outcome === 'critical_failure' ? 'td-fail-card' : '';
      const iconType = r.outcome === 'success' ? 'star' : r.outcome === 'critical_failure' ? 'skull' : 'whip';
      const posterCls = r.outcome === 'success' ? 'td-high' : r.outcome === 'critical_failure' ? 'td-low' : 'td-mid';

      return `<div class="td-card ${cardCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_poster(r.player, posterCls, { text: animal.name, cls: r.outcome === 'success' ? 'td-gold' : 'td-crimson' })}
          ${_icon(iconType)}
          <span style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a;text-transform:uppercase;letter-spacing:1px">${r.outcome.replace('_', ' ')}</span>
        </div>
        <div style="font-size:0.84rem">${r.text}</div>
      </div>`;
    }).join('');

    // Social events for this round
    let socHtml = (round.socialEvents || []).map(se => {
      return `<div class="td-card td-social">${_icon(se.type)}${se.text}</div>`;
    }).join('');

    // Mole action
    let moleHtml = '';
    if (round.moleAction) {
      moleHtml = `<div class="td-card td-mole-card">${_icon('mole')}${round.moleAction.text}</div>`;
    }

    // Comm chatter
    let chatter = '';
    if (i > 0 && i % 2 === 0) {
      const ch = _pickChatter('td-circus', 1);
      if (ch.length) chatter = _commDiv(ch[0]);
    }

    steps += `<div class="td-step ${vis}" data-step="${i}">
      ${chatter}
      <div class="td-h2">Round ${round.round} <span style="font-size:0.7rem;color:#8a7a4a">${i + 1}/${totalSteps}</span></div>
      ${resultCards}${socHtml}${moleHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1">Training Montage</div>
    <div class="td-host">${data.hostTrainingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div class="td-reveal-bar">
      <button class="td-btn" onclick="tdRevealNext('${stKey}',${totalSteps})">Next Round &#9654;</button>
      <button class="td-btn td-btn-crimson" onclick="tdRevealAll('${stKey}',${totalSteps})">Reveal All &#9193;</button>
      <span id="td-counter-${stKey}" style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogTraining;
  return _shell(content, ep, 'td-circus-training');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 4: JUDGING PERFORMANCE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogJudging(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const perfs = data.phase1?.performances || [];
  const totalSteps = perfs.length;
  const stKey = 'td-judging';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  perfs.forEach((p, i) => {
    const vis = i <= st.idx ? 'td-visible' : '';
    const animal = p.animalObj || { name: '?', icon: '?' };
    const posterCls = p.tier === 'standingOvation' || p.tier === 'impressed' ? 'td-high' : p.tier === 'meh' ? 'td-mid' : 'td-low';
    const scoreColor = p.total >= 16 ? '#ffd700' : p.total >= 12 ? '#d4a017' : p.total >= 8 ? '#b8860b' : '#8b1a1a';

    steps += `<div class="td-step ${vis}" data-step="${i}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${_poster(p.player, posterCls, { text: animal.name, cls: 'td-gold' })}
        ${_icon(p.tier)}
      </div>
      <div class="td-card">${_icon('spotlight')}${p.perfText}</div>
      <div style="display:flex;gap:8px;margin:6px 0;flex-wrap:wrap">
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(212,160,23,0.4)">
          <div style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a;letter-spacing:1px;text-transform:uppercase">Chris</div>
          <div style="font-family:'Playfair Display',serif;font-size:2rem;color:${scoreColor};font-weight:900;text-shadow:0 0 10px ${scoreColor}40">${p.chrisScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chrisText}</div>
        </div>
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(212,160,23,0.4);animation-delay:0.2s">
          <div style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a;letter-spacing:1px;text-transform:uppercase">Chef</div>
          <div style="font-family:'Playfair Display',serif;font-size:2rem;color:${scoreColor};font-weight:900;text-shadow:0 0 10px ${scoreColor}40">${p.chefScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chefText}</div>
        </div>
      </div>
      <div style="text-align:center;font-family:'Playfair Display',serif;font-size:1.2rem;color:${scoreColor};font-weight:900;letter-spacing:2px">TOTAL: ${p.total}/20</div>
    </div>`;

    // Comm chatter
    if (i > 0 && i % 2 === 1) {
      const ch = _pickChatter('td-circus', 1);
      if (ch.length) steps += `<div class="td-step ${vis}" data-step="${i}">${_commDiv(ch[0])}</div>`;
    }
  });

  const content = `
    <div class="td-h1">Grand Performance</div>
    <div class="td-host">${data.hostJudgingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div class="td-reveal-bar">
      <button class="td-btn" onclick="tdRevealNext('${stKey}',${totalSteps})">Next Performance &#9654;</button>
      <button class="td-btn td-btn-crimson" onclick="tdRevealAll('${stKey}',${totalSteps})">Reveal All &#9193;</button>
      <span id="td-counter-${stKey}" style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#8a7a4a">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogJudging;
  return _shell(content, ep, 'td-circus-judging');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 5: FOREST RACE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogForest(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.phase2?.rounds || [];
  const totalSteps = rounds.length;
  const stKey = 'td-forest-race';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  rounds.forEach((round, i) => {
    const vis = i <= st.idx ? 'td-visible' : '';

    // Movement cards
    let moveCards = (round.movements || []).map(m => {
      const assign = data.phase1.assignments.find(a => a.player === m.player);
      const animal = assign?.animal || { name: '?', icon: '?' };
      const speedCls = m.moveType === 'fast' ? 'td-success-card' : m.moveType === 'slow' ? 'td-fail-card' : '';
      const posText = `Segment ${Math.floor(m.position)}/${FOREST_LENGTH}`;

      return `<div class="td-card td-forest-card ${speedCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          ${_poster(m.player, m.moveType === 'fast' ? 'td-high' : m.moveType === 'slow' ? 'td-low' : 'td-mid', { text: posText, cls: 'td-gold' })}
          ${_icon('paw')}
        </div>
        <div style="font-size:0.84rem">${m.text}</div>
      </div>`;
    }).join('');

    // Encounters
    let encounterCards = (round.encounters || []).map(e => {
      const iconType = e.type === 'trap' ? 'trap' : e.type === 'navigation' ? 'compass' : e.type === 'obstacle' ? 'tree' : e.type === 'animalMoment' ? 'paw' : e.subType || 'paw';
      const cardCls = (e.segDelta > 0 || e.outcome === 'success') ? 'td-success-card' : (e.segDelta < 0 || e.outcome === 'failure') ? 'td-fail-card' : '';
      return `<div class="td-card td-forest-card ${cardCls}">${_icon(iconType)}${e.text}</div>`;
    }).join('');

    // Social events
    let socHtml = (round.socialEvents || []).map(se => {
      return `<div class="td-card td-social">${_icon(se.type)}${se.text}</div>`;
    }).join('');

    // Mole actions
    let moleHtml = (round.moleActions || []).map(ma => {
      return `<div class="td-card td-mole-card">${_icon('mole')}${ma.text}</div>`;
    }).join('');

    // Comm chatter
    let chatter = '';
    if (i > 0 && i % 3 === 0) {
      const ch = _pickChatter('td-forest', 1);
      if (ch.length) chatter = _commDiv(ch[0]);
    }

    steps += `<div class="td-step ${vis}" data-step="${i}">
      ${chatter}
      <div class="td-h2" style="color:#c0d8e0">Round ${round.round}</div>
      ${moveCards}${encounterCards}${socHtml}${moleHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1" style="color:#c0d8e0;text-shadow:0 0 20px rgba(192,216,224,0.4)">The Great Forest Race</div>
    <div class="td-host" style="color:#e8a020;border-left-color:rgba(232,160,32,0.4)">${data.hostForestStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div class="td-reveal-bar">
      <button class="td-btn" style="border-color:rgba(192,216,224,0.3);color:#c0d8e0;background:rgba(192,216,224,0.1)" onclick="tdRevealNext('${stKey}',${totalSteps})">Next Round &#9654;</button>
      <button class="td-btn td-btn-crimson" onclick="tdRevealAll('${stKey}',${totalSteps})">Reveal All &#9193;</button>
      <span id="td-counter-${stKey}" style="font-family:'Playfair Display',serif;font-size:0.7rem;color:#6a8a7a">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogForest;
  return _shell(content, ep, 'td-forest');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 6: WINNER
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogWinner(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const winner = data.immunityWinner;
  const finishOrder = data.phase2?.finishOrder || [];
  const assignments = data.phase1?.assignments || [];
  const performances = data.phase1?.performances || [];
  const scores = ep.chalMemberScores || {};

  // Find winner's animal
  const winnerAssign = assignments.find(a => a.player === winner);
  const winnerAnimal = winnerAssign?.animal || { name: '?', icon: '?' };
  const winnerSlug = slug(winner);

  // Build leaderboard
  let leaderboard = finishOrder.map((n, i) => {
    const isWinner = n === winner;
    const perf = performances.find(p => p.player === n);
    const perfScore = perf ? perf.total : 0;
    const totalScore = scores[n] || 0;

    return `<div class="td-lb-row ${isWinner ? 'td-first' : ''}" style="${isWinner ? '' : 'background:rgba(212,160,23,0.03)'}">
      <span class="td-lb-rank">#${i + 1}</span>
      ${_poster(n, isWinner ? 'td-winner-p' : 'td-high')}
      <span class="td-lb-name">${n}</span>
      <span class="td-lb-score">${totalScore} pts</span>
      ${isWinner ? '<span style="font-size:0.6rem;padding:1px 5px;border-radius:6px;background:rgba(255,215,0,0.15);color:#ffd700">IMMUNE</span>' : ''}
    </div>`;
  }).join('');

  const content = `
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Playfair Display',serif;font-size:0.8rem;color:#8a7a4a;letter-spacing:3px;margin-bottom:6px;text-transform:uppercase">First Through the Forest</div>
      <div class="td-h1" style="font-size:1.8rem;color:#ffd700;text-shadow:0 0 30px rgba(255,215,0,0.5),0 0 60px rgba(255,215,0,0.2)">IMMUNITY WINNER</div>
      <div style="margin:14px auto;width:90px;height:90px;border-radius:8px;border:4px solid #ffd700;overflow:hidden;position:relative;box-shadow:0 0 30px rgba(255,215,0,0.4)">
        <img src="assets/avatars/${winnerSlug}.png" alt="${winner}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;border-radius:8px;background:linear-gradient(135deg,rgba(255,215,0,0.15),transparent 50%);pointer-events:none"></div>
      </div>
      <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:900;color:#ffd700;margin:6px 0">${winner}</div>
      <div style="font-family:'Playfair Display',serif;font-size:1rem;color:#b8860b;margin:4px 0">with ${winnerAnimal.icon} ${winnerAnimal.name}</div>
      <div style="font-size:0.82rem;color:#8a7a4a;margin-top:4px;font-style:italic">${data.phase2.finishText || ''}</div>
    </div>
    <div class="td-h2" style="text-align:center">Final Leaderboard</div>
    <div style="max-width:500px;margin:0 auto">${leaderboard}</div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders['td-winner'] = rpBuildTopDogWinner;
  return _shell(content, ep, 'td-winner');
}

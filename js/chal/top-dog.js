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
  const base = (s[animal.stats[0]] + s[animal.stats[1]]) * 0.25;
  let bonus = 0;
  const a = arch(name);

  // archetype synergy
  if (['villain', 'mastermind', 'schemer'].includes(a) && ['aggressive', 'cunning'].includes(animal.temperament)) bonus += 1.5;
  if (a === 'hero' && ['loyal', 'playful'].includes(animal.temperament)) bonus += 1.5;
  if (a === 'social-butterfly') bonus += 0.8;
  if (a === 'challenge-beast' && animal.stats.includes('physical')) bonus += 1;
  if (a === 'loyal-soldier' && animal.temperament === 'loyal') bonus += 1.2;
  if (a === 'chaos-agent' && animal.temperament === 'playful') bonus += 1;
  if (a === 'wildcard') bonus += noise(3);
  if (a === 'underdog' && animal.danger <= 2) bonus += 1;
  if (a === 'showmancer' && ['skittish', 'playful'].includes(animal.temperament)) bonus += 1;

  // archetype clashes
  if (a === 'goat' && animal.danger >= 4) bonus -= 2.5;
  if (['hero', 'loyal-soldier'].includes(a) && animal.temperament === 'aggressive') bonus -= 1.5;
  if (a === 'underdog' && animal.danger >= 4) bonus -= 1.5;
  if (['villain', 'schemer'].includes(a) && animal.temperament === 'loyal') bonus -= 1;
  if (a === 'floater' && animal.temperament === 'stubborn') bonus -= 1;

  // danger tax — high-danger animals are harder to bond with
  if (animal.danger >= 4) bonus -= 1;
  if (animal.danger >= 5) bonus -= 0.5;

  return Math.max(0, Math.min(10, base + bonus + noise(2.5)));
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
    (p1, p2, a1, a2) => `${p1} helps ${p2} bandage a scratch from ${pronouns(p2).posAdj} ${a2.name}. They sit close. Too close. ${host()}: "This is a CHALLENGE, not a DATE." They don't hear ${host()}.`,
  ],
  respect: [
    (p1, p2, a1, a2) => `${p2} watches ${p1} handle the ${a1.name} with real skill. ${p2}: "You're actually really good at this." ${p1}: "Thanks. Your ${a2.name.toLowerCase()} is impressive too." Mutual nod.`,
    (p1, p2, a1, a2) => `${p1} and ${p2} compare training notes. Genuinely helpful advice exchanged. No tricks, no sabotage. Just two competitors respecting each other's work.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} pulls off something incredible. ${p2} claps. Actually claps. ${p1} tips an imaginary hat. Sportsmanship lives.`,
    (p1, p2, a1, a2) => `After the round, ${p2} approaches ${p1}: "That was brilliant. The way you handled that obstacle? I'm taking notes." ${p1}: "Steal my techniques. I'll still beat you."`,
  ],
  paranoia: [
    (p1, p2, a1, a2) => `${p1} sees ${p2} whispering to ${pronouns(p2).posAdj} ${a2.name}. ${p1}: "What are you telling it?!" ${p2}: "It's a ${a2.name.toLowerCase()}. I'm telling it to SIT." ${p1} doesn't believe that.`,
    (p1, p2, a1, a2) => `${p1} catches ${p2} studying ${pronouns(p1).posAdj} training technique. ${p1}: "Taking notes? Or looking for weaknesses?" ${p2}: "...Both." At least ${pronouns(p2).sub}'s honest.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2}'s ${a2.name} is spying on ${pronouns(p1).posAdj} training. It's not. It's looking at a butterfly. But paranoia doesn't check facts.`,
    (p1, p2, a1, a2) => `${p1}: "Why does your ${a2.name.toLowerCase()} keep looking at me?" ${p2}: "Because you're LOUD." ${p1}: "Is it memorizing my routine?!" ${p2}: "It's a ${a2.name.toLowerCase()}."`,
  ],
  blame: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} acted up after ${p2} walked too close. ${p1}: "You SPOOKED it!" ${p2}: "I was WALKING." ${p1}: "Walk ELSEWHERE." Heated.`,
    (p1, p2, a1, a2) => `${p1} blames ${p2} for distracting ${pronouns(p1).posAdj} ${a1.name}. ${p2}: "I didn't DO anything!" ${p1}: "Your ${a2.name.toLowerCase()} was making noise!" ${p2}: "Animals MAKE NOISE."`,
    (p1, p2, a1, a2) => `${p1}: "If you hadn't been showing off, my ${a1.name.toLowerCase()} wouldn't have gotten distracted." ${p2}: "Or maybe train your animal better?" SHOTS FIRED.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2} sabotaged ${pronouns(p1).posAdj} training area. ${p2} didn't — but ${p1} is looking for someone to blame and ${p2} is closest. Bond damage.`,
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
      const trainRoll = (compatibility + 2) * 0.35 + relevantStat * 0.35 + noise(2.5);

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
    const animalMood = (compatibility + 3) / 13;
    const rawScore = trainingRate * 0.35 + perfRoll * 0.35 + animalMood * 0.3;

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
      const moveRoll = s.physical * 0.3 + s.endurance * 0.2 + (assign.compatibility + 2) * 0.15 + noise(2.5);
      let segments = Math.max(0.8, moveRoll / 3.5);

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

      segments = Math.max(0.3, segments);
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
        const moveRoll = s.physical * 0.3 + s.endurance * 0.2 + (moleAssign.compatibility + 2) * 0.15 + noise(2.5);
        let segments = Math.max(0.8, moveRoll / 3.5);
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
      const lostSegments = -(0.5 + Math.floor(Math.random() * 2));
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
    return { type: 'trap', player: name, outcome: 'failure', text, segDelta: -1 };
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

// ── REVEAL STATE (alien-egg proven pattern: IDs + display:none) ──
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

export function topDogRevealNext(screenKey, total) {
  const st = _ensureState(screenKey, total);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const el = document.getElementById(`td-step-${screenKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const elB = document.getElementById(`td-step-${screenKey}-${st.idx}b`);
  if (elB) elB.style.display = '';
  _rebuildSidebar();
  const counter = document.getElementById(`td-counter-${screenKey}`);
  if (counter) counter.textContent = `${st.idx + 1}/${st.total}`;
  if (st.idx >= st.total - 1) {
    const ctrl = document.getElementById(`td-controls-${screenKey}`);
    if (ctrl) ctrl.querySelector('.td-btn')?.setAttribute('disabled', 'true');
  }
}
export function topDogRevealAll(screenKey, total) {
  const st = _ensureState(screenKey, total);
  st.idx = st.total - 1;
  for (let i = 0; i < st.total; i++) {
    const el = document.getElementById(`td-step-${screenKey}-${i}`);
    if (el) el.style.display = '';
    const elB = document.getElementById(`td-step-${screenKey}-${i}b`);
    if (elB) elB.style.display = '';
  }
  _rebuildSidebar();
  const counter = document.getElementById(`td-counter-${screenKey}`);
  if (counter) counter.textContent = `${st.total}/${st.total}`;
  const ctrl = document.getElementById(`td-controls-${screenKey}`);
  if (ctrl) ctrl.querySelector('.td-btn')?.setAttribute('disabled', 'true');
}
window.tdRevealNext = topDogRevealNext;
window.tdRevealAll = topDogRevealAll;
// Event delegation — inline onclick doesn't fire on innerHTML-injected buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-td-action]');
  if (!btn) return;
  const action = btn.dataset.tdAction;
  const key = btn.dataset.tdKey;
  const total = parseInt(btn.dataset.tdTotal, 10);
  if (action === 'next') topDogRevealNext(key, total);
  else if (action === 'all') topDogRevealAll(key, total);
});

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
// CUSTOM ANIMATED CSS ICONS (Layer 1) — Pet Shop Paradise
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    paw: 'td-icon-paw', movement: 'td-icon-paw', race: 'td-icon-paw',
    bone: 'td-icon-bone', training: 'td-icon-bone',
    leaf: 'td-icon-leaf', forest: 'td-icon-leaf', navigation: 'td-icon-leaf',
    heart: 'td-icon-heart', showmance: 'td-icon-heart', animalBond: 'td-icon-heart',
    star: 'td-icon-star', success: 'td-icon-star', standingOvation: 'td-icon-star', impressed: 'td-icon-star',
    fishbone: 'td-icon-fishbone', failure: 'td-icon-fishbone', critical_failure: 'td-icon-fishbone', catastrophe: 'td-icon-fishbone', disaster: 'td-icon-fishbone',
    feather: 'td-icon-feather', performance: 'td-icon-feather', judging: 'td-icon-feather', spotlight: 'td-icon-feather',
    droplet: 'td-icon-droplet',
    flower: 'td-icon-flower', respect: 'td-icon-flower', help: 'td-icon-flower',
    thorn: 'td-icon-thorn', sabotage: 'td-icon-thorn', mask: 'td-icon-thorn', blame: 'td-icon-thorn',
    eye: 'td-icon-eye', mole: 'td-icon-eye', paranoia: 'td-icon-eye',
    bell: 'td-icon-bell',
    ribbon: 'td-icon-ribbon', immunity: 'td-icon-ribbon',
    pawtrail: 'td-icon-pawtrail', obstacle: 'td-icon-pawtrail',
    cage: 'td-icon-cage', trap: 'td-icon-cage',
    skull: 'td-icon-fishbone',
    whip: 'td-icon-bone',
    lantern: 'td-icon-leaf',
    claw: 'td-icon-thorn', animalRivalry: 'td-icon-thorn',
    shield: 'td-icon-flower',
    compass: 'td-icon-leaf',
    tree: 'td-icon-leaf',
    meh: 'td-icon-feather',
  };
  const cls = map[type] || 'td-icon-paw';
  return `<span class="td-icon ${cls}"></span>`;
}

// ══════════════════════════════════════════════════════════════
// ANIMAL WHISPERS (Layer 3 — pet thoughts / nature sounds)
// ══════════════════════════════════════════════════════════════
const ANIMAL_WHISPERS = {
  'td-petshop': [
    "A parrot shrieks 'DRAMA!' in a perfect Chris impression. Nobody taught it that. Nobody knows how.",
    "Something just knocked over a feed bucket. Blame is being assigned. Loudly.",
    "The raccoon figured out the latch again. Third time today. Security is a myth.",
    "A monkey steals someone's granola bar and retreats to the rafters. Negotiations have begun.",
    "Two animals stare each other down through cage bars. The beef is REAL.",
    "The sound of aggressive treat-crunching fills the arena. War fuel.",
    "A cat knocks something off a table and makes direct eye contact while doing it. Power move.",
    "An iguana has been motionless for forty-five minutes. Either meditating or plotting. Unclear.",
    "The parrot just learned a new phrase from confessional footage. This can only end badly.",
    "Somewhere, a hamster is running on its wheel at Mach 3. No one can explain the motivation.",
  ],
  'td-forest': [
    "Sunlight filters through the canopy. A bird sings. Somewhere, someone just ate dirt.",
    "The creek babbles. A squirrel watches the race from a branch, distinctly unimpressed.",
    "The wind carries the scent of pine and desperation. Mostly desperation.",
    "A frog croaks from a mossy rock. Translation: 'You're going the wrong way.' Nobody speaks frog.",
    "Rustling in the underbrush. Just a hedgehog. It waddles across the path with zero urgency.",
    "The old oak tree creaks. It's seen a thousand seasons. This race is the most fun it's had in decades.",
    "A deer watches from the meadow edge. Ears forward. Judging. Always judging.",
    "Something howls in the distance. Probably just the wind. Probably.",
    "Spider webs across the trail at face height. Nature is undefeated.",
    "The trail gets narrower. The animals know the way. The humans... less so.",
  ],
};

function _pickWhisper(zone, count = 1) {
  const pool = ANIMAL_WHISPERS[zone];
  if (!pool || pool.length === 0) return [];
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

function _whisperDiv(text) {
  return `<div class="td-whisper">${text}</div>`;
}

// ══════════════════════════════════════════════════════════════
// TREAT COUNTER / NATURE BAR (Layers 2 & 7)
// ══════════════════════════════════════════════════════════════
const TREAT_BAR_DATA = {
  '': { icon: 'paw', label: 'TOP DOG', sub: 'Immunity Challenge' },
  'td-petshop-assign': { icon: 'paw', label: 'ANIMAL DRAFT', sub: 'Pick Your Partner' },
  'td-petshop-training': { icon: 'bone', label: 'BOOT CAMP', sub: 'Four Training Rounds' },
  'td-petshop-judging': { icon: 'star', label: 'TALENT SHOWDOWN', sub: 'Chris + Chef Scoring' },
  'td-forest': { icon: 'leaf', label: 'WILDERNESS RACE', sub: '14 Segments to the Finish' },
  'td-winner': { icon: 'ribbon', label: 'TOP DOG', sub: 'Immunity Won' },
};

// ══════════════════════════════════════════════════════════════
// CSS (Layer 1-10 all integrated)
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
/* ═══ TOP DOG VP — TOTAL DRAMA BEAST MODE ═══ */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --pet-pink:#c06040;--pet-hot-pink:#d05020;--pet-mint:#5a9a48;--pet-lavender:#8a7a6a;--pet-peach:#c8a060;--pet-sky:#4a8ab0;
  --pet-cream:#f5efe0;--pet-warm-white:#ede4d0;--pet-brown:#5c3d2e;--pet-green:#2d5a1e;--pet-grass:#5a9a38;
  --pet-lemon:#d4a017;--pet-bubblegum:#a08060;--pet-coral:#c07040;--pet-seafoam:#6a9a60;
  --pet-text:#2a1a0a;--pet-muted:#7a6a5a;
  --pet-danger:#cc3030;--pet-success:#3a8a2a;
  --td-orange:#e87830;--td-bark:#5c3d2e;--td-dirt:#8b7530;--td-bone:#e8dcc8;
}

.td-shell{position:relative;display:flex;gap:0;min-height:520px;max-width:1100px;margin:0 auto;font-family:'Inter',system-ui,sans-serif;color:var(--pet-text);background:var(--pet-warm-white);border-radius:6px;overflow:clip;border:3px solid var(--td-bark);box-shadow:0 6px 30px rgba(92,61,46,0.3),0 2px 8px rgba(92,61,46,0.15),inset 0 1px 0 rgba(255,255,255,0.3)}
.td-shell *{box-sizing:border-box}
.td-main{flex:1;padding:18px 20px 60px 20px;overflow-y:auto;position:relative;z-index:1}
.td-sidebar{width:240px;min-width:240px;background:linear-gradient(180deg,rgba(232,220,200,0.6),rgba(92,61,46,0.08));border-left:2px solid rgba(92,61,46,0.25);padding:12px 10px;overflow-y:auto;font-size:0.82rem;position:relative;z-index:1}

/* Phase 1: Arena— worn wood + competition dirt */
.td-shell::before{content:'';position:absolute;inset:0;z-index:0;
  background:
    linear-gradient(160deg, rgba(232,220,200,0.7) 0%, rgba(245,239,224,0.9) 30%, rgba(200,180,140,0.15) 70%, rgba(92,61,46,0.08) 100%),
    radial-gradient(ellipse 400px 300px at 15% 85%, rgba(200,180,140,0.15), transparent),
    radial-gradient(ellipse 300px 250px at 85% 20%, rgba(92,61,46,0.06), transparent)}
/* Claw scratches — competition edge */
.td-shell::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    linear-gradient(35deg, transparent 48%, rgba(92,61,46,0.03) 49%, transparent 51%) 0 0/80px 60px,
    linear-gradient(35deg, transparent 48%, rgba(92,61,46,0.02) 49%, transparent 51%) 40px 30px/80px 60px,
    linear-gradient(-25deg, transparent 48%, rgba(92,61,46,0.02) 49%, transparent 51%) 20px 0/60px 80px}

/* Phase 2: Wilderness — dark canopy + undergrowth */
.td-shell.td-forest::before{background:
  linear-gradient(180deg, #4a6a30 0%, #3a5820 25%, #2d4a18 50%, #1e3810 80%, #152a0a 100%)}
.td-shell.td-forest::after{background:
  linear-gradient(35deg, transparent 48%, rgba(0,0,0,0.04) 49%, transparent 51%) 0 0/80px 60px,
  linear-gradient(-25deg, transparent 48%, rgba(0,0,0,0.03) 49%, transparent 51%) 20px 0/60px 80px;
  opacity:0.8}
.td-shell.td-forest{border-color:#2d5a1e;border-width:3px;color:#f0e8d8;box-shadow:0 6px 30px rgba(30,56,16,0.4),0 2px 8px rgba(30,56,16,0.2)}

/* ═══ ANIMATED ANIMAL PARTICLES (CSS-only wow factor) ═══ */

/* Prancing cat — phase 1 */
.td-anim-cat{position:absolute;z-index:0;pointer-events:none;width:20px;height:16px;animation:td-catPrance 6s ease-in-out infinite}
.td-anim-cat::before{content:'';position:absolute;width:12px;height:10px;background:#a08060;border-radius:50% 50% 40% 40%;top:3px;left:2px}
.td-anim-cat::after{content:'';position:absolute;width:6px;height:6px;background:#a08060;border-radius:50%;top:0;left:4px}
@keyframes td-catPrance{0%{transform:translate(0,0) scaleX(1);opacity:0.12}20%{opacity:0.18;transform:translate(15px,-8px) scaleX(1)}40%{transform:translate(30px,0) scaleX(1);opacity:0.15}60%{transform:translate(15px,5px) scaleX(-1);opacity:0.18}80%{transform:translate(-5px,-3px) scaleX(-1);opacity:0.12}100%{transform:translate(0,0) scaleX(1);opacity:0.12}}

/* Tail-wagging dog — phase 1 */
.td-anim-dog{position:absolute;z-index:0;pointer-events:none;width:22px;height:16px;animation:td-dogWag 4s ease-in-out infinite}
.td-anim-dog::before{content:'';position:absolute;width:14px;height:10px;background:#8a6a40;border-radius:45% 55% 40% 40%;top:4px;left:2px}
.td-anim-dog::after{content:'';position:absolute;width:8px;height:3px;background:#8a6a40;border-radius:50%;top:4px;right:0;transform-origin:left center;animation:td-tailWag 0.4s ease-in-out infinite alternate}
@keyframes td-dogWag{0%,100%{transform:translateY(0);opacity:0.12}50%{transform:translateY(-4px);opacity:0.18}}
@keyframes td-tailWag{0%{transform:rotate(-20deg)}100%{transform:rotate(20deg)}}

/* Hopping bunny — phase 1 */
.td-anim-bunny{position:absolute;z-index:0;pointer-events:none;width:14px;height:14px;animation:td-bunnyHop 2.5s ease infinite}
.td-anim-bunny::before{content:'';position:absolute;width:10px;height:8px;background:#b0a090;border-radius:50%;bottom:0;left:2px}
.td-anim-bunny::after{content:'';position:absolute;width:4px;height:7px;background:#b0a090;border-radius:50% 50% 20% 20%;top:0;left:3px;transform-origin:bottom center}
@keyframes td-bunnyHop{0%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}60%{transform:translateY(0)}75%{transform:translateY(-5px)}}

/* Swimming fish — sidebar accent */
.td-anim-fish{position:absolute;z-index:0;pointer-events:none;width:16px;height:10px;animation:td-fishSwim 5s ease-in-out infinite}
.td-anim-fish::before{content:'';position:absolute;width:11px;height:8px;background:#6a8a60;border-radius:60% 40% 40% 60%;top:1px;left:0}
.td-anim-fish::after{content:'';position:absolute;width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:6px solid #6a8a60;top:1px;right:0;transform-origin:left center;animation:td-finFlap 0.5s ease-in-out infinite alternate}
@keyframes td-fishSwim{0%{transform:translateX(0) scaleX(1);opacity:0.15}45%{transform:translateX(25px) scaleX(1);opacity:0.2}55%{transform:translateX(25px) scaleX(-1);opacity:0.2}100%{transform:translateX(0) scaleX(-1);opacity:0.15}}
@keyframes td-finFlap{0%{transform:rotate(-15deg)}100%{transform:rotate(15deg)}}

/* Flying bird — phase 1 */
.td-anim-bird{position:absolute;z-index:0;pointer-events:none;width:18px;height:12px;animation:td-birdFly 7s ease-in-out infinite}
.td-anim-bird::before{content:'';position:absolute;width:6px;height:6px;background:#7a8a6a;border-radius:50%;top:4px;left:6px}
.td-anim-bird::after{content:'';position:absolute;width:16px;height:4px;top:2px;left:1px;
  background:
    linear-gradient(135deg, #7a8a6a 0%, transparent 45%),
    linear-gradient(225deg, #7a8a6a 0%, transparent 45%);
  animation:td-wingFlap 0.35s ease-in-out infinite alternate}
@keyframes td-birdFly{0%{transform:translate(0,0);opacity:0.15}25%{opacity:0.22;transform:translate(30px,-20px)}50%{transform:translate(60px,-10px);opacity:0.18}75%{opacity:0.22;transform:translate(30px,-25px)}100%{transform:translate(0,0);opacity:0.15}}
@keyframes td-wingFlap{0%{transform:scaleY(1)}100%{transform:scaleY(-0.6)}}

/* Butterfly particles (forest only) */
.td-butterfly{position:absolute;width:10px;height:8px;z-index:0;pointer-events:none;animation:td-butterflyFloat 8s ease-in-out infinite}
.td-butterfly::before,.td-butterfly::after{content:'';position:absolute;width:6px;height:7px;border-radius:50% 50% 20% 50%;top:0}
.td-butterfly::before{left:0;transform-origin:right center;animation:td-wingLeft 0.4s ease-in-out infinite alternate}
.td-butterfly::after{right:0;transform-origin:left center;animation:td-wingRight 0.4s ease-in-out infinite alternate}
@keyframes td-butterflyFloat{0%{transform:translate(0,0);opacity:0.4}25%{opacity:0.7;transform:translate(25px,-18px)}50%{transform:translate(-12px,-35px);opacity:0.5}75%{opacity:0.8;transform:translate(18px,-12px)}100%{transform:translate(0,0);opacity:0.4}}
@keyframes td-wingLeft{0%{transform:rotateY(0deg)}100%{transform:rotateY(60deg)}}
@keyframes td-wingRight{0%{transform:rotateY(0deg)}100%{transform:rotateY(-60deg)}}

/* Firefly (forest only) */
.td-firefly{position:absolute;z-index:0;pointer-events:none;width:4px;height:4px;border-radius:50%;background:var(--pet-lemon);box-shadow:0 0 6px var(--pet-lemon),0 0 12px rgba(248,240,128,0.3);animation:td-fireflyDrift 10s ease-in-out infinite}
@keyframes td-fireflyDrift{0%{opacity:0;transform:translate(0,0)}15%{opacity:0.6}30%{transform:translate(15px,-20px);opacity:0.8}50%{opacity:0.3;transform:translate(-10px,-35px)}70%{opacity:0.7;transform:translate(20px,-15px)}85%{opacity:0.4}100%{opacity:0;transform:translate(0,0)}}

/* Paw print particles (phase 1 only) */
.td-pawprint{position:absolute;z-index:0;pointer-events:none;opacity:0.08;animation:td-pawFloat 12s ease-in-out infinite}
.td-pawprint::before{content:'';display:block;width:10px;height:8px;background:#8a6a40;border-radius:50% 50% 30% 30%}
@keyframes td-pawFloat{0%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(10px,-15px) rotate(20deg)}100%{transform:translate(0,0) rotate(0deg)}}

/* Winner phase — golden meadow with sparkles */
.td-shell.td-winner::before{background:
  linear-gradient(180deg, #f5efe0 0%, #e8dcc8 30%, var(--pet-warm-white) 100%)}
.td-shell.td-winner{border-color:#b8860b;box-shadow:0 6px 30px rgba(184,134,11,0.35),0 2px 8px rgba(184,134,11,0.15)}

/* Headers */
.td-h1{font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem;text-align:center;letter-spacing:4px;text-transform:uppercase;
  color:var(--td-orange);text-shadow:2px 2px 0 rgba(92,61,46,0.15);margin:0 0 12px 0;font-weight:400}
.td-h2{font-family:'Bebas Neue',Impact,sans-serif;font-size:1.3rem;letter-spacing:3px;color:var(--td-orange);margin:14px 0 8px 0;text-transform:uppercase;font-weight:400}
.td-h3{font-family:'Inter',sans-serif;font-size:0.95rem;color:var(--pet-text);margin:10px 0 6px 0;letter-spacing:1px;font-weight:700}

/* Player card — rugged competitor badge */
.td-poster{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5efe0,#e8dcc8);border:2px solid var(--pet-mint);border-radius:4px;padding:3px 14px 3px 3px;margin:3px;position:relative;overflow:hidden;transition:border-color 0.3s,box-shadow 0.3s;box-shadow:0 2px 6px rgba(92,61,46,0.1)}
.td-poster.td-high{border-color:var(--pet-mint);box-shadow:0 2px 8px rgba(90,154,72,0.2)}
.td-poster.td-mid{border-color:var(--pet-peach);box-shadow:0 2px 8px rgba(200,160,96,0.15)}
.td-poster.td-low{border-color:var(--pet-danger);box-shadow:0 2px 8px rgba(204,48,48,0.12)}
.td-poster.td-winner-p{border-color:#b8860b;box-shadow:0 0 14px rgba(184,134,11,0.35)}
.td-poster-frame{width:38px;height:38px;border-radius:4px;overflow:hidden;flex-shrink:0;border:2.5px solid var(--td-bark);position:relative;background:linear-gradient(135deg,rgba(92,61,46,0.05),rgba(200,180,140,0.1))}
.td-poster-frame img{width:100%;height:100%;object-fit:contain;display:block}
.td-poster-name{font-size:0.82rem;font-weight:700;color:var(--pet-text);white-space:nowrap;font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:0.5px}
.td-poster-tag{font-size:0.65rem;font-family:'Inter',sans-serif;font-weight:700;padding:1px 6px;border-radius:3px;margin-left:4px;letter-spacing:0.5px}

/* Cards — rugged competition cards */
.td-card{background:linear-gradient(135deg,#f5efe0,#ede4d0);border:1.5px solid rgba(92,61,46,0.2);border-radius:4px;padding:10px 14px;margin:6px 0;color:var(--pet-text);font-size:0.88rem;line-height:1.5;position:relative;box-shadow:0 2px 6px rgba(92,61,46,0.08)}
.td-card.td-social{border:1.5px dashed rgba(92,61,46,0.3);background:linear-gradient(135deg,rgba(200,180,140,0.1),rgba(232,220,200,0.15))}
.td-card.td-mole-card{border:1.5px dashed var(--pet-danger);background:linear-gradient(135deg,rgba(204,48,48,0.05),rgba(200,180,140,0.05))}
.td-card.td-success-card{border:1.5px solid rgba(58,138,42,0.4);background:linear-gradient(135deg,rgba(58,138,42,0.06),rgba(90,154,72,0.08))}
.td-card.td-fail-card{border:1.5px solid rgba(204,48,48,0.3);background:linear-gradient(135deg,rgba(204,48,48,0.04),rgba(200,180,140,0.04))}
.td-card.td-winner-card{border:2.5px solid rgba(184,134,11,0.5);background:linear-gradient(135deg,rgba(184,134,11,0.06),rgba(212,160,23,0.08))}
.td-card.td-forest-card{background:linear-gradient(135deg,rgba(240,232,208,0.9),rgba(90,154,72,0.06));border-color:rgba(45,90,30,0.3)}

/* ═══ ANIMATED ICONS (CSS-only, animal-themed) ═══ */
.td-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:8px;vertical-align:middle;flex-shrink:0;position:relative}

/* Paw — bouncing paw print */
.td-icon-paw::before{content:'';width:12px;height:10px;background:#8a6a40;border-radius:50% 50% 30% 30%;animation:td-pawBounce 1.2s ease infinite}
.td-icon-paw::after{content:'';position:absolute;top:0;width:14px;height:5px;
  background:radial-gradient(circle 2.5px at 20% 50%,#8a6a40,transparent 60%),
  radial-gradient(circle 2.5px at 50% 30%,#8a6a40,transparent 60%),
  radial-gradient(circle 2.5px at 80% 50%,#8a6a40,transparent 60%)}
@keyframes td-pawBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

/* Bone — rotating */
.td-icon-bone::before{content:'';width:14px;height:5px;background:var(--pet-peach);border-radius:2px;animation:td-boneRot 2s ease-in-out infinite alternate}
.td-icon-bone::after{content:'';position:absolute;width:14px;height:5px;
  background:
    radial-gradient(circle 3.5px at 1px 50%,var(--pet-peach),transparent 60%),
    radial-gradient(circle 3.5px at 13px 50%,var(--pet-peach),transparent 60%)}
@keyframes td-boneRot{0%{transform:rotate(-15deg)}100%{transform:rotate(15deg)}}

/* Leaf — swaying */
.td-icon-leaf::before{content:'';width:10px;height:14px;background:var(--pet-grass);border-radius:2px 50% 2px 50%;animation:td-leafSway 2s ease-in-out infinite alternate}
.td-icon-leaf::after{content:'';position:absolute;width:1px;height:8px;background:var(--pet-green);top:4px;left:6px;border-radius:1px}
@keyframes td-leafSway{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}

/* Heart — soft beating */
.td-icon-heart::before{content:'';width:14px;height:13px;background:var(--pet-hot-pink);clip-path:polygon(50% 100%,0% 35%,0% 15%,25% 0%,50% 15%,75% 0%,100% 15%,100% 35%);animation:td-heartbeat 1s ease infinite}
@keyframes td-heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}

/* Star — spinning gold */
.td-icon-star::before{content:'';width:14px;height:14px;background:#e8c050;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:td-starSpin 2.5s linear infinite}
@keyframes td-starSpin{to{transform:rotate(360deg)}}

/* Fishbone — for failures */
.td-icon-fishbone::before{content:'';width:14px;height:3px;background:var(--pet-muted);border-radius:1px}
.td-icon-fishbone::after{content:'';position:absolute;width:10px;height:12px;
  background:
    linear-gradient(45deg, transparent 46%, var(--pet-muted) 46%, var(--pet-muted) 50%, transparent 50%) 0 0/5px 4px,
    linear-gradient(-45deg, transparent 46%, var(--pet-muted) 46%, var(--pet-muted) 50%, transparent 50%) 0 0/5px 4px;
  background-repeat:repeat-y;opacity:0.7}

/* Feather — floating */
.td-icon-feather::before{content:'';width:6px;height:14px;background:var(--pet-sky);border-radius:50% 50% 30% 10%;animation:td-featherFloat 2.5s ease-in-out infinite alternate;transform-origin:bottom center}
.td-icon-feather::after{content:'';position:absolute;width:1px;height:10px;background:var(--pet-brown);opacity:0.3;top:2px;left:4px}
@keyframes td-featherFloat{0%{transform:rotate(-10deg) translateY(0)}100%{transform:rotate(10deg) translateY(-2px)}}

/* Droplet — for water events */
.td-icon-droplet::before{content:'';width:10px;height:12px;background:var(--pet-sky);border-radius:50% 50% 50% 50%/30% 30% 60% 60%;animation:td-dropBounce 1.5s ease infinite}
@keyframes td-dropBounce{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.1)}}

/* Flower — blooming */
.td-icon-flower::before{content:'';width:14px;height:14px;
  background:
    radial-gradient(circle 3px at 50% 50%, #f0c860, transparent),
    radial-gradient(circle 3px at 50% 20%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 80% 40%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 70% 75%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 30% 75%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 20% 40%, var(--pet-pink), transparent);
  animation:td-bloom 2s ease infinite}
@keyframes td-bloom{0%,100%{transform:scale(1)}50%{transform:scale(1.15) rotate(15deg)}}

/* Thorn — for negative events */
.td-icon-thorn::before{content:'';width:10px;height:12px;background:var(--pet-danger);clip-path:polygon(50% 0%,65% 35%,100% 50%,65% 65%,50% 100%,35% 65%,0% 50%,35% 35%);animation:td-thornPulse 1.5s ease infinite}
@keyframes td-thornPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.7}}

/* Eye — cute big blinking */
.td-icon-eye::before{content:'';width:16px;height:12px;border:2px solid var(--pet-lavender);border-radius:50%;animation:td-blink 3s ease infinite}
.td-icon-eye::after{content:'';position:absolute;width:6px;height:6px;background:var(--pet-lavender);border-radius:50%;animation:td-blink 3s ease infinite}
@keyframes td-blink{0%,42%,46%,100%{transform:scaleY(1)}44%{transform:scaleY(0.1)}}

/* Bell — jingling */
.td-icon-bell::before{content:'';width:12px;height:10px;background:var(--pet-peach);border-radius:50% 50% 10% 10%;animation:td-bellJingle 1s ease infinite alternate}
.td-icon-bell::after{content:'';position:absolute;width:4px;height:4px;background:var(--pet-brown);border-radius:50%;bottom:0}
@keyframes td-bellJingle{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}

/* Ribbon — flowing */
.td-icon-ribbon::before{content:'';width:14px;height:8px;background:linear-gradient(90deg,var(--pet-pink),var(--pet-lavender));border-radius:0 6px 6px 0;animation:td-ribbonFlow 1.5s ease infinite alternate}
@keyframes td-ribbonFlow{0%{transform:scaleX(1) skewY(0deg)}100%{transform:scaleX(1.1) skewY(3deg)}}

/* Paw trail — 3 dots animating in sequence */
.td-icon-pawtrail::before{content:'';width:18px;height:6px;
  background:
    radial-gradient(circle 2.5px at 3px 3px, var(--pet-mint), transparent 60%),
    radial-gradient(circle 2.5px at 9px 3px, var(--pet-mint), transparent 60%),
    radial-gradient(circle 2.5px at 15px 3px, var(--pet-mint), transparent 60%);
  animation:td-trailBounce 1.2s ease infinite}
@keyframes td-trailBounce{0%,100%{transform:translateY(0)}33%{transform:translateY(-2px)}66%{transform:translateY(1px)}}

/* Cage — for trap events */
.td-icon-cage::before{content:'';width:14px;height:12px;border:2px solid var(--pet-muted);border-radius:2px 2px 0 0;
  background:repeating-linear-gradient(90deg, transparent, transparent 2px, var(--pet-muted) 2px, var(--pet-muted) 3px)}
.td-icon-cage::after{content:'';position:absolute;width:14px;height:2px;background:var(--pet-muted);bottom:0;border-radius:1px}

@media(prefers-reduced-motion:reduce){
  .td-icon-paw::before,.td-icon-bone::before,.td-icon-leaf::before,
  .td-icon-heart::before,.td-icon-star::before,.td-icon-feather::before,
  .td-icon-droplet::before,.td-icon-flower::before,.td-icon-thorn::before,
  .td-icon-eye::before,.td-icon-eye::after,.td-icon-bell::before,
  .td-icon-ribbon::before,.td-icon-pawtrail::before{animation:none!important}
}

/* Progress bar */
.td-bar-wrap{height:8px;background:rgba(92,61,46,0.1);border-radius:3px;overflow:hidden;margin:4px 0}
.td-bar{height:100%;border-radius:3px;transition:width 0.4s ease}
.td-bar.td-gold{background:linear-gradient(90deg,#b8860b,#d4a017)}
.td-bar.td-green{background:linear-gradient(90deg,#3a8a2a,#5a9a48)}
.td-bar.td-crimson{background:linear-gradient(90deg,#cc3030,#e04040)}
.td-bar.td-amber{background:linear-gradient(90deg,#c8a060,#d4b070)}

/* Reveal controls (Layer 8) */
.td-reveal-bar{display:flex;gap:8px;align-items:center;justify-content:center;padding:10px 20px;flex-wrap:wrap;position:sticky;bottom:0;z-index:100;background:linear-gradient(90deg,rgba(92,61,46,0.95),rgba(72,48,32,0.98));backdrop-filter:blur(8px);border-top:3px solid var(--td-orange);border-radius:0;box-shadow:0 -4px 20px rgba(0,0,0,0.2);max-width:100%;width:100%}
.td-btn{font-family:'Bebas Neue',Impact,sans-serif;font-size:0.9rem;font-weight:400;padding:6px 20px;border:2px solid var(--td-orange);border-radius:3px;background:rgba(232,120,48,0.15);color:var(--td-orange);cursor:pointer;letter-spacing:2px;transition:all 0.2s;text-transform:uppercase;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.td-btn:hover{background:rgba(232,120,48,0.3);border-color:#ff8830;box-shadow:0 2px 8px rgba(232,120,48,0.3);color:#ff8830}
.td-btn.td-btn-reveal-all{border-color:rgba(232,220,200,0.3);background:rgba(232,220,200,0.08);color:rgba(232,220,200,0.7)}
.td-btn.td-btn-reveal-all:hover{background:rgba(232,220,200,0.15);border-color:rgba(232,220,200,0.5);color:rgba(232,220,200,0.9)}

/* Step visibility */
.td-step{transition:opacity 0.3s ease}
.td-step.td-visible{opacity:1}

/* Host line */
.td-host{font-style:italic;color:var(--pet-brown);margin:8px 0;padding:8px 12px;border-left:3px solid var(--td-orange);background:linear-gradient(90deg,rgba(232,120,48,0.06),transparent);font-size:0.88rem;border-radius:0 3px 3px 0}

/* Sidebar */
.td-sb-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:0.85rem;letter-spacing:3px;color:var(--td-orange);text-transform:uppercase;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid rgba(232,120,48,0.25);font-weight:400}
.td-sb-section{margin:10px 0}
.td-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.78rem}
.td-sb-row img{width:22px;height:22px;border-radius:3px;object-fit:contain;flex-shrink:0;border:1.5px solid var(--td-bark)}
.td-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--pet-text)}
.td-sb-tag{font-family:'Inter',sans-serif;font-size:0.6rem;font-weight:700;padding:1px 5px;border-radius:2px;white-space:nowrap;letter-spacing:0.5px;text-transform:uppercase}
.td-sb-tag.td-gold{background:rgba(184,134,11,0.15);color:#8a6a00}
.td-sb-tag.td-green{background:rgba(58,138,42,0.15);color:#2d5a1e}
.td-sb-tag.td-crimson{background:rgba(204,48,48,0.12);color:#aa2020}
.td-sb-tag.td-amber{background:rgba(200,160,96,0.2);color:#8a6a30}
.td-sb-tag.td-grey{background:rgba(122,106,90,0.1);color:var(--pet-muted)}
.td-sb-tag.td-brass{background:rgba(92,61,46,0.12);color:var(--pet-brown)}
.td-sb-tag.td-crown{background:rgba(184,134,11,0.2);color:#8a6a00}
.td-sb-tag.td-pink{background:rgba(232,120,48,0.15);color:var(--td-orange)}

/* ═══ OVERDRIVE: Treat Counter Bar (Layer 2) ═══ */
.td-treat-bar{font-family:'Inter',sans-serif;font-size:0.72rem;color:var(--pet-brown);background:linear-gradient(90deg,rgba(92,61,46,0.08),rgba(245,239,224,0.6),rgba(92,61,46,0.08));border-bottom:2px solid rgba(92,61,46,0.2);padding:5px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;z-index:2;position:relative;letter-spacing:0.5px}
.td-treat-label{flex:1;text-align:center;white-space:nowrap;letter-spacing:3px;color:var(--td-orange);font-weight:800;text-transform:uppercase;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.85rem}
.td-treat-sub{white-space:nowrap;color:var(--pet-muted);font-size:0.65rem;font-weight:600}
.td-treat-dots{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
.td-treat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.td-treat-dot.td-compat-high{background:var(--pet-mint)}
.td-treat-dot.td-compat-mid{background:var(--pet-peach)}
.td-treat-dot.td-compat-low{background:var(--pet-danger)}
.td-shell.td-forest .td-treat-bar{background:linear-gradient(90deg,rgba(30,56,16,0.3),rgba(45,90,30,0.15),rgba(30,56,16,0.3));border-bottom-color:rgba(90,154,56,0.3);color:#c8d8b0}
.td-shell.td-forest .td-treat-label{color:#8ac050}
.td-shell.td-forest .td-treat-sub{color:#8aa870}

/* ═══ OVERDRIVE: Animal Whispers (Layer 3) ═══ */
.td-whisper{font-style:italic;font-size:0.72rem;color:var(--pet-muted);border-left:2px dashed rgba(92,61,46,0.3);padding:5px 10px;margin:6px 0 6px 12px;line-height:1.4;font-family:'Inter',sans-serif;background:linear-gradient(90deg,rgba(92,61,46,0.03),transparent);border-radius:0 3px 3px 0}
.td-shell.td-forest .td-whisper{border-left-color:rgba(90,154,56,0.4);background:linear-gradient(90deg,rgba(90,154,56,0.04),transparent);color:#8aa870}

/* ═══ OVERDRIVE: Zone Transition (Layer 4) ═══ */
.td-transition{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none}
.td-transition.td-trans-shop-open{background:linear-gradient(180deg,rgba(92,61,46,0.9),rgba(232,220,200,0.95));animation:td-shopOpen 2s ease-out forwards}
@keyframes td-shopOpen{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-100%);visibility:hidden}}
.td-transition.td-trans-forest-enter{background:linear-gradient(180deg,rgba(30,56,16,0.9),rgba(45,74,24,0.85));animation:td-forestFadeIn 2.5s ease-out forwards}
.td-trans-forest-text{font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem;font-weight:400;color:#c8d8a0;letter-spacing:6px;text-shadow:2px 2px 0 rgba(0,0,0,0.3)}
@keyframes td-forestFadeIn{0%{opacity:1}70%{opacity:0.6}100%{opacity:0;visibility:hidden}}
.td-transition.td-trans-winner-burst{background:radial-gradient(circle,rgba(184,134,11,0.6),transparent 70%);animation:td-winnerBurst 2s ease-out forwards}
@keyframes td-winnerBurst{0%{opacity:1;transform:scale(0.5)}40%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(2);visibility:hidden}}

/* ═══ OVERDRIVE: Card Physics (Layer 6) ═══ */
/* Phase 1: gentle toy bounce */
.td-shell:not(.td-forest):not(.td-winner) .td-card{animation:td-cardBounce 3.5s ease-in-out infinite}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(2n){animation-delay:0.4s;animation-duration:3.8s}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(3n){animation-delay:0.9s;animation-duration:3.2s}
@keyframes td-cardBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}

/* Scorecard pop for judging */
.td-scoreflip{animation:td-scorePop 0.5s ease-out forwards}
@keyframes td-scorePop{0%{transform:scale(0.8) rotate(-2deg);opacity:0}60%{transform:scale(1.06) rotate(0.5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}

/* Phase 2: tree branch sway */
.td-shell.td-forest .td-card{animation:td-cardSway 3.5s ease-in-out infinite}
.td-shell.td-forest .td-card:nth-child(2n){animation-delay:0.3s;animation-duration:3.8s}
.td-shell.td-forest .td-card:nth-child(3n){animation-delay:0.7s;animation-duration:3.1s}
@keyframes td-cardSway{0%,100%{transform:translateX(0) rotate(0deg)}50%{transform:translateX(1.5px) rotate(0.3deg)}}

.td-step .td-card{animation-play-state:running}

/* Leaderboard */
.td-lb-row{display:flex;align-items:center;gap:6px;padding:5px 8px;margin:3px 0;border-radius:3px;font-size:0.85rem;background:rgba(92,61,46,0.04)}
.td-lb-row.td-first{background:rgba(184,134,11,0.08);border:2px solid rgba(184,134,11,0.35)}
.td-lb-rank{font-family:'Bebas Neue',Impact,sans-serif;width:24px;text-align:center;color:var(--td-orange);font-weight:400;font-size:1rem}
.td-lb-name{flex:1;color:var(--pet-text);font-weight:600}
.td-lb-score{font-family:'Inter',sans-serif;color:var(--pet-brown);font-size:0.8rem;font-weight:700}

/* Trail progress (sidebar) — paw step tracker */
.td-trail{display:flex;flex-direction:column;gap:1px;margin:6px 0}
.td-trail-seg{height:16px;display:flex;align-items:center;gap:3px;padding:0 6px;border-radius:2px;font-size:0.55rem;font-family:'Inter',sans-serif;font-weight:600;color:var(--pet-muted);background:rgba(92,61,46,0.05);border:1px solid rgba(92,61,46,0.12);position:relative}
.td-trail-seg.td-reached{background:rgba(58,138,42,0.1);border-color:rgba(58,138,42,0.3)}
.td-trail-seg.td-finish{background:rgba(184,134,11,0.1);border-color:rgba(184,134,11,0.3)}
.td-trail-dot{width:6px;height:6px;border-radius:50%;border:1px solid var(--td-bone);position:absolute;right:4px}

/* Compat bar in sidebar */
.td-compat-bar{height:6px;border-radius:2px;background:rgba(92,61,46,0.08);overflow:hidden;margin:2px 0 0 27px}
.td-compat-fill{height:100%;border-radius:2px}

/* ═══ Sidebar animated pet (replaces viewport/map) ═══ */
.td-sb-pet{width:60px;height:60px;margin:0 auto 8px;position:relative}
.td-sb-pet-cat{position:absolute;width:30px;height:24px;left:4px;top:10px;animation:td-sbCatStretch 4s ease-in-out infinite}
.td-sb-pet-cat::before{content:'';position:absolute;width:20px;height:16px;background:#a08060;border-radius:50%;top:5px;left:3px}
.td-sb-pet-cat::after{content:'';position:absolute;width:10px;height:10px;background:#a08060;border-radius:50%;top:0;left:7px}
@keyframes td-sbCatStretch{0%,100%{transform:scaleX(1) translateY(0)}30%{transform:scaleX(1.15) translateY(-2px)}60%{transform:scaleX(0.95) translateY(1px)}}
.td-sb-pet-dog{position:absolute;width:28px;height:22px;right:2px;top:14px;animation:td-sbDogWag 2s ease-in-out infinite}
.td-sb-pet-dog::before{content:'';position:absolute;width:18px;height:14px;background:#8a6a40;border-radius:50% 60% 40% 50%;top:5px;left:2px}
.td-sb-pet-dog::after{content:'';position:absolute;width:8px;height:3px;background:#8a6a40;border-radius:3px;top:6px;right:0;transform-origin:left center;animation:td-sbDogTail 0.3s ease-in-out infinite alternate}
@keyframes td-sbDogWag{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes td-sbDogTail{0%{transform:rotate(-25deg)}100%{transform:rotate(25deg)}}

/* Forest sidebar: bunny + bird */
.td-sb-pet-bunny{position:absolute;width:20px;height:18px;left:8px;top:16px;animation:td-sbBunnyHop 2.5s ease infinite}
.td-sb-pet-bunny::before{content:'';position:absolute;width:14px;height:12px;background:#b0a090;border-radius:50%;bottom:0;left:3px}
.td-sb-pet-bunny::after{content:'';position:absolute;width:6px;height:10px;background:#b0a090;border-radius:50% 50% 20% 20%;top:0;left:5px}
@keyframes td-sbBunnyHop{0%,100%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(0)}65%{transform:translateY(-4px)}}
.td-sb-pet-songbird{position:absolute;width:16px;height:14px;right:6px;top:6px;animation:td-sbBirdBob 3s ease-in-out infinite}
.td-sb-pet-songbird::before{content:'';position:absolute;width:12px;height:10px;background:#7a8a6a;border-radius:50%;top:3px;left:0}
.td-sb-pet-songbird::after{content:'';position:absolute;width:10px;height:3px;top:0;left:3px;
  background:linear-gradient(135deg,#7a8a6a 0%,transparent 45%),linear-gradient(225deg,#7a8a6a 0%,transparent 45%);
  animation:td-sbBirdWing 0.4s ease-in-out infinite alternate}
@keyframes td-sbBirdBob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(3deg)}}
@keyframes td-sbBirdWing{0%{transform:scaleY(1)}100%{transform:scaleY(-0.5)}}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .td-shell::before,.td-shell::after{animation:none!important}
  .td-h1,.td-butterfly,.td-pawprint,.td-transition{animation:none!important;transform:none!important}
  .td-anim-cat,.td-anim-dog,.td-anim-bunny,.td-anim-fish,.td-anim-bird,.td-firefly{animation:none!important;transform:none!important}
  .td-anim-dog::after,.td-anim-bird::after{animation:none!important}
  .td-sb-pet-cat,.td-sb-pet-dog,.td-sb-pet-bunny,.td-sb-pet-songbird{animation:none!important}
  .td-sb-pet-dog::after,.td-sb-pet-songbird::after{animation:none!important}
  .td-transition{opacity:0!important;visibility:hidden!important}
  .td-transition::before,.td-transition::after{animation:none!important}
  .td-step{transition:none!important;animation:none!important}
  .td-bar{transition:none!important}
  .td-card{animation:none!important;filter:none!important;opacity:1!important;transform:none!important}
  .td-scoreflip{animation:none!important;transform:none!important;opacity:1!important}
  .td-butterfly::before,.td-butterfly::after{animation:none!important}
  .td-pawprint{animation:none!important}
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
function _buildTreatBar(phaseCls, ep) {
  if (!phaseCls) return '';
  const bar = TREAT_BAR_DATA[phaseCls] || TREAT_BAR_DATA[''];

  let dotsHtml = '';
  const data = ep.topDog;
  if (data?.phase1?.assignments) {
    data.phase1.assignments.forEach(a => {
      const cls = a.compatibility >= 6.5 ? 'td-compat-high' : a.compatibility >= 4 ? 'td-compat-mid' : 'td-compat-low';
      dotsHtml += `<span class="td-treat-dot ${cls}" title="${a.player}: ${a.compatibility.toFixed(1)}"></span>`;
    });
  }

  return `<div class="td-treat-bar">
    ${_icon(bar.icon)}
    <span class="td-treat-label">${bar.label}</span>
    <span class="td-treat-sub">${bar.sub}</span>
    <span class="td-treat-dots">${dotsHtml}</span>
  </div>`;
}

function _buildTransition(phaseCls) {
  if (phaseCls === 'td-petshop-assign' || phaseCls === 'td-petshop-training' || phaseCls === 'td-petshop-judging') {
    return `<div class="td-transition td-trans-shop-open">${_icon('paw')}${_icon('heart')}${_icon('paw')}</div>`;
  }
  if (phaseCls === 'td-forest') {
    return `<div class="td-transition td-trans-forest-enter"><span class="td-trans-forest-text">INTO THE WILD</span></div>`;
  }
  if (phaseCls === 'td-winner') {
    return `<div class="td-transition td-trans-winner-burst"></div>`;
  }
  return '';
}

function _buildAnimalParticles() {
  let html = '';
  const animalTypes = ['td-anim-cat', 'td-anim-dog', 'td-anim-bunny', 'td-anim-bird', 'td-anim-fish'];
  for (let i = 0; i < 8; i++) {
    const type = animalTypes[i % animalTypes.length];
    const left = 5 + Math.random() * 85;
    const top = 5 + Math.random() * 85;
    const delay = (Math.random() * 10).toFixed(1);
    const dur = (5 + Math.random() * 6).toFixed(1);
    html += `<div class="${type}" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  for (let i = 0; i < 6; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 12).toFixed(1);
    const rot = Math.floor(Math.random() * 360);
    html += `<div class="td-pawprint" style="left:${left}%;top:${top}%;animation-delay:${delay}s;transform:rotate(${rot}deg)"></div>`;
  }
  return html;
}

function _buildForestParticles() {
  let html = '';
  const colors = ['var(--pet-pink)', 'var(--pet-lavender)', 'var(--pet-sky)', 'var(--pet-lemon)', 'var(--pet-bubblegum)'];
  for (let i = 0; i < 10; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 8).toFixed(1);
    const dur = (6 + Math.random() * 6).toFixed(1);
    const color = colors[i % colors.length];
    html += `<div class="td-butterfly" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"><style>.td-butterfly:nth-child(${i + 1})::before,.td-butterfly:nth-child(${i + 1})::after{background:${color}}</style></div>`;
  }
  for (let i = 0; i < 6; i++) {
    const left = Math.random() * 100;
    const top = 20 + Math.random() * 70;
    const delay = (Math.random() * 10).toFixed(1);
    const dur = (8 + Math.random() * 8).toFixed(1);
    html += `<div class="td-firefly" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  return html;
}

function _shell(content, ep, phaseCls = '') {
  window._tdData = ep.topDog;
  window._tdEp = ep;
  const isForest = phaseCls === 'td-forest';
  const shellCls = isForest ? 'td-forest' : phaseCls === 'td-winner' ? 'td-winner' : '';
  const particles = isForest ? _buildForestParticles() : _buildAnimalParticles();
  return `${_css()}<div class="td-shell ${shellCls}" data-phase="${phaseCls}">
    ${_buildTransition(phaseCls)}
    ${particles}
    <div class="td-main">${_buildTreatBar(phaseCls, ep)}${content}</div>
    <div class="td-sidebar" id="td-sidebar">${_buildSidebarContent(ep.topDog, phaseCls, ep)}</div>
  </div>`;
}


// ══════════════════════════════════════════════════════════════
// SIDEBAR CONTENT (Layer 9 — Interactive, gated by _tvState)
// ══════════════════════════════════════════════════════════════
function _buildSidebarPet(phaseCls) {
  const isForest = phaseCls === 'td-forest' || phaseCls === 'td-winner';
  return `<div class="td-sb-pet">
    ${isForest
      ? '<div class="td-sb-pet-bunny"></div><div class="td-sb-pet-songbird"></div>'
      : '<div class="td-sb-pet-cat"></div><div class="td-sb-pet-dog"></div>'}
  </div>`;
}

function _buildSidebarContent(data, phase, ep) {
  if (!data) return '<div class="td-sb-title">NO DATA</div>';

  if (phase === 'td-petshop-assign') return _buildSidebarPet(phase) + _sidebarAssignment(data);
  if (phase === 'td-petshop-training') return _buildSidebarPet(phase) + _sidebarTraining(data);
  if (phase === 'td-petshop-judging') return _buildSidebarPet(phase) + _sidebarJudging(data);
  if (phase === 'td-forest') return _buildSidebarPet(phase) + _sidebarForest(data);
  if (phase === 'td-winner') return _buildSidebarPet(phase) + _sidebarWinner(data, ep);
  return _sidebarRoster(data);
}

function _sidebarRoster(data) {
  let h = '<div class="td-sb-title">ADOPTION BOARD</div>';
  const assignments = data.phase1?.assignments || [];
  assignments.forEach(a => {
    const sl = slug(a.player);
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-gold">READY</span></div>`;
  });
  h += `<div class="td-sb-section"><div class="td-sb-title">CHALLENGE BRIEF</div><div style="font-size:0.72rem;color:var(--pet-brown);line-height:1.4">Phase 1: Adopt your pet, train them, and perform for the judges. Phase 2: Adventure through the forest trail. First to the meadow exit wins immunity!</div></div>`;
  return h;
}

function _sidebarAssignment(data) {
  const st = _tvState['td-assign'];
  const revIdx = st ? st.idx : -1;
  const assignments = data.phase1?.assignments || [];

  let h = '<div class="td-sb-title">ADOPTION BOARD</div>';
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

  let h = `<div class="td-sb-title">TRAINING PROGRESS</div>`;
  h += `<div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted);margin:4px 0">ROUND ${Math.min(roundsRevealed, rounds.length)} / ${rounds.length}</div>`;

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

  let h = '<div class="td-sb-title">TALENT SHOW SCORES</div>';
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

  let h = '<div class="td-sb-title">ADVENTURE MAP</div>';

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
          const color = a.compatibility >= 6.5 ? 'var(--pet-mint)' : a.compatibility >= 4 ? 'var(--pet-peach)' : 'var(--pet-danger)';
          dots += `<span class="td-trail-dot" style="background:${color}" title="${a.player}"></span>`;
          segCls += ' td-reached';
        }
      });
    }

    h += `<div class="td-trail-seg ${segCls}">${isFinish ? 'MEADOW' : seg}${dots}</div>`;
  }
  h += '</div>';

  return h;
}

function _sidebarWinner(data, ep) {
  let h = '<div class="td-sb-title">BEST IN SHOW</div>';
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

  const animalRing = assignments.map((a, i) => {
    const angle = (i / assignments.length) * 360;
    const radius = 80;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius;
    return `<span style="position:absolute;left:calc(50% + ${x}px - 11px);top:calc(50% + ${y}px - 11px);opacity:0.5">${_icon('paw')}</span>`;
  }).join('');

  let posters = assignments.map(a => `<div style="display:inline-block;margin:2px">${_poster(a.player, 'td-high')}</div>`).join('');

  const content = `
    <div class="td-h1" style="font-size:2.2rem;margin:20px 0 6px">TOP DOG</div>
    <div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.8rem;font-weight:700;color:var(--pet-muted);letter-spacing:4px;margin-bottom:16px;text-transform:uppercase">TOP DOG CHALLENGE</div>
    <div class="td-host">${data.hostOpening || ''}</div>
    <div style="text-align:center;margin:16px 0;position:relative;height:200px">
      <div style="position:relative;width:200px;height:200px;margin:0 auto">${animalRing}</div>
    </div>
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-brown);letter-spacing:2px;margin-bottom:8px;text-transform:uppercase">Contestants</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px">${posters}</div>
    </div>
    <div style="margin-top:16px;text-align:center">
      <div class="td-card" style="display:inline-block;max-width:420px;text-align:left">
        <div class="td-h3">Challenge Rules</div>
        <div style="font-size:0.82rem;line-height:1.6;color:var(--pet-brown)">
          <b style="color:var(--pet-hot-pink)">Phase 1</b> — Adopt your pet + Train them + Talent show performance<br>
          <b style="color:var(--pet-green)">Phase 2</b> — Forest adventure trail (14 segments to the meadow)<br>
          <span style="color:var(--pet-brown);font-weight:600">Top performance score = head start on the trail. First to the meadow wins immunity!</span>
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
    const hide = i <= st.idx ? '' : 'display:none';
    const pct = Math.round(a.compatibility * 10);
    const barCls = a.compatibility >= 6.5 ? 'td-gold' : a.compatibility >= 4 ? 'td-amber' : 'td-crimson';
    const posterCls = a.compatibility >= 6.5 ? 'td-high' : a.compatibility >= 4 ? 'td-mid' : 'td-low';

    // Archetype bonus/penalty description
    const playerArch = arch(a.player);
    let bonusText = '';
    if (a.compatibility >= 7) bonusText = `<span style="color:var(--pet-green);font-size:0.75rem"> — Natural affinity!</span>`;
    else if (a.compatibility <= 3) bonusText = `<span style="color:var(--pet-danger);font-size:0.75rem"> — This could be trouble...</span>`;

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        ${_poster(a.player, posterCls, { text: a.animal.name, cls: 'td-gold' })}
        <div style="flex:1">
          <div style="font-size:0.78rem;color:var(--pet-brown);font-family:'Inter',sans-serif;font-weight:600">
            ${_icon('paw')} ${a.animal.name} — <span style="color:var(--pet-hot-pink)">${'●'.repeat(a.animal.danger)}${'○'.repeat(5 - a.animal.danger)}</span> — ${a.animal.temperament}${bonusText}
          </div>
          <div style="font-size:0.7rem;color:var(--pet-muted);font-family:'Inter',sans-serif;font-weight:600;letter-spacing:0.5px">COMPATIBILITY: ${a.compatibility.toFixed(1)}/10</div>
          <div class="td-bar-wrap"><div class="td-bar ${barCls}" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="td-card">${_icon(a.compatibility >= 5.5 ? 'heart' : 'thorn')}${a.reactionText}</div>
    </div>`;

    // Comm chatter between reveals — shares same step index so it reveals together
    if (i > 0 && i % 3 === 0) {
      const chatter = _pickWhisper('td-petshop', 1);
      if (chatter.length) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${_whisperDiv(chatter[0])}</div>`;
    }
  });

  const content = `
    <div class="td-h1">Animal Draft</div>
    <div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.75rem;font-weight:700;color:var(--pet-muted);letter-spacing:2px;margin-bottom:10px">PRIORITY PICK — HIGHEST SOCIAL+BOLDNESS ADOPTS FIRST</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Adoption ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogAssignment;
  return _shell(content, ep, 'td-petshop-assign');
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
    const hide = i <= st.idx ? '' : 'display:none';

    // Training results for each player
    let resultCards = (round.results || []).map(r => {
      const assign = assignments.find(a => a.player === r.player);
      const animal = assign?.animal || { name: '?', icon: '?' };
      const cardCls = r.outcome === 'success' ? 'td-success-card' : r.outcome === 'critical_failure' ? 'td-fail-card' : '';
      const iconType = r.outcome === 'success' ? 'star' : r.outcome === 'critical_failure' ? 'fishbone' : 'bone';
      const posterCls = r.outcome === 'success' ? 'td-high' : r.outcome === 'critical_failure' ? 'td-low' : 'td-mid';

      return `<div class="td-card ${cardCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_poster(r.player, posterCls, { text: animal.name, cls: r.outcome === 'success' ? 'td-gold' : 'td-crimson' })}
          ${_icon(iconType)}
          <span style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted);text-transform:uppercase;letter-spacing:0.5px">${r.outcome.replace('_', ' ')}</span>
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
      const ch = _pickWhisper('td-petshop', 1);
      if (ch.length) chatter = _whisperDiv(ch[0]);
    }

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      ${chatter}
      <div class="td-h2">Round ${round.round} <span style="font-size:0.7rem;color:var(--pet-muted)">${i + 1}/${totalSteps}</span></div>
      ${resultCards}${socHtml}${moleHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1">Boot Camp</div>
    <div class="td-host">${data.hostTrainingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Round ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogTraining;
  return _shell(content, ep, 'td-petshop-training');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 4: JUDGING PERFORMANCE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogJudging(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const perfs = data.phase1?.performances || [];
  const totalSteps = perfs.length + 1;
  const stKey = 'td-judging';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  perfs.forEach((p, i) => {
    const hide = i <= st.idx ? '' : 'display:none';
    const animal = p.animalObj || { name: '?', icon: '?' };
    const posterCls = p.tier === 'standingOvation' || p.tier === 'impressed' ? 'td-high' : p.tier === 'meh' ? 'td-mid' : 'td-low';
    const scoreColor = p.total >= 16 ? 'var(--pet-green)' : p.total >= 12 ? 'var(--pet-brown)' : p.total >= 8 ? 'var(--pet-peach)' : 'var(--pet-danger)';

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${_poster(p.player, posterCls, { text: animal.name, cls: 'td-gold' })}
        ${_icon(p.tier)}
      </div>
      <div class="td-card">${_icon('feather')}${p.perfText}</div>
      <div style="display:flex;gap:8px;margin:6px 0;flex-wrap:wrap">
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(168,216,200,0.4)">
          <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-muted);letter-spacing:0.5px;text-transform:uppercase">Chris</div>
          <div style="font-family:'Inter',sans-serif;font-size:2rem;color:${scoreColor};font-weight:800">${p.chrisScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chrisText}</div>
        </div>
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(168,216,200,0.4);animation-delay:0.2s">
          <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-muted);letter-spacing:0.5px;text-transform:uppercase">Chef</div>
          <div style="font-family:'Inter',sans-serif;font-size:2rem;color:${scoreColor};font-weight:800">${p.chefScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chefText}</div>
        </div>
      </div>
      <div style="text-align:center;font-family:'Inter',sans-serif;font-size:1.2rem;color:${scoreColor};font-weight:800;letter-spacing:2px">TOTAL: ${p.total}/20</div>
    </div>`;

    // Comm chatter
    if (i > 0 && i % 2 === 1) {
      const ch = _pickWhisper('td-petshop', 1);
      if (ch.length) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${_whisperDiv(ch[0])}</div>`;
    }
  });

  // Winner announcement step
  const judgingWinner = perfs[0];
  const winIdx = perfs.length;
  const hideWin = winIdx <= st.idx ? '' : 'display:none';
  if (judgingWinner) {
    const winAnimal = judgingWinner.animalObj || { name: '?', icon: '?' };
    const runnerUp = perfs[1];
    const lastPlace = perfs[perfs.length - 1];
    steps += `<div id="td-step-${stKey}-${winIdx}" class="td-step" style="${hideWin}">
      <div class="td-card" style="border:2px solid #e8c050;background:linear-gradient(135deg,rgba(232,192,80,0.08),rgba(200,160,96,0.05));text-align:center;padding:16px">
        ${_icon('star')}
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:1.4rem;color:#a08020;letter-spacing:3px;margin:8px 0">TOP SCORER</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0">
          ${portrait(judgingWinner.player, 52)}
          <div style="text-align:left">
            <div style="font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:800;color:var(--pet-text)">${judgingWinner.player}</div>
            <div style="font-size:0.8rem;color:var(--pet-brown)">${_icon('heart')} with ${winAnimal.name} — ${judgingWinner.total}/20</div>
          </div>
        </div>
        <div style="margin:10px 0;padding:8px;background:rgba(92,61,46,0.06);border-radius:4px;font-size:0.85rem">
          ${_icon('ribbon')} <strong>${judgingWinner.player}</strong> earns a <strong style="color:#a08020">3-segment head start</strong> in the Wilderness Race!
          ${runnerUp ? `<br>${runnerUp.player} starts at 2. ` : ''}
          ${lastPlace ? `<br><span style="color:var(--pet-danger)">${lastPlace.player}</span> starts dead last — zero head start.` : ''}
        </div>
        <div style="font-size:0.82rem;color:var(--pet-muted);font-style:italic;margin-top:6px">${host()}: "Pack your bags. The forest doesn't care about your feelings."</div>
      </div>
    </div>`;
  }

  const content = `
    <div class="td-h1">Talent Showdown</div>
    <div class="td-host">${data.hostJudgingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Performance ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogJudging;
  return _shell(content, ep, 'td-petshop-judging');
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
    const hide = i <= st.idx ? '' : 'display:none';

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
      const iconType = e.type === 'trap' ? 'cage' : e.type === 'navigation' ? 'leaf' : e.type === 'obstacle' ? 'pawtrail' : e.type === 'animalMoment' ? 'paw' : e.subType || 'paw';
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
      const ch = _pickWhisper('td-forest', 1);
      if (ch.length) chatter = _whisperDiv(ch[0]);
    }

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      ${chatter}
      <div class="td-h2" style="color:var(--pet-cream)">Round ${round.round}</div>
      ${moveCards}${encounterCards}${socHtml}${moleHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1" style="color:var(--pet-cream);text-shadow:0 1px 2px rgba(0,0,0,0.2)">Wilderness Race</div>
    <div class="td-host" style="color:var(--pet-cream);border-left-color:var(--pet-grass)">${data.hostForestStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" style="border-color:#5a9a38;color:#8ac050;background:rgba(90,154,56,0.15)" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Round ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:#8ac050">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
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

    return `<div class="td-lb-row ${isWinner ? 'td-first' : ''}" style="${isWinner ? '' : 'background:rgba(168,216,200,0.05)'}">
      <span class="td-lb-rank">#${i + 1}</span>
      ${_poster(n, isWinner ? 'td-winner-p' : 'td-high')}
      <span class="td-lb-name">${n}</span>
      <span class="td-lb-score">${totalScore} pts</span>
      ${isWinner ? '<span style="font-size:0.6rem;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(184,134,11,0.15);color:#8a6a00;font-family:Inter,sans-serif;text-transform:uppercase;letter-spacing:1px">IMMUNE</span>' : ''}
    </div>`;
  }).join('');

  const content = `
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Inter',sans-serif;font-size:0.8rem;font-weight:800;color:var(--pet-muted);letter-spacing:3px;margin-bottom:6px;text-transform:uppercase">FIRST TO THE FINISH</div>
      <div class="td-h1" style="font-size:1.8rem;color:#a08020">BEST IN SHOW</div>
      <div style="margin:14px auto;width:90px;height:90px;border-radius:50%;border:4px solid #e8c050;overflow:hidden;position:relative;box-shadow:0 0 20px rgba(232,192,80,0.3)">
        <img src="assets/avatars/${winnerSlug}.png" alt="${winner}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(232,192,80,0.15),transparent 50%);pointer-events:none"></div>
      </div>
      <div style="font-family:'Inter',sans-serif;font-size:1.3rem;font-weight:800;color:#a08020;margin:6px 0">${winner}</div>
      <div style="font-family:'Inter',sans-serif;font-size:1rem;font-weight:600;color:var(--pet-brown);margin:4px 0">${_icon('heart')} with ${winnerAnimal.name}</div>
      <div style="font-size:0.82rem;color:var(--pet-muted);margin-top:4px;font-style:italic">${data.phase2.finishText || ''}</div>
    </div>
    <div class="td-h2" style="text-align:center">Final Leaderboard</div>
    <div style="max-width:500px;margin:0 auto">${leaderboard}</div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders['td-winner'] = rpBuildTopDogWinner;
  return _shell(content, ep, 'td-winner');
}

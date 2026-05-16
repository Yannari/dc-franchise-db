// js/chal/drumheller.js — Awwwwww, Drumheller archaeology challenge (post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

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
function portrait(name, size = 42) {
  return `<img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

const BUILD_DESC = {
  'challenge-beast': [
    (n, pr) => `${n} assembled a scientifically precise Velociraptor with anatomically correct claws. ${pr.Sub} studied the reference sheet.`,
    (n, pr) => `${n} built a towering T-Rex skeleton with perfect proportions. Every bone in the right place.`,
    (n, pr) => `${n} constructed a fearsome Spinosaurus, triple-checking fossil alignment. Textbook precision.`,
    (n, pr) => `${n} crafted a Triceratops that could pass museum inspection. ${pr.Sub} measured twice, built once.`,
    (n, pr) => `${n} created a Pteranodon with proper wingspan ratios. The detail was frankly intimidating.`,
    (n, pr) => `${n} assembled a Stegosaurus with plate-perfect accuracy. Even the tail spikes were spaced correctly.`,
  ],
  wildcard: [
    (n, pr) => `${n} built a "Funkyraptor" — a dinosaur wearing sunglasses made of twigs. ${pr.Sub} was proud.`,
    (n, pr) => `${n} constructed what ${pr.sub} called a "Party-saurus Rex." It had streamers for arms.`,
    (n, pr) => `${n} assembled a dinosaur riding a smaller dinosaur. "It's called evolution," ${pr.sub} explained.`,
    (n, pr) => `${n} built a Brontosaurus with five heads. "More heads = more dinosaur." The math checks out.`,
    (n, pr) => `${n} created a dinosaur breakdancing. The bones were in impossible positions. ${pr.Sub} called it art.`,
    (n, pr) => `${n} made a hybrid dino-bird-fish thing. "It's transitional!" ${pr.sub} insisted.`,
  ],
  'social-butterfly': [
    (n, pr) => `${n} built a crowd-pleasing baby dinosaur with big eyes. Everyone went "awww."`,
    (n, pr) => `${n} assembled a family of three dinosaurs — parent, child, egg. The crowd loved the story.`,
    (n, pr) => `${n} created a dinosaur hugging another dinosaur. "It's about friendship!" ${pr.Sub} beamed.`,
    (n, pr) => `${n} built a gentle herbivore with an adorable expression. ${pr.Sub} added little bone flowers around it.`,
    (n, pr) => `${n} constructed a nest scene with a proud mama dinosaur. It told a whole narrative.`,
    (n, pr) => `${n} made a smiling Brachiosaurus. The skull was slightly wrong but the vibes were immaculate.`,
  ],
  villain: [
    (n, pr) => `${n} built a massive skull-only display. Just teeth. Just aggression. It was ${pr.posAdj} self-portrait.`,
    (n, pr) => `${n} constructed a predator mid-kill. The victim dinosaur bore a suspicious resemblance to ${pr.posAdj} rival.`,
    (n, pr) => `${n} assembled a dinosaur throne. ${pr.Sub} sat on it. "This is MY era."`,
    (n, pr) => `${n} built a T-Rex crushing smaller dinos underfoot. Subtle as always.`,
    (n, pr) => `${n} created what ${pr.sub} called "the apex predator of strategy." It had too many teeth.`,
    (n, pr) => `${n} made a dinosaur with glowing red eyes (painted rocks). ${pr.Sub} called it "a metaphor."`,
  ],
  default: [
    (n, pr) => `${n} assembled a respectable dinosaur skeleton. Not flashy, but solid work.`,
    (n, pr) => `${n} built a Triceratops with some creative bone placement. ${pr.Sub} did ${pr.posAdj} best.`,
    (n, pr) => `${n} constructed a medium-sized raptor. A couple bones were backwards, but hey.`,
    (n, pr) => `${n} put together a Diplodocus. The neck was wobbly but it held together.`,
    (n, pr) => `${n} assembled something vaguely dinosaur-shaped. "${pr.Sub}'s a late bloomer," ${pr.sub} muttered.`,
    (n, pr) => `${n} created a pterodactyl — or maybe a pelican? The wings were ambiguous.`,
  ],
};

const VOTE_SHOCK_TEXT = [
  (n, pr) => `${n} tried to vote strategically but the lie detector BUZZED! "${pr.Sub}—I—WHAT?!" ${n} was forced to reveal ${pr.posAdj} true pick.`,
  (n, pr) => `The chair sparked violently as ${n} attempted deception! "LIAR!" the machine screamed. ${n}'s actual vote was displayed.`,
  (n, pr) => `${n} opened ${pr.posAdj} mouth to lie and got ZAPPED. "OW! Fine! FINE!" ${pr.Sub} admitted ${pr.posAdj} real choice.`,
  (n, pr) => `Smoke poured from the electrodes as ${n} tried to deceive. The machine was NOT having it.`,
  (n, pr) => `${n} said one name but the display showed another. "That machine is RIGGED!" No it isn't.`,
  (n, pr) => `The polygraph needle went haywire. ${n} was CAUGHT. ${pr.posAdj} true vote revealed itself.`,
];

const VOTE_HONEST_TEXT = [
  (n, target, pr) => `${n} voted for ${target}. The lie detector hummed quietly. Truth confirmed.`,
  (n, target, pr) => `${n} chose ${target}. No shock. Honest answer.`,
  (n, target, pr) => `"${target}," ${n} said clearly. The machine stayed calm. ${pr.Sub} meant it.`,
  (n, target, pr) => `${n} cast ${pr.posAdj} vote for ${target}. The needle barely moved. Truthful.`,
  (n, target, pr) => `${n} pointed at ${target}. The electrodes didn't even twitch. Genuine pick.`,
  (n, target, pr) => `"My vote goes to ${target}." ${n}'s voice was steady. The detector confirmed: honest.`,
];

const DIG_START_TEXT = [
  () => `${host()} led the group to the Drumheller badlands — a vast canyon of red rock and exposed strata.`,
  () => `The canyon walls rose on either side, striped with millions of years of geological history.`,
  () => `Somewhere in this ancient riverbed, a barrel was buried. First to find it wins.`,
  () => `Dust devils swirled between the fossil beds. The dig was on.`,
  () => `${host()} handed out the tools. "Dig deep, dig fast. There's a barrel down there somewhere."`,
  () => `The badlands stretched endlessly — layers of sandstone, clay, and secrets.`,
];

const DIG_PROGRESS_TEXT = [
  (n, pr, tool) => `${n} drove ${pr.posAdj} ${tool} into the hardpack, sending chips of sandstone flying.`,
  (n, pr, tool) => `${n} worked ${pr.posAdj} site methodically, ${pr.posAdj} ${tool} biting into the earth.`,
  (n, pr, tool) => `Sweat dripped from ${n}'s brow as ${pr.sub} swung ${pr.posAdj} ${tool} into the canyon floor.`,
  (n, pr, tool) => `${n} found a soft layer and ${pr.posAdj} ${tool} sank deep. Progress.`,
  (n, pr, tool) => `${n}'s ${tool} struck something hard — just a rock. ${pr.Sub} kept digging.`,
  (n, pr, tool) => `${n} grunted with effort, ${pr.posAdj} ${tool} carving through ancient sediment.`,
  (n, pr, tool) => `Dust clouds rose as ${n} attacked ${pr.posAdj} site with ${pr.posAdj} ${tool}.`,
  (n, pr, tool) => `${n} hit a clay pocket and made excellent progress, ${pr.posAdj} ${tool} sliding through easily.`,
];

const BOULDER_HIT_TEXT = [
  (n, pr) => `A boulder broke loose from the cliff face and CRUSHED ${n}'s dig site! ${pr.Sub} was trapped!`,
  (n, pr) => `CRASH! Falling rocks buried ${n} up to ${pr.posAdj} waist! ${pr.Sub} couldn't move!`,
  (n, pr) => `The canyon wall crumbled and ${n} disappeared under a pile of rubble!`,
  (n, pr) => `A landslide caught ${n} off-guard — rocks pinned ${pr.posAdj} legs to the ground!`,
  (n, pr) => `${n} looked up just in time to see the boulder — but not in time to dodge. TRAPPED.`,
  (n, pr) => `The earth shifted and rocks cascaded onto ${n}! ${pr.Sub} was buried from the waist down!`,
];

const BOULDER_DODGE_TEXT = [
  (n, pr) => `${n} heard the crack above and DOVE sideways! The boulder smashed where ${pr.sub} had been standing!`,
  (n, pr) => `${n} spotted the falling rocks and rolled clear just in time! Close call!`,
  (n, pr) => `${n}'s instincts kicked in — ${pr.sub} leapt back as the rockslide crashed down!`,
  (n, pr) => `${n} dodged! The boulder whizzed past ${pr.posAdj} head by inches!`,
  (n, pr) => `${n} saw the shadow and jumped. The rocks exploded behind ${pr.obj}. "THAT WAS CLOSE!"`,
  (n, pr) => `Quick reflexes saved ${n} as ${pr.sub} sidestepped the falling debris!`,
];

const RESCUE_TEXT = [
  (rescuer, trapped, rpr) => `${rescuer} dropped everything and sprinted to ${trapped}'s side! ${rpr.Sub} hauled rocks off one by one!`,
  (rescuer, trapped, rpr) => `${rescuer} saw ${trapped} struggling and ran to help! "Hang on!" ${rpr.sub} pulled ${trapped} free!`,
  (rescuer, trapped, rpr) => `Without hesitation, ${rescuer} abandoned ${rpr.posAdj} dig to rescue ${trapped}!`,
  (rescuer, trapped, rpr) => `${rescuer} threw ${rpr.posAdj} tool aside and dug ${trapped} out with bare hands!`,
  (rescuer, trapped, rpr) => `"I got you!" ${rescuer} cleared the rubble from ${trapped} in record time!`,
  (rescuer, trapped, rpr) => `${rescuer} sacrificed ${rpr.posAdj} lead to pull ${trapped} from the rocks!`,
];

const IGNORE_TEXT = [
  (ignorer, trapped) => `${ignorer} glanced at ${trapped}'s predicament... and kept digging.`,
  (ignorer, trapped) => `${ignorer} heard ${trapped}'s calls for help. ${ignorer} pretended not to.`,
  (ignorer, trapped) => `${trapped} struggled under the rocks. ${ignorer} was too focused on ${ignorer}'s own site to notice. Allegedly.`,
  (ignorer, trapped) => `${ignorer} looked away from ${trapped}. "Every second counts," ${ignorer} muttered.`,
];

const BARREL_FIND_TEXT = [
  (n, pr) => `${n}'s ${pr.posAdj} tool struck metal! A hollow CLANG echoed through the canyon! THE BARREL!`,
  (n, pr) => `The earth gave way and there it was — a rusted oil barrel! ${n} FOUND IT!`,
  (n, pr) => `${n} felt something solid and dug frantically — BARREL! "I GOT IT! I GOT IT!"`,
  (n, pr) => `A flash of rusted metal under the sandstone — ${n} had found the barrel!`,
  (n, pr) => `${n} pulled back a layer of clay and gasped. The barrel. Right there. IMMUNITY.`,
  (n, pr) => `${n}'s fingers scraped across metal. ${pr.Sub} dug faster. It was THE BARREL!`,
];

const SOCIAL_DIG_TEXT = {
  showmance: [
    (a, b) => `${a} and ${b} shared a water break, fingers brushing over the canteen. The canyon heat wasn't the only warmth.`,
    (a, b) => `${a} wiped dust from ${b}'s face. "You've got dirt... everywhere." They both laughed.`,
    (a, b) => `${b} found a heart-shaped rock and tossed it to ${a}. "Fossil of our love." Eye-rolls from everyone.`,
    (a, b) => `${a} and ${b} dug side by side, stealing glances between swings. The canyon was romantic, somehow.`,
  ],
  rivalry: [
    (a, b) => `${a} and ${b} locked eyes across the dig site. ${a} dug harder. So did ${b}. It was ON.`,
    (a, b) => `${b} "accidentally" kicked dirt into ${a}'s hole. ${a} returned the favor with interest.`,
    (a, b) => `"Nice technique," ${a} sneered at ${b}. "Did you learn that at LOSER school?"`,
    (a, b) => `${a} side-eyed ${b}'s progress and picked up the pace. No way ${b} was winning this.`,
  ],
  coprolite: [
    (n, pr) => `${n} found something round in the dirt. "A dinosaur egg!" Nope. Fossilized dino dung. ${pr.Sub} screamed.`,
    (n, pr) => `${n} unearthed what ${pr.sub} thought was a gem. It was 65-million-year-old poop. ${pr.Sub} dropped it.`,
    (n, pr) => `"I found a fossil!" ${n} announced proudly. ${host()}: "That's coprolite." ${n}: "What's—" ${host()}: "Dino poop."`,
    (n, pr) => `${n} cracked open a rock to find coprolite. "It's ANCIENT dung!" ${pr.Sub} was oddly impressed.`,
  ],
  toolEnvy: [
    (have, haveNot, tool) => `${haveNot} eyed ${have}'s ${tool} jealously. "Trade you?" ${have}: "Not a chance."`,
    (have, haveNot, tool) => `${have}'s ${tool} tore through earth while ${haveNot} struggled. "Life isn't fair," ${have} smirked.`,
    (have, haveNot, tool) => `"That ${tool} should be MINE," ${haveNot} muttered, watching ${have} make easy progress.`,
    (have, haveNot, tool) => `${haveNot} glanced at ${have}'s ${tool}. Then at ${haveNot}'s bare hands. ${haveNot} sighed dramatically.`,
  ],
};

const ATMOSPHERE_BUILD = [
  `The paleontology tent fluttered in the canyon breeze. Bone fragments littered the workstations.`,
  `Reference charts of dinosaur skeletons hung from the tent poles, covered in dust.`,
  `A timer ticked overhead. Bones clattered against worktables.`,
  `The smell of ancient earth filled the air. This was REAL archaeology. Sort of.`,
  `${host()} circled the stations like a museum critic. "Fascinating. Terrible. Fascinating."`,
  `Somewhere in the distance, a coyote howled. The canyon was alive with history.`,
  `Trowels scraped. Bones clicked into place. The competition was silent and intense.`,
  `A fossil expert watched from the sidelines, wincing at the bone placement choices.`,
  `The desert sun beat down on the dig site. Sweat and determination in equal measure.`,
  `Layers of sandstone told stories millions of years old. Today they'd tell one more.`,
];

const ATMOSPHERE_VOTE = [
  `The lie-detector chair hummed with menacing electricity. Wires snaked across the platform.`,
  `A spotlight bore down on the chair. There was no hiding from the truth here.`,
  `The polygraph needles twitched with anticipation. Someone was about to get CAUGHT.`,
  `${host()} adjusted the electrodes with entirely too much enjoyment. "This won't hurt. Much."`,
  `The truth machine whirred. Its accuracy rate: 100%. Its mercy rate: 0%.`,
  `Nervous laughter rippled through the group. Nobody liked the look of those wires.`,
  `The chair crackled. A small spark jumped between electrodes. "That's normal," ${host()} assured nobody.`,
  `The canyon echoed with the machine's ominous buzzing. Honesty was the only option.`,
  `Someone gulped audibly. The lie detector seemed to GROW more menacing.`,
  `Blue-green light pulsed from the machine's core. It was almost alive. Almost hungry for lies.`,
];

const ATMOSPHERE_DIG = [
  `Canyon wind whistled through the badlands, carrying dust and ancient whispers.`,
  `The red cliffs towered overhead, striped with eons of geological time.`,
  `Distant thunder rumbled. Or was that another rockslide?`,
  `Shovels clinked against stone. The rhythm of the dig was hypnotic.`,
  `A hawk circled overhead, watching the chaos below with prehistoric patience.`,
  `The canyon floor was a patchwork of excavation sites — holes everywhere.`,
  `Dust devils danced between the dig stations like ghostly spectators.`,
  `The sun cast long shadows through the hoodoos. Time was running out.`,
  `Ancient riverbeds crisscrossed the canyon floor. The barrel could be in any of them.`,
  `Somewhere deep in the earth, metal waited to be found. The race was relentless.`,
];

const TOOL_NAMES = { 3: 'Post Digger', 2: 'Prospector Kit', 1: 'Bucket', 0: 'bare hands' };

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateDrumheller(ep) {
  const active = players.filter(p => p.status === 'active' && p.name !== ep.exileDuelPlayer).map(p => p.name);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // Romance hook
  _challengeRomanceSpark(active, null, null);

  // ══ PHASE 1: DINOSAUR BUILD ══
  const builds = {};
  for (const name of active) {
    const s = pStats(name);
    const quality = s.mental * 0.4 + s.boldness * 0.3 + s.social * 0.3 + noise(2.5);
    const a = arch(name);
    let descPool = BUILD_DESC.default;
    if (a === 'challenge-beast') descPool = BUILD_DESC['challenge-beast'];
    else if (a === 'wildcard' || a === 'chaos-agent') descPool = BUILD_DESC.wildcard;
    else if (a === 'social-butterfly' || a === 'showmancer') descPool = BUILD_DESC['social-butterfly'];
    else if (VILLAIN.has(a)) descPool = BUILD_DESC.villain;

    const pr = pronouns(name);
    builds[name] = {
      quality: clamp(quality, 2, 14),
      desc: pick(descPool)(name, pr),
    };
    ep.chalMemberScores[name] += clamp(quality, 5, 12);
  }

  // ══ LIE-DETECTOR VOTE ══
  const votes = {}; // voter → target
  const votesReceived = {}; // target → count
  active.forEach(n => { votesReceived[n] = 0; });
  const shockMoments = []; // { voter, triedTarget, actualTarget }

  for (const voter of active) {
    const s = pStats(voter);
    const a = arch(voter);
    const pr = pronouns(voter);

    // Score each potential target
    const candidates = active.filter(n => n !== voter);
    const scored = candidates.map(target => {
      const qualityWeight = builds[target].quality * 0.5;
      const bondWeight = getBond(voter, target) * 0.3;
      // Personality: villains vote for weak to eliminate threats, nice vote for best
      let archWeight = 0;
      if (VILLAIN.has(a)) {
        // Villains want to vote strategically (NOT for best) but get caught
        archWeight = -builds[target].quality * 0.2;
      } else if (NICE.has(a)) {
        archWeight = builds[target].quality * 0.2;
      } else {
        archWeight = noise(1);
      }
      return { target, score: qualityWeight + bondWeight + archWeight + noise(1.5) };
    }).sort((a, b) => b.score - a.score);

    const actualTarget = scored[0].target;

    // Villains try to lie → get shocked
    if (VILLAIN.has(a) && Math.random() < 0.7) {
      // They tried to say a different name
      const fakeTarget = scored[Math.min(scored.length - 1, 2 + Math.floor(Math.random() * 2))].target;
      if (fakeTarget !== actualTarget) {
        shockMoments.push({ voter, triedTarget: fakeTarget, actualTarget });
        popDelta(voter, 1); // entertainment value
        ep.campEvents[campKey].post.push({
          text: `${voter} got SHOCKED by the lie detector trying to hide ${pr.posAdj} true vote!`,
          players: [voter], badgeText: 'SHOCKED', badgeClass: 'red', tag: 'drumheller',
        });
      }
    }

    votes[voter] = actualTarget;
    votesReceived[actualTarget] = (votesReceived[actualTarget] || 0) + 1;
  }

  // Vote scoring
  for (const name of active) {
    ep.chalMemberScores[name] += (votesReceived[name] || 0) * 3;
  }

  // Social fallout from votes
  const voteFallout = [];
  for (const voter of active) {
    const target = votes[voter];
    // Betrayal: ally didn't vote for you
    for (const other of active) {
      if (other === voter) continue;
      if (votes[other] !== voter && getBond(voter, other) >= 3) {
        // Voter expected ally 'other' to vote for them
        if (Math.random() < 0.4) { // don't trigger for every pair
          const delta = -(1 + Math.floor(Math.random() * 2));
          addBond(voter, other, delta);
          voteFallout.push({ type: 'betrayal', a: voter, b: other, delta });
          ep.campEvents[campKey].post.push({
            text: `${voter} felt betrayed that ${other} didn't vote for ${pronouns(voter).posAdj} dinosaur.`,
            players: [voter, other], badgeText: 'BETRAYED', badgeClass: 'red', tag: 'drumheller',
          });
        }
      }
    }
    // Grudging respect: enemy voted for you
    if (VILLAIN.has(arch(target)) || getBond(voter, target) <= -2) {
      if (votes[voter] === target || (getBond(target, voter) <= -2 && votes[target] === voter)) {
        // enemy voted for me
      }
    }
  }
  // Check for grudging respect (enemy voted FOR you)
  for (const voter of active) {
    const target = votes[voter];
    if (getBond(voter, target) <= -2) {
      addBond(target, voter, 1);
      voteFallout.push({ type: 'respect', a: target, b: voter });
      if (Math.random() < 0.5) {
        ep.campEvents[campKey].post.push({
          text: `${target} was surprised ${voter} voted for ${pronouns(target).obj}. Grudging respect earned.`,
          players: [target, voter], badgeText: 'RESPECT', badgeClass: 'blue', tag: 'drumheller',
        });
      }
    }
  }
  // Zero votes → popularity hit
  for (const name of active) {
    if (votesReceived[name] === 0) {
      popDelta(name, -2);
      voteFallout.push({ type: 'zero', name });
      ep.campEvents[campKey].post.push({
        text: `Nobody voted for ${name}'s dinosaur. Not a single person. Ouch.`,
        players: [name], badgeText: 'IGNORED', badgeClass: 'grey', tag: 'drumheller',
      });
    }
  }

  // Rank by votes received (tiebreak by quality)
  const voteRanking = [...active].sort((a, b) => {
    if (votesReceived[b] !== votesReceived[a]) return votesReceived[b] - votesReceived[a];
    return builds[b].quality - builds[a].quality;
  });
  const toolBonus = {};
  voteRanking.forEach((name, i) => {
    if (i === 0) toolBonus[name] = 3;
    else if (i === 1) toolBonus[name] = 2;
    else if (i === 2) toolBonus[name] = 1;
    else toolBonus[name] = 0;
  });

  // ══ PHASE 2: BARREL DIG ══
  const digProgress = {};
  const trapped = {}; // name → { round trapped, rescuer? }
  const digEvents = []; // { round, type, ... }
  const roundData = [];
  active.forEach(n => { digProgress[n] = 0; });

  let winner = null;
  const THRESHOLD = 38;
  const maxRounds = 8;

  for (let round = 1; round <= maxRounds && !winner; round++) {
    const roundEvents = [];

    // Dig progress
    for (const name of active) {
      if (trapped[name] && trapped[name].freeRound > round - 1) {
        roundEvents.push({ type: 'still-trapped', name });
        continue;
      }
      // Free from trap
      if (trapped[name] && trapped[name].freeRound === round - 1) {
        delete trapped[name];
      }

      const s = pStats(name);
      const progress = s.physical * 0.4 + s.endurance * 0.4 + (toolBonus[name] || 0) + noise(2.5);
      digProgress[name] += Math.max(0.5, progress);

      if (digProgress[name] >= THRESHOLD && !winner) {
        winner = name;
        roundEvents.push({ type: 'barrel-found', name });
      } else {
        roundEvents.push({ type: 'dig', name, progress: Math.max(0.5, progress) });
      }
    }

    // Boulder hazard (1-2 per round)
    const boulderCount = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let b = 0; b < boulderCount && !winner; b++) {
      // Slight bias toward leaders
      const digRanked = active.filter(n => !trapped[n]).sort((a, b) => digProgress[b] - digProgress[a]);
      if (digRanked.length < 2) break;
      const weights = digRanked.map((_, i) => Math.max(1, digRanked.length - i));
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * totalWeight;
      let targetIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { targetIdx = i; break; }
      }
      const boulderTarget = digRanked[targetIdx];
      const s = pStats(boulderTarget);
      const dodgeChance = (s.physical * 0.3 + s.intuition * 0.3 + noise(2)) / 10;

      if (Math.random() < clamp(dodgeChance, 0.15, 0.7)) {
        roundEvents.push({ type: 'boulder-dodge', name: boulderTarget });
        popDelta(boulderTarget, 1);
      } else {
        trapped[boulderTarget] = { round, freeRound: round + 1 };
        roundEvents.push({ type: 'boulder-hit', name: boulderTarget });

        // Rescue attempts
        const potentialRescuers = active.filter(n => n !== boulderTarget && !trapped[n]);
        let rescued = false;
        for (const rescuer of potentialRescuers) {
          const ra = arch(rescuer);
          const bond = getBond(rescuer, boulderTarget);
          let willRescue = false;

          if (NICE.has(ra)) {
            if (ra === 'hero' || ra === 'loyal-soldier') willRescue = bond >= 0;
            else willRescue = bond >= 2 || (gs.showmances?.some(sh => !sh.broken && ((sh.a === rescuer && sh.b === boulderTarget) || (sh.b === rescuer && sh.a === boulderTarget))));
          } else if (VILLAIN.has(ra)) {
            willRescue = bond >= 5 || (pStats(rescuer).strategic * 0.3 + noise(2) > 4);
          } else {
            willRescue = bond >= 3;
          }

          if (willRescue && !rescued) {
            rescued = true;
            trapped[boulderTarget].freeRound = round; // freed this round
            trapped[boulderTarget].rescuer = rescuer;
            // Cost: lose half progress this round
            digProgress[rescuer] -= Math.max(0, (pStats(rescuer).physical * 0.2 + noise(1)));
            // Reward
            addBond(rescuer, boulderTarget, 2);
            addBond(boulderTarget, rescuer, 2);
            popDelta(rescuer, 2);
            roundEvents.push({ type: 'rescue', rescuer, trapped: boulderTarget });
            ep.campEvents[campKey].post.push({
              text: `${rescuer} heroically rescued ${boulderTarget} from a rockslide during the dig!`,
              players: [rescuer, boulderTarget], badgeText: 'RESCUE', badgeClass: 'gold', tag: 'drumheller',
            });
            ep.chalMemberScores[rescuer] += 3;
            // Showmance moment
            if (gs.showmances?.some(sh => !sh.broken && ((sh.a === rescuer && sh.b === boulderTarget) || (sh.b === rescuer && sh.a === boulderTarget)))) {
              _checkShowmanceChalMoment(rescuer, boulderTarget, null, null);
            }
            break;
          }
        }

        // If not rescued, check if trapped player notices ignorers
        if (!rescued) {
          const st = pStats(boulderTarget);
          const noticeChance = (st.mental + st.intuition > 12) ? 0.6 : 0.3;
          for (const ignorer of potentialRescuers) {
            if (Math.random() < noticeChance && getBond(boulderTarget, ignorer) > -5) {
              addBond(boulderTarget, ignorer, -1);
              roundEvents.push({ type: 'ignore-noticed', ignorer, trapped: boulderTarget });
            }
          }
        }
      }
    }

    // Social events between rounds (1-2)
    const socialCount = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let s = 0; s < socialCount && !winner; s++) {
      const socialType = _pickSocialEvent(active, trapped, toolBonus);
      if (socialType) {
        roundEvents.push(socialType);
        // Apply consequences
        if (socialType.type === 'showmance-moment') {
          _checkShowmanceChalMoment(socialType.a, socialType.b, null, null);
        } else if (socialType.type === 'rivalry') {
          addBond(socialType.a, socialType.b, -1);
          popDelta(socialType.a, 1); // entertainment
        } else if (socialType.type === 'coprolite') {
          popDelta(socialType.name, -1);
        } else if (socialType.type === 'tool-envy') {
          addBond(socialType.haveNot, socialType.have, -1);
        }
      }
    }

    roundData.push({ round, events: roundEvents, winner: winner || null });
  }

  // If nobody found barrel in maxRounds, closest player wins
  if (!winner) {
    winner = active.reduce((best, n) => digProgress[n] > digProgress[best] ? n : best, active[0]);
  }

  // Dig scoring
  const maxDig = Math.max(...active.map(n => digProgress[n]));
  for (const name of active) {
    ep.chalMemberScores[name] += clamp((digProgress[name] / maxDig) * 15, 5, 15);
  }

  // Immunity winner bonus
  const maxOther = Math.max(...active.filter(n => n !== winner).map(n => ep.chalMemberScores[n]));
  ep.chalMemberScores[winner] = maxOther + active.length + 5;

  // Placements
  const chalPlacements = [...active].sort((a, b) => ep.chalMemberScores[b] - ep.chalMemberScores[a]);

  // ══ FINALIZE ══
  ep.challengeData = {
    builds,
    votes,
    votesReceived,
    shockMoments,
    voteFallout,
    voteRanking,
    toolBonus,
    digProgress,
    roundData,
    winner,
    immunityWinner: winner,
    active,
  };
  ep.isDrumheller = true;
  ep.challengeType = 'drumheller';
  ep.challengeLabel = 'Awwwwww, Drumheller';
  ep.challengeCategory = 'adventure';
  ep.chalPlacements = chalPlacements;
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  updateChalRecord(ep);
}

// ── Social event picker ──
function _pickSocialEvent(active, trapped, toolBonus) {
  const freeActive = active.filter(n => !trapped[n]);
  if (freeActive.length < 2) return null;

  // Check for showmance pair
  if (gs.showmances?.length && Math.random() < 0.35) {
    for (const sm of gs.showmances) {
      if (!sm.broken && freeActive.includes(sm.a) && freeActive.includes(sm.b)) {
        return { type: 'showmance-moment', a: sm.a, b: sm.b };
      }
    }
  }

  // Rivalry between enemies
  if (Math.random() < 0.4) {
    for (const a of freeActive) {
      for (const b of freeActive) {
        if (a !== b && getBond(a, b) <= -3) {
          return { type: 'rivalry', a, b };
        }
      }
    }
  }

  // Coprolite discovery
  if (Math.random() < 0.25) {
    const name = pick(freeActive);
    return { type: 'coprolite', name };
  }

  // Tool envy
  if (Math.random() < 0.3 && toolBonus) {
    const haves = freeActive.filter(n => (toolBonus[n] || 0) >= 2);
    const haveNots = freeActive.filter(n => (toolBonus[n] || 0) === 0);
    if (haves.length && haveNots.length) {
      const toolNames = { 3: 'Post Digger', 2: 'Prospector Kit', 1: 'Beach Bucket' };
      const have = pick(haves);
      return { type: 'tool-envy', have, haveNot: pick(haveNots), tool: toolNames[toolBonus[have]] || 'better tool' };
    }
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
  .dh-shell{
    --sandstone:#e8c486;--amber:#d68a3a;--terracotta:#b5562c;--soil:#4a2e18;
    --dark:#0e0a06;--cream:#f1e3c4;--red:#a8281c;--electric:#2dd4bf;--sky:#38bdf8;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--cream);
    background:var(--dark);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:3px solid var(--soil);box-shadow:0 4px 32px rgba(0,0,0,0.6);
  }
  .dh-shell *{box-sizing:border-box}

  /* Sediment strata background */
  .dh-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:
      linear-gradient(180deg,
        transparent 0%,
        rgba(232,196,134,0.03) 20%,
        rgba(214,138,58,0.04) 40%,
        rgba(181,86,44,0.05) 60%,
        rgba(74,46,24,0.06) 80%,
        transparent 100%),
      repeating-linear-gradient(180deg,
        transparent 0px, transparent 60px,
        rgba(232,196,134,0.03) 60px, rgba(232,196,134,0.03) 62px,
        transparent 62px, transparent 120px);
    animation:dh-strata 20s linear infinite}
  @keyframes dh-strata{0%{background-position:0 0}100%{background-position:0 60px}}

  /* Dust particles */
  .dh-shell::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
    background-image:
      radial-gradient(circle 1px,rgba(232,196,134,0.15) 0%,transparent 100%),
      radial-gradient(circle 1px,rgba(232,196,134,0.1) 0%,transparent 100%);
    background-size:80px 80px, 120px 120px;
    background-position:20px 20px, 60px 40px;
    animation:dh-dust 8s linear infinite}
  @keyframes dh-dust{0%{transform:translateY(0)}100%{transform:translateY(-20px)}}

  @media(prefers-reduced-motion:reduce){
    .dh-shell::before,.dh-shell::after{animation:none}
    .dh-card,.dh-card-vote,.dh-card-dig{animation:none!important;opacity:1!important;transform:none!important}
  }

  /* ═══ LAYOUT ═══ */
  .dh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
  .dh-feed{flex:1;padding:16px 20px;min-width:0}
  .dh-sidebar{width:240px;flex-shrink:0;padding:14px;
    background:linear-gradient(180deg,rgba(74,46,24,0.95),rgba(14,10,6,0.98));
    border-left:2px solid var(--soil);position:sticky;top:46px;align-self:flex-start;max-height:calc(100vh - 46px);overflow-y:auto}

  /* ═══ TITLE ═══ */
  .dh-title{text-align:center;padding:32px 20px;position:relative;z-index:5;
    border-bottom:2px solid var(--soil)}
  .dh-title h1{font-family:Georgia,serif;font-size:36px;color:var(--red);
    text-shadow:2px 2px 0 rgba(0,0,0,0.5);letter-spacing:2px;margin:0 0 8px}
  .dh-title h2{font-family:Georgia,serif;font-size:18px;color:var(--sandstone);
    font-style:italic;margin:0;opacity:0.8}

  /* ═══ PHASE HEADER ═══ */
  .dh-phase-hdr{font-family:Georgia,serif;font-size:22px;color:var(--amber);
    border-bottom:1px solid var(--soil);padding:12px 0 8px;margin:20px 0 12px;
    text-transform:uppercase;letter-spacing:3px}

  /* ═══ CARDS ═══ */
  .dh-card{border:1px solid var(--soil);border-radius:6px;margin:10px 0;padding:14px;
    background:linear-gradient(135deg,rgba(74,46,24,0.6),rgba(14,10,6,0.8));
    box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;overflow:hidden;
    opacity:0;transform:translateX(-30px);transition:opacity 0.4s,transform 0.4s}
  .dh-card.visible{opacity:1;transform:translateX(0)}

  .dh-card-vote{border:1px solid var(--electric);border-radius:6px;margin:10px 0;padding:14px;
    background:linear-gradient(135deg,rgba(10,30,40,0.9),rgba(5,15,25,0.95));
    box-shadow:0 0 12px rgba(45,212,191,0.15);position:relative;overflow:hidden;
    opacity:0;transform:rotateY(90deg);transition:opacity 0.4s,transform 0.5s}
  .dh-card-vote.visible{opacity:1;transform:rotateY(0)}

  .dh-card-dig{border:1px solid var(--terracotta);border-radius:6px;margin:10px 0;padding:14px;
    background:linear-gradient(135deg,rgba(100,40,20,0.4),rgba(50,20,10,0.6));
    box-shadow:0 3px 12px rgba(0,0,0,0.4);position:relative;overflow:hidden;
    opacity:0;transform:translateY(-20px);transition:opacity 0.4s,transform 0.4s}
  .dh-card-dig.visible{opacity:1;transform:translateY(0)}

  /* Social event cards */
  .dh-card-social{border:1px dashed var(--sandstone);border-radius:6px;margin:8px 0;padding:12px;
    background:rgba(232,196,134,0.08);opacity:0;transform:scale(0.95);transition:opacity 0.3s,transform 0.3s}
  .dh-card-social.visible{opacity:1;transform:scale(1)}

  /* ═══ PLAYER ROW ═══ */
  .dh-player-row{display:flex;align-items:center;gap:10px;margin:6px 0}
  .dh-player-name{font-weight:700;color:var(--sandstone);font-size:14px}
  .dh-player-detail{color:var(--cream);opacity:0.85;font-size:13px;line-height:1.4}

  /* ═══ BADGE ═══ */
  .dh-badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;
    font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .dh-badge-gold{background:var(--amber);color:var(--dark)}
  .dh-badge-red{background:var(--red);color:#fff}
  .dh-badge-blue{background:var(--sky);color:var(--dark)}
  .dh-badge-green{background:#22c55e;color:var(--dark)}
  .dh-badge-grey{background:#64748b;color:#fff}

  /* ═══ VOTE DISPLAY ═══ */
  .dh-vote-arrow{color:var(--electric);font-weight:700;font-size:18px;margin:0 8px}
  .dh-shock{animation:dh-zap 0.5s ease;color:#fbbf24}
  @keyframes dh-zap{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}

  /* ═══ PROGRESS BAR ═══ */
  .dh-progress{height:8px;background:rgba(74,46,24,0.5);border-radius:4px;overflow:hidden;margin:4px 0}
  .dh-progress-fill{height:100%;border-radius:4px;transition:width 0.5s;
    background:linear-gradient(90deg,var(--terracotta),var(--amber))}
  .dh-progress-fill.winner{background:linear-gradient(90deg,#22c55e,#4ade80)}

  /* ═══ SIDEBAR ═══ */
  .dh-sb-title{font-family:Georgia,serif;font-size:14px;color:var(--amber);
    text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid var(--soil);padding-bottom:6px;margin-bottom:10px}
  .dh-sb-player{display:flex;align-items:center;gap:8px;margin:6px 0;padding:4px;
    border-radius:4px;background:rgba(74,46,24,0.3)}
  .dh-sb-score{font-size:12px;color:var(--sandstone);margin-left:auto;font-weight:700}

  /* ═══ ATMOSPHERE ═══ */
  .dh-atmo{font-style:italic;color:rgba(232,196,134,0.5);font-size:12px;text-align:center;
    margin:16px 0;letter-spacing:1px}

  /* ═══ ICON SYSTEM ═══ */
  .dh-icon{display:inline-block;width:18px;height:18px;vertical-align:middle;margin-right:4px}
  .dh-icon-bone{background:linear-gradient(45deg,var(--cream) 25%,transparent 25%,transparent 50%,var(--cream) 50%,var(--cream) 75%,transparent 75%);
    background-size:4px 4px;border-radius:8px;border:1.5px solid var(--cream)}
  .dh-icon-skull{border-radius:50% 50% 40% 40%;border:2px solid var(--sandstone);position:relative}
  .dh-icon-skull::after{content:'';position:absolute;bottom:1px;left:3px;right:3px;height:4px;
    border-top:1.5px solid var(--sandstone)}
  .dh-icon-pick{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
    border-bottom:14px solid var(--amber);position:relative;display:inline-block;margin-right:6px}
  .dh-icon-pick::after{content:'';position:absolute;top:8px;left:-3px;width:10px;height:2px;background:var(--soil)}
  .dh-icon-boulder{width:16px;height:14px;background:var(--terracotta);border-radius:40% 50% 45% 55%;
    display:inline-block;vertical-align:middle;margin-right:4px;border:1px solid rgba(0,0,0,0.3)}
  .dh-icon-shock{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;
    border-top:12px solid #fbbf24;display:inline-block;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
    width:16px;height:16px;background:#fbbf24;vertical-align:middle;margin-right:4px}
  .dh-icon-rescue{width:16px;height:16px;border:2px solid var(--amber);border-radius:50%;
    display:inline-block;vertical-align:middle;margin-right:4px;position:relative}
  .dh-icon-rescue::after{content:'';position:absolute;top:4px;left:5px;width:4px;height:7px;
    background:var(--amber);border-radius:2px}
  .dh-icon-barrel{width:14px;height:16px;background:var(--soil);border:2px solid var(--amber);
    border-radius:3px;display:inline-block;vertical-align:middle;margin-right:4px;position:relative}
  .dh-icon-barrel::after{content:'';position:absolute;top:6px;left:0;right:0;height:2px;background:var(--amber)}

  /* ═══ CONTROLS ═══ */
  .dh-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:999;
    background:rgba(14,10,6,0.95);border-top:2px solid var(--soil);padding:8px 20px;
    display:flex;align-items:center;gap:12px;border-radius:8px 8px 0 0;backdrop-filter:blur(8px)}
  .dh-btn{background:var(--terracotta);color:var(--cream);border:none;padding:6px 14px;
    border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:1px}
  .dh-btn:hover{background:var(--amber);color:var(--dark)}
  .dh-btn:disabled{opacity:0.4;cursor:not-allowed}
  .dh-counter{color:var(--sandstone);font-size:12px;font-weight:700}

  /* ═══ RESULTS ═══ */
  .dh-result-card{border:2px solid var(--amber);border-radius:8px;padding:16px;margin:12px 0;
    background:linear-gradient(135deg,rgba(214,138,58,0.15),rgba(74,46,24,0.3));text-align:center}
  .dh-winner-name{font-family:Georgia,serif;font-size:28px;color:var(--amber);
    text-shadow:0 0 20px rgba(214,138,58,0.5)}

  /* ═══ PHASE BACKGROUNDS ═══ */
  .dh-phase-build{background:linear-gradient(180deg,rgba(74,46,24,0.2) 0%,rgba(214,138,58,0.05) 100%)}
  .dh-phase-vote{background:linear-gradient(180deg,rgba(10,30,40,0.3) 0%,rgba(45,212,191,0.03) 100%)}
  .dh-phase-dig{background:linear-gradient(180deg,rgba(100,40,20,0.2) 0%,rgba(181,86,44,0.05) 100%)}
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — ICONS
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    bone: '<span class="dh-icon dh-icon-bone"></span>',
    skull: '<span class="dh-icon dh-icon-skull"></span>',
    pick: '<span class="dh-icon-pick"></span>',
    boulder: '<span class="dh-icon-boulder"></span>',
    shock: '<span class="dh-icon-shock"></span>',
    rescue: '<span class="dh-icon-rescue"></span>',
    barrel: '<span class="dh-icon-barrel"></span>',
  };
  return map[type] || '';
}

// ══════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`dh-step-${suffix}-${i}`);
    if (el) el.classList.add('visible');
  }
  const counter = document.getElementById(`dh-counter-${suffix}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  const controls = document.getElementById(`dh-controls-${suffix}`);
  if (controls) {
    const btns = controls.querySelectorAll('.dh-btn');
    if (upToIdx >= total - 1) btns.forEach(b => b.disabled = true);
  }
}

export function dhRevealNext(screenKey, totalSteps) {
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  _reapplyVisibility(screenKey, state.idx, totalSteps);
  const el = document.getElementById(`dh-step-${screenKey}-${state.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
}

export function dhRevealAll(screenKey, totalSteps) {
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  window._tvState[screenKey].idx = totalSteps - 1;
  _reapplyVisibility(screenKey, totalSteps - 1, totalSteps);
  _updateSidebar(screenKey);
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('dh-sidebar-inner');
  if (!sideEl) return;
  const ep = gs.episodeHistory?.[window.vpEpNum - 1];
  if (!ep?.challengeData) return;
  const data = ep.challengeData;
  const state = window._tvState?.[screenKey];
  if (!state) return;

  let html = '';
  const phase = sideEl.closest('[data-phase]')?.getAttribute('data-phase') || 'build';

  if (phase === 'build' || screenKey.includes('build')) {
    html += `<div class="dh-sb-title">${_icon('bone')} Build Scores</div>`;
    const revealed = window._dhBuildRevealed || [];
    for (const name of revealed) {
      const b = data.builds[name];
      if (!b) continue;
      html += `<div class="dh-sb-player">${portrait(name, 28)}<span style="font-size:12px;color:var(--cream)">${name}</span>
        <span class="dh-sb-score">${b.quality.toFixed(1)}</span></div>`;
    }
  } else if (phase === 'vote' || screenKey.includes('vote')) {
    html += `<div class="dh-sb-title">${_icon('shock')} Vote Tally</div>`;
    const revealedVotes = window._dhVoteRevealed || {};
    const tally = {};
    for (const [voter, target] of Object.entries(revealedVotes)) {
      tally[target] = (tally[target] || 0) + 1;
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) {
      html += `<div class="dh-sb-player">${portrait(name, 28)}<span style="font-size:12px;color:var(--cream)">${name}</span>
        <span class="dh-sb-score">${count} vote${count > 1 ? 's' : ''}</span></div>`;
    }
    if (sorted.length === 0) html += `<div style="color:var(--cream);opacity:0.5;font-size:12px">Votes revealing...</div>`;
  } else if (phase === 'dig' || screenKey.includes('dig')) {
    html += `<div class="dh-sb-title">${_icon('pick')} Dig Progress</div>`;
    const progress = window._dhDigRevealed || {};
    const sorted = Object.entries(progress).sort((a, b) => b[1] - a[1]);
    const threshold = 38;
    for (const [name, prog] of sorted) {
      const pct = Math.min(100, (prog / threshold) * 100);
      const isWinner = name === data.winner && prog >= threshold;
      html += `<div class="dh-sb-player" style="flex-wrap:wrap">${portrait(name, 24)}
        <span style="font-size:11px;color:var(--cream)">${name}</span>
        <span class="dh-sb-score">${prog.toFixed(1)}</span>
        <div style="width:100%;margin-top:2px"><div class="dh-progress"><div class="dh-progress-fill${isWinner ? ' winner' : ''}" style="width:${pct}%"></div></div></div>
      </div>`;
    }
  }

  sideEl.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL
// ══════════════════════════════════════════════════════════════
function _shell(content, phaseCls = '') {
  return `${_css()}<div class="dh-shell ${phaseCls}">${content}</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildDHTitleCard(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const skullSvg = `<svg viewBox="0 0 80 90" width="80" height="90" style="display:block;margin:0 auto 16px">
    <ellipse cx="40" cy="35" rx="28" ry="30" fill="none" stroke="#e8c486" stroke-width="2"/>
    <circle cx="30" cy="30" r="8" fill="none" stroke="#e8c486" stroke-width="1.5"/>
    <circle cx="50" cy="30" r="8" fill="none" stroke="#e8c486" stroke-width="1.5"/>
    <path d="M35 48 L40 55 L45 48" fill="none" stroke="#e8c486" stroke-width="1.5"/>
    <rect x="30" y="62" width="4" height="8" fill="none" stroke="#e8c486" stroke-width="1"/>
    <rect x="38" y="62" width="4" height="8" fill="none" stroke="#e8c486" stroke-width="1"/>
    <rect x="46" y="62" width="4" height="8" fill="none" stroke="#e8c486" stroke-width="1"/>
  </svg>`;

  const activeCount = data.active.length;
  return _shell(`
    <div class="dh-title">
      ${skullSvg}
      <h1>AWWWWWW, DRUMHELLER</h1>
      <h2>A Paleontological Expedition</h2>
      <div style="margin-top:16px;color:var(--cream);opacity:0.7;font-size:13px">
        ${activeCount} contestants enter the badlands. One leaves with immunity.
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-size:20px;color:var(--amber)">${_icon('bone')} Phase 1</div>
          <div style="font-size:11px;color:var(--cream);opacity:0.6">Dinosaur Build + Lie-Detector Vote</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:Georgia,serif;font-size:20px;color:var(--terracotta)">${_icon('barrel')} Phase 2</div>
          <div style="font-size:11px;color:var(--cream);opacity:0.6">Barrel Dig in the Badlands</div>
        </div>
      </div>
    </div>
  `, '');
}

// ══════════════════════════════════════════════════════════════
// VP — BUILD PHASE
// ══════════════════════════════════════════════════════════════
export function rpBuildDHBuildPhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenKey = 'dh-build';
  const steps = data.active.length;

  // Store meta for sidebar
  const scriptSetup = `<script>
    window._tvState = window._tvState || {};
    window._tvState['${screenKey}'] = window._tvState['${screenKey}'] || { idx: -1 };
    window._dhBuildRevealed = window._dhBuildRevealed || [];
  </script>`;

  let cards = '';
  const shuffled = [...data.active].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const name = shuffled[i];
    const build = data.builds[name];
    const qualityLabel = build.quality >= 10 ? 'EXCELLENT' : build.quality >= 7 ? 'SOLID' : build.quality >= 4 ? 'DECENT' : 'ROUGH';
    const qualityColor = build.quality >= 10 ? '#22c55e' : build.quality >= 7 ? 'var(--amber)' : build.quality >= 4 ? 'var(--sandstone)' : 'var(--red)';

    // Atmosphere text every 3 cards
    if (i > 0 && i % 3 === 0) {
      cards += `<div id="dh-step-${screenKey}-${i}" class="dh-atmo" data-atmo="true">${pick(ATMOSPHERE_BUILD)}</div>`;
      // Adjust: atmosphere takes a slot so we need to handle indexing
    }

    cards += `<div id="dh-step-${screenKey}-${i}" class="dh-card" data-player="${name}">
      <div class="dh-player-row">
        ${portrait(name, 48)}
        <div>
          <div class="dh-player-name">${name}</div>
          <div style="font-size:11px;color:${qualityColor};font-weight:700">${qualityLabel} (${build.quality.toFixed(1)})</div>
        </div>
        <div class="dh-badge dh-badge-${build.quality >= 10 ? 'green' : build.quality >= 7 ? 'gold' : 'grey'}" style="margin-left:auto">${_icon('bone')} BUILD</div>
      </div>
      <div class="dh-player-detail" style="margin-top:8px">${build.desc}</div>
    </div>`;
  }

  // Re-index to handle atmosphere inserts — simplify: just use sequential i
  // Actually let's rebuild with proper indexing
  let properCards = '';
  let stepIdx = 0;
  for (let i = 0; i < shuffled.length; i++) {
    const name = shuffled[i];
    const build = data.builds[name];
    const qualityLabel = build.quality >= 10 ? 'EXCELLENT' : build.quality >= 7 ? 'SOLID' : build.quality >= 4 ? 'DECENT' : 'ROUGH';
    const qualityColor = build.quality >= 10 ? '#22c55e' : build.quality >= 7 ? 'var(--amber)' : build.quality >= 4 ? 'var(--sandstone)' : 'var(--red)';

    if (i > 0 && i % 3 === 0) {
      properCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-atmo dh-card" style="border:none;background:none">${pick(ATMOSPHERE_BUILD)}</div>`;
      stepIdx++;
    }

    properCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" data-player="${name}">
      <div class="dh-player-row">
        ${portrait(name, 48)}
        <div>
          <div class="dh-player-name">${name}</div>
          <div style="font-size:11px;color:${qualityColor};font-weight:700">${qualityLabel} (${build.quality.toFixed(1)})</div>
        </div>
        <div class="dh-badge dh-badge-${build.quality >= 10 ? 'green' : build.quality >= 7 ? 'gold' : 'grey'}" style="margin-left:auto">${_icon('bone')} BUILD</div>
      </div>
      <div class="dh-player-detail" style="margin-top:8px">${build.desc}</div>
    </div>`;
    stepIdx++;
  }

  const totalSteps = stepIdx;

  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls">
    <button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button>
    <button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
    <span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span>
  </div>`;

  return _shell(`
    <div class="dh-layout" data-phase="build">
      <div class="dh-feed dh-phase-build">
        <div class="dh-phase-hdr">${_icon('bone')} Phase 1: Dinosaur Build</div>
        <div style="color:var(--cream);opacity:0.7;font-size:13px;margin-bottom:12px">
          Each player assembles a dinosaur from fossil bones. Quality determines vote leverage.
        </div>
        ${properCards}
      </div>
      <div class="dh-sidebar">
        <div id="dh-sidebar-inner"></div>
      </div>
    </div>
    ${controls}
  `, 'dh-phase-build');
}

// ══════════════════════════════════════════════════════════════
// VP — VOTE PHASE
// ══════════════════════════════════════════════════════════════
export function rpBuildDHVotePhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenKey = 'dh-vote';
  const voters = [...data.active];
  let stepIdx = 0;
  let voteCards = '';

  // Intro atmosphere
  voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote">${pick(ATMOSPHERE_VOTE)}</div>`;
  stepIdx++;

  for (const voter of voters) {
    const target = data.votes[voter];
    const pr = pronouns(voter);
    const shock = data.shockMoments.find(s => s.voter === voter);

    if (shock) {
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote dh-shock" data-voter="${voter}" data-target="${target}">
        <div class="dh-player-row">
          ${portrait(voter, 40)}
          <div>
            <div class="dh-player-name" style="color:#fbbf24">${voter} ${_icon('shock')}</div>
            <div class="dh-player-detail">${pick(VOTE_SHOCK_TEXT)(voter, pr)}</div>
            <div style="margin-top:6px;display:flex;align-items:center">
              <span style="text-decoration:line-through;color:var(--red);font-size:12px">${shock.triedTarget}</span>
              <span class="dh-vote-arrow">→</span>
              <span style="color:var(--electric);font-weight:700">${target}</span>
              ${portrait(target, 28)}
            </div>
          </div>
          <div class="dh-badge dh-badge-red" style="margin-left:auto">SHOCKED</div>
        </div>
      </div>`;
    } else {
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" data-voter="${voter}" data-target="${target}">
        <div class="dh-player-row">
          ${portrait(voter, 40)}
          <div>
            <div class="dh-player-name">${voter}</div>
            <div class="dh-player-detail">${pick(VOTE_HONEST_TEXT)(voter, target, pr)}</div>
          </div>
          <span class="dh-vote-arrow">→</span>
          <div class="dh-player-row">
            ${portrait(target, 36)}
            <span style="color:var(--electric);font-weight:700">${target}</span>
          </div>
        </div>
      </div>`;
    }
    stepIdx++;

    // Atmosphere every 4 votes
    if (stepIdx % 4 === 0) {
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_VOTE)}</div></div>`;
      stepIdx++;
    }
  }

  // Vote fallout events
  if (data.voteFallout.length) {
    voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
      <div style="font-family:Georgia,serif;color:var(--amber);margin-bottom:8px">SOCIAL FALLOUT</div>`;
    for (const f of data.voteFallout) {
      if (f.type === 'betrayal') {
        voteCards += `<div style="margin:4px 0;font-size:12px;color:var(--red)">${_icon('shock')} ${f.a} felt betrayed by ${f.b} (bond ${f.delta})</div>`;
      } else if (f.type === 'respect') {
        voteCards += `<div style="margin:4px 0;font-size:12px;color:var(--electric)">${_icon('rescue')} ${f.a} gained grudging respect for ${f.b}</div>`;
      } else if (f.type === 'zero') {
        voteCards += `<div style="margin:4px 0;font-size:12px;color:var(--cream);opacity:0.6">${f.name} received zero votes. Ouch.</div>`;
      }
    }
    voteCards += `</div>`;
    stepIdx++;
  }

  // Tool assignment results
  voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote">
    <div style="font-family:Georgia,serif;color:var(--amber);margin-bottom:8px">${_icon('pick')} TOOL ASSIGNMENT</div>
    <div style="font-size:12px;color:var(--cream);opacity:0.7;margin-bottom:8px">Winners receive better digging tools for Phase 2:</div>`;
  for (let i = 0; i < Math.min(4, data.voteRanking.length); i++) {
    const name = data.voteRanking[i];
    const tool = TOOL_NAMES[data.toolBonus[name]] || 'bare hands';
    const bonusLabel = data.toolBonus[name] > 0 ? `+${data.toolBonus[name]}` : '+0';
    voteCards += `<div class="dh-player-row">
      ${portrait(name, 32)}
      <span class="dh-player-name">${name}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--amber)">${tool} (${bonusLabel})</span>
    </div>`;
  }
  if (data.voteRanking.length > 4) {
    voteCards += `<div style="font-size:11px;color:var(--cream);opacity:0.5;margin-top:4px">Everyone else: bare hands (+0)</div>`;
  }
  voteCards += `</div>`;
  stepIdx++;

  const totalSteps = stepIdx;

  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls">
    <button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button>
    <button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
    <span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span>
  </div>`;

  return _shell(`
    <div class="dh-layout" data-phase="vote">
      <div class="dh-feed dh-phase-vote">
        <div class="dh-phase-hdr">${_icon('shock')} Lie-Detector Vote</div>
        <div style="color:var(--cream);opacity:0.7;font-size:13px;margin-bottom:12px">
          Each player votes for one dinosaur. The lie detector ensures honesty. Top vote-getters earn better tools.
        </div>
        ${voteCards}
      </div>
      <div class="dh-sidebar">
        <div id="dh-sidebar-inner"></div>
      </div>
    </div>
    ${controls}
  `, 'dh-phase-vote');
}

// ══════════════════════════════════════════════════════════════
// VP — DIG PHASE
// ══════════════════════════════════════════════════════════════
export function rpBuildDHDigPhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenKey = 'dh-dig';
  let stepIdx = 0;
  let digCards = '';

  // Intro
  digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig">
    <div class="dh-player-detail">${pick(DIG_START_TEXT)}</div>
  </div>`;
  stepIdx++;

  const THRESHOLD = 38;
  const progressSnapshot = {};
  data.active.forEach(n => { progressSnapshot[n] = 0; });

  for (const rd of data.roundData) {
    // Round header
    digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig">
      <div style="font-family:Georgia,serif;color:var(--terracotta);font-size:16px;font-weight:700">
        ${_icon('pick')} Round ${rd.round}
      </div>
    </div>`;
    stepIdx++;

    for (const ev of rd.events) {
      const pr = ev.name ? pronouns(ev.name) : null;

      if (ev.type === 'dig') {
        progressSnapshot[ev.name] = (progressSnapshot[ev.name] || 0) + ev.progress;
        const tool = TOOL_NAMES[data.toolBonus[ev.name]] || 'bare hands';
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" data-player="${ev.name}" data-progress="${progressSnapshot[ev.name].toFixed(1)}">
          <div class="dh-player-row">
            ${portrait(ev.name, 36)}
            <div>
              <div class="dh-player-name">${ev.name}</div>
              <div class="dh-player-detail">${pick(DIG_PROGRESS_TEXT)(ev.name, pr, tool)}</div>
            </div>
            <span class="dh-sb-score" style="margin-left:auto">+${ev.progress.toFixed(1)}</span>
          </div>
          <div class="dh-progress"><div class="dh-progress-fill" style="width:${Math.min(100, (progressSnapshot[ev.name] / THRESHOLD) * 100)}%"></div></div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'boulder-hit') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:var(--red);box-shadow:0 0 12px rgba(168,40,28,0.3)">
          <div class="dh-player-row">
            ${_icon('boulder')}${portrait(ev.name, 36)}
            <div>
              <div class="dh-player-name" style="color:var(--red)">${ev.name}</div>
              <div class="dh-player-detail">${pick(BOULDER_HIT_TEXT)(ev.name, pr)}</div>
            </div>
            <div class="dh-badge dh-badge-red" style="margin-left:auto">TRAPPED</div>
          </div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'boulder-dodge') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:#22c55e">
          <div class="dh-player-row">
            ${_icon('boulder')}${portrait(ev.name, 36)}
            <div>
              <div class="dh-player-name" style="color:#22c55e">${ev.name}</div>
              <div class="dh-player-detail">${pick(BOULDER_DODGE_TEXT)(ev.name, pr)}</div>
            </div>
            <div class="dh-badge dh-badge-green" style="margin-left:auto">DODGED</div>
          </div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'rescue') {
        const rpr = pronouns(ev.rescuer);
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:var(--amber);box-shadow:0 0 12px rgba(214,138,58,0.3)">
          <div class="dh-player-row">
            ${_icon('rescue')}${portrait(ev.rescuer, 36)}
            <div>
              <div class="dh-player-name" style="color:var(--amber)">${ev.rescuer}</div>
              <div class="dh-player-detail">${pick(RESCUE_TEXT)(ev.rescuer, ev.trapped, rpr)}</div>
            </div>
            <div class="dh-badge dh-badge-gold" style="margin-left:auto">RESCUE</div>
          </div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'ignore-noticed') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-detail" style="color:var(--cream);opacity:0.7">${pick(IGNORE_TEXT)(ev.ignorer, ev.trapped)}</div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'still-trapped') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="opacity:0.6">
          <div class="dh-player-row">${portrait(ev.name, 28)}<span style="font-size:12px;color:var(--red)">${ev.name} is still trapped under rocks...</span></div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'barrel-found') {
        progressSnapshot[ev.name] = THRESHOLD;
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:2px solid var(--amber);box-shadow:0 0 20px rgba(214,138,58,0.5);background:linear-gradient(135deg,rgba(214,138,58,0.2),rgba(74,46,24,0.4))">
          <div style="text-align:center">
            <div style="font-family:Georgia,serif;font-size:22px;color:var(--amber);margin-bottom:8px">${_icon('barrel')} BARREL FOUND!</div>
            <div class="dh-player-row" style="justify-content:center">
              ${portrait(ev.name, 56)}
              <div class="dh-player-name" style="font-size:18px">${ev.name}</div>
            </div>
            <div class="dh-player-detail" style="margin-top:8px">${pick(BARREL_FIND_TEXT)(ev.name, pr)}</div>
          </div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'showmance-moment') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-detail">${pick(SOCIAL_DIG_TEXT.showmance)(ev.a, ev.b)}</div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'rivalry') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="border-color:var(--red)">
          <div class="dh-player-detail">${pick(SOCIAL_DIG_TEXT.rivalry)(ev.a, ev.b)}</div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'coprolite') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-detail">${pick(SOCIAL_DIG_TEXT.coprolite)(ev.name, pronouns(ev.name))}</div>
        </div>`;
        stepIdx++;
      } else if (ev.type === 'tool-envy') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-detail">${pick(SOCIAL_DIG_TEXT.toolEnvy)(ev.have, ev.haveNot, ev.tool || 'tool')}</div>
        </div>`;
        stepIdx++;
      }
    }

    // Atmosphere between rounds
    if (rd.round < data.roundData.length && !rd.winner) {
      digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_DIG)}</div></div>`;
      stepIdx++;
    }
  }

  const totalSteps = stepIdx;

  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls">
    <button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button>
    <button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
    <span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span>
  </div>`;

  return _shell(`
    <div class="dh-layout" data-phase="dig">
      <div class="dh-feed dh-phase-dig">
        <div class="dh-phase-hdr">${_icon('barrel')} Phase 2: Barrel Dig</div>
        <div style="color:var(--cream);opacity:0.7;font-size:13px;margin-bottom:12px">
          The canyon holds a buried barrel. First to dig it up wins individual immunity.
        </div>
        ${digCards}
      </div>
      <div class="dh-sidebar">
        <div id="dh-sidebar-inner"></div>
      </div>
    </div>
    ${controls}
  `, 'dh-phase-dig');
}

// ══════════════════════════════════════════════════════════════
// VP — RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildDHResults(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const winner = data.winner;
  const pr = pronouns(winner);

  let standingsHtml = '';
  const placements = ep.chalPlacements || [];
  for (let i = 0; i < placements.length; i++) {
    const name = placements[i];
    const score = ep.chalMemberScores[name];
    const medal = i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`;
    const color = i === 0 ? 'var(--amber)' : i === 1 ? '#94a3b8' : i === 2 ? 'var(--terracotta)' : 'var(--cream)';
    standingsHtml += `<div class="dh-player-row" style="padding:6px;${i === 0 ? 'border:1px solid var(--amber);border-radius:4px;background:rgba(214,138,58,0.1)' : ''}">
      <span style="color:${color};font-weight:700;font-size:13px;width:32px">${medal}</span>
      ${portrait(name, 32)}
      <span class="dh-player-name">${name}</span>
      <span class="dh-sb-score" style="margin-left:auto">${score.toFixed(1)}</span>
    </div>`;
  }

  return _shell(`
    <div style="padding:24px 20px;position:relative;z-index:5">
      <div class="dh-result-card">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:3px;color:var(--sandstone);margin-bottom:8px">IMMUNITY WINNER</div>
        <div style="display:flex;justify-content:center;margin:12px 0">${portrait(winner, 72)}</div>
        <div class="dh-winner-name">${winner}</div>
        <div style="color:var(--cream);opacity:0.7;margin-top:8px;font-size:14px">
          ${pr.Sub} unearthed the barrel and secured individual immunity!
        </div>
      </div>

      <div style="margin-top:24px">
        <div class="dh-phase-hdr" style="font-size:16px">${_icon('skull')} Final Standings</div>
        ${standingsHtml}
      </div>

      <div style="margin-top:20px;text-align:center;color:var(--cream);opacity:0.5;font-size:12px;font-style:italic">
        "The badlands always reveal the truth." — ${host()}
      </div>
    </div>
  `, '');
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textDrumheller(ep, ln, sec) {
  const data = ep.challengeData;
  if (!data) return;
  sec('AWWWWWW, DRUMHELLER');
  ln(`${host()} announces an archaeology challenge in the Drumheller badlands.`);

  ln('── DINOSAUR BUILD ──');
  for (const name of data.active) {
    const b = data.builds[name];
    ln(`  ${name}: quality ${b.quality.toFixed(1)} — ${b.desc.replace(/<[^>]+>/g, '')}`);
  }

  ln('── LIE-DETECTOR VOTE ──');
  for (const voter of data.active) {
    const target = data.votes[voter];
    const shock = data.shockMoments.find(s => s.voter === voter);
    if (shock) {
      ln(`  ${voter} → tried "${shock.triedTarget}" → SHOCKED → actual: ${target}`);
    } else {
      ln(`  ${voter} → ${target}`);
    }
  }
  ln(`  Vote ranking: ${data.voteRanking.slice(0, 3).map((n, i) => `${i + 1}. ${n} (${data.votesReceived[n]} votes)`).join(', ')}`);

  if (data.voteFallout.length) {
    ln('  Social fallout:');
    for (const f of data.voteFallout) {
      if (f.type === 'betrayal') ln(`    ${f.a} felt betrayed by ${f.b} (bond ${f.delta})`);
      else if (f.type === 'respect') ln(`    ${f.a} gained respect for ${f.b}`);
      else if (f.type === 'zero') ln(`    ${f.name} got zero votes`);
    }
  }

  ln(`  Tools: ${data.voteRanking.slice(0, 3).map((n, i) => `${n}=${TOOL_NAMES[3 - i]}`).join(', ')}`);

  ln('── BARREL DIG ──');
  for (const rd of data.roundData) {
    ln(`  Round ${rd.round}:`);
    for (const ev of rd.events) {
      if (ev.type === 'dig') ln(`    ${ev.name} digs +${ev.progress.toFixed(1)}`);
      else if (ev.type === 'boulder-hit') ln(`    BOULDER hits ${ev.name} — TRAPPED`);
      else if (ev.type === 'boulder-dodge') ln(`    ${ev.name} dodges a boulder!`);
      else if (ev.type === 'rescue') ln(`    ${ev.rescuer} rescues ${ev.trapped}!`);
      else if (ev.type === 'barrel-found') ln(`    ${ev.name} FINDS THE BARREL!`);
      else if (ev.type === 'showmance-moment') ln(`    Showmance moment: ${ev.a} & ${ev.b}`);
      else if (ev.type === 'rivalry') ln(`    Rivalry: ${ev.a} vs ${ev.b}`);
      else if (ev.type === 'coprolite') ln(`    ${ev.name} found coprolite (dino poop)`);
    }
  }

  ln(`  IMMUNITY: ${data.winner}`);
}

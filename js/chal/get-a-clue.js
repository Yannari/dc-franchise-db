// js/chal/get-a-clue.js — Get a Clue murder mystery challenge (post-merge)
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
// TRAP TYPES & DNA COLLECTION TEXT
// ══════════════════════════════════════════════════════════════
const TRAP_TYPES = {
  villain:            { method: 'deception', stat1: 'strategic', stat2: 'boldness' },
  mastermind:         { method: 'deception', stat1: 'strategic', stat2: 'mental' },
  schemer:            { method: 'deception', stat1: 'strategic', stat2: 'social' },
  hero:               { method: 'direct',    stat1: 'physical',  stat2: 'boldness' },
  'loyal-soldier':    { method: 'direct',    stat1: 'physical',  stat2: 'endurance' },
  'social-butterfly': { method: 'charm',     stat1: 'social',    stat2: 'intuition' },
  showmancer:         { method: 'charm',     stat1: 'social',    stat2: 'boldness' },
  'challenge-beast':  { method: 'physical',  stat1: 'physical',  stat2: 'endurance' },
  hothead:            { method: 'physical',  stat1: 'physical',  stat2: 'boldness' },
  'perceptive-player':{ method: 'observation',stat1:'intuition', stat2: 'mental' },
  wildcard:           { method: 'chaos',     stat1: 'boldness',  stat2: 'intuition' },
  'chaos-agent':      { method: 'chaos',     stat1: 'boldness',  stat2: 'strategic' },
  floater:            { method: 'stealth',   stat1: 'social',    stat2: 'strategic' },
  underdog:           { method: 'sympathy',  stat1: 'social',    stat2: 'endurance' },
  goat:               { method: 'accident',  stat1: 'social',    stat2: 'endurance' },
};

const TRAP_TEXT = {
  deception: [
    (t, v, pr) => `${t} set an elaborate trap for ${v}: a fake alliance meeting with a handshake that just happened to pull a hair sample. "Business as usual."`,
    (t, v, pr) => `${t} invited ${v} for a "strategy session" and casually swiped a napkin ${v} had been using. ${pr.Sub} pocketed the DNA evidence with a smile.`,
    (t, v, pr) => `${t} offered ${v} a spiked energy drink that was really just orange juice — but the straw captured a perfect lip print. "Refreshing, right?"`,
    (t, v, pr) => `${t} planted a "secret note" for ${v} to find. When ${v} picked it up, the adhesive strip captured fingerprints perfectly. Classic.`,
  ],
  charm: [
    (t, v, pr) => `${t} gave ${v} a spa treatment — scalp massage, face mask, the works. ${v} was so relaxed ${pr.sub} didn't notice ${t} pocketing several hair samples.`,
    (t, v, pr) => `${t} challenged ${v} to an arm-wrestling match "just for fun." The handshake before AND after? Both collected skin cells. ${t} winked at the camera.`,
    (t, v, pr) => `${t} complimented ${v}'s hair and asked to braid it. By the end, ${t} had three follicle samples and ${v} had a French braid. Win-win.`,
    (t, v, pr) => `${t} offered to do ${v}'s makeup. "You'd look AMAZING with this shade." The applicator captured a perfect DNA sample from ${v}'s cheek.`,
  ],
  physical: [
    (t, v, pr) => `${t} tackled ${v} during a morning jog. "Oops, sorry!" While helping ${v} up, ${t} grabbed a handful of hair. "Got it."`,
    (t, v, pr) => `${t} challenged ${v} to a wrestling match. One headlock later, ${t} had a fistful of DNA evidence and ${v} had a bruised ego.`,
    (t, v, pr) => `${t} "accidentally" collided with ${v} near the showers. The towel ${v} dropped? Covered in DNA. ${t} scooped it up. "Let me get that for you."`,
    (t, v, pr) => `${t} slapped ${v} on the back in congratulations for absolutely nothing. The adhesive tape hidden in ${pr.posAdj} palm captured a perfect sample.`,
  ],
  direct: [
    (t, v, pr) => `${t} marched up to ${v}. "I need your DNA." ${v} stared. ${t} plucked a hair. "Thanks." Straightforward and slightly terrifying.`,
    (t, v, pr) => `${t} challenged ${v} to a handshake contest. Grip strength was tested. DNA was collected. ${v} didn't even realize what happened until later.`,
    (t, v, pr) => `${t} grabbed ${v}'s water bottle and took a drink. "Needed that." ${v}: "That's MY—" ${t} was already walking away with the evidence.`,
    (t, v, pr) => `${t} offered ${v} a high-five. Then a fist bump. Then a complicated handshake. Each contact = another sample. ${v} just thought ${t} was being friendly.`,
  ],
  observation: [
    (t, v, pr) => `${t} waited. And watched. ${v} left a coffee cup at craft services. ${t} swooped in, bagged it, and was gone before anyone noticed. "Patience is a skill."`,
    (t, v, pr) => `${t} noticed ${v} had been chewing on a pen cap all morning. When ${v} put it down, ${t} was there in seconds. "Elementary."`,
    (t, v, pr) => `${t} followed ${v} to the confession booth and collected the tissue ${v} left behind. "People always leave traces. You just have to know where to look."`,
    (t, v, pr) => `${t} found ${v}'s toothbrush in the bathroom. Quick swab, back in place, done. ${v} never knew. ${t}'s intuition said which brush belonged to whom.`,
  ],
  chaos: [
    (t, v, pr) => `${t} set up a Rube Goldberg machine of strings, pulleys, and a bucket. ${v} walked through the trip wire and got absolutely COVERED in harmless slime — and every drop was a DNA goldmine.`,
    (t, v, pr) => `${t} threw a surprise "confetti bomb" at ${v}. The confetti was coated in adhesive. ${v} was covered. ${t}: "Happy... Tuesday!" DNA collected from every stuck piece.`,
    (t, v, pr) => `${t} hid in a bush and jumped out at ${v} with a spray bottle. ${v} screamed. ${t} caught the spit droplets on a prepared slide. "Science!"`,
    (t, v, pr) => `Nobody knows HOW ${t} got ${v}'s DNA. There was a chicken, a trampoline, and what appeared to be a catapult involved. The footage is chaos. But the sample is pristine.`,
  ],
  stealth: [
    (t, v, pr) => `${t} slipped through camp unnoticed and collected ${v}'s hairbrush. Quick swap — clean brush back, DNA sample pocketed. ${v} never knew.`,
    (t, v, pr) => `${t} waited until ${v} fell asleep in the sun and carefully collected a sweat sample from ${v}'s forehead. Surgical precision.`,
    (t, v, pr) => `${t} collected ${v}'s fork from craft services before anyone cleared the table. The fingerprints were perfect. "Nobody notices the quiet ones."`,
    (t, v, pr) => `${t} found ${v}'s discarded bandage in the trash. ${v} had cut ${pr.posAdj} finger earlier. DNA doesn't get more pure than that. ${t} smiled. "Too easy."`,
  ],
  sympathy: [
    (t, v, pr) => `${t} pretended to cry near ${v}. When ${v} came over to comfort ${pr.obj}, ${t} collected a hair from ${v}'s shoulder. "Thanks for the hug. And the sample."`,
    (t, v, pr) => `${t} asked ${v} for help with a "splinter." While ${v} was focused on ${t}'s finger, ${t} used the other hand to swipe a hair from ${v}'s head.`,
    (t, v, pr) => `${t} "tripped" near ${v}. ${v} caught ${pr.obj}. In the tangle of limbs, ${t} swiped a skin cell sample. "You're so kind!" And so unsuspecting.`,
    (t, v, pr) => `${t} offered ${v} a friendship bracelet. "I made it myself!" The thread was coated in mild adhesive. When ${v} put it on, DNA transfer complete.`,
  ],
  accident: [
    (t, v, pr) => `${t} literally bumped into ${v} and both fell down. In the chaos, hair was exchanged, fingerprints smudged everywhere, and somehow ${t} ended up with a sample. Even ${t} looked surprised.`,
    (t, v, pr) => `${t} spilled juice on ${v}. Then helped clean it up. The cleanup napkin had ${v}'s DNA all over it. "Sorry! I'm so clumsy!" Actually, yes. But it worked.`,
    (t, v, pr) => `${t} sneezed on ${v}. ${v}: "GROSS!" ${t}: "Sorry!" But then ${t} collected the tissue ${v} used to wipe ${pr.posAdj} face. Disgusting? Yes. Effective? Also yes.`,
    (t, v, pr) => `${t} dropped ${pr.posAdj} lunch tray. It landed on ${v}'s foot. In the apologetic scramble, ${t} grabbed ${v}'s napkin. "Let me clean that up for you." DNA secured.`,
  ],
};

const TRAP_DODGE_TEXT = [
  (t, v) => `${v} saw it coming a mile away. "Nice try, ${t}." The trap was spotted and avoided.`,
  (t, v) => `${t}'s trap was elaborate — too elaborate. ${v} stepped right around it. "You'll have to do better than that."`,
  (t, v) => `${v} caught ${t} red-handed mid-setup. "What are you doing?" ${t}: "...Nothing." ${v}: "Uh-huh." Trap failed.`,
  (t, v) => `${t}'s plan would have worked on anyone else. But ${v} reads people like books. The trap sprung empty.`,
];

const TRAP_BACKFIRE_TEXT = [
  (t, v) => `${t}'s trap BACKFIRED! ${v} saw through it and reversed the setup — collecting ${t}'s DNA instead. "Thanks for the sample."`,
  (t, v) => `${t} got caught in their own trap! ${v} not only dodged it but swiped ${t}'s hair in the confusion. The hunter became the hunted.`,
  (t, v) => `${t}'s scheme was exposed. ${v} turned the tables and got ${t}'s fingerprints from the trap materials. "You really didn't think this through, did you?"`,
  (t, v) => `Karma. ${t}'s elaborate trap collapsed and ${v} collected the evidence ${t} had been handling all morning. ${t}'s own fingerprints everywhere.`,
];

const ZERO_SAMPLE_TEXT = [
  (n) => `${n} collected ZERO samples. Not one. Every trap failed. Every hunt came up empty. The Lindsay Award goes to...`,
  (n) => `${n} spent the entire collection phase getting tricked by everyone else and tricking nobody. A historic failure.`,
  (n) => `${n} set a trap that caught a seagull. Tried to hunt and tripped over ${pronouns(n).posAdj} own shoelaces. Zero samples. ${host()} is trying not to laugh.`,
  (n) => `${n}: zero evidence, zero samples, zero clue. Literally. The name of the challenge is ironic in ${pronouns(n).posAdj} case.`,
];

// ══════════════════════════════════════════════════════════════
// TRAIN COMPARTMENTS & INVESTIGATION
// ══════════════════════════════════════════════════════════════
const COMPARTMENTS = [
  { id: 'dining', name: 'Dining Car', clueType: 'fingerprint', icon: '🍽️' },
  { id: 'sleeper', name: 'Sleeper Car', clueType: 'hair', icon: '🛏️' },
  { id: 'luggage', name: 'Luggage Car', clueType: 'weapon', icon: '🧳' },
  { id: 'observation', name: 'Observation Deck', clueType: 'motive', icon: '🔭' },
  { id: 'engine', name: 'Engine Room', clueType: 'witness', icon: '🚂' },
  { id: 'lounge', name: 'Lounge Car', clueType: 'alibi', icon: '🛋️' },
];

const CLUE_NAMES = {
  fingerprint: ['an orange fingerprint on a napkin', 'a smudged print on the safe handle', 'a partial print on a wine glass', 'a greasy thumbprint on a menu'],
  hair: ['a strand of hair on the pillow', 'fibers caught in the curtain', 'a hair tangled in the door latch', 'a follicle sample from the headrest'],
  weapon: ['a suspicious pipe wrench', 'a candlestick with scuff marks', 'a rope with a fresh knot', 'a heavy bookend with a dent'],
  motive: ['a torn page from a diary', 'a threatening note in an envelope', 'a photograph with a face scratched out', 'a contract with a suspicious clause'],
  witness: ['a conductor\'s logbook entry', 'a security camera still frame', 'an overheard conversation transcript', 'a passenger manifest with notes'],
  alibi: ['a signed bar tab with timestamp', 'a poker chip receipt', 'a spilled drink stain (timed)', 'a magazine left open mid-article'],
};

const SEARCH_TEXT = [
  (n, comp, clue) => `${n} searched the ${comp.name} methodically. Behind the ${comp.id === 'dining' ? 'tablecloth' : comp.id === 'sleeper' ? 'mattress' : comp.id === 'luggage' ? 'suitcase' : 'furniture'}, a critical find: ${clue}.`,
  (n, comp, clue) => `${n}'s eyes swept the ${comp.name}. Nothing. Nothing. Wait — there. ${clue}. The detective instinct kicked in.`,
  (n, comp, clue) => `The ${comp.name} looked clean at first glance. But ${n} wasn't looking at first glance. ${pronouns(n).Sub} was looking at the third, fourth, fifth glance. And there it was: ${clue}.`,
  (n, comp, clue) => `${n} knelt down in the ${comp.name} and spotted something everyone else had missed: ${clue}. "Got you."`,
];

const SEARCH_FAIL_TEXT = [
  (n, comp) => `${n} tore through the ${comp.name} and found absolutely nothing. "There's nothing here!" There was. ${pronouns(n).Sub} just didn't see it.`,
  (n, comp) => `${n} searched the ${comp.name} for what felt like an hour. Came up empty. The clue was under the cushion ${pronouns(n).sub} was sitting on.`,
  (n, comp) => `The ${comp.name} defeated ${n}. Every drawer, every shelf, every corner — nothing. ${pronouns(n).Sub} left frustrated. The clue was in plain sight.`,
  (n, comp) => `${n} checked the ${comp.name} thoroughly. Or so ${pronouns(n).sub} thought. Later, someone else would find the evidence ${pronouns(n).sub} walked right past.`,
];

const RED_HERRING_TEXT = [
  (n, item) => `${n} found ${item}... but it's a red herring! Planted to waste time. ${pronouns(n).Sub} pocketed it anyway, convinced it means something.`,
  (n, item) => `${n} triumphantly held up ${item}. "KEY EVIDENCE!" Narrator: It was not key evidence. It was not even evidence.`,
  (n, item) => `${n} discovered ${item} and built an entire theory around it. The theory is wrong. The evidence is fake. But ${pronouns(n).posAdj} confidence is VERY real.`,
  (n, item) => `${item.charAt(0).toUpperCase() + item.slice(1)} caught ${n}'s eye. Hours of analysis later: useless. But ${n} refuses to accept that. "This MEANS something!"`,
];

const RED_HERRING_ITEMS = [
  'a rubber duck with lipstick marks', 'a half-eaten cheese puff', 'a mysterious sock', 'a glitter-covered invitation',
  'a torn playing card', 'an empty perfume bottle', 'a broken watch set to the wrong time', 'a crayon drawing of a stick figure',
];

// ══════════════════════════════════════════════════════════════
// BLACKOUT EVENTS
// ══════════════════════════════════════════════════════════════
const BLACKOUT_TEXT = {
  murder: [
    (w) => `The lights died. Absolute darkness. Then — a SCREAM. "${host()}: YOU CAN'T KILL THE HOST!" A THUD. Silence. The lights flickered back on. ${host()} lay motionless on the floor. A ${w} beside him. Is this... real?`,
    (w) => `CLICK. Darkness. A scuffle. A groan. "${host()}: NOT THE FACE—" CRASH. When the emergency lights sputtered to life, ${host()} was sprawled on the dining car floor. A ${w} lay nearby. Not moving. The castmates stared. Someone here just "killed" the host.`,
    (w) => `The train plunged into a tunnel. Total black. A struggle. A crack of something heavy — a ${w}? When daylight returned, ${host()} was on the ground. "Dead." Someone would kick the body later. But for now — silence. And fear.`,
    (w) => `Every light on the train died simultaneously. Two seconds of chaos. A shout. A crack. The emergency generator kicked in, bathing everything in red. ${host()} was facedown. The "murder weapon" — a ${w} — lay nearby. One of them did this.`,
  ],
  bodyDisappear: [
    (killer) => `BLACKOUT AGAIN. Hands grabbed at nothing. Someone screamed. When the lights returned, ${host()}'s body was GONE. Only a smear of stage blood and a single green hair remained where the corpse had been.`,
    (killer) => `The train entered another tunnel. Darkness engulfed the car. Someone felt movement — something being dragged. The lights returned. The body had vanished. In its place: a playing card. The ace of spades.`,
    (killer) => `The lights failed. Chaos. When they returned, the body was simply... not there. The only trace: scuff marks on the floor leading toward the luggage car, and the faint smell of ${host()}'s hair gel.`,
    (killer) => `BLACKOUT. The sound of something heavy being moved. A door opening. The whistle of wind. When the lights returned, ${host()} was gone. The window was open. The night air rushed in.`,
  ],
  frame: [
    (killer, target) => `During the blackout, someone planted evidence near ${target}. When the lights returned, a suspicious item lay at ${target}'s feet. ${target}: "That's NOT mine!"`,
    (killer, target) => `The lights went out for ten seconds. When they came back, ${target}'s hands had mysterious orange stains. ${target}: "I didn't touch anything!" Nobody believed ${pronouns(target).obj}.`,
    (killer, target) => `In the darkness, gloved hands placed a damning clue in ${target}'s pocket. ${target} wouldn't discover it for another twenty minutes. By then, the suspicion would already be building.`,
    (killer, target) => `Someone whispered during the blackout: "I saw ${target} near the body." The voice was unidentifiable. The accusation was devastating. And it was a LIE — planted by the real killer.`,
  ],
  witness: [
    (witness, detail) => { const d = detail.charAt(0).toUpperCase() + detail.slice(1); return `${witness} saw SOMETHING during the blackout. A silhouette. A flash of movement. ${d}. It wasn't much, but it was more than anyone else had.`; },
    (witness, detail) => `${witness}'s eyes adjusted to the dark faster than the others. For one brief second, ${pronouns(witness).sub} caught a glimpse: ${detail}. "${pronouns(witness).Sub} saw something. But WHAT?"`,
    (witness, detail) => { const d = detail.charAt(0).toUpperCase() + detail.slice(1); return `A flash of lightning outside the train window illuminated the car for one heartbeat. ${witness} was looking in the right direction. ${d}. The image was burned into ${pronouns(witness).posAdj} memory.`; },
    (witness, detail) => { const d = detail.charAt(0).toUpperCase() + detail.slice(1); return `${witness} felt someone brush past in the darkness. ${d}. It wasn't proof. But it was a lead.`; },
  ],
  steal: [
    (thief, victim) => `The blackout was the perfect cover. ${thief} felt around in the dark and snatched an evidence bag from ${victim}'s coat. When the lights returned, ${victim} was missing a clue and ${thief} was trying very hard to look innocent.`,
    (thief, victim) => `During the chaos, ${thief} lifted a key piece of evidence from ${victim}'s collection. Pickpocket skills: deployed. ${victim} wouldn't notice until the trial phase.`,
  ],
  showmance: [
    (a, b) => `In the terrifying darkness, ${a} reached for ${b}'s hand. ${b} squeezed back. Neither mentioned it when the lights returned. But they both remembered.`,
    (a, b) => `${a} shielded ${b} during the blackout, pulling ${pronouns(b).obj} close. "Stay behind me." When the lights came back, they were still holding onto each other. The other castmates noticed.`,
    (a, b) => `The darkness brought panic — and instinct. ${a} and ${b} found each other immediately. "Are you okay?" "I am now." The murder mystery was temporarily secondary to whatever THAT was.`,
  ],
};

const WITNESS_DETAILS = [
  'a figure crouching near the body', 'someone dragging something heavy', 'hands reaching for the light switch',
  'a shadow moving toward the luggage car', 'someone stuffing something under a seat', 'a glint of metal in the dark',
  'shoes scuffling on the floor — heading AWAY from where they claimed to be', 'heavy breathing from the wrong direction',
];

// ══════════════════════════════════════════════════════════════
// TRIAL ARC TEXT
// ══════════════════════════════════════════════════════════════
const PRESENTATION_TEXT = {
  strong: [
    (n, ec) => `${n} stood before the group with ${ec} piece${ec !== 1 ? 's' : ''} of solid evidence. "Let me walk you through this." Methodical. Detailed. Devastating.`,
    (n, ec) => `${n} laid out ${pronouns(n).posAdj} ${ec} clue${ec !== 1 ? 's' : ''} like a prosecutor. Every piece connected. Every timeline accounted for. The other players shifted uncomfortably. This was GOOD.`,
    (n, ec) => `${n}'s presentation was a masterclass in deduction. ${ec} piece${ec !== 1 ? 's' : ''} of evidence, all cross-referenced, all pointing the same direction. Jaws literally dropped.`,
    (n, ec) => `"The evidence speaks for itself." ${n} placed ${pronouns(n).posAdj} evidence on the table. ${ec} real clue${ec !== 1 ? 's' : ''} — each more damning than the last. The silence that followed said everything.`,
  ],
  medium: [
    (n, ec) => `${n} presented ${ec >= 1 ? `${ec} clue${ec !== 1 ? 's' : ''} and some solid intuition` : 'a theory backed mostly by gut instinct'}. The evidence pointed somewhere, but the connections weren't airtight. "I'm... pretty sure about this."`,
    (n, ec) => `${n}'s case had ${ec >= 1 ? `${ec} real finding${ec !== 1 ? 's' : ''} holding it together` : 'more confidence than evidence'}. Decent reasoning, questionable proof. The group nodded along — mostly.`,
    (n, ec) => `${n} made a compelling argument with ${ec >= 1 ? `${ec} clue${ec !== 1 ? 's' : ''} and some educated guesses` : 'pure logic and no physical evidence'}. Not bad, but not bulletproof.`,
    (n, ec) => `"Okay, hear me out." ${n}'s presentation ${ec >= 1 ? `started strong with ${ec} finding${ec !== 1 ? 's' : ''}` : 'started with a theory'}, hit a rocky middle, but stuck the landing. Not perfect, but not dismissable either.`,
  ],
  weak: [
    (n, ec) => `${n} stood up with confidence and ${ec === 0 ? 'no evidence whatsoever' : 'nothing but fake leads'}. "I have a THEORY." The theory involved astrology. And a dream ${pronouns(n).sub} had. And vibes.`,
    (n, ec) => `${n}'s presentation was three minutes of pointing at people and saying "suspicious." ${ec === 0 ? 'No evidence. No logic.' : 'The only evidence was fake.'} Just vibes and accusations.`,
    (n, ec) => `${n} stood at the front of the car and opened ${pronouns(n).posAdj} mouth. Nothing came out for three seconds. Then: "It was... the vibe I got." ${host()} buried ${pronouns(host()).posAdj || 'his'} face in ${pronouns(host()).posAdj || 'his'} hands.`,
    (n, ec) => `"I don't have 'proof' in the traditional sense," ${n} began. ${ec === 0 ? 'Zero clues. Zero leads.' : 'Only fake leads. Nothing real.'} This was going to be a disaster. It was a disaster. ${host()} winced.`,
    (n, ec) => `${n} drew a diagram on a napkin. It made no sense. "See? It's OBVIOUS." Nobody saw. Nothing was obvious. ${pronouns(n).Sub} sat down to complete silence.`,
    (n, ec) => `${n}: "I've been thinking about this a LOT." The thinking produced zero evidence and one conspiracy theory involving Chef's cooking. ${host()}: "Please sit down."`,
    (n, ec) => `${n} pointed at three different people in thirty seconds. "It was YOU. No, YOU. Actually — wait." The courtroom collectively sighed.`,
  ],
  killerConfession: [
    (n) => `${n} stood up. Deep breath. "It was me." The room went silent. "I did it. And you'll never PROVE it." A mic drop without a mic.`,
    (n) => `${n} took the floor and smiled. "Let me save you all some time. I'm the killer." Gasps. "And I'm STILL going to win this challenge." Audacity incarnate.`,
    (n) => `"You want the truth?" ${n} locked eyes with every castmate. "I killed ${host()}. Or rather, I 'killed' ${host()}. And I'd do it again." The boldest play in challenge history.`,
    (n) => `${n} presented the most detailed case of all — implicating ${pronouns(n).ref}. Every clue analyzed. Every frame job confessed. "I am the killer. I am also the best detective in this room. Give me immunity."`,
  ],
  killerDeepCover: [
    (n, framed) => `${n} presented an immaculate case against ${framed}. Every planted piece of evidence fit perfectly — because ${n} had placed each one. "The evidence is clear." It was. It was also fabricated.`,
    (n, framed) => `${n} wove a masterful story of ${framed}'s "guilt." Motive, means, opportunity — all manufactured, all convincing. The real crime wasn't the murder. It was this performance.`,
    (n, framed) => `${n} pointed at ${framed} with righteous anger. "It was YOU." The evidence supported it. The timeline supported it. Because ${n} had engineered every single piece. Deep cover achieved.`,
    (n, framed) => `${n}'s case against ${framed} was so polished that even the framed player started to doubt themselves. "Wait... DID I do it?" No. But the killer's frame job was THAT good.`,
  ],
};

const CROSS_EXAM_TEXT = {
  attack: [
    (attacker, defender) => `${attacker} zeroed in on the weakness. "Your timeline doesn't add up. Where were you during the FIRST blackout?" ${defender} stammered. No good answer.`,
    (attacker, defender) => `"One question," ${attacker} said calmly. "If you're innocent, why can't you account for your movements?" ${defender}'s face went pale.`,
    (attacker, defender) => `${attacker} cross-examined ${defender} mercilessly. "You found nothing. You saw nothing. You have no alibi. And you expect us to believe you?" ${defender} couldn't respond.`,
    (attacker, defender) => `${attacker} held up a piece of evidence. "This was found near YOUR seat. Explain." ${defender}: "That was PLANTED!" ${attacker}: "That's what a guilty person would say."`,
  ],
  deflect: [
    (defender, attacker) => `${attacker} pointed at ${defender}. "You were near the body. You had opportunity." ${defender} countered smoothly. "You're accusing me because you can't explain YOUR whereabouts during the blackout." ${attacker} went quiet.`,
    (defender, attacker) => `${attacker} challenged ${defender}'s alibi. "Nobody can confirm where you were." ${defender}: "Actually, I have witnesses who saw me in the lounge car the entire time. Where were YOU?" The cross-examination reversed.`,
    (defender, attacker) => `${attacker} laid out ${pronouns(attacker).posAdj} case against ${defender}. Fingerprints. Timeline. Motive. ${defender} picked it apart piece by piece. "That print is smudged. That timeline has gaps. And that motive? I have no motive." Clean deflection.`,
    (defender, attacker) => `${attacker} tried to corner ${defender}. "The evidence points to you." ${defender} smiled under pressure. "You're reaching. Everything you have is circumstantial at best. I'll take my chances." Unshakeable.`,
  ],
  killerDerail: [
    (killer, detective) => `${killer} deliberately challenged ${detective}'s correct theory. "That's absurd. You're grasping at straws." The room wavered. Doubt planted. The real killer smiled inside.`,
    (killer, detective) => `${killer} attacked the strongest theory in the room — the one pointing at ${pronouns(killer).obj}. "You're wrong. And I can prove it." ${pronouns(killer).Sub} couldn't. But the confidence was enough to create doubt.`,
    (killer, detective) => `${killer} redirected the group's attention. "While we're wasting time on conspiracy theories, the REAL evidence points somewhere else entirely." Misdirection mastered.`,
    (killer, detective) => `"${detective} has been building a narrative, not a case," ${killer} declared. "Narratives are fiction. Evidence is fact. And the evidence doesn't support this theory." The room murmured. Seeds of doubt: sown.`,
  ],
};

const REBUTTAL_TEXT = {
  allianceSupport: [
    (supporter, ally) => `${supporter} stepped in for ${ally}. "I was WITH ${ally} during the blackout. ${pronouns(ally).Sub} couldn't have done it." Alliance loyalty on full display.`,
    (supporter, ally) => `${supporter} vouched for ${ally}'s character. "I've played this entire game with ${ally}. ${pronouns(ally).Sub} is not a killer." The bond was being tested — and holding.`,
  ],
  showmanceProtect: [
    (protector, partner) => `${protector} blocked an accusation against ${partner}. "Back off. I KNOW ${partner} didn't do this." Love clouding judgment? Or love seeing clearly?`,
    (protector, partner) => `${protector} put ${pronouns(protector).ref} between ${partner} and the accusers. "You want to accuse ${pronouns(partner).obj}? Go through me first." The courtroom got personal.`,
  ],
  flipAllegiance: [
    (flipper, oldAlly, newTarget) => `${flipper} changed targets mid-rebuttal. "I was wrong about ${oldAlly}. The REAL killer is ${newTarget}." Gasps. Chaos. The trial arc just got a twist.`,
    (flipper, oldAlly, newTarget) => `${flipper} looked at the evidence one more time and pivoted. "I've been looking at this wrong. It's ${newTarget}." The courtroom erupted.`,
  ],
};

const DEDUCTION_QUESTIONS = [
  { key: 'who', label: 'WHO committed the murder?', weight: 4 },
  { key: 'weapon', label: 'WHAT was the murder weapon?', weight: 3 },
  { key: 'motive', label: 'WHY did they do it?', weight: 2 },
  { key: 'location', label: 'WHERE was the evidence hidden?', weight: 1 },
];

const WEAPONS = ['candlestick', 'pipe wrench', 'lead pipe', 'rope', 'dagger letter opener', 'heavy bookend'];
const MOTIVES = ['jealousy over immunity', 'revenge for a blindside', 'eliminate the biggest threat', 'steal the million dollars', 'pure chaos', 'alliance power grab'];
const EVIDENCE_LOCATIONS = ['dining car', 'sleeper car', 'luggage car', 'observation deck', 'engine room', 'lounge car'];

// ═══════════════════════════════════════════════════════��══════
// KILLER SELECTION
// ══════════════════════════════════════════════════════════════
function _selectKiller(active) {
  const scores = active.map(name => {
    const s = pStats(name);
    const heat = gs._computedHeat?.[name] || 0;
    const enemies = active.filter(n => n !== name && getBond(name, n) < -3).length;
    const dramaScore = heat * 0.35 + s.strategic * 0.2 + s.boldness * 0.15 + enemies * 0.15 + noise(2);
    return { name, score: dramaScore };
  }).sort((a, b) => b.score - a.score);
  return scores[0].name;
}

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateGetAClue(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    phase1: { traps: [], hunts: [], sampleCounts: {}, events: [] },
    phase2: { killer: null, weapon: null, motive: null, evidenceLocation: null, compartments: [], blackouts: [], searchRounds: [], playerEvidence: {}, witnessLog: [], framesPlanted: [] },
    phase3: { presentations: [], crossExams: [], rebuttals: [], deductionResults: {}, courtroomVotes: {}, courtroomWinner: null, deductionWinner: null },
    immunityWinner: null,
    secondImmune: null,
    killerStrategy: null,
  };

  // Initialize sample counts & evidence
  active.forEach(n => { result.phase1.sampleCounts[n] = 0; result.phase2.playerEvidence[n] = []; });

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: DNA COLLECTION (Trap & Hunt)
  // ══════════════════════════════════════════════════════════════
  const trapResults = [];
  const huntResults = [];

  // Each player sets a trap AND hunts
  for (const trapper of active) {
    const a = arch(trapper);
    const trapType = TRAP_TYPES[a] || TRAP_TYPES.floater;
    const s = pStats(trapper);
    const trapQuality = s[trapType.stat1] * 0.5 + s[trapType.stat2] * 0.3 + s.strategic * 0.2 + noise(2);

    // Select a random target for the trap
    const potentials = active.filter(n => n !== trapper);
    const target = pick(potentials);

    // Trap vs target resistance
    const tS = pStats(target);
    const resistance = tS.mental * 0.4 + tS.intuition * 0.4 + tS.strategic * 0.2 + noise(2);

    // Bond/showmance vulnerability
    const bond = getBond(trapper, target);
    const isShowmance = gs.showmances?.some(sm => (sm.a === trapper && sm.b === target) || (sm.a === target && sm.b === trapper));
    const trustBonus = (bond > 3 ? 1.5 : bond > 0 ? 0.5 : 0) + (isShowmance ? 2 : 0);

    const margin = trapQuality + trustBonus - resistance;
    let outcome;
    if (margin > 2) {
      outcome = 'success';
      result.phase1.sampleCounts[trapper]++;
      ep.chalMemberScores[trapper] = (ep.chalMemberScores[trapper] || 0) + 3;
      popDelta(trapper, 1);
      // Tricking a close friend/showmance hurts the bond
      if (bond > 3 || isShowmance) {
        addBond(trapper, target, -2);
        ep.campEvents[campKey].post.push({
          text: `${trapper} tricked ${target} for a DNA sample — ${isShowmance ? 'their showmance took a hit' : 'and their friendship suffered'}!`,
          players: [trapper, target], badgeText: 'BETRAYED', badgeClass: 'red', tag: 'get-a-clue',
        });
      }
    } else if (margin > -1) {
      outcome = 'dodge';
    } else {
      outcome = 'backfire';
      result.phase1.sampleCounts[target]++;
      ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 2;
      popDelta(target, 1);
      addBond(trapper, target, bond > 0 ? -2 : -1);
      ep.campEvents[campKey].post.push({
        text: `${trapper}'s trap backfired on ${target}! ${target} reversed it and collected ${trapper}'s DNA instead.`,
        players: [trapper, target], badgeText: 'BACKFIRE', badgeClass: 'amber', tag: 'get-a-clue',
      });
    }

    const tPr = pronouns(trapper);
    let text;
    if (outcome === 'success') {
      text = pick(TRAP_TEXT[trapType.method] || TRAP_TEXT.stealth)(trapper, target, tPr);
    } else if (outcome === 'dodge') {
      text = pick(TRAP_DODGE_TEXT)(trapper, target);
    } else {
      text = pick(TRAP_DODGE_TEXT)(trapper, target) + ' ' + `${target} reversed the setup and collected ${trapper}'s DNA instead!`;
    }

    trapResults.push({ trapper, target, method: trapType.method, outcome, text, trapQuality: trapQuality.toFixed(1), resistance: resistance.toFixed(1) });
  }
  result.phase1.traps = trapResults;

  // Additional hunt round — players actively seeking
  for (const hunter of active) {
    const s = pStats(hunter);
    const huntSkill = s.social * 0.3 + s.physical * 0.3 + s.intuition * 0.2 + s.boldness * 0.2 + noise(2);
    const target = pick(active.filter(n => n !== hunter));
    const tS = pStats(target);
    const evasion = tS.intuition * 0.4 + tS.strategic * 0.3 + tS.physical * 0.3 + noise(2);

    if (huntSkill > evasion + 1) {
      result.phase1.sampleCounts[hunter]++;
      ep.chalMemberScores[hunter] = (ep.chalMemberScores[hunter] || 0) + 2;
      const hPr = pronouns(hunter);
      const hText = pick([
        `${hunter} tracked ${target} across camp and swiped a hair sample during a casual conversation. Clean extraction.`,
        `${hunter} followed ${target} to craft services and grabbed ${pronouns(target).posAdj} used napkin before anyone noticed. "Too easy."`,
        `${hunter} caught ${target} napping and collected a skin cell sample from ${pronouns(target).posAdj} arm. ${target} didn't even stir.`,
        `${hunter} bumped into ${target} "accidentally" and palmed a strand of hair. Smooth operator.`,
      ]);
      huntResults.push({ hunter, target, success: true, text: hText });
    } else {
      const fText = pick([
        `${hunter} tried to track ${target} but lost ${pronouns(target).obj} near the trailers. Hunt failed.`,
        `${hunter} stalked ${target} for twenty minutes and came up with nothing. ${target} is too alert.`,
        `${hunter} made a move on ${target}'s water bottle but ${target} grabbed it first. "Nice try."`,
      ]);
      huntResults.push({ hunter, target, success: false, text: fText });
    }
  }
  result.phase1.hunts = huntResults;

  // Mutual hunt — two players targeted each other
  for (let i = 0; i < trapResults.length; i++) {
    for (let j = i + 1; j < trapResults.length; j++) {
      if (trapResults[i].trapper === trapResults[j].target && trapResults[i].target === trapResults[j].trapper) {
        const a = trapResults[i].trapper, b = trapResults[j].trapper;
        const aPr = pronouns(a);
        result.phase1.events.push({ type: 'mutual', players: [a, b],
          text: pick([
            `${a} and ${b} were hunting EACH OTHER at the same time. They literally bumped into each other mid-scheme. Awkward eye contact. Long silence. "...You too?"`,
            `${a} set a trap for ${b}. ${b} set a trap for ${a}. Both sprung simultaneously. They stared at each other, holding each other's DNA samples. "So... truce?"`,
            `${a} and ${b} circled camp like predators, neither realizing the other was doing the exact same thing. When they collided behind the trailers, the mutual ambush was so chaotic that ${host()} had to watch the footage twice.`,
          ])
        });
        addBond(a, b, Math.random() < 0.5 ? 1 : -1);
        ep.campEvents[campKey].post.push({
          text: `${a} and ${b} tried to trap each other at the same time during DNA collection!`,
          players: [a, b], badgeText: 'MUTUAL HUNT', badgeClass: 'purple', tag: 'get-a-clue',
        });
        break;
      }
    }
  }

  // Zero-sample events + sympathy
  const zeroPlayers = [];
  for (const name of active) {
    if (result.phase1.sampleCounts[name] === 0) {
      result.phase1.events.push({ type: 'zero', player: name, text: pick(ZERO_SAMPLE_TEXT)(name) });
      popDelta(name, -1);
      zeroPlayers.push(name);
    }
  }
  // Someone comforts the zero-sample player
  if (zeroPlayers.length && active.length > 3) {
    for (const loser of zeroPlayers) {
      const friendlies = active.filter(n => n !== loser && getBond(n, loser) > 1);
      const comforter = friendlies.length ? pick(friendlies) : null;
      if (comforter) {
        const cPr = pronouns(comforter);
        result.phase1.events.push({ type: 'comfort', players: [comforter, loser],
          text: pick([
            `${comforter} sits down next to ${loser}. "Hey. It's just one challenge." ${loser} doesn't look convinced. ${comforter} offers half a breakfast taco. It helps a little.`,
            `${comforter} pats ${loser} on the shoulder. "You'll get 'em next time." ${loser}: "I got NOTHING." ${comforter}: "You got my respect. That's worth... well, it's worth something."`,
            `${comforter} finds ${loser} sulking behind the trailers. "Zero samples?" ${loser} nods miserably. ${comforter}: "I'll share my intel with you later. We're in this together." The bond deepens.`,
          ])
        });
        addBond(comforter, loser, 2);
        ep.campEvents[campKey].post.push({
          text: `${comforter} comforted ${loser} after ${pronouns(loser).sub} collected zero DNA samples.`,
          players: [comforter, loser], badgeText: 'COMFORT', badgeClass: 'blue', tag: 'get-a-clue',
        });
      }
    }
  }

  // Rivalry event — two players who both succeeded on traps against each other's allies
  const successfulTrappers = trapResults.filter(t => t.outcome === 'success');
  if (successfulTrappers.length >= 2) {
    const topTwo = successfulTrappers.slice(0, 2);
    if (topTwo[0].trapper !== topTwo[1].trapper && getBond(topTwo[0].trapper, topTwo[1].trapper) < 2) {
      const a = topTwo[0].trapper, b = topTwo[1].trapper;
      result.phase1.events.push({ type: 'rivalry', players: [a, b],
        text: pick([
          `${a} and ${b} lock eyes across the craft services tent. Both collected samples. Both know the other is a threat. "May the best detective win," ${a} says. ${b} doesn't blink. "I intend to."`,
          `${a} notices ${b} cataloguing ${pronouns(b).posAdj} samples with the same obsessive care. Two hunters recognizing each other. This just became personal.`,
          `${a} watches ${b} pocket another evidence bag. "You're good." ${b}: "Better than you." The challenge hasn't even started and there's already a rivalry forming.`,
        ])
      });
      addBond(a, b, -1);
      ep.campEvents[campKey].post.push({
        text: `${a} and ${b} sized each other up during DNA collection — a detective rivalry is brewing.`,
        players: [a, b], badgeText: 'RIVALRY', badgeClass: 'amber', tag: 'get-a-clue',
      });
    }
  }

  // Showoff event — someone brags about their successful trap
  const braggers = trapResults.filter(t => t.outcome === 'success' && pStats(t.trapper).boldness >= 6);
  if (braggers.length) {
    const bragger = pick(braggers);
    const bPr = pronouns(bragger.trapper);
    result.phase1.events.push({ type: 'showoff', player: bragger.trapper,
      text: pick([
        `${bragger.trapper} holds up ${bPr.posAdj} sample for everyone to see. "THAT'S how it's done." The other castmates are not impressed. ${host()} is mildly entertained.`,
        `${bragger.trapper} can't resist gloating about tricking ${bragger.target}. "You should've seen ${pronouns(bragger.target).posAdj} FACE!" ${bragger.target} is standing right there. Awkward.`,
        `${bragger.trapper} does a victory lap around camp after collecting ${bPr.posAdj} sample. Literally. A full lap. "I'm the greatest detective alive!" Nobody claps.`,
      ])
    });
    popDelta(bragger.trapper, -1);
    if (getBond(bragger.trapper, bragger.target) > 0) addBond(bragger.trapper, bragger.target, -1);
  }

  // Suspicion event — someone notices the backfire and gets paranoid
  const backfires = trapResults.filter(t => t.outcome === 'backfire');
  if (backfires.length) {
    const bf = pick(backfires);
    const witness = pick(active.filter(n => n !== bf.trapper && n !== bf.target));
    if (witness) {
      result.phase1.events.push({ type: 'suspicion', players: [witness, bf.trapper],
        text: pick([
          `${witness} saw the whole ${bf.trapper}-${bf.target} trap disaster. "If ${bf.trapper} is willing to do THAT, what else are ${pronouns(bf.trapper).sub} willing to do?" Suspicion planted.`,
          `${witness} makes a mental note: ${bf.trapper} tried to deceive ${bf.target} and got caught. "That's the kind of player who'd commit a murder." A seed of doubt.`,
          `${witness} overheard ${bf.trapper}'s failed scheme. "Interesting. Very interesting." ${pronouns(witness).Sub} files that information for later — it might be useful during the trial.`,
        ])
      });
    }
  }

  // Alliance forming — two players who both succeeded bond over shared competence
  const successPairs = successfulTrappers.filter(t => result.phase1.sampleCounts[t.trapper] >= 1);
  if (successPairs.length >= 2 && Math.random() < 0.5) {
    const pair = [successPairs[0].trapper, successPairs[successPairs.length > 1 ? 1 : 0].trapper];
    if (pair[0] !== pair[1] && getBond(pair[0], pair[1]) >= 0) {
      result.phase1.events.push({ type: 'alliance', players: pair,
        text: pick([
          `${pair[0]} and ${pair[1]} compare notes over lunch. Both collected samples. Both have leads. "We should work together on the train," ${pair[0]} suggests. ${pair[1]} considers it. "Deal. But I'm lead detective."`,
          `${pair[0]} slides into the seat next to ${pair[1]}. "I have evidence. You have evidence. Together we have a case." A detective partnership forms before the murder even happens.`,
          `${pair[0]} and ${pair[1]} realize they're the only ones who actually know what they're doing. An unspoken alliance forms — share leads, cover blind spots, solve this thing together.`,
        ])
      });
      addBond(pair[0], pair[1], 2);
      ep.campEvents[campKey].post.push({
        text: `${pair[0]} and ${pair[1]} formed a detective partnership during DNA collection!`,
        players: pair, badgeText: 'PARTNERS', badgeClass: 'blue', tag: 'get-a-clue',
      });
    }
  }

  // Impressive collector (3+ samples)
  const topCollector = active.reduce((best, n) => result.phase1.sampleCounts[n] > result.phase1.sampleCounts[best] ? n : best, active[0]);
  const topCount = result.phase1.sampleCounts[topCollector];
  if (topCount >= 3) {
    const tcPr = pronouns(topCollector);
    result.phase1.events.push({ type: 'impressive', player: topCollector,
      text: pick([
        `${topCollector} collected ${topCount} samples. ${host()} is genuinely impressed. "I've created a monster." The other castmates eye ${tcPr.obj} nervously — anyone that good at collecting evidence is dangerous.`,
        `${topCount} samples. ${topCollector} lines them up on the table and admires ${tcPr.posAdj} work. "I should've been a detective." ${host()}: "You should've been arrested." The threat level in the room shifts.`,
        `${topCollector} with ${topCount} samples is the clear frontrunner. The others notice. Alliances quietly recalibrate — do you want to work WITH the best detective, or make sure ${tcPr.sub} doesn't make it to the end?`,
      ])
    });
    popDelta(topCollector, 2);
  }
  ep.campEvents[campKey].post.push({
    text: `${topCollector} collected the most DNA samples in the investigation challenge!`,
    players: [topCollector], badgeText: 'TOP DETECTIVE', badgeClass: 'blue', tag: 'get-a-clue',
  });

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: TRAIN MURDER INVESTIGATION
  // ══════════════════════════════════════════════════════════════

  // Killer selection
  const killer = _selectKiller(active);
  result.phase2.killer = killer;

  // Murder details
  const weapon = pick(WEAPONS);
  const motive = pick(MOTIVES);
  const evidenceLocation = pick(EVIDENCE_LOCATIONS);
  result.phase2.weapon = weapon;
  result.phase2.motive = motive;
  result.phase2.evidenceLocation = evidenceLocation;

  // Murder scene narration
  result.phase2.murderText = pick(BLACKOUT_TEXT.murder)(weapon);

  // Murder reactions — archetype-driven responses to finding Chris "dead"
  const murderReactions = [];
  for (const name of active) {
    const a = arch(name);
    const pr = pronouns(name);
    const s = pStats(name);
    let reaction = null;
    if (a === 'hothead' || (s.temperament <= 3 && s.boldness >= 7)) {
      reaction = { name, type: 'panic', text: pick([
        `${name} FREAKS OUT. "${host()} is DEAD?! DEAD?!" ${pr.Sub} starts pacing. Then running. Then pacing again. "WE'RE ALL GONNA DIE!"`,
        `${name} grabs the nearest person and shakes them. "DO SOMETHING!" The nearest person would prefer not to be shaken.`,
      ])};
    } else if (['villain', 'mastermind', 'schemer'].includes(a)) {
      reaction = { name, type: 'calm', text: pick([
        `${name} checks ${host()}'s pulse with suspicious calm. "Yep. Dead." ${pr.Sub} doesn't seem particularly upset about it.`,
        `${name} studies the crime scene while everyone else panics. Already calculating who benefits most from this. Including ${pr.ref}.`,
      ])};
    } else if (['hero', 'loyal-soldier'].includes(a)) {
      reaction = { name, type: 'leader', text: pick([
        `${name} takes charge. "Everyone STOP. Nobody touch anything. We need to secure the scene." Natural leadership under pressure.`,
        `${name} kneels beside ${host()} and checks for a pulse. "I don't think this is real, but—" ${pr.Sub} looks at the others. "Let's treat it like it is. Nobody leaves this car alone."`,
      ])};
      popDelta(name, 1);
    } else if (s.intuition >= 7) {
      reaction = { name, type: 'suspicious', text: pick([
        `${name}'s eyes sweep the room. Not at ${host()}'s body — at everyone else's faces. Someone here isn't surprised enough. ${pr.Sub} files that away.`,
        `${name} notices something nobody else does: one person's hands are shaking. Another's aren't. The perceptive player begins building a mental map of guilt.`,
      ])};
    } else if (a === 'goat' || s.mental <= 4) {
      reaction = { name, type: 'clueless', text: pick([
        `${name} stares at the body. "Is ${host()} napping?" The room goes silent. "...What?"`,
        `${name}: "Wait, so the challenge is to find out who... wait, ${host()} is... wait." ${pr.Sub} needs a minute.`,
      ])};
    }
    if (reaction && Math.random() < 0.5) murderReactions.push(reaction);
  }
  // Keep 2-3 reactions max
  result.phase2.murderReactions = murderReactions.slice(0, 3);

  // Assign compartments for searching
  const compartments = [...COMPARTMENTS];
  const realClueComps = compartments.slice(0, 4);
  const herringComps = compartments.slice(4);

  // Place real clues — weapon compartment gets the actual murder weapon
  for (const comp of realClueComps) {
    if (comp.clueType === 'weapon') {
      comp.realClue = `the murder weapon — a ${weapon} — stashed under the luggage`;
    } else if (comp.clueType === 'motive') {
      comp.realClue = `a note revealing the motive: ${motive}`;
    } else {
      comp.realClue = pick(CLUE_NAMES[comp.clueType]);
    }
    comp.isReal = true;
  }
  for (const comp of herringComps) {
    comp.realClue = pick(RED_HERRING_ITEMS);
    comp.isReal = false;
  }
  result.phase2.compartments = compartments;

  // Track which compartments have been searched and which clues found
  const searchedComps = new Set();
  const foundClues = new Set();

  // Search rounds (2 rounds)
  for (let round = 0; round < 2; round++) {
    const roundResults = [];
    for (const name of active) {
      if (name === killer && round === 0) {
        // Killer decides: skip Round 1 to plant evidence, or search to blend in?
        // High strategic = more likely to blend in. Low strategic/high boldness = more likely to skip.
        const kS = pStats(killer);
        const blendChance = kS.strategic * 0.06 + (10 - kS.boldness) * 0.03 + noise(2);
        const killerSkips = blendChance < 0.5;
        result.phase2.killerAbsent = killerSkips;
        if (killerSkips) {
          const kPr = pronouns(killer);
          roundResults.push({ name: killer, found: false, isKillerAbsent: true,
            text: pick([
              `${killer} is suspiciously absent from the search. "I was... checking the other cars." Nobody asked.`,
              `Where's ${killer}? Everyone else is searching, but ${kPr.sub} slipped away during the chaos. ${kPr.Sub} returns later, slightly out of breath.`,
              `${killer} excuses ${kPr.ref} from the search. "I need some air." On a moving train. Sure.`,
            ])
          });
          continue;
        }
        // Killer searches normally but finds less (distracted by their crime)
      }
      const s = pStats(name);
      const searchSkill = s.intuition * 0.4 + s.mental * 0.4 + s.strategic * 0.2 + noise(2);

      // DNA samples from Phase 1 give accuracy bonus
      const dnaBonus = result.phase1.sampleCounts[name] * 0.4;
      // Round 2 is slightly easier — players know what to look for
      const roundBonus = round * 0.5;

      // Pick a compartment, prefer unsearched ones
      const unsearched = compartments.filter(c => !searchedComps.has(`${name}-${c.id}`));
      const targetComp = unsearched.length ? pick(unsearched) : pick(compartments);
      searchedComps.add(`${name}-${targetComp.id}`);

      const discoveryThreshold = 4.5 - dnaBonus - roundBonus;

      if (searchSkill > discoveryThreshold) {
        const clue = targetComp.realClue;
        const alreadyFound = foundClues.has(targetComp.id);
        foundClues.add(targetComp.id);
        result.phase2.playerEvidence[name].push({ compartment: targetComp.id, clue, isReal: targetComp.isReal, round });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + (targetComp.isReal ? (alreadyFound ? 1 : 3) : -1);

        if (targetComp.isReal) {
          const text = alreadyFound
            ? pick([
              `${name} found the same clue someone else already discovered in the ${targetComp.name} — ${clue}. Confirming evidence. The case grows stronger.`,
              `${name} independently verified the evidence in the ${targetComp.name}: ${clue}. Two investigators, same conclusion. That's not coincidence.`,
              `${name} searched the ${targetComp.name} and found what another detective already flagged — ${clue}. Corroboration. The real clues are emerging.`,
            ])
            : pick(SEARCH_TEXT)(name, targetComp, clue);
          roundResults.push({ name, compartment: targetComp, clue, found: true, isReal: true, text });
        } else {
          roundResults.push({ name, compartment: targetComp, clue, found: true, isReal: false, text: pick(RED_HERRING_TEXT)(name, clue) });
        }
      } else {
        roundResults.push({ name, compartment: targetComp, found: false, text: pick(SEARCH_FAIL_TEXT)(name, targetComp) });
      }
    }
    result.phase2.searchRounds.push(roundResults);

    // Search-together moments — two players in the same compartment
    const compGroups = {};
    roundResults.forEach(sr => { const c = sr.compartment?.id || 'unknown'; if (!compGroups[c]) compGroups[c] = []; compGroups[c].push(sr); });
    for (const [compId, group] of Object.entries(compGroups)) {
      if (group.length >= 2) {
        const a = group[0].name, b = group[1].name;
        const bond = getBond(a, b);
        const comp = compartments.find(c => c.id === compId);
        if (bond > 2) {
          roundResults.push({ name: a, found: false, isEvent: true,
            text: pick([
              `${a} and ${b} searched the ${comp?.name || 'compartment'} together. Two heads are better than one — they compared notes and shared leads. Partnership forming.`,
              `${a} bumped into ${b} in the ${comp?.name || 'compartment'}. "Find anything?" They pooled resources. Trust building under pressure.`,
            ])
          });
          addBond(a, b, 1);
        } else if (bond < -2) {
          roundResults.push({ name: a, found: false, isEvent: true,
            text: pick([
              `${a} and ${b} ended up in the same compartment. The tension was suffocating. Neither shared what they found. Both left faster than they arrived.`,
              `${a} walked into the ${comp?.name || 'compartment'} and saw ${b} already there. They searched in hostile silence. Each suspected the other of being the killer.`,
            ])
          });
          addBond(a, b, -1);
        }
      }
    }

    // Paranoia after framing (round 2 — players react to planted evidence from round 1)
    if (round === 1 && result.phase2.framesPlanted.length > 0) {
      const framedPlayer = result.phase2.framesPlanted[0].target;
      const accusers = active.filter(n => n !== framedPlayer && n !== killer && Math.random() < 0.4);
      if (accusers.length) {
        const accuser = pick(accusers);
        const fPr = pronouns(framedPlayer);
        roundResults.push({ name: accuser, found: false, isEvent: true,
          text: pick([
            `${accuser} confronts ${framedPlayer}. "That evidence by your seat — explain it." ${framedPlayer}: "I've never SEEN that before!" ${accuser}: "Sure you haven't." The suspicion is toxic.`,
            `${accuser} pulls ${framedPlayer} aside. "People are talking. About you. About what they found." ${framedPlayer}'s face goes white. "It was PLANTED!" But who believes that?`,
            `"${framedPlayer}, you were closest to the body." ${accuser}'s voice is cold. ${framedPlayer}: "That doesn't mean—" ${accuser}: "It means I'm watching you."`,
          ])
        });
        addBond(accuser, framedPlayer, -2);
        addBond(framedPlayer, accuser, -1);
        ep.campEvents[campKey].post.push({
          text: `${accuser} publicly accused ${framedPlayer} based on planted evidence!`,
          players: [accuser, framedPlayer], badgeText: 'ACCUSATION', badgeClass: 'red', tag: 'get-a-clue',
        });
      }
    }
  }

  // Blackout events (2 blackouts)
  for (let b = 0; b < 2; b++) {
    const blackoutEvents = [];

    if (b === 0) {
      // Body disappearance blackout
      blackoutEvents.push({ type: 'bodyDisappear', text: pick(BLACKOUT_TEXT.bodyDisappear)(killer) });
    }

    // Killer plants false evidence
    const frameTarget = pick(active.filter(n => n !== killer));
    blackoutEvents.push({ type: 'frame', killer, target: frameTarget, text: pick(BLACKOUT_TEXT.frame)(killer, frameTarget) });
    result.phase2.framesPlanted.push({ target: frameTarget, round: b });
    popDelta(frameTarget, -1);
    ep.campEvents[campKey].post.push({
      text: `Suspicious evidence was found near ${frameTarget} after a blackout on the mystery train...`,
      players: [frameTarget], badgeText: 'FRAMED?', badgeClass: 'amber', tag: 'get-a-clue',
    });

    // Witness glimpses based on intuition
    const witnesses = active.filter(n => n !== killer);
    for (const w of witnesses) {
      const s = pStats(w);
      if (s.intuition * 0.5 + noise(3) > 4) {
        const detail = pick(WITNESS_DETAILS);
        blackoutEvents.push({ type: 'witness', witness: w, detail, text: pick(BLACKOUT_TEXT.witness)(w, detail) });
        result.phase2.witnessLog.push({ witness: w, detail, round: b });
        ep.chalMemberScores[w] = (ep.chalMemberScores[w] || 0) + 1;
      }
    }

    // Evidence theft (rare)
    if (Math.random() < 0.25) {
      const thieves = active.filter(n => pStats(n).strategic > 6 && n !== killer);
      if (thieves.length) {
        const thief = pick(thieves);
        const victims = active.filter(n => n !== thief && result.phase2.playerEvidence[n].length > 0);
        if (victims.length) {
          const victim = pick(victims);
          blackoutEvents.push({ type: 'steal', thief, victim, text: pick(BLACKOUT_TEXT.steal)(thief, victim) });
          const stolen = result.phase2.playerEvidence[victim].pop();
          if (stolen) result.phase2.playerEvidence[thief].push(stolen);
          addBond(thief, victim, -2);
          addBond(victim, thief, -1);
          ep.campEvents[campKey].post.push({
            text: `${thief} stole evidence from ${victim} during a blackout on the mystery train!`,
            players: [thief, victim], badgeText: 'EVIDENCE STOLEN', badgeClass: 'red', tag: 'get-a-clue',
          });
        }
      }
    }

    // Showmance moment in the dark — share evidence + protective bias
    if (gs.showmances?.length) {
      for (const sm of gs.showmances) {
        if (active.includes(sm.a) && active.includes(sm.b) && Math.random() < 0.5) {
          // Share evidence: whoever has more gives one to the other
          const aEvidence = result.phase2.playerEvidence[sm.a]?.length || 0;
          const bEvidence = result.phase2.playerEvidence[sm.b]?.length || 0;
          let shareText = '';
          if (aEvidence > bEvidence && aEvidence > 0) {
            const shared = result.phase2.playerEvidence[sm.a][result.phase2.playerEvidence[sm.a].length - 1];
            result.phase2.playerEvidence[sm.b].push({ ...shared, sharedBy: sm.a });
            shareText = ` ${sm.a} whispered what ${pronouns(sm.a).sub} found. Intel shared.`;
          } else if (bEvidence > 0) {
            const shared = result.phase2.playerEvidence[sm.b][result.phase2.playerEvidence[sm.b].length - 1];
            result.phase2.playerEvidence[sm.a].push({ ...shared, sharedBy: sm.b });
            shareText = ` ${sm.b} whispered what ${pronouns(sm.b).sub} found. Intel shared.`;
          }
          // Mark protective bias for Phase 3
          if (!result.phase2.showmanceProtections) result.phase2.showmanceProtections = [];
          result.phase2.showmanceProtections.push({ protector: sm.a, protected: sm.b });
          result.phase2.showmanceProtections.push({ protector: sm.b, protected: sm.a });

          const baseText = pick(BLACKOUT_TEXT.showmance)(sm.a, sm.b);
          blackoutEvents.push({ type: 'showmance', a: sm.a, b: sm.b, text: baseText + shareText });
          addBond(sm.a, sm.b, 2);
          ep.campEvents[campKey].post.push({
            text: `${sm.a} and ${sm.b} shared evidence during a blackout — their showmance gives them an investigative edge.`,
            players: [sm.a, sm.b], badgeText: 'INTEL SHARED', badgeClass: 'pink', tag: 'get-a-clue',
          });
        }
      }
    }

    result.phase2.blackouts.push(blackoutEvents);
  }

  // Witness credibility — witnesses try to share intel, others believe or doubt
  if (result.phase2.witnessLog.length) {
    const uniqueWitnesses = [...new Set(result.phase2.witnessLog.filter(w => w.round < 99).map(w => w.witness))];
    for (const witness of uniqueWitnesses.slice(0, 2)) {
      const listener = pick(active.filter(n => n !== witness && n !== killer));
      if (!listener) continue;
      const wBond = getBond(witness, listener);
      const believeChance = pStats(listener).intuition * 0.3 + (wBond > 0 ? 2 : 0) + noise(2);
      const wPr = pronouns(witness);
      if (believeChance > 3) {
        result.phase2.witnessLog.push({ witness, detail: `${listener} believed ${wPr.posAdj} testimony`, round: 99, credibility: 'believed', listener });
        addBond(witness, listener, 1);
      } else {
        result.phase2.witnessLog.push({ witness, detail: `${listener} doubted ${wPr.posAdj} testimony`, round: 99, credibility: 'doubted', listener });
        addBond(witness, listener, -1);
        ep.campEvents[campKey].post.push({
          text: `${listener} doubted ${witness}'s blackout testimony — trust broken on the mystery train.`,
          players: [witness, listener], badgeText: 'DOUBTED', badgeClass: 'amber', tag: 'get-a-clue',
        });
      }
    }
  }

  // Camp event for the investigation
  ep.campEvents[campKey].post.push({
    text: `${host()} was found "dead" on the mystery train! The investigation is underway!`,
    players: active, badgeText: 'MURDER MYSTERY', badgeClass: 'red', tag: 'get-a-clue',
  });

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: TRIAL ARC
  // ══════════════════════════════════════════════════════════════

  // Killer strategy selection
  const kS = pStats(killer);
  const confessionChance = kS.strategic * 0.1 + kS.boldness * 0.15 + noise(1);
  const coverChance = kS.social * 0.15 + (10 - kS.boldness) * 0.1 + noise(1);

  let killerStrategy;
  if (confessionChance > coverChance + 1) killerStrategy = 'confession';
  else if (coverChance > confessionChance + 0.5) killerStrategy = 'deepCover';
  else killerStrategy = 'partialTruth';
  result.killerStrategy = killerStrategy;

  // Find the most framed player for deep cover
  const frameCounts = {};
  result.phase2.framesPlanted.forEach(f => { frameCounts[f.target] = (frameCounts[f.target] || 0) + 1; });
  const mostFramed = Object.entries(frameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || pick(active.filter(n => n !== killer));

  // Framed player tracking
  const framedNames = new Set(result.phase2.framesPlanted.map(f => f.target));

  // Presentations — track used templates to avoid duplicates
  const presentations = [];
  const _usedTemplates = { strong: [], medium: [], weak: [] };
  const _pickUnique = (pool, category) => {
    const unused = pool.filter((_, i) => !_usedTemplates[category]?.includes(i));
    if (unused.length === 0) { _usedTemplates[category] = []; return pick(pool); }
    const idx = pool.indexOf(pick(unused));
    _usedTemplates[category]?.push(idx);
    return pool[idx];
  };
  for (const name of active) {
    const s = pStats(name);
    const evidenceCount = result.phase2.playerEvidence[name].filter(e => e.isReal).length;
    // Framed players suffer credibility penalty — hard to present when everyone suspects you
    const isFramed = framedNames.has(name);
    const framePenalty = isFramed ? -1.5 : 0;
    const caseStrength = evidenceCount * 2.5 + s.social * 0.2 + s.mental * 0.15 + noise(0.5) + framePenalty;

    let text, category;
    if (name === killer) {
      if (killerStrategy === 'confession') {
        text = pick(PRESENTATION_TEXT.killerConfession)(name);
        category = 'confession';
      } else if (killerStrategy === 'deepCover') {
        text = pick(PRESENTATION_TEXT.killerDeepCover)(name, mostFramed);
        category = 'deepCover';
      } else {
        text = _pickUnique(PRESENTATION_TEXT.medium, 'medium')(name, evidenceCount);
        category = 'partialTruth';
      }
    } else if (evidenceCount >= 2 && caseStrength > 4) {
      text = _pickUnique(PRESENTATION_TEXT.strong, 'strong')(name, evidenceCount);
      category = 'strong';
    } else if (evidenceCount >= 1 || caseStrength > 2.5) {
      text = _pickUnique(PRESENTATION_TEXT.medium, 'medium')(name, evidenceCount);
      category = 'medium';
    } else {
      text = _pickUnique(PRESENTATION_TEXT.weak, 'weak')(name, evidenceCount);
      category = 'weak';
    }

    presentations.push({ name, text, category, caseStrength: caseStrength.toFixed(1), evidenceCount, accused: name === killer && killerStrategy === 'confession' ? killer : (name === killer && killerStrategy === 'deepCover') ? mostFramed : null });
  }
  result.phase3.presentations = presentations;

  // Cross-Examination (2-3 exchanges)
  // Cross-examination — evidence + stats determine power, results affect courtroom vote
  const numCrossExams = 2 + (active.length > 6 ? 1 : 0);
  const crossExams = [];
  const usedPairs = new Set();
  const usedAttackers = new Set();
  const crossExamBoosts = {};
  const crossExamPenalties = {};
  active.forEach(n => { crossExamBoosts[n] = 0; crossExamPenalties[n] = 0; });

  for (let i = 0; i < numCrossExams; i++) {
    // Qualification: intuition > 5, strategic > 6, OR 2+ real evidence
    const attackerPool = active.filter(n => {
      if (usedAttackers.has(n)) return false;
      const s = pStats(n);
      const ev = result.phase2.playerEvidence[n]?.filter(e => e.isReal).length || 0;
      return s.intuition > 5 || s.strategic > 6 || ev >= 2;
    });
    const attacker = pick(attackerPool.length ? attackerPool : active.filter(n => !usedAttackers.has(n)));
    if (!attacker) break;
    usedAttackers.add(attacker);
    const defenders = active.filter(n => n !== attacker && !usedPairs.has(`${attacker}-${n}`));
    const defender = pick(defenders.length ? defenders : active.filter(n => n !== attacker));
    usedPairs.add(`${attacker}-${defender}`);

    const aS = pStats(attacker);
    const dS = pStats(defender);
    const aEvidence = result.phase2.playerEvidence[attacker]?.filter(e => e.isReal).length || 0;
    const dEvidence = result.phase2.playerEvidence[defender]?.filter(e => e.isReal).length || 0;
    const attackPower = aS.intuition * 0.3 + aS.mental * 0.2 + aS.strategic * 0.2 + aEvidence * 1.5 + noise(1);
    const defensePower = dS.social * 0.3 + dS.mental * 0.2 + dS.strategic * 0.2 + dEvidence * 1.5 + noise(1);

    let text, winner;
    if (attacker === killer && defender !== killer) {
      text = pick(CROSS_EXAM_TEXT.killerDerail)(attacker, defender);
      winner = attackPower > defensePower ? 'attacker' : 'defender';
    } else if (attackPower > defensePower + 1) {
      text = pick(CROSS_EXAM_TEXT.attack)(attacker, defender);
      winner = 'attacker';
    } else {
      text = pick(CROSS_EXAM_TEXT.deflect)(defender, attacker);
      winner = 'defender';
    }

    if (winner === 'attacker') {
      ep.chalMemberScores[attacker] = (ep.chalMemberScores[attacker] || 0) + 3;
      crossExamBoosts[attacker] += 2;
      crossExamPenalties[defender] += 2;
      addBond(attacker, defender, -1);
      popDelta(attacker, 1);
      popDelta(defender, -1);
      ep.campEvents[campKey].post.push({
        text: `${attacker} destroyed ${defender}'s case in cross-examination during the murder mystery trial!`,
        players: [attacker, defender], badgeText: 'CROSS-EXAM', badgeClass: 'amber', tag: 'get-a-clue',
      });
    } else {
      ep.chalMemberScores[defender] = (ep.chalMemberScores[defender] || 0) + 3;
      crossExamBoosts[defender] += 1.5;
      crossExamPenalties[attacker] += 1;
      addBond(defender, attacker, -1);
      popDelta(defender, 1);
    }

    crossExams.push({ attacker, defender, text, winner });
  }
  result.phase3.crossExams = crossExams;

  // Rebuttals
  const rebuttals = [];
  // Alliance support
  if (gs.namedAlliances?.length) {
    for (const al of gs.namedAlliances) {
      const members = al.members.filter(m => active.includes(m));
      if (members.length >= 2 && Math.random() < 0.4) {
        const supporter = pick(members);
        const ally = pick(members.filter(m => m !== supporter));
        rebuttals.push({ type: 'allianceSupport', supporter, ally, text: pick(REBUTTAL_TEXT.allianceSupport)(supporter, ally) });
        addBond(supporter, ally, 1);
      }
    }
  }
  // Showmance protection — guaranteed if partner was framed, otherwise 50%
  const protections = result.phase2.showmanceProtections || [];
  if (gs.showmances?.length) {
    for (const sm of gs.showmances) {
      if (!active.includes(sm.a) || !active.includes(sm.b)) continue;
      const aFramed = framedNames.has(sm.a);
      const bFramed = framedNames.has(sm.b);
      const hasProtection = protections.some(p => (p.protector === sm.a && p.protected === sm.b) || (p.protector === sm.b && p.protected === sm.a));
      if (aFramed && hasProtection) {
        rebuttals.push({ type: 'showmanceProtect', protector: sm.b, partner: sm.a,
          text: `${sm.b} stands up. "I was WITH ${sm.a} during the blackout. ${pronouns(sm.a).Sub} couldn't have planted that evidence — because ${pronouns(sm.a).sub} was holding my hand in the dark." The room goes quiet. The showmance just became an alibi.` });
        addBond(sm.a, sm.b, 1);
        ep.campEvents[campKey].post.push({
          text: `${sm.b} defended ${sm.a} from framing charges — their blackout moment became an alibi!`,
          players: [sm.a, sm.b], badgeText: 'ALIBI', badgeClass: 'pink', tag: 'get-a-clue',
        });
      } else if (bFramed && hasProtection) {
        rebuttals.push({ type: 'showmanceProtect', protector: sm.a, partner: sm.b,
          text: `${sm.a} stands up. "I was WITH ${sm.b} during the blackout. ${pronouns(sm.b).Sub} couldn't have planted that evidence — because ${pronouns(sm.b).sub} was holding my hand in the dark." The room goes quiet. The showmance just became an alibi.` });
        addBond(sm.a, sm.b, 1);
        ep.campEvents[campKey].post.push({
          text: `${sm.a} defended ${sm.b} from framing charges — their blackout moment became an alibi!`,
          players: [sm.a, sm.b], badgeText: 'ALIBI', badgeClass: 'pink', tag: 'get-a-clue',
        });
      } else if (Math.random() < 0.5) {
        rebuttals.push({ type: 'showmanceProtect', protector: sm.a, partner: sm.b, text: pick(REBUTTAL_TEXT.showmanceProtect)(sm.a, sm.b) });
      }
    }
  }
  // Flip allegiance (rare)
  if (Math.random() < 0.3 && active.length > 4) {
    const flipper = pick(active);
    const oldAlly = pick(active.filter(n => n !== flipper));
    const newTarget = pick(active.filter(n => n !== flipper && n !== oldAlly));
    rebuttals.push({ type: 'flip', flipper, oldAlly, newTarget, text: pick(REBUTTAL_TEXT.flipAllegiance)(flipper, oldAlly, newTarget) });
    addBond(flipper, oldAlly, -1);
  }
  result.phase3.rebuttals = rebuttals;

  // ── SUSPICION TRACKER ──
  // Build a suspicion score for each player based on behavioral evidence from the entire challenge.
  // This is what determines WHO each player accuses — not raw stats.
  const suspicion = {};
  active.forEach(n => { suspicion[n] = 0; });

  // Killer was absent from Search Round 1 — huge red flag (only if they actually skipped)
  if (result.phase2.killerAbsent) suspicion[killer] += 3;

  // Killer found zero real evidence (spent time planting instead of searching)
  const killerRealEvidence = result.phase2.playerEvidence[killer]?.filter(e => e.isReal).length || 0;
  if (killerRealEvidence === 0) suspicion[killer] += 1.5;
  else if (killerRealEvidence === 1) suspicion[killer] += 0.5;

  // Murder reactions: the "calm" and "clueless" types are suspicious
  for (const r of (result.phase2.murderReactions || [])) {
    if (r.type === 'calm') suspicion[r.name] += 1.5;
    if (r.type === 'clueless') suspicion[r.name] += 0.5;
    if (r.type === 'leader') suspicion[r.name] -= 1;
    if (r.type === 'panic') suspicion[r.name] -= 0.5;
  }

  // Framed players get false suspicion (the whole point of framing)
  for (const f of result.phase2.framesPlanted) {
    suspicion[f.target] += 2;
  }

  // Witnesses: what they saw can point toward the killer
  for (const w of result.phase2.witnessLog.filter(wl => wl.round < 99)) {
    // If the witness was believed, their testimony adds suspicion to the killer
    const believed = result.phase2.witnessLog.some(wl => wl.witness === w.witness && wl.credibility === 'believed');
    if (believed) suspicion[killer] += 0.5;
  }

  // Cross-exam results: losing cross-exam raises suspicion
  for (const cx of crossExams) {
    if (cx.winner === 'attacker') suspicion[cx.defender] += 1;
    else suspicion[cx.attacker] += 0.5;
  }

  // Killer derailing a correct theory — if they won, it LOWERS their suspicion (successful misdirection)
  for (const cx of crossExams) {
    if (cx.attacker === killer && cx.winner === 'attacker') suspicion[killer] -= 1.5;
  }

  // Players who searched together with killer and found nothing suspicious — lowers killer suspicion
  // (they vouch for normal behavior)

  // Store suspicion for VP display
  result.phase3.suspicionTracker = { ...suspicion };

  // ── DEDUCTION SCORING (evidence-driven) ──
  for (const name of active) {
    const s = pStats(name);
    const realEvidence = result.phase2.playerEvidence[name].filter(e => e.isReal).length;
    const witnessCount = result.phase2.witnessLog.filter(w => w.witness === name && w.round < 99).length;
    const frameDistraction = framedNames.has(name) ? -1 : 0;
    const deductionBase = s.mental * 0.15 + s.intuition * 0.15 + realEvidence * 1.5 + witnessCount * 0.5 + frameDistraction;

    const answers = {};

    // WHO — driven by suspicion tracker, not raw stats
    if (name === killer) {
      if (killerStrategy === 'confession') {
        answers.who = { guess: killer, correct: true };
      } else {
        answers.who = { guess: mostFramed, correct: false };
      }
    } else {
      // Each player looks at the suspicion scores and picks the most suspicious person
      const personalSuspicion = { ...suspicion };
      // Can't suspect yourself
      personalSuspicion[name] = -999;
      // Showmance protective bias
      const isProtectingKiller = (result.phase2.showmanceProtections || []).some(p => p.protector === name && p.protected === killer);
      if (isProtectingKiller) personalSuspicion[killer] -= 5;
      // Bond bias — harder to suspect friends
      active.forEach(n => { if (n !== name) personalSuspicion[n] -= getBond(name, n) * 0.3; });
      // Intuition helps see through frames and deception
      if (s.intuition >= 7) {
        // High intuition sees through planted evidence
        for (const f of result.phase2.framesPlanted) personalSuspicion[f.target] -= 1;
        // And notices the REAL suspicious behavior more clearly
        personalSuspicion[killer] += 1;
      }
      // Small noise so it's not perfectly deterministic
      active.forEach(n => { if (n !== name) personalSuspicion[n] += noise(1.5); });

      const topSuspect = Object.entries(personalSuspicion).sort((a, b) => b[1] - a[1])[0];
      answers.who = { guess: topSuspect[0], correct: topSuspect[0] === killer };
    }

    // WEAPON — primarily driven by finding the weapon clue
    const foundWeapon = result.phase2.playerEvidence[name]?.some(e => e.compartment === 'luggage' && e.isReal);
    const weaponScore = (foundWeapon ? 5 : 0) + s.mental * 0.1 + noise(1);
    answers.weapon = { guess: weaponScore > 3 ? weapon : pick(WEAPONS.filter(w => w !== weapon)), correct: weaponScore > 3 };

    // MOTIVE — primarily driven by finding the motive clue
    const foundMotive = result.phase2.playerEvidence[name]?.some(e => e.compartment === 'observation' && e.isReal);
    const motiveScore = (foundMotive ? 5 : 0) + s.intuition * 0.1 + noise(1);
    answers.motive = { guess: motiveScore > 3 ? motive : pick(MOTIVES.filter(m => m !== motive)), correct: motiveScore > 3 };

    // LOCATION — driven by finding fingerprint/hair evidence
    const foundLocation = result.phase2.playerEvidence[name]?.some(e => (e.compartment === 'dining' || e.compartment === 'sleeper') && e.isReal);
    const locScore = (foundLocation ? 5 : 0) + realEvidence * 0.5 + noise(1);
    answers.location = { guess: locScore > 3 ? evidenceLocation : pick(EVIDENCE_LOCATIONS.filter(l => l !== evidenceLocation)), correct: locScore > 3 };

    const totalCorrect = Object.values(answers).filter(a => a.correct).length;
    const deductionScore = Object.entries(answers).reduce((sum, [key, a]) => {
      const q = DEDUCTION_QUESTIONS.find(dq => dq.key === key);
      return sum + (a.correct ? q.weight : 0);
    }, 0);

    result.phase3.deductionResults[name] = { answers, totalCorrect, deductionScore };
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + deductionScore;
  }

  // Courtroom Vote — showmance partners with protection bias won't vote for each other
  const _protectedPairs = new Set((result.phase2.showmanceProtections || []).map(p => `${p.protector}|${p.protected}`));
  for (const voter of active) {
    const s = pStats(voter);
    const voteScores = active.filter(n => n !== voter).map(n => {
      const pres = presentations.find(p => p.name === n);
      const bond = getBond(voter, n);
      const isProtected = _protectedPairs.has(`${voter}|${n}`);
      const isSuspect = framedNames.has(n);
      const cxBoost = crossExamBoosts[n] || 0;
      const cxPenalty = crossExamPenalties[n] || 0;
      const score = parseFloat(pres.caseStrength) + bond * 0.3 + noise(1) + (isProtected ? -5 : 0) + (isSuspect ? -2 : 0) + cxBoost - cxPenalty;
      return { name: n, score };
    }).sort((a, b) => b.score - a.score);
    result.phase3.courtroomVotes[voter] = voteScores[0].name;
  }

  // Count votes
  const voteCounts = {};
  active.forEach(n => { voteCounts[n] = 0; });
  Object.values(result.phase3.courtroomVotes).forEach(target => { voteCounts[target]++; });
  const courtroomWinner = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0][0];
  result.phase3.courtroomWinner = courtroomWinner;
  result.phase3.voteCounts = voteCounts;

  // Immunity determination
  result.immunityWinner = courtroomWinner;
  popDelta(courtroomWinner, 3);
  ep.campEvents[campKey].post.push({
    text: `${courtroomWinner} won the courtroom vote and earned immunity in Get a Clue!`,
    players: [courtroomWinner], badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'get-a-clue',
  });

  // Lindsay Moment: perfect solver gets immunity IF courtroom winner got any wrong
  const courtroomDeduction = result.phase3.deductionResults[courtroomWinner];
  const perfectSolvers = active.filter(n => result.phase3.deductionResults[n].totalCorrect === 4 && n !== courtroomWinner);
  if (perfectSolvers.length > 0 && courtroomDeduction.totalCorrect < 4) {
    const lindsayMoment = perfectSolvers[0];
    result.secondImmune = lindsayMoment;
    ep.extraImmune = [...(ep.extraImmune || []), lindsayMoment];
    popDelta(lindsayMoment, 4);
    ep.campEvents[campKey].post.push({
      text: `${lindsayMoment} solved the ENTIRE mystery perfectly and earned immunity! The Lindsay Moment!`,
      players: [lindsayMoment], badgeText: 'PERFECT SOLVE!', badgeClass: 'gold', tag: 'get-a-clue',
    });
  }

  // Killer bonus: if fewer than half correctly identified them
  const correctAccusers = active.filter(n => result.phase3.deductionResults[n].answers.who.correct).length;
  if (correctAccusers < active.length / 2) {
    ep.chalMemberScores[killer] = (ep.chalMemberScores[killer] || 0) + 4;
    result.killerGotAway = true;
    ep.campEvents[campKey].post.push({
      text: `${killer} was the killer — and got away with it! Fewer than half the cast figured it out.`,
      players: [killer], badgeText: 'GOT AWAY!', badgeClass: 'purple', tag: 'get-a-clue',
    });
  } else {
    result.killerGotAway = false;
    ep.campEvents[campKey].post.push({
      text: `${killer} was the killer — and the cast figured it out! Justice served on the mystery train.`,
      players: [killer], badgeText: 'CAUGHT!', badgeClass: 'red', tag: 'get-a-clue',
    });
  }

  // Killer reveal aftermath — social fallout
  result.phase3.aftermath = [];
  // Killer's allies feel betrayed
  const killerAllies = active.filter(n => n !== killer && getBond(n, killer) > 3);
  for (const ally of killerAllies.slice(0, 2)) {
    const aPr = pronouns(ally);
    result.phase3.aftermath.push({ type: 'betrayed-ally', player: ally,
      text: pick([
        `${ally} stares at ${killer}. "I TRUSTED you. I defended you in there." ${pronouns(killer).Sub} shrugs. The alliance is shattered.`,
        `${ally} can't believe it. "We were working TOGETHER. This whole time, you were..." ${aPr.Sub} can't finish the sentence. The betrayal cuts deep.`,
      ])
    });
    addBond(ally, killer, -3);
    ep.campEvents[campKey].post.push({
      text: `${ally} felt betrayed after discovering ${killer} was the killer all along.`,
      players: [ally, killer], badgeText: 'BETRAYED', badgeClass: 'red', tag: 'get-a-clue',
    });
  }
  // Framed player gets vindication
  const framedPlayers = [...new Set(result.phase2.framesPlanted.map(f => f.target))];
  for (const framed of framedPlayers.slice(0, 1)) {
    const fPr = pronouns(framed);
    result.phase3.aftermath.push({ type: 'vindicated', player: framed,
      text: pick([
        `${framed}: "I TOLD you it was planted! I TOLD you!" ${fPr.Sub} points at ${killer}. "YOU. You did this to me." Vindicated, furious, and already planning revenge.`,
        `${framed} stands up slowly. "Every single one of you doubted me." ${fPr.Sub} looks at the room. "Remember that." The framed player is free — but the damage to trust is done.`,
      ])
    });
    popDelta(framed, 2);
    ep.campEvents[campKey].post.push({
      text: `${framed} was vindicated — the evidence was planted by ${killer}!`,
      players: [framed, killer], badgeText: 'VINDICATED', badgeClass: 'green', tag: 'get-a-clue',
    });
  }

  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, null, null, ep.chalMemberScores || {}, 'murder mystery train');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'investigation', _romActive);

  // ── FINALIZE ──
  ep.getAClue = result;
  ep.isGetAClue = true;
  ep.challengeType = 'get-a-clue';
  ep.challengeLabel = 'Get a Clue';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;

  // chalPlacements: immunity winner first, then by total score descending
  const placements = [...active].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
  ep.chalPlacements = placements;

  // Immunity winner MUST be #1
  const maxOtherScore = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([, s]) => s));
  ep.chalMemberScores[result.immunityWinner] = Math.max((ep.chalMemberScores[result.immunityWinner] || 0), maxOtherScore) + active.length + 5;
  if (result.secondImmune) {
    const maxOther2 = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner && n !== result.secondImmune).map(([, s]) => s));
    ep.chalMemberScores[result.secondImmune] = Math.max((ep.chalMemberScores[result.secondImmune] || 0), maxOther2) + active.length + 3;
  }

  ep.tribalPlayers = active;
  updateChalRecord(ep);

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'get-a-clue', label: 'Get a Clue', winner: result.immunityWinner };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textGetAClue(ep, ln, sec) {
  const gc = ep.getAClue;
  if (!gc) return;
  sec('GET A CLUE — MURDER MYSTERY');

  ln('-- PHASE 1: DNA COLLECTION --');
  for (const trap of gc.phase1.traps) {
    ln(`  ${trap.trapper} -> ${trap.target} [${trap.method}]: ${trap.outcome} (trap:${trap.trapQuality} vs resist:${trap.resistance})`);
  }
  ln('  Sample counts:');
  for (const [name, count] of Object.entries(gc.phase1.sampleCounts)) {
    ln(`    ${name}: ${count} sample${count !== 1 ? 's' : ''}`);
  }

  ln('-- PHASE 2: TRAIN MURDER --');
  ln(`  Killer: ${gc.phase2.killer}`);
  ln(`  Weapon: ${gc.phase2.weapon} | Motive: ${gc.phase2.motive} | Location: ${gc.phase2.evidenceLocation}`);
  for (let r = 0; r < gc.phase2.searchRounds.length; r++) {
    ln(`  Search Round ${r + 1}:`);
    for (const sr of gc.phase2.searchRounds[r]) {
      ln(`    ${sr.name}: ${sr.found ? (sr.isReal ? 'REAL CLUE' : 'RED HERRING') : 'nothing'}`);
    }
  }
  ln(`  Witnesses: ${gc.phase2.witnessLog.map(w => w.witness).join(', ') || 'none'}`);
  ln(`  Framed: ${gc.phase2.framesPlanted.map(f => f.target).join(', ')}`);

  ln('-- PHASE 3: TRIAL --');
  ln(`  Killer strategy: ${gc.killerStrategy}`);
  for (const p of gc.phase3.presentations) {
    ln(`  ${p.name}: ${p.category} case (strength ${p.caseStrength}, ${p.evidenceCount} real evidence)`);
  }
  for (const cx of gc.phase3.crossExams) {
    ln(`  Cross-exam: ${cx.attacker} vs ${cx.defender} -> ${cx.winner} wins`);
  }
  ln('  Deduction results:');
  for (const [name, dr] of Object.entries(gc.phase3.deductionResults)) {
    ln(`    ${name}: ${dr.totalCorrect}/4 correct (score ${dr.deductionScore})`);
  }
  ln(`  Courtroom winner: ${gc.phase3.courtroomWinner}`);
  ln(`  IMMUNITY: ${gc.immunityWinner}${gc.secondImmune ? ` + ${gc.secondImmune} (PERFECT SOLVE)` : ''}`);
  ln(`  Killer ${gc.killerGotAway ? 'GOT AWAY' : 'CAUGHT'}`);
}

// ══════════════════════════════════════════════════════════════
// VP — CSS (OVERDRIVE)
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap');

  .gc-shell{
    --cork:#b08650;--cork-light:#c4976a;--cork-dark:#8b6914;
    --manila:#f5e6c8;--red-string:#c0392b;--coffee:#5c3d2e;
    --legal-yellow:#fff9c4;--noir-ink:#0d0d1a;--cluedo-green:#1a3d0a;
    --gold-foil:#d4a017;--evidence-blue:#3b82f6;--pin-red:#e74c3c;
    --pin-yellow:#f1c40f;--pin-white:#ecf0f1;--desk-wood:#2a1a0e;
    font-family:'Playfair Display',serif;color:var(--manila);
    background:var(--noir-ink);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:500px;
    overflow:clip;border:3px solid var(--coffee);
    box-shadow:0 0 40px rgba(0,0,0,0.8),inset 0 0 80px rgba(0,0,0,0.6);
  }
  .gc-shell *{box-sizing:border-box}

  /* Desk lamp spotlight + ambient noir */
  .gc-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(ellipse 600px 400px at 30% 20%,rgba(212,160,23,0.08) 0%,transparent 100%),
      radial-gradient(ellipse 400px 300px at 70% 80%,rgba(192,57,43,0.04) 0%,transparent 100%),
      radial-gradient(circle at 50% 0%,rgba(26,26,46,0.9) 0%,transparent 70%);
  }

  /* ═══ TWO-COLUMN LAYOUT: Evidence Board + Main Content ═══ */
  .gc-layout{display:flex;gap:0;position:relative;z-index:1;min-height:480px}
  .gc-main{flex:1;padding:16px 20px;min-width:0}
  .gc-board-col{width:280px;flex-shrink:0;position:sticky;top:0;align-self:flex-start;
    max-height:100vh;overflow-y:auto;
    scrollbar-width:thin;scrollbar-color:var(--cork-dark) transparent}

  /* ═══ EVIDENCE BOARD (the conspiracy wall) ═══ */
  .gc-board{
    background:var(--cork);margin:0;padding:12px 10px;min-height:400px;position:relative;
    border-right:4px solid var(--cork-dark);
    box-shadow:inset 0 0 30px rgba(0,0,0,0.4),inset 0 0 60px rgba(0,0,0,0.15);
    background-image:
      url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E"),
      linear-gradient(135deg,var(--cork) 0%,var(--cork-light) 50%,var(--cork) 100%);
  }
  .gc-board-title{font-family:'Courier Prime',monospace;font-weight:700;font-size:11px;
    color:var(--coffee);text-transform:uppercase;letter-spacing:3px;text-align:center;
    padding:4px 8px;margin-bottom:10px;
    background:var(--manila);border:1px solid var(--coffee);
    box-shadow:1px 2px 3px rgba(0,0,0,0.2)}
  .gc-board-phase{font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee);
    text-align:center;margin:4px 0 8px;opacity:0.7}

  /* Polaroid suspect photos on the board */
  .gc-suspect-grid{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:4px 0}
  .gc-polaroid{background:#fff;padding:4px 4px 20px;display:inline-block;position:relative;
    box-shadow:2px 3px 8px rgba(0,0,0,0.35),0 0 1px rgba(0,0,0,0.2);
    transform:rotate(var(--rot,0deg));transition:transform 0.3s,box-shadow 0.3s}
  .gc-polaroid:hover{transform:rotate(0deg) scale(1.1);box-shadow:3px 5px 12px rgba(0,0,0,0.5);z-index:5}
  .gc-polaroid img{width:48px;height:48px;object-fit:contain;display:block;
    filter:sepia(0.1) contrast(1.05)}
  .gc-polaroid-name{font-family:'Special Elite',monospace;font-size:9px;color:#444;text-align:center;
    position:absolute;bottom:4px;left:0;right:0;white-space:nowrap;overflow:hidden}
  .gc-polaroid-pin{position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:10px;height:10px;
    border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);z-index:2}
  .gc-polaroid-guilty{border:2px solid var(--red-string);box-shadow:0 0 12px rgba(192,57,43,0.5)}
  .gc-polaroid-framed{border:2px solid var(--gold-foil)}

  /* String containers */
  .gc-strings-container{}

  /* ═══ EVIDENCE EVENT CARD (pinned photo + narration) ═══ */
  .gc-evidence-evt{display:flex;gap:0;margin:8px 0;position:relative;
    animation:gc-pin-evidence 0.5s cubic-bezier(0.16,1,0.3,1) both}
  .gc-evidence-evt-photos{display:flex;gap:4px;flex-shrink:0;padding:6px 8px;
    align-items:flex-start;position:relative}
  .gc-evidence-evt-photo{background:#fff;padding:3px 3px 14px;position:relative;
    box-shadow:2px 3px 6px rgba(0,0,0,0.3);transform:rotate(var(--rot,0deg))}
  .gc-evidence-evt-photo img{width:36px;height:36px;object-fit:contain;display:block;filter:sepia(0.1)}
  .gc-evidence-evt-photo-name{font-family:'Special Elite',monospace;font-size:7px;color:#444;
    text-align:center;position:absolute;bottom:2px;left:0;right:0;white-space:nowrap;overflow:hidden}
  .gc-evidence-evt-pin{position:absolute;top:-4px;left:50%;transform:translateX(-50%);
    width:8px;height:8px;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.3);z-index:2}
  .gc-evidence-evt-body{flex:1;padding:8px 12px;font-family:'Special Elite',monospace;
    font-size:13px;line-height:1.6;border-radius:0 4px 4px 0}
  .gc-evidence-evt-label{font-family:'Courier Prime',monospace;font-size:9px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;display:inline-block;
    padding:1px 6px;border:1px solid;border-radius:2px}
  @keyframes gc-pin-evidence{
    0%{opacity:0;transform:translateY(-12px) rotate(-1deg)}
    40%{opacity:1;transform:translateY(2px) rotate(0.5deg)}
    70%{transform:translateY(-1px) rotate(-0.3deg)}
    100%{opacity:1;transform:translateY(0) rotate(0deg)}
  }

  /* Sticky notes on the board */
  .gc-sticky{font-family:'Special Elite',monospace;font-size:10px;padding:6px 8px;
    margin:4px auto;max-width:120px;position:relative;line-height:1.4;
    box-shadow:2px 3px 6px rgba(0,0,0,0.25);transform:rotate(var(--rot,0deg))}
  .gc-sticky-yellow{background:#fff9c4;color:#333}
  .gc-sticky-pink{background:#fce4ec;color:#880e4f}
  .gc-sticky-blue{background:#e3f2fd;color:#1565c0}
  .gc-sticky-green{background:#e8f5e9;color:#2e7d32}

  /* String connection cards */
  .gc-string-card{display:flex;align-items:center;gap:4px;margin:3px 0;padding:3px 6px;
    animation:gc-string-card-in 0.4s ease-out both}
  .gc-string-card-yellow .gc-string-line-h{background:var(--gold-foil)}
  .gc-string-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;
    box-shadow:0 1px 2px rgba(0,0,0,0.3)}
  .gc-string-name{font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee);
    flex-shrink:0;white-space:nowrap}
  .gc-string-line-h{flex:1;height:2px;background:var(--red-string);min-width:8px;
    box-shadow:0 0 3px rgba(192,57,43,0.3);position:relative}
  .gc-string-line-h::before{content:'';position:absolute;top:-1px;left:0;right:0;bottom:-1px;
    background:inherit;opacity:0.3;filter:blur(2px)}
  @keyframes gc-string-card-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}

  /* Clue cards pinned to the board */
  .gc-clue-pin{display:flex;align-items:flex-start;gap:6px;margin:6px 0;padding:5px;
    background:rgba(255,255,255,0.06);border-radius:2px;border-left:3px solid var(--red-string)}
  .gc-clue-icon{font-size:14px;flex-shrink:0;margin-top:1px}
  .gc-clue-text{font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee);line-height:1.3}

  /* Evidence tally on the board */
  .gc-tally{display:flex;gap:2px;margin:2px 0}
  .gc-tally-mark{width:3px;height:14px;background:var(--coffee);border-radius:1px}
  .gc-tally-mark:nth-child(5n){transform:rotate(-45deg);margin-left:-12px;width:16px;height:2px;margin-top:6px}

  /* Board section dividers */
  .gc-board-divider{border:none;border-top:2px dashed rgba(92,61,46,0.3);margin:8px 0}

  /* Coffee stain decorations */
  .gc-coffee-ring{position:absolute;border-radius:50%;pointer-events:none;
    border:2px solid rgba(92,61,46,0.12);z-index:0}

  /* ═══ TYPOGRAPHY ═══ */
  .gc-title{font-family:'Playfair Display',serif;font-weight:900;font-size:36px;text-align:center;
    color:var(--manila);text-shadow:0 0 40px rgba(212,160,23,0.2),2px 2px 4px rgba(0,0,0,0.5);letter-spacing:4px}
  .gc-subtitle{font-family:'Special Elite',monospace;font-size:13px;text-align:center;color:var(--gold-foil);
    letter-spacing:5px;text-transform:uppercase;margin:4px 0}
  .gc-typewriter{font-family:'Special Elite',monospace;font-size:14px;color:var(--manila);line-height:1.7}
  .gc-stamp{font-family:'Courier Prime',monospace;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    border:3px solid;padding:4px 12px;display:inline-block;transform:rotate(-3deg);
    text-shadow:1px 1px 0 rgba(0,0,0,0.1)}
  .gc-narration{font-family:'Special Elite',monospace;font-size:14px;color:var(--manila);
    line-height:1.8;margin:10px 0;padding:12px 16px;
    background:rgba(92,61,46,0.15);border-left:3px solid var(--coffee);
    border-radius:0 4px 4px 0}
  .gc-phase-title{font-family:'Playfair Display',serif;font-weight:700;font-size:20px;
    color:var(--gold-foil);text-align:center;margin:12px 0 8px;letter-spacing:2px;
    text-shadow:0 0 20px rgba(212,160,23,0.15)}
  .gc-phase-badge{display:inline-block;font-family:'Courier Prime',monospace;font-size:10px;
    padding:2px 8px;border:1px solid var(--gold-foil);color:var(--gold-foil);
    letter-spacing:2px;text-transform:uppercase;margin:0 auto 8px;border-radius:2px}

  /* ═══ MANILA FOLDERS ═══ */
  .gc-folder{background:var(--manila);border-radius:0 6px 4px 4px;padding:14px 16px;margin:10px 0;
    position:relative;color:var(--coffee);
    box-shadow:2px 3px 8px rgba(0,0,0,0.25),0 0 1px rgba(0,0,0,0.1)}
  .gc-folder::before{content:'';position:absolute;top:-10px;left:0;width:100px;height:10px;
    background:var(--manila);border-radius:3px 3px 0 0;
    box-shadow:1px -1px 3px rgba(0,0,0,0.08)}
  .gc-folder-label{font-family:'Courier Prime',monospace;font-size:11px;color:var(--coffee);
    text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:700;
    border-bottom:1px solid rgba(92,61,46,0.2);padding-bottom:4px}
  .gc-folder-content{font-family:'Special Elite',monospace;font-size:13px;color:var(--coffee);line-height:1.6}

  /* ═══ TRAIN MAP (Cluedo board) ═══ */
  .gc-train-map{display:flex;gap:2px;margin:10px 0;padding:10px;
    background:linear-gradient(180deg,#1a3d0a,#2d5016,#1a3d0a);
    border:3px solid #0d2505;border-radius:4px;position:relative;
    box-shadow:inset 0 0 20px rgba(0,0,0,0.4)}
  .gc-compartment{flex:1;background:var(--manila);border:2px solid var(--coffee);border-radius:3px;
    padding:8px 4px;text-align:center;min-height:60px;position:relative;cursor:default;
    transition:all 0.3s;font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee)}
  .gc-compartment-icon{font-size:18px;margin-bottom:2px}
  .gc-compartment-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .gc-compartment-searched{border-color:var(--red-string);background:var(--legal-yellow);
    box-shadow:0 0 6px rgba(192,57,43,0.2)}
  .gc-train-connector{width:8px;height:4px;background:#8b6914;align-self:center;border-radius:1px}

  /* ═══ BLACKOUT ═══ */
  .gc-blackout{background:#000;color:#fff;padding:20px 24px;margin:10px 0;border:2px solid #222;
    border-radius:4px;position:relative;min-height:80px;
    box-shadow:inset 0 0 40px rgba(0,0,0,1),0 0 20px rgba(0,0,0,0.5)}
  .gc-blackout::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
    background:radial-gradient(circle at 50% 50%,transparent 0%,rgba(0,0,0,0.4) 100%);pointer-events:none}
  .gc-blackout-text{font-family:'Special Elite',monospace;font-size:14px;color:rgba(255,255,255,0.85);
    line-height:1.8;position:relative;z-index:1}
  .gc-blackout-flash{animation:gc-flash 0.4s ease-out;background:rgba(255,255,255,0.08);
    padding:8px 12px;border-radius:4px;margin:6px 0;border-left:2px solid rgba(255,255,255,0.15)}
  .gc-silhouette-row{display:flex;gap:4px;justify-content:center;margin:8px 0;position:relative;z-index:1}
  .gc-silhouette{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;
    font-size:12px;position:relative}
  .gc-silhouette-glow{border-color:rgba(255,255,255,0.3);box-shadow:0 0 8px rgba(255,255,255,0.15)}

  /* ═══ COURTROOM ═══ */
  .gc-courtroom{background:linear-gradient(180deg,#0a0a1f 0%,#16213e 40%,#0f3460 100%);
    padding:16px;margin:10px 0;border:2px solid var(--gold-foil);border-radius:4px;
    box-shadow:inset 0 0 40px rgba(15,52,96,0.3),0 0 12px rgba(212,160,23,0.1)}
  .gc-spotlight{background:radial-gradient(ellipse 300px 200px at center top,rgba(212,160,23,0.12) 0%,transparent 100%);
    padding:16px;position:relative}
  .gc-case-file{background:var(--manila);color:var(--coffee);padding:12px;border-radius:3px;margin:8px 0;
    position:relative;box-shadow:2px 3px 6px rgba(0,0,0,0.3);
    border-left:4px solid var(--coffee)}
  .gc-case-strength{height:6px;background:rgba(92,61,46,0.2);border-radius:3px;margin-top:6px;
    position:relative;overflow:hidden;border:1px solid rgba(92,61,46,0.15)}
  .gc-case-strength-fill{height:100%;border-radius:2px;transition:width 0.6s ease}
  .gc-objection{font-family:'Courier Prime',monospace;font-weight:700;font-size:20px;
    letter-spacing:4px;display:inline-block;padding:6px 16px;margin:8px 0;
    border:4px solid;text-shadow:1px 1px 0 rgba(0,0,0,0.2);
    box-shadow:2px 3px 0 rgba(0,0,0,0.2)}
  .gc-objection-sustained{color:#22c55e;border-color:#22c55e;transform:rotate(-3deg);
    animation:gc-stamp-slam 0.4s ease-out}
  .gc-objection-overruled{color:var(--red-string);border-color:var(--red-string);transform:rotate(2deg);
    animation:gc-stamp-slam 0.4s ease-out}
  .gc-cross-exam{display:flex;gap:12px;align-items:center;margin:8px 0;padding:8px;
    background:rgba(0,0,0,0.2);border-radius:6px}
  .gc-cross-side{flex:1;text-align:center;padding:8px}
  .gc-cross-vs{font-family:'Playfair Display',serif;font-weight:900;font-size:20px;color:var(--gold-foil);
    flex:0 0 50px;text-align:center;text-shadow:0 0 10px rgba(212,160,23,0.3)}
  .gc-cross-slash{position:absolute;top:50%;left:0;right:0;height:3px;
    background:linear-gradient(90deg,transparent,var(--red-string),transparent);
    transform:rotate(-5deg);opacity:0;animation:gc-slash 0.3s ease-out forwards}

  /* ═══ DEDUCTION CARDS ═══ */
  .gc-deduction-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:10px 0}
  .gc-card{width:130px;min-height:90px;border:3px solid var(--gold-foil);border-radius:4px;
    background:linear-gradient(135deg,#1a3d0a,#2d5016);color:#fff;text-align:center;padding:10px 6px;
    font-family:'Playfair Display',serif;position:relative;
    box-shadow:3px 4px 8px rgba(0,0,0,0.4),inset 0 0 20px rgba(0,0,0,0.2)}
  .gc-card-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--gold-foil);
    margin-bottom:6px;font-family:'Courier Prime',monospace}
  .gc-card-value{font-family:'Special Elite',monospace;font-size:13px;font-weight:700;line-height:1.3}
  .gc-card-correct{border-color:#22c55e;box-shadow:0 0 16px rgba(34,197,94,0.3),3px 4px 8px rgba(0,0,0,0.4)}
  .gc-card-correct::after{content:'✓';position:absolute;top:4px;right:6px;color:#22c55e;font-size:16px;font-weight:700}
  .gc-card-wrong{border-color:var(--red-string);opacity:0.65;
    background:linear-gradient(135deg,#1a1a2e 40%,#2d1810 100%)}
  .gc-card-wrong::after{content:'✗';position:absolute;top:4px;right:6px;color:var(--red-string);font-size:16px;font-weight:700}

  /* ═══ KILLER REVEAL ═══ */
  .gc-guilty{text-align:center;margin:16px 0;position:relative}
  .gc-guilty-frame{display:inline-block;position:relative;margin-bottom:16px}
  .gc-guilty-photo{background:#fff;padding:6px 6px 24px;display:inline-block;
    box-shadow:3px 5px 15px rgba(0,0,0,0.5);transform:rotate(-2deg)}
  .gc-guilty-photo img{width:90px;height:90px;object-fit:contain;display:block;filter:contrast(1.1)}
  .gc-guilty-photo-name{font-family:'Special Elite',monospace;font-size:13px;color:#333;
    text-align:center;position:absolute;bottom:5px;left:0;right:0}
  .gc-guilty-x{position:absolute;top:-8px;right:-8px;width:100%;height:100%;pointer-events:none}
  .gc-guilty-stamp{font-family:'Courier Prime',monospace;font-size:40px;font-weight:700;
    color:var(--red-string);border:6px double var(--red-string);padding:8px 28px;
    display:inline-block;transform:rotate(-8deg);letter-spacing:8px;
    text-shadow:2px 2px 0 rgba(0,0,0,0.3);
    box-shadow:0 0 30px rgba(192,57,43,0.3);
    animation:gc-stamp-slam 0.5s ease-out}
  .gc-untouchable{font-family:'Courier Prime',monospace;font-size:22px;font-weight:700;
    color:var(--gold-foil);border:3px solid var(--gold-foil);padding:6px 20px;
    display:inline-block;transform:rotate(5deg);letter-spacing:4px;margin-top:12px;
    box-shadow:0 0 20px rgba(212,160,23,0.4);
    animation:gc-stamp-slam 0.5s ease-out 0.3s both}
  .gc-lindsay{background:linear-gradient(135deg,rgba(212,160,23,0.2),rgba(245,158,11,0.2));
    border:2px solid var(--gold-foil);color:var(--manila);padding:16px 24px;border-radius:4px;
    margin:16px 0;text-align:center;font-family:'Playfair Display',serif;
    box-shadow:0 0 30px rgba(212,160,23,0.15),inset 0 0 30px rgba(212,160,23,0.05)}

  /* ═══ PLAYER CARD ═══ */
  .gc-player-card{display:flex;gap:10px;align-items:center;padding:8px 10px;margin:4px 0;
    background:rgba(92,61,46,0.12);border-radius:4px;border:1px solid rgba(196,149,106,0.2);
    transition:all 0.2s}
  .gc-player-card:hover{background:rgba(92,61,46,0.2)}
  .gc-player-name{font-family:'Playfair Display',serif;font-weight:700;font-size:14px}
  .gc-player-detail{font-family:'Special Elite',monospace;font-size:12px;color:rgba(245,230,200,0.6)}
  /* Dark text for elements inside manila folders */
  .gc-folder .gc-player-card{background:rgba(92,61,46,0.08);border-color:rgba(92,61,46,0.2)}
  .gc-folder .gc-player-card:hover{background:rgba(92,61,46,0.15)}
  .gc-folder .gc-player-name{color:var(--coffee)}
  .gc-folder .gc-player-detail{color:rgba(92,61,46,0.75)}
  .gc-folder .gc-narration{color:var(--coffee);background:rgba(59,130,246,0.06)}

  /* ═══ LEGAL PAD ═══ */
  .gc-legal{background:var(--legal-yellow);padding:12px 16px 12px 28px;margin:8px 0;border-radius:2px;
    border-left:4px solid #ef4444;position:relative;
    background-image:repeating-linear-gradient(transparent,transparent 27px,#c5d8e8 27px,#c5d8e8 28px);
    box-shadow:2px 3px 8px rgba(0,0,0,0.2)}
  .gc-legal::before{content:'';position:absolute;left:20px;top:0;bottom:0;width:1px;
    background:rgba(239,68,68,0.3)}
  .gc-legal-text{font-family:'Special Elite',monospace;font-size:13px;color:#333;line-height:28px}

  /* ═══ CONTROLS ═══ */
  .gc-controls{text-align:center;margin:12px 0;padding:8px 0}
  .gc-btn{font-family:'Special Elite',monospace;background:var(--coffee);color:var(--manila);
    border:2px solid var(--cork);padding:8px 24px;cursor:pointer;font-size:14px;
    letter-spacing:1px;border-radius:3px;margin:0 4px;transition:all 0.2s;
    box-shadow:2px 3px 6px rgba(0,0,0,0.3)}
  .gc-btn:hover{background:var(--cork);color:var(--coffee);transform:translateY(-2px);
    box-shadow:2px 5px 10px rgba(0,0,0,0.4)}
  .gc-btn-gold{background:var(--gold-foil);color:var(--noir-ink);border-color:var(--gold-foil)}
  .gc-btn-gold:hover{background:#f59e0b;color:var(--noir-ink)}

  /* ═══ CINEMATIC REVEAL SYSTEM ═══ */
  .gc-step-hidden{opacity:0;transform:translateY(16px);max-height:0;overflow:hidden;margin:0;padding:0;
    transition:none}
  .gc-step-revealing{animation:gc-card-enter 0.5s cubic-bezier(0.16,1,0.3,1) forwards;max-height:2000px}
  .gc-step-visible{opacity:1;transform:none;max-height:none}

  /* ═══ ANIMATIONS ═══ */
  @keyframes gc-card-enter{
    0%{opacity:0;transform:translateY(20px) scale(0.97);filter:blur(2px)}
    60%{opacity:1;filter:blur(0)}
    100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
  }
  @keyframes gc-typewrite{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes gc-flash{0%{background:rgba(255,255,255,0.5)}100%{background:rgba(255,255,255,0.08)}}
  @keyframes gc-stamp-slam{
    0%{transform:rotate(-8deg) scale(3);opacity:0}
    40%{transform:rotate(-8deg) scale(0.85);opacity:1}
    55%{transform:rotate(-8deg) scale(1.05)}
    70%{transform:rotate(-8deg) scale(0.97)}
    100%{transform:rotate(-8deg) scale(1);opacity:1}
  }
  @keyframes gc-slam-shake{
    0%,100%{transform:translateX(0)}
    10%{transform:translateX(-3px) translateY(1px)}
    20%{transform:translateX(3px) translateY(-1px)}
    30%{transform:translateX(-2px)}
    40%{transform:translateX(2px)}
    50%{transform:translateX(-1px)}
  }
  @keyframes gc-slash{0%{opacity:0;transform:rotate(-5deg) scaleX(0)}100%{opacity:1;transform:rotate(-5deg) scaleX(1)}}
  @keyframes gc-pulse-red{0%,100%{box-shadow:0 0 4px rgba(192,57,43,0.2)}50%{box-shadow:0 0 12px rgba(192,57,43,0.5)}}
  @keyframes gc-string-draw{from{stroke-dashoffset:300}to{stroke-dashoffset:0}}
  @keyframes gc-flicker{
    0%{opacity:1}5%{opacity:0.1}10%{opacity:0.8}12%{opacity:0.2}
    14%{opacity:0.9}16%{opacity:0.3}20%{opacity:1}40%{opacity:1}
    42%{opacity:0.05}44%{opacity:0.7}46%{opacity:0.1}50%{opacity:1}
    100%{opacity:0}
  }
  @keyframes gc-blackout-pulse{
    0%,100%{border-color:#222}50%{border-color:rgba(192,57,43,0.3)}
  }
  @keyframes gc-sticky-pin{
    0%{opacity:0;transform:rotate(var(--rot,0deg)) scale(0.3) translateY(-20px)}
    60%{transform:rotate(var(--rot,0deg)) scale(1.05) translateY(2px)}
    100%{opacity:1;transform:rotate(var(--rot,0deg)) scale(1) translateY(0)}
  }
  @keyframes gc-evidence-glow{
    0%,100%{box-shadow:0 0 4px rgba(212,160,23,0.1)}
    50%{box-shadow:0 0 12px rgba(212,160,23,0.3),0 0 4px rgba(212,160,23,0.1)}
  }

  /* Blackout flicker overlay */
  .gc-blackout-entering{position:relative}
  .gc-blackout-entering::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
    background:#fff;animation:gc-flicker 0.8s ease-out forwards;pointer-events:none;z-index:10}
  .gc-blackout{animation:gc-blackout-pulse 3s ease-in-out infinite}

  /* Stamp container shake on reveal */
  .gc-guilty-shaking{animation:gc-slam-shake 0.4s ease-out}

  /* Sticky notes animate in */
  .gc-sticky{animation:gc-sticky-pin 0.4s cubic-bezier(0.16,1,0.3,1) both}
  .gc-sticky:nth-child(2){animation-delay:0.1s}
  .gc-sticky:nth-child(3){animation-delay:0.2s}
  .gc-sticky:nth-child(4){animation-delay:0.3s}

  /* Evidence items glow subtly */
  .gc-clue-pin{animation:gc-evidence-glow 4s ease-in-out infinite}


  @media(prefers-reduced-motion:reduce){
    .gc-shell,.gc-shell *{animation:none!important;transition:none!important}
    .gc-step-hidden{opacity:1;transform:none;max-height:none}
    .gc-blackout::after{display:none!important}
  }

  /* ═══ COVER ═══ */
  .gc-cover{text-align:center;padding:40px 20px;position:relative;z-index:1}
  .gc-cover::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle,rgba(212,160,23,0.06) 0%,transparent 70%);pointer-events:none}
  .gc-cover-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px}
  .gc-cover-suspect{position:relative}
  .gc-cover-suspect .gc-polaroid{cursor:default}

  /* ═══ PHASE BACKGROUNDS ═══ */
  .gc-phase-camp .gc-main{background:linear-gradient(180deg,rgba(45,24,16,0.3) 0%,transparent 50%)}
  .gc-phase-train .gc-main{background:linear-gradient(180deg,rgba(10,10,26,0.5) 0%,transparent 50%)}
  .gc-phase-trial .gc-main{background:linear-gradient(180deg,rgba(15,52,96,0.3) 0%,transparent 50%)}
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — EVIDENCE BOARD (persistent sidebar)
// ══════════════════════════════════════════════════════════════
function _buildBoard(ep, phase, revealIdx = -1) {
  const gc = ep.getAClue;
  if (!gc) return '';
  const active = Object.keys(gc.phase1.sampleCounts);

  const phaseLabels = { 1: 'DNA COLLECTION', 2: 'INVESTIGATION', 3: 'TRIAL', 4: 'VERDICT' };

  // Step layout: 0=setup, 1..N=traps, N+1=hunt round, N+2+=zero events + scoreboard
  const revealedTraps = phase === 1 ? Math.max(0, revealIdx) : gc.phase1.traps.length;
  const huntStepIdx = gc.phase1.traps.length + 1;
  const huntRevealed = phase > 1 || revealIdx >= huntStepIdx;
  const revealedSamples = {};
  active.forEach(n => { revealedSamples[n] = 0; });
  if (phase === 1) {
    gc.phase1.traps.slice(0, revealedTraps).forEach(t => {
      if (t.outcome === 'success') revealedSamples[t.trapper]++;
      if (t.outcome === 'backfire') revealedSamples[t.target]++;
    });
    if (huntRevealed) {
      gc.phase1.hunts.filter(h => h.success).forEach(h => { revealedSamples[h.hunter]++; });
    }
  } else {
    Object.assign(revealedSamples, gc.phase1.sampleCounts);
  }

  // Gate all sidebar data by reveal progress
  const hasRevealed = revealIdx >= 0;
  const phase2SearchRevealed = phase === 2 && revealIdx >= 3;
  const phase2BlackoutRevealed = phase === 2 && revealIdx >= 4;
  const phase3Started = phase === 3 && revealIdx >= 1;
  const phase4KillerRevealed = phase === 4 && revealIdx >= 2;

  // Suspect polaroids with pins
  const suspects = active.map((name, i) => {
    const rot = ((i * 7 + 3) % 11 - 5);
    const samples = revealedSamples[name] || 0;
    const isKiller = phase4KillerRevealed && name === gc.phase2.killer;
    const isFramed = (phase > 2 || phase2BlackoutRevealed) && gc.phase2.framesPlanted.some(f => f.target === name);
    const evidence = gc.phase2.playerEvidence[name]?.filter(e => e.isReal).length || 0;
    const pinColor = isKiller ? 'var(--pin-red)' : isFramed ? 'var(--pin-yellow)' : 'var(--pin-white)';
    const extraCls = isKiller ? 'gc-polaroid-guilty' : isFramed ? 'gc-polaroid-framed' : '';

    let statusBadge = '';
    if (isKiller) {
      statusBadge = `<div style="position:absolute;bottom:20px;left:0;right:0;text-align:center">
        <span style="font-family:'Courier Prime',monospace;font-size:8px;font-weight:700;color:#fff;background:var(--red-string);padding:1px 4px;letter-spacing:1px">GUILTY</span></div>`;
    } else if (isFramed) {
      statusBadge = `<div style="position:absolute;bottom:20px;left:0;right:0;text-align:center">
        <span style="font-family:'Courier Prime',monospace;font-size:7px;font-weight:700;color:#333;background:var(--pin-yellow);padding:1px 3px;letter-spacing:1px">SUSPECT</span></div>`;
    }

    let tallyHtml = '';
    if (phase >= 1 && samples > 0) {
      tallyHtml = `<div class="gc-tally" style="position:absolute;top:-2px;right:-2px">
        ${Array(Math.min(samples, 5)).fill('<div class="gc-tally-mark" style="width:2px;height:8px;background:var(--red-string)"></div>').join('')}
      </div>`;
    }

    return `<div class="gc-polaroid ${extraCls}" style="--rot:${rot}deg" data-name="${name}">
      <div class="gc-polaroid-pin" style="background:radial-gradient(circle at 40% 40%,${pinColor},${pinColor === 'var(--pin-white)' ? '#bdc3c7' : pinColor})"></div>
      <img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
      <div class="gc-polaroid-name">${name.split(' ').pop()}</div>
      ${statusBadge}${tallyHtml}
    </div>`;
  }).join('');

  // Red string connections between suspects — only show after traps start revealing
  let stringCards = '';
  if (phase >= 1 && revealedTraps > 0) {
    const revealedTrapList = phase === 1 ? gc.phase1.traps.slice(0, revealedTraps) : gc.phase1.traps;
    const connections = revealedTrapList.filter(t => t.outcome === 'success').slice(0, 6);
    if (connections.length) {
      stringCards = `<div class="gc-board-divider"></div>
        <div style="font-family:'Courier Prime',monospace;font-size:9px;color:var(--coffee);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;text-align:center">CONNECTIONS</div>`;
      stringCards += connections.map((c, ci) =>
        `<div class="gc-string-card" style="animation-delay:${ci * 0.15}s">
          <span class="gc-string-dot" style="background:var(--pin-red)"></span>
          <span class="gc-string-name">${c.trapper.split(' ').pop()}</span>
          <span class="gc-string-line-h"></span>
          <span class="gc-string-name">${c.target.split(' ').pop()}</span>
          <span class="gc-string-dot" style="background:var(--pin-red)"></span>
        </div>`
      ).join('');
    }
    if (phase > 2 || phase2BlackoutRevealed) {
      const framesToShow = phase > 2 ? gc.phase2.framesPlanted : gc.phase2.framesPlanted.filter((f, i) => {
        const blackoutStepIdx = 4 + i * 2;
        return revealIdx >= blackoutStepIdx;
      });
      stringCards += framesToShow.map((f, fi) =>
        `<div class="gc-string-card gc-string-card-yellow" style="animation-delay:${(connections.length + fi) * 0.15}s">
          <span class="gc-string-dot" style="background:var(--pin-yellow)"></span>
          <span class="gc-string-name" style="color:#b8860b">⚠️ ${f.target.split(' ').pop()}</span>
          <span class="gc-string-line-h" style="background:var(--gold-foil)"></span>
          <span class="gc-string-name" style="color:#b8860b">SUSPECT</span>
        </div>`
      ).join('');
    }
  }

  // Sticky notes — only appear after enough reveals in each phase
  let stickies = '';
  const allTrapsRevealed = huntRevealed;
  if (allTrapsRevealed) {
    const topCollector = Object.entries(revealedSamples).sort((a, b) => b[1] - a[1])[0];
    if (topCollector && topCollector[1] > 0) {
      stickies += `<div class="gc-sticky gc-sticky-yellow" style="--rot:-2deg">TOP: ${topCollector[0].split(' ').pop()}<br>${topCollector[1]} samples</div>`;
    }
  }
  if ((phase > 2 || phase2BlackoutRevealed) && gc.phase2.witnessLog.filter(w => w.round < 99).length) {
    const w = gc.phase2.witnessLog.filter(wl => wl.round < 99)[0];
    stickies += `<div class="gc-sticky gc-sticky-pink" style="--rot:3deg">👁️ ${w.witness.split(' ').pop()} saw something!</div>`;
  }
  if (phase > 2 || phase2SearchRevealed) {
    stickies += `<div class="gc-sticky gc-sticky-blue" style="--rot:-1deg">WEAPON:<br>${gc.phase2.weapon || '???'}</div>`;
  }
  if (phase > 3 || (phase === 3 && phase3Started)) {
    stickies += `<div class="gc-sticky gc-sticky-green" style="--rot:2deg">STRATEGY:<br>${gc.killerStrategy === 'confession' ? 'CONFESSION!' : gc.killerStrategy === 'deepCover' ? 'DEEP COVER' : 'PARTIAL'}</div>`;
  }

  // Evidence collected per player — only after search rounds revealed
  let evidenceList = '';
  if (phase > 2 || phase2SearchRevealed) {
    const withEvidence = Object.entries(gc.phase2.playerEvidence).filter(([, evs]) => evs.length > 0);
    if (withEvidence.length) {
      evidenceList = `<div class="gc-board-divider"></div>
        <div style="font-family:'Courier Prime',monospace;font-size:9px;color:var(--coffee);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;text-align:center">EVIDENCE LOG</div>`;
      evidenceList += withEvidence.map(([name, evs]) => {
        const real = evs.filter(e => e.isReal).length;
        const fake = evs.filter(e => !e.isReal).length;
        return `<div style="font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee);padding:1px 0">
          ${name.split(' ').pop()}: ${'🔍'.repeat(real)}${'🐟'.repeat(fake)}</div>`;
      }).join('');
    }
  }

  // Framed players — only after corresponding blackout revealed
  // Phase 2 steps: 0=train, 1=murder, 2=reactions, 3=search1, 4=blackout1, 5=search2, 6=blackout2...
  let frameInfo = '';
  if (phase > 2 || phase2BlackoutRevealed) {
    const framesToShow = phase > 2 ? gc.phase2.framesPlanted : gc.phase2.framesPlanted.filter((f, i) => {
      const blackoutStepIdx = 4 + i * 2;
      return revealIdx >= blackoutStepIdx;
    });
    frameInfo = framesToShow.map(f =>
      `<div class="gc-clue-pin" style="border-color:var(--gold-foil)"><div class="gc-clue-icon">⚠️</div>
        <div class="gc-clue-text" style="color:#b8860b">Suspicious evidence found near ${f.target.split(' ').pop()}...</div></div>`
    ).join('');
  }

  // Deduction results (phase 4)
  let deductionMini = '';
  if (phase === 4 && revealIdx >= 0) {
    const correctCounts = Object.entries(gc.phase3.deductionResults)
      .map(([name, dr]) => ({ name, correct: dr.totalCorrect }))
      .sort((a, b) => b.correct - a.correct);
    deductionMini = `<div class="gc-board-divider"></div>
      <div style="font-family:'Courier Prime',monospace;font-size:9px;color:var(--coffee);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;text-align:center">DEDUCTION SCORES</div>`;
    deductionMini += correctCounts.map(({ name, correct }) =>
      `<div style="font-family:'Special Elite',monospace;font-size:10px;color:var(--coffee);display:flex;justify-content:space-between">
        <span>${name.split(' ').pop()}</span><span>${correct}/4 ${'★'.repeat(correct)}${'☆'.repeat(4 - correct)}</span></div>`
    ).join('');
  }

  // Coffee ring decorations
  const coffeeRings = `
    <div class="gc-coffee-ring" style="width:45px;height:45px;bottom:20px;right:10px"></div>
    <div class="gc-coffee-ring" style="width:30px;height:30px;top:60px;right:20px;border-width:1px"></div>`;

  return `<div class="gc-board-col"><div class="gc-board" id="gc-live-board" data-phase="${phase}">
    ${coffeeRings}
    <div class="gc-board-title">🔍 EVIDENCE BOARD</div>
    <div class="gc-board-phase">PHASE: ${phaseLabels[phase] || '—'}</div>
    <div class="gc-suspect-grid">${suspects}</div>
    ${stringCards}
    ${stickies}
    ${frameInfo}
    ${evidenceList}
    ${deductionMini}
  </div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL WRAPPER (two-column with board)
// ══════════════════════════════════════════════════════════════
function _gcShell(content, ep, phase = '', boardPhase = 0) {
  const stateKey = boardPhase === 1 ? 'gc-collection' : boardPhase === 2 ? 'gc-train' : boardPhase === 3 ? 'gc-trial' : 'gc-verdict';
  const revIdx = (window._tvState?.[stateKey]?.idx ?? -1);
  const board = boardPhase > 0 ? _buildBoard(ep, boardPhase, revIdx) : '';
  const phaseCls = phase ? ` gc-phase-${phase}` : '';
  // Store ep ref for live board updates
  if (boardPhase > 0) {
    window._gcBoardEp = { getAClue: ep.getAClue };
    window._gcBoardPhase = boardPhase;
  }
  if (board) {
    return css() + `<div class="gc-shell${phaseCls}"><div class="gc-layout">${board}<div class="gc-main">${content}</div></div></div>`;
  }
  return css() + `<div class="gc-shell${phaseCls}"><div class="gc-main" style="max-height:none">${content}</div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildGetAClueTitleCard(ep) {
  const gc = ep.getAClue;
  if (!gc) return '';

  const allPlayers = Object.keys(gc.phase1.sampleCounts);
  const badges = allPlayers.map((name, i) => {
    const rot = ((i * 7 + 3) % 11 - 5);
    return `<div class="gc-cover-suspect"><div class="gc-polaroid" style="--rot:${rot}deg">
      <div class="gc-polaroid-pin" style="background:radial-gradient(circle at 40% 40%,var(--pin-white),#bdc3c7)"></div>
      <img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:44px;height:44px;object-fit:contain" onerror="this.style.display='none'">
      <div class="gc-polaroid-name">${name.split(' ').pop()}</div>
    </div></div>`;
  }).join('');

  return _gcShell(`
    <div class="gc-cover">
      <div class="gc-subtitle" style="margin-bottom:12px">TOTAL DRAMA ACTION PRESENTS</div>
      <div style="font-size:56px;margin:8px 0;filter:drop-shadow(0 0 12px rgba(212,160,23,0.3))">🔍</div>
      <div class="gc-title">GET A CLUE</div>
      <div class="gc-subtitle" style="margin-top:8px">A ${host().toUpperCase()} McLEAN MYSTERY</div>
      <div style="margin:20px auto;width:80%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-foil),transparent)"></div>
      <div style="font-family:'Special Elite',monospace;font-size:13px;color:rgba(245,230,200,0.5);letter-spacing:3px">
        DNA COLLECTION &middot; MURDER ON THE TRAIN &middot; THE TRIAL
      </div>
      <div style="margin-top:12px;font-family:'Special Elite',monospace;font-size:15px;color:rgba(245,230,200,0.7);max-width:500px;margin-left:auto;margin-right:auto">
        "Someone here just killed the host. And the murderer seems to be amongst them."
      </div>
      <div class="gc-cover-roster" style="margin-top:24px">${badges}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 1: DNA COLLECTION
// ══════════════════════════════════════════════════════════════
export function rpBuildGetAClueCollection(ep) {
  const gc = ep.getAClue;
  if (!gc) return '';
  const stateKey = 'gc-collection';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  const finder = pick(Object.keys(gc.phase1.sampleCounts));
  const finderPr = pronouns(finder);
  steps.push(`<div class="gc-folder">
    <div class="gc-folder-label">📁 CASE FILE — DNA COLLECTION</div>
    <div class="gc-folder-content">
      The castmates are eating Chef's "breakfast tacos" when ${finder} bites down on something hard. A flash drive. ${finderPr.Sub} spits it out. "${host()}, what the—"<br><br>
      ${host()} grins. "Oh good, someone found it! Plug that bad boy in." The video plays one message:<br>
      <em style="color:var(--red-string)">"Collect DNA samples from your fellow castmates. By any means necessary."</em>
    </div>
  </div>`);

  for (let i = 0; i < gc.phase1.traps.length; i++) {
    const trap = gc.phase1.traps[i];
    const icon = trap.outcome === 'success' ? '✅' : trap.outcome === 'dodge' ? '❌' : '🔄';
    const borderColor = trap.outcome === 'success' ? '#22c55e' : trap.outcome === 'dodge' ? 'var(--coffee)' : 'var(--red-string)';
    const bgColor = trap.outcome === 'success' ? 'rgba(34,197,94,0.08)' : trap.outcome === 'backfire' ? 'rgba(192,57,43,0.08)' : 'rgba(92,61,46,0.08)';

    steps.push(`<div class="gc-player-card" style="border-color:${borderColor};background:${bgColor}">
      ${portrait(trap.trapper, 36)}
      <div style="flex:1">
        <div class="gc-player-name">${icon} ${trap.trapper} → ${trap.target}</div>
        <div class="gc-player-detail">${trap.text}</div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <span class="gc-phase-badge" style="font-size:8px;padding:1px 6px;border-color:${borderColor};color:${borderColor}">${trap.method.toUpperCase()}</span>
          <span style="font-family:'Courier Prime',monospace;font-size:9px;color:rgba(245,230,200,0.4)">ATK ${trap.trapQuality} vs DEF ${trap.resistance}</span>
        </div>
      </div>
    </div>`);
  }

  // Hunt round results — each player actively stalks a target
  if (gc.phase1.hunts.length) {
    let huntHtml = `<div class="gc-folder-content" style="margin-bottom:8px;font-style:italic;opacity:0.8">
      Traps are set — now it's time to hunt. Each player stalks a target across camp, trying to grab a sample by force, stealth, or opportunity.
    </div>`;
    huntHtml += gc.phase1.hunts.map(h => {
      if (h.success) {
        return `<div class="gc-player-card" style="border-color:#22c55e;background:rgba(34,197,94,0.08)">
          ${portrait(h.hunter, 32)}
          <div style="flex:1">
            <div class="gc-player-name" style="color:var(--coffee)">🎯 ${h.hunter} → ${h.target}</div>
            <div class="gc-player-detail" style="color:rgba(92,61,46,0.8)">${h.text}</div>
          </div>
        </div>`;
      } else {
        return `<div class="gc-player-card" style="border-color:rgba(92,61,46,0.3);background:rgba(92,61,46,0.04)">
          ${portrait(h.hunter, 32)}
          <div style="flex:1">
            <div class="gc-player-name" style="color:var(--coffee)">❌ ${h.hunter} → ${h.target}</div>
            <div class="gc-player-detail" style="color:rgba(92,61,46,0.7)">${h.text}</div>
          </div>
        </div>`;
      }
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 ACTIVE HUNT ROUND</div>
      ${huntHtml}
    </div>`);
  }

  for (const evt of gc.phase1.events) {
    const evtConfig = {
      zero:       { icon: '🏆', label: 'ZERO SAMPLES', color: 'var(--red-string)', bg: 'rgba(192,57,43,0.1)', pin: 'var(--pin-red)' },
      mutual:     { icon: '🔄', label: 'MUTUAL HUNT', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', pin: '#a855f7' },
      comfort:    { icon: '💙', label: 'COMFORT', color: 'var(--evidence-blue)', bg: 'rgba(59,130,246,0.08)', pin: 'var(--evidence-blue)' },
      impressive: { icon: '⭐', label: 'TOP COLLECTOR', color: 'var(--gold-foil)', bg: 'rgba(212,160,23,0.08)', pin: 'var(--gold-foil)' },
      rivalry:    { icon: '⚔️', label: 'RIVALRY', color: '#f97316', bg: 'rgba(249,115,22,0.08)', pin: '#f97316' },
      showoff:    { icon: '🎤', label: 'SHOWOFF', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', pin: '#ec4899' },
      suspicion:  { icon: '🤨', label: 'SUSPICION', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', pin: '#6b7280' },
      alliance:   { icon: '🤝', label: 'PARTNERS', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', pin: '#22c55e' },
    }[evt.type];
    if (!evtConfig) continue;

    const evtPlayers = evt.players || (evt.player ? [evt.player] : []);
    const photosHtml = evtPlayers.map((name, i) => {
      const rot = i === 0 ? -3 : 3;
      return `<div class="gc-evidence-evt-photo" style="--rot:${rot}deg">
        <div class="gc-evidence-evt-pin" style="background:radial-gradient(circle at 40% 40%,${evtConfig.pin},${evtConfig.pin})"></div>
        <img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
        <div class="gc-evidence-evt-photo-name">${name.split(' ').pop()}</div>
      </div>`;
    }).join('');

    steps.push(`<div class="gc-evidence-evt">
      <div class="gc-evidence-evt-photos">${photosHtml}</div>
      <div class="gc-evidence-evt-body" style="background:${evtConfig.bg};border-left:3px solid ${evtConfig.color};color:var(--manila)">
        <div class="gc-evidence-evt-label" style="color:${evtConfig.color};border-color:${evtConfig.color}">${evtConfig.icon} ${evtConfig.label}</div>
        <div>${evt.text}</div>
      </div>
    </div>`);
  }

  const sorted = Object.entries(gc.phase1.sampleCounts).sort((a, b) => b[1] - a[1]);
  steps.push(`<div class="gc-legal">
    <div class="gc-legal-text" style="font-weight:700;margin-bottom:4px;font-size:14px">📋 DNA COLLECTION RESULTS</div>
    ${sorted.map(([name, count], idx) => {
      const bar = `<div style="display:inline-block;width:${count * 20}px;height:8px;background:${idx === 0 ? '#22c55e' : count === 0 ? 'var(--red-string)' : 'var(--evidence-blue)'};border-radius:4px;vertical-align:middle;margin-left:6px"></div>`;
      return `<div class="gc-legal-text">${idx + 1}. ${name}: <strong>${count}</strong> sample${count !== 1 ? 's' : ''} ${bar}</div>`;
    }).join('')}
  </div>`);

  const totalSteps = steps.length;
  let html = `<div class="gc-phase-title">🧬 Phase 1: DNA Collection</div>
    <div class="gc-phase-badge">TRAP & HUNT</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="gc-step-collection-${i}" class="${i > revIdx ? 'gc-step-hidden' : 'gc-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="gc-controls-collection" class="gc-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="gc-btn" onclick="getAClueRevealNext('gc-collection',${totalSteps})">🔍 Investigate</button>
    <button class="gc-btn gc-btn-gold" onclick="getAClueRevealAll('gc-collection',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="gc-done-collection" class="gc-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div class="gc-stamp" style="color:#22c55e;border-color:#22c55e">COLLECTION COMPLETE</div>
  </div>`;

  return _gcShell(html, ep, 'camp', 1);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 2: TRAIN INVESTIGATION
// ══════════════════════════════════════════════════════════════
export function rpBuildGetAClueTrain(ep) {
  const gc = ep.getAClue;
  if (!gc) return '';
  const stateKey = 'gc-train';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Train map
  const trainMap = gc.phase2.compartments.map((comp, i) => {
    const connector = i < gc.phase2.compartments.length - 1 ? '<div class="gc-train-connector"></div>' : '';
    return `<div class="gc-compartment">
      <div class="gc-compartment-icon">${comp.icon}</div>
      <div class="gc-compartment-label">${comp.name.replace(' Car', '').replace(' Deck', '')}</div>
    </div>${connector}`;
  }).join('');
  steps.push(`<div class="gc-train-map">${trainMap}</div>
    <div class="gc-narration">"All aboard!" ${host()} announces. The castmates enter the luxury train. Chef Hatchet brings food. Everything seems normal. <em>Too normal.</em></div>`);

  // Murder
  steps.push(`<div class="gc-blackout">
    <div class="gc-silhouette-row">${Object.keys(gc.phase1.sampleCounts).map(name => `<div class="gc-silhouette"><img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:24px;height:24px;object-fit:contain;border-radius:50%;filter:brightness(0.6) saturate(0) opacity(0.7)" onerror="this.outerHTML='👤'"></div>`).join('')}</div>
    <div class="gc-blackout-text">${gc.phase2.murderText}</div>
  </div>`);

  // Murder reactions
  if (gc.phase2.murderReactions?.length) {
    const reactHtml = gc.phase2.murderReactions.map(r => {
      const icon = r.type === 'panic' ? '😱' : r.type === 'calm' ? '😐' : r.type === 'leader' ? '🫡' : r.type === 'suspicious' ? '🤨' : '😶';
      return `<div class="gc-player-card" style="border-color:${r.type === 'panic' ? 'var(--red-string)' : r.type === 'leader' ? '#22c55e' : 'var(--coffee)'}">
        ${portrait(r.name, 32)}
        <div style="flex:1">
          <div class="gc-player-name">${icon} ${r.name}</div>
          <div class="gc-player-detail">${r.text}</div>
        </div>
      </div>`;
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 REACTIONS TO THE MURDER</div>
      <div class="gc-folder-content">${reactHtml}</div>
    </div>`);
  }

  // Search rounds + blackouts interleaved
  for (let r = 0; r < gc.phase2.searchRounds.length; r++) {
    const roundHtml = gc.phase2.searchRounds[r].map(sr => {
      if (sr.isKillerAbsent) {
        return `<div class="gc-player-card" style="border-color:var(--red-string);background:rgba(192,57,43,0.06)">
          ${portrait(sr.name, 32)}
          <div style="flex:1">
            <div class="gc-player-name" style="color:var(--coffee)">👻 ${sr.name}</div>
            <div class="gc-player-detail" style="color:rgba(92,61,46,0.75)">${sr.text}</div>
          </div>
        </div>`;
      }
      if (sr.isEvent) {
        return `<div class="gc-narration" style="border-color:var(--evidence-blue);background:rgba(59,130,246,0.08)">
          <span style="font-size:14px;margin-right:4px">💬</span> ${sr.text}</div>`;
      }
      const icon = sr.found ? (sr.isReal ? '🔍' : '🐟') : '❌';
      const bg = sr.found ? (sr.isReal ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)') : 'rgba(92,61,46,0.05)';
      return `<div class="gc-player-card" style="background:${bg}">
        ${portrait(sr.name, 32)}
        <div style="flex:1">
          <div class="gc-player-name">${icon} ${sr.name}</div>
          <div class="gc-player-detail">${sr.text}</div>
        </div>
      </div>`;
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 SEARCH ROUND ${r + 1}</div>
      <div class="gc-folder-content">${roundHtml}</div>
    </div>`);

    if (gc.phase2.blackouts[r]) {
      const boHtml = gc.phase2.blackouts[r].map(evt => {
        if (evt.type === 'showmance') {
          return `<div class="gc-blackout-flash">${evt.text}</div>`;
        }
        return `<div class="gc-blackout-text" style="margin:8px 0">${evt.text}</div>`;
      }).join('');
      steps.push(`<div class="gc-blackout">${boHtml}</div>`);
    }
  }

  // Witness credibility events
  const credibilityEvents = gc.phase2.witnessLog.filter(w => w.round === 99 && w.credibility);
  if (credibilityEvents.length) {
    const credHtml = credibilityEvents.map(w => {
      const icon = w.credibility === 'believed' ? '✅' : '❌';
      const color = w.credibility === 'believed' ? '#22c55e' : 'var(--red-string)';
      return `<div class="gc-player-card" style="border-color:${color}">
        ${portrait(w.witness, 32)}
        <div style="flex:1">
          <div class="gc-player-name">${icon} ${w.witness} → ${w.listener}</div>
          <div class="gc-player-detail">${w.witness} shared what ${pronouns(w.witness).sub} saw during the blackout. ${w.listener} ${w.credibility === 'believed' ? 'believed the testimony. Trust strengthened.' : 'doubted the story. "You sure about that?" Trust damaged.'}</div>
        </div>
      </div>`;
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 WITNESS TESTIMONY</div>
      <div class="gc-folder-content">${credHtml}</div>
    </div>`);
  }

  // Evidence summary
  const evidenceSummary = Object.entries(gc.phase2.playerEvidence)
    .filter(([, evs]) => evs.length > 0)
    .sort(([, a], [, b]) => b.filter(e => e.isReal).length - a.filter(e => e.isReal).length)
    .map(([name, evs]) => {
      const real = evs.filter(e => e.isReal).length;
      const fake = evs.filter(e => !e.isReal).length;
      return `<div class="gc-legal-text">${name}: ${'🔍'.repeat(real)}${fake ? ' ' + '🐟'.repeat(fake) : ''} <span style="opacity:0.5">(${real} real${fake ? `, ${fake} fake` : ''})</span></div>`;
    }).join('');
  steps.push(`<div class="gc-legal">
    <div class="gc-legal-text" style="font-weight:700;margin-bottom:4px;font-size:14px">📋 EVIDENCE COLLECTED</div>
    ${evidenceSummary || '<div class="gc-legal-text" style="color:var(--red-string)">No evidence collected! This case is going cold.</div>'}
  </div>`);

  const totalSteps = steps.length;
  let html = `<div class="gc-phase-title">🔪 Phase 2: Murder on the Train</div>
    <div class="gc-phase-badge">INVESTIGATION</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="gc-step-train-${i}" class="${i > revIdx ? 'gc-step-hidden' : 'gc-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="gc-controls-train" class="gc-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="gc-btn" onclick="getAClueRevealNext('gc-train',${totalSteps})">🔍 Investigate</button>
    <button class="gc-btn gc-btn-gold" onclick="getAClueRevealAll('gc-train',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="gc-done-train" class="gc-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div class="gc-stamp" style="color:var(--red-string);border-color:var(--red-string)">INVESTIGATION CLOSED</div>
  </div>`;

  return _gcShell(html, ep, 'train', 2);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 3: TRIAL ARC
// ══════════════════════════════════════════════════════════════
export function rpBuildGetAClueTrial(ep) {
  const gc = ep.getAClue;
  if (!gc) return '';
  const stateKey = 'gc-trial';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Trial opens
  steps.push(`<div class="gc-courtroom">
    <div class="gc-spotlight">
      <div class="gc-phase-title" style="color:var(--gold-foil);font-size:24px">⚖️ THE TRIAL</div>
      <div style="text-align:center;margin:8px auto;width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-foil),transparent)"></div>
      <div class="gc-typewriter" style="text-align:center">"Court is now in session," ${host()} announces, adjusting his judge's wig.<br>"Present your cases."</div>
    </div>
  </div>`);

  // Presentations
  for (const pres of gc.phase3.presentations) {
    const strengthPct = Math.min(100, parseFloat(pres.caseStrength) * 10);
    const barColor = strengthPct > 60 ? '#22c55e' : strengthPct > 30 ? 'var(--gold-foil)' : 'var(--red-string)';
    const catLabel = { strong: 'STRONG', medium: 'MODERATE', weak: 'WEAK', confession: 'CONFESSION!', deepCover: 'DEEP COVER', partialTruth: 'PARTIAL' }[pres.category] || pres.category.toUpperCase();
    const catColor = { strong: '#22c55e', medium: 'var(--gold-foil)', weak: 'var(--red-string)', confession: 'var(--red-string)', deepCover: '#7c3aed', partialTruth: 'var(--gold-foil)' }[pres.category] || 'var(--gold-foil)';
    const rot = ((Math.random() * 4 - 2)).toFixed(1);

    steps.push(`<div class="gc-case-file" style="border-left-color:${catColor}">
      <div style="display:flex;gap:10px;align-items:center">
        ${portrait(pres.name, 40)}
        <div style="flex:1">
          <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:15px;color:var(--coffee)">${pres.name}'s Case</div>
          <div style="font-family:'Special Elite',monospace;font-size:11px;color:var(--coffee);opacity:0.6">${pres.evidenceCount} piece${pres.evidenceCount !== 1 ? 's' : ''} of real evidence</div>
        </div>
        <div class="gc-stamp" style="font-size:9px;color:${catColor};border-color:${catColor};transform:rotate(${rot}deg)">${catLabel}</div>
      </div>
      <div class="gc-folder-content" style="margin-top:8px;font-size:13px">${pres.text}</div>
      <div class="gc-case-strength"><div class="gc-case-strength-fill" style="width:${strengthPct}%;background:${barColor}"></div></div>
    </div>`);
  }

  // Cross-examinations
  for (const cx of gc.phase3.crossExams) {
    const sustained = cx.winner === 'attacker';
    steps.push(`<div class="gc-courtroom" style="padding:12px">
      <div class="gc-cross-exam">
        <div class="gc-cross-side">
          ${portrait(cx.attacker, 40)}
          <div class="gc-player-name" style="font-size:13px;margin-top:4px">${cx.attacker}</div>
          <div style="font-family:'Courier Prime',monospace;font-size:9px;color:var(--gold-foil);letter-spacing:1px">PROSECUTION</div>
        </div>
        <div class="gc-cross-vs">VS</div>
        <div class="gc-cross-side">
          ${portrait(cx.defender, 40)}
          <div class="gc-player-name" style="font-size:13px;margin-top:4px">${cx.defender}</div>
          <div style="font-family:'Courier Prime',monospace;font-size:9px;color:var(--evidence-blue);letter-spacing:1px">DEFENSE</div>
        </div>
      </div>
      <div class="gc-narration" style="background:rgba(0,0,0,0.2);border-color:rgba(212,160,23,0.3)">${cx.text}</div>
      <div style="text-align:center">
        <div class="gc-objection ${sustained ? 'gc-objection-sustained' : 'gc-objection-overruled'}">${sustained ? 'SUSTAINED' : 'OVERRULED'}</div>
      </div>
    </div>`);
  }

  // Rebuttals
  if (gc.phase3.rebuttals.length) {
    const rebHtml = gc.phase3.rebuttals.map(reb => {
      const icon = reb.type === 'allianceSupport' ? '🤝' : reb.type === 'showmanceProtect' ? '❤️' : '🔄';
      return `<div class="gc-narration" style="border-color:${reb.type === 'flip' ? 'var(--red-string)' : 'var(--evidence-blue)'}">
        <span style="font-size:16px;margin-right:4px">${icon}</span> ${reb.text}</div>`;
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 REBUTTALS</div>
      <div class="gc-folder-content">${rebHtml}</div>
    </div>`);
  }

  const totalSteps = steps.length;
  let html = `<div class="gc-phase-title">⚖️ Phase 3: The Trial</div>
    <div class="gc-phase-badge">COURTROOM SHOWDOWN</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="gc-step-trial-${i}" class="${i > revIdx ? 'gc-step-hidden' : 'gc-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="gc-controls-trial" class="gc-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="gc-btn" onclick="getAClueRevealNext('gc-trial',${totalSteps})">⚖️ Next Testimony</button>
    <button class="gc-btn gc-btn-gold" onclick="getAClueRevealAll('gc-trial',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="gc-done-trial" class="gc-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div class="gc-stamp" style="color:var(--gold-foil);border-color:var(--gold-foil)">ALL RISE</div>
  </div>`;

  return _gcShell(html, ep, 'trial', 3);
}

// ══════════════════════════════════════════════════════════════
// VP — VERDICT & DEDUCTION
// ══════════════════════════════════════════════════════════════
export function rpBuildGetAClueVerdict(ep) {
  const gc = ep.getAClue;
  if (!gc) return '';
  const stateKey = 'gc-verdict';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Deduction cards
  const deductionHtml = Object.entries(gc.phase3.deductionResults).map(([name, dr]) => {
    const cards = DEDUCTION_QUESTIONS.map(q => {
      const answer = dr.answers[q.key];
      const cls = answer.correct ? 'gc-card-correct' : 'gc-card-wrong';
      return `<div class="gc-card ${cls}">
        <div class="gc-card-label">${q.label.split(' ')[0]}</div>
        <div class="gc-card-value">${answer.guess}</div>
      </div>`;
    }).join('');
    const starRating = '★'.repeat(dr.totalCorrect) + '☆'.repeat(4 - dr.totalCorrect);
    return `<div style="margin:12px 0">
      <div class="gc-player-card" style="border-color:${dr.totalCorrect === 4 ? 'var(--gold-foil)' : dr.totalCorrect >= 2 ? '#22c55e' : 'var(--red-string)'}">
        ${portrait(name, 36)}
        <div style="flex:1">
          <div class="gc-player-name">${name}</div>
          <div class="gc-player-detail">${starRating} ${dr.totalCorrect}/4 Correct — Score: ${dr.deductionScore}</div>
        </div>
        ${dr.totalCorrect === 4 ? '<div class="gc-stamp" style="font-size:8px;color:var(--gold-foil);border-color:var(--gold-foil);transform:rotate(-5deg)">PERFECT</div>' : ''}
      </div>
      <div class="gc-deduction-row">${cards}</div>
    </div>`;
  }).join('');
  steps.push(`<div class="gc-folder">
    <div class="gc-folder-label">📁 DEDUCTION RESULTS</div>
    <div class="gc-folder-content">${deductionHtml}</div>
  </div>`);

  // Courtroom vote
  const voteHtml = Object.entries(gc.phase3.voteCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const isWinner = name === gc.phase3.courtroomWinner;
      const bar = `<div style="display:inline-block;width:${count * 30}px;height:10px;background:${isWinner ? 'var(--gold-foil)' : 'rgba(245,230,200,0.3)'};border-radius:5px;vertical-align:middle;margin-left:8px"></div>`;
      return `<div class="gc-player-card" style="${isWinner ? 'border-color:var(--gold-foil);background:rgba(212,160,23,0.1);box-shadow:0 0 12px rgba(212,160,23,0.1)' : ''}">
        ${portrait(name, 36)}
        <div style="flex:1">
          <div class="gc-player-name">${name} ${isWinner ? '👑' : ''}</div>
          <div class="gc-player-detail">${count} vote${count !== 1 ? 's' : ''} ${bar}</div>
        </div>
      </div>`;
    }).join('');
  steps.push(`<div class="gc-courtroom">
    <div class="gc-spotlight">
      <div class="gc-phase-title" style="color:var(--gold-foil)">📊 The Courtroom Vote</div>
      ${voteHtml}
      <div style="text-align:center;margin-top:12px">
        <div class="gc-stamp" style="color:var(--gold-foil);border-color:var(--gold-foil)">MOST CONVINCING: ${gc.phase3.courtroomWinner}</div>
      </div>
    </div>
  </div>`);

  // Killer reveal
  const kn = gc.phase2.killer;
  const strategyLabel = gc.killerStrategy === 'confession' ? 'FULL CONFESSION' : gc.killerStrategy === 'deepCover' ? 'DEEP COVER' : 'PARTIAL TRUTH';
  steps.push(`<div class="gc-guilty">
    <div class="gc-guilty-frame">
      <div class="gc-guilty-photo">
        <img src="assets/avatars/${slug(kn)}.png" alt="${kn}" onerror="this.style.display='none'">
        <div class="gc-guilty-photo-name">${kn}</div>
      </div>
    </div>
    <div><div class="gc-guilty-stamp">GUILTY</div></div>
    <div style="margin-top:12px;font-family:'Special Elite',monospace;font-size:14px;color:rgba(245,230,200,0.6)">
      Strategy: <strong style="color:var(--manila)">${strategyLabel}</strong>
    </div>
    <div style="margin-top:4px;font-family:'Special Elite',monospace;font-size:13px;color:${gc.killerGotAway ? '#a855f7' : '#22c55e'}">
      ${gc.killerGotAway ? '🎭 Got away with it — fewer than half figured it out' : '🔍 Caught by the cast — justice served'}
    </div>
    ${gc.immunityWinner === kn ? '<div class="gc-untouchable">UNTOUCHABLE</div>' : ''}
  </div>`);

  // Aftermath — social fallout from the reveal
  if (gc.phase3.aftermath?.length) {
    const afterHtml = gc.phase3.aftermath.map(a => {
      const icon = a.type === 'betrayed-ally' ? '💔' : a.type === 'vindicated' ? '✊' : '😤';
      const border = a.type === 'vindicated' ? '#22c55e' : 'var(--red-string)';
      return `<div class="gc-player-card" style="border-color:${border}">
        ${portrait(a.player, 32)}
        <div style="flex:1">
          <div class="gc-player-name">${icon} ${a.player}</div>
          <div class="gc-player-detail">${a.text}</div>
        </div>
      </div>`;
    }).join('');
    steps.push(`<div class="gc-folder">
      <div class="gc-folder-label">📁 AFTERMATH</div>
      <div class="gc-folder-content">${afterHtml}</div>
    </div>`);
  }

  // Immunity
  let immunityHtml = `<div class="gc-courtroom" style="text-align:center">
    <div class="gc-phase-title" style="color:var(--gold-foil)">🏆 Immunity Awarded</div>
    <div class="gc-player-card" style="border-color:var(--gold-foil);display:inline-flex;padding:14px 24px;background:rgba(212,160,23,0.08)">
      ${portrait(gc.immunityWinner, 52)}
      <div style="margin-left:10px;text-align:left">
        <div class="gc-player-name" style="color:var(--gold-foil);font-size:16px">${gc.immunityWinner}</div>
        <div class="gc-player-detail">Courtroom Vote Winner</div>
      </div>
    </div>`;

  if (gc.secondImmune) {
    immunityHtml += `<div class="gc-lindsay">
      <div style="font-size:28px;margin-bottom:8px">🌟</div>
      <div style="font-size:18px;font-weight:700;color:var(--gold-foil)">THE LINDSAY MOMENT</div>
      <div style="margin:8px auto;width:40%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-foil),transparent)"></div>
      <div style="font-family:'Special Elite',monospace;font-size:15px;margin-top:8px">
        <strong>${gc.secondImmune}</strong> solved the ENTIRE mystery perfectly.<br>
        4/4 deduction. Flawless. While the courtroom winner missed at least one.
      </div>
      <div style="margin-top:12px;font-size:16px;font-weight:700;color:var(--gold-foil)">DUAL IMMUNITY EARNED</div>
    </div>`;
  }
  immunityHtml += `</div>`;
  steps.push(immunityHtml);

  const totalSteps = steps.length;
  let html = `<div class="gc-phase-title">🔎 The Verdict</div>
    <div class="gc-phase-badge">CASE CLOSED</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="gc-step-verdict-${i}" class="${i > revIdx ? 'gc-step-hidden' : 'gc-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="gc-controls-verdict" class="gc-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="gc-btn" onclick="getAClueRevealNext('gc-verdict',${totalSteps})">🔍 Reveal Verdict</button>
    <button class="gc-btn gc-btn-gold" onclick="getAClueRevealAll('gc-verdict',${totalSteps})">Reveal All</button>
  </div>`;
  html += `<div id="gc-done-verdict" class="gc-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div class="gc-stamp" style="color:var(--gold-foil);border-color:var(--gold-foil)">CASE CLOSED</div>
  </div>`;

  return _gcShell(html, ep, 'trial', 4);
}

// ══════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
export function getAClueRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('gc-', '');
  const el = document.getElementById(`gc-step-${suffix}-${state.idx}`);
  if (el) {
    el.classList.remove('gc-step-hidden');
    el.classList.add('gc-step-revealing');
    el.style.display = '';
    // Blackout flicker effect
    if (el.querySelector('.gc-blackout')) {
      el.querySelector('.gc-blackout').classList.add('gc-blackout-entering');
      setTimeout(() => el.querySelector('.gc-blackout')?.classList.remove('gc-blackout-entering'), 900);
    }
    // Guilty stamp screen shake
    if (el.querySelector('.gc-guilty-stamp')) {
      const shell = el.closest('.gc-shell');
      if (shell) { shell.classList.add('gc-guilty-shaking'); setTimeout(() => shell.classList.remove('gc-guilty-shaking'), 500); }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.classList.remove('gc-step-revealing'); el.classList.add('gc-step-visible'); }, 550);
  }
  // Live-update the evidence board
  _updateLiveBoard(state.idx);
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`gc-controls-${suffix}`);
    const done = document.getElementById(`gc-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) { done.style.display = ''; done.classList.add('gc-step-revealing'); setTimeout(() => done.classList.remove('gc-step-revealing'), 550); }
  }
}

function _updateLiveBoard(revIdx) {
  const boardCol = document.querySelector('.gc-board-col');
  if (!boardCol || !window._gcBoardEp) return;
  const boardEl = document.getElementById('gc-live-board');
  const phase = boardEl ? parseInt(boardEl.dataset.phase) || 1 : 1;
  const fullHtml = _buildBoard(window._gcBoardEp, phase, revIdx);
  // _buildBoard returns '<div class="gc-board-col"><div class="gc-board" ...>...</div></div>'
  // Extract inner content of gc-board-col
  const inner = fullHtml.replace(/^<div class="gc-board-col">/, '').replace(/<\/div>$/, '');
  boardCol.innerHTML = inner;
}

export function getAClueRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('gc-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`gc-step-${suffix}-${i}`);
    if (el) { el.classList.remove('gc-step-hidden'); el.classList.add('gc-step-visible'); el.style.display = ''; }
  }
  state.idx = totalSteps - 1;
  _updateLiveBoard(state.idx);
  const controls = document.getElementById(`gc-controls-${suffix}`);
  const done = document.getElementById(`gc-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
}

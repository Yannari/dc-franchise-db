// js/chal/tropical-takedown.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function host() { return seasonConfig?.hostName || 'Chris'; }

// ══════════════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

// ── Captain Nomination texts (archetype-driven) ──
const TXT_NOM_VOLUNTEER_AGGRESSIVE = [
  (n, pr) => `<strong>${n}</strong> doesn't wait for permission. "I'm captain. Anyone have a problem with that?" ${pr.Sub} scans the group with a look that dares someone to object.`,
  (n, pr) => `<strong>${n}</strong> steps into the center of the huddle before anyone speaks. "I know what I'm doing. You all know I know what I'm doing. So let's skip the debate."`,
  (n, pr) => `<strong>${n}</strong> plants ${pr.posAdj} feet and crosses ${pr.posAdj} arms. "I'll take captain. And before you ask — yes, I'm putting myself in charge of dive order. You're welcome."`,
  (n, pr) => `<strong>${n}</strong> raises a hand and cuts off the discussion. "Look, someone with actual strategic instincts needs to run this. That's me."`,
];
const TXT_NOM_VOLUNTEER_HEROIC = [
  (n, pr) => `<strong>${n}</strong> raises ${pr.posAdj} hand. "I'll do it. If this goes sideways, blame me — not the rest of you."`,
  (n, pr) => `<strong>${n}</strong> looks around the tribe. Nobody's stepping up. ${pr.Sub} takes a breath. "Alright. I've got this. Trust me."`,
  (n, pr) => `<strong>${n}</strong> volunteers with a firm nod. "Someone has to take the heat if we lose. Might as well be the person who actually wants to win."`,
  (n, pr) => `<strong>${n}</strong> steps forward quietly. "I'll captain. I know everyone's strengths. Let me put us in the best position."`,
];
const TXT_NOM_RELUCTANT = [
  (n, pr) => `<strong>${n}</strong> shrinks back when eyes land on ${pr.obj}. "Me? Captain? I don't... I mean... does someone ELSE want to—" The tribe stares. ${pr.Sub} swallows hard. "Okay. Fine."`,
  (n, pr) => `<strong>${n}</strong> gets nominated and looks physically ill. "Are you SURE? There are sharks down there. I'd have to send people into SHARK WATER." A long pause. "...Okay."`,
  (n, pr) => `<strong>${n}</strong> raises both hands defensively. "Don't look at me!" But nobody else moves. ${pr.Sub} sighs. "I hate all of you."`,
  (n, pr) => `"Why would I—" <strong>${n}</strong> starts, but the tribe is already nodding. ${pr.Sub} realizes ${pr.sub}'s been volunteered against ${pr.posAdj} will. "Great. Just great."`,
];
const TXT_NOM_SCHEMER = [
  (n, pr) => `<strong>${n}</strong> hangs back, watching the others argue. Then, almost casually: "I mean... if nobody COMPETENT wants to do it..." The implication lands. The tribe turns to ${pr.obj}.`,
  (n, pr) => `<strong>${n}</strong> doesn't volunteer immediately — ${pr.sub} lets two weaker players nominate themselves first, waits for doubt to creep in, then swoops. "Actually, maybe I should handle this."`,
  (n, pr) => `<strong>${n}</strong> leans in and whispers to the nearest ally. Within thirty seconds, three people are backing ${pr.posAdj} captain bid. ${pr.Sub} never even raised ${pr.posAdj} hand.`,
  (n, pr) => `<strong>${n}</strong> plays dumb. "Oh, you all want ME? Well... if you insist." The smirk says ${pr.sub} engineered every bit of this.`,
];
const TXT_NOM_DODGE = [
  (n, pr) => `<strong>${n}</strong> takes one look at the cliff and immediately backs away from the captain conversation. "Nope. Not me. Not a chance. I am NOT responsible for this."`,
  (n, pr) => `<strong>${n}</strong> stares at the ocean. "You want me to ASSIGN people to jump into that? With SHARKS? No. Absolutely not. Someone else."`,
  (n, pr) => `<strong>${n}</strong> shakes ${pr.posAdj} head frantically when nominated. "If someone gets hurt because of MY dive order, I'll never sleep again. Pass."`,
  (n, pr) => `<strong>${n}</strong> waves both hands. "I'll dive first, I'll dive last, I'll fight an eel — but I am NOT being the person who decides who fights the eels."`,
];

// ── Vote/Decision style texts ──
const TXT_VOTE_UNANIMOUS = [
  (cap, pr) => `It's unanimous. Every hand goes up for <strong>${cap}</strong>. No debate, no drama — just respect.`,
  (cap, pr) => `The tribe barely needs to discuss it. <strong>${cap}</strong> by a landslide. ${pr.Sub} cracks ${pr.posAdj} knuckles. "Let's get organized."`,
  (cap, pr) => `One by one, every member nods in <strong>${cap}</strong>'s direction. Not even a whisper of dissent. The tribe knows who they trust.`,
];
const TXT_VOTE_CONTESTED = [
  (cap, pr, rival, rPr) => `It comes down to <strong>${cap}</strong> vs. <strong>${rival}</strong>. The tribe splits. Arguments flare. Finally, a narrow majority sides with <strong>${cap}</strong>. <strong>${rival}</strong> goes quiet — too quiet.`,
  (cap, pr, rival, rPr) => `<strong>${cap}</strong> and <strong>${rival}</strong> both want the role. The tribe huddles. Whispered debates. Pointed looks. <strong>${cap}</strong> edges it out — but <strong>${rival}</strong>'s jaw tightens. This isn't settled.`,
  (cap, pr, rival, rPr) => `Hands go up for <strong>${cap}</strong>. Hands go up for <strong>${rival}</strong>. Someone changes their vote last second. <strong>${cap}</strong> wins by ONE. <strong>${rival}</strong> stares at the traitor.`,
  (cap, pr, rival, rPr) => `The tribe is split right down the middle between <strong>${cap}</strong> and <strong>${rival}</strong>. The tiebreaker? Someone mumbles "${cap} at least won't get us killed." <strong>${rival}</strong> looks wounded.`,
];
const TXT_VOTE_DEFAULT = [
  (cap, pr) => `Nobody else wants the job. <strong>${cap}</strong> takes captain by default — ${pr.sub}'s the only one who didn't visibly recoil at the word "responsibility."`,
  (cap, pr) => `Dead silence. Then <strong>${cap}</strong> sighs and steps forward. "I guess this is mine, then." The relief on everyone else's face is immediate and shameless.`,
  (cap, pr) => `Three people say "not it" simultaneously. <strong>${cap}</strong> was a beat too slow. Captain by process of elimination.`,
];
const TXT_VOTE_VOLUNTEERED = [
  (cap, pr) => `<strong>${cap}</strong> takes the role before anyone can blink. Done. Next question.`,
  (cap, pr) => `<strong>${cap}</strong> claimed it so fast the tribe didn't even get to vote. Some look relieved. Others look nervous.`,
];

// ── Reaction texts ──
const TXT_REACT_SUPPORT = [
  (n, pr, cap) => `<strong>${n}</strong> nods immediately. "Good choice. ${cap} knows what ${pronouns(cap).sub}'s doing. I'm backing this."`,
  (n, pr, cap) => `<strong>${n}</strong> claps <strong>${cap}</strong> on the shoulder. "You've got this. We trust you." The words carry real weight.`,
  (n, pr, cap) => `<strong>${n}</strong> is the first to speak up: "I'll follow ${cap}'s lead. ${pronouns(cap).Sub}'s earned it."`,
  (n, pr, cap) => `<strong>${n}</strong> gives a simple thumbs up. No theatrics — just genuine confidence in the pick.`,
];
const TXT_REACT_SKEPTIC = [
  (n, pr, cap) => `<strong>${n}</strong> says nothing, but ${pr.posAdj} raised eyebrow speaks volumes. ${pr.Sub}'s not convinced — not yet.`,
  (n, pr, cap) => `<strong>${n}</strong> folds ${pr.posAdj} arms. "Okay, <strong>${cap}</strong>. Prove us right." There's an unspoken "or else" hanging in the air.`,
  (n, pr, cap) => `<strong>${n}</strong> leans over to the nearest person. "If ${cap} puts me last, I'm throwing the challenge." Half-joking. Maybe.`,
  (n, pr, cap) => `<strong>${n}</strong> stares at <strong>${cap}</strong> for a long beat. "Don't mess this up. Seriously." ${pr.Sub} turns away before ${cap} can respond.`,
];
const TXT_REACT_BITTER = [
  (n, pr, cap) => `<strong>${n}</strong> wanted captain BAD. ${pr.Sub} turns away with a clenched jaw, refusing to make eye contact with <strong>${cap}</strong>. This grudge will simmer.`,
  (n, pr, cap) => `<strong>${n}</strong> doesn't even try to hide it. "Whatever. Just don't blame me when your 'strategy' falls apart, <strong>${cap}</strong>." ${pr.Sub} storms off to the edge of the huddle.`,
  (n, pr, cap) => `<strong>${n}</strong> was sure ${pr.sub} had the votes. Losing to <strong>${cap}</strong> stings. ${pr.Sub} forces a smile, but ${pr.posAdj} eyes are cold.`,
  (n, pr, cap) => `<strong>${n}</strong> lets out a single, sharp laugh. "Fine. <strong>${cap}</strong> can have it. But when we're at tribal? Remember who got passed over."`,
];
const TXT_REACT_NERVOUS = [
  (n, pr, cap) => `<strong>${n}</strong> looks between <strong>${cap}</strong> and the cliff. "So... ${cap}'s deciding who jumps into the shark water first? That's... that's fine. I'm fine."`,
  (n, pr, cap) => `<strong>${n}</strong> gulps visibly. "I just hope <strong>${cap}</strong> doesn't put me anywhere near those eels." ${pr.Sub} wrings ${pr.posAdj} hands.`,
  (n, pr, cap) => `<strong>${n}</strong> is already doing mental math on ${pr.posAdj} chances of not drowning. <strong>${cap}</strong>'s first decision as captain: how much to worry about <strong>${n}</strong>'s visible panic.`,
  (n, pr, cap) => `<strong>${n}</strong> raises a shaky hand. "Quick question — can the captain also decide who DOESN'T dive? Asking for... me."`,
];
const TXT_REACT_ALLIANCE_WHISPER = [
  (n, pr, cap, ally) => `<strong>${n}</strong> pulls <strong>${ally}</strong> aside. "Watch <strong>${cap}</strong> closely. If ${pronouns(cap).sub} puts our people in bad spots, we move on ${pronouns(cap).obj} after the challenge."`,
  (n, pr, cap, ally) => `<strong>${n}</strong> and <strong>${ally}</strong> exchange a look as <strong>${cap}</strong> takes charge. A barely perceptible nod passes between them. They have a plan.`,
];
const TXT_CAPTAIN_FIRST_MOVE = [
  (cap, pr, style) => `<strong>${cap}</strong> immediately starts barking orders. ${pr.Sub}'s already mapped out the dive sequence in ${pr.posAdj} head. The tribe has no time to second-guess — which is exactly the point.`,
  (cap, pr, style) => `<strong>${cap}</strong> gathers the tribe in a tight circle. "Okay, here's how this goes." ${pr.Sub} lays out the plan with the confidence of someone who's been waiting for this moment.`,
  (cap, pr, style) => `<strong>${cap}</strong> takes a shaky breath. "Right. Captain. That's me." ${pr.Sub} looks at the cliff, then back at the tribe. "Let's... not die?"`,
  (cap, pr, style) => `<strong>${cap}</strong> pulls out a stick and starts drawing in the sand. Dive order, chain targets, longboard pairs. The tribe watches, half-impressed, half-terrified by the thoroughness.`,
  (cap, pr, style) => `<strong>${cap}</strong> points at each member one by one. "You — first dive. You — chain hunter. You — longboard anchor." No debate. No questions. ${pr.Sub} runs this tribe now.`,
  (cap, pr, style) => `<strong>${cap}</strong> claps ${pr.posAdj} hands. "Alright people, here's the deal. I'm not gonna sugarcoat it — this challenge is insane. But we're MORE insane. Let's go."`,
];

const TXT_DIVE_ORDER_DEBATE = [
  (n, pr, pos) => `<strong>${n}</strong> demands to dive ${pos}. "I'm not waiting around while everyone else has all the fun."`,
  (n, pr, pos) => `<strong>${n}</strong> insists on going ${pos}. "I should be the one down there — I can handle the pressure."`,
  (n, pr, pos) => `<strong>${n}</strong> pushes back on the captain's order, wanting to dive ${pos}. The captain holds firm.`,
  (n, pr, pos) => `<strong>${n}</strong> argues for the ${pos} slot. "Put me where I can actually make a difference!"`,
  (n, pr, pos) => `<strong>${n}</strong> volunteers for the ${pos} dive. "Someone brave needs to go down there — might as well be me."`,
  (n, pr, pos) => `<strong>${n}</strong> quietly accepts the ${pos} slot without complaint, saving ${pr.posAdj} energy for the water.`,
];

const TXT_TAG_SMOOTH = [
  (prev, next, pr) => `<strong>${prev}</strong> slaps <strong>${next}</strong>'s hand clean — smooth tag, ${next} is already at the edge.`,
  (prev, next, pr) => `<strong>${prev}</strong> scrambles up the cliff and tags <strong>${next}</strong> without breaking stride. "${next}, GO!"`,
  (prev, next, pr) => `<strong>${prev}</strong> lunges for <strong>${next}</strong>'s hand the instant ${pr.sub} crests the cliff. Perfect relay — no time wasted.`,
  (prev, next, pr) => `<strong>${prev}</strong> high-fives <strong>${next}</strong> so hard it stings. "Your turn — make it count!"`,
];

const TXT_TAG_FUMBLE = [
  (prev, next, pr) => `<strong>${prev}</strong> staggers up the cliff, wheezing, and swipes at <strong>${next}</strong>'s hand — misses. Tries again. Finally connects. Precious seconds lost.`,
  (prev, next, pr) => `<strong>${prev}</strong> collapses at the top of the cliff. <strong>${next}</strong> has to drag ${pr.obj} close enough for a tag. The delay is painful.`,
  (prev, next, pr) => `<strong>${prev}</strong> trips on the rocks climbing back up — <strong>${next}</strong> reaches down to pull ${pr.obj} up. The fumbled tag costs the tribe.`,
  (prev, next, pr) => `<strong>${prev}</strong> overshoots the tag zone and runs past <strong>${next}</strong>. By the time they connect, rival divers are already underwater.`,
];

const TXT_TAG_LAUNCH = [
  (n, pr) => `<strong>${n}</strong> steps to the cliff edge. First diver up. No tag needed — just raw nerve.`,
  (n, pr) => `<strong>${n}</strong> cracks ${pr.posAdj} knuckles at the edge. "First in. Let's set the pace."`,
  (n, pr) => `<strong>${n}</strong> peers over the cliff at the churning water below. No one to tag — just the drop. ${pr.Sub} takes a breath.`,
  (n, pr) => `<strong>${n}</strong> leads off for the tribe. The cliff edge crumbles slightly under ${pr.posAdj} feet. No turning back.`,
];

const TXT_SURFACE_STEAL = [
  (thief, prT, victim) => `<strong>${thief}</strong> intercepts <strong>${victim}</strong> at the waterline — rips the chain from ${pronouns(victim).posAdj} exhausted grip. "Nothing personal."`,
  (thief, prT, victim) => `<strong>${thief}</strong> was lurking at the shore. The moment <strong>${victim}</strong> surfaces with gold, ${thief} pounces and tears it free.`,
  (thief, prT, victim) => `<strong>${thief}</strong> tackles <strong>${victim}</strong> in the shallows. The chain changes hands before ${victim} even realizes what happened.`,
  (thief, prT, victim) => `<strong>${thief}</strong> grabs <strong>${victim}</strong>'s arm as ${pronouns(victim).sub} crawls ashore and wrestles the chain away. Brutal, ugly, and legal.`,
];

const TXT_UNDERWATER_STEAL = [
  (thief, prT, victim) => `<strong>${thief}</strong> spots <strong>${victim}</strong> clutching a chain and surges forward — a violent underwater tug-of-war. ${thief} wrenches it free.`,
  (thief, prT, victim) => `<strong>${thief}</strong> rams into <strong>${victim}</strong> from behind, dislodging the chain from ${pronouns(victim).posAdj} grip. ${thief} grabs it and kicks away.`,
  (thief, prT, victim) => `<strong>${thief}</strong> and <strong>${victim}</strong> both reach for the same chain — but ${thief} is faster and meaner. One hard shove and the gold is ${prT.posAdj}.`,
];

const TXT_NOTHING_FOUND = [
  (n, pr) => `<strong>${n}</strong> surfaces empty-handed, gasping. Nothing but sand and shadows down there.`,
  (n, pr) => `<strong>${n}</strong> runs out of air before finding anything. ${pr.Sub} breaks the surface with a frustrated growl.`,
  (n, pr) => `<strong>${n}</strong> searches the murky depths but comes up with nothing. The lagoon keeps its secrets.`,
  (n, pr) => `<strong>${n}</strong> dives deep, stays long, and finds absolutely nothing. ${pr.Sub} surfaces deflated.`,
];

const TXT_STRONG_DIVE = [
  (n, pr) => `<strong>${n}</strong> cuts through the air like a blade — barely a splash on entry. Clean, fast, lethal.`,
  (n, pr) => `<strong>${n}</strong> launches off the cliff edge with perfect form. The entry is almost silent — ${pr.sub} knifes into the water at speed.`,
  (n, pr) => `<strong>${n}</strong> takes a running start and leaps — arms out, chin tucked, a textbook dive that draws gasps from the cliff.`,
  (n, pr) => `<strong>${n}</strong> dives without hesitation, ${pr.posAdj} body a perfect arrow. The ocean barely notices the entry.`,
  (n, pr) => `<strong>${n}</strong> springs off the edge and rotates gracefully — the entry is smooth, controlled, and fast.`,
  (n, pr) => `<strong>${n}</strong> sails through the air with surprising grace. Not a single wavering moment — just a clean plunge into the deep.`,
];

const TXT_WEAK_DIVE = [
  (n, pr) => `<strong>${n}</strong> hits the water at a bad angle — a spectacular bellyflop that echoes across the lagoon.`,
  (n, pr) => `<strong>${n}</strong> over-rotates and lands flat on ${pr.posAdj} back. The splash is enormous; the pain is worse.`,
  (n, pr) => `<strong>${n}</strong> slips on the edge and tumbles off sideways — it's not a dive so much as a fall with extra steps.`,
  (n, pr) => `<strong>${n}</strong> freezes at the edge for a beat too long, then topples in awkwardly. ${pr.Sub} surfaces coughing.`,
  (n, pr) => `<strong>${n}</strong> closes ${pr.posAdj} eyes and jumps — arms windmilling, legs flailing. The splash zone reaches the cliff.`,
  (n, pr) => `<strong>${n}</strong> launches off the cliff and immediately regrets every decision. The belly-flop sends water up like a geyser.`,
];

const TXT_CHAIN_FOUND = [
  (n, pr, tribe) => `<strong>${n}</strong> spots the glint of gold wedged between coral formations. ${pr.Sub} pries it free — heavy, real, golden. One chain secured for <strong>${tribe}</strong>.`,
  (n, pr, tribe) => `<strong>${n}</strong> digs through the silt and ${pr.posAdj} fingers close around something cold and heavy — a golden chain. ${pr.Sub} kicks toward the surface, triumphant.`,
  (n, pr, tribe) => `<strong>${n}</strong>'s eyes go wide underwater — the chain is RIGHT THERE. ${pr.Sub} snatches it before the current can carry it away. <strong>${tribe}</strong> scores.`,
  (n, pr, tribe) => `<strong>${n}</strong> nearly swims past it, but the chain's gleam catches ${pr.posAdj} eye at the last second. ${pr.Sub} surfaces with gold in ${pr.posAdj} grip.`,
  (n, pr, tribe) => `<strong>${n}</strong> spots the chain half-buried in sand at the lagoon floor. One hard tug and it's free. Gold for <strong>${tribe}</strong>.`,
  (n, pr, tribe) => `<strong>${n}</strong> follows a school of fish straight to the chain — like they were leading ${pr.obj} to it. ${pr.Sub} grabs it and shoots upward.`,
];

const TXT_DECOY_CHAIN = [
  (n, pr) => `<strong>${n}</strong> surfaces triumphantly — only for the "chain" to crumble into rusted flakes. "WHAT?!" ${pr.Sub} throws the remains into the ocean.`,
  (n, pr) => `<strong>${n}</strong> hauls up what looks like gold — it's painted tin. The disappointment on ${pr.posAdj} face is devastating.`,
  (n, pr) => `<strong>${n}</strong> breaks the surface with a grin that dies immediately. The chain is a cheap fake — corroded metal wrapped in foil.`,
  (n, pr) => `<strong>${n}</strong> waves the chain overhead proudly until it literally snaps in half. Decoy. ${pr.Sub}'s wasted thirty seconds of air.`,
  (n, pr) => `<strong>${n}</strong> holds up ${pr.posAdj} prize — and watches it dissolve in the sunlight. Not gold. Not even close. ${pr.Sub} screams in frustration.`,
  (n, pr) => `<strong>${n}</strong> knew something felt wrong when the chain was too light. Sure enough — spray-painted plastic. Back to the depths.`,
];

const TXT_SHARK_ENCOUNTER = [
  (n, pr) => `<strong>${n}</strong> freezes mid-stroke as a shadow glides past — a reef shark circles twice before losing interest. ${pr.Sub} kicks frantically toward the surface.`,
  (n, pr) => `A dark shape materializes from the murky water — <strong>${n}</strong>'s eyes go wide. The shark passes within arm's reach before veering away.`,
  (n, pr) => `<strong>${n}</strong> feels something brush ${pr.posAdj} leg. ${pr.Sub} looks down and sees teeth. The shark isn't attacking — but it's close enough to count.`,
  (n, pr) => `<strong>${n}</strong> spots the shark fin slicing through the water above. ${pr.Sub} hugs the reef and waits, heart hammering, until it passes.`,
  (n, pr) => `The shark appears from nowhere — <strong>${n}</strong> barely manages to tuck behind a rock formation. ${pr.Sub} watches it patrol past, then bolts.`,
  (n, pr) => `<strong>${n}</strong> and the shark lock eyes for one eternal second. Then ${pr.sub} breaks for the surface, legs pumping like pistons.`,
];

const TXT_EEL_SHOCK = [
  (n, pr) => `<strong>${n}</strong> reaches for what looks like a chain — face full of electric eel. ${pr.PosAdj} whole body jolts and ${pr.sub} shoots upward like a cork.`,
  (n, pr) => `An eel strikes from a crevice — <strong>${n}</strong> yelps underwater (a mistake) and scrambles away, fingers tingling with electricity.`,
  (n, pr) => `<strong>${n}</strong> disturbs an eel's hiding spot. ZAP. The shock sends ${pr.obj} spinning backward through the water column.`,
  (n, pr) => `<strong>${n}</strong>'s hand brushes something slippery. The eel's discharge makes ${pr.posAdj} arm go numb for a full ten seconds.`,
  (n, pr) => `The eel was coiled around the chain like a guard dog. <strong>${n}</strong> reaches in and gets zapped — ${pr.sub} surfaces with nothing but a tingling sensation.`,
  (n, pr) => `<strong>${n}</strong> didn't see the eel until it was too late. The purple flash of electricity lights up the deep, and ${pr.sub} rockets to the surface.`,
];

const TXT_COLLISION = [
  (a, b) => `<strong>${a}</strong> and <strong>${b}</strong> both dive for the same depth zone — they slam into each other mid-descent! Both lose precious seconds.`,
  (a, b) => `<strong>${a}</strong> and <strong>${b}</strong> reach for the same chain simultaneously — their hands collide. A brief underwater struggle before they both lose it.`,
  (a, b) => `<strong>${a}</strong>'s momentum carries ${pronouns(a).obj} straight into <strong>${b}</strong>. They tangle up, spin, and separate — both disoriented.`,
  (a, b) => `<strong>${a}</strong> doesn't see <strong>${b}</strong> coming from the left — WHAM. Bubbles everywhere. Both divers spiral before recovering.`,
];

const TXT_SHORE_STEAL = [
  (a, prA, b) => `<strong>${a}</strong> intercepts <strong>${b}</strong> on the beach — snatches the golden chain from ${pronouns(b).posAdj} exhausted hands. "Nothing personal."`,
  (a, prA, b) => `<strong>${a}</strong> tackles <strong>${b}</strong> at the waterline and rips the chain free. ${b} stares in disbelief as ${a} sprints to ${prA.posAdj} tribe's collection point.`,
  (a, prA, b) => `<strong>${a}</strong> grabs <strong>${b}</strong>'s arm as ${pronouns(b).sub} surfaces and wrestles the chain away. It's brutal, it's ugly, and it's legal.`,
  (a, prA, b) => `<strong>${a}</strong> waits at the shore like a predator. When <strong>${b}</strong> crawls out with a chain, ${a} pounces and yanks it free.`,
];

// Section-specific pass narration (indexed by section name)
const TRACK_SECTIONS = [
  { name: 'Launch Ramp', stat1: 'boldness', stat2: 'physical', penalty: 2, crashType: 'stumble' },
  { name: 'Snake Bend', stat1: 'intuition', stat2: 'physical', penalty: 3, crashType: 'rail-grind' },
  { name: 'Lava Gulch', stat1: 'physical', stat2: 'endurance', penalty: 4, crashType: 'rock-bounce' },
  { name: 'Death Drop', stat1: 'boldness', stat2: 'endurance', penalty: 6, crashType: 'wipeout' },
  { name: 'Pool Landing', stat1: 'intuition', stat2: 'boldness', penalty: 3, crashType: 'splashout' },
];

const TXT_SECTION_PASS = {
  'Launch Ramp': [
    (a, b) => `<strong>${a}</strong> shoves off hard, <strong>${b}</strong> tucked low — clean start.`,
    (a, b) => `Both riders launch with perfect timing — the board rockets off the starting block.`,
    (a, b) => `<strong>${a}</strong> pushes off and <strong>${b}</strong> immediately locks into position. Textbook launch.`,
    (a, b) => `<strong>${b}</strong> gives a guttural yell as they fly off the ramp. <strong>${a}</strong> grips on tight. Clean.`,
  ],
  'Snake Bend': [
    (a, b) => `The board wobbles through the S-curves but <strong>${b}</strong>'s weight shift saves it.`,
    (a, b) => `<strong>${a}</strong> reads the curves perfectly, leaning into each apex like a pro.`,
    (a, b) => `They thread the needle through both switchbacks without losing speed.`,
    (a, b) => `<strong>${a}</strong> calls out each turn before it comes. <strong>${b}</strong> shifts weight on command. Flawless.`,
  ],
  'Lava Gulch': [
    (a, b) => `They thread the volcanic rocks without flinching. Pure nerve.`,
    (a, b) => `<strong>${a}</strong> spots a boulder and swerves — the board clips the edge but holds together.`,
    (a, b) => `<strong>${b}</strong> braces for impact as the board rattles over the rock field. Both survive.`,
    (a, b) => `The volcanic gravel sprays behind them as they barrel through the danger zone. Untouched.`,
  ],
  'Death Drop': [
    (a, b) => `<strong>${a}</strong> screams the whole way down but holds the line. Both riders white-knuckle it.`,
    (a, b) => `The sheer drop makes <strong>${b}</strong> gasp — but the board stays true. They're through.`,
    (a, b) => `<strong>${a}</strong> squeezes ${pronouns(a).posAdj} eyes shut and commits to gravity. They survive the plunge.`,
    (a, b) => `The board goes nearly vertical. Both riders flatten against it. Somehow they make it.`,
  ],
  'Pool Landing': [
    (a, b) => `A clean finish — the board skims across the pool surface as both riders bail out.`,
    (a, b) => `<strong>${a}</strong> and <strong>${b}</strong> stick the landing perfectly. Water sprays everywhere.`,
    (a, b) => `They hit the water at full speed — <strong>${a}</strong> goes under, <strong>${b}</strong> tumbles — but the time is logged.`,
    (a, b) => `The board hydroplanes across the pool. Both riders cheer as they coast to the wall.`,
  ],
};

const TXT_SECTION_CRASH = {
  'Launch Ramp': [
    (a, b) => `<strong>${a}</strong> stumbles off the block — the board goes sideways immediately. Both riders tumble before the first turn.`,
    (a, b) => `The board catches an edge on the ramp lip. <strong>${b}</strong> faceplants and <strong>${a}</strong> goes over ${pronouns(a).obj}.`,
    (a, b) => `<strong>${a}</strong> pushes off crooked. The board fishtails, then flips. They barely made it 10 feet.`,
    (a, b) => `<strong>${b}</strong> slips on the starting block — drags <strong>${a}</strong> down with ${pronouns(b).obj}. A disastrous start.`,
  ],
  'Snake Bend': [
    (a, b) => `<strong>${a}</strong> overcorrects on the first switchback — the board grinds against the rail and both riders go flying.`,
    (a, b) => `The board clips the outer rail on the S-curve. <strong>${b}</strong> gets launched into a bush while <strong>${a}</strong> skids on gravel.`,
    (a, b) => `They take the first bend too wide and slam into the bamboo railing. The board cracks but they're already airborne.`,
    (a, b) => `<strong>${a}</strong> leans the wrong way. The board catches a rail and sends both riders cartwheeling through the bend.`,
  ],
  'Lava Gulch': [
    (a, b) => `The front wheel clips a volcanic rock — BOTH RIDERS TUMBLE. They slide the rest of the way on their stomachs.`,
    (a, b) => `A jagged lava rock catches the board's underside. It splinters and <strong>${a}</strong> and <strong>${b}</strong> each ride a piece down the hill.`,
    (a, b) => `<strong>${b}</strong> tries to dodge a boulder but jerks the board too hard — it flips and launches both riders into the rock field.`,
    (a, b) => `The board hits the damaged section of track at full speed. It SHATTERS. They slide on gravel until friction stops them.`,
  ],
  'Death Drop': [
    (a, b) => `The board goes airborne over the lip of the drop — <strong>${a}</strong> and <strong>${b}</strong> separate mid-air. Full wipeout.`,
    (a, b) => `<strong>${a}</strong> panics and stands up at the worst possible moment. The board flips and both riders ragdoll down the cliff face.`,
    (a, b) => `The sheer drop catches them off guard. The board nosedives and <strong>${b}</strong> goes OVER <strong>${a}</strong>'s head. Catastrophic.`,
    (a, b) => `<strong>${a}</strong> screams. <strong>${b}</strong> screams louder. The board snaps clean in half on the drop. They tumble the rest of the way separately.`,
  ],
  'Pool Landing': [
    (a, b) => `They hit the pool at a bad angle — the board submarines and launches <strong>${a}</strong> face-first into the water.`,
    (a, b) => `<strong>${b}</strong> tries to bail early but clips <strong>${a}</strong> — both riders faceplant into the shallow end.`,
    (a, b) => `The board catches the pool edge and catapults both riders. <strong>${a}</strong> belly-flops. <strong>${b}</strong> hits the wall.`,
    (a, b) => `<strong>${a}</strong> overcorrects at the last second. The board spins sideways and dumps both riders into the deep end.`,
  ],
};

const TXT_SECTION_COAST = [
  (a, b, section) => `They coast through, board wobbling. The crash took all their momentum.`,
  (a, b, section) => `<strong>${a}</strong> and <strong>${b}</strong> limp through on what's left of the board. Just trying to finish.`,
  (a, b, section) => `No speed left after the crash. They drag themselves through.`,
];

const TXT_SABOTAGE_TARGETED = [
  (n, pr, section, target) => `<strong>${n}</strong> loosens a rail support at <strong>${section}</strong> while pretending to stretch. ${pr.Sub} smirks toward <strong>${target}</strong>'s riders — "Good luck with that turn."`,
  (n, pr, section, target) => `<strong>${n}</strong> quietly smears mud across the track surface at <strong>${section}</strong>. ${pr.Sub} watches <strong>${target}</strong>'s next pair line up. "Oops."`,
  (n, pr, section, target) => `<strong>${n}</strong> punches a board loose at <strong>${section}</strong>, Alejandro-style. The gap is right where <strong>${target}</strong>'s riders will hit.`,
  (n, pr, section, target) => `<strong>${n}</strong> snaps a bamboo brace at <strong>${section}</strong> when no one's looking. The track sags ominously — right in <strong>${target}</strong>'s lane.`,
];

const TXT_SABOTAGE_RANDOM = [
  (n, pr, section) => `<strong>${n}</strong> kicks a loose rock onto the track at <strong>${section}</strong>. Cracks spider-web through the planking. ANY board could hit that.`,
  (n, pr, section) => `<strong>${n}</strong> stomps a support beam at <strong>${section}</strong> in frustration. The whole section shudders. That's going to affect everyone.`,
  (n, pr, section) => `<strong>${n}</strong> rips out a bamboo rail at <strong>${section}</strong> and hurls it aside. "THAT'S what I think of this stupid course!"`,
  (n, pr, section) => `<strong>${n}</strong> splashes water from the pool all over <strong>${section}</strong>. The track surface turns slick and treacherous for everyone.`,
];

function _pairCelebrate(a, b) {
  const archA = getArchetype(a), archB = getArchetype(b);
  const prA = pronouns(a), prB = pronouns(b);
  const pool = [];
  // Archetype-driven celebrations
  if (['hothead', 'challenge-beast'].includes(archA))
    pool.push(`<strong>${a}</strong> ROARS at the finish, slamming ${prA.posAdj} fists together. <strong>${b}</strong> barely gets out of the way of the chest bump.`);
  if (['hothead', 'challenge-beast'].includes(archB))
    pool.push(`<strong>${b}</strong> grabs <strong>${a}</strong> and shakes ${prA.obj} by the shoulders. "THAT'S how you ride a board!" ${prB.Sub}'s vibrating with adrenaline.`);
  if (['villain', 'mastermind', 'schemer'].includes(archA))
    pool.push(`<strong>${a}</strong> smirks at the rival tribe's crash and brushes dust off ${prA.posAdj} shoulder. "Was that supposed to be hard?"`);
  if (['villain', 'mastermind', 'schemer'].includes(archB))
    pool.push(`<strong>${b}</strong> gives a slow, deliberate clap toward the losing tribe. <strong>${a}</strong> can't help but laugh.`);
  if (['hero', 'loyal-soldier'].includes(archA))
    pool.push(`<strong>${a}</strong> pulls <strong>${b}</strong> into a hug at the finish. "I knew we could do it. That's teamwork." The tribe rallies behind them.`);
  if (['social-butterfly', 'showmancer'].includes(archA))
    pool.push(`<strong>${a}</strong> is already telling the story of their run to anyone who'll listen, arms waving wildly. <strong>${b}</strong> nods along proudly.`);
  if (['underdog', 'goat'].includes(archA))
    pool.push(`<strong>${a}</strong> can't believe it. ${prA.Sub} stares at the time, then at <strong>${b}</strong>, then back at the time. "We... actually did that?"`);
  if (['chaos-agent', 'wildcard'].includes(archA))
    pool.push(`<strong>${a}</strong> does a victory dance at the bottom of the hill that somehow involves a cartwheel. <strong>${b}</strong> watches in bewildered amusement.`);
  if (['floater', 'perceptive-player'].includes(archA))
    pool.push(`<strong>${a}</strong> gives a quiet nod of approval. <strong>${b}</strong> catches it and nods back. Nothing more needs saying.`);
  // Generic fallbacks
  pool.push(`<strong>${a}</strong> and <strong>${b}</strong> collapse at the finish, laughing. That was the run of their lives.`);
  pool.push(`<strong>${a}</strong> grabs <strong>${b}</strong> in a bear hug at the finish line. "WE DID IT!" Their tribe cheers from the sideline.`);
  return pick(pool);
}

function _pairBlame(a, b, crashSection) {
  const archA = getArchetype(a), archB = getArchetype(b);
  const prA = pronouns(a), prB = pronouns(b);
  const where = crashSection ? ` at ${crashSection}` : '';
  const pool = [];
  // Archetype-driven blame
  if (['hothead'].includes(archA))
    pool.push(`<strong>${a}</strong> EXPLODES${where}. "Are you KIDDING me?!" ${prA.Sub} kicks the broken board and rounds on <strong>${b}</strong>. "You had ONE job!"`);
  if (['hothead'].includes(archB))
    pool.push(`<strong>${b}</strong> shoves the wrecked board aside and gets in <strong>${a}</strong>'s face${where}. "Don't you DARE blame me for that!" The veins in ${prB.posAdj} neck are popping.`);
  if (['villain', 'mastermind', 'schemer'].includes(archA))
    pool.push(`<strong>${a}</strong> fixes <strong>${b}</strong> with a cold stare${where}. "I'll remember this." No yelling. No heat. Just ice.`);
  if (['villain', 'mastermind', 'schemer'].includes(archB))
    pool.push(`<strong>${b}</strong> doesn't say a word${where}. Just brushes off the gravel and walks away. <strong>${a}</strong> can feel the calculation happening behind those eyes.`);
  if (['hero', 'loyal-soldier'].includes(archA))
    pool.push(`<strong>${a}</strong> takes a breath${where}. "It's fine. We'll make it up." But ${prA.posAdj} jaw is clenched and the disappointment is written all over ${prA.posAdj} face.`);
  if (['underdog', 'goat'].includes(archA))
    pool.push(`<strong>${a}</strong> sits in the gravel${where}, head in ${prA.posAdj} hands. "I'm sorry... I'm so sorry." <strong>${b}</strong> doesn't even look at ${prA.obj}.`);
  if (['underdog', 'goat'].includes(archB))
    pool.push(`<strong>${b}</strong> apologizes profusely${where}, but <strong>${a}</strong> just walks away. <strong>${b}</strong> looks like ${prB.sub} might cry.`);
  if (['social-butterfly', 'showmancer'].includes(archA))
    pool.push(`<strong>${a}</strong> tries to laugh it off${where}: "Well THAT happened!" But the forced smile doesn't reach ${prA.posAdj} eyes. <strong>${b}</strong> isn't buying it either.`);
  if (['challenge-beast'].includes(archA))
    pool.push(`<strong>${a}</strong> slams a fist into the dirt${where}. "I don't LOSE like this." ${prA.Sub} stares at the course like ${prA.sub} wants to run it again right now.`);
  if (['chaos-agent', 'wildcard'].includes(archA))
    pool.push(`<strong>${a}</strong> bursts out laughing${where}. "Did you SEE how far we flew?!" <strong>${b}</strong> is NOT amused.`);
  if (['floater', 'perceptive-player'].includes(archA))
    pool.push(`<strong>${a}</strong> says nothing${where}. Just dusts off ${prA.posAdj} knees and looks at the time. ${prA.Sub} already knows exactly how much that crash cost them.`);
  // Generic fallbacks
  pool.push(`<strong>${a}</strong> glares at <strong>${b}</strong> after the crash${where}. The tension between them is suffocating.`);
  pool.push(`"That was YOUR fault," <strong>${a}</strong> snaps at <strong>${b}</strong>${where}. <strong>${b}</strong> fires back: "YOU picked the wrong line!"`);
  return pick(pool);
}

const TXT_SHOWMANCE_MOMENT = [
  (a, b) => `<strong>${a}</strong> surfaces gasping — <strong>${b}</strong> reaches across to steady ${pronouns(a).obj}. Their eyes lock for a beat too long.`,
  (a, b) => `<strong>${a}</strong> brushes wet hair from <strong>${b}</strong>'s face after a rough dive. For a moment, the competition fades away.`,
  (a, b) => `<strong>${b}</strong> wraps a towel around <strong>${a}</strong>'s shivering shoulders. Their fingers touch and neither pulls away.`,
  (a, b) => `<strong>${a}</strong> checks on <strong>${b}</strong> after the wipeout, holding ${pronouns(b).posAdj} hand a little longer than necessary.`,
];

const TXT_CAPTAIN_BLAME = [
  (n, pr, cap) => `<strong>${n}</strong> rounds on captain <strong>${cap}</strong> — "Your dive order cost us EVERYTHING! I should've gone first!"`,
  (n, pr, cap) => `<strong>${n}</strong> shakes ${pr.posAdj} head at <strong>${cap}</strong>'s pairings. "Real great leadership there, captain. Real great."`,
  (n, pr, cap) => `<strong>${n}</strong> gives captain <strong>${cap}</strong> a withering look. If they lose, everyone knows who to blame.`,
  (n, pr, cap) => `"Next time, maybe listen to the team before making decisions," <strong>${n}</strong> says to captain <strong>${cap}</strong>, not bothering to hide the venom.`,
];

const TXT_CROSS_TRIBE_TAUNT = [
  (a, b) => `<strong>${a}</strong> splashes water at <strong>${b}</strong> from across the dive lane. "You call THAT a dive?!"`,
  (a, b) => `<strong>${a}</strong> flexes at <strong>${b}</strong> from the cliff edge. "Watch how it's DONE!" ${pronouns(b).Sub} rolls ${pronouns(b).posAdj} eyes.`,
  (a, b) => `<strong>${a}</strong> laughs openly at <strong>${b}</strong>'s belly-flop. "That was BEAUTIFUL!" The sarcasm cuts deep.`,
  (a, b) => `"Better luck next time!" <strong>${a}</strong> yells at <strong>${b}</strong> from the beach. <strong>${b}</strong>'s jaw tightens.`,
];

const TXT_ENCOURAGEMENT = [
  (a, b) => `<strong>${a}</strong> cheers loudly for <strong>${b}</strong> from the cliff. "You GOT this! Show them what you're made of!"`,
  (a, b) => `<strong>${a}</strong> slaps <strong>${b}</strong> on the back before ${pronouns(b).posAdj} dive. "Don't think. Just jump. You'll be amazing."`,
  (a, b) => `<strong>${a}</strong> gives <strong>${b}</strong> an encouraging nod. "I believe in you. Go get that chain."`,
  (a, b) => `"Hey," <strong>${a}</strong> says quietly to <strong>${b}</strong>. "Ignore the sharks. Focus on the gold. You got this."`,
];

const TXT_CHATTER = [
  () => `${host()} leans into the camera: "Three tribes. One cliff. A whole lotta sharks. Let's get TROPICAL!"`,
  () => `${host()} grins from his observation deck. "The chains are glowing, the eels are charged, and the boards are waxed. This is gonna be GOOD."`,
  () => `"Dive deep or go home, people! Those chains aren't gonna grab themselves!" — ${host()}`,
  () => `${host()} checks his watch. "Tick tock, divers. The sharks didn't eat breakfast today."`,
  () => `"The track is literally falling apart and I love it. Reality television at its FINEST." — ${host()}`,
  () => `${host()}: "Somebody better grab a chain soon or I'm releasing the SECOND shark."`,
  () => `"This is the best pre-merge challenge we've ever designed. And by 'designed' I mean we found this cliff and said 'sure.'" — ${host()}`,
  () => `${host()}: "Ladies, gentlemen, and underwater creatures — welcome to the TAKEDOWN."`,
  () => `"Ohhh, underwater fender-bender! That's gonna leave a mark on someone's strategy." — ${host()}`,
  () => `${host()}: "The track's falling apart! Round 2 riders, you might want to hold onto something."`,
];

// ══════════════════════════════════════════════════════════════════════
// ARCHETYPE HELPERS
// ══════════════════════════════════════════════════════════════════════

const VILLAIN_TYPES = ['villain', 'mastermind', 'schemer'];
const NICE_TYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const NEUTRAL_TYPES = ['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater', 'perceptive-player'];

function getArchetype(name) {
  return players.find(p => p.name === name)?.archetype || 'floater';
}
function isVillain(name) { return VILLAIN_TYPES.includes(getArchetype(name)); }
function isNice(name) { return NICE_TYPES.includes(getArchetype(name)); }
function canScheme(name) {
  if (isVillain(name)) return true;
  if (isNice(name)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════

export function simulateTropicalTakedown(ep) {
  const tribes = gs.tribes.filter(t => t.members.length > 0);
  if (tribes.length < 2) return;

  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribes.forEach(t => t.members.forEach(n => { ep.chalMemberScores[n] = 0; }));

  const result = {
    tribes: [],
    phase1Winner: null,
    helmetTribe: null,
    raceRounds: [],
    socialEvents: [],
    finalRanking: [],
    losingTribe: null,
    winningTribe: null,
  };

  // Romance active players
  const allActive = tribes.reduce((acc, t) => acc.concat(t.members), []);
  const _romActive = allActive.filter(p => p !== gs.exileDuelPlayer);

  // ══════════════════════════════════════════════════════════════════
  // PHASE 0: CAPTAIN ELECTION
  // ══════════════════════════════════════════════════════════════════

  tribes.forEach((tribe, ti) => {
    const members = [...tribe.members];
    const campKey = tribe.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

    // Captain election
    const captainData = _electCaptain(members, tribe.name, ep);

    // Dive order: captain assigns
    const diveOrder = _assignDiveOrder(members, captainData.captain, tribe.name, ep);

    // Store tribe data
    result.tribes.push({
      tribeName: tribe.name,
      tribeMembers: members,
      captain: captainData,
      diveOrder: diveOrder.order,
      diveOrderDebates: diveOrder.debates,
      dives: [],
      chainHunt: { realChains: 0, decoyChains: 0, events: [] },
      raceRuns: [],
      totalRaceTime: 0,
      hasHelmet: false,
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // PHASE 1: CLIFF DIVE CHAIN HUNT (Merged tag-relay)
  // ══════════════════════════════════════════════════════════════════

  const CHAINS_NEEDED = 2;
  let helmetsAwarded = false;
  const maxDivers = Math.max(...result.tribes.map(t => t.diveOrder.length));

  for (let diveIdx = 0; diveIdx < maxDivers; diveIdx++) {
    const roundDivers = [];

    result.tribes.forEach(td => {
      if (diveIdx >= td.diveOrder.length) return;
      const diver = td.diveOrder[diveIdx];
      const s = pStats(diver);
      const pr = pronouns(diver);
      const isCaptain = diver === td.captain.captain;

      // ── Tag moment ──
      let tagEvent = null;
      if (diveIdx === 0) {
        tagEvent = { type: 'launch', diver, text: pick(TXT_TAG_LAUNCH)(diver, pr), fumbled: false };
      } else {
        const prevDiver = td.diveOrder[diveIdx - 1];
        const prevPr = pronouns(prevDiver);
        const tagRoll = pStats(prevDiver).physical * 0.05 + pStats(prevDiver).endurance * 0.04 + noise(2.5);
        const fumbled = tagRoll < 0.4;
        tagEvent = {
          type: fumbled ? 'fumble' : 'smooth',
          diver, prevDiver,
          text: fumbled ? pick(TXT_TAG_FUMBLE)(prevDiver, diver, prevPr) : pick(TXT_TAG_SMOOTH)(prevDiver, diver, prevPr),
          fumbled,
        };
        if (fumbled) {
          ep.chalMemberScores[prevDiver] -= 1;
        }
      }

      // ── Cliff dive ──
      const capBonus = isCaptain ? 0.15 : 0;
      const diveRoll = s.physical * 0.06 + s.boldness * 0.04 + capBonus + noise(2.5);
      const isStrong = diveRoll > 0.5;
      const diveScore = clamp(diveRoll * 8 + 5, 1, 10);

      if (isCaptain) {
        ep.chalMemberScores[diver] += isStrong ? 3 : -3;
        popDelta(diver, isStrong ? 2 : -2);
      } else {
        ep.chalMemberScores[diver] += isStrong ? 2 : -1;
        popDelta(diver, isStrong ? 1 : -1);
      }

      // ── Underwater: hazards + chain search ──
      const hazards = [];
      const hazardCount = 1 + (Math.random() < 0.35 ? 1 : 0);
      let panicked = false;

      for (let h = 0; h < hazardCount; h++) {
        const hazardType = Math.random() < 0.5 ? 'shark' : 'eel';
        let hazRoll;
        if (hazardType === 'shark') {
          hazRoll = s.boldness * 0.06 + s.physical * 0.04 + noise(2.5);
        } else {
          hazRoll = s.physical * 0.05 + s.endurance * 0.05 + noise(2.5);
        }
        const survived = hazRoll > 0.35;
        hazards.push({
          type: hazardType, survived,
          text: hazardType === 'shark' ? pick(TXT_SHARK_ENCOUNTER)(diver, pr) : pick(TXT_EEL_SHOCK)(diver, pr),
        });
        ep.chalMemberScores[diver] += survived ? 1 : -2;
        if (!survived) { popDelta(diver, -1); panicked = true; }
      }

      // Chain search — penalized by panic, boosted by clean dive
      let chainResult = null;
      const diveBonus = isStrong ? 0.1 : -0.1;
      const panicPenalty = panicked ? -0.15 : 0;
      const searchRoll = s.intuition * 0.06 + s.mental * 0.04 + diveBonus + panicPenalty + noise(2.5);
      const foundSomething = searchRoll > 0.3;

      if (foundSomething) {
        const decoyRoll = s.mental * 0.07 + s.intuition * 0.04 + noise(2.5);
        const isReal = decoyRoll > 0.35;
        if (isReal) {
          chainResult = { type: 'chain-found', text: pick(TXT_CHAIN_FOUND)(diver, pr, td.tribeName) };
          td.chainHunt.realChains++;
          ep.chalMemberScores[diver] += 4;
          popDelta(diver, 2);
        } else {
          chainResult = { type: 'decoy', text: pick(TXT_DECOY_CHAIN)(diver, pr) };
          td.chainHunt.decoyChains++;
          ep.chalMemberScores[diver] -= 1;
        }
      } else {
        chainResult = { type: 'nothing', text: pick(TXT_NOTHING_FOUND)(diver, pr) };
      }

      // Build the complete dive turn
      const diveTurn = {
        diver, tribe: td.tribeName, isCaptain,
        diveScore: Math.round(diveScore * 10) / 10,
        isStrong,
        diveText: isStrong ? pick(TXT_STRONG_DIVE)(diver, pr) : pick(TXT_WEAK_DIVE)(diver, pr),
        tagEvent, hazards, chainResult,
        surfaceSteal: null,
      };

      td.dives.push(diveTurn);
      roundDivers.push(diveTurn);

      // ── Surface steal check ──
      if (chainResult.type === 'chain-found' && Math.random() < 0.15) {
        const otherTribes = result.tribes.filter(ot => ot.tribeName !== td.tribeName);
        const stealCandidates = otherTribes.flatMap(ot => ot.tribeMembers.filter(n => {
          const arch = getArchetype(n);
          const sn = pStats(n);
          return isVillain(n) || (['hothead', 'challenge-beast', 'wildcard', 'chaos-agent'].includes(arch) && sn.strategic >= 6);
        }));
        if (stealCandidates.length > 0) {
          const stealer = pick(stealCandidates);
          const stealerS = pStats(stealer);
          const stealRoll = stealerS.physical * 0.05 + stealerS.social * 0.05 + noise(2.5);
          const defendRoll = s.physical * 0.05 + s.boldness * 0.05 + noise(2.5);
          if (stealRoll > defendRoll) {
            const stealPr = pronouns(stealer);
            const stealTribe = result.tribes.find(t => t.tribeMembers.includes(stealer));
            td.chainHunt.realChains--;
            stealTribe.chainHunt.realChains++;
            diveTurn.surfaceSteal = {
              stealer, victim: diver,
              stealerTribe: stealTribe.tribeName,
              text: pick(TXT_SURFACE_STEAL)(stealer, stealPr, diver),
            };
            ep.chalMemberScores[stealer] += 3;
            ep.chalMemberScores[diver] -= 2;
            addBond(stealer, diver, -1.5);
            popDelta(stealer, -1);
            popDelta(diver, 1);
            const campKey = td.tribeName;
            ep.campEvents[campKey].post.push({
              type: 'chain-stolen',
              text: `${stealer} stole a golden chain from ${diver} at the waterline`,
              players: [stealer, diver],
              badgeText: 'STOLEN', badgeClass: 'badge-negative',
            });
            // Check if steal gave STEALER's tribe helmets
            if (stealTribe.chainHunt.realChains >= CHAINS_NEEDED && !helmetsAwarded) {
              helmetsAwarded = true;
              result.phase1Winner = stealTribe.tribeName;
              result.helmetTribe = stealTribe.tribeName;
              stealTribe.hasHelmet = true;
              diveTurn.helmetsTriggered = stealTribe.tribeName;
            }
          }
        }
      }

      // Check if this tribe just hit the chain target
      if (td.chainHunt.realChains >= CHAINS_NEEDED && !helmetsAwarded) {
        helmetsAwarded = true;
        result.phase1Winner = td.tribeName;
        result.helmetTribe = td.tribeName;
        td.hasHelmet = true;
        diveTurn.helmetsTriggered = td.tribeName;
      }
    });

    // Underwater collision check (~20% when 2+ divers from different tribes)
    if (roundDivers.length >= 2 && Math.random() < 0.2) {
      const shuffled = [...roundDivers].sort(() => Math.random() - 0.5);
      const d1 = shuffled[0], d2 = shuffled[1];
      if (d1.tribe !== d2.tribe) {
        // If one diver found a chain, collision can steal it
        let collisionSteal = null;
        if (d1.chainResult.type === 'chain-found' && Math.random() < 0.3) {
          const td1 = result.tribes.find(t => t.tribeName === d1.tribe);
          const td2 = result.tribes.find(t => t.tribeName === d2.tribe);
          td1.chainHunt.realChains--;
          td2.chainHunt.realChains++;
          collisionSteal = { stealer: d2.diver, victim: d1.diver };
          ep.chalMemberScores[d2.diver] += 3;
          ep.chalMemberScores[d1.diver] -= 2;
          addBond(d1.diver, d2.diver, -1.0);
          result.socialEvents.push({
            type: 'underwater-steal', phase: 'dive', diveIdx,
            players: [d2.diver, d1.diver],
            text: pick(TXT_UNDERWATER_STEAL)(d2.diver, pronouns(d2.diver), d1.diver),
            stealer: d2.diver, victim: d1.diver,
          });
        } else if (d2.chainResult.type === 'chain-found' && Math.random() < 0.3) {
          const td1 = result.tribes.find(t => t.tribeName === d1.tribe);
          const td2 = result.tribes.find(t => t.tribeName === d2.tribe);
          td2.chainHunt.realChains--;
          td1.chainHunt.realChains++;
          collisionSteal = { stealer: d1.diver, victim: d2.diver };
          ep.chalMemberScores[d1.diver] += 3;
          ep.chalMemberScores[d2.diver] -= 2;
          addBond(d1.diver, d2.diver, -1.0);
          result.socialEvents.push({
            type: 'underwater-steal', phase: 'dive', diveIdx,
            players: [d1.diver, d2.diver],
            text: pick(TXT_UNDERWATER_STEAL)(d1.diver, pronouns(d1.diver), d2.diver),
            stealer: d1.diver, victim: d2.diver,
          });
        } else {
          result.socialEvents.push({
            type: 'collision', phase: 'dive', diveIdx,
            players: [d1.diver, d2.diver],
            text: pick(TXT_COLLISION)(d1.diver, d2.diver),
          });
          ep.chalMemberScores[d1.diver] -= 1;
          ep.chalMemberScores[d2.diver] -= 1;
          addBond(d1.diver, d2.diver, -0.5);
        }
      }
    }

    // Social events between dive rounds
    if (diveIdx < maxDivers - 1) {
      _generateDiveSocialEvents(result, diveIdx, ep);
    }
  }

  // If no tribe got 2 chains after all divers, whoever has the most wins helmets
  if (!helmetsAwarded) {
    const sorted = [...result.tribes].sort((a, b) => b.chainHunt.realChains - a.chainHunt.realChains);
    result.phase1Winner = sorted[0].tribeName;
    result.helmetTribe = sorted[0].tribeName;
    sorted[0].hasHelmet = true;
  }

  // Phase 1 MVP bonus
  const phase1Scores = {};
  result.tribes.forEach(td => {
    td.tribeMembers.forEach(n => {
      phase1Scores[n] = ep.chalMemberScores[n] || 0;
    });
  });
  const p1mvp = Object.entries(phase1Scores).sort(([,a],[,b]) => b - a)[0];
  if (p1mvp) {
    ep.chalMemberScores[p1mvp[0]] += 2;
    result.phase1MVP = p1mvp[0];
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 2: LONGBOARD/BOBSLED RACE
  // ══════════════════════════════════════════════════════════════════

  let trackCondition = 100;
  const traps = []; // persistent sabotage traps across rounds

  for (let round = 0; round < 3; round++) {
    const roundData = {
      round: round + 1,
      trackCondition,
      runs: [],
      socialEvents: [],
      trapsPlaced: [],
    };

    result.tribes.forEach(td => {
      const members = [...td.tribeMembers];
      const pair = _assignPair(members, td.captain.captain, round, td.tribeMembers.length);
      const rider1 = pair[0], rider2 = pair[1];

      const s1 = pStats(rider1), s2 = pStats(rider2);
      const bondVal = getBond(rider1, rider2);
      const chemistry = (bondVal + 5) / 10;

      // Per-section simulation
      let baseTime = 8 + noise(1.5); // base transit time
      let totalPenalty = 0;
      let crashed = false;
      let crashSection = null;
      let crashType = null;
      const sections = [];

      for (const sec of TRACK_SECTIONS) {
        if (crashed) {
          sections.push({ name: sec.name, passed: false, skipped: true, text: pick(TXT_SECTION_COAST)(rider1, rider2, sec.name) });
          totalPenalty += 1.5; // coasting penalty
          continue;
        }

        const stat1 = s1[sec.stat1] || 5, stat2 = s2[sec.stat2] || 5;
        const roll = (stat1 + stat2) * 0.05 + chemistry * 0.2 + noise(2.5);

        // Crash chance per section
        let secCrashChance = 0.06;
        if (trackCondition < 80) secCrashChance += 0.04;
        if (trackCondition < 60) secCrashChance += 0.04;
        if (td.hasHelmet) secCrashChance -= 0.03;

        // Check for traps at this section targeting this tribe
        const activeTraps = traps.filter(t => t.section === sec.name && (t.type === 'random' || t.targetTribe === td.tribeName));
        activeTraps.forEach(trap => {
          secCrashChance += trap.type === 'targeted' ? 0.25 : 0.15;
        });

        secCrashChance = clamp(secCrashChance, 0.02, 0.6);
        const sectionCrash = Math.random() < secCrashChance;

        if (sectionCrash) {
          crashed = true;
          crashSection = sec.name;
          crashType = sec.crashType;
          let penalty = sec.penalty;
          if (td.hasHelmet) penalty = Math.ceil(penalty * 0.5);
          totalPenalty += penalty;
          sections.push({
            name: sec.name, passed: false, skipped: false, crashed: true,
            crashType: sec.crashType, roll: Math.round(roll * 10) / 10,
            text: pick(TXT_SECTION_CRASH[sec.name])(rider1, rider2),
            hitTrap: activeTraps.length > 0 ? activeTraps[0] : null,
          });
          ep.chalMemberScores[rider1] -= Math.ceil(sec.penalty / 2);
          ep.chalMemberScores[rider2] -= Math.ceil(sec.penalty / 2);
        } else {
          const timeBonus = roll > 0.7 ? -0.3 : (roll > 0.4 ? 0 : 0.2);
          baseTime += timeBonus;
          sections.push({
            name: sec.name, passed: true, skipped: false, roll: Math.round(roll * 10) / 10,
            text: pick(TXT_SECTION_PASS[sec.name])(rider1, rider2),
          });
        }
      }

      const time = Math.round((baseTime + totalPenalty) * 10) / 10;

      if (crashed) {
        popDelta(rider1, -1);
        popDelta(rider2, -1);
      } else {
        ep.chalMemberScores[rider1] += 3;
        ep.chalMemberScores[rider2] += 3;
      }

      // Build structured section narration — each section is its own styled line
      const sectionHTML = sections.map(s => {
        const secCls = s.crashed ? 'tt-run-sec tt-run-sec-crash' : (s.skipped ? 'tt-run-sec tt-run-sec-skip' : 'tt-run-sec tt-run-sec-pass');
        return `<div class="${secCls}"><span class="tt-run-sec-name">${s.name}</span><span class="tt-run-sec-txt">${s.text}</span></div>`;
      }).join('');
      const finalLine = crashed
        ? `<div class="tt-run-final tt-run-final-crash">They coast the rest of the way. <strong>${time}s</strong></div>`
        : `<div class="tt-run-final tt-run-final-clean"><strong>${time}s</strong></div>`;

      const runData = {
        tribe: td.tribeName,
        rider1, rider2,
        chemistry: Math.round(chemistry * 100) / 100,
        time,
        crashed,
        crashSection,
        crashType,
        hasHelmet: td.hasHelmet,
        sections,
        text: sectionHTML + finalLine,
      };

      td.raceRuns.push(runData);
      td.totalRaceTime += time;
      roundData.runs.push(runData);

      // Pair reaction social event — archetype-driven
      if (crashed) {
        if (Math.random() < 0.6) {
          roundData.socialEvents.push({
            type: 'blame', players: [rider1, rider2],
            text: _pairBlame(rider1, rider2, crashSection),
          });
          addBond(rider1, rider2, -0.5);
        }
      } else if (time < 10) {
        roundData.socialEvents.push({
          type: 'celebrate', players: [rider1, rider2],
          text: _pairCelebrate(rider1, rider2),
        });
        addBond(rider1, rider2, 0.5);
      }
    });

    // Sabotage — only between rounds (not after final round)
    if (round < 2) {
      const sabotageSections = TRACK_SECTIONS.filter(s => s.name !== 'Pool Landing');
      result.tribes.forEach(td => {
        td.tribeMembers.forEach(n => {
          if (!canScheme(n)) return;
          if (Math.random() > 0.3) return;

          const pr = pronouns(n);
          const arch = getArchetype(n);
          const isChaos = ['chaos-agent', 'hothead'].includes(arch);
          const section = pick(sabotageSections).name;

          if (isChaos) {
            const trap = { section, placedBy: n, type: 'random', round: round + 1, tribe: td.tribeName };
            traps.push(trap);
            roundData.trapsPlaced.push(trap);
            roundData.socialEvents.push({
              type: 'sabotage', player: n, tribe: td.tribeName,
              sabotageType: 'random', section,
              text: pick(TXT_SABOTAGE_RANDOM)(n, pr, section),
            });
          } else {
            const rivals = result.tribes.filter(t => t.tribeName !== td.tribeName);
            const targetTribe = pick(rivals);
            if (targetTribe) {
              const trap = { section, placedBy: n, type: 'targeted', targetTribe: targetTribe.tribeName, round: round + 1, tribe: td.tribeName };
              traps.push(trap);
              roundData.trapsPlaced.push(trap);
              roundData.socialEvents.push({
                type: 'sabotage', player: n, tribe: td.tribeName,
                sabotageType: 'targeted', section, targetTribe: targetTribe.tribeName,
                text: pick(TXT_SABOTAGE_TARGETED)(n, pr, section, targetTribe.tribeName),
              });
            }
          }

          ep.chalMemberScores[n] -= 1;
          popDelta(n, -2);
          const campKey = td.tribeName;
          ep.campEvents[campKey].post.push({
            type: 'sabotage',
            text: `${n} sabotaged the longboard track at ${section} during the race`,
            players: [n], badgeText: 'SABOTAGE', badgeClass: 'badge-negative',
          });
        });
      });
    }

    // Track degradation
    trackCondition -= (5 + Math.random() * 5);
    trackCondition = Math.max(40, trackCondition);

    // Cross-tribe taunts between rounds
    if (round < 2 && Math.random() < 0.4) {
      const t1 = pick(result.tribes);
      const t2 = pick(result.tribes.filter(t => t.tribeName !== t1.tribeName));
      if (t1 && t2) {
        const taunter = pick(t1.tribeMembers);
        const target = pick(t2.tribeMembers);
        roundData.socialEvents.push({
          type: 'taunt', players: [taunter, target],
          text: pick(TXT_CROSS_TRIBE_TAUNT)(taunter, target),
        });
        addBond(taunter, target, -0.3);
        popDelta(taunter, -1);
      }
    }

    result.raceRounds.push(roundData);
  }

  result.traps = traps;

  // ══════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════

  // Winner = lowest aggregate race time
  const tribeRanking = [...result.tribes]
    .sort((a, b) => a.totalRaceTime - b.totalRaceTime);
  result.finalRanking = tribeRanking.map(t => t.tribeName);
  result.winningTribe = result.finalRanking[0];
  result.losingTribe = result.finalRanking[result.finalRanking.length - 1];

  // Romance hooks
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'tropical takedown');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'tropical takedown', _romActive);

  // ── FINALIZE ──
  const winnerTribe = gs.tribes.find(t => t.name === result.winningTribe);
  const loserTribe = gs.tribes.find(t => t.name === result.losingTribe);

  // ── Captain consequences based on tribe result ──
  result.tribes.forEach((td, ti) => {
    const cap = td.captain.captain;
    const capPr = pronouns(cap);
    const rank = result.finalRanking.indexOf(td.tribeName);
    const campKey = td.tribeName;
    if (rank === 0) {
      // Winning captain — hero moment
      popDelta(cap, 2);
      td.tribeMembers.filter(n => n !== cap).forEach(n => addBond(n, cap, 0.3));
      ep.campEvents[campKey].post.push({
        type: 'captain-vindicated',
        text: `${cap}'s leadership paid off — ${capPr.posAdj} tribe won Tropical Takedown. Teammates rally around their captain.`,
        players: [cap], badgeText: 'VINDICATED', badgeClass: 'badge-positive',
      });
      ep.chalMemberScores[cap] += 3;
    } else if (rank === result.finalRanking.length - 1) {
      // Losing captain — blamed
      popDelta(cap, -2);
      td.tribeMembers.filter(n => n !== cap).forEach(n => {
        const arch = getArchetype(n);
        const bond = getBond(n, cap);
        if (['hothead', 'villain', 'mastermind', 'schemer'].includes(arch) || bond < 0) {
          addBond(n, cap, -0.5);
        } else {
          addBond(n, cap, -0.2);
        }
      });
      ep.campEvents[campKey].post.push({
        type: 'captain-blamed',
        text: `${cap}'s tribe came in last. The tribe blames ${capPr.posAdj} dive order and leadership. ${cap} can feel the daggers.`,
        players: [cap], badgeText: 'BLAMED', badgeClass: 'badge-negative',
      });
      ep.chalMemberScores[cap] -= 2;
    }
  });

  ep.tropicalTakedown = result;
  ep.isTropicalTakedown = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Tropical Takedown';
  ep.challengeCategory = 'physical';
  ep.challengeDesc = 'Two-phase challenge: cliff dive chain hunt, then longboard race down a volcanic slope.';
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];
  ep.winner = winnerTribe;
  ep.loser = loserTribe;

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([,a], [,b]) => b - a)
    .map(([n]) => n);

  // Guarantee top scorer is #1
  const topScorer = ep.chalPlacements[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([,s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }

  // Phase 2 MVP
  const raceMvps = result.tribes
    .flatMap(td => td.raceRuns.map(r => ({ player: r.rider1, time: r.time })))
    .sort((a, b) => a.time - b.time);
  result.phase2MVP = raceMvps[0]?.player || topScorer;

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════════════
// SIMULATION HELPERS
// ══════════════════════════════════════════════════════════════════════

function _electCaptain(members, tribeName, ep) {
  const candidates = members.map(n => {
    const s = pStats(n);
    const arch = getArchetype(n);
    let archBias = 0;
    if (arch === 'mastermind' || arch === 'schemer') archBias = 0.3;
    if (arch === 'hero' || arch === 'challenge-beast') archBias = 0.2;
    if (arch === 'social-butterfly') archBias = 0.15;
    if (arch === 'goat' || arch === 'floater') archBias = -0.2;
    const score = s.social * 0.05 + s.strategic * 0.04 + archBias + noise(2.5);
    return { name: n, score, arch };
  }).sort((a, b) => b.score - a.score);

  const captain = candidates[0].name;
  const capArch = candidates[0].arch;
  const pr = pronouns(captain);
  const runnerUp = candidates.length > 1 ? candidates[1].name : null;
  const runnerUpArch = runnerUp ? candidates[1].arch : null;

  // ── Beat 1: Nominations ──
  const nominations = [];
  const dodgers = [];
  candidates.forEach((c, idx) => {
    const n = c.name;
    const nPr = pronouns(n);
    const arch = c.arch;
    if (idx === 0) {
      // Winner's nomination style
      if (['villain', 'mastermind', 'schemer'].includes(arch)) {
        nominations.push({ player: n, style: 'aggressive', text: pick(TXT_NOM_VOLUNTEER_AGGRESSIVE)(n, nPr) });
      } else if (['hero', 'challenge-beast'].includes(arch)) {
        nominations.push({ player: n, style: 'heroic', text: pick(TXT_NOM_VOLUNTEER_HEROIC)(n, nPr) });
      } else if (['goat', 'floater', 'underdog'].includes(arch)) {
        nominations.push({ player: n, style: 'reluctant', text: pick(TXT_NOM_RELUCTANT)(n, nPr) });
      } else {
        nominations.push({ player: n, style: 'heroic', text: pick(TXT_NOM_VOLUNTEER_HEROIC)(n, nPr) });
      }
    } else if (idx === 1 && c.score > candidates[0].score - 1.5) {
      // Close runner-up also stepped up
      if (['villain', 'mastermind', 'schemer'].includes(arch)) {
        nominations.push({ player: n, style: 'schemer', text: pick(TXT_NOM_SCHEMER)(n, nPr) });
      } else if (['hothead', 'challenge-beast', 'hero'].includes(arch)) {
        nominations.push({ player: n, style: 'aggressive', text: pick(TXT_NOM_VOLUNTEER_AGGRESSIVE)(n, nPr) });
      }
    } else if (Math.random() < 0.3 && ['goat', 'floater', 'underdog', 'showmancer'].includes(arch)) {
      dodgers.push({ player: n, text: pick(TXT_NOM_DODGE)(n, nPr) });
    }
  });

  // ── Beat 2: Vote/Decision ──
  const isContested = nominations.length >= 2;
  const gap = candidates.length > 1 ? candidates[0].score - candidates[1].score : 99;
  let voteStyle, voteText;
  if (isContested) {
    voteStyle = 'contested';
    const rPr = pronouns(runnerUp);
    voteText = pick(TXT_VOTE_CONTESTED)(captain, pr, runnerUp, rPr);
  } else if (gap > 3) {
    voteStyle = 'unanimous';
    voteText = pick(TXT_VOTE_UNANIMOUS)(captain, pr);
  } else if (['villain', 'mastermind', 'schemer', 'challenge-beast', 'hero'].includes(capArch)) {
    voteStyle = 'volunteered';
    voteText = pick(TXT_VOTE_VOLUNTEERED)(captain, pr);
  } else {
    voteStyle = 'default';
    voteText = pick(TXT_VOTE_DEFAULT)(captain, pr);
  }

  // ── Beat 3: Reactions ──
  const reactions = [];
  const otherMembers = members.filter(n => n !== captain);
  otherMembers.forEach(n => {
    const nPr = pronouns(n);
    const arch = getArchetype(n);
    const bond = getBond(n, captain);

    if (n === runnerUp && isContested) {
      // Bitter loser
      reactions.push({ player: n, type: 'bitter', text: pick(TXT_REACT_BITTER)(n, nPr, captain) });
      addBond(n, captain, -0.5);
      popDelta(n, -1);
    } else if (bond >= 3 || ['loyal-soldier'].includes(arch)) {
      // Supporter — high bond or loyal archetype
      if (Math.random() < 0.6) {
        reactions.push({ player: n, type: 'support', text: pick(TXT_REACT_SUPPORT)(n, nPr, captain) });
        addBond(n, captain, 0.2);
      }
    } else if (['hothead', 'mastermind', 'schemer', 'villain'].includes(arch) && bond < 1) {
      // Skeptic — scheming/aggressive archetype with low bond
      if (Math.random() < 0.5) {
        reactions.push({ player: n, type: 'skeptic', text: pick(TXT_REACT_SKEPTIC)(n, nPr, captain) });
        addBond(n, captain, -0.15);
      }
    } else if (['goat', 'underdog', 'floater'].includes(arch)) {
      // Nervous — weak archetypes worried about dive order
      if (Math.random() < 0.4) {
        reactions.push({ player: n, type: 'nervous', text: pick(TXT_REACT_NERVOUS)(n, nPr, captain) });
      }
    } else if (Math.random() < 0.2) {
      // Random skeptic or support
      if (bond >= 0) {
        reactions.push({ player: n, type: 'support', text: pick(TXT_REACT_SUPPORT)(n, nPr, captain) });
        addBond(n, captain, 0.1);
      } else {
        reactions.push({ player: n, type: 'skeptic', text: pick(TXT_REACT_SKEPTIC)(n, nPr, captain) });
        addBond(n, captain, -0.1);
      }
    }
  });

  // Alliance whisper — if two schemers/masterminds exist and neither is captain
  const schemers = otherMembers.filter(n => ['mastermind', 'schemer', 'villain'].includes(getArchetype(n)));
  if (schemers.length >= 2 && Math.random() < 0.4) {
    const s1 = schemers[0], s2 = schemers[1];
    reactions.push({
      player: s1, type: 'alliance-whisper',
      text: pick(TXT_REACT_ALLIANCE_WHISPER)(s1, pronouns(s1), captain, s2),
    });
    addBond(s1, s2, 0.3);
    addBond(s1, captain, -0.2);
  }

  // ── Beat 4: Captain's first move ──
  const firstMoveText = pick(TXT_CAPTAIN_FIRST_MOVE)(captain, pr, voteStyle);

  // Camp event
  const campKey = tribeName;
  ep.campEvents[campKey].pre.push({
    type: 'captain-elect',
    text: `${captain} was elected captain for Tropical Takedown`,
    players: [captain],
    badgeText: 'CAPTAIN',
    badgeClass: 'badge-neutral',
  });

  return {
    captain,
    runnerUp,
    nominations,
    dodgers,
    voteStyle,
    voteText,
    reactions,
    firstMoveText,
    // Legacy fields for backward compat
    text: voteText,
    runnerUpFriction: isContested,
    frictionText: isContested && runnerUp ? pick(TXT_REACT_BITTER)(runnerUp, pronouns(runnerUp), captain) : null,
  };
}

function _assignDiveOrder(members, captain, tribeName, ep) {
  // Captain's strategic stat determines how well they read their tribe
  const capStrat = pStats(captain).strategic;
  const stratWeight = capStrat * 0.008; // 0-0.08 — smart captains sort by true ability
  const order = [...members].sort((a, b) => {
    if (a === captain) return 0.5 - Math.random();
    const sa = pStats(a), sb = pStats(b);
    return (sb.physical * 0.05 + sb.boldness * 0.05 + noise(2.5 - stratWeight * 15)) -
           (sa.physical * 0.05 + sa.boldness * 0.05 + noise(2.5 - stratWeight * 15));
  });

  const debates = [];
  order.forEach((n, idx) => {
    if (n === captain) return;
    const arch = getArchetype(n);
    const pr = pronouns(n);
    let debateChance = 0;
    let preferredPos = 'first';

    if (arch === 'hothead') { debateChance = 0.5; preferredPos = 'first'; }
    else if (arch === 'challenge-beast') { debateChance = 0.3; preferredPos = 'first'; }
    else if (arch === 'villain' || arch === 'mastermind' || arch === 'schemer') { debateChance = 0.25; preferredPos = 'a later'; }
    else if (arch === 'loyal-soldier') { debateChance = 0.2; preferredPos = 'the worst'; }
    else if (arch === 'hero') { debateChance = 0.2; preferredPos = 'first'; }

    if (Math.random() < debateChance) {
      debates.push({
        player: n,
        text: pick(TXT_DIVE_ORDER_DEBATE)(n, pr, preferredPos),
      });
      addBond(n, captain, -0.1);
    }
  });

  return { order, debates };
}

function _assignPair(members, captain, round, totalMembers) {
  // Rotate through pairs based on round
  const available = [...members];
  const idx1 = (round * 2) % available.length;
  const idx2 = (round * 2 + 1) % available.length;
  const rider1 = available[idx1];
  let rider2 = available[idx2];
  if (rider1 === rider2 && available.length > 1) {
    rider2 = available[(idx2 + 1) % available.length];
  }
  return [rider1, rider2];
}

function _generateDiveSocialEvents(result, diveIdx, ep) {
  const allPlayers = result.tribes.flatMap(t => t.tribeMembers);

  // Encouragement (~30% per tribe)
  result.tribes.forEach(td => {
    if (Math.random() < 0.3 && td.tribeMembers.length >= 2) {
      const nextDiver = td.diveOrder[diveIdx + 1];
      if (nextDiver) {
        const encourager = pick(td.tribeMembers.filter(n => n !== nextDiver));
        if (encourager && isNice(encourager)) {
          result.socialEvents.push({
            type: 'encouragement',
            phase: 'dive',
            players: [encourager, nextDiver],
            text: pick(TXT_ENCOURAGEMENT)(encourager, nextDiver),
          });
          addBond(encourager, nextDiver, 0.3);
          popDelta(encourager, 1);
        }
      }
    }
  });

  // Cross-tribe taunt (~20%)
  if (Math.random() < 0.2 && result.tribes.length >= 2) {
    const t1 = pick(result.tribes);
    const t2 = pick(result.tribes.filter(t => t.tribeName !== t1.tribeName));
    if (t1 && t2) {
      const taunter = pick(t1.tribeMembers);
      const target = pick(t2.tribeMembers);
      if (!isNice(taunter)) {
        result.socialEvents.push({
          type: 'taunt',
          phase: 'dive',
          players: [taunter, target],
          text: pick(TXT_CROSS_TRIBE_TAUNT)(taunter, target),
        });
        addBond(taunter, target, -0.3);
        popDelta(taunter, -1);
      }
    }
  }

  // Captain blame (~15% if dive went badly)
  result.tribes.forEach(td => {
    const lastDive = td.dives[td.dives.length - 1];
    if (lastDive && !lastDive.isStrong && Math.random() < 0.15) {
      const blamer = pick(td.tribeMembers.filter(n => n !== td.captain.captain && n !== lastDive.diver));
      if (blamer) {
        const pr = pronouns(blamer);
        result.socialEvents.push({
          type: 'captain-blame',
          phase: 'dive',
          players: [blamer, td.captain.captain],
          text: pick(TXT_CAPTAIN_BLAME)(blamer, pr, td.captain.captain),
        });
        addBond(blamer, td.captain.captain, -0.5);
      }
    }
  });

  // Showmance moment (~10%)
  if (Math.random() < 0.1) {
    const possiblePairs = [];
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        if (romanticCompat(allPlayers[i], allPlayers[j]) && getBond(allPlayers[i], allPlayers[j]) > 1) {
          possiblePairs.push([allPlayers[i], allPlayers[j]]);
        }
      }
    }
    if (possiblePairs.length > 0) {
      const [a, b] = pick(possiblePairs);
      result.socialEvents.push({
        type: 'showmance',
        phase: 'dive',
        players: [a, b],
        text: pick(TXT_SHOWMANCE_MOMENT)(a, b),
      });
      addBond(a, b, 2);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// VP: STATE + REVEAL
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`tt-step-${suffix}-${i}`);
    if (el) {
      el.classList.add('tt-visible');
      const card = el.querySelector('.tt-card[data-anim]');
      if (card) {
        const anim = card.getAttribute('data-anim');
        if (anim && !card.classList.contains('tt-anim-' + anim)) {
          card.classList.add('tt-anim-' + anim);
        }
      }
    }
  }
  const counter = document.getElementById(`tt-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`tt-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.tt-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function ttRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('tt-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  const el = document.getElementById(`tt-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { _ttUpdateSidebar(screenKey); } catch(e) {}
}

export function ttRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('tt-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  try { _ttUpdateSidebar(screenKey); } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════════
// VP: SIDEBAR
// ══════════════════════════════════════════════════════════════════════

function _ttUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('tt-sidebar-inner');
  if (!sideEl) return;
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  if (!epRecord || !epRecord.tropicalTakedown) return;
  const phase = screenKey.replace('tt-', '').replace(/\d+$/, '').replace(/-$/, '') || 'title';
  const phaseMap = { title: 'title', captain: 'captain', dive: 'dive', chain: 'chain', race: 'race', results: 'results' };
  const sidebarPhase = phaseMap[phase] || 'title';
  sideEl.innerHTML = _buildSidebarContent(epRecord, sidebarPhase);
}

function _buildSidebar(ep, phase) {
  return `<div class="tt-sb"><div class="tt-sb-hdr">${_icon('chain')} TROPICAL TAKEDOWN</div><div class="tt-sb-body" id="tt-sidebar-inner">${_buildSidebarContent(ep, phase)}</div></div>`;
}

function _buildSidebarContent(ep, phase) {
  const data = ep.tropicalTakedown;
  if (!data) return '';

  let html = '';

  // Roster builder
  const revealedCaptains = new Set();
  if (phase === 'captain') {
    const capSt = _tvState['tt-captain'];
    const capIdx = capSt ? capSt.idx : -1;
    const meta = (typeof window !== 'undefined' && window._ttCaptainStepMeta) ? window._ttCaptainStepMeta : [];
    for (let i = 0; i <= capIdx && i < meta.length; i++) {
      if (meta[i].type === 'captain-elect') revealedCaptains.add(meta[i].tribe);
    }
  }
  const showCaptain = phase !== 'title' && phase !== 'captain';
  const roster = data.tribes.map(td => {
    const col = tribeColor(td.tribeName);
    return `<div class="tt-sb-divider"></div>
    <div class="tt-sb-section">${td.tribeName.toUpperCase()}</div>
    ${td.tribeMembers.map(n => {
      const isCaptain = n === td.captain.captain && (showCaptain || revealedCaptains.has(td.tribeName));
      const _slug = players.find(p => p.name === n)?.slug || n.toLowerCase();
      return `<div class="tt-sb-row"><img class="tt-sb-av" style="border-color:${col}" src="assets/avatars/${_slug}.png" onerror="this.style.display='none'"><span class="tt-sb-name"><strong>${n}</strong></span>${isCaptain ? '<div class="tt-captain-badge">CPT</div>' : ''}</div>`;
    }).join('')}`;
  }).join('');

  if (phase === 'title') {
    html += `<div class="tt-sb-section">CHALLENGE PHASES</div>
    <div class="tt-sb-row"><span class="tt-sb-name"><strong>1</strong> Deep Dive Relay</span><span class="tt-sb-val tt-sb-val-w">TAG-RELAY</span></div>
    <div class="tt-sb-row"><span class="tt-sb-name"><strong>2</strong> Longboard Race</span><span class="tt-sb-val tt-sb-val-w">DOWNHILL</span></div>
    ${roster}
    <div class="tt-sb-divider"></div>
    <div class="tt-sb-section">MECHANICS</div>
    <div class="tt-sb-row"><span class="tt-sb-name">Golden chains needed</span><span class="tt-sb-val" style="color:var(--tt-chain)">2 per tribe</span></div>
    <div class="tt-sb-row"><span class="tt-sb-name">Helmet reward</span><span class="tt-sb-val tt-sb-val-g">crash -50%</span></div>
    <div class="tt-sb-row"><span class="tt-sb-name">Race rounds</span><span class="tt-sb-val tt-sb-val-w">3 paired</span></div>`;
  } else if (phase === 'captain') {
    html += `<div class="tt-sb-section">CAPTAINS</div>`;
    // Gated by tvState
    const capSt = _tvState['tt-captain'];
    const capIdx = capSt ? capSt.idx : -1;
    const meta = (typeof window !== 'undefined' && window._ttCaptainStepMeta) ? window._ttCaptainStepMeta : [];
    let revealed = 0;
    for (let i = 0; i <= capIdx && i < meta.length; i++) {
      if (meta[i].type === 'captain-elect') {
        const td = data.tribes.find(t => t.tribeName === meta[i].tribe);
        if (td) {
          const col = tribeColor(td.tribeName);
          const _cSlug = players.find(p => p.name === td.captain.captain)?.slug || td.captain.captain.toLowerCase();
          html += `<div class="tt-sb-row"><img class="tt-sb-av" style="border-color:${col}" src="assets/avatars/${_cSlug}.png" onerror="this.style.display='none'"><span class="tt-sb-name"><strong>${td.captain.captain}</strong></span><div class="tt-captain-badge">CPT</div></div>`;
          revealed++;
        }
      }
    }
    if (revealed === 0) {
      html += `<div class="tt-sb-row"><span class="tt-sb-name" style="opacity:.3">Pending election...</span></div>`;
    }
    html += roster;
  } else if (phase === 'dive') {
    const diveSt = _tvState['tt-dive'];
    const diveIdx = diveSt ? diveSt.idx : -1;
    const meta = (typeof window !== 'undefined' && window._ttDiveStepMeta) ? window._ttDiveStepMeta : [];

    // Accumulate revealed data per player
    const tribeChains = {};
    let helmetsRevealed = false;
    const playerStatus = {}; // { name: { dived: bool, score: num, chain: 'found'|'decoy'|'nothing'|null, hazards: [], stolen: bool, stolenBy: str } }
    data.tribes.forEach(td => {
      tribeChains[td.tribeName] = 0;
      td.tribeMembers.forEach(n => { playerStatus[n] = { dived: false, score: 0, chain: null, hazards: [], stolen: false, stolenBy: null, tagged: false, fumbled: false }; });
    });
    for (let i = 0; i <= diveIdx && i < meta.length; i++) {
      const m = meta[i];
      if (m.type === 'tag') { playerStatus[m.diver] = playerStatus[m.diver] || {}; playerStatus[m.diver].tagged = true; if (m.fumbled) playerStatus[m.diver].fumbled = true; }
      if (m.type === 'dive' && m.diver) { playerStatus[m.diver].dived = true; playerStatus[m.diver].score = m.score || 0; }
      if (m.type === 'chain-found' && m.diver) { playerStatus[m.diver].chain = 'found'; tribeChains[m.tribe]++; }
      if (m.type === 'decoy' && m.diver && playerStatus[m.diver]) { playerStatus[m.diver].chain = 'decoy'; }
      if (m.type === 'nothing' && m.diver && playerStatus[m.diver]) { if (!playerStatus[m.diver].chain) playerStatus[m.diver].chain = 'nothing'; }
      if ((m.type === 'shark' || m.type === 'eel') && m.diver && playerStatus[m.diver]) playerStatus[m.diver].hazards.push(m.type);
      if (m.type === 'surface-steal') {
        const victimTribe = data.tribes.find(t => t.tribeMembers.includes(m.victim))?.tribeName || '';
        tribeChains[victimTribe]--; tribeChains[m.stealerTribe]++;
        if (playerStatus[m.victim]) playerStatus[m.victim].stolen = true;
        if (playerStatus[m.stealer]) playerStatus[m.stealer].chain = 'stolen';
      }
      if (m.type === 'helmet-award') helmetsRevealed = true;
    }

    // Chain race — tribe totals
    html += `<div class="tt-sb-section">CHAIN RACE</div>`;
    data.tribes.forEach(td => {
      const col = tribeColor(td.tribeName);
      const chains = Math.max(0, tribeChains[td.tribeName] || 0);
      const chainsHTML = Array(2).fill(0).map((_, ci) => `<div class="tt-chain-link${ci < chains ? ' found' : ''}"></div>`).join('');
      const valCls = chains >= 2 ? 'tt-sb-val-g' : (chains > 0 ? 'tt-sb-val-w' : 'tt-sb-val-d');
      const helmetTag = helmetsRevealed && td.hasHelmet ? ' <span class="tt-sb-pill tt-sb-pill-chain" style="font-size:8px">HELMETS</span>' : '';
      html += `<div class="tt-sb-row"><span class="tt-sb-tribe" style="background:${col}"></span><span class="tt-sb-name"><strong>${td.tribeName}</strong>${helmetTag}</span><div class="tt-chain-count">${chainsHTML}</div><span class="tt-sb-val ${valCls}">${chains}/2</span></div>`;
    });

    // Per-player dive status with avatars, grouped by tribe
    data.tribes.forEach(td => {
      const col = tribeColor(td.tribeName);
      html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">${td.tribeName.toUpperCase()}</div>`;
      td.diveOrder.forEach((n, idx) => {
        const ps = playerStatus[n] || {};
        const isCaptain = n === td.captain.captain;
        const _slug = players.find(p => p.name === n)?.slug || n.toLowerCase();
        let statusIcons = '';
        if (ps.dived) {
          statusIcons += ps.score >= 7 ? '<span style="color:var(--tt-success);font-size:9px" title="Clean dive">&#x2714;</span>' : '<span style="color:var(--tt-danger);font-size:9px" title="Rough dive">&#x2718;</span>';
          if (ps.chain === 'found') statusIcons += ' <span style="color:var(--tt-chain);font-size:9px" title="Chain found">&#x26D3;</span>';
          else if (ps.chain === 'decoy') statusIcons += ' <span style="color:var(--tt-decoy);font-size:9px" title="Decoy">&#x2717;</span>';
          else if (ps.chain === 'stolen') statusIcons += ' <span style="color:var(--tt-danger);font-size:9px" title="Stole a chain">&#x26D3;!</span>';
          if (ps.stolen) statusIcons += ' <span style="color:var(--tt-danger);font-size:9px" title="Chain stolen">STOLEN</span>';
          if (ps.hazards.includes('shark')) statusIcons += ' <span style="color:rgba(140,150,160,.7);font-size:8px;letter-spacing:.5px" title="Shark">SHK</span>';
          if (ps.hazards.includes('eel')) statusIcons += ' <span style="color:rgba(160,96,208,.7);font-size:8px;letter-spacing:.5px" title="Eel">ZAP</span>';
        }
        const scoreVal = ps.dived ? `<span class="tt-sb-val ${ps.score >= 7 ? 'tt-sb-val-g' : 'tt-sb-val-d'}" style="font-size:10px">${ps.score.toFixed(1)}</span>` : '<span class="tt-sb-val" style="font-size:9px;opacity:.3">waiting</span>';
        const capBadge = isCaptain ? '<div class="tt-captain-badge">CPT</div>' : '';
        html += `<div class="tt-sb-row"><img class="tt-sb-av" style="border-color:${col}" src="assets/avatars/${_slug}.png" onerror="this.style.display='none'"><span class="tt-sb-name" style="flex:1;min-width:0"><strong style="font-size:11px">${n}</strong>${capBadge} <span style="display:block;margin-top:1px">${statusIcons}</span></span>${scoreVal}</div>`;
      });
    });
  } else if (phase === 'race') {
    // SVG Bobsled Track Map
    const sectionNames = ['Launch Ramp', 'Snake Bend', 'Lava Gulch', 'Death Drop', 'Pool Landing'];
    const sectionY = [18, 52, 90, 132, 168];
    const sectionX = [30, 195, 40, 185, 110];
    const raceSt = _tvState['tt-race'];
    const raceIdx = raceSt ? raceSt.idx : -1;
    const meta = (typeof window !== 'undefined' && window._ttRaceStepMeta) ? window._ttRaceStepMeta : [];

    // Gather revealed crashes and traps
    const crashMarkers = [];
    const trapMarkers = [];
    const tribePositions = {};
    for (let i = 0; i <= raceIdx && i < meta.length; i++) {
      const m = meta[i];
      if (m.type === 'run' && m.crashed && m.crashSection) {
        const si = sectionNames.indexOf(m.crashSection);
        if (si >= 0) crashMarkers.push({ section: si, tribe: m.tribe });
        tribePositions[m.tribe] = si;
      } else if (m.type === 'run' && !m.crashed) {
        tribePositions[m.tribe] = 4; // pool landing
      }
      if (m.type === 'sabotage' && m.sabotageSection) {
        const si = sectionNames.indexOf(m.sabotageSection);
        if (si >= 0) trapMarkers.push({ section: si, type: m.sabotageType, target: m.targetTribe });
      }
    }

    // Build SVG path (zigzag bobsled chute)
    const pathD = `M${sectionX[0]},${sectionY[0]} C${sectionX[0]+40},${sectionY[0]+12} ${sectionX[1]-40},${sectionY[1]-12} ${sectionX[1]},${sectionY[1]} C${sectionX[1]-40},${sectionY[1]+12} ${sectionX[2]+40},${sectionY[2]-12} ${sectionX[2]},${sectionY[2]} C${sectionX[2]+40},${sectionY[2]+12} ${sectionX[3]-40},${sectionY[3]-12} ${sectionX[3]},${sectionY[3]} C${sectionX[3]-40},${sectionY[3]+12} ${sectionX[4]-20},${sectionY[4]-8} ${sectionX[4]},${sectionY[4]}`;

    let svgContent = `<path d="${pathD}" fill="none" stroke="rgba(140,120,80,.35)" stroke-width="14" stroke-linecap="round"/>`;
    svgContent += `<path d="${pathD}" fill="none" stroke="rgba(90,74,48,.6)" stroke-width="8" stroke-linecap="round" stroke-dasharray="2,6"/>`;

    // Section labels
    sectionNames.forEach((name, i) => {
      const labelX = sectionX[i] + (i % 2 === 0 ? 12 : -12);
      const anchor = i % 2 === 0 ? 'start' : 'end';
      svgContent += `<circle cx="${sectionX[i]}" cy="${sectionY[i]}" r="4" fill="rgba(140,120,80,.25)" stroke="rgba(140,120,80,.4)" stroke-width="1"/>`;
      svgContent += `<text x="${labelX}" y="${sectionY[i]+3}" fill="rgba(240,232,216,.25)" font-size="7" font-family="'JetBrains Mono',monospace" text-anchor="${anchor}" letter-spacing="0.5">${name.split(' ').map(w=>w.substring(0,4)).join(' ').toUpperCase()}</text>`;
    });

    // Trap markers
    trapMarkers.forEach((t, ti) => {
      const x = sectionX[t.section] + (t.type === 'targeted' ? 16 : -16) + ti * 3;
      const y = sectionY[t.section] - 2;
      if (t.type === 'targeted') {
        svgContent += `<g transform="translate(${x},${y})"><circle r="5" fill="none" stroke="rgba(208,72,56,.6)" stroke-width="1"/><line x1="-3" y1="0" x2="3" y2="0" stroke="rgba(208,72,56,.6)" stroke-width="0.8"/><line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(208,72,56,.6)" stroke-width="0.8"/></g>`;
      } else {
        svgContent += `<polygon points="${x},${y-5} ${x-4},${y+3} ${x+4},${y+3}" fill="rgba(218,160,48,.5)" stroke="rgba(218,160,48,.7)" stroke-width="0.8"/>`;
      }
    });

    // Crash X markers
    crashMarkers.forEach((c, ci) => {
      const col = tribeColor(c.tribe);
      const x = sectionX[c.section] + (ci % 2 === 0 ? -14 : 14);
      const y = sectionY[c.section] + 2;
      svgContent += `<g transform="translate(${x},${y})"><line x1="-4" y1="-4" x2="4" y2="4" stroke="${col}" stroke-width="2" opacity=".7"/><line x1="4" y1="-4" x2="-4" y2="4" stroke="${col}" stroke-width="2" opacity=".7"/></g>`;
    });

    // Tribe position markers
    data.tribes.forEach((td, ti) => {
      const col = tribeColor(td.tribeName);
      const abbr = td.tribeName.substring(0, 2).toUpperCase();
      const posIdx = tribePositions[td.tribeName] !== undefined ? tribePositions[td.tribeName] : -1;
      const mx = posIdx >= 0 ? sectionX[posIdx] : sectionX[0];
      const my = posIdx >= 0 ? sectionY[posIdx] : sectionY[0] - 10;
      const offset = (ti - (data.tribes.length - 1) / 2) * 14;
      svgContent += `<g id="tt-map-tribe-${td.tribeName.replace(/\s/g, '-')}" transform="translate(${mx + offset},${my - 10})"><rect x="-9" y="-6" width="18" height="12" rx="3" fill="${col}" opacity=".85" stroke="rgba(0,0,0,.3)" stroke-width=".5"/><text x="0" y="3" fill="white" font-size="6" font-weight="700" font-family="'JetBrains Mono',monospace" text-anchor="middle">${abbr}</text></g>`;
    });

    // Finish line
    svgContent += `<line x1="${sectionX[4]-15}" y1="${sectionY[4]+10}" x2="${sectionX[4]+15}" y2="${sectionY[4]+10}" stroke="rgba(240,232,216,.15)" stroke-width="2" stroke-dasharray="3,3"/>`;
    svgContent += `<text x="${sectionX[4]}" y="${sectionY[4]+20}" fill="rgba(240,232,216,.12)" font-size="6" font-family="'JetBrains Mono',monospace" text-anchor="middle" letter-spacing="2">FINISH</text>`;

    html += `<div class="tt-bobsled-map"><svg viewBox="0 0 230 190" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg></div>`;

    // Legend
    html += `<div style="display:flex;gap:8px;justify-content:center;margin:4px 0 6px;font-size:7px;color:var(--tt-muted);font-family:'JetBrains Mono',monospace;letter-spacing:.5px"><span style="color:rgba(208,72,56,.6)">+ TRAP</span><span style="color:rgba(218,160,48,.6)">&#9650; HAZARD</span><span>&#10005; CRASH</span></div>`;

    // Helmets
    html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">HELMETS</div>`;
    data.tribes.forEach(td => {
      const col = tribeColor(td.tribeName);
      html += `<div class="tt-sb-row"${td.hasHelmet ? '' : ' style="opacity:.3"'}><span class="tt-sb-tribe" style="background:${col}"></span><span class="tt-sb-name"><strong>${td.tribeName}</strong></span>${td.hasHelmet ? '<span class="tt-sb-pill tt-sb-pill-chain">-50% PEN</span>' : '<span style="font-size:9px;color:var(--tt-muted)">NO HELMET</span>'}</div>`;
    });

    // Race times with avatars
    html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">RACE TIMES</div>`;
    for (let i = 0; i <= raceIdx && i < meta.length; i++) {
      const m = meta[i];
      if (m.type === 'run') {
        const col = tribeColor(m.tribe);
        const valCls = m.crashed ? 'tt-sb-val-d' : (m.time < 10 ? 'tt-sb-val-g' : 'tt-sb-val-w');
        const slug1 = players.find(p => p.name === m.rider1)?.slug || (m.rider1 || '').toLowerCase();
        const slug2 = players.find(p => p.name === m.rider2)?.slug || (m.rider2 || '').toLowerCase();
        const av1 = m.rider1 ? `<img class="tt-sb-av" style="border-color:${col};width:20px;height:20px;margin-right:-4px;z-index:2;position:relative" src="assets/avatars/${slug1}.png" onerror="this.style.display='none'" title="${m.rider1}">` : '';
        const av2 = m.rider2 ? `<img class="tt-sb-av" style="border-color:${col};width:20px;height:20px" src="assets/avatars/${slug2}.png" onerror="this.style.display='none'" title="${m.rider2}">` : '';
        const crashLabel = m.crashed ? ` <span style="font-size:7px;color:var(--tt-danger);letter-spacing:.5px">${(m.crashSection || 'CRASH').split(' ')[0].substring(0,5).toUpperCase()}</span>` : '';
        html += `<div class="tt-sb-row">${av1}${av2}<span class="tt-sb-name" style="flex:1;min-width:0;margin-left:4px"><strong>R${m.round}</strong> <span style="color:${col}">${m.tribe.substring(0, 2).toUpperCase()}</span>${crashLabel}</span><span class="tt-sb-val ${valCls}">${m.time}s</span></div>`;
      }
    }

    // Track condition
    html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">TRACK CONDITION</div>`;
    let trackPct = 100;
    for (let i = 0; i <= raceIdx && i < meta.length; i++) {
      if (meta[i].trackCondition !== undefined) trackPct = meta[i].trackCondition;
    }
    const trkCls = trackPct > 80 ? 'tt-sb-val-g' : (trackPct > 60 ? 'tt-sb-val-w' : 'tt-sb-val-d');
    html += `<div class="tt-sb-row"><span class="tt-sb-name">Integrity</span><span class="tt-sb-val ${trkCls}">${Math.round(trackPct)}%</span></div>`;

    // Active traps count
    const revealedTraps = [];
    for (let i = 0; i <= raceIdx && i < meta.length; i++) {
      if (meta[i].type === 'sabotage' && meta[i].sabotageSection) revealedTraps.push(meta[i]);
    }
    if (revealedTraps.length > 0) {
      html += `<div class="tt-sb-row"><span class="tt-sb-name">Active Traps</span><span class="tt-sb-val tt-sb-val-d">${revealedTraps.length}</span></div>`;
    }
    html += roster;
  } else if (phase === 'results') {
    html += `<div class="tt-sb-section">FINAL STANDINGS</div>`;
    const placements = ['1ST', '2ND', '3RD', '4TH'];
    const pillCls = ['tt-sb-pill-g', 'tt-sb-pill-w', 'tt-sb-pill-d', 'tt-sb-pill-d'];
    const valCls = ['tt-sb-val-g', 'tt-sb-val-w', 'tt-sb-val-d', 'tt-sb-val-d'];
    data.finalRanking.forEach((tribeName, idx) => {
      const td = data.tribes.find(t => t.tribeName === tribeName);
      const col = tribeColor(tribeName);
      const time = td ? td.totalRaceTime.toFixed(1) : '—';
      html += `<div class="tt-sb-row"><span class="tt-sb-tribe" style="background:${col}"></span><span class="tt-sb-name"><strong>${tribeName}</strong></span><span class="tt-sb-pill ${pillCls[idx] || ''}">${placements[idx] || ''}</span><span class="tt-sb-val ${valCls[idx] || ''}">${time}s</span></div>`;
    });
    html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">PHASE 1 MVP</div>`;
    if (data.phase1MVP) {
      html += `<div class="tt-sb-row"><span class="tt-sb-name"><strong>${data.phase1MVP}</strong></span><span class="tt-sb-val tt-sb-val-g">MVP</span></div>`;
    }
    html += `<div class="tt-sb-divider"></div><div class="tt-sb-section">PHASE 2 MVP</div>`;
    if (data.phase2MVP) {
      html += `<div class="tt-sb-row"><span class="tt-sb-name"><strong>${data.phase2MVP}</strong></span><span class="tt-sb-val tt-sb-val-g">MVP</span></div>`;
    }
    html += roster;
  }

  return html;
}

// ══════════════════════════════════════════════════════════════════════
// VP: CSS ICON HELPER
// ══════════════════════════════════════════════════════════════════════

function _icon(type) {
  const iconMap = {
    dive: `<div class="tt-icon tt-icon-dive"><div class="fw"><div class="ci"></div></div></div>`,
    chain: `<div class="tt-icon tt-icon-chain"><div class="fw"><div class="ci"></div></div></div>`,
    shark: `<div class="tt-icon tt-icon-shark"><div class="fw"><div class="ci"></div></div></div>`,
    eel: `<div class="tt-icon tt-icon-eel"><div class="fw"><div class="ci"></div></div></div>`,
    board: `<div class="tt-icon tt-icon-board"><div class="fw"><div class="ci"></div></div></div>`,
    crash: `<div class="tt-icon tt-icon-crash"><div class="fw"><div class="ci"></div></div></div>`,
    helmet: `<div class="tt-icon tt-icon-helmet"><div class="fw"><div class="ci"></div></div></div>`,
    captain: `<div class="tt-icon tt-icon-captain"><div class="fw"><div class="ci"></div></div></div>`,
    collision: `<div class="tt-icon tt-icon-collision"><div class="fw"><div class="ci"></div></div></div>`,
    social: `<div class="tt-icon tt-icon-social"><div class="fw"><div class="ci"></div></div></div>`,
    trophy: `<div class="tt-icon tt-icon-trophy"><div class="fw"><div class="ci"></div></div></div>`,
    steal: `<div class="tt-icon tt-icon-steal"><div class="fw"><div class="ci"></div></div></div>`,
  };
  return iconMap[type] || '';
}

// ══════════════════════════════════════════════════════════════════════
// VP: PALM SVG
// ══════════════════════════════════════════════════════════════════════

function _palmSvg(viewBox, trunkPath, fronds, extras = '') {
  return `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${trunkPath}${fronds}${extras}</svg>`;
}

const PALM_1 = _palmSvg('0 0 120 280',
  '<path d="M60 280 C58 240 52 180 48 140 C44 100 50 60 56 40" stroke="#5a3a18" stroke-width="10" stroke-linecap="round" fill="none"/>',
  '<circle cx="56" cy="38" r="4" fill="#5a3a18"/><circle cx="50" cy="42" r="3.5" fill="#4a2e12"/><circle cx="62" cy="42" r="3" fill="#6a4420"/>' +
  '<path d="M56 40 C70 20 100 8 120 15" stroke="#2a6a30" stroke-width="4" fill="none"/>' +
  '<path d="M56 40 C72 15 108 0 118 2" stroke="#1e5a25" stroke-width="3.5" fill="none"/>' +
  '<path d="M56 40 C65 25 95 25 115 30" stroke="#35803a" stroke-width="3" fill="none"/>' +
  '<path d="M56 40 C50 18 30 5 5 10" stroke="#2a6a30" stroke-width="4" fill="none"/>' +
  '<path d="M56 40 C45 12 20 -2 0 5" stroke="#1e5a25" stroke-width="3.5" fill="none"/>' +
  '<path d="M56 40 C48 22 25 20 8 25" stroke="#35803a" stroke-width="3" fill="none"/>' +
  '<path d="M56 40 C60 15 75 -5 90 -8" stroke="#236b28" stroke-width="3" fill="none"/>' +
  '<path d="M56 40 C46 10 15 -8 -5 -2" stroke="#236b28" stroke-width="3" fill="none"/>');

const PALM_2 = _palmSvg('0 0 120 280',
  '<path d="M60 280 C58 235 50 170 46 130 C42 90 48 55 55 35" stroke="#5a3a18" stroke-width="11" stroke-linecap="round" fill="none"/>',
  '<circle cx="55" cy="33" r="4" fill="#5a3a18"/><circle cx="49" cy="37" r="3.5" fill="#4a2e12"/>' +
  '<path d="M55 35 C70 15 100 5 120 12" stroke="#2a6a30" stroke-width="4" fill="none"/>' +
  '<path d="M55 35 C72 10 105 -2 115 0" stroke="#1e5a25" stroke-width="3.5" fill="none"/>' +
  '<path d="M55 35 C65 20 92 22 112 28" stroke="#35803a" stroke-width="3" fill="none"/>' +
  '<path d="M55 35 C48 14 28 2 5 8" stroke="#2a6a30" stroke-width="4" fill="none"/>' +
  '<path d="M55 35 C42 8 18 -5 -2 2" stroke="#1e5a25" stroke-width="3.5" fill="none"/>' +
  '<path d="M55 35 C46 18 22 18 6 22" stroke="#35803a" stroke-width="3" fill="none"/>' +
  '<path d="M55 35 C58 10 72 -8 88 -10" stroke="#236b28" stroke-width="3" fill="none"/>');

const PALM_SM = _palmSvg('0 0 100 220',
  '<path d="M50 220 C48 185 44 130 42 95 C40 65 45 40 50 28" stroke="#5a3a18" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/>',
  '<path d="M50 28 C60 12 82 5 98 10" stroke="#2a6a30" stroke-width="3" fill="none" opacity=".7"/>' +
  '<path d="M50 28 C62 8 88 -2 96 0" stroke="#1e5a25" stroke-width="2.5" fill="none" opacity=".7"/>' +
  '<path d="M50 28 C42 10 22 2 4 8" stroke="#2a6a30" stroke-width="3" fill="none" opacity=".7"/>' +
  '<path d="M50 28 C38 5 14 -4 0 2" stroke="#1e5a25" stroke-width="2.5" fill="none" opacity=".7"/>' +
  '<path d="M50 28 C55 8 70 -2 82 -5" stroke="#35803a" stroke-width="2.5" fill="none" opacity=".7"/>');

const PALM_TINY = _palmSvg('0 0 60 140',
  '<path d="M30 140 C29 112 28 72 30 48 C32 30 34 18 36 10" stroke="#5a3a18" stroke-width="4" stroke-linecap="round" fill="none"/>',
  '<path d="M36 10 C44 2 56 -1 60 2" stroke="#2a6a30" stroke-width="1.8" fill="none"/>' +
  '<path d="M36 10 C28 0 14 -4 2 1" stroke="#2a6a30" stroke-width="1.8" fill="none"/>' +
  '<path d="M36 10 C46 -2 58 -6 60 -3" stroke="#1e5a25" stroke-width="1.5" fill="none"/>');

// ══════════════════════════════════════════════════════════════════════
// VP: SHELL WRAPPER
// ══════════════════════════════════════════════════════════════════════

function _shell(content, ep, phaseCls = '', sidebarPhase = 'title') {
  const data = ep.tropicalTakedown;
  if (!data) return '';

  const sidebar = _buildSidebar(ep, sidebarPhase);

  return `
<div class="tt-shell-wrap ${phaseCls}" data-phase="${sidebarPhase}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap');

.tt-shell-wrap{--tt-ocean:#0e6b5e;--tt-ocean-deep:#083d35;--tt-ocean-shallow:#1a9e8a;--tt-ocean-surface:#2cc4ad;--tt-sky-top:#1a4a6e;--tt-sky-mid:#3a8aae;--tt-sky-low:#6ec0d0;--tt-sky-haze:#a0dce0;--tt-jungle:#1a4a28;--tt-jungle-mid:#2a6a38;--tt-jungle-light:#3a8a48;--tt-jungle-dark:#0e3018;--tt-cliff:#3a3028;--tt-cliff-dark:#2a2018;--tt-cliff-face:#4a3a30;--tt-cliff-moss:rgba(42,106,56,.15);--tt-sand:#d4b878;--tt-sand-dark:#a08a58;--tt-bamboo:#8a7a48;--tt-bamboo-dark:#5a5028;--tt-bamboo-light:#b0a068;--tt-chain:#c0a848;--tt-chain-glow:rgba(220,190,80,.4);--tt-chain-dark:#8a7830;--tt-decoy:#5a5a58;--tt-eel:#4a2a6a;--tt-eel-glow:rgba(120,60,180,.3);--tt-shark:#4a5058;--tt-track:#5a4a30;--tt-track-dark:#3a2a18;--tt-track-rail:rgba(140,120,80,.3);--tt-white:#f0e8d8;--tt-cream:rgba(240,232,216,.88);--tt-muted:rgba(240,232,216,.4);--tt-warm:rgba(220,190,120,.6);--tt-success:#4aaa58;--tt-danger:#d04838;--tt-warning:#daa030;--tt-card-bg:rgba(18,48,35,.88);--tt-card-border:rgba(42,106,56,.1);max-width:1100px;margin:0 auto;font-family:'Nunito',sans-serif;color:var(--tt-white);position:relative;display:grid;grid-template-columns:1fr 260px;gap:16px;}
.tt-shell-wrap *{box-sizing:border-box;}

/* ── Broadcast bar ── */
.tt-broadcast{display:flex;align-items:center;padding:6px 12px;background:linear-gradient(90deg,rgba(13,43,31,.97),rgba(8,61,53,.97));border-bottom:2px solid var(--tt-ocean-surface);border-radius:6px 6px 0 0;font-size:11px;gap:8px;grid-column:1/-1;}
.tt-live{display:flex;align-items:center;gap:4px;color:var(--tt-danger);text-transform:uppercase;letter-spacing:2px;font-weight:700;font-size:10px;}
.tt-live-dot{width:7px;height:7px;background:var(--tt-danger);border-radius:50%;animation:tt-blink 1s infinite;}
@keyframes tt-blink{0%,100%{opacity:1}50%{opacity:.2}}
.tt-ticker{flex:1;overflow:hidden;height:16px;position:relative;}
.tt-ticker-text{position:absolute;white-space:nowrap;animation:tt-scroll 35s linear infinite;font-size:10px;color:var(--tt-ocean-surface);letter-spacing:1px;font-family:'JetBrains Mono',monospace;}
@keyframes tt-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.tt-channel{font-family:'Lilita One',cursive;color:var(--tt-chain);font-size:13px;letter-spacing:2px;}

/* ── Atmosphere ── */
.tt-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;}
.tt-sky{position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,var(--tt-sky-top) 0%,var(--tt-sky-mid) 40%,var(--tt-sky-low) 70%,var(--tt-sky-haze) 100%);}
.tt-sun{position:absolute;top:6%;left:8%;width:70px;height:70px;z-index:2;
  background:radial-gradient(circle,rgba(255,220,140,.25) 0%,rgba(255,200,100,.1) 40%,transparent 70%);
  border-radius:50%;filter:blur(4px);}
.tt-sun::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:22px;height:22px;border-radius:50%;background:rgba(255,230,160,.2);}

/* Crab — inline SVG, walks across the sand */
.tt-crab{position:absolute;bottom:5%;z-index:16;pointer-events:none;animation:tt-crab-walk 20s linear infinite;}
.tt-crab svg{width:28px;height:20px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3));}
@keyframes tt-crab-walk{0%{left:80%;transform:scaleX(-1);}48%{left:8%;transform:scaleX(-1);}52%{left:8%;transform:scaleX(1);}97%{left:80%;transform:scaleX(1);}100%{left:80%;transform:scaleX(-1);}}
.tt-clouds{position:absolute;top:3%;left:0;right:0;height:25%;z-index:2;}
.tt-cloud{position:absolute;border-radius:50%;filter:blur(6px);opacity:.08;}
.tt-cloud::before,.tt-cloud::after{content:'';position:absolute;background:inherit;border-radius:50%;}
.tt-cloud-a{width:160px;height:30px;top:8%;left:10%;background:rgba(255,250,240,.7);animation:tt-drift 60s linear infinite;}
.tt-cloud-a::before{width:70px;height:25px;top:-10px;left:40px;background:rgba(255,250,240,.5);}
.tt-cloud-b{width:120px;height:25px;top:18%;left:60%;background:rgba(255,250,240,.5);filter:blur(8px);opacity:.06;animation:tt-drift 80s 20s linear infinite;}
@keyframes tt-drift{0%{transform:translateX(0);}100%{transform:translateX(-110vw);}}
.tt-cliffs{position:absolute;top:22%;left:0;right:0;height:30%;z-index:3;}
.tt-cliff-back{position:absolute;bottom:0;left:0;right:0;height:100%;background:var(--tt-cliff-dark);opacity:.6;clip-path:polygon(0 100%,0 65%,2% 52%,5% 58%,8% 45%,12% 50%,18% 32%,22% 42%,28% 55%,32% 42%,36% 28%,40% 38%,44% 22%,48% 35%,52% 20%,56% 32%,60% 25%,64% 40%,68% 30%,72% 45%,76% 35%,80% 48%,84% 38%,88% 50%,92% 42%,96% 55%,100% 48%,100% 100%);}
.tt-cliff-front{position:absolute;bottom:0;left:0;right:0;height:80%;background:linear-gradient(180deg,var(--tt-cliff-face),var(--tt-cliff-dark));opacity:.5;clip-path:polygon(0 100%,0 70%,4% 60%,8% 65%,14% 50%,18% 58%,24% 42%,28% 50%,34% 38%,38% 48%,44% 32%,48% 42%,54% 30%,58% 40%,64% 35%,68% 48%,72% 40%,78% 52%,82% 45%,88% 55%,92% 48%,96% 58%,100% 52%,100% 100%);}
.tt-cliff-front::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(175deg,transparent 0px,transparent 20px,var(--tt-cliff-moss) 20px,var(--tt-cliff-moss) 22px);opacity:.4;}
/* Palm trees */
.tt-palm{position:absolute;z-index:15;pointer-events:none;transform-origin:bottom center;}
.tt-palm svg{width:100%;height:100%;display:block;}
.tt-palm-1{left:-30px;bottom:12%;width:220px;height:400px;animation:tt-sway1 6s ease-in-out infinite;}
.tt-palm-2{right:-40px;bottom:12%;width:240px;height:420px;animation:tt-sway2 8s ease-in-out infinite;transform:scaleX(-1);}
.tt-palm-3{left:7%;bottom:15%;width:130px;height:240px;opacity:.5;animation:tt-sway1 5s 2s ease-in-out infinite;}
.tt-palm-4{right:7%;bottom:15%;width:140px;height:250px;opacity:.45;animation:tt-sway2 7s 1s ease-in-out infinite;transform:scaleX(-1);}
.tt-palm-5{left:3%;bottom:16%;width:110px;height:200px;opacity:.35;animation:tt-sway1 7s 3s ease-in-out infinite;}
.tt-palm-6{right:3%;bottom:17%;width:100px;height:190px;opacity:.3;animation:tt-sway2 6s 4s ease-in-out infinite;transform:scaleX(-1);}
.tt-palm-7{left:18%;bottom:18%;width:70px;height:130px;opacity:.55;animation:tt-sway1 4s 1s ease-in-out infinite;}
.tt-palm-8{right:18%;bottom:18%;width:65px;height:120px;opacity:.5;animation:tt-sway2 5s 3s ease-in-out infinite;transform:scaleX(-1);}
.tt-palm-9{left:28%;bottom:19%;width:50px;height:95px;opacity:.4;animation:tt-sway1 6s 2s ease-in-out infinite;}
@keyframes tt-sway1{0%,100%{transform:rotate(0deg);}50%{transform:rotate(2deg);}}
@keyframes tt-sway2{0%,100%{transform:scaleX(-1) rotate(0deg);}50%{transform:scaleX(-1) rotate(2deg);}}
/* Ocean */
.tt-ocean-layer{position:absolute;top:45%;left:0;right:0;bottom:0;z-index:5;background:linear-gradient(180deg,var(--tt-ocean-shallow) 0%,var(--tt-ocean) 20%,var(--tt-ocean-deep) 60%,#051e18 100%);}
.tt-waves{position:absolute;top:43%;left:0;right:0;height:12%;z-index:6;overflow:hidden;}
.tt-wv{position:absolute;left:-100%;width:300%;height:100%;}
.tt-wv-1{top:0;opacity:.06;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 60'%3E%3Cpath d='M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60Z' fill='%23a0dce0'/%3E%3C/svg%3E") repeat-x;background-size:600px 60px;animation:tt-wv 12s linear infinite;}
.tt-wv-2{top:12px;opacity:.04;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 50'%3E%3Cpath d='M0,25 Q100,8 200,25 T400,25 T600,25 T800,25 T1000,25 T1200,25 L1200,50 L0,50Z' fill='%23a0dce0'/%3E%3C/svg%3E") repeat-x;background-size:500px 50px;animation:tt-wv 16s 4s linear infinite reverse;}
@keyframes tt-wv{0%{transform:translateX(0);}100%{transform:translateX(33.33%);}}
.tt-shore{position:absolute;top:50%;left:0;right:0;height:4px;z-index:7;background:rgba(200,240,230,.06);filter:blur(1px);animation:tt-shore-p 5s ease-in-out infinite;}
@keyframes tt-shore-p{0%,100%{opacity:.4;}50%{opacity:.7;}}
.tt-beach-layer{position:absolute;bottom:0;left:0;right:0;height:20%;z-index:8;background:linear-gradient(180deg,var(--tt-sand-dark) 0%,var(--tt-sand) 30%,var(--tt-sand-dark) 100%);}
.tt-bubble{position:absolute;border-radius:50%;z-index:6;pointer-events:none;border:1px solid rgba(160,240,220,.08);background:rgba(160,240,220,.02);}
.tt-b1{width:6px;height:6px;bottom:30%;left:25%;animation:tt-bub 6s ease-in infinite;}
.tt-b2{width:4px;height:4px;bottom:35%;left:45%;animation:tt-bub 8s 2s ease-in infinite;}
.tt-b3{width:5px;height:5px;bottom:28%;left:65%;animation:tt-bub 7s 4s ease-in infinite;}
.tt-b4{width:3px;height:3px;bottom:32%;left:78%;animation:tt-bub 5s 1s ease-in infinite;}
@keyframes tt-bub{0%{opacity:0;transform:translateY(0);}20%{opacity:.5;}80%{opacity:.2;transform:translateY(-120px) translateX(8px);}100%{opacity:0;transform:translateY(-160px);}}
.tt-bird{position:absolute;z-index:9;opacity:.1;}
.tt-bird::before,.tt-bird::after{content:'';position:absolute;width:8px;height:1.5px;background:#1a3a28;top:0;}
.tt-bird::before{left:-8px;transform:rotate(-25deg);transform-origin:right center;animation:tt-flap 1.2s ease-in-out infinite;}
.tt-bird::after{left:0;transform:rotate(25deg);transform-origin:left center;animation:tt-flap 1.2s ease-in-out infinite reverse;}
.tt-bird-1{top:12%;left:30%;animation:tt-bfly 35s linear infinite;}
.tt-bird-2{top:16%;left:60%;animation:tt-bfly 28s 8s linear infinite;opacity:.07;}
@keyframes tt-bfly{0%{transform:translate(0,0);}50%{transform:translate(-22vw,-2vh);}100%{transform:translate(-50vw,0);}}
@keyframes tt-flap{0%,100%{transform:rotate(-25deg);}50%{transform:rotate(-35deg);}}
.tt-particle{position:absolute;width:2px;height:2px;background:rgba(220,200,140,.15);border-radius:50%;z-index:10;pointer-events:none;}
.tt-p1{top:20%;left:15%;animation:tt-flt 12s ease-in-out infinite;}
.tt-p2{top:35%;left:40%;animation:tt-flt 15s 3s ease-in-out infinite;}
.tt-p3{top:25%;left:70%;animation:tt-flt 10s 6s ease-in-out infinite;}
@keyframes tt-flt{0%{opacity:0;transform:translate(0,0);}25%{opacity:.5;}75%{opacity:.2;}100%{opacity:0;transform:translate(-30px,20px);}}
.tt-grain{position:absolute;top:0;left:0;right:0;bottom:0;z-index:20;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.025;mix-blend-mode:overlay;pointer-events:none;}
.tt-vignette{position:absolute;top:0;left:0;right:0;bottom:0;z-index:19;pointer-events:none;background:radial-gradient(ellipse at 50% 35%,transparent 45%,rgba(10,30,20,.5) 100%);}

/* ── CSS-only icons ── */
.tt-icon{width:20px;height:20px;position:relative;flex-shrink:0;}
.tt-icon .fw{width:20px;height:20px;border:1.5px solid rgba(42,106,56,.25);border-radius:3px;position:relative;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.3),inset 0 0 3px rgba(0,0,0,.15);}
.tt-icon .ci{position:absolute;top:2px;left:2px;right:2px;bottom:2px;border-radius:2px;overflow:hidden;}
.tt-icon-dive .ci{background:linear-gradient(170deg,var(--tt-sky-low),var(--tt-ocean));}
.tt-icon-dive .ci::before{content:'';position:absolute;top:2px;left:5px;width:4px;height:6px;background:var(--tt-white);opacity:.3;clip-path:polygon(50% 0%,100% 30%,80% 100%,20% 100%,0% 30%);}
.tt-icon-dive .ci::after{content:'';position:absolute;bottom:1px;left:2px;right:2px;height:4px;background:linear-gradient(180deg,transparent,rgba(14,107,94,.4));}
.tt-icon-chain .ci{background:linear-gradient(170deg,var(--tt-ocean-deep),#051e18);}
.tt-icon-chain .ci::before{content:'';position:absolute;top:3px;left:3px;width:4px;height:6px;border:1.5px solid var(--tt-chain);border-radius:2px;background:transparent;}
.tt-icon-chain .ci::after{content:'';position:absolute;top:6px;left:6px;width:4px;height:6px;border:1.5px solid var(--tt-chain);border-radius:2px;background:transparent;}
.tt-icon-shark .ci{background:linear-gradient(170deg,var(--tt-ocean),var(--tt-ocean-deep));}
.tt-icon-shark .ci::before{content:'';position:absolute;top:4px;left:2px;width:10px;height:5px;background:var(--tt-shark);clip-path:polygon(0 50%,30% 0%,70% 10%,100% 50%,70% 90%,30% 100%);}
.tt-icon-shark .ci::after{content:'';position:absolute;top:2px;left:7px;width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-bottom:4px solid var(--tt-shark);opacity:.6;}
.tt-icon-eel .ci{background:linear-gradient(170deg,var(--tt-ocean-deep),#051e18);}
.tt-icon-eel .ci::before{content:'';position:absolute;top:4px;left:2px;width:10px;height:3px;background:var(--tt-eel);border-radius:4px;box-shadow:0 0 4px var(--tt-eel-glow);}
.tt-icon-eel .ci::after{content:'';position:absolute;top:4px;left:10px;width:2px;height:2px;background:#a060d0;border-radius:50%;box-shadow:0 0 3px rgba(160,96,208,.4);}
.tt-icon-board .ci{background:linear-gradient(170deg,var(--tt-jungle),var(--tt-jungle-dark));}
.tt-icon-board .ci::before{content:'';position:absolute;top:5px;left:1px;width:12px;height:3px;background:var(--tt-bamboo);border-radius:4px;transform:rotate(-15deg);}
.tt-icon-board .ci::after{content:'';position:absolute;bottom:2px;left:3px;width:2px;height:2px;background:var(--tt-sand);border-radius:50%;box-shadow:5px 0 0 var(--tt-sand);}
.tt-icon-crash .ci{background:linear-gradient(170deg,rgba(200,60,40,.3),rgba(100,30,20,.3));}
.tt-icon-crash .ci::before{content:'';position:absolute;top:2px;left:3px;width:8px;height:8px;border:1.5px solid var(--tt-danger);border-radius:50%;opacity:.5;}
.tt-icon-helmet .ci{background:linear-gradient(170deg,rgba(60,80,50,.5),rgba(40,60,30,.3));}
.tt-icon-helmet .ci::before{content:'';position:absolute;top:2px;left:3px;width:8px;height:6px;background:var(--tt-chain);border-radius:4px 4px 1px 1px;opacity:.5;}
.tt-icon-captain .ci{background:linear-gradient(170deg,rgba(80,60,20,.5),rgba(60,40,10,.3));}
.tt-icon-captain .ci::before{content:'';position:absolute;top:2px;left:3px;width:8px;height:5px;background:var(--tt-warning);clip-path:polygon(0 100%,15% 0%,35% 60%,50% 10%,65% 60%,85% 0%,100% 100%);opacity:.5;}
.tt-icon-collision .ci{background:linear-gradient(170deg,rgba(200,100,40,.3),rgba(140,60,20,.2));}
.tt-icon-collision .ci::before{content:'';position:absolute;top:1px;left:1px;right:1px;bottom:1px;background:transparent;border:1.5px solid rgba(255,180,60,.3);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.tt-icon-social .ci{background:linear-gradient(170deg,rgba(60,70,50,.5),rgba(40,50,30,.3));}
.tt-icon-social .ci::before{content:'';position:absolute;top:4px;left:3px;width:4px;height:4px;background:var(--tt-warm);border-radius:50%;opacity:.4;}
.tt-icon-social .ci::after{content:'';position:absolute;top:4px;left:8px;width:4px;height:4px;background:var(--tt-warm);border-radius:50%;opacity:.4;}
.tt-icon-trophy .ci{background:linear-gradient(170deg,rgba(50,70,30,.5),rgba(30,50,15,.3));}
.tt-icon-trophy .ci::before{content:'';position:absolute;top:3px;left:4px;width:6px;height:5px;background:linear-gradient(180deg,var(--tt-chain),var(--tt-chain-dark));border-radius:0 0 3px 3px;clip-path:polygon(0 0,100% 0,80% 100%,20% 100%);}
.tt-icon-steal .ci{background:linear-gradient(170deg,rgba(140,40,40,.3),rgba(80,20,20,.2));}
.tt-icon-steal .ci::before{content:'';position:absolute;top:2px;left:4px;width:6px;height:8px;background:transparent;border:1.5px solid var(--tt-danger);border-radius:0 0 2px 2px;clip-path:polygon(0 30%,100% 30%,100% 100%,0 100%);opacity:.5;}

/* ── Cards ── */
.tt-card{background:var(--tt-card-bg);border:1px solid var(--tt-card-border);border-radius:5px;padding:14px 18px;position:relative;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.35);margin-bottom:10px;transition:transform .1s;}
.tt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 8%,rgba(42,106,56,.12) 50%,transparent 92%);}
.tt-card-dive{border-left:2px solid var(--tt-ocean-shallow);}
.tt-card-chain{border-left:2px solid var(--tt-chain);background:linear-gradient(135deg,rgba(192,168,72,.03),var(--tt-card-bg))!important;}
.tt-card-shark{border-left:2px solid var(--tt-shark);background:linear-gradient(135deg,rgba(74,80,88,.04),var(--tt-card-bg))!important;}
.tt-card-eel{border-left:2px solid var(--tt-eel);background:linear-gradient(135deg,rgba(74,42,106,.03),var(--tt-card-bg))!important;}
.tt-card-board{border-left:2px solid var(--tt-bamboo);}
.tt-card-crash{border-left:2px solid var(--tt-danger);background:linear-gradient(135deg,rgba(208,72,56,.03),var(--tt-card-bg))!important;}
.tt-card-captain{border-left:2px solid var(--tt-warning);background:linear-gradient(135deg,rgba(218,160,48,.03),var(--tt-card-bg))!important;}
.tt-card-collision{border-left:2px solid rgba(255,180,60,.4);background:linear-gradient(135deg,rgba(255,180,60,.02),var(--tt-card-bg))!important;}
.tt-card-social{border-left:2px dashed rgba(42,106,56,.12);background:rgba(20,55,38,.75)!important;}
.tt-card-steal{border-left:2px solid var(--tt-danger);}
.tt-card-success{border-left:2px solid var(--tt-success);}
.tt-card-fail{border-left:2px solid var(--tt-danger);}
.tt-card-tribe{padding:8px 14px;border-radius:5px;font-family:'Lilita One',cursive;font-size:12px;letter-spacing:2.5px;display:flex;align-items:center;gap:10px;margin-bottom:10px;background:rgba(42,106,56,.04);border:1px solid rgba(42,106,56,.06);}
.tt-hdr{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
.tt-label{font-family:'Lilita One',cursive;font-size:13px;letter-spacing:.5px;color:var(--tt-white);}
.tt-txt{font-size:13px;line-height:1.7;color:rgba(240,232,216,.85);}
.tt-txt strong{color:var(--tt-white);font-weight:700;}
.tt-badge{margin-left:auto;padding:2px 9px;border-radius:10px;font-size:8.5px;font-weight:700;letter-spacing:1.5px;white-space:nowrap;font-family:'JetBrains Mono',monospace;}
.tt-badge-pass{background:rgba(74,170,88,.08);color:var(--tt-success);border:1px solid rgba(74,170,88,.15);}
.tt-badge-fail{background:rgba(208,72,56,.08);color:var(--tt-danger);border:1px solid rgba(208,72,56,.15);}
.tt-badge-chain{background:rgba(192,168,72,.08);color:var(--tt-chain);border:1px solid rgba(192,168,72,.15);}
.tt-badge-decoy{background:rgba(90,90,88,.08);color:var(--tt-decoy);border:1px solid rgba(90,90,88,.15);}
.tt-badge-fast{background:rgba(218,160,48,.08);color:var(--tt-warning);border:1px solid rgba(218,160,48,.15);}
.tt-badge-captain{background:rgba(218,160,48,.08);color:var(--tt-warning);border:1px solid rgba(218,160,48,.15);}
.tt-badge-social{background:rgba(42,106,56,.05);color:var(--tt-warm);border:1px solid rgba(42,106,56,.08);}
.tt-badge-steal{background:rgba(208,72,56,.08);color:var(--tt-danger);border:1px solid rgba(208,72,56,.1);}
.tt-badge-collision{background:rgba(255,180,60,.08);color:rgba(255,180,60,.7);border:1px solid rgba(255,180,60,.12);}
.tt-badge-helmet{background:rgba(192,168,72,.06);color:var(--tt-chain);border:1px solid rgba(192,168,72,.1);}
.tt-badge-eel{background:rgba(74,42,106,.08);color:rgba(160,96,208,.6);border:1px solid rgba(74,42,106,.15);}
.tt-badge-shark{background:rgba(74,80,88,.08);color:rgba(140,150,160,.6);border:1px solid rgba(74,80,88,.15);}

/* Score bars */
.tt-score-bar{display:flex;align-items:center;gap:8px;margin:5px 0;}
.tt-strack{flex:1;height:5px;background:rgba(42,106,56,.06);border-radius:2px;overflow:hidden;}
.tt-sfill{height:100%;border-radius:2px;}
.tt-sfill-g{background:linear-gradient(90deg,var(--tt-success),#5aba68);box-shadow:0 0 4px rgba(74,170,88,.2);}
.tt-sfill-d{background:linear-gradient(90deg,var(--tt-danger),#e05848);box-shadow:0 0 4px rgba(208,72,56,.2);}
.tt-sfill-w{background:linear-gradient(90deg,var(--tt-chain-dark),var(--tt-chain));box-shadow:0 0 4px rgba(192,168,72,.2);}
.tt-sfill-t{background:linear-gradient(90deg,var(--tt-ocean),var(--tt-ocean-surface));box-shadow:0 0 4px rgba(44,196,173,.2);}
.tt-sval{font-size:10.5px;font-weight:700;min-width:22px;text-align:right;font-family:'JetBrains Mono',monospace;}
.tt-sval-g{color:var(--tt-success);}.tt-sval-d{color:var(--tt-danger);}.tt-sval-w{color:var(--tt-warning);}.tt-sval-t{color:var(--tt-ocean-surface);}

/* Chatter */
.tt-chatter{padding:9px 14px;font-size:11.5px;color:rgba(220,200,140,.4);font-style:italic;letter-spacing:.3px;border-left:1.5px solid rgba(42,106,56,.12);background:rgba(13,43,31,.85);border-radius:3px;margin-bottom:10px;}
.tt-chatter-host{color:var(--tt-ocean-surface);font-style:normal;font-weight:700;opacity:.6;}

/* Vine divider */
.tt-vine{height:3px;margin:16px 0;background:repeating-linear-gradient(90deg,var(--tt-jungle) 0px,var(--tt-jungle) 6px,transparent 6px,transparent 10px,rgba(42,90,32,.2) 10px,rgba(42,90,32,.2) 14px,transparent 14px,transparent 20px);opacity:.1;}

/* Phase header */
.tt-phase-hdr{text-align:center;margin:0 0 18px;padding:30px 20px 18px;position:relative;background:var(--tt-card-bg);border:1px solid var(--tt-card-border);border-radius:6px;box-shadow:0 4px 24px rgba(0,0,0,.3);}
.tt-phase-hdr::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(42,106,56,.15) 50%,transparent 90%);}
.tt-phase-tag{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:6px;color:var(--tt-ocean-surface);opacity:.35;margin-bottom:5px;font-weight:600;}
.tt-phase-title{font-family:'Lilita One',cursive;font-size:38px;letter-spacing:2px;color:var(--tt-white);text-shadow:0 2px 20px rgba(0,0,0,.4);line-height:1.15;}
.tt-phase-sub{font-size:13px;color:var(--tt-muted);margin-top:8px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.55;}

/* Title card */
.tt-title-bg{text-align:center;padding:0;background:transparent;border-radius:12px;border:2px solid rgba(44,196,173,.15);position:relative;overflow:hidden;min-height:500px;}
.tt-title-scene{position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;}
.tt-scene-sky{position:absolute;top:0;left:0;right:0;height:20%;background:linear-gradient(180deg,#0a2a40,var(--tt-sky-mid));}
.tt-scene-cliff{position:absolute;top:15%;left:0;right:0;height:20%;background:linear-gradient(180deg,var(--tt-cliff-face),var(--tt-cliff-dark));clip-path:polygon(0 0,0 100%,8% 70%,15% 85%,25% 55%,32% 65%,40% 40%,48% 50%,55% 35%,62% 45%,70% 30%,78% 42%,85% 28%,92% 38%,100% 25%,100% 0);}
.tt-scene-ledge{position:absolute;top:14.5%;left:20%;right:20%;height:8px;z-index:2;background:var(--tt-cliff-face);border-radius:2px 2px 0 0;box-shadow:0 2px 8px rgba(0,0,0,.3);}
.tt-scene-ocean-surface{position:absolute;top:35%;left:0;right:0;height:6px;z-index:2;background:linear-gradient(180deg,rgba(160,220,224,.08),rgba(26,158,138,.15));filter:blur(1px);animation:tt-shore-p 4s ease-in-out infinite;}
.tt-scene-ocean{position:absolute;top:35%;left:0;right:0;bottom:0;background:linear-gradient(180deg,var(--tt-ocean-shallow) 0%,var(--tt-ocean) 25%,var(--tt-ocean-deep) 60%,#041510 100%);}
.tt-deep-chain{position:absolute;z-index:2;width:12px;height:16px;border:2px solid var(--tt-chain);border-radius:3px;opacity:.25;box-shadow:0 0 10px var(--tt-chain-glow);animation:tt-chain-bob 4s ease-in-out infinite;}
@keyframes tt-chain-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-5px) rotate(4deg)}}
.tt-deep-shark{position:absolute;z-index:2;opacity:.12;width:30px;height:12px;background:var(--tt-shark);clip-path:polygon(0 50%,25% 10%,60% 15%,100% 50%,60% 85%,25% 90%);animation:tt-shark-patrol 10s ease-in-out infinite;}
.tt-deep-shark::before{content:'';position:absolute;top:-6px;left:55%;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:7px solid var(--tt-shark);}
.tt-deep-shark-2{animation-direction:reverse;animation-duration:12s;}
@keyframes tt-shark-patrol{0%{transform:translateX(0)}50%{transform:translateX(60px)}100%{transform:translateX(0)}}
.tt-deep-eel{position:absolute;z-index:2;width:24px;height:4px;background:var(--tt-eel);border-radius:8px;opacity:.15;box-shadow:0 0 8px var(--tt-eel-glow);animation:tt-eel-wiggle 3s ease-in-out infinite;}
@keyframes tt-eel-wiggle{0%,100%{transform:scaleX(1) translateX(0)}25%{transform:scaleX(.8) translateX(3px)}75%{transform:scaleX(1.1) translateX(-2px)}}
.tt-title-track{position:absolute;top:16%;right:8%;width:4px;height:22%;z-index:2;background:repeating-linear-gradient(0deg,var(--tt-bamboo) 0px,var(--tt-bamboo) 6px,var(--tt-bamboo-dark) 6px,var(--tt-bamboo-dark) 8px);transform:rotate(15deg);transform-origin:top right;opacity:.2;border-radius:2px;}
.tt-title-overlay{position:relative;z-index:5;padding:30px 20px 0;}
.tt-title-sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--tt-ocean-surface);letter-spacing:5px;text-shadow:0 0 10px rgba(44,196,173,.5),0 1px 4px rgba(0,0,0,.8);}
.tt-title-main{font-family:'Lilita One',cursive;font-size:52px;letter-spacing:4px;color:var(--tt-white);text-shadow:0 3px 0 var(--tt-ocean-deep),0 6px 20px rgba(0,0,0,.6),0 0 40px rgba(44,196,173,.15);line-height:1.05;margin-top:4px;}
.tt-title-episode{font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:var(--tt-chain);letter-spacing:2px;margin-top:10px;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,.8);}
.tt-title-cold{font-size:13px;color:var(--tt-cream);margin-top:10px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.6;font-style:italic;opacity:.65;text-shadow:0 1px 4px rgba(0,0,0,.6);}
.tt-teams-row{position:relative;z-index:5;display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:0 20px;margin-top:12px;}
.tt-team-block{text-align:center;background:rgba(13,43,31,.7);border:1px solid rgba(42,106,56,.15);border-radius:6px;padding:8px 12px;backdrop-filter:blur(4px);}
.tt-team-name{font-family:'Lilita One',cursive;font-size:12px;letter-spacing:2px;}
.tt-team-av-row{display:flex;justify-content:center;gap:3px;margin-top:5px;}
.tt-team-av{width:22px;height:22px;border-radius:50%;border:2px solid;object-fit:cover;box-shadow:0 0 6px rgba(0,0,0,.4);}
.tt-insert-coin{font-family:'Press Start 2P',monospace;font-size:10px;color:var(--tt-chain);padding:16px 0 20px;animation:tt-coin-blink 1.2s step-end infinite;letter-spacing:2px;text-shadow:0 0 12px var(--tt-chain-glow),0 1px 4px rgba(0,0,0,.8);}
@keyframes tt-coin-blink{0%,100%{opacity:1}50%{opacity:0}}

/* Depth map */
.tt-depth-map{position:relative;margin:0 0 16px;height:140px;overflow:hidden;background:linear-gradient(180deg,var(--tt-sky-haze) 0%,var(--tt-ocean-shallow) 20%,var(--tt-ocean) 50%,var(--tt-ocean-deep) 80%,#051e18 100%);border:1px solid rgba(42,106,56,.08);border-radius:6px;}
.tt-depth-map::before{content:'DIVE TRACKER';position:absolute;top:6px;left:50%;transform:translateX(-50%);z-index:4;font-family:'JetBrains Mono',monospace;font-size:7px;letter-spacing:4px;color:rgba(160,240,220,.15);font-weight:600;}
.tt-depth-line{position:absolute;left:0;right:0;height:1px;background:rgba(160,240,220,.04);z-index:2;}
.tt-depth-line::after{content:attr(data-depth);position:absolute;right:8px;top:-6px;font-family:'JetBrains Mono',monospace;font-size:6px;color:rgba(160,240,220,.1);letter-spacing:1px;}
.tt-depth-cliff{position:absolute;top:0;left:0;right:0;height:25%;z-index:3;background:var(--tt-cliff-dark);opacity:.3;clip-path:polygon(0 0,0 60%,8% 55%,15% 70%,25% 100%,35% 80%,50% 100%,100% 100%,100% 0);}
.tt-depth-target{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);z-index:4;width:16px;height:16px;border:1.5px solid var(--tt-chain);border-radius:3px;opacity:.3;box-shadow:0 0 8px var(--tt-chain-glow);animation:tt-chain-pulse 3s ease-in-out infinite;}
@keyframes tt-chain-pulse{0%,100%{box-shadow:0 0 4px var(--tt-chain-glow);opacity:.2;}50%{box-shadow:0 0 12px var(--tt-chain-glow);opacity:.4;}}

/* Bobsled track SVG map */
.tt-bobsled-map{position:relative;margin:0 0 4px;background:linear-gradient(180deg,var(--tt-jungle) 0%,var(--tt-jungle-dark) 40%,var(--tt-track-dark) 100%);border:1px solid rgba(42,106,56,.08);border-radius:6px;padding:4px 0;overflow:hidden;}
.tt-bobsled-map svg{display:block;margin:0 auto;}

/* Section progress pips on run cards */
.tt-sec-bar{display:flex;flex-direction:column;gap:2px;margin-top:6px;padding:4px 0;}
.tt-sec-labels{display:flex;justify-content:space-between;padding:0 2px;}
.tt-sec-pips{display:flex;gap:3px;}
.tt-sec-pip{flex:1;height:5px;border-radius:2px;transition:background .3s;}
.tt-sec-pass{background:var(--tt-success);opacity:.7;}
.tt-sec-crash{background:var(--tt-danger);opacity:.8;animation:tt-sec-flash .6s ease-out;}
.tt-sec-skip{background:rgba(240,232,216,.08);}
@keyframes tt-sec-flash{0%{opacity:1;transform:scaleY(1.8);}100%{opacity:.8;transform:scaleY(1);}}

/* Section-by-section run narration */
.tt-run-sec{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid rgba(42,106,56,.06);line-height:1.5;}
.tt-run-sec:last-of-type{border-bottom:none;}
.tt-run-sec-name{flex-shrink:0;width:72px;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.5px;padding-top:2px;text-transform:uppercase;}
.tt-run-sec-txt{flex:1;font-size:12px;}
.tt-run-sec-pass .tt-run-sec-name{color:var(--tt-success);opacity:.7;}
.tt-run-sec-crash .tt-run-sec-name{color:var(--tt-danger);}
.tt-run-sec-crash .tt-run-sec-txt{color:var(--tt-white);}
.tt-run-sec-crash{background:rgba(208,72,56,.06);border-radius:4px;padding:5px 6px;margin:2px -6px;border-bottom-color:transparent!important;}
.tt-run-sec-skip .tt-run-sec-name{color:var(--tt-muted);opacity:.35;}
.tt-run-sec-skip .tt-run-sec-txt{color:var(--tt-muted);opacity:.5;font-style:italic;}
.tt-run-final{text-align:right;padding:6px 0 0;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:1px;}
.tt-run-final-clean{color:var(--tt-success);}
.tt-run-final-crash{color:var(--tt-danger);font-size:11px;}

/* Sidebar */
.tt-sb{background:linear-gradient(180deg,rgba(18,48,35,.92),rgba(13,38,28,.95));border:1px solid var(--tt-card-border);border-radius:6px;overflow-y:auto;overflow-x:hidden;position:sticky;top:54px;max-height:calc(100vh - 70px);}
.tt-sb-hdr{padding:13px 14px 9px;border-bottom:1px solid rgba(42,106,56,.06);font-family:'Lilita One',cursive;font-size:11px;letter-spacing:2.5px;color:var(--tt-ocean-surface);display:flex;align-items:center;gap:7px;}
.tt-sb-body{padding:10px 12px;max-height:calc(100vh - 160px);overflow-y:auto;}
.tt-sb-section{font-family:'JetBrains Mono',monospace;font-size:7.5px;font-weight:600;letter-spacing:2.5px;color:rgba(160,240,220,.12);margin-bottom:5px;margin-top:2px;}
.tt-sb-divider{height:1px;background:rgba(42,106,56,.06);margin:8px 0;}
.tt-sb-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(42,106,56,.03);font-size:10.5px;}
.tt-sb-row:last-child{border-bottom:none;}
.tt-sb-name{flex:1;color:var(--tt-muted);}
.tt-sb-name strong{color:var(--tt-cream);font-weight:700;}
.tt-sb-val{font-weight:700;font-family:'JetBrains Mono',monospace;font-size:10.5px;}
.tt-sb-val-g{color:var(--tt-success);}.tt-sb-val-d{color:var(--tt-danger);}.tt-sb-val-w{color:var(--tt-warning);}
.tt-sb-pill{display:inline-block;padding:1px 5px;border-radius:5px;font-size:7.5px;font-weight:700;letter-spacing:.5px;font-family:'JetBrains Mono',monospace;}
.tt-sb-pill-g{background:rgba(74,170,88,.08);color:var(--tt-success);}
.tt-sb-pill-d{background:rgba(208,72,56,.08);color:var(--tt-danger);}
.tt-sb-pill-w{background:rgba(218,160,48,.08);color:var(--tt-warning);}
.tt-sb-pill-chain{background:rgba(192,168,72,.08);color:var(--tt-chain);}
.tt-sb-tribe{display:inline-block;width:7px;height:7px;border-radius:2px;flex-shrink:0;}
.tt-chain-count{display:flex;align-items:center;gap:4px;padding:3px 0;}
.tt-chain-link{width:8px;height:12px;border:1.5px solid var(--tt-chain);border-radius:2px;opacity:.2;}
.tt-chain-link.found{opacity:.8;background:rgba(192,168,72,.1);box-shadow:0 0 4px var(--tt-chain-glow);}
.tt-captain-badge{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:3px;background:rgba(218,160,48,.06);border:1px solid rgba(218,160,48,.08);font-size:8px;font-weight:700;color:var(--tt-warning);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}

/* Sidebar player avatars */
.tt-sb-av{width:20px;height:20px;border-radius:50%;border:1.5px solid;object-fit:cover;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.3);}

/* Step hidden/visible */
.tt-step-hidden{opacity:0;max-height:0;overflow:hidden;margin:0;padding:0;border:none;transition:none;}
.tt-visible{opacity:1!important;max-height:4000px!important;overflow:visible!important;margin-bottom:10px!important;}

/* Card animations */
.tt-anim-splash{animation:tt-splash .4s cubic-bezier(.16,1,.3,1);}
@keyframes tt-splash{0%{opacity:.5;transform:translateY(25px) scale(.96);}60%{transform:translateY(-2px) scale(1.01);}100%{transform:none;}}
.tt-anim-dive-drop{animation:tt-dive-drop .55s cubic-bezier(.22,.9,.36,1);}
@keyframes tt-dive-drop{0%{opacity:0;transform:translateY(-60px) rotate(-3deg);}50%{opacity:1;transform:translateY(8px) rotate(1deg);}70%{transform:translateY(-3px) rotate(0);}100%{transform:none;}}
.tt-anim-bellyflop{animation:tt-bellyflop .5s ease-out;}
@keyframes tt-bellyflop{0%{opacity:0;transform:translateY(-40px) scaleY(.7);}40%{opacity:1;transform:translateY(6px) scaleY(1.15) scaleX(.92);}60%{transform:translateY(-2px) scaleY(.95) scaleX(1.03);}100%{transform:none;}}
.tt-anim-collision{animation:tt-collision .45s ease-out;}
@keyframes tt-collision{0%{transform:translate(0);}12%{transform:translate(6px,-2px);}24%{transform:translate(-5px,3px);}36%{transform:translate(4px,-1px) rotate(1deg);}48%{transform:translate(-3px,1px) rotate(-1deg);}60%{transform:translate(2px);}100%{transform:none;}}
.tt-anim-swim{animation:tt-swim .6s cubic-bezier(.22,.9,.36,1);}
.tt-anim-tag-slap{animation:tt-tag-slap .4s cubic-bezier(.22,.9,.36,1);}
@keyframes tt-tag-slap{0%{opacity:0;transform:scale(.92) translateX(-15px)}40%{opacity:1;transform:scale(1.03) translateX(3px)}70%{transform:scale(.99) translateX(-1px)}100%{transform:none}}
.tt-anim-tag-fumble{animation:tt-tag-fumble .55s ease-out;}
@keyframes tt-tag-fumble{0%{opacity:0;transform:translateX(-20px) rotate(-3deg)}30%{opacity:1;transform:translateX(8px) rotate(2deg)}50%{transform:translateX(-4px) rotate(-1deg)}70%{transform:translateX(2px) rotate(.5deg)}100%{transform:none}}
@keyframes tt-swim{0%{opacity:0;transform:translateX(-50px) rotate(-2deg);}50%{opacity:1;transform:translateX(5px) rotate(.5deg);}100%{transform:none;}}
.tt-anim-chain-glow{animation:tt-cglow 1s ease-out;}
@keyframes tt-cglow{0%{box-shadow:0 2px 12px rgba(0,0,0,.35);transform:scale(1);}25%{transform:scale(1.02);}40%{box-shadow:0 0 30px rgba(192,168,72,.35),0 0 60px rgba(192,168,72,.12);transform:scale(1.01);}100%{box-shadow:0 2px 12px rgba(0,0,0,.35);transform:none;}}
.tt-anim-shark{animation:tt-shark .5s ease-out;}
@keyframes tt-shark{0%{transform:translateX(0);}10%{transform:translateX(8px);}25%{transform:translateX(-6px) rotate(-1deg);}40%{transform:translateX(4px) rotate(.5deg);}55%{transform:translateX(-2px);}100%{transform:none;}}
.tt-anim-eel{animation:tt-eel .5s ease-out;}
@keyframes tt-eel{0%{box-shadow:0 2px 12px rgba(0,0,0,.35);filter:brightness(1);}20%{box-shadow:0 0 20px var(--tt-eel-glow),0 2px 12px rgba(0,0,0,.35);filter:brightness(1.3);}40%{filter:brightness(.9);}60%{box-shadow:0 0 18px var(--tt-eel-glow);filter:brightness(1.2);}100%{box-shadow:0 2px 12px rgba(0,0,0,.35);filter:brightness(1);}}
.tt-anim-steal{animation:tt-steal .5s ease-out;}
@keyframes tt-steal{0%{transform:translateX(30px) rotate(3deg);opacity:0;}30%{transform:translateX(-5px) rotate(-1deg);opacity:1;}60%{transform:translateX(2px) rotate(0);}100%{transform:none;}}
.tt-anim-board-slide{animation:tt-board-slide .5s cubic-bezier(.22,.9,.36,1);}
@keyframes tt-board-slide{0%{opacity:0;transform:translateX(-70px) skewX(-3deg);}50%{opacity:1;transform:translateX(6px) skewX(1deg);}75%{transform:translateX(-2px) skewX(0);}100%{transform:none;}}
.tt-anim-crash{animation:tt-crash .5s ease-out;}
@keyframes tt-crash{0%{transform:translate(0) rotate(0);}12%{transform:translate(-5px,3px) rotate(-2deg);}24%{transform:translate(6px,-2px) rotate(2deg);}36%{transform:translate(-4px,2px) rotate(-1deg);}48%{transform:translate(3px,-1px) rotate(1deg);}60%{transform:translate(-1px);}100%{transform:none;}}
.tt-anim-wipeout{animation:tt-wipeout .6s ease-out;}
@keyframes tt-wipeout{0%{opacity:0;transform:translateX(-40px) rotate(-8deg);}25%{opacity:1;transform:translateX(10px) rotate(4deg);}45%{transform:translateX(-5px) rotate(-2deg);}65%{transform:translateX(2px) rotate(1deg);}100%{transform:none;}}
.tt-anim-victory{animation:tt-victory .6s cubic-bezier(.16,1,.3,1);}
@keyframes tt-victory{0%{opacity:0;transform:scale(.8);}40%{opacity:1;transform:scale(1.05);}60%{transform:scale(.98);}100%{transform:none;}}
/* ═══ CARD FX LAYERS ═══ */
.tt-fx-diver{position:absolute;top:-8px;right:20px;opacity:0;pointer-events:none;z-index:5;}
.tt-anim-dive-drop .tt-fx-diver-clean{animation:tt-fx-diver-drop .7s cubic-bezier(.22,.9,.36,1) forwards;}
.tt-anim-bellyflop .tt-fx-diver-flop{animation:tt-fx-diver-flop .6s ease-out forwards;}
@keyframes tt-fx-diver-drop{0%{opacity:1;top:-30px;transform:rotate(0deg)}50%{top:8px;transform:rotate(180deg)}75%{top:4px;opacity:.6;transform:rotate(250deg)}100%{top:6px;opacity:0;transform:rotate(360deg)}}
@keyframes tt-fx-diver-flop{0%{opacity:1;top:-20px;transform:rotate(0deg) scaleY(1)}30%{top:6px;transform:rotate(45deg) scaleY(1)}50%{top:10px;transform:rotate(40deg) scaleY(.5) scaleX(1.4);opacity:.8}100%{top:10px;opacity:0;transform:rotate(40deg) scaleY(.3) scaleX(1.6)}}
.tt-fx-splash-drops{position:absolute;bottom:4px;left:50%;pointer-events:none;opacity:0;z-index:5;}
.tt-fx-splash-drops span{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--tt-ocean-surface);}
.tt-anim-dive-drop .tt-fx-splash-drops,.tt-anim-bellyflop .tt-fx-splash-drops{animation:tt-fx-splash-appear .1s .35s forwards;}
.tt-anim-dive-drop .tt-fx-splash-drops span:nth-child(1){animation:tt-fx-drop-1 .5s .35s ease-out forwards;}
.tt-anim-dive-drop .tt-fx-splash-drops span:nth-child(2){animation:tt-fx-drop-2 .5s .38s ease-out forwards;}
.tt-anim-dive-drop .tt-fx-splash-drops span:nth-child(3){animation:tt-fx-drop-3 .5s .4s ease-out forwards;}
.tt-anim-dive-drop .tt-fx-splash-drops span:nth-child(4){animation:tt-fx-drop-4 .5s .36s ease-out forwards;}
.tt-anim-dive-drop .tt-fx-splash-drops span:nth-child(5){animation:tt-fx-drop-5 .5s .42s ease-out forwards;}
.tt-anim-bellyflop .tt-fx-splash-drops span:nth-child(1){animation:tt-fx-drop-1 .6s .3s ease-out forwards;width:5px;height:5px;}
.tt-anim-bellyflop .tt-fx-splash-drops span:nth-child(2){animation:tt-fx-drop-2 .6s .32s ease-out forwards;width:4px;height:4px;}
.tt-anim-bellyflop .tt-fx-splash-drops span:nth-child(3){animation:tt-fx-drop-3 .6s .28s ease-out forwards;width:5px;height:5px;}
.tt-anim-bellyflop .tt-fx-splash-drops span:nth-child(4){animation:tt-fx-drop-4 .6s .34s ease-out forwards;width:4px;height:4px;}
.tt-anim-bellyflop .tt-fx-splash-drops span:nth-child(5){animation:tt-fx-drop-5 .6s .3s ease-out forwards;width:6px;height:6px;}
@keyframes tt-fx-splash-appear{to{opacity:1}}
@keyframes tt-fx-drop-1{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-20px,-25px);opacity:0}}
@keyframes tt-fx-drop-2{0%{transform:translate(0,0);opacity:1}100%{transform:translate(15px,-30px);opacity:0}}
@keyframes tt-fx-drop-3{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-8px,-35px);opacity:0}}
@keyframes tt-fx-drop-4{0%{transform:translate(0,0);opacity:1}100%{transform:translate(25px,-18px);opacity:0}}
@keyframes tt-fx-drop-5{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-30px,-15px);opacity:0}}
.tt-fx-zap{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5;border-radius:5px;background:linear-gradient(135deg,rgba(120,60,180,.15),rgba(180,100,255,.1),transparent);}
.tt-anim-eel .tt-fx-zap{animation:tt-fx-zap-flash .5s ease-out;}
@keyframes tt-fx-zap-flash{0%{opacity:0}15%{opacity:1;background:linear-gradient(135deg,rgba(180,100,255,.35),rgba(120,60,180,.2),transparent)}30%{opacity:.1}45%{opacity:.8;background:linear-gradient(135deg,transparent,rgba(120,60,180,.2),rgba(180,100,255,.3))}60%{opacity:.1}75%{opacity:.4}100%{opacity:0}}
.tt-fx-fin{position:absolute;top:6px;right:12px;opacity:0;pointer-events:none;z-index:5;}
.tt-anim-shark .tt-fx-fin{animation:tt-fx-fin-cross .8s ease-in-out forwards;}
@keyframes tt-fx-fin-cross{0%{opacity:0;right:calc(100% + 10px)}20%{opacity:.7}70%{opacity:.5}100%{opacity:0;right:-30px}}
.tt-fx-gleam{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5;border-radius:5px;background:radial-gradient(ellipse at 30% 50%,rgba(220,190,80,.25),transparent 60%);}
.tt-anim-chain-glow .tt-fx-gleam{animation:tt-fx-gleam-burst 1s ease-out;}
@keyframes tt-fx-gleam-burst{0%{opacity:0;transform:scale(.9)}20%{opacity:1}50%{opacity:.6;transform:scale(1.02)}100%{opacity:0;transform:scale(1)}}
.tt-fx-redflash{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5;border-radius:5px;background:rgba(208,72,56,.15);}
.tt-anim-steal .tt-fx-redflash{animation:tt-fx-redflash .5s ease-out;}
@keyframes tt-fx-redflash{0%{opacity:0}15%{opacity:1}30%{opacity:.2}50%{opacity:.6}100%{opacity:0}}
.tt-fx-impact{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);pointer-events:none;opacity:0;z-index:5;font-size:28px;color:rgba(255,200,60,.5);}
.tt-anim-collision .tt-fx-impact{animation:tt-fx-impact-burst .5s ease-out;}
@keyframes tt-fx-impact-burst{0%{opacity:0;transform:translate(-50%,-50%) scale(0) rotate(0deg)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(20deg)}60%{opacity:.5;transform:translate(-50%,-50%) scale(.9) rotate(15deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(0) rotate(30deg)}}
.tt-fx-slap{position:absolute;top:6px;right:16px;opacity:0;pointer-events:none;z-index:5;}
.tt-anim-tag-slap .tt-fx-slap{animation:tt-fx-slap-pop .4s .1s ease-out forwards;}
@keyframes tt-fx-slap-pop{0%{opacity:0;transform:scale(0) rotate(-20deg)}40%{opacity:1;transform:scale(1.5) rotate(10deg)}70%{transform:scale(.9) rotate(0deg)}100%{opacity:0;transform:scale(.8)}}
@media(prefers-reduced-motion:reduce){.tt-fx-diver,.tt-fx-splash-drops,.tt-fx-zap,.tt-fx-fin,.tt-fx-gleam,.tt-fx-redflash,.tt-fx-impact,.tt-fx-slap{display:none!important;}}
.tt-cliff-player{position:absolute;z-index:3;display:flex;flex-direction:column;align-items:center;}
.tt-cliff-player img{border-radius:50%;object-fit:cover;box-shadow:0 2px 10px rgba(0,0,0,.5);}
.tt-cliff-player-name{font-family:'JetBrains Mono',monospace;font-size:6px;letter-spacing:1px;color:rgba(240,232,216,.5);margin-top:2px;white-space:nowrap;}
.tt-stance-brave{animation:tt-stance-brave 3s ease-in-out infinite;}
.tt-stance-scared{animation:tt-stance-scared 2s ease-in-out infinite;}
.tt-stance-pumped{animation:tt-stance-pumped 1.5s ease-in-out infinite;}
@keyframes tt-stance-brave{0%,100%{transform:rotate(0deg)}50%{transform:rotate(3deg) translateY(-2px)}}
@keyframes tt-stance-scared{0%,100%{transform:rotate(0deg)}30%{transform:rotate(-2deg)}60%{transform:rotate(1deg)}}
@keyframes tt-stance-pumped{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.tt-diver{position:absolute;z-index:4;animation:tt-diver-fall 4s ease-in infinite;}
.tt-diver img{width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,.4);object-fit:cover;box-shadow:0 0 15px rgba(0,0,0,.5);}
.tt-diver-splash{position:absolute;top:0;left:50%;transform:translateX(-50%);width:40px;height:8px;background:radial-gradient(ellipse,rgba(160,240,220,.15),transparent);border-radius:50%;filter:blur(2px);animation:tt-splash-ring 4s ease-in infinite;}
@keyframes tt-diver-fall{0%{top:18%;opacity:0;transform:rotate(0deg) scale(.8)}10%{opacity:1;transform:rotate(15deg) scale(1)}45%{top:32%;transform:rotate(90deg) scale(1)}50%{top:34%;opacity:1;transform:rotate(100deg) scale(.9)}55%{opacity:0}100%{top:34%;opacity:0;transform:rotate(100deg) scale(.7)}}
@keyframes tt-splash-ring{0%,48%{opacity:0;transform:translateX(-50%) scale(.5)}50%{opacity:.8;transform:translateX(-50%) scale(1)}65%{opacity:.3;transform:translateX(-50%) scale(2)}75%,100%{opacity:0;transform:translateX(-50%) scale(2.5)}}
@media(prefers-reduced-motion:reduce){
  .tt-anim-splash,.tt-anim-dive-drop,.tt-anim-bellyflop,.tt-anim-collision,.tt-anim-swim,.tt-anim-chain-glow,.tt-anim-shark,.tt-anim-eel,.tt-anim-steal,.tt-anim-board-slide,.tt-anim-crash,.tt-anim-wipeout,.tt-anim-victory,.tt-anim-tag-slap,.tt-anim-tag-fumble{animation:none!important;}
  .tt-atmo *,.tt-shell-wrap *{animation-duration:.01s!important;transition-duration:.01s!important;}
  .tt-diver,.tt-cliff-player,.tt-crab{animation:none!important;}
  .tt-sec-crash{animation:none!important;}
}

/* Reveal controls */
.tt-controls{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;justify-content:center;gap:12px;padding:10px 16px;background:linear-gradient(0deg,rgba(13,43,31,.98) 60%,rgba(13,43,31,0));pointer-events:none;}
.tt-btn{pointer-events:all;padding:7px 20px;border:1px solid rgba(42,196,173,.2);border-radius:4px;background:rgba(14,107,94,.15);color:var(--tt-ocean-surface);font-family:'Lilita One',cursive;font-size:12px;letter-spacing:1.5px;cursor:pointer;transition:all .2s;}
.tt-btn:hover{background:rgba(14,107,94,.3);border-color:var(--tt-ocean-surface);}
.tt-counter{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--tt-muted);pointer-events:all;align-self:center;}

/* Responsive */
@media(max-width:768px){
  .tt-shell-wrap{grid-template-columns:1fr;}
  .tt-sb{position:relative;top:auto;order:-1;}
  .tt-sb-body{max-height:200px;}
  .tt-phase-title{font-size:28px;}
  .tt-title-main{font-size:34px;}
}
</style>

<!-- Atmosphere -->
<div class="tt-atmo">
  <div class="tt-sky"></div>
  <div class="tt-sun"></div>
  <div class="tt-grain"></div>
  <div class="tt-clouds"><div class="tt-cloud tt-cloud-a"></div><div class="tt-cloud tt-cloud-b"></div></div>
  <div class="tt-cliffs"><div class="tt-cliff-back"></div><div class="tt-cliff-front"></div></div>
  <div class="tt-palm tt-palm-1">${PALM_1}</div>
  <div class="tt-palm tt-palm-2">${PALM_2}</div>
  <div class="tt-palm tt-palm-3">${PALM_SM}</div>
  <div class="tt-palm tt-palm-4">${PALM_SM}</div>
  <div class="tt-palm tt-palm-5">${PALM_SM}</div>
  <div class="tt-palm tt-palm-6">${PALM_SM}</div>
  <div class="tt-palm tt-palm-7">${PALM_TINY}</div>
  <div class="tt-palm tt-palm-8">${PALM_TINY}</div>
  <div class="tt-palm tt-palm-9">${PALM_TINY}</div>
  <div class="tt-ocean-layer"></div>
  <div class="tt-waves"><div class="tt-wv tt-wv-1"></div><div class="tt-wv tt-wv-2"></div></div>
  <div class="tt-shore"></div>
  <div class="tt-beach-layer"></div>
  <div class="tt-bubble tt-b1"></div><div class="tt-bubble tt-b2"></div><div class="tt-bubble tt-b3"></div><div class="tt-bubble tt-b4"></div>
  <div class="tt-bird tt-bird-1"></div><div class="tt-bird tt-bird-2"></div>
  <div class="tt-particle tt-p1"></div><div class="tt-particle tt-p2"></div><div class="tt-particle tt-p3"></div>
  <div class="tt-crab"><svg viewBox="0 0 56 40" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="28" cy="20" rx="11" ry="8" fill="#c04030" opacity=".45"/>
    <ellipse cx="28" cy="20" rx="8" ry="5.5" fill="#d05040" opacity=".4"/>
    <circle cx="24" cy="15" r="2" fill="#1a1a1a" opacity=".3"/><circle cx="32" cy="15" r="2" fill="#1a1a1a" opacity=".3"/>
    <circle cx="24" cy="14.5" r=".8" fill="#f0e8d8" opacity=".5"/><circle cx="32" cy="14.5" r=".8" fill="#f0e8d8" opacity=".5"/>
    <line x1="24" y1="13" x2="22" y2="9" stroke="#c04030" stroke-width="1.2" stroke-linecap="round" opacity=".4"/>
    <line x1="32" y1="13" x2="34" y2="9" stroke="#c04030" stroke-width="1.2" stroke-linecap="round" opacity=".4"/>
    <path d="M17 17 C14 14 10 14 8 16 C6 18 7 20 10 19 L17 18" fill="#c04030" opacity=".4"/>
    <path d="M39 17 C42 14 46 14 48 16 C50 18 49 20 46 19 L39 18" fill="#c04030" opacity=".4"/>
    <line x1="19" y1="24" x2="14" y2="29" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
    <line x1="20" y1="26" x2="16" y2="32" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
    <line x1="22" y1="27" x2="20" y2="34" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
    <line x1="37" y1="24" x2="42" y2="29" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
    <line x1="36" y1="26" x2="40" y2="32" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
    <line x1="34" y1="27" x2="36" y2="34" stroke="#c04030" stroke-width="1" stroke-linecap="round" opacity=".3"/>
  </svg></div>
  <div class="tt-vignette"></div>
</div>

<!-- Broadcast bar -->
<div class="tt-broadcast">
  <div class="tt-live"><div class="tt-live-dot"></div>LIVE</div>
  <div class="tt-ticker"><div class="tt-ticker-text">TROPICAL TAKEDOWN — Cliff dive into shark-infested waters, retrieve golden chains, then race longboards down a volcanic slope — only the fastest tribe survives</div></div>
  <div class="tt-channel">TT&bull;TV</div>
</div>

<!-- Main content area -->
<div class="tt-main" style="position:relative;z-index:1;padding-bottom:70px;">
${content}
</div>

<!-- Sidebar -->
${sidebar}

</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// VP: BUILDER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

function _cardHTML(cardCls, iconType, label, badge, badgeCls, text, animType, extra = '') {
  const fxLayer = _cardFX(cardCls, animType);
  return `<div class="tt-card tt-card-${cardCls}" data-anim="${animType}" onclick="this.classList.remove('tt-anim-${animType}');void this.offsetWidth;this.classList.add('tt-anim-${animType}')">
    ${fxLayer}<div class="tt-hdr">${_icon(iconType)}<div class="tt-label">${label}</div><div class="tt-badge tt-badge-${badgeCls}">${badge}</div></div>
    <div class="tt-txt">${text}</div>${extra}
  </div>`;
}

function _cardFX(cardCls, animType) {
  if (animType === 'tag-slap') {
    return `<div class="tt-fx-slap"><svg viewBox="0 0 20 20" width="16" height="16"><path d="M5,18 L10,8 L8,8 L12,2 L10,2 L14,0 L12,6 L14,6 L10,14 L12,14 Z" fill="rgba(255,220,100,.4)"/></svg></div>`;
  }
  if (animType === 'dive-drop' || animType === 'bellyflop') {
    return `<div class="tt-fx-diver tt-fx-diver-${animType === 'bellyflop' ? 'flop' : 'clean'}"><svg viewBox="0 0 24 40" width="18" height="30"><circle cx="12" cy="5" r="4" fill="rgba(240,232,216,.6)"/><line x1="12" y1="9" x2="12" y2="22" stroke="rgba(240,232,216,.6)" stroke-width="2"/><line x1="12" y1="14" x2="6" y2="19" stroke="rgba(240,232,216,.6)" stroke-width="1.5"/><line x1="12" y1="14" x2="18" y2="19" stroke="rgba(240,232,216,.6)" stroke-width="1.5"/><line x1="12" y1="22" x2="8" y2="32" stroke="rgba(240,232,216,.6)" stroke-width="1.5"/><line x1="12" y1="22" x2="16" y2="32" stroke="rgba(240,232,216,.6)" stroke-width="1.5"/></svg></div><div class="tt-fx-splash-drops"><span></span><span></span><span></span><span></span><span></span></div>`;
  }
  if (animType === 'eel') {
    return `<div class="tt-fx-zap"></div>`;
  }
  if (animType === 'shark') {
    return `<div class="tt-fx-fin"><svg viewBox="0 0 30 20" width="22" height="14"><path d="M2,18 Q8,2 15,1 Q18,4 20,10 Q22,14 28,18 Z" fill="rgba(100,110,120,.35)"/></svg></div>`;
  }
  if (animType === 'chain-glow') {
    return `<div class="tt-fx-gleam"></div>`;
  }
  if (animType === 'steal') {
    return `<div class="tt-fx-redflash"></div>`;
  }
  if (animType === 'collision') {
    return `<div class="tt-fx-impact">&#x2605;</div>`;
  }
  return '';
}

function _tribeHeader(tribeName) {
  const col = tribeColor(tribeName);
  return `<div class="tt-card-tribe" style="color:${col};border-color:${col}20"><span class="tt-sb-tribe" style="background:${col}"></span> ${tribeName.toUpperCase()}</div>`;
}

function _scoreBar(label, labelColor, pct, fillCls, val, valCls) {
  return `<div class="tt-score-bar"><span style="font-size:10px;color:${labelColor};width:24px;">${label}</span><div class="tt-strack"><div class="tt-sfill tt-sfill-${fillCls}" style="width:${pct}%"></div></div><span class="tt-sval tt-sval-${valCls}">${val}</span></div>`;
}

// ── Title Card ──────────────────────────────────────────────────────

export function rpBuildTTTitleCard(ep) {
  const data = ep.tropicalTakedown;
  if (!data) return '<div>No challenge data</div>';

  const stKey = 'tt-title';
  const st = _ensureState(stKey, 1);

  // Build team blocks with avatars
  const teamsHTML = data.tribes.map(td => {
    const col = tribeColor(td.tribeName);
    const avatars = td.tribeMembers.map(n => {
      const slug = players.find(p => p.name === n)?.slug || n.toLowerCase();
      return `<img class="tt-team-av" style="border-color:${col}" src="assets/avatars/${slug}.png" alt="${n}" onerror="this.style.display='none'">`;
    }).join('');
    return `<div class="tt-team-block"><div class="tt-team-name" style="color:${col}">${td.tribeName.toUpperCase()}</div><div class="tt-team-av-row">${avatars}</div></div>`;
  }).join('');

  // Cliff players + diver
  const allPlayers = data.tribes.flatMap(td => td.tribeMembers);
  const _shuffled = allPlayers.slice().sort(() => Math.random() - 0.5);
  const cliffPlayers = _shuffled.slice(0, Math.min(7, _shuffled.length));
  const diverPlayer = _shuffled[Math.min(7, _shuffled.length)] || _shuffled[0];
  const stanceClasses = ['tt-stance-brave', 'tt-stance-scared', 'tt-stance-pumped'];
  const cliffHTML = cliffPlayers.map((n, i) => {
    const slug = players.find(p => p.name === n)?.slug || n.toLowerCase();
    const arch = players.find(p => p.name === n)?.archetype || '';
    let stance;
    if (['villain', 'mastermind', 'schemer'].includes(arch)) stance = 'tt-stance-brave';
    else if (['challenge-beast', 'hero', 'hothead'].includes(arch)) stance = 'tt-stance-pumped';
    else stance = stanceClasses[Math.floor(Math.random() * stanceClasses.length)];
    const left = 20 + (i * 55 / Math.max(cliffPlayers.length - 1, 1));
    const top = 6 + Math.random() * 1.5;
    return `<div class="tt-cliff-player ${stance}" style="top:${top.toFixed(1)}%;left:${left.toFixed(1)}%;"><img src="assets/avatars/${slug}.png" alt="${n}" style="width:28px;height:28px;" onerror="this.style.display='none'"><div class="tt-cliff-player-name">${n.toUpperCase()}</div></div>`;
  }).join('');
  const diverSlug = players.find(p => p.name === diverPlayer)?.slug || diverPlayer.toLowerCase();
  const diverHTML = `<div class="tt-diver" style="left:45%;"><img src="assets/avatars/${diverSlug}.png" alt="${diverPlayer}"><div class="tt-diver-splash"></div></div>`;

  // Underwater elements
  const chains = `<div class="tt-deep-chain" style="top:52%;left:25%;"></div><div class="tt-deep-chain" style="top:62%;left:55%;animation-delay:1.5s;"></div><div class="tt-deep-chain" style="top:70%;left:75%;animation-delay:3s;"></div>`;
  const sharks = `<div class="tt-deep-shark" style="top:58%;left:15%;"></div><div class="tt-deep-shark tt-deep-shark-2" style="top:72%;left:60%;"></div>`;
  const eels = `<div class="tt-deep-eel" style="top:78%;left:35%;"></div><div class="tt-deep-eel" style="top:85%;left:70%;animation-delay:1s;"></div>`;

  const epNum = gs.episodeHistory ? gs.episodeHistory.length : 1;
  const coldOpen = pick([
    `"Dive off a cliff, dodge some sharks, grab a chain, and ride a board down a mountain. First one to survive wins!"`,
    `"Two phases. One involves shark-infested water. The other involves a track that's literally falling apart. Good luck."`,
    `"The chains are golden, the eels are electric, and the boards are barely functional. This is gonna be legendary."`,
    `"Welcome to the most dangerous pre-merge challenge we've ever built. Try not to die."`,
  ]);

  const content = `<div class="tt-title-bg">
    <div class="tt-title-scene">
      <div class="tt-scene-sky"></div>
      <div class="tt-scene-cliff"></div>
      <div class="tt-scene-ledge"></div>
      <div class="tt-scene-ocean-surface"></div>
      ${cliffHTML}
      ${diverHTML}
      <div class="tt-scene-ocean"></div>
      ${chains}${sharks}${eels}
      <div class="tt-title-track"></div>
    </div>
    <div class="tt-title-overlay">
      <div class="tt-title-sub">PRE-MERGE CHALLENGE</div>
      <div class="tt-title-main">TROPICAL<br>TAKEDOWN</div>
      <div class="tt-title-episode">EPISODE ${epNum} — PRE-MERGE</div>
      <div class="tt-title-cold">${coldOpen}</div>
    </div>
    <div class="tt-teams-row" style="position:absolute;bottom:60px;left:0;right:0;">${teamsHTML}</div>
    <div class="tt-insert-coin" style="position:absolute;bottom:20px;left:0;right:0;">&#9658; PRESS REVEAL TO START &#9668;</div>
  </div>`;

  window._ttCaptainStepMeta = [];
  window._ttDiveStepMeta = [];
  window._ttChainStepMeta = [];
  window._ttRaceStepMeta = [];

  return _shell(content, ep, '', 'title');
}

// ── Captain Draft ───────────────────────────────────────────────────

export function rpBuildTTCaptainDraft(ep) {
  const data = ep.tropicalTakedown;
  if (!data) return '<div>No challenge data</div>';

  const stKey = 'tt-captain';
  const steps = [];
  const stepMeta = [];

  data.tribes.forEach((td, ti) => {
    if (ti > 0) steps.push({ html: '<div class="tt-vine"></div>', meta: { type: 'divider' } });

    // Tribe header
    steps.push({ html: _tribeHeader(td.tribeName), meta: { type: 'tribe-header', tribe: td.tribeName } });

    // Beat 1: Nominations — who steps up, who backs down
    td.captain.nominations.forEach(nom => {
      const badgeMap = { aggressive: 'SEIZES CONTROL', heroic: 'VOLUNTEERS', reluctant: 'DRAFTED', schemer: 'MANEUVERS' };
      steps.push({
        html: _cardHTML('captain', 'captain', 'Nomination', badgeMap[nom.style] || 'STEPS UP', 'captain', nom.text, 'splash'),
        meta: { type: 'nomination', tribe: td.tribeName, player: nom.player },
      });
    });

    // Dodgers — players who refuse
    td.captain.dodgers.forEach(dodge => {
      steps.push({
        html: _cardHTML('social', 'social', 'Backs Away', 'NOPE', 'social', dodge.text, 'splash'),
        meta: { type: 'dodge', tribe: td.tribeName, player: dodge.player },
      });
    });

    // Beat 2: The vote/decision
    const voteLabel = { contested: 'Contested Vote', unanimous: 'Unanimous Decision', volunteered: 'Self-Appointed', default: 'Captain by Default' };
    const voteBadge = { contested: 'SPLIT VOTE', unanimous: 'UNANIMOUS', volunteered: 'CLAIMED', default: 'LAST RESORT' };
    steps.push({
      html: _cardHTML('captain', 'captain', voteLabel[td.captain.voteStyle] || 'Captain Elected', voteBadge[td.captain.voteStyle] || 'CAPTAIN', 'captain', td.captain.voteText, 'splash'),
      meta: { type: 'captain-elect', tribe: td.tribeName },
    });

    // Beat 3: Reactions
    const reactionIcons = { support: 'social', skeptic: 'social', bitter: 'collision', nervous: 'social', 'alliance-whisper': 'steal' };
    const reactionLabels = { support: 'Backing the Captain', skeptic: 'Not Convinced', bitter: 'Bitter Rival', nervous: 'Dread Setting In', 'alliance-whisper': 'Whispered Alliance' };
    const reactionBadges = { support: 'SUPPORT', skeptic: 'DOUBT', bitter: 'GRUDGE', nervous: 'PANIC', 'alliance-whisper': 'PLOTTING' };
    const reactionBadgeCls = { support: 'pass', skeptic: 'social', bitter: 'fail', nervous: 'social', 'alliance-whisper': 'steal' };
    td.captain.reactions.forEach(r => {
      steps.push({
        html: _cardHTML(r.type === 'bitter' ? 'collision' : 'social', reactionIcons[r.type] || 'social',
          reactionLabels[r.type] || 'Reaction', reactionBadges[r.type] || 'REACT',
          reactionBadgeCls[r.type] || 'social', r.text, r.type === 'bitter' ? 'collision' : 'splash'),
        meta: { type: 'reaction', tribe: td.tribeName, player: r.player, reactionType: r.type },
      });
    });

    // Beat 4: Captain's first move
    steps.push({
      html: _cardHTML('captain', 'captain', 'Taking Command', 'ORDERS', 'captain', td.captain.firstMoveText, 'splash'),
      meta: { type: 'first-move', tribe: td.tribeName },
    });

    // Dive order debates (kept from before)
    td.diveOrderDebates.forEach(debate => {
      steps.push({
        html: _cardHTML('social', 'social', 'Dive Order Debate', 'DEBATE', 'social', debate.text, 'splash'),
        meta: { type: 'debate', tribe: td.tribeName },
      });
    });
  });

  const stepsHTML = steps.map((s, i) => `<div id="tt-step-captain-${i}" class="tt-step-hidden">${s.html}</div>`).join('');
  window._ttCaptainStepMeta = steps.map(s => s.meta);

  const total = steps.length;
  const controls = `<div id="tt-controls-captain" class="tt-controls">
    <button class="tt-btn" onclick="window.ttRevealNext('tt-captain',${total})">REVEAL NEXT</button>
    <span class="tt-counter" id="tt-counter-captain">0 / ${total}</span>
    <button class="tt-btn" onclick="window.ttRevealAll('tt-captain',${total})">REVEAL ALL</button>
  </div>`;

  const content = `<div class="tt-phase-hdr">
    <div class="tt-phase-tag">PRE-CHALLENGE</div>
    <div class="tt-phase-title">Captain Draft</div>
    <div class="tt-phase-sub">Each tribe elects a captain who assigns dive order and longboard pairings. Choose wisely — or face the backlash.</div>
  </div>
  ${stepsHTML}
  ${controls}`;

  return _shell(content, ep, '', 'captain');
}

// ── Deep Dive Relay (Merged Phase 1) ──────────────────────────

export function rpBuildTTCliffDive(ep) {
  const data = ep.tropicalTakedown;
  if (!data) return '<div>No challenge data</div>';

  const stKey = 'tt-dive';
  const steps = [];

  // Opening chatter
  steps.push({
    html: `<div class="tt-chatter"><span class="tt-chatter-host">${host().toUpperCase()}:</span> "${pick(TXT_CHATTER)().replace(/.*?"/, '').replace(/"$/, '')}"</div>`,
    meta: { type: 'chatter' },
  });

  // Interleave tribe dives per round
  const maxDivers = Math.max(...data.tribes.map(t => t.dives.length));
  for (let diveIdx = 0; diveIdx < maxDivers; diveIdx++) {
    // Round header
    steps.push({
      html: `<div class="tt-card-tribe" style="color:var(--tt-chain);border-color:rgba(192,168,72,.25);background:rgba(192,168,72,.06)"><span style="font-size:10px;opacity:.6;">TAG RELAY</span> DIVER ${diveIdx + 1}</div>`,
      meta: { type: 'round-header' },
    });

    // Each tribe's diver for this round
    data.tribes.forEach(td => {
      if (diveIdx >= td.dives.length) return;
      const dive = td.dives[diveIdx];
      const col = tribeColor(td.tribeName);
      const abbr = td.tribeName.substring(0, 2).toUpperCase();

      // Tag card
      if (dive.tagEvent) {
        const tagBadge = dive.tagEvent.type === 'launch' ? 'FIRST UP' : (dive.tagEvent.fumbled ? 'FUMBLED' : 'SMOOTH TAG');
        const tagBadgeCls = dive.tagEvent.fumbled ? 'fail' : 'pass';
        const tagCls = dive.tagEvent.fumbled ? 'fail' : 'success';
        steps.push({
          html: _cardHTML(tagCls, 'dive', `Tag <span style="color:${col}">${abbr}</span>`, tagBadge, tagBadgeCls, dive.tagEvent.text, dive.tagEvent.fumbled ? 'tag-fumble' : 'tag-slap'),
          meta: { type: 'tag', tribe: td.tribeName, diver: dive.diver, fumbled: dive.tagEvent.fumbled },
        });
      }

      // Dive card
      const capTag = dive.isCaptain ? ' <span style="color:var(--tt-warning);font-size:9px;letter-spacing:1px;vertical-align:middle">CPT</span>' : '';
      const diveBadge = dive.isCaptain
        ? (dive.isStrong ? 'CAPTAIN NAILS IT' : 'CAPTAIN CHOKES')
        : (dive.isStrong ? 'CLEAN ENTRY' : 'BELLY FLOP');
      const diveBadgeCls = dive.isStrong ? 'pass' : 'fail';
      const anim = dive.isStrong ? 'dive-drop' : 'bellyflop';
      const scoreExtra = _scoreBar(abbr, col, dive.diveScore * 10, dive.isStrong ? 'g' : 'd', dive.diveScore.toFixed(1), dive.isStrong ? 'g' : 'd');
      steps.push({
        html: _cardHTML('dive', 'dive', `${dive.diver}${capTag} <span style="color:${col}">${abbr}</span>`, diveBadge, diveBadgeCls, dive.diveText, anim, scoreExtra),
        meta: { type: 'dive', tribe: td.tribeName, score: dive.diveScore, diver: dive.diver, isCaptain: dive.isCaptain },
      });

      // Hazard cards
      dive.hazards.forEach(haz => {
        const hazLabel = haz.type === 'shark' ? 'Shark Patrol!' : 'Eel Strike!';
        const hazBadge = haz.type === 'shark' ? 'SHARK' : 'ZAPPED';
        const hazBadgeCls = haz.type === 'shark' ? 'shark' : 'eel';
        steps.push({
          html: _cardHTML(haz.type === 'shark' ? 'shark' : 'eel', haz.type, hazLabel, hazBadge, hazBadgeCls, haz.text, haz.type === 'shark' ? 'shark' : 'eel'),
          meta: { type: haz.type, tribe: td.tribeName, diver: dive.diver },
        });
      });

      // Chain result card
      if (dive.chainResult) {
        if (dive.chainResult.type === 'chain-found') {
          steps.push({
            html: _cardHTML('chain', 'chain', `Chain Found! <span style="color:${col}">${abbr}</span>`, 'GOLD CHAIN', 'chain', dive.chainResult.text, 'chain-glow'),
            meta: { type: 'chain-found', tribe: td.tribeName, diver: dive.diver },
          });
        } else if (dive.chainResult.type === 'decoy') {
          steps.push({
            html: _cardHTML('chain', 'chain', `Decoy Chain <span style="color:${col}">${abbr}</span>`, 'DECOY', 'decoy', dive.chainResult.text, 'swim'),
            meta: { type: 'decoy', tribe: td.tribeName, diver: dive.diver },
          });
        } else if (dive.chainResult.type === 'nothing') {
          steps.push({
            html: _cardHTML('dive', 'dive', `Empty Dive <span style="color:${col}">${abbr}</span>`, 'NOTHING', 'fail', dive.chainResult.text, 'swim'),
            meta: { type: 'nothing', tribe: td.tribeName, diver: dive.diver },
          });
        }
      }

      // Surface steal card
      if (dive.surfaceSteal) {
        const st = dive.surfaceSteal;
        const stealCol = tribeColor(st.stealerTribe);
        steps.push({
          html: _cardHTML('steal', 'steal', 'Surface Steal!', 'STOLEN', 'steal', st.text, 'steal'),
          meta: { type: 'surface-steal', stealer: st.stealer, victim: st.victim, stealerTribe: st.stealerTribe },
        });
      }

      // Helmets triggered mid-stream
      if (dive.helmetsTriggered) {
        const hCol = tribeColor(dive.helmetsTriggered);
        const hTd = data.tribes.find(t => t.tribeName === dive.helmetsTriggered);
        steps.push({
          html: _cardHTML('captain', 'helmet', 'Helmet Advantage', 'HELMETS WON', 'helmet',
            `<strong style="color:${hCol}">${dive.helmetsTriggered}</strong> retrieved ${hTd?.chainHunt.realChains || 2} chains first — they earn protective helmets for the longboard race!`, 'chain-glow'),
          meta: { type: 'helmet-award', tribe: dive.helmetsTriggered },
        });
      }
    });

    // Social events for this dive round (collisions, underwater steals, encouragement, etc.)
    const diveSocials = (data.socialEvents || []).filter(se => se.phase === 'dive' && se.diveIdx === diveIdx);
    diveSocials.forEach(se => {
      let cardCls, iconType, label, badge, badgeCls, animType;
      if (se.type === 'underwater-steal') {
        cardCls = 'steal'; iconType = 'steal'; label = 'Underwater Steal!'; badge = 'CHAIN GRABBED'; badgeCls = 'steal'; animType = 'steal';
      } else if (se.type === 'collision') {
        cardCls = 'collision'; iconType = 'collision'; label = 'Underwater Collision!'; badge = 'IMPACT'; badgeCls = 'collision'; animType = 'collision';
      } else if (se.type === 'showmance') {
        cardCls = 'social'; iconType = 'social'; label = 'Showmance Moment'; badge = 'BOND +2'; badgeCls = 'social'; animType = 'swim';
      } else if (se.type === 'encouragement') {
        cardCls = 'social'; iconType = 'social'; label = 'Encouragement'; badge = 'SOCIAL'; badgeCls = 'social'; animType = 'swim';
      } else {
        cardCls = 'social'; iconType = 'social'; label = se.type === 'taunt' ? 'Cross-Tribe Taunt' : 'Social'; badge = 'TENSION'; badgeCls = 'social'; animType = 'swim';
      }
      steps.push({
        html: _cardHTML(cardCls, iconType, label, badge, badgeCls, se.text, animType),
        meta: { type: se.type },
      });
    });

    // Between-dive chatter (~40%)
    if (diveIdx < maxDivers - 1 && Math.random() < 0.4) {
      steps.push({
        html: `<div class="tt-chatter"><span class="tt-chatter-host">${host().toUpperCase()}:</span> "${pick(TXT_CHATTER)().replace(/.*?"/, '').replace(/"$/, '')}"</div>`,
        meta: { type: 'chatter' },
      });
    }
  }

  // General social events without specific diveIdx
  const generalDiveSocials = (data.socialEvents || []).filter(se => se.phase === 'dive' && se.diveIdx === undefined);
  generalDiveSocials.forEach(se => {
    const cardCls = se.type === 'collision' ? 'collision' : 'social';
    const label = se.type === 'showmance' ? 'Showmance Moment' : (se.type === 'encouragement' ? 'Encouragement' : (se.type === 'taunt' ? 'Cross-Tribe Taunt' : 'Social'));
    steps.push({
      html: _cardHTML(cardCls, se.type === 'collision' ? 'collision' : 'social', label, 'SOCIAL', 'social', se.text, 'swim'),
      meta: { type: se.type },
    });
  });

  // If helmets weren't awarded mid-stream (fallback — most chains wins)
  if (!data.tribes.some(td => td.dives.some(d => d.helmetsTriggered))) {
    const helmetCol = tribeColor(data.helmetTribe || '');
    const hTd = data.tribes.find(t => t.tribeName === data.helmetTribe);
    steps.push({
      html: _cardHTML('captain', 'helmet', 'Helmet Advantage', 'HELMETS WON', 'helmet',
        `<strong style="color:${helmetCol}">${data.helmetTribe}</strong> found the most chains — they earn protective helmets for the longboard race!`, 'chain-glow'),
      meta: { type: 'helmet-award', tribe: data.helmetTribe },
    });
  }

  // Phase 1 complete chatter
  steps.push({
    html: `<div class="tt-chatter"><span class="tt-chatter-host">${host().toUpperCase()}:</span> "Phase 1 complete! Now let's see if those helmets are worth it on the volcano slope."</div>`,
    meta: { type: 'chatter' },
  });

  const stepsHTML = steps.map((s, i) => `<div id="tt-step-dive-${i}" class="tt-step-hidden">${s.html}</div>`).join('');
  window._ttDiveStepMeta = steps.map(s => s.meta);

  const total = steps.length;
  const controls = `<div id="tt-controls-dive" class="tt-controls">
    <button class="tt-btn" onclick="window.ttRevealNext('tt-dive',${total})">REVEAL NEXT</button>
    <span class="tt-counter" id="tt-counter-dive">0 / ${total}</span>
    <button class="tt-btn" onclick="window.ttRevealAll('tt-dive',${total})">REVEAL ALL</button>
  </div>`;

  const content = `<div class="tt-phase-hdr">
    <div class="tt-phase-tag">PHASE 1</div>
    <div class="tt-phase-title">Deep Dive Relay</div>
    <div class="tt-phase-sub">Tag-relay off the cliff, dive into shark-infested waters, and retrieve golden chains from the lagoon floor. First tribe to 2 chains wins helmets.</div>
  </div>
  ${stepsHTML}
  ${controls}`;

  return _shell(content, ep, '', 'dive');
}

// Keep backward-compatible export for existing imports
export const rpBuildTTChainHunt = rpBuildTTCliffDive;

// ── Longboard Race ──────────────────────────────────────────────────

export function rpBuildTTLongboardRace(ep) {
  const data = ep.tropicalTakedown;
  if (!data) return '<div>No challenge data</div>';

  const stKey = 'tt-race';
  const steps = [];

  // Helmet advantage card
  const helmetCol = tribeColor(data.helmetTribe || '');
  steps.push({
    html: _cardHTML('captain', 'helmet', 'Helmet Advantage', 'PROTECTED', 'helmet',
      `<strong style="color:${helmetCol}">${data.helmetTribe}</strong> earned helmets from their Phase 1 chain haul. Crash penalties halved — their riders can push harder through every section.`, 'board-slide'),
    meta: { type: 'helmet', trackCondition: 100 },
  });

  // Race rounds
  data.raceRounds.forEach((round, ri) => {
    steps.push({
      html: '<div class="tt-vine"></div>',
      meta: { type: 'divider' },
    });

    steps.push({
      html: `<div class="tt-card-tribe" style="color:var(--tt-chain);border-color:rgba(192,168,72,.25);background:rgba(192,168,72,.06)"><span style="font-size:10px;opacity:.6;">ALL TRIBES</span> ROUND ${round.round}</div>`,
      meta: { type: 'round-header', trackCondition: round.trackCondition },
    });

    // Runs per tribe — multi-beat section narration
    round.runs.forEach(run => {
      const col = tribeColor(run.tribe);
      const abbr = run.tribe.substring(0, 2).toUpperCase();
      const isCrash = run.crashed;

      // Card type based on crash section severity
      let cardCls, iconType, label, badge, badgeCls, anim;
      if (isCrash) {
        const isDeathDrop = run.crashSection === 'Death Drop';
        cardCls = isDeathDrop ? 'fail' : 'crash';
        iconType = 'crash';
        label = isDeathDrop ? 'WIPEOUT at Death Drop!' : `Crash at ${run.crashSection}!`;
        badge = `+${(run.time - 8).toFixed(1)}s`;
        badgeCls = 'fail';
        anim = isDeathDrop ? 'wipeout' : 'crash';
      } else {
        cardCls = 'board';
        iconType = 'board';
        label = 'Downhill Run';
        badge = `${run.time}s`;
        badgeCls = run.time < 9 ? 'pass' : 'fast';
        anim = 'board-slide';
      }

      // Section progress bar: shows which sections passed/failed
      const sectionBar = (run.sections || []).map(sec => {
        const secIdx = TRACK_SECTIONS.findIndex(s => s.name === sec.name);
        if (sec.skipped) return `<span class="tt-sec-pip tt-sec-skip" title="${sec.name}"></span>`;
        if (sec.crashed) return `<span class="tt-sec-pip tt-sec-crash" title="${sec.name}: ${sec.crashType}"></span>`;
        return `<span class="tt-sec-pip tt-sec-pass" title="${sec.name}"></span>`;
      }).join('');
      const sectionBarHTML = `<div class="tt-sec-bar"><span class="tt-sec-labels" style="font-size:8px;color:var(--tt-muted);letter-spacing:.5px">${TRACK_SECTIONS.map(s => s.name.split(' ')[0].substring(0, 4).toUpperCase()).join(' ')}</span><div class="tt-sec-pips">${sectionBar}</div></div>`;

      const timeBar = _scoreBar(abbr, col, Math.max(5, (20 - run.time) / 12 * 100), isCrash ? 'd' : (run.time < 10 ? 'g' : 'w'), `${run.time}s`, isCrash ? 'd' : (run.time < 10 ? 'g' : 'w'));
      steps.push({
        html: _cardHTML(cardCls, iconType, `${run.rider1} + ${run.rider2} <span style="color:${col}">${abbr}</span>`, badge, badgeCls, run.text, anim, sectionBarHTML + timeBar),
        meta: { type: 'run', tribe: run.tribe, time: run.time, crashed: run.crashed, crashSection: run.crashSection, round: round.round, trackCondition: round.trackCondition, rider1: run.rider1, rider2: run.rider2, sections: run.sections },
      });
    });

    // Social events for this round
    round.socialEvents.forEach(se => {
      let iconType, cardCls, label, badge, badgeCls, anim;
      if (se.type === 'sabotage') {
        iconType = 'collision'; cardCls = 'collision';
        label = se.sabotageType === 'targeted' ? `Targeted Sabotage — ${se.section}` : `Track Hazard — ${se.section}`;
        badge = se.sabotageType === 'targeted' ? 'PRECISION' : 'CHAOS';
        badgeCls = 'collision'; anim = 'collision';
      } else {
        iconType = 'social'; cardCls = 'social';
        label = se.type === 'blame' ? 'Pair Blame' : (se.type === 'celebrate' ? 'Pair Celebration' : (se.type === 'taunt' ? 'Cross-Tribe Taunt' : 'Social'));
        badge = se.type === 'blame' ? 'TENSION' : (se.type === 'celebrate' ? 'BOND +1' : 'SOCIAL');
        badgeCls = 'social'; anim = 'board-slide';
      }
      steps.push({
        html: _cardHTML(cardCls, iconType, label, badge, badgeCls, se.text, anim),
        meta: { type: se.type, sabotageSection: se.section, sabotageType: se.sabotageType, targetTribe: se.targetTribe },
      });
    });

    // Track degradation card if not last round
    if (ri < data.raceRounds.length - 1) {
      const nextTrack = data.raceRounds[ri + 1]?.trackCondition || round.trackCondition - 10;
      const pct = Math.round(nextTrack);
      steps.push({
        html: _cardHTML('crash', 'crash', 'Track Degradation', `${pct}%`, 'fail',
          `The volcanic gravel is coming loose. Crash chances have increased as the track deteriorates to ${pct}% integrity.`, 'crash'),
        meta: { type: 'track-degrade', trackCondition: nextTrack },
      });
    }

    // Between-round chatter
    if (ri < data.raceRounds.length - 1) {
      steps.push({
        html: `<div class="tt-chatter"><span class="tt-chatter-host">${host().toUpperCase()}:</span> "${pick(TXT_CHATTER)().replace(/.*?"/, '').replace(/"$/, '')}"</div>`,
        meta: { type: 'chatter' },
      });
    }
  });

  const stepsHTML = steps.map((s, i) => `<div id="tt-step-race-${i}" class="tt-step-hidden">${s.html}</div>`).join('');
  window._ttRaceStepMeta = steps.map(s => s.meta);

  const total = steps.length;
  const controls = `<div id="tt-controls-race" class="tt-controls">
    <button class="tt-btn" onclick="window.ttRevealNext('tt-race',${total})">REVEAL NEXT</button>
    <span class="tt-counter" id="tt-counter-race">0 / ${total}</span>
    <button class="tt-btn" onclick="window.ttRevealAll('tt-race',${total})">REVEAL ALL</button>
  </div>`;

  const content = `<div class="tt-phase-hdr">
    <div class="tt-phase-tag">PHASE 2</div>
    <div class="tt-phase-title">Longboard Race</div>
    <div class="tt-phase-sub">Paired riders descend a 5-section volcanic bobsled chute: Launch Ramp, Snake Bend, Lava Gulch, Death Drop, Pool Landing. 3 rounds. Helmets halve crash penalties. Saboteurs plant traps.</div>
  </div>
  ${stepsHTML}
  ${controls}`;

  return _shell(content, ep, '', 'race');
}

// ── Results ─────────────────────────────────────────────────────────

export function rpBuildTTResults(ep) {
  const data = ep.tropicalTakedown;
  if (!data) return '<div>No challenge data</div>';

  const stKey = 'tt-results';
  const steps = [];

  const placements = ['1ST', '2ND', '3RD', '4TH'];
  const pillCls = ['pass', 'captain', 'fail'];
  const anim = ['victory', 'victory', 'wipeout'];

  // Winner announcement
  data.finalRanking.forEach((tribeName, idx) => {
    const td = data.tribes.find(t => t.tribeName === tribeName);
    const col = tribeColor(tribeName);
    const time = td ? td.totalRaceTime.toFixed(1) : '—';
    const isWinner = idx === 0;
    const isLoser = idx === data.finalRanking.length - 1;

    let cardCls = isWinner ? 'success' : (isLoser ? 'fail' : 'captain');
    let iconType = isWinner ? 'trophy' : (isLoser ? 'crash' : 'trophy');
    let label = isWinner ? 'Tribal Immunity!' : (isLoser ? 'Tribal Council' : 'Runner-Up');
    let badge = isWinner ? 'SAFE' : (isLoser ? 'LAST PLACE' : 'SAFE');
    let badgeCls = isWinner ? 'pass' : (isLoser ? 'fail' : 'captain');

    let description;
    if (isWinner) {
      description = `<strong style="color:${col}">${tribeName}</strong> finishes with the lowest aggregate time — ${time} seconds across 3 rounds.${td?.hasHelmet ? ' Helmets saved them precious seconds in crash reductions.' : ''} The tribe is <strong>SAFE</strong>.`;
    } else if (isLoser) {
      description = `<strong style="color:${col}">${tribeName}</strong> couldn't keep up — ${time} seconds total. They face tribal council tonight.`;
    } else {
      description = `<strong style="color:${col}">${tribeName}</strong> squeezes through — ${time} seconds. They avoid tribal council.`;
    }

    // Score bars for all tribes on winner card
    let extra = '';
    if (isWinner) {
      extra = '<div style="margin-top:8px;">';
      data.finalRanking.forEach((tn, ri) => {
        const rtd = data.tribes.find(t => t.tribeName === tn);
        const rtime = rtd ? rtd.totalRaceTime.toFixed(1) : '0';
        const rcol = tribeColor(tn);
        const rabbr = tn.substring(0, 2).toUpperCase();
        const maxTime = Math.max(...data.tribes.map(t => t.totalRaceTime));
        const pct = maxTime > 0 ? Math.max(5, (1 - (rtd?.totalRaceTime || 0) / (maxTime * 1.2)) * 100) : 50;
        const fillCls = ri === 0 ? 'g' : (ri === data.finalRanking.length - 1 ? 'd' : 'w');
        const valCls = ri === 0 ? 'g' : (ri === data.finalRanking.length - 1 ? 'd' : 'w');
        extra += _scoreBar(rabbr, rcol, pct, fillCls, `${rtime}s`, valCls);
      });
      extra += '</div>';
    }

    steps.push({
      html: `<div class="tt-card tt-card-${cardCls}" style="border-left-width:3px;" class="tt-anim-${anim[idx] || 'victory'}">
        <div class="tt-hdr">${_icon(iconType)}<div class="tt-label">${label}</div><div class="tt-badge tt-badge-${badgeCls}">${badge}</div></div>
        <div class="tt-txt">${description}</div>${extra}
      </div>`,
      meta: { type: 'result', tribe: tribeName },
    });
  });

  const stepsHTML = steps.map((s, i) => `<div id="tt-step-results-${i}" class="tt-step-hidden">${s.html}</div>`).join('');

  const total = steps.length;
  const controls = `<div id="tt-controls-results" class="tt-controls">
    <button class="tt-btn" onclick="window.ttRevealNext('tt-results',${total})">REVEAL NEXT</button>
    <span class="tt-counter" id="tt-counter-results">0 / ${total}</span>
    <button class="tt-btn" onclick="window.ttRevealAll('tt-results',${total})">REVEAL ALL</button>
  </div>`;

  const content = `<div class="tt-phase-hdr">
    <div class="tt-phase-tag">FINAL</div>
    <div class="tt-phase-title">Results</div>
    <div class="tt-phase-sub">Aggregate race times determine the winner. Tribal immunity for the fastest tribe.</div>
  </div>
  ${stepsHTML}
  ${controls}`;

  return _shell(content, ep, '', 'results');
}

// js/chal/tri-armed-triathlon.js — Trial by Tri-Armed Triathlon challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ══════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════

const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }

function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _rand(lo, hi) { return lo + Math.random() * (hi - lo); }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// Chemistry modifier (#8)
function _getChemMod(pair) {
  if (pair.archPair === 'showmance') return 2;
  if (pair.archPair === 'rivals') return -2;
  if (pair.archPair === 'villain_hero') return -1;
  const b = pair.bond;
  if (b >= 4) return 1;
  if (b <= -2) return -1;
  return 0;
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

const TA_CHRIS_INTROS = [
  `"Welcome to the Tri-Armed Triathlon! Three challenges. Three pairs. Three very unfortunate handcuffs." — Chris McLean`,
  `"Final group, final stretch. Today you're cuffed to somebody you may or may not like. Try not to kill each other. Try." — Chris McLean`,
  `"Listen up. Today's game is a triathlon. Handcuffed. The wimp key exists if you can't hack it — but it costs you invincibility." — Chris McLean`,
  `"Three events. Chowdown, Idol Haul, Totem Pole. Last pair standing — actually, FIRST pair finishing — wins invincibility." — Chris McLean`,
  `"You thought getting to the final few would be easy. It's not. Here's a handcuff. Don't lose the key. Actually, do lose the key." — Chris McLean`,
  `"Trial by Tri-Armed Triathlon! It sounds cooler than it is. It's about as cool as it sounds." — Chris McLean`,
];

const TA_PAIRING_FLAVOR = {
  villain_hero: [
    `A villain and a saint. This should go great.`,
    `The most cursed handcuff in the cast. Buckle in.`,
    `One of them will be plotting. The other will be praying.`,
    `Nobody picked this. That's the point.`,
  ],
  rivals: [
    `They haven't made eye contact since week three. Now they're cuffed.`,
    `Perfect. The two campers who most want each other gone.`,
    `Tension: immediate. Outcome: unclear.`,
    `A grudge, a chain, and three challenges to survive.`,
  ],
  showmance: [
    `The showmance gets to hold hands for real. Sort of.`,
    `They were already inseparable. Chris made it official.`,
    `Three challenges to either seal the bond or break the bed.`,
    `A chain instead of a wedding ring. Progress?`,
  ],
  strangers: [
    `They've said maybe four sentences to each other all season. Now they're shackled.`,
    `Two campers who barely know each other. Time to get acquainted.`,
    `New friendship forged in obligation. Or not.`,
    `The cast's most awkward pair, now with hardware.`,
  ],
  default: [
    `Another pair. Another challenge.`,
    `Fine. Whatever. Handcuffs on.`,
    `They're cuffed. They'll figure it out.`,
    `Two names, one chain, three problems.`,
  ],
};

// Cloche reveal pool (#7)
const CLOCHE_REVEAL_POOL = [
  `Chef whips off the cloches. Three platters: mystery meat, unidentified brown sauce, something that was once green chicken. The green chicken twitches.`,
  `Three platters. One smells like feet. One smells like feet and something else. The third one is just feet.`,
  `Chef lifts the cloches. Nobody moves for a second. The green chicken twitches. Then stops. Then twitches again.`,
  `The lids come off. One contestant immediately looks directly into the camera. Then looks at the platter. Then back at the camera.`,
];

// Role decision text pools (#6)
const TA_ROLE_DECISION_TEXTS = {
  armWrestle: [
    (a, b, winner) => `${a} and ${b} arm-wrestle for feeding rights. ${winner} wins the fork.`,
    (a, b, winner) => `"I'm feeding." "No, I'M feeding." They arm-wrestle. ${winner} won.`,
    (a, b, winner) => `Quick arm-wrestle. ${winner} takes the spoon. No argument. Well, one argument.`,
  ],
  bully: [
    (a, b, victim) => `${victim === a ? b : a} points the fork at ${victim}. "You're eating." ${victim} does not argue.`,
    (a, b, victim) => `"Eat." ${victim} stares at the plate. "EAT." ${victim} picks up the spoon.`,
    (a, b, victim) => `One person here has done this before. The other is about to find out what it involves.`,
  ],
  agree: [
    (a, b) => `They actually discuss it like adults. Higher endurance eats. Better reach feeds.`,
    (a, b) => `"You eat, I feed?" ${a} nods. They shake hands. The other pairs are confused.`,
    (a, b) => `Calm, rational assignment. Whoever has longer arms feeds.`,
  ],
  volunteer: [
    (a, b, vol) => `${vol} raises a hand. "I'll eat." The other one looks relieved. The platter does not look relieved.`,
    (a, b, vol) => `${vol}: "Give me the spoon. I've eaten worse." That tracks.`,
    (a, b, vol) => `Quiet sacrifice. ${vol} takes the plate. No argument. The platter looks concerned.`,
  ],
};

const TA_CHOWDOWN_TEXTS = {
  rhythm: [
    `They find a rhythm. Scoop. Swallow. Scoop. Swallow. It's almost choreographed.`,
    `Against every expectation, they sync up. The platter empties steadily.`,
    `The feeder has learned to aim. The eater has learned to open wide. It's working.`,
    `Something clicks. Whatever it is, the platter is disappearing fast.`,
  ],
  cheatCaught: [
    `The feeder sneaks their second arm out. Chris watches it happen on the monitor. "Disqualified that spoonful."`,
    `Both arms. Everyone sees. Chris adds five seconds.`,
    `The free arm comes out for half a second. Chef spots it immediately. "PENALTY SPOON."`,
  ],
  cheatSneaky: [
    `They use the other hand when nobody's looking. The platter empties suspiciously fast.`,
    `Two arms, angled carefully away from the camera. Nobody notices.`,
    `The second arm comes out quietly behind a napkin. Clean.`,
  ],
  grossOut: [
    `The green chicken MOVES on the fork. The eater gags. The feeder pauses, unsure what to do.`,
    `Whatever the mystery meat was, it is now on the eater's chin. The chin does not forgive.`,
    `The eater retches but doesn't quite vomit. The feeder keeps going anyway.`,
    `A piece of something unidentified slides off the spoon. The eater traces it with their eyes. Then regrets doing that.`,
    `The green chicken is cold. The eater stares at it. Then stares directly into the camera. Then eats it.`,
  ],
  smashFood: [
    `The feeder gives up on the spoon. They pick up the whole platter and smash it into their partner's face. It counts.`,
    `Desperate times. Whole tray. Full commitment. The eater is covered in something that might have been gravy.`,
    `The feeder goes full face-plant method. They are not sorry.`,
  ],
  vomit: [
    `The eater loses it. Vomit in the platter. Run is over.`,
    `The eater tries to push through. The eater's body disagrees. Platter is gone.`,
    `Three bites in. Then it all comes back up. The feeder backs away quickly.`,
  ],
};

const TA_IDOL_TEXTS = {
  canoeArg: [
    (a, b) => `${a} and ${b} argue about who paddles harder. Neither paddles.`,
    (a, b) => `${a} splashes ${b} with the paddle. Accident. Probably.`,
    (a, b) => `${b} says ${a} is steering wrong. ${a} says nothing and steers the same direction.`,
  ],
  canoeNav: [
    (a, b) => `${b} spots Boney Island through the mist. ${a} adjusts course. They're ahead.`,
    (a, b) => `${a} reads the shoreline. They cut the corner and save a full minute.`,
  ],
  canoeWeight: [
    (a, b) => `${a} mutters about the weight distribution. ${b} hears. ${b} does not forget.`,
    (a, b) => `The canoe lists noticeably. Someone makes a comment. Someone else does not take it well.`,
  ],
  canoeBond: [
    (a, b) => `Out in the middle of the lake, ${a} admits something ${b} wasn't expecting. They paddle in silence for a minute.`,
    (a, b) => `${b} apologizes for something from week two. ${a} didn't know they were still thinking about it.`,
  ],
  findPackage: [
    (a, b) => `${a} pries open the package. Inside: pieces of a cursed tiki idol. ${b} picks one up and flinches immediately.`,
    (a, b) => `The idol pieces are wet and smell like a septic tank. ${a} is going to complain about this later.`,
    (a, b) => `${b} unwraps it. "What is this?" "The idol." "It smells like it's been in a septic tank." "It has."`,
  ],
  findCurse: [
    (a, b) => `${b} suddenly feels off. The curse is apparently real.`,
    (a, b) => `${a} swears the idol piece is heavier now than when they picked it up.`,
    (a, b) => `${a} holds it for three seconds. Something in their knee immediately gives out.`,
  ],
  piggyStumble: [
    (a, b) => `${a} is carrying ${b}. ${a} steps on a root. They both go down.`,
    (a, b) => `The piggyback collapses halfway up the trail. ${b} lands badly.`,
    (a, b) => `${a}'s ankles give on the slick mud. ${b} topples off and they scramble back up together.`,
  ],
  piggyHeart: [
    (a, b) => `${b}, from on top of ${a}'s back: "I know we haven't talked much. Thanks for this." ${a} grunts, moved.`,
    (a, b) => `${a} realizes ${b} has been holding their breath to save weight. They both start laughing.`,
  ],
  piggyJoke: [
    (a, b) => `${b} yells "mush!" ${a} does not find it funny.`,
    (a, b) => `${a} pretends to stumble just to mess with ${b}. ${b} pretends to be unfazed. Neither is lying very well.`,
  ],
  caveSpider: [
    (a, b) => `A spider drops from the cave entrance. Spider on face. ${a} screams. They retreat twenty yards.`,
    (a, b) => `${b} opens their mouth at exactly the wrong moment. Spider encounter: personal.`,
  ],
  caveWooly: [
    (a, b) => `Wooly beavers surge out of the cave. ${a} and ${b} run. Nobody mentions what wooly beavers are.`,
    (a, b) => `Something large and fuzzy charges. It's not clear what. ${a} and ${b} abandon the cave mouth.`,
  ],
  caveClutch: [
    (a, b) => `${a} winds up from ten feet out and hurls the idol piece. It sails into the cave mouth. Challenge over.`,
    (a, b) => `${b} can't get close to the cave, so they throw the idol underhand. It lands perfectly. Somehow.`,
  ],
};

const TA_TOTEM_TEXTS = {
  badmouth: [
    (villain, partner, target) => `${villain} holds up ${target}'s head. "This one was a waste of a platter."`,
    (villain, partner, target) => `${villain}: "Oh, ${target}. Remember? Zero game. Zero threat. Barely a player."`,
    (villain, partner, target) => `${villain} holds up ${target}'s wooden head like a trophy. "Still couldn't save you."`,
  ],
  defend: [
    (hero, target) => `${hero} places ${target}'s head gently on the pile. "They were good."`,
    (hero, target) => `${hero}: "Hey — ${target} was funny. Don't talk about them like that."`,
    (hero, target) => `${hero} lingers on ${target}'s head for a moment. "They deserved better."`,
  ],
  confusion: [
    (a, b, x, y) => `${a} and ${b} stare at the heads for ${x} and ${y}. The eyes are identical. The mouths are identical. One of them was voted out first. Which?`,
    (a, b, x, y) => `${a} holds up ${x}. ${b} holds up ${y}. They look at each other. Neither knows.`,
    (a, b, x, y) => `"Is this ${x} or ${y}?" ${a} whispers. ${b} shrugs. "Does it matter?" "It matters a lot right now."`,
  ],
  carved: [
    (carver, target) => `${carver} quietly carves a tiny heart on the back of ${target}'s head when Chris isn't looking.`,
    (carver, target) => `${carver}'s fingers shake a little as they handle ${target}'s head. A small "+ ${carver[0]}" appears on the back.`,
    (carver, target) => `${carver} holds ${target}'s carved head a beat too long. No one says anything.`,
  ],
  breakdown: [
    (villain, hero) => `${villain} keeps badmouthing. ${hero} finally snaps: "I can't do this with you. I really can't."`,
    (villain, hero) => `${hero} throws down the head they're holding. "I'm done. I am DONE."`,
    (villain, hero) => `${hero} goes silent for thirty seconds. Then: "You know what? Do it yourself." ${villain} does not back down.`,
  ],
};

const TA_CHRIS_QUIPS = [
  `"I love this one." — Chris McLean`,
  `"That is NOT in the liability waiver." — Chris McLean`,
  `"This is great television." — Chris McLean`,
  `"Three events in, we could have a triple-tie situation." — Chris McLean`,
  `"The wimp key is real, people. Last chance!" — Chris McLean`,
  `"Somebody's going home tonight. Maybe everyone's going home tonight." — Chris McLean`,
  `"You're doing great. I mean, you're not. But sure." — Chris McLean`,
  `"Remember: the curse is totally real. Probably." — Chris McLean`,
];

const TA_AFTERMATH_SINGLE = [
  `The winning pair get their cuffs cut. The others head to tribal with targets on their backs.`,
  `Invincibility decided. The losing pairs already know one of them isn't sleeping in a bed tomorrow.`,
  `The handcuffs come off. The alliances go on. Same game, different hardware.`,
];

const TA_AFTERMATH_TRIPLE = [
  `Nobody wins. Everyone votes. Everyone can be voted. This is why Chris does this.`,
  `Triple-tie. Nobody is safe. Chris grins like he planned this. Maybe he did.`,
  `All three pairs win exactly one challenge each. It's a disaster. It's perfect.`,
];

// Expanded ticker (#19)
const TICKER_BASE = [
  'RULE: HANDCUFFS STAY ON. WIMP KEY EXISTS.',
  'RULE: WIMP KEY = FREEDOM + NO INVINCIBILITY.',
  'RULE: BOTH PARTNERS MUST AGREE TO TAKE THE KEY.',
  'RULE: FIRST PAIR TO COMPLETE EACH EVENT WINS IT.',
  'RULE: TRIPLE-TIE = NO INVINCIBILITY. EVERYONE IS VULNERABLE.',
  'CHEF STOCKED THE FOOD COURT. BE WARY.',
  'CURSED IDOL: 100% REAL CURSE. PROBABLY.',
  'CAVE OF TREACHEROUS TERROR: ACTUALLY TERRIFYING.',
  'TOTEM MUST MATCH THE VOTING HISTORY. EXACTLY.',
  'THE HANDCUFFS ARE REGULATION POLICE ISSUE. CHEF\'S.',
  'CHRIS MCLEAN IS NOT RESPONSIBLE FOR PSYCHOLOGICAL DAMAGE.',
  'NO ANIMALS WERE HARMED. HUMANS: STILL COUNTING.',
  'BONEY ISLAND: BEAUTIFUL. CURSED. SEASONAL.',
  'PRESENTED BY CHEF HATCHET\'S MYSTERY MEAT CATERING CO.',
  'FINAL STRETCH · THREE CHALLENGES · ONE KEY TO FREEDOM.',
  'IF YOUR PARTNER VOMITS YOU STILL HAVE TO FINISH THE PLATE.',
  'IMMUNITY MEANS SAFETY. EVERYONE ELSE: GOOD LUCK.',
  'CHRIS MCLEAN IS DEFINITELY WATCHING ALL OF THIS ON MONITORS.',
];

// Reveal state (module-scope)
const _tvState = {};

// ══════════════════════════════════════════════════════════════
// PAIRING LOGIC
// ══════════════════════════════════════════════════════════════

function _pairPlayers(activePlayers) {
  const n = activePlayers.length;
  if (n < 4) return { pairs: [], spectator: null };

  // Sort descending by total drama (#5 — interleave drama)
  const byDrama = [...activePlayers].sort((a, b) => {
    const dA = activePlayers.reduce((s, p) => p === a ? s : s + Math.abs(getBond(a, p)), 0);
    const dB = activePlayers.reduce((s, p) => p === b ? s : s + Math.abs(getBond(b, p)), 0);
    return dB - dA;
  });

  let pool = [...byDrama];
  let spectator = null;
  if (pool.length % 2 !== 0) spectator = pool.pop(); // least dramatic sits out

  // Interleave: pair[0]=[sorted[0],sorted[n-1]], pair[1]=[sorted[1],sorted[n-2]]
  const pairs = [];
  const half = Math.floor(pool.length / 2);
  for (let i = 0; i < half; i++) {
    pairs.push([pool[i], pool[pool.length - 1 - i]]);
  }

  return { pairs, spectator };
}

function _computeArchPair(a, b) {
  const av = isVillainArch(a), bv = isVillainArch(b);
  const an = isNiceArch(a), bn = isNiceArch(b);
  if ((av && bn) || (bv && an)) return 'villain_hero';
  const bond = getBond(a, b);
  if (bond <= -3) return 'rivals';
  const showmance = (gs.showmances || []).find(s =>
    s.phase !== 'broken-up' && s.players.every(p => [a, b].includes(p))
  );
  if (showmance) return 'showmance';
  if (bond <= 1) return 'strangers';
  return 'default';
}

// ══════════════════════════════════════════════════════════════
// WIMP KEY OFFER (#1 — fixed inclination + probabilistic)
// ══════════════════════════════════════════════════════════════

function _inclinationToTakeKey(name, pair, triState, offerIndex, bond) {
  const s = pStats(name);
  const arch = getArchetype(name);
  let incl = 0.10;
  if (bond < -2) incl += 0.20;
  if (s.boldness < 3) incl += 0.15;
  const memberMishaps = pair.members.reduce((sum, n) => sum + (triState.players[n]?.mishapCount || 0), 0);
  if (memberMishaps >= 2) incl += 0.22;
  if (VILLAIN_ARCHETYPES.includes(arch)) incl -= 0.08;
  if (NICE_ARCHETYPES.includes(arch)) incl -= 0.10;
  if (offerIndex === 0) incl -= 0.05;
  return incl;
}

function _computeWimpKeyDecision(pair, triState, offerIndex) {
  const [a, b] = pair.members;
  const bond = pair.bond;
  const aIncl = _inclinationToTakeKey(a, pair, triState, offerIndex, bond);
  const bIncl = _inclinationToTakeKey(b, pair, triState, offerIndex, bond);
  const passes = (incl) => Math.random() < Math.max(incl, 0);
  return passes(aIncl) && passes(bIncl);
}

function _offerWimpKey(triState, timeline, offerIndex) {
  const decisions = [];
  triState.pairs.forEach(pair => {
    if (pair.wimpKeyTaken) return;
    const takes = _computeWimpKeyDecision(pair, triState, offerIndex);
    decisions.push({ pairId: pair.id, members: pair.members, taken: takes });
    if (takes) {
      pair.wimpKeyTaken = true;
      triState.players[pair.members[0]].wimpKeyTaken = true;
      triState.players[pair.members[1]].wimpKeyTaken = true;
      pair.members.forEach(n => popDelta(n, -2));
    }
  });
  // Full-width establishing card data included in event (#16)
  timeline.push({ type: 'wimpKeyOffer', offerIndex, decisions });
  decisions.filter(d => d.taken).forEach(d => {
    timeline.push({
      type: 'wimpKeyTaken', pairId: d.pairId, players: d.members,
      text: `${d.members[0]} and ${d.members[1]} take the key. Handcuffs off. They're out of the running.`,
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 1: CHOWDOWN (3-phase structure, #7)
// ══════════════════════════════════════════════════════════════

function _fireRoleDecision(pair) {
  const [a, b] = pair.members;
  const archA = getArchetype(a), archB = getArchetype(b);
  const isVA = VILLAIN_ARCHETYPES.includes(archA), isVB = VILLAIN_ARCHETYPES.includes(archB);
  const isHA = (archA === 'hero' || archA === 'loyal-soldier' || archA === 'underdog');
  const isHB = (archB === 'hero' || archB === 'loyal-soldier' || archB === 'underdog');
  const isShowmance = pair.archPair === 'showmance';
  const isRivals = pair.bond < -3;

  const weights = { armWrestle: 1, bully: 1, agree: 1, volunteer: 1 };
  if (isVA || isVB) weights.bully *= 3;
  if (isShowmance) weights.agree *= 3;
  if (isRivals) weights.armWrestle *= 3;
  if (isHA || isHB) weights.volunteer *= 2;

  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  let subtype = 'agree';
  for (const [k, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) { subtype = k; break; }
  }

  let feeder, eater, text;
  if (subtype === 'armWrestle') {
    const winner = pStats(a).boldness * 1 >= pStats(b).boldness * 1 ? a : b;
    feeder = winner; eater = winner === a ? b : a;
    text = _rp(TA_ROLE_DECISION_TEXTS.armWrestle)(a, b, winner);
  } else if (subtype === 'bully') {
    feeder = isVA ? a : (isVB ? b : (pStats(a).strategic * 1 >= pStats(b).strategic * 1 ? a : b));
    eater = feeder === a ? b : a;
    text = _rp(TA_ROLE_DECISION_TEXTS.bully)(a, b, eater);
  } else if (subtype === 'agree') {
    eater = pStats(a).endurance * 1 >= pStats(b).endurance * 1 ? a : b;
    feeder = eater === a ? b : a;
    text = _rp(TA_ROLE_DECISION_TEXTS.agree)(a, b);
  } else {
    const vol = pStats(a).strategic * 1 <= pStats(b).strategic * 1 ? a : b;
    eater = vol; feeder = vol === a ? b : a;
    text = _rp(TA_ROLE_DECISION_TEXTS.volunteer)(a, b, vol);
  }
  return { subtype, feeder, eater, text };
}

function _fireChowdownMidEvent(pair, feeder, eater, triState) {
  const fA = getArchetype(feeder);
  const pool = [];
  pool.push({ subtype: 'rhythm', weight: 2 });
  pool.push({ subtype: 'grossOut', weight: 2 });
  if (VILLAIN_ARCHETYPES.includes(fA) || (pStats(feeder).strategic * 1 >= 6 && pStats(feeder).loyalty * 1 <= 4)) {
    pool.push({ subtype: 'cheat', weight: 1.5 });
  }

  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick = null;
  for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  if (!pick) return null;

  const s = pick.subtype;
  let text = '', rateDelta = 0;
  if (s === 'rhythm') {
    text = _rp(TA_CHOWDOWN_TEXTS.rhythm);
    rateDelta = 2;
    addBond(feeder, eater, 1);
  } else if (s === 'grossOut') {
    text = _rp(TA_CHOWDOWN_TEXTS.grossOut);
    rateDelta = -2;
  } else if (s === 'cheat') {
    const caught = Math.random() < 0.35;
    if (caught) {
      text = _rp(TA_CHOWDOWN_TEXTS.cheatCaught);
      rateDelta = -3;
      popDelta(feeder, -1);
    } else {
      text = _rp(TA_CHOWDOWN_TEXTS.cheatSneaky);
      rateDelta = 3;
    }
  }
  return {
    type: 'chowdownEvent', subtype: s, pairId: pair.id, players: [feeder, eater], text,
    _rateDelta: rateDelta,
    badgeText: s === 'cheat' ? 'CHEAT' : s === 'grossOut' ? 'GROSS' : 'RHYTHM',
    badgeClass: s === 'rhythm' ? 'green' : s === 'cheat' ? 'red' : 'red',
  };
}

function _fireChowdownClutchEvent(pair, feeder, eater) {
  const smashWeight = pair.tooShortArms ? 5 : 1;
  const vomitWeight = pStats(eater).endurance * 1 < 4 ? 2 : 0.5;
  const pool = [
    { subtype: 'smashFood', weight: smashWeight },
    { subtype: 'vomit', weight: vomitWeight },
    { subtype: 'pushThrough', weight: 1.5 },
  ];
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick = null;
  for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  if (!pick) return null;

  const s = pick.subtype;
  let text = '', rateDelta = 0;
  if (s === 'smashFood') {
    text = _rp(TA_CHOWDOWN_TEXTS.smashFood);
    rateDelta = 4;
    popDelta(feeder, 1);
  } else if (s === 'vomit') {
    text = _rp(TA_CHOWDOWN_TEXTS.vomit);
    rateDelta = -5;
    popDelta(eater, -1);
  } else {
    text = `${eater} has stopped tasting it. They're just going. Jaw locked. Eyes glazed. Going.`;
    rateDelta = 3;
    popDelta(eater, 1);
  }
  return {
    type: 'chowdownEvent', subtype: s, pairId: pair.id, players: [feeder, eater], text,
    _rateDelta: rateDelta,
    badgeText: s === 'smashFood' ? 'CLUTCH' : s === 'vomit' ? 'VOMIT' : 'PUSH THROUGH',
    badgeClass: s === 'pushThrough' || s === 'smashFood' ? 'green' : 'red',
  };
}

function _runChowdown(triState, activePlayers, timeline) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return null;

  // Setpiece card (#14)
  timeline.push({
    type: 'chowdownSetup',
    text: _rp(CLOCHE_REVEAL_POOL),
  });

  activePairs.forEach(pair => {
    const [a, b] = pair.members;
    const chemMod = _getChemMod(pair); // (#8)

    // Phase 1 — Opening: roleDecision
    const rd = _fireRoleDecision(pair);
    const { feeder, eater } = rd;
    timeline.push({
      type: 'chowdownEvent', subtype: 'roleDecision', pairId: pair.id, players: [feeder, eater],
      text: rd.text, rdSubtype: rd.subtype,
      badgeText: rd.subtype.toUpperCase(), badgeClass: 'neutral',
    });
    triState.players[eater].chowdownRole = 'eater';
    triState.players[feeder].chowdownRole = 'feeder';

    let rate = pStats(feeder).physical * 1 + pStats(feeder).strategic * 0.5
      + pStats(eater).endurance * 1.2 - pStats(eater).mental * 0.5
      + _rand(-3, 3);
    rate += chemMod; // chemistry base (#8)

    // Handcuff arms-too-short (#4, #9)
    if (pStats(feeder).physical * 1 < 5) {
      const scTexts = [
        `${feeder}'s arm won't stretch across the platter. The chain is too short. ${feeder} tries to angle in from the side.`,
        `The handcuff pulls tight at full extension. ${feeder} can barely reach the center of the tray. ${eater} leans in to compensate.`,
        `${feeder} overextends. The chain jerks. They try again at half-reach.`,
      ];
      const rateDelta = pStats(feeder).physical * 1 < 4 ? -2 : -1;
      if (pStats(feeder).physical * 1 < 4) pair.tooShortArms = true;
      timeline.push({
        type: 'chowdownEvent', subtype: 'shortChainReach', pairId: pair.id, players: [feeder, eater],
        text: _rp(scTexts),
        _rateDelta: rateDelta,
        badgeText: 'ARM REACH', badgeClass: 'red',
      });
      rate += rateDelta;
      triState.players[feeder].mishapCount++;
    }

    // Phase 2 — Mid (2-3 events)
    const midCount = 2 + Math.floor(Math.random() * 2);
    for (let e = 0; e < midCount; e++) {
      const evt = _fireChowdownMidEvent(pair, feeder, eater, triState);
      if (!evt) continue;
      timeline.push(evt);
      rate += evt._rateDelta || 0;
      if (evt.subtype === 'vomit' || evt.subtype === 'grossOut') triState.players[eater].mishapCount++;
    }

    // Phase 3 — Clutch (1 event)
    const clutchEvt = _fireChowdownClutchEvent(pair, feeder, eater);
    if (clutchEvt) {
      timeline.push(clutchEvt);
      rate += clutchEvt._rateDelta || 0;
      if (clutchEvt.subtype === 'vomit') triState.players[eater].mishapCount++;
    }

    pair.chowdownRate = rate;
  });

  const winner = activePairs.reduce((best, p) => p.chowdownRate > best.chowdownRate ? p : best, activePairs[0]);
  winner.chowdownWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'chowdownWin', pairId: winner.id, players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} finish the platter first. Challenge 1 to them.`,
  });
  return winner.id; // for rubber-banding
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 2: IDOL HAUL (time-to-completion, #2)
// ══════════════════════════════════════════════════════════════

function _runIdolPhase(pair, phase, triState, timeline) {
  const [a, b] = pair.members;

  const evtCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < evtCount; i++) {
    const evt = _fireIdolEvent(pair, phase);
    if (!evt) continue;
    timeline.push(evt);
    pair.idolTime += evt._timeDelta || 0;
    if (evt.subtype === 'spider' || evt.subtype === 'wooly' || evt.subtype === 'stumble') {
      triState.players[a].mishapCount++;
      triState.players[b].mishapCount++;
    }
    if (evt.subtype === 'bond' || evt.subtype === 'heart') addBond(a, b, 2);
    if (evt.subtype === 'argue' || evt.subtype === 'weight') addBond(a, b, -1);
  }

  // Cave: panic/clutch (#2 — time events)
  if (phase === 'cave') {
    if ((pStats(a).boldness * 1 + pStats(b).boldness * 1) / 2 < 5 && Math.random() < 0.4) {
      pair.idolTime += 20;
      triState.players[a].mishapCount++;
      triState.players[b].mishapCount++;
      timeline.push({
        type: 'idolCaveEvent', subtype: 'panic', phase: 'cave', pairId: pair.id, players: [a, b],
        text: `${a} and ${b} bolt from the cave entrance. They'll have to try again. Time lost.`,
        _timeDelta: 20,
        badgeText: 'PANIC', badgeClass: 'red',
      });
    } else if (Math.random() < 0.25) {
      pair.idolTime -= 10;
      timeline.push({
        type: 'idolCaveEvent', subtype: 'clutch', phase: 'cave', pairId: pair.id, players: [a, b],
        text: _rp(TA_IDOL_TEXTS.caveClutch)(a, b),
        _timeDelta: -10,
        badgeText: 'CLUTCH', badgeClass: 'green',
      });
      popDelta(a, 1);
      popDelta(b, 1);
    }
  }

  // Chain snag in piggyback (#4)
  if (phase === 'piggyback' && Math.random() < 0.30) {
    pair.idolTime += 5;
    const chainSnagTexts = [
      `The chain catches on a root mid-piggyback. They both lurch. Five seconds lost.`,
      `${b}'s wrist jerks back as the chain snagged on a branch. ${a} yelps. They untangle, then keep running.`,
      `Mid-trail, the chain snags a boulder. They untangle themselves, swear, and keep going.`,
    ];
    timeline.push({
      type: 'idolPiggybackEvent', subtype: 'chainSnag', phase: 'piggyback', pairId: pair.id, players: [a, b],
      text: _rp(chainSnagTexts),
      _timeDelta: 5,
      badgeText: 'CHAIN SNAG', badgeClass: 'red',
    });
  }
}

function _fireIdolEvent(pair, phase) {
  const [a, b] = pair.members;
  const subtypePool = {
    canoe: ['argue', 'nav', 'weight', 'bond'],
    find: ['package', 'curse'],
    piggyback: ['stumble', 'heart', 'joke'],
    cave: ['spider', 'wooly'],
  };
  const pool = subtypePool[phase] || [];
  if (!pool.length) return null;

  const sub = _rp(pool);
  const textKey = {
    canoe_argue: 'canoeArg', canoe_nav: 'canoeNav', canoe_weight: 'canoeWeight', canoe_bond: 'canoeBond',
    find_package: 'findPackage', find_curse: 'findCurse',
    piggyback_stumble: 'piggyStumble', piggyback_heart: 'piggyHeart', piggyback_joke: 'piggyJoke',
    cave_spider: 'caveSpider', cave_wooly: 'caveWooly',
  }[phase + '_' + sub] || '';

  const textPool = TA_IDOL_TEXTS[textKey] || [];
  const text = textPool.length ? _rp(textPool)(a, b) : `${a} and ${b} work through the ${phase} phase.`;

  // Time deltas (#2)
  const timeMap = {
    argue: 5, weight: 5, stumble: 5,
    nav: -4, bond: -4, package: -4,
    heart: 0, joke: 0,
    curse: 5,
    spider: 8, wooly: 8,
  };
  const timeDelta = timeMap[sub] !== undefined ? timeMap[sub] : 0;
  const badgeMap = {
    nav: ['SMOOTH', 'green'], bond: ['SMOOTH', 'green'], package: ['SMOOTH', 'green'],
    heart: ['MOMENT', 'green'],
    argue: ['TROUBLE', 'red'], weight: ['TROUBLE', 'red'], stumble: ['TROUBLE', 'red'],
    curse: ['CURSED', 'red'], spider: ['SPIDER', 'red'], wooly: ['WOOLY', 'red'],
    joke: ['JOKE', 'neutral'],
  };
  const [badge, badgeClass] = badgeMap[sub] || ['EVENT', 'neutral'];

  const typeMap = {
    canoe: 'idolCanoeEvent', find: 'idolFindEvent',
    piggyback: 'idolPiggybackEvent', cave: 'idolCaveEvent',
  };
  return {
    type: typeMap[phase] || 'idolEvent', subtype: sub, phase, pairId: pair.id, players: [a, b], text,
    _timeDelta: timeDelta, badgeText: badge, badgeClass,
  };
}

function _runIdolHaul(triState, activePlayers, timeline, ep, chowdownWinnerId) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return null;

  // Cave approach setpiece (#15)
  timeline.push({
    type: 'caveApproach',
    text: `The Cave of Treacherous Terror looms at the end of Boney Island's eastern trail. Spider webs across the entrance. Something large moves in the darkness. Something fuzzy.`,
  });

  timeline.push({
    type: 'chrisQuip',
    text: `"Paddle out to Boney Island. Bring back the cursed idol. First pair to the Cave of Treacherous Terror wins." — Chris McLean`,
  });

  activePairs.forEach(pair => {
    // baseTime = 90 + rand(-10, 10) (#2)
    pair.idolTime = 90 + _rand(-10, 10);

    _runIdolPhase(pair, 'canoe', triState, timeline);
    _runIdolPhase(pair, 'find', triState, timeline);
    _runIdolPhase(pair, 'piggyback', triState, timeline);
    _runIdolPhase(pair, 'cave', triState, timeline);

    // Chemistry mod (#8)
    if (pair.archPair === 'rivals') pair.idolTime += 10;
    else if (pair.archPair === 'showmance') pair.idolTime -= 8;
    else if (pair.bond >= 4) pair.idolTime -= 5;

    // Rubber-band penalty (#10)
    if (chowdownWinnerId !== null && chowdownWinnerId !== undefined && pair.id === chowdownWinnerId) {
      pair.idolTime += 12;
    }
  });

  // Romance checks for idol haul (partner interaction)
  activePairs.forEach(pair => {
    const [a, b] = pair.members;
    if (romanticCompat(a, b) > 0) _challengeRomanceSpark(a, b, ep);
    _checkShowmanceChalMoment(a, b, ep);
  });

  const winner = activePairs.reduce((best, p) => p.idolTime < best.idolTime ? p : best, activePairs[0]);
  winner.idolWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'idolWin', pairId: winner.id, players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} drop the idol into the cave. Challenge 2 is theirs.`,
  });
  return winner.id;
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 3: TOTEM POLE (time-to-completion, #3)
// ══════════════════════════════════════════════════════════════

function _detectConfusionPairs(eliminated) {
  const pairs = [];
  for (let i = 0; i < eliminated.length; i++) {
    for (let j = i + 1; j < eliminated.length; j++) {
      const a = eliminated[i], b = eliminated[j];
      if (a[0] === b[0] && Math.abs(a.length - b.length) <= 1) pairs.push([a, b]);
    }
  }
  return pairs;
}

function _fireTotemEvent(pair, triState, eliminated, confusionPairs) {
  const [a, b] = pair.members;
  const archA = getArchetype(a), archB = getArchetype(b);
  const pool = [];

  pool.push({ subtype: 'confusion', weight: confusionPairs.length ? 2 : 0.5 });
  if (VILLAIN_ARCHETYPES.includes(archA) || VILLAIN_ARCHETYPES.includes(archB)) pool.push({ subtype: 'badmouth', weight: 2 });
  if (NICE_ARCHETYPES.includes(archA) || NICE_ARCHETYPES.includes(archB)) pool.push({ subtype: 'defend', weight: 1.5 });
  const hasSpark = (gs.romanticSparks || []).some(s =>
    ((s.a === a || s.a === b) && eliminated.includes(s.b)) ||
    ((s.b === a || s.b === b) && eliminated.includes(s.a))
  );
  if (hasSpark) pool.push({ subtype: 'carved', weight: 1.5 });
  if ((VILLAIN_ARCHETYPES.includes(archA) && NICE_ARCHETYPES.includes(archB)) ||
      (VILLAIN_ARCHETYPES.includes(archB) && NICE_ARCHETYPES.includes(archA))) {
    pool.push({ subtype: 'breakdown', weight: 1 });
  }

  if (!pool.length) return null;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick = null;
  for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  if (!pick) return null;

  const s = pick.subtype;
  let text = '', timeDelta = 0, badge = 'EVENT', badgeClass = 'neutral';

  if (s === 'confusion') {
    pair._hadConfusion = true;
    const cpair = confusionPairs.length ? _rp(confusionPairs) : [eliminated[0] || '?', eliminated[1] || '?'];
    text = _rp(TA_TOTEM_TEXTS.confusion)(a, b, cpair[0], cpair[1]);
    timeDelta = 15; badge = 'STUCK'; badgeClass = 'red';
  } else if (s === 'badmouth') {
    const villain = VILLAIN_ARCHETYPES.includes(archA) ? a : b;
    const partner = villain === a ? b : a;
    const target = _rp(eliminated);
    text = _rp(TA_TOTEM_TEXTS.badmouth)(villain, partner, target);
    timeDelta = 0; badge = 'TRASH TALK'; badgeClass = 'red';
    popDelta(villain, -1);
  } else if (s === 'defend') {
    const hero = NICE_ARCHETYPES.includes(archA) ? a : b;
    const target = _rp(eliminated);
    text = _rp(TA_TOTEM_TEXTS.defend)(hero, target);
    timeDelta = 0; badge = 'DEFENDS'; badgeClass = 'green';
    popDelta(hero, 1);
  } else if (s === 'carved') {
    const spark = (gs.romanticSparks || []).find(sp =>
      ((sp.a === a || sp.a === b) && eliminated.includes(sp.b)) ||
      ((sp.b === a || sp.b === b) && eliminated.includes(sp.a))
    );
    const carver = spark ? ((spark.a === a || spark.b === a) ? a : b) : a;
    const target = spark ? (spark.a === carver ? spark.b : spark.a) : eliminated[0];
    text = _rp(TA_TOTEM_TEXTS.carved)(carver, target);
    timeDelta = 0; badge = 'ROMANCE'; badgeClass = 'pink';
  } else if (s === 'breakdown') {
    const villain = VILLAIN_ARCHETYPES.includes(archA) ? a : b;
    const hero = villain === a ? b : a;
    text = _rp(TA_TOTEM_TEXTS.breakdown)(villain, hero);
    timeDelta = 5; badge = 'BREAKDOWN'; badgeClass = 'red';
    addBond(villain, hero, -3);
  }

  return {
    type: 'totemEvent', subtype: s, pairId: pair.id, players: [a, b], text,
    _timeDelta: timeDelta, badgeText: badge, badgeClass,
  };
}

function _runTotemPole(triState, activePlayers, timeline, idolWinnerId) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return;

  const eliminated = [...(gs.eliminated || [])];
  if (eliminated.length < 2) {
    timeline.push({
      type: 'totemSetup',
      text: `Chris unveils the wooden heads. There aren't enough to build a proper totem. Chris gives up and declares the challenge skipped.`,
    });
    return;
  }

  timeline.push({
    type: 'totemSetup',
    text: `Chris unveils a pile of wooden heads — one for every camper eliminated so far. "Stack them in voting order. Ezekiel on the bottom. Go."`,
  });

  const confusionPairs = _detectConfusionPairs(eliminated);

  activePairs.forEach(pair => {
    const [a, b] = pair.members;
    // baseTime = 60 + rand(-8, 8) (#3)
    pair.totemTime = 60 + _rand(-8, 8);

    const evtCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < evtCount; i++) {
      const evt = _fireTotemEvent(pair, triState, eliminated, confusionPairs);
      if (!evt) continue;
      timeline.push(evt);
      pair.totemTime += evt._timeDelta || 0;
    }

    // Chain stretch (#4)
    if (Math.random() < 0.35) {
      pair.totemTime += 8;
      const chainStretchTexts = [
        `${a} reaches for the top of the stack while ${b} handles the base. The chain goes taut. They can't both reach where they need to be.`,
        `The handcuff prevents them from working both ends of the totem simultaneously. Small time loss.`,
        `Four-foot chain + six-foot totem = problem. They rearrange. Time passes.`,
      ];
      timeline.push({
        type: 'totemEvent', subtype: 'chainStretch', pairId: pair.id, players: [a, b],
        text: _rp(chainStretchTexts),
        _timeDelta: 8,
        badgeText: 'CHAIN STRETCH', badgeClass: 'red',
      });
    }

    // Chemistry mod (#8)
    if (pair.archPair === 'rivals') pair.totemTime += 8;
    else if (pair.archPair === 'showmance') pair.totemTime -= 5;

    // Rubber-band penalty (#10)
    if (idolWinnerId !== null && idolWinnerId !== undefined && pair.id === idolWinnerId) {
      pair.totemTime += 10;
    }
  });

  const winner = activePairs.reduce((best, p) => p.totemTime < best.totemTime ? p : best, activePairs[0]);
  winner.totemWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'totemWin', pairId: winner.id, players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} lock in the last head. Challenge 3 is theirs.`,
  });

  // Per-pair totem visualization (#18)
  activePairs.forEach(pair => {
    const isWinner = pair.id === winner.id;
    let stack = [...eliminated];
    if (!isWinner && pair._hadConfusion && eliminated.length >= 2) {
      const si = Math.floor(Math.random() * (stack.length - 1));
      [stack[si], stack[si + 1]] = [stack[si + 1], stack[si]];
      if (Math.random() < 0.5 && stack.length > 3) {
        const si2 = Math.floor(Math.random() * (stack.length - 1));
        [stack[si2], stack[si2 + 1]] = [stack[si2 + 1], stack[si2]];
      }
    }
    timeline.push({
      type: 'totemResult',
      pairId: pair.id,
      players: pair.members,
      isWinner,
      stack,
      correctStack: [...eliminated],
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SIMULATE (main entry point)
// ══════════════════════════════════════════════════════════════

export function simulateTriArmedTriathlon(ep) {
  const activePlayers = [...gs.activePlayers];
  const timeline = [];
  const badges = {};

  const { pairs, spectator } = _pairPlayers(activePlayers);
  const triState = {
    pairs: pairs.map((p, i) => ({
      id: i, members: p, wimpKeyTaken: false,
      chowdownRate: 0, chowdownWon: false,
      idolTime: 0, idolWon: false,
      totemTime: 0, totemWon: false,
      totalWins: 0,
      bond: getBond(p[0], p[1]),
      archPair: _computeArchPair(p[0], p[1]),
      tooShortArms: false,
      _hadConfusion: false,
    })),
    players: {},
    spectator,
  };

  activePlayers.forEach(name => {
    const pairId = pairs.findIndex(p => p.includes(name));
    triState.players[name] = {
      pair: pairId >= 0 ? pairs[pairId].find(n => n !== name) : null,
      pairId,
      wimpKeyTaken: false,
      chowdownRole: null,
      mishapCount: 0,
      badges: [],
    };
  });

  timeline.push({ type: 'chrisIntro', text: _rp(TA_CHRIS_INTROS) });

  triState.pairs.forEach((pair, i) => {
    timeline.push({
      type: 'pairingReveal', pairId: i, players: pair.members,
      text: _rp(TA_PAIRING_FLAVOR[pair.archPair] || TA_PAIRING_FLAVOR.default),
    });
    timeline.push({
      type: 'handcuffed', pairId: i, players: pair.members, bond: pair.bond,
      text: `${pair.members[0]} and ${pair.members[1]} are cuffed together. Bond: ${pair.bond >= 3 ? 'allies' : pair.bond <= -3 ? 'rivals' : 'uneasy'}.`,
    });
  });

  _offerWimpKey(triState, timeline, 0);
  const chowdownWinnerId = _runChowdown(triState, activePlayers, timeline);
  _offerWimpKey(triState, timeline, 1);
  const idolWinnerId = _runIdolHaul(triState, activePlayers, timeline, ep, chowdownWinnerId);
  _offerWimpKey(triState, timeline, 2);
  _runTotemPole(triState, activePlayers, timeline, idolWinnerId);

  // Final scoring
  triState.pairs.forEach(p => {
    p.totalWins = (p.chowdownWon ? 1 : 0) + (p.idolWon ? 1 : 0) + (p.totemWon ? 1 : 0);
  });
  const eligible = triState.pairs.filter(p => !p.wimpKeyTaken);
  const maxWins = eligible.length ? Math.max(...eligible.map(p => p.totalWins)) : 0;
  const topPairs = eligible.filter(p => p.totalWins === maxWins);
  const tripleTie = eligible.length >= 3 && eligible.every(p => p.totalWins === 1);
  const winnerPair = (tripleTie || topPairs.length !== 1 || maxWins === 0) ? null : topPairs[0];
  const immune = winnerPair ? winnerPair.members : [];

  // 3-part final reveal (#17)
  const pairData = triState.pairs.map(p => ({
    id: p.id, members: p.members, wins: p.totalWins,
    wimpKeyTaken: p.wimpKeyTaken,
    details: { chowdown: p.chowdownWon, idol: p.idolWon, totem: p.totemWon },
  }));
  timeline.push({ type: 'finalRecap', pairs: pairData });
  timeline.push({ type: 'finalTally', pairs: pairData });
  timeline.push({
    type: 'finalOutcome',
    winnerPair: winnerPair ? winnerPair.id : null,
    winnerMembers: winnerPair ? winnerPair.members : null,
    immune,
    tripleTie,
  });

  // Popularity + bonds
  immune.forEach(n => popDelta(n, 2));

  // Badges
  if (winnerPair) immune.forEach(n => { badges[n] = 'triArmedWinner'; });
  if (tripleTie) activePlayers.forEach(n => { badges[n] = 'triArmedNoImmune'; });

  const pairResults = triState.pairs.map(p => ({
    pair: p.members,
    chowdownWin: p.chowdownWon,
    idolWin: p.idolWon,
    totemWin: p.totemWon,
    totalWins: p.totalWins,
    wimpKeyTaken: p.wimpKeyTaken,
  }));

  ep.triArmedTriathlon = {
    timeline,
    pairs: triState.pairs,
    spectator,
    winnerPair: winnerPair ? winnerPair.id : null,
    immune,
    tripleTie,
    badges,
    pairResults,
  };

  // Invincibility
  ep.immunityWinner = immune.length === 1 ? immune[0] : null;
  ep.extraImmune = ep.extraImmune || [];
  immune.forEach(n => { if (!ep.extraImmune.includes(n)) ep.extraImmune.push(n); });

  // Chal record
  ep.chalMemberScores = {};
  triState.pairs.forEach(p => {
    const score = p.totalWins * 10 - (p.wimpKeyTaken ? 20 : 0);
    p.members.forEach(n => { ep.chalMemberScores[n] = score; });
  });
  if (spectator) ep.chalMemberScores[spectator] = 0;
  updateChalRecord(ep);

  return ep.triArmedTriathlon;
}

// ══════════════════════════════════════════════════════════════
// CSS — TOURNAMENT STAGE THEME (#11)
// ══════════════════════════════════════════════════════════════

const TA_STYLES = `
  /* ═══ TRIAL BY TRI-ARMED TRIATHLON — TOURNAMENT BRACKET STAGE ═══
     Identity: iron-gray handcuffs, tournament-bracket scoreboard,
     black stage floor, tournament red + bracket gold palette.
     Distinct from motocross orange, ranger tan, dungeon stone,
     cafeteria slime, night-vision green.
  */

  .tr-page { background:#0f0f10; color:#e6e6e6;
    font-family:'Roboto Slab','Georgia',serif;
    position:relative; overflow:hidden; padding:24px 16px; min-height:400px; }
  .tr-page::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:radial-gradient(ellipse at 50% 0%, rgba(200,49,10,0.22) 0%, transparent 60%); }

  /* Header */
  .tr-header { position:relative; z-index:2; text-align:center; padding:16px 8px 12px;
    border-bottom:2px solid rgba(200,49,10,0.4); margin-bottom:10px; }
  .tr-title { font-family:'Impact','Arial Black',sans-serif; font-size:26px; font-weight:900;
    letter-spacing:4px; color:#c8310a; text-transform:uppercase;
    text-shadow:0 2px 8px rgba(200,49,10,0.5), 1px 2px 0 rgba(0,0,0,0.8); }
  .tr-subtitle { font-family:'Impact','Arial Black',sans-serif; font-size:10px; color:#d4a017;
    letter-spacing:3px; margin-top:6px; }
  .tr-chain-deco { display:inline-block; margin:0 10px; color:#6a6a6a; font-size:16px;
    animation:tr-chain-sway 3s ease-in-out infinite; }
  @keyframes tr-chain-sway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(4deg)} }

  /* Ticker */
  .tr-ticker { position:relative; overflow:hidden; height:22px; margin:0 -16px 10px;
    background:linear-gradient(to right, rgba(200,49,10,0.15), rgba(15,15,16,0.8), rgba(200,49,10,0.15));
    border-top:1px solid rgba(200,49,10,0.4); border-bottom:1px solid rgba(212,160,23,0.4); z-index:2; }
  .tr-ticker-inner { position:absolute; white-space:nowrap; top:0; left:0; height:22px; line-height:22px;
    font-family:'Courier New',monospace; font-size:10px; color:#e6e6e6; letter-spacing:1.5px;
    animation:tr-ticker-scroll 40s linear infinite; }
  @keyframes tr-ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  /* Scoreboard — tournament bracket lanes */
  .tr-scoreboard { position:sticky; top:0; z-index:10; display:flex; justify-content:center; gap:12px;
    background:rgba(10,10,12,0.97); padding:10px 12px; margin:0 -16px 16px;
    border-top:2px solid #c8310a; border-bottom:2px solid #d4a017;
    font-family:'Impact','Arial Black',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:1px; text-transform:uppercase; }
  .tr-slot { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:130px;
    padding:6px 8px; border-radius:4px; background:rgba(20,20,25,0.6);
    border:1px solid rgba(212,160,23,0.3); }
  .tr-slot-label { color:#d4a017; font-size:9px; }
  .tr-slot-winner { font-size:10px; color:#e6e6e6; min-height:26px; display:flex; align-items:center; gap:4px; }
  .tr-slot-winner.tr-pending { opacity:0.3; }
  .tr-slot-winner.tr-filled { animation:tr-slot-fill 0.5s ease-out both; }
  @keyframes tr-slot-fill { 0%{opacity:0;transform:scale(0.5)} 100%{opacity:1;transform:scale(1)} }

  /* Per-pair progress dots (#12) */
  .tr-pair-dots { display:flex; gap:4px; margin-top:4px; justify-content:center; }
  .tr-dot { font-size:10px; color:#3a3a3a; transition:color 0.3s; cursor:default; }
  .tr-dot--filled { color:#d4a017; animation:tr-dot-pop 0.3s ease-out both; }
  @keyframes tr-dot-pop { 0%{transform:scale(0)} 80%{transform:scale(1.3)} 100%{transform:scale(1)} }

  /* Stopwatch */
  .tr-stopwatch { display:inline-flex; align-items:center; justify-content:center;
    width:32px; height:32px; border:2px solid #c8310a; border-radius:50%;
    font-family:'Courier New',monospace; font-size:9px; color:#c8310a; font-weight:700;
    position:relative; }
  .tr-stopwatch::after { content:''; position:absolute; top:2px; left:50%; width:1px; height:12px;
    background:#c8310a; transform-origin:bottom center;
    animation:tr-watch-tick 12s linear infinite; }
  @keyframes tr-watch-tick { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* Chain upgrade (#13) */
  .tr-chain { display:flex; align-items:center; gap:3px; padding:0 4px; }
  .tr-chain-link { display:inline-block; width:18px; height:10px; border-radius:50%;
    border:2px solid #4a4a4a;
    background:linear-gradient(135deg, #9a9a9a 0%, #4a4a4a 40%, #b0b0b0 60%, #5a5a5a 100%);
    box-shadow:inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.15); }
  .tr-chain-link-mid { animation:tr-chain-jiggle 2.5s ease-in-out infinite; }
  @keyframes tr-chain-jiggle { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
  .tr-pair-banner--broken .tr-chain-link { opacity:0.4; }
  .tr-pair-banner--broken .tr-chain-link:nth-child(1) { transform:translate(-12px,-6px) rotate(-25deg); }
  .tr-pair-banner--broken .tr-chain-link:nth-child(3) { transform:translate(12px,6px) rotate(25deg); }

  /* Pair banner (#20 — hero variant) */
  .tr-pair-banner { display:flex; align-items:center; justify-content:center; gap:8px;
    padding:8px 12px; margin:6px 0; border-radius:6px;
    background:rgba(20,20,25,0.7); border:1px solid rgba(100,100,100,0.3); }
  .tr-pair-banner--hero { padding:14px 16px; }
  .tr-pair-banner--hero .tr-chain-link { width:22px; height:12px; }
  .tr-pair-portrait { flex:0 0 auto; text-align:center; }
  .tr-pair-name { font-family:'Courier New',monospace; font-size:10px; color:#e6e6e6; margin-top:2px; }

  /* Cards */
  .tr-card { position:relative; z-index:2; padding:10px 14px; margin-bottom:6px; border-radius:4px;
    border:1px solid rgba(106,106,106,0.3); border-left:4px solid var(--tr-accent,#c8310a);
    background:rgba(20,20,25,0.9); box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);
    animation:tr-card-in 0.4s ease-out both; }
  @keyframes tr-card-in { 0%{opacity:0;transform:translateY(-6px)} 100%{opacity:1;transform:translateY(0)} }
  .tr-card-label { font-family:'Impact','Arial Black',sans-serif; font-size:9px; font-weight:700;
    letter-spacing:1px; color:var(--tr-accent,#c8310a); text-transform:uppercase; margin-bottom:4px; }
  .tr-card-body { font-size:12px; color:#e6e6e6; line-height:1.55; }
  .tr-card-footer { font-family:'Courier New',monospace; font-size:8px; color:#6a6a6a; margin-top:4px; letter-spacing:1px; }

  /* Card variants */
  .tr-card--chowdown { --tr-accent:#c8310a; }
  .tr-card--idol { --tr-accent:#2a7a2a; background:rgba(10,20,10,0.92); }
  .tr-card--totem { --tr-accent:#d4a017; }
  .tr-card--wimp { --tr-accent:#cc3333; border-color:#cc3333; background:rgba(40,10,10,0.92); }
  .tr-card--mishap { animation:tr-card-in 0.4s ease-out both, tr-card-shake 0.4s 0.4s both; --tr-accent:#cc3333; }
  .tr-card--cave { --tr-accent:#8a3aaa; background:rgba(10,5,20,0.95); }
  @keyframes tr-card-shake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-3px)} 30%,60%,90%{transform:translateX(3px)} }

  /* Setpiece platters (#14) */
  .tr-card--setpiece { border:2px solid rgba(200,49,10,0.5); }
  .tr-platter { font-size:24px; text-align:center; position:relative; display:inline-block; }
  .tr-steam { color:#888; font-size:14px; animation:tr-steam-rise 1.5s ease-in-out infinite; }
  .tr-steam--green { color:#4a8a4a; }
  @keyframes tr-steam-rise { 0%{opacity:0;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} 100%{opacity:0;transform:translateY(-8px)} }

  /* Wimp key screen (#16) */
  .tr-wimp-key-screen { text-align:center; padding:20px; margin:8px 0;
    background:linear-gradient(135deg, rgba(40,10,10,0.95), rgba(15,15,16,0.98));
    border:2px solid #cc3333; border-radius:6px; animation:tr-banner-rise 0.6s ease-out both; }
  .tr-wimp-key-icon { font-size:36px; display:block; animation:tr-key-rotate 10s linear infinite; }
  .tr-wimp-key-title { font-family:'Impact','Arial Black',sans-serif; font-size:22px;
    color:#fff; letter-spacing:4px; margin:8px 0 4px; }
  .tr-wimp-key-sub { font-family:'Courier New',monospace; font-size:10px; color:#ffaaaa; letter-spacing:2px; }
  @keyframes tr-key-rotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* Stamp */
  .tr-stamp { display:inline-block; padding:3px 10px; border:3px solid currentColor; border-radius:3px;
    font-family:'Impact','Arial Black',sans-serif; font-size:12px; font-weight:900;
    letter-spacing:2px; text-transform:uppercase; transform:rotate(-5deg);
    animation:tr-stamp-slam 0.5s ease-out both; }
  @keyframes tr-stamp-slam {
    0%   { transform:rotate(-5deg) scale(3.5); opacity:0; }
    55%  { transform:rotate(-5deg) scale(0.92); opacity:1; }
    75%  { transform:rotate(-5deg) scale(1.06); }
    100% { transform:rotate(-5deg) scale(1); opacity:1; }
  }

  /* Camera shake */
  .tr-camera-shake { animation:tr-camera-shake 0.4s; }
  @keyframes tr-camera-shake {
    0%,100% { transform:translate(0,0); }
    15%  { transform:translate(-3px, 2px); }
    30%  { transform:translate(3px,-2px); }
    45%  { transform:translate(-2px,-3px); }
    60%  { transform:translate(2px, 3px); }
    75%  { transform:translate(-3px, 1px); }
    90%  { transform:translate(3px,-1px); }
  }

  /* Reveal controls */
  .tr-btn-reveal { background:rgba(200,49,10,0.15); border:2px solid rgba(200,49,10,0.5);
    color:#c8310a; padding:8px 20px; border-radius:4px; cursor:pointer;
    font-family:'Impact','Arial Black',sans-serif; font-size:13px; letter-spacing:2px;
    text-transform:uppercase; margin:12px auto; display:block;
    animation:tr-btn-pulse 2s infinite; }
  .tr-btn-reveal:hover { background:rgba(200,49,10,0.3); }
  @keyframes tr-btn-pulse { 0%,100%{box-shadow:0 0 6px rgba(200,49,10,0.2)} 50%{box-shadow:0 0 18px rgba(200,49,10,0.5)} }
  .tr-btn-reveal-all { display:block; text-align:center; font-size:10px; color:#6a6a6a;
    cursor:pointer; text-decoration:underline; margin-top:4px; font-family:'Courier New',monospace; }

  /* Final reveal banners (#17) */
  .tr-final-banner { padding:24px; text-align:center; border-radius:8px; margin:20px 0;
    background:radial-gradient(ellipse at 50% 40%, rgba(212,160,23,0.35) 0%, rgba(10,10,12,0.95) 70%);
    border:3px solid rgba(212,160,23,0.6); animation:tr-banner-rise 0.8s ease-out both; }
  @keyframes tr-banner-rise { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
  .tr-final-title { font-family:'Impact','Arial Black',sans-serif; font-size:28px; color:#d4a017;
    letter-spacing:5px; font-weight:900; text-shadow:0 2px 6px rgba(0,0,0,0.7); }

  .tr-no-immune { padding:24px; text-align:center; border-radius:8px; margin:20px 0;
    background:repeating-linear-gradient(45deg, #1a0a0a 0 20px, #2a1010 20px 40px);
    border:3px solid #cc3333;
    animation:tr-banner-rise 0.8s ease-out both, tr-camera-shake 0.4s ease-out 0.8s both; }
  .tr-no-immune-title { font-family:'Impact','Arial Black',sans-serif; font-size:24px;
    color:#ffffff; letter-spacing:4px; font-weight:900; }
  .tr-no-immune-sub { font-family:'Courier New',monospace; font-size:11px; color:#ffaaaa;
    letter-spacing:2px; margin-top:8px; }

  /* finalTally big numbers (#17) */
  .tr-tally-grid { display:flex; justify-content:center; gap:20px; margin:12px 0; flex-wrap:wrap; }
  .tr-tally-item { text-align:center; }
  .tr-tally-names { font-family:'Courier New',monospace; font-size:9px; color:#e6e6e6; margin-bottom:2px; }
  .tr-tally-num { font-family:'Impact','Arial Black',sans-serif; font-size:48px;
    color:#d4a017; line-height:1; }
  .tr-tally-num--zero { color:#3a3a3a; }

  /* finalRecap table */
  .tr-recap-table { width:100%; border-collapse:collapse; font-family:'Courier New',monospace;
    font-size:11px; color:#e6e6e6; }
  .tr-recap-table th { text-align:center; padding:4px 8px;
    border-bottom:1px solid rgba(212,160,23,0.3); color:#d4a017; font-size:9px; }
  .tr-recap-table td { padding:4px 8px; text-align:center; }

  /* Totem stack visualization (#18) */
  .tr-totem-stack { display:flex; flex-direction:column; align-items:center; gap:2px; margin:8px 0; }
  .tr-totem-head { padding:3px 12px; border-radius:12px;
    font-family:'Courier New',monospace; font-size:10px;
    background:rgba(30,30,35,0.8); border:1px solid rgba(212,160,23,0.4); color:#e6e6e6; }
  .tr-totem-head--wrong { border-color:#cc3333; color:#ffaaaa; background:rgba(40,10,10,0.8); }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tr-chain-deco, .tr-chain-link-mid, .tr-ticker-inner, .tr-stopwatch::after,
    .tr-card, .tr-card--mishap, .tr-stamp, .tr-camera-shake, .tr-wimp-key-icon,
    .tr-btn-reveal, .tr-slot-winner.tr-filled, .tr-final-banner, .tr-no-immune,
    .tr-steam, .tr-dot--filled { animation:none !important; }
  }
`;

// ══════════════════════════════════════════════════════════════
// REVEAL ENGINE
// ══════════════════════════════════════════════════════════════

function _trReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`tr-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (el.dataset.cameraShake === '1') {
      el.classList.remove('tr-camera-shake');
      void el.offsetWidth;
      el.classList.add('tr-camera-shake');
      setTimeout(() => el.classList.remove('tr-camera-shake'), 450);
    }
    if (el.dataset.fillSlot) {
      const slot = document.getElementById(`tr-slot-${stateKey}-${el.dataset.fillSlot}`);
      if (slot) {
        slot.innerHTML = el.dataset.slotHtml || '';
        slot.classList.add('tr-filled');
        slot.classList.remove('tr-pending');
      }
    }
    if (el.dataset.fillDot) {
      const parts = el.dataset.fillDot.split('-');
      const pairId = parts[0], slotIdx = parts[1];
      const dot = document.getElementById(`tr-dot-${stateKey}-${slotIdx}-${pairId}`);
      if (dot) dot.classList.add('tr-dot--filled');
    }
  }
  const btn = document.getElementById(`tr-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`tr-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
    } else {
      btn.textContent = `▶ NEXT BEAT (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _trRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`tr-step-${stateKey}-${i}`);
    if (el) {
      el.style.display = '';
      if (el.dataset.fillSlot) {
        const slot = document.getElementById(`tr-slot-${stateKey}-${el.dataset.fillSlot}`);
        if (slot) { slot.innerHTML = el.dataset.slotHtml || ''; slot.classList.add('tr-filled'); slot.classList.remove('tr-pending'); }
      }
      if (el.dataset.fillDot) {
        const parts = el.dataset.fillDot.split('-');
        const pairId = parts[0], slotIdx = parts[1];
        const dot = document.getElementById(`tr-dot-${stateKey}-${slotIdx}-${pairId}`);
        if (dot) dot.classList.add('tr-dot--filled');
      }
    }
  }
  const ctrl = document.getElementById(`tr-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
// EVENT RENDERER
// ══════════════════════════════════════════════════════════════

const _taRpPortrait = (name, size) =>
  (typeof window !== 'undefined' && window.rpPortrait) ?
    window.rpPortrait(name, size) :
    `<span style="font-size:10px;color:#e6e6e6">[${name}]</span>`;

function _renderPairBanner(pair, broken = false, hero = false) {
  if (!pair) return '';
  const [a, b] = pair.members;
  const size = hero ? 'md' : 'sm';
  const heroClass = hero ? ' tr-pair-banner--hero' : '';
  const brokenClass = broken ? ' tr-pair-banner--broken' : '';
  let h = `<div class="tr-pair-banner${heroClass}${brokenClass}">`;
  h += `<div class="tr-pair-portrait">${_taRpPortrait(a, size)}<div class="tr-pair-name">${a}</div></div>`;
  h += `<div class="tr-chain">`;
  h += `<span class="tr-chain-link"></span>`;
  h += `<span class="tr-chain-link tr-chain-link-mid"></span>`;
  h += `<span class="tr-chain-link"></span>`;
  h += `</div>`;
  h += `<div class="tr-pair-portrait">${_taRpPortrait(b, size)}<div class="tr-pair-name">${b}</div></div>`;
  h += `</div>`;
  return h;
}

function _htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _renderSlotWinner(evt, tri) {
  const pair = tri.pairs.find(p => p.id === evt.pairId);
  if (!pair) return '—';
  return `<span>${pair.members[0]}</span><span class="tr-chain-link" style="margin:0 2px"></span><span>${pair.members[1]}</span>`;
}

function _renderTAStep(evt, tri) {
  const TA_RED = '#cc3333', TA_GREEN = '#5a9f2a', TA_GOLD = '#d4a017',
        TA_PINK = '#d4789a', TA_PURPLE = '#8a3aaa', TA_GRAY = '#6a6a6a';

  if (evt.type === 'chrisIntro') {
    return `<div class="tr-card"><div class="tr-card-label">📢 CHRIS MCLEAN</div><div class="tr-card-body" style="font-style:italic">${evt.text}</div></div>`;
  }

  if (evt.type === 'pairingReveal') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    let h = `<div class="tr-card" style="--tr-accent:#c8310a">`;
    h += `<div class="tr-card-label">🎲 PAIRING · PAIR ${(evt.pairId || 0) + 1}</div>`;
    h += _renderPairBanner(pair, false, true); // hero banner (#20)
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  if (evt.type === 'handcuffed') {
    const chemLabel = (evt.bond || 0) >= 3 ? 'ALLIES' : (evt.bond || 0) <= -3 ? 'RIVALS' : 'STRANGERS';
    const chemColor = (evt.bond || 0) >= 3 ? TA_GREEN : (evt.bond || 0) <= -3 ? TA_RED : TA_GRAY;
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    let h = `<div class="tr-card" style="--tr-accent:${chemColor}">`;
    h += `<div class="tr-card-label">⛓️ CUFFED · ${chemLabel}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-card-body">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // Wimp key: full-width establishing card + per-pair decisions (#16)
  if (evt.type === 'wimpKeyOffer') {
    const n = (evt.offerIndex || 0) + 1;
    let h = `<div class="tr-wimp-key-screen">`;
    h += `<span class="tr-wimp-key-icon">🗝️</span>`;
    h += `<div class="tr-wimp-key-title">THE WIMP KEY</div>`;
    h += `<div class="tr-wimp-key-sub">OFFER #${n} · TAKE IT AND LOSE ALL CLAIM TO INVINCIBILITY</div>`;
    h += `</div>`;
    (evt.decisions || []).forEach(d => {
      const pair = tri.pairs.find(p => p.id === d.pairId);
      h += `<div class="tr-card tr-card--wimp" style="margin-top:4px">`;
      if (pair) h += _renderPairBanner(pair, d.taken, true); // hero banner (#20)
      h += `<div style="text-align:center;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:${d.taken ? TA_RED : TA_GREEN};margin:4px 0">${d.taken ? '🔓 TAKEN' : '✋ REFUSED'}</div>`;
      h += `</div>`;
    });
    return h;
  }

  if (evt.type === 'wimpKeyTaken') {
    return `<div class="tr-card tr-card--wimp"><div class="tr-card-label">🔓 OUT OF THE RUNNING</div><div class="tr-card-body">${evt.text}</div><div style="margin-top:6px"><span class="tr-stamp" style="color:${TA_RED}">WIMPED</span></div></div>`;
  }

  // Chowdown setpiece card (#14)
  if (evt.type === 'chowdownSetup') {
    let h = `<div class="tr-card tr-card--chowdown tr-card--setpiece">`;
    h += `<div class="tr-card-label">🍽️ CHALLENGE 1 · COMPETITIVE CHOWDOWN</div>`;
    h += `<div style="display:flex;justify-content:center;gap:16px;margin:10px 0">`;
    h += `<div class="tr-platter">🍽️<div class="tr-steam">~</div></div>`;
    h += `<div class="tr-platter tr-platter--green">🍗<div class="tr-steam tr-steam--green">~</div></div>`;
    h += `<div class="tr-platter">🍽️<div class="tr-steam">~</div></div>`;
    h += `</div>`;
    h += `<div class="tr-card-body">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  if (evt.type === 'chowdownEvent') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const isMishap = evt.subtype === 'vomit' || evt.subtype === 'grossOut';
    const cardClass = isMishap ? 'tr-card tr-card--mishap tr-card--chowdown' : 'tr-card tr-card--chowdown';
    const subtypeLabel = (evt.rdSubtype || evt.subtype || '').toUpperCase();
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">🍽️ CHOWDOWN · ${subtypeLabel} · PAIR ${(evt.pairId || 0) + 1}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText && evt.badgeClass !== 'neutral') {
      const bc = evt.badgeClass === 'red' ? TA_RED : TA_GREEN;
      h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${bc}">${evt.badgeText}</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  if (evt.type === 'chowdownWin' || evt.type === 'idolWin' || evt.type === 'totemWin') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const labelMap = { chowdownWin: '🏆 CHOWDOWN WON', idolWin: '🏆 IDOL HAUL WON', totemWin: '🏆 TOTEM POLE WON' };
    let h = `<div class="tr-card" style="--tr-accent:${TA_GOLD};border-color:${TA_GOLD}">`;
    h += `<div class="tr-card-label">${labelMap[evt.type]}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px;text-align:center">${evt.text}</div>`;
    h += `<div style="text-align:center;margin-top:6px"><span class="tr-stamp" style="color:${TA_GOLD}">FIRST!</span></div>`;
    h += `</div>`;
    return h;
  }

  // Cave approach setpiece (#15)
  if (evt.type === 'caveApproach') {
    return `<div class="tr-card tr-card--cave"><div class="tr-card-label">🕸️ BONEY ISLAND · CAVE OF TREACHEROUS TERROR</div><div class="tr-card-body" style="font-style:italic">${evt.text}</div></div>`;
  }

  if (evt.type && evt.type.startsWith('idol')) {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const phaseLabel = { canoe: '🚣 CANOE', find: '📦 IDOL', piggyback: '🏃 PIGGYBACK', cave: '🕷️ CAVE' }[evt.phase] || (evt.phase || '').toUpperCase() || 'IDOL';
    const isMishap = evt.badgeClass === 'red';
    const cardClass = isMishap ? 'tr-card tr-card--mishap tr-card--idol' : 'tr-card tr-card--idol';
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">${phaseLabel} · PAIR ${(evt.pairId || 0) + 1}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText) {
      h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${isMishap ? TA_RED : TA_GREEN}">${evt.badgeText}</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  if (evt.type === 'totemSetup') {
    return `<div class="tr-card tr-card--totem"><div class="tr-card-label">🗿 CHALLENGE 3 · TOTEM POLE OF SHAME</div><div class="tr-card-body">${evt.text}</div></div>`;
  }

  if (evt.type === 'totemEvent') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const isMishap = evt.subtype === 'breakdown' || evt.subtype === 'confusion';
    const cardClass = isMishap ? 'tr-card tr-card--mishap tr-card--totem' : 'tr-card tr-card--totem';
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">🗿 TOTEM · ${(evt.subtype || '').toUpperCase()} · PAIR ${(evt.pairId || 0) + 1}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText) {
      const bColor = evt.badgeClass === 'red' ? TA_RED : evt.badgeClass === 'pink' ? TA_PINK : TA_GREEN;
      h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${bColor}">${evt.badgeText}</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  // Totem visualization (#18)
  if (evt.type === 'totemResult') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    let h = `<div class="tr-card tr-card--totem">`;
    h += `<div class="tr-card-label">🗿 TOTEM ATTEMPT · PAIR ${(evt.pairId || 0) + 1} · ${evt.isWinner ? '✅ CORRECT' : '❌ ERROR'}</div>`;
    if (pair) h += _renderPairBanner(pair);
    h += `<div class="tr-totem-stack">`;
    const stack = evt.stack || [];
    const correct = evt.correctStack || stack;
    // Display top-to-bottom (last eliminated = top)
    for (let i = stack.length - 1; i >= 0; i--) {
      const isTop = i === stack.length - 1;
      const ok = correct[i] === stack[i];
      h += `<div class="tr-totem-head${ok ? '' : ' tr-totem-head--wrong'}">${isTop ? '👑 ' : ''}${stack[i]}</div>`;
    }
    h += `</div></div>`;
    return h;
  }

  if (evt.type === 'chrisQuip') {
    return `<div class="tr-card"><div class="tr-card-label">📢 CHRIS MCLEAN</div><div class="tr-card-body" style="font-style:italic">${evt.text}</div></div>`;
  }

  // finalRecap: W/L table (#17)
  if (evt.type === 'finalRecap') {
    let h = `<div class="tr-card" style="border-color:${TA_GOLD}">`;
    h += `<div class="tr-card-label">📋 FINAL RECAP</div>`;
    h += `<table class="tr-recap-table">`;
    h += `<thead><tr><th style="text-align:left">PAIR</th><th>CHOW</th><th>IDOL</th><th>TOTEM</th><th>WINS</th></tr></thead>`;
    h += `<tbody>`;
    (evt.pairs || []).forEach(p => {
      h += `<tr>`;
      h += `<td style="text-align:left;font-family:'Courier New',monospace;font-size:10px">${p.members.join(' & ')}${p.wimpKeyTaken ? ' 🔓' : ''}</td>`;
      h += `<td style="color:${p.details.chowdown ? TA_GREEN : TA_GRAY}">${p.details.chowdown ? 'W' : 'L'}</td>`;
      h += `<td style="color:${p.details.idol ? TA_GREEN : TA_GRAY}">${p.details.idol ? 'W' : 'L'}</td>`;
      h += `<td style="color:${p.details.totem ? TA_GREEN : TA_GRAY}">${p.details.totem ? 'W' : 'L'}</td>`;
      h += `<td style="font-weight:900;color:${p.wins >= 2 ? TA_GOLD : TA_GRAY}">${p.wins}</td>`;
      h += `</tr>`;
    });
    h += `</tbody></table></div>`;
    return h;
  }

  // finalTally: animated win-count reveal (#17)
  if (evt.type === 'finalTally') {
    let h = `<div class="tr-card" style="border-color:${TA_GOLD}">`;
    h += `<div class="tr-card-label">🔢 FINAL TALLY</div>`;
    h += `<div class="tr-tally-grid">`;
    (evt.pairs || []).filter(p => !p.wimpKeyTaken).forEach(p => {
      h += `<div class="tr-tally-item">`;
      h += `<div class="tr-tally-names">${p.members[0]}<br>${p.members[1]}</div>`;
      h += `<div class="tr-tally-num${p.wins === 0 ? ' tr-tally-num--zero' : ''}">${p.wins}</div>`;
      h += `</div>`;
    });
    h += `</div></div>`;
    return h;
  }

  // finalOutcome: gold banner or red hazard stripes (#17)
  if (evt.type === 'finalOutcome') {
    let h = '';
    if (evt.tripleTie) {
      h += `<div class="tr-no-immune">`;
      h += `<div class="tr-no-immune-title">NO INVINCIBILITY</div>`;
      h += `<div class="tr-no-immune-sub">ALL THREE PAIRS WIN ONE CHALLENGE · EVERYONE IS VULNERABLE AT TRIBAL</div>`;
      h += `</div>`;
    } else if (evt.winnerPair !== null && evt.winnerPair !== undefined && evt.winnerMembers) {
      const wp = tri.pairs.find(p => p.id === evt.winnerPair);
      h += `<div class="tr-final-banner">`;
      h += `<div class="tr-final-title">🏆 INVINCIBILITY</div>`;
      h += `<div style="margin-top:12px">`;
      if (wp) h += _renderPairBanner(wp, false, true); // hero banner (#20)
      h += `</div>`;
      h += `<div style="font-family:'Courier New',monospace;font-size:10px;color:${TA_GOLD};letter-spacing:2px;margin-top:10px">BOTH MEMBERS ARE IMMUNE TONIGHT</div>`;
      h += `</div>`;
    } else {
      h += `<div class="tr-no-immune">`;
      h += `<div class="tr-no-immune-title">NO WINNER</div>`;
      h += `<div class="tr-no-immune-sub">NO PAIR QUALIFIED FOR INVINCIBILITY · EVERYONE IS VULNERABLE</div>`;
      h += `</div>`;
    }
    return h;
  }

  // Fallback
  return `<div class="tr-card"><div class="tr-card-label">${(evt.type || 'EVENT').toUpperCase()}</div><div class="tr-card-body">${evt.text || ''}</div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER
// ══════════════════════════════════════════════════════════════

export function rpBuildTriArmedTriathlon(ep) {
  const tri = ep.triArmedTriathlon;
  if (!tri?.timeline?.length) return '';

  const stateKey = `tr_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Ticker (#19)
  const tickerLines = [...TICKER_BASE];
  tri.timeline.filter(e => e.type === 'chrisQuip' && e.text).forEach(e =>
    tickerLines.push('CHRIS: ' + String(e.text).slice(0, 70).toUpperCase())
  );
  for (let i = tickerLines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tickerLines[i], tickerLines[j]] = [tickerLines[j], tickerLines[i]];
  }
  const tickerText = tickerLines.join('  ·  ');
  const tickerDoubled = tickerText + '  ·  ' + tickerText;

  // Build steps
  const steps = tri.timeline.map(evt => ({
    evt,
    html: _renderTAStep(evt, tri),
    cameraShake: ['grossOut', 'vomit', 'spider', 'wooly', 'breakdown', 'panic'].includes(evt.subtype) ? 1 : 0,
  }));

  let html = `<style>${TA_STYLES}</style>`;
  html += `<div class="tr-page rp-page">`;

  // Header
  html += `<div class="tr-header">`;
  html += `<div><span class="tr-chain-deco">⛓️</span><span class="tr-title">Trial by Tri-Armed Triathlon</span><span class="tr-chain-deco">⛓️</span></div>`;
  html += `<div class="tr-subtitle">3 CHALLENGES · ${tri.pairs.length} PAIRS · ONE KEY TO FREEDOM</div>`;
  html += `</div>`;

  // Ticker
  html += `<div class="tr-ticker"><div class="tr-ticker-inner">${tickerDoubled}</div></div>`;

  // Sticky scoreboard with pair-progress dots (#12)
  html += `<div class="tr-scoreboard">`;
  ['CHOWDOWN', 'IDOL HAUL', 'TOTEM POLE'].forEach((label, si) => {
    html += `<div class="tr-slot">`;
    html += `<div class="tr-slot-label">🏆 CHALLENGE ${si + 1} · ${label}</div>`;
    html += `<div class="tr-slot-winner tr-pending" id="tr-slot-${stateKey}-${si}">—</div>`;
    html += `<div class="tr-pair-dots">`;
    tri.pairs.forEach(p => {
      html += `<span class="tr-dot" id="tr-dot-${stateKey}-${si}-${p.id}">●</span>`;
    });
    html += `</div>`;
    html += `</div>`;
  });
  html += `<div class="tr-stopwatch">▲</div>`;
  html += `</div>`;

  // Steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const visible = i <= state.idx;
    let slotAttr = '';
    if (s.evt.type === 'chowdownWin') {
      slotAttr = ` data-fill-slot="0" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}" data-fill-dot="${s.evt.pairId}-0"`;
    }
    if (s.evt.type === 'idolWin') {
      slotAttr = ` data-fill-slot="1" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}" data-fill-dot="${s.evt.pairId}-1"`;
    }
    if (s.evt.type === 'totemWin') {
      slotAttr = ` data-fill-slot="2" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}" data-fill-dot="${s.evt.pairId}-2"`;
    }
    html += `<div id="tr-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}"${s.cameraShake ? ' data-camera-shake="1"' : ''}${slotAttr}>${s.html}</div>`;
  }

  // Controls
  const allRevealed = state.idx >= steps.length - 1;
  html += `<div id="tr-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin:12px 0;z-index:3;position:relative'}">`;
  html += `<button class="tr-btn-reveal" id="tr-btn-${stateKey}" onclick="window._trReveal('${stateKey}',${steps.length})">▶ NEXT BEAT (${state.idx + 2}/${steps.length})</button>`;
  html += `<a class="tr-btn-reveal-all" onclick="window._trRevealAll('${stateKey}',${steps.length})">reveal all</a>`;
  html += `</div>`;

  window._trReveal = _trReveal;
  window._trRevealAll = _trRevealAll;

  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════

export function _textTriArmedTriathlon(ep, ln, sec) {
  const tri = ep.triArmedTriathlon;
  if (!tri?.timeline?.length) return;

  sec('TRIAL BY TRI-ARMED TRIATHLON');
  ln('Post-merge challenge. Handcuffed pairs run three sub-challenges: Chowdown, Idol Haul, Totem Pole.');
  ln('');

  sec('PAIRINGS');
  tri.pairs.forEach(p => {
    ln(`  Pair ${p.id + 1}: ${p.members.join(' & ')}${p.wimpKeyTaken ? ' [WIMP KEYED]' : ''}`);
  });
  if (tri.spectator) ln(`  Spectator: ${tri.spectator}`);
  ln('');

  sec('TIMELINE');
  tri.timeline.forEach(evt => {
    if (evt.type === 'chrisIntro' || evt.type === 'chrisQuip') {
      ln(`  [CHRIS] ${evt.text}`);
    } else if (evt.type === 'caveApproach') {
      ln(`  [CAVE APPROACH] ${evt.text}`);
    } else if (evt.type === 'pairingReveal' || evt.type === 'handcuffed') {
      ln(`  [PAIR] ${evt.text}`);
    } else if (evt.type === 'wimpKeyOffer') {
      ln(`  [WIMP OFFER #${(evt.offerIndex || 0) + 1}] ${(evt.decisions || []).filter(d => d.taken).length} pairs took the key`);
    } else if (evt.type === 'wimpKeyTaken') {
      ln(`  [WIMPED] ${evt.text}`);
    } else if (evt.type === 'chowdownSetup' || evt.type === 'totemSetup') {
      ln(`  [SETUP] ${evt.text}`);
    } else if (evt.type === 'chowdownEvent') {
      const sub = evt.rdSubtype || evt.subtype || 'EVENT';
      ln(`  [${sub.toUpperCase()}] ${evt.text}`);
    } else if (evt.type === 'totemEvent') {
      ln(`  [${(evt.subtype || 'EVENT').toUpperCase()}] ${evt.text}`);
    } else if (evt.type && evt.type.startsWith('idol')) {
      ln(`  [${(evt.phase || 'IDOL').toUpperCase()}] ${evt.text}`);
    } else if (evt.type === 'chowdownWin' || evt.type === 'idolWin' || evt.type === 'totemWin') {
      ln(`  [WIN] ${evt.text}`);
    } else if (evt.type === 'totemResult') {
      const label = evt.isWinner ? 'CORRECT' : 'ERROR';
      ln(`  [TOTEM ${label}] Pair ${(evt.pairId || 0) + 1}: [${(evt.stack || []).join(', ')}]`);
    } else if (evt.type === 'finalRecap') {
      ln('');
      sec('FINAL RECAP');
      (evt.pairs || []).forEach(p => {
        const marks = [
          p.details.chowdown ? 'W' : 'L',
          p.details.idol ? 'W' : 'L',
          p.details.totem ? 'W' : 'L',
        ];
        ln(`  ${p.members.join(' & ')}${p.wimpKeyTaken ? ' 🔓' : ''}: ${marks.join(' ')} (${p.wins} wins)`);
      });
    } else if (evt.type === 'finalTally') {
      ln('');
      sec('FINAL TALLY');
      (evt.pairs || []).filter(p => !p.wimpKeyTaken).forEach(p => {
        ln(`  ${p.members.join(' & ')}: ${p.wins} win${p.wins !== 1 ? 's' : ''}`);
      });
    } else if (evt.type === 'finalOutcome') {
      ln('');
      sec('OUTCOME');
      if (evt.tripleTie) {
        ln('  TRIPLE-TIE. NO INVINCIBILITY. EVERYONE VULNERABLE.');
      } else if (evt.winnerMembers) {
        ln(`  INVINCIBILITY: ${(evt.winnerMembers || []).join(' & ')}`);
      } else {
        ln('  NO WINNER — ALL PAIRS WIMP-KEYED OR TIED AT 0.');
      }
    }
  });

  ln('');
  sec('AFTERMATH');
  ln(tri.tripleTie ? (_rp(TA_AFTERMATH_TRIPLE) || '') : (_rp(TA_AFTERMATH_SINGLE) || ''));
}
